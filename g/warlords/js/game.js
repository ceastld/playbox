'use strict';

(function () {
  const VW = 720;
  const VH = 720;
  const WALL = 8;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const BALL_R = 6.6;
  const BALL_SPD = 332;
  const RAIN_SPD = 430;
  const BALL_MAX = 560;
  const RAIN_MAX = 680;
  const PAD_R = 208;
  const PAD_LEN = 82;
  const PAD_TH = 12;
  const AMIN = 0.2;
  const AMAX = Math.PI * 0.5 - 0.2;
  const PAD_MAX = 5.15;
  const KING_IN = 32;
  const KING_R = 13;
  const CW = 20;
  const CH = 16;
  const CG = 2;
  const STEP_X = CW + CG;
  const STEP_Y = CH + CG;
  const MARGIN = 10;
  const BEST_KEY = 'playbox-warlords-best';
  const MUTE_KEY = 'playbox-warlords-mute';
  const OPS = '←→ WASD 或鼠标移盾 · 空格接球/发射 · R 重开 · M 静音';
  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 90, 42];
  const LIME = [61, 255, 136];
  const WHT = [255, 244, 230];

  const COLS = [HOT, CYN, MAG, LIME];
  const NAMES = ['你', '青侯', '粉侯', '翠侯'];
  const AI = [
    { max: 2.28, err: 0.32, react: 0.12, hold: 0.5 },
    { max: 2.05, err: 0.4, react: 0.16, hold: 0.68 },
    { max: 1.88, err: 0.46, react: 0.2, hold: 0.84 },
    { max: 2.35, err: 0.28, react: 0.1, hold: 0.48 }
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
  const btnSiege = el('btn-siege');
  const btnRain = el('btn-rain');
  const btnAgain = el('btn-again');
  const btnMenu = el('btn-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const modeLabel = el('mode-label');
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

  const keys = { l: false, r: false, u: false, d: false, space: false };
  const pointer = { down: false, hover: false, x: VW * 0.22, y: VH * 0.78, nearCatch: false, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const motes = [];
  const floaters = [];
  const embers = [];

  const G = {
    mode: 'title',
    kind: 'siege',
    t: 0,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    lastHit: -1,
    bricks: [],
    balls: [],
    lords: [],
    kings: [],
    spd: BALL_SPD,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    toastT: 0,
    freeze: 0,
    lock: 0.5,
    spitWait: 0,
    demoReset: 0,
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
  function mixRgb(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t) | 0,
      (a[1] + (b[1] - a[1]) * t) | 0,
      (a[2] + (b[2] - a[2]) * t) | 0
    ];
  }
  function ballMax() {
    return G.kind === 'rain' ? RAIN_MAX : BALL_MAX;
  }
  function baseSpd() {
    return G.kind === 'rain' ? RAIN_SPD : BALL_SPD;
  }

  function corner(pid) {
    if (pid === 0) return { x: 8, y: VH - 8 };
    if (pid === 1) return { x: VW - 8, y: VH - 8 };
    if (pid === 2) return { x: 8, y: 8 };
    return { x: VW - 8, y: 8 };
  }

  function kingPos(pid) {
    const d = KING_IN;
    if (pid === 0) return { x: d, y: VH - d };
    if (pid === 1) return { x: VW - d, y: VH - d };
    if (pid === 2) return { x: d, y: d };
    return { x: VW - d, y: d };
  }

  function brickWorld(pid, u, v, w, h) {
    if (pid === 0) return { x: u, y: VH - v - h, w: w, h: h };
    if (pid === 1) return { x: VW - u - w, y: VH - v - h, w: w, h: h };
    if (pid === 2) return { x: u, y: v, w: w, h: h };
    return { x: VW - u - w, y: v, w: w, h: h };
  }

  function angleOf(pid, x, y) {
    const c = corner(pid);
    const dx = x - c.x;
    const dy = y - c.y;
    let a;
    if (pid === 0) a = Math.atan2(-dy, dx);
    else if (pid === 1) a = Math.atan2(-dy, -dx);
    else if (pid === 2) a = Math.atan2(dy, dx);
    else a = Math.atan2(dy, -dx);
    return clamp(a, AMIN, AMAX);
  }

  function inQuad(pid, x, y) {
    if (pid === 0) return x <= VW * 0.58 && y >= VH * 0.42;
    if (pid === 1) return x >= VW * 0.42 && y >= VH * 0.42;
    if (pid === 2) return x <= VW * 0.58 && y <= VH * 0.58;
    return x >= VW * 0.42 && y <= VH * 0.58;
  }

  function paddlePose(lord) {
    const a = lord.a;
    const c = corner(lord.id);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    let nx;
    let ny;
    if (lord.id === 0) {
      nx = ca;
      ny = -sa;
    } else if (lord.id === 1) {
      nx = -ca;
      ny = -sa;
    } else if (lord.id === 2) {
      nx = ca;
      ny = sa;
    } else {
      nx = -ca;
      ny = sa;
    }
    return {
      cx: c.x + nx * PAD_R,
      cy: c.y + ny * PAD_R,
      nx: nx,
      ny: ny,
      tx: -ny,
      ty: nx
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
      const n = 0.09;
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
    clang() {
      this.ensure();
      this.beep(980, 0.035, 'square', 0.028, 240);
      this.beep(186, 0.07, 'triangle', 0.05, 92);
      this.noise(0.03, 0.022, 1600);
    },
    wall() {
      this.ensure();
      this.beep(168, 0.035, 'square', 0.016);
    },
    chip() {
      this.ensure();
      this.beep(620, 0.04, 'triangle', 0.032, 380);
    },
    brick(combo) {
      this.ensure();
      const f = Math.min(1480, 500 + combo * 95);
      this.noise(0.045, 0.036, 1100);
      this.beep(f, 0.07, 'sine', 0.048, f * 1.55);
    },
    catch() {
      this.ensure();
      this.beep(420, 0.06, 'sine', 0.04, 680);
    },
    launch() {
      this.ensure();
      this.beep(560, 0.07, 'sine', 0.042, 980);
    },
    king() {
      this.ensure();
      this.noise(0.2, 0.09, 380);
      this.beep(240, 0.24, 'sawtooth', 0.07, 55);
      this.beep(880, 0.12, 'square', 0.035, 180);
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
    while (pips.length < 4) {
      const node = document.createElement('i');
      node.className = 'pip p' + pips.length + ' on';
      pipsEl.appendChild(node);
      pips.push(node);
    }
    for (let i = 0; i < 4; i++) {
      const alive = G.lords[i] && G.lords[i].alive;
      pips[i].className = 'pip p' + i + (alive ? ' on' : ' gone');
    }
  }

  function kindName() {
    return G.kind === 'rain' ? '火雨' : '围城';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.mode === 'title' ? 0 : G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (!modeLabel || !tagLabel) return;
    if (G.mode === 'title') {
      modeLabel.textContent = '城砖';
      tagLabel.textContent = 'WARL';
    } else {
      modeLabel.textContent = kindName();
      tagLabel.textContent = G.combo >= 2 ? '×' + G.combo : 'WARL';
    }
    const win = G.mode === 'win';
    const lose = G.mode === 'lose';
    modeLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('hot', win || G.combo >= 2);
    tagLabel.classList.toggle('warn', lose);
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showTitle() {
    G.mode = 'title';
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'WARL';
    ovTitle.textContent = '城砖';
    ovLead.textContent = '四角堡垒。盾牌护王，火球砸砖，击中国王即出局。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    setHint('你在左下 · 移盾挡火球 · 空格接住再甩出去 · 最后一座城获胜');
    syncHud();
  }

  function showEnd(win) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', win);
    panel.classList.toggle('lose', !win);
    ovKicker.textContent = win ? 'WIN' : 'FALL';
    ovTitle.textContent = win ? '独霸' : '王崩了';
    ovLead.textContent = win
      ? '四城只剩你。得分 ' + G.score + '。'
      : '火球砸中了你的王。得分 ' + G.score + '。';
    ovOps.textContent = 'R 再来 · 换模式回标题';
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    setHint(win ? '再来一局' : '再来一局', win ? 'hot' : 'warn');
    syncHud();
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(ms) {
    if (REDUCE) return;
    G.freeze = Math.max(G.freeze, ms / 1000);
  }

  function bumpStage() {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 5);
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb
      });
    }
  }

  function popSpark(x, y, rgb, big) {
    if (REDUCE) return;
    sparks.push({
      x: x,
      y: y,
      t: 0,
      rgb: rgb,
      max: big ? 0.55 : 0.38,
      r0: big ? 14 : 7,
      r1: big ? 78 : 26
    });
    if (sparks.length > 14) sparks.shift();
  }

  function popNum(x, y, text, rgb, big) {
    floaters.push({
      x: x,
      y: y,
      text: text,
      rgb: rgb,
      t: 0,
      life: big ? 0.9 : 0.68,
      big: !!big
    });
    if (floaters.length > 18) floaters.shift();
  }

  function makeLord(id) {
    return {
      id: id,
      name: NAMES[id],
      rgb: COLS[id],
      alive: true,
      a: id % 2 === 0 ? AMIN + 0.12 : AMAX - 0.12,
      va: 0,
      squash: 0,
      wantCatch: false,
      heldT: 0,
      cool: 0,
      aimA: id % 2 === 0 ? AMIN + 0.12 : AMAX - 0.12,
      reactT: 0,
      miss: 0,
      missT: 0
    };
  }

  function addBrick(pid, col, row, hp, layer) {
    const u = MARGIN + col * STEP_X;
    const v = MARGIN + row * STEP_Y;
    const pos = brickWorld(pid, u, v, CW, CH);
    const base = COLS[pid];
    const rgb = layer <= 1 ? mixRgb(base, GOLD, 0.28) : mixRgb(base, [30, 16, 22], 0.08);
    G.bricks.push({
      x: pos.x,
      y: pos.y,
      w: CW,
      h: CH,
      hp: hp,
      max: hp,
      owner: pid,
      layer: layer,
      rgb: rgb,
      flash: 0
    });
  }

  function buildCastles() {
    G.bricks = [];
    G.kings = [];
    const layers = [2, 3, 4, 5];
    const rain = G.kind === 'rain';
    for (let pid = 0; pid < 4; pid++) {
      const kp = kingPos(pid);
      G.kings.push({ x: kp.x, y: kp.y, r: KING_R, pulse: rand(0, TAU) });
      for (let li = 0; li < layers.length; li++) {
        const m = layers[li];
        const hp = rain ? 1 : (li <= 1 ? 2 : 1);
        for (let row = 0; row <= m; row++) addBrick(pid, m, row, hp, li);
        for (let col = 0; col < m; col++) addBrick(pid, col, m, hp, li);
      }
    }
  }

  function brickCount(pid) {
    let n = 0;
    for (let i = 0; i < G.bricks.length; i++) {
      if (G.bricks[i].owner === pid && G.bricks[i].hp > 0) n += 1;
    }
    return n;
  }

  function livingCount() {
    let n = 0;
    for (let i = 0; i < 4; i++) if (G.lords[i] && G.lords[i].alive) n += 1;
    return n;
  }

  function hasHeld(pid) {
    for (let i = 0; i < G.balls.length; i++) {
      if (G.balls[i].held === pid) return true;
    }
    return false;
  }

  function makeBall(x, y, vx, vy) {
    return {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: BALL_R,
      held: -1,
      dead: false,
      trail: [],
      cool: 0,
      hot: G.kind === 'rain',
      padCool: 0
    };
  }

  function spawnBall(ang, spd) {
    const b = makeBall(
      VW * 0.5 + Math.cos(ang) * 18,
      VH * 0.5 + Math.sin(ang) * 18,
      Math.cos(ang) * spd,
      Math.sin(ang) * spd
    );
    G.balls.push(b);
    emit(8, {
      x: b.x, y: b.y, j: 8,
      vx0: -80, vx1: 80, vy0: -80, vy1: 80,
      life: 0.32, r0: 1, r1: 2.4, rgb: b.hot ? HOT : GOLD
    });
  }

  function spitBalls(n) {
    const count = n || (G.kind === 'rain' ? 2 : 1);
    const spd = baseSpd();
    G.spd = Math.max(G.spd, spd);
    const prey = [];
    for (let i = 0; i < 4; i++) if (G.lords[i] && G.lords[i].alive) prey.push(i);
    const target = prey.length ? G.kings[prey[(Math.random() * prey.length) | 0]] : null;
    const base = target
      ? Math.atan2(target.y - VH * 0.5, target.x - VW * 0.5) + rand(-0.38, 0.38)
      : rand(0.2, TAU);
    for (let i = 0; i < count; i++) {
      const ang = base + i * (TAU / count) + (i ? rand(-0.2, 0.2) : 0);
      spawnBall(ang, spd);
    }
    if (G.mode === 'play' || G.mode === 'title') audio.launch();
  }

  function keepSpeed(b, spd) {
    const cap = ballMax();
    const s = clamp(spd, baseSpd() * 0.82, cap);
    const minC = s * 0.2;
    if (Math.abs(b.vx) < minC) b.vx = (b.vx < 0 ? -1 : 1) * minC;
    if (Math.abs(b.vy) < minC) b.vy = (b.vy < 0 ? -1 : 1) * minC;
    const n = hypot(b.vx, b.vy) || 1;
    b.vx = b.vx / n * s;
    b.vy = b.vy / n * s;
  }

  function stickHeld(b, lord) {
    const pose = paddlePose(lord);
    const extra = PAD_TH * 0.5 + b.r + 3;
    b.x = pose.cx + pose.nx * extra;
    b.y = pose.cy + pose.ny * extra;
    b.vx = 0;
    b.vy = 0;
  }

  function launchHeld(lord) {
    if (!lord || !lord.alive) return;
    const pose = paddlePose(lord);
    const spd = Math.min(ballMax(), Math.max(G.spd * 1.08, baseSpd()));
    let shot = false;
    for (let i = 0; i < G.balls.length; i++) {
      const b = G.balls[i];
      if (b.held !== lord.id) continue;
      b.held = -1;
      b.padCool = 0.16;
      const spin = lord.va * PAD_R * 0.18;
      b.vx = pose.nx * spd + pose.tx * spin;
      b.vy = pose.ny * spd + pose.ty * spin;
      keepSpeed(b, spd);
      shot = true;
    }
    if (!shot) return;
    lord.heldT = 0;
    lord.cool = 0.18;
    lord.squash = 1;
    G.spd = Math.min(ballMax(), Math.max(G.spd, spd));
    if (G.mode === 'play' && lord.id === 0) audio.launch();
    emit(7, {
      x: pose.cx + pose.nx * 10, y: pose.cy + pose.ny * 10, j: 6,
      vx0: pose.nx * 40, vx1: pose.nx * 140,
      vy0: pose.ny * 40, vy1: pose.ny * 140,
      life: 0.28, r0: 0.8, r1: 2.2, rgb: lord.rgb
    });
  }

  function playerWantCatch() {
    if (keys.space) return true;
    if (pointer.down && pointer.nearCatch) return true;
    return false;
  }

  function wantCatch(pid) {
    if (pid === 0 && G.mode === 'play') return playerWantCatch();
    return G.lords[pid].wantCatch;
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

  function hitPaddle(b, pose) {
    const dx = b.x - pose.cx;
    const dy = b.y - pose.cy;
    const along = dx * pose.tx + dy * pose.ty;
    const out = dx * pose.nx + dy * pose.ny;
    const hl = PAD_LEN * 0.5;
    const ht = PAD_TH * 0.5 + 1.2;
    const cl = clamp(along, -hl, hl);
    const co = clamp(out, -ht, ht);
    const qx = pose.cx + pose.tx * cl + pose.nx * co;
    const qy = pose.cy + pose.ty * cl + pose.ny * co;
    const ex = b.x - qx;
    const ey = b.y - qy;
    const d2 = ex * ex + ey * ey;
    if (d2 >= b.r * b.r) return null;
    return { along: along / hl, out: out };
  }

  function bouncePaddle(b, lord, pose, hit) {
    const off = clamp(hit.along, -1, 1);
    let rx = pose.nx + pose.tx * off * 0.82;
    let ry = pose.ny + pose.ty * off * 0.82;
    const n = hypot(rx, ry) || 1;
    rx /= n;
    ry /= n;
    const incoming = hypot(b.vx, b.vy);
    const spd = Math.min(ballMax(), Math.max(G.spd, incoming) * 1.03);
    const alongDist = off * PAD_LEN * 0.42;
    b.x = pose.cx + pose.nx * (PAD_TH * 0.5 + b.r + 1.2) + pose.tx * alongDist;
    b.y = pose.cy + pose.ny * (PAD_TH * 0.5 + b.r + 1.2) + pose.ty * alongDist;
    b.vx = rx * spd;
    b.vy = ry * spd;
    keepSpeed(b, spd);
    b.padCool = 0.12;
    lord.squash = 1;
    G.spd = spd;
    G.lastHit = lord.id;
    if (lord.id !== 0) G.combo = 0;
    if (G.mode === 'play') audio.clang();
    emit(7, {
      x: b.x, y: b.y, j: 6,
      vx0: pose.nx * 20, vx1: pose.nx * 110,
      vy0: pose.ny * 20, vy1: pose.ny * 110,
      life: 0.28, r0: 0.7, r1: 2, rgb: lord.rgb
    });
    G.shake = REDUCE ? 0 : Math.max(G.shake, 3.2);
  }

  function catchBall(b, lord, pose) {
    b.held = lord.id;
    b.vx = 0;
    b.vy = 0;
    b.padCool = 0.2;
    lord.heldT = 0;
    lord.squash = 0.7;
    G.lastHit = lord.id;
    stickHeld(b, lord);
    if (G.mode === 'play' && lord.id === 0) {
      audio.catch();
      toast('接住了', false, true);
    }
    emit(6, {
      x: pose.cx, y: pose.cy, j: 8,
      vx0: -60, vx1: 60, vy0: -60, vy1: 60,
      life: 0.3, r0: 0.8, r1: 2, rgb: GOLD
    });
  }

  function damageBrick(br) {
    br.hp -= 1;
    br.flash = 0.14;
    const cx = br.x + br.w * 0.5;
    const cy = br.y + br.h * 0.5;
    const play = G.mode === 'play' && G.lastHit === 0;
    if (br.hp > 0) {
      if (play) addScore(10);
      if (G.mode !== 'title') audio.chip();
      emit(6, {
        x: cx, y: cy, j: 8,
        vx0: -70, vx1: 70, vy0: -80, vy1: 50,
        life: 0.28, r0: 0.7, r1: 1.8, rgb: GOLD
      });
      hitStop(32);
      G.shake = REDUCE ? 0 : Math.max(G.shake, 2.2);
      return;
    }
    if (play) {
      G.comboT = 0.95;
      G.combo = Math.min(8, G.combo + 1);
      const pts = (20 + (br.max >= 2 ? 10 : 0)) * G.combo;
      addScore(pts);
      syncHud();
      popNum(cx, cy, G.combo > 1 ? '×' + G.combo : '+' + pts, G.combo > 2 ? GOLD : WHT, G.combo >= 3);
      if (G.combo === 4) toast('连击 ×4', false, true);
      else if (G.combo === 6) toast('火势 ×6', false, true);
      else if (G.combo >= 8) toast('燎原 ×8', false, true);
    }
    if (G.mode !== 'title') audio.brick(Math.max(1, G.combo));
    popSpark(cx, cy, br.rgb, false);
    emit(14, {
      x: cx, y: cy, j: 12,
      vx0: -160, vx1: 160, vy0: -170, vy1: 70,
      life: 0.42, r0: 1, r1: 3.2, rgb: br.rgb
    });
    hitStop(46);
    G.shake = REDUCE ? 0 : Math.max(G.shake, 4.5);
    G.hits += 1;
    if (G.hits % 7 === 0) {
      G.spd = Math.min(ballMax(), G.spd * 1.03);
    }
  }

  function explodeCastle(pid) {
    for (let i = G.bricks.length - 1; i >= 0; i--) {
      const br = G.bricks[i];
      if (br.owner !== pid || br.hp <= 0) continue;
      const cx = br.x + br.w * 0.5;
      const cy = br.y + br.h * 0.5;
      emit(5, {
        x: cx, y: cy, j: 6,
        vx0: -120, vx1: 120, vy0: -140, vy1: 80,
        life: 0.4, r0: 0.8, r1: 2.6, rgb: br.rgb
      });
      G.bricks.splice(i, 1);
    }
  }

  function pickPrey(self) {
    let best = -1;
    let bestN = 1e9;
    for (let i = 0; i < 4; i++) {
      if (i === self || !G.lords[i].alive) continue;
      let n = brickCount(i);
      if (i === 0) n -= 2;
      if (n < bestN) {
        bestN = n;
        best = i;
      }
    }
    return best;
  }

  function killLord(pid) {
    const lord = G.lords[pid];
    if (!lord || !lord.alive) return;
    lord.alive = false;
    const k = G.kings[pid];
    explodeCastle(pid);
    popSpark(k.x, k.y, lord.rgb, true);
    popSpark(k.x, k.y, GOLD, true);
    emit(42, {
      x: k.x, y: k.y, j: 18,
      vx0: -240, vx1: 240, vy0: -240, vy1: 240,
      life: 0.7, r0: 1.4, r1: 4.4, rgb: lord.rgb
    });
    emit(18, {
      x: k.x, y: k.y, j: 10,
      vx0: -180, vx1: 180, vy0: -200, vy1: 80,
      life: 0.55, r0: 1, r1: 3, rgb: GOLD
    });
    popNum(k.x, k.y, '崩', GOLD, true);
    hitStop(78);
    G.shake = REDUCE ? 0 : 14;
    G.flash = 0.48;
    G.flashRgb = lord.rgb;
    bumpStage();
    if (G.mode !== 'title') audio.king();
    for (let i = 0; i < G.balls.length; i++) {
      if (G.balls[i].held === pid) {
        G.balls[i].held = -1;
        const ang = Math.atan2(VH * 0.5 - G.balls[i].y, VW * 0.5 - G.balls[i].x);
        const spd = Math.max(G.spd, baseSpd());
        G.balls[i].vx = Math.cos(ang) * spd;
        G.balls[i].vy = Math.sin(ang) * spd;
      }
    }
    if (G.mode === 'play') {
      toast(lord.name + ' 出局', pid === 0, pid !== 0);
      if (G.lastHit === 0 && pid !== 0) {
        const pts = 420 + G.combo * 50;
        addScore(pts);
        popNum(k.x, k.y - 18, '+' + pts, GOLD, true);
      }
      syncHud();
      if (pid === 0) {
        loseRun();
        return;
      }
      if (livingCount() <= 1 && G.lords[0].alive) {
        winRun();
        return;
      }
      if (G.kind === 'rain' && G.balls.length < 3) G.spitWait = 0.32;
    } else {
      toast(lord.name + ' 出局', pid === 0, pid !== 0);
      if (livingCount() <= 1) G.demoReset = 1.15;
      syncHud();
    }
  }

  function winRun() {
    G.mode = 'win';
    G.score += 800;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    audio.win();
    G.flash = 0.5;
    G.flashRgb = GOLD;
    showEnd(true);
  }

  function loseRun() {
    G.mode = 'lose';
    audio.lose();
    G.flash = 0.5;
    G.flashRgb = MAG;
    showEnd(false);
  }

  function predictIntercept(ball, pid) {
    let x = ball.x;
    let y = ball.y;
    let vx = ball.vx;
    let vy = ball.vy;
    const r = ball.r;
    const xmin = WALL + r;
    const xmax = VW - WALL - r;
    const ymin = WALL + r;
    const ymax = VH - WALL - r;
    const c = corner(pid);
    let t = 0;
    for (let i = 0; i < 52; i++) {
      const tx = vx > 0.15 ? (xmax - x) / vx : vx < -0.15 ? (xmin - x) / vx : 99;
      const ty = vy > 0.15 ? (ymax - y) / vy : vy < -0.15 ? (ymin - y) / vy : 99;
      let dt = Math.min(tx, ty, 0.065);
      if (!(dt > 0.003)) dt = 0.02;
      const nx = x + vx * dt;
      const ny = y + vy * dt;
      t += dt;
      const d0 = hypot(x - c.x, y - c.y);
      const d1 = hypot(nx - c.x, ny - c.y);
      if (((d0 - PAD_R) * (d1 - PAD_R) <= 0 || Math.abs(d1 - PAD_R) < 28) && inQuad(pid, nx, ny)) {
        return { t: t, a: angleOf(pid, nx, ny) };
      }
      x = nx;
      y = ny;
      if (x > xmax) {
        x = xmax;
        vx = -Math.abs(vx);
      } else if (x < xmin) {
        x = xmin;
        vx = Math.abs(vx);
      }
      if (y > ymax) {
        y = ymax;
        vy = -Math.abs(vy);
      } else if (y < ymin) {
        y = ymin;
        vy = Math.abs(vy);
      }
      if (t > 1.7) break;
    }
    return null;
  }

  function updateAi(lord, dt) {
    const spec = AI[lord.id];
    let best = null;
    let bestScore = -1e9;
    const c = corner(lord.id);
    for (let i = 0; i < G.balls.length; i++) {
      const b = G.balls[i];
      if (b.dead || b.held >= 0) continue;
      const pred = predictIntercept(b, lord.id);
      const dist = hypot(b.x - c.x, b.y - c.y);
      const incoming = (b.x - c.x) * b.vx + (b.y - c.y) * b.vy < 0;
      let score = incoming ? 90 : -20;
      if (pred && incoming) score += 380 - pred.t * 210;
      if (incoming && dist < PAD_R + 110) score += 160 - dist * 0.3;
      if (inQuad(lord.id, b.x, b.y) && incoming) score += 40;
      if (score > bestScore) {
        bestScore = score;
        best = { b: b, pred: pred, incoming: incoming, dist: dist };
      }
    }
    lord.missT = Math.max(0, (lord.missT || 0) - dt);
    if (lord.missT <= 0) {
      lord.miss = (Math.random() * 2 - 1) * spec.err;
      lord.missT = 0.46 + spec.react;
    }
    let targetA = (lord.id % 2 === 0 ? AMIN + 0.18 : AMAX - 0.18) + Math.sin(G.t * 0.55 + lord.id) * 0.1;
    if (best && best.pred && best.incoming) {
      targetA = best.pred.a + lord.miss;
    } else if (best && best.incoming) {
      targetA = angleOf(lord.id, best.b.x, best.b.y) + lord.miss;
    }
    targetA = clamp(targetA, AMIN, AMAX);
    lord.reactT -= dt;
    if (lord.reactT <= 0) {
      lord.aimA = targetA;
      lord.reactT = spec.react * (best && best.dist < PAD_R + 50 ? 0.45 : 1);
    }
    targetA = lord.aimA;
    lord.wantCatch = false;
    if (best && best.pred && best.pred.t < 0.14 && !hasHeld(lord.id) && lord.cool <= 0) {
      const prey = pickPrey(lord.id);
      lord.wantCatch = prey >= 0 && brickCount(prey) <= 3;
    }
    if (hasHeld(lord.id)) {
      const prey = pickPrey(lord.id);
      if (prey >= 0) {
        const k = G.kings[prey];
        targetA = angleOf(lord.id, k.x, k.y);
        lord.aimA = targetA;
      }
      lord.heldT += dt;
      if (lord.heldT > spec.hold && Math.abs(lord.a - targetA) < 0.18) launchHeld(lord);
      else if (lord.heldT > 2.2) launchHeld(lord);
    }
    const max = spec.max;
    const da = clamp(targetA - lord.a, -max * dt, max * dt);
    lord.va = dt > 0 ? da / dt : 0;
    lord.a = clamp(lord.a + da, AMIN, AMAX);
  }

  function updatePlayer(lord, dt) {
    lord.va = 0;
    if (pointer.down && ballNearPaddle()) pointer.nearCatch = true;
    if (pointer.hover || pointer.down) {
      const target = angleOf(0, pointer.x, pointer.y);
      const k = 1 - Math.exp(-dt * 18);
      const next = lord.a + (target - lord.a) * k;
      lord.va = dt > 0 ? (next - lord.a) / dt : 0;
      lord.a = clamp(next, AMIN, AMAX);
    } else {
      let dir = 0;
      if (keys.l || keys.u) dir += 1;
      if (keys.r || keys.d) dir -= 1;
      lord.va = dir * PAD_MAX;
      lord.a = clamp(lord.a + lord.va * dt, AMIN, AMAX);
    }
    if (hasHeld(lord.id)) {
      lord.heldT += dt;
      if (lord.heldT > 2.6) launchHeld(lord);
    }
  }

  function updatePaddles(dt) {
    for (let i = 0; i < 4; i++) {
      const lord = G.lords[i];
      if (!lord.alive) continue;
      lord.cool = Math.max(0, lord.cool - dt);
      lord.squash = Math.max(0, lord.squash - dt * 8);
      const ai = i !== 0 || G.mode === 'title';
      if (ai) updateAi(lord, dt);
      else if (G.mode === 'play') updatePlayer(lord, dt);
    }
    for (let i = 0; i < G.balls.length; i++) {
      const b = G.balls[i];
      if (b.held < 0) continue;
      const lord = G.lords[b.held];
      if (!lord || !lord.alive) {
        b.held = -1;
        continue;
      }
      stickHeld(b, lord);
    }
  }

  function moveBall(b, dt) {
    if (b.held >= 0 || b.dead) return;
    b.cool = Math.max(0, b.cool - dt);
    b.padCool = Math.max(0, b.padCool - dt);
    const dist = hypot(b.vx, b.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / 4.2));
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
      if (b.y - b.r < WALL) {
        b.y = WALL + b.r;
        b.vy = Math.abs(b.vy);
        if (G.mode === 'play') audio.wall();
      } else if (b.y + b.r > VH - WALL) {
        b.y = VH - WALL - b.r;
        b.vy = -Math.abs(b.vy);
        if (G.mode === 'play') audio.wall();
      }
      keepSpeed(b, Math.min(ballMax(), Math.max(baseSpd() * 0.9, hypot(b.vx, b.vy))));

      if (b.padCool <= 0) {
        for (let p = 0; p < 4; p++) {
          const lord = G.lords[p];
          if (!lord.alive || lord.cool > 0) continue;
          const pose = paddlePose(lord);
          const hit = hitPaddle(b, pose);
          if (!hit) continue;
          if (wantCatch(p) && !hasHeld(p)) {
            catchBall(b, lord, pose);
            return;
          }
          bouncePaddle(b, lord, pose, hit);
          break;
        }
      }
      if (b.held >= 0) return;

      let hitI = -1;
      let best = 1e9;
      for (let i = 0; i < G.bricks.length; i++) {
        const br = G.bricks[i];
        if (br.hp <= 0) continue;
        if (!G.lords[br.owner] || !G.lords[br.owner].alive) continue;
        if (!circleRect(b, br)) continue;
        const dx = b.x - (br.x + br.w * 0.5);
        const dy = b.y - (br.y + br.h * 0.5);
        const d2 = dx * dx + dy * dy;
        if (d2 < best) {
          best = d2;
          hitI = i;
        }
      }
      if (hitI >= 0) {
        const br = G.bricks[hitI];
        bounceBrick(b, br);
        keepSpeed(b, Math.max(G.spd * 0.96, hypot(b.vx, b.vy)));
        damageBrick(br);
        if (br.hp <= 0) G.bricks.splice(hitI, 1);
        continue;
      }

      for (let p = 0; p < 4; p++) {
        const lord = G.lords[p];
        if (!lord.alive) continue;
        const k = G.kings[p];
        const dx = b.x - k.x;
        const dy = b.y - k.y;
        const rr = b.r + k.r;
        if (dx * dx + dy * dy < rr * rr) {
          killLord(p);
          return;
        }
      }
    }
  }

  function recordTrails() {
    if (REDUCE) return;
    for (let i = 0; i < G.balls.length; i++) {
      const b = G.balls[i];
      if (b.dead || b.held >= 0) {
        b.trail.length = 0;
        continue;
      }
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > (b.hot ? 14 : 10)) b.trail.shift();
    }
  }

  function updateFx(dt) {
    G.shake *= Math.exp(-dt * 9);
    G.flash = Math.max(0, G.flash - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    G.comboT = Math.max(0, G.comboT - dt);
    if (G.comboT <= 0 && G.combo > 0) {
      G.combo = 0;
      syncHud();
    }
    for (let i = G.bricks.length - 1; i >= 0; i--) {
      G.bricks[i].flash = Math.max(0, G.bricks[i].flash - dt);
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.3);
      q.vy *= Math.exp(-dt * 1.3);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > (sparks[i].max || 0.4)) sparks.splice(i, 1);
    }
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.t += dt;
      f.y -= 36 * dt;
      if (f.t > f.life) floaters.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y += Math.sin(G.t * 0.6 + m.p) * 4 * dt;
    }
    if (embers.length < 18 && !REDUCE) {
      embers.push({
        x: VW * 0.5 + rand(-10, 10),
        y: VH * 0.5 + rand(-6, 8),
        vx: rand(-18, 18),
        vy: rand(-40, -8),
        life: rand(0.4, 0.9),
        max: 0.9,
        r: rand(0.8, 2.1)
      });
    }
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.life -= dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.life <= 0) embers.splice(i, 1);
    }
  }

  function resetField() {
    G.lords = [makeLord(0), makeLord(1), makeLord(2), makeLord(3)];
    G.balls = [];
    G.bricks = [];
    G.kings = [];
    G.lastHit = -1;
    G.combo = 0;
    G.comboT = 0;
    G.hits = 0;
    G.spd = baseSpd();
    G.shake = 0;
    G.flash = 0;
    G.freeze = 0;
    G.lock = 0.48;
    G.spitWait = 0;
    G.demoReset = 0;
    particles.length = 0;
    sparks.length = 0;
    floaters.length = 0;
    buildCastles();
  }

  function bootDemo() {
    G.kind = G.kind === 'rain' ? 'rain' : 'siege';
    resetField();
    G.mode = 'title';
    G.score = 0;
    G.lock = 0.35;
    syncHud();
  }

  function startMatch(kind) {
    G.kind = kind === 'rain' ? 'rain' : 'siege';
    G.mode = 'play';
    G.score = 0;
    keys.space = false;
    pointer.nearCatch = false;
    resetField();
    hideOverlay();
    audio.start();
    toast(kindName(), false, G.kind === 'rain');
    setHint(G.kind === 'rain'
      ? '火雨 · 球更快，砸碎即碎 · 空格接住再甩'
      : '围城 · 内层要两击 · 空格接住再甩');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startMatch('siege');
      return;
    }
    startMatch(G.kind);
  }

  function goMenu() {
    audio.ensure();
    bootDemo();
    showTitle();
  }

  function update(dt) {
    G.t += dt;
    if (G.demoReset > 0 && G.mode === 'title') {
      G.demoReset -= dt;
      if (G.demoReset <= 0) bootDemo();
    }
    if (G.freeze > 0) {
      G.freeze = Math.max(0, G.freeze - dt);
      updatePaddles(dt);
      updateFx(dt);
      recordTrails();
      return;
    }
    G.lock = Math.max(0, G.lock - dt);
    updatePaddles(dt);

    if (G.mode === 'play' || G.mode === 'title') {
      if (G.spitWait > 0) {
        G.spitWait -= dt;
        if (G.spitWait <= 0) {
          G.spitWait = 0;
          if (G.mode === 'play' && G.kind === 'rain' && G.balls.length < 3) spitBalls(1);
        }
      }
      if (G.lock <= 0 && G.balls.length === 0) spitBalls();
      for (let i = 0; i < G.balls.length; i++) moveBall(G.balls[i], dt);
    }

    recordTrails();
    updateFx(dt);
    if (G.combo >= 2) syncHud();
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
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    g.addColorStop(0, '#14080e');
    g.addColorStop(0.45, '#08040c');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(VW * 0.5), sy(VH * 0.5), 20 * scale, sx(VW * 0.5), sy(VH * 0.5), 380 * scale);
    vg.addColorStop(0, 'rgba(255, 90, 42, 0.07)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < 4; i++) {
      if (!G.lords[i] || !G.lords[i].alive) continue;
      const k = G.kings[i];
      const rg = ctx.createRadialGradient(sx(k.x), sy(k.y), 4 * scale, sx(k.x), sy(k.y), 90 * scale);
      rg.addColorStop(0, rgba(COLS[i], 0.16));
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(sx(k.x - 90), sy(k.y - 90), 180 * scale, 180 * scale);
    }

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 90, 42, 0.08)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(WALL + 8), sy(WALL + 8));
    ctx.lineTo(sx(VW - WALL - 8), sy(VH - WALL - 8));
    ctx.moveTo(sx(VW - WALL - 8), sy(WALL + 8));
    ctx.lineTo(sx(WALL + 8), sy(VH - WALL - 8));
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.5 + 0.5 * Math.sin(G.t * 1.3 + m.p));
      ctx.fillStyle = rgba(i % 3 === 0 ? HOT : i % 3 === 1 ? GOLD : MAG, a);
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
    roundRect(ctx, sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale, 14 * scale);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.18)';
    ctx.lineWidth = 1.2 * scale;
    roundRect(ctx, sx(9), sy(9), (VW - 18) * scale, (VH - 18) * scale, 11 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function drawBrazier() {
    const cx = VW * 0.5;
    const cy = VH * 0.5;
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 6);
    ctx.save();
    ctx.shadowColor = 'rgba(255, 90, 42, 0.7)';
    ctx.shadowBlur = 18 * scale;
    ctx.fillStyle = rgba(HOT, 0.22 + pulse * 0.12);
    ctx.beginPath();
    ctx.ellipse(sx(cx), sy(cy), 22 * scale, 14 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    const g = ctx.createRadialGradient(sx(cx), sy(cy - 4), 1 * scale, sx(cx), sy(cy), 16 * scale);
    g.addColorStop(0, '#fff6d8');
    g.addColorStop(0.35, '#ffe36b');
    g.addColorStop(1, rgba(HOT, 0.9));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx(cx), sy(cy), (7 + pulse * 1.4) * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      ctx.fillStyle = rgba(i % 2 ? GOLD : HOT, clamp(e.life / e.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), e.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawArc(lord) {
    if (!lord.alive) return;
    const c = corner(lord.id);
    let a0;
    let a1;
    let ccw = true;
    if (lord.id === 0) {
      a0 = -AMIN;
      a1 = -AMAX;
    } else if (lord.id === 1) {
      a0 = Math.PI + AMIN;
      a1 = Math.PI + AMAX;
      ccw = false;
    } else if (lord.id === 2) {
      a0 = AMIN;
      a1 = AMAX;
      ccw = false;
    } else {
      a0 = -Math.PI - AMIN;
      a1 = -Math.PI - AMAX;
    }
    ctx.save();
    ctx.strokeStyle = rgba(lord.rgb, lord.id === 0 ? 0.28 : 0.1);
    ctx.lineWidth = (lord.id === 0 ? 1.6 : 1) * scale;
    ctx.setLineDash([5 * scale, 7 * scale]);
    ctx.beginPath();
    ctx.arc(sx(c.x), sy(c.y), PAD_R * scale, a0, a1, ccw);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawBrick(br) {
    const x = sx(br.x);
    const y = sy(br.y);
    const w = br.w * scale;
    const h = br.h * scale;
    const rgb = br.hp >= 2 ? mixRgb(br.rgb, GOLD, 0.35) : br.rgb;
    const a = br.hp >= 2 ? 1 : br.max >= 2 ? 0.78 : 0.95;
    ctx.save();
    roundRect(ctx, x, y, w, h, 3.2 * scale);
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, rgba(rgb, 0.95 * a));
    g.addColorStop(0.45, rgba(rgb, 0.55 * a));
    g.addColorStop(1, rgba([rgb[0] * 0.35 | 0, rgb[1] * 0.28 | 0, rgb[2] * 0.35 | 0], 0.95 * a));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgba(rgb, 0.85);
    ctx.lineWidth = (br.hp >= 2 ? 1.5 : 1) * scale;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,' + (br.hp >= 2 ? 0.22 : 0.12) + ')';
    roundRect(ctx, x + 1.6 * scale, y + 1.2 * scale, w - 3.2 * scale, h * 0.32, 1.6 * scale);
    ctx.fill();
    if (br.max >= 2 && br.hp === 1) {
      ctx.strokeStyle = 'rgba(8,4,12,0.5)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.2, y + h * 0.28);
      ctx.lineTo(x + w * 0.48, y + h * 0.72);
      ctx.lineTo(x + w * 0.78, y + h * 0.34);
      ctx.stroke();
    }
    if (br.flash > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + (br.flash * 3.1) + ')';
      roundRect(ctx, x, y, w, h, 3.2 * scale);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawKing(pid) {
    const lord = G.lords[pid];
    if (!lord || !lord.alive) return;
    const k = G.kings[pid];
    const pulse = 0.7 + 0.3 * Math.sin(G.t * 4 + k.pulse);
    ctx.save();
    ctx.shadowColor = rgba(lord.rgb, 0.7);
    ctx.shadowBlur = (10 + pulse * 6) * scale;
    const g = ctx.createRadialGradient(
      sx(k.x - 2), sy(k.y - 3), 1 * scale,
      sx(k.x), sy(k.y), KING_R * scale
    );
    g.addColorStop(0, '#fff6e0');
    g.addColorStop(0.45, rgba(mixRgb(lord.rgb, GOLD, 0.4), 1));
    g.addColorStop(1, rgba(lord.rgb, 1));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx(k.x), sy(k.y), KING_R * scale, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(GOLD, 0.95);
    const up = pid <= 1 ? -1 : 1;
    const tip = KING_R + 5;
    ctx.beginPath();
    ctx.moveTo(sx(k.x - 7), sy(k.y + up * 2));
    ctx.lineTo(sx(k.x - 4), sy(k.y + up * tip));
    ctx.lineTo(sx(k.x), sy(k.y + up * 1));
    ctx.lineTo(sx(k.x + 4), sy(k.y + up * tip));
    ctx.lineTo(sx(k.x + 7), sy(k.y + up * 2));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a0c10';
    ctx.beginPath();
    ctx.arc(sx(k.x - 3.2), sy(k.y + (pid <= 1 ? -1 : 1) * 1.5), 1.15 * scale, 0, TAU);
    ctx.arc(sx(k.x + 3.2), sy(k.y + (pid <= 1 ? -1 : 1) * 1.5), 1.15 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = rgba(lord.rgb, 0.7);
    ctx.font = '700 ' + (11 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = pid === 0 || pid === 2 ? 'left' : 'right';
    ctx.textBaseline = pid <= 1 ? 'bottom' : 'top';
    const lx = pid === 0 || pid === 2 ? k.x + 16 : k.x - 16;
    const ly = pid <= 1 ? k.y + 22 : k.y - 22;
    ctx.fillText(lord.name, sx(lx), sy(ly));
    ctx.restore();
  }

  function drawPaddle(lord) {
    if (!lord.alive) return;
    const pose = paddlePose(lord);
    const squash = 1 - lord.squash * 0.32;
    const th = PAD_TH * squash;
    const ang = Math.atan2(pose.ny, pose.nx);
    ctx.save();
    ctx.translate(sx(pose.cx), sy(pose.cy));
    ctx.rotate(ang);
    ctx.shadowColor = rgba(lord.rgb, 0.7);
    ctx.shadowBlur = 14 * scale;
    const hw = th * 0.5 * scale;
    const hl = PAD_LEN * 0.5 * scale;
    roundRect(ctx, -hw, -hl, th * scale, PAD_LEN * scale, 5 * scale);
    const g = ctx.createLinearGradient(-hw, -hl, hw, hl);
    g.addColorStop(0, rgba(WHT, 0.95));
    g.addColorStop(0.4, rgba(lord.rgb, 1));
    g.addColorStop(1, rgba([lord.rgb[0] * 0.4 | 0, lord.rgb[1] * 0.35 | 0, lord.rgb[2] * 0.4 | 0], 1));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    roundRect(ctx, -hw + 2 * scale, -hl + 6 * scale, 3.2 * scale, PAD_LEN * scale - 12 * scale, 1.6 * scale);
    ctx.fill();
    if (hasHeld(lord.id)) {
      ctx.strokeStyle = rgba(GOLD, 0.7 + 0.3 * Math.sin(G.t * 10));
      ctx.lineWidth = 2 * scale;
      roundRect(ctx, -hw - 2 * scale, -hl - 2 * scale, th * scale + 4 * scale, PAD_LEN * scale + 4 * scale, 6 * scale);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBall(b) {
    if (b.dead) return;
    const rgb = b.hot ? HOT : GOLD;
    if (!REDUCE && b.trail) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < b.trail.length; i++) {
        const t = b.trail[i];
        const k = (i + 1) / b.trail.length;
        ctx.fillStyle = rgba(rgb, 0.14 * k);
        ctx.beginPath();
        ctx.arc(sx(t.x), sy(t.y), b.r * (0.55 + 0.55 * k) * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.shadowColor = rgba(rgb, 0.9);
    ctx.shadowBlur = 14 * scale;
    const g = ctx.createRadialGradient(
      sx(b.x - 1.6), sy(b.y - 1.8), 0.4 * scale,
      sx(b.x), sy(b.y), b.r * scale
    );
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, b.hot ? '#ffd18a' : '#fff4c8');
    g.addColorStop(1, b.hot ? '#ff5a2a' : '#ffb24a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
    ctx.fill();
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
      const max = s.max || 0.4;
      const k = s.t / max;
      ctx.strokeStyle = rgba(s.rgb, 0.6 * (1 - k));
      ctx.lineWidth = (2.4 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), ((s.r0 || 8) + k * ((s.r1 || 26) - (s.r0 || 8))) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloaters() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i];
      const a = 1 - f.t / f.life;
      const sz = (f.big ? 18 : 13) * (1 + (f.big ? 0.25 : 0) * (1 - a));
      ctx.globalAlpha = clamp(a, 0, 1);
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = '900 ' + (sz * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.16);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawServeHint() {
    if (G.mode !== 'play' || G.lock <= 0) return;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(G.t * 4);
    ctx.fillStyle = '#d5d2ee';
    ctx.font = '600 ' + (14 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('火球即将喷出', sx(VW * 0.5), sy(VH * 0.42));
    ctx.restore();
  }

  function draw() {
    if (!ctx) return;
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
    drawBrazier();
    for (let i = 0; i < 4; i++) if (G.lords[i]) drawArc(G.lords[i]);
    for (let i = 0; i < G.bricks.length; i++) drawBrick(G.bricks[i]);
    for (let i = 0; i < 4; i++) drawKing(i);
    for (let i = 0; i < 4; i++) if (G.lords[i]) drawPaddle(G.lords[i]);
    for (let i = 0; i < G.balls.length; i++) drawBall(G.balls[i]);
    drawParticles();
    drawFloaters();
    drawServeHint();
    drawFlash();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function ballNearPaddle() {
    if (!G.lords[0] || !G.lords[0].alive) return false;
    const pose = paddlePose(G.lords[0]);
    for (let i = 0; i < G.balls.length; i++) {
      const b = G.balls[i];
      if (b.dead) continue;
      if (hypot(b.x - pose.cx, b.y - pose.cy) < PAD_LEN * 0.7 + 52) return true;
    }
    return false;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A' || code === 'KeyA') keys.l = down;
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D' || code === 'KeyD') keys.r = down;
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W' || code === 'KeyW') keys.u = down;
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S' || code === 'KeyS') keys.d = down;
    if (k === ' ' || k === 'Spacebar' || code === 'Space') keys.space = down;
    const block = k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight' ||
      k === ' ' || k === 'Spacebar' ||
      ((k === 'w' || k === 'W' || k === 'a' || k === 'A' || k === 's' || k === 'S' || k === 'd' || k === 'D') && !e.metaKey && !e.ctrlKey);
    if (down && block) e.preventDefault();
    if (!down) {
      if ((k === ' ' || k === 'Spacebar' || code === 'Space') && G.mode === 'play' && hasHeld(0)) {
        launchHeld(G.lords[0]);
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
    if (k === 'Enter' || k === ' ' || k === 'Spacebar' || code === 'Space') {
      if (overlayOpen()) {
        e.preventDefault();
        if (G.mode === 'title') startMatch('siege');
        else if (G.mode === 'win' || G.mode === 'lose') startMatch(G.kind);
      }
    }
  }

  if (!hasDom) {
    const oldRand = Math.random;
    let seed = 20260822;
    Math.random = function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    G.kind = 'siege';
    G.mode = 'title';
    resetField();
    G.lock = 0;
    spitBalls();
    const startBricks = G.bricks.length;
    if (startBricks < 120) throw new Error('four castles should have many bricks');
    const pose = paddlePose(G.lords[0]);
    if (!isFinite(pose.cx) || pose.cx < 40) throw new Error('player paddle should sit outside the castle');
    for (let i = 0; i < 60 * 18; i++) update(STEP);
    const broken = startBricks - G.bricks.length;
    let chipped = 0;
    for (let i = 0; i < G.bricks.length; i++) if (G.bricks[i].hp < G.bricks[i].max) chipped += 1;
    const alive = livingCount();
    Math.random = oldRand;
    if (broken + chipped < 4) throw new Error('AI lords should break bricks, not idle (' + broken + '+' + chipped + ')');
    if (G.balls.length < 1) throw new Error('fireball should stay in play');
    if (alive < 1) throw new Error('someone should still stand');
    return;
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const w = pointerWorld(e);
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.nearCatch = G.mode === 'play' && (hasHeld(0) || ballNearPaddle());
    canvas.classList.add('press');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    const w = pointerWorld(e);
    pointer.x = w.x;
    pointer.y = w.y;
    if (e.pointerType === 'mouse') pointer.hover = true;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    if (G.mode === 'play' && hasHeld(0) && pointer.nearCatch) launchHeld(G.lords[0]);
    pointer.down = false;
    pointer.nearCatch = false;
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
    keys.l = keys.r = keys.u = keys.d = keys.space = false;
  });

  btnSiege.addEventListener('click', function () {
    audio.ensure();
    startMatch('siege');
  });
  btnRain.addEventListener('click', function () {
    audio.ensure();
    startMatch('rain');
  });
  btnAgain.addEventListener('click', function () {
    audio.ensure();
    startMatch(G.kind);
  });
  btnMenu.addEventListener('click', function () {
    goMenu();
  });
  btnRetry.addEventListener('click', function () {
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
    for (let i = 0; i < 30; i++) {
      motes.push({
        x: rand(18, VW - 18),
        y: rand(24, VH - 24),
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
  bootDemo();
  showTitle();
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
