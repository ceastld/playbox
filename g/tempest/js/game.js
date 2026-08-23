'use strict';

(function () {
  const VW = 720;
  const VH = 720;
  const CX = 360;
  const CY = 368;
  const YSQ = 0.9;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const Z_NEAR = 1.06;
  const FOCAL = 318;
  const SHOT_V = 2.85;
  const FIRE_CD = 0.1;
  const MAX_SHOTS = 8;
  const COMBO_WIN = 1.48;
  const BEST_KEY = 'playbox-tempest-best';
  const MUTE_KEY = 'playbox-tempest-mute';
  const OPS = '← → / WASD 绕沿 · 空格开火 · Shift / Z 超闪 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const PUR = [196, 77, 255];
  const WHT = [246, 243, 255];
  const LIME = [170, 255, 90];
  const ORG = [255, 140, 64];

  const SCORE = { flip: 150, tank: 100, spiker: 50, fuse: 250, dart: 80 };

  const WEBS = [
    { name: '圆涡', en: 'CIRCLE', n: 16, shape: 'circle' },
    { name: '方阱', en: 'SQUARE', n: 16, shape: 'square' },
    { name: '十字', en: 'PLUS', n: 16, shape: 'plus' },
    { name: '三棱', en: 'TRI', n: 15, shape: 'tri' },
    { name: '星裂', en: 'STAR', n: 16, shape: 'star' },
    { name: '钉心', en: 'CORE', n: 16, shape: 'core', boss: true }
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
  const btnStorm = document.getElementById('btn-storm');
  const btnCore = document.getElementById('btn-core');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnZap = document.getElementById('btn-zap');
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
  let kickTok = 0;
  let comboTok = 0;

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
    kind: 'storm',
    phase: 'fight',
    t: 0,
    clock: 0,
    level: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: 20000,
    pos: 0,
    fireCd: 0,
    fireHold: false,
    zap: true,
    enemies: [],
    shots: [],
    spikes: [],
    queue: [],
    spawnT: 0,
    deadT: 0,
    invuln: 0,
    ready: 0,
    clearT: 0,
    diveDepth: 1,
    diveSpd: 0.42,
    warpT: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: PUR,
    punch: 1,
    toastT: 0,
    webRgb: PUR.slice(),
    why: '',
    muzzle: 0,
    bossHp: 0,
    bossMax: 0,
    bossT: 0,
    bossFlash: 0,
    pulseLanes: [],
    pulseT: 0,
    pulseOn: 0,
    dartT: 0,
    summonT: 0
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
  function hsvRgb(h, s, v) {
    const hh = ((h % 360) + 360) % 360;
    const f = function (n) {
      const k = (n + hh / 60) % 6;
      return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return [(f(5) * 255) | 0, (f(3) * 255) | 0, (f(1) * 255) | 0];
  }

  function isCore() {
    return G.kind === 'core';
  }
  function isBoss() {
    return G.phase === 'boss';
  }
  function webOf() {
    if (G.phase === 'boss' || G.level > WEBS.length - 1) return WEBS[WEBS.length - 1];
    const i = clamp(G.level - 1, 0, WEBS.length - 2);
    return WEBS[i];
  }
  function laneCount() {
    return webOf().n;
  }
  function zFar() {
    return isCore() ? 6.05 : 5.28;
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
  function playerLane() {
    return wrap(Math.round(G.pos));
  }
  function playerDepth() {
    return G.phase === 'dive' ? G.diveDepth : 1.02;
  }

  function shapeR(i, n, shape) {
    const a = (i / n) * TAU;
    if (shape === 'square') {
      return 0.78 / Math.max(0.42, Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))));
    }
    if (shape === 'plus') {
      const u = Math.abs(Math.cos(a * 2));
      return 0.56 + 0.44 * Math.pow(u, 0.62);
    }
    if (shape === 'tri') {
      const u = 0.5 + 0.5 * Math.cos(a * 3);
      return 0.6 + 0.4 * Math.pow(u, 0.72);
    }
    if (shape === 'star') {
      const u = 0.5 + 0.5 * Math.cos(a * 8);
      return 0.56 + 0.44 * Math.pow(u, 1.35);
    }
    if (shape === 'core') {
      const pulse = 0.05 * Math.sin(G.t * 3.1);
      const u = 0.5 + 0.5 * Math.cos(a * 8);
      return 0.5 + 0.44 * Math.pow(u, 1.15) + pulse;
    }
    return 1;
  }

  function ang0() {
    const n = laneCount();
    return Math.PI / 2 - (TAU / n) * 0.5;
  }

  function vertexR(i) {
    const web = webOf();
    return shapeR(wrap(i, web.n), web.n, web.shape);
  }

  function laneAng(i, t) {
    const n = laneCount();
    return ang0() + ((i + t) / n) * TAU;
  }

  function laneRad(i, t) {
    const a = vertexR(i);
    const b = vertexR(i + 1);
    return lerp(a, b, t);
  }

  function project(ang, rad, depth) {
    const d = clamp(depth, -0.04, 1.18);
    const z = lerp(zFar(), Z_NEAR, clamp(d, 0, 1));
    const f = FOCAL / z;
    const r = rad == null ? 1 : rad;
    return {
      x: CX + Math.cos(ang) * r * f,
      y: CY + Math.sin(ang) * r * f * YSQ,
      s: f / 258,
      z: z
    };
  }

  function projectLane(lane, t, depth) {
    const i = Math.floor(wrap(lane));
    const f = t;
    return project(laneAng(i, f), laneRad(i, f), depth);
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
      this.beep(460, 0.04, 'triangle', 0.016, 220);
    },
    hit(type, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      if (type === 'fuse') {
        this.noise(0.07, 0.05, 900);
        this.beep(1320 * lift, 0.1, 'square', 0.05, 420);
      } else if (type === 'tank') {
        this.noise(0.05, 0.04, 500);
        this.beep(280 * lift, 0.09, 'sawtooth', 0.045, 140);
      } else if (type === 'spiker') {
        this.beep(540 * lift, 0.07, 'square', 0.04, 220);
        this.noise(0.04, 0.03, 700);
      } else if (type === 'boss') {
        this.noise(0.06, 0.05, 380);
        this.beep(180 * lift, 0.12, 'sawtooth', 0.05, 90);
        this.beep(880, 0.08, 'square', 0.03, 440);
      } else {
        this.noise(0.04, 0.038, 1100);
        this.beep(740 * lift, 0.07, 'square', 0.048, 1180);
      }
    },
    spike() {
      this.ensure();
      this.beep(980, 0.05, 'square', 0.032, 420);
      this.beep(320, 0.06, 'triangle', 0.02, 140);
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
      this.beep(160, 0.05, 'sine', 0.016, 80);
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
    dive() {
      this.ensure();
      this.noise(0.18, 0.04, 220);
      this.beep(90, 0.28, 'sawtooth', 0.04, 40);
      this.beep(220, 0.22, 'sine', 0.035, 880);
    },
    pulse() {
      this.ensure();
      this.beep(140, 0.12, 'square', 0.04, 70);
      this.noise(0.1, 0.04, 280);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(880, 0.18, 'sine', 0.05, 1175);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.034, 1175);
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
    if (scoreBox && scoreAdd) {
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
    while (G.score >= G.next1up && G.lives < 6) {
      G.lives += 1;
      G.next1up += 20000;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.28;
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
    const n = 6;
    while (pips.length < n) {
      const d = document.createElement('i');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < n; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : (G.mode !== 'title' && i < LIVES ? ' gone' : ''));
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function syncZapUi() {
    const ready = G.mode === 'play' && G.zap && G.deadT <= 0 && G.phase !== 'dive' && G.phase !== 'warp';
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
    const web = webOf();
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '风暴';
      else if (G.phase === 'dive') stageLabel.textContent = '扎管';
      else if (G.phase === 'warp') stageLabel.textContent = '跃迁';
      else if (G.phase === 'boss') stageLabel.textContent = '钉心';
      else stageLabel.textContent = web.name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.phase === 'boss' || G.phase === 'dive' || G.level >= 4));
    }
    if (tagLabel) {
      let tag = isCore() ? '核管' : '风暴';
      if (G.mode === 'play' && G.phase === 'boss') tag = G.bossHp + '/' + G.bossMax;
      if (G.mode === 'play' && G.phase === 'dive') tag = '避钉';
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || (G.phase === 'dive' && G.mode === 'play'));
      tagLabel.classList.toggle('hot', G.phase === 'boss' || G.combo >= 8);
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
    else if (G.mode === 'lose') setHint('R 重开 · 撞上或钉穿扣命', 'warn');
    else if (G.mode === 'win') setHint('钉心粉碎 · R 再来', 'hot');
    else if (G.phase === 'dive') setHint('扎进钉管 · 开火削钉 · 躲开钉尖', 'hot');
    else if (G.phase === 'boss') setHint('钉心 · 打核心 · 超闪可削一截', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 超闪 ' + (G.zap ? '就绪' : '已用'), 'warn');
    else if (!G.zap) setHint('← → 绕沿 · 空格开火 · 超闪已用 · R 重开', '');
    else setHint('← → 绕沿 · 空格向内开火 · Shift/Z 超闪', G.zap ? 'hot' : '');
    syncPips();
    syncZapUi();
  }

  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TMPS';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const end = kind === 'lose' || kind === 'win';
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
    for (let i = 0; i < 88; i++) {
      stars.push({
        ang: rand(0, TAU),
        depth: Math.random(),
        spd: rand(0.1, 0.48),
        r: Math.random() < 0.7 ? 0.7 : 1.25,
        a: rand(0.28, 0.9),
        rgb: Math.random() < 0.18 ? PUR : Math.random() < 0.14 ? CYN : Math.random() < 0.1 ? MAG : WHT
      });
    }
  }

  function webHue() {
    if (G.phase === 'boss') return 312;
    return (286 + (G.level - 1) * 37) % 360;
  }

  function refreshWebColor() {
    G.webRgb = hsvRgb(webHue(), 0.78, 0.82);
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, o) {
    const cap = 120 - particles.length;
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

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 50,
        life: rand(0.22, 0.52),
        max: 0.52,
        r: rand(1.2, 2.9),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 150);
  }

  function spark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 8 });
    capArr(rings, 16);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, vy: -42, t: 0, life: 0.7,
      text: text, rgb: rgb, gold: !!gold, size: gold ? 18 : 14
    });
    capArr(floats, 18);
  }

  function hitStop(t) {
    if (G.mode !== 'play') return;
    G.stop = Math.max(G.stop, REDUCE ? t * 0.28 : t);
  }

  function kick(n) {
    G.shake = Math.max(G.shake, n);
    if (!REDUCE) G.punch = Math.min(1.07, Math.max(G.punch, 1 + n * 0.004));
    if (!stageEl) return;
    kickTok += 1;
    const tok = kickTok;
    const cls = n >= 10 ? 'die' : n >= 6 ? 'warp' : 'hit';
    stageEl.classList.remove('die', 'hit', 'warp');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    setTimeout(function () {
      if (tok === kickTok && stageEl) stageEl.classList.remove(cls);
    }, n >= 10 ? 340 : 180);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a);
    G.flashRgb = rgb;
  }

  function enemyRgb(type) {
    if (type === 'tank') return CYN;
    if (type === 'fuse') return GOLD;
    if (type === 'spiker') return LIME;
    if (type === 'dart') return ORG;
    return MAG;
  }

  function enemyPos(e) {
    if (e.type === 'fuse') return projectLane(e.rail, 0, e.depth);
    const t = e.state === 'flip' ? wrap(e.pos) - Math.floor(wrap(e.pos)) : 0.5;
    const lane = e.state === 'flip' ? Math.floor(wrap(e.pos)) : e.lane;
    return projectLane(lane, e.state === 'flip' ? t : 0.5, e.depth);
  }

  function crawlSpeed(type) {
    const lv = G.level;
    let v = 0.148 + (lv - 1) * 0.026 + (isCore() ? 0.04 : 0);
    if (G.phase === 'boss') v *= 1.12;
    if (type === 'tank') v *= 0.7;
    if (type === 'fuse') v *= 0.86;
    if (type === 'spiker') v *= 0.82;
    if (type === 'dart') v *= 1.55;
    return v;
  }

  function rimSpeed(type) {
    const n = laneCount();
    const ang = 3.2 + G.level * 0.16 + (isCore() ? 0.45 : 0);
    let lanes = ang * n / TAU;
    if (type === 'fuse') lanes *= 1.5;
    return lanes;
  }

  function maxLive() {
    return isCore() ? 14 : 11;
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
      state: type === 'spiker' ? 'plant' : 'crawl',
      warned: false,
      pulse: rand(0, TAU),
      rgb: enemyRgb(type)
    };
    if (type === 'fuse') e.depth = 0.04;
    if (type === 'dart') e.depth = 0.06;
    return e;
  }

  function ensureSpikes() {
    const n = laneCount();
    while (G.spikes.length < n) G.spikes.push(0);
    if (G.spikes.length > n) G.spikes.length = n;
  }

  function plantSpike(lane, h) {
    ensureSpikes();
    const i = wrap(lane);
    G.spikes[i] = Math.max(G.spikes[i] || 0, clamp(h, 0, 0.92));
  }

  function cutSpike(lane, amt) {
    ensureSpikes();
    const i = wrap(lane);
    const was = G.spikes[i] || 0;
    if (was <= 0.02) return 0;
    G.spikes[i] = Math.max(0, was - amt);
    return was - G.spikes[i];
  }

  function spikeOn(lane) {
    ensureSpikes();
    return G.spikes[wrap(lane)] || 0;
  }

  function anySpikes() {
    ensureSpikes();
    for (let i = 0; i < G.spikes.length; i++) {
      if (G.spikes[i] > 0.08) return true;
    }
    return false;
  }

  function buildWave(lv) {
    const q = [];
    let nFlip = Math.min(18, 6 + lv * 2);
    let nTank = lv === 1 ? 0 : Math.min(7, lv);
    let nSpike = Math.min(8, 1 + lv);
    let nFuse = lv < 3 ? 0 : Math.min(5, lv - 1);
    if (isCore()) {
      nFlip += 2;
      nTank += lv >= 2 ? 1 : 0;
      nSpike += 1;
      if (lv >= 2) nFuse += 1;
    }
    const bag = [];
    for (let i = 0; i < nFlip; i++) bag.push('flip');
    for (let i = 0; i < nTank; i++) bag.push('tank');
    for (let i = 0; i < nSpike; i++) bag.push('spiker');
    for (let i = 0; i < nFuse; i++) bag.push('fuse');
    for (let i = bag.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = bag[i];
      bag[i] = bag[j];
      bag[j] = t;
    }
    let delay = 0.1;
    const gap = Math.max(0.16, 0.58 - lv * 0.04) * (isCore() ? 0.82 : 1);
    for (let i = 0; i < bag.length; i++) {
      q.push({ type: bag[i], wait: delay });
      delay = gap * rand(0.7, 1.16);
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
    spark(p.x, p.y, rgb, 16 + e.depth * 10);
    ring(p.x, p.y, rgb, 6 + e.depth * 8);
    if (e.type === 'spiker') plantSpike(e.lane, e.depth);
    if (G.mode === 'play') {
      bumpCombo();
      const pts = Math.round((SCORE[e.type] || 80) * G.mult);
      addScore(pts);
      floatText(p.x, p.y - 8, '+' + pts, rgb, G.mult >= 3);
      audio.hit(e.type, G.combo);
    }
    hitStop(zapped ? 0.032 : (e.type === 'fuse' ? 0.07 : 0.048));
    kick(zapped ? 3 : (4 + Math.min(6, G.combo)));
    screenFlash(rgb, zapped ? 0.18 : 0.3);
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
    if (G.phase === 'warp') return;
    if (overlayOpen() && G.mode !== 'title') return;
    if (G.fireCd > 0) return;
    const lane = playerLane();
    let nSame = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].lane === lane) nSame += 1;
    }
    if (nSame >= 1) return;
    if (G.shots.length >= MAX_SHOTS) return;
    G.fireCd = FIRE_CD;
    G.muzzle = 0.08;
    G.shots.push({
      lane: lane,
      pos: G.pos,
      depth: playerDepth() - 0.04,
      trail: []
    });
    if (G.mode === 'play') audio.shoot();
    const p = projectLane(lane, 0.5, playerDepth() - 0.02);
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
    if (G.phase === 'dive' || G.phase === 'warp') return;
    if (!G.zap) {
      audio.zapDry();
      toast('超闪已用', true, false);
      return;
    }
    G.zap = false;
    audio.zap();
    hitStop(0.074);
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
    if (G.phase === 'boss' && G.bossHp > 0) {
      const dmg = isCore() ? 5 : 6;
      hurtBoss(dmg, true);
    }
    toast('超闪', false, true);
    syncZapUi();
  }

  function killPlayer(why) {
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
    const p = projectLane(G.pos, 0.5, playerDepth());
    emit(28, {
      x: p.x, y: p.y,
      vx0: -280, vx1: 280, vy0: -300, vy1: 180,
      life: 0.85, r0: 1.4, r1: 4.2, rgb: GOLD, g: 160
    });
    spark(p.x, p.y, GOLD, 28);
    ring(p.x, p.y, MAG, 12);
    toast(G.lives > 0 ? (why || '管沿击穿') : '管裂了', true, false);
    syncHud();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why;
    G.fireHold = false;
    audio.lose();
    saveBest();
    const web = webOf();
    showOverlay('lose', why, web.name + ' · 分数 ' + G.score);
    syncHud();
  }

  function winRun() {
    G.mode = 'win';
    G.fireHold = false;
    const bonus = isCore() ? 12000 : 8000;
    addScore(bonus);
    audio.win();
    hitStop(0.1);
    screenFlash(GOLD, 0.7);
    kick(10);
    saveBest();
    showOverlay('win', '钉心粉碎', (isCore() ? '核管通关' : '风暴通关') + ' · 分数 ' + G.score);
    syncHud();
  }

  function startLevel(lv, asBoss) {
    G.level = lv;
    G.phase = asBoss ? 'boss' : 'fight';
    G.zap = true;
    G.queue = asBoss ? [] : buildWave(lv);
    G.spawnT = 0;
    G.clearT = 0;
    G.ready = 0.42;
    G.shots = [];
    G.diveDepth = 1.02;
    G.pulseLanes = [];
    G.pulseT = 1.6;
    G.pulseOn = 0;
    G.dartT = 1.1;
    G.summonT = 1.8;
    G.pos = wrap(G.pos);
    ensureSpikes();
    for (let i = 0; i < G.spikes.length; i++) G.spikes[i] = 0;
    refreshWebColor();
    if (asBoss) {
      G.bossMax = isCore() ? 24 : 16;
      G.bossHp = G.bossMax;
      G.bossT = 0;
      G.bossFlash = 0;
    }
    syncZapUi();
  }

  function beginDive() {
    G.phase = 'dive';
    G.diveDepth = 1.02;
    G.diveSpd = 0.46 + G.level * 0.018 + (isCore() ? 0.06 : 0);
    G.shots = [];
    G.enemies = [];
    G.queue = [];
    G.invuln = 0.18;
    audio.dive();
    hitStop(0.05);
    kick(6);
    screenFlash(CYN, 0.35);
    toast('扎管 · 削钉', false, true);
    if (stageEl) {
      stageEl.classList.remove('warp');
      void stageEl.offsetWidth;
      stageEl.classList.add('warp');
    }
    syncHud();
  }

  function beginWarp(nextBoss) {
    G.phase = 'warp';
    G.warpT = 0.72;
    G.warpBoss = !!nextBoss;
    G.shots = [];
    audio.wave();
    screenFlash(GOLD, 0.42);
    kick(6);
    const bonus = 300 * G.level;
    addScore(bonus);
    floatText(CX, CY, '+' + bonus, GOLD, true);
    toast(nextBoss ? '钉心现身' : (WEBS[G.level] ? WEBS[G.level].name : '下一管'), false, true);
    syncHud();
  }

  function levelClear() {
    if (anySpikes()) beginDive();
    else beginWarp(G.level >= 5);
  }

  function finishDive() {
    const bonus = 200 + G.level * 40;
    addScore(bonus);
    if (G.bossHp <= 0 && webOf().boss) {
      winRun();
      return;
    }
    beginWarp(G.level >= 5);
  }

  function hurtBoss(n, zapped) {
    if (G.bossHp <= 0) return;
    G.bossHp = Math.max(0, G.bossHp - n);
    G.bossFlash = 0.16;
    const p = project(0, 0, 0.08);
    burst(p.x, p.y, zapped ? WHT : MAG, zapped ? 22 : 14, 260);
    spark(p.x, p.y, GOLD, 22);
    ring(p.x, p.y, MAG, 14);
    bumpCombo();
    const pts = Math.round(80 * n * G.mult);
    addScore(pts);
    floatText(p.x, p.y - 6, '+' + pts, GOLD, true);
    audio.hit('boss', G.combo);
    hitStop(zapped ? 0.06 : 0.052);
    kick(zapped ? 8 : 5);
    screenFlash(MAG, zapped ? 0.4 : 0.28);
    if (G.bossHp <= 0) {
      toast('钉心崩裂', false, true);
      ensureSpikes();
      const nL = laneCount();
      for (let i = 0; i < nL; i++) {
        if (i % 2 === 0) G.spikes[i] = Math.max(G.spikes[i], 0.42 + Math.random() * 0.28);
      }
      G.enemies = [];
      G.queue = [];
      beginDive();
    }
  }

  function resetRun(kind) {
    G.kind = kind === 'core' ? 'core' : 'storm';
    G.score = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.next1up = 20000;
    G.pos = 0;
    G.shots = [];
    G.enemies = [];
    G.queue = [];
    G.spikes = [];
    G.deadT = 0;
    G.invuln = 0.65;
    G.fireCd = 0;
    G.fireHold = false;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.why = '';
    G.bossHp = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    bolts.length = 0;
    startLevel(1, false);
    if (scoreEl) scoreEl.textContent = '0';
  }

  function startGame(kind) {
    audio.start();
    resetRun(kind);
    G.mode = 'play';
    hideOverlay();
    toast((isCore() ? '核管' : '风暴') + ' · ' + webOf().name, false, true);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'storm';
    G.phase = 'fight';
    G.level = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.pos = 0;
    G.deadT = 0;
    G.invuln = 99;
    G.fireHold = false;
    G.zap = true;
    G.shots = [];
    G.enemies = [];
    G.spikes = [];
    G.queue = buildWave(1);
    G.spawnT = 0.2;
    G.ready = 0;
    G.warpT = 0;
    G.bossHp = 0;
    refreshWebColor();
    showOverlay('title', '风暴', '骑在管沿向内开火。清关后扎进钉管。最后是钉心。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('storm');
    else startGame(G.kind);
  }

  function contactHits(e) {
    if (!e.alive) return false;
    if (G.phase === 'dive') {
      if (Math.abs(e.depth - G.diveDepth) > 0.06) return false;
    } else if (e.depth < 0.9) return false;
    const pl = G.pos;
    if (e.type === 'fuse') {
      const r = wrap(e.rail);
      return laneDist(pl, r) < 0.62 || laneDist(pl, wrap(r - 1)) < 0.62;
    }
    const lane = e.state === 'flip' ? e.pos : e.lane;
    return laneDist(pl, lane) < 0.48 && (G.phase === 'dive' || e.depth >= 0.94);
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
      if (e.type === 'spiker' && e.state === 'plant') {
        e.depth += crawlSpeed('spiker') * dt;
        plantSpike(e.lane, e.depth);
        if (e.depth >= 0.58 + (isCore() ? 0.08 : 0)) {
          e.state = 'retreat';
        }
        continue;
      }
      if (e.type === 'spiker' && e.state === 'retreat') {
        e.depth -= crawlSpeed('spiker') * 1.15 * dt;
        if (e.depth <= 0.02) e.alive = false;
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
          if (e.type === 'dart') {
            killPlayer('钉矢刺中');
            e.alive = false;
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
        const sp = spikeOn(s.lane);
        if (sp > 0.06 && s.depth <= sp && s.depth >= sp - 0.08) {
          const cut = cutSpike(s.lane, 0.2);
          if (cut > 0 && G.mode === 'play') {
            bumpCombo();
            const pts = Math.round(20 * G.mult);
            addScore(pts);
            const p = projectLane(s.lane, 0.5, sp);
            burst(p.x, p.y, LIME, 8, 180);
            spark(p.x, p.y, GOLD, 10);
            floatText(p.x, p.y - 6, '+' + pts, LIME, G.mult >= 3);
            audio.spike();
            hitStop(0.034);
            kick(3);
          }
          dead = true;
          break;
        }
        if (s.depth < 0.04) {
          if (G.phase === 'boss' && G.bossHp > 0) {
            hurtBoss(1, false);
            dead = true;
            break;
          }
          dead = true;
          if (G.mode === 'play' && G.phase !== 'boss') {
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
        const p = projectLane(s.lane, 0.5, s.depth);
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
    const angSpd = isCore() ? 5.2 : 4.7;
    const laneSpd = angSpd * n / TAU;
    if (keys.l || keys.r) {
      inputSrc = 'key';
      const dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      G.pos = wrap(G.pos + dir * laneSpd * dt);
    } else if ((pointer.down || (pointer.hover && inputSrc === 'ptr')) && inputSrc === 'ptr') {
      const t = pointerPosToLane();
      if (t != null) {
        const d = wrapDelta(G.pos, t);
        const max = laneSpd * 1.85 * dt;
        if (Math.abs(d) <= max) G.pos = wrap(t);
        else G.pos = wrap(G.pos + (d < 0 ? -max : max));
      }
    }
  }

  function demoThink(dt) {
    let target = G.pos;
    let best = -1;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const threat = e.depth;
      if (threat > best) {
        best = threat;
        target = e.type === 'fuse' ? wrap(e.rail - 0.5) : e.lane + 0.5;
      }
    }
    const d = wrapDelta(G.pos, target);
    const spd = 5.4 * laneCount() / TAU;
    const step = spd * dt;
    if (Math.abs(d) <= step) G.pos = wrap(target);
    else G.pos = wrap(G.pos + (d < 0 ? -step : step));
    if (best > 0.1 && Math.abs(wrapDelta(G.pos, target)) < 0.4) fire();
  }

  function tickBoss(dt) {
    if (G.phase !== 'boss' || G.bossHp <= 0) return;
    G.bossT += dt;
    G.bossFlash = Math.max(0, G.bossFlash - dt);
    const n = laneCount();
    const reach = 0.38 + (1 - G.bossHp / G.bossMax) * 0.34 + (isCore() ? 0.08 : 0);
    for (let i = 0; i < n; i++) {
      const wave = 0.5 + 0.5 * Math.sin(G.bossT * (1.7 + (isCore() ? 0.4 : 0)) + i * 0.7);
      const h = 0.18 + reach * wave;
      if (wave > 0.82) plantSpike(i, h);
      else if ((G.spikes[i] || 0) > h + 0.12) G.spikes[i] = lerp(G.spikes[i], h, dt * 1.6);
    }
    G.pulseT -= dt;
    if (G.pulseT <= 0) {
      G.pulseLanes = [];
      const count = isCore() ? 3 : 2;
      const start = (Math.random() * n) | 0;
      for (let k = 0; k < count; k++) G.pulseLanes.push(wrap(start + k * 3));
      G.pulseOn = 0.85;
      G.pulseT = isCore() ? 2.4 : 3.05;
      audio.pulse();
    }
    if (G.pulseOn > 0) {
      G.pulseOn -= dt;
      if (G.pulseOn > 0 && G.pulseOn < 0.38 && G.deadT <= 0 && G.invuln <= 0) {
        const pl = playerLane();
        for (let i = 0; i < G.pulseLanes.length; i++) {
          if (pl === G.pulseLanes[i]) {
            killPlayer('脉管电击');
            break;
          }
        }
      }
      if (G.pulseOn <= 0) G.pulseLanes = [];
    }
    G.dartT -= dt;
    if (G.dartT <= 0 && liveCount() < maxLive()) {
      G.enemies.push(makeEnemy('dart', pickLane()));
      G.dartT = isCore() ? 0.85 : 1.25;
    }
    G.summonT -= dt;
    if (G.summonT <= 0 && liveCount() < maxLive() - 2) {
      G.enemies.push(makeEnemy(Math.random() < 0.55 ? 'flip' : 'spiker', pickLane()));
      G.summonT = isCore() ? 1.5 : 2.1;
    }
  }

  function tickDive(dt) {
    G.diveDepth -= G.diveSpd * dt;
    if (G.deadT <= 0 && G.invuln <= 0) {
      const h = spikeOn(playerLane());
      if (h > 0.06 && G.diveDepth <= h + 0.03 && G.diveDepth >= h - 0.1) {
        killPlayer('钉尖刺穿');
      }
    }
    if (G.diveDepth <= 0.05 && G.deadT <= 0) {
      G.diveDepth = 0.05;
      finishDive();
    }
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    updatePlayer(dt);
    const holding = G.mode === 'play' && G.fireHold && !overlayOpen();
    if (holding) fire();

    if (G.phase === 'warp') {
      G.warpT -= dt;
      moveShots(dt);
      if (G.warpT <= 0) {
        if (G.warpBoss) startLevel(6, true);
        else startLevel(G.level + 1, false);
        G.invuln = Math.max(G.invuln, 0.4);
      }
      return;
    }

    if (G.ready > 0) {
      G.ready -= dt;
      moveShots(dt);
      return;
    }

    if (G.phase === 'dive') {
      tickDive(dt);
      moveShots(dt);
      return;
    }

    if (G.phase === 'boss') tickBoss(dt);

    G.spawnT += dt;
    spawnFromQueue();
    moveEnemies(dt);
    moveShots(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.phase !== 'dive') {
      for (let i = 0; i < G.enemies.length; i++) {
        if (contactHits(G.enemies[i])) {
          killPlayer('管沿撞击');
          break;
        }
      }
      if (G.deadT <= 0) {
        const rimSpike = spikeOn(playerLane());
        if (rimSpike >= 0.94) killPlayer('钉尖刺穿');
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
    const starSpd = G.phase === 'dive' || G.phase === 'warp' ? 1.8 : 1;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.depth += s.spd * dt * starSpd * (G.phase === 'dive' ? 2.4 : 1);
      if (s.depth > 1.08) s.depth = rand(0, 0.12);
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

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      if (!(keys.l || keys.r)) G.pos = wrap(G.pos + 0.55 * dt);
      else updatePlayer(dt);
      demoThink(dt);
      playSim(dt);
      if (liveCount() === 0 && !G.queue.length) {
        G.queue = buildWave(1);
        G.spawnT = 0.4;
      }
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      if (G.phase === 'fight' || G.phase === 'boss') {
        G.spawnT += dt * 0.4;
        spawnFromQueue();
        moveEnemies(dt * 0.55);
      }
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('管裂了');
          updateFx(dt);
          return;
        }
        G.invuln = 1.4;
        if (G.phase === 'dive') G.diveDepth = 1.02;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && G.phase === 'fight' && liveCount() === 0 && !G.queue.length && G.ready <= 0) {
      G.clearT += dt;
      if (G.clearT > 0.32) {
        G.clearT = 0;
        levelClear();
      }
    } else if (G.phase === 'fight') {
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

  function drawLetterbox() {
    ctx.fillStyle = '#04010e';
    if (ox > 0.5) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W - ox - VW * scale + 2, H);
    }
    if (oy > 0.5) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H - oy - VH * scale + 2);
    }
  }

  function drawBg() {
    const g = ctx.createRadialGradient(sx(CX), sy(CY), 8 * scale, sx(CX), sy(CY), 420 * scale);
    g.addColorStop(0, '#16082c');
    g.addColorStop(0.32, '#0a0418');
    g.addColorStop(1, '#04010e');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(CX), sy(CY), 10 * scale, sx(CX), sy(CY), 240 * scale);
    vg.addColorStop(0, rgba(G.webRgb, 0.18));
    vg.addColorStop(0.5, rgba(PUR, 0.05));
    vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const p = project(s.ang, 0.22 + s.depth * 0.2, s.depth);
      const a = s.a * (0.35 + 0.65 * s.depth);
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), (s.r * (0.5 + p.s)) * scale, 0, TAU);
      ctx.fill();
      if (!REDUCE && (G.phase === 'dive' || G.phase === 'warp' || s.depth > 0.55)) {
        const q = project(s.ang, 0.22 + s.depth * 0.2, Math.max(0, s.depth - 0.08));
        ctx.strokeStyle = rgba(s.rgb, a * 0.4);
        ctx.lineWidth = 0.8 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(q.x), sy(q.y));
        ctx.lineTo(sx(p.x), sy(p.y));
        ctx.stroke();
      }
    }
  }

  function drawWeb() {
    const n = laneCount();
    const rgb = G.webRgb;
    const pl = playerLane();
    const danger = G.mode === 'play' && (G.phase === 'dive' || G.enemies.some(function (e) {
      return e.alive && e.depth > 0.72;
    }));
    const pulse = 0.5 + 0.5 * Math.sin(G.t * (danger ? 9 : 2.2));

    for (let i = 0; i < n; i++) {
      const a = projectLane(i, 0, 0.02);
      const b = projectLane(i + 1, 0, 0.02);
      const c = projectLane(i + 1, 0, 1);
      const d = projectLane(i, 0, 1);
      const mine = wrap(i) === pl;
      const shocked = G.pulseOn > 0 && G.pulseLanes.indexOf(i) >= 0;
      fillPoly([a, b, c, d], shocked ? MAG : mine ? CYN : rgb, shocked ? 0.12 + pulse * 0.08 : mine ? 0.07 + pulse * 0.03 : 0.028);
    }

    const depths = [0.02, 0.26, 0.5, 0.74, 1];
    for (let k = 0; k < depths.length; k++) {
      const pts = ringPts(depths[k]);
      const a = 0.18 + depths[k] * 0.38;
      strokePoly(pts, danger && depths[k] > 0.7 ? MAG : rgb, 1.1 + depths[k] * 0.6, a);
    }

    for (let i = 0; i < n; i++) {
      const far = projectLane(i, 0, 0.02);
      const near = projectLane(i, 0, 1);
      const mine = wrap(i) === pl || wrap(i - 1) === pl;
      const shocked = G.pulseOn > 0 && G.pulseLanes.indexOf(i) >= 0;
      ctx.strokeStyle = rgba(shocked ? MAG : mine ? CYN : rgb, shocked ? 0.85 : mine ? 0.72 : 0.28);
      ctx.lineWidth = (shocked || mine ? 2.1 : 1.15) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(far.x), sy(far.y));
      ctx.lineTo(sx(near.x), sy(near.y));
      ctx.stroke();
    }

    const hole = ringPts(0.0);
    fillPoly(hole, [4, 1, 12], 0.72);
    strokePoly(hole, rgb, 1.4, 0.55);
  }

  function drawSpikes() {
    ensureSpikes();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < G.spikes.length; i++) {
      const h = G.spikes[i];
      if (h <= 0.04) continue;
      const far = projectLane(i, 0.5, 0.02);
      const tip = projectLane(i, 0.5, h);
      ctx.strokeStyle = rgba(LIME, 0.28);
      ctx.lineWidth = (5.2 + h * 3) * scale * (0.45 + h);
      ctx.beginPath();
      ctx.moveTo(sx(far.x), sy(far.y));
      ctx.lineTo(sx(tip.x), sy(tip.y));
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.92);
      ctx.lineWidth = (1.6 + h * 1.4) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(far.x), sy(far.y));
      ctx.lineTo(sx(tip.x), sy(tip.y));
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(sx(tip.x), sy(tip.y), (2.1 + h * 1.6) * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
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
    ctx.lineWidth = (1.5 + d) * scale;
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.4);
    ctx.lineWidth = 0.7 * scale;
    ctx.stroke();
  }

  function drawSpiker(e) {
    const d = e.depth;
    const p = projectLane(e.lane, 0.5, d);
    const s = 7 + d * 8;
    const spin = e.pulse;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.rotate(spin);
    ctx.strokeStyle = rgba(LIME, 0.95);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(-s * scale, 0);
    ctx.lineTo(s * scale, 0);
    ctx.moveTo(0, -s * scale);
    ctx.lineTo(0, s * scale);
    ctx.stroke();
    ctx.restore();
  }

  function drawFuse(e) {
    const p = projectLane(e.rail, 0, e.depth);
    const throb = 0.75 + 0.25 * Math.sin(e.pulse);
    const r = (5 + e.depth * 7) * throb;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(GOLD, 0.2);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), r * 1.8 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(ORG, 0.9);
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), r * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.beginPath();
    ctx.arc(sx(p.x - 1.2), sy(p.y - 1.4), r * 0.35 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawDart(e) {
    const d = e.depth;
    const tip = projectLane(e.lane, 0.5, Math.min(1.05, d + 0.05));
    const L = projectLane(e.lane, 0.28, Math.max(0.01, d - 0.04));
    const R = projectLane(e.lane, 0.72, Math.max(0.01, d - 0.04));
    ctx.fillStyle = rgba(ORG, 0.95);
    ctx.beginPath();
    ctx.moveTo(sx(tip.x), sy(tip.y));
    ctx.lineTo(sx(L.x), sy(L.y));
    ctx.lineTo(sx(R.x), sy(R.y));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
  }

  function drawEnemy(e) {
    if (!e.alive) return;
    if (e.type === 'flip') drawFlipper(e);
    else if (e.type === 'tank') drawTanker(e);
    else if (e.type === 'spiker') drawSpiker(e);
    else if (e.type === 'fuse') drawFuse(e);
    else drawDart(e);
  }

  function drawEnemies() {
    const list = G.enemies.slice();
    list.sort(function (a, b) { return a.depth - b.depth; });
    for (let i = 0; i < list.length; i++) drawEnemy(list[i]);
  }

  function drawBoss() {
    if (G.phase !== 'boss') return;
    const p = project(G.t * 0.4, 0.15, 0.06);
    const flash = G.bossFlash > 0;
    const rgb = flash ? WHT : MAG;
    const beat = 10 + 6 * Math.sin(G.t * 5.2) + (1 - G.bossHp / Math.max(1, G.bossMax)) * 8;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grd = ctx.createRadialGradient(sx(p.x), sy(p.y), 2 * scale, sx(p.x), sy(p.y), beat * 2.2 * scale);
    grd.addColorStop(0, rgba(WHT, 0.95));
    grd.addColorStop(0.35, rgba(rgb, 0.85));
    grd.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), beat * 2.2 * scale, 0, TAU);
    ctx.fill();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.rotate(G.t * 0.8);
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 2.2 * scale;
    const arms = 8;
    for (let i = 0; i < arms; i++) {
      const a = (i / arms) * TAU;
      const len = (16 + 10 * Math.sin(G.t * 3 + i)) * scale;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 6 * scale, Math.sin(a) * 6 * scale);
      ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.restore();

    const ratio = G.bossHp / Math.max(1, G.bossMax);
    const bx = sx(CX - 90);
    const by = sy(28);
    ctx.fillStyle = rgba([20, 8, 28], 0.7);
    ctx.fillRect(bx, by, 180 * scale, 8 * scale);
    ctx.fillStyle = rgba(ratio < 0.35 ? MAG : GOLD, 0.9);
    ctx.fillRect(bx, by, 180 * ratio * scale, 8 * scale);
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, 180 * scale, 8 * scale);
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const p = projectLane(s.lane, 0.5, s.depth);
      const q = projectLane(s.lane, 0.5, Math.min(playerDepth(), s.depth + 0.08));
      if (!REDUCE && s.trail && s.trail.length > 1) {
        ctx.strokeStyle = rgba(CYN, 0.22);
        ctx.lineWidth = 4 * scale * p.s;
        ctx.beginPath();
        ctx.moveTo(sx(s.trail[0].x), sy(s.trail[0].y));
        for (let t = 1; t < s.trail.length; t++) ctx.lineTo(sx(s.trail[t].x), sy(s.trail[t].y));
        ctx.stroke();
      }
      ctx.strokeStyle = rgba(WHT, 0.95);
      ctx.lineWidth = 2.1 * scale * p.s;
      ctx.beginPath();
      ctx.moveTo(sx(q.x), sy(q.y));
      ctx.lineTo(sx(p.x), sy(p.y));
      ctx.stroke();
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 2.3 * scale * p.s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.invuln * 18) | 0) % 2 === 0) return;
    const lane = playerLane();
    const d = playerDepth();
    const L = projectLane(lane, 0.08, d);
    const R = projectLane(lane, 0.92, d);
    const tip = projectLane(lane, 0.5, d - 0.12);
    const mid = projectLane(lane, 0.5, d);
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 2.6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(L.x), sy(L.y));
    ctx.lineTo(sx(tip.x), sy(tip.y));
    ctx.lineTo(sx(R.x), sy(R.y));
    ctx.stroke();
    const L2 = projectLane(lane, 0.22, d + 0.01);
    const R2 = projectLane(lane, 0.78, d + 0.01);
    const tip2 = projectLane(lane, 0.5, d - 0.07);
    ctx.strokeStyle = rgba(CYN, 0.9);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(L2.x), sy(L2.y));
    ctx.lineTo(sx(tip2.x), sy(tip2.y));
    ctx.lineTo(sx(R2.x), sy(R2.y));
    ctx.stroke();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 10);
      ctx.beginPath();
      ctx.arc(sx(tip.x), sy(tip.y), (4 + G.muzzle * 40) * scale, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.arc(sx(mid.x), sy(mid.y), 2.2 * scale, 0, TAU);
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
      ctx.strokeStyle = rgba(s.rgb, 1 - k);
      ctx.lineWidth = (2.4 - k * 1.6) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad || 16) * k * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.36;
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - k));
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + k * 28) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = '700 ' + ((f.size || 14) * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#04010e';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (!REDUCE && G.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * G.shake * 0.55, (Math.random() - 0.5) * G.shake * 0.55);
    }
    if (!REDUCE && G.punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    drawBg();
    drawStars();
    drawWeb();
    drawSpikes();
    drawBolts();
    drawEnemies();
    drawBoss();
    drawShots();
    drawShip();
    drawParticles();
    drawFlash();
    ctx.restore();
    drawLetterbox();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function eventToVirt(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left - ox) / scale,
      y: (e.clientY - r.top - oy) / scale
    };
  }

  function isMoveLeft(code) {
    return code === 'ArrowLeft' || code === 'ArrowUp' || code === 'KeyA' || code === 'KeyW';
  }
  function isMoveRight(code) {
    return code === 'ArrowRight' || code === 'ArrowDown' || code === 'KeyD' || code === 'KeyS';
  }

  function onKey(e, down) {
    const c = e.code;
    if (isMoveLeft(c)) {
      keys.l = down;
      if (down) inputSrc = 'key';
      e.preventDefault();
      return;
    }
    if (isMoveRight(c)) {
      keys.r = down;
      if (down) inputSrc = 'key';
      e.preventDefault();
      return;
    }
    if (c === 'Space') {
      e.preventDefault();
      if (down) {
        audio.ensure();
        if (overlayOpen() && (G.mode === 'title' || G.mode === 'lose' || G.mode === 'win')) return;
        G.fireHold = true;
        fire();
      } else {
        G.fireHold = false;
      }
      return;
    }
    if (!down) return;
    if (c === 'KeyR') {
      e.preventDefault();
      restart();
      return;
    }
    if (c === 'KeyM') {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (c === 'KeyZ' || c === 'ShiftLeft' || c === 'ShiftRight') {
      e.preventDefault();
      audio.ensure();
      doZap();
      return;
    }
    if (c === 'Enter' || c === 'Digit1' || c === 'Numpad1') {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title') startGame('storm');
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      return;
    }
    if (c === 'Digit2' || c === 'Numpad2') {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title') startGame('core');
      else if (G.mode === 'win' && !isCore()) startGame('core');
      else if (G.mode === 'lose' || G.mode === 'win') goTitle();
      return;
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      const v = eventToVirt(e);
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = v.x;
      pointer.y = v.y;
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const v = eventToVirt(e);
      pointer.x = v.x;
      pointer.y = v.y;
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

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      startGame('storm');
    });
  }
  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
    });
  }
  if (ovRetry) {
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovModes) {
    ovModes.addEventListener('click', function () {
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
