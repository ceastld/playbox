'use strict';

/* 雪道 — SkiFree remake. No CDN. */

(function () {
  const VW = 480;
  const VH = 720;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const METER = 14;
  const SKIER_SY = 248;
  const CW = 260;
  const CH = 240;
  const MAX_ANG = 1.12;
  const BASE_SPD = 188;
  const TUCK_SPD = 318;
  const TURN = 4.55;
  const TURN_TUCK = 1.72;
  const GRAZE = 22;
  const YETI_M = 340;
  const DOG_M = 72;
  const COMBO_WIN = 1.55;
  const BEST_KEY = 'playbox-ski-slide-best';
  const MUTE_KEY = 'playbox-ski-slide-mute';
  const AUTO_SPEED_KEY = 'playbox-ski-slide-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.45, 0.72, 1, 2.55];
  const OPS = '← → 转向 · ↓ 猫腰 · 拖指 / 倾斜 · R 重开 · A 自动';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const ICE = [61, 240, 255];
  const GOLD = [255, 227, 107];
  const WHT = [246, 243, 255];
  const PUR = [155, 92, 255];
  const PNK = [255, 160, 210];

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
  const btnFree = document.getElementById('btn-free');
  const btnGate = document.getElementById('btn-gate');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const distEl = document.getElementById('dist');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const scoreBox = document.getElementById('score-box');
  const distBox = document.getElementById('dist-box');
  const scoreAdd = document.getElementById('score-add');
  const modeLabel = document.getElementById('mode-label');
  const yetiLabel = document.getElementById('yeti-label');
  const gateLabel = document.getElementById('gate-label');
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
  let tiltOn = false;
  let autoOn = false;
  let autoSpeed = 3;
  let autoWant = 0;

  const keys = { l: false, r: false, tuck: false, brake: false };
  const pointer = { down: false, x: VW * 0.5, y: SKIER_SY + 80, id: null };
  const tilt = { x: 0, live: false };
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const tracks = [];
  const flakes = [];

  const G = {
    mode: 'title',
    kind: 'free',
    t: 0,
    clock: 0,
    seed: 1,
    score: 0,
    dist: 0,
    best: { f: 0, g: 0 },
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    grazes: 0,
    gatesOk: 0,
    gatesMiss: 0,
    nextGate: 0,
    gateN: 0,
    obs: [],
    dogs: [],
    gates: [],
    chunks: null,
    skier: {
      x: 0, y: 0, vx: 0, vy: 0, h: 0, spd: BASE_SPD,
      tuck: 0, r: 10, sqx: 1, sqy: 1
    },
    cam: { x: 0, y: -SKIER_SY },
    yeti: null,
    yetiSaid: false,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: ICE,
    punch: 1,
    slowT: 0,
    scrapeT: 0,
    sprayT: 0,
    deadT: 0,
    overShown: false,
    why: '',
    record: false,
    tuckWas: false
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function wx(x) {
    return ox + (x - G.cam.x + VW * 0.5) * scale;
  }
  function wy(y) {
    return oy + (y - G.cam.y) * scale;
  }
  function isGate() {
    return G.kind === 'gate';
  }
  function bestOf() {
    return isGate() ? G.best.g : G.best.f;
  }
  function hash(ix, iy, salt) {
    let n = Math.imul(ix | 0, 374761393) ^ Math.imul(iy | 0, 668265263) ^ (G.seed | 0) ^ (salt | 0);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function rngAt(cx, cy) {
    let a = (G.seed ^ Math.imul(cx, 374761393) ^ Math.imul(cy, 668265263)) | 0;
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    scrape: null,
    rumble: null,
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
    noise(dur, vol, hp, lp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = hp ? 'highpass' : 'lowpass';
      f.frequency.value = hp || lp || 900;
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
    ski() {
      this.ensure();
      this.noise(0.06, 0.028, 1400);
    },
    tuck() {
      this.ensure();
      this.beep(180, 0.12, 'sawtooth', 0.05, 420);
      this.noise(0.1, 0.04, 600);
    },
    turn() {
      this.ensure();
      this.noise(0.05, 0.03, 1800);
    },
    graze(n) {
      this.ensure();
      const f = 680 + Math.min(8, n) * 90;
      this.beep(f, 0.08, 'square', 0.05, f * 1.6);
      this.beep(f * 1.5, 0.1, 'triangle', 0.03, f * 2);
    },
    combo(n) {
      this.ensure();
      this.beep(520 + n * 70, 0.14, 'triangle', 0.055, 980 + n * 40);
    },
    gate() {
      this.ensure();
      this.beep(880, 0.09, 'square', 0.045, 1320);
      this.beep(1320, 0.12, 'triangle', 0.03, 1760);
    },
    miss() {
      this.ensure();
      this.beep(220, 0.16, 'sawtooth', 0.06, 90);
      this.noise(0.12, 0.04, 400);
    },
    crash() {
      this.ensure();
      this.noise(0.28, 0.12, 0, 700);
      this.beep(140, 0.22, 'sawtooth', 0.08, 50);
    },
    bite() {
      this.ensure();
      this.beep(180, 0.1, 'square', 0.07, 90);
      this.noise(0.16, 0.08, 300);
    },
    roar() {
      this.ensure();
      this.beep(70, 0.45, 'sawtooth', 0.09, 42);
      this.beep(110, 0.32, 'square', 0.05, 55);
      this.noise(0.3, 0.07, 180);
    },
    eat() {
      this.ensure();
      this.beep(90, 0.4, 'sawtooth', 0.1, 40);
      this.noise(0.36, 0.11, 120);
    },
    record() {
      this.ensure();
      this.beep(660, 0.1, 'triangle', 0.04, 990);
      this.beep(990, 0.16, 'square', 0.035, 1320);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'triangle', 0.04, 524);
      this.beep(524, 0.12, 'square', 0.03, 784);
    }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return { f: 0, g: 0 };
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        return { f: o.f | 0, g: o.g | 0 };
      }
      const n = parseInt(raw, 10) || 0;
      return { f: n, g: 0 };
    } catch (err) {
      return { f: 0, g: 0 };
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(G.best));
    } catch (err) { /* ignore */ }
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
    }, gold ? 1100 : 820);
  }

  function setHint(text) {
    if (hintEl) hintEl.textContent = text;
  }

  function popScore(n) {
    if (!scoreAdd || n <= 0) return;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    addTok += 1;
    const tok = addTok;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function addScore(n, x, y, rgb, gold) {
    if (n <= 0 || G.mode !== 'play') return;
    G.score += n;
    popScore(n);
    if (x != null) floatText(x, y, '+' + n, rgb || ICE, gold);
  }

  function syncHud() {
    if (distEl) distEl.textContent = String(G.dist);
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(bestOf());
    if (comboEl) comboEl.textContent = '×' + Math.max(1, G.combo);
    if (comboBox) {
      comboBox.classList.toggle('hot', G.combo >= 3);
    }
    if (modeLabel) {
      modeLabel.textContent = isGate() ? '旗门' : '自由';
      modeLabel.classList.toggle('gate', isGate());
    }
    if (yetiLabel) {
      const show = !!(G.yeti && G.mode === 'play');
      yetiLabel.hidden = !show;
    }
    if (gateLabel) {
      if (isGate() && G.mode === 'play') {
        gateLabel.textContent = '过 ' + G.gatesOk + ' · 漏 ' + G.gatesMiss;
      } else {
        gateLabel.textContent = '';
      }
    }
    if (autoOn && G.mode === 'play') setHint('自动托管 · A 停下 · 速度可调');
    else if (G.mode === 'title') setHint(OPS);
    else if (G.mode === 'dead') setHint('R 再滑 · 最远已记下');
    else if (G.yeti) setHint('雪人在追 · 猫腰拉开 · 别撞树');
    else if (isGate()) setHint('穿旗门 · 漏门扣分减速 · ↓ 猫腰');
    else setHint('← → 转向 · ↓ 猫腰加速 · 擦边连击 · R 重开 · A 自动');
  }

  function showTitle() {
    G.mode = 'title';
    G.kind = G.kind || 'free';
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.remove('lose', 'win');
    ovKicker.textContent = 'SKI';
    ovTitle.textContent = '雪道';
    ovLead.textContent = '往下滑，躲开树。猫腰加速，转弯更钝。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    resetRun(true);
    syncHud();
  }

  function showDead() {
    G.overShown = true;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.add('lose');
    panel.classList.remove('win');
    const titles = {
      tree: '撞树了',
      rock: '撞石了',
      pole: '撞旗了',
      dog: '被狗咬了',
      yeti: '被吃了'
    };
    ovKicker.textContent = G.why === 'yeti' ? 'YETI' : 'CRASH';
    ovTitle.textContent = titles[G.why] || '摔了';
    const rec = G.record ? ' · 新纪录' : '';
    ovLead.textContent = '滑了 ' + G.dist + ' 米 · 擦边 ' + G.grazes +
      ' · 连擦 ×' + Math.max(1, G.maxCombo) +
      (isGate() ? ' · 旗门 ' + G.gatesOk + '/' + (G.gatesOk + G.gatesMiss) : '') +
      rec;
    ovOps.textContent = 'R 再滑 · 最远 ' + bestOf() + ' 米';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    syncHud();
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const c = cls || (mag >= 5 ? 'die' : 'graze');
    stageEl.classList.remove('die', 'graze', 'gate');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
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
    capArr(particles, 240);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 32);
    capArr(rings, 20);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.7,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -92 : -74
    });
    capArr(floats, 22);
  }

  function spray(amt) {
    const s = G.skier;
    const back = s.h + Math.PI;
    const px = s.x + Math.sin(back) * 8;
    const py = s.y - Math.cos(back) * 6;
    emit(amt, {
      x: px, y: py, j: 4,
      vx0: -70 - s.vx * 0.2, vx1: 70 - s.vx * 0.2,
      vy0: -40 - s.vy * 0.15, vy1: 20 - s.vy * 0.05,
      life: 0.28, r0: 0.8, r1: 2.2, rgb: WHT, g: 80
    });
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    tracks.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

  function seedFlakes() {
    flakes.length = 0;
    for (let i = 0; i < 70; i++) {
      flakes.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.4),
        r: rand(0.6, 1.7),
        a: rand(0.18, 0.55)
      });
    }
  }

  function resetRun(demo) {
    G.seed = (Math.random() * 0x7fffffff) | 0;
    G.obs = [];
    G.dogs = [];
    G.gates = [];
    G.chunks = Object.create(null);
    G.yeti = null;
    G.yetiSaid = false;
    G.score = 0;
    G.dist = 0;
    G.combo = 0;
    G.comboT = 0;
    G.maxCombo = 0;
    G.grazes = 0;
    G.gatesOk = 0;
    G.gatesMiss = 0;
    G.nextGate = 220;
    G.gateN = 0;
    G.slowT = 0;
    G.scrapeT = 0;
    G.sprayT = 0;
    G.deadT = 0;
    G.overShown = false;
    G.why = '';
    G.record = false;
    G.tuckWas = false;
    G.skier.x = 0;
    G.skier.y = 0;
    G.skier.vx = 0;
    G.skier.vy = BASE_SPD;
    G.skier.h = 0;
    G.skier.spd = BASE_SPD;
    G.skier.tuck = 0;
    G.skier.r = 10;
    G.skier.sqx = 1;
    G.skier.sqy = 1;
    G.skier._brake = false;
    autoWant = 0;
    pointer.down = false;
    pointer.id = null;
    G.cam.x = 0;
    G.cam.y = -SKIER_SY;
    resetFx();
    seedFlakes();
    fillChunks();
    if (!demo) G.t = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'gate' ? 'gate' : 'free';
    G.mode = 'play';
    resetRun(false);
    hideOverlay();
    audio.start();
    toast(isGate() ? '旗门 · 漏门扣分' : '自由 · 越远越好', false, isGate());
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('free');
    else startGame(G.kind || 'free');
  }

  function chunkKey(cx, cy) {
    return cx + ':' + cy;
  }

  function nearGate(x, y) {
    for (let i = 0; i < G.gates.length; i++) {
      const g = G.gates[i];
      if (Math.abs(g.y - y) < 46 && Math.abs(g.x - x) < g.w * 0.5 + 28) return true;
    }
    return false;
  }

  function pushObs(o) {
    G.obs.push(o);
  }

  function ensureGates() {
    if (!isGate()) return;
    const ahead = G.skier.y + 980;
    while (G.nextGate < ahead) {
      const n = G.gateN;
      const w = clamp(166 - n * 1.6, 96, 166);
      const x = Math.sin(n * 0.72) * 128 + ((n % 2) ? 42 : -42);
      const y = G.nextGate;
      G.gates.push({ x: x, y: y, w: w, done: 0, n: n });
      pushObs({
        type: 'pole', x: x - w * 0.5, y: y, r: 7,
        kind: n % 2, grazed: false, z: 1
      });
      pushObs({
        type: 'pole', x: x + w * 0.5, y: y, r: 7,
        kind: 1 - (n % 2), grazed: false, z: 1
      });
      G.gateN += 1;
      G.nextGate += clamp(228 - n * 1.2, 168, 228);
    }
  }

  function genChunk(cx, cy) {
    const key = chunkKey(cx, cy);
    if (G.chunks[key]) return;
    G.chunks[key] = 1;
    if (cy < 1) return;
    const rng = rngAt(cx, cy);
    const x0 = cx * CW;
    const y0 = cy * CH;
    const meters = y0 / METER;
    const dense = clamp(1.6 + meters / 85, 1.6, 10.5);
    const nTree = (dense + rng() * 3) | 0;
    for (let i = 0; i < nTree; i++) {
      const x = x0 + 18 + rng() * (CW - 36);
      const y = y0 + 18 + rng() * (CH - 36);
      if (nearGate(x, y)) continue;
      if (hypot(x - G.skier.x, y - G.skier.y) < 90 && cy <= 1) continue;
      const big = rng() > 0.72;
      pushObs({
        type: 'tree',
        x: x, y: y,
        r: big ? 15 : 11,
        h: big ? 46 : 34,
        hue: rng(),
        grazed: false,
        z: 1
      });
    }
    if (rng() < 0.55) {
      const rocks = 1 + (rng() * 2) | 0;
      for (let i = 0; i < rocks; i++) {
        const x = x0 + 20 + rng() * (CW - 40);
        const y = y0 + 20 + rng() * (CH - 40);
        if (nearGate(x, y)) continue;
        pushObs({
          type: 'rock', x: x, y: y, r: 9 + rng() * 4,
          grazed: false, z: 0, hue: rng()
        });
      }
    }
    const bumps = 2 + (rng() * 3) | 0;
    for (let i = 0; i < bumps; i++) {
      pushObs({
        type: 'bump',
        x: x0 + rng() * CW,
        y: y0 + rng() * CH,
        r: 0,
        z: -1,
        hue: rng()
      });
    }
    if (meters > DOG_M && rng() < 0.16 && G.dogs.length < 3) {
      G.dogs.push({
        x: x0 + rng() * CW,
        y: y0 + rng() * CH,
        vx: 0, vy: 0,
        r: 11,
        bark: rng() * 1.4,
        grazed: false
      });
    }
  }

  function fillChunks() {
    const s = G.skier;
    const c0x = Math.floor((s.x - 560) / CW);
    const c1x = Math.floor((s.x + 560) / CW);
    const c0y = Math.floor((s.y - 160) / CH);
    const c1y = Math.floor((s.y + 1040) / CH);
    for (let cy = c0y; cy <= c1y; cy++) {
      for (let cx = c0x; cx <= c1x; cx++) genChunk(cx, cy);
    }
    ensureGates();
  }

  function cull() {
    const s = G.skier;
    const keep = [];
    for (let i = 0; i < G.obs.length; i++) {
      const o = G.obs[i];
      if (o.y < s.y - 260 || o.y > s.y + 1120) continue;
      if (Math.abs(o.x - s.x) > 740) continue;
      keep.push(o);
    }
    G.obs = keep;
    const dogs = [];
    for (let i = 0; i < G.dogs.length; i++) {
      const d = G.dogs[i];
      if (d.y < s.y - 280 || Math.abs(d.x - s.x) > 820) continue;
      dogs.push(d);
    }
    G.dogs = dogs;
    if (G.gates.length > 28) {
      let cut = 0;
      while (cut < G.gates.length && G.gates[cut].y < s.y - 200) cut += 1;
      if (cut) G.gates.splice(0, cut);
    }
  }

  function comboName(n) {
    if (n >= 10) return '飞刃';
    if (n >= 7) return '神滑';
    if (n >= 5) return '好险';
    if (n >= 3) return '连擦';
    return '擦边';
  }

  function doGraze(x, y) {
    G.grazes += 1;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const n = 12 * G.combo;
    addScore(n, x, y, G.combo >= 5 ? GOLD : ICE, G.combo >= 4);
    floatText(x, y - 18, comboName(G.combo) + ' ×' + G.combo, G.combo >= 5 ? GOLD : ICE, G.combo >= 4);
    emit(12 + Math.min(10, G.combo), {
      x: x, y: y, j: 8,
      vx0: -220, vx1: 220, vy0: -180, vy1: 80,
      life: 0.32, r0: 1.2, r1: 3.2, rgb: G.combo >= 5 ? GOLD : ICE
    });
    popSpark(x, y, G.combo >= 5 ? GOLD : ICE, 12 + G.combo);
    screenFlash(G.combo >= 5 ? GOLD : ICE, 0.22 + Math.min(0.2, G.combo * 0.03));
    hitStop(clamp(0.032 + G.combo * 0.004, 0.032, 0.055));
    kick(2.2 + Math.min(3, G.combo * 0.35), 'graze');
    G.skier.sqx = 1.18;
    G.skier.sqy = 0.86;
    audio.graze(G.combo);
    if (G.combo === 3 || G.combo === 5 || G.combo === 7 || G.combo === 10) {
      audio.combo(G.combo);
      toast(comboName(G.combo) + ' ×' + G.combo, false, G.combo >= 5);
    }
    if (comboBox) {
      comboTok += 1;
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    syncHud();
  }

  function crash(why, hx, hy) {
    if (G.mode === 'title') {
      resetRun(true);
      return;
    }
    if (G.mode !== 'play') return;
    G.mode = 'dead';
    G.why = why;
    G.deadT = 0;
    G.overShown = false;
    G.skier.sqx = 1.92;
    G.skier.sqy = 0.28;
    G.skier.vx = 0;
    G.skier.vy = 0;
    const x = hx == null ? G.skier.x : hx;
    const y = hy == null ? G.skier.y : hy;
    emit(28, {
      x: x, y: y, j: 12,
      vx0: -280, vx1: 280, vy0: -240, vy1: 140,
      life: 0.55, r0: 1.5, r1: 4.4, rgb: why === 'yeti' ? WHT : MAG
    });
    emit(14, {
      x: x, y: y, j: 8,
      vx0: -160, vx1: 160, vy0: -120, vy1: 80,
      life: 0.4, r0: 1, r1: 2.6, rgb: ICE
    });
    popSpark(x, y, MAG, 26);
    screenFlash(MAG, 0.55);
    hitStop(0.078);
    kick(7.5, 'die');
    if (why === 'yeti') audio.eat();
    else if (why === 'dog') audio.bite();
    else audio.crash();
    maybeBest(true);
    syncHud();
  }

  function maybeBest(forceSave) {
    if (G.mode === 'title') return;
    const k = isGate() ? 'g' : 'f';
    if (G.dist > G.best[k]) {
      G.best[k] = G.dist;
      if (!G.record) {
        G.record = true;
        saveBest();
        if (G.dist >= 25) {
          audio.record();
          toast('新纪录 ' + G.dist + ' 米', false, true);
        }
        if (distBox) {
          distBox.classList.remove('flash');
          void distBox.offsetWidth;
          distBox.classList.add('flash');
        }
      } else if (forceSave || G.dist % 10 === 0) saveBest();
    }
  }

  function passGate(g) {
    g.done = 1;
    G.gatesOk += 1;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const n = 40 * G.combo;
    addScore(n, g.x, g.y, GOLD, true);
    floatText(g.x, g.y - 22, '过门 ×' + G.combo, GOLD, true);
    emit(16, {
      x: g.x, y: g.y, j: 18,
      vx0: -200, vx1: 200, vy0: -160, vy1: 60,
      life: 0.36, r0: 1.2, r1: 3.4, rgb: GOLD
    });
    popSpark(g.x, g.y, GOLD, 22);
    screenFlash(GOLD, 0.28);
    hitStop(0.04);
    kick(3.2, 'gate');
    audio.gate();
    syncHud();
  }

  function missGate(g) {
    g.done = -1;
    G.gatesMiss += 1;
    G.combo = 0;
    G.comboT = 0;
    const pen = 80;
    G.score = Math.max(0, G.score - pen);
    G.slowT = Math.max(G.slowT, 0.48);
    floatText(G.skier.x, G.skier.y - 10, '漏门 −' + pen, MAG, false);
    screenFlash(MAG, 0.32);
    kick(4.2, 'die');
    audio.miss();
    toast('漏门 −' + pen, true, false);
    syncHud();
  }

  function skierRadius() {
    return G.skier.tuck > 0.6 ? 8.2 : 10;
  }

  function nextOpenGate(skip) {
    let n = skip | 0;
    for (let i = 0; i < G.gates.length; i++) {
      const g = G.gates[i];
      if (g.done) continue;
      if (g.y < G.skier.y - 6) continue;
      if (n === 0) return g;
      n -= 1;
    }
    return null;
  }

  function autoSim(hWant, tuckOn) {
    const s = G.skier;
    const sr = tuckOn ? 8.2 : 10;
    const turn = tuckOn ? TURN_TUCK : TURN;
    const distMul = 1 + Math.min(0.32, G.dist / 920);
    const gate = isGate() ? nextOpenGate(0) : null;
    let x = s.x;
    let y = s.y;
    let h = s.h;
    let minD = 72;
    let xAtGate = null;
    const dt = 0.028;
    const lookY = gate ? 360 : 300;
    let t = 0;
    for (let i = 0; i < 56; i++) {
      t += dt;
      if (h < hWant) h = Math.min(hWant, h + turn * dt);
      else if (h > hWant) h = Math.max(hWant, h - turn * dt);
      let spd = lerp(BASE_SPD, TUCK_SPD, tuckOn ? 1 : 0);
      spd *= 0.44 + 0.56 * Math.pow(Math.max(0, Math.cos(h)), 1.05);
      spd *= distMul;
      x += Math.sin(h) * spd * dt;
      y += Math.cos(h) * spd * dt;
      if (gate && xAtGate == null && y >= gate.y) xAtGate = x;
      for (let j = 0; j < G.obs.length; j++) {
        const o = G.obs[j];
        if (!o.r) continue;
        const ody = o.y - y;
        if (ody < -16 || ody > 26) continue;
        const pad = o.type === 'pole' ? 6 : 3;
        const gap = hypot(x - o.x, y - o.y) - sr - o.r - pad;
        if (gap < minD) minD = gap;
        if (gap < 0) {
          return { hit: 1, minD: gap, x: x, y: y, h: h, xAtGate: xAtGate };
        }
      }
      for (let j = 0; j < G.dogs.length; j++) {
        const dog = G.dogs[j];
        const dx = dog.x + dog.vx * t;
        const dy = dog.y + dog.vy * t;
        const gap = hypot(x - dx, y - dy) - sr - dog.r - 3;
        if (gap < minD) minD = gap;
        if (gap < 0) {
          return { hit: 1, minD: gap, x: x, y: y, h: h, xAtGate: xAtGate };
        }
      }
      if (y - s.y >= lookY) break;
    }
    return { hit: 0, minD: minD, x: x, y: y, h: h, xAtGate: xAtGate };
  }

  function autoPick() {
    const s = G.skier;
    const gate = isGate() ? nextOpenGate(0) : null;
    const cands = [];
    function addH(h) {
      h = clamp(h, -MAX_ANG, MAX_ANG);
      for (let i = 0; i < cands.length; i++) {
        if (Math.abs(cands[i] - h) < 0.025) return;
      }
      cands.push(h);
    }
    addH(0);
    addH(s.h);
    addH(autoWant);
    for (let i = -6; i <= 6; i++) addH(i * 0.18);
    addH(-MAX_ANG);
    addH(MAX_ANG);
    if (gate) {
      const dy = Math.max(36, gate.y - s.y);
      const gh = Math.atan2(gate.x - s.x, dy);
      addH(gh);
      addH(gh - 0.1);
      addH(gh + 0.1);
      addH(gh - 0.2);
      addH(gh + 0.2);
      const g2 = nextOpenGate(1);
      if (g2) {
        addH(Math.atan2(g2.x - s.x, Math.max(36, g2.y - s.y)));
      }
    }

    const yeti = !!G.yeti;
    let bestH = 0;
    let bestS = -1e12;
    let bestClear = 0;
    let bestNeedTurn = 0;
    for (let i = 0; i < cands.length; i++) {
      const h0 = cands[i];
      const sharp = Math.abs(h0 - s.h) > 0.55;
      let tuckTry = !sharp && Math.abs(h0) < (yeti ? 0.62 : 0.42);
      if (gate && gate.y - s.y < 220 && Math.abs(s.x - gate.x) > 14) tuckTry = false;
      const sim = autoSim(h0, tuckTry);
      let score;
      if (sim.hit) {
        score = -12000 + (sim.y - s.y) * 14 + sim.minD * 40;
      } else {
        score = Math.min(8, sim.minD) * 1.5;
        if (sim.minD < 5) score -= (5 - sim.minD) * 40;
        score += Math.cos(h0) * 120;
        score -= Math.abs(h0) * 55;
        score -= Math.abs(h0 - s.h) * 12;
        score -= Math.abs(h0 - autoWant) * 14;
        if (yeti) score += (1 - Math.abs(h0) / MAX_ANG) * 90;
        if (tuckTry) score += 14;
      }
      if (gate) {
        const gx = sim.xAtGate != null ? sim.xAtGate : sim.x;
        const half = Math.max(10, gate.w * 0.5 - 20);
        const err = Math.abs(gx - gate.x);
        if (err > half) score -= 900 + (err - half) * 14;
        else score += 160 - err * 1.1;
        const aim = Math.atan2(gate.x - s.x, Math.max(36, gate.y - s.y));
        score -= Math.abs(h0 - aim) * 22;
      }
      if (score > bestS) {
        bestS = score;
        bestH = h0;
        bestClear = sim.hit ? 0 : sim.minD;
        bestNeedTurn = Math.abs(h0 - s.h);
      }
    }
    let tuck = 0;
    if (bestClear > (yeti ? 38 : 78) && bestNeedTurn < 0.48 && Math.abs(bestH) < (yeti ? 0.58 : 0.4)) {
      tuck = 1;
    }
    if (yeti && Math.abs(bestH) < 0.5 && bestClear > 28) tuck = 1;
    if (gate) {
      const dy = gate.y - s.y;
      if (dy < 140 && Math.abs(s.x - gate.x) > gate.w * 0.22) tuck = 0;
    }
    return { h: bestH, tuck: tuck };
  }

  function autoSteer(dt) {
    const s = G.skier;
    const pick = autoPick();
    autoWant = pick.h;
    const tuck = pick.tuck;
    const rate = tuck > 0.5 ? 5.2 : 9.5;
    s.h = clamp(lerp(s.h, autoWant, 1 - Math.exp(-dt * rate)), -MAX_ANG, MAX_ANG);
    s.tuck = lerp(s.tuck, tuck, 1 - Math.exp(-dt * 10));
    s._brake = false;
  }

  function clearPlayerSteer() {
    keys.l = false;
    keys.r = false;
    keys.tuck = false;
    keys.brake = false;
    pointer.down = false;
    pointer.id = null;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl) return;
    speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoWant = G.skier.h;
    clearPlayerSteer();
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('free');
    }
    syncHud();
  }

  function setAutoSpeed(n) {
    if (n < 1 || n > 4 || !isFinite(n)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function readSteer(dt) {
    const s = G.skier;
    let want = s.h;
    let tuck = 0;
    let brake = 0;
    let used = false;

    if (G.mode === 'title') {
      let push = 0;
      let clear = 1;
      for (let i = 0; i < G.obs.length; i++) {
        const o = G.obs[i];
        if (!o.r) continue;
        const dy = o.y - s.y;
        const dx = o.x - s.x;
        if (dy < 12 || dy > 190) continue;
        if (Math.abs(dx) > 88) continue;
        const w = (190 - dy) / 190 * (1 - Math.abs(dx) / 88);
        push += dx > 0 ? -w : w;
        if (dy < 110 && Math.abs(dx) < 42) clear = 0;
      }
      want = clamp(s.h + clamp(push, -1, 1) * 0.9, -MAX_ANG, MAX_ANG);
      tuck = clear ? 0.85 : 0.15;
      s.h = lerp(s.h, want, 1 - Math.exp(-dt * 7));
      s.tuck = lerp(s.tuck, tuck, 1 - Math.exp(-dt * 8));
      s._brake = false;
      return;
    }

    if (autoOn && G.mode === 'play') {
      autoSteer(dt);
      return;
    }

    if (pointer.down) {
      const dx = pointer.x - VW * 0.5;
      const dy = pointer.y - SKIER_SY;
      want = clamp(Math.atan2(dx, Math.max(36, dy)), -MAX_ANG, MAX_ANG);
      if (dy > 54) tuck = 1;
      if (dy < -28) brake = 1;
      used = true;
    } else if (tilt.live && !keys.l && !keys.r) {
      want = clamp(tilt.x * MAX_ANG, -MAX_ANG, MAX_ANG);
      used = true;
    }

    if (keys.tuck) tuck = 1;
    if (keys.brake) brake = 1;

    if (keys.l || keys.r) {
      const dir = (keys.l ? -1 : 0) + (keys.r ? 1 : 0);
      const rate = (tuck > 0.5 ? TURN_TUCK : TURN);
      s.h = clamp(s.h + dir * rate * dt, -MAX_ANG, MAX_ANG);
    } else if (used) {
      const rate = tuck > 0.5 ? 5.2 : 9.5;
      const prev = s.h;
      s.h = lerp(s.h, want, 1 - Math.exp(-dt * rate));
      if (Math.abs(s.h - prev) > 0.55 * dt * 8) {
        /* turning hard */
      }
    } else {
      s.h = lerp(s.h, 0, 1 - Math.exp(-dt * 1.15));
    }

    s.tuck = lerp(s.tuck, tuck, 1 - Math.exp(-dt * 10));
    if (brake && tuck < 0.5) s.tuck = lerp(s.tuck, 0, 1 - Math.exp(-dt * 10));
    s._brake = brake && tuck < 0.5;
  }

  function spawnYeti() {
    if (G.yeti || G.yetiSaid || G.dist < YETI_M || G.mode !== 'play') return;
    G.yetiSaid = true;
    G.yeti = {
      x: G.skier.x + rand(-40, 40),
      y: G.skier.y - 240,
      vx: 0, vy: 80,
      r: 24,
      eat: 0,
      hum: 0.2
    };
    audio.roar();
    toast('雪人来了', true, false);
    screenFlash(WHT, 0.4);
    kick(5, 'die');
    syncHud();
  }

  function updateDogs(dt) {
    const s = G.skier;
    for (let i = 0; i < G.dogs.length; i++) {
      const d = G.dogs[i];
      const dx = s.x - d.x;
      const dy = s.y - d.y;
      const dist = hypot(dx, dy) || 1;
      const chase = dist < 280;
      const spd = chase ? 210 : 70;
      d.vx = lerp(d.vx, (dx / dist) * spd, 1 - Math.exp(-dt * 3));
      d.vy = lerp(d.vy, (dy / dist) * spd * 0.85 + 40, 1 - Math.exp(-dt * 3));
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.bark -= dt;
      if (d.bark < 0 && chase && G.mode === 'play') {
        d.bark = rand(0.9, 1.8);
        audio.beep(740, 0.05, 'square', 0.025, 420);
      }
      const hit = hypot(s.x - d.x, s.y - d.y);
      const rad = skierRadius() + d.r;
      if (hit < rad) {
        crash('dog', d.x, d.y);
        return;
      }
      if (!d.grazed && hit < rad + GRAZE && Math.abs(s.y - d.y) < 16) {
        d.grazed = true;
        doGraze((s.x + d.x) * 0.5, (s.y + d.y) * 0.5);
      }
    }
  }

  function updateYeti(dt) {
    const y = G.yeti;
    if (!y) return;
    const s = G.skier;
    const dx = s.x - y.x;
    const dy = s.y - y.y;
    const dist = hypot(dx, dy) || 1;
    const distMul = 1 + Math.min(0.32, G.dist / 920);
    const spd = (BASE_SPD * 1.12 + 86) * distMul + 18;
    y.vx = lerp(y.vx, (dx / dist) * spd, 1 - Math.exp(-dt * 2.4));
    y.vy = lerp(y.vy, (dy / dist) * spd, 1 - Math.exp(-dt * 2.4));
    y.x += y.vx * dt;
    y.y += y.vy * dt;
    y.hum -= dt;
    if (y.hum <= 0 && G.mode === 'play') {
      y.hum = 0.48;
      audio.beep(62, 0.18, 'sawtooth', 0.04, 48);
    }
    if (dist < skierRadius() + y.r) {
      crash('yeti', s.x, s.y);
      return;
    }
  }

  function collideHazards() {
    const s = G.skier;
    const sr = skierRadius();
    for (let i = 0; i < G.obs.length; i++) {
      const o = G.obs[i];
      if (!o.r) continue;
      const dx = s.x - o.x;
      const dy = s.y - o.y;
      const dist = hypot(dx, dy);
      const rad = sr + o.r;
      if (dist < rad) {
        crash(o.type === 'rock' ? 'rock' : o.type === 'pole' ? 'pole' : 'tree', o.x, o.y);
        return;
      }
      if (!o.grazed && dist < rad + GRAZE && Math.abs(dy) < 15) {
        o.grazed = true;
        doGraze((s.x + o.x) * 0.5, s.y);
      }
    }
  }

  function updateGates() {
    if (!isGate()) return;
    const s = G.skier;
    for (let i = 0; i < G.gates.length; i++) {
      const g = G.gates[i];
      if (g.done) continue;
      if (s.y >= g.y) {
        if (Math.abs(s.x - g.x) <= g.w * 0.5) passGate(g);
        else missGate(g);
      }
    }
  }

  function updateMeters() {
    if (G.mode !== 'play') return;
    const m = Math.floor(G.skier.y / METER);
    if (m > G.dist) {
      const d = m - G.dist;
      G.dist = m;
      G.score += d;
      maybeBest(false);
      if (distBox && d > 0 && G.dist % 50 === 0) {
        distBox.classList.remove('flash');
        void distBox.offsetWidth;
        distBox.classList.add('flash');
        if (G.dist % 100 === 0) toast(G.dist + ' 米', false, G.dist >= 300);
      }
    }
  }

  function updateFx(dt) {
    G.shake *= Math.exp(-dt * 9);
    G.flash *= Math.exp(-dt * 7);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    G.comboT -= dt;
    if (G.comboT <= 0 && G.combo > 0 && G.mode === 'play') {
      G.combo = 0;
      syncHud();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.34) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.8);
      if (f.t > f.life) floats.splice(i, 1);
    }
    const s = G.skier;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.y -= (40 + s.spd * 0.55) * f.z * dt;
      f.x -= s.vx * 0.35 * f.z * dt;
      if (f.y < -8) { f.y = VH + 8; f.x = rand(0, VW); }
      if (f.x < -8) f.x += VW + 16;
      if (f.x > VW + 8) f.x -= VW + 16;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    G.slowT = Math.max(0, G.slowT - dt);

    if (G.mode === 'dead') {
      G.deadT += dt;
      G.skier.sqx = lerp(G.skier.sqx, 1.55, 1 - Math.exp(-dt * 4));
      G.skier.sqy = lerp(G.skier.sqy, 0.42, 1 - Math.exp(-dt * 4));
      if (!G.overShown && G.deadT > 0.62) showDead();
      return;
    }

    if (G.mode !== 'play' && G.mode !== 'title') return;

    const s = G.skier;
    const prevH = s.h;
    readSteer(dt);

    if (G.mode === 'play' && s.tuck > 0.7 && !G.tuckWas) audio.tuck();
    G.tuckWas = s.tuck > 0.7;
    if (G.mode === 'play' && Math.abs(s.h - prevH) > 2.6 * dt) audio.turn();

    const down = Math.cos(s.h);
    const distMul = 1 + Math.min(0.32, G.dist / 920);
    const tuckK = s.tuck;
    let spd = lerp(BASE_SPD, TUCK_SPD, tuckK);
    spd *= 0.44 + 0.56 * Math.pow(Math.max(0, down), 1.05);
    spd *= distMul;
    if (s._brake) spd *= 0.52;
    if (G.slowT > 0) spd *= 0.58;
    s.spd = spd;
    s.vx = Math.sin(s.h) * spd;
    s.vy = Math.cos(s.h) * spd;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.r = skierRadius();

    const tx = tuckK > 0.55 ? 0.8 : 1;
    const ty = tuckK > 0.55 ? 1.2 : 1;
    s.sqx = lerp(s.sqx, tx, 1 - Math.exp(-dt * 14));
    s.sqy = lerp(s.sqy, ty, 1 - Math.exp(-dt * 14));

    G.cam.x = lerp(G.cam.x, s.x + Math.sin(s.h) * 48, 1 - Math.exp(-dt * 7.5));
    G.cam.y = s.y - SKIER_SY;

    tracks.push({ x: s.x, y: s.y, h: s.h, a: 1 });
    if (tracks.length > 90) tracks.splice(0, tracks.length - 90);

    G.sprayT += dt;
    if (G.sprayT > (tuckK > 0.5 ? 0.028 : 0.05)) {
      G.sprayT = 0;
      spray(tuckK > 0.5 ? 3 : 2);
    }
    G.scrapeT += dt;
    if (G.mode === 'play' && G.scrapeT > 0.085) {
      G.scrapeT = 0;
      audio.ski();
    }

    fillChunks();
    if ((G.clock * 8 | 0) % 2 === 0) cull();
    updateDogs(dt);
    spawnYeti();
    updateYeti(dt);
    if (G.mode === 'dead') return;
    collideHazards();
    if (G.mode === 'dead') return;
    updateGates();
    updateMeters();
    syncHud();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#08131c');
    g.addColorStop(0.45, '#071820');
    g.addColorStop(1, '#0a1020');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    const x0 = Math.floor((G.cam.x - VW) / 36);
    const y0 = Math.floor(G.cam.y / 36);
    for (let iy = y0; iy <= y0 + 24; iy++) {
      for (let ix = x0; ix <= x0 + 28; ix++) {
        const h = hash(ix, iy, 9);
        if (h < 0.55) continue;
        const px = ix * 36 + h * 28;
        const py = iy * 36 + hash(iy, ix, 3) * 28;
        const a = 0.07 + h * 0.12;
        ctx.fillStyle = rgba(h > 0.92 ? ICE : WHT, a);
        ctx.beginPath();
        ctx.arc(wx(px), wy(py), (0.6 + h * 1.1) * scale, 0, TAU);
        ctx.fill();
      }
    }
    ctx.strokeStyle = rgba(ICE, 0.05);
    ctx.lineWidth = 1 * scale;
    const band = 72;
    const yStart = Math.floor(G.cam.y / band) * band;
    ctx.beginPath();
    for (let y = yStart; y < G.cam.y + VH + band; y += band) {
      ctx.moveTo(sx(0), wy(y));
      ctx.lineTo(sx(VW), wy(y));
    }
    ctx.stroke();
    ctx.restore();
  }

  function sx(x) { return ox + x * scale; }
  function sy(y) { return oy + y * scale; }

  function onScreen(x, y, pad) {
    const px = x - G.cam.x + VW * 0.5;
    const py = y - G.cam.y;
    return px > -pad && px < VW + pad && py > -pad && py < VH + pad;
  }

  function drawTracks() {
    if (tracks.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    for (let side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        const nx = Math.cos(t.h) * 5 * side;
        const ny = Math.sin(t.h) * 5 * side;
        const x = wx(t.x + nx);
        const y = wy(t.y + ny);
        if (first) { ctx.moveTo(x, y); first = false; }
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(180, 230, 255, 0.3)';
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBump(o) {
    ctx.save();
    ctx.fillStyle = rgba(ICE, 0.08);
    ctx.beginPath();
    ctx.ellipse(wx(o.x), wy(o.y), 16 * scale, 7 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawTree(o) {
    const x = wx(o.x);
    const y = wy(o.y);
    const h = o.h * scale;
    const w = (o.r + 6) * scale;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(x, y + 3 * scale, o.r * 1.15 * scale, o.r * 0.38 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a2a22';
    ctx.fillRect(x - 2 * scale, y - h * 0.18, 4 * scale, h * 0.22);
    const rgb = o.hue > 0.7 ? [40, 170, 190] : o.hue > 0.4 ? [30, 150, 170] : [50, 130, 160];
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.strokeStyle = rgba(ICE, 0.55);
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x - w, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(ICE, 0.18);
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w * 0.35, y - h * 0.25);
    ctx.lineTo(x, y - h * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawRock(o) {
    const x = wx(o.x);
    const y = wy(o.y);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 3 * scale, o.r * 1.1 * scale, o.r * 0.4 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a3348';
    ctx.strokeStyle = rgba(PUR, 0.55);
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.ellipse(x, y - 2 * scale, o.r * scale, o.r * 0.62 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(ICE, 0.2);
    ctx.beginPath();
    ctx.ellipse(x - 3 * scale, y - 5 * scale, o.r * 0.35 * scale, o.r * 0.18 * scale, -0.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPole(o) {
    const x = wx(o.x);
    const y = wy(o.y);
    const mag = o.kind === 0;
    ctx.save();
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 28 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(mag ? MAG : ICE, 0.92);
    ctx.beginPath();
    ctx.moveTo(x, y - 28 * scale);
    ctx.lineTo(x + (mag ? -14 : 14) * scale, y - 22 * scale);
    ctx.lineTo(x, y - 16 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawGateBanner(g) {
    if (g.done < 0) return;
    const x1 = wx(g.x - g.w * 0.5);
    const x2 = wx(g.x + g.w * 0.5);
    const y = wy(g.y) - 26 * scale;
    ctx.save();
    ctx.strokeStyle = g.done === 1 ? rgba(GOLD, 0.35) : rgba(ICE, 0.22);
    ctx.setLineDash([6 * scale, 6 * scale]);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawDog(d) {
    const x = wx(d.x);
    const y = wy(d.y);
    const ang = Math.atan2(d.vx, d.vy);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.fillStyle = rgba(PUR, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7 * scale, 11 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -10 * scale, 5 * scale, 5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(-2 * scale, -11 * scale, 1.1 * scale, 0, TAU);
    ctx.arc(2 * scale, -11 * scale, 1.1 * scale, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(PNK, 0.8);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(-5 * scale, 6 * scale);
    ctx.lineTo(-8 * scale, 12 * scale);
    ctx.moveTo(5 * scale, 6 * scale);
    ctx.lineTo(8 * scale, 12 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function drawYeti() {
    const y = G.yeti;
    if (!y) return;
    const x = wx(y.x);
    const yy = wy(y.y);
    const pulse = 1 + 0.04 * Math.sin(G.t * 8);
    ctx.save();
    ctx.translate(x, yy);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 16 * scale, 20 * scale, 8 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d8e8f4';
    ctx.strokeStyle = rgba(ICE, 0.55);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 * scale, 26 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#eef6ff';
    ctx.beginPath();
    ctx.ellipse(0, -22 * scale, 13 * scale, 12 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(-5 * scale, -24 * scale, 2.2 * scale, 0, TAU);
    ctx.arc(5 * scale, -24 * scale, 2.2 * scale, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(MAG, 0.7);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.arc(0, -18 * scale, 5 * scale, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = '#c8d8e8';
    ctx.beginPath();
    ctx.ellipse(-22 * scale, 4 * scale, 8 * scale, 14 * scale, -0.5, 0, TAU);
    ctx.ellipse(22 * scale, 4 * scale, 8 * scale, 14 * scale, 0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSkier() {
    const s = G.skier;
    const x = wx(s.x);
    const y = wy(s.y);
    const dead = G.mode === 'dead';
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.h);
    ctx.scale(s.sqx, s.sqy);
    if (s.tuck > 0.55 && !dead && !REDUCE) {
      ctx.strokeStyle = rgba(ICE, 0.22);
      ctx.lineWidth = 1.2 * scale;
      for (let i = 0; i < 5; i++) {
        const ox2 = (i - 2) * 5 * scale;
        ctx.beginPath();
        ctx.moveTo(ox2, 10 * scale);
        ctx.lineTo(ox2 * 0.4, 28 * scale + s.tuck * 10 * scale);
        ctx.stroke();
      }
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 10 * scale, 11 * scale, 4 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(ICE, dead ? 0.4 : 1);
    ctx.lineWidth = 2.6 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-7 * scale, 4 * scale);
    ctx.lineTo(-8.5 * scale, 26 * scale);
    ctx.moveTo(7 * scale, 4 * scale);
    ctx.lineTo(8.5 * scale, 26 * scale);
    ctx.stroke();
    const bodyH = s.tuck > 0.5 ? 10 : 14;
    ctx.fillStyle = dead ? rgba(MAG, 0.88) : rgba(ICE, 0.96);
    ctx.beginPath();
    ctx.ellipse(0, -1 * scale, 7.2 * scale, bodyH * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.85);
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(-10 * scale, 5 * scale);
    ctx.lineTo(-12 * scale, -12 * scale);
    ctx.moveTo(10 * scale, 5 * scale);
    ctx.lineTo(12 * scale, -12 * scale);
    ctx.stroke();
    ctx.fillStyle = dead ? rgba(WHT, 0.75) : rgba(MAG, 0.96);
    ctx.beginPath();
    ctx.arc(0, -bodyH * scale - 4.5 * scale, 5 * scale, 0, TAU);
    ctx.fill();
    if (!dead) {
      ctx.fillStyle = '#05030c';
      ctx.beginPath();
      ctx.arc(-1.6 * scale, -bodyH * scale - 4.6 * scale, 1.05 * scale, 0, TAU);
      ctx.arc(1.6 * scale, -bodyH * scale - 4.6 * scale, 1.05 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.28;
      ctx.strokeStyle = rgba(s.rgb, 0.7 * (1 - k));
      ctx.lineWidth = (2.6 - k) * scale;
      ctx.beginPath();
      ctx.arc(wx(s.x), wy(s.y), (s.rad * 0.35 + k * s.rad) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const k = s.t / 0.34;
      ctx.strokeStyle = rgba(s.rgb, 0.45 * (1 - k));
      ctx.lineWidth = (2 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(wx(s.x), wy(s.y), (s.r + k * 24) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(1 - f.t / f.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, 1);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, wx(f.x), wy(f.y));
    }
    ctx.restore();
  }

  function drawFlakes() {
    ctx.save();
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      ctx.fillStyle = rgba(WHT, f.a);
      ctx.beginPath();
      ctx.arc(sx(f.x), sy(f.y), f.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    if (!G.yeti || G.mode === 'title') return;
    const s = G.skier;
    const d = hypot(s.x - G.yeti.x, s.y - G.yeti.y);
    const a = clamp(1 - d / 280, 0, 0.45);
    if (a <= 0) return;
    ctx.fillStyle = rgba(MAG, a * 0.22);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.2);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawSpeedHud() {
    if (G.mode !== 'play') return;
    const s = G.skier;
    const k = clamp((s.spd - 90) / (TUCK_SPD * 1.15 - 90), 0, 1);
    const x = sx(VW - 22);
    const y0 = sy(VH - 28);
    const h = 90 * scale;
    ctx.save();
    ctx.fillStyle = 'rgba(8,6,18,0.45)';
    ctx.strokeStyle = rgba(ICE, 0.28);
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x - 6 * scale, y0 - h, 8 * scale, h, 4 * scale) :
      ctx.rect(x - 6 * scale, y0 - h, 8 * scale, h);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(s.tuck > 0.5 ? GOLD : ICE, 0.85);
    ctx.fillRect(x - 5 * scale, y0 - k * h, 6 * scale, k * h);
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(SKIER_SY);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawTracks();
    drawFlakes();

    const drawList = [];
    for (let i = 0; i < G.obs.length; i++) {
      const o = G.obs[i];
      if (onScreen(o.x, o.y, 60)) drawList.push(o);
    }
    for (let i = 0; i < G.dogs.length; i++) drawList.push({ type: 'dog', ref: G.dogs[i], y: G.dogs[i].y });
    if (G.yeti) drawList.push({ type: 'yeti', y: G.yeti.y });
    drawList.push({ type: 'skier', y: G.skier.y });
    drawList.sort(function (a, b) { return a.y - b.y; });

    if (isGate()) {
      for (let i = 0; i < G.gates.length; i++) {
        if (onScreen(G.gates[i].x, G.gates[i].y, 40)) drawGateBanner(G.gates[i]);
      }
    }

    for (let i = 0; i < drawList.length; i++) {
      const o = drawList[i];
      if (o.type === 'bump') drawBump(o);
      else if (o.type === 'tree') drawTree(o);
      else if (o.type === 'rock') drawRock(o);
      else if (o.type === 'pole') drawPole(o);
      else if (o.type === 'dog') drawDog(o.ref);
      else if (o.type === 'yeti') drawYeti();
      else if (o.type === 'skier') drawSkier();
    }

    drawParticles();
    drawFloats();
    drawVignette();
    drawFlash();
    drawSpeedHud();
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

  function pointerToView(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function onOrient(e) {
    if (e.gamma == null) return;
    tilt.x = clamp(e.gamma / 28, -1, 1);
    tilt.live = true;
  }

  function tryTilt() {
    if (tiltOn) return;
    tiltOn = true;
    const DE = window.DeviceOrientationEvent;
    if (!DE) return;
    if (typeof DE.requestPermission === 'function') {
      DE.requestPermission().then(function (s) {
        if (s === 'granted') window.addEventListener('deviceorientation', onOrient);
      }).catch(function () { /* ignore */ });
    } else {
      window.addEventListener('deviceorientation', onOrient);
    }
  }

  function bind() {
    window.addEventListener('resize', resize);
    if (typeof ResizeObserver !== 'undefined' && stageEl) {
      new ResizeObserver(resize).observe(stageEl);
    }
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
    });
    window.addEventListener('keydown', function (e) {
      audio.ensure();
      if (e.code === 'KeyM') {
        audio.setMuted(!audio.muted);
        e.preventDefault();
        return;
      }
      if (e.code === 'KeyR') {
        restart();
        e.preventDefault();
        return;
      }
      if (e.code === 'KeyA') {
        if (!e.repeat) toggleAuto();
        e.preventDefault();
        return;
      }
      if (e.target === speedEl) return;
      if (autoOn) {
        if (
          e.code === 'ArrowLeft' || e.code === 'ArrowRight' ||
          e.code === 'ArrowDown' || e.code === 'ArrowUp' ||
          e.code === 'KeyD' || e.code === 'KeyS' || e.code === 'KeyW' ||
          e.code === 'Space'
        ) {
          e.preventDefault();
        }
        if (overlayOpen()) {
          if (e.code === 'Enter' || e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'Space') {
            if (G.mode === 'title') startGame('free');
            else if (G.mode === 'dead') startGame(G.kind);
            e.preventDefault();
          }
          if (e.code === 'Digit2' || e.code === 'Numpad2') {
            startGame('gate');
            e.preventDefault();
          }
        }
        return;
      }
      if (e.code === 'ArrowLeft') { keys.l = true; e.preventDefault(); }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') { keys.r = true; e.preventDefault(); }
      if (e.code === 'ArrowDown' || e.code === 'KeyS') { keys.tuck = true; e.preventDefault(); }
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { keys.brake = true; e.preventDefault(); }
      if (overlayOpen()) {
        if (e.code === 'Enter' || e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'Space') {
          if (G.mode === 'title') startGame('free');
          else if (G.mode === 'dead') startGame(G.kind);
          e.preventDefault();
        }
        if (e.code === 'Digit2' || e.code === 'Numpad2') {
          startGame('gate');
          e.preventDefault();
        }
      }
    });
    window.addEventListener('keyup', function (e) {
      if (e.code === 'ArrowLeft') keys.l = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.r = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.tuck = false;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') keys.brake = false;
    });
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      tryTilt();
      if (overlayOpen()) return;
      if (autoOn) {
        e.preventDefault();
        return;
      }
      const p = pointerToView(e);
      pointer.down = true;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.id = e.pointerId;
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down || (pointer.id != null && e.pointerId !== pointer.id)) {
        if (!pointer.down) {
          const p = pointerToView(e);
          pointer.x = p.x;
          pointer.y = p.y;
        }
        return;
      }
      const p = pointerToView(e);
      pointer.x = p.x;
      pointer.y = p.y;
      e.preventDefault();
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
    if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
    if (speedEl) {
      speedEl.addEventListener('input', function () {
        setAutoSpeed(parseInt(speedEl.value, 10));
      });
      speedEl.addEventListener('change', function () {
        setAutoSpeed(parseInt(speedEl.value, 10));
      });
    }
    btnRetry.addEventListener('click', function () {
      audio.ensure();
      restart();
    });
    btnFree.addEventListener('click', function () {
      audio.ensure();
      startGame('free');
    });
    btnGate.addEventListener('click', function () {
      audio.ensure();
      startGame('gate');
    });
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
    ovModes.addEventListener('click', function () {
      audio.ensure();
      showTitle();
    });
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (hidden) return;
    const turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (G.stop > 0 && !turbo) {
      G.stop -= dt;
      updateFx(dt);
      draw();
      return;
    }
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    let steps = 0;
    const maxSteps = turbo ? 12 : 5;
    while (acc >= STEP && steps < maxSteps) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 4) acc = 0;
    updateFx(dt);
    draw();
  }

  function boot() {
    G.best = loadBest();
    autoSpeed = loadAutoSpeed();
    try {
      if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
      else audio.setMuted(false);
    } catch (err) {
      audio.setMuted(false);
    }
    bind();
    syncAutoUi();
    syncSpeedUi();
    resize();
    showTitle();
    requestAnimationFrame(frame);
  }

  boot();
})();
