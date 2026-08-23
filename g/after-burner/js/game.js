'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = VH * 0.38;
  const FOCAL = 0.58;
  const FAR = 1.08;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 14000;
  const COMBO_WIN = 1.4;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-after-burner-best';
  const MUTE_KEY = 'playbox-after-burner-mute';
  const AUTO_SPEED_KEY = 'playbox-after-burner-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.52, 0.78, 1, 3.6];
  const OPS = '方向 / WSD 飞 · 空格机炮 · Shift / Z 导弹 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const FIRE = [255, 74, 20];
  const EMBR = [255, 122, 42];
  const GOLD = [255, 227, 107];
  const MAG = [255, 61, 120];
  const WHT = [255, 242, 230];
  const CRM = [255, 232, 208];
  const RED = [255, 80, 64];
  const LOCKC = [255, 210, 74];
  const NAVY = [28, 32, 48];

  const STAGES = [
    { name: '云原', theme: 'cloud', len: 5.4, boss: 'bomber', bossName: '重轰', hp: 16, hpD: 22, score: 1800, msl: 4 },
    { name: '峡火', theme: 'canyon', len: 5.8, boss: 'raptor', bossName: '峡隼', hp: 20, hpD: 28, score: 2400, msl: 4 },
    { name: '暮港', theme: 'harbor', len: 6.2, boss: 'carrier', bossName: '母舰', hp: 28, hpD: 40, score: 3600, msl: 4 }
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
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const btnMsl = document.getElementById('btn-msl');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const mslEl = document.getElementById('msl-label');
  const lockEl = document.getElementById('lock-label');
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
  const clouds = [];
  const P = { x: 0, y: 0, s: 1, z: 1 };
  const P2 = { x: 0, y: 0, s: 1, z: 1 };

  const G = {
    mode: 'title',
    kind: 'core',
    t: 0,
    clock: 0,
    dist: 0,
    stageI: 0,
    stageDist: 0,
    px: 0,
    py: 0.42,
    visX: 0,
    visY: 0.42,
    bank: 0,
    roll: 0,
    lives: LIVES,
    score: 0,
    best: { c: 0, m: 0 },
    combo: 0,
    comboT: 0,
    comboMax: 0,
    mult: 1,
    missiles: 12,
    ents: [],
    shots: [],
    msls: [],
    fireCd: 0,
    fireHold: false,
    mslCd: 0,
    lock: { ent: null, t: 0, locked: false, beep: 0 },
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: FIRE,
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
    escT: 0,
    warn: 0
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
  function isDense() {
    return G.kind === 'dense';
  }
  function stageDef() {
    return STAGES[G.stageI] || STAGES[0];
  }
  function kindBest() {
    return isDense() ? G.best.m : G.best.c;
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function lastStage() {
    return G.stageI >= STAGES.length - 1;
  }
  function worldSpd() {
    const base = isDense() ? 0.50 : 0.42;
    const rush = G.combo >= 12 ? 0.07 : G.combo >= 6 ? 0.04 : 0;
    return base + rush + G.stageI * 0.018;
  }
  function plySpd() {
    return isDense() ? 1.92 : 1.68;
  }
  function fireGap() {
    return isDense() ? 0.072 : 0.088;
  }
  function lockNeed() {
    return isDense() ? 0.24 : 0.34;
  }
  function mslStart() {
    return isDense() ? 10 : 12;
  }
  function mslCap() {
    return isDense() ? 14 : 16;
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
      this.beep(620, 0.038, 'square', 0.024, 1480);
      this.beep(180, 0.028, 'sawtooth', 0.012, 70);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.6, combo * 0.042);
      this.noise(0.034, 0.03, 1400);
      this.beep(480 * lift, 0.055, 'square', 0.04, 980 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.24 : 0.1, big ? 0.082 : 0.046, big ? 200 : 420);
      this.beep(big ? 130 : 220, big ? 0.3 : 0.12, 'sawtooth', 0.052, 42);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.07, 'sine', 0.038, 588 * m);
      this.beep(523 * m, 0.1, 'triangle', 0.032, 784 * m);
    },
    lockTick(p) {
      this.ensure();
      const f = 620 + p * 420;
      this.beep(f, 0.045, 'square', 0.028, f + 80);
    },
    lockOn() {
      this.ensure();
      this.beep(784, 0.07, 'square', 0.046, 1176);
      this.beep(1176, 0.12, 'triangle', 0.04, 1568);
    },
    lockHold() {
      this.ensure();
      this.beep(980, 0.04, 'sine', 0.018, 980);
    },
    missile() {
      this.ensure();
      this.noise(0.16, 0.06, 380);
      this.beep(220, 0.18, 'sawtooth', 0.046, 90);
      this.beep(520, 0.08, 'square', 0.03, 180);
    },
    empty() {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.03, 70);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.066, 260);
      this.beep(240, 0.24, 'sawtooth', 0.056, 52);
      this.beep(110, 0.36, 'sine', 0.044, 32);
    },
    stage() {
      this.ensure();
      this.beep(494, 0.08, 'square', 0.042, 659);
      this.beep(659, 0.1, 'triangle', 0.04, 880);
      this.beep(988, 0.16, 'sine', 0.046, 1318);
    },
    boss() {
      this.ensure();
      this.beep(86, 0.28, 'sawtooth', 0.06, 50);
      this.beep(132, 0.36, 'square', 0.04, 72);
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
    warn() {
      this.ensure();
      this.beep(240, 0.06, 'square', 0.028, 180);
    }
  };

  function project(wx, wy, wz, out) {
    const z = wz < 0.05 ? 0.05 : wz;
    const s = FOCAL / z;
    const camX = G.visX * 0.2;
    const camY = 0.06 + G.visY * 0.04;
    out.x = CX + (wx - camX) * s * CX;
    out.y = HORIZON - (wy - camY) * s * VH * 0.5;
    out.s = s;
    out.z = z;
  }

  function playerScreen() {
    return {
      x: CX + G.visX * CX * 0.74,
      y: lerp(VH - 38, HORIZON + 32, G.visY)
    };
  }

  function palette() {
    const th = stageDef().theme;
    if (th === 'canyon') {
      return {
        skyTop: [40, 8, 8],
        skyMid: [138, 32, 16],
        skyHor: [255, 96, 36],
        ground: [42, 16, 10],
        ground2: [90, 28, 12],
        wall: [78, 22, 10],
        accent: [255, 74, 20],
        cloud: [255, 186, 120]
      };
    }
    if (th === 'harbor') {
      return {
        skyTop: [24, 8, 22],
        skyMid: [106, 32, 56],
        skyHor: [255, 90, 48],
        ground: [16, 18, 32],
        ground2: [28, 36, 56],
        wall: [40, 24, 48],
        accent: [255, 61, 120],
        cloud: [255, 200, 170]
      };
    }
    return {
      skyTop: [42, 12, 16],
      skyMid: [196, 78, 32],
      skyHor: [255, 148, 58],
      ground: [18, 22, 36],
      ground2: [32, 44, 64],
      wall: [48, 28, 20],
      accent: [255, 122, 42],
      cloud: [255, 236, 214]
    };
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    if (autoOn && autoSpeed >= 4) return;
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
    popSpark(x, y, rgb, 12 + p * 10);
    screenFlash(rgb, 0.14 + p * 0.12);
    kick(2.0 + p * 2.2);
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
      stageLabel.classList.toggle('hot', G.stageI >= 1);
      stageLabel.classList.toggle('boss', G.bossOn);
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '燃核' : '超燃';
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
    if (mslEl) {
      mslEl.textContent = '弹 ' + G.missiles;
      mslEl.classList.toggle('low', G.missiles <= 2);
    }
    if (lockEl) {
      const locking = G.mode === 'play' && G.lock.ent && !G.lock.ent.dead;
      lockEl.hidden = !locking;
      if (locking) {
        lockEl.textContent = G.lock.locked ? 'LOCK' : '咬合';
        lockEl.classList.toggle('hot', G.lock.locked);
        lockEl.classList.toggle('warn', !G.lock.locked);
      }
    }
    if (btnMsl) btnMsl.classList.toggle('ready', !!(G.lock.locked && G.missiles > 0 && G.mode === 'play'));
    if (comboEl) {
      const show = G.mode === 'play' && G.combo >= 2;
      comboEl.hidden = !show;
      if (show) {
        comboEl.textContent = G.mult > 1 ? (G.combo + ' 连 ×' + G.mult) : (G.combo + ' 连');
        comboEl.classList.toggle('hot', comboTok > 0);
      }
    }
    if (autoOn && G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下', '');
    else if (autoOn && G.mode === 'play') setHint('自动托管 · 飞射锁定导弹 · A 停下', G.lives === 1 ? 'warn' : '');
    else if (autoOn && (G.mode === 'win' || G.mode === 'lose')) setHint('托管中 · 即将再飞 · A 停下', G.mode === 'lose' ? 'warn' : 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('航线打穿 · R 再来一局', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣一命', 'warn');
    else if (G.bossOn) setHint('头目波 · 锁定打导弹 扫射 ' + st.bossName, 'hot');
    else if (G.lock.locked) setHint('已锁定 · Shift / Z 发射导弹', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 侧移躲开近机', 'warn');
    else if (G.warn > 0) setHint('来弹 · 拉开', 'warn');
    else setHint('方向飞 · 空格机炮 · Shift 锁定导弹', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'DOWN' : 'ABRN';
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

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.msls.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    smears.length = 0;
    ghosts.length = 0;
    G.lock.ent = null;
    G.lock.t = 0;
    G.lock.locked = false;
  }

  function mkEnt(kind, x, y, extra) {
    const e = {
      kind: kind,
      x: x,
      y: y,
      z: FAR,
      hp: 1,
      max: 1,
      score: 100,
      vx: 0,
      vy: 0,
      wz: 0,
      t: 0,
      fire: rand(0.4, 1.1),
      flash: 0,
      dead: false,
      ground: false,
      form: '',
      phase: rand(0, TAU),
      w: 0.12
    };
    if (extra) {
      const keysE = Object.keys(extra);
      for (let i = 0; i < keysE.length; i++) e[keysE[i]] = extra[keysE[i]];
    }
    G.ents.push(e);
    return e;
  }

  function spawnJet(x, y) {
    return mkEnt('jet', x, y, { hp: 1, score: 100, w: 0.11, z: FAR - rand(0, 0.06) });
  }
  function spawnInt(x, y) {
    return mkEnt('int', x, y, { hp: 1, score: 160, w: 0.12, vy: rand(-0.12, 0.12) });
  }
  function spawnHvy(x, y) {
    return mkEnt('hvy', x, y, { hp: 3, max: 3, score: 280, w: 0.18 });
  }
  function spawnEsc(x, y) {
    return mkEnt('esc', x, y, { hp: 2, max: 2, score: 140, w: 0.12, z: 0.92 });
  }
  function spawnCloud(x, y, z) {
    return mkEnt('cloud', x, y, {
      z: z == null ? FAR : z,
      hp: 99,
      score: 0,
      w: rand(0.22, 0.42),
      ground: false,
      dead: false,
      deco: true
    });
  }
  function spawnIsle(x) {
    return mkEnt('isle', x, 0, { z: FAR, hp: 99, deco: true, ground: true, w: 0.28, score: 0 });
  }
  function spawnPillar(x) {
    return mkEnt('pillar', x, 0, { z: FAR, hp: 2, max: 2, score: 70, ground: true, w: 0.14, solid: true });
  }
  function spawnLight(x) {
    return mkEnt('light', x, 0, { z: FAR, hp: 99, deco: true, ground: true, w: 0.08, score: 0 });
  }
  function spawnEshot(x, y, z, hx, hy) {
    return mkEnt('shot', x, y, {
      z: z,
      hp: 1,
      score: 60,
      vx: hx,
      vy: hy,
      w: 0.055,
      bullet: true
    });
  }

  function spawnBoss() {
    G.bossOn = true;
    G.bossDead = false;
    const st = stageDef();
    const hp = isDense() ? st.hpD : st.hp;
    G.bossHp = hp;
    G.bossMax = hp;
    mkEnt('boss', 0, 0.48, {
      z: 0.86,
      hp: hp,
      max: hp,
      score: st.score,
      w: 0.34,
      form: st.boss,
      fire: 0.6
    });
    const n = isDense() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      spawnEsc(rand(-0.7, 0.7), rand(0.22, 0.7));
    }
    audio.boss();
    toast(st.bossName + ' · 头目波', true, false);
    screenFlash(MAG, 0.36);
    hud();
  }

  function countLive(kind) {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.dead && e.kind === kind) n += 1;
    }
    return n;
  }

  function spawnInterval() {
    const dense = isDense() ? 0.72 : 1;
    const base = [0.78, 0.64, 0.54][G.stageI] || 0.54;
    return (base * dense) / (G.combo >= 8 ? 1.12 : 1);
  }

  function pickSpawn() {
    const th = stageDef().theme;
    const r = Math.random();
    const x = rand(-0.72, 0.72);
    const y = rand(0.18, 0.78);
    if (th === 'cloud') {
      if (r < 0.42) {
        spawnJet(x, y);
        spawnJet(x - 0.22, clamp(y + 0.08, 0.12, 0.84));
        spawnJet(x + 0.22, clamp(y + 0.08, 0.12, 0.84));
      } else if (r < 0.7) {
        spawnJet(x - 0.28, y);
        spawnJet(x, y);
        spawnJet(x + 0.28, y);
        if (isDense()) spawnJet(x, clamp(y - 0.12, 0.12, 0.84));
      } else if (r < 0.88) spawnInt(x, y);
      else spawnHvy(x, y);
      if (Math.random() < 0.55) spawnCloud(rand(-0.9, 0.9), rand(0.35, 0.9));
      if (Math.random() < 0.28) spawnIsle(rand(-0.8, 0.8));
    } else if (th === 'canyon') {
      if (r < 0.38) {
        spawnInt(x, y);
        spawnInt(clamp(x + 0.34, -0.8, 0.8), clamp(y + 0.1, 0.14, 0.82));
      } else if (r < 0.62) spawnJet(x, y);
      else if (r < 0.82) spawnHvy(x, y);
      else {
        spawnInt(-0.45, y);
        spawnInt(0.45, y);
      }
      if (Math.random() < 0.5) spawnPillar(rand(0.45, 0.88) * (Math.random() < 0.5 ? -1 : 1));
      if (Math.random() < 0.4) spawnCloud(rand(-0.5, 0.5), rand(0.5, 0.92), FAR);
    } else {
      if (r < 0.3) {
        spawnJet(x - 0.2, y);
        spawnJet(x + 0.2, y);
        spawnInt(x, clamp(y + 0.16, 0.14, 0.84));
      } else if (r < 0.55) spawnInt(x, y);
      else if (r < 0.78) spawnHvy(x, y);
      else {
        spawnHvy(x, y);
        spawnJet(x - 0.3, clamp(y - 0.1, 0.14, 0.8));
      }
      if (Math.random() < 0.45) spawnLight(rand(-0.85, 0.85));
      if (Math.random() < 0.35) spawnCloud(rand(-0.9, 0.9), rand(0.4, 0.88));
    }
    capArr(G.ents, 56);
  }

  function bumpCombo() {
    G.combo += 1;
    if (G.combo > G.comboMax) G.comboMax = G.combo;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      comboTok = 1;
      const ps = playerScreen();
      floatText(ps.x, ps.y - 36, '×' + G.mult, GOLD, true);
    }
    hud();
  }

  function killRgb(en) {
    if (en.kind === 'boss') return MAG;
    if (en.kind === 'hvy') return EMBR;
    if (en.kind === 'int') return FIRE;
    if (en.kind === 'shot') return GOLD;
    if (en.kind === 'pillar') return [180, 90, 50];
    return FIRE;
  }

  function dropLock(en) {
    if (G.lock.ent === en) {
      G.lock.ent = null;
      G.lock.locked = false;
      G.lock.t = 0;
    }
  }

  function killEnt(en, missile) {
    if (en.dead) return;
    en.dead = true;
    dropLock(en);
    if (en.kind === 'boss') {
      G.bossOn = false;
      G.bossDead = true;
      G.bossHp = 0;
      G.clearT = 1.15;
    }
    if (G.mode !== 'play') {
      project(en.x, en.y, en.z, P);
      juice(P.x, P.y, killRgb(en), en.kind === 'boss' ? 2.4 : 1.1);
      audio.boom(en.kind === 'boss');
      return;
    }
    project(en.x, en.y, en.z, P);
    const base = en.score || 100;
    const pts = ((missile ? base * 2.1 : base) * G.mult) | 0;
    bumpCombo();
    addScore(pts);
    const rgb = killRgb(en);
    const big = en.kind === 'boss' || en.kind === 'hvy';
    audio.boom(big);
    juice(P.x, P.y, rgb, big ? 2.1 : (missile ? 1.5 : 1.05));
    floatText(P.x, P.y - 8, '+' + pts, missile ? GOLD : rgb, missile || G.mult > 1);
    hitStop(en.kind === 'boss' ? 0.078 : missile ? 0.056 : 0.042);
    if (en.kind === 'boss') {
      toast(stageDef().bossName + ' 击坠', false, true);
      screenFlash(GOLD, 0.45);
    }
    hud();
  }

  function hurtEnt(en, dmg, missile) {
    if (!en || en.dead || en.deco) return;
    if (en.kind === 'cloud' || en.kind === 'isle' || en.kind === 'light') return;
    en.hp -= dmg;
    en.flash = 0.1;
    if (en.kind === 'boss') G.bossHp = Math.max(0, en.hp);
    if (en.hp <= 0) {
      killEnt(en, missile);
      return;
    }
    project(en.x, en.y, en.z, P);
    audio.hit(G.combo);
    emit(6, {
      x: P.x, y: P.y, j: 5,
      vx0: -120, vx1: 120, vy0: -140, vy1: 40,
      r0: 1, r1: 2.2, life: 0.2, rgb: missile ? GOLD : FIRE
    });
    hitStop(0.032);
    hud();
  }

  function playerHit() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0.82;
    G.invuln = 1.5;
    G.lock.ent = null;
    G.lock.locked = false;
    G.lock.t = 0;
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
      toast('机体损毁', true, false);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.endT > 0) return;
    if (G.fireCd > 0) return;
    if (G.shots.length >= 14) return;
    G.fireCd = fireGap();
    G.muzzle = 0.07;
    const spread = 0.05;
    G.shots.push({ x: G.px - spread, y: G.py + 0.02, z: 0.16, vz: 1.95 });
    G.shots.push({ x: G.px + spread, y: G.py + 0.02, z: 0.16, vz: 1.95 });
    audio.shoot();
    if (REDUCE) return;
    const ps = playerScreen();
    emit(5, {
      x: ps.x, y: ps.y - 8, j: 4,
      vx0: -40, vx1: 40, vy0: -130, vy1: -20,
      r0: 1, r1: 2.2, life: 0.16, rgb: GOLD, g: 0
    });
  }

  function fireMissile() {
    if (G.mode !== 'play' || G.deadT > 0 || G.endT > 0) return;
    if (G.mslCd > 0) return;
    if (G.missiles <= 0) {
      toast('弹尽', true, false);
      audio.empty();
      G.mslCd = 0.28;
      return;
    }
    if (!G.lock.locked || !G.lock.ent || G.lock.ent.dead) {
      toast('未锁定', true, false);
      audio.empty();
      G.mslCd = 0.22;
      return;
    }
    const tgt = G.lock.ent;
    G.missiles -= 1;
    G.mslCd = 0.42;
    G.msls.push({
      x: G.px,
      y: G.py - 0.02,
      z: 0.16,
      ent: tgt,
      life: 1.35,
      trail: 0
    });
    audio.missile();
    hitStop(0.048);
    kick(3.2);
    screenFlash(EMBR, 0.22);
    const ps = playerScreen();
    emit(10, {
      x: ps.x, y: ps.y - 6, j: 6,
      vx0: -80, vx1: 80, vy0: -160, vy1: -20,
      r0: 1.2, r1: 3.2, life: 0.28, rgb: FIRE
    });
    hud();
  }

  function lockDist(e) {
    return Math.abs(e.x - G.px) + Math.abs(e.y - G.py) * 0.8;
  }
  function lockable(e) {
    if (!e || e.dead || e.deco || e.bullet || e.ground || e.solid) return false;
    if (e.kind === 'cloud' || e.kind === 'isle' || e.kind === 'light' || e.kind === 'shot' || e.kind === 'pillar') return false;
    if (e.z < 0.22 || e.z > 0.96) return false;
    return true;
  }
  function inLockRange(e, lim) {
    if (!lockable(e)) return false;
    return lockDist(e) < lim;
  }

  function updateLock(dt) {
    if (G.mode !== 'play' || G.deadT > 0) {
      G.lock.ent = null;
      G.lock.locked = false;
      return;
    }
    const need = lockNeed();
    let best = null;
    let bestD = 99;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!inLockRange(e, 0.62)) continue;
      const d = lockDist(e) + e.z * 0.15;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    if (G.lock.ent && (G.lock.ent.dead || !lockable(G.lock.ent))) {
      G.lock.ent = null;
      G.lock.locked = false;
      G.lock.t = 0;
    }
    const hold = G.lock.locked && inLockRange(G.lock.ent, 1.05);
    if (hold) {
      G.lock.beep -= dt;
      if (G.lock.beep <= 0) {
        G.lock.beep = 0.22;
        audio.lockHold();
      }
    } else if (best) {
      if (G.lock.ent !== best) {
        G.lock.ent = best;
        G.lock.t = Math.min(need * 0.4, G.lock.t);
        G.lock.locked = false;
      }
      G.lock.t = Math.min(need, G.lock.t + dt);
      G.lock.beep -= dt;
      if (G.lock.t >= need) {
        if (!G.lock.locked) {
          G.lock.locked = true;
          audio.lockOn();
          toast('锁定', false, true);
        }
      } else {
        G.lock.locked = false;
        if (G.lock.beep <= 0) {
          G.lock.beep = 0.11;
          audio.lockTick(G.lock.t / need);
        }
      }
    } else {
      G.lock.locked = false;
      G.lock.t = Math.max(0, G.lock.t - dt * 2.4);
      if (G.lock.t <= 0) G.lock.ent = null;
    }
  }

  function nextStage() {
    if (lastStage()) return;
    G.stageI += 1;
    G.stageDist = 0;
    G.bossOn = false;
    G.bossDead = false;
    G.readyT = 0.95;
    G.clearT = 0;
    G.escT = 0;
    const add = isDense() ? 3 : 4;
    G.missiles = Math.min(mslCap(), G.missiles + add);
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.deco && e.kind !== 'cloud' && e.kind !== 'isle' && e.kind !== 'light') {
        G.ents.splice(i, 1);
      }
    }
    G.shots.length = 0;
    G.msls.length = 0;
    addScore(900);
    audio.stage();
    toast('下一关 · ' + stageDef().name, false, true);
    screenFlash(GOLD, 0.3);
    G.invuln = Math.max(G.invuln, 0.75);
    hud();
  }

  function finishWin() {
    const bonus = 3000 + G.lives * 400 + G.missiles * 40;
    G.score += bonus;
    maybeBest();
    G.mode = 'win';
    audio.win();
    showOverlay('win', '通关', '航线打穿　·　' + (G.score | 0) + ' 分　·　最高连 ' + G.comboMax);
    hud();
  }

  function finishLose() {
    G.mode = 'lose';
    maybeBest();
    audio.lose();
    showOverlay('lose', '坠海了', '飞到 ' + stageDef().name + '　·　' + (G.score | 0) + ' 分。撞机或中弹扣命。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'dense' ? 'dense' : 'core';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.dist = 0;
    G.stageI = 0;
    G.stageDist = 0;
    G.px = 0;
    G.py = 0.42;
    G.visX = 0;
    G.visY = 0.42;
    G.bank = 0;
    G.roll = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.comboMax = 0;
    G.mult = 1;
    G.missiles = mslStart();
    G.fireCd = 0;
    G.fireHold = false;
    G.mslCd = 0;
    G.lock.ent = null;
    G.lock.t = 0;
    G.lock.locked = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0.32;
    G.flashRgb = FIRE;
    G.punch = 1;
    G.muzzle = 0;
    G.spawnT = 0.45;
    G.nextLife = LIFE_EVERY;
    G.bossOn = false;
    G.bossDead = false;
    G.bossHp = 0;
    G.bossMax = 1;
    G.endT = 0;
    G.why = '';
    G.readyT = 1.0;
    G.clearT = 0;
    G.escT = 0;
    G.warn = 0;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    for (let i = 0; i < 6; i++) {
      spawnCloud(rand(-0.9, 0.9), rand(0.4, 0.88), rand(0.35, FAR));
    }
    hideOverlay();
    audio.start();
    toast(isDense() ? '燃核 · 更密更快' : '超燃 · 云原出发', false, true);
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
    G.missiles = 12;
    G.px = 0;
    G.py = 0.42;
    G.visX = 0;
    G.visY = 0.42;
    G.deadT = 0;
    G.invuln = 0;
    G.bossOn = false;
    G.bossDead = false;
    G.endT = 0;
    G.clearT = 0;
    G.spawnT = 0.28;
    G.lock.ent = null;
    G.lock.locked = false;
    clearField();
    for (let i = 0; i < 5; i++) {
      spawnCloud(rand(-0.9, 0.9), rand(0.4, 0.88), rand(0.3, FAR));
    }
    showOverlay('title', '超燃', '冲进画面。机炮扫射，锁定后打导弹。撞机扣命。短关之后是头目波。');
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
    ghosts.push({ x: ps.x, y: ps.y, bank: G.bank, roll: G.roll, t: 0.13 });
    capArr(ghosts, 7);
  }

  function updateFx(dt) {
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.warn > 0) G.warn -= dt;
    if (comboTok > 0) comboTok -= dt;
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
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy += 40 * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].t -= dt;
      if (smears[i].t <= 0) smears.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].t -= dt;
      if (ghosts[i].t <= 0) ghosts.splice(i, 1);
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
      if (G.mode === 'title') startGame('core');
    }
    hud();
  }

  function predEnt(en, t) {
    const spd = worldSpd();
    let x = en.x;
    let y = en.y;
    let z = en.z;
    if (en.kind === 'boss') return { x: x, y: y, z: z };
    if (en.kind === 'shot') {
      z -= spd * 1.55 * t;
      x += en.vx * t;
      y += en.vy * t;
      return { x: x, y: y, z: z };
    }
    if (en.kind === 'int') {
      z -= spd * 1.12 * t;
      x += Math.sin((en.t + t) * 2.4 + en.phase) * 0.42 * t;
      y += Math.cos((en.t + t) * 1.6 + en.phase) * 0.18 * t;
    } else if (en.kind === 'hvy') {
      z -= spd * 0.78 * t;
      x += Math.sin((en.t + t) * 0.8 + en.phase) * 0.12 * t;
    } else if (en.kind === 'esc') {
      z -= spd * 0.55 * t;
      x += Math.sin((en.t + t) * 1.4 + en.phase) * 0.5 * t;
      y += Math.cos((en.t + t) * 1.1 + en.phase) * 0.2 * t;
    } else if (en.deco || en.kind === 'cloud' || en.kind === 'isle' || en.kind === 'light' || en.kind === 'pillar') {
      z -= spd * (en.kind === 'cloud' ? 1.05 : 0.95) * t;
    } else {
      z -= spd * t;
      x += Math.sin((en.t + t) * 1.1 + en.phase) * 0.08 * t;
    }
    return { x: x, y: y, z: z };
  }

  function pickAutoTarget() {
    let best = null;
    let bestS = -1e9;
    const locking = G.lock.ent && !G.lock.ent.dead && lockable(G.lock.ent);
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.dead || en.deco) continue;
      if (en.kind === 'cloud' || en.kind === 'isle' || en.kind === 'light' || en.kind === 'pillar') continue;
      if (en.z < 0.16 || en.z > 1.05) continue;
      let sc = 36 / (en.z + 0.12);
      if (en.kind === 'boss') sc += 260;
      else if (en.kind === 'hvy') sc += 95;
      else if (en.kind === 'esc') sc += 55;
      else if (en.kind === 'int') sc += 42;
      else if (en.kind === 'jet') sc += 28;
      else if (en.kind === 'shot') sc += en.z < 0.55 ? 36 : 8;
      else continue;
      sc += (en.hp || 1) * 10;
      sc -= lockDist(en) * 22;
      if (lockable(en) && G.missiles > 0) sc += 40 / (en.z + 0.2);
      if (en === autoTarget) sc += 14;
      if (locking && en === G.lock.ent) sc += G.lock.locked ? 80 : 55;
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
    const canyon = stageDef().theme === 'canyon';
    let score = 0;
    const tgt = autoTarget;
    let homeX = 0;
    let homeY = canyon ? 0.5 : 0.44;
    if (tgt && tgt.kind !== 'shot') {
      homeX = clamp(tgt.x, -0.72, 0.72);
      homeY = clamp(tgt.y, canyon ? 0.34 : 0.16, 0.82);
      const ax = 1 - Math.min(1, Math.abs(nx - tgt.x) / 0.46);
      const ay = 1 - Math.min(1, Math.abs(ny - tgt.y) / 0.46);
      const align = (ax * 78 + ay * 64) / (tgt.z + 0.16);
      score += tgt.kind === 'boss' ? align * 1.45 : align;
      if (lockable(tgt) && G.missiles > 0) {
        const ld = Math.abs(nx - tgt.x) + Math.abs(ny - tgt.y) * 0.8;
        if (ld < 0.58) score += 90 * (1 - ld / 0.58);
        else score -= (ld - 0.58) * 70;
      }
    } else if (tgt && tgt.kind === 'shot') {
      homeX = clamp(tgt.x, -0.72, 0.72);
      homeY = clamp(tgt.y, 0.18, 0.8);
      score += (1 - Math.min(1, Math.abs(nx - tgt.x) / 0.4)) * 48;
      score += (1 - Math.min(1, Math.abs(ny - tgt.y) / 0.4)) * 36;
    }
    score -= Math.abs(nx - homeX) * 88;
    score -= Math.abs(ny - homeY) * 76;
    if (Math.abs(nx) > 0.78) score -= (Math.abs(nx) - 0.78) * 240;
    if (ny < 0.12 || ny > 0.86) score -= 90;
    if (canyon && ny < 0.34) score -= (0.34 - ny) * 420;

    const times = [0.05, 0.14, 0.26, 0.42, 0.62];
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.dead) continue;
      for (let k = 0; k < times.length; k++) {
        const t = times[k];
        if (t > look + 0.5) continue;
        const p = predEnt(en, t);
        if (p.z > 0.3 || p.z < 0.04) continue;
        const soon = clamp((0.3 - p.z) / 0.26, 0.15, 1);
        if (en.solid && en.ground) {
          if (ny < 0.3) {
            const dx = Math.abs(nx - p.x);
            if (dx < 0.18) score -= 14000 * panic * soon;
            else if (dx < 0.36) score -= ((0.36 - dx) * 480) * panic * soon;
          }
        } else if (!en.deco && en.kind !== 'cloud' && en.kind !== 'isle' && en.kind !== 'light') {
          const d = hypot(nx - p.x, (ny - p.y) * 0.75);
          const rad = (en.w || 0.12) + 0.08;
          const w = en.kind === 'shot' ? 1.5 : en.kind === 'boss' ? 1.15 : 1;
          if (d < rad) score -= 16000 * panic * soon * w;
          else if (d < rad + 0.28) score -= ((rad + 0.28 - d) * 540) * panic * soon * w;
        }
      }
      if (!en.deco && !en.bullet && lockable(en) && en.z > 0.22 && en.z < 0.96) {
        const ax = 1 - Math.min(1, Math.abs(nx - en.x) / 0.5);
        const ay = 1 - Math.min(1, Math.abs(ny - en.y) / 0.5);
        if (en.kind === 'boss') score += (ax * 72 + ay * 52) / (en.z + 0.14);
        else score += (ax * 20 + ay * 16) / (en.z + 0.2);
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
    const look = 0.22;
    const spd = plySpd();
    const px = G.px;
    const py = G.py;
    const reachX = spd * look;
    const reachY = spd * look;
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
      const ny = clamp(py + dy * reachY, 0.08, 0.9);
      const s = scoreAutoPos(nx, ny, look);
      if (s > bestS) {
        bestS = s;
        bx = dx;
        by = dy;
      }
    }
    const lanes = [
      [0, 0.7], [0, 0.28], [-0.58, 0.56], [0.58, 0.56],
      [-0.58, 0.3], [0.58, 0.3], [0, 0.46]
    ];
    for (let i = 0; i < lanes.length; i++) {
      const nx = clamp(px + clamp(lanes[i][0] - px, -reachX, reachX), -0.92, 0.92);
      const ny = clamp(py + clamp(lanes[i][1] - py, -reachY, reachY), 0.08, 0.9);
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
      clamp(py + autoMoveY * reachY, 0.08, 0.9),
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
      const ty = clamp(tgt.y, stageDef().theme === 'canyon' ? 0.34 : 0.16, 0.8);
      if (tx - px < -0.07) keys.l = true;
      else if (tx - px > 0.07) keys.r = true;
      if (ty - py > 0.07) keys.u = true;
      else if (ty - py < -0.07) keys.d = true;
    }
    if (!keys.l && !keys.r && !keys.u && !keys.d && !tgt) {
      if (py < 0.38) keys.u = true;
      else if (py > 0.58) keys.d = true;
      if (px < -0.18) keys.r = true;
      else if (px > 0.18) keys.l = true;
    }

    G.fireHold = true;
    if (G.lock.locked && G.missiles > 0 && G.mslCd <= 0) fireMissile();
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame('core');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'core');
      }
    }
  }

  function steerPlayer(dt) {
    let ax = 0;
    let ay = 0;
    if (G.mode === 'title') {
      G.px = Math.sin(G.t * 0.55) * 0.42;
      G.py = 0.42 + Math.sin(G.t * 0.38) * 0.16;
    } else if (G.deadT > 0) {
      ax = 0;
      ay = 0;
    } else if (!autoOn && inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const tx = clamp((pointer.x - CX) / (CX * 0.74), -0.95, 0.95);
      const ty = clamp((VH - 38 - pointer.y) / (VH - 38 - (HORIZON + 32)), 0.06, 0.9);
      ax = (tx - G.px) * 3.2;
      ay = (ty - G.py) * 3.2;
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay += 1;
      if (keys.d) ay -= 1;
    }
    const spd = plySpd();
    G.px = clamp(G.px + ax * spd * dt, -0.92, 0.92);
    G.py = clamp(G.py + ay * spd * dt, 0.08, 0.9);
    G.visX = lerp(G.visX, G.px, 1 - Math.pow(0.001, dt));
    G.visY = lerp(G.visY, G.py, 1 - Math.pow(0.001, dt));
    const wantBank = clamp(ax, -1, 1);
    G.bank = lerp(G.bank, wantBank, 1 - Math.pow(0.0002, dt));
    const wantRoll = Math.abs(G.bank) > 0.72 ? G.bank * 0.85 : G.bank * 0.38;
    G.roll = lerp(G.roll, wantRoll, 1 - Math.pow(0.0008, dt));
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const sh = G.shots[i];
      sh.z += sh.vz * dt;
      if (sh.z > FAR) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.dead || en.deco) continue;
        if (en.kind === 'cloud' || en.kind === 'isle' || en.kind === 'light') continue;
        if (Math.abs(en.z - sh.z) > 0.08) continue;
        const rad = en.w + 0.05;
        if (Math.abs(en.x - sh.x) < rad && Math.abs(en.y - sh.y) < rad * 0.85) {
          hurtEnt(en, 1, false);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateMissiles(dt) {
    for (let i = G.msls.length - 1; i >= 0; i--) {
      const m = G.msls[i];
      m.life -= dt;
      m.trail += dt;
      let tx = m.x;
      let ty = m.y;
      let tz = m.z + 0.4;
      if (m.ent && !m.ent.dead) {
        tx = m.ent.x;
        ty = m.ent.y;
        tz = m.ent.z;
      }
      m.x = lerp(m.x, tx, 1 - Math.pow(0.0003, dt));
      m.y = lerp(m.y, ty, 1 - Math.pow(0.0003, dt));
      m.z = lerp(m.z, tz, 1 - Math.pow(0.012, dt)) + worldSpd() * dt * 0.15;
      let boom = false;
      if (m.ent && !m.ent.dead) {
        if (Math.abs(m.x - m.ent.x) < 0.12 && Math.abs(m.y - m.ent.y) < 0.12 && Math.abs(m.z - m.ent.z) < 0.1) {
          hurtEnt(m.ent, 3, true);
          boom = true;
        }
      }
      if (!boom) {
        for (let j = 0; j < G.ents.length; j++) {
          const en = G.ents[j];
          if (en.dead || en.deco || en.bullet) continue;
          if (en.kind === 'cloud' || en.kind === 'isle' || en.kind === 'light') continue;
          if (Math.abs(en.z - m.z) > 0.1) continue;
          if (Math.abs(en.x - m.x) < en.w + 0.06 && Math.abs(en.y - m.y) < en.w + 0.05) {
            hurtEnt(en, 3, true);
            boom = true;
            break;
          }
        }
      }
      if (boom || m.life <= 0 || m.z > FAR) {
        if (!boom) {
          project(m.x, m.y, m.z, P);
          emit(8, {
            x: P.x, y: P.y, j: 8,
            vx0: -140, vx1: 140, vy0: -160, vy1: 40,
            r0: 1, r1: 2.8, life: 0.24, rgb: EMBR
          });
        }
        G.msls.splice(i, 1);
      }
    }
  }

  function enemyAim(en) {
    const dx = G.px - en.x;
    const dy = G.py - en.y;
    const d = hypot(dx, dy) + 0.001;
    return { x: dx / d * 0.22, y: dy / d * 0.22 };
  }

  function tryShoot(en) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (en.z < 0.28 || en.z > 0.78) return;
    if (countLive('shot') > (isDense() ? 14 : 10)) return;
    const a = enemyAim(en);
    spawnEshot(en.x, en.y, en.z, a.x, a.y);
  }

  function updateBoss(en, dt) {
    en.t += dt;
    if (en.form === 'bomber') {
      en.x = Math.sin(en.t * 0.7) * 0.42;
      en.y = 0.48 + Math.sin(en.t * 0.45) * 0.12;
      en.z = lerp(en.z, 0.54, 1 - Math.pow(0.04, dt));
      en.fire -= dt;
      if (en.fire <= 0) {
        en.fire = isDense() ? 0.72 : 0.95;
        tryShoot(en);
        spawnEshot(en.x - 0.16, en.y, en.z, 0, -0.08);
        spawnEshot(en.x + 0.16, en.y, en.z, 0, -0.08);
      }
    } else if (en.form === 'raptor') {
      en.x = Math.sin(en.t * 1.15) * 0.58;
      en.y = 0.4 + Math.cos(en.t * 0.8) * 0.22;
      en.z = lerp(en.z, 0.5, 1 - Math.pow(0.05, dt));
      en.fire -= dt;
      if (en.fire <= 0) {
        en.fire = isDense() ? 0.55 : 0.74;
        const a = enemyAim(en);
        spawnEshot(en.x, en.y, en.z, a.x, a.y);
        spawnEshot(en.x, en.y, en.z, a.x * 0.6 + 0.12, a.y);
        spawnEshot(en.x, en.y, en.z, a.x * 0.6 - 0.12, a.y);
        if (isDense()) spawnEshot(en.x, en.y, en.z, a.x, a.y + 0.1);
      }
    } else {
      en.x = Math.sin(en.t * 0.5) * 0.28;
      en.y = 0.5 + Math.sin(en.t * 0.33) * 0.1;
      en.z = lerp(en.z, 0.58, 1 - Math.pow(0.03, dt));
      en.fire -= dt;
      if (en.fire <= 0) {
        en.fire = isDense() ? 0.48 : 0.66;
        const a = enemyAim(en);
        for (let k = -2; k <= 2; k++) {
          spawnEshot(en.x + k * 0.1, en.y - 0.04, en.z, a.x * 0.5 + k * 0.05, a.y);
        }
      }
    }
    G.bossHp = en.hp;
  }

  function updateEnts(dt) {
    const spd = worldSpd();
    const playing = G.mode === 'play' && G.deadT <= 0;
    G.warn = 0;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.dead) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.kind === 'boss') {
        updateBoss(en, dt);
      } else if (en.kind === 'shot') {
        en.z -= spd * 1.55 * dt;
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.z < 0.38) G.warn = Math.max(G.warn, 0.4);
      } else if (en.kind === 'int') {
        en.z -= spd * 1.12 * dt;
        en.x += Math.sin(en.t * 2.4 + en.phase) * 0.42 * dt;
        en.y += Math.cos(en.t * 1.6 + en.phase) * 0.18 * dt;
        en.x = clamp(en.x, -0.9, 0.9);
        en.y = clamp(en.y, 0.1, 0.88);
        en.fire -= dt;
        if (en.fire <= 0 && playing) {
          en.fire = isDense() ? 1.05 : 1.45;
          if (lockDist(en) < 0.85) tryShoot(en);
        }
      } else if (en.kind === 'hvy') {
        en.z -= spd * 0.78 * dt;
        en.x += Math.sin(en.t * 0.8 + en.phase) * 0.12 * dt;
        en.fire -= dt;
        if (en.fire <= 0 && playing) {
          en.fire = isDense() ? 1.15 : 1.55;
          tryShoot(en);
          tryShoot({ x: en.x + 0.1, y: en.y, z: en.z, vx: 0, vy: 0, w: en.w });
        }
      } else if (en.kind === 'esc') {
        en.z -= spd * 0.55 * dt;
        if (en.z < 0.48) en.z = 0.48 + Math.sin(en.t) * 0.04;
        en.x += Math.sin(en.t * 1.4 + en.phase) * 0.5 * dt;
        en.y += Math.cos(en.t * 1.1 + en.phase) * 0.2 * dt;
        en.x = clamp(en.x, -0.86, 0.86);
        en.y = clamp(en.y, 0.14, 0.84);
        en.fire -= dt;
        if (en.fire <= 0 && playing) {
          en.fire = isDense() ? 1.2 : 1.7;
          tryShoot(en);
        }
      } else if (en.deco || en.kind === 'cloud' || en.kind === 'isle' || en.kind === 'light' || en.kind === 'pillar') {
        en.z -= spd * (en.kind === 'cloud' ? 1.05 : 0.95) * dt;
      } else {
        en.z -= spd * dt;
        en.x += Math.sin(en.t * 1.1 + en.phase) * 0.08 * dt;
      }

      if (en.z < 0.05) {
        G.ents.splice(i, 1);
        continue;
      }

      if (!playing) {
        if (G.mode === 'title' && !en.deco && !en.bullet && en.z < 0.22) {
          killEnt(en, false);
        }
        continue;
      }

      const near = en.z < 0.22 && en.z > 0.08;
      const rad = (en.w || 0.12) + 0.05;
      const close = Math.abs(en.x - G.px) < rad && Math.abs(en.y - G.py) < rad * 0.9;
      if (en.bullet && en.z < 0.2 && close) {
        playerHit();
        en.dead = true;
        continue;
      }
      if (en.solid && en.ground && G.py < 0.28 && near && Math.abs(en.x - G.px) < 0.16) {
        playerHit();
        hurtEnt(en, 1, false);
        continue;
      }
      if (!en.deco && !en.bullet && en.kind !== 'cloud' && en.kind !== 'isle' && en.kind !== 'light' && near && close) {
        playerHit();
        if (en.kind !== 'boss') killEnt(en, false);
      }
    }
  }

  function maybeSpawn(dt) {
    if (G.mode === 'title') {
      G.spawnT -= dt;
      if (G.spawnT <= 0) {
        G.spawnT = rand(0.65, 1.35);
        const x = rand(-0.7, 0.7);
        const y = rand(0.2, 0.72);
        if (Math.random() < 0.7) spawnJet(x, y);
        else spawnInt(x, y);
        if (Math.random() < 0.6) spawnCloud(rand(-0.9, 0.9), rand(0.4, 0.9));
      }
      return;
    }
    if (G.mode !== 'play' || G.endT > 0) return;
    if (G.bossOn) {
      G.escT -= dt;
      if (G.escT <= 0) {
        G.escT = isDense() ? 2.1 : 2.8;
        if (countLive('esc') < (isDense() ? 4 : 3)) spawnEsc(rand(-0.7, 0.7), rand(0.22, 0.72));
      }
      return;
    }
    if (G.bossDead || G.clearT > 0 || G.readyT > 0) return;
    if (G.stageDist >= stageDef().len) {
      spawnBoss();
      return;
    }
    G.spawnT -= dt;
    if (G.spawnT <= 0) {
      G.spawnT = spawnInterval();
      pickSpawn();
    }
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
        if (G.mslCd > 0) G.mslCd -= dt;
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
          if (G.clearT <= 0) {
            if (lastStage()) {
              G.why = 'win';
              G.endT = 0.85;
            } else nextStage();
          }
        }
        updateLock(dt);
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
      updateMissiles(dt);
      updateEnts(dt);
      updateGhosts();
      if (!REDUCE && (G.mode === 'play' || G.mode === 'title')) {
        const ps = playerScreen();
        smears.push({
          x: ps.x, y: ps.y,
          vx: G.bank * 48, t: 0.12 + Math.min(0.08, G.combo * 0.004)
        });
        capArr(smears, 16);
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
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, rgba(pal.skyTop, 1));
    g.addColorStop(0.38, rgba(pal.skyMid, 1));
    g.addColorStop(0.52, rgba(pal.skyHor, 1));
    g.addColorStop(0.58, rgba(pal.ground, 1));
    g.addColorStop(1, rgba(pal.ground2, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = rgba(GOLD, 0.55);
    ctx.beginPath();
    ctx.arc(VW * 0.78, HORIZON - 28, 18, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.12);
    ctx.beginPath();
    ctx.arc(VW * 0.78, HORIZON - 28, 42, 0, TAU);
    ctx.fill();
  }

  function drawGround(pal) {
    const th = stageDef().theme;
    const cam = G.visX * 40;
    const scroll = G.dist * 90;
    if (th === 'canyon') {
      for (let i = 0; i < 10; i++) {
        const z0 = 0.12 + i * 0.1;
        const z1 = z0 + 0.1;
        project(-1.35, 0.02, z0, P);
        project(-0.55, 0.02, z0, P2);
        const y0 = P.y;
        project(-1.35, 0.02, z1, P);
        const y1 = P.y;
        const shade = mix(pal.wall, pal.ground2, i / 10);
        quad(0, y0, P2.x + cam * 0.02, y0, CX - 80, y1, 0, y1, shade, 1);
        project(0.55, 0.02, z0, P);
        project(1.35, 0.02, z0, P2);
        quad(VW, y0, P.x - cam * 0.02, y0, CX + 80, y1, VW, y1, shade, 1);
      }
      ctx.fillStyle = rgba([255, 90, 30], 0.12);
      ctx.fillRect(0, HORIZON + 8, VW, 18);
    } else {
      for (let i = 0; i < 14; i++) {
        const z = 0.1 + i * 0.07;
        project(-1.6, 0, z, P);
        project(1.6, 0, z, P2);
        const y = P.y;
        const k = (i + ((scroll * 0.04) | 0)) % 2;
        ctx.strokeStyle = rgba(k ? pal.accent : WHT, 0.08 + (1 - i / 14) * 0.12);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(VW, y);
        ctx.stroke();
      }
      if (th === 'harbor') {
        for (let n = 0; n < 8; n++) {
          const hx = ((n * 97 + scroll * 0.2) % 220) - 110;
          const hz = 0.35 + (n % 5) * 0.12;
          project(hx / 140, 0.02, hz, P);
          const h = 18 + (n % 3) * 10;
          ctx.fillStyle = rgba(NAVY, 0.55);
          ctx.fillRect(P.x - 6, P.y - h * P.s * 40, 12, h * P.s * 40);
          ctx.fillStyle = rgba(n % 2 ? GOLD : MAG, 0.7);
          ctx.fillRect(P.x - 2, P.y - h * P.s * 40, 3, 3);
        }
      }
    }
    ctx.fillStyle = rgba(pal.skyHor, 0.22);
    ctx.fillRect(0, HORIZON - 2, VW, 6);
  }

  function drawSmear() {
    if (REDUCE) return;
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      const a = clamp(s.t / 0.14, 0, 1) * 0.18;
      ctx.strokeStyle = rgba(WHT, a);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s.x - s.vx * 0.08, s.y + 18);
      ctx.lineTo(s.x, s.y + 4);
      ctx.stroke();
    }
    const vpX = CX + G.visX * 12;
    const vpY = HORIZON;
    ctx.strokeStyle = rgba(WHT, 0.08);
    ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const ang = (i / 10) * TAU + G.t * 0.04;
      const r = 220 + (i % 3) * 40;
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(vpX + Math.cos(ang) * r, vpY + Math.sin(ang) * r * 0.42 + 80);
      ctx.stroke();
    }
  }

  function drawCloud(p, sc, pal, t) {
    ctx.fillStyle = rgba(pal.cloud, 0.22 + Math.sin(t) * 0.04);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, sc * 22, sc * 10, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x - sc * 12, p.y + sc * 2, sc * 12, sc * 7, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.x + sc * 14, p.y + sc, sc * 14, sc * 8, 0, 0, TAU);
    ctx.fill();
  }

  function drawIsle(p, sc) {
    ctx.fillStyle = rgba([36, 48, 40], 0.85);
    ctx.beginPath();
    ctx.moveTo(p.x - sc * 18, p.y);
    ctx.lineTo(p.x, p.y - sc * 10);
    ctx.lineTo(p.x + sc * 18, p.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba([48, 90, 52], 0.7);
    ctx.beginPath();
    ctx.moveTo(p.x - sc * 8, p.y - sc * 2);
    ctx.lineTo(p.x, p.y - sc * 12);
    ctx.lineTo(p.x + sc * 8, p.y - sc * 2);
    ctx.closePath();
    ctx.fill();
  }

  function drawPillar(p, sc, flash) {
    ctx.fillStyle = rgba(flash ? WHT : [110, 40, 22], 0.95);
    ctx.fillRect(p.x - sc * 6, p.y - sc * 28, sc * 12, sc * 28);
    ctx.fillStyle = rgba([160, 60, 28], 0.9);
    ctx.fillRect(p.x - sc * 8, p.y - sc * 32, sc * 16, sc * 6);
  }

  function drawLight(p, sc, t) {
    ctx.fillStyle = rgba(NAVY, 0.8);
    ctx.fillRect(p.x - sc * 2, p.y - sc * 16, sc * 4, sc * 16);
    ctx.fillStyle = rgba(GOLD, 0.55 + Math.sin(t * 6) * 0.25);
    ctx.beginPath();
    ctx.arc(p.x, p.y - sc * 18, sc * 3.2, 0, TAU);
    ctx.fill();
  }

  function drawFighter(p, sc, flash, kind) {
    const body = flash ? WHT : (kind === 'int' ? [180, 40, 36] : kind === 'hvy' ? [90, 70, 80] : [70, 78, 92]);
    const wing = kind === 'int' ? FIRE : EMBR;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = rgba(wing, 0.9);
    ctx.beginPath();
    ctx.moveTo(-sc * 16, sc * 4);
    ctx.lineTo(0, -sc * 2);
    ctx.lineTo(sc * 16, sc * 4);
    ctx.lineTo(sc * 6, sc * 8);
    ctx.lineTo(-sc * 6, sc * 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(body, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -sc * 14);
    ctx.lineTo(sc * 6, sc * 10);
    ctx.lineTo(-sc * 6, sc * 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(RED, 0.85);
    ctx.fillRect(-sc * 5, sc * 8, sc * 3, sc * 5);
    ctx.fillRect(sc * 2, sc * 8, sc * 3, sc * 5);
    ctx.restore();
  }

  function drawBossEnt(p, sc, t, form, flash, en) {
    const body = flash ? WHT : [48, 28, 32];
    ctx.save();
    ctx.translate(p.x, p.y);
    if (form === 'bomber') {
      ctx.fillStyle = rgba(body, 0.96);
      ctx.beginPath();
      ctx.ellipse(0, 0, sc * 28, sc * 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(FIRE, 0.9);
      ctx.fillRect(-sc * 26, -sc * 3, sc * 52, sc * 5);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-sc * 8, -sc * 6, sc * 16, sc * 6);
      for (let k = -2; k <= 2; k++) {
        if (!k) continue;
        ctx.fillStyle = rgba(EMBR, 0.85);
        ctx.beginPath();
        ctx.arc(k * sc * 10, sc * 6, sc * 3, 0, TAU);
        ctx.fill();
      }
    } else if (form === 'raptor') {
      ctx.rotate(Math.sin(t * 2) * 0.08);
      ctx.fillStyle = rgba(FIRE, 0.92);
      ctx.beginPath();
      ctx.moveTo(-sc * 24, sc * 6);
      ctx.lineTo(0, -sc * 16);
      ctx.lineTo(sc * 24, sc * 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(body, 0.96);
      ctx.beginPath();
      ctx.moveTo(0, -sc * 20);
      ctx.lineTo(sc * 8, sc * 12);
      ctx.lineTo(-sc * 8, sc * 12);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(-sc * 4, -sc * 6, sc * 8, sc * 6);
    } else {
      ctx.fillStyle = rgba(body, 0.96);
      ctx.fillRect(-sc * 32, -sc * 8, sc * 64, sc * 16);
      ctx.fillStyle = rgba(NAVY, 0.9);
      ctx.fillRect(-sc * 28, -sc * 14, sc * 56, sc * 8);
      ctx.fillStyle = rgba(GOLD, 0.7);
      for (let k = -3; k <= 3; k++) {
        ctx.fillRect(k * sc * 8 - 2, -sc * 12, 4, 4);
      }
      ctx.fillStyle = rgba(FIRE, 0.85);
      ctx.fillRect(-sc * 30, sc * 6, sc * 10, sc * 8);
      ctx.fillRect(sc * 20, sc * 6, sc * 10, sc * 8);
      const hp = en && en.max ? en.hp / en.max : 1;
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(-sc * 20, sc * 12, sc * 40 * hp, sc * 3);
    }
    ctx.restore();
  }

  function drawEshot(p, sc) {
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(2.4, sc * 4.2), 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1.1, sc * 1.8), 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(MAG, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, sc * 7, 0, TAU);
    ctx.stroke();
  }

  function drawF14(x, y, bank, roll, alpha, muzzle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bank * 0.48 + roll * 0.55);
    ctx.globalAlpha = alpha;
    const s = 1;
    const lg = ctx.createLinearGradient(0, 10, 0, 58);
    lg.addColorStop(0, rgba(GOLD, 0.75));
    lg.addColorStop(0.35, rgba(FIRE, 0.7));
    lg.addColorStop(1, rgba(FIRE, 0));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(-11 * s, 12 * s);
    ctx.lineTo(-5 * s, 12 * s);
    ctx.lineTo(-7 * s, 56 * s);
    ctx.lineTo(-9 * s, 56 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5 * s, 12 * s);
    ctx.lineTo(11 * s, 12 * s);
    ctx.lineTo(9 * s, 56 * s);
    ctx.lineTo(7 * s, 56 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(FIRE, 0.95);
    ctx.beginPath();
    ctx.moveTo(-32 * s, 8 * s);
    ctx.lineTo(-8 * s, 2 * s);
    ctx.lineTo(-10 * s, 14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(32 * s, 8 * s);
    ctx.lineTo(8 * s, 2 * s);
    ctx.lineTo(10 * s, 14 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CRM, 0.98);
    ctx.beginPath();
    ctx.moveTo(0, -24 * s);
    ctx.lineTo(10 * s, 12 * s);
    ctx.lineTo(0, 8 * s);
    ctx.lineTo(-10 * s, 12 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -16 * s);
    ctx.lineTo(4.5 * s, 0);
    ctx.lineTo(-4.5 * s, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba([160, 40, 32], 0.95);
    ctx.beginPath();
    ctx.moveTo(-6 * s, 6 * s);
    ctx.lineTo(-9 * s, 22 * s);
    ctx.lineTo(-3 * s, 10 * s);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6 * s, 6 * s);
    ctx.lineTo(9 * s, 22 * s);
    ctx.lineTo(3 * s, 10 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = muzzle ? rgba(WHT, 1) : rgba(EMBR, 0.95);
    ctx.fillRect(-16 * s, 1 * s, 5 * s, 6 * s);
    ctx.fillRect(11 * s, 1 * s, 5 * s, 6 * s);
    if (muzzle) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(-13.5 * s, -1, 5, 0, TAU);
      ctx.arc(13.5 * s, -1, 5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShot(sh) {
    project(sh.x, sh.y, sh.z, P);
    const sc = Math.max(3, 7 * P.s);
    ctx.strokeStyle = rgba(GOLD, 0.95);
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

  function drawMissile(m) {
    project(m.x, m.y, m.z, P);
    const sc = Math.max(3, 8 * P.s);
    ctx.strokeStyle = rgba(FIRE, 0.95);
    ctx.lineWidth = Math.max(2, sc * 0.45);
    ctx.beginPath();
    ctx.moveTo(P.x, P.y + sc * 2.2);
    ctx.lineTo(P.x, P.y - sc * 1.4);
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(P.x, P.y - sc * 1.2, 2.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(FIRE, 0.35);
    ctx.beginPath();
    ctx.ellipse(P.x, P.y + sc * 1.4, sc * 2.2, sc * 4, 0, 0, TAU);
    ctx.fill();
  }

  function drawEnt(en) {
    if (en.dead) return;
    project(en.x, en.ground ? 0.02 : en.y, en.z, P);
    const sc = P.s;
    const pal = palette();
    const flash = en.flash > 0;
    if (en.kind === 'cloud') drawCloud(P, sc, pal, en.t);
    else if (en.kind === 'isle') drawIsle(P, sc);
    else if (en.kind === 'pillar') drawPillar(P, sc, flash);
    else if (en.kind === 'light') drawLight(P, sc, en.t);
    else if (en.kind === 'shot') drawEshot(P, sc);
    else if (en.kind === 'boss') drawBossEnt(P, sc, en.t, en.form, flash, en);
    else drawFighter(P, sc, flash, en.kind);
  }

  function drawLockHud() {
    const e = G.lock.ent;
    if (!e || e.dead || G.mode !== 'play') return;
    project(e.x, e.y, e.z, P);
    const t = G.lock.locked ? 1 : clamp(G.lock.t / lockNeed(), 0, 1);
    const s = Math.max(16, 38 * P.s) * (1.32 - t * 0.32);
    ctx.save();
    ctx.translate(P.x, P.y);
    ctx.rotate(G.lock.locked ? G.t * 0.6 : G.t * 2.2);
    ctx.strokeStyle = rgba(G.lock.locked ? GOLD : LOCKC, 0.5 + t * 0.5);
    ctx.lineWidth = G.lock.locked ? 2.4 : 1.6;
    ctx.strokeRect(-s, -s, s * 2, s * 2);
    const tick = s * 0.28;
    ctx.beginPath();
    ctx.moveTo(-s, -s + tick); ctx.lineTo(-s, -s); ctx.lineTo(-s + tick, -s);
    ctx.moveTo(s, -s + tick); ctx.lineTo(s, -s); ctx.lineTo(s - tick, -s);
    ctx.moveTo(-s, s - tick); ctx.lineTo(-s, s); ctx.lineTo(-s + tick, s);
    ctx.moveTo(s, s - tick); ctx.lineTo(s, s); ctx.lineTo(s - tick, s);
    ctx.stroke();
    ctx.restore();
    if (G.lock.locked) {
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOCK', P.x, P.y - s - 8);
    }
  }

  function drawFx() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.42;
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - k));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r * (0.4 + k * 2.1), 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = 1 - s.t / 0.28;
      ctx.fillStyle = rgba(s.rgb, 0.85 * k);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.rad * 0.22 * k, 0, TAU);
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
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = 'bold ' + f.size + 'px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function drawHudCanvas() {
    if (G.mode !== 'play') return;
    if (G.warn > 0) {
      ctx.strokeStyle = rgba(MAG, 0.45 + Math.sin(G.t * 18) * 0.25);
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, VW - 16, VH - 16);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('来弹', CX, 28);
    }
    if (G.readyT > 0) {
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.font = 'bold 22px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stageDef().name, CX, HORIZON - 18);
    }
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
    for (let i = 0; i < G.msls.length; i++) drawMissile(G.msls[i]);

    const ps = playerScreen();
    if (!REDUCE) {
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        drawF14(g.x, g.y, g.bank, g.roll || 0, 0.12 * (g.t / 0.16), false);
      }
    }
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (G.deadT <= 0 && !(blink && G.mode === 'play')) {
      drawF14(ps.x, ps.y, G.bank, G.roll, 1, G.muzzle > 0);
    }

    drawLockHud();
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
    if (e.target === speedEl) return;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const mslKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight';

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

    if (down && (isMove || space || mslKey || k === 'Enter')) e.preventDefault();
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
      startGame('core');
      return;
    }
    if (k === '2') {
      startGame('dense');
      return;
    }
    if (mslKey) {
      if (G.mode === 'play' && !overlayOpen()) fireMissile();
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
      if (!pointer.down && !autoOn) G.fireHold = false;
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

  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
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
  if (btnMsl) {
    btnMsl.addEventListener('click', function (e) {
      e.preventDefault();
      audio.ensure();
      if (!autoOn) fireMissile();
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
