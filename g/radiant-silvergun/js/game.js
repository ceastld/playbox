'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.25;
  const LOCK_WIN = 1.85;
  const HIT_R = 4.6;
  const SWORD_T = 0.22;
  const BEST_KEY = 'playbox-radiant-silvergun-best';
  const MUTE_KEY = 'playbox-radiant-silvergun-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格三色齐射 · Shift / Z 银斩 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const RED = [255, 74, 90];
  const GOLD = [255, 227, 107];
  const BLU = [61, 158, 255];
  const SLV = [212, 228, 244];
  const MAG = [255, 74, 122];
  const WHT = [232, 242, 255];
  const HOT = [126, 196, 255];
  const HUE_RGB = [RED, GOLD, BLU];
  const HUE_CLS = ['r', 'y', 'b'];
  const HUE_NAME = ['赤', '金', '蓝'];

  const SCORE = {
    dart: 50,
    helix: 80,
    fan: 150,
    prism: 200,
    gate: 120,
    pod: 300,
    mid: 2000,
    boss: 4000,
    node: 400,
    shred: 8,
    stage: 2000,
    clear: 8000
  };

  const STAGES = [
    {
      name: '第 1 关 · 银廊',
      mid: '赤卫',
      boss: '银门',
      midHp: 36,
      bossHp: 96,
      waves: [
        { t: 0.7, kind: 'v', n: 5, hue: 0 },
        { t: 3.1, kind: 'stream', dir: 1, hue: 1 },
        { t: 5.6, kind: 'helix', n: 4, hue: 2 },
        { t: 8.2, kind: 'v', n: 7, hue: 'mix' },
        { t: 10.8, kind: 'fan', hue: 0 },
        { t: 13.2, kind: 'pod' },
        { t: 15.6, kind: 'v', n: 5, hue: 1 },
        { t: 18.0, kind: 'gates', hue: 2 },
        { t: 21.0, kind: 'mid' },
        { t: 26.4, kind: 'stream', dir: -1, hue: 2 },
        { t: 28.8, kind: 'helix', n: 5, hue: 0 },
        { t: 31.4, kind: 'v', n: 7, hue: 1 },
        { t: 34.0, kind: 'fan', hue: 2 },
        { t: 36.6, kind: 'pod' },
        { t: 39.0, kind: 'v', n: 7, hue: 'mix' },
        { t: 42.2, kind: 'helix', n: 5, hue: 1 },
        { t: 47.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 三色门',
      mid: '金环',
      boss: '色枢',
      midHp: 50,
      bossHp: 128,
      waves: [
        { t: 0.5, kind: 'v', n: 7, hue: 0 },
        { t: 2.6, kind: 'v', n: 7, hue: 1 },
        { t: 4.8, kind: 'v', n: 7, hue: 2 },
        { t: 7.0, kind: 'prism', n: 3 },
        { t: 9.2, kind: 'stream', dir: 1, hue: 0 },
        { t: 11.4, kind: 'fan', hue: 1 },
        { t: 13.6, kind: 'pod' },
        { t: 15.8, kind: 'gates', hue: 'mix' },
        { t: 18.2, kind: 'helix', n: 6, hue: 2 },
        { t: 20.4, kind: 'mid' },
        { t: 26.0, kind: 'v', n: 9, hue: 1 },
        { t: 28.2, kind: 'prism', n: 4 },
        { t: 30.6, kind: 'stream', dir: -1, hue: 2 },
        { t: 32.8, kind: 'fan', hue: 0 },
        { t: 35.0, kind: 'v', n: 9, hue: 'mix' },
        { t: 37.4, kind: 'helix', n: 6, hue: 0 },
        { t: 39.8, kind: 'pod' },
        { t: 42.2, kind: 'gates', hue: 1 },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 银核',
      mid: '蓝枢',
      boss: '银核',
      midHp: 62,
      bossHp: 176,
      waves: [
        { t: 0.4, kind: 'v', n: 9, hue: 'mix' },
        { t: 2.2, kind: 'stream', dir: 1, hue: 0 },
        { t: 4.0, kind: 'stream', dir: -1, hue: 2 },
        { t: 6.0, kind: 'prism', n: 5 },
        { t: 8.2, kind: 'fan', hue: 1 },
        { t: 10.4, kind: 'helix', n: 6, hue: 0 },
        { t: 12.6, kind: 'pod' },
        { t: 14.8, kind: 'v', n: 9, hue: 2 },
        { t: 17.0, kind: 'gates', hue: 'mix' },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'v', n: 11, hue: 0 },
        { t: 27.0, kind: 'helix', n: 7, hue: 1 },
        { t: 29.2, kind: 'prism', n: 5 },
        { t: 31.4, kind: 'fan', hue: 2 },
        { t: 33.6, kind: 'stream', dir: 1, hue: 1 },
        { t: 35.8, kind: 'v', n: 11, hue: 'mix' },
        { t: 38.2, kind: 'pod' },
        { t: 40.6, kind: 'helix', n: 6, hue: 2 },
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
  const btnGun = document.getElementById('btn-gun');
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnSword = document.getElementById('btn-sword');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const chainLabel = document.getElementById('chain-label');
  const chEls = [
    document.getElementById('ch0'),
    document.getElementById('ch1'),
    document.getElementById('ch2')
  ];
  const lockLabel = document.getElementById('lock-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const swdBar = document.getElementById('swd-bar');
  const swdWrap = document.getElementById('swd-wrap');
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
  let chainTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const beams = [];

  const G = {
    mode: 'title',
    kind: 'gun',
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
    chain: [],
    lockHue: -1,
    lockT: 0,
    sword: 0,
    swordT: 0,
    swordDir: { x: 0, y: -1 },
    lastAim: { x: 0, y: -1 },
    slashes: [],
    swordHit: [],
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    plates: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: BLU,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    why: '',
    nextPlate: 36,
    waveT: 1.6
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
  function hueOf(v) {
    if (v === 'mix' || v == null) return (Math.random() * 3) | 0;
    return v | 0;
  }
  function plySpd() {
    return isCore() ? 328 : 288;
  }
  function scrollSpd() {
    if (hasBig()) return isCore() ? 36 : 28;
    const base = isCore() ? 118 : 86;
    const rush = G.lockHue >= 0 ? 14 : G.combo >= 8 ? 10 : G.combo >= 4 ? 5 : 0;
    return base + rush + (G.stage - 1) * (isCore() ? 10 : 7);
  }
  function shotCap() {
    return isCore() ? 168 : 112;
  }
  function comboWindow() {
    return G.lockHue >= 0 ? LOCK_WIN : COMBO_WIN;
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
      this.beep(640, 0.04, 'square', 0.022, 1480);
      this.beep(420, 0.055, 'triangle', 0.018, 180);
      this.beep(880, 0.036, 'sine', 0.016, 1320);
    },
    hit(combo, hue) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.04);
      const base = hue === 0 ? 520 : hue === 1 ? 660 : 780;
      this.noise(0.032, 0.028, 1500);
      this.beep(base * lift, 0.062, 'square', 0.042, (base + 280) * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.1, big ? 0.078 : 0.046, big ? 200 : 480);
      this.beep(big ? 150 : 240, big ? 0.28 : 0.14, 'sawtooth', 0.05, 48);
    },
    sword() {
      this.ensure();
      this.noise(0.12, 0.055, 900);
      this.beep(1400, 0.1, 'triangle', 0.05, 420);
      this.beep(220, 0.18, 'sawtooth', 0.04, 70);
    },
    lock() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1175);
      this.beep(1175, 0.16, 'sine', 0.038, 1568);
    },
    brk() {
      this.ensure();
      this.beep(240, 0.1, 'sawtooth', 0.036, 90);
      this.beep(160, 0.14, 'sine', 0.03, 70);
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
      this.beep(523, 0.1, 'triangle', 0.03, 880);
      this.beep(784, 0.14, 'sine', 0.035, 1175);
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

  function pulseChain(cls) {
    if (!chainLabel) return;
    chainLabel.classList.remove('hot');
    chainLabel.classList.remove('break');
    void chainLabel.offsetWidth;
    if (cls) chainLabel.classList.add(cls);
    chainTok += 1;
    const tok = chainTok;
    setTimeout(function () {
      if (tok === chainTok && chainLabel) {
        chainLabel.classList.remove('hot');
        chainLabel.classList.remove('break');
      }
    }, 320);
  }

  function syncChain() {
    for (let i = 0; i < 3; i++) {
      const el = chEls[i];
      if (!el) continue;
      el.className = 'c';
      const hue = G.chain[i];
      if (hue == null) continue;
      el.classList.add('on');
      el.classList.add(HUE_CLS[hue] || 'r');
    }
    if (chainLabel) {
      chainLabel.classList.toggle('lock', G.lockHue >= 0);
    }
    if (lockLabel) {
      lockLabel.textContent = G.lockHue >= 0 ? HUE_NAME[G.lockHue] + '锁' : '锁';
    }
  }

  function syncSword() {
    if (swdBar) swdBar.style.transform = 'scaleX(' + clamp(G.sword, 0, 1) + ')';
    if (swdWrap) {
      swdWrap.classList.toggle('ready', G.sword >= 1 && G.swordT <= 0);
      swdWrap.classList.toggle('hot', G.swordT > 0 || G.sword >= 1);
    }
    const ready = G.mode !== 'play' || G.sword >= 1 || G.swordT > 0;
    if (btnSword) btnSword.disabled = G.mode === 'play' && !ready;
    if (btnPad) btnPad.disabled = G.mode === 'play' && !ready;
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
      tagLabel.textContent = isCore() ? '银核' : '银枪';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
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
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或撞机扣一命', 'warn');
    else if (G.mode === 'win') setHint('银核尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 同色三杀上锁 · Shift 银斩', 'warn');
    else if (G.lockHue >= 0) setHint('连锁上锁 · 同色续锁 · 异色断锁', 'hot');
    else if (G.sword >= 1) setHint('银斩已满 · Shift / Z 冲刺斩切', 'hot');
    else setHint('同色三杀上锁 · 空格三色齐射 · Shift 银斩', '');
    syncChain();
    syncSword();
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'RSG';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvModes) {
      if (kind === 'lose') btnOvModes.textContent = '换模式';
      else if (kind === 'win') btnOvModes.textContent = isCore() ? '换模式' : '银核';
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

  function kick(mag, cls) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const name = cls || (mag >= 6.5 ? 'die' : mag >= 5 ? 'sword' : mag >= 4 ? 'lock' : mag >= 3.5 ? 'boss' : 'hit');
    stageEl.classList.remove('die', 'hit', 'lock', 'boss', 'sword');
    void stageEl.offsetWidth;
    stageEl.classList.add(name);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'hit', 'lock', 'boss', 'sword');
      }
    }, 360);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.45);
    G.flashRgb = rgb || BLU;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.ceil(n * 0.4);
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
    capArr(particles, 180);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 18 });
    capArr(sparks, 24);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb || WHT,
      t: 0, life: gold ? 0.85 : 0.62, vy: gold ? -42 : -56,
      size: gold ? 14 : 11
    });
    capArr(floats, 18);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit((10 * p) | 0, {
      x: x, y: y, j: 8 * p,
      vx0: -160 * p, vx1: 160 * p, vy0: -200 * p, vy1: 80 * p,
      life: 0.32 + p * 0.08, r0: 1.2, r1: 3.4 + p, rgb: rgb, g: 90
    });
    popSpark(x, y, rgb, 14 + p * 10);
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: 8 + p * 6 });
    capArr(rings, 16);
    kick(2.2 + p * 1.6);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.4, 2.4),
        a: rand(0.16, 0.7),
        hue: (Math.random() * 3) | 0
      });
    }
  }

  function seedPlates() {
    G.plates.length = 0;
    for (let i = 0; i < 6; i++) spawnPlate(rand(-40, VH - 60));
  }

  function spawnPlate(y) {
    G.plates.push({
      x: rand(40, VW - 40),
      y: y,
      r: rand(16, 34),
      hue: (Math.random() * 3) | 0,
      spin: rand(0, TAU)
    });
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = comboWindow();
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      floatText(G.player.x, G.player.y - 28, '×' + G.mult, GOLD, true);
    }
    if (comboEl && G.combo >= 2) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
      comboTok += 1;
      const tok = comboTok;
      setTimeout(function () {
        if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
      }, 280);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function fillSword(n) {
    const was = G.sword;
    G.sword = clamp(G.sword + n, 0, 1);
    if (was < 1 && G.sword >= 1) {
      toast('银斩就绪', false, true);
      audio.pow();
    }
    syncSword();
  }

  function pushChain(hue) {
    if (hue == null || hue < 0) return;
    if (G.lockHue >= 0 && hue !== G.lockHue) {
      G.lockHue = -1;
      G.lockT = 0;
      G.chain = [hue];
      audio.brk();
      pulseChain('break');
      toast('连锁断开', true);
      syncChain();
      return;
    }
    G.chain.push(hue);
    if (G.chain.length > 3) G.chain.shift();
    if (G.lockHue >= 0 && hue === G.lockHue) {
      G.lockT = Math.min(8.5, G.lockT + 1.15);
    }
    const locked = G.chain.length === 3
      && G.chain[0] === G.chain[1]
      && G.chain[1] === G.chain[2];
    if (locked && G.lockHue < 0) {
      G.lockHue = G.chain[0];
      G.lockT = 6.4;
      audio.lock();
      pulseChain('hot');
      toast(HUE_NAME[G.lockHue] + '连锁上锁', false, true);
      floatText(G.player.x, G.player.y - 36, HUE_NAME[G.lockHue] + '锁', HUE_RGB[G.lockHue], true);
      screenFlash(HUE_RGB[G.lockHue], 0.42);
      hitStop(0.062);
      kick(4.4, 'lock');
      fillSword(0.22);
    } else if (G.chain.length === 3) {
      pulseChain('hot');
    }
    syncChain();
  }

  function spawnEnt(spec) {
    G.ents.push({
      type: spec.type,
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy || 0,
      r: spec.r || 12,
      hp: spec.hp,
      maxHp: spec.hp,
      hue: spec.hue == null ? 0 : spec.hue,
      rgb: spec.rgb || HUE_RGB[spec.hue == null ? 0 : spec.hue] || MAG,
      score: spec.score || 50,
      t: 0,
      fireCd: spec.fireCd != null ? spec.fireCd : rand(0.4, 1.2),
      flash: 0,
      ground: !!spec.ground,
      drop: spec.drop || null,
      phase: spec.phase || 0,
      spin: spec.spin || 0,
      dive: false,
      name: spec.name || '',
      nodes: spec.nodes || null,
      nodeR: spec.nodeR || 0
    });
  }

  function spawnDart(x, y, extra) {
    const e = extra || {};
    const hue = e.hue == null ? hueOf() : e.hue;
    spawnEnt({
      type: 'dart',
      x: x, y: y,
      vx: e.vx || 0,
      vy: e.vy || 94,
      r: 11,
      hp: isCore() ? 2 : 1,
      hue: hue,
      rgb: HUE_RGB[hue],
      score: SCORE.dart,
      fireCd: rand(0.7, 1.6),
      drop: e.drop || null,
      phase: e.phase || rand(-1, 1)
    });
  }

  function spawnV(n, xmid, hue) {
    const mid = xmid == null ? VW * 0.5 + rand(-40, 40) : xmid;
    const count = n || 5;
    for (let i = 0; i < count; i++) {
      const k = i - (count - 1) / 2;
      const h = hue === 'mix' ? (i % 3) : (hue == null ? (i % 3) : hue);
      spawnDart(mid + k * 28, -18 - Math.abs(k) * 16, {
        vy: 96 + Math.abs(k) * 4,
        phase: k,
        hue: h
      });
    }
  }

  function spawnStream(dir, hue) {
    const side = dir < 0 ? -16 : VW + 16;
    for (let i = 0; i < 6; i++) {
      const h = hue === 'mix' ? (i % 3) : (hue == null ? 0 : hue);
      spawnDart(side, 40 + i * 28, {
        vx: dir * (118 + i * 6),
        vy: 54 + i * 8,
        phase: dir,
        hue: h
      });
    }
  }

  function spawnHelix(n, hue) {
    const count = n || 4;
    for (let i = 0; i < count; i++) {
      const h = hue === 'mix' ? (i % 3) : (hue == null ? 1 : hue);
      spawnEnt({
        type: 'helix',
        x: rand(50, VW - 50),
        y: -24 - i * 22,
        vx: rand(-40, 40),
        vy: 70,
        r: 12,
        hp: isCore() ? 3 : 2,
        hue: h,
        rgb: HUE_RGB[h],
        score: SCORE.helix,
        fireCd: rand(0.6, 1.3),
        phase: rand(0, TAU)
      });
    }
  }

  function spawnFan(hue) {
    const h = hue === 'mix' ? hueOf() : (hue == null ? 0 : hue);
    spawnEnt({
      type: 'fan',
      x: rand(80, VW - 80),
      y: -36,
      vx: rand(-46, 46),
      vy: 62,
      r: 22,
      hp: isCore() ? 8 : 6,
      hue: h,
      rgb: HUE_RGB[h],
      score: SCORE.fan,
      fireCd: 0.7
    });
  }

  function spawnPrism(n) {
    const count = n || 3;
    for (let i = 0; i < count; i++) {
      const h = i % 3;
      spawnEnt({
        type: 'prism',
        x: 80 + i * ((VW - 160) / Math.max(1, count - 1)),
        y: -28 - i * 18,
        vx: 0,
        vy: 58,
        r: 13,
        hp: isCore() ? 5 : 3,
        hue: h,
        rgb: HUE_RGB[h],
        score: SCORE.prism,
        fireCd: rand(0.7, 1.4),
        phase: h
      });
    }
  }

  function spawnGate(x, y, hue) {
    const h = hue === 'mix' ? hueOf() : (hue == null ? 2 : hue);
    spawnEnt({
      type: 'gate',
      x: x, y: y,
      vx: 0, vy: 0,
      r: 14,
      hp: isCore() ? 5 : 4,
      hue: h,
      rgb: HUE_RGB[h],
      score: SCORE.gate,
      ground: true,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnGates(hue) {
    spawnGate(rand(50, 160), -30, hue === 'mix' ? 0 : hue);
    spawnGate(rand(320, 430), -70, hue === 'mix' ? 1 : hue);
    if (G.stage >= 2) spawnGate(rand(180, 300), -110, hue === 'mix' ? 2 : hue);
  }

  function spawnPod() {
    const h = hueOf();
    spawnEnt({
      type: 'pod',
      x: rand(70, VW - 70),
      y: -30,
      vx: 0,
      vy: 58,
      r: 14,
      hp: isCore() ? 5 : 4,
      hue: h,
      rgb: HUE_RGB[h],
      score: SCORE.pod,
      drop: 'sword',
      fireCd: 8,
      phase: Math.random() < 0.5 ? -1 : 1
    });
  }

  function hpMul() {
    return isCore() ? 1.24 : 1;
  }

  function spawnMid() {
    const st = STAGES[G.stage - 1];
    const h = G.stage === 1 ? 0 : G.stage === 2 ? 1 : 2;
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -70,
      vx: 72,
      vy: 88,
      r: 36,
      hp: Math.round((st ? st.midHp : 40) * hpMul()),
      hue: h,
      rgb: HUE_RGB[h],
      score: SCORE.mid,
      fireCd: 0.8,
      name: st ? st.mid : '中'
    });
    audio.boss();
    toast((st ? st.mid : '中') + ' 出现', false, true);
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    const core = G.stage >= 3;
    const nodes = core
      ? [
        { hue: 0, a: 0, hp: Math.round(14 * hpMul()), maxHp: Math.round(14 * hpMul()), deadT: 0 },
        { hue: 1, a: TAU / 3, hp: Math.round(14 * hpMul()), maxHp: Math.round(14 * hpMul()), deadT: 0 },
        { hue: 2, a: TAU * 2 / 3, hp: Math.round(14 * hpMul()), maxHp: Math.round(14 * hpMul()), deadT: 0 }
      ]
      : null;
    spawnEnt({
      type: 'boss',
      x: VW * 0.5,
      y: -90,
      vx: core ? 50 : 64,
      vy: 70,
      r: core ? 58 : 50,
      hp: Math.round((st ? st.bossHp : 90) * hpMul()),
      hue: core ? 1 : (G.stage === 1 ? 2 : 1),
      rgb: core ? SLV : HUE_RGB[G.stage === 1 ? 2 : 1],
      score: SCORE.boss,
      fireCd: 0.7,
      name: st ? st.boss : 'Boss',
      nodes: nodes,
      nodeR: core ? 52 : 0
    });
    audio.boss();
    toast((st ? st.boss : '银核') + ' 降临', false, true);
    screenFlash(core ? SLV : GOLD, 0.3);
    kick(4.2, 'boss');
  }

  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'boss' || t === 'mid') && G.ents[i].hp > 0) return true;
    }
    return false;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n, null, w.hue);
    else if (w.kind === 'stream') spawnStream(w.dir || 1, w.hue);
    else if (w.kind === 'helix') spawnHelix(w.n, w.hue);
    else if (w.kind === 'fan') spawnFan(w.hue);
    else if (w.kind === 'prism') spawnPrism(w.n);
    else if (w.kind === 'gates') spawnGates(w.hue);
    else if (w.kind === 'pod') spawnPod();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y,
      vx: rand(-40, 40),
      vy: 48,
      t: 0,
      kind: kind || 'sword',
      hue: (Math.random() * 3) | 0
    });
  }

  function eShot(x, y, vx, vy, rgb, r, hue) {
    if (G.eShots.length >= shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      rgb: rgb || MAG, r: r || 3.2, wave: false,
      hue: hue == null ? -1 : hue
    });
  }

  function aimShot(x, y, spd, rgb, r, hue) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = hypot(dx, dy) || 1;
    eShot(x, y, dx / len * spd, dy / len * spd, rgb, r, hue);
  }

  function ringShot(x, y, n, spd, rot, rgb, r, hue) {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r, hue);
    }
  }

  function fanShot(x, y, a0, n, spd, rgb, hue) {
    const count = n || 5;
    for (let i = 0; i < count; i++) {
      const a = a0 + (i - (count - 1) / 2) * 0.22;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, 3.4, hue);
    }
  }

  function nodePos(en, node) {
    return {
      x: en.x + Math.cos(en.spin + node.a) * en.nodeR,
      y: en.y + Math.sin(en.spin + node.a) * en.nodeR * 0.62
    };
  }

  function nearestEnt(x, y, hue) {
    let best = null;
    let bd = 1e9;
    let bestMatch = null;
    let bdMatch = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dx = en.x - x;
      const dy = en.y - y;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = en;
      }
      if (hue != null && en.hue === hue && d < bdMatch) {
        bdMatch = d;
        bestMatch = en;
      }
      if (en.nodes) {
        for (let k = 0; k < en.nodes.length; k++) {
          const nd = en.nodes[k];
          if (nd.hp <= 0) continue;
          const p = nodePos(en, nd);
          const d2 = (p.x - x) * (p.x - x) + (p.y - y) * (p.y - y);
          if (d2 < bd) {
            bd = d2;
            best = en;
          }
          if (hue != null && nd.hue === hue && d2 < bdMatch) {
            bdMatch = d2;
            bestMatch = en;
          }
        }
      }
    }
    return bestMatch || best;
  }

  function addShot(spec) {
    if (G.shots.length > 64) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      kind: spec.kind || 'vulc',
      hue: spec.hue == null ? 1 : spec.hue,
      pierce: spec.pierce || 0,
      dmg: spec.dmg || 1,
      trail: spec.trail || null,
      age: 0
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const x = G.player.x;
    const y = G.player.y - 14;
    G.muzzle = 0.05;
    G.fireCd = 0.086;
    const lock = G.lockHue >= 0;
    addShot({
      x: x, y: y - 2,
      vx: 0, vy: -740,
      r: 3.4,
      rgb: GOLD,
      kind: 'vulc',
      hue: 1,
      dmg: lock && G.lockHue === 1 ? 1.6 : 1.2
    });
    addShot({
      x: x - 9, y: y + 2,
      vx: -36, vy: -560,
      r: 3.8,
      rgb: RED,
      kind: 'home',
      hue: 0,
      dmg: 1,
      trail: REDUCE ? null : []
    });
    addShot({
      x: x + 9, y: y + 2,
      vx: 70, vy: -640,
      r: 3.2,
      rgb: BLU,
      kind: 'spread',
      hue: 2,
      dmg: 1
    });
    addShot({
      x: x + 15, y: y + 6,
      vx: 148, vy: -580,
      r: 2.8,
      rgb: BLU,
      kind: 'spread',
      hue: 2,
      dmg: 0.9
    });
    addShot({
      x: x - 15, y: y + 6,
      vx: -148, vy: -580,
      r: 2.8,
      rgb: RED,
      kind: 'spread',
      hue: 0,
      dmg: 0.85
    });
    audio.shoot();
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: lock ? HUE_RGB[G.lockHue] : GOLD,
      g: 0
    });
  }

  function trySword() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.swordT > 0) return;
    if (G.sword < 1) {
      toast('银斩未满', true);
      audio.miss();
      return;
    }
    let dx = G.lastAim.x;
    let dy = G.lastAim.y;
    const len = hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    G.sword = 0;
    G.swordT = SWORD_T;
    G.swordHit.length = 0;
    G.swordDir.x = dx;
    G.swordDir.y = dy;
    G.invuln = Math.max(G.invuln, 0.32);
    G.slashes.push({
      x: G.player.x, y: G.player.y,
      dx: dx, dy: dy, t: 0, life: 0.28
    });
    audio.sword();
    screenFlash(SLV, 0.4);
    popSpark(G.player.x, G.player.y - 8, GOLD, 30);
    rings.push({ x: G.player.x, y: G.player.y, t: 0, rgb: SLV, r: 16 });
    emit(18, {
      x: G.player.x, y: G.player.y, j: 10,
      vx0: -200, vx1: 200, vy0: -260, vy1: 60,
      life: 0.3, r0: 1.4, r1: 3.6, rgb: SLV, g: 40
    });
    hitStop(0.052);
    kick(5.6, 'sword');
    syncSword();
  }

  function swordMarked(obj) {
    if (G.swordHit.indexOf(obj) >= 0) return true;
    G.swordHit.push(obj);
    return false;
  }

  function swordStrike() {
    const px = G.player.x + G.swordDir.x * 16;
    const py = G.player.y + G.swordDir.y * 16;
    const rad = 28;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      const dx = s.x - px;
      const dy = s.y - py;
      if (dx * dx + dy * dy < rad * rad) {
        emit(2, {
          x: s.x, y: s.y, j: 2,
          vx0: -70, vx1: 70, vy0: -70, vy1: 40,
          life: 0.14, r0: 1, r1: 2.2, rgb: SLV, g: 0
        });
        addScore(SCORE.shred);
        G.eShots.splice(i, 1);
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      if (en.nodes) {
        for (let k = 0; k < en.nodes.length; k++) {
          const nd = en.nodes[k];
          if (nd.hp <= 0) continue;
          const p = nodePos(en, nd);
          const dx = p.x - px;
          const dy = p.y - py;
          if (dx * dx + dy * dy < (rad + 10) * (rad + 10)) {
            if (!swordMarked(nd)) hurtNode(en, nd, 6, p.x, p.y, true);
          }
        }
      }
      const dx = en.x - px;
      const dy = en.y - py;
      const rr = rad + en.r;
      if (dx * dx + dy * dy < rr * rr) {
        if (swordMarked(en)) continue;
        const dmg = en.type === 'boss' ? 12 : en.type === 'mid' ? 9 : 8;
        hurtEnt(en, dmg, en.x, en.y, true);
      }
    }
  }

  function shotDmg(s, hue) {
    let d = s.dmg || 1;
    if (s.hue === hue) d *= 2;
    if (G.lockHue >= 0 && hue === G.lockHue) d *= 1.5;
    return d;
  }

  function hurtNode(en, nd, dmg, hx, hy, fromSword) {
    if (nd.hp <= 0) return;
    nd.hp -= dmg;
    en.flash = 0.08;
    if (nd.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -80, vx1: 80, vy0: -90, vy1: 40,
        life: 0.16, r0: 1, r1: 2, rgb: HUE_RGB[nd.hue], g: 180
      });
      hitStop(0.03);
      return;
    }
    nd.hp = 0;
    nd.deadT = 4.2;
    juice(hx, hy, HUE_RGB[nd.hue], 1.6);
    audio.boom(false);
    bumpCombo();
    pushChain(nd.hue);
    addScore(SCORE.node * G.mult * (G.lockHue === nd.hue ? 2 : 1));
    floatText(hx, hy - 10, HUE_NAME[nd.hue] + '核破', HUE_RGB[nd.hue], true);
    hurtEnt(en, fromSword ? 10 : 8, hx, hy, fromSword);
    fillSword(0.16);
    hitStop(0.055);
  }

  function hurtEnt(en, dmg, hx, hy, fromSword) {
    if (en.hp <= 0) return;
    en.hp -= dmg || 1;
    en.flash = 0.08;
    fillSword((fromSword ? 0.028 : 0.016) * (G.lockHue === en.hue ? 1.4 : 1));
    if (en.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -80, vx1: 80, vy0: -90, vy1: 40,
        life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
      });
      if (en.type === 'boss' || en.type === 'mid') hitStop(0.03);
      return;
    }
    killEnt(en, fromSword);
  }

  function killEnt(en, fromSword) {
    if (en.hp < -90) return;
    en.hp = -99;
    bumpCombo();
    pushChain(en.hue);
    const pwr = en.type === 'boss' ? 2.8 : en.type === 'mid' ? 2.15 : en.type === 'fan' ? 1.3 : 0.88;
    juice(en.x, en.y, en.rgb, pwr);
    audio.hit(G.combo, en.hue);
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    let pts = (en.score || 50) * G.mult;
    if (G.lockHue >= 0 && en.hue === G.lockHue) pts *= 2;
    if (fromSword) pts = Math.round(pts * 1.15);
    pts = Math.round(pts);
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    fillSword(en.type === 'boss' || en.type === 'mid' ? 0.35 : 0.08);
    if (en.drop === 'sword') spawnPow(en.x, en.y, 'sword');
    else if ((en.type === 'fan' || en.type === 'prism') && Math.random() < 0.2) spawnPow(en.x, en.y, 'sword');
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
    fillSword(0.45);
    toast('银斩充能', false, true);
    juice(p.x, p.y, GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, '斩', GOLD, true);
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.swordT = 0;
    G.lockHue = -1;
    G.lockT = 0;
    G.chain = [];
    breakCombo();
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2, 'die');
    screenFlash(MAG, 0.55);
    pulseChain('break');
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    G.sword = Math.max(G.sword, 0.35);
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
    addScore(SCORE.clear);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '银核尽破', (isCore() ? '银核通关' : '三关打穿') + ' · 分数 ' + G.score);
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

  function coreThink(dt) {
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
    G.spawnT = clamp(1.42 / (1 + G.stage * 0.12), 0.38, 1.42);
    if (livingCount() > 28) return;
    const r = Math.random();
    const h = (Math.random() * 3) | 0;
    if (r < 0.28) spawnV(5 + (Math.random() * 6) | 0, null, Math.random() < 0.45 ? h : 'mix');
    else if (r < 0.48) spawnStream(Math.random() < 0.5 ? -1 : 1, h);
    else if (r < 0.64) spawnHelix(3 + (Math.random() * 4) | 0, h);
    else if (r < 0.76) spawnFan(h);
    else if (r < 0.86) spawnPrism(3);
    else if (r < 0.93) spawnPod();
    else spawnGates('mix');
  }

  function bossFire(en, core) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += core ? 0.22 : 0.16;
    const rgb = HUE_RGB[en.hue] || SLV;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 16, core ? 214 : 178, rgb, 3.2, en.hue);
      eShot(en.x - 20, en.y + 10, -50, 190, rgb, 3, en.hue);
      eShot(en.x + 20, en.y + 10, 50, 190, rgb, 3, en.hue);
      if (mid) fanShot(en.x, en.y + 12, Math.PI * 0.5, core ? 9 : 7, 168, rgb, en.hue);
      if (low) {
        aimShot(en.x - 24, en.y + 8, 206, MAG, 3.2, en.hue);
        aimShot(en.x + 24, en.y + 8, 206, MAG, 3.2, en.hue);
      }
      en.fireCd = low ? 0.32 : mid ? 0.46 : 0.62;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 18, 216, rgb, 3.2, en.hue);
      eShot(en.x - 28, en.y + 12, -54, 198, RED, 3, 0);
      eShot(en.x + 28, en.y + 12, 54, 198, BLU, 3, 2);
      if (mid) fanShot(en.x, en.y + 14, Math.PI * 0.5, core ? 11 : 8, 160, GOLD, 1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 44, 210, rgb, 3, en.hue);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.54;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, core ? 14 : 11, 148, en.spin, RED, 3.15, 0);
      fanShot(en.x, en.y + 10, Math.PI * 0.5 + Math.sin(en.t) * 0.2, 8, 154, GOLD, 1);
      if (mid) {
        ringShot(en.x, en.y + 8, core ? 10 : 8, 118, -en.spin * 1.4, BLU, 3.0, 2);
        aimShot(en.x, en.y + 16, 204, GOLD, 3.2, 1);
      }
      if (low) {
        aimShot(en.x - 30, en.y + 10, 224, RED, 3.2, 0);
        aimShot(en.x + 30, en.y + 10, 224, BLU, 3.2, 2);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.56;
    } else {
      ringShot(en.x, en.y + 6, core ? 14 : 11, 132, en.spin, SLV, 3.2, -1);
      if (en.nodes) {
        for (let i = 0; i < en.nodes.length; i++) {
          const nd = en.nodes[i];
          if (nd.hp <= 0) continue;
          const p = nodePos(en, nd);
          aimShot(p.x, p.y, core ? 196 : 168, HUE_RGB[nd.hue], 3.1, nd.hue);
          if (mid) fanShot(p.x, p.y, Math.PI * 0.5, 5, 150, HUE_RGB[nd.hue], nd.hue);
        }
      }
      if (low) {
        ringShot(en.x, en.y, core ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4, 1);
        fanShot(en.x, en.y + 6, Math.PI * 0.5, core ? 13 : 10, 188, MAG, -1);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (core) en.fireCd *= 0.76;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0 || G.swordT > 0;
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
      if (en.nodes) {
        en.spin += dt * (core ? 1.15 : 0.9);
        for (let k = 0; k < en.nodes.length; k++) {
          const nd = en.nodes[k];
          if (nd.hp <= 0) {
            nd.deadT -= dt;
            if (nd.deadT <= 0) {
              nd.hp = nd.maxHp;
              nd.deadT = 0;
              const p = nodePos(en, nd);
              popSpark(p.x, p.y, HUE_RGB[nd.hue], 16);
            }
          }
        }
      }
      if (en.type === 'prism') {
        const step = ((en.t / 0.82) | 0) % 3;
        if (step !== en.hue) {
          en.hue = step;
          en.rgb = HUE_RGB[en.hue];
        }
      }
      if (en.ground) {
        en.y += scr * dt;
      } else if (en.type === 'mid' || en.type === 'boss') {
        const ty = en.type === 'boss' ? (G.stage >= 3 ? 124 : 108) : 124;
        if (en.y < ty) en.y += en.vy * dt;
        else {
          en.y = ty;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? (G.stage >= 3 ? 108 : 92) : 78;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
      } else if (en.type === 'pod') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'helix') {
        en.phase += dt * 4.2;
        en.x += Math.cos(en.phase) * 118 * dt + en.vx * dt * 0.2;
        en.y += (en.vy + 46) * dt;
      } else if (en.type === 'dart') {
        if (!en.dive && en.t > 1.22 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.22) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 96, dt * 2);
          en.vy = Math.max(en.vy, 158);
        } else {
          en.x += Math.sin(en.t * 3 + en.phase) * 28 * dt;
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'fan' || en.type === 'prism') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.type === 'fan' && (en.x < 50 || en.x > VW - 50)) en.vx *= -1;
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
          const rgb = HUE_RGB[en.hue] || MAG;
          if (en.type === 'dart' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, core ? 202 : 174, rgb, 3.1, en.hue);
            if (core && Math.random() < 0.45) aimShot(en.x, en.y + 8, 170, rgb, 3, en.hue);
            en.fireCd = (core ? 1.28 : 2.2) + rand(0, 0.55);
          } else if (en.type === 'helix' && en.y > 20 && en.y < VH - 80) {
            aimShot(en.x, en.y + 8, core ? 196 : 164, rgb, 3.1, en.hue);
            en.fireCd = (core ? 1.05 : 1.55) + rand(0, 0.4);
          } else if (en.type === 'fan') {
            eShot(en.x - 12, en.y + 12, -36, 180, rgb, 3.2, en.hue);
            eShot(en.x, en.y + 14, 0, 202, rgb, 3.2, en.hue);
            eShot(en.x + 12, en.y + 12, 36, 180, rgb, 3.2, en.hue);
            if (core) aimShot(en.x, en.y + 10, 188, rgb, 3.1, en.hue);
            en.fireCd = core ? 0.7 : 1.02;
          } else if (en.type === 'gate' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, core ? 216 : 176, rgb, 3.2, en.hue);
            if (core) {
              eShot(en.x - 8, en.y + 4, -42, 164, rgb, 3, en.hue);
              eShot(en.x + 8, en.y + 4, 42, 164, rgb, 3, en.hue);
            }
            en.fireCd = (core ? 0.76 : 1.12) + rand(0, 0.28);
          } else if (en.type === 'prism' && en.y > 8 && en.y < VH - 70) {
            fanShot(en.x, en.y + 6, Math.PI * 0.5, core ? 7 : 5, 158, rgb, en.hue);
            en.fireCd = core ? 0.72 : 1.05;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, core);
            else en.fireCd = 0.4;
          } else {
            en.fireCd = 2;
          }
        }
      }

      if (canHurt && G.swordT <= 0) {
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
      s.age += dt;
      if (s.kind === 'home') {
        const t = nearestEnt(s.x, s.y, s.hue);
        if (t) {
          let tx = t.x;
          let ty = t.y;
          if (t.nodes) {
            let best = null;
            let bd = 1e9;
            for (let k = 0; k < t.nodes.length; k++) {
              const nd = t.nodes[k];
              if (nd.hp <= 0) continue;
              const p = nodePos(t, nd);
              const d = (p.x - s.x) * (p.x - s.x) + (p.y - s.y) * (p.y - s.y);
              const prefer = nd.hue === s.hue ? 0.55 : 1;
              if (d * prefer < bd) {
                bd = d * prefer;
                best = p;
              }
            }
            if (best) {
              tx = best.x;
              ty = best.y;
            }
          }
          const dx = tx - s.x;
          const dy = ty - s.y;
          const len = hypot(dx, dy) || 1;
          const spd = hypot(s.vx, s.vy) || 560;
          const wantX = dx / len * spd;
          const wantY = dy / len * spd;
          const turn = 1 - Math.exp(-dt * 4.4);
          s.vx = lerp(s.vx, wantX, turn);
          s.vy = lerp(s.vy, wantY, turn);
        }
        if (s.trail) {
          s.trail.push({ x: s.x, y: s.y });
          if (s.trail.length > 10) s.trail.shift();
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -28 || s.x < -22 || s.x > VW + 22 || s.y > VH + 28 || s.age > 1.7) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (s.struck && s.struck.indexOf(en) >= 0) continue;
        if (en.nodes) {
          let nodeHit = false;
          for (let k = 0; k < en.nodes.length; k++) {
            const nd = en.nodes[k];
            if (nd.hp <= 0) continue;
            const p = nodePos(en, nd);
            const dx = p.x - s.x;
            const dy = p.y - s.y;
            const rr = 12 + s.r;
            if (dx * dx + dy * dy < rr * rr) {
              hurtNode(en, nd, shotDmg(s, nd.hue), s.x, s.y, false);
              nodeHit = true;
              hit = true;
              break;
            }
          }
          if (nodeHit) break;
        }
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          if (!s.struck) s.struck = [];
          s.struck.push(en);
          hurtEnt(en, shotDmg(s, en.hue), s.x, s.y, false);
          if (s.pierce > 0) s.pierce -= 1;
          else hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && G.swordT <= 0;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.age = (s.age || 0) + dt;
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
    G.nextPlate -= scr * dt;
    if (G.nextPlate <= 0) {
      G.nextPlate = rand(64, 120);
      spawnPlate(-70);
    }
    for (let i = G.plates.length - 1; i >= 0; i--) {
      G.plates[i].y += scr * dt;
      G.plates[i].spin += dt * 0.4;
      if (G.plates[i].y - G.plates[i].r > VH + 20) G.plates.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += scr * 0.38 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
    G.waveT -= dt;
    if (G.waveT <= 0) {
      G.waveT = rand(1.2, 2.8);
      if (!REDUCE && G.mode !== 'lose') {
        beams.push({
          x: rand(30, VW - 30),
          y: rand(20, 240),
          t: 0,
          life: 0.9,
          hue: (Math.random() * 3) | 0
        });
      }
    }
    for (let i = beams.length - 1; i >= 0; i--) {
      beams[i].t += dt;
      if (beams[i].t >= beams[i].life) beams.splice(i, 1);
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
    for (let i = G.slashes.length - 1; i >= 0; i--) {
      G.slashes[i].t += dt;
      if (G.slashes[i].t >= G.slashes[i].life) G.slashes.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.toastT > 0) G.toastT -= dt;
  }

  function updatePlayer(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    if (G.swordT > 0) {
      const spd = 640;
      G.player.x += G.swordDir.x * spd * dt;
      G.player.y += G.swordDir.y * spd * dt;
      G.player.x = clamp(G.player.x, 22, VW - 22);
      G.player.y = clamp(G.player.y, 40, VH - 28);
      G.player.vx = G.swordDir.x * spd;
      G.player.vy = G.swordDir.y * spd;
      swordStrike();
      return;
    }
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
      G.lastAim.x = dx;
      G.lastAim.y = dy;
      inputSrc = 'key';
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      const oxp = tx - G.player.x;
      const oyp = ty - G.player.y;
      if (hypot(oxp, oyp) > 6) {
        G.lastAim.x = oxp;
        G.lastAim.y = oyp;
      }
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
      if (G.spawnT <= 0 && livingCount() < 8) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 40, (Math.floor(G.t) % 3));
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
    if (G.swordT > 0) G.swordT -= dt;
    if (G.lockHue >= 0) {
      G.lockT -= dt;
      if (G.lockT <= 0) {
        G.lockHue = -1;
        G.lockT = 0;
        pulseChain('break');
        toast('锁时到', true);
        syncChain();
      }
    }
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
        fillSword(0.28);
        G.invuln = Math.max(G.invuln, 0.85);
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        addScore(SCORE.stage);
        syncHud();
      }
    }

    updateWorld(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isCore()) coreThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#081428');
      g.addColorStop(0.5, '#06101c');
      g.addColorStop(1, '#040c14');
    } else if (G.stage >= 3) {
      g.addColorStop(0, '#120814');
      g.addColorStop(0.45, '#08101c');
      g.addColorStop(1, '#040c14');
    } else {
      g.addColorStop(0, '#0a1828');
      g.addColorStop(0.55, '#061018');
      g.addColorStop(1, '#040c14');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const cols = [
      { x: VW * 0.18, rgb: RED },
      { x: VW * 0.5, rgb: GOLD },
      { x: VW * 0.82, rgb: BLU }
    ];
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      const a = G.lockHue === i ? 0.16 : 0.055;
      const lg = ctx.createLinearGradient(sx(c.x), sy(0), sx(c.x), sy(VH));
      lg.addColorStop(0, rgba(c.rgb, 0));
      lg.addColorStop(0.4, rgba(c.rgb, a));
      lg.addColorStop(1, rgba(c.rgb, 0.02));
      ctx.fillStyle = lg;
      ctx.fillRect(sx(c.x - 18), sy(0), 36 * scale, VH * scale);
    }

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = rgba(HUE_RGB[s.hue], s.a);
      ctx.fillRect(sx(s.x), sy(s.y), Math.max(1, s.z * scale), Math.max(1, s.z * 1.7 * scale));
    }

    const off = G.scroll % 48;
    ctx.lineWidth = 1.1 * scale;
    for (let y = -48; y < VH + 48; y += 48) {
      const yy = y + (48 - off);
      ctx.strokeStyle = rgba(G.lockHue >= 0 ? HUE_RGB[G.lockHue] : HOT, 0.05 + ((y / 48 | 0) % 2 === 0 ? 0.02 : 0));
      ctx.beginPath();
      for (let x = 0; x <= VW; x += 16) {
        const yy2 = yy + Math.sin((x + G.scroll) * 0.02 + G.t) * 3.2;
        if (x === 0) ctx.moveTo(sx(x), sy(yy2));
        else ctx.lineTo(sx(x), sy(yy2));
      }
      ctx.stroke();
    }

    for (let i = 0; i < beams.length; i++) {
      const w = beams[i];
      const a = 1 - w.t / w.life;
      ctx.strokeStyle = rgba(HUE_RGB[w.hue], a * 0.4);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(w.y), (16 + w.t * 64) * scale, (7 + w.t * 20) * scale, 0, 0, TAU);
      ctx.stroke();
    }

    for (let i = 0; i < G.plates.length; i++) {
      const p = G.plates[i];
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.rotate(p.spin);
      ctx.scale(scale, scale);
      ctx.strokeStyle = rgba(HUE_RGB[p.hue], 0.22);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU;
        const px = Math.cos(a) * p.r;
        const py = Math.sin(a) * p.r * 0.62;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(8, 20, 32, 0.72)';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShip(x, y, a) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.player.vx * 0.0014);
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    if (G.swordT > 0) {
      ctx.shadowColor = rgba(GOLD, 0.85);
      ctx.shadowBlur = 18;
    } else {
      ctx.shadowColor = rgba(BLU, 0.5);
      ctx.shadowBlur = 12;
    }
    const flash = G.muzzle > 0;
    ctx.fillStyle = flash ? '#f4f8ff' : rgba(SLV, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(5.2, -4);
    ctx.lineTo(13, 6);
    ctx.lineTo(4.4, 3);
    ctx.lineTo(5.2, 13);
    ctx.lineTo(0, 8);
    ctx.lineTo(-5.2, 13);
    ctx.lineTo(-4.4, 3);
    ctx.lineTo(-13, 6);
    ctx.lineTo(-5.2, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(BLU, 0.95);
    ctx.fillRect(-1.5, -13, 3, 14);
    ctx.fillStyle = rgba(RED, 0.92);
    ctx.fillRect(-12, 3, 6, 2.4);
    ctx.fillStyle = rgba(BLU, 0.92);
    ctx.fillRect(6, 3, 6, 2.4);
    const pr = Math.sin(G.t * 48);
    ctx.fillStyle = rgba(GOLD, 0.72 + pr * 0.22);
    ctx.beginPath();
    ctx.moveTo(-3.2, 11);
    ctx.lineTo(0, 18 + pr * 3);
    ctx.lineTo(3.2, 11);
    ctx.closePath();
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.moveTo(-3.2, -18);
      ctx.lineTo(0, -30);
      ctx.lineTo(3.2, -18);
      ctx.fill();
      ctx.fillStyle = rgba(RED, 0.8);
      ctx.fillRect(-11, -6, 4, 8);
      ctx.fillStyle = rgba(BLU, 0.8);
      ctx.fillRect(7, -6, 4, 8);
    }
    if (G.swordT > 0) {
      const ang = Math.atan2(G.swordDir.y, G.swordDir.x);
      ctx.rotate(ang + Math.PI * 0.5);
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-18, -8);
      ctx.lineTo(0, -34);
      ctx.lineTo(18, -8);
      ctx.stroke();
      ctx.strokeStyle = rgba(SLV, 0.85);
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(0, -26);
      ctx.lineTo(10, -4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
    ctx.shadowColor = rgba(en.rgb, G.lockHue === en.hue ? 0.85 : 0.5);
    ctx.shadowBlur = G.lockHue === en.hue ? 14 : 10;
    if (en.type === 'dart' || en.type === 'helix') {
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(9, 2);
      ctx.lineTo(3, 1);
      ctx.lineTo(2.4, -11);
      ctx.lineTo(-2.4, -11);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-9, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.32);
      ctx.fillRect(-1.1, -2, 2.2, 7);
    } else if (en.type === 'fan') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-20, -4, 9, 16);
      ctx.fillRect(11, -4, 9, 16);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-7, -4, 14, 5);
    } else if (en.type === 'gate') {
      ctx.fillStyle = 'rgba(10, 22, 34, 0.95)';
      ctx.fillRect(-13, -8, 26, 18);
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.fillRect(-10, -3, 20, 6);
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, TAU);
      ctx.fill();
    } else if (en.type === 'prism') {
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 13);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.35);
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'pod') {
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, 13);
      ctx.lineTo(10, 1);
      ctx.lineTo(3, 1);
      ctx.lineTo(2, -12);
      ctx.lineTo(-2, -12);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-10, 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#061018';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('斩', 0, 2);
    } else if (en.type === 'mid') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 40, 15, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-34, -7, 13, 26);
      ctx.fillRect(21, -7, 13, 26);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-8, -2, 16, 8);
    } else if (en.type === 'boss') {
      const huge = G.stage >= 3;
      ctx.beginPath();
      ctx.ellipse(0, 4, huge ? 62 : 52, huge ? 22 : 16, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(huge ? -52 : -44, -10, huge ? 16 : 14, huge ? 34 : 28);
      ctx.fillRect(-12, huge ? -16 : -12, 24, huge ? 44 : 36);
      ctx.fillRect(huge ? 36 : 30, -10, huge ? 16 : 14, huge ? 34 : 28);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(huge ? -34 : -28, -2, huge ? 68 : 56, 7);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.arc(0, 4, huge ? 10 : 7, 0, TAU);
      ctx.fill();
    }
    if (G.lockHue === en.hue && en.hp > 0) {
      ctx.strokeStyle = rgba(HUE_RGB[en.hue], 0.7);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, en.r + 5, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    if (en.nodes) {
      for (let k = 0; k < en.nodes.length; k++) {
        const nd = en.nodes[k];
        if (nd.hp <= 0) continue;
        const p = nodePos(en, nd);
        ctx.save();
        ctx.translate(sx(p.x), sy(p.y));
        ctx.scale(scale, scale);
        ctx.fillStyle = flash ? '#fff' : rgba(HUE_RGB[nd.hue], 0.95);
        ctx.shadowColor = rgba(HUE_RGB[nd.hue], 0.85);
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.45);
        ctx.beginPath();
        ctx.arc(-2, -2, 3.4, 0, TAU);
        ctx.fill();
        const t = clamp(nd.hp / nd.maxHp, 0, 1);
        ctx.strokeStyle = rgba(WHT, 0.35);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, 14, -Math.PI * 0.5, -Math.PI * 0.5 + TAU * t);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      if (s.kind === 'home' && s.trail && s.trail.length > 1) {
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx(s.trail[0].x), sy(s.trail[0].y));
        for (let k = 1; k < s.trail.length; k++) ctx.lineTo(sx(s.trail[k].x), sy(s.trail[k].y));
        ctx.strokeStyle = rgba(s.rgb, 0.32);
        ctx.lineWidth = 7 * scale;
        ctx.shadowColor = rgba(s.rgb, 0.8);
        ctx.shadowBlur = 10 * scale;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx(s.trail[0].x), sy(s.trail[0].y));
        for (let k = 1; k < s.trail.length; k++) ctx.lineTo(sx(s.trail[k].x), sy(s.trail[k].y));
        ctx.strokeStyle = rgba(WHT, 0.9);
        ctx.lineWidth = 2.2 * scale;
        ctx.shadowBlur = 0;
        ctx.stroke();
      } else if (s.kind === 'vulc') {
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.shadowColor = rgba(s.rgb, 0.85);
        ctx.shadowBlur = 9 * scale;
        ctx.fillRect(sx(s.x - 1.5), sy(s.y - 7), 3 * scale, 13 * scale);
      } else {
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.shadowColor = rgba(s.rgb, 0.8);
        ctx.shadowBlur = 8 * scale;
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
        ctx.fill();
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
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.rotate(p.t * 2.2);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.shadowColor = rgba(GOLD, 0.8);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#061018';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.2);
      ctx.shadowBlur = 0;
      ctx.fillText('斩', 0, 1);
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
    for (let i = 0; i < G.slashes.length; i++) {
      const sl = G.slashes[i];
      const a = 1 - sl.t / sl.life;
      ctx.save();
      ctx.strokeStyle = rgba(GOLD, a * 0.9);
      ctx.lineWidth = 4 * a * scale;
      ctx.beginPath();
      const x = sl.x + sl.dx * (20 + sl.t * 80);
      const y = sl.y + sl.dy * (20 + sl.t * 80);
      const px = -sl.dy;
      const py = sl.dx;
      ctx.moveTo(sx(x + px * 22), sy(y + py * 22));
      ctx.lineTo(sx(x - px * 22), sy(y - py * 22));
      ctx.stroke();
      ctx.restore();
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
    const rgb = t < 0.34 ? MAG : t < 0.62 ? GOLD : BLU;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.shadowColor = rgba(rgb, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    if (boss.name) {
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.font = 'bold ' + (9 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(boss.name, sx(x), sy(y - 4));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#040c14';
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
    G.plates.length = 0;
    G.slashes.length = 0;
    G.swordHit.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    beams.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'gun';
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
    G.chain = [];
    G.lockHue = -1;
    G.lockT = 0;
    G.sword = 0.4;
    G.swordT = 0;
    G.swordDir.x = 0;
    G.swordDir.y = -1;
    G.lastAim.x = 0;
    G.lastAim.y = -1;
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
    G.nextPlate = 28;
    G.waveT = 1.2;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedStars();
    seedPlates();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '银核 · 更密更快' : '银枪 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'gun';
    G.stage = 1;
    G.lives = LIVES;
    G.sword = 0;
    G.swordT = 0;
    G.combo = 0;
    G.mult = 1;
    G.chain = [];
    G.lockHue = -1;
    G.deadT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedStars();
    seedPlates();
    showOverlay('title', '银枪', '三色连锁。空格赤金蓝齐射，同色三杀上锁，Shift 银斩冲刺。撞机扣一命。短关之后是银核。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('gun');
    else startGame(G.kind || 'gun');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('gun');
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
    const isSword = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
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

    if (down && (isMove || space || isSword || k === 'Enter')) e.preventDefault();

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
    if (isSword) {
      if (!e.repeat) trySword();
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

  if (btnGun) {
    btnGun.addEventListener('click', function () {
      audio.ensure();
      startGame('gun');
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
      startGame(G.kind || 'gun');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && !isCore()) startGame('core');
      else goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnSword) btnSword.addEventListener('click', trySword);
  if (btnPad) btnPad.addEventListener('click', trySword);
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
