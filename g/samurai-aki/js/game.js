'use strict';

(function () {
  const VW = 720;
  const VH = 400;
  const GROUND = 338;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.55;
  const BEST_KEY = 'playbox-samurai-aki-best';
  const MUTE_KEY = 'playbox-samurai-aki-mute';
  const OPS = '方向 / WASD 走 · 空格斩 · Shift / Z 格挡 · 双点闪步 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 120];
  const GOLD = [255, 227, 107];
  const HOT = [255, 58, 26];
  const COR = [255, 110, 66];
  const WHT = [255, 244, 232];
  const CYN = [94, 232, 208];
  const TEAL = [26, 72, 70];
  const CRIM = [196, 36, 42];
  const LEAF = [210, 86, 36];
  const INK = [48, 18, 16];
  const SKIN = [232, 196, 168];
  const SKIN2 = [196, 148, 112];

  const ROUNDS = [
    {
      id: 'leaf',
      name: '叶侍',
      title: '第 1 局',
      hp: 36,
      dmg: 9,
      range: 54,
      lunge: 22,
      start: 0.16,
      active: 0.12,
      rec: 0.34,
      spd: 90,
      prefer: 50,
      aggro: 0.44,
      parry: 0.08,
      step: 0,
      think: 0.30,
      atkGap: 0.92,
      react: 0.14,
      scale: 1
    },
    {
      id: 'kasa',
      name: '赤笠',
      title: '第 2 局',
      hp: 52,
      dmg: 11,
      range: 56,
      lunge: 18,
      start: 0.13,
      active: 0.11,
      rec: 0.28,
      spd: 108,
      prefer: 52,
      aggro: 0.36,
      parry: 0.64,
      step: 0.14,
      think: 0.18,
      atkGap: 0.74,
      react: 0.09,
      scale: 1.02
    },
    {
      id: 'crow',
      name: '夜鸦',
      title: '第 3 局',
      hp: 66,
      dmg: 13,
      range: 64,
      lunge: 42,
      start: 0.10,
      active: 0.10,
      rec: 0.22,
      spd: 136,
      prefer: 58,
      aggro: 0.60,
      parry: 0.22,
      step: 0.52,
      think: 0.12,
      atkGap: 0.54,
      react: 0.07,
      scale: 1.04
    },
    {
      id: 'king',
      name: '秋王',
      title: '秋王',
      hp: 128,
      dmg: 16,
      range: 76,
      lunge: 38,
      start: 0.14,
      active: 0.12,
      rec: 0.24,
      spd: 120,
      prefer: 68,
      aggro: 0.56,
      parry: 0.38,
      step: 0.34,
      think: 0.14,
      atkGap: 0.62,
      react: 0.08,
      scale: 1.16,
      boss: true,
      moon: true
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
  const btnAki = document.getElementById('btn-aki');
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
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnSlash = document.getElementById('btn-slash');
  const btnParry = document.getElementById('btn-parry');
  const btnStep = document.getElementById('btn-step');

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
  let tapL = -1;
  let tapR = -1;

  const keys = { l: false, r: false, parry: false };
  const pointer = { down: false, x: VW * 0.5, y: VH * 0.5, id: null, t0: 0, x0: 0, moved: false };
  const particles = [];
  const petals = [];
  const ghosts = [];
  const arcs = [];
  const floats = [];
  const rings = [];

  const G = {
    mode: 'title',
    kind: 'aki',
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
    parryBuf: 0,
    stepBuf: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    camX: 0,
    toastT: 0,
    why: '',
    call: '',
    callT: 0
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
  function isBlood() {
    return G.kind === 'blood';
  }
  function spec() {
    return ROUNDS[Math.min(ROUNDS.length - 1, G.round)] || ROUNDS[0];
  }
  function spdMul() {
    return isBlood() ? 1.24 : 1;
  }
  function hpMul() {
    return isBlood() ? 1.18 : 1;
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
      this.noise(0.06, 0.038, 1400);
      this.beep(420, 0.07, 'sine', 0.03, 180);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.05);
      this.noise(0.042, 0.05, 900);
      this.beep(520 * lift, 0.08, 'square', 0.05, 880 * lift);
    },
    parry() {
      this.ensure();
      this.noise(0.05, 0.046, 1800);
      this.beep(980, 0.09, 'square', 0.055, 1640);
      this.beep(1320, 0.12, 'triangle', 0.04, 1980);
    },
    clash() {
      this.ensure();
      this.noise(0.08, 0.06, 700);
      this.beep(300, 0.1, 'sawtooth', 0.05, 90);
      this.beep(760, 0.08, 'square', 0.04, 420);
    },
    step() {
      this.ensure();
      this.noise(0.09, 0.04, 600);
      this.beep(220, 0.12, 'sine', 0.035, 70);
    },
    hurt() {
      this.ensure();
      this.noise(0.07, 0.04, 400);
      this.beep(180, 0.14, 'sawtooth', 0.04, 70);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(240, 0.22, 'sawtooth', 0.05, 60);
      this.beep(110, 0.34, 'sine', 0.045, 36);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.06, 'sine', 0.022, 90);
    },
    moon() {
      this.ensure();
      this.noise(0.14, 0.055, 240);
      this.beep(90, 0.28, 'sawtooth', 0.055, 42);
      this.beep(420, 0.18, 'sine', 0.04, 180);
    },
    boss() {
      this.ensure();
      this.beep(160, 0.18, 'sawtooth', 0.05, 80);
      this.beep(110, 0.3, 'square', 0.04, 55);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
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
      stageLabel.textContent = st.title + (st.boss ? '' : '');
      stageLabel.classList.toggle('hot', !!st.boss || G.round >= 2);
    }
    if (tagLabel) {
      tagLabel.textContent = isBlood() ? '血月' : '秋叶';
      tagLabel.classList.toggle('warn', isBlood());
    }
    if (foeName) foeName.textContent = st.name;
    if (G.ply) fillBar(hpBar, G.ply.hp / G.ply.hpMax);
    if (G.foe) fillBar(foeBar, G.foe.hp / G.foe.hpMax);
    else fillBar(foeBar, 1);
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 体力打空本局结束', 'warn');
    else if (G.mode === 'win') setHint('秋尽 · R 再来一局', 'hot');
    else if (G.ply && G.ply.hp / G.ply.hpMax < 0.34) setHint('残血 · 格挡再反斩', 'warn');
    else setHint('空格斩 · Shift 挡 · 双点方向闪步', st.boss ? 'hot' : '');
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SAKI';
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
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.005));
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
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.spread || 0, spec.spread || 0),
        y: spec.y + rand(-(spec.spread || 0) * 0.6, (spec.spread || 0) * 0.4),
        vx: spec.vx + rand(-spec.jv || 0, spec.jv || 0),
        vy: spec.vy + rand(-spec.jv || 0, spec.jv || 0),
        life: spec.life || 0.5,
        max: spec.life || 0.5,
        r: spec.r ? spec.r + rand(-1, 1) : rand(1.4, 3.2),
        rgb: spec.rgb || GOLD,
        kind: spec.kind || 'spark',
        spin: rand(-6, 6),
        a: rand(0, TAU)
      });
    }
    capArr(particles, REDUCE ? 80 : 220);
  }

  function burstLeaves(x, y, n, rgb) {
    const count = REDUCE ? Math.ceil(n * 0.4) : n;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + rand(-10, 10),
        y: y + rand(-18, 8),
        vx: rand(-90, 90),
        vy: rand(-160, -30),
        life: rand(0.45, 0.9),
        max: 0.8,
        r: rand(3.5, 6.5),
        rgb: Math.random() < 0.5 ? (rgb || LEAF) : COR,
        kind: 'leaf',
        spin: rand(-8, 8),
        a: rand(0, TAU)
      });
    }
    capArr(particles, REDUCE ? 80 : 220);
  }

  function sparkRing(x, y, rgb) {
    rings.push({ x: x, y: y, r: 8, life: 0.32, max: 0.32, rgb: rgb || GOLD });
    capArr(rings, 12);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, life: 0.7, rgb: rgb || GOLD });
    capArr(floats, 10);
  }

  function addArc(x, y, face, rgb, moon) {
    arcs.push({
      x: x,
      y: y,
      face: face,
      life: moon ? 0.28 : 0.18,
      max: moon ? 0.28 : 0.18,
      rgb: rgb,
      moon: !!moon
    });
    capArr(arcs, 8);
  }

  function seedPetals() {
    petals.length = 0;
    const n = REDUCE ? 12 : 26;
    for (let i = 0; i < n; i++) {
      petals.push({
        x: rand(0, VW),
        y: rand(0, VH),
        vx: rand(-22, -8),
        vy: rand(18, 46),
        a: rand(0, TAU),
        spin: rand(-2.4, 2.4),
        s: rand(0.55, 1.35),
        rgb: Math.random() < 0.55 ? LEAF : HOT
      });
    }
  }

  function makeFighter(isPly, roundSpec, x, face) {
    const st = roundSpec || ROUNDS[0];
    const hp = isPly ? 100 : Math.round(st.hp * hpMul());
    return {
      isPly: !!isPly,
      kind: isPly ? 'aki' : st.id,
      name: isPly ? '秋侍' : st.name,
      x: x,
      y: GROUND,
      vx: 0,
      face: face,
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
      thinkT: 0.2,
      atkCd: 0.4,
      reacted: false,
      intent: 'wait',
      moonAtk: false,
      startT: isPly ? 0.085 : st.start / spdMul(),
      activeT: isPly ? 0.105 : st.active,
      recT: isPly ? 0.20 : st.rec / spdMul(),
      range: isPly ? 58 : st.range,
      lunge: isPly ? 34 : st.lunge,
      dmg: isPly ? 15 : st.dmg,
      spd: isPly ? (isBlood() ? 198 : 168) : st.spd * spdMul(),
      prefer: st.prefer || 80,
      aggro: st.aggro || 0.4,
      parryCh: st.parry || 0,
      stepCh: st.step || 0,
      thinkGap: (st.think || 0.2) / spdMul(),
      atkGap: (st.atkGap || 0.7) / spdMul(),
      react: (st.react || 0.1) / spdMul(),
      scale: isPly ? 1.22 : (st.scale || 1) * 1.18,
      boss: !!(st && st.boss),
      canMoon: !!(st && st.moon)
    };
  }

  function canAct(f) {
    return f && (f.state === 'idle' || f.state === 'walk');
  }

  function bodyBox(f) {
    const w = 28 * (f.scale || 1);
    const h = 64 * (f.scale || 1);
    return { x: f.x - w * 0.5, y: f.y - h, w: w, h: h };
  }

  function slashBox(f) {
    const extra = f.moonAtk ? 34 : (f.flashCut > 0 ? 12 : 0);
    const wide = f.range + extra;
    const x0 = f.x + f.face * 18;
    const x1 = f.x + f.face * (18 + wide);
    const x = Math.min(x0, x1);
    return { x: x, y: f.y - 62, w: wide, h: 50 };
  }

  function parryBox(f) {
    const w = 32;
    return { x: f.x + f.face * 22 - w * 0.5, y: f.y - 60, w: w, h: 54 };
  }

  function hits(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function setState(f, st) {
    f.state = st;
    f.t = 0;
    f.phase = 0;
    f.hitDone = false;
    f.moonAtk = false;
    if (st !== 'slash') f.vx = st === 'step' ? f.vx : 0;
  }

  function parryWin() {
    return isBlood() ? 0.13 : 0.20;
  }

  function doSlash(f) {
    if (!f || !canAct(f)) return false;
    faceOther(f);
    if (f.face === 0) f.face = 1;
    setState(f, 'slash');
    if (f.isPly && f.flashCut > 0) {
      f.startT = 0.055;
      f.activeT = 0.12;
      f.range = 70;
    } else if (f.isPly) {
      f.startT = 0.085;
      f.activeT = 0.105;
      f.range = 58;
    } else if (f.canMoon && f.hp / f.hpMax <= 0.5 && Math.random() < 0.42) {
      f.moonAtk = true;
      f.startT = 0.22 / spdMul();
      f.activeT = 0.16;
      f.range = 108;
      audio.moon();
    } else if (!f.isPly) {
      const st = spec();
      f.startT = st.start / spdMul();
      f.activeT = st.active;
      f.range = st.range;
    }
    audio.swing();
    return true;
  }

  function doParry(f) {
    if (!f || !canAct(f)) return false;
    faceOther(f);
    setState(f, 'parry');
    return true;
  }

  function doStep(f, dir) {
    if (!f) return false;
    if (!canAct(f) && f.state !== 'parry') return false;
    if (f.stepCd > 0) return false;
    const d = dir < 0 ? -1 : 1;
    setState(f, 'step');
    f.face = d;
    f.vx = d * (isBlood() ? 1180 : 1080);
    f.inv = 0.16;
    f.stepCd = isBlood() ? 0.42 : 0.58;
    f.flashCut = 0.22;
    audio.step();
    burstLeaves(f.x, f.y - 28, 8, f.isPly ? CYN : LEAF);
    return true;
  }

  function tryStepToward(f, dir) {
    if (!dir) {
      const other = f.isPly ? G.foe : G.ply;
      if (other) dir = other.x >= f.x ? 1 : -1;
      else dir = f.face || 1;
    }
    return doStep(f, dir);
  }

  function faceOther(f) {
    const o = f.isPly ? G.foe : G.ply;
    if (!o) return;
    if (Math.abs(o.x - f.x) > 6) f.face = o.x >= f.x ? 1 : -1;
  }

  function hurt(f, from, dmg) {
    if (!f || f.inv > 0 || f.state === 'dead' || f.state === 'step') return;
    f.hp = Math.max(0, f.hp - dmg);
    const kb = from ? (f.x >= from.x ? 1 : -1) : -f.face;
    f.vx = kb * 210;
    if (f.hp <= 0) {
      setState(f, 'dead');
      f.inv = 9;
      audio.death();
      burstLeaves(f.x, f.y - 30, 28, HOT);
      emit(18, { x: f.x, y: f.y - 28, vx: kb * 80, vy: -40, jv: 120, spread: 16, life: 0.5, rgb: GOLD, kind: 'spark' });
      screenFlash(HOT, 0.45);
      hitStop(0.072);
      kick(8, 'die');
      if (f.isPly) dropCombo();
    } else {
      setState(f, 'hurt');
      f.inv = 0.34;
      audio.hurt();
      burstLeaves(f.x, f.y - 26, 10, LEAF);
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
    if (atk.moonAtk) {
      dmg = Math.round(atk.dmg * 1.45);
      tag = '月斩';
      rgb = MAG;
    } else if (atk.counter > 0) {
      dmg = Math.round(atk.dmg * 1.6);
      tag = '反斩';
      rgb = GOLD;
    } else if (atk.flashCut > 0 && atk.isPly) {
      dmg = Math.round(atk.dmg * 1.28);
      tag = '闪斩';
      rgb = CYN;
    }
    const hx = vic.x;
    const hy = vic.y - 30;
    emit(14, { x: hx, y: hy, vx: atk.face * 70, vy: -30, jv: 90, spread: 12, life: 0.38, rgb: rgb, kind: 'spark' });
    burstLeaves(hx, hy, 12, LEAF);
    addArc(atk.x + atk.face * 30, hy, atk.face, rgb, atk.moonAtk);
    sparkRing(hx, hy, rgb);
    if (atk.isPly) {
      bumpCombo();
      const pts = Math.round((atk.counter > 0 ? 280 : atk.flashCut > 0 ? 200 : 120) * G.mult);
      addScore(pts);
      floatText(hx, hy - 18, tag + ' +' + pts, rgb);
      audio.hit(G.combo);
      hitStop(atk.counter > 0 ? 0.064 : atk.moonAtk ? 0.078 : 0.05);
      kick(atk.counter > 0 ? 6 : 4.6, 'slash');
      screenFlash(rgb, 0.22);
    } else {
      audio.hit(1);
      hitStop(atk.moonAtk ? 0.07 : 0.048);
      kick(5, 'hit');
      screenFlash(HOT, 0.18);
    }
    hurt(vic, atk, dmg);
    atk.counter = 0;
  }

  function landParry(def, atk) {
    atk.hitDone = true;
    setState(atk, 'stun');
    atk.t = 0;
    atk.vx = atk.face * -80;
    def.counter = 0.55;
    sparkRing(def.x + def.face * 22, def.y - 32, GOLD);
    emit(16, {
      x: def.x + def.face * 24,
      y: def.y - 32,
      vx: 0,
      vy: -20,
      jv: 140,
      spread: 8,
      life: 0.4,
      rgb: GOLD,
      kind: 'spark'
    });
    burstLeaves(def.x, def.y - 28, 8, GOLD);
    audio.parry();
    hitStop(0.056);
    kick(5.5, 'parry');
    screenFlash(GOLD, 0.28);
    if (def.isPly) {
      bumpCombo();
      const pts = Math.round(160 * G.mult);
      addScore(pts);
      floatText(def.x, def.y - 64, '格挡 +' + pts, GOLD);
      popChain('格挡');
    } else {
      floatText(def.x, def.y - 64, '被格', MAG);
    }
  }

  function landClash(a, b) {
    a.hitDone = true;
    b.hitDone = true;
    a.vx = (a.x <= b.x ? -1 : 1) * 160;
    b.vx = (b.x <= a.x ? -1 : 1) * 160;
    const mx = (a.x + b.x) * 0.5;
    const my = (a.y + b.y) * 0.5 - 32;
    emit(20, { x: mx, y: my, vx: 0, vy: -10, jv: 160, spread: 10, life: 0.36, rgb: WHT, kind: 'spark' });
    sparkRing(mx, my, WHT);
    addArc(mx, my, 1, GOLD, false);
    audio.clash();
    hitStop(0.04);
    kick(5, 'slash');
    screenFlash(WHT, 0.2);
    if (G.mode === 'play') {
      addScore(40);
      floatText(mx, my - 20, '交刃', WHT);
    }
  }

  function landRead(stepper, atk) {
    atk.hitDone = true;
    sparkRing(stepper.x, stepper.y - 28, CYN);
    burstLeaves(stepper.x, stepper.y - 24, 6, CYN);
    if (stepper.isPly) {
      addScore(90);
      floatText(stepper.x, stepper.y - 60, '闪读 +90', CYN);
      bumpCombo();
    }
  }

  function resolveCombat() {
    const a = G.ply;
    const b = G.foe;
    if (!a || !b) return;
    if (G.phase !== 'fight') return;
    const aSlash = a.state === 'slash' && a.phase === 1 && !a.hitDone;
    const bSlash = b.state === 'slash' && b.phase === 1 && !b.hitDone;
    const aParry = a.state === 'parry' && a.phase === 0;
    const bParry = b.state === 'parry' && b.phase === 0;

    if (aSlash && bSlash) {
      const clash = hits(slashBox(a), slashBox(b)) || (hits(slashBox(a), bodyBox(b)) && hits(slashBox(b), bodyBox(a)));
      if (clash) {
        landClash(a, b);
        return;
      }
    }
    if (aSlash) {
      if (bParry && hits(slashBox(a), parryBox(b))) landParry(b, a);
      else if (b.state === 'step' && hits(slashBox(a), bodyBox(b))) landRead(b, a);
      else if (b.inv <= 0 && hits(slashBox(a), bodyBox(b))) landHit(a, b);
    }
    if (bSlash) {
      if (aParry && hits(slashBox(b), parryBox(a))) landParry(a, b);
      else if (a.state === 'step' && hits(slashBox(b), bodyBox(a))) landRead(a, b);
      else if (a.inv <= 0 && hits(slashBox(b), bodyBox(a))) landHit(b, a);
    }
  }

  function tickFighter(f, dt) {
    f.anim += dt;
    if (f.inv > 0) f.inv -= dt;
    if (f.stepCd > 0) f.stepCd -= dt;
    if (f.counter > 0) f.counter -= dt;
    if (f.flashCut > 0 && f.state !== 'step') f.flashCut -= dt;
    f.t += dt;

    if (f.state === 'slash') {
      const s = f.startT;
      const a = f.activeT;
      const r = f.recT;
      if (f.t < s) {
        f.phase = 0;
      } else if (f.t < s + a) {
        if (f.phase !== 1) {
          f.phase = 1;
          f.x += f.face * f.lunge * (f.moonAtk ? 0.55 : 0.7);
          addArc(f.x + f.face * 24, f.y - 30, f.face, f.moonAtk ? MAG : (f.isPly ? CYN : HOT), f.moonAtk);
        }
      } else if (f.t < s + a + r) {
        f.phase = 2;
      } else {
        setState(f, 'idle');
        faceOther(f);
      }
    } else if (f.state === 'parry') {
      const win = f.isPly ? parryWin() : 0.18;
      if (f.t < win) f.phase = 0;
      else if (f.t < win + 0.12) f.phase = 1;
      else {
        setState(f, 'idle');
        faceOther(f);
      }
    } else if (f.state === 'step') {
      ghosts.push({
        x: f.x,
        y: f.y,
        face: f.face,
        kind: f.kind,
        scale: f.scale,
        life: 0.18,
        rgb: f.isPly ? CYN : MAG
      });
      capArr(ghosts, 18);
      if (f.t >= 0.15) {
        setState(f, 'idle');
        faceOther(f);
      }
    } else if (f.state === 'hurt') {
      if (f.t >= 0.28) {
        setState(f, 'idle');
        faceOther(f);
      }
    } else if (f.state === 'stun') {
      if (f.t >= (f.boss ? 0.42 : 0.52)) {
        setState(f, 'idle');
        faceOther(f);
      }
    } else if (f.state === 'dead') {
      f.vx *= 0.9;
    }

    f.x += f.vx * dt;
    if (f.state !== 'step' && f.state !== 'hurt' && f.state !== 'dead') f.vx *= Math.pow(0.08, dt);
    else if (f.state === 'hurt' || f.state === 'stun') f.vx *= Math.pow(0.15, dt);
    f.x = clamp(f.x, 46, VW - 46);
    f.y = GROUND;
  }

  function tickAi(e, dt) {
    if (!e || e.isPly) return;
    if (G.phase !== 'fight' || G.mode !== 'play') return;
    if (e.state === 'dead' || e.state === 'hurt' || e.state === 'stun') return;
    const ply = G.ply;
    if (!ply || ply.state === 'dead') return;

    if (e.state === 'slash' || e.state === 'parry' || e.state === 'step') return;

    faceOther(e);
    const dist = Math.abs(e.x - ply.x);
    e.atkCd -= dt;
    e.thinkT -= dt;

    if (ply.state === 'slash') {
      if (!e.reacted && ply.t >= e.react && dist < e.range + 52) {
        e.reacted = true;
        const r = Math.random();
        if (r < e.parryCh) doParry(e);
        else if (r < e.parryCh + e.stepCh) {
          const through = Math.random() < 0.55;
          doStep(e, through ? e.face : -e.face);
        }
      }
    } else {
      e.reacted = false;
    }

    if (!canAct(e)) return;

    let aggro = e.aggro;
    if (e.boss && e.hp / e.hpMax <= 0.5) aggro = Math.min(0.92, aggro + 0.22);
    if (e.boss && e.hp / e.hpMax <= 0.25) aggro = Math.min(0.96, aggro + 0.12);

    const inCut = dist < e.range + e.lunge * 0.4;
    if (e.atkCd <= 0 && inCut && (ply.state !== 'parry' || Math.random() > 0.7) && Math.random() < aggro + 0.18) {
      doSlash(e);
      e.atkCd = e.atkGap * rand(0.85, 1.2);
      return;
    }

    if (e.thinkT > 0) {
      applyIntent(e, ply, dist, dt);
      return;
    }

    e.thinkT = e.thinkGap * rand(0.7, 1.25);

    if (ply.counter > 0 && dist < e.range + 20) {
      e.intent = 'retreat';
    } else if (dist > e.prefer + 16) {
      e.intent = 'approach';
    } else if (dist < e.prefer - 18) {
      e.intent = Math.random() < 0.6 ? 'retreat' : 'wait';
    } else {
      e.intent = Math.random() < 0.4 ? 'wait' : (Math.random() < 0.5 ? 'approach' : 'retreat');
    }
  }

  function applyIntent(e, ply, dist, dt) {
    if (!canAct(e)) return;
    const toward = ply.x >= e.x ? 1 : -1;
    if (e.intent === 'approach') {
      e.x += toward * e.spd * dt;
      e.state = 'walk';
      e.face = toward;
    } else if (e.intent === 'retreat') {
      e.x += -toward * e.spd * 0.85 * dt;
      e.state = 'walk';
      e.face = toward;
    } else {
      e.state = 'idle';
    }
  }

  function tickPlayer(dt) {
    const f = G.ply;
    if (!f || G.phase !== 'fight' || G.mode !== 'play') return;
    if (overlayOpen()) return;
    if (G.slashBuf > 0) G.slashBuf -= dt;
    if (G.parryBuf > 0) G.parryBuf -= dt;
    if (G.stepBuf !== 0) {
      if (canAct(f) || f.state === 'parry') {
        tryStepToward(f, G.stepBuf);
        G.stepBuf = 0;
      }
    }
    if (G.slashBuf > 0 && canAct(f)) {
      doSlash(f);
      G.slashBuf = 0;
    }
    if (G.parryBuf > 0 && canAct(f)) {
      doParry(f);
      G.parryBuf = 0;
    }
    if (!canAct(f)) return;
    let mx = 0;
    if (keys.l) mx -= 1;
    if (keys.r) mx += 1;
    if (pointer.down && pointer.moved) {
      const dx = pointer.x - f.x;
      if (Math.abs(dx) > 14) mx = dx > 0 ? 1 : -1;
    }
    if (mx !== 0) {
      f.x += mx * f.spd * dt;
      f.face = mx;
      f.state = 'walk';
    } else if (f.state === 'walk') {
      f.state = 'idle';
    }
    const o = G.foe;
    if (o && Math.abs(o.x - f.x) > 8 && f.state === 'idle') faceOther(f);
  }

  function separate() {
    const a = G.ply;
    const b = G.foe;
    if (!a || !b) return;
    if (a.state === 'step' || b.state === 'step') return;
    if (a.state === 'dead' || b.state === 'dead') return;
    const min = 50 * ((a.scale + b.scale) * 0.5);
    const dx = b.x - a.x;
    if (Math.abs(dx) < min && Math.abs(dx) > 0.1) {
      const push = (min - Math.abs(dx)) * 0.5;
      const s = dx > 0 ? 1 : -1;
      a.x -= s * push;
      b.x += s * push;
    }
  }

  function queueSlash() {
    if (G.mode !== 'play' || overlayOpen() || G.phase !== 'fight') return;
    G.slashBuf = 0.14;
  }

  function queueParry() {
    if (G.mode !== 'play' || overlayOpen() || G.phase !== 'fight') return;
    G.parryBuf = 0.12;
  }

  function queueStep(dir) {
    if (G.mode !== 'play' || overlayOpen() || G.phase !== 'fight') return;
    G.stepBuf = dir || (G.ply ? G.ply.face : 1);
  }

  function beginRound() {
    const st = spec();
    if (G.ply) {
      G.ply.x = 168;
      G.ply.face = 1;
      setState(G.ply, 'idle');
      G.ply.inv = 0;
      G.ply.vx = 0;
      G.ply.counter = 0;
      G.ply.flashCut = 0;
    } else {
      G.ply = makeFighter(true, st, 168, 1);
    }
    G.foe = makeFighter(false, st, 552, -1);
    G.phase = 'intro';
    G.phaseT = 0;
    G.roundT = 0;
    G.slashBuf = 0;
    G.parryBuf = 0;
    G.stepBuf = 0;
    dropCombo();
    if (st.boss) {
      audio.boss();
      screenFlash(HOT, 0.35);
      toast('秋王 · 月下', false, true);
      setCall('秋王', 1.1);
    } else {
      audio.round();
      toast(st.title + ' · ' + st.name, false, true);
      setCall(st.title, 0.9);
    }
    syncHud();
  }

  function nextRound() {
    const st = spec();
    const timePts = Math.max(0, 700 - (G.roundT * 70) | 0);
    const killPts = (800 + 400 * G.round + timePts) * (isBlood() ? 1.25 : 1);
    addScore(Math.round(killPts));
    floatText(VW * 0.5, 120, st.name + ' 败', GOLD);
    if (G.ply) {
      const heal = isBlood() ? 14 : 30;
      G.ply.hp = Math.min(G.ply.hpMax, G.ply.hp + heal);
    }
    G.round += 1;
    if (G.round >= ROUNDS.length) {
      G.phase = 'ko';
      G.phaseT = 0;
      G.why = 'win';
      addScore(isBlood() ? 9000 : 6000);
      return;
    }
    G.phase = 'next';
    G.phaseT = 0;
    toast('下一局', false, true);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '刃折', '体力打空，这一局尽了。格挡拆招，再反斩。');
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    audio.win();
    screenFlash(GOLD, 0.4);
    burstLeaves(VW * 0.5, GROUND - 40, 40, GOLD);
    showOverlay(
      'win',
      '秋尽',
      isBlood()
        ? '血月下秋王也倒下了。叶落一地。'
        : '秋王倒下。叶落一地。还可再开血月。'
    );
    syncHud();
  }

  function tickFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.kind === 'leaf' ? 220 : 420) * dt;
      p.a += p.spin * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.a += p.spin * dt;
      if (p.y > VH + 10) {
        p.y = -8;
        p.x = rand(0, VW);
      }
      if (p.x < -12) p.x = VW + 8;
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
      rings[i].r += 90 * dt;
      if (rings[i].life <= 0) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].life -= dt;
      floats[i].y -= 28 * dt;
      if (floats[i].life <= 0) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.pow(0.02, dt));
    if (G.callT > 0) G.callT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) dropCombo();
    }
  }

  function update(dt) {
    G.clock += dt;
    if (G.mode === 'title') {
      if (G.ply) tickFighter(G.ply, dt);
      if (G.foe) {
        G.foe.anim += dt;
        if (G.foe.state === 'idle' && Math.sin(G.clock * 0.7) > 0.92) G.foe.state = 'walk';
        if (G.foe.state === 'walk') {
          G.foe.x += G.foe.face * 18 * dt;
          if (G.foe.x > 580 || G.foe.x < 500) G.foe.face *= -1;
          if (Math.sin(G.clock * 0.7) < 0.2) G.foe.state = 'idle';
        }
        tickFighter(G.foe, dt);
      }
      tickFx(dt);
      return;
    }
    if (G.mode !== 'play') {
      if (G.ply) tickFighter(G.ply, dt);
      if (G.foe) tickFighter(G.foe, dt);
      tickFx(dt);
      return;
    }

    if (G.stop > 0) {
      G.stop -= dt;
      tickFx(dt * 0.25);
      return;
    }

    G.t += dt;
    G.roundT += dt;
    G.phaseT += dt;

    if (G.phase === 'intro') {
      if (G.ply) {
        G.ply.state = 'idle';
        faceOther(G.ply);
      }
      if (G.foe) {
        G.foe.state = 'idle';
        faceOther(G.foe);
      }
      if (G.phaseT > 0.55 && G.call !== '斩') setCall('斩', 0.5);
      if (G.phaseT >= 1.05) {
        G.phase = 'fight';
        G.phaseT = 0;
      }
    } else if (G.phase === 'fight') {
      tickPlayer(dt);
      tickAi(G.foe, dt);
      if (G.ply) tickFighter(G.ply, dt);
      if (G.foe) tickFighter(G.foe, dt);
      separate();
      resolveCombat();
      if (G.ply && G.ply.state === 'dead' && G.ply.t > 0.7) {
        G.phase = 'ko';
        G.phaseT = 0;
        G.why = 'lose';
      } else if (G.foe && G.foe.state === 'dead' && G.foe.t > 0.55) nextRound();
    } else if (G.phase === 'next') {
      if (G.phaseT >= 0.85) beginRound();
    } else if (G.phase === 'ko') {
      if (G.ply) tickFighter(G.ply, dt);
      if (G.foe) tickFighter(G.foe, dt);
      if (G.phaseT >= 1.05) {
        if (G.why === 'win') goWin();
        else goLose();
      }
    }

    const mid = G.ply && G.foe ? (G.ply.x + G.foe.x) * 0.5 : VW * 0.5;
    const want = clamp((VW * 0.5 - mid) * 0.22, -40, 40);
    G.camX = lerp(G.camX, want, 1 - Math.pow(0.04, dt));
    tickFx(dt);
  }

  function drawLeafShape(x, y, ang, s, rgb, a) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(s, s);
    ctx.fillStyle = rgba(rgb, a);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(5.2, -2.2, 4.2, 3);
    ctx.quadraticCurveTo(0, 1.2, 0, 6.5);
    ctx.quadraticCurveTo(0, 1.2, -4.2, 3);
    ctx.quadraticCurveTo(-5.2, -2.2, 0, -6);
    ctx.fill();
    ctx.restore();
  }

  function drawArena() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, isBlood() ? '#2a0608' : '#180608');
    g.addColorStop(0.55, '#140404');
    g.addColorStop(1, '#0c0303');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const moonX = 560;
    const moonY = 78;
    const moonR = isBlood() ? 54 : 42;
    ctx.fillStyle = isBlood() ? 'rgba(255, 40, 30, 0.18)' : 'rgba(255, 90, 50, 0.12)';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 1.8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = isBlood() ? '#ff2a18' : '#ff6a42';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, TAU);
    ctx.fill();
    ctx.fillStyle = isBlood() ? '#ff8a60' : '#ffb090';
    ctx.beginPath();
    ctx.arc(moonX - 8, moonY - 6, moonR * 0.62, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(40, 12, 10, 0.85)';
    ctx.beginPath();
    ctx.moveTo(40, GROUND - 8);
    ctx.lineTo(70, GROUND - 118);
    ctx.lineTo(110, GROUND - 8);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(600, GROUND - 8);
    ctx.lineTo(640, GROUND - 140);
    ctx.lineTo(690, GROUND - 8);
    ctx.fill();

    ctx.strokeStyle = 'rgba(90, 24, 18, 0.7)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(300, GROUND - 92);
    ctx.lineTo(300, GROUND - 8);
    ctx.moveTo(420, GROUND - 92);
    ctx.lineTo(420, GROUND - 8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(140, 40, 28, 0.8)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(286, GROUND - 92);
    ctx.lineTo(434, GROUND - 92);
    ctx.moveTo(292, GROUND - 70);
    ctx.lineTo(428, GROUND - 70);
    ctx.stroke();

    ctx.fillStyle = '#2a0e0c';
    ctx.fillRect(0, GROUND, VW, VH - GROUND);
    ctx.fillStyle = '#3a1612';
    for (let i = 0; i < 14; i++) {
      ctx.fillRect(i * 54, GROUND, 50, 4);
    }
    ctx.fillStyle = 'rgba(255, 58, 26, 0.08)';
    ctx.fillRect(0, GROUND - 2, VW, 3);

    ctx.fillStyle = 'rgba(255, 180, 80, 0.35)';
    ctx.beginPath();
    ctx.arc(96, GROUND - 52, 7, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(624, GROUND - 58, 7, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#5a2418';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(96, GROUND - 46);
    ctx.lineTo(96, GROUND);
    ctx.moveTo(624, GROUND - 52);
    ctx.lineTo(624, GROUND);
    ctx.stroke();

    for (let i = 0; i < petals.length; i++) {
      const p = petals[i];
      drawLeafShape(p.x, p.y, p.a, p.s, p.rgb, 0.55);
    }
  }

  function bladeAng(f) {
    if (f.state === 'parry') return -0.2;
    if (f.state === 'slash') {
      const s = f.startT;
      const a = f.activeT;
      const r = f.recT;
      if (f.t < s) return lerp(0.75, -1.15, f.t / Math.max(0.01, s));
      if (f.t < s + a) return lerp(-1.15, 2.15, (f.t - s) / Math.max(0.01, a));
      return lerp(2.15, 0.85, (f.t - s - a) / Math.max(0.01, r));
    }
    if (f.state === 'stun') return 1.15;
    if (f.state === 'hurt') return 1.05;
    return 0.72;
  }

  function palFor(kind) {
    if (kind === 'aki') return { gi: TEAL, obi: GOLD, skin: SKIN, hair: INK, blade: WHT, edge: CYN, hat: null };
    if (kind === 'leaf') return { gi: [72, 52, 28], obi: LEAF, skin: SKIN2, hair: [40, 24, 16], blade: [210, 190, 150], edge: LEAF, hat: [120, 80, 36] };
    if (kind === 'kasa') return { gi: [90, 22, 22], obi: GOLD, skin: SKIN2, hair: INK, blade: GOLD, edge: HOT, hat: CRIM, kasa: true };
    if (kind === 'crow') return { gi: [18, 12, 22], obi: [120, 50, 160], skin: [180, 140, 150], hair: [12, 8, 16], blade: [200, 180, 220], edge: MAG, hat: null };
    return { gi: [80, 18, 16], obi: GOLD, skin: SKIN2, hair: [20, 10, 8], blade: HOT, edge: GOLD, hat: [48, 12, 10], king: true };
  }

  function drawFighterAt(f, ghost) {
    if (!f) return;
    const pal = palFor(f.kind);
    const hurtBlink = !ghost && f.inv > 0 && f.state !== 'dead' && ((G.clock * 22) | 0) % 2 === 0;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(f.face * (f.scale || 1), f.scale || 1);
    ctx.fillStyle = ghost ? rgba(pal.edge, 0.18) : 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 5.5, 0, 0, TAU);
    ctx.fill();
    const bob = f.state === 'walk' ? Math.sin(f.anim * 11) * 1.8 : Math.sin(G.clock * 2.6 + f.x * 0.01) * 0.8;
    ctx.translate(0, -bob);
    if (f.state === 'hurt') ctx.rotate(-0.14);
    if (f.state === 'stun') ctx.rotate(Math.sin(f.t * 30) * 0.04);
    if (f.state === 'dead') {
      const k = Math.min(1, f.t / 0.55);
      ctx.rotate(-1.15 * k);
      ctx.translate(0, 18 * k);
      ctx.globalAlpha *= 1 - k * 0.35;
    }
    if (ghost) ctx.globalAlpha *= 0.45;
    if (hurtBlink) ctx.globalAlpha *= 0.45;

    const swing = f.state === 'walk' ? Math.sin(f.anim * 11) * 0.34 : 0;
    ctx.strokeStyle = rgba(pal.gi, 1);
    ctx.lineWidth = 6.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.lineTo(-7 + swing * 8, 0);
    ctx.moveTo(6, -18);
    ctx.lineTo(7 - swing * 8, 0);
    ctx.stroke();
    ctx.fillStyle = rgba(INK, 0.85);
    ctx.beginPath();
    ctx.arc(-7 + swing * 8, 1, 3.2, 0, TAU);
    ctx.arc(7 - swing * 8, 1, 3.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(pal.gi, 1);
    ctx.beginPath();
    ctx.roundRect(-12, -50, 24, 34, 5);
    ctx.fill();
    ctx.fillStyle = rgba(pal.obi, 1);
    ctx.fillRect(-12, -26, 24, 5);

    if (pal.king) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-13, -50, 26, 7);
    }

    const ang = bladeAng(f);
    ctx.save();
    ctx.translate(10, -36);
    ctx.rotate(ang);
    ctx.fillStyle = '#4a2a18';
    ctx.fillRect(-4, -3.4, 10, 7);
    const glen = pal.king || f.moonAtk ? 56 : 46;
    ctx.shadowColor = rgba(pal.edge, 0.7);
    ctx.shadowBlur = 8;
    const grd = ctx.createLinearGradient(0, 0, glen, 0);
    grd.addColorStop(0, rgba(pal.blade, 1));
    grd.addColorStop(1, rgba(pal.edge, 1));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(5, -2.4);
    ctx.lineTo(glen, 0);
    ctx.lineTo(5, 2.4);
    ctx.closePath();
    ctx.fill();
    if (f.state === 'slash' && f.phase === 1) {
      ctx.strokeStyle = rgba(pal.edge, 0.6);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, glen * 0.72, -0.65, 0.45);
      ctx.stroke();
    }
    if (f.state === 'parry' && f.phase === 0) {
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2.4;
      ctx.strokeRect(-3, -6, glen * 0.38, 12);
    }
    ctx.restore();

    ctx.fillStyle = rgba(pal.skin, 1);
    ctx.beginPath();
    ctx.arc(0, -60, 8.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(pal.hair, 1);
    ctx.beginPath();
    ctx.arc(-1, -63, 7.6, Math.PI, TAU);
    ctx.fill();
    if (pal.kasa) {
      ctx.fillStyle = rgba(pal.hat, 1);
      ctx.beginPath();
      ctx.moveTo(-18, -64);
      ctx.lineTo(0, -78);
      ctx.lineTo(18, -64);
      ctx.closePath();
      ctx.fill();
    } else if (pal.king) {
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.moveTo(-10, -66);
      ctx.lineTo(-15, -82);
      ctx.lineTo(-5, -68);
      ctx.moveTo(10, -66);
      ctx.lineTo(15, -82);
      ctx.lineTo(5, -68);
      ctx.fill();
      ctx.fillRect(-9, -72, 18, 6);
    } else {
      ctx.beginPath();
      ctx.ellipse(0, -70, 3.2, 4.4, 0, 0, TAU);
      ctx.fill();
    }

    if (f.counter > 0 && !ghost) {
      ctx.strokeStyle = rgba(GOLD, 0.75);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, -34, 26, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function roundRectPolyfill() {
    if (ctx.roundRect) return;
    ctx.roundRect = function (x, y, w, h, r) {
      const rr = Math.min(r, w * 0.5, h * 0.5);
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    };
  }

  function drawGhosts() {
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      drawFighterAt({
        x: g.x,
        y: g.y,
        face: g.face,
        kind: g.kind,
        scale: g.scale,
        state: 'step',
        t: 0,
        phase: 0,
        anim: 0,
        inv: 0,
        counter: 0,
        moonAtk: false
      }, true);
    }
  }

  function drawFx() {
    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      const k = a.life / a.max;
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.scale(a.face, 1);
      ctx.strokeStyle = rgba(a.rgb, k);
      ctx.lineWidth = a.moon ? 8 : 4;
      ctx.beginPath();
      ctx.arc(0, 4, a.moon ? 52 : 34, -1.2, 0.9);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.life / r.max;
      ctx.strokeStyle = rgba(r.rgb, k);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const k = p.life / p.max;
      if (p.kind === 'leaf') drawLeafShape(p.x, p.y, p.a, p.r * 0.22, p.rgb, k);
      else {
        ctx.fillStyle = rgba(p.rgb, k);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * k, 0, TAU);
        ctx.fill();
      }
    }
    ctx.font = '700 12px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.fillStyle = rgba(f.rgb, f.life / 0.7);
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function drawCall() {
    if (G.callT <= 0 || !G.call) return;
    const k = Math.min(1, G.callT / 0.25);
    ctx.save();
    ctx.globalAlpha = Math.min(1, G.callT * 3) * k;
    ctx.textAlign = 'center';
    ctx.font = '900 42px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillStyle = G.call === '斩' ? rgba(GOLD, 0.95) : rgba(WHT, 0.9);
    ctx.shadowColor = rgba(HOT, 0.6);
    ctx.shadowBlur = 18;
    ctx.fillText(G.call, VW * 0.5, 86);
    ctx.restore();
  }

  function draw() {
    roundRectPolyfill();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * 0.6;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080202';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(ox + G.camX * scale + shx * scale, oy + shy * scale);
    ctx.scale(scale * G.punch, scale * G.punch);
    ctx.translate((VW * (1 - G.punch)) * 0.5, (VH * (1 - G.punch)) * 0.5);
    drawArena();
    drawGhosts();
    if (G.foe) drawFighterAt(G.foe, false);
    if (G.ply) drawFighterAt(G.ply, false);
    drawFx();
    drawCall();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash);
      ctx.fillRect(-40, -40, VW + 80, VH + 80);
    }
    ctx.restore();
  }

  function clearFx() {
    particles.length = 0;
    ghosts.length = 0;
    arcs.length = 0;
    floats.length = 0;
    rings.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'blood' ? 'blood' : 'aki';
    G.mode = 'play';
    G.t = 0;
    G.clock = G.clock;
    G.round = 0;
    G.score = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.camX = 0;
    G.why = '';
    G.ply = makeFighter(true, ROUNDS[0], 168, 1);
    if (scoreEl) scoreEl.textContent = '0';
    clearFx();
    seedPetals();
    hideOverlay();
    audio.start();
    toast(isBlood() ? '血月 · 更快更狠' : '秋叶 · 短局对决', false, true);
    beginRound();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'aki';
    G.round = 0;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.phase = 'intro';
    G.ply = makeFighter(true, ROUNDS[0], 200, 1);
    G.foe = makeFighter(false, ROUNDS[0], 520, -1);
    G.ply.state = 'idle';
    G.foe.state = 'idle';
    clearFx();
    seedPetals();
    showOverlay(
      'title',
      '侍秋',
      '对面只有一个剑士。空格斩，Shift 格挡，双点闪步。过三局再打秋王。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('aki');
    else startGame(G.kind || 'aki');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('aki');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('blood');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isBlood()) goTitle();
      else startGame('blood');
    }
  }

  function onLeft(down) {
    if (down) {
      const now = G.clock;
      if (now - tapL < 0.22) queueStep(-1);
      tapL = now;
      keys.l = true;
    } else keys.l = false;
  }

  function onRight(down) {
    if (down) {
      const now = G.clock;
      if (now - tapR < 0.22) queueStep(1);
      tapR = now;
      keys.r = true;
    } else keys.r = false;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const parryKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight';

    if (down && (isMove || space || k === 'Enter' || parryKey)) e.preventDefault();
    if (down && e.repeat) return;

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') {
      onLeft(down);
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
      onRight(down);
    }

    if (!down) {
      if (parryKey) keys.parry = false;
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
    if (k === '1') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '2') {
      if (overlayOpen()) secondaryAction();
      return;
    }
    if (parryKey) {
      if (!keys.parry) {
        keys.parry = true;
        if (!overlayOpen() && G.mode === 'play') queueParry();
      }
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') queueSlash();
    }
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
      if (pointer.down && Math.abs(w.x - pointer.x0) > 16) pointer.moved = true;
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      if (pointer.down && G.mode === 'play' && !overlayOpen()) {
        const dt = G.clock - pointer.t0;
        const dx = pointer.x - pointer.x0;
        if (Math.abs(dx) > 48 && dt < 0.28) queueStep(dx > 0 ? 1 : -1);
        else if (dt < 0.22 && Math.abs(dx) < 20) queueSlash();
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

  if (btnAki) {
    btnAki.addEventListener('click', function () {
      audio.ensure();
      startGame('aki');
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

  holdBtn(btnLeft, function () { onLeft(true); }, function () { onLeft(false); });
  holdBtn(btnRight, function () { onRight(true); }, function () { onRight(false); });
  holdBtn(btnSlash, function () { queueSlash(); }, null);
  holdBtn(btnParry, function () { queueParry(); }, null);
  holdBtn(btnStep, function () { queueStep(G.ply ? G.ply.face : 1); }, null);

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = false;
      keys.r = false;
      keys.parry = false;
      pointer.down = false;
    }
  });

  requestAnimationFrame(frame);
})();
