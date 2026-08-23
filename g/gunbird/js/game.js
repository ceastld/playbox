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
  const PWR_MAX = 3;
  const BEST_KEY = 'playbox-gunbird-best';
  const MUTE_KEY = 'playbox-gunbird-mute';
  const AUTO_SPEED_KEY = 'playbox-gunbird-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.48, 0.72, 1, 2.55];
  const OPS = '方向 / WSD 移动 · 空格开火 · Shift / Z 爆弹 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 110];
  const CYN = [0, 232, 212];
  const SKY = [122, 244, 232];
  const GOLD = [255, 227, 107];
  const COR = [255, 107, 61];
  const WHT = [255, 244, 232];
  const PNK = [255, 154, 180];
  const RED = [255, 86, 96];
  const ORG = [255, 160, 72];
  const VIO = [180, 92, 255];

  const HERO_NAME = { spread: '羽散', laser: '钢翼' };
  const DROP_GLYPH = { pwr: '羽', bomb: '爆' };

  const STAGES = [
    {
      name: '第 1 关 · 羽镇',
      mid: '石狮',
      boss: '羽神',
      midHp: 38,
      bossHp: 92,
      waves: [
        { t: 0.9, kind: 'flock', n: 5 },
        { t: 3.4, kind: 'stream', dir: 1 },
        { t: 6.2, kind: 'flock', n: 7 },
        { t: 8.8, kind: 'pagodas' },
        { t: 11.2, kind: 'courier' },
        { t: 13.6, kind: 'dive', n: 4 },
        { t: 16.0, kind: 'armor' },
        { t: 18.8, kind: 'flock', n: 7 },
        { t: 21.2, kind: 'mid' },
        { t: 26.4, kind: 'stream', dir: -1 },
        { t: 29.0, kind: 'wisps' },
        { t: 31.6, kind: 'courier' },
        { t: 34.0, kind: 'dive', n: 5 },
        { t: 36.6, kind: 'armor' },
        { t: 39.2, kind: 'pagodas' },
        { t: 42.0, kind: 'flock', n: 9 },
        { t: 47.5, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 沙海',
      mid: '铁驼',
      boss: '金甲',
      midHp: 50,
      bossHp: 124,
      waves: [
        { t: 0.7, kind: 'flock', n: 7 },
        { t: 3.0, kind: 'dive', n: 5 },
        { t: 5.4, kind: 'stream', dir: -1 },
        { t: 8.0, kind: 'pagodas' },
        { t: 10.2, kind: 'armor' },
        { t: 12.4, kind: 'courier' },
        { t: 14.8, kind: 'wisps' },
        { t: 17.2, kind: 'armor' },
        { t: 19.6, kind: 'mid' },
        { t: 25.0, kind: 'stream', dir: 1 },
        { t: 27.4, kind: 'dive', n: 6 },
        { t: 29.8, kind: 'armor' },
        { t: 32.0, kind: 'pagodas' },
        { t: 34.4, kind: 'flock', n: 9 },
        { t: 37.0, kind: 'courier' },
        { t: 39.6, kind: 'wisps' },
        { t: 42.4, kind: 'armor' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 云阙',
      mid: '殿卫',
      boss: '枪鸟',
      midHp: 64,
      bossHp: 168,
      waves: [
        { t: 0.5, kind: 'flock', n: 9 },
        { t: 2.6, kind: 'stream', dir: 1 },
        { t: 4.4, kind: 'stream', dir: -1 },
        { t: 6.6, kind: 'dive', n: 6 },
        { t: 8.8, kind: 'armor' },
        { t: 10.6, kind: 'courier' },
        { t: 12.8, kind: 'wisps' },
        { t: 15.0, kind: 'pagodas' },
        { t: 17.2, kind: 'armor' },
        { t: 19.0, kind: 'mid' },
        { t: 24.6, kind: 'dive', n: 7 },
        { t: 26.8, kind: 'armor' },
        { t: 28.6, kind: 'armor' },
        { t: 30.8, kind: 'flock', n: 11 },
        { t: 33.2, kind: 'courier' },
        { t: 35.4, kind: 'stream', dir: 1 },
        { t: 37.2, kind: 'wisps' },
        { t: 39.6, kind: 'pagodas' },
        { t: 42.0, kind: 'armor' },
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
  const ovChars = document.getElementById('ov-chars');
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnRaid = document.getElementById('btn-raid');
  const btnStorm = document.getElementById('btn-storm');
  const btnSpread = document.getElementById('btn-spread');
  const btnLaser = document.getElementById('btn-laser');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPad = document.getElementById('btn-pad');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const heroLabel = document.getElementById('hero-label');
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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const feathers = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    hero: 'spread',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: VW * 0.5, y: VH - 90, vx: 0, vy: 0 },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    pwr: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    beamT: 0,
    beamTick: 0,
    phoenixT: 0,
    phoenixTick: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    bits: [],
    isles: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: COR,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    why: '',
    nextIsle: 40
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoTx = VW * 0.5;
  let autoTy = VH - 90;
  let autoStickS = -1e9;
  let autoOvWait = 0;

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
  function isLaser() {
    return G.hero === 'laser';
  }
  function heroRgb() {
    return isLaser() ? CYN : GOLD;
  }
  function plySpd() {
    return (isDense() ? 318 : 276) + G.pwr * 10;
  }
  function scrollSpd() {
    if (hasBig()) return isDense() ? 36 : 28;
    const base = isDense() ? 118 : 86;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isDense() ? 10 : 8);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isDense() ? 150 : 96;
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
    shoot(kind) {
      this.ensure();
      if (kind === 'laser') this.beep(920, 0.07, 'sawtooth', 0.034, 380);
      else this.beep(740, 0.05, 'square', 0.03, 1680);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.038, 0.034, 1200);
      this.beep(560 * lift, 0.068, 'square', 0.044, 980 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.18 : 0.09, big ? 0.074 : 0.046, big ? 240 : 480);
      this.beep(big ? 170 : 260, big ? 0.24 : 0.13, 'sawtooth', 0.05, 55);
    },
    bomb(kind) {
      this.ensure();
      this.noise(0.28, 0.08, 180);
      if (kind === 'laser') {
        this.beep(70, 0.48, 'sawtooth', 0.075, 36);
        this.beep(880, 0.22, 'square', 0.04, 220);
      } else {
        this.beep(220, 0.36, 'sine', 0.06, 880);
        this.beep(660, 0.28, 'triangle', 0.045, 220);
      }
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

  function pwrText() {
    const n = isLaser() ? '刃' : '羽';
    if (G.pwr >= PWR_MAX) return n + ' MAX';
    if (G.pwr <= 0) return n;
    return n + ' ' + ['', 'Ⅱ', 'Ⅲ', 'Ⅳ'][G.pwr];
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

  function syncHeroBtns() {
    const spr = G.hero === 'spread';
    if (btnSpread) {
      btnSpread.classList.toggle('on', spr);
      btnSpread.setAttribute('aria-pressed', spr ? 'true' : 'false');
    }
    if (btnLaser) {
      btnLaser.classList.toggle('on', !spr);
      btnLaser.setAttribute('aria-pressed', spr ? 'false' : 'true');
    }
  }

  function setHero(h) {
    G.hero = h === 'laser' ? 'laser' : 'spread';
    syncHeroBtns();
    syncHud();
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
      tagLabel.textContent = isDense() ? '密弹' : '空战';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    if (heroLabel) {
      heroLabel.textContent = HERO_NAME[G.hero] || '羽散';
      heroLabel.classList.toggle('laser', isLaser());
    }
    if (pwrLabel) {
      pwrLabel.textContent = pwrText();
      pwrLabel.classList.toggle('laser', isLaser());
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
    if (autoOn && (G.mode === 'play' || G.mode === 'title')) setHint('托管中 · A 停下', 'hot');
    else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) setHint('托管中 · R 重开接着打', 'hot');
    else if (G.mode === 'title') setHint('C 换角色 · 1 空战 · 2 密弹 · ' + OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或撞机扣一命', 'warn');
    else if (G.mode === 'win') setHint('枪鸟尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 爆弹清屏', 'warn');
    else setHint('方向移动 · 空格开火 · Shift 爆弹 · A 自动 · 捡 羽/爆', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GBRD';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const isTitle = kind === 'title';
    if (ovChars) ovChars.classList.toggle('gone', !isTitle);
    if (ovStart) ovStart.classList.toggle('gone', !isTitle);
    if (ovEnd) ovEnd.classList.toggle('gone', isTitle);
    if (!isTitle && ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else ovModes.textContent = isDense() ? '换模式' : '密弹';
    }
    syncHeroBtns();
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
    capArr(particles, 360);
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

  function seedStars() {
    stars.length = 0;
    feathers.length = 0;
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.4),
        a: rand(0.18, 0.7)
      });
    }
    for (let i = 0; i < 18; i++) {
      feathers.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.5, 1.2),
        a: rand(0.12, 0.4),
        s: rand(0.6, 1.6)
      });
    }
  }

  function seedIsles() {
    G.isles.length = 0;
    for (let i = 0; i < 7; i++) spawnIsle(-50 - i * 110);
  }

  function spawnIsle(y) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const w = rand(34, 78);
    const h = rand(16, 34);
    const x = side < 0 ? rand(18, 92) : rand(VW - 92, VW - 18);
    G.isles.push({
      x: x, y: y, w: w, h: h,
      hue: hash2((G.scroll + y) | 0),
      roofs: 1 + ((hash2(((G.scroll + y) * 3) | 0) * 3) | 0)
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
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function spawnEnt(spec) {
    if (G.ents.length > 52) return null;
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

  function spawnSparrow(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'sparrow',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 96,
      hp: 1, r: 10, score: 50,
      rgb: extra.rgb || MAG,
      dive: extra.dive,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.9, 2.4)
    });
  }

  function spawnFlock(n, xmid) {
    n = n || 7;
    xmid = xmid == null ? VW * 0.5 + rand(-36, 36) : xmid;
    const gapX = 26;
    const gapY = 20;
    const y0 = -24;
    spawnSparrow(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnSparrow(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnSparrow(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = 6 + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnSparrow(side + rand(-8, 8), -20 - i * 24, {
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
        type: 'kite',
        x: x, y: -30 - i * 16,
        vx: 0, vy: 64,
        hp: 1, r: 11, score: 100,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnArmor(x) {
    spawnEnt({
      type: 'armor',
      x: x == null ? rand(80, VW - 80) : x,
      y: -40,
      vx: rand(-28, 28),
      vy: 52,
      hp: 4, r: 18, score: 200,
      rgb: RED,
      drop: Math.random() < 0.34,
      w: 38, h: 22,
      fireCd: rand(0.35, 0.8)
    });
  }

  function spawnCourier() {
    spawnEnt({
      type: 'courier',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 78,
      hp: 2, r: 13, score: 300,
      rgb: GOLD,
      drop: 'cycle',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnPagoda(x, y) {
    spawnEnt({
      type: 'pagoda',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 3, r: 13, score: 150,
      rgb: ORG,
      ground: true,
      w: 24, h: 22,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnPagodaWave() {
    const n = isDense() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnPagoda(clamp(x, 40, VW - 40), -24 - i * 18);
    }
  }

  function spawnWisps() {
    const n = 5 + (Math.random() * 3) | 0;
    const side = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'wisp',
        x: side < 0 ? 36 : VW - 36,
        y: -18 - i * 22,
        vx: side * 40,
        vy: 88,
        hp: 1, r: 8, score: 80,
        rgb: VIO,
        phase: side,
        fireCd: rand(0.8, 1.6)
      });
    }
  }

  function hpMul() {
    return isDense() ? 1.22 : 1;
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.midHp * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -60,
      vx: 62,
      vy: 46,
      hp: hp,
      r: 32,
      score: 2000,
      rgb: VIO,
      drop: 'bomb',
      w: 72,
      h: 36,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(VIO, 0.36);
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
      vx: 70,
      vy: 44,
      hp: hp,
      r: 44,
      score: 4000 + G.stage * 1500,
      rgb: MAG,
      drop: 'cycle',
      w: 98,
      h: 46,
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

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'flock') spawnFlock(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'armor') spawnArmor();
    else if (w.kind === 'courier') spawnCourier();
    else if (w.kind === 'pagodas') spawnPagodaWave();
    else if (w.kind === 'wisps') spawnWisps();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function nextDropKind() {
    const cycle = ['pwr', 'pwr', 'bomb'];
    const k = cycle[G.dropI % cycle.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    kind = kind || nextDropKind();
    if (kind === 'cycle') kind = nextDropKind();
    G.pows.push({
      x: x, y: y, vy: 64, t: 0,
      vx: rand(-38, 38),
      kind: kind === 'bomb' ? 'bomb' : 'pwr'
    });
    capArr(G.pows, 7);
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
    if (G.shots.length > 96) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      kind: spec.kind || 'spread',
      pierce: spec.pierce || 0,
      dmg: spec.dmg || 1
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.pwr;
    const x = G.player.x;
    const y = G.player.y - 14;
    G.muzzle = 0.05;
    if (isLaser()) {
      G.fireCd = 0.118 - lv * 0.012;
      const pierce = 1 + lv;
      const rgb = CYN;
      const gap = 8 + lv * 2;
      const n = lv <= 0 ? 1 : lv === 1 ? 2 : 3;
      if (n === 1) {
        addShot({ x: x, y: y, vy: -820, r: 3.6, rgb: rgb, kind: 'laser', pierce: pierce, dmg: 1 });
      } else if (n === 2) {
        addShot({ x: x - 7, y: y, vy: -820, r: 3.4, rgb: rgb, kind: 'laser', pierce: pierce, dmg: 1 });
        addShot({ x: x + 7, y: y, vy: -820, r: 3.4, rgb: rgb, kind: 'laser', pierce: pierce, dmg: 1 });
      } else {
        addShot({ x: x, y: y - 2, vy: -840, r: 4.2, rgb: rgb, kind: 'laser', pierce: pierce + 1, dmg: 1 });
        addShot({ x: x - gap, y: y, vy: -800, r: 3.4, rgb: rgb, kind: 'laser', pierce: pierce, dmg: 1 });
        addShot({ x: x + gap, y: y, vy: -800, r: 3.4, rgb: rgb, kind: 'laser', pierce: pierce, dmg: 1 });
        if (lv >= 3) {
          addShot({ x: x - gap * 1.6, y: y + 4, vx: -70, vy: -760, r: 3.0, rgb: SKY, kind: 'laser', pierce: pierce, dmg: 1 });
          addShot({ x: x + gap * 1.6, y: y + 4, vx: 70, vy: -760, r: 3.0, rgb: SKY, kind: 'laser', pierce: pierce, dmg: 1 });
        }
      }
    } else {
      G.fireCd = 0.112 - lv * 0.016;
      const spd = -660;
      function fan(ox, oy, vx, vy) {
        addShot({
          x: x + ox, y: y + oy,
          vx: vx || 0, vy: vy == null ? spd : vy,
          r: 3.2, rgb: lv >= 2 ? GOLD : WHT, kind: 'spread', dmg: 1
        });
      }
      if (lv <= 0) {
        fan(-5, 1);
        fan(5, 1);
      } else if (lv === 1) {
        fan(-10, 3, -80, spd);
        fan(0, -2);
        fan(10, 3, 80, spd);
      } else if (lv === 2) {
        fan(-16, 5, -120, spd);
        fan(-7, 1, -44, spd);
        fan(0, -3);
        fan(7, 1, 44, spd);
        fan(16, 5, 120, spd);
      } else {
        fan(-18, 6, -140, spd);
        fan(-10, 2, -70, spd);
        fan(-4, -2);
        fan(4, -2);
        fan(10, 2, 70, spd);
        fan(18, 6, 140, spd);
      }
    }
    audio.shoot(G.hero);
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: heroRgb(),
      g: 0
    });
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
    G.bombFlash = 0.55;
    G.invuln = Math.max(G.invuln, 0.55);
    audio.bomb(G.hero);
    screenFlash(isLaser() ? CYN : GOLD, 0.78);
    popSpark(G.player.x, G.player.y, heroRgb(), 48);
    rings.push({ x: G.player.x, y: G.player.y, t: 0, rgb: GOLD, r: 22 });
    rings.push({ x: VW * 0.5, y: VH * 0.42, t: 0, rgb: heroRgb(), r: 40 });
    emit(28, {
      x: G.player.x, y: G.player.y, j: 18,
      vx0: -280, vx1: 280, vy0: -320, vy1: 220,
      life: 0.52, r0: 1.6, r1: 4.2, rgb: heroRgb(), g: 40
    });
    hitStop(0.078);
    kick(7.4);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      emit(2, {
        x: s.x, y: s.y, j: 2,
        vx0: -50, vx1: 50, vy0: -50, vy1: 50,
        life: 0.14, r0: 1, r1: 2.2, rgb: WHT, g: 0
      });
    }
    G.eShots.length = 0;
    const dmgBoss = isLaser() ? 16 : 14;
    const dmgMid = isLaser() ? 12 : 10;
    const dmgN = isLaser() ? 7 : 6;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dmg = en.type === 'boss' ? dmgBoss : en.type === 'mid' ? dmgMid : dmgN;
      hurtEnt(en, dmg, en.x, en.y);
    }
    if (isLaser()) {
      G.beamT = 0.62;
      G.beamTick = 0;
      toast('钢炮', false, true);
    } else {
      G.phoenixT = 0.72;
      G.phoenixTick = 0;
      toast('凤凰', false, true);
      for (let k = 0; k < 10; k++) {
        G.bits.push({
          x: rand(24, VW - 24),
          y: -8 - k * 10,
          vx: rand(-40, 40),
          vy: rand(240, 380),
          r: 4.2,
          rgb: GOLD,
          life: 1.1,
          dmg: 2
        });
      }
    }
    syncHud();
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
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.type === 'armor' ? 1.25 : 0.85;
    juice(en.x, en.y, en.rgb, pwr);
    audio.hit(G.combo);
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.drop === 'cycle' || en.drop === true) spawnPow(en.x, en.y, nextDropKind());
    else if (en.drop === 'bomb') spawnPow(en.x, en.y, 'bomb');
    else if (en.drop) spawnPow(en.x, en.y, en.drop);
    else if (en.type === 'armor' && Math.random() < 0.2) spawnPow(en.x, en.y, nextDropKind());
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(1500 * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      toast(STAGES[G.stage - 1] ? STAGES[G.stage - 1].name.replace(/^第 \d 关 · /, '') + '肃清' : '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        toast('爆弹 +1', false, true);
      } else {
        addScore(800 * G.mult);
        toast('+800', false, true);
      }
    } else {
      if (G.pwr < PWR_MAX) {
        G.pwr += 1;
        toast((isLaser() ? '刃' : '羽') + (G.pwr >= PWR_MAX ? ' MAX' : ' 强化'), false, true);
      } else {
        addScore(500 * G.mult);
        toast('+500', false, true);
      }
      flashPwr();
    }
    juice(p.x, p.y, p.kind === 'bomb' ? WHT : heroRgb(), 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, DROP_GLYPH[p.kind] || '羽', p.kind === 'bomb' ? WHT : heroRgb(), true);
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.bombT = 0;
    G.beamT = 0;
    G.phoenixT = 0;
    G.bits.length = 0;
    breakCombo();
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
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
    autoTx = G.player.x;
    autoTy = G.player.y;
    autoStickS = -1e9;
    if (autoOn) G.fireHold = true;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '舰毁了';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function winGame() {
    addScore(8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '枪鸟尽破', (isDense() ? '密弹通关' : '三关打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function livingCount() {
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
    G.spawnT = clamp(1.55 / (1 + G.stage * 0.12), 0.42, 1.55);
    if (livingCount() > 26) return;
    const r = Math.random();
    if (r < 0.32) spawnFlock(5 + (Math.random() * 6) | 0);
    else if (r < 0.5) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.66) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.78) spawnArmor();
    else if (r < 0.88) spawnCourier();
    else spawnWisps();
  }

  function bossFire(en, dense) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += dense ? 0.22 : 0.16;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 16, dense ? 210 : 176, VIO);
      eShot(en.x - 18, en.y + 10, -46, 186, PNK);
      eShot(en.x + 18, en.y + 10, 46, 186, PNK);
      if (mid) ringShot(en.x, en.y, dense ? 10 : 8, 150, en.spin, VIO, 3.2);
      if (low) {
        aimShot(en.x - 22, en.y + 8, 200, MAG);
        aimShot(en.x + 22, en.y + 8, 200, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 18, 214, MAG);
      eShot(en.x - 26, en.y + 12, -50, 196, RED);
      eShot(en.x + 26, en.y + 12, 50, 196, RED);
      if (mid) ringShot(en.x, en.y + 6, dense ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 42, 208, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, dense ? 14 : 11, 146, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 8, dense ? 10 : 8, 118, -en.spin * 1.4, VIO, 3.0);
        aimShot(en.x, en.y + 16, 200, GOLD);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 220, RED);
        aimShot(en.x + 28, en.y + 10, 220, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 6, dense ? 16 : 12, 152, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 6, dense ? 10 : 8, 108, -en.spin * 0.7, CYN, 2.8);
      if (mid) {
        aimShot(en.x - 20, en.y + 14, 210, PNK);
        aimShot(en.x + 20, en.y + 14, 210, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, dense ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (dense) en.fireCd *= 0.78;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0 || G.bombT > 0 || G.beamT > 0 || G.phoenixT > 0;
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
      if (en.ground) {
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
      } else if (en.type === 'courier') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'kite') {
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
      } else if (en.type === 'sparrow') {
        if (!en.dive && en.t > 1.28 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.28) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 92, dt * 2);
          en.vy = Math.max(en.vy, 154);
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'armor') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < 46 || en.x > VW - 46) en.vx *= -1;
      } else if (en.type === 'wisp') {
        en.x += Math.sin(en.t * 3.2) * en.phase * 70 * dt;
        en.y += en.vy * dt;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 52 || en.x < -64 || en.x > VW + 64 || (en.ground && en.y > VH + 42)) {
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && en.y > -10 && en.y < VH + 10) {
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          if (en.type === 'sparrow' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, dense ? 198 : 172, MAG);
            if (dense && Math.random() < 0.45) aimShot(en.x, en.y + 8, 168, PNK);
            en.fireCd = (dense ? 1.35 : 2.35) + rand(0, 0.55);
          } else if (en.type === 'armor') {
            eShot(en.x - 9, en.y + 12, -34, 176, RED);
            eShot(en.x, en.y + 14, 0, 196, RED);
            eShot(en.x + 9, en.y + 12, 34, 176, RED);
            if (dense) aimShot(en.x, en.y + 10, 186, ORG);
            en.fireCd = dense ? 0.72 : 1.05;
          } else if (en.type === 'pagoda' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 214 : 174, GOLD);
            if (dense) {
              eShot(en.x - 8, en.y + 4, -40, 160, ORG);
              eShot(en.x + 8, en.y + 4, 40, 160, ORG);
            }
            en.fireCd = (dense ? 0.78 : 1.16) + rand(0, 0.28);
          } else if (en.type === 'wisp' && en.y > 20 && en.y < VH - 80) {
            eShot(en.x, en.y + 6, 0, dense ? 188 : 160, VIO, 2.7);
            en.fireCd = dense ? 1.1 : 1.7;
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
        if (s.struck && s.struck.indexOf(en) >= 0) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          if (!s.struck) s.struck = [];
          s.struck.push(en);
          hurtEnt(en, s.dmg || 1, s.x, s.y);
          if (s.kind === 'laser') continue;
          if (s.pierce > 0) s.pierce -= 1;
          else hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0 && G.beamT <= 0;
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

  function updateBits(dt) {
    for (let i = G.bits.length - 1; i >= 0; i--) {
      const b = G.bits[i];
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0 || b.y > VH + 20) {
        G.bits.splice(i, 1);
        continue;
      }
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        const dx = en.x - b.x;
        const dy = en.y - b.y;
        const rr = en.r + b.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(en, b.dmg || 1, b.x, b.y);
          emit(3, {
            x: b.x, y: b.y, j: 3,
            vx0: -60, vx1: 60, vy0: -40, vy1: 40,
            life: 0.12, r0: 1, r1: 2, rgb: GOLD, g: 80
          });
          G.bits.splice(i, 1);
          break;
        }
      }
    }
  }

  function updateBombs(dt) {
    if (G.beamT > 0) {
      G.beamT -= dt;
      G.beamTick -= dt;
      if (G.beamTick <= 0) {
        G.beamTick = 0.08;
        const x = G.player.x;
        for (let i = 0; i < G.ents.length; i++) {
          const en = G.ents[i];
          if (en.hp <= 0) continue;
          if (Math.abs(en.x - x) < 30 && en.y < G.player.y + 8) {
            hurtEnt(en, 3, en.x, en.y);
          }
        }
      }
    }
    if (G.phoenixT > 0) {
      G.phoenixT -= dt;
      G.phoenixTick -= dt;
      if (G.phoenixTick <= 0) {
        G.phoenixTick = 0.045;
        G.bits.push({
          x: rand(16, VW - 16),
          y: -10,
          vx: rand(-50, 50),
          vy: rand(260, 420),
          r: 4.4,
          rgb: Math.random() < 0.35 ? COR : GOLD,
          life: 1.15,
          dmg: 2
        });
        capArr(G.bits, 48);
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
    G.nextIsle -= scr * dt;
    if (G.nextIsle <= 0) {
      G.nextIsle = rand(70, 130);
      spawnIsle(-90);
    }
    for (let i = G.isles.length - 1; i >= 0; i--) {
      G.isles[i].y += scr * dt;
      if (G.isles[i].y - G.isles[i].h > VH + 20) G.isles.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += scr * 0.35 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < feathers.length; i++) {
      const f = feathers[i];
      f.y += scr * 0.22 * f.z * dt;
      f.x += Math.sin(G.t * 0.7 + i) * 8 * dt;
      if (f.y > VH + 8) {
        f.y = -8;
        f.x = rand(0, VW);
      }
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
    if (G.bombFlash > 0) G.bombFlash -= dt;
    if (G.toastT > 0) G.toastT -= dt;
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
      if (G.mode === 'title') startGame('raid');
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
        startGame('raid');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.65 : 1.1)) {
        autoOvWait = 0;
        startGame(G.kind || 'raid');
      }
    }
  }

  function autoDanger(x, y, horizon) {
    let d = 0;
    const look = horizon;
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const relx = s.x - x;
      const rely = s.y - y;
      const vv = s.vx * s.vx + s.vy * s.vy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * s.vx + rely * s.vy) / vv, 0, look);
      const dist = hypot(relx + s.vx * t, rely + s.vy * t);
      const rad = 5.4 + s.r;
      if (t <= look && dist < rad + 34) {
        const soon = (look - t) / Math.max(0.08, look);
        d += Math.max(0.5, rad + 12 - dist) * soon * 26;
        if (dist < rad) d += 260 * soon;
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.hp <= 0 || e.ground) continue;
      let evx = e.vx || 0;
      let evy = e.vy || 0;
      if (e.type === 'kite' && e.t > 0.32) {
        const len = hypot(x - e.x, y - e.y) || 1;
        evx = (x - e.x) / len * 178;
        evy = (y - e.y) / len * 178;
      } else if (e.type === 'sparrow' && e.dive) {
        evx = Math.sign(x - e.x) * 92;
        evy = Math.max(e.vy || 0, 154);
      }
      const relx = e.x - x;
      const rely = e.y - y;
      const vv = evx * evx + evy * evy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * evx + rely * evy) / vv, 0, look);
      const dist = hypot(relx + evx * t, rely + evy * t);
      const r = e.type === 'boss' ? e.r * 0.62 : e.type === 'mid' ? e.r * 0.68 : e.r * 0.78;
      const hitR = 4.6 + r;
      if (dist < hitR + 28) {
        const soon = (look - t) / Math.max(0.08, look);
        const w = e.type === 'kite' ? 36 : e.type === 'boss' || e.type === 'mid' ? 14 : 18;
        d += Math.max(0.4, hitR + 14 - dist) * soon * w;
        if (dist < hitR) d += 250 * soon;
      }
      if (hypot(e.x - x, e.y - y) < hitR + 8) d += 120;
    }
    return d;
  }

  function autoThink() {
    if (!autoOn) return;
    if (G.mode !== 'play' || G.deadT > 0) {
      G.fireHold = false;
      return;
    }

    const dense = isDense();
    const horizon = dense ? 0.62 : 0.5;
    let aimX = VW * 0.5;
    let aimY = null;
    let aimW = -1e9;
    let cluster = 0;
    let nearShots = 0;
    let colShots = 0;
    let boss = null;
    let pick = null;
    let pickW = -1e9;

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.hp <= 0) continue;
      if (e.y < -40 || e.y > G.player.y + 18) continue;
      let w = 32;
      if (e.type === 'boss') {
        boss = e;
        w = 280 + e.hp * 0.35;
      } else if (e.type === 'mid') w = 220 + e.hp * 0.4;
      else if (e.type === 'courier') w = 150;
      else if (e.type === 'armor') w = 110;
      else if (e.type === 'kite') w = 88;
      else if (e.type === 'pagoda') w = 64;
      else if (e.type === 'wisp') w = 70;
      else w = 36 + (e.hp || 1) * 8;
      w += (e.hp || 1) * 5;
      w -= Math.abs(e.x - G.player.x) * 0.22;
      w -= Math.max(0, G.player.y - e.y) * 0.05;
      if (e.y > 36 && e.y < G.player.y - 10) w += 24;
      if (w > aimW) {
        aimW = w;
        aimX = e.x;
        aimY = e.y;
      }
    }
    if (aimY != null) {
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.hp <= 0) continue;
        if (Math.abs(e.x - aimX) < 28 && e.y < G.player.y) cluster += 1;
      }
    }

    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const dist = hypot(s.x - G.player.x, s.y - G.player.y);
      if (dist < 140) nearShots += 1;
      if (Math.abs(s.x - G.player.x) < 14 && s.y < G.player.y && s.y > G.player.y - 280) colShots += 1;
    }

    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      if (p.y > VH + 8 || p.x < -8 || p.x > VW + 8) continue;
      let w = 86 - hypot(p.x - G.player.x, p.y - G.player.y) * 0.42;
      if (p.kind === 'pwr' && G.pwr < PWR_MAX) w += G.pwr <= 0 ? 90 : 56;
      else if (p.kind === 'bomb' && G.bombs < BOMB_CAP) w += G.bombs <= 1 ? 70 : 28;
      else w += 18;
      if (p.y > G.player.y - 48) w += 22;
      if (w > pickW) {
        pickW = w;
        pick = p;
      }
    }

    const hereDang = autoDanger(G.player.x, G.player.y, horizon);
    const panic = hereDang > 92 || (G.lives <= 1 && hereDang > 58);
    const thick = nearShots >= (dense ? 6 : 8);
    const grabPick = pick && (G.invuln > 0.18 || autoDanger(pick.x, pick.y, 0.28) < 38 || hypot(pick.x - G.player.x, pick.y - G.player.y) < 72);

    let desiredX = aimY != null ? aimX : VW * 0.5;
    let desiredY = VH - 88;
    if (boss || hasBig()) desiredY = VH - 96;
    if (aimY != null && !panic) {
      desiredY = clamp(aimY + 132, 210, VH - 56);
    }
    if (panic) desiredY = clamp(G.player.y + 32, 240, VH - 32);
    else if (hereDang > 50) desiredY = Math.max(desiredY, VH - 64);
    if (colShots >= 2) desiredY = Math.max(desiredY, VH - 70);
    if (grabPick && pick && !panic) {
      desiredX = pick.x;
      desiredY = clamp(pick.y, 90, VH - 32);
    }

    const xMin = 28;
    const xMax = VW - 28;
    const yMin = 70;
    const yMax = VH - 28;
    let bestX = clamp(autoTx, xMin, xMax);
    let bestY = clamp(autoTy, yMin, yMax);
    let bestS = -1e15;

    function consider(x, y) {
      x = clamp(x, xMin, xMax);
      y = clamp(y, yMin, yMax);
      let s = -autoDanger(x, y, horizon) * (dense ? 7.4 : 6.1);
      s -= Math.abs(x - desiredX) * (boss || cluster >= 3 ? 1.05 : 0.55);
      s -= Math.abs(y - desiredY) * 0.74;
      s -= hypot(x - G.player.x, y - G.player.y) * 0.1;
      if (y < 140) s -= 28;
      if (y > VH - 36) s -= 6;
      if (x < 40 || x > VW - 40) s -= 12;
      if (aimY != null && Math.abs(x - aimX) < 12) s += 24;
      if (grabPick && pick) s -= hypot(x - pick.x, y - pick.y) * 0.52;
      if (s > bestS) {
        bestS = s;
        bestX = x;
        bestY = y;
      }
    }

    consider(G.player.x, G.player.y);
    consider(autoTx, autoTy);
    consider(desiredX, desiredY);
    for (let ix = 0; ix < 9; ix++) {
      const x = 40 + ix * ((VW - 80) / 8);
      for (let iy = 0; iy < 8; iy++) {
        consider(x, 96 + iy * ((VH - 140) / 7));
      }
    }
    if (aimY != null) {
      consider(aimX, desiredY);
      consider(aimX, G.player.y);
      consider(G.player.x, desiredY);
      consider(aimX - 48, desiredY);
      consider(aimX + 48, desiredY);
      consider(aimX, Math.min(VH - 40, aimY + 120));
      consider(aimX, Math.min(VH - 36, aimY + 168));
    }
    if (grabPick && pick) consider(pick.x, pick.y);
    consider(G.player.x - 70, G.player.y);
    consider(G.player.x + 70, G.player.y);
    consider(G.player.x, G.player.y - 56);
    consider(G.player.x, G.player.y + 48);
    consider(G.player.x - 36, G.player.y - 28);
    consider(G.player.x + 36, G.player.y - 28);

    const switchGap = hereDang > 48 ? 6 : 20;
    if (bestS > autoStickS + switchGap || hereDang > 55 || hypot(autoTx - G.player.x, autoTy - G.player.y) < 5) {
      autoTx = bestX;
      autoTy = bestY;
      autoStickS = bestS;
    }

    G.fireHold = true;

    if (G.bombs > 0 && G.bombT <= 0 && G.invuln < 0.12) {
      if (panic || thick || (boss && nearShots >= 6 && hereDang > 70) || hereDang > 130 || (G.lives <= 1 && hereDang > 80)) {
        tryBomb();
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
        G.player.x += ax * k;
        G.player.y += ay * k;
        G.player.vx = (ax * k) / Math.max(dt, 0.016);
        G.player.vy = (ay * k) / Math.max(dt, 0.016);
      } else {
        G.player.vx = 0;
        G.player.vy = 0;
      }
    } else if (keys.l || keys.r || keys.u || keys.d) {
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
      }
      G.player.x += G.player.vx * dt;
      G.player.y += G.player.vy * dt;
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
      G.player.x += G.player.vx * dt;
      G.player.y += G.player.vy * dt;
    }
    G.player.x = clamp(G.player.x, 22, VW - 22);
    G.player.y = clamp(G.player.y, 40, VH - 28);
  }

  function update(dt) {
    tickAutoFlow(dt);
    G.t += dt;
    if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingCount() < 8) {
        spawnFlock(5, VW * 0.5 + Math.sin(G.t) * 40);
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
    if (G.bombT > 0) G.bombT -= dt;
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
        G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
        G.invuln = Math.max(G.invuln, 0.85);
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    if (autoOn) autoThink();
    updatePlayer(dt);
    updateBombs(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isDense()) denseThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updateBits(dt);
    updatePows(dt);
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#2a1408');
      g.addColorStop(0.5, '#1c1008');
      g.addColorStop(1, '#120806');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#1a0818');
      g.addColorStop(0.5, '#140810');
      g.addColorStop(1, '#10060a');
    } else {
      g.addColorStop(0, '#2a120c');
      g.addColorStop(0.55, '#1a0c08');
      g.addColorStop(1, '#120806');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = 'rgba(255,220,180,' + s.a + ')';
      ctx.fillRect(sx(s.x), sy(s.y), Math.max(1, s.z * scale), Math.max(1, s.z * 1.6 * scale));
    }

    for (let i = 0; i < feathers.length; i++) {
      const f = feathers[i];
      ctx.save();
      ctx.translate(sx(f.x), sy(f.y));
      ctx.rotate(Math.sin(G.t * 1.4 + i) * 0.5);
      ctx.fillStyle = 'rgba(255,180,90,' + f.a + ')';
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.2 * f.s * scale, 1.2 * f.s * scale, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    const off = G.scroll % 42;
    ctx.lineWidth = 1.1 * scale;
    for (let y = -42; y < VH + 42; y += 42) {
      const yy = y + (42 - off);
      ctx.strokeStyle = 'rgba(255,107,61,' + (0.05 + ((y / 42 | 0) % 2 === 0 ? 0.03 : 0)) + ')';
      ctx.beginPath();
      for (let x = 0; x <= VW; x += 14) {
        const yy2 = yy + Math.sin((x + G.scroll) * 0.018) * 3.2;
        if (x === 0) ctx.moveTo(sx(x), sy(yy2));
        else ctx.lineTo(sx(x), sy(yy2));
      }
      ctx.stroke();
    }

    for (let i = 0; i < G.isles.length; i++) {
      const b = G.isles[i];
      const x = sx(b.x - b.w * 0.5);
      const y = sy(b.y);
      const w = b.w * scale;
      const h = b.h * scale;
      ctx.fillStyle = 'rgba(42, 18, 12, 0.92)';
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w * 0.08, y);
      ctx.lineTo(x + w * 0.92, y);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(b.hue > 0.5 ? GOLD : COR, 0.22 + b.hue * 0.12);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = rgba(COR, 0.55);
      const roofs = Math.max(1, b.roofs);
      for (let r = 0; r < roofs; r++) {
        const rw = w * (0.42 - r * 0.08);
        const rx = x + (w - rw) * 0.5;
        const ry = y - (r + 1) * 7 * scale;
        ctx.beginPath();
        ctx.moveTo(rx, ry + 7 * scale);
        ctx.lineTo(rx + rw * 0.5, ry);
        ctx.lineTo(rx + rw, ry + 7 * scale);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  function drawShip(x, y, a) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.player.vx * 0.0015);
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    const laser = isLaser();
    ctx.shadowColor = rgba(heroRgb(), 0.55);
    ctx.shadowBlur = 12;
    const flash = G.muzzle > 0;
    if (laser) {
      ctx.fillStyle = flash ? '#e8ffff' : rgba(CYN, 0.96);
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(4, -4);
      ctx.lineTo(14, 2);
      ctx.lineTo(5, 3);
      ctx.lineTo(6, 13);
      ctx.lineTo(0, 8);
      ctx.lineTo(-6, 13);
      ctx.lineTo(-5, 3);
      ctx.lineTo(-14, 2);
      ctx.lineTo(-4, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.88);
      ctx.fillRect(-1.4, -11, 2.8, 12);
      ctx.fillStyle = rgba(COR, 0.85);
      ctx.fillRect(-11, 1, 6, 2.4);
      ctx.fillRect(5, 1, 6, 2.4);
    } else {
      ctx.fillStyle = flash ? '#fff6d0' : rgba(GOLD, 0.96);
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.quadraticCurveTo(12, -2, 15, 6);
      ctx.lineTo(4, 4);
      ctx.lineTo(5, 12);
      ctx.lineTo(0, 8);
      ctx.lineTo(-5, 12);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-15, 6);
      ctx.quadraticCurveTo(-12, -2, 0, -16);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -2, 3.2, 6, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(COR, 0.8);
      ctx.beginPath();
      ctx.ellipse(-11, 2, 5, 2.2, -0.3, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(11, 2, 5, 2.2, 0.3, 0, TAU);
      ctx.fill();
    }
    const pr = Math.sin(G.t * 48);
    ctx.fillStyle = rgba(laser ? CYN : GOLD, 0.7 + pr * 0.25);
    ctx.beginPath();
    ctx.moveTo(-3, 10);
    ctx.lineTo(0, 16 + pr * 3);
    ctx.lineTo(3, 10);
    ctx.closePath();
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(heroRgb(), 0.92);
      ctx.beginPath();
      ctx.moveTo(-3, -16);
      ctx.lineTo(0, -26);
      ctx.lineTo(3, -16);
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
    if (en.type === 'sparrow' || en.type === 'kite') {
      const k = en.type === 'kite' ? 1.15 : 1;
      ctx.beginPath();
      ctx.moveTo(0, 11 * k);
      ctx.quadraticCurveTo(10 * k, 0, 12 * k, -2);
      ctx.lineTo(3, 1);
      ctx.lineTo(2.4, -10 * k);
      ctx.lineTo(-2.4, -10 * k);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-12 * k, -2);
      ctx.quadraticCurveTo(-10 * k, 0, 0, 11 * k);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.32);
      ctx.fillRect(-1.1, -2, 2.2, 7);
    } else if (en.type === 'armor') {
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(16, 2);
      ctx.lineTo(10, -6);
      ctx.lineTo(0, -10);
      ctx.lineTo(-10, -6);
      ctx.lineTo(-16, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-6, -4, 12, 5);
      ctx.fillStyle = flash ? '#fff' : rgba(COR, 0.8);
      ctx.fillRect(-18, -2, 7, 10);
      ctx.fillRect(11, -2, 7, 10);
    } else if (en.type === 'pagoda') {
      ctx.fillStyle = 'rgba(42, 22, 14, 0.95)';
      ctx.fillRect(-8, 2, 16, 10);
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(-14, 4);
      ctx.lineTo(0, -8);
      ctx.lineTo(14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, -2);
      ctx.lineTo(0, -14);
      ctx.lineTo(10, -2);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'courier') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-4, -4, 8, 6);
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(-6, 8);
      ctx.lineTo(0, 16);
      ctx.lineTo(6, 8);
      ctx.fill();
    } else if (en.type === 'wisp') {
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.beginPath();
      ctx.arc(-1.5, -1.5, 3, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(0, 10, 5, 8, 0, 0, TAU);
      ctx.fill();
    } else if (en.type === 'mid' || en.type === 'boss') {
      const boss = en.type === 'boss';
      const stg = G.stage;
      ctx.save();
      if (boss && stg === 3) {
        ctx.beginPath();
        ctx.moveTo(0, 28);
        ctx.lineTo(22, 8);
        ctx.lineTo(36, -4);
        ctx.lineTo(10, -8);
        ctx.lineTo(6, -24);
        ctx.lineTo(0, -30);
        ctx.lineTo(-6, -24);
        ctx.lineTo(-10, -8);
        ctx.lineTo(-36, -4);
        ctx.lineTo(-22, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(CYN, 0.7);
        ctx.fillRect(-3, -8, 6, 22);
      } else if (boss && stg === 2) {
        ctx.beginPath();
        ctx.ellipse(0, 0, 40, 22, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-28, -8, 12, 22);
        ctx.fillRect(16, -8, 12, 22);
        ctx.fillStyle = rgba(GOLD, 0.85);
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(0, -26);
        ctx.lineTo(10, -8);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(0, boss ? 26 : 20);
        ctx.quadraticCurveTo(boss ? 38 : 28, 4, boss ? 42 : 30, -6);
        ctx.lineTo(8, -8);
        ctx.lineTo(4, boss ? -26 : -18);
        ctx.lineTo(-4, boss ? -26 : -18);
        ctx.lineTo(-8, -8);
        ctx.lineTo(boss ? -42 : -30, -6);
        ctx.quadraticCurveTo(boss ? -38 : -28, 4, 0, boss ? 26 : 20);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.28);
        ctx.beginPath();
        ctx.ellipse(0, -4, boss ? 10 : 7, boss ? 12 : 8, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
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
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.85);
      ctx.shadowBlur = 9 * scale;
      if (s.kind === 'laser') {
        ctx.fillRect(sx(s.x - 1.8), sy(s.y - 16), 3.6 * scale, 28 * scale);
        if (!REDUCE) {
          ctx.globalAlpha = 0.32;
          ctx.fillRect(sx(s.x - 3.2), sy(s.y - 8), 6.4 * scale, 22 * scale);
        }
      } else {
        ctx.translate(sx(s.x), sy(s.y));
        ctx.rotate(Math.atan2(s.vy, s.vx) + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -7 * scale);
        ctx.quadraticCurveTo(3.4 * scale, 1, 0, 6 * scale);
        ctx.quadraticCurveTo(-3.4 * scale, 1, 0, -7 * scale);
        ctx.fill();
        if (!REDUCE) {
          ctx.globalAlpha = 0.32;
          ctx.fillRect(-1.2 * scale, 0, 2.4 * scale, 10 * scale);
        }
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
    for (let i = 0; i < G.bits.length; i++) {
      const b = G.bits[i];
      const a = clamp(b.life, 0, 1);
      ctx.save();
      ctx.translate(sx(b.x), sy(b.y));
      ctx.rotate(Math.atan2(b.vy, b.vx) + Math.PI / 2);
      ctx.fillStyle = rgba(b.rgb, 0.85 * a);
      ctx.shadowColor = rgba(b.rgb, 0.7);
      ctx.shadowBlur = 8 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -6 * scale);
      ctx.quadraticCurveTo(4 * scale, 1, 0, 7 * scale);
      ctx.quadraticCurveTo(-4 * scale, 1, 0, -6 * scale);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBeam() {
    if (G.beamT <= 0 || G.deadT > 0) return;
    const a = clamp(G.beamT / 0.62, 0, 1);
    const x = G.player.x;
    const y = G.player.y - 16;
    const w = 18 + Math.sin(G.t * 40) * 3;
    ctx.save();
    ctx.fillStyle = rgba(CYN, 0.18 * a);
    ctx.fillRect(sx(x - 28), sy(-4), 56 * scale, (y + 4) * scale);
    ctx.fillStyle = rgba(WHT, 0.55 * a);
    ctx.shadowColor = rgba(CYN, 0.9);
    ctx.shadowBlur = 18 * scale;
    ctx.fillRect(sx(x - w * 0.5), sy(-4), w * scale, (y + 4) * scale);
    ctx.fillStyle = rgba(SKY, 0.85 * a);
    ctx.fillRect(sx(x - 4), sy(-4), 8 * scale, (y + 4) * scale);
    ctx.restore();
  }

  function drawPhoenix() {
    if (G.phoenixT <= 0 || G.deadT > 0) return;
    const a = clamp(G.phoenixT / 0.72, 0, 1);
    const p = 1 - a;
    ctx.save();
    ctx.translate(sx(G.player.x), sy(G.player.y - 40));
    ctx.globalAlpha = a * 0.85;
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.shadowColor = rgba(COR, 0.8);
    ctx.shadowBlur = 22 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -10 * scale);
    ctx.quadraticCurveTo(48 * scale * (0.6 + p), 10 * scale, 56 * scale * (0.5 + p), 36 * scale);
    ctx.quadraticCurveTo(16 * scale, 8 * scale, 0, 18 * scale);
    ctx.quadraticCurveTo(-16 * scale, 8 * scale, -56 * scale * (0.5 + p), 36 * scale);
    ctx.quadraticCurveTo(-48 * scale * (0.6 + p), 10 * scale, 0, -10 * scale);
    ctx.fill();
    ctx.restore();
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 8) * 2;
      const rgb = p.kind === 'bomb' ? WHT : GOLD;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.rotate(p.t * 2.2);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.shadowColor = rgba(rgb, 0.8);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1c0c0a';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.2);
      ctx.shadowBlur = 0;
      ctx.fillText(DROP_GLYPH[p.kind] || '羽', 0, 1);
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
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : COR, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : COR, 0.6);
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
    if (G.bombFlash > 0) {
      ctx.strokeStyle = rgba(GOLD, G.bombFlash * 0.9);
      ctx.lineWidth = 7 * scale;
      ctx.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0e0604';
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
    drawBeam();
    drawPhoenix();
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawShip(G.player.x, G.player.y, 1);
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
    G.bits.length = 0;
    G.isles.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'dense' ? 'dense' : 'raid';
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
    G.bombFlash = 0;
    G.beamT = 0;
    G.phoenixT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
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
    G.nextIsle = 28;
    G.why = '';
    autoTx = G.player.x;
    autoTy = G.player.y;
    autoStickS = -1e9;
    autoOvWait = 0;
    if (autoOn) G.fireHold = true;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedStars();
    seedIsles();
    hideOverlay();
    syncHud();
    audio.start();
    toast((isDense() ? '密弹 · 更密更快' : '空战 · 第 1 关') + ' · ' + HERO_NAME[G.hero], false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.lives = LIVES;
    G.bombs = 3;
    G.pwr = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bombT = 0;
    G.beamT = 0;
    G.phoenixT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    autoOvWait = 0;
    autoTx = G.player.x;
    autoTy = G.player.y;
    clearField();
    seedStars();
    seedIsles();
    showOverlay(
      'title',
      '枪鸟',
      '纵向卷轴。选角色：羽散扇形金羽，钢翼贯穿光刃。Shift 扔专属爆弹。关关有 Boss。'
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
    if (G.mode === 'title') startGame('dense');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isDense()) goTitle();
      else startGame('dense');
    }
  }

  function cycleHero() {
    if (G.mode !== 'title') return;
    setHero(isLaser() ? 'spread' : 'laser');
    audio.ensure();
    audio.beep(isLaser() ? 520 : 740, 0.08, 'square', 0.04, isLaser() ? 880 : 520);
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
    if (k === 'c' || k === 'C' || k === 'q' || k === 'Q') {
      if (overlayOpen() && G.mode === 'title') cycleHero();
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
      if (!e.repeat) tryBomb();
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

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (btnSpread) {
    btnSpread.addEventListener('click', function () {
      audio.ensure();
      setHero('spread');
      audio.beep(740, 0.08, 'square', 0.04, 520);
    });
  }
  if (btnLaser) {
    btnLaser.addEventListener('click', function () {
      audio.ensure();
      setHero('laser');
      audio.beep(520, 0.08, 'square', 0.04, 880);
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
      else if (G.mode === 'win' && isDense()) goTitle();
      else startGame('dense');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnBomb) btnBomb.addEventListener('click', tryBomb);
  if (btnPad) btnPad.addEventListener('click', tryBomb);
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
