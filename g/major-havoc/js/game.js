'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const CX = 320;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const PW = 14;
  const PH = 22;
  const GY = 328;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 580;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const WALK = 168;
  const SHIP_ACC = 540;
  const SHIP_DRAG = 3.1;
  const SHIP_MAX = 248;
  const SHOT_SPD = 430;
  const FIRE_CD_S = 0.12;
  const FIRE_CD_B = 0.14;
  const MAX_SHOTS = 3;
  const DIE_T = 0.9;
  const INVULN = 1.45;
  const BEST_KEY = 'playbox-major-havoc-best';
  const MUTE_KEY = 'playbox-major-havoc-mute';
  const OPS = '←↑↓→ / WASD 飞或跑 · 空格射击/跳跃 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const HOT = [25, 200, 255];
  const HOT2 = [90, 224, 255];
  const GOLD = [255, 227, 107];
  const WHT = [232, 246, 255];
  const ORG = [255, 140, 64];
  const RED = [255, 72, 96];
  const LEAF = [61, 255, 122];
  const PNK = [255, 154, 212];
  const DEEP = [6, 24, 34];

  const SCORE = {
    scout: 80,
    fighter: 120,
    spinner: 200,
    walker: 100,
    drone: 150,
    turret: 180,
    dock: 500,
    arm: 400,
    escape: 2000,
    world: 1200,
    clear: 8000,
    rushClear: 10000
  };

  const WORLDS = [
    {
      name: '前哨',
      en: 'OUTPOST',
      quota: 6,
      timer: 16,
      w: 1280,
      kinds: ['scout', 'scout', 'fighter'],
      ground: [
        { x: 0, w: 300, y: GY },
        { x: 360, w: 300, y: GY },
        { x: 720, w: 560, y: GY }
      ],
      plats: [
        { x: 190, y: 250, w: 120 },
        { x: 500, y: 232, w: 120 },
        { x: 860, y: 250, w: 140 },
        { x: 1060, y: 206, w: 100 }
      ],
      ents: [
        { k: 'walker', x: 430, y: GY },
        { k: 'walker', x: 820, y: GY },
        { k: 'drone', x: 540, y: 188 },
        { k: 'turret', x: 1100, y: 206 }
      ],
      reactor: 1188,
      exit: 52
    },
    {
      name: '矿带',
      en: 'ASTEROID',
      quota: 8,
      timer: 14.5,
      w: 1420,
      kinds: ['scout', 'fighter', 'scout', 'spinner'],
      ground: [
        { x: 0, w: 240, y: GY },
        { x: 310, w: 260, y: GY },
        { x: 650, w: 220, y: GY },
        { x: 940, w: 480, y: GY }
      ],
      plats: [
        { x: 150, y: 248, w: 110 },
        { x: 400, y: 214, w: 130 },
        { x: 700, y: 248, w: 120 },
        { x: 920, y: 210, w: 110 },
        { x: 1160, y: 248, w: 140 }
      ],
      ents: [
        { k: 'walker', x: 380, y: GY },
        { k: 'walker', x: 760, y: GY },
        { k: 'drone', x: 460, y: 170 },
        { k: 'drone', x: 1000, y: 168 },
        { k: 'laser', x: 620, y0: 140, y1: GY },
        { k: 'turret', x: 1220, y: 248 }
      ],
      reactor: 1330,
      exit: 48
    },
    {
      name: '要塞',
      en: 'CITADEL',
      quota: 10,
      timer: 13,
      w: 1560,
      kinds: ['fighter', 'scout', 'spinner', 'fighter'],
      ground: [
        { x: 0, w: 220, y: GY },
        { x: 290, w: 200, y: GY },
        { x: 560, w: 240, y: GY },
        { x: 880, w: 180, y: GY },
        { x: 1140, w: 420, y: GY }
      ],
      plats: [
        { x: 120, y: 248, w: 100 },
        { x: 340, y: 210, w: 120 },
        { x: 560, y: 248, w: 110 },
        { x: 760, y: 196, w: 120 },
        { x: 980, y: 248, w: 130 },
        { x: 1220, y: 210, w: 120 },
        { x: 1400, y: 248, w: 110 }
      ],
      ents: [
        { k: 'walker', x: 360, y: GY },
        { k: 'walker', x: 640, y: GY },
        { k: 'walker', x: 1260, y: GY },
        { k: 'drone', x: 420, y: 164 },
        { k: 'drone', x: 900, y: 150 },
        { k: 'turret', x: 780, y: 196 },
        { k: 'turret', x: 1420, y: 248 },
        { k: 'laser', x: 520, y0: 120, y1: GY },
        { k: 'laser', x: 1088, y0: 130, y1: GY }
      ],
      reactor: 1470,
      exit: 46
    },
    {
      name: '核心',
      en: 'NEXUS',
      quota: 12,
      timer: 11.5,
      w: 1680,
      kinds: ['spinner', 'fighter', 'scout', 'fighter', 'spinner'],
      ground: [
        { x: 0, w: 200, y: GY },
        { x: 270, w: 190, y: GY },
        { x: 530, w: 210, y: GY },
        { x: 820, w: 180, y: GY },
        { x: 1080, w: 200, y: GY },
        { x: 1360, w: 320, y: GY }
      ],
      plats: [
        { x: 90, y: 248, w: 100 },
        { x: 300, y: 206, w: 110 },
        { x: 520, y: 248, w: 100 },
        { x: 700, y: 190, w: 120 },
        { x: 920, y: 248, w: 110 },
        { x: 1120, y: 196, w: 120 },
        { x: 1340, y: 248, w: 130 },
        { x: 1520, y: 210, w: 100 }
      ],
      ents: [
        { k: 'walker', x: 340, y: GY },
        { k: 'walker', x: 620, y: GY },
        { k: 'walker', x: 1160, y: GY },
        { k: 'walker', x: 1480, y: GY },
        { k: 'drone', x: 380, y: 154 },
        { k: 'drone', x: 780, y: 140 },
        { k: 'drone', x: 1280, y: 160 },
        { k: 'turret', x: 720, y: 190 },
        { k: 'turret', x: 1140, y: 196 },
        { k: 'turret', x: 1540, y: 210 },
        { k: 'laser', x: 480, y0: 118, y1: GY },
        { k: 'laser', x: 1000, y0: 118, y1: GY },
        { k: 'laser', x: 1328, y0: 130, y1: GY }
      ],
      reactor: 1590,
      exit: 44
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
  const btnRaid = document.getElementById('btn-raid');
  const btnRush = document.getElementById('btn-rush');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboVal = document.getElementById('combo');
  const comboEl = document.getElementById('combo-label');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const timerWrap = document.getElementById('timer-wrap');
  const timerBar = document.getElementById('timer-bar');
  const timerNum = document.getElementById('timer-num');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnUp = document.getElementById('btn-up');
  const btnJump = document.getElementById('btn-jump');
  const btnFire = document.getElementById('btn-fire');

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
  let chainTok = 0;
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false, jump: false, fire: false };
  const pointer = { down: false, hover: false, x: VW * 0.4, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    phase: 'space',
    t: 0,
    clock: 0,
    world: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    player: null,
    enemies: [],
    shots: [],
    eShots: [],
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
    muzzle: 0,
    camX: 0,
    spaceKills: 0,
    spawnT: 0,
    station: 0,
    stationX: 720,
    timer: 0,
    timerMax: 16,
    boomT: 0,
    boomX: 0,
    boomY: 0,
    siren: 0,
    demoT: 0.5,
    squash: 1
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
  function wx(x) {
    return ox + (x - G.camX) * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function angOf(x, y) {
    return Math.atan2(y, x);
  }
  function isRush() {
    return G.kind === 'rush';
  }
  function world() {
    return WORLDS[clamp(G.world, 0, WORLDS.length - 1)];
  }
  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function inSpace() {
    return G.phase === 'space';
  }
  function inBase() {
    return G.phase === 'base' || G.phase === 'escape';
  }
  function walkSpd() {
    return WALK * (isRush() ? 1.32 : 1);
  }
  function shipMax() {
    return SHIP_MAX * (isRush() ? 1.12 : 1);
  }

  function freshPlayer(space) {
    if (space) {
      return {
        x: 168,
        y: 186,
        vx: 0,
        vy: 0,
        ang: 0,
        facing: 1,
        grounded: false,
        coyote: 0,
        jbuf: 0,
        squash: 1
      };
    }
    const w = world();
    return {
      x: w.exit + 18,
      y: GY,
      vx: 0,
      vy: 0,
      ang: 0,
      facing: 1,
      grounded: true,
      coyote: COYOTE,
      jbuf: 0,
      squash: 1
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
      this.beep(920, 0.05, 'square', 0.03, 1760);
      this.beep(460, 0.04, 'triangle', 0.012, 220);
    },
    hit() {
      this.ensure();
      this.beep(320, 0.07, 'square', 0.04, 90);
      this.noise(0.08, 0.05, 700);
    },
    jump() {
      this.ensure();
      this.beep(240, 0.09, 'square', 0.03, 520);
    },
    land() {
      this.ensure();
      this.beep(110, 0.06, 'triangle', 0.04, 60);
      this.noise(0.05, 0.03, 200);
    },
    die() {
      this.ensure();
      this.noise(0.28, 0.08, 280);
      this.beep(180, 0.32, 'sawtooth', 0.05, 40);
    },
    dock() {
      this.ensure();
      this.beep(440, 0.08, 'square', 0.04, 660);
      this.beep(660, 0.1, 'square', 0.035, 880);
      this.beep(880, 0.16, 'triangle', 0.04, 1320);
    },
    arm() {
      this.ensure();
      this.beep(220, 0.18, 'square', 0.05, 110);
      this.beep(880, 0.12, 'triangle', 0.03);
    },
    boom() {
      this.ensure();
      this.noise(0.55, 0.12, 120);
      this.beep(90, 0.5, 'sawtooth', 0.08, 40);
      this.beep(180, 0.22, 'square', 0.04, 50);
    },
    escape() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.04);
      this.beep(659, 0.1, 'square', 0.04);
      this.beep(784, 0.18, 'triangle', 0.05, 1046);
    },
    combo(n) {
      this.ensure();
      this.beep(520 + n * 40, 0.08, 'square', 0.03, 880 + n * 30);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04);
      this.beep(880, 0.12, 'triangle', 0.04);
      this.beep(1174, 0.16, 'square', 0.035);
    },
    warn() {
      this.ensure();
      this.beep(720, 0.08, 'square', 0.035, 240);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.045);
      this.beep(659, 0.12, 'square', 0.04);
      this.beep(784, 0.12, 'square', 0.04);
      this.beep(1046, 0.28, 'triangle', 0.05);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.22, 'sawtooth', 0.05, 80);
      this.beep(110, 0.4, 'triangle', 0.04, 40);
    }
  };

  function kick(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    clearTimeout(kickTok);
    kickTok = setTimeout(function () {
      stageEl.classList.remove(cls);
    }, 380);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function burst(x, y, n, rgb, spd, g, cam) {
    const count = REDUCE ? Math.min(n, 6) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const s = rand(spd * 0.25, spd);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        g: g == null ? 220 : g,
        r: rand(1.1, 3.4),
        life: rand(0.22, 0.72),
        max: 0.72,
        rgb: rgb,
        cam: cam ? 1 : 0
      });
    }
  }

  function sparkAt(x, y, rgb, cam) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, cam: cam ? 1 : 0 });
  }

  function ringAt(x, y, rgb, cam) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, cam: cam ? 1 : 0 });
  }

  function floatText(text, x, y, rgb, cam) {
    floats.push({
      text: text,
      x: x,
      y: y,
      vy: -38,
      t: 0,
      life: 0.7,
      rgb: rgb || GOLD,
      cam: cam ? 1 : 0
    });
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    G.toastT = 1.35;
    clearTimeout(toastTok);
    toastTok = setTimeout(function () {
      toastEl.classList.add('hidden');
    }, 1400);
  }

  function popChain() {
    if (!chainPop) return;
    chainPop.textContent = '×' + G.mult;
    chainPop.classList.remove('hidden');
    clearTimeout(chainTok);
    chainTok = setTimeout(function () {
      chainPop.classList.add('hidden');
    }, 700);
    audio.combo(G.mult);
  }

  function flashScore(n) {
    if (!scoreAdd || !scoreBox) return;
    scoreAdd.textContent = '+' + n;
    scoreAdd.hidden = false;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    clearTimeout(addTok);
    addTok = setTimeout(function () {
      scoreAdd.hidden = true;
      scoreBox.classList.remove('flash');
    }, 700);
  }

  function addScore(n, x, y, cam) {
    const pts = Math.round(n * G.mult);
    G.score += pts;
    if (G.score > G.best) {
      G.best = G.score;
      saveBest();
    }
    if (G.score >= G.next1up) {
      G.next1up += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.oneup();
      }
    }
    flashScore(pts);
    if (x != null) floatText('+' + pts, x, y, GOLD, cam);
    return pts;
  }

  function noteHit() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (G.mult > prev) popChain();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
  }

  function loadBest() {
    try {
      const v = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      G.best = isFinite(v) ? v : 0;
    } catch (err) {
      G.best = 0;
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.55 + 0.2,
        spd: Math.random() * 22 + 5,
        z: Math.random() * 1.6 + 0.4,
        rgb: Math.random() < 0.12 ? MAG : (Math.random() < 0.22 ? GOLD : HOT2)
      });
    }
  }

  function wantLeft() {
    if (overlayOpen()) return false;
    if (keys.l) return true;
    if (pointer.down && inBase() && pointer.x < G.player.x - G.camX - 18) return true;
    return false;
  }
  function wantRight() {
    if (overlayOpen()) return false;
    if (keys.r) return true;
    if (pointer.down && inBase() && pointer.x > G.player.x - G.camX + 18) return true;
    return false;
  }
  function wantUp() {
    if (overlayOpen()) return false;
    return keys.u;
  }
  function wantDown() {
    if (overlayOpen()) return false;
    return keys.d;
  }
  function wantFire() {
    if (overlayOpen()) return false;
    return keys.fire || G.fireHold || (pointer.down && inSpace());
  }

  function showOverlay(kind, title, lead, kicker) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    panel.classList.toggle('lose', kind === 'lose');
    panel.classList.toggle('win', kind === 'win');
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovKicker.textContent = kicker || 'HAVOC';
    ovOps.textContent = OPS;
    if (kind === 'title') {
      btnRaid.textContent = '突袭';
      btnRush.textContent = '狂奔';
    } else if (kind === 'lose') {
      btnRaid.textContent = '再来';
      btnRush.textContent = '换模式';
    } else {
      btnRaid.textContent = '再来';
      btnRush.textContent = G.kind === 'raid' ? '狂奔' : '换模式';
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
  }

  function goTitle() {
    G.mode = 'title';
    G.phase = 'space';
    G.world = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.next1up = LIFE_EVERY;
    G.player = freshPlayer(true);
    G.enemies = [];
    G.shots = [];
    G.eShots = [];
    G.deadT = 0;
    G.boomT = 0;
    G.station = 0;
    G.camX = 0;
    G.ready = 0;
    G.invuln = 0;
    G.demoT = 0.4;
    spawnSpaceEnemy('scout');
    spawnSpaceEnemy('fighter');
    showOverlay(
      'title',
      '浩劫',
      '先在星域开火，对接空间站。<br />再冲进基地，引爆反应堆，在倒计时内逃出。',
      'HAVOC'
    );
    if (hintEl) {
      hintEl.textContent = '星域开火对接 · 基地跑跳拆堆 · 倒计时内逃出';
      hintEl.className = 'hint';
    }
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'rush' ? 'rush' : 'raid';
    G.mode = 'play';
    G.world = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.next1up = LIFE_EVERY;
    G.deadT = 0;
    G.boomT = 0;
    G.why = '';
    hideOverlay();
    beginSpace(true);
    toast(isRush() ? '狂奔 · 更快的基地' : '突袭 · 四界', false, true);
    if (hintEl) {
      hintEl.textContent = isRush() ? '狂奔：基地更快，倒计时更紧' : '方向飞 · 空格开火 · 对接后跑进基地';
      hintEl.className = 'hint';
    }
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind);
  }

  function quotaOf() {
    const q = world().quota;
    return isRush() ? Math.max(4, q - 2) : q;
  }

  function timerOf() {
    const t = world().timer;
    return t * (isRush() ? 0.76 : 1);
  }

  function beginSpace(fresh) {
    G.phase = 'space';
    G.camX = 0;
    G.player = freshPlayer(true);
    G.enemies = [];
    G.shots = [];
    G.eShots = [];
    G.spaceKills = 0;
    G.spawnT = 0.35;
    G.station = 0;
    G.stationX = 740;
    G.timer = 0;
    G.fireCd = 0;
    G.ready = fresh ? 0.55 : 0.2;
    G.invuln = 1.05;
    G.muzzle = 0;
    breakCombo();
    const w = world();
    toast('第 ' + (G.world + 1) + ' 界 · ' + w.name + ' · 星域', false, false);
    if (tagLabel) tagLabel.className = '';
  }

  function beginBase() {
    const w = world();
    G.phase = 'base';
    G.player = freshPlayer(false);
    G.enemies = [];
    G.shots = [];
    G.eShots = [];
    G.camX = 0;
    G.timer = 0;
    G.fireCd = 0;
    G.ready = 0.65;
    G.invuln = 0.9;
    G.muzzle = 0;
    spawnBase();
    toast('突入 ' + w.name + ' · 冲向反应堆', false, false);
    if (hintEl) hintEl.textContent = '跑跳射击 · 触堆启动 · 倒计时内逃回入口';
  }

  function spawnBase() {
    const w = world();
    G.enemies = [];
    for (let i = 0; i < w.ents.length; i++) {
      const e = w.ents[i];
      const o = {
        k: e.k,
        x: e.x,
        y: e.y == null ? GY : e.y,
        vx: e.k === 'walker' ? (Math.random() < 0.5 ? -48 : 48) : 0,
        vy: 0,
        hp: e.k === 'turret' ? 2 : 1,
        t: rand(0, 1.4),
        alive: true,
        facing: 1,
        y0: e.y0 || 0,
        y1: e.y1 || GY,
        onT: e.k === 'laser' ? 0.9 : 0,
        offT: e.k === 'laser' ? 1.1 : 0,
        fire: rand(0.4, 1.2),
        left: e.x - 70,
        right: e.x + 70
      };
      if (e.k === 'drone') {
        o.baseY = o.y;
        o.vx = rand(40, 70) * (Math.random() < 0.5 ? -1 : 1);
        o.left = e.x - 90;
        o.right = e.x + 90;
      }
      G.enemies.push(o);
    }
  }

  function spawnSpaceEnemy(kind) {
    const w = world();
    const pool = w.kinds;
    const k = kind || pool[(Math.random() * pool.length) | 0];
    let x;
    let y;
    const side = (Math.random() * 4) | 0;
    if (side === 0) {
      x = -16;
      y = rand(36, VH - 36);
    } else if (side === 1) {
      x = VW + 16;
      y = rand(36, VH - 36);
    } else if (side === 2) {
      x = rand(36, VW - 36);
      y = -16;
    } else {
      x = rand(36, VW - 36);
      y = VH + 16;
    }
    if (G.player && hypot(x - G.player.x, y - G.player.y) < 90) {
      x = VW - 30;
      y = rand(40, VH - 40);
    }
    G.enemies.push({
      k: k,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      hp: k === 'spinner' ? 2 : 1,
      t: rand(0, TAU),
      alive: true,
      facing: 1,
      fire: rand(0.5, 1.4),
      ang: rand(0, TAU)
    });
  }

  function playerFire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) return;
    if (overlayOpen()) return;
    if (G.fireCd > 0) return;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].alive) n += 1;
    if (n >= MAX_SHOTS) return;
    const p = G.player;
    let ang;
    let x;
    let y;
    let cam = 0;
    if (inSpace()) {
      ang = p.ang;
      x = p.x + Math.cos(ang) * 14;
      y = p.y + Math.sin(ang) * 14;
    } else {
      ang = p.facing >= 0 ? 0 : Math.PI;
      x = p.x + p.facing * 12;
      y = p.y - PH * 0.62;
      cam = 1;
    }
    G.shots.push({
      x: x,
      y: y,
      vx: Math.cos(ang) * SHOT_SPD,
      vy: Math.sin(ang) * (inSpace() ? SHOT_SPD : 0),
      life: inSpace() ? 0.85 : 0.7,
      alive: true,
      cam: cam
    });
    G.fireCd = inSpace() ? FIRE_CD_S : FIRE_CD_B;
    G.muzzle = 0.08;
    audio.shoot();
  }

  function enemyFire(e, ang, spd, cam) {
    G.eShots.push({
      x: e.x,
      y: inBase() ? e.y - (e.k === 'turret' ? 14 : 8) : e.y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 1.6,
      alive: true,
      cam: cam ? 1 : 0
    });
  }

  function killEnemy(e, cam) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.k === 'spinner' ? MAG : (e.k === 'fighter' || e.k === 'turret' ? GOLD : CYN);
    burst(e.x, e.y - (inBase() ? 10 : 0), 14, rgb, 220, inBase() ? 280 : 40, cam);
    sparkAt(e.x, e.y - (inBase() ? 10 : 0), WHT, cam);
    ringAt(e.x, e.y - (inBase() ? 10 : 0), rgb, cam);
    noteHit();
    const base = SCORE[e.k] || 100;
    addScore(base, e.x, e.y - 16, cam);
    audio.hit();
    hitStop(0.036 + Math.min(0.04, G.combo * 0.004));
    G.shake = Math.max(G.shake, REDUCE ? 0 : 5 + Math.min(6, G.combo));
    G.flash = 0.18;
    G.flashRgb = rgb;
    G.punch = 1.03;
    kick('hit');
    if (inSpace()) {
      G.spaceKills += 1;
      if (G.station === 0 && G.spaceKills >= quotaOf()) {
        G.station = 1;
        toast('空间站出现 · 飞入对接湾', false, true);
      }
    }
  }

  function die(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    G.why = why || '被击中了';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.fireHold = false;
    breakCombo();
    const p = G.player;
    const cam = inBase() ? 1 : 0;
    burst(p.x, inBase() ? p.y - 12 : p.y, 22, MAG, 260, inBase() ? 240 : 20, cam);
    ringAt(p.x, inBase() ? p.y - 12 : p.y, MAG, cam);
    audio.die();
    kick('die');
    G.shake = REDUCE ? 0 : 14;
    G.flash = 0.4;
    G.flashRgb = MAG;
    hitStop(0.06);
    if (G.phase === 'escape' && why === '被核爆了') boomFx(world().reactor, 210, true);
  }

  function boomFx(x, y, small) {
    const n = small ? 28 : (REDUCE ? 24 : 86);
    burst(x, y, n, GOLD, small ? 280 : 460, 80, 1);
    burst(x, y, n * 0.5, MAG, small ? 200 : 380, 40, 1);
    burst(x, y, n * 0.35, CYN, small ? 160 : 300, 20, 1);
    ringAt(x, y, GOLD, 1);
    ringAt(x, y, MAG, 1);
    G.flash = small ? 0.35 : 0.85;
    G.flashRgb = GOLD;
    G.shake = REDUCE ? 0 : (small ? 10 : 22);
    G.punch = small ? 1.04 : 1.08;
    if (!small) {
      audio.boom();
      kick('boom');
      hitStop(0.078);
    }
  }

  function loseRun(why) {
    G.mode = 'lose';
    audio.lose();
    showOverlay(
      'lose',
      why || '全舰覆没',
      '分数 ' + G.score + ' · 最高 ' + G.best + '<br />R 立刻再来。',
      isRush() ? 'RUSH' : 'RAID'
    );
    if (hintEl) {
      hintEl.textContent = 'R 重开 · 再来同模式';
      hintEl.className = 'hint warn';
    }
    syncHud();
  }

  function winRun() {
    G.mode = 'win';
    addScore(isRush() ? SCORE.rushClear : SCORE.clear, VW * 0.5, 80, 0);
    audio.win();
    kick('win-flash');
    showOverlay(
      'win',
      isRush() ? '狂奔通关' : '航线肃清',
      '四界反应堆全毁。分数 ' + G.score + ' · 最高 ' + G.best,
      'HAVOC'
    );
    if (hintEl) {
      hintEl.textContent = '通关了 · R 再来';
      hintEl.className = 'hint hot';
    }
    syncHud();
  }

  function dockNow() {
    G.station = 2;
    addScore(SCORE.dock * (G.world + 1), G.player.x, G.player.y, 0);
    burst(G.player.x, G.player.y, 20, CYN, 180, 10, 0);
    ringAt(G.player.x, G.player.y, CYN, 0);
    audio.dock();
    kick('dock');
    G.flash = 0.45;
    G.flashRgb = CYN;
    G.ready = 0.85;
    toast('对接成功 · 突入基地', false, true);
    G.phase = 'enter';
  }

  function armReactor() {
    G.phase = 'escape';
    G.timerMax = timerOf();
    G.timer = G.timerMax;
    G.invuln = 0.35;
    addScore(SCORE.arm, G.player.x, G.player.y - 20, 1);
    burst(world().reactor, 210, 18, MAG, 160, 40, 1);
    audio.arm();
    toast('反应堆启动 · ' + Math.ceil(G.timer) + ' 秒内逃出', true, false);
    if (hintEl) {
      hintEl.textContent = '往回跑 · 入口在左 · 核爆倒计时';
      hintEl.className = 'hint warn';
    }
    if (tagLabel) tagLabel.className = 'warn';
  }

  function escapeNow() {
    G.boomT = 1.7;
    G.boomX = world().reactor;
    G.boomY = 210;
    G.phase = 'boom';
    addScore(SCORE.escape * (G.world + 1) + Math.floor(G.timer * 80), G.player.x, G.player.y - 24, 1);
    addScore(SCORE.world * (G.world + 1), world().reactor, 160, 1);
    boomFx(G.boomX, G.boomY, false);
    audio.escape();
    toast(world().name + ' 反应堆引爆', false, true);
  }

  function nextWorld() {
    if (G.world + 1 >= WORLDS.length) {
      winRun();
      return;
    }
    G.world += 1;
    beginSpace(true);
  }

  function respawn() {
    if (G.lives <= 0) {
      loseRun(G.why || '全舰覆没');
      return;
    }
    G.invuln = INVULN;
    G.deadT = 0;
    G.shots = [];
    G.eShots = [];
    if (G.phase === 'space' || G.phase === 'enter') {
      G.player = freshPlayer(true);
      G.phase = 'space';
    } else {
      G.player = freshPlayer(false);
      G.phase = 'base';
      G.timer = 0;
      spawnBase();
      toast('重新突入 · 剩余 ' + G.lives + ' 命', true, false);
    }
  }

  function updatePlayerSpace(dt) {
    const p = G.player;
    let ax = 0;
    let ay = 0;
    if (wantLeft()) ax -= 1;
    if (wantRight()) ax += 1;
    if (wantUp()) ay -= 1;
    if (wantDown()) ay += 1;
    if (pointer.down && inputSrc === 'ptr' && inSpace() && !overlayOpen()) {
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      const d = hypot(dx, dy);
      if (d > 8) {
        ax = dx / d;
        ay = dy / d;
      }
    }
    const mag = hypot(ax, ay);
    if (mag > 1) {
      ax /= mag;
      ay /= mag;
    }
    p.vx += ax * SHIP_ACC * dt;
    p.vy += ay * SHIP_ACC * dt;
    const drag = Math.exp(-SHIP_DRAG * dt);
    p.vx *= drag;
    p.vy *= drag;
    const spd = hypot(p.vx, p.vy);
    const max = shipMax();
    if (spd > max) {
      p.vx *= max / spd;
      p.vy *= max / spd;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = clamp(p.x, 16, VW - 16);
    p.y = clamp(p.y, 18, VH - 18);
    if (spd > 18) p.ang = angOf(p.vx, p.vy);
    else if (ax || ay) p.ang = angOf(ax, ay);
    p.facing = Math.cos(p.ang) >= 0 ? 1 : -1;
  }

  function solids() {
    const w = world();
    const list = [];
    for (let i = 0; i < w.ground.length; i++) {
      const g = w.ground[i];
      list.push({ x: g.x, y: g.y, w: g.w, h: 48 });
    }
    for (let i = 0; i < w.plats.length; i++) {
      const p = w.plats[i];
      list.push({ x: p.x, y: p.y, w: p.w, h: 10 });
    }
    return list;
  }

  function updatePlayerBase(dt) {
    const p = G.player;
    let ax = 0;
    if (wantLeft()) ax -= 1;
    if (wantRight()) ax += 1;
    if (ax) p.facing = ax;
    p.vx = ax * walkSpd();
    const jumpHold = keys.u || (pointer.down && inBase() && pointer.y < 92);
    if (keys.jump) {
      p.jbuf = BUFFER;
      keys.jump = false;
    } else if (jumpHold) p.jbuf = BUFFER;
    else p.jbuf = Math.max(0, p.jbuf - dt);
    p.coyote = p.grounded ? COYOTE : Math.max(0, p.coyote - dt);
    if (p.jbuf > 0 && p.coyote > 0) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      p.jbuf = 0;
      p.squash = 1.24;
      audio.jump();
    }
    p.x += p.vx * dt;
    p.x = clamp(p.x, 16, world().w - 16);
    const prevY = p.y;
    const wasOn = p.grounded;
    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    p.y += p.vy * dt;
    p.grounded = false;
    const floors = solids();
    const half = PW * 0.5;
    for (let i = 0; i < floors.length; i++) {
      const s = floors[i];
      if (p.x + half < s.x + 2 || p.x - half > s.x + s.w - 2) continue;
      if (p.vy >= 0 && prevY <= s.y + 3 && p.y >= s.y && p.y <= s.y + 22) {
        p.y = s.y;
        p.vy = 0;
        p.grounded = true;
      }
    }
    if (p.grounded && !wasOn) {
      p.squash = 0.58;
      audio.land();
      kick('thump');
      burst(p.x, p.y, 7, HOT, 70, 40, 1);
    }
    p.squash += (1 - p.squash) * Math.min(1, 14 * dt);
    if (p.y > VH + 36) die('坠入深渊了');
  }

  function updateSpaceEnemies(dt) {
    const p = G.player;
    const rush = isRush() ? 1.28 : 1;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.t += dt;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.max(1, hypot(dx, dy));
      if (e.k === 'scout') {
        e.vx = lerp(e.vx, (dx / d) * 90 * rush, 0.08);
        e.vy = lerp(e.vy, (dy / d) * 90 * rush, 0.08);
      } else if (e.k === 'fighter') {
        const want = d < 140 ? -1 : 1;
        e.vx = lerp(e.vx, (dx / d) * 70 * want * rush, 0.06);
        e.vy = lerp(e.vy, (dy / d) * 70 * want * rush + Math.sin(e.t * 3) * 18, 0.06);
        e.fire -= dt;
        if (e.fire <= 0 && G.deadT <= 0 && G.mode === 'play') {
          e.fire = isRush() ? 0.95 : 1.25;
          enemyFire(e, angOf(dx, dy), 150 * rush, 0);
        }
      } else {
        e.ang += dt * 1.8;
        const ox = Math.cos(e.ang) * 70;
        const oy = Math.sin(e.ang) * 50;
        const tx = p.x + ox;
        const ty = p.y + oy;
        e.vx = lerp(e.vx, (tx - e.x) * 1.6, 0.05);
        e.vy = lerp(e.vy, (ty - e.y) * 1.6, 0.05);
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.x < -40 || e.x > VW + 40 || e.y < -40 || e.y > VH + 40) {
        if (Math.random() < 0.5) {
          e.x = clamp(e.x, 10, VW - 10);
          e.y = clamp(e.y, 10, VH - 10);
        }
      }
    }
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      if (!G.enemies[i].alive) G.enemies.splice(i, 1);
    }
  }

  function updateBaseEnemies(dt) {
    const p = G.player;
    const rush = isRush() ? 1.22 : 1;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.t += dt;
      if (e.k === 'walker') {
        e.x += e.vx * rush * dt;
        e.y = GY;
        if (e.x < e.left || e.x > e.right) {
          e.vx *= -1;
          e.x = clamp(e.x, e.left, e.right);
        }
        const onFloor = floorAt(e.x);
        if (onFloor < 0) {
          e.vx *= -1;
          e.x += e.vx * dt * 4;
        }
        e.facing = e.vx >= 0 ? 1 : -1;
      } else if (e.k === 'drone') {
        e.x += e.vx * rush * dt;
        e.y = e.baseY + Math.sin(e.t * 2.4) * 16;
        if (e.x < e.left || e.x > e.right) {
          e.vx *= -1;
          e.x = clamp(e.x, e.left, e.right);
        }
        e.fire -= dt;
        if (e.fire <= 0 && Math.abs(e.x - p.x) < 280 && G.deadT <= 0) {
          e.fire = isRush() ? 1.05 : 1.4;
          enemyFire(e, angOf(p.x - e.x, (p.y - PH * 0.5) - e.y), 170 * rush, 1);
        }
      } else if (e.k === 'turret') {
        e.fire -= dt;
        if (e.fire <= 0 && Math.abs(e.x - p.x) < 340 && G.deadT <= 0) {
          e.fire = isRush() ? 1.15 : 1.55;
          const ang = angOf(p.x - e.x, (p.y - PH * 0.6) - (e.y - 12));
          enemyFire(e, ang, 190 * rush, 1);
        }
      } else if (e.k === 'laser') {
        const cycle = e.onT + e.offT;
        const u = e.t % cycle;
        e.on = u < e.onT;
      }
    }
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      if (!G.enemies[i].alive && G.enemies[i].k !== 'laser') G.enemies.splice(i, 1);
    }
  }

  function floorAt(x) {
    const w = world();
    for (let i = 0; i < w.ground.length; i++) {
      const g = w.ground[i];
      if (x >= g.x && x <= g.x + g.w) return g.y;
    }
    return -1;
  }

  function updateShots(dt) {
    const list = G.shots;
    for (let i = list.length - 1; i >= 0; i--) {
      const s = list[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < G.camX - 20 || s.x > G.camX + VW + 20 || s.y < -20 || s.y > VH + 20) {
        list.splice(i, 1);
        if (inSpace() && G.comboT > 0.2) G.comboT = Math.min(G.comboT, 0.2);
      }
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < G.camX - 30 || s.x > G.camX + VW + 30 || s.y < -30 || s.y > VH + 30) {
        G.eShots.splice(i, 1);
      }
    }
  }

  function collideShots() {
    const cam = inBase() ? 1 : 0;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive || e.k === 'laser') continue;
        const er = e.k === 'spinner' || e.k === 'turret' ? 16 : (e.k === 'drone' ? 12 : 11);
        const ey = inBase() ? e.y - (e.k === 'walker' ? 12 : (e.k === 'turret' ? 10 : 0)) : e.y;
        if (hypot(s.x - e.x, s.y - ey) < er + 4) {
          e.hp -= 1;
          burst(s.x, s.y, 6, WHT, 140, 20, cam);
          sparkAt(s.x, s.y, CYN, cam);
          if (e.hp <= 0) killEnemy(e, cam);
          else {
            audio.hit();
            hitStop(0.03);
            G.shake = Math.max(G.shake, 3);
            noteHit();
            addScore(20, s.x, s.y, cam);
          }
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function hitPlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    const p = G.player;
    if (inSpace()) {
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (!e.alive) continue;
        if (hypot(p.x - e.x, p.y - e.y) < 16) {
          die('撞上敌舰');
          return;
        }
      }
      for (let i = 0; i < G.eShots.length; i++) {
        const s = G.eShots[i];
        if (hypot(p.x - s.x, p.y - s.y) < 10) {
          die('被击中了');
          return;
        }
      }
      return;
    }
    const px = p.x;
    const py = p.y - PH * 0.5;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.k === 'laser') {
        if (!e.on) continue;
        if (Math.abs(px - e.x) < 8 && py + 8 > e.y0 && p.y > e.y0) {
          die('被激光切了');
          return;
        }
        continue;
      }
      if (!e.alive) continue;
      const ey = e.k === 'walker' ? e.y - 12 : (e.k === 'turret' ? e.y - 10 : e.y);
      const er = e.k === 'drone' ? 12 : 13;
      if (Math.abs(px - e.x) < er + 6 && Math.abs(py - ey) < er + 8) {
        die(e.k === 'walker' ? '撞上巡逻机' : (e.k === 'drone' ? '撞上无人机' : '撞上炮台'));
        return;
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      if (Math.abs(px - s.x) < 9 && Math.abs(py - s.y) < 11) {
        die('被击中了');
        return;
      }
    }
  }

  function dockRect() {
    return { x: G.stationX + 18, y: 132, w: 86, h: 62 };
  }

  function tryDock() {
    if (G.station < 1 || G.deadT > 0) return;
    const d = dockRect();
    const p = G.player;
    if (p.x > d.x && p.x < d.x + d.w && p.y > d.y && p.y < d.y + d.h) dockNow();
  }

  function tryReactor() {
    if (G.phase !== 'base' || G.deadT > 0) return;
    const w = world();
    const p = G.player;
    if (Math.abs(p.x - w.reactor) < 28 && p.y > 210) armReactor();
  }

  function tryExit() {
    if (G.phase !== 'escape' || G.deadT > 0) return;
    const w = world();
    const p = G.player;
    if (p.x < w.exit + 26 && p.y <= GY + 2 && p.grounded) escapeNow();
  }

  function updateFx(dt) {
    G.flash = Math.max(0, G.flash - dt * 2.2);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 0.16);
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    const drift = inSpace() ? (G.player ? G.player.vx * 0.35 : 40) : 28;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= (s.spd + Math.abs(drift) * s.z * 0.04) * dt;
      if (s.x < -4) {
        s.x = VW + rand(0, 40);
        s.y = rand(0, VH);
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.22) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.46) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
  }

  function updateCam(dt) {
    if (!inBase()) {
      G.camX = 0;
      return;
    }
    const target = clamp(G.player.x - VW * 0.38, 0, Math.max(0, world().w - VW));
    G.camX = lerp(G.camX, target, 1 - Math.pow(0.001, dt));
  }

  function updateSpace(dt) {
    updatePlayerSpace(dt);
    G.spawnT -= dt;
    const cap = 5 + G.world + (isRush() ? 2 : 0);
    if (G.spawnT <= 0 && G.enemies.length < cap && G.station < 2) {
      spawnSpaceEnemy();
      G.spawnT = (isRush() ? 0.62 : 0.95) - G.world * 0.06;
    }
    if (G.station === 1) {
      G.stationX = lerp(G.stationX, 508, 1 - Math.pow(0.04, dt));
    }
    updateSpaceEnemies(dt);
    updateShots(dt);
    collideShots();
    hitPlayer();
    tryDock();
  }

  function updateBase(dt) {
    updatePlayerBase(dt);
    updateCam(dt);
    updateBaseEnemies(dt);
    updateShots(dt);
    collideShots();
    hitPlayer();
    if (G.phase === 'base') tryReactor();
    if (G.phase === 'escape') {
      G.timer -= dt;
      if (G.timer < 5) {
        G.siren -= dt;
        if (G.siren <= 0) {
          G.siren = 0.55;
          audio.warn();
        }
      }
      if (G.timer <= 0) {
        G.timer = 0;
        die('被核爆了');
      } else tryExit();
    }
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (wantFire() && G.mode === 'play' && G.deadT <= 0) playerFire();
    if (G.ready > 0) {
      G.ready -= dt;
      if (G.phase === 'enter' && G.ready <= 0) beginBase();
      updateShots(dt);
      updateFx(dt);
      return;
    }
    if (G.phase === 'space') updateSpace(dt);
    else if (G.phase === 'base' || G.phase === 'escape') updateBase(dt);
    updateFx(dt);
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }

    if (G.mode === 'title') {
      G.demoT -= dt;
      if (G.demoT <= 0) {
        G.demoT = 2.4;
        if (G.enemies.length < 4) spawnSpaceEnemy('scout');
      }
      const p = G.player;
      p.x = 168 + Math.sin(G.t * 0.7) * 36;
      p.y = 186 + Math.cos(G.t * 0.5) * 22;
      p.ang = Math.sin(G.t * 0.8) * 0.5;
      updateSpaceEnemies(dt * 0.55);
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      if (G.phase === 'space') updateSpaceEnemies(dt * 0.3);
      return;
    }

    if (G.boomT > 0 && G.phase === 'boom') {
      G.boomT -= dt;
      if (Math.random() < 0.35) {
        burst(G.boomX + rand(-30, 30), G.boomY + rand(-40, 40), 8, GOLD, 240, 60, 1);
      }
      updateFx(dt);
      updateCam(dt);
      if (G.boomT <= 0) nextWorld();
      syncHud();
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateShots(dt);
      if (inSpace()) updateSpaceEnemies(dt);
      else updateBaseEnemies(dt);
      if (G.deadT <= 0) respawn();
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);
    syncHud();
  }

  function drawLetterbox() {
    ctx.fillStyle = '#031018';
    if (ox > 0.5) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W - ox - VW * scale + 2, H);
    }
    if (oy > 0.5) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H - oy - VH * scale + 2, H);
    }
  }

  function vecStroke(rgb, a, w) {
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = Math.max(1, w * scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }

  function drawBgSpace() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#041824');
    g.addColorStop(0.5, '#031018');
    g.addColorStop(1, '#02080e');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const sun = ctx.createRadialGradient(sx(520), sy(70), 4 * scale, sx(520), sy(70), 120 * scale);
    sun.addColorStop(0, rgba(WHT, 0.28));
    sun.addColorStop(0.2, rgba(CYN, 0.12));
    sun.addColorStop(1, rgba(CYN, 0));
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(sx(520), sy(70), 120 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBgBase() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#051820');
    g.addColorStop(0.55, '#04141c');
    g.addColorStop(1, '#030c12');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const warn = G.phase === 'escape' ? clamp(1 - G.timer / Math.max(0.1, G.timerMax), 0, 1) : 0;
    if (warn > 0.35) {
      ctx.fillStyle = rgba(MAG, (warn - 0.35) * 0.12 + (Math.sin(G.t * 10) > 0 ? 0.04 : 0));
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = rgba(s.rgb, s.a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawGrid() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    vecStroke(HOT, 0.08, 1);
    for (let x = 0; x <= VW; x += 40) {
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(0));
      ctx.lineTo(sx(x), sy(VH));
      ctx.stroke();
    }
    for (let y = 0; y <= VH; y += 40) {
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(y));
      ctx.lineTo(sx(VW), sy(y));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawStation() {
    if (G.station < 1) return;
    const x = G.stationX;
    const y = 96;
    ctx.save();
    vecStroke(HOT, 0.9, 1.6);
    ctx.strokeRect(wx(x), sy(y), 118 * scale, 168 * scale);
    vecStroke(CYN, 0.55, 1);
    ctx.strokeRect(wx(x + 10), sy(y + 12), 98 * scale, 28 * scale);
    ctx.strokeRect(wx(x + 10), sy(y + 128), 98 * scale, 28 * scale);
    const d = dockRect();
    const pulse = 0.45 + Math.sin(G.t * 8) * 0.25;
    ctx.fillStyle = rgba(CYN, 0.12 + pulse * 0.12);
    ctx.fillRect(wx(d.x), sy(d.y), d.w * scale, d.h * scale);
    vecStroke(CYN, 0.7 + pulse * 0.3, 1.8);
    ctx.strokeRect(wx(d.x), sy(d.y), d.w * scale, d.h * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = '700 ' + Math.max(9, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('对接', wx(d.x + d.w * 0.5), sy(d.y - 8));
    ctx.restore();
  }

  function drawShip() {
    if (G.mode === 'play' && G.deadT > 0) return;
    if (G.mode === 'play' && G.invuln > 0 && Math.floor(G.t * 18) % 2 === 0) return;
    const p = G.player;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.rotate(p.ang);
    ctx.scale(scale, scale);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(CYN, 0.18 + G.muzzle * 0.5);
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    vecStroke(CYN, 0.95, 1.4 / scale);
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-10, 8);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, -8);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.moveTo(6, 0);
    ctx.lineTo(-2, 3);
    ctx.lineTo(-2, -3);
    ctx.closePath();
    ctx.fill();
    if (hypot(p.vx, p.vy) > 40 || G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.55);
      ctx.beginPath();
      ctx.moveTo(-10, 3);
      ctx.lineTo(-18 - Math.sin(G.t * 40) * 3, 0);
      ctx.lineTo(-10, -3);
      ctx.closePath();
      ctx.fill();
    }
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(16, 0, 3.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawSpaceEnemy(e) {
    ctx.save();
    ctx.translate(sx(e.x), sy(e.y));
    ctx.scale(scale, scale);
    if (e.k === 'scout') {
      vecStroke(HOT2, 0.95, 1.3 / scale);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.stroke();
    } else if (e.k === 'fighter') {
      vecStroke(GOLD, 0.95, 1.3 / scale);
      ctx.rotate(angOf(e.vx, e.vy));
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, 7);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, -7);
      ctx.closePath();
      ctx.stroke();
    } else {
      vecStroke(MAG, 0.95, 1.3 / scale);
      ctx.rotate(e.t * 2.4);
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(9, 0);
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 9);
      ctx.moveTo(-6, -6);
      ctx.lineTo(6, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBaseTerrain() {
    const w = world();
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    vecStroke(HOT, 0.14, 1);
    for (let x = -((G.camX | 0) % 48); x < VW + 48; x += 48) {
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(0));
      ctx.lineTo(sx(x), sy(VH));
      ctx.stroke();
    }
    for (let i = 0; i < w.ground.length; i++) {
      const gnd = w.ground[i];
      ctx.fillStyle = rgba(DEEP, 0.92);
      ctx.fillRect(wx(gnd.x), sy(gnd.y), gnd.w * scale, (VH - gnd.y + 8) * scale);
      vecStroke(CYN, 0.85, 1.6);
      ctx.beginPath();
      ctx.moveTo(wx(gnd.x), sy(gnd.y));
      ctx.lineTo(wx(gnd.x + gnd.w), sy(gnd.y));
      ctx.stroke();
      vecStroke(HOT, 0.25, 1);
      for (let x = gnd.x + 12; x < gnd.x + gnd.w; x += 22) {
        ctx.beginPath();
        ctx.moveTo(wx(x), sy(gnd.y));
        ctx.lineTo(wx(x), sy(gnd.y + 10));
        ctx.stroke();
      }
    }
    for (let i = 0; i < w.plats.length; i++) {
      const p = w.plats[i];
      ctx.fillStyle = rgba(HOT, 0.12);
      ctx.fillRect(wx(p.x), sy(p.y), p.w * scale, 8 * scale);
      vecStroke(HOT2, 0.9, 1.4);
      ctx.strokeRect(wx(p.x), sy(p.y), p.w * scale, 8 * scale);
    }
    drawExit(w);
    drawReactor(w);
    ctx.restore();
  }

  function drawExit(w) {
    const x = w.exit;
    const pulse = 0.4 + Math.sin(G.t * 6) * 0.2;
    vecStroke(G.phase === 'escape' ? GOLD : CYN, 0.7 + pulse, 1.6);
    ctx.strokeRect(wx(x - 16), sy(GY - 64), 36 * scale, 64 * scale);
    ctx.fillStyle = rgba(G.phase === 'escape' ? GOLD : CYN, 0.08 + pulse * 0.08);
    ctx.fillRect(wx(x - 16), sy(GY - 64), 36 * scale, 64 * scale);
    ctx.fillStyle = rgba(G.phase === 'escape' ? GOLD : CYN, 0.9);
    ctx.font = '700 ' + Math.max(9, 10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(G.phase === 'escape' ? '逃' : '出', wx(x + 2), sy(GY - 72));
  }

  function drawReactor(w) {
    const x = w.reactor;
    const y = 208;
    const armed = G.phase === 'escape' || G.phase === 'boom';
    const rgb = armed ? MAG : CYN;
    vecStroke(rgb, 0.9, 1.6);
    ctx.strokeRect(wx(x - 18), sy(y - 36), 36 * scale, 72 * scale);
    ctx.save();
    ctx.translate(wx(x), sy(y));
    ctx.rotate(G.t * (armed ? 6 : 1.6));
    vecStroke(armed ? GOLD : HOT2, 0.95, 1.3);
    ctx.beginPath();
    ctx.arc(0, 0, 10 * scale, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8 * scale, 0);
    ctx.lineTo(8 * scale, 0);
    ctx.moveTo(0, -8 * scale);
    ctx.lineTo(0, 8 * scale);
    ctx.stroke();
    ctx.restore();
    const pulse = 0.3 + Math.sin(G.t * (armed ? 12 : 4)) * 0.2;
    ctx.fillStyle = rgba(rgb, 0.12 + pulse * 0.15);
    ctx.beginPath();
    ctx.arc(wx(x), sy(y), (16 + pulse * 8) * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(armed ? GOLD : CYN, 0.9);
    ctx.font = '700 ' + Math.max(9, 10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(armed ? '引爆' : '堆芯', wx(x), sy(y - 48));
  }

  function drawRobot() {
    if (G.mode === 'play' && G.deadT > 0) return;
    if (G.mode === 'play' && G.invuln > 0 && Math.floor(G.t * 18) % 2 === 0) return;
    const p = G.player;
    const sq = p.squash || 1;
    ctx.save();
    ctx.translate(wx(p.x), sy(p.y));
    ctx.scale(scale * (2 - sq), scale * sq);
    const run = p.grounded && Math.abs(p.vx) > 8;
    const leg = run ? Math.sin(G.t * 16) * 5 : 0;
    const arm = run ? Math.sin(G.t * 16) * 4 : 3;
    vecStroke(CYN, 0.95, 1.5 / scale);
    ctx.beginPath();
    ctx.arc(0, -PH + 5, 5, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -PH + 10);
    ctx.lineTo(0, -8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -PH + 14);
    ctx.lineTo(p.facing * (10 + G.muzzle * 18), -PH + 14 + arm * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-5, leg);
    ctx.moveTo(0, -8);
    ctx.lineTo(5, -leg);
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(p.facing * 2, -PH + 5, 1.6, 0, TAU);
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 7);
      ctx.beginPath();
      ctx.arc(p.facing * 14, -PH + 14, 3.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBaseEnemy(e) {
    if (e.k === 'laser') {
      if (!e.on) {
        vecStroke(MAG, 0.18, 1);
        ctx.beginPath();
        ctx.moveTo(wx(e.x), sy(e.y0));
        ctx.lineTo(wx(e.x), sy(e.y1));
        ctx.stroke();
        return;
      }
      ctx.fillStyle = rgba(MAG, 0.18 + Math.sin(G.t * 20) * 0.08);
      ctx.fillRect(wx(e.x - 4), sy(e.y0), 8 * scale, (e.y1 - e.y0) * scale);
      vecStroke(MAG, 0.95, 2);
      ctx.beginPath();
      ctx.moveTo(wx(e.x), sy(e.y0));
      ctx.lineTo(wx(e.x), sy(e.y1));
      ctx.stroke();
      return;
    }
    if (!e.alive) return;
    ctx.save();
    if (e.k === 'walker') {
      ctx.translate(wx(e.x), sy(e.y));
      ctx.scale(scale, scale);
      vecStroke(HOT2, 0.95, 1.3 / scale);
      ctx.strokeRect(-8, -20, 16, 14);
      ctx.beginPath();
      ctx.moveTo(-5, -6);
      ctx.lineTo(-6, 0);
      ctx.moveTo(5, -6);
      ctx.lineTo(6, 0);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-3, -16, 6, 3);
    } else if (e.k === 'drone') {
      ctx.translate(wx(e.x), sy(e.y));
      ctx.scale(scale, scale);
      vecStroke(MAG, 0.95, 1.3 / scale);
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 6, 0, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, TAU);
      ctx.stroke();
    } else {
      ctx.translate(wx(e.x), sy(e.y));
      ctx.scale(scale, scale);
      vecStroke(GOLD, 0.95, 1.3 / scale);
      ctx.strokeRect(-9, -16, 18, 16);
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(0, -22);
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(0, -8, 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = s.cam ? wx(s.x) : sx(s.x);
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(x, sy(s.y), 2.2 * scale, 0, TAU);
      ctx.fill();
      vecStroke(CYN, 0.9, 1.6);
      ctx.beginPath();
      ctx.moveTo(x, sy(s.y));
      ctx.lineTo(x - s.vx * 0.03 * scale, sy(s.y - s.vy * 0.03));
      ctx.stroke();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = s.cam ? wx(s.x) : sx(s.x);
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(x, sy(s.y), 2.4 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      const x = p.cam ? wx(p.x) : sx(p.x);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(x, sy(p.y), p.r * a * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.22;
      const x = s.cam ? wx(s.x) : sx(s.x);
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.6 * scale;
      const r = (6 + s.t * 90) * scale;
      ctx.beginPath();
      ctx.moveTo(x - r, sy(s.y));
      ctx.lineTo(x + r, sy(s.y));
      ctx.moveTo(x, sy(s.y) - r);
      ctx.lineTo(x, sy(s.y) + r);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.46;
      const x = r.cam ? wx(r.x) : sx(r.x);
      ctx.strokeStyle = rgba(r.rgb, a * 0.85);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(x, sy(r.y), (8 + r.t * 96) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      const x = f.cam ? wx(f.x) : sx(f.x);
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = '700 ' + Math.max(11, 13 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(f.text, x, sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.5);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawHudHints() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (inSpace() && G.station >= 1) {
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.font = '700 ' + Math.max(10, 12 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('击坠 ' + G.spaceKills + ' / ' + quotaOf() + '  · 飞入对接湾', sx(16), sy(22));
    } else if (inSpace()) {
      ctx.fillStyle = rgba(HOT2, 0.7);
      ctx.font = '700 ' + Math.max(10, 12 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('击坠 ' + G.spaceKills + ' / ' + quotaOf(), sx(16), sy(22));
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#031018';
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

    if (inSpace() || G.phase === 'enter' || G.mode === 'title') {
      drawBgSpace();
      drawStars();
      drawGrid();
      drawStation();
      for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) drawSpaceEnemy(G.enemies[i]);
      drawShots();
      drawShip();
    } else {
      drawBgBase();
      drawStars();
      drawBaseTerrain();
      for (let i = 0; i < G.enemies.length; i++) drawBaseEnemy(G.enemies[i]);
      drawShots();
      drawRobot();
    }
    drawFx();
    drawHudHints();
    drawFlash();
    ctx.restore();
    drawLetterbox();
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(G.best | 0);
    if (comboVal) comboVal.textContent = '×' + G.mult;
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.combo + ' 连';
      } else comboEl.hidden = true;
    }
    const w = world();
    if (stageLabel) {
      stageLabel.textContent = '第 ' + (G.world + 1) + ' 界 · ' + w.name;
      stageLabel.classList.toggle('hot', G.phase === 'boom');
    }
    if (tagLabel) {
      const tags = { space: '星域', enter: '对接', base: '基地', escape: '撤离', boom: '引爆' };
      tagLabel.textContent = isRush() && G.mode !== 'title' ? '狂奔 · ' + (tags[G.phase] || '星域') : (tags[G.phase] || '星域');
      tagLabel.classList.toggle('warn', G.phase === 'escape');
      tagLabel.classList.toggle('hot', G.phase === 'boom');
    }
    if (timerWrap) {
      const show = G.phase === 'escape' && G.mode === 'play';
      timerWrap.hidden = !show;
      if (show) {
        const r = clamp(G.timer / Math.max(0.01, G.timerMax), 0, 1);
        if (timerBar) timerBar.style.transform = 'scaleX(' + r + ')';
        if (timerNum) timerNum.textContent = String(Math.ceil(G.timer));
        timerWrap.classList.toggle('warn', G.timer < 5);
      }
    }
    while (pips.length < LIFE_CAP) {
      const s = document.createElement('span');
      s.className = 'pip';
      pipsEl.appendChild(s);
      pips.push(s);
    }
    const showN = Math.max(LIVES, G.lives);
    for (let i = 0; i < pips.length; i++) {
      pips[i].style.display = i < showN ? '' : 'none';
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && i < LIVES);
    }
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

  function pointerWorldFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return {
      x: (x - ox) / scale + (inBase() ? G.camX : 0),
      y: (y - oy) / scale,
      sx: (x - ox) / scale,
      sy: (y - oy) / scale
    };
  }

  function applyPointer(e) {
    const p = pointerWorldFromEvent(e);
    pointer.x = inBase() ? p.sx : p.x;
    pointer.y = p.y;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('raid');
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
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (space) {
      if (down) e.preventDefault();
      keys.fire = down;
      keys.jump = down;
    }
    if (!down) {
      if (space) {
        G.fireHold = false;
        keys.fire = false;
        keys.jump = false;
      }
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
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('rush');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        if (k === '2') startGame('rush');
        else primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        playerFire();
      }
    }
  }

  function bindPad(el, on, off) {
    if (!el) return;
    const down = function (e) {
      audio.ensure();
      e.preventDefault();
      on();
      inputSrc = 'key';
    };
    const up = function (e) {
      e.preventDefault();
      off();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', function () { off(); });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      applyPointer(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') {
        playerFire();
        if (inBase()) keys.jump = pointer.y < 110;
      }
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      applyPointer(e);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      G.fireHold = false;
      keys.jump = false;
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
  bindPad(btnLeft, function () { keys.l = true; }, function () { keys.l = false; });
  bindPad(btnRight, function () { keys.r = true; }, function () { keys.r = false; });
  bindPad(btnUp, function () { keys.u = true; }, function () { keys.u = false; });
  bindPad(btnJump, function () { keys.jump = true; keys.u = true; }, function () { keys.jump = false; keys.u = false; });
  bindPad(btnFire, function () { keys.fire = true; G.fireHold = true; playerFire(); }, function () { keys.fire = false; G.fireHold = false; });

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('raid');
    });
  }
  if (btnRush) {
    btnRush.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && G.kind === 'raid') startGame('rush');
      else if (G.mode === 'win') goTitle();
      else startGame('rush');
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
      keys.jump = false;
      keys.fire = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
