'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 4.6;
  const SHOT_V = 740;
  const BLOOM_MAX = 100;
  const BEST_KEY = 'playbox-mushihimesama-best';
  const MUTE_KEY = 'playbox-mushihimesama-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [110, 255, 208];
  const GOLD = [255, 227, 107];
  const LIME = [61, 255, 106];
  const JADE = [122, 255, 154];
  const WHT = [232, 255, 240];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const DEEP = [12, 28, 18];
  const LEAF = [28, 92, 48];
  const PET = [255, 92, 168];

  const SCORE = {
    moth: 50,
    firefly: 80,
    beetle: 120,
    cocoon: 150,
    dragon: 240,
    pod: 280,
    gem: 25,
    boss: 8000,
    chip: 10,
    stage: 1500
  };

  const STAGES = [
    {
      name: '萤径',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.1, kind: 'stream', dir: 1 },
        { t: 5.6, kind: 'v', n: 7 },
        { t: 8.0, kind: 'cocoons' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'beetle' },
        { t: 15.2, kind: 'v', n: 7 },
        { t: 17.6, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '茧廊',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.5, kind: 'dive', n: 5 },
        { t: 4.6, kind: 'stream', dir: -1 },
        { t: 6.8, kind: 'beetle' },
        { t: 8.4, kind: 'beetle' },
        { t: 10.2, kind: 'cocoons' },
        { t: 12.2, kind: 'dragon' },
        { t: 14.4, kind: 'v', n: 9 },
        { t: 16.6, kind: 'dive', n: 6 },
        { t: 18.8, kind: 'stream', dir: 1 }
      ]
    },
    {
      name: '后宫',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.3, kind: 'dive', n: 5 },
        { t: 4.2, kind: 'dragon' },
        { t: 6.2, kind: 'cocoons' },
        { t: 8.0, kind: 'beetle' },
        { t: 9.6, kind: 'v', n: 9 },
        { t: 13.4, kind: 'boss' }
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
  const btnForest = document.getElementById('btn-forest');
  const btnSea = document.getElementById('btn-sea');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const bloomBar = document.getElementById('bloom-bar');
  const bloomWrap = document.getElementById('bloom-wrap');

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
  let wpnTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const motes = [];

  const G = {
    mode: 'title',
    kind: 'forest',
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
    enemies: [],
    shots: [],
    bullets: [],
    gems: [],
    opts: [
      { x: VW * 0.5 - 28, y: VH - 64, tx: 0, ty: 0 },
      { x: VW * 0.5 + 28, y: VH - 64, tx: 0, ty: 0 },
      { x: VW * 0.5 - 52, y: VH - 58, tx: 0, ty: 0 },
      { x: VW * 0.5 + 52, y: VH - 58, tx: 0, ty: 0 }
    ],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    bloom: 18,
    focus: false,
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: LIME,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    moving: 0
  };

  let inputSrc = 'key';

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
    return isSea() ? 1.28 : 1;
  }
  function shipSpeed() {
    return isSea() ? 312 : 272;
  }
  function fireRate() {
    const base = isSea() ? 0.074 : 0.088;
    return G.focus ? base * 0.88 : base;
  }
  function bulletSpd() {
    return isSea() ? 184 : 144;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isSea() ? 118 : 84;
  }
  function hpMul() {
    return isSea() ? 1.22 : 1;
  }
  function optionCount() {
    if (G.bloom >= 80) return 4;
    if (G.bloom >= 50) return 3;
    return 2;
  }
  function centerWays() {
    return G.bloom >= 20 ? 3 : 2;
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
      this.beep(G.focus ? 1020 : 820, 0.042, 'square', 0.026, G.focus ? 1760 : 1480);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.03, 0.028, 1500);
      this.beep(680 * lift, 0.055, 'square', 0.036, 1040 * lift);
    },
    gem(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.7, combo * 0.035);
      this.beep(780 * lift, 0.07, 'sine', 0.034, 1560 * lift);
      this.beep(1240 * lift, 0.09, 'triangle', 0.02, 1880 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(260, 0.14, 'sawtooth', 0.044, 64);
    },
    bossHit() {
      this.ensure();
      this.beep(220, 0.055, 'sawtooth', 0.036, 160);
      this.beep(640, 0.07, 'square', 0.028, 920);
    },
    bossDie() {
      this.ensure();
      this.noise(0.22, 0.06, 260);
      this.beep(170, 0.28, 'sawtooth', 0.05, 46);
      this.beep(520, 0.2, 'triangle', 0.04, 210);
      this.beep(1100, 0.32, 'sine', 0.04, 1640);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 380);
      this.beep(300, 0.16, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.044, 46);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.044, 1046);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    bloomUp() {
      this.ensure();
      this.beep(660, 0.08, 'triangle', 0.036, 990);
      this.beep(1320, 0.14, 'sine', 0.032, 1760);
    },
    focusOn() {
      this.ensure();
      this.beep(880, 0.08, 'sine', 0.03, 1320);
      this.beep(440, 0.1, 'triangle', 0.022, 660);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.04, 82);
      this.beep(130, 0.3, 'sine', 0.05, 44);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.044, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(880, 0.18, 'sine', 0.05, 1175);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.034, 1175);
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

  function comboMult() {
    return 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.055);
      kick(3.2);
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

  function addBloom(n) {
    const prev = optionCount();
    const ways = centerWays();
    G.bloom = clamp(G.bloom + n, 0, BLOOM_MAX);
    if (optionCount() > prev || centerWays() > ways) {
      audio.bloomUp();
      toast(optionCount() + ' 珠', false, true);
      ring(G.ship.x, G.ship.y, CYN);
      hitStop(0.04);
    }
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
      if (G.mode === 'title') stageLabel.textContent = '虫姬';
      else if (hasBoss()) stageLabel.textContent = '虫后';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isSea() ? '虫海' : '虫林';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isSea());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.focus);
    }
    if (wpnLabel) {
      wpnLabel.textContent = G.focus ? '聚' : '散';
      wpnLabel.classList.toggle('focus', G.focus);
    }
    if (bloomBar) {
      bloomBar.style.transform = 'scaleX(' + clamp(G.bloom / BLOOM_MAX, 0, 1) + ')';
    }
    if (bloomWrap) bloomWrap.classList.toggle('hot', G.bloom >= 80);
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 选项珠跟舰，停住收束', 'warn');
    else if (G.mode === 'win') setHint('后宫已碎 · R 再来', 'hot');
    else if (G.focus) setHint('收束 · 选项聚顶 · 露华加倍', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 吃露续链', 'warn');
    else setHint('选项珠跟舰 · 停住收束 · 击破洒露', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'MUSHI';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.5 ? 'focus' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('focus');
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
        g: 160,
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

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 76; i++) {
      motes.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.12, 0.58),
        z: rand(0.32, 1.2),
        hue: Math.random() < 0.22 ? MAG : (Math.random() < 0.5 ? LIME : GOLD)
      });
    }
  }

  function spawnGem(x, y, n) {
    const count = n || 1;
    for (let i = 0; i < count; i++) {
      G.gems.push({
        x: x + rand(-10, 10),
        y: y + rand(-8, 8),
        vx: rand(-50, 50),
        vy: rand(-30, 40),
        t: 0,
        spin: rand(0, TAU)
      });
    }
    capArr(G.gems, 96);
  }

  function collectGem(g) {
    const pts = Math.round(SCORE.gem * G.mult);
    addScore(pts);
    addBloom(1.6);
    if (G.combo >= 1) bumpCombo();
    else {
      G.combo = 1;
      G.comboT = COMBO_WIN;
      G.mult = 1;
    }
    burst(g.x, g.y, GOLD, 7, 88);
    audio.gem(G.combo);
    syncHud();
  }

  function spawnEnemy(spec) {
    const hp = Math.max(1, Math.round((spec.hp || 1) * (spec.kind === 'boss' || spec.kind === 'pod' ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'moth',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 90 * dens() : spec.vy,
      hp: spec.kind === 'boss' || spec.kind === 'pod' ? spec.hp : hp,
      maxHp: spec.kind === 'boss' || spec.kind === 'pod' ? spec.hp : hp,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 48 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.moth,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      gems: spec.gems || 1
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r, petal) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.5,
      life: 8,
      petal: !!petal,
      ang: Math.atan2(vy, vx)
    });
    capArr(G.bullets, 260);
  }

  function aimedFire(e, n, spread, spd, petal) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, petal ? 4.2 : 3.3, petal);
    }
  }

  function ringFire(e, n, spd, rot, petal) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, petal ? 4.4 : 3.4, petal);
    }
  }

  function flowerFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.76;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      const k = i % 2 === 0 ? 1 : 0.72;
      enemyShot(e.x, e.y, Math.cos(a) * s * k, Math.sin(a) * s * k, 4.6, true);
    }
  }

  function spawnMoth(x, y, vx, vy) {
    spawnEnemy({
      kind: 'moth',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 94 * dens() : vy,
      hp: 2,
      r: 12,
      amp: 42,
      score: SCORE.moth,
      fireCd: rand(0.55, 1.35),
      gems: 1
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnMoth(c + k * 36, -26 - Math.abs(k) * 16, 0, 98 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isSea() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'moth',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 86 * dens(),
        hp: 2,
        r: 12,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.moth,
        fireCd: 0.7 + i * 0.12,
        gems: 1
      });
    }
  }

  function spawnDive(n) {
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'firefly',
        x: 50 + Math.random() * (VW - 100),
        y: -30 - i * 18,
        vy: 40,
        hp: 2,
        r: 10,
        score: SCORE.firefly,
        fireCd: 99,
        gems: 1
      });
    }
  }

  function spawnBeetle(x) {
    spawnEnemy({
      kind: 'beetle',
      x: x == null ? (Math.random() < 0.5 ? 120 : 360) : x,
      y: -32,
      vy: 58 * dens(),
      hp: 5,
      r: 16,
      amp: 70,
      score: SCORE.beetle,
      fireCd: 0.45,
      gems: 2
    });
  }

  function spawnCocoons() {
    const n = isSea() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'cocoon',
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18,
        vy: 42 * dens(),
        hp: 6,
        r: 14,
        score: SCORE.cocoon,
        fireCd: 0.55 + i * 0.1,
        gems: 2
      });
    }
  }

  function spawnDragon() {
    spawnEnemy({
      kind: 'dragon',
      x: 150,
      vy: 56 * dens(),
      hp: 10,
      r: 18,
      amp: 86,
      score: SCORE.dragon,
      fireCd: 0.5,
      gems: 3
    });
    spawnEnemy({
      kind: 'dragon',
      x: 330,
      vy: 56 * dens(),
      hp: 10,
      r: 18,
      amp: 86,
      phase: 1.6,
      score: SCORE.dragon,
      fireCd: 0.7,
      gems: 3
    });
  }

  function spawnBoss() {
    const sea = isSea();
    const boss = spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: sea ? 120 : 92,
      r: 38,
      score: SCORE.boss,
      enter: 1.35,
      fireCd: 0.9,
      gems: 12
    });
    boss.maxHp = boss.hp;
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 + 72,
      y: 30,
      hp: sea ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: 0,
      rad: 86,
      fireCd: 0.8,
      gems: 3
    });
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 - 72,
      y: 30,
      hp: sea ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: Math.PI,
      rad: 86,
      fireCd: 1.05,
      gems: 3
    });
    toast('虫后', false, true);
    audio.wave();
    screenFlash(PNK, 0.36);
    kick(4.6, 'boss');
    syncHud();
    return boss;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isSea() ? 2 : 0), w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n + (isSea() ? 1 : 0));
    else if (w.kind === 'beetle') {
      spawnBeetle(140);
      spawnBeetle(340);
      if (isSea()) spawnBeetle(240);
    } else if (w.kind === 'cocoons') spawnCocoons();
    else if (w.kind === 'dragon') spawnDragon();
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

  function findBoss() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'boss') return G.enemies[i];
    }
    return null;
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function pushShot(x, y, vx, vy, dmg, fromOpt) {
    G.shots.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: fromOpt ? 3.1 : 3.6,
      dmg: dmg,
      opt: !!fromOpt
    });
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.055;
    const ways = centerWays();
    const spread = G.focus ? 0.08 : 0.2;
    const v = SHOT_V;
    if (ways === 2) {
      pushShot(G.ship.x - 5, G.ship.y - 14, 0, -v, 1, false);
      pushShot(G.ship.x + 5, G.ship.y - 14, 0, -v, 1, false);
    } else {
      for (let i = -1; i <= 1; i++) {
        const a = -Math.PI * 0.5 + i * spread;
        pushShot(G.ship.x + i * 6, G.ship.y - 14, Math.cos(a) * v, Math.sin(a) * v, 1, false);
      }
    }
    const n = optionCount();
    for (let i = 0; i < n; i++) {
      const o = G.opts[i];
      const outward = G.focus ? 0 : (o.x - G.ship.x) * 0.0042;
      const a = -Math.PI * 0.5 + outward;
      pushShot(o.x, o.y - 8, Math.cos(a) * v, Math.sin(a) * v, 0.85, true);
    }
    capArr(G.shots, 80);
    audio.shoot();
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (src === 'shot') {
      spark(e.x, e.y, G.focus ? GOLD : LIME);
      hitStop(0.034);
      audio.hit(G.combo);
      kick(1.7);
    }
    if (e.kind === 'boss' && src === 'shot') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' ? PNK : e.kind === 'dragon' || e.kind === 'beetle' ? JADE : LIME;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 46 : e.kind === 'dragon' ? 22 : 14);
    const pts = Math.round(e.score * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss');
    spawnGem(e.x, e.y, e.gems || 1);
    addBloom(0.8);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(GOLD, 0.72);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, LIME);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      for (let i = G.bullets.length - 1; i >= 0; i--) {
        spawnGem(G.bullets[i].x, G.bullets[i].y, 1);
        G.bullets.splice(i, 1);
      }
      G.winT = 1.35;
      toast('虫后碎裂', false, true);
    } else if (e.kind === 'dragon' || e.kind === 'pod' || e.kind === 'beetle') {
      audio.explode();
      hitStop(0.05);
      kick(3.2);
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.bloom = Math.max(10, G.bloom * 0.5);
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, LIME, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    resetOptions();
    G.invuln = 1.5;
    G.deadT = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '坠林了', '选项珠跟舰，停住收束。击破洒露华。分数 ' + G.score + '。');
    setHint('R 重开 · 选项珠跟舰，停住收束', 'warn');
  }

  function goWin() {
    addScore(isSea() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    showOverlay(
      'win',
      isSea() ? '虫海通关' : '后宫尽碎',
      '三关打穿，虫后已碎。分数 ' + G.score + (isSea() ? ' · 虫海' : ' · 虫林') + '。'
    );
    setHint('后宫已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.gems.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function resetOptions() {
    for (let i = 0; i < G.opts.length; i++) {
      const s = i % 2 === 0 ? -1 : 1;
      const k = (i / 2) | 0;
      G.opts[i].x = G.ship.x + s * (26 + k * 22);
      G.opts[i].y = G.ship.y + 8;
    }
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * G.mult));
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    const st = STAGES[G.stage - 1];
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '后宫'), false, true);
    audio.wave();
    screenFlash(LIME, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'sea' ? 'sea' : 'forest';
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
    G.bloom = 18;
    G.focus = false;
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
    G.moving = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    resetOptions();
    if (scoreEl) scoreEl.textContent = '0';
    toast(isSea() ? '虫海' : '虫林', isSea(), !isSea());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'forest';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.bloom = 18;
    G.focus = false;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    resetOptions();
    clearWorld();
    showOverlay('title', '虫姬', '纵卷虫林。空格连射，选项珠跟舰。移动散开，停住收束。击破洒露华。短关之后是虫后。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('forest');
    else startGame(G.kind || 'forest');
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
      p.vx *= Math.exp(-dt * 1.8);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.6;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.6;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < motes.length; i++) {
      const s = motes[i];
      s.y += scr * 0.42 * s.z * dt;
      s.x += Math.sin(G.t * 1.4 + i) * 8 * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
  }

  function optionOffset(i, n, focused) {
    const k = i - (n - 1) * 0.5;
    if (focused) {
      return { x: k * 13, y: -24 - Math.abs(k) * 2 };
    }
    return { x: k * 38, y: 12 + Math.abs(k) * 7 };
  }

  function updateOptions(dt) {
    const n = optionCount();
    const spd = hypot(G.ship.vx, G.ship.vy);
    const moving = spd > 42 || (inputSrc === 'ptr' && pointer.down && G.moving > 0.04);
    const wantFocus = G.mode === 'play' && G.deadT <= 0 && !moving;
    if (wantFocus !== G.focus && G.mode === 'play' && G.deadT <= 0) {
      G.focus = wantFocus;
      if (G.focus) {
        audio.focusOn();
        if (wpnLabel) {
          wpnLabel.classList.remove('hot');
          void wpnLabel.offsetWidth;
          wpnLabel.classList.add('hot');
          wpnTok += 1;
        }
      }
      syncHud();
    } else {
      G.focus = wantFocus;
    }
    const k = G.focus ? 14 : 9;
    for (let i = 0; i < G.opts.length; i++) {
      const o = G.opts[i];
      const off = optionOffset(i, n, G.focus);
      const tx = G.ship.x + off.x;
      const ty = G.ship.y + off.y;
      o.x = lerp(o.x, tx, 1 - Math.exp(-dt * k));
      o.y = lerp(o.y, ty, 1 - Math.exp(-dt * k));
    }
  }

  function updateShip(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = shipSpeed();
    let dx = 0;
    let dy = 0;
    if (keys.l) dx -= 1;
    if (keys.r) dx += 1;
    if (keys.u) dy -= 1;
    if (keys.d) dy += 1;
    if (dx || dy) {
      const len = hypot(dx, dy);
      dx /= len;
      dy /= len;
      G.ship.vx = dx * spd;
      G.ship.vy = dy * spd;
      inputSrc = 'key';
      G.moving = 0.12;
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      const px = G.ship.x;
      const py = G.ship.y;
      G.ship.x = lerp(G.ship.x, tx, 1 - Math.exp(-dt * 16));
      G.ship.y = lerp(G.ship.y, ty, 1 - Math.exp(-dt * 16));
      G.ship.vx = (G.ship.x - px) / Math.max(0.0001, dt);
      G.ship.vy = (G.ship.y - py) / Math.max(0.0001, dt);
      if (hypot(G.ship.x - tx, G.ship.y - ty) > 6) G.moving = 0.12;
    } else {
      G.ship.vx *= Math.exp(-dt * 10);
      G.ship.vy *= Math.exp(-dt * 10);
    }
    G.ship.x += (inputSrc === 'key' ? G.ship.vx * dt : 0);
    G.ship.y += (inputSrc === 'key' ? G.ship.vy * dt : 0);
    G.ship.x = clamp(G.ship.x, 22, VW - 22);
    G.ship.y = clamp(G.ship.y, 40, VH - 28);
    if (G.moving > 0) G.moving -= dt;
    updateOptions(dt);
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (!wantFire()) return;
    fireShot();
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -24 || s.x < -20 || s.x > VW + 20) {
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
          burst(s.x, s.y, s.opt ? CYN : LIME, 5, 70);
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
      b.ang = Math.atan2(b.vy, b.vx);
      if (b.life <= 0 || b.y > VH + 22 || b.y < -32 || b.x < -22 || b.x > VW + 22) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = b.x - G.ship.x;
        const dy = b.y - (G.ship.y - 2);
        const rr = HIT_R + b.r * 0.5;
        if (dx * dx + dy * dy < rr * rr) {
          G.bullets.splice(i, 1);
          diePlayer();
        }
      }
    }
  }

  function updateGems(dt) {
    const magnet = 150 + Math.min(220, G.combo * 18);
    const grab = G.focus ? 26 : 18;
    const range = G.focus ? 128 : 92;
    for (let i = G.gems.length - 1; i >= 0; i--) {
      const s = G.gems[i];
      s.t += dt;
      s.spin += dt * 5;
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = G.ship.x - s.x;
        const dy = G.ship.y - s.y;
        const d = hypot(dx, dy);
        if (d < grab) {
          collectGem(s);
          G.gems.splice(i, 1);
          continue;
        }
        if (d < range) {
          const k = magnet / Math.max(24, d);
          s.vx += (dx / d) * k * dt * 60;
          s.vy += (dy / d) * k * dt * 60;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= Math.exp(-dt * 1.4);
      s.vy += 28 * dt;
      if (s.y > VH + 20 || s.t > 7) G.gems.splice(i, 1);
    }
  }

  function fireInterval(e) {
    const sea = isSea() ? 0.74 : 1;
    if (e.kind === 'moth') return 1.45 * sea;
    if (e.kind === 'beetle') return 1.05 * sea;
    if (e.kind === 'cocoon') return 0.92 * sea;
    if (e.kind === 'dragon') return 0.82 * sea;
    if (e.kind === 'pod') return 1.1 * sea;
    if (e.kind === 'boss') return 0.55 * sea;
    return 1.2 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'moth') {
      e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp * 0.35;
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20 && e.y < VH - 80) {
        aimedFire(e, 1, 0, bulletSpd(), true);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'firefly') {
      if (e.t > 0.35) {
        const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
        e.vx = lerp(e.vx, Math.cos(a) * 210 * dens(), 1 - Math.exp(-dt * 3));
        e.vy = lerp(e.vy, Math.sin(a) * 240 * dens(), 1 - Math.exp(-dt * 3));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else if (e.kind === 'beetle') {
      e.x = e.baseX + Math.sin(e.t * 1.6 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 28) e.vy = 28;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.22, bulletSpd(), true);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'cocoon') {
      e.y += e.vy * dt;
      if (e.y > 70 && e.vy > 16) e.vy = 16;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, isSea() ? 2 : 1, 0.16, bulletSpd() * 0.92, false);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'dragon') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 5, 0.18, bulletSpd(), true);
        if ((e.pattern++ % 4) === 0) ringFire(e, 6, bulletSpd() * 0.7, e.t, true);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'pod') {
      const b = findBoss();
      const cx = b ? b.x : VW * 0.5;
      const cy = b ? b.y : 110;
      e.ang += dt * 1.45;
      e.x = cx + Math.cos(e.ang) * e.rad;
      e.y = cy + Math.sin(e.ang) * e.rad * 0.55;
      if (G.mode === 'play' && e.fireCd <= 0) {
        aimedFire(e, 1, 0, bulletSpd() * 0.9, true);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'boss') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, 118, 1 - Math.exp(-dt * 3.2));
      } else {
        e.x = VW * 0.5 + Math.sin(e.t * 0.7) * 96;
        e.y = 118 + Math.sin(e.t * 1.1) * 10;
      }
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.4 : 2.4);
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      if (ratio > 0.66) {
        aimedFire(e, 5, 0.2, spd, true);
        if (Math.random() < 0.5) flowerFire(e, 10, spd * 0.7, e.spin);
        e.fireCd = 1.12 * (isSea() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        flowerFire(e, 12, spd * 0.78, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 3, 0.18, spd, true);
        e.fireCd = 0.5 * (isSea() ? 0.78 : 1);
      } else {
        flowerFire(e, 14, spd * 0.76, e.spin);
        ringFire(e, 8, spd * 0.56, -e.spin * 0.7, true);
        aimedFire(e, 3, 0.16, spd * 1.05, true);
        if ((e.pattern++ % 4) === 0) {
          spawnMoth(e.x - 40, e.y + 20, -30, 110);
          spawnMoth(e.x + 40, e.y + 20, 30, 110);
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
      if (e.y > VH + 40 || e.x < -50 || e.x > VW + 50) {
        if (e.kind !== 'boss' && e.kind !== 'pod') {
          e.alive = false;
          G.enemies.splice(i, 1);
        }
        continue;
      }
      if (canHurt) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = (e.kind === 'boss' ? e.r * 0.62 : e.r * 0.7) + HIT_R;
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
      if (G.gapT >= 1.55) {
        G.gapT = 0;
        if (G.stage < 3) nextStage();
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.ship.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.ship.y = VH - 96;
      G.ship.vx = Math.cos(G.t * 0.7) * 34;
      G.focus = false;
      updateOptions(dt);
      if (living() < 6 && (G.t * 2 | 0) !== ((G.t - dt) * 2 | 0) && Math.random() < 0.45) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 50);
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
      updateBullets(dt);
      updateGems(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.winT > 0) {
      G.winT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateGems(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateGems(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathLeaf(c, x, y, r, rot) {
    c.beginPath();
    const a0 = rot || 0;
    c.moveTo(sx(x + Math.cos(a0) * r), sy(y + Math.sin(a0) * r));
    c.quadraticCurveTo(
      sx(x + Math.cos(a0 + 1.2) * r * 0.72),
      sy(y + Math.sin(a0 + 1.2) * r * 0.72),
      sx(x + Math.cos(a0 + Math.PI) * r * 0.85),
      sy(y + Math.sin(a0 + Math.PI) * r * 0.85)
    );
    c.quadraticCurveTo(
      sx(x + Math.cos(a0 - 1.2) * r * 0.72),
      sy(y + Math.sin(a0 - 1.2) * r * 0.72),
      sx(x + Math.cos(a0) * r),
      sy(y + Math.sin(a0) * r)
    );
    c.closePath();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#041008';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(70), 10 * scale, sx(VW * 0.5), sy(VH * 0.42), 400 * scale);
    g.addColorStop(0, 'rgba(61,255,106,0.1)');
    g.addColorStop(1, 'rgba(4,16,8,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const yOff = (G.scroll * 0.38) % 56;
    c.fillStyle = 'rgba(18,48,28,0.45)';
    for (let i = -1; i < 16; i++) {
      const y = i * 56 - yOff;
      c.beginPath();
      c.ellipse(sx(40 + Math.sin(i) * 8), sy(y), 28 * scale, 18 * scale, 0, 0, TAU);
      c.fill();
      c.beginPath();
      c.ellipse(sx(VW - 42 + Math.cos(i) * 8), sy(y + 18), 30 * scale, 20 * scale, 0, 0, TAU);
      c.fill();
    }

    c.fillStyle = 'rgba(6,22,12,0.72)';
    c.fillRect(sx(0), sy(0), 34 * scale, VH * scale);
    c.fillRect(sx(VW - 34), sy(0), 34 * scale, VH * scale);
    const wallOff = (G.scroll * 0.7) % 40;
    for (let i = -1; i < 22; i++) {
      const y = i * 40 - wallOff;
      c.fillStyle = rgba(LEAF, 0.85);
      c.beginPath();
      c.ellipse(sx(16), sy(y), 14 * scale, 22 * scale, 0, 0, TAU);
      c.fill();
      c.beginPath();
      c.ellipse(sx(VW - 16), sy(y + 18), 14 * scale, 22 * scale, 0, 0, TAU);
      c.fill();
      c.strokeStyle = 'rgba(61,255,106,0.18)';
      c.lineWidth = Math.max(0.8, scale);
      pathLeaf(c, 16, y - 6, 12, -0.4);
      c.stroke();
      pathLeaf(c, VW - 16, y + 12, 12, 0.4 + Math.PI);
      c.stroke();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < motes.length; i++) {
      const p = motes[i];
      c.fillStyle = rgba(p.hue, p.a * 0.55);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const rgb = flash ? WHT : (
      e.kind === 'boss' ? PNK :
      e.kind === 'dragon' ? JADE :
      e.kind === 'beetle' ? LIME :
      e.kind === 'cocoon' ? GOLD :
      e.kind === 'firefly' ? CYN : MAG
    );

    if (e.kind === 'cocoon') {
      c.fillStyle = rgba(DEEP, 0.92);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), (e.r - 1) * scale, (e.r + 4) * scale, 0, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.85);
      c.lineWidth = Math.max(1, 1.3 * scale);
      c.stroke();
      c.strokeStyle = rgba(JADE, 0.45);
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y - e.r - 8));
      c.lineTo(sx(e.x), sy(e.y - e.r));
      c.stroke();
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 2), 3.6 * scale, 0, TAU);
      c.fill();
      return;
    }

    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(PNK, 0.16);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 56 * scale, 34 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(MAG, flash ? 0.55 : 0.32);
      c.beginPath();
      c.ellipse(sx(e.x - 28), sy(e.y), 26 * scale, 16 * scale, -0.35, 0, TAU);
      c.fill();
      c.beginPath();
      c.ellipse(sx(e.x + 28), sy(e.y), 26 * scale, 16 * scale, 0.35, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.95);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 22 * scale, 28 * scale, 0, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(LIME, 0.95);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : GOLD, 0.92);
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y - 30));
      c.lineTo(sx(e.x + 7), sy(e.y - 16));
      c.lineTo(sx(e.x - 7), sy(e.y - 16));
      c.closePath();
      c.fill();
      c.fillStyle = rgba(PNK, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 8), 7 * scale, 0, TAU);
      c.fill();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 36), sy(e.y - e.r - 16), 72 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : LIME, 0.95);
      c.fillRect(sx(e.x - 36), sy(e.y - e.r - 16), 72 * ratio * scale, 5 * scale);
      return;
    }

    if (e.kind === 'firefly') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(CYN, 0.28);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 12 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(flash ? WHT : GOLD, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 4.4 * scale, 0, TAU);
      c.fill();
      c.restore();
      return;
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    const wing = 7 + Math.sin(G.t * 14 + e.phase) * 1.6;
    c.fillStyle = rgba(PNK, 0.28);
    c.beginPath();
    c.ellipse(sx(e.x - 11), sy(e.y - 1), wing * scale, 5 * scale, -0.5, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(sx(e.x + 11), sy(e.y - 1), wing * scale, 5 * scale, 0.5, 0, TAU);
    c.fill();
    c.restore();

    c.fillStyle = rgba(flash ? WHT : rgb, 0.95);
    if (e.kind === 'dragon') {
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 8 * scale, 16 * scale, 0, 0, TAU);
      c.fill();
    } else if (e.kind === 'beetle') {
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 11 * scale, 13 * scale, 0, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.7);
      c.lineWidth = Math.max(0.8, scale);
      c.beginPath();
      c.moveTo(sx(e.x - 3), sy(e.y - 12));
      c.lineTo(sx(e.x), sy(e.y - 20));
      c.lineTo(sx(e.x + 3), sy(e.y - 12));
      c.stroke();
    } else {
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 9 * scale, 11 * scale, 0, 0, TAU);
      c.fill();
    }
    c.strokeStyle = rgba(JADE, 0.75);
    c.lineWidth = Math.max(0.8, scale);
    c.beginPath();
    c.ellipse(sx(e.x), sy(e.y), (e.kind === 'dragon' ? 8 : 9) * scale, (e.kind === 'dragon' ? 16 : 11) * scale, 0, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(DEEP, 0.8);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y + 2), 2.4 * scale, 0, TAU);
    c.fill();
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const rgb = s.opt ? CYN : LIME;
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y), 2.2 * scale, 7 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), 1.4 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(rgb, 0.32);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y));
        c.lineTo(sx(s.x - s.vx * 0.016), sy(s.y - s.vy * 0.016));
        c.stroke();
      }
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      if (b.petal) {
        c.save();
        c.translate(sx(b.x), sy(b.y));
        c.rotate(b.ang);
        c.fillStyle = rgba(PET, 0.92);
        c.beginPath();
        c.ellipse(0, 0, b.r * 1.35 * scale, b.r * 0.7 * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.92);
        c.beginPath();
        c.ellipse(0, 0, b.r * 0.45 * scale, b.r * 0.28 * scale, 0, 0, TAU);
        c.fill();
        c.restore();
      } else {
        c.fillStyle = rgba(MAG, 0.92);
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.95);
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), b.r * 0.42 * scale, 0, TAU);
        c.fill();
      }
      if (!REDUCE) {
        c.strokeStyle = rgba(PNK, 0.26);
        c.lineWidth = 1;
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), (b.r + 3.1) * scale, 0, TAU);
        c.stroke();
      }
    }
    for (let i = 0; i < G.gems.length; i++) {
      const s = G.gems[i];
      c.fillStyle = rgba(GOLD, 0.95);
      pathLeaf(c, s.x, s.y, 5.4, s.spin);
      c.fill();
      c.fillStyle = rgba(LIME, 0.9);
      pathLeaf(c, s.x, s.y, 2.4, s.spin + 0.6);
      c.fill();
    }
    c.restore();
  }

  function drawOptions() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const n = optionCount();
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const o = G.opts[i];
      c.strokeStyle = rgba(G.focus ? GOLD : CYN, 0.28);
      c.lineWidth = 1.1 * scale;
      c.beginPath();
      c.moveTo(sx(G.ship.x), sy(G.ship.y));
      c.lineTo(sx(o.x), sy(o.y));
      c.stroke();
      c.fillStyle = rgba(G.focus ? GOLD : CYN, 0.22);
      c.beginPath();
      c.arc(sx(o.x), sy(o.y), 9 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(G.focus ? GOLD : CYN, 0.95);
      c.beginPath();
      c.arc(sx(o.x), sy(o.y), 4.2 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(o.x - 0.6), sy(o.y - 0.8), 1.5 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(G.focus ? GOLD : LIME, 0.2 + (G.muzzle > 0 ? 0.2 : 0));
    c.beginPath();
    c.ellipse(sx(x), sy(y), 16 * scale, 12 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.42);
    c.beginPath();
    c.moveTo(sx(x - 5), sy(y + 8));
    c.lineTo(sx(x), sy(y + 18 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x + 5), sy(y + 8));
    c.fill();
    c.restore();

    c.fillStyle = rgba(PNK, 0.22);
    c.beginPath();
    c.ellipse(sx(x - 12), sy(y + 2), 9 * scale, 4.2 * scale, -0.5, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(sx(x + 12), sy(y + 2), 9 * scale, 4.2 * scale, 0.5, 0, TAU);
    c.fill();

    c.fillStyle = rgba(LIME, 0.96);
    c.beginPath();
    c.ellipse(sx(x), sy(y + 2), 11 * scale, 9 * scale, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(JADE, 0.95);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    c.stroke();

    c.fillStyle = rgba(PNK, 0.95);
    c.beginPath();
    c.moveTo(sx(x), sy(y - 18));
    c.lineTo(sx(x + 5), sy(y - 7));
    c.lineTo(sx(x - 5), sy(y - 7));
    c.closePath();
    c.fill();

    c.fillStyle = rgba(WHT, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y - 2), 2.6 * scale, 0, TAU);
    c.fill();

    c.fillStyle = rgba(GOLD, 0.9);
    c.fillRect(sx(x - 11), sy(y + 4), 5 * scale, 3 * scale);
    c.fillRect(sx(x + 6), sy(y + 4), 5 * scale, 3 * scale);

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 16), 5 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
    if (G.focus && !REDUCE) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(GOLD, 0.5);
      c.lineWidth = 1.3 * scale;
      c.beginPath();
      c.arc(sx(x), sy(y), (8 + Math.sin(G.t * 14) * 1.4) * scale, 0, TAU);
      c.stroke();
      c.restore();
    }
  }

  function drawFx() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / 0.4, 0, 1);
      c.fillStyle = rgba(q.rgb, a);
      c.beginPath();
      c.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (6 + s.t * 42) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    c.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.fillStyle = rgba(f.rgb, a);
      c.font = ((f.gold ? 13 : 11) * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#06140c';
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#06140c';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
    }
    drawShots();
    drawOptions();
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
      startGame('forest');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
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
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R')) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
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
      startGame('forest');
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
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
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

  seedMotes();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnForest) {
    btnForest.addEventListener('click', function () {
      audio.ensure();
      startGame('forest');
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
      startGame(G.kind || 'forest');
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
