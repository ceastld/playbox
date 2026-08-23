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
  const LIFE_EVERY = 11000;
  const COMBO_WIN = 1.38;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-night-striker-best';
  const MUTE_KEY = 'playbox-night-striker-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 74, 210];
  const VIO = [196, 106, 255];
  const GOLD = [255, 227, 107];
  const WHT = [244, 236, 255];
  const CYN = [0, 240, 255];
  const PNK = [255, 154, 220];
  const RED = [255, 72, 96];
  const ORG = [255, 150, 70];

  const STAGES = [
    { name: '夜巷', tag: 'ALLEY', len: 5.0, theme: 'alley', boss: 'van', bossName: '巷甲', hp: 14, hpD: 20, score: 1800 },
    { name: '隧核', tag: 'SHAFT', len: 5.4, theme: 'shaft', boss: 'crawler', bossName: '隧蛛', hp: 18, hpD: 26, score: 2400 },
    { name: '高架', tag: 'SPAN', len: 5.8, theme: 'span', boss: 'cannon', bossName: '架炮', hp: 22, hpD: 30, score: 3000 },
    { name: '巷核', tag: 'CORE', len: 6.4, theme: 'core', boss: 'core', bossName: '巷核', hp: 30, hpD: 40, score: 4500 }
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
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const wpnEl = document.getElementById('wpn-label');
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
    py: 0.28,
    visX: 0,
    visY: 0.28,
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
    flashRgb: CYN,
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
    clearT: 0,
    power: 0
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
  function powered() {
    return G.power > 0 || G.combo >= 8;
  }

  function worldSpd() {
    const base = isDense() ? 0.50 : 0.42;
    const rush = G.combo >= 12 ? 0.07 : G.combo >= 6 ? 0.04 : 0;
    return base + rush + G.stageI * 0.018;
  }
  function plySpd() {
    return isDense() ? 1.96 : 1.72;
  }
  function fireGap() {
    if (powered()) return isDense() ? 0.068 : 0.082;
    return isDense() ? 0.078 : 0.095;
  }
  function tunnelHalf() {
    if (stageDef().theme !== 'shaft') return 1.2;
    const t = clamp(G.stageDist / Math.max(0.2, stageDef().len), 0, 1);
    const tight = isDense() ? 0.62 : 0.72;
    return lerp(0.90, tight, t * 0.85);
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
      this.beep(720, 0.042, 'square', 0.026, 1640);
      this.beep(240, 0.032, 'sawtooth', 0.014, 90);
    },
    metal() {
      this.ensure();
      this.noise(0.05, 0.04, 680);
      this.beep(180, 0.08, 'triangle', 0.036, 70);
    },
    glass() {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.034, 1480);
      this.noise(0.04, 0.028, 1600);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.6, combo * 0.042);
      this.noise(0.038, 0.032, 1200);
      this.beep(540 * lift, 0.062, 'square', 0.044, 1080 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.09, big ? 0.078 : 0.044, big ? 240 : 500);
      this.beep(big ? 140 : 240, big ? 0.26 : 0.12, 'sawtooth', 0.05, 48);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.07, 'sine', 0.038, 588 * m);
      this.beep(523 * m, 0.1, 'triangle', 0.032, 784 * m);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.062, 280);
      this.beep(220, 0.22, 'sawtooth', 0.055, 58);
      this.beep(110, 0.34, 'sine', 0.042, 36);
    },
    stage() {
      this.ensure();
      this.beep(494, 0.08, 'square', 0.042, 659);
      this.beep(659, 0.1, 'triangle', 0.04, 880);
      this.beep(988, 0.16, 'sine', 0.046, 1318);
    },
    boss() {
      this.ensure();
      this.beep(88, 0.24, 'sawtooth', 0.058, 52);
      this.beep(132, 0.32, 'square', 0.038, 74);
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
    },
    orb() {
      this.ensure();
      this.beep(740, 0.08, 'sine', 0.04, 1180);
      this.beep(1180, 0.12, 'triangle', 0.036, 1560);
    }
  };

  function project(wx, wy, wz, out) {
    const z = wz < 0.05 ? 0.05 : wz;
    const s = FOCAL / z;
    const camX = G.visX * 0.16;
    const camY = 0.07 + G.visY * 0.03;
    out.x = CX + (wx - camX) * s * CX;
    out.y = HORIZON - (wy - camY) * s * VH * 0.5;
    out.s = s;
    out.z = z;
  }

  function playerScreen() {
    return {
      x: CX + G.visX * (CX - 52),
      y: (HORIZON + 58) + (1 - G.visY) * (VH - HORIZON - 104)
    };
  }

  function palette() {
    const th = stageDef().theme;
    if (th === 'shaft') {
      return {
        skyTop: [8, 6, 10], skyHor: [28, 18, 12], skyLow: [16, 10, 8],
        roadA: [22, 16, 12], roadB: [32, 22, 14], wall: [28, 18, 10],
        sun: GOLD, fog: [255, 180, 70], neon: [255, 196, 64]
      };
    }
    if (th === 'span') {
      return {
        skyTop: [8, 6, 22], skyHor: [22, 14, 48], skyLow: [12, 8, 28],
        roadA: [18, 16, 32], roadB: [28, 22, 48], wall: [16, 12, 36],
        sun: VIO, fog: [140, 90, 255], neon: CYN
      };
    }
    if (th === 'core') {
      return {
        skyTop: [10, 2, 14], skyHor: [42, 8, 36], skyLow: [18, 4, 20],
        roadA: [24, 8, 22], roadB: [40, 10, 32], wall: [28, 6, 24],
        sun: MAG, fog: [255, 70, 160], neon: MAG
      };
    }
    return {
      skyTop: [8, 4, 20], skyHor: [28, 12, 52], skyLow: [12, 6, 24],
      roadA: [16, 12, 28], roadB: [26, 18, 42], wall: [18, 10, 34],
      sun: CYN, fog: [90, 200, 255], neon: CYN
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
      tagLabel.textContent = isDense() ? '夜核' : '夜袭';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', G.bossOn);
    }
    if (wpnEl) {
      const hot = powered();
      wpnEl.textContent = G.power > 0 ? '四核' : (G.combo >= 8 ? '三管' : '双管');
      wpnEl.classList.toggle('hot', hot);
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
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('巷核打穿 · R 再来一局', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 撞车灯或中弹扣一命', 'warn');
    else if (G.bossOn) setHint('头目 · 扫射 ' + st.bossName, 'hot');
    else if (st.theme === 'shaft') setHint('隧核收窄 · 别蹭墙 · 空格开火', G.lives === 1 ? 'warn' : '');
    else if (G.lives === 1) setHint('最后一命 · 飞高可越过矮障', 'warn');
    else setHint('方向移动 · 空格开火 · 飞高越过矮障', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'CRASH' : 'NSTR';
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
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(6, HORIZON - 8),
        r: rand(0.5, 1.7),
        a: rand(0.18, 0.82),
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
      form: '',
      drop: false
    };
    if (extra) {
      const ks = Object.keys(extra);
      for (let i = 0; i < ks.length; i++) en[ks[i]] = extra[ks[i]];
    }
    G.ents.push(en);
    capArr(G.ents, 58);
    return en;
  }

  function spawnCar(x) {
    mkEnt('car', x, 0, { ground: true, h: 0.24, hitR: 0.12, r: 0.13, score: 70 });
  }
  function spawnLamp(x) {
    mkEnt('lamp', x, 0, { ground: true, h: 0.74, hitR: 0.09, r: 0.1, hp: 2, score: 90 });
  }
  function spawnBarr(x) {
    mkEnt('barr', x, 0, { ground: true, h: 0.18, hitR: 0.13, r: 0.14, score: 60 });
  }
  function spawnDrone(x, y) {
    mkEnt('drone', x, y == null ? rand(0.28, 0.7) : y, {
      r: 0.1, hitR: 0.1, score: 120, hp: 2, shotCd: rand(0.5, 1.1)
    });
  }
  function spawnHeli(x, y) {
    mkEnt('heli', x, y == null ? rand(0.34, 0.72) : y, {
      r: 0.14, hitR: 0.13, score: 200, hp: 2, drop: Math.random() < 0.34
    });
  }
  function spawnTank(x) {
    mkEnt('tank', x, 0, {
      ground: true, h: 0.32, hitR: 0.13, r: 0.14, hp: 2, score: 150,
      shotCd: rand(0.55, 1.15), drop: Math.random() < 0.28
    });
  }
  function spawnOrb(x, y, z) {
    mkEnt('orb', x, y, {
      z: z, r: 0.08, hitR: 0.1, score: 200, shootable: false, solid: false, ground: false
    });
  }
  function spawnEshot(x, y, z, hx, hy) {
    mkEnt('eshot', x, y, {
      z: z, shootable: false, r: 0.05, hitR: 0.055, score: 0,
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
    mkEnt('boss', 0, 0.36, {
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
    return rand(0.22, 0.7);
  }

  function pickSpawn() {
    const th = stageDef().theme;
    const x = threatX();
    const x2 = clamp(x + rand(0.22, 0.42) * (Math.random() < 0.5 ? 1 : -1), -0.86, 0.86);
    if (th === 'alley') {
      const r = Math.random();
      if (r < 0.32) { spawnCar(x); if (Math.random() < 0.5) spawnCar(x2); }
      else if (r < 0.52) spawnLamp(x);
      else if (r < 0.7) spawnBarr(x);
      else if (r < 0.88) spawnDrone(x, threatY());
      else spawnTank(x);
      return;
    }
    if (th === 'shaft') {
      const r = Math.random();
      if (r < 0.28) spawnBarr(x);
      else if (r < 0.48) spawnCar(x);
      else if (r < 0.7) spawnDrone(x, threatY());
      else if (r < 0.86) spawnLamp(x);
      else spawnTank(x);
      return;
    }
    if (th === 'span') {
      const r = Math.random();
      if (r < 0.22) spawnCar(x);
      else if (r < 0.4) spawnBarr(x);
      else if (r < 0.6) spawnHeli(x, threatY());
      else if (r < 0.78) spawnDrone(x, threatY());
      else spawnTank(x);
      return;
    }
    const r = Math.random();
    if (r < 0.16) spawnLamp(x);
    else if (r < 0.3) spawnCar(x);
    else if (r < 0.42) spawnBarr(x);
    else if (r < 0.6) spawnHeli(x, threatY());
    else if (r < 0.76) spawnDrone(x, threatY());
    else if (r < 0.9) spawnTank(x);
    else spawnDrone(x2, threatY());
  }

  function spawnInterval() {
    let base = G.bossOn ? 0.62 : 0.38;
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
    if (G.combo === 8) toast('三管解锁', false, true);
    if (G.combo === 16) toast('连击 ×16 · 夜核', false, true);
  }

  function killRgb(en) {
    if (en.kind === 'car' || en.form === 'van') return MAG;
    if (en.kind === 'lamp') return GOLD;
    if (en.kind === 'barr') return CYN;
    if (en.kind === 'drone') return VIO;
    if (en.kind === 'heli') return PNK;
    if (en.kind === 'tank' || en.form === 'cannon') return ORG;
    if (en.kind === 'boss') return MAG;
    return CYN;
  }

  function maybeDrop(en) {
    if (!en.drop) return;
    spawnOrb(en.x, en.ground ? 0.28 : en.y, Math.max(0.18, en.z));
  }

  function killEnt(en) {
    project(en.ground ? en.x : en.x, en.ground ? 0 : en.y, en.z, P);
    const rgb = killRgb(en);
    const pow = en.kind === 'boss' ? 2.7 : en.kind === 'heli' ? 1.4 : 1;
    juice(P.x, P.y - (en.ground ? 18 : 0), rgb, pow);
    if (en.kind === 'car' || en.kind === 'tank') audio.metal();
    else if (en.kind === 'lamp') audio.glass();
    else audio.hit(G.combo + 1);
    audio.boom(en.kind === 'boss' || en.kind === 'heli' || en.kind === 'tank');
    hitStop(en.kind === 'boss' ? 0.078 : 0.042);
    const pts = (en.score || 50) * G.mult;
    floatText(P.x, P.y, '+' + pts, G.mult > 1 ? GOLD : WHT, G.mult > 1);
    bumpCombo();
    addScore(pts);
    maybeDrop(en);
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
    G.power = 0;
    G.px *= 0.35;
    G.py = lerp(G.py, 0.34, 0.45);
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
      toast('再冲', true, false);
    }
  }

  function grabOrb(en) {
    project(en.x, en.y, en.z, P);
    G.power = Math.max(G.power, 6.2);
    audio.orb();
    bumpCombo();
    const pts = 200 * G.mult;
    floatText(P.x, P.y, '核芯', GOLD, true);
    addScore(pts);
    juice(P.x, P.y, GOLD, 1.15);
    toast('四核 · 6 秒', false, true);
    hud();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.endT > 0) return;
    if (G.fireCd > 0) return;
    if (G.shots.length >= 24) return;
    G.fireCd = fireGap();
    G.muzzle = 0.07;
    const y = G.py + 0.04;
    G.shots.push({ x: G.px - 0.045, y: y, z: 0.14, vz: 2.08 });
    G.shots.push({ x: G.px + 0.045, y: y, z: 0.14, vz: 2.08 });
    if (G.combo >= 8) G.shots.push({ x: G.px, y: y + 0.02, z: 0.14, vz: 2.22 });
    if (G.power > 0) {
      G.shots.push({ x: G.px - 0.11, y: y, z: 0.14, vz: 2.0 });
      G.shots.push({ x: G.px + 0.11, y: y, z: 0.14, vz: 2.0 });
    }
    audio.shoot();
    if (REDUCE) return;
    const ps = playerScreen();
    emit(5, {
      x: ps.x, y: ps.y - 10, j: 4,
      vx0: -40, vx1: 40, vy0: -130, vy1: -24,
      r0: 1, r1: 2.2, life: 0.16, rgb: CYN, g: 0
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
    addScore(700);
    audio.stage();
    toast('下一关 · ' + stageDef().name, false, true);
    screenFlash(GOLD, 0.3);
    G.invuln = Math.max(G.invuln, 0.75);
    hud();
  }

  function finishWin() {
    const bonus = 2200 + G.lives * 380;
    G.score += bonus;
    maybeBest();
    G.mode = 'win';
    audio.win();
    const title = isDense() ? '夜核通关' : '巷核打穿';
    showOverlay('win', title, '夜巷打穿　·　' + (G.score | 0) + ' 分　·　最高连 ' + G.comboMax);
    hud();
  }

  function finishLose() {
    G.mode = 'lose';
    maybeBest();
    audio.lose();
    showOverlay('lose', '撞毁了', '冲到 ' + stageDef().name + '　·　' + (G.score | 0) + ' 分。撞物或中弹扣命。');
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
    G.py = 0.28;
    G.visX = 0;
    G.visY = 0.28;
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
    G.flashRgb = CYN;
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
    G.power = 0;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    hideOverlay();
    audio.start();
    toast(isDense() ? '夜核 · 更密更狠' : '夜袭 · 夜巷出发', false, true);
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
    G.py = 0.28;
    G.visX = 0;
    G.visY = 0.28;
    G.deadT = 0;
    G.invuln = 0;
    G.bossOn = false;
    G.bossDead = false;
    G.endT = 0;
    G.clearT = 0;
    G.power = 0;
    G.spawnT = 0.28;
    clearField();
    showOverlay('title', '夜袭', '冲进夜巷。开火扫车灯，撞了扣命。短关之后是头目。');
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

  function steerPlayer(dt) {
    let ax = 0;
    let ay = 0;
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (keys.u) ay += 1;
    if (keys.d) ay -= 1;
    const spd = plySpd();
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover) && G.mode === 'play') {
      const tx = clamp((pointer.x - CX) / (CX - 52), -1, 1);
      const ty = clamp(1 - (pointer.y - (HORIZON + 58)) / (VH - HORIZON - 104), 0.04, 0.92);
      G.px = lerp(G.px, tx, 1 - Math.exp(-dt * 11));
      G.py = lerp(G.py, ty, 1 - Math.exp(-dt * 11));
    } else if (G.mode === 'title') {
      G.px = Math.sin(G.t * 0.7) * 0.56;
      G.py = 0.28 + Math.sin(G.t * 0.92) * 0.18;
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
          r0: 1, r1: 2.4, life: 0.2, rgb: CYN, g: 80
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
    if (form === 'van') {
      const tz = 0.46 + Math.sin(en.t * 0.8) * 0.05;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.7));
      en.x = Math.sin(en.t * 1.05) * 0.58;
      en.y = 0.2 + Math.abs(Math.sin(en.t * 1.6)) * 0.16;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.62) {
        en.shotCd = isDense() ? 0.78 : 1.05;
        spawnEshot(en.x - 0.1, en.y, en.z - 0.02, (G.px - en.x) * 0.34, (G.py - en.y) * 0.26);
        spawnEshot(en.x + 0.1, en.y, en.z - 0.02, (G.px - en.x) * 0.34, (G.py - en.y) * 0.26);
      }
    } else if (form === 'crawler') {
      const tz = 0.44 + Math.sin(en.t * 0.65) * 0.04;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.5));
      en.x = Math.sin(en.t * 1.35) * 0.64;
      en.y = 0.34 + Math.sin(en.t * 2.1) * 0.22;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.62) {
        en.shotCd = isDense() ? 0.68 : 0.9;
        spawnEshot(en.x, en.y, en.z - 0.02, (G.px - en.x) * 0.4, (G.py - en.y) * 0.32);
        spawnEshot(en.x + 0.16, en.y - 0.08, en.z - 0.02, 0.12, -0.04);
        spawnEshot(en.x - 0.16, en.y - 0.08, en.z - 0.02, -0.12, -0.04);
      }
    } else if (form === 'cannon') {
      const tz = 0.42 + Math.sin(en.t * 0.9) * 0.05;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.6));
      en.x = lerp(en.x, G.px * 0.72, dt * 0.78);
      en.y = 0.32 + Math.sin(en.t * 1.15) * 0.18;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.64) {
        en.shotCd = isDense() ? 0.6 : 0.82;
        spawnEshot(en.x, en.y, en.z - 0.02, (G.px - en.x) * 0.42, (G.py - en.y) * 0.34);
        spawnEshot(en.x - 0.08, en.y + 0.06, en.z - 0.02, (G.px - en.x) * 0.3 - 0.08, (G.py - en.y) * 0.24);
        spawnEshot(en.x + 0.08, en.y + 0.06, en.z - 0.02, (G.px - en.x) * 0.3 + 0.08, (G.py - en.y) * 0.24);
      }
    } else {
      const tz = 0.4 + Math.sin(en.t * 0.7) * 0.04;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.4));
      en.x = Math.sin(en.t * 0.95) * 0.55;
      en.y = 0.38 + Math.sin(en.t * 1.15) * 0.18;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.62) {
        en.shotCd = isDense() ? 0.56 : 0.76;
        const n = isDense() ? 5 : 4;
        for (let k = 0; k < n; k++) {
          const a = (k - (n - 1) * 0.5) * 0.12;
          spawnEshot(en.x + a * 0.4, en.y, en.z - 0.02, (G.px - en.x) * 0.34 + a, (G.py - en.y) * 0.26);
        }
        if (Math.random() < 0.3) spawnDrone(rand(-0.7, 0.7), rand(0.28, 0.62));
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
      } else if (en.kind === 'orb') {
        en.z -= spd * 0.72 * dt;
        en.y += Math.sin(en.t * 4.2) * 0.08 * dt;
      } else {
        en.z -= spd * dt;
        if (en.kind === 'drone') {
          en.x += Math.sin(en.t * 2.2 * en.wob + en.phase) * 0.22 * dt;
          en.y += Math.cos(en.t * 1.6 + en.phase) * 0.1 * dt;
          en.shotCd -= dt;
          if (playing && en.shotCd <= 0 && en.z < 0.7 && en.z > 0.22) {
            en.shotCd = isDense() ? 1.05 : 1.38;
            spawnEshot(en.x, en.y, en.z, (G.px - en.x) * 0.4, (G.py - en.y) * 0.3);
          }
        } else if (en.kind === 'heli') {
          if (en.z < 0.6) {
            en.x = lerp(en.x, G.px, dt * 1.45);
            en.y = lerp(en.y, G.py, dt * 1.15);
            en.z -= spd * 0.38 * dt;
          } else {
            en.x += Math.sin(en.t * 1.4 + en.phase) * 0.18 * dt;
          }
        } else if (en.kind === 'tank') {
          en.shotCd -= dt;
          if (playing && en.shotCd <= 0 && en.z < 0.68 && en.z > 0.22) {
            en.shotCd = isDense() ? 1.12 : 1.46;
            spawnEshot(en.x, 0.28, en.z, (G.px - en.x) * 0.36, (G.py - 0.28) * 0.28);
          }
        } else if (en.kind === 'car') {
          en.x += Math.sin(en.t * 1.1 + en.phase) * 0.08 * dt;
        }
      }
      en.x = clamp(en.x, -1.05, 1.05);
      en.y = clamp(en.y, en.ground ? 0 : 0.02, 0.95);

      if (en.z < 0.045 || en.z > 1.28) {
        G.ents.splice(i, 1);
        continue;
      }

      if (en.kind === 'orb' && en.z < 0.22 && en.z > 0.06 && playing && G.deadT <= 0) {
        if (hypot(en.x - G.px, (en.y - G.py) * 0.7) < 0.18) {
          grabOrb(en);
          G.ents.splice(i, 1);
          continue;
        }
      }

      if (en.z < 0.18 && en.z > 0.05 && canHurt && playing && G.deadT <= 0 && en.solid) {
        const dx = en.x - G.px;
        let hit;
        if (en.ground) {
          hit = G.py <= en.h + 0.05 && Math.abs(dx) < en.hitR + 0.1;
        } else {
          hit = hypot(dx, (en.y - G.py) * 0.75) < (en.hitR + 0.1);
        }
        if (hit) {
          playerHit();
          if (en.kind === 'eshot') G.ents.splice(i, 1);
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
      if (Math.random() < 0.45) spawnCar(rand(-0.8, 0.8));
      else if (Math.random() < 0.55) spawnLamp(rand(-0.82, 0.82));
      else spawnBarr(rand(-0.7, 0.7));
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

  function checkTunnelWall() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    if (stageDef().theme !== 'shaft') return;
    const half = tunnelHalf();
    if (Math.abs(G.px) > half) playerHit();
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }
    if (G.mode === 'play' || G.mode === 'title') {
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
        if (G.power > 0) G.power -= dt;
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
        checkTunnelWall();
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

    const sx = CX + 210 - G.visX * 22;
    ctx.fillStyle = rgba(pal.sun, 0.16);
    ctx.beginPath();
    ctx.arc(sx, 52, 36, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(pal.sun, 0.9);
    ctx.beginPath();
    ctx.arc(sx, 52, 16, 0, TAU);
    ctx.fill();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(G.t * 2.2 + s.tw));
      ctx.fillStyle = rgba(WHT, s.a * tw);
      ctx.fillRect(s.x - G.visX * 6, s.y, s.r, s.r);
    }

    const th = stageDef().theme;
    if (th !== 'shaft') {
      const hillY = HORIZON + 4;
      ctx.beginPath();
      ctx.moveTo(0, hillY);
      for (let i = 0; i <= 20; i++) {
        const hx = (i / 20) * VW;
        const n = hash2((i + G.stageI * 13 + 7) * 19);
        const h = 18 + n * 78;
        ctx.lineTo(hx - G.visX * 28, hillY - h);
      }
      ctx.lineTo(VW, hillY);
      ctx.closePath();
      ctx.fillStyle = rgba(pal.wall, 1);
      ctx.fill();
      for (let i = 0; i < 18; i++) {
        const n = hash2(i * 31 + G.stageI * 5);
        const bx = ((i / 18) * VW - G.visX * 24 + G.dist * 8) % VW;
        const bh = 22 + n * 54;
        const bw = 10 + n * 16;
        ctx.fillStyle = rgba(n > 0.5 ? pal.skyHor : pal.wall, 0.85);
        ctx.fillRect(bx, hillY - bh, bw, bh);
        if (n > 0.35) {
          ctx.fillStyle = rgba(n > 0.7 ? GOLD : CYN, 0.35 + 0.25 * Math.abs(Math.sin(G.t * 2 + i)));
          ctx.fillRect(bx + 2, hillY - bh + 4, 2, 3);
          ctx.fillRect(bx + bw - 4, hillY - bh + 10, 2, 3);
        }
      }
    }
  }

  function drawRoad(pal) {
    const tz = 0.07;
    const scroll = G.dist % tz;
    const half = 0.86;
    for (let i = 22; i >= 0; i--) {
      const z0 = 0.08 + i * tz - scroll;
      const z1 = z0 + tz;
      if (z1 < 0.07 || z0 > 1.22) continue;
      const fog = clamp((z0 - 0.08) / 1.05, 0, 1);
      const check = i & 1;
      const col = check ? pal.roadA : pal.roadB;
      const mix = [
        (col[0] + pal.skyHor[0] * fog * 0.38) | 0,
        (col[1] + pal.skyHor[1] * fog * 0.38) | 0,
        (col[2] + pal.skyHor[2] * fog * 0.38) | 0
      ];
      project(-half, 0, Math.max(0.06, z0), P);
      project(half, 0, Math.max(0.06, z0), P2);
      project(half, 0, z1, P3);
      project(-half, 0, z1, P4);
      quad(P.x, P.y, P2.x, P2.y, P3.x, P3.y, P4.x, P4.y, mix, 1);

      project(-1.4, 0, Math.max(0.06, z0), P);
      project(-half, 0, Math.max(0.06, z0), P2);
      project(-half, 0, z1, P3);
      project(-1.4, 0, z1, P4);
      quad(P.x, P.y, P2.x, P2.y, P3.x, P3.y, P4.x, P4.y, pal.wall, 0.92);

      project(half, 0, Math.max(0.06, z0), P);
      project(1.4, 0, Math.max(0.06, z0), P2);
      project(1.4, 0, z1, P3);
      project(half, 0, z1, P4);
      quad(P.x, P.y, P2.x, P2.y, P3.x, P3.y, P4.x, P4.y, pal.wall, 0.92);
    }

    ctx.lineCap = 'butt';
    for (let k = -1; k <= 1; k += 2) {
      project(k * 0.82, 0, 1.12, P);
      project(k * 0.82, 0, 0.08, P2);
      ctx.strokeStyle = rgba(pal.neon, 0.55);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P2.x, P2.y);
      ctx.stroke();
    }

    const dash = 0.11;
    const dscroll = G.dist % dash;
    ctx.strokeStyle = rgba(CYN, 0.72);
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 16; i++) {
      const z0 = 0.1 + i * dash - dscroll;
      const z1 = z0 + dash * 0.46;
      if (z0 < 0.08 || z1 > 1.1) continue;
      project(0, 0, z0, P);
      project(0, 0, z1, P2);
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P2.x, P2.y);
      ctx.stroke();
    }
  }

  function drawBuildings(pal) {
    const th = stageDef().theme;
    if (th === 'shaft') return;
    const tz = 0.16;
    const scroll = G.dist % tz;
    for (let i = 10; i >= 0; i--) {
      const z0 = 0.18 + i * tz - scroll;
      const z1 = z0 + tz * 0.86;
      if (z1 < 0.12 || z0 > 1.05) continue;
      const fog = clamp((z0 - 0.1) / 1.0, 0, 1);
      const n = hash2((i + ((G.dist / tz) | 0) + G.stageI * 9) * 13);
      const h = 0.42 + n * 0.55;
      const col = [
        (pal.wall[0] * (1 - fog * 0.4) + pal.skyHor[0] * fog * 0.4) | 0,
        (pal.wall[1] * (1 - fog * 0.4) + pal.skyHor[1] * fog * 0.4) | 0,
        (pal.wall[2] * (1 - fog * 0.4) + pal.skyHor[2] * fog * 0.4) | 0
      ];
      for (let s = -1; s <= 1; s += 2) {
        const x0 = s * 0.92;
        const x1 = s * 1.38;
        project(x0, 0, z0, P);
        project(x1, 0, z0, P2);
        project(x1, h, z0, P3);
        project(x0, h, z0, P4);
        quad(P.x, P.y, P2.x, P2.y, P3.x, P3.y, P4.x, P4.y, col, 0.96);
        project(x0, 0, z1, P);
        project(x0, 0, z0, P2);
        project(x0, h, z0, P3);
        project(x0, h, z1, P4);
        const side = [
          Math.min(255, col[0] + 18),
          Math.min(255, col[1] + 10),
          Math.min(255, col[2] + 22)
        ];
        quad(P.x, P.y, P2.x, P2.y, P3.x, P3.y, P4.x, P4.y, side, 0.94);
        const lit = n > 0.32;
        if (lit) {
          const rows = 3 + ((n * 4) | 0);
          for (let r = 0; r < rows; r++) {
            const wy = 0.08 + r * (h - 0.12) / rows;
            project(x0 + s * 0.08, wy, z0 + 0.02, P);
            ctx.fillStyle = rgba((r + i) % 3 === 0 ? GOLD : pal.neon, 0.28 + 0.4 * Math.abs(Math.sin(G.t * 1.6 + r + i)));
            const wr = Math.max(1.2, (FOCAL / z0) * 3.2);
            ctx.fillRect(P.x - wr * 0.4, P.y - wr * 0.5, wr, wr * 0.7);
          }
        }
      }
    }
  }

  function drawTunnel(pal) {
    if (stageDef().theme !== 'shaft') return;
    const half = tunnelHalf();
    const tz = 0.09;
    const scroll = G.dist % tz;
    for (let i = 14; i >= 0; i--) {
      const z = 0.1 + i * tz - scroll;
      if (z < 0.08 || z > 1.08) continue;
      project(-half, 0, z, P);
      project(half, 0, z, P2);
      project(half, 0.82, z, P3);
      project(-half, 0.82, z, P4);
      const a = 0.08 + (1 - z) * 0.16;
      ctx.strokeStyle = rgba(pal.neon, a + 0.12);
      ctx.lineWidth = Math.max(1.2, (FOCAL / z) * 1.6);
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P2.x, P2.y);
      ctx.lineTo(P3.x, P3.y);
      ctx.lineTo(P4.x, P4.y);
      ctx.closePath();
      ctx.stroke();
      if (i % 2 === 0) {
        ctx.fillStyle = rgba(GOLD, 0.35 + 0.2 * Math.abs(Math.sin(G.t * 3 + i)));
        ctx.beginPath();
        ctx.arc(P.x, P.y - 8, Math.max(2, (FOCAL / z) * 4), 0, TAU);
        ctx.arc(P2.x, P2.y - 8, Math.max(2, (FOCAL / z) * 4), 0, TAU);
        ctx.fill();
      }
    }
    ctx.fillStyle = rgba(pal.wall, 0.22);
    project(-1.2, 0, 0.1, P);
    project(-half, 0, 0.1, P2);
    project(-half, 0.9, 0.1, P3);
    project(-1.2, 0.9, 0.1, P4);
    quad(P.x, P.y, P2.x, P2.y, P3.x, P3.y, P4.x, P4.y, pal.wall, 0.55);
    project(half, 0, 0.1, P);
    project(1.2, 0, 0.1, P2);
    project(1.2, 0.9, 0.1, P3);
    project(half, 0.9, 0.1, P4);
    quad(P.x, P.y, P2.x, P2.y, P3.x, P3.y, P4.x, P4.y, pal.wall, 0.55);
  }

  function drawSmear(pal) {
    if (REDUCE) return;
    const vpX = CX - G.visX * 20;
    const vpY = HORIZON;
    const n = 10 + Math.min(8, G.combo);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const a = -0.78 + (i / (n - 1)) * 1.56;
      const len = 42 + (G.mode === 'play' ? worldSpd() * 95 : 32) + G.combo * 2;
      ctx.strokeStyle = rgba(i % 2 ? pal.neon : CYN, 0.07 + (isDense() ? 0.04 : 0));
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
      ctx.fillStyle = rgba(CYN, 0.09 * a);
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
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(gnd.x, gnd.y, sc * 0.5, sc * 0.14, 0, 0, TAU);
    ctx.fill();
  }

  function drawCarEnt(p, sc, flash, t) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = flash ? rgba(WHT, 0.95) : '#3a1430';
    ctx.beginPath();
    ctx.moveTo(0, -sc * 0.85);
    ctx.lineTo(sc * 0.62, sc * 0.18);
    ctx.lineTo(sc * 0.38, sc * 0.42);
    ctx.lineTo(-sc * 0.38, sc * 0.42);
    ctx.lineTo(-sc * 0.62, sc * 0.18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = flash ? rgba(CYN, 1) : '#6a2048';
    ctx.beginPath();
    ctx.moveTo(0, -sc * 0.55);
    ctx.lineTo(sc * 0.28, sc * 0.08);
    ctx.lineTo(-sc * 0.28, sc * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(-sc * 0.28, -sc * 0.18, sc * 0.1, 0, TAU);
    ctx.arc(sc * 0.28, -sc * 0.18, sc * 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.7 + 0.3 * Math.abs(Math.sin(t * 8)));
    ctx.fillRect(-sc * 0.18, sc * 0.22, sc * 0.12, sc * 0.16);
    ctx.fillRect(sc * 0.06, sc * 0.22, sc * 0.12, sc * 0.16);
    ctx.restore();
  }

  function drawLamp(p, sc, flash) {
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#2a2438';
    ctx.fillRect(p.x - sc * 0.07, p.y - sc * 2.15, sc * 0.14, sc * 2.15);
    ctx.fillStyle = flash ? rgba(WHT, 1) : rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - sc * 2.2, sc * 0.28, sc * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.35);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sc * 2.05);
    ctx.lineTo(p.x + sc * 0.55, p.y);
    ctx.lineTo(p.x - sc * 0.55, p.y);
    ctx.closePath();
    ctx.fill();
  }

  function drawBarr(p, sc, flash) {
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#3a4860';
    ctx.fillRect(p.x - sc * 0.62, p.y - sc * 0.42, sc * 1.24, sc * 0.42);
    ctx.fillStyle = flash ? rgba(CYN, 1) : '#c8d4e8';
    ctx.fillRect(p.x - sc * 0.62, p.y - sc * 0.42, sc * 1.24, sc * 0.1);
    ctx.fillStyle = rgba(ORG, 0.95);
    ctx.fillRect(p.x - sc * 0.5, p.y - sc * 0.28, sc * 0.28, sc * 0.12);
    ctx.fillRect(p.x + sc * 0.22, p.y - sc * 0.28, sc * 0.28, sc * 0.12);
  }

  function drawDrone(p, sc, t) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.sin(t * 4) * 0.12);
    ctx.fillStyle = rgba(VIO, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -sc * 0.55);
    ctx.lineTo(sc * 0.5, 0);
    ctx.lineTo(0, sc * 0.55);
    ctx.lineTo(-sc * 0.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, sc * 0.16, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(WHT, 0.5);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, sc * 0.7, t * 6, t * 6 + 1.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawHeli(p, sc, t) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, sc * 0.7, sc * 0.28, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.beginPath();
    ctx.ellipse(sc * 0.12, -sc * 0.04, sc * 0.28, sc * 0.14, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.7);
    ctx.lineWidth = 1.6;
    const spin = t * 18;
    ctx.beginPath();
    ctx.moveTo(Math.cos(spin) * sc * 1.05, -sc * 0.32 + Math.sin(spin) * sc * 0.12);
    ctx.lineTo(Math.cos(spin + Math.PI) * sc * 1.05, -sc * 0.32 + Math.sin(spin + Math.PI) * sc * 0.12);
    ctx.moveTo(Math.cos(spin + 1.57) * sc * 1.05, -sc * 0.32 + Math.sin(spin + 1.57) * sc * 0.12);
    ctx.lineTo(Math.cos(spin + 4.71) * sc * 1.05, -sc * 0.32 + Math.sin(spin + 4.71) * sc * 0.12);
    ctx.stroke();
    ctx.fillStyle = rgba(MAG, 0.8);
    ctx.fillRect(-sc * 0.08, sc * 0.18, sc * 0.16, sc * 0.22);
    ctx.restore();
  }

  function drawTank(p, sc, flash) {
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#4a2818';
    ctx.fillRect(p.x - sc * 0.55, p.y - sc * 0.38, sc * 1.1, sc * 0.38);
    ctx.fillStyle = flash ? rgba(ORG, 1) : '#7a3a20';
    ctx.fillRect(p.x - sc * 0.32, p.y - sc * 0.62, sc * 0.64, sc * 0.28);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(p.x - sc * 0.06, p.y - sc * 1.05, sc * 0.12, sc * 0.5);
    ctx.fillStyle = rgba(RED, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y - sc * 1.08, sc * 0.1, 0, TAU);
    ctx.fill();
  }

  function drawOrb(p, sc, t) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = rgba(GOLD, 0.2);
    ctx.beginPath();
    ctx.arc(0, 0, sc * 0.7, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(0, 0, sc * 0.32, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.beginPath();
    ctx.arc(Math.cos(t * 4) * sc * 0.22, Math.sin(t * 4) * sc * 0.22, sc * 0.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEshot(p, sc) {
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(2.4, sc * 0.22), 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1.1, sc * 0.1), 0, TAU);
    ctx.fill();
  }

  function drawBoss(p, sc, t, form) {
    ctx.save();
    ctx.translate(p.x, p.y);
    if (form === 'van') {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -sc * 1.05);
      ctx.lineTo(sc * 1.15, sc * 0.35);
      ctx.lineTo(sc * 0.7, sc * 0.7);
      ctx.lineTo(-sc * 0.7, sc * 0.7);
      ctx.lineTo(-sc * 1.15, sc * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(-sc * 0.7, -sc * 0.15, sc * 1.4, sc * 0.22);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(-sc * 0.55, -sc * 0.35, sc * 0.16, 0, TAU);
      ctx.arc(sc * 0.55, -sc * 0.35, sc * 0.16, 0, TAU);
      ctx.fill();
    } else if (form === 'crawler') {
      ctx.rotate(Math.sin(t * 2) * 0.12);
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, sc * 0.7, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 3;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + t;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * sc * 0.5, Math.sin(a) * sc * 0.5);
        ctx.lineTo(Math.cos(a) * sc * 1.25, Math.sin(a) * sc * 0.85);
        ctx.stroke();
      }
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, sc * 0.28, 0, TAU);
      ctx.fill();
    } else if (form === 'cannon') {
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.fillRect(-sc * 0.95, -sc * 0.2, sc * 1.9, sc * 0.7);
      ctx.fillStyle = rgba(RED, 0.95);
      ctx.fillRect(-sc * 0.4, -sc * 0.7, sc * 0.8, sc * 0.55);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(-sc * 0.1, -sc * 1.45, sc * 0.2, sc * 0.85);
      ctx.beginPath();
      ctx.arc(0, -sc * 1.5, sc * 0.18, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(MAG, 0.28 + 0.12 * Math.abs(Math.sin(t * 3)));
      ctx.beginPath();
      ctx.arc(0, 0, sc * 1.35, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(VIO, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -sc * 1.1);
      ctx.lineTo(sc * 0.95, sc * 0.7);
      ctx.lineTo(-sc * 0.95, sc * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, -sc * 0.1, sc * 0.32, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.beginPath();
      ctx.arc(0, -sc * 0.1, sc * 0.14, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShot(sh) {
    project(sh.x, sh.y, sh.z, P);
    const sc = Math.min(40, (FOCAL / Math.max(0.08, sh.z)) * 10);
    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.92);
    ctx.lineWidth = Math.max(1.4, sc * 0.22);
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
      if (en.kind === 'car') drawCarEnt(P, sc, flash, en.t);
      else if (en.kind === 'lamp') drawLamp(P, sc, flash);
      else if (en.kind === 'barr') drawBarr(P, sc, flash);
      else if (en.kind === 'tank') drawTank(P, sc, flash);
      return;
    }
    project(en.x, en.y, en.z, P);
    const sc = scOf(en);
    drawShadow(en, sc);
    if (flash) {
      ctx.save();
      ctx.globalAlpha = 0.85;
    }
    if (en.kind === 'drone') drawDrone(P, sc, en.t);
    else if (en.kind === 'heli') drawHeli(P, sc, en.t);
    else if (en.kind === 'eshot') drawEshot(P, sc);
    else if (en.kind === 'orb') drawOrb(P, sc, en.t);
    else if (en.kind === 'boss') drawBoss(P, sc, en.t, en.form);
    if (flash) ctx.restore();
  }

  function drawCar(x, y, bank, a, muzzle) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.rotate(bank * 0.28);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 28, 8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1030';
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(22, 8);
    ctx.lineTo(14, 18);
    ctx.lineTo(-14, 18);
    ctx.lineTo(-22, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(VIO, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(12, 4);
    ctx.lineTo(-12, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, 2);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, muzzle ? 1 : 0.92);
    ctx.beginPath();
    ctx.arc(-10, -6, muzzle ? 4.2 : 3.1, 0, TAU);
    ctx.arc(10, -6, muzzle ? 4.2 : 3.1, 0, TAU);
    ctx.fill();
    const thr = 0.55 + 0.45 * Math.abs(Math.sin(G.t * 18));
    ctx.fillStyle = rgba(CYN, 0.35 + 0.4 * thr);
    ctx.beginPath();
    ctx.moveTo(-8, 16);
    ctx.lineTo(-4, 16 + 10 + thr * 10);
    ctx.lineTo(-1, 16);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, 16);
    ctx.lineTo(4, 16 + 10 + thr * 10);
    ctx.lineTo(1, 16);
    ctx.fill();
    if (muzzle) {
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(-10, -14, 5, 0, TAU);
      ctx.arc(10, -14, 5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
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
    drawRoad(pal);
    drawBuildings(pal);
    drawTunnel(pal);
    drawSmear(pal);

    const list = G.ents.slice();
    list.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < list.length; i++) drawEnt(list[i]);
    for (let i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    const ps = playerScreen();
    if (!REDUCE) {
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        drawCar(g.x, g.y, g.bank, 0.12 * (g.t / 0.16), false);
      }
    }
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (G.deadT <= 0 && !(blink && G.mode === 'play')) {
      drawCar(ps.x, ps.y, G.bank, 1, G.muzzle > 0);
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
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
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
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
