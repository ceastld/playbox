'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COLS = 12;
  const ROWS = 14;
  const BW = 32;
  const BH = 28;
  const WALL_X = 48;
  const WALL_Y = 42;
  const PLAYER_Y = 652;
  const GROUND_Y = 698;
  const SHOT_V = 740;
  const SHOT_MAX = 2;
  const POWER_SHOT_MAX = 3;
  const POWER_MAX = 7;
  const COMBO_WIN = 1.42;
  const GUARD_WAVES = 8;
  const BEST_KEY = 'playbox-zookeeper-best';
  const MUTE_KEY = 'playbox-zookeeper-mute';
  const OPS = '← → / WASD 移动 · 空格射击 · R 重开 · M 静音';
  const LEAD = '三色动物往砖墙顶爬。打中往下砸一格，砸穿砖能让它们掉下去。爬到顶就跑路，扣一命。';
  const WAVE_TAG = ['晨笼', '猴群', '蛇影', '象步', '裂砖', '夜园', '狂攀', '锁门'];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 200];
  const GOLD = [255, 227, 107];
  const MINT = [30, 232, 90];
  const TEAL = [18, 168, 72];
  const WHT = [232, 255, 240];
  const HOT = [92, 255, 138];
  const ORG = [255, 176, 56];
  const PNK = [255, 140, 200];
  const BRK = [38, 92, 56];
  const BRK2 = [52, 122, 72];
  const BRK_CR = [90, 150, 88];
  const TYPE_RGB = [ORG, MAG, CYN];
  const TYPE_SCORE = [80, 130, 200];
  const TYPE_HP = [1, 1, 2];
  const TYPE_HW = [13, 14, 16];
  const TYPE_HH = [13, 11, 15];
  const TYPE_NAME = ['猴', '蟒', '象'];

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
  const btnGuard = document.getElementById('btn-guard');
  const btnRush = document.getElementById('btn-rush');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnFire = document.getElementById('btn-fire');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const comboNum = document.getElementById('combo');
  const scoreBox = document.getElementById('score-box');
  const comboBox = document.getElementById('combo-box');
  const scoreAdd = document.getElementById('score-add');
  const modeLabel = document.getElementById('mode-label');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const pipsEl = document.getElementById('pips');
  const powerBar = document.getElementById('power-bar');
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

  const keys = { l: false, r: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const chips = [];
  const flies = [];

  const G = {
    mode: 'title',
    kind: 'guard',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    bestG: 0,
    bestR: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: 10000,
    bricks: [],
    animals: [],
    queue: [],
    shots: [],
    ship: { x: VW * 0.5, y: PLAYER_Y },
    bird: null,
    drop: null,
    birdT: 12,
    spawnT: 0.8,
    fireCd: 0,
    fireHold: false,
    power: 0,
    waveScore: 0,
    clearT: 0,
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
    muzzle: 0,
    lastWarn: 0,
    cracked: 0
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
  function isRush() {
    return G.kind === 'rush';
  }
  function isPlay() {
    return G.mode === 'play';
  }
  function shipMin() {
    return 28;
  }
  function shipMax() {
    return VW - 28;
  }
  function cellX(c) {
    return WALL_X + c * BW + BW * 0.5;
  }
  function cellY(r) {
    return WALL_Y + r * BH + BH * 0.5;
  }
  function colAt(x) {
    return clamp((x - WALL_X) / BW | 0, 0, COLS - 1);
  }
  function rowAt(y) {
    return clamp((y - WALL_Y) / BH | 0, 0, ROWS - 1);
  }
  function brickAt(c, r) {
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return 0;
    return G.bricks[r][c];
  }
  function inWallX(x) {
    return x >= WALL_X && x < WALL_X + COLS * BW;
  }
  function waveTag() {
    return WAVE_TAG[(G.wave - 1) % WAVE_TAG.length];
  }
  function scoreTarget() {
    return (isRush() ? 480 : 650) * G.wave;
  }
  function clearHold() {
    if (G.waveScore >= scoreTarget() && G.animals.length === 0) return 0.95;
    return isRush() ? 1.45 : 2.05;
  }
  function maxOnWall() {
    return (isRush() ? 8 : 6) + Math.min(8, G.wave);
  }
  function spawnInterval() {
    const base = isRush() ? 0.68 : 1.02;
    return Math.max(0.26, base - (G.wave - 1) * 0.062);
  }
  function climbCd(type) {
    const base = [0.7, 1.04, 1.42][type];
    const wave = Math.max(0.52, 1 - (G.wave - 1) * 0.048);
    const rush = isRush() ? 0.62 : 1;
    return base * wave * rush * rand(0.86, 1.12);
  }
  function currentBest() {
    return isRush() ? G.bestR : G.bestG;
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
    shoot(power) {
      this.ensure();
      if (power) {
        this.beep(320, 0.07, 'sawtooth', 0.04, 880);
        this.beep(980, 0.08, 'square', 0.034, 1600);
      } else {
        this.beep(880, 0.05, 'square', 0.028, 1680);
      }
    },
    hit(type, combo, power) {
      this.ensure();
      const base = type === 2 ? 240 : type === 1 ? 520 : 700;
      const lift = 1 + Math.min(0.55, combo * 0.038);
      this.noise(power ? 0.06 : 0.032, power ? 0.05 : 0.034, 900);
      this.beep(base * lift, power ? 0.1 : 0.068, 'square', 0.046, base * lift * (power ? 2.1 : 1.6));
    },
    splat() {
      this.ensure();
      this.noise(0.08, 0.048, 500);
      this.beep(180, 0.12, 'sawtooth', 0.04, 70);
    },
    crack() {
      this.ensure();
      this.noise(0.03, 0.03, 1600);
      this.beep(210, 0.045, 'square', 0.022, 90);
    },
    brick() {
      this.ensure();
      this.noise(0.055, 0.04, 700);
      this.beep(140, 0.08, 'sawtooth', 0.03, 55);
    },
    bird() {
      this.ensure();
      this.beep(880, 0.08, 'sine', 0.036, 1320);
      this.beep(1175, 0.14, 'triangle', 0.038, 1760);
    },
    power() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.036, 784);
      this.beep(784, 0.14, 'triangle', 0.04, 1175);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.034, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.024, 1320);
    },
    warn() {
      this.ensure();
      this.beep(420, 0.09, 'square', 0.03, 220);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.052, 380);
      this.beep(300, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.044, 48);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.038, 523);
      this.beep(523, 0.11, 'sine', 0.038, 659);
      this.beep(784, 0.2, 'triangle', 0.042, 1046);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.04, 659);
      this.beep(784, 0.12, 'triangle', 0.042, 1046);
      this.beep(1175, 0.22, 'sine', 0.04, 1568);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.036, 440);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    }
  };

  function loadBest() {
    G.bestG = 0;
    G.bestR = 0;
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.bestG = Math.max(0, o.g | 0);
        G.bestR = Math.max(0, o.r | 0);
      } else {
        const n = parseInt(raw, 10);
        G.bestG = isFinite(n) && n > 0 ? n : 0;
      }
    } catch (err) {
      G.bestG = 0;
      G.bestR = 0;
    }
  }

  function saveBest() {
    const n = G.score;
    if (isRush()) {
      if (n <= G.bestR) return;
      G.bestR = n;
    } else {
      if (n <= G.bestG) return;
      G.bestG = n;
    }
    if (bestEl) bestEl.textContent = String(currentBest());
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ g: G.bestG, r: G.bestR }));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (!isPlay() || n <= 0) return;
    G.score += n;
    G.waveScore += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
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
    saveBest();
    if (G.score >= G.next1up) {
      G.next1up += 10000;
      if (G.lives < 6) {
        G.lives += 1;
        audio.extra();
        toast('1UP', false, true);
        syncPips();
      }
    }
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    G.toastT = 1.15;
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1200);
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < 6) {
      const d = document.createElement('i');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(currentBest());
    if (comboNum) comboNum.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 4);
    if (modeLabel) {
      modeLabel.textContent = isRush() ? '狂奔' : '守园';
      modeLabel.classList.toggle('rush', isRush());
    }
    if (stageLabel) {
      stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.wave >= 6);
    }
    if (tagLabel) {
      tagLabel.textContent = waveTag();
      const danger = highestAnimal() <= 2 && G.animals.length > 0;
      tagLabel.classList.toggle('warn', danger);
      tagLabel.classList.toggle('hot', G.power > 0);
    }
    if (powerBar) {
      const p = G.power / POWER_MAX;
      powerBar.style.transform = 'scaleX(' + clamp(p, 0, 1) + ')';
      powerBar.classList.toggle('on', G.power > 0);
    }
    if (hintEl) {
      hintEl.classList.toggle('warn', highestAnimal() <= 2 && isPlay());
      hintEl.classList.toggle('hot', G.power > 0 && isPlay());
    }
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'ESCAPE' : kind === 'win' ? 'CLEAR' : 'ZOO';
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

  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : mag >= 4 ? 'cap' : mag >= 3 ? 'clear' : 'hit';
    stageEl.classList.remove('die', 'hit', 'cap', 'clear');
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
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - spd * 0.18,
        g: 380,
        life: rand(0.22, 0.55),
        max: 0.55,
        r: rand(1.4, 3.2),
        rgb: i % 4 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 180);
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
    floats.push({ x: x, y: y, t: 0, life: 0.72, vy: -52, text: text, rgb: rgb });
    capArr(floats, 18);
  }

  function chipBurst(x, y, n) {
    const count = REDUCE ? Math.min(4, n) : n;
    for (let i = 0; i < count; i++) {
      chips.push({
        x: x + rand(-4, 4),
        y: y + rand(-3, 3),
        vx: rand(-90, 90),
        vy: rand(-140, -20),
        life: rand(0.28, 0.6),
        max: 0.6,
        rgb: Math.random() < 0.35 ? BRK_CR : Math.random() < 0.4 ? TEAL : MINT,
        s: rand(1.5, 3.2),
        rot: rand(0, TAU)
      });
    }
    capArr(chips, 90);
  }

  function dust(x, y, rgb) {
    if (REDUCE) return;
    for (let i = 0; i < 3; i++) {
      particles.push({
        x: x + rand(-6, 6),
        y: y + rand(2, 8),
        vx: rand(-20, 20),
        vy: rand(-30, -8),
        g: 40,
        life: rand(0.16, 0.32),
        max: 0.32,
        r: rand(1, 2),
        rgb: rgb || TEAL
      });
    }
    capArr(particles, 180);
  }

  function seedFlies() {
    flies.length = 0;
    for (let i = 0; i < 28; i++) {
      flies.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        p: rand(0, TAU),
        s: rand(0.6, 1.6),
        v: rand(8, 22),
        rgb: Math.random() < 0.22 ? GOLD : Math.random() < 0.18 ? MAG : MINT
      });
    }
  }

  function occupied(c, r, skip) {
    for (let i = 0; i < G.animals.length; i++) {
      const a = G.animals[i];
      if (a === skip) continue;
      if (a.col === c && a.row === r) return true;
    }
    return false;
  }

  function canSpawnAnywhere() {
    for (let c = 0; c < COLS; c++) {
      const r = spawnRow(c);
      if (r >= 0 && !occupied(c, r, null)) return true;
    }
    return false;
  }

  function highestAnimal() {
    let h = ROWS;
    for (let i = 0; i < G.animals.length; i++) {
      if (G.animals[i].row < h) h = G.animals[i].row;
    }
    return h;
  }

  function makeWall() {
    const g = [];
    for (let r = 0; r < ROWS; r++) {
      g[r] = [];
      for (let c = 0; c < COLS; c++) g[r][c] = 2;
    }
    return g;
  }

  function wavePlan(w) {
    const rush = isRush();
    const n = Math.min(rush ? 10 + w * 2 : 8 + w, rush ? 22 : 18);
    const list = [];
    for (let i = 0; i < n; i++) {
      let t = 0;
      if (w >= 2 && i % 4 === 3) t = 1;
      if (w >= 3 && i % 5 === 4) t = 2;
      if (w >= 5 && i % 3 === 2) t = 1;
      if (w >= 6 && Math.random() < 0.22) t = 2;
      if (rush && Math.random() < 0.18) t = Math.min(2, t + 1);
      if (w >= GUARD_WAVES && !rush) t = i % 3 === 0 ? 2 : i % 2;
      list.push(t);
    }
    return list;
  }

  function spawnRow(c) {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (brickAt(c, r) > 0) return r;
    }
    return -1;
  }

  function makeAnimal(type, col, row) {
    return {
      type: type,
      col: col,
      row: row,
      x: cellX(col),
      y: cellY(row),
      fromX: cellX(col),
      fromY: cellY(row) + 18,
      toX: cellX(col),
      toY: cellY(row),
      anim: 1,
      animT: 0,
      animDur: 0.28,
      hp: TYPE_HP[type],
      cd: rand(0.12, 0.55),
      stun: 0,
      bob: rand(0, TAU),
      face: Math.random() < 0.5 ? -1 : 1,
      flash: 0,
      squash: 1
    };
  }

  function trySpawn() {
    if (G.queue.length === 0) return false;
    if (G.animals.length >= maxOnWall()) return false;
    const order = [];
    for (let c = 0; c < COLS; c++) order.push(c);
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }
    for (let i = 0; i < order.length; i++) {
      const c = order[i];
      const r = spawnRow(c);
      if (r < 0) continue;
      if (occupied(c, r, null)) continue;
      const type = G.queue.shift();
      G.animals.push(makeAnimal(type, c, r));
      dust(cellX(c), cellY(r) + 10, TYPE_RGB[type]);
      return true;
    }
    return false;
  }

  function startMove(a, nc, nr, dur, kind) {
    a.fromX = a.x;
    a.fromY = a.y;
    a.col = nc;
    a.row = nr;
    a.toX = cellX(nc);
    a.toY = cellY(nr);
    a.anim = kind;
    a.animT = 0;
    a.animDur = dur;
    a.squash = kind === 2 ? 0.72 : 1.08;
  }

  function destRow(c, start, skip) {
    let r = start;
    while (r < ROWS && (brickAt(c, r) <= 0 || occupied(c, r, skip))) r += 1;
    return r;
  }

  function removeAnimal(a) {
    const i = G.animals.indexOf(a);
    if (i >= 0) G.animals.splice(i, 1);
  }

  function splatOff(a, scored) {
    burst(a.x, a.y, TYPE_RGB[a.type], 16, 240);
    ring(a.x, a.y, TYPE_RGB[a.type]);
    chipBurst(a.x, a.y, 6);
    audio.splat();
    if (scored && isPlay()) {
      const n = 40 * G.mult;
      addScore(n);
      floatText(a.x, a.y + 8, '+' + n, GOLD);
    }
    removeAnimal(a);
  }

  function knockAnimal(a, rows, scored) {
    const dest = destRow(a.col, a.row + rows, a);
    if (dest >= ROWS) {
      splatOff(a, scored);
      return 'off';
    }
    startMove(a, a.col, dest, 0.16 + Math.min(0.18, (dest - a.row) * 0.04), 2);
    a.stun = 0.08;
    a.flash = 0.12;
    return 'down';
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      toast('连击 ×' + G.mult, false, true);
    }
    if (comboNum) comboNum.textContent = '×' + G.mult;
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (isPlay() && G.combo === 8 && G.power <= 0 && !G.drop) {
      spawnDrop(G.ship.x + rand(-40, 40), WALL_Y + 8);
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    if (comboNum) comboNum.textContent = '×1';
    if (comboBox) comboBox.classList.remove('hot');
  }

  function hitAnimal(a, power) {
    const rgb = TYPE_RGB[a.type];
    burst(a.x, a.y, rgb, power ? 18 : 12, power ? 280 : 200);
    spark(a.x, a.y, rgb);
    ring(a.x, a.y, power ? GOLD : rgb);
    audio.hit(a.type, G.combo, power);
    const stop = power ? 0.07 : a.type === 2 ? 0.058 : 0.042;
    hitStop(stop);
    kick(power ? 3.4 : a.type === 2 ? 2.6 : 1.8);
    a.flash = 0.16;
    a.squash = 0.62;
    if (isPlay()) bumpCombo();
    const pts = TYPE_SCORE[a.type] * (isPlay() ? G.mult : 0);
    if (pts) {
      addScore(pts);
      floatText(a.x, a.y - 10, '+' + pts, rgb);
    }
    if (power) {
      knockAnimal(a, 3, true);
      return;
    }
    if (a.type === 2 && a.hp > 1) {
      a.hp -= 1;
      a.stun = 0.42;
      floatText(a.x, a.y + 12, '闷', CYN);
      return;
    }
    knockAnimal(a, 1, true);
  }

  function crackBrick(c, r, power) {
    if (brickAt(c, r) <= 0) return false;
    const x = cellX(c);
    const y = cellY(r);
    if (power || G.bricks[r][c] === 1) {
      G.bricks[r][c] = 0;
      G.cracked += 1;
      chipBurst(x, y, power ? 12 : 8);
      burst(x, y, MINT, 8, 140);
      audio.brick();
      hitStop(0.032);
      kick(2.2);
      if (isPlay()) {
        const n = 15 * Math.max(1, G.mult);
        addScore(n);
        floatText(x, y, '+' + n, MINT);
      }
      for (let i = G.animals.length - 1; i >= 0; i--) {
        const a = G.animals[i];
        if (a.col === c && a.row === r) knockAnimal(a, 1, true);
      }
      return true;
    }
    G.bricks[r][c] = 1;
    chipBurst(x, y, 4);
    audio.crack();
    kick(1.2);
    if (isPlay()) addScore(5);
    return true;
  }

  function spawnBird() {
    const left = Math.random() < 0.5;
    G.bird = {
      x: left ? -20 : VW + 20,
      y: 26 + rand(0, 10),
      vx: left ? rand(110, 150) : -rand(110, 150),
      t: 0
    };
  }

  function spawnDrop(x, y) {
    G.drop = { x: clamp(x, 40, VW - 40), y: y, vy: 90 };
  }

  function fire() {
    if (!isPlay() && G.mode !== 'title') return;
    if (G.deadT > 0) return;
    if (G.fireCd > 0) return;
    if (overlayOpen() && isPlay()) return;
    const power = G.power > 0;
    const max = power ? POWER_SHOT_MAX : SHOT_MAX;
    if (G.shots.length >= max) return;
    if (power && isPlay()) G.power -= 1;
    G.shots.push({
      x: G.ship.x,
      y: PLAYER_Y - 18,
      v: power ? SHOT_V + 80 : SHOT_V,
      power: power,
      w: power ? 16 : 10
    });
    G.fireCd = power ? 0.1 : 0.13;
    G.muzzle = 0.09;
    audio.shoot(power);
    syncHud();
  }

  function shotHitsAnimal(s, a) {
    return Math.abs(s.x - a.x) < s.w + TYPE_HW[a.type] * 0.35 &&
      s.y < a.y + TYPE_HH[a.type] && s.y > a.y - TYPE_HH[a.type] - 8;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      const y0 = s.y;
      s.y -= s.v * dt;
      const y1 = s.y;
      let hit = false;
      const steps = 5;
      for (let k = 0; k <= steps && !hit; k++) {
        const yy = lerp(y0, y1, k / steps);
        s.y = yy;
        let best = null;
        let bestY = -1;
        for (let n = 0; n < G.animals.length; n++) {
          const a = G.animals[n];
          if (shotHitsAnimal(s, a) && a.y > bestY) {
            best = a;
            bestY = a.y;
          }
        }
        if (best) {
          hitAnimal(best, s.power);
          hit = true;
          break;
        }
        if (G.bird && Math.abs(s.x - G.bird.x) < 16 && Math.abs(s.y - G.bird.y) < 12) {
          burst(G.bird.x, G.bird.y, GOLD, 18, 260);
          ring(G.bird.x, G.bird.y, GOLD);
          spark(G.bird.x, G.bird.y, GOLD);
          audio.bird();
          hitStop(0.06);
          kick(3.6);
          if (isPlay()) {
            bumpCombo();
            const n = 500 * G.mult;
            addScore(n);
            floatText(G.bird.x, G.bird.y, '+' + n, GOLD);
            toast('金鸟', false, true);
          }
          spawnDrop(G.bird.x, G.bird.y + 6);
          G.bird = null;
          hit = true;
          break;
        }
        if (inWallX(s.x) && yy >= WALL_Y && yy <= WALL_Y + ROWS * BH) {
          const c = colAt(s.x);
          const r = rowAt(yy);
          if (brickAt(c, r) > 0) {
            const bx = cellX(c);
            if (Math.abs(s.x - bx) < BW * 0.46) {
              crackBrick(c, r, s.power);
              hit = true;
              break;
            }
          }
        }
      }
      if (hit) {
        G.shots.splice(i, 1);
        continue;
      }
      s.y = y1;
      if (s.y < 4) {
        G.shots.splice(i, 1);
        if (isPlay()) breakCombo();
      }
    }
  }

  function tryClimb(a) {
    const next = a.row - 1;
    if (next < 0) {
      escapeAnimal(a);
      return;
    }
    if (occupied(a.col, next, a)) {
      a.cd = 0.18;
      return;
    }
    if (brickAt(a.col, next) > 0) {
      startMove(a, a.col, next, 0.22, 1);
      dust(a.x, a.y + 8, TYPE_RGB[a.type]);
      return;
    }
    if (a.type === 0) {
      const n2 = next - 1;
      if (n2 < 0) {
        escapeAnimal(a);
        return;
      }
      if (brickAt(a.col, n2) > 0 && !occupied(a.col, n2, a)) {
        startMove(a, a.col, n2, 0.28, 1);
        a.squash = 1.18;
        dust(a.x, a.y, GOLD);
        return;
      }
    }
    if (a.type === 1) {
      const dir = a.face;
      const sides = [dir, -dir];
      for (let i = 0; i < 2; i++) {
        const nc = a.col + sides[i];
        if (nc >= 0 && nc < COLS && brickAt(nc, a.row) > 0 && !occupied(nc, a.row, a)) {
          a.face = sides[i];
          startMove(a, nc, a.row, 0.2, 3);
          return;
        }
      }
    }
    knockAnimal(a, 1, false);
  }

  function escapeAnimal(a) {
    burst(a.x, WALL_Y - 6, MAG, 20, 260);
    ring(a.x, WALL_Y, MAG);
    audio.splat();
    removeAnimal(a);
    if (G.mode === 'title') return;
    if (!isPlay() || G.deadT > 0) return;
    killPlayer('逃出笼顶');
  }

  function killPlayer(why) {
    if (!isPlay() || G.deadT > 0) return;
    G.why = why;
    G.deadT = 0.85;
    G.lives -= 1;
    G.shots.length = 0;
    G.fireHold = false;
    breakCombo();
    audio.death();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    burst(G.ship.x, G.ship.y, MAG, 22, 280);
    toast(why || '逃出', true, false);
    for (let i = G.animals.length - 1; i >= 0; i--) {
      const a = G.animals[i];
      if (a.row < 6) knockAnimal(a, 3, false);
    }
    syncHud();
  }

  function updateAnimals(dt) {
    for (let i = G.animals.length - 1; i >= 0; i--) {
      const a = G.animals[i];
      a.bob += dt * (a.type === 1 ? 10 : 7);
      a.flash = Math.max(0, a.flash - dt);
      a.squash = lerp(a.squash, 1, 1 - Math.pow(0.0008, dt));
      if (a.stun > 0) a.stun -= dt;
      if (a.anim) {
        a.animT += dt;
        const u = clamp(a.animT / a.animDur, 0, 1);
        const e = a.anim === 2 ? u * u : 1 - (1 - u) * (1 - u);
        a.x = lerp(a.fromX, a.toX, e);
        a.y = lerp(a.fromY, a.toY, e);
        if (u >= 1) {
          a.anim = 0;
          a.x = a.toX;
          a.y = a.toY;
          a.cd = climbCd(a.type);
          if (brickAt(a.col, a.row) <= 0) {
            knockAnimal(a, 1, false);
          }
        }
        continue;
      }
      if (G.deadT > 0) continue;
      if (a.stun > 0) continue;
      a.cd -= dt;
      if (a.cd <= 0) tryClimb(a);
    }
  }

  function updateBird(dt) {
    G.birdT -= dt;
    if (!G.bird && G.birdT <= 0 && (isPlay() || G.mode === 'title')) {
      spawnBird();
      G.birdT = isRush() ? rand(8, 13) : rand(11, 17);
    }
    if (!G.bird) return;
    G.bird.t += dt;
    G.bird.y += Math.sin(G.bird.t * 6) * 10 * dt;
    G.bird.x += G.bird.vx * dt;
    if (G.bird.x < -30 || G.bird.x > VW + 30) G.bird = null;
  }

  function updateDrop(dt) {
    if (!G.drop) return;
    const d = G.drop;
    d.vy += 40 * dt;
    d.y += d.vy * dt;
    d.x += Math.sin(G.t * 7) * 18 * dt;
    if (isPlay() && G.deadT <= 0 && Math.abs(d.x - G.ship.x) < 22 && d.y > PLAYER_Y - 22 && d.y < PLAYER_Y + 16) {
      G.power = POWER_MAX;
      G.drop = null;
      audio.power();
      burst(G.ship.x, PLAYER_Y - 8, GOLD, 14, 180);
      ring(G.ship.x, PLAYER_Y - 8, GOLD);
      kick(3);
      if (isPlay()) {
        addScore(120);
        floatText(G.ship.x, PLAYER_Y - 24, '强网', GOLD);
        toast('强网', false, true);
      }
      syncHud();
      return;
    }
    if (d.y > GROUND_Y) G.drop = null;
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    let dx = 0;
    if (keys.l) dx -= 1;
    if (keys.r) dx += 1;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const tx = clamp(pointer.x, shipMin(), shipMax());
      const gap = tx - G.ship.x;
      if (Math.abs(gap) > 2) G.ship.x += clamp(gap, -340 * dt, 340 * dt);
    } else {
      G.ship.x += dx * 310 * dt;
    }
    G.ship.x = clamp(G.ship.x, shipMin(), shipMax());
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.fireCd = Math.max(0, G.fireCd - dt);
    if ((G.fireHold || pointer.down) && (isPlay() || G.mode === 'title')) fire();
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.001, dt));
    G.toastT = Math.max(0, G.toastT - dt);
    G.comboT -= dt;
    if (G.comboT <= 0 && G.combo > 0) breakCombo();
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.36) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = chips.length - 1; i >= 0; i--) {
      const c = chips[i];
      c.life -= dt;
      c.vy += 520 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += dt * 8;
      if (c.life <= 0) chips.splice(i, 1);
    }
    for (let i = 0; i < flies.length; i++) {
      const f = flies[i];
      f.p += dt * 2.2;
      f.x += Math.cos(f.p) * f.v * dt;
      f.y += Math.sin(f.p * 1.3) * f.v * 0.6 * dt;
      if (f.x < -8) f.x = VW + 8;
      if (f.x > VW + 8) f.x = -8;
      if (f.y < 8) f.y = VH - 20;
      if (f.y > VH - 10) f.y = 20;
    }
  }

  function resetField() {
    G.bricks = makeWall();
    G.animals.length = 0;
    G.queue = wavePlan(G.wave);
    G.shots.length = 0;
    G.bird = null;
    G.drop = null;
    G.birdT = isRush() ? 8 : 12;
    G.spawnT = 0.45;
    G.ship.x = VW * 0.5;
    G.power = 0;
    G.waveScore = 0;
    G.clearT = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.fireCd = 0;
    G.muzzle = 0;
    G.lastWarn = 0;
    G.cracked = 0;
    G.stop = 0;
    breakCombo();
  }

  function seedTitle() {
    G.bricks = makeWall();
    G.animals.length = 0;
    G.queue = [0, 1, 0, 2, 0, 1, 0];
    G.shots.length = 0;
    G.wave = 1;
    G.kind = 'guard';
    G.power = 0;
    G.spawnT = 0.4;
    G.birdT = 6;
    G.ship.x = VW * 0.5;
    G.clearT = 0;
    G.deadT = 0;
    G.invuln = 0;
  }

  function waveClear() {
    if (!isPlay()) return;
    const bonus = 350 * G.wave;
    addScore(bonus);
    floatText(VW * 0.5, 200, '+' + bonus, GOLD);
    audio.wave();
    screenFlash(GOLD, 0.28);
    kick(3.4);
    toast('第 ' + G.wave + ' 波清场', false, true);
    if (!isRush() && G.wave >= GUARD_WAVES) {
      winRun();
      return;
    }
    G.wave += 1;
    G.ready = 0.85;
    G.bricks = makeWall();
    G.queue = wavePlan(G.wave);
    G.waveScore = 0;
    G.clearT = 0;
    G.spawnT = 0.4;
    syncHud();
  }

  function winRun() {
    addScore(5000);
    kick(5);
    screenFlash(GOLD, 0.5);
    G.mode = 'win';
    G.fireHold = false;
    audio.win();
    showOverlay('win', '园门落锁', '八波守住。本局 ' + G.score + ' · 最高 ' + currentBest());
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.why = why;
    G.fireHold = false;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    G.mode = 'lose';
    const lead = (why || '笼顶失守') + '  本局 ' + G.score + ' · 最高 ' + currentBest();
    showOverlay('lose', '笼顶失守', lead);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'rush' ? 'rush' : 'guard';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.next1up = 10000;
    G.why = '';
    G.clock = 0;
    resetField();
    G.ready = 0.55;
    hideOverlay();
    audio.start();
    toast(isRush() ? '狂奔 · 爬得更快' : '守园 · 八波锁门', isRush(), !isRush());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'guard';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    seedTitle();
    G.ready = 0;
    showOverlay('title', '园守', LEAD);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('guard');
    else startGame(G.kind || 'guard');
  }

  function playSim(dt) {
    updatePlayer(dt);
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      updateBird(dt);
      updateDrop(dt);
      return;
    }
    G.spawnT -= dt;
    if (G.spawnT <= 0) {
      if (trySpawn()) G.spawnT = spawnInterval();
      else G.spawnT = 0.2;
    }
    updateAnimals(dt);
    updateShots(dt);
    updateBird(dt);
    updateDrop(dt);
    const hi = highestAnimal();
    if (isPlay() && hi <= 2 && G.animals.length && G.t - G.lastWarn > 2.4) {
      G.lastWarn = G.t;
      audio.warn();
      toast('顶上有人', true, false);
    }
    if (isPlay() && G.deadT <= 0) {
      if (G.animals.length === 0) {
        if (G.waveScore >= scoreTarget() || !canSpawnAnywhere()) G.queue.length = 0;
        G.clearT += dt;
        if (G.queue.length === 0 && G.clearT >= clearHold()) waveClear();
      } else {
        G.clearT = 0;
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
      playSim(dt);
      for (let i = G.animals.length - 1; i >= 0; i--) {
        if (G.animals[i].row <= 1) knockAnimal(G.animals[i], 4, false);
      }
      if (G.queue.length === 0 && G.animals.length === 0) {
        G.queue = [0, 1, 0, 2, 1, 0];
        G.spawnT = 0.4;
      }
      if (G.t % 2.6 < dt + 0.02 && G.shots.length === 0) {
        let target = G.ship.x;
        let best = ROWS;
        for (let i = 0; i < G.animals.length; i++) {
          if (G.animals[i].row < best) {
            best = G.animals[i].row;
            target = G.animals[i].x;
          }
        }
        G.ship.x = lerp(G.ship.x, target, 0.35);
        fire();
      }
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateAnimals(dt * 0.45);
      updateFx(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateAnimals(dt);
      updateShots(dt);
      updateBird(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '笼顶失守');
          updateFx(dt);
          return;
        }
        G.ship.x = VW * 0.5;
        G.invuln = 1.4;
        G.shots.length = 0;
      }
      updateFx(dt);
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    playSim(dt);
    updateFx(dt);
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) syncHud();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#062010');
    g.addColorStop(0.55, '#04140a');
    g.addColorStop(1, '#031008');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.fillStyle = 'rgba(8, 28, 14, 0.9)';
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(220));
    ctx.lineTo(sx(36), sy(140));
    ctx.lineTo(sx(70), sy(230));
    ctx.lineTo(sx(0), sy(280));
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx(VW), sy(200));
    ctx.lineTo(sx(VW - 40), sy(110));
    ctx.lineTo(sx(VW - 78), sy(240));
    ctx.lineTo(sx(VW), sy(300));
    ctx.fill();
    for (let i = 0; i < flies.length; i++) {
      const f = flies[i];
      const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 5 + f.p));
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(f.x), sy(f.y), f.s * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawCages() {
    const top = WALL_Y - 14;
    ctx.fillStyle = rgba(TEAL, 0.55);
    ctx.fillRect(sx(WALL_X - 6), sy(top), (COLS * BW + 12) * scale, 10 * scale);
    ctx.strokeStyle = rgba(MINT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    for (let c = 0; c <= COLS; c++) {
      const x = WALL_X + c * BW;
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(top - 8));
      ctx.lineTo(sx(x), sy(WALL_Y + 2));
      ctx.stroke();
    }
    const warn = highestAnimal() <= 2 && G.animals.length > 0;
    if (warn) {
      ctx.fillStyle = rgba(MAG, 0.12 + 0.1 * Math.sin(G.t * 10));
      ctx.fillRect(sx(WALL_X - 4), sy(WALL_Y - 16), (COLS * BW + 8) * scale, 18 * scale);
    }
    const by = WALL_Y + ROWS * BH;
    ctx.fillStyle = rgba([24, 48, 32], 0.92);
    ctx.fillRect(sx(WALL_X - 8), sy(by), (COLS * BW + 16) * scale, 26 * scale);
    ctx.strokeStyle = rgba(MINT, 0.28);
    ctx.lineWidth = 1 * scale;
    for (let c = 0; c < COLS; c++) {
      const x = WALL_X + c * BW + 4;
      ctx.strokeRect(sx(x), sy(by + 4), (BW - 8) * scale, 16 * scale);
    }
    ctx.fillStyle = rgba([18, 36, 24], 1);
    ctx.fillRect(sx(0), sy(GROUND_Y - 8), VW * scale, (VH - GROUND_Y + 8) * scale);
    ctx.fillStyle = rgba(MINT, 0.18);
    ctx.fillRect(sx(0), sy(GROUND_Y - 8), VW * scale, 3 * scale);
  }

  function drawWall() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const hp = G.bricks[r][c];
        if (hp <= 0) continue;
        const x = WALL_X + c * BW + 1;
        const y = WALL_Y + r * BH + 1;
        const w = BW - 2;
        const h = BH - 2;
        const rgb = hp === 1 ? BRK_CR : ((c + r) & 1) ? BRK2 : BRK;
        ctx.fillStyle = rgba(rgb, 0.96);
        ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
        ctx.fillStyle = rgba(WHT, hp === 1 ? 0.08 : 0.14);
        ctx.fillRect(sx(x + 2), sy(y + 2), (w - 8) * scale, 3 * scale);
        ctx.fillStyle = rgba([10, 24, 14], 0.45);
        ctx.fillRect(sx(x), sy(y + h - 2), w * scale, 2 * scale);
        if (hp === 1) {
          ctx.strokeStyle = rgba(GOLD, 0.7);
          ctx.lineWidth = 1.2 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(x + 4), sy(y + 5));
          ctx.lineTo(sx(x + w * 0.45), sy(y + h * 0.55));
          ctx.lineTo(sx(x + w - 5), sy(y + h - 4));
          ctx.moveTo(sx(x + w * 0.6), sy(y + 3));
          ctx.lineTo(sx(x + w * 0.35), sy(y + h - 3));
          ctx.stroke();
        }
      }
    }
    if (isPlay() && G.animals.length === 0 && G.queue.length === 0) {
      const u = clamp(G.clearT / clearHold(), 0, 1);
      ctx.fillStyle = rgba(GOLD, 0.22);
      ctx.fillRect(sx(WALL_X), sy(WALL_Y + ROWS * BH + 4), COLS * BW * u * scale, 4 * scale);
    }
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(sx(x + rr), sy(y));
    ctx.arcTo(sx(x + w), sy(y), sx(x + w), sy(y + h), rr * scale);
    ctx.arcTo(sx(x + w), sy(y + h), sx(x), sy(y + h), rr * scale);
    ctx.arcTo(sx(x), sy(y + h), sx(x), sy(y), rr * scale);
    ctx.arcTo(sx(x), sy(y), sx(x + w), sy(y), rr * scale);
    ctx.closePath();
  }

  function drawMonkey(a) {
    const x = a.x;
    const y = a.y;
    const s = a.squash;
    const wag = Math.sin(a.bob) * 0.5;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(scale * s, scale / s);
    ctx.fillStyle = rgba(ORG, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 3, 9, 8, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-8, -6, 3.2, 0, TAU);
    ctx.arc(8, -6, 3.2, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -5, 7.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([255, 220, 160], 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -3.5, 4.4, 3.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1208';
    ctx.beginPath();
    ctx.arc(-2.4, -5, 1.1, 0, TAU);
    ctx.arc(2.4, -5, 1.1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(ORG, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 4);
    ctx.quadraticCurveTo(14, 8 + wag * 6, 11, 14);
    ctx.stroke();
    ctx.restore();
  }

  function drawSnake(a) {
    const x = a.x;
    const y = a.y;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(scale * a.squash, scale / a.squash);
    ctx.strokeStyle = rgba(MAG, 0.95);
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const px = Math.sin(a.bob + t * 4) * 5 * a.face;
      const py = -9 + t * 20;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.fillStyle = rgba(PNK, 1);
    ctx.beginPath();
    ctx.ellipse(Math.sin(a.bob) * 5 * a.face, -10, 5, 3.6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0810';
    ctx.beginPath();
    ctx.arc(Math.sin(a.bob) * 5 * a.face + 1.4 * a.face, -10.5, 0.9, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.85);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    const hx = Math.sin(a.bob) * 5 * a.face + 5 * a.face;
    ctx.moveTo(hx, -10);
    ctx.lineTo(hx + 4 * a.face, -12);
    ctx.moveTo(hx, -10);
    ctx.lineTo(hx + 4 * a.face, -8);
    ctx.stroke();
    ctx.restore();
  }

  function drawElephant(a) {
    const x = a.x;
    const y = a.y;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(scale * a.squash, scale / a.squash);
    ctx.fillStyle = rgba(CYN, 0.92);
    ctx.beginPath();
    ctx.ellipse(0, 3, 11, 9, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-10, -2, 4.5, 6, -0.4, 0, TAU);
    ctx.ellipse(10, -2, 4.5, 6, 0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -4, 8, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.95);
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.quadraticCurveTo(10 * a.face, 8, 6 * a.face, 14);
    ctx.stroke();
    ctx.fillStyle = '#082018';
    ctx.beginPath();
    ctx.arc(-3, -5, 1.2, 0, TAU);
    ctx.arc(3, -5, 1.2, 0, TAU);
    ctx.fill();
    if (a.hp > 1) {
      ctx.strokeStyle = rgba(WHT, 0.5);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-7, 6, 14, 3);
    }
    ctx.restore();
  }

  function drawAnimals() {
    const list = G.animals.slice().sort(function (p, q) { return p.y - q.y; });
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.flash > 0 && ((G.t * 24) | 0) % 2 === 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
      }
      if (a.row <= 2) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rgba(MAG, 0.14 + 0.1 * Math.sin(G.t * 12));
        ctx.beginPath();
        ctx.arc(sx(a.x), sy(a.y), 16 * scale, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      if (a.type === 0) drawMonkey(a);
      else if (a.type === 1) drawSnake(a);
      else drawElephant(a);
      if (a.flash > 0 && ((G.t * 24) | 0) % 2 === 0) ctx.restore();
    }
  }

  function drawBird() {
    if (!G.bird) return;
    const u = G.bird;
    const flap = Math.sin(G.t * 16) * 7;
    ctx.save();
    ctx.translate(sx(u.x), sy(u.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 4, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-6, -flap * 0.2, 7, 2.4, -0.5, 0, TAU);
    ctx.ellipse(6, flap * 0.2, 7, 2.4, 0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.beginPath();
    ctx.moveTo(7, 0);
    ctx.lineTo(11, -1);
    ctx.lineTo(7, 2);
    ctx.fill();
    ctx.restore();
  }

  function drawDrop() {
    if (!G.drop) return;
    const d = G.drop;
    const spin = G.t * 8;
    ctx.save();
    ctx.translate(sx(d.x), sy(d.y));
    ctx.rotate(spin);
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, 8 * scale, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6 * scale, 0);
    ctx.lineTo(6 * scale, 0);
    ctx.moveTo(0, -6 * scale);
    ctx.lineTo(0, 6 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const rgb = s.power ? GOLD : CYN;
      if (!REDUCE) {
        ctx.strokeStyle = rgba(rgb, 0.35);
        ctx.lineWidth = (s.power ? 4 : 2.2) * scale;
        ctx.beginPath();
        ctx.moveTo(sx(s.x), sy(s.y + 18));
        ctx.lineTo(sx(s.x), sy(s.y));
        ctx.stroke();
      }
      ctx.fillStyle = rgba(WHT, 1);
      ctx.beginPath();
      ctx.moveTo(sx(s.x), sy(s.y - 8));
      ctx.lineTo(sx(s.x + (s.power ? 6 : 4)), sy(s.y + 2));
      ctx.lineTo(sx(s.x), sy(s.y + 6));
      ctx.lineTo(sx(s.x - (s.power ? 6 : 4)), sy(s.y + 2));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(rgb, 0.9);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 14) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = rgba(MINT, 1);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y + 4), 16 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = rgba(MINT, 0.95);
    roundRect(x - 11, y - 4, 22, 16, 5);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.92);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y - 8), 7 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y - 13), 8 * scale, 3.2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(sx(x - 1.5), sy(y - 22), 3 * scale, 10 * scale);
    ctx.strokeStyle = rgba(G.power > 0 ? GOLD : CYN, 0.95);
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x + 6), sy(y - 2));
    ctx.lineTo(sx(x + 10), sy(y - 18));
    ctx.stroke();
    ctx.strokeStyle = rgba(G.power > 0 ? GOLD : CYN, 0.8);
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.arc(sx(x + 10), sy(y - 22), 5 * scale, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(x + 6), sy(y - 22));
    ctx.lineTo(sx(x + 14), sy(y - 22));
    ctx.moveTo(sx(x + 10), sy(y - 26));
    ctx.lineTo(sx(x + 10), sy(y - 18));
    ctx.stroke();
    if (G.muzzle > 0) {
      const a = G.muzzle / 0.09;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(G.power > 0 ? GOLD : CYN, 0.7 * a);
      ctx.beginPath();
      ctx.arc(sx(x + 10), sy(y - 24), (5 + (1 - a) * 7) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < chips.length; i++) {
      const c = chips[i];
      const a = Math.max(0, c.life / c.max);
      ctx.save();
      ctx.translate(sx(c.x), sy(c.y));
      ctx.rotate(c.rot);
      ctx.fillStyle = rgba(c.rgb, a);
      ctx.fillRect(-c.s * scale, -c.s * scale, c.s * 2 * scale, c.s * 2 * scale);
      ctx.restore();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (6 + s.t * 40) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.36;
      ctx.strokeStyle = rgba(r.rgb, a * 0.8);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
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
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#04140a';
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
    ctx.fillStyle = '#04140a';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * scale * 0.5;
      const cy = oy + VH * scale * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawCages();
    drawWall();
    drawAnimals();
    drawBird();
    drawDrop();
    drawShots();
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

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('guard');
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
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 'W' || k === 's' || k === 'S' || space) {
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
    if (G.mode === 'title' && (k === '1' || k === 'Digit1')) {
      startGame('guard');
      return;
    }
    if (G.mode === 'title' && (k === '2' || k === 'Digit2')) {
      startGame('rush');
      return;
    }
    if (space || k === 'Enter' || k === 'w' || k === 'W' || k === 'ArrowUp') {
      if (overlayOpen()) {
        if (k === 'Enter' || space) primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fire();
      }
    }
  }

  function bindPad(el, on, off) {
    if (!el) return;
    const down = function (e) {
      e.preventDefault();
      audio.ensure();
      on();
      el.classList.add('held');
    };
    const up = function (e) {
      if (e) e.preventDefault();
      off();
      el.classList.remove('held');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), shipMin(), shipMax());
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), shipMin(), shipMax());
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

  seedFlies();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindPad(btnLeft, function () { keys.l = true; inputSrc = 'key'; }, function () { keys.l = false; });
  bindPad(btnRight, function () { keys.r = true; inputSrc = 'key'; }, function () { keys.r = false; });
  bindPad(btnFire, function () { G.fireHold = true; if (G.mode === 'play') fire(); }, function () { G.fireHold = false; });

  if (btnGuard) {
    btnGuard.addEventListener('click', function () {
      audio.ensure();
      startGame('guard');
    });
  }
  if (btnRush) {
    btnRush.addEventListener('click', function () {
      audio.ensure();
      startGame('rush');
    });
  }
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'guard');
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
