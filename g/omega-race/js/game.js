'use strict';

(function () {
  const VW = 840;
  const VH = 520;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SHIP_R = 9;
  const ROT = 4.15;
  const THRUST = 268;
  const MAX_V = 318;
  const DRAG = 0.14;
  const SHOT_V = 430;
  const SHOT_R = 3.1;
  const COMBO_WIN = 1.32;
  const EXTRA_LIFE = 15000;
  const WALL_KILL = 248;
  const SHIP_REST = 0.68;
  const SHOT_REST = 0.94;
  const BEST_KEY = 'playbox-omega-race-best';
  const MUTE_KEY = 'playbox-omega-race-mute';
  const OPS = 'A D / ← → 转向 · W / ↑ 推进 · 空格开火';
  const LEAD = '封闭环道，船和弹都会撞墙弹回。打掉机兵。别撞太狠，也别吃弹。下一波更快。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 245, 212];
  const ICE = [92, 255, 216];
  const GOLD = [255, 227, 107];
  const WHT = [232, 255, 248];
  const PNK = [255, 176, 210];

  const OUTER = { l: 22, t: 20, r: 818, b: 500 };
  const INNER = { l: 292, t: 168, r: 548, b: 352 };

  const TYPES = {
    droid: { r: 11, score: 200, hp: 1, max: 96, thrust: 78, fire: 2.15, aim: 0.58, rest: 0.78, rgb: ICE },
    hunter: { r: 12, score: 350, hp: 1, max: 138, thrust: 118, fire: 1.12, aim: 0.22, rest: 0.74, rgb: MAG },
    mine: { r: 8, score: 500, hp: 1, max: 78, thrust: 18, fire: 0, aim: 1, rest: 0.9, rgb: GOLD },
    super: { r: 10, score: 800, hp: 1, max: 108, thrust: 62, fire: 0, aim: 1, rest: 0.86, rgb: GOLD, home: true },
    cmd: { r: 16, score: 1000, hp: 2, max: 72, thrust: 54, fire: 0.88, aim: 0.18, rest: 0.7, rgb: GOLD, spread: true }
  };

  const SPAWNS = [
    [155, 94], [420, 94], [685, 94],
    [155, 260], [685, 260],
    [155, 426], [420, 426], [685, 426]
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnTrack = document.getElementById('btn-track');
  const btnRain = document.getElementById('btn-rain');
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
  const padsEl = document.getElementById('pads');
  const padCcw = document.getElementById('pad-ccw');
  const padCw = document.getElementById('pad-cw');
  const padThrust = document.getElementById('pad-thrust');
  const padFire = document.getElementById('pad-fire');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let kickTok = 0;

  const keys = { l: false, r: false, u: false, fire: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const shards = [];
  const stars = [];
  const wallHits = [];

  const G = {
    mode: 'title',
    kind: 'track',
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
    ship: { x: 420, y: 426, vx: 0, vy: 0, ang: Math.PI * 0.5 },
    foes: [],
    shots: [],
    fireCd: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    waveWait: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: ICE,
    punch: 1,
    toastT: 0,
    thrustT: 0,
    clangT: 0,
    bounceStopCd: 0,
    why: '',
    danger: 0
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
  function wrapAng(a) {
    a = a % TAU;
    if (a < -Math.PI) a += TAU;
    if (a > Math.PI) a -= TAU;
    return a;
  }
  function angTo(from, to) {
    return wrapAng(to - from);
  }
  function isRain() {
    return G.kind === 'rain';
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
      this.beep(1240, 0.048, 'square', 0.026, 240);
      this.beep(680, 0.032, 'triangle', 0.014, 150);
    },
    enemyShot() {
      this.ensure();
      this.beep(420, 0.055, 'square', 0.022, 160);
    },
    thrust() {
      this.ensure();
      this.noise(0.05, 0.014, 260);
      this.beep(68, 0.05, 'sawtooth', 0.012, 40);
    },
    clang(hard) {
      this.ensure();
      if (hard) {
        this.beep(880, 0.05, 'square', 0.04, 220);
        this.beep(240, 0.1, 'triangle', 0.028, 90);
        this.noise(0.06, 0.03, 500);
      } else {
        this.beep(980, 0.035, 'triangle', 0.028, 280);
        this.beep(1460, 0.022, 'square', 0.012, 420);
      }
    },
    kill(kind) {
      this.ensure();
      const lo = kind === 'cmd' ? 90 : kind === 'mine' || kind === 'super' ? 140 : 180;
      this.noise(kind === 'cmd' ? 0.16 : 0.1, 0.055, 240);
      this.beep(620, 0.1, 'square', 0.042, lo);
      this.beep(lo * 1.4, 0.14, 'triangle', 0.026, lo * 0.4);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.038, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.028, 1176);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.1, 'triangle', 0.038, 1046);
      this.beep(1046, 0.18, 'sine', 0.042, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.07, 220);
      this.beep(220, 0.24, 'sawtooth', 0.05, 52);
      this.beep(130, 0.36, 'sine', 0.042, 38);
    },
    wave() {
      this.ensure();
      this.beep(330, 0.08, 'sine', 0.038, 494);
      this.beep(494, 0.1, 'sine', 0.038, 659);
      this.beep(784, 0.18, 'triangle', 0.038, 988);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.038, 80);
      this.beep(110, 0.32, 'sine', 0.046, 42);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.14, 'triangle', 0.032, 1176);
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
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
  }

  function kindName() {
    return isRain() ? '弹雨' : '环道';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '环赛';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 4);
    }
    if (tagLabel) {
      tagLabel.textContent = G.mode === 'title' ? 'OMEGA' : kindName();
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || G.danger > 0.55);
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
    if (G.mode === 'title') setHint(OPS + ' · 撞墙会弹', '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞太狠或吃弹都会炸', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 别撞墙太狠', 'warn');
    else if (G.danger > 0.6) setHint('减速 · 墙太近', 'warn');
    else setHint('转向推进开火 · 弹会反弹', G.combo >= 6 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showRain) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'OMEGA';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnTrack.textContent = primary;
    btnRain.classList.toggle('hidden', !showRain);
    if (kind === 'lose') btnRain.textContent = '换模式';
    else btnRain.textContent = '弹雨';
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
    capArr(particles, 380);
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
      vy: -52,
      t: 0,
      life: 0.72,
      text: text,
      rgb: rgb,
      gold: !!gold,
      size: gold ? 16 : 13
    });
    capArr(floats, 28);
  }

  function popShard(x, y, rgb) {
    shards.push({
      x: x,
      y: y,
      vx: rand(-180, 180),
      vy: rand(-180, 180),
      ang: Math.random() * TAU,
      spin: rand(-8, 8),
      len: rand(5, 12),
      life: rand(0.28, 0.55),
      max: 0.55,
      rgb: rgb
    });
    capArr(shards, 64);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.16 ? 1.3 : 0.6,
        a: rand(0.18, 0.78),
        p: Math.random() * TAU,
        rgb: Math.random() < 0.28 ? ICE : Math.random() < 0.12 ? CYN : Math.random() < 0.08 ? GOLD : WHT
      });
    }
  }

  function inLane(x, y, r) {
    if (x - r < OUTER.l || x + r > OUTER.r || y - r < OUTER.t || y + r > OUTER.b) return false;
    if (x + r > INNER.l && x - r < INNER.r && y + r > INNER.t && y - r < INNER.b) return false;
    return true;
  }

  function reflect(ent, nx, ny, rest) {
    const vn = ent.vx * nx + ent.vy * ny;
    if (vn >= 0) return 0;
    ent.vx -= (1 + rest) * vn * nx;
    ent.vy -= (1 + rest) * vn * ny;
    return -vn;
  }

  function bounceHit(x, y, nx, ny, rgb, hard) {
    wallHits.push({ x: x, y: y, nx: nx, ny: ny, t: 0, rgb: rgb || ICE, hard: !!hard });
    capArr(wallHits, 24);
    popSpark(x, y, rgb || ICE, hard ? 14 : 9);
    emit(hard ? 10 : 5, {
      x: x, y: y, j: 2,
      vx0: nx * 40 - 70, vx1: nx * 160 + 70,
      vy0: ny * 40 - 70, vy1: ny * 160 + 70,
      r0: 0.8, r1: 2.2, life: hard ? 0.32 : 0.18, rgb: rgb || ICE, g: 0
    });
  }

  function clang(hard) {
    if (G.clangT > 0 && !hard) return;
    G.clangT = hard ? 0.08 : 0.045;
    audio.clang(hard);
  }

  function resolveWorld(ent, r, rest) {
    let hit = null;
    let imp = 0;
    let nx = 0;
    let ny = 0;
    let hx = ent.x;
    let hy = ent.y;

    if (ent.x - r < OUTER.l) {
      ent.x = OUTER.l + r;
      const i = reflect(ent, 1, 0, rest);
      if (i > imp) { imp = i; nx = 1; ny = 0; hx = OUTER.l; hy = ent.y; hit = true; }
    } else if (ent.x + r > OUTER.r) {
      ent.x = OUTER.r - r;
      const i = reflect(ent, -1, 0, rest);
      if (i > imp) { imp = i; nx = -1; ny = 0; hx = OUTER.r; hy = ent.y; hit = true; }
    }
    if (ent.y - r < OUTER.t) {
      ent.y = OUTER.t + r;
      const i = reflect(ent, 0, 1, rest);
      if (i > imp) { imp = i; nx = 0; ny = 1; hx = ent.x; hy = OUTER.t; hit = true; }
    } else if (ent.y + r > OUTER.b) {
      ent.y = OUTER.b - r;
      const i = reflect(ent, 0, -1, rest);
      if (i > imp) { imp = i; nx = 0; ny = -1; hx = ent.x; hy = OUTER.b; hit = true; }
    }

    const inside = ent.x >= INNER.l && ent.x <= INNER.r && ent.y >= INNER.t && ent.y <= INNER.b;
    if (inside) {
      const dl = ent.x - INNER.l;
      const dr = INNER.r - ent.x;
      const dt = ent.y - INNER.t;
      const db = INNER.b - ent.y;
      const m = Math.min(dl, dr, dt, db);
      if (m === dl) {
        ent.x = INNER.l - r;
        const i = reflect(ent, -1, 0, rest);
        if (i > imp) { imp = i; nx = -1; ny = 0; hx = INNER.l; hy = ent.y; hit = true; }
      } else if (m === dr) {
        ent.x = INNER.r + r;
        const i = reflect(ent, 1, 0, rest);
        if (i > imp) { imp = i; nx = 1; ny = 0; hx = INNER.r; hy = ent.y; hit = true; }
      } else if (m === dt) {
        ent.y = INNER.t - r;
        const i = reflect(ent, 0, -1, rest);
        if (i > imp) { imp = i; nx = 0; ny = -1; hx = ent.x; hy = INNER.t; hit = true; }
      } else {
        ent.y = INNER.b + r;
        const i = reflect(ent, 0, 1, rest);
        if (i > imp) { imp = i; nx = 0; ny = 1; hx = ent.x; hy = INNER.b; hit = true; }
      }
    } else {
      const cx = clamp(ent.x, INNER.l, INNER.r);
      const cy = clamp(ent.y, INNER.t, INNER.b);
      const dx = ent.x - cx;
      const dy = ent.y - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 < r * r && d2 > 0.00001) {
        const d = Math.sqrt(d2);
        const inx = dx / d;
        const iny = dy / d;
        ent.x += inx * (r - d);
        ent.y += iny * (r - d);
        const i = reflect(ent, inx, iny, rest);
        if (i > imp) { imp = i; nx = inx; ny = iny; hx = cx; hy = cy; hit = true; }
      }
    }

    if (!hit) return null;
    return { imp: imp, nx: nx, ny: ny, x: hx, y: hy };
  }

  function moveBounce(ent, r, rest, dt) {
    const spd = hypot(ent.vx, ent.vy);
    const steps = Math.max(1, Math.min(8, Math.ceil(spd * dt / 7)));
    const sdt = dt / steps;
    let best = null;
    for (let i = 0; i < steps; i++) {
      ent.x += ent.vx * sdt;
      ent.y += ent.vy * sdt;
      const b = resolveWorld(ent, r, rest);
      if (b && (!best || b.imp > best.imp)) best = b;
    }
    return best;
  }

  function closingDanger(ent, r) {
    const m = 42;
    let c = 0;
    if (ent.x - r < OUTER.l + m && ent.vx < 0) c = Math.max(c, -ent.vx);
    if (ent.x + r > OUTER.r - m && ent.vx > 0) c = Math.max(c, ent.vx);
    if (ent.y - r < OUTER.t + m && ent.vy < 0) c = Math.max(c, -ent.vy);
    if (ent.y + r > OUTER.b - m && ent.vy > 0) c = Math.max(c, ent.vy);
    if (ent.x + r > INNER.l - m && ent.x < INNER.l && ent.vx > 0 && ent.y > INNER.t - r && ent.y < INNER.b + r) c = Math.max(c, ent.vx);
    if (ent.x - r < INNER.r + m && ent.x > INNER.r && ent.vx < 0 && ent.y > INNER.t - r && ent.y < INNER.b + r) c = Math.max(c, -ent.vx);
    if (ent.y + r > INNER.t - m && ent.y < INNER.t && ent.vy > 0 && ent.x > INNER.l - r && ent.x < INNER.r + r) c = Math.max(c, ent.vy);
    if (ent.y - r < INNER.b + m && ent.y > INNER.b && ent.vy < 0 && ent.x > INNER.l - r && ent.x < INNER.r + r) c = Math.max(c, -ent.vy);
    return c;
  }

  function maxShots() {
    return isRain() ? 6 : 4;
  }
  function shotBounces(from) {
    if (from === 'ship') return isRain() ? 5 : 3;
    return isRain() ? 4 : 2;
  }
  function shotLife() {
    return isRain() ? 2.15 : 1.55;
  }

  function countShots(from) {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].from === from) n += 1;
    return n;
  }

  function fireFrom(x, y, ang, from, extra) {
    const v = SHOT_V * (from === 'ship' ? 1 : 0.82);
    const shot = {
      x: x,
      y: y,
      vx: Math.sin(ang) * v + (extra && extra.vx ? extra.vx : 0),
      vy: -Math.cos(ang) * v + (extra && extra.vy ? extra.vy : 0),
      life: shotLife() * (from === 'ship' ? 1 : 0.92),
      from: from,
      bounces: shotBounces(from),
      trail: [],
      rgb: from === 'ship' ? WHT : MAG
    };
    G.shots.push(shot);
    return shot;
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    if (countShots('ship') >= maxShots()) return;
    const s = G.ship;
    const nx = s.x + Math.sin(s.ang) * 13;
    const ny = s.y - Math.cos(s.ang) * 13;
    fireFrom(nx, ny, s.ang, 'ship', { vx: s.vx * 0.22, vy: s.vy * 0.22 });
    G.fireCd = isRain() ? 0.12 : 0.16;
    audio.shoot();
    emit(3, {
      x: nx, y: ny, j: 1.2,
      vx0: Math.sin(s.ang) * 40, vx1: Math.sin(s.ang) * 120,
      vy0: -Math.cos(s.ang) * 40, vy1: -Math.cos(s.ang) * 120,
      r0: 0.8, r1: 1.8, life: 0.12, rgb: ICE, g: 0
    });
  }

  function enemyFire(e) {
    const spec = TYPES[e.kind];
    if (!spec.fire) return;
    const dx = G.ship.x - e.x;
    const dy = G.ship.y - e.y;
    let ang = Math.atan2(dx, -dy);
    ang += rand(-spec.aim, spec.aim);
    if (spec.spread) {
      fireFrom(e.x, e.y, ang, 'foe');
      fireFrom(e.x, e.y, ang - 0.28, 'foe');
      fireFrom(e.x, e.y, ang + 0.28, 'foe');
    } else {
      fireFrom(e.x, e.y, ang, 'foe');
    }
    audio.enemyShot();
  }

  function waveSpec(w) {
    const rain = isRain();
    let droids = w === 1 ? 3 : Math.max(1, 4 - Math.floor((w - 1) / 2));
    let hunters = w < 3 ? 0 : Math.min(4, w - 2);
    let mines = w < 2 ? 0 : Math.min(3, Math.ceil(w / 2) - (w >= 6 ? 1 : 0));
    let supers = w < 5 ? 0 : Math.min(2, w - 4);
    let cmds = w < 6 ? 0 : 1;
    if (rain) {
      if (w === 1) droids = 4;
      mines += w >= 1 ? 1 : 0;
      if (w >= 3) hunters += 1;
    }
    if (w >= 8) droids = Math.min(5, droids + 1);
    const spd = 1 + (w - 1) * (rain ? 0.11 : 0.085);
    return { droids: droids, hunters: hunters, mines: mines, supers: supers, cmds: cmds, spd: spd };
  }

  function spawnFoe(kind, x, y) {
    const spec = TYPES[kind];
    const dir = Math.random() * TAU;
    const spd = spec.max * 0.45 * (0.7 + Math.random() * 0.5);
    return {
      kind: kind,
      x: x,
      y: y,
      vx: Math.cos(dir) * spd,
      vy: Math.sin(dir) * spd,
      ang: dir,
      want: dir,
      r: spec.r,
      hp: spec.hp,
      flash: 0,
      think: rand(0.15, 0.7),
      fireT: rand(0.4, spec.fire || 1),
      spin: rand(-1.4, 1.4),
      pulse: Math.random() * TAU,
      alive: true
    };
  }

  function pickSpawn(avoidX, avoidY, minD) {
    let best = SPAWNS[0];
    let bestD = -1;
    const order = SPAWNS.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = order[i];
      order[i] = order[j];
      order[j] = t;
    }
    for (let i = 0; i < order.length; i++) {
      const p = order[i];
      const d = hypot(p[0] - avoidX, p[1] - avoidY);
      if (d < minD) continue;
      let busy = false;
      for (let k = 0; k < G.foes.length; k++) {
        if (hypot(G.foes[k].x - p[0], G.foes[k].y - p[1]) < 36) { busy = true; break; }
      }
      if (busy) continue;
      if (d > bestD) { bestD = d; best = p; }
    }
    return { x: best[0] + rand(-10, 10), y: best[1] + rand(-8, 8) };
  }

  function spawnWave() {
    const spec = waveSpec(G.wave);
    const kinds = [];
    for (let i = 0; i < spec.droids; i++) kinds.push('droid');
    for (let i = 0; i < spec.hunters; i++) kinds.push('hunter');
    for (let i = 0; i < spec.mines; i++) kinds.push('mine');
    for (let i = 0; i < spec.supers; i++) kinds.push('super');
    for (let i = 0; i < spec.cmds; i++) kinds.push('cmd');
    G.foes.length = 0;
    const px = G.ship.x;
    const py = G.ship.y;
    for (let i = 0; i < kinds.length; i++) {
      const p = pickSpawn(px, py, 110);
      const e = spawnFoe(kinds[i], p.x, p.y);
      const mul = spec.spd;
      e.vx *= mul;
      e.vy *= mul;
      G.foes.push(e);
    }
    audio.wave();
    toast(G.wave === 1 ? '第 1 波' : '第 ' + G.wave + ' 波 · 加速', false, true);
    screenFlash(CYN, 0.28);
  }

  function foeCount() {
    let n = 0;
    for (let i = 0; i < G.foes.length; i++) if (G.foes[i].alive) n += 1;
    return n;
  }

  function explode(x, y, rgb, n) {
    popSpark(x, y, rgb, 20);
    popRing(x, y, rgb, 12);
    emit(n || 22, {
      x: x, y: y, j: 5,
      vx0: -240, vx1: 240, vy0: -240, vy1: 240,
      r0: 1.1, r1: 3.4, life: 0.48, rgb: rgb, g: 0
    });
    for (let i = 0; i < 6; i++) popShard(x, y, rgb);
  }

  function killFoe(e, scored) {
    if (!e || !e.alive) return;
    e.alive = false;
    const spec = TYPES[e.kind];
    audio.kill(e.kind);
    hitStop(e.kind === 'cmd' ? 0.074 : 0.056);
    kick(e.kind === 'cmd' ? 5.2 : 3.8);
    screenFlash(spec.rgb, 0.42);
    explode(e.x, e.y, spec.rgb, e.kind === 'cmd' ? 36 : 22);
    if (scored && G.mode === 'play') {
      bumpCombo();
      const pts = spec.score * G.mult;
      addScore(pts);
      popFloat(e.x, e.y - 10, '+' + pts, spec.rgb, G.mult >= 2);
    }
  }

  function hurtFoe(e) {
    e.hp -= 1;
    e.flash = 0.16;
    if (e.hp <= 0) {
      killFoe(e, true);
      return true;
    }
    audio.clang(false);
    hitStop(0.034);
    kick(2.2);
    popSpark(e.x, e.y, GOLD, 12);
    emit(10, {
      x: e.x, y: e.y, j: 3,
      vx0: -140, vx1: 140, vy0: -140, vy1: 140,
      r0: 0.9, r1: 2.2, life: 0.22, rgb: GOLD, g: 0
    });
    return false;
  }

  function killShip(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    G.why = why || '船碎了';
    G.deadT = 1.18;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    audio.death();
    hitStop(0.08);
    kick(6.4);
    screenFlash(MAG, 0.7);
    explode(G.ship.x, G.ship.y, WHT, 34);
    explode(G.ship.x, G.ship.y, MAG, 16);
    if (why === 'wall') toast('撞墙太狠', true, false);
    else if (why === 'shot') toast('吃弹了', true, false);
    else toast('相撞', true, false);
    syncPips();
  }

  function placeShipSafe() {
    const s = G.ship;
    let best = SPAWNS[6];
    let bestD = -1;
    for (let i = 0; i < SPAWNS.length; i++) {
      const p = SPAWNS[i];
      let md = 9999;
      for (let k = 0; k < G.foes.length; k++) {
        const e = G.foes[k];
        if (!e.alive) continue;
        const d = hypot(e.x - p[0], e.y - p[1]);
        if (d < md) md = d;
      }
      for (let k = 0; k < G.shots.length; k++) {
        const sh = G.shots[k];
        if (sh.from === 'ship') continue;
        const d = hypot(sh.x - p[0], sh.y - p[1]);
        if (d < md) md = d;
      }
      if (md > bestD) { bestD = md; best = p; }
    }
    s.x = best[0];
    s.y = best[1];
    s.vx = 0;
    s.vy = 0;
    s.ang = Math.PI * 0.5;
    return bestD > 64;
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    shards.length = 0;
    wallHits.length = 0;
  }

  function resetWorld(demo) {
    G.foes.length = 0;
    G.shots.length = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.waveWait = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.danger = 0;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    resetFx();
    G.ship.x = 420;
    G.ship.y = 426;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.ship.ang = Math.PI * 0.5;
    if (demo) {
      for (let i = 0; i < 4; i++) {
        const p = SPAWNS[i * 2];
        const e = spawnFoe(i === 3 ? 'mine' : 'droid', p[0], p[1]);
        G.foes.push(e);
      }
    }
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'track';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.nextLife = EXTRA_LIFE;
    resetWorld(true);
    showOverlay('title', '环赛', LEAD, '环道', true);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'rain' ? 'rain' : 'track';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.nextLife = EXTRA_LIFE;
    G.clock = 0;
    resetWorld(false);
    hideOverlay();
    audio.start();
    spawnWave();
    G.invuln = 1.4;
    G.ready = 0.35;
    syncHud();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why || '船碎了';
    saveBest();
    audio.lose();
    const rec = G.score > 0 && G.score >= G.best;
    const lead = rec
      ? '新纪录 ' + G.score + '。撞墙太狠、机兵或弹都会碎船。'
      : (G.why + ' · 本局 ' + G.score + '。下一波会更快。');
    showOverlay('lose', rec ? '新纪录' : '船碎了', lead, '再来', true);
    syncHud();
  }

  function updatePlayer(dt) {
    const s = G.ship;
    if (G.deadT <= 0) {
      if (keys.l) s.ang -= ROT * dt;
      if (keys.r) s.ang += ROT * dt;
      if (keys.u) {
        s.vx += Math.sin(s.ang) * THRUST * dt;
        s.vy -= Math.cos(s.ang) * THRUST * dt;
        G.thrustT -= dt;
        if (G.thrustT <= 0) {
          G.thrustT = 0.07;
          audio.thrust();
        }
        const bx = s.x - Math.sin(s.ang) * 12;
        const by = s.y + Math.cos(s.ang) * 12;
        emit(2, {
          x: bx, y: by, j: 1.4,
          vx0: -Math.sin(s.ang) * 50 + s.vx * 0.2, vx1: -Math.sin(s.ang) * 150 + s.vx * 0.2,
          vy0: Math.cos(s.ang) * 50 + s.vy * 0.2, vy1: Math.cos(s.ang) * 150 + s.vy * 0.2,
          r0: 1.1, r1: 2.6, life: 0.2, rgb: Math.random() < 0.45 ? GOLD : ICE, g: 0
        });
      }
      if (keys.fire) fire();
    }
    const spd = hypot(s.vx, s.vy);
    if (spd > MAX_V) {
      s.vx *= MAX_V / spd;
      s.vy *= MAX_V / spd;
    }
    const drag = Math.exp(-DRAG * dt);
    s.vx *= drag;
    s.vy *= drag;
    if (G.deadT <= 0) {
      const b = moveBounce(s, SHIP_R, SHIP_REST, dt);
      if (b && b.imp > 28) {
        const hard = b.imp >= WALL_KILL;
        bounceHit(b.x, b.y, b.nx, b.ny, hard ? MAG : ICE, hard);
        clang(hard);
        if (hard && G.invuln <= 0) {
          killShip('wall');
        } else {
          hitStop(hard ? 0.05 : 0.032);
          kick(hard ? 4.4 : 2.1);
        }
      }
      const close = closingDanger(s, SHIP_R);
      G.danger = lerp(G.danger, close > 190 ? 1 : close > 140 ? 0.55 : 0, 1 - Math.exp(-dt * 8));
    } else {
      G.danger = 0;
    }
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
  }

  function steerFoe(e, dt) {
    const spec = TYPES[e.kind];
    const rain = isRain();
    const spdMul = 1 + (G.wave - 1) * (rain ? 0.11 : 0.085);
    e.think -= dt;
    e.pulse += dt * (e.kind === 'mine' || e.kind === 'super' ? 6.2 : 2.4);
    e.flash = Math.max(0, e.flash - dt);
    if (e.think <= 0) {
      e.think = rand(0.28, 0.9);
      if (e.kind === 'mine') {
        e.want = Math.atan2(e.vy, e.vx) + rand(-0.4, 0.4);
      } else if (e.kind === 'super') {
        e.want = Math.atan2(G.ship.x - e.x, -(G.ship.y - e.y)) + rand(-0.35, 0.35);
      } else if (e.kind === 'hunter' || e.kind === 'cmd') {
        const lead = 0.22;
        e.want = Math.atan2(
          G.ship.x + G.ship.vx * lead - e.x,
          -(G.ship.y + G.ship.vy * lead - e.y)
        ) + rand(-0.18, 0.18);
      } else {
        if (Math.random() < 0.55) {
          e.want = Math.atan2(G.ship.x - e.x, -(G.ship.y - e.y)) + rand(-0.7, 0.7);
        } else {
          e.want = Math.atan2(e.vy, e.vx) + rand(-0.9, 0.9);
        }
      }
    }
    const turn = angTo(e.ang, e.want);
    const turnSpd = e.kind === 'hunter' ? 3.6 : e.kind === 'cmd' ? 2.1 : 2.8;
    e.ang += clamp(turn, -turnSpd * dt, turnSpd * dt);
    const thrust = spec.thrust * spdMul;
    if (e.kind !== 'mine' || Math.random() < 0.02) {
      e.vx += Math.sin(e.ang) * thrust * dt;
      e.vy -= Math.cos(e.ang) * thrust * dt;
    }
    if (spec.home && G.deadT <= 0 && G.mode === 'play') {
      const dx = G.ship.x - e.x;
      const dy = G.ship.y - e.y;
      const d = hypot(dx, dy) || 1;
      e.vx += (dx / d) * 42 * dt;
      e.vy += (dy / d) * 42 * dt;
    }
    const max = spec.max * spdMul;
    let spd = hypot(e.vx, e.vy);
    if (spd > max) {
      e.vx *= max / spd;
      e.vy *= max / spd;
      spd = max;
    }
    const drag = (e.kind === 'mine' || e.kind === 'super') ? 0.02 : 0.08;
    e.vx *= Math.exp(-drag * dt);
    e.vy *= Math.exp(-drag * dt);
    if ((e.kind === 'mine' || e.kind === 'super') && spd < 46) {
      const a = Math.atan2(e.vy, e.vx) || e.ang;
      e.vx += Math.cos(a) * 30 * dt;
      e.vy += Math.sin(a) * 30 * dt;
    }
    if (spec.fire && G.mode === 'play' && G.deadT <= 0) {
      e.fireT -= dt;
      if (e.fireT <= 0) {
        const rate = spec.fire * (rain ? 0.62 : 1) * rand(0.75, 1.15);
        e.fireT = rate;
        const dx = G.ship.x - e.x;
        const dy = G.ship.y - e.y;
        const face = Math.sin(e.ang) * dx + (-Math.cos(e.ang)) * dy;
        if (face > 0 || e.kind === 'cmd') enemyFire(e);
      }
    }
  }

  function updateFoes(dt) {
    for (let i = 0; i < G.foes.length; i++) {
      const e = G.foes[i];
      if (!e.alive) continue;
      if (G.mode === 'play') steerFoe(e, dt);
      else {
        e.pulse += dt * 2.2;
        e.ang += e.spin * dt * 0.4;
      }
      const spec = TYPES[e.kind];
      const b = moveBounce(e, e.r, spec.rest, dt);
      if (b && b.imp > 40) {
        bounceHit(b.x, b.y, b.nx, b.ny, spec.rgb, false);
        if (G.clangT <= 0) clang(false);
        e.want = Math.atan2(e.vx, -e.vy) + rand(-0.3, 0.3);
      }
    }
    for (let i = 0; i < G.foes.length; i++) {
      const a = G.foes[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < G.foes.length; j++) {
        const b = G.foes[j];
        if (!b.alive) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = hypot(dx, dy);
        const min = a.r + b.r;
        if (d > 0.001 && d < min) {
          const nx = dx / d;
          const ny = dy / d;
          const ov = (min - d) * 0.5;
          a.x -= nx * ov;
          a.y -= ny * ov;
          b.x += nx * ov;
          b.y += ny * ov;
          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const vn = rvx * nx + rvy * ny;
          if (vn < 0) {
            a.vx += vn * nx;
            a.vy += vn * ny;
            b.vx -= vn * nx;
            b.vy -= vn * ny;
          }
        }
      }
      resolveWorld(a, a.r, TYPES[a.kind].rest);
    }
    if (G.foes.length > 24) {
      const keep = [];
      for (let i = 0; i < G.foes.length; i++) if (G.foes[i].alive) keep.push(G.foes[i]);
      G.foes = keep;
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
      const rest = SHOT_REST;
      const b = moveBounce(s, SHOT_R, rest, dt);
      if (b && b.imp > 20) {
        s.bounces -= 1;
        bounceHit(b.x, b.y, b.nx, b.ny, s.from === 'ship' ? ICE : MAG, false);
        if (s.from === 'ship') {
          clang(false);
          if (G.bounceStopCd <= 0) {
            hitStop(0.024);
            G.bounceStopCd = 0.14;
          }
          kick(1.15);
        } else if (G.clangT <= 0) {
          clang(false);
        }
        if (s.bounces < 0) s.life = 0;
      }
      if (s.life <= 0) {
        if (s.from === 'ship' && G.mode === 'play') G.comboT = Math.min(G.comboT, 0.16);
        G.shots.splice(i, 1);
      }
    }
  }

  function collide() {
    if (G.mode !== 'play') return;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.from === 'ship') {
        let hit = false;
        for (let k = 0; k < G.foes.length; k++) {
          const e = G.foes[k];
          if (!e.alive) continue;
          if (hypot(s.x - e.x, s.y - e.y) < e.r + 4) {
            G.shots.splice(i, 1);
            hurtFoe(e);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      } else if (G.deadT <= 0 && G.invuln <= 0) {
        if (hypot(s.x - G.ship.x, s.y - G.ship.y) < SHIP_R + 3.2) {
          G.shots.splice(i, 1);
          killShip('shot');
        }
      }
    }

    if (G.deadT <= 0 && G.invuln <= 0) {
      for (let k = 0; k < G.foes.length; k++) {
        const e = G.foes[k];
        if (!e.alive) continue;
        if (hypot(e.x - G.ship.x, e.y - G.ship.y) < e.r + SHIP_R) {
          killFoe(e, false);
          killShip('crash');
          break;
        }
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    G.clangT = Math.max(0, G.clangT - dt);
    G.bounceStopCd = Math.max(0, G.bounceStopCd - dt);
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
      q.vx *= Math.exp(-dt * 1.1);
      q.vy *= Math.exp(-dt * 1.1);
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
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.ang += s.spin * dt;
      s.vx *= Math.exp(-dt * 0.7);
      s.vy *= Math.exp(-dt * 0.7);
      if (s.life <= 0) shards.splice(i, 1);
    }
    for (let i = wallHits.length - 1; i >= 0; i--) {
      wallHits[i].t += dt;
      if (wallHits[i].t > 0.28) wallHits.splice(i, 1);
    }
  }

  function playSim(dt) {
    if (G.ready > 0) G.ready -= dt;
    updatePlayer(dt);
    updateFoes(dt);
    updateShots(dt);
    if (G.mode === 'play') collide();

    if (G.mode === 'play' && G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why);
          return;
        }
        if (!placeShipSafe()) {
          G.deadT = 0.28;
          return;
        }
        G.invuln = 1.85;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
    }

    if (G.mode === 'play' && G.deadT <= 0 && foeCount() === 0) {
      if (G.waveWait <= 0) G.waveWait = 0.78;
      else {
        G.waveWait -= dt;
        if (G.waveWait <= 0) {
          G.wave += 1;
          addScore(200 * (G.wave - 1));
          spawnWave();
        }
      }
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      G.ship.ang += 0.28 * dt;
      updateFoes(dt);
      updateShots(dt);
      if (G.t % 1.6 < dt) {
        const e = G.foes[(Math.random() * G.foes.length) | 0];
        if (e && e.alive && TYPES[e.kind].fire) enemyFire(e);
      }
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose') {
      updateFoes(dt);
      updateShots(dt);
      updateFx(dt);
      return;
    }

    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(sx(x + rr), sy(y));
    ctx.lineTo(sx(x + w - rr), sy(y));
    ctx.quadraticCurveTo(sx(x + w), sy(y), sx(x + w), sy(y + rr));
    ctx.lineTo(sx(x + w), sy(y + h - rr));
    ctx.quadraticCurveTo(sx(x + w), sy(y + h), sx(x + w - rr), sy(y + h));
    ctx.lineTo(sx(x + rr), sy(y + h));
    ctx.quadraticCurveTo(sx(x), sy(y + h), sx(x), sy(y + h - rr));
    ctx.lineTo(sx(x), sy(y + rr));
    ctx.quadraticCurveTo(sx(x), sy(y), sx(x + rr), sy(y));
    ctx.closePath();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#06241e');
    g.addColorStop(0.5, '#031a16');
    g.addColorStop(1, '#021410');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(420), sy(260), 40 * scale, sx(420), sy(260), 460 * scale);
    vg.addColorStop(0, 'rgba(0, 245, 212, 0.05)');
    vg.addColorStop(0.55, 'rgba(92, 255, 216, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      if (!inLane(s.x, s.y, 2)) continue;
      const a = REDUCE ? s.a : s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawArena() {
    const ow = OUTER.r - OUTER.l;
    const oh = OUTER.b - OUTER.t;
    const iw = INNER.r - INNER.l;
    const ih = INNER.b - INNER.t;
    let glow = 0.55;
    for (let i = 0; i < wallHits.length; i++) glow = Math.max(glow, 0.55 + (1 - wallHits[i].t / 0.28) * 0.45);

    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.16 * glow);
    ctx.lineWidth = 8 * scale;
    roundRect(OUTER.l, OUTER.t, ow, oh, 10);
    ctx.stroke();
    ctx.strokeStyle = rgba(ICE, 0.95);
    ctx.lineWidth = 2.1 * scale;
    roundRect(OUTER.l, OUTER.t, ow, oh, 10);
    ctx.stroke();

    ctx.fillStyle = 'rgba(3, 18, 16, 0.92)';
    ctx.strokeStyle = rgba(ICE, 0.18 * glow);
    ctx.lineWidth = 7 * scale;
    roundRect(INNER.l, INNER.t, iw, ih, 8);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = rgba(CYN, 0.95);
    ctx.lineWidth = 2 * scale;
    roundRect(INNER.l, INNER.t, iw, ih, 8);
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = rgba(ICE, 0.7);
    ctx.lineWidth = 1.1 * scale;
    ctx.setLineDash([8 * scale, 10 * scale]);
    roundRect(INNER.l - 22, INNER.t - 22, iw + 44, ih + 44, 12);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const ocx = (INNER.l + INNER.r) * 0.5;
    const ocy = (INNER.t + INNER.b) * 0.5 - 4;
    const os = scale;
    ctx.save();
    ctx.translate(sx(ocx), sy(ocy));
    ctx.strokeStyle = rgba(ICE, 0.22);
    ctx.lineWidth = 8 * os;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-26 * os, 18 * os);
    ctx.lineTo(-11 * os, 18 * os);
    ctx.bezierCurveTo(-18 * os, 6 * os, -28 * os, -28 * os, 0, -28 * os);
    ctx.bezierCurveTo(28 * os, -28 * os, 18 * os, 6 * os, 11 * os, 18 * os);
    ctx.lineTo(26 * os, 18 * os);
    ctx.stroke();
    ctx.strokeStyle = rgba(ICE, 0.95);
    ctx.lineWidth = 3.1 * os;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = rgba(WHT, 0.38);
    ctx.font = '600 ' + (9 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OMEGA', sx(ocx), sy(ocy + 36));

    const corners = [
      [OUTER.l + 14, OUTER.t + 14],
      [OUTER.r - 14, OUTER.t + 14],
      [OUTER.l + 14, OUTER.b - 14],
      [OUTER.r - 14, OUTER.b - 14]
    ];
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1.4 * scale;
    for (let i = 0; i < 4; i++) {
      const c = corners[i];
      const sxn = i % 2 === 0 ? 1 : -1;
      const syn = i < 2 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(sx(c[0]), sy(c[1] + syn * 10));
      ctx.lineTo(sx(c[0]), sy(c[1]));
      ctx.lineTo(sx(c[0] + sxn * 10), sy(c[1]));
      ctx.stroke();
    }

    for (let i = 0; i < wallHits.length; i++) {
      const h = wallHits[i];
      const a = 1 - h.t / 0.28;
      ctx.strokeStyle = rgba(h.hard ? MAG : h.rgb, 0.55 * a);
      ctx.lineWidth = (2.4 + a * 2) * scale;
      ctx.beginPath();
      ctx.arc(sx(h.x), sy(h.y), (6 + a * 10) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShipShape(x, y, ang, thrusting, ghost, danger) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, -14 * scale);
    ctx.lineTo(9.5 * scale, 12 * scale);
    ctx.lineTo(0, 7 * scale);
    ctx.lineTo(-9.5 * scale, 12 * scale);
    ctx.closePath();
    const rgb = danger > 0.55 ? MAG : danger > 0.25 ? GOLD : WHT;
    ctx.strokeStyle = rgba(rgb, ghost ? 0.32 : 1);
    ctx.lineWidth = 1.6 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    if (thrusting && !ghost) {
      const flick = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(G.t * 42));
      ctx.beginPath();
      ctx.moveTo(-4.4 * scale, 8 * scale);
      ctx.lineTo(0, (16 + 7 * flick) * scale);
      ctx.lineTo(4.4 * scale, 8 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.9 * flick);
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-2.2 * scale, 8 * scale);
      ctx.lineTo(0, (12 + 4 * flick) * scale);
      ctx.lineTo(2.2 * scale, 8 * scale);
      ctx.strokeStyle = rgba(CYN, 0.7 * flick);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.mode === 'lose' || G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    const s = G.ship;
    const thrusting = G.mode === 'play' && keys.u;
    const ghost = G.mode === 'title';
    drawShipShape(s.x, s.y, s.ang, thrusting, ghost, G.danger);
  }

  function drawFoe(e) {
    const spec = TYPES[e.kind];
    const rgb = e.flash > 0 ? WHT : spec.rgb;
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.rotate(e.ang);
    ctx.strokeStyle = rgba(rgb, 0.2);
    ctx.lineWidth = 4.4 * scale;
    ctx.lineJoin = 'round';
    if (e.kind === 'mine' || e.kind === 'super') {
      const p = 1 + 0.12 * Math.sin(e.pulse);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8;
        const rr = e.r * p * (i % 2 ? 0.72 : 1);
        const px = Math.sin(a) * rr * scale;
        const py = -Math.cos(a) * rr * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.45 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-e.r * 0.45 * scale, -e.r * 0.45 * scale);
      ctx.lineTo(e.r * 0.45 * scale, e.r * 0.45 * scale);
      ctx.moveTo(e.r * 0.45 * scale, -e.r * 0.45 * scale);
      ctx.lineTo(-e.r * 0.45 * scale, e.r * 0.45 * scale);
      ctx.stroke();
    } else if (e.kind === 'cmd') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6;
        const px = Math.sin(a) * e.r * scale;
        const py = -Math.cos(a) * e.r * scale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 4.2 * scale, 0, TAU);
      ctx.stroke();
    } else if (e.kind === 'hunter') {
      ctx.beginPath();
      ctx.moveTo(0, -13 * scale);
      ctx.lineTo(10 * scale, 8 * scale);
      ctx.lineTo(0, 3 * scale);
      ctx.lineTo(-10 * scale, 8 * scale);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-7 * scale, 2 * scale);
      ctx.lineTo(-12 * scale, 9 * scale);
      ctx.moveTo(7 * scale, 2 * scale);
      ctx.lineTo(12 * scale, 9 * scale);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -11 * scale);
      ctx.lineTo(9 * scale, 0);
      ctx.lineTo(0, 11 * scale);
      ctx.lineTo(-9 * scale, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFoes() {
    for (let i = 0; i < G.foes.length; i++) {
      if (G.foes[i].alive) drawFoe(G.foes[i]);
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const rgb = s.from === 'ship' ? WHT : MAG;
      const spd = hypot(s.vx, s.vy) || 1;
      const dx = s.vx / spd;
      const dy = s.vy / spd;
      if (s.trail && !REDUCE) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          ctx.strokeStyle = rgba(s.from === 'ship' ? CYN : MAG, 0.08 + t * 0.07);
          ctx.lineWidth = (1 + t * 0.12) * scale;
          ctx.beginPath();
          ctx.moveTo(sx(p.x - dx * 3), sy(p.y - dy * 3));
          ctx.lineTo(sx(p.x + dx * 3), sy(p.y + dy * 3));
          ctx.stroke();
        }
      }
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = (s.from === 'ship' ? 1.9 : 2.2) * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(s.x - dx * 5.5), sy(s.y - dy * 5.5));
      ctx.lineTo(sx(s.x + dx * 5.5), sy(s.y + dy * 5.5));
      ctx.stroke();
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
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const a = clamp(s.life / s.max, 0, 1);
      const hx = Math.cos(s.ang) * s.len * 0.5;
      const hy = Math.sin(s.ang) * s.len * 0.5;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.35 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(s.x - hx), sy(s.y - hy));
      ctx.lineTo(sx(s.x + hx), sy(s.y + hy));
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
    ctx.fillStyle = '#021410';
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
    drawArena();
    drawFoes();
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

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('track');
    else startGame(G.kind || 'track');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('track');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const code = e.code || '';
    const k = e.key;
    const left = code === 'KeyA' || code === 'ArrowLeft';
    const right = code === 'KeyD' || code === 'ArrowRight';
    const up = code === 'KeyW' || code === 'ArrowUp';
    const space = code === 'Space' || k === ' ';
    if (down && (left || right || up || space || k === 'Enter')) e.preventDefault();

    if (left) keys.l = down;
    if (right) keys.r = down;
    if (up) keys.u = down;
    if (space) keys.fire = down && G.mode === 'play' && !overlayOpen();

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
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') fire();
    }
    if ((k === '1' || code === 'Digit1') && overlayOpen() && G.mode === 'title') {
      startGame('track');
    }
    if ((k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') {
      startGame('rain');
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
      press();
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
  bindPads();

  if (btnTrack) {
    btnTrack.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('track');
    });
  }
  if (btnRain) {
    btnRain.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('rain');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (e.button != null && e.button !== 0) return;
      if (e.pointerType === 'touch' && padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      if (overlayOpen()) {
        if (e.pointerType !== 'touch') primaryAction();
        return;
      }
      if (G.mode === 'play') {
        keys.fire = true;
        fire();
      }
    });
    function ptrUp() { keys.fire = false; }
    canvas.addEventListener('pointerup', ptrUp);
    canvas.addEventListener('pointercancel', ptrUp);
    canvas.addEventListener('lostpointercapture', ptrUp);
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
