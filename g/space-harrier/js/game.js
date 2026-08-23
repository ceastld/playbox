'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = VH * 0.38;
  const FOCAL = 0.58;
  const FAR = 1.06;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 10000;
  const COMBO_WIN = 1.38;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-space-harrier-best';
  const MUTE_KEY = 'playbox-space-harrier-mute';
  const AUTO_SPEED_KEY = 'playbox-space-harrier-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.52, 0.78, 1, 3.6];
  const OPS = '←↑↓→ / WSD 移动 · 空格开火 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 74, 210];
  const VIO = [196, 106, 255];
  const GOLD = [255, 227, 107];
  const WHT = [248, 236, 255];
  const PNK = [255, 154, 220];
  const MINT = [110, 240, 176];
  const LIME = [80, 210, 130];
  const ORG = [255, 150, 70];

  const STAGES = [
    { name: '花原', tag: 'BLOOM', len: 4.8, theme: 'bloom', boss: 'cap', bossName: '蘑王', hp: 12, hpD: 18, score: 1600 },
    { name: '石廊', tag: 'TOTEM', len: 5.2, theme: 'totem', boss: 'iris', bossName: '独眼', hp: 16, hpD: 22, score: 2200 },
    { name: '龙脊', tag: 'WYRM', len: 5.6, theme: 'wyrm', boss: 'twin', bossName: '双头', hp: 20, hpD: 28, score: 2800 },
    { name: '幻域', tag: 'PHANT', len: 6.2, theme: 'phant', boss: 'king', bossName: '幻龙', hp: 28, hpD: 38, score: 4200 }
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
  const btnPlain = document.getElementById('btn-plain');
  const btnDense = document.getElementById('btn-dense');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const progBar = document.getElementById('prog-bar');
  const progWrap = document.getElementById('prog-wrap');

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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: CX, y: VH * 0.7, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const smears = [];
  const ghosts = [];
  const stars = [];
  const P = { x: 0, y: 0, s: 1, z: 1 };
  const P2 = { x: 0, y: 0, s: 1, z: 1 };
  const P3 = { x: 0, y: 0, s: 1, z: 1 };
  const P4 = { x: 0, y: 0, s: 1, z: 1 };

  const G = {
    mode: 'title',
    kind: 'plain',
    t: 0,
    clock: 0,
    dist: 0,
    stageI: 0,
    stageDist: 0,
    px: 0,
    py: 0.34,
    visX: 0,
    visY: 0.34,
    bank: 0,
    lives: LIVES,
    score: 0,
    best: { c: 0, m: 0 },
    combo: 0,
    comboT: 0,
    comboMax: 0,
    mult: 1,
    ents: [],
    shots: [],
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
    spawnT: 0.4,
    nextLife: LIFE_EVERY,
    bossOn: false,
    bossDead: false,
    bossHp: 0,
    bossMax: 1,
    endT: 0,
    why: '',
    readyT: 0,
    clearT: 0
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoMoveX = 0;
  let autoMoveY = 0;
  let autoTarget = null;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function isDense() {
    return G.kind === 'dense';
  }
  function stageDef() {
    return STAGES[G.stageI] || STAGES[0];
  }
  function kindBest() {
    return isDense() ? G.best.m : G.best.c;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function lastStage() {
    return G.stageI >= STAGES.length - 1;
  }

  function worldSpd() {
    const base = isDense() ? 0.48 : 0.40;
    const rush = G.combo >= 12 ? 0.07 : G.combo >= 6 ? 0.04 : 0;
    return base + rush + G.stageI * 0.018;
  }
  function plySpd() {
    return isDense() ? 1.92 : 1.68;
  }
  function fireGap() {
    return isDense() ? 0.082 : 0.10;
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
      this.beep(640, 0.048, 'square', 0.028, 1480);
      this.beep(210, 0.036, 'sawtooth', 0.016, 80);
    },
    wood() {
      this.ensure();
      this.noise(0.06, 0.042, 420);
      this.beep(220, 0.09, 'triangle', 0.04, 90);
    },
    pop() {
      this.ensure();
      this.beep(520, 0.06, 'square', 0.042, 880);
      this.noise(0.04, 0.03, 1400);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.6, combo * 0.042);
      this.noise(0.04, 0.034, 1100);
      this.beep(500 * lift, 0.068, 'square', 0.046, 980 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.09, big ? 0.078 : 0.044, big ? 240 : 500);
      this.beep(big ? 150 : 250, big ? 0.26 : 0.12, 'sawtooth', 0.05, 52);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.07, 'sine', 0.038, 588 * m);
      this.beep(523 * m, 0.1, 'triangle', 0.032, 784 * m);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.062, 280);
      this.beep(260, 0.22, 'sawtooth', 0.055, 64);
      this.beep(130, 0.34, 'sine', 0.042, 40);
    },
    stage() {
      this.ensure();
      this.beep(494, 0.08, 'square', 0.042, 659);
      this.beep(659, 0.1, 'triangle', 0.04, 880);
      this.beep(988, 0.16, 'sine', 0.046, 1318);
    },
    boss() {
      this.ensure();
      this.beep(98, 0.24, 'sawtooth', 0.058, 62);
      this.beep(147, 0.32, 'square', 0.038, 82);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.05, 659);
      this.beep(659, 0.12, 'triangle', 0.046, 784);
      this.beep(1046, 0.26, 'sine', 0.052, 1318);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.22, 'sawtooth', 0.044, 80);
      this.beep(130, 0.34, 'sine', 0.048, 44);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.038, 660);
      this.beep(660, 0.14, 'triangle', 0.04, 990);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.042, 880);
      this.beep(880, 0.12, 'triangle', 0.046, 1320);
    }
  };

  function project(wx, wy, wz, out) {
    const z = wz < 0.05 ? 0.05 : wz;
    const s = FOCAL / z;
    const camX = G.visX * 0.16;
    const camY = 0.09 + G.visY * 0.035;
    out.x = CX + (wx - camX) * s * CX;
    out.y = HORIZON - (wy - camY) * s * VH * 0.5;
    out.s = s;
    out.z = z;
  }

  function playerScreen() {
    return {
      x: CX + G.visX * (CX - 52),
      y: (HORIZON + 52) + (1 - G.visY) * (VH - HORIZON - 96)
    };
  }

  function palette() {
    const th = stageDef().theme;
    if (th === 'totem') {
      return {
        skyTop: [16, 8, 28], skyHor: [48, 22, 72], skyLow: [22, 10, 36],
        gA: [36, 16, 52], gB: [58, 26, 78], hill: [24, 10, 40],
        sun: VIO, fog: [140, 70, 200]
      };
    }
    if (th === 'wyrm') {
      return {
        skyTop: [22, 6, 16], skyHor: [72, 16, 40], skyLow: [32, 8, 20],
        gA: [48, 12, 28], gB: [78, 18, 42], hill: [30, 8, 22],
        sun: MAG, fog: [255, 80, 140]
      };
    }
    if (th === 'phant') {
      return {
        skyTop: [8, 4, 18], skyHor: [28, 10, 48], skyLow: [12, 6, 24],
        gA: [18, 8, 32], gB: [32, 12, 52], hill: [14, 6, 28],
        sun: GOLD, fog: [180, 90, 255]
      };
    }
    return {
      skyTop: [18, 8, 28], skyHor: [64, 24, 80], skyLow: [28, 12, 40],
      gA: [22, 48, 32], gB: [48, 22, 62], hill: [18, 28, 24],
      sun: MAG, fog: [255, 120, 200]
    };
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }
  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : 'hit';
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

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1100);
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
      t: 0, life: gold ? 0.95 : 0.68,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -90 : -72
    });
    capArr(floats, 32);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -210 * p, vx1: 210 * p, vy0: -250 * p, vy1: 110 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.6 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.15 + p * 0.12);
    kick(2.0 + p * 2.3);
  }

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (n >= 1 && n <= 4) return n;
    } catch (err) { /* ignore */ }
    return 3;
  }

  function saveAutoSpeed(n) {
    try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (err) { /* ignore */ }
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.best.c = o.c | 0;
        G.best.m = o.m | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.best.c = n;
      }
    } catch (err) { /* ignore */ }
  }

  function maybeBest() {
    const k = isDense() ? 'm' : 'c';
    if (G.score > G.best[k]) {
      G.best[k] = G.score | 0;
      try { localStorage.setItem(BEST_KEY, JSON.stringify(G.best)); } catch (err) { /* ignore */ }
    }
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n | 0;
    maybeBest();
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
    }
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(kindBest() | 0);
    if (!scoreBox || !scoreAdd) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + (n | 0);
    addTok += 1;
    const tok = addTok;
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function setHint(t, cls) {
    if (!hintEl) return;
    hintEl.textContent = t;
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

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(kindBest() | 0);
    const st = stageDef();
    if (stageLabel) {
      stageLabel.textContent = G.bossOn ? st.bossName : st.name;
      stageLabel.classList.toggle('hot', G.stageI >= 2);
      stageLabel.classList.toggle('boss', G.bossOn);
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密林' : '冲原';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', G.bossOn);
    }
    if (progBar) {
      let t;
      if (G.bossOn && G.bossMax > 0) t = clamp(G.bossHp / G.bossMax, 0, 1);
      else t = clamp(G.stageDist / Math.max(0.2, st.len), 0, 1);
      progBar.style.transform = 'scaleX(' + t + ')';
    }
    if (progWrap) {
      progWrap.classList.toggle('boss', G.bossOn);
      const em = progWrap.querySelector('em');
      if (em) em.textContent = G.bossOn ? '血' : '程';
    }
    if (comboEl) {
      const show = G.mode === 'play' && G.combo >= 2;
      comboEl.hidden = !show;
      if (show) comboEl.textContent = G.mult > 1 ? (G.combo + ' 连 ×' + G.mult) : (G.combo + ' 连');
    }
    if (autoOn && G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下', '');
    else if (autoOn && G.mode === 'play') setHint('自动托管 · 飞射躲进画面 · A 停下', G.lives === 1 ? 'warn' : '');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('幻域打穿 · R 再来一局', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 撞树蘑龙或中弹扣一命', 'warn');
    else if (G.bossOn) setHint('头目 · 扫射 ' + st.bossName, 'hot');
    else if (G.lives === 1) setHint('最后一命 · 飞高可越过矮树蘑', 'warn');
    else setHint('方向移动 · 空格开火 · 树蘑都能打', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'DOWN' : 'HARR';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 52; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(8, HORIZON - 10),
        r: rand(0.6, 1.8),
        a: rand(0.22, 0.85),
        tw: rand(0, TAU)
      });
    }
  }

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    smears.length = 0;
    ghosts.length = 0;
  }

  function mkEnt(kind, x, y, extra) {
    const en = {
      kind: kind,
      x: x,
      y: y,
      z: FAR,
      vx: 0,
      vy: 0,
      hp: 1,
      r: 0.1,
      hitR: 0.1,
      h: 0.3,
      score: 50,
      ground: false,
      shootable: true,
      solid: true,
      t: 0,
      phase: rand(0, TAU),
      flash: 0,
      shotCd: rand(0.4, 1.1),
      wob: rand(0.6, 1.4),
      form: ''
    };
    if (extra) {
      const ks = Object.keys(extra);
      for (let i = 0; i < ks.length; i++) en[ks[i]] = extra[ks[i]];
    }
    G.ents.push(en);
    capArr(G.ents, 58);
    return en;
  }

  function spawnTree(x) {
    mkEnt('tree', x, 0, { ground: true, h: 0.48, hitR: 0.11, r: 0.12, score: 60 });
  }
  function spawnMush(x) {
    mkEnt('mush', x, 0, { ground: true, h: 0.32, hitR: 0.12, r: 0.13, score: 80 });
  }
  function spawnTotem(x) {
    mkEnt('totem', x, 0, { ground: true, h: 0.78, hitR: 0.1, r: 0.11, hp: 2, score: 120 });
  }
  function spawnSpore(x, y, z) {
    mkEnt('spore', x, y == null ? rand(0.22, 0.7) : y, {
      z: z == null ? FAR : z, r: 0.09, hitR: 0.09, score: 90
    });
  }
  function spawnHop(x, y) {
    mkEnt('hop', x, y == null ? rand(0.16, 0.62) : y, { r: 0.11, hitR: 0.11, score: 110, hp: 1 });
  }
  function spawnEye(x, y) {
    mkEnt('eye', x, y == null ? rand(0.24, 0.64) : y, {
      r: 0.13, hitR: 0.13, score: 180, hp: 2, shotCd: rand(0.45, 1.05)
    });
  }
  function spawnWyrm(x, y) {
    mkEnt('wyrm', x, y == null ? rand(0.26, 0.7) : y, { r: 0.13, hitR: 0.13, score: 240, hp: 2 });
  }
  function spawnEshot(x, y, z, hx, hy) {
    mkEnt('eshot', x, y, {
      z: z, shootable: false, r: 0.055, hitR: 0.06, score: 0,
      vx: hx || 0, vy: hy || 0, ground: false, solid: true
    });
  }

  function spawnBoss() {
    const st = stageDef();
    const hp = isDense() ? st.hpD : st.hp;
    G.bossOn = true;
    G.bossDead = false;
    G.bossHp = hp;
    G.bossMax = hp;
    mkEnt('boss', 0, 0.42, {
      z: 0.96, r: 0.22, hitR: 0.2, hp: hp, score: st.score,
      shotCd: 0.7, form: st.boss, shootable: true, solid: true
    });
    audio.boss();
    toast(st.bossName + ' · 开火', true, false);
    screenFlash(MAG, 0.34);
    hud();
  }

  function threatX() {
    if (G.mode === 'play' && Math.random() < 0.58) {
      return clamp(G.px + rand(-0.18, 0.18), -0.84, 0.84);
    }
    return rand(-0.84, 0.84);
  }
  function threatY() {
    if (G.mode === 'play' && Math.random() < 0.52) {
      return clamp(G.py + rand(-0.16, 0.16), 0.16, 0.78);
    }
    return rand(0.18, 0.72);
  }

  function pickSpawn() {
    const th = stageDef().theme;
    const x = threatX();
    const x2 = clamp(x + rand(0.2, 0.4) * (Math.random() < 0.5 ? 1 : -1), -0.86, 0.86);
    if (th === 'bloom') {
      const r = Math.random();
      if (r < 0.38) { spawnTree(x); if (Math.random() < 0.55) spawnTree(x2); }
      else if (r < 0.66) spawnMush(x);
      else if (r < 0.84) spawnHop(x, threatY());
      else spawnSpore(x, threatY());
      return;
    }
    if (th === 'totem') {
      const r = Math.random();
      if (r < 0.28) spawnTotem(x);
      else if (r < 0.46) spawnTree(x);
      else if (r < 0.66) spawnEye(x, threatY());
      else if (r < 0.84) spawnSpore(x, threatY());
      else spawnHop(x, threatY());
      return;
    }
    if (th === 'wyrm') {
      const r = Math.random();
      if (r < 0.24) spawnMush(x);
      else if (r < 0.38) spawnTree(x);
      else if (r < 0.62) spawnWyrm(x, threatY());
      else if (r < 0.8) spawnHop(x, threatY());
      else spawnEye(x, threatY());
      return;
    }
    const r = Math.random();
    if (r < 0.16) spawnTotem(x);
    else if (r < 0.3) spawnTree(x);
    else if (r < 0.42) spawnMush(x);
    else if (r < 0.6) spawnWyrm(x, threatY());
    else if (r < 0.76) spawnEye(x, threatY());
    else if (r < 0.88) spawnHop(x, threatY());
    else spawnSpore(x, threatY());
  }

  function spawnInterval() {
    let base = G.bossOn ? 0.62 : 0.40;
    if (isDense()) base *= 0.62;
    if (G.combo >= 8) base *= 0.9;
    if (G.stageI >= 2) base *= 0.9;
    return base;
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.comboMax) G.comboMax = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      toast(G.mult + ' 倍', false, true);
    }
    if (comboEl) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
    }
    if (G.combo === 8) toast('连击 ×8', false, true);
    if (G.combo === 16) toast('连击 ×16 · 幻走', false, true);
  }

  function killRgb(en) {
    if (en.kind === 'tree') return LIME;
    if (en.kind === 'mush' || en.kind === 'hop' || en.form === 'cap') return MAG;
    if (en.kind === 'totem') return VIO;
    if (en.kind === 'wyrm' || en.form === 'twin' || en.form === 'king') return PNK;
    if (en.kind === 'boss') return MAG;
    return VIO;
  }

  function killEnt(en) {
    project(en.ground ? en.x : en.x, en.ground ? 0 : en.y, en.z, P);
    const rgb = killRgb(en);
    const pow = en.kind === 'boss' ? 2.7 : en.kind === 'tree' ? 1.15 : 1;
    juice(P.x, P.y - (en.ground ? 18 : 0), rgb, pow);
    if (en.kind === 'tree') audio.wood();
    else if (en.kind === 'mush' || en.kind === 'hop') audio.pop();
    else audio.hit(G.combo + 1);
    audio.boom(en.kind === 'boss' || en.kind === 'wyrm' || en.kind === 'totem');
    hitStop(en.kind === 'boss' ? 0.078 : en.kind === 'tree' ? 0.052 : 0.04);
    const pts = (en.score || 50) * G.mult;
    floatText(P.x, P.y, '+' + pts, G.mult > 1 ? GOLD : WHT, G.mult > 1);
    bumpCombo();
    addScore(pts);
    if (en.kind === 'boss') {
      G.bossOn = false;
      G.bossDead = true;
      G.bossHp = 0;
      audio.boom(true);
      toast(stageDef().bossName + ' 爆了', false, true);
      if (lastStage()) {
        G.endT = 1.2;
        G.why = 'win';
      } else {
        G.clearT = 0.85;
      }
    }
    en.hp = 0;
  }

  function playerHit() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0.8;
    G.invuln = 1.5;
    const ps = playerScreen();
    audio.death();
    hitStop(0.074);
    kick(8);
    screenFlash(MAG, 0.64);
    juice(ps.x, ps.y, MAG, 2.3);
    emit(24, {
      x: ps.x, y: ps.y, j: 18,
      vx0: -270, vx1: 270, vy0: -230, vy1: 80,
      r0: 2, r1: 5.6, life: 0.56, rgb: MAG
    });
    hud();
    if (G.lives <= 0) {
      G.why = 'lose';
      G.endT = 0.95;
    } else {
      toast('再飞', true, false);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.endT > 0) return;
    if (G.fireCd > 0) return;
    if (G.shots.length >= 7) return;
    G.fireCd = fireGap();
    G.muzzle = 0.07;
    G.shots.push({ x: G.px, y: G.py + 0.04, z: 0.14, vz: 1.92 });
    audio.shoot();
    if (REDUCE) return;
    const ps = playerScreen();
    emit(5, {
      x: ps.x, y: ps.y - 10, j: 4,
      vx0: -40, vx1: 40, vy0: -130, vy1: -24,
      r0: 1, r1: 2.2, life: 0.16, rgb: GOLD, g: 0
    });
  }

  function nextStage() {
    if (lastStage()) return;
    G.stageI += 1;
    G.stageDist = 0;
    G.bossOn = false;
    G.bossDead = false;
    G.readyT = 0.95;
    G.clearT = 0;
    addScore(600);
    audio.stage();
    toast('下一关 · ' + stageDef().name, false, true);
    screenFlash(GOLD, 0.3);
    G.invuln = Math.max(G.invuln, 0.75);
    hud();
  }

  function finishWin() {
    const bonus = 2000 + G.lives * 350;
    G.score += bonus;
    maybeBest();
    G.mode = 'win';
    audio.win();
    showOverlay('win', '通关', '幻域打穿　·　' + (G.score | 0) + ' 分　·　最高连 ' + G.comboMax);
    hud();
  }

  function finishLose() {
    G.mode = 'lose';
    maybeBest();
    audio.lose();
    showOverlay('lose', '坠原了', '飞到 ' + stageDef().name + '　·　' + (G.score | 0) + ' 分。撞物或中弹扣命。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'dense' ? 'dense' : 'plain';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.dist = 0;
    G.stageI = 0;
    G.stageDist = 0;
    G.px = 0;
    G.py = 0.34;
    G.visX = 0;
    G.visY = 0.34;
    G.bank = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.comboMax = 0;
    G.mult = 1;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0.32;
    G.flashRgb = VIO;
    G.punch = 1;
    G.muzzle = 0;
    G.spawnT = 0.5;
    G.nextLife = LIFE_EVERY;
    G.bossOn = false;
    G.bossDead = false;
    G.bossHp = 0;
    G.bossMax = 1;
    G.endT = 0;
    G.why = '';
    G.readyT = 1.0;
    G.clearT = 0;
    autoOvWait = 0;
    autoMoveX = 0;
    autoMoveY = 0;
    autoTarget = null;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    hideOverlay();
    audio.start();
    toast(isDense() ? '密林 · 更密更狠' : '冲原 · 花原出发', false, true);
    hud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'plain';
    G.stageI = 0;
    G.dist = 0;
    G.stageDist = 0;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.px = 0;
    G.py = 0.34;
    G.visX = 0;
    G.visY = 0.34;
    G.deadT = 0;
    G.invuln = 0;
    G.bossOn = false;
    G.bossDead = false;
    G.endT = 0;
    G.clearT = 0;
    G.spawnT = 0.28;
    clearField();
    showOverlay('title', '幻域', '冲进画面。扫射树蘑龙，撞了扣命。短关之后是头目。');
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('plain');
    else startGame(G.kind || 'plain');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('plain');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function updateGhosts() {
    if (REDUCE) return;
    const ps = playerScreen();
    ghosts.push({ x: ps.x, y: ps.y, bank: G.bank, t: 0.16 });
    capArr(ghosts, 7);
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 26);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 11));
    G.flash = Math.max(0, G.flash - dt * 2.2);
    if (G.muzzle > 0) G.muzzle -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.6;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.8;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].t -= dt;
      if (ghosts[i].t <= 0) ghosts.splice(i, 1);
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].t -= dt;
      if (smears[i].t <= 0) smears.splice(i, 1);
    }
  }

  function clearAutoKeys() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    G.fireHold = false;
    pointer.down = false;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (speedEl) speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    if (speedEl) {
      speedEl.title = SPEED_LABELS[autoSpeed];
      speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
    }
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
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
    autoMoveX = 0;
    autoMoveY = 0;
    autoTarget = null;
    clearAutoKeys();
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('plain');
    }
    hud();
  }

  function predEnt(en, t) {
    const spd = worldSpd();
    let x = en.x;
    let y = en.ground ? 0 : en.y;
    let z = en.z;
    if (en.kind === 'boss') {
      return { x: x, y: en.y, z: z };
    }
    if (en.kind === 'eshot') {
      z -= (isDense() ? 0.7 : 0.56) * t;
      x += en.vx * t;
      y += en.vy * t;
      return { x: x, y: y, z: z };
    }
    z -= spd * t;
    if (en.kind === 'wyrm' && en.z < 0.62) {
      x = lerp(en.x, G.px, Math.min(1, t * 1.55));
      y = lerp(en.y, G.py, Math.min(1, t * 1.25));
      z -= spd * 0.42 * t;
    } else if (en.kind === 'eye') {
      x = lerp(en.x, G.px, Math.min(1, t * 0.32));
      y = lerp(en.y, G.py, Math.min(1, t * 0.2));
    } else if (en.kind === 'spore') {
      x += Math.sin(en.t * 2.4 * en.wob + en.phase) * 0.24 * t;
      y += Math.cos(en.t * 1.7 + en.phase) * 0.12 * t;
    } else if (en.kind === 'hop') {
      x += Math.sin(en.t * 3.4 + en.phase) * 0.32 * t;
      y = 0.18 + Math.abs(Math.sin((en.t + t) * 5.2 + en.phase)) * 0.42;
    }
    return { x: x, y: y, z: z };
  }

  function pickAutoTarget() {
    let best = null;
    let bestS = -1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (!en.shootable || en.hp <= 0) continue;
      if (en.z < 0.16 || en.z > 1.12) continue;
      let sc = 40 / (en.z + 0.12);
      if (en.kind === 'boss') sc += 220;
      else if (en.kind === 'wyrm') sc += 70;
      else if (en.kind === 'eye') sc += 55;
      else if (en.kind === 'totem') sc += 28;
      else if (en.kind === 'hop' || en.kind === 'spore') sc += 22;
      sc += en.hp * 8;
      sc -= Math.abs(en.x - G.px) * 18;
      if (!en.ground) sc -= Math.abs(en.y - G.py) * 12;
      if (autoTarget === en) sc += 10;
      if (sc > bestS) {
        bestS = sc;
        best = en;
      }
    }
    autoTarget = best;
    return best;
  }

  function scoreAutoPos(nx, ny, look) {
    const inv = G.invuln > 0.12;
    const panic = inv ? 0.18 : 1;
    let score = 0;
    const tgt = autoTarget;
    let homeX = 0;
    let homeY = 0.56;
    if (tgt) {
      homeX = clamp(tgt.x, -0.72, 0.72);
      if (tgt.ground) {
        homeY = tgt.h >= 0.7 ? 0.34 : clamp(tgt.h + 0.14, 0.28, 0.84);
        if (ny < tgt.h + 0.18) score += (1 - Math.min(1, Math.abs(nx - tgt.x) / 0.42)) * 80;
      } else {
        homeY = clamp(tgt.y, 0.16, 0.8);
        const ax = 1 - Math.min(1, Math.abs(nx - tgt.x) / 0.46);
        const ay = 1 - Math.min(1, Math.abs(ny - tgt.y) / 0.46);
        score += (ax * 70 + ay * 58) / (tgt.z + 0.18);
      }
    }
    score -= Math.abs(nx - homeX) * 95;
    score -= Math.abs(ny - homeY) * 82;
    if (Math.abs(nx) > 0.78) score -= (Math.abs(nx) - 0.78) * 220;
    if (ny < 0.1 || ny > 0.86) score -= 80;

    const times = [0.05, 0.14, 0.26, 0.42, 0.62];
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0 && en.kind !== 'eshot') continue;
      for (let k = 0; k < times.length; k++) {
        const t = times[k];
        if (t > look + 0.5) continue;
        const p = predEnt(en, t);
        if (p.z > 0.28 || p.z < 0.04) continue;
        const soon = clamp((0.28 - p.z) / 0.24, 0.15, 1);
        if (en.ground) {
          const clear = ny > en.h + 0.06;
          const dx = Math.abs(nx - p.x);
          const rad = en.hitR + 0.12;
          if (!clear) {
            if (dx < rad) score -= 14000 * panic * soon;
            else if (dx < rad + 0.22) score -= ((rad + 0.22 - dx) * 420) * panic * soon;
          } else if (dx < 0.28 && en.h < 0.7) {
            score += 22 * soon;
          }
        } else {
          const d = hypot(nx - p.x, (ny - p.y) * 0.75);
          const rad = en.hitR + 0.12;
          const w = en.kind === 'eshot' ? 1.45 : en.kind === 'wyrm' ? 1.2 : 1;
          if (d < rad) score -= 16000 * panic * soon * w;
          else if (d < rad + 0.28) score -= ((rad + 0.28 - d) * 520) * panic * soon * w;
        }
      }
      if (en.shootable && en.z > 0.22 && en.z < 1.05) {
        const ax = 1 - Math.min(1, Math.abs(nx - en.x) / 0.5);
        if (en.kind === 'boss') {
          const ay = 1 - Math.min(1, Math.abs(ny - en.y) / 0.5);
          score += (ax * 70 + ay * 48) / (en.z + 0.15);
        } else if (!en.ground) {
          const ay = 1 - Math.min(1, Math.abs(ny - en.y) / 0.5);
          score += (ax * 18 + ay * 14) / (en.z + 0.2);
        }
      }
    }
    return score;
  }

  function autoThink() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    G.fireHold = false;
    if (G.mode !== 'play' || G.deadT > 0) return;

    const tgt = pickAutoTarget();
    const look = 0.2;
    const spd = plySpd();
    const px = G.px;
    const py = G.py;
    const reachX = spd * look;
    const reachY = spd * 0.88 * look;
    let bestS = scoreAutoPos(px, py, look);
    let bx = 0;
    let by = 0;
    const stayS = bestS;
    const nDir = 16;
    for (let i = 0; i < nDir; i++) {
      const a = (TAU * i) / nDir;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const nx = clamp(px + dx * reachX, -0.92, 0.92);
      const ny = clamp(py + dy * reachY, 0.05, 0.9);
      const s = scoreAutoPos(nx, ny, look);
      if (s > bestS) {
        bestS = s;
        bx = dx;
        by = dy;
      }
    }
    const lanes = [
      [0, 0.72], [0, 0.22], [-0.58, 0.58], [0.58, 0.58],
      [-0.58, 0.28], [0.58, 0.28], [0, 0.5]
    ];
    for (let i = 0; i < lanes.length; i++) {
      const nx = clamp(px + clamp(lanes[i][0] - px, -reachX, reachX), -0.92, 0.92);
      const ny = clamp(py + clamp(lanes[i][1] - py, -reachY, reachY), 0.05, 0.9);
      const s = scoreAutoPos(nx, ny, look);
      if (s > bestS) {
        bestS = s;
        bx = nx - px;
        by = ny - py;
        const len = hypot(bx, by) || 1;
        bx /= len;
        by /= len;
      }
    }
    const cur = scoreAutoPos(
      clamp(px + autoMoveX * reachX, -0.92, 0.92),
      clamp(py + autoMoveY * reachY, 0.05, 0.9),
      look
    );
    const danger = bestS < -400 || cur < -400;
    if (bestS > stayS + (danger ? 8 : 3) && bestS > cur + (danger ? 5 : 2)) {
      autoMoveX = bx;
      autoMoveY = by;
    } else if (stayS >= bestS - 2) {
      autoMoveX = 0;
      autoMoveY = 0;
    }

    if (autoMoveX < -0.18) keys.l = true;
    else if (autoMoveX > 0.18) keys.r = true;
    if (autoMoveY > 0.18) keys.u = true;
    else if (autoMoveY < -0.18) keys.d = true;

    if (!keys.l && !keys.r && !keys.u && !keys.d && tgt) {
      const tx = clamp(tgt.x, -0.72, 0.72);
      const ty = tgt.ground
        ? (tgt.h >= 0.7 ? G.py : clamp(tgt.h + 0.14, 0.28, 0.84))
        : clamp(tgt.y, 0.16, 0.8);
      if (tx - px < -0.07) keys.l = true;
      else if (tx - px > 0.07) keys.r = true;
      if (ty - py > 0.07) keys.u = true;
      else if (ty - py < -0.07) keys.d = true;
    }
    if (!keys.l && !keys.r && !keys.u && !keys.d && !tgt) {
      if (py < 0.5) keys.u = true;
      else if (py > 0.64) keys.d = true;
    }

    G.fireHold = true;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame('plain');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'plain');
      }
    }
  }

  function steerPlayer(dt) {
    let ax = 0;
    let ay = 0;
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (keys.u) ay += 1;
    if (keys.d) ay -= 1;
    const spd = plySpd();
    if (!autoOn && inputSrc === 'ptr' && (pointer.down || pointer.hover) && G.mode === 'play') {
      const tx = clamp((pointer.x - CX) / (CX - 52), -1, 1);
      const ty = clamp(1 - (pointer.y - (HORIZON + 52)) / (VH - HORIZON - 96), 0.04, 0.92);
      G.px = lerp(G.px, tx, 1 - Math.exp(-dt * 11));
      G.py = lerp(G.py, ty, 1 - Math.exp(-dt * 11));
    } else if (G.mode === 'title') {
      G.px = Math.sin(G.t * 0.7) * 0.56;
      G.py = 0.34 + Math.sin(G.t * 0.92) * 0.22;
    } else {
      if (ax && ay) {
        ax *= 0.75;
        ay *= 0.75;
      }
      G.px = clamp(G.px + ax * spd * dt, -0.92, 0.92);
      G.py = clamp(G.py + ay * spd * 0.88 * dt, 0.05, 0.9);
    }
    const dx = G.px - G.visX;
    G.bank = lerp(G.bank, clamp(dx * 8 + (keys.r ? 1 : 0) - (keys.l ? 1 : 0), -1, 1), 1 - Math.exp(-dt * 10));
    G.visX = lerp(G.visX, G.px, 1 - Math.exp(-dt * 14));
    G.visY = lerp(G.visY, G.py, 1 - Math.exp(-dt * 14));
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const sh = G.shots[i];
      sh.z += sh.vz * dt;
      if (sh.z > 1.2) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (!en.shootable || en.hp <= 0) continue;
        if (Math.abs(sh.z - en.z) > 0.09) continue;
        let d;
        if (en.ground) {
          if (sh.y > en.h + 0.18) continue;
          d = Math.abs(sh.x - en.x);
        } else {
          d = hypot(sh.x - en.x, (sh.y - en.y) * 0.7);
        }
        if (d > en.r + 0.08) continue;
        en.hp -= 1;
        en.flash = 0.1;
        if (en.kind === 'boss') G.bossHp = en.hp;
        project(en.x, en.ground ? 0 : en.y, en.z, P);
        emit(6, {
          x: P.x, y: P.y - (en.ground ? 14 : 0), j: 8,
          vx0: -120, vx1: 120, vy0: -140, vy1: 40,
          r0: 1, r1: 2.4, life: 0.2, rgb: GOLD, g: 80
        });
        hitStop(0.032);
        if (en.hp <= 0) killEnt(en);
        else {
          audio.hit(G.combo);
          addScore(10);
        }
        hit = true;
        break;
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBoss(en, dt, playing) {
    const form = en.form;
    if (form === 'cap') {
      const tz = 0.46 + Math.sin(en.t * 0.8) * 0.05;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.7));
      en.x = Math.sin(en.t * 1.15) * 0.58;
      en.y = 0.22 + Math.abs(Math.sin(en.t * 2.4)) * 0.28;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.62) {
        en.shotCd = isDense() ? 0.78 : 1.05;
        spawnSpore(en.x, en.y + 0.08, en.z - 0.04);
      }
    } else if (form === 'iris') {
      const tz = 0.44 + Math.sin(en.t * 0.65) * 0.04;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.5));
      en.x = lerp(en.x, G.px * 0.7, dt * 0.7);
      en.y = 0.4 + Math.sin(en.t * 0.9) * 0.16;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.62) {
        en.shotCd = isDense() ? 0.7 : 0.92;
        const n = 3;
        for (let k = 0; k < n; k++) {
          const a = (k - 1) * 0.14;
          spawnEshot(en.x + a, en.y, en.z - 0.02, (G.px - en.x) * 0.32 + a, (G.py - en.y) * 0.26);
        }
      }
    } else if (form === 'twin') {
      const tz = 0.42 + Math.sin(en.t * 0.9) * 0.05;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.6));
      en.x = Math.sin(en.t * 1.45) * 0.62;
      en.y = 0.38 + Math.sin(en.t * 1.7) * 0.2;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.64) {
        en.shotCd = isDense() ? 0.62 : 0.84;
        spawnEshot(en.x - 0.12, en.y, en.z - 0.02, (G.px - en.x) * 0.38, (G.py - en.y) * 0.3);
        spawnEshot(en.x + 0.12, en.y, en.z - 0.02, (G.px - en.x) * 0.38, (G.py - en.y) * 0.3);
      }
    } else {
      const tz = 0.4 + Math.sin(en.t * 0.7) * 0.04;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.4));
      en.x = Math.sin(en.t * 0.95) * 0.55;
      en.y = 0.4 + Math.sin(en.t * 1.15) * 0.18;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.62) {
        en.shotCd = isDense() ? 0.58 : 0.78;
        const n = isDense() ? 5 : 4;
        for (let k = 0; k < n; k++) {
          const a = (k - (n - 1) * 0.5) * 0.12;
          spawnEshot(en.x + a * 0.4, en.y, en.z - 0.02, (G.px - en.x) * 0.34 + a, (G.py - en.y) * 0.26);
        }
        if (Math.random() < 0.28) spawnWyrm(rand(-0.7, 0.7), rand(0.28, 0.62));
      }
    }
  }

  function updateEnts(dt) {
    const spd = worldSpd();
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0 && en.kind !== 'boss') {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.kind === 'boss') {
        if (en.hp <= 0) {
          G.ents.splice(i, 1);
          continue;
        }
        updateBoss(en, dt, playing);
      } else if (en.kind === 'eshot') {
        en.z -= (isDense() ? 0.7 : 0.56) * dt;
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        const hx = G.px - en.x;
        const hy = G.py - en.y;
        en.vx = lerp(en.vx, hx * 0.48, dt * 1.25);
        en.vy = lerp(en.vy, hy * 0.4, dt * 1.25);
      } else {
        en.z -= spd * dt;
        if (en.kind === 'spore') {
          en.x += Math.sin(en.t * 2.4 * en.wob + en.phase) * 0.24 * dt;
          en.y += Math.cos(en.t * 1.7 + en.phase) * 0.12 * dt;
        } else if (en.kind === 'hop') {
          en.x += Math.sin(en.t * 3.4 + en.phase) * 0.32 * dt;
          en.y = 0.18 + Math.abs(Math.sin(en.t * 5.2 + en.phase)) * 0.42;
        } else if (en.kind === 'eye') {
          en.x = lerp(en.x, G.px, dt * 0.32);
          en.y = lerp(en.y, G.py, dt * 0.2);
          en.shotCd -= dt;
          if (playing && en.shotCd <= 0 && en.z < 0.7 && en.z > 0.22) {
            en.shotCd = isDense() ? 1.0 : 1.32;
            spawnEshot(en.x, en.y, en.z, (G.px - en.x) * 0.4, (G.py - en.y) * 0.3);
          }
        } else if (en.kind === 'wyrm') {
          if (en.z < 0.6) {
            en.x = lerp(en.x, G.px, dt * 1.55);
            en.y = lerp(en.y, G.py, dt * 1.25);
            en.z -= spd * 0.42 * dt;
          } else {
            en.x += Math.sin(en.t * 1.5 + en.phase) * 0.2 * dt;
          }
        }
      }
      en.x = clamp(en.x, -1.05, 1.05);
      en.y = clamp(en.y, en.ground ? 0 : 0.02, 0.95);

      if (en.z < 0.045 || en.z > 1.28) {
        G.ents.splice(i, 1);
        continue;
      }

      if (en.z < 0.18 && en.z > 0.05 && canHurt && playing && G.deadT <= 0) {
        const dx = en.x - G.px;
        let hit;
        if (en.ground) {
          hit = G.py <= en.h + 0.05 && Math.abs(dx) < en.hitR + 0.1;
        } else {
          hit = hypot(dx, (en.y - G.py) * 0.75) < (en.hitR + 0.1);
        }
        if (hit) {
          playerHit();
          if (en.kind === 'eshot' || en.kind === 'spore') G.ents.splice(i, 1);
        }
      }
    }
  }

  function maybeSpawn(dt) {
    if (G.readyT > 0 && G.mode === 'play') return;
    if (G.bossDead) return;
    G.spawnT -= dt;
    const need = spawnInterval();
    if (G.spawnT > 0) return;
    G.spawnT = need * rand(0.72, 1.18);
    if (G.mode === 'title') {
      if (Math.random() < 0.5) spawnTree(rand(-0.8, 0.8));
      else if (Math.random() < 0.55) spawnMush(rand(-0.75, 0.75));
      else spawnHop(rand(-0.7, 0.7));
      return;
    }
    const st = stageDef();
    if (!G.bossOn && !G.bossDead && G.stageDist >= st.len) {
      spawnBoss();
      return;
    }
    pickSpawn();
    if (isDense() && Math.random() < 0.46) pickSpawn();
  }

  function update(dt) {
    G.t += dt;
    if (autoOn) tickAutoFlow(dt);
    if (G.stop > 0) {
      if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
      else {
        G.stop -= dt;
        updateFx(dt * 0.35);
        return;
      }
    }
    if (G.mode === 'play' || G.mode === 'title') {
      if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink();
      steerPlayer(dt);
      if (G.mode === 'title') {
        G.dist += 0.34 * dt;
        G.clock += dt;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        G.clock += dt;
        G.dist += worldSpd() * dt;
        if (!G.bossOn && !G.bossDead) G.stageDist += worldSpd() * dt;
        if (G.invuln > 0) G.invuln -= dt;
        if (G.readyT > 0) G.readyT -= dt;
        if (G.fireCd > 0) G.fireCd -= dt;
        if (G.fireHold) fire();
        if (G.comboT > 0) {
          G.comboT -= dt;
          if (G.comboT <= 0) {
            G.combo = 0;
            G.mult = 1;
          }
        }
        if (G.clearT > 0) {
          G.clearT -= dt;
          if (G.clearT <= 0) nextStage();
        }
      }
      if (G.deadT > 0) {
        G.deadT -= dt;
        if (G.invuln > 0) G.invuln -= dt * 0.25;
      }
      if (G.endT > 0 && G.mode === 'play') {
        G.endT -= dt;
        if (G.endT <= 0) {
          if (G.why === 'win') finishWin();
          else if (G.why === 'lose') finishLose();
        }
      }
      maybeSpawn(dt);
      updateShots(dt);
      updateEnts(dt);
      updateGhosts();
      if (!REDUCE && G.mode === 'play') {
        const ps = playerScreen();
        smears.push({
          x: ps.x, y: ps.y,
          vx: G.bank * 40, t: 0.12 + Math.min(0.08, G.combo * 0.004)
        });
        capArr(smears, 14);
      }
    }
    updateFx(dt);
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) hud();
  }

  function quad(x1, y1, x2, y2, x3, y3, x4, y4, rgb, a) {
    ctx.fillStyle = rgba(rgb, a == null ? 1 : a);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  function drawSky(pal) {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON + 8);
    g.addColorStop(0, rgba(pal.skyTop, 1));
    g.addColorStop(0.68, rgba(pal.skyHor, 1));
    g.addColorStop(1, rgba(pal.skyLow, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, HORIZON + 10);

    const sx = CX + 200 - G.visX * 20;
    ctx.fillStyle = rgba(pal.sun, 0.18);
    ctx.beginPath();
    ctx.arc(sx, 56, 38, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(pal.sun, 0.92);
    ctx.beginPath();
    ctx.arc(sx, 56, 20, 0, TAU);
    ctx.fill();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(G.t * 2.2 + s.tw));
      ctx.fillStyle = rgba(WHT, s.a * tw);
      ctx.fillRect(s.x - G.visX * 6, s.y, s.r, s.r);
    }

    const hillY = HORIZON + 6;
    ctx.beginPath();
    ctx.moveTo(0, hillY);
    for (let i = 0; i <= 18; i++) {
      const hx = (i / 18) * VW;
      const n = hash2((i + G.stageI * 11 + 5) * 19);
      const h = 16 + n * 52;
      ctx.lineTo(hx - G.visX * 24, hillY - h);
    }
    ctx.lineTo(VW, hillY);
    ctx.closePath();
    ctx.fillStyle = rgba(pal.hill, 1);
    ctx.fill();
  }

  function drawGround(pal) {
    const tw = 0.14;
    const tz = 0.09;
    const scroll = G.dist % tz;
    for (let i = 24; i >= 0; i--) {
      const z0 = 0.08 + i * tz - scroll;
      const z1 = z0 + tz;
      if (z1 < 0.07 || z0 > 1.22) continue;
      for (let j = -12; j < 12; j++) {
        const x0 = j * tw - (G.visX * 0.02);
        const x1 = x0 + tw;
        project(x0, 0, Math.max(0.06, z0), P);
        project(x1, 0, Math.max(0.06, z0), P2);
        project(x1, 0, z1, P3);
        project(x0, 0, z1, P4);
        const check = (i + j) & 1;
        const fog = clamp((z0 - 0.08) / 1.05, 0, 1);
        const col = check ? pal.gA : pal.gB;
        const mix = [
          (col[0] + pal.skyHor[0] * fog * 0.42) | 0,
          (col[1] + pal.skyHor[1] * fog * 0.42) | 0,
          (col[2] + pal.skyHor[2] * fog * 0.42) | 0
        ];
        quad(P.x, P.y, P2.x, P2.y, P3.x, P3.y, P4.x, P4.y, mix, 1);
      }
    }
    ctx.strokeStyle = rgba(VIO, 0.14);
    ctx.lineWidth = 1.2;
    for (let k = -3; k <= 3; k++) {
      project(k * 0.32, 0, 1.12, P);
      project(k * 0.32, 0, 0.08, P2);
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P2.x, P2.y);
      ctx.stroke();
    }
  }

  function drawSmear() {
    if (REDUCE) return;
    const vpX = CX - G.visX * 20;
    const vpY = HORIZON;
    const n = 10 + Math.min(8, G.combo);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const a = -0.78 + (i / (n - 1)) * 1.56;
      const len = 42 + (G.mode === 'play' ? worldSpd() * 95 : 32) + G.combo * 2;
      ctx.strokeStyle = rgba(i % 2 ? MAG : VIO, 0.07 + (isDense() ? 0.04 : 0));
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(vpX + Math.sin(a) * len * 4.1, vpY + Math.cos(a) * len * 0.82 + 78);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      const a = clamp(s.t / 0.18, 0, 1);
      ctx.fillStyle = rgba(VIO, 0.09 * a);
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 16, 10, 0, 0, TAU);
      ctx.fill();
    }
  }

  function scOf(en) {
    return Math.min(175, Math.max(4, (FOCAL / Math.max(0.06, en.z)) * 30));
  }

  function drawShadow(en, sc) {
    const gnd = P4;
    project(en.x, 0, en.z, gnd);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(gnd.x, gnd.y, sc * 0.46, sc * 0.14, 0, 0, TAU);
    ctx.fill();
  }

  function drawTree(p, sc, flash) {
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#5a3418';
    ctx.fillRect(p.x - sc * 0.1, p.y - sc * 1.2, sc * 0.2, sc * 1.2);
    ctx.fillStyle = flash ? rgba(MINT, 1) : '#1c7a52';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sc * 2.5);
    ctx.lineTo(p.x + sc * 0.9, p.y - sc * 0.78);
    ctx.lineTo(p.x - sc * 0.9, p.y - sc * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = flash ? rgba(WHT, 0.8) : '#4ad898';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sc * 2.28);
    ctx.lineTo(p.x + sc * 0.48, p.y - sc * 1.12);
    ctx.lineTo(p.x - sc * 0.48, p.y - sc * 1.12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.85);
    ctx.beginPath();
    ctx.arc(p.x + sc * 0.18, p.y - sc * 1.55, sc * 0.1, 0, TAU);
    ctx.fill();
  }

  function drawMush(p, sc, flash) {
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#efe0c8';
    ctx.fillRect(p.x - sc * 0.13, p.y - sc * 0.92, sc * 0.26, sc * 0.92);
    ctx.fillStyle = flash ? rgba(WHT, 1) : rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - sc * 0.95, sc * 0.78, sc * 0.42, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(p.x - sc * 0.26, p.y - sc * 1.05, sc * 0.11, 0, TAU);
    ctx.arc(p.x + sc * 0.2, p.y - sc * 0.96, sc * 0.09, 0, TAU);
    ctx.arc(p.x + sc * 0.02, p.y - sc * 1.18, sc * 0.07, 0, TAU);
    ctx.fill();
  }

  function drawTotem(p, sc, flash) {
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#6a4a88';
    ctx.fillRect(p.x - sc * 0.22, p.y - sc * 2.55, sc * 0.44, sc * 2.55);
    ctx.fillStyle = '#8a6aa8';
    ctx.fillRect(p.x - sc * 0.36, p.y - sc * 2.78, sc * 0.72, sc * 0.3);
    ctx.fillRect(p.x - sc * 0.3, p.y - sc * 0.18, sc * 0.6, sc * 0.18);
    ctx.fillStyle = rgba(MAG, flash ? 1 : 0.85);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - sc * 2.05, sc * 0.16, sc * 0.12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y - sc * 1.45, sc * 0.08, 0, TAU);
    ctx.fill();
  }

  function drawSpore(p, sc, t) {
    const pulse = 0.85 + Math.sin(t * 9) * 0.15;
    ctx.fillStyle = rgba(PNK, 0.45);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sc * 0.58 * pulse, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sc * 0.38 * pulse, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.beginPath();
    ctx.arc(p.x - sc * 0.1, p.y - sc * 0.1, sc * 0.1, 0, TAU);
    ctx.fill();
  }

  function drawHop(p, sc, t) {
    const hop = Math.abs(Math.sin(t * 8)) * sc * 0.08;
    ctx.fillStyle = '#efe0c8';
    ctx.fillRect(p.x - sc * 0.12, p.y - sc * 0.35 + hop, sc * 0.24, sc * 0.4);
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - sc * 0.42 + hop, sc * 0.5, sc * 0.28, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(p.x - sc * 0.12, p.y - sc * 0.18 + hop, sc * 0.07, 0, TAU);
    ctx.arc(p.x + sc * 0.12, p.y - sc * 0.18 + hop, sc * 0.07, 0, TAU);
    ctx.fill();
  }

  function drawEye(p, sc) {
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, sc * 0.5, sc * 0.38, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0810';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, sc * 0.22, sc * 0.28, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sc * 0.12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x - sc * 0.04, p.y - sc * 0.04, sc * 0.05, 0, TAU);
    ctx.fill();
  }

  function drawWyrm(p, sc, t, bank) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(bank * 0.28);
    const flap = Math.sin(t * 10) * 0.14;
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -sc * 0.72);
    ctx.lineTo(sc * 0.36, sc * 0.22);
    ctx.lineTo(0, sc * 0.58);
    ctx.lineTo(-sc * 0.36, sc * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(VIO, 0.9);
    ctx.beginPath();
    ctx.moveTo(-sc * 0.12, 0);
    ctx.lineTo(-sc * (1.15 + flap), sc * 0.18);
    ctx.lineTo(-sc * 0.1, sc * 0.28);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sc * 0.12, 0);
    ctx.lineTo(sc * (1.15 + flap), sc * 0.18);
    ctx.lineTo(sc * 0.1, sc * 0.28);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(-sc * 0.1, -sc * 0.28, sc * 0.08, 0, TAU);
    ctx.arc(sc * 0.1, -sc * 0.28, sc * 0.08, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBoss(p, sc, t, form) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const flap = Math.sin(t * 6) * 0.16;
    if (form === 'cap') {
      ctx.fillStyle = rgba(MAG, 0.28);
      ctx.beginPath();
      ctx.arc(0, 0, sc * 1.1, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#efe0c8';
      ctx.fillRect(-sc * 0.22, -sc * 0.2, sc * 0.44, sc * 1.05);
      ctx.fillStyle = rgba(MAG, 0.96);
      ctx.beginPath();
      ctx.ellipse(0, -sc * 0.28, sc * 1.05, sc * 0.62, 0, Math.PI, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(-sc * 0.4, -sc * 0.42, sc * 0.16, 0, TAU);
      ctx.arc(sc * 0.35, -sc * 0.28, sc * 0.14, 0, TAU);
      ctx.arc(0, -sc * 0.55, sc * 0.12, 0, TAU);
      ctx.fill();
    } else if (form === 'iris') {
      ctx.fillStyle = rgba(PNK, 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, sc * 1.15, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(PNK, 0.96);
      ctx.beginPath();
      ctx.ellipse(0, 0, sc * 0.95, sc * 0.72, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#140810';
      ctx.beginPath();
      ctx.ellipse(0, 0, sc * 0.38, sc * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.arc(0, 0, sc * 0.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-sc * 0.08, -sc * 0.08, sc * 0.08, 0, TAU);
      ctx.fill();
    } else if (form === 'twin') {
      ctx.fillStyle = rgba(MAG, 0.28);
      ctx.beginPath();
      ctx.arc(0, sc * 0.1, sc * 1.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.moveTo(-sc * 0.55, -sc * 0.85);
      ctx.lineTo(-sc * 0.1, sc * 0.2);
      ctx.lineTo(-sc * 0.45, sc * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sc * 0.55, -sc * 0.85);
      ctx.lineTo(sc * 0.1, sc * 0.2);
      ctx.lineTo(sc * 0.45, sc * 0.55);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(VIO, 0.9);
      ctx.beginPath();
      ctx.moveTo(-sc * 0.2, 0);
      ctx.lineTo(-sc * (1.45 + flap), sc * 0.2);
      ctx.lineTo(-sc * 0.15, sc * 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sc * 0.2, 0);
      ctx.lineTo(sc * (1.45 + flap), sc * 0.2);
      ctx.lineTo(sc * 0.15, sc * 0.4);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.arc(-sc * 0.42, -sc * 0.55, sc * 0.1, 0, TAU);
      ctx.arc(sc * 0.42, -sc * 0.55, sc * 0.1, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(VIO, 0.32);
      ctx.beginPath();
      ctx.arc(0, 0, sc * 1.28, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.96);
      ctx.beginPath();
      ctx.moveTo(0, -sc * 0.95);
      ctx.lineTo(sc * 0.58, sc * 0.28);
      ctx.lineTo(0, sc * 1.1);
      ctx.lineTo(-sc * 0.58, sc * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(VIO, 0.92);
      ctx.beginPath();
      ctx.moveTo(-sc * 0.22, -0.05 * sc);
      ctx.lineTo(-sc * (1.55 + flap), -sc * 0.18);
      ctx.lineTo(-sc * 0.28, sc * 0.38);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sc * 0.22, -0.05 * sc);
      ctx.lineTo(sc * (1.55 + flap), -sc * 0.18);
      ctx.lineTo(sc * 0.28, sc * 0.38);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.arc(-sc * 0.18, -sc * 0.32, sc * 0.11, 0, TAU);
      ctx.arc(sc * 0.18, -sc * 0.32, sc * 0.11, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEshot(p, sc) {
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sc * 0.38);
    ctx.lineTo(p.x + sc * 0.2, p.y);
    ctx.lineTo(p.x, p.y + sc * 0.38);
    ctx.lineTo(p.x - sc * 0.2, p.y);
    ctx.closePath();
    ctx.fill();
  }

  function drawRider(x, y, bank, alpha, muzzle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bank * 0.4);
    ctx.scale(1.12, 1.12);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 18, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(VIO, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 10, 16, 5.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.beginPath();
    ctx.moveTo(-16, 8);
    ctx.lineTo(-5, 4);
    ctx.lineTo(-7, 12);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, 8);
    ctx.lineTo(5, 4);
    ctx.lineTo(7, 12);
    ctx.closePath();
    ctx.fill();
    const flame = 6 + Math.sin(G.t * 28) * 3;
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.moveTo(-4, 12);
    ctx.lineTo(0, 12 + flame);
    ctx.lineTo(4, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.fillRect(-5, -2, 4, 10);
    ctx.fillRect(1, -2, 4, 10);
    ctx.fillStyle = rgba(MAG, 1);
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(8, -4);
    ctx.lineTo(6, 8);
    ctx.lineTo(-6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.92);
    ctx.beginPath();
    ctx.arc(0, -12, 6.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(VIO, 0.95);
    ctx.beginPath();
    ctx.arc(0, -13, 4.4, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-2.2, -22, 4.4, 14);
    ctx.beginPath();
    ctx.moveTo(-4, -22);
    ctx.lineTo(0, -30);
    ctx.lineTo(4, -22);
    ctx.closePath();
    ctx.fill();
    if (muzzle) {
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.arc(0, -32, 7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(0, -36, 3.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShot(sh) {
    project(sh.x, sh.y, sh.z, P);
    const sc = Math.min(28, (FOCAL / Math.max(0.08, sh.z)) * 10);
    ctx.save();
    ctx.strokeStyle = rgba(GOLD, 0.92);
    ctx.lineWidth = Math.max(1.4, sc * 0.2);
    ctx.beginPath();
    project(sh.x, sh.y, sh.z + 0.05, P2);
    ctx.moveTo(P2.x, P2.y);
    ctx.lineTo(P.x, P.y);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(P.x, P.y, Math.max(1.6, sc * 0.16), 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnt(en) {
    const flash = en.flash > 0;
    if (en.ground) {
      project(en.x, 0, en.z, P);
      const sc = scOf(en);
      drawShadow(en, sc);
      if (en.kind === 'tree') drawTree(P, sc, flash);
      else if (en.kind === 'mush') drawMush(P, sc, flash);
      else if (en.kind === 'totem') drawTotem(P, sc, flash);
      return;
    }
    project(en.x, en.y, en.z, P);
    const sc = scOf(en);
    drawShadow(en, sc);
    if (flash) {
      ctx.save();
      ctx.globalAlpha = 0.85;
    }
    if (en.kind === 'spore') drawSpore(P, sc, en.t);
    else if (en.kind === 'hop') drawHop(P, sc, en.t);
    else if (en.kind === 'eye') drawEye(P, sc);
    else if (en.kind === 'wyrm') drawWyrm(P, sc, en.t, (en.x - G.px) * 1.2);
    else if (en.kind === 'eshot') drawEshot(P, sc);
    else if (en.kind === 'boss') drawBoss(P, sc, en.t, en.form);
    if (flash) ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.4), 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4;
      const r = s.rad * (0.3 + s.t * 1.6);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * TAU + s.t;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + Math.cos(ang) * r, s.y + Math.sin(ang) * r);
      }
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * (0.4 + r.t * 2.2), 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = '700 ' + f.size + 'px "Segoe UI", sans-serif';
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function drawHudCanvas() {
    if (G.mode !== 'play' || !G.bossOn) return;
    const t = clamp(G.bossHp / Math.max(1, G.bossMax), 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.fillRect(VW * 0.22, 14, VW * 0.56, 10);
    ctx.fillStyle = rgba(MAG, 0.92);
    ctx.fillRect(VW * 0.22, 14, VW * 0.56 * t, 10);
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.strokeRect(VW * 0.22, 14, VW * 0.56, 10);
  }

  function draw() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pw = stageEl ? stageEl.clientWidth : 800;
    const ph = stageEl ? stageEl.clientHeight : 450;
    if (pw !== W || ph !== H || canvas.width !== (pw * dpr | 0)) resize();

    const pal = palette();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = rgba(pal.skyTop, 1);
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake : 0;
    const shy = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake * 0.55 : 0;
    ctx.save();
    ctx.translate(ox + shx, oy + shy);
    ctx.scale(scale * G.punch, scale * G.punch);
    if (G.punch !== 1) {
      ctx.translate(CX * (1 / G.punch - 1) * 0.5, VH * (1 / G.punch - 1) * 0.5);
    }
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    drawSky(pal);
    drawGround(pal);
    drawSmear();

    const list = G.ents.slice();
    list.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < list.length; i++) drawEnt(list[i]);
    for (let i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    const ps = playerScreen();
    if (!REDUCE) {
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        drawRider(g.x, g.y, g.bank, 0.12 * (g.t / 0.16), false);
      }
    }
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (G.deadT <= 0 && !(blink && G.mode === 'play')) {
      drawRider(ps.x, ps.y, G.bank, 1, G.muzzle > 0);
    }

    drawFx();
    drawHudCanvas();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(0, 0, VW, VH);
    }
    ctx.restore();
  }

  function resize() {
    if (!stageEl) return;
    W = Math.max(1, stageEl.clientWidth);
    H = Math.max(1, stageEl.clientHeight);
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerVirtX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerVirtY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      e.preventDefault();
      if (down && !e.repeat) toggleAuto();
      return;
    }
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

    if (!autoOn) {
      if (k === 'ArrowLeft' || k === 'Left') {
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
    } else if (!down) {
      if (k === 'ArrowLeft' || k === 'Left') keys.l = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = false;
      if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = false;
      if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = false;
    }

    if (down && (isMove || space || k === 'Enter')) e.preventDefault();
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
    if (autoOn) return;
    if (k === '1') {
      startGame('plain');
      return;
    }
    if (k === '2') {
      startGame('dense');
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
      if (autoOn) return;
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (autoOn) return;
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      if (!autoOn) G.fireHold = false;
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

  seedStars();
  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();

  if (btnPlain) {
    btnPlain.addEventListener('click', function () {
      audio.ensure();
      startGame('plain');
    });
  }
  if (btnDense) {
    btnDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'plain');
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
  if (btnAuto) btnAuto.addEventListener('click', toggleAuto);
  if (speedEl) {
    const onSpeed = function () { setAutoSpeed(speedEl.value); };
    speedEl.addEventListener('input', onSpeed);
    speedEl.addEventListener('change', onSpeed);
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
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
