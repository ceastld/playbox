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
  const BOMB_CAP = 6;
  const WEB_DELAY = 0.14;
  const HIT_R = 4.6;
  const WPN_MAX = 3;
  const BEST_KEY = 'playbox-soukyugurentai-best';
  const MUTE_KEY = 'playbox-soukyugurentai-mute';
  const OPS = '方向 / WASD 飞 · 空格射击（按住索敌） · C 换阵 · Shift / Z 爆弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const CYN = [61, 180, 255];
  const SKY = [122, 208, 255];
  const GOLD = [255, 227, 107];
  const HOT = [94, 192, 255];
  const WHT = [232, 244, 255];
  const PNK = [255, 154, 196];
  const RED = [255, 90, 122];
  const ORG = [255, 168, 88];
  const CRM = [255, 90, 122];

  const DROP_CYCLE = ['gun', 'bomb', 'gun', 'bomb'];
  const DROP_GLYPH = { gun: '炮', bomb: '爆' };
  const WPN_NAME = ['炮', '炮 Ⅱ', '炮 Ⅲ', '炮 MAX'];

  const FORMS = [
    {
      id: 'fan',
      name: '扇',
      max: 6,
      range: 208,
      half: 1.16,
      dmg: 3,
      rgb: CYN,
      bits: [
        { x: -46, y: -22 },
        { x: 46, y: -22 }
      ]
    },
    {
      id: 'cone',
      name: '锥',
      max: 4,
      range: 318,
      half: 0.36,
      dmg: 6,
      rgb: GOLD,
      bits: [
        { x: 0, y: -50 },
        { x: 0, y: -78 }
      ]
    }
  ];

  const STAGES = [
    {
      name: '第 1 关 · 苍湾',
      short: '苍湾',
      mid: '湾卫',
      boss: '苍塔',
      midHp: 40,
      bossHp: 96,
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 2.6, kind: 'grid' },
        { t: 5.0, kind: 'turret', n: 3 },
        { t: 7.2, kind: 'stream', dir: 1 },
        { t: 9.4, kind: 'dive', n: 4 },
        { t: 11.6, kind: 'silo' },
        { t: 13.8, kind: 'v', n: 6 },
        { t: 16.0, kind: 'wing' },
        { t: 18.2, kind: 'fort' },
        { t: 20.4, kind: 'mid' },
        { t: 26.2, kind: 'grid' },
        { t: 28.4, kind: 'dive', n: 5 },
        { t: 30.6, kind: 'stream', dir: -1 },
        { t: 32.8, kind: 'turret', n: 4 },
        { t: 35.0, kind: 'silo' },
        { t: 37.2, kind: 'v', n: 7 },
        { t: 39.6, kind: 'wing' },
        { t: 42.0, kind: 'fort' },
        { t: 48.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 云栅',
      short: '云栅',
      mid: '栅炮',
      boss: '裂穹',
      midHp: 54,
      bossHp: 128,
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.2, kind: 'grid' },
        { t: 4.2, kind: 'stream', dir: -1 },
        { t: 6.2, kind: 'dive', n: 5 },
        { t: 8.2, kind: 'turret', n: 4 },
        { t: 10.2, kind: 'silo' },
        { t: 12.2, kind: 'wing' },
        { t: 14.2, kind: 'fort' },
        { t: 16.4, kind: 'v', n: 8 },
        { t: 18.4, kind: 'mid' },
        { t: 24.4, kind: 'grid' },
        { t: 26.4, kind: 'dive', n: 6 },
        { t: 28.4, kind: 'stream', dir: 1 },
        { t: 30.4, kind: 'turret', n: 5 },
        { t: 32.4, kind: 'silo' },
        { t: 34.4, kind: 'wing' },
        { t: 36.4, kind: 'v', n: 9 },
        { t: 38.6, kind: 'fort' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 红莲',
      short: '红莲',
      mid: '莲卫',
      boss: '红莲核',
      midHp: 68,
      bossHp: 172,
      waves: [
        { t: 0.4, kind: 'v', n: 9 },
        { t: 1.8, kind: 'grid' },
        { t: 3.6, kind: 'stream', dir: 1 },
        { t: 5.2, kind: 'stream', dir: -1 },
        { t: 7.0, kind: 'dive', n: 6 },
        { t: 8.8, kind: 'turret', n: 5 },
        { t: 10.6, kind: 'silo' },
        { t: 12.4, kind: 'wing' },
        { t: 14.2, kind: 'fort' },
        { t: 16.0, kind: 'mid' },
        { t: 22.0, kind: 'grid' },
        { t: 23.8, kind: 'dive', n: 7 },
        { t: 25.6, kind: 'v', n: 9 },
        { t: 27.4, kind: 'turret', n: 6 },
        { t: 29.2, kind: 'silo' },
        { t: 31.0, kind: 'wing' },
        { t: 32.8, kind: 'stream', dir: 1 },
        { t: 34.4, kind: 'stream', dir: -1 },
        { t: 36.4, kind: 'fort' },
        { t: 51.0, kind: 'boss' }
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
  const btnSky = document.getElementById('btn-sky');
  const btnRain = document.getElementById('btn-rain');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnForm = document.getElementById('btn-form');
  const btnPadBomb = document.getElementById('btn-pad-bomb');
  const btnPadForm = document.getElementById('btn-pad-form');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const formLabel = document.getElementById('form-label');
  const wpnLabel = document.getElementById('wpn-label');
  const bombLabel = document.getElementById('bomb-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const lockWrap = document.getElementById('lock-wrap');
  const lockBar = document.getElementById('lock-bar');

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
  let rumbleT = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const buildings = [];

  const G = {
    mode: 'title',
    kind: 'sky',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: VW * 0.5, y: VH - 90, vx: 0, vy: 0 },
    bits: [
      { x: 0, y: 0, tx: 0, ty: 0 },
      { x: 0, y: 0, tx: 0, ty: 0 }
    ],
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    wpnLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    form: 0,
    formT: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    locks: [],
    lasers: [],
    lockT: 0,
    lockCd: 0,
    fireCd: 0,
    fireHold: false,
    fireHoldT: 0,
    webOn: false,
    fullLock: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    why: '',
    nextBuild: 30
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
  function formSpec() {
    return FORMS[G.form] || FORMS[0];
  }
  function plySpd() {
    return (isRain() ? 312 : 276) + G.wpnLv * 8;
  }
  function scrollSpd() {
    if (hasBig()) return isRain() ? 34 : 26;
    const base = isRain() ? 122 : 88;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isRain() ? 10 : 7);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isRain() ? 168 : 110;
  }
  function hpMul() {
    return isRain() ? 1.22 : 1;
  }
  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].big && G.ents[i].hp > 0) return true;
    }
    return false;
  }
  function livingCount() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) if (G.ents[i].hp > 0) n += 1;
    return n;
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
      this.beep(740 + G.wpnLv * 36, 0.046, 'square', 0.026, 1520);
    },
    webOn() {
      this.ensure();
      this.beep(280, 0.1, 'sine', 0.03, 620);
      this.beep(880, 0.08, 'triangle', 0.022, 1320);
    },
    lockOn(n) {
      this.ensure();
      this.beep(500 + n * 72, 0.05, 'sine', 0.036, 900 + n * 70);
    },
    lockFire(n) {
      this.ensure();
      this.beep(220, 0.13, 'sawtooth', 0.052, 80);
      this.beep(620 + n * 42, 0.16, 'square', 0.042, 1680);
      if (n >= 4) this.beep(1080, 0.2, 'triangle', 0.045, 1640);
    },
    lockHit(i) {
      this.ensure();
      const lift = 1 + i * 0.12;
      this.noise(0.04, 0.036, 1400);
      this.beep(500 * lift, 0.07, 'square', 0.046, 1040 * lift);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.034, 0.03, 1200);
      this.beep(560 * lift, 0.06, 'square', 0.04, 920 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.18 : 0.09, big ? 0.074 : 0.046, big ? 240 : 480);
      this.beep(big ? 170 : 260, big ? 0.24 : 0.13, 'sawtooth', 0.05, 55);
    },
    bomb() {
      this.ensure();
      this.noise(0.28, 0.08, 180);
      this.beep(90, 0.42, 'sawtooth', 0.07, 40);
      this.beep(740, 0.2, 'sine', 0.04, 220);
    },
    form() {
      this.ensure();
      this.beep(360, 0.08, 'sawtooth', 0.036, 720);
      this.beep(980, 0.12, 'triangle', 0.03, 1460);
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
    rumble() {
      this.ensure();
      this.beep(82, 0.07, 'sawtooth', 0.012, 58);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.055, 350);
      this.beep(300, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.3, 'sine', 0.045, 46);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(196, 0.16, 'sawtooth', 0.05, 110);
      this.beep(147, 0.28, 'square', 0.04, 80);
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

  function syncLockBar() {
    const form = formSpec();
    const n = G.locks.length;
    if (lockBar) lockBar.style.transform = 'scaleX(' + (n / form.max) + ')';
    if (lockWrap) {
      lockWrap.classList.toggle('hot', n >= form.max);
      lockWrap.classList.toggle('low', n > 0 && n < 2);
      lockWrap.classList.toggle('web', G.webOn);
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const st = STAGES[G.stage - 1];
      stageLabel.textContent = st ? st.short : '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.stage >= 3 || hasBig());
    }
    if (tagLabel) {
      tagLabel.textContent = isRain() ? '穹雨' : '苍穹';
      tagLabel.classList.toggle('warn', isRain());
      tagLabel.classList.toggle('hot', !isRain() && G.stage >= 3);
    }
    if (formLabel) {
      const f = formSpec();
      formLabel.textContent = f.name;
      formLabel.classList.toggle('cone', f.id === 'cone');
      formLabel.classList.toggle('max', G.webOn);
    }
    if (btnForm) btnForm.classList.toggle('on', formSpec().id === 'cone');
    if (wpnLabel) {
      wpnLabel.textContent = WPN_NAME[G.wpnLv] || '炮';
      wpnLabel.classList.toggle('max', G.wpnLv >= WPN_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (btnBomb) btnBomb.disabled = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或撞机扣一命', 'warn');
    else if (G.mode === 'win') setHint('红莲尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 按住铺网再松开齐射', 'warn');
    else if (G.webOn) setHint('索敌网张开 · 松开齐射追踪激光', 'hot');
    else setHint('按住空格张开索敌网 · C 换扇/锥 · Shift 爆弹', '');
    syncPips();
    syncLockBar();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SKYG';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const end = kind === 'win' || kind === 'lose';
    if (ovStart) ovStart.classList.toggle('gone', end);
    if (ovEnd) ovEnd.classList.toggle('gone', !end);
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isRain() ? '换模式' : '穹雨';
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

  function kickForm() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('form');
    void stageEl.offsetWidth;
    stageEl.classList.add('form');
    setTimeout(function () {
      if (stageEl) stageEl.classList.remove('form');
    }, 240);
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
    capArr(sparks, 48);
    capArr(rings, 32);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.65,
      size: gold ? 22 : 15, gold: !!gold, vy: gold ? -92 : -70
    });
    capArr(floats, 32);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -190 * p, vx1: 190 * p, vy0: -240 * p, vy1: 100 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.6 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.16 + p * 0.12);
    kick(2.2 + p * 2.6);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 78; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.3, 1.5),
        a: rand(0.16, 0.72)
      });
    }
  }

  function seedBuildings() {
    buildings.length = 0;
    for (let i = 0; i < 14; i++) spawnBuilding(-40 - i * 58);
  }

  function spawnBuilding(y) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const w = rand(22, 48);
    const h = rand(36, 96);
    const x = side < 0 ? rand(16, 86) : rand(VW - 86, VW - 16);
    buildings.push({
      x: x, y: y, w: w, h: h,
      hue: hash2((G.scroll + y) | 0),
      win: 2 + ((hash2(((G.scroll + y) * 5) | 0) * 4) | 0),
      neon: hash2(((G.scroll + y) * 9) | 0) > 0.55
    });
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
    if (G.combo > 0 && G.combo % 3 === 0) {
      floatText(G.player.x, G.player.y - 48, G.combo + ' 链', GOLD, true);
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

  function addShot(s) {
    G.shots.push(s);
    capArr(G.shots, 80);
  }

  function addEShot(s) {
    G.eShots.push(s);
    capArr(G.eShots, shotCap());
  }

  function addEnt(en) {
    G.ents.push(en);
  }

  function nextDrop() {
    const k = DROP_CYCLE[G.dropI % DROP_CYCLE.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vx: rand(-40, 40), vy: 42,
      kind: kind, t: 0, r: 12
    });
    capArr(G.pows, 12);
  }

  function bitTargets() {
    const f = formSpec();
    const px = G.player.x;
    const py = G.player.y;
    for (let i = 0; i < 2; i++) {
      const b = f.bits[i];
      G.bits[i].tx = px + b.x;
      G.bits[i].ty = py + b.y;
    }
  }

  function snapBits() {
    bitTargets();
    for (let i = 0; i < 2; i++) {
      G.bits[i].x = G.bits[i].tx;
      G.bits[i].y = G.bits[i].ty;
    }
  }

  function swapForm() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.formT > 0) return;
    G.form = G.form === 0 ? 1 : 0;
    G.formT = 0.22;
    bitTargets();
    pruneLocks(true);
    audio.form();
    flashForm();
    kickForm();
    hitStop(0.034);
    screenFlash(formSpec().rgb, 0.18);
    toast(formSpec().name + '阵', false, formSpec().id === 'cone');
    emit(10, {
      x: G.player.x, y: G.player.y - 20, j: 18,
      vx0: -160, vx1: 160, vy0: -180, vy1: 40,
      life: 0.22, r0: 1, r1: 2.4, rgb: formSpec().rgb, g: 0
    });
    syncHud();
  }

  function inWeb(en) {
    if (!en || en.hp <= 0) return false;
    const f = formSpec();
    const dx = en.x - G.player.x;
    const dy = G.player.y - 10 - en.y;
    if (dy < 12) return false;
    const dist = hypot(dx, dy);
    if (dist > f.range + (en.r || 12)) return false;
    const ang = Math.atan2(dx, dy);
    return Math.abs(ang) <= f.half;
  }

  function lockedOf(en) {
    for (let i = 0; i < G.locks.length; i++) {
      if (G.locks[i] === en) return true;
    }
    return false;
  }

  function pruneLocks(dropOut) {
    for (let i = G.locks.length - 1; i >= 0; i--) {
      const en = G.locks[i];
      if (!en || en.hp <= 0 || en.y > VH + 24 || en.y < -50) {
        G.locks.splice(i, 1);
        continue;
      }
      if (dropOut && !inWeb(en)) G.locks.splice(i, 1);
    }
    for (let i = 0; i < G.locks.length; i++) G.locks[i].lockI = i;
    if (G.locks.length < formSpec().max) G.fullLock = false;
    syncLockBar();
  }

  function acquireLock(dt) {
    pruneLocks(false);
    if (G.mode !== 'play' || G.deadT > 0 || !G.webOn) return;
    const f = formSpec();
    if (G.locks.length >= f.max) {
      G.lockT = 0;
      if (!G.fullLock) {
        G.fullLock = true;
        toast('满锁 ' + f.max, false, true);
        audio.lockOn(f.max);
        screenFlash(GOLD, 0.2);
      }
      return;
    }
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      if (lockedOf(en)) continue;
      if (!inWeb(en)) continue;
      const dx = en.x - G.player.x;
      const dy = G.player.y - en.y;
      const d = dx * dx + dy * dy * 0.55 - (en.big ? 4000 : 0);
      if (d < bd) {
        bd = d;
        best = en;
      }
    }
    if (!best) {
      G.lockT = 0;
      return;
    }
    const haste = 0.082 - Math.min(0.028, G.combo * 0.002);
    G.lockT += dt;
    if (G.lockT >= haste) {
      G.lockT = 0;
      G.locks.push(best);
      best.lockI = G.locks.length - 1;
      audio.lockOn(G.locks.length);
      popSpark(best.x, best.y, GOLD, 10);
      floatText(best.x, best.y - 16, String(G.locks.length), GOLD, false);
      syncLockBar();
    }
  }

  function fireVulcan() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.webOn) return;
    if (G.fireCd > 0) return;
    const lv = G.wpnLv;
    const x = G.player.x;
    const y = G.player.y - 14;
    G.muzzle = 0.05;
    G.fireCd = 0.108 - lv * 0.012;
    const spd = -680;
    const rgb = lv >= 2 ? GOLD : WHT;
    function fan(ox, oy, vx, vy) {
      addShot({ x: x + ox, y: y + oy, vx: vx || 0, vy: vy == null ? spd : vy, r: 3.1, rgb: rgb, dmg: 1 });
    }
    if (lv <= 0) {
      fan(-5, 1);
      fan(5, 1);
    } else if (lv === 1) {
      fan(-10, 3, -48, spd);
      fan(0, -2);
      fan(10, 3, 48, spd);
    } else if (lv === 2) {
      fan(-12, 4, -90, spd);
      fan(-5, 0);
      fan(5, 0);
      fan(12, 4, 90, spd);
    } else {
      fan(-14, 5, -110, spd);
      fan(-6, 1, -36, spd);
      fan(0, -3);
      fan(6, 1, 36, spd);
      fan(14, 5, 110, spd);
    }
    const bitRgb = formSpec().id === 'cone' ? GOLD : CYN;
    const bitAng = formSpec().id === 'cone' ? 0 : 0.22;
    for (let i = 0; i < 2; i++) {
      const b = G.bits[i];
      const dir = i === 0 ? -1 : 1;
      addShot({
        x: b.x, y: b.y - 6,
        vx: Math.sin(dir * bitAng) * 90,
        vy: spd * 0.92,
        r: 2.4, rgb: bitRgb, dmg: 1
      });
    }
    audio.shoot();
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: GOLD, g: 0
    });
  }

  function fireNals() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    pruneLocks(false);
    if (G.locks.length <= 0) return;
    const chain = G.locks.slice();
    const n = chain.length;
    const f = formSpec();
    G.locks.length = 0;
    G.lockT = 0;
    G.lockCd = 0.28;
    G.fullLock = false;
    syncLockBar();
    audio.lockFire(n);
    hitStop(0.034 + n * 0.008);
    if (n >= 4) {
      toast(n + ' 锁齐射', false, true);
      screenFlash(GOLD, 0.26 + n * 0.04);
      kick(3.2 + n * 0.42);
    } else {
      kick(2.1);
      screenFlash(f.rgb, 0.16);
    }
    const px = G.player.x;
    const py = G.player.y - 12;
    for (let i = 0; i < n; i++) {
      G.lasers.push({
        x: px,
        y: py,
        target: chain[i],
        delay: i * 0.048,
        i: i,
        n: n,
        t: 0,
        hit: false,
        dmg: f.dmg,
        rgb: f.rgb,
        trail: [{ x: px, y: py }]
      });
    }
    capArr(G.lasers, 24);
    if (n >= 3) {
      floatText(px, py - 36, '×' + (1 << Math.min(5, n - 1)), GOLD, true);
    }
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('爆弹用尽', true);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.52;
    G.bombFlash = 0.28;
    G.invuln = Math.max(G.invuln, 0.42);
    audio.bomb();
    hitStop(0.078);
    kick(7.2);
    screenFlash(WHT, 0.55);
    popSpark(G.player.x, G.player.y - 40, GOLD, 46);
    rings.push({ x: G.player.x, y: G.player.y, t: 0, rgb: CYN, r: 80 });
    const cluster = G.webOn && G.locks.length > 0;
    if (cluster) {
      toast('集束', false, true);
      const chain = G.locks.slice();
      for (let i = 0; i < chain.length; i++) {
        const en = chain[i];
        if (!en || en.hp <= 0) continue;
        hurt(en, 10, false);
        juice(en.x, en.y, GOLD, 1.4);
      }
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      emit(3, {
        x: s.x, y: s.y, j: 4,
        vx0: -80, vx1: 80, vy0: -80, vy1: 80,
        life: 0.18, r0: 1, r1: 2.2, rgb: SKY, g: 0
      });
    }
    G.eShots.length = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      if (cluster && lockedOf(en)) continue;
      hurt(en, en.big ? (en.mid ? 10 : 14) : 6, false);
    }
    G.locks.length = 0;
    G.fullLock = false;
    syncHud();
  }

  function baseScore(en) {
    if (en.boss) return 4000 + 1500 * G.stage;
    if (en.mid) return 2000;
    if (en.kind === 'wing') return 180;
    if (en.kind === 'dive') return 100;
    if (en.kind === 'silo') return 300;
    if (en.kind === 'fort') return 280;
    if (en.kind === 'turret') return 150;
    if (en.kind === 'grid') return 70;
    return 50;
  }

  function kill(en, nals, lockI) {
    if (en.hp > -99) en.hp = -99;
    const p = en.big ? 2.2 : 1;
    juice(en.x, en.y, en.rgb || MAG, p);
    audio.boom(!!en.big);
    hitStop(en.big ? 0.072 : 0.034);
    bumpCombo();
    let pts = Math.round(baseScore(en) * G.mult);
    if (nals) {
      const step = 100 * Math.pow(2, Math.min(7, lockI || 0));
      pts = Math.round(step * G.mult);
    }
    addScore(pts);
    floatText(en.x, en.y - 8, '+' + pts, nals ? GOLD : WHT, nals && (lockI || 0) >= 2);
    if (en.drop) spawnPow(en.x, en.y, en.drop);
    else if (en.kind === 'silo' || en.kind === 'wing') spawnPow(en.x, en.y, nextDrop());
    if (en.boss) {
      addScore(1500 * G.stage);
      G.stageClearT = 2.05;
      toast(en.name + ' 击破', false, true);
    } else if (en.mid) {
      toast(en.name + ' 击破', false, true);
    }
  }

  function hurt(en, dmg, nals, lockI) {
    if (!en || en.hp <= 0) return;
    en.hp -= dmg;
    en.flash = 0.08;
    if (en.hp <= 0) {
      kill(en, nals, lockI);
      return;
    }
    if (nals) {
      const step = Math.round(100 * Math.pow(2, Math.min(7, lockI || 0)) * G.mult * 0.18);
      addScore(step);
    }
    audio.hit(G.combo);
    hitStop(0.022);
    emit(4, {
      x: en.x, y: en.y, j: 5,
      vx0: -90, vx1: 90, vy0: -120, vy1: 40,
      life: 0.16, r0: 1, r1: 2.2, rgb: en.rgb || CYN, g: 200
    });
  }

  function diePlayer() {
    if (G.deadT > 0 || G.invuln > 0 || G.bombT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.webOn = false;
    G.fireHold = false;
    G.fireHoldT = 0;
    G.locks.length = 0;
    G.fullLock = false;
    G.wpnLv = 0;
    spawnPow(G.player.x, G.player.y, 'gun');
    juice(G.player.x, G.player.y, MAG, 2.4);
    audio.death();
    hitStop(0.078);
    kick(8);
    screenFlash(MAG, 0.55);
    G.eShots.length = 0;
    breakCombo();
    syncHud();
    if (stageEl) {
      stageEl.classList.remove('die');
      void stageEl.offsetWidth;
      stageEl.classList.add('die');
    }
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.invuln = 1.55;
    G.webOn = false;
    G.fireHold = false;
    G.fireHoldT = 0;
    snapBits();
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = 'crash';
    audio.lose();
    showOverlay('lose', '舰毁了', '被弹或撞机。R 再来，或换模式。');
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    addScore(isRain() ? 10000 : 8000);
    audio.win();
    toast(isRain() ? '穹雨尽破' : '红莲尽破', false, true);
    showOverlay('win', isRain() ? '穹雨尽破' : '红莲尽破', '三关打穿。再来一局，或换模式。');
    syncHud();
  }

  function aimShot(en, extra) {
    const dx = G.player.x - en.x;
    const dy = G.player.y - en.y;
    const d = Math.max(40, hypot(dx, dy));
    const spd = (isRain() ? 168 : 132) + (extra || 0);
    addEShot({
      x: en.x, y: en.y + 6,
      vx: dx / d * spd, vy: dy / d * spd,
      r: 3.4, rgb: MAG, t: 0
    });
  }

  function ringShot(en, n, spd, rot) {
    const v = spd || 110;
    for (let i = 0; i < n; i++) {
      const a = rot + (TAU * i) / n;
      addEShot({
        x: en.x, y: en.y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        r: 3.2, rgb: G.stage >= 3 ? CRM : MAG, t: 0
      });
    }
  }

  function fanShot(en, n, spread, spd) {
    const base = Math.atan2(G.player.y - en.y, G.player.x - en.x);
    const v = spd || 140;
    for (let i = 0; i < n; i++) {
      const a = base - spread * 0.5 + (n === 1 ? 0 : spread * i / (n - 1));
      addEShot({
        x: en.x, y: en.y + 4,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        r: 3.2, rgb: MAG, t: 0
      });
    }
  }

  function spawnScout(x, y, vx, vy) {
    addEnt({
      kind: 'scout', x: x, y: y, vx: vx || 0, vy: vy == null ? 78 : vy,
      r: 12, hp: 2, rgb: SKY, shotT: rand(0.6, 1.4), phase: rand(0, TAU), ground: false
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 + rand(-60, 60) : cx;
    for (let i = 0; i < n; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const row = Math.floor(i / 2);
      spawnScout(c + side * (18 + row * 22), -20 - row * 26, 0, 82);
    }
  }

  function spawnDive(n) {
    for (let i = 0; i < n; i++) {
      addEnt({
        kind: 'dive', x: rand(50, VW - 50), y: -30 - i * 28,
        vx: 0, vy: 40, r: 14, hp: 3, rgb: ORG,
        shotT: 0.8, phase: 0, dive: false, ground: false
      });
    }
  }

  function spawnStream(dir) {
    const fromL = dir < 0;
    for (let i = 0; i < 6; i++) {
      addEnt({
        kind: 'stream',
        x: fromL ? -20 : VW + 20,
        y: 70 + i * 22,
        vx: (fromL ? 1 : -1) * 150,
        vy: 36,
        r: 11, hp: 2, rgb: HOT,
        shotT: 0.5 + i * 0.12, ground: false
      });
    }
  }

  function spawnGrid() {
    const ox0 = rand(90, VW - 90);
    const cols = 3;
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        addEnt({
          kind: 'grid',
          x: ox0 + (c - 1) * 38,
          y: -24 - r * 34,
          vx: 0, vy: 62,
          r: 11, hp: 2, rgb: CYN,
          shotT: 1.1 + c * 0.15, ground: false,
          gx: c, gy: r
        });
      }
    }
  }

  function spawnTurrets(n) {
    for (let i = 0; i < n; i++) {
      addEnt({
        kind: 'turret', x: 50 + i * ((VW - 100) / Math.max(1, n - 1)), y: -30,
        vx: 0, vy: 0, r: 16, hp: 4, rgb: GOLD,
        shotT: 0.8 + i * 0.2, ground: true, lockT: 0
      });
    }
  }

  function spawnSilo() {
    addEnt({
      kind: 'silo', x: rand(80, VW - 80), y: -36,
      vx: 0, vy: 0, r: 18, hp: 5, rgb: WHT,
      shotT: 1.2, ground: false, drop: nextDrop()
    });
  }

  function spawnWing() {
    addEnt({
      kind: 'wing', x: rand(80, VW - 80), y: -40,
      vx: 0, vy: 48, r: 20, hp: 8, rgb: PNK,
      shotT: 0.7, ground: false, drop: nextDrop()
    });
  }

  function spawnFort() {
    addEnt({
      kind: 'fort', x: rand(90, VW - 90), y: -40,
      vx: 0, vy: 0, r: 22, hp: 8, rgb: CRM,
      shotT: 0.9, ground: true
    });
  }

  function spawnMid() {
    const st = STAGES[G.stage - 1];
    addEnt({
      kind: 'mid', name: st.mid, x: VW * 0.5, y: -50,
      vx: 70, vy: 40, r: 28, hp: Math.round(st.midHp * hpMul()),
      max: Math.round(st.midHp * hpMul()),
      rgb: GOLD, shotT: 0.4, big: true, mid: true, ground: false, phase: 0
    });
    audio.boss();
    toast(st.mid, false, true);
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    addEnt({
      kind: 'boss', name: st.boss, x: VW * 0.5, y: -70,
      vx: 55, vy: 36, r: 36, hp: Math.round(st.bossHp * hpMul()),
      max: Math.round(st.bossHp * hpMul()),
      rgb: G.stage >= 3 ? CRM : CYN, shotT: 0.3,
      big: true, boss: true, ground: false, phase: 0, pattern: 0
    });
    audio.boss();
    toast(st.boss, true, false);
  }

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n || 5);
    else if (w.kind === 'dive') spawnDive(w.n || 4);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'grid') spawnGrid();
    else if (w.kind === 'turret') spawnTurrets(w.n || 3);
    else if (w.kind === 'silo') spawnSilo();
    else if (w.kind === 'wing') spawnWing();
    else if (w.kind === 'fort') spawnFort();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function raidThink() {
    if (G.stageClearT > 0) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      const w = st.waves[G.waveI];
      G.waveI += 1;
      if (w.kind === 'mid' || w.kind === 'boss') {
        if (hasBig()) {
          G.waveI -= 1;
          break;
        }
      }
      fireWave(w);
    }
  }

  function rainThink(dt) {
    raidThink();
    G.spawnT -= dt;
    if (G.spawnT <= 0 && !hasBig() && G.stageClearT <= 0) {
      G.spawnT = 2.6 + rand(0, 0.8);
      if (Math.random() < 0.45) spawnGrid();
      else if (Math.random() < 0.5) spawnStream(Math.random() < 0.5 ? 1 : -1);
      else spawnDive(4);
    }
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
      const d = hypot(dx, dy);
      if (d > 6) {
        const k = Math.min(1, d / 48);
        ax = dx / d * k * 1.15;
        ay = dy / d * k * 1.15;
      }
    }
    const spd = plySpd();
    const len = hypot(ax, ay);
    if (len > 1) {
      ax /= len;
      ay /= len;
    }
    G.player.vx = ax * spd;
    G.player.vy = ay * spd;
    G.player.x = clamp(G.player.x + G.player.vx * dt, 22, VW - 22);
    G.player.y = clamp(G.player.y + G.player.vy * dt, 40, VH - 28);
    bitTargets();
    const k = 1 - Math.exp(-16 * dt);
    for (let i = 0; i < 2; i++) {
      G.bits[i].x = lerp(G.bits[i].x, G.bits[i].tx, k);
      G.bits[i].y = lerp(G.bits[i].y, G.bits[i].ty, k);
    }
    if (G.fireHold) {
      G.fireHoldT += dt;
      if (!G.webOn && G.fireHoldT >= WEB_DELAY) {
        G.webOn = true;
        audio.webOn();
        popSpark(G.player.x, G.player.y - 30, formSpec().rgb, 18);
        syncHud();
      }
    }
  }

  function thinkEnt(en, dt) {
    if (en.hp <= 0) return;
    if (en.flash > 0) en.flash -= dt;
    if (en.kind === 'scout' || en.kind === 'grid') {
      en.y += (en.vy || 78) * dt;
      en.x += Math.sin((en.phase || 0) + G.t * 2.2 + (en.gx || 0)) * 28 * dt;
      en.shotT -= dt;
      if (en.shotT <= 0 && en.y > 40 && en.y < VH - 80) {
        aimShot(en);
        en.shotT = isRain() ? 1.05 : 1.55;
      }
    } else if (en.kind === 'dive') {
      if (!en.dive && en.y > 90) {
        en.dive = true;
        const dx = G.player.x - en.x;
        const dy = G.player.y - en.y;
        const d = Math.max(1, hypot(dx, dy));
        en.vx = dx / d * 220;
        en.vy = dy / d * 220;
        fanShot(en, 3, 0.5, 150);
      }
      en.x += en.vx * dt;
      en.y += en.vy * dt;
      if (!en.dive) en.vy = 48;
    } else if (en.kind === 'stream') {
      en.x += en.vx * dt;
      en.y += en.vy * dt;
      en.shotT -= dt;
      if (en.shotT <= 0) {
        aimShot(en, 20);
        en.shotT = isRain() ? 0.9 : 1.3;
      }
    } else if (en.kind === 'turret' || en.kind === 'fort') {
      en.y += scrollSpd() * dt * 0.92;
      en.shotT -= dt;
      if (en.shotT <= 0 && en.y > 20 && en.y < VH - 40) {
        en.lockT = (en.lockT || 0) + dt;
        aimShot(en, en.kind === 'fort' ? 30 : 0);
        if (en.kind === 'fort') fanShot(en, 3, 0.7, 120);
        en.shotT = isRain() ? 0.95 : 1.35;
      }
    } else if (en.kind === 'silo') {
      en.y += 54 * dt;
      en.x += Math.sin(G.t * 1.4) * 40 * dt;
      en.shotT -= dt;
      if (en.shotT <= 0) {
        fanShot(en, 5, 1.1, 130);
        en.shotT = isRain() ? 1.2 : 1.7;
      }
    } else if (en.kind === 'wing') {
      en.y += en.vy * dt;
      en.x += Math.sin(G.t * 1.6) * 70 * dt;
      en.shotT -= dt;
      if (en.shotT <= 0) {
        fanShot(en, 3, 0.55, 150);
        en.shotT = isRain() ? 0.85 : 1.2;
      }
    } else if (en.kind === 'mid' || en.kind === 'boss') {
      thinkBoss(en, dt);
    }
    if (en.y > VH + 50 && !en.big) en.hp = 0;
    if ((en.kind === 'stream' || en.kind === 'dive') && (en.x < -50 || en.x > VW + 50)) en.hp = 0;
  }

  function thinkBoss(en, dt) {
    if (en.y < 128) {
      en.y += 70 * dt;
      return;
    }
    en.y = lerp(en.y, 136, 1 - Math.pow(0.08, dt));
    en.x += en.vx * dt;
    if (en.x < 70 || en.x > VW - 70) en.vx *= -1;
    en.x = clamp(en.x, 70, VW - 70);
    const low = en.hp / en.max < 0.38;
    en.shotT -= dt;
    if (en.shotT > 0) return;
    en.pattern = (en.pattern || 0) + 1;
    if (en.mid) {
      if (en.pattern % 3 === 0) ringShot(en, 10, 108, G.t);
      else fanShot(en, low ? 6 : 4, 0.9, 150);
      en.shotT = isRain() ? 0.55 : 0.72;
      return;
    }
    const id = G.stage;
    if (id === 1) {
      if (en.pattern % 4 === 0) ringShot(en, low ? 14 : 10, 100, G.t);
      else fanShot(en, low ? 7 : 5, 1.05, 155);
      en.shotT = isRain() ? 0.48 : 0.64;
    } else if (id === 2) {
      ringShot(en, low ? 16 : 12, 96, G.t * 1.4);
      if (en.pattern % 2 === 0) aimShot(en, 40);
      en.shotT = isRain() ? 0.46 : 0.6;
    } else {
      ringShot(en, low ? 12 : 8, 110, G.t);
      ringShot(en, low ? 10 : 8, 78, G.t + 0.4);
      if (en.pattern % 3 === 0) fanShot(en, 5, 0.7, 170);
      en.shotT = isRain() ? 0.42 : 0.56;
    }
  }

  function updateEnts(dt) {
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      thinkEnt(en, dt);
      if (en.hp <= 0 && en.hp !== -99) {
        G.ents.splice(i, 1);
      } else if (en.hp === -99) {
        G.ents.splice(i, 1);
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -20 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        const rr = (en.r || 12) + s.r;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        if (dx * dx + dy * dy < rr * rr) {
          hurt(en, s.dmg || 1, false);
          emit(3, {
            x: s.x, y: s.y, j: 3,
            vx0: -50, vx1: 50, vy0: -40, vy1: 40,
            life: 0.12, r0: 1, r1: 2, rgb: s.rgb, g: 0
          });
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
      s.t += dt;
      if (s.y < -30 || s.y > VH + 30 || s.x < -30 || s.x > VW + 30) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        const dx = s.x - G.player.x;
        const dy = s.y - G.player.y;
        if (dx * dx + dy * dy < (HIT_R + s.r) * (HIT_R + s.r)) {
          G.eShots.splice(i, 1);
          diePlayer();
        }
      }
    }
  }

  function updateLasers(dt) {
    for (let i = G.lasers.length - 1; i >= 0; i--) {
      const L = G.lasers[i];
      L.t += dt;
      if (L.t < L.delay) continue;
      const en = L.target;
      const tx = en && en.hp > 0 ? en.x : L.x;
      const ty = en && en.hp > 0 ? en.y : L.y - 40;
      const dx = tx - L.x;
      const dy = ty - L.y;
      const d = Math.max(1, hypot(dx, dy));
      const spd = 820;
      L.x += dx / d * spd * dt;
      L.y += dy / d * spd * dt;
      L.trail.push({ x: L.x, y: L.y });
      if (L.trail.length > 10) L.trail.shift();
      if (!L.hit && en && en.hp > 0 && hypot(en.x - L.x, en.y - L.y) < (en.r || 12) + 10) {
        L.hit = true;
        audio.lockHit(L.i);
        hurt(en, L.dmg, true, L.i);
        juice(en.x, en.y, L.rgb || GOLD, 0.85 + L.i * 0.12);
        G.lasers.splice(i, 1);
        continue;
      }
      if (L.t > L.delay + 0.7 || L.y < -40) G.lasers.splice(i, 1);
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 18 * dt;
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (p.y > VH + 20) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = p.x - G.player.x;
        const dy = p.y - G.player.y;
        if (dx * dx + dy * dy < 28 * 28) {
          if (p.kind === 'gun') {
            if (G.wpnLv < WPN_MAX) {
              G.wpnLv += 1;
              toast(WPN_NAME[G.wpnLv], false, G.wpnLv >= WPN_MAX);
            } else {
              addScore(Math.round(500 * G.mult));
              toast('满炮 +500', false, true);
            }
            flashWpn();
          } else {
            if (G.bombs < BOMB_CAP) G.bombs += 1;
            else addScore(Math.round(300 * G.mult));
            toast('爆 ×' + G.bombs, false, true);
          }
          audio.pow();
          popSpark(p.x, p.y, GOLD, 16);
          if (stageEl) {
            stageEl.classList.remove('pow');
            void stageEl.offsetWidth;
            stageEl.classList.add('pow');
          }
          G.pows.splice(i, 1);
          syncHud();
        }
      }
    }
  }

  function collidePlayer() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.bombT > 0) return;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0 || en.ground) continue;
      const rr = (en.r || 12) * 0.7 + HIT_R;
      const dx = en.x - G.player.x;
      const dy = en.y - G.player.y;
      if (dx * dx + dy * dy < rr * rr) {
        diePlayer();
        return;
      }
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.8);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.bombFlash > 0) G.bombFlash -= dt;
    if (G.formT > 0) G.formT -= dt;
    if (G.toastT > 0) G.toastT -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
  }

  function updateWorld(dt) {
    const sp = scrollSpd();
    G.scroll += sp * dt;
    for (let i = 0; i < stars.length; i++) {
      stars[i].y += (28 + stars[i].z * 70) * dt;
      if (stars[i].y > VH + 4) {
        stars[i].y = -4;
        stars[i].x = rand(0, VW);
      }
    }
    for (let i = buildings.length - 1; i >= 0; i--) {
      buildings[i].y += sp * dt * 0.85;
      if (buildings[i].y > VH + 20) buildings.splice(i, 1);
    }
    G.nextBuild -= sp * dt;
    if (G.nextBuild <= 0) {
      spawnBuilding(-80);
      G.nextBuild = rand(46, 78);
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      snapBits();
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingCount() < 10) {
        if (Math.random() < 0.45) spawnGrid();
        else spawnV(5, VW * 0.5 + Math.sin(G.t) * 40);
        G.spawnT = 2.4;
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
    if (G.lockCd > 0) G.lockCd -= dt;
    if (G.bombT > 0) G.bombT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    rumbleT -= dt;
    if (rumbleT <= 0 && G.deadT <= 0) {
      rumbleT = 0.09;
      audio.rumble();
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
        G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
        G.invuln = Math.max(G.invuln, 0.85);
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0) acquireLock(dt);

    if (isRain()) rainThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updateLasers(dt);
    updatePows(dt);
    collidePlayer();
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#081428');
      g.addColorStop(0.45, '#07101e');
      g.addColorStop(1, '#061018');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#180814');
      g.addColorStop(0.5, '#0c1020');
      g.addColorStop(1, '#061018');
    } else {
      g.addColorStop(0, '#082038');
      g.addColorStop(0.5, '#071420');
      g.addColorStop(1, '#061018');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vpX = VW * 0.5;
    const vpY = 28;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    ctx.strokeStyle = rgba(G.stage >= 3 ? CRM : CYN, G.stage === 3 ? 0.14 : 0.11);
    ctx.lineWidth = 1 * scale;
    for (let i = -8; i <= 8; i++) {
      ctx.beginPath();
      ctx.moveTo(sx(vpX + i * 6), sy(vpY));
      ctx.lineTo(sx(vpX + i * 78), sy(VH + 8));
      ctx.stroke();
    }
    for (let k = 0; k < 16; k++) {
      const t = ((k / 16) + (G.scroll * 0.00055)) % 1;
      const y = vpY + t * t * (VH - vpY + 20);
      const w = 18 + t * t * (VW * 1.15);
      ctx.strokeStyle = rgba(SKY, 0.04 + t * 0.08);
      ctx.beginPath();
      ctx.moveTo(sx(vpX - w * 0.5), sy(y));
      ctx.lineTo(sx(vpX + w * 0.5), sy(y));
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = 'rgba(180,220,255,' + s.a + ')';
      ctx.fillRect(sx(s.x), sy(s.y), Math.max(1, s.z * scale), Math.max(1, s.z * 1.5 * scale));
    }

    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      const depth = clamp((b.y + 40) / VH, 0.15, 1);
      const x = sx(b.x - b.w * 0.5 * (0.7 + depth * 0.3));
      const y = sy(b.y);
      const w = b.w * (0.7 + depth * 0.3) * scale;
      const h = b.h * scale;
      ctx.fillStyle = 'rgba(8, 18, 32, ' + (0.72 + depth * 0.2) + ')';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = rgba(b.neon ? (G.stage >= 3 ? CRM : GOLD) : CYN, 0.16 + b.hue * 0.16);
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = rgba(b.neon ? GOLD : CYN, 0.18 + depth * 0.12);
      const cols = Math.max(1, b.win);
      const cw = w / (cols + 1);
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < 4; r++) {
          ctx.fillRect(x + cw * (c + 0.45), y + h * (0.12 + r * 0.2), Math.max(1.6, 2.6 * scale), Math.max(1.8, 3 * scale));
        }
      }
    }
  }

  function drawNals() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const f = formSpec();
    const px = G.player.x;
    const py = G.player.y - 8;
    const active = G.webOn;
    const pulse = active ? 0.55 + Math.sin(G.t * 10) * 0.12 : 0.16;
    const rgb = f.rgb;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx(px), sy(py));
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const a = -f.half + (2 * f.half * i) / steps - Math.PI / 2;
      ctx.lineTo(sx(px + Math.cos(a) * f.range), sy(py + Math.sin(a) * f.range));
    }
    ctx.closePath();
    ctx.fillStyle = rgba(rgb, active ? 0.09 : 0.03);
    ctx.fill();
    ctx.strokeStyle = rgba(rgb, pulse);
    ctx.lineWidth = (active ? 1.6 : 1) * scale;
    ctx.stroke();

    ctx.strokeStyle = rgba(rgb, pulse * 0.7);
    ctx.lineWidth = 1 * scale;
    for (let i = 0; i <= 8; i++) {
      const a = -f.half + (2 * f.half * i) / 8 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(sx(px), sy(py));
      ctx.lineTo(sx(px + Math.cos(a) * f.range), sy(py + Math.sin(a) * f.range));
      ctx.stroke();
    }
    const ringsN = 5;
    for (let k = 1; k <= ringsN; k++) {
      const t = k / ringsN;
      const wob = active ? (Math.sin(G.t * 6 + k) * 0.012) : 0;
      const rr = f.range * (t + wob);
      ctx.beginPath();
      ctx.arc(sx(px), sy(py), rr * scale, -Math.PI / 2 - f.half, -Math.PI / 2 + f.half);
      ctx.strokeStyle = rgba(rgb, (active ? 0.22 : 0.08) * (1.1 - t));
      ctx.stroke();
    }
    if (active) {
      ctx.strokeStyle = rgba(WHT, 0.18);
      ctx.setLineDash([4 * scale, 6 * scale]);
      ctx.beginPath();
      ctx.arc(sx(px), sy(py), f.range * 0.55 * scale, -Math.PI / 2 - f.half, -Math.PI / 2 + f.half);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawLocks() {
    if (G.locks.length <= 0) return;
    const px = G.player.x;
    const py = G.player.y - 8;
    for (let i = 0; i < G.locks.length; i++) {
      const en = G.locks[i];
      if (!en || en.hp <= 0) continue;
      const sz = 10 + (en.big ? 8 : 0) + Math.sin(G.t * 12 + i) * 1.2;
      ctx.save();
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.setLineDash([5 * scale, 4 * scale]);
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(px), sy(py));
      ctx.lineTo(sx(en.x), sy(en.y));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 1.6 * scale;
      ctx.strokeRect(sx(en.x - sz), sy(en.y - sz), sz * 2 * scale, sz * 2 * scale);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = '700 ' + Math.max(10, 11 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(i + 1), sx(en.x), sy(en.y - sz - 2));
      ctx.restore();
    }
  }

  function drawShip(x, y, a) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.player.vx * 0.0015);
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.shadowColor = rgba(CYN, 0.6);
    ctx.shadowBlur = 12;
    const flash = G.muzzle > 0;
    ctx.fillStyle = flash ? '#f4fbff' : rgba(WHT, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(5, -2);
    ctx.lineTo(13, 4);
    ctx.lineTo(4, 3);
    ctx.lineTo(5, 12);
    ctx.lineTo(0, 8);
    ctx.lineTo(-5, 12);
    ctx.lineTo(-4, 3);
    ctx.lineTo(-13, 4);
    ctx.lineTo(-5, -2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.fillRect(-1.3, -10, 2.6, 10);
    ctx.fillStyle = rgba(CRM, 0.92);
    ctx.fillRect(-10, 2, 5, 2.2);
    ctx.fillRect(5, 2, 5, 2.2);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.moveTo(-3, 10);
    ctx.lineTo(0, 16);
    ctx.lineTo(3, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBit(b) {
    ctx.save();
    ctx.translate(sx(b.x), sy(b.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = rgba(formSpec().rgb, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 2);
    ctx.lineTo(0, 5);
    ctx.lineTo(-4.5, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.fillRect(-1, -3, 2, 5);
    ctx.restore();
  }

  function drawEnt(en) {
    if (en.hp <= 0) return;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.globalAlpha = en.flash > 0 ? 0.55 + Math.sin(G.t * 40) * 0.35 : 1;
    const rgb = en.rgb || SKY;
    if (en.boss || en.mid) {
      const w = en.boss ? 52 : 38;
      const h = en.boss ? 36 : 26;
      ctx.fillStyle = rgba(rgb, 0.92);
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.7);
      ctx.lineTo(w * 0.5, -h * 0.15);
      ctx.lineTo(w * 0.42, h * 0.45);
      ctx.lineTo(0, h * 0.35);
      ctx.lineTo(-w * 0.42, h * 0.45);
      ctx.lineTo(-w * 0.5, -h * 0.15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(-6, -10, 12, 14);
      ctx.fillStyle = rgba(CRM, 0.9);
      ctx.fillRect(-w * 0.35, 4, 8, 4);
      ctx.fillRect(w * 0.35 - 8, 4, 8, 4);
      const ratio = clamp(en.hp / en.max, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-w * 0.4, -h * 0.85, w * 0.8, 4);
      ctx.fillStyle = rgba(ratio < 0.35 ? MAG : GOLD, 0.95);
      ctx.fillRect(-w * 0.4, -h * 0.85, w * 0.8 * ratio, 4);
    } else if (en.kind === 'turret' || en.kind === 'fort') {
      const s = en.kind === 'fort' ? 18 : 13;
      ctx.fillStyle = rgba([18, 32, 48], 0.92);
      ctx.fillRect(-s, -s * 0.4, s * 2, s * 1.1);
      ctx.strokeStyle = rgba(rgb, 0.9);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-s, -s * 0.4, s * 2, s * 1.1);
      ctx.fillStyle = rgba(rgb, 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.35, 0, TAU);
      ctx.fill();
    } else if (en.kind === 'silo') {
      ctx.fillStyle = rgba(rgb, 0.9);
      ctx.beginPath();
      ctx.moveTo(-14, 10);
      ctx.lineTo(-10, -12);
      ctx.lineTo(10, -12);
      ctx.lineTo(14, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(-5, -6, 10, 8);
    } else if (en.kind === 'wing') {
      ctx.fillStyle = rgba(rgb, 0.92);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(18, 6);
      ctx.lineTo(8, 4);
      ctx.lineTo(0, 12);
      ctx.lineTo(-8, 4);
      ctx.lineTo(-18, 6);
      ctx.closePath();
      ctx.fill();
    } else if (en.kind === 'dive') {
      ctx.fillStyle = rgba(rgb, 0.94);
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(10, -8);
      ctx.lineTo(0, -4);
      ctx.lineTo(-10, -8);
      ctx.closePath();
      ctx.fill();
    } else if (en.kind === 'grid') {
      ctx.fillStyle = rgba(rgb, 0.92);
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 9);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(rgb, 0.94);
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(8, -6);
      ctx.lineTo(0, -2);
      ctx.lineTo(-8, -6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), s.r * 0.7 * scale, s.r * 1.6 * scale, 0, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * 0.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawLasers() {
    for (let i = 0; i < G.lasers.length; i++) {
      const L = G.lasers[i];
      if (L.t < L.delay) continue;
      ctx.save();
      ctx.strokeStyle = rgba(L.rgb || CYN, 0.85);
      ctx.lineWidth = 2.4 * scale;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      const tr = L.trail;
      for (let k = 0; k < tr.length; k++) {
        if (k === 0) ctx.moveTo(sx(tr[k].x), sy(tr[k].y));
        else ctx.lineTo(sx(tr[k].x), sy(tr[k].y));
      }
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.7);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(sx(L.x), sy(L.y), 3.2 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = p.kind === 'gun' ? GOLD : CYN;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.rotate(p.t * 2.2);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(rgb, 0.9);
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#061018';
      ctx.font = '700 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(DROP_GLYPH[p.kind] || '?', 0, 0.5);
      ctx.restore();
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), Math.max(0.6, p.r * scale), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = 1 - s.t / 0.28;
      ctx.strokeStyle = rgba(s.rgb, k);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * (0.4 + s.t * 3) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = 1 - r.t / 0.4;
      ctx.strokeStyle = rgba(r.rgb, k * 0.8);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 180) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const k = 1 - f.t / f.life;
      ctx.save();
      ctx.globalAlpha = k;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = '700 ' + Math.max(11, f.size * scale * 0.7) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (f.gold) {
        ctx.shadowColor = rgba(GOLD, 0.8);
        ctx.shadowBlur = 12;
      }
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#061018';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const shx = G.shake > 0 && !REDUCE ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake > 0 && !REDUCE ? rand(-G.shake, G.shake) * 0.6 : 0;
    ctx.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    drawWorld();

    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawNals();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawShots();
    drawLasers();
    drawLocks();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0;
      if (!blink) {
        drawBit(G.bits[0]);
        drawBit(G.bits[1]);
        drawShip(G.player.x, G.player.y, 1);
      }
    }

    drawFx();

    if (G.flash > 0 && !REDUCE) {
      ctx.fillStyle = rgba(G.flashRgb || WHT, G.flash);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.bombFlash > 0 && !REDUCE) {
      ctx.fillStyle = rgba(WHT, G.bombFlash * 0.55);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }

    ctx.restore();
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
    G.locks.length = 0;
    G.lasers.length = 0;
    buildings.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'rain' ? 'rain' : 'sky';
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
    G.wpnLv = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.form = 0;
    G.formT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.fireCd = 0;
    G.lockCd = 0;
    G.lockT = 0;
    G.fireHold = false;
    G.fireHoldT = 0;
    G.webOn = false;
    G.fullLock = false;
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
    G.nextBuild = 28;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedStars();
    seedBuildings();
    snapBits();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isRain() ? '穹雨 · 更密更快' : '苍穹 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'sky';
    G.stage = 1;
    G.lives = LIVES;
    G.bombs = 3;
    G.wpnLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bombT = 0;
    G.webOn = false;
    G.form = 0;
    G.locks.length = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedStars();
    seedBuildings();
    snapBits();
    showOverlay('title', '苍穹', '按住空格张开三维索敌网，松开齐射追踪激光。C 切换扇 / 锥阵。撞了扣命。短关之后是红莲核。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('sky');
    else startGame(G.kind || 'sky');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('sky');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('rain');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isRain()) goTitle();
      else startGame('rain');
    }
  }

  function releaseFire() {
    if (G.webOn) fireNals();
    G.webOn = false;
    G.fireHold = false;
    G.fireHoldT = 0;
    G.fullLock = false;
    syncHud();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isBomb = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const isForm = k === 'c' || k === 'C' || k === 'x' || k === 'X' || k === 'f' || k === 'F' || k === 'Tab';
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

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

    if (down && (isMove || space || isBomb || isForm || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) releaseFire();
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
    if (isForm) {
      if (!e.repeat) swapForm();
      return;
    }
    if (isBomb) {
      if (!e.repeat) tryBomb();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space && G.mode === 'play') {
          G.fireHold = true;
          G.fireHoldT = 0;
          fireVulcan();
        }
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        if (!e.repeat) {
          G.fireHoldT = 0;
          fireVulcan();
        }
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
      G.fireHoldT = 0;
      if (G.mode === 'play') fireVulcan();
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
      releaseFire();
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) releaseFire();
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

  if (btnSky) {
    btnSky.addEventListener('click', function () {
      audio.ensure();
      startGame('sky');
    });
  }
  if (btnRain) {
    btnRain.addEventListener('click', function () {
      audio.ensure();
      startGame('rain');
    });
  }
  if (ovRetry) {
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'sky');
    });
  }
  if (ovModes) {
    ovModes.addEventListener('click', function () {
      secondaryAction();
    });
  }
  if (btnRetry) {
    btnRetry.addEventListener('click', function () {
      restart();
    });
  }
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnBomb) {
    btnBomb.addEventListener('click', function () {
      tryBomb();
    });
  }
  if (btnForm) {
    btnForm.addEventListener('click', function () {
      swapForm();
    });
  }
  if (btnPadBomb) {
    btnPadBomb.addEventListener('click', function () {
      tryBomb();
    });
  }
  if (btnPadForm) {
    btnPadForm.addEventListener('click', function () {
      swapForm();
    });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    releaseFire();
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = keys.u = keys.d = false;
      releaseFire();
    }
  });

  requestAnimationFrame(frame);
})();
