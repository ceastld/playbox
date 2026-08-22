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
  const BEST_KEY = 'playbox-star-force-best';
  const MUTE_KEY = 'playbox-star-force-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [58, 160, 255];
  const SKY = [92, 200, 255];
  const HOT = [106, 212, 255];
  const GOLD = [255, 227, 107];
  const ORG = [255, 140, 64];
  const RED = [255, 72, 96];
  const WHT = [246, 250, 255];
  const PNK = [255, 154, 212];
  const DIRT = [180, 120, 70];

  const STAGES = [
    {
      name: '荒原',
      boss: '前哨堡',
      hp: 96,
      waves: [
        { t: 0.7, kind: 'scouts', n: 5 },
        { t: 2.2, kind: 'pads', n: 3 },
        { t: 3.4, kind: 'fighters', n: 4 },
        { t: 5.0, kind: 'hidden', letter: 'S' },
        { t: 6.2, kind: 'turret' },
        { t: 7.8, kind: 'dive', n: 3 },
        { t: 9.4, kind: 'lane' },
        { t: 11.0, kind: 'scouts', n: 6 },
        { t: 12.6, kind: 'pads', n: 2 },
        { t: 14.0, kind: 'hidden' },
        { t: 15.4, kind: 'gun' },
        { t: 17.2, kind: 'fighters', n: 5 },
        { t: 19.6, kind: 'bunker' },
        { t: 21.4, kind: 'dive', n: 4 },
        { t: 23.6, kind: 'lane' },
        { t: 25.2, kind: 'scouts', n: 7 },
        { t: 27.4, kind: 'turret' },
        { t: 29.0, kind: 'hidden', letter: 'O' },
        { t: 31.0, kind: 'fighters', n: 6 },
        { t: 33.6, kind: 'gun' },
        { t: 36.2, kind: 'pads', n: 3 },
        { t: 39.2, kind: 'boss' }
      ]
    },
    {
      name: '峡谷',
      boss: '峡谷要塞',
      hp: 140,
      waves: [
        { t: 0.5, kind: 'scouts', n: 7 },
        { t: 1.8, kind: 'fighters', n: 5 },
        { t: 3.2, kind: 'turret' },
        { t: 4.4, kind: 'hidden', letter: 'S' },
        { t: 5.6, kind: 'dive', n: 4 },
        { t: 7.0, kind: 'lane' },
        { t: 8.4, kind: 'gun' },
        { t: 10.0, kind: 'pads', n: 4 },
        { t: 11.6, kind: 'fighters', n: 6 },
        { t: 13.2, kind: 'bunker' },
        { t: 14.6, kind: 'hidden', letter: 'O' },
        { t: 16.0, kind: 'scouts', n: 8 },
        { t: 17.8, kind: 'turret' },
        { t: 19.2, kind: 'dive', n: 5 },
        { t: 21.0, kind: 'lane' },
        { t: 22.6, kind: 'gun' },
        { t: 24.2, kind: 'fighters', n: 7 },
        { t: 26.0, kind: 'hidden' },
        { t: 27.6, kind: 'bunker' },
        { t: 29.2, kind: 'scouts', n: 8 },
        { t: 31.0, kind: 'turret' },
        { t: 32.6, kind: 'hidden', letter: 'L' },
        { t: 34.4, kind: 'dive', n: 5 },
        { t: 36.2, kind: 'gun' },
        { t: 38.4, kind: 'fighters', n: 6 },
        { t: 41.8, kind: 'boss' }
      ]
    },
    {
      name: '星核',
      boss: '星核堡',
      hp: 196,
      waves: [
        { t: 0.4, kind: 'scouts', n: 8 },
        { t: 1.6, kind: 'fighters', n: 6 },
        { t: 2.8, kind: 'turret' },
        { t: 3.8, kind: 'hidden', letter: 'S' },
        { t: 5.0, kind: 'dive', n: 5 },
        { t: 6.4, kind: 'lane' },
        { t: 7.6, kind: 'gun' },
        { t: 8.8, kind: 'bunker' },
        { t: 10.0, kind: 'fighters', n: 7 },
        { t: 11.4, kind: 'hidden', letter: 'O' },
        { t: 12.8, kind: 'scouts', n: 9 },
        { t: 14.2, kind: 'turret' },
        { t: 15.4, kind: 'dive', n: 6 },
        { t: 16.8, kind: 'lane' },
        { t: 18.0, kind: 'gun' },
        { t: 19.4, kind: 'pads', n: 4 },
        { t: 20.8, kind: 'hidden', letter: 'L' },
        { t: 22.2, kind: 'fighters', n: 8 },
        { t: 23.8, kind: 'bunker' },
        { t: 25.2, kind: 'turret' },
        { t: 26.6, kind: 'dive', n: 6 },
        { t: 28.0, kind: 'hidden' },
        { t: 29.4, kind: 'gun' },
        { t: 31.0, kind: 'scouts', n: 10 },
        { t: 32.6, kind: 'lane' },
        { t: 34.0, kind: 'fighters', n: 7 },
        { t: 35.8, kind: 'bunker' },
        { t: 37.4, kind: 'hidden' },
        { t: 39.2, kind: 'gun' },
        { t: 41.2, kind: 'dive', n: 6 },
        { t: 44.6, kind: 'boss' }
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
  const btnPush = document.getElementById('btn-push');
  const btnRush = document.getElementById('btn-rush');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const solLabel = document.getElementById('sol-label');
  const laneLabel = document.getElementById('lane-label');
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
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const scorches = [];

  const G = {
    mode: 'title',
    kind: 'push',
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
    sols: 0,
    solProg: 0,
    air: [],
    plates: [],
    lanes: [],
    shots: [],
    eShots: [],
    boss: null,
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    nextLife: LIFE_EVERY,
    clearT: 0,
    boost: 0,
    rushSpawn: 1.4,
    demoCd: 0,
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
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }
  function hit(ax, ay, ar, bx, by, br) {
    const r = ar + br;
    return dist2(ax, ay, bx, by) <= r * r;
  }
  function isRush() {
    return G.kind === 'rush';
  }
  function hash2(ix, iy) {
    let n = (ix * 374761393 + iy * 668265263) ^ 0x27d4eb2d;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function scrollSpd() {
    if (G.boss) return 16;
    const base = isRush() ? 128 : 88;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    const lane = 1 + G.boost * 1.18;
    return (base + rush + (G.stage - 1) * 10) * lane;
  }
  function plySpd() {
    return 252 + G.boost * 40;
  }
  function solMask() {
    const p = G.solProg;
    return 'SOL ' + (p > 0 ? 'S' : '·') + (p > 1 ? 'O' : '·') + (p > 2 ? 'L' : '·');
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
      this.beep(720, 0.048, 'square', 0.03, 1560);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.035);
      this.noise(0.032, 0.03, 1300);
      this.beep(540 * lift, 0.06, 'square', 0.042, 900 * lift);
    },
    tick() {
      this.ensure();
      this.beep(980, 0.04, 'sine', 0.028, 1460);
    },
    ping() {
      this.ensure();
      this.beep(1320, 0.05, 'triangle', 0.018, 880);
    },
    reveal() {
      this.ensure();
      this.beep(523, 0.09, 'sine', 0.05, 659);
      this.beep(784, 0.14, 'triangle', 0.042, 1046);
      this.beep(1318, 0.2, 'sine', 0.034, 1568);
    },
    collect() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.14, 'sine', 0.048, 1175);
      this.beep(1568, 0.22, 'triangle', 0.038, 2093);
      this.noise(0.08, 0.04, 700);
    },
    solDone() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.05, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(880, 0.16, 'sine', 0.05, 1175);
      this.beep(1318, 0.26, 'triangle', 0.04, 1760);
    },
    groundBoom() {
      this.ensure();
      this.noise(0.12, 0.055, 320);
      this.beep(180, 0.16, 'sawtooth', 0.048, 55);
    },
    explode(big) {
      this.ensure();
      this.noise(big ? 0.16 : 0.08, big ? 0.07 : 0.044, big ? 260 : 480);
      this.beep(big ? 160 : 260, big ? 0.24 : 0.12, 'sawtooth', 0.05, 55);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    whoosh() {
      this.ensure();
      this.noise(0.18, 0.04, 240);
      this.beep(140, 0.22, 'sawtooth', 0.03, 420);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.055, 340);
      this.beep(300, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.3, 'sine', 0.045, 46);
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
    boss() {
      this.ensure();
      this.beep(196, 0.16, 'sawtooth', 0.05, 110);
      this.beep(147, 0.28, 'square', 0.04, 80);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const st = STAGES[G.stage - 1];
      if (G.boss && st) stageLabel.textContent = st.boss;
      else stageLabel.textContent = st ? st.name : '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.stage >= 3 || !!G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isRush() ? '急袭' : '推进';
      tagLabel.classList.toggle('warn', isRush());
      tagLabel.classList.toggle('hot', !isRush() && G.stage >= 3);
    }
    if (solLabel) {
      solLabel.textContent = solMask();
      solLabel.classList.toggle('lock', G.solProg >= 3);
    }
    if (laneLabel) {
      const on = G.mode === 'play' && G.boost > 0.35;
      laneLabel.hidden = !on;
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
    else if (G.mode === 'win') setHint('星域肃清 · R 再来一局', 'hot');
    else if (G.boost > 0.4) setHint('加速航道 · 抓紧射击', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 重叠射击点亮隐藏板块', 'warn');
    else setHint('方向飞 · 空格打空+地 · 重叠射击点亮隐藏板块', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'FORCE';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'win' || kind === 'lose';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
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
    const cls = mag >= 5 ? 'die' : G.boost > 0.5 ? 'boost' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('boost');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
        stageEl.classList.remove('boost');
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
    capArr(particles, 340);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 42);
    capArr(rings, 26);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.65,
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
    screenFlash(rgb, 0.16 + p * 0.12);
    kick(2.0 + p * 2.4);
  }

  function groundBoom(x, y, power) {
    const p = power || 1;
    emit(10 + (p * 12) | 0, {
      x: x, y: y, j: 8 + p * 6,
      vx0: -160 * p, vx1: 160 * p, vy0: -280 * p, vy1: 40 * p,
      life: 0.34 + p * 0.16, r0: 1.4, r1: 3.4 + p, rgb: ORG, g: 380
    });
    emit(6 + (p * 6) | 0, {
      x: x, y: y, j: 10,
      vx0: -90 * p, vx1: 90 * p, vy0: -40, vy1: 140,
      life: 0.4, r0: 1.2, r1: 2.8, rgb: DIRT, g: 220
    });
    popSpark(x, y, ORG, 12 + p * 10);
    screenFlash(ORG, 0.2 + p * 0.12);
    kick(2.6 + p * 2.8);
    hitStop(0.04 + p * 0.018);
    audio.groundBoom();
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

  function award(base, x, y, rgb, gold) {
    const n = Math.round(base * G.mult);
    addScore(n);
    floatText(x, y, '+' + n, rgb || GOLD, !!gold);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        z: 0.35 + Math.random() * 0.9,
        tw: Math.random()
      });
    }
  }

  function spawnAir(spec) {
    if (G.air.length > 36) return null;
    const en = {
      kind: spec.kind,
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy || 70,
      hp: spec.hp,
      max: spec.hp,
      r: spec.r,
      score: spec.score,
      t: 0,
      cd: spec.cd || rand(0.4, 1.1),
      phase: spec.phase || rand(0, TAU),
      dive: spec.dive || false,
      wait: spec.wait || 0
    };
    G.air.push(en);
    return en;
  }

  function spawnScouts(n, xmid) {
    const mid = xmid == null ? VW * 0.5 + rand(-40, 40) : xmid;
    const count = n || 5;
    for (let i = 0; i < count; i++) {
      spawnAir({
        kind: 'scout',
        x: mid + (i - (count - 1) * 0.5) * 28,
        y: -18 - Math.abs(i - (count - 1) * 0.5) * 10,
        vy: 92 + (isRush() ? 18 : 0),
        hp: 1,
        r: 11,
        score: 50
      });
    }
  }

  function spawnFighters(n) {
    const count = n || 4;
    const fromL = Math.random() < 0.5;
    for (let i = 0; i < count; i++) {
      spawnAir({
        kind: 'fighter',
        x: fromL ? 40 + i * 18 : VW - 40 - i * 18,
        y: -20 - i * 16,
        vx: fromL ? 46 : -46,
        vy: 64 + (isRush() ? 12 : 0),
        hp: 1,
        r: 12,
        score: 80,
        phase: i * 0.7
      });
    }
  }

  function spawnDive(n) {
    const count = n || 3;
    for (let i = 0; i < count; i++) {
      spawnAir({
        kind: 'dive',
        x: 60 + Math.random() * (VW - 120),
        y: -24 - i * 22,
        vy: 48,
        hp: 1,
        r: 11,
        score: 110,
        wait: 0.45 + i * 0.12,
        dive: true
      });
    }
  }

  function spawnGun(x) {
    spawnAir({
      kind: 'gun',
      x: x == null ? rand(70, VW - 70) : x,
      y: -28,
      vy: 42 + (isRush() ? 8 : 0),
      hp: isRush() ? 4 : 3,
      r: 16,
      score: 180,
      cd: 0.5
    });
  }

  function spawnPlate(kind, x, extra) {
    if (G.plates.length > 28) return null;
    const p = {
      kind: kind,
      x: x == null ? rand(50, VW - 50) : x,
      y: -28,
      hp: 1,
      r: 14,
      score: 80,
      t: 0,
      cd: rand(0.6, 1.4),
      heat: 0,
      overlaps: 0,
      revealed: kind !== 'hidden',
      letter: extra && extra.letter ? extra.letter : '',
      dead: false
    };
    if (kind === 'turret') {
      p.hp = isRush() ? 4 : 3;
      p.r = 15;
      p.score = 200;
    } else if (kind === 'bunker') {
      p.hp = isRush() ? 6 : 5;
      p.r = 20;
      p.score = 400;
    } else if (kind === 'hidden') {
      p.hp = 1;
      p.r = 16;
      p.score = p.letter ? 2500 : 1500;
      p.revealed = false;
    }
    G.plates.push(p);
    return p;
  }

  function spawnPads(n) {
    const count = n || 3;
    const base = rand(70, VW - 70);
    for (let i = 0; i < count; i++) {
      spawnPlate('pad', clamp(base + (i - (count - 1) * 0.5) * 56, 40, VW - 40));
    }
  }

  function spawnLane(x) {
    G.lanes.push({
      x: x == null ? rand(70, VW - 70) : x,
      y: -40,
      w: 52,
      h: 300,
      t: 0
    });
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.hp : 96) * (isRush() ? 1.22 : 1));
    G.boss = {
      x: VW * 0.5,
      y: -80,
      vx: 42,
      hp: hp,
      max: hp,
      t: 0,
      entered: false,
      open: 0,
      cd: 0.8,
      turrets: [
        { ox: -72, oy: 18, hp: 6, max: 6, cd: 0.4, alive: true },
        { ox: 72, oy: 18, hp: 6, max: 6, cd: 0.7, alive: true },
        { ox: -38, oy: 44, hp: 5, max: 5, cd: 1.1, alive: G.stage >= 2 },
        { ox: 38, oy: 44, hp: 5, max: 5, cd: 1.4, alive: G.stage >= 3 }
      ]
    };
    audio.boss();
    toast(st ? st.boss : '要塞', false, true);
    screenFlash(MAG, 0.35);
    kick(4);
    syncHud();
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length > 36) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      rgb: rgb || MAG, r: r || 3.2, t: 0
    });
  }

  function aimShot(x, y, spd, rgb) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const d = hypot(dx, dy) || 1;
    eShot(x, y, dx / d * spd, dy / d * spd, rgb, 3.4);
  }

  function fireWave(w) {
    if (w.kind === 'scouts') spawnScouts(w.n);
    else if (w.kind === 'fighters') spawnFighters(w.n);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'gun') spawnGun();
    else if (w.kind === 'pads') spawnPads(w.n);
    else if (w.kind === 'turret') spawnPlate('turret');
    else if (w.kind === 'bunker') spawnPlate('bunker');
    else if (w.kind === 'hidden') spawnPlate('hidden', rand(70, VW - 70), { letter: w.letter || '' });
    else if (w.kind === 'lane') spawnLane();
    else if (w.kind === 'boss') spawnBoss();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    G.fireCd = 0.1;
    G.muzzle = 0.08;
    if (G.shots.length > 14) return;
    const y = G.player.y - 16;
    G.shots.push({ x: G.player.x - 6, y: y, vy: -660, r: 3.2, t: 0 });
    G.shots.push({ x: G.player.x + 6, y: y, vy: -660, r: 3.2, t: 0 });
    audio.shoot();
  }

  function revealPlate(p) {
    if (p.revealed) return;
    p.revealed = true;
    p.heat = 1;
    G.sols += 1;
    audio.reveal();
    hitStop(0.055);
    juice(p.x, p.y, GOLD, 1.35);
    floatText(p.x, p.y, p.letter ? p.letter : '发现', GOLD, true);
    toast(p.letter ? ('点亮 ' + p.letter) : '隐藏板块', false, true);
    syncHud();
  }

  function collectPlate(p) {
    if (p.dead) return;
    p.dead = true;
    bumpCombo();
    const gold = !!p.letter;
    award(p.score, p.x, p.y, GOLD, gold);
    audio.collect();
    hitStop(0.07);
    juice(p.x, p.y, GOLD, 1.6);
    if (p.letter) {
      const order = 'SOL';
      const need = order.charAt(G.solProg);
      if (p.letter === need && G.solProg < 3) {
        G.solProg += 1;
        floatText(p.x, p.y - 18, p.letter, GOLD, true);
        if (G.solProg >= 3) {
          addScore(8000);
          floatText(p.x, p.y - 36, '+8000', GOLD, true);
          toast('SOL 完成', false, true);
          audio.solDone();
          screenFlash(GOLD, 0.55);
          hitStop(0.08);
          if (G.lives < LIFE_CAP) {
            G.lives += 1;
            syncPips();
          }
        } else {
          toast(solMask(), false, true);
        }
      } else {
        floatText(p.x, p.y - 16, p.letter, SKY, false);
      }
    }
    syncHud();
  }

  function killAir(en) {
    en.hp = 0;
    bumpCombo();
    award(en.score, en.x, en.y, CYN, false);
    juice(en.x, en.y, en.kind === 'gun' ? ORG : CYN, en.kind === 'gun' ? 1.3 : 0.85);
    hitStop(en.kind === 'gun' ? 0.05 : 0.032);
    audio.hit(G.combo);
    if (en.kind === 'gun') audio.explode(false);
  }

  function killPlate(p) {
    if (p.dead) return;
    p.dead = true;
    bumpCombo();
    award(p.score, p.x, p.y, ORG, p.kind === 'bunker');
    groundBoom(p.x, p.y, p.kind === 'bunker' ? 1.5 : p.kind === 'turret' ? 1.15 : 0.85);
  }

  function hurtPlate(p, hx, hy) {
    if (p.kind === 'hidden' && !p.revealed) {
      const overlapping = p.heat > 0.28;
      p.heat = 1;
      scorches.push({ x: hx, y: hy, t: 0, life: 0.45 });
      capArr(scorches, 24);
      if (overlapping) {
        p.overlaps += 1;
        audio.tick();
        popSpark(hx, hy, GOLD, 10);
        rings.push({ x: p.x, y: p.y, t: 0, rgb: GOLD, r: 10 + p.overlaps * 4 });
        if (p.overlaps >= 2) revealPlate(p);
      } else {
        p.overlaps = 0;
        audio.ping();
        emit(3, {
          x: hx, y: hy, j: 4,
          vx0: -40, vx1: 40, vy0: -30, vy1: 20,
          life: 0.18, r0: 1, r1: 1.8, rgb: SKY
        });
      }
      return true;
    }
    if (p.kind === 'hidden' && p.revealed) {
      collectPlate(p);
      return true;
    }
    p.hp -= 1;
    popSpark(hx, hy, ORG, 8);
    audio.hit(G.combo);
    if (p.hp <= 0) killPlate(p);
    else {
      p.heat = 1;
      emit(4, {
        x: hx, y: hy, j: 5,
        vx0: -80, vx1: 80, vy0: -90, vy1: 20,
        life: 0.2, r0: 1, r1: 2, rgb: ORG
      });
    }
    return true;
  }

  function killBoss() {
    const b = G.boss;
    if (!b) return;
    const st = STAGES[G.stage - 1];
    const base = G.stage === 1 ? 4000 : G.stage === 2 ? 7000 : 10000;
    bumpCombo();
    award(base, b.x, b.y, GOLD, true);
    juice(b.x, b.y, GOLD, 2.4);
    groundBoom(b.x, b.y + 20, 2.2);
    audio.explode(true);
    hitStop(0.08);
    screenFlash(GOLD, 0.55);
    kick(7);
    for (let i = 0; i < b.turrets.length; i++) {
      const tu = b.turrets[i];
      if (tu.alive) groundBoom(b.x + tu.ox, b.y + tu.oy, 1.1);
    }
    G.boss = null;
    G.clearT = 1.35;
    G.invuln = Math.max(G.invuln, 1.4);
    addScore(2000);
    toast((st ? st.name : '关卡') + '肃清', false, true);
    audio.wave();
    syncHud();
  }

  function hurtBoss(hx, hy) {
    const b = G.boss;
    if (!b) return false;
    let hitPart = false;
    for (let i = 0; i < b.turrets.length; i++) {
      const tu = b.turrets[i];
      if (!tu.alive) continue;
      if (hit(hx, hy, 4, b.x + tu.ox, b.y + tu.oy, 14)) {
        tu.hp -= 1;
        hitPart = true;
        popSpark(hx, hy, ORG, 10);
        audio.hit(G.combo);
        if (tu.hp <= 0) {
          tu.alive = false;
          bumpCombo();
          award(300, b.x + tu.ox, b.y + tu.oy, ORG, false);
          groundBoom(b.x + tu.ox, b.y + tu.oy, 1.2);
        }
        return true;
      }
    }
    const coreR = b.open > 0.45 ? 22 : 28;
    if (hit(hx, hy, 4, b.x, b.y + 8, coreR) || hit(hx, hy, 4, b.x, b.y + 28, 70)) {
      const dmg = b.open > 0.45 ? 2 : 1;
      b.hp -= dmg;
      popSpark(hx, hy, b.open > 0.45 ? GOLD : CYN, 9);
      audio.hit(G.combo);
      if (b.hp <= 0) killBoss();
      return true;
    }
    return hitPart;
  }

  function killPlayer() {
    if (G.deadT > 0 || G.invuln > 0 || G.mode !== 'play') return;
    G.deadT = 0.92;
    G.lives -= 1;
    G.fireHold = false;
    breakCombo();
    juice(G.player.x, G.player.y, MAG, 1.8);
    hitStop(0.072);
    kick(6);
    audio.death();
    screenFlash(MAG, 0.45);
    syncPips();
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.invuln = 1.5;
    G.deadT = 0;
    G.muzzle = 0;
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '坠星';
    showOverlay('lose', '坠星了', '被弹或撞机。R 立刻重开，重叠射击还能再点亮板块。');
    audio.lose();
    syncHud();
  }

  function winGame() {
    const bonus = isRush() ? 8000 : 6000;
    addScore(bonus);
    G.mode = 'win';
    showOverlay('win', '星域肃清', (isRush() ? '急袭航线打穿。' : '三座地面要塞全毁。') + '最高 ' + G.best + '。');
    audio.win();
    screenFlash(GOLD, 0.5);
    syncHud();
  }

  function clearField() {
    G.air.length = 0;
    G.plates.length = 0;
    G.lanes.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.boss = null;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    scorches.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'rush' ? 'rush' : 'push';
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
    G.sols = 0;
    G.solProg = 0;
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
    G.nextLife = LIFE_EVERY;
    G.clearT = 0;
    G.boost = 0;
    G.rushSpawn = 1.2;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isRush() ? '急袭 · 卷轴更快' : '推进 · 荒原', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'push';
    G.stage = 1;
    G.lives = LIVES;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.boost = 0;
    G.solProg = 0;
    G.sols = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.demoCd = 0.4;
    clearField();
    spawnPads(3);
    spawnLane(VW * 0.5);
    showOverlay('title', '星力', '垂直卷轴。空格同时打空中和地面。重叠射击点亮隐藏板块。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('push');
    else startGame(G.kind || 'push');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('push');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function stageThink(dt) {
    if (G.boss || G.clearT > 0) return;
    G.stageT += dt * (isRush() ? 1.28 : 1);
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length) {
      const w = st.waves[G.waveI];
      if (G.stageT < w.t) break;
      G.waveI += 1;
      fireWave(w);
    }
    if (isRush()) {
      G.rushSpawn -= dt;
      if (G.rushSpawn <= 0 && G.air.length < 18) {
        G.rushSpawn = 1.85;
        if (Math.random() < 0.45) spawnScouts(4);
        else if (Math.random() < 0.5) spawnDive(3);
        else spawnPlate(Math.random() < 0.5 ? 'pad' : 'turret');
      }
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    let ax = 0;
    let ay = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      G.player.x = lerp(G.player.x, pointer.x, clamp(dt * 14, 0, 1));
      G.player.y = lerp(G.player.y, pointer.y, clamp(dt * 14, 0, 1));
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax && ay) {
        ax *= 0.707;
        ay *= 0.707;
      }
      const sp = plySpd();
      G.player.x += ax * sp * dt;
      G.player.y += ay * sp * dt;
    }
    G.player.x = clamp(G.player.x, 22, VW - 22);
    G.player.y = clamp(G.player.y, 50, VH - 28);
  }

  function updateAir(dt) {
    for (let i = G.air.length - 1; i >= 0; i--) {
      const en = G.air[i];
      en.t += dt;
      if (en.kind === 'fighter') {
        en.x += Math.sin(en.t * 3.2 + en.phase) * 86 * dt + en.vx * dt * 0.35;
        en.y += en.vy * dt;
      } else if (en.kind === 'dive') {
        if (en.wait > 0) {
          en.wait -= dt;
          en.y += 36 * dt;
        } else {
          const dx = G.player.x - en.x;
          const dy = G.player.y - en.y;
          const d = hypot(dx, dy) || 1;
          en.vx = lerp(en.vx, dx / d * 220, dt * 2.4);
          en.vy = lerp(en.vy, dy / d * 240, dt * 2.4);
          en.x += en.vx * dt;
          en.y += en.vy * dt;
        }
      } else if (en.kind === 'gun') {
        en.x += Math.sin(en.t * 1.4 + en.phase) * 40 * dt;
        en.y += en.vy * dt;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }
      if (en.x < 16) en.x = 16;
      if (en.x > VW - 16) en.x = VW - 16;

      if (G.mode === 'play' && G.deadT <= 0) {
        en.cd -= dt;
        if (en.cd <= 0) {
          if (en.kind === 'gun') {
            aimShot(en.x, en.y + 8, 210, MAG);
            en.cd = isRush() ? 0.85 : 1.15;
          } else if (en.kind === 'fighter' && Math.random() < 0.55) {
            eShot(en.x, en.y + 8, 0, 180 + (isRush() ? 40 : 0), PNK, 3);
            en.cd = isRush() ? 1.05 : 1.45;
          } else if (en.kind === 'scout' && G.stage >= 2 && Math.random() < 0.22) {
            eShot(en.x, en.y + 6, 0, 200, MAG, 2.6);
            en.cd = 2.2;
          } else {
            en.cd = rand(0.8, 1.8);
          }
        }
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (hit(en.x, en.y, en.r - 2, G.player.x, G.player.y, 8)) killPlayer();
      }

      if (en.y > VH + 40 || en.x < -40 || en.x > VW + 40) G.air.splice(i, 1);
    }
  }

  function updatePlates(dt) {
    const spd = G.mode === 'play' ? scrollSpd() : 42;
    for (let i = G.plates.length - 1; i >= 0; i--) {
      const p = G.plates[i];
      p.y += spd * dt;
      p.t += dt;
      if (p.heat > 0) p.heat = Math.max(0, p.heat - dt * 1.65);
      if (p.dead) {
        G.plates.splice(i, 1);
        continue;
      }
      if (p.kind === 'turret' && G.mode === 'play' && G.deadT <= 0 && p.y > 20 && p.y < VH - 40) {
        p.cd -= dt;
        if (p.cd <= 0) {
          aimShot(p.x, p.y - 6, 190, ORG);
          p.cd = isRush() ? 1.05 : 1.4;
        }
      } else if (p.kind === 'bunker' && G.mode === 'play' && G.deadT <= 0 && p.y > 30 && p.y < VH - 50) {
        p.cd -= dt;
        if (p.cd <= 0) {
          eShot(p.x, p.y - 8, -70, 160, ORG, 3.2);
          eShot(p.x, p.y - 8, 0, 190, ORG, 3.2);
          eShot(p.x, p.y - 8, 70, 160, ORG, 3.2);
          p.cd = isRush() ? 1.35 : 1.8;
        }
      }
      if (p.y > VH + 50) G.plates.splice(i, 1);
    }
  }

  function updateLanes(dt) {
    const spd = G.mode === 'play' ? scrollSpd() : 42;
    let on = 0;
    for (let i = G.lanes.length - 1; i >= 0; i--) {
      const ln = G.lanes[i];
      ln.y += spd * dt;
      ln.t += dt;
      if (G.mode === 'play' && G.deadT <= 0) {
        if (Math.abs(G.player.x - ln.x) < ln.w * 0.5 + 8
          && G.player.y > ln.y && G.player.y < ln.y + ln.h) {
          on = 1;
        }
      }
      if (ln.y > VH + 20) G.lanes.splice(i, 1);
    }
    const prev = G.boost;
    G.boost = lerp(G.boost, on, clamp(dt * 6, 0, 1));
    if (on && prev < 0.25 && G.boost >= 0.25) {
      audio.whoosh();
      kick(2.2);
      screenFlash(HOT, 0.22);
      if (stageEl && !REDUCE) {
        stageEl.classList.remove('boost');
        void stageEl.offsetWidth;
        stageEl.classList.add('boost');
      }
      toast('加速', false, false);
    }
    if (laneLabel) laneLabel.hidden = !(G.mode === 'play' && G.boost > 0.35);
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b) return;
    b.t += dt;
    if (!b.entered) {
      b.y += 70 * dt;
      if (b.y >= 118) {
        b.y = 118;
        b.entered = true;
      }
    } else {
      b.x += b.vx * dt;
      if (b.x < 130) {
        b.x = 130;
        b.vx = Math.abs(b.vx);
      }
      if (b.x > VW - 130) {
        b.x = VW - 130;
        b.vx = -Math.abs(b.vx);
      }
    }
    const cycle = 3.2 - (b.hp / b.max) * 0.6;
    b.open = (Math.sin(b.t * (TAU / cycle)) + 1) * 0.5;
    if (G.mode === 'play' && G.deadT <= 0 && b.entered) {
      b.cd -= dt;
      if (b.cd <= 0) {
        const angry = b.hp / b.max < 0.35;
        if (b.open > 0.55) {
          const n = G.stage >= 3 ? 5 : 3;
          for (let i = 0; i < n; i++) {
            const a = -1.2 + i * (2.4 / Math.max(1, n - 1));
            eShot(b.x, b.y + 22, Math.sin(a) * 150, Math.cos(a) * 170 + 40, GOLD, 3.6);
          }
          b.cd = angry ? 0.7 : 1.05;
        } else {
          aimShot(b.x, b.y + 24, angry ? 240 : 200, MAG);
          b.cd = angry ? 0.55 : 0.85;
        }
      }
      for (let i = 0; i < b.turrets.length; i++) {
        const tu = b.turrets[i];
        if (!tu.alive) continue;
        tu.cd -= dt;
        if (tu.cd <= 0) {
          aimShot(b.x + tu.ox, b.y + tu.oy, 180, ORG);
          tu.cd = isRush() ? 1.05 : 1.35;
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.y += s.vy * dt;
      s.t += dt;
      let gone = false;
      for (let j = G.air.length - 1; j >= 0; j--) {
        const en = G.air[j];
        if (en.hp <= 0) continue;
        if (hit(s.x, s.y, s.r, en.x, en.y, en.r)) {
          en.hp -= 1;
          popSpark(s.x, s.y, CYN, 7);
          if (en.hp <= 0) killAir(en);
          else audio.hit(G.combo);
          gone = true;
          break;
        }
      }
      if (!gone && G.boss) {
        if (hurtBoss(s.x, s.y)) gone = true;
      }
      if (!gone) {
        for (let j = G.plates.length - 1; j >= 0; j--) {
          const p = G.plates[j];
          if (p.dead) continue;
          if (hit(s.x, s.y, s.r + 2, p.x, p.y, p.r)) {
            hurtPlate(p, s.x, s.y);
            gone = true;
            break;
          }
        }
      }
      if (!gone) {
        let near = false;
        for (let j = 0; j < G.plates.length; j++) {
          const p = G.plates[j];
          if (p.kind !== 'hidden' || p.revealed || p.dead) continue;
          if (dist2(s.x, s.y, p.x, p.y) < 42 * 42) {
            near = true;
            break;
          }
        }
        if (near && s.t > 0.02 && ((s.t * 40) | 0) % 7 === 0) {
          emit(1, {
            x: s.x, y: s.y, j: 2,
            vx0: -10, vx1: 10, vy0: -8, vy1: 8,
            life: 0.12, r0: 0.8, r1: 1.4, rgb: GOLD
          });
        }
      }
      if (gone || s.y < -20) G.shots.splice(i, 1);
    }

    for (let i = G.air.length - 1; i >= 0; i--) {
      if (G.air[i].hp <= 0) G.air.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.t += dt;
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (hit(s.x, s.y, s.r, G.player.x, G.player.y, 7.5)) {
          G.eShots.splice(i, 1);
          killPlayer();
          continue;
        }
      }
      if (s.y > VH + 20 || s.y < -30 || s.x < -20 || s.x > VW + 20) G.eShots.splice(i, 1);
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.toastT > 0) G.toastT -= dt;
    G.scroll += (G.mode === 'play' ? scrollSpd() : 42) * dt;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 4.5;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 3.2;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = scorches.length - 1; i >= 0; i--) {
      scorches[i].t += dt;
      if (scorches[i].t >= scorches[i].life) scorches.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      st.y += (18 + st.z * 46) * dt * (G.boost > 0.3 ? 1.8 : 1);
      if (st.y > VH) {
        st.y = -4;
        st.x = Math.random() * VW;
      }
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
      G.demoCd -= dt;
      if (G.demoCd <= 0 && G.air.length < 7) {
        spawnScouts(5, VW * 0.5 + Math.sin(G.t) * 40);
        G.demoCd = 2.8;
      }
      updateAir(dt);
      updatePlates(dt);
      updateLanes(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updatePlates(dt);
      updateLanes(dt);
      return;
    }

    G.clock += dt;
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

    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) {
        if (G.stage >= 3) {
          winGame();
          return;
        }
        G.stage += 1;
        G.stageT = 0;
        G.waveI = 0;
        G.invuln = Math.max(G.invuln, 0.8);
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updatePlayer(dt);
    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();
    stageThink(dt);
    updateAir(dt);
    updatePlates(dt);
    updateLanes(dt);
    updateBoss(dt);
    updateShots(dt);
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(sx(x + rr), sy(y));
    ctx.lineTo(sx(x + w - rr), sy(y));
    ctx.quadraticCurveTo(sx(x + w), sy(y), sx(x + w), sy(y + rr));
    ctx.lineTo(sx(x + w), sy(y + h - rr));
    ctx.quadraticCurveTo(sx(x + w), sy(y + h), sx(x + w - rr), sy(y + h));
    ctx.lineTo(sx(x + rr), sy(y + h));
    ctx.quadraticCurveTo(sx(x), sy(y + h), sx(x), sy(y + h - rr));
    ctx.lineTo(sx(x), sy(y + rr));
    ctx.quadraticCurveTo(sx(x), sy(y), sx(x + rr), sy(y));
    ctx.closePath();
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#04101c');
    g.addColorStop(0.42, '#071624');
    g.addColorStop(1, '#0a1c28');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      const a = 0.25 + st.z * 0.55 + Math.sin(G.t * 3 + st.tw * 8) * 0.08;
      ctx.fillStyle = rgba(HOT, a);
      const r = (0.6 + st.z * 1.1) * scale;
      ctx.fillRect(sx(st.x), sy(st.y), r, r);
    }

    const tile = 36;
    const off = G.scroll % tile;
    for (let yy = -tile; yy < VH + tile; yy += tile) {
      const y = yy + (tile - off);
      const iy = Math.floor((G.scroll + yy) / tile);
      for (let x = 0; x < VW; x += tile) {
        const ix = (x / tile) | 0;
        const h = hash2(ix, iy);
        if (h > 0.78) {
          ctx.fillStyle = 'rgba(20, 56, 84,' + (0.18 + (h - 0.78) * 0.7) + ')';
          const cr = 6 + h * 10;
          ctx.beginPath();
          ctx.ellipse(sx(x + 18), sy(y + 16), cr * scale, cr * 0.55 * scale, 0, 0, TAU);
          ctx.fill();
          if (h > 0.93) {
            ctx.strokeStyle = 'rgba(58, 160, 255, 0.16)';
            ctx.lineWidth = 1 * scale;
            ctx.stroke();
          }
        }
        if (h < 0.12) {
          ctx.fillStyle = 'rgba(12, 40, 64, 0.35)';
          ctx.fillRect(sx(x + 6), sy(y + 8), 10 * scale, 6 * scale);
        }
      }
    }

    ctx.strokeStyle = 'rgba(58, 160, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let y = -36; y < VH + 36; y += 36) {
      const yy = y + (36 - off);
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(yy));
      ctx.lineTo(sx(VW), sy(yy));
      ctx.stroke();
    }
  }

  function drawLane(ln) {
    const x = ln.x - ln.w * 0.5;
    ctx.fillStyle = rgba(CYN, 0.1 + G.boost * 0.08);
    ctx.fillRect(sx(x), sy(ln.y), ln.w * scale, ln.h * scale);
    ctx.strokeStyle = rgba(HOT, 0.45 + G.boost * 0.35);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x + 3), sy(ln.y));
    ctx.lineTo(sx(x + 3), sy(ln.y + ln.h));
    ctx.moveTo(sx(x + ln.w - 3), sy(ln.y));
    ctx.lineTo(sx(x + ln.w - 3), sy(ln.y + ln.h));
    ctx.stroke();
    const chev = 18;
    const shift = (ln.t * 140) % chev;
    ctx.strokeStyle = rgba(HOT, 0.55);
    ctx.lineWidth = 1.4 * scale;
    for (let y = ln.y - chev + shift; y < ln.y + ln.h; y += chev) {
      ctx.beginPath();
      ctx.moveTo(sx(ln.x - 10), sy(y + 8));
      ctx.lineTo(sx(ln.x), sy(y));
      ctx.lineTo(sx(ln.x + 10), sy(y + 8));
      ctx.stroke();
    }
  }

  function drawPlate(p) {
    if (p.kind === 'hidden' && !p.revealed) {
      if (p.heat > 0.04) {
        ctx.save();
        ctx.translate(sx(p.x), sy(p.y));
        ctx.rotate(TAU / 8);
        ctx.strokeStyle = rgba(GOLD, 0.2 + p.heat * 0.7);
        ctx.lineWidth = 1.4 * scale;
        const s = (10 + p.overlaps * 3) * scale;
        ctx.strokeRect(-s, -s, s * 2, s * 2);
        ctx.restore();
        ctx.fillStyle = rgba(GOLD, 0.08 + p.heat * 0.18);
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), 8 * scale, 0, TAU);
        ctx.fill();
      }
      return;
    }
    if (p.kind === 'hidden') {
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.rotate(TAU / 8);
      ctx.fillStyle = rgba(GOLD, 0.18);
      const s = 13 * scale;
      ctx.fillRect(-s, -s, s * 2, s * 2);
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.6 * scale;
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.restore();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.font = 'bold ' + (13 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.letter || '★', sx(p.x), sy(p.y + 1));
      return;
    }
    if (p.kind === 'turret') {
      ctx.fillStyle = '#14344c';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(ORG, 0.75);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      const ang = Math.atan2(G.player.y - p.y, G.player.x - p.x);
      ctx.strokeStyle = rgba(GOLD, 0.85);
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(p.x), sy(p.y));
      ctx.lineTo(sx(p.x + Math.cos(ang) * 16), sy(p.y + Math.sin(ang) * 16));
      ctx.stroke();
      ctx.fillStyle = rgba(ORG, 0.9);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 4.2 * scale, 0, TAU);
      ctx.fill();
      return;
    }
    if (p.kind === 'bunker') {
      roundRect(p.x - 22, p.y - 14, 44, 28, 4);
      ctx.fillStyle = '#102838';
      ctx.fill();
      ctx.strokeStyle = rgba(ORG, 0.65);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(RED, 0.8);
      ctx.fillRect(sx(p.x - 8), sy(p.y - 6), 16 * scale, 8 * scale);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(sx(p.x - 3), sy(p.y - 16), 6 * scale, 8 * scale);
      return;
    }
    roundRect(p.x - 14, p.y - 10, 28, 20, 3);
    ctx.fillStyle = '#123044';
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.55);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.fillStyle = rgba(HOT, 0.35 + (p.heat || 0) * 0.4);
    ctx.fillRect(sx(p.x - 6), sy(p.y - 4), 12 * scale, 6 * scale);
  }

  function drawAir(en) {
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    if (en.kind === 'gun') {
      ctx.fillStyle = rgba(ORG, 0.9);
      ctx.beginPath();
      ctx.moveTo(0, 14 * scale);
      ctx.lineTo(16 * scale, 4 * scale);
      ctx.lineTo(10 * scale, -12 * scale);
      ctx.lineTo(-10 * scale, -12 * scale);
      ctx.lineTo(-16 * scale, 4 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(-4 * scale, -4 * scale, 8 * scale, 8 * scale);
    } else if (en.kind === 'fighter') {
      ctx.fillStyle = rgba(MAG, 0.92);
      ctx.beginPath();
      ctx.moveTo(0, 12 * scale);
      ctx.lineTo(11 * scale, -8 * scale);
      ctx.lineTo(0, -4 * scale);
      ctx.lineTo(-11 * scale, -8 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(PNK, 0.8);
      ctx.fillRect(-2 * scale, -2 * scale, 4 * scale, 6 * scale);
    } else if (en.kind === 'dive') {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(0, 12 * scale);
      ctx.lineTo(8 * scale, -8 * scale);
      ctx.lineTo(-8 * scale, -8 * scale);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(PNK, 0.92);
      ctx.beginPath();
      ctx.moveTo(0, 10 * scale);
      ctx.lineTo(9 * scale, -6 * scale);
      ctx.lineTo(-9 * scale, -6 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.fillRect(-1.5 * scale, -2 * scale, 3 * scale, 5 * scale);
    }
    ctx.restore();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b) return;
    const bw = 200;
    const bh = 88;
    roundRect(b.x - bw * 0.5, b.y - 18, bw, bh, 8);
    ctx.fillStyle = '#0c2234';
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.7);
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();
    ctx.fillStyle = '#081820';
    ctx.fillRect(sx(b.x - 86), sy(b.y - 8), 28 * scale, 18 * scale);
    ctx.fillRect(sx(b.x + 58), sy(b.y - 8), 28 * scale, 18 * scale);
    for (let i = -3; i <= 3; i++) {
      ctx.fillStyle = rgba(SKY, 0.2);
      ctx.fillRect(sx(b.x + i * 22 - 6), sy(b.y + 52), 12 * scale, 10 * scale);
    }
    const core = b.open > 0.45;
    ctx.beginPath();
    ctx.arc(sx(b.x), sy(b.y + 10), 18 * scale, 0, TAU);
    ctx.fillStyle = core ? rgba(GOLD, 0.85) : rgba(CYN, 0.35);
    ctx.fill();
    ctx.strokeStyle = core ? rgba(GOLD, 1) : rgba(HOT, 0.6);
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    if (core) {
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y + 10), 7 * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < b.turrets.length; i++) {
      const tu = b.turrets[i];
      if (!tu.alive) continue;
      ctx.fillStyle = '#1a3a50';
      ctx.beginPath();
      ctx.arc(sx(b.x + tu.ox), sy(b.y + tu.oy), 12 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(ORG, 0.85);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      const ang = Math.atan2(G.player.y - (b.y + tu.oy), G.player.x - (b.x + tu.ox));
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(b.x + tu.ox), sy(b.y + tu.oy));
      ctx.lineTo(sx(b.x + tu.ox + Math.cos(ang) * 14), sy(b.y + tu.oy + Math.sin(ang) * 14));
      ctx.stroke();
    }
  }

  function drawShip(x, y, a) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.globalAlpha = a;
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      ctx.beginPath();
      ctx.ellipse(0, -18 * scale, 4 * scale, 10 * scale, 0, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.beginPath();
    ctx.moveTo(-5 * scale, 12 * scale);
    ctx.lineTo(0, 20 * scale);
    ctx.lineTo(5 * scale, 12 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -16 * scale);
    ctx.lineTo(7 * scale, 4 * scale);
    ctx.lineTo(12 * scale, 10 * scale);
    ctx.lineTo(4 * scale, 7 * scale);
    ctx.lineTo(0, 12 * scale);
    ctx.lineTo(-4 * scale, 7 * scale);
    ctx.lineTo(-12 * scale, 10 * scale);
    ctx.lineTo(-7 * scale, 4 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -16 * scale);
    ctx.lineTo(5 * scale, 2 * scale);
    ctx.lineTo(0, 6 * scale);
    ctx.lineTo(-5 * scale, 2 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-1.4 * scale, -18 * scale, 2.8 * scale, 8 * scale);
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), 2.1 * scale, 7 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(sx(s.x - 0.8), sy(s.y - 6), 1.6 * scale, 8 * scale);
      if (!REDUCE) {
        ctx.fillStyle = rgba(CYN, 0.28);
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

  function drawParticles() {
    for (let i = 0; i < scorches.length; i++) {
      const s = scorches[i];
      const u = 1 - s.t / s.life;
      ctx.fillStyle = rgba(GOLD, 0.22 * u);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), 6 * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const u = p.life / p.max;
      ctx.fillStyle = rgba(p.rgb, clamp(u, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * u * scale, 0, TAU);
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
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - r.t));
      ctx.lineWidth = 2 * scale * (1 - r.t);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 28) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const u = 1 - f.t / f.life;
      ctx.globalAlpha = clamp(u * 1.4, 0, 1);
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + (f.size * scale) + 'px sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.globalAlpha = 1;
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b) return;
    const w = 220;
    const h = 8;
    const x = (VW - w) * 0.5;
    const y = 16;
    const t = clamp(b.hp / b.max, 0, 1);
    ctx.fillStyle = 'rgba(4,16,24,0.7)';
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    ctx.fillStyle = rgba(t < 0.35 ? MAG : GOLD, 0.9);
    ctx.shadowColor = rgba(t < 0.35 ? MAG : GOLD, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const st = STAGES[G.stage - 1];
    ctx.fillText(st ? st.boss : '要塞', sx(VW * 0.5), sy(y - 2));
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#02080e';
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
    for (let i = 0; i < G.lanes.length; i++) drawLane(G.lanes[i]);
    for (let i = 0; i < G.plates.length; i++) drawPlate(G.plates[i]);
    if (G.boss) drawBoss();
    drawShots();
    for (let i = 0; i < G.air.length; i++) drawAir(G.air[i]);
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
    return {
      x: clamp((x - ox) / scale, 0, VW),
      y: clamp((y - oy) / scale, 0, VH)
    };
  }

  function onKey(e, down) {
    const k = e.key;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = down;
    if (isMove && down) inputSrc = 'key';

    if (down && (isMove || space || k === 'Enter')) e.preventDefault();

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
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'rush' : 'push');
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

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnPush) {
    btnPush.addEventListener('click', function () {
      audio.ensure();
      startGame('push');
    });
  }
  if (btnRush) {
    btnRush.addEventListener('click', function () {
      audio.ensure();
      startGame('rush');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'push');
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
