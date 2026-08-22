'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SHIP_R = 8;
  const ROT = 4.55;
  const THRUST = 268;
  const MAX_V = 308;
  const DRAG = 0.16;
  const SHOT_V = 448;
  const SHOT_LIFE = 0.94;
  const COMBO_WIN = 1.32;
  const EXTRA_LIFE = 10000;
  const HYPER_CD = 1.55;
  const BEST_KEY = 'playbox-rock-spin-best';
  const MUTE_KEY = 'playbox-rock-spin-mute';
  const AUTO_SPEED_KEY = 'playbox-rock-spin-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const OPS = 'A D / ← → 转向 · W / ↑ 推进 · 空格开火 · Shift 跃迁';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 31];
  const HOT2 = [255, 176, 74];
  const WHT = [246, 243, 255];
  const PNK = [255, 176, 210];

  const ROCK = [
    { r: 38, score: 20, next: 1, kids: 2, spd0: 26, spd1: 54, spin: 0.7, rgb: HOT },
    { r: 22, score: 50, next: 2, kids: 2, spd0: 44, spd1: 86, spin: 1.25, rgb: HOT2 },
    { r: 12, score: 100, next: -1, kids: 0, spd0: 70, spd1: 128, spin: 2.1, rgb: GOLD }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnClassic = document.getElementById('btn-classic');
  const btnStorm = document.getElementById('btn-storm');
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
  const padsEl = document.getElementById('pads');
  const padCcw = document.getElementById('pad-ccw');
  const padCw = document.getElementById('pad-cw');
  const padThrust = document.getElementById('pad-thrust');
  const padFire = document.getElementById('pad-fire');
  const padHyper = document.getElementById('pad-hyper');

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

  const keys = { l: false, r: false, u: false, fire: false };
  const autoSteer = { l: false, r: false, u: false, fire: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const pendingRocks = [];

  const G = {
    mode: 'title',
    kind: 'classic',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    nextLife: EXTRA_LIFE,
    ship: { x: VW * 0.5, y: VH * 0.5, vx: 0, vy: 0, ang: 0 },
    rocks: [],
    shots: [],
    ufo: null,
    ufoWait: 16,
    fireCd: 0,
    hyperCd: 0,
    hyperUses: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    waveWait: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    thrustT: 0,
    why: ''
  };

  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;

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
  function wrap(v, max) {
    return ((v % max) + max) % max;
  }
  function wrapDelta(a, b, size) {
    let d = a - b;
    const h = size * 0.5;
    if (d > h) d -= size;
    if (d < -h) d += size;
    return d;
  }
  function angNorm(a) {
    a = (a + Math.PI) % TAU;
    if (a < 0) a += TAU;
    return a - Math.PI;
  }
  function isHail() {
    return G.kind === 'hail';
  }
  function steer() {
    return autoOn && G.mode === 'play' ? autoSteer : keys;
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
      this.beep(880, 0.055, 'square', 0.03, 1680);
      this.beep(420, 0.04, 'triangle', 0.016, 180);
    },
    thrust() {
      this.ensure();
      this.noise(0.05, 0.018, 400);
      this.beep(90, 0.05, 'sawtooth', 0.016, 55);
    },
    bust(size) {
      this.ensure();
      const low = size === 0 ? 110 : size === 1 ? 180 : 280;
      const hi = size === 0 ? 320 : size === 1 ? 520 : 820;
      this.noise(size === 0 ? 0.14 : 0.08, size === 0 ? 0.07 : 0.045, 280);
      this.beep(hi, 0.09, 'square', 0.05, low);
      this.beep(low * 1.4, 0.12, 'triangle', 0.03, low * 0.45);
    },
    ufoTick(small) {
      this.ensure();
      if (small) this.beep(980, 0.06, 'sawtooth', 0.018, 620);
      else this.beep(420, 0.07, 'sawtooth', 0.02, 280);
    },
    ufoHit() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.055, 784);
      this.beep(784, 0.16, 'triangle', 0.05, 1240);
      this.noise(0.1, 0.045, 500);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    hyper() {
      this.ensure();
      this.beep(180, 0.12, 'sine', 0.04, 920);
      this.noise(0.08, 0.03, 900);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.04, 784);
      this.beep(784, 0.1, 'triangle', 0.04, 1046);
      this.beep(1046, 0.18, 'sine', 0.045, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.06, 320);
      this.beep(280, 0.2, 'sawtooth', 0.055, 70);
      this.beep(160, 0.32, 'sine', 0.045, 48);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.18, 'triangle', 0.04, 1046);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.035, 990);
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

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    while (G.score >= G.nextLife) {
      G.nextLife += EXTRA_LIFE;
      G.lives += 1;
      audio.extra();
      toast('额外生命', false, true);
      screenFlash(GOLD, 0.55);
      kick(3.2);
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

  function toast(msg, warn, gold) {
    G.toastT = 1.35;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    while (pips.length > n && pips.length > LIVES) {
      const d = pips.pop();
      if (d && d.parentNode) d.parentNode.removeChild(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      toast('连击 ×' + G.mult, false, true);
      if (comboEl) {
        comboTok += 1;
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '岩旋';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 4);
    }
    if (tagLabel) {
      tagLabel.textContent = isHail() ? '碎雨' : '经典';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 岩石撞船即扣命', 'warn');
    else if (G.lives === 1) setHint('最后一命 · Shift 跃迁有风险', 'warn');
    else setHint('A D 转向 · W 推进 · 空格开火 · Shift 跃迁', G.combo >= 6 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showStorm) {
    autoOvWait = 0;
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'ROCKS';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnClassic.textContent = primary;
    btnStorm.classList.toggle('hidden', !showStorm);
    if (kind === 'lose') btnStorm.textContent = '换模式';
    else btnStorm.textContent = '碎雨';
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
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
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
        g: spec.g == null ? 0 : spec.g
      });
    }
    capArr(particles, 340);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 48);
  }

  function popRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 10 });
    capArr(rings, 36);
  }

  function popFloat(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      vy: -46,
      t: 0,
      life: 0.72,
      text: text,
      rgb: rgb,
      gold: !!gold,
      size: gold ? 16 : 13
    });
    capArr(floats, 28);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 78; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.18 ? 1.4 : 0.7,
        a: rand(0.25, 0.9),
        p: Math.random() * TAU,
        rgb: Math.random() < 0.18 ? HOT2 : Math.random() < 0.12 ? CYN : WHT
      });
    }
  }

  function makeShape(r) {
    const n = 8 + ((Math.random() * 5) | 0);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.12, 0.12);
      const rr = r * rand(0.68, 1.14);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return pts;
  }

  function spawnRock(size, x, y, vx, vy) {
    const spec = ROCK[size];
    const ang = Math.random() * TAU;
    const spd = rand(spec.spd0, spec.spd1) * (isHail() ? 1.38 : 1) * (1 + (G.wave - 1) * 0.055);
    const dir = Math.random() * TAU;
    return {
      x: wrap(x, VW),
      y: wrap(y, VH),
      vx: vx == null ? Math.cos(dir) * spd : vx,
      vy: vy == null ? Math.sin(dir) * spd : vy,
      r: spec.r,
      size: size,
      ang: ang,
      spin: rand(-spec.spin, spec.spin) * (Math.random() < 0.5 ? -1 : 1),
      pts: makeShape(spec.r),
      rgb: spec.rgb,
      alive: true
    };
  }

  function rockCount() {
    let n = 0;
    for (let i = 0; i < G.rocks.length; i++) if (G.rocks[i].alive) n += 1;
    return n;
  }

  function wrapDist(ax, ay, bx, by) {
    const dx = wrapDelta(ax, bx, VW);
    const dy = wrapDelta(ay, by, VH);
    return { dx: dx, dy: dy, d: hypot(dx, dy) };
  }

  function spawnClear(x, y, rad) {
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      if (wrapDist(x, y, r.x, r.y).d < rad + r.r) return false;
    }
    if (G.ufo && wrapDist(x, y, G.ufo.x, G.ufo.y).d < rad + G.ufo.r + 10) return false;
    return true;
  }

  function placeEdgeRock(size) {
    const side = (Math.random() * 4) | 0;
    let x;
    let y;
    if (side === 0) {
      x = rand(20, VW - 20);
      y = rand(8, 50);
    } else if (side === 1) {
      x = rand(20, VW - 20);
      y = rand(VH - 50, VH - 8);
    } else if (side === 2) {
      x = rand(8, 50);
      y = rand(20, VH - 20);
    } else {
      x = rand(VW - 50, VW - 8);
      y = rand(20, VH - 20);
    }
    const cx = G.ship.x;
    const cy = G.ship.y;
    if (wrapDist(x, y, cx, cy).d < 130) {
      x = wrap(cx + (x < cx ? -180 : 180), VW);
      y = wrap(cy + rand(-80, 80), VH);
    }
    return spawnRock(size, x, y, null, null);
  }

  function spawnWave() {
    const n = isHail()
      ? Math.min(12, 6 + G.wave)
      : Math.min(8, 3 + G.wave);
    G.rocks = [];
    for (let i = 0; i < n; i++) G.rocks.push(placeEdgeRock(0));
    G.ready = 0.45;
    G.waveWait = 0;
    if (G.mode === 'play') {
      audio.wave();
      toast('第 ' + G.wave + ' 波' + (G.wave > 1 ? ' · 加速' : ''), false, G.wave > 1);
    }
  }

  function resetWorld(demo) {
    G.ship.x = VW * 0.5;
    G.ship.y = VH * 0.5;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.ship.ang = 0;
    G.shots = [];
    G.ufo = null;
    G.ufoWait = rand(12, 20);
    G.fireCd = 0;
    G.hyperCd = 0;
    G.hyperUses = 0;
    G.deadT = 0;
    G.invuln = demo ? 0 : 1.6;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.waveWait = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    if (demo) {
      G.wave = 1;
      G.rocks = [];
      for (let i = 0; i < 5; i++) G.rocks.push(placeEdgeRock(i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2));
    }
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'classic';
    G.score = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    resetWorld(true);
    showOverlay('title', '岩旋', '拧着打，碎成小块。', '经典', true);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'hail' ? 'hail' : 'classic';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    resetWorld(false);
    spawnWave();
    hideOverlay();
    audio.start();
    if (scoreEl) scoreEl.textContent = '0';
    syncHud();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.7);
    const rec = G.score >= G.best && G.score > 0;
    showOverlay(
      rec ? 'win' : 'lose',
      rec ? '新纪录' : why,
      '分数 ' + G.score + (rec ? ' · 写入最高' : ''),
      '再来',
      true
    );
    syncHud();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const max = isHail() ? 5 : 4;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].from === 'ship') n += 1;
    if (n >= max) return;
    G.fireCd = isHail() ? 0.11 : 0.15;
    const ang = G.ship.ang;
    const nose = 13;
    const x = G.ship.x + Math.sin(ang) * nose;
    const y = G.ship.y - Math.cos(ang) * nose;
    G.shots.push({
      x: x,
      y: y,
      vx: G.ship.vx + Math.sin(ang) * SHOT_V,
      vy: G.ship.vy - Math.cos(ang) * SHOT_V,
      life: SHOT_LIFE,
      from: 'ship',
      trail: []
    });
    audio.shoot();
    if (!REDUCE) G.punch = Math.max(G.punch, 1.012);
    popSpark(x, y, CYN, 10);
    emit(4, {
      x: x, y: y, j: 2,
      vx0: Math.sin(ang) * 40, vx1: Math.sin(ang) * 120,
      vy0: -Math.cos(ang) * 40, vy1: -Math.cos(ang) * 120,
      r0: 1, r1: 2.2, life: 0.18, rgb: WHT, g: 0
    });
  }

  function hyperspace() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.hyperCd > 0) return;
    G.hyperCd = HYPER_CD;
    G.hyperUses += 1;
    audio.hyper();
    popRing(G.ship.x, G.ship.y, CYN, 8);
    emit(22, {
      x: G.ship.x, y: G.ship.y, j: 8,
      vx0: -180, vx1: 180, vy0: -180, vy1: 180,
      r0: 1.2, r1: 3.2, life: 0.4, rgb: CYN, g: 0
    });
    const risk = clamp(0.12 + G.hyperUses * 0.045, 0.12, 0.34);
    const nx = rand(40, VW - 40);
    const ny = rand(40, VH - 40);
    G.ship.x = nx;
    G.ship.y = ny;
    G.ship.vx = 0;
    G.ship.vy = 0;
    popRing(nx, ny, MAG, 10);
    screenFlash(CYN, 0.35);
    if (Math.random() < risk || !spawnClear(nx, ny, 16)) {
      toast('跃迁翻车', true, false);
      killShip();
      return;
    }
    G.invuln = Math.max(G.invuln, 0.42);
    toast('跃迁', false, false);
  }

  function killShip() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play') return;
    G.deadT = 1.35;
    G.lives -= 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.hyperUses = 0;
    audio.death();
    hitStop(0.08);
    kick(6.5);
    screenFlash(MAG, 0.72);
    popRing(G.ship.x, G.ship.y, MAG, 12);
    popSpark(G.ship.x, G.ship.y, MAG, 28);
    emit(36, {
      x: G.ship.x, y: G.ship.y, j: 6,
      vx0: -260, vx1: 260, vy0: -260, vy1: 260,
      r0: 1.4, r1: 4.2, life: 0.7, rgb: CYN, g: 0
    });
    emit(18, {
      x: G.ship.x, y: G.ship.y, j: 4,
      vx0: -160, vx1: 160, vy0: -160, vy1: 160,
      r0: 1, r1: 2.6, life: 0.5, rgb: MAG, g: 0
    });
    syncPips();
  }

  function bustRock(rock, scored) {
    if (!rock.alive) return;
    rock.alive = false;
    const spec = ROCK[rock.size];
    const stop = rock.size === 0 ? 0.072 : rock.size === 1 ? 0.05 : 0.034;
    audio.bust(rock.size);
    hitStop(stop + (G.mult > 2 ? 0.012 : 0));
    kick(rock.size === 0 ? 4.2 : rock.size === 1 ? 2.6 : 1.6);
    screenFlash(spec.rgb, rock.size === 0 ? 0.5 : 0.32);
    popSpark(rock.x, rock.y, spec.rgb, rock.r * 0.9);
    popRing(rock.x, rock.y, spec.rgb, rock.r * 0.35);
    emit(10 + rock.size * -2 + 14, {
      x: rock.x, y: rock.y, j: rock.r * 0.45,
      vx0: -200, vx1: 200, vy0: -200, vy1: 200,
      r0: 1.2, r1: rock.size === 0 ? 4.4 : 2.8, life: 0.45 + (2 - rock.size) * 0.08,
      rgb: spec.rgb, g: 0
    });
    if (scored && G.mode === 'play') {
      bumpCombo();
      const pts = spec.score * G.mult;
      addScore(pts);
      popFloat(rock.x, rock.y - 8, '+' + pts, spec.rgb, G.mult > 1);
    }
    if (spec.next >= 0) {
      const base = Math.atan2(rock.vy, rock.vx);
      for (let k = 0; k < spec.kids; k++) {
        const kickA = base + (k === 0 ? 1 : -1) * rand(0.7, 1.35);
        const spd = rand(ROCK[spec.next].spd0, ROCK[spec.next].spd1) * (isHail() ? 1.32 : 1);
        const child = spawnRock(
          spec.next,
          rock.x + Math.cos(kickA) * 8,
          rock.y + Math.sin(kickA) * 8,
          Math.cos(kickA) * spd + rock.vx * 0.28,
          Math.sin(kickA) * spd + rock.vy * 0.28
        );
        pendingRocks.push(child);
      }
    }
  }

  function spawnUfo() {
    if (G.ufo || G.mode !== 'play' || G.deadT > 0) return;
    if (rockCount() < 1) return;
    const small = G.wave >= 3 || G.score >= 4000;
    const fromL = Math.random() < 0.5;
    const y = rand(70, VH - 90);
    const spd = (small ? 118 : 74) * (isHail() ? 1.2 : 1);
    G.ufo = {
      x: fromL ? -16 : VW + 16,
      y: y,
      vx: fromL ? spd : -spd,
      vy: rand(-18, 18),
      r: small ? 9 : 14,
      small: small,
      shootT: rand(0.4, 1.1),
      beepT: 0.18,
      wob: Math.random() * TAU
    };
  }

  function ufoFire() {
    const u = G.ufo;
    if (!u || G.deadT > 0) return;
    const w = wrapDist(G.ship.x, G.ship.y, u.x, u.y);
    let ang = Math.atan2(w.dx, -w.dy);
    const spread = u.small ? 0.2 : 0.85;
    ang += rand(-spread, spread);
    const sp = u.small ? 210 : 160;
    G.shots.push({
      x: u.x,
      y: u.y,
      vx: Math.sin(ang) * sp,
      vy: -Math.cos(ang) * sp,
      life: 1.35,
      from: 'ufo',
      trail: []
    });
    audio.beep(u.small ? 720 : 380, 0.06, 'square', 0.03, 140);
  }

  function killUfo(scored) {
    const u = G.ufo;
    if (!u) return;
    audio.ufoHit();
    hitStop(0.07);
    kick(4.8);
    screenFlash(GOLD, 0.55);
    popSpark(u.x, u.y, GOLD, 22);
    popRing(u.x, u.y, GOLD, 12);
    emit(28, {
      x: u.x, y: u.y, j: 6,
      vx0: -220, vx1: 220, vy0: -220, vy1: 220,
      r0: 1.2, r1: 3.6, life: 0.5, rgb: GOLD, g: 0
    });
    if (scored && G.mode === 'play') {
      bumpCombo();
      const pts = (u.small ? 1000 : 200) * G.mult;
      addScore(pts);
      popFloat(u.x, u.y - 10, '+' + pts, GOLD, true);
      toast(u.small ? '飞碟 ×' + G.mult : '靶机 ×' + G.mult, false, true);
    }
    G.ufo = null;
    G.ufoWait = rand(isHail() ? 9 : 14, isHail() ? 18 : 26);
  }

  function updatePlayer(dt) {
    const s = G.ship;
    const st = steer();
    if (G.deadT <= 0) {
      if (st.l) s.ang -= ROT * dt * (isHail() ? 1.08 : 1);
      if (st.r) s.ang += ROT * dt * (isHail() ? 1.08 : 1);
      if (st.u) {
        const acc = THRUST * (isHail() ? 1.12 : 1);
        s.vx += Math.sin(s.ang) * acc * dt;
        s.vy -= Math.cos(s.ang) * acc * dt;
        G.thrustT -= dt;
        if (G.thrustT <= 0) {
          G.thrustT = 0.07;
          audio.thrust();
        }
        const bx = s.x - Math.sin(s.ang) * 11;
        const by = s.y + Math.cos(s.ang) * 11;
        emit(2, {
          x: bx, y: by, j: 1.6,
          vx0: -Math.sin(s.ang) * 40 + s.vx * 0.2, vx1: -Math.sin(s.ang) * 140 + s.vx * 0.2,
          vy0: Math.cos(s.ang) * 40 + s.vy * 0.2, vy1: Math.cos(s.ang) * 140 + s.vy * 0.2,
          r0: 1.2, r1: 2.8, life: 0.22, rgb: Math.random() < 0.4 ? GOLD : HOT, g: 0
        });
      }
      if (st.fire) fire();
    }
    const spd = hypot(s.vx, s.vy);
    const cap = MAX_V * (isHail() ? 1.12 : 1);
    if (spd > cap) {
      s.vx *= cap / spd;
      s.vy *= cap / spd;
    }
    const drag = Math.exp(-DRAG * dt);
    s.vx *= drag;
    s.vy *= drag;
    s.x = wrap(s.x + s.vx * dt, VW);
    s.y = wrap(s.y + s.vy * dt, VH);
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.hyperCd = Math.max(0, G.hyperCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
  }

  function updateRocks(dt) {
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      r.x = wrap(r.x + r.vx * dt, VW);
      r.y = wrap(r.y + r.vy * dt, VH);
      r.ang += r.spin * dt;
    }
    if (pendingRocks.length) {
      for (let i = 0; i < pendingRocks.length; i++) G.rocks.push(pendingRocks[i]);
      pendingRocks.length = 0;
    }
    if (G.rocks.length > 80) {
      const keep = [];
      for (let i = 0; i < G.rocks.length; i++) if (G.rocks[i].alive) keep.push(G.rocks[i]);
      G.rocks = keep;
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      if (s.trail && !REDUCE) {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 7) s.trail.shift();
      }
      const nx = wrap(s.x + s.vx * dt, VW);
      const ny = wrap(s.y + s.vy * dt, VH);
      if (Math.abs(nx - s.x) > VW * 0.5 || Math.abs(ny - s.y) > VH * 0.5) s.trail = [];
      s.x = nx;
      s.y = ny;
      if (s.life <= 0) {
        if (s.from === 'ship' && G.mode === 'play') {
          G.comboT = Math.min(G.comboT, 0.18);
        }
        G.shots.splice(i, 1);
      }
    }
  }

  function updateUfo(dt) {
    if (!G.ufo) {
      if (G.mode === 'play' && G.deadT <= 0 && G.waveWait <= 0) {
        G.ufoWait -= dt;
        if (G.ufoWait <= 0) spawnUfo();
      }
      return;
    }
    const u = G.ufo;
    u.wob += dt * 2.4;
    u.x += u.vx * dt;
    u.y = wrap(u.y + Math.sin(u.wob) * 28 * dt, VH);
    u.beepT -= dt;
    if (u.beepT <= 0) {
      u.beepT = u.small ? 0.14 : 0.22;
      audio.ufoTick(u.small);
    }
    u.shootT -= dt;
    if (u.shootT <= 0 && G.deadT <= 0 && G.mode === 'play') {
      u.shootT = (u.small ? 0.78 : 1.35) * rand(0.75, 1.15);
      ufoFire();
    }
    if (u.x < -28 || u.x > VW + 28) {
      G.ufo = null;
      G.ufoWait = rand(10, 22);
    }
  }

  function collide() {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      let hit = false;
      if (s.from === 'ship' && G.ufo) {
        const w = wrapDist(s.x, s.y, G.ufo.x, G.ufo.y);
        if (w.d < G.ufo.r + 4) {
          G.shots.splice(i, 1);
          killUfo(true);
          continue;
        }
      }
      for (let k = 0; k < G.rocks.length; k++) {
        const r = G.rocks[k];
        if (!r.alive) continue;
        const w = wrapDist(s.x, s.y, r.x, r.y);
        if (w.d < r.r + 3.2) {
          bustRock(r, s.from === 'ship');
          G.shots.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      if (s.from === 'ufo' && G.deadT <= 0 && G.invuln <= 0 && G.mode === 'play') {
        const w = wrapDist(s.x, s.y, G.ship.x, G.ship.y);
        if (w.d < SHIP_R + 3) {
          G.shots.splice(i, 1);
          killShip();
        }
      }
    }
    if (G.ufo) {
      for (let k = 0; k < G.rocks.length; k++) {
        const r = G.rocks[k];
        if (!r.alive) continue;
        const w = wrapDist(G.ufo.x, G.ufo.y, r.x, r.y);
        if (w.d < r.r + G.ufo.r) {
          bustRock(r, false);
          killUfo(false);
          break;
        }
      }
    }
    if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
      for (let k = 0; k < G.rocks.length; k++) {
        const r = G.rocks[k];
        if (!r.alive) continue;
        const w = wrapDist(G.ship.x, G.ship.y, r.x, r.y);
        if (w.d < r.r + SHIP_R) {
          killShip();
          break;
        }
      }
      if (G.ufo && G.deadT <= 0 && G.invuln <= 0) {
        const w = wrapDist(G.ship.x, G.ship.y, G.ufo.x, G.ufo.y);
        if (w.d < G.ufo.r + SHIP_R) killShip();
      }
    }
  }

  function autoThink() {
    autoSteer.l = false;
    autoSteer.r = false;
    autoSteer.u = false;
    autoSteer.fire = false;
    if (G.deadT > 0 || G.mode !== 'play') return;
    const ship = G.ship;
    const look = [0.28, 0.4, 0.58, 0.82][autoSpeed];
    const align = [0.24, 0.16, 0.1, 0.07][autoSpeed];
    let threat = null;
    let threatT = 9;
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      const w = wrapDist(r.x, r.y, ship.x, ship.y);
      const rvx = r.vx - ship.vx;
      const rvy = r.vy - ship.vy;
      const v2 = rvx * rvx + rvy * rvy;
      if (v2 < 4) {
        if (w.d < r.r + SHIP_R + 28 && w.d < threatT) {
          threat = { dx: w.dx, dy: w.dy, t: 0.2, r: r };
          threatT = w.d;
        }
        continue;
      }
      const tca = -(w.dx * rvx + w.dy * rvy) / v2;
      if (tca > 0 && tca < look) {
        const cx = w.dx + rvx * tca;
        const cy = w.dy + rvy * tca;
        const cd = hypot(cx, cy);
        if (cd < r.r + SHIP_R + 18 && tca < threatT) {
          threat = { dx: w.dx, dy: w.dy, t: tca, r: r };
          threatT = tca;
        }
      }
    }
    if (G.ufo) {
      const w = wrapDist(G.ufo.x, G.ufo.y, ship.x, ship.y);
      if (w.d < G.ufo.r + 40 && w.d * 0.01 < threatT) {
        threat = { dx: w.dx, dy: w.dy, t: w.d / 140, r: G.ufo };
        threatT = threat.t;
      }
    }
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.from !== 'ufo') continue;
      const w = wrapDist(s.x, s.y, ship.x, ship.y);
      const rvx = s.vx - ship.vx;
      const rvy = s.vy - ship.vy;
      const v2 = rvx * rvx + rvy * rvy + 1;
      const tca = -(w.dx * rvx + w.dy * rvy) / v2;
      if (tca > 0 && tca < 0.55) {
        const cd = hypot(w.dx + rvx * tca, w.dy + rvy * tca);
        if (cd < 16 && tca < threatT) {
          threat = { dx: w.dx, dy: w.dy, t: tca, r: s };
          threatT = tca;
        }
      }
    }

    if (threat && threat.t < (autoSpeed >= 3 ? 0.2 : 0.12) && G.hyperCd <= 0 && autoSpeed >= 2) {
      hyperspace();
      return;
    }

    function aimAt(tx, ty, tvx, tvy) {
      let px = tx;
      let py = ty;
      for (let n = 0; n < 3; n++) {
        const w = wrapDist(px, py, ship.x, ship.y);
        const t = hypot(w.dx, w.dy) / SHOT_V;
        px = wrap(tx + tvx * t, VW);
        py = wrap(ty + tvy * t, VH);
      }
      const w = wrapDist(px, py, ship.x, ship.y);
      return Math.atan2(w.dx, -w.dy);
    }

    let desired = ship.ang;
    let wantThrust = false;
    let wantFire = false;
    if (threat && threat.t < look * 0.7) {
      desired = Math.atan2(-threat.dx, threat.dy);
      const err = angNorm(desired - ship.ang);
      wantThrust = Math.abs(err) < 0.55;
    } else {
      let best = null;
      let bestScore = 1e9;
      if (G.ufo) {
        const w = wrapDist(G.ufo.x, G.ufo.y, ship.x, ship.y);
        best = G.ufo;
        bestScore = w.d * 0.35;
      }
      for (let i = 0; i < G.rocks.length; i++) {
        const r = G.rocks[i];
        if (!r.alive) continue;
        const w = wrapDist(r.x, r.y, ship.x, ship.y);
        const ang = Math.atan2(w.dx, -w.dy);
        const err = Math.abs(angNorm(ang - ship.ang));
        const sc = w.d + err * 80 - r.size * 12;
        if (sc < bestScore) {
          bestScore = sc;
          best = r;
        }
      }
      if (best) {
        desired = aimAt(best.x, best.y, best.vx || 0, best.vy || 0);
        const err = angNorm(desired - ship.ang);
        if (Math.abs(err) < align) wantFire = true;
        const spd = hypot(ship.vx, ship.vy);
        if (spd < 46 && Math.abs(err) < 0.5) wantThrust = true;
        if (spd > 160) wantThrust = false;
      }
    }
    const err = angNorm(desired - ship.ang);
    autoSteer.l = err < -0.035;
    autoSteer.r = err > 0.035;
    autoSteer.u = wantThrust;
    autoSteer.fire = wantFire;
    if (wantFire) fire();
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait > 0.7) startGame('classic');
    } else if (G.mode === 'lose') {
      autoOvWait += dt;
      if (autoOvWait > 1.15) startGame(G.kind);
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.15);
      q.vy *= Math.exp(-dt * 1.15);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.38) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
  }

  function playSim(dt) {
    if (G.ready > 0) G.ready -= dt;
    updatePlayer(dt);
    updateRocks(dt);
    updateShots(dt);
    updateUfo(dt);
    if (G.mode === 'play') collide();

    if (G.mode === 'play' && G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('船碎了');
          return;
        }
        G.ship.x = VW * 0.5;
        G.ship.y = VH * 0.5;
        G.ship.vx = 0;
        G.ship.vy = 0;
        G.ship.ang = 0;
        if (!spawnClear(G.ship.x, G.ship.y, 70)) {
          G.deadT = 0.35;
          return;
        }
        G.invuln = 1.8;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
    }

    if (G.mode === 'play' && G.deadT <= 0 && rockCount() === 0 && pendingRocks.length === 0) {
      if (G.waveWait <= 0) G.waveWait = 0.85;
      else {
        G.waveWait -= dt;
        if (G.waveWait <= 0) {
          G.wave += 1;
          addScore(150 * (G.wave - 1));
          spawnWave();
        }
      }
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    tickAutoFlow(dt);

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (autoOn && G.mode === 'play') autoThink();

    if (G.mode === 'title') {
      G.ship.ang += 0.35 * dt;
      updateRocks(dt);
      if (rockCount() < 4) G.rocks.push(placeEdgeRock((Math.random() * 3) | 0));
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose') {
      updateRocks(dt);
      updateShots(dt);
      updateFx(dt);
      return;
    }

    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function forWrap(x, y, r, fn) {
    fn(x, y);
    const nx = x < r + 10;
    const px = x > VW - r - 10;
    const ny = y < r + 10;
    const py = y > VH - r - 10;
    if (nx) fn(x + VW, y);
    if (px) fn(x - VW, y);
    if (ny) fn(x, y + VH);
    if (py) fn(x, y - VH);
    if (nx && ny) fn(x + VW, y + VH);
    if (nx && py) fn(x + VW, y - VH);
    if (px && ny) fn(x - VW, y + VH);
    if (px && py) fn(x - VW, y - VH);
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#14080a');
    g.addColorStop(0.45, '#09040c');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(280), 20 * scale, sx(240), sy(360), 380 * scale);
    vg.addColorStop(0, 'rgba(255, 122, 31, 0.09)');
    vg.addColorStop(0.55, 'rgba(255, 61, 184, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.5 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPoly(x, y, ang, pts, rgb, glow) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0] * scale;
      const py = pts[i][1] * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(rgb, glow ? 0.22 : 1);
    ctx.lineWidth = (glow ? 4.2 : 1.5) * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    if (!glow) {
      ctx.fillStyle = rgba(rgb, 0.07);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRocks() {
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      forWrap(r.x, r.y, r.r, function (x, y) {
        drawPoly(x, y, r.ang, r.pts, r.rgb, true);
        drawPoly(x, y, r.ang, r.pts, r.rgb, false);
      });
    }
  }

  function drawShipShape(x, y, ang, thrusting, ghost) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, -13 * scale);
    ctx.lineTo(9 * scale, 11 * scale);
    ctx.lineTo(0, 6.5 * scale);
    ctx.lineTo(-9 * scale, 11 * scale);
    ctx.closePath();
    ctx.strokeStyle = rgba(CYN, ghost ? 0.35 : 1);
    ctx.lineWidth = 1.7 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = rgba(CYN, ghost ? 0.05 : 0.1);
    ctx.fill();
    if (thrusting && !ghost) {
      const flick = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(G.t * 38));
      ctx.beginPath();
      ctx.moveTo(-4.2 * scale, 7.5 * scale);
      ctx.lineTo(0, (15 + 6 * flick) * scale);
      ctx.lineTo(4.2 * scale, 7.5 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.85 * flick);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    const s = G.ship;
    const thrusting = G.mode === 'play' && steer().u;
    const ghost = G.mode === 'title';
    forWrap(s.x, s.y, 16, function (x, y) {
      drawShipShape(x, y, s.ang, thrusting, ghost);
    });
  }

  function drawUfo() {
    if (!G.ufo) return;
    const u = G.ufo;
    forWrap(u.x, u.y, u.r + 8, function (x, y) {
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.strokeStyle = rgba(GOLD, 1);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.ellipse(0, 0, u.r * scale, u.r * 0.42 * scale, 0, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, -u.r * 0.28 * scale, u.r * 0.55 * scale, u.r * 0.38 * scale, 0, Math.PI, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-u.r * 0.85 * scale, 0);
      ctx.lineTo(u.r * 0.85 * scale, 0);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const rgb = s.from === 'ufo' ? MAG : WHT;
      if (s.trail && !REDUCE) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          ctx.fillStyle = rgba(s.from === 'ufo' ? MAG : CYN, 0.08 + t * 0.06);
          ctx.beginPath();
          ctx.arc(sx(p.x), sy(p.y), (1.2 + t * 0.15) * scale, 0, TAU);
          ctx.fill();
        }
      }
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.from === 'ufo' ? 2.4 : 2.1) * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, 0.65 * (1 - k));
      ctx.lineWidth = (2.6 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * 0.35 + k * s.rad) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const k = s.t / 0.38;
      ctx.strokeStyle = rgba(s.rgb, 0.5 * (1 - k));
      ctx.lineWidth = (2.1 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + k * 26) * scale, 0, TAU);
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
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
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
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawRocks();
    drawUfo();
    drawShots();
    drawShip();
    drawParticles();
    drawFloats();
    drawFlash();
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

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.textContent = autoOn ? '停' : '自动';
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoSteer.l = false;
    autoSteer.r = false;
    autoSteer.u = false;
    autoSteer.fire = false;
    syncAutoUi();
    audio.ensure();
    if (autoOn) toast('托管', false, true);
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('classic');
    else startGame(G.kind || 'classic');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('classic');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const code = e.code || '';
    const k = e.key;
    if (code === 'KeyP') {
      if (down && !e.repeat) {
        e.preventDefault();
        toggleAuto();
      }
      return;
    }
    const left = code === 'KeyA' || code === 'ArrowLeft';
    const right = code === 'KeyD' || code === 'ArrowRight';
    const up = code === 'KeyW' || code === 'ArrowUp';
    const hyper = code === 'KeyS' || code === 'ArrowDown' || code === 'ShiftLeft' || code === 'ShiftRight';
    const space = code === 'Space' || k === ' ';
    if (down && (left || right || up || hyper || space || k === 'Enter')) e.preventDefault();

    if (!autoOn || G.mode !== 'play') {
      if (left) keys.l = down;
      if (right) keys.r = down;
      if (up) keys.u = down;
      if (space) keys.fire = down;
    }

    if (!down) return;

    if (code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (code === 'KeyR') {
      restart();
      return;
    }
    if (autoOn && G.mode === 'play' && (left || right || up || hyper || space)) return;

    if (hyper) {
      if (G.mode === 'play') hyperspace();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') fire();
    }
    if (down && (k === '1' || code === 'Digit1') && overlayOpen() && G.mode === 'title') {
      startGame('classic');
    }
    if (down && (k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') {
      startGame('hail');
    }
  }

  function holdPad(el, press, release) {
    if (!el) return;
    let held = false;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      held = true;
      el.classList.add('on');
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      if (!(autoOn && G.mode === 'play')) press();
    });
    function up() {
      if (!held) return;
      held = false;
      el.classList.remove('on');
      if (release) release();
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  function bindPads() {
    holdPad(padCcw, function () { keys.l = true; }, function () { keys.l = false; });
    holdPad(padCw, function () { keys.r = true; }, function () { keys.r = false; });
    holdPad(padThrust, function () { keys.u = true; }, function () { keys.u = false; });
    holdPad(padFire, function () { keys.fire = true; fire(); }, function () { keys.fire = false; });
    holdPad(padHyper, function () { hyperspace(); }, null);
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

  function initSpeed() {
    autoSpeed = loadAutoSpeed();
    if (speedEl) speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
  }

  seedStars();
  loadBest();
  initMute();
  initSpeed();
  goTitle();
  resize();
  bindPads();
  syncAutoUi();

  if (btnClassic) {
    btnClassic.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('classic');
    });
  }
  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('hail');
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
    speedEl.addEventListener('input', function () {
      autoSpeed = clamp(parseInt(speedEl.value, 10) || 3, 1, 4);
      saveAutoSpeed(autoSpeed);
      if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    });
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (e.pointerType === 'touch' && padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
      keys.fire = false;
    }
  });

  requestAnimationFrame(frame);
})();
