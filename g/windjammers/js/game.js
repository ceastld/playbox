'use strict';

/* Catch-and-throw flying disc. Not paddle bounce. */

(function () {
  const VW = 480;
  const VH = 720;
  const WALL = 22;
  const NET = VH * 0.5;
  const PLAYER_R = 16;
  const DISC_R = 11;
  const FIVE_W = 118;
  const POST_R = 7;
  const TARGET = 12;
  const HOLD_MAX = 2.35;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-windjammers-best';
  const MUTE_KEY = 'playbox-windjammers-mute';
  const AUTO_SPEED_KEY = 'playbox-windjammers-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (BEST_KEY !== 'playbox-windjammers-best') throw new Error('best key');
  if (MUTE_KEY !== 'playbox-windjammers-mute') throw new Error('mute key');

  const HOT = [255, 106, 34];
  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const WHT = [255, 244, 230];

  const AUTO_CFG = [
    null,
    { max: 250, react: 0.14, look: 0.28, err: 22, wait: 0.32, super: 0.22 },
    { max: 340, react: 0.07, look: 0.36, err: 10, wait: 0.16, super: 0.4 },
    { max: 460, react: 0.02, look: 0.46, err: 2, wait: 0.07, super: 0.62 },
    { max: 560, react: 0, look: 0.54, err: 0, wait: 0.03, super: 0.85 }
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
  const btnMatch = document.getElementById('btn-match');
  const btnRush = document.getElementById('btn-rush');
  const btnAgain = document.getElementById('btn-again');
  const btnMenu = document.getElementById('btn-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreBEl = document.getElementById('score-b');
  const scoreTEl = document.getElementById('score-t');
  const scoreBBox = document.getElementById('score-b-box');
  const scoreTBox = document.getElementById('score-t-box');
  const labB = document.getElementById('lab-b');
  const labT = document.getElementById('lab-t');
  const bestEl = document.getElementById('best');
  const modeLabel = document.getElementById('mode-label');
  const tagLabel = document.getElementById('tag-label');
  const superLabel = document.getElementById('super-label');
  const comboLabel = document.getElementById('combo-label');
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
  let kickTok = 0;

  const keys = {
    l: false, r: false, u: false, d: false,
    throw: false, super: false
  };
  const pointers = Object.create(null);
  const mouse = { hover: false, x: VW * 0.5, y: VH * 0.78 };
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const motes = [];

  let autoOn = false;
  let autoSpeed = 3;
  const autoB = { t: 0, wait: 0, phase: 'idle' };
  const autoT = { t: 0, wait: 0, phase: 'idle' };

  const G = {
    phase: 'title',
    kind: 'match',
    t: 0,
    bot: 0,
    top: 0,
    best: 0,
    rally: 0,
    serving: true,
    serveBot: true,
    lock: 0.5,
    shake: 0,
    kickX: 0,
    kickY: 0,
    punch: 1,
    flash: 0,
    flashRgb: HOT,
    goalFlash: 0,
    goalTop: false,
    toastT: 0,
    stop: 0,
    botWin: false,
    disc: null,
    B: null,
    T: null,
    throwLatch: false,
    superLatch: false
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
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
  function rush() {
    return G.kind === 'rush';
  }
  function midY() {
    return NET;
  }
  function five0() {
    return (VW - FIVE_W) * 0.5;
  }
  function five1() {
    return (VW + FIVE_W) * 0.5;
  }
  function catchR() {
    return rush() ? 28 : 34;
  }
  function maxSpd() {
    return rush() ? 390 : 305;
  }
  function throwSpd(isSuper) {
    if (isSuper) return rush() ? 860 : 720;
    return rush() ? 560 : 430;
  }
  function accOf() {
    return rush() ? 3200 : 2500;
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
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
        const n = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, n * 0.4, n);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
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
    noise(dur, vol, from, to, delay) {
      if (!this.ctx || this.muted || !this.noiseBuf) return;
      const t = this.ctx.currentTime + (delay || 0);
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(from || 900, t);
      if (to) f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
      f.Q.value = 0.9;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    catch(bot) {
      this.ensure();
      this.noise(0.07, 0.07, 1400, 420);
      this.beep(bot ? 520 : 390, 0.07, 'triangle', 0.05, bot ? 280 : 200);
      this.beep(bot ? 880 : 660, 0.05, 'sine', 0.03);
    },
    throw(isSuper, bot) {
      this.ensure();
      this.noise(isSuper ? 0.14 : 0.08, isSuper ? 0.09 : 0.05, isSuper ? 420 : 700, isSuper ? 1800 : 240);
      this.beep(isSuper ? 140 : 210, 0.1, 'sawtooth', isSuper ? 0.05 : 0.03, 70);
      this.beep(bot ? (isSuper ? 980 : 640) : (isSuper ? 720 : 480), isSuper ? 0.16 : 0.08, 'sine', 0.045, bot ? 1400 : 900);
      if (isSuper) this.beep(1320, 0.12, 'square', 0.025, 420, 0.04);
    },
    wall() {
      this.ensure();
      this.beep(210, 0.04, 'square', 0.018);
    },
    post() {
      this.ensure();
      this.noise(0.05, 0.05, 1800, 500);
      this.beep(460, 0.06, 'square', 0.03, 220);
    },
    goal(bot, pts) {
      this.ensure();
      this.noise(0.18, 0.08, 900, 220);
      this.beep(bot ? 523 : 349, 0.12, 'sine', 0.06);
      this.beep(bot ? 784 : 262, 0.2, 'triangle', 0.05, bot ? 1240 : 140, 0.04);
      if (pts >= 5) this.beep(bot ? 1175 : 196, 0.28, 'sine', 0.045, bot ? 1760 : 90, 0.08);
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
      this.beep(220, 0.2, 'sawtooth', 0.045, 90);
      this.beep(130, 0.32, 'sine', 0.05, 50, 0.05);
    },
    start() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 784);
      this.beep(523, 0.12, 'triangle', 0.035, 0, 0.08);
    },
    combo(n) {
      this.ensure();
      const f = 500 + Math.min(10, n) * 72;
      this.beep(f, 0.07, 'triangle', 0.032, f * 1.45);
    },
    deny() {
      this.ensure();
      this.beep(160, 0.07, 'square', 0.028, 90);
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

  function autoCfg() {
    return AUTO_CFG[autoSpeed] || AUTO_CFG[3];
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
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
    if (autoOn && G.phase === 'play') playHint();
  }

  function overlayOpen() {
    return !overlay.classList.contains('hidden');
  }

  function playHint() {
    if (G.phase !== 'play') return;
    if (autoOn) {
      setHint('托管中 · 点自动停下 · 速度 ' + SPEED_LABELS[autoSpeed]);
      return;
    }
    setHint(rush() ? '疾盘 · 接窗更窄 · 空格甩 · Shift 超射' : '跑位接盘 · 空格甩 · Shift / Z 超射');
  }

  function clearControl() {
    keys.l = keys.r = keys.u = keys.d = false;
    keys.throw = keys.super = false;
    G.throwLatch = false;
    G.superLatch = false;
    for (const id in pointers) delete pointers[id];
    mouse.hover = false;
    canvas.classList.remove('press');
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoB.t = 0;
    autoT.t = 0;
    autoB.wait = 0;
    autoT.wait = 0;
    syncAutoUi();
    if (!autoOn) {
      playHint();
      return;
    }
    audio.ensure();
    clearControl();
    if (G.phase === 'title') startMatch('match');
    else playHint();
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.2;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function superPips(n) {
    const filled = Math.floor(clamp(n, 0, 3) + 1e-6);
    let s = '超 ';
    for (let i = 0; i < 3; i++) s += i < filled ? '●' : '○';
    return s;
  }

  function syncHud() {
    scoreBEl.textContent = String(G.phase === 'title' ? 0 : G.bot);
    scoreTEl.textContent = String(G.phase === 'title' ? 0 : G.top);
    bestEl.textContent = String(G.best);
    labB.textContent = '你';
    labT.textContent = '对方';
    if (G.phase === 'title') {
      modeLabel.textContent = '飞盘';
      tagLabel.textContent = 'WJAM';
    } else {
      modeLabel.textContent = rush() ? '疾盘' : '飞盘';
      tagLabel.textContent = rush() ? 'RUSH' : 'SET';
    }
    const win = G.phase === 'end' && G.botWin;
    const lose = G.phase === 'end' && !G.botWin;
    modeLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('warn', lose);
    const meter = G.B ? G.B.meter : 0;
    superLabel.textContent = superPips(meter);
    superLabel.classList.toggle('hot', meter >= 1);
    if (G.phase === 'play' && G.rally >= 2) {
      comboLabel.hidden = false;
      comboLabel.textContent = '×' + G.rally;
    } else {
      comboLabel.hidden = true;
    }
  }

  function bumpCombo() {
    if (G.rally < 2) return;
    comboLabel.hidden = false;
    comboLabel.textContent = '×' + G.rally;
    comboLabel.classList.remove('pop');
    void comboLabel.offsetWidth;
    comboLabel.classList.add('pop');
  }

  function flashScore(bot) {
    const box = bot ? scoreBBox : scoreTBox;
    box.classList.remove('flash');
    void box.offsetWidth;
    box.classList.add('flash');
  }

  function showTitle() {
    G.phase = 'title';
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.remove('win', 'lose');
    ovKicker.textContent = 'WJAM';
    ovTitle.textContent = '飞盘';
    ovLead.innerHTML = '接住飞盘，甩进对面球门。<br />中门五分，边门三分。先到十二。';
    ovOps.textContent = '方向 / WASD 跑位 · 空格甩盘 · Shift / Z 超射 · R 重开 · M 静音';
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    setHint('接住再甩 · 中门五分 · 超射弯刀 · R 重开 · M 静音');
    syncHud();
  }

  function showEnd() {
    G.phase = 'end';
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    const bot = G.botWin;
    panel.classList.toggle('win', bot);
    panel.classList.toggle('lose', !bot);
    ovKicker.textContent = bot ? 'WIN' : 'MISS';
    ovTitle.textContent = bot ? '你赢了' : '盘丢了';
    ovLead.textContent = G.bot + ' : ' + G.top + ' · 先到十二' + (rush() ? ' · 疾盘' : '');
    ovOps.textContent = 'R 再来 · 换模式回标题';
    ovStart.classList.add('gone');
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
    if (REDUCE) n = Math.min(n, 6);
    for (let i = 0; i < n; i++) {
      if (particles.length > 150) particles.shift();
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
    if (sparks.length > 16) sparks.shift();
  }

  function popRing(x, y, rgb, r) {
    if (REDUCE) return;
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 12 });
    if (rings.length > 12) rings.shift();
  }

  function popFloat(x, y, text, rgb, size) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb || GOLD,
      t: 0, life: 0.78, size: size || 18, vy: -52
    });
    if (floats.length > 10) floats.shift();
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
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.005));
    kickTok += 1;
    const cls = mag >= 8 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function makePlayer(bot) {
    return {
      x: VW * 0.5,
      y: bot ? VH * 0.78 : VH * 0.22,
      vx: 0,
      vy: 0,
      r: PLAYER_R,
      bot: bot,
      hold: false,
      holdT: 0,
      meter: 1,
      faceX: 0,
      faceY: bot ? -1 : 1,
      cool: 0,
      squash: 1,
      glow: 0,
      throwT: 0,
      catchT: 0,
      run: rand(0, TAU),
      lean: 0
    };
  }

  function makeDisc(x, y) {
    return {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      r: DISC_R,
      spin: 0,
      curve: 0,
      held: null,
      super: false,
      trail: [],
      wallCool: 0,
      ang: 0,
      stretch: 0,
      tint: WHT,
      tintT: 0
    };
  }

  function bounds(bot) {
    return {
      x0: WALL + PLAYER_R + 2,
      x1: VW - WALL - PLAYER_R - 2,
      y0: bot ? NET + 10 : WALL + PLAYER_R + 6,
      y1: bot ? VH - WALL - PLAYER_R - 6 : NET - 10
    };
  }

  function home(bot) {
    return { x: VW * 0.5, y: bot ? VH * 0.76 : VH * 0.24 };
  }

  function handPos(p) {
    const side = p.bot ? -1 : 1;
    return {
      x: p.x + p.faceX * 6,
      y: p.y + side * 18
    };
  }

  function zonePts(x) {
    if (x > five0() + 2 && x < five1() - 2) return 5;
    if (x > WALL + 10 && x < VW - WALL - 10) return 3;
    return 0;
  }

  function posts(top) {
    const y = top ? WALL + 7 : VH - WALL - 7;
    return [
      { x: five0(), y: y, r: POST_R },
      { x: five1(), y: y, r: POST_R }
    ];
  }

  function resetPlayers() {
    G.B = makePlayer(true);
    G.T = makePlayer(false);
  }

  function stickDisc() {
    const d = G.disc;
    if (!d || !d.held) return;
    const p = d.held === 'B' ? G.B : G.T;
    const h = handPos(p);
    d.x = h.x;
    d.y = h.y;
    d.vx = 0;
    d.vy = 0;
  }

  function giveDisc(p) {
    const d = G.disc;
    p.hold = true;
    p.holdT = 0;
    d.held = p.bot ? 'B' : 'T';
    d.super = false;
    d.curve = 0;
    d.vx = 0;
    d.vy = 0;
    d.trail.length = 0;
    stickDisc();
  }

  function startServe(botServes) {
    G.serving = true;
    G.serveBot = botServes;
    G.lock = rush() ? 0.28 : 0.42;
    G.rally = 0;
    const hb = home(true);
    const ht = home(false);
    G.B.x = hb.x;
    G.B.y = hb.y;
    G.B.vx = 0;
    G.B.vy = 0;
    G.B.hold = false;
    G.B.cool = 0;
    G.T.x = ht.x;
    G.T.y = ht.y;
    G.T.vx = 0;
    G.T.vy = 0;
    G.T.hold = false;
    G.T.cool = 0;
    const p = botServes ? G.B : G.T;
    giveDisc(p);
    autoB.wait = 0;
    autoT.wait = 0;
    syncHud();
  }

  function startMatch(kind) {
    G.kind = kind === 'rush' ? 'rush' : 'match';
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
    G.throwLatch = false;
    G.superLatch = false;
    resetPlayers();
    G.disc = makeDisc(VW * 0.5, VH * 0.7);
    startServe(true);
    hideOverlay();
    audio.start();
    playHint();
    toast(rush() ? '疾盘' : '飞盘', false, rush());
    syncHud();
  }

  function bootDemo() {
    resetPlayers();
    G.disc = makeDisc(VW * 0.5, VH * 0.42);
    G.disc.vx = rand(-80, 80);
    G.disc.vy = rand(160, 260) * (Math.random() < 0.5 ? -1 : 1);
    G.disc.held = null;
    G.serving = false;
    G.lock = 0;
    G.B.meter = 1.2;
    G.T.meter = 1.2;
  }

  function keyVec() {
    let ax = 0;
    let ay = 0;
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (keys.u) ay -= 1;
    if (keys.d) ay += 1;
    if (ax !== 0 && ay !== 0) {
      ax *= 0.707;
      ay *= 0.707;
    }
    return { ax: ax, ay: ay, any: ax !== 0 || ay !== 0 };
  }

  function pointerAim() {
    for (const id in pointers) {
      const p = pointers[id];
      return { x: p.x, y: p.y };
    }
    if (mouse.hover) return { x: mouse.x, y: mouse.y };
    return null;
  }

  function clampPlayer(p) {
    const b = bounds(p.bot);
    if (p.x < b.x0) {
      p.x = b.x0;
      p.vx *= 0.15;
    } else if (p.x > b.x1) {
      p.x = b.x1;
      p.vx *= 0.15;
    }
    if (p.y < b.y0) {
      p.y = b.y0;
      p.vy *= 0.15;
    } else if (p.y > b.y1) {
      p.y = b.y1;
      p.vy *= 0.15;
    }
  }

  function movePlayer(p, dt, ax, ay, tx, ty, cap) {
    p.cool = Math.max(0, p.cool - dt);
    p.throwT = Math.max(0, p.throwT - dt);
    p.catchT = Math.max(0, p.catchT - dt);
    const b = bounds(p.bot);
    const spdCap = cap || maxSpd();
    if (ax !== 0 || ay !== 0) {
      p.vx += ax * accOf() * dt;
      p.vy += ay * accOf() * dt;
      const spd = hypot(p.vx, p.vy);
      if (spd > spdCap) {
        p.vx = p.vx / spd * spdCap;
        p.vy = p.vy / spd * spdCap;
      }
      p.faceX = ax;
      p.faceY = ay;
    } else if (tx != null) {
      tx = clamp(tx, b.x0, b.x1);
      ty = clamp(ty, b.y0, b.y1);
      const dx = tx - p.x;
      const dy = ty - p.y;
      const dist = hypot(dx, dy);
      const maxStep = spdCap * dt;
      let oxv = dx;
      let oyv = dy;
      if (dist > maxStep && dist > 0.001) {
        oxv *= maxStep / dist;
        oyv *= maxStep / dist;
      }
      p.vx = oxv / Math.max(dt, 0.001);
      p.vy = oyv / Math.max(dt, 0.001);
      if (dist > 6) {
        p.faceX = dx / dist;
        p.faceY = dy / dist;
      }
    } else {
      p.vx *= Math.exp(-dt * 12);
      p.vy *= Math.exp(-dt * 12);
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    clampPlayer(p);
    const moving = hypot(p.vx, p.vy);
    p.run += dt * (4 + moving * 0.012);
    p.lean = lerp(p.lean, clamp(p.vx / 280, -0.45, 0.45), 1 - Math.exp(-dt * 10));
    p.squash = lerp(p.squash, 1, 1 - Math.exp(-dt * 12));
    p.glow = Math.max(0, p.glow - dt);
    if (p.hold) {
      p.holdT += dt;
      stickDisc();
    }
    if (G.phase === 'play' && !REDUCE && moving > 180 && Math.random() < 0.28) {
      emit(1, {
        x: p.x, y: p.y + (p.bot ? 10 : -10), j: 5,
        vx0: -p.vx * 0.08, vx1: p.vx * 0.08,
        vy0: -p.vy * 0.08, vy1: p.vy * 0.08,
        life: 0.18, r0: 0.4, r1: 1.2,
        rgb: p.bot ? HOT : MAG
      });
    }
  }

  function aimThrow(p, wantX, wantY, isSuper) {
    const toward = p.bot ? -1 : 1;
    let dx = wantX;
    let dy = wantY;
    if (hypot(dx, dy) < 0.15) {
      dx = 0;
      dy = toward;
    }
    if (p.bot && dy > -0.18) dy = -0.55 + Math.abs(dx) * 0.05;
    if (!p.bot && dy < 0.18) dy = 0.55 - Math.abs(dx) * 0.05;
    const len = hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const spd = throwSpd(isSuper);
    let curve = 0;
    if (isSuper) {
      if (Math.abs(dx) > 0.22) curve = (p.bot ? 1 : -1) * dx * (rush() ? 980 : 760);
      else curve = (Math.random() < 0.5 ? -1 : 1) * (rush() ? 420 : 280);
    } else {
      curve = dx * (p.bot ? 1 : -1) * 90;
    }
    return { vx: dx * spd, vy: dy * spd, curve: curve };
  }

  function doThrow(p, isSuper, aimX, aimY) {
    if (!p.hold || !G.disc || G.lock > 0) return false;
    if (isSuper && p.meter < 1) {
      if (G.phase === 'play' && p.bot && !autoOn) audio.deny();
      isSuper = false;
    }
    const d = G.disc;
    const shot = aimThrow(p, aimX, aimY, isSuper);
    p.hold = false;
    p.holdT = 0;
    p.cool = isSuper ? 0.22 : 0.16;
    p.throwT = isSuper ? 0.28 : 0.16;
    p.squash = 0.78;
    p.glow = isSuper ? 0.4 : 0.18;
    d.held = null;
    d.vx = shot.vx + p.vx * 0.18;
    d.vy = shot.vy + p.vy * 0.18;
    d.curve = shot.curve;
    d.super = isSuper;
    d.spin = (isSuper ? 18 : 9) * (p.bot ? 1 : -1);
    d.stretch = isSuper ? 0.38 : 0.18;
    d.tint = isSuper ? GOLD : (p.bot ? HOT : MAG);
    d.tintT = isSuper ? 0.45 : 0.2;
    d.trail.length = 0;
    if (isSuper) p.meter = Math.max(0, p.meter - 1);
    G.serving = false;
    const rgb = isSuper ? GOLD : (p.bot ? HOT : MAG);
    emit(isSuper ? 18 : 8, {
      x: d.x, y: d.y, j: 8,
      vx0: shot.vx * 0.08 - 80, vx1: shot.vx * 0.18 + 80,
      vy0: shot.vy * 0.08 - 80, vy1: shot.vy * 0.18 + 80,
      life: isSuper ? 0.4 : 0.22, r0: 0.7, r1: isSuper ? 2.8 : 1.6, rgb: rgb
    });
    popRing(d.x, d.y, rgb, isSuper ? 16 : 9);
    if (G.phase === 'play') {
      audio.throw(isSuper, p.bot);
      if (isSuper) {
        hitStop(0.055);
        kick(shot.vx > 0 ? 1 : -1, p.bot ? -1 : 1, 6.2);
        popFloat(d.x, d.y - 16, Math.abs(shot.vx) > 120 ? '弯刀' : '砸盘', GOLD, 16);
        toast(Math.abs(aimX) > 0.28 ? '弯刀' : '砸盘', false, true);
      } else {
        hitStop(0.028);
      }
    }
    syncHud();
    return true;
  }

  function tryThrowFromInput(p) {
    if (!p.hold) return;
    const kv = keyVec();
    const ptr = pointerAim();
    let ax = kv.ax;
    let ay = kv.ay;
    if (!kv.any && ptr) {
      ax = ptr.x - p.x;
      ay = ptr.y - p.y;
      const len = hypot(ax, ay) || 1;
      ax /= len;
      ay /= len;
    }
    if (!kv.any && !ptr) {
      ax = p.faceX;
      ay = p.faceY;
    }
    const wantSuper = keys.super && !G.superLatch;
    const wantThrow = (keys.throw && !G.throwLatch) || wantSuper;
    if (!wantThrow) return;
    if (doThrow(p, wantSuper, ax, ay)) {
      if (wantSuper) G.superLatch = true;
      if (keys.throw) G.throwLatch = true;
    }
  }

  function onCatch(p) {
    const d = G.disc;
    giveDisc(p);
    p.catchT = 0.22;
    p.squash = 0.72;
    p.glow = 0.28;
    p.meter = Math.min(3, p.meter + (rush() ? 0.55 : 0.45));
    const rgb = p.bot ? HOT : MAG;
    emit(12, {
      x: d.x, y: d.y, j: 10,
      vx0: -140, vx1: 140, vy0: -140, vy1: 140,
      life: 0.28, r0: 0.7, r1: 2.2, rgb: rgb
    });
    popSpark(d.x, d.y, rgb, 20);
    popRing(d.x, d.y, rgb, 12);
    if (G.phase === 'play') {
      G.rally += 1;
      bumpCombo();
      audio.catch(p.bot);
      if (G.rally >= 2) audio.combo(G.rally);
      hitStop(G.rally >= 4 ? 0.055 : 0.038);
      kick(0, p.bot ? 1 : -1, G.rally >= 5 ? 4.5 : 2.8);
      if (G.rally >= 2) popFloat(p.x, p.y - 22, '×' + G.rally, GOLD, 15);
    }
    syncHud();
  }

  function tryCatch(p) {
    const d = G.disc;
    if (!d || d.held || p.hold || p.cool > 0) return;
    const inHalf = p.bot ? d.y > NET - 18 : d.y < NET + 18;
    if (!inHalf) return;
    const coming = p.bot ? d.vy > -40 : d.vy < 40;
    if (!coming && hypot(d.vx, d.vy) > 80) return;
    const dx = d.x - p.x;
    const dy = d.y - p.y;
    const dist = hypot(dx, dy);
    const toward = p.vx * dx + p.vy * dy;
    const lunge = toward > 40 ? 10 : 0;
    if (dist < catchR() + lunge + d.r * 0.2) onCatch(p);
  }

  function bounceCircle(px, py, pr, d) {
    const dx = d.x - px;
    const dy = d.y - py;
    const dist = hypot(dx, dy);
    const min = pr + d.r;
    if (dist >= min || dist < 1e-5) return false;
    const nx = dx / dist;
    const ny = dy / dist;
    const overlap = min - dist;
    d.x += nx * (overlap + 0.4);
    d.y += ny * (overlap + 0.4);
    const vn = d.vx * nx + d.vy * ny;
    if (vn < 0) {
      d.vx -= 1.7 * vn * nx;
      d.vy -= 1.7 * vn * ny;
    }
    return true;
  }

  function capDisc(d) {
    const cap = d.super ? 980 : 780;
    const spd = hypot(d.vx, d.vy);
    if (spd > cap) {
      d.vx = d.vx / spd * cap;
      d.vy = d.vy / spd * cap;
    }
  }

  function bounceWalls(d) {
    const r = d.r;
    const x0 = WALL + r;
    const x1 = VW - WALL - r;
    let hit = false;
    let post = false;
    let nx = 0;
    let ny = 0;
    if (d.x < x0) {
      d.x = x0;
      if (d.vx < 0) d.vx = -d.vx * 0.92;
      nx = 1;
      hit = true;
    } else if (d.x > x1) {
      d.x = x1;
      if (d.vx > 0) d.vx = -d.vx * 0.92;
      nx = -1;
      hit = true;
    }
    const topPosts = posts(true);
    const botPosts = posts(false);
    for (let i = 0; i < 2; i++) {
      if (bounceCircle(topPosts[i].x, topPosts[i].y, topPosts[i].r, d)) post = true;
      if (bounceCircle(botPosts[i].x, botPosts[i].y, botPosts[i].r, d)) post = true;
    }
    const ptsTop = zonePts(d.x);
    const ptsBot = zonePts(d.x);
    if (d.y < WALL + r && ptsTop === 0) {
      d.y = WALL + r;
      if (d.vy < 0) d.vy = -d.vy * 0.88;
      ny = 1;
      hit = true;
    } else if (d.y > VH - WALL - r && ptsBot === 0) {
      d.y = VH - WALL - r;
      if (d.vy > 0) d.vy = -d.vy * 0.88;
      ny = -1;
      hit = true;
    }
    capDisc(d);
    const noisy = G.phase === 'play' && d.wallCool <= 0;
    if (post && noisy) {
      d.wallCool = 0.08;
      audio.post();
      emit(7, {
        x: d.x, y: d.y, j: 5,
        vx0: -110, vx1: 110, vy0: -110, vy1: 110,
        life: 0.24, r0: 0.6, r1: 1.8, rgb: GOLD
      });
      hitStop(0.03);
    } else if (hit && noisy) {
      d.wallCool = 0.07;
      audio.wall();
      emit(3, {
        x: d.x, y: d.y, j: 3,
        vx0: nx * 20 - 40, vx1: nx * 80 + 40,
        vy0: ny * 20 - 40, vy1: ny * 80 + 40,
        life: 0.16, r0: 0.5, r1: 1.3, rgb: WHT
      });
    }
  }

  function moveDisc(dt) {
    const d = G.disc;
    if (!d || d.held) return;
    const dist = hypot(d.vx, d.vy) * dt;
    const steps = Math.max(1, Math.ceil(dist / 5));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      if (Math.abs(d.curve) > 1) {
        const spd = hypot(d.vx, d.vy) || 1;
        const px = -d.vy / spd;
        const py = d.vx / spd;
        d.vx += px * d.curve * h;
        d.vy += py * d.curve * h;
        d.curve *= Math.exp(-h * 0.55);
      }
      d.x += d.vx * h;
      d.y += d.vy * h;
      d.wallCool = Math.max(0, d.wallCool - h);
      bounceWalls(d);
      if (d.held) break;
    }
    d.ang += d.spin * dt;
    d.stretch = Math.max(0, d.stretch - dt * 2.2);
    d.tintT = Math.max(0, d.tintT - dt);
    capDisc(d);
    if (!REDUCE && hypot(d.vx, d.vy) > 90) {
      d.trail.push({ x: d.x, y: d.y, s: d.super });
      if (d.trail.length > (d.super ? 16 : 11)) d.trail.shift();
      if (d.super && Math.random() < 0.55) {
        emit(1, {
          x: d.x, y: d.y, j: 4,
          vx0: -40, vx1: 40, vy0: -40, vy1: 40,
          life: 0.22, r0: 0.6, r1: 1.6, rgb: GOLD
        });
      }
    }
  }

  function explodeGoal(botScored, pts, x, y) {
    const rgb = botScored ? HOT : MAG;
    emit(26, {
      x: x, y: y, j: 22,
      vx0: -240, vx1: 240,
      vy0: botScored ? 30 : -240,
      vy1: botScored ? 240 : -30,
      life: 0.52, r0: 1.1, r1: 3.2, rgb: rgb
    });
    emit(10, {
      x: x, y: y, j: 14,
      vx0: -150, vx1: 150, vy0: -140, vy1: 140,
      life: 0.38, r0: 0.8, r1: 2.2, rgb: GOLD
    });
    popSpark(x, y, pts >= 5 ? GOLD : rgb, 40);
    popRing(x, y, GOLD, 20);
    popFloat(x, y + (botScored ? 28 : -28), '+' + pts, pts >= 5 ? GOLD : rgb, pts >= 5 ? 28 : 22);
  }

  function scorePoint(botGets, pts, x, y) {
    if (G.phase !== 'play') {
      startServe(!botGets);
      G.lock = 0.35;
      return;
    }
    if (botGets) G.bot += pts;
    else G.top += pts;
    flashScore(botGets);
    G.flash = 0.3;
    G.flashRgb = botGets ? HOT : MAG;
    G.goalFlash = 0.55;
    G.goalTop = botGets;
    hitStop(pts >= 5 ? 0.08 : 0.058);
    kick(0, botGets ? -1 : 1, pts >= 5 ? 11 : 8);
    explodeGoal(botGets, pts, x, y);
    audio.goal(botGets, pts);
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

    if (botGets) toast(pts >= 5 ? '中门 +5' : '边门 +3', false, true);
    else toast(pts >= 5 ? '丢了五分' : '丢了三分', true);
    startServe(!botGets);
  }

  function checkGoal() {
    const d = G.disc;
    if (!d || d.held) return;
    if (d.y < WALL && d.vy <= 0) {
      const pts = zonePts(d.x);
      if (pts) {
        scorePoint(true, pts, d.x, WALL + 8);
        return;
      }
    }
    if (d.y > VH - WALL && d.vy >= 0) {
      const pts = zonePts(d.x);
      if (pts) {
        scorePoint(false, pts, d.x, VH - WALL - 8);
        return;
      }
    }
    if (d.y + d.r < -6) scorePoint(true, zonePts(d.x) || 3, d.x, WALL);
    else if (d.y - d.r > VH + 6) scorePoint(false, zonePts(d.x) || 3, d.x, VH - WALL);
  }

  function simDisc(look) {
    const src = G.disc;
    const s = {
      x: src.x, y: src.y, vx: src.vx, vy: src.vy,
      curve: src.curve, r: src.r, super: src.super, held: null
    };
    const steps = Math.max(1, Math.ceil(look / 0.016));
    const h = look / steps;
    for (let i = 0; i < steps; i++) {
      if (Math.abs(s.curve) > 1) {
        const spd = hypot(s.vx, s.vy) || 1;
        const px = -s.vy / spd;
        const py = s.vx / spd;
        s.vx += px * s.curve * h;
        s.vy += py * s.curve * h;
        s.curve *= Math.exp(-h * 0.55);
      }
      s.x += s.vx * h;
      s.y += s.vy * h;
      if (s.x < WALL + s.r) {
        s.x = WALL + s.r;
        s.vx = Math.abs(s.vx);
      } else if (s.x > VW - WALL - s.r) {
        s.x = VW - WALL - s.r;
        s.vx = -Math.abs(s.vx);
      }
    }
    return s;
  }

  function pickAim(p, opp) {
    const toward = p.bot ? -1 : 1;
    const goalY = p.bot ? WALL + 4 : VH - WALL - 4;
    const opts = [
      { x: VW * 0.5, y: goalY, pts: 5 },
      { x: five0() - 28, y: goalY, pts: 3 },
      { x: five1() + 28, y: goalY, pts: 3 }
    ];
    let best = opts[0];
    let bestS = -1;
    for (let i = 0; i < opts.length; i++) {
      const o = opts[i];
      let sc = o.pts * 8;
      const cover = Math.abs(opp.x - o.x);
      sc += cover * 0.55;
      if (cover < 36) sc -= 40;
      const dx = o.x - p.x;
      const dy = (goalY - p.y) * toward;
      if (dy < 20) sc -= 10;
      sc += Math.abs(dx) * 0.04;
      if (sc > bestS) {
        bestS = sc;
        best = o;
      }
    }
    const dx = best.x - p.x;
    const dy = best.y - p.y;
    const len = hypot(dx, dy) || 1;
    return { ax: dx / len, ay: dy / len, pts: best.pts, x: best.x };
  }

  function thinkHolder(p, st, dt, cfg, opp) {
    st.wait -= dt;
    if (st.wait > 0) return;
    const aim = pickAim(p, opp);
    const useSuper = p.meter >= 1 && (Math.random() < cfg.super || aim.pts === 5 && Math.abs(opp.x - aim.x) > 48);
    doThrow(p, useSuper, aim.ax, aim.ay);
    st.wait = 0;
    st.phase = 'idle';
  }

  function interceptPoint(p, cfg) {
    const d = G.disc;
    if (!d || d.held) return home(p.bot);
    const look = cfg.look;
    const pred = simDisc(look);
    const b = bounds(p.bot);
    let x = pred.x + (cfg.err ? rand(-cfg.err, cfg.err) : 0);
    let y = pred.y;
    if (p.bot) y = Math.max(y - 8, NET + 16);
    else y = Math.min(y + 8, NET - 16);
    const threat = p.bot
      ? d.vy > 40 && d.y > VH * 0.58
      : d.vy < -40 && d.y < VH * 0.42;
    if (threat) {
      x = lerp(x, d.x, 0.45);
      y = p.bot ? Math.max(y, VH - WALL - 70) : Math.min(y, WALL + 70);
    }
    return {
      x: clamp(x, b.x0, b.x1),
      y: clamp(y, b.y0, b.y1)
    };
  }

  function thinkField(p, st, dt, cfg) {
    st.t -= dt;
    if (st.t > 0 && st.phase === 'run') return;
    st.t = cfg.react;
    const d = G.disc;
    const h = home(p.bot);
    if (!d || d.held) {
      const holder = d && d.held === 'B' ? G.B : G.T;
      const track = holder && holder !== p ? holder.x : VW * 0.5;
      st.phase = 'idle';
      st.x = lerp(h.x, track, 0.42);
      st.y = h.y;
      return;
    }
    const coming = p.bot ? d.vy > -30 : d.vy < 30;
    const inHalf = p.bot ? d.y > NET - 24 : d.y < NET + 24;
    if (coming || inHalf) {
      const pt = interceptPoint(p, cfg);
      st.phase = 'run';
      st.x = pt.x;
      st.y = pt.y;
      return;
    }
    st.phase = 'idle';
    st.x = lerp(h.x, d.x, 0.38);
    st.y = h.y;
  }

  function driveAI(p, st, dt, cfg, opp, canThrow) {
    if (p.hold) {
      if (st.phase !== 'hold') {
        st.phase = 'hold';
        st.wait = cfg.wait * rand(0.75, 1.2);
        if (p.holdT > 0.4) st.wait = Math.min(st.wait, 0.08);
      }
      if (canThrow) thinkHolder(p, st, dt, cfg, opp);
      const b = bounds(p.bot);
      const aim = pickAim(p, opp);
      const tx = clamp(lerp(p.x, aim.x, 0.35), b.x0, b.x1);
      const ty = p.bot ? Math.min(p.y, NET + 80) : Math.max(p.y, NET - 80);
      movePlayer(p, dt, 0, 0, tx, ty, cfg.max);
      return;
    }
    thinkField(p, st, dt, cfg);
    movePlayer(p, dt, 0, 0, st.x, st.y, cfg.max);
  }

  function opponentCfg() {
    if (rush()) return { max: 365, react: 0.055, look: 0.4, err: 9, wait: 0.11, super: 0.52 };
    return { max: 275, react: 0.11, look: 0.32, err: 16, wait: 0.22, super: 0.34 };
  }

  function updatePlayers(dt) {
    const play = G.phase === 'play';
    const title = G.phase === 'title';
    const mid = { max: 290, react: 0.1, look: 0.34, err: 12, wait: 0.18, super: 0.4 };

    if (title) {
      driveAI(G.B, autoB, dt, mid, G.T, true);
      driveAI(G.T, autoT, dt, mid, G.B, true);
      tryCatch(G.B);
      tryCatch(G.T);
      return;
    }

    if (G.phase === 'end') {
      movePlayer(G.B, dt, 0, 0, null, null, maxSpd());
      movePlayer(G.T, dt, 0, 0, null, null, maxSpd());
      return;
    }

    if (!play) return;

    if (autoOn) {
      driveAI(G.B, autoB, dt, autoCfg(), G.T, true);
    } else {
      const kv = keyVec();
      const ptr = pointerAim();
      if (kv.any) movePlayer(G.B, dt, kv.ax, kv.ay, null, null, maxSpd());
      else if (ptr) movePlayer(G.B, dt, 0, 0, ptr.x, ptr.y, maxSpd() * 1.15);
      else movePlayer(G.B, dt, 0, 0, null, null, maxSpd());
      tryThrowFromInput(G.B);
    }

    driveAI(G.T, autoT, dt, opponentCfg(), G.B, true);

    tryCatch(G.B);
    tryCatch(G.T);

    if (G.B.hold && G.B.holdT > HOLD_MAX) {
      const aim = pickAim(G.B, G.T);
      doThrow(G.B, G.B.meter >= 1, aim.ax, aim.ay);
    }
    if (G.T.hold && G.T.holdT > HOLD_MAX) {
      const aim = pickAim(G.T, G.B);
      doThrow(G.T, G.T.meter >= 1, aim.ax, aim.ay);
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
      m.y += Math.sin(G.t * 0.7 + m.p) * 5 * dt;
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }
    G.lock = Math.max(0, G.lock - dt);
    updatePlayers(dt);
    if (G.phase !== 'end') {
      if (G.disc && G.disc.held) stickDisc();
      else {
        moveDisc(dt);
        checkGoal();
      }
    }
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
    g.addColorStop(0, '#1a0c08');
    g.addColorStop(0.5, '#08040c');
    g.addColorStop(1, '#140814');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.5 + 0.5 * Math.sin(G.t * 1.2 + m.p));
      ctx.fillStyle = rgba(i % 3 === 0 ? HOT : i % 3 === 1 ? GOLD : CYN, a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPocket(yTop, botSide) {
    const y = yTop ? sy(4) : sy(VH - WALL - 2);
    const h = (WALL + 4) * scale;
    const g0 = five0();
    const g1 = five1();
    const glow = G.goalFlash > 0 && G.goalTop === botSide ? 0.4 + G.goalFlash * 0.6 : 0.22;
    ctx.fillStyle = rgba(botSide ? MAG : HOT, glow * 0.55);
    ctx.fillRect(sx(WALL), y, (VW - WALL * 2) * scale, h);
    ctx.fillStyle = rgba(GOLD, glow);
    ctx.fillRect(sx(g0), y, (g1 - g0) * scale, h);
    ctx.save();
    ctx.font = '800 ' + (13 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(WHT, 0.72);
    const ty = y + h * 0.52;
    ctx.fillText('3', sx((WALL + g0) * 0.5), ty);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillText('5', sx(VW * 0.5), ty);
    ctx.fillStyle = rgba(WHT, 0.72);
    ctx.fillText('3', sx((VW - WALL + g1) * 0.5), ty);
    ctx.restore();
  }

  function drawCourt() {
    const iceX = sx(WALL);
    const iceY = sy(WALL);
    const iceW = (VW - WALL * 2) * scale;
    const iceH = (VH - WALL * 2) * scale;
    ctx.save();
    roundRect(ctx, iceX, iceY, iceW, iceH, 18 * scale);
    const sand = ctx.createLinearGradient(iceX, iceY, iceX, iceY + iceH);
    sand.addColorStop(0, '#2a140c');
    sand.addColorStop(0.5, '#1a0c10');
    sand.addColorStop(1, '#241018');
    ctx.fillStyle = sand;
    ctx.fill();
    ctx.clip();

    ctx.strokeStyle = 'rgba(255, 179, 71, 0.22)';
    ctx.lineWidth = 1.2 * scale;
    const gap = 28 * scale;
    for (let y = iceY; y < iceY + iceH; y += gap) {
      ctx.beginPath();
      ctx.moveTo(iceX, y);
      ctx.lineTo(iceX + iceW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 227, 107, 0.42)';
    ctx.lineWidth = 2 * scale;
    roundRect(ctx, sx(WALL + 18), sy(WALL + 36), (VW - WALL * 2 - 36) * scale, (VH - WALL * 2 - 72) * scale, 8 * scale);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 106, 34, 0.35)';
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(WALL + 18), sy(VH * 0.28));
    ctx.lineTo(sx(VW - WALL - 18), sy(VH * 0.28));
    ctx.moveTo(sx(WALL + 18), sy(VH * 0.72));
    ctx.lineTo(sx(VW - WALL - 18), sy(VH * 0.72));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 227, 107, 0.55)';
    ctx.lineWidth = 3 * scale;
    ctx.shadowColor = 'rgba(255, 227, 107, 0.4)';
    ctx.shadowBlur = 10 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(WALL + 6), sy(NET));
    ctx.lineTo(sx(VW - WALL - 6), sy(NET));
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(CYN, 0.55);
    ctx.fillRect(sx(WALL + 4), sy(NET - 3), 8 * scale, 6 * scale);
    ctx.fillRect(sx(VW - WALL - 12), sy(NET - 3), 8 * scale, 6 * scale);

    const showB = G.phase === 'title' ? 0 : G.bot;
    const showT = G.phase === 'title' ? 0 : G.top;
    ctx.font = '900 ' + (78 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 61, 184, 0.1)';
    ctx.fillText(String(showT), sx(VW * 0.5), sy(VH * 0.28));
    ctx.fillStyle = 'rgba(255, 106, 34, 0.12)';
    ctx.fillText(String(showB), sx(VW * 0.5), sy(VH * 0.72));
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 106, 34, 0.7)';
    ctx.lineWidth = 5 * scale;
    ctx.shadowColor = 'rgba(255, 106, 34, 0.4)';
    ctx.shadowBlur = 14 * scale;
    roundRect(ctx, sx(6), sy(6), (VW - 12) * scale, (VH - 12) * scale, 16 * scale);
    ctx.stroke();
    ctx.shadowBlur = 0;
    drawPocket(true, true);
    drawPocket(false, false);
    const tp = posts(true);
    const bp = posts(false);
    ctx.fillStyle = rgba(GOLD, 0.9);
    for (let i = 0; i < 2; i++) {
      ctx.beginPath();
      ctx.arc(sx(tp[i].x), sy(tp[i].y), tp[i].r * 0.7 * scale, 0, TAU);
      ctx.arc(sx(bp[i].x), sy(bp[i].y), bp[i].r * 0.7 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAthlete(p, rgb) {
    if (!p) return;
    const x = sx(p.x);
    const y = sy(p.y);
    const r = p.r * scale;
    const run = Math.sin(p.run) * (hypot(p.vx, p.vy) > 30 ? 1 : 0.12);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.lean * 0.25);
    ctx.scale(p.squash, 2 - p.squash);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.95, r * 0.85, r * 0.28, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(rgb, 0.85);
    ctx.lineWidth = 2.2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, r * 0.25);
    ctx.lineTo(-r * 0.55 + run * r * 0.35, r * 0.95);
    ctx.moveTo(r * 0.35, r * 0.25);
    ctx.lineTo(r * 0.55 - run * r * 0.35, r * 0.95);
    ctx.stroke();
    ctx.shadowColor = rgba(rgb, 0.55 + p.glow);
    ctx.shadowBlur = (10 + p.glow * 18) * scale;
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
    g.addColorStop(0, rgba(WHT, 0.9));
    g.addColorStop(0.4, rgba(rgb, 1));
    g.addColorStop(1, 'rgba(' + ((rgb[0] * 0.25) | 0) + ',' + ((rgb[1] * 0.22) | 0) + ',' + ((rgb[2] * 0.22) | 0) + ',1)');
    ctx.fillStyle = g;
    roundRect(ctx, -r * 0.55, -r * 0.7, r * 1.1, r * 1.15, r * 0.4);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(p.lean * r * 0.15, -r * 0.95, r * 0.42, 0, TAU);
    ctx.fillStyle = '#1a1020';
    ctx.fill();
    ctx.strokeStyle = rgba(rgb, 0.9);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.beginPath();
    ctx.arc(-r * 0.12 + p.lean * r * 0.1, -r * 1.02, r * 0.08, 0, TAU);
    ctx.arc(r * 0.14 + p.lean * r * 0.1, -r * 1.02, r * 0.08, 0, TAU);
    ctx.fill();
    const arm = p.throwT > 0 ? -0.9 : (p.hold ? -0.35 : run * 0.6);
    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.25);
    ctx.lineTo(-r * 0.95, r * 0.05 + arm * r * 0.4);
    ctx.moveTo(r * 0.5, -r * 0.25);
    ctx.lineTo(r * 0.9, -r * 0.05 - arm * r * 0.5);
    ctx.stroke();
    if (p.catchT > 0) {
      ctx.strokeStyle = rgba(GOLD, p.catchT / 0.22);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, r * (1.35 + (0.22 - p.catchT) * 2), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    if (p.meter >= 1) {
      ctx.save();
      ctx.fillStyle = rgba(GOLD, 0.55 + 0.3 * Math.sin(G.t * 6));
      for (let i = 0; i < Math.min(3, Math.floor(p.meter)); i++) {
        ctx.beginPath();
        ctx.arc(sx(p.x - 10 + i * 10), sy(p.y - p.r - 10), 2.2 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawDisc() {
    const d = G.disc;
    if (!d) return;
    const rgb = d.tintT > 0 ? d.tint : (d.super ? GOLD : WHT);
    if (!REDUCE && d.trail && !d.held) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < d.trail.length; i++) {
        const t = d.trail[i];
        const k = (i + 1) / d.trail.length;
        ctx.fillStyle = rgba(t.s ? GOLD : rgb, 0.16 * k);
        ctx.beginPath();
        ctx.ellipse(sx(t.x), sy(t.y), d.r * (0.7 + k * 0.5) * scale, d.r * 0.38 * scale, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.translate(sx(d.x), sy(d.y));
    const spd = hypot(d.vx, d.vy);
    if (d.stretch > 0 && spd > 40 && !d.held) {
      ctx.rotate(Math.atan2(d.vy, d.vx));
      ctx.scale(1 + d.stretch * 0.8, 1 / (1 + d.stretch * 0.35));
    } else {
      ctx.rotate(d.ang * 0.15);
    }
    ctx.shadowColor = rgba(d.super ? GOLD : HOT, 0.85);
    ctx.shadowBlur = (d.super ? 18 : 10) * scale;
    const rx = d.r * 1.15 * scale;
    const ry = d.r * 0.42 * scale;
    const g = ctx.createRadialGradient(-rx * 0.2, -ry * 0.4, 1, 0, 0, rx);
    g.addColorStop(0, '#fff6d8');
    g.addColorStop(0.45, d.super ? '#ffe36b' : '#ffb347');
    g.addColorStop(1, d.super ? '#ff6a22' : '#c44a12');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(20, 8, 4, 0.45)';
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.55, ry * 0.45, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.55);
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.92, ry * 0.82, 0, 0, TAU);
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
      ctx.shadowColor = rgba(f.rgb, 0.6);
      ctx.shadowBlur = 8 * scale;
      ctx.font = '800 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawServeHint() {
    if (!G.serving || G.phase !== 'play' || G.lock <= 0) return;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.2 * Math.sin(G.t * 5);
    ctx.fillStyle = '#ffe8d4';
    ctx.font = '600 ' + (14 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(G.serveBot ? '你发球 · 空格甩出' : '对方发球', sx(VW * 0.5), sy(NET - 18));
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
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
    drawAthlete(G.T, MAG);
    drawAthlete(G.B, HOT);
    drawDisc();
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
      startMatch('match');
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
    if (k === 'm' || k === 'M') {
      if (down && !e.repeat) {
        audio.ensure();
        audio.setMuted(!audio.muted);
      }
      return;
    }
    if ((k === 'r' || k === 'R') && down && !e.repeat) {
      restart();
      e.preventDefault();
      return;
    }
    const isThrow = k === ' ' || k === 'Spacebar' || code === 'Space';
    const isSuper = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z' || code === 'KeyZ';
    const block = isThrow || isSuper ||
      k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight' ||
      ((k === 'w' || k === 'W' || k === 'a' || k === 'A' || k === 's' || k === 'S' || k === 'd' || k === 'D') &&
        !e.metaKey && !e.ctrlKey);
    if (down && block) e.preventDefault();

    if (overlayOpen()) {
      if (down && !e.repeat && (isThrow || k === 'Enter')) {
        e.preventDefault();
        audio.ensure();
        if (G.phase === 'title') startMatch('match');
        else if (G.phase === 'end') startMatch(G.kind);
      }
      if (down && !e.repeat && (k === '1' || k === '2')) {
        audio.ensure();
        if (G.phase === 'title') startMatch(k === '2' ? 'rush' : 'match');
      }
      return;
    }

    if (autoOn && G.phase === 'play') {
      if (isThrow || isSuper) return;
    }

    if (k === 'a' || k === 'A' || code === 'KeyA' || k === 'ArrowLeft' || k === 'Left') keys.l = down;
    if (k === 'd' || k === 'D' || code === 'KeyD' || k === 'ArrowRight' || k === 'Right') keys.r = down;
    if (k === 'w' || k === 'W' || code === 'KeyW' || k === 'ArrowUp' || k === 'Up') keys.u = down;
    if (k === 's' || k === 'S' || code === 'KeyS' || k === 'ArrowDown' || k === 'Down') keys.d = down;
    if (isThrow) {
      keys.throw = down;
      if (!down) G.throwLatch = false;
    }
    if (isSuper) {
      keys.super = down;
      if (!down) G.superLatch = false;
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (autoOn || overlayOpen()) {
      e.preventDefault();
      return;
    }
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
    keys.l = keys.r = keys.u = keys.d = false;
    keys.throw = keys.super = false;
    G.throwLatch = false;
    G.superLatch = false;
  });

  btnMatch.addEventListener('click', function () {
    audio.ensure();
    startMatch('match');
  });
  btnRush.addEventListener('click', function () {
    audio.ensure();
    startMatch('rush');
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
  if (btnAuto) {
    btnAuto.addEventListener('click', function () {
      toggleAuto();
    });
  }
  function onSpeedInput() {
    setAutoSpeed(speedEl.value);
  }
  if (speedEl) {
    speedEl.addEventListener('input', onSpeedInput);
    speedEl.addEventListener('change', onSpeedInput);
  }

  function bindPad(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    const down = function (e) {
      e.preventDefault();
      audio.ensure();
      if (overlayOpen()) return;
      keys[key] = true;
      el.classList.add('held');
      if (key === 'throw') G.throwLatch = false;
      if (key === 'super') G.superLatch = false;
    };
    const up = function (e) {
      e.preventDefault();
      keys[key] = false;
      el.classList.remove('held');
      if (key === 'throw') G.throwLatch = false;
      if (key === 'super') G.superLatch = false;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }
  bindPad('btn-left', 'l');
  bindPad('btn-right', 'r');
  bindPad('btn-up', 'u');
  bindPad('btn-down', 'd');
  bindPad('btn-throw', 'throw');
  bindPad('btn-super', 'super');

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
  autoSpeed = loadAutoSpeed();
  syncAutoUi();
  syncSpeedUi();
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
