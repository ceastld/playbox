'use strict';

(function () {
  const VW = 800;
  const VH = 480;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GX = 8;
  const GRAV_SOFT = 36;
  const GRAV_HARD = 44;
  const THRUST = 98;
  const BURST = 164;
  const ROT = 2.5;
  const MAX_V = 260;
  const FUEL_SOFT = 120;
  const FUEL_HARD = 68;
  const FUEL_USE = 12;
  const FUEL_BURST_USE = 28;
  const LEG_X = 11;
  const LEG_Y = 13;
  const NOSE = 11;
  const LAND_VY = 40;
  const LAND_VX = 34;
  const LAND_ANG = 0.22;
  const GOOD_VY = 22;
  const GOOD_VX = 18;
  const GOOD_ANG = 0.12;
  const PERF_VY = 14;
  const PERF_VX = 10;
  const PERF_ANG = 0.055;
  const EXTRA_LIFE = 10000;
  const LAND_WAIT = 1.55;
  const DEAD_WAIT = 1.22;
  const BEST_KEY = 'playbox-lunar-land-best';
  const MUTE_KEY = 'playbox-lunar-land-mute';
  const OPS = 'A D / ← → 转向 · W / ↑ 推进 · 空格加力';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 180, 40];
  const AMB = [255, 140, 26];
  const WHT = [255, 244, 224];
  const DUST = [196, 148, 88];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnSoft = document.getElementById('btn-soft');
  const btnHard = document.getElementById('btn-hard');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const altLabel = document.getElementById('alt-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');
  const padCcw = document.getElementById('pad-ccw');
  const padCw = document.getElementById('pad-cw');
  const padThrust = document.getElementById('pad-thrust');
  const padBurst = document.getElementById('pad-burst');
  const fuelWrap = document.getElementById('fuel-wrap');
  const fuelBar = document.getElementById('fuel-bar');
  const fuelNum = document.getElementById('fuel-num');

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

  const keys = { l: false, r: false, u: false, burst: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const shards = [];
  const stars = [];
  const dusts = [];

  const G = {
    mode: 'title',
    kind: 'soft',
    t: 0,
    crater: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    streak: 0,
    fuel: FUEL_SOFT,
    fuelMax: FUEL_SOFT,
    nextLife: EXTRA_LIFE,
    ship: { x: VW * 0.5, y: 56, vx: 0, vy: 12, ang: 0 },
    ground: [],
    pads: [],
    cam: { x: VW * 0.5, y: VH * 0.5, z: 1 },
    deadT: 0,
    landT: 0,
    landPad: null,
    landGrade: '',
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    toastT: 0,
    thrustT: 0,
    warnT: 0,
    dustT: 0,
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function wrapAng(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function isHard() {
    return G.kind === 'hard';
  }
  function gravity() {
    return (isHard() ? GRAV_HARD : GRAV_SOFT) + Math.max(0, G.crater - 1) * 1.15;
  }
  function fuelMax() {
    return isHard() ? FUEL_HARD : FUEL_SOFT;
  }

  function makeRng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function worldFromLocal(s, lx, ly) {
    const ca = Math.cos(s.ang);
    const sa = Math.sin(s.ang);
    return {
      x: s.x + lx * ca + ly * (-sa),
      y: s.y + lx * sa + ly * ca
    };
  }

  function sx(x) {
    return ox + (VW * 0.5 + (x - G.cam.x) * G.cam.z) * scale;
  }
  function sy(y) {
    return oy + (VH * 0.5 + (y - G.cam.y) * G.cam.z) * scale;
  }
  function ss(n) {
    return n * scale * G.cam.z;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
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
    beep(freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
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
    noise(dur, vol, hp, delay) {
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
      f.frequency.value = hp || 400;
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime + (delay || 0);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    thrust(burst) {
      this.ensure();
      this.noise(burst ? 0.07 : 0.05, burst ? 0.028 : 0.016, burst ? 180 : 260);
      this.beep(burst ? 92 : 64, burst ? 0.07 : 0.05, 'sawtooth', burst ? 0.022 : 0.012, burst ? 48 : 36);
    },
    land(mult, perfect) {
      this.ensure();
      const notes = [523, 659, 784, 1046];
      const n = Math.min(4, Math.max(2, mult));
      for (let i = 0; i < n; i++) {
        this.beep(notes[i], 0.12, i % 2 ? 'triangle' : 'sine', 0.042, notes[i] * 1.01, i * 0.07);
      }
      if (perfect) this.beep(1318, 0.22, 'sine', 0.038, 1760, n * 0.07);
      this.noise(0.08, 0.022, 500);
    },
    crash() {
      this.ensure();
      this.noise(0.22, 0.08, 180);
      this.beep(220, 0.28, 'sawtooth', 0.055, 48);
      this.beep(110, 0.36, 'sine', 0.046, 36);
    },
    warn() {
      this.ensure();
      this.beep(880, 0.06, 'square', 0.028, 420);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.1, 'triangle', 0.038, 1046);
      this.beep(1046, 0.18, 'sine', 0.042, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.038, 80);
      this.beep(110, 0.32, 'sine', 0.046, 42);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.038, 523);
      this.beep(523, 0.1, 'triangle', 0.032, 784);
      this.beep(784, 0.16, 'sine', 0.034, 1046);
    },
    next() {
      this.ensure();
      this.beep(440, 0.07, 'sine', 0.03, 660);
      this.beep(660, 0.12, 'triangle', 0.032, 880);
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
      toast('额外登月舱', false, true);
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

  function terrainY(x) {
    const pts = G.ground;
    if (!pts || pts.length < 2) return VH;
    if (x <= pts[0].x) return pts[0].y;
    if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].y;
    const i = clamp((x / GX) | 0, 0, pts.length - 2);
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x || 1;
    const t = (x - a.x) / dx;
    return a.y + (b.y - a.y) * t;
  }

  function padAt(x, slack) {
    const pads = G.pads;
    const s = slack == null ? 2.5 : slack;
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (x >= p.x0 - s && x <= p.x1 + s) return p;
    }
    return null;
  }

  function altitude() {
    return terrainY(G.ship.x) - G.ship.y - LEG_Y;
  }

  function generateTerrain() {
    const rng = makeRng(0xC0FFEE ^ (G.crater * 7919) ^ (isHard() ? 0xA11 : 0x5EED));
    const count = (VW / GX) | 0;
    const ground = [];
    const jag = 16 + G.crater * 5 + (isHard() ? 12 : 0);
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const x = i * GX;
      let y = 372
        + Math.sin(t * Math.PI * 2.15 + rng() * 6) * 26
        + Math.sin(t * Math.PI * 5.4 + rng() * 4) * (12 + G.crater)
        + (rng() - 0.5) * jag;
      const edge = Math.max(0, 0.09 - Math.min(t, 1 - t));
      y -= (edge / 0.09) * (108 + G.crater * 8);
      ground.push({ x: x, y: clamp(y, 196, 458) });
    }

    const shrink = Math.pow(0.935, G.crater - 1) * (isHard() ? 0.7 : 1);
    const want = [];
    if (!isHard() || G.crater === 1) want.push({ mult: 1, w: Math.max(52, 102 * shrink) });
    want.push({ mult: 2, w: Math.max(38, 66 * shrink) });
    want.push({ mult: 3, w: Math.max(28, 46 * shrink) });
    if (isHard() || G.crater >= 2) want.push({ mult: 5, w: Math.max(26, 34 * shrink) });

    const pads = [];
    const used = [];
    function fits(x0, x1) {
      if (x0 < 40 || x1 > VW - 40) return false;
      for (let u = 0; u < used.length; u++) {
        if (!(x1 < used[u][0] - 42 || x0 > used[u][1] + 42)) return false;
      }
      return true;
    }

    for (let k = 0; k < want.length; k++) {
      const spec = want[k];
      let placed = false;
      for (let attempt = 0; attempt < 28 && !placed; attempt++) {
        const w = spec.w;
        const raw0 = 48 + rng() * (VW - 96 - w);
        let i0 = clamp(Math.round(raw0 / GX), 5, count - 8);
        let i1 = clamp(i0 + Math.max(3, Math.round(w / GX)), i0 + 3, count - 5);
        const x0 = ground[i0].x;
        const x1 = ground[i1].x;
        if (!fits(x0, x1)) continue;
        let sum = 0;
        let n = 0;
        for (let i = i0; i <= i1; i++) {
          sum += ground[i].y;
          n += 1;
        }
        let y = n ? sum / n : 380;
        if (spec.mult >= 3) y -= 10 + spec.mult * 1.4;
        y = clamp(y, 250, 442);
        for (let i = i0; i <= i1; i++) ground[i].y = y;
        if (spec.mult >= 3) {
          const drop = 16 + spec.mult * 3.2;
          for (let i = Math.max(1, i0 - 4); i < i0; i++) {
            const u = (i0 - i) / 4;
            ground[i].y = Math.min(458, lerp(y, ground[i].y + drop, u));
          }
          for (let i = i1 + 1; i <= Math.min(count, i1 + 4); i++) {
            const u = (i - i1) / 4;
            ground[i].y = Math.min(458, lerp(y, ground[i].y + drop, u));
          }
        }
        pads.push({
          x0: x0,
          x1: x1,
          y: y,
          mult: spec.mult,
          pulse: rng() * TAU
        });
        used.push([x0, x1]);
        placed = true;
      }
    }

    if (!pads.length) {
      const i0 = 40;
      const i1 = 52;
      const y = 390;
      for (let i = i0; i <= i1; i++) ground[i].y = y;
      pads.push({ x0: ground[i0].x, x1: ground[i1].x, y: y, mult: 2, pulse: 0 });
    }

    pads.sort(function (a, b) { return a.x0 - b.x0; });
    G.ground = ground;
    G.pads = pads;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 78; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH * 0.72,
        r: Math.random() < 0.18 ? 1.35 : 0.7,
        a: 0.25 + Math.random() * 0.7,
        tw: Math.random() * TAU
      });
    }
  }

  function spawnLander(drift) {
    const rngx = 0.28 + Math.random() * 0.44;
    G.ship.x = VW * rngx;
    G.ship.y = 48 + Math.random() * 10;
    G.ship.vx = drift ? rand(-18, 18) : rand(-22, 22);
    G.ship.vy = drift ? rand(6, 14) : rand(8, 16);
    G.ship.ang = drift ? rand(-0.12, 0.12) : rand(-0.18, 0.18);
    G.deadT = 0;
    G.landT = 0;
    G.landPad = null;
    G.landGrade = '';
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    shards.length = 0;
    dusts.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.thrustT = 0;
    G.warnT = 0;
    G.dustT = 0;
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE) return;
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
    G.flash = Math.max(G.flash, a);
    G.flashRgb = rgb;
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
    capArr(particles, 220);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, rgb: rgb, rad: rad, t: 0 });
    capArr(sparks, 28);
  }

  function popRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, rgb: rgb, r: r, t: 0 });
    capArr(rings, 18);
  }

  function popFloat(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb, gold: !!gold,
      t: 0, life: 0.95, size: gold ? 16 : 13
    });
    capArr(floats, 16);
  }

  function emitDust(x, y, n, boost) {
    const k = boost || 1;
    for (let i = 0; i < n; i++) {
      dusts.push({
        x: x + rand(-6, 6),
        y: y + rand(-2, 1),
        vx: rand(-48, 48) * k,
        vy: rand(-70, -18) * k,
        r: rand(1.2, 3.2) * k,
        life: rand(0.28, 0.62),
        max: 0.62,
        rgb: Math.random() < 0.35 ? GOLD : DUST
      });
    }
    capArr(dusts, 90);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '陨坑';
      else stageLabel.textContent = '陨坑 ' + G.crater;
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.crater >= 4);
    }
    if (tagLabel) {
      tagLabel.textContent = isHard() ? '绝境' : '软着陆';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.streak >= 3);
    }
    const alt = Math.max(0, altitude());
    const s = G.ship;
    const dang = Math.abs(wrapAng(s.ang)) > LAND_ANG || Math.abs(s.vy) > LAND_VY || Math.abs(s.vx) > LAND_VX;
    if (altLabel) {
      altLabel.textContent = '高度 ' + Math.round(alt);
      altLabel.classList.toggle('warn', G.mode === 'play' && alt < 90 && dang);
      altLabel.classList.toggle('hot', G.mode === 'play' && alt < 90 && !dang);
    }
    const ratio = G.fuelMax > 0 ? clamp(G.fuel / G.fuelMax, 0, 1) : 0;
    if (fuelBar) fuelBar.style.transform = 'scaleX(' + ratio + ')';
    if (fuelNum) fuelNum.textContent = String(Math.max(0, Math.round(G.fuel)));
    if (fuelWrap) fuelWrap.classList.toggle('low', G.mode === 'play' && ratio <= 0.22);
    if (comboEl) {
      if (G.mode === 'play' && G.streak >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.streak;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS + ' · 轻轻落到平台上', '');
    else if (G.mode === 'lose') setHint('R 重开 · 太快或太斜都会砸碎', 'warn');
    else if (G.fuel <= 0) setHint('燃料耗尽 · 只能滑落', 'warn');
    else if (G.lives === 1) setHint('最后一舱 · 对准发光平台', 'warn');
    else setHint('← → 转向 · ↑ 推进 · 空格加力 · 平台越小倍率越高', G.streak >= 3 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showHard) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'LAND';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS + ' · R 重开 · M 静音';
    btnSoft.textContent = primary;
    btnHard.classList.toggle('hidden', !showHard);
    if (kind === 'lose') btnHard.textContent = '换模式';
    else btnHard.textContent = '绝境';
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

  function goTitle() {
    G.mode = 'title';
    G.kind = 'soft';
    G.score = 0;
    G.lives = LIVES;
    G.crater = 1;
    G.streak = 0;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    G.fuelMax = FUEL_SOFT;
    G.fuel = FUEL_SOFT;
    generateTerrain();
    spawnLander(true);
    resetFx();
    G.cam.x = VW * 0.5;
    G.cam.y = VH * 0.5;
    G.cam.z = 1;
    showOverlay(
      'title',
      '登月',
      '省着喷火，轻轻落到发光平台上。太快或太斜都会砸碎。平台越小倍率越高。',
      '软着陆',
      true
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'hard' ? 'hard' : 'soft';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.crater = 1;
    G.streak = 0;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    G.fuelMax = fuelMax();
    G.fuel = G.fuelMax;
    generateTerrain();
    spawnLander(false);
    resetFx();
    keys.burst = false;
    hideOverlay();
    audio.start();
    if (scoreEl) scoreEl.textContent = '0';
    toast(isHard() ? '绝境 · 陨坑 1' : '软着陆 · 陨坑 1', false, true);
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
      rec ? '新纪录' : '舱碎了',
      (why ? why + ' · ' : '') + '分数 ' + G.score + ' · 陨坑 ' + G.crater + (rec ? ' · 写入最高' : ''),
      '再来',
      true
    );
    syncHud();
  }

  function nextCrater() {
    G.crater += 1;
    G.fuelMax = fuelMax();
    G.fuel = G.fuelMax;
    generateTerrain();
    spawnLander(false);
    resetFx();
    audio.next();
    screenFlash(GOLD, 0.28);
    toast('陨坑 ' + G.crater + (isHard() ? ' · 绝境' : ''), false, true);
    syncHud();
  }

  function landOn(pad) {
    if (G.mode !== 'play' || G.landT > 0 || G.deadT > 0) return;
    const s = G.ship;
    const ang = Math.abs(wrapAng(s.ang));
    const avx = Math.abs(s.vx);
    const avy = Math.abs(s.vy);
    let grade = 'ok';
    if (ang <= PERF_ANG && avx <= PERF_VX && avy <= PERF_VY) grade = 'perfect';
    else if (ang <= GOOD_ANG && avx <= GOOD_VX && avy <= GOOD_VY) grade = 'good';

    s.vx = 0;
    s.vy = 0;
    s.ang = 0;
    s.y = pad.y - LEG_Y;
    s.x = clamp(s.x, pad.x0 + LEG_X + 1, pad.x1 - LEG_X - 1);
    G.landT = LAND_WAIT;
    G.landPad = pad;
    G.landGrade = grade;
    G.streak += 1;

    const gradeMul = grade === 'perfect' ? 1.6 : grade === 'good' ? 1.25 : 1;
    const streakMul = 1 + (G.streak - 1) * 0.35;
    const modeMul = isHard() ? 1.4 : 1;
    const pts = Math.round((70 + G.fuel * 1.4) * pad.mult * gradeMul * streakMul * modeMul);

    audio.land(pad.mult, grade === 'perfect');
    hitStop(0.038);
    kick(grade === 'perfect' ? 3.4 : 2.2);
    screenFlash(grade === 'perfect' ? GOLD : CYN, grade === 'perfect' ? 0.62 : 0.4);
    popRing(s.x, pad.y, GOLD, 10);
    popSpark(s.x, pad.y, GOLD, 16);
    emitDust(s.x, pad.y, 18, 1.15);
    emit(14, {
      x: s.x, y: pad.y, j: 10,
      vx0: -80, vx1: 80, vy0: -90, vy1: -10,
      r0: 1.1, r1: 2.6, life: 0.42, rgb: GOLD, g: 40
    });
    addScore(pts);
    popFloat(s.x, s.y - 18, '+' + pts, GOLD, grade === 'perfect' || pad.mult >= 3);
    const tag = grade === 'perfect' ? '完美 ×' + pad.mult : grade === 'good' ? '轻落 ×' + pad.mult : '着陆 ×' + pad.mult;
    toast(tag + (G.streak >= 2 ? '  连击' + G.streak : ''), false, true);
    syncHud();
  }

  function crashShip(why) {
    if (G.deadT > 0 || G.landT > 0) return;
    if (G.mode !== 'play') {
      spawnLander(true);
      return;
    }
    const s = G.ship;
    G.deadT = DEAD_WAIT;
    G.lives -= 1;
    G.streak = 0;
    G.why = why || '撞上月面';
    audio.crash();
    hitStop(0.072);
    kick(6.6);
    screenFlash(MAG, 0.72);
    popRing(s.x, s.y, MAG, 12);
    popSpark(s.x, s.y, HOT, 26);
    emitDust(s.x, terrainY(s.x), 22, 1.4);
    emit(36, {
      x: s.x, y: s.y, j: 6,
      vx0: -260, vx1: 260, vy0: -240, vy1: 140,
      r0: 1.2, r1: 3.8, life: 0.7, rgb: HOT, g: 18
    });
    emit(16, {
      x: s.x, y: s.y, j: 4,
      vx0: -180, vx1: 180, vy0: -200, vy1: 80,
      r0: 1, r1: 2.4, life: 0.5, rgb: MAG, g: 12
    });
    const bits = [
      [-6, -4], [6, -4], [0, -10], [-11, 12], [11, 12], [0, 6]
    ];
    for (let i = 0; i < bits.length; i++) {
      const p = worldFromLocal(s, bits[i][0], bits[i][1]);
      shards.push({
        x: p.x,
        y: p.y,
        vx: s.vx * 0.35 + rand(-120, 120),
        vy: s.vy * 0.25 + rand(-160, -20),
        ang: s.ang + rand(-0.8, 0.8),
        spin: rand(-7, 7),
        len: rand(6, 13),
        life: 0.78,
        max: 0.78,
        rgb: i % 2 ? MAG : GOLD
      });
    }
    capArr(shards, 40);
    toast(G.why, true, false);
    syncPips();
  }

  function applyThrust(dt, burst) {
    const s = G.ship;
    const use = burst ? FUEL_BURST_USE : FUEL_USE;
    if (G.fuel <= 0) return false;
    const spent = Math.min(G.fuel, use * dt);
    G.fuel -= spent;
    const k = spent / (use * dt);
    const power = (burst ? BURST : THRUST) * k;
    s.vx += Math.sin(s.ang) * power * dt;
    s.vy -= Math.cos(s.ang) * power * dt;
    const bx = s.x - Math.sin(s.ang) * 12;
    const by = s.y + Math.cos(s.ang) * 12;
    const backx = -Math.sin(s.ang);
    const backy = Math.cos(s.ang);
    emit(burst ? 3 : 2, {
      x: bx, y: by, j: burst ? 2.2 : 1.3,
      vx0: backx * 50 + s.vx * 0.2, vx1: backx * (burst ? 190 : 140) + s.vx * 0.2,
      vy0: backy * 50 + s.vy * 0.2, vy1: backy * (burst ? 190 : 140) + s.vy * 0.2,
      r0: burst ? 1.4 : 1.05, r1: burst ? 3.1 : 2.4,
      life: burst ? 0.22 : 0.16,
      rgb: burst ? (Math.random() < 0.5 ? WHT : CYN) : (Math.random() < 0.45 ? GOLD : HOT),
      g: 0
    });
    return true;
  }

  function demoPilot(dt) {
    const s = G.ship;
    const alt = altitude();
    const ang = wrapAng(s.ang);
    if (ang > 0.08) keys.l = true, keys.r = false;
    else if (ang < -0.08) keys.r = true, keys.l = false;
    else keys.l = false, keys.r = false;
    const wantUp = s.vy > 16 || alt < 86 || (Math.abs(s.vx) > 28 && Math.abs(ang) < 0.2);
    keys.u = wantUp;
    keys.burst = false;
    G.fuel = G.fuelMax;
    if (alt < 18 || s.y > VH - 20) spawnLander(true);
  }

  function updatePlayer(dt) {
    const s = G.ship;
    const playing = G.mode === 'play';
    const live = playing && G.deadT <= 0 && G.landT <= 0;
    const demo = G.mode === 'title';
    if (demo) demoPilot(dt);
    if ((live || demo) && G.deadT <= 0 && G.landT <= 0) {
      if (keys.l) s.ang -= ROT * dt;
      if (keys.r) s.ang += ROT * dt;
      s.ang = wrapAng(s.ang);
      const burst = keys.burst;
      const fire = keys.u || burst;
      if (fire) {
        const ok = applyThrust(dt, burst);
        if (ok) {
          G.thrustT -= dt;
          if (G.thrustT <= 0) {
            G.thrustT = burst ? 0.055 : 0.07;
            audio.thrust(burst);
          }
          if (burst && !REDUCE) G.punch = Math.max(G.punch, 1.012);
        } else if (playing) {
          G.warnT -= dt;
          if (G.warnT <= 0) {
            G.warnT = 0.7;
            audio.warn();
            toast('燃料耗尽', true, false);
          }
        }
      }
      const alt = altitude();
      if (fire && alt < 58) {
        G.dustT -= dt;
        if (G.dustT <= 0) {
          G.dustT = 0.05;
          const gx = s.x - Math.sin(s.ang) * 8;
          emitDust(gx, terrainY(gx), burst ? 5 : 3, burst ? 1.2 : 0.85);
        }
      }
    }

    if (G.landT > 0) return;

    if (G.deadT <= 0) {
      s.vy += gravity() * dt;
      const spd = hypot(s.vx, s.vy);
      if (spd > MAX_V) {
        s.vx *= MAX_V / spd;
        s.vy *= MAX_V / spd;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < 10) {
        s.x = 10;
        s.vx = Math.abs(s.vx) * 0.25;
        if (playing && altitude() < 70) crashShip('撞上坑壁');
      } else if (s.x > VW - 10) {
        s.x = VW - 10;
        s.vx = -Math.abs(s.vx) * 0.25;
        if (playing && altitude() < 70) crashShip('撞上坑壁');
      }
      if (s.y < -40) {
        s.y = -40;
        s.vy = Math.max(s.vy, 0);
      }
    }
  }

  function collide() {
    if (G.deadT > 0 || G.landT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    const s = G.ship;
    const samples = [
      worldFromLocal(s, 0, 0),
      worldFromLocal(s, 0, -NOSE),
      worldFromLocal(s, -LEG_X, LEG_Y),
      worldFromLocal(s, LEG_X, LEG_Y),
      worldFromLocal(s, -7, 4),
      worldFromLocal(s, 7, 4)
    ];
    let hit = false;
    let onPad = true;
    let pad = null;
    for (let i = 0; i < samples.length; i++) {
      const p = samples[i];
      const gy = terrainY(p.x);
      const pen = p.y - gy;
      if (pen >= -0.8) {
        hit = true;
        const here = padAt(p.x, 3);
        if (!here) onPad = false;
        else if (!pad) pad = here;
        else if (here !== pad) onPad = false;
      }
    }
    if (!hit) return;
    if (G.mode === 'title') {
      spawnLander(true);
      return;
    }
    const lf = samples[2];
    const rf = samples[3];
    const lp = padAt(lf.x, 4);
    const rp = padAt(rf.x, 4);
    const feetPad = !!(lp && rp && lp === rp);
    pad = pad || lp || padAt(s.x);
    const ang = Math.abs(wrapAng(s.ang));
    const avx = Math.abs(s.vx);
    const avy = Math.abs(s.vy);
    const gentle = ang <= LAND_ANG && avx <= LAND_VX && avy <= LAND_VY;
    if (onPad && feetPad && pad && gentle && s.vy >= -8) {
      landOn(pad);
      return;
    }
    if (!onPad || !feetPad || !pad) {
      crashShip('撞上月面');
      return;
    }
    if (ang > LAND_ANG) {
      crashShip('姿态太斜');
      return;
    }
    crashShip('速度太快');
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.vy += (q.g || 0) * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.life -= dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = dusts.length - 1; i >= 0; i--) {
      const q = dusts[i];
      q.vy += 48 * dt;
      q.vx *= Math.exp(-1.2 * dt);
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.life -= dt;
      if (q.life <= 0) dusts.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.vy += gravity() * 0.7 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.ang += s.spin * dt;
      s.life -= dt;
      if (s.life <= 0) shards.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= 28 * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = 0; i < G.pads.length; i++) G.pads[i].pulse += dt * 2.4;
    for (let i = 0; i < stars.length; i++) stars[i].tw += dt * 1.6;
  }

  function updateCamera(dt) {
    const s = G.ship;
    const alt = Math.max(0, altitude());
    const wantZ = alt < 120 ? lerp(1.72, 1.0, clamp(alt / 120, 0, 1)) : 1;
    const follow = wantZ > 1.04;
    const tx = follow ? s.x : VW * 0.5;
    let ty = follow ? s.y + 18 : VH * 0.5;
    const viewH = VH / Math.max(1.001, wantZ);
    ty = clamp(ty, viewH * 0.42, VH - viewH * 0.42);
    const k = 1 - Math.exp(-dt * (follow ? 6 : 3.2));
    G.cam.x = lerp(G.cam.x, tx, k);
    G.cam.y = lerp(G.cam.y, ty, k);
    G.cam.z = lerp(G.cam.z, wantZ, k);
    if (G.mode === 'title') {
      G.cam.x = lerp(G.cam.x, VW * 0.5, 0.08);
      G.cam.y = lerp(G.cam.y, VH * 0.5, 0.08);
      G.cam.z = lerp(G.cam.z, 1, 0.08);
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }
    if (G.mode === 'play' && G.landT > 0) {
      G.landT -= dt;
      updateFx(dt);
      updateCamera(dt);
      if (G.landT <= 0) nextCrater();
      syncHud();
      return;
    }
    if (G.mode === 'play' && G.deadT > 0) {
      G.deadT -= dt;
      updateFx(dt);
      updateCamera(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '舱碎了');
          return;
        }
        G.fuel = G.fuelMax;
        spawnLander(false);
        toast('再入轨', false, false);
        syncHud();
      }
      return;
    }
    if (G.mode === 'play' || G.mode === 'title') {
      updatePlayer(dt);
      collide();
    }
    updateFx(dt);
    updateCamera(dt);
    if (G.mode === 'play') {
      const s = G.ship;
      const alt = altitude();
      const dang = alt < 90 && (Math.abs(s.vy) > LAND_VY || Math.abs(s.vx) > LAND_VX || Math.abs(wrapAng(s.ang)) > LAND_ANG);
      if (dang || G.fuel / G.fuelMax <= 0.18) {
        G.warnT -= dt;
        if (G.warnT <= 0 && G.fuel > 0) {
          G.warnT = 0.85;
          if (G.fuel / G.fuelMax <= 0.18) audio.warn();
        }
      }
    }
    syncHud();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    g.addColorStop(0, '#08060a');
    g.addColorStop(0.55, '#100c08');
    g.addColorStop(1, '#1a1008');
    ctx.fillStyle = g;
    ctx.fillRect(ox - 4, oy - 4, VW * scale + 8, VH * scale + 8);

    const parx = (G.cam.x - VW * 0.5) * 0.12;
    const pary = (G.cam.y - VH * 0.5) * 0.08;
    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      const tw = 0.55 + Math.sin(st.tw) * 0.45;
      ctx.fillStyle = rgba(WHT, st.a * tw);
      ctx.beginPath();
      ctx.arc(sx(st.x - parx), sy(st.y - pary), st.r * scale, 0, TAU);
      ctx.fill();
    }

    const ex = sx(662 - parx * 0.4);
    const ey = sy(64 - pary * 0.4);
    const er = 15 * scale;
    const eg = ctx.createRadialGradient(ex - er * 0.3, ey - er * 0.3, er * 0.15, ex, ey, er);
    eg.addColorStop(0, 'rgba(180, 230, 255, 0.95)');
    eg.addColorStop(0.45, 'rgba(70, 160, 220, 0.85)');
    eg.addColorStop(1, 'rgba(30, 80, 140, 0.15)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 232, 255, 0.35)';
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
  }

  function drawTerrain() {
    const pts = G.ground;
    if (!pts.length) return;
    ctx.beginPath();
    ctx.moveTo(sx(pts[0].x), sy(VH + 20));
    ctx.lineTo(sx(pts[0].x), sy(pts[0].y));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
    ctx.lineTo(sx(pts[pts.length - 1].x), sy(VH + 20));
    ctx.closePath();
    const fill = ctx.createLinearGradient(0, sy(220), 0, sy(VH));
    fill.addColorStop(0, '#2a1c10');
    fill.addColorStop(0.5, '#16100a');
    fill.addColorStop(1, '#0a0704');
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
    ctx.strokeStyle = 'rgba(255, 180, 40, 0.85)';
    ctx.lineWidth = 2.1 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.28)';
    ctx.lineWidth = 5.5 * scale;
    ctx.stroke();
  }

  function drawPads() {
    for (let i = 0; i < G.pads.length; i++) {
      const p = G.pads[i];
      const pulse = 0.55 + Math.sin(p.pulse) * 0.45;
      const near = padAt(G.ship.x) === p && altitude() < 110;
      const rgb = p.mult >= 5 ? MAG : p.mult >= 3 ? CYN : GOLD;
      const x0 = sx(p.x0);
      const x1 = sx(p.x1);
      const y = sy(p.y);
      const w = x1 - x0;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(rgb, 0.12 + pulse * 0.16 + (near ? 0.12 : 0));
      ctx.fillRect(x0, y - ss(10), w, ss(18));
      ctx.fillStyle = rgba(rgb, 0.75 + pulse * 0.2);
      ctx.fillRect(x0, y - ss(2.2), w, ss(4.2));
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.fillRect(x0 + 1, y - ss(2.8), w - 2, ss(1.2));
      ctx.restore();
      ctx.strokeStyle = rgba(rgb, 0.9);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(x0, y - ss(7));
      ctx.lineTo(x0, y + ss(3));
      ctx.moveTo(x1, y - ss(7));
      ctx.lineTo(x1, y + ss(3));
      ctx.stroke();
      ctx.font = '700 ' + (11 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = rgba(rgb, 0.85 + pulse * 0.15);
      ctx.fillText('×' + p.mult, (x0 + x1) * 0.5, y - ss(8));
    }
  }

  function drawDropLine() {
    if (G.mode === 'lose') return;
    if (G.deadT > 0) return;
    const s = G.ship;
    const gy = terrainY(s.x);
    ctx.save();
    ctx.setLineDash([4 * scale, 5 * scale]);
    ctx.strokeStyle = rgba(GOLD, 0.22);
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(s.x), sy(s.y + LEG_Y));
    ctx.lineTo(sx(s.x), sy(gy));
    ctx.stroke();
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0 && G.mode === 'play') return;
    const s = G.ship;
    ctx.save();
    ctx.translate(sx(s.x), sy(s.y));
    ctx.rotate(s.ang);
    const k = scale * G.cam.z;

    const thrusting = (keys.u || keys.burst) && G.fuel > 0 && G.deadT <= 0 && G.landT <= 0;
    if (thrusting) {
      const burst = keys.burst;
      const flick = 10 + Math.sin(G.t * 48) * 3 + (burst ? 7 : 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(burst ? WHT : GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(-3.2 * k, 8 * k);
      ctx.lineTo(0, (8 + flick) * k);
      ctx.lineTo(3.2 * k, 8 * k);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(burst ? CYN : AMB, 0.7);
      ctx.beginPath();
      ctx.moveTo(-2 * k, 8 * k);
      ctx.lineTo(0, (8 + flick * 0.62) * k);
      ctx.lineTo(2 * k, 8 * k);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 1.7 * scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.fillStyle = 'rgba(18, 10, 4, 0.72)';
    ctx.beginPath();
    ctx.moveTo(0, -NOSE * k);
    ctx.lineTo(6.4 * k, -2 * k);
    ctx.lineTo(6.2 * k, 7.2 * k);
    ctx.lineTo(-6.2 * k, 7.2 * k);
    ctx.lineTo(-6.4 * k, -2 * k);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = rgba(CYN, 0.9);
    ctx.lineWidth = 1.25 * scale;
    ctx.beginPath();
    ctx.rect(-3.1 * k, -1.4 * k, 6.2 * k, 4.4 * k);
    ctx.stroke();

    ctx.strokeStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(-5.4 * k, 7 * k);
    ctx.lineTo(-LEG_X * k, LEG_Y * k);
    ctx.moveTo(5.4 * k, 7 * k);
    ctx.lineTo(LEG_X * k, LEG_Y * k);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 1);
    ctx.lineWidth = 2.1 * scale;
    ctx.beginPath();
    ctx.moveTo((-LEG_X - 3.2) * k, LEG_Y * k);
    ctx.lineTo((-LEG_X + 3.2) * k, LEG_Y * k);
    ctx.moveTo((LEG_X - 3.2) * k, LEG_Y * k);
    ctx.lineTo((LEG_X + 3.2) * k, LEG_Y * k);
    ctx.stroke();

    ctx.strokeStyle = rgba(AMB, 0.8);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(-3.4 * k, 7.2 * k);
    ctx.lineTo(0, 10.4 * k);
    ctx.lineTo(3.4 * k, 7.2 * k);
    ctx.stroke();
    ctx.restore();

    const spd = hypot(s.vx, s.vy);
    if (spd > 8 && G.deadT <= 0 && G.landT <= 0) {
      const danger = Math.abs(s.vy) > LAND_VY || Math.abs(s.vx) > LAND_VX;
      ctx.strokeStyle = rgba(danger ? MAG : CYN, 0.7);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x), sy(s.y));
      ctx.lineTo(sx(s.x + s.vx * 0.18), sy(s.y + s.vy * 0.18));
      ctx.stroke();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale * G.cam.z, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < dusts.length; i++) {
      const q = dusts[i];
      const a = clamp(q.life / q.max, 0, 1) * 0.7;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale * G.cam.z, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, 0.65 * (1 - k));
      ctx.lineWidth = (2.6 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * 0.35 + k * s.rad) * scale * G.cam.z, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const k = s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, 0.5 * (1 - k));
      ctx.lineWidth = (2.1 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + k * 26) * scale * G.cam.z, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const a = clamp(s.life / s.max, 0, 1);
      const hx = Math.cos(s.ang) * s.len * 0.5;
      const hy = Math.sin(s.ang) * s.len * 0.5;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(s.x - hx), sy(s.y - hy));
      ctx.lineTo(sx(s.x + hx), sy(s.y + hy));
      ctx.stroke();
    }
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
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawTelemetry() {
    if (G.mode === 'title') return;
    const s = G.ship;
    const alt = Math.max(0, altitude());
    const ang = wrapAng(s.ang);
    const rows = [
      { k: '高度', v: String(Math.round(alt)), bad: false, good: alt < 80 && Math.abs(s.vy) <= LAND_VY },
      { k: '水平', v: (s.vx >= 0 ? '+' : '') + Math.round(s.vx), bad: Math.abs(s.vx) > LAND_VX, good: Math.abs(s.vx) <= GOOD_VX },
      { k: '垂直', v: (s.vy >= 0 ? '+' : '') + Math.round(s.vy), bad: Math.abs(s.vy) > LAND_VY, good: Math.abs(s.vy) <= GOOD_VY },
      { k: '姿态', v: Math.round(ang * 180 / Math.PI) + '°', bad: Math.abs(ang) > LAND_ANG, good: Math.abs(ang) <= GOOD_ANG }
    ];
    const x = ox + 12 * scale;
    let y = oy + 16 * scale;
    ctx.save();
    ctx.font = '600 ' + (11 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textBaseline = 'top';
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      ctx.fillStyle = r.bad ? rgba(MAG, 0.95) : r.good ? rgba(GOLD, 0.95) : 'rgba(238, 224, 198, 0.78)';
      ctx.textAlign = 'left';
      ctx.fillText(r.k, x, y);
      ctx.textAlign = 'right';
      ctx.fillText(r.v, x + 92 * scale, y);
      y += 14 * scale;
    }
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0804';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * scale * 0.5;
      const cy = oy + VH * scale * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawTerrain();
    drawPads();
    drawDropLine();
    drawShip();
    drawParticles();
    drawFloats();
    drawFlash();
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    drawTelemetry();
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
    if (G.mode === 'title') startGame('soft');
    else startGame(G.kind || 'soft');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('soft');
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
    if (space) keys.burst = down && G.mode === 'play' && !overlayOpen();

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
    }
    if ((k === '1' || code === 'Digit1') && overlayOpen() && G.mode === 'title') {
      startGame('soft');
    }
    if ((k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') {
      startGame('hard');
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
    holdPad(padBurst, function () { keys.burst = true; }, function () { keys.burst = false; });
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

  if (btnSoft) {
    btnSoft.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('soft');
    });
  }
  if (btnHard) {
    btnHard.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('hard');
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
      if (G.mode === 'play') keys.u = true;
    });
    function ptrUp() { keys.u = false; }
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
      keys.burst = false;
    }
  });

  requestAnimationFrame(frame);
})();
