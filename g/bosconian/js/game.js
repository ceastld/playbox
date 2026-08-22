'use strict';

(function () {
  const VW = 720;
  const VH = 720;
  const WW = 2600;
  const WH = 2600;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SHIP_R = 10;
  const SHIP_SPD = 248;
  const SHOT_V = 560;
  const SHOT_LIFE = 0.62;
  const SHOT_CD = 0.12;
  const MAX_PAIRS = 3;
  const CANNON_R = 10;
  const CORE_R = 13;
  const RING = 46;
  const SPY_R = 9;
  const ELITE_R = 12;
  const FORM_R = 10;
  const MISS_R = 5;
  const COMBO_WIN = 1.48;
  const EXTRA_LIFE = 10000;
  const ROUNDS = 6;
  const BEST_KEY = 'playbox-bosconian-best';
  const MUTE_KEY = 'playbox-bosconian-mute';
  const OPS = '←↑↓→ / WASD 八向飞 · 空格前后开火 · R 重开 · M 静音';
  const ROUND_NAMES = ['', '前哨', '环带', '星门', '要塞', '深核', '母星'];
  const BASE_COUNTS = [0, 4, 5, 6, 6, 7, 8];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 221, 255];
  const TEAL = [0, 229, 208];
  const GOLD = [255, 227, 107];
  const WHT = [232, 251, 255];
  const HOT = [62, 232, 255];
  const YLW = [255, 196, 74];
  const RED = [255, 72, 88];
  const ROCKC = [140, 176, 188];
  const ROCK2 = [176, 204, 214];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnCamp = document.getElementById('btn-camp');
  const btnRaid = document.getElementById('btn-raid');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const baseLabel = document.getElementById('base-label');
  const condLabel = document.getElementById('cond-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');
  const stickEl = document.getElementById('stick');
  const stickKnob = document.getElementById('stick-knob');
  const padFire = document.getElementById('pad-fire');

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

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const pad = { dx: 0, dy: 0, id: null };
  const pointer = { down: false, dx: 0, dy: 0, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'camp',
    t: 0,
    clock: 0,
    round: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    nextLife: EXTRA_LIFE,
    ship: { x: WW * 0.5, y: WH * 0.5, ang: 0 },
    cam: { x: WW * 0.5, y: WH * 0.5 },
    bases: [],
    spies: [],
    forms: [],
    missiles: [],
    rocks: [],
    shots: [],
    fireCd: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    toastT: 0,
    muzzle: 0,
    roundWait: 0,
    formWait: 0,
    spyWait: 0,
    cond: 'green',
    radarA: 0,
    ping: 0,
    pingT: 0,
    why: '',
    demoT: 0
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
    v = v % max;
    if (v < 0) v += max;
    return v;
  }
  function wrapDelta(a, b, size) {
    let d = a - b;
    const h = size * 0.5;
    if (d > h) d -= size;
    if (d < -h) d += size;
    return d;
  }
  function wrapDist(ax, ay, bx, by) {
    const dx = wrapDelta(ax, bx, WW);
    const dy = wrapDelta(ay, by, WH);
    return { dx: dx, dy: dy, d: hypot(dx, dy) };
  }
  function snap8(a) {
    const step = Math.PI / 4;
    return Math.round(a / step) * step;
  }
  function isRaid() {
    return G.kind === 'raid';
  }
  function diff() {
    return 1 + (G.round - 1) * 0.12 + (isRaid() ? 0.42 : 0);
  }
  function viewX(x) {
    return VW * 0.5 + wrapDelta(x, G.cam.x, WW);
  }
  function viewY(y) {
    return VH * 0.5 + wrapDelta(y, G.cam.y, WH);
  }
  function onScreen(x, y, r) {
    const vx = viewX(x);
    const vy = viewY(y);
    return vx > -r && vx < VW + r && vy > -r && vy < VH + r;
  }
  function hexPt(i, r) {
    const a = -Math.PI / 2 + i * (Math.PI / 3);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
  function cannonWorld(b, i) {
    const p = hexPt(i, RING);
    return { x: wrap(b.x + p.x, WW), y: wrap(b.y + p.y, WH) };
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
      if (G.mode === 'title') return;
      this.ensure();
      this.beep(920, 0.045, 'square', 0.026, 1680);
      this.beep(380, 0.04, 'triangle', 0.014, 160);
    },
    cannon() {
      this.ensure();
      this.noise(0.05, 0.034, 700);
      this.beep(520, 0.06, 'square', 0.034, 220);
    },
    core() {
      this.ensure();
      this.noise(0.18, 0.08, 140);
      this.beep(90, 0.28, 'sawtooth', 0.07, 36);
      this.beep(420, 0.12, 'square', 0.05, 140);
      this.beep(980, 0.16, 'triangle', 0.04, 1560);
    },
    spy() {
      this.ensure();
      this.noise(0.05, 0.03, 900);
      this.beep(740, 0.07, 'square', 0.036, 320);
    },
    form() {
      this.ensure();
      this.beep(220, 0.09, 'sawtooth', 0.04, 110);
      this.beep(880, 0.08, 'square', 0.03, 440);
    },
    missile() {
      this.ensure();
      this.beep(340, 0.04, 'triangle', 0.018, 180);
    },
    rock() {
      this.ensure();
      this.noise(0.07, 0.04, 280);
      this.beep(240, 0.07, 'square', 0.03, 90);
    },
    alert() {
      this.ensure();
      this.beep(620, 0.12, 'square', 0.05, 310);
      this.beep(310, 0.16, 'sawtooth', 0.04, 155);
    },
    radar() {
      this.ensure();
      this.beep(1480, 0.07, 'sine', 0.028, 880);
      this.beep(990, 0.11, 'triangle', 0.016, 1480);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.04, 784);
      this.beep(784, 0.1, 'triangle', 0.04, 1046);
      this.beep(1046, 0.18, 'sine', 0.045, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.06, 300);
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
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(880, 0.18, 'sine', 0.05, 1175);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
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
    while (G.score >= G.nextLife && G.lives < 6) {
      G.nextLife += EXTRA_LIFE;
      G.lives += 1;
      audio.extra();
      toast('1UP', false, true);
      screenFlash(GOLD, 0.5);
      kick(3.2);
      syncPips();
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
    G.toastT = 1.28;
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
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    while (pips.length > n && pips.length > LIVES) {
      const d = pips.pop();
      if (d && d.parentNode) d.parentNode.removeChild(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : (G.mode !== 'title' ? ' gone' : ''));
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
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

  function liveBases() {
    let n = 0;
    for (let i = 0; i < G.bases.length; i++) if (G.bases[i].alive) n += 1;
    return n;
  }

  function liveCannons(b) {
    let n = 0;
    for (let i = 0; i < b.cannons.length; i++) if (b.cannons[i].alive) n += 1;
    return n;
  }

  function formCount() {
    let n = 0;
    for (let i = 0; i < G.forms.length; i++) if (G.forms[i].alive) n += 1;
    return n;
  }

  function spyCount() {
    let n = 0;
    for (let i = 0; i < G.spies.length; i++) if (G.spies[i].alive) n += 1;
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '博斯';
      else stageLabel.textContent = '第 ' + G.round + ' 轮 · ' + ROUND_NAMES[G.round];
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.round >= 5);
    }
    if (tagLabel) {
      tagLabel.textContent = isRaid() ? '突袭' : '扫星';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.cond === 'red' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (baseLabel) {
      const n = liveBases();
      baseLabel.textContent = '基 ' + n;
      baseLabel.classList.toggle('empty', n <= 1 && G.mode === 'play');
    }
    if (condLabel) {
      const c = G.mode === 'play' ? G.cond : 'green';
      condLabel.textContent = c === 'red' ? '红' : c === 'yellow' ? '黄' : '绿';
      condLabel.className = 'cond' + (c === 'red' ? ' red' : c === 'yellow' ? ' yellow' : '');
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
    else if (G.mode === 'lose') setHint('R 重开 · 前后开火打进核心', 'warn');
    else if (G.mode === 'win') setHint('星域肃清 · R 再来', 'hot');
    else if (G.cond === 'red') setHint('红警 · 编队或导弹近了 · 前后都打', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 雷达盯基 · 打核心', 'warn');
    else if (liveBases() === 1) setHint('最后一座 · 钻缝打核', 'hot');
    else setHint('八向飞 · 空格前后开火 · 打核心爆整座', G.combo >= 6 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'BOSC';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (btnCamp) btnCamp.textContent = primary;
    if (btnRaid) {
      btnRaid.textContent = secondary;
      btnRaid.classList.remove('hidden');
    }
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
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'core' : mag >= 5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('core');
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

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.3, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 0,
        life: rand(0.22, 0.55),
        max: 0.55,
        r: rand(1.1, 2.8),
        rgb: i % 4 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 280);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 40);
  }

  function popRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 12 });
    capArr(rings, 28);
  }

  function popFloat(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, vy: -52, t: 0, life: 0.72,
      text: text, rgb: rgb, gold: !!gold, size: gold ? 16 : 13
    });
    capArr(floats, 24);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 140; i++) {
      stars.push({
        x: Math.random() * WW,
        y: Math.random() * WH,
        r: Math.random() < 0.18 ? 1.5 : 0.7,
        a: rand(0.22, 0.9),
        p: Math.random() * TAU,
        layer: Math.random() < 0.35 ? 0.28 : Math.random() < 0.5 ? 0.58 : 1,
        rgb: Math.random() < 0.16 ? TEAL : Math.random() < 0.12 ? CYN : Math.random() < 0.1 ? GOLD : WHT
      });
    }
  }

  function makeShape(r) {
    const n = 7 + ((Math.random() * 4) | 0);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.12, 0.12);
      const rr = r * rand(0.68, 1.14);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return pts;
  }

  function farFrom(x, y, minD) {
    for (let i = 0; i < 22; i++) {
      const px = rand(0, WW);
      const py = rand(0, WH);
      if (wrapDist(px, py, x, y).d >= minD) return { x: px, y: py };
    }
    return { x: wrap(x + WW * 0.5, WW), y: wrap(y + WH * 0.42, WH) };
  }

  function spawnRock(size, x, y, vx, vy) {
    const big = size === 0;
    const r = big ? 22 : 12;
    const spd = rand(big ? 18 : 32, big ? 46 : 78);
    const dir = Math.random() * TAU;
    return {
      x: wrap(x, WW),
      y: wrap(y, WH),
      vx: vx == null ? Math.cos(dir) * spd : vx,
      vy: vy == null ? Math.sin(dir) * spd : vy,
      r: r,
      size: size,
      hp: big ? 3 : 1,
      ang: Math.random() * TAU,
      spin: rand(-0.8, 0.8) * (big ? 0.6 : 1.4),
      pts: makeShape(r),
      rgb: big ? ROCKC : ROCK2,
      alive: true
    };
  }

  function spawnBase(x, y) {
    const cannons = [];
    for (let i = 0; i < 6; i++) {
      cannons.push({ alive: true, fireCd: rand(0.3, 1.8), flash: 0 });
    }
    G.bases.push({
      x: wrap(x, WW),
      y: wrap(y, WH),
      cannons: cannons,
      alive: true,
      spin: rand(-0.12, 0.12),
      pulse: Math.random() * TAU,
      ping: 0
    });
  }

  function spawnSpy(x, y, elite) {
    const a = Math.random() * TAU;
    G.spies.push({
      x: wrap(x, WW),
      y: wrap(y, WH),
      ang: a,
      spd: (elite ? 168 : 128) * (0.9 + diff() * 0.08),
      elite: !!elite,
      lock: 0,
      reported: false,
      turnT: rand(0.6, 1.8),
      alive: true,
      flash: 0
    });
  }

  function spawnMissile(x, y, ang, homing) {
    G.missiles.push({
      x: wrap(x, WW),
      y: wrap(y, WH),
      ang: ang,
      spd: (isRaid() ? 248 : 198) * (0.92 + (G.round - 1) * 0.05),
      homing: homing == null ? 1.65 : homing,
      life: 3.6,
      alive: true
    });
    capArr(G.missiles, 48);
  }

  function spawnFormation(elite) {
    if (G.mode !== 'play') return;
    if (formCount() > 0) return;
    const n = elite ? 7 : 5;
    const a = Math.random() * TAU;
    const dist = 460;
    const px = wrap(G.ship.x + Math.cos(a) * dist, WW);
    const py = wrap(G.ship.y + Math.sin(a) * dist, WH);
    const to = wrapDist(G.ship.x, G.ship.y, px, py);
    const ang = Math.atan2(to.dy, to.dx);
    const pxp = Math.cos(ang + Math.PI / 2);
    const pyp = Math.sin(ang + Math.PI / 2);
    const mid = (n - 1) * 0.5;
    for (let i = 0; i < n; i++) {
      const lat = (i - mid) * 28;
      const back = Math.abs(i - mid) * 16;
      G.forms.push({
        x: wrap(px + pxp * lat - Math.cos(ang) * back, WW),
        y: wrap(py + pyp * lat - Math.sin(ang) * back, WH),
        ang: ang,
        spd: (elite ? 196 : 168) * (0.95 + diff() * 0.08),
        fireCd: rand(0.4, 1.2),
        elite: !!elite && i === mid,
        alive: true,
        flash: 0
      });
    }
    G.formWait = isRaid() ? 7.5 : 10;
    audio.alert();
    toast(elite ? '编队侦察来袭' : '编队来袭', true, false);
    screenFlash(MAG, 0.42);
    kick(3.6);
  }

  function wantedSpies() {
    return 2 + ((G.round / 2) | 0) + (isRaid() ? 2 : 0);
  }
  function wantedElite() {
    if (isRaid()) return G.round >= 1 ? 1 : 0;
    return G.round >= 3 ? 1 : 0;
  }
  function wantedRocks() {
    return 5 + G.round + (isRaid() ? 3 : 0);
  }

  function clearField() {
    G.bases.length = 0;
    G.spies.length = 0;
    G.forms.length = 0;
    G.missiles.length = 0;
    G.rocks.length = 0;
    G.shots.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function resetShip(center) {
    if (center) {
      G.ship.x = WW * 0.5;
      G.ship.y = WH * 0.5;
    }
    G.ship.ang = 0;
    G.cam.x = G.ship.x;
    G.cam.y = G.ship.y;
  }

  function placeRound() {
    const n = BASE_COUNTS[G.round] || 8;
    const pts = [];
    for (let i = 0; i < n; i++) {
      let placed = null;
      for (let t = 0; t < 40; t++) {
        const p = { x: rand(80, WW - 80), y: rand(80, WH - 80) };
        if (wrapDist(p.x, p.y, G.ship.x, G.ship.y).d < 460) continue;
        let ok = true;
        for (let j = 0; j < pts.length; j++) {
          if (wrapDist(p.x, p.y, pts[j].x, pts[j].y).d < 390) {
            ok = false;
            break;
          }
        }
        if (ok) {
          placed = p;
          break;
        }
      }
      if (!placed) placed = farFrom(G.ship.x, G.ship.y, 520);
      pts.push(placed);
      spawnBase(placed.x, placed.y);
    }
    const ns = wantedSpies();
    for (let i = 0; i < ns; i++) {
      const p = farFrom(G.ship.x, G.ship.y, 320);
      spawnSpy(p.x, p.y, false);
    }
    const ne = wantedElite();
    for (let i = 0; i < ne; i++) {
      const p = farFrom(G.ship.x, G.ship.y, 480);
      spawnSpy(p.x, p.y, true);
    }
    const nr = wantedRocks();
    for (let i = 0; i < nr; i++) {
      const p = farFrom(G.ship.x, G.ship.y, 220);
      G.rocks.push(spawnRock(Math.random() < 0.55 ? 0 : 1, p.x, p.y, null, null));
    }
    G.formWait = 4;
    G.spyWait = 2.4;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'camp';
    G.round = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.deadT = 0;
    G.invuln = 0;
    G.ready = 0;
    G.roundWait = 0;
    G.cond = 'green';
    G.why = '';
    clearField();
    resetShip(true);
    spawnBase(G.ship.x + 220, G.ship.y - 40);
    spawnBase(G.ship.x - 280, G.ship.y + 180);
    spawnSpy(G.ship.x + 160, G.ship.y + 140, false);
    spawnSpy(G.ship.x - 200, G.ship.y - 160, true);
    G.rocks.push(spawnRock(0, G.ship.x + 90, G.ship.y - 200, 20, 12));
    G.rocks.push(spawnRock(1, G.ship.x - 140, G.ship.y + 90, -16, 22));
    showOverlay('title', '博斯', '八向飞舰，前后同时开火。打进六角基地核心。雷达盯着剩下的基。', '扫星', '突袭');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'raid' ? 'raid' : 'camp';
    G.mode = 'play';
    G.round = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = EXTRA_LIFE;
    G.deadT = 0;
    G.invuln = 1.1;
    G.fireCd = 0;
    G.stop = 0;
    G.roundWait = 0;
    G.cond = 'green';
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    resetShip(true);
    placeRound();
    G.ready = 0.9;
    hideOverlay();
    audio.start();
    audio.wave();
    toast((isRaid() ? '突袭' : '扫星') + ' · ' + ROUND_NAMES[1], false, true);
    screenFlash(CYN, 0.35);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('camp');
    else startGame(G.kind);
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why || '舰毁了';
    audio.lose();
    kick(6.5);
    screenFlash(MAG, 0.55);
    const rec = G.score >= G.best && G.score > 0 ? ' 新纪录。' : '';
    showOverlay(
      'lose',
      G.why,
      '第 ' + G.round + ' 轮 · ' + G.score + ' 分。' + rec + '前后开火，打进核心最快。',
      '再来',
      '换模式'
    );
    syncHud();
  }

  function winRun() {
    addScore(isRaid() ? 12000 : 8000);
    G.mode = 'win';
    audio.win();
    kick(4.5);
    screenFlash(GOLD, 0.6);
    const rec = G.score >= G.best && G.score > 0 ? ' 新纪录。' : '';
    showOverlay(
      'win',
      isRaid() ? '突袭通关' : '星域肃清',
      '六轮基地尽碎 · ' + G.score + ' 分。' + rec,
      '再来',
      isRaid() ? '换模式' : '突袭'
    );
    syncHud();
  }

  function nextRound() {
    G.round += 1;
    if (G.round > ROUNDS) {
      winRun();
      return;
    }
    G.roundWait = 0;
    G.shots.length = 0;
    G.missiles.length = 0;
    G.forms.length = 0;
    G.invuln = Math.max(G.invuln, 0.9);
    const keepSpies = [];
    for (let i = 0; i < G.spies.length; i++) {
      if (G.spies[i].alive) keepSpies.push(G.spies[i]);
    }
    G.spies = keepSpies;
    G.bases.length = 0;
    const n = BASE_COUNTS[G.round] || 8;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const p = farFrom(G.ship.x, G.ship.y, 480);
      let ok = true;
      for (let j = 0; j < pts.length; j++) {
        if (wrapDist(p.x, p.y, pts[j].x, pts[j].y).d < 360) ok = false;
      }
      if (!ok) {
        const q = farFrom(G.ship.x, G.ship.y, 560);
        pts.push(q);
        spawnBase(q.x, q.y);
      } else {
        pts.push(p);
        spawnBase(p.x, p.y);
      }
    }
    const needS = wantedSpies() - spyCount();
    for (let i = 0; i < needS; i++) {
      const p = farFrom(G.ship.x, G.ship.y, 340);
      spawnSpy(p.x, p.y, false);
    }
    if (wantedElite() > 0) {
      let hasE = false;
      for (let i = 0; i < G.spies.length; i++) if (G.spies[i].alive && G.spies[i].elite) hasE = true;
      if (!hasE) {
        const p = farFrom(G.ship.x, G.ship.y, 500);
        spawnSpy(p.x, p.y, true);
      }
    }
    audio.wave();
    toast('第 ' + G.round + ' 轮 · ' + ROUND_NAMES[G.round], false, true);
    screenFlash(GOLD, 0.4);
    kick(3.4);
    G.ready = 0.7;
    G.ping = 1;
    audio.radar();
    syncHud();
  }

  function killPlayer(why) {
    if (G.deadT > 0 || G.invuln > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 1.15;
    G.why = why || 'hit';
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    audio.death();
    burst(G.ship.x, G.ship.y, CYN, 26, 240);
    burst(G.ship.x, G.ship.y, MAG, 10, 160);
    popRing(G.ship.x, G.ship.y, MAG, 28);
    screenFlash(MAG, 0.5);
    kick(6);
    hitStop(0.055);
    G.missiles.length = 0;
    syncPips();
    syncHud();
  }

  function inputAng() {
    let dx = 0;
    let dy = 0;
    if (keys.l) dx -= 1;
    if (keys.r) dx += 1;
    if (keys.u) dy -= 1;
    if (keys.d) dy += 1;
    if (pad.dx || pad.dy) {
      dx = pad.dx;
      dy = pad.dy;
    }
    if (pointer.down && (pointer.dx || pointer.dy)) {
      dx = pointer.dx;
      dy = pointer.dy;
    }
    if (!dx && !dy) return null;
    return snap8(Math.atan2(dy, dx));
  }

  function fire() {
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.mode === 'play' && overlayOpen()) return;
    if (G.deadT > 0) return;
    if (G.fireCd > 0) return;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].alive) n += 1;
    if (n >= MAX_PAIRS * 2) return;
    const ship = G.ship;
    const ca = Math.cos(ship.ang);
    const sa = Math.sin(ship.ang);
    G.shots.push({
      x: ship.x + ca * 14,
      y: ship.y + sa * 14,
      vx: ca * SHOT_V,
      vy: sa * SHOT_V,
      life: SHOT_LIFE,
      alive: true
    });
    G.shots.push({
      x: ship.x - ca * 14,
      y: ship.y - sa * 14,
      vx: -ca * SHOT_V,
      vy: -sa * SHOT_V,
      life: SHOT_LIFE,
      alive: true
    });
    G.fireCd = SHOT_CD;
    G.muzzle = 0.07;
    audio.shoot();
  }

  function killCannon(b, i) {
    const c = b.cannons[i];
    if (!c.alive) return;
    c.alive = false;
    const p = cannonWorld(b, i);
    audio.cannon();
    burst(p.x, p.y, TEAL, 12, 160);
    popSpark(p.x, p.y, CYN, 12);
    if (G.mode === 'play') {
      const n = 50 * G.mult;
      addScore(n);
      bumpCombo();
      popFloat(p.x, p.y, '+' + n, TEAL, false);
      hitStop(0.03);
      kick(1.8);
    }
    if (liveCannons(b) <= 0) killBase(b, false);
  }

  function killBase(b, core) {
    if (!b.alive) return;
    b.alive = false;
    for (let i = 0; i < b.cannons.length; i++) {
      if (!b.cannons[i].alive) continue;
      b.cannons[i].alive = false;
      const p = cannonWorld(b, i);
      burst(p.x, p.y, TEAL, 8, 140);
    }
    if (core) {
      audio.core();
      burst(b.x, b.y, GOLD, 36, 280);
      burst(b.x, b.y, CYN, 22, 200);
      popRing(b.x, b.y, GOLD, 56);
      popSpark(b.x, b.y, WHT, 34);
      screenFlash(GOLD, 0.62);
      kick(7.2);
      hitStop(0.072);
      G.ping = 1;
      audio.radar();
    } else {
      audio.core();
      burst(b.x, b.y, TEAL, 22, 200);
      popRing(b.x, b.y, CYN, 36);
      screenFlash(CYN, 0.38);
      kick(4.4);
      hitStop(0.045);
    }
    if (G.mode === 'play') {
      const n = (core ? 1500 : 800) * G.mult;
      addScore(n);
      bumpCombo();
      popFloat(b.x, b.y, core ? '核爆 +' + n : '+' + n, GOLD, true);
      toast(core ? '核心击破' : '基地摧毁', false, true);
    }
    if (G.mode === 'play' && liveBases() <= 0 && G.roundWait <= 0) {
      const bonus = 500 * G.round * G.mult;
      addScore(bonus);
      G.roundWait = 1.35;
      toast('轮空 · +' + bonus, false, true);
    }
  }

  function hitCore(b) {
    killBase(b, true);
  }

  function killSpy(s) {
    if (!s.alive) return;
    s.alive = false;
    audio.spy();
    burst(s.x, s.y, s.elite ? MAG : YLW, s.elite ? 18 : 12, 170);
    popSpark(s.x, s.y, s.elite ? MAG : GOLD, 14);
    if (G.mode === 'play') {
      const n = (s.elite ? 800 : 200) * G.mult;
      addScore(n);
      bumpCombo();
      popFloat(s.x, s.y, '+' + n, s.elite ? MAG : YLW, s.elite);
      hitStop(s.elite ? 0.045 : 0.028);
      kick(s.elite ? 3.2 : 1.6);
    }
    G.spyWait = Math.max(G.spyWait, 2.2);
  }

  function killForm(f) {
    if (!f.alive) return;
    f.alive = false;
    audio.form();
    burst(f.x, f.y, MAG, 14, 180);
    popSpark(f.x, f.y, MAG, 13);
    if (G.mode === 'play') {
      const n = (f.elite ? 800 : 400) * G.mult;
      addScore(n);
      bumpCombo();
      popFloat(f.x, f.y, '+' + n, MAG, !!f.elite);
      hitStop(0.032);
      kick(2.2);
    }
  }

  function killMissile(m, scored) {
    if (!m.alive) return;
    m.alive = false;
    burst(m.x, m.y, MAG, 6, 110);
    popSpark(m.x, m.y, MAG, 8);
    audio.missile();
    if (scored && G.mode === 'play') {
      const n = 20 * G.mult;
      addScore(n);
      bumpCombo();
    }
  }

  function breakRock(r, scored) {
    r.alive = false;
    audio.rock();
    burst(r.x, r.y, r.rgb, 10 + (1 - r.size) * 6, 130 + (1 - r.size) * 40);
    popSpark(r.x, r.y, r.rgb, r.r);
    if (scored && G.mode === 'play') {
      const n = (r.size === 0 ? 80 : 50) * G.mult;
      addScore(n);
      bumpCombo();
      popFloat(r.x, r.y, '+' + n, r.rgb, false);
      hitStop(r.size === 0 ? 0.034 : 0.022);
      kick(r.size === 0 ? 2.2 : 1.3);
    }
    if (r.size === 0) {
      for (let i = 0; i < 2; i++) {
        const a = rand(0, TAU);
        const spd = rand(40, 90);
        G.rocks.push(spawnRock(1, r.x, r.y, Math.cos(a) * spd, Math.sin(a) * spd));
      }
    }
  }

  function hitRock(r, scored) {
    r.hp -= 1;
    popSpark(r.x, r.y, r.rgb, 8);
    burst(r.x, r.y, r.rgb, 3, 70);
    if (r.hp <= 0) breakRock(r, scored);
  }

  function steerToward(ang, tx, ty, turn, dt) {
    const want = Math.atan2(ty, tx);
    let d = want - ang;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    const max = turn * dt;
    if (d > max) d = max;
    if (d < -max) d = -max;
    return ang + d;
  }

  function updatePlayer(dt) {
    const ang = inputAng();
    if (ang != null) G.ship.ang = ang;
    else if (G.mode === 'title') {
      G.demoT += dt;
      if (G.demoT > 0.55) {
        G.demoT = 0;
        G.ship.ang = snap8(G.ship.ang + Math.PI / 4);
      }
    }
    const spd = SHIP_SPD * (isRaid() ? 1.06 : 1);
    G.ship.x = wrap(G.ship.x + Math.cos(G.ship.ang) * spd * dt, WW);
    G.ship.y = wrap(G.ship.y + Math.sin(G.ship.ang) * spd * dt, WH);
    const look = 42;
    const tx = wrap(G.ship.x + Math.cos(G.ship.ang) * look, WW);
    const ty = wrap(G.ship.y + Math.sin(G.ship.ang) * look, WH);
    G.cam.x = wrap(G.cam.x + wrapDelta(tx, G.cam.x, WW) * Math.min(1, dt * 7.5), WW);
    G.cam.y = wrap(G.cam.y + wrapDelta(ty, G.cam.y, WH) * Math.min(1, dt * 7.5), WH);
    if (!REDUCE && G.mode === 'play') {
      const a = G.ship.ang + Math.PI;
      particles.push({
        x: G.ship.x + Math.cos(a) * 8,
        y: G.ship.y + Math.sin(a) * 8,
        vx: Math.cos(a) * 40,
        vy: Math.sin(a) * 40,
        g: 0,
        life: 0.18,
        max: 0.18,
        r: 1.2,
        rgb: Math.random() < 0.4 ? GOLD : CYN
      });
      capArr(particles, 280);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (!s.alive) {
        G.shots.splice(i, 1);
        continue;
      }
      s.life -= dt;
      s.x = wrap(s.x + s.vx * dt, WW);
      s.y = wrap(s.y + s.vy * dt, WH);
      if (s.life <= 0) {
        s.alive = false;
        G.shots.splice(i, 1);
      }
    }
  }

  function updateBases(dt) {
    const range = isRaid() ? 620 : 520;
    const cd = (isRaid() ? 1.05 : 2.15) / (0.85 + G.round * 0.08);
    for (let i = 0; i < G.bases.length; i++) {
      const b = G.bases[i];
      if (!b.alive) continue;
      b.pulse += dt * 2.4;
      if (b.ping > 0) b.ping -= dt;
      const to = wrapDist(G.ship.x, G.ship.y, b.x, b.y);
      for (let k = 0; k < 6; k++) {
        const c = b.cannons[k];
        if (c.flash > 0) c.flash -= dt;
        if (!c.alive) continue;
        c.fireCd -= dt;
        if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) continue;
        if (to.d > range || c.fireCd > 0) continue;
        const p = cannonWorld(b, k);
        const aim = wrapDist(G.ship.x, G.ship.y, p.x, p.y);
        const ang = Math.atan2(aim.dy, aim.dx);
        spawnMissile(p.x, p.y, ang, isRaid() ? 2.2 : 1.5);
        c.fireCd = cd * rand(0.75, 1.2);
        c.flash = 0.12;
      }
    }
  }

  function updateSpies(dt) {
    const lockNeed = isRaid() ? 0.72 : 1.15;
    for (let i = 0; i < G.spies.length; i++) {
      const s = G.spies[i];
      if (!s.alive) continue;
      if (s.flash > 0) s.flash -= dt;
      s.turnT -= dt;
      const to = wrapDist(G.ship.x, G.ship.y, s.x, s.y);
      const see = s.elite ? 420 : 340;
      if (G.mode === 'play' && !s.reported && to.d < see) {
        s.ang = steerToward(s.ang, to.dx, to.dy, s.elite ? 3.4 : 2.4, dt);
        if (to.d < (s.elite ? 190 : 150)) {
          s.lock += dt;
          if (s.lock >= (s.elite ? lockNeed * 0.55 : lockNeed) && formCount() <= 0 && G.formWait <= 0) {
            s.reported = true;
            s.lock = 0;
            spawnFormation(s.elite);
          }
        } else {
          s.lock = Math.max(0, s.lock - dt * 0.6);
        }
      } else {
        s.lock = Math.max(0, s.lock - dt);
        if (s.turnT <= 0) {
          s.turnT = rand(0.7, 2.1);
          s.ang = snap8(s.ang + rand(-1, 1) * (Math.PI / 2));
        }
      }
      if (s.reported) {
        s.ang = steerToward(s.ang, -to.dx, -to.dy, 2.8, dt);
      }
      s.x = wrap(s.x + Math.cos(s.ang) * s.spd * dt, WW);
      s.y = wrap(s.y + Math.sin(s.ang) * s.spd * dt, WH);
    }
    if (G.mode === 'play' && G.spyWait > 0) G.spyWait -= dt;
    if (G.mode === 'play' && spyCount() < wantedSpies() && G.spyWait <= 0) {
      const p = farFrom(G.ship.x, G.ship.y, 480);
      spawnSpy(p.x, p.y, false);
      G.spyWait = isRaid() ? 3.2 : 4.6;
    }
  }

  function updateForms(dt) {
    if (G.formWait > 0) G.formWait -= dt;
    for (let i = 0; i < G.forms.length; i++) {
      const f = G.forms[i];
      if (!f.alive) continue;
      if (f.flash > 0) f.flash -= dt;
      const to = wrapDist(G.ship.x, G.ship.y, f.x, f.y);
      f.ang = steerToward(f.ang, to.dx, to.dy, 2.8, dt);
      f.x = wrap(f.x + Math.cos(f.ang) * f.spd * dt, WW);
      f.y = wrap(f.y + Math.sin(f.ang) * f.spd * dt, WH);
      f.fireCd -= dt;
      if (G.mode === 'play' && G.deadT <= 0 && f.fireCd <= 0 && to.d < 520) {
        spawnMissile(f.x, f.y, Math.atan2(to.dy, to.dx), f.elite ? 2.6 : 1.9);
        f.fireCd = (isRaid() ? 0.72 : 1.15) * rand(0.8, 1.2);
      }
    }
  }

  function updateMissiles(dt) {
    for (let i = G.missiles.length - 1; i >= 0; i--) {
      const m = G.missiles[i];
      if (!m.alive) {
        G.missiles.splice(i, 1);
        continue;
      }
      m.life -= dt;
      const to = wrapDist(G.ship.x, G.ship.y, m.x, m.y);
      m.ang = steerToward(m.ang, to.dx, to.dy, m.homing, dt);
      m.x = wrap(m.x + Math.cos(m.ang) * m.spd * dt, WW);
      m.y = wrap(m.y + Math.sin(m.ang) * m.spd * dt, WH);
      if (m.life <= 0) {
        m.alive = false;
        G.missiles.splice(i, 1);
      }
    }
  }

  function updateRocks(dt) {
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      r.x = wrap(r.x + r.vx * dt, WW);
      r.y = wrap(r.y + r.vy * dt, WH);
      r.ang += r.spin * dt;
    }
  }

  function collideShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.alive) continue;
      let hit = false;
      for (let b = 0; b < G.bases.length && !hit; b++) {
        const base = G.bases[b];
        if (!base.alive) continue;
        for (let k = 0; k < 6; k++) {
          if (!base.cannons[k].alive) continue;
          const p = cannonWorld(base, k);
          if (wrapDist(s.x, s.y, p.x, p.y).d < CANNON_R + 4) {
            s.alive = false;
            killCannon(base, k);
            hit = true;
            break;
          }
        }
        if (!hit && wrapDist(s.x, s.y, base.x, base.y).d < CORE_R + 5) {
          s.alive = false;
          hitCore(base);
          hit = true;
        }
      }
      if (hit) continue;
      for (let k = 0; k < G.spies.length; k++) {
        const sp = G.spies[k];
        if (!sp.alive) continue;
        if (wrapDist(s.x, s.y, sp.x, sp.y).d < (sp.elite ? ELITE_R : SPY_R) + 4) {
          s.alive = false;
          killSpy(sp);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      for (let k = 0; k < G.forms.length; k++) {
        const f = G.forms[k];
        if (!f.alive) continue;
        if (wrapDist(s.x, s.y, f.x, f.y).d < FORM_R + 4) {
          s.alive = false;
          killForm(f);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      for (let k = 0; k < G.missiles.length; k++) {
        const m = G.missiles[k];
        if (!m.alive) continue;
        if (wrapDist(s.x, s.y, m.x, m.y).d < MISS_R + 5) {
          s.alive = false;
          killMissile(m, true);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      for (let k = 0; k < G.rocks.length; k++) {
        const r = G.rocks[k];
        if (!r.alive) continue;
        if (wrapDist(s.x, s.y, r.x, r.y).d < r.r + 3) {
          s.alive = false;
          hitRock(r, true);
          break;
        }
      }
    }
  }

  function collideShip() {
    if (G.deadT > 0 || G.invuln > 0 || G.mode !== 'play') return;
    const x = G.ship.x;
    const y = G.ship.y;
    for (let b = 0; b < G.bases.length; b++) {
      const base = G.bases[b];
      if (!base.alive) continue;
      for (let k = 0; k < 6; k++) {
        if (!base.cannons[k].alive) continue;
        const p = cannonWorld(base, k);
        if (wrapDist(x, y, p.x, p.y).d < CANNON_R + SHIP_R - 1) {
          killPlayer('撞炮');
          return;
        }
      }
    }
    for (let i = 0; i < G.spies.length; i++) {
      const s = G.spies[i];
      if (!s.alive) continue;
      if (wrapDist(x, y, s.x, s.y).d < (s.elite ? ELITE_R : SPY_R) + SHIP_R - 1) {
        killPlayer('侦察');
        return;
      }
    }
    for (let i = 0; i < G.forms.length; i++) {
      const f = G.forms[i];
      if (!f.alive) continue;
      if (wrapDist(x, y, f.x, f.y).d < FORM_R + SHIP_R - 1) {
        killPlayer('编队');
        return;
      }
    }
    for (let i = 0; i < G.missiles.length; i++) {
      const m = G.missiles[i];
      if (!m.alive) continue;
      if (wrapDist(x, y, m.x, m.y).d < MISS_R + SHIP_R) {
        killPlayer('导弹');
        return;
      }
    }
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      if (wrapDist(x, y, r.x, r.y).d < r.r + SHIP_R - 2) {
        killPlayer('陨石');
        return;
      }
    }
  }

  function updateCondition() {
    let nearest = 1e9;
    let spyNear = 1e9;
    for (let i = 0; i < G.missiles.length; i++) {
      if (!G.missiles[i].alive) continue;
      const d = wrapDist(G.ship.x, G.ship.y, G.missiles[i].x, G.missiles[i].y).d;
      if (d < nearest) nearest = d;
    }
    for (let i = 0; i < G.forms.length; i++) {
      if (!G.forms[i].alive) continue;
      const d = wrapDist(G.ship.x, G.ship.y, G.forms[i].x, G.forms[i].y).d;
      if (d < nearest) nearest = d;
    }
    let locking = false;
    for (let i = 0; i < G.spies.length; i++) {
      const s = G.spies[i];
      if (!s.alive) continue;
      const d = wrapDist(G.ship.x, G.ship.y, s.x, s.y).d;
      if (d < spyNear) spyNear = d;
      if (s.lock > 0.2) locking = true;
    }
    let next = 'green';
    if (nearest < 220 || formCount() > 0 && nearest < 360) next = 'red';
    else if (spyNear < 300 || locking) next = 'yellow';
    if (next === 'red' && G.cond !== 'red' && G.mode === 'play') {
      audio.alert();
    }
    G.cond = next;
  }

  function updateRadar(dt) {
    G.radarA = (G.radarA + dt * 2.15) % TAU;
    G.pingT -= dt;
    if (G.pingT <= 0 && G.mode === 'play') {
      G.pingT = 1.55;
      G.ping = 1;
      audio.radar();
      for (let i = 0; i < G.bases.length; i++) {
        if (G.bases[i].alive) G.bases[i].ping = 0.45;
      }
    }
    if (G.ping > 0) G.ping -= dt * 1.8;
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.shake *= Math.exp(-dt * 7.2);
    G.punch = lerp(G.punch, 1, Math.min(1, dt * 10));
    G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x = wrap(q.x + q.vx * dt, WW);
      q.y = wrap(q.y + q.vy * dt, WH);
      q.vx *= Math.exp(-dt * 1.3);
      q.vy *= Math.exp(-dt * 1.3);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
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
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    updatePlayer(dt);
    const holding = G.mode === 'title' || (G.mode === 'play' && keys.fire);
    if (holding) fire();
    updateShots(dt);
    updateBases(dt);
    updateSpies(dt);
    updateForms(dt);
    updateMissiles(dt);
    updateRocks(dt);
    collideShots();
    if (G.ready > 0) {
      G.ready -= dt;
      return;
    }
    collideShip();
    updateCondition();
    updateRadar(dt);
    if (G.mode === 'play' && G.roundWait > 0) {
      G.roundWait -= dt;
      if (G.roundWait <= 0) nextRound();
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
      playSim(dt);
      updateFx(dt);
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      updateShots(dt);
      updateMissiles(dt);
      updateRocks(dt);
      updateSpies(dt);
      updateForms(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('舰毁了');
          updateFx(dt);
          return;
        }
        let best = { x: G.ship.x, y: G.ship.y, d: 0 };
        for (let i = 0; i < 12; i++) {
          const q = farFrom(G.ship.x, G.ship.y, 200);
          let md = 1e9;
          for (let b = 0; b < G.bases.length; b++) {
            if (!G.bases[b].alive) continue;
            const d = wrapDist(q.x, q.y, G.bases[b].x, G.bases[b].y).d;
            if (d < md) md = d;
          }
          if (md > best.d) best = { x: q.x, y: q.y, d: md };
        }
        G.ship.x = best.x;
        G.ship.y = best.y;
        G.cam.x = G.ship.x;
        G.cam.y = G.ship.y;
        G.invuln = 1.55;
        G.missiles.length = 0;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }
    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function drawHex(vx, vy, r, rgb, fillA, glow) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const p = hexPt(i, r);
      const x = sx(vx + p.x);
      const y = sy(vy + p.y);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (fillA) {
      ctx.fillStyle = rgba(rgb, fillA);
      ctx.fill();
    }
    ctx.strokeStyle = rgba(rgb, glow ? 0.28 : 0.95);
    ctx.lineWidth = (glow ? 4.4 : 1.6) * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#052028');
    g.addColorStop(0.5, '#031014');
    g.addColorStop(1, '#020c10');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const vg = ctx.createRadialGradient(sx(VW * 0.5), sy(VH * 0.5), 20 * scale, sx(VW * 0.5), sy(VH * 0.5), 420 * scale);
    vg.addColorStop(0, 'rgba(0, 221, 255, 0.05)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const vx = VW * 0.5 + wrapDelta(s.x, G.cam.x * s.layer, WW);
      const vy = VH * 0.5 + wrapDelta(s.y, G.cam.y * s.layer, WH);
      const a = s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(vx), sy(vy), s.r * scale, 0, TAU);
      ctx.fill();
    }
    if (G.cond === 'red' && G.mode === 'play' && !REDUCE) {
      const pulse = 0.1 + 0.08 * Math.sin(G.t * 8);
      const rg = ctx.createRadialGradient(sx(VW * 0.5), sy(VH * 0.5), 180 * scale, sx(VW * 0.5), sy(VH * 0.5), 420 * scale);
      rg.addColorStop(0, 'rgba(0,0,0,0)');
      rg.addColorStop(1, rgba(MAG, pulse));
      ctx.fillStyle = rg;
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawBases() {
    for (let i = 0; i < G.bases.length; i++) {
      const b = G.bases[i];
      if (!b.alive) continue;
      if (!onScreen(b.x, b.y, RING + 28)) continue;
      const vx = viewX(b.x);
      const vy = viewY(b.y);
      const pulse = 0.55 + 0.45 * Math.sin(b.pulse);
      drawHex(vx, vy, RING + 8, TEAL, 0.04, true);
      drawHex(vx, vy, RING + 8, CYN, 0, false);
      ctx.strokeStyle = rgba(TEAL, 0.28);
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.arc(sx(vx), sy(vy), RING * scale, 0, TAU);
      ctx.stroke();
      for (let k = 0; k < 6; k++) {
        const c = b.cannons[k];
        const p = hexPt(k, RING);
        const cx = vx + p.x;
        const cy = vy + p.y;
        if (!c.alive) {
          ctx.strokeStyle = rgba(MAG, 0.28);
          ctx.lineWidth = 1 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(cx - 4), sy(cy - 4));
          ctx.lineTo(sx(cx + 4), sy(cy + 4));
          ctx.moveTo(sx(cx + 4), sy(cy - 4));
          ctx.lineTo(sx(cx - 4), sy(cy + 4));
          ctx.stroke();
          continue;
        }
        const rgb = c.flash > 0 ? WHT : TEAL;
        ctx.save();
        ctx.translate(sx(cx), sy(cy));
        ctx.fillStyle = rgba(rgb, 0.2);
        ctx.strokeStyle = rgba(rgb, 0.95);
        ctx.lineWidth = 1.5 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, CANNON_R * scale, 0, TAU);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = rgba(CYN, 0.9);
        ctx.beginPath();
        ctx.arc(0, 0, 2.2 * scale, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      const coreRgb = GOLD;
      ctx.save();
      ctx.translate(sx(vx), sy(vy));
      const grd = ctx.createRadialGradient(0, 0, 2 * scale, 0, 0, CORE_R * 1.8 * scale);
      grd.addColorStop(0, rgba(WHT, 0.7 * pulse));
      grd.addColorStop(0.4, rgba(coreRgb, 0.5));
      grd.addColorStop(1, rgba(coreRgb, 0));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(0, 0, CORE_R * 1.8 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      drawHex(vx, vy, CORE_R, coreRgb, 0.32, false);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(sx(vx), sy(vy), 2.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawRocks() {
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      if (!onScreen(r.x, r.y, r.r + 8)) continue;
      const vx = viewX(r.x);
      const vy = viewY(r.y);
      ctx.save();
      ctx.translate(sx(vx), sy(vy));
      ctx.rotate(r.ang);
      ctx.beginPath();
      for (let k = 0; k < r.pts.length; k++) {
        const px = r.pts[k][0] * scale;
        const py = r.pts[k][1] * scale;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = rgba(r.rgb, 0.12);
      ctx.strokeStyle = rgba(r.rgb, 0.9);
      ctx.lineWidth = 1.5 * scale;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSpies() {
    for (let i = 0; i < G.spies.length; i++) {
      const s = G.spies[i];
      if (!s.alive) continue;
      if (!onScreen(s.x, s.y, 22)) continue;
      const vx = viewX(s.x);
      const vy = viewY(s.y);
      const rgb = s.flash > 0 ? WHT : (s.elite ? MAG : YLW);
      ctx.save();
      ctx.translate(sx(vx), sy(vy));
      ctx.rotate(s.ang);
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.fillStyle = rgba(rgb, 0.16);
      ctx.lineWidth = 1.6 * scale;
      ctx.lineJoin = 'round';
      const w = s.elite ? 12 : 9;
      const h = s.elite ? 8 : 6;
      ctx.beginPath();
      ctx.moveTo(w * scale, 0);
      ctx.lineTo(0, -h * scale);
      ctx.lineTo(-w * 0.6 * scale, 0);
      ctx.lineTo(0, h * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      if (s.lock > 0.05) {
        ctx.strokeStyle = rgba(MAG, 0.45 + 0.4 * Math.sin(G.t * 10));
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.arc(sx(vx), sy(vy), (16 + s.lock * 10) * scale, 0, TAU);
        ctx.stroke();
      }
    }
  }

  function drawForms() {
    for (let i = 0; i < G.forms.length; i++) {
      const f = G.forms[i];
      if (!f.alive) continue;
      if (!onScreen(f.x, f.y, 20)) continue;
      const vx = viewX(f.x);
      const vy = viewY(f.y);
      const rgb = f.flash > 0 ? WHT : MAG;
      ctx.save();
      ctx.translate(sx(vx), sy(vy));
      ctx.rotate(f.ang);
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.fillStyle = rgba(rgb, 0.18);
      ctx.lineWidth = 1.6 * scale;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(12 * scale, 0);
      ctx.lineTo(-6 * scale, -8 * scale);
      ctx.lineTo(-2 * scale, 0);
      ctx.lineTo(-6 * scale, 8 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (f.elite) {
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.beginPath();
        ctx.arc(2 * scale, 0, 2.2 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawMissiles() {
    for (let i = 0; i < G.missiles.length; i++) {
      const m = G.missiles[i];
      if (!m.alive) continue;
      const vx = viewX(m.x);
      const vy = viewY(m.y);
      ctx.save();
      ctx.translate(sx(vx), sy(vy));
      ctx.rotate(m.ang);
      ctx.strokeStyle = rgba(MAG, 0.95);
      ctx.fillStyle = rgba(MAG, 0.4);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(7 * scale, 0);
      ctx.lineTo(-5 * scale, -3 * scale);
      ctx.lineTo(-5 * scale, 3 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (!REDUCE) {
        ctx.strokeStyle = rgba(GOLD, 0.45);
        ctx.beginPath();
        ctx.moveTo(-5 * scale, 0);
        ctx.lineTo(-12 * scale, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.alive) continue;
      const vx = viewX(s.x);
      const vy = viewY(s.y);
      const ang = Math.atan2(s.vy, s.vx);
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 2.1 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(vx - Math.cos(ang) * 7), sy(vy - Math.sin(ang) * 7));
      ctx.lineTo(sx(vx + Math.cos(ang) * 5), sy(vy + Math.sin(ang) * 5));
      ctx.stroke();
      if (!REDUCE) {
        ctx.strokeStyle = rgba(WHT, 0.35);
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(vx - Math.cos(ang) * 14), sy(vy - Math.sin(ang) * 14));
        ctx.lineTo(sx(vx), sy(vy));
        ctx.stroke();
      }
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const ship = G.ship;
    const vx = viewX(ship.x);
    const vy = viewY(ship.y);
    const ghost = G.invuln > 0 && ((G.t * 12) | 0) % 2 === 0;
    ctx.save();
    ctx.translate(sx(vx), sy(vy));
    ctx.rotate(ship.ang);
    ctx.beginPath();
    ctx.moveTo(13 * scale, 0);
    ctx.lineTo(4 * scale, -6 * scale);
    ctx.lineTo(-13 * scale, 0);
    ctx.lineTo(4 * scale, 6 * scale);
    ctx.closePath();
    ctx.strokeStyle = rgba(CYN, ghost ? 0.35 : 1);
    ctx.lineWidth = 1.8 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = rgba(CYN, ghost ? 0.05 : 0.14);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, ghost ? 0.3 : 0.85);
    ctx.fillRect(-2 * scale, -2.2 * scale, 6 * scale, 4.4 * scale);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, G.muzzle * 10);
      ctx.beginPath();
      ctx.arc(16 * scale, 0, 4 * scale, 0, TAU);
      ctx.arc(-16 * scale, 0, 4 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      if (!onScreen(q.x, q.y, 8)) continue;
      const a = q.life / q.max;
      ctx.fillStyle = rgba(q.rgb, clamp(a, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(viewX(q.x)), sy(viewY(q.y)), q.r * scale * (0.6 + a), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, 1 - t);
      ctx.lineWidth = (2.2 - t) * scale;
      ctx.beginPath();
      ctx.arc(sx(viewX(s.x)), sy(viewY(s.y)), s.rad * t * 1.8 * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const t = s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, 1 - t);
      ctx.lineWidth = (2.4 - t * 1.6) * scale;
      ctx.beginPath();
      ctx.arc(sx(viewX(s.x)), sy(viewY(s.y)), (s.r + t * 46) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, a);
      ctx.fillText(f.text, sx(viewX(f.x)), sy(viewY(f.y)));
    }
  }

  function drawRadar() {
    const R = 78;
    const cx = sx(VW - 18 - R);
    const cy = sy(18 + R);
    const range = Math.max(WW, WH) * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * scale, 0, TAU);
    ctx.fillStyle = 'rgba(2, 12, 16, 0.74)';
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.35 + G.ping * 0.5);
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.5 * scale, 0, TAU);
    ctx.strokeStyle = rgba(TEAL, 0.18);
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.12);
    ctx.beginPath();
    ctx.moveTo(cx - R * scale, cy);
    ctx.lineTo(cx + R * scale, cy);
    ctx.moveTo(cx, cy - R * scale);
    ctx.lineTo(cx, cy + R * scale);
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * scale, 0, TAU);
    ctx.clip();
    ctx.strokeStyle = rgba(TEAL, 0.45 + G.ping * 0.4);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(G.radarA) * R * scale, cy + Math.sin(G.radarA) * R * scale);
    ctx.stroke();
    const sweep = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * scale);
    sweep.addColorStop(0, rgba(TEAL, 0.08));
    sweep.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sweep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R * scale, G.radarA - 0.55, G.radarA);
    ctx.closePath();
    ctx.fill();

    function blip(x, y, rgb, r, a) {
      const dx = wrapDelta(x, G.ship.x, WW);
      const dy = wrapDelta(y, G.ship.y, WH);
      if (hypot(dx, dy) > range) return;
      const px = cx + dx / range * R * scale;
      const py = cy + dy / range * R * scale;
      ctx.fillStyle = rgba(rgb, a);
      ctx.beginPath();
      ctx.arc(px, py, r * scale, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < G.rocks.length; i++) {
      if (G.rocks[i].alive) blip(G.rocks[i].x, G.rocks[i].y, ROCKC, 1.0, 0.28);
    }
    for (let i = 0; i < G.missiles.length; i++) {
      if (G.missiles[i].alive) blip(G.missiles[i].x, G.missiles[i].y, MAG, 1.2, 0.7);
    }
    for (let i = 0; i < G.spies.length; i++) {
      const s = G.spies[i];
      if (s.alive) blip(s.x, s.y, s.elite ? MAG : GOLD, s.elite ? 2.4 : 1.8, 0.95);
    }
    for (let i = 0; i < G.forms.length; i++) {
      if (G.forms[i].alive) blip(G.forms[i].x, G.forms[i].y, MAG, 2.0, 0.95);
    }
    for (let i = 0; i < G.bases.length; i++) {
      const b = G.bases[i];
      if (!b.alive) continue;
      const glow = b.ping > 0 ? 1 : 0.85;
      const dx = wrapDelta(b.x, G.ship.x, WW);
      const dy = wrapDelta(b.y, G.ship.y, WH);
      if (hypot(dx, dy) > range) continue;
      const px = cx + dx / range * R * scale;
      const py = cy + dy / range * R * scale;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.PI / 6);
      ctx.fillStyle = rgba(TEAL, glow);
      ctx.beginPath();
      const rr = (2.6 + (b.ping > 0 ? 1.2 : 0)) * scale;
      for (let k = 0; k < 6; k++) {
        const a = k * Math.PI / 3;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.arc(cx, cy, 2.4 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#031014';
    if (ox > 0.5) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W - ox - VW * scale + 1, H);
    }
    if (oy > 0.5) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H - oy - VH * scale + 1);
    }
  }

  function draw() {
    ctx.fillStyle = '#031014';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake);
      shy = rand(-G.shake, G.shake);
    }
    ctx.translate(W * 0.5 + shx, H * 0.5 + shy);
    const punch = REDUCE ? 1 : G.punch;
    ctx.scale(punch, punch);
    ctx.translate(-W * 0.5, -H * 0.5);
    drawBg();
    drawRocks();
    drawBases();
    drawSpies();
    drawForms();
    drawMissiles();
    drawShots();
    drawShip();
    drawFx();
    drawRadar();
    drawFlash();
    ctx.restore();
    drawLetterbox();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const r = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pointerDirFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    const mx = (x - ox) / scale;
    const my = (y - oy) / scale;
    const shipVx = viewX(G.ship.x);
    const shipVy = viewY(G.ship.y);
    const dx = mx - shipVx;
    const dy = my - shipVy;
    if (dx * dx + dy * dy < 16) return;
    const a = snap8(Math.atan2(dy, dx));
    pointer.dx = Math.cos(a);
    pointer.dy = Math.sin(a);
  }

  function setStickFromEvent(e) {
    if (!stickEl) return;
    const r = stickEl.getBoundingClientRect();
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.5;
    let dx = e.clientX - cx;
    let dy = e.clientY - cy;
    const max = r.width * 0.32;
    const d = hypot(dx, dy);
    if (d < 8) {
      pad.dx = 0;
      pad.dy = 0;
      if (stickKnob) {
        stickKnob.style.transform = 'translate(0,0)';
      }
      return;
    }
    const a = snap8(Math.atan2(dy, dx));
    pad.dx = Math.cos(a);
    pad.dy = Math.sin(a);
    const kx = Math.cos(a) * max;
    const ky = Math.sin(a) * max;
    if (stickKnob) stickKnob.style.transform = 'translate(' + kx + 'px,' + ky + 'px)';
  }

  function clearStick() {
    pad.dx = 0;
    pad.dy = 0;
    pad.id = null;
    if (stickEl) stickEl.classList.remove('on');
    if (stickKnob) stickKnob.style.transform = 'translate(0,0)';
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('camp');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const left = k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A' || code === 'KeyA';
    const right = k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D' || code === 'KeyD';
    const up = k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W' || code === 'KeyW';
    const dn = k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S' || code === 'KeyS';

    if (left) {
      keys.l = down;
      if (down) e.preventDefault();
      return;
    }
    if (right) {
      keys.r = down;
      if (down) e.preventDefault();
      return;
    }
    if (up) {
      keys.u = down;
      if (down) e.preventDefault();
      return;
    }
    if (dn) {
      keys.d = down;
      if (down) e.preventDefault();
      return;
    }
    if (space) {
      keys.fire = down;
      if (down) e.preventDefault();
    }

    if (!down) {
      if (space) keys.fire = false;
      return;
    }

    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      e.preventDefault();
      return;
    }
    if ((k === '1' || code === 'Digit1') && G.mode === 'title') {
      startGame('camp');
      return;
    }
    if ((k === '2' || code === 'Digit2') && G.mode === 'title') {
      startGame('raid');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') fire();
    }
  }

  function bindPads() {
    if (stickEl) {
      stickEl.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        audio.ensure();
        if (padsEl) {
          padsEl.classList.add('show');
          padsEl.setAttribute('aria-hidden', 'false');
        }
        pad.id = e.pointerId;
        stickEl.classList.add('on');
        if (stickEl.setPointerCapture) {
          try { stickEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        setStickFromEvent(e);
      });
      stickEl.addEventListener('pointermove', function (e) {
        if (pad.id == null || e.pointerId !== pad.id) return;
        setStickFromEvent(e);
      });
      function stickUp(e) {
        if (pad.id != null && e.pointerId !== pad.id) return;
        clearStick();
      }
      stickEl.addEventListener('pointerup', stickUp);
      stickEl.addEventListener('pointercancel', stickUp);
      stickEl.addEventListener('lostpointercapture', stickUp);
    }
    if (padFire) {
      let held = false;
      padFire.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        e.stopPropagation();
        audio.ensure();
        if (padsEl) {
          padsEl.classList.add('show');
          padsEl.setAttribute('aria-hidden', 'false');
        }
        held = true;
        keys.fire = true;
        padFire.classList.add('on');
        if (padFire.setPointerCapture) {
          try { padFire.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        fire();
      });
      function up() {
        if (!held) return;
        held = false;
        keys.fire = false;
        padFire.classList.remove('on');
      }
      padFire.addEventListener('pointerup', up);
      padFire.addEventListener('pointercancel', up);
      padFire.addEventListener('lostpointercapture', up);
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (e.pointerType === 'touch') {
        if (padsEl) {
          padsEl.classList.add('show');
          padsEl.setAttribute('aria-hidden', 'false');
        }
        return;
      }
      e.preventDefault();
      pointer.down = true;
      pointer.id = e.pointerId;
      keys.fire = true;
      pointerDirFromEvent(e);
      if (G.mode === 'play') fire();
      if (G.mode === 'title' && overlayOpen()) primaryAction();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down) return;
      pointerDirFromEvent(e);
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      pointer.dx = 0;
      pointer.dy = 0;
      if (!padFire || !padFire.classList.contains('on')) keys.fire = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
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
  bindPads();
  bindPointer();

  if (btnCamp) {
    btnCamp.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('camp');
    });
  }
  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && !isRaid()) startGame('raid');
      else if (G.mode === 'win') goTitle();
      else startGame('raid');
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
      keys.fire = false;
      pointer.down = false;
      clearStick();
    }
  });

  requestAnimationFrame(frame);
})();
