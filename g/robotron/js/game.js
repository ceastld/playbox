'use strict';

(function () {
  const VW = 720;
  const VH = 480;
  const WALL = 20;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const P_R = 9;
  const P_SPD = 188;
  const SHOT_SPD = 540;
  const FIRE_CD = 0.066;
  const MAX_SHOTS = 16;
  const COMBO_WIN = 1.22;
  const BEST_KEY = 'playbox-robotron-best';
  const MUTE_KEY = 'playbox-robotron-mute';
  const AUTO_SPEED_KEY = 'playbox-robotron-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 1, 2, 4, 10];
  const AUTO_START_WAIT = [0, 0.55, 0.38, 0.2, 0.06];
  const OPS = 'WASD / 方向键走 · 鼠标瞄准点射或 IJKL 射 · A 自动 · R 重开 · M 静音';
  const OCT = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];

  const MAG = [255, 61, 184];
  const CYN = [0, 255, 245];
  const GOLD = [255, 227, 107];
  const HOT = [0, 232, 216];
  const HOT2 = [122, 255, 240];
  const WHT = [232, 255, 252];
  const GRUNT = [255, 74, 106];
  const GRUNT2 = [255, 107, 88];
  const HULK = [124, 255, 74];
  const HULK2 = [62, 168, 48];
  const SPH = [255, 90, 214];
  const ENF = [255, 210, 70];
  const BRAIN = [196, 123, 255];
  const PROG = [255, 80, 170];
  const HUM = [255, 227, 107];
  const HUM2 = [255, 168, 92];
  const HUM3 = [180, 255, 210];
  const ELEC = [0, 220, 255];

  const SWEEP_WAVES = [
    { name: '入场', grunts: 8, hulks: 0, spheroids: 0, brains: 0, humans: 4, electrodes: 5 },
    { name: '铁拳', grunts: 10, hulks: 2, spheroids: 0, brains: 0, humans: 5, electrodes: 7 },
    { name: '球孵', grunts: 8, hulks: 1, spheroids: 2, brains: 0, humans: 5, electrodes: 6 },
    { name: '脑袭', grunts: 7, hulks: 1, spheroids: 0, brains: 3, humans: 6, electrodes: 8 },
    { name: '合围', grunts: 12, hulks: 2, spheroids: 2, brains: 1, humans: 5, electrodes: 9 },
    { name: '狂潮', grunts: 14, hulks: 2, spheroids: 2, brains: 2, humans: 6, electrodes: 10 },
    { name: '重压', grunts: 12, hulks: 4, spheroids: 3, brains: 2, humans: 6, electrodes: 12 },
    { name: '终扫', grunts: 16, hulks: 3, spheroids: 3, brains: 3, humans: 7, electrodes: 12 }
  ];

  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function norm(x, y) {
    const l = hypot(x, y);
    if (l < 0.0001) return { x: 0, y: 0, l: 0 };
    return { x: x / l, y: y / l, l: l };
  }
  function snap8(dx, dy) {
    if (dx === 0 && dy === 0) return OCT[0];
    let oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    if (oct < 0) oct += 8;
    if (oct === 8) oct = 0;
    return OCT[oct];
  }
  function angOf(dx, dy) {
    return Math.atan2(dy, dx);
  }

  function waveSpec(kind, wave) {
    if (kind === 'guard') {
      const w = Math.max(1, wave);
      return {
        name: '护人 ' + w,
        grunts: Math.min(16, 4 + w),
        hulks: Math.min(7, 1 + ((w + 1) / 2 | 0)),
        spheroids: w >= 3 ? Math.min(4, (w / 3) | 0) : 0,
        brains: Math.min(6, 1 + (w / 2 | 0)),
        humans: Math.min(14, 8 + w),
        electrodes: Math.min(16, 4 + w)
      };
    }
    if (wave <= SWEEP_WAVES.length) return SWEEP_WAVES[wave - 1];
    const extra = wave - SWEEP_WAVES.length;
    return {
      name: '加波 ' + extra,
      grunts: Math.min(22, 14 + extra * 2),
      hulks: Math.min(6, 3 + extra),
      spheroids: Math.min(5, 3 + extra),
      brains: Math.min(5, 3 + extra),
      humans: 6,
      electrodes: 12
    };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    lastZap: 0,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
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
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
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
    zap() {
      this.ensure();
      const now = this.ctx ? this.ctx.currentTime : 0;
      if (now - this.lastZap < 0.03) return;
      this.lastZap = now;
      this.beep(1180, 0.038, 'square', 0.036, 320);
    },
    hit() {
      this.ensure();
      this.beep(640, 0.04, 'square', 0.03, 220);
    },
    boom() {
      this.ensure();
      this.noise(0.13, 0.07, 240);
      this.beep(210, 0.15, 'sawtooth', 0.05, 55);
    },
    hulk() {
      this.ensure();
      this.beep(88, 0.08, 'sine', 0.06, 48);
      this.noise(0.05, 0.03, 160);
    },
    chime(n) {
      this.ensure();
      const base = 523 + Math.min(4, n) * 64;
      this.beep(base, 0.09, 'sine', 0.05);
      this.beep(base * 1.26, 0.13, 'triangle', 0.045);
      this.beep(base * 1.5, 0.18, 'sine', 0.04);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.04, f * 1.5);
    },
    hurt() {
      this.ensure();
      this.beep(170, 0.18, 'sawtooth', 0.06, 64);
      this.noise(0.14, 0.055, 380);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.08, 'sine', 0.05);
      this.beep(1046, 0.16, 'triangle', 0.05);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.045);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.26, 'triangle', 0.05, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.045, 90);
      this.beep(140, 0.3, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
    },
    crush() {
      this.ensure();
      this.beep(110, 0.12, 'sawtooth', 0.05, 48);
      this.noise(0.08, 0.04, 220);
    }
  };

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
  const btnSweep = document.getElementById('btn-sweep');
  const btnGuard = document.getElementById('btn-guard');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeSweep = document.getElementById('mode-sweep');
  const modeGuard = document.getElementById('mode-guard');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const rescueLabel = document.getElementById('rescue-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');
  const vpadL = document.getElementById('vpad-l');
  const vpadR = document.getElementById('vpad-r');
  const knobL = document.getElementById('knob-l');
  const knobR = document.getElementById('knob-r');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;
  let toastTok = 0;
  let fireHold = false;
  let mouseAim = false;

  const keys = { u: false, d: false, l: false, r: false };
  const shoot = { u: false, d: false, l: false, r: false };
  const mouse = { x: VW * 0.5, y: VH * 0.5, down: false };
  const stickL = { on: false, id: null, x: 0, y: 0 };
  const stickR = { on: false, id: null, x: 0, y: 0 };
  const pad = { mx: 0, my: 0, sx: 0, sy: 0 };
  const pips = [];
  const particles = [];
  const pops = [];
  const rings = [];
  const motes = [];
  const autoMove = { x: 0, y: 0 };
  const autoAimV = { x: 1, y: 0 };
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoStrafe = 1;
  let autoWallT = 0;
  let autoTarget = null;

  const G = {
    mode: 'title',
    kind: 'sweep',
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    bestSweep: 0,
    bestGuard: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    rescue: 1,
    saved: 0,
    t: 0,
    clock: 0,
    stop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: CYN,
    ready: 0,
    invuln: 0,
    deadT: 0,
    clearT: 0,
    fireCd: 0,
    muzzle: 0,
    why: '',
    waveName: '入场',
    player: { x: VW * 0.5, y: VH * 0.5, fx: 1, fy: 0, ax: 1, ay: 0, r: P_R, walk: 0 },
    enemies: [],
    humans: [],
    electrodes: [],
    shots: [],
    eShots: []
  };

  function sx(x) { return ox + x * scale; }
  function sy(y) { return oy + y * scale; }

  function worldFromPtr(cx, cy) {
    const r = canvas.getBoundingClientRect();
    const sxr = r.width > 0 ? canvas.width / r.width : dpr;
    const syr = r.height > 0 ? canvas.height / r.height : dpr;
    return {
      x: ((cx - r.left) * sxr - ox) / scale,
      y: ((cy - r.top) * syr - oy) / scale
    };
  }

  function inArena(x, y, r) {
    return x >= WALL + r && x <= VW - WALL - r && y >= WALL + r && y <= VH - WALL - r;
  }

  function clampArena(ent) {
    ent.x = clamp(ent.x, WALL + ent.r, VW - WALL - ent.r);
    ent.y = clamp(ent.y, WALL + ent.r, VH - WALL - ent.r);
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
  }

  function kick(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    if (autoOn && autoSpeed >= 3) return;
    G.stop = Math.max(G.stop, Math.min(0.08, sec));
  }

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
    } catch (err) { /* ignore */ }
  }

  function screenFlash(rgb, a) {
    G.flash = a;
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 6);
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        t: spec.life,
        life: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
    if (particles.length > 240) particles.splice(0, particles.length - 240);
  }

  function spawnPop(x, y, text, rgb) {
    pops.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85, life: 0.85 });
    if (pops.length > 48) pops.shift();
  }

  function spawnRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 10 });
    if (rings.length > 28) rings.shift();
  }

  function showChain(n) {
    if (!chainPop || REDUCE) return;
    chainTok += 1;
    const tok = chainTok;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    setTimeout(function () {
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }

  function toast(text, warn, gold) {
    if (!toastEl) return;
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = text;
    toastEl.classList.remove('hidden', 'warn', 'gold');
    if (warn) toastEl.classList.add('warn');
    if (gold) toastEl.classList.add('gold');
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1400);
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function currentBest() {
    return G.kind === 'guard' ? G.bestGuard : G.bestSweep;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.bestSweep = o.sweep | 0;
        G.bestGuard = o.guard | 0;
      } else {
        const n = parseInt(raw, 10) | 0;
        G.bestSweep = n;
        G.bestGuard = n;
      }
    } catch (err) { /* ignore */ }
    G.best = currentBest();
  }

  function saveBest() {
    G.best = currentBest();
    if (G.score > G.best) {
      if (G.kind === 'guard') G.bestGuard = G.score;
      else G.bestSweep = G.score;
      G.best = G.score;
      try {
        localStorage.setItem(BEST_KEY, JSON.stringify({ sweep: G.bestSweep, guard: G.bestGuard }));
      } catch (err) { /* ignore */ }
    }
  }

  function flashScore(n) {
    if (!scoreAdd) return;
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function addScore(n, x, y, rgb) {
    if (G.mode !== 'play' || n <= 0) return;
    const v = n | 0;
    const before = G.score;
    G.score += v;
    saveBest();
    const gained = ((G.score / LIFE_EVERY) | 0) - ((before / LIFE_EVERY) | 0);
    if (gained > 0 && G.lives < LIFE_CAP) {
      G.lives = Math.min(LIFE_CAP, G.lives + gained);
      audio.extra();
      toast('1UP', false, true);
    }
    flashScore(v);
    if (x != null) spawnPop(x, y, '+' + v, rgb || GOLD);
  }

  function bumpCombo() {
    const prev = G.mult;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = 1 + Math.min(4, (G.combo - 1) / 3 | 0);
    if (G.combo >= 2) audio.combo(G.combo);
    if (G.mult > prev) showChain(G.mult);
  }

  function resetCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < Math.max(LIVES, G.lives)) {
      const iel = document.createElement('i');
      iel.className = 'pip on';
      pipsEl.appendChild(iel);
      pips.push(iel);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncModes() {
    if (modeSweep) modeSweep.setAttribute('aria-pressed', G.kind === 'sweep' ? 'true' : 'false');
    if (modeGuard) modeGuard.setAttribute('aria-pressed', G.kind === 'guard' ? 'true' : 'false');
  }

  function liveEnemies() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.type !== 'hulk') n += 1;
    }
    return n;
  }

  function liveHumans() {
    let n = 0;
    for (let i = 0; i < G.humans.length; i++) if (G.humans[i].alive) n += 1;
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(currentBest());
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.comboT > 0);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = G.kind === 'guard' ? '护人' : '扫荡';
      else if (G.kind === 'guard') stageLabel.textContent = '护人 · 第 ' + G.wave + ' 波';
      else stageLabel.textContent = '扫荡 ' + G.wave + '/' + SWEEP_WAVES.length + ' · ' + G.waveName;
      stageLabel.classList.toggle('hot', G.combo >= 3);
    }
    if (tagLabel) {
      const en = liveEnemies();
      const hu = liveHumans();
      tagLabel.textContent = '敌 ' + en + ' · 人 ' + hu;
      tagLabel.className = hu === 0 && G.mode === 'play' ? 'warn' : (en <= 3 && G.mode === 'play' ? 'hot' : '');
    }
    if (rescueLabel) {
      rescueLabel.textContent = '救 ×' + G.rescue;
      rescueLabel.classList.toggle('hot', G.rescue >= 3);
    }
    syncPips();
    syncModes();
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function showOverlay(kind) {
    if (!overlay || !panel) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind !== 'title');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind === 'title') {
      if (ovKicker) ovKicker.textContent = 'ROBO';
      if (ovTitle) ovTitle.textContent = '狂扫';
      if (ovLead) ovLead.innerHTML = '双摇杆边走边射，救出人类叠倍率。<br />清光一波再进下一波。碰到机兵就掉命。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = '扫清了';
      if (ovLead) ovLead.textContent = '八波清完。分数 ' + G.score + (G.score >= currentBest() ? ' · 新纪录' : '') + ' · 救人 ' + G.saved;
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再扫一轮';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '撞上了';
      const tail = G.kind === 'guard' ? ('撑到第 ' + G.wave + ' 波。') : ('第 ' + G.wave + ' 波。');
      if (ovLead) ovLead.textContent = tail + '分数 ' + G.score + (G.score >= currentBest() ? ' · 新纪录' : '') + ' · 救人 ' + G.saved;
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    }
  }

  function resetFx() {
    particles.length = 0;
    pops.length = 0;
    rings.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
  }

  function spawnAround(minDist, r) {
    const px = G.player.x;
    const py = G.player.y;
    for (let t = 0; t < 48; t++) {
      const side = (Math.random() * 4) | 0;
      let x;
      let y;
      const inset = WALL + 18 + r;
      if (side === 0) {
        x = rand(inset, VW - inset);
        y = inset + rand(0, 36);
      } else if (side === 1) {
        x = rand(inset, VW - inset);
        y = VH - inset - rand(0, 36);
      } else if (side === 2) {
        x = inset + rand(0, 36);
        y = rand(inset, VH - inset);
      } else {
        x = VW - inset - rand(0, 36);
        y = rand(inset, VH - inset);
      }
      if (hypot(x - px, y - py) >= minDist) return { x: x, y: y };
    }
    return { x: WALL + 28, y: WALL + 28 };
  }

  function tooClose(x, y, list, min) {
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      if (!o.alive && o.alive !== undefined) continue;
      if (hypot(x - o.x, y - o.y) < min) return true;
    }
    return false;
  }

  function addEnemy(type, x, y) {
    if (G.enemies.length >= 72) return null;
    const e = {
      type: type,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      fx: 1,
      fy: 0,
      r: 10,
      hp: 1,
      spd: 70,
      rgb: GRUNT,
      t: rand(0, TAU),
      think: rand(0, 0.2),
      cd: rand(0.4, 1.2),
      spawn: 0.22,
      flash: 0,
      walk: rand(0, TAU),
      alive: true,
      convert: 0
    };
    if (type === 'grunt') {
      e.r = 10;
      e.hp = 1;
      e.spd = 58 + G.wave * 4.2;
      e.rgb = Math.random() < 0.5 ? GRUNT : GRUNT2;
    } else if (type === 'hulk') {
      e.r = 16;
      e.hp = 16;
      e.spd = 34 + Math.min(10, G.wave);
      e.rgb = HULK;
    } else if (type === 'spheroid') {
      e.r = 13;
      e.hp = 3;
      e.spd = 78;
      e.rgb = SPH;
      const a = rand(0, TAU);
      e.vx = Math.cos(a) * e.spd;
      e.vy = Math.sin(a) * e.spd;
      e.cd = rand(0.7, 1.3);
    } else if (type === 'enforcer') {
      e.r = 11;
      e.hp = 1;
      e.spd = 88 + G.wave * 2;
      e.rgb = ENF;
      e.cd = rand(0.45, 1.1);
    } else if (type === 'brain') {
      e.r = 13;
      e.hp = 2;
      e.spd = 50 + G.wave;
      e.rgb = BRAIN;
      e.cd = rand(0.8, 1.6);
    } else if (type === 'prog') {
      e.r = 9;
      e.hp = 1;
      e.spd = 148;
      e.rgb = PROG;
    }
    G.enemies.push(e);
    return e;
  }

  function addHuman(x, y, kind) {
    G.humans.push({
      x: x,
      y: y,
      fx: OCT[(Math.random() * 8) | 0][0],
      fy: OCT[(Math.random() * 8) | 0][1],
      r: kind === 2 ? 7 : 8,
      kind: kind,
      think: rand(0.2, 0.8),
      walk: rand(0, TAU),
      alive: true,
      spd: kind === 2 ? 52 : 40
    });
  }

  function addElectrode(x, y, kind) {
    G.electrodes.push({
      x: x,
      y: y,
      r: 9 + (kind % 3),
      kind: kind,
      alive: true
    });
  }

  function spawnWave(spec) {
    G.enemies = [];
    G.humans = [];
    G.electrodes = [];
    G.shots = [];
    G.eShots = [];
    G.waveName = spec.name;
    G.rescue = 1;
    G.ready = 0.48;
    G.invuln = Math.max(G.invuln, 1.05);
    G.player.x = VW * 0.5;
    G.player.y = VH * 0.5;
    resetFx();

    const minP = 92;
    for (let i = 0; i < spec.grunts; i++) {
      const p = spawnAround(minP, 10);
      if (!tooClose(p.x, p.y, G.enemies, 22)) addEnemy('grunt', p.x, p.y);
      else addEnemy('grunt', p.x + rand(-12, 12), p.y + rand(-12, 12));
    }
    for (let i = 0; i < spec.hulks; i++) {
      const p = spawnAround(110, 16);
      addEnemy('hulk', p.x, p.y);
    }
    for (let i = 0; i < spec.spheroids; i++) {
      const p = spawnAround(120, 13);
      addEnemy('spheroid', p.x, p.y);
    }
    for (let i = 0; i < spec.brains; i++) {
      const p = spawnAround(110, 13);
      addEnemy('brain', p.x, p.y);
    }
    for (let i = 0; i < spec.humans; i++) {
      let placed = false;
      for (let t = 0; t < 24 && !placed; t++) {
        const x = rand(WALL + 40, VW - WALL - 40);
        const y = rand(WALL + 40, VH - WALL - 40);
        if (hypot(x - G.player.x, y - G.player.y) < 50) continue;
        if (tooClose(x, y, G.enemies, 28)) continue;
        addHuman(x, y, i % 3);
        placed = true;
      }
    }
    const ek = G.wave % 4;
    for (let i = 0; i < spec.electrodes; i++) {
      let placed = false;
      for (let t = 0; t < 20 && !placed; t++) {
        const x = rand(WALL + 36, VW - WALL - 36);
        const y = rand(WALL + 36, VH - WALL - 36);
        if (hypot(x - G.player.x, y - G.player.y) < 70) continue;
        if (tooClose(x, y, G.enemies, 26) || tooClose(x, y, G.humans, 22) || tooClose(x, y, G.electrodes, 28)) continue;
        addElectrode(x, y, ek);
        placed = true;
      }
    }
  }

  function firePlayer(dx, dy) {
    if (G.fireCd > 0 || G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.shots.length >= MAX_SHOTS) return;
    const n = norm(dx, dy);
    if (n.l < 0.01) {
      n.x = G.player.ax;
      n.y = G.player.ay;
    }
    G.player.ax = n.x;
    G.player.ay = n.y;
    G.shots.push({
      x: G.player.x + n.x * 12,
      y: G.player.y + n.y * 12,
      vx: n.x * SHOT_SPD,
      vy: n.y * SHOT_SPD,
      r: 3.2,
      rgb: CYN,
      life: 0.85
    });
    G.fireCd = FIRE_CD;
    G.muzzle = 0.05;
    audio.zap();
    emit(3, {
      x: G.player.x + n.x * 14,
      y: G.player.y + n.y * 14,
      j: 2,
      vx0: n.x * 40,
      vx1: n.x * 120,
      vy0: n.y * 40,
      vy1: n.y * 120,
      life: 0.12,
      r0: 1,
      r1: 2.4,
      rgb: WHT
    });
  }

  function fireEnemy(e, dx, dy, spd, r, rgb, homing) {
    const n = norm(dx, dy);
    if (n.l < 0.01) return;
    G.eShots.push({
      x: e.x + n.x * (e.r + 4),
      y: e.y + n.y * (e.r + 4),
      vx: n.x * spd,
      vy: n.y * spd,
      r: r,
      rgb: rgb,
      life: homing ? 3.2 : 1.6,
      homing: !!homing,
      turn: homing ? 3.4 : 0
    });
  }

  function explodeAt(x, y, rgb, big) {
    const n = big ? 22 : 14;
    emit(n, {
      x: x,
      y: y,
      j: big ? 8 : 4,
      vx0: -180,
      vx1: 180,
      vy0: -180,
      vy1: 180,
      life: big ? 0.46 : 0.32,
      r0: 1.4,
      r1: big ? 5 : 3.2,
      rgb: rgb,
      g: 90
    });
    spawnRing(x, y, rgb, big ? 16 : 8);
  }

  function killEnemy(e, scored) {
    if (!e.alive) return;
    e.alive = false;
    explodeAt(e.x, e.y, e.rgb, e.type === 'hulk' || e.type === 'spheroid');
    audio.boom();
    G.punch = e.type === 'hulk' || e.type === 'spheroid' ? 1.028 : 1.016;
    if (e.type === 'hulk') {
      kick('thump');
      G.shake = Math.max(G.shake, 7);
      hitStop(0.06);
    } else {
      kick('hit');
      G.shake = Math.max(G.shake, 4);
      hitStop(e.type === 'spheroid' || e.type === 'brain' ? 0.055 : 0.038);
    }
    if (!scored) return;
    bumpCombo();
    let pts = 100;
    if (e.type === 'enforcer') pts = 150;
    else if (e.type === 'spheroid') pts = 1000;
    else if (e.type === 'brain') pts = 500;
    else if (e.type === 'hulk') pts = 250;
    else if (e.type === 'prog') pts = 100;
    addScore(pts * G.mult, e.x, e.y, e.rgb);
  }

  function crushHuman(h) {
    if (!h.alive) return;
    h.alive = false;
    G.rescue = 1;
    explodeAt(h.x, h.y, HUM, false);
    audio.crush();
    spawnPop(h.x, h.y, '没了', MAG);
    kick('thump');
  }

  function rescueHuman(h) {
    if (!h.alive) return;
    h.alive = false;
    const n = G.rescue;
    const pts = 1000 * n;
    G.rescue = Math.min(5, G.rescue + 1);
    G.saved += 1;
    addScore(pts, h.x, h.y, GOLD);
    audio.chime(n);
    spawnRing(h.x, h.y, GOLD, 14);
    emit(16, {
      x: h.x,
      y: h.y,
      j: 6,
      vx0: -90,
      vx1: 90,
      vy0: -160,
      vy1: -20,
      life: 0.5,
      r0: 1.5,
      r1: 3.4,
      rgb: GOLD
    });
    kick('rescue');
    hitStop(0.042);
    screenFlash(GOLD, 0.22);
    if (n >= 2) showChain(n);
    toast(n >= 5 ? '救满 ×5' : ('救人 +' + pts), false, true);
  }

  function convertHuman(h, brain) {
    if (!h.alive) return;
    h.alive = false;
    const e = addEnemy('prog', h.x, h.y);
    if (e) e.spawn = 0;
    explodeAt(h.x, h.y, PROG, false);
    audio.hurt();
    spawnPop(h.x, h.y, '改写', PROG);
    G.rescue = 1;
    if (brain) brain.convert = 0;
  }

  function nearestHuman(x, y) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.humans.length; i++) {
      const h = G.humans[i];
      if (!h.alive) continue;
      const d = hypot(h.x - x, h.y - y);
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    return best;
  }

  function nearestEnemy(x, y) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const d = hypot(e.x - x, e.y - y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  function hitElectrode(x, y, r) {
    for (let i = 0; i < G.electrodes.length; i++) {
      const el = G.electrodes[i];
      if (!el.alive) continue;
      if (hypot(el.x - x, el.y - y) < el.r + r) return el;
    }
    return null;
  }

  function destroyElectrode(el) {
    if (!el.alive) return;
    el.alive = false;
    explodeAt(el.x, el.y, ELEC, false);
    audio.hit();
    addScore(25 * G.mult, el.x, el.y, ELEC);
  }

  function getMoveVec() {
    if (autoOn && G.mode === 'play') return norm(autoMove.x, autoMove.y);
    let mx = 0;
    let my = 0;
    if (keys.l) mx -= 1;
    if (keys.r) mx += 1;
    if (keys.u) my -= 1;
    if (keys.d) my += 1;
    if (stickL.on && hypot(stickL.x, stickL.y) > 0.18) {
      mx = stickL.x;
      my = stickL.y;
    }
    if (hypot(pad.mx, pad.my) > 0.22) {
      mx = pad.mx;
      my = pad.my;
    }
    return norm(mx, my);
  }

  function getShootVec() {
    if (autoOn && G.mode === 'play') return norm(autoAimV.x, autoAimV.y);
    if (shoot.l || shoot.r || shoot.u || shoot.d) {
      let sxv = 0;
      let syv = 0;
      if (shoot.l) sxv -= 1;
      if (shoot.r) sxv += 1;
      if (shoot.u) syv -= 1;
      if (shoot.d) syv += 1;
      return norm(sxv, syv);
    }
    if (stickR.on && hypot(stickR.x, stickR.y) > 0.22) {
      return norm(stickR.x, stickR.y);
    }
    if (hypot(pad.sx, pad.sy) > 0.22) {
      return norm(pad.sx, pad.sy);
    }
    if (mouseAim || mouse.down || fireHold) {
      return norm(mouse.x - G.player.x, mouse.y - G.player.y);
    }
    return { x: 0, y: 0, l: 0 };
  }

  function enemyVel(e) {
    if (e.type === 'spheroid') return { x: e.vx, y: e.vy };
    return { x: e.fx * e.spd, y: e.fy * e.spd };
  }

  function killWeight(e) {
    if (e.type === 'spheroid') return 9.4;
    if (e.type === 'brain') return 8.6;
    if (e.type === 'prog') return 7.4;
    if (e.type === 'enforcer') return 6.5;
    if (e.type === 'grunt') return 5.2;
    if (e.type === 'hulk') return 1.1;
    return 3;
  }

  function humanThreat(h) {
    let t = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.type !== 'hulk' && e.type !== 'brain') continue;
      const d = hypot(e.x - h.x, e.y - h.y);
      if (e.type === 'hulk' && d < 70) t += (70 - d) * 1.6;
      if (e.type === 'brain' && d < 90) t += (90 - d) * 0.9;
    }
    return t;
  }

  function pickAutoTarget() {
    const px = G.player.x;
    const py = G.player.y;
    let best = null;
    let bestS = -1e12;
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const dx = s.x - px;
      const dy = s.y - py;
      const d = hypot(dx, dy);
      if (d > 150) continue;
      const sp = hypot(s.vx, s.vy) || 1;
      const closing = -(dx * s.vx + dy * s.vy) / sp;
      if (closing < 8 && d > 42) continue;
      const sc = (s.homing ? 16000 : 9000) / Math.max(10, d) + closing * 6;
      if (sc > bestS) {
        bestS = sc;
        best = { x: s.x, y: s.y, vx: s.vx, vy: s.vy, kind: 'shot' };
      }
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.spawn > 0) continue;
      const d = hypot(e.x - px, e.y - py);
      let sc = killWeight(e) * 1100 / (d + 18);
      if (e.type === 'hulk') {
        sc = 90 / (d + 36);
        const h = nearestHuman(e.x, e.y);
        if (h && hypot(h.x - e.x, h.y - e.y) < 78) sc += 1400;
        if (d < 70) sc += 520;
      } else if (e.type === 'spheroid') {
        sc *= 1.35;
      } else if (e.type === 'brain') {
        const h = nearestHuman(e.x, e.y);
        if (h && hypot(h.x - e.x, h.y - e.y) < 120) sc += 700;
      }
      if (sc > bestS) {
        bestS = sc;
        best = e;
      }
    }
    if (autoTarget) {
      const t = autoTarget;
      let valid = false;
      if (t.kind === 'shot') {
        for (let i = 0; i < G.eShots.length; i++) {
          if (G.eShots[i] === t) {
            valid = true;
            break;
          }
        }
      } else if (t.alive) valid = true;
      if (valid) {
        const d = hypot(t.x - px, t.y - py);
        if (d < 220) {
          const keep = (t.kind === 'shot' ? 9000 : killWeight(t) * 1100) / (d + 18);
          if (keep > bestS * 0.72) best = t;
        }
      }
    }
    autoTarget = best;
    return best;
  }

  function scoreAutoMove(nx, ny, dx, dy, look) {
    const px = G.player.x;
    const py = G.player.y;
    const inv = G.invuln > 0.12 || G.ready > 0;
    const panicMul = inv ? 0.12 : 1;
    let score = 0;
    const minX = WALL + P_R + 2;
    const maxX = VW - WALL - P_R - 2;
    const minY = WALL + P_R + 2;
    const maxY = VH - WALL - P_R - 2;
    if (nx < minX || nx > maxX || ny < minY || ny > maxY) return -1e9;
    const wall = Math.min(nx - minX, maxX - nx, ny - minY, maxY - ny);
    if (wall < 34) score -= (34 - wall) * (inv ? 40 : 210);
    if (wall < 14) score -= 7000;

    const el = hitElectrode(nx, ny, P_R + 3);
    if (el) score -= 120000;
    for (let i = 0; i < G.electrodes.length; i++) {
      const e = G.electrodes[i];
      if (!e.alive) continue;
      const d = hypot(e.x - nx, e.y - ny);
      if (d < e.r + P_R + 18) score -= 4200 / Math.max(4, d - e.r);
    }

    let closest = 1e9;
    let nearX = 0;
    let nearY = 0;
    let nearN = 0;
    let huntX = 0;
    let huntY = 0;
    let huntW = 0;
    let dens = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.spawn > 0) continue;
      const v = enemyVel(e);
      const ex = e.x + v.x * look;
      const ey = e.y + v.y * look;
      const edx = ex - nx;
      const edy = ey - ny;
      const d = hypot(edx, edy) || 1;
      const mass = e.type === 'hulk' ? 2.6 : (e.type === 'prog' ? 1.8 : (e.type === 'grunt' ? 1.2 : 1));
      const contact = e.r + P_R + (e.type === 'hulk' ? 22 : (e.type === 'prog' ? 28 : 16));
      if (d < closest) closest = d;
      if (d < 200) {
        nearX += edx * mass;
        nearY += edy * mass;
        nearN += mass;
      }
      if (d < contact + 8) score -= 95000 * mass * panicMul;
      else if (d < contact + 70) score -= (26000 * mass * panicMul) / Math.max(8, d - e.r);
      if (e.type === 'hulk' && d < 110) score -= 4200 / Math.max(12, d);
      const ahead = dx * edx + dy * edy;
      if (ahead > 0 && d < 160) dens += mass / d;
      if (e.type !== 'hulk') {
        const w = killWeight(e);
        huntX += edx * w;
        huntY += edy * w;
        huntW += w;
      }
    }
    score -= dens * 1600 * panicMul;

    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const sxv = s.x + s.vx * look - nx;
      const syv = s.y + s.vy * look - ny;
      const d = hypot(sxv, syv);
      const hitR = P_R + s.r + 10;
      if (d < hitR) score -= (s.homing ? 42000 : 24000) * panicMul;
      else if (d < hitR + 36) score -= (s.homing ? 9000 : 4200) / Math.max(6, d) * panicMul;
      const relx = nx - s.x;
      const rely = ny - s.y;
      const sp2 = s.vx * s.vx + s.vy * s.vy || 1;
      const t = clamp((relx * s.vx + rely * s.vy) / sp2, 0, 0.45);
      const cx = s.x + s.vx * t - nx;
      const cy = s.y + s.vy * t - ny;
      const cd = hypot(cx, cy);
      if (cd < P_R + s.r + 8) score -= 18000 * panicMul;
    }

    if (nearN > 0) {
      const nd = hypot(nearX, nearY) || 1;
      const away = -(nearX / nd) * dx - (nearY / nd) * dy;
      const side = (-nearY / nd) * dx + (nearX / nd) * dy;
      if (closest < 58) score += away * 6400 * panicMul;
      else if (closest < 130) {
        score += away * 1400 * panicMul;
        score += Math.abs(side) * 1100;
        score += autoStrafe * side * 820;
      } else {
        score += autoStrafe * side * 280;
      }
    }

    const panic = !inv && (closest < 52);
    const huN = liveHumans();
    if (!panic && huN > 0) {
      let bestH = null;
      let bestHd = 1e9;
      for (let i = 0; i < G.humans.length; i++) {
        const h = G.humans[i];
        if (!h.alive) continue;
        const threat = humanThreat(h);
        const d = hypot(h.x - nx, h.y - ny);
        const adj = d + threat * 0.35;
        if (adj < bestHd) {
          bestHd = adj;
          bestH = h;
        }
      }
      if (bestH) {
        const hx = bestH.x - nx;
        const hy = bestH.y - ny;
        const hd = hypot(hx, hy) || 1;
        const urge = inv ? 2.6 : 1.55;
        score += (26000 * urge) / (hd + 16);
        score += ((hx * dx + hy * dy) / hd) * (2800 * urge);
        if (hd < 22) score += 2400;
      }
    } else if (!panic && huntW > 0) {
      const hd = hypot(huntX, huntY) || 1;
      const liveE = liveEnemies();
      const chase = liveE <= 3 ? 2100 : 980;
      if (closest > 88) score += (huntX * dx + huntY * dy) / hd * chase;
      else if (closest < 62) score -= (huntX * dx + huntY * dy) / hd * 640;
    }

    if (closest > 240 && huN === 0) score -= (closest - 240) * 3.2;
    score += (dx * autoMove.x + dy * autoMove.y) * 480;
    score -= (Math.abs(nx - VW * 0.5) + Math.abs(ny - VH * 0.5)) * 0.05;
    if (dx === 0 && dy === 0) score -= 260;
    return score;
  }

  function autoThink() {
    if (G.deadT > 0) return;
    const look = 0.18;
    const reach = P_SPD * look;
    const px = G.player.x;
    const py = G.player.y;
    let bestS = -1e15;
    let bx = autoMove.x;
    let by = autoMove.y;
    const nDir = 16;
    for (let i = 0; i < nDir; i++) {
      const a = (TAU * i) / nDir;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const nx = clamp(px + dx * reach, WALL + P_R, VW - WALL - P_R);
      const ny = clamp(py + dy * reach, WALL + P_R, VH - WALL - P_R);
      const s = scoreAutoMove(nx, ny, dx, dy, look);
      if (s > bestS) {
        bestS = s;
        bx = dx;
        by = dy;
      }
    }
    const stay = scoreAutoMove(px, py, 0, 0, look);
    if (stay > bestS + 80) {
      bx = 0;
      by = 0;
      bestS = stay;
    }
    const cur = scoreAutoMove(
      clamp(px + autoMove.x * reach, WALL + P_R, VW - WALL - P_R),
      clamp(py + autoMove.y * reach, WALL + P_R, VH - WALL - P_R),
      autoMove.x, autoMove.y, look
    );
    const danger = cur < -4000 || bestS < -4000;
    if (bestS > cur + (danger ? 40 : 160) || hypot(autoMove.x, autoMove.y) < 0.05) {
      autoMove.x = bx;
      autoMove.y = by;
    }

    autoWallT = Math.max(0, autoWallT - look);
    const minX = WALL + P_R + 8;
    const maxX = VW - WALL - P_R - 8;
    const minY = WALL + P_R + 8;
    const maxY = VH - WALL - P_R - 8;
    const nextX = px + autoMove.x * 28;
    const nextY = py + autoMove.y * 28;
    if (nextX < minX || nextX > maxX || nextY < minY || nextY > maxY) {
      if (autoWallT <= 0) {
        autoStrafe *= -1;
        autoWallT = 0.42;
      }
    }

    const tgt = pickAutoTarget();
    if (tgt) {
      const v = tgt.kind === 'shot' ? tgt : enemyVel(tgt);
      const d = hypot(tgt.x - px, tgt.y - py);
      const t = Math.min(0.32, d / SHOT_SPD);
      const ax = tgt.x + (v.x || 0) * t - px;
      const ay = tgt.y + (v.y || 0) * t - py;
      const n = norm(ax, ay);
      if (n.l > 0.01) {
        autoAimV.x = n.x;
        autoAimV.y = n.y;
      }
    } else {
      autoAimV.x = 0;
      autoAimV.y = 0;
    }
  }

  function pollPad() {
    pad.mx = pad.my = pad.sx = pad.sy = 0;
    if (autoOn) return;
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    if (!pads) return;
    let gp = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i]) {
        gp = pads[i];
        break;
      }
    }
    if (!gp) return;
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    const rx = gp.axes[2] || 0;
    const ry = gp.axes[3] || 0;
    if (hypot(lx, ly) > 0.22) {
      pad.mx = lx;
      pad.my = ly;
    }
    if (hypot(rx, ry) > 0.22) {
      pad.sx = rx;
      pad.sy = ry;
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const mv = getMoveVec();
    if (mv.l > 0.01) {
      G.player.x += mv.x * P_SPD * dt;
      G.player.y += mv.y * P_SPD * dt;
      G.player.fx = mv.x;
      G.player.fy = mv.y;
      G.player.walk += dt * 14;
    }
    clampArena(G.player);

    const sv = getShootVec();
    const wantFire = (autoOn && G.mode === 'play' && autoTarget && sv.l > 0.01)
      || fireHold || mouse.down || stickR.on && hypot(stickR.x, stickR.y) > 0.28
      || shoot.l || shoot.r || shoot.u || shoot.d || hypot(pad.sx, pad.sy) > 0.28;
    if (sv.l > 0.01) {
      G.player.ax = sv.x;
      G.player.ay = sv.y;
    }
    if (wantFire && sv.l > 0.01) firePlayer(sv.x, sv.y);
    else if (wantFire) firePlayer(G.player.ax, G.player.ay);
  }

  function demoThink(dt) {
    const threat = nearestEnemy(G.player.x, G.player.y);
    const hum = nearestHuman(G.player.x, G.player.y);
    let tx = 0;
    let ty = 0;
    if (threat) {
      const d = hypot(threat.x - G.player.x, threat.y - G.player.y);
      if (d < 90) {
        tx -= (threat.x - G.player.x);
        ty -= (threat.y - G.player.y);
      } else if (hum && hum.alive) {
        tx += hum.x - G.player.x;
        ty += hum.y - G.player.y;
      } else {
        tx += (threat.y - G.player.y) * 0.4;
        ty -= (threat.x - G.player.x) * 0.4;
      }
    } else if (hum) {
      tx = hum.x - G.player.x;
      ty = hum.y - G.player.y;
    }
    const n = norm(tx, ty);
    if (n.l > 0.01) {
      G.player.x += n.x * P_SPD * 0.72 * dt;
      G.player.y += n.y * P_SPD * 0.72 * dt;
      G.player.fx = n.x;
      G.player.fy = n.y;
      G.player.walk += dt * 12;
    }
    clampArena(G.player);
    const aim = threat || hum;
    if (aim) {
      G.player.ax = aim.x - G.player.x;
      G.player.ay = aim.y - G.player.y;
      const an = norm(G.player.ax, G.player.ay);
      G.player.ax = an.x;
      G.player.ay = an.y;
      if (threat && threat.alive) firePlayer(an.x, an.y);
    }
    if (liveEnemies() < 3) {
      const p = spawnAround(80, 10);
      addEnemy('grunt', p.x, p.y);
    }
  }

  function steerTo(e, tx, ty, dt) {
    const n = norm(tx - e.x, ty - e.y);
    if (n.l < 0.01) return;
    e.fx = n.x;
    e.fy = n.y;
    e.x += n.x * e.spd * dt;
    e.y += n.y * e.spd * dt;
    e.walk += dt * 10;
    clampArena(e);
  }

  function lurchTo(e, tx, ty, dt) {
    e.think -= dt;
    if (e.think <= 0) {
      e.think = 0.07 + Math.random() * 0.1;
      const s = snap8(tx - e.x, ty - e.y);
      const l = hypot(s[0], s[1]) || 1;
      e.fx = s[0] / l;
      e.fy = s[1] / l;
    }
    e.x += e.fx * e.spd * dt;
    e.y += e.fy * e.spd * dt;
    e.walk += dt * 11;
    clampArena(e);
  }

  function bounceMove(e, dt) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    const minX = WALL + e.r;
    const maxX = VW - WALL - e.r;
    const minY = WALL + e.r;
    const maxY = VH - WALL - e.r;
    if (e.x < minX) { e.x = minX; e.vx = Math.abs(e.vx); }
    if (e.x > maxX) { e.x = maxX; e.vx = -Math.abs(e.vx); }
    if (e.y < minY) { e.y = minY; e.vy = Math.abs(e.vy); }
    if (e.y > maxY) { e.y = maxY; e.vy = -Math.abs(e.vy); }
    const el = hitElectrode(e.x, e.y, e.r * 0.7);
    if (el) {
      const n = norm(e.x - el.x, e.y - el.y);
      e.vx = (n.x || 1) * Math.abs(hypot(e.vx, e.vy) || e.spd);
      e.vy = (n.y || 0) * Math.abs(hypot(e.vx, e.vy) || e.spd);
      e.x += n.x * 4;
      e.y += n.y * 4;
    }
  }

  function updateEnemies(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const frozen = G.ready > 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.t += dt;
      e.flash = Math.max(0, e.flash - dt);
      if (e.spawn > 0) {
        e.spawn -= dt;
        continue;
      }
      if (frozen) continue;

      if (e.type === 'grunt' || e.type === 'prog') {
        lurchTo(e, px, py, dt);
      } else if (e.type === 'hulk') {
        const h = nearestHuman(e.x, e.y);
        if (h) lurchTo(e, h.x, h.y, dt);
        else lurchTo(e, px, py, dt);
      } else if (e.type === 'spheroid') {
        bounceMove(e, dt);
        e.cd -= dt;
        if (e.cd <= 0) {
          e.cd = Math.max(0.55, 1.15 - G.wave * 0.04);
          if (G.enemies.length < 72) addEnemy('enforcer', e.x + rand(-8, 8), e.y + rand(-8, 8));
          spawnRing(e.x, e.y, SPH, 12);
          audio.hit();
        }
      } else if (e.type === 'enforcer') {
        const d = hypot(px - e.x, py - e.y);
        if (d < 70) {
          const n = norm(e.x - px, e.y - py);
          e.x += n.x * e.spd * 0.7 * dt;
          e.y += n.y * e.spd * 0.7 * dt;
          const s = snap8(px - e.x, py - e.y);
          e.fx = s[0];
          e.fy = s[1];
          clampArena(e);
        } else {
          lurchTo(e, px, py, dt);
        }
        e.cd -= dt;
        if (e.cd <= 0 && G.mode === 'play') {
          e.cd = Math.max(0.48, 1.05 - G.wave * 0.04);
          fireEnemy(e, px - e.x, py - e.y, 210 + G.wave * 6, 4, ENF, false);
          audio.hit();
        }
      } else if (e.type === 'brain') {
        const h = nearestHuman(e.x, e.y);
        if (h && hypot(h.x - e.x, h.y - e.y) < 150) {
          steerTo(e, h.x, h.y, dt);
          if (hypot(h.x - e.x, h.y - e.y) < e.r + h.r + 6) {
            e.convert += dt;
            if (e.convert > 0.85) convertHuman(h, e);
          } else e.convert = 0;
        } else {
          lurchTo(e, px, py, dt);
        }
        e.cd -= dt;
        if (e.cd <= 0 && G.mode === 'play') {
          e.cd = Math.max(0.9, 1.7 - G.wave * 0.05);
          fireEnemy(e, px - e.x, py - e.y, 130, 5.5, BRAIN, true);
        }
      }

      if (e.type !== 'hulk' && e.type !== 'spheroid') {
        const el = hitElectrode(e.x, e.y, e.r * 0.65);
        if (el) {
          killEnemy(e, G.mode === 'play');
          destroyElectrode(el);
        }
      }

      if (e.type === 'hulk') {
        for (let k = 0; k < G.humans.length; k++) {
          const h = G.humans[k];
          if (!h.alive) continue;
          if (hypot(h.x - e.x, h.y - e.y) < e.r + h.r - 1) crushHuman(h);
        }
      }
    }
    let w = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) G.enemies[w++] = G.enemies[i];
    }
    G.enemies.length = w;
    w = 0;
    for (let i = 0; i < G.electrodes.length; i++) {
      if (G.electrodes[i].alive) G.electrodes[w++] = G.electrodes[i];
    }
    G.electrodes.length = w;
  }

  function updateHumans(dt) {
    for (let i = 0; i < G.humans.length; i++) {
      const h = G.humans[i];
      if (!h.alive) continue;
      h.walk += dt * 8;
      h.think -= dt;
      let hx = h.fx;
      let hy = h.fy;
      let nearestHulk = null;
      let hd = 80;
      for (let k = 0; k < G.enemies.length; k++) {
        const e = G.enemies[k];
        if (!e.alive || (e.type !== 'hulk' && e.type !== 'brain')) continue;
        const d = hypot(e.x - h.x, e.y - h.y);
        if (d < hd) {
          hd = d;
          nearestHulk = e;
        }
      }
      if (nearestHulk) {
        const n = norm(h.x - nearestHulk.x, h.y - nearestHulk.y);
        hx = n.x;
        hy = n.y;
      } else if (h.think <= 0) {
        h.think = rand(0.35, 1.1);
        const s = OCT[(Math.random() * 8) | 0];
        h.fx = s[0];
        h.fy = s[1];
        hx = h.fx;
        hy = h.fy;
      }
      const l = hypot(hx, hy) || 1;
      h.x += (hx / l) * h.spd * dt;
      h.y += (hy / l) * h.spd * dt;
      clampArena(h);
      const el = hitElectrode(h.x, h.y, h.r * 0.6);
      if (el) crushHuman(h);
    }
    let w = 0;
    for (let i = 0; i < G.humans.length; i++) {
      if (G.humans[i].alive) G.humans[w++] = G.humans[i];
    }
    G.humans.length = w;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || !inArena(s.x, s.y, 0)) {
        G.shots.splice(i, 1);
        continue;
      }
      const el = hitElectrode(s.x, s.y, s.r);
      if (el) {
        destroyElectrode(el);
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let k = G.eShots.length - 1; k >= 0; k--) {
        const es = G.eShots[k];
        if (hypot(es.x - s.x, es.y - s.y) < es.r + s.r + 2) {
          explodeAt(es.x, es.y, es.rgb, false);
          addScore(25 * G.mult, es.x, es.y, es.rgb);
          G.eShots.splice(k, 1);
          G.shots.splice(i, 1);
          hit = true;
          audio.hit();
          break;
        }
      }
      if (hit) continue;
      for (let k = 0; k < G.enemies.length; k++) {
        const e = G.enemies[k];
        if (!e.alive || e.spawn > 0) continue;
        if (hypot(e.x - s.x, e.y - s.y) < e.r + s.r) {
          if (e.type === 'hulk') {
            e.hp -= 1;
            e.flash = 0.08;
            const n = norm(e.x - s.x, e.y - s.y);
            e.x += n.x * 11;
            e.y += n.y * 11;
            clampArena(e);
            audio.hulk();
            emit(5, {
              x: s.x, y: s.y, j: 2,
              vx0: -40, vx1: 40, vy0: -40, vy1: 40,
              life: 0.16, r0: 1.2, r1: 2.4, rgb: HULK
            });
            hitStop(0.028);
            G.shake = Math.max(G.shake, 2.5);
            if (e.hp <= 0) killEnemy(e, true);
          } else {
            e.hp -= 1;
            e.flash = 0.06;
            if (e.hp <= 0) killEnemy(e, true);
            else audio.hit();
          }
          G.shots.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      if (s.homing && G.deadT <= 0) {
        const n = norm(G.player.x - s.x, G.player.y - s.y);
        const ang = angOf(s.vx, s.vy);
        const want = angOf(n.x, n.y);
        let diff = want - ang;
        while (diff > Math.PI) diff -= TAU;
        while (diff < -Math.PI) diff += TAU;
        const maxT = s.turn * dt;
        const na = ang + clamp(diff, -maxT, maxT);
        const sp = hypot(s.vx, s.vy) || 130;
        s.vx = Math.cos(na) * sp;
        s.vy = Math.sin(na) * sp;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || !inArena(s.x, s.y, 0)) {
        G.eShots.splice(i, 1);
        continue;
      }
      const el = hitElectrode(s.x, s.y, s.r);
      if (el) {
        G.eShots.splice(i, 1);
        continue;
      }
    }
  }

  function collidePlayer() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    const p = G.player;
    for (let i = 0; i < G.humans.length; i++) {
      const h = G.humans[i];
      if (h.alive && hypot(h.x - p.x, h.y - p.y) < h.r + p.r + 2) rescueHuman(h);
    }
    const el = hitElectrode(p.x, p.y, p.r * 0.7);
    if (el) {
      hurtPlayer('电极烫到了');
      return;
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.spawn > 0) continue;
      if (hypot(e.x - p.x, e.y - p.y) < e.r + p.r - 1.5) {
        hurtPlayer(e.type === 'hulk' ? '铁拳碾过来了' : (e.type === 'brain' ? '脑机碰到了' : '撞上机兵了'));
        return;
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      if (hypot(s.x - p.x, s.y - p.y) < s.r + p.r - 0.5) {
        hurtPlayer(s.homing ? '脑弹追上了' : '被射中了');
        return;
      }
    }
  }

  function hurtPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.deadT = 0.82;
    G.lives -= 1;
    G.why = why;
    G.shots = [];
    G.eShots = [];
    resetCombo();
    G.rescue = 1;
    audio.hurt();
    kick('die');
    screenFlash(MAG, 0.48);
    hitStop(0.075);
    G.shake = Math.max(G.shake, 9);
    explodeAt(G.player.x, G.player.y, CYN, true);
    emit(18, {
      x: G.player.x, y: G.player.y, j: 8,
      vx0: -220, vx1: 220, vy0: -220, vy1: 220,
      life: 0.5, r0: 2, r1: 5, rgb: MAG
    });
  }

  function finishDeath() {
    if (G.lives <= 0) {
      loseRun(G.why);
      return;
    }
    G.player.x = VW * 0.5;
    G.player.y = VH * 0.5;
    G.invuln = 1.45;
    G.ready = 0.25;
    G.deadT = 0;
    toast('还有 ' + G.lives + ' 命', true, false);
  }

  function checkClear() {
    if (G.mode !== 'play' || G.clearT > 0 || G.deadT > 0) return;
    if (liveEnemies() > 0) return;
    G.clearT = 1.05;
    const bonus = 200 * G.wave * G.mult;
    addScore(bonus, G.player.x, G.player.y - 18, GOLD);
    audio.wave();
    toast(G.waveName + ' 清了', false, true);
    kick('boom');
    screenFlash(HOT, 0.28);
    hitStop(0.06);
  }

  function nextWave() {
    if (G.kind === 'sweep' && G.wave >= SWEEP_WAVES.length) {
      addScore(5000, G.player.x, G.player.y, GOLD);
      winRun();
      return;
    }
    G.wave += 1;
    const spec = waveSpec(G.kind, G.wave);
    spawnWave(spec);
    toast(spec.name, false, G.kind !== 'guard');
    audio.start();
  }

  function startGame(kind) {
    G.kind = kind === 'guard' ? 'guard' : 'sweep';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.saved = 0;
    resetCombo();
    G.rescue = 1;
    G.deadT = 0;
    G.clearT = 0;
    G.why = '';
    G.best = currentBest();
    const spec = waveSpec(G.kind, 1);
    spawnWave(spec);
    hideOverlay();
    audio.start();
    toast(G.kind === 'guard' ? '护人 · 多救人叠倍率' : ('扫荡 · ' + spec.name), false, G.kind === 'guard');
    setHint(autoOn
      ? '自动托管 · 救人清机 · A 停下'
      : (G.kind === 'guard' ? '多救人 · 铁拳会碾人 · 清波' : '双摇杆扫场 · 救人叠倍率 · 清波'),
      G.kind === 'guard' && !autoOn ? 'hot' : '');
    syncHud();
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'sweep';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.saved = 0;
    resetCombo();
    G.deadT = 0;
    G.clearT = 0;
    spawnWave(waveSpec('sweep', 1));
    G.invuln = 99;
    G.ready = 0;
    showOverlay('title');
    setHint(autoOn ? '自动托管 · 即将开局 · A 停下' : 'WASD 走 · 鼠标或 IJKL 射 · A 自动 · 救人叠倍率 · 清波');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('sweep');
      return;
    }
    startGame(G.kind);
  }

  function winRun() {
    if (G.mode !== 'play') return;
    G.mode = 'win';
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.45);
    hitStop(0.08);
    showOverlay('win');
    setHint('扫清了 · R 再来', 'hot');
    saveBest();
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play' && G.mode !== 'lose') return;
    G.mode = 'lose';
    G.why = why;
    fireHold = false;
    mouse.down = false;
    audio.lose();
    kick('die');
    screenFlash(MAG, 0.5);
    hitStop(0.08);
    showOverlay('lose');
    setHint('R 重开随时可用', 'warn');
    saveBest();
    syncHud();
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch += (1 - G.punch) * Math.min(1, dt * 14);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.t -= dt;
      p.y -= 28 * dt;
      if (p.t <= 0) pops.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt * 2.6;
      if (r.t >= 1) rings.splice(i, 1);
    }
  }

  function playSim(dt) {
    G.invuln = Math.max(0, G.invuln - dt);
    G.fireCd = Math.max(0, G.fireCd - dt);
    if (G.ready > 0) G.ready -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) resetCombo();
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      updatePlayer(dt);
      updateHumans(dt);
      updateShots(dt);
      collidePlayer();
      if (G.clearT <= 0) nextWave();
      return;
    }
    updatePlayer(dt);
    updateEnemies(dt);
    updateHumans(dt);
    updateShots(dt);
    collidePlayer();
    checkClear();
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    pollPad();
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.45);
      return;
    }
    if (G.mode === 'title') {
      if (autoOn) {
        autoOvWait += dt;
        if (autoOvWait >= (AUTO_START_WAIT[autoSpeed] || 0.2)) {
          autoOvWait = 0;
          startGame(G.kind);
          return;
        }
      }
      demoThink(dt);
      G.mode = 'title';
      updateEnemies(dt);
      updateHumans(dt);
      updateShots(dt);
      for (let i = 0; i < G.humans.length; i++) {
        const h = G.humans[i];
        if (h.alive && hypot(h.x - G.player.x, h.y - G.player.y) < 14) {
          h.alive = false;
          spawnRing(h.x, h.y, GOLD, 10);
        }
      }
      if (liveHumans() < 2) {
        addHuman(rand(80, VW - 80), rand(80, VH - 80), (Math.random() * 3) | 0);
      }
      updateFx(dt);
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      return;
    }
    if (autoOn && G.deadT <= 0) autoThink();
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnemies(dt);
      updateHumans(dt);
      updateShots(dt);
      if (G.deadT <= 0) finishDeath();
      updateFx(dt);
      syncHud();
      return;
    }
    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function drawArena() {
    ctx.fillStyle = '#021414';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    ctx.strokeStyle = 'rgba(0,232,216,0.045)';
    ctx.lineWidth = 1;
    const step = 24 * scale;
    for (let x = sx(WALL); x < sx(VW - WALL); x += step) {
      ctx.beginPath();
      ctx.moveTo(x, sy(WALL));
      ctx.lineTo(x, sy(VH - WALL));
      ctx.stroke();
    }
    for (let y = sy(WALL); y < sy(VH - WALL); y += step) {
      ctx.beginPath();
      ctx.moveTo(sx(WALL), y);
      ctx.lineTo(sx(VW - WALL), y);
      ctx.stroke();
    }

    const pulse = 0.45 + 0.25 * Math.sin(G.t * 3.4);
    ctx.strokeStyle = rgba(HOT, 0.35 + pulse * 0.25);
    ctx.lineWidth = Math.max(3, 5 * scale);
    ctx.strokeRect(sx(WALL * 0.45), sy(WALL * 0.45), (VW - WALL * 0.9) * scale, (VH - WALL * 0.9) * scale);
    ctx.strokeStyle = rgba(CYN, 0.85);
    ctx.lineWidth = Math.max(1.4, 2.2 * scale);
    ctx.strokeRect(sx(WALL * 0.55), sy(WALL * 0.55), (VW - WALL * 1.1) * scale, (VH - WALL * 1.1) * scale);

    ctx.restore();
  }

  function drawGuy(x, y, fx, fy, ax, ay, rgb, walk, ghost, muzzle) {
    const px = sx(x);
    const py = sy(y);
    const s = 1.15 * scale;
    const a = ghost ? 0.42 + 0.38 * Math.sin(G.t * 18) : 1;
    const ml = hypot(ax, ay) || 1;
    const ux = ax / ml;
    const uy = ay / ml;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.shadowColor = rgba(rgb, 0.75);
    ctx.shadowBlur = 12 * dpr;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.arc(px, py - 6.2 * s, 5.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillRect(px - 3.4 * s, py - 1.5 * s, 6.8 * s, 8.2 * s);
    const swing = Math.sin(walk) * 3.2 * s;
    ctx.fillRect(px - 4.2 * s, py + 6.4 * s, 3 * s, 6.5 * s + swing);
    ctx.fillRect(px + 1.2 * s, py + 6.4 * s, 3 * s, 6.5 * s - swing);
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.fillRect(px - 3.2 * s, py - 7.2 * s, 6.4 * s, 2.1 * s);
    ctx.strokeStyle = muzzle ? '#fff' : rgba(WHT, 0.95);
    ctx.lineWidth = Math.max(2, 2.4 * s);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(px + ux * 4 * s, py + uy * 2 * s);
    ctx.lineTo(px + ux * 16 * s, py + uy * 16 * s);
    ctx.stroke();
    if (muzzle) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(px + ux * 17 * s, py + uy * 17 * s, 3.4 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGrunt(e) {
    const px = sx(e.x);
    const py = sy(e.y);
    const s = scale;
    const rgb = e.flash > 0 ? WHT : e.rgb;
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowColor = rgba(rgb, 0.7);
    ctx.shadowBlur = 10 * dpr;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(-6.2 * s, -8 * s, 12.4 * s, 11 * s);
    ctx.fillRect(-4.6 * s, 3 * s, 3.2 * s, 6 * s + Math.sin(e.walk) * 2 * s);
    ctx.fillRect(1.4 * s, 3 * s, 3.2 * s, 6 * s - Math.sin(e.walk) * 2 * s);
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.fillRect(-4.6 * s, -6.4 * s, 9.2 * s, 2.2 * s);
    ctx.fillStyle = '#031012';
    ctx.fillRect(-3.4 * s, -4 * s, 2.4 * s, 2.2 * s);
    ctx.fillRect(1 * s, -4 * s, 2.4 * s, 2.2 * s);
    ctx.restore();
  }

  function drawHulk(e) {
    const px = sx(e.x);
    const py = sy(e.y);
    const s = scale;
    const rgb = e.flash > 0 ? WHT : e.rgb;
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowColor = rgba(rgb, 0.8);
    ctx.shadowBlur = 14 * dpr;
    ctx.fillStyle = rgba(HULK2, 0.95);
    ctx.fillRect(-10 * s, -11 * s, 20 * s, 22 * s);
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(-8.5 * s, -9 * s, 17 * s, 8 * s);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#031012';
    ctx.fillRect(-6 * s, -6.5 * s, 4.2 * s, 3.4 * s);
    ctx.fillRect(1.8 * s, -6.5 * s, 4.2 * s, 3.4 * s);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-5.2 * s, -5.6 * s, 2.4 * s, 1.6 * s);
    ctx.fillRect(2.6 * s, -5.6 * s, 2.4 * s, 1.6 * s);
    ctx.fillStyle = rgba(HULK2, 1);
    ctx.fillRect(-9 * s, 6 * s, 7 * s, 7 * s);
    ctx.fillRect(2 * s, 6 * s, 7 * s, 7 * s);
    ctx.restore();
  }

  function drawSpheroid(e) {
    const px = sx(e.x);
    const py = sy(e.y);
    const pulse = 1 + Math.sin(e.t * 8) * 0.08;
    ctx.save();
    ctx.shadowColor = rgba(SPH, 0.9);
    ctx.shadowBlur = 16 * dpr;
    ctx.fillStyle = rgba(e.flash > 0 ? WHT : SPH, 0.92);
    ctx.beginPath();
    ctx.arc(px, py, e.r * pulse * scale, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.arc(px, py, e.r * 0.55 * pulse * scale, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.5);
    ctx.beginPath();
    ctx.arc(px - 3 * scale, py - 3 * scale, 2.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnforcer(e) {
    const px = sx(e.x);
    const py = sy(e.y);
    const s = scale;
    const rgb = e.flash > 0 ? WHT : e.rgb;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angOf(e.fx, e.fy));
    ctx.shadowColor = rgba(rgb, 0.75);
    ctx.shadowBlur = 10 * dpr;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.moveTo(11 * s, 0);
    ctx.lineTo(-7 * s, 7.5 * s);
    ctx.lineTo(-3 * s, 0);
    ctx.lineTo(-7 * s, -7.5 * s);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#031012';
    ctx.fillRect(1 * s, -2 * s, 4 * s, 4 * s);
    ctx.restore();
  }

  function drawBrain(e) {
    const px = sx(e.x);
    const py = sy(e.y);
    const s = scale;
    const rgb = e.flash > 0 ? WHT : e.rgb;
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowColor = rgba(rgb, 0.8);
    ctx.shadowBlur = 12 * dpr;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -1 * s, 10 * s, 8.5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(WHT, 0.45);
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.arc(-2 * s, -2 * s, 4 * s, 0.2, 2.4);
    ctx.stroke();
    ctx.fillStyle = '#031012';
    ctx.beginPath();
    ctx.arc(-3.5 * s, 0.5 * s, 1.8 * s, 0, TAU);
    ctx.arc(3.5 * s, 0.5 * s, 1.8 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(-2 * s, 6 * s, 4 * s, 5 * s);
    ctx.restore();
  }

  function drawHuman(h) {
    const px = sx(h.x);
    const py = sy(h.y);
    const s = scale * (h.kind === 2 ? 0.82 : 1);
    const rgb = h.kind === 0 ? HUM : (h.kind === 1 ? HUM2 : HUM3);
    ctx.save();
    ctx.shadowColor = rgba(rgb, 0.7);
    ctx.shadowBlur = 8 * dpr;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.arc(px, py - 5 * s, 3.6 * s, 0, TAU);
    ctx.fill();
    ctx.fillRect(px - 2.4 * s, py - 1.4 * s, 4.8 * s, 6.2 * s);
    const swing = Math.sin(h.walk) * 2 * s;
    ctx.fillRect(px - 3 * s, py + 4.6 * s, 2.2 * s, 4.4 * s + swing);
    ctx.fillRect(px + 0.8 * s, py + 4.6 * s, 2.2 * s, 4.4 * s - swing);
    ctx.restore();
  }

  function drawElectrode(el) {
    const px = sx(el.x);
    const py = sy(el.y);
    const s = el.r * scale;
    const pulse = 0.65 + 0.35 * Math.sin(G.t * 7 + el.x);
    ctx.save();
    ctx.translate(px, py);
    ctx.strokeStyle = rgba(ELEC, pulse);
    ctx.fillStyle = rgba(MAG, 0.18 + pulse * 0.12);
    ctx.lineWidth = Math.max(1.4, 1.8 * scale);
    ctx.shadowColor = rgba(ELEC, 0.7);
    ctx.shadowBlur = 8 * dpr;
    if (el.kind === 0) {
      ctx.fillRect(-s * 0.22, -s, s * 0.44, s * 2);
      ctx.fillRect(-s, -s * 0.22, s * 2, s * 0.44);
      ctx.strokeRect(-s * 0.22, -s, s * 0.44, s * 2);
      ctx.strokeRect(-s, -s * 0.22, s * 2, s * 0.44);
    } else if (el.kind === 1) {
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (el.kind === 2) {
      ctx.strokeRect(-s * 0.8, -s * 0.8, s * 1.6, s * 1.6);
      ctx.strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
    } else {
      ctx.beginPath();
      ctx.moveTo(-s, -s);
      ctx.lineTo(s, s);
      ctx.moveTo(s, -s);
      ctx.lineTo(-s, s);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShot(s, enemy) {
    const x1 = sx(s.x);
    const y1 = sy(s.y);
    const x0 = sx(s.x - s.vx * 0.03);
    const y0 = sy(s.y - s.vy * 0.03);
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(s.rgb, 0.28);
    ctx.lineWidth = (enemy ? 7 : 6) * scale;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = rgba(s.rgb, 0.9);
    ctx.lineWidth = (enemy ? 3.2 : 2.6) * scale;
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    if (s.homing) {
      ctx.fillStyle = rgba(s.rgb, 0.85);
      ctx.beginPath();
      ctx.arc(x1, y1, 4.2 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.t / p.life, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = (2.6 - r.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 26) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawPops() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const a = clamp(p.t / p.life, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.font = '700 ' + (13 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillText(p.text, sx(p.x), sy(p.y));
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#020c0e';
    ctx.fillRect(0, 0, W, H);

    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake) * dpr * 0.35;
      shy = rand(-G.shake, G.shake) * dpr * 0.35;
    }
    ctx.save();
    ctx.translate(shx, shy);
    const punch = REDUCE ? 1 : G.punch;
    if (punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(punch, punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgba(HOT, m.a);
      ctx.beginPath();
      ctx.arc(m.x * W, ((m.y + G.t * 0.018 + m.p) % 1) * H, m.r, 0, TAU);
      ctx.fill();
    }

    drawArena();

    for (let i = 0; i < G.electrodes.length; i++) {
      if (G.electrodes[i].alive) drawElectrode(G.electrodes[i]);
    }
    for (let i = 0; i < G.humans.length; i++) {
      if (G.humans[i].alive) drawHuman(G.humans[i]);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.spawn > 0 && ((e.spawn * 20) | 0) % 2 === 0) continue;
      if (e.type === 'hulk') drawHulk(e);
      else if (e.type === 'spheroid') drawSpheroid(e);
      else if (e.type === 'enforcer') drawEnforcer(e);
      else if (e.type === 'brain') drawBrain(e);
      else if (e.type === 'prog') drawGuy(e.x, e.y, e.fx, e.fy, e.fx, e.fy, PROG, e.walk, false, false);
      else drawGrunt(e);
    }
    for (let i = 0; i < G.eShots.length; i++) drawShot(G.eShots[i], true);
    for (let i = 0; i < G.shots.length; i++) drawShot(G.shots[i], false);

    if (G.deadT <= 0 && !(G.mode === 'lose' && G.lives <= 0)) {
      const ghost = G.invuln > 0 && G.mode === 'play';
      drawGuy(G.player.x, G.player.y, G.player.fx, G.player.fy, G.player.ax, G.player.ay, CYN, G.player.walk, ghost, G.muzzle > 0);
    }

    drawParticles();
    drawPops();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }

    ctx.restore();
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 22; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.5, 1.6) * dpr,
        a: rand(0.03, 0.1),
        p: rand(0, 1)
      });
    }
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const padPx = 10 * dpr;
    scale = Math.max(0.4, Math.min((W - padPx * 2) / VW, (H - padPx * 2) / VH));
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    seedMotes();
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl || !speedLab) return;
    speedEl.value = String(autoSpeed);
    speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function clearPlayerMotion() {
    keys.u = keys.d = keys.l = keys.r = false;
    shoot.u = shoot.d = shoot.l = shoot.r = false;
    fireHold = false;
    mouse.down = false;
    mouseAim = false;
    stickL.on = stickR.on = false;
    stickL.x = stickL.y = stickR.x = stickR.y = 0;
    pad.mx = pad.my = pad.sx = pad.sy = 0;
    setStickKnob(knobL, 0, 0);
    setStickKnob(knobR, 0, 0);
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoTarget = null;
    syncAutoUi();
    if (autoOn) {
      clearPlayerMotion();
      audio.ensure();
      if (G.mode === 'play') setHint('自动托管 · 救人清机 · A 停下');
      else if (G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下');
      else setHint('自动仍开着 · R 再来接着托管');
    } else {
      autoMove.x = 0;
      autoMove.y = 0;
      if (G.mode === 'play') {
        setHint(G.kind === 'guard' ? '多救人 · 铁拳会碾人 · 清波' : '双摇杆扫场 · 救人叠倍率 · 清波', G.kind === 'guard' ? 'hot' : '');
      } else if (G.mode === 'title') {
        setHint('WASD 走 · 鼠标或 IJKL 射 · A 自动 · 救人叠倍率 · 清波');
      } else {
        setHint(G.mode === 'win' ? '扫清了 · R 再来' : 'R 重开随时可用', G.mode === 'win' ? 'hot' : 'warn');
      }
    }
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!(n >= 1 && n <= 4)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function autoScale() {
    if (!autoOn) return 1;
    if (G.mode === 'play') return AUTO_SCALE[autoSpeed] || 1;
    return 1;
  }

  function setStickKnob(knob, x, y) {
    if (!knob) return;
    const m = 28;
    knob.style.transform = 'translate(' + (x * m) + 'px,' + (y * m) + 'px)';
  }

  function stickFromEvent(el, e, stick) {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.5;
    const nx = (e.clientX - cx) / (r.width * 0.42);
    const ny = (e.clientY - cy) / (r.height * 0.42);
    const n = norm(nx, ny);
    const mag = Math.min(1, n.l);
    stick.x = n.x * mag;
    stick.y = n.y * mag;
  }

  function bindStick(el, stick, knob) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (autoOn) return;
      stick.on = true;
      stick.id = e.pointerId;
      if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
      stickFromEvent(el, e, stick);
      setStickKnob(knob, stick.x, stick.y);
    });
    el.addEventListener('pointermove', function (e) {
      if (!stick.on || e.pointerId !== stick.id) return;
      e.preventDefault();
      stickFromEvent(el, e, stick);
      setStickKnob(knob, stick.x, stick.y);
    });
    const end = function (e) {
      if (stick.id != null && e.pointerId !== stick.id) return;
      stick.on = false;
      stick.id = null;
      stick.x = 0;
      stick.y = 0;
      setStickKnob(knob, 0, 0);
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', function (e) {
      if (stick.on && e.pointerId === stick.id) end(e);
    });
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    audio.ensure();
    const w = worldFromPtr(e.clientX, e.clientY);
    mouse.x = w.x;
    mouse.y = w.y;
    mouseAim = true;
    if (overlayBlocksPlay() || autoOn) return;
    mouse.down = true;
    fireHold = true;
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e) {
    const w = worldFromPtr(e.clientX, e.clientY);
    mouse.x = w.x;
    mouse.y = w.y;
    mouseAim = true;
  }

  function onPointerUp(e) {
    mouse.down = false;
    fireHold = false;
  }

  function setMoveKey(dir, down) {
    if (dir === 'up') keys.u = down;
    if (dir === 'down') keys.d = down;
    if (dir === 'left') keys.l = down;
    if (dir === 'right') keys.r = down;
  }

  function setShootKey(dir, down) {
    if (dir === 'up') shoot.u = down;
    if (dir === 'down') shoot.d = down;
    if (dir === 'left') shoot.l = down;
    if (dir === 'right') shoot.r = down;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('sweep');
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      e.preventDefault();
      if (down && !e.repeat) toggleAuto();
      return;
    }
    const isUp = k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW';
    const isDn = k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS';
    const isLf = k === 'ArrowLeft';
    const isRt = k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD';
    const shUp = k === 'i' || k === 'I' || code === 'KeyI';
    const shDn = k === 'k' || k === 'K' || code === 'KeyK';
    const shLf = k === 'j' || k === 'J' || code === 'KeyJ';
    const shRt = k === 'l' || k === 'L' || code === 'KeyL';
    const isSp = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (isUp || isDn || isLf || isRt || shUp || shDn || shLf || shRt || isSp) e.preventDefault();
    if (autoOn && (isUp || isDn || isLf || isRt || shUp || shDn || shLf || shRt || isSp)) {
      if (!down) {
        if (isUp) setMoveKey('up', false);
        if (isDn) setMoveKey('down', false);
        if (isLf) setMoveKey('left', false);
        if (isRt) setMoveKey('right', false);
        if (shUp) setShootKey('up', false);
        if (shDn) setShootKey('down', false);
        if (shLf) setShootKey('left', false);
        if (shRt) setShootKey('right', false);
        if (isSp) fireHold = false;
      }
    } else if (overlayBlocksPlay() && (isUp || isDn || isLf || isRt || shUp || shDn || shLf || shRt || isSp)) {
      if (!down) {
        if (isUp) setMoveKey('up', false);
        if (isDn) setMoveKey('down', false);
        if (isLf) setMoveKey('left', false);
        if (isRt) setMoveKey('right', false);
        if (shUp) setShootKey('up', false);
        if (shDn) setShootKey('down', false);
        if (shLf) setShootKey('left', false);
        if (shRt) setShootKey('right', false);
        if (isSp) fireHold = false;
      }
    } else {
      if (isUp) setMoveKey('up', down);
      if (isDn) setMoveKey('down', down);
      if (isLf) setMoveKey('left', down);
      if (isRt) setMoveKey('right', down);
      if (shUp) setShootKey('up', down);
      if (shDn) setShootKey('down', down);
      if (shLf) setShootKey('left', down);
      if (shRt) setShootKey('right', down);
      if (isSp) fireHold = down;
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (e.repeat) return;
    if (isSp || k === 'Enter') {
      if (e.target && e.target.tagName === 'BUTTON') return;
      if (autoOn) return;
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
    }
  }

  function selfCheck() {
    const s = snap8(10, 0);
    if (s[0] !== 1 || s[1] !== 0) throw new Error('snap8 east');
    const n = snap8(0, -4);
    if (n[0] !== 0 || n[1] !== -1) throw new Error('snap8 north');
    const ne = snap8(3, -3);
    if (ne[0] !== 1 || ne[1] !== -1) throw new Error('snap8 ne');
    const w1 = waveSpec('sweep', 1);
    if (w1.grunts < 1 || w1.humans < 1) throw new Error('wave1');
    const g1 = waveSpec('guard', 1);
    if (g1.humans <= w1.humans) throw new Error('guard humans');
    if (clamp(3, 0, 2) !== 2) throw new Error('clamp');
    const sm = scoreAutoMove(VW * 0.5, VH * 0.5, 1, 0, 0.18);
    if (!isFinite(sm)) throw new Error('scoreAutoMove');
    return true;
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = false;
    shoot.u = shoot.d = shoot.l = shoot.r = false;
    fireHold = false;
    mouse.down = false;
    stickL.on = stickR.on = false;
    stickL.x = stickL.y = stickR.x = stickR.y = 0;
    setStickKnob(knobL, 0, 0);
    setStickKnob(knobR, 0, 0);
  });

  if (btnSweep) btnSweep.addEventListener('click', function () { audio.ensure(); startGame('sweep'); });
  if (btnGuard) btnGuard.addEventListener('click', function () { audio.ensure(); startGame('guard'); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (btnAuto) btnAuto.addEventListener('click', function () {
    audio.ensure();
    toggleAuto();
  });
  if (speedEl) {
    speedEl.addEventListener('input', function () { setAutoSpeed(speedEl.value); });
    speedEl.addEventListener('change', function () { setAutoSpeed(speedEl.value); });
  }
  if (modeSweep) modeSweep.addEventListener('click', function () {
    audio.ensure();
    startGame('sweep');
  });
  if (modeGuard) modeGuard.addEventListener('click', function () {
    audio.ensure();
    startGame('guard');
  });

  bindStick(vpadL, stickL, knobL);
  bindStick(vpadR, stickR, knobR);

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  selfCheck();
  loadBest();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  resize();
  bootTitle();
  syncHud();

  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('左摇杆走 · 右摇杆射 · A 自动 · 救人叠倍率');
  }

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    const turbo = autoOn && autoSpeed >= 3 && G.mode === 'play';
    if (turbo) G.stop = 0;
    const scale = autoScale();
    acc += dt * scale;
    let steps = 0;
    const maxSteps = scale >= 8 ? 48 : scale >= 4 ? 24 : 12;
    while (acc >= STEP && steps < maxSteps) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc >= STEP) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
