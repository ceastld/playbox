'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const OPT_MAX = 4;
  const OPT_GAP = 16;
  const TRAIL_LEN = 88;
  const FORMS = ['跟', '环', '扇', '旋'];
  const BEST_KEY = 'playbox-parodius-best';
  const MUTE_KEY = 'playbox-parodius-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 换阵 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 45, 155];
  const PNK = [255, 77, 184];
  const HOT = [255, 138, 208];
  const GOLD = [255, 227, 107];
  const MINT = [94, 255, 224];
  const CYN = [122, 240, 255];
  const WHT = [255, 232, 244];
  const DEEP = [26, 8, 20];
  const ORG = [255, 122, 58];
  const PURP = [176, 92, 255];
  const INK = [80, 40, 120];

  const SCORE = {
    balloon: 50,
    clown: 80,
    penguin: 60,
    octo: 110,
    fish: 50,
    cat: 90,
    coin: 40,
    cone: 70,
    lion: 140,
    dancer: 100,
    ring: 90,
    wagon: 280,
    boss: 4000,
    clear: 2000
  };

  const STAGES = [
    {
      id: 0, name: '马戏', boss: '大企鹅', bossKind: 'pen', bossHp: 88, hue: 318,
      waves: [
        { t: 0.45, kind: 'balloons', n: 5, y: 0.34 },
        { t: 1.9, kind: 'clowns', n: 2 },
        { t: 3.3, kind: 'penguins', n: 4, y: 0.62 },
        { t: 4.6, kind: 'rings', n: 2 },
        { t: 5.8, kind: 'dive', n: 4 },
        { t: 7.0, kind: 'lion' },
        { t: 8.2, kind: 'wagon' },
        { t: 8.7, kind: 'balloons', n: 6, y: 0.48, rain: true },
        { t: 9.4, kind: 'clowns', n: 3 },
        { t: 10.8, kind: 'penguins', n: 5, y: 0.3 },
        { t: 12.2, kind: 'rings', n: 3 },
        { t: 13.4, kind: 'dive', n: 5, rain: true },
        { t: 14.6, kind: 'lion' },
        { t: 16.0, kind: 'boss' }
      ]
    },
    {
      id: 1, name: '糖海', boss: '章鱼船长', bossKind: 'octo', bossHp: 112, hue: 28,
      waves: [
        { t: 0.4, kind: 'fish', n: 6, y: 0.4 },
        { t: 1.8, kind: 'cones', n: 3 },
        { t: 3.2, kind: 'octos', n: 2 },
        { t: 4.6, kind: 'balloons', n: 5, y: 0.7 },
        { t: 5.8, kind: 'fish', n: 7, y: 0.28 },
        { t: 7.0, kind: 'wagon' },
        { t: 8.2, kind: 'clowns', n: 2 },
        { t: 8.8, kind: 'cones', n: 4, rain: true },
        { t: 9.6, kind: 'octos', n: 3 },
        { t: 11.0, kind: 'dive', n: 4 },
        { t: 12.2, kind: 'fish', n: 6, y: 0.58 },
        { t: 13.4, kind: 'rings', n: 2 },
        { t: 14.6, kind: 'lion', rain: true },
        { t: 16.2, kind: 'boss' }
      ]
    },
    {
      id: 2, name: '夜店', boss: '猫女', bossKind: 'cat', bossHp: 148, hue: 278,
      waves: [
        { t: 0.4, kind: 'cats', n: 3 },
        { t: 1.8, kind: 'coins', n: 6 },
        { t: 3.2, kind: 'dancers', n: 2 },
        { t: 4.6, kind: 'octos', n: 2 },
        { t: 5.8, kind: 'penguins', n: 5, y: 0.42 },
        { t: 7.0, kind: 'wagon' },
        { t: 8.2, kind: 'cats', n: 4 },
        { t: 8.8, kind: 'coins', n: 8, rain: true },
        { t: 9.6, kind: 'dancers', n: 3 },
        { t: 11.0, kind: 'dive', n: 5 },
        { t: 12.2, kind: 'rings', n: 3 },
        { t: 13.4, kind: 'clowns', n: 3 },
        { t: 14.6, kind: 'cats', n: 3, rain: true },
        { t: 16.4, kind: 'boss' }
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
  const btnGag = document.getElementById('btn-gag');
  const btnRain = document.getElementById('btn-rain');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnForm = document.getElementById('btn-form');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const optLabel = document.getElementById('opt-label');
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
  let optTok = 0;
  let formTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const motes = [];
  const props = [];

  const G = {
    mode: 'title',
    kind: 'gag',
    t: 0,
    stage: 0,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    px: 90,
    py: VH * 0.5,
    lean: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    optN: 0,
    form: 0,
    options: [],
    trail: [],
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
    flashRgb: GOLD,
    punch: 1,
    muzzle: 0,
    winT: 0,
    nextT: 0,
    nextLife: LIFE_EVERY,
    why: '',
    bossIn: false
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
  function stageOf(i) {
    return STAGES[i] || STAGES[0];
  }
  function comboMul(c) {
    return 1 + Math.min(4, Math.floor(Math.max(0, c - 1) / 3));
  }
  function plySpd() {
    return (isRain() ? 318 : 274) + G.optN * 6;
  }
  function scrollSpd() {
    if (G.bossIn) return isRain() ? 30 : 22;
    const base = isRain() ? 124 : 90;
    const rush = G.combo >= 8 ? 14 : G.combo >= 4 ? 7 : 0;
    return base + rush + G.stage * 6;
  }
  function hpMul() {
    return isRain() ? 1.28 : 1;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function hueRgb(h, s, l) {
    s = s == null ? 0.72 : s;
    l = l == null ? 0.52 : l;
    const a = ((h % 360) + 360) % 360 / 60;
    const i = Math.floor(a);
    const f = a - i;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(f - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (i === 0) { r = c; g = x; }
    else if (i === 1) { r = x; g = c; }
    else if (i === 2) { g = c; b = x; }
    else if (i === 3) { g = x; b = c; }
    else if (i === 4) { r = x; b = c; }
    else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function moveVec(l, r, u, d) {
    let dx = (r ? 1 : 0) - (l ? 1 : 0);
    let dy = (d ? 1 : 0) - (u ? 1 : 0);
    const m = Math.sqrt(dx * dx + dy * dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    return { x: dx, y: dy };
  }
  function kindName() {
    return isRain() ? '乱弹' : '恶搞';
  }
  function formName() {
    return FORMS[G.form] || '跟';
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
      this.beep(920 + G.optN * 40, 0.046, 'square', 0.028, 1680);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.03, 0.028, 1500);
      this.beep(640 * lift, 0.055, 'square', 0.038, 1080 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.09, big ? 0.074 : 0.044, big ? 200 : 480);
      this.beep(big ? 150 : 270, big ? 0.26 : 0.12, 'sawtooth', 0.05, 50);
    },
    bell() {
      this.ensure();
      this.beep(988, 0.09, 'triangle', 0.05, 1480);
      this.beep(1318, 0.14, 'sine', 0.036, 1760);
    },
    option() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.045, 784);
      this.beep(659, 0.09, 'triangle', 0.04, 1046);
      this.beep(784, 0.14, 'sine', 0.038, 1318);
    },
    form() {
      this.ensure();
      this.beep(440 + G.form * 80, 0.08, 'square', 0.042, 660 + G.form * 90);
      this.beep(880, 0.12, 'triangle', 0.032, 1320);
    },
    combo(m) {
      this.ensure();
      this.beep(520 + m * 90, 0.09, 'triangle', 0.04, 1040 + m * 80);
    },
    death() {
      this.ensure();
      this.noise(0.28, 0.08, 180);
      this.beep(180, 0.36, 'sawtooth', 0.06, 40);
    },
    life() {
      this.ensure();
      this.beep(660, 0.1, 'square', 0.045, 880);
      this.beep(880, 0.14, 'triangle', 0.04, 1320);
    },
    boss() {
      this.ensure();
      this.beep(140, 0.3, 'sawtooth', 0.055, 70);
      this.beep(420, 0.18, 'square', 0.035, 210);
    },
    win() {
      this.ensure();
      this.beep(523, 0.14, 'triangle', 0.05, 784);
      this.beep(659, 0.16, 'triangle', 0.045, 987);
      this.beep(784, 0.22, 'sine', 0.04, 1174);
    },
    lose() {
      this.ensure();
      this.beep(330, 0.22, 'sawtooth', 0.05, 110);
      this.beep(196, 0.36, 'triangle', 0.04, 80);
    },
    start() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1046, 0.14, 'triangle', 0.035, 1318);
    },
    empty() {
      this.ensure();
      this.beep(160, 0.08, 'square', 0.03, 90);
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
    try {
      localStorage.setItem(BEST_KEY, String(G.best | 0));
    } catch (err) { /* ignore */ }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function flashScore(n) {
    if (!scoreBox) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    if (scoreAdd && n > 0) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok && scoreAdd) scoreAdd.hidden = true;
      }, 700);
    }
  }

  function addScore(n) {
    n = Math.round(n);
    if (!n) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    flashScore(n);
    while (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.life();
        syncHud();
      }
    }
    if (G.score > G.best) {
      G.best = G.score;
      saveBest();
    }
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok && toastEl) toastEl.classList.add('hidden');
    }, 1120);
  }

  function pulseEl(el, tokName) {
    if (!el) return;
    el.classList.remove('hot');
    void el.offsetWidth;
    el.classList.add('hot');
    if (tokName === 'combo') comboTok += 1;
    else if (tokName === 'opt') optTok += 1;
    else formTok += 1;
    const tok = tokName === 'combo' ? comboTok : tokName === 'opt' ? optTok : formTok;
    setTimeout(function () {
      const cur = tokName === 'combo' ? comboTok : tokName === 'opt' ? optTok : formTok;
      if (tok === cur && el) el.classList.remove('hot');
    }, 280);
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < LIFE_CAP) {
      const s = document.createElement('span');
      s.className = 'pip';
      pipsEl.appendChild(s);
      pips.push(s);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode === 'lose' && i < LIVES && i >= G.lives);
    }
  }

  function syncHud() {
    const st = stageOf(G.stage);
    if (stageLabel) {
      stageLabel.textContent = st.name;
      stageLabel.classList.toggle('hot', G.bossIn);
    }
    if (tagLabel) {
      tagLabel.textContent = G.bossIn ? st.boss : kindName();
      tagLabel.classList.toggle('warn', isRain() && !G.bossIn);
      tagLabel.classList.toggle('hot', G.bossIn);
    }
    if (optLabel) optLabel.textContent = '分 ×' + G.optN;
    if (formLabel) formLabel.textContent = formName();
    if (hintEl) {
      hintEl.classList.toggle('hot', G.bossIn);
      hintEl.classList.toggle('warn', G.lives <= 1 && G.mode === 'play');
      if (G.mode === 'title') hintEl.textContent = '捡铃铛出分身 · Shift 换阵 · 撞上掉命';
      else if (G.bossIn) hintEl.textContent = st.boss + ' · 分身抄射 · Shift 换阵';
      else hintEl.textContent = st.name + ' · 捡铃出分身 · ' + formName() + '阵';
    }
    if (comboEl && (G.mode !== 'play' || G.combo < 2)) comboEl.hidden = true;
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'PARO';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvRetry) btnOvRetry.textContent = '再来';
    if (btnOvModes) {
      if (kind === 'win' && !isRain()) btnOvModes.textContent = '乱弹';
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
    const cls = mag >= 6.5 ? 'die' : mag >= 4 ? 'pow' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('pow');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
        stageEl.classList.remove('pow');
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
    capArr(sparks, 48);
    capArr(rings, 32);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.92 : 0.64,
      size: gold ? 20 : 14, gold: !!gold, vy: gold ? -88 : -72
    });
    capArr(floats, 28);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const m = comboMul(G.combo);
    if (m > G.mult) {
      audio.combo(m);
      pulseEl(comboEl, 'combo');
    }
    G.mult = m;
  }

  function seedDecor() {
    stars.length = 0;
    motes.length = 0;
    props.length = 0;
    for (let i = 0; i < 48; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH * 0.7),
        s: rand(0.6, 2.1),
        a: rand(0.18, 0.7),
        tw: rand(0, TAU)
      });
    }
    for (let i = 0; i < 34; i++) {
      motes.push({
        x: rand(0, VW),
        y: rand(0, VH),
        s: rand(1.2, 3.6),
        v: rand(22, 70),
        a: rand(0.2, 0.55),
        rgb: i % 3 === 0 ? GOLD : i % 3 === 1 ? PNK : MINT
      });
    }
    for (let i = 0; i < 10; i++) {
      props.push({
        x: rand(0, VW),
        y: VH - rand(16, 64),
        h: rand(36, 96),
        w: rand(16, 34),
        k: (hash2(i + 19) * 4) | 0
      });
    }
  }

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pows.length = 0;
    G.options.length = 0;
    G.trail.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function makeShot(x, y, vx, vy, dmg, extra) {
    return {
      x: x, y: y, vx: vx, vy: vy || 0,
      r: extra && extra.r ? extra.r : 3.5,
      life: extra && extra.life ? extra.life : 0.9,
      dmg: dmg || 1, dead: false, opt: !!(extra && extra.opt)
    };
  }

  function makeEShot(x, y, vx, vy, r, rgb) {
    return { x: x, y: y, vx: vx, vy: vy, r: r || 3.5, life: 2.7, rgb: rgb || PNK, dead: false };
  }

  function aimShot(x, y, tx, ty, spd, r, rgb) {
    const d = hypot(tx - x, ty - y) || 1;
    return makeEShot(x, y, (tx - x) / d * spd, (ty - y) / d * spd, r, rgb);
  }

  function spawnBell(x, y) {
    G.pows.push({
      x: x, y: y, vx: -38, vy: rand(-70, -20), t: 0, dead: false
    });
  }

  function maybeBell(e) {
    if (e.type === 'wagon') return true;
    if (e.type === 'clown' || e.type === 'lion') return Math.random() < 0.46;
    if (e.type === 'dancer' || e.type === 'octo') return Math.random() < 0.28;
    return Math.random() < 0.1;
  }

  function makeEnt(type, x, y, extra) {
    const table = {
      balloon: { w: 16, h: 20, hp: 1, score: SCORE.balloon, vx: isRain() ? -130 : -102 },
      clown: { w: 20, h: 20, hp: 2, score: SCORE.clown, vx: isRain() ? -78 : -60 },
      penguin: { w: 16, h: 18, hp: 1, score: SCORE.penguin, vx: isRain() ? -150 : -118 },
      octo: { w: 24, h: 20, hp: 3, score: SCORE.octo, vx: isRain() ? -62 : -48 },
      fish: { w: 18, h: 12, hp: 1, score: SCORE.fish, vx: isRain() ? -140 : -110 },
      cat: { w: 18, h: 16, hp: 2, score: SCORE.cat, vx: isRain() ? -86 : -68 },
      coin: { w: 12, h: 12, hp: 1, score: SCORE.coin, vx: isRain() ? -96 : -76 },
      cone: { w: 16, h: 22, hp: 2, score: SCORE.cone, vx: isRain() ? -74 : -58 },
      lion: { w: 30, h: 22, hp: 4, score: SCORE.lion, vx: isRain() ? -54 : -42 },
      dancer: { w: 18, h: 22, hp: 2, score: SCORE.dancer, vx: isRain() ? -80 : -64 },
      ring: { w: 22, h: 22, hp: 3, score: SCORE.ring, vx: isRain() ? -88 : -70 },
      wagon: { w: 34, h: 20, hp: 5, score: SCORE.wagon, vx: isRain() ? -60 : -48 }
    };
    const t = table[type] || table.balloon;
    return {
      type: type, x: x, y: y, baseY: y, w: t.w, h: t.h, hp: t.hp, score: t.score,
      vx: t.vx, vy: extra && extra.vy ? extra.vy : 0,
      amp: extra && extra.amp != null ? extra.amp : 22,
      bob: rand(0, TAU), cd: rand(0.4, 1.2),
      dive: !!(extra && extra.dive), dead: false, hitT: 0, spin: rand(0, TAU)
    };
  }

  function makeBoss(kind, name, hp) {
    return {
      type: 'boss', kind: kind, name: name, x: VW + 80, y: VH * 0.5,
      w: kind === 'octo' ? 108 : kind === 'cat' ? 92 : 96,
      h: kind === 'octo' ? 78 : kind === 'cat' ? 86 : 72,
      hp: Math.round(hp * hpMul()), maxhp: Math.round(hp * hpMul()),
      score: SCORE.boss, vx: -70, vy: 0, t: 0, cd: 0.8, phase: 1,
      in: true, dead: false, hitT: 0, flash: 0, bob: 0
    };
  }

  function spawnWave(w) {
    if (w.rain && !isRain()) return;
    const n = (w.n || 1) + (isRain() && !w.rain ? 1 : 0);
    const y = (w.y || 0.5) * VH;
    if (w.kind === 'balloons') {
      for (let i = 0; i < n; i++) G.ents.push(makeEnt('balloon', VW + 24 + i * 30, y + rand(-18, 18), { amp: 16 + i * 3 }));
    } else if (w.kind === 'clowns') {
      for (let i = 0; i < n; i++) G.ents.push(makeEnt('clown', VW + 28 + i * 44, 80 + i * 80));
    } else if (w.kind === 'penguins') {
      for (let i = 0; i < n; i++) G.ents.push(makeEnt('penguin', VW + 20 + i * 26, y + rand(-12, 12)));
    } else if (w.kind === 'dive') {
      for (let i = 0; i < n; i++) {
        G.ents.push(makeEnt('penguin', VW + 16 + i * 22, 36 + (i % 2) * (VH - 80), { dive: true, amp: 8 }));
      }
    } else if (w.kind === 'octos') {
      for (let i = 0; i < n; i++) G.ents.push(makeEnt('octo', VW + 36 + i * 50, 90 + i * 80));
    } else if (w.kind === 'fish') {
      for (let i = 0; i < n; i++) G.ents.push(makeEnt('fish', VW + 18 + i * 28, y + (i % 3) * 18, { amp: 28 }));
    } else if (w.kind === 'cats') {
      for (let i = 0; i < n; i++) G.ents.push(makeEnt('cat', VW + 24 + i * 36, 70 + (i % 3) * 90));
    } else if (w.kind === 'coins') {
      for (let i = 0; i < n; i++) G.ents.push(makeEnt('coin', VW + 16 + i * 22, 50 + (i % 5) * 70));
    } else if (w.kind === 'cones') {
      for (let i = 0; i < n; i++) G.ents.push(makeEnt('cone', VW + 26 + i * 40, VH - 70 - i * 18));
    } else if (w.kind === 'lion') {
      G.ents.push(makeEnt('lion', VW + 40, VH * 0.46));
    } else if (w.kind === 'dancers') {
      for (let i = 0; i < n; i++) G.ents.push(makeEnt('dancer', VW + 22 + i * 38, 60 + i * 70));
    } else if (w.kind === 'rings') {
      for (let i = 0; i < n; i++) G.ents.push(makeEnt('ring', VW + 30 + i * 42, 80 + (i % 2) * 160));
    } else if (w.kind === 'wagon') {
      G.ents.push(makeEnt('wagon', VW + 30, VH * 0.42));
    } else if (w.kind === 'boss') {
      const st = stageOf(G.stage);
      G.ents.push(makeBoss(st.bossKind, st.boss, st.bossHp));
      G.bossIn = true;
      audio.boss();
      toast(st.boss + ' 登场', false, true);
      screenFlash(hueRgb(st.hue), 0.32);
      syncHud();
    }
  }

  function bodyHit(e, x, y, r) {
    if (e.type === 'boss') {
      const bw = (e.w || 90) * 0.42;
      const bh = (e.h || 60) * 0.42;
      const nx = clamp(x, e.x - bw, e.x + bw);
      const ny = clamp(y, e.y - bh, e.y + bh);
      return hypot(x - nx, y - ny) <= r + 3;
    }
    const hw = (e.w || 16) * 0.5;
    const hh = (e.h || 12) * 0.5;
    const nx = clamp(x, e.x - hw, e.x + hw);
    const ny = clamp(y, e.y - hh, e.y + hh);
    return hypot(x - nx, y - ny) <= r;
  }

  function explodeEnt(e, big) {
    const rgb = e.type === 'boss' ? GOLD
      : e.type === 'wagon' ? MINT
      : e.type === 'lion' || e.type === 'cone' ? ORG
      : e.type === 'cat' || e.type === 'dancer' ? PNK
      : GOLD;
    emit(big ? 30 : 12, {
      x: e.x, y: e.y, j: big ? 28 : 10,
      vx0: -170, vx1: 170, vy0: -170, vy1: 170,
      r0: 1.6, r1: big ? 6.2 : 3.4, life: big ? 0.56 : 0.32, rgb: rgb, g: 70
    });
    popSpark(e.x, e.y, rgb, big ? 36 : 16);
    audio.boom(big);
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    const pts = Math.round((e.score || 50) * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, '+' + pts, e.type === 'boss' ? GOLD : WHT, e.type === 'boss' || pts >= 280);
    explodeEnt(e, e.type === 'boss' || e.type === 'wagon' || e.type === 'lion');
    if (maybeBell(e)) spawnBell(e.x, e.y);
    if (e.type === 'boss') onBossDown(e);
    hitStop(e.type === 'boss' ? 0.08 : clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    kick(e.type === 'boss' ? 7.6 : 2.5);
  }

  function hurtEnt(e, dmg, hx, hy) {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitT = 0.08;
    e.flash = 0.1;
    if (e.hp <= 0) {
      killEnt(e);
      return;
    }
    audio.hit(G.combo);
    bumpCombo();
    emit(4, {
      x: hx, y: hy, j: 5,
      vx0: -90, vx1: 40, vy0: -70, vy1: 70,
      r0: 1, r1: 2.4, life: 0.18, rgb: GOLD, g: 0
    });
    hitStop(0.032);
  }

  function onBossDown() {
    G.bossIn = false;
    addScore(Math.round(1500 * (G.stage + 1) * G.mult));
    addScore(SCORE.clear);
    screenFlash(GOLD, 0.5);
    for (let i = 0; i < G.eShots.length; i++) G.eShots[i].dead = true;
    for (let i = 0; i < G.ents.length; i++) {
      const o = G.ents[i];
      if (!o.dead && o.type !== 'boss') o.vx = -260;
    }
    const st = stageOf(G.stage);
    toast(st.name + ' 谢幕', false, true);
    if (G.stage >= STAGES.length - 1) G.winT = 1.8;
    else G.nextT = 1.6;
    syncHud();
  }

  function nextStage() {
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.bossIn = false;
    G.nextT = 0;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.invuln = Math.max(G.invuln, 0.85);
    G.px = clamp(G.px, 40, 160);
    seedDecor();
    const st = stageOf(G.stage);
    audio.start();
    screenFlash(hueRgb(st.hue), 0.4);
    hitStop(0.06);
    kick(3.6);
    toast('第 ' + (G.stage + 1) + ' 幕 · ' + st.name, false, true);
    syncHud();
  }

  function optionSpot(i) {
    const n = Math.max(1, G.optN);
    const form = G.form;
    if (form === 0) {
      const idx = Math.min(G.trail.length - 1, (i + 1) * OPT_GAP);
      const t = G.trail[idx];
      return t ? { x: t.x, y: t.y, a: 0 } : { x: G.px - 18, y: G.py, a: 0 };
    }
    if (form === 1) {
      const a = G.t * 2.45 + i * TAU / n;
      return { x: G.px + Math.cos(a) * 30, y: G.py + Math.sin(a) * 24, a: a };
    }
    if (form === 2) {
      const ys = n === 1 ? [0] : n === 2 ? [-22, 22] : n === 3 ? [-28, 0, 28] : [-36, -14, 14, 36];
      return { x: G.px - 8, y: G.py + ys[i], a: 0 };
    }
    const a = G.t * 3.15 + i * TAU / n;
    return { x: G.px + Math.cos(a) * 34, y: G.py + Math.sin(a) * 26, a: a };
  }

  function syncOptions() {
    while (G.options.length < G.optN) G.options.push({ x: G.px, y: G.py, a: 0 });
    if (G.options.length > G.optN) G.options.length = G.optN;
    for (let i = 0; i < G.options.length; i++) {
      const p = optionSpot(i);
      G.options[i].x = p.x;
      G.options[i].y = p.y;
      G.options[i].a = p.a;
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    G.fireCd = 0.11 - G.optN * 0.005;
    G.muzzle = 0.055;
    audio.shoot();
    const spd = 640;
    G.shots.push(makeShot(G.px + 18, G.py, spd, 0, 1));
    for (let i = 0; i < G.options.length; i++) {
      const o = G.options[i];
      if (G.form === 3) {
        const a = o.a;
        G.shots.push(makeShot(o.x + 6, o.y, Math.cos(a) * 220 + 480, Math.sin(a) * 240, 1, { r: 3, opt: true }));
      } else {
        G.shots.push(makeShot(o.x + 8, o.y, spd * 0.96, 0, 1, { r: 3, opt: true }));
      }
    }
    if (!REDUCE) {
      emit(2, {
        x: G.px + 16, y: G.py, j: 2,
        vx0: 40, vx1: 90, vy0: -20, vy1: 20,
        r0: 1, r1: 2, life: 0.12, rgb: GOLD, g: 0
      });
    }
  }

  function cycleForm() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    G.form = (G.form + 1) % FORMS.length;
    audio.form();
    pulseEl(formLabel, 'form');
    hitStop(0.04);
    kick(3.2);
    screenFlash(MINT, 0.18);
    popSpark(G.px, G.py, MINT, 22);
    floatText(G.px + 16, G.py - 18, formName(), MINT, true);
    if (G.optN <= 0) toast('先捡铃铛', true, false);
    else toast(formName() + '阵', false, true);
    syncHud();
  }

  function collectBell(p) {
    p.dead = true;
    popSpark(p.x, p.y, GOLD, 18);
    screenFlash(GOLD, 0.2);
    hitStop(0.042);
    kick(3.4);
    emit(12, {
      x: p.x, y: p.y, j: 8,
      vx0: -80, vx1: 80, vy0: -110, vy1: 40,
      r0: 1.2, r1: 3.2, life: 0.3, rgb: GOLD, g: 60
    });
    if (G.optN >= OPT_MAX) {
      const pts = Math.round(500 * G.mult);
      addScore(pts);
      audio.bell();
      floatText(p.x, p.y - 8, '满分 +' + pts, GOLD, true);
      toast('铃满', false, true);
    } else {
      G.optN += 1;
      audio.option();
      pulseEl(optLabel, 'opt');
      floatText(p.x, p.y - 8, '分身', GOLD, true);
      toast('分身 ×' + G.optN, false, true);
    }
    syncHud();
  }

  function hurtPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.why = why;
    diePlayer();
  }

  function diePlayer() {
    G.lives -= 1;
    G.deadT = 0.94;
    G.fireHold = false;
    audio.death();
    hitStop(0.074);
    kick(8);
    screenFlash(MAG, 0.55);
    emit(34, {
      x: G.px, y: G.py, j: 18,
      vx0: -210, vx1: 210, vy0: -210, vy1: 210,
      r0: 2, r1: 6.2, life: 0.52, rgb: MAG, g: 50
    });
    popSpark(G.px, G.py, MAG, 32);
    for (let i = 0; i < G.options.length; i++) {
      const o = G.options[i];
      emit(10, {
        x: o.x, y: o.y, j: 8,
        vx0: -140, vx1: 140, vy0: -140, vy1: 140,
        r0: 1.4, r1: 3.6, life: 0.34, rgb: GOLD, g: 40
      });
    }
    for (let i = 0; i < G.eShots.length; i++) G.eShots[i].dead = true;
    if (G.optN > 0) {
      spawnBell(G.px + 24, G.py);
      G.optN = 0;
      G.options.length = 0;
    }
    syncHud();
  }

  function respawn() {
    G.deadT = 0;
    G.invuln = 1.5;
    G.px = 90;
    G.py = VH * 0.5;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.trail.length = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'shot' ? '中弹坠场' : '撞上散架';
    const st = stageOf(G.stage);
    showOverlay(
      'lose',
      '闹剧散了',
      why + ' · ' + st.name + ' · ' + G.score + ' 分。R 重开。'
    );
    syncHud();
  }

  function goWin() {
    addScore(8000);
    G.mode = 'win';
    audio.win();
    screenFlash(GOLD, 0.5);
    showOverlay(
      'win',
      '谢幕了',
      (isRain() ? '乱弹' : '恶搞') + ' · 猫女击破 · ' + G.score + ' 分'
    );
    syncHud();
  }

  function fanShot(x, y, n, spd, spread, rgb) {
    const mid = (n - 1) * 0.5;
    for (let i = 0; i < n; i++) {
      const a = (i - mid) * spread;
      G.eShots.push(makeEShot(x, y, Math.cos(a) * -spd, Math.sin(a) * spd, 3.4, rgb));
    }
  }

  function ringShot(x, y, n, spd, rgb, rot) {
    for (let i = 0; i < n; i++) {
      const a = TAU * i / n + (rot || 0);
      G.eShots.push(makeEShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 3.3, rgb));
    }
  }

  function updateFx(dt) {
    if (G.stop > 0) G.stop = Math.max(0, G.stop - dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.6);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.fireCd > 0) G.fireCd = Math.max(0, G.fireCd - dt);
    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.46) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    const sc = G.mode === 'play' ? scrollSpd() : 26;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= sc * 0.08 * dt;
      s.tw += dt * 2;
      if (s.x < -4) {
        s.x = VW + 6;
        s.y = rand(0, VH * 0.7);
      }
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.x -= m.v * dt;
      m.y += Math.sin(G.t * 2.2 + i) * 10 * dt;
      if (m.x < -6) {
        m.x = VW + 8;
        m.y = rand(0, VH);
      }
    }
    for (let i = 0; i < props.length; i++) {
      const p = props[i];
      p.x -= sc * 0.48 * dt;
      if (p.x < -50) {
        p.x = VW + rand(10, 80);
        p.h = rand(36, 96);
        p.w = rand(16, 34);
        p.k = (hash2((G.scroll | 0) + i) * 4) | 0;
      }
    }
  }

  function updateMove(dt) {
    if (G.deadT > 0) return;
    const spd = plySpd();
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      dx = pointer.x - G.px;
      dy = pointer.y - G.py;
      const d = hypot(dx, dy);
      if (d > 4) {
        const step = Math.min(d, spd * dt * 1.15);
        G.px += dx / d * step;
        G.py += dy / d * step;
        G.lean = lerp(G.lean, clamp(dy / 80, -1, 1), 0.2);
      } else G.lean = lerp(G.lean, 0, 0.15);
    } else {
      const v = moveVec(keys.l, keys.r, keys.u, keys.d);
      G.px += v.x * spd * dt;
      G.py += v.y * spd * dt;
      G.lean = lerp(G.lean, v.y, 0.18);
    }
    G.px = clamp(G.px, 22, G.bossIn ? 420 : 496);
    G.py = clamp(G.py, 22, 428);
    G.trail.unshift({ x: G.px, y: G.py });
    if (G.trail.length > TRAIL_LEN) G.trail.length = TRAIL_LEN;
    syncOptions();
  }

  function updateBoss(e, dt) {
    e.t += dt;
    e.cd -= dt;
    if (e.in) {
      e.x += e.vx * dt;
      if (e.x <= 640) {
        e.x = 640;
        e.in = false;
        e.vx = 0;
      }
      return;
    }
    if (e.hp <= e.maxhp * 0.5 && e.phase === 1) {
      e.phase = 2;
      toast(e.name + ' 急了', false, true);
      audio.boss();
      screenFlash(PNK, 0.28);
    }
    const rain = isRain() ? 0.8 : 1;
    if (e.kind === 'pen') {
      e.y = VH * 0.5 + Math.sin(e.t * 1.5) * 92;
      if (e.phase === 2) e.x = 640 + Math.sin(e.t * 1.05) * 64;
      if (e.cd <= 0) {
        fanShot(e.x - 28, e.y, e.phase === 2 ? 7 : 5, isRain() ? 168 : 138, 0.22, CYN);
        G.eShots.push(aimShot(e.x - 18, e.y + 10, G.px, G.py, isRain() ? 180 : 146, 4.2, GOLD));
        e.cd = (e.phase === 2 ? 0.7 : 1.02) * rain;
      }
    } else if (e.kind === 'octo') {
      e.y = VH * 0.5 + Math.sin(e.t * 0.85) * 70;
      e.x = 630 + Math.cos(e.t * 0.55) * 26;
      if (e.cd <= 0) {
        if (((e.t * 2) | 0) % 2 === 0) {
          ringShot(e.x - 8, e.y, e.phase === 2 ? 14 : 10, isRain() ? 128 : 106, PURP, e.t);
        } else {
          fanShot(e.x - 30, e.y, e.phase === 2 ? 6 : 4, 132, 0.3, INK);
        }
        e.cd = (e.phase === 2 ? 0.76 : 1.1) * rain;
      }
    } else {
      e.y = VH * 0.5 + Math.sin(e.t * 1.1) * 78;
      e.x = 624 + Math.cos(e.t * 0.7) * 30;
      if (e.cd <= 0) {
        fanShot(e.x - 24, e.y, e.phase === 2 ? 8 : 5, isRain() ? 160 : 132, 0.2, PNK);
        if (e.phase === 2) {
          ringShot(e.x, e.y, 12, isRain() ? 118 : 96, GOLD, e.t * 0.8);
          G.eShots.push(aimShot(e.x - 16, e.y, G.px, G.py, isRain() ? 196 : 158, 4.6, MAG));
        }
        e.cd = (e.phase === 2 ? 0.68 : 0.98) * rain;
      }
    }
  }

  function updateEnts(dt) {
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.dead) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.hitT > 0) e.hitT -= dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.type === 'boss') {
        updateBoss(e, dt);
        continue;
      }
      e.x += (e.vx || 0) * dt;
      e.spin += dt * 4;
      if (e.type === 'balloon') {
        e.bob += dt * 2.4;
        e.y = e.baseY + Math.sin(e.bob) * e.amp;
      } else if (e.type === 'clown') {
        e.bob += dt * 2.2;
        e.y += Math.sin(e.bob) * 28 * dt;
        e.cd -= dt;
        if (e.cd <= 0) {
          G.eShots.push(aimShot(e.x - 6, e.y, G.px, G.py, isRain() ? 148 : 116, 3.6, ORG));
          e.cd = isRain() ? 1.12 : 1.46;
        }
      } else if (e.type === 'penguin') {
        if (e.dive) {
          e.y += clamp(G.py - e.y, -96, 96) * dt * 1.35;
        } else {
          e.bob += dt * 3;
          e.y = e.baseY + Math.sin(e.bob) * e.amp;
        }
      } else if (e.type === 'octo') {
        e.bob += dt * 1.5;
        e.y += Math.sin(e.bob) * 18 * dt;
        e.cd -= dt;
        if (e.cd <= 0) {
          fanShot(e.x - 8, e.y, 3, 118, 0.26, PURP);
          e.cd = isRain() ? 1.2 : 1.55;
        }
      } else if (e.type === 'fish') {
        e.bob += dt * 3.4;
        e.y = e.baseY + Math.sin(e.bob) * e.amp;
      } else if (e.type === 'cat') {
        e.bob += dt * 2.8;
        e.y += Math.sin(e.bob) * 26 * dt;
        e.y += (G.py - e.y) * dt * 0.18;
        e.cd -= dt;
        if (e.cd <= 0) {
          G.eShots.push(aimShot(e.x, e.y, G.px, G.py, isRain() ? 156 : 124, 3.2, PNK));
          e.cd = isRain() ? 1.08 : 1.4;
        }
      } else if (e.type === 'coin') {
        e.y += Math.sin(e.spin * 1.4) * 20 * dt;
      } else if (e.type === 'cone') {
        e.vy += 180 * dt;
        e.y += e.vy * dt;
        if (e.y > VH - 36) {
          e.y = VH - 36;
          e.vy = -150;
        }
      } else if (e.type === 'lion') {
        e.bob += dt * 1.6;
        e.y += Math.sin(e.bob) * 14 * dt;
        e.cd -= dt;
        if (e.cd <= 0) {
          fanShot(e.x - 10, e.y, 4, 126, 0.2, ORG);
          e.cd = isRain() ? 1.15 : 1.5;
        }
      } else if (e.type === 'dancer') {
        e.bob += dt * 3.2;
        e.y += Math.sin(e.bob) * 32 * dt;
        e.cd -= dt;
        if (e.cd <= 0) {
          fanShot(e.x - 6, e.y, 3, 122, 0.3, MAG);
          e.cd = isRain() ? 1.1 : 1.42;
        }
      } else if (e.type === 'ring') {
        e.bob += dt * 2;
        e.y = e.baseY + Math.sin(e.bob) * 20;
        e.cd -= dt;
        if (e.cd <= 0) {
          ringShot(e.x, e.y, 6, 90, GOLD, e.spin);
          e.cd = isRain() ? 1.35 : 1.7;
        }
      } else if (e.type === 'wagon') {
        e.y += Math.sin(G.t * 2.1) * 12 * dt;
      }
      if (e.x < -50 || e.y < -60 || e.y > VH + 60) e.dead = true;
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > VW + 30 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const e = G.ents[j];
        if (e.dead) continue;
        if (bodyHit(e, s.x, s.y, s.r)) {
          hurtEnt(e, s.dmg, s.x, s.y);
          s.dead = true;
          hit = true;
          break;
        }
      }
      if (hit || s.dead) G.shots.splice(i, 1);
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.dead || s.life <= 0 || s.x < -20 || s.x > VW + 30 || s.y < -20 || s.y > VH + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && hypot(s.x - G.px, s.y - G.py) < 7 + s.r * 0.55) {
        s.dead = true;
        G.eShots.splice(i, 1);
        hurtPlayer('shot');
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 110 * dt;
      if (p.y > VH - 22) {
        p.y = VH - 22;
        p.vy *= -0.78;
      }
      if (p.y < 18) {
        p.y = 18;
        p.vy *= -0.7;
      }
      if (p.x < -20 || p.t > 9) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && hypot(p.x - G.px, p.y - G.py) < 22) {
        collectBell(p);
        G.pows.splice(i, 1);
      }
    }
  }

  function maybeSpawn() {
    if (G.bossIn || G.winT > 0 || G.nextT > 0) return;
    const st = stageOf(G.stage);
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      spawnWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function update(dt) {
    updateFx(dt);
    if (G.mode !== 'play') {
      G.t += dt;
      G.scroll += 26 * dt;
      G.py = VH * 0.5 + Math.sin(G.t * 1.4) * 10;
      return;
    }
    if (G.stop > 0) return;
    G.t += dt;
    G.scroll += scrollSpd() * dt;
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        respawn();
      }
    }
    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) {
        goWin();
        return;
      }
    }
    if (G.nextT > 0) {
      G.nextT -= dt;
      if (G.nextT <= 0) nextStage();
    }
    if (!G.bossIn) G.stageT += dt;
    updateMove(dt);
    if (G.fireHold && G.deadT <= 0) fire();
    if (!REDUCE && G.deadT <= 0 && ((G.t * 22) | 0) !== (((G.t - dt) * 22) | 0)) {
      emit(1, {
        x: G.px - 16, y: G.py + 3, j: 2.2,
        vx0: -90, vx1: -20, vy0: -16, vy1: 16,
        r0: 1.1, r1: 2.6, life: 0.22, rgb: PNK, g: 0
      });
    }
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
    if (G.deadT <= 0) {
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.dead) continue;
        if (bodyHit(e, G.px, G.py, 8)) {
          if (e.type === 'boss') hurtPlayer('crash');
          else {
            const was = G.deadT <= 0;
            hurtPlayer('crash');
            if (was && !e.dead) killEnt(e);
          }
        }
      }
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else comboEl.hidden = true;
    }
  }

  function starPath(c, x, y, r, n, inner) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n;
      const rad = i % 2 === 0 ? r : r * inner;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawWorld() {
    const c = ctx;
    const st = stageOf(G.stage);
    const hue = st.hue;
    const top = hueRgb(hue, 0.48, 0.1);
    const mid = hueRgb((hue + 28) % 360, 0.5, 0.15);
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, rgba(top, 1));
    g.addColorStop(0.55, rgba(mid, 1));
    g.addColorStop(1, rgba(DEEP, 1));
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const moonX = 0.78 * VW;
    const moonY = 0.16 * VH;
    c.fillStyle = rgba(st.id === 1 ? ORG : st.id === 2 ? PURP : GOLD, 0.16);
    c.beginPath();
    c.arc(sx(moonX), sy(moonY), 38 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(st.id === 1 ? ORG : GOLD, 0.85);
    c.beginPath();
    c.arc(sx(moonX), sy(moonY), 22 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(top, 1);
    c.beginPath();
    c.arc(sx(moonX + 8), sy(moonY - 4), 16 * scale, 0, TAU);
    c.fill();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.55 + 0.45 * Math.sin(s.tw));
      c.fillStyle = rgba(WHT, a);
      c.fillRect(sx(s.x), sy(s.y), s.s * scale, s.s * scale);
    }

    const y0 = st.id === 1 ? VH * 0.76 : VH * 0.8;
    c.beginPath();
    c.moveTo(sx(-16), sy(VH + 6));
    c.lineTo(sx(-16), sy(y0));
    const step = 30;
    const sc = G.scroll * 0.32;
    for (let x = 0; x <= VW + 40; x += step) {
      const h = hash2(((x + sc) / step) | 0);
      const y = y0 - 12 - h * (st.id === 2 ? 54 : 38);
      c.lineTo(sx(x), sy(y));
    }
    c.lineTo(sx(VW + 20), sy(VH + 6));
    c.closePath();
    c.fillStyle = rgba(hueRgb(hue, 0.42, 0.11), 0.95);
    c.fill();

    if (st.id === 0) {
      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        const tx = sx(p.x);
        const ty = sy(VH - 6);
        c.fillStyle = rgba(p.k % 2 === 0 ? PNK : GOLD, 0.9);
        c.beginPath();
        c.moveTo(tx, ty - p.h * scale);
        c.lineTo(tx - p.w * 0.7 * scale, ty);
        c.lineTo(tx + p.w * 0.7 * scale, ty);
        c.closePath();
        c.fill();
        c.strokeStyle = rgba(WHT, 0.28);
        c.lineWidth = Math.max(1, 1.1 * scale);
        c.beginPath();
        c.moveTo(tx, ty - p.h * scale);
        c.lineTo(tx, ty);
        c.stroke();
      }
    } else if (st.id === 1) {
      c.fillStyle = rgba([48, 18, 40], 0.55);
      c.fillRect(sx(0), sy(VH * 0.84), VW * scale, VH * 0.18 * scale);
      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        c.fillStyle = rgba(p.k === 0 ? PNK : p.k === 1 ? GOLD : MINT, 0.85);
        c.beginPath();
        c.arc(sx(p.x), sy(VH - 18), p.w * 0.55 * scale, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.8);
        c.beginPath();
        c.moveTo(sx(p.x - 5), sy(VH - 10));
        c.lineTo(sx(p.x), sy(VH - 4));
        c.lineTo(sx(p.x + 5), sy(VH - 10));
        c.closePath();
        c.fill();
      }
    } else {
      for (let i = 0; i < props.length; i++) {
        const p = props[i];
        c.fillStyle = rgba(hueRgb(278, 0.4, 0.14), 0.92);
        c.fillRect(sx(p.x - p.w * 0.5), sy(VH - p.h * 0.55), p.w * scale, p.h * 0.55 * scale);
        c.fillStyle = rgba(i % 2 === 0 ? PNK : MINT, 0.55 + 0.25 * Math.sin(G.t * 4 + i));
        c.fillRect(sx(p.x - 5), sy(VH - p.h * 0.4), 10 * scale, 8 * scale);
      }
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      c.fillStyle = rgba(m.rgb, m.a);
      c.beginPath();
      c.arc(sx(m.x), sy(m.y), m.s * scale, 0, TAU);
      c.fill();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const c = ctx;
    const x = sx(G.px);
    const y = sy(G.py);
    const s = scale;
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink) c.globalAlpha = 0.4;
    const lean = clamp(G.lean, -0.4, 0.4);
    c.save();
    c.translate(x, y);
    c.rotate(lean * 0.32);

    c.fillStyle = rgba(PNK, 0.28);
    c.beginPath();
    c.moveTo(-22 * s, 0);
    c.lineTo(-34 * s, -8 * s);
    c.lineTo(-34 * s, 8 * s);
    c.closePath();
    c.fill();

    c.fillStyle = rgba(PNK, 0.96);
    c.beginPath();
    c.moveTo(-12 * s, -7 * s);
    c.lineTo(18 * s, 0);
    c.lineTo(-12 * s, 7 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.95);
    c.fillRect(-2 * s, -3.2 * s, 12 * s, 6.4 * s);

    c.fillStyle = rgba(WHT, 1);
    c.beginPath();
    c.ellipse(-8 * s, -2 * s, 7.2 * s, 6.4 * s, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.95);
    c.beginPath();
    c.ellipse(-8 * s, 1.4 * s, 4.4 * s, 3.4 * s, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(ORG, 1);
    c.beginPath();
    c.moveTo(-2 * s, -1 * s);
    c.lineTo(6 * s, 0);
    c.lineTo(-2 * s, 1.4 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(DEEP, 0.95);
    c.beginPath();
    c.arc(-9.4 * s, -3.2 * s, 1.1 * s, 0, TAU);
    c.arc(-5.6 * s, -3.2 * s, 1.1 * s, 0, TAU);
    c.fill();

    if (G.muzzle > 0) {
      c.fillStyle = rgba(GOLD, clamp(G.muzzle * 10, 0, 1));
      c.beginPath();
      c.arc(20 * s, 0, (5 + G.muzzle * 40) * s, 0, TAU);
      c.fill();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  function drawOptions() {
    if (G.deadT > 0) return;
    const c = ctx;
    const s = scale;
    if (G.form === 1 && G.optN > 0) {
      c.strokeStyle = rgba(MINT, 0.22);
      c.lineWidth = Math.max(1, 1.2 * s);
      c.beginPath();
      c.ellipse(sx(G.px), sy(G.py), 30 * s, 24 * s, 0, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < G.options.length; i++) {
      const o = G.options[i];
      const x = sx(o.x);
      const y = sy(o.y);
      c.fillStyle = rgba(GOLD, 0.28);
      c.beginPath();
      c.arc(x, y, 9 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.96);
      c.beginPath();
      c.arc(x, y, 5.2 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(x - 1.2 * s, y - 1.2 * s, 1.6 * s, 0, TAU);
      c.fill();
    }
  }

  function drawEnt(e) {
    const c = ctx;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    const flash = e.hitT > 0;
    c.save();
    if (flash) c.globalAlpha = 0.55 + 0.45 * Math.sin(G.t * 40);
    if (e.type === 'boss') {
      drawBoss(e);
      c.restore();
      return;
    }
    if (e.type === 'balloon') {
      c.strokeStyle = rgba(WHT, 0.45);
      c.lineWidth = Math.max(1, 1 * s);
      c.beginPath();
      c.moveTo(x, y + 8 * s);
      c.lineTo(x, y + 16 * s);
      c.stroke();
      c.fillStyle = rgba(PNK, 0.95);
      c.beginPath();
      c.ellipse(x, y, 7 * s, 9 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.45);
      c.beginPath();
      c.arc(x - 2 * s, y - 3 * s, 2 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'clown') {
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(x, y, 9 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MAG, 1);
      c.beginPath();
      c.arc(x, y + 1 * s, 2.4 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(PNK, 0.9);
      c.beginPath();
      c.arc(x - 8 * s, y - 6 * s, 4 * s, 0, TAU);
      c.arc(x + 8 * s, y - 6 * s, 4 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 3 * s, y - 2 * s, 1.2 * s, 0, TAU);
      c.arc(x + 3 * s, y - 2 * s, 1.2 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'penguin') {
      c.fillStyle = rgba(DEEP, 0.95);
      c.beginPath();
      c.ellipse(x, y, 7 * s, 9 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.ellipse(x, y + 2 * s, 4.4 * s, 5.2 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(ORG, 1);
      c.beginPath();
      c.moveTo(x + 6 * s, y);
      c.lineTo(x + 12 * s, y + 1 * s);
      c.lineTo(x + 6 * s, y + 3 * s);
      c.closePath();
      c.fill();
    } else if (e.type === 'octo') {
      c.fillStyle = rgba(ORG, 0.95);
      c.beginPath();
      c.arc(x, y - 2 * s, 10 * s, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(ORG, 0.9);
      c.lineWidth = Math.max(1.4, 2 * s);
      for (let k = -2; k <= 2; k++) {
        c.beginPath();
        c.moveTo(x + k * 4 * s, y + 6 * s);
        c.quadraticCurveTo(x + k * 6 * s, y + 14 * s, x + k * 3 * s, y + 18 * s);
        c.stroke();
      }
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 3.4 * s, y - 3 * s, 1.4 * s, 0, TAU);
      c.arc(x + 3.4 * s, y - 3 * s, 1.4 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'fish') {
      c.fillStyle = rgba(MINT, 0.95);
      c.beginPath();
      c.ellipse(x, y, 9 * s, 5 * s, 0, 0, TAU);
      c.fill();
      c.beginPath();
      c.moveTo(x - 8 * s, y);
      c.lineTo(x - 14 * s, y - 5 * s);
      c.lineTo(x - 14 * s, y + 5 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x + 4 * s, y - 1 * s, 1.1 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'cat') {
      c.fillStyle = rgba(HOT, 0.95);
      c.beginPath();
      c.arc(x, y, 8 * s, 0, TAU);
      c.fill();
      c.beginPath();
      c.moveTo(x - 7 * s, y - 4 * s);
      c.lineTo(x - 4 * s, y - 13 * s);
      c.lineTo(x - 1 * s, y - 5 * s);
      c.fill();
      c.beginPath();
      c.moveTo(x + 7 * s, y - 4 * s);
      c.lineTo(x + 4 * s, y - 13 * s);
      c.lineTo(x + 1 * s, y - 5 * s);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 2.6 * s, y - 1 * s, 1.1 * s, 0, TAU);
      c.arc(x + 2.6 * s, y - 1 * s, 1.1 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'coin') {
      c.save();
      c.translate(x, y);
      c.scale(0.45 + 0.55 * Math.abs(Math.cos(e.spin)), 1);
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(0, 0, 7 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(ORG, 0.8);
      c.beginPath();
      c.arc(0, 0, 3 * s, 0, TAU);
      c.fill();
      c.restore();
    } else if (e.type === 'cone') {
      c.fillStyle = rgba(PNK, 0.95);
      c.beginPath();
      c.arc(x, y - 6 * s, 7 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.moveTo(x - 7 * s, y - 2 * s);
      c.lineTo(x, y + 14 * s);
      c.lineTo(x + 7 * s, y - 2 * s);
      c.closePath();
      c.fill();
    } else if (e.type === 'lion') {
      c.fillStyle = rgba(ORG, 0.95);
      c.beginPath();
      c.arc(x, y, 13 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.7);
      c.beginPath();
      c.arc(x - 10 * s, y - 6 * s, 6 * s, 0, TAU);
      c.arc(x + 10 * s, y - 6 * s, 6 * s, 0, TAU);
      c.arc(x, y + 10 * s, 6 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 4 * s, y - 2 * s, 1.5 * s, 0, TAU);
      c.arc(x + 4 * s, y - 2 * s, 1.5 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'dancer') {
      c.fillStyle = rgba(MAG, 0.95);
      c.beginPath();
      c.arc(x, y - 6 * s, 6 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(PNK, 0.9);
      c.beginPath();
      c.moveTo(x, y - 2 * s);
      c.lineTo(x - 10 * s, y + 14 * s);
      c.lineTo(x + 10 * s, y + 14 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      starPath(c, x, y - 14 * s, 4 * s, 5, 0.45);
      c.fill();
    } else if (e.type === 'ring') {
      c.strokeStyle = rgba(GOLD, 0.95);
      c.lineWidth = Math.max(2, 3.2 * s);
      c.beginPath();
      c.arc(x, y, 10 * s, 0, TAU);
      c.stroke();
      c.strokeStyle = rgba(PNK, 0.7);
      c.lineWidth = Math.max(1, 1.4 * s);
      c.beginPath();
      c.arc(x, y, 6 * s, 0, TAU);
      c.stroke();
    } else if (e.type === 'wagon') {
      c.fillStyle = rgba([140, 70, 40], 0.95);
      c.fillRect(x - 16 * s, y - 6 * s, 32 * s, 14 * s);
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(x, y - 12 * s, 8 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.8);
      c.beginPath();
      c.arc(x - 10 * s, y + 10 * s, 4 * s, 0, TAU);
      c.arc(x + 10 * s, y + 10 * s, 4 * s, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawBoss(e) {
    const c = ctx;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    if (e.kind === 'pen') {
      c.fillStyle = rgba(DEEP, 0.96);
      c.beginPath();
      c.ellipse(x, y, 34 * s, 40 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.96);
      c.beginPath();
      c.ellipse(x - 6 * s, y + 8 * s, 18 * s, 24 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(ORG, 1);
      c.beginPath();
      c.moveTo(x - 28 * s, y - 4 * s);
      c.lineTo(x - 52 * s, y);
      c.lineTo(x - 28 * s, y + 8 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(PNK, 0.9);
      c.beginPath();
      c.ellipse(x + 6 * s, y + 6 * s, 8 * s, 6 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 1);
      c.beginPath();
      c.arc(x - 8 * s, y - 14 * s, 7 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.95);
      c.beginPath();
      c.arc(x - 10 * s, y - 14 * s, 2.2 * s, 0, TAU);
      c.fill();
    } else if (e.kind === 'octo') {
      c.fillStyle = rgba(ORG, 0.96);
      c.beginPath();
      c.arc(x, y - 4 * s, 40 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      c.fillRect(x - 22 * s, y - 44 * s, 44 * s, 12 * s);
      c.beginPath();
      c.moveTo(x - 16 * s, y - 44 * s);
      c.lineTo(x, y - 62 * s);
      c.lineTo(x + 16 * s, y - 44 * s);
      c.closePath();
      c.fill();
      c.strokeStyle = rgba(ORG, 0.9);
      c.lineWidth = Math.max(2, 3.2 * s);
      for (let k = -3; k <= 3; k++) {
        c.beginPath();
        c.moveTo(x + k * 8 * s, y + 28 * s);
        c.quadraticCurveTo(
          x + k * 14 * s + Math.sin(G.t * 3 + k) * 8 * s,
          y + 48 * s,
          x + k * 6 * s,
          y + 62 * s
        );
        c.stroke();
      }
      c.fillStyle = rgba(DEEP, 0.92);
      c.beginPath();
      c.arc(x - 12 * s, y - 6 * s, 4 * s, 0, TAU);
      c.arc(x + 12 * s, y - 6 * s, 4 * s, 0, TAU);
      c.fill();
    } else {
      c.fillStyle = rgba(HOT, 0.96);
      c.beginPath();
      c.ellipse(x, y + 8 * s, 36 * s, 28 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(PNK, 0.95);
      c.beginPath();
      c.arc(x - 8 * s, y - 18 * s, 18 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MAG, 0.95);
      c.beginPath();
      c.moveTo(x - 22 * s, y - 24 * s);
      c.lineTo(x - 14 * s, y - 48 * s);
      c.lineTo(x - 4 * s, y - 26 * s);
      c.fill();
      c.beginPath();
      c.moveTo(x + 6 * s, y - 24 * s);
      c.lineTo(x + 2 * s, y - 46 * s);
      c.lineTo(x - 4 * s, y - 22 * s);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      starPath(c, x + 16 * s, y - 36 * s, 8 * s, 5, 0.45);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.92);
      c.beginPath();
      c.arc(x - 14 * s, y - 20 * s, 2.4 * s, 0, TAU);
      c.arc(x - 4 * s, y - 20 * s, 2.4 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MAG, 0.85);
      c.beginPath();
      c.ellipse(x - 8 * s, y - 10 * s, 8 * s, 4 * s, 0, 0, TAU);
      c.fill();
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = sx(s.x);
      const y = sy(s.y);
      c.fillStyle = rgba(s.opt ? MINT : GOLD, 0.95);
      starPath(c, x, y, s.r * 1.6 * scale, 4, 0.45);
      c.fill();
      c.fillStyle = rgba(WHT, 0.85);
      c.beginPath();
      c.arc(x, y, Math.max(1.2, s.r * 0.5 * scale), 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.fillStyle = rgba(s.opt ? MINT : GOLD, 0.22);
        c.beginPath();
        c.ellipse(x - 10 * scale, y, 10 * scale, 3 * scale, 0, 0, TAU);
        c.fill();
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      c.fillStyle = rgba(s.rgb || PNK, 0.95);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.arc(sx(s.x - 0.8), sy(s.y - 0.8), s.r * 0.35 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawPows() {
    const c = ctx;
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const x = sx(p.x);
      const y = sy(p.y + Math.sin(p.t * 8) * 2);
      const s = scale;
      c.save();
      c.translate(x, y);
      c.rotate(Math.sin(p.t * 5) * 0.15);
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(0, -1 * s, 8 * s, Math.PI * 0.15, Math.PI - Math.PI * 0.15);
      c.fill();
      c.fillStyle = rgba(ORG, 0.9);
      c.fillRect(-1.2 * s, 6 * s, 2.4 * s, 5 * s);
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.arc(-2 * s, -3 * s, 2 * s, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * scale * (0.6 + 0.4 * a), 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = Math.max(1, 1.6 * scale);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (s.rad * (0.3 + s.t * 3)) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.46;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = Math.max(1.2, 2.4 * scale * a);
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + r.t * 90) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.globalAlpha = a;
      c.fillStyle = rgba(f.rgb, 1);
      c.font = '700 ' + Math.round(f.size * scale) + 'px sans-serif';
      c.textAlign = 'center';
      c.fillText(f.text, sx(f.x), sy(f.y));
      c.globalAlpha = 1;
    }
  }

  function drawBossBar() {
    if (!G.bossIn) return;
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && !G.ents[i].dead) {
        boss = G.ents[i];
        break;
      }
    }
    if (!boss) return;
    const c = ctx;
    const w = 220;
    const x = (VW - w) * 0.5;
    const y = 14;
    c.fillStyle = rgba(DEEP, 0.55);
    c.fillRect(sx(x), sy(y), w * scale, 10 * scale);
    const t = clamp(boss.hp / boss.maxhp, 0, 1);
    c.fillStyle = rgba(t < 0.35 ? MAG : PNK, 0.95);
    c.fillRect(sx(x), sy(y), w * t * scale, 10 * scale);
    c.strokeStyle = rgba(WHT, 0.45);
    c.lineWidth = Math.max(1, 1 * scale);
    c.strokeRect(sx(x), sy(y), w * scale, 10 * scale);
    c.fillStyle = rgba(GOLD, 0.9);
    c.font = Math.round(10 * scale) + 'px sans-serif';
    c.textAlign = 'center';
    c.fillText(boss.name, sx(VW * 0.5), sy(y - 4));
  }

  function draw() {
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#120610';
    c.fillRect(0, 0, W, H);
    c.save();
    let kx = 0;
    let ky = 0;
    if (G.shake > 0 && !REDUCE) {
      kx = (Math.random() - 0.5) * G.shake * 1.4;
      ky = (Math.random() - 0.5) * G.shake * 1.2;
    }
    c.translate(kx, ky);
    if (G.punch !== 1 && !REDUCE) {
      c.translate(sx(VW * 0.5), sy(VH * 0.5));
      c.scale(G.punch, G.punch);
      c.translate(-sx(VW * 0.5), -sy(VH * 0.5));
    }
    drawWorld();
    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawPows();
    drawShots();
    drawOptions();
    drawShip();
    drawFx();
    drawBossBar();
    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb || GOLD, G.flash);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    c.restore();
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

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function startGame(kind) {
    G.kind = kind === 'rain' ? 'rain' : 'gag';
    G.mode = 'play';
    G.t = 0;
    G.stage = 0;
    G.stageT = 0;
    G.waveI = 0;
    G.scroll = 0;
    G.px = 90;
    G.py = VH * 0.5;
    G.lean = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.optN = 0;
    G.form = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.winT = 0;
    G.nextT = 0;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.bossIn = false;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedDecor();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isRain() ? '乱弹 · 更密更快' : '恶搞 · 马戏', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'gag';
    G.stage = 0;
    G.lives = LIVES;
    G.optN = 0;
    G.form = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bossIn = false;
    G.px = 90;
    G.py = VH * 0.5;
    clearField();
    seedDecor();
    G.ents.push(makeBoss('pen', '大企鹅', 88));
    G.ents[0].x = VW - 150;
    G.ents[0].y = VH * 0.55;
    G.ents[0].in = false;
    showOverlay(
      'title',
      '帕罗',
      '横向恶搞射击。捡铃铛出分身，Shift 换阵型。撞上掉命。过关才见 Boss。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('gag');
    else startGame(G.kind || 'gag');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('gag');
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
    const isForm = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'Left' || k === 'Right' || k === 'Up' || k === 'Down';
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

    if (down && (isMove || space || isForm || k === 'Enter')) e.preventDefault();

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
    if (isForm) {
      if (!e.repeat) cycleForm();
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

  if (btnGag) {
    btnGag.addEventListener('click', function () {
      audio.ensure();
      startGame('gag');
    });
  }
  if (btnRain) {
    btnRain.addEventListener('click', function () {
      audio.ensure();
      startGame('rain');
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
      if (G.mode === 'win' && !isRain()) startGame('rain');
      else goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnForm) btnForm.addEventListener('click', cycleForm);
  if (btnPad) btnPad.addEventListener('click', cycleForm);
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
