'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = VH * 0.36;
  const FOCAL = 0.62;
  const NEAR = 0.08;
  const FAR = 1.04;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const COMBO_WIN = 1.42;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-space-rush-best';
  const MUTE_KEY = 'playbox-space-rush-mute';
  const OPS = '方向 / WASD 移动 · 空格 / 点按开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 229, 255];
  const TEAL = [46, 232, 196];
  const GOLD = [255, 227, 107];
  const WHT = [232, 251, 255];
  const PNK = [255, 154, 212];
  const ORG = [255, 140, 64];

  const STAGES = [
    { name: '林海', tag: 'FOREST', len: 8.2, theme: 'forest' },
    { name: '石原', tag: 'STONE', len: 9.0, theme: 'stone' },
    { name: '金柱', tag: 'BONUS', len: 6.8, theme: 'bonus', bonus: true },
    { name: '龙巢', tag: 'NEST', len: 10.2, theme: 'nest' },
    { name: '终界', tag: 'LAST', len: 12.4, theme: 'last', boss: true }
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
  const btnRide = document.getElementById('btn-ride');
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
  let comboTok = 0;

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
    kind: 'ride',
    t: 0,
    clock: 0,
    dist: 0,
    stageI: 0,
    stageDist: 0,
    px: 0,
    py: 0.32,
    visX: 0,
    visY: 0.32,
    bank: 0,
    lives: LIVES,
    score: 0,
    best: { d: 0, f: 0 },
    combo: 0,
    comboT: 0,
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
    endT: 0,
    why: '',
    safe: false,
    readyT: 0
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
  function isFast() {
    return G.kind === 'rush';
  }
  function stageDef() {
    return STAGES[G.stageI] || STAGES[0];
  }
  function isBonus() {
    return !!stageDef().bonus;
  }
  function kindBest() {
    return isFast() ? G.best.f : G.best.d;
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

  function worldSpd() {
    const base = isFast() ? 0.56 : 0.38;
    const rush = G.combo >= 10 ? 0.08 : G.combo >= 5 ? 0.045 : 0;
    return base + rush + G.stageI * 0.014;
  }

  function plySpd() {
    return isFast() ? 1.95 : 1.64;
  }

  function fireGap() {
    return isFast() ? 0.08 : 0.11;
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
      this.beep(720, 0.05, 'square', 0.03, 1640);
      this.beep(180, 0.04, 'sawtooth', 0.018, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.045);
      this.noise(0.045, 0.038, 1200);
      this.beep(480 * lift, 0.07, 'square', 0.048, 920 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.18 : 0.09, big ? 0.075 : 0.046, big ? 260 : 520);
      this.beep(big ? 160 : 260, big ? 0.24 : 0.12, 'sawtooth', 0.052, 55);
    },
    pole() {
      this.ensure();
      this.beep(784, 0.07, 'triangle', 0.045, 1175);
      this.beep(1175, 0.1, 'sine', 0.035, 1568);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.06, 320);
      this.beep(280, 0.2, 'sawtooth', 0.055, 70);
      this.beep(140, 0.32, 'sine', 0.045, 42);
    },
    check() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 659);
      this.beep(659, 0.1, 'triangle', 0.04, 784);
      this.beep(1046, 0.18, 'sine', 0.05, 1318);
    },
    bonus() {
      this.ensure();
      this.beep(659, 0.08, 'sine', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
      this.beep(1320, 0.16, 'sine', 0.035, 1760);
    },
    boss() {
      this.ensure();
      this.beep(110, 0.22, 'sawtooth', 0.055, 70);
      this.beep(165, 0.3, 'square', 0.04, 90);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.05, 659);
      this.beep(659, 0.12, 'triangle', 0.048, 784);
      this.beep(1046, 0.24, 'sine', 0.055, 1318);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.2, 'sawtooth', 0.045, 90);
      this.beep(140, 0.32, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.04, 1175);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.042, 880);
      this.beep(880, 0.12, 'triangle', 0.048, 1320);
    }
  };

  function project(wx, wy, wz, out) {
    const z = wz < 0.05 ? 0.05 : wz;
    const s = FOCAL / z;
    const camX = G.visX * 0.18;
    const camY = 0.10 + G.visY * 0.04;
    out.x = CX + (wx - camX) * s * CX;
    out.y = HORIZON - (wy - camY) * s * VH * 0.52;
    out.s = s;
    out.z = z;
  }

  function playerScreen() {
    return {
      x: CX + G.visX * (CX - 54),
      y: (HORIZON + 48) + (1 - G.visY) * (VH - HORIZON - 90)
    };
  }

  function palette() {
    const th = stageDef().theme;
    if (th === 'stone') {
      return {
        skyTop: [8, 10, 28], skyHor: [36, 18, 48], skyLow: [18, 10, 28],
        gA: [28, 16, 40], gB: [48, 22, 58], hill: [22, 10, 36],
        sun: MAG, fog: [80, 30, 90]
      };
    }
    if (th === 'bonus') {
      return {
        skyTop: [18, 22, 48], skyHor: [80, 50, 20], skyLow: [40, 28, 12],
        gA: [48, 36, 12], gB: [90, 70, 22], hill: [40, 24, 10],
        sun: GOLD, fog: [255, 200, 80]
      };
    }
    if (th === 'nest') {
      return {
        skyTop: [16, 6, 22], skyHor: [48, 12, 36], skyLow: [22, 8, 18],
        gA: [32, 10, 28], gB: [18, 28, 24], hill: [24, 8, 20],
        sun: MAG, fog: [255, 80, 160]
      };
    }
    if (th === 'last') {
      return {
        skyTop: [4, 8, 18], skyHor: [8, 28, 40], skyLow: [4, 14, 22],
        gA: [6, 22, 28], gB: [10, 36, 42], hill: [6, 18, 24],
        sun: CYN, fog: [0, 200, 220]
      };
    }
    return {
      skyTop: [6, 18, 24], skyHor: [10, 48, 56], skyLow: [8, 28, 34],
      gA: [8, 36, 40], gB: [12, 54, 50], hill: [8, 28, 32],
      sun: TEAL, fog: [40, 200, 190]
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
      t: 0, life: gold ? 0.95 : 0.68,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -90 : -72
    });
    capArr(floats, 30);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -200 * p, vx1: 200 * p, vy0: -240 * p, vy1: 110 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.6 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.16 + p * 0.12);
    kick(2.1 + p * 2.4);
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.best.d = o.d | 0;
        G.best.f = o.f | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.best.d = n;
      }
    } catch (err) { /* ignore */ }
  }

  function maybeBest() {
    const k = isFast() ? 'f' : 'd';
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
      stageLabel.textContent = st.name;
      stageLabel.classList.toggle('hot', !!st.boss || G.stageI >= 3);
      stageLabel.classList.toggle('bonus', !!st.bonus);
    }
    if (tagLabel) {
      tagLabel.textContent = isFast() ? '疾空' : '龙骑';
      tagLabel.classList.toggle('warn', isFast());
      tagLabel.classList.toggle('hot', !!st.bonus);
    }
    if (progBar) {
      const t = clamp(G.stageDist / Math.max(0.2, st.len), 0, 1);
      progBar.style.transform = 'scaleX(' + t + ')';
    }
    if (progWrap) progWrap.classList.toggle('bonus', !!st.bonus);
    if (comboEl) {
      const show = G.mode === 'play' && G.combo >= 2;
      comboEl.hidden = !show;
      if (show) comboEl.textContent = G.mult > 1 ? (G.combo + ' 连 ×' + G.mult) : (G.combo + ' 连');
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('航线打通 · R 再来一局', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 撞树石或中弹扣一命', 'warn');
    else if (st.bonus) setHint('奖励关 · 穿金柱加分，不会受伤', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 飞高可越过矮树石', 'warn');
    else setHint('方向移动 · 空格开火 · 飞高越过树石', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'DOWN' : 'HARRIER';
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
    for (let i = 0; i < 48; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(8, HORIZON - 8),
        r: rand(0.6, 1.8),
        a: rand(0.25, 0.85),
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
      collect: false,
      t: 0,
      phase: rand(0, TAU),
      flash: 0,
      shotCd: rand(0.4, 1.1),
      wob: rand(0.6, 1.4)
    };
    if (extra) {
      const ks = Object.keys(extra);
      for (let i = 0; i < ks.length; i++) en[ks[i]] = extra[ks[i]];
    }
    G.ents.push(en);
    capArr(G.ents, 56);
    return en;
  }

  function spawnTree(x) {
    mkEnt('tree', x, 0, { ground: true, shootable: false, h: 0.46, hitR: 0.11, r: 0.12, score: 0 });
  }
  function spawnRock(x) {
    mkEnt('rock', x, 0, { ground: true, shootable: false, h: 0.22, hitR: 0.13, r: 0.13, score: 0 });
  }
  function spawnPillar(x) {
    mkEnt('pillar', x, 0, { ground: true, shootable: false, h: 0.82, hitR: 0.1, r: 0.1, score: 0 });
  }
  function spawnMush(x) {
    mkEnt('mush', x, 0, { ground: true, shootable: true, h: 0.3, hitR: 0.12, r: 0.12, hp: 1, score: 70 });
  }
  function spawnOrb(x, y) {
    mkEnt('orb', x, y == null ? rand(0.22, 0.7) : y, { r: 0.1, hitR: 0.1, score: 80, hp: 1 });
  }
  function spawnMoth(x, y) {
    mkEnt('moth', x, y == null ? rand(0.18, 0.72) : y, { r: 0.11, hitR: 0.11, score: 120, hp: 1, vx: rand(-0.12, 0.12) });
  }
  function spawnEye(x, y) {
    mkEnt('eye', x, y == null ? rand(0.24, 0.62) : y, { r: 0.13, hitR: 0.13, score: 200, hp: 2, shotCd: rand(0.5, 1.1) });
  }
  function spawnDrake(x, y) {
    mkEnt('drake', x, y == null ? rand(0.28, 0.7) : y, { r: 0.12, hitR: 0.12, score: 250, hp: 2 });
  }
  function spawnPole(x, y) {
    mkEnt('pole', x, y == null ? rand(0.18, 0.7) : y, {
      ground: false, shootable: false, solid: false, collect: true,
      r: 0.16, hitR: 0.16, score: 300, h: 1
    });
  }
  function spawnCoin(x, y) {
    mkEnt('coin', x, y == null ? rand(0.2, 0.75) : y, {
      shootable: false, solid: false, collect: true, r: 0.12, hitR: 0.12, score: 150
    });
  }
  function spawnEshot(x, y, z, hx, hy) {
    mkEnt('eshot', x, y, {
      z: z, shootable: false, r: 0.055, hitR: 0.06, score: 0, hp: 1,
      vx: hx || 0, vy: hy || 0, ground: false
    });
  }
  function spawnBoss() {
    G.bossOn = true;
    mkEnt('boss', 0, 0.42, {
      z: 0.92, r: 0.22, hitR: 0.2, hp: isFast() ? 38 : 28, score: 5000,
      shotCd: 0.8, shootable: true, solid: true
    });
    audio.boss();
    toast('巨龙 · 开火', true, false);
    screenFlash(MAG, 0.35);
  }

  function threatX() {
    if (G.mode === 'play' && Math.random() < 0.55) {
      return clamp(G.px + rand(-0.2, 0.2), -0.84, 0.84);
    }
    return rand(-0.84, 0.84);
  }
  function threatY() {
    if (G.mode === 'play' && Math.random() < 0.55) {
      return clamp(G.py + rand(-0.16, 0.16), 0.16, 0.78);
    }
    return rand(0.18, 0.72);
  }

  function pickSpawn() {
    const th = stageDef().theme;
    const x = threatX();
    const x2 = clamp(x + rand(0.22, 0.42) * (Math.random() < 0.5 ? 1 : -1), -0.86, 0.86);
    if (th === 'bonus') {
      if (Math.random() < 0.24) spawnCoin(x, threatY());
      else spawnPole(x, threatY());
      if (Math.random() < 0.35) spawnPole(x2, threatY());
      return;
    }
    if (th === 'forest') {
      const r = Math.random();
      if (r < 0.34) { spawnTree(x); if (Math.random() < 0.45) spawnTree(x2); }
      else if (r < 0.5) spawnRock(x);
      else if (r < 0.72) spawnOrb(x, threatY());
      else spawnMoth(x, threatY());
      return;
    }
    if (th === 'stone') {
      const r = Math.random();
      if (r < 0.28) spawnPillar(x);
      else if (r < 0.44) spawnRock(x);
      else if (r < 0.62) spawnEye(x, threatY());
      else if (r < 0.82) spawnOrb(x, threatY());
      else spawnMoth(x, threatY());
      return;
    }
    if (th === 'nest') {
      const r = Math.random();
      if (r < 0.28) spawnMush(x);
      else if (r < 0.4) spawnTree(x);
      else if (r < 0.62) spawnDrake(x, threatY());
      else if (r < 0.8) spawnMoth(x, threatY());
      else spawnOrb(x, threatY());
      return;
    }
    const r = Math.random();
    if (r < 0.18) spawnPillar(x);
    else if (r < 0.3) spawnTree(x);
    else if (r < 0.42) spawnMush(x);
    else if (r < 0.58) spawnDrake(x, threatY());
    else if (r < 0.74) spawnEye(x, threatY());
    else if (r < 0.88) spawnMoth(x, threatY());
    else spawnOrb(x, threatY());
  }

  function spawnInterval() {
    const th = stageDef().theme;
    let base = th === 'bonus' ? 0.32 : 0.42;
    if (isFast()) base *= 0.68;
    if (G.combo >= 8) base *= 0.9;
    if (th === 'last') base *= 0.86;
    if (G.bossOn) base *= 1.35;
    return base;
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
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
      comboTok += 1;
    }
    if (G.combo === 8) toast('连击 ×8', false, true);
    if (G.combo === 16) toast('连击 ×16 · 爆走', false, true);
  }

  function killEnt(en, collected) {
    project(en.x, en.y, en.z, P);
    const rgb = collected ? GOLD : (en.kind === 'boss' ? MAG : CYN);
    const pow = en.kind === 'boss' ? 2.6 : collected ? 1.3 : 1;
    juice(P.x, P.y, rgb, pow);
    if (collected) {
      audio.pole();
      hitStop(0.04);
      floatText(P.x, P.y, '+' + ((en.score || 0) * G.mult), GOLD, true);
    } else {
      audio.hit(G.combo + 1);
      audio.boom(en.kind === 'boss' || en.kind === 'drake');
      hitStop(en.kind === 'boss' ? 0.08 : 0.04);
      floatText(P.x, P.y, '+' + ((en.score || 50) * G.mult), G.mult > 1 ? GOLD : WHT, G.mult > 1);
    }
    bumpCombo();
    addScore((en.score || 50) * G.mult);
    if (en.kind === 'boss') {
      G.bossOn = false;
      G.bossDead = true;
      G.endT = 1.25;
      G.why = 'win';
      audio.boom(true);
      toast('巨龙坠了', false, true);
    }
    en.hp = 0;
  }

  function playerHit() {
    if (G.invuln > 0 || G.deadT > 0 || G.safe || G.mode !== 'play') return;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0.82;
    G.invuln = 1.48;
    const ps = playerScreen();
    audio.death();
    hitStop(0.072);
    kick(8);
    screenFlash(MAG, 0.62);
    juice(ps.x, ps.y, MAG, 2.2);
    emit(22, {
      x: ps.x, y: ps.y, j: 18,
      vx0: -260, vx1: 260, vy0: -220, vy1: 80,
      r0: 2, r1: 5.5, life: 0.55, rgb: MAG
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
    if (G.shots.length >= 6) return;
    G.fireCd = fireGap();
    G.muzzle = 0.07;
    G.shots.push({ x: G.px, y: G.py, z: 0.145, vz: 1.78 });
    audio.shoot();
    if (REDUCE) return;
    const ps = playerScreen();
    emit(5, {
      x: ps.x, y: ps.y - 8, j: 4,
      vx0: -40, vx1: 40, vy0: -120, vy1: -20,
      r0: 1, r1: 2.2, life: 0.16, rgb: CYN, g: 0
    });
  }

  function nextStage() {
    if (G.stageI >= STAGES.length - 1) return;
    G.stageI += 1;
    G.stageDist = 0;
    const st = stageDef();
    G.safe = !!st.bonus;
    G.readyT = 0.9;
    addScore(st.bonus ? 400 : 800);
    if (st.bonus) {
      audio.bonus();
      toast('奖励关 · 穿金柱', false, true);
      screenFlash(GOLD, 0.34);
    } else {
      audio.check();
      toast('检查点 · ' + st.name, false, true);
      screenFlash(GOLD, 0.28);
    }
    G.invuln = Math.max(G.invuln, 0.7);
    hud();
  }

  function finishWin() {
    const bonus = 2400 + G.lives * 400;
    G.score += bonus;
    maybeBest();
    G.mode = 'win';
    audio.win();
    showOverlay('win', '通关', '航线打通　·　' + (G.score | 0) + ' 分　·　连击最高见顶栏');
    hud();
  }

  function finishLose() {
    G.mode = 'lose';
    maybeBest();
    audio.lose();
    showOverlay('lose', '坠机了', '飞到 ' + stageDef().name + '　·　' + (G.score | 0) + ' 分。撞物或中弹扣命。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'rush' ? 'rush' : 'ride';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.dist = 0;
    G.stageI = 0;
    G.stageDist = 0;
    G.px = 0;
    G.py = 0.32;
    G.visX = 0;
    G.visY = 0.32;
    G.bank = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 1.1;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0.32;
    G.flashRgb = CYN;
    G.punch = 1;
    G.muzzle = 0;
    G.spawnT = 0.55;
    G.nextLife = LIFE_EVERY;
    G.bossOn = false;
    G.bossDead = false;
    G.endT = 0;
    G.why = '';
    G.safe = false;
    G.readyT = 1.05;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    hideOverlay();
    audio.start();
    toast(isFast() ? '疾空 · 更快更密' : '龙骑 · 林海出发', false, true);
    hud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'ride';
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
    G.safe = false;
    G.spawnT = 0.3;
    clearField();
    showOverlay('title', '空间', '冲进画面。左右上下躲树石，空格往深处开火。');
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('ride');
    else startGame(G.kind || 'ride');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('ride');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function updateGhosts() {
    if (REDUCE) return;
    const ps = playerScreen();
    ghosts.push({ x: ps.x, y: ps.y, bank: G.bank, t: 0.18 });
    capArr(ghosts, 8);
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
      const tx = clamp((pointer.x - CX) / (CX - 54), -1, 1);
      const ty = clamp(1 - (pointer.y - (HORIZON + 48)) / (VH - HORIZON - 90), 0.02, 0.92);
      G.px = lerp(G.px, tx, 1 - Math.exp(-dt * 11));
      G.py = lerp(G.py, ty, 1 - Math.exp(-dt * 11));
    } else if (G.mode === 'title') {
      G.px = Math.sin(G.t * 0.72) * 0.58;
      G.py = 0.34 + Math.sin(G.t * 0.94) * 0.22;
    } else {
      if (ax && ay) {
        ax *= 0.75;
        ay *= 0.75;
      }
      G.px = clamp(G.px + ax * spd * dt, -0.92, 0.92);
      G.py = clamp(G.py + ay * spd * 0.88 * dt, 0.04, 0.9);
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
      if (sh.z > 1.18) {
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
          if (sh.y > en.h + 0.16) continue;
          d = Math.abs(sh.x - en.x);
        } else {
          d = hypot(sh.x - en.x, (sh.y - en.y) * 0.7);
        }
        if (d > en.r + 0.08) continue;
        en.hp -= 1;
        en.flash = 0.1;
        project(en.x, en.y, en.z, P);
        emit(6, {
          x: P.x, y: P.y, j: 8,
          vx0: -120, vx1: 120, vy0: -140, vy1: 40,
          r0: 1, r1: 2.4, life: 0.2, rgb: GOLD, g: 80
        });
        if (en.hp <= 0) killEnt(en, false);
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

  function updateEnts(dt) {
    const spd = worldSpd();
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && !G.safe;
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
        const tz = 0.42 + Math.sin(en.t * 0.7) * 0.04;
        en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.6));
        en.x = Math.sin(en.t * 0.85) * 0.55;
        en.y = 0.38 + Math.sin(en.t * 1.1) * 0.16;
        en.shotCd -= dt;
        if (playing && en.shotCd <= 0 && en.z < 0.62) {
          en.shotCd = isFast() ? 0.72 : 0.92;
          const n = isFast() ? 5 : 3;
          for (let k = 0; k < n; k++) {
            const a = (k - (n - 1) * 0.5) * 0.12;
            spawnEshot(en.x + a, en.y, en.z - 0.02, (G.px - en.x) * 0.35 + a, (G.py - en.y) * 0.28);
          }
        }
      } else if (en.kind === 'eshot') {
        en.z -= (isFast() ? 0.72 : 0.58) * dt;
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        const hx = G.px - en.x;
        const hy = G.py - en.y;
        en.vx = lerp(en.vx, hx * 0.55, dt * 1.4);
        en.vy = lerp(en.vy, hy * 0.45, dt * 1.4);
      } else {
        en.z -= spd * dt;
        if (en.kind === 'orb') {
          en.x += Math.sin(en.t * 2.2 * en.wob + en.phase) * 0.22 * dt;
          en.y += Math.cos(en.t * 1.6 + en.phase) * 0.12 * dt;
        } else if (en.kind === 'moth') {
          en.x += Math.sin(en.t * 4.2 + en.phase) * 0.38 * dt + en.vx * dt;
          en.y += Math.sin(en.t * 2.4) * 0.16 * dt;
        } else if (en.kind === 'eye') {
          en.x = lerp(en.x, G.px, dt * 0.35);
          en.y = lerp(en.y, G.py, dt * 0.22);
          en.shotCd -= dt;
          if (playing && en.shotCd <= 0 && en.z < 0.7 && en.z > 0.22) {
            en.shotCd = isFast() ? 1.05 : 1.35;
            spawnEshot(en.x, en.y, en.z, (G.px - en.x) * 0.4, (G.py - en.y) * 0.3);
          }
        } else if (en.kind === 'drake') {
          if (en.z < 0.62) {
            en.x = lerp(en.x, G.px, dt * 1.5);
            en.y = lerp(en.y, G.py, dt * 1.2);
            en.z -= spd * 0.45 * dt;
          } else {
            en.x += Math.sin(en.t * 1.4 + en.phase) * 0.18 * dt;
          }
        } else if (en.kind === 'pole' || en.kind === 'coin') {
          en.y += Math.sin(en.t * 2.6 + en.phase) * 0.05 * dt;
        }
      }
      en.x = clamp(en.x, -1.05, 1.05);
      en.y = clamp(en.y, en.ground ? 0 : 0.02, 0.95);

      if (en.z < 0.045 || en.z > 1.25) {
        G.ents.splice(i, 1);
        continue;
      }

      if (en.z < 0.18 && en.z > 0.05 && (canHurt || en.collect) && playing && G.deadT <= 0) {
        const dx = en.x - G.px;
        const dy = en.y - G.py;
        if (en.collect) {
          if (hypot(dx, dy) < 0.18) {
            killEnt(en, true);
            G.ents.splice(i, 1);
          }
        } else if (canHurt) {
          let hit;
          if (en.ground) {
            hit = G.py <= en.h + 0.05 && Math.abs(dx) < en.hitR + 0.1;
          } else {
            hit = hypot(dx, dy * 0.75) < (en.hitR + 0.1);
          }
          if (hit) {
            playerHit();
            if (en.kind === 'eshot') {
              G.ents.splice(i, 1);
            }
          }
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
      if (Math.random() < 0.55) spawnTree(rand(-0.8, 0.8));
      else spawnOrb(rand(-0.7, 0.7));
      return;
    }
    if (stageDef().boss && !G.bossOn && !G.bossDead && G.stageDist > 6.2) {
      spawnBoss();
      return;
    }
    pickSpawn();
    if (isFast() && Math.random() < 0.38) pickSpawn();
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
        G.dist += 0.32 * dt;
        G.clock += dt;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        G.clock += dt;
        G.dist += worldSpd() * dt;
        G.stageDist += worldSpd() * dt;
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
        const st = stageDef();
        if (!st.boss && G.stageDist >= st.len) nextStage();
        else if (st.boss && G.bossDead && G.endT <= 0) {
          G.why = 'win';
          G.endT = 0.2;
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
    g.addColorStop(0.7, rgba(pal.skyHor, 1));
    g.addColorStop(1, rgba(pal.skyLow, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, HORIZON + 10);

    ctx.fillStyle = rgba(pal.sun, 0.9);
    ctx.beginPath();
    ctx.arc(CX + 210 - G.visX * 18, 52, 18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(pal.sun, 0.18);
    ctx.beginPath();
    ctx.arc(CX + 210 - G.visX * 18, 52, 34, 0, TAU);
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
    for (let i = 0; i <= 16; i++) {
      const hx = (i / 16) * VW;
      const n = hash2((i + G.stageI * 9 + 3) * 17);
      const h = 18 + n * 46;
      ctx.lineTo(hx - G.visX * 22, hillY - h);
    }
    ctx.lineTo(VW, hillY);
    ctx.closePath();
    ctx.fillStyle = rgba(pal.hill, 1);
    ctx.fill();
  }

  function drawGround(pal) {
    const tw = 0.24;
    const tz = 0.11;
    const scroll = G.dist % tz;
    for (let i = 20; i >= 0; i--) {
      const z0 = 0.07 + i * tz - scroll;
      const z1 = z0 + tz;
      if (z1 < 0.06 || z0 > 1.25) continue;
      for (let j = -9; j < 9; j++) {
        const x0 = j * tw;
        const x1 = x0 + tw;
        project(x0, 0, Math.max(0.06, z0), P);
        project(x1, 0, Math.max(0.06, z0), P2);
        project(x1, 0, z1, P3);
        project(x0, 0, z1, P4);
        const check = (i + j) & 1;
        const fog = clamp((z0 - 0.08) / 1.1, 0, 1);
        const col = check ? pal.gA : pal.gB;
        const mix = [
          (col[0] + pal.skyHor[0] * fog * 0.45) | 0,
          (col[1] + pal.skyHor[1] * fog * 0.45) | 0,
          (col[2] + pal.skyHor[2] * fog * 0.45) | 0
        ];
        quad(P.x, P.y, P2.x, P2.y, P3.x, P3.y, P4.x, P4.y, mix, 1);
      }
    }
    ctx.strokeStyle = rgba(CYN, 0.12);
    ctx.lineWidth = 1;
    for (let k = -4; k <= 4; k++) {
      project(k * 0.28, 0, 1.15, P);
      project(k * 0.28, 0, 0.08, P2);
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P2.x, P2.y);
      ctx.stroke();
    }
  }

  function drawSmear() {
    if (REDUCE) return;
    const vpX = CX - G.visX * 22;
    const vpY = HORIZON;
    const n = 9 + Math.min(8, G.combo);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const a = -0.72 + (i / (n - 1)) * 1.44;
      const len = 40 + (G.mode === 'play' ? worldSpd() * 90 : 30) + G.combo * 2;
      ctx.strokeStyle = rgba(i % 2 ? CYN : WHT, 0.07 + (isFast() ? 0.04 : 0));
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(vpX + Math.sin(a) * len * 4.2, vpY + Math.cos(a) * len * 0.85 + 80);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      const a = clamp(s.t / 0.18, 0, 1);
      ctx.fillStyle = rgba(CYN, 0.08 * a);
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 16, 10, 0, 0, TAU);
      ctx.fill();
    }
  }

  function scOf(en) {
    return Math.min(170, Math.max(4, (FOCAL / Math.max(0.06, en.z)) * 28));
  }

  function drawShadow(en, p, sc) {
    const gnd = { x: 0, y: 0, s: 1, z: 1 };
    project(en.x, 0, en.z, gnd);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(gnd.x, gnd.y, sc * 0.45, sc * 0.14, 0, 0, TAU);
    ctx.fill();
  }

  function drawTree(p, sc) {
    ctx.fillStyle = '#4a3018';
    ctx.fillRect(p.x - sc * 0.1, p.y - sc * 1.15, sc * 0.2, sc * 1.15);
    ctx.fillStyle = '#1a8a68';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sc * 2.35);
    ctx.lineTo(p.x + sc * 0.85, p.y - sc * 0.85);
    ctx.lineTo(p.x - sc * 0.85, p.y - sc * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2ee8c4';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sc * 2.2);
    ctx.lineTo(p.x + sc * 0.45, p.y - sc * 1.15);
    ctx.lineTo(p.x - sc * 0.45, p.y - sc * 1.15);
    ctx.closePath();
    ctx.fill();
  }

  function drawRock(p, sc) {
    ctx.fillStyle = '#5a4a68';
    ctx.beginPath();
    ctx.moveTo(p.x - sc * 0.7, p.y);
    ctx.lineTo(p.x - sc * 0.4, p.y - sc * 0.7);
    ctx.lineTo(p.x + sc * 0.15, p.y - sc * 0.95);
    ctx.lineTo(p.x + sc * 0.75, p.y - sc * 0.4);
    ctx.lineTo(p.x + sc * 0.55, p.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#8a7a9a';
    ctx.beginPath();
    ctx.moveTo(p.x - sc * 0.2, p.y - sc * 0.7);
    ctx.lineTo(p.x + sc * 0.1, p.y - sc * 0.9);
    ctx.lineTo(p.x + sc * 0.35, p.y - sc * 0.45);
    ctx.lineTo(p.x - sc * 0.05, p.y - sc * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  function drawPillar(p, sc) {
    ctx.fillStyle = '#6a5a78';
    ctx.fillRect(p.x - sc * 0.22, p.y - sc * 2.6, sc * 0.44, sc * 2.6);
    ctx.fillStyle = '#8a7a98';
    ctx.fillRect(p.x - sc * 0.38, p.y - sc * 2.85, sc * 0.76, sc * 0.32);
    ctx.fillRect(p.x - sc * 0.32, p.y - sc * 0.18, sc * 0.64, sc * 0.18);
    ctx.fillStyle = rgba(MAG, 0.55);
    ctx.fillRect(p.x - sc * 0.08, p.y - sc * 2.4, sc * 0.16, sc * 0.5);
  }

  function drawMush(p, sc) {
    ctx.fillStyle = '#e8d8c0';
    ctx.fillRect(p.x - sc * 0.12, p.y - sc * 0.85, sc * 0.24, sc * 0.85);
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - sc * 0.9, sc * 0.7, sc * 0.38, 0, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(p.x - sc * 0.22, p.y - sc * 1.0, sc * 0.1, 0, TAU);
    ctx.arc(p.x + sc * 0.18, p.y - sc * 0.92, sc * 0.08, 0, TAU);
    ctx.fill();
  }

  function drawPole(p, sc) {
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = Math.max(2, sc * 0.08);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + sc * 0.2);
    ctx.lineTo(p.x, p.y - sc * 1.6);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.8);
    ctx.lineWidth = Math.max(2, sc * 0.1);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - sc * 0.55, sc * 0.55, sc * 0.22, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.45);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - sc * 0.55, sc * 0.35, sc * 0.14, 0, 0, TAU);
    ctx.stroke();
  }

  function drawCoin(p, sc) {
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, sc * 0.32, sc * 0.32, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.ellipse(p.x - sc * 0.08, p.y - sc * 0.08, sc * 0.1, sc * 0.1, 0, 0, TAU);
    ctx.fill();
  }

  function drawOrb(p, sc, t) {
    const pulse = 0.85 + Math.sin(t * 8) * 0.15;
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sc * 0.42 * pulse, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(PNK, 0.5);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sc * 0.62 * pulse, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.beginPath();
    ctx.arc(p.x - sc * 0.12, p.y - sc * 0.12, sc * 0.12, 0, TAU);
    ctx.fill();
  }

  function drawMoth(p, sc, t) {
    const flap = Math.sin(t * 14) * 0.35;
    ctx.fillStyle = rgba(TEAL, 0.9);
    ctx.beginPath();
    ctx.ellipse(p.x - sc * (0.55 + flap * 0.15), p.y, sc * (0.5 + flap * 0.12), sc * 0.22, -0.4, 0, TAU);
    ctx.ellipse(p.x + sc * (0.55 + flap * 0.15), p.y, sc * (0.5 + flap * 0.12), sc * 0.22, 0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, sc * 0.18, sc * 0.28, 0, 0, TAU);
    ctx.fill();
  }

  function drawEye(p, sc) {
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, sc * 0.48, sc * 0.38, 0, 0, TAU);
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

  function drawDrake(p, sc, t, bank) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(bank * 0.3);
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -sc * 0.7);
    ctx.lineTo(sc * 0.35, sc * 0.2);
    ctx.lineTo(0, sc * 0.55);
    ctx.lineTo(-sc * 0.35, sc * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    const w = 0.4 + Math.sin(t * 10) * 0.12;
    ctx.beginPath();
    ctx.moveTo(-sc * w, sc * 0.05);
    ctx.lineTo(-sc * 0.9, sc * 0.35);
    ctx.lineTo(-sc * 0.15, sc * 0.2);
    ctx.moveTo(sc * w, sc * 0.05);
    ctx.lineTo(sc * 0.9, sc * 0.35);
    ctx.lineTo(sc * 0.15, sc * 0.2);
    ctx.fill();
    ctx.restore();
  }

  function drawBoss(p, sc, t) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const flap = Math.sin(t * 6) * 0.18;
    ctx.fillStyle = rgba(MAG, 0.35);
    ctx.beginPath();
    ctx.arc(0, 0, sc * 1.15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -sc * 0.9);
    ctx.lineTo(sc * 0.55, sc * 0.3);
    ctx.lineTo(0, sc * 1.05);
    ctx.lineTo(-sc * 0.55, sc * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(PNK, 0.9);
    ctx.beginPath();
    ctx.moveTo(-sc * 0.2, 0);
    ctx.lineTo(-sc * (1.4 + flap), -sc * 0.2);
    ctx.lineTo(-sc * 0.3, sc * 0.35);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sc * 0.2, 0);
    ctx.lineTo(sc * (1.4 + flap), -sc * 0.2);
    ctx.lineTo(sc * 0.3, sc * 0.35);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(-sc * 0.16, -sc * 0.25, sc * 0.1, 0, TAU);
    ctx.arc(sc * 0.16, -sc * 0.25, sc * 0.1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEshot(p, sc) {
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sc * 0.35);
    ctx.lineTo(p.x + sc * 0.18, p.y);
    ctx.lineTo(p.x, p.y + sc * 0.35);
    ctx.lineTo(p.x - sc * 0.18, p.y);
    ctx.closePath();
    ctx.fill();
  }

  function drawShipAt(x, y, bank, alpha, muzzle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bank * 0.42);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = rgba(CYN, 0.25);
    ctx.beginPath();
    ctx.ellipse(0, 10, 16, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.85);
    ctx.beginPath();
    ctx.moveTo(-18, 8);
    ctx.lineTo(-4, 2);
    ctx.lineTo(-6, 10);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18, 8);
    ctx.lineTo(4, 2);
    ctx.lineTo(6, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(9, 8);
    ctx.lineTo(0, 14);
    ctx.lineTo(-9, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(4, 2);
    ctx.lineTo(0, 6);
    ctx.lineTo(-4, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(TEAL, 1);
    ctx.fillRect(-3, 8, 6, 5);
    if (muzzle) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(0, -24, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(0, -28, 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShot(sh) {
    project(sh.x, sh.y, sh.z, P);
    const sc = Math.min(28, (FOCAL / Math.max(0.08, sh.z)) * 10);
    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.9);
    ctx.lineWidth = Math.max(1.4, sc * 0.18);
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
    project(en.x, en.ground ? 0 : en.y, en.z, P);
    const sc = scOf(en);
    if (P.y < -80 || P.y > VH + 80 || P.x < -120 || P.x > VW + 120) return;
    if (en.flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
    }
    if (!en.ground && en.kind !== 'eshot') drawShadow(en, P, sc);
    if (en.kind === 'tree') drawTree(P, sc);
    else if (en.kind === 'rock') drawRock(P, sc);
    else if (en.kind === 'pillar') drawPillar(P, sc);
    else if (en.kind === 'mush') drawMush(P, sc);
    else if (en.kind === 'pole') drawPole(P, sc);
    else if (en.kind === 'coin') drawCoin(P, sc);
    else if (en.kind === 'orb') drawOrb(P, sc, en.t);
    else if (en.kind === 'moth') drawMoth(P, sc, en.t);
    else if (en.kind === 'eye') drawEye(P, sc);
    else if (en.kind === 'drake') drawDrake(P, sc, en.t, (en.x - G.px));
    else if (en.kind === 'boss') drawBoss(P, sc, en.t);
    else if (en.kind === 'eshot') drawEshot(P, sc);
    if (en.flash > 0) ctx.restore();
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
      ctx.lineWidth = 2;
      const r = s.rad * (0.4 + s.t * 1.4);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = k * TAU / 6;
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
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].kind === 'boss') { boss = G.ents[i]; break; }
    }
    if (!boss) return;
    const max = isFast() ? 38 : 28;
    const t = clamp(boss.hp / max, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(VW * 0.22, 14, VW * 0.56, 10);
    ctx.fillStyle = rgba(MAG, 0.9);
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
        drawShipAt(g.x, g.y, g.bank, 0.12 * (g.t / 0.18), false);
      }
    }
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (G.deadT <= 0 && !(blink && G.mode === 'play')) {
      drawShipAt(ps.x, ps.y, G.bank, 1, G.muzzle > 0);
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
      startGame('ride');
      return;
    }
    if (k === '2') {
      startGame('rush');
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

  if (btnRide) {
    btnRide.addEventListener('click', function () {
      audio.ensure();
      startGame('ride');
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
      startGame(G.kind || 'ride');
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
