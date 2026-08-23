'use strict';

(function () {
  const VW = 720;
  const VH = 420;
  const CX = 360;
  const CY = 214;
  const ARENA = 168;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.5;
  const BEST_KEY = 'playbox-warblade-best';
  const MUTE_KEY = 'playbox-warblade-mute';
  const OPS = '方向 / WASD 走 · 空格斩 · Shift / Z 格挡 · X 冲步 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 120];
  const GOLD = [255, 227, 107];
  const HOT = [255, 36, 16];
  const COR = [255, 106, 66];
  const WHT = [255, 242, 236];
  const CYN = [78, 232, 216];
  const STEEL = [200, 212, 224];
  const INK = [42, 12, 16];
  const SKIN = [232, 196, 168];
  const SKIN2 = [196, 148, 112];

  const ROUNDS = [
    {
      id: 'scout',
      name: '斥候',
      title: '第 1 局',
      hp: 34,
      dmg: 8,
      range: 50,
      half: 0.7,
      start: 0.12,
      active: 0.11,
      rec: 0.30,
      spd: 96,
      prefer: 54,
      aggro: 0.58,
      parry: 0.08,
      dash: 0.46,
      think: 0.22,
      atkGap: 0.78,
      react: 0.12,
      scale: 0.96,
      rad: 15
    },
    {
      id: 'guard',
      name: '铁卫',
      title: '第 2 局',
      hp: 50,
      dmg: 10,
      range: 48,
      half: 0.78,
      start: 0.16,
      active: 0.12,
      rec: 0.34,
      spd: 72,
      prefer: 50,
      aggro: 0.28,
      parry: 0.72,
      dash: 0.08,
      think: 0.18,
      atkGap: 0.92,
      react: 0.08,
      scale: 1.12,
      rad: 18,
      shield: true
    },
    {
      id: 'rider',
      name: '血骑',
      title: '第 3 局',
      hp: 64,
      dmg: 12,
      range: 62,
      half: 0.82,
      start: 0.10,
      active: 0.11,
      rec: 0.24,
      spd: 124,
      prefer: 60,
      aggro: 0.62,
      parry: 0.26,
      dash: 0.58,
      think: 0.12,
      atkGap: 0.56,
      react: 0.07,
      scale: 1.06,
      rad: 16
    },
    {
      id: 'king',
      name: '刃王',
      title: '刃王',
      hp: 122,
      dmg: 15,
      range: 72,
      half: 0.95,
      start: 0.14,
      active: 0.13,
      rec: 0.26,
      spd: 108,
      prefer: 66,
      aggro: 0.54,
      parry: 0.36,
      dash: 0.38,
      think: 0.14,
      atkGap: 0.62,
      react: 0.08,
      scale: 1.28,
      rad: 20,
      boss: true
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
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnDuel = document.getElementById('btn-duel');
  const btnBlood = document.getElementById('btn-blood');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const hpBar = document.getElementById('hp-bar');
  const foeBar = document.getElementById('foe-bar');
  const foeName = document.getElementById('foe-name');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const btnUp = document.getElementById('btn-up');
  const btnLeft = document.getElementById('btn-left');
  const btnDown = document.getElementById('btn-down');
  const btnRight = document.getElementById('btn-right');
  const btnSlash = document.getElementById('btn-slash');
  const btnParry = document.getElementById('btn-parry');
  const btnDash = document.getElementById('btn-dash');

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
  let chainTok = 0;

  const keys = { l: false, r: false, u: false, d: false, parry: false, charge: false };
  const tapAt = { l: -1, r: -1, u: -1, d: -1 };
  const pointer = { down: false, x: CX, y: CY, id: null, t0: 0, x0: 0, y0: 0, moved: false };
  const particles = [];
  const embers = [];
  const ghosts = [];
  const arcs = [];
  const floats = [];
  const rings = [];

  const G = {
    mode: 'title',
    kind: 'duel',
    t: 0,
    clock: 0,
    round: 0,
    phase: 'intro',
    phaseT: 0,
    roundT: 0,
    ply: null,
    foe: null,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    slashBuf: 0,
    heavyBuf: 0,
    parryBuf: 0,
    dashBuf: 0,
    dashAng: 0,
    chargeT: 0,
    charging: false,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    call: '',
    callT: 0,
    demo: false
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
  function angNorm(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function angDiff(a, b) {
    return angNorm(a - b);
  }
  function isBlood() {
    return G.kind === 'blood';
  }
  function spec() {
    return ROUNDS[Math.min(ROUNDS.length - 1, G.round)] || ROUNDS[0];
  }
  function spdMul() {
    return isBlood() ? 1.22 : 1;
  }
  function hpMul() {
    return isBlood() ? 1.16 : 1;
  }
  function other(f) {
    return f && f.isPly ? G.foe : G.ply;
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
    swing() {
      this.ensure();
      this.noise(0.055, 0.036, 1500);
      this.beep(380, 0.07, 'sine', 0.028, 160);
    },
    heavy() {
      this.ensure();
      this.noise(0.08, 0.05, 700);
      this.beep(220, 0.12, 'sawtooth', 0.045, 90);
      this.beep(140, 0.16, 'sine', 0.04, 60);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.05);
      this.noise(0.04, 0.05, 880);
      this.beep(540 * lift, 0.08, 'square', 0.05, 920 * lift);
    },
    parry() {
      this.ensure();
      this.noise(0.05, 0.048, 1900);
      this.beep(1040, 0.09, 'square', 0.055, 1680);
      this.beep(1480, 0.12, 'triangle', 0.038, 2100);
    },
    clash() {
      this.ensure();
      this.noise(0.085, 0.06, 640);
      this.beep(280, 0.11, 'sawtooth', 0.05, 80);
      this.beep(720, 0.08, 'square', 0.04, 380);
    },
    dash() {
      this.ensure();
      this.noise(0.09, 0.04, 520);
      this.beep(240, 0.11, 'sine', 0.032, 70);
    },
    hurt() {
      this.ensure();
      this.noise(0.07, 0.04, 380);
      this.beep(170, 0.14, 'sawtooth', 0.04, 64);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 260);
      this.beep(230, 0.22, 'sawtooth', 0.05, 55);
      this.beep(96, 0.34, 'sine', 0.045, 32);
    },
    combo(m) {
      this.ensure();
      this.beep(460 * m, 0.08, 'sine', 0.04, 690 * m);
      this.beep(920, 0.12, 'triangle', 0.03, 1380);
    },
    charge() {
      this.ensure();
      this.beep(180, 0.08, 'sine', 0.028, 420);
    },
    whirl() {
      this.ensure();
      this.noise(0.16, 0.055, 220);
      this.beep(80, 0.3, 'sawtooth', 0.055, 40);
      this.beep(360, 0.18, 'sine', 0.038, 140);
    },
    boss() {
      this.ensure();
      this.beep(150, 0.18, 'sawtooth', 0.05, 72);
      this.beep(96, 0.3, 'square', 0.04, 48);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.04, 86);
      this.beep(128, 0.3, 'sine', 0.05, 44);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    round() {
      this.ensure();
      this.beep(494, 0.08, 'sine', 0.035, 740);
      this.beep(740, 0.12, 'triangle', 0.04, 988);
    },
    brk() {
      this.ensure();
      this.noise(0.07, 0.05, 500);
      this.beep(160, 0.14, 'sawtooth', 0.05, 70);
      this.beep(620, 0.08, 'square', 0.03, 180);
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
    G.score += n | 0;
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
    G.toastT = 1.25;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1250);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function setCall(text, dur) {
    G.call = text;
    G.callT = dur || 0.9;
  }

  function popChain(text) {
    if (!chainPop) return;
    chainTok += 1;
    const tok = chainTok;
    chainPop.textContent = text;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    setTimeout(function () {
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 2));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = comboMult();
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (G.combo >= 2 && G.combo % 2 === 0) {
      popChain(G.combo + ' 斩');
      audio.combo(G.mult);
    }
  }

  function dropCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    if (comboEl) comboEl.textContent = '×1';
  }

  function fillBar(el, ratio) {
    if (!el) return;
    const r = clamp(ratio, 0, 1);
    el.style.transform = 'scaleX(' + r + ')';
    el.classList.toggle('low', r < 0.34 && r > 0);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    const st = spec();
    if (stageLabel) {
      stageLabel.textContent = st.title;
      stageLabel.classList.toggle('hot', !!st.boss || G.round >= 2);
    }
    if (tagLabel) {
      tagLabel.textContent = isBlood() ? '血月' : '战刃';
      tagLabel.classList.toggle('warn', isBlood());
    }
    if (foeName) foeName.textContent = st.name;
    if (G.ply) fillBar(hpBar, G.ply.hp / G.ply.hpMax);
    if (G.foe) fillBar(foeBar, G.foe.hp / G.foe.hpMax);
    else fillBar(foeBar, 1);
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 体力打空本局结束', 'warn');
    else if (G.mode === 'win') setHint('刃尽 · R 再来一局', 'hot');
    else if (G.ply && G.ply.hp / G.ply.hpMax < 0.34) setHint('残血 · 格挡再反斩，或蓄重斩破防', 'warn');
    else setHint('空格斩 · 按住蓄重斩 · Shift 挡 · X 冲步', st.boss ? 'hot' : '');
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'WBLD';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovRetry) ovRetry.textContent = '再来';
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isBlood() ? '换模式' : '血月';
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.005));
    if (!stageEl) return;
    kickTok += 1;
    const c = cls || (mag >= 7 ? 'die' : mag >= 4.5 ? 'parry' : 'hit');
    stageEl.classList.remove('die', 'hit', 'slash', 'parry');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) stageEl.classList.remove('die', 'hit', 'slash', 'parry');
    }, 340);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, spec) {
    const count = REDUCE ? Math.ceil(n * 0.45) : n;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: spec.x + rand(-(spec.spread || 0), spec.spread || 0),
        y: spec.y + rand(-(spec.spread || 0), spec.spread || 0),
        vx: spec.vx + rand(-(spec.jv || 0), spec.jv || 0),
        vy: spec.vy + rand(-(spec.jv || 0), spec.jv || 0),
        life: spec.life || 0.5,
        max: spec.life || 0.5,
        r: spec.r ? spec.r + rand(-1, 1) : rand(1.4, 3.2),
        rgb: spec.rgb || GOLD,
        kind: spec.kind || 'spark',
        spin: rand(-8, 8),
        a: rand(0, TAU)
      });
    }
    capArr(particles, REDUCE ? 70 : 220);
  }

  function burstEmber(x, y, n, rgb) {
    const count = REDUCE ? Math.ceil(n * 0.4) : n;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + rand(-8, 8),
        y: y + rand(-8, 8),
        vx: rand(-70, 70),
        vy: rand(-140, -20),
        life: rand(0.4, 0.85),
        max: 0.8,
        r: rand(2.2, 4.6),
        rgb: Math.random() < 0.55 ? (rgb || HOT) : COR,
        kind: 'ember',
        spin: rand(-6, 6),
        a: rand(0, TAU)
      });
    }
    capArr(particles, REDUCE ? 70 : 220);
  }

  function sparkRing(x, y, rgb) {
    rings.push({ x: x, y: y, r: 8, life: 0.32, max: 0.32, rgb: rgb || GOLD });
    capArr(rings, 14);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, life: 0.72, rgb: rgb || GOLD });
    capArr(floats, 12);
  }

  function addArc(x, y, ang, rgb, heavy) {
    arcs.push({
      x: x,
      y: y,
      ang: ang,
      life: heavy ? 0.28 : 0.16,
      max: heavy ? 0.28 : 0.16,
      rgb: rgb,
      heavy: !!heavy
    });
    capArr(arcs, 10);
  }

  function addGhost(f) {
    ghosts.push({
      x: f.x,
      y: f.y,
      ang: f.ang,
      life: 0.22,
      max: 0.22,
      rgb: f.isPly ? CYN : HOT,
      scale: f.scale,
      rad: f.rad
    });
    capArr(ghosts, 16);
  }

  function seedEmbers() {
    embers.length = 0;
    const n = REDUCE ? 10 : 24;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const r = rand(20, ARENA - 8);
      embers.push({
        x: CX + Math.cos(a) * r,
        y: CY + Math.sin(a) * r,
        vx: rand(-12, 12),
        vy: rand(-28, -8),
        a: rand(0, TAU),
        spin: rand(-2, 2),
        s: rand(0.5, 1.3),
        rgb: Math.random() < 0.45 ? HOT : (isBlood() ? MAG : COR)
      });
    }
  }

  function makeFighter(isPly, roundSpec, x, y) {
    const st = roundSpec || ROUNDS[0];
    const hp = isPly ? 100 : Math.round(st.hp * hpMul());
    return {
      isPly: !!isPly,
      kind: isPly ? 'blade' : st.id,
      name: isPly ? '刃士' : st.name,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      ang: isPly ? 0 : Math.PI,
      hp: hp,
      hpMax: hp,
      state: 'idle',
      t: 0,
      phase: 0,
      hitDone: false,
      inv: 0,
      anim: 0,
      counter: 0,
      flashCut: 0,
      stepCd: 0,
      thinkT: 0.18,
      atkCd: 0.35,
      reacted: false,
      intent: 'wait',
      heavyAtk: false,
      whirlAtk: false,
      startT: isPly ? 0.072 : st.start / spdMul(),
      activeT: isPly ? 0.10 : st.active,
      recT: isPly ? 0.17 : st.rec / spdMul(),
      range: isPly ? 56 : st.range,
      half: isPly ? 0.74 : st.half,
      dmg: isPly ? 13 : st.dmg,
      spd: isPly ? (isBlood() ? 204 : 172) : st.spd * spdMul(),
      prefer: st.prefer || 56,
      aggro: st.aggro || 0.4,
      parryCh: st.parry || 0,
      dashCh: st.dash || 0,
      thinkGap: (st.think || 0.2) / spdMul(),
      atkGap: (st.atkGap || 0.7) / spdMul(),
      react: (st.react || 0.1) / spdMul(),
      scale: isPly ? 1.08 : (st.scale || 1),
      rad: isPly ? 15 : (st.rad || 16),
      boss: !!(st && st.boss),
      shield: !!(st && st.shield),
      orbit: Math.random() < 0.5 ? 1 : -1
    };
  }

  function canAct(f) {
    return f && (f.state === 'idle' || f.state === 'walk');
  }

  function distTo(a, b) {
    if (!a || !b) return 999;
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function faceOther(f) {
    const o = other(f);
    if (!o) return;
    const dx = o.x - f.x;
    const dy = o.y - f.y;
    if (dx * dx + dy * dy > 16) f.ang = Math.atan2(dy, dx);
  }

  function inCone(from, to, facing, range, half) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const d = Math.hypot(dx, dy);
    if (d > range + to.rad) return false;
    if (d < 8) return true;
    const a = Math.atan2(dy, dx);
    return Math.abs(angDiff(a, facing)) <= half;
  }

  function slashReach(f) {
    const extra = f.whirlAtk ? 18 : (f.heavyAtk ? 16 : (f.flashCut > 0 ? 10 : 0));
    return f.range + extra;
  }

  function slashHalf(f) {
    if (f.whirlAtk) return Math.PI;
    if (f.heavyAtk) return 1.08;
    if (f.flashCut > 0) return 0.88;
    return f.half;
  }

  function wouldHit(atk, vic) {
    if (!atk || !vic || vic.state === 'dead') return false;
    if (vic.state === 'dash' && vic.inv > 0) return false;
    return inCone(atk, vic, atk.ang, slashReach(atk), slashHalf(atk));
  }

  function parryFront(def, atk) {
    const half = def.shield ? 1.35 : 1.05;
    return inCone(def, atk, def.ang, 90, half);
  }

  function setState(f, st) {
    f.state = st;
    f.t = 0;
    f.phase = 0;
    f.hitDone = false;
    if (st !== 'slash' && st !== 'heavy' && st !== 'whirl') {
      f.heavyAtk = false;
      f.whirlAtk = false;
    }
    if (st !== 'dash' && st !== 'hurt' && st !== 'stun') {
      if (st !== 'slash' && st !== 'heavy' && st !== 'whirl') {
        f.vx *= 0.4;
        f.vy *= 0.4;
      }
    }
  }

  function parryDur() {
    return isBlood() ? 0.28 : 0.38;
  }

  function doSlash(f, heavy) {
    if (!f || !canAct(f)) return false;
    faceOther(f);
    setState(f, heavy ? 'heavy' : 'slash');
    f.heavyAtk = !!heavy;
    f.whirlAtk = false;
    if (f.isPly && f.flashCut > 0) {
      f.startT = 0.048;
      f.activeT = 0.11;
      f.recT = 0.14;
      f.range = 66;
      f.half = 0.86;
    } else if (f.isPly && f.counter > 0) {
      f.startT = 0.05;
      f.activeT = 0.12;
      f.recT = 0.15;
      f.range = 64;
      f.half = 0.9;
    } else if (f.isPly && heavy) {
      f.startT = 0.16;
      f.activeT = 0.13;
      f.recT = 0.26;
      f.range = 70;
      f.half = 1.05;
    } else if (f.isPly) {
      f.startT = 0.072;
      f.activeT = 0.10;
      f.recT = 0.17;
      f.range = 56;
      f.half = 0.74;
    } else if (heavy) {
      const st = spec();
      f.startT = (st.start + 0.08) / spdMul();
      f.activeT = st.active + 0.03;
      f.range = st.range + 12;
      f.half = st.half + 0.22;
    } else {
      const st = spec();
      f.startT = st.start / spdMul();
      f.activeT = st.active;
      f.range = st.range;
      f.half = st.half;
    }
    const lunge = (heavy ? 340 : 230) + (f.flashCut > 0 ? 160 : 0);
    f.vx += Math.cos(f.ang) * lunge;
    f.vy += Math.sin(f.ang) * lunge;
    if (heavy) audio.heavy();
    else audio.swing();
    return true;
  }

  function doWhirl(f) {
    if (!f || !canAct(f)) return false;
    faceOther(f);
    setState(f, 'whirl');
    f.whirlAtk = true;
    f.heavyAtk = true;
    f.startT = 0.26 / spdMul();
    f.activeT = 0.34;
    f.recT = 0.28 / spdMul();
    f.range = 78;
    f.half = Math.PI;
    audio.whirl();
    return true;
  }

  function doParry(f) {
    if (!f || !canAct(f)) return false;
    faceOther(f);
    setState(f, 'parry');
    return true;
  }

  function doDash(f, ang) {
    if (!f) return false;
    if (!canAct(f) && f.state !== 'parry') return false;
    if (f.stepCd > 0) return false;
    if (ang == null) {
      const o = other(f);
      ang = o ? Math.atan2(o.y - f.y, o.x - f.x) : f.ang;
    }
    setState(f, 'dash');
    f.ang = ang;
    const sp = isBlood() ? 980 : 880;
    f.vx = Math.cos(ang) * sp;
    f.vy = Math.sin(ang) * sp;
    f.inv = 0.14;
    f.stepCd = isBlood() ? 0.4 : 0.54;
    f.flashCut = 0.24;
    audio.dash();
    addGhost(f);
    burstEmber(f.x, f.y, 7, f.isPly ? CYN : HOT);
    return true;
  }

  function moveAngFromKeys() {
    let ix = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    let iy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
    if (pointer.down && pointer.moved) {
      const dx = pointer.x - (G.ply ? G.ply.x : CX);
      const dy = pointer.y - (G.ply ? G.ply.y : CY);
      if (Math.hypot(dx, dy) > 10) {
        ix = dx;
        iy = dy;
      }
    }
    if (ix === 0 && iy === 0) return null;
    return Math.atan2(iy, ix);
  }

  function hurt(f, from, dmg) {
    if (!f || f.inv > 0 || f.state === 'dead' || f.state === 'dash') return;
    if (G.demo) {
      f.hp = Math.max(8, f.hp - 1);
      setState(f, 'hurt');
      f.inv = 0.2;
      return;
    }
    f.hp = Math.max(0, f.hp - dmg);
    const ang = from ? Math.atan2(f.y - from.y, f.x - from.x) : f.ang + Math.PI;
    f.vx = Math.cos(ang) * 340;
    f.vy = Math.sin(ang) * 340;
    if (f.hp <= 0) {
      setState(f, 'dead');
      f.inv = 9;
      audio.death();
      burstEmber(f.x, f.y, 26, HOT);
      emit(20, { x: f.x, y: f.y, vx: Math.cos(ang) * 80, vy: Math.sin(ang) * 80, jv: 120, spread: 14, life: 0.5, rgb: GOLD, kind: 'spark' });
      screenFlash(HOT, 0.45);
      hitStop(0.074);
      kick(8, 'die');
      if (f.isPly) dropCombo();
    } else {
      setState(f, 'hurt');
      f.inv = 0.32;
      audio.hurt();
      burstEmber(f.x, f.y, 9, COR);
      hitStop(0.046);
      kick(4.2, 'hit');
      if (f.isPly) dropCombo();
    }
    syncHud();
  }

  function landHit(atk, vic) {
    atk.hitDone = true;
    let dmg = atk.dmg;
    let tag = '斩';
    let rgb = atk.isPly ? CYN : HOT;
    if (atk.whirlAtk) {
      dmg = Math.round(atk.dmg * 1.4);
      tag = '旋刃';
      rgb = MAG;
    } else if (atk.heavyAtk) {
      dmg = Math.round(atk.dmg * 1.5);
      tag = '重斩';
      rgb = GOLD;
    } else if (atk.counter > 0) {
      dmg = Math.round(atk.dmg * 1.55);
      tag = '反斩';
      rgb = GOLD;
    } else if (atk.flashCut > 0 && atk.isPly) {
      dmg = Math.round(atk.dmg * 1.28);
      tag = '冲斩';
      rgb = CYN;
    }
    const hx = vic.x;
    const hy = vic.y;
    emit(16, { x: hx, y: hy, vx: Math.cos(atk.ang) * 80, vy: Math.sin(atk.ang) * 80, jv: 90, spread: 10, life: 0.38, rgb: rgb, kind: 'spark' });
    burstEmber(hx, hy, 11, rgb);
    addArc(atk.x + Math.cos(atk.ang) * 22, atk.y + Math.sin(atk.ang) * 22, atk.ang, rgb, atk.heavyAtk);
    sparkRing(hx, hy, rgb);
    if (atk.isPly && !G.demo) {
      bumpCombo();
      const base = atk.counter > 0 ? 280 : atk.whirlAtk ? 240 : atk.heavyAtk ? 200 : atk.flashCut > 0 ? 200 : 120;
      const pts = Math.round(base * G.mult);
      addScore(pts);
      floatText(hx, hy - 18, tag + ' +' + pts, rgb);
      audio.hit(G.combo);
      hitStop(atk.counter > 0 ? 0.066 : atk.heavyAtk ? 0.07 : atk.whirlAtk ? 0.078 : 0.05);
      kick(atk.counter > 0 ? 6 : 4.8, 'slash');
      screenFlash(rgb, 0.22);
    } else if (!G.demo) {
      audio.hit(1);
      hitStop(atk.whirlAtk ? 0.07 : 0.048);
      kick(5, 'hit');
      screenFlash(HOT, 0.18);
    } else {
      audio.hit(1);
    }
    hurt(vic, atk, dmg);
    atk.counter = 0;
  }

  function landParry(def, atk) {
    atk.hitDone = true;
    if (atk.heavyAtk && !atk.whirlAtk) {
      setState(def, 'stun');
      def.t = 0;
      const kb = Math.atan2(def.y - atk.y, def.x - atk.x);
      def.vx = Math.cos(kb) * 160;
      def.vy = Math.sin(kb) * 160;
      atk.vx *= 0.4;
      atk.vy *= 0.4;
      sparkRing(def.x, def.y, MAG);
      emit(14, { x: def.x, y: def.y, vx: 0, vy: 0, jv: 130, spread: 8, life: 0.36, rgb: MAG, kind: 'spark' });
      audio.brk();
      hitStop(0.06);
      kick(6, 'hit');
      screenFlash(MAG, 0.26);
      if (atk.isPly && !G.demo) {
        bumpCombo();
        const pts = Math.round(220 * G.mult);
        addScore(pts);
        floatText(def.x, def.y - 22, '破防 +' + pts, MAG);
        popChain('破防');
      } else {
        floatText(def.x, def.y - 22, '破防', MAG);
      }
      hurt(def, atk, Math.round(atk.dmg * 1.5));
      if (def.state !== 'dead') {
        setState(def, 'stun');
        def.inv = 0.08;
      }
      return;
    }
    setState(atk, 'stun');
    atk.t = 0;
    const kb = Math.atan2(atk.y - def.y, atk.x - def.x);
    atk.vx = Math.cos(kb) * 90;
    atk.vy = Math.sin(kb) * 90;
    def.counter = 0.55;
    sparkRing(def.x + Math.cos(def.ang) * 18, def.y + Math.sin(def.ang) * 18, GOLD);
    emit(16, {
      x: def.x + Math.cos(def.ang) * 20,
      y: def.y + Math.sin(def.ang) * 20,
      vx: 0,
      vy: 0,
      jv: 140,
      spread: 8,
      life: 0.4,
      rgb: GOLD,
      kind: 'spark'
    });
    burstEmber(def.x, def.y, 7, GOLD);
    audio.parry();
    hitStop(0.056);
    kick(5.5, 'parry');
    screenFlash(GOLD, 0.28);
    if (def.isPly && !G.demo) {
      bumpCombo();
      const pts = Math.round(160 * G.mult);
      addScore(pts);
      floatText(def.x, def.y - 24, '格挡 +' + pts, GOLD);
      popChain('格挡');
    } else {
      floatText(def.x, def.y - 24, '被格', MAG);
    }
  }

  function landClash(a, b) {
    a.hitDone = true;
    b.hitDone = true;
    const mx = (a.x + b.x) * 0.5;
    const my = (a.y + b.y) * 0.5;
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    a.vx = Math.cos(ang) * -280;
    a.vy = Math.sin(ang) * -280;
    b.vx = Math.cos(ang) * 280;
    b.vy = Math.sin(ang) * 280;
    emit(22, { x: mx, y: my, vx: 0, vy: 0, jv: 160, spread: 10, life: 0.36, rgb: WHT, kind: 'spark' });
    sparkRing(mx, my, WHT);
    addArc(mx, my, ang, GOLD, true);
    audio.clash();
    hitStop(0.042);
    kick(5, 'slash');
    screenFlash(WHT, 0.2);
    if (G.mode === 'play') {
      addScore(40);
      floatText(mx, my - 18, '交刃', WHT);
    }
  }

  function landRead(stepper, atk) {
    atk.hitDone = true;
    sparkRing(stepper.x, stepper.y, CYN);
    burstEmber(stepper.x, stepper.y, 6, CYN);
    if (stepper.isPly && !G.demo) {
      addScore(90);
      floatText(stepper.x, stepper.y - 22, '闪读 +90', CYN);
      bumpCombo();
    }
  }

  function attacking(f) {
    if (!f) return false;
    if (f.state !== 'slash' && f.state !== 'heavy' && f.state !== 'whirl') return false;
    return f.t >= f.startT && f.t < f.startT + f.activeT;
  }

  function resolveCombat() {
    const a = G.ply;
    const b = G.foe;
    if (!a || !b) return;
    const aHit = attacking(a) && !a.hitDone;
    const bHit = attacking(b) && !b.hitDone;
    if (aHit && bHit && wouldHit(a, b) && wouldHit(b, a)) {
      landClash(a, b);
      return;
    }
    if (aHit && wouldHit(a, b)) {
      if (b.state === 'dash' && b.inv > 0) landRead(b, a);
      else if (b.state === 'parry' && parryFront(b, a)) landParry(b, a);
      else landHit(a, b);
    }
    if (bHit && wouldHit(b, a)) {
      if (a.state === 'dash' && a.inv > 0) landRead(a, b);
      else if (a.state === 'parry' && parryFront(a, b)) landParry(a, b);
      else landHit(b, a);
    }
  }

  function clampArena(f) {
    const dx = f.x - CX;
    const dy = f.y - CY;
    const d = Math.hypot(dx, dy);
    const max = ARENA - f.rad - 2;
    if (d > max && d > 0.001) {
      f.x = CX + dx / d * max;
      f.y = CY + dy / d * max;
      if (f.state === 'dash') {
        f.vx *= -0.2;
        f.vy *= -0.2;
      }
    }
  }

  function separate() {
    const a = G.ply;
    const b = G.foe;
    if (!a || !b) return;
    if (a.state === 'dead' || b.state === 'dead') return;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d = Math.hypot(dx, dy);
    const min = a.rad + b.rad - 3;
    if (d < min && d > 0.001) {
      const push = (min - d) * 0.5;
      const nx = dx / d;
      const ny = dy / d;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
    }
  }

  function thinkFoe(f, dt) {
    if (!f || f.isPly || !canAct(f)) return;
    const p = G.ply;
    if (!p || p.state === 'dead') return;
    f.thinkT -= dt;
    const d = distTo(f, p);
    const ang = Math.atan2(p.y - f.y, p.x - f.x);
    f.ang = ang;
    const pWind = (p.state === 'slash' || p.state === 'heavy' || p.state === 'whirl') && p.t < p.startT;
    const pAtk = attacking(p) || pWind;
    if (pAtk && !f.reacted) {
      f.reacted = true;
      const roll = Math.random();
      if (d < slashReach(p) + 18 && roll < f.parryCh) {
        doParry(f);
        return;
      }
      if (d < slashReach(p) + 24 && roll < f.dashCh) {
        const side = ang + (Math.PI * 0.5) * f.orbit;
        doDash(f, side);
        return;
      }
    }
    if (!pAtk) f.reacted = false;
    if (f.thinkT > 0) return;
    f.thinkT = f.thinkGap * rand(0.7, 1.35);
    if (f.boss && f.hp / f.hpMax <= 0.5 && f.atkCd <= 0 && Math.random() < 0.34) {
      doWhirl(f);
      f.atkCd = f.atkGap * 1.4;
      return;
    }
    if (d < f.range + 10 && f.atkCd <= 0 && Math.random() < f.aggro + 0.22) {
      const heavy = f.boss ? Math.random() < 0.28 : (f.kind === 'guard' && Math.random() < 0.22);
      doSlash(f, heavy);
      f.atkCd = f.atkGap * rand(0.85, 1.2);
      return;
    }
    if (d > f.prefer + 36 && f.dashCh > 0.3 && f.stepCd <= 0 && Math.random() < 0.28) {
      doDash(f, ang);
      return;
    }
    f.intent = d > f.prefer + 16 ? 'in' : d < f.prefer - 14 ? 'out' : 'orbit';
  }

  function applyMove(f, dt) {
    if (!f || f.state === 'dead') return;
    if (f.state === 'dash') {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if ((G.t * 60) % 2 < 1) addGhost(f);
      return;
    }
    let mx = 0;
    let my = 0;
    if (f.isPly && (canAct(f) || f.state === 'parry') && G.mode === 'play' && G.phase === 'fight') {
      const a = moveAngFromKeys();
      if (a != null) {
        mx = Math.cos(a);
        my = Math.sin(a);
        if (f.state !== 'parry') f.state = 'walk';
      } else if (f.state === 'walk') {
        f.state = 'idle';
      }
    } else if (!f.isPly && canAct(f) && (G.mode === 'play' || G.demo) && (G.phase === 'fight' || G.demo)) {
      const p = G.ply;
      if (p) {
        const ang = Math.atan2(p.y - f.y, p.x - f.x);
        if (f.intent === 'in') {
          mx = Math.cos(ang);
          my = Math.sin(ang);
        } else if (f.intent === 'out') {
          mx = -Math.cos(ang);
          my = -Math.sin(ang);
        } else {
          mx = Math.cos(ang + Math.PI * 0.5 * f.orbit);
          my = Math.sin(ang + Math.PI * 0.5 * f.orbit);
        }
        f.state = 'walk';
      }
    }
    if (f.isPly && G.demo && canAct(f)) {
      const o = G.foe;
      if (o) {
        const d = distTo(f, o);
        const ang = Math.atan2(o.y - f.y, o.x - f.x);
        if (d > 58) {
          mx = Math.cos(ang);
          my = Math.sin(ang);
        } else if (d < 42) {
          mx = -Math.cos(ang);
          my = -Math.sin(ang);
        } else {
          mx = Math.cos(ang + Math.PI * 0.5);
          my = Math.sin(ang + Math.PI * 0.5);
        }
        f.state = 'walk';
        if (f.atkCd <= 0 && d < 62 && Math.random() < 0.04) {
          doSlash(f, Math.random() < 0.2);
          f.atkCd = 0.7;
        } else if (o.state === 'slash' && Math.random() < 0.2) {
          doParry(f);
        }
      }
    }
    const sp = f.spd * (f.state === 'parry' ? 0.35 : 1);
    if (canAct(f) || f.state === 'parry') {
      f.vx = mx * sp;
      f.vy = my * sp;
    } else if (f.state === 'slash' || f.state === 'heavy' || f.state === 'whirl') {
      f.vx *= Math.pow(0.32, dt * 5);
      f.vy *= Math.pow(0.32, dt * 5);
    } else {
      f.vx *= Math.pow(0.08, dt * 8);
      f.vy *= Math.pow(0.08, dt * 8);
    }
    f.x += f.vx * dt;
    f.y += f.vy * dt;
  }

  function tickFighter(f, dt) {
    if (!f) return;
    f.t += dt;
    f.anim += dt;
    if (f.inv > 0) f.inv -= dt;
    if (f.stepCd > 0) f.stepCd -= dt;
    if (f.counter > 0) f.counter -= dt;
    if (f.flashCut > 0) f.flashCut -= dt;
    if (f.atkCd > 0) f.atkCd -= dt;
    if (f.state !== 'dash' && f.state !== 'dead' && f.state !== 'whirl' && f.state !== 'slash' && f.state !== 'heavy') faceOther(f);

    if (f.state === 'slash' || f.state === 'heavy' || f.state === 'whirl') {
      if (f.state === 'whirl') f.ang += dt * 14;
      const end = f.startT + f.activeT + f.recT;
      if (f.t >= end) setState(f, 'idle');
    } else if (f.state === 'parry') {
      const hold = f.isPly && keys.parry;
      const max = parryDur() + (hold ? 0.14 : 0);
      if (f.t >= max) setState(f, 'idle');
    } else if (f.state === 'dash') {
      if (f.t >= 0.14) {
        f.vx *= 0.2;
        f.vy *= 0.2;
        setState(f, 'idle');
      }
    } else if (f.state === 'hurt') {
      if (f.t >= 0.22) setState(f, 'idle');
    } else if (f.state === 'stun') {
      if (f.t >= 0.42) setState(f, 'idle');
    }

    applyMove(f, dt);
    clampArena(f);
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.kind === 'ember' ? 90 : 40) * dt;
      p.a += p.spin * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.a += e.spin * dt;
      if (e.y < CY - ARENA - 10 || Math.hypot(e.x - CX, e.y - CY) > ARENA + 24) {
        const a = rand(0, TAU);
        const r = rand(30, ARENA - 10);
        e.x = CX + Math.cos(a) * r;
        e.y = CY + ARENA * 0.55 + rand(0, 30);
        e.vy = rand(-30, -10);
      }
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].life -= dt;
      if (ghosts[i].life <= 0) ghosts.splice(i, 1);
    }
    for (let i = arcs.length - 1; i >= 0; i--) {
      arcs[i].life -= dt;
      if (arcs[i].life <= 0) arcs.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].life -= dt;
      rings[i].r += dt * 90;
      if (rings[i].life <= 0) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].life -= dt;
      floats[i].y -= dt * 36;
      if (floats[i].life <= 0) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.35);
    if (G.callT > 0) G.callT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) dropCombo();
    }
  }

  function resetRoundFighters(keepPly) {
    const st = spec();
    const ang = rand(0, TAU);
    const px = CX + Math.cos(ang) * 78;
    const py = CY + Math.sin(ang) * 78;
    const fx = CX + Math.cos(ang + Math.PI) * 78;
    const fy = CY + Math.sin(ang + Math.PI) * 78;
    let hp = 100;
    if (keepPly && G.ply) hp = G.ply.hp;
    G.ply = makeFighter(true, st, px, py);
    if (keepPly) {
      G.ply.hp = hp;
      G.ply.hpMax = 100;
    }
    G.foe = makeFighter(false, st, fx, fy);
    faceOther(G.ply);
    faceOther(G.foe);
  }

  function beginRound() {
    G.phase = 'intro';
    G.phaseT = 0;
    G.roundT = 0;
    G.slashBuf = 0;
    G.heavyBuf = 0;
    G.parryBuf = 0;
    G.dashBuf = 0;
    G.charging = false;
    G.chargeT = 0;
    const st = spec();
    setCall(st.boss ? '刃王' : st.title, 0.95);
    toast(st.boss ? '刃王出阵' : '对上 ' + st.name, false, !!st.boss);
    if (st.boss) audio.boss();
    else audio.round();
    syncHud();
  }

  function nextRound() {
    G.round += 1;
    if (G.round >= ROUNDS.length) {
      winGame();
      return;
    }
    if (G.ply) {
      const heal = isBlood() ? 16 : 32;
      G.ply.hp = Math.min(100, G.ply.hp + heal);
    }
    resetRoundFighters(true);
    beginRound();
  }

  function koBonus() {
    const speed = Math.max(0, 720 - G.roundT * 42);
    const raw = 800 + 400 * G.round + speed;
    return Math.round(raw * (isBlood() ? 1.25 : 1));
  }

  function winGame() {
    G.mode = 'win';
    G.phase = 'end';
    addScore(isBlood() ? 9000 : 6000);
    audio.win();
    screenFlash(GOLD, 0.4);
    popChain('刃尽');
    const lead = '刃王倒下。分数 ' + G.score + (isBlood() ? '。血月已尽。' : '。再开血月更快更狠。');
    showOverlay('win', '刃尽', lead);
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.phase = 'end';
    audio.lose();
    showOverlay('lose', '刃折', '体力打空。分数 ' + G.score + '。R 再开一局。');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'blood' ? 'blood' : 'duel';
    G.mode = 'play';
    G.demo = false;
    G.round = 0;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    dropCombo();
    seedEmbers();
    particles.length = 0;
    ghosts.length = 0;
    arcs.length = 0;
    floats.length = 0;
    rings.length = 0;
    resetRoundFighters(false);
    hideOverlay();
    audio.start();
    beginRound();
    if (scoreEl) scoreEl.textContent = '0';
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'duel';
    G.demo = true;
    G.round = 0;
    G.phase = 'fight';
    G.score = 0;
    dropCombo();
    seedEmbers();
    resetRoundFighters(false);
    G.ply.hp = 100;
    G.foe.hp = 40;
    G.foe.spd *= 0.85;
    showOverlay('title', '战刃', '圆场对刃。空格斩，按住蓄重斩，Shift 格挡，X 冲步。过三局再打刃王。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('duel');
    else startGame(G.kind);
  }

  function queueSlash() {
    G.slashBuf = 0.22;
  }
  function queueHeavy() {
    G.heavyBuf = 0.22;
  }
  function queueParry() {
    G.parryBuf = 0.14;
  }
  function queueDash(ang) {
    G.dashBuf = 0.18;
    G.dashAng = ang;
  }

  function startCharge() {
    if (overlayOpen() && G.mode === 'title') return;
    if (G.mode !== 'play' || G.phase !== 'fight') return;
    keys.charge = true;
    G.charging = true;
    if (G.chargeT <= 0) G.chargeT = 0.001;
  }

  function releaseCharge() {
    keys.charge = false;
    if (!G.charging) return;
    G.charging = false;
    if (G.mode !== 'play' || overlayOpen()) {
      G.chargeT = 0;
      return;
    }
    if (G.chargeT >= 0.28) queueHeavy();
    else queueSlash();
    G.chargeT = 0;
  }

  function consumeBuffers() {
    const f = G.ply;
    if (!f || G.mode !== 'play' || G.phase !== 'fight') return;
    if (G.dashBuf > 0 && (canAct(f) || f.state === 'parry')) {
      let ang = G.dashAng;
      if (ang == null) {
        const a = moveAngFromKeys();
        ang = a != null ? a : f.ang;
      }
      if (doDash(f, ang)) G.dashBuf = 0;
    }
    if (G.heavyBuf > 0 && canAct(f)) {
      if (doSlash(f, true)) G.heavyBuf = 0;
    }
    if (G.slashBuf > 0 && canAct(f)) {
      if (doSlash(f, false)) G.slashBuf = 0;
    }
    if (G.parryBuf > 0 && canAct(f)) {
      if (doParry(f)) G.parryBuf = 0;
    }
    if (keys.parry && canAct(f) && f.counter <= 0) {
      doParry(f);
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.slashBuf > 0) G.slashBuf -= dt;
    if (G.heavyBuf > 0) G.heavyBuf -= dt;
    if (G.parryBuf > 0) G.parryBuf -= dt;
    if (G.dashBuf > 0) G.dashBuf -= dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }

    if (G.charging && G.mode === 'play' && G.phase === 'fight' && !overlayOpen()) {
      const was = G.chargeT;
      G.chargeT += dt;
      if (was < 0.28 && G.chargeT >= 0.28) audio.charge();
      if (G.chargeT >= 0.5) {
        G.charging = false;
        keys.charge = false;
        G.chargeT = 0;
        queueHeavy();
      }
    }

    if (G.demo && G.mode === 'title') {
      thinkFoe(G.foe, dt);
      thinkFoeDemoPly(dt);
      tickFighter(G.ply, dt);
      tickFighter(G.foe, dt);
      separate();
      resolveCombat();
      if (G.ply && G.ply.hp < 30) G.ply.hp = 100;
      if (G.foe && G.foe.hp < 12) G.foe.hp = 40;
      if (G.ply && G.ply.state === 'dead') setState(G.ply, 'idle');
      if (G.foe && G.foe.state === 'dead') setState(G.foe, 'idle');
      updateFx(dt);
      return;
    }

    if (G.mode !== 'play') {
      updateFx(dt);
      return;
    }

    G.phaseT += dt;
    if (G.phase === 'intro') {
      tickFighter(G.ply, dt);
      tickFighter(G.foe, dt);
      if (G.phaseT >= 0.95) {
        G.phase = 'fight';
        G.phaseT = 0;
        setCall('斩', 0.35);
      }
      updateFx(dt);
      return;
    }

    if (G.phase === 'fight') {
      G.roundT += dt;
      thinkFoe(G.foe, dt);
      consumeBuffers();
      tickFighter(G.ply, dt);
      tickFighter(G.foe, dt);
      separate();
      resolveCombat();
      if (G.foe && G.foe.state === 'dead') {
        G.phase = 'down';
        G.phaseT = 0;
        const pts = koBonus();
        addScore(pts);
        floatText(G.foe.x, G.foe.y - 28, '击倒 +' + pts, GOLD);
        toast(spec().boss ? '刃王倒下' : spec().name + ' 倒下', false, true);
      } else if (G.ply && G.ply.state === 'dead') {
        G.phase = 'fail';
        G.phaseT = 0;
      }
    } else if (G.phase === 'down') {
      tickFighter(G.ply, dt);
      tickFighter(G.foe, dt);
      if (G.phaseT >= 1.05) nextRound();
    } else if (G.phase === 'fail') {
      tickFighter(G.ply, dt);
      tickFighter(G.foe, dt);
      if (G.phaseT >= 0.72) loseGame();
    }

    updateFx(dt);
    if ((G.t * 8) % 1 < dt * 8) syncHud();
  }

  function thinkFoeDemoPly(dt) {
    const f = G.ply;
    const o = G.foe;
    if (!f || !o) return;
    f.atkCd = (f.atkCd || 0) - dt;
    if (!canAct(f)) return;
    const d = distTo(f, o);
    if (o.state === 'slash' && d < 70 && Math.random() < 0.35) {
      doParry(f);
      return;
    }
    if (d < 58 && f.atkCd <= 0 && Math.random() < 0.045) {
      doSlash(f, Math.random() < 0.25);
      f.atkCd = 0.62;
    }
  }

  function drawArena() {
    ctx.fillStyle = isBlood() ? '#140208' : '#100208';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(sx(0), sy(0));
    ctx.scale(scale, scale);

    const grd = ctx.createRadialGradient(CX, CY, 20, CX, CY, ARENA + 80);
    grd.addColorStop(0, isBlood() ? 'rgba(90, 8, 18, 0.55)' : 'rgba(48, 10, 16, 0.5)');
    grd.addColorStop(1, 'rgba(8, 2, 6, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(CX, CY, ARENA + 70, 0, TAU);
    ctx.fill();

    if (isBlood()) {
      ctx.fillStyle = 'rgba(255, 36, 16, 0.18)';
      ctx.beginPath();
      ctx.arc(CX + 110, CY - 92, 46, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 80, 40, 0.32)';
      ctx.beginPath();
      ctx.arc(CX + 118, CY - 96, 28, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = isBlood() ? '#2a0a10' : '#1c0a0e';
    ctx.beginPath();
    ctx.arc(CX, CY, ARENA, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(HOT, 0.45);
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.arc(CX, CY, ARENA, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.22);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(CX, CY, ARENA - 10, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(CYN, 0.16);
    ctx.beginPath();
    ctx.arc(CX, CY, 52, 0, TAU);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 36, 16, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8 + G.t * 0.05;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * 18, CY + Math.sin(a) * 18);
      ctx.lineTo(CX + Math.cos(a) * (ARENA - 14), CY + Math.sin(a) * (ARENA - 14));
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 90, 50, 0.22)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(CX - 40, CY - 8);
    ctx.lineTo(CX - 8, CY + 18);
    ctx.lineTo(CX + 30, CY - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(CX + 50, CY + 40);
    ctx.lineTo(CX + 12, CY + 22);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI * 0.5 - 0.2;
      const x = CX + Math.cos(a) * (ARENA + 18);
      const y = CY + Math.sin(a) * (ARENA + 18);
      ctx.fillStyle = rgba(INK, 0.9);
      ctx.fillRect(x - 3, y - 16, 6, 22);
      ctx.fillStyle = rgba(i % 2 ? HOT : GOLD, 0.7);
      ctx.beginPath();
      ctx.moveTo(x, y - 16);
      ctx.lineTo(x + 14, y - 8);
      ctx.lineTo(x, y - 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawEmbers() {
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      ctx.save();
      ctx.translate(sx(e.x), sy(e.y));
      ctx.rotate(e.a);
      ctx.fillStyle = rgba(e.rgb, 0.55);
      ctx.fillRect(-1.2 * e.s * scale, -2.4 * e.s * scale, 2.4 * e.s * scale, 4.8 * e.s * scale);
      ctx.restore();
    }
  }

  function bladeSwing(f) {
    if (f.state === 'whirl') return f.t * 16;
    if (f.state === 'slash' || f.state === 'heavy') {
      const p = clamp(f.t / Math.max(0.05, f.startT + f.activeT), 0, 1);
      return lerp(-1.2, 1.28, p);
    }
    if (f.state === 'parry') return -0.55;
    if (f.state === 'idle' || f.state === 'walk') return Math.sin(f.anim * 4) * 0.08;
    return 0;
  }

  function drawGhosts() {
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      const a = g.life / g.max;
      ctx.save();
      ctx.translate(sx(g.x), sy(g.y));
      ctx.scale(scale * g.scale, scale * g.scale);
      ctx.rotate(g.ang);
      ctx.globalAlpha = a * 0.35;
      ctx.fillStyle = rgba(g.rgb, 1);
      ctx.beginPath();
      ctx.ellipse(0, 0, g.rad, g.rad * 0.72, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawFighter(f) {
    if (!f) return;
    const flick = f.inv > 0 && f.state !== 'dead' && ((G.t * 22) | 0) % 2 === 0;
    ctx.save();
    ctx.translate(sx(f.x), sy(f.y));
    ctx.scale(scale * f.scale, scale * f.scale);
    ctx.rotate(f.ang);
    if (flick) ctx.globalAlpha = 0.42;
    if (f.state === 'dead') {
      ctx.globalAlpha = 0.7;
      ctx.rotate(0.5);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(2, 5, 15, 9, 0, 0, TAU);
    ctx.fill();

    if (f.kind === 'rider' || f.kind === 'king') {
      ctx.fillStyle = f.kind === 'king' ? rgba(HOT, 0.55) : rgba(MAG, 0.4);
      ctx.beginPath();
      ctx.ellipse(-10, 0, 10, 8, 0, 0, TAU);
      ctx.fill();
    }

    let body = INK;
    let trim = CYN;
    if (f.kind === 'scout') {
      body = [72, 28, 18];
      trim = COR;
    } else if (f.kind === 'guard') {
      body = [48, 52, 62];
      trim = STEEL;
    } else if (f.kind === 'rider') {
      body = [70, 12, 28];
      trim = MAG;
    } else if (f.kind === 'king') {
      body = [56, 10, 14];
      trim = GOLD;
    } else {
      body = [22, 36, 40];
      trim = CYN;
    }

    ctx.fillStyle = rgba(body, 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, f.rad * 0.95, f.rad * 0.7, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(trim, 0.85);
    ctx.lineWidth = 1.6;
    ctx.stroke();

    if (f.shield) {
      ctx.fillStyle = rgba(STEEL, 0.85);
      ctx.beginPath();
      ctx.ellipse(4, -11, 7, 9, 0.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = rgba(f.kind === 'king' ? GOLD : SKIN, 1);
    ctx.beginPath();
    ctx.arc(7, 0, 5.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(SKIN2, 1);
    ctx.beginPath();
    ctx.arc(8.2, 0.4, 3.4, 0, TAU);
    ctx.fill();

    if (f.kind === 'king') {
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.moveTo(10, -5);
      ctx.lineTo(14, -9);
      ctx.lineTo(12, -4);
      ctx.lineTo(16, -1);
      ctx.lineTo(11, 0);
      ctx.fill();
    }

    const sw = bladeSwing(f);
    ctx.save();
    ctx.rotate(sw);
    const len = f.heavyAtk || f.whirlAtk ? 34 : f.kind === 'guard' ? 24 : f.kind === 'scout' ? 28 : 30;
    const col = f.isPly ? STEEL : (f.kind === 'king' ? GOLD : f.kind === 'rider' ? MAG : COR);
    ctx.strokeStyle = rgba(col, 1);
    ctx.lineWidth = f.heavyAtk ? 4.2 : 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(10 + len, 0);
    ctx.stroke();
    ctx.strokeStyle = rgba(f.isPly ? CYN : HOT, 0.9);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(10 + len + 2, 0);
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(12, 0, 2.1, 0, TAU);
    ctx.fill();
    if (f.kind === 'king') {
      ctx.strokeStyle = rgba(HOT, 0.85);
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-22, 0);
      ctx.stroke();
    }
    ctx.restore();

    if (f.isPly && G.charging && G.chargeT > 0.04) {
      const r = 18 + G.chargeT * 10;
      ctx.strokeStyle = rgba(G.chargeT >= 0.28 ? GOLD : CYN, 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, r, -Math.PI * 0.5, -Math.PI * 0.5 + TAU * clamp(G.chargeT / 0.5, 0, 1));
      ctx.stroke();
    }

    ctx.restore();

    if (f.state !== 'dead' && G.mode === 'play') {
      const bw = 28 * scale;
      const bh = 4 * scale;
      const bx = sx(f.x) - bw * 0.5;
      const by = sy(f.y) - (f.rad + 14) * scale * f.scale;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = rgba(f.isPly ? CYN : HOT, 0.95);
      ctx.fillRect(bx, by, bw * clamp(f.hp / f.hpMax, 0, 1), bh);
    }
  }

  function drawFx() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = r.life / r.max;
      ctx.strokeStyle = rgba(r.rgb, a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), r.r * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      const t = a.life / a.max;
      ctx.save();
      ctx.translate(sx(a.x), sy(a.y));
      ctx.rotate(a.ang);
      ctx.strokeStyle = rgba(a.rgb, t);
      ctx.lineWidth = (a.heavy ? 5 : 3.2) * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, (a.heavy ? 34 : 26) * scale, -0.9, 0.9);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.rotate(p.a);
      ctx.fillStyle = rgba(p.rgb, a);
      const s = p.r * scale;
      if (p.kind === 'ember') {
        ctx.fillRect(-s * 0.4, -s, s * 0.8, s * 2);
      } else {
        ctx.fillRect(-s, -s * 0.35, s * 2.4, s * 0.7);
      }
      ctx.restore();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(f.life / 0.72, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = '700 ' + Math.round(13 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.globalAlpha = 1;
    }
  }

  function drawCall() {
    if (G.callT <= 0 || !G.call) return;
    const a = G.callT > 0.7 ? 1 : G.callT / 0.7;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#fff4e0';
    ctx.textAlign = 'center';
    ctx.font = '900 ' + Math.round(42 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.shadowColor = rgba(HOT, 0.7);
    ctx.shadowBlur = 18;
    ctx.fillText(G.call, sx(CX), sy(CY - 8));
    ctx.restore();
  }

  function draw() {
    const skx = G.shake ? rand(-G.shake, G.shake) * 0.6 : 0;
    const sky = G.shake ? rand(-G.shake, G.shake) * 0.4 : 0;
    ctx.setTransform(dpr, 0, 0, dpr, skx * dpr, sky * dpr);
    if (G.punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }
    drawArena();
    drawEmbers();
    drawGhosts();
    if (G.foe) drawFighter(G.foe);
    if (G.ply) drawFighter(G.ply);
    drawFx();
    drawCall();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(0, 0, W, H);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      pointer.down = true;
      pointer.id = e.pointerId;
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      pointer.x0 = w.x;
      pointer.y0 = w.y;
      pointer.t0 = G.clock;
      pointer.moved = false;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      if (pointer.down && Math.hypot(w.x - pointer.x0, w.y - pointer.y0) > 14) pointer.moved = true;
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      if (pointer.down && G.mode === 'play' && !overlayOpen()) {
        const dt = G.clock - pointer.t0;
        const dx = pointer.x - pointer.x0;
        const dy = pointer.y - pointer.y0;
        const mag = Math.hypot(dx, dy);
        if (mag > 52 && dt < 0.28) queueDash(Math.atan2(dy, dx));
        else if (dt < 0.22 && mag < 18) queueSlash();
      }
      pointer.down = false;
      pointer.id = null;
      pointer.moved = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
  }

  function holdBtn(el, downFn, upFn) {
    if (!el) return;
    const down = function (e) {
      e.preventDefault();
      audio.ensure();
      el.classList.add('held');
      downFn();
    };
    const up = function (e) {
      if (e) e.preventDefault();
      el.classList.remove('held');
      if (upFn) upFn();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  function onDir(which, down) {
    keys[which] = down;
    if (!down || overlayOpen() || G.mode !== 'play') return;
    const now = G.clock;
    if (now - tapAt[which] < 0.22) {
      const ang = which === 'l' ? Math.PI : which === 'r' ? 0 : which === 'u' ? -Math.PI * 0.5 : Math.PI * 0.5;
      queueDash(ang);
    }
    tapAt[which] = now;
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'r' || k === 'R') {
      if (down) {
        e.preventDefault();
        restart();
      }
      return;
    }
    if (k === 'm' || k === 'M') {
      if (down) {
        e.preventDefault();
        audio.ensure();
        audio.setMuted(!audio.muted);
      }
      return;
    }
    if (overlayOpen()) {
      if (down && G.mode === 'title') {
        if (k === 'Enter' || k === ' ' || k === '1') {
          e.preventDefault();
          audio.ensure();
          startGame('duel');
          return;
        }
        if (k === '2') {
          e.preventDefault();
          audio.ensure();
          startGame('blood');
          return;
        }
      }
      if (k === ' ' || k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown') {
        e.preventDefault();
      }
      return;
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      e.preventDefault();
      if (down && e.repeat) { keys.l = true; return; }
      onDir('l', down);
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      e.preventDefault();
      if (down && e.repeat) { keys.r = true; return; }
      onDir('r', down);
    } else if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      e.preventDefault();
      if (down && e.repeat) { keys.u = true; return; }
      onDir('u', down);
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      e.preventDefault();
      if (down && e.repeat) { keys.d = true; return; }
      onDir('d', down);
    } else if (k === ' ' ) {
      e.preventDefault();
      if (e.repeat) return;
      if (down) startCharge();
      else releaseCharge();
    } else if (k === 'Shift' || k === 'z' || k === 'Z') {
      e.preventDefault();
      keys.parry = down;
      if (down) queueParry();
    } else if (k === 'x' || k === 'X' || k === 'Control') {
      e.preventDefault();
      if (down && !e.repeat) {
        const a = moveAngFromKeys();
        queueDash(a != null ? a : (G.ply ? G.ply.ang : 0));
      }
    }
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

  if (btnDuel) {
    btnDuel.addEventListener('click', function () {
      audio.ensure();
      startGame('duel');
    });
  }
  if (btnBlood) {
    btnBlood.addEventListener('click', function () {
      audio.ensure();
      startGame('blood');
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
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && isBlood()) goTitle();
      else if (G.mode === 'win') startGame('blood');
      else goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }

  holdBtn(btnLeft, function () { onDir('l', true); }, function () { onDir('l', false); });
  holdBtn(btnRight, function () { onDir('r', true); }, function () { onDir('r', false); });
  holdBtn(btnUp, function () { onDir('u', true); }, function () { onDir('u', false); });
  holdBtn(btnDown, function () { onDir('d', true); }, function () { onDir('d', false); });
  holdBtn(btnSlash, function () { startCharge(); }, function () { releaseCharge(); });
  holdBtn(btnParry, function () { keys.parry = true; queueParry(); }, function () { keys.parry = false; });
  holdBtn(btnDash, function () {
    const a = moveAngFromKeys();
    queueDash(a != null ? a : (G.ply ? G.ply.ang : 0));
  }, null);

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
      keys.parry = false;
      keys.charge = false;
      G.charging = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
