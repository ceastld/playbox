'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const RED = 0.78;
  const GAUGE_X = 240;
  const GAUGE_Y = 186;
  const GAUGE_R = 96;
  const START_A = Math.PI * 0.75;
  const SWEEP = Math.PI * 1.5;
  const VALVE_Y = 572;
  const MANI_Y = 418;
  const MUTE_KEY = 'playbox-steam-valve-mute';
  const OPS = '点阀开 · 1–6 从左开 · ← → 空格 · M 静音';

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };

  const STAGES = [
    { name: '初阀', sub: 'INIT', n: 2, kind: 'order', rise: 0.046, start: 0.16, vent: 0.44, spike: 0.14, reveal: 0, glow: true, guide: true, hint: '先开亮着的阀，再开下一只' },
    { name: '三口', sub: 'TRIO', n: 3, kind: 'order', rise: 0.060, start: 0.18, vent: 0.36, spike: 0.16, reveal: 0, glow: true, guide: true, hint: '从左到右，一号二号三号' },
    { name: '四轮', sub: 'QUAD', n: 4, kind: 'order', rise: 0.074, start: 0.20, vent: 0.32, spike: 0.17, reveal: 0, glow: true, guide: true, hint: '四只阀，还是按号开' },
    { name: '乱序', sub: 'MIX', n: 4, kind: 'shuffle', rise: 0.082, start: 0.20, vent: 0.30, spike: 0.18, reveal: 0, glow: true, guide: false, hint: '号打乱了，看阀上的数字' },
    { name: '加压', sub: 'RISE', n: 4, kind: 'shuffle', rise: 0.116, start: 0.28, vent: 0.24, spike: 0.20, reveal: 0, glow: true, guide: false, hint: '升得更快，别开错' },
    { name: '五轮', sub: 'FIVE', n: 5, kind: 'shuffle', rise: 0.104, start: 0.22, vent: 0.22, spike: 0.18, reveal: 0, glow: true, guide: false, hint: '五只阀，按号泄压' },
    { name: '闪序', sub: 'FLASH', n: 5, kind: 'shuffle', rise: 0.110, start: 0.24, vent: 0.22, spike: 0.20, reveal: 2.5, glow: true, guide: false, hint: '号会消失，亮着的还是下一只' },
    { name: '脉冲', sub: 'PULSE', n: 5, kind: 'shuffle', rise: 0.090, start: 0.22, vent: 0.24, spike: 0.16, reveal: 0, glow: true, guide: false, pulse: 2.55, pulseAmt: 0.15, hint: '压力会突然顶一截，提前泄' },
    { name: '盲开', sub: 'BLIND', n: 6, kind: 'shuffle', rise: 0.118, start: 0.24, vent: 0.20, spike: 0.20, reveal: 2.1, glow: false, guide: false, hint: '看两秒，号和亮都没了' },
    { name: '爆表', sub: 'RED', n: 6, kind: 'shuffle', rise: 0.142, start: 0.46, vent: 0.17, spike: 0.22, reveal: 1.55, glow: false, guide: false, hint: '针已经发烫，立刻按号开' }
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
  const pressWrap = document.getElementById('press-wrap');
  const pressBar = document.getElementById('press-bar');
  const pressNum = document.getElementById('press-num');
  const stageLabel = document.getElementById('stage-label');
  const nextLabel = document.getElementById('next-label');
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

  const particles = [];
  const motes = [];
  const rings = [];
  const jets = [];
  const pips = [];
  const cracks = [];

  const ptr = { down: false, id: null, x: 240, y: VALVE_Y, hover: -1 };

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    p: 0.16,
    pShow: 0.16,
    rising: true,
    seq: [],
    next: 0,
    valves: [],
    sel: 0,
    lock: 0,
    settle: 0,
    shake: 0,
    magFlash: 0,
    goldFlash: 0,
    boomT: 0,
    toastT: 0,
    why: '',
    labelsOn: true,
    revealLeft: 0,
    revealed: true,
    pulseT: 0,
    pulseWarned: false,
    warnAcc: 0,
    hiss: 0,
    needleJ: 0,
    demoAuto: 0
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
  function mix(a, b, t) {
    return {
      r: (lerp(a.r, b.r, t) + 0.5) | 0,
      g: (lerp(a.g, b.g, t) + 0.5) | 0,
      b: (lerp(a.b, b.b, t) + 0.5) | 0
    };
  }
  function heatCol(p) {
    if (p < 0.55) return mix(CYN, GOLD, p / 0.55);
    if (p < RED) return mix(GOLD, MAG, (p - 0.55) / (RED - 0.55));
    return MAG;
  }
  function needleA(p) {
    return START_A + clamp(p, 0, 1) * SWEEP;
  }

  function valveXs(n) {
    const left = n > 5 ? 46 : 58;
    const right = VW - left;
    const xs = [];
    if (n <= 1) return [VW * 0.5];
    for (let i = 0; i < n; i++) xs.push(left + (right - left) * i / (n - 1));
    return xs;
  }

  function isSorted(a) {
    for (let i = 0; i < a.length; i++) if (a[i] !== i) return false;
    return true;
  }

  function makeSeq(n, kind) {
    const a = [];
    for (let i = 0; i < n; i++) a.push(i);
    if (kind !== 'shuffle') return a;
    let tries = 0;
    do {
      for (let i = n - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
      }
      tries += 1;
    } while (isSorted(a) && tries < 10);
    return a;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    hissGain: null,
    rumble: null,
    rumbleG: null,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
        this._hiss();
        this._rumble();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    _hiss: function () {
      const sr = this.ctx.sampleRate;
      const n = Math.max(1, (sr * 0.32) | 0);
      const buf = this.ctx.createBuffer(1, n, sr);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        last = last * 0.88 + (Math.random() * 2 - 1) * 0.12;
        data[i] = last;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1900;
      bp.Q.value = 0.55;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      src.connect(bp);
      bp.connect(g);
      g.connect(this.master);
      src.start();
      this.hissGain = g;
    },
    _rumble: function () {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = 42;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      o.connect(g);
      g.connect(this.master);
      o.start();
      this.rumble = o;
      this.rumbleG = g;
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    setHiss: function (amt, rum) {
      if (this.hissGain) this.hissGain.gain.value = this.muted ? 0 : amt;
      if (this.rumbleG) this.rumbleG.gain.value = this.muted ? 0 : rum;
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
      const n = Math.min(0.25, Math.max(0.04, dur));
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
    open: function () {
      this.ensure();
      this.beep(220, 0.06, 'square', 0.035, 140);
      this.noise(0.14, 0.055, 1400);
      this.beep(520, 0.09, 'sine', 0.05, 880);
    },
    wrong: function () {
      this.ensure();
      this.beep(160, 0.16, 'sawtooth', 0.05, 70);
      this.noise(0.12, 0.06, 400);
    },
    warn: function (hot) {
      this.ensure();
      this.beep(hot ? 880 : 620, 0.05, 'square', hot ? 0.045 : 0.03);
    },
    pulseWarn: function () {
      this.ensure();
      this.beep(392, 0.1, 'triangle', 0.05, 280);
    },
    pulse: function () {
      this.ensure();
      this.beep(90, 0.22, 'sine', 0.07, 48);
      this.noise(0.16, 0.05, 300);
    },
    boom: function () {
      this.ensure();
      this.noise(0.42, 0.12, 180);
      this.beep(70, 0.5, 'sawtooth', 0.08, 32);
      this.beep(140, 0.28, 'triangle', 0.05, 50);
    },
    clear: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06, 523);
      this.beep(659, 0.14, 'sine', 0.05, 659);
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
    },
    tick: function () {
      this.ensure();
      this.beep(880, 0.03, 'sine', 0.02);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 180) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.45, spec.j * 0.45),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        g: spec.g == null ? -40 : spec.g
      });
    }
  }

  function addRing(x, y, mag, gold) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag, gold: !!gold });
    if (rings.length > 20) rings.shift();
  }

  function addJet(v) {
    jets.push({ x: v.x, y: v.y - 8, t: 0, mag: false });
    if (jets.length > 12) jets.shift();
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
    const hot = G.mode === 'play' && G.p >= RED;
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' + (hot ? ' warn' : '') : ' gone');
    }
  }

  function nextOrder() {
    if (G.next >= G.seq.length) return 0;
    const v = G.valves[G.seq[G.next]];
    return v ? v.order : 0;
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const p = G.mode === 'title' ? G.pShow : G.pShow;
    pressBar.style.transform = 'scaleX(' + clamp(p, 0, 1) + ')';
    pressNum.textContent = (p * 10).toFixed(1);
    pressWrap.classList.toggle('warn', p >= RED);
    pressWrap.classList.toggle('hot', p >= 0.62 && p < RED);
    if (G.mode === 'title') {
      stageLabel.textContent = '十炉';
      nextLabel.textContent = '按号开';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 炉 · ' + (st ? st.name : '');
      if (G.next >= G.seq.length) {
        nextLabel.textContent = '泄完';
      } else if (!G.labelsOn && st && !st.glow) {
        nextLabel.textContent = '凭记忆';
      } else {
        nextLabel.textContent = '下一号 ' + nextOrder();
      }
    }
    stageLabel.classList.toggle('hot', G.mode === 'play' && G.p >= 0.62 && G.p < RED);
    nextLabel.classList.toggle('warn', G.mode === 'play' && G.p >= RED);
    nextLabel.classList.toggle('hot', G.mode === 'play' && G.next >= G.seq.length);
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

  function buildValves(st, keepSeq) {
    const xs = valveXs(st.n);
    const seq = keepSeq && G.seq.length === st.n ? G.seq.slice() : makeSeq(st.n, st.kind);
    const valves = [];
    for (let i = 0; i < st.n; i++) {
      valves.push({
        i: i,
        x: xs[i],
        y: VALVE_Y,
        order: 0,
        open: false,
        spin: 0,
        ang: 0,
        glow: 0,
        wrongT: 0,
        steam: 0,
        pulse: 0
      });
    }
    for (let k = 0; k < seq.length; k++) valves[seq[k]].order = k + 1;
    G.seq = seq;
    G.valves = valves;
    G.next = 0;
    G.sel = 0;
  }

  function resetPressure(st) {
    G.p = st.start;
    G.pShow = st.start;
    G.needleJ = 0;
    G.pulseT = 0;
    G.pulseWarned = false;
    G.warnAcc = 0;
    G.boomT = 0;
    G.why = '';
    cracks.length = 0;
  }

  function applyReveal(st) {
    if (st.reveal > 0) {
      G.revealLeft = st.reveal;
      G.labelsOn = true;
      G.revealed = false;
      G.rising = false;
    } else {
      G.revealLeft = 0;
      G.labelsOn = true;
      G.revealed = true;
      G.rising = true;
    }
  }

  function startStage(i, fromFail) {
    const st = STAGES[i];
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.18;
    G.settle = 0;
    buildValves(st, fromFail);
    resetPressure(st);
    applyReveal(st);
    hideOverlay();
    setHint(st.hint, '');
    if (st.reveal > 0) toast('记顺序', false, true);
    else toast(st.name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    jets.length = 0;
    G.lives = LIVES;
    startStage(0, false);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    jets.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    G.demoAuto = 0;
    const st = { n: 3, kind: 'order', start: 0.22, rise: 0.05, vent: 0.38, spike: 0, reveal: 0, glow: true, guide: true };
    buildValves(st, false);
    G.p = 0.22;
    G.pShow = 0.22;
    G.rising = true;
    G.labelsOn = true;
    G.revealed = true;
    G.lock = 0;
    showOverlay(
      'title',
      '汽阀',
      '按顺序拧开汽阀泄压。<br />指针进红区，锅炉就炸。',
      '开阀',
      'VALVE',
      OPS
    );
    setHint('按顺序开阀 · 针到红区就炸', '');
    syncHud();
  }

  function isNext(v) {
    return G.next < G.seq.length && G.seq[G.next] === v.i;
  }

  function showLabelsNow() {
    return G.labelsOn;
  }

  function showGlow(st, v) {
    if (!st || !st.glow) return false;
    return isNext(v) && !v.open;
  }

  function makeCracks() {
    cracks.length = 0;
    for (let i = 0; i < 7; i++) {
      const pts = [];
      let x = GAUGE_X + rand(-40, 40);
      let y = GAUGE_Y + rand(20, 90);
      pts.push({ x: x, y: y });
      const n = 3 + (Math.random() * 3) | 0;
      for (let k = 0; k < n; k++) {
        x += rand(-28, 28);
        y += rand(12, 34);
        pts.push({ x: x, y: y });
      }
      cracks.push(pts);
    }
  }

  function openValve(v, auto) {
    if (!v || v.open) return;
    v.open = true;
    v.spin = 0.001;
    v.steam = 1;
    addJet(v);
    addRing(v.x, v.y, false, true);
    emit(14, {
      x: v.x, y: v.y - 10, j: 10,
      vx0: -40, vx1: 40, vy0: -160, vy1: -40,
      life: 0.7, r0: 1.2, r1: 3.4, g: -80
    });
    if (!auto) audio.open();
  }

  function tryOpen(index) {
    if (G.mode !== 'play' || G.lock > 0 || G.why || !G.revealed) return;
    const v = G.valves[index];
    if (!v) return;
    G.sel = index;
    if (v.open) return;
    const st = STAGES[G.stage];
    if (isNext(v)) {
      openValve(v, false);
      G.next += 1;
      G.lock = 0.12;
      G.p = clamp(G.p - st.vent, 0, 1);
      G.goldFlash = 0.4;
      if (G.next >= G.seq.length) {
        G.p = clamp(G.p * 0.35, 0, 0.2);
        G.lock = 0.55;
        G.goldFlash = 0.8;
        audio.clear();
        toast('泄完', false, true);
        emit(22, {
          x: GAUGE_X, y: GAUGE_Y, j: 36,
          vx0: -90, vx1: 90, vy0: -80, vy1: 40,
          life: 0.8, r0: 1.4, r1: 3.6, gold: true, g: 40
        });
      } else {
        toast('号 ' + v.order);
      }
    } else {
      v.wrongT = 1;
      G.lock = 0.22;
      G.p = clamp(G.p + st.spike, 0, 1);
      G.magFlash = 0.55;
      G.shake = 10;
      audio.wrong();
      toast('开错', true);
      addRing(v.x, v.y, true, false);
      emit(12, {
        x: v.x, y: v.y, j: 12,
        vx0: -70, vx1: 70, vy0: -90, vy1: 20,
        life: 0.5, r0: 1.2, r1: 3.2, mag: true, g: 80
      });
    }
    syncHud();
  }

  function beginBoom() {
    if (G.why) return;
    G.why = 'boom';
    G.p = 1;
    G.mode = 'boom';
    G.boomT = 0.92;
    G.magFlash = 0.9;
    G.shake = 22;
    G.lock = 1;
    makeCracks();
    audio.boom();
    toast('炸了', true);
    setHint('指针进红区了', 'warn');
    emit(40, {
      x: GAUGE_X, y: GAUGE_Y + 20, j: 50,
      vx0: -180, vx1: 180, vy0: -220, vy1: 80,
      life: 0.9, r0: 1.6, r1: 4.6, mag: true, g: 220
    });
    emit(12, {
      x: GAUGE_X, y: GAUGE_Y, j: 24,
      vx0: -60, vx1: 60, vy0: -140, vy1: -20,
      life: 0.8, r0: 1.4, r1: 3.2, gold: true, g: 60
    });
  }

  function failStage() {
    G.mode = 'fail';
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    showOverlay(
      'lose',
      '炸了',
      more
        ? '指针顶进红区，锅炉炸了。<br />还剩 ' + G.lives + ' 次。'
        : '指针顶进红区。十炉未完。',
      more ? '再开本炉' : '再来一局',
      'BLOWN'
    );
    setHint(more ? '再开这一炉' : '三命用尽', more ? '' : 'warn');
  }

  function clearStage() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '泄完',
        '十炉按序开完，针没进红。',
        '再来一局',
        'VENTED'
      );
      setHint('十炉皆泄', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 0.95;
    setHint(STAGES[G.stage + 1].hint, 'hot');
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

  function hitValve(x, y) {
    let best = -1;
    let bd = 52;
    for (let i = 0; i < G.valves.length; i++) {
      const v = G.valves[i];
      const d = hypot(x - v.x, y - v.y);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * W;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

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
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: rand(30, VW - 30),
        y: rand(40, VH - 40),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.15),
        p: rand(0, TAU),
        s: rand(8, 22)
      });
    }
  }

  function updateValves(dt) {
    const st = STAGES[G.stage] || STAGES[0];
    for (let i = 0; i < G.valves.length; i++) {
      const v = G.valves[i];
      if (v.open && v.spin < 1) {
        v.spin = clamp(v.spin + dt * 4.2, 0, 1);
        v.ang = ease(v.spin) * 2.35;
      }
      v.wrongT = Math.max(0, v.wrongT - dt * 1.8);
      if (v.open) v.steam = Math.max(0.22, v.steam - dt * 0.45);
      else v.steam = Math.max(0, v.steam - dt);
      const want = (G.mode === 'play' || G.mode === 'title') && showGlow(st, v) ? 1 : 0;
      v.glow = lerp(v.glow, want, 1 - Math.exp(-8 * dt));
      v.pulse = (v.pulse + dt * (0.8 + v.glow * 2)) % 1;
      if (v.open && Math.random() < dt * (4 + G.p * 6)) {
        emit(1, {
          x: v.x, y: v.y - 12, j: 6,
          vx0: -18, vx1: 18, vy0: -70, vy1: -20,
          life: 0.55, r0: 1, r1: 2.2, g: -50
        });
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.7);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
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
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.6) rings.splice(i, 1);
    }
    for (let i = jets.length - 1; i >= 0; i--) {
      jets[i].t += dt;
      if (jets[i].t > 0.45) jets.splice(i, 1);
    }
    G.pShow = lerp(G.pShow, G.p, 1 - Math.exp(-14 * dt));
    G.needleJ = Math.sin(G.clock * 37) * G.p * G.p * 0.012 + (Math.random() - 0.5) * G.p * 0.006;
  }

  function boilerSteam(dt) {
    const rate = 3 + G.p * 16 + (G.mode === 'boom' ? 28 : 0);
    if (Math.random() < dt * rate) {
      const mag = G.p >= RED || G.mode === 'boom';
      emit(1, {
        x: GAUGE_X + rand(-70, 70),
        y: 86 + rand(0, 20),
        j: 8,
        vx0: -20, vx1: 20, vy0: -90, vy1: -30,
        life: 0.8, r0: 1.2, r1: 3.4,
        mag: mag, gold: !mag && G.p > 0.62,
        g: -70
      });
    }
  }

  function updateTitle(dt) {
    G.p += 0.048 * dt;
    if (G.p > 0.62) G.p = 0.62;
    G.demoAuto -= dt;
    if (G.demoAuto <= 0 && G.next < G.seq.length) {
      const v = G.valves[G.seq[G.next]];
      if (v && !v.open) {
        openValve(v, true);
        G.next += 1;
        G.p = clamp(G.p - 0.28, 0.12, 1);
      }
      G.demoAuto = 1.15;
    }
    if (G.next >= G.seq.length) {
      G.settle += dt;
      if (G.settle > 1.3) {
        const st = { n: 3, kind: 'order', start: 0.2 };
        buildValves(st, false);
        G.next = 0;
        G.p = 0.2;
        G.settle = 0;
        G.demoAuto = 0.6;
      }
    }
  }

  function updatePlay(dt) {
    const st = STAGES[G.stage];
    if (!st) return;

    if (!G.revealed) {
      G.revealLeft -= dt;
      if (G.revealLeft <= 0) {
        G.revealed = true;
        G.rising = true;
        G.labelsOn = false;
        toast('开！', false, true);
        audio.tick();
      }
    }

    if (G.rising && G.lock <= 0 && G.next < G.seq.length && !G.why) {
      G.p += st.rise * dt;
      if (st.pulse) {
        G.pulseT += dt;
        const left = st.pulse - G.pulseT;
        if (left < 0.42 && !G.pulseWarned) {
          G.pulseWarned = true;
          toast('脉冲', true);
          audio.pulseWarn();
          G.goldFlash = 0.25;
        }
        if (G.pulseT >= st.pulse) {
          G.pulseT = 0;
          G.pulseWarned = false;
          G.p = clamp(G.p + st.pulseAmt, 0, 1);
          G.shake = 8;
          G.magFlash = 0.32;
          audio.pulse();
        }
      }
    }

    if (G.p >= 0.999) {
      G.p = 1;
      beginBoom();
      return;
    }

    if (G.rising && G.p >= 0.7) {
      G.warnAcc += dt;
      const interval = lerp(0.72, 0.16, clamp((G.p - 0.7) / 0.3, 0, 1));
      if (G.warnAcc >= interval) {
        G.warnAcc = 0;
        audio.warn(G.p >= RED);
      }
    }

    if (G.next >= G.seq.length && G.lock <= 0 && !G.why) {
      clearStage();
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'boom') {
      G.boomT -= dt;
      G.p = 1;
      if (G.boomT <= 0) failStage();
    } else if (G.mode === 'clear') {
      G.settle -= dt;
      G.p = lerp(G.p, 0.08, 1 - Math.exp(-3 * dt));
      if (G.settle <= 0) startStage(G.stage + 1, false);
    }
    updateValves(dt);
    boilerSteam(dt);
    updateFx(dt);

    const live = G.mode === 'play' || G.mode === 'title' || G.mode === 'boom';
    const hissAmt = live ? (0.012 + G.p * 0.09 + (G.p >= RED ? 0.04 : 0)) : 0;
    const rum = live ? (G.p > 0.55 ? (G.p - 0.55) * 0.12 : 0) : 0;
    if (audio.ctx) audio.setHiss(hissAmt, rum);
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

    const g2 = ctx.createRadialGradient(sx(390), sy(70), 10, sx(390), sy(70), 260 * scale);
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
    vg.addColorStop(0, 'rgba(18, 8, 36, 0.9)');
    vg.addColorStop(0.42, 'rgba(8, 6, 20, 0.2)');
    vg.addColorStop(1, 'rgba(6, 10, 22, 0.6)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    for (let y = 48; y < VH; y += 44) {
      ctx.beginPath();
      ctx.moveTo(sx(24), sy(y));
      ctx.lineTo(sx(VW - 24), sy(y));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.35 + m.p) * 8);
      const y = sy((m.y - G.clock * m.s + VH * 8) % VH);
      ctx.fillStyle = 'rgba(180, 230, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFloor() {
    const y = sy(VALVE_Y + 48);
    const g = ctx.createLinearGradient(sx(0), y - 20 * scale, sx(0), sy(VH));
    g.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
    g.addColorStop(0.12, '#10081c');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), y - 10 * scale, VW * scale, sy(VH) - (y - 10 * scale));

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(18), sy(VALVE_Y + 46));
    ctx.lineTo(sx(VW - 18), sy(VALVE_Y + 46));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.12)';
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(40), sy(VALVE_Y + 56));
    ctx.lineTo(sx(VW - 40), sy(VALVE_Y + 56));
    ctx.stroke();
  }

  function drawBoiler() {
    const x = sx(62);
    const y = sy(64);
    const w = 356 * scale;
    const h = 358 * scale;
    const hc = heatCol(G.pShow);
    const glow = 0.08 + G.pShow * 0.22 + G.magFlash * 0.2;

    ctx.save();
    ctx.shadowColor = rgb(hc, glow);
    ctx.shadowBlur = (18 + G.pShow * 28) * scale;
    roundRect(ctx, x, y, w, h, 34 * scale);
    const body = ctx.createLinearGradient(x, y, x + w, y + h);
    body.addColorStop(0, '#161022');
    body.addColorStop(0.45, '#0c0818');
    body.addColorStop(1, '#12081c');
    ctx.fillStyle = body;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = rgb(hc, 0.35 + G.pShow * 0.4);
    ctx.lineWidth = 2.2 * scale;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.2 * scale;
    roundRect(ctx, x + 8 * scale, y + 8 * scale, w - 16 * scale, h - 16 * scale, 28 * scale);
    ctx.stroke();

    const rivet = [
      [78, 82], [240, 78], [402, 82],
      [74, 240], [406, 240],
      [86, 392], [240, 402], [394, 392]
    ];
    for (let i = 0; i < rivet.length; i++) {
      const rx = sx(rivet[i][0]);
      const ry = sy(rivet[i][1]);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(rx, ry, 3.1 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(12, 8, 24, 0.9)';
      ctx.beginPath();
      ctx.arc(rx, ry, 1.6 * scale, 0, TAU);
      ctx.fill();
    }

    if (cracks.length && (G.mode === 'boom' || G.mode === 'fail')) {
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.75)';
      ctx.lineWidth = 1.6 * scale;
      ctx.lineCap = 'round';
      for (let i = 0; i < cracks.length; i++) {
        const pts = cracks[i];
        ctx.beginPath();
        ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
        for (let k = 1; k < pts.length; k++) ctx.lineTo(sx(pts[k].x), sy(pts[k].y));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawGauge() {
    const cx = sx(GAUGE_X);
    const cy = sy(GAUGE_Y);
    const r = GAUGE_R * scale;
    const p = clamp(G.pShow + G.needleJ, 0, 1.04);
    const hc = heatCol(G.pShow);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r + 10 * scale, 0, TAU);
    ctx.fillStyle = '#0a0614';
    ctx.fill();
    ctx.strokeStyle = rgb(hc, 0.55 + G.pShow * 0.35);
    ctx.lineWidth = 3.2 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    const face = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.1, cx, cy, r);
    face.addColorStop(0, '#1a1430');
    face.addColorStop(1, '#080612');
    ctx.fillStyle = face;
    ctx.fill();

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.85)';
    ctx.lineWidth = 8 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, needleA(RED), needleA(1.0));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.25)';
    ctx.lineWidth = 14 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, needleA(RED), needleA(1.0));
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, START_A, needleA(RED));
    ctx.stroke();

    for (let i = 0; i <= 10; i++) {
      const a = needleA(i / 10);
      const major = i % 2 === 0;
      const inner = r * (major ? 0.68 : 0.74);
      const outer = r * 0.82;
      ctx.strokeStyle = i >= 8 ? rgb(MAG, 0.9) : 'rgba(210, 230, 255, 0.55)';
      ctx.lineWidth = (major ? 2.1 : 1.1) * scale;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.stroke();
      if (major) {
        ctx.fillStyle = i >= 8 ? rgb(MAG, 0.95) : 'rgba(200, 220, 255, 0.7)';
        ctx.font = '600 ' + Math.max(9, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tx = cx + Math.cos(a) * r * 0.56;
        const ty = cy + Math.sin(a) * r * 0.56;
        ctx.fillText(String(i), tx, ty);
      }
    }

    ctx.fillStyle = rgb(hc, 0.9);
    ctx.font = '700 ' + Math.max(10, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('STEAM', cx, cy + r * 0.28);

    const a = needleA(p);
    const nx = Math.cos(a);
    const ny = Math.sin(a);
    ctx.save();
    ctx.strokeStyle = 'rgba(8, 4, 16, 0.55)';
    ctx.lineWidth = 5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - nx * r * 0.18, cy - ny * r * 0.18);
    ctx.lineTo(cx + nx * r * 0.72, cy + ny * r * 0.72);
    ctx.stroke();
    ctx.strokeStyle = G.pShow >= RED ? rgb(MAG, 1) : '#ffe36b';
    ctx.shadowColor = G.pShow >= RED ? rgb(MAG, 0.8) : 'rgba(255, 227, 107, 0.7)';
    ctx.shadowBlur = 10 * scale;
    ctx.lineWidth = 2.4 * scale;
    ctx.beginPath();
    ctx.moveTo(cx - nx * r * 0.16, cy - ny * r * 0.16);
    ctx.lineTo(cx + nx * r * 0.7, cy + ny * r * 0.7);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, 8.5 * scale, 0, TAU);
    ctx.fillStyle = '#14101f';
    ctx.fill();
    ctx.strokeStyle = rgb(hc, 0.95);
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2 * scale, 0, TAU);
    ctx.fillStyle = rgb(hc, 1);
    ctx.fill();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.9, -Math.PI * 0.95, -Math.PI * 0.55);
    ctx.stroke();
    ctx.restore();

    if (!G.revealed && G.mode === 'play') {
      const k = clamp(G.revealLeft / Math.max(0.01, STAGES[G.stage].reveal), 0, 1);
      ctx.strokeStyle = 'rgba(255, 227, 107, 0.75)';
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 16 * scale, -Math.PI / 2, -Math.PI / 2 + TAU * k);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawSeqStrip() {
    const n = G.valves.length;
    if (!n) return;
    const chip = 28;
    const gap = 6;
    const total = n * chip + (n - 1) * gap;
    const x0 = GAUGE_X - total * 0.5;
    const y = 300;
    const st = STAGES[G.stage];
    const hideId = !showLabelsNow() && st && !st.glow && G.mode === 'play';

    for (let k = 0; k < n; k++) {
      const x = x0 + k * (chip + gap);
      const done = k < G.next;
      const cur = k === G.next && G.next < n;
      const px = sx(x);
      const py = sy(y);
      roundRect(ctx, px, py, chip * scale, 22 * scale, 6 * scale);
      if (cur) {
        ctx.fillStyle = 'rgba(0, 240, 255, 0.16)';
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
      } else if (done) {
        ctx.fillStyle = 'rgba(255, 227, 107, 0.08)';
        ctx.strokeStyle = 'rgba(255, 227, 107, 0.35)';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.strokeStyle = 'rgba(139, 144, 184, 0.3)';
      }
      ctx.lineWidth = 1.2 * scale;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = done ? 'rgba(255, 227, 107, 0.85)' : cur ? '#e8ffff' : 'rgba(200, 210, 240, 0.55)';
      ctx.font = '700 ' + Math.max(11, 12 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = hideId ? '·' : String(k + 1);
      ctx.fillText(label, px + chip * scale * 0.5, py + 11 * scale);
    }
  }

  function drawPipes() {
    if (!G.valves.length) return;
    const st = STAGES[G.stage] || STAGES[0];
    const x0 = G.valves[0].x;
    const x1 = G.valves[G.valves.length - 1].x;
    const hc = heatCol(G.pShow);

    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgb(hc, 0.18 + G.pShow * 0.2);
    ctx.lineWidth = 16 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(MANI_Y));
    ctx.lineTo(sx(x1), sy(MANI_Y));
    ctx.stroke();
    ctx.strokeStyle = '#141022';
    ctx.lineWidth = 10 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(MANI_Y));
    ctx.lineTo(sx(x1), sy(MANI_Y));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(MANI_Y - 4));
    ctx.lineTo(sx(x1), sy(MANI_Y - 4));
    ctx.stroke();
    ctx.strokeStyle = rgb(MAG, 0.4 + G.pShow * 0.35);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x0), sy(MANI_Y + 4.5));
    ctx.lineTo(sx(x1), sy(MANI_Y + 4.5));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(GAUGE_X), sy(346));
    ctx.lineTo(sx(GAUGE_X), sy(MANI_Y));
    ctx.stroke();
    ctx.strokeStyle = '#141022';
    ctx.lineWidth = 3.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(GAUGE_X), sy(346));
    ctx.lineTo(sx(GAUGE_X), sy(MANI_Y));
    ctx.stroke();

    for (let i = 0; i < G.valves.length; i++) {
      const v = G.valves[i];
      const next = showGlow(st, v);
      ctx.strokeStyle = next ? 'rgba(0, 240, 255, 0.8)' : v.open ? 'rgba(255, 227, 107, 0.45)' : 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 5.5 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(v.x), sy(MANI_Y));
      ctx.lineTo(sx(v.x), sy(v.y - 28));
      ctx.stroke();
      ctx.strokeStyle = '#120c1e';
      ctx.lineWidth = 2.6 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(v.x), sy(MANI_Y));
      ctx.lineTo(sx(v.x), sy(v.y - 28));
      ctx.stroke();

      if (st.guide && next && (G.mode === 'play' || G.mode === 'title')) {
        ctx.setLineDash([6 * scale, 6 * scale]);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.lineWidth = 1.6 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(GAUGE_X), sy(GAUGE_Y + GAUGE_R + 8));
        ctx.quadraticCurveTo(sx(v.x), sy(380), sx(v.x), sy(v.y - 36));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }

  function drawValve(v, st) {
    const x = sx(v.x);
    const y = sy(v.y);
    const r = 30 * scale;
    const next = showGlow(st, v);
    const hover = ptr.hover === v.i || G.sel === v.i;
    const col = v.wrongT > 0 ? MAG : v.open ? GOLD : next ? CYN : CYN;
    const a = v.open ? 0.9 : next ? 0.95 : 0.55;

    ctx.save();
    if (next && v.glow > 0.05) {
      const pulse = 0.35 + Math.sin(G.clock * 6 + v.i) * 0.2;
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgb(CYN, v.glow * pulse * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(x, y, r + (10 + pulse * 8) * scale, 0, TAU);
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    if (hover && !v.open) {
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(x, y, r + 7 * scale, 0, TAU);
      ctx.stroke();
    }

    ctx.translate(x, y);
    ctx.rotate(v.ang + (next ? Math.sin(G.clock * 5) * 0.06 : 0));

    ctx.fillStyle = '#0c0a16';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgb(col, a);
    ctx.lineWidth = 2.4 * scale;
    ctx.stroke();

    ctx.strokeStyle = rgb(col, a * 0.85);
    ctx.lineWidth = 2.1 * scale;
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const ang = i * TAU / 6;
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r * 0.28, Math.sin(ang) * r * 0.28);
      ctx.lineTo(Math.cos(ang) * r * 0.82, Math.sin(ang) * r * 0.82);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, r * 0.34, 0, TAU);
    ctx.fillStyle = '#14101f';
    ctx.fill();
    ctx.strokeStyle = rgb(col, 0.95);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();
    ctx.restore();

    if (showLabelsNow() || (next && st.glow)) {
      ctx.fillStyle = v.open ? rgb(GOLD, 0.9) : next ? '#f4ffff' : 'rgba(210, 220, 245, 0.85)';
      ctx.font = '800 ' + Math.max(13, 15 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(v.order), x, y + 0.5 * scale);
    }

    if (v.wrongT > 0) {
      ctx.strokeStyle = rgb(MAG, v.wrongT * 0.8);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(x, y, r + 4 * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawJets() {
    for (let i = 0; i < jets.length; i++) {
      const j = jets[i];
      const k = j.t / 0.45;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grd = ctx.createLinearGradient(sx(j.x), sy(j.y), sx(j.x), sy(j.y - 50));
      grd.addColorStop(0, 'rgba(0, 240, 255,' + (0.35 * (1 - k)) + ')');
      grd.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = grd;
      const w = (10 + k * 16) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(j.x) - w * 0.3, sy(j.y));
      ctx.lineTo(sx(j.x) + w * 0.3, sy(j.y));
      ctx.lineTo(sx(j.x) + w, sy(j.y - (36 + k * 28)));
      ctx.lineTo(sx(j.x) - w, sy(j.y - (36 + k * 28)));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles() {
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
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.6;
      ctx.strokeStyle = r.mag
        ? 'rgba(255, 61, 184,' + (0.5 * (1 - k)) + ')'
        : r.gold
          ? 'rgba(255, 227, 107,' + (0.45 * (1 - k)) + ')'
          : 'rgba(0, 240, 255,' + (0.4 * (1 - k)) + ')';
      ctx.lineWidth = 1.6 * scale * (1 - k * 0.4);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + k * 32) * scale, 0, TAU);
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
    if (G.mode === 'play' && G.p >= RED) {
      const pulse = 0.5 + Math.sin(G.clock * 10) * 0.5;
      ctx.strokeStyle = 'rgba(255, 61, 184,' + (0.18 + pulse * 0.16) + ')';
      ctx.lineWidth = 8 * scale;
      ctx.strokeRect(sx(8), sy(8), (VW - 16) * scale, (VH - 16) * scale);
    }
  }

  function draw() {
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawBg();
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawFloor();
    drawBoiler();
    drawPipes();
    drawGauge();
    drawSeqStrip();
    drawJets();
    const st = STAGES[G.stage] || STAGES[0];
    for (let i = 0; i < G.valves.length; i++) drawValve(G.valves[i], st);
    drawParticles();
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
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || k === 'ArrowDown')) {
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      audio.ensure();
      startRun();
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      if (!overlay.classList.contains('hidden')) {
        e.preventDefault();
        overlayAction();
        return;
      }
    }
    if (G.mode !== 'play') return;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') {
      G.sel = (G.sel + G.valves.length - 1) % Math.max(1, G.valves.length);
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
      G.sel = (G.sel + 1) % Math.max(1, G.valves.length);
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      tryOpen(G.sel);
    }
    if (k >= '1' && k <= '6') {
      tryOpen((k.charCodeAt(0) - 49));
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const w = pointerWorld(e);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.x = w.x;
    ptr.y = w.y;
    const hit = hitValve(w.x, w.y);
    ptr.hover = hit;
    if (hit >= 0) G.sel = hit;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    const w = pointerWorld(e);
    ptr.x = w.x;
    ptr.y = w.y;
    ptr.hover = hitValve(w.x, w.y);
  });
  function endPtr(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    if (ptr.down && G.mode === 'play') {
      const w = pointerWorld(e);
      const hit = hitValve(w.x, w.y);
      if (hit >= 0) tryOpen(hit);
    }
    ptr.down = false;
    ptr.id = null;
    if (e.pointerType !== 'mouse') ptr.hover = -1;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') ptr.hover = -1;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });

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
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

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
