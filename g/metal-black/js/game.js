'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.3;
  const STAGE_LEN = 2000;
  const TAP = 0.08;
  const CHG1 = 0.38;
  const CHG2 = 0.82;
  const CHG3 = 1.32;
  const BEST_KEY = 'playbox-metal-black-best';
  const MUTE_KEY = 'playbox-metal-black-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格点射（按住蓄力）· R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const CYN = [61, 184, 255];
  const SKY = [122, 208, 255];
  const GOLD = [255, 227, 107];
  const ORG = [255, 196, 77];
  const WHT = [232, 244, 255];
  const TEAL = [20, 200, 192];
  const COP = [255, 106, 61];
  const DEEP = [8, 28, 38];
  const BLK = [18, 28, 36];

  const SCORE = {
    fish: 50,
    jelly: 80,
    eel: 220,
    crab: 70,
    squid: 140,
    drone: 55,
    sat: 90,
    mine: 60,
    heavy: 160,
    clash: 80,
    orb: 10,
    boss: [4000, 8000],
    clear: 2000
  };

  const STAGES = [
    {
      name: '黑海',
      boss: '深渊鲸',
      bossHp: 80,
      sea: true,
      waves: [
        { x: 30, kind: 'fish', n: 4, y: 0.38 },
        { x: 160, kind: 'jelly', n: 2 },
        { x: 260, kind: 'fish', n: 5, y: 0.62 },
        { x: 360, kind: 'crab', side: 1 },
        { x: 440, kind: 'eel', n: 8 },
        { x: 560, kind: 'squid' },
        { x: 640, kind: 'fish', n: 5, y: 0.28 },
        { x: 720, kind: 'jelly', n: 3 },
        { x: 820, kind: 'crab', side: -1 },
        { x: 900, kind: 'fish', n: 6, y: 0.5 },
        { x: 1000, kind: 'eel', n: 10 },
        { x: 1120, kind: 'squid' },
        { x: 1200, kind: 'crab', side: 1 },
        { x: 1240, kind: 'crab', side: -1 },
        { x: 1340, kind: 'fish', n: 4, y: 0.32 },
        { x: 1400, kind: 'fish', n: 4, y: 0.68 },
        { x: 1500, kind: 'jelly', n: 3 },
        { x: 1600, kind: 'eel', n: 11 },
        { x: 1720, kind: 'squid' },
        { x: 1820, kind: 'fish', n: 6, y: 0.48 }
      ]
    },
    {
      name: '虚空',
      boss: '核芯塔',
      bossHp: 112,
      sea: false,
      waves: [
        { x: 20, kind: 'drone', n: 5, y: 0.42 },
        { x: 140, kind: 'sat' },
        { x: 220, kind: 'mine', n: 2 },
        { x: 300, kind: 'drone', n: 6, y: 0.58 },
        { x: 400, kind: 'heavy' },
        { x: 500, kind: 'eel', n: 9 },
        { x: 620, kind: 'sat' },
        { x: 700, kind: 'drone', n: 5, y: 0.3 },
        { x: 780, kind: 'drone', n: 5, y: 0.7 },
        { x: 880, kind: 'mine', n: 3 },
        { x: 980, kind: 'heavy' },
        { x: 1080, kind: 'sat' },
        { x: 1160, kind: 'eel', n: 11 },
        { x: 1280, kind: 'drone', n: 7, y: 0.5 },
        { x: 1380, kind: 'mine', n: 2 },
        { x: 1460, kind: 'heavy' },
        { x: 1560, kind: 'sat' },
        { x: 1640, kind: 'eel', n: 10 },
        { x: 1760, kind: 'drone', n: 6, y: 0.36 },
        { x: 1860, kind: 'heavy' }
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
  const btnSea = document.getElementById('btn-sea');
  const btnTide = document.getElementById('btn-tide');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnFire = document.getElementById('btn-fire');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const aloneLabel = document.getElementById('alone-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chgBar = document.getElementById('chg-bar');
  const chgWrap = document.getElementById('chg-wrap');

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

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  let uid = 1;
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const bubbles = [];
  const kelp = [];

  const G = {
    mode: 'title',
    kind: 'sea',
    t: 0,
    cam: 0,
    px: 90,
    py: VH * 0.5,
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
    orbs: [],
    spawnI: 0,
    fireHold: false,
    holdT: 0,
    chargeT: 0,
    charged: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    boss: false,
    winT: 0,
    lastLv: 0,
    beam: {
      on: false,
      t: 0,
      life: 0,
      lv: 0,
      h: 0,
      tick: 0,
      hit: {},
      first: true
    }
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
  function isTide() {
    return G.kind === 'tide';
  }
  function isSea() {
    return stageInfo().sea;
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }
  function moveSpd() {
    return isTide() ? 318 : 276;
  }
  function scrollSpd() {
    if (G.boss) {
      const b = findBoss();
      if (b && b.alive) {
        const x = b.x - G.cam;
        if (x < VW - 220) return isTide() ? 10 : 6;
        if (x < VW - 140) return isTide() ? 36 : 22;
      }
      return isTide() ? 48 : 32;
    }
    return isTide() ? 152 : 104;
  }
  function gaugeLevel() {
    if (G.chargeT >= CHG3) return 3;
    if (G.chargeT >= CHG2) return 2;
    if (G.chargeT >= CHG1) return 1;
    return 0;
  }
  function chargeLevel() {
    if (G.beam.on) return G.beam.lv;
    return gaugeLevel();
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
      this.beep(920, 0.045, 'square', 0.03, 1840);
    },
    chargeTick(lv) {
      this.ensure();
      const f = 180 + lv * 160;
      this.beep(f, 0.08, 'sine', 0.032, f * 1.7);
      if (lv >= 3) this.beep(90, 0.16, 'sawtooth', 0.04, 220);
    },
    beam(lv) {
      this.ensure();
      this.noise(0.12 + lv * 0.05, 0.06, 220);
      this.beep(140 + lv * 36, 0.22, 'sawtooth', 0.06, 56);
      this.beep(380 + lv * 90, 0.14, 'square', 0.042, 140);
      if (lv >= 3) this.beep(70, 0.32, 'triangle', 0.05, 40);
    },
    clash() {
      this.ensure();
      this.noise(0.08, 0.05, 400);
      this.beep(220, 0.1, 'sawtooth', 0.05, 80);
      this.beep(880, 0.08, 'square', 0.04, 220);
    },
    orb() {
      this.ensure();
      this.beep(660, 0.05, 'sine', 0.028, 1320);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 190 : kind === 'eel' ? 340 : 470;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.034, 1100);
      this.beep(base * lift, 0.07, 'square', 0.044, base * lift * 1.5);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.065, 280);
      this.beep(260, 0.22, 'sawtooth', 0.052, 60);
      this.beep(120, 0.34, 'sine', 0.045, 36);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.045, 1046);
      this.beep(1046, 0.28, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(200, 0.18, 'sawtooth', 0.04, 80);
      this.beep(110, 0.3, 'sine', 0.05, 42);
    },
    start() {
      this.ensure();
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.035, 990);
    },
    warn() {
      this.ensure();
      this.beep(180, 0.16, 'square', 0.04, 90);
      this.beep(270, 0.22, 'sawtooth', 0.035, 70);
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
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.up();
        syncPips();
      }
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

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < G.lives) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > Math.max(G.lives, LIVES)) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.className = 'hint' + (cls ? ' ' + cls : '');
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (warn ? ' warn' : gold ? ' gold' : '');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.05;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function aloneText() {
    if (G.beam.on) return G.beam.lv >= 3 ? '新孤' : G.beam.lv >= 2 ? '孤' : '束';
    const lv = chargeLevel();
    if (lv >= 3) return '新孤';
    if (lv >= 2) return '孤';
    if (lv >= 1) return '束';
    return '点射';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const info = stageInfo();
      stageLabel.textContent = G.boss ? info.boss : info.name;
      stageLabel.classList.toggle('hot', G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isTide() ? '核潮' : '黑海';
      tagLabel.className = isTide() ? 'warn' : '';
    }
    const lv = chargeLevel();
    if (aloneLabel) {
      aloneLabel.textContent = aloneText();
      let cls = 'alone';
      if (G.beam.on) cls += ' beam';
      else if (lv >= 3) cls += ' full';
      else if (lv >= 1) cls += ' mid';
      aloneLabel.className = cls;
    }
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.chargeT / CHG3, 0, 1) + ')';
    if (chgWrap) chgWrap.classList.toggle('hot', lv >= 3 || (G.beam.on && G.beam.lv >= 3));
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 蓄满新孤再放，可吞核芯弹', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 核芯已碎', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 收黑金，蓄满再放新孤', 'warn');
    else if (G.beam.on) setHint('新孤贯穿 · 可上下带束 · 核芯弹会被吞掉', 'hot');
    else if (lv >= 3) setHint('新孤就绪 · 松手贯穿全屏', 'hot');
    else setHint('收黑金填槽 · 按住空格蓄新孤 · 撞机掉命', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'MBLK';
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
    const cls = mag >= 6 ? 'die' : mag >= 3.4 ? 'morph' : mag >= 2.2 ? 'charge' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('morph');
    stageEl.classList.remove('charge');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
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
    capArr(particles, 340);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 44);
    capArr(rings, 26);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -90 : -72
    });
    capArr(floats, 28);
  }

  function explode(x, y, rgb, power) {
    const p = power || 18;
    emit(Math.min(34, 10 + (p * 0.5) | 0), {
      x: x, y: y, j: 6,
      vx0: -220, vx1: 180, vy0: -180, vy1: 160,
      r0: 1.4, r1: 4.4, life: 0.42 + p * 0.006, rgb: rgb, g: 280
    });
    emit(6, {
      x: x, y: y, j: 3,
      vx0: -70, vx1: 70, vy0: -90, vy1: 70,
      r0: 2, r1: 5, life: 0.28, rgb: WHT, g: 80
    });
    popSpark(x, y, rgb, 12 + p * 0.4);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 78; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.1),
        a: rand(0.16, 0.7),
        p: rand(16, 70)
      });
    }
  }

  function seedBubbles() {
    bubbles.length = 0;
    for (let i = 0; i < 36; i++) {
      bubbles.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: rand(1.2, 4.2),
        s: rand(12, 36),
        a: rand(0.12, 0.4)
      });
    }
    kelp.length = 0;
    for (let i = 0; i < 14; i++) {
      kelp.push({
        x: (i / 14) * VW + rand(-12, 12),
        h: rand(40, 110),
        top: Math.random() > 0.55,
        w: rand(4, 9),
        p: rand(0, TAU)
      });
    }
  }

  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function spawnOrb(wx, y, val) {
    G.orbs.push({
      x: wx,
      y: y,
      vx: rand(-40, 30),
      vy: rand(-70, 70),
      life: 6.5,
      val: val == null ? 0.16 : val,
      t: 0
    });
    capArr(G.orbs, 48);
  }

  function fireVulcan() {
    if (G.deadT > 0 || G.beam.on) return;
    G.shots.push({
      type: 'vulcan',
      x: G.px + 16,
      y: G.py,
      vx: 660,
      vy: 0,
      w: 6,
      h: 2.2,
      dmg: 1,
      pierce: 1,
      life: 1.05,
      rgb: CYN
    });
    G.muzzle = 0.08;
    audio.shoot();
    emit(3, {
      x: G.px + 18, y: G.py, j: 2,
      vx0: 80, vx1: 180, vy0: -40, vy1: 40,
      r0: 1, r1: 2.2, life: 0.16, rgb: CYN, g: 0
    });
  }

  function fireBeam(lv) {
    const h = lv === 3 ? 54 : lv === 2 ? 26 : 12;
    const life = lv === 3 ? 0.58 : lv === 2 ? 0.36 : 0.2;
    G.beam.on = true;
    G.beam.t = 0;
    G.beam.life = life;
    G.beam.lv = lv;
    G.beam.h = h;
    G.beam.tick = 0;
    G.beam.hit = {};
    G.beam.first = true;
    G.muzzle = 0.2;
    audio.beam(lv);
    hitStop(lv === 3 ? 0.07 : 0.048);
    kick(lv === 3 ? 5.8 : 3.2);
    screenFlash(lv === 3 ? GOLD : CYN, lv === 3 ? 0.55 : 0.28);
    explode(G.px + 26, G.py, lv === 3 ? GOLD : TEAL, 12 + lv * 7);
    if (lv >= 2) {
      floatText(G.px + 48, G.py - 24, lv === 3 ? '新孤' : '孤', GOLD, lv === 3);
    }
    if (aloneLabel) {
      aloneLabel.classList.remove('pop');
      void aloneLabel.offsetWidth;
      aloneLabel.classList.add('pop');
    }
    if (stageEl && !REDUCE && lv >= 3) {
      stageEl.classList.remove('charge');
      void stageEl.offsetWidth;
      stageEl.classList.add('charge');
    }
  }

  function beamBox() {
    const x0 = G.px + 16;
    const x1 = VW + 36;
    return {
      x: (x0 + x1) * 0.5,
      y: G.py,
      w: (x1 - x0) * 0.5,
      h: G.beam.h * 0.5
    };
  }

  function beamDmg() {
    const lv = G.beam.lv;
    return lv === 3 ? 7 : lv === 2 ? 4 : 2;
  }

  function beamTickGap() {
    const lv = G.beam.lv;
    return lv === 3 ? 0.055 : lv === 2 ? 0.07 : 0.08;
  }

  function pushEnt(e) {
    e.id = uid++;
    e.alive = true;
    G.ents.push(e);
    capArr(G.ents, 120);
  }

  function spawnFish(n, yNorm, drone) {
    const extra = isTide() ? 2 : 0;
    const count = n + extra;
    const baseY = 40 + yNorm * (VH - 80);
    for (let i = 0; i < count; i++) {
      pushEnt({
        type: drone ? 'drone' : 'fish',
        x: G.cam + VW + 28 + i * 26,
        y: baseY + Math.sin(i * 0.9) * 18,
        vx: isTide() ? -168 : -132,
        vy: 0,
        hp: 1,
        maxHp: 1,
        w: drone ? 12 : 12,
        h: drone ? 8 : 7,
        t: i * 0.1,
        phase: rand(0, TAU),
        shootCd: rand(0.4, 1.4)
      });
    }
  }

  function spawnJelly(n) {
    const extra = isTide() ? 1 : 0;
    for (let i = 0; i < n + extra; i++) {
      pushEnt({
        type: 'jelly',
        x: G.cam + VW + 20 + i * 36,
        y: 70 + Math.random() * (VH - 140),
        vx: isTide() ? -78 : -62,
        vy: 0,
        hp: isTide() ? 3 : 2,
        maxHp: isTide() ? 3 : 2,
        w: 14,
        h: 16,
        t: rand(0, TAU),
        phase: rand(0, TAU),
        shootCd: rand(0.5, 1.4)
      });
    }
  }

  function spawnEel(n) {
    const wx = G.cam + VW + 24;
    const y = 80 + Math.random() * (VH - 160);
    const segs = [];
    const count = n + (isTide() ? 2 : 0);
    for (let i = 0; i < count; i++) segs.push({ x: wx + i * 14, y: y });
    pushEnt({
      type: 'eel',
      segs: segs,
      x: wx,
      y: y,
      vx: isTide() ? -128 : -96,
      hp: count,
      maxHp: count,
      w: 9,
      h: 9,
      t: 0,
      amp: 28 + rand(0, 16),
      phase: rand(0, TAU)
    });
  }

  function spawnCrab(side) {
    pushEnt({
      type: 'crab',
      x: G.cam + VW + 12,
      y: side < 0 ? 22 : VH - 22,
      side: side,
      vx: 0,
      vy: 0,
      hp: isTide() ? 4 : 3,
      maxHp: isTide() ? 4 : 3,
      w: 13,
      h: 10,
      t: 0,
      shootCd: rand(0.4, 1.1)
    });
  }

  function spawnSquid() {
    pushEnt({
      type: 'squid',
      x: G.cam + VW + 22,
      y: VH * 0.5 + rand(-40, 40),
      vx: isTide() ? -92 : -72,
      vy: 0,
      hp: isTide() ? 7 : 5,
      maxHp: isTide() ? 7 : 5,
      w: 18,
      h: 14,
      t: 0,
      shootCd: 0.7
    });
  }

  function spawnSat() {
    const cx = G.cam + VW + 40;
    const cy = 90 + Math.random() * (VH - 180);
    pushEnt({
      type: 'sat',
      x: cx,
      y: cy,
      cx: cx,
      cy: cy,
      vx: isTide() ? -86 : -70,
      ang: rand(0, TAU),
      rad: 26 + rand(0, 18),
      hp: isTide() ? 4 : 3,
      maxHp: isTide() ? 4 : 3,
      w: 12,
      h: 12,
      t: 0,
      shootCd: rand(0.5, 1.2)
    });
  }

  function spawnMine(n) {
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'mine',
        x: G.cam + VW + 18 + i * 40,
        y: 60 + Math.random() * (VH - 120),
        vx: isTide() ? -70 : -54,
        vy: 0,
        hp: 2,
        maxHp: 2,
        w: 11,
        h: 11,
        t: rand(0, TAU)
      });
    }
  }

  function spawnHeavy() {
    pushEnt({
      type: 'heavy',
      x: G.cam + VW + 24,
      y: VH * 0.5 + rand(-50, 50),
      vx: isTide() ? -80 : -64,
      vy: 0,
      hp: isTide() ? 8 : 6,
      maxHp: isTide() ? 8 : 6,
      w: 20,
      h: 14,
      t: 0,
      shootCd: 0.6
    });
  }

  function spawnWave(w) {
    if (w.kind === 'fish') spawnFish(w.n, w.y == null ? 0.5 : w.y, false);
    else if (w.kind === 'drone') spawnFish(w.n, w.y == null ? 0.5 : w.y, true);
    else if (w.kind === 'jelly') spawnJelly(w.n || 2);
    else if (w.kind === 'eel') spawnEel(w.n || 8);
    else if (w.kind === 'crab') spawnCrab(w.side || 1);
    else if (w.kind === 'squid') spawnSquid();
    else if (w.kind === 'sat') spawnSat();
    else if (w.kind === 'mine') spawnMine(w.n || 2);
    else if (w.kind === 'heavy') spawnHeavy();
  }

  function makeTail(x, y, n, spread) {
    const segs = [];
    for (let i = 0; i < n; i++) segs.push({ x: x + i * spread, y: y });
    return segs;
  }

  function spawnBoss() {
    G.boss = true;
    const info = stageInfo();
    const hp = info.bossHp + (isTide() ? Math.round(info.bossHp * 0.22) : 0);
    const x = G.cam + VW + 48;
    const variant = G.stage === 1 ? 'whale' : 'core';
    pushEnt({
      type: 'boss',
      variant: variant,
      x: x,
      y: VH * 0.5,
      vx: -40,
      vy: 0,
      hp: hp,
      maxHp: hp,
      w: variant === 'whale' ? 56 : 44,
      h: variant === 'whale' ? 38 : 40,
      t: 0,
      shootCd: 0.55,
      phase: 1,
      tail: variant === 'whale' ? makeTail(x + 20, VH * 0.5 + 10, 11, 14) : null,
      spin: 0,
      name: info.boss
    });
    toast(info.boss, true, false);
    audio.warn();
    screenFlash(GOLD, 0.28);
    kick(4);
    syncHud();
  }

  function enemyShot(x, y, vx, vy, fat) {
    G.eShots.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: fat ? 7.2 : 3.2,
      life: fat ? 2.6 : 2.9,
      fat: !!fat
    });
    capArr(G.eShots, 96);
  }

  function aimShot(x, y, spd, spread, fat) {
    const dx = G.px - (x - G.cam);
    const dy = G.py - y;
    const d = hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx) + (spread || 0);
    enemyShot(x, y, Math.cos(ang) * spd, Math.sin(ang) * spd, !!fat);
  }

  function hurtEnt(e, dmg, hx, hy, fromBeam) {
    if (!e.alive) return;
    e.hp -= dmg;
    bumpCombo();
    const kind = e.type === 'boss' ? 'boss' : e.type === 'eel' ? 'eel' : 'hit';
    audio.hit(kind, G.combo);
    popSpark(hx, hy, e.type === 'boss' ? GOLD : ORG, fromBeam ? 11 : 8);
    emit(5, {
      x: hx, y: hy, j: 4,
      vx0: -80, vx1: 80, vy0: -80, vy1: 80,
      r0: 1.2, r1: 2.8, life: 0.22, rgb: fromBeam ? GOLD : TEAL, g: 80
    });
    if (e.type === 'boss') {
      hitStop(fromBeam ? 0.05 : 0.038);
      kick(fromBeam ? 2.8 : 2.3);
    } else if (fromBeam) {
      hitStop(G.beam.first ? 0.048 : 0.028);
      if (G.beam.first) {
        G.beam.first = false;
        kick(2.6);
      }
    } else {
      hitStop(0.03);
    }
    if (e.alive && e.hp > 0 && Math.random() < (fromBeam ? 0.18 : 0.34)) {
      spawnOrb(e.x || (hx + G.cam), e.y || hy, 0.1);
    }
    if (e.type === 'eel' && e.segs && e.hp > 0) {
      while (e.segs.length > Math.max(1, e.hp)) e.segs.pop();
    }
    if (e.hp <= 0) killEnt(e, hx, hy);
  }

  function killEnt(e, hx, hy) {
    e.alive = false;
    e.hp = 0;
    let pts = SCORE.fish;
    let rgb = CYN;
    let pow = 16;
    const t = e.type;
    if (t === 'jelly') { pts = SCORE.jelly; rgb = TEAL; pow = 18; }
    else if (t === 'eel') { pts = SCORE.eel; rgb = SKY; pow = 22; }
    else if (t === 'crab') { pts = SCORE.crab; rgb = ORG; pow = 16; }
    else if (t === 'squid') { pts = SCORE.squid; rgb = GOLD; pow = 22; }
    else if (t === 'drone') { pts = SCORE.drone; rgb = CYN; pow = 16; }
    else if (t === 'sat') { pts = SCORE.sat; rgb = TEAL; pow = 18; }
    else if (t === 'mine') { pts = SCORE.mine; rgb = COP; pow = 20; }
    else if (t === 'heavy') { pts = SCORE.heavy; rgb = ORG; pow = 24; }
    else if (t === 'boss') {
      pts = SCORE.boss[G.stage - 1] || 4000;
      rgb = GOLD;
      pow = 52;
    }
    const n = Math.round(pts * G.mult);
    addScore(n);
    floatText(hx, hy, '+' + n, rgb, t === 'boss' || G.mult >= 3);
    explode(hx, hy, rgb, pow);
    const orbs = t === 'boss' ? 7 : t === 'eel' || t === 'squid' || t === 'heavy' ? 2 : 1;
    for (let i = 0; i < orbs; i++) {
      spawnOrb((e.x || (hx + G.cam)) + rand(-10, 10), (e.y || hy) + rand(-8, 8), t === 'boss' ? 0.22 : 0.16);
    }
    if (t === 'boss') {
      hitStop(0.08);
      kick(7.2);
      screenFlash(GOLD, 0.55);
      for (let k = 0; k < 4; k++) {
        explode(hx + rand(-28, 28), hy + rand(-24, 24), k % 2 ? CYN : GOLD, 28);
      }
      onBossDown();
    } else if (t === 'eel') {
      hitStop(0.055);
      kick(3.4);
    } else {
      hitStop(0.042);
      kick(2.4);
    }
    syncHud();
  }

  function onBossDown() {
    addScore(SCORE.clear);
    if (G.stage >= STAGES.length) {
      G.winT = 1.35;
    } else {
      toast(stageInfo().name + '肃清', false, true);
      G.stage += 1;
      G.cam = 0;
      G.spawnI = 0;
      G.boss = false;
      G.ents.length = 0;
      G.eShots.length = 0;
      G.shots.length = 0;
      G.orbs.length = 0;
      G.py = clamp(G.py, 24, VH - 24);
      G.invuln = Math.max(G.invuln, 0.8);
      syncHud();
      setTimeout(function () {
        if (G.mode === 'play') toast(stageInfo().name, false, true);
      }, 420);
    }
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.9;
    G.chargeT = 0;
    G.charged = false;
    G.fireHold = false;
    G.holdT = 0;
    G.beam.on = false;
    breakCombo();
    explode(G.px, G.py, COP, 36);
    explode(G.px + 8, G.py, GOLD, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5);
    screenFlash(COP, 0.6);
    syncPips();
    syncHud();
  }

  function respawn() {
    G.px = 90;
    G.py = VH * 0.5;
    G.invuln = 1.45;
    G.deadT = 0;
    G.chargeT = 0;
    G.beam.on = false;
    G.holdT = 0;
    if (keys.sht) G.fireHold = true;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '黑飞坠了', '收黑金蓄新孤，松手贯穿。撞机、中弹都掉命。分数 ' + G.score + '。');
    setHint('R 重开 · 蓄满新孤再放，可吞核芯弹', 'warn');
  }

  function goWin() {
    G.mode = 'win';
    addScore(4000);
    audio.win();
    showOverlay('win', '核芯粉碎', '黑海到虚空打穿。分数 ' + G.score + (isTide() ? ' · 核潮' : ' · 黑海') + '。');
    setHint('R 重开 · 核芯已碎', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.orbs.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'tide' ? 'tide' : 'sea';
    G.t = 0;
    G.cam = 0;
    G.px = 90;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stage = 1;
    G.nextLife = LIFE_EVERY;
    G.spawnI = 0;
    G.fireHold = false;
    G.holdT = 0;
    G.chargeT = 0;
    G.charged = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.boss = false;
    G.winT = 0;
    G.lastLv = 0;
    G.beam.on = false;
    G.beam.hit = {};
    if (scoreEl) scoreEl.textContent = '0';
    toast(isTide() ? '核潮' : '黑海', false, !isTide());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'sea';
    G.t = 0;
    G.cam = 80;
    G.px = 90;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.stage = 1;
    G.boss = false;
    G.deadT = 0;
    G.chargeT = 0;
    G.holdT = 0;
    G.fireHold = false;
    G.beam.on = false;
    clearWorld();
    showOverlay('title', '黑金', '收黑金、蓄新孤。松开放出贯穿全屏的超武。撞机掉命。先黑海后虚空。');
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.9);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.99;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    const scr = G.mode === 'title' ? 22 : scrollSpd();
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= (scr * 0.16 + s.p * 0.38) * dt;
      if (s.x < 0) s.x += VW;
    }
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      b.y -= b.s * dt;
      b.x -= scr * 0.12 * dt;
      if (b.y < -8) {
        b.y = VH + 8;
        b.x = Math.random() * VW;
      }
      if (b.x < -8) b.x += VW + 16;
    }
    for (let i = 0; i < kelp.length; i++) {
      kelp[i].x -= scr * 0.22 * dt;
      if (kelp[i].x < -20) kelp[i].x += VW + 40;
    }
  }

  function updateMove(dt) {
    let mx = 0;
    let my = 0;
    if (inputSrc === 'ptr' && pointer.down) {
      const tx = pointer.x;
      const ty = pointer.y;
      const dx = tx - G.px;
      const dy = ty - G.py;
      const d = hypot(dx, dy);
      const max = moveSpd() * dt;
      if (d > 2) {
        const k = Math.min(1, max / d) * (d > 18 ? 1 : d / 18);
        mx = dx * k;
        my = dy * k;
      }
    } else {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
      if (mx || my) {
        const n = hypot(mx, my) || 1;
        mx = mx / n * moveSpd() * dt;
        my = my / n * moveSpd() * dt;
      }
    }
    G.px = clamp(G.px + mx, 22, VW - 70);
    G.py = clamp(G.py + my, 18, VH - 18);
  }

  function addCharge(amt) {
    const prev = gaugeLevel();
    G.chargeT = clamp(G.chargeT + amt, 0, CHG3 + 0.45);
    const lv = gaugeLevel();
    if (lv > prev && lv >= 1 && !G.beam.on) {
      audio.chargeTick(lv);
      screenFlash(lv === 3 ? GOLD : CYN, lv === 3 ? 0.26 : 0.12);
      if (lv === 3) {
        kick(3.2);
        popSpark(G.px + 22, G.py, GOLD, 18);
        if (stageEl && !REDUCE) {
          stageEl.classList.remove('charge');
          void stageEl.offsetWidth;
          stageEl.classList.add('charge');
        }
      }
    }
  }

  function updateCharge(dt) {
    if (G.deadT > 0 || G.mode !== 'play' || G.beam.on) return;
    if (G.fireHold) {
      G.holdT += dt;
      addCharge(dt);
      G.charged = G.holdT >= TAP;
      if (gaugeLevel() >= 3 && ((G.t * 8) | 0) !== (((G.t - dt) * 8) | 0)) {
        emit(1, {
          x: G.px + 20, y: G.py, j: 10,
          vx0: -20, vx1: 40, vy0: -40, vy1: 40,
          r0: 1.2, r1: 2.6, life: 0.2, rgb: GOLD, g: 0
        });
      }
    }
  }

  function releaseCharge() {
    if (G.mode !== 'play' || G.deadT > 0 || G.beam.on) {
      G.charged = false;
      return;
    }
    const held = G.holdT >= TAP;
    const lv = gaugeLevel();
    G.holdT = 0;
    if (held && lv >= 1) {
      fireBeam(lv);
      G.chargeT = 0;
    } else {
      fireVulcan();
    }
    G.charged = false;
    G.lastLv = 0;
    syncHud();
  }

  function maybeSpawn() {
    if (G.boss || G.mode !== 'play') return;
    const info = stageInfo();
    while (G.spawnI < info.waves.length && info.waves[G.spawnI].x <= G.cam) {
      spawnWave(info.waves[G.spawnI]);
      G.spawnI += 1;
    }
    if (!G.boss && G.cam >= STAGE_LEN) spawnBoss();
  }

  function updateEel(e, dt) {
    const head = e.segs[0];
    head.x += e.vx * dt;
    e.t += dt;
    let ty = VH * 0.5 + Math.sin(e.t * 2.15 + e.phase) * e.amp;
    ty = clamp(ty, 28, VH - 28);
    head.y += (ty - head.y) * Math.min(1, 5 * dt);
    for (let i = 1; i < e.segs.length; i++) {
      const p = e.segs[i - 1];
      const s = e.segs[i];
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      const d = hypot(dx, dy) || 1;
      const want = 13;
      if (d > want) {
        s.x += dx / d * (d - want);
        s.y += dy / d * (d - want);
      }
    }
    e.x = head.x;
    e.y = head.y;
    if (head.x < G.cam - 90) e.alive = false;
  }

  function updateBoss(e, dt) {
    e.t += dt;
    const targetX = G.cam + VW - (e.variant === 'whale' ? 128 : 108);
    e.x += (targetX - e.x) * Math.min(1, 1.6 * dt);
    const amp = e.variant === 'core' ? 40 : 46;
    const ty = VH * 0.5 + Math.sin(e.t * 0.72) * amp;
    e.y += (clamp(ty, 70, VH - 70) - e.y) * Math.min(1, 2.2 * dt);
    e.spin += dt * (e.hp < e.maxHp * 0.45 ? 1.9 : 1.15);
    e.shootCd -= dt;
    const angry = e.hp < e.maxHp * 0.45;
    const rate = (isTide() ? 0.7 : 0.9) * (angry ? 0.68 : 1);
    if (e.variant === 'whale') {
      if (e.tail) {
        const rootX = e.x + 18;
        const rootY = e.y + 10;
        e.tail[0].x = rootX;
        e.tail[0].y = rootY;
        for (let i = 1; i < e.tail.length; i++) {
          const t = e.t * (angry ? 3.2 : 2.1) + i * 0.34;
          const wantX = rootX + i * 13;
          const wantY = rootY + Math.sin(t) * (16 + i * 2.2);
          e.tail[i].x = lerp(e.tail[i].x, wantX, Math.min(1, 8 * dt));
          e.tail[i].y = lerp(e.tail[i].y, wantY, Math.min(1, 8 * dt));
        }
      }
      if (e.shootCd <= 0) {
        e.shootCd = rate;
        const mouthX = e.x - 34;
        const mouthY = e.y;
        const n = angry ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const sp = (i - (n - 1) / 2) * 0.2;
          aimShot(mouthX, mouthY, isTide() ? 210 : 168, sp, false);
        }
        if (angry || Math.random() < 0.45) {
          aimShot(mouthX, mouthY, isTide() ? 130 : 108, rand(-0.08, 0.08), true);
        }
      }
    } else {
      if (e.shootCd <= 0) {
        e.shootCd = angry ? 0.62 : 0.95;
        const n = angry ? 8 : 6;
        for (let i = 0; i < n; i++) {
          const a = e.spin * 0.45 + i * (TAU / n);
          enemyShot(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, i % 3 === 0);
        }
        if (angry) {
          for (let k = -1; k <= 1; k++) {
            enemyShot(e.x - 20, e.y + k * 16, isTide() ? -210 : -170, k * 12, k === 0);
          }
        }
      }
    }
  }

  function updateEnts(dt) {
    const raidShot = isTide() ? 1.28 : 1;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        if (e.type !== 'boss') G.ents.splice(i, 1);
        continue;
      }
      if (e.type === 'eel') {
        updateEel(e, dt);
        continue;
      }
      if (e.type === 'boss') {
        updateBoss(e, dt);
        continue;
      }
      e.t += dt;
      if (e.type === 'fish' || e.type === 'drone') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 3 + e.phase) * 30 * dt;
        e.y = clamp(e.y, 22, VH - 22);
        e.shootCd -= dt * raidShot;
        if (e.shootCd <= 0 && e.x < G.cam + VW - 20) {
          e.shootCd = rand(1.15, 2.1) / raidShot;
          if (Math.random() < (isTide() ? 0.55 : 0.32)) {
            enemyShot(e.x, e.y, isTide() ? -186 : -154, 0, false);
          }
        }
      } else if (e.type === 'jelly') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 1.6 + e.phase) * 42 * dt;
        e.y = clamp(e.y, 30, VH - 30);
        e.shootCd -= dt * raidShot;
        if (e.shootCd <= 0 && e.x < G.cam + VW) {
          e.shootCd = (isTide() ? 1.15 : 1.5) + Math.random() * 0.4;
          const n = 5;
          for (let k = 0; k < n; k++) {
            const a = k * (TAU / n) + e.t;
            enemyShot(e.x, e.y, Math.cos(a) * 90, Math.sin(a) * 90, false);
          }
        }
      } else if (e.type === 'crab') {
        e.y = e.side < 0 ? 22 : VH - 22;
        e.shootCd -= dt * raidShot;
        if (e.shootCd <= 0 && e.x < G.cam + VW - 8 && e.x > G.cam) {
          e.shootCd = (isTide() ? 1.0 : 1.35) + Math.random() * 0.35;
          aimShot(e.x, e.y, isTide() ? 188 : 150, rand(-0.05, 0.05));
        }
      } else if (e.type === 'squid') {
        e.x += e.vx * dt;
        e.y += (VH * 0.5 + Math.sin(e.t * 1.25) * 36 - e.y) * Math.min(1, 2 * dt);
        e.shootCd -= dt * raidShot;
        if (e.shootCd <= 0) {
          e.shootCd = isTide() ? 0.82 : 1.12;
          for (let k = -1; k <= 1; k++) aimShot(e.x - 8, e.y, isTide() ? 186 : 150, k * 0.2);
          if (Math.random() < 0.35) aimShot(e.x - 8, e.y, 110, 0, true);
        }
      } else if (e.type === 'sat') {
        e.cx += e.vx * dt;
        e.ang += dt * 1.6;
        e.x = e.cx + Math.cos(e.ang) * e.rad;
        e.y = e.cy + Math.sin(e.ang) * e.rad * 0.72;
        e.shootCd -= dt * raidShot;
        if (e.shootCd <= 0 && e.x < G.cam + VW) {
          e.shootCd = isTide() ? 1.05 : 1.4;
          aimShot(e.x, e.y, isTide() ? 190 : 155, 0);
        }
      } else if (e.type === 'mine') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 2.2) * 18 * dt;
        if (G.deadT <= 0 && G.invuln <= 0) {
          const dx = (e.x - G.cam) - G.px;
          const dy = e.y - G.py;
          if (hypot(dx, dy) < 34) {
            explode(e.x - G.cam, e.y, COP, 26);
            e.alive = false;
            diePlayer();
          }
        }
      } else if (e.type === 'heavy') {
        e.x += e.vx * dt;
        e.y += (VH * 0.5 + Math.sin(e.t * 0.9) * 50 - e.y) * Math.min(1, 1.8 * dt);
        e.shootCd -= dt * raidShot;
        if (e.shootCd <= 0) {
          e.shootCd = isTide() ? 0.78 : 1.05;
          for (let k = -1; k <= 1; k++) aimShot(e.x - 10, e.y, isTide() ? 200 : 160, k * 0.18);
          aimShot(e.x - 10, e.y, 120, 0, true);
        }
      }
      if (e.x < G.cam - 90) e.alive = false;
    }
  }

  function shotHitsEnt(s, e) {
    if (e.type === 'eel') {
      for (let i = 0; i < e.segs.length; i++) {
        const g = e.segs[i];
        if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, g.x - G.cam, g.y, 8, 8)) {
          return { hx: g.x - G.cam, hy: g.y };
        }
      }
      return null;
    }
    if (e.type === 'boss') {
      if (e.variant === 'whale') {
        const hx = e.x - G.cam - 22;
        const hy = e.y;
        if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, hx, hy, 18, 16)) {
          return { hx: hx, hy: hy };
        }
        if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, e.x - G.cam + 8, e.y + 2, 32, 22)) {
          return { hx: e.x - G.cam, hy: e.y };
        }
        return null;
      }
      if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, e.x - G.cam, e.y, e.w * 0.55, e.h * 0.55)) {
        return { hx: e.x - G.cam, hy: e.y };
      }
      return null;
    }
    if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, e.x - G.cam, e.y, e.w, e.h)) {
      return { hx: e.x - G.cam, hy: e.y };
    }
    return null;
  }

  function beamHitsEnt(e, box) {
    if (e.type === 'eel') {
      for (let i = 0; i < e.segs.length; i++) {
        const g = e.segs[i];
        if (aabb(box.x, box.y, box.w, box.h, g.x - G.cam, g.y, 8, 8)) {
          return { hx: g.x - G.cam, hy: g.y };
        }
      }
      return null;
    }
    if (e.type === 'boss') {
      const hx = e.x - G.cam + (e.variant === 'whale' ? -18 : 0);
      if (aabb(box.x, box.y, box.w, box.h, hx, e.y, e.w * 0.55, e.h * 0.5)) {
        return { hx: hx, hy: e.y };
      }
      return null;
    }
    if (aabb(box.x, box.y, box.w, box.h, e.x - G.cam, e.y, e.w, e.h)) {
      return { hx: e.x - G.cam, hy: e.y };
    }
    return null;
  }

  function updateBeam(dt) {
    if (!G.beam.on) return;
    G.beam.t += dt;
    G.beam.life -= dt;
    G.beam.tick -= dt;
    if (!REDUCE && ((G.t * 20) | 0) !== (((G.t - dt) * 20) | 0)) {
      emit(2, {
        x: G.px + rand(30, VW - 40), y: G.py + rand(-G.beam.h * 0.4, G.beam.h * 0.4),
        j: 4,
        vx0: 40, vx1: 160, vy0: -40, vy1: 40,
        r0: 1.2, r1: 3.2, life: 0.18, rgb: G.beam.lv >= 3 ? GOLD : CYN, g: 0
      });
    }
    const box = beamBox();
    if (G.beam.tick <= 0) {
      G.beam.tick = beamTickGap();
      const dmg = beamDmg();
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        if (G.beam.hit[e.id] && G.beam.hit[e.id] > G.t) continue;
        const hit = beamHitsEnt(e, box);
        if (!hit) continue;
        G.beam.hit[e.id] = G.t + beamTickGap();
        hurtEnt(e, dmg, hit.hx, hit.hy, true);
      }
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      const sxv = s.x - G.cam;
      if (aabb(box.x, box.y, box.w, box.h, sxv, s.y, s.r, s.r)) {
        if (s.fat) {
          popSpark(sxv, s.y, GOLD, 16);
          explode(sxv, s.y, GOLD, 14);
          audio.clash();
          hitStop(0.055);
          kick(3.6);
          screenFlash(GOLD, 0.22);
          bumpCombo();
          const n = Math.round(SCORE.clash * G.mult);
          addScore(n);
          floatText(sxv, s.y - 10, '吞', GOLD, true);
          addCharge(0.12);
        } else {
          popSpark(sxv, s.y, CYN, 7);
        }
        G.eShots.splice(i, 1);
      }
    }
    if (G.beam.life <= 0) {
      G.beam.on = false;
      syncHud();
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += (s.vy || 0) * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > VW + 80 || s.x < -60) {
        G.shots.splice(i, 1);
        continue;
      }
      let dead = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        const hit = shotHitsEnt(s, e);
        if (!hit) continue;
        hurtEnt(e, s.dmg, hit.hx, hit.hy, false);
        s.pierce -= 1;
        if (s.pierce <= 0) {
          dead = true;
          break;
        }
      }
      if (dead) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const sxv = s.x - G.cam;
      if (s.life <= 0 || sxv < -40 || sxv > VW + 40 || s.y < -20 || s.y > VH + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && G.invuln <= 0 && hypot(sxv - G.px, s.y - G.py) < 8 + s.r) {
        G.eShots.splice(i, 1);
        diePlayer();
      }
    }
  }

  function updateOrbs(dt) {
    for (let i = G.orbs.length - 1; i >= 0; i--) {
      const o = G.orbs[i];
      o.t += dt;
      o.life -= dt;
      const sxv = o.x - G.cam;
      if (G.deadT <= 0 && G.mode === 'play') {
        const dx = G.px - sxv;
        const dy = G.py - o.y;
        const d = hypot(dx, dy) || 1;
        const pull = d < 90 ? 280 : 90;
        o.vx += dx / d * pull * dt;
        o.vy += dy / d * pull * dt;
        o.vx *= 0.96;
        o.vy *= 0.96;
        if (d < 16) {
          addCharge(o.val);
          addScore(SCORE.orb);
          audio.orb();
          popSpark(G.px, G.py, GOLD, 8);
          emit(4, {
            x: G.px, y: G.py, j: 4,
            vx0: -40, vx1: 40, vy0: -40, vy1: 40,
            r0: 1.2, r1: 2.4, life: 0.2, rgb: GOLD, g: 0
          });
          G.orbs.splice(i, 1);
          continue;
        }
      }
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.life <= 0 || sxv < -50) G.orbs.splice(i, 1);
    }
  }

  function collideBodies() {
    if (G.deadT > 0) return;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const hits = [];
      if (e.type === 'eel') {
        for (let k = 0; k < e.segs.length; k++) {
          hits.push({ x: e.segs[k].x - G.cam, y: e.segs[k].y, r: 8 });
        }
      } else if (e.type === 'boss') {
        hits.push({ x: e.x - G.cam, y: e.y, r: Math.max(e.w, e.h) * 0.42 });
        if (e.tail) {
          for (let k = 2; k < e.tail.length; k++) {
            hits.push({ x: e.tail[k].x - G.cam, y: e.tail[k].y, r: 7 });
          }
        }
      } else {
        hits.push({ x: e.x - G.cam, y: e.y, r: Math.max(e.w, e.h) * 0.7 });
      }
      for (let h = 0; h < hits.length; h++) {
        const p = hits[h];
        if (G.invuln <= 0 && hypot(p.x - G.px, p.y - G.py) < 8 + p.r * 0.55) {
          diePlayer();
          return;
        }
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.2);
      return;
    }
    updateFx(dt);
    if (G.mode === 'title') {
      G.cam += 28 * dt;
      return;
    }
    if (G.mode === 'lose') return;
    if (G.mode === 'win') {
      G.cam += 18 * dt;
      return;
    }

    if (G.winT > 0) {
      G.winT -= dt;
      updateShots(dt);
      updateBeam(dt);
      updateEnts(dt);
      updateOrbs(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    G.cam += scrollSpd() * dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnts(dt);
      updateShots(dt);
      updateBeam(dt);
      updateOrbs(dt);
      maybeSpawn();
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    updateMove(dt);
    updateCharge(dt);
    if (!REDUCE && G.deadT <= 0 && ((G.t * 24) | 0) !== (((G.t - dt) * 24) | 0)) {
      emit(1, {
        x: G.px - 12, y: G.py, j: 2.2,
        vx0: -90, vx1: -24, vy0: -18, vy1: 18,
        r0: 1.1, r1: 2.4, life: 0.2, rgb: isSea() ? TEAL : CYN, g: 0
      });
    }
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    updateBeam(dt);
    updateOrbs(dt);
    collideBodies();
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.chargeT / CHG3, 0, 1) + ')';
    if (chgWrap) chgWrap.classList.toggle('hot', chargeLevel() >= 3);
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
    if (aloneLabel) {
      const lv = chargeLevel();
      aloneLabel.textContent = aloneText();
      let cls = 'alone';
      if (G.beam.on) cls += ' beam';
      else if (lv >= 3) cls += ' full';
      else if (lv >= 1) cls += ' mid';
      if (aloneLabel.className.indexOf('pop') >= 0) cls += ' pop';
      aloneLabel.className = cls;
    }
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      c.fillStyle = rgba(WHT, s.a * (isSea() ? 0.35 : 1));
      c.fillRect(sx(s.x), sy(s.y), s.s * scale, s.s * scale);
    }
  }

  function drawSea() {
    const c = ctx;
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#082030');
    g.addColorStop(0.45, '#041820');
    g.addColorStop(1, '#031014');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (!REDUCE) {
      c.strokeStyle = rgba(TEAL, 0.1);
      c.lineWidth = Math.max(1, 1.2 * scale);
      for (let i = 0; i < 5; i++) {
        c.beginPath();
        const y0 = 40 + i * 70;
        for (let x = 0; x <= VW; x += 16) {
          const y = y0 + Math.sin((x + G.cam * 0.4) * 0.018 + G.t * 1.4 + i) * 8;
          if (x === 0) c.moveTo(sx(x), sy(y));
          else c.lineTo(sx(x), sy(y));
        }
        c.stroke();
      }
    }

    for (let i = 0; i < kelp.length; i++) {
      const k = kelp[i];
      c.strokeStyle = rgba(TEAL, 0.22);
      c.lineWidth = Math.max(1, k.w * 0.35 * scale);
      c.beginPath();
      const base = k.top ? 8 : VH - 8;
      const dir = k.top ? 1 : -1;
      c.moveTo(sx(k.x), sy(base));
      for (let s = 1; s <= 6; s++) {
        const yy = base + dir * (k.h * s / 6);
        const xx = k.x + Math.sin(G.t * 1.3 + k.p + s * 0.5) * 7;
        c.lineTo(sx(xx), sy(yy));
      }
      c.stroke();
    }

    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      c.strokeStyle = rgba(SKY, b.a);
      c.lineWidth = Math.max(1, 1 * scale);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.stroke();
    }
  }

  function drawSpace() {
    const c = ctx;
    const g = c.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    g.addColorStop(0, '#061018');
    g.addColorStop(0.5, '#04141c');
    g.addColorStop(1, '#081828');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    c.fillStyle = rgba(CYN, 0.05);
    c.beginPath();
    c.ellipse(sx(VW * 0.72), sy(VH * 0.28), 180 * scale, 70 * scale, 0.2, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.035);
    c.beginPath();
    c.ellipse(sx(VW * 0.2), sy(VH * 0.78), 140 * scale, 50 * scale, -0.2, 0, TAU);
    c.fill();
  }

  function drawFish(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(TEAL, 0.95);
    c.beginPath();
    c.moveTo(-14 * scale, 0);
    c.lineTo(10 * scale, -7 * scale);
    c.lineTo(6 * scale, 0);
    c.lineTo(10 * scale, 7 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.9);
    c.fillRect(-2 * scale, -2 * scale, 6 * scale, 4 * scale);
    c.fillStyle = rgba(WHT, 0.85);
    c.beginPath();
    c.arc(4 * scale, -2 * scale, 1.4 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawDrone(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(CYN, 0.92);
    c.beginPath();
    c.moveTo(10 * scale, 0);
    c.lineTo(-6 * scale, -8 * scale);
    c.lineTo(-12 * scale, 0);
    c.lineTo(-6 * scale, 8 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(-4 * scale, -3 * scale, 8 * scale, 6 * scale);
    c.fillStyle = rgba(GOLD, 0.85);
    c.fillRect(2 * scale, -1.6 * scale, 6 * scale, 3.2 * scale);
    c.restore();
  }

  function drawJelly(e) {
    const c = ctx;
    const x = e.x - G.cam;
    const pulse = 1 + Math.sin(e.t * 3) * 0.12;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(SKY, 0.55);
    c.beginPath();
    c.ellipse(0, -2 * scale, 13 * scale * pulse, 10 * scale * pulse, 0, Math.PI, TAU);
    c.fill();
    c.strokeStyle = rgba(TEAL, 0.7);
    c.lineWidth = Math.max(1, 1.2 * scale);
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(i * 4 * scale, 2 * scale);
      c.quadraticCurveTo(i * 4 * scale + Math.sin(e.t * 4 + i) * 4 * scale, 12 * scale, i * 3 * scale, 18 * scale);
      c.stroke();
    }
    c.fillStyle = rgba(GOLD, 0.7);
    c.beginPath();
    c.arc(0, -2 * scale, 3.2 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawCrab(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    if (e.side < 0) c.scale(1, -1);
    c.fillStyle = rgba(ORG, 0.92);
    c.fillRect(-10 * scale, -6 * scale, 20 * scale, 12 * scale);
    c.fillStyle = rgba(GOLD, 0.8);
    c.beginPath();
    c.arc(0, 0, 4.4 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(TEAL, 0.8);
    c.fillRect(-3 * scale, 4 * scale, 6 * scale, 8 * scale);
    c.restore();
  }

  function drawSquid(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(TEAL, 0.92);
    c.beginPath();
    c.ellipse(0, 0, 18 * scale, 11 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.9);
    c.beginPath();
    c.ellipse(-4 * scale, 0, 8 * scale, 5 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.85);
    c.fillRect(8 * scale, -2.2 * scale, 8 * scale, 4.4 * scale);
    c.restore();
  }

  function drawSat(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.ang);
    c.fillStyle = rgba(CYN, 0.8);
    c.fillRect(-16 * scale, -3 * scale, 12 * scale, 6 * scale);
    c.fillRect(4 * scale, -3 * scale, 12 * scale, 6 * scale);
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.arc(0, 0, 6 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.9);
    c.beginPath();
    c.arc(0, 0, 2.4 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawMine(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.t);
    c.fillStyle = rgba(COP, 0.92);
    c.beginPath();
    c.arc(0, 0, 7 * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.8);
    c.lineWidth = Math.max(1, 1.4 * scale);
    for (let i = 0; i < 6; i++) {
      const a = i * (TAU / 6);
      c.beginPath();
      c.moveTo(Math.cos(a) * 6 * scale, Math.sin(a) * 6 * scale);
      c.lineTo(Math.cos(a) * 12 * scale, Math.sin(a) * 12 * scale);
      c.stroke();
    }
    c.restore();
  }

  function drawHeavy(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(BLK, 0.95);
    c.fillRect(-16 * scale, -10 * scale, 30 * scale, 20 * scale);
    c.fillStyle = rgba(CYN, 0.85);
    c.fillRect(-16 * scale, -10 * scale, 4 * scale, 20 * scale);
    c.fillStyle = rgba(GOLD, 0.9);
    c.fillRect(8 * scale, -3 * scale, 12 * scale, 6 * scale);
    c.fillStyle = rgba(TEAL, 0.7);
    c.fillRect(-8 * scale, -4 * scale, 10 * scale, 8 * scale);
    c.restore();
  }

  function drawSegs(segs, rgb, r) {
    const c = ctx;
    for (let i = segs.length - 1; i >= 0; i--) {
      const s = segs[i];
      const rad = r * (i === 0 ? 1.25 : 1 - i * 0.03);
      c.fillStyle = rgba(i === 0 ? GOLD : rgb, 0.92);
      c.beginPath();
      c.arc(sx(s.x - G.cam), sy(s.y), Math.max(2.2, rad) * scale, 0, TAU);
      c.fill();
    }
  }

  function drawEel(e) {
    drawSegs(e.segs, isSea() ? TEAL : CYN, 7.2);
    const h = e.segs[0];
    const c = ctx;
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.arc(sx(h.x - G.cam - 3), sy(h.y - 2), 1.6 * scale, 0, TAU);
    c.arc(sx(h.x - G.cam - 3), sy(h.y + 2), 1.6 * scale, 0, TAU);
    c.fill();
  }

  function drawBoss(e) {
    const c = ctx;
    const x = e.x - G.cam;
    const y = e.y;
    if (e.variant === 'whale') {
      if (e.tail) drawSegs(e.tail, TEAL, 6.6);
      c.save();
      c.translate(sx(x), sy(y));
      c.fillStyle = rgba(DEEP, 0.96);
      c.beginPath();
      c.ellipse(6 * scale, 2 * scale, 52 * scale, 30 * scale, 0.08, 0, TAU);
      c.fill();
      c.fillStyle = rgba(TEAL, 0.55);
      c.beginPath();
      c.ellipse(10 * scale, -8 * scale, 28 * scale, 10 * scale, 0.1, 0, TAU);
      c.fill();
      const beat = 1 + Math.sin(e.t * 5.5) * 0.08;
      c.fillStyle = rgba(GOLD, 0.96);
      c.beginPath();
      c.ellipse(-28 * scale, 0, 14 * scale * beat, 12 * scale * beat, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.85);
      c.beginPath();
      c.ellipse(-28 * scale, 0, 6 * scale, 5 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(CYN, 0.8);
      c.beginPath();
      c.moveTo(40 * scale, -6 * scale);
      c.lineTo(62 * scale, -18 * scale);
      c.lineTo(48 * scale, 0);
      c.closePath();
      c.fill();
      c.restore();
    } else {
      c.save();
      c.translate(sx(x), sy(y));
      c.strokeStyle = rgba(CYN, 0.85);
      c.lineWidth = Math.max(2, 3 * scale);
      c.beginPath();
      c.ellipse(0, 0, 40 * scale, 32 * scale, e.spin, 0, TAU);
      c.stroke();
      const n = 5;
      for (let i = 0; i < n; i++) {
        const a = e.spin + i * (TAU / n);
        c.fillStyle = rgba(ORG, 0.95);
        c.beginPath();
        c.arc(Math.cos(a) * 36 * scale, Math.sin(a) * 28 * scale, 6.5 * scale, 0, TAU);
        c.fill();
      }
      const beat = 1 + Math.sin(e.t * 4.2) * 0.07;
      c.fillStyle = rgba(DEEP, 0.95);
      c.beginPath();
      c.arc(0, 0, 18 * scale * beat, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(0, 0, 8 * scale * beat, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.8);
      c.beginPath();
      c.arc(0, 0, 3.2 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
    const pct = clamp(e.hp / e.maxHp, 0, 1);
    const bw = 180;
    const bh = 7;
    const bx = VW * 0.5 - bw * 0.5;
    const by = 14;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(sx(bx - 2), sy(by - 2), (bw + 4) * scale, (bh + 4) * scale);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(sx(bx), sy(by), bw * scale, bh * scale);
    c.fillStyle = rgba(pct < 0.35 ? COP : GOLD, 0.95);
    c.fillRect(sx(bx), sy(by), bw * pct * scale, bh * scale);
    c.font = '700 ' + (10 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    c.fillStyle = rgba(WHT, 0.85);
    c.textAlign = 'center';
    c.textBaseline = 'bottom';
    c.fillText(e.name, sx(VW * 0.5), sy(by - 3));
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0) return;
    const c = ctx;
    c.save();
    c.translate(sx(G.px), sy(G.py));
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle * 8);
      c.fillRect(12 * scale, -2.4 * scale, 12 * scale, 4.8 * scale);
    }
    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.moveTo(16 * scale, 0);
    c.lineTo(-5 * scale, -9 * scale);
    c.lineTo(-13 * scale, -3.2 * scale);
    c.lineTo(-13 * scale, 3.2 * scale);
    c.lineTo(-5 * scale, 9 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.moveTo(9 * scale, 0);
    c.lineTo(-1 * scale, -3.2 * scale);
    c.lineTo(-1 * scale, 3.2 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.92);
    c.fillRect(-13 * scale, -2.2 * scale, 8 * scale, 4.4 * scale);
    const thr = 0.6 + Math.sin(G.t * 28) * 0.4;
    c.fillStyle = rgba(TEAL, 0.55 + thr * 0.4);
    c.beginPath();
    c.moveTo(-13 * scale, -2.4 * scale);
    c.lineTo((-20 - thr * 8) * scale, 0);
    c.lineTo(-13 * scale, 2.4 * scale);
    c.closePath();
    c.fill();
    const lv = G.beam.on ? G.beam.lv : chargeLevel();
    if (G.beam.on || gaugeLevel() >= 1 || (G.fireHold && G.holdT >= TAP)) {
      const rad = 4 + lv * 5 + Math.sin(G.t * 14) * 1.2;
      c.fillStyle = rgba(lv >= 3 ? GOLD : lv >= 2 ? ORG : CYN, 0.55);
      c.beginPath();
      c.arc(18 * scale, 0, rad * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(WHT, 0.7);
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.beginPath();
      c.arc(18 * scale, 0, (rad + 3) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  function drawBeam() {
    if (!G.beam.on) return;
    const c = ctx;
    const lv = G.beam.lv;
    const a = clamp(G.beam.life / (lv === 3 ? 0.58 : lv === 2 ? 0.36 : 0.2), 0, 1);
    const x0 = G.px + 16;
    const w = VW - x0 + 30;
    const h = G.beam.h;
    const y = G.py;
    const rgb = lv >= 3 ? GOLD : lv >= 2 ? ORG : CYN;
    c.fillStyle = rgba(rgb, 0.18 * a);
    c.fillRect(sx(x0), sy(y - h * 0.85), w * scale, h * 1.7 * scale);
    c.fillStyle = rgba(rgb, 0.72 * a);
    c.fillRect(sx(x0), sy(y - h * 0.5), w * scale, h * scale);
    c.fillStyle = rgba(WHT, 0.85 * a);
    c.fillRect(sx(x0), sy(y - h * 0.16), w * scale, h * 0.32 * scale);
    if (!REDUCE) {
      c.fillStyle = rgba(DEEP, 0.35 * a);
      for (let k = 0; k < 4; k++) {
        const oy2 = Math.sin(G.t * 22 + k * 1.7 + G.px * 0.04) * h * 0.42;
        c.fillRect(sx(x0), sy(y + oy2), w * scale, 1.6 * scale);
      }
    }
    if (lv >= 3) {
      c.font = '900 ' + (13 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
      c.fillStyle = rgba(WHT, 0.35 * a);
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText('NEW ALONE', sx(x0 + 28), sy(y));
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.fillStyle = rgba(s.rgb || CYN, 0.95);
      c.fillRect(sx(s.x - s.w * 0.5), sy(s.y - s.h * 0.5), s.w * scale, Math.max(2, s.h * scale));
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      c.fillStyle = rgba(s.fat ? GOLD : COP, 0.95);
      c.beginPath();
      c.arc(sx(s.x - G.cam), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      if (s.fat) {
        c.fillStyle = rgba(DEEP, 0.85);
        c.beginPath();
        c.arc(sx(s.x - G.cam), sy(s.y), s.r * 0.42 * scale, 0, TAU);
        c.fill();
        c.strokeStyle = rgba(WHT, 0.5);
        c.lineWidth = Math.max(1, 1.1 * scale);
        c.beginPath();
        c.arc(sx(s.x - G.cam), sy(s.y), s.r * 0.7 * scale, 0, TAU);
        c.stroke();
      }
    }
  }

  function drawOrbs() {
    const c = ctx;
    for (let i = 0; i < G.orbs.length; i++) {
      const o = G.orbs[i];
      const pulse = 1 + Math.sin(o.t * 8 + i) * 0.12;
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(sx(o.x - G.cam), sy(o.y), 4.2 * pulse * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.85);
      c.beginPath();
      c.arc(sx(o.x - G.cam), sy(o.y), 1.7 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      c.fillRect(sx(p.x - p.r * 0.5), sy(p.y - p.r * 0.5), p.r * scale, p.r * scale);
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.28;
      c.fillStyle = rgba(s.rgb, 1 - t);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.rad * (0.4 + t) * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, 1 - t);
      c.lineWidth = Math.max(1, 2 * scale * (1 - t));
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + t * 28) * scale, 0, TAU);
      c.stroke();
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#04141c';
    c.fillRect(0, 0, W, H);

    c.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake * scale;
      shy = (Math.random() - 0.5) * G.shake * 0.7 * scale;
    }
    const punch = REDUCE ? 1 : G.punch;
    c.translate(W * 0.5 + shx, H * 0.5 + shy);
    c.scale(punch, punch);
    c.translate(-W * 0.5, -H * 0.5);

    if (isSea()) drawSea();
    else drawSpace();
    drawStars();

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = (e.x || 0) - G.cam;
      if (e.type !== 'eel' && e.type !== 'boss' && (x < -50 || x > VW + 50)) continue;
      if (e.type === 'fish') drawFish(e);
      else if (e.type === 'drone') drawDrone(e);
      else if (e.type === 'jelly') drawJelly(e);
      else if (e.type === 'crab') drawCrab(e);
      else if (e.type === 'squid') drawSquid(e);
      else if (e.type === 'sat') drawSat(e);
      else if (e.type === 'mine') drawMine(e);
      else if (e.type === 'heavy') drawHeavy(e);
      else if (e.type === 'eel') drawEel(e);
      else if (e.type === 'boss') drawBoss(e);
    }

    drawOrbs();
    drawShip();
    drawBeam();
    drawShots();
    drawFx();

    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
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
    if (G.mode === 'title') startGame('sea');
    else startGame(G.kind || 'sea');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('sea');
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
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter')) {
      e.preventDefault();
    }
    if (!down) {
      if (space && G.fireHold) {
        G.fireHold = false;
        releaseCharge();
      }
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R')) return;
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
      startGame(k === '2' ? 'tide' : 'sea');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play' && space) {
        if (!G.fireHold) {
          G.fireHold = true;
          G.holdT = 0;
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
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      inputSrc = 'ptr';
      if (G.mode === 'play' && !G.fireHold) {
        G.fireHold = true;
        G.holdT = 0;
      }
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
      if (G.fireHold && inputSrc === 'ptr') {
        G.fireHold = false;
        releaseCharge();
      }
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
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
  seedBubbles();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnSea) {
    btnSea.addEventListener('click', function () {
      audio.ensure();
      startGame('sea');
    });
  }
  if (btnTide) {
    btnTide.addEventListener('click', function () {
      audio.ensure();
      startGame('tide');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'sea');
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
  if (btnFire) {
    btnFire.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      inputSrc = 'key';
      if (G.mode === 'play' && !G.fireHold) {
        G.fireHold = true;
        G.holdT = 0;
      }
      btnFire.classList.add('held');
    });
    function fireUp() {
      btnFire.classList.remove('held');
      if (G.fireHold) {
        G.fireHold = false;
        releaseCharge();
      }
    }
    btnFire.addEventListener('pointerup', fireUp);
    btnFire.addEventListener('pointercancel', fireUp);
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
      if (G.fireHold) {
        G.fireHold = false;
        releaseCharge();
      }
    }
  });

  requestAnimationFrame(frame);
})();
