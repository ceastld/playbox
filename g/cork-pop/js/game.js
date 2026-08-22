'use strict';

(function () {
  const TAU = Math.PI * 2;
  const LIVES = 3;
  const COUNT_IN = 4;
  const LOOKAHEAD = 2.6;
  const PERFECT = 0.048;
  const SPIN_THRESH = 0.22;
  const KEY_SPIN = 5.4;
  const MUTE_KEY = 'cork-pop-mute';
  const OPS = '右 / 空格顺时针 · 左逆时针 · 绕塞转圈或点瓶左右 · M 静音';

  const STAGES = [
    {
      name: '起拧', sub: 'OPEN', bpm: 86, win: 0.15,
      pattern: [1, 1, 1, 1],
      hint: '拍点顺时针拧 · 右或空格',
      toast: '跟着拍点，向右拧',
      shape: 'wine', liquid: '#c41e6a', foil: false
    },
    {
      name: '连拍', sub: 'CHAIN', bpm: 96, win: 0.13,
      pattern: [1, 1, 1, 1, 1, 1],
      hint: '连续右拧，别停拍',
      toast: '连着拧六拍',
      shape: 'wine', liquid: '#e83a8a', foil: false
    },
    {
      name: '反拧', sub: 'BACK', bpm: 96, win: 0.13,
      pattern: [-1, -1, -1, -1],
      hint: '方向反了 · 向左拧',
      toast: '这瓶要逆时针',
      shape: 'flask', liquid: '#00c8e0', foil: false
    },
    {
      name: '交错', sub: 'CROSS', bpm: 104, win: 0.12,
      pattern: [1, -1, 1, -1, 1, -1],
      hint: '一右一左，看箭头',
      toast: '左右交替',
      shape: 'potion', liquid: '#ff3db8', foil: false
    },
    {
      name: '紧口', sub: 'TIGHT', bpm: 114, win: 0.1,
      pattern: [1, 1, 1, 1, 1, 1, 1, 1],
      hint: '窗口变窄，贴着拍拧',
      toast: '拍更紧了',
      shape: 'wine', liquid: '#7a1ea8', foil: false
    },
    {
      name: '空拍', sub: 'REST', bpm: 108, win: 0.11,
      pattern: [1, 0, 1, 0, 1, 1, 0, 1],
      hint: '青圈空拍 · 停手',
      toast: '空拍别拧',
      shape: 'champ', liquid: '#ffe36b', foil: true
    },
    {
      name: '快拧', sub: 'FAST', bpm: 128, win: 0.09,
      pattern: [1, -1, 1, -1, 1, -1, 1, -1],
      hint: '加快，左右跟上',
      toast: '快拍交错',
      shape: 'flask', liquid: '#00f0ff', foil: false
    },
    {
      name: '乱向', sub: 'MIX', bpm: 118, win: 0.1,
      pattern: [1, 1, -1, 0, 1, -1, -1, 1],
      hint: '看箭头，空拍停',
      toast: '方向会变',
      shape: 'potion', liquid: '#ff6b9d', foil: false
    },
    {
      name: '密拍', sub: 'RAPID', bpm: 132, win: 0.085,
      pattern: [1, 0, 1, -1, 1, 1, -1, 0, 1, -1],
      hint: '密拍，空圈仍要停',
      toast: '更密了',
      shape: 'champ', liquid: '#ff3db8', foil: true
    },
    {
      name: '陈年', sub: 'VINTAGE', bpm: 140, win: 0.075,
      pattern: [1, -1, 0, 1, 1, -1, 1, 0, -1, 1, -1, 1],
      hint: '最后一瓶，贴拍拧',
      toast: '陈年封口，听拍',
      shape: 'wine', liquid: '#ffd36b', foil: true
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
  const ovBtn = document.getElementById('ov-btn');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');
  const stageLabel = document.getElementById('stage-label');
  const comboLabel = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let hidden = false;
  let lastT = 0;

  const layout = {
    cx: 0,
    cy: 0,
    s: 1,
    neckY: 0,
    corkY: 0,
    corkR: 22,
    bodyTop: 0,
    bodyBot: 0
  };

  const keys = { cw: false, ccw: false };
  const pointer = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    ang: 0,
    hasAng: false,
    acc: 0,
    moved: 0,
    sx: 0,
    sy: 0,
    t0: 0
  };

  const particles = [];
  const motes = [];
  const rings = [];
  const floats = [];
  const bubbles = [];
  const foam = [];
  const sparks = [];

  let notes = [];
  let pulses = [];
  let songStart = 0;
  let songEnd = 0;
  let hitsNeeded = 4;

  const cork = {
    ang: 0,
    omega: 0,
    lift: 0,
    liftVis: 0,
    punch: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    pop: false
  };

  const G = {
    mode: 'title',
    stage: 0,
    songT: 0,
    clock: 0,
    lives: LIVES,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    hits: 0,
    pops: 0,
    lock: 0,
    justHit: 0,
    heldDir: 0,
    shake: 0,
    flash: 0,
    flashCol: '#ff3db8',
    pulse: 0,
    popT: 0,
    judge: '',
    judgeCol: '#00f0ff',
    judgeT: 0,
    countN: 0,
    slosh: 0,
    toastT: 0,
    hintLock: 0,
    lastHint: '',
    paused: false,
    inputLock: 0,
    beatGlow: 0,
    endArmed: false
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function mix(a, b, t) {
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
  function hexRgb(h) {
    return [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16)
    ];
  }
  function rgba(h, a) {
    const c = hexRgb(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  const audio = {
    ctx: null,
    master: null,
    noiseBuf: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.26;
        this.master.connect(this.ctx.destination);
        const n = (this.ctx.sampleRate * 0.32) | 0;
        const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.26;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (e) {}
    },
    beep: function (freq, dur, type, vol, slide) {
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
    noise: function (dur, vol, freq) {
      if (!this.ctx || this.muted || !this.noiseBuf) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = freq || 1800;
      f.Q.value = 0.75;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    click: function (accent) {
      this.beep(accent ? 1560 : 1180, 0.028, 'sine', accent ? 0.07 : 0.038, 640);
      this.beep(accent ? 190 : 96, 0.07, 'sine', accent ? 0.08 : 0.042, 48);
    },
    twist: function (perfect) {
      this.noise(0.07, perfect ? 0.08 : 0.05, perfect ? 2100 : 1400);
      this.beep(perfect ? 740 : 520, 0.09, 'triangle', 0.07, perfect ? 1480 : 880);
      this.beep(180, 0.07, 'sine', 0.035, 70);
    },
    restOk: function () {
      this.beep(420, 0.05, 'sine', 0.03, 220);
    },
    pop: function () {
      this.noise(0.18, 0.14, 1600);
      this.beep(220, 0.16, 'sine', 0.12, 55);
      this.beep(880, 0.22, 'triangle', 0.07, 1320);
      this.beep(440, 0.28, 'sine', 0.05, 880);
    },
    fizz: function () {
      this.noise(0.28, 0.05, 5400);
    },
    fail: function () {
      this.beep(210, 0.22, 'sawtooth', 0.09, 64);
      this.noise(0.14, 0.07, 700);
    },
    win: function () {
      this.beep(440, 0.2, 'triangle', 0.1, 880);
      this.beep(660, 0.3, 'sine', 0.07, 1320);
      this.beep(880, 0.4, 'triangle', 0.05, 1760);
    },
    lose: function () {
      this.beep(330, 0.4, 'sawtooth', 0.1, 70);
      this.beep(110, 0.65, 'square', 0.06, 40);
      this.noise(0.36, 0.08, 500);
    },
    start: function () {
      this.beep(220, 0.14, 'sine', 0.07, 440);
      this.beep(440, 0.18, 'triangle', 0.05, 880);
    }
  };

  try {
    audio.muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) {}

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col,
        g: spec.g || 0
      });
    }
  }

  function floatText(x, y, text, col) {
    if (floats.length > 12) floats.shift();
    floats.push({ x: x, y: y, vy: -48, life: 0.72, max: 0.72, text: text, col: col });
  }

  function ringBurst(r, col) {
    if (rings.length > 10) rings.shift();
    rings.push({ r: r, life: 0.42, max: 0.42, col: col });
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 64; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.25,
        a: Math.random() * 0.38 + 0.05,
        p: Math.random() * TAU,
        s: 0.2 + Math.random() * 0.85
      });
    }
  }

  function seedBubbles() {
    bubbles.length = 0;
    for (let i = 0; i < 18; i++) {
      bubbles.push({
        x: rand(-0.72, 0.72),
        y: rand(0.1, 0.95),
        r: rand(1.1, 2.8),
        v: rand(12, 28),
        ph: rand(0, TAU)
      });
    }
  }

  function compile(stageIdx) {
    const st = STAGES[stageIdx];
    const d = 60 / st.bpm;
    notes = [];
    pulses = [];
    let t = 0;
    for (let i = 0; i < COUNT_IN; i++) {
      pulses.push({ t: t, type: 'count', n: COUNT_IN - i, bar: i % 4, dir: 0, fired: false });
      t += d;
    }
    songStart = t;
    hitsNeeded = 0;
    for (let k = 0; k < st.pattern.length; k++) {
      const dir = st.pattern[k];
      notes.push({
        t: t,
        dir: dir,
        i: k,
        bar: k % 4,
        state: 'open'
      });
      pulses.push({
        t: t,
        type: dir === 0 ? 'rest' : 'hit',
        n: 0,
        bar: k % 4,
        dir: dir,
        fired: false
      });
      if (dir !== 0) hitsNeeded += 1;
      t += d;
    }
    songEnd = t;
  }

  function resize() {
    const rec = canvas.getBoundingClientRect();
    W = Math.max(1, rec.width);
    H = Math.max(1, rec.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout.s = Math.min(W / 360, H / 460);
    if (H < 500) layout.s *= 0.88;
    if (layout.s < 0.68) layout.s = 0.68;
    if (layout.s > 1.85) layout.s = 1.85;
    layout.cx = W * 0.5;
    layout.cy = H * (H < 520 ? 0.48 : 0.5);
    layout.corkR = 22 * layout.s;
  }

  function buildPips() {
    pipsEl.innerHTML = '';
    for (let i = 0; i < LIVES; i++) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
    }
  }

  function syncHud() {
    const st = STAGES[G.stage] || STAGES[0];
    const prog = hitsNeeded ? clamp(cork.liftVis, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + prog + ')';
    fillNum.textContent = Math.round(prog * 100) + '%';
    fillWrap.classList.toggle('hot', prog > 0.82);
    fillWrap.classList.toggle('warn', G.lives <= 1 && G.mode === 'play');
    stageLabel.textContent = (G.mode === 'title' ? '十瓶' : (G.stage + 1) + ' / 10  ' + st.name);
    stageLabel.classList.toggle('hot', G.mode === 'pop');
    comboLabel.textContent = '连 ' + G.combo;
    comboLabel.className = G.combo >= 8 ? 'hot' : '';
    const pips = pipsEl.querySelectorAll('i');
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('warn', G.lives === 1 && i < G.lives);
    }
  }

  function setHint(text, cls) {
    const key = text + '|' + (cls || '');
    if (G.lastHint === key) return;
    G.lastHint = key;
    hintEl.textContent = text;
    hintEl.className = 'hint' + (cls ? ' ' + cls : '');
  }

  function toast(text, cls, dur) {
    toastEl.textContent = text;
    toastEl.className = 'toast' + (cls ? ' ' + cls : '');
    G.toastT = dur || 1.6;
  }

  function nextHint() {
    if (G.hintLock > 0) return;
    if (G.mode === 'title') {
      setHint('拍点拧转 · 空拍别动');
      return;
    }
    if (G.mode === 'pop') {
      setHint('启开', 'hot');
      return;
    }
    if (G.mode !== 'play') return;
    if (G.songT < songStart - 0.02) {
      setHint('听拍 · ' + (G.countN > 0 ? G.countN : '起'), 'hot');
      return;
    }
    let next = null;
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].state === 'open') {
        next = notes[i];
        break;
      }
    }
    if (!next) {
      setHint('启开', 'hot');
      return;
    }
    if (next.dir === 0) setHint('下一拍 · 停手', 'cool');
    else if (next.dir > 0) setHint('下一拍 · 右拧', 'warn');
    else setHint('下一拍 · 左拧', 'cool');
  }

  function showPanel(kind) {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (kind === 'title') {
      ovKicker.textContent = 'CORK';
      ovTitle.textContent = '启塞';
      ovLead.innerHTML = '在节拍上拧开塞子。<br />拍点顺着箭头转，空拍停手。';
      ovOps.textContent = OPS;
      ovBtn.textContent = '启塞';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'UNCORKED';
      ovTitle.textContent = '十瓶启开';
      ovLead.innerHTML = '陈年封口都拧开了。<br />连拧 ' + G.maxCombo + ' · 正中 ' + G.perfects + ' · 启 ' + G.pops;
      ovOps.textContent = OPS;
      ovBtn.textContent = '再来一局';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = 'JAMMED';
      ovTitle.textContent = '卡住了';
      const st = STAGES[G.stage];
      ovLead.innerHTML = '第 ' + (G.stage + 1) + ' 瓶「' + st.name + '」没拧开。<br />漏拍、拧反或空拍乱动都会卡住。';
      ovOps.textContent = OPS;
      ovBtn.textContent = '再拧一次';
    }
  }

  function hidePanel() {
    overlay.classList.add('hidden');
  }

  function resetCork() {
    cork.ang = 0;
    cork.omega = 0;
    cork.lift = 0;
    cork.liftVis = 0;
    cork.punch = 0;
    cork.x = 0;
    cork.y = 0;
    cork.vx = 0;
    cork.vy = 0;
    cork.pop = false;
  }

  function beginStage(idx) {
    G.stage = idx;
    compile(idx);
    G.songT = 0;
    G.hits = 0;
    G.lock = 0;
    G.justHit = 0;
    G.pulse = 0;
    G.popT = 0;
    G.judge = '';
    G.judgeT = 0;
    G.countN = COUNT_IN;
    G.slosh = 0;
    G.beatGlow = 0;
    G.endArmed = false;
    resetCork();
    particles.length = 0;
    rings.length = 0;
    floats.length = 0;
    foam.length = 0;
    sparks.length = 0;
    seedBubbles();
    toast(STAGES[idx].toast, '', 1.8);
    G.hintLock = 0.4;
    setHint(STAGES[idx].hint, '');
  }

  function startRun() {
    audio.ensure();
    audio.start();
    G.mode = 'play';
    G.lives = LIVES;
    G.combo = 0;
    G.maxCombo = 0;
    G.perfects = 0;
    G.pops = 0;
    G.inputLock = 0.28;
    G.flash = 0.35;
    G.flashCol = '#00f0ff';
    beginStage(0);
    hidePanel();
    syncHud();
  }

  function winRun() {
    G.mode = 'win';
    audio.win();
    showPanel('win');
    setHint('十瓶启开', 'hot');
  }

  function loseRun() {
    G.mode = 'lose';
    audio.lose();
    showPanel('lose');
    setHint('塞子卡住了', 'warn');
  }

  function nextOpen() {
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].state === 'open') return notes[i];
    }
    return null;
  }

  function noteInWindow() {
    const st = STAGES[G.stage];
    const hit = st.win;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.state !== 'open') continue;
      if (Math.abs(G.songT - n.t) <= hit) return n;
    }
    return null;
  }

  function kickCork(dir) {
    cork.omega += dir * 9.5;
    cork.punch = Math.min(1, cork.punch + 0.45);
  }

  function stageCleared() {
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].state === 'open') return false;
    }
    return true;
  }

  function triggerPop() {
    G.mode = 'pop';
    G.popT = 0;
    cork.pop = true;
    cork.vy = -520 * layout.s;
    cork.vx = rand(-70, 70) * layout.s;
    cork.omega = rand(8, 14) * (Math.random() < 0.5 ? -1 : 1);
    G.flash = 0.45;
    G.flashCol = '#ffe36b';
    G.shake = 0.35;
    audio.pop();
    audio.fizz();
    const x = layout.cx + cork.x;
    const y = layout.corkY;
    ringBurst(18, '#ffe36b');
    ringBurst(28, '#00f0ff');
    emit(28, {
      x: x, y: y, j: 10,
      vx0: -180, vx1: 180, vy0: -380, vy1: -40,
      life: 0.9, r0: 1.6, r1: 4.2, col: '#ffe36b', g: 520
    });
    emit(18, {
      x: x, y: y + 8, j: 6,
      vx0: -90, vx1: 90, vy0: -220, vy1: -20,
      life: 0.7, r0: 2, r1: 5, col: '#ff3db8', g: 380
    });
    for (let i = 0; i < 22; i++) {
      if (foam.length > 50) foam.shift();
      foam.push({
        x: x + rand(-10, 10),
        y: y + rand(-4, 8),
        vx: rand(-60, 60),
        vy: rand(-240, -40),
        life: rand(0.5, 1.1),
        max: 1.1,
        r: rand(3, 8),
        col: Math.random() < 0.5 ? '#fff6e0' : '#ffb8e4'
      });
    }
    G.pops += 1;
    cork.lift = 1;
    toast('启开 · ' + STAGES[G.stage].name, 'gold', 1.1);
    setHint('启开', 'hot');
  }

  function success(note, perfect) {
    note.state = 'hit';
    G.hits += 1;
    G.combo += 1;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    if (perfect) G.perfects += 1;
    G.justHit = 0.16;
    G.lock = 0.05;
    G.beatGlow = 1;
    cork.lift = G.hits / hitsNeeded;
    cork.punch = 1;
    const col = perfect ? '#ffe36b' : '#00f0ff';
    G.judge = perfect ? '正中' : '拧开';
    G.judgeCol = col;
    G.judgeT = 0.55;
    audio.twist(perfect);
    const x = layout.cx;
    const y = layout.corkY;
    floatText(x, y - 36 * layout.s, G.judge, col);
    ringBurst(perfect ? 22 : 16, col);
    emit(perfect ? 14 : 8, {
      x: x, y: y, j: 8,
      vx0: -120, vx1: 120, vy0: -160, vy1: -20,
      life: 0.45, r0: 1.2, r1: 3.2, col: col, g: 240
    });
    if (stageCleared()) triggerPop();
    syncHud();
  }

  function fail(note, why) {
    if (note) note.state = 'miss';
    G.combo = 0;
    G.lives -= 1;
    G.lock = 0.22;
    G.justHit = 0.12;
    G.shake = 0.7;
    G.flash = 0.28;
    G.flashCol = '#ff3db8';
    G.slosh = 1;
    G.judge = why;
    G.judgeCol = '#ff3db8';
    G.judgeT = 0.7;
    G.hintLock = 0.7;
    audio.fail();
    floatText(layout.cx, layout.corkY - 36 * layout.s, why, '#ff3db8');
    emit(12, {
      x: layout.cx, y: layout.corkY, j: 10,
      vx0: -140, vx1: 140, vy0: -80, vy1: 80,
      life: 0.4, r0: 1.4, r1: 3.4, col: '#ff3db8', g: 80
    });
    setHint(why, 'warn');
    toast(why, 'warn', 1.0);
    if (G.lives <= 0) {
      G.lives = 0;
      G.endArmed = true;
      G.popT = 0;
    } else if (note && stageCleared()) {
      triggerPop();
    }
    syncHud();
  }

  function restOk(note) {
    note.state = 'hit';
    G.justHit = 0.08;
    audio.restOk();
    if (stageCleared()) triggerPop();
  }

  function twist(dir) {
    if (G.mode !== 'play' || G.inputLock > 0) return;
    if (G.lock > 0 && G.justHit > 0) return;
    kickCork(dir);
    if (G.songT < songStart - STAGES[G.stage].win) return;

    const st = STAGES[G.stage];
    const hit = st.win;
    let best = null;
    let bestErr = 99;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.state !== 'open') continue;
      const err = Math.abs(G.songT - n.t);
      if (err < bestErr) {
        best = n;
        bestErr = err;
      }
    }
    if (!best) return;
    if (bestErr > hit) return;

    if (best.dir === 0) {
      fail(best, '空拍');
      return;
    }
    if (dir !== best.dir) {
      fail(best, '拧反');
      return;
    }
    success(best, bestErr <= PERFECT);
  }

  function expireNotes() {
    if (G.endArmed || G.lives <= 0 || G.mode !== 'play') return;
    const st = STAGES[G.stage];
    const hit = st.win;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.state !== 'open') continue;
      if (G.songT <= n.t + hit) continue;
      if (n.dir === 0) restOk(n);
      else fail(n, '漏拍');
      if (G.mode !== 'play' || G.endArmed) return;
    }
  }

  function canvasPoint(e) {
    const rec = canvas.getBoundingClientRect();
    return { x: e.clientX - rec.left, y: e.clientY - rec.top };
  }

  function isUi(el) {
    if (!el) return false;
    if (el === btnMute || el === btnRetry || el === ovBtn) return true;
    if (el.closest && el.closest('button')) return true;
    return false;
  }

  function onPointerDown(e) {
    if (isUi(e.target)) return;
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') return;
    if (e.button !== undefined && e.button !== 0) return;
    const p = canvasPoint(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.sx = p.x;
    pointer.sy = p.y;
    pointer.moved = 0;
    pointer.acc = 0;
    pointer.hasAng = false;
    pointer.t0 = G.clock;
    const dx = p.x - layout.cx;
    const dy = p.y - layout.corkY;
    if (Math.hypot(dx, dy) > 18) {
      pointer.ang = Math.atan2(dy, dx);
      pointer.hasAng = true;
    }
    canvas.classList.add('press');
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!pointer.down || (pointer.id !== null && e.pointerId !== pointer.id)) return;
    const p = canvasPoint(e);
    pointer.moved += Math.hypot(p.x - pointer.x, p.y - pointer.y);
    pointer.x = p.x;
    pointer.y = p.y;
    const dx = p.x - layout.cx;
    const dy = p.y - layout.corkY;
    const dist = Math.hypot(dx, dy);
    if (dist > 22) {
      const a = Math.atan2(dy, dx);
      if (pointer.hasAng) {
        const d = wrapAng(a - pointer.ang);
        pointer.acc += d;
        cork.omega += d * 18;
        if (Math.abs(pointer.acc) >= SPIN_THRESH) {
          const dir = pointer.acc > 0 ? 1 : -1;
          pointer.acc = 0;
          twist(dir);
        }
      }
      pointer.ang = a;
      pointer.hasAng = true;
    }
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (!pointer.down) return;
    if (pointer.id !== null && e.pointerId !== pointer.id) return;
    const dur = G.clock - pointer.t0;
    if (pointer.moved < 14 && dur < 0.32 && G.mode === 'play') {
      const dir = pointer.sx >= layout.cx ? 1 : -1;
      twist(dir);
    }
    pointer.down = false;
    pointer.id = null;
    pointer.hasAng = false;
    pointer.acc = 0;
    canvas.classList.remove('press');
    e.preventDefault();
  }

  function onKeyDown(e) {
    const k = e.key;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startRun();
      e.preventDefault();
      return;
    }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
        startRun();
        return;
      }
      if (!keys.cw) {
        keys.cw = true;
        G.heldDir = 1;
        twist(1);
      }
      return;
    }
    const cw = k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'l' || k === 'L' || k === '.';
    const ccw = k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'j' || k === 'J' || k === ',';
    if (cw) {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
        startRun();
        return;
      }
      if (!keys.cw) {
        keys.cw = true;
        G.heldDir = 1;
        twist(1);
      }
    } else if (ccw) {
      e.preventDefault();
      audio.ensure();
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
        startRun();
        return;
      }
      if (!keys.ccw) {
        keys.ccw = true;
        G.heldDir = -1;
        twist(-1);
      }
    }
  }

  function onKeyUp(e) {
    const k = e.key;
    if (k === ' ' || k === 'Enter' || k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'l' || k === 'L' || k === '.') {
      keys.cw = false;
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'j' || k === 'J' || k === ',') {
      keys.ccw = false;
    }
    if (keys.cw) G.heldDir = 1;
    else if (keys.ccw) G.heldDir = -1;
    else G.heldDir = 0;
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
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
    for (let i = foam.length - 1; i >= 0; i--) {
      const f = foam[i];
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vy += 420 * dt;
      f.vx *= 0.98;
      if (f.life <= 0) foam.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].life -= dt;
      if (sparks[i].life <= 0) sparks.splice(i, 1);
    }
    const st = STAGES[G.stage];
    const bodyH = (st && st.shape === 'flask' ? 0.72 : 0.9);
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      b.y -= (b.v * dt) / 220;
      b.x += Math.sin(G.clock * 1.6 + b.ph) * 0.08 * dt;
      if (b.y < 0.04) {
        b.y = bodyH;
        b.x = rand(-0.7, 0.7);
        b.r = rand(1.1, 2.8);
      }
    }
  }

  function update(dt) {
    G.clock += dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.justHit > 0) G.justHit -= dt;
    if (G.inputLock > 0) G.inputLock -= dt;
    if (G.judgeT > 0) G.judgeT -= dt;
    if (G.hintLock > 0) G.hintLock -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.4);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.8);
    if (G.pulse > 0) G.pulse = Math.max(0, G.pulse - dt * 3.2);
    if (G.beatGlow > 0) G.beatGlow = Math.max(0, G.beatGlow - dt * 3.5);
    if (G.slosh > 0) G.slosh = Math.max(0, G.slosh - dt * 1.6);
    cork.punch = Math.max(0, cork.punch - dt * 4.2);
    cork.omega *= Math.pow(0.08, dt);
    if (G.heldDir && G.mode === 'play') cork.omega += G.heldDir * KEY_SPIN * dt * 9;
    cork.ang += cork.omega * dt;

    const targetLift = cork.pop ? 1 : (hitsNeeded ? G.hits / hitsNeeded : 0);
    cork.liftVis += (targetLift - cork.liftVis) * Math.min(1, dt * 7);

    updateParticles(dt);

    if (G.mode === 'title') {
      cork.omega += Math.sin(G.clock * 0.8) * 0.4 * dt;
      nextHint();
      syncHud();
      return;
    }

    if (G.mode === 'win' || G.mode === 'lose') {
      nextHint();
      return;
    }

    if (G.mode === 'pop') {
      cork.vy += 980 * dt;
      cork.y += cork.vy * dt;
      cork.x += cork.vx * dt;
      G.popT += dt;
      if (G.popT > 1.18) {
        if (G.stage + 1 >= STAGES.length) {
          winRun();
        } else {
          beginStage(G.stage + 1);
          G.mode = 'play';
          G.inputLock = 0.12;
          G.flash = 0.2;
          G.flashCol = '#00f0ff';
        }
      }
      nextHint();
      syncHud();
      return;
    }

    if (G.mode !== 'play') return;

    G.songT += dt;

    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      if (p.fired || G.songT < p.t) continue;
      p.fired = true;
      G.pulse = 1;
      audio.click(p.bar === 0);
      if (p.type === 'count') G.countN = Math.max(0, p.n - 1);
    }

    if (G.heldDir && G.songT >= songStart) {
      const n = noteInWindow();
      if (n && n.state === 'open' && G.songT >= n.t - 0.018) {
        twist(G.heldDir);
      }
    }

    expireNotes();

    if (G.endArmed) {
      G.popT += dt;
      if (G.popT > 0.55) loseRun();
    }

    nextHint();
    syncHud();
  }

  function bottleGeom(st) {
    const s = layout.s;
    let neckW = 15 * s;
    let neckH = 62 * s;
    let bodyW = 50 * s;
    let bodyH = 168 * s;
    if (st.shape === 'champ') {
      neckW = 14 * s;
      neckH = 78 * s;
      bodyW = 48 * s;
      bodyH = 158 * s;
    } else if (st.shape === 'flask') {
      neckW = 16 * s;
      neckH = 48 * s;
      bodyW = 62 * s;
      bodyH = 150 * s;
    } else if (st.shape === 'potion') {
      neckW = 15 * s;
      neckH = 52 * s;
      bodyW = 58 * s;
      bodyH = 140 * s;
    }
    const top = layout.cy - (neckH + bodyH) * 0.46;
    return { neckW: neckW, neckH: neckH, bodyW: bodyW, bodyH: bodyH, top: top, s: s };
  }

  function bodyPath(g, st, cx, slosh) {
    const s = g.s;
    const neckBot = g.top + g.neckH;
    const bot = neckBot + g.bodyH;
    const bw = g.bodyW;
    const nw = g.neckW;
    const wob = slosh * 6 * s;
    ctx.beginPath();
    ctx.moveTo(cx - nw, g.top);
    ctx.lineTo(cx + nw, g.top);
    ctx.lineTo(cx + nw, neckBot - 10 * s);
    if (st.shape === 'potion') {
      ctx.bezierCurveTo(cx + nw, neckBot + 16 * s, cx + bw * 1.02 + wob, neckBot + 30 * s, cx + bw * 0.95 + wob, neckBot + g.bodyH * 0.52);
      ctx.quadraticCurveTo(cx + bw * 0.82, bot - 6 * s, cx, bot);
      ctx.quadraticCurveTo(cx - bw * 0.82, bot - 6 * s, cx - bw * 0.95 + wob * 0.3, neckBot + g.bodyH * 0.52);
      ctx.bezierCurveTo(cx - bw * 1.02 + wob * 0.3, neckBot + 30 * s, cx - nw, neckBot + 16 * s, cx - nw, neckBot - 10 * s);
    } else {
      ctx.bezierCurveTo(cx + nw, neckBot + 8 * s, cx + bw * 0.4, neckBot + 16 * s, cx + bw, neckBot + 48 * s);
      ctx.lineTo(cx + bw * 0.9 + wob, bot - 18 * s);
      ctx.quadraticCurveTo(cx + bw * 0.52, bot + 3 * s, cx, bot);
      ctx.quadraticCurveTo(cx - bw * 0.52, bot + 3 * s, cx - bw * 0.9 + wob * 0.35, bot - 18 * s);
      ctx.lineTo(cx - bw, neckBot + 48 * s);
      ctx.bezierCurveTo(cx - bw * 0.4, neckBot + 16 * s, cx - nw, neckBot + 8 * s, cx - nw, neckBot - 10 * s);
    }
    ctx.closePath();
  }

  function drawArrowArc(cx, cy, r, dir, alpha, thick) {
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.strokeStyle = dir > 0 ? rgba('#ff3db8', alpha) : rgba('#00f0ff', alpha);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineWidth = thick;
    ctx.lineCap = 'round';
    const a0 = dir > 0 ? -0.95 : Math.PI + 0.95;
    const a1 = dir > 0 ? 0.95 : Math.PI - 0.95;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1, dir < 0);
    ctx.stroke();
    const use = dir > 0 ? a1 : a0;
    const px = cx + Math.cos(use) * r;
    const py = cy + Math.sin(use) * r;
    const tx = -Math.sin(use) * dir;
    const ty = Math.cos(use) * dir;
    const hx = px + tx * 1;
    const hy = py + ty * 1;
    ctx.beginPath();
    ctx.moveTo(hx + tx * 7, hy + ty * 7);
    ctx.lineTo(hx - ty * 5.5, hy + tx * 5.5);
    ctx.lineTo(hx + ty * 5.5, hy - tx * 5.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCork(g, st, seatedY) {
    const s = g.s;
    const cx = layout.cx + cork.x;
    const liftPx = cork.liftVis * 34 * s + cork.punch * 7 * s;
    const y = seatedY - liftPx + cork.y;
    layout.corkY = y;
    const bw = 18 * s;
    const bh = 28 * s;
    const capW = 22 * s;
    const capH = 10 * s;

    ctx.save();
    ctx.translate(cx, y);
    ctx.rotate(cork.ang * 0.18);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, bh * 0.52, bw * 0.7, 3.2 * s, 0, 0, TAU);
    ctx.fill();

    const grd = ctx.createLinearGradient(-bw, 0, bw, 0);
    grd.addColorStop(0, '#8a5a32');
    grd.addColorStop(0.45, '#e0b57a');
    grd.addColorStop(1, '#6e4424');
    ctx.fillStyle = grd;
    ctx.strokeStyle = rgba('#ffe36b', 0.35 + G.beatGlow * 0.4);
    ctx.lineWidth = 1.4;
    roundRect(-bw * 0.5, -bh * 0.15, bw, bh, 4 * s);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    roundRect(-bw * 0.5, -bh * 0.15, bw, bh, 4 * s);
    ctx.clip();
    ctx.strokeStyle = 'rgba(80,40,16,0.45)';
    ctx.lineWidth = 1;
    for (let i = -3; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-bw, i * 6 * s + (cork.ang % 6) * s);
      ctx.lineTo(bw, i * 6 * s + 3 * s + (cork.ang % 6) * s);
      ctx.stroke();
    }
    ctx.restore();

    const cap = ctx.createLinearGradient(-capW, 0, capW, 0);
    cap.addColorStop(0, '#c48a48');
    cap.addColorStop(0.5, '#ffe3a8');
    cap.addColorStop(1, '#a06830');
    ctx.fillStyle = cap;
    ctx.strokeStyle = rgba('#ffe36b', 0.55);
    ctx.lineWidth = 1.3;
    roundRect(-capW * 0.5, -bh * 0.15 - capH, capW, capH, 3.4 * s);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = rgba('#ff3db8', 0.85);
    ctx.beginPath();
    ctx.arc(0, -bh * 0.15 - capH * 0.5, 2.1 * s, 0, TAU);
    ctx.fill();

    if (st.foil && !cork.pop) {
      ctx.strokeStyle = rgba('#ff3db8', 0.7);
      ctx.lineWidth = 1.3 * s;
      ctx.beginPath();
      ctx.moveTo(-bw * 0.62, bh * 0.12);
      ctx.lineTo(0, -bh * 0.2);
      ctx.lineTo(bw * 0.62, bh * 0.12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, bh * 0.18, bw * 0.55, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function drawTimeline() {
    const y = H - 28;
    const px = 132;
    const nowX = layout.cx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(16, y - 22, W - 32, 40);
    ctx.clip();

    ctx.strokeStyle = 'rgba(255,227,107,0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nowX, y - 16);
    ctx.lineTo(nowX, y + 16);
    ctx.stroke();
    ctx.fillStyle = rgba('#ffe36b', 0.18);
    ctx.fillRect(nowX - 10, y - 16, 20, 32);

    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      if (p.type !== 'count') continue;
      const x = nowX + (p.t - G.songT) * px;
      if (x < -12 || x > W + 12) continue;
      ctx.fillStyle = rgba('#ffe36b', p.fired ? 0.18 : 0.7);
      ctx.fillRect(x - 1.5, y - 8, 3, 16);
    }

    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      const x = nowX + (n.t - G.songT) * px;
      if (x < -20 || x > W + 20) continue;
      const a = n.state === 'open' ? 0.95 : 0.28;
      if (n.dir === 0) {
        ctx.strokeStyle = rgba('#00f0ff', a);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, TAU);
        ctx.stroke();
      } else {
        ctx.fillStyle = n.dir > 0 ? rgba('#ff3db8', a) : rgba('#00f0ff', a);
        ctx.beginPath();
        const s = 8;
        if (n.dir > 0) {
          ctx.moveTo(x - s, y - s);
          ctx.lineTo(x + s, y);
          ctx.lineTo(x - s, y + s);
        } else {
          ctx.moveTo(x + s, y - s);
          ctx.lineTo(x - s, y);
          ctx.lineTo(x + s, y + s);
        }
        ctx.closePath();
        ctx.fill();
      }
      if (n.state === 'hit') {
        ctx.strokeStyle = rgba('#ffe36b', 0.5);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else if (n.state === 'miss') {
        ctx.strokeStyle = rgba('#ff3db8', 0.7);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x - 6, y - 6);
        ctx.lineTo(x + 6, y + 6);
        ctx.moveTo(x + 6, y - 6);
        ctx.lineTo(x - 6, y + 6);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function draw() {
    const st = STAGES[G.stage];
    const g = bottleGeom(st);
    const cx = layout.cx;
    const slosh = G.slosh * Math.sin(G.clock * 22) * 0.8;
    const neckBot = g.top + g.neckH;
    const seated = g.top + 6 * g.s;
    layout.neckY = g.top;
    layout.bodyTop = neckBot;
    layout.bodyBot = neckBot + g.bodyH;

    let sx = 0;
    let sy = 0;
    if (G.shake > 0) {
      sx = (Math.random() - 0.5) * 10 * G.shake;
      sy = (Math.random() - 0.5) * 8 * G.shake;
    }

    ctx.save();
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const bg = ctx.createRadialGradient(cx, layout.cy, 20, cx, layout.cy, Math.max(W, H) * 0.7);
    bg.addColorStop(0, 'rgba(40,10,48,0.55)');
    bg.addColorStop(0.45, 'rgba(8,4,20,0.2)');
    bg.addColorStop(1, '#05030c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const tw = 0.5 + 0.5 * Math.sin(G.clock * m.s + m.p);
      ctx.fillStyle = rgba(i % 3 === 0 ? '#ff3db8' : '#00f0ff', m.a * tw);
      ctx.beginPath();
      ctx.arc(m.x * W, (m.y * H + G.clock * 6 * m.s) % H, m.r, 0, TAU);
      ctx.fill();
    }

    ctx.translate(sx, sy);

    const floorY = layout.bodyBot + 18 * g.s;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, floorY, g.bodyW * 1.15, 10 * g.s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba('#00f0ff', 0.12 + G.pulse * 0.18);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    const glow = 0.08 + G.beatGlow * 0.22 + G.pulse * 0.12;
    ctx.fillStyle = rgba(st.liquid, glow);
    ctx.beginPath();
    ctx.ellipse(cx, layout.cy + 20 * g.s, g.bodyW * 1.6, g.bodyH * 0.7, 0, 0, TAU);
    ctx.fill();

    ctx.save();
    bodyPath(g, st, cx, slosh);
    ctx.fillStyle = 'rgba(6, 18, 28, 0.72)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    bodyPath(g, st, cx, slosh);
    ctx.clip();
    const liqTop = neckBot + g.bodyH * 0.18 + Math.sin(G.clock * 2.2) * 2.5 * g.s + slosh * 2;
    const lg = ctx.createLinearGradient(cx, liqTop, cx, layout.bodyBot);
    lg.addColorStop(0, rgba(st.liquid, 0.55));
    lg.addColorStop(0.55, rgba(st.liquid, 0.82));
    lg.addColorStop(1, rgba('#3a0820', 0.95));
    ctx.fillStyle = lg;
    ctx.fillRect(cx - g.bodyW * 1.3, liqTop, g.bodyW * 2.6, g.bodyH);
    ctx.fillStyle = rgba('#ffffff', 0.08);
    ctx.beginPath();
    ctx.ellipse(cx, liqTop, g.bodyW * 0.82, 4.5 * g.s, 0, 0, TAU);
    ctx.fill();
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      const bx = cx + b.x * g.bodyW * 0.72;
      const by = liqTop + b.y * (layout.bodyBot - liqTop);
      if (by > layout.bodyBot - 6 || by < liqTop + 2) continue;
      ctx.strokeStyle = rgba('#ffffff', 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(bx, by, b.r * g.s, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    bodyPath(g, st, cx, slosh);
    ctx.strokeStyle = rgba('#00f0ff', 0.55 + G.pulse * 0.35);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    bodyPath(g, st, cx, slosh);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 3 * g.s;
    ctx.beginPath();
    ctx.moveTo(cx - g.bodyW * 0.42, neckBot + 20 * g.s);
    ctx.lineTo(cx - g.bodyW * 0.38, layout.bodyBot - 28 * g.s);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 8 * g.s;
    ctx.beginPath();
    ctx.moveTo(cx + g.bodyW * 0.28, neckBot + 36 * g.s);
    ctx.lineTo(cx + g.bodyW * 0.22, layout.bodyBot - 40 * g.s);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    bodyPath(g, st, cx, slosh);
    ctx.clip();
    ctx.fillStyle = rgba(st.liquid, 0.16);
    ctx.fillRect(cx - g.neckW - 2, neckBot - 26 * g.s, g.neckW * 2 + 4, 22 * g.s);
    ctx.restore();

    if (G.mode === 'play' || G.mode === 'title') {
      const next = nextOpen();
      const look = LOOKAHEAD;
      for (let i = 0; i < notes.length; i++) {
        const n = notes[i];
        if (n.state !== 'open') continue;
        const until = n.t - G.songT;
        if (until < -0.05 || until > look) continue;
        const k = until / look;
        const rr = layout.corkR + 18 * g.s + k * 86 * g.s;
        const a = n.dir === 0 ? 0.18 + (1 - k) * 0.35 : 0.22 + (1 - k) * 0.55;
        ctx.strokeStyle = n.dir === 0 ? rgba('#00f0ff', a) : n.dir > 0 ? rgba('#ff3db8', a) : rgba('#00f0ff', a);
        ctx.lineWidth = n.dir === 0 ? 1.4 : 2.2;
        ctx.setLineDash(n.dir === 0 ? [4, 5] : []);
        ctx.beginPath();
        ctx.arc(cx, seated - 8 * g.s, rr, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        if (n.dir !== 0) drawArrowArc(cx, seated - 8 * g.s, rr, n.dir, a, 2.2);
      }
      if (next && next.dir !== 0 && G.mode === 'play') {
        const until = Math.max(0, next.t - G.songT);
        const pulse = 0.45 + 0.55 * (1 - clamp(until / 0.7, 0, 1));
        drawArrowArc(cx, seated - 8 * g.s, 34 * g.s + Math.sin(G.clock * 8) * 2, next.dir, pulse, 3.2);
      } else if (G.mode === 'title') {
        drawArrowArc(cx, seated - 8 * g.s, 36 * g.s, 1, 0.45 + 0.2 * Math.sin(G.clock * 3), 2.6);
      }
    }

    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = 1 - r.life / r.max;
      ctx.strokeStyle = rgba(r.col, (1 - t) * 0.7);
      ctx.lineWidth = 2.4 * (1 - t);
      ctx.beginPath();
      ctx.arc(cx, seated - 8 * g.s, r.r + t * 40 * g.s, 0, TAU);
      ctx.stroke();
    }

    drawCork(g, st, seated);

    if (G.mode === 'play' && G.songT < songStart) {
      ctx.fillStyle = rgba('#ffe36b', 0.9);
      ctx.font = '900 ' + (42 * g.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const n = Math.max(1, G.countN);
      ctx.fillText(String(n), cx, seated - 70 * g.s);
    }

    if (G.judgeT > 0 && G.mode === 'play') {
      ctx.globalAlpha = clamp(G.judgeT / 0.4, 0, 1);
      ctx.fillStyle = G.judgeCol;
      ctx.font = '800 ' + (22 * g.s) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(G.judge, cx, g.top - 28 * g.s);
      ctx.globalAlpha = 1;
    }

    if (G.combo >= 2 && G.mode === 'play') {
      ctx.fillStyle = rgba('#ffe36b', 0.85);
      ctx.font = '700 ' + (14 * g.s) + 'px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(G.combo + ' 连', cx, layout.bodyBot + 36 * g.s);
    }

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.col, p.life / p.max);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < foam.length; i++) {
      const f = foam[i];
      ctx.fillStyle = rgba(f.col, 0.55 * (f.life / f.max));
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * g.s, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = f.life / f.max;
      ctx.fillStyle = f.col;
      ctx.font = '800 16px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (G.mode === 'play' || G.mode === 'pop') drawTimeline();

    if (G.mode === 'play') {
      ctx.fillStyle = rgba('#00f0ff', 0.4);
      ctx.font = '700 12px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('左拧', 18, H * 0.48);
      ctx.fillStyle = rgba('#ff3db8', 0.4);
      ctx.textAlign = 'right';
      ctx.fillText('右拧', W - 18, H * 0.48);
    }

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashCol, G.flash * 0.18);
      ctx.fillRect(0, 0, W, H);
    }

    const vig = ctx.createRadialGradient(cx, layout.cy, Math.min(W, H) * 0.2, cx, layout.cy, Math.max(W, H) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  function frame(now) {
    const t = now * 0.001;
    let dt = lastT ? t - lastT : 0.016;
    lastT = t;
    if (dt > 0.05) dt = 0.05;
    if (!hidden) {
      update(dt);
      draw();
    }
    requestAnimationFrame(frame);
  }

  ovBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    if (G.mode === 'play' || G.mode === 'pop') return;
    startRun();
    ovBtn.blur();
  });
  btnRetry.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    startRun();
  });
  btnMute.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    lastT = 0;
  });

  overlay.addEventListener('pointerdown', function (e) {
    if (e.target === overlay) {
      audio.ensure();
    }
  });

  audio.setMuted(audio.muted);
  buildPips();
  seedMotes();
  seedBubbles();
  resize();
  compile(0);
  resetCork();
  showPanel('title');
  syncHud();
  requestAnimationFrame(frame);
})();
