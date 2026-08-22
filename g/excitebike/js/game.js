'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const GX = 8;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const WHEEL = 9;
  const GRAV = 860;
  const TILT = 3.55;
  const BEST_KEY = 'playbox-excitebike-best';
  const MUTE_KEY = 'playbox-excitebike-mute';
  const OPS = '→ D 油门 · ← A 刹车 · ↑↓ 空中摆车 · 空格涡轮 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const SUN = [255, 74, 24];
  const HOT = [255, 122, 58];
  const COR = [255, 58, 50];
  const WHT = [255, 242, 232];
  const DIRT = [168, 92, 42];
  const DIRT2 = [210, 130, 64];
  const MUDC = [62, 36, 28];

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
  const btnTrack = document.getElementById('btn-track');
  const btnFever = document.getElementById('btn-fever');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const timeEl = document.getElementById('time');
  const spdEl = document.getElementById('spd');
  const scoreBox = document.getElementById('score-box');
  const timeBox = document.getElementById('time-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const placeLabel = document.getElementById('place-label');
  const comboEl = document.getElementById('combo-label');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const heatBar = document.getElementById('heat-bar');
  const heatWrap = document.getElementById('heat-wrap');
  const padsEl = document.getElementById('pads');
  const padBrake = document.getElementById('pad-brake');
  const padUp = document.getElementById('pad-up');
  const padDown = document.getElementById('pad-down');
  const padGas = document.getElementById('pad-gas');
  const padTurbo = document.getElementById('pad-turbo');

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
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false, turbo: false };
  const pointer = { down: false, hover: false, x: VW * 0.4, y: VH * 0.6, id: null };
  const pads = { l: false, r: false, u: false, d: false, turbo: false };
  const particles = [];
  const floats = [];
  const stars = [];
  const flags = [];

  let heights = [];
  let mud = [];
  let trackLen = 5200;
  let finishX = 5000;

  const G = {
    mode: 'title',
    kind: 'track',
    t: 0,
    clock: 0,
    score: 0,
    best: { y: 0, f: 0 },
    time: 48,
    timeCap: 48,
    combo: 0,
    comboT: 0,
    distMark: 0,
    place: 1,
    camX: 0,
    camY: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    ending: '',
    why: '',
    kmh: 0,
    goT: 0,
    didAir: false
  };

  const player = makeBike(true, 0, SUN, [255, 70, 48]);
  const cpus = [];

  function makeBike(isP, lane, col, body) {
    return {
      x: 80,
      y: 300,
      vx: 0,
      vy: 0,
      pitch: 0,
      air: false,
      airT: 0,
      heat: 0,
      crashT: 0,
      squash: 0,
      spin: 0,
      col: col,
      body: body || col,
      lane: lane,
      isP: isP,
      turbo: false,
      gas: false,
      brake: false,
      tilt: 0,
      agr: 0.62,
      passed: false,
      dust: 0,
      recov: 0
    };
  }

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function wrapAng(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function lerpAng(a, b, t) {
    return a + wrapAng(b - a) * t;
  }
  function rgba(rgb, a) {
    if (a == null || a >= 0.995) return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function isFever() {
    return G.kind === 'fever';
  }
  function kindBest() {
    return isFever() ? G.best.f : G.best.y;
  }
  function maxSpd() {
    return isFever() ? 470 : 392;
  }
  function accelAmt() {
    return isFever() ? 305 : 268;
  }
  function turboAmt() {
    return isFever() ? 310 : 248;
  }
  function heatRate() {
    return isFever() ? 0.46 : 0.28;
  }
  function coolRate() {
    return isFever() ? 0.11 : 0.17;
  }
  function startTime() {
    return isFever() ? 38 : 48;
  }
  function crashAng() {
    return isFever() ? 0.38 : 0.5;
  }
  function scoreMul() {
    return isFever() ? 1.35 : 1;
  }

  function wx(x) {
    return ox + (x - G.camX) * scale;
  }
  function wy(y) {
    return oy + (y - G.camY) * scale;
  }

  function groundY(x) {
    if (!heights.length) return 320;
    if (x <= 0) return heights[0];
    const i = x / GX;
    const i0 = i | 0;
    if (i0 >= heights.length - 1) return heights[heights.length - 1];
    const t = i - i0;
    return heights[i0] + (heights[i0 + 1] - heights[i0]) * t;
  }
  function groundSlope(x) {
    const d = 12;
    return Math.atan2(groundY(x + d) - groundY(x - d), d * 2);
  }
  function inMud(x) {
    for (let i = 0; i < mud.length; i++) {
      if (x >= mud[i].a && x <= mud[i].b) return true;
    }
    return false;
  }

  function interpPts(pts, x) {
    if (x <= pts[0].x) return pts[0].y;
    const last = pts[pts.length - 1];
    if (x >= last.x) return last.y;
    let lo = 0;
    let hi = pts.length - 1;
    while (lo < hi - 1) {
      const m = (lo + hi) >> 1;
      if (pts[m].x <= x) lo = m;
      else hi = m;
    }
    const a = pts[lo];
    const b = pts[hi];
    const t = (x - a.x) / (b.x - a.x || 1);
    return a.y + (b.y - a.y) * t;
  }

  function buildTrack() {
    const pts = [];
    let x = 0;
    let y = 322;
    const hMul = isFever() ? 1.14 : 1;
    mud = [];
    flags.length = 0;

    function push(nx, ny) {
      x = nx;
      y = clamp(ny, 168, 400);
      pts.push({ x: x, y: y });
    }
    push(0, y);

    function line(dx, dy) {
      const n = Math.max(1, Math.round(Math.abs(dx) / GX));
      const x0 = x;
      const y0 = y;
      for (let i = 1; i <= n; i++) push(x0 + dx * (i / n), y0 + dy * (i / n));
    }
    function ease(dx, dy) {
      const n = Math.max(1, Math.round(Math.abs(dx) / GX));
      const x0 = x;
      const y0 = y;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const s = t * t * (3 - 2 * t);
        push(x0 + dx * t, y0 + dy * s);
      }
    }
    function whoops(n, span, amp) {
      const x0 = x;
      const y0 = y;
      const total = n * span;
      const steps = Math.max(1, Math.round(total / GX));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const w = Math.sin(t * n * Math.PI * 2) * amp * hMul;
        push(x0 + total * t, y0 - Math.abs(w) * 0.22 - w * 0.85);
      }
    }
    function table(up, top, down, rise) {
      ease(up, -rise * hMul);
      line(Math.max(24, top * 0.45), 0);
      line(18, rise * hMul * 0.42);
      ease(Math.max(40, down - 18), rise * hMul * 0.58);
    }
    function markFlag(kind) {
      flags.push({ x: x, y: y, k: kind });
    }

    line(360, 0);
    markFlag('gate');
    line(80, 0);
    whoops(3, 64, 14);
    line(70, 0);
    markFlag('ramp');
    table(150, 70, 130, 78);
    line(110, 0);
    const m0 = x;
    line(260, 8);
    mud.push({ a: m0, b: x });
    markFlag('mud');
    line(90, 0);
    ease(210, -52 * hMul);
    markFlag('ramp');
    ease(70, -36 * hMul);
    ease(160, 88 * hMul);
    line(80, 0);
    whoops(4, 58, 18);
    line(90, 0);
    markFlag('ramp');
    table(180, 96, 150, 102);
    line(70, 0);
    ease(280, 46);
    line(60, 0);
    markFlag('ramp');
    ease(120, -88 * hMul);
    ease(50, 0);
    ease(100, 40 * hMul);
    ease(90, -70 * hMul);
    ease(140, 118 * hMul);
    line(80, 0);
    const m1 = x;
    line(220, 10);
    mud.push({ a: m1, b: x });
    markFlag('mud');
    line(70, 0);
    whoops(3, 72, 20);
    line(80, 0);
    markFlag('ramp');
    table(200, 60, 180, 118);
    line(140, 0);
    markFlag('goal');
    line(220, 0);

    trackLen = pts[pts.length - 1].x;
    finishX = flags.length ? flags[flags.length - 1].x : trackLen - 180;
    const n = Math.ceil(trackLen / GX) + 2;
    heights = new Array(n);
    for (let i = 0; i < n; i++) heights[i] = interpPts(pts, i * GX);

    stars.length = 0;
    for (let i = 0; i < 48; i++) {
      stars.push({
        x: hash2(i * 13 + 4) * 900,
        y: hash2(i * 29 + 7) * 160,
        r: 0.6 + hash2(i * 5) * 1.4,
        a: 0.25 + hash2(i * 11) * 0.55
      });
    }
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    eng: null,
    eng2: null,
    eng3: null,
    engG: null,
    engF: null,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startEngine();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
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
    noise(dur, vol, hp, delay) {
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
      f.frequency.value = hp || 700;
      const g = this.ctx.createGain();
      const t = this.ctx.currentTime + (delay || 0);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    startEngine() {
      if (!this.ctx || this.eng) return;
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      const o2 = this.ctx.createOscillator();
      o2.type = 'square';
      const o3 = this.ctx.createOscillator();
      o3.type = 'triangle';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 880;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      o.connect(f);
      o2.connect(f);
      o3.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start();
      o2.start();
      o3.start();
      this.eng = o;
      this.eng2 = o2;
      this.eng3 = o3;
      this.engG = g;
      this.engF = f;
    },
    tickEngine(spd01, on, turbo, heat) {
      if (!this.engG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on) {
        this.engG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const pulse = Math.sin(G.t * (16 + spd01 * 28)) * (4 + spd01 * 12);
      const f = 62 + spd01 * 188 + pulse + (turbo ? 36 : 0);
      this.eng.frequency.setTargetAtTime(f, t, 0.04);
      this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.04);
      this.eng3.frequency.setTargetAtTime(f * 2.02, t, 0.04);
      this.engF.frequency.setTargetAtTime(380 + spd01 * 1500 + (turbo ? 280 : 0), t, 0.07);
      const crashMul = player.crashT > 0 ? 0.28 : 1;
      const hotMul = heat > 0.82 ? 0.7 : 1;
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.024 + spd01 * 0.068 + (turbo ? 0.018 : 0)) * crashMul * hotMul, t, 0.05);
    },
    sting() {
      this.beep(392, 0.08, 'square', 0.07, 784);
      this.beep(523, 0.12, 'triangle', 0.05);
      this.beep(784, 0.16, 'square', 0.045);
    },
    land(perfect) {
      this.noise(0.07, 0.045, 420);
      if (perfect) {
        this.beep(659, 0.08, 'square', 0.06, 880);
        this.beep(880, 0.12, 'triangle', 0.05, 1175);
        this.beep(1175, 0.16, 'sine', 0.04);
      } else {
        this.beep(392, 0.07, 'square', 0.05, 523);
        this.beep(523, 0.1, 'triangle', 0.04);
      }
    },
    rough() {
      this.noise(0.1, 0.05, 280);
      this.beep(180, 0.12, 'sawtooth', 0.045, 90);
    },
    crash() {
      this.noise(0.28, 0.26, 220);
      this.beep(160, 0.24, 'sawtooth', 0.12, 48);
      this.beep(90, 0.32, 'square', 0.06, 40);
    },
    overheat() {
      this.beep(880, 0.08, 'square', 0.08, 220);
      this.beep(440, 0.16, 'sawtooth', 0.07, 90);
      this.noise(0.18, 0.12, 300);
    },
    overtake(n) {
      const f = 440 + Math.min(8, n) * 58;
      this.beep(f, 0.08, 'square', 0.065, f * 1.75);
      this.beep(f * 0.5, 0.1, 'triangle', 0.03);
    },
    warn() {
      this.beep(880, 0.08, 'square', 0.075);
      this.beep(660, 0.1, 'square', 0.05);
    },
    win() {
      this.beep(523, 0.12, 'square', 0.08);
      this.beep(659, 0.14, 'triangle', 0.07);
      this.beep(784, 0.18, 'square', 0.07);
      this.beep(1046, 0.28, 'triangle', 0.06);
    },
    lose() {
      this.beep(220, 0.3, 'sawtooth', 0.085, 70);
      this.noise(0.2, 0.12, 380);
    },
    turboPop() {
      this.beep(140, 0.05, 'sawtooth', 0.04, 280);
    }
  };

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) ovKicker.textContent = kind === 'win' ? 'GOAL' : kind === 'lose' ? 'DNF' : 'BIKE';
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function setHint(t, cls) {
    if (!hintEl) return;
    hintEl.textContent = t;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.best.y = o.y | 0;
        G.best.f = o.f | 0;
      } else {
        const n = parseInt(raw, 10);
        if (n > 0) G.best.y = n;
      }
    } catch (err) { /* ignore */ }
  }
  function maybeBest() {
    const k = isFever() ? 'f' : 'y';
    if (G.score > G.best[k]) {
      G.best[k] = G.score | 0;
      try { localStorage.setItem(BEST_KEY, JSON.stringify(G.best)); } catch (err) { /* ignore */ }
    }
  }
  function fmtTime(t) {
    const s = Math.max(0, t);
    const w = Math.floor(s);
    const d = Math.floor((s - w) * 10);
    return w + '.' + d;
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(kindBest() | 0);
    if (timeEl) timeEl.textContent = fmtTime(G.time);
    if (spdEl) spdEl.textContent = String(G.kmh | 0);
    if (stageLabel) {
      stageLabel.textContent = isFever() ? '发烧' : '越野';
      stageLabel.classList.toggle('hot', isFever());
    }
    if (placeLabel) {
      placeLabel.textContent = '名次 ' + G.place + '/5';
      placeLabel.classList.toggle('back', G.place >= 4);
    }
    if (timeBox) timeBox.classList.toggle('low', G.mode === 'play' && G.time < 8);
    if (heatBar) heatBar.style.transform = 'scaleX(' + clamp(player.heat, 0, 1) + ')';
    if (heatWrap) {
      heatWrap.classList.toggle('warm', player.heat > 0.45 && player.heat < 0.78);
      heatWrap.classList.toggle('hot', player.heat >= 0.78);
    }
    if (comboEl) {
      const show = G.mode === 'play' && G.combo > 1;
      comboEl.hidden = !show;
      if (show) comboEl.textContent = '连落 ×' + G.combo;
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'win') setHint('R 再冲 · 摆车落地冲线', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 超时没冲过终点', 'warn');
    else if (player.crashT > 0.2) setHint('摔了 · 起来接着冲', 'warn');
    else if (player.heat > 0.78) setHint('引擎要炸 · 松涡轮', 'warn');
    else if (player.air) setHint('↑ 抬头 · ↓ 压头 · 顺着坡落地', 'hot');
    else if (G.time < 8) setHint('时间将尽 · 冲终点', 'warn');
    else setHint('→ 油门 · 空格涡轮 · 空中摆车落地 · R 重开', '');
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function bumpScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n | 0;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + (n | 0);
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    maybeBest();
    hud();
  }

  function floatText(x, y, text, rgb, size) {
    floats.push({ x: x, y: y, text: text, rgb: rgb, t: 0.9, life: 0.9, size: size || 14 });
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.5, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 420 : spec.g
      });
    }
    if (particles.length > 260) particles.splice(0, particles.length - 260);
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }
  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
      }
    }, 360);
  }
  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function resetBike(b, x, spd) {
    b.x = x;
    b.y = groundY(x) - WHEEL;
    b.vx = spd || 0;
    b.vy = 0;
    b.pitch = groundSlope(x);
    b.air = false;
    b.airT = 0;
    b.heat = 0;
    b.crashT = 0;
    b.squash = 0;
    b.spin = 0;
    b.turbo = false;
    b.passed = false;
    b.recov = 0;
  }

  function placeCpus() {
    cpus.length = 0;
    const cols = [
      [70, 210, 255],
      [255, 210, 70],
      [90, 230, 140],
      [220, 90, 255]
    ];
    const bodies = [
      [40, 160, 220],
      [210, 150, 40],
      [40, 170, 90],
      [170, 60, 210]
    ];
    const lanes = [-16, -8, 10, 18];
    const agrs = [0.5, 0.68, 0.8, 0.58];
    for (let i = 0; i < 4; i++) {
      const b = makeBike(false, lanes[i], cols[i], bodies[i]);
      b.agr = agrs[i] + (isFever() ? 0.08 : 0);
      resetBike(b, 110 + i * 46, 70 + i * 12);
      cpus.push(b);
    }
  }

  function resetRunVars() {
    G.combo = 0;
    G.comboT = 0;
    G.distMark = 0;
    G.place = 5;
    G.ending = '';
    G.why = '';
    G.goT = 0;
    G.didAir = false;
    particles.length = 0;
    floats.length = 0;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'track';
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    buildTrack();
    resetBike(player, 90, maxSpd() * 0.42);
    placeCpus();
    G.camX = player.x - 220;
    G.camY = 40;
    showOverlay('title', '越野', '冲坡起飞，空中摆车落地。涡轮别过热，摔了就晚了。跟 CPU 抢终点。');
    hud();
  }

  function startGame(kind) {
    audio.ensure();
    G.kind = kind === 'fever' ? 'fever' : 'track';
    G.mode = 'play';
    G.score = 0;
    G.time = startTime();
    G.timeCap = G.time;
    resetRunVars();
    G.stop = 0;
    G.shake = 0;
    G.flash = 0.4;
    G.flashRgb = isFever() ? MAG : SUN;
    G.goT = 0.85;
    buildTrack();
    resetBike(player, 90, 48);
    placeCpus();
    G.camX = player.x - 210;
    G.camY = 36;
    hideOverlay();
    audio.sting();
    toast(isFever() ? '发烧 · 引擎更烫更快' : '越野 · 冲坡摆车', false, !isFever());
    floatText(player.x + 40, player.y - 50, 'GO', GOLD, 22);
    hud();
  }

  function placeOf(b) {
    let p = 1;
    const all = [player].concat(cpus);
    for (let i = 0; i < all.length; i++) {
      if (all[i] !== b && all[i].x > b.x + 6) p += 1;
    }
    return p;
  }

  function onOvertake(cpu) {
    if (G.mode !== 'play' || cpu.passed) return;
    cpu.passed = true;
    G.combo = Math.max(1, G.combo);
    const n = Math.round((90 + G.combo * 18) * scoreMul());
    bumpScore(n);
    floatText(cpu.x, cpu.y - 36, '超车', CYN, 15);
    audio.overtake(G.combo);
    if (G.combo >= 3) {
      hitStop(0.032);
      kick(3);
    }
    emit(10, {
      x: cpu.x, y: cpu.y - 8, j: 10,
      vx0: -80, vx1: 40, vy0: -90, vy1: 20,
      r0: 1.4, r1: 3.2, life: 0.32, rgb: cpu.col
    });
  }

  function popCombo() {
    if (!comboEl) return;
    comboEl.classList.remove('hot');
    void comboEl.offsetWidth;
    comboEl.classList.add('hot');
    comboTok += 1;
  }

  function landJuice(b, grade, diff) {
    b.squash = grade === 'crash' ? 0.9 : grade === 'perfect' ? 0.55 : 0.35;
    b.air = false;
    b.y = groundY(b.x) - WHEEL;
    b.vy = 0;
    b.pitch = lerpAng(b.pitch, groundSlope(b.x), 0.65);
    const dirt = inMud(b.x) ? MUDC : DIRT2;
    if (!b.isP) {
      emit(8, {
        x: b.x, y: b.y + 8, j: 8,
        vx0: -90, vx1: 40, vy0: -70, vy1: 10,
        r0: 1.2, r1: 2.8, life: 0.28, rgb: dirt
      });
      return;
    }
    if (grade === 'perfect') {
      G.combo += 1;
      G.comboT = 3.2;
      const n = Math.round((140 + G.combo * 40) * scoreMul());
      bumpScore(n);
      floatText(b.x, b.y - 42, G.combo > 1 ? ('连落 ×' + G.combo) : '完美', GOLD, 16);
      audio.land(true);
      hitStop(0.055);
      kick(4.2);
      screenFlash(GOLD, 0.32);
      popCombo();
      if (G.combo === 3) toast('连落 ×3', false, true);
      if (G.combo === 6) toast('连落 ×6 · 飞人', false, true);
      b.vx += 28;
      emit(22, {
        x: b.x, y: b.y + 8, j: 16,
        vx0: -160, vx1: 80, vy0: -160, vy1: 20,
        r0: 1.6, r1: 4.2, life: 0.42, rgb: GOLD, g: 280
      });
      emit(14, {
        x: b.x, y: b.y + 6, j: 10,
        vx0: -120, vx1: 20, vy0: -90, vy1: 10,
        r0: 1.4, r1: 3.4, life: 0.36, rgb: dirt
      });
    } else if (grade === 'good') {
      G.combo += 1;
      G.comboT = 2.6;
      const n = Math.round((70 + G.combo * 22) * scoreMul());
      bumpScore(n);
      floatText(b.x, b.y - 38, '稳', CYN, 14);
      audio.land(false);
      hitStop(0.038);
      kick(2.6);
      popCombo();
      emit(16, {
        x: b.x, y: b.y + 8, j: 12,
        vx0: -130, vx1: 40, vy0: -110, vy1: 16,
        r0: 1.4, r1: 3.6, life: 0.36, rgb: dirt
      });
    } else if (grade === 'rough') {
      G.combo = 0;
      b.vx *= 0.78;
      audio.rough();
      hitStop(0.028);
      kick(3.4);
      toast('歪了 · 减速', true, false);
      emit(18, {
        x: b.x, y: b.y + 6, j: 14,
        vx0: -100, vx1: 80, vy0: -80, vy1: 30,
        r0: 1.5, r1: 3.8, life: 0.4, rgb: COR
      });
    }
    void diff;
  }

  function crashBike(b, why) {
    if (b.crashT > 0.2) return;
    b.crashT = 1.32;
    b.recov = 0;
    b.vx *= 0.22;
    b.vy = -90;
    b.air = true;
    b.airT = 0;
    if (b.isP && G.mode === 'play') {
      G.combo = 0;
      audio.crash();
      hitStop(0.07);
      kick(8);
      screenFlash(MAG, 0.58);
      toast(why === 'heat' ? '过热 · 摔车' : '落地太斜 · 摔了', true, false);
      emit(32, {
        x: b.x, y: b.y, j: 22,
        vx0: -240, vx1: 240, vy0: -220, vy1: 40,
        r0: 2, r1: 6, life: 0.55, rgb: COR
      });
      emit(14, {
        x: b.x, y: b.y - 8, j: 12,
        vx0: -90, vx1: 90, vy0: -160, vy1: -20,
        r0: 1, r1: 2.6, life: 0.36, rgb: GOLD
      });
    } else {
      emit(12, {
        x: b.x, y: b.y, j: 12,
        vx0: -120, vx1: 80, vy0: -100, vy1: 20,
        r0: 1.4, r1: 3.2, life: 0.32, rgb: b.col
      });
    }
  }

  function thinkAI(b) {
    b.gas = true;
    b.brake = false;
    b.turbo = false;
    b.tilt = 0;
    if (b.crashT > 0) return;
    const sl = groundSlope(b.x);
    if (b.air) {
      let px = b.x;
      let py = b.y;
      let pvx = b.vx;
      let pvy = b.vy;
      for (let i = 0; i < 36; i++) {
        pvy += GRAV * 0.016;
        px += pvx * 0.016;
        py += pvy * 0.016;
        if (py + WHEEL >= groundY(px)) break;
      }
      const want = groundSlope(px);
      const diff = wrapAng(want - b.pitch);
      b.tilt = clamp(diff * 5.2, -1, 1);
      return;
    }
    const muddy = inMud(b.x);
    const ahead = player.x > b.x + 30;
    const behind = player.x < b.x - 80;
    const heatCap = b.agr * (ahead ? 1.12 : 0.92);
    if (!muddy && b.heat < heatCap && b.vx > 40 && !behind) b.turbo = true;
    if (muddy && b.vx > 130) b.brake = true;
    if (sl < -0.42 && b.vx > 300) b.brake = true;
  }

  function controlPlayer(b) {
    const gas = keys.r || pads.r || (pointer.down && pointer.x > VW * 0.28);
    const brake = keys.l || pads.l || (pointer.down && pointer.x <= VW * 0.28);
    const turbo = keys.turbo || pads.turbo;
    let tilt = 0;
    if (keys.u || pads.u) tilt -= 1;
    if (keys.d || pads.d) tilt += 1;
    if (pointer.down && inputSrc === 'ptr') {
      if (pointer.y < VH * 0.38) tilt -= 1;
      else if (pointer.y > VH * 0.72) tilt += 1;
    }
    b.gas = gas && !brake;
    b.brake = brake;
    b.turbo = turbo && b.gas;
    b.tilt = clamp(tilt, -1, 1);
  }

  function stepBike(b, dt) {
    if (b.squash > 0) b.squash = Math.max(0, b.squash - dt * 4.2);
    if (b.crashT > 0) {
      b.crashT -= dt;
      b.pitch += (b.isP ? 9 : 7) * dt;
      b.vy += GRAV * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const gy = groundY(b.x) - WHEEL;
      if (b.y >= gy) {
        b.y = gy;
        b.vy *= -0.25;
        b.vx *= 0.82;
        b.air = false;
        emit(4, {
          x: b.x, y: b.y + 8, j: 6,
          vx0: -50, vx1: 20, vy0: -40, vy1: 8,
          r0: 1.2, r1: 2.6, life: 0.22, rgb: DIRT
        });
      }
      if (b.crashT <= 0) {
        b.crashT = 0;
        b.pitch = groundSlope(b.x);
        b.air = false;
        b.y = groundY(b.x) - WHEEL;
        b.vx = Math.max(36, b.vx);
        b.heat = Math.min(b.heat, 0.55);
      }
      b.spin += b.vx * 0.18 * dt;
      return;
    }

    const sl = groundSlope(b.x);
    const gy = groundY(b.x) - WHEEL;
    const muddy = !b.air && inMud(b.x);
    const cap = maxSpd() * (muddy ? 0.46 : 1) * (b.isP ? 1 : 0.9 + b.agr * 0.12);

    if (b.air) {
      b.airT += dt;
      b.pitch += b.tilt * TILT * dt;
      b.pitch = clamp(b.pitch, -1.22, 1.22);
      b.vy += GRAV * dt;
      b.vx += Math.sin(b.pitch) * 18 * dt;
      b.vx = clamp(b.vx, 20, cap * 1.08);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.y >= gy) {
        const diff = Math.abs(wrapAng(b.pitch - sl));
        const longAir = b.airT > 0.2;
        if (longAir && diff > crashAng()) {
          crashBike(b, 'land');
        } else if (longAir && diff > crashAng() * 0.62) {
          landJuice(b, 'rough', diff);
        } else if (longAir && diff < 0.11) {
          landJuice(b, 'perfect', diff);
        } else if (longAir) {
          landJuice(b, 'good', diff);
        } else {
          b.air = false;
          b.y = gy;
          b.vy = 0;
          b.pitch = lerpAng(b.pitch, sl, 0.7);
        }
      }
    } else {
      const slAhead = groundSlope(b.x + Math.max(18, b.vx * 0.055));
      const crest = slAhead - sl;
      const pop = b.vx > 88 && crest > 0.2 && sl < -0.05;
      if (gy > b.y + 5 || pop) {
        b.air = true;
        b.airT = 0;
        b.vy = b.vx * Math.tan(b.pitch);
        if (pop && b.vy > -50) b.vy = -50 - b.vx * 0.12;
        if (b.vy > 80) b.vy = 80;
        if (b.vy < -460) b.vy = -460;
        b.y += b.vy * dt;
        b.x += b.vx * dt;
        if (b.isP && G.mode === 'play' && !G.didAir) {
          G.didAir = true;
          toast('摆车 · 顺着坡落地', false, true);
        }
      } else {
        b.y = gy;
        b.pitch = lerpAng(b.pitch, sl, 1 - Math.pow(0.0004, dt));
        b.vy = b.vx * Math.tan(sl);
        let acc = 0;
        if (b.gas) acc += accelAmt() * (b.isP ? 1 : 0.86 + b.agr * 0.2);
        if (b.turbo && b.gas && b.heat < 1) acc += turboAmt() * (b.isP ? 1 : 0.8);
        if (b.brake) acc -= 470;
        acc += GRAV * Math.sin(sl) * 0.72;
        if (muddy) acc *= 0.42;
        b.vx += acc * dt;
        b.vx -= b.vx * (muddy ? 1.15 : 0.42) * dt;
        if (!b.gas && !b.turbo) b.vx -= 22 * dt;
        if (b.vx < 0) b.vx = 0;
        if (b.vx > cap) b.vx = lerp(b.vx, cap, 0.12);
        b.x += b.vx * dt;
        b.dust += dt;
        if (b.vx > 55 && b.dust > (b.turbo ? 0.028 : 0.05)) {
          b.dust = 0;
          emit(b.turbo ? 3 : 2, {
            x: b.x - 14, y: b.y + 8, j: 4,
            vx0: -80 - b.vx * 0.2, vx1: -20, vy0: -50, vy1: -6,
            r0: 1.2, r1: muddy ? 3.4 : 2.6, life: muddy ? 0.4 : 0.28,
            rgb: muddy ? MUDC : DIRT
          });
        }
      }
    }

    if (b.turbo && b.gas && b.crashT <= 0 && !b.air) {
      b.heat += heatRate() * dt;
      if (b.isP && G.mode === 'play' && b.heat > 0.88 && Math.random() < 0.012) audio.warn();
      if (b.heat >= 1) {
        b.heat = 1;
        if (b.isP && G.mode === 'play') audio.overheat();
        crashBike(b, 'heat');
      }
      if (b.isP && G.mode === 'play' && Math.random() < 0.08) {
        emit(2, {
          x: b.x - 16, y: b.y - 2, j: 3,
          vx0: -90, vx1: -20, vy0: -40, vy1: 10,
          r0: 1, r1: 2.2, life: 0.18, rgb: HOT, g: 40
        });
      }
    } else {
      b.heat = Math.max(0, b.heat - coolRate() * (b.air ? 0.7 : 1) * dt);
    }

    b.spin += b.vx * 0.16 * dt;
    if (b.x < 20) b.x = 20;
    if (b.x > trackLen - 8) b.x = trackLen - 8;
  }

  function stepParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t -= dt;
      f.y -= 28 * dt;
      if (f.t <= 0) floats.splice(i, 1);
    }
  }

  function finishRun(win) {
    if (G.mode !== 'play') return;
    if (win) {
      const placeBonus = (6 - G.place) * 420;
      const timeBonus = Math.round(G.time * 48);
      const fin = Math.round((1800 + placeBonus + timeBonus) * scoreMul());
      bumpScore(fin);
    }
    G.mode = win ? 'win' : 'lose';
    G.ending = win ? 'win' : 'lose';
    maybeBest();
    if (win) {
      audio.win();
      screenFlash(GOLD, 0.5);
      kick(5);
      const rank = '第' + G.place + '名';
      showOverlay('win', '冲线', rank + ' · 用时 ' + fmtTime(G.timeCap - G.time) + ' · ' + (G.score | 0) + ' 分' + (G.score >= kindBest() ? ' · 新纪录' : ''));
      toast('终点 · ' + rank, false, true);
    } else {
      audio.lose();
      screenFlash(MAG, 0.55);
      kick(7);
      showOverlay('lose', '超时', (G.why || '没赶到终点。') + ' 分数 ' + (G.score | 0) + (G.score >= kindBest() && G.score > 0 ? ' · 新纪录' : ''));
    }
    hud();
  }

  function update(dt) {
    G.t += dt;
    G.punch = lerp(G.punch, 1, 0.18);
    G.shake *= 0.86;
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.goT > 0) G.goT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) G.comboT = 0;
    }

    const playing = G.mode === 'play';
    const demo = G.mode === 'title';

    if (G.stop > 0 && playing) {
      G.stop -= dt;
      stepParticles(dt);
      audio.tickEngine(clamp(player.vx / maxSpd(), 0, 1), true, false, player.heat);
      return;
    }

    if (playing || demo) {
      if (playing) controlPlayer(player);
      else thinkAI(player);
      stepBike(player, dt);
      for (let i = 0; i < cpus.length; i++) {
        thinkAI(cpus[i]);
        stepBike(cpus[i], dt);
        if (playing && !cpus[i].passed && player.x > cpus[i].x + 10 && player.crashT <= 0) {
          onOvertake(cpus[i]);
        }
        if (cpus[i].x > player.x + 4) cpus[i].passed = false;
      }
    }

    G.place = placeOf(player);
    G.kmh = Math.round(player.vx * 0.62);
    G.camX = lerp(G.camX, player.x - 218, 0.14);
    const wantY = clamp(player.y - 248, -10, 90);
    G.camY = lerp(G.camY, wantY, 0.08);

    if (playing) {
      G.time -= dt;
      if (G.time < 8 && G.time + dt >= Math.ceil(G.time) && G.time > 0) audio.warn();
      if (G.time <= 0) {
        G.time = 0;
        G.why = '时间用尽，还差 ' + Math.max(0, (finishX - player.x) | 0) + ' 到终点。';
        finishRun(false);
      } else if (player.x >= finishX && player.crashT <= 0) {
        finishRun(true);
      }
      const mark = (player.x / 10) | 0;
      if (mark > G.distMark) {
        G.score += Math.round((mark - G.distMark) * (isFever() ? 2 : 1));
        G.distMark = mark;
      }
    } else if (demo) {
      G.time = startTime();
      if (player.x > finishX - 40 || player.x > trackLen - 200) {
        resetBike(player, 90, maxSpd() * 0.42);
        placeCpus();
      }
    }

    stepParticles(dt);
    audio.tickEngine(
      clamp(player.vx / maxSpd(), 0, 1),
      (playing || demo) && player.crashT <= 0.4,
      player.turbo && player.gas,
      player.heat
    );
    hud();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    g.addColorStop(0, '#120814');
    g.addColorStop(0.42, '#2a0c18');
    g.addColorStop(0.72, '#8a2818');
    g.addColorStop(1, '#ff6a28');
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.arc(wx(G.camX + 640), wy(70), 18 * scale, 0, TAU);
    ctx.fill();
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = 'rgba(255,244,232,' + s.a + ')';
      ctx.fillRect(ox + s.x * scale * 0.9, oy + s.y * scale, s.r * scale, s.r * scale);
    }
    ctx.fillStyle = '#24101c';
    ctx.beginPath();
    ctx.moveTo(ox, oy + 210 * scale);
    for (let i = 0; i <= 8; i++) {
      const hx = ox + (i / 8) * VW * scale;
      const hy = oy + (168 + Math.sin(i * 1.3 + G.camX * 0.001) * 22) * scale;
      ctx.lineTo(hx, hy);
    }
    ctx.lineTo(ox + VW * scale, oy + VH * scale);
    ctx.lineTo(ox, oy + VH * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a0a12';
    ctx.beginPath();
    ctx.moveTo(ox, oy + 250 * scale);
    for (let i = 0; i <= 10; i++) {
      const hx = ox + (i / 10) * VW * scale;
      const hy = oy + (200 + Math.sin(i * 1.7 + G.camX * 0.0016) * 18) * scale;
      ctx.lineTo(hx, hy);
    }
    ctx.lineTo(ox + VW * scale, oy + VH * scale);
    ctx.lineTo(ox, oy + VH * scale);
    ctx.closePath();
    ctx.fill();
  }

  function drawBeams() {
    ctx.save();
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 5; i++) {
      const bx = ox + (80 + i * 150) * scale;
      ctx.fillStyle = i % 2 ? rgba(CYN, 1) : rgba(GOLD, 1);
      ctx.beginPath();
      ctx.moveTo(bx, oy);
      ctx.lineTo(bx + 70 * scale, oy + VH * scale);
      ctx.lineTo(bx + 140 * scale, oy + VH * scale);
      ctx.lineTo(bx + 18 * scale, oy);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTrack() {
    const x0 = G.camX - 40;
    const x1 = G.camX + VW + 90;
    const i0 = clamp((x0 / GX) | 0, 0, heights.length - 1);
    const i1 = clamp(Math.ceil(x1 / GX), 0, heights.length - 1);
    ctx.beginPath();
    ctx.moveTo(wx(i0 * GX), oy + VH * scale + 8);
    for (let i = i0; i <= i1; i++) ctx.lineTo(wx(i * GX), wy(heights[i]));
    ctx.lineTo(wx(i1 * GX), oy + VH * scale + 8);
    ctx.closePath();
    const dg = ctx.createLinearGradient(0, wy(220), 0, oy + VH * scale);
    dg.addColorStop(0, '#8a3a16');
    dg.addColorStop(0.18, '#6a2a12');
    dg.addColorStop(1, '#2a0c0a');
    ctx.fillStyle = dg;
    ctx.fill();

    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      const yy = heights[i] + 10;
      if (i === i0) ctx.moveTo(wx(i * GX), wy(yy));
      else ctx.lineTo(wx(i * GX), wy(yy));
    }
    ctx.strokeStyle = 'rgba(40, 16, 10, 0.55)';
    ctx.lineWidth = 10 * scale;
    ctx.stroke();

    ctx.beginPath();
    for (let i = i0; i <= i1; i++) {
      if (i === i0) ctx.moveTo(wx(i * GX), wy(heights[i]));
      else ctx.lineTo(wx(i * GX), wy(heights[i]));
    }
    ctx.strokeStyle = '#c45a28';
    ctx.lineWidth = 3.2 * scale;
    ctx.stroke();
    ctx.strokeStyle = rgba(SUN, 0.55);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();

    for (let m = 0; m < mud.length; m++) {
      const a = Math.max(mud[m].a, x0);
      const b = Math.min(mud[m].b, x1);
      if (b <= a) continue;
      ctx.beginPath();
      const ia = clamp((a / GX) | 0, 0, heights.length - 1);
      const ib = clamp(Math.ceil(b / GX), 0, heights.length - 1);
      ctx.moveTo(wx(ia * GX), wy(heights[ia] + 2));
      for (let i = ia; i <= ib; i++) ctx.lineTo(wx(i * GX), wy(heights[i] + 2));
      for (let i = ib; i >= ia; i--) ctx.lineTo(wx(i * GX), wy(heights[i] + 16));
      ctx.closePath();
      ctx.fillStyle = 'rgba(48, 28, 22, 0.72)';
      ctx.fill();
    }

    const stripe = 42;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(wx(i0 * GX), oy + VH * scale);
    for (let i = i0; i <= i1; i++) ctx.lineTo(wx(i * GX), wy(heights[i] + 22));
    ctx.lineTo(wx(i1 * GX), oy + VH * scale);
    ctx.closePath();
    ctx.clip();
    for (let sx = ((x0 / stripe) | 0) * stripe; sx < x1; sx += stripe) {
      ctx.fillStyle = ((sx / stripe) | 0) % 2 ? 'rgba(0,0,0,0.12)' : 'rgba(255,140,60,0.06)';
      ctx.fillRect(wx(sx), oy, stripe * scale, VH * scale);
    }
    ctx.restore();
  }

  function drawDecor() {
    for (let i = 0; i < flags.length; i++) {
      const f = flags[i];
      if (f.x < G.camX - 30 || f.x > G.camX + VW + 40) continue;
      const x = wx(f.x);
      const y = wy(groundY(f.x));
      if (f.k === 'gate') {
        ctx.strokeStyle = rgba(GOLD, 0.9);
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        ctx.moveTo(x - 36 * scale, y);
        ctx.lineTo(x - 36 * scale, y - 70 * scale);
        ctx.lineTo(x + 36 * scale, y - 70 * scale);
        ctx.lineTo(x + 36 * scale, y);
        ctx.stroke();
        ctx.fillStyle = rgba(SUN, 0.85);
        ctx.fillRect(x - 34 * scale, y - 70 * scale, 68 * scale, 12 * scale);
        ctx.fillStyle = '#1a080c';
        ctx.font = '700 ' + (9 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('START', x, y - 61 * scale);
      } else if (f.k === 'goal') {
        ctx.strokeStyle = rgba(CYN, 0.95);
        ctx.lineWidth = 4 * scale;
        ctx.beginPath();
        ctx.moveTo(x - 40 * scale, y);
        ctx.lineTo(x - 40 * scale, y - 78 * scale);
        ctx.lineTo(x + 40 * scale, y - 78 * scale);
        ctx.lineTo(x + 40 * scale, y);
        ctx.stroke();
        const cw = 8 * scale;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 10; c++) {
            ctx.fillStyle = (r + c) % 2 ? '#fff2e8' : '#141018';
            ctx.fillRect(x - 40 * scale + c * cw, y - 78 * scale + r * cw, cw, cw);
          }
        }
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.font = '800 ' + (11 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GOAL', x, y - 86 * scale);
      } else if (f.k === 'ramp') {
        ctx.fillStyle = rgba(SUN, 0.7);
        ctx.fillRect(x - 2 * scale, y - 26 * scale, 3 * scale, 26 * scale);
        ctx.fillStyle = rgba(MAG, 0.9);
        ctx.beginPath();
        ctx.moveTo(x - 2 * scale, y - 26 * scale);
        ctx.lineTo(x + 16 * scale, y - 20 * scale);
        ctx.lineTo(x - 2 * scale, y - 14 * scale);
        ctx.closePath();
        ctx.fill();
      } else if (f.k === 'mud') {
        ctx.fillStyle = rgba(MAG, 0.55);
        ctx.font = '700 ' + (9 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('泥', x, y - 16 * scale);
      }
    }
    const step = 90;
    const a = ((G.camX / step) | 0) * step;
    for (let x = a; x < G.camX + VW + 40; x += step) {
      if (x < 40) continue;
      const px = wx(x);
      const py = wy(groundY(x));
      ctx.fillStyle = 'rgba(255,242,232,0.16)';
      ctx.fillRect(px, py - 18 * scale, 2 * scale, 18 * scale);
    }
  }

  function drawWheel(ctx2, x, y, r, spin, rim) {
    ctx2.beginPath();
    ctx2.arc(x, y, r, 0, TAU);
    ctx2.fillStyle = '#141018';
    ctx2.fill();
    ctx2.strokeStyle = rgba(rim, 0.95);
    ctx2.lineWidth = 1.5;
    ctx2.stroke();
    ctx2.save();
    ctx2.translate(x, y);
    ctx2.rotate(spin);
    ctx2.strokeStyle = 'rgba(255,242,232,0.35)';
    ctx2.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx2.beginPath();
      ctx2.moveTo(0, 0);
      ctx2.lineTo(Math.cos(i * Math.PI * 0.5) * r, Math.sin(i * Math.PI * 0.5) * r);
      ctx2.stroke();
    }
    ctx2.restore();
    ctx2.beginPath();
    ctx2.arc(x, y, r * 0.28, 0, TAU);
    ctx2.fillStyle = rgba(rim, 0.8);
    ctx2.fill();
  }

  function drawBike(b) {
    const x = wx(b.x);
    const y = wy(b.y + b.lane * 0.15);
    const sc = scale * (b.isP ? 1 : 0.9);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.pitch);
    if (b.squash) ctx.scale(1 + b.squash * 0.1, 1 - b.squash * 0.16);
    ctx.scale(sc, sc);

    if (b.turbo && b.gas && b.crashT <= 0) {
      ctx.fillStyle = rgba(SUN, 0.55);
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-34 - Math.sin(G.t * 40) * 4, -4);
      ctx.lineTo(-28, 2);
      ctx.lineTo(-34 - Math.sin(G.t * 36) * 3, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.moveTo(-18, 1);
      ctx.lineTo(-26, -1);
      ctx.lineTo(-24, 3);
      ctx.closePath();
      ctx.fill();
    }

    drawWheel(ctx, -12, 8, 8.4, b.spin, b.isP ? GOLD : CYN);
    drawWheel(ctx, 13, 8, 8.4, b.spin, b.isP ? CYN : b.col);

    ctx.strokeStyle = rgba(b.body, 0.95);
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-12, 8);
    ctx.lineTo(-2, -2);
    ctx.lineTo(10, -1);
    ctx.lineTo(13, 8);
    ctx.moveTo(-2, -2);
    ctx.lineTo(2, 8);
    ctx.moveTo(10, -1);
    ctx.lineTo(6, -10);
    ctx.lineTo(12, -11);
    ctx.stroke();

    ctx.fillStyle = rgba(b.col, 0.95);
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.quadraticCurveTo(4, -8, 10, -2);
    ctx.lineTo(8, 2);
    ctx.lineTo(-2, 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(4, -4);
    ctx.lineTo(-6, -12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(2, 8);
    ctx.stroke();

    ctx.fillStyle = rgba(WHT, 1);
    ctx.beginPath();
    ctx.arc(1, -14, 4.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = b.isP ? rgba(SUN, 1) : rgba(b.col, 1);
    ctx.fillRect(-1.6, -16.2, 5.4, 2.1);

    if (b.heat > 0.7 && b.isP) {
      ctx.strokeStyle = rgba(MAG, 0.45 + Math.sin(G.t * 18) * 0.2);
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-22, -20, 44, 36);
    }
    ctx.restore();

    if (b.isP && b.air && G.mode === 'play') {
      const sl = groundSlope(b.x + Math.max(40, b.vx * 0.22));
      const diff = wrapAng(b.pitch - sl);
      ctx.save();
      ctx.strokeStyle = rgba(Math.abs(diff) > crashAng() * 0.6 ? MAG : GOLD, 0.55);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      const ax = wx(b.x);
      const ay = wy(b.y);
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + Math.cos(sl) * 36 * scale, ay + Math.sin(sl) * 36 * scale);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a * 0.9);
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(f.t / f.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, wx(f.x), wy(f.y));
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function drawMini() {
    const w = 160 * scale;
    const h = 8 * scale;
    const x = ox + (VW * scale - w) * 0.5;
    const y = oy + 10 * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = rgba(SUN, 0.55);
    ctx.fillRect(x, y, w * clamp(player.x / finishX, 0, 1), h);
    for (let i = 0; i < cpus.length; i++) {
      ctx.fillStyle = rgba(cpus[i].col, 0.9);
      ctx.fillRect(x + w * clamp(cpus[i].x / finishX, 0, 1) - 1.5 * scale, y - 2 * scale, 3 * scale, h + 4 * scale);
    }
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.fillRect(x + w * clamp(player.x / finishX, 0, 1) - 2 * scale, y - 3 * scale, 4 * scale, h + 6 * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0b0406';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * scale * 0.5;
      const cy = oy + VH * scale * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawSky();
    drawBeams();
    drawTrack();
    drawDecor();
    const order = cpus.concat([player]);
    order.sort(function (a, b) { return a.lane - b.lane; });
    for (let i = 0; i < order.length; i++) drawBike(order[i]);
    drawParticles();
    drawFloats();
    drawFlash();
    if (G.mode === 'play' || G.mode === 'win' || G.mode === 'lose') drawMini();
    ctx.restore();
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

  function pointerVirtX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerVirtY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('track');
    else startGame(G.kind || 'track');
  }
  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('track');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const code = e.code || '';
    const k = e.key;
    const left = code === 'KeyA' || code === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left';
    const right = code === 'KeyD' || code === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right';
    const up = code === 'KeyW' || code === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up';
    const dn = code === 'KeyS' || code === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down';
    const space = code === 'Space' || k === ' ' || k === 'Spacebar';
    if (down && (left || right || up || dn || space || k === 'Enter')) e.preventDefault();
    if (left) { keys.l = down; if (down) inputSrc = 'key'; }
    if (right) { keys.r = down; if (down) inputSrc = 'key'; }
    if (up) { keys.u = down; if (down) inputSrc = 'key'; }
    if (dn) { keys.d = down; if (down) inputSrc = 'key'; }
    if (space) {
      keys.turbo = down && G.mode === 'play' && !overlayOpen();
      if (down) inputSrc = 'key';
    }
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
    if (k === '1') {
      startGame('track');
      return;
    }
    if (k === '2') {
      startGame('fever');
      return;
    }
    if (k === 'Enter' || space) {
      if (overlayOpen()) primaryAction();
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function bindPad(el, key) {
    if (!el) return;
    const down = function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      pads[key] = true;
      inputSrc = 'ptr';
      el.classList.add('on');
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    };
    const up = function (e) {
      e.preventDefault();
      pads[key] = false;
      el.classList.remove('on');
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
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

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindPad(padBrake, 'l');
  bindPad(padUp, 'u');
  bindPad(padDown, 'd');
  bindPad(padGas, 'r');
  bindPad(padTurbo, 'turbo');

  if (padsEl && typeof window !== 'undefined' && window.matchMedia) {
    const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 720;
    if (coarse) padsEl.classList.add('show');
  }

  if (btnTrack) {
    btnTrack.addEventListener('click', function () {
      audio.ensure();
      startGame('track');
    });
  }
  if (btnFever) {
    btnFever.addEventListener('click', function () {
      audio.ensure();
      startGame('fever');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'track');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
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
      keys.turbo = false;
      pointer.down = false;
      pads.l = pads.r = pads.u = pads.d = pads.turbo = false;
    }
  });

  requestAnimationFrame(frame);
})();
