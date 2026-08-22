'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const WALL = 14;
  const TOP = 36;
  const COLS = 10;
  const BW = 40;
  const BH = 16;
  const GX = 4;
  const GY = 5;
  const FIELD_L = (VW - (COLS * BW + (COLS - 1) * GX)) / 2;
  const PADDLE_Y = 658;
  const PADDLE_H = 12;
  const PADDLE_W = 88;
  const PADDLE_WIDE = 136;
  const BALL_R = 6.4;
  const LIVES = 3;
  const MAX_BALLS = 3;
  const WIDE_T = 12;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MAX_ANG = 1.15;
  const POWER_CHANCE = 0.16;
  const BEST_KEY = 'playbox-brick-out-best';
  const MUTE_KEY = 'playbox-brick-out-mute';
  const AUTO_SPEED_KEY = 'playbox-brick-out-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_MAX_V = [0, 540, 720, 980, 1680];
  const AUTO_FOLLOW = [0, 8, 13, 22, 48];
  const AUTO_LAUNCH = [0, 0.52, 0.28, 0.1, 0.02];
  const OPS = '← → 或拖动挡板 · 空格发球 · A 自动 · M 静音';
  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 90, 42];

  const ROW_HUES = [
    [255, 90, 42],
    [255, 180, 70],
    [255, 61, 184],
    [0, 240, 255],
    [209, 76, 255],
    [61, 255, 136],
    [255, 120, 80],
    [80, 180, 255]
  ];

  const LAYOUTS = [
    {
      name: '列阵',
      sub: 'LINE',
      map: [
        '2222222222',
        '1111111111',
        '1111111111',
        '1111111111',
        '1111111111'
      ]
    },
    {
      name: '拱门',
      sub: 'ARCH',
      map: [
        '0011111100',
        '0122222210',
        '1220000221',
        '1200000021',
        '1220110221',
        '0111111110'
      ]
    },
    {
      name: '密织',
      sub: 'WEAVE',
      map: [
        '2121212121',
        '1212121212',
        '2020202020',
        '1111111111',
        '0202020202',
        '2121212121',
        '1111011111'
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
  const btnCampaign = el('btn-campaign');
  const btnEndless = el('btn-endless');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const btnAuto = el('btn-auto');
  const speedEl = el('speed');
  const speedLab = el('speed-lab');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
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

  const keys = { l: false, r: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const motes = [];

  const G = {
    mode: 'title',
    kind: 'campaign',
    t: 0,
    clock: 0,
    layout: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    bricks: [],
    balls: [],
    powers: [],
    paddle: { x: VW * 0.5, y: PADDLE_Y, w: PADDLE_W, h: PADDLE_H, vx: 0 },
    serving: true,
    ballSpeed: 310,
    wideT: 0,
    wave: 0,
    fall: 10,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    toastT: 0,
    lock: 0,
    demoT: 0.7,
    hits: 0
  };

  let autoOn = false;
  let autoSpeed = 3;
  let autoTarget = VW * 0.5;
  let autoServeWait = 0;
  let autoOvWait = 0;
  let autoOffHold = 0.45;
  let autoOffT = 0;
  let autoOffX = -1;

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
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
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
      const n = 0.08;
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
    launch() {
      this.ensure();
      this.beep(520, 0.07, 'sine', 0.04, 880);
    },
    paddle() {
      this.ensure();
      this.beep(240, 0.05, 'triangle', 0.04, 420);
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
      this.noise(0.04, 0.03, 1400);
      this.beep(880, 0.07, 'sine', 0.045, 1320);
    },
    power() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.05, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1175);
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

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
    } catch (err) { /* ignore */ }
  }

  autoSpeed = loadAutoSpeed();

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
    G.toastT = 1.5;
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
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function layoutName() {
    const L = LAYOUTS[G.layout];
    return L ? L.name : '';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (!stageLabel || !tagLabel) return;
    if (G.mode === 'title') {
      stageLabel.textContent = '破砖';
      tagLabel.textContent = 'BREAK';
    } else if (G.kind === 'endless') {
      stageLabel.textContent = '无尽';
      tagLabel.textContent = '第 ' + G.wave + ' 行';
    } else {
      stageLabel.textContent = '第 ' + (G.layout + 1) + ' 关';
      tagLabel.textContent = layoutName();
    }
    const win = G.mode === 'win';
    const lose = G.mode === 'lose';
    stageLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('warn', lose);
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showEndless) {
    autoOvWait = 0;
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'MISS' : 'BREAK';
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovOps.textContent = OPS;
    btnCampaign.textContent = primary;
    btnEndless.classList.toggle('hidden', !showEndless);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function brickPos(c, y) {
    return { x: FIELD_L + c * (BW + GX), y: y };
  }

  function hueFor(row, hp) {
    if (hp >= 2) return GOLD;
    return ROW_HUES[row % ROW_HUES.length];
  }

  function makeBrick(c, y, hp, row) {
    const p = brickPos(c, y);
    return {
      x: p.x,
      y: y,
      w: BW,
      h: BH,
      hp: hp,
      max: hp,
      row: row || 0,
      rgb: hueFor(row || 0, hp),
      flash: 0,
      gem: Math.random() < POWER_CHANCE
    };
  }

  function buildLayout(idx) {
    const L = LAYOUTS[idx];
    G.bricks = [];
    G.powers = [];
    if (!L) return;
    for (let r = 0; r < L.map.length; r++) {
      const line = L.map[r];
      for (let c = 0; c < line.length && c < COLS; c++) {
        const ch = line.charAt(c);
        if (ch === '0' || ch === ' ') continue;
        const hp = ch === '2' ? 2 : 1;
        G.bricks.push(makeBrick(c, TOP + r * (BH + GY), hp, r));
      }
    }
  }

  function spawnEndlessRow(y) {
    const hard = Math.min(0.48, 0.08 + G.wave * 0.028);
    const gap = Math.min(0.22, 0.08 + G.wave * 0.008);
    let n = 0;
    const rowIdx = G.wave;
    for (let c = 0; c < COLS; c++) {
      if (Math.random() < gap && c > 0 && c < COLS - 1) continue;
      const hp = Math.random() < hard ? 2 : 1;
      G.bricks.push(makeBrick(c, y, hp, rowIdx));
      n += 1;
    }
    if (n < 6) {
      for (let c = 0; c < COLS && n < 6; c++) {
        let has = false;
        for (let i = 0; i < G.bricks.length; i++) {
          const b = G.bricks[i];
          if (Math.abs(b.y - y) < 1 && Math.abs(b.x - brickPos(c, y).x) < 1) has = true;
        }
        if (!has) {
          G.bricks.push(makeBrick(c, y, 1, rowIdx));
          n += 1;
        }
      }
    }
    G.wave += 1;
    G.fall = Math.min(28, 9.5 + G.wave * 0.42);
    G.ballSpeed = Math.min(470, 300 + G.wave * 5);
    syncHud();
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
    b.y = G.paddle.y - G.paddle.h * 0.5 - b.r - 1;
    b.vx = 0;
    b.vy = 0;
    b.dead = false;
  }

  function serve() {
    G.serving = true;
    G.combo = 0;
    G.balls = [makeBall(G.paddle.x, G.paddle.y - 20, 0, 0)];
    stickServe();
    G.lock = 0.18;
    autoServeWait = AUTO_LAUNCH[autoSpeed] || 0.1;
  }

  function launch() {
    if (!G.serving) return;
    if (G.lock > 0) return;
    const b = G.balls[0];
    if (!b) return;
    G.serving = false;
    const dir = Math.random() < 0.5 ? -1 : 1;
    const ang = (0.18 + Math.random() * 0.32) * dir;
    const spd = G.ballSpeed;
    b.vx = Math.sin(ang) * spd;
    b.vy = -Math.cos(ang) * spd;
    if (G.mode === 'play') audio.launch();
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 4);
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.4, spec.j * 0.4),
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
    sparks.push({ x: x, y: y, t: 0, rgb: rgb || CYN });
    if (sparks.length > 18) sparks.shift();
  }

  function resetRunCommon() {
    particles.length = 0;
    sparks.length = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.wideT = 0;
    G.paddle.w = PADDLE_W;
    G.paddle.x = VW * 0.5;
    G.paddle.vx = 0;
    G.powers = [];
    G.hits = 0;
    G.flash = 0;
    G.shake = 0;
    if (scoreEl) scoreEl.textContent = '0';
    if (scoreAdd) scoreAdd.hidden = true;
  }

  function startCampaign() {
    resetRunCommon();
    G.kind = 'campaign';
    G.layout = 0;
    G.ballSpeed = 310;
    G.mode = 'play';
    G.wave = 0;
    buildLayout(0);
    hideOverlay();
    serve();
    setHint('左右或拖动挡板 · 空格发球 · A 自动 · 别漏球', '');
    toast(LAYOUTS[0].name, false, true);
    syncHud();
    audio.start();
    if (canvas && canvas.focus) canvas.focus();
  }

  function startEndless() {
    resetRunCommon();
    G.kind = 'endless';
    G.layout = 0;
    G.wave = 0;
    G.fall = 10;
    G.ballSpeed = 300;
    G.mode = 'play';
    G.bricks = [];
    for (let r = 0; r < 4; r++) spawnEndlessRow(TOP + r * (BH + GY));
    hideOverlay();
    serve();
    setHint('砖会往下压 · 接住球继续打', '');
    toast('无尽', false, true);
    syncHud();
    audio.start();
    if (canvas && canvas.focus) canvas.focus();
  }

  function restart() {
    if (G.mode === 'title') {
      startCampaign();
      return;
    }
    if (G.kind === 'endless') startEndless();
    else startCampaign();
  }

  function bootTitle() {
    resetRunCommon();
    G.mode = 'title';
    G.kind = 'campaign';
    G.layout = 0;
    G.ballSpeed = 280;
    buildLayout(0);
    G.lives = LIVES;
    serve();
    G.demoT = 0.85;
    showOverlay(
      'title',
      '破砖',
      '弹球打砖，别漏下去。<br />有的砖要打两下。偶尔掉出 加长 / 多球。',
      '闯关',
      true
    );
    setHint('左右或拖动挡板 · 空格发球 · A 自动 · 别漏球', '');
    syncHud();
  }

  function gotoNextLayout() {
    G.layout += 1;
    const L = LAYOUTS[G.layout];
    G.ballSpeed = 310 + G.layout * 36;
    G.wideT = 0;
    G.paddle.w = PADDLE_W;
    G.powers = [];
    buildLayout(G.layout);
    G.mode = 'play';
    hideOverlay();
    serve();
    toast(L.name, false, true);
    setHint('第 ' + (G.layout + 1) + ' 关 · ' + L.name, 'hot');
    syncHud();
    audio.start();
  }

  function winLayout() {
    const last = G.layout >= LAYOUTS.length - 1;
    const bonus = last ? 1000 : 400;
    addScore(bonus);
    G.mode = 'win';
    G.serving = true;
    audio.win();
    G.flash = 0.45;
    G.flashRgb = GOLD;
    const more = !last;
    const lead = last
      ? '三关都清了。得分 ' + G.score + '。'
      : '这一屏砖都打掉了。得分 ' + G.score + '。';
    showOverlay('win', '清屏了', lead, more ? '下一关' : '重开', false);
    setHint(last ? '三关都清了' : '清屏了', 'hot');
    syncHud();
  }

  function loseRun() {
    G.mode = 'lose';
    G.serving = true;
    audio.lose();
    G.flash = 0.5;
    G.flashRgb = MAG;
    G.shake = REDUCE ? 0 : 10;
    if (stageEl) {
      stageEl.classList.remove('die');
      void stageEl.offsetWidth;
      if (!REDUCE) stageEl.classList.add('die');
    }
    showOverlay('lose', '球漏了', '球漏下去了。得分 ' + G.score + '。', '重开', false);
    setHint('球漏了', 'warn');
    syncHud();
  }

  function missLife() {
    if (G.mode !== 'play') {
      serve();
      G.demoT = 0.9;
      return;
    }
    G.lives -= 1;
    G.wideT = 0;
    G.paddle.w = PADDLE_W;
    G.powers = [];
    G.combo = 0;
    G.shake = REDUCE ? 0 : 7;
    G.flash = 0.22;
    G.flashRgb = MAG;
    syncPips();
    audio.miss();
    if (G.lives <= 0) {
      loseRun();
      return;
    }
    toast('还剩 ' + G.lives + ' 命', true, false);
    serve();
  }

  function applyWide() {
    G.wideT = WIDE_T;
    G.paddle.w = PADDLE_WIDE;
    const b = paddleBounds();
    G.paddle.x = clamp(G.paddle.x, b.lo, b.hi);
    toast('加长', false, true);
    audio.power();
  }

  function applyMulti() {
    if (G.serving) {
      G.lock = 0;
      launch();
    }
    const live = [];
    for (let i = 0; i < G.balls.length; i++) {
      if (!G.balls[i].dead) live.push(G.balls[i]);
    }
    if (live.length === 0) {
      toast('多球', false, true);
      audio.power();
      return;
    }
    if (G.balls.length >= MAX_BALLS) {
      toast('球已满', false, true);
      audio.power();
      return;
    }
    const src = live[0];
    const ang = Math.atan2(src.vy, src.vx);
    const spd = Math.max(G.ballSpeed, hypot(src.vx, src.vy));
    const offs = [0.48, -0.48];
    let k = 0;
    while (G.balls.length < MAX_BALLS && k < offs.length) {
      const a = ang + offs[k];
      G.balls.push(makeBall(src.x, src.y, Math.cos(a) * spd, Math.sin(a) * spd));
      k += 1;
    }
    toast('多球', false, true);
    audio.power();
  }

  function dropPower(br) {
    if (G.mode !== 'play') return;
    if (!br.gem) return;
    if (G.powers.length >= 2) return;
    G.powers.push({
      kind: Math.random() < 0.5 ? 'wide' : 'multi',
      x: br.x + br.w * 0.5,
      y: br.y + br.h * 0.5,
      vy: 92,
      w: 38,
      h: 16
    });
  }

  function bumpSpeed() {
    if (G.kind === 'endless') return;
    G.hits += 1;
    if (G.hits % 8 === 0) {
      G.ballSpeed = Math.min(460, G.ballSpeed * 1.03);
    }
  }

  function damageBrick(br) {
    br.hp -= 1;
    br.flash = 0.12;
    G.combo += 1;
    bumpSpeed();
    const cx = br.x + br.w * 0.5;
    const cy = br.y + br.h * 0.5;
    if (br.hp > 0) {
      br.rgb = hueFor(br.row, 1);
      addScore(20 + Math.max(0, G.combo - 1) * 5);
      if (G.mode === 'play') audio.chip();
      emit(6, {
        x: cx, y: cy, j: 10,
        vx0: -80, vx1: 80, vy0: -90, vy1: 40,
        life: 0.32, r0: 0.8, r1: 2.2, rgb: GOLD
      });
      return;
    }
    const extra = Math.max(0, G.combo - 1) * 10;
    addScore((br.max >= 2 ? 80 : 50) + extra);
    if (G.mode === 'play') audio.brick();
    popSpark(cx, cy, br.rgb);
    emit(12, {
      x: cx, y: cy, j: 14,
      vx0: -140, vx1: 140, vy0: -160, vy1: 40,
      life: 0.42, r0: 1, r1: 3.2, rgb: br.rgb
    });
    dropPower(br);
  }

  function circleRect(b, r) {
    const cx = clamp(b.x, r.x, r.x + r.w);
    const cy = clamp(b.y, r.y, r.y + r.h);
    const dx = b.x - cx;
    const dy = b.y - cy;
    return dx * dx + dy * dy < b.r * b.r;
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
    const minVy = spd * 0.32;
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
    b.y = p.y - p.h * 0.5 - b.r - 0.4;
    G.combo = 0;
    if (G.mode === 'play') audio.paddle();
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
    const top = p.y - p.h * 0.5;
    if (b.y + b.r < top - 2) return false;
    if (b.y > p.y + p.h * 0.5 + 6) return false;
    if (b.x + b.r < p.x - half) return false;
    if (b.x - b.r > p.x + half) return false;
    return true;
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
        if (G.mode === 'play') audio.wall();
      } else if (b.x + b.r > VW - WALL) {
        b.x = VW - WALL - b.r;
        b.vx = -Math.abs(b.vx);
        if (G.mode === 'play') audio.wall();
      }
      if (b.y - b.r < TOP - 18) {
        b.y = TOP - 18 + b.r;
        b.vy = Math.abs(b.vy);
        if (G.mode === 'play') audio.wall();
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
        damageBrick(br);
        if (br.hp <= 0) G.bricks.splice(hit, 1);
      }

      if (b.y - b.r > VH + 8) b.dead = true;
    }
  }

  function crushed() {
    const limit = G.paddle.y - 36;
    for (let i = 0; i < G.bricks.length; i++) {
      const br = G.bricks[i];
      if (br.hp > 0 && br.y + br.h >= limit) return true;
    }
    return false;
  }

  function maybeSpawnEndless() {
    let minY = 1e9;
    for (let i = 0; i < G.bricks.length; i++) {
      if (G.bricks[i].y < minY) minY = G.bricks[i].y;
    }
    if (G.bricks.length === 0 || minY >= TOP + BH + GY) {
      spawnEndlessRow(TOP);
    }
  }

  function collectPower(p) {
    const half = paddleHalf();
    const top = G.paddle.y - G.paddle.h * 0.5;
    const left = G.paddle.x - half;
    const right = G.paddle.x + half;
    const px0 = p.x - p.w * 0.5;
    const px1 = p.x + p.w * 0.5;
    const py0 = p.y - p.h * 0.5;
    const py1 = p.y + p.h * 0.5;
    if (px1 < left || px0 > right) return false;
    if (py1 < top || py0 > G.paddle.y + G.paddle.h * 0.5 + 6) return false;
    return true;
  }

  function foldX(x, vx, t, xmin, xmax) {
    const span = xmax - xmin;
    if (!(span > 1) || !isFinite(t)) return x;
    let dist = (x - xmin) + vx * t;
    const period = span * 2;
    dist = dist % period;
    if (dist < 0) dist += period;
    if (dist > span) return xmax - (dist - span);
    return xmin + dist;
  }

  function timeToPaddle(b) {
    const r = b.r;
    const yPad = PADDLE_Y - PADDLE_H * 0.5 - r;
    const yTop = TOP - 18 + r;
    const xmin = WALL + r;
    const xmax = VW - WALL - r;
    if (Math.abs(b.vy) < 6) return { x: b.x, t: 1.4, vx: b.vx };
    if (b.vy > 0) {
      if (b.y >= yPad) return { x: b.x, t: 0.001, vx: b.vx };
      const t = (yPad - b.y) / b.vy;
      return { x: foldX(b.x, b.vx, t, xmin, xmax), t: Math.max(0.001, t), vx: b.vx };
    }
    const tUp = Math.max(0, (b.y - yTop) / -b.vy);
    const tDown = (yPad - yTop) / Math.abs(b.vy);
    const t = tUp + tDown;
    return { x: foldX(b.x, b.vx, t, xmin, xmax), t: Math.max(0.001, t), vx: b.vx };
  }

  function pickThreatBall() {
    let down = null;
    let downT = 1e9;
    let up = null;
    let upT = 1e9;
    for (let i = 0; i < G.balls.length; i++) {
      const b = G.balls[i];
      if (!b || b.dead) continue;
      const pred = timeToPaddle(b);
      if (b.vy > 8) {
        let t = pred.t;
        if (b.y > PADDLE_Y - 36) t = Math.min(t, 0.04);
        if (t < downT) {
          downT = t;
          down = b;
        }
      } else if (pred.t < upT) {
        upT = pred.t;
        up = b;
      }
    }
    return down || up || null;
  }

  function autoServeX() {
    let best = VW * 0.5;
    let bestS = -1e9;
    for (let i = 0; i < G.bricks.length; i++) {
      const br = G.bricks[i];
      if (br.hp <= 0) continue;
      let s = (720 - br.y) * 2;
      if (br.hp >= 2) s += 220;
      s += Math.abs(br.x + br.w * 0.5 - VW * 0.5) * 0.04;
      if (s > bestS) {
        bestS = s;
        best = br.x + br.w * 0.5;
      }
    }
    const side = best >= VW * 0.5 ? -16 : 16;
    return best + side;
  }

  function simShotScore(landX, off) {
    const ang = off * MAX_ANG;
    const spd = Math.max(220, G.ballSpeed);
    const r = BALL_R;
    const xmin = WALL + r;
    const xmax = VW - WALL - r;
    const ymin = TOP - 18 + r;
    let x = landX;
    let y = PADDLE_Y - PADDLE_H * 0.5 - r - 0.4;
    let vx = Math.sin(ang) * spd;
    let vy = -Math.cos(ang) * spd;
    const n = G.bricks.length;
    const hp = new Array(n);
    for (let i = 0; i < n; i++) hp[i] = G.bricks[i].hp;
    let score = 12 - Math.abs(Math.abs(off) - 0.34) * 10;
    let hits = 0;
    const hitLimit = autoSpeed >= 4 ? 4 : autoSpeed >= 3 ? 6 : 8;
    const tLimit = autoSpeed <= 1 ? 3.0 : 2.5;
    const dt = autoSpeed >= 4 ? 1 / 64 : 1 / 80;
    let t = 0;
    while (t < tLimit && hits < hitLimit && vy !== 0) {
      x += vx * dt;
      y += vy * dt;
      t += dt;
      if (x < xmin) {
        x = xmin;
        vx = Math.abs(vx);
      } else if (x > xmax) {
        x = xmax;
        vx = -Math.abs(vx);
      }
      if (y < ymin) {
        y = ymin;
        vy = Math.abs(vy);
      }
      if (y > PADDLE_Y + 12 && vy > 0) break;

      let hit = -1;
      let bestD = 1e9;
      for (let i = 0; i < n; i++) {
        if (hp[i] <= 0) continue;
        const br = G.bricks[i];
        const cx = clamp(x, br.x, br.x + br.w);
        const cy = clamp(y, br.y, br.y + br.h);
        const dx = x - cx;
        const dy = y - cy;
        const d2 = dx * dx + dy * dy;
        if (d2 < r * r && d2 < bestD) {
          bestD = d2;
          hit = i;
        }
      }
      if (hit < 0) continue;
      const br = G.bricks[hit];
      const left = x - br.x;
      const right = br.x + br.w - x;
      const top = y - br.y;
      const bot = br.y + br.h - y;
      const m = Math.min(left, right, top, bot);
      const side = m === left || m === right;
      if (side) {
        if (m === left) {
          x = br.x - r - 0.4;
          vx = -Math.abs(vx);
        } else {
          x = br.x + br.w + r + 0.4;
          vx = Math.abs(vx);
        }
      } else if (m === top) {
        y = br.y - r - 0.4;
        vy = -Math.abs(vy);
      } else {
        y = br.y + br.h + r + 0.4;
        vy = Math.abs(vy);
      }
      hp[hit] -= 1;
      hits += 1;
      let s = hp[hit] <= 0 ? (br.max >= 2 ? 90 : 55) : 22;
      if (br.hp >= 2) s += 70;
      s += (700 - br.y) * 0.18;
      if (side) s += 85;
      if (vy < 0) s += 25;
      score += s;
    }
    score += hits * 35;
    if (hits === 0) score -= 80;
    if (hits === 1 && vy > 0) score -= 40;
    return score;
  }

  function autoAimOff(landX) {
    const toward = landX > VW * 0.5 ? -1 : 1;
    const mags = autoSpeed >= 4
      ? [0.26, 0.38, 0.5, 0.16, 0.62]
      : autoSpeed >= 3
        ? [0.22, 0.32, 0.42, 0.52, 0.14, 0.62]
        : [0.12, 0.22, 0.3, 0.38, 0.46, 0.54, 0.64, 0.74];
    let bestOff = toward * 0.34;
    let best = -1e9;
    for (let k = 0; k < mags.length; k++) {
      for (let s = 0; s < 2; s++) {
        const off = mags[k] * (s === 0 ? toward : -toward);
        const sc = simShotScore(landX, off);
        if (sc > best) {
          best = sc;
          bestOff = off;
        }
      }
    }
    return clamp(bestOff, -0.86, 0.86);
  }

  function autoPickTarget() {
    const bds = paddleBounds();
    const half = paddleHalf();
    if (G.serving) {
      return clamp(autoServeX(), bds.lo, bds.hi);
    }

    const ball = pickThreatBall();
    if (!ball) {
      return clamp(autoServeX() + Math.sin(G.t * 2.1) * 18, bds.lo, bds.hi);
    }

    const pred = timeToPaddle(ball);
    const goingDown = ball.vy > 8;
    const tLeft = pred.t;
    let landX = pred.x;
    if (autoSpeed >= 4 && !goingDown && tLeft > 0.4) {
      landX = ball.x + ball.vx * 0.1;
    } else if (autoSpeed >= 3 && !goingDown && tLeft > 0.6) {
      landX = ball.x + ball.vx * 0.16;
    }
    if (goingDown) landX = pred.x;

    if (tLeft > 0.55 && G.powers.length) {
      let bestP = null;
      let bestY = -1;
      for (let i = 0; i < G.powers.length; i++) {
        const p = G.powers[i];
        if (p.y > G.paddle.y + 12) continue;
        if (p.y > G.paddle.y - 200 && p.y > bestY) {
          bestY = p.y;
          bestP = p;
        }
      }
      if (bestP) return clamp(bestP.x, bds.lo, bds.hi);
    }

    let off = autoOffHold;
    if (G.bricks.length) {
      const reuse = autoSpeed >= 3 && autoOffT > 0 && Math.abs(landX - autoOffX) < 36;
      if (reuse) {
        off = autoOffHold;
      } else {
        off = autoAimOff(landX);
        autoOffHold = off;
        autoOffX = landX;
        autoOffT = autoSpeed >= 4 ? 0.12 : autoSpeed >= 3 ? 0.05 : 0;
      }
    } else {
      off = landX > VW * 0.5 ? -0.4 : 0.4;
    }

    const cover = Math.max(10, half - 7);
    let tx = landX - off * half;
    tx = clamp(tx, landX - cover, landX + cover);
    if (tLeft > 0.75) tx += Math.sin(G.t * 2.35) * (autoSpeed <= 2 ? 16 : 8);
    return clamp(tx, bds.lo, bds.hi);
  }

  function autoSteer(dt) {
    const bds = paddleBounds();
    autoOffT = Math.max(0, autoOffT - dt);
    let target = autoPickTarget();
    autoTarget = target;
    const maxV = AUTO_MAX_V[autoSpeed] || 980;
    const follow = AUTO_FOLLOW[autoSpeed] || 22;
    const ball = pickThreatBall();
    const pred = ball && !G.serving ? timeToPaddle(ball) : null;
    const tLeft = pred ? pred.t : 1;
    const landX = pred ? pred.x : target;
    const half = paddleHalf();
    if (pred && tLeft < 0.5) {
      const reach = maxV * Math.max(tLeft, dt);
      const cover = Math.max(10, half - 7);
      const coverLo = landX - cover;
      const coverHi = landX + cover;
      const lo = G.paddle.x - reach;
      const hi = G.paddle.x + reach;
      const iLo = Math.max(lo, coverLo);
      const iHi = Math.min(hi, coverHi);
      if (iLo <= iHi) target = clamp(target, iLo, iHi);
      else target = clamp(landX, bds.lo, bds.hi);
    }
    let cap = maxV * dt;
    if (tLeft < 0.32) {
      const need = Math.abs(target - G.paddle.x);
      const panic = Math.max(maxV, need / Math.max(tLeft, 0.012));
      cap = panic * dt;
    }
    let nx = lerp(G.paddle.x, target, 1 - Math.exp(-follow * dt));
    if (nx - G.paddle.x > cap) nx = G.paddle.x + cap;
    else if (nx - G.paddle.x < -cap) nx = G.paddle.x - cap;
    if (tLeft < 0.1) nx = G.paddle.x + clamp(target - G.paddle.x, -cap, cap);
    G.paddle.vx = (nx - G.paddle.x) / Math.max(dt, 0.001);
    G.paddle.x = clamp(nx, bds.lo, bds.hi);
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl) return;
    speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!(n >= 1 && n <= 4)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    keys.l = false;
    keys.r = false;
    pointer.down = false;
    autoOvWait = 0;
    autoServeWait = AUTO_LAUNCH[autoSpeed] || 0.1;
    syncAutoUi();
    if (!autoOn) return;
    audio.ensure();
    if (G.mode === 'title') startCampaign();
  }

  function tickAutoFlow(dt) {
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.22 : 0.48)) {
        autoOvWait = 0;
        startCampaign();
      }
      return;
    }
    if (G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.42 : 0.85)) {
        autoOvWait = 0;
        primaryAction();
      }
    }
  }

  function updatePaddle(dt) {
    const b = paddleBounds();
    const playing = G.mode === 'play' || G.mode === 'title';
    if (!playing) {
      G.paddle.vx *= Math.exp(-dt * 8);
      G.paddle.x = clamp(G.paddle.x + G.paddle.vx * dt, b.lo, b.hi);
      return;
    }

    if (autoOn && G.mode === 'play') {
      autoSteer(dt);
      return;
    }

    if (G.mode === 'title') {
      const ball = G.balls[0];
      const tx = ball ? clamp(ball.x + ball.vx * 0.12, b.lo, b.hi) : VW * 0.5;
      const nx = lerp(G.paddle.x, tx, 1 - Math.exp(-12 * dt));
      G.paddle.vx = (nx - G.paddle.x) / Math.max(dt, 0.001);
      G.paddle.x = nx;
      return;
    }

    const usePtr = pointer.down || pointer.hover;
    if (usePtr) {
      const tx = clamp(pointer.x, b.lo, b.hi);
      const k = pointer.down ? 1 - Math.exp(-26 * dt) : 1 - Math.exp(-18 * dt);
      const nx = lerp(G.paddle.x, tx, k);
      G.paddle.vx = (nx - G.paddle.x) / Math.max(dt, 0.001);
      G.paddle.x = nx;
    } else {
      let ax = 0;
      if (keys.l) ax -= 2800;
      if (keys.r) ax += 2800;
      G.paddle.vx += ax * dt;
      if (!keys.l && !keys.r) G.paddle.vx *= Math.exp(-dt * 10);
      G.paddle.vx = clamp(G.paddle.vx, -620, 620);
      G.paddle.x += G.paddle.vx * dt;
    }
    if (G.paddle.x < b.lo) {
      G.paddle.x = b.lo;
      G.paddle.vx *= 0.2;
    } else if (G.paddle.x > b.hi) {
      G.paddle.x = b.hi;
      G.paddle.vx *= 0.2;
    }
  }

  function updateWide(dt) {
    if (G.wideT > 0) {
      G.wideT = Math.max(0, G.wideT - dt);
      const blink = G.wideT > 0 && G.wideT < 2 && ((G.t * 8) | 0) % 2 === 0;
      G.paddle.w = blink ? PADDLE_W : PADDLE_WIDE;
      if (G.wideT <= 0) G.paddle.w = PADDLE_W;
    } else {
      G.paddle.w = PADDLE_W;
    }
  }

  function updateFx(dt) {
    G.shake *= Math.exp(-dt * 9);
    G.flash = Math.max(0, G.flash - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    for (let i = 0; i < G.bricks.length; i++) {
      G.bricks[i].flash = Math.max(0, G.bricks[i].flash - dt);
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
      if (sparks[i].t > 0.4) sparks.splice(i, 1);
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
    if (G.bricks.length === 0) {
      buildLayout(0);
      serve();
      G.demoT = 0.9;
      return;
    }
    if (G.serving) {
      if (G.demoT <= 0 && G.lock <= 0) {
        launch();
        G.demoT = 2.2;
      }
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    G.lock = Math.max(0, G.lock - dt);
    if (autoOn) tickAutoFlow(dt);
    updateWide(dt);
    updatePaddle(dt);
    if (G.serving) stickServe();
    if (autoOn && G.mode === 'play' && G.serving && G.lock <= 0) {
      autoServeWait -= dt;
      if (autoServeWait <= 0) launch();
    }

    if (G.mode === 'title') {
      demoTick(dt);
      if (!G.serving) {
        for (let i = 0; i < G.balls.length; i++) moveBall(G.balls[i], dt);
        const live = [];
        for (let i = 0; i < G.balls.length; i++) if (!G.balls[i].dead) live.push(G.balls[i]);
        G.balls = live;
        if (G.balls.length === 0) {
          serve();
          G.demoT = 0.6;
        }
      }
      recordTrails();
      updateFx(dt);
      return;
    }

    if (G.mode === 'win' || G.mode === 'lose') {
      updateFx(dt);
      return;
    }

    if (G.kind === 'endless' && G.mode === 'play') {
      for (let i = 0; i < G.bricks.length; i++) G.bricks[i].y += G.fall * dt;
      maybeSpawnEndless();
      if (crushed()) {
        loseRun();
        updateFx(dt);
        return;
      }
    }

    if (!G.serving) {
      for (let i = 0; i < G.balls.length; i++) moveBall(G.balls[i], dt);
      const live = [];
      for (let i = 0; i < G.balls.length; i++) if (!G.balls[i].dead) live.push(G.balls[i]);
      G.balls = live;
      if (G.mode === 'play' && G.kind === 'campaign' && G.bricks.length === 0) {
        winLayout();
        updateFx(dt);
        return;
      }
      if (G.balls.length === 0) {
        missLife();
        updateFx(dt);
        return;
      }
    }

    for (let i = G.powers.length - 1; i >= 0; i--) {
      const p = G.powers[i];
      p.y += p.vy * dt;
      if (collectPower(p)) {
        addScore(30);
        if (p.kind === 'wide') applyWide();
        else applyMulti();
        G.powers.splice(i, 1);
        continue;
      }
      if (p.y - p.h > VH) G.powers.splice(i, 1);
    }

    if (G.mode === 'play' && G.kind === 'campaign' && G.bricks.length === 0) {
      winLayout();
    }

    recordTrails();
    updateFx(dt);
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    if (c.roundRect) {
      c.roundRect(x, y, w, h, rr);
      return;
    }
    c.moveTo(x + rr, y);
    c.lineTo(x + w - rr, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rr);
    c.lineTo(x + w, y + h - rr);
    c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    c.lineTo(x + rr, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rr);
    c.lineTo(x, y + rr);
    c.quadraticCurveTo(x, y, x + rr, y);
    c.closePath();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#12080e');
    g.addColorStop(0.45, '#08040c');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(220), 20 * scale, sx(240), sy(300), 380 * scale);
    vg.addColorStop(0, 'rgba(255, 90, 42, 0.07)');
    vg.addColorStop(0.5, 'rgba(255, 61, 184, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.5 + 0.5 * Math.sin(G.t * 1.3 + m.p));
      ctx.fillStyle = rgba(i % 3 === 0 ? HOT : i % 3 === 1 ? MAG : CYN, a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawWalls() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 90, 42, 0.55)';
    ctx.lineWidth = 3.2 * scale;
    ctx.shadowColor = 'rgba(255, 90, 42, 0.35)';
    ctx.shadowBlur = 12 * scale;
    roundRect(ctx, sx(WALL - 6), sy(TOP - 24), (VW - (WALL - 6) * 2) * scale, (VH - (TOP - 24) - 8) * scale, 14 * scale);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1.2 * scale;
    roundRect(ctx, sx(WALL - 2), sy(TOP - 20), (VW - (WALL - 2) * 2) * scale, (VH - (TOP - 20) - 12) * scale, 12 * scale);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255, 90, 42, 0.12)';
    ctx.fillRect(sx(WALL - 6), sy(TOP - 24), 6 * scale, (VH - (TOP - 16)) * scale);
    ctx.fillRect(sx(VW - WALL), sy(TOP - 24), 6 * scale, (VH - (TOP - 16)) * scale);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.fillRect(sx(WALL - 6), sy(TOP - 24), (VW - (WALL - 6) * 2) * scale, 6 * scale);
  }

  function drawBrick(br) {
    const x = sx(br.x);
    const y = sy(br.y);
    const w = br.w * scale;
    const h = br.h * scale;
    const rgb = br.hp >= 2 ? GOLD : br.rgb;
    const a = br.hp >= 2 ? 1 : br.max >= 2 ? 0.78 : 0.95;
    ctx.save();
    roundRect(ctx, x, y, w, h, 4 * scale);
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, rgba(rgb, 0.95 * a));
    g.addColorStop(0.45, rgba(rgb, 0.55 * a));
    g.addColorStop(1, rgba([rgb[0] * 0.35 | 0, rgb[1] * 0.28 | 0, rgb[2] * 0.35 | 0], 0.95 * a));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba(rgb, 0.85);
    ctx.lineWidth = (br.hp >= 2 ? 1.6 : 1.05) * scale;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (br.hp >= 2 ? 0.22 : 0.14) + ')';
    roundRect(ctx, x + 2 * scale, y + 1.4 * scale, w - 4 * scale, h * 0.32, 2 * scale);
    ctx.fill();
    if (br.max >= 2 && br.hp === 1) {
      ctx.strokeStyle = 'rgba(8,4,12,0.55)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.18, y + h * 0.25);
      ctx.lineTo(x + w * 0.42, y + h * 0.72);
      ctx.lineTo(x + w * 0.7, y + h * 0.38);
      ctx.stroke();
    }
    if (br.gem && br.hp > 0) {
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.beginPath();
      ctx.arc(x + w * 0.5, y + h * 0.55, 1.7 * scale, 0, TAU);
      ctx.fill();
    }
    if (br.flash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (br.flash * 3.2) + ')';
      roundRect(ctx, x, y, w, h, 4 * scale);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPaddle() {
    const p = G.paddle;
    const x = sx(p.x - p.w * 0.5);
    const y = sy(p.y - p.h * 0.5);
    const w = p.w * scale;
    const h = p.h * scale;
    ctx.save();
    ctx.shadowColor = G.wideT > 0 ? 'rgba(255,227,107,0.55)' : 'rgba(0,240,255,0.55)';
    ctx.shadowBlur = 16 * scale;
    roundRect(ctx, x, y, w, h, 6 * scale);
    const g = ctx.createLinearGradient(x, y, x + w, y);
    g.addColorStop(0, '#ff3db8');
    g.addColorStop(0.5, G.wideT > 0 ? '#ffe36b' : '#e8ffff');
    g.addColorStop(1, '#00f0ff');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(ctx, x + 4 * scale, y + 2 * scale, w - 8 * scale, h * 0.35, 3 * scale);
    ctx.fill();
    ctx.restore();
    if (G.serving) {
      const pulse = 0.35 + 0.25 * Math.sin(G.t * 6);
      ctx.fillStyle = rgba(CYN, pulse * 0.25);
      ctx.beginPath();
      ctx.ellipse(sx(p.x), sy(p.y + 10), (p.w * 0.42) * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawBall(b) {
    if (b.dead) return;
    if (!REDUCE && b.trail) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < b.trail.length; i++) {
        const t = b.trail[i];
        const k = (i + 1) / b.trail.length;
        ctx.fillStyle = rgba(CYN, 0.12 * k);
        ctx.beginPath();
        ctx.arc(sx(t.x), sy(t.y), b.r * k * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.shadowColor = 'rgba(0,240,255,0.8)';
    ctx.shadowBlur = 12 * scale;
    const g = ctx.createRadialGradient(
      sx(b.x - 1.4), sy(b.y - 1.6), 0.4 * scale,
      sx(b.x), sy(b.y), b.r * scale
    );
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, '#e8ffff');
    g.addColorStop(1, '#00c8e0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPowers() {
    for (let i = 0; i < G.powers.length; i++) {
      const p = G.powers[i];
      const wide = p.kind === 'wide';
      const rgb = wide ? GOLD : MAG;
      const x = sx(p.x - p.w * 0.5);
      const y = sy(p.y - p.h * 0.5);
      ctx.save();
      ctx.shadowColor = rgba(rgb, 0.7);
      ctx.shadowBlur = 10 * scale;
      roundRect(ctx, x, y, p.w * scale, p.h * scale, 8 * scale);
      ctx.fillStyle = rgba(rgb, 0.85);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#140814';
      ctx.font = '700 ' + (10 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(wide ? '加长' : '多球', sx(p.x), sy(p.y + 0.5));
      ctx.restore();
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
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.4;
      ctx.strokeStyle = rgba(s.rgb, 0.55 * (1 - k));
      ctx.lineWidth = (2.2 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (8 + k * 22) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawServeHint() {
    if (!G.serving || G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') return;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(G.t * 4);
    ctx.fillStyle = '#d5d2ee';
    ctx.font = '600 ' + (13 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('空格或点击发球', sx(VW * 0.5), sy(G.paddle.y - 58));
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.16);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawDanger() {
    if (G.kind !== 'endless' || G.mode !== 'play') return;
    const y = G.paddle.y - 36;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,61,184,' + (0.18 + 0.12 * Math.sin(G.t * 5)) + ')';
    ctx.setLineDash([6 * scale, 6 * scale]);
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(WALL), sy(y));
    ctx.lineTo(sx(VW - WALL), sy(y));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawBg();
    drawWalls();
    drawDanger();
    for (let i = 0; i < G.bricks.length; i++) drawBrick(G.bricks[i]);
    drawPowers();
    drawPaddle();
    for (let i = 0; i < G.balls.length; i++) drawBall(G.balls[i]);
    drawParticles();
    drawServeHint();
    drawFlash();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const x = (cssX / Math.max(1, rect.width)) * W;
    return (x - ox) / scale;
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startCampaign();
      return;
    }
    if (G.mode === 'win') {
      if (G.layout < LAYOUTS.length - 1) gotoNextLayout();
      else restart();
      return;
    }
    if (G.mode === 'lose') restart();
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'a' || k === 'A') {
      if (down) {
        e.preventDefault();
        if (!e.repeat) toggleAuto();
      }
      return;
    }
    if (k === 'ArrowLeft' || k === 'Left') keys.l = down && !autoOn;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down && !autoOn;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || (k === 'Enter' && overlayOpen()))) {
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      restart();
      return;
    }
    if (autoOn && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'd' || k === 'D' || k === ' ' || k === 'Spacebar' || k === 'ArrowUp')) {
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar' || k === 'ArrowUp') {
      if (overlayOpen()) {
        e.preventDefault();
        primaryAction();
        return;
      }
      if (G.mode === 'play' && G.serving) launch();
    }
  }

  function selfCheckAuto() {
    const xmin = WALL + BALL_R;
    const xmax = VW - WALL - BALL_R;
    if (Math.abs(foldX(100, 200, 0, xmin, xmax) - 100) > 0.05) {
      throw new Error('foldX t=0 should be identity');
    }
    const bounced = foldX(xmax - 2, 400, 0.05, xmin, xmax);
    if (bounced > xmax + 0.2 || bounced < xmin - 0.2) {
      throw new Error('foldX should stay in playfield');
    }

    const oldRand = Math.random;
    let seed = 2026;
    Math.random = function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    autoOn = true;
    autoSpeed = 4;
    G.mode = 'play';
    G.kind = 'campaign';
    G.layout = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.wideT = 0;
    G.paddle.w = PADDLE_W;
    G.paddle.x = VW * 0.5;
    G.paddle.vx = 0;
    G.powers = [];
    G.hits = 0;
    G.ballSpeed = 310;
    G.lock = 0;
    G.t = 0;
    buildLayout(0);
    const startBricks = G.bricks.length;
    if (startBricks < 40) throw new Error('layout 0 should have many bricks');
    serve();
    G.lock = 0;
    autoServeWait = 0;
    launch();
    if (typeof process !== 'undefined' && process.env && process.env.BRICK_OUT_AUTO_LOG) {
      const lx = G.balls[0] ? G.balls[0].x : VW * 0.5;
      const mags = [0.12, 0.22, 0.3, 0.38, 0.46, 0.54, 0.62, 0.74];
      const rows = [];
      for (let i = 0; i < mags.length; i++) {
        rows.push({
          off: mags[i],
          a: Math.round(simShotScore(lx, mags[i])),
          b: Math.round(simShotScore(lx, -mags[i]))
        });
      }
      console.log('aim scores at', Math.round(lx), rows);
    }

    let intercepted = 0;
    let reached = 0;
    let misses = 0;
    let steps = 0;
    let offs = [];
    const limit = 60 * 90;
    while (steps < limit && G.bricks.length > 0 && G.lives > 0) {
      steps += 1;
      G.t += STEP;
      G.lock = Math.max(0, G.lock - STEP);
      autoSteer(STEP);
      if (G.serving) {
        stickServe();
        if (G.lock <= 0) {
          autoServeWait -= STEP;
          if (autoServeWait <= 0) launch();
        }
      } else {
        for (let i = 0; i < G.balls.length; i++) {
          const b = G.balls[i];
          const beforeVy = b.vy;
          const near = b.vy > 0 && b.y > PADDLE_Y - 90 && b.y < PADDLE_Y + 8;
          if (near && Math.abs(b.x - G.paddle.x) <= paddleHalf() + b.r + 10) reached += 1;
          moveBall(b, STEP);
          if (beforeVy > 20 && b.vy < 0) {
            intercepted += 1;
            offs.push(Math.round(((b.x - G.paddle.x) / paddleHalf()) * 100) / 100);
          }
        }
        const live = [];
        for (let i = 0; i < G.balls.length; i++) if (!G.balls[i].dead) live.push(G.balls[i]);
        G.balls = live;
        if (G.balls.length === 0) {
          misses += 1;
          G.lives -= 1;
          if (G.lives <= 0) break;
          serve();
          G.lock = 0;
          autoServeWait = 0;
        }
      }
      for (let i = G.powers.length - 1; i >= 0; i--) {
        const p = G.powers[i];
        p.y += p.vy * STEP;
        if (collectPower(p)) {
          if (p.kind === 'wide') applyWide();
          else applyMulti();
          G.powers.splice(i, 1);
        } else if (p.y - p.h > VH) {
          G.powers.splice(i, 1);
        }
      }
    }

    Math.random = oldRand;
    const cleared = startBricks - G.bricks.length;
    if (typeof process !== 'undefined' && process.env && process.env.BRICK_OUT_AUTO_LOG) {
      console.log('auto self-check', {
        cleared: cleared,
        left: G.bricks.length,
        intercepted: intercepted,
        reached: reached,
        misses: misses,
        steps: steps,
        score: G.score,
        lives: G.lives,
        hits: G.hits,
        offs: offs
      });
    }
    if (reached < 6) throw new Error('AI paddle never reached the ball');
    if (intercepted < 8) throw new Error('AI should return the ball, not only wiggle');
    if (cleared < 22) throw new Error('AI should clear bricks in campaign, not only wiggle');
    if (misses > 2) throw new Error('AI missed too many serves');
  }

  if (!hasDom) {
    selfCheckAuto();
    return;
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    pointer.x = pointerWorldX(e);
    canvas.classList.add('press');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (!autoOn && !overlayOpen() && G.mode === 'play' && G.serving) launch();
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    pointer.x = pointerWorldX(e);
    if (e.pointerType === 'mouse') pointer.hover = true;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove('press');
    if (e.pointerType !== 'mouse') pointer.hover = false;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') pointer.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = false;
    keys.r = false;
  });

  btnCampaign.addEventListener('click', function () {
    primaryAction();
  });
  btnEndless.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startEndless();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    restart();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnAuto.addEventListener('click', function () {
    audio.ensure();
    toggleAuto();
  });
  speedEl.addEventListener('input', function () {
    setAutoSpeed(speedEl.value);
  });
  speedEl.addEventListener('change', function () {
    setAutoSpeed(speedEl.value);
  });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 36; i++) {
      motes.push({
        x: rand(18, VW - 18),
        y: rand(40, VH - 40),
        r: rand(0.5, 1.6),
        a: rand(0.04, 0.14),
        p: rand(0, TAU)
      });
    }
  }

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  loadBest();
  seedMotes();
  resize();
  bootTitle();
  syncHud();
  syncAutoUi();
  syncSpeedUi();

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 5) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
