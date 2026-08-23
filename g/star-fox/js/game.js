'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = VH * 0.36;
  const FOCAL = 0.58;
  const FAR = 1.06;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const COMBO_WIN = 1.4;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-star-fox-best';
  const MUTE_KEY = 'playbox-star-fox-mute';
  const OPS = '方向 / WASD 飞 · 空格开火 · Shift / Z 推进 · 连点左右 桶滚 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const FOX = [255, 107, 34];
  const GOLD = [255, 227, 107];
  const LAS = [92, 255, 154];
  const CYN = [92, 232, 255];
  const MAG = [255, 74, 136];
  const WHT = [255, 244, 234];
  const CRM = [255, 232, 208];
  const PNK = [255, 154, 196];
  const RED = [255, 80, 72];

  const STAGES = [
    { name: '草星', tag: 'CORNER', len: 5.2, theme: 'grass', boss: 'mech', bossName: '机甲', hp: 14, hpD: 20, score: 1800 },
    { name: '岩带', tag: 'ASTER', len: 5.6, theme: 'rock', boss: 'whale', bossName: '岩鲸', hp: 18, hpD: 26, score: 2400 },
    { name: '隧廊', tag: 'SHAFT', len: 6.0, theme: 'shaft', boss: 'face', bossName: '魔面', hp: 26, hpD: 36, score: 4000 }
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
  const btnCore = document.getElementById('btn-core');
  const btnChaos = document.getElementById('btn-chaos');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBoost = document.getElementById('btn-boost');
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
  const boostBar = document.getElementById('boost-bar');
  const boostWrap = document.getElementById('boost-wrap');

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
  let radioTok = 0;

  const keys = { l: false, r: false, u: false, d: false, boost: false };
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
    kind: 'core',
    t: 0,
    clock: 0,
    dist: 0,
    stageI: 0,
    stageDist: 0,
    px: 0,
    py: 0.38,
    visX: 0,
    visY: 0.38,
    bank: 0,
    rollT: 0,
    rollDir: 1,
    rollAng: 0,
    tapL: -9,
    tapR: -9,
    boosting: false,
    boost: 1,
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
    flashRgb: FOX,
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
    gap: 1,
    radioT: 2.4
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
  function isChaos() {
    return G.kind === 'chaos';
  }
  function stageDef() {
    return STAGES[G.stageI] || STAGES[0];
  }
  function kindBest() {
    return isChaos() ? G.best.m : G.best.c;
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
  function rolling() {
    return G.rollT > 0;
  }

  function worldSpd() {
    const base = isChaos() ? 0.50 : 0.42;
    const rush = G.combo >= 12 ? 0.07 : G.combo >= 6 ? 0.04 : 0;
    const b = G.boosting ? 0.22 : 0;
    return base + rush + b + G.stageI * 0.016;
  }
  function plySpd() {
    return (isChaos() ? 1.96 : 1.72) * (G.boosting ? 0.82 : 1);
  }
  function fireGap() {
    return isChaos() ? 0.078 : 0.095;
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
      this.beep(240, 0.03, 'sawtooth', 0.014, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.6, combo * 0.042);
      this.noise(0.038, 0.032, 1200);
      this.beep(540 * lift, 0.062, 'square', 0.044, 1040 * lift);
    },
    rock() {
      this.ensure();
      this.noise(0.07, 0.046, 280);
      this.beep(160, 0.1, 'triangle', 0.036, 70);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.09, big ? 0.08 : 0.044, big ? 220 : 480);
      this.beep(big ? 140 : 240, big ? 0.28 : 0.12, 'sawtooth', 0.05, 48);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.07, 'sine', 0.038, 588 * m);
      this.beep(523 * m, 0.1, 'triangle', 0.032, 784 * m);
    },
    ring() {
      this.ensure();
      this.beep(784, 0.08, 'sine', 0.04, 1176);
      this.beep(1176, 0.12, 'triangle', 0.036, 1568);
    },
    boost() {
      this.ensure();
      this.noise(0.12, 0.028, 700);
      this.beep(180, 0.14, 'sawtooth', 0.022, 420);
    },
    roll() {
      this.ensure();
      this.beep(220, 0.08, 'sawtooth', 0.03, 880);
      this.noise(0.1, 0.03, 900);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.062, 280);
      this.beep(250, 0.22, 'sawtooth', 0.055, 60);
      this.beep(120, 0.34, 'sine', 0.042, 36);
    },
    stage() {
      this.ensure();
      this.beep(494, 0.08, 'square', 0.042, 659);
      this.beep(659, 0.1, 'triangle', 0.04, 880);
      this.beep(988, 0.16, 'sine', 0.046, 1318);
    },
    boss() {
      this.ensure();
      this.beep(90, 0.26, 'sawtooth', 0.058, 56);
      this.beep(140, 0.34, 'square', 0.038, 78);
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
    radio() {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.02, 440);
      this.beep(1320, 0.05, 'sine', 0.018, 990);
    }
  };

  function project(wx, wy, wz, out) {
    const z = wz < 0.05 ? 0.05 : wz;
    const s = FOCAL / z;
    const camX = G.visX * 0.18;
    const camY = 0.08 + G.visY * 0.03;
    out.x = CX + (wx - camX) * s * CX;
    out.y = HORIZON - (wy - camY) * s * VH * 0.5;
    out.s = s;
    out.z = z;
  }

  function playerScreen() {
    return {
      x: CX + G.visX * (CX - 52),
      y: (HORIZON + 48) + (1 - G.visY) * (VH - HORIZON - 92)
    };
  }

  function palette() {
    const th = stageDef().theme;
    if (th === 'rock') {
      return {
        skyTop: [8, 6, 14], skyHor: [22, 14, 36], skyLow: [12, 8, 18],
        gA: [18, 12, 22], gB: [28, 16, 32], hill: [14, 10, 20],
        sun: FOX, fog: [180, 90, 255], laneA: [28, 20, 38], laneB: [16, 12, 24]
      };
    }
    if (th === 'shaft') {
      return {
        skyTop: [10, 6, 8], skyHor: [36, 12, 16], skyLow: [16, 8, 10],
        gA: [28, 10, 12], gB: [42, 14, 16], hill: [18, 8, 10],
        sun: MAG, fog: [255, 80, 90], laneA: [48, 16, 18], laneB: [22, 8, 10]
      };
    }
    return {
      skyTop: [28, 12, 8], skyHor: [72, 36, 16], skyLow: [36, 22, 10],
      gA: [28, 72, 28], gB: [18, 48, 22], hill: [22, 40, 18],
      sun: FOX, fog: [255, 160, 70], laneA: [42, 98, 36], laneB: [22, 62, 24]
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

  function radio(who, msg, warn) {
    audio.radio();
    toast(who + '：「' + msg + '」', !!warn, !warn);
    G.radioT = rand(3.2, 6.4);
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
    const k = isChaos() ? 'm' : 'c';
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
      stageLabel.classList.toggle('hot', G.stageI >= 1);
      stageLabel.classList.toggle('boss', G.bossOn);
    }
    if (tagLabel) {
      tagLabel.textContent = isChaos() ? '乱轨' : '星核';
      tagLabel.classList.toggle('warn', isChaos());
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
    if (boostBar) boostBar.style.transform = 'scaleX(' + clamp(G.boost, 0, 1) + ')';
    if (boostWrap) {
      boostWrap.classList.toggle('hot', G.boosting);
      boostWrap.classList.toggle('low', G.boost < 0.22 && !G.boosting);
    }
    if (btnBoost) btnBoost.classList.toggle('hot', G.boosting);
    if (comboEl) {
      const show = G.mode === 'play' && G.combo >= 2;
      comboEl.hidden = !show;
      if (show) comboEl.textContent = G.mult > 1 ? (G.combo + ' 连 ×' + G.mult) : (G.combo + ' 连');
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('魔核打穿 · R 再来一局', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 撞岩墙机或中弹扣一命', 'warn');
    else if (G.bossOn) setHint('头目 · 扫射 ' + st.bossName, 'hot');
    else if (G.boosting) setHint('推进中 · 航线更快', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 连点左右可桶滚躲弹', 'warn');
    else setHint('方向飞 · 空格开火 · Shift 推进 · 连点左右桶滚', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'DOWN' : 'SFOX';
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
        a: rand(0.22, 0.85),
        tw: rand(0, TAU),
        z: rand(0.3, 1)
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
      pass: false,
      t: 0,
      phase: rand(0, TAU),
      flash: 0,
      shotCd: rand(0.4, 1.1),
      wob: rand(0.6, 1.4),
      form: '',
      used: false
    };
    if (extra) {
      const ks = Object.keys(extra);
      for (let i = 0; i < ks.length; i++) en[ks[i]] = extra[ks[i]];
    }
    G.ents.push(en);
    capArr(G.ents, 62);
    return en;
  }

  function spawnDrone(x, y) {
    mkEnt('drone', x, y == null ? rand(0.22, 0.7) : y, { r: 0.09, hitR: 0.09, score: 80 });
  }
  function spawnWing(x, y) {
    mkEnt('wing', x, y == null ? rand(0.24, 0.68) : y, {
      r: 0.12, hitR: 0.12, score: 140, hp: 1, shotCd: rand(0.5, 1.1)
    });
  }
  function spawnTurret(x) {
    mkEnt('turret', x, 0, { ground: true, h: 0.42, hitR: 0.12, r: 0.12, hp: 2, score: 120, shotCd: rand(0.6, 1.2) });
  }
  function spawnTower(x) {
    mkEnt('tower', x, 0, { ground: true, h: 0.72, hitR: 0.1, r: 0.11, hp: 2, score: 70 });
  }
  function spawnRock(x, y) {
    mkEnt('rock', x, y == null ? rand(0.12, 0.72) : y, { r: 0.14, hitR: 0.14, hp: 2, score: 100 });
  }
  function spawnMine(x, y) {
    mkEnt('mine', x, y == null ? rand(0.2, 0.7) : y, { r: 0.09, hitR: 0.09, score: 90 });
  }
  function spawnRing(x, y) {
    mkEnt('ring', x, y == null ? rand(0.28, 0.62) : y, {
      r: 0.18, hitR: 0.2, score: 200, shootable: false, solid: false, pass: true
    });
  }
  function spawnArch(x) {
    mkEnt('arch', x, 0, {
      ground: true, h: 0.82, hitR: 0.22, r: 0.22, score: 250,
      shootable: false, solid: true, pass: true
    });
  }
  function spawnGate(x, y) {
    mkEnt('gate', x, y == null ? 0.42 : y, {
      r: 0.28, hitR: 0.3, score: 180, shootable: false, solid: true, pass: true, h: 0.28
    });
  }
  function spawnEshot(x, y, z, hx, hy) {
    mkEnt('eshot', x, y, {
      z: z, shootable: false, r: 0.055, hitR: 0.06, score: 0,
      vx: hx || 0, vy: hy || 0, ground: false, solid: true
    });
  }

  function spawnBoss() {
    const st = stageDef();
    const hp = isChaos() ? st.hpD : st.hp;
    G.bossOn = true;
    G.bossDead = false;
    G.bossHp = hp;
    G.bossMax = hp;
    mkEnt('boss', 0, 0.42, {
      z: 0.96, r: 0.24, hitR: 0.22, hp: hp, score: st.score,
      shotCd: 0.7, form: st.boss, shootable: true, solid: true
    });
    audio.boss();
    radio('老鸟', st.bossName + '出现了！', true);
    screenFlash(FOX, 0.34);
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
    const x2 = clamp(x + rand(0.22, 0.42) * (Math.random() < 0.5 ? 1 : -1), -0.86, 0.86);
    if (th === 'grass') {
      const r = Math.random();
      if (r < 0.18) spawnRing(x, threatY());
      else if (r < 0.34) spawnArch(x);
      else if (r < 0.5) { spawnTower(x); if (Math.random() < 0.4) spawnTower(x2); }
      else if (r < 0.66) spawnTurret(x);
      else if (r < 0.84) spawnDrone(x, threatY());
      else spawnWing(x, threatY());
      return;
    }
    if (th === 'rock') {
      const r = Math.random();
      if (r < 0.16) spawnRing(x, threatY());
      else if (r < 0.42) spawnRock(x, threatY());
      else if (r < 0.58) spawnMine(x, threatY());
      else if (r < 0.78) spawnDrone(x, threatY());
      else spawnWing(x, threatY());
      return;
    }
    const r = Math.random();
    if (r < 0.16) spawnRing(x, threatY());
    else if (r < 0.36) spawnGate(x, threatY());
    else if (r < 0.54) spawnMine(x, threatY());
    else if (r < 0.74) spawnDrone(x, threatY());
    else if (r < 0.9) spawnWing(x, threatY());
    else spawnRock(x, threatY());
  }

  function spawnInterval() {
    let base = G.bossOn ? 0.64 : 0.42;
    if (isChaos()) base *= 0.6;
    if (G.combo >= 8) base *= 0.9;
    if (G.stageI >= 1) base *= 0.92;
    if (G.boosting) base *= 0.86;
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
    if (G.combo === 8) radio('隼', '连上了！', false);
    if (G.combo === 16) radio('老鸟', '漂亮的航线！', false);
  }

  function killRgb(en) {
    if (en.kind === 'rock' || en.kind === 'tower' || en.form === 'whale') return FOX;
    if (en.kind === 'mine' || en.kind === 'eshot') return MAG;
    if (en.kind === 'drone' || en.kind === 'wing') return LAS;
    if (en.kind === 'turret' || en.form === 'mech') return GOLD;
    if (en.kind === 'boss' || en.form === 'face') return MAG;
    return CYN;
  }

  function killEnt(en) {
    project(en.x, en.ground ? 0 : en.y, en.z, P);
    const rgb = killRgb(en);
    const pow = en.kind === 'boss' ? 2.8 : en.kind === 'rock' ? 1.4 : 1;
    juice(P.x, P.y - (en.ground ? 18 : 0), rgb, pow);
    if (en.kind === 'rock' || en.kind === 'tower') audio.rock();
    else audio.hit(G.combo + 1);
    audio.boom(en.kind === 'boss' || en.kind === 'mine' || en.kind === 'rock');
    hitStop(en.kind === 'boss' ? 0.078 : 0.042);
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
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play' || rolling()) return;
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
      radio('蛙', '机翼受损！', true);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.endT > 0) return;
    if (G.fireCd > 0) return;
    if (G.shots.length >= 10) return;
    G.fireCd = fireGap();
    G.muzzle = 0.07;
    const spread = 0.046;
    G.shots.push({ x: G.px - spread, y: G.py + 0.03, z: 0.14, vz: 2.05 });
    G.shots.push({ x: G.px + spread, y: G.py + 0.03, z: 0.14, vz: 2.05 });
    audio.shoot();
    if (REDUCE) return;
    const ps = playerScreen();
    emit(5, {
      x: ps.x, y: ps.y - 10, j: 4,
      vx0: -40, vx1: 40, vy0: -130, vy1: -24,
      r0: 1, r1: 2.2, life: 0.16, rgb: LAS, g: 0
    });
  }

  function startRoll(dir) {
    if (G.mode !== 'play' || G.deadT > 0 || rolling()) return;
    G.rollT = 0.46;
    G.rollDir = dir;
    G.rollAng = 0;
    G.invuln = Math.max(G.invuln, 0.52);
    audio.roll();
    const ps = playerScreen();
    emit(10, {
      x: ps.x, y: ps.y, j: 10,
      vx0: -180, vx1: 180, vy0: -80, vy1: 80,
      r0: 1, r1: 2.6, life: 0.22, rgb: CYN, g: 0
    });
    popSpark(ps.x, ps.y, CYN, 18);
    radioTok += 1;
    if (radioTok % 3 === 1) radio('老鸟', '做个桶滚！', false);
  }

  function collectPass(en) {
    if (en.used) return;
    en.used = true;
    project(en.x, en.ground ? 0.28 : en.y, en.z, P);
    const pts = (en.score || 180) * G.mult;
    audio.ring();
    floatText(P.x, P.y, '+' + pts, GOLD, true);
    popSpark(P.x, P.y, GOLD, 22);
    emit(12, {
      x: P.x, y: P.y, j: 12,
      vx0: -160, vx1: 160, vy0: -180, vy1: 40,
      r0: 1, r1: 2.8, life: 0.32, rgb: GOLD, g: 40
    });
    bumpCombo();
    addScore(pts);
    hitStop(0.036);
    if (en.kind === 'ring') toast('穿环', false, true);
    else if (en.kind === 'arch') toast('穿拱', false, true);
    else toast('穿门', false, true);
  }

  function nextStage() {
    if (lastStage()) return;
    G.stageI += 1;
    G.stageDist = 0;
    G.bossOn = false;
    G.bossDead = false;
    G.readyT = 0.95;
    G.clearT = 0;
    G.gap = 1;
    addScore(800);
    audio.stage();
    toast('下一关 · ' + stageDef().name, false, true);
    screenFlash(GOLD, 0.3);
    G.invuln = Math.max(G.invuln, 0.75);
    G.boost = Math.min(1, G.boost + 0.35);
    hud();
  }

  function finishWin() {
    const bonus = 2500 + G.lives * 400;
    G.score += bonus;
    maybeBest();
    G.mode = 'win';
    audio.win();
    showOverlay('win', '通关', '魔核打穿　·　' + (G.score | 0) + ' 分　·　最高连 ' + G.comboMax);
    hud();
  }

  function finishLose() {
    G.mode = 'lose';
    maybeBest();
    audio.lose();
    showOverlay('lose', '坠轨了', '飞到 ' + stageDef().name + '　·　' + (G.score | 0) + ' 分。撞物或中弹扣命。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'chaos' ? 'chaos' : 'core';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.dist = 0;
    G.stageI = 0;
    G.stageDist = 0;
    G.px = 0;
    G.py = 0.38;
    G.visX = 0;
    G.visY = 0.38;
    G.bank = 0;
    G.rollT = 0;
    G.rollAng = 0;
    G.tapL = -9;
    G.tapR = -9;
    G.boosting = false;
    G.boost = 1;
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
    G.flashRgb = FOX;
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
    G.gap = 1;
    G.radioT = 2.2;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    hideOverlay();
    audio.start();
    toast(isChaos() ? '乱轨 · 更密更快' : '星核 · 草星出发', false, true);
    hud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'core';
    G.stageI = 0;
    G.dist = 0;
    G.stageDist = 0;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.px = 0;
    G.py = 0.38;
    G.visX = 0;
    G.visY = 0.38;
    G.deadT = 0;
    G.invuln = 0;
    G.bossOn = false;
    G.bossDead = false;
    G.endT = 0;
    G.clearT = 0;
    G.spawnT = 0.28;
    G.boost = 1;
    G.boosting = false;
    G.rollT = 0;
    G.gap = 1;
    clearField();
    showOverlay('title', '星狐', '沿轨飞。躲弹开火，撞了扣命。短关之后是头目。');
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else startGame(G.kind || 'core');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function updateGhosts() {
    if (REDUCE) return;
    const ps = playerScreen();
    ghosts.push({ x: ps.x, y: ps.y, bank: G.bank, roll: G.rollAng, t: 0.14, boost: G.boosting });
    capArr(ghosts, G.boosting ? 10 : 6);
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
      const ty = clamp(1 - (pointer.y - (HORIZON + 48)) / (VH - HORIZON - 92), 0.04, 0.92);
      G.px = lerp(G.px, tx, 1 - Math.exp(-dt * 11));
      G.py = lerp(G.py, ty, 1 - Math.exp(-dt * 11));
    } else if (G.mode === 'title') {
      G.px = Math.sin(G.t * 0.7) * 0.56;
      G.py = 0.38 + Math.sin(G.t * 0.92) * 0.2;
    } else {
      if (ax && ay) {
        ax *= 0.75;
        ay *= 0.75;
      }
      G.px = clamp(G.px + ax * spd * dt, -0.92, 0.92);
      G.py = clamp(G.py + ay * spd * 0.88 * dt, 0.05, 0.9);
    }

    const wantBoost = (keys.boost || (btnBoost && btnBoost.classList.contains('held'))) && G.mode === 'play' && G.deadT <= 0;
    const was = G.boosting;
    if (wantBoost && G.boost > 0.04) {
      if (!G.boosting) audio.boost();
      G.boosting = true;
      G.boost = Math.max(0, G.boost - dt * 0.42);
      if (G.boost <= 0) G.boosting = false;
    } else {
      G.boosting = false;
      G.boost = Math.min(1, G.boost + dt * 0.22);
    }
    if (was && !G.boosting && G.boost < 0.12) toast('推进耗尽', true, false);

    if (rolling()) {
      G.rollT -= dt;
      G.rollAng += G.rollDir * TAU * dt / 0.46;
      if (G.rollT <= 0) {
        G.rollT = 0;
        G.rollAng = 0;
      }
    }

    const dx = G.px - G.visX;
    const rollBank = rolling() ? Math.sin(G.rollAng) * 1.2 : 0;
    G.bank = lerp(G.bank, clamp(dx * 8 + (keys.r ? 1 : 0) - (keys.l ? 1 : 0) + rollBank, -1.2, 1.2), 1 - Math.exp(-dt * 10));
    G.visX = lerp(G.visX, G.px, 1 - Math.exp(-dt * 14));
    G.visY = lerp(G.visY, G.py, 1 - Math.exp(-dt * 14));

    if (stageDef().theme === 'shaft' && G.mode === 'play') {
      const pulse = 0.78 + Math.sin(G.dist * 1.15) * (isChaos() ? 0.2 : 0.14);
      G.gap = lerp(G.gap, pulse, 1 - Math.exp(-dt * 2.2));
      if (G.deadT <= 0 && G.invuln <= 0 && !rolling() && Math.abs(G.px) > G.gap * 0.92) {
        playerHit();
      }
    } else {
      G.gap = lerp(G.gap, 1, dt * 3);
    }
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
          r0: 1, r1: 2.4, life: 0.2, rgb: LAS, g: 80
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
    if (form === 'mech') {
      const tz = 0.46 + Math.sin(en.t * 0.8) * 0.04;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.6));
      en.x = Math.sin(en.t * 1.05) * 0.55;
      en.y = 0.18 + Math.abs(Math.sin(en.t * 2.1)) * 0.16;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.62) {
        en.shotCd = isChaos() ? 0.72 : 0.98;
        spawnEshot(en.x, en.y + 0.12, en.z - 0.02, (G.px - en.x) * 0.36, (G.py - en.y) * 0.28);
        if (isChaos()) spawnEshot(en.x, en.y + 0.08, en.z - 0.02, (G.px - en.x) * 0.22, (G.py - en.y) * 0.18);
      }
    } else if (form === 'whale') {
      const tz = 0.44 + Math.sin(en.t * 0.7) * 0.05;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.5));
      en.x = Math.sin(en.t * 0.85) * 0.5;
      en.y = 0.38 + Math.sin(en.t * 1.4) * 0.16;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.62) {
        en.shotCd = isChaos() ? 0.78 : 1.05;
        spawnMine(en.x + rand(-0.12, 0.12), en.y);
        G.ents[G.ents.length - 1].z = en.z - 0.06;
        spawnEshot(en.x, en.y, en.z - 0.02, (G.px - en.x) * 0.3, (G.py - en.y) * 0.24);
      }
    } else {
      const tz = 0.4 + Math.sin(en.t * 0.65) * 0.04;
      en.z = lerp(en.z, tz, 1 - Math.exp(-dt * 1.4));
      en.x = Math.sin(en.t * 0.9) * 0.48;
      en.y = 0.4 + Math.sin(en.t * 1.1) * 0.14;
      en.shotCd -= dt;
      if (playing && en.shotCd <= 0 && en.z < 0.62) {
        en.shotCd = isChaos() ? 0.56 : 0.76;
        const n = isChaos() ? 5 : 4;
        for (let k = 0; k < n; k++) {
          const a = (k - (n - 1) * 0.5) * 0.12;
          spawnEshot(en.x + a * 0.35, en.y, en.z - 0.02, (G.px - en.x) * 0.32 + a, (G.py - en.y) * 0.24);
        }
        if (Math.random() < 0.3) spawnDrone(rand(-0.7, 0.7), rand(0.28, 0.62));
      }
    }
  }

  function passAlign(en) {
    const dx = en.x - G.px;
    if (en.kind === 'ring') {
      return hypot(dx, (en.y - G.py) * 0.8) < 0.16;
    }
    if (en.kind === 'arch') {
      return Math.abs(dx) < 0.16 && G.py > 0.22 && G.py < 0.78;
    }
    if (en.kind === 'gate') {
      return hypot(dx, (en.y - G.py) * 0.75) < (en.h || 0.26);
    }
    return false;
  }

  function updateEnts(dt) {
    const spd = worldSpd();
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && !rolling();
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
        en.z -= (isChaos() ? 0.72 : 0.58) * dt;
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        const hx = G.px - en.x;
        const hy = G.py - en.y;
        en.vx = lerp(en.vx, hx * 0.42, dt * 1.15);
        en.vy = lerp(en.vy, hy * 0.36, dt * 1.15);
        if (rolling() && en.z < 0.28 && hypot(en.x - G.px, (en.y - G.py) * 0.75) < 0.28) {
          project(en.x, en.y, en.z, P);
          emit(8, {
            x: P.x, y: P.y, j: 8,
            vx0: -140, vx1: 140, vy0: -120, vy1: 60,
            r0: 1, r1: 2.2, life: 0.2, rgb: CYN, g: 40
          });
          audio.hit(G.combo);
          addScore(40 * G.mult);
          bumpCombo();
          G.ents.splice(i, 1);
          continue;
        }
      } else {
        en.z -= spd * dt;
        if (en.kind === 'drone') {
          en.x += Math.sin(en.t * 2.2 * en.wob + en.phase) * 0.22 * dt;
          en.y += Math.cos(en.t * 1.6 + en.phase) * 0.1 * dt;
        } else if (en.kind === 'wing') {
          en.x = lerp(en.x, G.px, dt * 0.28);
          en.y = lerp(en.y, G.py, dt * 0.18);
          en.shotCd -= dt;
          if (playing && en.shotCd <= 0 && en.z < 0.72 && en.z > 0.22) {
            en.shotCd = isChaos() ? 0.95 : 1.28;
            spawnEshot(en.x, en.y, en.z, (G.px - en.x) * 0.38, (G.py - en.y) * 0.28);
          }
        } else if (en.kind === 'turret') {
          en.shotCd -= dt;
          if (playing && en.shotCd <= 0 && en.z < 0.7 && en.z > 0.24) {
            en.shotCd = isChaos() ? 1.05 : 1.4;
            spawnEshot(en.x, 0.28, en.z, (G.px - en.x) * 0.32, (G.py - 0.28) * 0.28);
          }
        } else if (en.kind === 'mine') {
          en.x += Math.sin(en.t * 1.8 + en.phase) * 0.12 * dt;
        } else if (en.kind === 'rock') {
          en.x += Math.sin(en.t * 0.7 + en.phase) * 0.08 * dt;
        }
      }
      en.x = clamp(en.x, -1.05, 1.05);
      en.y = clamp(en.y, en.ground ? 0 : 0.02, 0.95);

      if (en.z < 0.045 || en.z > 1.28) {
        G.ents.splice(i, 1);
        continue;
      }

      if (en.z < 0.2 && en.z > 0.05 && playing && G.deadT <= 0) {
        if (en.pass && !en.used) {
          if (passAlign(en)) collectPass(en);
          else if (canHurt && en.solid) {
            const dx = en.x - G.px;
            let hit;
            if (en.kind === 'arch') hit = Math.abs(dx) < en.hitR + 0.08 && (G.py < 0.2 || G.py > 0.8 || Math.abs(dx) > 0.16);
            else if (en.kind === 'gate') hit = !passAlign(en) && hypot(dx, (en.y - G.py) * 0.75) < en.hitR;
            else hit = false;
            if (hit) playerHit();
          }
        } else if (canHurt && en.solid && !en.pass) {
          const dx = en.x - G.px;
          let hit;
          if (en.ground) {
            hit = G.py <= en.h + 0.05 && Math.abs(dx) < en.hitR + 0.1;
          } else {
            hit = hypot(dx, (en.y - G.py) * 0.75) < (en.hitR + 0.1);
          }
          if (hit) {
            playerHit();
            if (en.kind === 'eshot' || en.kind === 'mine') G.ents.splice(i, 1);
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
      if (Math.random() < 0.45) spawnDrone(rand(-0.8, 0.8));
      else if (Math.random() < 0.5) spawnTower(rand(-0.75, 0.75));
      else spawnRing(rand(-0.6, 0.6), rand(0.28, 0.62));
      return;
    }
    const st = stageDef();
    if (!G.bossOn && !G.bossDead && G.stageDist >= st.len) {
      spawnBoss();
      return;
    }
    pickSpawn();
    if (isChaos() && Math.random() < 0.48) pickSpawn();
  }

  function maybeRadio(dt) {
    if (G.mode !== 'play' || G.deadT > 0 || G.bossOn) return;
    G.radioT -= dt;
    if (G.radioT > 0) return;
    G.radioT = rand(5.5, 9);
    const lines = [
      ['隼', '冲进去！', false],
      ['蛙', '雷达有点吵。', false],
      ['老鸟', '稳住机翼。', false],
      ['隼', '左面清干净。', false],
      ['蛙', '别撞拱门！', true],
      ['老鸟', '推进留给窄道。', false]
    ];
    const L = lines[(Math.random() * lines.length) | 0];
    radio(L[0], L[1], L[2]);
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
        maybeRadio(dt);
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
          vx: G.bank * 40, t: 0.12 + (G.boosting ? 0.08 : 0) + Math.min(0.08, G.combo * 0.004)
        });
        capArr(smears, G.boosting ? 18 : 14);
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
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON + 18);
    g.addColorStop(0, rgba(pal.skyTop, 1));
    g.addColorStop(0.68, rgba(pal.skyHor, 1));
    g.addColorStop(1, rgba(pal.skyLow, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, HORIZON + 22);

    const sx = CX + 210 - G.visX * 22;
    ctx.fillStyle = rgba(pal.sun, 0.18);
    ctx.beginPath();
    ctx.arc(sx, 54, 40, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(pal.sun, 0.92);
    ctx.beginPath();
    ctx.arc(sx, 54, 18, 0, TAU);
    ctx.fill();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(G.t * 2.2 + s.tw));
      ctx.fillStyle = rgba(WHT, s.a * tw);
      ctx.fillRect(s.x - G.visX * 8 * s.z, s.y, s.r, s.r);
    }

    const th = stageDef().theme;
    if (th === 'grass') {
      const hillY = HORIZON + 8;
      ctx.beginPath();
      ctx.moveTo(0, hillY);
      for (let i = 0; i <= 18; i++) {
        const hx = (i / 18) * VW;
        const n = hash2((i + 7) * 19);
        const h = 18 + n * 58;
        ctx.lineTo(hx - G.visX * 26, hillY - h);
      }
      ctx.lineTo(VW, hillY);
      ctx.closePath();
      ctx.fillStyle = rgba(pal.hill, 1);
      ctx.fill();
    } else if (th === 'rock') {
      ctx.fillStyle = rgba(FOX, 0.12);
      ctx.beginPath();
      ctx.arc(CX + 160 - G.visX * 10, 70, 34, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba([48, 22, 16], 0.95);
      ctx.beginPath();
      ctx.arc(CX + 160 - G.visX * 10, 70, 22, 0, TAU);
      ctx.fill();
    }
  }

  function drawGrass(pal) {
    const tz = 0.085;
    const scroll = G.dist % tz;
    for (let i = 22; i >= 0; i--) {
      const z0 = 0.08 + i * tz - scroll;
      const z1 = z0 + tz;
      if (z1 < 0.07 || z0 > 1.2) continue;
      const fog = clamp((z0 - 0.08) / 1.05, 0, 1);
      for (let j = -8; j < 8; j++) {
        const x0 = j * 0.22 - G.visX * 0.02;
        const x1 = x0 + 0.22;
        project(x0, 0, Math.max(0.06, z0), P);
        project(x1, 0, Math.max(0.06, z0), P2);
        project(x1, 0, z1, P3);
        project(x0, 0, z1, P4);
        const mid = j === -1 || j === 0;
        const col = mid ? [86, 58, 28] : ((j & 1) ? pal.laneA : pal.laneB);
        const mix = [
          (col[0] + pal.skyHor[0] * fog * 0.4) | 0,
          (col[1] + pal.skyHor[1] * fog * 0.4) | 0,
          (col[2] + pal.skyHor[2] * fog * 0.4) | 0
        ];
        quad(P.x, P.y, P2.x, P2.y, P3.x, P3.y, P4.x, P4.y, mix, 1);
      }
    }
    ctx.strokeStyle = rgba(GOLD, 0.16);
    ctx.lineWidth = 1.4;
    for (let k = -2; k <= 2; k++) {
      project(k * 0.38, 0, 1.12, P);
      project(k * 0.38, 0, 0.08, P2);
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P2.x, P2.y);
      ctx.stroke();
    }
  }

  function drawShaft(pal) {
    const tz = 0.09;
    const scroll = G.dist % tz;
    const gap = G.gap;
    for (let i = 20; i >= 0; i--) {
      const z = 0.1 + i * tz - scroll;
      if (z < 0.08 || z > 1.15) continue;
      const fog = clamp((z - 0.08) / 1.0, 0, 1);
      project(-gap, 0.02, z, P);
      project(gap, 0.02, z, P2);
      project(gap, 0.92, z, P3);
      project(-gap, 0.92, z, P4);
      ctx.strokeStyle = rgba(i & 1 ? pal.fog : FOX, 0.22 + (1 - fog) * 0.35);
      ctx.lineWidth = 2.2 - fog * 1.4;
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P2.x, P2.y);
      ctx.lineTo(P3.x, P3.y);
      ctx.lineTo(P4.x, P4.y);
      ctx.closePath();
      ctx.stroke();
      if (i % 2 === 0) {
        ctx.fillStyle = rgba(pal.laneB, 0.18 + (1 - fog) * 0.12);
        ctx.fill();
      }
    }
    ctx.fillStyle = rgba(MAG, 0.08 + (1 - G.gap) * 0.16);
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawRockField(pal) {
    ctx.fillStyle = rgba(pal.skyLow, 1);
    ctx.fillRect(0, HORIZON, VW, VH - HORIZON);
    const tz = 0.11;
    const scroll = G.dist % tz;
    ctx.strokeStyle = rgba(FOX, 0.1);
    ctx.lineWidth = 1;
    for (let i = 12; i >= 0; i--) {
      const z = 0.12 + i * tz - scroll;
      if (z < 0.08) continue;
      project(-1.2, 0, z, P);
      project(1.2, 0, z, P2);
      ctx.beginPath();
      ctx.moveTo(P.x, P.y);
      ctx.lineTo(P2.x, P2.y);
      ctx.stroke();
    }
  }

  function drawWorld(pal) {
    const th = stageDef().theme;
    if (th === 'shaft') drawShaft(pal);
    else if (th === 'rock') drawRockField(pal);
    else drawGrass(pal);
  }

  function drawSmear() {
    if (REDUCE) return;
    const vpX = CX - G.visX * 22;
    const vpY = HORIZON;
    const n = 10 + Math.min(10, G.combo) + (G.boosting ? 6 : 0);
    ctx.save();
    for (let i = 0; i < n; i++) {
      const a = -0.82 + (i / Math.max(1, n - 1)) * 1.64;
      const len = 44 + worldSpd() * 110 + (G.boosting ? 40 : 0);
      ctx.strokeStyle = rgba(i % 2 ? FOX : LAS, 0.06 + (G.boosting ? 0.06 : 0) + (isChaos() ? 0.03 : 0));
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(vpX + Math.sin(a) * len * 4.1, vpY + Math.cos(a) * len * 0.82 + 78);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      const a = clamp(s.t / 0.2, 0, 1);
      ctx.fillStyle = rgba(G.boosting ? CYN : FOX, 0.1 * a);
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 16, 10, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawShadow(en, sc) {
    project(en.x, 0, en.z, P4);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(P4.x, P4.y, sc * 0.46, sc * 0.14, 0, 0, TAU);
    ctx.fill();
  }

  function drawDrone(p, sc, flash, t) {
    const bob = Math.sin(t * 8) * sc * 0.04;
    ctx.fillStyle = flash ? rgba(WHT, 0.95) : rgba(RED, 0.95);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sc * 0.35 + bob);
    ctx.lineTo(p.x + sc * 0.42, p.y + sc * 0.18 + bob);
    ctx.lineTo(p.x - sc * 0.42, p.y + sc * 0.18 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(LAS, 0.85);
    ctx.fillRect(p.x - sc * 0.08, p.y - sc * 0.1 + bob, sc * 0.16, sc * 0.16);
  }

  function drawWing(p, sc, flash) {
    ctx.fillStyle = flash ? rgba(WHT, 0.95) : '#6a2030';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sc * 0.55);
    ctx.lineTo(p.x + sc * 0.7, p.y + sc * 0.22);
    ctx.lineTo(p.x + sc * 0.18, p.y + sc * 0.08);
    ctx.lineTo(p.x - sc * 0.18, p.y + sc * 0.08);
    ctx.lineTo(p.x - sc * 0.7, p.y + sc * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sc * 0.22);
    ctx.lineTo(p.x + sc * 0.16, p.y + sc * 0.05);
    ctx.lineTo(p.x - sc * 0.16, p.y + sc * 0.05);
    ctx.closePath();
    ctx.fill();
  }

  function drawTower(p, sc, flash) {
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#4a3020';
    ctx.fillRect(p.x - sc * 0.16, p.y - sc * 2.2, sc * 0.32, sc * 2.2);
    ctx.fillStyle = flash ? rgba(GOLD, 1) : '#8a5a28';
    ctx.fillRect(p.x - sc * 0.28, p.y - sc * 2.4, sc * 0.56, sc * 0.28);
    ctx.fillStyle = rgba(FOX, 0.85);
    ctx.fillRect(p.x - sc * 0.06, p.y - sc * 1.6, sc * 0.12, sc * 0.22);
  }

  function drawTurret(p, sc, flash) {
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#3a2818';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - sc * 0.08, sc * 0.42, sc * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = flash ? rgba(GOLD, 1) : '#6a4030';
    ctx.fillRect(p.x - sc * 0.1, p.y - sc * 0.85, sc * 0.2, sc * 0.7);
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y - sc * 0.92, sc * 0.14, 0, TAU);
    ctx.fill();
  }

  function drawRock(p, sc, flash, t) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(t * 0.6);
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#6a4830';
    ctx.beginPath();
    ctx.moveTo(-sc * 0.5, sc * 0.1);
    ctx.lineTo(-sc * 0.18, -sc * 0.46);
    ctx.lineTo(sc * 0.38, -sc * 0.32);
    ctx.lineTo(sc * 0.5, sc * 0.22);
    ctx.lineTo(sc * 0.05, sc * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(FOX, 0.45);
    ctx.beginPath();
    ctx.moveTo(-sc * 0.1, -sc * 0.1);
    ctx.lineTo(sc * 0.16, -sc * 0.18);
    ctx.lineTo(sc * 0.08, sc * 0.12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawMine(p, sc, t) {
    const pulse = 0.85 + Math.sin(t * 10) * 0.15;
    ctx.fillStyle = rgba(MAG, 0.35);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sc * 0.55 * pulse, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(RED, 0.95);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sc * 0.28, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.85);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(p.x - sc * 0.32, p.y);
    ctx.lineTo(p.x + sc * 0.32, p.y);
    ctx.moveTo(p.x, p.y - sc * 0.32);
    ctx.lineTo(p.x, p.y + sc * 0.32);
    ctx.stroke();
  }

  function drawRingEnt(p, sc, t) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(1, 0.55);
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = Math.max(2, sc * 0.12);
    ctx.beginPath();
    ctx.arc(0, 0, sc * 0.7, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(LAS, 0.55 + Math.sin(t * 8) * 0.25);
    ctx.lineWidth = Math.max(1.2, sc * 0.06);
    ctx.beginPath();
    ctx.arc(0, 0, sc * 0.52, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawArch(p, sc) {
    ctx.strokeStyle = rgba(CRM, 0.92);
    ctx.lineWidth = Math.max(3, sc * 0.18);
    ctx.beginPath();
    ctx.moveTo(p.x - sc * 0.85, p.y);
    ctx.quadraticCurveTo(p.x, p.y - sc * 2.4, p.x + sc * 0.85, p.y);
    ctx.stroke();
    ctx.strokeStyle = rgba(FOX, 0.7);
    ctx.lineWidth = Math.max(1.4, sc * 0.08);
    ctx.beginPath();
    ctx.moveTo(p.x - sc * 0.7, p.y);
    ctx.quadraticCurveTo(p.x, p.y - sc * 2.05, p.x + sc * 0.7, p.y);
    ctx.stroke();
  }

  function drawGate(p, sc) {
    ctx.strokeStyle = rgba(MAG, 0.9);
    ctx.lineWidth = Math.max(2.4, sc * 0.12);
    ctx.strokeRect(p.x - sc * 0.7, p.y - sc * 0.55, sc * 1.4, sc * 1.1);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1.3;
    ctx.strokeRect(p.x - sc * 0.38, p.y - sc * 0.28, sc * 0.76, sc * 0.56);
  }

  function drawEshot(p, sc) {
    ctx.fillStyle = rgba(MAG, 0.45);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sc * 0.55, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.arc(p.x, p.y, sc * 0.28, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(p.x - sc * 0.06, p.y - sc * 0.06, sc * 0.1, 0, TAU);
    ctx.fill();
  }

  function drawMech(p, sc, t, flash) {
    const stomp = Math.abs(Math.sin(t * 3.2)) * sc * 0.06;
    ctx.fillStyle = flash ? rgba(WHT, 0.92) : '#5a4030';
    ctx.fillRect(p.x - sc * 0.42, p.y - sc * 0.15 + stomp, sc * 0.28, sc * 0.7);
    ctx.fillRect(p.x + sc * 0.14, p.y - sc * 0.15 - stomp, sc * 0.28, sc * 0.7);
    ctx.fillStyle = flash ? rgba(GOLD, 1) : '#8a5a38';
    ctx.fillRect(p.x - sc * 0.38, p.y - sc * 0.7, sc * 0.76, sc * 0.55);
    ctx.fillStyle = rgba(FOX, 0.95);
    ctx.fillRect(p.x - sc * 0.16, p.y - sc * 1.05, sc * 0.32, sc * 0.4);
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(p.x - sc * 0.1, p.y - sc * 0.92, sc * 0.2, sc * 0.1);
  }

  function drawWhale(p, sc, t, flash) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(Math.sin(t * 1.4) * 0.08);
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#6a4030';
    ctx.beginPath();
    ctx.ellipse(0, 0, sc * 0.95, sc * 0.42, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(FOX, 0.7);
    ctx.beginPath();
    ctx.ellipse(sc * 0.2, -sc * 0.05, sc * 0.4, sc * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.beginPath();
    ctx.arc(sc * 0.55, -sc * 0.08, sc * 0.08, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#4a2818';
    ctx.beginPath();
    ctx.moveTo(-sc * 0.7, 0);
    ctx.lineTo(-sc * 1.15, -sc * 0.28);
    ctx.lineTo(-sc * 0.85, sc * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFace(p, sc, t, flash, hp, max) {
    const grim = 1 - clamp(hp / Math.max(1, max), 0, 1);
    ctx.fillStyle = flash ? rgba(WHT, 0.92) : rgba(FOX, 0.95);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, sc * 0.92, sc * 1.05, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a1810';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + sc * 0.08, sc * 0.72, sc * 0.82, 0, 0, TAU);
    ctx.fill();
    const eye = 0.7 + Math.sin(t * 6) * 0.08;
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(p.x - sc * 0.28, p.y - sc * 0.18, sc * 0.16, sc * 0.12 * eye, 0, 0, TAU);
    ctx.ellipse(p.x + sc * 0.28, p.y - sc * 0.18, sc * 0.16, sc * 0.12 * eye, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(p.x - sc * 0.28, p.y - sc * 0.18, sc * 0.06, 0, TAU);
    ctx.arc(p.x + sc * 0.28, p.y - sc * 0.18, sc * 0.06, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(RED, 0.9);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + sc * (0.38 + grim * 0.08), sc * (0.28 + grim * 0.12), sc * (0.12 + grim * 0.1), 0, 0, TAU);
    ctx.fill();
  }

  function drawBoss(p, sc, t, form, flash, en) {
    if (form === 'mech') drawMech(p, sc, t, flash);
    else if (form === 'whale') drawWhale(p, sc, t, flash);
    else drawFace(p, sc, t, flash, en.hp, G.bossMax);
  }

  function drawArwing(x, y, bank, roll, alpha, muzzle, boosting) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bank * 0.42 + roll);
    ctx.globalAlpha = alpha;
    const s = 1;
    if (boosting && !REDUCE) {
      const lg = ctx.createLinearGradient(0, 18, 0, 54);
      lg.addColorStop(0, rgba(CYN, 0.7));
      lg.addColorStop(1, rgba(LAS, 0));
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(-6, 16);
      ctx.lineTo(6, 16);
      ctx.lineTo(2, 54);
      ctx.lineTo(-2, 54);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = rgba(FOX, 0.95);
    ctx.beginPath();
    ctx.moveTo(-28 * s, 10 * s);
    ctx.lineTo(-8 * s, 4 * s);
    ctx.lineTo(-10 * s, 16 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(28 * s, 10 * s);
    ctx.lineTo(8 * s, 4 * s);
    ctx.lineTo(10 * s, 16 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CRM, 0.98);
    ctx.beginPath();
    ctx.moveTo(0, -22 * s);
    ctx.lineTo(11 * s, 14 * s);
    ctx.lineTo(0, 10 * s);
    ctx.lineTo(-11 * s, 14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.beginPath();
    ctx.moveTo(0, -14 * s);
    ctx.lineTo(5 * s, 2 * s);
    ctx.lineTo(-5 * s, 2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = muzzle ? rgba(WHT, 1) : rgba(LAS, 0.95);
    ctx.fillRect(-16 * s, 2 * s, 5 * s, 7 * s);
    ctx.fillRect(11 * s, 2 * s, 5 * s, 7 * s);
    if (muzzle) {
      ctx.fillStyle = rgba(LAS, 0.9);
      ctx.beginPath();
      ctx.arc(-13.5 * s, 0, 5, 0, TAU);
      ctx.arc(13.5 * s, 0, 5, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(FOX, 0.95);
    ctx.beginPath();
    ctx.moveTo(-3 * s, 10 * s);
    ctx.lineTo(0, 22 * s);
    ctx.lineTo(3 * s, 10 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawShot(sh) {
    project(sh.x, sh.y, sh.z, P);
    const sc = Math.max(3, 7 * P.s);
    ctx.strokeStyle = rgba(LAS, 0.95);
    ctx.lineWidth = Math.max(1.6, sc * 0.35);
    ctx.beginPath();
    ctx.moveTo(P.x, P.y + sc * 1.4);
    ctx.lineTo(P.x, P.y - sc * 1.8);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(P.x, P.y - sc * 1.6, 1.6, 0, TAU);
    ctx.fill();
  }

  function drawEnt(en) {
    if (en.kind === 'boss' && en.hp <= 0) return;
    const wy = en.ground ? 0 : en.y;
    project(en.x, wy, en.z, P);
    const sc = Math.min(175, Math.max(4, (FOCAL / Math.max(0.06, en.z)) * 30));
    const flash = en.flash > 0;
    if (en.ground || en.kind === 'rock' || en.kind === 'drone' || en.kind === 'wing') drawShadow(en, sc);
    if (en.kind === 'drone') drawDrone(P, sc, flash, en.t);
    else if (en.kind === 'wing') drawWing(P, sc, flash);
    else if (en.kind === 'tower') drawTower(P, sc, flash);
    else if (en.kind === 'turret') drawTurret(P, sc, flash);
    else if (en.kind === 'rock') drawRock(P, sc, flash, en.t);
    else if (en.kind === 'mine') drawMine(P, sc, en.t);
    else if (en.kind === 'ring') drawRingEnt(P, sc, en.t);
    else if (en.kind === 'arch') drawArch(P, sc);
    else if (en.kind === 'gate') drawGate(P, sc);
    else if (en.kind === 'eshot') drawEshot(P, sc);
    else if (en.kind === 'boss') drawBoss(P, sc, en.t, en.form, flash, en);
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
      ctx.strokeStyle = rgba(s.rgb, a * 0.85);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.rad * (0.3 + s.t * 1.4), 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, (1 - r.t) * 0.55);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * (1 + r.t * 2.2), 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = '700 ' + f.size + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, a);
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function drawHudCanvas() {
    if (!G.bossOn || G.bossMax <= 0) return;
    const t = clamp(G.bossHp / G.bossMax, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
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
    drawWorld(pal);
    drawSmear();

    const list = G.ents.slice();
    list.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < list.length; i++) drawEnt(list[i]);
    for (let i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    const ps = playerScreen();
    if (!REDUCE) {
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        drawArwing(g.x, g.y, g.bank, g.roll || 0, 0.12 * (g.t / 0.16), false, g.boost);
      }
    }
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (G.deadT <= 0 && !(blink && G.mode === 'play' && !rolling())) {
      drawArwing(ps.x, ps.y, G.bank, G.rollAng, 1, G.muzzle > 0, G.boosting);
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
    const boostKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') {
      if (down && !keys.l && G.mode === 'play') {
        if (G.t - G.tapL < 0.24) startRoll(-1);
        G.tapL = G.t;
      }
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
      if (down && !keys.r && G.mode === 'play') {
        if (G.t - G.tapR < 0.24) startRoll(1);
        G.tapR = G.t;
      }
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
    if (boostKey) keys.boost = down;

    if (down && (isMove || space || boostKey || k === 'Enter')) e.preventDefault();
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
      startGame('core');
      return;
    }
    if (k === '2') {
      startGame('chaos');
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

  function bindBoostBtn() {
    if (!btnBoost) return;
    function down(e) {
      e.preventDefault();
      audio.ensure();
      btnBoost.classList.add('held');
      keys.boost = true;
      if (btnBoost.setPointerCapture) {
        try { btnBoost.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    }
    function up() {
      btnBoost.classList.remove('held');
      keys.boost = false;
    }
    btnBoost.addEventListener('pointerdown', down);
    btnBoost.addEventListener('pointerup', up);
    btnBoost.addEventListener('pointercancel', up);
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
  bindBoostBtn();

  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
    });
  }
  if (btnChaos) {
    btnChaos.addEventListener('click', function () {
      audio.ensure();
      startGame('chaos');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'core');
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
      keys.boost = false;
      G.fireHold = false;
      pointer.down = false;
      if (btnBoost) btnBoost.classList.remove('held');
    }
  });

  requestAnimationFrame(frame);
})();
