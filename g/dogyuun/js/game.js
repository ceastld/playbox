'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 17000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.62;
  const HIT_R = 4.7;
  const SHOT_V = 720;
  const BEAM_MAX = 228;
  const JIA_MAX = 100;
  const BEST_KEY = 'playbox-dogyuun-best';
  const MUTE_KEY = 'playbox-dogyuun-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · Shift / Z 抓投 · R 重开 · M 静音';
  const LEAD = '双钳抓小甲，松开甩出去砸阵。撞机掉命。短关之后是巨钳。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [46, 232, 255];
  const GOLD = [255, 227, 107];
  const COP = [255, 138, 28];
  const AMB = [255, 192, 74];
  const WHT = [255, 244, 232];
  const PNK = [255, 154, 180];
  const DEEP = [28, 16, 8];
  const CLAW = [125, 255, 242];

  const SCORE = {
    mite: 40,
    drone: 70,
    hop: 90,
    turret: 150,
    armor: 220,
    elite: 280,
    carrier: 200,
    boss: 9000,
    grab: 20,
    smash: 12,
    stage: 1600
  };

  const STAGES = [
    {
      name: '荒脊',
      waves: [
        { t: 0.6, kind: 'v', n: 5 },
        { t: 2.8, kind: 'stream', dir: 1 },
        { t: 5.2, kind: 'hop', n: 4 },
        { t: 7.4, kind: 'turrets' },
        { t: 9.0, kind: 'v', n: 7 },
        { t: 11.2, kind: 'carrier' },
        { t: 13.4, kind: 'armor' },
        { t: 15.8, kind: 'v', n: 7 },
        { t: 18.0, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '矿脉',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.2, kind: 'hop', n: 5 },
        { t: 4.4, kind: 'turrets' },
        { t: 6.0, kind: 'stream', dir: -1 },
        { t: 8.2, kind: 'elite' },
        { t: 10.0, kind: 'carrier' },
        { t: 12.2, kind: 'v', n: 9 },
        { t: 14.6, kind: 'armor' },
        { t: 16.8, kind: 'hop', n: 6 },
        { t: 18.8, kind: 'stream', dir: 1 }
      ]
    },
    {
      name: '甲巢',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.2, kind: 'hop', n: 5 },
        { t: 4.0, kind: 'elite' },
        { t: 6.0, kind: 'turrets' },
        { t: 7.8, kind: 'carrier' },
        { t: 9.6, kind: 'v', n: 9 },
        { t: 12.0, kind: 'armor' },
        { t: 14.6, kind: 'boss' }
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
  const btnRush = document.getElementById('btn-rush');
  const btnDense = document.getElementById('btn-dense');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnGrab = document.getElementById('btn-grab');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const heldLabel = document.getElementById('held-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const jiaBar = document.getElementById('jia-bar');
  const jiaWrap = document.getElementById('jia-wrap');

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
  let heldTok = 0;
  let beamHumT = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false, grab: false };
  const grabSrc = { shift: false, z: false, pad: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'rush',
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
    jia: 0,
    enemies: [],
    shots: [],
    bullets: [],
    wrecks: [],
    held: null,
    beamOn: false,
    beamLen: 0,
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stunT: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    clawA: 0.42
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
  function isDense() {
    return G.kind === 'dense';
  }
  function dens() {
    return isDense() ? 1.26 : 1;
  }
  function shipSpeed() {
    const base = isDense() ? 308 : 268;
    return G.stunT > 0 ? base * 0.22 : base;
  }
  function fireRate() {
    return isDense() ? 0.078 : 0.09;
  }
  function bulletSpd() {
    return isDense() ? 178 : 142;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isDense() ? 118 : 84;
  }
  function hpMul() {
    return isDense() ? 1.22 : 1;
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function superReady() {
    return G.jia >= JIA_MAX;
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
      this.beep(820, 0.038, 'square', 0.024, 1540);
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
    grab() {
      this.ensure();
      this.beep(180, 0.1, 'sawtooth', 0.04, 90);
      this.beep(920, 0.12, 'sine', 0.038, 1480);
      this.beep(1480, 0.08, 'triangle', 0.022, 2100);
    },
    beam() {
      this.ensure();
      this.beep(140, 0.07, 'sawtooth', 0.018, 220);
      this.beep(1100, 0.05, 'sine', 0.014, 1600);
    },
    throw() {
      this.ensure();
      this.noise(0.06, 0.04, 700);
      this.beep(320, 0.1, 'sawtooth', 0.04, 140);
      this.beep(980, 0.12, 'square', 0.032, 420);
    },
    smash() {
      this.ensure();
      this.noise(0.12, 0.055, 360);
      this.beep(220, 0.16, 'sawtooth', 0.05, 58);
      this.beep(740, 0.1, 'square', 0.034, 220);
      this.beep(1180, 0.14, 'triangle', 0.03, 1760);
    },
    superThrow() {
      this.ensure();
      this.noise(0.16, 0.06, 280);
      this.beep(160, 0.2, 'sawtooth', 0.05, 48);
      this.beep(520, 0.14, 'square', 0.04, 880);
      this.beep(1040, 0.2, 'sine', 0.04, 1760);
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
    empty() {
      this.ensure();
      this.beep(170, 0.1, 'square', 0.028, 80);
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
      kick(3.2, 'grab');
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    }
    if (G.combo % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 36, G.combo + ' 链', GOLD, true);
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

  function addJia(n) {
    const was = superReady();
    G.jia = clamp(G.jia + n, 0, JIA_MAX);
    if (!was && superReady()) {
      audio.extra();
      toast('重投就绪', false, true);
      floatText(G.ship.x, G.ship.y - 48, '重投', CYN, true);
      kick(2.6, 'grab');
    }
    syncHud();
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

  function syncGrabBtns() {
    const on = G.mode === 'play' && (G.beamOn || !!G.held);
    if (btnGrab) btnGrab.classList.toggle('held', on);
    if (btnPad) btnPad.classList.toggle('held', on);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '土枪';
      else if (hasBoss()) stageLabel.textContent = '巨钳';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密甲' : '突贯';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isDense());
      tagLabel.classList.toggle('hot', G.combo >= 8 || superReady());
    }
    if (heldLabel) {
      heldLabel.textContent = G.held ? '抓' : (superReady() ? '重' : '空');
      heldLabel.classList.toggle('on', !!G.held || superReady());
    }
    if (jiaBar) jiaBar.style.transform = 'scaleX(' + (G.jia / JIA_MAX) + ')';
    if (jiaWrap) jiaWrap.classList.toggle('hot', superReady() || !!G.held);
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 按住抓小甲，松开甩砸', 'warn');
    else if (G.mode === 'win') setHint('巨钳已碎 · R 再来', 'hot');
    else if (superReady()) setHint('重投就绪 · 抓一只甩出去砸穿', 'hot');
    else if (G.held) setHint('松开甩砸 · 抓着能挡弹', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 抓小甲砸炮台', 'warn');
    else setHint('空格连射 · 按住 Shift 抓小甲 · 松开甩砸', '');
    syncPips();
    syncGrabBtns();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DOGY';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.8 ? 'smash' : mag >= 3.0 ? 'grab' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('grab');
    stageEl.classList.remove('boss');
    stageEl.classList.remove('smash');
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
        g: 180,
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
    for (let i = 0; i < 64; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.0),
        a: rand(0.12, 0.55),
        z: rand(0.35, 1.15)
      });
    }
  }

  function canGrab(e) {
    if (!e || !e.alive || e.held) return false;
    if (e.kind === 'mite' || e.kind === 'drone' || e.kind === 'hop') return true;
    if (e.kind === 'armor' && e.hp <= 2) return true;
    return false;
  }

  function beamBox() {
    const x = G.ship.x;
    const y1 = G.ship.y - 22;
    const y0 = y1 - G.beamLen;
    return { x: x, y0: y0, y1: y1, half: 16 + G.beamLen * 0.028 };
  }

  function inBeam(e) {
    const b = beamBox();
    if (e.y < b.y0 - e.r || e.y > b.y1 + 8) return false;
    const t = clamp((b.y1 - e.y) / Math.max(8, G.beamLen), 0, 1);
    const half = b.half + t * 10;
    return Math.abs(e.x - b.x) < half + e.r * 0.55;
  }

  function grabEnemy(e) {
    if (!canGrab(e) || G.held) return;
    e.alive = false;
    e.held = true;
    G.held = {
      kind: e.kind,
      hp: Math.max(1, e.hp),
      r: e.r,
      score: e.score,
      x: e.x,
      y: e.y,
      spin: 0
    };
    addJia(22);
    addScore(SCORE.grab * G.mult);
    bumpCombo();
    audio.grab();
    hitStop(0.038);
    kick(2.8, 'grab');
    screenFlash(CYN, 0.28);
    burst(e.x, e.y, CYN, 12, 90);
    spark(e.x, e.y, CYN);
    floatText(e.x, e.y - 12, '抓!', CYN, true);
    if (heldLabel) {
      heldLabel.classList.remove('hot');
      void heldLabel.offsetWidth;
      heldLabel.classList.add('hot');
    }
    heldTok += 1;
    syncHud();
  }

  function nearestTarget(fromX, fromY) {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.y > fromY + 8) continue;
      const d = hypot(e.x - fromX, e.y - fromY);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  function throwHeld() {
    const h = G.held;
    if (!h) return;
    const superT = superReady();
    const ox0 = G.ship.x;
    const oy0 = G.ship.y - 38;
    let ang = -Math.PI / 2;
    const tgt = nearestTarget(ox0, oy0);
    if (tgt) ang = Math.atan2(tgt.y - oy0, tgt.x - ox0);
    else if (hypot(G.ship.vx, G.ship.vy) > 40) {
      ang = Math.atan2(G.ship.vy - 240, G.ship.vx);
    }
    const spd = superT ? 680 : 580;
    G.wrecks.push({
      x: ox0,
      y: oy0,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      r: superT ? 20 : 15,
      dmg: superT ? 24 : 12,
      pierce: superT ? 6 : 3,
      life: superT ? 1.15 : 0.92,
      spin: 0,
      kind: h.kind,
      super: superT,
      hit: {}
    });
    capArr(G.wrecks, 6);
    G.held = null;
    if (superT) {
      G.jia = 0;
      audio.superThrow();
      hitStop(0.05);
      kick(4.4, 'smash');
      screenFlash(GOLD, 0.42);
      ring(ox0, oy0, GOLD);
      floatText(ox0, oy0 - 16, '重投', GOLD, true);
      toast('重投', false, true);
    } else {
      audio.throw();
      kick(2.2, 'grab');
      screenFlash(CYN, 0.18);
    }
    burst(ox0, oy0, CYN, 8, 70);
    syncHud();
  }

  function smashWreck(w, e) {
    const already = w.hit[e.uid];
    if (already) return false;
    w.hit[e.uid] = true;
    const dmg = w.dmg;
    damageEnemy(e, dmg, w.super ? 'super' : 'throw');
    w.pierce -= e.kind === 'boss' || e.kind === 'elite' || e.kind === 'armor' ? 2 : 1;
    burst(w.x, w.y, w.super ? GOLD : CYN, 8, 90);
    return true;
  }

  function wreckExplode(w) {
    explode(w.x, w.y, w.super ? GOLD : COP, w.super ? 28 : 18);
    audio.smash();
    hitStop(w.super ? 0.07 : 0.055);
    kick(w.super ? 5.4 : 4.0, w.super ? 'boss' : 'smash');
    screenFlash(w.super ? GOLD : COP, w.super ? 0.4 : 0.26);
    floatText(w.x, w.y - 10, '砸!', w.super ? GOLD : COP, true);
    const rr = w.super ? 52 : 34;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || w.hit[e.uid]) continue;
      const dx = e.x - w.x;
      const dy = e.y - w.y;
      if (dx * dx + dy * dy < (rr + e.r) * (rr + e.r)) {
        damageEnemy(e, w.super ? 8 : 4, 'throw');
      }
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      const dx = b.x - w.x;
      const dy = b.y - w.y;
      if (dx * dx + dy * dy < (rr + 6) * (rr + 6)) G.bullets.splice(i, 1);
    }
  }

  let uidSeq = 1;

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      uid: uidSeq++,
      alive: true,
      kind: spec.kind || 'mite',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 96 * dens() : spec.vy,
      hp: bossish ? spec.hp : hp,
      maxHp: bossish ? spec.hp : hp,
      r: spec.r || 11,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 48 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.mite,
      ang: spec.ang || 0,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      ground: !!spec.ground,
      held: false
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
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.2);
    }
  }

  function ringFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.3);
    }
  }

  function spawnMite(x, y, vx, vy) {
    spawnEnemy({
      kind: 'mite',
      x: x,
      y: y == null ? -24 : y,
      vx: vx || 0,
      vy: vy == null ? 102 * dens() : vy,
      hp: 1,
      r: 9,
      amp: 36,
      score: SCORE.mite,
      fireCd: rand(0.7, 1.6)
    });
  }

  function spawnV(n, cx) {
    const extra = isDense() ? 2 : 0;
    const c = cx == null ? VW * 0.5 : cx;
    const tot = n + extra;
    for (let i = 0; i < tot; i++) {
      const k = i - (tot - 1) * 0.5;
      spawnMite(c + k * 34, -24 - Math.abs(k) * 14, 0, 104 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 68 : 68;
    const extra = isDense() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'drone',
        x: side,
        y: -20 - i * 22,
        vx: dir * 40,
        vy: 90 * dens(),
        hp: 2,
        r: 12,
        amp: 52,
        phase: i * 0.5,
        score: SCORE.drone,
        fireCd: 0.65 + i * 0.12
      });
    }
  }

  function spawnHop(n) {
    const extra = isDense() ? 1 : 0;
    for (let i = 0; i < n + extra; i++) {
      spawnEnemy({
        kind: 'hop',
        x: 50 + Math.random() * (VW - 100),
        y: -30 - i * 18,
        vy: 42,
        hp: 2,
        r: 12,
        score: SCORE.hop,
        fireCd: 99
      });
    }
  }

  function spawnTurrets() {
    const n = isDense() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'turret',
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18,
        vy: 42 * dens(),
        hp: 6,
        r: 14,
        score: SCORE.turret,
        fireCd: 0.5 + i * 0.1,
        ground: true
      });
    }
  }

  function spawnArmor() {
    spawnEnemy({
      kind: 'armor',
      x: VW * 0.5 + (Math.random() < 0.5 ? -70 : 70),
      vy: 54 * dens(),
      hp: 8,
      r: 16,
      amp: 70,
      score: SCORE.armor,
      fireCd: 0.55
    });
    if (isDense()) {
      spawnEnemy({
        kind: 'armor',
        x: VW * 0.5 + 90,
        vy: 50 * dens(),
        hp: 8,
        r: 16,
        amp: 58,
        score: SCORE.armor,
        fireCd: 0.7
      });
    }
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      x: 150,
      vy: 52 * dens(),
      hp: 12,
      r: 18,
      amp: 86,
      score: SCORE.elite,
      fireCd: 0.48
    });
    if (isDense()) {
      spawnEnemy({
        kind: 'elite',
        x: 330,
        vy: 48 * dens(),
        hp: 12,
        r: 18,
        amp: 64,
        score: SCORE.elite,
        fireCd: 0.62
      });
    }
  }

  function spawnCarrier() {
    spawnEnemy({
      kind: 'carrier',
      x: VW * 0.5,
      vy: 46 * dens(),
      hp: 8,
      r: 18,
      amp: 64,
      score: SCORE.carrier,
      fireCd: 0.7
    });
  }

  function spawnBoss() {
    spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: isDense() ? 118 : 96,
      r: 46,
      score: SCORE.boss,
      fireCd: 1.1,
      enter: 1.35,
      amp: 96
    });
    toast('巨钳', true, false);
    audio.wave();
    kick(3.6, 'boss');
    syncHud();
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'hop') spawnHop(w.n);
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'armor') spawnArmor();
    else if (w.kind === 'elite') spawnElite();
    else if (w.kind === 'carrier') spawnCarrier();
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
      const e = G.enemies[i];
      if (e.alive && e.kind === 'boss') return e;
    }
    return null;
  }

  function fireInterval(e) {
    const d = isDense() ? 0.74 : 1;
    if (e.kind === 'mite') return 1.7 * d;
    if (e.kind === 'drone') return 1.35 * d;
    if (e.kind === 'turret') return 0.9 * d;
    if (e.kind === 'armor') return 0.95 * d;
    if (e.kind === 'elite') return 0.8 * d;
    if (e.kind === 'carrier') return 1.05 * d;
    if (e.kind === 'boss') return 0.52 * d;
    return 1.25 * d;
  }

  function killEnemy(e, how) {
    if (!e.alive) return;
    e.alive = false;
    const throwish = how === 'throw' || how === 'super';
    const rgb = e.kind === 'boss' ? GOLD : (throwish ? CYN : COP);
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 36 : 14 + e.r);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(7.2, 'boss');
      screenFlash(GOLD, 0.55);
      floatText(e.x, e.y, '碎!', GOLD, true);
      addScore(Math.round(e.score * G.mult));
      bumpCombo();
      G.winT = 1.35;
      return;
    }
    audio.explode();
    let sc = e.score;
    if (throwish) sc = Math.round(sc * 1.5);
    addScore(Math.round(sc * G.mult));
    bumpCombo();
    if (throwish) addJia(16);
    if (e.kind === 'carrier') {
      spawnMite(e.x - 18, e.y + 8, -40, 80);
      spawnMite(e.x + 18, e.y + 8, 40, 80);
    }
  }

  function damageEnemy(e, dmg, how) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (how === 'shot') {
      audio.hit(G.combo);
      if (G.stop < 0.012) hitStop(0.03);
      kick(1.6, 'hit');
    } else if (how === 'throw' || how === 'super') {
      if (G.stop < 0.02) hitStop(how === 'super' ? 0.05 : 0.036);
    } else if (e.kind === 'boss') {
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, how);
    else if (e.kind === 'boss') spark(e.x, e.y + 8, GOLD);
  }

  function dropHeld(explodeIt) {
    if (!G.held) return;
    const h = G.held;
    G.held = null;
    if (explodeIt) explode(h.x, h.y, MAG, 12);
    syncHud();
  }

  function diePlayer() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    dropHeld(true);
    G.lives -= 1;
    G.deadT = 0.92;
    G.beamOn = false;
    G.beamLen = 0;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 26);
    audio.death();
    hitStop(0.072);
    kick(7.4, 'die');
    screenFlash(MAG, 0.5);
    G.bullets.length = 0;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    showOverlay('lose', '机毁了', '钳折甲裂。抓小甲再甩一次。R 重开。');
    syncHud();
  }

  function finishWin() {
    const bonus = isDense() ? 10000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    saveBest();
    audio.win();
    const title = isDense() ? '密甲通关' : '巨钳已碎';
    const lead = isDense()
      ? '密甲扫尽。双钳还热着。R 再来，或换模式。'
      : '荒脊到甲巢，巨钳砸碎了。R 再来，或换密甲。';
    showOverlay('win', title, lead);
    syncHud();
  }

  function nextStage() {
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    addScore(SCORE.stage * G.mult);
    addJia(14);
    const st = STAGES[G.stage - 1];
    toast(st ? st.name : '下一关', false, true);
    audio.wave();
    kick(2.8, 'grab');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.wrecks.length = 0;
    G.held = null;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
  }

  function wantFire() {
    if (G.mode !== 'play' || G.deadT > 0 || overlayOpen()) return false;
    return keys.sht || pointer.down;
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.06;
    const spread = G.held ? 14 : 10;
    const y = G.ship.y - 18;
    G.shots.push({ x: G.ship.x - spread, y: y, vx: 0, vy: -SHOT_V, r: 3.2, dmg: 1 });
    G.shots.push({ x: G.ship.x + spread, y: y, vx: 0, vy: -SHOT_V, r: 3.2, dmg: 1 });
    if (G.combo >= 9) {
      G.shots.push({ x: G.ship.x, y: y - 6, vx: 0, vy: -SHOT_V, r: 3.4, dmg: 1 });
    }
    capArr(G.shots, 80);
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
          burst(s.x, s.y, AMB, 5, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    const hx = G.held ? G.held.x : 0;
    const hy = G.held ? G.held.y : 0;
    const hr = G.held ? G.held.r + 6 : 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > VH + 22 || b.y < -32 || b.x < -22 || b.x > VW + 22) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (G.held) {
        const dxh = b.x - hx;
        const dyh = b.y - hy;
        if (dxh * dxh + dyh * dyh < (hr + b.r) * (hr + b.r)) {
          G.bullets.splice(i, 1);
          G.held.hp -= 1;
          burst(b.x, b.y, CYN, 4, 50);
          if (G.held.hp <= 0) {
            explode(G.held.x, G.held.y, CYN, 10);
            dropHeld(false);
          }
          continue;
        }
      }
      if (canHurt) {
        const dx = b.x - G.ship.x;
        const dy = b.y - (G.ship.y - 2);
        const rr = HIT_R + b.r * 0.55;
        if (dx * dx + dy * dy < rr * rr) {
          G.bullets.splice(i, 1);
          diePlayer();
        }
      }
    }
  }

  function updateWrecks(dt) {
    for (let i = G.wrecks.length - 1; i >= 0; i--) {
      const w = G.wrecks[i];
      const tgt = nearestTarget(w.x, w.y);
      if (tgt) {
        const want = Math.atan2(tgt.y - w.y, tgt.x - w.x);
        const have = Math.atan2(w.vy, w.vx);
        let d = want - have;
        while (d > Math.PI) d -= TAU;
        while (d < -Math.PI) d += TAU;
        const turn = clamp(d, -2.2 * dt, 2.2 * dt);
        const spd = hypot(w.vx, w.vy);
        const a = have + turn;
        w.vx = Math.cos(a) * spd;
        w.vy = Math.sin(a) * spd;
      }
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.spin += dt * 14;
      w.life -= dt;
      trails.push({ x: w.x, y: w.y, t: 0, rgb: w.super ? GOLD : CYN, r: w.r * 0.7 });
      capArr(trails, 48);
      for (let j = G.bullets.length - 1; j >= 0; j--) {
        const b = G.bullets[j];
        const dx = b.x - w.x;
        const dy = b.y - w.y;
        if (dx * dx + dy * dy < (w.r + b.r + 4) * (w.r + b.r + 4)) {
          G.bullets.splice(j, 1);
          burst(b.x, b.y, CYN, 3, 40);
        }
      }
      let boom = w.life <= 0 || w.y < -30 || w.y > VH + 30 || w.x < -30 || w.x > VW + 30;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = e.x - w.x;
        const dy = e.y - w.y;
        const rr = e.r + w.r;
        if (dx * dx + dy * dy < rr * rr) {
          smashWreck(w, e);
          if (w.pierce <= 0) {
            boom = true;
            break;
          }
        }
      }
      if (boom) {
        wreckExplode(w);
        G.wrecks.splice(i, 1);
      }
    }
  }

  function updateBeam(dt) {
    const want = G.mode === 'play' && G.deadT <= 0 && keys.grab && !G.held;
    G.beamOn = want;
    if (want) {
      G.beamLen = lerp(G.beamLen, BEAM_MAX, 1 - Math.exp(-dt * 14));
      beamHumT -= dt;
      if (beamHumT <= 0) {
        audio.beam();
        beamHumT = 0.16;
      }
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (!e.alive || !canGrab(e)) continue;
        if (inBeam(e)) {
          grabEnemy(e);
          break;
        }
      }
    } else {
      G.beamLen = lerp(G.beamLen, 0, 1 - Math.exp(-dt * 16));
      if (G.beamLen < 2) G.beamLen = 0;
    }
    G.clawA = lerp(G.clawA, G.held ? 0.18 : (G.beamOn ? 1.15 : 0.42), 1 - Math.exp(-dt * 12));
    if (G.held) {
      G.held.x = lerp(G.held.x, G.ship.x, 1 - Math.exp(-dt * 14));
      G.held.y = lerp(G.held.y, G.ship.y - 38, 1 - Math.exp(-dt * 14));
      G.held.spin += dt * 6;
    }
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'mite' || e.kind === 'drone') {
      e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp * 0.35;
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 24 && e.y < VH - 90) {
        aimedFire(e, 1, 0, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'hop') {
      if (e.t > 0.32) {
        const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
        e.vx = lerp(e.vx, Math.cos(a) * 200 * dens(), 1 - Math.exp(-dt * 3));
        e.vy = lerp(e.vy, Math.sin(a) * 232 * dens(), 1 - Math.exp(-dt * 3));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else if (e.kind === 'turret') {
      e.y += e.vy * dt;
      if (e.y > 72 && e.vy > 16) e.vy = 16;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, isDense() ? 2 : 1, 0.16, bulletSpd() * 0.92);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'armor') {
      e.x = e.baseX + Math.sin(e.t * 1.2 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 120 && e.vy > 22) e.vy = 22;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 3, 0.18, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'elite') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 108 && e.vy > 20) e.vy = 20;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 5, 0.18, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'carrier') {
      e.x = e.baseX + Math.sin(e.t * 1.05 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 88 && e.vy > 26) e.vy = 26;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 2, 0.2, bulletSpd());
        e.fireCd = fireInterval(e);
        if ((e.pattern++ % 3) === 0) {
          spawnMite(e.x, e.y + 16, rand(-50, 50), 70);
        }
      }
    } else if (e.kind === 'boss') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, 122, 1 - Math.exp(-dt * 3.2));
      } else {
        e.x = VW * 0.5 + Math.sin(e.t * 0.68) * 92;
        e.y = 122 + Math.sin(e.t * 1.05) * 10;
      }
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.2 : 2.2);
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      if (ratio > 0.66) {
        aimedFire(e, 3, 0.18, spd);
        if (Math.random() < 0.4) ringFire(e, 8, spd * 0.68, e.spin);
        e.fireCd = 1.12 * (isDense() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        ringFire(e, 10, spd * 0.78, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 5, 0.16, spd);
        e.fireCd = 0.5 * (isDense() ? 0.78 : 1);
      } else {
        ringFire(e, 12, spd * 0.76, e.spin);
        ringFire(e, 8, spd * 0.56, -e.spin * 0.7);
        aimedFire(e, 3, 0.14, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnMite(e.x - 42, e.y + 24, -30, 110);
          spawnMite(e.x + 42, e.y + 24, 30, 110);
        }
        e.fireCd = 0.4 * (isDense() ? 0.78 : 1);
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
        if (e.kind !== 'boss') {
          e.alive = false;
          G.enemies.splice(i, 1);
        }
        continue;
      }
      if (canHurt && !e.ground) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = (e.kind === 'boss' ? e.r * 0.58 : e.r * 0.7) + HIT_R;
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
      if (G.gapT >= 1.5) {
        G.gapT = 0;
        if (G.stage < 3) nextStage();
      }
    }
  }

  function updateShip(dt) {
    if (G.deadT > 0) return;
    if (G.stunT > 0) G.stunT -= dt;
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
    G.ship.x = clamp(G.ship.x + G.ship.vx * dt, 22, VW - 22);
    G.ship.y = clamp(G.ship.y + G.ship.vy * dt, 40, VH - 28);
  }

  function updateWorld(dt) {
    G.scroll += scrollSpd() * dt;
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      p.y += (22 + p.z * 48) * dt;
      if (p.y > VH + 8) {
        p.y = -6;
        p.x = Math.random() * VW;
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
      if (trails[i].t > 0.22) trails.splice(i, 1);
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
    G.kind = kind === 'dense' ? 'dense' : 'rush';
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
    G.jia = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stunT = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.winT = 0;
    G.gapT = 0;
    G.scroll = 0;
    G.beamOn = false;
    G.beamLen = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isDense() ? '密甲' : '突贯', isDense(), !isDense());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'rush';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.jia = 0;
    G.deadT = 0;
    G.beamOn = false;
    G.beamLen = 0;
    G.held = null;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    showOverlay('title', '土枪', LEAD);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('rush');
    else startGame(G.kind || 'rush');
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
      if (living() < 6 && (G.t * 2 | 0) !== ((G.t - dt) * 2 | 0) && Math.random() < 0.45) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 50);
      }
      updateEnemies(dt);
      updateWorld(dt * 0.55);
      G.clawA = 0.55 + Math.sin(G.t * 2.2) * 0.12;
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
      updateWrecks(dt);
      if (G.deadT <= 0) {
        if (G.lives > 0) {
          G.ship.x = VW * 0.5;
          G.ship.y = VH - 78;
          G.invuln = 1.5;
          G.bullets.length = 0;
        } else {
          loseGame();
        }
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    G.stageT += dt;
    updateShip(dt);
    updateBeam(dt);
    updateFire(dt);
    updateShots(dt);
    updateWrecks(dt);
    updateBullets(dt);
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

  function drawBg() {
    ctx.fillStyle = '#0a0604';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#140c06';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const sc = G.scroll;
    const stg = G.stage;
    for (let i = 0; i < 7; i++) {
      const n = i + ((sc * 0.01) | 0);
      const hsh = hash(n * 3.1 + stg);
      const x = (hsh * VW);
      const y = ((n * 118 - sc * 0.85) % (VH + 140)) - 40;
      const w = 28 + hash(n + 9) * 36;
      const hh = 70 + hash(n + 4) * 90;
      ctx.fillStyle = rgba(COP, 0.07 + hash(n) * 0.08);
      ctx.fillRect(sx(x - w * 0.5), sy(y), w * scale, hh * scale);
      ctx.strokeStyle = rgba(COP, 0.16);
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(sx(x - w * 0.5), sy(y), w * scale, hh * scale);
    }

    if (stg >= 2) {
      for (let i = 0; i < 5; i++) {
        const n = i + ((sc * 0.008) | 0);
        const y = ((n * 160 - sc * 0.6) % (VH + 80)) - 20;
        ctx.strokeStyle = rgba(CYN, 0.08);
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(40), sy(y));
        ctx.lineTo(sx(VW - 40), sy(y));
        ctx.stroke();
      }
    }

    if (stg >= 3 || hasBoss()) {
      for (let i = 0; i < 4; i++) {
        const n = i * 2 + 1;
        const x = 40 + hash(n) * (VW - 80);
        const y = ((hash(n + 2) * VH + sc * 0.4) % (VH + 60)) - 20;
        ctx.strokeStyle = rgba(CYN, 0.22);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(x - 10), sy(y));
        ctx.lineTo(sx(x), sy(y + 16));
        ctx.lineTo(sx(x + 10), sy(y));
        ctx.stroke();
      }
    }

    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      ctx.fillStyle = rgba(i % 3 === 0 ? CYN : AMB, p.a * 0.7);
      const r = p.s * scale;
      ctx.fillRect(sx(p.x) - r * 0.5, sy(p.y) - r * 0.5, r, r);
    }
  }

  function drawBeam() {
    if (G.beamLen < 6) return;
    const x = G.ship.x;
    const y1 = G.ship.y - 20;
    const y0 = y1 - G.beamLen;
    const pulse = 0.55 + Math.sin(G.t * 28) * 0.25;
    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.18 * pulse);
    ctx.lineWidth = 22 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y1));
    ctx.lineTo(sx(x), sy(y0));
    ctx.stroke();
    ctx.strokeStyle = rgba(CLAW, 0.85);
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x - 9), sy(y1));
    ctx.lineTo(sx(x - 13), sy(y0 + 8));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(x + 9), sy(y1));
    ctx.lineTo(sx(x + 13), sy(y0 + 8));
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y1));
    ctx.lineTo(sx(x), sy(y0));
    ctx.stroke();
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y0), 4.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemyBody(e, x, y, kind, flash, spin) {
    const f = flash > 0;
    const col = f ? WHT : (kind === 'boss' ? COP : AMB);
    const edge = f ? WHT : CYN;
    if (kind === 'mite') {
      drawPoly([
        [x, y - 8], [x + 7, y], [x, y + 7], [x - 7, y]
      ], rgba(col, 0.95), rgba(edge, 0.7), 1);
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(sx(x - 1.2), sy(y - 1.2), 2.4 * scale, 2.4 * scale);
    } else if (kind === 'drone') {
      ctx.fillStyle = rgba(col, 0.92);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(edge, 0.8);
      ctx.lineWidth = 1.3 * scale;
      ctx.stroke();
      ctx.strokeStyle = rgba(CYN, 0.55);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 11 * scale, spin, spin + 2.2);
      ctx.stroke();
    } else if (kind === 'hop') {
      drawPoly([
        [x - 9, y + 4], [x - 4, y - 8], [x + 4, y - 8], [x + 9, y + 4], [x, y + 8]
      ], rgba(COP, 0.95), rgba(CYN, 0.6), 1);
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.beginPath();
      ctx.arc(sx(x - 3), sy(y - 2), 1.6 * scale, 0, TAU);
      ctx.arc(sx(x + 3), sy(y - 2), 1.6 * scale, 0, TAU);
      ctx.fill();
    } else if (kind === 'turret') {
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.fillRect(sx(x - 11), sy(y + 2), 22 * scale, 8 * scale);
      ctx.fillStyle = rgba(COP, 0.95);
      ctx.fillRect(sx(x - 7), sy(y - 8), 14 * scale, 12 * scale);
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(sx(x - 2), sy(y - 14), 4 * scale, 8 * scale);
    } else if (kind === 'armor') {
      drawPoly([
        [x - 12, y + 10], [x - 10, y - 10], [x + 10, y - 10], [x + 12, y + 10]
      ], rgba(COP, 0.95), rgba(AMB, 0.7), 1.2);
      ctx.fillStyle = rgba(CYN, e.hp && e.hp <= 2 ? 0.95 : 0.55);
      ctx.fillRect(sx(x - 6), sy(y - 4), 12 * scale, 5 * scale);
    } else if (kind === 'elite') {
      ctx.fillStyle = rgba(COP, 0.95);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = spin * 0.2 + i * TAU / 6;
        const px = x + Math.cos(a) * 16;
        const py = y + Math.sin(a) * 14;
        if (i === 0) ctx.moveTo(sx(px), sy(py));
        else ctx.lineTo(sx(px), sy(py));
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), 4 * scale, 0, TAU);
      ctx.fill();
    } else if (kind === 'carrier') {
      ctx.fillStyle = rgba(COP, 0.9);
      ctx.beginPath();
      ctx.ellipse(sx(x), sy(y), 18 * scale, 10 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.65);
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(DEEP, 0.8);
      ctx.fillRect(sx(x - 6), sy(y - 3), 12 * scale, 6 * scale);
    } else if (kind === 'boss') {
      const body = f ? WHT : COP;
      ctx.fillStyle = rgba(body, 0.96);
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y - 28));
      ctx.lineTo(sx(x + 32), sy(y - 8));
      ctx.lineTo(sx(x + 26), sy(y + 22));
      ctx.lineTo(sx(x - 26), sy(y + 22));
      ctx.lineTo(sx(x - 32), sy(y - 8));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.8);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
      const open = 18 + Math.sin((spin || 0) * 2) * 6;
      ctx.strokeStyle = rgba(CLAW, 0.9);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x - 22), sy(y + 8));
      ctx.lineTo(sx(x - 38), sy(y + 8 + open));
      ctx.lineTo(sx(x - 20), sy(y + 18 + open));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sx(x + 22), sy(y + 8));
      ctx.lineTo(sx(x + 38), sy(y + 8 + open));
      ctx.lineTo(sx(x + 20), sy(y + 18 + open));
      ctx.stroke();
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y - 2), 7 * scale, 0, TAU);
      ctx.fill();
      const hp = e.maxHp ? e.hp / e.maxHp : 1;
      ctx.fillStyle = rgba(DEEP, 0.7);
      ctx.fillRect(sx(x - 28), sy(y - 36), 56 * scale, 4 * scale);
      ctx.fillStyle = rgba(hp > 0.33 ? COP : MAG, 0.95);
      ctx.fillRect(sx(x - 28), sy(y - 36), 56 * hp * scale, 4 * scale);
    }
  }

  function drawEnemy(e) {
    if (!e.alive) return;
    drawEnemyBody(e, e.x, e.y, e.kind, e.flash, e.spin || e.t);
  }

  function drawWreck(w) {
    ctx.save();
    const cx = sx(w.x);
    const cy = sy(w.y);
    ctx.translate(cx, cy);
    ctx.rotate(w.spin);
    ctx.translate(-cx, -cy);
    drawEnemyBody(w, w.x, w.y, w.kind, 0.1, w.spin);
    ctx.restore();
    ctx.strokeStyle = rgba(w.super ? GOLD : CYN, 0.7);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.arc(sx(w.x), sy(w.y), w.r * scale, 0, TAU);
    ctx.stroke();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(AMB, 0.95);
      ctx.fillRect(sx(s.x - 1.4), sy(s.y - 7), 2.8 * scale, 12 * scale);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(sx(s.x - 0.7), sy(s.y - 9), 1.4 * scale, 8 * scale);
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

  function drawShip() {
    if (G.deadT > 0) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const blink = G.invuln > 0 && ((G.invuln * 16) | 0) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.42;

    ctx.fillStyle = rgba(COP, 0.35);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y + 16), 10 * scale, 6 * scale, 0, 0, TAU);
    ctx.fill();

    const a = G.clawA;
    const lx = x - 16 - Math.sin(a) * 4;
    const ly = y - 6 - Math.cos(a) * 10;
    const rx = x + 16 + Math.sin(a) * 4;
    const ry = y - 6 - Math.cos(a) * 10;
    ctx.strokeStyle = rgba(CYN, 0.9);
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x - 8), sy(y - 4));
    ctx.lineTo(sx(lx), sy(ly));
    ctx.lineTo(sx(lx - 6), sy(ly + 8));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(x + 8), sy(y - 4));
    ctx.lineTo(sx(rx), sy(ry));
    ctx.lineTo(sx(rx + 6), sy(ry + 8));
    ctx.stroke();

    drawPoly([
      [x, y - 16],
      [x + 12, y - 2],
      [x + 8, y + 12],
      [x - 8, y + 12],
      [x - 12, y - 2]
    ], rgba(COP, 0.98), rgba(AMB, 0.8), 1.3);
    drawPoly([
      [x, y - 10],
      [x + 5, y + 2],
      [x - 5, y + 2]
    ], rgba(WHT, 0.95), null, 0);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y - 2), 3.2 * scale, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(AMB, 0.85);
    ctx.fillRect(sx(x - 7), sy(y + 10), 4 * scale, 8 * scale);
    ctx.fillRect(sx(x + 3), sy(y + 10), 4 * scale, 8 * scale);
    ctx.fillStyle = rgba(CYN, 0.55 + Math.sin(G.t * 22) * 0.2);
    ctx.fillRect(sx(x - 6), sy(y + 16), 2.2 * scale, 5 * scale);
    ctx.fillRect(sx(x + 4), sy(y + 16), 2.2 * scale, 5 * scale);

    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle / 0.06);
      ctx.fillRect(sx(x - 12), sy(y - 26), 3 * scale, 10 * scale);
      ctx.fillRect(sx(x + 9), sy(y - 26), 3 * scale, 10 * scale);
    }

    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y + 2), 1.6 * scale, 0, TAU);
    ctx.fill();

    ctx.globalAlpha = 1;

    if (G.held) {
      drawEnemyBody(G.held, G.held.x, G.held.y, G.held.kind, 0, G.held.spin);
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.arc(sx(G.held.x), sy(G.held.y), (G.held.r + 4) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFx() {
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      const a = 1 - t.t / 0.22;
      ctx.fillStyle = rgba(t.rgb, a * 0.45);
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
    ctx.fillStyle = '#140c06';
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
    drawBeam();
    for (let i = 0; i < G.enemies.length; i++) drawEnemy(G.enemies[i]);
    for (let i = 0; i < G.wrecks.length; i++) drawWreck(G.wrecks[i]);
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
      startGame('rush');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function grabWanted() {
    return grabSrc.shift || grabSrc.z || grabSrc.pad;
  }

  function refreshGrab() {
    const on = grabWanted();
    const was = keys.grab;
    keys.grab = on;
    if (G.mode !== 'play' || G.deadT > 0) {
      syncGrabBtns();
      return;
    }
    if (on && !was) audio.ensure();
    if (!on && was && G.held) throwHeld();
    syncGrabBtns();
  }

  function setGrab(on) {
    grabSrc.pad = on;
    refreshGrab();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isGrab = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
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
    if (k === 'ArrowUp' || k === 'ArrowDown' || isGrab) {
      if (down) e.preventDefault();
    }
    if (isGrab) {
      if (k === 'z' || k === 'Z') grabSrc.z = down;
      else grabSrc.shift = down;
      refreshGrab();
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R' || isGrab)) return;
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
      startGame('rush');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('dense');
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

  function bindGrabBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      setGrab(true);
    });
    el.addEventListener('pointerup', function (e) {
      e.preventDefault();
      setGrab(false);
    });
    el.addEventListener('pointercancel', function () {
      setGrab(false);
    });
    el.addEventListener('pointerleave', function (e) {
      if (e.buttons === 0) setGrab(false);
    });
    el.addEventListener('click', function (e) { e.preventDefault(); });
  }

  seedEmbers();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnRush) {
    btnRush.addEventListener('click', function () {
      audio.ensure();
      startGame('rush');
    });
  }
  if (btnDense) {
    btnDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'rush');
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
  bindGrabBtn(btnGrab);
  bindGrabBtn(btnPad);

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
      grabSrc.shift = false;
      grabSrc.z = false;
      grabSrc.pad = false;
      if (keys.grab && G.held) throwHeld();
      keys.grab = false;
    }
  });

  requestAnimationFrame(frame);
})();
