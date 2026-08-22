'use strict';

(function () {
  const VW = 800;
  const VH = 480;
  const SUN_X = 400;
  const SUN_Y = 236;
  const SUN_R = 26;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SHIP_R = 9;
  const ROT = 3.2;
  const THRUST_S = 242;
  const THRUST_C = 196;
  const MAX_V_S = 348;
  const MAX_V_C = 286;
  const DRAG_S = 0.04;
  const DRAG_C = 0.018;
  const FUEL_PATROL = 160;
  const FUEL_WELL = 100;
  const FUEL_USE = 11;
  const SHOT_V = 430;
  const SHOT_LIFE = 0.74;
  const FIRE_CD = 0.14;
  const MAX_SHOTS = 4;
  const COMBO_WIN = 1.35;
  const EXTRA_LIFE = 10000;
  const DEAD_WAIT = 1.18;
  const BEST_KEY = 'playbox-gravitar-best';
  const MUTE_KEY = 'playbox-gravitar-mute';
  const OPS = 'A D / ← → 转向 · W / ↑ 推进 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const ICE = [180, 140, 255];
  const GOLD = [255, 227, 107];
  const WHT = [240, 232, 255];
  const PNK = [255, 176, 210];
  const ORG = [255, 140, 64];
  const DIM = [88, 64, 128];

  const KINDS = [
    { name: '朱砂', en: 'CINDER', rgb: MAG, profile: 0, r: 16 },
    { name: '靛井', en: 'WELL', rgb: ICE, profile: 1, r: 18 },
    { name: '霜环', en: 'RIME', rgb: CYN, profile: 2, r: 17 },
    { name: '赤核', en: 'CORE', rgb: GOLD, profile: 3, r: 21 },
    { name: '玄渊', en: 'ABYSS', rgb: PNK, profile: 2, r: 19 }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnPatrol = document.getElementById('btn-patrol');
  const btnWell = document.getElementById('btn-well');
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

  const keys = { l: false, r: false, u: false, fire: false };
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
    kind: 'patrol',
    scene: 'space',
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
    fuel: FUEL_PATROL,
    fuelMax: FUEL_PATROL,
    ship: { x: VW * 0.5, y: 420, vx: 0, vy: 0, ang: 0 },
    planets: [],
    ground: [],
    ceil: [],
    bunkers: [],
    fuels: [],
    reactor: null,
    gate: { x: 400, y: 34, w: 92 },
    inside: null,
    shots: [],
    fireCd: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    escapeT: 0,
    escapeMax: 0,
    waveWait: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: ICE,
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
  function wrap(v, max) {
    return ((v % max) + max) % max;
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function isWell() {
    return G.kind === 'well';
  }
  function inCave() {
    return G.scene === 'cave';
  }
  function modeMul() {
    return isWell() ? 1.45 : 1;
  }
  function landMax() {
    return isWell() ? 64 : 88;
  }
  function fuelMax() {
    return isWell() ? FUEL_WELL : FUEL_PATROL;
  }
  function bunkCd() {
    return (isWell() ? 0.86 : 1.32) * Math.max(0.62, 1 - (G.wave - 1) * 0.07);
  }
  function bunkShotV() {
    return isWell() ? 176 : 148;
  }
  function gravCave() {
    return isWell() ? 98 : 58;
  }
  function gravSun() {
    return isWell() ? 10200 : 6400;
  }
  function sunSoft() {
    return isWell() ? 820 : 1380;
  }
  function escapeMax() {
    return Math.max(6.2, (isWell() ? 8.2 : 12.4) - (G.wave - 1) * 0.55);
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
      this.beep(1240, 0.048, 'square', 0.026, 220);
      this.beep(640, 0.032, 'triangle', 0.012, 150);
    },
    thrust() {
      this.ensure();
      this.noise(0.05, 0.015, 260);
      this.beep(68, 0.048, 'sawtooth', 0.012, 40);
    },
    hit() {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.03, 220);
      this.noise(0.05, 0.028, 700);
    },
    bunkDown() {
      this.ensure();
      this.noise(0.12, 0.05, 280);
      this.beep(240, 0.14, 'sawtooth', 0.04, 70);
      this.beep(520, 0.08, 'triangle', 0.028, 180);
    },
    reactorHit() {
      this.ensure();
      this.beep(196, 0.07, 'square', 0.036, 420);
      this.beep(620, 0.1, 'triangle', 0.03, 180);
    },
    reactorBoom() {
      this.ensure();
      this.noise(0.32, 0.09, 160);
      this.beep(140, 0.36, 'sawtooth', 0.055, 42);
      this.beep(330, 0.22, 'triangle', 0.04, 90);
      this.beep(90, 0.5, 'sine', 0.05, 36);
    },
    fuel() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.036, 784);
      this.beep(784, 0.1, 'triangle', 0.028, 1046);
    },
    enter() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.036, 523);
      this.beep(659, 0.12, 'triangle', 0.032, 880);
    },
    escape() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.036, 659);
      this.beep(784, 0.1, 'triangle', 0.036, 988);
      this.beep(1046, 0.18, 'sine', 0.04, 1318);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.036, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.026, 1176);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.036, 784);
      this.beep(784, 0.1, 'triangle', 0.036, 1046);
      this.beep(1046, 0.16, 'sine', 0.04, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.062, 240);
      this.beep(220, 0.24, 'sawtooth', 0.048, 52);
      this.beep(120, 0.34, 'sine', 0.04, 36);
    },
    warn() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.028, 90);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.036, 784);
      this.beep(784, 0.14, 'triangle', 0.03, 1176);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.036, 80);
      this.beep(110, 0.32, 'sine', 0.044, 40);
    },
    wave() {
      this.ensure();
      this.beep(330, 0.08, 'sine', 0.036, 494);
      this.beep(494, 0.1, 'sine', 0.036, 659);
      this.beep(784, 0.16, 'triangle', 0.036, 988);
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
      screenFlash(GOLD, 0.5);
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
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 2));
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
      if (G.mode === 'title') stageLabel.textContent = '星系';
      else if (inCave() && G.inside) stageLabel.textContent = G.inside.name;
      else stageLabel.textContent = '第 ' + G.wave + ' 系';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.wave >= 3 || (G.reactor && G.reactor.dead)));
    }
    if (tagLabel) {
      if (G.mode === 'title') tagLabel.textContent = '巡星';
      else if (inCave() && G.reactor && G.reactor.dead) tagLabel.textContent = '逃出 ' + G.escapeT.toFixed(1);
      else if (inCave()) tagLabel.textContent = '井内';
      else tagLabel.textContent = isWell() ? '深井' : '巡星';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || G.fuel < G.fuelMax * 0.18 || (G.reactor && G.reactor.dead && G.escapeT < 3.2));
      tagLabel.classList.toggle('hot', G.combo >= 6 || (G.reactor && G.reactor.dead && G.escapeT >= 3.2));
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (fuelBar) {
      const k = G.fuelMax > 0 ? clamp(G.fuel / G.fuelMax, 0, 1) : 0;
      fuelBar.style.transform = 'scaleX(' + k + ')';
    }
    if (fuelNum) fuelNum.textContent = String(Math.round(G.fuel));
    if (fuelWrap) fuelWrap.classList.toggle('low', G.fuel < G.fuelMax * 0.22 && G.mode === 'play');
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 中弹或撞山扣命', 'warn');
    else if (inCave() && G.reactor && G.reactor.dead) setHint('反应堆已爆 · 飞回入口逃出', 'hot');
    else if (G.fuel < G.fuelMax * 0.18) setHint('燃料将尽 · 射击燃料罐补给', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 减速降落行星', 'warn');
    else if (inCave()) setHint('打碉堡 · 轰反应堆 · 从入口逃出', G.combo >= 5 ? 'hot' : '');
    else setHint('减速靠近发光坪降落 · 恒星有引力', G.combo >= 5 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showSecond) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'RECORD' : 'GRAV';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnPatrol.textContent = primary;
    btnWell.classList.toggle('hidden', !showSecond);
    if (kind === 'lose' || kind === 'win') btnWell.textContent = '换模式';
    else btnWell.textContent = '深井';
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
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
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
    capArr(particles, 420);
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
      life: 0.74,
      text: text,
      rgb: rgb,
      gold: !!gold,
      size: gold ? 16 : 13
    });
    capArr(floats, 28);
  }

  function burstShards(x, y, vx, vy, rgb) {
    for (let i = 0; i < 7; i++) {
      shards.push({
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: vx * 0.3 + rand(-160, 160),
        vy: vy * 0.3 + rand(-180, 80),
        ang: rand(0, TAU),
        spin: rand(-8, 8),
        len: rand(5, 13),
        life: rand(0.5, 0.85),
        max: 0.85,
        rgb: i % 2 ? rgb : WHT
      });
    }
    capArr(shards, 48);
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    shards.length = 0;
    dusts.length = 0;
    G.shots = [];
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.toastT = 0;
    if (toastEl) toastEl.classList.add('hidden');
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.16 ? 1.3 : 0.6,
        a: rand(0.2, 0.86),
        p: Math.random() * TAU,
        rgb: Math.random() < 0.28 ? ICE : Math.random() < 0.14 ? CYN : WHT
      });
    }
  }

  function polylineY(pairs, x) {
    if (x <= pairs[0][0]) return pairs[0][1];
    for (let i = 1; i < pairs.length; i++) {
      if (x <= pairs[i][0]) {
        const a = pairs[i - 1];
        const b = pairs[i];
        const t = (x - a[0]) / Math.max(1e-6, b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return pairs[pairs.length - 1][1];
  }

  function jag(x, a, b) {
    return a * Math.sin(x * 0.071) + b * Math.sin(x * 0.163 + 1.7);
  }

  function profileY(profile, x) {
    if (profile === 0) {
      const u = (x - 400) / 400;
      return 108 + 272 * u * u + jag(x, 7, 5);
    }
    if (profile === 1) {
      return polylineY([
        [0, 64], [68, 72], [128, 352], [248, 338], [328, 196],
        [400, 184], [472, 206], [542, 348], [678, 336], [748, 78], [800, 66]
      ], x) + jag(x, 6, 4);
    }
    if (profile === 2) {
      const d = Math.abs(x - 400);
      let y;
      if (d < 86) y = 428;
      else if (d < 152) y = 428 - (d - 86) * 3.55;
      else if (d < 262) y = 194 + 10 * Math.sin(x * 0.04);
      else y = 84 + 8 * Math.sin(x * 0.05);
      return y + jag(x, 5, 3);
    }
    return polylineY([
      [0, 70], [90, 74], [118, 208], [248, 204], [276, 284],
      [408, 276], [436, 366], [578, 358], [638, 226], [728, 108], [800, 74]
    ], x) + jag(x, 5, 3);
  }

  function profileCeil(profile, x) {
    if (profile === 0 || profile === 3) return -60;
    if (Math.abs(x - 400) < 50) return -60;
    if (profile === 1) return 26 + 8 * Math.sin(x * 0.04) + (Math.abs(x - 400) > 220 ? 10 : 0);
    return 20 + (Math.abs(x - 400) > 190 ? 16 : 4);
  }

  function buildPts(fn) {
    const pts = [];
    for (let x = 0; x <= VW; x += 8) pts.push({ x: x, y: fn(x) });
    return pts;
  }

  function sampleY(pts, x) {
    if (!pts || !pts.length) return VH;
    if (x <= pts[0].x) return pts[0].y;
    const last = pts[pts.length - 1];
    if (x >= last.x) return last.y;
    const step = pts[1].x - pts[0].x || 8;
    const t = (x - pts[0].x) / step;
    const i = Math.min(pts.length - 2, Math.max(0, t | 0));
    const span = pts[i + 1].x - pts[i].x || 1;
    const f = (x - pts[i].x) / span;
    return pts[i].y + (pts[i + 1].y - pts[i].y) * f;
  }

  function planetCount() {
    const base = isWell() ? 4 : 3;
    return Math.min(5, base + Math.max(0, G.wave - 1));
  }

  function buildSystem() {
    G.planets = [];
    const n = planetCount();
    const orbs = [78, 118, 158, 198, 232];
    const spds = [0.23, 0.165, 0.125, 0.092, 0.072];
    for (let i = 0; i < n; i++) {
      const spec = KINDS[i % KINDS.length];
      const a0 = (i / n) * TAU + G.wave * 0.37;
      G.planets.push({
        id: i,
        name: spec.name,
        en: spec.en,
        rgb: spec.rgb,
        profile: spec.profile,
        r: spec.r,
        rad: orbs[i],
        orbit: a0,
        spd: spds[i] * (isWell() ? 1.18 : 1) * (1 + (G.wave - 1) * 0.05),
        x: SUN_X + Math.cos(a0) * orbs[i],
        y: SUN_Y + Math.sin(a0) * orbs[i],
        dead: false
      });
    }
  }

  function bunkerXs(profile, extra) {
    let xs;
    if (profile === 0) xs = [168, 400, 632];
    else if (profile === 1) xs = [190, 400, 558, 668];
    else if (profile === 2) xs = [228, 400, 572];
    else xs = [168, 300, 500, 618];
    if (isWell() || G.wave >= 2) {
      if (profile === 0) xs.push(280);
      if (profile === 2) xs.push(130, 670);
      if (profile === 3) xs.push(430);
    }
    if (extra) xs.push(profile === 3 ? 250 : 500);
    const out = [];
    for (let i = 0; i < xs.length; i++) {
      if (out.indexOf(xs[i]) < 0) out.push(xs[i]);
    }
    return out;
  }

  function fuelXs(profile) {
    if (profile === 0) return [280, 520];
    if (profile === 1) return [330];
    if (profile === 2) return [310, 490];
    return [236, 540];
  }

  function buildCave(planet) {
    const profile = planet.profile;
    G.ground = buildPts(function (x) {
      return clamp(profileY(profile, x), 36, VH - 6);
    });
    const hasCeil = profile === 1 || profile === 2;
    G.ceil = hasCeil
      ? buildPts(function (x) {
        const y = profileCeil(profile, x);
        return y < 0 ? -60 : clamp(y, 8, 80);
      })
      : [];
    G.gate = { x: 400, y: 34, w: 92 };
    const hpB = (isWell() ? 3 : 2) + Math.min(2, G.wave - 1);
    const xs = bunkerXs(profile, G.wave >= 3);
    G.bunkers = [];
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i];
      G.bunkers.push({
        x: x,
        y: sampleY(G.ground, x) - 9,
        hp: hpB,
        hpMax: hpB,
        r: 11,
        cd: 0.5 + i * 0.18,
        alive: true,
        ang: -Math.PI / 2
      });
    }
    const rhp = (isWell() ? 6 : 4) + Math.min(3, G.wave - 1);
    let rx = 400;
    if (profile === 1) rx = 200;
    if (profile === 3) rx = 508;
    G.reactor = {
      x: rx,
      y: sampleY(G.ground, rx) - 18,
      hp: rhp,
      hpMax: rhp,
      r: 16,
      dead: false
    };
    G.fuels = [];
    const fxs = fuelXs(profile);
    for (let i = 0; i < fxs.length; i++) {
      const x = fxs[i];
      G.fuels.push({
        x: x,
        y: sampleY(G.ground, x) - 38,
        r: 8,
        alive: true
      });
    }
    G.escapeT = 0;
    G.escapeMax = 0;
    G.inside = planet;
  }

  function placeShipSpace(kickOut) {
    const s = G.ship;
    if (kickOut && G.inside) {
      const p = G.inside;
      const ang = Math.atan2(p.y - SUN_Y, p.x - SUN_X);
      s.x = p.x + Math.cos(ang) * (p.r + 30);
      s.y = p.y + Math.sin(ang) * (p.r + 30);
      s.vx = Math.cos(ang) * 86;
      s.vy = Math.sin(ang) * 86;
      s.ang = Math.atan2(Math.cos(ang), -Math.sin(ang));
    } else {
      s.x = 400;
      s.y = 428;
      s.vx = 62;
      s.vy = 0;
      s.ang = 0;
    }
  }

  function livingPlanets() {
    let n = 0;
    for (let i = 0; i < G.planets.length; i++) if (!G.planets[i].dead) n += 1;
    return n;
  }

  function clearCave() {
    G.ground = [];
    G.ceil = [];
    G.bunkers = [];
    G.fuels = [];
    G.reactor = null;
    G.inside = null;
    G.escapeT = 0;
  }

  function enterPlanet(p) {
    if (G.mode !== 'play' || p.dead) return;
    const s = G.ship;
    popRing(p.x, p.y, p.rgb, p.r);
    popSpark(s.x, s.y, GOLD, 18);
    emit(16, {
      x: s.x, y: s.y, j: 6,
      vx0: -80, vx1: 80, vy0: -80, vy1: 80,
      r0: 1, r1: 2.4, life: 0.4, rgb: GOLD, g: 0
    });
    G.scene = 'cave';
    buildCave(p);
    s.x = G.gate.x;
    s.y = 48;
    s.vx = 0;
    s.vy = 28;
    s.ang = Math.PI;
    G.shots = [];
    G.invuln = 1.25;
    G.ready = 0.55;
    G.fuel = Math.min(G.fuelMax, G.fuel + 8);
    audio.enter();
    hitStop(0.036);
    kick(2.4);
    screenFlash(p.rgb, 0.42);
    toast(p.name + ' · 潜入', false, true);
    syncHud();
  }

  function escapePlanet() {
    if (G.mode !== 'play' || !G.inside) return;
    const p = G.inside;
    p.dead = true;
    const fuelBonus = Math.round(G.fuel * 2 * modeMul());
    const pts = Math.round((600 + fuelBonus) * modeMul() * (1 + (G.mult - 1) * 0.15));
    addScore(pts);
    popFloat(G.ship.x, G.ship.y - 16, '+' + pts, GOLD, true);
    audio.escape();
    hitStop(0.05);
    kick(4);
    screenFlash(GOLD, 0.55);
    G.scene = 'space';
    placeShipSpace(true);
    G.invuln = 1.4;
    G.shots = [];
    G.fuel = Math.min(G.fuelMax, G.fuel + 24);
    toast(p.name + ' 肃清', false, true);
    clearCave();
    if (livingPlanets() <= 0) G.waveWait = 1.15;
    syncHud();
  }

  function nextWave() {
    G.wave += 1;
    addScore(Math.round(1500 * G.wave * modeMul()));
    buildSystem();
    placeShipSpace(false);
    G.invuln = 1.6;
    G.fuel = G.fuelMax;
    audio.wave();
    screenFlash(ICE, 0.4);
    toast('第 ' + G.wave + ' 系 · 加速', false, true);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'patrol';
    G.scene = 'space';
    G.score = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.combo = 0;
    G.mult = 1;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    G.fuelMax = FUEL_PATROL;
    G.fuel = FUEL_PATROL;
    G.deadT = 0;
    G.invuln = 0;
    clearCave();
    buildSystem();
    G.ship.x = SUN_X + 168;
    G.ship.y = SUN_Y;
    G.ship.vx = 0;
    G.ship.vy = 78;
    G.ship.ang = 0;
    resetFx();
    showOverlay(
      'title',
      '引力',
      '先在星系减速降落行星，再潜入井底炸掉碉堡与反应堆，趁爆炸逃出。燃料有限，中弹或撞山扣命。',
      '巡星',
      true
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'well' ? 'well' : 'patrol';
    G.mode = 'play';
    G.scene = 'space';
    G.score = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    G.fuelMax = fuelMax();
    G.fuel = G.fuelMax;
    G.deadT = 0;
    G.invuln = 1.2;
    G.ready = 0.2;
    G.escapeT = 0;
    G.waveWait = 0;
    G.fireCd = 0;
    clearCave();
    buildSystem();
    placeShipSpace(false);
    resetFx();
    keys.fire = false;
    hideOverlay();
    audio.start();
    if (scoreEl) scoreEl.textContent = '0';
    toast(isWell() ? '深井 · 重力加倍' : '巡星 · 第 1 系', false, true);
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
      rec ? '新纪录' : '船碎了',
      (why ? why + ' · ' : '') + '分数 ' + G.score + ' · 第 ' + G.wave + ' 系' + (rec ? ' · 写入最高' : ''),
      '再来',
      true
    );
    syncHud();
  }

  function killShip(why) {
    if (G.deadT > 0) return;
    if (G.mode !== 'play') return;
    if (G.invuln > 0) return;
    const s = G.ship;
    G.deadT = DEAD_WAIT;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.why = why || '坠毁';
    audio.death();
    hitStop(0.07);
    kick(6.8);
    screenFlash(MAG, 0.74);
    popRing(s.x, s.y, MAG, 14);
    popSpark(s.x, s.y, ORG, 26);
    emit(34, {
      x: s.x, y: s.y, j: 6,
      vx0: -260, vx1: 260, vy0: -240, vy1: 160,
      r0: 1.2, r1: 3.6, life: 0.68, rgb: ORG, g: inCave() ? 40 : 0
    });
    emit(16, {
      x: s.x, y: s.y, j: 4,
      vx0: -180, vx1: 180, vy0: -200, vy1: 90,
      r0: 1, r1: 2.3, life: 0.48, rgb: MAG, g: 0
    });
    burstShards(s.x, s.y, s.vx, s.vy, ICE);
    toast(G.why, true, false);
    syncPips();
  }

  function boomReactor(fromShip) {
    const r = G.reactor;
    if (!r || r.dead) return;
    r.dead = true;
    r.hp = 0;
    G.escapeT = escapeMax();
    G.escapeMax = G.escapeT;
    hitStop(0.08);
    kick(8.2);
    screenFlash(GOLD, 0.88);
    audio.reactorBoom();
    popRing(r.x, r.y, GOLD, 18);
    popRing(r.x, r.y, MAG, 28);
    popSpark(r.x, r.y, GOLD, 42);
    emit(52, {
      x: r.x, y: r.y, j: 10,
      vx0: -300, vx1: 300, vy0: -360, vy1: 140,
      r0: 1.5, r1: 4.4, life: 0.95, rgb: GOLD, g: 48
    });
    emit(28, {
      x: r.x, y: r.y, j: 8,
      vx0: -240, vx1: 240, vy0: -280, vy1: 80,
      r0: 1.2, r1: 3.2, life: 0.72, rgb: MAG, g: 30
    });
    emit(22, {
      x: r.x, y: r.y, j: 6,
      vx0: -180, vx1: 180, vy0: -220, vy1: 40,
      r0: 1, r1: 2.6, life: 0.6, rgb: CYN, g: 18
    });
    burstShards(r.x, r.y, 0, -40, GOLD);
    if (fromShip) {
      bumpCombo();
      const pts = Math.round(420 * G.mult * modeMul());
      addScore(pts);
      popFloat(r.x, r.y - 18, '+' + pts, GOLD, true);
    }
    for (let i = 0; i < G.bunkers.length; i++) {
      const b = G.bunkers[i];
      if (!b.alive) continue;
      if (hypot(b.x - r.x, b.y - r.y) < 96) {
        b.alive = false;
        emit(10, {
          x: b.x, y: b.y, j: 4,
          vx0: -120, vx1: 120, vy0: -140, vy1: 40,
          r0: 1, r1: 2.4, life: 0.4, rgb: MAG, g: 20
        });
      }
    }
    toast('反应堆引爆 · 快逃', false, true);
  }

  function hurtBunker(b, fromShip) {
    if (!b.alive) return;
    b.hp -= 1;
    popSpark(b.x, b.y, GOLD, 12);
    emit(8, {
      x: b.x, y: b.y, j: 4,
      vx0: -90, vx1: 90, vy0: -120, vy1: 20,
      r0: 1, r1: 2.2, life: 0.32, rgb: GOLD, g: 30
    });
    audio.hit();
    hitStop(0.034);
    kick(2.1);
    if (fromShip) {
      bumpCombo();
      addScore(Math.round(18 * G.mult * modeMul()));
    }
    if (b.hp <= 0) {
      b.alive = false;
      emit(18, {
        x: b.x, y: b.y, j: 6,
        vx0: -180, vx1: 180, vy0: -200, vy1: 80,
        r0: 1.1, r1: 3, life: 0.5, rgb: MAG, g: 36
      });
      popRing(b.x, b.y, MAG, 10);
      burstShards(b.x, b.y, 0, -30, ICE);
      audio.bunkDown();
      hitStop(0.05);
      kick(3.5);
      if (fromShip) {
        const pts = Math.round(90 * G.mult * modeMul());
        addScore(pts);
        popFloat(b.x, b.y - 14, '+' + pts, GOLD, G.mult > 1);
      }
    }
  }

  function grabFuel(f, fromShip) {
    if (!f.alive) return;
    f.alive = false;
    G.fuel = Math.min(G.fuelMax, G.fuel + 32);
    audio.fuel();
    popRing(f.x, f.y, CYN, 10);
    popSpark(f.x, f.y, GOLD, 14);
    emit(12, {
      x: f.x, y: f.y, j: 5,
      vx0: -70, vx1: 70, vy0: -90, vy1: 20,
      r0: 1, r1: 2.3, life: 0.4, rgb: CYN, g: 10
    });
    if (fromShip) {
      bumpCombo();
      const pts = Math.round(40 * G.mult * modeMul());
      addScore(pts);
      popFloat(f.x, f.y - 12, '+' + pts, CYN, false);
    }
    toast('燃料 +32', false, true);
  }

  function hurtReactor(fromShip) {
    const r = G.reactor;
    if (!r || r.dead) return;
    r.hp -= 1;
    popSpark(r.x, r.y, GOLD, 16);
    emit(10, {
      x: r.x, y: r.y, j: 5,
      vx0: -110, vx1: 110, vy0: -130, vy1: 30,
      r0: 1.1, r1: 2.6, life: 0.36, rgb: GOLD, g: 24
    });
    audio.reactorHit();
    hitStop(0.04);
    kick(2.8);
    if (fromShip) {
      bumpCombo();
      addScore(Math.round(50 * G.mult * modeMul()));
    }
    if (r.hp <= 0) boomReactor(fromShip);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || overlayOpen()) return;
    if (G.fireCd > 0) return;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].from === 'ship') n += 1;
    if (n >= MAX_SHOTS) return;
    const s = G.ship;
    const nx = s.x + Math.sin(s.ang) * 13;
    const ny = s.y - Math.cos(s.ang) * 13;
    G.shots.push({
      x: nx,
      y: ny,
      vx: Math.sin(s.ang) * SHOT_V + s.vx * 0.18,
      vy: -Math.cos(s.ang) * SHOT_V + s.vy * 0.18,
      life: SHOT_LIFE,
      from: 'ship',
      trail: []
    });
    G.fireCd = FIRE_CD;
    audio.shoot();
    emit(2, {
      x: nx, y: ny, j: 1.2,
      vx0: -20, vx1: 20, vy0: -20, vy1: 20,
      r0: 0.8, r1: 1.5, life: 0.12, rgb: WHT, g: 0
    });
  }

  function bunkerFire(b) {
    const s = G.ship;
    const dx = s.x - b.x;
    const dy = s.y - b.y;
    const d = hypot(dx, dy) || 1;
    const v = bunkShotV();
    G.shots.push({
      x: b.x + (dx / d) * 12,
      y: b.y + (dy / d) * 12,
      vx: (dx / d) * v,
      vy: (dy / d) * v,
      life: 2.4,
      from: 'bunk',
      trail: []
    });
    b.cd = bunkCd();
    audio.beep(220, 0.05, 'square', 0.018, 90);
  }

  function applyThrust(dt) {
    const s = G.ship;
    if (G.fuel <= 0 && G.mode === 'play') return false;
    const use = FUEL_USE;
    const spent = G.mode === 'play' ? Math.min(G.fuel, use * dt) : use * dt;
    if (G.mode === 'play') G.fuel -= spent;
    const k = G.mode === 'play' ? spent / (use * dt) : 1;
    const power = (inCave() ? THRUST_C : THRUST_S) * k;
    s.vx += Math.sin(s.ang) * power * dt;
    s.vy -= Math.cos(s.ang) * power * dt;
    const bx = s.x - Math.sin(s.ang) * 11;
    const by = s.y + Math.cos(s.ang) * 11;
    const backx = -Math.sin(s.ang);
    const backy = Math.cos(s.ang);
    emit(2, {
      x: bx, y: by, j: 1.4,
      vx0: backx * 50 + s.vx * 0.2, vx1: backx * 150 + s.vx * 0.2,
      vy0: backy * 50 + s.vy * 0.2, vy1: backy * 150 + s.vy * 0.2,
      r0: 1.05, r1: 2.4, life: 0.16,
      rgb: Math.random() < 0.45 ? GOLD : (Math.random() < 0.5 ? CYN : ORG),
      g: inCave() ? 20 : 0
    });
    return true;
  }

  function shipHitsTerrain(s) {
    if (!G.ground.length) return false;
    const xs = [s.x, s.x - 6, s.x + 6];
    for (let i = 0; i < xs.length; i++) {
      const gy = sampleY(G.ground, xs[i]);
      if (s.y + SHIP_R > gy) return true;
      if (G.ceil.length) {
        const cy = sampleY(G.ceil, xs[i]);
        if (cy >= 0 && s.y - SHIP_R < cy) return true;
      }
    }
    return false;
  }

  function shotHitsTerrain(s) {
    if (!G.ground.length) return false;
    const gy = sampleY(G.ground, s.x);
    if (s.y >= gy) return true;
    if (G.ceil.length) {
      const cy = sampleY(G.ceil, s.x);
      if (cy >= 0 && s.y <= cy) return true;
    }
    return false;
  }

  function demoSpace(dt) {
    const s = G.ship;
    const dx = s.x - SUN_X;
    const dy = s.y - SUN_Y;
    const r = hypot(dx, dy) || 160;
    const want = 168;
    const tx = -dy / r;
    const ty = dx / r;
    const spd = 78;
    s.vx = tx * spd + (want - r) * (dx / r) * 0.45;
    s.vy = ty * spd + (want - r) * (dy / r) * 0.45;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.ang = Math.atan2(s.vx, -s.vy);
    G.thrustT -= dt;
    if (G.thrustT <= 0) {
      G.thrustT = 0.08;
      const bx = s.x - Math.sin(s.ang) * 11;
      const by = s.y + Math.cos(s.ang) * 11;
      emit(1, {
        x: bx, y: by, j: 1,
        vx0: -20, vx1: 20, vy0: -20, vy1: 20,
        r0: 1, r1: 1.8, life: 0.14, rgb: GOLD, g: 0
      });
    }
  }

  function updatePlanets(dt) {
    for (let i = 0; i < G.planets.length; i++) {
      const p = G.planets[i];
      p.orbit += p.spd * dt;
      p.x = SUN_X + Math.cos(p.orbit) * p.rad;
      p.y = SUN_Y + Math.sin(p.orbit) * p.rad;
    }
  }

  function updatePlayer(dt) {
    const s = G.ship;
    const live = G.mode === 'play' && G.deadT <= 0;
    if (!live) return;
    if (keys.l) s.ang -= ROT * dt;
    if (keys.r) s.ang += ROT * dt;
    if (keys.u) {
      const ok = applyThrust(dt);
      if (ok) {
        G.thrustT -= dt;
        if (G.thrustT <= 0) {
          G.thrustT = 0.068;
          audio.thrust();
        }
        if (!REDUCE) G.punch = Math.max(G.punch, 1.008);
      } else {
        G.warnT -= dt;
        if (G.warnT <= 0) {
          G.warnT = 0.72;
          audio.warn();
          toast('燃料耗尽', true, false);
        }
      }
    }
    if (inCave()) {
      s.vy += gravCave() * dt;
      const drag = Math.exp(-DRAG_C * dt);
      s.vx *= drag;
      s.vy *= drag;
      const spd = hypot(s.vx, s.vy);
      if (spd > MAX_V_C) {
        s.vx *= MAX_V_C / spd;
        s.vy *= MAX_V_C / spd;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.x = clamp(s.x, 10, VW - 10);
      if (s.y < 8) s.y = 8;
      if (G.invuln <= 0 && shipHitsTerrain(s)) killShip('撞上岩壁');
    } else {
      const dx = SUN_X - s.x;
      const dy = SUN_Y - s.y;
      let r = hypot(dx, dy);
      if (r < 12) r = 12;
      const f = gravSun() / (r * r + sunSoft());
      s.vx += (f * dx / r) * dt;
      s.vy += (f * dy / r) * dt;
      const drag = Math.exp(-DRAG_S * dt);
      s.vx *= drag;
      s.vy *= drag;
      const spd = hypot(s.vx, s.vy);
      if (spd > MAX_V_S) {
        s.vx *= MAX_V_S / spd;
        s.vy *= MAX_V_S / spd;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.x = wrap(s.x, VW);
      s.y = wrap(s.y, VH);
      const sr = hypot(SUN_X - s.x, SUN_Y - s.y);
      if (G.invuln <= 0 && sr < SUN_R + SHIP_R - 1) killShip('坠入恒星');
    }
  }

  function updateBunkers(dt) {
    if (!inCave() || G.mode !== 'play' || G.deadT > 0) return;
    const s = G.ship;
    const range = isWell() ? 268 : 236;
    for (let i = 0; i < G.bunkers.length; i++) {
      const b = G.bunkers[i];
      if (!b.alive) continue;
      b.ang = Math.atan2(s.y - b.y, s.x - b.x);
      if (b.cd > 0) b.cd -= dt;
      if (G.invuln > 0 || G.ready > 0) continue;
      const d = hypot(s.x - b.x, s.y - b.y);
      if (d < range && b.cd <= 0) bunkerFire(b);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      if (!REDUCE) {
        if (!s.trail) s.trail = [];
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 5) s.trail.shift();
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (!inCave()) {
        s.x = wrap(s.x, VW);
        s.y = wrap(s.y, VH);
      }
      if (s.life <= 0 || s.x < -20 || s.x > VW + 20 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      if (inCave() && shotHitsTerrain(s)) {
        emit(3, {
          x: s.x, y: s.y, j: 2,
          vx0: -40, vx1: 40, vy0: -50, vy1: 10,
          r0: 0.8, r1: 1.6, life: 0.16, rgb: s.from === 'bunk' ? MAG : ICE, g: 20
        });
        G.shots.splice(i, 1);
      }
    }
  }

  function collide() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const ship = G.ship;

    for (let i = 0; i < G.shots.length; i++) {
      const a = G.shots[i];
      if (a.from !== 'ship' || a.dead) continue;
      for (let j = 0; j < G.shots.length; j++) {
        const b = G.shots[j];
        if (b.from !== 'bunk' || b.dead) continue;
        if (hypot(a.x - b.x, a.y - b.y) < 8) {
          a.dead = true;
          b.dead = true;
          popSpark((a.x + b.x) * 0.5, (a.y + b.y) * 0.5, CYN, 8);
          audio.hit();
          bumpCombo();
          addScore(Math.round(12 * G.mult * modeMul()));
          break;
        }
      }
    }
    for (let i = G.shots.length - 1; i >= 0; i--) {
      if (G.shots[i].dead) G.shots.splice(i, 1);
    }

    if (inCave()) {
      for (let i = G.shots.length - 1; i >= 0; i--) {
        const s = G.shots[i];
        if (s.from === 'ship') {
          let hit = false;
          for (let k = 0; k < G.bunkers.length; k++) {
            const b = G.bunkers[k];
            if (!b.alive) continue;
            if (hypot(s.x - b.x, s.y - b.y) < b.r + 3) {
              hurtBunker(b, true);
              hit = true;
              break;
            }
          }
          if (!hit && G.reactor && !G.reactor.dead && hypot(s.x - G.reactor.x, s.y - G.reactor.y) < G.reactor.r + 3) {
            hurtReactor(true);
            hit = true;
          }
          if (!hit) {
            for (let k = 0; k < G.fuels.length; k++) {
              const f = G.fuels[k];
              if (!f.alive) continue;
              if (hypot(s.x - f.x, s.y - f.y) < f.r + 4) {
                grabFuel(f, true);
                hit = true;
                break;
              }
            }
          }
          if (hit) G.shots.splice(i, 1);
        } else if (s.from === 'bunk' && G.invuln <= 0) {
          if (hypot(s.x - ship.x, s.y - ship.y) < SHIP_R + 3) {
            G.shots.splice(i, 1);
            killShip('碉堡击中');
          }
        }
      }
      if (G.invuln <= 0 && G.deadT <= 0) {
        for (let k = 0; k < G.bunkers.length; k++) {
          const b = G.bunkers[k];
          if (!b.alive) continue;
          if (hypot(ship.x - b.x, ship.y - b.y) < b.r + SHIP_R - 2) {
            killShip('撞上碉堡');
            break;
          }
        }
      }
      if (G.deadT <= 0 && G.reactor && !G.reactor.dead && G.invuln <= 0) {
        if (hypot(ship.x - G.reactor.x, ship.y - G.reactor.y) < G.reactor.r + SHIP_R - 2) {
          killShip('撞上反应堆');
        }
      }
      if (G.deadT <= 0) {
        for (let k = 0; k < G.fuels.length; k++) {
          const f = G.fuels[k];
          if (!f.alive) continue;
          if (hypot(ship.x - f.x, ship.y - f.y) < f.r + SHIP_R) grabFuel(f, true);
        }
      }
      if (G.deadT <= 0 && G.reactor && G.reactor.dead) {
        if (ship.y < 50 && Math.abs(ship.x - G.gate.x) < G.gate.w * 0.5) escapePlanet();
      }
    } else if (G.invuln <= 0) {
      const spd = hypot(ship.vx, ship.vy);
      for (let i = 0; i < G.planets.length; i++) {
        const p = G.planets[i];
        if (p.dead) continue;
        const d = hypot(ship.x - p.x, ship.y - p.y);
        if (d < p.r + SHIP_R + 2) {
          if (spd <= landMax()) enterPlanet(p);
          else killShip('降落太快');
          break;
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
      q.vx *= Math.exp(-dt * 1.05);
      q.vy *= Math.exp(-dt * 1.05);
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
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.ang += s.spin * dt;
      s.vx *= Math.exp(-dt * 0.7);
      s.vy *= Math.exp(-dt * 0.7);
      if (inCave()) s.vy += 30 * dt;
      if (s.life <= 0) shards.splice(i, 1);
    }
    if (inCave() && !REDUCE) {
      G.dustT -= dt;
      if (G.dustT <= 0) {
        G.dustT = 0.08;
        dusts.push({
          x: rand(20, VW - 20),
          y: rand(50, 200),
          vy: rand(18, 42),
          a: rand(0.12, 0.32),
          r: rand(0.5, 1.1),
          life: rand(1.1, 2.2)
        });
        capArr(dusts, 40);
      }
    }
    for (let i = dusts.length - 1; i >= 0; i--) {
      const d = dusts[i];
      d.life -= dt;
      d.y += d.vy * dt;
      if (d.life <= 0 || d.y > VH - 20) dusts.splice(i, 1);
    }
  }

  function playSim(dt) {
    if (G.ready > 0) G.ready -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    updatePlanets(dt);
    updatePlayer(dt);
    updateBunkers(dt);
    updateShots(dt);
    if (G.mode === 'play' && keys.fire) fire();
    if (G.mode === 'play') collide();

    if (G.mode === 'play' && inCave() && G.reactor && G.reactor.dead && G.deadT <= 0) {
      G.escapeT -= dt;
      if (G.escapeT <= 0) killShip('没能逃出');
    }

    if (G.mode === 'play' && G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '船碎了');
          return;
        }
        G.scene = 'space';
        clearCave();
        placeShipSpace(false);
        G.shots = [];
        G.invuln = 1.85;
        G.fuel = Math.max(G.fuel, G.fuelMax * 0.42);
        toast('剩余 ' + G.lives + ' 命', true, false);
        syncHud();
      }
    }

    if (G.mode === 'play' && !inCave() && G.waveWait > 0) {
      G.waveWait -= dt;
      if (G.waveWait <= 0) nextWave();
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
      updatePlanets(dt);
      demoSpace(dt);
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose') {
      updatePlanets(dt);
      updateShots(dt);
      if (inCave()) updateBunkers(dt);
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

  function drawBgSpace() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#12081e');
    g.addColorStop(0.55, '#0a0614');
    g.addColorStop(1, '#070410');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(SUN_X), sy(SUN_Y), 20 * scale, sx(SUN_X), sy(SUN_Y), 280 * scale);
    vg.addColorStop(0, 'rgba(255, 227, 107, 0.08)');
    vg.addColorStop(0.35, 'rgba(180, 140, 255, 0.06)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = REDUCE ? s.a : s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }

    ctx.save();
    ctx.strokeStyle = rgba(ICE, 0.12);
    ctx.lineWidth = 1 * scale;
    const orbs = [78, 118, 158, 198, 232];
    for (let i = 0; i < planetCount(); i++) {
      ctx.beginPath();
      ctx.arc(sx(SUN_X), sy(SUN_Y), orbs[i] * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBgCave() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#140820');
    g.addColorStop(0.45, '#0c0616');
    g.addColorStop(1, '#1a0a14');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const haze = ctx.createRadialGradient(sx(400), sy(VH), 10 * scale, sx(400), sy(VH), 260 * scale);
    haze.addColorStop(0, 'rgba(255, 61, 184, 0.08)');
    haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i += 2) {
      const s = stars[i];
      ctx.fillStyle = rgba(s.rgb, s.a * 0.28);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y * 0.45 + 8), s.r * 0.7 * scale, 0, TAU);
      ctx.fill();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < dusts.length; i++) {
      const d = dusts[i];
      ctx.fillStyle = rgba(ICE, d.a * clamp(d.life, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(d.x), sy(d.y), d.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSun() {
    const pulse = REDUCE ? 1 : 1 + 0.04 * Math.sin(G.t * 3.2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(GOLD, 0.16);
    ctx.lineWidth = 7 * scale;
    ctx.beginPath();
    ctx.arc(sx(SUN_X), sy(SUN_Y), SUN_R * 1.55 * pulse * scale, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(ORG, 0.85);
    ctx.lineWidth = 1.7 * scale;
    ctx.beginPath();
    ctx.arc(sx(SUN_X), sy(SUN_Y), SUN_R * scale, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.arc(sx(SUN_X), sy(SUN_Y), SUN_R * 0.55 * scale, 0, TAU);
    ctx.stroke();
    const n = 7;
    ctx.strokeStyle = rgba(GOLD, 0.35);
    ctx.lineWidth = 1 * scale;
    for (let i = 0; i < n; i++) {
      const a = G.t * 0.4 + (i / n) * TAU;
      ctx.beginPath();
      ctx.moveTo(sx(SUN_X + Math.cos(a) * SUN_R * 0.7), sy(SUN_Y + Math.sin(a) * SUN_R * 0.7));
      ctx.lineTo(sx(SUN_X + Math.cos(a) * SUN_R * 1.35), sy(SUN_Y + Math.sin(a) * SUN_R * 1.35));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlanets() {
    const ship = G.ship;
    const spd = hypot(ship.vx, ship.vy);
    for (let i = 0; i < G.planets.length; i++) {
      const p = G.planets[i];
      const ang = Math.atan2(p.y - SUN_Y, p.x - SUN_X);
      const px = p.x + Math.cos(ang) * p.r;
      const py = p.y + Math.sin(ang) * p.r;
      const d = hypot(ship.x - p.x, ship.y - p.y);
      const near = !p.dead && d < p.r + 40 && spd < landMax() * 1.35;
      ctx.save();
      if (p.dead) {
        ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.strokeStyle = rgba(DIM, 0.7);
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
        ctx.stroke();
        ctx.restore();
        continue;
      }
      ctx.strokeStyle = rgba(p.rgb, near ? 0.28 : 0.16);
      ctx.lineWidth = 5 * scale;
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(p.rgb, 1);
      ctx.lineWidth = 1.45 * scale;
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.stroke();
      const tx = -Math.sin(ang);
      const ty = Math.cos(ang);
      ctx.strokeStyle = rgba(near ? GOLD : WHT, near ? 1 : 0.75);
      ctx.lineWidth = (near ? 2.4 : 1.6) * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(px - tx * 7), sy(py - ty * 7));
      ctx.lineTo(sx(px + tx * 7), sy(py + ty * 7));
      ctx.stroke();
      if (near) {
        ctx.strokeStyle = rgba(GOLD, 0.45 + 0.25 * Math.sin(G.t * 8));
        ctx.lineWidth = 1.1 * scale;
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), (p.r + 6 + Math.sin(G.t * 6) * 2) * scale, 0, TAU);
        ctx.stroke();
      }
      if (d < p.r + 56) {
        ctx.fillStyle = rgba(near ? GOLD : WHT, 0.85);
        ctx.font = '700 ' + (9 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(near ? '降落 ' + p.name : p.name, sx(p.x), sy(p.y - p.r - 6));
      }
      ctx.restore();
    }
  }

  function drawTerrain() {
    if (!G.ground.length) return;
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(VH));
    for (let i = 0; i < G.ground.length; i++) {
      ctx.lineTo(sx(G.ground[i].x), sy(G.ground[i].y));
    }
    ctx.lineTo(sx(VW), sy(VH));
    ctx.closePath();
    const fill = ctx.createLinearGradient(sx(0), sy(80), sx(0), sy(VH));
    fill.addColorStop(0, '#1a1028');
    fill.addColorStop(1, '#0c0614');
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.beginPath();
    for (let i = 0; i < G.ground.length; i++) {
      const p = G.ground[i];
      if (i === 0) ctx.moveTo(sx(p.x), sy(p.y));
      else ctx.lineTo(sx(p.x), sy(p.y));
    }
    ctx.strokeStyle = rgba(ICE, 0.2);
    ctx.lineWidth = 5 * scale;
    ctx.stroke();
    ctx.strokeStyle = rgba(ICE, 0.95);
    ctx.lineWidth = 1.55 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (G.ceil.length) {
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(0));
      for (let i = 0; i < G.ceil.length; i++) {
        const y = G.ceil[i].y < 0 ? 0 : G.ceil[i].y;
        ctx.lineTo(sx(G.ceil[i].x), sy(y));
      }
      ctx.lineTo(sx(VW), sy(0));
      ctx.closePath();
      ctx.fillStyle = '#14081c';
      ctx.fill();
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i < G.ceil.length; i++) {
        const p = G.ceil[i];
        if (p.y < 0) {
          pen = false;
          continue;
        }
        if (!pen) {
          ctx.moveTo(sx(p.x), sy(p.y));
          pen = true;
        } else ctx.lineTo(sx(p.x), sy(p.y));
      }
      ctx.strokeStyle = rgba(MAG, 0.85);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }

    const gate = G.gate;
    const ready = G.reactor && G.reactor.dead;
    const glow = ready ? 0.55 + 0.45 * Math.sin(G.t * 10) : 0.4;
    ctx.save();
    ctx.strokeStyle = rgba(ready ? GOLD : CYN, glow);
    ctx.lineWidth = (ready ? 2.6 : 1.6) * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(gate.x - gate.w * 0.5), sy(gate.y + 8));
    ctx.lineTo(sx(gate.x - gate.w * 0.5), sy(4));
    ctx.lineTo(sx(gate.x + gate.w * 0.5), sy(4));
    ctx.lineTo(sx(gate.x + gate.w * 0.5), sy(gate.y + 8));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(gate.x - 18), sy(gate.y + 10));
    ctx.lineTo(sx(gate.x + 18), sy(gate.y + 10));
    ctx.strokeStyle = rgba(ready ? GOLD : WHT, 0.9);
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    if (ready) {
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.font = '700 ' + (11 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('逃出', sx(gate.x), sy(gate.y + 14));
    }
    ctx.restore();
  }

  function drawBunkers() {
    for (let i = 0; i < G.bunkers.length; i++) {
      const b = G.bunkers[i];
      if (!b.alive) continue;
      ctx.save();
      ctx.translate(sx(b.x), sy(b.y));
      ctx.strokeStyle = rgba(MAG, 0.22);
      ctx.lineWidth = 4.2 * scale;
      ctx.strokeRect(-9 * scale, -6 * scale, 18 * scale, 12 * scale);
      ctx.strokeStyle = rgba(MAG, 1);
      ctx.lineWidth = 1.45 * scale;
      ctx.strokeRect(-9 * scale, -6 * scale, 18 * scale, 12 * scale);
      ctx.rotate(b.ang);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(14 * scale, 0);
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
      ctx.restore();
      if (b.hp < b.hpMax) {
        const k = b.hp / b.hpMax;
        ctx.fillStyle = rgba(MAG, 0.25);
        ctx.fillRect(sx(b.x - 8), sy(b.y - 16), 16 * scale, 2.2 * scale);
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.fillRect(sx(b.x - 8), sy(b.y - 16), 16 * k * scale, 2.2 * scale);
      }
    }
  }

  function drawReactor() {
    const r = G.reactor;
    if (!r) return;
    ctx.save();
    ctx.translate(sx(r.x), sy(r.y));
    const pulse = REDUCE ? 1 : 1 + 0.08 * Math.sin(G.t * 7);
    if (!r.dead) {
      ctx.strokeStyle = rgba(GOLD, 0.2);
      ctx.lineWidth = 6 * scale;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU + G.t * 0.4;
        const x = Math.cos(a) * r.r * pulse * scale;
        const y = Math.sin(a) * r.r * pulse * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 1);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r.r * 0.38 * pulse * scale, 0, TAU);
      ctx.strokeStyle = rgba(MAG, 0.95);
      ctx.lineWidth = 1.3 * scale;
      ctx.stroke();
      const cracks = r.hpMax - r.hp;
      ctx.strokeStyle = rgba(MAG, 0.8);
      ctx.lineWidth = 1 * scale;
      for (let i = 0; i < cracks; i++) {
        const a = i * 1.1 + 0.4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 4 * scale, Math.sin(a) * 4 * scale);
        ctx.lineTo(Math.cos(a) * r.r * 0.9 * scale, Math.sin(a) * r.r * 0.9 * scale);
        ctx.stroke();
      }
    } else {
      const flick = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(G.t * 22));
      ctx.strokeStyle = rgba(GOLD, 0.35 * flick);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, (r.r + 8 + flick * 10) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    if (!r.dead) {
      const k = r.hp / r.hpMax;
      ctx.fillStyle = rgba(DIM, 0.45);
      ctx.fillRect(sx(r.x - 14), sy(r.y - 28), 28 * scale, 3 * scale);
      ctx.fillStyle = rgba(k < 0.4 ? MAG : GOLD, 0.95);
      ctx.fillRect(sx(r.x - 14), sy(r.y - 28), 28 * k * scale, 3 * scale);
    }
  }

  function drawFuels() {
    for (let i = 0; i < G.fuels.length; i++) {
      const f = G.fuels[i];
      if (!f.alive) continue;
      const bob = REDUCE ? 0 : Math.sin(G.t * 4 + f.x * 0.02) * 2.2;
      ctx.save();
      ctx.translate(sx(f.x), sy(f.y + bob));
      ctx.strokeStyle = rgba(CYN, 0.9);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -8 * scale);
      ctx.lineTo(7 * scale, 0);
      ctx.lineTo(0, 8 * scale);
      ctx.lineTo(-7 * scale, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -4 * scale);
      ctx.lineTo(0, 4 * scale);
      ctx.moveTo(-4 * scale, 0);
      ctx.lineTo(4 * scale, 0);
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShipShape(x, y, ang, thrusting, ghost) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, -14 * scale);
    ctx.lineTo(9.5 * scale, 12 * scale);
    ctx.lineTo(0, 7 * scale);
    ctx.lineTo(-9.5 * scale, 12 * scale);
    ctx.closePath();
    ctx.strokeStyle = rgba(WHT, ghost ? 0.34 : 1);
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
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    const s = G.ship;
    const thrusting = (G.mode === 'play' && keys.u && G.fuel > 0) || G.mode === 'title';
    const ghost = G.mode === 'title';
    if (inCave() && G.mode !== 'title') drawShipShape(s.x, s.y, s.ang, thrusting, ghost);
    else {
      forWrap(s.x, s.y, 16, function (x, y) {
        drawShipShape(x, y, s.ang, thrusting, ghost);
      });
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const rgb = s.from === 'bunk' ? MAG : WHT;
      const spd = hypot(s.vx, s.vy) || 1;
      const dx = s.vx / spd;
      const dy = s.vy / spd;
      if (s.trail && !REDUCE) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          ctx.strokeStyle = rgba(s.from === 'bunk' ? MAG : CYN, 0.08 + t * 0.07);
          ctx.lineWidth = (1 + t * 0.12) * scale;
          ctx.beginPath();
          ctx.moveTo(sx(p.x - dx * 3), sy(p.y - dy * 3));
          ctx.lineTo(sx(p.x + dx * 3), sy(p.y + dy * 3));
          ctx.stroke();
        }
      }
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = (s.from === 'bunk' ? 2.2 : 1.8) * scale;
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
      const k = s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, 0.5 * (1 - k));
      ctx.lineWidth = (2.1 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + k * 28) * scale, 0, TAU);
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
    ctx.fillStyle = '#080410';
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
    if (inCave() && G.mode !== 'title') {
      drawBgCave();
      drawTerrain();
      drawBunkers();
      drawReactor();
      drawFuels();
      drawShots();
      drawShip();
    } else {
      drawBgSpace();
      drawSun();
      drawPlanets();
      drawShots();
      drawShip();
    }
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
    if (G.mode === 'title') startGame('patrol');
    else startGame(G.kind || 'patrol');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('patrol');
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
      startGame('patrol');
    }
    if ((k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') {
      startGame('well');
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

  if (btnPatrol) {
    btnPatrol.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('patrol');
    });
  }
  if (btnWell) {
    btnWell.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('well');
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
