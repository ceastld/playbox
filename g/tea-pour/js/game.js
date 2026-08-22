'use strict';

(function () {
  const VW = 480;
  const VH = 760;
  const POT_X = 152;
  const POT_Y = 236;
  const CUP_X = 304;
  const TABLE_Y = 668;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const REST = 0.12;
  const POUR = 0.96;
  const MUTE_KEY = 'playbox-tea-pour-mute';
  const OPS = '按住空格 / ↓ 倒茶 · 点按画面 · M 静音';

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };

  const STAGES = [
    { name: '初斟', sub: 'INIT', rate: 0.152, line: 0.68, tol: 0.16, drip: 0.1, accel: 0, slosh: 0, time: 0, cupH: 154, top: 58, hint: '按住倒茶，进金区就松手' },
    { name: '满盏', sub: 'FULL', rate: 0.22, line: 0.74, tol: 0.11, drip: 0.12, accel: 0, slosh: 0, time: 0, cupH: 148, top: 54, hint: '再快一点，别过线' },
    { name: '细线', sub: 'THIN', rate: 0.24, line: 0.76, tol: 0.06, drip: 0.14, accel: 0, slosh: 0, time: 0, cupH: 144, top: 52, hint: '金区变窄了，分两次倒也行' },
    { name: '余滴', sub: 'DRIP', rate: 0.255, line: 0.72, tol: 0.07, drip: 0.82, accel: 0, slosh: 0, time: 0, cupH: 146, top: 52, hint: '松手还会滴，提前停' },
    { name: '急流', sub: 'RUSH', rate: 0.175, line: 0.74, tol: 0.055, drip: 0.18, accel: 0.9, slosh: 0, time: 0, cupH: 142, top: 50, hint: '按太久会冲，点按微调' },
    { name: '浅盏', sub: 'LOW', rate: 0.36, line: 0.8, tol: 0.05, drip: 0.22, accel: 0, slosh: 0, time: 0, cupH: 108, top: 62, hint: '盏浅，满得快' },
    { name: '摇盏', sub: 'SLOSH', rate: 0.275, line: 0.7, tol: 0.055, drip: 0.28, accel: 0.22, slosh: 1, time: 0, cupH: 140, top: 50, hint: '倒太猛会晃洒，轻一点' },
    { name: '客催', sub: 'WAIT', rate: 0.33, line: 0.75, tol: 0.048, drip: 0.22, accel: 0.32, slosh: 0, time: 7.4, cupH: 138, top: 50, hint: '客人在等，倒满就停' },
    { name: '一线', sub: 'HAIR', rate: 0.265, line: 0.78, tol: 0.028, drip: 0.74, accel: 0.18, slosh: 0, time: 0, cupH: 136, top: 48, hint: '一线之隔，提前松、看余滴' },
    { name: '满席', sub: 'FEAST', rate: 0.295, line: 0.76, tol: 0.03, drip: 0.56, accel: 0.68, slosh: 1, time: 8.2, cupH: 132, top: 48, hint: '又晃又滴，客人还在等' }
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
  const fillZone = document.getElementById('fill-zone');
  const fillMark = document.getElementById('fill-mark');
  const fillNum = document.getElementById('fill-num');
  const stageLabel = document.getElementById('stage-label');
  const leftLabel = document.getElementById('left-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const keys = { pour: false };
  const pointer = { down: false, id: null };

  const particles = [];
  const motes = [];
  const rings = [];
  const pips = [];
  const steam = [];
  const drops = [];

  const lanterns = [
    { x: 58, y: 78, ph: 0.2, hue: 0, s: 0.92 },
    { x: 232, y: 52, ph: 1.1, hue: 1, s: 0.78 },
    { x: 422, y: 86, ph: 2.4, hue: 2, s: 1.05 }
  ];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    fill: 0,
    tilt: 0,
    stream: 0,
    holdT: 0,
    slosh: 0,
    svel: 0,
    timeLeft: 0,
    lock: 0,
    settle: 0,
    spillT: 0,
    shake: 0,
    magFlash: 0,
    goldFlash: 0,
    lineGlow: 0,
    toastT: 0,
    why: '',
    taught: false,
    underTold: false,
    inBand: false,
    demoHold: false,
    demoWait: 0,
    pourPulse: 0,
    lastDrip: 0,
    lastWarn: 0,
    lastPourSnd: 0
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
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgb(c, a) {
    if (a == null) return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
    return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }
  function approach(cur, target, rate) {
    if (cur < target) return Math.min(target, cur + rate);
    return Math.max(target, cur - rate);
  }
  function qbez(a, b, c, t) {
    const u = 1 - t;
    return u * u * a + 2 * u * t * b + t * t * c;
  }

  function potAng() {
    return lerp(REST, POUR, ease(G.tilt));
  }

  function spoutTip() {
    const ang = potAng();
    const lx = 90;
    const ly = 6;
    return {
      x: POT_X + Math.cos(ang) * lx - Math.sin(ang) * ly,
      y: POT_Y + Math.sin(ang) * lx + Math.cos(ang) * ly
    };
  }

  function cupGeom(st) {
    const h = st ? st.cupH : 148;
    const topH = st ? st.top : 54;
    const mouth = TABLE_Y - h + 8;
    return {
      h: h,
      mouth: mouth,
      topH: topH,
      botH: topH * 0.68,
      innerTop: mouth + 12,
      innerBot: mouth + h - 18
    };
  }

  function yAtFill(g, f) {
    return lerp(g.innerBot, g.innerTop, clamp(f, 0, 1.08));
  }

  function inBand(st, fill) {
    return fill >= st.line - st.tol && fill <= st.line + 0.0008;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    pourGain: null,
    pourFilter: null,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
        this._pour();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    _pour: function () {
      const sr = this.ctx.sampleRate;
      const n = Math.max(1, (sr * 0.36) | 0);
      const buf = this.ctx.createBuffer(1, n, sr);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        last = last * 0.86 + (Math.random() * 2 - 1) * 0.14;
        data[i] = last;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500;
      bp.Q.value = 0.45;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      src.connect(bp);
      bp.connect(g);
      g.connect(this.master);
      src.start();
      this.pourGain = g;
      this.pourFilter = bp;
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      if (m && this.pourGain) this.pourGain.gain.value = 0;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    setPour: function (amt) {
      if (!this.pourGain) return;
      const t = this.ctx.currentTime;
      const v = this.muted ? 0 : amt * 0.085;
      this.pourGain.gain.setTargetAtTime(v, t, 0.05);
      if (this.pourFilter) {
        this.pourFilter.frequency.setTargetAtTime(900 + amt * 1400, t, 0.08);
      }
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
    noise: function (dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = Math.min(0.28, Math.max(0.04, dur));
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
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    drip: function () {
      this.ensure();
      this.beep(620, 0.05, 'sine', 0.03, 280);
      this.noise(0.05, 0.03, 1600);
    },
    band: function () {
      this.ensure();
      this.beep(784, 0.14, 'sine', 0.07, 1180);
      this.beep(1175, 0.2, 'triangle', 0.04, 1560);
    },
    warn: function () {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.03);
    },
    overflow: function () {
      this.ensure();
      this.noise(0.28, 0.09, 360);
      this.beep(210, 0.32, 'sawtooth', 0.055, 64);
      this.beep(86, 0.42, 'sine', 0.07, 38);
    },
    wait: function () {
      this.ensure();
      this.beep(196, 0.22, 'sine', 0.05, 110);
      this.beep(147, 0.3, 'triangle', 0.04, 80);
    },
    clear: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06, 523);
      this.beep(659, 0.14, 'sine', 0.055, 659);
      this.beep(784, 0.22, 'triangle', 0.05, 1046);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.14, 'sine', 0.07);
      this.beep(659, 0.16, 'sine', 0.06);
      this.beep(784, 0.18, 'sine', 0.06);
      this.beep(1046, 0.36, 'triangle', 0.07, 1560);
    },
    start: function () {
      this.ensure();
      this.beep(392, 0.12, 'sine', 0.05, 784);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 180) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.4, spec.j * 0.4),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        g: spec.g == null ? 420 : spec.g
      });
    }
  }

  function addRing(x, y, mag, gold) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag, gold: !!gold });
    if (rings.length > 18) rings.shift();
  }

  function addSteam(x, y, n) {
    for (let i = 0; i < n; i++) {
      if (steam.length > 60) steam.shift();
      steam.push({
        x: x + rand(-8, 8),
        y: y + rand(-4, 4),
        vx: rand(-10, 10),
        vy: rand(-46, -18),
        life: rand(0.5, 1.05),
        max: 1,
        r: rand(1.2, 3.2)
      });
    }
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.55;
  }

  function syncPips() {
    while (pips.length < LIVES) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncHud() {
    const st = STAGES[G.stage] || STAGES[0];
    const fill = G.fill;
    const k = clamp(fill, 0, 1);
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillZone.style.left = ((st.line - st.tol) * 100) + '%';
    fillZone.style.width = (st.tol * 100) + '%';
    fillMark.style.left = (st.line * 100) + '%';
    fillNum.textContent = Math.round(fill * 100) + '';
    const band = G.mode === 'play' && inBand(st, fill) && G.why === '';
    const over = G.mode === 'play' && fill > st.line;
    const close = G.mode === 'play' && fill > st.line - st.tol * 0.55 && !over;
    fillWrap.classList.toggle('hot', band || (G.mode === 'clear'));
    fillWrap.classList.toggle('warn', over || G.mode === 'spill');
    if (G.mode === 'title') {
      stageLabel.textContent = '十盏';
      leftLabel.textContent = '到线松';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 盏 · ' + st.name;
      if (st.time && G.mode === 'play') {
        leftLabel.textContent = '客 ' + Math.max(0, G.timeLeft).toFixed(1) + 's';
      } else if (band) {
        leftLabel.textContent = '可停';
      } else {
        leftLabel.textContent = close ? '将近' : '到线松';
      }
    }
    stageLabel.classList.toggle('hot', band);
    leftLabel.classList.toggle('warn', (st.time && G.mode === 'play' && G.timeLeft < 2.2) || over);
    syncPips();
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function showOverlay(kind, title, lead, btn, kicker, ops) {
    overlay.classList.remove('hidden');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kicker;
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovBtn.textContent = btn;
    ovOps.textContent = ops || OPS;
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function applyStage(st, demo) {
    G.fill = demo ? G.fill : 0;
    G.tilt = demo ? G.tilt : 0;
    G.stream = demo ? G.stream : 0;
    G.holdT = 0;
    G.slosh = 0;
    G.svel = 0;
    G.timeLeft = st.time || 0;
    G.settle = 0;
    G.spillT = 0;
    G.why = '';
    G.inBand = false;
    G.underTold = false;
    G.lineGlow = 0;
    if (!demo) {
      G.fill = 0;
      G.tilt = 0;
      G.stream = 0;
    }
  }

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.22;
    G.why = '';
    applyStage(STAGES[i], false);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(fromFail ? '再斟' : STAGES[i].name, !!fromFail, !fromFail);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    steam.length = 0;
    drops.length = 0;
    G.lives = LIVES;
    G.taught = false;
    startStage(0, false);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    steam.length = 0;
    drops.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    G.fill = 0.08;
    G.tilt = 0;
    G.stream = 0;
    G.demoHold = false;
    G.demoWait = 0;
    applyStage(STAGES[0], true);
    showOverlay(
      'title',
      '斟茶',
      '按住把茶倒到水位线。<br />洒出杯口，这一盏作废。',
      '开斟',
      'POUR',
      OPS
    );
    setHint('按住倒茶 · 到线松手', '');
    syncHud();
  }

  function beginOverflow() {
    if (G.mode !== 'play' || G.why) return;
    G.why = 'over';
    G.mode = 'spill';
    G.spillT = 0.88;
    G.magFlash = 0.72;
    G.shake = 14;
    audio.overflow();
    toast('洒了', true);
    setHint('茶漫过了水位线', 'warn');
    const st = STAGES[G.stage];
    const g = cupGeom(st);
    const y = yAtFill(g, Math.min(G.fill, 1));
    emit(26, {
      x: CUP_X, y: y, j: 22,
      vx0: -160, vx1: 160, vy0: -200, vy1: 30,
      life: 0.72, r0: 1.6, r1: 4.4, mag: true, g: 520
    });
    addRing(CUP_X, g.mouth, true, false);
  }

  function beginWait() {
    if (G.mode !== 'play' || G.why) return;
    G.why = 'wait';
    G.mode = 'spill';
    G.spillT = 0.7;
    G.magFlash = 0.4;
    audio.wait();
    toast('客走了', true);
    setHint('客人等不及了', 'warn');
  }

  function failStage() {
    const why = G.why;
    G.mode = 'fail';
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    if (why === 'wait') {
      showOverlay(
        'lose',
        '客走',
        more
          ? '客人等不及这一盏。<br />还剩 ' + G.lives + ' 次。'
          : '客人走了。十盏未完。',
        more ? '再斟这盏' : '再来一局',
        'WAIT'
      );
    } else {
      showOverlay(
        'lose',
        '洒了',
        more
          ? '茶漫过了水位线。金区里就要松手。<br />还剩 ' + G.lives + ' 次。'
          : '茶漫过了水位线。十盏未完。',
        more ? '再斟这盏' : '再来一局',
        'SPILL'
      );
    }
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.9;
    G.goldFlash = 0.82;
    audio.clear();
    toast('满到线了', false, true);
    const st = STAGES[G.stage];
    const g = cupGeom(st);
    emit(18, {
      x: CUP_X, y: yAtFill(g, st.line), j: 18,
      vx0: -70, vx1: 70, vy0: -90, vy1: -8,
      life: 0.72, r0: 1.2, r1: 3.1, gold: true, g: 180
    });
    addRing(CUP_X, g.mouth - 8, false, true);
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '满席',
        '十盏都停在线上，一滴不洒。',
        '再斟一巡',
        'FULL TABLE'
      );
      setHint('十盏皆满', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 1.05;
    setHint('这一盏成了', 'hot');
  }

  function overlayAction() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win') {
      startRun();
      return;
    }
    if (G.mode === 'fail') {
      if (G.lives > 0) startStage(G.stage, true);
      else startRun();
    }
  }

  function isPouring() {
    if (G.mode === 'title') return G.demoHold;
    if (G.mode !== 'play') return false;
    if (G.lock > 0 || G.why) return false;
    if (!overlay.classList.contains('hidden')) return false;
    return keys.pour || pointer.down;
  }

  function flowAmount(st) {
    const s = Math.max(0, G.stream - 0.07) / 0.93;
    if (s <= 0) return 0;
    const rush = 1 + st.accel * G.holdT;
    return Math.pow(s, 1.12) * st.rate * rush;
  }

  function updatePour(dt, st, live) {
    const hold = isPouring();
    if (hold) {
      G.tilt = approach(G.tilt, 1, 5.8 * dt);
      G.stream = approach(G.stream, 1, 6.4 * dt);
      G.holdT = Math.min(2.6, G.holdT + dt);
    } else {
      G.tilt = approach(G.tilt, 0, 4.4 * dt);
      const decay = 7.8 / (1 + st.drip * 9);
      G.stream = approach(G.stream, 0, decay * dt);
      G.holdT = Math.max(0, G.holdT - dt * 4.2);
    }
    G.pourPulse = lerp(G.pourPulse, hold ? 1 : G.stream, 1 - Math.exp(-10 * dt));

    const flow = live ? flowAmount(st) : 0;
    if (st.slosh) {
      G.svel += flow * flow * 38 * dt;
      G.svel += -G.slosh * 26 * dt;
      G.svel *= Math.exp(-dt * 3.4);
      G.slosh += G.svel * dt;
      G.slosh = clamp(G.slosh, -0.14, 0.14);
    } else {
      G.slosh = lerp(G.slosh, 0, 1 - Math.exp(-8 * dt));
      G.svel *= Math.exp(-dt * 8);
    }

    if (!live) return flow;

    if (flow > 0 && G.why === '') {
      const next = G.fill + flow * dt;
      const splash = st.slosh ? Math.max(0, G.slosh) * 0.85 : 0;
      if (next + splash > st.line + 0.0015) {
        G.fill = Math.max(next, st.line + 0.02);
        beginOverflow();
        return flow;
      }
      G.fill = next;
    }

    const geom = cupGeom(st);
    const tip = spoutTip();
    const surf = yAtFill(geom, G.fill);
    if (flow > 0.04 && Math.random() < dt * (10 + flow * 40)) {
      emit(1, {
        x: CUP_X + rand(-8, 8),
        y: Math.min(surf, geom.mouth + 8),
        j: 4,
        vx0: -18, vx1: 18, vy0: -8, vy1: 22,
        life: 0.32, r0: 0.9, r1: 2.1, gold: true, g: 260
      });
    }
    if (G.stream > 0.12 && Math.random() < dt * 8) {
      emit(1, {
        x: tip.x, y: tip.y, j: 3,
        vx0: 10, vx1: 40, vy0: 20, vy1: 80,
        life: 0.28, r0: 0.8, r1: 1.8, gold: true, g: 380
      });
    }
    if (G.fill > 0.12 && Math.random() < dt * (2 + G.fill * 3)) {
      addSteam(CUP_X, geom.mouth - 6, 1);
    }
    if (G.stream > 0.2 && Math.random() < dt * 5) {
      addSteam(POT_X - 4, POT_Y + 46, 1);
    }
    if (G.stream > 0.05 && G.stream < 0.42 && G.clock - G.lastDrip > 0.16) {
      G.lastDrip = G.clock;
      drops.push({
        x: tip.x,
        y: tip.y,
        vx: rand(8, 28),
        vy: rand(40, 90),
        r: rand(2.2, 3.6),
        life: 0.7
      });
      if (drops.length > 14) drops.shift();
    }
    return flow;
  }

  function updateDrops(dt, st) {
    const geom = cupGeom(st);
    const surf = yAtFill(geom, G.fill);
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.life -= dt;
      d.vy += 520 * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y >= surf && Math.abs(d.x - CUP_X) < geom.topH * 0.85) {
        addRing(d.x, surf, false, true);
        if (G.mode === 'play' && G.clock - G.lastPourSnd > 0.11) {
          G.lastPourSnd = G.clock;
          audio.drip();
        }
        drops.splice(i, 1);
        continue;
      }
      if (d.life <= 0 || d.y > TABLE_Y + 8) drops.splice(i, 1);
    }
  }

  function updateTitle(dt) {
    const st = STAGES[0];
    const early = st.line - st.tol * 0.42 - 0.03;
    if (G.demoWait > 0) {
      G.demoHold = false;
      G.demoWait -= dt;
      if (G.demoWait <= 0) {
        G.fill = 0.06;
        G.tilt = 0;
        G.stream = 0;
        G.slosh = 0;
      }
    } else if (G.fill < early) {
      G.demoHold = true;
    } else {
      G.demoHold = false;
    }
    updatePour(dt, st, true);
    if (G.fill > st.line) G.fill = st.line;
    updateDrops(dt, st);
    if (!G.demoHold && G.stream < 0.06 && G.fill >= st.line - st.tol && G.demoWait <= 0) {
      G.demoWait = 1.25;
    }
  }

  function updatePlay(dt) {
    const st = STAGES[G.stage];
    if (!st) return;
    updatePour(dt, st, G.why === '');
    updateDrops(dt, st);

    if (G.why) return;

    if (st.time) {
      G.timeLeft -= dt;
      if (G.timeLeft <= 0) {
        G.timeLeft = 0;
        beginWait();
        return;
      }
    }

    const band = inBand(st, G.fill);
    const hold = isPouring();
    if (band && !G.inBand) {
      G.inBand = true;
      G.lineGlow = 1;
      G.goldFlash = 0.35;
      audio.band();
      if (!G.taught) {
        G.taught = true;
        toast('可停', false, true);
      }
      setHint('金区里，松手', 'hot');
    }
    if (!band) G.inBand = false;

    if (G.fill > st.line - 0.1 && G.fill < st.line - st.tol && G.clock - G.lastWarn > 0.55) {
      G.lastWarn = G.clock;
      audio.warn();
    }

    const still = !hold && G.stream < 0.045 && Math.abs(G.slosh) < 0.018;
    if (still && band) {
      G.settle += dt;
      if (G.settle > 0.38) clearStage();
    } else {
      G.settle = 0;
    }

    if (still && !band && G.fill > 0.08 && G.fill < st.line - st.tol && !G.underTold) {
      G.underTold = true;
      toast('再倒一点');
      setHint(st.hint, '');
    }
    if (hold) G.underTold = false;
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.7);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lineGlow = Math.max(0, G.lineGlow - dt * 0.9);
    G.lock = Math.max(0, G.lock - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = steam.length - 1; i >= 0; i--) {
      const s = steam[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.98;
      if (s.life <= 0) steam.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.6) rings.splice(i, 1);
    }
    if (G.mode === 'spill') {
      const st = STAGES[G.stage] || STAGES[0];
      const geom = cupGeom(st);
      if (Math.random() < dt * 16) {
        emit(2, {
          x: CUP_X + rand(-geom.topH * 0.4, geom.topH * 0.4),
          y: geom.mouth, j: 6,
          vx0: -70, vx1: 70, vy0: -90, vy1: -10,
          life: 0.42, r0: 1.2, r1: 2.8, mag: true, g: 380
        });
      }
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    const st = STAGES[G.stage] || STAGES[0];
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'spill') {
      G.spillT -= dt;
      G.stream = approach(G.stream, 0, 3 * dt);
      G.tilt = approach(G.tilt, 0.4, 2 * dt);
      updateDrops(dt, st);
      if (G.spillT <= 0) failStage();
    } else if (G.mode === 'clear') {
      G.settle -= dt;
      G.tilt = approach(G.tilt, 0, 4 * dt);
      G.stream = approach(G.stream, 0, 6 * dt);
      if (G.settle <= 0) startStage(G.stage + 1, false);
    } else if (G.mode === 'fail' || G.mode === 'win') {
      G.tilt = approach(G.tilt, 0, 3 * dt);
      G.stream = approach(G.stream, 0, 4 * dt);
    }
    updateFx(dt);
    const hiss = (G.mode === 'play' || G.mode === 'title') ? G.stream : G.stream * 0.3;
    if (audio.ctx) audio.setPour(hiss);
    canvas.classList.toggle('hold', isPouring());
    syncHud();
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createRadialGradient(sx(90), sy(40), 10, sx(90), sy(40), 280 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.16)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(70), 10, sx(400), sy(70), 260 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    g2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    ctx.fillStyle = '#070414';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    vg.addColorStop(0, 'rgba(22, 8, 36, 0.92)');
    vg.addColorStop(0.42, 'rgba(8, 6, 20, 0.2)');
    vg.addColorStop(1, 'rgba(12, 8, 16, 0.7)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.045)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const x = sx(36 + i * 82);
      ctx.beginPath();
      ctx.moveTo(x, sy(18));
      ctx.lineTo(x, sy(TABLE_Y - 12));
      ctx.stroke();
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.4 + m.p) * 10);
      const y = sy((m.y + G.clock * m.s) % VH);
      ctx.fillStyle = 'rgba(180, 230, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLanterns() {
    for (let i = 0; i < lanterns.length; i++) {
      const L = lanterns[i];
      const sway = Math.sin(G.clock * 0.85 + L.ph) * 7;
      const x = sx(L.x + sway);
      const y = sy(L.y);
      const s = scale * L.s;
      ctx.strokeStyle = 'rgba(255, 227, 107, 0.35)';
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(L.x), sy(0));
      ctx.lineTo(x, y - 16 * s);
      ctx.stroke();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const col = L.hue === 0 ? MAG : L.hue === 1 ? GOLD : CYN;
      ctx.fillStyle = rgb(col, 0.1);
      ctx.beginPath();
      ctx.ellipse(x, y + 4 * s, 22 * s, 18 * s, 0, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#140c1c';
      ctx.strokeStyle = rgb(col, 0.85);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(x, y - 18 * s);
      ctx.lineTo(x + 11 * s, y - 8 * s);
      ctx.lineTo(x + 9 * s, y + 10 * s);
      ctx.lineTo(x, y + 16 * s);
      ctx.lineTo(x - 9 * s, y + 10 * s);
      ctx.lineTo(x - 11 * s, y - 8 * s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = rgb(col, 0.4);
      ctx.beginPath();
      ctx.moveTo(x, y - 12 * s);
      ctx.lineTo(x, y + 10 * s);
      ctx.moveTo(x - 6 * s, y);
      ctx.lineTo(x + 6 * s, y);
      ctx.stroke();
      ctx.strokeStyle = rgb(col, 0.7);
      ctx.beginPath();
      ctx.moveTo(x, y + 16 * s);
      ctx.lineTo(x, y + 22 * s);
      ctx.stroke();
      ctx.fillStyle = rgb(col, 0.9);
      ctx.beginPath();
      ctx.arc(x, y + 24 * s, 2.1 * s, 0, TAU);
      ctx.fill();
    }
  }

  function drawTable() {
    const y = sy(TABLE_Y);
    const g = ctx.createLinearGradient(sx(0), y - 18 * scale, sx(0), sy(VH));
    g.addColorStop(0, 'rgba(255, 227, 107, 0.05)');
    g.addColorStop(0.08, '#160a14');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), y - 8 * scale, VW * scale, sy(VH) - (y - 8 * scale));

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(16), sy(TABLE_Y));
    ctx.lineTo(sx(VW - 16), sy(TABLE_Y));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.14)';
    ctx.lineWidth = 7 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(40), sy(TABLE_Y + 11));
    ctx.lineTo(sx(VW - 40), sy(TABLE_Y + 11));
    ctx.stroke();

    const tx = sx(CUP_X - 78);
    const ty = sy(TABLE_Y - 10);
    roundRect(ctx, tx, ty, 156 * scale, 10 * scale, 4 * scale);
    ctx.fillStyle = 'rgba(12, 8, 22, 0.85)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1.1 * scale;
    ctx.fill();
    ctx.stroke();
  }

  function drawStove() {
    const x = sx(POT_X - 4);
    const y = sy(POT_Y + 48);
    const s = scale;
    ctx.fillStyle = '#120818';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 1.4 * s;
    roundRect(ctx, x - 36 * s, y - 4 * s, 72 * s, 18 * s, 6 * s);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.4)';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(x - 24 * s, y + 6 * s);
    ctx.lineTo(x + 24 * s, y + 6 * s);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(x - 22 * s, y + 14 * s);
    ctx.lineTo(x - 26 * s, y + 22 * s);
    ctx.moveTo(x + 22 * s, y + 14 * s);
    ctx.lineTo(x + 26 * s, y + 22 * s);
    ctx.moveTo(x, y + 14 * s);
    ctx.lineTo(x, y + 22 * s);
    ctx.stroke();

    const flame = 0.35 + G.pourPulse * 0.7 + Math.sin(G.clock * 11) * 0.08;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(x, y - (10 + flame * 16) * s);
    ctx.bezierCurveTo(x + 10 * s, y - 4 * s, x + 8 * s, y + 4 * s, x, y + 6 * s);
    ctx.bezierCurveTo(x - 8 * s, y + 4 * s, x - 10 * s, y - 4 * s, x, y - (10 + flame * 16) * s);
    const fg = ctx.createLinearGradient(x, y - 22 * s, x, y + 8 * s);
    fg.addColorStop(0, 'rgba(255, 227, 107, 0.9)');
    fg.addColorStop(0.5, 'rgba(255, 61, 184, 0.7)');
    fg.addColorStop(1, 'rgba(0, 240, 255, 0.15)');
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.restore();
  }

  function glassPath(c, x, mouth, h, topH, botH) {
    const bot = mouth + h;
    c.beginPath();
    c.moveTo(x - topH, mouth);
    c.lineTo(x + topH, mouth);
    c.lineTo(x + botH, bot);
    c.quadraticCurveTo(x, bot + 8 * scale, x - botH, bot);
    c.closePath();
  }

  function drawSaucer(st) {
    const geom = cupGeom(st);
    const x = sx(CUP_X);
    const y = sy(geom.mouth + geom.h - 4);
    ctx.fillStyle = 'rgba(10, 8, 18, 0.92)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.ellipse(x, y, 54 * scale, 9 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.32)';
    ctx.beginPath();
    ctx.ellipse(x, y, 36 * scale, 5 * scale, 0, 0, TAU);
    ctx.stroke();
  }

  function drawCup(st) {
    const geom = cupGeom(st);
    const x = sx(CUP_X);
    const mouth = sy(geom.mouth);
    const h = geom.h * scale;
    const topH = geom.topH * scale;
    const botH = geom.botH * scale;
    const fill = G.fill;
    const bandNow = inBand(st, fill) && (G.mode === 'play' || G.mode === 'clear' || G.mode === 'title' || G.mode === 'win');
    const over = fill > st.line || G.mode === 'spill';

    ctx.save();
    glassPath(ctx, x, mouth, h, topH, botH);
    ctx.fillStyle = 'rgba(8, 10, 22, 0.35)';
    ctx.fill();

    const lineYw = yAtFill(geom, st.line);
    const loYw = yAtFill(geom, st.line - st.tol);
    glassPath(ctx, x, mouth, h, topH * 0.94, botH * 0.94);
    ctx.save();
    ctx.clip();
    ctx.fillStyle = bandNow
      ? 'rgba(255, 227, 107, 0.22)'
      : 'rgba(255, 227, 107, 0.16)';
    ctx.fillRect(x - topH, sy(lineYw), topH * 2, sy(loYw) - sy(lineYw));
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.45)';
    ctx.lineWidth = 1.2 * scale;
    ctx.setLineDash([4 * scale, 4 * scale]);
    ctx.beginPath();
    ctx.moveTo(x - topH * 0.78, sy(loYw));
    ctx.lineTo(x + topH * 0.78, sy(loYw));
    ctx.stroke();
    ctx.setLineDash([]);

    if (fill > 0.012) {
      const surfW = yAtFill(geom, fill) + G.slosh * 10;
      const surf = sy(surfW);
      const lg = ctx.createLinearGradient(x, surf, x, sy(geom.innerBot + 8));
      if (over) {
        lg.addColorStop(0, 'rgba(255, 120, 190, 0.82)');
        lg.addColorStop(0.35, 'rgba(255, 61, 184, 0.7)');
        lg.addColorStop(1, 'rgba(80, 20, 60, 0.5)');
      } else if (bandNow) {
        lg.addColorStop(0, 'rgba(255, 236, 160, 0.85)');
        lg.addColorStop(0.3, 'rgba(201, 122, 40, 0.78)');
        lg.addColorStop(1, 'rgba(90, 30, 50, 0.5)');
      } else {
        lg.addColorStop(0, 'rgba(255, 214, 130, 0.78)');
        lg.addColorStop(0.28, 'rgba(180, 90, 36, 0.72)');
        lg.addColorStop(1, 'rgba(70, 24, 48, 0.5)');
      }
      ctx.fillStyle = lg;
      ctx.fillRect(x - topH, surf, topH * 2, sy(geom.innerBot + 18) - surf);

      const waveAmp = (2.2 + Math.abs(G.slosh) * 28 + G.stream * 3.2) * scale;
      ctx.beginPath();
      ctx.moveTo(x - topH, surf);
      for (let i = 0; i <= 14; i++) {
        const px = x - topH + (topH * 2 * i) / 14;
        const py = surf + Math.sin(G.clock * 7.2 + i * 0.7 + G.slosh * 8) * waveAmp;
        ctx.lineTo(px, py);
      }
      ctx.strokeStyle = over
        ? 'rgba(255, 160, 210, 0.9)'
        : bandNow
          ? 'rgba(255, 227, 107, 0.9)'
          : 'rgba(255, 220, 140, 0.75)';
      ctx.lineWidth = 1.8 * scale;
      ctx.stroke();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      const lx = x + Math.sin(G.clock * 0.7) * topH * 0.28;
      const ly = surf + 7 * scale;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 3.4 * scale, 1.5 * scale, -0.5, 0, TAU);
      ctx.fill();
      ctx.restore();

      for (let i = 0; i < 4; i++) {
        const bx = x + Math.sin(G.clock * 1.2 + i * 1.8) * topH * 0.32;
        const by = lerp(sy(geom.innerBot - 6), surf + 8 * scale, (Math.sin(G.clock * 0.8 + i) + 1) * 0.5);
        if (by > surf + 4 * scale) {
          ctx.fillStyle = 'rgba(255,255,255,0.28)';
          ctx.beginPath();
          ctx.arc(bx, by, (1 + (i % 2) * 0.5) * scale, 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.restore();

    const ly = sy(lineYw);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = bandNow ? 0.95 : 0.5 + G.lineGlow * 0.5;
    ctx.strokeStyle = bandNow
      ? 'rgba(255, 227, 107,' + glow + ')'
      : over
        ? 'rgba(255, 61, 184, 0.85)'
        : 'rgba(255, 61, 184,' + (0.58 + G.lineGlow * 0.4) + ')';
    ctx.lineWidth = (bandNow ? 2.5 : 1.7) * scale;
    ctx.setLineDash(bandNow ? [] : [6 * scale, 5 * scale]);
    ctx.beginPath();
    ctx.moveTo(x - topH * 0.82, ly);
    ctx.lineTo(x + topH * 0.82, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = bandNow ? 'rgba(255, 227, 107, 0.9)' : 'rgba(255, 61, 184, 0.75)';
    ctx.font = '600 ' + Math.max(9, 10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('水位', x + topH * 0.88, ly);

    glassPath(ctx, x, mouth, h, topH, botH);
    ctx.strokeStyle = over
      ? 'rgba(255, 61, 184, 0.9)'
      : bandNow
        ? 'rgba(255, 227, 107, 0.88)'
        : 'rgba(0, 240, 255, 0.8)';
    ctx.lineWidth = 2.1 * scale;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.moveTo(x - topH * 0.62, mouth + 16 * scale);
    ctx.lineTo(x - botH * 0.45, mouth + h - 22 * scale);
    ctx.stroke();

    if (bandNow && G.mode === 'play') {
      ctx.fillStyle = 'rgba(255, 227, 107, 0.92)';
      ctx.font = '700 ' + Math.max(12, 14 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('松手', x, mouth - 16 * scale);
    }

    ctx.restore();
  }

  function drawStream(st) {
    if (G.stream < 0.04) return;
    const tip = spoutTip();
    const geom = cupGeom(st);
    const surf = Math.min(yAtFill(geom, G.fill), geom.mouth + 10);
    const a = clamp((G.stream - 0.04) / 0.96, 0, 1);
    const cpx = lerp(tip.x, CUP_X, 0.46) + 18;
    const cpy = lerp(tip.y, surf, 0.38) + (1 - a) * 24;
    const w = (1.2 + a * 5.2) * scale;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255, 227, 107,' + (0.18 + a * 0.35) + ')';
    ctx.lineWidth = w * 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(tip.x), sy(tip.y));
    ctx.quadraticCurveTo(sx(cpx), sy(cpy), sx(CUP_X), sy(surf));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255,' + (0.25 + a * 0.45) + ')';
    ctx.lineWidth = w * 1.15;
    ctx.beginPath();
    ctx.moveTo(sx(tip.x), sy(tip.y));
    ctx.quadraticCurveTo(sx(cpx), sy(cpy), sx(CUP_X), sy(surf));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 250, 230,' + (0.45 + a * 0.5) + ')';
    ctx.lineWidth = w * 0.42;
    ctx.beginPath();
    ctx.moveTo(sx(tip.x), sy(tip.y));
    ctx.quadraticCurveTo(sx(cpx), sy(cpy), sx(CUP_X), sy(surf));
    ctx.stroke();

    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = (i / n + G.clock * (1.4 + a * 1.6)) % 1;
      const px = qbez(tip.x, cpx, CUP_X, t);
      const py = qbez(tip.y, cpy, surf, t);
      ctx.fillStyle = 'rgba(255, 236, 170,' + (0.35 + a * 0.4) + ')';
      ctx.beginPath();
      ctx.arc(sx(px), sy(py), (1.1 + (1 - t) * 1.4) * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDrops() {
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      const x = sx(d.x);
      const y = sy(d.y);
      const r = d.r * scale;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 227, 107, 0.18)';
      ctx.beginPath();
      ctx.arc(x, y, r * 2.1, 0, TAU);
      ctx.fill();
      ctx.restore();
      const grd = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
      grd.addColorStop(0, '#fff6d8');
      grd.addColorStop(0.45, '#e8a44a');
      grd.addColorStop(1, 'rgba(255, 61, 184, 0.45)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }

  function drawTeapot() {
    const ang = potAng();
    const x = sx(POT_X);
    const y = sy(POT_Y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.85)';
    ctx.lineWidth = 3.1 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-42 * s, 10 * s, 18 * s, -1.15, 2.35);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 160, 210, 0.5)';
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.arc(-42 * s, 10 * s, 18 * s, -1.15, 2.35);
    ctx.stroke();

    ctx.fillStyle = '#14101f';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.ellipse(0, 8 * s, 38 * s, 30 * s, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 227, 107, 0.55)';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.ellipse(0, 8 * s, 28 * s, 22 * s, 0, 0.2, Math.PI - 0.15);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.lineWidth = 5.4 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(28 * s, -2 * s);
    ctx.bezierCurveTo(52 * s, -16 * s, 74 * s, -6 * s, 90 * s, 6 * s);
    ctx.stroke();
    ctx.strokeStyle = '#161022';
    ctx.lineWidth = 2.6 * s;
    ctx.beginPath();
    ctx.moveTo(28 * s, -2 * s);
    ctx.bezierCurveTo(52 * s, -16 * s, 74 * s, -6 * s, 90 * s, 6 * s);
    ctx.stroke();

    if (G.stream > 0.08) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 227, 107,' + (0.35 + G.stream * 0.45) + ')';
      ctx.beginPath();
      ctx.arc(88 * s, 5 * s, (2.2 + G.stream * 3.4) * s, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#1a1428';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.ellipse(0, -20 * s, 22 * s, 7.5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgb(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -30 * s, 4.2 * s, 3.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.7)';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(0, -26 * s);
    ctx.lineTo(0, -22 * s);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.ellipse(-10 * s, 0, 10 * s, 16 * s, -0.4, -0.4, 1.4);
    ctx.stroke();

    if (G.pourPulse > 0.15) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(0, 240, 255,' + (G.pourPulse * 0.45) + ')';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.ellipse(0, 8 * s, 44 * s, 36 * s, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPatience(st) {
    if (!st.time || G.mode !== 'play') return;
    const k = clamp(G.timeLeft / st.time, 0, 1);
    const geom = cupGeom(st);
    const x = sx(CUP_X);
    const y = sy(geom.mouth - 36);
    const r = 16 * scale;
    ctx.strokeStyle = 'rgba(139, 144, 184, 0.25)';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = k < 0.28 ? rgb(MAG, 0.95) : rgb(CYN, 0.9);
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * k);
    ctx.stroke();
    ctx.fillStyle = k < 0.28 ? rgb(MAG, 0.9) : 'rgba(232, 250, 255, 0.8)';
    ctx.font = '700 ' + Math.max(9, 10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('客', x, y + 0.5 * scale);
  }

  function drawHoldCue() {
    if (G.mode !== 'play' || G.taught || G.fill > 0.05) return;
    const x = sx(POT_X - 8);
    const y = sy(POT_Y + 86);
    const pulse = 0.55 + Math.sin(G.clock * 4.2) * 0.25;
    ctx.fillStyle = 'rgba(0, 240, 255,' + (0.55 + pulse * 0.35) + ')';
    ctx.font = '700 ' + Math.max(12, 14 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('按住', x, y);
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < steam.length; i++) {
      const s = steam[i];
      const a = clamp(s.life / s.max, 0, 1) * 0.35;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#c8f4ff';
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale * (1.2 + (1 - a)), 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.gold ? '#ffe36b' : p.mag ? '#ff3db8' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.6;
      ctx.strokeStyle = r.gold
        ? 'rgba(255, 227, 107,' + (0.45 * (1 - k)) + ')'
        : r.mag
          ? 'rgba(255, 61, 184,' + (0.45 * (1 - k)) + ')'
          : 'rgba(0, 240, 255,' + (0.4 * (1 - k)) + ')';
      ctx.lineWidth = 1.6 * scale * (1 - k * 0.4);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (6 + k * 28) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFlash() {
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.magFlash * 0.22) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (G.goldFlash * 0.1) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    const st = STAGES[G.stage] || STAGES[0];
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawBg();
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawLanterns();
    drawTable();
    drawStove();
    drawSaucer(st);
    drawCup(st);
    drawStream(st);
    drawDrops();
    drawTeapot();
    drawParticles();
    drawPatience(st);
    drawHoldCue();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawFlash();
    ctx.restore();
  }

  function onKey(e, down) {
    const k = e.key;
    const pourKey = k === ' ' || k === 'Spacebar' || k === 'ArrowDown' || k === 'Down' || k === 'Enter';
    if (pourKey) e.preventDefault();
    if (down && pourKey) {
      if (!overlay.classList.contains('hidden')) {
        if (k === 'Enter' || k === ' ' || k === 'Spacebar') overlayAction();
        return;
      }
      keys.pour = true;
      audio.ensure();
      return;
    }
    if (!down && pourKey) {
      keys.pour = false;
      return;
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startRun();
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (!overlay.classList.contains('hidden')) return;
    pointer.down = true;
    pointer.id = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.pour = false;
    pointer.down = false;
  });

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    overlayAction();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    startRun();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.pour = false;
      pointer.down = false;
    } else {
      last = performance.now();
      acc = 0;
    }
  });

  function resize() {
    const stage = document.getElementById('stage');
    const rect = stage.getBoundingClientRect();
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
    for (let i = 0; i < 40; i++) {
      motes.push({
        x: rand(20, VW - 20),
        y: rand(40, VH - 40),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.15),
        p: rand(0, TAU),
        s: rand(6, 18)
      });
    }
  }

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  seedMotes();
  resize();
  bootTitle();
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
