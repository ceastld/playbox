'use strict';

(function () {
  const VW = 720;
  const VH = 720;
  const CX = 360;
  const CY = 368;
  const YSQ = 0.92;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const Z_FAR = 6.15;
  const Z_NEAR = 1.05;
  const FOCAL = 312;
  const TURN = 3.65;
  const PTR_TURN = 9.2;
  const SHOT_V = 2.55;
  const FIRE_CD = 0.11;
  const FIRE_CD_DUAL = 0.085;
  const COMBO_WIN = 1.48;
  const BEST_KEY = 'playbox-gyruss-best';
  const MUTE_KEY = 'playbox-gyruss-mute';
  const OPS = '← → / A D 绕圈 · 空格向内开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const PUR = [155, 92, 255];
  const WHT = [246, 243, 255];
  const ORG = [255, 140, 64];
  const MINT = [80, 240, 210];

  const PLANETS = [
    { name: '海王星', en: 'NEPTUNE', rgb: [70, 170, 255] },
    { name: '天王星', en: 'URANUS', rgb: [80, 240, 210] },
    { name: '土星', en: 'SATURN', rgb: [255, 200, 90] },
    { name: '木星', en: 'JUPITER', rgb: [255, 150, 70] },
    { name: '地球', en: 'EARTH', rgb: [70, 210, 255] }
  ];

  const STAGES = [
    { type: 'fight', planet: 0 },
    { type: 'chance', planet: 0 },
    { type: 'fight', planet: 1 },
    { type: 'chance', planet: 1 },
    { type: 'fight', planet: 2 },
    { type: 'chance', planet: 2 },
    { type: 'fight', planet: 3 },
    { type: 'chance', planet: 3 },
    { type: 'fight', planet: 4 }
  ];

  const KIND_RGB = {
    ship: CYN,
    sat: GOLD,
    spiral: MAG,
    orb: PUR,
    chance: MINT
  };

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnCamp = document.getElementById('btn-camp');
  const btnEnd = document.getElementById('btn-end');
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

  const keys = { l: false, r: false };
  const pointer = { down: false, hover: false, ang: Math.PI / 2, id: null };
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
    stage: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: 20000,
    ang: Math.PI / 2,
    enemies: [],
    shots: [],
    bombs: [],
    pickups: [],
    queue: [],
    qT: 0,
    dual: false,
    fireCd: 0,
    fireHold: false,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    toastT: 0,
    why: '',
    phase: 'fight',
    warpT: 0,
    warpTo: 0,
    chalHits: 0,
    chalTotal: 32,
    chalDone: 0,
    chalIdx: 0,
    kills: 0,
    didDrop: false,
    muzzle: 0,
    demoT: 0.4,
    webRgb: PUR.slice()
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
  function wrapAng(a) {
    a %= TAU;
    if (a < 0) a += TAU;
    return a;
  }
  function angDiff(a, b) {
    let d = (a - b) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    return d;
  }
  function isCamp() {
    return G.kind !== 'frenzy';
  }
  function isFrenzy() {
    return G.kind === 'frenzy';
  }
  function stageOf() {
    return STAGES[Math.min(G.stage, STAGES.length - 1)];
  }
  function planetOf() {
    return PLANETS[stageOf().planet];
  }
  function diff() {
    return 1 + stageOf().planet * 0.13 + (isFrenzy() ? 0.32 : 0);
  }
  function rgbOf(e) {
    if (e.hitFlash > 0) return WHT;
    if (e.kind === 'orb' && e.hp <= 1) return GOLD;
    if (e.kind === 'chance') {
      const pal = [MINT, MAG, CYN, GOLD];
      return pal[e.g & 3];
    }
    return KIND_RGB[e.kind] || CYN;
  }

  function project(ang, depth) {
    const d = clamp(depth, -0.06, 1.28);
    const z = lerp(Z_FAR, Z_NEAR, clamp(d, 0, 1));
    const f = FOCAL / z;
    return {
      x: CX + Math.cos(ang) * f,
      y: CY + Math.sin(ang) * f * YSQ,
      s: f / 278,
      r: f
    };
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
      this.beep(920, 0.055, 'square', 0.03, 1760);
      this.beep(460, 0.04, 'triangle', 0.016, 220);
    },
    dualShoot() {
      this.ensure();
      this.beep(760, 0.05, 'square', 0.026, 1520);
      this.beep(1080, 0.07, 'square', 0.028, 1880);
    },
    hit(kind, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.035);
      const base = kind === 'orb' ? 980 : kind === 'spiral' ? 740 : kind === 'sat' ? 560 : 640;
      this.noise(0.04, 0.036, 1100);
      this.beep(base * lift, 0.07, 'square', 0.046, base * lift * 1.48);
    },
    chip() {
      this.ensure();
      this.beep(260, 0.055, 'sawtooth', 0.036, 190);
      this.beep(640, 0.07, 'square', 0.03, 900);
    },
    bomb() {
      this.ensure();
      this.beep(210, 0.05, 'square', 0.022, 140);
    },
    explode() {
      this.ensure();
      this.noise(0.11, 0.05, 480);
      this.beep(280, 0.14, 'sawtooth', 0.044, 70);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    power() {
      this.ensure();
      this.beep(523, 0.09, 'square', 0.046, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1175);
      this.beep(1046, 0.18, 'sine', 0.038, 1568);
    },
    warp() {
      this.ensure();
      this.noise(0.16, 0.045, 280);
      this.beep(180, 0.22, 'sawtooth', 0.04, 90);
      this.beep(392, 0.14, 'sine', 0.04, 784);
      this.beep(784, 0.2, 'triangle', 0.036, 1568);
    },
    perfect() {
      this.ensure();
      this.beep(659, 0.1, 'square', 0.045, 880);
      this.beep(880, 0.12, 'triangle', 0.04, 1175);
      this.beep(1318, 0.22, 'sine', 0.05, 1760);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.052, 360);
      this.beep(300, 0.18, 'sawtooth', 0.05, 70);
      this.beep(160, 0.28, 'sine', 0.044, 42);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'sine', 0.04, 659);
      this.beep(784, 0.18, 'triangle', 0.044, 1046);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.05, 'sine', 0.016, 80);
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
    while (G.score >= G.next1up && G.lives < 6) {
      G.lives += 1;
      G.next1up += 20000;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
    comboTok += 1;
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.15;
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
    const n = 6;
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
    const st = stageOf();
    const planet = planetOf();
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '环轨';
      else if (G.phase === 'warp') stageLabel.textContent = '跃迁';
      else if (st.type === 'chance') stageLabel.textContent = '机会关';
      else stageLabel.textContent = planet.name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && (st.type === 'chance' || G.phase === 'warp' || st.planet >= 3));
    }
    if (tagLabel) {
      let tag = isCamp() ? '航线' : '乱舞';
      if (G.mode === 'play' && G.dual) tag = '双管';
      if (G.mode === 'play' && st.type === 'chance' && G.phase !== 'warp') {
        tag = G.chalHits + '/' + G.chalTotal;
      }
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.dual || G.combo >= 8 || (st.type === 'chance' && G.mode === 'play'));
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult >= 2 ? '连击 ×' + G.mult : '连击 ' + G.combo;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或相撞扣命', 'warn');
    else if (G.mode === 'win') setHint('太阳系航线完成 · R 再来', 'hot');
    else if (G.phase === 'warp') setHint('跃迁中 · 驶向下一个行星', 'hot');
    else if (st.type === 'chance') setHint('机会关 · 不还击 · 打全中有大奖', 'hot');
    else if (G.dual) setHint('双管在手 · 被击中会掉武装', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 躲开外圈敌机和弹', 'warn');
    else setHint('← → 绕圈 · 空格向内开火 · 吃金球双管', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GYRUSS';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (btnCamp) btnCamp.textContent = primary;
    if (btnEnd) {
      btnEnd.textContent = secondary;
      btnEnd.classList.remove('hidden');
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
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : mag >= 4 ? 'warp' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('warp');
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
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 40,
        life: rand(0.22, 0.52),
        max: 0.52,
        r: rand(1.2, 2.9),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 150);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 24);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 14);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.7, vy: -48, text: text, rgb: rgb });
    capArr(floats, 16);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 96; i++) {
      stars.push({
        ang: rand(0, TAU),
        depth: Math.random(),
        spd: rand(0.12, 0.55),
        r: Math.random() < 0.72 ? 0.7 : 1.25,
        a: rand(0.28, 0.92),
        rgb: Math.random() < 0.16 ? PUR : Math.random() < 0.12 ? CYN : Math.random() < 0.1 ? MAG : WHT
      });
    }
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function enqueue(t, fn) {
    G.queue.push({ t: t, spawn: fn });
  }

  function spawnFormation(kind, n, baseAng, dir, delay0) {
    for (let i = 0; i < n; i++) {
      G.enemies.push({
        kind: kind,
        ang: baseAng,
        depth: 0.02,
        hp: 1,
        maxHp: 1,
        state: 'form',
        age: -(delay0 || 0) - i * 0.11,
        dir: dir,
        baseAng: baseAng,
        idx: i,
        n: n,
        spin: dir * 1.6,
        spd: 0.42,
        shootT: rand(0.85, 1.75),
        hitFlash: 0,
        alive: true,
        challenge: false
      });
    }
  }

  function spawnSpirals(n, baseAng, spin) {
    for (let i = 0; i < n; i++) {
      G.enemies.push({
        kind: 'spiral',
        ang: wrapAng(baseAng + i * 0.22),
        depth: 0.02,
        hp: 1,
        maxHp: 1,
        state: 'go',
        age: -i * 0.1,
        spin: spin,
        spd: 0.36 + diff() * 0.045,
        shootT: rand(0.75, 1.55),
        hitFlash: 0,
        alive: true,
        challenge: false
      });
    }
  }

  function spawnSats(n) {
    for (let i = 0; i < n; i++) {
      const ang = wrapAng((i / Math.max(1, n)) * TAU + rand(-0.12, 0.12));
      G.enemies.push({
        kind: 'sat',
        ang: ang,
        depth: 0.02,
        hp: 1,
        maxHp: 1,
        state: 'out',
        age: -i * 0.15,
        spd: 0.4,
        ringSpd: (i % 2 === 0 ? 1 : -1) * (0.72 + rand(0, 0.38)),
        ringLife: 3.2 + rand(0, 1.1),
        chaseT: 0,
        shootT: rand(1.0, 2.1),
        hitFlash: 0,
        alive: true,
        challenge: false
      });
    }
  }

  function spawnOrbs(n) {
    for (let i = 0; i < n; i++) {
      G.enemies.push({
        kind: 'orb',
        ang: rand(0, TAU),
        depth: 0.02,
        hp: 2,
        maxHp: 2,
        state: 'go',
        age: -i * 0.26,
        spin: (i % 2 === 0 ? 1 : -1) * 0.85,
        spd: 0.22 + diff() * 0.02,
        shootT: 0.55,
        hitFlash: 0,
        alive: true,
        challenge: false
      });
    }
  }

  function spawnChanceUnit(g, i, spd) {
    const e = {
      kind: 'chance',
      g: g,
      idx: i,
      ang: 0,
      depth: 0.02,
      hp: 1,
      maxHp: 1,
      state: 'go',
      age: 0,
      spin: 0,
      spd: spd,
      shootT: 99,
      hitFlash: 0,
      alive: true,
      challenge: true
    };
    if (g === 0) {
      e.ang = -0.55 + i * 0.09;
      e.spin = 1.18;
    } else if (g === 1) {
      e.ang = Math.PI + 0.55 - i * 0.09;
      e.spin = -1.18;
    } else if (g === 2) {
      e.ang = (i < 4 ? -0.32 : Math.PI + 0.32) + (i % 4) * 0.11;
      e.spin = (i < 4 ? 0.25 : -0.25);
    } else {
      e.ang = (i / 8) * TAU;
      e.spin = 0.42;
    }
    G.enemies.push(e);
  }

  function spawnFight() {
    G.queue = [];
    const p = stageOf().planet;
    const extra = isFrenzy() ? 2 : 0;
    let t = 0.3;
    enqueue(t, function () { spawnFormation('ship', 6 + extra, 0.18, 1, 0); });
    t += 0.82;
    enqueue(t, function () { spawnFormation('ship', 6 + extra, Math.PI - 0.18, -1, 0); });
    t += 2.55;
    enqueue(t, function () { spawnSpirals(6 + extra, 0.5, 1.12); });
    t += 2.35;
    enqueue(t, function () { spawnSats(4 + p + extra); });
    if (p >= 1) {
      t += 1.95;
      enqueue(t, function () { spawnFormation('ship', 7 + extra, 1.15, 1, 0); });
    }
    if (p >= 2) {
      t += 1.55;
      enqueue(t, function () { spawnOrbs(2 + (p >= 4 ? 1 : 0) + (isFrenzy() ? 1 : 0)); });
    }
    if (p >= 3) {
      t += 1.45;
      enqueue(t, function () { spawnSpirals(8 + extra, 2.2, -1.28); });
      t += 0.75;
      enqueue(t, function () { spawnSats(4 + extra); });
    }
    if (p >= 4) {
      t += 1.15;
      enqueue(t, function () { spawnFormation('ship', 8 + extra, Math.PI * 0.5, -1, 0); });
      t += 0.65;
      enqueue(t, function () { spawnOrbs(3 + (isFrenzy() ? 1 : 0)); });
    }
    if (isFrenzy()) {
      t += 0.95;
      enqueue(t, function () { spawnSpirals(8, rand(0, TAU), 1.5); });
    }
  }

  function spawnChance() {
    G.queue = [];
    G.chalHits = 0;
    G.chalTotal = 32;
    G.chalDone = 0;
    const spd = 0.44 + G.chalIdx * 0.05 + (isFrenzy() ? 0.1 : 0);
    for (let g = 0; g < 4; g++) {
      for (let i = 0; i < 8; i++) {
        enqueue(0.35 + g * 2.35 + i * 0.09, (function (gg, ii, ss) {
          return function () { spawnChanceUnit(gg, ii, ss); };
        })(g, i, spd));
      }
    }
  }

  function spawnPickup(ang) {
    G.pickups.push({
      kind: 'dual',
      ang: ang,
      depth: 0.12,
      state: 'out',
      ringLife: 4.2,
      alive: true
    });
  }

  function maybeDrop(e) {
    if (G.didDrop || G.phase !== 'fight' || G.mode !== 'play') return;
    if (G.kills >= 8) {
      G.didDrop = true;
      spawnPickup(e.ang);
    }
  }

  function scoreFor(e, kill) {
    const near = e.depth > 0.7;
    if (e.kind === 'sat') return near ? 100 : 50;
    if (e.kind === 'spiral') return near ? 200 : 100;
    if (e.kind === 'orb') return kill ? (near ? 400 : 200) : 80;
    if (e.kind === 'chance') return near ? 120 : 60;
    return near ? 160 : 80;
  }

  function killEnemy(e, scored) {
    if (!e.alive) return;
    e.alive = false;
    if (e.challenge) {
      G.chalDone += 1;
      if (scored) G.chalHits += 1;
    }
    if (scored) {
      G.kills += 1;
      maybeDrop(e);
    }
  }

  function hurtEnemy(e) {
    const p = project(e.ang, e.depth);
    e.hp -= 1;
    e.hitFlash = 0.09;
    if (e.hp > 0) {
      const n = scoreFor(e, false) * G.mult;
      bumpCombo();
      addScore(n);
      burst(p.x, p.y, GOLD, 8, 120);
      spark(p.x, p.y, WHT);
      floatText(p.x, p.y, String(n), GOLD);
      audio.chip();
      hitStop(0.032);
      kick(2.2);
      return;
    }
    const n = scoreFor(e, true) * G.mult;
    bumpCombo();
    addScore(n);
    const rgb = rgbOf(e);
    burst(p.x, p.y, rgb, e.kind === 'orb' ? 22 : 14, e.kind === 'orb' ? 220 : 170);
    spark(p.x, p.y, rgb);
    ring(p.x, p.y, rgb);
    floatText(p.x, p.y, String(n), rgb);
    audio.hit(e.kind, G.combo);
    if (e.kind === 'orb') audio.explode();
    hitStop(e.kind === 'orb' ? 0.07 : 0.042);
    kick(e.kind === 'orb' ? 5.2 : 3.1);
    screenFlash(rgb, e.kind === 'orb' ? 0.28 : 0.12);
    killEnemy(e, true);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.phase === 'warp') return;
    if (G.fireCd > 0) return;
    const max = G.dual ? 4 : 2;
    const need = G.dual ? 2 : 1;
    if (G.shots.length + need > max) return;
    G.fireCd = G.dual ? FIRE_CD_DUAL : FIRE_CD;
    G.muzzle = 0.07;
    if (G.dual) {
      G.shots.push({ ang: wrapAng(G.ang - 0.07), depth: 0.97 });
      G.shots.push({ ang: wrapAng(G.ang + 0.07), depth: 0.97 });
      audio.dualShoot();
    } else {
      G.shots.push({ ang: G.ang, depth: 0.97 });
      audio.shoot();
    }
  }

  function spawnBomb(e) {
    if (G.mode !== 'play' || G.phase !== 'fight') return;
    const cap = isFrenzy() ? 10 : 7;
    if (G.bombs.length >= cap) return;
    const aim = angDiff(G.ang, e.ang);
    G.bombs.push({
      ang: e.ang,
      depth: e.depth,
      vd: 0.5 + 0.07 * stageOf().planet + (isFrenzy() ? 0.12 : 0),
      va: clamp(aim, -0.85, 0.85) * 0.62,
      life: 2.5
    });
    audio.bomb();
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    if (keys.l && !keys.r) {
      G.ang = wrapAng(G.ang - TURN * dt);
      inputSrc = 'key';
    } else if (keys.r && !keys.l) {
      G.ang = wrapAng(G.ang + TURN * dt);
      inputSrc = 'key';
    } else if (inputSrc === 'ptr' && (pointer.down || pointer.hover) && G.mode === 'play') {
      const d = angDiff(pointer.ang, G.ang);
      G.ang = wrapAng(G.ang + clamp(d, -PTR_TURN * dt, PTR_TURN * dt));
    }
    G.muzzle = Math.max(0, G.muzzle - dt);
    if (!REDUCE && G.mode === 'play' && Math.random() < 0.45) {
      const p = project(wrapAng(G.ang + rand(-0.03, 0.03)), 1.02);
      particles.push({
        x: p.x, y: p.y,
        vx: Math.cos(G.ang) * rand(20, 70),
        vy: Math.sin(G.ang) * rand(20, 70) * YSQ,
        g: 0,
        life: rand(0.12, 0.28),
        max: 0.28,
        r: rand(0.8, 1.6),
        rgb: G.dual ? GOLD : CYN
      });
      capArr(particles, 150);
    }
  }

  function updateForm(e, dt) {
    e.age += dt;
    if (e.age < 0) return;
    const spread = (e.idx - (e.n - 1) * 0.5) * 0.145;
    if (e.age < 1.15) {
      const u = e.age / 1.15;
      e.depth = lerp(0.02, 0.52, u);
      e.ang = wrapAng(e.baseAng + e.dir * spread * u);
    } else if (e.age < 2.35) {
      const v = e.age - 1.15;
      e.ang = wrapAng(e.ang + e.dir * 1.72 * dt);
      e.depth = 0.52 + Math.sin(v * 2.55) * 0.18;
    } else {
      e.depth += (0.38 + diff() * 0.07) * dt;
      e.ang = wrapAng(e.ang + e.dir * 0.34 * dt);
      if (e.depth > 1.2) killEnemy(e, false);
    }
  }

  function updateSat(e, dt) {
    e.age += dt;
    if (e.age < 0) return;
    if (e.state === 'out' || e.state === 'form') {
      e.state = 'out';
      e.depth += e.spd * dt;
      if (e.depth >= 0.93) {
        e.depth = 0.93;
        e.state = 'ring';
      }
    } else if (e.state === 'ring') {
      e.ang = wrapAng(e.ang + e.ringSpd * dt);
      e.ringLife -= dt;
      if (e.ringLife <= 0) {
        e.state = 'chase';
        e.chaseT = 1.6;
      }
    } else if (e.state === 'chase') {
      const d = angDiff(G.ang, e.ang);
      e.ang = wrapAng(e.ang + clamp(d, -1.85 * dt, 1.85 * dt));
      e.depth += 0.07 * dt;
      e.chaseT -= dt;
      if (Math.abs(d) < 0.07 || e.chaseT <= 0) e.state = 'flee';
    } else {
      e.depth -= 0.58 * dt;
      if (e.depth < 0) killEnemy(e, false);
    }
  }

  function updateGo(e, dt) {
    e.age += dt;
    if (e.age < 0) return;
    e.ang = wrapAng(e.ang + e.spin * dt);
    let spd = e.spd;
    if (e.kind === 'orb') {
      e.depth += spd * dt;
      e.depth += Math.sin(e.age * 3.2) * 0.04 * dt;
    } else {
      e.depth += spd * dt;
    }
    if (e.depth > 1.18) killEnemy(e, false);
  }

  function updateEnemies(dt) {
    const canShoot = G.mode === 'play' && G.phase === 'fight' && G.deadT <= 0;
    const fireMul = 1 / diff();
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) {
        G.enemies.splice(i, 1);
        continue;
      }
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.kind === 'sat') updateSat(e, dt);
      else if (e.kind === 'ship' && e.state === 'form') updateForm(e, dt);
      else updateGo(e, dt);
      if (!e.alive) continue;
      if (canShoot && e.age > 0 && e.depth > 0.4 && e.depth < 0.92 && e.kind !== 'chance') {
        e.shootT -= dt;
        if (e.shootT <= 0) {
          e.shootT = rand(1.15, 2.25) * fireMul;
          if (e.kind === 'orb') e.shootT *= 0.55;
          spawnBomb(e);
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.depth -= SHOT_V * dt;
      if (s.depth < 0.03) {
        G.shots.splice(i, 1);
        if (G.mode === 'play') {
          breakCombo();
          audio.miss();
        }
      }
    }
  }

  function updateBombs(dt) {
    for (let i = G.bombs.length - 1; i >= 0; i--) {
      const b = G.bombs[i];
      b.depth += b.vd * dt;
      b.ang = wrapAng(b.ang + b.va * dt);
      b.va *= Math.pow(0.42, dt);
      b.life -= dt;
      if (b.depth > 1.1 || b.life <= 0) G.bombs.splice(i, 1);
    }
  }

  function updatePickups(dt) {
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const p = G.pickups[i];
      if (!p.alive) {
        G.pickups.splice(i, 1);
        continue;
      }
      if (p.state === 'out') {
        p.depth += 0.38 * dt;
        if (p.depth >= 0.94) {
          p.depth = 0.94;
          p.state = 'ring';
        }
      } else {
        p.ang = wrapAng(p.ang + 0.55 * dt);
        p.ringLife -= dt;
        if (p.ringLife <= 0) {
          p.depth -= 0.5 * dt;
          if (p.depth < 0) {
            p.alive = false;
            G.pickups.splice(i, 1);
          }
        }
      }
    }
  }

  function collideShots() {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive || e.age < 0) continue;
        const da = Math.abs(angDiff(s.ang, e.ang));
        const dd = Math.abs(s.depth - e.depth);
        const boxA = 0.1 + 0.05 * e.depth + (e.kind === 'orb' ? 0.04 : 0);
        const boxD = 0.075 + 0.035 * e.depth + (e.kind === 'orb' ? 0.03 : 0);
        if (da < boxA && dd < boxD) {
          hurtEnemy(e);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function hitPlayer() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.phase === 'warp') return;
    const pa = G.ang;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.age < 0) continue;
      if (e.depth < 0.86) continue;
      const lim = e.kind === 'sat' ? 0.13 : 0.145;
      if (Math.abs(angDiff(pa, e.ang)) < lim && e.depth < 1.12) {
        dieShip();
        return;
      }
    }
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (b.depth > 0.88 && b.depth < 1.05 && Math.abs(angDiff(pa, b.ang)) < 0.12) {
        dieShip();
        return;
      }
    }
  }

  function collectPickups() {
    if (G.mode !== 'play' || G.deadT > 0 || G.phase === 'warp') return;
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const p = G.pickups[i];
      if (p.depth < 0.86) continue;
      if (Math.abs(angDiff(G.ang, p.ang)) > 0.24) continue;
      const pos = project(p.ang, p.depth);
      const already = G.dual;
      G.dual = true;
      p.alive = false;
      G.pickups.splice(i, 1);
      const n = (already ? 800 : 500) * G.mult;
      bumpCombo();
      addScore(n);
      burst(pos.x, pos.y, GOLD, 18, 190);
      ring(pos.x, pos.y, GOLD);
      floatText(pos.x, pos.y, already ? '加分' : '双管', GOLD);
      audio.power();
      screenFlash(GOLD, 0.4);
      hitStop(0.045);
      kick(3.6);
      toast(already ? '双管加分' : '双管锁定', false, true);
    }
  }

  function dieShip() {
    const p = project(G.ang, 1);
    G.lives -= 1;
    G.deadT = 0.95;
    G.dual = false;
    G.fireHold = false;
    G.shots = [];
    breakCombo();
    burst(p.x, p.y, MAG, 28, 240);
    ring(p.x, p.y, MAG);
    spark(p.x, p.y, WHT);
    audio.death();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.074);
    syncPips();
  }

  function beginWarp(stage) {
    G.phase = 'warp';
    G.warpT = 1.65;
    G.warpTo = stage;
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.pickups = [];
    G.queue = [];
    const p = PLANETS[STAGES[Math.min(stage, STAGES.length - 1)].planet];
    G.webRgb = p.rgb.slice();
    screenFlash(p.rgb, 0.62);
    audio.warp();
    hitStop(0.048);
    kick(4.2);
  }

  function enterStage(n) {
    G.stage = n;
    const st = STAGES[n];
    G.phase = st.type;
    G.qT = 0;
    G.kills = 0;
    G.didDrop = false;
    G.ready = 0.55;
    G.queue = [];
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.pickups = [];
    G.webRgb = PLANETS[st.planet].rgb.slice();
    if (st.type === 'chance') {
      G.chalIdx += 1;
      spawnChance();
      toast('机会关 ' + G.chalIdx, false, true);
    } else {
      spawnFight();
      toast(PLANETS[st.planet].name, false, st.planet >= 3);
    }
    audio.wave();
    syncHud();
  }

  function stageClear() {
    if (G.mode !== 'play') return;
    const st = stageOf();
    addScore(300 * (G.stage + 1));
    if (st.type === 'chance') {
      if (G.chalHits >= G.chalTotal) {
        const bonus = 2000 * G.chalIdx * (isFrenzy() ? 2 : 1);
        addScore(bonus);
        audio.perfect();
        screenFlash(GOLD, 0.55);
        hitStop(0.078);
        kick(5.5);
        toast('完美 · +' + bonus, false, true);
        const c = project(0, 0.2);
        ring(c.x, c.y, GOLD);
      } else {
        toast('机会关 ' + G.chalHits + '/' + G.chalTotal, false, false);
      }
    } else {
      toast(planetOf().name + ' 肃清', false, true);
    }
    if (G.stage >= STAGES.length - 1) {
      winRun();
      return;
    }
    const next = G.stage + 1;
    if (STAGES[next].type === 'fight') beginWarp(next);
    else enterStage(next);
  }

  function winRun() {
    const bonus = isCamp() ? 8000 : 10000;
    addScore(bonus);
    G.mode = 'win';
    G.fireHold = false;
    audio.win();
    screenFlash(GOLD, 0.5);
    hitStop(0.06);
    kick(4);
    const title = isCamp() ? '航线通关' : '乱舞通关';
    const lead = (isCamp() ? '地球在望。' : '乱舞航线打穿。') + ' 本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('win', title, lead, '再来', isCamp() ? '乱舞' : '换模式');
    syncHud();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why;
    G.fireHold = false;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    const lead = (why || '舰毁了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '舰毁了', lead, '再来', '换模式');
    syncHud();
  }

  function resetField() {
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.pickups = [];
    G.queue = [];
    G.qT = 0;
    G.ang = Math.PI / 2;
    G.dual = false;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.chalHits = 0;
    G.chalTotal = 32;
    G.chalDone = 0;
    G.chalIdx = 0;
    G.kills = 0;
    G.didDrop = false;
    G.muzzle = 0;
    G.phase = 'fight';
    G.warpT = 0;
    G.ready = 0;
    G.stop = 0;
    G.stage = 0;
    G.webRgb = PUR.slice();
  }

  function startGame(kind) {
    G.kind = kind === 'frenzy' ? 'frenzy' : 'camp';
    G.mode = 'play';
    G.lives = LIVES;
    G.score = 0;
    G.why = '';
    G.clock = 0;
    G.next1up = 20000;
    resetField();
    hideOverlay();
    audio.start();
    beginWarp(0);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'camp';
    G.stage = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    resetField();
    G.demoT = 0.35;
    G.phase = 'fight';
    showOverlay('title', '环轨', '船绕外圈，朝中心开火。敌机从深处扑出。机会关打全中有大奖。', '航线', '乱舞');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('camp');
    else startGame(G.kind || 'camp');
  }

  function updateQueue(dt) {
    if (G.ready > 0) return;
    G.qT += dt;
    while (G.queue.length && G.qT >= G.queue[0].t) {
      const job = G.queue.shift();
      job.spawn();
    }
  }

  function updateFx(dt) {
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 0.18);
    G.toastT = Math.max(0, G.toastT - dt);
    const boost = G.phase === 'warp' ? 7.2 : 1;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.depth += s.spd * dt * boost;
      if (s.depth > 1.08) {
        s.depth = rand(0, 0.08);
        s.ang = rand(0, TAU);
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
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
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    updatePlayer(dt);
    if ((G.fireHold || pointer.down) && G.mode === 'play' && !overlayOpen()) fire();
    if (G.phase === 'warp') {
      G.warpT -= dt;
      updateShots(dt);
      if (G.warpT <= 0) enterStage(G.warpTo);
      return;
    }
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      collideShots();
      return;
    }
    updateQueue(dt);
    updateEnemies(dt);
    updateShots(dt);
    updateBombs(dt);
    updatePickups(dt);
    collideShots();
    collectPickups();
    hitPlayer();
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
      if (!(keys.l || keys.r)) G.ang = wrapAng(G.ang + 0.32 * dt);
      else updatePlayer(dt);
      G.demoT -= dt;
      if (G.demoT <= 0) {
        G.demoT = 3.1;
        spawnSpirals(5, rand(0, TAU), rand(0.7, 1.4) * (Math.random() < 0.5 ? 1 : -1));
      }
      updateEnemies(dt);
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      updateEnemies(dt * 0.4);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      updateQueue(dt);
      updateEnemies(dt);
      updateBombs(dt);
      updatePickups(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('舰毁了');
          updateFx(dt);
          return;
        }
        G.invuln = 1.5;
        G.bombs = [];
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && G.phase !== 'warp' && G.ready <= 0 && G.deadT <= 0) {
      if (G.queue.length === 0 && aliveCount() === 0) stageClear();
    }

    updateFx(dt);
    syncHud();
  }

  function drawLetterbox() {
    ctx.fillStyle = '#04010e';
    if (ox > 0.5) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W - ox - VW * scale + 2, H);
    }
    if (oy > 0.5) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H - oy - VH * scale + 2);
    }
  }

  function drawBg() {
    const g = ctx.createRadialGradient(sx(CX), sy(CY), 8 * scale, sx(CX), sy(CY), 420 * scale);
    g.addColorStop(0, '#14082c');
    g.addColorStop(0.35, '#0a0418');
    g.addColorStop(1, '#04010e');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const rgb = G.webRgb;
    const vg = ctx.createRadialGradient(sx(CX), sy(CY), 10 * scale, sx(CX), sy(CY), 280 * scale);
    vg.addColorStop(0, rgba(rgb, 0.16));
    vg.addColorStop(0.5, rgba(PUR, 0.05));
    vg.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const p = project(s.ang, s.depth);
      const a = s.a * (0.4 + 0.6 * s.depth);
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), (s.r * (0.5 + p.s)) * scale, 0, TAU);
      ctx.fill();
      if (!REDUCE && (G.phase === 'warp' || s.depth > 0.55)) {
        const q = project(s.ang, Math.max(0, s.depth - 0.06));
        ctx.strokeStyle = rgba(s.rgb, a * 0.35);
        ctx.lineWidth = 0.8 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(q.x), sy(q.y));
        ctx.lineTo(sx(p.x), sy(p.y));
        ctx.stroke();
      }
    }
  }

  function drawTube() {
    const rgb = G.webRgb;
    ctx.save();
    const spokes = 24;
    const rot = G.t * 0.04;
    ctx.lineWidth = 1 * scale;
    for (let i = 0; i < spokes; i++) {
      const a = rot + (i / spokes) * TAU;
      const a2 = a + TAU / spokes;
      const inner = project(a, 0.04);
      const outer = project(a, 1);
      ctx.strokeStyle = rgba(rgb, 0.1 + (i % 2) * 0.04);
      ctx.beginPath();
      ctx.moveTo(sx(inner.x), sy(inner.y));
      ctx.lineTo(sx(outer.x), sy(outer.y));
      ctx.stroke();
      ctx.fillStyle = rgba(PUR, 0.03);
      ctx.beginPath();
      const p0 = project(a, 0.08);
      const p1 = project(a2, 0.08);
      const p2 = project(a2, 1);
      const p3 = project(a, 1);
      ctx.moveTo(sx(p0.x), sy(p0.y));
      ctx.lineTo(sx(p1.x), sy(p1.y));
      ctx.lineTo(sx(p2.x), sy(p2.y));
      ctx.lineTo(sx(p3.x), sy(p3.y));
      ctx.closePath();
      ctx.fill();
    }
    for (let i = 0; i < 9; i++) {
      const d = 0.06 + i * 0.115;
      ctx.beginPath();
      const first = project(0, d);
      ctx.moveTo(sx(first.x), sy(first.y));
      for (let k = 1; k <= 64; k++) {
        const p = project((k / 64) * TAU, d);
        ctx.lineTo(sx(p.x), sy(p.y));
      }
      ctx.closePath();
      ctx.strokeStyle = rgba(rgb, 0.08 + d * 0.16);
      ctx.lineWidth = (d > 0.9 ? 2.2 : 1) * scale;
      ctx.stroke();
    }
    ctx.beginPath();
    const rim = project(0, 1);
    ctx.moveTo(sx(rim.x), sy(rim.y));
    for (let k = 1; k <= 64; k++) {
      const rp = project((k / 64) * TAU, 1);
      ctx.lineTo(sx(rp.x), sy(rp.y));
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(rgb, 0.42);
    ctx.lineWidth = 2.6 * scale;
    ctx.stroke();
    const core = 16 + 5 * Math.sin(G.t * 2.2);
    const grow = G.phase === 'warp' ? 1.35 + (1.65 - G.warpT) * 0.25 : 1;
    const grd = ctx.createRadialGradient(sx(CX), sy(CY), 2 * scale, sx(CX), sy(CY), core * grow * scale);
    grd.addColorStop(0, rgba(WHT, 0.95));
    grd.addColorStop(0.35, rgba(rgb, 0.85));
    grd.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(sx(CX), sy(CY), core * grow * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemy(e) {
    if (!e.alive || e.age < 0) return;
    const p = project(e.ang, e.depth);
    const rgb = rgbOf(e);
    const s = 0.85 + p.s * 0.9;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.rotate(e.ang - Math.PI / 2);
    ctx.scale(s * scale, s * scale);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(rgb, 0.18);
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.strokeStyle = rgba(WHT, 0.55);
    ctx.lineWidth = 0.7;
    if (e.kind === 'sat') {
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 2.1, 0, TAU);
      ctx.fill();
    } else if (e.kind === 'orb') {
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(e.hp <= 1 ? ORG : WHT, 0.9);
      ctx.beginPath();
      ctx.arc(-1.5, -1.8, 3.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, TAU);
      ctx.stroke();
    } else if (e.kind === 'spiral' || e.kind === 'chance') {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 6);
      ctx.lineTo(0, 2);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.quadraticCurveTo(0, -4, 10, 0);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(6, 4);
      ctx.lineTo(2, 2);
      ctx.lineTo(5, 9);
      ctx.lineTo(0, 5);
      ctx.lineTo(-5, 9);
      ctx.lineTo(-2, 2);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(-1.2, -4, 2.4, 6);
    }
    ctx.restore();
  }

  function drawEnemies() {
    const list = G.enemies.slice();
    list.sort(function (a, b) { return a.depth - b.depth; });
    for (let i = 0; i < list.length; i++) drawEnemy(list[i]);
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const p = project(s.ang, s.depth);
      const q = project(s.ang, Math.min(1, s.depth + 0.07));
      ctx.strokeStyle = rgba(G.dual ? GOLD : CYN, 0.28);
      ctx.lineWidth = 5 * scale * p.s;
      if (!REDUCE) {
        ctx.beginPath();
        ctx.moveTo(sx(q.x), sy(q.y));
        ctx.lineTo(sx(p.x), sy(p.y));
        ctx.stroke();
      }
      ctx.strokeStyle = rgba(WHT, 0.95);
      ctx.lineWidth = 2.1 * scale * p.s;
      ctx.beginPath();
      ctx.moveTo(sx(q.x), sy(q.y));
      ctx.lineTo(sx(p.x), sy(p.y));
      ctx.stroke();
      ctx.fillStyle = rgba(G.dual ? GOLD : CYN, 0.9);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 2.2 * scale * p.s, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      const p = project(b.ang, b.depth);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 2.8 * scale * p.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 1.2 * scale * p.s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPickups() {
    for (let i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      const p = project(u.ang, u.depth);
      const pulse = 0.7 + 0.3 * Math.sin(G.t * 10);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(GOLD, 0.18 * pulse);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 12 * scale * p.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 5.5 * scale * p.s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(sx(p.x - 1.2 * p.s), sy(p.y - 1.4 * p.s), 2 * scale * p.s, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.invuln * 18) | 0) % 2 === 0) return;
    const p = project(G.ang, 1);
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.rotate(G.ang - Math.PI / 2);
    const sc = scale * 1.18;
    ctx.scale(sc, sc);
    ctx.fillStyle = rgba(CYN, 0.2);
    ctx.beginPath();
    ctx.arc(0, 2, 12, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(G.dual ? GOLD : WHT, 0.98);
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(8, 9);
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(PUR, 0.95);
    ctx.beginPath();
    ctx.moveTo(-9, 3);
    ctx.lineTo(-4, 1);
    ctx.lineTo(-5, 8);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(9, 3);
    ctx.lineTo(4, 1);
    ctx.lineTo(5, 8);
    ctx.closePath();
    ctx.fill();
    if (G.dual) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(-5.5, -8, 2.2, 7);
      ctx.fillRect(3.3, -8, 2.2, 7);
    } else {
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(-1.1, -9, 2.2, 8);
    }
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 10);
      ctx.beginPath();
      ctx.arc(0, -16, 4 + G.muzzle * 40, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(0, -18, 2.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale * (0.6 + a * 0.6), 0, TAU);
      ctx.fill();
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
      const u = r.t / 0.42;
      ctx.strokeStyle = rgba(r.rgb, 1 - u);
      ctx.lineWidth = (2.4 - u * 1.6) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (10 + u * 42) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.font = '700 ' + Math.max(11, 13 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawWarpName() {
    if (G.phase !== 'warp' || G.mode !== 'play') return;
    const p = PLANETS[STAGES[Math.min(G.warpTo, STAGES.length - 1)].planet];
    const a = clamp(G.warpT / 1.65, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.75 * Math.sin(a * Math.PI);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.font = '900 ' + Math.max(22, 36 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.name, sx(CX), sy(CY - 52));
    ctx.font = '700 ' + Math.max(10, 12 * scale) + 'px "Segoe UI", sans-serif';
    ctx.fillStyle = rgba(p.rgb, 0.9);
    ctx.fillText(p.en, sx(CX), sy(CY - 24));
    ctx.restore();
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#04010e';
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
    drawStars();
    drawTube();
    drawEnemies();
    drawPickups();
    drawShots();
    drawShip();
    drawFx();
    drawWarpName();
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

  function pointerAngFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    const wx = (x - ox) / scale;
    const wy = (y - oy) / scale;
    return Math.atan2(wy - CY, wx - CX);
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
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'ArrowDown' || space) {
      if (down) e.preventDefault();
    }
    if (!down) {
      if (space || k === 'w' || k === 'W' || k === 'ArrowUp') G.fireHold = false;
      return;
    }
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      startGame('camp');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('frenzy');
      return;
    }
    if (space || k === 'Enter' || k === 'w' || k === 'W' || k === 'ArrowUp') {
      if (overlayOpen()) {
        if (k === '2') startGame('frenzy');
        else primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fire();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.ang = pointerAngFromEvent(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.ang = pointerAngFromEvent(e);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) G.fireHold = false;
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

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnCamp) {
    btnCamp.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('camp');
    });
  }
  if (btnEnd) {
    btnEnd.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && isCamp()) startGame('frenzy');
      else if (G.mode === 'win') goTitle();
      else startGame('frenzy');
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
