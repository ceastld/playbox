'use strict';

(function () {
  const VW = 800;
  const VH = 480;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const EXTRA_LIFE = 10000;
  const BEST_KEY = 'playbox-blasteroids-best';
  const MUTE_KEY = 'playbox-blasteroids-mute';
  const OPS = 'A D / ← → 转向 · W / ↑ 推进 · 空格开火 · C 变身';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const ICE = [78, 200, 255];
  const GOLD = [255, 227, 107];
  const WHT = [230, 251, 255];
  const LIME = [125, 255, 106];
  const MUKC = [70, 230, 120];
  const MUK2 = [40, 180, 90];

  const FORMS = [
    {
      id: 'speeder',
      name: '快艇',
      r: 7.4,
      rot: 5.45,
      thrust: 372,
      maxV: 472,
      drag: 0.042,
      shotV: 650,
      shotLife: 0.66,
      maxShots: 6,
      fireCd: 0.09,
      power: 1,
      nose: 16,
      wide: 1.15,
      rgb: CYN
    },
    {
      id: 'fighter',
      name: '战机',
      r: 10,
      rot: 3.62,
      thrust: 250,
      maxV: 336,
      drag: 0.082,
      shotV: 528,
      shotLife: 0.8,
      maxShots: 4,
      fireCd: 0.138,
      power: 2,
      nose: 14,
      wide: 1.7,
      rgb: ICE
    },
    {
      id: 'warrior',
      name: '重炮',
      r: 14.4,
      rot: 2.32,
      thrust: 158,
      maxV: 226,
      drag: 0.165,
      shotV: 382,
      shotLife: 1.04,
      maxShots: 3,
      fireCd: 0.24,
      power: 4,
      nose: 15,
      wide: 3.1,
      rgb: GOLD
    }
  ];

  const ROCK = [
    { r: 40, score: 20, next: 1, kids: 2, spd0: 20, spd1: 46, spin: 0.42, rgb: ICE },
    { r: 23, score: 50, next: 2, kids: 2, spd0: 34, spd1: 72, spin: 0.82, rgb: CYN },
    { r: 12, score: 100, next: -1, kids: 0, spd0: 56, spd1: 108, spin: 1.35, rgb: WHT }
  ];

  const MUK = [
    { r: 12, hp: 2, score: 150, spd: 62, rgb: LIME },
    { r: 22, hp: 4, score: 320, spd: 46, rgb: MUKC },
    { r: 34, hp: 8, score: 700, spd: 32, rgb: MUK2 }
  ];

  const PUP_KINDS = [
    { id: 'rapid', name: '速射', w: 28, rgb: CYN },
    { id: 'spread', name: '散射', w: 24, rgb: GOLD },
    { id: 'shield', name: '护盾', w: 22, rgb: ICE },
    { id: 'pierce', name: '穿甲', w: 18, rgb: MAG },
    { id: 'life', name: '加命', w: 8, rgb: GOLD }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnBelt = document.getElementById('btn-belt');
  const btnSwarm = document.getElementById('btn-swarm');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const formLabel = document.getElementById('form-label');
  const pupLabel = document.getElementById('pup-label');
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
  const padMorph = document.getElementById('pad-morph');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let kickTok = 0;
  let comboTok = 0;
  let formTok = 0;

  const keys = { l: false, r: false, u: false, fire: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const shards = [];
  const stars = [];
  const pendingRocks = [];
  const pendingMuks = [];

  const G = {
    mode: 'title',
    kind: 'belt',
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
    form: 1,
    ship: { x: VW * 0.5, y: VH * 0.5, vx: 0, vy: 0, ang: -0.2 },
    rocks: [],
    shots: [],
    muks: [],
    pups: [],
    mukWait: 14,
    fireCd: 0,
    morphCd: 0,
    morphFlash: 0,
    morphGhost: 0,
    prevForm: 1,
    ready: 0,
    deadT: 0,
    invuln: 0,
    shield: 0,
    waveWait: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: ICE,
    punch: 1,
    toastT: 0,
    thrustT: 0,
    demoMorph: 2.4,
    pup: { rapid: 0, spread: 0, pierce: 0 },
    why: ''
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
  function isSwarm() {
    return G.kind === 'swarm';
  }
  function form() {
    return FORMS[G.form];
  }
  function shipR() {
    return form().r;
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
    shoot(kind) {
      this.ensure();
      if (kind === 0) {
        this.beep(1480, 0.04, 'square', 0.024, 320);
        this.beep(880, 0.03, 'triangle', 0.012, 180);
      } else if (kind === 2) {
        this.beep(220, 0.08, 'sawtooth', 0.036, 90);
        this.beep(480, 0.06, 'square', 0.022, 140);
        this.noise(0.05, 0.02, 400);
      } else {
        this.beep(1180, 0.05, 'square', 0.028, 240);
        this.beep(620, 0.035, 'triangle', 0.014, 140);
      }
    },
    thrust() {
      this.ensure();
      this.noise(0.05, 0.014, 260);
      this.beep(68, 0.05, 'sawtooth', 0.012, 40);
    },
    bust(size) {
      this.ensure();
      const low = size === 0 ? 96 : size === 1 ? 160 : 260;
      const hi = size === 0 ? 280 : size === 1 ? 480 : 760;
      this.noise(size === 0 ? 0.16 : 0.09, size === 0 ? 0.072 : 0.042, 220);
      this.beep(hi, 0.1, 'square', 0.048, low);
      this.beep(low * 1.35, 0.14, 'triangle', 0.028, low * 0.4);
    },
    morph(kind) {
      this.ensure();
      const a = kind === 0 ? 520 : kind === 2 ? 180 : 330;
      const b = kind === 0 ? 1240 : kind === 2 ? 420 : 780;
      this.beep(a, 0.12, 'sawtooth', 0.04, b);
      this.beep(b * 0.5, 0.16, 'triangle', 0.03, b);
      this.noise(0.08, 0.028, 500);
    },
    mukTick() {
      this.ensure();
      this.beep(90, 0.07, 'sine', 0.016, 70);
      this.beep(140, 0.05, 'triangle', 0.01, 60);
    },
    mukHit() {
      this.ensure();
      this.noise(0.08, 0.04, 180);
      this.beep(210, 0.1, 'sine', 0.04, 80);
    },
    mukKill() {
      this.ensure();
      this.noise(0.14, 0.055, 140);
      this.beep(180, 0.16, 'sawtooth', 0.042, 50);
      this.beep(320, 0.1, 'triangle', 0.03, 90);
    },
    mukSplit() {
      this.ensure();
      this.beep(160, 0.08, 'sine', 0.034, 280);
      this.noise(0.09, 0.038, 220);
    },
    pickup(kind) {
      this.ensure();
      if (kind === 'life') {
        this.beep(523, 0.08, 'square', 0.038, 784);
        this.beep(784, 0.1, 'triangle', 0.038, 1046);
        this.beep(1046, 0.18, 'sine', 0.042, 1568);
      } else if (kind === 'shield') {
        this.beep(440, 0.08, 'sine', 0.04, 880);
        this.beep(660, 0.12, 'triangle', 0.03, 990);
      } else {
        this.beep(720, 0.06, 'square', 0.032, 1080);
        this.beep(1080, 0.1, 'triangle', 0.028, 1440);
      }
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
      this.noise(0.18, 0.06, 260);
      this.beep(240, 0.22, 'sawtooth', 0.05, 58);
      this.beep(140, 0.34, 'sine', 0.042, 40);
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
    },
    shieldPop() {
      this.ensure();
      this.beep(280, 0.1, 'triangle', 0.04, 90);
      this.noise(0.08, 0.03, 600);
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
        comboTok += 1;
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
  }

  function pupText() {
    const bits = [];
    if (G.shield > 0) bits.push('盾');
    if (G.pup.rapid > 0) bits.push('速');
    if (G.pup.spread > 0) bits.push('散');
    if (G.pup.pierce > 0) bits.push('穿');
    return bits.join(' ');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '岩变';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 4);
    }
    if (tagLabel) {
      tagLabel.textContent = isSwarm() ? '乱飞' : '岩变';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (formLabel) {
      const f = form();
      formLabel.textContent = f.name;
      formLabel.classList.remove('speeder', 'fighter', 'warrior');
      formLabel.classList.add('form-chip', f.id);
    }
    if (pupLabel) {
      const t = pupText();
      if (G.mode === 'play' && t) {
        pupLabel.hidden = false;
        pupLabel.textContent = t;
      } else {
        pupLabel.hidden = true;
      }
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
    else if (G.mode === 'lose') setHint('R 重开 · 岩石或绿黏撞船即扣命', 'warn');
    else if (G.lives === 1) setHint('最后一命 · C 换成重炮砸黏', 'warn');
    else setHint('A D 转向 · W 推进 · 空格开火 · C 变身', G.combo >= 6 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showSwarm) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'BLAST';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnBelt.textContent = primary;
    btnSwarm.classList.toggle('hidden', !showSwarm);
    if (kind === 'lose') btnSwarm.textContent = '换模式';
    else btnSwarm.textContent = '乱飞';
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

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 108; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.16 ? 1.35 : 0.65,
        a: rand(0.22, 0.88),
        p: Math.random() * TAU,
        rgb: Math.random() < 0.18 ? LIME : Math.random() < 0.28 ? ICE : Math.random() < 0.14 ? CYN : WHT
      });
    }
  }

  function makeShape(r) {
    const n = 8 + ((Math.random() * 6) | 0);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.12, 0.12);
      const rr = r * rand(0.58, 1.18);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return pts;
  }

  function spawnRock(size, x, y, vx, vy) {
    const spec = ROCK[size];
    const ang = Math.random() * TAU;
    const spd = rand(spec.spd0, spec.spd1) * (isSwarm() ? 1.14 : 1) * (1 + (G.wave - 1) * 0.055);
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
    for (let i = 0; i < G.muks.length; i++) {
      const m = G.muks[i];
      if (!m.alive) continue;
      if (wrapDist(x, y, m.x, m.y).d < rad + m.r + 8) return false;
    }
    return true;
  }

  function placeEdgeRock(size) {
    const side = (Math.random() * 4) | 0;
    let x;
    let y;
    if (side === 0) {
      x = rand(24, VW - 24);
      y = rand(8, 42);
    } else if (side === 1) {
      x = rand(24, VW - 24);
      y = rand(VH - 42, VH - 8);
    } else if (side === 2) {
      x = rand(8, 42);
      y = rand(24, VH - 24);
    } else {
      x = rand(VW - 42, VW - 8);
      y = rand(24, VH - 24);
    }
    const cx = G.ship.x;
    const cy = G.ship.y;
    if (wrapDist(x, y, cx, cy).d < 140) {
      x = wrap(cx + (x < cx ? -220 : 220), VW);
      y = wrap(cy + rand(-70, 70), VH);
    }
    return spawnRock(size, x, y, null, null);
  }

  function pickPupKind() {
    let t = 0;
    for (let i = 0; i < PUP_KINDS.length; i++) t += PUP_KINDS[i].w;
    let r = Math.random() * t;
    for (let i = 0; i < PUP_KINDS.length; i++) {
      r -= PUP_KINDS[i].w;
      if (r <= 0) return PUP_KINDS[i];
    }
    return PUP_KINDS[0];
  }

  function dropPup(x, y) {
    const kind = pickPupKind();
    G.pups.push({
      x: wrap(x, VW),
      y: wrap(y, VH),
      vx: rand(-28, 28),
      vy: rand(-28, 28),
      kind: kind.id,
      name: kind.name,
      rgb: kind.rgb,
      life: 8.6,
      bob: Math.random() * TAU,
      r: 9
    });
    capArr(G.pups, 8);
  }

  function maybeDrop(x, y, size) {
    if (G.mode !== 'play') return;
    const p = (size === 0 ? 0.24 : size === 1 ? 0.13 : 0.06) + (isSwarm() ? 0.05 : 0);
    if (Math.random() > p) return;
    dropPup(x, y);
  }

  function takePup(p) {
    const ix = G.pups.indexOf(p);
    if (ix < 0) return;
    G.pups.splice(ix, 1);
    audio.pickup(p.kind);
    popSpark(p.x, p.y, p.rgb, 16);
    popRing(p.x, p.y, p.rgb, 8);
    emit(14, {
      x: p.x, y: p.y, j: 4,
      vx0: -140, vx1: 140, vy0: -140, vy1: 140,
      r0: 1, r1: 2.4, life: 0.36, rgb: p.rgb, g: 0
    });
    if (p.kind === 'life') {
      G.lives += 1;
      toast('额外生命', false, true);
      screenFlash(GOLD, 0.5);
      syncPips();
    } else if (p.kind === 'shield') {
      G.shield = Math.min(2, G.shield + 1);
      toast('护盾', false, true);
      screenFlash(ICE, 0.4);
    } else if (p.kind === 'rapid') {
      G.pup.rapid = 8.2;
      toast('速射', false, true);
    } else if (p.kind === 'spread') {
      G.pup.spread = 8.2;
      toast('散射', false, true);
    } else if (p.kind === 'pierce') {
      G.pup.pierce = 6.8;
      toast('穿甲', false, true);
    }
    if (G.mode === 'play') {
      bumpCombo();
      const pts = 80 * G.mult;
      addScore(pts);
      popFloat(p.x, p.y - 8, p.name, p.rgb, true);
    }
    hitStop(0.03);
    kick(1.6);
  }

  function spawnMuk(size, x, y, vx, vy) {
    const spec = MUK[size];
    const dir = Math.random() * TAU;
    const spd = spec.spd * (isSwarm() ? 1.28 : 1) * (1 + (G.wave - 1) * 0.04);
    return {
      x: wrap(x, VW),
      y: wrap(y, VH),
      vx: vx == null ? Math.cos(dir) * spd * 0.6 : vx,
      vy: vy == null ? Math.sin(dir) * spd * 0.6 : vy,
      r: spec.r,
      size: size,
      hp: spec.hp,
      maxHp: spec.hp,
      ph: Math.random() * TAU,
      tick: rand(0.4, 0.9),
      drip: isSwarm() ? rand(6, 12) : 99,
      alive: true
    };
  }

  function mukCap() {
    if (isSwarm()) return Math.min(4, 2 + ((G.wave / 2) | 0));
    return G.wave >= 3 ? 2 : 1;
  }

  function mukCount() {
    let n = 0;
    for (let i = 0; i < G.muks.length; i++) if (G.muks[i].alive) n += 1;
    return n;
  }

  function placeEdgeMuk(size) {
    const side = (Math.random() * 4) | 0;
    let x;
    let y;
    if (side === 0) {
      x = rand(40, VW - 40);
      y = 8;
    } else if (side === 1) {
      x = rand(40, VW - 40);
      y = VH - 8;
    } else if (side === 2) {
      x = 8;
      y = rand(40, VH - 40);
    } else {
      x = VW - 8;
      y = rand(40, VH - 40);
    }
    if (wrapDist(x, y, G.ship.x, G.ship.y).d < 160) {
      x = wrap(G.ship.x + 260, VW);
      y = wrap(G.ship.y + rand(-80, 80), VH);
    }
    return spawnMuk(size, x, y, null, null);
  }

  function spawnMukNow() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (rockCount() < 1) return;
    if (mukCount() >= mukCap()) return;
    const big = G.wave >= (isSwarm() ? 2 : 4) || G.score >= (isSwarm() ? 3500 : 8000);
    const size = big && Math.random() < 0.45 ? 1 : 0;
    const m = placeEdgeMuk(size);
    G.muks.push(m);
    toast(size ? '中黏入场' : '绿黏入场', false, true);
    popRing(m.x, m.y, LIME, 10);
  }

  function growMuk(m) {
    if (!m.alive) return;
    if (m.size < 2) {
      m.size += 1;
      const spec = MUK[m.size];
      m.r = spec.r;
      m.hp = spec.hp;
      m.maxHp = spec.hp;
      popRing(m.x, m.y, LIME, m.r * 0.4);
      if (G.mode === 'play') toast('黏变大了', true, false);
    } else {
      m.hp = Math.min(m.maxHp + 4, m.hp + 3);
      m.maxHp = Math.max(m.maxHp, m.hp);
    }
  }

  function splitMuk(m) {
    m.alive = false;
    audio.mukSplit();
    hitStop(0.046);
    kick(2.8);
    screenFlash(LIME, 0.32);
    popSpark(m.x, m.y, LIME, m.r);
    emit(16, {
      x: m.x, y: m.y, j: m.r * 0.4,
      vx0: -180, vx1: 180, vy0: -180, vy1: 180,
      r0: 1.2, r1: 3.2, life: 0.4, rgb: LIME, g: 0
    });
    const ns = m.size - 1;
    for (let k = 0; k < 2; k++) {
      const a = Math.random() * TAU;
      const child = spawnMuk(
        ns,
        m.x + Math.cos(a) * 10,
        m.y + Math.sin(a) * 10,
        Math.cos(a) * 70 + m.vx * 0.4,
        Math.sin(a) * 70 + m.vy * 0.4
      );
      pendingMuks.push(child);
    }
  }

  function killMuk(m, power, scored) {
    if (!m.alive) return;
    const need = m.size === 2 ? 4 : m.size === 1 ? 3 : 1;
    if (m.size > 0 && power < need) {
      if (scored && G.mode === 'play') {
        bumpCombo();
        const pts = 40 * G.mult;
        addScore(pts);
        popFloat(m.x, m.y - 6, '裂', LIME, false);
      }
      splitMuk(m);
      return;
    }
    m.alive = false;
    audio.mukKill();
    hitStop(m.size === 2 ? 0.072 : 0.052);
    kick(m.size === 2 ? 4.8 : 3.2);
    screenFlash(LIME, 0.48);
    popSpark(m.x, m.y, LIME, m.r * 1.1);
    popRing(m.x, m.y, LIME, m.r * 0.3);
    emit(18 + m.size * 8, {
      x: m.x, y: m.y, j: m.r * 0.45,
      vx0: -220, vx1: 220, vy0: -220, vy1: 220,
      r0: 1.2, r1: 3.8, life: 0.48, rgb: LIME, g: 0
    });
    emit(8, {
      x: m.x, y: m.y, j: 4,
      vx0: -120, vx1: 120, vy0: -120, vy1: 120,
      r0: 1, r1: 2.2, life: 0.4, rgb: MUK2, g: 0
    });
    if (scored && G.mode === 'play') {
      bumpCombo();
      const pts = MUK[m.size].score * G.mult;
      addScore(pts);
      popFloat(m.x, m.y - 10, '+' + pts, LIME, G.mult > 1);
      toast((m.size === 2 ? '大黏' : m.size === 1 ? '中黏' : '绿黏') + ' ×' + G.mult, false, true);
    }
    if (Math.random() < 0.28) dropPup(m.x, m.y);
    G.mukWait = rand(isSwarm() ? 3.8 : 10, isSwarm() ? 8 : 18);
  }

  function spawnWave() {
    const n = isSwarm()
      ? Math.min(9, 3 + G.wave)
      : Math.min(8, 3 + G.wave);
    G.rocks = [];
    for (let i = 0; i < n; i++) G.rocks.push(placeEdgeRock(0));
    G.ready = 0.4;
    G.waveWait = 0;
    G.mukWait = isSwarm() ? rand(3.4, 7.2) : (G.wave === 1 ? rand(11, 18) : rand(8, 15));
    if (G.mode === 'play') {
      audio.wave();
      toast('第 ' + G.wave + ' 波' + (G.wave > 1 ? ' · 加速' : ''), false, G.wave > 1);
    }
  }

  function resetPups() {
    G.pups = [];
    G.pup.rapid = 0;
    G.pup.spread = 0;
    G.pup.pierce = 0;
    G.shield = 0;
  }

  function resetWorld(demo) {
    G.ship.x = VW * 0.5;
    G.ship.y = VH * 0.5;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.ship.ang = -0.2;
    G.form = 1;
    G.prevForm = 1;
    G.shots = [];
    G.muks = [];
    resetPups();
    G.mukWait = demo ? 99 : (isSwarm() ? rand(3.4, 7.2) : rand(11, 18));
    G.fireCd = 0;
    G.morphCd = 0;
    G.morphFlash = 0;
    G.morphGhost = 0;
    G.deadT = 0;
    G.invuln = demo ? 0 : 2;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.waveWait = 0;
    G.demoMorph = 2.4;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    shards.length = 0;
    if (demo) {
      G.wave = 1;
      G.rocks = [];
      for (let i = 0; i < 5; i++) G.rocks.push(placeEdgeRock(i % 3));
      G.muks.push(placeEdgeMuk(1));
    }
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'belt';
    G.score = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    resetWorld(true);
    showOverlay(
      'title',
      '岩变',
      '出边绕回。大岩裂中、中裂小。C 变身：快艇快、战机稳、重炮砸黏。绿黏会吃能量。',
      '岩变',
      true
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'swarm' ? 'swarm' : 'belt';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    resetWorld(false);
    keys.fire = false;
    spawnWave();
    hideOverlay();
    audio.start();
    if (scoreEl) scoreEl.textContent = '0';
    syncHud();
  }

  function loseRun(why) {
    G.why = why;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.7);
    G.mode = 'lose';
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

  function flashFormHud() {
    if (!formLabel) return;
    formTok += 1;
    formLabel.classList.remove('flash');
    void formLabel.offsetWidth;
    formLabel.classList.add('flash');
  }

  function morph() {
    if (G.mode === 'title') {
      G.prevForm = G.form;
      G.form = (G.form + 1) % 3;
      G.morphFlash = 0.22;
      G.morphGhost = 0.2;
      audio.morph(G.form);
      flashFormHud();
      syncHud();
      return;
    }
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.morphCd > 0) return;
    G.morphCd = 0.34;
    G.prevForm = G.form;
    G.form = (G.form + 1) % 3;
    const f = form();
    audio.morph(G.form);
    hitStop(0.042);
    kick(2.6);
    screenFlash(f.rgb, 0.62);
    popRing(G.ship.x, G.ship.y, f.rgb, 8);
    popSpark(G.ship.x, G.ship.y, f.rgb, 22);
    emit(22, {
      x: G.ship.x, y: G.ship.y, j: 8,
      vx0: -220, vx1: 220, vy0: -220, vy1: 220,
      r0: 1.1, r1: 3.2, life: 0.38, rgb: f.rgb, g: 0
    });
    emit(8, {
      x: G.ship.x, y: G.ship.y, j: 4,
      vx0: -90, vx1: 90, vy0: -90, vy1: 90,
      r0: 1, r1: 2, life: 0.28, rgb: WHT, g: 0
    });
    G.morphFlash = 0.28;
    G.morphGhost = 0.22;
    toast(f.name, false, true);
    syncHud();
    flashFormHud();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const f = form();
    const spread = G.pup.spread > 0;
    const rapid = G.pup.rapid > 0;
    const max = f.maxShots + (spread ? 3 : 0) + (isSwarm() ? 1 : 0);
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].from === 'ship') n += 1;
    if (n >= max) return;
    G.fireCd = f.fireCd * (rapid ? 0.52 : 1) * (isSwarm() ? 0.9 : 1);
    const angs = [G.ship.ang];
    if (spread) {
      angs.push(G.ship.ang - 0.24);
      angs.push(G.ship.ang + 0.24);
    }
    const pierce = (G.pup.pierce > 0 ? 1 : 0) + (f.power >= 4 ? 1 : 0);
    for (let i = 0; i < angs.length; i++) {
      const ang = angs[i];
      const nose = f.nose;
      const x = G.ship.x + Math.sin(ang) * nose;
      const y = G.ship.y - Math.cos(ang) * nose;
      G.shots.push({
        x: x,
        y: y,
        vx: G.ship.vx + Math.sin(ang) * f.shotV,
        vy: G.ship.vy - Math.cos(ang) * f.shotV,
        life: f.shotLife,
        from: 'ship',
        power: f.power,
        wide: f.wide,
        pierce: pierce,
        rgb: f.rgb,
        trail: []
      });
    }
    audio.shoot(G.form);
    if (!REDUCE) G.punch = Math.max(G.punch, 1.012);
    const noseX = G.ship.x + Math.sin(G.ship.ang) * f.nose;
    const noseY = G.ship.y - Math.cos(G.ship.ang) * f.nose;
    popSpark(noseX, noseY, f.rgb, G.form === 2 ? 12 : 8);
    emit(3, {
      x: noseX, y: noseY, j: 1.6,
      vx0: Math.sin(G.ship.ang) * 50, vx1: Math.sin(G.ship.ang) * 130,
      vy0: -Math.cos(G.ship.ang) * 50, vy1: -Math.cos(G.ship.ang) * 130,
      r0: 0.8, r1: 1.8, life: 0.16, rgb: WHT, g: 0
    });
  }

  function killShip() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play') return;
    if (G.shield > 0) {
      G.shield -= 1;
      G.invuln = Math.max(G.invuln, 1.15);
      audio.shieldPop();
      hitStop(0.05);
      kick(3.4);
      screenFlash(ICE, 0.5);
      popRing(G.ship.x, G.ship.y, ICE, 14);
      popSpark(G.ship.x, G.ship.y, ICE, 22);
      emit(20, {
        x: G.ship.x, y: G.ship.y, j: 6,
        vx0: -200, vx1: 200, vy0: -200, vy1: 200,
        r0: 1.1, r1: 3, life: 0.4, rgb: ICE, g: 0
      });
      toast(G.shield > 0 ? '护盾破裂' : '护盾没了', true, false);
      return;
    }
    G.deadT = 1.22;
    G.lives -= 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    resetPups();
    audio.death();
    hitStop(0.078);
    kick(6.5);
    screenFlash(MAG, 0.72);
    popRing(G.ship.x, G.ship.y, MAG, 12);
    popSpark(G.ship.x, G.ship.y, MAG, 28);
    emit(38, {
      x: G.ship.x, y: G.ship.y, j: 6,
      vx0: -280, vx1: 280, vy0: -280, vy1: 280,
      r0: 1.3, r1: 4, life: 0.72, rgb: form().rgb, g: 0
    });
    emit(16, {
      x: G.ship.x, y: G.ship.y, j: 4,
      vx0: -170, vx1: 170, vy0: -170, vy1: 170,
      r0: 1, r1: 2.4, life: 0.5, rgb: MAG, g: 0
    });
    for (let i = 0; i < 5; i++) {
      const a = G.ship.ang + (i - 2) * 0.55;
      shards.push({
        x: G.ship.x,
        y: G.ship.y,
        vx: Math.sin(a) * rand(70, 180) + G.ship.vx * 0.3,
        vy: -Math.cos(a) * rand(70, 180) + G.ship.vy * 0.3,
        ang: a,
        spin: rand(-6, 6),
        len: rand(7, 14),
        life: 0.7,
        max: 0.7,
        rgb: i % 2 ? MAG : form().rgb
      });
    }
    capArr(shards, 80);
    syncPips();
  }

  function emitShards(rock) {
    const ca = Math.cos(rock.ang);
    const sa = Math.sin(rock.ang);
    const pts = rock.pts;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const mx = (a[0] + b[0]) * 0.5;
      const my = (a[1] + b[1]) * 0.5;
      const wx = mx * ca - my * sa;
      const wy = mx * sa + my * ca;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const len = hypot(dx, dy);
      shards.push({
        x: rock.x + wx,
        y: rock.y + wy,
        vx: rock.vx * 0.4 + wx * rand(2.2, 4.8) + rand(-40, 40),
        vy: rock.vy * 0.4 + wy * rand(2.2, 4.8) + rand(-40, 40),
        ang: Math.atan2(dy, dx) + rock.ang,
        spin: rand(-5, 5),
        len: Math.max(4, len),
        life: rand(0.32, 0.58),
        max: 0.58,
        rgb: rock.rgb
      });
    }
    capArr(shards, 80);
  }

  function bustRock(rock, scored) {
    if (!rock.alive) return;
    rock.alive = false;
    const spec = ROCK[rock.size];
    const stop = rock.size === 0 ? 0.074 : rock.size === 1 ? 0.052 : 0.034;
    audio.bust(rock.size);
    hitStop(stop + (G.mult > 2 ? 0.012 : 0));
    kick(rock.size === 0 ? 4.4 : rock.size === 1 ? 2.7 : 1.5);
    screenFlash(spec.rgb, rock.size === 0 ? 0.48 : 0.28);
    popSpark(rock.x, rock.y, spec.rgb, rock.r * 0.95);
    popRing(rock.x, rock.y, spec.rgb, rock.r * 0.32);
    emitShards(rock);
    emit(12 + (2 - rock.size) * 8, {
      x: rock.x, y: rock.y, j: rock.r * 0.42,
      vx0: -210, vx1: 210, vy0: -210, vy1: 210,
      r0: 1.1, r1: rock.size === 0 ? 4.2 : 2.6, life: 0.42 + (2 - rock.size) * 0.08,
      rgb: spec.rgb, g: 0
    });
    if (scored && G.mode === 'play') {
      bumpCombo();
      const pts = spec.score * G.mult;
      addScore(pts);
      popFloat(rock.x, rock.y - 8, '+' + pts, spec.rgb, G.mult > 1);
      maybeDrop(rock.x, rock.y, rock.size);
    }
    if (spec.next >= 0) {
      const base = Math.atan2(rock.vy, rock.vx);
      for (let k = 0; k < spec.kids; k++) {
        const kickA = base + (k === 0 ? 1 : -1) * rand(0.65, 1.4);
        const spd = rand(ROCK[spec.next].spd0, ROCK[spec.next].spd1) * (isSwarm() ? 1.14 : 1);
        const child = spawnRock(
          spec.next,
          rock.x + Math.cos(kickA) * 10,
          rock.y + Math.sin(kickA) * 10,
          Math.cos(kickA) * spd + rock.vx * 0.3,
          Math.sin(kickA) * spd + rock.vy * 0.3
        );
        pendingRocks.push(child);
      }
    }
  }

  function updatePlayer(dt) {
    const s = G.ship;
    const f = form();
    if (G.deadT <= 0) {
      if (keys.l) s.ang -= f.rot * dt;
      if (keys.r) s.ang += f.rot * dt;
      if (keys.u) {
        s.vx += Math.sin(s.ang) * f.thrust * dt;
        s.vy -= Math.cos(s.ang) * f.thrust * dt;
        G.thrustT -= dt;
        if (G.thrustT <= 0) {
          G.thrustT = 0.07;
          audio.thrust();
        }
        const bx = s.x - Math.sin(s.ang) * (f.nose * 0.85);
        const by = s.y + Math.cos(s.ang) * (f.nose * 0.85);
        const flame = G.form === 0 ? CYN : G.form === 2 ? MAG : GOLD;
        const flame2 = G.form === 0 ? WHT : G.form === 2 ? GOLD : CYN;
        emit(2, {
          x: bx, y: by, j: 1.4,
          vx0: -Math.sin(s.ang) * 50 + s.vx * 0.2, vx1: -Math.sin(s.ang) * 150 + s.vx * 0.2,
          vy0: Math.cos(s.ang) * 50 + s.vy * 0.2, vy1: Math.cos(s.ang) * 150 + s.vy * 0.2,
          r0: 1.1, r1: G.form === 2 ? 3.2 : 2.6, life: 0.2, rgb: Math.random() < 0.45 ? flame : flame2, g: 0
        });
      }
      if (keys.fire) fire();
    }
    const spd = hypot(s.vx, s.vy);
    if (spd > f.maxV) {
      s.vx *= f.maxV / spd;
      s.vy *= f.maxV / spd;
    }
    const drag = Math.exp(-f.drag * dt);
    s.vx *= drag;
    s.vy *= drag;
    s.x = wrap(s.x + s.vx * dt, VW);
    s.y = wrap(s.y + s.vy * dt, VH);
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.morphCd = Math.max(0, G.morphCd - dt);
    G.morphFlash = Math.max(0, G.morphFlash - dt);
    G.morphGhost = Math.max(0, G.morphGhost - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    G.pup.rapid = Math.max(0, G.pup.rapid - dt);
    G.pup.spread = Math.max(0, G.pup.spread - dt);
    G.pup.pierce = Math.max(0, G.pup.pierce - dt);
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
        if (s.trail.length > 6) s.trail.shift();
      }
      const nx = wrap(s.x + s.vx * dt, VW);
      const ny = wrap(s.y + s.vy * dt, VH);
      if (Math.abs(nx - s.x) > VW * 0.5 || Math.abs(ny - s.y) > VH * 0.5) s.trail = [];
      s.x = nx;
      s.y = ny;
      if (s.life <= 0) {
        if (s.from === 'ship' && G.mode === 'play') {
          G.comboT = Math.min(G.comboT, 0.16);
        }
        G.shots.splice(i, 1);
      }
    }
  }

  function updatePups(dt) {
    for (let i = G.pups.length - 1; i >= 0; i--) {
      const p = G.pups[i];
      p.life -= dt;
      p.bob += dt * 4.2;
      p.x = wrap(p.x + p.vx * dt, VW);
      p.y = wrap(p.y + p.vy * dt, VH);
      const drag = Math.exp(-0.4 * dt);
      p.vx *= drag;
      p.vy *= drag;
      if (p.life <= 0) {
        G.pups.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        const w = wrapDist(G.ship.x, G.ship.y, p.x, p.y);
        if (w.d < shipR() + p.r + 6) takePup(p);
      }
    }
  }

  function updateMuks(dt) {
    if (G.mode === 'play' && G.deadT <= 0 && G.waveWait <= 0) {
      if (mukCount() < mukCap()) {
        G.mukWait -= dt;
        if (G.mukWait <= 0) spawnMukNow();
      }
    }
    if (pendingMuks.length) {
      for (let i = 0; i < pendingMuks.length; i++) G.muks.push(pendingMuks[i]);
      pendingMuks.length = 0;
    }
    for (let i = G.muks.length - 1; i >= 0; i--) {
      const m = G.muks[i];
      if (!m.alive) {
        G.muks.splice(i, 1);
        continue;
      }
      m.ph += dt * (2.4 + m.size * 0.4);
      const seek = (isSwarm() ? 42 : 20) * (1 + m.size * 0.12);
      if (G.mode === 'play' && G.deadT <= 0) {
        const w = wrapDist(G.ship.x, G.ship.y, m.x, m.y);
        if (w.d > 1) {
          m.vx += (w.dx / w.d) * seek * dt;
          m.vy += (w.dy / w.d) * seek * dt;
        }
      }
      m.vx += Math.sin(m.ph * 1.3) * 18 * dt;
      m.vy += Math.cos(m.ph * 0.9) * 18 * dt;
      const cap = MUK[m.size].spd * (isSwarm() ? 1.28 : 1) * (1 + (G.wave - 1) * 0.04);
      const spd = hypot(m.vx, m.vy);
      if (spd > cap) {
        m.vx *= cap / spd;
        m.vy *= cap / spd;
      }
      m.x = wrap(m.x + m.vx * dt, VW);
      m.y = wrap(m.y + m.vy * dt, VH);
      m.tick -= dt;
      if (m.tick <= 0) {
        m.tick = rand(0.55, 1.05);
        if (G.mode === 'play') audio.mukTick();
      }
      if (isSwarm() && m.size === 2) {
        m.drip -= dt;
        if (m.drip <= 0 && mukCount() < mukCap()) {
          m.drip = rand(7, 13);
          pendingMuks.push(spawnMuk(0, m.x, m.y, rand(-40, 40), rand(-40, 40)));
        }
      }
      for (let p = G.pups.length - 1; p >= 0; p--) {
        const pup = G.pups[p];
        if (wrapDist(m.x, m.y, pup.x, pup.y).d < m.r + pup.r) {
          G.pups.splice(p, 1);
          growMuk(m);
          audio.mukHit();
          emit(8, {
            x: m.x, y: m.y, j: 4,
            vx0: -80, vx1: 80, vy0: -80, vy1: 80,
            r0: 1, r1: 2.2, life: 0.28, rgb: pup.rgb, g: 0
          });
        }
      }
      for (let k = 0; k < G.rocks.length; k++) {
        const r = G.rocks[k];
        if (!r.alive) continue;
        const w = wrapDist(m.x, m.y, r.x, r.y);
        if (w.d < m.r + r.r * 0.82) {
          if (r.size === 2) {
            bustRock(r, false);
            growMuk(m);
            audio.mukHit();
          } else {
            const nx = w.d < 0.001 ? 1 : w.dx / w.d;
            const ny = w.d < 0.001 ? 0 : w.dy / w.d;
            m.vx += nx * 40;
            m.vy += ny * 40;
            r.vx -= nx * 18;
            r.vy -= ny * 18;
          }
        }
      }
    }
    for (let i = 0; i < G.muks.length; i++) {
      const a = G.muks[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < G.muks.length; j++) {
        const b = G.muks[j];
        if (!b.alive) continue;
        const w = wrapDist(a.x, a.y, b.x, b.y);
        if (w.d < a.r + b.r * 0.72) {
          if (a.size === b.size && a.size < 2) {
            a.x = wrap(a.x + wrapDelta(b.x, a.x, VW) * 0.5, VW);
            a.y = wrap(a.y + wrapDelta(b.y, a.y, VH) * 0.5, VH);
            a.vx = (a.vx + b.vx) * 0.5;
            a.vy = (a.vy + b.vy) * 0.5;
            growMuk(a);
            b.alive = false;
            audio.mukHit();
            popRing(a.x, a.y, LIME, 12);
          } else {
            const nx = w.d < 0.001 ? 1 : w.dx / w.d;
            const ny = w.d < 0.001 ? 0 : w.dy / w.d;
            a.vx += nx * 28;
            a.vy += ny * 28;
            b.vx -= nx * 28;
            b.vy -= ny * 28;
          }
        }
      }
    }
  }

  function collide() {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (!s) continue;
      let consumed = false;
      if (s.from === 'ship') {
        for (let u = 0; u < G.muks.length; u++) {
          const m = G.muks[u];
          if (!m.alive) continue;
          const w = wrapDist(s.x, s.y, m.x, m.y);
          if (w.d < m.r + 4 + s.wide) {
            audio.mukHit();
            hitStop(0.034);
            kick(1.8);
            popSpark(s.x, s.y, LIME, 10);
            emit(6, {
              x: s.x, y: s.y, j: 2,
              vx0: -90, vx1: 90, vy0: -90, vy1: 90,
              r0: 1, r1: 2, life: 0.22, rgb: LIME, g: 0
            });
            m.hp -= s.power;
            if (m.hp <= 0) {
              killMuk(m, s.power, true);
            }
            if (s.pierce > 0) {
              s.pierce -= 1;
            } else {
              G.shots.splice(i, 1);
              consumed = true;
            }
            break;
          }
        }
      }
      if (consumed) continue;
      for (let k = 0; k < G.rocks.length; k++) {
        const r = G.rocks[k];
        if (!r.alive) continue;
        const w = wrapDist(s.x, s.y, r.x, r.y);
        if (w.d < r.r + 3 + (s.wide || 0) * 0.3) {
          bustRock(r, s.from === 'ship');
          let keep = false;
          if (s.from === 'ship') {
            if (r.size === 2 && s.power >= 4) keep = true;
            else if (s.pierce > 0) {
              s.pierce -= 1;
              keep = true;
            }
          }
          if (!keep) G.shots.splice(i, 1);
          consumed = true;
          break;
        }
      }
      if (consumed) continue;
    }

    if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
      const sr = shipR();
      for (let k = 0; k < G.rocks.length; k++) {
        const r = G.rocks[k];
        if (!r.alive) continue;
        const w = wrapDist(G.ship.x, G.ship.y, r.x, r.y);
        if (w.d < r.r + sr) {
          killShip();
          break;
        }
      }
      if (G.deadT <= 0 && G.invuln <= 0) {
        for (let u = 0; u < G.muks.length; u++) {
          const m = G.muks[u];
          if (!m.alive) continue;
          const w = wrapDist(G.ship.x, G.ship.y, m.x, m.y);
          if (w.d < m.r + sr) {
            killShip();
            break;
          }
        }
      }
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
  }

  function playSim(dt) {
    if (G.ready > 0) G.ready -= dt;
    updatePlayer(dt);
    updateRocks(dt);
    updateShots(dt);
    updatePups(dt);
    updateMuks(dt);
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
        G.form = 1;
        if (!spawnClear(G.ship.x, G.ship.y, 72)) {
          G.deadT = 0.32;
          return;
        }
        G.invuln = 1.85;
        toast('剩余 ' + G.lives + ' 命', true, false);
        syncHud();
      }
    }

    if (G.mode === 'play' && G.deadT <= 0 && rockCount() === 0 && pendingRocks.length === 0) {
      if (G.waveWait <= 0) G.waveWait = 0.82;
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
      G.demoMorph -= dt;
      if (G.demoMorph <= 0) {
        G.demoMorph = 2.55;
        G.prevForm = G.form;
        G.form = (G.form + 1) % 3;
        G.morphFlash = 0.22;
        G.morphGhost = 0.2;
        popRing(G.ship.x, G.ship.y, form().rgb, 8);
        syncHud();
      }
      G.morphFlash = Math.max(0, G.morphFlash - dt);
      G.morphGhost = Math.max(0, G.morphGhost - dt);
      updateRocks(dt);
      updateMuks(dt * 0.6);
      updatePups(dt);
      if (rockCount() < 5) G.rocks.push(placeEdgeRock((Math.random() * 3) | 0));
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose') {
      updateRocks(dt);
      updateShots(dt);
      updateMuks(dt);
      updatePups(dt);
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
    g.addColorStop(0, '#052028');
    g.addColorStop(0.5, '#03141c');
    g.addColorStop(1, '#020c12');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(400), sy(240), 30 * scale, sx(400), sy(240), 420 * scale);
    vg.addColorStop(0, 'rgba(125, 255, 106, 0.035)');
    vg.addColorStop(0.45, 'rgba(0, 232, 255, 0.045)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.save();
    ctx.strokeStyle = 'rgba(78, 200, 255, 0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(sx(18), sy(14), (VW - 36) * scale, (VH - 28) * scale);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(125, 255, 106, 0.04)';
    ctx.beginPath();
    ctx.moveTo(sx(VW * 0.5), sy(14));
    ctx.lineTo(sx(VW * 0.5), sy(VH - 14));
    ctx.moveTo(sx(18), sy(VH * 0.5));
    ctx.lineTo(sx(VW - 18), sy(VH * 0.5));
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = REDUCE ? s.a : s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)));
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
    ctx.strokeStyle = rgba(rgb, glow ? 0.2 : 1);
    ctx.lineWidth = (glow ? 5 : 1.35) * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  }

  function drawRocks() {
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      forWrap(r.x, r.y, r.r, function (x, y) {
        drawPoly(x, y, r.ang, r.pts, r.rgb, true);
        drawPoly(x, y, r.ang, r.pts, r.rgb, false);
        ctx.save();
        ctx.translate(sx(x), sy(y));
        ctx.rotate(r.ang);
        ctx.beginPath();
        ctx.moveTo(r.pts[0][0] * 0.35 * scale, r.pts[0][1] * 0.35 * scale);
        ctx.lineTo(r.pts[(r.pts.length / 2) | 0][0] * 0.28 * scale, r.pts[(r.pts.length / 2) | 0][1] * 0.28 * scale);
        ctx.strokeStyle = rgba(r.rgb, 0.35);
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
        ctx.restore();
      });
    }
  }

  function pathForm(kind, sc) {
    if (kind === 0) {
      ctx.beginPath();
      ctx.moveTo(0, -17 * sc);
      ctx.lineTo(4.2 * sc, 2 * sc);
      ctx.lineTo(6.2 * sc, 11 * sc);
      ctx.lineTo(0, 6.2 * sc);
      ctx.lineTo(-6.2 * sc, 11 * sc);
      ctx.lineTo(-4.2 * sc, 2 * sc);
      ctx.closePath();
    } else if (kind === 2) {
      ctx.beginPath();
      ctx.moveTo(0, -13 * sc);
      ctx.lineTo(7.5 * sc, -3 * sc);
      ctx.lineTo(13.5 * sc, 12 * sc);
      ctx.lineTo(4.2 * sc, 7.5 * sc);
      ctx.lineTo(0, 10 * sc);
      ctx.lineTo(-4.2 * sc, 7.5 * sc);
      ctx.lineTo(-13.5 * sc, 12 * sc);
      ctx.lineTo(-7.5 * sc, -3 * sc);
      ctx.closePath();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -14 * sc);
      ctx.lineTo(9.8 * sc, 12 * sc);
      ctx.lineTo(0, 6.5 * sc);
      ctx.lineTo(-9.8 * sc, 12 * sc);
      ctx.closePath();
    }
  }

  function drawShipShape(x, y, ang, thrusting, ghost, kind) {
    const f = FORMS[kind];
    const rgb = ghost ? f.rgb : (G.morphFlash > 0 ? WHT : f.rgb);
    const a = ghost ? 0.28 : 1;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    pathForm(kind, scale);
    ctx.strokeStyle = rgba(rgb, ghost ? 0.18 : 0.22);
    ctx.lineWidth = 5 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    pathForm(kind, scale);
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = (kind === 2 ? 1.85 : 1.55) * scale;
    ctx.stroke();
    if (kind === 2 && !ghost) {
      ctx.beginPath();
      ctx.moveTo(-5.2 * scale, -4 * scale);
      ctx.lineTo(-5.2 * scale, -9 * scale);
      ctx.moveTo(5.2 * scale, -4 * scale);
      ctx.lineTo(5.2 * scale, -9 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
    }
    if (kind === 0 && !ghost) {
      ctx.beginPath();
      ctx.moveTo(0, -8 * scale);
      ctx.lineTo(0, 2 * scale);
      ctx.strokeStyle = rgba(WHT, 0.55);
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
    }
    if (thrusting && !ghost) {
      const flick = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(G.t * 42));
      const len = kind === 0 ? 20 : kind === 2 ? 12 : 16;
      const flame = kind === 0 ? CYN : kind === 2 ? MAG : GOLD;
      const flame2 = kind === 0 ? WHT : kind === 2 ? GOLD : CYN;
      ctx.beginPath();
      ctx.moveTo(-4.6 * scale, 8 * scale);
      ctx.lineTo(0, (len + 7 * flick) * scale);
      ctx.lineTo(4.6 * scale, 8 * scale);
      ctx.strokeStyle = rgba(flame, 0.9 * flick);
      ctx.lineWidth = (kind === 2 ? 2.2 : 1.5) * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-2.2 * scale, 8 * scale);
      ctx.lineTo(0, (len * 0.7 + 4 * flick) * scale);
      ctx.lineTo(2.2 * scale, 8 * scale);
      ctx.strokeStyle = rgba(flame2, 0.7 * flick);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShield(x, y) {
    if (G.shield <= 0 || G.deadT > 0) return;
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 6);
    ctx.save();
    ctx.strokeStyle = rgba(ICE, 0.22 + 0.2 * pulse);
    ctx.lineWidth = 4.5 * scale;
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), (shipR() + 8 + pulse * 2) * scale, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(CYN, 0.7);
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), (shipR() + 8 + pulse * 2) * scale, 0, TAU);
    ctx.stroke();
    if (G.shield > 1) {
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), (shipR() + 12 + pulse) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    const s = G.ship;
    const thrusting = G.mode === 'play' && keys.u;
    const ghost = G.mode === 'title';
    const rad = shipR() + 18;
    if (G.morphGhost > 0) {
      forWrap(s.x, s.y, rad, function (x, y) {
        drawShipShape(x, y, s.ang, false, true, G.prevForm);
      });
    }
    forWrap(s.x, s.y, rad, function (x, y) {
      if (G.morphFlash > 0 && !REDUCE) {
        ctx.save();
        ctx.strokeStyle = rgba(form().rgb, G.morphFlash * 1.4);
        ctx.lineWidth = 2.2 * scale;
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), (18 + (0.28 - G.morphFlash) * 70) * scale, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      drawShipShape(x, y, s.ang, thrusting, ghost, G.form);
      drawShield(x, y);
    });
  }

  function drawMukBlob(x, y, m) {
    const n = 10 + m.size * 2;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * TAU;
      const wob = 0.76 + 0.24 * Math.sin(G.t * 3.4 + i * 1.7 + m.ph);
      const px = Math.cos(a) * m.r * wob * scale;
      const py = Math.sin(a) * m.r * wob * 0.86 * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(LIME, 0.18);
    ctx.lineWidth = 5 * scale;
    ctx.stroke();
    ctx.strokeStyle = rgba(MUK[m.size].rgb, 0.95);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();
    ctx.fillStyle = rgba(LIME, 0.07);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-m.r * 0.22 * scale, -m.r * 0.18 * scale, Math.max(2, m.r * 0.18) * scale, 0, TAU);
    ctx.strokeStyle = rgba(WHT, 0.55);
    ctx.lineWidth = 1.1 * scale;
    ctx.stroke();
    ctx.restore();
  }

  function drawMuks() {
    for (let i = 0; i < G.muks.length; i++) {
      const m = G.muks[i];
      if (!m.alive) continue;
      forWrap(m.x, m.y, m.r + 10, function (x, y) {
        drawMukBlob(x, y, m);
      });
    }
  }

  function drawPups() {
    for (let i = 0; i < G.pups.length; i++) {
      const p = G.pups[i];
      const blink = p.life < 1.6 ? ((G.t * 8) | 0) % 2 === 0 : false;
      if (blink) continue;
      const bob = Math.sin(p.bob) * 3;
      forWrap(p.x, p.y + bob, 14, function (x, y) {
        ctx.save();
        ctx.translate(sx(x), sy(y));
        ctx.rotate(p.bob * 0.35);
        ctx.beginPath();
        ctx.moveTo(0, -8 * scale);
        ctx.lineTo(8 * scale, 0);
        ctx.lineTo(0, 8 * scale);
        ctx.lineTo(-8 * scale, 0);
        ctx.closePath();
        ctx.strokeStyle = rgba(p.rgb, 0.22);
        ctx.lineWidth = 4.2 * scale;
        ctx.stroke();
        ctx.strokeStyle = rgba(p.rgb, 1);
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();
        ctx.fillStyle = rgba(p.rgb, 0.18);
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.fillStyle = rgba(p.rgb, 0.95);
        ctx.font = '700 ' + (8 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.name.charAt(0), sx(x), sy(y));
        ctx.restore();
      });
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const rgb = s.rgb || WHT;
      const spd = hypot(s.vx, s.vy) || 1;
      const dx = s.vx / spd;
      const dy = s.vy / spd;
      const len = 4.2 + (s.wide || 1) * 1.4;
      if (s.trail && !REDUCE) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          ctx.strokeStyle = rgba(rgb, 0.08 + t * 0.07);
          ctx.lineWidth = (s.wide * 0.45 + t * 0.12) * scale;
          ctx.beginPath();
          ctx.moveTo(sx(p.x - dx * 3), sy(p.y - dy * 3));
          ctx.lineTo(sx(p.x + dx * 3), sy(p.y + dy * 3));
          ctx.stroke();
        }
      }
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = (s.wide || 1.6) * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(s.x - dx * len), sy(s.y - dy * len));
      ctx.lineTo(sx(s.x + dx * len), sy(s.y + dy * len));
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
    ctx.fillStyle = '#020c12';
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
    drawMuks();
    drawPups();
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
    if (G.mode === 'title') startGame('belt');
    else startGame(G.kind || 'belt');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('belt');
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
    const morphKey = code === 'KeyC';
    const space = code === 'Space' || k === ' ';
    if (down && (left || right || up || morphKey || space || k === 'Enter')) e.preventDefault();

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
    if (morphKey) {
      if (G.mode === 'play' || G.mode === 'title') morph();
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
      startGame('belt');
    }
    if ((k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') {
      startGame('swarm');
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
    holdPad(padMorph, function () { morph(); }, null);
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

  if (btnBelt) {
    btnBelt.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('belt');
    });
  }
  if (btnSwarm) {
    btnSwarm.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('swarm');
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
