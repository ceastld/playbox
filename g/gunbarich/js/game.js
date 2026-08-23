'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const WALL = 16;
  const TOP = 40;
  const COLS = 10;
  const BW = 40;
  const BH = 18;
  const GX = 4;
  const GY = 5;
  const FIELD_L = (VW - (COLS * BW + (COLS - 1) * GX)) / 2;
  const PADDLE_Y = 656;
  const PADDLE_H = 16;
  const PADDLE_W = 78;
  const BALL_R = 6.5;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MAX_ANG = 1.18;
  const COMBO_WIN = 1.18;
  const POWER_CHANCE = 0.15;
  const BEST_KEY = 'playbox-gunbarich-best';
  const MUTE_KEY = 'playbox-gunbarich-mute';
  const OPS = '← → / AD 挡板 · 空格开枪 · ↑/W 发球 · R 重开 · M 静音';
  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 193, 74];
  const HOT = [255, 138, 40];
  const WHT = [255, 244, 232];
  const STEEL = [186, 204, 220];
  const CORE = [255, 72, 64];

  const KIND = {
    '1': { hp: 1, kind: 'glass', ball: 1, shot: 1, score: 50, chip: 0, rgb: HOT },
    '2': { hp: 2, kind: 'hard', ball: 1, shot: 1, score: 80, chip: 20, rgb: MAG },
    S: { hp: 3, kind: 'steel', ball: 2, shot: 1, score: 120, chip: 25, rgb: STEEL },
    B: { hp: 1, kind: 'bomb', ball: 1, shot: 1, score: 90, chip: 0, rgb: GOLD },
    E: { hp: 2, kind: 'gunner', ball: 1, shot: 1, score: 100, chip: 22, rgb: [255, 90, 90] },
    C: { hp: 8, kind: 'core', ball: 1, shot: 1, score: 400, chip: 30, rgb: CORE }
  };

  const STAGES = [
    {
      name: '浅阵',
      sub: 'SHAL',
      map: [
        '0011111100',
        '0111111110',
        '0112221110',
        '0011111100'
      ],
      rain: [
        '1111111111',
        'E1111111E1',
        '1112221111',
        '0111111110',
        '0011EE1100'
      ]
    },
    {
      name: '钢肋',
      sub: 'STEL',
      map: [
        'S1S1S1S1S1',
        '1S1S1S1S1S',
        '1111111111',
        'S1S000S1S1'
      ],
      rain: [
        'S1S1S1S1S1',
        '1S1E1E1S1S',
        'S11111111S',
        '1S1S1S1S1S',
        'E1S000S1E1'
      ]
    },
    {
      name: '爆链',
      sub: 'BOOM',
      map: [
        '1B1B1B1B1B',
        'B1B1B1B1B1',
        '1222222221',
        '1B111111B1'
      ],
      rain: [
        'EB1B1B1B1E',
        'B1B1E1B1B1',
        '1222222221',
        'B11111111B',
        '1E1B1B1E11'
      ]
    },
    {
      name: '堡墙',
      sub: 'WALL',
      boss: true,
      map: [
        'SSSSSSSSSS',
        'S22222222S',
        'S2C2CC2C2S',
        'S22222222S',
        'SS2SSSS2SS'
      ],
      rain: [
        'SSSSSSSSSS',
        'SE222222ES',
        'S2C2CC2C2S',
        'SE222222ES',
        'S2C2CC2C2S',
        'SS2ESEE2SS'
      ]
    }
  ];

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const btnStages = el('btn-stages');
  const btnRain = el('btn-rain');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const btnLeft = el('btn-left');
  const btnRight = el('btn-right');
  const btnFire = el('btn-fire');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const gunLabel = el('gun-label');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const hintEl = el('hint');
  const stageEl = el('stage');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let comboTok = 0;

  const keys = { l: false, r: false, fire: false, launch: false };
  const pointer = { down: false, x: VW * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const floats = [];
  const motes = [];

  const G = {
    mode: 'title',
    kind: 'stages',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    comboMul: 1,
    bricks: [],
    balls: [],
    shots: [],
    rains: [],
    powers: [],
    paddle: { x: VW * 0.5, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H, vx: 0 },
    serving: true,
    ballSpeed: 300,
    cool: 0,
    rapidT: 0,
    spreadT: 0,
    stun: 0,
    muzzle: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    toastT: 0,
    lock: 0,
    stop: 0,
    clearT: 0,
    demoT: 0.6,
    kickT: 0
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
  function rainMode() {
    return G.kind === 'rain';
  }
  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function playing() {
    return G.mode === 'play';
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
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
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
      const n = Math.max(0.03, dur);
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
      this.noise(0.03, 0.028, 1800);
      this.beep(920, 0.045, 'square', 0.03, 420);
    },
    launch() {
      this.ensure();
      this.beep(520, 0.07, 'sine', 0.04, 880);
    },
    paddle() {
      this.ensure();
      this.beep(240, 0.05, 'triangle', 0.045, 420);
    },
    wall() {
      this.ensure();
      this.beep(180, 0.04, 'square', 0.02);
    },
    chip() {
      this.ensure();
      this.beep(640, 0.04, 'triangle', 0.035, 420);
    },
    brick() {
      this.ensure();
      this.noise(0.045, 0.034, 1200);
      this.beep(880, 0.08, 'sine', 0.048, 1400);
    },
    bomb() {
      this.ensure();
      this.noise(0.1, 0.055, 400);
      this.beep(180, 0.14, 'sawtooth', 0.04, 70);
    },
    steel() {
      this.ensure();
      this.beep(320, 0.05, 'square', 0.03, 180);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.08, 'triangle', 0.045, f * 1.5);
    },
    power() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.05, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1175);
    },
    stun() {
      this.ensure();
      this.beep(140, 0.1, 'sawtooth', 0.04, 80);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.16, 'sine', 0.05, 60);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.055);
      this.beep(784, 0.18, 'sine', 0.05);
      this.beep(1046, 0.32, 'triangle', 0.06, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.28, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 784);
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

  function loadMute() {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch (err) {
      return false;
    }
  }

  function addScore(n, plain) {
    if (!playing() || n <= 0) return;
    const v = plain
      ? (n | 0)
      : (n * (rainMode() ? 1.2 : 1) * G.comboMul) | 0;
    if (v <= 0) return;
    G.score += v;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (!scoreBox || !scoreAdd) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + v;
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
    return v;
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.45;
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
    while (pips.length < LIVES) {
      const node = document.createElement('i');
      node.className = 'pip on';
      pipsEl.appendChild(node);
      pips.push(node);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function gunText() {
    const r = G.rapidT > 0;
    const s = G.spreadT > 0;
    if (r && s) return '双技';
    if (r) return '连射';
    if (s) return '散射';
    return '枪';
  }

  function syncComboHud() {
    if (comboEl) comboEl.textContent = '×' + G.comboMul;
    if (!comboBox) return;
    comboBox.classList.toggle('hot', G.combo >= 3);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (gunLabel) {
      gunLabel.textContent = gunText();
      gunLabel.classList.toggle('hot', G.rapidT > 0 || G.spreadT > 0);
      gunLabel.classList.toggle('warn', G.stun > 0);
    }
    if (stageLabel && tagLabel) {
      if (G.mode === 'title') {
        stageLabel.textContent = '砖弹';
        tagLabel.textContent = 'GBAR';
      } else {
        const L = STAGES[G.stage];
        stageLabel.textContent = (rainMode() ? '弹雨' : '砖阵') + ' ' + (G.stage + 1);
        tagLabel.textContent = L ? (L.boss ? '堡墙' : L.name) : '';
      }
      const win = G.mode === 'win';
      const lose = G.mode === 'lose';
      stageLabel.classList.toggle('hot', win);
      tagLabel.classList.toggle('hot', win);
      tagLabel.classList.toggle('warn', lose);
    }
    syncComboHud();
    syncPips();
  }

  function showOverlay(kind, title, lead, again, showMenu, start) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) {
      ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'MISS' : 'GBAR';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', !start);
    if (ovEnd) ovEnd.classList.toggle('gone', !!start);
    if (ovAgain) ovAgain.textContent = again || '再来';
    if (ovMenu) ovMenu.classList.toggle('gone', !showMenu);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(t) {
    if (REDUCE) return;
    if (t > G.stop) G.stop = t;
  }

  function shake(n) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, n);
  }

  function kickBoard() {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove('kick');
    void stageEl.offsetWidth;
    stageEl.classList.add('kick');
  }

  function dieBoard() {
    if (!stageEl) return;
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    if (!REDUCE) stageEl.classList.add('die');
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 5);
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.45, spec.j * 0.45),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.65, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb || HOT
      });
    }
  }

  function popSpark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb || GOLD });
    if (sparks.length > 20) sparks.shift();
  }

  function popFloat(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, text: text, rgb: rgb || GOLD });
    if (floats.length > 18) floats.shift();
  }

  function brickPos(c, y) {
    return { x: FIELD_L + c * (BW + GX), y: y };
  }

  function makeBrick(c, y, ch, row) {
    const spec = KIND[ch] || KIND['1'];
    const hp = spec.kind === 'core' && rainMode() ? spec.hp + 2 : spec.hp;
    const p = brickPos(c, y);
    return {
      x: p.x,
      y: y,
      w: BW,
      h: BH,
      hp: hp,
      max: hp,
      kind: spec.kind,
      ball: spec.ball,
      shot: spec.shot,
      score: spec.score,
      chip: spec.chip,
      rgb: spec.rgb,
      row: row || 0,
      flash: 0,
      squash: 0,
      fireT: rand(0.4, 1.6),
      gem: spec.kind !== 'core' && Math.random() < POWER_CHANCE
    };
  }

  function buildStage(idx) {
    const L = STAGES[idx];
    G.bricks = [];
    G.powers = [];
    G.rains = [];
    G.shots = [];
    if (!L) return;
    const map = rainMode() ? L.rain : L.map;
    for (let r = 0; r < map.length; r++) {
      const line = map[r];
      for (let c = 0; c < line.length && c < COLS; c++) {
        const ch = line.charAt(c);
        if (ch === '0' || ch === ' ') continue;
        G.bricks.push(makeBrick(c, TOP + r * (BH + GY), ch, r));
      }
    }
  }

  function makeBall(x, y, vx, vy) {
    return {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: BALL_R,
      dead: false,
      trail: []
    };
  }

  function paddleHalf() {
    return G.paddle.w * 0.5;
  }

  function paddleBounds() {
    const half = paddleHalf();
    return { lo: WALL + half + 2, hi: VW - WALL - half - 2 };
  }

  function stickServe() {
    const b = G.balls[0];
    if (!b) return;
    b.x = G.paddle.x;
    b.y = G.paddle.y - G.paddle.h * 0.5 - 14 - b.r;
    b.vx = 0;
    b.vy = 0;
    b.dead = false;
  }

  function serve() {
    G.serving = true;
    G.balls = [makeBall(G.paddle.x, G.paddle.y - 28, 0, 0)];
    stickServe();
    G.lock = 0.16;
    G.shots = [];
  }

  function launch() {
    if (!G.serving) return;
    if (G.lock > 0) return;
    const b = G.balls[0];
    if (!b) return;
    G.serving = false;
    const dir = G.paddle.vx !== 0 ? (G.paddle.vx < 0 ? -1 : 1) : (Math.random() < 0.5 ? -1 : 1);
    const ang = (0.2 + Math.random() * 0.28) * dir;
    const spd = G.ballSpeed;
    b.vx = Math.sin(ang) * spd;
    b.vy = -Math.cos(ang) * spd;
    if (playing()) audio.launch();
  }

  function comboMulOf(n) {
    return 1 + Math.min(4, Math.floor(Math.max(0, n - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = comboMulOf(G.combo);
    if (next > G.comboMul) {
      G.comboMul = next;
      audio.combo(G.combo);
      kickBoard();
      if (comboBox) {
        comboBox.classList.remove('hot');
        void comboBox.offsetWidth;
        comboBox.classList.add('hot');
      }
      comboTok += 1;
    } else {
      G.comboMul = next;
    }
    if (G.combo > 1 && G.combo % 3 === 0) {
      popFloat(G.paddle.x, G.paddle.y - 56, G.combo + ' 链', MAG);
      audio.combo(G.combo);
    }
    syncComboHud();
  }

  function resetCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.comboMul = 1;
    syncComboHud();
  }

  function resetRunCommon() {
    particles.length = 0;
    sparks.length = 0;
    floats.length = 0;
    G.lives = LIVES;
    G.score = 0;
    resetCombo();
    G.rapidT = 0;
    G.spreadT = 0;
    G.stun = 0;
    G.cool = 0;
    G.muzzle = 0;
    G.paddle.w = PADDLE_W;
    G.paddle.x = VW * 0.5;
    G.paddle.vx = 0;
    G.powers = [];
    G.shots = [];
    G.rains = [];
    G.flash = 0;
    G.shake = 0;
    G.stop = 0;
    G.clearT = 0;
    if (scoreEl) scoreEl.textContent = '0';
    if (scoreAdd) scoreAdd.hidden = true;
  }

  function stageSpeed() {
    const base = rainMode() ? 328 : 292;
    return Math.min(430, base + G.stage * 22);
  }

  function startRun(kind) {
    resetRunCommon();
    G.kind = kind === 'rain' ? 'rain' : 'stages';
    G.stage = 0;
    G.mode = 'play';
    G.ballSpeed = stageSpeed();
    buildStage(0);
    hideOverlay();
    serve();
    const L = STAGES[0];
    toast((rainMode() ? '弹雨 · ' : '') + L.name, false, true);
    setHint(rainMode() ? '砖更密，炮砖会往下打弹' : '空格开枪 · 接住球 · 钢砖要球砸', '');
    syncHud();
    audio.start();
    if (canvas && canvas.focus) canvas.focus();
  }

  function restart() {
    if (G.mode === 'title') {
      startRun('stages');
      return;
    }
    startRun(G.kind);
  }

  function bootTitle() {
    resetRunCommon();
    G.mode = 'title';
    G.kind = 'stages';
    G.stage = 0;
    G.ballSpeed = 270;
    buildStage(0);
    G.lives = LIVES;
    serve();
    G.demoT = 0.7;
    showOverlay(
      'title',
      '砖弹',
      '挡板接球打砖，空格开枪碎砖。钢砖要球砸，爆砖会连锁。短关之后是堡墙。漏球丢命。',
      '再来',
      false,
      true
    );
    setHint('← → / AD 挡板 · 空格开枪 · ↑/W 发球 · 漏球丢命', '');
    syncHud();
  }

  function gotoNext() {
    G.stage += 1;
    const L = STAGES[G.stage];
    G.ballSpeed = stageSpeed();
    G.rapidT = Math.min(G.rapidT, 2.2);
    G.spreadT = Math.min(G.spreadT, 2.2);
    G.powers = [];
    G.shots = [];
    G.rains = [];
    G.stop = 0;
    G.clearT = 0;
    buildStage(G.stage);
    G.mode = 'play';
    hideOverlay();
    serve();
    toast((L.boss ? '堡墙' : L.name), false, true);
    setHint(L.boss ? '打穿堡墙' : '第 ' + (G.stage + 1) + ' 关 · ' + L.name, 'hot');
    syncHud();
    audio.start();
  }

  function winStage() {
    const last = G.stage >= STAGES.length - 1;
    const bonus = last ? (rainMode() ? 2200 : 1800) : 500;
    addScore(Math.round(bonus * (rainMode() && !last ? 1.2 : 1)), true);
    G.mode = 'win';
    G.serving = true;
    audio.win();
    G.flash = 0.48;
    G.flashRgb = GOLD;
    kickBoard();
    const L = STAGES[G.stage];
    if (last) {
      showOverlay(
        'win',
        rainMode() ? '弹雨通关' : '墙倒了',
        (rainMode() ? '弹雨堡墙打穿了。' : '四关都清了，堡墙倒了。') + '得分 ' + G.score + '。',
        '再来',
        true,
        false
      );
      setHint(rainMode() ? '弹雨通关' : '墙倒了', 'hot');
    } else {
      showOverlay(
        'win',
        '清阵了',
        (L.boss ? '堡墙' : L.name) + '清了。得分 ' + G.score + '。',
        '下一关',
        true,
        false
      );
      setHint('清阵了', 'hot');
    }
    syncHud();
  }

  function loseRun() {
    G.mode = 'lose';
    G.serving = true;
    audio.lose();
    G.flash = 0.5;
    G.flashRgb = MAG;
    shake(10);
    dieBoard();
    showOverlay('lose', '球漏了', '球漏下去了。得分 ' + G.score + '。', '再来', true, false);
    setHint('球漏了', 'warn');
    syncHud();
  }

  function missLife() {
    if (!playing()) {
      serve();
      G.demoT = 0.8;
      return;
    }
    G.lives -= 1;
    G.powers = [];
    G.shots = [];
    G.rains = [];
    resetCombo();
    G.stun = 0;
    shake(7);
    G.flash = 0.22;
    G.flashRgb = MAG;
    dieBoard();
    syncPips();
    audio.miss();
    if (G.lives <= 0) {
      loseRun();
      return;
    }
    toast('还剩 ' + G.lives + ' 命', true, false);
    serve();
  }

  function applyRapid() {
    G.rapidT = 8.5;
    toast('连射', false, true);
    audio.power();
    syncHud();
  }

  function applySpread() {
    G.spreadT = 8.5;
    toast('散射', false, true);
    audio.power();
    syncHud();
  }

  function dropPower(br) {
    if (!playing()) return;
    if (!br.gem) return;
    if (G.powers.length >= 2) return;
    G.powers.push({
      kind: Math.random() < 0.5 ? 'rapid' : 'spread',
      x: br.x + br.w * 0.5,
      y: br.y + br.h * 0.5,
      vy: 96,
      w: 36,
      h: 16
    });
  }

  function maxShots() {
    let n = rainMode() ? 9 : 7;
    if (G.rapidT > 0) n += 5;
    if (G.spreadT > 0) n += 3;
    return n;
  }

  function fireCool() {
    let t = rainMode() ? 0.1 : 0.118;
    if (G.rapidT > 0) t = 0.052;
    return t;
  }

  function tryFire() {
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.stun > 0) return;
    if (G.cool > 0) return;
    if (G.shots.length >= maxShots()) return;
    const p = G.paddle;
    const y = p.y - p.h * 0.5 - 18;
    const spd = rainMode() ? 680 : 640;
    const mk = function (x, vx) {
      if (G.shots.length >= maxShots()) return;
      G.shots.push({
        x: x,
        y: y,
        w: 3.4,
        h: 11,
        vx: vx || 0,
        vy: -spd,
        dead: false
      });
    };
    if (G.spreadT > 0) {
      mk(p.x, 0);
      mk(p.x - 6, -150);
      mk(p.x + 6, 150);
    } else {
      mk(p.x, 0);
    }
    G.cool = fireCool();
    G.muzzle = 0.08;
    if (playing() || G.mode === 'title') audio.shoot();
    emit(4, {
      x: p.x, y: y, j: 4,
      vx0: -40, vx1: 40, vy0: -180, vy1: -40,
      life: 0.18, r0: 0.7, r1: 1.8, rgb: GOLD
    });
  }

  function circleRect(b, r) {
    const cx = clamp(b.x, r.x, r.x + r.w);
    const cy = clamp(b.y, r.y, r.y + r.h);
    const dx = b.x - cx;
    const dy = b.y - cy;
    return dx * dx + dy * dy < b.r * b.r;
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function bounceBrick(b, br) {
    const closestX = clamp(b.x, br.x, br.x + br.w);
    const closestY = clamp(b.y, br.y, br.y + br.h);
    let dx = b.x - closestX;
    let dy = b.y - closestY;
    if (dx === 0 && dy === 0) {
      const left = b.x - br.x;
      const right = br.x + br.w - b.x;
      const top = b.y - br.y;
      const bot = br.y + br.h - b.y;
      const m = Math.min(left, right, top, bot);
      if (m === left) {
        b.x = br.x - b.r - 0.4;
        b.vx = -Math.abs(b.vx);
      } else if (m === right) {
        b.x = br.x + br.w + b.r + 0.4;
        b.vx = Math.abs(b.vx);
      } else if (m === top) {
        b.y = br.y - b.r - 0.4;
        b.vy = -Math.abs(b.vy);
      } else {
        b.y = br.y + br.h + b.r + 0.4;
        b.vy = Math.abs(b.vy);
      }
      return;
    }
    const dist = hypot(dx, dy) || 1;
    const overlap = b.r - dist;
    const nx = dx / dist;
    const ny = dy / dist;
    b.x += nx * (overlap + 0.5);
    b.y += ny * (overlap + 0.5);
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= 2 * vn * nx;
      b.vy -= 2 * vn * ny;
    }
  }

  function keepAngle(b) {
    const spd = Math.max(G.ballSpeed * 0.92, hypot(b.vx, b.vy));
    const minVy = spd * 0.3;
    if (Math.abs(b.vy) < minVy) {
      b.vy = (b.vy < 0 ? -1 : 1) * minVy;
    }
    const n = hypot(b.vx, b.vy) || 1;
    b.vx = b.vx / n * spd;
    b.vy = b.vy / n * spd;
  }

  function bouncePaddle(b) {
    const p = G.paddle;
    let off = (b.x - p.x) / paddleHalf();
    off = clamp(off, -1, 1);
    const ang = off * MAX_ANG;
    const spd = Math.max(G.ballSpeed, hypot(b.vx, b.vy));
    b.vx = Math.sin(ang) * spd;
    b.vy = -Math.cos(ang) * spd;
    b.y = p.y - p.h * 0.5 - 10 - b.r - 0.4;
    if (playing()) audio.paddle();
    emit(5, {
      x: b.x, y: b.y + 4, j: 8,
      vx0: -40, vx1: 40, vy0: -80, vy1: -10,
      life: 0.28, r0: 0.7, r1: 1.8, rgb: CYN
    });
  }

  function paddleHit(b) {
    if (b.vy <= 0) return false;
    const p = G.paddle;
    const half = paddleHalf();
    const top = p.y - p.h * 0.5 - 8;
    if (b.y + b.r < top - 2) return false;
    if (b.y > p.y + p.h * 0.5 + 8) return false;
    if (b.x + b.r < p.x - half) return false;
    if (b.x - b.r > p.x + half) return false;
    return true;
  }

  function pruneBricks() {
    const live = [];
    for (let i = 0; i < G.bricks.length; i++) {
      if (G.bricks[i].hp > 0) live.push(G.bricks[i]);
    }
    G.bricks = live;
  }

  function explodeAt(x, y, src) {
    if (playing()) audio.bomb();
    hitStop(0.072);
    shake(7);
    popSpark(x, y, GOLD);
    emit(22, {
      x: x, y: y, j: 18,
      vx0: -220, vx1: 220, vy0: -240, vy1: 80,
      life: 0.5, r0: 1.2, r1: 3.6, rgb: GOLD
    });
    const R = 58;
    const R2 = R * R;
    for (let i = 0; i < G.bricks.length; i++) {
      const br = G.bricks[i];
      if (br === src || br.hp <= 0) continue;
      const cx = br.x + br.w * 0.5;
      const cy = br.y + br.h * 0.5;
      const dx = cx - x;
      const dy = cy - y;
      if (dx * dx + dy * dy <= R2) damageBrick(br, 2, 'bomb');
    }
  }

  function damageBrick(br, dmg, src) {
    if (!br || br.hp <= 0) return;
    br.hp -= dmg;
    br.flash = 0.11;
    br.squash = 1;
    const cx = br.x + br.w * 0.5;
    const cy = br.y + br.h * 0.5;
    bumpCombo();
    if (br.hp > 0) {
      const gained = addScore(br.chip || 18);
      if (playing()) {
        if (br.kind === 'steel') audio.steel();
        else audio.chip();
      }
      hitStop(src === 'ball' ? 0.038 : 0.03);
      emit(6, {
        x: cx, y: cy, j: 10,
        vx0: -90, vx1: 90, vy0: -100, vy1: 40,
        life: 0.3, r0: 0.8, r1: 2.2, rgb: br.rgb
      });
      if (gained) popFloat(cx, cy - 6, '+' + gained, br.rgb);
      return;
    }
    const gained = addScore(br.score);
    if (playing()) {
      if (br.kind === 'bomb') { /* explode sfx later */ }
      else if (br.kind === 'core') audio.brick();
      else audio.brick();
    }
    hitStop(br.kind === 'core' ? 0.078 : br.kind === 'bomb' ? 0.055 : 0.052);
    shake(br.kind === 'core' ? 8 : 4);
    popSpark(cx, cy, br.rgb);
    emit(br.kind === 'core' ? 22 : 14, {
      x: cx, y: cy, j: 14,
      vx0: -160, vx1: 160, vy0: -180, vy1: 50,
      life: 0.44, r0: 1, r1: 3.4, rgb: br.rgb
    });
    if (gained) popFloat(cx, cy - 4, '+' + gained, GOLD);
    dropPower(br);
    if (br.kind === 'bomb') explodeAt(cx, cy, br);
  }

  function moveBall(b, dt) {
    const dist = hypot(b.vx, b.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / 4));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      if (b.dead) return;
      b.x += b.vx * h;
      b.y += b.vy * h;

      if (b.x - b.r < WALL) {
        b.x = WALL + b.r;
        b.vx = Math.abs(b.vx);
        if (playing()) audio.wall();
      } else if (b.x + b.r > VW - WALL) {
        b.x = VW - WALL - b.r;
        b.vx = -Math.abs(b.vx);
        if (playing()) audio.wall();
      }
      if (b.y - b.r < TOP - 22) {
        b.y = TOP - 22 + b.r;
        b.vy = Math.abs(b.vy);
        if (playing()) audio.wall();
      }

      if (paddleHit(b)) {
        bouncePaddle(b);
        keepAngle(b);
        continue;
      }

      let hit = -1;
      let best = 1e9;
      for (let i = 0; i < G.bricks.length; i++) {
        const br = G.bricks[i];
        if (br.hp <= 0) continue;
        if (!circleRect(b, br)) continue;
        const dx = b.x - (br.x + br.w * 0.5);
        const dy = b.y - (br.y + br.h * 0.5);
        const d2 = dx * dx + dy * dy;
        if (d2 < best) {
          best = d2;
          hit = i;
        }
      }
      if (hit >= 0) {
        const br = G.bricks[hit];
        bounceBrick(b, br);
        keepAngle(b);
        damageBrick(br, br.ball, 'ball');
      }

      if (b.y - b.r > VH + 10) b.dead = true;
    }
  }

  function moveShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y + s.h < TOP - 30 || s.x < WALL - 8 || s.x > VW - WALL + 8) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = -1;
      for (let k = 0; k < G.bricks.length; k++) {
        const br = G.bricks[k];
        if (br.hp <= 0) continue;
        if (aabb(s.x - s.w * 0.5, s.y, s.w, s.h, br.x, br.y, br.w, br.h)) {
          hit = k;
          break;
        }
      }
      if (hit >= 0) {
        const br = G.bricks[hit];
        damageBrick(br, br.shot, 'shot');
        emit(3, {
          x: s.x, y: s.y, j: 4,
          vx0: -40, vx1: 40, vy0: 20, vy1: 80,
          life: 0.18, r0: 0.6, r1: 1.6, rgb: GOLD
        });
        G.shots.splice(i, 1);
        continue;
      }
      for (let r = G.rains.length - 1; r >= 0; r--) {
        const p = G.rains[r];
        const dx = s.x - p.x;
        const dy = s.y + s.h * 0.5 - p.y;
        if (dx * dx + dy * dy < (p.r + 4) * (p.r + 4)) {
          G.rains.splice(r, 1);
          G.shots.splice(i, 1);
          if (playing()) addScore(12);
          popSpark(p.x, p.y, MAG);
          emit(6, {
            x: p.x, y: p.y, j: 6,
            vx0: -80, vx1: 80, vy0: -60, vy1: 40,
            life: 0.24, r0: 0.7, r1: 1.8, rgb: MAG
          });
          break;
        }
      }
    }
  }

  function gunnerFire(br) {
    if (!rainMode() || !playing()) return;
    G.rains.push({
      x: br.x + br.w * 0.5,
      y: br.y + br.h + 4,
      r: 4.2,
      vy: 168 + G.stage * 12,
      vx: clamp((G.paddle.x - (br.x + br.w * 0.5)) * 0.22, -70, 70)
    });
  }

  function moveRain(dt) {
    const p = G.paddle;
    const half = paddleHalf();
    const top = p.y - p.h * 0.5 - 6;
    for (let i = G.rains.length - 1; i >= 0; i--) {
      const r = G.rains[i];
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      if (r.y > VH + 12) {
        G.rains.splice(i, 1);
        continue;
      }
      for (let b = 0; b < G.balls.length; b++) {
        const ball = G.balls[b];
        if (ball.dead) continue;
        const dx = ball.x - r.x;
        const dy = ball.y - r.y;
        if (dx * dx + dy * dy < (ball.r + r.r) * (ball.r + r.r)) {
          ball.vx += (dx >= 0 ? 1 : -1) * 70;
          keepAngle(ball);
          G.rains.splice(i, 1);
          emit(5, {
            x: r.x, y: r.y, j: 5,
            vx0: -60, vx1: 60, vy0: -40, vy1: 40,
            life: 0.2, r0: 0.6, r1: 1.6, rgb: MAG
          });
          r._gone = true;
          break;
        }
      }
      if (r._gone) continue;
      if (r.y + r.r > top && r.y - r.r < p.y + p.h * 0.5 && r.x > p.x - half && r.x < p.x + half) {
        G.rains.splice(i, 1);
        G.stun = 0.28;
        G.cool = Math.max(G.cool, 0.2);
        shake(5);
        G.flash = 0.12;
        G.flashRgb = MAG;
        if (playing()) audio.stun();
        emit(8, {
          x: r.x, y: r.y, j: 8,
          vx0: -90, vx1: 90, vy0: -70, vy1: 20,
          life: 0.28, r0: 0.8, r1: 2, rgb: MAG
        });
      }
    }
  }

  function collectPower(p) {
    const half = paddleHalf();
    const top = G.paddle.y - G.paddle.h * 0.5 - 8;
    const left = G.paddle.x - half;
    const right = G.paddle.x + half;
    const px0 = p.x - p.w * 0.5;
    const px1 = p.x + p.w * 0.5;
    const py0 = p.y - p.h * 0.5;
    const py1 = p.y + p.h * 0.5;
    if (px1 < left || px0 > right) return false;
    if (py1 < top || py0 > G.paddle.y + G.paddle.h * 0.5 + 8) return false;
    return true;
  }

  function bricksLeft() {
    for (let i = 0; i < G.bricks.length; i++) {
      if (G.bricks[i].hp > 0) return true;
    }
    return false;
  }

  function updatePaddle(dt) {
    const spd = (G.stun > 0 ? 210 : 430);
    let vx = 0;
    if (keys.l) vx -= spd;
    if (keys.r) vx += spd;
    if (pointer.down || pointer.id != null) {
      const target = pointer.x;
      const dx = target - G.paddle.x;
      vx = clamp(dx / Math.max(dt, 0.008), -720, 720);
    }
    G.paddle.vx = vx;
    G.paddle.x += vx * dt;
    const b = paddleBounds();
    if (G.paddle.x < b.lo) {
      G.paddle.x = b.lo;
      G.paddle.vx *= 0.2;
    } else if (G.paddle.x > b.hi) {
      G.paddle.x = b.hi;
      G.paddle.vx *= 0.2;
    }
  }

  function updateFx(dt) {
    G.shake *= Math.exp(-dt * 9);
    G.flash = Math.max(0, G.flash - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.kickT = Math.max(0, G.kickT - dt);
    if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    for (let i = 0; i < G.bricks.length; i++) {
      const br = G.bricks[i];
      br.flash = Math.max(0, br.flash - dt);
      br.squash = Math.max(0, br.squash - dt * 7);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += 420 * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.2);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.42) sparks.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].t += dt;
      if (floats[i].t > 0.7) floats.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y += Math.sin(G.t * 0.6 + m.p) * 4 * dt;
    }
  }

  function recordTrails() {
    if (REDUCE) return;
    for (let i = 0; i < G.balls.length; i++) {
      const b = G.balls[i];
      if (b.dead) continue;
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 8) b.trail.shift();
    }
  }

  function demoTick(dt) {
    G.demoT -= dt;
    if (!bricksLeft()) {
      buildStage(0);
      serve();
      G.demoT = 0.7;
      return;
    }
    const b = G.balls[0];
    if (b && !G.serving) {
      pointer.x = lerp(pointer.x, b.x, 0.12);
      G.paddle.x = lerp(G.paddle.x, clamp(b.x, paddleBounds().lo, paddleBounds().hi), 0.18);
    }
    if (G.serving && G.demoT <= 0 && G.lock <= 0) {
      launch();
      G.demoT = 0.4;
    }
    if (!G.serving && G.demoT <= 0) {
      tryFire();
      G.demoT = 0.16;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    G.lock = Math.max(0, G.lock - dt);
    G.cool = Math.max(0, G.cool - dt);
    G.stun = Math.max(0, G.stun - dt);
    if (G.rapidT > 0) {
      G.rapidT = Math.max(0, G.rapidT - dt);
      if (G.rapidT <= 0) syncHud();
    }
    if (G.spreadT > 0) {
      G.spreadT = Math.max(0, G.spreadT - dt);
      if (G.spreadT <= 0) syncHud();
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) resetCombo();
    }

    updatePaddle(dt);
    if (G.serving) stickServe();

    const wantFire = keys.fire || pointer.down;
    if (wantFire && (G.mode === 'play' || G.mode === 'title') && !(overlayOpen() && G.mode !== 'play')) {
      tryFire();
      if (G.serving && G.mode === 'play' && G.lock <= 0) launch();
    }
    if (keys.launch && G.serving && G.mode === 'play' && G.lock <= 0) launch();

    if (G.mode === 'title') {
      demoTick(dt);
      if (!G.serving) {
        for (let i = 0; i < G.balls.length; i++) moveBall(G.balls[i], dt);
        const live = [];
        for (let i = 0; i < G.balls.length; i++) if (!G.balls[i].dead) live.push(G.balls[i]);
        G.balls = live;
        if (G.balls.length === 0) {
          serve();
          G.demoT = 0.5;
        }
      }
      moveShots(dt);
      pruneBricks();
      recordTrails();
      updateFx(dt);
      return;
    }

    if (G.mode === 'win' || G.mode === 'lose') {
      updateFx(dt);
      return;
    }

    moveShots(dt);
    moveRain(dt);

    if (!G.serving) {
      for (let i = 0; i < G.balls.length; i++) moveBall(G.balls[i], dt);
      const live = [];
      for (let i = 0; i < G.balls.length; i++) if (!G.balls[i].dead) live.push(G.balls[i]);
      G.balls = live;
    }

    if (rainMode() && playing()) {
      for (let i = 0; i < G.bricks.length; i++) {
        const br = G.bricks[i];
        if (br.kind !== 'gunner' || br.hp <= 0) continue;
        br.fireT -= dt;
        if (br.fireT <= 0) {
          gunnerFire(br);
          br.fireT = Math.max(0.85, 1.55 - G.stage * 0.12);
        }
      }
    }

    for (let i = G.powers.length - 1; i >= 0; i--) {
      const p = G.powers[i];
      p.y += p.vy * dt;
      if (collectPower(p)) {
        addScore(30);
        if (p.kind === 'rapid') applyRapid();
        else applySpread();
        G.powers.splice(i, 1);
        continue;
      }
      if (p.y - p.h > VH) G.powers.splice(i, 1);
    }

    pruneBricks();
    recordTrails();

    if (playing() && !bricksLeft()) {
      G.clearT += dt;
      if (G.clearT >= 0.28) {
        winStage();
        updateFx(dt);
        return;
      }
    } else {
      G.clearT = 0;
      if (playing() && !G.serving && G.balls.length === 0) {
        missLife();
        updateFx(dt);
        return;
      }
    }

    updateFx(dt);
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawBrick(c, br) {
    const sq = br.squash;
    const cx = br.x + br.w * 0.5;
    const cy = br.y + br.h * 0.5;
    const w = br.w * (1 - sq * 0.16);
    const h = br.h * (1 + sq * 0.18);
    const x = cx - w * 0.5;
    const y = cy - h * 0.5;
    const rgb = br.rgb;
    const a = br.hp <= 0 ? 0 : 1;
    if (a <= 0) return;
    c.save();
    if (br.kind === 'core') {
      const pulse = 0.55 + Math.sin(G.t * 6) * 0.2;
      c.shadowColor = rgba(rgb, pulse);
      c.shadowBlur = 16 * scale;
    }
    roundRect(c, sx(x), sy(y), w * scale, h * scale, 4 * scale);
    const g = c.createLinearGradient(sx(x), sy(y), sx(x), sy(y + h));
    g.addColorStop(0, rgba(rgb, br.flash > 0 ? 1 : 0.95));
    g.addColorStop(1, rgba(rgb, 0.55));
    c.fillStyle = g;
    c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = rgba(WHT, br.kind === 'steel' ? 0.45 : 0.22);
    c.lineWidth = Math.max(1, 1.1 * scale);
    c.stroke();
    if (br.kind === 'steel') {
      c.fillStyle = 'rgba(255,255,255,0.22)';
      c.fillRect(sx(x + 4), sy(y + 3), (w - 8) * scale, 2.2 * scale);
    }
    if (br.kind === 'bomb') {
      c.fillStyle = rgba(HOT, 0.95);
      c.beginPath();
      c.arc(sx(cx), sy(cy + 1), 3.2 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.moveTo(sx(cx + 2), sy(cy - 3));
      c.lineTo(sx(cx + 5), sy(cy - 7));
      c.stroke();
    }
    if (br.kind === 'gunner') {
      c.fillStyle = rgba(MAG, 0.9);
      c.fillRect(sx(cx - 1.4), sy(y + h - 2), 2.8 * scale, 5 * scale);
    }
    if (br.max > 1) {
      const ratio = br.hp / br.max;
      c.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(c, sx(x + 5), sy(y + h - 5), (w - 10) * scale, 2.4 * scale, 1 * scale);
      c.fill();
      c.fillStyle = rgba(WHT, 0.85);
      c.fillRect(sx(x + 5), sy(y + h - 5), (w - 10) * ratio * scale, 2.4 * scale);
    }
    c.restore();
  }

  function drawCannon(c) {
    const p = G.paddle;
    const x = p.x;
    const y = p.y;
    const w = p.w;
    const h = p.h;
    const stunned = G.stun > 0 && ((G.t * 18) | 0) % 2 === 0;
    c.save();
    c.fillStyle = rgba(HOT, 0.85);
    roundRect(c, sx(x - w * 0.5), sy(y - h * 0.15), w * scale, h * 0.7 * scale, 6 * scale);
    c.fill();
    c.fillStyle = rgba(GOLD, stunned ? 0.35 : 0.92);
    roundRect(c, sx(x - w * 0.32), sy(y - h * 0.85), w * 0.64 * scale, h * 0.9 * scale, 5 * scale);
    c.fill();
    c.fillStyle = rgba(CYN, 0.85);
    roundRect(c, sx(x - 10), sy(y - h * 0.72), 20 * scale, 7 * scale, 3 * scale);
    c.fill();
    const barrelH = 16 + (G.muzzle > 0 ? 3 : 0);
    c.fillStyle = rgba(WHT, 0.9);
    roundRect(c, sx(x - 3.2), sy(y - h * 0.85 - barrelH), 6.4 * scale, barrelH * scale, 2 * scale);
    c.fill();
    if (G.muzzle > 0) {
      const m = G.muzzle / 0.08;
      c.fillStyle = rgba(GOLD, 0.85 * m);
      c.beginPath();
      c.arc(sx(x), sy(y - h * 0.85 - barrelH - 2), (7 + m * 6) * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9 * m);
      c.beginPath();
      c.arc(sx(x), sy(y - h * 0.85 - barrelH - 2), (3 + m * 2) * scale, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(HOT, 0.7);
    c.fillRect(sx(x - w * 0.46), sy(y + 2), 8 * scale, 5 * scale);
    c.fillRect(sx(x + w * 0.46 - 8), sy(y + 2), 8 * scale, 5 * scale);
    c.restore();
  }

  function drawBall(c, b) {
    if (!REDUCE) {
      for (let i = 0; i < b.trail.length; i++) {
        const t = b.trail[i];
        const a = (i + 1) / (b.trail.length + 1) * 0.28;
        c.fillStyle = rgba(CYN, a);
        c.beginPath();
        c.arc(sx(t.x), sy(t.y), b.r * scale * (0.4 + a), 0, TAU);
        c.fill();
      }
    }
    c.fillStyle = rgba(WHT, 1);
    c.beginPath();
    c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(CYN, 0.85);
    c.lineWidth = 1.4 * scale;
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.beginPath();
    c.arc(sx(b.x - 1.6), sy(b.y - 1.8), 1.8 * scale, 0, TAU);
    c.fill();
  }

  function draw() {
    if (!ctx) return;
    const shx = G.shake ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake ? rand(-G.shake * 0.5, G.shake * 0.5) : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#12080a';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(shx, shy);

    ctx.fillStyle = '#1a0c10';
    ctx.fillRect(sx(WALL), sy(TOP - 22), (VW - WALL * 2) * scale, (VH - (TOP - 22) - 8) * scale);

    ctx.strokeStyle = 'rgba(255,138,40,0.18)';
    ctx.lineWidth = 3 * scale;
    roundRect(ctx, sx(WALL - 2), sy(TOP - 24), (VW - WALL * 2 + 4) * scale, (VH - (TOP - 24) - 6) * scale, 10 * scale);
    ctx.stroke();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgba(m.rgb, 0.12);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < G.bricks.length; i++) drawBrick(ctx, G.bricks[i]);

    for (let i = 0; i < G.powers.length; i++) {
      const p = G.powers[i];
      const rgb = p.kind === 'rapid' ? GOLD : CYN;
      roundRect(ctx, sx(p.x - p.w * 0.5), sy(p.y - p.h * 0.5), p.w * scale, p.h * scale, 6 * scale);
      ctx.fillStyle = rgba(rgb, 0.9);
      ctx.fill();
      ctx.fillStyle = '#12080a';
      ctx.font = '700 ' + Math.max(9, 10 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.kind === 'rapid' ? '连' : '散', sx(p.x), sy(p.y + 0.5));
    }

    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(GOLD, 0.95);
      roundRect(ctx, sx(s.x - s.w * 0.5), sy(s.y), s.w * scale, s.h * scale, 1.4 * scale);
      ctx.fill();
      if (!REDUCE) {
        ctx.fillStyle = rgba(HOT, 0.35);
        ctx.fillRect(sx(s.x - 1), sy(s.y + s.h), 2 * scale, 8 * scale);
      }
    }

    for (let i = 0; i < G.rains.length; i++) {
      const r = G.rains[i];
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.moveTo(sx(r.x), sy(r.y - r.r));
      ctx.lineTo(sx(r.x + r.r), sy(r.y));
      ctx.lineTo(sx(r.x), sy(r.y + r.r));
      ctx.lineTo(sx(r.x - r.r), sy(r.y));
      ctx.closePath();
      ctx.fill();
    }

    for (let i = 0; i < G.balls.length; i++) {
      if (!G.balls[i].dead) drawBall(ctx, G.balls[i]);
    }

    drawCannon(ctx);

    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      ctx.fillStyle = rgba(q.rgb, Math.max(0, q.life / q.max));
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = 1 - s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, k);
      ctx.lineWidth = 2 * scale;
      const rad = (8 + s.t * 46) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), rad, 0, TAU);
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const k = 1 - f.t / 0.7;
      ctx.fillStyle = rgba(f.rgb, k);
      ctx.font = '800 ' + Math.max(11, (13 + (f.text.indexOf('链') >= 0 ? 4 : 0)) * scale) + 'px sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y - f.t * 28));
    }

    if (G.combo >= 3 && playing()) {
      ctx.fillStyle = rgba(MAG, 0.55 + Math.sin(G.t * 10) * 0.2);
      ctx.font = '900 ' + Math.max(16, 22 * scale) + 'px sans-serif';
      ctx.fillText('×' + G.comboMul, sx(VW * 0.5), sy(TOP - 8));
    }

    if (G.serving && playing() && !overlayOpen()) {
      ctx.fillStyle = rgba(GOLD, 0.7 + Math.sin(G.t * 6) * 0.2);
      ctx.font = '700 ' + Math.max(11, 12 * scale) + 'px sans-serif';
      ctx.fillText('空格开枪发球  ·  ↑ 只发球', sx(VW * 0.5), sy(G.paddle.y - 52));
    }

    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.22);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function resize() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * fit) / 2;
    oy = (H - VH * fit) / 2;
  }

  function canvasX(clientX) {
    const rect = canvas.getBoundingClientRect();
    return (clientX - rect.left - ox) / scale;
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 18; i++) {
      motes.push({
        x: rand(WALL, VW - WALL),
        y: rand(TOP, VH - 80),
        r: rand(1.2, 3.4),
        p: rand(0, TAU),
        rgb: Math.random() < 0.5 ? HOT : GOLD
      });
    }
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (!hidden) {
      acc += dt;
      while (acc >= STEP) {
        if (G.stop > 0) {
          G.stop -= STEP;
          if (G.stop < 0) G.stop = 0;
        } else {
          update(STEP);
        }
        acc -= STEP;
      }
      draw();
    }
    requestAnimationFrame(frame);
  }

  function keyMove(e, down) {
    const k = e.code;
    if (k === 'ArrowLeft' || k === 'KeyA') {
      keys.l = down;
      e.preventDefault();
    } else if (k === 'ArrowRight' || k === 'KeyD') {
      keys.r = down;
      e.preventDefault();
    } else if (k === 'Space') {
      keys.fire = down;
      e.preventDefault();
    } else if (k === 'ArrowUp' || k === 'KeyW') {
      keys.launch = down;
      e.preventDefault();
    } else if (k === 'ArrowDown' || k === 'KeyS') {
      e.preventDefault();
    }
  }

  function onRetry() {
    audio.ensure();
    restart();
  }

  function onAgain() {
    audio.ensure();
    if (G.mode === 'win' && G.stage < STAGES.length - 1) gotoNext();
    else startRun(G.kind);
  }

  if (hasDom) {
    window.addEventListener('keydown', function (e) {
      if (e.repeat) {
        keyMove(e, true);
        return;
      }
      audio.ensure();
      if (e.code === 'KeyM') {
        audio.setMuted(!audio.muted);
        e.preventDefault();
        return;
      }
      if (e.code === 'KeyR') {
        onRetry();
        e.preventDefault();
        return;
      }
      if (G.mode === 'title') {
        if (e.code === 'Digit1' || e.code === 'Enter' || e.code === 'Space') {
          startRun('stages');
          e.preventDefault();
          return;
        }
        if (e.code === 'Digit2') {
          startRun('rain');
          e.preventDefault();
          return;
        }
      }
      if (G.mode === 'win' || G.mode === 'lose') {
        if (e.code === 'Enter' || e.code === 'Space' || e.code === 'Digit1') {
          onAgain();
          e.preventDefault();
          return;
        }
        if (e.code === 'Digit2') {
          bootTitle();
          e.preventDefault();
          return;
        }
      }
      if (overlayOpen() && G.mode !== 'play') return;
      keyMove(e, true);
    });

    window.addEventListener('keyup', function (e) {
      keyMove(e, false);
    });

    function bindPad(node, which) {
      if (!node) return;
      const set = function (on) {
        if (which === 'l') keys.l = on;
        else if (which === 'r') keys.r = on;
        else if (which === 'f') keys.fire = on;
        node.classList.toggle('held', on);
      };
      node.addEventListener('pointerdown', function (e) {
        audio.ensure();
        set(true);
        try { node.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        e.preventDefault();
      });
      node.addEventListener('pointerup', function (e) {
        set(false);
        e.preventDefault();
      });
      node.addEventListener('pointercancel', function () { set(false); });
      node.addEventListener('lostpointercapture', function () { set(false); });
    }
    bindPad(btnLeft, 'l');
    bindPad(btnRight, 'r');
    bindPad(btnFire, 'f');

    if (canvas) {
      canvas.addEventListener('pointerdown', function (e) {
        audio.ensure();
        pointer.down = true;
        pointer.id = e.pointerId;
        pointer.x = canvasX(e.clientX);
        canvas.classList.add('press');
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        if (G.mode === 'title') return;
        if (overlayOpen()) return;
        e.preventDefault();
      });
      canvas.addEventListener('pointermove', function (e) {
        if (!pointer.down && pointer.id == null) {
          pointer.x = canvasX(e.clientX);
          return;
        }
        pointer.x = canvasX(e.clientX);
        e.preventDefault();
      });
      const up = function (e) {
        pointer.down = false;
        pointer.id = null;
        canvas.classList.remove('press');
        if (e) e.preventDefault();
      };
      canvas.addEventListener('pointerup', up);
      canvas.addEventListener('pointercancel', up);
      canvas.addEventListener('lostpointercapture', function () {
        pointer.down = false;
        pointer.id = null;
        canvas.classList.remove('press');
      });
    }

    if (btnMute) {
      btnMute.addEventListener('click', function () {
        audio.ensure();
        audio.setMuted(!audio.muted);
      });
    }
    if (btnRetry) btnRetry.addEventListener('click', onRetry);
    if (btnStages) {
      btnStages.addEventListener('click', function () {
        audio.ensure();
        startRun('stages');
      });
    }
    if (btnRain) {
      btnRain.addEventListener('click', function () {
        audio.ensure();
        startRun('rain');
      });
    }
    if (ovAgain) ovAgain.addEventListener('click', onAgain);
    if (ovMenu) {
      ovMenu.addEventListener('click', function () {
        audio.ensure();
        bootTitle();
      });
    }

    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (hidden) {
        keys.l = keys.r = keys.fire = keys.launch = false;
        pointer.down = false;
      } else {
        last = 0;
        acc = 0;
      }
    });

    window.addEventListener('resize', resize);
    resize();
    seedMotes();
    audio.setMuted(loadMute());
    loadBest();
    bootTitle();
    requestAnimationFrame(frame);
  }
})();
