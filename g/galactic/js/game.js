'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.44;
  const BOMB_CAP = 6;
  const LOCK_MAX = 8;
  const HIT_R = 4.5;
  const WPN_MAX = 3;
  const BEST_KEY = 'playbox-galactic-best';
  const MUTE_KEY = 'playbox-galactic-mute';
  const OPS = '方向 / WASD 飞 · 空格开火 · Shift / Z 爆弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 74, 216];
  const CYN = [110, 232, 255];
  const VIO = [128, 96, 255];
  const GOLD = [255, 227, 107];
  const WHT = [242, 238, 255];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 168, 88];
  const LAV = [200, 180, 255];

  const DROP_CYCLE = ['gun', 'bomb', 'gun', 'bomb'];
  const DROP_GLYPH = { gun: '炮', bomb: '爆' };
  const WPN_NAME = ['炮', '炮 Ⅱ', '炮 Ⅲ', '炮 MAX'];

  const STAGES = [
    {
      name: '第 1 关 · 霓港',
      short: '霓港',
      mid: '塔卫',
      boss: '穹核',
      midHp: 36,
      bossHp: 90,
      waves: [
        { t: 0.7, kind: 'ground', n: 4 },
        { t: 2.4, kind: 'v', n: 5 },
        { t: 5.0, kind: 'silo' },
        { t: 7.2, kind: 'stream', dir: 1 },
        { t: 9.6, kind: 'truck' },
        { t: 11.8, kind: 'dive', n: 4 },
        { t: 14.0, kind: 'ground', n: 5 },
        { t: 16.4, kind: 'wing' },
        { t: 18.8, kind: 'array' },
        { t: 21.2, kind: 'mid' },
        { t: 26.6, kind: 'v', n: 7 },
        { t: 29.0, kind: 'ground', n: 6 },
        { t: 31.4, kind: 'stream', dir: -1 },
        { t: 33.8, kind: 'silo' },
        { t: 36.0, kind: 'dive', n: 5 },
        { t: 38.4, kind: 'truck' },
        { t: 40.8, kind: 'wing' },
        { t: 43.2, kind: 'array' },
        { t: 48.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 晶峡',
      short: '晶峡',
      mid: '峡炮',
      boss: '裂脊',
      midHp: 48,
      bossHp: 118,
      waves: [
        { t: 0.5, kind: 'ground', n: 5 },
        { t: 2.2, kind: 'v', n: 7 },
        { t: 4.4, kind: 'array' },
        { t: 6.6, kind: 'dive', n: 5 },
        { t: 8.8, kind: 'silo' },
        { t: 10.8, kind: 'stream', dir: -1 },
        { t: 13.0, kind: 'truck' },
        { t: 15.2, kind: 'wing' },
        { t: 17.4, kind: 'ground', n: 6 },
        { t: 19.6, kind: 'mid' },
        { t: 25.0, kind: 'v', n: 9 },
        { t: 27.2, kind: 'array' },
        { t: 29.4, kind: 'silo' },
        { t: 31.6, kind: 'dive', n: 6 },
        { t: 33.8, kind: 'stream', dir: 1 },
        { t: 36.0, kind: 'truck' },
        { t: 38.2, kind: 'wing' },
        { t: 40.6, kind: 'ground', n: 7 },
        { t: 49.2, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 核环',
      short: '核环',
      mid: '环卫',
      boss: '星核',
      midHp: 60,
      bossHp: 156,
      waves: [
        { t: 0.4, kind: 'ground', n: 6 },
        { t: 2.0, kind: 'v', n: 9 },
        { t: 3.8, kind: 'array' },
        { t: 5.6, kind: 'stream', dir: 1 },
        { t: 7.2, kind: 'stream', dir: -1 },
        { t: 9.0, kind: 'silo' },
        { t: 10.8, kind: 'dive', n: 6 },
        { t: 12.8, kind: 'wing' },
        { t: 14.8, kind: 'truck' },
        { t: 16.8, kind: 'ground', n: 7 },
        { t: 18.8, kind: 'mid' },
        { t: 24.4, kind: 'v', n: 11 },
        { t: 26.4, kind: 'array' },
        { t: 28.2, kind: 'silo' },
        { t: 30.0, kind: 'dive', n: 7 },
        { t: 32.0, kind: 'wing' },
        { t: 34.0, kind: 'stream', dir: 1 },
        { t: 35.6, kind: 'stream', dir: -1 },
        { t: 37.6, kind: 'truck' },
        { t: 39.6, kind: 'ground', n: 8 },
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
  const btnGalaxy = document.getElementById('btn-galaxy');
  const btnRain = document.getElementById('btn-rain');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPad = document.getElementById('btn-pad');
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
    kind: 'galaxy',
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
    wpnLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
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
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: VIO,
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
  function plySpd() {
    return (isRain() ? 312 : 274) + G.wpnLv * 8;
  }
  function scrollSpd() {
    if (hasBig()) return isRain() ? 34 : 26;
    const base = isRain() ? 124 : 88;
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
    return isRain() ? 1.24 : 1;
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
      this.beep(720 + G.wpnLv * 40, 0.048, 'square', 0.028, 1480);
    },
    lockOn(n) {
      this.ensure();
      this.beep(520 + n * 70, 0.05, 'sine', 0.036, 880 + n * 80);
    },
    lockFire(n) {
      this.ensure();
      this.beep(240, 0.12, 'sawtooth', 0.05, 90);
      this.beep(640 + n * 40, 0.16, 'square', 0.04, 1600);
      if (n >= 6) this.beep(1040, 0.2, 'triangle', 0.045, 1560);
    },
    lockHit(i) {
      this.ensure();
      const lift = 1 + i * 0.12;
      this.noise(0.04, 0.036, 1400);
      this.beep(480 * lift, 0.07, 'square', 0.046, 980 * lift);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1200);
      this.beep(540 * lift, 0.064, 'square', 0.042, 900 * lift);
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
    const n = G.locks.length;
    if (lockBar) lockBar.style.transform = 'scaleX(' + (n / LOCK_MAX) + ')';
    if (lockWrap) {
      lockWrap.classList.toggle('hot', n >= LOCK_MAX);
      lockWrap.classList.toggle('low', n > 0 && n < 3);
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
      tagLabel.textContent = isRain() ? '核雨' : '银河';
      tagLabel.classList.toggle('warn', isRain());
      tagLabel.classList.toggle('hot', !isRain() && G.stage >= 3);
    }
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
    else if (G.mode === 'win') setHint('星核尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 叠满锁再开火', 'warn');
    else setHint('方向飞 · 空格开火 · Shift 爆弹 · 锁定下层连锁', '');
    syncPips();
    syncLockBar();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GLXY';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const end = kind === 'win' || kind === 'lose';
    if (ovStart) ovStart.classList.toggle('gone', end);
    if (ovEnd) ovEnd.classList.toggle('gone', !end);
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isRain() ? '换模式' : '核雨';
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
    const next = 1 + Math.min(5, Math.floor((G.combo - 1) / 4));
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
      ground: !!spec.ground,
      dive: !!spec.dive,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      spin: spec.spin || 0,
      lockI: -1
    };
    G.ents.push(en);
    return en;
  }

  function spawnScout(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'scout',
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
    spawnScout(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnScout(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnScout(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = 6 + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnScout(side + rand(-8, 8), -20 - i * 24, {
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
        hp: 1, r: 10, score: 90,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnWing() {
    spawnEnt({
      type: 'wing',
      x: rand(80, VW - 80),
      y: -36,
      vx: rand(-36, 36),
      vy: 56,
      hp: 4, r: 16, score: 180,
      rgb: RED,
      drop: Math.random() < 0.4,
      w: 34, h: 20,
      fireCd: rand(0.4, 0.9)
    });
  }

  function spawnTurret(x, y) {
    spawnEnt({
      type: 'turret',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 2, r: 12, score: 80,
      rgb: GOLD,
      ground: true,
      w: 20, h: 16,
      fireCd: rand(0.5, 1.35)
    });
  }

  function spawnTruck(x) {
    spawnEnt({
      type: 'truck',
      x: x == null ? rand(70, VW - 70) : x,
      y: -28,
      vx: rand(-48, 48),
      vy: 0,
      hp: 3, r: 14, score: 120,
      rgb: ORG,
      ground: true,
      drop: Math.random() < 0.2,
      w: 28, h: 16,
      fireCd: rand(0.55, 1.2)
    });
  }

  function spawnSilo(x) {
    spawnEnt({
      type: 'silo',
      x: x == null ? rand(70, VW - 70) : x,
      y: -34,
      vx: 0, vy: 0,
      hp: 4, r: 16, score: 160,
      rgb: VIO,
      ground: true,
      drop: Math.random() < 0.28,
      w: 26, h: 22,
      fireCd: rand(0.7, 1.4)
    });
  }

  function spawnGround(n) {
    n = n || 4;
    for (let i = 0; i < n; i++) {
      const x = 50 + (i + 0.5) * ((VW - 100) / n) + rand(-14, 14);
      spawnTurret(clamp(x, 36, VW - 36), -22 - i * 16);
    }
  }

  function spawnArray() {
    const cx = rand(90, VW - 90);
    const cy = -28;
    const pts = [
      [0, 0], [-28, 18], [28, 18], [-14, 36], [14, 36]
    ];
    const n = isRain() ? 5 : 4;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'node',
        x: cx + pts[i][0],
        y: cy + pts[i][1],
        vx: 0, vy: 0,
        hp: 1, r: 9, score: 60,
        rgb: CYN,
        ground: true,
        w: 16, h: 14,
        fireCd: 99
      });
    }
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
      score: 4000 + G.stage * 1400,
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
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'wing') spawnWing();
    else if (w.kind === 'ground') spawnGround(w.n);
    else if (w.kind === 'truck') spawnTruck();
    else if (w.kind === 'silo') spawnSilo();
    else if (w.kind === 'array') spawnArray();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function nextDropKind() {
    const k = DROP_CYCLE[G.dropI % DROP_CYCLE.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    kind = kind || nextDropKind();
    G.pows.push({
      x: x, y: y, vy: 64, t: 0,
      vx: rand(-38, 38),
      kind: kind
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
    if (G.shots.length > 46) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      kind: spec.kind || 'vulcan',
      dmg: spec.dmg || 1
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.wpnLv;
    const x = G.player.x;
    const y = G.player.y - 14;
    G.muzzle = 0.05;
    G.fireCd = 0.108 - lv * 0.014;
    const spd = -680;
    const rgb = lv >= 2 ? GOLD : WHT;
    function fan(ox, oy, vx, vy) {
      addShot({ x: x + ox, y: y + oy, vx: vx || 0, vy: vy == null ? spd : vy, r: 3.1, rgb: rgb, dmg: 1 });
    }
    if (lv <= 0) {
      fan(-5, 1);
      fan(5, 1);
    } else if (lv === 1) {
      fan(-10, 3, -55, spd);
      fan(0, -2);
      fan(10, 3, 55, spd);
    } else if (lv === 2) {
      fan(-14, 4, -110, spd);
      fan(-6, 0, -36, spd);
      fan(0, -3);
      fan(6, 0, 36, spd);
      fan(14, 4, 110, spd);
    } else {
      fan(-16, 5, -130, spd);
      fan(-9, 1, -60, spd);
      fan(-3, -2);
      fan(3, -2);
      fan(9, 1, 60, spd);
      fan(16, 5, 130, spd);
    }
    audio.shoot();
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: GOLD, g: 0
    });
  }

  function lockedOf(en) {
    for (let i = 0; i < G.locks.length; i++) {
      if (G.locks[i] === en) return true;
    }
    return false;
  }

  function pruneLocks() {
    for (let i = G.locks.length - 1; i >= 0; i--) {
      const en = G.locks[i];
      if (!en || en.hp <= 0 || en.y > VH + 20 || en.y < -40) {
        G.locks.splice(i, 1);
      }
    }
    for (let i = 0; i < G.locks.length; i++) G.locks[i].lockI = i;
  }

  function acquireLock(dt) {
    pruneLocks();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.locks.length >= LOCK_MAX) {
      G.lockT = 0;
      if (G.lockCd <= 0) fireLock();
      return;
    }
    const px = G.player.x;
    const py = G.player.y;
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (!en.ground || en.hp <= 0) continue;
      if (lockedOf(en)) continue;
      const dx = en.x - px;
      const dy = py - en.y;
      if (dy < 28 || dy > 430) continue;
      const cone = 62 + dy * 0.2;
      if (Math.abs(dx) > cone) continue;
      const d = dx * dx + dy * dy * 0.55;
      if (d < bd) {
        bd = d;
        best = en;
      }
    }
    if (!best) {
      G.lockT = 0;
      return;
    }
    const haste = 0.085 - Math.min(0.03, G.combo * 0.002);
    G.lockT += dt;
    if (G.lockT >= haste) {
      G.lockT = 0;
      G.locks.push(best);
      best.lockI = G.locks.length - 1;
      audio.lockOn(G.locks.length);
      popSpark(best.x, best.y, GOLD, 10);
      syncLockBar();
      if (G.locks.length >= LOCK_MAX) {
        toast('满锁', false, true);
        fireLock();
      }
    }
  }

  function fireLock() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.lockCd > 0) return;
    pruneLocks();
    if (G.locks.length <= 0) return;
    const chain = G.locks.slice();
    const n = chain.length;
    G.locks.length = 0;
    G.lockT = 0;
    G.lockCd = 0.38;
    syncLockBar();
    audio.lockFire(n);
    if (n >= 6) {
      toast(n + ' 连锁', false, true);
      screenFlash(GOLD, 0.28 + n * 0.04);
      kick(3.4 + n * 0.4);
    }
    const px = G.player.x;
    const py = G.player.y - 12;
    for (let i = 0; i < n; i++) {
      G.lasers.push({
        x: px,
        y: py,
        target: chain[i],
        delay: i * 0.052,
        i: i,
        n: n,
        t: 0,
        hit: false,
        trail: [{ x: px, y: py }]
      });
    }
    capArr(G.lasers, 24);
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
    G.bombT = 0.48;
    G.bombFlash = 0.55;
    G.invuln = Math.max(G.invuln, 0.42);
    G.locks.length = 0;
    syncLockBar();
    audio.bomb();
    screenFlash(WHT, 0.78);
    popSpark(G.player.x, G.player.y, VIO, 48);
    rings.push({ x: G.player.x, y: G.player.y, t: 0, rgb: GOLD, r: 22 });
    rings.push({ x: VW * 0.5, y: VH * 0.42, t: 0, rgb: VIO, r: 40 });
    emit(28, {
      x: G.player.x, y: G.player.y, j: 18,
      vx0: -280, vx1: 280, vy0: -320, vy1: 220,
      life: 0.52, r0: 1.6, r1: 4.2, rgb: LAV, g: 40
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
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dmg = en.type === 'boss' ? 14 : en.type === 'mid' ? 10 : 6;
      hurtEnt(en, dmg, en.x, en.y, false, 0);
    }
    syncHud();
  }

  function lockPts(i) {
    return 100 * Math.pow(2, i);
  }

  function hurtEnt(en, dmg, hx, hy, fromLock, lockI) {
    if (en.hp <= 0) return;
    en.hp -= dmg || 1;
    en.flash = 0.08;
    if (fromLock) {
      audio.lockHit(lockI || 0);
      const chip = Math.round(lockPts(lockI || 0) * G.mult);
      if (en.hp <= 0) {
        killEnt(en, true, lockI || 0);
        return;
      }
      addScore(Math.max(20, Math.round(chip * 0.18)));
      emit(5, {
        x: hx, y: hy, j: 5,
        vx0: -100, vx1: 100, vy0: -120, vy1: 40,
        life: 0.2, r0: 1.2, r1: 2.6, rgb: GOLD, g: 180
      });
      hitStop(clamp(0.028 + (lockI || 0) * 0.006, 0.028, 0.06));
      return;
    }
    if (en.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -80, vx1: 80, vy0: -90, vy1: 40,
        life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
      });
      if (en.type === 'boss' || en.type === 'mid') hitStop(0.032);
      return;
    }
    killEnt(en, false, 0);
  }

  function killEnt(en, fromLock, lockI) {
    if (en.hp < -90) return;
    en.hp = -99;
    bumpCombo();
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : fromLock ? 1.15 + lockI * 0.12 : 0.85;
    juice(en.x, en.y, fromLock ? GOLD : en.rgb, pwr);
    if (!fromLock) audio.hit(G.combo);
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    let pts;
    if (fromLock) {
      pts = lockPts(lockI) * G.mult;
      floatText(en.x, en.y - 12, (lockI >= 3 ? '×' + (1 << lockI) + ' ' : '') + pts, GOLD, lockI >= 3);
    } else {
      pts = (en.score || 50) * G.mult;
      if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    }
    addScore(pts);
    hitStop(clamp(0.034 + G.combo * 0.0024 + (fromLock ? lockI * 0.004 : 0), 0.034, 0.072));
    if (en.drop === 'cycle' || en.drop === true) spawnPow(en.x, en.y, nextDropKind());
    else if (en.drop === 'bomb') spawnPow(en.x, en.y, 'bomb');
    else if (en.drop) spawnPow(en.x, en.y, en.drop);
    else if ((en.type === 'wing' || en.type === 'silo') && Math.random() < 0.22) spawnPow(en.x, en.y, nextDropKind());
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
        toast('爆弹 +1', false, true);
      } else {
        addScore(800 * G.mult);
        toast('+800', false, true);
      }
    } else {
      if (G.wpnLv < WPN_MAX) {
        G.wpnLv += 1;
        toast(WPN_NAME[G.wpnLv], false, true);
      } else {
        addScore(500 * G.mult);
        toast('+500', false, true);
      }
      flashWpn();
    }
    juice(p.x, p.y, p.kind === 'bomb' ? VIO : GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, DROP_GLYPH[p.kind] || '炮', p.kind === 'bomb' ? VIO : GOLD, true);
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.bombT = 0;
    G.locks.length = 0;
    G.lasers.length = 0;
    breakCombo();
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.wpnLv > 0) spawnPow(G.player.x, G.player.y - 18, 'gun');
    G.wpnLv = 0;
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    G.locks.length = 0;
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
    showOverlay('win', '星核尽破', (isRain() ? '核雨通关' : '三关打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function livingCount() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0) n += 1;
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

  function rainThink(dt) {
    if (hasBig() || G.stageClearT > 0) return;
    const st = STAGES[G.stage - 1];
    if (st) {
      while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t * 0.84) {
        fireWave(st.waves[G.waveI]);
        G.waveI += 1;
      }
    }
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    G.spawnT = clamp(1.45 / (1 + G.stage * 0.12), 0.38, 1.45);
    if (livingCount() > 30) return;
    const r = Math.random();
    if (r < 0.22) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.36) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.5) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.62) spawnGround(4 + (Math.random() * 3) | 0);
    else if (r < 0.74) spawnArray();
    else if (r < 0.84) spawnSilo();
    else if (r < 0.92) spawnTruck();
    else spawnWing();
  }

  function bossFire(en, rain) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += rain ? 0.22 : 0.16;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 16, rain ? 210 : 176, VIO);
      eShot(en.x - 18, en.y + 10, -46, 186, PNK);
      eShot(en.x + 18, en.y + 10, 46, 186, PNK);
      if (mid) ringShot(en.x, en.y, rain ? 10 : 8, 150, en.spin, VIO, 3.2);
      if (low) {
        aimShot(en.x - 22, en.y + 8, 200, MAG);
        aimShot(en.x + 22, en.y + 8, 200, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 18, 214, MAG);
      eShot(en.x - 26, en.y + 12, -50, 196, RED);
      eShot(en.x + 26, en.y + 12, 50, 196, RED);
      if (mid) ringShot(en.x, en.y + 6, rain ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 42, 208, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, rain ? 14 : 11, 146, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 8, rain ? 10 : 8, 118, -en.spin * 1.4, VIO, 3.0);
        aimShot(en.x, en.y + 16, 200, GOLD);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 220, RED);
        aimShot(en.x + 28, en.y + 10, 220, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 6, rain ? 16 : 12, 152, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 6, rain ? 10 : 8, 108, -en.spin * 0.7, CYN, 2.8);
      if (mid) {
        aimShot(en.x - 20, en.y + 14, 210, PNK);
        aimShot(en.x + 20, en.y + 14, 210, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, rain ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (rain) en.fireCd *= 0.78;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0 || G.bombT > 0;
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
      if (en.ground) {
        en.y += scr * dt;
        if (en.type === 'truck') {
          en.x += en.vx * dt;
          if (en.x < 40 || en.x > VW - 40) en.vx *= -1;
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
        if (playing && en.y > 80 && Math.random() < dt * (en.type === 'boss' ? 1.2 : 0.65)) {
          const gx = clamp(en.x + rand(-56, 56), 40, VW - 40);
          if (Math.random() < 0.38) spawnSilo(gx);
          else spawnTurret(gx, -20);
        }
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
      } else if (en.type === 'scout') {
        if (!en.dive && en.t > 1.28 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.28) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 92, dt * 2);
          en.vy = Math.max(en.vy, 154);
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'wing') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < 46 || en.x > VW - 46) en.vx *= -1;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 52 || en.x < -64 || en.x > VW + 64) {
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && en.y > -10 && en.y < VH + 10) {
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          if (en.type === 'scout' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, rain ? 198 : 172, MAG);
            if (rain && Math.random() < 0.45) aimShot(en.x, en.y + 8, 168, PNK);
            en.fireCd = (rain ? 1.3 : 2.3) + rand(0, 0.55);
          } else if (en.type === 'wing') {
            eShot(en.x - 9, en.y + 12, -34, 176, RED);
            eShot(en.x, en.y + 14, 0, 196, RED);
            eShot(en.x + 9, en.y + 12, 34, 176, RED);
            if (rain) aimShot(en.x, en.y + 10, 186, ORG);
            en.fireCd = rain ? 0.7 : 1.02;
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, rain ? 214 : 174, GOLD);
            if (rain) {
              eShot(en.x - 8, en.y + 4, -40, 160, ORG);
              eShot(en.x + 8, en.y + 4, 40, 160, ORG);
            }
            en.fireCd = (rain ? 0.76 : 1.14) + rand(0, 0.28);
          } else if (en.type === 'truck' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, rain ? 200 : 166, ORG);
            en.fireCd = rain ? 0.68 : 1.0;
          } else if (en.type === 'silo' && en.y > 8 && en.y < VH - 70) {
            ringShot(en.x, en.y, rain ? 8 : 6, 128, en.t * 1.4, VIO, 3.1);
            en.fireCd = rain ? 0.92 : 1.28;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, rain);
            else en.fireCd = 0.4;
          } else {
            en.fireCd = 2;
          }
        }
      }

      if (canHurt && !en.ground) {
        const rr = en.r + HIT_R;
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
        if (en.hp <= 0 || en.ground) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(en, s.dmg || 1, s.x, s.y, false, 0);
          hit = true;
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
        const rr = HIT_R + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          G.eShots.splice(i, 1);
          killPlayer();
        }
      }
    }
  }

  function updateLasers(dt) {
    for (let i = G.lasers.length - 1; i >= 0; i--) {
      const L = G.lasers[i];
      L.t += dt;
      if (L.hit) {
        G.lasers.splice(i, 1);
        continue;
      }
      if (L.t < L.delay) continue;
      const tgt = L.target;
      let tx;
      let ty;
      if (!tgt || tgt.hp <= 0) {
        tx = L.x;
        ty = L.y - 40;
        L.hit = true;
      } else {
        tx = tgt.x;
        ty = tgt.y;
      }
      const dx = tx - L.x;
      const dy = ty - L.y;
      const len = hypot(dx, dy) || 1;
      const spd = 920 + L.i * 40;
      L.x += dx / len * spd * dt;
      L.y += dy / len * spd * dt;
      L.trail.push({ x: L.x, y: L.y });
      if (L.trail.length > 10) L.trail.shift();
      if (len < 14 || L.t > L.delay + 1.2) {
        if (tgt && tgt.hp > 0) {
          const dmg = tgt.type === 'boss' ? 8 : tgt.type === 'mid' ? 6 : 4;
          hurtEnt(tgt, dmg, tgt.x, tgt.y, true, L.i);
          popSpark(tgt.x, tgt.y, GOLD, 12 + L.i * 2);
        }
        L.hit = true;
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
    G.nextBuild -= scr * dt;
    if (G.nextBuild <= 0) {
      G.nextBuild = rand(48, 92);
      spawnBuilding(-90);
    }
    for (let i = buildings.length - 1; i >= 0; i--) {
      buildings[i].y += scr * dt;
      if (buildings[i].y - buildings[i].h > VH + 20) buildings.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += scr * 0.28 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
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
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingCount() < 10) {
        if (Math.random() < 0.55) spawnGround(4);
        else spawnV(5, VW * 0.5 + Math.sin(G.t) * 40);
        G.spawnT = 2.4;
      }
      updateEnts(dt);
      updateWorld(dt * 0.55);
      acquireLock(dt);
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

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();
    if (G.mode === 'play' && G.deadT <= 0) acquireLock(dt);

    if (isRain()) rainThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updateLasers(dt);
    updatePows(dt);
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#12081c');
      g.addColorStop(0.45, '#0c1024');
      g.addColorStop(1, '#081018');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#140820');
      g.addColorStop(0.5, '#0a0c28');
      g.addColorStop(1, '#070512');
    } else {
      g.addColorStop(0, '#100824');
      g.addColorStop(0.5, '#0a0820');
      g.addColorStop(1, '#070512');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vpX = VW * 0.5;
    const vpY = 36;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    ctx.strokeStyle = rgba(VIO, G.stage === 3 ? 0.16 : 0.12);
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
      ctx.strokeStyle = rgba(CYN, 0.04 + t * 0.08);
      ctx.beginPath();
      ctx.moveTo(sx(vpX - w * 0.5), sy(y));
      ctx.lineTo(sx(vpX + w * 0.5), sy(y));
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = 'rgba(210,200,255,' + s.a + ')';
      ctx.fillRect(sx(s.x), sy(s.y), Math.max(1, s.z * scale), Math.max(1, s.z * 1.5 * scale));
    }

    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      const depth = clamp((b.y + 40) / VH, 0.15, 1);
      const x = sx(b.x - b.w * 0.5 * (0.7 + depth * 0.3));
      const y = sy(b.y);
      const w = b.w * (0.7 + depth * 0.3) * scale;
      const h = b.h * scale;
      ctx.fillStyle = 'rgba(12, 8, 32, ' + (0.72 + depth * 0.2) + ')';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = rgba(b.neon ? GOLD : VIO, 0.16 + b.hue * 0.16);
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

  function drawLockCone() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const px = G.player.x;
    const py = G.player.y;
    ctx.save();
    ctx.fillStyle = rgba(GOLD, 0.035);
    ctx.strokeStyle = rgba(GOLD, 0.12);
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(px), sy(py - 8));
    ctx.lineTo(sx(px - 148), sy(py - 420));
    ctx.lineTo(sx(px + 148), sy(py - 420));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawShip(x, y, a) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.player.vx * 0.0015);
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.shadowColor = rgba(VIO, 0.6);
    ctx.shadowBlur = 12;
    const flash = G.muzzle > 0;
    ctx.fillStyle = flash ? '#f4f0ff' : rgba(LAV, 0.96);
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
    ctx.fillStyle = rgba(WHT, 0.88);
    ctx.fillRect(-1.3, -10, 2.6, 10);
    ctx.fillStyle = rgba(VIO, 0.9);
    ctx.fillRect(-10, 2, 5, 2.2);
    ctx.fillRect(5, 2, 5, 2.2);
    const pr = Math.sin(G.t * 48);
    ctx.fillStyle = rgba(GOLD, 0.7 + pr * 0.25);
    ctx.beginPath();
    ctx.moveTo(-3, 10);
    ctx.lineTo(0, 16 + pr * 3);
    ctx.lineTo(3, 10);
    ctx.closePath();
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.92);
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
    const gs = en.ground ? 0.78 : 1;
    ctx.scale(scale * gs, scale * gs);
    if (en.ground) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 10, en.r * 0.9, 4.2, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, en.ground ? 0.82 : 0.95);
    ctx.shadowColor = rgba(en.rgb, 0.5);
    ctx.shadowBlur = en.ground ? 6 : 10;
    if (en.type === 'scout' || en.type === 'dive') {
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.lineTo(9, 1);
      ctx.lineTo(3, 1);
      ctx.lineTo(2.2, -10);
      ctx.lineTo(-2.2, -10);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-9, 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.32);
      ctx.fillRect(-1.1, -2, 2.2, 7);
    } else if (en.type === 'wing') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-16, -3, 7, 12);
      ctx.fillRect(9, -3, 7, 12);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-5, -3, 10, 5);
    } else if (en.type === 'turret') {
      const dx = G.player.x - en.x;
      const dy = G.player.y - en.y;
      ctx.fillStyle = 'rgba(24, 16, 46, 0.95)';
      ctx.beginPath();
      ctx.arc(0, 4, 11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, TAU);
      ctx.fill();
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillRect(4, -2.1, 14, 4.2);
    } else if (en.type === 'truck') {
      ctx.fillRect(-14, -5, 28, 12);
      ctx.fillRect(-16, 5, 9, 5);
      ctx.fillRect(7, 5, 9, 5);
      ctx.fillStyle = rgba(WHT, 0.25);
      ctx.fillRect(-7, -2, 14, 5);
    } else if (en.type === 'silo') {
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(12, 8);
      ctx.lineTo(-12, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.55);
      ctx.fillRect(-3, -4, 6, 10);
    } else if (en.type === 'node') {
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-7, -7, 14, 14);
    } else if (en.type === 'mid') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 38, 14, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-32, -6, 12, 24);
      ctx.fillRect(20, -6, 12, 24);
      ctx.fillStyle = rgba(GOLD, 0.65);
      ctx.fillRect(-8, -2, 16, 8);
    } else if (en.type === 'boss') {
      ctx.beginPath();
      ctx.ellipse(0, 4, 54, 16, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-46, -8, 14, 30);
      ctx.fillRect(-10, -12, 20, 38);
      ctx.fillRect(32, -8, 14, 30);
      ctx.fillStyle = rgba(GOLD, 0.72);
      ctx.fillRect(-24, 0, 8, 8);
      ctx.fillRect(16, 0, 8, 8);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-30, -2, 60, 7);
    }
    ctx.restore();
  }

  function drawLocks() {
    if (G.locks.length <= 0 && G.lasers.length <= 0) return;
    const px = G.player.x;
    const py = G.player.y - 10;
    ctx.save();
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeStyle = rgba(GOLD, 0.45);
    ctx.setLineDash([4 * scale, 5 * scale]);
    for (let i = 0; i < G.locks.length; i++) {
      const en = G.locks[i];
      ctx.beginPath();
      ctx.moveTo(sx(px), sy(py));
      ctx.lineTo(sx(en.x), sy(en.y));
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();

    for (let i = 0; i < G.locks.length; i++) {
      const en = G.locks[i];
      const pulse = 0.75 + Math.sin(G.t * 14 + i) * 0.25;
      const sz = (10 + i * 0.4) * pulse;
      ctx.save();
      ctx.translate(sx(en.x), sy(en.y));
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.shadowColor = rgba(GOLD, 0.8);
      ctx.shadowBlur = 8 * scale;
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeRect(-sz * scale, -sz * scale, sz * 2 * scale, sz * 2 * scale);
      ctx.rotate(G.t * 2);
      ctx.strokeStyle = rgba(VIO, 0.7);
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(-sz * 0.7 * scale, -sz * 0.7 * scale, sz * 1.4 * scale, sz * 1.4 * scale);
      ctx.restore();
      ctx.save();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = 'bold ' + Math.max(10, 11 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(String(i + 1), sx(en.x), sy(en.y - sz - 4));
      ctx.restore();
    }
  }

  function drawLasers() {
    for (let i = 0; i < G.lasers.length; i++) {
      const L = G.lasers[i];
      if (L.t < L.delay) continue;
      ctx.save();
      ctx.strokeStyle = rgba(L.i >= 5 ? GOLD : MAG, 0.9);
      ctx.shadowColor = rgba(L.i >= 5 ? GOLD : VIO, 0.9);
      ctx.shadowBlur = 12 * scale;
      ctx.lineWidth = (2.4 + L.i * 0.25) * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const tr = L.trail;
      if (tr.length > 0) {
        ctx.moveTo(sx(tr[0].x), sy(tr[0].y));
        for (let k = 1; k < tr.length; k++) ctx.lineTo(sx(tr[k].x), sy(tr[k].y));
      } else {
        ctx.moveTo(sx(G.player.x), sy(G.player.y - 10));
        ctx.lineTo(sx(L.x), sy(L.y));
      }
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(sx(L.x), sy(L.y), (3.2 + L.i * 0.35) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.85);
      ctx.shadowBlur = 9 * scale;
      ctx.fillRect(sx(s.x - 1.4), sy(s.y - 6), 2.8 * scale, 11 * scale);
      if (!REDUCE) {
        ctx.globalAlpha = 0.32;
        ctx.fillRect(sx(s.x - 1.2), sy(s.y), 2.4 * scale, 10 * scale);
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

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 8) * 2;
      const rgb = p.kind === 'bomb' ? VIO : GOLD;
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
      ctx.fillStyle = '#100820';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.2);
      ctx.shadowBlur = 0;
      ctx.fillText(DROP_GLYPH[p.kind] || '炮', 0, 1);
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
      ctx.save();
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t;
      ctx.save();
      ctx.strokeStyle = rgba(r.rgb, a * 0.7);
      ctx.lineWidth = 2.2 * scale * a;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 46) * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(1 - f.t / f.life, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + Math.max(11, f.size * scale * 0.85) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = rgba(f.rgb, 0.7);
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if ((G.ents[i].type === 'boss' || G.ents[i].type === 'mid') && G.ents[i].hp > 0) {
        boss = G.ents[i];
        if (G.ents[i].type === 'boss') break;
      }
    }
    if (!boss) return;
    const w = 220;
    const h = 7;
    const x = (VW - w) * 0.5;
    const y = 18;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    const t = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : VIO, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : VIO, 0.6);
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
    ctx.fillStyle = '#050310';
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
    drawLockCone();

    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawLocks();
    drawLasers();
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
    G.locks.length = 0;
    G.lasers.length = 0;
    buildings.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'rain' ? 'rain' : 'galaxy';
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
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.fireCd = 0;
    G.lockCd = 0;
    G.lockT = 0;
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
    G.nextBuild = 28;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedStars();
    seedBuildings();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isRain() ? '核雨 · 更密更快' : '银河 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'galaxy';
    G.stage = 1;
    G.lives = LIVES;
    G.bombs = 3;
    G.wpnLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bombT = 0;
    G.locks.length = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedStars();
    seedBuildings();
    showOverlay('title', '银河', '飞在上层打空中，锁定下层连锁激光。撞了扣命。短关之后是星核。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('galaxy');
    else startGame(G.kind || 'galaxy');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('galaxy');
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

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isBomb = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
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

    if (down && (isMove || space || isBomb || k === 'Enter')) e.preventDefault();

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
        if (space && G.mode === 'play') {
          G.fireHold = true;
          fire();
          fireLock();
        }
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        if (!e.repeat) {
          fire();
          fireLock();
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
      if (G.mode === 'play') {
        fire();
        fireLock();
      }
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

  if (btnGalaxy) {
    btnGalaxy.addEventListener('click', function () {
      audio.ensure();
      startGame('galaxy');
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
      startGame(G.kind);
    });
  }
  if (ovModes) {
    ovModes.addEventListener('click', function () {
      audio.ensure();
      secondaryAction();
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
    }
  });

  requestAnimationFrame(frame);
})();
