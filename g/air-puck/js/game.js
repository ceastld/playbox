'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const WALL = 20;
  const CORNER = 36;
  const GOAL_W = 156;
  const POST_R = 9;
  const PUCK_R = 13;
  const MALLET_R = 30;
  const FRICTION = 0.34;
  const WALL_REST = 0.9;
  const MALLET_E = 0.7;
  const PUCK_MAX = 1040;
  const PTR_MAX = 2480;
  const KEY_ACC = 4200;
  const KEY_MAX = 880;
  const KEY_FRIC = 10;
  const TARGET = 7;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-air-puck-best';
  const MUTE_KEY = 'playbox-air-puck-mute';
  const DIFF_KEY = 'playbox-air-puck-diff';
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MAG = [255, 61, 184];
  const CYN = [0, 245, 224];
  const GOLD = [255, 227, 107];
  const WHT = [236, 255, 252];
  const ICE = [12, 28, 36];

  const DIFFS = [
    { name: '简', max: 360, react: 0.3, err: 52, predict: 0.12, agg: 0.28, reach: 0.42 },
    { name: '中', max: 640, react: 0.12, err: 22, predict: 0.58, agg: 0.62, reach: 0.22 },
    { name: '难', max: 920, react: 0.045, err: 8, predict: 0.94, agg: 0.92, reach: 0.06 }
  ];

  const MODE_NAME = { ai: '对机', two: '双人同机' };

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
  const ovDiff = document.getElementById('ov-diff');
  const btnAi = document.getElementById('btn-ai');
  const btnTwo = document.getElementById('btn-two');
  const btnAgain = document.getElementById('btn-again');
  const btnMenu = document.getElementById('btn-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreBEl = document.getElementById('score-b');
  const scoreTEl = document.getElementById('score-t');
  const scoreBBox = document.getElementById('score-b-box');
  const scoreTBox = document.getElementById('score-t-box');
  const labB = document.getElementById('lab-b');
  const labT = document.getElementById('lab-t');
  const bestEl = document.getElementById('best');
  const modeLabel = document.getElementById('mode-label');
  const tagLabel = document.getElementById('tag-label');
  const comboLabel = document.getElementById('combo-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const diffBtns = document.querySelectorAll('[data-diff]');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let kickTok = 0;

  const keys = {
    w: false, a: false, s: false, d: false,
    up: false, down: false, left: false, right: false
  };
  const pointers = Object.create(null);
  const mouse = { hover: false, x: VW * 0.5, y: VH * 0.78 };
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const motes = [];

  const G = {
    phase: 'title',
    kind: 'ai',
    diff: 1,
    t: 0,
    bot: 0,
    top: 0,
    best: 0,
    rally: 0,
    serving: true,
    serveBot: true,
    lock: 0.6,
    shake: 0,
    kickX: 0,
    kickY: 0,
    punch: 1,
    flash: 0,
    flashRgb: CYN,
    goalFlash: 0,
    goalTop: false,
    toastT: 0,
    stop: 0,
    botWin: false,
    puck: null,
    B: null,
    T: null,
    aiT: 0,
    aiX: VW * 0.5,
    aiY: VH * 0.24,
    demoT: 0,
    demoX: VW * 0.5,
    demoY: VH * 0.76
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
  function goalX0() {
    return (VW - GOAL_W) * 0.5;
  }
  function goalX1() {
    return (VW + GOAL_W) * 0.5;
  }
  function inGoalX(x, pad) {
    const p = pad == null ? 10 : pad;
    return x > goalX0() + p && x < goalX1() - p;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
        const n = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, n * 0.35, n);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
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
    noise(dur, vol, delay) {
      if (!this.ctx || this.muted || !this.noiseBuf) return;
      const t = this.ctx.currentTime + (delay || 0);
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(1800, t);
      f.frequency.exponentialRampToValueAtTime(280, t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    slam(heavy, bot) {
      this.ensure();
      const p = heavy ? 1 : 0.55;
      this.noise(heavy ? 0.08 : 0.045, 0.045 * p);
      this.beep(heavy ? 92 : 140, 0.07, 'triangle', 0.07 * p, heavy ? 55 : 90);
      this.beep(bot ? 620 : 480, 0.055, 'sine', 0.04 * p, bot ? 980 : 760);
      if (heavy) this.beep(220, 0.09, 'sawtooth', 0.028, 80);
    },
    wall() {
      this.ensure();
      this.beep(190, 0.035, 'square', 0.016);
    },
    post() {
      this.ensure();
      this.beep(410, 0.05, 'square', 0.028, 260);
    },
    goal(bot) {
      this.ensure();
      this.noise(0.16, 0.07);
      this.beep(bot ? 523 : 392, 0.1, 'sine', 0.055);
      this.beep(bot ? 784 : 262, 0.18, 'triangle', 0.045, bot ? 1180 : 140);
      this.beep(bot ? 1046 : 196, 0.22, 'sine', 0.04, bot ? 1560 : 90, 0.06);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.12, 'sine', 0.055, 0, 0.1);
      this.beep(784, 0.14, 'sine', 0.05, 0, 0.2);
      this.beep(1046, 0.32, 'triangle', 0.06, 1560, 0.32);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.28, 'sine', 0.05, 50, 0.04);
    },
    start() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 784);
    },
    serve() {
      this.ensure();
      this.beep(640, 0.07, 'sine', 0.032, 880);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.06, 'triangle', 0.03, f * 1.4);
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

  function saveWin() {
    G.best += 1;
    bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function loadDiff() {
    try {
      const n = parseInt(localStorage.getItem(DIFF_KEY) || '1', 10);
      G.diff = n === 0 || n === 2 ? n : 1;
    } catch (err) {
      G.diff = 1;
    }
    syncDiff();
  }

  function setDiff(n, restartIfPlay) {
    if (n !== 0 && n !== 1 && n !== 2) return;
    const changed = G.diff !== n;
    G.diff = n;
    try {
      localStorage.setItem(DIFF_KEY, String(n));
    } catch (err) { /* ignore */ }
    syncDiff();
    if (changed && restartIfPlay && G.phase === 'play' && G.kind !== 'two') {
      startMatch(G.kind);
    }
  }

  function syncDiff() {
    for (let i = 0; i < diffBtns.length; i++) {
      const el = diffBtns[i];
      const n = parseInt(el.getAttribute('data-diff'), 10);
      el.setAttribute('aria-pressed', n === G.diff ? 'true' : 'false');
    }
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.25;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function overlayOpen() {
    return !overlay.classList.contains('hidden');
  }

  function makeMallet(x, y, bot) {
    return {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      r: MALLET_R,
      bot: bot,
      squash: 0,
      sx: 1,
      sy: 1,
      glow: 0,
      cool: 0
    };
  }

  function makePuck(x, y) {
    return {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      r: PUCK_R,
      trail: [],
      tint: WHT,
      tintT: 0,
      stretch: 0,
      ang: 0,
      wallCool: 0
    };
  }

  function homeBot() {
    return { x: VW * 0.5, y: VH * 0.78 };
  }
  function homeTop() {
    return { x: VW * 0.5, y: VH * 0.22 };
  }

  function malletBounds(bot) {
    const r = MALLET_R;
    return {
      x0: WALL + r + 2,
      x1: VW - WALL - r - 2,
      y0: bot ? VH * 0.5 + 8 : WALL + r + 4,
      y1: bot ? VH - WALL - r - 4 : VH * 0.5 - 8
    };
  }

  function resetMallets() {
    const hb = homeBot();
    const ht = homeTop();
    G.B = makeMallet(hb.x, hb.y, true);
    G.T = makeMallet(ht.x, ht.y, false);
  }

  function capPuck(p) {
    const spd = hypot(p.vx, p.vy);
    if (spd > PUCK_MAX) {
      p.vx = p.vx / spd * PUCK_MAX;
      p.vy = p.vy / spd * PUCK_MAX;
    }
  }

  function syncHud() {
    scoreBEl.textContent = String(G.phase === 'title' ? 0 : G.bot);
    scoreTEl.textContent = String(G.phase === 'title' ? 0 : G.top);
    bestEl.textContent = String(G.best);
    const two = G.kind === 'two' && G.phase !== 'title';
    labB.textContent = two ? '下' : '你';
    labT.textContent = two ? '上' : '对方';
    if (G.phase === 'title') {
      modeLabel.textContent = '气球';
      tagLabel.textContent = 'HOCKEY';
    } else {
      modeLabel.textContent = MODE_NAME[G.kind] || '气球';
      tagLabel.textContent = G.kind === 'two' ? '2P' : DIFFS[G.diff].name;
    }
    const win = G.phase === 'end' && G.botWin;
    const lose = G.phase === 'end' && !G.botWin;
    modeLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('warn', lose);
    if (G.phase === 'play' && G.rally >= 2) {
      comboLabel.hidden = false;
      comboLabel.textContent = '×' + G.rally;
    } else {
      comboLabel.hidden = true;
    }
  }

  function showTitle() {
    G.phase = 'title';
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'HOCKEY';
    ovTitle.textContent = '气球';
    ovLead.textContent = '一磕就飞，对打进门。';
    ovOps.textContent = '拖动底侧击球 · WASD 或方向键 · 双人分上下';
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    ovDiff.classList.remove('gone');
    setHint('拖动击球 · WASD 或方向键 · 先到七分 · R 重开 · M 静音');
    syncHud();
  }

  function showEnd() {
    G.phase = 'end';
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    const two = G.kind === 'two';
    const bot = G.botWin;
    panel.classList.toggle('win', bot);
    panel.classList.toggle('lose', !bot);
    ovKicker.textContent = bot ? 'WIN' : 'MISS';
    if (two) {
      ovTitle.textContent = bot ? '下方胜' : '上方胜';
    } else {
      ovTitle.textContent = bot ? '你赢了' : '对方到了';
    }
    ovLead.textContent = G.bot + ' : ' + G.top + ' · 先到七分';
    ovOps.textContent = 'R 再来 · 换模式回标题';
    ovStart.classList.add('gone');
    ovDiff.classList.add('gone');
    ovEnd.classList.remove('gone');
    setHint('再来一局', bot ? 'hot' : 'warn');
    syncHud();
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    canvas.focus();
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 5);
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
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

  function popSpark(x, y, rgb, rad) {
    if (REDUCE) return;
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 18 });
    if (sparks.length > 14) sparks.shift();
  }

  function popRing(x, y, rgb, r) {
    if (REDUCE) return;
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 12 });
    if (rings.length > 10) rings.shift();
  }

  function popFloat(x, y, text, rgb, size) {
    if (REDUCE) return;
    floats.push({
      x: x, y: y, text: text, rgb: rgb || GOLD,
      t: 0, life: 0.7, size: size || 16, vy: -42
    });
    if (floats.length > 8) floats.shift();
  }

  function hitStop(sec) {
    if (REDUCE) {
      G.stop = Math.max(G.stop, 0.012);
      return;
    }
    if (G.phase !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(nx, ny, mag) {
    if (REDUCE) {
      G.shake = Math.max(G.shake, mag * 0.2);
      return;
    }
    G.kickX += nx * mag;
    G.kickY += ny * mag;
    G.shake = Math.max(G.shake, mag * 0.7);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.005));
    kickTok += 1;
    const cls = mag >= 7 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function flashScore(bot) {
    const box = bot ? scoreBBox : scoreTBox;
    box.classList.remove('flash');
    void box.offsetWidth;
    box.classList.add('flash');
  }

  function bumpCombo() {
    if (G.rally < 2) return;
    comboLabel.hidden = false;
    comboLabel.textContent = '×' + G.rally;
    comboLabel.classList.remove('pop');
    void comboLabel.offsetWidth;
    comboLabel.classList.add('pop');
  }

  function placeServe() {
    const p = G.puck;
    p.x = VW * 0.5 + rand(-10, 10);
    p.y = G.serveBot ? VH * 0.62 : VH * 0.38;
    p.vx = 0;
    p.vy = 0;
    p.trail.length = 0;
    p.tintT = 0;
  }

  function startServe(botServes) {
    G.serving = true;
    G.serveBot = botServes;
    G.lock = 0.62;
    G.rally = 0;
    const hb = homeBot();
    const ht = homeTop();
    if (G.B) {
      G.B.x = hb.x;
      G.B.y = hb.y;
      G.B.vx = 0;
      G.B.vy = 0;
    }
    if (G.T) {
      G.T.x = ht.x;
      G.T.y = ht.y;
      G.T.vx = 0;
      G.T.vy = 0;
    }
    placeServe();
    syncHud();
  }

  function launch() {
    if (!G.serving) return;
    G.serving = false;
    G.lock = 0;
    if (G.phase === 'play') audio.serve();
  }

  function startMatch(kind) {
    G.kind = kind;
    G.phase = 'play';
    G.bot = 0;
    G.top = 0;
    G.rally = 0;
    G.botWin = false;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.punch = 1;
    G.flash = 0;
    G.stop = 0;
    G.aiT = 0;
    G.aiX = VW * 0.5;
    G.aiY = VH * 0.22;
    resetMallets();
    G.puck = makePuck(VW * 0.5, VH * 0.62);
    startServe(true);
    hideOverlay();
    audio.start();
    if (kind === 'two') {
      setHint('WASD 下方 · ↑←↓→ 上方 · 上下半场拖动');
    } else {
      setHint('拖动底侧 · WASD 或方向键 · ' + DIFFS[G.diff].name);
    }
    toast(MODE_NAME[kind], false, kind === 'two');
    syncHud();
  }

  function bootDemo() {
    resetMallets();
    G.puck = makePuck(VW * 0.5, VH * 0.5);
    G.serving = false;
    G.lock = 0;
    G.puck.vx = rand(-180, 180);
    G.puck.vy = rand(80, 220) * (Math.random() < 0.5 ? -1 : 1);
    G.demoT = 0;
    G.demoX = VW * 0.5;
    G.demoY = VH * 0.76;
    G.aiT = 0;
    G.aiX = VW * 0.5;
    G.aiY = VH * 0.22;
  }

  function predictPuck(dtLook) {
    const p = G.puck;
    let x = p.x;
    let y = p.y;
    let vx = p.vx;
    let vy = p.vy;
    const left = WALL + PUCK_R;
    const right = VW - WALL - PUCK_R;
    const top = WALL + PUCK_R;
    const bot = VH - WALL - PUCK_R;
    const steps = Math.max(1, Math.ceil(dtLook / 0.016));
    const h = dtLook / steps;
    for (let i = 0; i < steps; i++) {
      x += vx * h;
      y += vy * h;
      vx *= Math.exp(-FRICTION * h);
      vy *= Math.exp(-FRICTION * h);
      if (x < left) {
        x = left;
        vx = Math.abs(vx);
      } else if (x > right) {
        x = right;
        vx = -Math.abs(vx);
      }
      if (y < top) {
        y = top;
        vy = Math.abs(vy);
      } else if (y > bot) {
        y = bot;
        vy = -Math.abs(vy);
      }
    }
    return { x: x, y: y, vx: vx, vy: vy };
  }

  function thinkAI(m, dt, cfg, timerKey, txKey, tyKey, isTop) {
    G[timerKey] -= dt;
    if (G[timerKey] > 0) return;
    G[timerKey] = cfg.react;
    const p = G.puck;
    const home = isTop ? homeTop() : homeBot();
    const myGoalY = isTop ? WALL + m.r + 10 : VH - WALL - m.r - 10;
    const theirGoalY = isTop ? VH - 10 : 10;
    const inHalf = isTop ? p.y < VH * 0.5 + 28 : p.y > VH * 0.5 - 28;
    const coming = isTop ? p.vy < 80 : p.vy > -80;
    const look = 0.08 + cfg.predict * 0.16;
    const pred = predictPuck(look);
    const err = cfg.err;
    const aimX = VW * 0.5 + rand(-GOAL_W * 0.32, GOAL_W * 0.32);
    const gx = aimX - pred.x;
    const gy = theirGoalY - pred.y;
    const glen = hypot(gx, gy) || 1;
    const behind = m.r + p.r - 2;
    const strikeX = pred.x - gx / glen * behind + rand(-err, err);
    const strikeY = pred.y - gy / glen * behind + rand(-err * 0.5, err * 0.5);
    const defendX = lerp(VW * 0.5, pred.x, 0.78) + rand(-err, err);
    const defendY = lerp(myGoalY, pred.y, 0.16);

    if (G.serving) {
      if ((isTop && !G.serveBot) || (!isTop && G.serveBot)) {
        G[txKey] = p.x + rand(-err * 0.4, err * 0.4);
        G[tyKey] = p.y + (isTop ? -behind : behind);
      } else {
        G[txKey] = home.x;
        G[tyKey] = home.y;
      }
      return;
    }

    const dist = hypot(p.x - m.x, p.y - m.y);
    const threat = isTop
      ? p.y < VH * 0.38 && p.vy < 40
      : p.y > VH * 0.62 && p.vy > -40;
    const canStrike = inHalf && coming && dist < 110 + cfg.agg * 90;

    if (threat && dist > 70) {
      G[txKey] = defendX;
      G[tyKey] = defendY;
      return;
    }
    if (canStrike && Math.random() < 0.28 + cfg.agg * 0.65) {
      G[txKey] = strikeX;
      G[tyKey] = strikeY;
      return;
    }
    if (inHalf) {
      const mix = coming ? cfg.agg : 0.12;
      G[txKey] = lerp(defendX, strikeX, mix * 0.55);
      G[tyKey] = lerp(defendY, strikeY, mix * 0.4);
      return;
    }
    if (hypot(p.vx, p.vy) < 40) {
      G[txKey] = lerp(home.x, VW * 0.5, 0.4);
      G[tyKey] = lerp(home.y, isTop ? VH * 0.32 : VH * 0.68, 0.5);
      return;
    }
    G[txKey] = lerp(home.x, pred.x, 0.4) + rand(-err * 0.4, err * 0.4);
    G[tyKey] = isTop ? lerp(VH * 0.26, VH * 0.36, cfg.reach) : lerp(VH * 0.74, VH * 0.64, cfg.reach);
  }

  function pointerFor(bot) {
    let x = null;
    let y = null;
    let any = false;
    for (const id in pointers) {
      const p = pointers[id];
      const isBot = G.kind === 'two' && G.phase === 'play' ? p.y >= VH * 0.5 : true;
      if (bot === isBot || (G.kind !== 'two' && bot)) {
        x = p.x;
        y = p.y;
        any = true;
      }
    }
    if (!any && bot && G.kind !== 'two' && mouse.hover && G.phase === 'play') {
      x = mouse.x;
      y = mouse.y;
      any = true;
    }
    if (!any) return null;
    return { x: x, y: y };
  }

  function keyVec(bot) {
    const two = G.kind === 'two' && G.phase === 'play';
    let ax = 0;
    let ay = 0;
    if (two) {
      if (bot) {
        if (keys.a) ax -= 1;
        if (keys.d) ax += 1;
        if (keys.w) ay -= 1;
        if (keys.s) ay += 1;
      } else {
        if (keys.left) ax -= 1;
        if (keys.right) ax += 1;
        if (keys.up) ay -= 1;
        if (keys.down) ay += 1;
      }
    } else if (bot) {
      if (keys.a || keys.left) ax -= 1;
      if (keys.d || keys.right) ax += 1;
      if (keys.w || keys.up) ay -= 1;
      if (keys.s || keys.down) ay += 1;
    }
    if (ax !== 0 && ay !== 0) {
      ax *= 0.707;
      ay *= 0.707;
    }
    return { ax: ax, ay: ay, any: ax !== 0 || ay !== 0 };
  }

  function collidePuckMallet(m) {
    const p = G.puck;
    if (!p || G.serving) return false;
    const dx = p.x - m.x;
    const dy = p.y - m.y;
    let dist = hypot(dx, dy);
    const min = p.r + m.r;
    if (dist >= min) return false;
    let nx;
    let ny;
    if (dist < 1e-4) {
      nx = 0;
      ny = m.bot ? -1 : 1;
      dist = 1;
    } else {
      nx = dx / dist;
      ny = dy / dist;
    }
    const overlap = min - dist + 0.6;
    p.x += nx * overlap;
    p.y += ny * overlap;

    if (m.cool > 0) return false;

    const relVx = p.vx - m.vx;
    const relVy = p.vy - m.vy;
    const vn = relVx * nx + relVy * ny;
    if (vn >= 0) return false;

    const malSpd = hypot(m.vx, m.vy);
    p.vx -= (1 + MALLET_E) * vn * nx;
    p.vy -= (1 + MALLET_E) * vn * ny;
    const boost = Math.min(380, malSpd * 0.48 + 70);
    p.vx += nx * boost * 0.42 + m.vx * 0.38;
    p.vy += ny * boost * 0.42 + m.vy * 0.38;
    capPuck(p);
    m.cool = 0.04;

    const impact = Math.max(0, -vn) + malSpd * 0.45;
    onMalletHit(m, nx, ny, impact, malSpd);
    return true;
  }

  function onMalletHit(m, nx, ny, impact, malSpd) {
    const heavy = impact > 520 || malSpd > 700;
    const bot = m.bot;
    const rgb = bot ? CYN : MAG;
    pTint(rgb);
    m.squash = heavy ? 0.22 : 0.12;
    m.sx = 1 - Math.abs(nx) * (heavy ? 0.18 : 0.1);
    m.sy = 1 - Math.abs(ny) * (heavy ? 0.18 : 0.1);
    m.glow = heavy ? 0.28 : 0.16;
    if (G.puck) G.puck.stretch = heavy ? 0.28 : 0.14;

    if (G.phase === 'play') {
      G.rally += 1;
      bumpCombo();
      audio.slam(heavy, bot);
      if (G.rally === 4 || G.rally === 7 || G.rally === 10) audio.combo(G.rally);
    }

    const n = heavy ? 16 : 8;
    emit(n, {
      x: G.puck.x,
      y: G.puck.y,
      j: 8,
      vx0: nx * 40 - 120,
      vx1: nx * 180 + 120,
      vy0: ny * 40 - 120,
      vy1: ny * 180 + 120,
      life: heavy ? 0.42 : 0.26,
      r0: 0.8,
      r1: heavy ? 2.8 : 1.8,
      rgb: rgb
    });
    popSpark(G.puck.x, G.puck.y, rgb, heavy ? 26 : 14);
    popRing(G.puck.x, G.puck.y, heavy ? GOLD : rgb, heavy ? 16 : 10);
    if (heavy && G.phase === 'play') {
      popFloat(G.puck.x, G.puck.y - 18, G.rally >= 5 ? '连击×' + G.rally : '重击', GOLD, 15);
    }

    const stop = clamp(0.03 + impact / 14000, 0.03, 0.078);
    hitStop(heavy ? Math.max(stop, 0.055) : stop);
    kick(nx, ny, heavy ? 6.5 : 3.2);
  }

  function pTint(rgb) {
    if (!G.puck) return;
    G.puck.tint = rgb;
    G.puck.tintT = 0.22;
  }

  function bounceCircle(px, py, pr, b) {
    const dx = b.x - px;
    const dy = b.y - py;
    const dist = hypot(dx, dy);
    const min = b.r + pr;
    if (dist >= min || dist < 1e-5) return false;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = min - dist;
    b.x += nx * (overlap + 0.4);
    b.y += ny * (overlap + 0.4);
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= (1 + WALL_REST) * vn * nx;
      b.vy -= (1 + WALL_REST) * vn * ny;
    }
    capPuck(b);
    return true;
  }

  function bounceWalls(b) {
    const r = b.r;
    const x0 = WALL + r;
    const x1 = VW - WALL - r;
    const y0 = WALL + r;
    const y1 = VH - WALL - r;
    const openTop = inGoalX(b.x, r * 0.2);
    const openBot = inGoalX(b.x, r * 0.2);
    let hit = false;
    let nx = 0;
    let ny = 0;

    if (b.x < x0) {
      b.x = x0;
      if (b.vx < 0) b.vx = -b.vx * WALL_REST;
      nx = 1;
      hit = true;
    } else if (b.x > x1) {
      b.x = x1;
      if (b.vx > 0) b.vx = -b.vx * WALL_REST;
      nx = -1;
      hit = true;
    }

    if (b.y < y0 && !(openTop && b.y > -r)) {
      if (!openTop) {
        b.y = y0;
        if (b.vy < 0) b.vy = -b.vy * WALL_REST;
        ny = 1;
        hit = true;
      }
    } else if (b.y > y1 && !(openBot && b.y < VH + r)) {
      if (!openBot) {
        b.y = y1;
        if (b.vy > 0) b.vy = -b.vy * WALL_REST;
        ny = -1;
        hit = true;
      }
    }

    if (b.y < WALL && openTop) {
      const g0 = goalX0();
      const g1 = goalX1();
      if (b.x - r < g0) {
        b.x = g0 + r;
        if (b.vx < 0) b.vx = Math.abs(b.vx) * WALL_REST;
        hit = true;
      } else if (b.x + r > g1) {
        b.x = g1 - r;
        if (b.vx > 0) b.vx = -Math.abs(b.vx) * WALL_REST;
        hit = true;
      }
    }
    if (b.y > VH - WALL && openBot) {
      const g0 = goalX0();
      const g1 = goalX1();
      if (b.x - r < g0) {
        b.x = g0 + r;
        if (b.vx < 0) b.vx = Math.abs(b.vx) * WALL_REST;
        hit = true;
      } else if (b.x + r > g1) {
        b.x = g1 - r;
        if (b.vx > 0) b.vx = -Math.abs(b.vx) * WALL_REST;
        hit = true;
      }
    }

    const rad = Math.max(6, CORNER - r);
    function corner(fx, fy) {
      const onX = fx < VW * 0.5 ? b.x < fx : b.x > fx;
      const onY = fy < VH * 0.5 ? b.y < fy : b.y > fy;
      if (!onX || !onY) return;
      const dx = b.x - fx;
      const dy = b.y - fy;
      const d = hypot(dx, dy);
      if (d < 1e-4 || d <= rad) return;
      const k = rad / d;
      b.x = fx + dx * k;
      b.y = fy + dy * k;
      const nnx = dx / d;
      const nny = dy / d;
      const vn = b.vx * nnx + b.vy * nny;
      if (vn > 0) {
        b.vx -= (1 + WALL_REST) * vn * nnx;
        b.vy -= (1 + WALL_REST) * vn * nny;
      }
      hit = true;
      nx = nnx;
      ny = nny;
    }
    if (!(openTop && b.y < y0)) {
      corner(x0 + rad, y0 + rad);
      corner(x1 - rad, y0 + rad);
    }
    if (!(openBot && b.y > y1)) {
      corner(x0 + rad, y1 - rad);
      corner(x1 - rad, y1 - rad);
    }

    const g0 = goalX0();
    const g1 = goalX1();
    let post = false;
    if (bounceCircle(g0, WALL, POST_R, b)) post = true;
    if (bounceCircle(g1, WALL, POST_R, b)) post = true;
    if (bounceCircle(g0, VH - WALL, POST_R, b)) post = true;
    if (bounceCircle(g1, VH - WALL, POST_R, b)) post = true;

    capPuck(b);
    const noisy = G.phase === 'play' && b.wallCool <= 0;
    if (post && noisy) {
      b.wallCool = 0.08;
      audio.post();
      emit(5, {
        x: b.x, y: b.y, j: 4,
        vx0: -90, vx1: 90, vy0: -90, vy1: 90,
        life: 0.22, r0: 0.6, r1: 1.6, rgb: GOLD
      });
    } else if (hit && noisy) {
      b.wallCool = 0.07;
      audio.wall();
      emit(3, {
        x: b.x, y: b.y, j: 3,
        vx0: nx * 20 - 40, vx1: nx * 80 + 40,
        vy0: ny * 20 - 40, vy1: ny * 80 + 40,
        life: 0.18, r0: 0.5, r1: 1.3, rgb: WHT
      });
    }
    return hit || post;
  }

  function clampMallet(m) {
    const b = malletBounds(m.bot);
    if (m.x < b.x0) {
      m.x = b.x0;
      m.vx *= 0.2;
    } else if (m.x > b.x1) {
      m.x = b.x1;
      m.vx *= 0.2;
    }
    if (m.y < b.y0) {
      m.y = b.y0;
      m.vy *= 0.2;
    } else if (m.y > b.y1) {
      m.y = b.y1;
      m.vy *= 0.2;
    }
  }

  function moveMallet(m, dt, maxSpd, tx, ty, ax, ay) {
    m.cool = Math.max(0, m.cool - dt);
    const b = malletBounds(m.bot);
    let dx;
    let dy;
    if (ax !== 0 || ay !== 0) {
      m.vx += ax * KEY_ACC * dt;
      m.vy += ay * KEY_ACC * dt;
      const spd = hypot(m.vx, m.vy);
      const cap = KEY_MAX;
      if (spd > cap) {
        m.vx = m.vx / spd * cap;
        m.vy = m.vy / spd * cap;
      }
      dx = m.vx * dt;
      dy = m.vy * dt;
    } else if (tx != null) {
      tx = clamp(tx, b.x0, b.x1);
      ty = clamp(ty, b.y0, b.y1);
      dx = tx - m.x;
      dy = ty - m.y;
      const dist = hypot(dx, dy);
      const maxStep = maxSpd * dt;
      if (dist > maxStep && dist > 0.001) {
        dx *= maxStep / dist;
        dy *= maxStep / dist;
      }
      m.vx = dx / Math.max(dt, 0.001);
      m.vy = dy / Math.max(dt, 0.001);
    } else {
      m.vx *= Math.exp(-dt * KEY_FRIC);
      m.vy *= Math.exp(-dt * KEY_FRIC);
      dx = m.vx * dt;
      dy = m.vy * dt;
    }

    const dist = hypot(dx, dy);
    const steps = Math.max(1, Math.ceil(dist / 6));
    const hx = dx / steps;
    const hy = dy / steps;
    for (let i = 0; i < steps; i++) {
      m.x += hx;
      m.y += hy;
      clampMallet(m);
      collidePuckMallet(m);
    }
    clampMallet(m);

    if (G.phase === 'play' && !REDUCE && dist / dt > 420 && Math.random() < 0.35) {
      emit(1, {
        x: m.x, y: m.y, j: 6,
        vx0: -m.vx * 0.1, vx1: m.vx * 0.1,
        vy0: -m.vy * 0.1, vy1: m.vy * 0.1,
        life: 0.18, r0: 0.4, r1: 1.1,
        rgb: m.bot ? CYN : MAG
      });
    }
  }

  function movePuck(dt) {
    const p = G.puck;
    if (!p || G.serving) return;
    const dist = hypot(p.vx, p.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / 5));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      p.x += p.vx * h;
      p.y += p.vy * h;
      p.vx *= Math.exp(-FRICTION * h);
      p.vy *= Math.exp(-FRICTION * h);
      p.wallCool = Math.max(0, p.wallCool - h);
      bounceWalls(p);
      collidePuckMallet(G.B);
      collidePuckMallet(G.T);
    }
    p.ang += hypot(p.vx, p.vy) * dt * 0.018;
    capPuck(p);
  }

  function explodeGoal(botScored) {
    const y = botScored ? WALL + 8 : VH - WALL - 8;
    const rgb = botScored ? CYN : MAG;
    emit(28, {
      x: VW * 0.5,
      y: y,
      j: 28,
      vx0: -220,
      vx1: 220,
      vy0: botScored ? 40 : -220,
      vy1: botScored ? 220 : -40,
      life: 0.55,
      r0: 1.2,
      r1: 3.4,
      rgb: rgb
    });
    emit(12, {
      x: VW * 0.5, y: y, j: 16,
      vx0: -160, vx1: 160, vy0: -140, vy1: 140,
      life: 0.4, r0: 0.8, r1: 2.2, rgb: GOLD
    });
    popSpark(VW * 0.5, y, rgb, 42);
    popRing(VW * 0.5, y, GOLD, 22);
    popFloat(VW * 0.5, VH * 0.5, '进了', rgb, 28);
  }

  function scorePoint(botGets) {
    if (G.phase !== 'play') {
      startServe(!botGets);
      G.lock = 0.4;
      return;
    }
    if (botGets) G.bot += 1;
    else G.top += 1;
    flashScore(botGets);
    G.flash = 0.28;
    G.flashRgb = botGets ? CYN : MAG;
    G.goalFlash = 0.55;
    G.goalTop = botGets;
    hitStop(0.08);
    kick(0, botGets ? -1 : 1, 11);
    explodeGoal(botGets);
    audio.goal(botGets);
    G.rally = 0;
    syncHud();

    if (G.bot >= TARGET || G.top >= TARGET) {
      G.botWin = G.bot > G.top;
      if (G.botWin) saveWin();
      if (G.botWin) audio.win();
      else audio.lose();
      showEnd();
      return;
    }

    if (botGets) toast('进球', false, true);
    else toast('丢了', true);
    startServe(!botGets);
  }

  function checkGoal() {
    const p = G.puck;
    if (!p || G.serving) return;
    const mouth = inGoalX(p.x, 4);
    if (mouth && p.y < WALL) scorePoint(true);
    else if (mouth && p.y > VH - WALL) scorePoint(false);
    else if (p.y + p.r < -4) scorePoint(true);
    else if (p.y - p.r > VH + 4) scorePoint(false);
  }

  function updateMallets(dt) {
    const play = G.phase === 'play';
    const title = G.phase === 'title';
    const two = G.kind === 'two' && play;
    const cfg = DIFFS[G.diff];
    const mid = DIFFS[1];

    if (title) {
      thinkAI(G.B, dt, mid, 'demoT', 'demoX', 'demoY', false);
      thinkAI(G.T, dt, mid, 'aiT', 'aiX', 'aiY', true);
      moveMallet(G.B, dt, mid.max, G.demoX, G.demoY, 0, 0);
      moveMallet(G.T, dt, mid.max, G.aiX, G.aiY, 0, 0);
      return;
    }

    if (G.phase === 'end') {
      moveMallet(G.B, dt, KEY_MAX, null, null, 0, 0);
      moveMallet(G.T, dt, KEY_MAX, null, null, 0, 0);
      return;
    }

    if (!play) return;

    const kb = keyVec(true);
    const ptrB = pointerFor(true);
    if (ptrB && !kb.any) moveMallet(G.B, dt, PTR_MAX, ptrB.x, ptrB.y, 0, 0);
    else if (kb.any) moveMallet(G.B, dt, KEY_MAX, null, null, kb.ax, kb.ay);
    else moveMallet(G.B, dt, KEY_MAX, null, null, 0, 0);

    if (two) {
      const kt = keyVec(false);
      const ptrT = pointerFor(false);
      if (ptrT && !kt.any) moveMallet(G.T, dt, PTR_MAX, ptrT.x, ptrT.y, 0, 0);
      else if (kt.any) moveMallet(G.T, dt, KEY_MAX, null, null, kt.ax, kt.ay);
      else moveMallet(G.T, dt, KEY_MAX, null, null, 0, 0);
    } else {
      thinkAI(G.T, dt, cfg, 'aiT', 'aiX', 'aiY', true);
      moveMallet(G.T, dt, cfg.max, G.aiX, G.aiY, 0, 0);
    }
  }

  function updateFx(dt) {
    G.shake *= Math.exp(-dt * 9);
    G.kickX *= Math.exp(-dt * 10);
    G.kickY *= Math.exp(-dt * 10);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 12));
    G.flash = Math.max(0, G.flash - dt);
    G.goalFlash = Math.max(0, G.goalFlash - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0) toastEl.classList.add('hidden');
    if (G.puck) {
      G.puck.tintT = Math.max(0, G.puck.tintT - dt);
      G.puck.stretch = Math.max(0, G.puck.stretch - dt * 2.4);
    }
    if (G.B) {
      G.B.squash = Math.max(0, G.B.squash - dt * 3.2);
      G.B.glow = Math.max(0, G.B.glow - dt);
      G.B.sx = lerp(G.B.sx, 1, 1 - Math.exp(-dt * 14));
      G.B.sy = lerp(G.B.sy, 1, 1 - Math.exp(-dt * 14));
    }
    if (G.T) {
      G.T.squash = Math.max(0, G.T.squash - dt * 3.2);
      G.T.glow = Math.max(0, G.T.glow - dt);
      G.T.sx = lerp(G.T.sx, 1, 1 - Math.exp(-dt * 14));
      G.T.sy = lerp(G.T.sy, 1, 1 - Math.exp(-dt * 14));
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.5);
      q.vy *= Math.exp(-dt * 1.5);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.42) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.36) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.8);
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y += Math.sin(G.t * 0.6 + m.p) * 4 * dt;
    }
  }

  function recordTrail() {
    if (REDUCE || !G.puck || G.serving) return;
    const p = G.puck;
    if (hypot(p.vx, p.vy) < 80) return;
    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 12) p.trail.shift();
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }

    G.lock = Math.max(0, G.lock - dt);
    updateMallets(dt);

    if (G.phase !== 'end') {
      if (G.serving) {
        placeServe();
        if (G.lock <= 0) launch();
      } else {
        movePuck(dt);
        checkGoal();
      }
    }

    recordTrail();
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
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    g.addColorStop(0, '#07161c');
    g.addColorStop(0.5, '#05030c');
    g.addColorStop(1, '#120814');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(VW * 0.5), sy(VH * 0.5), 20 * scale, sx(VW * 0.5), sy(VH * 0.5), 380 * scale);
    vg.addColorStop(0, 'rgba(0, 245, 224, 0.07)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.24)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.5 + 0.5 * Math.sin(G.t * 1.3 + m.p));
      ctx.fillStyle = rgba(i % 3 === 0 ? CYN : i % 3 === 1 ? MAG : GOLD, a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawCourt() {
    const iceX = sx(WALL);
    const iceY = sy(WALL);
    const iceW = (VW - WALL * 2) * scale;
    const iceH = (VH - WALL * 2) * scale;
    ctx.save();
    roundRect(ctx, iceX, iceY, iceW, iceH, CORNER * scale);
    const ice = ctx.createLinearGradient(iceX, iceY, iceX, iceY + iceH);
    ice.addColorStop(0, '#0a2430');
    ice.addColorStop(0.5, '#071820');
    ice.addColorStop(1, '#1a1020');
    ctx.fillStyle = ice;
    ctx.fill();
    ctx.clip();

    ctx.fillStyle = 'rgba(0, 245, 224, 0.045)';
    const gap = 22 * scale;
    for (let y = iceY + 8 * scale; y < iceY + iceH; y += gap) {
      for (let x = iceX + 8 * scale; x < iceX + iceW; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, 0.9 * scale, 0, TAU);
        ctx.fill();
      }
    }

    ctx.strokeStyle = 'rgba(0, 245, 224, 0.38)';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([8 * scale, 10 * scale]);
    ctx.beginPath();
    ctx.moveTo(sx(WALL + 8), sy(VH * 0.5));
    ctx.lineTo(sx(VW - WALL - 8), sy(VH * 0.5));
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(0, 245, 224, 0.28)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(sx(VW * 0.5), sy(VH * 0.5), 52 * scale, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 245, 224, 0.16)';
    ctx.beginPath();
    ctx.arc(sx(VW * 0.5), sy(VH * 0.5), 4.5 * scale, 0, TAU);
    ctx.fill();

    const creaseW = GOAL_W * 0.72 * scale;
    ctx.strokeStyle = 'rgba(0, 245, 224, 0.22)';
    ctx.lineWidth = 1.4 * scale;
    roundRect(ctx, sx(VW * 0.5) - creaseW * 0.5, sy(WALL + 6), creaseW, 46 * scale, 8 * scale);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.22)';
    roundRect(ctx, sx(VW * 0.5) - creaseW * 0.5, sy(VH - WALL - 52), creaseW, 46 * scale, 8 * scale);
    ctx.stroke();

    const showB = G.phase === 'title' ? 0 : G.bot;
    const showT = G.phase === 'title' ? 0 : G.top;
    ctx.font = '900 ' + (86 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 61, 184, 0.12)';
    ctx.fillText(String(showT), sx(VW * 0.5), sy(VH * 0.28));
    ctx.fillStyle = 'rgba(0, 245, 224, 0.12)';
    ctx.fillText(String(showB), sx(VW * 0.5), sy(VH * 0.72));
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 245, 224, 0.7)';
    ctx.lineWidth = 5 * scale;
    ctx.shadowColor = 'rgba(0, 245, 224, 0.4)';
    ctx.shadowBlur = 14 * scale;
    roundRect(ctx, sx(6), sy(6), (VW - 12) * scale, (VH - 12) * scale, 16 * scale);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(0, 245, 224, 0.55)';
    ctx.fillRect(sx(6), sy(6), (VW - 12) * scale, (WALL - 2) * scale);
    ctx.fillStyle = 'rgba(255, 61, 184, 0.5)';
    ctx.fillRect(sx(6), sy(VH - WALL - 4), (VW - 12) * scale, (WALL - 2) * scale);

    const g0 = goalX0();
    const g1 = goalX1();
    const gf = G.goalFlash;
    const topGlow = G.goalTop && gf > 0 ? 0.35 + gf * 0.65 : 0.22;
    const botGlow = !G.goalTop && gf > 0 ? 0.35 + gf * 0.65 : 0.22;
    ctx.fillStyle = rgba(CYN, topGlow);
    ctx.fillRect(sx(g0), sy(2), (g1 - g0) * scale, (WALL + 4) * scale);
    ctx.fillStyle = rgba(MAG, botGlow);
    ctx.fillRect(sx(g0), sy(VH - WALL - 6), (g1 - g0) * scale, (WALL + 4) * scale);

    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.arc(sx(g0), sy(WALL), POST_R * 0.7 * scale, 0, TAU);
    ctx.arc(sx(g1), sy(WALL), POST_R * 0.7 * scale, 0, TAU);
    ctx.arc(sx(g0), sy(VH - WALL), POST_R * 0.7 * scale, 0, TAU);
    ctx.arc(sx(g1), sy(VH - WALL), POST_R * 0.7 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawMallet(m, rgb) {
    if (!m) return;
    const x = sx(m.x);
    const y = sy(m.y);
    const r = m.r * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(m.sx, m.sy);
    ctx.shadowColor = rgba(rgb, 0.55 + m.glow);
    ctx.shadowBlur = (16 + m.glow * 20) * scale;
    const g = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, rgba(WHT, 0.95));
    g.addColorStop(0.38, rgba(rgb, 1));
    g.addColorStop(1, 'rgba(' + ((rgb[0] * 0.28) | 0) + ',' + ((rgb[1] * 0.28) | 0) + ',' + ((rgb[2] * 0.32) | 0) + ',1)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(WHT, 0.45);
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(6, 10, 16, 0.55)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.28);
    ctx.beginPath();
    ctx.ellipse(-r * 0.22, -r * 0.28, r * 0.28, r * 0.14, -0.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPuck() {
    const p = G.puck;
    if (!p) return;
    const rgb = p.tintT > 0 ? p.tint : WHT;
    const spd = hypot(p.vx, p.vy);
    if (!REDUCE && p.trail) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const k = (i + 1) / p.trail.length;
        ctx.fillStyle = rgba(rgb, 0.14 * k);
        ctx.beginPath();
        ctx.arc(sx(t.x), sy(t.y), p.r * k * 0.95 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    if (p.stretch > 0 && spd > 40) {
      const ang = Math.atan2(p.vy, p.vx);
      ctx.rotate(ang);
      const st = 1 + p.stretch * 0.7;
      ctx.scale(st, 1 / st);
    }
    ctx.shadowColor = rgba(rgb === MAG ? MAG : CYN, 0.85);
    ctx.shadowBlur = 12 * scale;
    const g = ctx.createRadialGradient(-p.r * 0.28 * scale, -p.r * 0.32 * scale, 0.4 * scale, 0, 0, p.r * scale);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, '#e8ffff');
    g.addColorStop(1, rgb === MAG ? '#ff3db8' : '#00c8c8');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.r * scale, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 40, 48, 0.35)';
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 0.55 * scale, 0, TAU);
    ctx.stroke();
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
      const k = s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, 0.6 * (1 - k));
      ctx.lineWidth = (2.4 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * 0.35 + k * s.rad) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const k = s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, 0.5 * (1 - k));
      ctx.lineWidth = (2.2 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + k * 26) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(1 - f.t / f.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = '800 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawServeHint() {
    if (!G.serving || G.phase !== 'play') return;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.25 * Math.sin(G.t * 4);
    ctx.fillStyle = '#d5d2ee';
    ctx.font = '600 ' + (14 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(G.serveBot ? '你发球' : '对方发球', sx(VW * 0.5), sy(VH * 0.5));
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.2);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : ((Math.random() - 0.5) * G.shake + G.kickX) * scale;
    const shy = REDUCE ? 0 : ((Math.random() - 0.5) * G.shake + G.kickY) * scale;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawCourt();
    drawMallet(G.T, MAG);
    drawMallet(G.B, CYN);
    drawPuck();
    drawParticles();
    drawFloats();
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

  function restart() {
    audio.ensure();
    if (G.phase === 'title') {
      startMatch('ai');
      return;
    }
    startMatch(G.kind);
  }

  function goMenu() {
    audio.ensure();
    G.phase = 'title';
    G.bot = 0;
    G.top = 0;
    G.rally = 0;
    bootDemo();
    showTitle();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'w' || k === 'W' || code === 'KeyW') keys.w = down;
    if (k === 'a' || k === 'A' || code === 'KeyA') keys.a = down;
    if (k === 's' || k === 'S' || code === 'KeyS') keys.s = down;
    if (k === 'd' || k === 'D' || code === 'KeyD') keys.d = down;
    if (k === 'ArrowUp' || k === 'Up') keys.up = down;
    if (k === 'ArrowDown' || k === 'Down') keys.down = down;
    if (k === 'ArrowLeft' || k === 'Left') keys.left = down;
    if (k === 'ArrowRight' || k === 'Right') keys.right = down;
    const block = k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight' ||
      k === ' ' || k === 'Spacebar' ||
      ((k === 'w' || k === 'W' || k === 'a' || k === 'A' || k === 's' || k === 'S' || k === 'd' || k === 'D') &&
        !e.metaKey && !e.ctrlKey);
    if (down && block) e.preventDefault();
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      if (overlayOpen()) {
        e.preventDefault();
        if (G.phase === 'title') startMatch('ai');
        else if (G.phase === 'end') startMatch(G.kind);
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const w = pointerWorld(e);
    pointers[e.pointerId] = { x: w.x, y: w.y };
    mouse.x = w.x;
    mouse.y = w.y;
    mouse.hover = true;
    canvas.classList.add('press');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    const w = pointerWorld(e);
    mouse.x = w.x;
    mouse.y = w.y;
    if (e.pointerType === 'mouse') mouse.hover = true;
    if (pointers[e.pointerId]) {
      pointers[e.pointerId].x = w.x;
      pointers[e.pointerId].y = w.y;
    }
  });
  function endPtr(e) {
    delete pointers[e.pointerId];
    canvas.classList.remove('press');
    if (e.pointerType !== 'mouse') mouse.hover = false;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') mouse.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.w = keys.a = keys.s = keys.d = false;
    keys.up = keys.down = keys.left = keys.right = false;
  });

  btnAi.addEventListener('click', function () {
    audio.ensure();
    startMatch('ai');
  });
  btnTwo.addEventListener('click', function () {
    audio.ensure();
    startMatch('two');
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

  function onDiffClick(e) {
    const btn = e.target.closest('[data-diff]');
    if (!btn) return;
    audio.ensure();
    const n = parseInt(btn.getAttribute('data-diff'), 10);
    setDiff(n, true);
  }
  document.getElementById('diff').addEventListener('click', onDiffClick);
  ovDiff.addEventListener('click', onDiffClick);

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
    for (let i = 0; i < 26; i++) {
      motes.push({
        x: rand(22, VW - 22),
        y: rand(28, VH - 28),
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
  loadDiff();
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
