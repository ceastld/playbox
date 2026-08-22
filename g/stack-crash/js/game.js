'use strict';

(function () {
  const BASE = 176;
  const SLAB_H = 18;
  const PERFECT = 8.5;
  const NEAR = 16;
  const MIN_SIZE = 13;
  const GROW_EVERY = 7;
  const GROW = 20;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GRAV = 980;
  const BEST_KEY = 'playbox-stack-crash-best';
  const MUTE_KEY = 'playbox-stack-crash-mute';
  const AUTO_SPEED_KEY = 'playbox-stack-crash-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_DELAY = [0, 0.28, 0.1, 0, 0];
  const ISO = 0.82;
  const ISOY = 0.52;
  const HUE0 = 55;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

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
  const btnClassic = el('btn-classic');
  const btnRush = el('btn-rush');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const btnAuto = el('btn-auto');
  const speedEl = el('speed');
  const speedLab = el('speed-lab');
  const scoreEl = el('score');
  const bestEl = el('best');
  const comboEl = el('combo');
  const scoreBox = el('score-box');
  const comboBox = el('combo-box');
  const scoreAdd = el('score-add');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const toastEl = el('toast');
  const hintEl = el('hint');
  const wideWrap = el('wide-wrap');
  const wideFill = el('wide-fill');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let last = 0;
  let acc = 0;
  let hidden = false;
  let addTok = 0;
  let overlayKind = 'title';
  let frozen = true;
  let hudTick = 0;
  let autoOn = false;
  let autoSpeed = 3;
  let autoWait = 0;
  let autoPlaced = false;

  const particles = [];
  const debris = [];
  const pops = [];
  const rings = [];
  const slashes = [];
  const motes = [];
  const trail = [];

  const G = {
    mode: 'title',
    kind: 'classic',
    phase: 'swing',
    t: 0,
    clock: 0,
    height: 0,
    combo: 0,
    bestCombo: 0,
    perfects: 0,
    best: 0,
    blocks: [],
    move: null,
    anchorX: 0,
    anchorZ: 0,
    lock: 0,
    hitStop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    zoomN: 1,
    flash: 0,
    flashRgb: GOLD,
    camY: 0,
    toastT: 0,
    squash: 1,
    why: '',
    near: false,
    taught: false,
    fallT: 0
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
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hueOf(n) {
    return (HUE0 + n * 19) % 360;
  }
  function hsl(h, s, l, a) {
    if (a == null) return 'hsl(' + h + ',' + s + '%,' + l + '%)';
    return 'hsla(' + h + ',' + s + '%,' + l + '%,' + a + ')';
  }

  function overlap1d(a, aw, b, bw) {
    const l = Math.max(a, b);
    const r = Math.min(a + aw, b + bw);
    return { p: l, s: r - l };
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
    beep(freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise(dur, vol, freq, type) {
      if (!this.ctx || this.muted) return;
      const sr = this.ctx.sampleRate;
      const n = Math.max(1, (sr * Math.min(dur, 0.22)) | 0);
      const buf = this.ctx.createBuffer(1, n, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 900;
      f.Q.value = 0.7;
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
    drop() {
      this.ensure();
      this.beep(520, 0.07, 'sine', 0.05, 180);
    },
    chop() {
      this.ensure();
      this.noise(0.11, 0.14, 700, 'bandpass');
      this.beep(420, 0.09, 'square', 0.045, 90);
      this.beep(160, 0.14, 'triangle', 0.05, 60);
    },
    land() {
      this.ensure();
      this.noise(0.05, 0.05, 240, 'lowpass');
      this.beep(190, 0.1, 'triangle', 0.055, 90);
    },
    perfect(n) {
      this.ensure();
      this.beep(660, 0.08, 'sine', 0.07, 880);
      this.beep(880, 0.14, 'triangle', 0.05, 1320, 0.04);
      if (n >= 3) this.beep(1320, 0.18, 'sine', 0.04, 1760, 0.08);
      if (n >= 6) this.beep(1760, 0.2, 'sine', 0.03, 2200, 0.12);
    },
    grow() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.06, 784);
      this.beep(784, 0.14, 'triangle', 0.05, 1175, 0.05);
      this.beep(1175, 0.22, 'sine', 0.04, 1568, 0.1);
    },
    miss() {
      this.ensure();
      this.noise(0.16, 0.1, 400, 'lowpass');
      this.beep(220, 0.38, 'sawtooth', 0.07, 48);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.22, 'sawtooth', 0.06, 80);
      this.beep(130, 0.4, 'triangle', 0.07, 42, 0.08);
    },
    start() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.05, 588);
      this.beep(784, 0.16, 'triangle', 0.04, 1175, 0.06);
    },
    tick() {
      this.ensure();
      this.beep(1400, 0.03, 'sine', 0.018);
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
    if (G.height <= G.best) return;
    G.best = G.height;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function bumpScore() {
    if (scoreEl) scoreEl.textContent = String(G.height);
    saveBest();
    if (!scoreBox || !scoreAdd) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+1';
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function syncCombo() {
    if (comboEl) comboEl.textContent = '×' + G.combo;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2);
  }

  function showToast(msg, kind) {
    G.toastT = 1.55;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function renderHud() {
    if (scoreEl) scoreEl.textContent = String(G.height);
    if (bestEl) bestEl.textContent = String(G.best);
    syncCombo();
    if (stageLabel) {
      stageLabel.textContent = G.kind === 'rush' ? '加速' : '经典';
      stageLabel.classList.toggle('hot', G.kind === 'rush' && G.mode === 'play');
    }
    if (tagLabel) {
      const thin = topBlock() && Math.min(topBlock().w, topBlock().d) < BASE * 0.42;
      tagLabel.textContent = G.near ? '齐' : G.combo >= 3 ? '连' : 'STACK';
      tagLabel.classList.toggle('hot', G.near || G.combo >= 3);
      tagLabel.classList.toggle('warn', !!thin && G.mode === 'play');
    }
    const top = topBlock();
    const area = top ? (top.w * top.d) / (BASE * BASE) : 1;
    if (wideFill) wideFill.style.transform = 'scaleX(' + clamp(area, 0.04, 1).toFixed(3) + ')';
    if (wideWrap) wideWrap.classList.toggle('warn', area < 0.38 && G.mode === 'play');
  }

  function setOverlay(kind) {
    overlayKind = kind;
    frozen = true;
    if (overlay) overlay.classList.remove('hidden');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (kind === 'title') {
      if (ovKicker) ovKicker.textContent = 'STACK';
      if (ovTitle) ovTitle.textContent = '叠崩';
      if (ovLead) {
        ovLead.innerHTML = '板来回扫，点下落齐。悬空的咔一声削掉。<br />齐了会闪、会震、会连。太窄就崩。';
      }
      if (ovOps) ovOps.textContent = '点击 / 空格落板 · A 自动 · M 静音 · R 重开';
      if (btnClassic) btnClassic.textContent = '经典';
      if (btnRush) btnRush.textContent = '加速';
    } else if (kind === 'lose') {
      const thin = G.why === 'thin';
      if (ovKicker) ovKicker.textContent = thin ? 'SNAP' : 'FALL';
      if (ovTitle) ovTitle.textContent = thin ? '台面崩了' : '没叠上';
      if (ovLead) {
        ovLead.textContent = (thin ? '剩下太窄，塔自己散了。' : '板从边上滑了下去。') +
          ' 叠了 ' + G.height + ' 层 · 齐 ' + G.perfects +
          (G.bestCombo ? ' · 连齐 ' + G.bestCombo : '') +
          ' · 最高 ' + G.best + '。';
      }
      if (ovOps) ovOps.textContent = 'R 重开 · 点模式再来 · A 自动 · M 静音';
      if (btnClassic) btnClassic.textContent = '经典';
      if (btnRush) btnRush.textContent = '加速';
    }
  }

  function hideOverlay() {
    frozen = false;
    overlayKind = 'none';
    if (overlay) overlay.classList.add('hidden');
    if (panel) panel.classList.remove('win', 'lose');
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

  function autoTurbo() {
    return autoOn && autoSpeed >= 4;
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

  function hintKind() {
    if (autoOn) return G.kind === 'rush' ? 'warn' : 'hot';
    return G.kind === 'rush' ? 'warn' : '';
  }

  function playHint() {
    if (autoOn) {
      return G.kind === 'rush' ? '自动加速 · 对齐就落 · A 停下' : '自动对齐下落 · A 停下';
    }
    return G.kind === 'rush' ? '加速模式 · 空格 / 点击落板' : '对齐就落 · 空格 / 点击 · R 重开';
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoWait = 0;
    syncAutoUi();
    if (autoOn) audio.ensure();
    if (G.mode === 'play' && !frozen) setHint(playHint(), hintKind());
  }

  function setAutoSpeed(n) {
    n = n | 0;
    if (n < 1 || n > 4 || !isFinite(n)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function slabErr() {
    const m = G.move;
    const top = topBlock();
    if (!m || !top) return 1e9;
    return Math.max(Math.abs(m.x - top.x), Math.abs(m.z - top.z));
  }

  function tickAuto(dt) {
    if (!autoOn || frozen || G.mode !== 'play' || G.phase !== 'swing') return;
    if (!G.move) return;
    if (G.lock > 0 || G.hitStop > 0) return;
    if (autoTurbo() && autoPlaced) return;

    if (autoSpeed >= 4) {
      G.move.off = 0;
      applyMoveOff();
      tryDrop();
      autoPlaced = true;
      autoWait = 0;
      return;
    }

    autoWait += dt;
    if (autoWait < (AUTO_DELAY[autoSpeed] || 0)) return;

    const m = G.move;
    const spd = moveSpeed();
    const nextOff = m.off + m.dir * spd * dt;
    const err = slabErr();
    const wouldCross = (m.off < 0 && nextOff >= 0) || (m.off > 0 && nextOff <= 0);
    const entering = err > PERFECT && Math.abs(nextOff) <= PERFECT;

    if (err <= PERFECT || wouldCross || entering) {
      if (err > PERFECT) {
        m.off = 0;
        applyMoveOff();
      }
      tryDrop();
      autoWait = 0;
    }
  }

  function topBlock() {
    return G.blocks.length ? G.blocks[G.blocks.length - 1] : null;
  }

  function makeBlock(x, z, w, d, y, n, extra) {
    const b = {
      x: x,
      z: z,
      w: w,
      d: d,
      y: y,
      hue: hueOf(n),
      gold: false,
      squash: 1,
      vx: 0,
      vz: 0,
      vy: 0,
      rot: 0,
      vr: 0,
      found: n === 0
    };
    if (extra) {
      for (const k in extra) b[k] = extra[k];
    }
    return b;
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        z: spec.z + rand(-spec.j, spec.j),
        y: spec.y + rand(-4, 4),
        vx: rand(spec.vx0, spec.vx1),
        vz: rand(spec.vz0, spec.vz1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        hue: spec.hue,
        rgb: spec.rgb || null
      });
    }
  }

  function pop(x, z, y, text, kind) {
    pops.push({ x: x, z: z, y: y, text: text, life: 0.95, kind: kind || 0 });
    if (pops.length > 10) pops.shift();
  }

  function addRing(x, z, y, rgb) {
    rings.push({ x: x, z: z, y: y, life: 0.55, rgb: rgb || GOLD });
    if (rings.length > 6) rings.shift();
  }

  function addSlash(x, z, w, d, y, axis) {
    slashes.push({ x: x, z: z, w: w, d: d, y: y, axis: axis, life: 0.22 });
  }

  function addDebris(x, z, w, d, y, hue, dirX, dirZ) {
    if (w < 3 || d < 3) return;
    debris.push({
      x: x,
      z: z,
      w: w,
      d: d,
      y: y,
      hue: hue,
      vx: dirX * rand(70, 170) + rand(-40, 40),
      vz: dirZ * rand(70, 170) + rand(-40, 40),
      vy: rand(40, 120),
      rot: rand(-0.3, 0.3),
      vr: rand(-4, 4),
      life: 1.2
    });
    if (debris.length > 22) debris.shift();
  }

  function kick(kx, ky, shake, stop, punch) {
    G.kickX += kx;
    G.kickY += ky;
    G.shake = Math.max(G.shake, shake);
    if (!REDUCE) {
      G.hitStop = Math.max(G.hitStop, stop);
      if (punch) G.zoomN = Math.max(G.zoomN, 1 + punch);
    } else {
      G.hitStop = Math.max(G.hitStop, stop * 0.35);
    }
  }

  function flash(rgb, t) {
    G.flash = t;
    G.flashRgb = rgb;
  }

  function moveSpeed() {
    const n = G.height;
    if (G.kind === 'rush') return 248 + n * 16;
    return 158 + n * 8.2;
  }

  function travelOf(b) {
    return Math.max(b.w, b.d) * 0.55 + 108;
  }

  function applyMoveOff() {
    const m = G.move;
    m.x = G.anchorX + (m.axis === 'x' ? m.off : 0);
    m.z = G.anchorZ + (m.axis === 'z' ? m.off : 0);
  }

  function spawnMove(fresh) {
    const top = topBlock();
    G.anchorX = top.x;
    G.anchorZ = top.z;
    const axis = G.height % 2 === 0 ? 'x' : 'z';
    const dir = fresh ? 1 : (G.height % 2 === 0 ? 1 : -1);
    const tr = travelOf(top);
    G.move = {
      axis: axis,
      w: top.w,
      d: top.d,
      y: top.y + SLAB_H,
      hue: hueOf(G.height + 1),
      dir: dir,
      off: -dir * tr,
      x: top.x,
      z: top.z,
      vx: 0,
      vz: 0,
      vy: 0,
      rot: 0,
      vr: 0,
      squash: 1
    };
    applyMoveOff();
    G.phase = 'swing';
    G.lock = (autoOn && autoSpeed >= 4 && G.mode === 'play') ? 0 : (fresh ? 0.18 : 0.08);
    trail.length = 0;
  }

  function resetRun(kind) {
    G.kind = kind || G.kind;
    G.height = 0;
    G.combo = 0;
    G.bestCombo = 0;
    G.perfects = 0;
    G.why = '';
    G.taught = false;
    G.near = false;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.zoomN = 1;
    G.flash = 0.28;
    G.flashRgb = GOLD;
    G.hitStop = 0;
    G.squash = 1;
    G.fallT = 0;
    G.camY = 0;
    G.lock = 0.3;
    G.clock = 0;
    particles.length = 0;
    debris.length = 0;
    pops.length = 0;
    rings.length = 0;
    slashes.length = 0;
    trail.length = 0;
    const x = -BASE * 0.5;
    const z = -BASE * 0.5;
    G.blocks = [makeBlock(x, z, BASE, BASE, 0, 0, { found: true, gold: true })];
    spawnMove(true);
  }

  function seedTitle() {
    resetRun('classic');
    const b0 = G.blocks[0];
    const demo = [
      { dx: 10, dz: 6, dw: 22, dd: 14, gold: false },
      { dx: 18, dz: 16, dw: 40, dd: 30, gold: true },
      { dx: 28, dz: 22, dw: 58, dd: 46, gold: false }
    ];
    for (let i = 0; i < demo.length; i++) {
      const d = demo[i];
      const prev = topBlock();
      G.blocks.push(makeBlock(
        b0.x + d.dx,
        b0.z + d.dz,
        b0.w - d.dw,
        b0.d - d.dd,
        prev.y + SLAB_H,
        i + 1,
        { gold: d.gold }
      ));
    }
    G.height = 0;
    spawnMove(true);
    G.move.off = 40;
    applyMoveOff();
  }

  function startPlay(kind) {
    audio.start();
    G.mode = 'play';
    acc = 0;
    resetRun(kind);
    hideOverlay();
    renderHud();
    autoWait = 0;
    showToast(kind === 'rush' ? '加速 · 对齐就落' : '对齐就落 · 悬空会斩', kind === 'rush' ? 'warn' : 'gold');
    setHint(playHint(), hintKind());
  }

  function endGame(why) {
    G.why = why;
    G.mode = 'dead';
    G.phase = why === 'thin' ? 'crumble' : G.phase;
    G.fallT = 0;
    saveBest();
    renderHud();
    setHint('R 重开 · 点模式再来', 'warn');
  }

  function finishLose() {
    if (G.mode !== 'dead') return;
    G.mode = 'lose';
    audio.lose();
    setOverlay('lose');
    renderHud();
  }

  function crumbleTower() {
    for (let i = 0; i < G.blocks.length; i++) {
      const b = G.blocks[i];
      b.vx = rand(-90, 90);
      b.vz = rand(-90, 90);
      b.vy = rand(30, 140);
      b.vr = rand(-3.4, 3.4);
    }
    G.phase = 'crumble';
    G.fallT = 0;
    flash(MAG, 0.55);
    kick(rand(-8, 8), 10, 16, 0.06, 0);
  }

  function doPerfect(placed) {
    G.combo += 1;
    G.perfects += 1;
    if (G.combo > G.bestCombo) G.bestCombo = G.combo;
    audio.perfect(G.combo);
    flash(GOLD, 0.46);
    kick(0, -9, 5, 0.042, 0.13);
    const cx = placed.x + placed.w * 0.5;
    const cz = placed.z + placed.d * 0.5;
    pop(cx, cz, placed.y + SLAB_H + 8, G.combo >= 2 ? '齐×' + G.combo : '齐', 2);
    addRing(cx, cz, placed.y + SLAB_H, GOLD);
    emit(22, {
      x: cx, z: cz, y: placed.y + SLAB_H,
      j: Math.max(placed.w, placed.d) * 0.28,
      vx0: -140, vx1: 140, vz0: -140, vz1: 140, vy0: 40, vy1: 220,
      life: 0.62, r0: 1.6, r1: 4.2, hue: HUE0, rgb: GOLD
    });
    showToast(G.combo >= 3 ? '连齐 ×' + G.combo : '齐', 'gold');
    syncCombo();
    if (G.combo > 0 && G.combo % GROW_EVERY === 0) {
      const cx0 = placed.x + placed.w * 0.5;
      const cz0 = placed.z + placed.d * 0.5;
      placed.w = Math.min(BASE, placed.w + GROW);
      placed.d = Math.min(BASE, placed.d + GROW);
      placed.x = cx0 - placed.w * 0.5;
      placed.z = cz0 - placed.d * 0.5;
      placed.gold = true;
      audio.grow();
      showToast('回宽', 'gold');
      pop(cx0, cz0, placed.y + SLAB_H + 16, '回宽', 2);
      emit(16, {
        x: cx0, z: cz0, y: placed.y + SLAB_H,
        j: 20,
        vx0: -80, vx1: 80, vz0: -80, vz1: 80, vy0: 20, vy1: 120,
        life: 0.5, r0: 1.4, r1: 3.4, hue: 190, rgb: CYN
      });
    }
  }

  function doChop(m, ov) {
    G.combo = 0;
    syncCombo();
    let dirX = 0;
    let dirZ = 0;
    if (m.axis === 'x') {
      if (m.x < ov.x - 1) {
        addDebris(m.x, m.z, ov.x - m.x, m.d, m.y, m.hue, -1, 0);
        dirX -= 1;
        addSlash(ov.x, ov.z, 3, ov.d, m.y + SLAB_H * 0.45, 'x');
      }
      if (m.x + m.w > ov.x + ov.w + 1) {
        addDebris(ov.x + ov.w, m.z, m.x + m.w - ov.x - ov.w, m.d, m.y, m.hue, 1, 0);
        dirX += 1;
        addSlash(ov.x + ov.w, ov.z, 3, ov.d, m.y + SLAB_H * 0.45, 'x');
      }
    } else {
      if (m.z < ov.z - 1) {
        addDebris(m.x, m.z, m.w, ov.z - m.z, m.y, m.hue, 0, -1);
        dirZ -= 1;
        addSlash(ov.x, ov.z, ov.w, 3, m.y + SLAB_H * 0.45, 'z');
      }
      if (m.z + m.d > ov.z + ov.d + 1) {
        addDebris(m.x, ov.z + ov.d, m.w, m.z + m.d - ov.z - ov.d, m.y, m.hue, 0, 1);
        dirZ += 1;
        addSlash(ov.x, ov.z + ov.d, ov.w, 3, m.y + SLAB_H * 0.45, 'z');
      }
    }
    audio.chop();
    flash(CYN, 0.32);
    kick(dirX * 11, 7, 8 + Math.min(8, (m.w + m.d - ov.w - ov.d) * 0.04), 0.055, 0.03);
    const cx = ov.x + ov.w * 0.5;
    const cz = ov.z + ov.d * 0.5;
    pop(cx, cz, m.y + SLAB_H + 8, '削', 0);
    emit(18, {
      x: cx, z: cz, y: m.y + SLAB_H,
      j: 12,
      vx0: -160, vx1: 160, vz0: -160, vz1: 160, vy0: 20, vy1: 180,
      life: 0.48, r0: 1.2, r1: 3.4, hue: 190, rgb: CYN
    });
    if (!G.taught) {
      G.taught = true;
      showToast('悬空削掉了');
    }
  }

  function tryDrop() {
    if (G.mode !== 'play' || G.phase !== 'swing') return;
    if (G.lock > 0 || G.hitStop > 0) return;
    const top = topBlock();
    const m = G.move;
    audio.drop();
    m.squash = 1.2;
    G.squash = 1.14;
    kick(0, 5, 3, 0.018, 0);

    let ov;
    if (m.axis === 'x') {
      const o = overlap1d(m.x, m.w, top.x, top.w);
      ov = { x: o.p, w: o.s, z: top.z, d: top.d, y: top.y };
    } else {
      const o = overlap1d(m.z, m.d, top.z, top.d);
      ov = { x: top.x, w: top.w, z: o.p, d: o.s, y: top.y };
    }

    const dx = Math.abs(m.x - top.x);
    const dz = Math.abs(m.z - top.z);
    const perfect = dx <= PERFECT && dz <= PERFECT;

    if (ov.w <= 0.8 || ov.d <= 0.8) {
      G.combo = 0;
      syncCombo();
      G.phase = 'miss';
      G.fallT = 0;
      m.vy = 80;
      m.vx = m.axis === 'x' ? m.dir * 110 : rand(-30, 30);
      m.vz = m.axis === 'z' ? m.dir * 110 : rand(-30, 30);
      m.vr = m.dir * rand(2.2, 4.4);
      audio.miss();
      flash(MAG, 0.48);
      kick(m.dir * 10, 12, 14, 0.05, 0);
      emit(16, {
        x: m.x + m.w * 0.5, z: m.z + m.d * 0.5, y: m.y,
        j: 10,
        vx0: -100, vx1: 100, vz0: -100, vz1: 100, vy0: -20, vy1: 80,
        life: 0.5, r0: 1.2, r1: 3.2, hue: 320, rgb: MAG
      });
      showToast('没叠上', 'warn');
      endGame('miss');
      return;
    }

    if (perfect) {
      ov = { x: top.x, w: top.w, z: top.z, d: top.d, y: top.y };
    } else {
      doChop(m, ov);
    }

    const placed = makeBlock(ov.x, ov.z, ov.w, ov.d, top.y + SLAB_H, G.height + 1, {
      gold: perfect,
      squash: 1.22
    });
    G.blocks.push(placed);
    G.height += 1;
    bumpScore();

    if (perfect) doPerfect(placed);
    audio.land();

    const thin = Math.min(placed.w, placed.d) < MIN_SIZE;
    if (thin) {
      showToast('太窄 · 站不住', 'warn');
      pop(placed.x + placed.w * 0.5, placed.z + placed.d * 0.5, placed.y + 10, '崩', 1);
      crumbleTower();
      endGame('thin');
      return;
    }

    if (G.height === 10 || G.height === 20 || G.height === 35 || G.height === 50) {
      showToast(G.height + ' 层', 'gold');
      flash(GOLD, 0.28);
      addRing(placed.x + placed.w * 0.5, placed.z + placed.d * 0.5, placed.y + SLAB_H, GOLD);
    }

    spawnMove(false);
    renderHud();
  }

  function onAction() {
    audio.ensure();
    if (frozen) {
      if (overlayKind === 'title') startPlay('classic');
      else if (overlayKind === 'lose') startPlay(G.kind);
      return;
    }
    if (G.mode === 'dead') {
      startPlay(G.kind);
      return;
    }
    if (autoOn) return;
    if (G.mode === 'play') tryDrop();
  }

  function retry() {
    audio.ensure();
    startPlay(G.kind === 'rush' ? 'rush' : 'classic');
  }

  function stepFx(dt) {
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl && !toastEl.classList.contains('hidden')) {
      toastEl.classList.add('hidden');
    }
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.shake *= Math.pow(0.0004, dt);
    if (G.shake < 0.15) G.shake = 0;
    G.kickX *= Math.pow(0.0008, dt);
    G.kickY *= Math.pow(0.0008, dt);
    G.zoomN = lerp(G.zoomN, 1, 1 - Math.pow(0.0003, dt));
    G.squash = lerp(G.squash, 1, 1 - Math.pow(0.0002, dt));
    if (G.move) G.move.squash = lerp(G.move.squash, 1, 1 - Math.pow(0.00015, dt));
    for (let i = 0; i < G.blocks.length; i++) {
      const b = G.blocks[i];
      b.squash = lerp(b.squash, 1, 1 - Math.pow(0.00012, dt));
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.y += p.vy * dt;
      p.vy -= 420 * dt;
      p.vx *= 0.98;
      p.vz *= 0.98;
    }
    for (let i = debris.length - 1; i >= 0; i--) {
      const d = debris[i];
      d.life -= dt;
      d.x += d.vx * dt;
      d.z += d.vz * dt;
      d.y += d.vy * dt;
      d.vy -= GRAV * dt;
      d.rot += d.vr * dt;
      if (d.life <= 0 || d.y < -80) debris.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.life -= dt;
      p.y += 28 * dt;
      if (p.life <= 0) pops.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].life -= dt;
      if (rings[i].life <= 0) rings.splice(i, 1);
    }
    for (let i = slashes.length - 1; i >= 0; i--) {
      slashes[i].life -= dt;
      if (slashes[i].life <= 0) slashes.splice(i, 1);
    }
    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].a -= dt * 4.2;
      if (trail[i].a <= 0) trail.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.p += dt * m.s;
      m.y += Math.sin(m.p) * 4 * dt;
    }
  }

  function camFollow(dt) {
    const top = topBlock();
    const topY = top ? top.y + SLAB_H : SLAB_H;
    const want = topY - 10;
    G.camY = lerp(G.camY, want, 1 - Math.pow(0.018, dt));
  }

  function stepSwing(dt) {
    const m = G.move;
    const top = topBlock();
    const tr = travelOf(top);
    const spd = G.mode === 'title' ? 90 : moveSpeed();
    m.off += m.dir * spd * dt;
    if (m.off > tr) {
      m.off = tr;
      m.dir = -1;
      if (G.mode === 'play' && G.height > 4) audio.tick();
    } else if (m.off < -tr) {
      m.off = -tr;
      m.dir = 1;
      if (G.mode === 'play' && G.height > 4) audio.tick();
    }
    applyMoveOff();
    const dx = Math.abs(m.x - top.x);
    const dz = Math.abs(m.z - top.z);
    G.near = dx < NEAR && dz < NEAR;
    if (G.mode === 'play') {
      trail.push({ x: m.x, z: m.z, w: m.w, d: m.d, y: m.y, hue: m.hue, a: 0.45 });
      if (trail.length > 8) trail.shift();
      if (G.near && Math.random() < 0.5) {
        emit(1, {
          x: m.x + m.w * 0.5, z: m.z + m.d * 0.5, y: m.y + SLAB_H,
          j: 6,
          vx0: -10, vx1: 10, vz0: -10, vz1: 10, vy0: 10, vy1: 40,
          life: 0.28, r0: 0.8, r1: 1.8, hue: HUE0, rgb: GOLD
        });
      }
    }
  }

  function stepMiss(dt) {
    const m = G.move;
    m.vy -= GRAV * dt;
    m.y += m.vy * dt;
    m.x += m.vx * dt;
    m.z += m.vz * dt;
    m.rot += m.vr * dt;
    G.fallT += dt;
    if (G.fallT > 0.55 && G.phase === 'miss') {
      crumbleTower();
    }
  }

  function stepCrumble(dt) {
    G.fallT += dt;
    for (let i = 0; i < G.blocks.length; i++) {
      const b = G.blocks[i];
      b.vy -= GRAV * dt;
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.rot += b.vr * dt;
    }
    if (G.fallT > 0.82) finishLose();
  }

  function step(dt) {
    G.t += dt;
    G.clock += dt;
    G.lock = Math.max(0, G.lock - dt);
    camFollow(dt);
    stepFx(dt);

    if (G.hitStop > 0) {
      G.hitStop -= dt;
      if (G.hitStop > 0 && !autoTurbo()) return;
      G.hitStop = 0;
    }

    if (G.phase === 'swing') {
      tickAuto(dt);
      if (G.phase === 'swing') stepSwing(dt);
    } else if (G.phase === 'miss') stepMiss(dt);
    else if (G.phase === 'crumble') stepCrumble(dt);
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: rand(-260, 260),
        z: rand(-260, 260),
        y: rand(-20, 420),
        r: rand(0.6, 1.8),
        a: rand(0.08, 0.28),
        p: rand(0, TAU),
        s: rand(0.4, 1.4),
        gold: Math.random() < 0.45
      });
    }
  }

  function camState() {
    const base = Math.min(W / 420, H / 640) * 1.05;
    const zoom = base * G.zoomN;
    const sh = REDUCE ? 0 : G.shake;
    const sx = (Math.random() - 0.5) * sh;
    const sy = (Math.random() - 0.5) * sh;
    return {
      cx: W * 0.5 + G.kickX + sx,
      cy: H * 0.56 + sy + G.kickY,
      zoom: zoom,
      camY: G.camY
    };
  }

  function proj(x, z, y, cam) {
    const px = (x - z) * ISO;
    const py = (x + z) * ISO * ISOY - (y - cam.camY);
    return [cam.cx + px * cam.zoom, cam.cy + py * cam.zoom];
  }

  function drawDiamond(c, pts, fill, stroke, lw) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = lw || 1;
      c.stroke();
    }
  }

  function drawBox(c, b, cam, alpha, extraSquash) {
    const sq = (b.squash || 1) * (extraSquash || 1);
    const h = SLAB_H * sq;
    const y0 = b.y;
    const y1 = b.y + h;
    const x = b.x;
    const z = b.z;
    const w = b.w;
    const d = b.d;
    const tA = proj(x, z, y1, cam);
    const tB = proj(x + w, z, y1, cam);
    const tC = proj(x + w, z + d, y1, cam);
    const tD = proj(x, z + d, y1, cam);
    const bB = proj(x + w, z, y0, cam);
    const bC = proj(x + w, z + d, y0, cam);
    const bD = proj(x, z + d, y0, cam);
    const hue = b.hue;
    const a = alpha == null ? 1 : alpha;
    const gold = b.gold;
    const topL = gold ? 72 : 60;
    const rightL = gold ? 48 : 38;
    const leftL = gold ? 36 : 26;

    c.save();
    if (b.rot) {
      const mid = proj(x + w * 0.5, z + d * 0.5, y0 + h * 0.5, cam);
      c.translate(mid[0], mid[1]);
      c.rotate(b.rot);
      c.translate(-mid[0], -mid[1]);
    }

    drawDiamond(c, [tB, tC, bC, bB], hsl(hue, 86, rightL, a), hsl(hue, 70, 16, a * 0.5), 1);
    drawDiamond(c, [tD, tC, bC, bD], hsl(hue, 78, leftL, a), hsl(hue, 70, 14, a * 0.5), 1);
    drawDiamond(
      c,
      [tA, tB, tC, tD],
      hsl(hue, gold ? 95 : 88, topL, a),
      gold ? rgba(GOLD, 0.85 * a) : hsl(hue, 90, 78, a * 0.55),
      gold ? 1.6 : 1.1
    );
    if (gold) {
      c.beginPath();
      c.moveTo(tA[0], tA[1]);
      c.lineTo(tB[0], tB[1]);
      c.strokeStyle = rgba([255, 255, 255], 0.45 * a);
      c.lineWidth = 1.2;
      c.stroke();
    }
    c.restore();
  }

  function drawGhost(c, top, y, cam, hot) {
    const tA = proj(top.x, top.z, y, cam);
    const tB = proj(top.x + top.w, top.z, y, cam);
    const tC = proj(top.x + top.w, top.z + top.d, y, cam);
    const tD = proj(top.x, top.z + top.d, y, cam);
    c.save();
    c.setLineDash([6, 5]);
    drawDiamond(
      c,
      [tA, tB, tC, tD],
      hot ? rgba(GOLD, 0.12) : 'rgba(0,240,255,0.05)',
      hot ? rgba(GOLD, 0.9) : rgba(CYN, 0.45),
      hot ? 2.2 : 1.3
    );
    c.restore();
  }

  function drawGround(c, cam) {
    const s = 210;
    const y = -2;
    const A = proj(-s, -s, y, cam);
    const B = proj(s, -s, y, cam);
    const C = proj(s, s, y, cam);
    const D = proj(-s, s, y, cam);
    drawDiamond(c, [A, B, C, D], 'rgba(8, 6, 22, 0.9)', 'rgba(255,227,107,0.16)', 1.2);
    const g = 70;
    c.strokeStyle = 'rgba(255,227,107,0.06)';
    c.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      const p0 = proj(i * g, -s, y, cam);
      const p1 = proj(i * g, s, y, cam);
      c.beginPath();
      c.moveTo(p0[0], p0[1]);
      c.lineTo(p1[0], p1[1]);
      c.stroke();
      const q0 = proj(-s, i * g, y, cam);
      const q1 = proj(s, i * g, y, cam);
      c.beginPath();
      c.moveTo(q0[0], q0[1]);
      c.lineTo(q1[0], q1[1]);
      c.stroke();
    }
  }

  function draw() {
    if (!ctx) return;
    const c = ctx;
    c.fillStyle = '#03010a';
    c.fillRect(0, 0, W, H);

    const grd = c.createRadialGradient(W * 0.5, H * 0.28, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.7);
    grd.addColorStop(0, 'rgba(255,227,107,0.07)');
    grd.addColorStop(0.45, 'rgba(255,61,184,0.04)');
    grd.addColorStop(1, 'rgba(3,1,10,0)');
    c.fillStyle = grd;
    c.fillRect(0, 0, W, H);

    const cam = camState();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const p = proj(m.x, m.z, m.y, cam);
      c.fillStyle = m.gold ? rgba(GOLD, m.a) : rgba(CYN, m.a * 0.8);
      c.beginPath();
      c.arc(p[0], p[1], m.r, 0, TAU);
      c.fill();
    }

    drawGround(c, cam);

    const top = topBlock();
    if (top && G.phase === 'swing' && G.move) {
      drawGhost(c, top, G.move.y + SLAB_H, cam, G.near);
    }

    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      drawBox(c, t, cam, t.a * 0.35, 1);
    }

    const list = G.blocks.slice();
    list.sort(function (a, b) {
      return (a.x + a.z) - (b.x + b.z) || a.y - b.y;
    });
    const n = list.length;
    const cullY = G.camY - 90;
    for (let i = 0; i < n; i++) {
      const b = list[i];
      if (b.y < cullY && i < n - 10) continue;
      drawBox(c, b, cam, 1, i === n - 1 ? G.squash : 1);
    }

    for (let i = 0; i < debris.length; i++) {
      drawBox(c, debris[i], cam, clamp(debris[i].life * 1.2, 0, 1), 1);
    }

    if (G.move && G.phase !== 'crumble') {
      const a = G.phase === 'miss' ? clamp(1 - G.fallT * 0.7, 0.15, 1) : 1;
      drawBox(c, G.move, cam, a, G.move.squash);
      if (G.near && G.phase === 'swing') {
        const m = G.move;
        const tA = proj(m.x, m.z, m.y + SLAB_H * m.squash, cam);
        const tB = proj(m.x + m.w, m.z, m.y + SLAB_H * m.squash, cam);
        const tC = proj(m.x + m.w, m.z + m.d, m.y + SLAB_H * m.squash, cam);
        const tD = proj(m.x, m.z + m.d, m.y + SLAB_H * m.squash, cam);
        c.save();
        c.shadowColor = rgba(GOLD, 0.7);
        c.shadowBlur = 18;
        drawDiamond(c, [tA, tB, tC, tD], null, rgba(GOLD, 0.85), 2.2);
        c.restore();
      }
    }

    for (let i = 0; i < slashes.length; i++) {
      const s = slashes[i];
      const a = s.life / 0.22;
      const p0 = s.axis === 'x'
        ? proj(s.x, s.z, s.y + 8, cam)
        : proj(s.x, s.z, s.y + 8, cam);
      const p1 = s.axis === 'x'
        ? proj(s.x, s.z + s.d, s.y + 8, cam)
        : proj(s.x + s.w, s.z, s.y + 8, cam);
      c.save();
      c.strokeStyle = rgba([255, 255, 255], a);
      c.lineWidth = 3.5;
      c.shadowColor = rgba(CYN, a);
      c.shadowBlur = 16;
      c.beginPath();
      c.moveTo(p0[0], p0[1]);
      c.lineTo(p1[0], p1[1]);
      c.stroke();
      c.restore();
    }

    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = 1 - r.life / 0.55;
      const p = proj(r.x, r.z, r.y, cam);
      c.beginPath();
      c.arc(p[0], p[1], 8 + k * 52, 0, TAU);
      c.strokeStyle = rgba(r.rgb, (1 - k) * 0.85);
      c.lineWidth = 3 - k * 2;
      c.stroke();
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const q = proj(p.x, p.z, p.y, cam);
      const a = p.life / p.max;
      c.fillStyle = p.rgb ? rgba(p.rgb, a) : hsl(p.hue, 90, 64, a);
      c.beginPath();
      c.arc(q[0], q[1], p.r * (0.6 + a), 0, TAU);
      c.fill();
    }

    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const q = proj(p.x, p.z, p.y, cam);
      const a = clamp(p.life * 1.4, 0, 1);
      c.save();
      c.globalAlpha = a;
      c.font = '900 18px "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = p.kind === 2 ? rgba(GOLD, 1) : p.kind === 1 ? rgba(MAG, 1) : rgba(CYN, 1);
      c.shadowColor = p.kind === 2 ? rgba(GOLD, 0.7) : rgba(CYN, 0.5);
      c.shadowBlur = 12;
      c.fillText(p.text, q[0], q[1]);
      c.restore();
    }

    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb, G.flash * 0.28);
      c.fillRect(0, 0, W, H);
      if (G.flash > 0.2) {
        c.strokeStyle = rgba(G.flashRgb, G.flash * 0.55);
        c.lineWidth = 6;
        c.strokeRect(4, 4, W - 8, H - 8);
      }
    }

    if (G.mode === 'play' && G.height > 0) {
      c.save();
      c.font = '900 42px "Segoe UI", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.fillStyle = 'rgba(255,243,194,0.08)';
      c.fillText(String(G.height), W * 0.5, 48);
      c.restore();
    }
  }

  function resize() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    if (!hidden) {
      autoPlaced = false;
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 5) {
        step(STEP);
        acc -= STEP;
        steps += 1;
      }
      if (steps === 5) acc = 0;
      draw();
      hudTick += dt;
      if (hudTick > 0.12) {
        hudTick = 0;
        if (G.mode === 'play') renderHud();
      }
    }
    requestAnimationFrame(frame);
  }

  function isBtn(t) {
    return t && t.closest && t.closest('button, .tools, .speed-ctl, .overlay .panel');
  }

  function onPointer(e) {
    if (isBtn(e.target)) return;
    if (e.cancelable) e.preventDefault();
    audio.ensure();
    onAction();
  }

  function onKey(e) {
    const k = e.key;
    if (k === ' ' || k === 'Enter') e.preventDefault();
    if (k === 'a' || k === 'A') {
      e.preventDefault();
      if (e.repeat) return;
      toggleAuto();
      return;
    }
    if (e.repeat) return;
    if (k === 'm' || k === 'M') {
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      retry();
      return;
    }
    if (k === ' ' || k === 'Enter') onAction();
  }

  function boot() {
    try {
      if (localStorage.getItem(MUTE_KEY) === '1') audio.muted = true;
    } catch (err) { /* ignore */ }
    audio.setMuted(audio.muted);
    autoSpeed = loadAutoSpeed();
    syncAutoUi();
    syncSpeedUi();
    loadBest();
    makeMotes();
    seedTitle();
    G.mode = 'title';
    setOverlay('title');
    renderHud();
    setHint('对齐就落 · 悬空会斩 · A 自动');
    resize();
    last = 0;
    requestAnimationFrame(frame);
  }

  if (hasDom) {
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (!hidden) {
        last = 0;
        acc = 0;
      }
    });
    if (canvas) {
      canvas.addEventListener('pointerdown', onPointer);
      canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }
    const stage = el('stage');
    if (stage) {
      stage.addEventListener('pointerdown', function (e) {
        if (overlay && !overlay.classList.contains('hidden')) {
          if (isBtn(e.target)) return;
          if (overlayKind === 'lose') {
            audio.ensure();
            startPlay(G.kind);
          }
        }
      });
    }
    if (btnClassic) btnClassic.addEventListener('click', function () {
      audio.ensure();
      startPlay('classic');
    });
    if (btnRush) btnRush.addEventListener('click', function () {
      audio.ensure();
      startPlay('rush');
    });
    if (btnMute) btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
    if (btnRetry) btnRetry.addEventListener('click', function () {
      retry();
    });
    if (btnAuto) btnAuto.addEventListener('click', function () {
      toggleAuto();
    });
    if (speedEl) {
      speedEl.addEventListener('input', function () {
        setAutoSpeed(parseInt(speedEl.value, 10));
      });
      speedEl.addEventListener('change', function () {
        setAutoSpeed(parseInt(speedEl.value, 10));
      });
    }
    boot();
  } else {
    selfCheck();
  }

  function playAutoN(kind, layers, speed) {
    autoOn = true;
    autoSpeed = speed;
    autoWait = 0;
    autoPlaced = false;
    frozen = false;
    overlayKind = 'none';
    G.mode = 'play';
    resetRun(kind);
    G.mode = 'play';
    let steps = 0;
    const cap = 60 * 60 * 12;
    while (G.height < layers && G.mode === 'play' && steps < cap) {
      autoPlaced = false;
      step(STEP);
      steps += 1;
    }
    return {
      height: G.height,
      perfects: G.perfects,
      combo: G.combo,
      mode: G.mode,
      why: G.why,
      steps: steps
    };
  }

  function selfCheck() {
    const classic = playAutoN('classic', 72, 3);
    if (classic.mode !== 'play') {
      throw new Error('classic auto died at ' + classic.height + ' (' + classic.why + ')');
    }
    if (classic.height < 72) {
      throw new Error('classic auto too slow: ' + classic.height + ' in ' + classic.steps);
    }
    if (classic.perfects < 72) {
      throw new Error('classic auto not stacking: perfects ' + classic.perfects);
    }
    const rush = playAutoN('rush', 80, 3);
    if (rush.mode !== 'play') {
      throw new Error('rush auto died at ' + rush.height + ' (' + rush.why + ')');
    }
    if (rush.height < 80) {
      throw new Error('rush auto too slow: ' + rush.height);
    }
    if (rush.perfects < 80) {
      throw new Error('rush auto not stacking: perfects ' + rush.perfects);
    }
    const turbo = playAutoN('rush', 48, 4);
    if (turbo.mode !== 'play' || turbo.height < 48 || turbo.perfects < 48) {
      throw new Error('turbo auto failed h=' + turbo.height + ' p=' + turbo.perfects + ' m=' + turbo.mode);
    }
  }
})();
