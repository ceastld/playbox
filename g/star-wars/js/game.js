'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = 168;
  const FOCAL = 380;
  const FAR = 72;
  const FLOOR = -0.72;
  const CEIL = 0.72;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const COMBO_WIN = 1.4;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const HIT_Z0 = 2.15;
  const HIT_Z1 = 4.65;
  const BEST_KEY = 'playbox-star-wars-best';
  const MUTE_KEY = 'playbox-star-wars-mute';
  const OPS = '方向 / WASD 飞 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const GOLD = [255, 196, 74];
  const HOT = [255, 227, 107];
  const CYN = [92, 255, 176];
  const MAG = [255, 61, 92];
  const FLM = [255, 154, 50];
  const WHT = [255, 246, 228];
  const RED = [255, 72, 80];
  const GRN = [72, 255, 168];

  const WAVES = [
    { name: '前哨', len: 240, spd: 26, tw: 1.08, beam: 0.95, turret: 1.08, seq: ['L', 'R', 'L', 'U', 'R', 'D'] },
    { name: '窄廊', len: 260, spd: 30, tw: 0.98, beam: 0.80, turret: 0.82, seq: ['L', 'U', 'R', 'D', 'L', 'C', 'R'] },
    { name: '交火', len: 280, spd: 34, tw: 0.92, beam: 0.68, turret: 0.58, seq: ['U', 'L', 'D', 'R', 'C', 'U', 'L', 'W'] },
    { name: '深核', len: 280, spd: 38, tw: 0.86, beam: 0.56, turret: 0.46, seq: ['C', 'U', 'L', 'W', 'D', 'R', 'C', 'U'] }
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
  const pointer = { down: false, hover: false, x: CX, y: 280, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const smears = [];
  const stars = [];
  const beams = [];
  const turrets = [];
  const shots = [];
  const petals = [];

  const G = {
    mode: 'title',
    kind: 'core',
    t: 0,
    clock: 0,
    dist: 0,
    waveI: 0,
    waveDist: 0,
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    bank: 0,
    lives: LIVES,
    score: 0,
    best: { c: 0, m: 0 },
    combo: 0,
    comboT: 0,
    comboMax: 0,
    mult: 1,
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
    spawnBeam: 0.5,
    spawnTur: 0.8,
    spawnN: 0,
    nextLife: LIFE_EVERY,
    bossOn: false,
    bossDead: false,
    bossHp: 0,
    bossMax: 1,
    portZ: 46,
    portAng: 0,
    portFire: 0.7,
    boomT: 0,
    endT: 0,
    why: '',
    readyT: 0,
    warn: 0,
    whooshT: 0,
    bossTurT: 0,
    runSeed: 1
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
    if (a == null || a >= 0.995) return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    const k = t < 0 ? 0 : t > 1 ? 1 : t;
    return [
      (a[0] + (b[0] - a[0]) * k) | 0,
      (a[1] + (b[1] - a[1]) * k) | 0,
      (a[2] + (b[2] - a[2]) * k) | 0
    ];
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function isDense() {
    return G.kind === 'dense';
  }
  function waveDef() {
    return WAVES[G.waveI] || WAVES[WAVES.length - 1];
  }
  function kindBest() {
    return isDense() ? G.best.m : G.best.c;
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function trenchW() {
    const tw = waveDef().tw;
    return tw * (isDense() ? 0.88 : 1);
  }
  function worldSpd() {
    const base = waveDef().spd * (isDense() ? 1.22 : 1);
    const rush = G.combo >= 12 ? 3.2 : G.combo >= 6 ? 1.6 : 0;
    return G.bossOn ? (isDense() ? 16 : 13) : base + rush;
  }
  function plySpd() {
    return isDense() ? 1.95 : 1.72;
  }
  function fireGap() {
    return isDense() ? 0.074 : 0.09;
  }
  function hitR() {
    return 0.13;
  }
  function playing() {
    return G.mode === 'play' && G.deadT <= 0 && G.boomT <= 0;
  }

  function project(wx, wy, wz) {
    const z = wz < 0.42 ? 0.42 : wz;
    const s = FOCAL / z;
    const camX = G.px * 0.55;
    const camY = G.py * 0.42;
    return {
      x: CX + (wx - camX) * s,
      y: HORIZON - (wy - camY) * s * 0.78,
      s: s,
      z: z
    };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    eng: null,
    eng2: null,
    engG: null,
    engF: null,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startEngine();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
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
      f.frequency.value = hp || 700;
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
    startEngine() {
      if (!this.ctx || this.eng) return;
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      const o2 = this.ctx.createOscillator();
      o2.type = 'triangle';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 720;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      o.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start();
      o2.start();
      this.eng = o;
      this.eng2 = o2;
      this.engG = g;
      this.engF = f;
    },
    tickEngine(spd01, on) {
      if (!this.engG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on) {
        this.engG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const f = 58 + spd01 * 160 + (G.bossOn ? 36 : 0) + Math.sin(G.t * 20) * (2 + spd01 * 9);
      this.eng.frequency.setTargetAtTime(f, t, 0.045);
      this.eng2.frequency.setTargetAtTime(f * 2.05, t, 0.045);
      this.engF.frequency.setTargetAtTime(420 + spd01 * 1100 + (G.bossOn ? 220 : 0), t, 0.08);
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.02 + spd01 * 0.055), t, 0.06);
    },
    shoot() {
      this.ensure();
      this.beep(920, 0.036, 'square', 0.032, 1880);
      this.beep(380, 0.042, 'sawtooth', 0.016, 140);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.042);
      this.noise(0.036, 0.032, 1200);
      this.beep(540 * lift, 0.06, 'square', 0.044, 960 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.1, big ? 0.084 : 0.048, big ? 210 : 440);
      this.beep(big ? 140 : 240, big ? 0.28 : 0.12, 'sawtooth', 0.054, 44);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.07, 'sine', 0.038, 588 * m);
      this.beep(523 * m, 0.1, 'triangle', 0.03, 784 * m);
    },
    whoosh() {
      this.ensure();
      this.noise(0.22, 0.07, 160);
      this.beep(96, 0.18, 'sawtooth', 0.042, 280);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.07, 240);
      this.beep(260, 0.24, 'sawtooth', 0.056, 56);
      this.beep(118, 0.34, 'sine', 0.046, 34);
    },
    boss() {
      this.ensure();
      this.beep(82, 0.3, 'sawtooth', 0.058, 48);
      this.beep(128, 0.38, 'square', 0.038, 68);
    },
    portBoom() {
      this.ensure();
      this.noise(0.52, 0.13, 80);
      this.beep(88, 0.48, 'sawtooth', 0.078, 30);
      this.beep(210, 0.3, 'sine', 0.055, 52);
      this.beep(523, 0.16, 'triangle', 0.042, 1046);
    },
    warn() {
      this.ensure();
      this.beep(240, 0.06, 'square', 0.028, 170);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.038, 660);
      this.beep(660, 0.14, 'triangle', 0.038, 990);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.042, 523);
      this.beep(523, 0.1, 'triangle', 0.038, 784);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.05, 659);
      this.beep(659, 0.12, 'triangle', 0.044, 784);
      this.beep(1046, 0.26, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.22, 'sawtooth', 0.044, 80);
      this.beep(130, 0.34, 'sine', 0.046, 44);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.044, 1320);
    }
  };

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
    const count = REDUCE ? Math.max(2, (n * 0.4) | 0) : n;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb
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
    popSpark(x, y, rgb, 12 + p * 10);
    screenFlash(rgb, 0.14 + p * 0.12);
    kick(2.0 + p * 2.2);
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
    const st = waveDef();
    if (stageLabel) {
      stageLabel.textContent = G.bossOn ? '排热口' : st.name;
      stageLabel.classList.toggle('hot', G.waveI >= 1 || G.bossOn);
      stageLabel.classList.toggle('boss', G.bossOn);
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '星核' : '星战';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', G.bossOn);
    }
    if (progBar) {
      let t;
      if (G.bossOn && G.bossMax > 0) t = clamp(G.bossHp / G.bossMax, 0, 1);
      else t = clamp(G.waveDist / Math.max(20, st.len), 0, 1);
      progBar.style.transform = 'scaleX(' + t + ')';
    }
    if (progWrap) {
      progWrap.classList.toggle('boss', G.bossOn);
      progWrap.classList.toggle('low', G.bossOn && G.bossHp / G.bossMax < 0.28);
      const em = progWrap.querySelector('em');
      if (em) em.textContent = G.bossOn ? '核' : '程';
    }
    if (comboEl) {
      const show = G.mode === 'play' && G.combo >= 2;
      comboEl.hidden = !show;
      if (show) {
        comboEl.textContent = G.mult > 1 ? (G.combo + ' 连 ×' + G.mult) : (G.combo + ' 连');
        comboEl.classList.toggle('hot', comboTok > 0);
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('排热口打穿 · R 再来一局', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 撞梁或中弹扣一命', 'warn');
    else if (G.bossOn) setHint('排热口 · 钻花瓣缺口打进核心', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 贴梁会撞', 'warn');
    else if (G.warn > 0) setHint('来弹 · 侧移', 'warn');
    else setHint('方向飞 · 空格开火 · 躲梁打炮', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'DOWN' : 'STAR';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    ovStart.classList.toggle('gone', kind !== 'title');
    ovEnd.classList.toggle('gone', kind === 'title');
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function clearField() {
    beams.length = 0;
    turrets.length = 0;
    shots.length = 0;
    petals.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    smears.length = 0;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(8, HORIZON - 8),
        r: rand(0.4, 1.5),
        a: rand(0.25, 0.9),
        tw: rand(0, TAU)
      });
    }
  }

  function spawnBeam(kind, z) {
    beams.push({
      kind: kind,
      z: z == null ? FAR : z,
      hit: false,
      skimmed: false,
      dead: false
    });
  }
  function spawnTurret(side, y, z) {
    const tw = trenchW();
    turrets.push({
      side: side,
      y: y,
      z: z == null ? FAR : z,
      x: side * tw * 0.82,
      hp: 1,
      fireT: rand(0.35, 0.9),
      dead: false,
      flash: 0
    });
  }
  function turretX(t) {
    return t.x;
  }
  function spawnEshot(x, y, z, hx, hy) {
    const dx = hx - x;
    const dy = hy - y;
    const dz = 2.6 - z;
    const len = Math.max(0.2, hypot(hypot(dx, dy), Math.abs(dz)));
    const spd = isDense() ? 22 : 18;
    shots.push({
      from: 'e',
      x: x, y: y, z: z,
      vx: dx / len * spd,
      vy: dy / len * spd,
      vz: dz / len * spd,
      life: 2.4
    });
  }
  function spawnPshot(ox) {
    shots.push({
      from: 'p',
      x: G.px + ox,
      y: G.py,
      z: 3.2,
      vx: 0,
      vy: 0,
      vz: isDense() ? 64 : 56,
      life: 1.6
    });
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.comboMax) G.comboMax = G.combo;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(next);
      comboTok = 0.28;
    } else {
      G.mult = next;
    }
    comboTok = Math.max(comboTok, 0.18);
  }

  function killTurret(t) {
    if (t.dead) return;
    t.dead = true;
    bumpCombo();
    const pts = (120 * G.mult) | 0;
    addScore(pts);
    const p = project(turretX(t), t.y, t.z);
    juice(p.x, p.y, MAG, 1.15);
    floatText(p.x, p.y - 10, '+' + pts, HOT, G.mult >= 3);
    hitStop(0.048);
    audio.hit(G.combo);
    audio.boom(false);
  }

  function hurtBoss(n, sx, sy, sz) {
    if (!G.bossOn || G.bossDead || G.bossHp <= 0) return;
    G.bossHp = Math.max(0, G.bossHp - n);
    bumpCombo();
    const pts = (40 * G.mult) | 0;
    addScore(pts);
    const p = project(sx, sy, sz);
    juice(p.x, p.y, CYN, 0.85);
    floatText(p.x, p.y - 8, '+' + pts, CYN, false);
    hitStop(0.032);
    audio.hit(G.combo);
    hud();
    if (G.bossHp <= 0) {
      G.bossDead = true;
      G.boomT = 1.35;
      const bonus = 4200;
      addScore(bonus);
      floatText(CX, HORIZON, '+' + bonus, HOT, true);
      juice(CX, HORIZON, GOLD, 2.4);
      hitStop(0.078);
      audio.portBoom();
      screenFlash(HOT, 0.72);
      kick(9);
      toast('星核过载', false, true);
    }
  }

  function playerHit(why) {
    if (!playing() || G.invuln > 0) return;
    G.why = why || '撞沟了';
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.deadT = 0.85;
    G.lives -= 1;
    audio.death();
    kick(8);
    hitStop(0.074);
    screenFlash(MAG, 0.55);
    const p = project(G.px, G.py, 3.4);
    juice(p.x, p.y, MAG, 2.0);
    toast(G.why, true, false);
    syncPips();
    hud();
    for (let i = 0; i < beams.length; i++) {
      if (beams[i].z < 14) beams[i].z += 18;
    }
    for (let i = 0; i < turrets.length; i++) {
      if (!turrets[i].dead && turrets[i].z < 14) turrets[i].z += 18;
    }
    if (G.bossOn && G.portZ < 16) G.portZ += 10;
  }

  function fire() {
    if (!playing() || G.fireCd > 0) return;
    let n = 0;
    for (let i = 0; i < shots.length; i++) if (shots[i].from === 'p') n += 1;
    if (n >= (isDense() ? 18 : 16)) return;
    G.fireCd = fireGap();
    G.muzzle = 0.06;
    spawnPshot(-0.055);
    spawnPshot(0.055);
    audio.shoot();
  }

  function startBoss() {
    G.bossOn = true;
    G.bossDead = false;
    G.bossHp = isDense() ? 36 : 24;
    G.bossMax = G.bossHp;
    G.portZ = 48;
    G.portAng = 0;
    G.portFire = 0.9;
    petals.length = 0;
    const n = isDense() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      petals.push({ a: (i / n) * TAU, w: (TAU / n) * 0.42, hit: 0 });
    }
    G.bossTurT = 0;
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * TAU + 0.2;
      spawnTurret(Math.cos(ang) > 0 ? 1 : -1, Math.sin(ang) * 0.32, 42 + i * 1.4);
    }
    audio.boss();
    toast('排热口出现了', false, true);
    screenFlash(GOLD, 0.28);
    hud();
  }

  function nextWave() {
    const bonus = 600 + G.waveI * 180;
    addScore(bonus);
    G.waveI += 1;
    if (G.waveI >= WAVES.length) {
      startBoss();
      return;
    }
    G.waveDist = 0;
    G.invuln = Math.max(G.invuln, 0.42);
    audio.wave();
    toast(waveDef().name, false, true);
    hud();
  }

  function finishWin() {
    G.mode = 'win';
    const extra = 3000 + G.lives * 400;
    addScore(extra);
    maybeBest();
    audio.win();
    showOverlay('win', '星核崩了', '排热口打穿。+' + extra + '  连击最高 ' + G.comboMax + '。');
    hud();
  }
  function finishLose() {
    G.mode = 'lose';
    maybeBest();
    audio.lose();
    showOverlay('lose', '坠沟了', G.why + '。三命扣完。R 再飞一局。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'dense' ? 'dense' : 'core';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.dist = 0;
    G.waveI = 0;
    G.waveDist = 0;
    G.px = 0;
    G.py = 0;
    G.vx = 0;
    G.vy = 0;
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
    G.invuln = 1.2;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0.28;
    G.flashRgb = GOLD;
    G.punch = 1;
    G.muzzle = 0;
    G.spawnBeam = 0.55;
    G.spawnTur = 0.9;
    G.spawnN = 0;
    G.nextLife = LIFE_EVERY;
    G.bossOn = false;
    G.bossDead = false;
    G.bossHp = 0;
    G.bossMax = 1;
    G.portZ = 46;
    G.portAng = 0;
    G.portFire = 0.7;
    G.boomT = 0;
    G.endT = 0;
    G.why = '';
    G.readyT = 0.35;
    G.warn = 0;
    G.whooshT = 0;
    G.bossTurT = 0;
    G.runSeed = (Math.random() * 99991) | 0;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    hideOverlay();
    audio.start();
    toast(isDense() ? '星核 · 更密更快' : '星战 · 冲进星沟', false, true);
    hud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'core';
    G.waveI = 0;
    G.dist = 0;
    G.waveDist = 0;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.px = 0;
    G.py = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.bossOn = false;
    G.bossDead = false;
    G.boomT = 0;
    G.endT = 0;
    G.spawnBeam = 0.4;
    G.spawnTur = 0.8;
    G.spawnN = 0;
    clearField();
    showOverlay('title', '星战', '冲进星沟。打炮台，钻横梁缺口。撞壁扣命。几波之后打进排热口。');
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

  function edgeX() {
    return isDense() ? 0.10 : 0.18;
  }
  function beamBlocked(kind, px, py) {
    const r = hitR();
    const e = edgeX();
    if (kind === 'L') return px - r < e;
    if (kind === 'R') return px + r > -e;
    if (kind === 'U') return py + r > 0.08;
    if (kind === 'D') return py - r < -0.08;
    if (kind === 'C') return Math.abs(px) - r < 0.30;
    if (kind === 'W') return Math.abs(px) + r > 0.38 || Math.abs(py) + r > 0.30;
    return false;
  }
  function beamClearance(kind, px, py) {
    const e = edgeX();
    if (kind === 'L') return px - e;
    if (kind === 'R') return -e - px;
    if (kind === 'U') return 0.08 - py;
    if (kind === 'D') return py + 0.08;
    if (kind === 'C') return Math.abs(px) - 0.30;
    if (kind === 'W') return Math.min(0.38 - Math.abs(px), 0.30 - Math.abs(py));
    return 1;
  }

  function inHitZ(z) {
    return z >= HIT_Z0 && z <= HIT_Z1;
  }

  function pickBeamKind() {
    const seq = waveDef().seq;
    const k = seq[G.spawnN % seq.length];
    G.spawnN += 1;
    return k;
  }

  function maybeSpawn(dt) {
    if (G.bossOn || G.mode === 'title' && overlayOpen()) {
      if (G.mode === 'title') {
        G.spawnBeam -= dt;
        if (G.spawnBeam <= 0) {
          G.spawnBeam = 1.15;
          const seq = ['L', 'R', 'U', 'D'];
          spawnBeam(seq[(G.spawnN++) % 4], FAR);
        }
      }
      return;
    }
    const w = waveDef();
    const bMul = isDense() ? 0.78 : 1;
    G.spawnBeam -= dt;
    G.spawnTur -= dt;
    if (G.spawnBeam <= 0) {
      G.spawnBeam = w.beam * bMul;
      spawnBeam(pickBeamKind(), FAR);
    }
    if (G.spawnTur <= 0) {
      G.spawnTur = w.turret * bMul;
      const side = (G.spawnN & 1) ? 1 : -1;
      const y = rand(FLOOR + 0.22, CEIL - 0.22);
      spawnTurret(side, y, FAR + rand(0, 6));
    }
  }

  function steerPlayer(dt) {
    const tw = trenchW();
    const margin = 0.16;
    const xmax = Math.max(0.2, tw - margin);
    const ymax = CEIL - 0.16;
    const ymin = FLOOR + 0.16;
    let ax = 0;
    let ay = 0;
    if (G.mode === 'title') {
      G.px = Math.sin(G.t * 0.55) * tw * 0.32;
      G.py = Math.cos(G.t * 0.42) * 0.22;
      G.bank = lerp(G.bank, Math.sin(G.t * 0.55) * 0.4, 0.12);
      return;
    }
    if (playing() && !overlayOpen()) {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay += 1;
      if (keys.d) ay -= 1;
      if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
        const tx = clamp((pointer.x - CX) / (CX * 0.72) * tw, -xmax, xmax);
        const ty = clamp((HORIZON + 48 - pointer.y) / (VH * 0.42), ymin, ymax);
        ax = clamp((tx - G.px) * 2.4, -1.4, 1.4);
        ay = clamp((ty - G.py) * 2.4, -1.4, 1.4);
      }
    }
    const spd = plySpd();
    G.vx = lerp(G.vx, ax * spd, 0.22);
    G.vy = lerp(G.vy, ay * spd, 0.22);
    G.px = clamp(G.px + G.vx * dt, -xmax, xmax);
    G.py = clamp(G.py + G.vy * dt, ymin, ymax);
    G.bank = lerp(G.bank, G.vx * 0.55, 0.18);
  }

  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.life -= dt;
      if (s.life <= 0 || s.z > FAR + 8 || s.z < 0.6) {
        shots.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        let hit = false;
        for (let j = 0; j < turrets.length; j++) {
          const t = turrets[j];
          if (t.dead) continue;
          const tx = turretX(t);
          if (Math.abs(s.x - tx) < 0.24 && Math.abs(s.y - t.y) < 0.24 && Math.abs(s.z - t.z) < 4.2) {
            killTurret(t);
            hit = true;
            break;
          }
        }
        if (!hit && G.bossOn && !G.bossDead) {
          const blocked = petalBlocks(s.x, s.y, s.z);
          if (blocked) {
            const p = project(s.x, s.y, s.z);
            emit(5, {
              x: p.x, y: p.y, j: 4,
              vx0: -80, vx1: 80, vy0: -90, vy1: 40,
              life: 0.18, r0: 1, r1: 2, rgb: GOLD
            });
            hit = true;
          } else if (Math.abs(s.x) < 0.24 && Math.abs(s.y) < 0.18 && Math.abs(s.z - G.portZ) < 6) {
            hurtBoss(1, s.x, s.y, s.z);
            hit = true;
          }
        }
        if (hit) shots.splice(i, 1);
      } else if (playing() && G.invuln <= 0) {
        if (Math.abs(s.x - G.px) < 0.16 && Math.abs(s.y - G.py) < 0.16 && s.z < 4.4 && s.z > 1.4) {
          shots.splice(i, 1);
          playerHit('中弹了');
        }
      }
    }
  }

  function petalBlocks(x, y, z) {
    if (Math.abs(z - G.portZ) > 5) return false;
    const rr = hypot(x, y);
    if (rr < 0.20) return false;
    if (rr > 0.62) return false;
    const ang = Math.atan2(y, x);
    for (let i = 0; i < petals.length; i++) {
      let d = ang - (petals[i].a + G.portAng);
      while (d > Math.PI) d -= TAU;
      while (d < -Math.PI) d += TAU;
      if (Math.abs(d) < petals[i].w) return true;
    }
    return false;
  }

  function updateBeams(dt) {
    const spd = worldSpd();
    for (let i = beams.length - 1; i >= 0; i--) {
      const b = beams[i];
      b.z -= spd * dt;
      if (b.z < 0.9) {
        beams.splice(i, 1);
        continue;
      }
      if (playing() && G.invuln <= 0 && inHitZ(b.z) && beamBlocked(b.kind, G.px, G.py)) {
        playerHit('撞梁了');
        continue;
      }
      if (!b.skimmed && b.z < HIT_Z0 && b.z > 1.1 && G.mode === 'play') {
        b.skimmed = true;
        const c = beamClearance(b.kind, G.px, G.py);
        if (c > 0 && c < 0.28) {
          addScore(40);
          G.whooshT = 0.18;
          if (G.whooshT > 0) audio.whoosh();
          const p = project(G.px, G.py, 3.2);
          floatText(p.x, p.y + 18, '+40', CYN, false);
        }
      }
    }
  }

  function updateTurrets(dt) {
    const spd = worldSpd();
    for (let i = turrets.length - 1; i >= 0; i--) {
      const t = turrets[i];
      if (t.flash > 0) t.flash -= dt;
      t.z -= spd * dt;
      if (t.dead && t.z < 2) {
        turrets.splice(i, 1);
        continue;
      }
      if (t.z < 0.9) {
        turrets.splice(i, 1);
        continue;
      }
      if (t.dead) continue;
      if (playing() && G.invuln <= 0 && inHitZ(t.z)) {
        const dx = turretX(t) - G.px;
        const dy = t.y - G.py;
        if (hypot(dx, dy) < 0.24) {
          playerHit('撞炮了');
          continue;
        }
      }
      if (G.mode === 'play' && t.z < 42 && t.z > 8) {
        t.fireT -= dt;
        if (t.fireT <= 0) {
          t.fireT = (isDense() ? 0.72 : 0.98) + rand(0, 0.28);
          t.flash = 0.08;
          spawnEshot(turretX(t), t.y, t.z, G.px + rand(-0.06, 0.06), G.py + rand(-0.05, 0.05));
          G.warn = 0.45;
          if (t.z < 22) audio.warn();
        }
      }
    }
  }

  function updateBoss(dt) {
    if (!G.bossOn) return;
    const hold = 12.5;
    if (!G.bossDead) {
      if (G.portZ > hold) G.portZ -= worldSpd() * 0.42 * dt;
      G.portAng += dt * (isDense() ? 1.35 : 1.02);
      G.portFire -= dt;
      if (G.portFire <= 0 && playing()) {
        G.portFire = isDense() ? 0.52 : 0.7;
        const spread = isDense() ? 0.22 : 0.16;
        spawnEshot(0, 0, G.portZ, G.px, G.py);
        spawnEshot(0, 0, G.portZ, G.px - spread, G.py + spread * 0.4);
        spawnEshot(0, 0, G.portZ, G.px + spread, G.py - spread * 0.4);
        G.warn = 0.5;
        audio.warn();
      }
      G.bossTurT += dt;
      if (G.bossTurT > 2.4) {
        G.bossTurT = 0;
        spawnTurret(Math.random() < 0.5 ? 1 : -1, rand(FLOOR + 0.22, CEIL - 0.22), FAR - 8);
      }
    } else {
      G.portZ += dt * 4;
    }
  }

  function updateFx(dt) {
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.warn > 0) G.warn -= dt;
    if (G.whooshT > 0) G.whooshT -= dt;
    if (comboTok > 0) comboTok -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 420 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.36) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    if (!REDUCE && (G.mode === 'play' || G.mode === 'title')) {
      smears.push({ x: CX + G.bank * 18 + rand(-40, 40), y: rand(40, VH - 40), life: 0.18 });
      capArr(smears, 18);
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].life -= dt;
      if (smears[i].life <= 0) smears.splice(i, 1);
    }
  }

  function wallCrash() {
    if (!playing() || G.invuln > 0) return;
    const tw = trenchW();
    const r = hitR();
    if (Math.abs(G.px) + r > tw - 0.02) playerHit('撞壁了');
    else if (G.py + r > CEIL - 0.02 || G.py - r < FLOOR + 0.02) playerHit('撞壁了');
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt);
      return;
    }
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.readyT > 0) G.readyT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateBeams(dt);
      updateTurrets(dt);
      updateBoss(dt);
      updateShots(dt);
      updateFx(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          finishLose();
          return;
        }
        G.px = 0;
        G.py = 0;
        G.vx = 0;
        G.vy = 0;
        G.invuln = 1.5;
        G.flash = 0.22;
        G.flashRgb = CYN;
      }
      return;
    }

    if (G.boomT > 0) {
      G.boomT -= dt;
      updateFx(dt);
      updateBoss(dt);
      if (G.boomT <= 0) finishWin();
      return;
    }

    steerPlayer(dt);
    if (G.mode === 'play' || G.mode === 'title') {
      const spd = worldSpd();
      G.dist += spd * dt;
      if (G.mode === 'play' && !G.bossOn) {
        G.waveDist += spd * dt;
        if (G.waveDist >= waveDef().len) nextWave();
      }
      maybeSpawn(dt);
      updateBeams(dt);
      updateTurrets(dt);
      updateBoss(dt);
      updateShots(dt);
      if (G.mode === 'play') wallCrash();
      if (playing() && G.fireHold && !overlayOpen()) fire();
    }
    updateFx(dt);
    audio.tickEngine(clamp(worldSpd() / 42, 0.2, 1), G.mode === 'play' || G.mode === 'title');
    if (G.clock++ % 8 === 0) hud();
  }

  function vline(x1, y1, x2, y2, rgb, a, w) {
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = w || 1;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function line3(x1, y1, z1, x2, y2, z2, rgb, a, w) {
    if (z1 < 1.15 && z2 < 1.15) return;
    const p = project(x1, y1, z1);
    const q = project(x2, y2, z2);
    vline(p.x, p.y, q.x, q.y, rgb, a, w);
  }
  function quad(x1, y1, x2, y2, x3, y3, x4, y4, rgb, a) {
    ctx.fillStyle = rgba(rgb, a);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#120e08');
    g.addColorStop(0.38, '#0a0704');
    g.addColorStop(1, '#050301');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + Math.sin(G.t * 2.2 + s.tw) * 0.45;
      ctx.fillStyle = rgba(HOT, s.a * tw * 0.7);
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
  }

  function drawTrench() {
    const tw = trenchW();
    const far = FAR;
    const near = 2.5;
    const rgb = GOLD;
    const left = -tw;
    const right = tw;
    const nf = project(left, FLOOR, near);
    const nfr = project(right, FLOOR, near);
    const ff = project(left, FLOOR, far);
    const ffr = project(right, FLOOR, far);
    const nt = project(left, CEIL, near);
    const ntr = project(right, CEIL, near);
    const ft = project(left, CEIL, far);
    const ftr = project(right, CEIL, far);
    quad(nf.x, nf.y, nfr.x, nfr.y, ffr.x, ffr.y, ff.x, ff.y, [16, 11, 5], 0.92);
    quad(nt.x, nt.y, ntr.x, ntr.y, ftr.x, ftr.y, ft.x, ft.y, [12, 8, 4], 0.78);
    quad(nf.x, nf.y, ff.x, ff.y, ft.x, ft.y, nt.x, nt.y, [14, 10, 5], 0.88);
    quad(nfr.x, nfr.y, ffr.x, ffr.y, ftr.x, ftr.y, ntr.x, ntr.y, [14, 10, 5], 0.88);

    line3(left, FLOOR, near, left, FLOOR, far, rgb, 0.88, 1.7);
    line3(right, FLOOR, near, right, FLOOR, far, rgb, 0.88, 1.7);
    line3(left, CEIL, near, left, CEIL, far, rgb, 0.72, 1.35);
    line3(right, CEIL, near, right, CEIL, far, rgb, 0.72, 1.35);
    line3(left, FLOOR, near, left, CEIL, near, rgb, 0.55, 1.2);
    line3(right, FLOOR, near, right, CEIL, near, rgb, 0.55, 1.2);

    const gap = 7;
    const off = G.dist % gap;
    for (let z = off + 2.2; z < far; z += gap) {
      const a = clamp(0.14 + (1 - z / far) * 0.72, 0.08, 0.88);
      line3(left, FLOOR, z, right, FLOOR, z, rgb, a * 0.55, 1);
      line3(left, CEIL, z, right, CEIL, z, rgb, a * 0.4, 0.9);
      line3(left, FLOOR, z, left, CEIL, z, rgb, a, 1.15);
      line3(right, FLOOR, z, right, CEIL, z, rgb, a, 1.15);
      const mid = 0.06;
      line3(left, mid, z, left, mid, z + 1.15, rgb, a * 0.5, 1);
      line3(right, mid, z, right, mid, z + 1.15, rgb, a * 0.5, 1);
    }

    const vp = project(0, 0, far);
    ctx.fillStyle = rgba(G.bossOn ? CYN : FLM, G.bossOn ? 0.16 : 0.08);
    ctx.beginPath();
    ctx.arc(vp.x, vp.y, G.bossOn ? 34 : 24, 0, TAU);
    ctx.fill();
  }

  function drawBeam(o) {
    if (o.z < 1.5 || o.z > 74) return;
    const tw = trenchW();
    const rgb = mix(GOLD, MAG, 0.28);
    const a = clamp(1.12 - o.z / 80, 0.35, 1);
    const z = o.z;
    const z2 = z + 1.15;
    const e = edgeX();
    if (o.kind === 'L') {
      line3(-tw, FLOOR, z, e, FLOOR, z, rgb, a, 2);
      line3(-tw, CEIL, z, e, CEIL, z, rgb, a, 2);
      line3(e, FLOOR, z, e, CEIL, z, rgb, a, 2.2);
      line3(e, FLOOR, z, e, FLOOR, z2, rgb, a, 1.4);
      line3(e, CEIL, z, e, CEIL, z2, rgb, a, 1.4);
    } else if (o.kind === 'R') {
      line3(tw, FLOOR, z, -e, FLOOR, z, rgb, a, 2);
      line3(tw, CEIL, z, -e, CEIL, z, rgb, a, 2);
      line3(-e, FLOOR, z, -e, CEIL, z, rgb, a, 2.2);
      line3(-e, FLOOR, z, -e, FLOOR, z2, rgb, a, 1.4);
      line3(-e, CEIL, z, -e, CEIL, z2, rgb, a, 1.4);
    } else if (o.kind === 'U') {
      const y = 0.08;
      line3(-tw, y, z, tw, y, z, rgb, a, 2.2);
      line3(-tw, CEIL, z, tw, CEIL, z, rgb, a * 0.7, 1.3);
      line3(-tw, y, z, -tw, CEIL, z, rgb, a, 1.6);
      line3(tw, y, z, tw, CEIL, z, rgb, a, 1.6);
      line3(-tw, y, z2, tw, y, z2, rgb, a * 0.6, 1.3);
    } else if (o.kind === 'D') {
      const y = -0.08;
      line3(-tw, y, z, tw, y, z, rgb, a, 2.2);
      line3(-tw, FLOOR, z, tw, FLOOR, z, rgb, a * 0.7, 1.3);
      line3(-tw, y, z, -tw, FLOOR, z, rgb, a, 1.6);
      line3(tw, y, z, tw, FLOOR, z, rgb, a, 1.6);
      line3(-tw, y, z2, tw, y, z2, rgb, a * 0.6, 1.3);
    } else if (o.kind === 'C') {
      const c = 0.30;
      line3(-c, FLOOR, z, -c, CEIL, z, rgb, a, 2.1);
      line3(c, FLOOR, z, c, CEIL, z, rgb, a, 2.1);
      line3(-c, FLOOR, z, c, FLOOR, z, rgb, a, 1.6);
      line3(-c, CEIL, z, c, CEIL, z, rgb, a, 1.6);
      line3(-c, FLOOR, z2, c, FLOOR, z2, rgb, a * 0.55, 1.1);
    } else {
      const hx = 0.38;
      const hy = 0.30;
      line3(-hx, -hy, z, hx, -hy, z, rgb, a, 2);
      line3(hx, -hy, z, hx, hy, z, rgb, a, 2);
      line3(hx, hy, z, -hx, hy, z, rgb, a, 2);
      line3(-hx, hy, z, -hx, -hy, z, rgb, a, 2);
      line3(-tw, FLOOR, z, -hx, -hy, z, rgb, a * 0.7, 1.2);
      line3(tw, FLOOR, z, hx, -hy, z, rgb, a * 0.7, 1.2);
      line3(-tw, CEIL, z, -hx, hy, z, rgb, a * 0.7, 1.2);
      line3(tw, CEIL, z, hx, hy, z, rgb, a * 0.7, 1.2);
    }
  }

  function drawTurret(t) {
    if (t.dead || t.z < 1.5 || t.z > 74) return;
    const x = turretX(t);
    const p = project(x, t.y, t.z);
    const s = clamp(p.s * 0.046, 2, 15);
    const rgb = t.flash > 0 ? WHT : MAG;
    const a = clamp(1.1 - t.z / 80, 0.4, 1);
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x - s, p.y - s, s * 2, s * 2);
    ctx.strokeRect(p.x - s * 0.55, p.y - s * 0.55, s * 1.1, s * 1.1);
    ctx.fillStyle = rgba(t.flash > 0 ? WHT : FLM, 0.85 * a);
    ctx.beginPath();
    ctx.arc(p.x, p.y, s * 0.32, 0, TAU);
    ctx.fill();
    line3(x, t.y, t.z, x - t.side * 0.18, t.y, t.z, rgb, a, 1.2);
  }

  function drawPort() {
    if (!G.bossOn) return;
    const z = G.portZ;
    if (z < 1.4 || z > 90) return;
    const pulse = 0.5 + Math.sin(G.t * 11) * 0.25;
    const hw = 0.18;
    const hh = 0.12;
    const rgb = G.bossDead ? HOT : CYN;
    line3(-hw, -hh, z, hw, -hh, z, rgb, 0.55 + pulse * 0.4, 2.2);
    line3(hw, -hh, z, hw, hh, z, rgb, 0.55 + pulse * 0.4, 2.2);
    line3(hw, hh, z, -hw, hh, z, rgb, 0.55 + pulse * 0.4, 2.2);
    line3(-hw, hh, z, -hw, -hh, z, rgb, 0.55 + pulse * 0.4, 2.2);
    const p = project(0, 0, z);
    ctx.fillStyle = rgba(rgb, 0.16 + pulse * 0.28);
    ctx.beginPath();
    ctx.arc(p.x, p.y, clamp(p.s * 0.055, 4, 22), 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, clamp(p.s * 0.018, 1.4, 7), 0, TAU);
    ctx.fill();

    for (let i = 0; i < petals.length; i++) {
      const pet = petals[i];
      const a0 = pet.a + G.portAng - pet.w;
      const a1 = pet.a + G.portAng + pet.w;
      const r0 = 0.22;
      const r1 = 0.55;
      line3(Math.cos(a0) * r0, Math.sin(a0) * r0, z, Math.cos(a0) * r1, Math.sin(a0) * r1, z, GOLD, 0.85, 1.8);
      line3(Math.cos(a1) * r0, Math.sin(a1) * r0, z, Math.cos(a1) * r1, Math.sin(a1) * r1, z, GOLD, 0.85, 1.8);
      line3(Math.cos(a0) * r1, Math.sin(a0) * r1, z, Math.cos(a1) * r1, Math.sin(a1) * r1, z, GOLD, 0.9, 2);
      line3(Math.cos(a0) * r0, Math.sin(a0) * r0, z, Math.cos(a1) * r0, Math.sin(a1) * r0, z, GOLD, 0.55, 1.2);
    }

    if (z < 26 && !G.bossDead) {
      const sz = lerp(28, 12, clamp((26 - z) / 18, 0, 1));
      ctx.strokeStyle = rgba(GOLD, 0.55 + pulse * 0.4);
      ctx.lineWidth = 1.6;
      ctx.strokeRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = 'bold 12px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PORT', p.x, p.y - sz - 6);
    }
  }

  function drawShot(s) {
    const p = project(s.x, s.y, s.z);
    const q = project(s.x, s.y, s.z + (s.from === 'p' ? 2.6 : -2.4));
    const rgb = s.from === 'p' ? CYN : MAG;
    vline(p.x, p.y, q.x, q.y, rgb, 0.95, s.from === 'p' ? 1.8 : 1.5);
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, s.from === 'p' ? 2.2 : 2.4, 0, TAU);
    ctx.fill();
  }

  function drawCockpit() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && G.mode === 'play' && ((G.t * 18) | 0) % 2 === 0) return;
    const rgb = GOLD;
    vline(18, 18, 18, 52, rgb, 0.55, 1.4);
    vline(18, 18, 58, 18, rgb, 0.55, 1.4);
    vline(VW - 18, 18, VW - 18, 52, rgb, 0.55, 1.4);
    vline(VW - 18, 18, VW - 58, 18, rgb, 0.55, 1.4);
    vline(18, VH - 18, 18, VH - 58, rgb, 0.55, 1.4);
    vline(18, VH - 18, 58, VH - 18, rgb, 0.55, 1.4);
    vline(VW - 18, VH - 18, VW - 18, VH - 58, rgb, 0.55, 1.4);
    vline(VW - 18, VH - 18, VW - 58, VH - 18, rgb, 0.55, 1.4);

    const ch = 11;
    const cx = CX + G.bank * 8;
    const cy = 228 - G.py * 20;
    vline(cx - ch, cy, cx - 4, cy, CYN, 0.85, 1.3);
    vline(cx + 4, cy, cx + ch, cy, CYN, 0.85, 1.3);
    vline(cx, cy - ch, cx, cy - 4, CYN, 0.85, 1.3);
    vline(cx, cy + 4, cx, cy + ch, CYN, 0.85, 1.3);
    ctx.strokeStyle = rgba(CYN, 0.32);
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 22, cy - 16, 44, 32);

    const gunY = VH - 28;
    const g1 = 208 + G.bank * 12;
    const g2 = 592 + G.bank * 12;
    vline(g1 - 16, gunY + 16, g1, gunY - 8, GOLD, 0.88, 1.8);
    vline(g1 + 16, gunY + 16, g1, gunY - 8, GOLD, 0.88, 1.8);
    vline(g2 - 16, gunY + 16, g2, gunY - 8, GOLD, 0.88, 1.8);
    vline(g2 + 16, gunY + 16, g2, gunY - 8, GOLD, 0.88, 1.8);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(g1, gunY - 10, 6, 0, TAU);
      ctx.arc(g2, gunY - 10, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.55);
      ctx.beginPath();
      ctx.arc(g1, gunY - 18, 3.2, 0, TAU);
      ctx.arc(g2, gunY - 18, 3.2, 0, TAU);
      ctx.fill();
    }
  }

  function drawSmears() {
    if (REDUCE) return;
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      ctx.strokeStyle = rgba(WHT, clamp(s.life * 2.2, 0, 0.22));
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 18);
      ctx.lineTo(s.x, s.y + 28);
      ctx.stroke();
    }
  }

  function drawFx() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.36;
      ctx.strokeStyle = rgba(r.rgb, 1 - k);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r + k * 28, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = 1 - s.t / 0.28;
      ctx.fillStyle = rgba(s.rgb, k);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.rad * k * 0.35, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / (p.max || 0.4), 0, 1));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + f.size + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawHudCanvas() {
    if (G.mode !== 'play') return;
    if (G.bossOn && !G.bossDead && G.portZ < 22) {
      const pulse = 0.1 + Math.sin(G.t * 14) * 0.08;
      ctx.fillStyle = rgba(GOLD, pulse);
      ctx.fillRect(0, 0, VW, 6);
      ctx.fillRect(0, VH - 6, VW, 6);
      ctx.fillStyle = rgba(GOLD, 0.88);
      ctx.font = 'bold 14px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('打进核心  FIRE', CX, 36);
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale * G.punch, scale * G.punch);
    if (G.shake > 0 && !REDUCE) {
      ctx.translate((hash2((G.t * 90) | 0) - 0.5) * G.shake, (hash2((G.t * 90 + 9) | 0) - 0.5) * G.shake);
    }

    drawSky();
    drawTrench();
    drawSmears();

    const list = [];
    for (let i = 0; i < beams.length; i++) list.push({ z: beams[i].z, kind: 'b', ref: beams[i] });
    for (let i = 0; i < turrets.length; i++) list.push({ z: turrets[i].z, kind: 't', ref: turrets[i] });
    for (let i = 0; i < shots.length; i++) list.push({ z: shots[i].z, kind: 's', ref: shots[i] });
    if (G.bossOn) list.push({ z: G.portZ, kind: 'p', ref: null });
    list.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (it.kind === 'b') drawBeam(it.ref);
      else if (it.kind === 't') drawTurret(it.ref);
      else if (it.kind === 's') drawShot(it.ref);
      else drawPort();
    }

    drawCockpit();
    drawFx();
    drawHudCanvas();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, clamp(G.flash, 0, 0.7));
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
      startGame('core');
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
      else if (G.mode === 'title') startGame('core');
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
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

  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
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
      G.fireHold = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
