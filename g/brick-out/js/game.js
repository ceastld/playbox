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
  const OPS = '← → 或拖动挡板 · 空格发球 · M 静音';
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnCampaign = document.getElementById('btn-campaign');
  const btnEndless = document.getElementById('btn-endless');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
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
        const AC = window.AudioContext || window.webkitAudioContext;
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
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
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
    bestEl.textContent = String(G.best);
  }

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    scoreEl.textContent = String(G.score);
    saveBest();
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
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.5;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
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
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(G.best);
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
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    canvas.focus();
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
    scoreEl.textContent = '0';
    scoreAdd.hidden = true;
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
    setHint('左右或拖动挡板 · 空格发球 · 别漏球', '');
    toast(LAYOUTS[0].name, false, true);
    syncHud();
    audio.start();
    canvas.focus();
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
    canvas.focus();
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
    setHint('左右或拖动挡板 · 空格发球 · 别漏球', '');
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
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    if (!REDUCE) stageEl.classList.add('die');
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

  function updatePaddle(dt) {
    const b = paddleBounds();
    const playing = G.mode === 'play' || G.mode === 'title';
    if (!playing) {
      G.paddle.vx *= Math.exp(-dt * 8);
      G.paddle.x = clamp(G.paddle.x + G.paddle.vx * dt, b.lo, b.hi);
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
    if (G.toastT <= 0) toastEl.classList.add('hidden');
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
    updateWide(dt);
    updatePaddle(dt);
    if (G.serving) stickServe();

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
    return !overlay.classList.contains('hidden');
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
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
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
    if (k === 'Enter' || k === ' ' || k === 'Spacebar' || k === 'ArrowUp') {
      if (overlayOpen()) {
        e.preventDefault();
        primaryAction();
        return;
      }
      if (G.mode === 'play' && G.serving) launch();
    }
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
    if (!overlayOpen() && G.mode === 'play' && G.serving) launch();
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
