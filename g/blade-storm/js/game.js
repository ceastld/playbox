'use strict';

(function () {
  const VW = 720;
  const VH = 420;
  const CX = 360;
  const CY = 214;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const BEST_KEY = 'playbox-blade-storm-best';
  const MUTE_KEY = 'playbox-blade-storm-mute';
  const OPS = '方向 / WASD 走 · 空格斩 · Shift / Z 格挡 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 138];
  const GOLD = [255, 227, 107];
  const HOT = [255, 42, 86];
  const COR = [255, 106, 136];
  const WHT = [255, 240, 242];
  const CYN = [78, 235, 216];
  const STEEL = [208, 200, 216];
  const INK = [42, 10, 18];
  const SKIN = [236, 196, 188];
  const SKIN2 = [196, 140, 132];

  const KINDS = {
    cut: {
      id: 'cut', name: '刃卒', hp: 10, rad: 13, spd: 98, dmg: 12,
      range: 40, start: 0.14, active: 0.11, rec: 0.28, atkGap: 0.72,
      score: 180, scale: 0.96, think: 0.16
    },
    bow: {
      id: 'bow', name: '弓影', hp: 20, rad: 13, spd: 76, dmg: 10,
      range: 168, start: 0.22, active: 0.08, rec: 0.36, atkGap: 1.28,
      score: 280, scale: 1.0, think: 0.18, shooter: true
    },
    spin: {
      id: 'spin', name: '旋刃', hp: 28, rad: 15, spd: 48, dmg: 16,
      range: 52, start: 0.34, active: 0.62, rec: 0.42, atkGap: 1.55,
      score: 360, scale: 1.08, think: 0.2, charger: true
    },
    boss: {
      id: 'boss', name: '暴王', hp: 108, rad: 22, spd: 82, dmg: 18,
      range: 58, start: 0.16, active: 0.14, rec: 0.28, atkGap: 0.78,
      score: 0, scale: 1.38, think: 0.12, boss: true
    }
  };

  const STAGES = [
    {
      id: 'tide', name: '刃潮', title: '第 1 关',
      waves: [
        { wait: 0.35, pack: [['cut', 4]] },
        { wait: 0.48, pack: [['cut', 6]] },
        { wait: 0.52, pack: [['cut', 8]] }
      ]
    },
    {
      id: 'rain', name: '弹雨', title: '第 2 关',
      waves: [
        { wait: 0.4, pack: [['cut', 4], ['bow', 2]] },
        { wait: 0.5, pack: [['cut', 5], ['bow', 3]] },
        { wait: 0.55, pack: [['cut', 4], ['bow', 4]] }
      ]
    },
    {
      id: 'spin', name: '旋杀', title: '第 3 关',
      waves: [
        { wait: 0.4, pack: [['cut', 3], ['bow', 2], ['spin', 1]] },
        { wait: 0.5, pack: [['cut', 4], ['bow', 2], ['spin', 2]] },
        { wait: 0.55, pack: [['cut', 3], ['bow', 3], ['spin', 2]] }
      ]
    },
    {
      id: 'king', name: '暴王', title: '暴王', boss: true,
      waves: [{ wait: 0.55, pack: [['boss', 1]] }]
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
  const btnStorm = document.getElementById('btn-storm');
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
  let slashSeq = 1;

  const keys = { l: false, r: false, u: false, d: false, parry: false };
  const pointer = { down: false, x: CX, y: CY, id: null, t0: 0, x0: 0, y0: 0, moved: false };
  const particles = [];
  const embers = [];
  const ghosts = [];
  const arcs = [];
  const floats = [];
  const rings = [];
  const foes = [];
  const shots = [];

  const G = {
    mode: 'title',
    kind: 'storm',
    t: 0,
    clock: 0,
    stage: 0,
    wave: 0,
    phase: 'intro',
    phaseT: 0,
    stageT: 0,
    ply: null,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    slashBuf: 0,
    parryBuf: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    call: '',
    callT: 0,
    demo: false,
    stageHp: 1,
    stageHpMax: 1,
    spawned: 0
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
    return STAGES[Math.min(STAGES.length - 1, G.stage)] || STAGES[0];
  }
  function spdMul() {
    return isBlood() ? 1.22 : 1;
  }
  function hpMul() {
    return isBlood() ? 1.16 : 1;
  }
  function parryWin() {
    return isBlood() ? 0.15 : 0.22;
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
      this.noise(0.06, 0.04, 1400);
      this.beep(420, 0.08, 'sine', 0.03, 140);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.6, combo * 0.05);
      this.noise(0.04, 0.05, 880);
      this.beep(560 * lift, 0.08, 'square', 0.052, 980 * lift);
    },
    spark() {
      this.ensure();
      this.noise(0.03, 0.03, 2200);
      this.beep(1480, 0.07, 'triangle', 0.04, 2200);
    },
    parry() {
      this.ensure();
      this.noise(0.05, 0.05, 1900);
      this.beep(1080, 0.09, 'square', 0.056, 1720);
      this.beep(1540, 0.12, 'triangle', 0.038, 2140);
    },
    hurt() {
      this.ensure();
      this.noise(0.07, 0.042, 380);
      this.beep(168, 0.14, 'sawtooth', 0.04, 60);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.06, 240);
      this.beep(220, 0.24, 'sawtooth', 0.05, 52);
      this.beep(90, 0.36, 'sine', 0.045, 30);
    },
    combo(m) {
      this.ensure();
      this.beep(480 * m, 0.08, 'sine', 0.04, 720 * m);
      this.beep(960, 0.12, 'triangle', 0.03, 1440);
    },
    boss() {
      this.ensure();
      this.beep(140, 0.2, 'sawtooth', 0.052, 68);
      this.beep(88, 0.32, 'square', 0.04, 44);
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
    whirl() {
      this.ensure();
      this.noise(0.16, 0.055, 220);
      this.beep(80, 0.3, 'sawtooth', 0.05, 40);
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
    if ((G.mode !== 'play' && !G.demo) || n <= 0) return;
    if (G.demo) return;
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

  function aliveFoes() {
    let n = 0;
    for (let i = 0; i < foes.length; i++) if (foes[i].hp > 0) n += 1;
    return n;
  }

  function bossFoe() {
    for (let i = 0; i < foes.length; i++) if (foes[i].boss && foes[i].hp > 0) return foes[i];
    return null;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    const st = spec();
    if (stageLabel) {
      stageLabel.textContent = st.title;
      stageLabel.classList.toggle('hot', !!st.boss || G.stage >= 2);
    }
    if (tagLabel) {
      tagLabel.textContent = isBlood() ? '血月' : '刃暴';
      tagLabel.classList.toggle('warn', isBlood());
    }
    if (G.ply) fillBar(hpBar, G.ply.hp / G.ply.hpMax);
    const boss = bossFoe();
    if (boss) {
      if (foeName) foeName.textContent = '暴王';
      fillBar(foeBar, boss.hp / boss.hpMax);
    } else {
      if (foeName) foeName.textContent = '潮';
      fillBar(foeBar, G.stageHpMax > 0 ? G.stageHp / G.stageHpMax : 1);
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 体力打空本局结束', 'warn');
    else if (G.mode === 'win') setHint('暴尽 · R 再来一局', 'hot');
    else if (G.ply && G.ply.hp / G.ply.hpMax < 0.34) setHint('残血 · 格挡弹刃，再反斩冲潮', 'warn');
    else setHint(st.boss ? '暴王 · 空格斩弹幕 · Shift 挡旋刃' : '空格斩 · Shift 挡 · 把弹幕劈成火花', st.boss ? 'hot' : '');
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) ovKicker.textContent = kind === 'title' ? 'BSTM' : kind === 'win' ? 'CLEAR' : 'DOWN';
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = OPS;
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
    capArr(particles, REDUCE ? 70 : 240);
  }

  function burstSpark(x, y, n, rgb) {
    emit(n, {
      x: x, y: y, vx: 0, vy: 0, jv: 220, spread: 6,
      life: rand(0.28, 0.55), r: rand(1.6, 3.4), rgb: rgb || GOLD, kind: 'spark'
    });
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb || WHT, life: 0.72, vy: -42 });
    capArr(floats, 18);
  }

  function addRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, rgb: rgb || GOLD, r: r || 10, life: 0.38, max: 0.38 });
    capArr(rings, 16);
  }

  function addArc(x, y, ang, rgb, counter) {
    arcs.push({
      x: x, y: y, ang: ang, rgb: rgb || HOT,
      life: counter ? 0.22 : 0.16, max: counter ? 0.22 : 0.16,
      counter: !!counter
    });
    capArr(arcs, 12);
  }

  function addGhost(x, y, ang, scaleG) {
    ghosts.push({ x: x, y: y, ang: ang, life: 0.18, max: 0.18, scale: scaleG || 1 });
    capArr(ghosts, REDUCE ? 8 : 22);
  }

  function seedEmbers() {
    embers.length = 0;
    const n = REDUCE ? 10 : 22;
    for (let i = 0; i < n; i++) {
      embers.push({
        x: rand(20, VW - 20),
        y: rand(20, VH - 20),
        vx: rand(-18, 18),
        vy: rand(-28, -6),
        a: rand(0, TAU),
        s: rand(0.6, 1.4),
        rgb: Math.random() < 0.45 ? HOT : (Math.random() < 0.5 ? GOLD : MAG)
      });
    }
  }

  function bound(e, pad) {
    const p = pad || 28;
    e.x = clamp(e.x, p, VW - p);
    e.y = clamp(e.y, p, VH - p);
  }

  function makePly() {
    return {
      x: CX,
      y: CY + 56,
      vx: 0,
      vy: 0,
      ang: -Math.PI * 0.5,
      hp: 100,
      hpMax: 100,
      rad: 14,
      state: 'idle',
      t: 0,
      inv: 0,
      slashCd: 0,
      parryCd: 0,
      counter: 0,
      hitId: 0,
      slashHits: 0,
      sparkHits: 0,
      anim: 0,
      face: -Math.PI * 0.5,
      isPly: true
    };
  }

  function makeFoe(kind, x, y) {
    const k = KINDS[kind] || KINDS.cut;
    const hp = Math.round(k.hp * hpMul());
    return {
      kind: k.id,
      name: k.name,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      ang: Math.atan2(CY - y, CX - x),
      hp: hp,
      hpMax: hp,
      rad: k.rad,
      spd: k.spd * spdMul(),
      dmg: Math.round(k.dmg * (isBlood() ? 1.1 : 1)),
      range: k.range,
      startT: k.start,
      activeT: k.active,
      recT: k.rec,
      atkGap: isBlood() ? k.atkGap * 0.78 : k.atkGap,
      score: k.score,
      scale: k.scale,
      shooter: !!k.shooter,
      charger: !!k.charger,
      boss: !!k.boss,
      state: 'idle',
      t: 0,
      thinkT: rand(0, k.think),
      atkCd: rand(0.2, 0.7),
      hitFlash: 0,
      stagger: 0,
      phase: 0,
      anim: rand(0, TAU)
    };
  }

  function spawnEdge(kind) {
    let x = 40;
    let y = 40;
    const ply = G.ply;
    for (let n = 0; n < 8; n++) {
      const side = (Math.random() * 4) | 0;
      if (side === 0) { x = rand(50, VW - 50); y = 36; }
      else if (side === 1) { x = VW - 36; y = rand(50, VH - 50); }
      else if (side === 2) { x = rand(50, VW - 50); y = VH - 36; }
      else { x = 36; y = rand(50, VH - 50); }
      if (!ply || Math.hypot(x - ply.x, y - ply.y) > 90) break;
    }
    if (kind === 'boss') {
      x = CX;
      y = 92;
    }
    const f = makeFoe(kind, x, y);
    foes.push(f);
    addRing(x, y, f.boss ? GOLD : HOT, f.boss ? 28 : 14);
    return f;
  }

  function spawnPack(pack) {
    const extra = isBlood() ? 1 : 0;
    let hp = 0;
    for (let i = 0; i < pack.length; i++) {
      const id = pack[i][0];
      let n = pack[i][1];
      if (id !== 'boss') n += extra;
      for (let k = 0; k < n; k++) {
        const f = spawnEdge(id);
        hp += f.hpMax;
        G.spawned += 1;
      }
    }
    G.stageHp += hp;
    G.stageHpMax += hp;
  }

  function clearWorld() {
    foes.length = 0;
    shots.length = 0;
    particles.length = 0;
    ghosts.length = 0;
    arcs.length = 0;
    floats.length = 0;
    rings.length = 0;
  }

  function moveAngFromKeys() {
    let x = 0;
    let y = 0;
    if (keys.l) x -= 1;
    if (keys.r) x += 1;
    if (keys.u) y -= 1;
    if (keys.d) y += 1;
    if (pointer.down && pointer.moved) {
      const dx = pointer.x - (G.ply ? G.ply.x : CX);
      const dy = pointer.y - (G.ply ? G.ply.y : CY);
      if (Math.hypot(dx, dy) > 8) {
        x += dx;
        y += dy;
      }
    }
    if (x === 0 && y === 0) return null;
    return Math.atan2(y, x);
  }

  function canAct(p) {
    return p && p.hp > 0 && (p.state === 'idle' || p.state === 'walk');
  }

  function setState(e, st) {
    e.state = st;
    e.t = 0;
  }

  function distTo(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function inCone(px, py, ang, range, half, tx, ty, rad) {
    const dx = tx - px;
    const dy = ty - py;
    const d = Math.hypot(dx, dy);
    if (d > range + (rad || 0)) return false;
    if (d < 8) return true;
    return Math.abs(angDiff(Math.atan2(dy, dx), ang)) <= half;
  }

  function slashDmg(p) {
    return p.counter > 0 ? 18 : 12;
  }

  function doSlash(p) {
    if (!p || p.hp <= 0) return false;
    if (p.slashCd > 0 && p.state !== 'idle' && p.state !== 'walk' && p.state !== 'parry') return false;
    const a = moveAngFromKeys();
    if (a != null) p.ang = a;
    else p.ang = p.face;
    p.face = p.ang;
    slashSeq += 1;
    p.hitId = slashSeq;
    p.slashHits = 0;
    p.sparkHits = 0;
    p.slashCd = 0.26;
    setState(p, 'slash');
    audio.swing();
    addArc(p.x, p.y, p.ang, p.counter > 0 ? GOLD : HOT, p.counter > 0);
    kick(3.2, 'slash');
    return true;
  }

  function doParry(p) {
    if (!p || p.hp <= 0) return false;
    if (p.parryCd > 0) return false;
    setState(p, 'parry');
    p.parryCd = parryWin() + 0.2;
    return true;
  }

  function hurtPly(dmg, fromX, fromY) {
    const p = G.ply;
    if (!p || p.hp <= 0 || p.inv > 0) return;
    if (p.state === 'slash' && p.t < 0.14) return;
    if (p.state === 'parry' && p.t <= parryWin()) {
      succeedParry(fromX, fromY);
      return;
    }
    p.hp = Math.max(0, p.hp - dmg);
    p.inv = 0.34;
    dropCombo();
    setState(p, 'hurt');
    const ang = Math.atan2(p.y - fromY, p.x - fromX);
    p.vx = Math.cos(ang) * 140;
    p.vy = Math.sin(ang) * 140;
    audio.hurt();
    kick(5.5, 'hit');
    hitStop(0.048);
    screenFlash(MAG, 0.32);
    burstSpark(p.x, p.y, 10, MAG);
    floatText(p.x, p.y - 20, '-' + dmg, MAG);
    if (p.hp <= 0) {
      setState(p, 'dead');
      audio.death();
      kick(8, 'die');
      hitStop(0.074);
      burstSpark(p.x, p.y, 22, HOT);
      G.phase = 'fail';
      G.phaseT = 0;
    }
    syncHud();
  }

  function succeedParry(x, y) {
    const p = G.ply;
    if (!p) return;
    p.counter = 0.55;
    audio.parry();
    hitStop(0.056);
    kick(5.2, 'parry');
    screenFlash(GOLD, 0.28);
    addRing(p.x, p.y, GOLD, 22);
    burstSpark(x || p.x, y || p.y, 12, GOLD);
    bumpCombo();
    addScore(140 * G.mult);
    floatText(p.x, p.y - 26, '挡', GOLD);
    setCall('挡', 0.28);
  }

  function hitFoe(f, dmg, fromAng) {
    if (!f || f.hp <= 0) return false;
    f.hp = Math.max(0, f.hp - dmg);
    f.hitFlash = 0.12;
    f.stagger = Math.max(f.stagger, f.boss ? 0.08 : 0.18);
    const knock = f.boss ? 40 : 120;
    f.vx += Math.cos(fromAng) * knock;
    f.vy += Math.sin(fromAng) * knock;
    G.stageHp = Math.max(0, G.stageHp - dmg);
    bumpCombo();
    const pts = Math.round(80 * G.mult);
    addScore(pts);
    burstSpark(f.x, f.y, f.boss ? 14 : 8, GOLD);
    floatText(f.x, f.y - 16, '' + pts, GOLD);
    audio.hit(G.combo);
    if (f.hp <= 0) {
      addScore(Math.round(f.score * G.mult));
      burstSpark(f.x, f.y, f.boss ? 28 : 16, HOT);
      addRing(f.x, f.y, HOT, f.boss ? 36 : 16);
      floatText(f.x, f.y - 30, f.boss ? '暴王' : '斩', HOT);
      if (f.boss) {
        G.phase = 'bossdown';
        G.phaseT = 0;
        hitStop(0.078);
        kick(8, 'die');
        audio.whirl();
      } else {
        hitStop(0.046);
      }
    }
    return true;
  }

  function reflectShot(s) {
    s.reflected = true;
    s.vx *= -1.15;
    s.vy *= -1.15;
    s.rgb = CYN;
    s.life = 1.4;
  }

  function fireShot(x, y, ang, spd, dmg, fromBoss) {
    shots.push({
      x: x,
      y: y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      rad: fromBoss ? 5.5 : 4.2,
      dmg: dmg,
      life: 2.4,
      fromBoss: !!fromBoss,
      reflected: false,
      rgb: fromBoss ? GOLD : MAG,
      a: ang
    });
    capArr(shots, 48);
  }

  function beginStage() {
    const st = spec();
    G.wave = 0;
    G.phase = 'intro';
    G.phaseT = 0;
    G.stageT = 0;
    G.stageHp = 0;
    G.stageHpMax = 0;
    G.spawned = 0;
    setCall(st.name, 0.7);
    toast(st.boss ? '暴王来了' : st.name, false, !!st.boss);
    audio.round();
    if (st.boss) audio.boss();
    syncHud();
  }

  function spawnCurrentWave() {
    const st = spec();
    const w = st.waves[G.wave];
    if (!w) return;
    spawnPack(w.pack);
    G.phase = 'fight';
    G.phaseT = 0;
    syncHud();
  }

  function nextWaveOrStage() {
    const st = spec();
    if (G.wave + 1 < st.waves.length) {
      G.wave += 1;
      G.phase = 'clear';
      G.phaseT = 0;
      const pts = Math.round((500 + 150 * G.wave) * (isBlood() ? 1.15 : 1));
      addScore(pts);
      floatText(CX, CY - 20, '清波 +' + pts, CYN);
      return;
    }
    if (G.stage + 1 < STAGES.length) {
      const pts = 800;
      addScore(pts);
      toast(st.name + ' 已破', false, true);
      const p = G.ply;
      if (p) {
        const heal = isBlood() ? 16 : 32;
        p.hp = Math.min(p.hpMax, p.hp + heal);
      }
      G.stage += 1;
      beginStage();
      return;
    }
    G.phase = 'bossdown';
    G.phaseT = 0;
  }

  function winGame() {
    addScore(isBlood() ? 9000 : 6000);
    G.mode = 'win';
    G.phase = 'end';
    audio.win();
    screenFlash(GOLD, 0.4);
    popChain('暴尽');
    const lead = '暴王倒下。分数 ' + G.score + (isBlood() ? '。血月已尽。' : '。再开血月更快更密。');
    showOverlay('win', '暴尽', lead);
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.phase = 'end';
    audio.lose();
    showOverlay('lose', '潮没', '体力打空。分数 ' + G.score + '。R 再开一局。');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'blood' ? 'blood' : 'storm';
    G.mode = 'play';
    G.demo = false;
    G.stage = 0;
    G.wave = 0;
    G.score = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    dropCombo();
    seedEmbers();
    clearWorld();
    G.ply = makePly();
    hideOverlay();
    audio.start();
    beginStage();
    if (scoreEl) scoreEl.textContent = '0';
    syncHud();
  }

  function demoPack() {
    clearWorld();
    G.ply = makePly();
    G.ply.hp = 100;
    spawnEdge('cut');
    spawnEdge('cut');
    spawnEdge('bow');
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'storm';
    G.demo = true;
    G.stage = 0;
    G.phase = 'fight';
    G.score = 0;
    dropCombo();
    seedEmbers();
    demoPack();
    showOverlay('title', '刃暴', '冲进刃潮。空格连斩，把弹幕劈成火花。Shift 格挡。三关后再打暴王。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('storm');
    else startGame(G.kind);
  }

  function queueSlash() {
    G.slashBuf = 0.22;
  }
  function queueParry() {
    G.parryBuf = 0.2;
  }

  function tickPly(p, dt) {
    if (!p) return;
    p.t += dt;
    p.anim += dt;
    if (p.inv > 0) p.inv -= dt;
    if (p.slashCd > 0) p.slashCd -= dt;
    if (p.parryCd > 0) p.parryCd -= dt;
    if (p.counter > 0) p.counter -= dt;
    p.vx *= 0.82;
    p.vy *= 0.82;

    if (p.state === 'dead') {
      p.vx *= 0.9;
      p.vy *= 0.9;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      bound(p, 24);
      return;
    }

    if (p.state === 'hurt') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      bound(p, 24);
      if (p.t >= 0.22) setState(p, 'idle');
      return;
    }

    if (p.state === 'slash') {
      const dash = p.counter > 0 ? 780 : 680;
      p.vx = Math.cos(p.ang) * dash;
      p.vy = Math.sin(p.ang) * dash;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      bound(p, 24);
      if (!REDUCE && (p.t * 28) % 1 < dt * 28) addGhost(p.x, p.y, p.ang, 1);
      resolveSlash(p);
      if (p.t >= 0.14) {
        p.vx *= 0.35;
        p.vy *= 0.35;
        if (p.slashHits >= 3) {
          popChain(p.slashHits + ' 连斩');
          hitStop(0.062);
        } else if (p.sparkHits >= 4) {
          popChain('火花 ×' + p.sparkHits);
        }
        setState(p, 'idle');
      }
      return;
    }

    if (p.state === 'parry') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      bound(p, 24);
      if (p.t >= parryWin() + 0.08) setState(p, 'idle');
      return;
    }

    const a = moveAngFromKeys();
    const spd = (isBlood() ? 214 : 182) * (p.counter > 0 ? 1.08 : 1);
    if (a != null && !overlayOpen()) {
      p.ang = a;
      p.face = a;
      p.vx = Math.cos(a) * spd;
      p.vy = Math.sin(a) * spd;
      p.state = 'walk';
    } else {
      p.state = 'idle';
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    bound(p, 24);
  }

  function resolveSlash(p) {
    const range = p.counter > 0 ? 78 : 68;
    const half = p.counter > 0 ? 1.18 : 1.05;
    const dmg = slashDmg(p);
    for (let i = 0; i < foes.length; i++) {
      const f = foes[i];
      if (f.hp <= 0) continue;
      if (f._hit === p.hitId) continue;
      if (!inCone(p.x, p.y, p.ang, range, half, f.x, f.y, f.rad)) continue;
      f._hit = p.hitId;
      p.slashHits += 1;
      hitFoe(f, dmg, p.ang);
      hitStop(p.counter > 0 ? 0.066 : 0.05);
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      if (s.reflected) continue;
      if (!inCone(p.x, p.y, p.ang, range + 8, half, s.x, s.y, s.rad)) continue;
      p.sparkHits += 1;
      bumpCombo();
      addScore(40 * G.mult);
      burstSpark(s.x, s.y, 8, CYN);
      audio.spark();
      shots.splice(i, 1);
      hitStop(0.03);
    }
  }

  function thinkFoe(f, dt) {
    if (f.hp <= 0) return;
    const p = G.ply;
    if (!p) return;
    f.thinkT -= dt;
    f.atkCd -= dt;
    f.anim += dt;
    if (f.hitFlash > 0) f.hitFlash -= dt;
    if (f.stagger > 0) {
      f.stagger -= dt;
      f.vx *= 0.86;
      f.vy *= 0.86;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      bound(f, 26);
      return;
    }

    if (f.state === 'slash' || f.state === 'shoot' || f.state === 'charge' || f.state === 'whirl' || f.state === 'spray') {
      tickFoeAct(f, dt, p);
      return;
    }

    if (f.thinkT > 0) {
      wanderToward(f, p, dt);
      return;
    }
    f.thinkT = 0.12 + Math.random() * 0.1;

    if (f.boss) {
      thinkBoss(f, p, dt);
      return;
    }
    if (f.charger) {
      thinkSpin(f, p);
      return;
    }
    if (f.shooter) {
      thinkBow(f, p, dt);
      return;
    }
    thinkCut(f, p, dt);
  }

  function wanderToward(f, p, dt) {
    const dx = p.x - f.x;
    const dy = p.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    let ax = dx / d;
    let ay = dy / d;
    if (f.shooter && d < 150) {
      ax = -ax;
      ay = -ay;
    }
    if (f.shooter && d > 90 && d < 190) {
      ax = -dy / d;
      ay = dx / d;
    }
    const spd = f.spd * (f.state === 'walk' || f.state === 'idle' ? 1 : 0.4);
    f.vx = ax * spd;
    f.vy = ay * spd;
    f.ang = Math.atan2(p.y - f.y, p.x - f.x);
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    bound(f, 26);
    if (f.state === 'idle') f.state = 'walk';
  }

  function thinkCut(f, p, dt) {
    const d = distTo(f, p);
    f.ang = Math.atan2(p.y - f.y, p.x - f.x);
    if (d < f.range && f.atkCd <= 0) {
      setState(f, 'slash');
      f.atkCd = f.atkGap;
      return;
    }
    wanderToward(f, p, dt);
  }

  function thinkBow(f, p, dt) {
    const d = distTo(f, p);
    f.ang = Math.atan2(p.y - f.y, p.x - f.x);
    if (d > 88 && d < 240 && f.atkCd <= 0) {
      setState(f, 'shoot');
      f.atkCd = f.atkGap;
      return;
    }
    wanderToward(f, p, dt);
  }

  function thinkSpin(f, p) {
    f.ang = Math.atan2(p.y - f.y, p.x - f.x);
    if (f.atkCd <= 0) {
      setState(f, 'charge');
      f.atkCd = f.atkGap;
      f.chargeAng = f.ang;
      return;
    }
    wanderToward(f, p, 1 / 60);
  }

  function thinkBoss(f, p, dt) {
    const ratio = f.hp / f.hpMax;
    f.ang = Math.atan2(p.y - f.y, p.x - f.x);
    if (ratio < 0.34 && f.phase < 2) {
      f.phase = 2;
      setState(f, 'whirl');
      audio.whirl();
      toast('暴王旋刃', true, false);
      return;
    }
    if (ratio < 0.66 && f.phase < 1) {
      f.phase = 1;
      setState(f, 'spray');
      spawnEdge('cut');
      spawnEdge('cut');
      toast('刃潮增援', false, false);
      return;
    }
    if (f.atkCd > 0) {
      wanderToward(f, p, dt);
      return;
    }
    const d = distTo(f, p);
    const r = Math.random();
    if (d < 70 && r < 0.55) {
      setState(f, 'slash');
      f.atkCd = f.atkGap;
    } else if (r < 0.72) {
      setState(f, 'spray');
      f.atkCd = f.atkGap + 0.35;
    } else {
      setState(f, 'charge');
      f.chargeAng = f.ang;
      f.atkCd = f.atkGap + 0.2;
    }
  }

  function tickFoeAct(f, dt, p) {
    f.t += dt;
    if (f.state === 'slash') {
      if (f.t < f.startT) {
        wanderToward(f, p, dt * 0.35);
        return;
      }
      if (f.t < f.startT + f.activeT) {
        const dash = f.boss ? 240 : 90;
        f.x += Math.cos(f.ang) * dash * dt;
        f.y += Math.sin(f.ang) * dash * dt;
        bound(f, 26);
        tryMelee(f, p);
        return;
      }
      if (f.t >= f.startT + f.activeT + f.recT) setState(f, 'idle');
      return;
    }
    if (f.state === 'shoot') {
      if (f.t >= f.startT && f.t - dt < f.startT) {
        const ang = Math.atan2(p.y - f.y, p.x - f.x);
        fireShot(f.x + Math.cos(ang) * 16, f.y + Math.sin(ang) * 16, ang, isBlood() ? 196 : 164, f.dmg, false);
      }
      if (f.t >= f.startT + f.activeT + f.recT) setState(f, 'idle');
      return;
    }
    if (f.state === 'charge') {
      if (f.t < f.startT) return;
      if (f.t < f.startT + f.activeT) {
        const spd = f.boss ? 280 : 340;
        const ang = f.chargeAng != null ? f.chargeAng : f.ang;
        f.x += Math.cos(ang) * spd * dt;
        f.y += Math.sin(ang) * spd * dt;
        if (f.x < 30 || f.x > VW - 30) f.chargeAng = Math.PI - ang;
        if (f.y < 30 || f.y > VH - 30) f.chargeAng = -ang;
        bound(f, 26);
        tryMelee(f, p);
        return;
      }
      if (f.t >= f.startT + f.activeT + f.recT) setState(f, 'idle');
      return;
    }
    if (f.state === 'spray') {
      if (f.t >= 0.18 && f.t - dt < 0.18) {
        const n = f.phase >= 1 ? 12 : 8;
        const base = Math.atan2(p.y - f.y, p.x - f.x);
        for (let i = 0; i < n; i++) {
          const a = base + (i - (n - 1) / 2) * 0.42;
          fireShot(f.x, f.y, a, isBlood() ? 180 : 150, 12, true);
        }
      }
      wanderToward(f, p, dt * 0.2);
      if (f.t >= 0.72) setState(f, 'idle');
      return;
    }
    if (f.state === 'whirl') {
      f.ang += dt * 8;
      tryMelee(f, p);
      if (f.t > 0.2 && Math.floor(f.t * 5) !== Math.floor((f.t - dt) * 5)) {
        fireShot(f.x, f.y, f.ang, 160, 12, true);
        fireShot(f.x, f.y, f.ang + Math.PI, 160, 12, true);
      }
      if (f.t >= 1.25) setState(f, 'idle');
    }
  }

  function tryMelee(f, p) {
    if (!p || p.hp <= 0) return;
    if (p.inv > 0) return;
    const d = distTo(f, p);
    const reach = f.range * (f.state === 'whirl' ? 1.15 : 0.92) + p.rad;
    if (d > reach) return;
    if (p.state === 'parry' && p.t <= parryWin()) {
      succeedParry(f.x, f.y);
      f.stagger = 0.42;
      setState(f, 'idle');
      return;
    }
    hurtPly(f.dmg, f.x, f.y);
  }

  function tickShots(dt) {
    const p = G.ply;
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.a += dt * 10;
      if (s.life <= 0 || s.x < -20 || s.x > VW + 20 || s.y < -20 || s.y > VH + 20) {
        shots.splice(i, 1);
        continue;
      }
      if (s.reflected) {
        for (let k = 0; k < foes.length; k++) {
          const f = foes[k];
          if (f.hp <= 0) continue;
          if (Math.hypot(s.x - f.x, s.y - f.y) < f.rad + s.rad) {
            hitFoe(f, 10, Math.atan2(f.y - s.y, f.x - s.x));
            burstSpark(s.x, s.y, 8, CYN);
            shots.splice(i, 1);
            break;
          }
        }
        continue;
      }
      if (!p || p.hp <= 0) continue;
      if (Math.hypot(s.x - p.x, s.y - p.y) > p.rad + s.rad) continue;
      if (p.state === 'parry' && p.t <= parryWin()) {
        succeedParry(s.x, s.y);
        reflectShot(s);
        continue;
      }
      if (p.state === 'slash' && p.t < 0.14 && inCone(p.x, p.y, p.ang, 74, 1.1, s.x, s.y, s.rad)) {
        p.sparkHits += 1;
        bumpCombo();
        addScore(40 * G.mult);
        burstSpark(s.x, s.y, 8, CYN);
        audio.spark();
        shots.splice(i, 1);
        continue;
      }
      hurtPly(s.dmg, s.x, s.y);
      burstSpark(s.x, s.y, 6, MAG);
      shots.splice(i, 1);
    }
  }

  function separate() {
    const p = G.ply;
    for (let i = 0; i < foes.length; i++) {
      const a = foes[i];
      if (a.hp <= 0) continue;
      if (p && p.hp > 0 && p.state !== 'slash') {
        const d = distTo(a, p);
        const min = a.rad + p.rad - 4;
        if (d > 0 && d < min) {
          const nx = (a.x - p.x) / d;
          const ny = (a.y - p.y) / d;
          const push = (min - d) * 0.45;
          a.x += nx * push;
          a.y += ny * push;
        }
      }
      for (let j = i + 1; j < foes.length; j++) {
        const b = foes[j];
        if (b.hp <= 0) continue;
        const d = distTo(a, b);
        const min = a.rad + b.rad - 2;
        if (d > 0 && d < min) {
          const nx = (a.x - b.x) / d;
          const ny = (a.y - b.y) / d;
          const push = (min - d) * 0.5;
          a.x += nx * push;
          a.y += ny * push;
          b.x -= nx * push;
          b.y -= ny * push;
        }
      }
      bound(a, 26);
    }
  }

  function pruneFoes() {
    for (let i = foes.length - 1; i >= 0; i--) {
      if (foes[i].hp <= 0 && foes[i].hitFlash <= 0) foes.splice(i, 1);
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 0.18);
    if (G.callT > 0) G.callT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) dropCombo();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy = p.vy * 0.96 + 40 * dt;
      p.a += p.spin * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.a += dt * 2;
      if (e.y < 8) {
        e.y = VH - 10;
        e.x = rand(20, VW - 20);
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
      if (rings[i].life <= 0) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life -= dt;
      f.y += f.vy * dt;
      if (f.life <= 0) floats.splice(i, 1);
    }
  }

  function consumeBuffers() {
    const p = G.ply;
    if (!p || G.mode !== 'play' || G.phase !== 'fight') return;
    if (G.slashBuf > 0 && (canAct(p) || p.state === 'parry')) {
      if (doSlash(p)) G.slashBuf = 0;
    }
    if (G.parryBuf > 0 && canAct(p)) {
      if (doParry(p)) G.parryBuf = 0;
    }
    if (keys.parry && canAct(p) && p.counter <= 0) {
      doParry(p);
    }
  }

  function thinkDemo(dt) {
    const p = G.ply;
    if (!p) return;
    let near = null;
    let nd = 9999;
    let shotNear = false;
    for (let i = 0; i < shots.length; i++) {
      if (Math.hypot(shots[i].x - p.x, shots[i].y - p.y) < 70) shotNear = true;
    }
    for (let i = 0; i < foes.length; i++) {
      const f = foes[i];
      if (f.hp <= 0) continue;
      const d = distTo(p, f);
      if (d < nd) { nd = d; near = f; }
    }
    if (shotNear && canAct(p) && Math.random() < 0.08) {
      doParry(p);
      return;
    }
    if (near) {
      p.face = Math.atan2(near.y - p.y, near.x - p.x);
      p.ang = p.face;
      if (nd > 50) {
        p.vx = Math.cos(p.ang) * 150;
        p.vy = Math.sin(p.ang) * 150;
      } else if (canAct(p) && Math.random() < 0.06) {
        doSlash(p);
      }
    }
    if (aliveFoes() < 2 && foes.length < 6) {
      spawnEdge(Math.random() < 0.3 ? 'bow' : 'cut');
    }
    if (p.hp < 40) p.hp = 100;
    if (p.state === 'dead') {
      setState(p, 'idle');
      p.hp = 100;
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.slashBuf > 0) G.slashBuf -= dt;
    if (G.parryBuf > 0) G.parryBuf -= dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }

    if (G.demo && G.mode === 'title') {
      thinkDemo(dt);
      tickPly(G.ply, dt);
      for (let i = 0; i < foes.length; i++) thinkFoe(foes[i], dt);
      tickShots(dt);
      separate();
      pruneFoes();
      updateFx(dt);
      return;
    }

    if (G.mode !== 'play') {
      updateFx(dt);
      return;
    }

    G.phaseT += dt;
    G.stageT += dt;

    if (G.phase === 'intro') {
      tickPly(G.ply, dt);
      if (G.phaseT >= 0.82) spawnCurrentWave();
      updateFx(dt);
      return;
    }

    if (G.phase === 'clear') {
      tickPly(G.ply, dt);
      if (G.phaseT >= 0.48) spawnCurrentWave();
      updateFx(dt);
      return;
    }

    if (G.phase === 'fight') {
      consumeBuffers();
      tickPly(G.ply, dt);
      for (let i = 0; i < foes.length; i++) thinkFoe(foes[i], dt);
      tickShots(dt);
      separate();
      pruneFoes();
      if (G.ply && G.ply.state === 'dead') {
        G.phase = 'fail';
        G.phaseT = 0;
      } else if (G.phase === 'fight' && aliveFoes() === 0) {
        nextWaveOrStage();
      }
    } else if (G.phase === 'bossdown') {
      tickPly(G.ply, dt);
      for (let i = 0; i < foes.length; i++) thinkFoe(foes[i], dt);
      if (G.phaseT >= 1.05) winGame();
    } else if (G.phase === 'fail') {
      tickPly(G.ply, dt);
      if (G.phaseT >= 0.72) loseGame();
    }

    updateFx(dt);
    if ((G.t * 8) % 1 < dt * 8) syncHud();
  }

  function drawArena() {
    ctx.fillStyle = isBlood() ? '#160208' : '#120208';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(sx(0), sy(0));
    ctx.scale(scale, scale);

    const grd = ctx.createRadialGradient(CX, CY, 30, CX, CY, 280);
    grd.addColorStop(0, isBlood() ? 'rgba(96, 8, 28, 0.55)' : 'rgba(64, 8, 24, 0.48)');
    grd.addColorStop(1, 'rgba(8, 2, 6, 0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, VW, VH);

    if (isBlood()) {
      ctx.fillStyle = 'rgba(255, 42, 86, 0.2)';
      ctx.beginPath();
      ctx.arc(CX + 118, CY - 96, 48, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 80, 60, 0.34)';
      ctx.beginPath();
      ctx.arc(CX + 126, CY - 100, 30, 0, TAU);
      ctx.fill();
    }

    ctx.strokeStyle = rgba(HOT, 0.22);
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(28, 24, VW - 56, VH - 48, 28) : ctx.rect(28, 24, VW - 56, VH - 48);
    ctx.stroke();

    ctx.strokeStyle = rgba(GOLD, 0.18);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(42, 36, VW - 84, VH - 72, 20) : ctx.rect(42, 36, VW - 84, VH - 72);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 42, 86, 0.12)';
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 10; i++) {
      const a = i * TAU / 10 + G.t * 0.22;
      ctx.beginPath();
      ctx.moveTo(CX + Math.cos(a) * 24, CY + Math.sin(a) * 16);
      ctx.quadraticCurveTo(
        CX + Math.cos(a + 0.6) * 140,
        CY + Math.sin(a + 0.4) * 90,
        CX + Math.cos(a + 1.1) * 240,
        CY + Math.sin(a + 0.7) * 150
      );
      ctx.stroke();
    }

    ctx.strokeStyle = rgba(CYN, 0.12);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(CX, CY + 10, 86, 48, 0, 0, TAU);
    ctx.stroke();

    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI * 0.5 + 0.35;
      const x = CX + Math.cos(a) * 268;
      const y = CY + Math.sin(a) * 156;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + G.t * 0.4);
      ctx.fillStyle = rgba(INK, 0.92);
      ctx.fillRect(-3, -18, 6, 26);
      ctx.fillStyle = rgba(i % 2 ? HOT : GOLD, 0.78);
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(16, -8);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawEmbers() {
    for (let i = 0; i < embers.length; i++) {
      const e = embers[i];
      ctx.save();
      ctx.translate(sx(e.x), sy(e.y));
      ctx.rotate(e.a);
      ctx.fillStyle = rgba(e.rgb, 0.5);
      ctx.fillRect(-1.2 * e.s * scale, -2.4 * e.s * scale, 2.4 * e.s * scale, 4.8 * e.s * scale);
      ctx.restore();
    }
  }

  function bladeSwing(e) {
    if (e.state === 'whirl') return e.t * 14;
    if (e.state === 'slash' || e.state === 'charge') {
      const p = clamp(e.t / 0.16, 0, 1);
      return lerp(-1.15, 1.25, p);
    }
    if (e.state === 'parry') return -0.55;
    if (e.state === 'idle' || e.state === 'walk') return Math.sin(e.anim * 4) * 0.08;
    return 0;
  }

  function drawGhosts() {
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      const a = g.life / g.max;
      ctx.save();
      ctx.translate(sx(g.x), sy(g.y));
      ctx.scale(scale * g.scale, scale * g.scale);
      ctx.globalAlpha = a * 0.35;
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.beginPath();
      ctx.ellipse(0, 4, 8, 11, g.ang, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawBody(e, rgb, skin, bladeRgb, wide) {
    const sw = bladeSwing(e);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(e.scale || 1, e.scale || 1);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(1, 12, 9, 4.2, 0, 0, TAU);
    ctx.fill();

    if (e.state === 'parry') {
      ctx.strokeStyle = rgba(GOLD, 0.85);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 18, e.ang - 1.2, e.ang + 1.2);
      ctx.stroke();
    }
    if ((e.state === 'slash' || e.state === 'shoot' || e.state === 'charge') && e.t < (e.startT || 0.14)) {
      ctx.strokeStyle = rgba(HOT, 0.55);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, TAU);
      ctx.stroke();
    }

    ctx.rotate(e.ang);
    ctx.fillStyle = rgba(rgb, e.hitFlash > 0 ? 1 : 0.96);
    ctx.beginPath();
    ctx.ellipse(0, 2, 8.2, 11.4, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(skin, 1);
    ctx.beginPath();
    ctx.arc(1.4, -8.2, 5.1, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.rotate(sw);
    ctx.strokeStyle = rgba(bladeRgb, 0.95);
    ctx.lineWidth = wide ? 4.2 : 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(6, 2);
    ctx.lineTo(28, -10);
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(8, 1);
    ctx.lineTo(26, -8);
    ctx.stroke();
    if (e.boss) {
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(6, 6);
      ctx.lineTo(22, 16);
      ctx.stroke();
    }
    ctx.restore();

    if (e.isPly && e.counter > 0) {
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawFighter(e) {
    if (!e) return;
    const rgb = e.isPly ? [24, 72, 78] : (e.boss ? [72, 12, 22] : e.shooter ? [58, 16, 40] : e.charger ? [70, 28, 12] : [48, 14, 24]);
    const skin = e.isPly ? SKIN : SKIN2;
    const blade = e.isPly ? (e.counter > 0 ? GOLD : CYN) : (e.boss ? GOLD : HOT);
    const flicker = e.isPly && e.inv > 0 && ((e.inv * 18) | 0) % 2 === 0;
    if (flicker) return;
    ctx.save();
    ctx.translate(sx(0), sy(0));
    ctx.scale(scale, scale);
    if (e.state === 'dead') ctx.globalAlpha = 0.45;
    drawBody(e, rgb, skin, blade, e.isPly || e.boss);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawShots() {
    ctx.save();
    ctx.translate(sx(0), sy(0));
    ctx.scale(scale, scale);
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.a);
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-4, 3.4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, -3.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(-1, -1, 4, 2);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawFx() {
    ctx.save();
    ctx.translate(sx(0), sy(0));
    ctx.scale(scale, scale);
    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      const t = a.life / a.max;
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.ang);
      ctx.strokeStyle = rgba(a.rgb, 0.35 + t * 0.55);
      ctx.lineWidth = a.counter ? 7 : 5;
      ctx.beginPath();
      ctx.arc(8, 0, a.counter ? 46 : 38, -1.15, 1.15);
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.45 * t);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(8, 0, a.counter ? 50 : 42, -1.0, 1.0);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = 1 - r.life / r.max;
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - t));
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r + t * 28, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fillRect(-p.r, -p.r * 0.35, p.r * 2.2, p.r * 0.7);
      ctx.restore();
    }
    ctx.restore();

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
    for (let i = 0; i < foes.length; i++) drawFighter(foes[i]);
    if (G.ply) drawFighter(G.ply);
    drawShots();
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
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down || (pointer.id != null && e.pointerId !== pointer.id)) return;
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      if (Math.hypot(w.x - pointer.x0, w.y - pointer.y0) > 16) pointer.moved = true;
    });
    const up = function (e) {
      if (!pointer.down) return;
      if (pointer.id != null && e && e.pointerId !== pointer.id) return;
      const w = e ? pointerWorld(e) : { x: pointer.x, y: pointer.y };
      if (!pointer.moved && G.mode === 'play' && !overlayOpen()) {
        if (G.ply) {
          G.ply.ang = Math.atan2(w.y - G.ply.y, w.x - G.ply.x);
          G.ply.face = G.ply.ang;
        }
        queueSlash();
      }
      pointer.down = false;
      pointer.moved = false;
      pointer.id = null;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
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
          startGame('storm');
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
      onDir('l', down);
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      e.preventDefault();
      onDir('r', down);
    } else if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      e.preventDefault();
      onDir('u', down);
    } else if (k === 'ArrowDown' || k === 's' || k === 'S') {
      e.preventDefault();
      onDir('d', down);
    } else if (k === ' ') {
      e.preventDefault();
      if (e.repeat) return;
      if (down) queueSlash();
    } else if (k === 'Shift' || k === 'z' || k === 'Z') {
      e.preventDefault();
      keys.parry = down;
      if (down) queueParry();
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

  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      startGame('storm');
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
  holdBtn(btnSlash, function () { queueSlash(); }, null);
  holdBtn(btnParry, function () { keys.parry = true; queueParry(); }, function () { keys.parry = false; });

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
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
