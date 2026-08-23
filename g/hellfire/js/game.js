'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 4.7;
  const SHOT_V = 680;
  const OPT_MAX = 2;
  const BEST_KEY = 'playbox-hellfire-best';
  const MUTE_KEY = 'playbox-hellfire-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 切向 · R 重开 · M 静音';
  const LEAD = '左飞右打。空格连射，Shift 切前/后/竖/斜四向火。捡子机一起打。撞机掉命。熔岸烧完出关底王。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const FIRE = [255, 74, 20];
  const AMB = [255, 138, 40];
  const GOLD = [255, 227, 107];
  const CYN = [46, 232, 255];
  const MAG = [255, 61, 184];
  const WHT = [255, 240, 224];
  const DEEP = [28, 10, 6];
  const PNK = [255, 154, 180];
  const DIR_RGB = [FIRE, CYN, GOLD, MAG];
  const DIR_NAME = ['前', '后', '竖', '斜'];
  const DIR_CLS = ['front', 'rear', 'vert', 'diag'];
  const BOSS_NAME = ['炎门', '熔核', '狱核'];

  const SCORE = {
    imp: 50,
    dive: 80,
    chase: 90,
    turret: 150,
    elite: 240,
    carrier: 280,
    drop: 90,
    boss: 9000,
    stage: 1600,
    opt: 500
  };

  const STAGES = [
    {
      name: '熔岸',
      waves: [
        { t: 0.6, kind: 'v', n: 5 },
        { t: 2.6, kind: 'chase' },
        { t: 4.6, kind: 'stream' },
        { t: 6.6, kind: 'turrets' },
        { t: 8.6, kind: 'v', n: 7 },
        { t: 10.8, kind: 'carrier' },
        { t: 12.8, kind: 'chase' },
        { t: 14.8, kind: 'elite' },
        { t: 17.0, kind: 'v', n: 7 },
        { t: 19.2, kind: 'boss' }
      ]
    },
    {
      name: '核谷',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.2, kind: 'drop', n: 4 },
        { t: 4.2, kind: 'turrets' },
        { t: 6.0, kind: 'chase' },
        { t: 7.8, kind: 'stream' },
        { t: 9.6, kind: 'elite' },
        { t: 11.4, kind: 'carrier' },
        { t: 13.2, kind: 'v', n: 9 },
        { t: 15.2, kind: 'drop', n: 5 },
        { t: 17.2, kind: 'elite' },
        { t: 19.2, kind: 'boss' }
      ]
    },
    {
      name: '狱门',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.0, kind: 'chase' },
        { t: 3.8, kind: 'elite' },
        { t: 5.6, kind: 'turrets' },
        { t: 7.2, kind: 'carrier' },
        { t: 9.0, kind: 'v', n: 9 },
        { t: 10.8, kind: 'drop', n: 5 },
        { t: 12.6, kind: 'elite' },
        { t: 14.4, kind: 'chase' },
        { t: 16.2, kind: 'stream' },
        { t: 18.2, kind: 'boss' }
      ]
    }
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
  const btnHell = document.getElementById('btn-hell');
  const btnSea = document.getElementById('btn-sea');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnOpt = document.getElementById('btn-opt');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const dirLabel = document.getElementById('dir-label');
  const optLabel = document.getElementById('opt-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
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
  let dirTok = 0;
  let optTok = 0;
  let uidSeq = 1;
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'hell',
    t: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    dir: 0,
    opts: 0,
    hist: [],
    enemies: [],
    shots: [],
    bullets: [],
    drops: [],
    ship: { x: 96, y: VH * 0.5, vx: 0, vy: 0 },
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: FIRE,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0
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
  function isSea() {
    return G.kind === 'sea';
  }
  function dens() {
    return isSea() ? 1.26 : 1;
  }
  function shipSpeed() {
    return isSea() ? 314 : 272;
  }
  function fireRate() {
    return isSea() ? 0.078 : 0.092;
  }
  function bulletSpd() {
    return isSea() ? 188 : 148;
  }
  function scrollSpd() {
    if (hasBoss()) return 24;
    return isSea() ? 136 : 96;
  }
  function hpMul() {
    return isSea() ? 1.22 : 1;
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor((Math.max(1, G.combo) - 1) / 3));
  }
  function bossHp() {
    const base = G.stage === 1 ? 108 : G.stage === 2 ? 146 : 214;
    return isSea() ? Math.round(base * 1.22) : base;
  }
  function bossR() {
    return G.stage === 1 ? 46 : G.stage === 2 ? 52 : 60;
  }
  function dirRgb() {
    return DIR_RGB[G.dir] || FIRE;
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
      const f = [760, 420, 920, 640][G.dir] || 760;
      this.beep(f, 0.038, 'square', 0.024, f * 1.7);
      this.beep(210, 0.03, 'sawtooth', 0.012, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.028, 0.028, 1500);
      this.beep(680 * lift, 0.055, 'square', 0.034, 1040 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.038, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.03, 1176);
    },
    explode() {
      this.ensure();
      this.noise(0.11, 0.05, 480);
      this.beep(260, 0.15, 'sawtooth', 0.046, 62);
    },
    cycle(d) {
      this.ensure();
      const f = [520, 330, 660, 880][d] || 520;
      this.beep(f, 0.07, 'square', 0.04, f * 1.45);
      this.beep(f * 1.5, 0.1, 'triangle', 0.03, f * 2);
    },
    pickup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 990);
      this.beep(1320, 0.14, 'sine', 0.035, 1760);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.055, 'sawtooth', 0.036, 170);
      this.beep(580, 0.07, 'square', 0.028, 860);
    },
    bossDie() {
      this.ensure();
      this.noise(0.24, 0.06, 260);
      this.beep(170, 0.3, 'sawtooth', 0.05, 48);
      this.beep(480, 0.22, 'triangle', 0.04, 200);
      this.beep(980, 0.32, 'sine', 0.04, 1480);
    },
    death() {
      this.ensure();
      this.noise(0.13, 0.05, 380);
      this.beep(300, 0.16, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.045, 46);
    },
    wave() {
      this.ensure();
      this.beep(349, 0.09, 'sine', 0.04, 440);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(698, 0.2, 'triangle', 0.045, 1046);
    },
    extra() {
      this.ensure();
      this.beep(698, 0.1, 'square', 0.04, 880);
      this.beep(1046, 0.16, 'sine', 0.04, 1396);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.04, 80);
      this.beep(130, 0.3, 'sine', 0.05, 44);
    },
    win() {
      this.ensure();
      this.beep(440, 0.1, 'square', 0.045, 554);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(880, 0.18, 'sine', 0.05, 1174);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
    },
    start() {
      this.ensure();
      this.beep(330, 0.09, 'square', 0.04, 660);
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
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    while (G.score >= G.next1up && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.next1up += LIFE_EVERY;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.055);
      kick(3.2, 'morph');
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    }
    if (G.combo % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 28, G.combo + ' 链', GOLD, true);
      hitStop(0.046);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (comboEl) comboEl.hidden = true;
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
    }, 1150);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = LIFE_CAP;
    while (pips.length < n) {
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < n; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '熔岸';
      else if (hasBoss()) stageLabel.textContent = BOSS_NAME[clamp(G.stage - 1, 0, 2)];
      else stageLabel.textContent = STAGES[clamp(G.stage - 1, 0, 2)].name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isSea() ? '核海' : '地狱火';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isSea());
    }
    if (dirLabel) {
      dirLabel.textContent = DIR_NAME[G.dir];
      dirLabel.className = 'dir-badge ' + DIR_CLS[G.dir];
    }
    if (optLabel) {
      if (G.opts <= 0) {
        optLabel.textContent = '无子';
        optLabel.className = 'opt-badge off';
      } else if (G.opts >= OPT_MAX) {
        optLabel.textContent = '双子';
        optLabel.className = 'opt-badge max';
      } else {
        optLabel.textContent = '一子';
        optLabel.className = 'opt-badge';
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
    else if (G.mode === 'lose') setHint('R 重开 · Shift 切向，后打追核', 'warn');
    else if (G.mode === 'win') setHint('狱核已碎 · R 再烧', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 切向打炮台和追核', 'warn');
    else if (G.opts >= OPT_MAX) setHint('双子就绪 · 四向一起烧', 'hot');
    else setHint('空格连射 · Shift 切前/后/竖/斜 · 捡子机', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'HELL';
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

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('morph');
    stageEl.classList.remove('boss');
    void stageEl.offsetWidth;
    stageEl.classList.add(name);
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
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 80,
        life: rand(0.22, 0.5),
        r: rand(1.2, 2.8),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 180);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 16);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      t: 0,
      life: gold ? 0.9 : 0.65,
      vy: gold ? -70 : -48,
      text: text,
      rgb: rgb,
      gold: !!gold
    });
    capArr(floats, 18);
  }

  function explode(x, y, rgb, power) {
    const p = power || 16;
    burst(x, y, rgb, Math.min(28, 8 + (p * 0.45) | 0), 80 + p * 4);
    spark(x, y, rgb);
    ring(x, y, rgb);
  }

  function seedEmbers() {
    embers.length = 0;
    for (let i = 0; i < 72; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.12, 0.55),
        z: rand(0.35, 1.2)
      });
    }
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      uid: uidSeq++,
      alive: true,
      kind: spec.kind || 'imp',
      x: spec.x,
      y: spec.y == null ? VH * 0.5 : spec.y,
      vx: spec.vx == null ? -110 * dens() : spec.vx,
      vy: spec.vy || 0,
      hp: bossish ? spec.hp : hp,
      maxHp: bossish ? spec.hp : hp,
      r: spec.r || 11,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseY: spec.y == null ? VH * 0.5 : spec.y,
      amp: spec.amp == null ? 36 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.imp,
      ang: spec.ang || 0,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      ground: !!spec.ground,
      side: spec.side || 0
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.4,
      life: 8
    });
    capArr(G.bullets, 240);
  }

  function aimedFire(e, n, spread, spd) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.2);
    }
  }

  function ringFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.3);
    }
  }

  function spawnImp(x, y, vx, vy) {
    spawnEnemy({
      kind: 'imp',
      x: x == null ? VW + 24 : x,
      y: y == null ? VH * 0.45 : y,
      vx: vx == null ? -118 * dens() : vx,
      vy: vy || 0,
      hp: 2,
      r: 10,
      amp: 28,
      score: SCORE.imp,
      fireCd: rand(0.7, 1.6)
    });
  }

  function spawnV(n, cy) {
    const extra = isSea() ? 2 : 0;
    const c = cy == null ? VH * 0.5 : cy;
    const tot = n + extra;
    for (let i = 0; i < tot; i++) {
      const k = i - (tot - 1) * 0.5;
      spawnImp(VW + 24 + Math.abs(k) * 16, c + k * 28, -118 * dens(), 0);
    }
  }

  function spawnStream() {
    const extra = isSea() ? 2 : 0;
    for (let i = 0; i < 5 + extra; i++) {
      spawnEnemy({
        kind: 'dive',
        x: VW + 20 + i * 18,
        y: 36 + (i % 2) * 40,
        vx: -90 * dens(),
        vy: 20,
        hp: 2,
        r: 11,
        score: SCORE.dive,
        fireCd: 0.5 + i * 0.1,
        phase: i * 0.4
      });
    }
  }

  function spawnChase() {
    const n = isSea() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'chase',
        x: -22 - i * 22,
        y: 70 + Math.random() * (VH - 140),
        vx: 90 * dens(),
        vy: 0,
        hp: 3,
        r: 11,
        score: SCORE.chase,
        fireCd: 0.8 + i * 0.12
      });
    }
  }

  function spawnTurrets() {
    const n = isSea() ? 6 : 4;
    for (let i = 0; i < n; i++) {
      const ceil = i % 2 === 0;
      spawnEnemy({
        kind: 'turret',
        x: VW + 30 + i * 46,
        y: ceil ? 28 : VH - 28,
        vx: -52 * dens(),
        vy: 0,
        hp: 6,
        r: 14,
        score: SCORE.turret,
        fireCd: 0.45 + i * 0.1,
        ground: true,
        side: ceil ? -1 : 1
      });
    }
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      x: VW + 36,
      y: VH * 0.38,
      vx: -64 * dens(),
      vy: 0,
      hp: 10,
      r: 18,
      amp: 54,
      score: SCORE.elite,
      fireCd: 0.5
    });
    if (isSea()) {
      spawnEnemy({
        kind: 'elite',
        x: VW + 70,
        y: VH * 0.64,
        vx: -58 * dens(),
        vy: 0,
        hp: 10,
        r: 18,
        amp: 40,
        score: SCORE.elite,
        fireCd: 0.7
      });
    }
  }

  function spawnCarrier() {
    spawnEnemy({
      kind: 'carrier',
      x: VW + 40,
      y: VH * 0.5,
      vx: -50 * dens(),
      vy: 0,
      hp: 8,
      r: 18,
      amp: 48,
      score: SCORE.carrier,
      fireCd: 0.7
    });
  }

  function spawnDropWave(n) {
    const extra = isSea() ? 2 : 0;
    for (let i = 0; i < n + extra; i++) {
      spawnEnemy({
        kind: 'drop',
        x: 120 + Math.random() * (VW - 200),
        y: -22 - i * 16,
        vx: -20,
        vy: 70 * dens(),
        hp: 3,
        r: 12,
        score: SCORE.drop,
        fireCd: 99
      });
    }
  }

  function spawnBoss() {
    spawnEnemy({
      kind: 'boss',
      x: VW + 80,
      y: VH * 0.5,
      vx: 0,
      vy: 0,
      hp: bossHp(),
      r: bossR(),
      score: SCORE.boss,
      fireCd: 1.1,
      enter: 1.45,
      amp: 70
    });
    toast(BOSS_NAME[clamp(G.stage - 1, 0, 2)], true, false);
    audio.wave();
    kick(3.6, 'boss');
    syncHud();
  }

  function spawnDrop(x, y) {
    G.drops.push({
      x: x,
      y: y,
      vx: -36,
      vy: rand(-20, 20),
      t: 0,
      life: 10,
      magnet: false
    });
    capArr(G.drops, 8);
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream();
    else if (w.kind === 'chase') spawnChase();
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'elite') spawnElite();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'drop') spawnDropWave(w.n);
    else if (w.kind === 'boss') spawnBoss();
  }

  function living() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) n += 1;
    return n;
  }

  function hasBoss() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'boss') return true;
    }
    return false;
  }

  function fireInterval(e) {
    const d = isSea() ? 0.74 : 1;
    if (e.kind === 'imp') return 1.7 * d;
    if (e.kind === 'dive') return 1.4 * d;
    if (e.kind === 'chase') return 1.25 * d;
    if (e.kind === 'turret') return 0.9 * d;
    if (e.kind === 'elite') return 0.8 * d;
    if (e.kind === 'carrier') return 1.05 * d;
    if (e.kind === 'boss') return 0.52 * d;
    return 1.25 * d;
  }

  function killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' ? GOLD : FIRE;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 36 : 14 + e.r);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(7.2, 'boss');
      screenFlash(GOLD, 0.55);
      floatText(e.x, e.y, '碎!', GOLD, true);
      addScore(Math.round(e.score * G.mult));
      addScore(3500 + 1500 * G.stage);
      bumpCombo();
      if (G.stage >= 3) G.winT = 1.4;
      return;
    }
    audio.explode();
    addScore(Math.round(e.score * G.mult));
    bumpCombo();
    if (e.kind === 'carrier') spawnDrop(e.x, e.y);
    if (e.kind === 'drop') {
      aimedFire(e, 3, 0.28, bulletSpd() * 0.9);
    }
  }

  function damageEnemy(e, dmg, how) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (how === 'shot') {
      audio.hit(G.combo);
      if (G.stop < 0.012) hitStop(0.034);
      kick(1.6, 'hit');
    } else if (e.kind === 'boss') {
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e);
    else if (e.kind === 'boss') spark(e.x, e.y, GOLD);
  }

  function diePlayer() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 26);
    audio.death();
    hitStop(0.072);
    kick(7.4, 'die');
    screenFlash(MAG, 0.5);
    G.bullets.length = 0;
    if (G.opts > 0) {
      spawnDrop(G.ship.x + 18, G.ship.y);
      G.opts = 0;
    }
    G.hist.length = 0;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    showOverlay('lose', '机毁了', '火灭了。切后向打追核，竖向清炮台。R 重开。');
    syncHud();
  }

  function finishWin() {
    const bonus = isSea() ? 10000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    saveBest();
    audio.win();
    const title = isSea() ? '核海通关' : '狱核已碎';
    const lead = isSea()
      ? '核海烧穿。四向还热着。R 再来，或换模式。'
      : '熔岸到狱门，狱核打穿了。R 再烧，或换核海。';
    showOverlay('win', title, lead);
    syncHud();
  }

  function nextStage() {
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    addScore(SCORE.stage * G.mult);
    const st = STAGES[G.stage - 1];
    toast(st ? st.name : '下一关', false, true);
    audio.wave();
    kick(2.8, 'morph');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.drops.length = 0;
    G.hist.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
  }

  function cycleDir() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    G.dir = (G.dir + 1) % 4;
    audio.cycle(G.dir);
    hitStop(0.038);
    kick(2.4, 'morph');
    screenFlash(dirRgb(), 0.22);
    floatText(G.ship.x + 10, G.ship.y - 22, DIR_NAME[G.dir], dirRgb(), true);
    toast(DIR_NAME[G.dir], false, G.dir === 2);
    if (dirLabel) {
      dirLabel.classList.remove('pop');
      void dirLabel.offsetWidth;
      dirLabel.className = 'dir-badge ' + DIR_CLS[G.dir] + ' pop';
      dirLabel.textContent = DIR_NAME[G.dir];
    }
    dirTok += 1;
    syncHud();
  }

  function pickOpt(x, y) {
    if (G.opts >= OPT_MAX) {
      addScore(SCORE.opt * G.mult);
      audio.pickup();
      floatText(x, y - 10, '+500', GOLD, true);
      toast('满子', false, true);
    } else {
      G.opts += 1;
      audio.pickup();
      hitStop(0.04);
      kick(2.6, 'morph');
      screenFlash(CYN, 0.28);
      floatText(x, y - 10, '子机', CYN, true);
      toast(G.opts >= OPT_MAX ? '双子' : '子机', false, true);
      if (optLabel) {
        optLabel.classList.remove('pop');
        void optLabel.offsetWidth;
        optLabel.classList.add('pop');
      }
      optTok += 1;
    }
    ring(x, y, CYN);
    burst(x, y, CYN, 10, 80);
    syncHud();
  }

  function optPos(i) {
    const lag = i === 0 ? 10 : 22;
    const h = G.hist[Math.min(lag, Math.max(0, G.hist.length - 1))];
    if (!h) return { x: G.ship.x - 18 - i * 16, y: G.ship.y };
    return h;
  }

  function pushShot(x, y, vx, vy, r, dmg, rgb) {
    G.shots.push({ x: x, y: y, vx: vx, vy: vy, r: r, dmg: dmg, rgb: rgb, life: 1.4 });
  }

  function fireFrom(x, y, fromOpt) {
    const d = G.dir;
    const rgb = DIR_RGB[d];
    const s = SHOT_V;
    if (d === 0) {
      pushShot(x + 14, y, s, 0, fromOpt ? 3.4 : 4.2, 1, rgb);
      if (!fromOpt && G.combo >= 9) {
        pushShot(x + 14, y - 8, s, 0, 3.4, 1, rgb);
        pushShot(x + 14, y + 8, s, 0, 3.4, 1, rgb);
      }
    } else if (d === 1) {
      pushShot(x - 14, y, -s, 0, fromOpt ? 3.4 : 4.0, 1, rgb);
    } else if (d === 2) {
      pushShot(x, y - 12, 0, -s, 3.8, 1, rgb);
      pushShot(x, y + 12, 0, s, 3.8, 1, rgb);
    } else {
      const a = 0.52;
      pushShot(x + 10, y - 6, Math.cos(-a) * s, Math.sin(-a) * s, 3.8, 1, rgb);
      pushShot(x + 10, y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.8, 1, rgb);
    }
  }

  function wantFire() {
    if (G.mode !== 'play' || G.deadT > 0 || overlayOpen()) return false;
    return keys.sht || pointer.down;
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.06;
    fireFrom(G.ship.x, G.ship.y, false);
    for (let i = 0; i < G.opts; i++) {
      const p = optPos(i);
      fireFrom(p.x, p.y, true);
    }
    capArr(G.shots, 120);
    audio.shoot();
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (wantFire()) fireShot();
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (!REDUCE) {
        trails.push({ x: s.x, y: s.y, t: 0, rgb: s.rgb, r: s.r * 0.7 });
        capArr(trails, 80);
      }
      if (s.life <= 0 || s.y < -28 || s.y > VH + 28 || s.x < -28 || s.x > VW + 28) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = s.x - e.x;
        const dy = s.y - e.y;
        const rr = e.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, s.dmg, 'shot');
          burst(s.x, s.y, s.rgb, 5, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > VH + 22 || b.y < -32 || b.x < -22 || b.x > VW + 22) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = b.x - G.ship.x;
        const dy = b.y - G.ship.y;
        const rr = HIT_R + b.r * 0.55;
        if (dx * dx + dy * dy < rr * rr) {
          G.bullets.splice(i, 1);
          diePlayer();
        }
      }
    }
  }

  function updateDrops(dt) {
    if (G.mode !== 'play' || G.deadT > 0) {
      for (let i = G.drops.length - 1; i >= 0; i--) {
        const d = G.drops[i];
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.t += dt;
        d.life -= dt;
        if (d.life <= 0 || d.x < -30) G.drops.splice(i, 1);
      }
      return;
    }
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      d.t += dt;
      d.life -= dt;
      const dx = G.ship.x - d.x;
      const dy = G.ship.y - d.y;
      const dist = hypot(dx, dy);
      if (dist < 80) {
        const k = 220;
        d.vx = lerp(d.vx, (dx / Math.max(1, dist)) * k, 1 - Math.exp(-dt * 6));
        d.vy = lerp(d.vy, (dy / Math.max(1, dist)) * k, 1 - Math.exp(-dt * 6));
      }
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y < 18 || d.y > VH - 18) d.vy *= -1;
      if (dist < 18) {
        pickOpt(d.x, d.y);
        G.drops.splice(i, 1);
        continue;
      }
      if (d.life <= 0 || d.x < -40 || d.x > VW + 40) G.drops.splice(i, 1);
    }
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    const play = G.mode === 'play';
    if (e.kind === 'imp') {
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(e.t * e.omega + e.phase) * e.amp;
      if (play && e.fireCd <= 0 && e.x < VW - 40 && e.x > 40) {
        aimedFire(e, 1, 0, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'dive') {
      if (e.t > 0.28) {
        const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
        e.vx = lerp(e.vx, Math.cos(a) * 210 * dens(), 1 - Math.exp(-dt * 2.4));
        e.vy = lerp(e.vy, Math.sin(a) * 210 * dens(), 1 - Math.exp(-dt * 2.4));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (play && e.fireCd <= 0 && e.x < VW - 20) {
        aimedFire(e, 1, 0, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'chase') {
      const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
      const spd = 150 * dens();
      e.vx = lerp(e.vx, Math.cos(a) * spd, 1 - Math.exp(-dt * 2.1));
      e.vy = lerp(e.vy, Math.sin(a) * spd, 1 - Math.exp(-dt * 2.1));
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (play && e.fireCd <= 0 && e.x > 10 && e.x < VW - 10) {
        aimedFire(e, 1, 0, bulletSpd() * 0.9);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'turret') {
      e.x += e.vx * dt;
      if (play && e.fireCd <= 0 && e.x < VW - 10 && e.x > 20) {
        aimedFire(e, isSea() ? 2 : 1, 0.16, bulletSpd() * 0.92);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'elite') {
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(e.t * 1.25 + e.phase) * e.amp;
      if (e.x < VW - 160 && e.vx < -18) e.vx = lerp(e.vx, -22, 1 - Math.exp(-dt * 2));
      if (play && e.fireCd <= 0 && e.x < VW - 20) {
        aimedFire(e, 3, 0.18, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'carrier') {
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(e.t * 1.05 + e.phase) * e.amp;
      if (e.x < VW - 180 && e.vx < -16) e.vx = -22;
      if (play && e.fireCd <= 0 && e.x < VW - 20) {
        aimedFire(e, 2, 0.2, bulletSpd());
        e.fireCd = fireInterval(e);
        if ((e.pattern++ % 3) === 0) {
          spawnImp(e.x - 10, e.y, -80, rand(-30, 30));
        }
      }
    } else if (e.kind === 'drop') {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.spin += dt * 4;
    } else if (e.kind === 'boss') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.x = lerp(e.x, VW - 148, 1 - Math.exp(-dt * 3.0));
        e.y = lerp(e.y, VH * 0.5, 1 - Math.exp(-dt * 2.4));
      } else {
        e.x = VW - 148 + Math.sin(e.t * 0.55) * 18;
        e.y = VH * 0.5 + Math.sin(e.t * 0.72) * e.amp;
      }
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.2 : 2.2);
      if (!play || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      const st = G.stage;
      if (ratio > 0.66) {
        aimedFire(e, 3, 0.18, spd);
        if (st >= 2 && Math.random() < 0.4) ringFire(e, 8, spd * 0.68, e.spin);
        e.fireCd = 1.12 * (isSea() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        ringFire(e, st >= 3 ? 10 : 8, spd * 0.78, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 5, 0.16, spd);
        if (st === 1 && (e.pattern % 2) === 0) {
          enemyShot(e.x, e.y - 24, -spd * 0.4, -spd * 0.85, 3.4);
          enemyShot(e.x, e.y + 24, -spd * 0.4, spd * 0.85, 3.4);
        }
        e.fireCd = 0.5 * (isSea() ? 0.78 : 1);
      } else {
        ringFire(e, 12, spd * 0.76, e.spin);
        if (st >= 2) ringFire(e, 8, spd * 0.56, -e.spin * 0.7);
        aimedFire(e, 3, 0.14, spd * 1.05);
        if (st >= 3 && (e.pattern++ % 4) === 0) {
          spawnImp(e.x - 30, e.y - 36, -90, -40);
          spawnImp(e.x - 30, e.y + 36, -90, 40);
        }
        e.fireCd = 0.4 * (isSea() ? 0.78 : 1);
      }
    }
  }

  function updateEnemies(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) {
        G.enemies.splice(i, 1);
        continue;
      }
      thinkEnemy(e, dt);
      if (e.kind !== 'boss' && (e.x < -56 || e.x > VW + 90 || e.y < -50 || e.y > VH + 50)) {
        e.alive = false;
        G.enemies.splice(i, 1);
        continue;
      }
      if (canHurt && !e.ground) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = (e.kind === 'boss' ? e.r * 0.52 : e.r * 0.7) + HIT_R;
        if (dx * dx + dy * dy < rr * rr) diePlayer();
      }
    }
  }

  function updateWaves(dt) {
    if (hasBoss()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
    if (G.waveI >= st.waves.length && !hasBoss() && living() === 0) {
      G.gapT += dt;
      if (G.gapT >= 1.4) {
        G.gapT = 0;
        if (G.stage < 3) nextStage();
      }
    }
  }

  function updateShip(dt) {
    if (G.deadT > 0) return;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const dx = pointer.x - G.ship.x;
      const dy = pointer.y - G.ship.y;
      const d = hypot(dx, dy);
      const spd = shipSpeed();
      if (d > 2) {
        const k = Math.min(1, d / 46);
        G.ship.vx = (dx / d) * spd * k;
        G.ship.vy = (dy / d) * spd * k;
      } else {
        G.ship.vx = 0;
        G.ship.vy = 0;
      }
    } else {
      let ax = 0;
      let ay = 0;
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax && ay) {
        ax *= 0.7071;
        ay *= 0.7071;
      }
      const spd = shipSpeed();
      G.ship.vx = ax * spd;
      G.ship.vy = ay * spd;
    }
    const xmax = hasBoss() ? VW - 88 : VW - 28;
    G.ship.x = clamp(G.ship.x + G.ship.vx * dt, 28, xmax);
    G.ship.y = clamp(G.ship.y + G.ship.vy * dt, 28, VH - 28);
    G.hist.unshift({ x: G.ship.x, y: G.ship.y });
    if (G.hist.length > 36) G.hist.length = 36;
  }

  function updateWorld(dt) {
    G.scroll += scrollSpd() * dt;
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      p.x -= (28 + p.z * 70) * dt;
      p.y += Math.sin(G.t * 1.4 + i) * 8 * dt;
      if (p.x < -8) {
        p.x = VW + 6;
        p.y = Math.random() * VH;
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.22) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > 0.16) trails.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'sea' ? 'sea' : 'hell';
    G.t = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.next1up = LIFE_EVERY;
    G.dir = 0;
    G.opts = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.winT = 0;
    G.gapT = 0;
    G.scroll = 0;
    G.ship.x = 96;
    G.ship.y = VH * 0.5;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isSea() ? '核海' : '地狱火', isSea(), !isSea());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'hell';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.dir = 0;
    G.opts = 0;
    G.deadT = 0;
    G.ship.x = 96;
    G.ship.y = VH * 0.5;
    clearWorld();
    showOverlay('title', '地狱火', LEAD);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('hell');
    else startGame(G.kind || 'hell');
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.ship.x = 96 + Math.sin(G.t * 0.7) * 18;
      G.ship.y = VH * 0.5 + Math.sin(G.t * 1.1) * 22;
      G.hist.unshift({ x: G.ship.x, y: G.ship.y });
      if (G.hist.length > 36) G.hist.length = 36;
      if (living() < 6 && (G.t * 2 | 0) !== ((G.t - dt) * 2 | 0) && Math.random() < 0.4) {
        spawnV(5, VH * 0.5 + Math.sin(G.t) * 40);
      }
      updateEnemies(dt);
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      updateWorld(dt * 0.5);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateDrops(dt);
      if (G.deadT <= 0) {
        if (G.lives > 0) {
          G.ship.x = 96;
          G.ship.y = VH * 0.5;
          G.invuln = 1.55;
          G.bullets.length = 0;
          G.hist.length = 0;
        } else {
          loseGame();
        }
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateBullets(dt);
    updateDrops(dt);
    updateEnemies(dt);
    updateWaves(dt);
    updateWorld(dt);

    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) finishWin();
    }
  }

  function drawPoly(pts, fill, stroke, lw) {
    ctx.beginPath();
    ctx.moveTo(sx(pts[0][0]), sy(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i][0]), sy(pts[i][1]));
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = (lw || 1) * scale;
      ctx.stroke();
    }
  }

  function drawLavaEdge(y, flip) {
    const sc = G.scroll;
    ctx.beginPath();
    ctx.moveTo(sx(-4), sy(flip ? 0 : VH));
    ctx.lineTo(sx(-4), sy(y));
    const step = 18;
    for (let i = 0; i <= VW / step + 2; i++) {
      const x = i * step;
      const n = ((sc * 0.12 + i) | 0);
      const h = 6 + hash(n + (flip ? 9 : 3)) * 14;
      ctx.lineTo(sx(x), sy(y + (flip ? h : -h)));
    }
    ctx.lineTo(sx(VW + 4), sy(flip ? 0 : VH));
    ctx.closePath();
    ctx.fillStyle = rgba(FIRE, 0.22);
    ctx.fill();
    ctx.strokeStyle = rgba(AMB, 0.45);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
  }

  function drawBg() {
    ctx.fillStyle = '#0e0604';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#140806';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const sc = G.scroll;
    const stg = G.stage;
    for (let i = 0; i < 8; i++) {
      const n = i + ((sc * 0.012) | 0);
      const hsh = hash(n * 3.1 + stg);
      const x = ((hsh * VW + VW - (sc * 0.35) % VW) % VW);
      const y = 40 + hash(n + 2) * (VH - 80);
      const w = 36 + hash(n + 9) * 50;
      const hh = 18 + hash(n + 4) * 40;
      ctx.fillStyle = rgba(FIRE, 0.06 + hash(n) * 0.07);
      ctx.fillRect(sx(x - w * 0.5), sy(y - hh * 0.5), w * scale, hh * scale);
      ctx.strokeStyle = rgba(AMB, 0.14);
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(sx(x - w * 0.5), sy(y - hh * 0.5), w * scale, hh * scale);
    }

    if (stg >= 2) {
      for (let i = 0; i < 4; i++) {
        const n = i + ((sc * 0.008) | 0);
        const x = ((n * 210 - sc * 0.55) % (VW + 80)) - 20;
        ctx.strokeStyle = rgba(CYN, 0.1);
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(x), sy(28));
        ctx.lineTo(sx(x + 40), sy(VH - 28));
        ctx.stroke();
      }
    }

    if (stg >= 3 || hasBoss()) {
      for (let i = 0; i < 5; i++) {
        const n = i * 2 + 1;
        const x = ((hash(n) * VW + sc * 0.4) % (VW + 40)) - 10;
        const y = 50 + hash(n + 2) * (VH - 100);
        ctx.strokeStyle = rgba(GOLD, 0.22);
        ctx.lineWidth = 1.3 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(x), sy(y - 8));
        ctx.lineTo(sx(x + 12), sy(y));
        ctx.lineTo(sx(x), sy(y + 8));
        ctx.stroke();
      }
    }

    drawLavaEdge(22, true);
    drawLavaEdge(VH - 22, false);

    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      ctx.fillStyle = rgba(i % 3 === 0 ? GOLD : (i % 2 ? FIRE : AMB), p.a * 0.75);
      const r = p.s * scale;
      ctx.fillRect(sx(p.x) - r * 0.5, sy(p.y) - r * 0.5, r, r);
    }
  }

  function drawEnemyBody(e, x, y, kind, flash, spin) {
    const f = flash > 0;
    const col = f ? WHT : (kind === 'boss' ? FIRE : AMB);
    const edge = f ? WHT : CYN;
    if (kind === 'imp') {
      drawPoly([
        [x + 8, y], [x, y - 7], [x - 7, y], [x, y + 7]
      ], rgba(col, 0.95), rgba(edge, 0.7), 1);
      ctx.fillStyle = rgba(FIRE, 0.9);
      ctx.fillRect(sx(x - 1.2), sy(y - 1.2), 2.4 * scale, 2.4 * scale);
    } else if (kind === 'dive') {
      drawPoly([
        [x + 12, y], [x - 4, y - 8], [x - 8, y], [x - 4, y + 8]
      ], rgba(col, 0.95), rgba(FIRE, 0.7), 1);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(sx(x + 2), sy(y), 2 * scale, 0, TAU);
      ctx.fill();
    } else if (kind === 'chase') {
      drawPoly([
        [x - 11, y], [x + 4, y - 7], [x + 8, y], [x + 4, y + 7]
      ], rgba(CYN, f ? 0.95 : 0.88), rgba(WHT, 0.6), 1);
      ctx.fillStyle = rgba(FIRE, 0.85);
      ctx.beginPath();
      ctx.arc(sx(x - 2), sy(y), 2 * scale, 0, TAU);
      ctx.fill();
    } else if (kind === 'turret') {
      const dir = e.side < 0 ? 1 : -1;
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.fillRect(sx(x - 12), sy(y - (dir < 0 ? 2 : 8)), 24 * scale, 10 * scale);
      ctx.fillStyle = rgba(FIRE, 0.95);
      ctx.fillRect(sx(x - 7), sy(y - 6), 14 * scale, 12 * scale);
      ctx.fillStyle = rgba(GOLD, 0.75);
      ctx.fillRect(sx(x - 2), sy(y + dir * 6), 4 * scale, 8 * scale);
    } else if (kind === 'elite') {
      ctx.fillStyle = rgba(col, 0.95);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (spin || 0) * 0.2 + i * TAU / 6;
        const px = x + Math.cos(a) * 16;
        const py = y + Math.sin(a) * 12;
        if (i === 0) ctx.moveTo(sx(px), sy(py));
        else ctx.lineTo(sx(px), sy(py));
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(edge, 0.7);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 4 * scale, 0, TAU);
      ctx.fill();
    } else if (kind === 'carrier') {
      ctx.fillStyle = rgba(col, 0.9);
      ctx.beginPath();
      ctx.ellipse(sx(x), sy(y), 20 * scale, 11 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.65);
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(DEEP, 0.8);
      ctx.fillRect(sx(x - 6), sy(y - 3), 12 * scale, 6 * scale);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(sx(x - 3), sy(y - 2), 6 * scale, 4 * scale);
    } else if (kind === 'drop') {
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.rotate(spin || 0);
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.moveTo(0, -8 * scale);
      ctx.lineTo(6 * scale, 4 * scale);
      ctx.lineTo(-6 * scale, 4 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (kind === 'boss') {
      const body = f ? WHT : FIRE;
      const rr = e.r || 46;
      ctx.fillStyle = rgba(body, 0.96);
      ctx.beginPath();
      ctx.moveTo(sx(x + rr * 0.7), sy(y));
      ctx.lineTo(sx(x + 10), sy(y - rr * 0.72));
      ctx.lineTo(sx(x - rr * 0.55), sy(y - 16));
      ctx.lineTo(sx(x - rr * 0.55), sy(y + 16));
      ctx.lineTo(sx(x + 10), sy(y + rr * 0.72));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
      const jaw = 10 + Math.sin((spin || 0) * 2) * 5;
      ctx.strokeStyle = rgba(AMB, 0.9);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x - 8), sy(y - 10));
      ctx.lineTo(sx(x - rr * 0.85), sy(y - jaw));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx(x - 8), sy(y + 10));
      ctx.lineTo(sx(x - rr * 0.85), sy(y + jaw));
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(sx(x + 6), sy(y), 7 * scale, 0, TAU);
      ctx.fill();
      const hp = e.maxHp ? e.hp / e.maxHp : 1;
      ctx.fillStyle = rgba(DEEP, 0.7);
      ctx.fillRect(sx(x - 32), sy(y - rr - 10), 64 * scale, 4 * scale);
      ctx.fillStyle = rgba(hp > 0.33 ? FIRE : MAG, 0.95);
      ctx.fillRect(sx(x - 32), sy(y - rr - 10), 64 * hp * scale, 4 * scale);
    }
  }

  function drawEnemy(e) {
    if (!e.alive) return;
    drawEnemyBody(e, e.x, e.y, e.kind, e.flash, e.spin || e.t);
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const a = Math.atan2(s.vy, s.vx);
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(a);
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.fillRect(-7 * scale, -s.r * 0.55 * scale, 14 * scale, s.r * 1.1 * scale);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(-3 * scale, -s.r * 0.28 * scale, 10 * scale, s.r * 0.55 * scale);
      ctx.restore();
    }
  }

  function drawBullets() {
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * 0.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawDrops() {
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      const pulse = 0.7 + Math.sin(d.t * 8) * 0.25;
      ctx.fillStyle = rgba(CYN, 0.95);
      drawPoly([
        [d.x, d.y - 8],
        [d.x + 7, d.y],
        [d.x, d.y + 8],
        [d.x - 7, d.y]
      ], rgba(CYN, pulse), rgba(WHT, 0.8), 1.1);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(sx(d.x - 1.5), sy(d.y - 1.5), 3 * scale, 3 * scale);
    }
  }

  function drawOpt(p, i) {
    const rgb = dirRgb();
    const pulse = 0.7 + Math.sin(G.t * 10 + i) * 0.25;
    ctx.fillStyle = rgba(rgb, 0.35);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), 9 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, pulse);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), 4.4 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), 1.8 * scale, 0, TAU);
    ctx.fill();
  }

  function drawDirMarks(x, y) {
    const d = G.dir;
    ctx.strokeStyle = rgba(DIR_RGB[d], 0.85);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    if (d === 0) {
      ctx.moveTo(sx(x + 16), sy(y));
      ctx.lineTo(sx(x + 26), sy(y));
    } else if (d === 1) {
      ctx.moveTo(sx(x - 16), sy(y));
      ctx.lineTo(sx(x - 26), sy(y));
    } else if (d === 2) {
      ctx.moveTo(sx(x), sy(y - 14));
      ctx.lineTo(sx(x), sy(y - 24));
      ctx.moveTo(sx(x), sy(y + 14));
      ctx.lineTo(sx(x), sy(y + 24));
    } else {
      ctx.moveTo(sx(x + 12), sy(y - 10));
      ctx.lineTo(sx(x + 20), sy(y - 18));
      ctx.moveTo(sx(x + 12), sy(y + 10));
      ctx.lineTo(sx(x + 20), sy(y + 18));
    }
    ctx.stroke();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const blink = G.invuln > 0 && ((G.invuln * 16) | 0) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.42;

    for (let i = G.opts - 1; i >= 0; i--) drawOpt(optPos(i), i);

    ctx.fillStyle = rgba(FIRE, 0.35);
    ctx.beginPath();
    ctx.ellipse(sx(x - 10), sy(y), 8 * scale, 4.5 * scale, 0, 0, TAU);
    ctx.fill();

    drawPoly([
      [x + 18, y],
      [x + 2, y - 8],
      [x - 12, y - 5],
      [x - 16, y],
      [x - 12, y + 5],
      [x + 2, y + 8]
    ], rgba(FIRE, 0.98), rgba(AMB, 0.85), 1.3);
    drawPoly([
      [x + 10, y],
      [x - 2, y - 4],
      [x - 2, y + 4]
    ], rgba(WHT, 0.95), null, 0);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.beginPath();
    ctx.arc(sx(x + 2), sy(y), 2.6 * scale, 0, TAU);
    ctx.fill();

    const thr = 0.55 + Math.sin(G.t * 26) * 0.25;
    ctx.fillStyle = rgba(CYN, thr);
    ctx.fillRect(sx(x - 22), sy(y - 2.2), 8 * scale, 4.4 * scale);

    if (G.muzzle > 0) {
      const a = G.muzzle / 0.06;
      ctx.fillStyle = rgba(WHT, a);
      if (G.dir === 0) ctx.fillRect(sx(x + 16), sy(y - 2), 10 * scale, 4 * scale);
      else if (G.dir === 1) ctx.fillRect(sx(x - 26), sy(y - 2), 10 * scale, 4 * scale);
      else if (G.dir === 2) {
        ctx.fillRect(sx(x - 2), sy(y - 22), 4 * scale, 10 * scale);
        ctx.fillRect(sx(x - 2), sy(y + 12), 4 * scale, 10 * scale);
      } else {
        ctx.fillRect(sx(x + 12), sy(y - 14), 6 * scale, 3 * scale);
        ctx.fillRect(sx(x + 12), sy(y + 11), 6 * scale, 3 * scale);
      }
    }

    drawDirMarks(x, y);

    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 1.5 * scale, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 1;
  }

  function drawFx() {
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      const a = 1 - t.t / 0.16;
      ctx.fillStyle = rgba(t.rgb, a * 0.4);
      ctx.beginPath();
      ctx.arc(sx(t.x), sy(t.y), t.r * a * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life * 3, 0, 1));
      const r = p.r * scale;
      ctx.fillRect(sx(p.x) - r * 0.5, sy(p.y) - r * 0.5, r, r);
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.22;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.6 * scale;
      const r = (6 + s.t * 40) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x) - r, sy(s.y));
      ctx.lineTo(sx(s.x) + r, sy(s.y));
      ctx.moveTo(sx(s.x), sy(s.y) - r);
      ctx.lineTo(sx(s.x), sy(s.y) + r);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.42;
      ctx.strokeStyle = rgba(r.rgb, a * 0.85);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (10 + r.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = (f.gold ? 16 : 13) * scale + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#140806';
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H);
    }
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W, H);
    }
  }

  function draw() {
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * 0.7;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(shx, shy);
    if (G.punch > 1 && !REDUCE) {
      const cx = W * 0.5;
      const cy = H * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    for (let i = 0; i < G.enemies.length; i++) drawEnemy(G.enemies[i]);
    drawDrops();
    drawShots();
    drawBullets();
    drawShip();
    drawFx();
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
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pointerWorldX(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    return (x - ox) / scale;
  }
  function pointerWorldY(e) {
    const r = canvas.getBoundingClientRect();
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return (y - oy) / scale;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('hell');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isOpt = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const space = k === ' ' || k === 'Spacebar' || k === 'Space' || code === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (space) {
      keys.sht = down;
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (k === 'ArrowUp' || k === 'ArrowDown' || isOpt) {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R' || isOpt)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (isOpt) {
      cycleDir();
      return;
    }
    if (space) {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      return;
    }
    if (k === 'Enter') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      audio.ensure();
      startGame('hell');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('sea');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (e.button === 2) return;
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 24, VW - 24);
      pointer.y = clamp(pointerWorldY(e), 24, VH - 24);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 24, VW - 24);
      pointer.y = clamp(pointerWorldY(e), 24, VH - 24);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
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

  function bindOptBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      el.classList.add('held');
      cycleDir();
    });
    el.addEventListener('pointerup', function (e) {
      e.preventDefault();
      el.classList.remove('held');
    });
    el.addEventListener('pointercancel', function () {
      el.classList.remove('held');
    });
    el.addEventListener('click', function (e) { e.preventDefault(); });
  }

  seedEmbers();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnHell) {
    btnHell.addEventListener('click', function () {
      audio.ensure();
      startGame('hell');
    });
  }
  if (btnSea) {
    btnSea.addEventListener('click', function () {
      audio.ensure();
      startGame('sea');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'hell');
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
  bindOptBtn(btnOpt);
  bindOptBtn(btnPad);

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
      keys.sht = false;
    }
  });

  requestAnimationFrame(frame);
})();
