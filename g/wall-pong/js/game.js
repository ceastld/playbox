'use strict';

(function () {
  const VW = 800;
  const VH = 480;
  const WALL = 12;
  const PAD_W = 14;
  const PAD_H = 80;
  const PAD_X = 36;
  const PAD_ACC = 3400;
  const PAD_MAX = 520;
  const PAD_FRIC = 11;
  const BALL_R = 7;
  const BALL_SPD = 320;
  const BALL_MAX = 560;
  const BALL_BUMP = 1.035;
  const MAX_ANG = 1.05;
  const SPIN = 0.22;
  const TARGET = 11;
  const BY = 2;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const OBS_W = 18;
  const OBS_H = 132;
  const OBS_AMP = 148;
  const OBS_OMEGA = 1.85;
  const BEST_KEY = 'playbox-wall-pong-best';
  const MUTE_KEY = 'playbox-wall-pong-mute';
  const DIFF_KEY = 'playbox-wall-pong-diff';
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const WHT = [232, 255, 255];

  const DIFFS = [
    { name: '简', max: 236, react: 0.32, err: 64, look: 0.46, predict: 0.05 },
    { name: '中', max: 350, react: 0.14, err: 28, look: 0.2, predict: 0.55 },
    { name: '难', max: 448, react: 0.05, err: 10, look: 0.02, predict: 1 }
  ];

  const MODE_NAME = { ai: '对墙', two: '双人同机', wall: '迷墙' };

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
  const btnWall = document.getElementById('btn-wall');
  const btnAgain = document.getElementById('btn-again');
  const btnMenu = document.getElementById('btn-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreLEl = document.getElementById('score-l');
  const scoreREl = document.getElementById('score-r');
  const scoreLBox = document.getElementById('score-l-box');
  const scoreRBox = document.getElementById('score-r-box');
  const labL = document.getElementById('lab-l');
  const labR = document.getElementById('lab-r');
  const bestEl = document.getElementById('best');
  const modeLabel = document.getElementById('mode-label');
  const tagLabel = document.getElementById('tag-label');
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

  const keys = { w: false, s: false, up: false, down: false };
  const pointers = Object.create(null);
  const mouse = { hover: false, x: VW * 0.5, y: VH * 0.5 };
  const particles = [];
  const sparks = [];
  const motes = [];

  const G = {
    phase: 'title',
    kind: 'ai',
    diff: 1,
    t: 0,
    l: 0,
    r: 0,
    best: 0,
    rally: 0,
    serving: true,
    serveDir: 1,
    lock: 0.6,
    spd: BALL_SPD,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    toastT: 0,
    leftWin: false,
    ball: null,
    L: null,
    R: null,
    obs: { x: VW * 0.5, y: VH * 0.5, w: OBS_W, h: OBS_H },
    aiT: 0,
    aiY: VH * 0.5,
    demoAiT: 0,
    demoY: VH * 0.5
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
  function padYBounds() {
    const half = PAD_H * 0.5;
    return { lo: WALL + half + 2, hi: VH - WALL - half - 2 };
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
    paddle(left) {
      this.ensure();
      this.beep(left ? 260 : 220, 0.05, 'triangle', 0.045, left ? 480 : 400);
    },
    wall() {
      this.ensure();
      this.beep(170, 0.04, 'square', 0.018);
    },
    obs() {
      this.ensure();
      this.beep(390, 0.05, 'square', 0.03, 260);
    },
    point(left) {
      this.ensure();
      this.beep(left ? 523 : 392, 0.1, 'sine', 0.05);
      this.beep(left ? 784 : 262, 0.16, 'triangle', 0.04, left ? 1046 : 180);
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
    },
    serve() {
      this.ensure();
      this.beep(640, 0.06, 'sine', 0.03, 880);
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
    G.toastT = 1.35;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function overlayOpen() {
    return !overlay.classList.contains('hidden');
  }

  function makePad(x) {
    return { x: x, y: VH * 0.5, w: PAD_W, h: PAD_H, vy: 0 };
  }

  function makeBall(x, y) {
    return {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      r: BALL_R,
      trail: [],
      tint: CYN,
      tintT: 0
    };
  }

  function resetPaddles() {
    G.L = makePad(PAD_X);
    G.R = makePad(VW - PAD_X);
  }

  function matchOver(l, r) {
    return (l >= TARGET || r >= TARGET) && Math.abs(l - r) >= BY;
  }

  function syncHud() {
    scoreLEl.textContent = String(G.phase === 'title' ? 0 : G.l);
    scoreREl.textContent = String(G.phase === 'title' ? 0 : G.r);
    bestEl.textContent = String(G.best);
    const two = G.kind === 'two' && G.phase !== 'title';
    labL.textContent = two ? '左' : '你';
    labR.textContent = two ? '右' : '对方';
    if (G.phase === 'title') {
      modeLabel.textContent = '墙乒';
      tagLabel.textContent = 'PONG';
    } else {
      modeLabel.textContent = MODE_NAME[G.kind] || '墙乒';
      tagLabel.textContent = G.kind === 'two' ? '2P' : DIFFS[G.diff].name;
    }
    const win = G.phase === 'end' && G.leftWin;
    const lose = G.phase === 'end' && !G.leftWin;
    modeLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('warn', lose);
  }

  function showTitle() {
    G.phase = 'title';
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'PONG';
    ovTitle.textContent = '墙乒';
    ovLead.textContent = '挡球回击，先到十一。';
    ovOps.textContent = 'W/S 或 ↑/↓ 移动 · 拖动挡板 · 双人分两侧';
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    ovDiff.classList.remove('gone');
    setHint('W/S 或方向键移动 · 拖动挡板 · 先到十一须赢两分');
    syncHud();
  }

  function showEnd() {
    G.phase = 'end';
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    const two = G.kind === 'two';
    const left = G.leftWin;
    panel.classList.toggle('win', left);
    panel.classList.toggle('lose', !left);
    ovKicker.textContent = left ? 'WIN' : 'MISS';
    if (two) {
      ovTitle.textContent = left ? '左方胜' : '右方胜';
    } else {
      ovTitle.textContent = left ? '你赢了' : '对方到了';
    }
    ovLead.textContent = G.l + ' : ' + G.r + ' · 先到十一须赢两分';
    ovOps.textContent = 'R 再来 · 换模式回标题';
    ovStart.classList.add('gone');
    ovDiff.classList.add('gone');
    ovEnd.classList.remove('gone');
    setHint(left ? '再来一局' : '再来一局', left ? 'hot' : 'warn');
    syncHud();
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    canvas.focus();
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 4);
    for (let i = 0; i < n; i++) {
      if (particles.length > 120) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.1),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb
      });
    }
  }

  function popSpark(x, y, rgb) {
    if (REDUCE) return;
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    if (sparks.length > 12) sparks.shift();
  }

  function bumpStage() {
    if (REDUCE) return;
    stageEl.classList.remove('die');
    void stageEl.offsetWidth;
    stageEl.classList.add('die');
  }

  function flashScore(left) {
    const box = left ? scoreLBox : scoreRBox;
    box.classList.remove('flash');
    void box.offsetWidth;
    box.classList.add('flash');
  }

  function placeServe() {
    const dir = G.serveDir < 0 ? -1 : 1;
    const gap = OBS_W * 0.5 + BALL_R + 28;
    G.ball.x = VW * 0.5 - dir * gap;
    G.ball.y = VH * 0.5;
    G.ball.vx = 0;
    G.ball.vy = 0;
    G.ball.trail.length = 0;
  }

  function startServe(dir) {
    G.serving = true;
    G.serveDir = dir < 0 ? -1 : 1;
    G.lock = 0.7;
    G.spd = BALL_SPD;
    G.rally = 0;
    placeServe();
  }

  function launch() {
    if (!G.serving) return;
    G.serving = false;
    G.lock = 0;
    const dir = G.serveDir < 0 ? -1 : 1;
    const ang = rand(0.16, 0.42) * (Math.random() < 0.5 ? -1 : 1);
    const spd = BALL_SPD;
    G.spd = spd;
    G.ball.vx = Math.cos(ang) * spd * dir;
    G.ball.vy = Math.sin(ang) * spd;
    if (G.phase === 'play') audio.serve();
  }

  function startMatch(kind) {
    G.kind = kind;
    G.phase = 'play';
    G.l = 0;
    G.r = 0;
    G.rally = 0;
    G.leftWin = false;
    G.shake = 0;
    G.flash = 0;
    G.aiT = 0;
    G.aiY = VH * 0.5;
    resetPaddles();
    G.ball = makeBall(VW * 0.5, VH * 0.5);
    G.obs.y = VH * 0.5;
    startServe(1);
    hideOverlay();
    audio.start();
    if (kind === 'two') {
      setHint('W/S 左拍 · ↑/↓ 右拍 · 两侧拖动');
    } else if (kind === 'wall') {
      setHint('中间挡块会动 · ' + DIFFS[G.diff].name + ' · 先到十一须赢两分');
    } else {
      setHint('W/S 或 ↑/↓ 或拖动左拍 · ' + DIFFS[G.diff].name);
    }
    toast(MODE_NAME[kind], false, kind === 'wall');
    syncHud();
  }

  function bootDemo() {
    resetPaddles();
    G.ball = makeBall(VW * 0.5, VH * 0.5);
    G.serving = false;
    G.lock = 0;
    G.spd = BALL_SPD;
    const ang = rand(0.12, 0.32) * (Math.random() < 0.5 ? -1 : 1);
    const dir = Math.random() < 0.5 ? -1 : 1;
    G.ball.vx = Math.cos(ang) * BALL_SPD * dir;
    G.ball.vy = Math.sin(ang) * BALL_SPD;
    G.obs.y = VH * 0.5;
    G.demoAiT = 0;
    G.demoY = VH * 0.5;
    G.aiT = 0;
    G.aiY = VH * 0.5;
  }

  function useWall() {
    return G.kind === 'wall' && G.phase === 'play';
  }

  function obsYAt(t) {
    return VH * 0.5 + Math.sin(t * OBS_OMEGA) * OBS_AMP;
  }

  function bounceCircleRect(b, rect) {
    const hx = rect.w * 0.5;
    const hy = rect.h * 0.5;
    const left = rect.x - hx;
    const right = rect.x + hx;
    const top = rect.y - hy;
    const bot = rect.y + hy;
    const cx = clamp(b.x, left, right);
    const cy = clamp(b.y, top, bot);
    let dx = b.x - cx;
    let dy = b.y - cy;
    if (dx === 0 && dy === 0) {
      const dl = b.x - left;
      const dr = right - b.x;
      const dt = b.y - top;
      const db = bot - b.y;
      const m = Math.min(dl, dr, dt, db);
      if (m === dl) {
        b.x = left - b.r - 0.4;
        b.vx = -Math.abs(b.vx);
      } else if (m === dr) {
        b.x = right + b.r + 0.4;
        b.vx = Math.abs(b.vx);
      } else if (m === dt) {
        b.y = top - b.r - 0.4;
        b.vy = -Math.abs(b.vy);
      } else {
        b.y = bot + b.r + 0.4;
        b.vy = Math.abs(b.vy);
      }
      return true;
    }
    const dist = hypot(dx, dy);
    if (dist >= b.r) return false;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = b.r - dist;
    b.x += nx * (overlap + 0.5);
    b.y += ny * (overlap + 0.5);
    const vn = b.vx * nx + b.vy * ny;
    if (vn < 0) {
      b.vx -= 2 * vn * nx;
      b.vy -= 2 * vn * ny;
    }
    return true;
  }

  function keepSpeed(b, spd) {
    const minVx = spd * 0.42;
    if (Math.abs(b.vx) < minVx) {
      b.vx = (b.vx < 0 ? -1 : 1) * minVx;
    }
    const n2 = hypot(b.vx, b.vy) || 1;
    b.vx = b.vx / n2 * spd;
    b.vy = b.vy / n2 * spd;
  }

  function bouncePaddle(b, p, left) {
    let off = (b.y - p.y) / (p.h * 0.5);
    off = clamp(off, -1, 1);
    const ang = off * MAX_ANG;
    G.spd = Math.min(BALL_MAX, Math.max(G.spd, hypot(b.vx, b.vy)) * BALL_BUMP);
    const spd = G.spd;
    const dir = left ? 1 : -1;
    b.vx = Math.cos(ang) * spd * dir;
    b.vy = Math.sin(ang) * spd + p.vy * SPIN;
    keepSpeed(b, spd);
    b.x = left ? p.x + p.w * 0.5 + b.r + 0.5 : p.x - p.w * 0.5 - b.r - 0.5;
    b.tint = left ? CYN : MAG;
    b.tintT = 0.22;
    G.rally += 1;
    if (G.phase === 'play') audio.paddle(left);
    emit(6, {
      x: b.x,
      y: b.y,
      j: 6,
      vx0: dir * 20,
      vx1: dir * 90,
      vy0: -70,
      vy1: 70,
      life: 0.28,
      r0: 0.7,
      r1: 1.8,
      rgb: left ? CYN : MAG
    });
  }

  function paddleHit(b, p, left) {
    const hx = p.w * 0.5;
    const hy = p.h * 0.5;
    if (b.y + b.r < p.y - hy) return false;
    if (b.y - b.r > p.y + hy) return false;
    if (left) {
      if (b.vx > 0) return false;
      if (b.x + b.r < p.x - hx - 2) return false;
      if (b.x - b.r > p.x + hx + 2) return false;
      return b.x <= p.x + hx + b.r + 1;
    }
    if (b.vx < 0) return false;
    if (b.x - b.r > p.x + hx + 2) return false;
    if (b.x + b.r < p.x - hx - 2) return false;
    return b.x >= p.x - hx - b.r - 1;
  }

  function predictY(fromX, toX, y, vx, vy) {
    if (vx === 0) return y;
    const top = WALL + BALL_R;
    const bot = VH - WALL - BALL_R;
    let x = fromX;
    let py = y;
    let pvy = vy;
    let guard = 0;
    const dt = 1 / 120;
    const goingRight = toX > fromX;
    while (guard < 240) {
      guard += 1;
      x += vx * dt;
      py += pvy * dt;
      if (py < top) {
        py = top + (top - py);
        pvy = Math.abs(pvy);
      } else if (py > bot) {
        py = bot - (py - bot);
        pvy = -Math.abs(pvy);
      }
      if (goingRight && x >= toX) break;
      if (!goingRight && x <= toX) break;
    }
    return py;
  }

  function thinkAI(pad, toward, dt, cfg, timerKey, targetKey) {
    G[timerKey] -= dt;
    const b = G.ball;
    const coming = toward > 0 ? b.vx > 0 : b.vx < 0;
    const progress = toward > 0 ? b.x / VW : 1 - b.x / VW;
    if (!coming || progress < cfg.look) {
      G[targetKey] = lerp(G[targetKey], VH * 0.5, 1 - Math.exp(-1.6 * dt));
      return;
    }
    if (G[timerKey] <= 0) {
      G[timerKey] = cfg.react;
      const pred = predictY(b.x, pad.x, b.y, b.vx, b.vy);
      const mix = lerp(b.y, pred, cfg.predict);
      G[targetKey] = mix + rand(-cfg.err, cfg.err);
    }
  }

  function steerPad(p, dt, maxSpd, targetY, up, down) {
    const b = padYBounds();
    if (up || down) {
      let a = 0;
      if (up) a -= PAD_ACC;
      if (down) a += PAD_ACC;
      p.vy += a * dt;
      p.vy = clamp(p.vy, -PAD_MAX, PAD_MAX);
      p.y += p.vy * dt;
    } else if (targetY != null) {
      const ty = clamp(targetY, b.lo, b.hi);
      const k = 1 - Math.exp(-22 * dt);
      const ny = lerp(p.y, ty, k);
      p.vy = (ny - p.y) / Math.max(dt, 0.001);
      p.vy = clamp(p.vy, -maxSpd, maxSpd);
      p.y += p.vy * dt;
    } else {
      p.vy *= Math.exp(-dt * PAD_FRIC);
      p.y += p.vy * dt;
    }
    if (p.y < b.lo) {
      p.y = b.lo;
      p.vy *= 0.15;
    } else if (p.y > b.hi) {
      p.y = b.hi;
      p.vy *= 0.15;
    }
  }

  function pointerTarget(side) {
    let y = null;
    let any = false;
    for (const id in pointers) {
      const p = pointers[id];
      const s = G.kind === 'two' && G.phase === 'play' ? (p.x < VW * 0.5 ? 0 : 1) : 0;
      if (s === side) {
        y = p.y;
        any = true;
      }
    }
    if (!any && G.kind !== 'two' && mouse.hover && side === 0) y = mouse.y;
    return y;
  }

  function updatePaddles(dt) {
    const play = G.phase === 'play';
    const title = G.phase === 'title';
    const two = G.kind === 'two' && play;
    const cfg = DIFFS[G.diff];
    const mid = DIFFS[1];

    if (title) {
      thinkAI(G.L, -1, dt, mid, 'demoAiT', 'demoY');
      thinkAI(G.R, 1, dt, mid, 'aiT', 'aiY');
      steerPad(G.L, dt, mid.max, G.demoY, false, false);
      steerPad(G.R, dt, mid.max, G.aiY, false, false);
      return;
    }

    if (G.phase === 'end') {
      steerPad(G.L, dt, PAD_MAX, null, false, false);
      steerPad(G.R, dt, PAD_MAX, null, false, false);
      return;
    }

    if (!play) return;

    const lUp = two ? keys.w : (keys.w || keys.up);
    const lDown = two ? keys.s : (keys.s || keys.down);
    const lPtr = pointerTarget(0);
    if (lUp || lDown) steerPad(G.L, dt, PAD_MAX, null, lUp, lDown);
    else steerPad(G.L, dt, PAD_MAX, lPtr, false, false);

    if (two) {
      const rPtr = pointerTarget(1);
      if (keys.up || keys.down) steerPad(G.R, dt, PAD_MAX, null, keys.up, keys.down);
      else steerPad(G.R, dt, PAD_MAX, rPtr, false, false);
    } else {
      thinkAI(G.R, 1, dt, cfg, 'aiT', 'aiY');
      steerPad(G.R, dt, cfg.max, G.aiY, false, false);
    }
  }

  function moveBall(dt) {
    const b = G.ball;
    if (!b || G.serving) return;
    const dist = hypot(b.vx, b.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / 4));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      b.x += b.vx * h;
      b.y += b.vy * h;

      const top = WALL + b.r;
      const bot = VH - WALL - b.r;
      if (b.y < top) {
        b.y = top;
        b.vy = Math.abs(b.vy);
        if (G.phase === 'play') audio.wall();
      } else if (b.y > bot) {
        b.y = bot;
        b.vy = -Math.abs(b.vy);
        if (G.phase === 'play') audio.wall();
      }

      if (useWall() && bounceCircleRect(b, G.obs)) {
        keepSpeed(b, G.spd);
        if (G.phase === 'play') audio.obs();
        emit(5, {
          x: b.x, y: b.y, j: 5,
          vx0: -80, vx1: 80, vy0: -60, vy1: 60,
          life: 0.26, r0: 0.6, r1: 1.7, rgb: GOLD
        });
      }

      if (paddleHit(b, G.L, true)) bouncePaddle(b, G.L, true);
      else if (paddleHit(b, G.R, false)) bouncePaddle(b, G.R, false);
    }
  }

  function scorePoint(leftGets) {
    if (G.phase !== 'play') {
      startServe(leftGets ? 1 : -1);
      G.lock = 0.35;
      return;
    }
    if (leftGets) G.l += 1;
    else G.r += 1;
    flashScore(leftGets);
    G.flash = 0.18;
    G.flashRgb = leftGets ? CYN : MAG;
    G.shake = REDUCE ? 0 : 7;
    bumpStage();
    audio.point(leftGets);
    emit(16, {
      x: leftGets ? VW - 10 : 10,
      y: G.ball.y,
      j: 18,
      vx0: leftGets ? -180 : 40,
      vx1: leftGets ? -40 : 180,
      vy0: -120,
      vy1: 120,
      life: 0.45,
      r0: 1,
      r1: 2.6,
      rgb: leftGets ? CYN : MAG
    });
    popSpark(G.ball.x, G.ball.y, leftGets ? CYN : MAG);
    syncHud();

    if (matchOver(G.l, G.r)) {
      G.leftWin = G.l > G.r;
      if (G.leftWin) saveWin();
      if (G.leftWin) audio.win();
      else audio.lose();
      showEnd();
      return;
    }

    if (G.l >= TARGET - 1 && G.r >= TARGET - 1) toast('须赢两分', false, true);
    else if (leftGets) toast('得分');
    else toast('对方得分', true);

    startServe(leftGets ? 1 : -1);
  }

  function checkGoal() {
    const b = G.ball;
    if (!b || G.serving) return;
    if (b.x + b.r < 0) scorePoint(false);
    else if (b.x - b.r > VW) scorePoint(true);
  }

  function updateFx(dt) {
    G.shake *= Math.exp(-dt * 9);
    G.flash = Math.max(0, G.flash - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0) toastEl.classList.add('hidden');
    if (G.ball) G.ball.tintT = Math.max(0, G.ball.tintT - dt);
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.4);
      q.vy *= Math.exp(-dt * 1.4);
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

  function recordTrail() {
    if (REDUCE || !G.ball || G.serving) return;
    const b = G.ball;
    b.trail.push({ x: b.x, y: b.y });
    if (b.trail.length > 10) b.trail.shift();
  }

  function update(dt) {
    G.t += dt;
    G.lock = Math.max(0, G.lock - dt);
    if (useWall()) G.obs.y = obsYAt(G.t);
    updatePaddles(dt);

    if (G.phase !== 'end') {
      if (G.serving) {
        placeServe();
        if (G.lock <= 0) launch();
      } else {
        moveBall(dt);
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
    g.addColorStop(0, '#07141c');
    g.addColorStop(0.5, '#05030c');
    g.addColorStop(1, '#120814');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(400), sy(240), 20 * scale, sx(400), sy(240), 360 * scale);
    vg.addColorStop(0, 'rgba(0, 240, 255, 0.06)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
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
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 3 * scale;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.35)';
    ctx.shadowBlur = 12 * scale;
    roundRect(ctx, sx(6), sy(6), (VW - 12) * scale, (VH - 12) * scale, 14 * scale);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.22)';
    ctx.lineWidth = 1.2 * scale;
    roundRect(ctx, sx(10), sy(10), (VW - 20) * scale, (VH - 20) * scale, 12 * scale);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.fillRect(sx(6), sy(6), (VW - 12) * scale, WALL * scale);
    ctx.fillRect(sx(6), sy(VH - WALL - 6), (VW - 12) * scale, WALL * scale);

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([8 * scale, 10 * scale]);
    ctx.beginPath();
    ctx.moveTo(sx(VW * 0.5), sy(WALL + 8));
    ctx.lineTo(sx(VW * 0.5), sy(VH - WALL - 8));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    const showL = G.phase === 'title' ? 0 : G.l;
    const showR = G.phase === 'title' ? 0 : G.r;
    ctx.save();
    ctx.font = '900 ' + (72 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0, 240, 255, 0.14)';
    ctx.fillText(String(showL), sx(VW * 0.28), sy(28));
    ctx.fillStyle = 'rgba(255, 61, 184, 0.14)';
    ctx.fillText(String(showR), sx(VW * 0.72), sy(28));
    ctx.restore();
  }

  function drawObs() {
    if (!useWall()) return;
    const o = G.obs;
    const x = sx(o.x - o.w * 0.5);
    const y = sy(o.y - o.h * 0.5);
    ctx.save();
    ctx.shadowColor = 'rgba(255,227,107,0.55)';
    ctx.shadowBlur = 16 * scale;
    roundRect(ctx, x, y, o.w * scale, o.h * scale, 5 * scale);
    const g = ctx.createLinearGradient(x, y, x + o.w * scale, y);
    g.addColorStop(0, '#ffe36b');
    g.addColorStop(0.5, '#fff6c8');
    g.addColorStop(1, '#ffb84a');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(ctx, x + 2 * scale, y + 6 * scale, (o.w - 4) * scale, 8 * scale, 3 * scale);
    ctx.fill();
    ctx.restore();
  }

  function drawPad(p, rgb, left) {
    const x = sx(p.x - p.w * 0.5);
    const y = sy(p.y - p.h * 0.5);
    const w = p.w * scale;
    const h = p.h * scale;
    ctx.save();
    ctx.shadowColor = rgba(rgb, 0.7);
    ctx.shadowBlur = 16 * scale;
    roundRect(ctx, x, y, w, h, 6 * scale);
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, rgba(WHT, 0.95));
    g.addColorStop(0.35, rgba(rgb, 1));
    g.addColorStop(1, rgba([rgb[0] * 0.4 | 0, rgb[1] * 0.35 | 0, rgb[2] * 0.4 | 0], 1));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.38)';
    if (left) roundRect(ctx, x + 3 * scale, y + 6 * scale, 4 * scale, h - 12 * scale, 2 * scale);
    else roundRect(ctx, x + w - 7 * scale, y + 6 * scale, 4 * scale, h - 12 * scale, 2 * scale);
    ctx.fill();
    ctx.restore();
  }

  function drawBall() {
    const b = G.ball;
    if (!b) return;
    const rgb = b.tintT > 0 ? b.tint : WHT;
    if (!REDUCE && b.trail) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < b.trail.length; i++) {
        const t = b.trail[i];
        const k = (i + 1) / b.trail.length;
        ctx.fillStyle = rgba(rgb, 0.12 * k);
        ctx.beginPath();
        ctx.arc(sx(t.x), sy(t.y), b.r * k * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.shadowColor = rgba(rgb === MAG ? MAG : CYN, 0.85);
    ctx.shadowBlur = 12 * scale;
    const g = ctx.createRadialGradient(
      sx(b.x - 1.4), sy(b.y - 1.6), 0.4 * scale,
      sx(b.x), sy(b.y), b.r * scale
    );
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, '#e8ffff');
    g.addColorStop(1, rgb === MAG ? '#ff3db8' : '#00c8e0');
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
    if (!G.serving || G.phase !== 'play') return;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.25 * Math.sin(G.t * 4);
    ctx.fillStyle = '#d5d2ee';
    ctx.font = '600 ' + (14 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('开球', sx(VW * 0.5), sy(VH * 0.38));
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.16);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
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
    drawCourt();
    drawObs();
    if (G.L) drawPad(G.L, CYN, true);
    if (G.R) drawPad(G.R, MAG, false);
    drawBall();
    drawParticles();
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
    G.l = 0;
    G.r = 0;
    bootDemo();
    showTitle();
  }

  function tryServeNow() {
    if (G.phase === 'play' && G.serving && G.lock <= 0.55) launch();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'w' || k === 'W' || code === 'KeyW') keys.w = down;
    if (k === 's' || k === 'S' || code === 'KeyS') keys.s = down;
    if (k === 'ArrowUp' || k === 'Up') keys.up = down;
    if (k === 'ArrowDown' || k === 'Down') keys.down = down;
    const block = k === 'ArrowUp' || k === 'ArrowDown' || k === ' ' || k === 'Spacebar' ||
      k === 'ArrowLeft' || k === 'ArrowRight' ||
      ((k === 'w' || k === 'W' || k === 's' || k === 'S') && !e.metaKey && !e.ctrlKey);
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
        return;
      }
      tryServeNow();
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
    if (!overlayOpen()) tryServeNow();
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
    keys.w = keys.s = keys.up = keys.down = false;
  });

  btnAi.addEventListener('click', function () {
    audio.ensure();
    startMatch('ai');
  });
  btnTwo.addEventListener('click', function () {
    audio.ensure();
    startMatch('two');
  });
  btnWall.addEventListener('click', function () {
    audio.ensure();
    startMatch('wall');
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
    for (let i = 0; i < 28; i++) {
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
