'use strict';

(function () {
  const VW = 720;
  const VH = 720;
  const CX = 360;
  const CY = 372;
  const YSQ = 0.9;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const Z_NEAR = 1.06;
  const FOCAL = 324;
  const SHOT_V = 2.9;
  const FIRE_CD = 0.1;
  const MAX_SHOTS = 2;
  const COMBO_WIN = 1.48;
  const BEST_KEY = 'playbox-tempest-tube-best';
  const MUTE_KEY = 'playbox-tempest-tube-mute';
  const AUTO_SPEED_KEY = 'playbox-tempest-tube-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_TURN = [0, 3.2, 5.4, 8.2, 13];
  const AUTO_AIM = [0, 0.38, 0.28, 0.18, 0.1];
  const OPS = '← → 绕圈 · 空格开火 · Z 超闪 · 指针滑动 · A 自动 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const PUR = [180, 76, 255];
  const WHT = [246, 243, 255];

  const SCORE = { flip: 150, tank: 100, fuse: 250 };

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
  const btnClassic = document.getElementById('btn-classic');
  const btnSpike = document.getElementById('btn-spike');
  const btnAgain = document.getElementById('btn-again');
  const btnMenu = document.getElementById('btn-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const btnZap = document.getElementById('btn-zap');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const zapLabel = document.getElementById('zap-label');
  const comboEl = document.getElementById('combo-label');
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
  let toastTok = 0;
  let comboTok = 0;
  let kickTok = 0;

  const keys = { l: false, r: false };
  const pointer = { down: false, hover: false, x: CX, y: CY + 220, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const bolts = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'classic',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    pos: 0,
    fireCd: 0,
    fireHold: false,
    zap: true,
    enemies: [],
    shots: [],
    queue: [],
    spawnT: 0,
    deadT: 0,
    invuln: 0,
    clearT: 0,
    ready: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    toastT: 0,
    webRgb: PUR.slice(),
    why: ''
  };

  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoFire = false;
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

  function isSpike() {
    return G.kind === 'spike';
  }
  function laneCount() {
    return isSpike() ? 6 : 16;
  }
  function zFar() {
    return isSpike() ? 6.7 : 5.12;
  }

  function hsvRgb(h, s, v) {
    const hh = ((h % 360) + 360) % 360;
    const f = function (n) {
      const k = (n + hh / 60) % 6;
      return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return [(f(5) * 255) | 0, (f(3) * 255) | 0, (f(1) * 255) | 0];
  }

  function wrap(x, n) {
    const m = n == null ? laneCount() : n;
    return ((x % m) + m) % m;
  }

  function wrapDelta(from, to) {
    const n = laneCount();
    let d = wrap(to) - wrap(from);
    if (d > n * 0.5) d -= n;
    if (d < -n * 0.5) d += n;
    return d;
  }

  function laneDist(a, b) {
    return Math.abs(wrapDelta(a, b));
  }

  function ang0() {
    const n = laneCount();
    return Math.PI / 2 - (TAU / n) * 0.5;
  }

  function laneAng(i, t) {
    const n = laneCount();
    return ang0() + ((i + t) / n) * TAU;
  }

  function project(ang, depth) {
    const d = clamp(depth, -0.02, 1.12);
    const z = lerp(zFar(), Z_NEAR, d);
    const f = FOCAL / z;
    return {
      x: CX + Math.cos(ang) * f,
      y: CY + Math.sin(ang) * f * YSQ,
      s: f / 260
    };
  }

  function projectLane(lane, t, depth) {
    return project(laneAng(lane, t), depth);
  }

  function playerLane() {
    return wrap(Math.round(G.pos));
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
      this.beep(880, 0.055, 'square', 0.032, 1640);
      this.beep(440, 0.04, 'triangle', 0.018, 220);
    },
    hit(type, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      if (type === 'fuse') {
        this.noise(0.07, 0.05, 900);
        this.beep(1320 * lift, 0.1, 'square', 0.05, 420);
        this.beep(660, 0.14, 'triangle', 0.03, 180);
      } else if (type === 'tank') {
        this.noise(0.05, 0.04, 500);
        this.beep(280 * lift, 0.09, 'sawtooth', 0.045, 140);
        this.beep(620, 0.08, 'square', 0.03, 980);
      } else {
        this.noise(0.04, 0.038, 1100);
        this.beep(740 * lift, 0.07, 'square', 0.048, 1180);
      }
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    warn() {
      this.ensure();
      this.beep(220, 0.07, 'square', 0.03, 140);
    },
    zap() {
      this.ensure();
      this.noise(0.22, 0.07, 400);
      this.beep(140, 0.18, 'sawtooth', 0.055, 60);
      this.beep(880, 0.12, 'square', 0.04, 220);
      this.beep(1760, 0.2, 'triangle', 0.035, 110);
    },
    zapDry() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.02, 90);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.06, 'sine', 0.02, 80);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(300, 0.18, 'sawtooth', 0.05, 70);
      this.beep(160, 0.28, 'sine', 0.045, 42);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'sine', 0.04, 659);
      this.beep(784, 0.18, 'triangle', 0.045, 1046);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.14, 'triangle', 0.032, 1175);
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
    toastTok += 1;
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
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function syncZapUi() {
    const ready = G.mode === 'play' && G.zap && G.deadT <= 0;
    const spent = G.mode === 'play' && !G.zap;
    if (zapLabel) {
      if (G.mode === 'play') {
        zapLabel.hidden = false;
        zapLabel.textContent = G.zap ? '超闪' : '已闪';
        zapLabel.classList.toggle('ready', ready);
        zapLabel.classList.toggle('spent', spent);
      } else {
        zapLabel.hidden = true;
      }
    }
    if (btnZap) {
      btnZap.disabled = !ready;
      btnZap.classList.toggle('ready', ready);
      btnZap.classList.toggle('spent', spent || G.mode !== 'play');
      btnZap.textContent = spent ? '尽' : '闪';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '管旋';
      else stageLabel.textContent = '第 ' + G.wave + ' 管';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 5);
    }
    if (tagLabel) {
      tagLabel.textContent = isSpike() ? '尖管' : '经典';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ×' + G.mult) : ('连击 ' + G.combo);
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 被爬上来或三命用尽', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 超闪 ' + (G.zap ? '就绪' : '已用'), 'warn');
    else if (!G.zap) setHint('← → 绕圈 · 空格开火 · 超闪已用 · R 重开', '');
    else setHint('← → 绕圈 · 空格开火 · Z 超闪 · A 自动', G.zap ? 'hot' : '');
    syncPips();
    syncZapUi();
  }

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }

  function showOverlay(kind, title, lead) {
    autoOvWait = 0;
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'TEMPEST';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const end = kind === 'lose';
    if (ovStart) ovStart.classList.toggle('gone', end);
    if (ovEnd) ovEnd.classList.toggle('gone', !end);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 48; i++) {
      const a = rand(0, TAU);
      const r = rand(8, 46);
      stars.push({
        x: CX + Math.cos(a) * r,
        y: CY + Math.sin(a) * r * YSQ,
        r: rand(0.5, 1.5),
        a: rand(0.15, 0.55),
        p: rand(0, TAU),
        rgb: Math.random() < 0.3 ? CYN : Math.random() < 0.5 ? PUR : WHT
      });
    }
  }

  function webHue() {
    return (275 + (G.wave - 1) * 41) % 360;
  }

  function refreshWebColor() {
    G.webRgb = hsvRgb(webHue(), 0.78, 0.78);
  }

  function emit(n, o) {
    const cap = 110 - particles.length;
    const m = Math.min(n, Math.max(0, cap));
    for (let i = 0; i < m; i++) {
      particles.push({
        x: o.x,
        y: o.y,
        vx: rand(o.vx0, o.vx1),
        vy: rand(o.vy0, o.vy1),
        g: o.g == null ? 90 : o.g,
        life: o.life * rand(0.7, 1.15),
        max: o.life,
        r: rand(o.r0, o.r1),
        rgb: o.rgb
      });
    }
  }

  function spark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
  }

  function ring(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 8 });
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      vy: -42,
      t: 0,
      life: 0.7,
      text: text,
      rgb: rgb,
      gold: !!gold,
      size: gold ? 18 : 14
    });
  }

  function hitStop(t) {
    G.stop = Math.max(G.stop, REDUCE ? t * 0.35 : t);
  }

  function kick(n) {
    G.shake = Math.max(G.shake, n);
    if (!REDUCE) G.punch = Math.min(1.07, Math.max(G.punch, 1 + n * 0.004));
    if (stageEl && n >= 8) {
      stageEl.classList.remove('die');
      void stageEl.offsetWidth;
      stageEl.classList.add('die');
      kickTok += 1;
      const tok = kickTok;
      setTimeout(function () {
        if (tok === kickTok && stageEl) stageEl.classList.remove('die');
      }, 340);
    } else if (stageEl && n >= 3) {
      stageEl.classList.remove('hit');
      void stageEl.offsetWidth;
      stageEl.classList.add('hit');
    }
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a);
    G.flashRgb = rgb;
  }

  function enemyRgb(type) {
    if (type === 'tank') return CYN;
    if (type === 'fuse') return GOLD;
    return MAG;
  }

  function enemyPos(e) {
    if (e.type === 'fuse') return project(laneAng(e.rail, 0), e.depth);
    const t = e.state === 'flip' ? wrap(e.pos) - Math.floor(wrap(e.pos)) : 0.5;
    const lane = e.state === 'flip' ? Math.floor(wrap(e.pos)) : e.lane;
    return projectLane(lane, t === 0 && e.state === 'flip' ? 0 : (e.state === 'flip' ? t : 0.5), e.depth);
  }

  function crawlSpeed(type) {
    const w = G.wave;
    let v = 0.155 + (w - 1) * 0.028;
    if (isSpike()) v *= G.wave === 1 ? 1.08 : 1.22;
    if (type === 'tank') v *= 0.72;
    if (type === 'fuse') v *= 0.88;
    if (type === 'flip') v *= 1;
    return v;
  }

  function rimSpeed(type) {
    const n = laneCount();
    const ang = (isSpike() ? 2.6 : 3.4) + G.wave * 0.18;
    let lanes = ang * n / TAU;
    if (type === 'fuse') lanes *= 1.55;
    return lanes;
  }

  function maxLive() {
    return isSpike() ? 7 : 12;
  }

  function liveCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function laneBusy(lane, near) {
    const lim = near == null ? 0.22 : near;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.depth > lim) continue;
      if (e.type === 'fuse') {
        if (wrap(e.rail) === wrap(lane) || wrap(e.rail - 1) === wrap(lane)) return true;
      } else if (wrap(e.lane) === wrap(lane)) return true;
    }
    return false;
  }

  function pickLane() {
    const n = laneCount();
    const start = (Math.random() * n) | 0;
    for (let k = 0; k < n; k++) {
      const lane = wrap(start + k);
      if (!laneBusy(lane, 0.28)) return lane;
    }
    return start;
  }

  function makeEnemy(type, lane) {
    const e = {
      type: type,
      lane: wrap(lane),
      rail: wrap(lane),
      pos: wrap(lane),
      depth: 0.02,
      dir: Math.random() < 0.5 ? 1 : -1,
      alive: true,
      state: 'crawl',
      warned: false,
      pulse: rand(0, TAU),
      rgb: enemyRgb(type)
    };
    if (type === 'fuse') e.depth = 0.04;
    return e;
  }

  function buildWave(w) {
    const q = [];
    let nFlip = Math.min(20, 6 + w * 2);
    let nTank = w === 1 ? 0 : Math.min(8, 1 + w);
    let nFuse = w < 3 ? 0 : Math.min(6, w - 1);
    if (isSpike()) {
      nFlip = Math.min(16, nFlip + 1);
      if (w >= 2) nTank += 1;
    }
    const bag = [];
    for (let i = 0; i < nFlip; i++) bag.push('flip');
    for (let i = 0; i < nTank; i++) bag.push('tank');
    for (let i = 0; i < nFuse; i++) bag.push('fuse');
    for (let i = bag.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = bag[i];
      bag[i] = bag[j];
      bag[j] = t;
    }
    let delay = 0.12;
    const gap = Math.max(0.18, 0.62 - w * 0.045) * (isSpike() ? 0.86 : 1);
    for (let i = 0; i < bag.length; i++) {
      q.push({ type: bag[i], wait: delay });
      delay = gap * rand(0.72, 1.18);
    }
    return q;
  }

  function spawnFromQueue() {
    if (!G.queue.length) return;
    if (liveCount() >= maxLive()) return;
    const item = G.queue[0];
    if (G.spawnT < item.wait) return;
    G.queue.shift();
    G.spawnT = 0;
    G.enemies.push(makeEnemy(item.type, pickLane()));
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = comboMult();
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      comboTok += 1;
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    } else {
      G.mult = next;
    }
  }

  function killEnemy(e, zapped) {
    if (!e.alive) return;
    e.alive = false;
    const p = enemyPos(e);
    const rgb = e.rgb;
    const n = e.type === 'fuse' ? 18 : e.type === 'tank' ? 16 : 12;
    emit(n, {
      x: p.x, y: p.y,
      vx0: -220, vx1: 220, vy0: -240, vy1: 160,
      life: 0.42, r0: 1.1, r1: 3.4, rgb: rgb, g: 140
    });
    spark(p.x, p.y, rgb, 18 + e.depth * 10);
    ring(p.x, p.y, rgb, 6 + e.depth * 8);
    if (G.mode === 'play') {
      bumpCombo();
      const pts = Math.round(SCORE[e.type] * G.mult);
      addScore(pts);
      floatText(p.x, p.y - 8, '+' + pts, rgb, G.mult >= 3);
      audio.hit(e.type, G.combo);
    }
    hitStop(zapped ? 0.03 : (e.type === 'fuse' ? 0.07 : 0.048));
    kick(zapped ? 3 : (4 + Math.min(6, G.combo)));
    screenFlash(rgb, zapped ? 0.22 : 0.32);
    if (!zapped && e.type === 'tank') {
      const a = wrap(e.lane);
      const b = wrap(e.lane + 1);
      const d = Math.min(0.96, e.depth + 0.04);
      const f1 = makeEnemy('flip', a);
      const f2 = makeEnemy('flip', b);
      f1.depth = d;
      f2.depth = d;
      f1.pos = a;
      f2.pos = b;
      if (d > 0.9) {
        f1.state = 'flip';
        f2.state = 'flip';
        f1.depth = 1;
        f2.depth = 1;
      }
      G.enemies.push(f1, f2);
    }
  }

  function fire() {
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lane = playerLane();
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].lane === lane) n += 1;
    }
    if (n >= 1) return;
    if (G.shots.length >= MAX_SHOTS) return;
    G.fireCd = FIRE_CD;
    G.shots.push({
      lane: lane,
      pos: G.pos,
      depth: 0.98,
      trail: []
    });
    if (G.mode === 'play') audio.shoot();
    const p = projectLane(lane, 0.5, 0.98);
    emit(4, {
      x: p.x, y: p.y,
      vx0: -40, vx1: 40, vy0: -40, vy1: 40,
      life: 0.16, r0: 0.8, r1: 1.8, rgb: CYN, g: 0
    });
  }

  function shotHits(s, e) {
    if (!e.alive) return false;
    if (Math.abs(s.depth - e.depth) > (e.type === 'fuse' ? 0.07 : 0.055)) return false;
    if (e.type === 'fuse') {
      const r = wrap(e.rail);
      return wrap(s.lane) === r || wrap(s.lane + 1) === r;
    }
    const lane = e.state === 'flip' ? wrap(e.pos) : e.lane;
    return laneDist(s.lane, lane) < 0.62;
  }

  function doZap() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (!G.zap) {
      audio.zapDry();
      toast('超闪已用', true, false);
      return;
    }
    G.zap = false;
    audio.zap();
    hitStop(0.08);
    kick(12);
    screenFlash(WHT, 0.85);
    G.punch = 1.06;
    const n = laneCount();
    for (let i = 0; i < n; i++) {
      bolts.push({ lane: i, t: 0, seed: rand(0, 80) });
    }
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) killEnemy(G.enemies[i], true);
    }
    toast('超闪', false, true);
    syncZapUi();
  }

  function killPlayer() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.fireHold = false;
    G.shots = [];
    breakCombo();
    audio.death();
    hitStop(0.12);
    kick(14);
    screenFlash(MAG, 0.7);
    const p = projectLane(G.pos, 0.5, 1.02);
    emit(28, {
      x: p.x, y: p.y,
      vx0: -280, vx1: 280, vy0: -300, vy1: 180,
      life: 0.85, r0: 1.4, r1: 4.2, rgb: GOLD, g: 160
    });
    spark(p.x, p.y, GOLD, 28);
    ring(p.x, p.y, MAG, 12);
    toast(G.lives > 0 ? '管壁击穿' : '管裂了', true, false);
    syncHud();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why;
    G.fireHold = false;
    audio.lose();
    saveBest();
    showOverlay('lose', why, '第 ' + G.wave + ' 管 · 分数 ' + G.score);
    syncHud();
  }

  function startWave(w) {
    G.wave = w;
    G.zap = true;
    G.queue = buildWave(w);
    G.spawnT = 0;
    G.clearT = 0;
    G.ready = 0.35;
    refreshWebColor();
    syncZapUi();
  }

  function waveClear() {
    const bonus = 200 * G.wave;
    addScore(bonus);
    audio.wave();
    hitStop(0.09);
    screenFlash(GOLD, 0.42);
    kick(6);
    const p = project(0, 0.2);
    floatText(CX, CY, '+' + bonus, GOLD, true);
    toast('第 ' + (G.wave + 1) + ' 管 · 加速', false, true);
    G.shots = [];
    G.enemies = [];
    G.queue = [];
    startWave(G.wave + 1);
    G.invuln = Math.max(G.invuln, 0.45);
    syncHud();
  }

  function resetRun(kind) {
    G.kind = kind === 'spike' ? 'spike' : 'classic';
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.pos = 0;
    G.shots = [];
    G.enemies = [];
    G.queue = [];
    G.deadT = 0;
    G.invuln = 0.6;
    G.fireCd = 0;
    G.fireHold = false;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.clearT = 0;
    G.why = '';
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    bolts.length = 0;
    startWave(1);
    if (scoreEl) scoreEl.textContent = '0';
  }

  function startGame(kind) {
    audio.start();
    resetRun(kind);
    G.mode = 'play';
    hideOverlay();
    toast(isSpike() ? '尖管 · 第 1 管' : '经典 · 第 1 管', false, true);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'classic';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.pos = 0;
    G.deadT = 0;
    G.invuln = 99;
    G.fireHold = false;
    G.shots = [];
    G.enemies = [];
    G.queue = buildWave(1);
    G.spawnT = 0.2;
    G.wave = 1;
    G.zap = true;
    refreshWebColor();
    showOverlay('title', '管旋', '沿着管壁开火，别让它们爬上来。');
    syncHud();
  }

  function contactHits(e) {
    if (!e.alive) return false;
    if (e.depth < 0.9) return false;
    const pl = G.pos;
    if (e.type === 'fuse') {
      const r = wrap(e.rail);
      return laneDist(pl, r) < 0.62 || laneDist(pl, wrap(r - 1)) < 0.62;
    }
    const lane = e.state === 'flip' ? e.pos : e.lane;
    return laneDist(pl, lane) < 0.48 && e.depth >= 0.94;
  }

  function moveEnemies(dt) {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.pulse += dt * (e.type === 'fuse' ? 10 : 4.5);
      if (G.mode === 'title' && e.depth >= 0.97) {
        e.alive = false;
        continue;
      }
      if (e.state === 'crawl') {
        e.depth += crawlSpeed(e.type) * dt;
        if (e.depth >= 1) {
          e.depth = 1;
          if (e.type === 'tank') {
            e.alive = false;
            const a = wrap(e.lane);
            const b = wrap(e.lane + (Math.random() < 0.5 ? 1 : -1));
            const f1 = makeEnemy('flip', a);
            const f2 = makeEnemy('flip', b);
            f1.depth = 1;
            f2.depth = 1;
            f1.state = 'flip';
            f2.state = 'flip';
            f1.pos = a;
            f2.pos = b;
            G.enemies.push(f1, f2);
            const p = enemyPos(e);
            emit(10, {
              x: p.x, y: p.y,
              vx0: -120, vx1: 120, vy0: -120, vy1: 80,
              life: 0.28, r0: 1, r1: 2.4, rgb: CYN, g: 60
            });
            continue;
          }
          e.state = 'flip';
          e.pos = e.type === 'fuse' ? e.rail : e.lane;
          e.dir = wrapDelta(e.pos, G.pos) >= 0 ? 1 : -1;
        }
      } else {
        e.depth = 1;
        const spd = rimSpeed(e.type);
        e.pos = wrap(e.pos + e.dir * spd * dt);
        if (e.type === 'fuse') e.rail = wrap(e.pos);
        else e.lane = wrap(Math.round(e.pos));
        if (Math.random() < dt * 0.35) {
          const nd = wrapDelta(e.pos, G.pos);
          if (Math.abs(nd) > 0.2) e.dir = nd >= 0 ? 1 : -1;
        }
      }
      if (!e.warned && e.depth > 0.78 && G.mode === 'play') {
        e.warned = true;
        audio.warn();
      }
    }
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      if (!G.enemies[i].alive) G.enemies.splice(i, 1);
    }
  }

  function moveShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      const dist = SHOT_V * dt;
      const n = Math.max(1, Math.ceil(dist / 0.03));
      const h = dt / n;
      let dead = false;
      for (let k = 0; k < n && !dead; k++) {
        s.depth -= SHOT_V * h;
        if (s.depth < 0.01) {
          dead = true;
          if (G.mode === 'play') {
            breakCombo();
            audio.miss();
          }
          break;
        }
        let hit = null;
        let bestD = 1;
        for (let j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (!shotHits(s, e)) continue;
          if (e.depth < bestD) {
            bestD = e.depth;
            hit = e;
          }
        }
        if (hit) {
          killEnemy(hit, false);
          dead = true;
          break;
        }
      }
      if (!REDUCE) {
        const p = project(laneAng(s.pos, 0.5), s.depth);
        s.trail.push({ x: p.x, y: p.y, d: s.depth });
        if (s.trail.length > 6) s.trail.shift();
      }
      if (dead) G.shots.splice(i, 1);
    }
  }

  function pointerPosToLane() {
    const dx = pointer.x - CX;
    const dy = pointer.y - CY;
    if (dx * dx + dy * dy < 36 * 36) return null;
    const a = Math.atan2(dy, dx);
    const n = laneCount();
    let t = (a - ang0()) / TAU * n;
    return wrap(t);
  }

  function updatePlayer(dt) {
    const n = laneCount();
    const angSpd = isSpike() ? 5.4 : 4.8;
    const laneSpd = angSpd * n / TAU;
    if (autoOn && G.mode === 'play') return;
    if (keys.l || keys.r) {
      inputSrc = 'key';
      const dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      G.pos = wrap(G.pos + dir * laneSpd * dt);
    } else if ((pointer.down || (pointer.hover && inputSrc === 'ptr')) && inputSrc === 'ptr') {
      const t = pointerPosToLane();
      if (t != null) {
        const d = wrapDelta(G.pos, t);
        const max = laneSpd * 1.8 * dt;
        if (Math.abs(d) <= max) G.pos = wrap(t);
        else G.pos = wrap(G.pos + (d < 0 ? -max : max));
      }
    }
  }

  function demoThink(dt) {
    const n = laneCount();
    let target = G.pos;
    let best = -1;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const threat = e.depth + (e.state === 'flip' ? 0.25 : 0);
      if (threat > best) {
        best = threat;
        target = e.type === 'fuse' ? wrap(e.rail - 0.5) : (e.state === 'flip' ? e.pos : e.lane);
      }
    }
    const d = wrapDelta(G.pos, target);
    const spd = 6.2 * n / TAU;
    const step = spd * dt;
    if (Math.abs(d) <= step) G.pos = wrap(target);
    else G.pos = wrap(G.pos + (d < 0 ? -step : step));
    autoFire = best > 0.08 && Math.abs(wrapDelta(G.pos, target)) < 0.45;
  }

  function autoThink() {
    const n = laneCount();
    let target = G.pos;
    let best = -1;
    let nearN = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.depth > 0.68) nearN += 1;
      const threat = e.depth + (e.state === 'flip' ? 0.35 : 0) + (e.type === 'fuse' ? 0.08 : 0);
      if (threat > best) {
        best = threat;
        if (e.type === 'fuse') target = wrap(e.rail - 0.45);
        else target = e.state === 'flip' ? e.pos : e.lane + 0.5;
      }
    }
    const d = wrapDelta(G.pos, target);
    const spd = AUTO_TURN[autoSpeed] * n / TAU;
    const step = spd * STEP;
    if (Math.abs(d) <= step) G.pos = wrap(target);
    else G.pos = wrap(G.pos + (d < 0 ? -step : step));
    autoFire = best > 0.05 && Math.abs(wrapDelta(G.pos, target)) < AUTO_AIM[autoSpeed] + 0.35;
    if (G.zap && nearN >= (isSpike() ? 2 : 3) && best > 0.74) doZap();
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait > 0.7) startGame('classic');
      return;
    }
    if (G.mode === 'lose') {
      autoOvWait += dt;
      if (autoOvWait > 0.85) startGame(G.kind);
    }
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoFire = false;
    autoOvWait = 0;
    if (btnAuto) {
      btnAuto.classList.toggle('on', autoOn);
      btnAuto.textContent = autoOn ? '停' : '自动';
      btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    }
    if (autoOn) {
      keys.l = false;
      keys.r = false;
      G.fireHold = false;
    }
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    if (!(autoOn && G.mode === 'play')) updatePlayer(dt);
    const holding = (G.mode === 'title' && autoFire)
      || (G.mode === 'play' && ((autoOn && autoFire) || (!autoOn && G.fireHold)));
    if (holding) fire();

    if (G.ready > 0) {
      G.ready -= dt;
      moveShots(dt);
      return;
    }

    G.spawnT += dt;
    spawnFromQueue();
    moveEnemies(dt);
    moveShots(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
      for (let i = 0; i < G.enemies.length; i++) {
        if (contactHits(G.enemies[i])) {
          killPlayer();
          break;
        }
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 14));
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.4);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.38) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.36) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      bolts[i].t += dt;
      if (bolts[i].t > 0.42) bolts.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    tickAutoFlow(dt);

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink();

    if (G.mode === 'title') {
      demoThink(dt);
      const oldKind = G.kind;
      G.kind = 'classic';
      playSim(dt);
      G.kind = oldKind;
      if (liveCount() === 0 && !G.queue.length) {
        G.queue = buildWave(1);
        G.spawnT = 0.4;
      }
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose') {
      updateFx(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('管裂了');
          updateFx(dt);
          return;
        }
        G.invuln = 1.4;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && liveCount() === 0 && !G.queue.length && G.ready <= 0) {
      G.clearT += dt;
      if (G.clearT > 0.28) waveClear();
    } else {
      G.clearT = 0;
    }

    updateFx(dt);
    syncHud();
  }

  function strokePoly(pts, rgb, w, a) {
    if (pts.length < 2) return;
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = w * scale;
    ctx.beginPath();
    ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
    ctx.closePath();
    ctx.stroke();
  }

  function fillPoly(pts, rgb, a) {
    ctx.fillStyle = rgba(rgb, a);
    ctx.beginPath();
    ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
    ctx.closePath();
    ctx.fill();
  }

  function ringPts(depth) {
    const n = laneCount();
    const pts = [];
    for (let i = 0; i < n; i++) pts.push(projectLane(i, 0, depth));
    return pts;
  }

  function drawBg() {
    const g = ctx.createRadialGradient(sx(CX), sy(CY), 8 * scale, sx(CX), sy(CY), 420 * scale);
    g.addColorStop(0, '#14061e');
    g.addColorStop(0.28, '#0a0414');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(CX), sy(CY), 10 * scale, sx(CX), sy(CY), 220 * scale);
    vg.addColorStop(0, rgba(G.webRgb, 0.16));
    vg.addColorStop(0.45, rgba(MAG, 0.04));
    vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(G.t * 1.5 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawWeb() {
    const n = laneCount();
    const rgb = G.webRgb;
    const pl = playerLane();
    const danger = G.mode === 'play' && G.enemies.some(function (e) {
      return e.alive && e.depth > 0.72;
    });
    const pulse = 0.5 + 0.5 * Math.sin(G.t * (danger ? 9 : 2.2));

    for (let i = 0; i < n; i++) {
      const a = projectLane(i, 0, 0.02);
      const b = projectLane(i, 1, 0.02);
      const c = projectLane(i, 1, 1);
      const d = projectLane(i, 0, 1);
      const mine = wrap(i) === pl;
      fillPoly([a, b, c, d], mine ? CYN : rgb, mine ? 0.07 + pulse * 0.03 : 0.028);
    }

    const depths = [0.02, 0.28, 0.52, 0.76, 1];
    for (let k = 0; k < depths.length; k++) {
      const pts = ringPts(depths[k]);
      const a = 0.18 + depths[k] * 0.38;
      strokePoly(pts, danger && depths[k] > 0.7 ? MAG : rgb, 1.1 + depths[k] * 0.6, a);
    }

    for (let i = 0; i < n; i++) {
      const far = projectLane(i, 0, 0.02);
      const near = projectLane(i, 0, 1);
      const mine = wrap(i) === pl || wrap(i - 1) === pl;
      ctx.strokeStyle = rgba(mine ? CYN : rgb, mine ? 0.72 : 0.28);
      ctx.lineWidth = (mine ? 2.1 : 1.15) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(far.x), sy(far.y));
      ctx.lineTo(sx(near.x), sy(near.y));
      ctx.stroke();
    }

    const hole = ringPts(0.0);
    fillPoly(hole, [4, 1, 10], 0.72);
    strokePoly(hole, rgb, 1.4, 0.55);
  }

  function drawBolts() {
    if (!bolts.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      const k = b.t / 0.42;
      const a = 0.85 * (1 - k);
      ctx.strokeStyle = rgba(k < 0.3 ? WHT : GOLD, a);
      ctx.lineWidth = (2.8 - k * 1.6) * scale;
      ctx.beginPath();
      const steps = 7;
      for (let s = 0; s <= steps; s++) {
        const d = 1 - s / steps;
        const jitter = (s === 0 || s === steps) ? 0 : Math.sin(b.seed + s * 2.1 + b.t * 40) * 0.18;
        const p = projectLane(b.lane, 0.5 + jitter, d);
        if (s === 0) ctx.moveTo(sx(p.x), sy(p.y));
        else ctx.lineTo(sx(p.x), sy(p.y));
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlipper(e) {
    const lane = e.state === 'flip' ? wrap(e.pos) : e.lane;
    const frac = e.state === 'flip' ? wrap(e.pos) - Math.floor(wrap(e.pos)) : 0.5;
    const d = e.depth;
    const L = projectLane(lane, e.state === 'flip' ? frac : 0.18, d);
    const R = projectLane(lane, e.state === 'flip' ? frac + 0.55 : 0.82, d);
    const tip = projectLane(lane, e.state === 'flip' ? frac + 0.28 : 0.5, Math.max(0.01, d - 0.07));
    const w = 1.6 + e.depth * 1.4;
    ctx.strokeStyle = rgba(MAG, 0.95);
    ctx.lineWidth = w * scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(L.x), sy(L.y));
    ctx.lineTo(sx(tip.x), sy(tip.y));
    ctx.lineTo(sx(R.x), sy(R.y));
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.45);
    ctx.lineWidth = 0.8 * scale;
    ctx.stroke();
  }

  function drawTanker(e) {
    const d = e.depth;
    const p = projectLane(e.lane, 0.5, d);
    const a = projectLane(e.lane, 0.22, d);
    const b = projectLane(e.lane, 0.78, d);
    const far = projectLane(e.lane, 0.5, Math.max(0.01, d - 0.06));
    const near = projectLane(e.lane, 0.5, Math.min(1.05, d + 0.05));
    const throb = 0.85 + 0.15 * Math.sin(e.pulse);
    ctx.fillStyle = rgba(CYN, 0.22 * throb);
    ctx.beginPath();
    ctx.moveTo(sx(far.x), sy(far.y));
    ctx.lineTo(sx(a.x), sy(a.y));
    ctx.lineTo(sx(near.x), sy(near.y));
    ctx.lineTo(sx(b.x), sy(b.y));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.95);
    ctx.lineWidth = (1.6 + d) * scale;
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), (1.6 + d * 2.2) * scale, 0, TAU);
    ctx.fill();
  }

  function drawFuse(e) {
    const p = project(laneAng(e.rail, 0), e.depth);
    const r = (3.2 + e.depth * 5.5) * (0.82 + 0.18 * Math.sin(e.pulse));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(GOLD, 0.18);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), r * 2.2 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), r * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(sx(p.x - r * 0.25), sy(p.y - r * 0.25), r * 0.35 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemies() {
    const list = G.enemies.slice().filter(function (e) { return e.alive; });
    list.sort(function (a, b) { return a.depth - b.depth; });
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.type === 'tank') drawTanker(e);
      else if (e.type === 'fuse') drawFuse(e);
      else drawFlipper(e);
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.trail) {
        for (let t = 1; t < s.trail.length; t++) {
          const a = s.trail[t - 1];
          const b = s.trail[t];
          ctx.strokeStyle = rgba(CYN, 0.12 + t * 0.08);
          ctx.lineWidth = (1.4 + t * 0.35) * scale;
          ctx.beginPath();
          ctx.moveTo(sx(a.x), sy(a.y));
          ctx.lineTo(sx(b.x), sy(b.y));
          ctx.stroke();
        }
      }
      const p0 = project(laneAng(s.pos, 0.5), s.depth);
      const p1 = project(laneAng(s.pos, 0.5), Math.min(1, s.depth + 0.08));
      ctx.strokeStyle = rgba(WHT, 0.95);
      ctx.lineWidth = 2.6 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(p1.x), sy(p1.y));
      ctx.lineTo(sx(p0.x), sy(p0.y));
      ctx.stroke();
      ctx.strokeStyle = rgba(CYN, 0.8);
      ctx.lineWidth = 5 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawClaw() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 14) | 0) % 2 === 0) return;
    const p = G.pos;
    const L = projectLane(p, 0.08, 1.01);
    const R = projectLane(p, 0.92, 1.01);
    const M = projectLane(p, 0.5, 1.018);
    const tip = projectLane(p, 0.5, 0.86);
    const glow = G.zap ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(G.t * 8)) : 0.7;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(GOLD, 0.25 * glow);
    ctx.lineWidth = 8 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(L.x), sy(L.y));
    ctx.lineTo(sx(M.x), sy(M.y));
    ctx.lineTo(sx(R.x), sy(R.y));
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(L.x), sy(L.y));
    ctx.lineTo(sx(M.x), sy(M.y));
    ctx.lineTo(sx(R.x), sy(R.y));
    ctx.stroke();
    ctx.strokeStyle = rgba(CYN, 0.9);
    ctx.lineWidth = 2.1 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(M.x), sy(M.y));
    ctx.lineTo(sx(tip.x), sy(tip.y));
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(sx(M.x), sy(M.y), 2.4 * scale, 0, TAU);
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
      const k = s.t / 0.38;
      ctx.strokeStyle = rgba(s.rgb, 0.65 * (1 - k));
      ctx.lineWidth = (2.6 - k) * scale;
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
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, 1);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.2);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(CX);
      const cy = sy(CY);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawWeb();
    drawEnemies();
    drawShots();
    drawBolts();
    drawClaw();
    drawParticles();
    drawFloats();
    drawFlash();
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
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
    if (G.mode === 'title') startGame('classic');
    else startGame(G.kind || 'classic');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('classic');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
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
    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if ((k === 'd' || k === 'D') && k.length === 1) {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || space || k === 'Enter' || k === 'z' || k === 'Z')) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
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
    if (k === 'z' || k === 'Z') {
      audio.ensure();
      if (G.mode === 'play') doZap();
      return;
    }
    if (autoOn && (k === 'ArrowLeft' || k === 'ArrowRight' || space || k === 'd' || k === 'D')) return;
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fire();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (autoOn) return;
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      inputSrc = 'ptr';
      const t = pointerPosToLane();
      if (t != null) G.pos = t;
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
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

  function initSpeed() {
    autoSpeed = loadAutoSpeed();
    if (speedEl) speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
  }

  seedStars();
  loadBest();
  initMute();
  initSpeed();
  goTitle();
  resize();
  bindPointer();
  if (btnAuto) {
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.textContent = autoOn ? '停' : '自动';
  }

  if (btnClassic) {
    btnClassic.addEventListener('click', function () {
      audio.ensure();
      startGame('classic');
    });
  }
  if (btnSpike) {
    btnSpike.addEventListener('click', function () {
      audio.ensure();
      startGame('spike');
    });
  }
  if (btnAgain) {
    btnAgain.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (btnMenu) {
    btnMenu.addEventListener('click', function () {
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
  if (btnZap) {
    btnZap.addEventListener('click', function () {
      audio.ensure();
      doZap();
    });
  }
  if (btnAuto) btnAuto.addEventListener('click', toggleAuto);
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      autoSpeed = clamp(parseInt(speedEl.value, 10) || 3, 1, 4);
      saveAutoSpeed(autoSpeed);
      if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
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
