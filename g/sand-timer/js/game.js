'use strict';

(function () {
  const VW = 480;
  const VH = 760;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const FLIP_T = 0.4;
  const MUTE_KEY = 'playbox-sand-timer-mute';
  const OPS = '1–5 翻对应漏 · ← → 选 · 空格翻 · 点按 · M 静音';

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };

  const STAGES = [
    {
      name: '静候',
      sub: 'WAIT',
      hint: '金圈是标漏。别翻它，等另一只先空',
      toast: '标漏要最后走完',
      target: 1,
      glasses: [
        { dur: 3.5, top: 1 },
        { dur: 6.2, top: 1 }
      ]
    },
    {
      name: '倾长',
      sub: 'DUMP',
      hint: '标漏太快。等长漏流一点，点它翻面',
      toast: '沙沉到底就能翻 · 把长漏先倒空',
      target: 0,
      glasses: [
        { dur: 4.4, top: 1 },
        { dur: 6.2, top: 1 }
      ]
    },
    {
      name: '续命',
      sub: 'SAVE',
      hint: '灰漏翻不了。等标漏快见底再翻，把沙倒回去',
      toast: '封住的翻不动 · 标漏见底就翻面',
      target: 1,
      glasses: [
        { dur: 5.6, top: 1, sealed: true },
        { dur: 4.1, top: 1 }
      ]
    },
    {
      name: '三漏',
      sub: 'THREE',
      hint: '短漏会自己空。只翻那只最长的',
      toast: '三只一起流，只动长漏',
      target: 1,
      glasses: [
        { dur: 2.7, top: 1 },
        { dur: 5.2, top: 1 },
        { dur: 7.0, top: 1 }
      ]
    },
    {
      name: '双倾',
      sub: 'PAIR',
      hint: '两只长漏都要翻，标漏别动',
      toast: '两只长的都点翻',
      target: 0,
      glasses: [
        { dur: 4.2, top: 1 },
        { dur: 6.0, top: 1 },
        { dur: 6.6, top: 1 }
      ]
    },
    {
      name: '窄窗',
      sub: 'GATE',
      hint: '长漏要等沙松了才能翻，随即把标漏续上',
      toast: '窗口很短 · 先倾长，再救标',
      target: 1,
      glasses: [
        { dur: 1.85, top: 1 },
        { dur: 2.75, top: 1 },
        { dur: 8.5, top: 1, flipMin: 0.17, maxFlips: 1 }
      ]
    },
    {
      name: '灰封',
      sub: 'SEAL',
      hint: '灰漏动不了。标漏见底翻面；短漏不要碰',
      toast: '短漏乱翻会拖过标漏',
      target: 1,
      glasses: [
        { dur: 6.3, top: 1, sealed: true },
        { dur: 4.5, top: 1, maxFlips: 1 },
        { dur: 3.0, top: 1 }
      ]
    },
    {
      name: '四漏',
      sub: 'FOUR',
      hint: '四漏。两只长的都点翻，短的别管',
      toast: '两长一短，只倒长的',
      target: 1,
      glasses: [
        { dur: 2.5, top: 1 },
        { dur: 4.6, top: 1 },
        { dur: 6.3, top: 1 },
        { dur: 6.9, top: 1 }
      ]
    },
    {
      name: '危沙',
      sub: 'LOW',
      hint: '标漏只剩一层沙，马上翻；长漏等松了再翻',
      toast: '标漏快空了 · 立刻续命',
      target: 0,
      glasses: [
        { dur: 5.0, top: 0.28 },
        { dur: 3.3, top: 0.78 },
        { dur: 6.8, top: 0.91, flipMin: 0.13 }
      ]
    },
    {
      name: '压轴',
      sub: 'FINALE',
      hint: '先倒两只长漏，再在标漏见底时翻面续命',
      toast: '五漏压轴 · 灰的翻不了',
      target: 1,
      glasses: [
        { dur: 2.15, top: 1 },
        { dur: 3.55, top: 1, maxFlips: 1 },
        { dur: 6.2, top: 1 },
        { dur: 7.4, top: 1, flipMin: 0.15, maxFlips: 1 },
        { dur: 5.35, top: 1, sealed: true }
      ]
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

  const pointer = { down: false, id: null, x: VW * 0.5, y: VH * 0.5, hover: -1 };
  const pips = [];
  const particles = [];
  const grains = [];
  const motes = [];
  const rings = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    glasses: [],
    target: 0,
    sel: 0,
    lock: 0,
    settle: 0,
    shake: 0,
    magFlash: 0,
    goldFlash: 0,
    toastT: 0,
    why: '',
    taught: false,
    demoWait: 0,
    hiss: 0
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

  function place(n) {
    const y1 = 372;
    if (n <= 4) {
      const span = n === 2 ? 220 : n === 3 ? 300 : 356;
      const s = n === 2 ? 1.14 : n === 3 ? 0.98 : 0.84;
      const out = [];
      for (let i = 0; i < n; i++) {
        const u = n === 1 ? 0.5 : i / (n - 1);
        out.push({ x: VW * 0.5 - span * 0.5 + span * u, y: y1, s: s });
      }
      return out;
    }
    return [
      { x: 98, y: 292, s: 0.86 },
      { x: 240, y: 278, s: 0.92 },
      { x: 382, y: 292, s: 0.86 },
      { x: 150, y: 518, s: 0.88 },
      { x: 330, y: 518, s: 0.88 }
    ];
  }

  function makeGlass(def, i, pos) {
    const top = clamp(def.top == null ? 1 : def.top, 0.02, 1);
    return {
      i: i,
      dur: def.dur,
      top: top,
      sealed: !!def.sealed,
      flipMin: def.flipMin == null ? 0.12 : def.flipMin,
      maxFlips: def.sealed ? 0 : (def.maxFlips == null ? 2 : def.maxFlips),
      used: 0,
      flip: 0,
      flipping: false,
      done: false,
      doneAt: -1,
      x: pos.x,
      y: pos.y,
      s: pos.s,
      shake: 0,
      deny: 0,
      pulse: 0,
      readyTold: false
    };
  }

  function applyStage(st) {
    const pos = place(st.glasses.length);
    G.glasses = [];
    G.target = st.target;
    G.sel = st.target;
    for (let i = 0; i < st.glasses.length; i++) {
      G.glasses.push(makeGlass(st.glasses[i], i, pos[i] || pos[0]));
    }
    G.why = '';
    G.settle = 0;
    grains.length = 0;
  }

  function remain(g) {
    if (g.done) return 0;
    if (g.flipping) return (1 - g.top) * g.dur;
    return g.top * g.dur;
  }

  function canFlip(g) {
    if (!g || g.sealed || g.done || g.flipping) return false;
    if (g.used >= g.maxFlips) return false;
    const mn = g.flipMin == null ? 0.12 : g.flipMin;
    return g.top >= mn && g.top <= 1 - mn;
  }

  function denyWhy(g) {
    if (!g) return '';
    if (g.sealed) return '封住了';
    if (g.done) return '已经走完';
    if (g.flipping) return '';
    if (g.used >= g.maxFlips) return '翻够了';
    if (g.top > 1 - g.flipMin) return '沙太沉';
    if (g.top < g.flipMin) return '沙太沉';
    return '';
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    hissGain: null,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
        this._hiss();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    _hiss: function () {
      const sr = this.ctx.sampleRate;
      const n = Math.max(1, (sr * 0.28) | 0);
      const buf = this.ctx.createBuffer(1, n, sr);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        last = last * 0.78 + (Math.random() * 2 - 1) * 0.22;
        data[i] = last;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 2400;
      bp.Q.value = 0.55;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      src.connect(bp);
      bp.connect(g);
      g.connect(this.master);
      src.start();
      this.hissGain = g;
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      if (m && this.hissGain) this.hissGain.gain.value = 0;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    setHiss: function (amt) {
      if (!this.hissGain || !this.ctx) return;
      const v = this.muted ? 0 : amt * 0.07;
      this.hissGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.08);
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
      const n = 0.1;
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, sr * n), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 800;
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
    flip: function () {
      this.ensure();
      this.noise(0.12, 0.05, 700);
      this.beep(220, 0.14, 'sine', 0.05, 140);
      this.beep(640, 0.08, 'triangle', 0.03, 320);
    },
    deny: function () {
      this.ensure();
      this.beep(140, 0.1, 'square', 0.035, 70);
    },
    done: function (isTarget) {
      this.ensure();
      if (isTarget) {
        this.beep(392, 0.12, 'sine', 0.05);
        this.beep(523, 0.16, 'triangle', 0.045);
      } else {
        this.beep(330, 0.08, 'sine', 0.04, 220);
      }
    },
    fail: function () {
      this.ensure();
      this.beep(196, 0.22, 'sawtooth', 0.055, 80);
      this.beep(90, 0.34, 'sine', 0.06, 40);
    },
    clear: function () {
      this.ensure();
      this.beep(523, 0.11, 'sine', 0.055, 523);
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
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.4, spec.j * 0.4),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: spec.gold !== false,
        g: spec.g == null ? 380 : spec.g
      });
    }
  }

  function addRing(x, y, gold) {
    rings.push({ x: x, y: y, t: 0, gold: !!gold });
    if (rings.length > 16) rings.shift();
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.6;
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

  function targetGlass() {
    return G.glasses[G.target] || null;
  }

  function doneCount() {
    let n = 0;
    for (let i = 0; i < G.glasses.length; i++) if (G.glasses[i].done) n++;
    return n;
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const tg = targetGlass();
    const top = tg ? tg.top : 0;
    const rem = tg ? remain(tg) : 0;
    fillBar.style.transform = 'scaleX(' + clamp(top, 0, 1) + ')';
    fillNum.textContent = rem.toFixed(1) + 's';
    const low = tg && !tg.done && top < 0.28 && G.mode === 'play';
    const won = G.mode === 'clear' || G.mode === 'win';
    fillWrap.classList.toggle('hot', won);
    fillWrap.classList.toggle('warn', !!low || G.why === 'early');
    if (G.mode === 'title') {
      stageLabel.textContent = '十漏';
      leftLabel.textContent = '标漏压轴';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 漏 · ' + (st ? st.name : '');
      leftLabel.textContent = '已空 ' + doneCount() + '/' + G.glasses.length;
    }
    stageLabel.classList.toggle('hot', won);
    leftLabel.classList.toggle('warn', G.why === 'early');
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

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.14;
    G.why = '';
    G.taught = G.taught && fromFail;
    applyStage(STAGES[i]);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].toast || STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    grains.length = 0;
    G.lives = LIVES;
    G.taught = false;
    startStage(0, false);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    grains.length = 0;
    G.lives = LIVES;
    G.stage = 1;
    G.mode = 'title';
    G.why = '';
    G.demoWait = 0;
    applyStage(STAGES[1]);
    showOverlay(
      'title',
      '倒沙',
      '翻沙漏，让金圈那只最后走完。<br />沙沉两端才能翻；灰漏翻不动。',
      '开翻',
      'SAND',
      OPS
    );
    setHint('金圈是标漏 · 让它最后空', '');
    syncHud();
  }

  function beginFail() {
    if (G.mode !== 'play' || G.why) return;
    G.why = 'early';
    G.magFlash = 0.75;
    G.shake = 13;
    G.lock = 0.72;
    audio.fail();
    toast('标漏先空了', true);
    setHint('标漏先走完了', 'warn');
    const tg = targetGlass();
    if (tg) {
      emit(20, {
        x: tg.x, y: tg.y, j: 22,
        vx0: -120, vx1: 120, vy0: -160, vy1: 20,
        life: 0.7, r0: 1.4, r1: 3.6, mag: true, gold: false, g: 420
      });
    }
  }

  function failStage() {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    showOverlay(
      'lose',
      '先空了',
      more
        ? '金圈那只先走完了。要让别的先空。<br />还剩 ' + G.lives + ' 次。'
        : '金圈那只先走完了。十漏未完。',
      more ? '再试本漏' : '再来一局',
      'EARLY'
    );
  }

  function beginClear() {
    if (G.mode !== 'play' || G.why) return;
    G.why = 'clear';
    G.lock = 0.82;
    G.goldFlash = 0.8;
    audio.clear();
    toast('标漏压轴', false, true);
    const tg = targetGlass();
    if (tg) {
      addRing(tg.x, tg.y, true);
      emit(18, {
        x: tg.x, y: tg.y - 20, j: 18,
        vx0: -70, vx1: 70, vy0: -90, vy1: -10,
        life: 0.7, r0: 1.2, r1: 3.2, gold: true, g: 180
      });
    }
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '倒沙',
        '十漏皆定，标漏压轴。',
        '再倒一巡',
        'LAST SAND'
      );
      setHint('十漏皆定', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 1.05;
    setHint('标漏压轴', 'hot');
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

  function tryFlip(i, fromUser) {
    const g = G.glasses[i];
    if (!g) return false;
    if (G.mode !== 'play' && G.mode !== 'title') return false;
    if (G.mode === 'play' && (G.lock > 0 || G.why)) return false;
    G.sel = i;
    if (!canFlip(g)) {
      if (fromUser) {
        const w = denyWhy(g);
        if (w) {
          g.deny = 1;
          g.shake = 7;
          audio.deny();
          toast(w, true);
        }
      }
      return false;
    }
    g.flipping = true;
    g.flip = 0;
    g.used += 1;
    g.pulse = 0;
    audio.flip();
    addRing(g.x, g.y, i === G.target);
    emit(8, {
      x: g.x, y: g.y, j: 10,
      vx0: -50, vx1: 50, vy0: -40, vy1: 30,
      life: 0.35, r0: 1, r1: 2.2, gold: i === G.target, g: 80
    });
    return true;
  }

  function finishFlip(g) {
    g.top = 1 - g.top;
    g.flipping = false;
    g.flip = 0;
    if (g.top <= 0.002) {
      g.top = 0;
      g.done = true;
      g.doneAt = G.clock;
    }
  }

  function markDone(g) {
    if (g.done) return;
    g.done = true;
    g.top = 0;
    g.doneAt = G.clock;
    const isT = g.i === G.target;
    if (G.mode === 'play') audio.done(isT);
    addRing(g.x, g.y + 8 * g.s, isT);
    emit(10, {
      x: g.x, y: g.y + 40 * g.s, j: 12,
      vx0: -40, vx1: 40, vy0: -70, vy1: -10,
      life: 0.45, r0: 1, r1: 2.6, gold: true, g: 240
    });
  }

  function checkOutcome() {
    if (G.mode !== 'play' || G.why) return;
    const tg = targetGlass();
    if (!tg) return;
    let othersLeft = 0;
    for (let i = 0; i < G.glasses.length; i++) {
      if (i === G.target) continue;
      if (!G.glasses[i].done) othersLeft++;
    }
    if (tg.done && othersLeft > 0) beginFail();
    else if (!tg.done && othersLeft === 0) beginClear();
    else if (tg.done && othersLeft === 0) {
      let lastOther = -1;
      for (let i = 0; i < G.glasses.length; i++) {
        if (i === G.target) continue;
        if (G.glasses[i].doneAt > lastOther) lastOther = G.glasses[i].doneAt;
      }
      if (tg.doneAt > lastOther + 0.01) beginClear();
      else beginFail();
    }
  }

  function spawnGrain(g) {
    if (grains.length > 90) grains.shift();
    const s = g.s;
    grains.push({
      x: g.x + rand(-3.2, 3.2) * s,
      y: g.y + rand(-2, 2) * s,
      vx: rand(-10, 10) * s,
      vy: rand(46, 96) * s,
      life: rand(0.22, 0.42),
      max: 0.4,
      r: rand(0.7, 1.5) * s,
      gold: g.i === G.target,
      yMax: g.y + 58 * s
    });
  }

  function hitGlass(x, y) {
    let best = -1;
    let bestD = 1;
    for (let i = 0; i < G.glasses.length; i++) {
      const g = G.glasses[i];
      const rx = 62 * g.s;
      const ry = 120 * g.s;
      const dx = (x - g.x) / rx;
      const dy = (y - g.y) / ry;
      const d = dx * dx + dy * dy;
      if (d < 1 && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function worldFromEvent(e) {
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
    for (let i = 0; i < 40; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(30, VH - 30),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.15),
        p: rand(0, TAU),
        s: rand(5, 16),
        gold: Math.random() < 0.45
      });
    }
  }

  function updateGlasses(dt, flowing) {
    let hiss = 0;
    for (let i = 0; i < G.glasses.length; i++) {
      const g = G.glasses[i];
      g.shake *= Math.exp(-dt * 10);
      g.deny = Math.max(0, g.deny - dt * 1.8);
      if (g.flipping) {
        g.flip += dt / FLIP_T;
        if (g.flip >= 1) finishFlip(g);
        continue;
      }
      if (!flowing || g.done) {
        g.pulse = Math.max(0, g.pulse - dt);
        continue;
      }
      if (g.top > 0) {
        g.top = Math.max(0, g.top - dt / g.dur);
        hiss += clamp(g.top * 1.4, 0.15, 1);
        if (Math.random() < dt * (10 + g.top * 14)) spawnGrain(g);
      }
      if (g.top <= 0.001) markDone(g);
      if (canFlip(g)) {
        g.pulse = Math.min(1, g.pulse + dt * 3);
        if (!g.readyTold && G.mode === 'play' && i !== G.target && g.top > 0.5) {
          g.readyTold = true;
          if (!G.taught && G.stage >= 1) {
            G.taught = true;
            toast('可以翻了');
          }
        }
      } else {
        g.pulse = Math.max(0, g.pulse - dt * 2);
      }
    }
    G.hiss = lerp(G.hiss, G.mode === 'play' || G.mode === 'title' ? hiss : 0, 1 - Math.exp(-8 * dt));
    audio.setHiss(G.hiss);
  }

  function demoThink() {
    if (G.demoWait > 0) return;
    const tg = targetGlass();
    if (!tg) return;
    const tRem = remain(tg);
    let slow = -1;
    let slowRem = -1;
    for (let i = 0; i < G.glasses.length; i++) {
      const g = G.glasses[i];
      if (i === G.target || g.done || g.sealed) continue;
      const r = remain(g);
      if (r > tRem && r > slowRem && canFlip(g) && g.top > 0.5) {
        slowRem = r;
        slow = i;
      }
    }
    if (slow >= 0) {
      tryFlip(slow, false);
      return;
    }
    if (canFlip(tg) && tg.top < 0.46) {
      let otherMax = 0;
      for (let i = 0; i < G.glasses.length; i++) {
        if (i === G.target || G.glasses[i].done) continue;
        otherMax = Math.max(otherMax, remain(G.glasses[i]));
      }
      if (tRem < otherMax - 0.05) tryFlip(G.target, false);
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.6);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.4);
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
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = grains.length - 1; i >= 0; i--) {
      const p = grains[i];
      p.life -= dt;
      p.vy += 420 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0 || p.y > p.yMax) grains.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.55) rings.splice(i, 1);
    }
  }

  function updateTitle(dt) {
    updateGlasses(dt, true);
    demoThink();
    const tg = targetGlass();
    let othersLeft = 0;
    for (let i = 0; i < G.glasses.length; i++) {
      if (i !== G.target && !G.glasses[i].done) othersLeft++;
    }
    const resolved = (tg && tg.done) || (othersLeft === 0 && tg && !tg.done);
    if (resolved) {
      G.demoWait += dt;
      if (G.demoWait > 1.35) {
        applyStage(STAGES[1]);
        G.demoWait = 0;
      }
    } else if (G.clock > 14 && G.demoWait === 0) {
      applyStage(STAGES[1]);
    }
  }

  function updatePlay(dt) {
    if (G.lock > 0) G.lock -= dt;
    updateGlasses(dt, !G.why);
    if (!G.why) checkOutcome();
    if (G.why === 'early' && G.lock <= 0) failStage();
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      G.settle -= dt;
      updateGlasses(dt, false);
      if (G.settle <= 0) startStage(G.stage + 1, false);
    } else {
      updateGlasses(dt, false);
    }
    updateFx(dt);
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

  function glassPath(c, w, h, nw, nh) {
    c.beginPath();
    c.moveTo(-w, -h);
    c.lineTo(w, -h);
    c.quadraticCurveTo(w * 0.18, -h * 0.38, nw, -nh);
    c.lineTo(nw, nh);
    c.quadraticCurveTo(w * 0.18, h * 0.38, w, h);
    c.lineTo(-w, h);
    c.quadraticCurveTo(-w * 0.18, h * 0.38, -nw, nh);
    c.lineTo(-nw, -nh);
    c.quadraticCurveTo(-w * 0.18, -h * 0.38, -w, -h);
    c.closePath();
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createRadialGradient(sx(80), sy(36), 8, sx(80), sy(36), 300 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.16)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(70), 8, sx(400), sy(70), 280 * scale);
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
    vg.addColorStop(0, 'rgba(22, 8, 36, 0.9)');
    vg.addColorStop(0.5, 'rgba(8, 6, 18, 0.15)');
    vg.addColorStop(1, 'rgba(18, 10, 6, 0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    for (let y = 48; y < 700; y += 46) {
      ctx.beginPath();
      ctx.moveTo(sx(24), sy(y));
      ctx.lineTo(sx(VW - 24), sy(y));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.35 + m.p) * 8);
      const y = sy((m.y + G.clock * m.s) % VH);
      ctx.fillStyle = m.gold ? 'rgba(255, 227, 107,' + m.a + ')' : 'rgba(180, 230, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLanterns() {
    const list = [
      { x: 58, y: 118, ph: 0.2, gold: false, s: 0.92 },
      { x: 422, y: 102, ph: 1.55, gold: true, s: 1.02 },
      { x: 118, y: 78, ph: 2.5, gold: false, s: 0.74 }
    ];
    for (let i = 0; i < list.length; i++) {
      const L = list[i];
      const bob = Math.sin(G.clock * 1.35 + L.ph) * 3.5;
      const x = L.x;
      const y = L.y + bob;
      const s = L.s;
      const col = L.gold ? GOLD : CYN;
      ctx.strokeStyle = L.gold ? 'rgba(255,227,107,0.3)' : 'rgba(0,240,255,0.24)';
      ctx.lineWidth = 1.15 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(0));
      ctx.lineTo(sx(x), sy(y - 16 * s));
      ctx.stroke();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.16 + Math.sin(G.clock * 2.1 + L.ph) * 0.05;
      const glow = ctx.createRadialGradient(sx(x), sy(y + 2 * s), 2 * scale, sx(x), sy(y), 26 * s * scale);
      glow.addColorStop(0, rgb(col, pulse + 0.1));
      glow.addColorStop(1, rgb(col, 0));
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y + 2 * s), 26 * s * scale, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.scale(scale * s, scale * s);
      ctx.fillStyle = L.gold ? 'rgba(48, 28, 10, 0.92)' : 'rgba(12, 28, 40, 0.92)';
      ctx.strokeStyle = L.gold ? rgb(GOLD, 0.85) : rgb(CYN, 0.8);
      ctx.lineWidth = 1.35;
      roundRect(ctx, -7, -16, 14, 4, 1.2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-8, -12);
      ctx.lineTo(8, -12);
      ctx.lineTo(10, 10);
      ctx.lineTo(-10, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = L.gold ? 'rgba(255, 220, 120, 0.85)' : 'rgba(140, 240, 255, 0.7)';
      ctx.beginPath();
      ctx.ellipse(0, -1, 3.2, 5.2, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = L.gold ? rgb(GOLD, 0.55) : rgb(CYN, 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(0, 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(-2.2, 19);
      ctx.moveTo(0, 16);
      ctx.lineTo(2.2, 19);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPlank(y) {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.lineWidth = 1.8 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(22), sy(y));
    ctx.lineTo(sx(VW - 22), sy(y));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.14)';
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(48), sy(y + 8));
    ctx.lineTo(sx(VW - 48), sy(y + 8));
    ctx.stroke();
  }

  function drawShelf() {
    const feet = [];
    let maxY = 0;
    for (let i = 0; i < G.glasses.length; i++) {
      const g = G.glasses[i];
      const foot = g.y + 118 * g.s;
      feet.push(foot);
      if (foot > maxY) maxY = foot;
    }
    if (!maxY) maxY = 520;
    const y = sy(maxY);
    const grd = ctx.createLinearGradient(sx(0), y - 12 * scale, sx(0), sy(VH));
    grd.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
    grd.addColorStop(0.1, '#140a1c');
    grd.addColorStop(1, '#05030c');
    ctx.fillStyle = grd;
    ctx.fillRect(sx(0), y - 4 * scale, VW * scale, sy(VH) - (y - 4 * scale));

    const rows = [];
    for (let i = 0; i < feet.length; i++) {
      let found = false;
      for (let r = 0; r < rows.length; r++) {
        if (Math.abs(rows[r] - feet[i]) < 28) {
          found = true;
          break;
        }
      }
      if (!found) rows.push(feet[i]);
    }
    for (let i = 0; i < rows.length; i++) drawPlank(rows[i]);
  }

  function drawSandInBulb(c, topAmt, botAmt, w, h, nw, nh, wave, isTarget) {
    const col = isTarget ? GOLD : { r: 232, g: 176, b: 72 };
    const col2 = isTarget ? { r: 255, g: 140, b: 70 } : { r: 180, g: 110, b: 36 };

    function fillUpper(amt) {
      if (amt < 0.008) return;
      const bulbH = h - nh;
      const k = Math.pow(clamp(amt, 0, 1), 0.62);
      const sh = lerp(6, bulbH * 0.92, k);
      const y0 = -nh;
      const y1 = -nh - sh;
      const t0 = 0;
      const t1 = sh / Math.max(1, bulbH);
      const w0 = lerp(nw, w, t0);
      const w1 = lerp(nw, w, t1);
      const wav = Math.sin(wave) * 2.2 * Math.min(1, amt * 3);
      c.beginPath();
      c.moveTo(-w0, y0);
      c.lineTo(w0, y0);
      c.lineTo(w1 + wav * 0.15, y1);
      c.quadraticCurveTo(0, y1 - 3 + wav, -w1, y1);
      c.closePath();
      const gd = c.createLinearGradient(0, y1, 0, y0);
      gd.addColorStop(0, rgb(col, 0.95));
      gd.addColorStop(1, rgb(col2, 0.92));
      c.fillStyle = gd;
      c.fill();
      c.strokeStyle = rgb(GOLD, 0.45);
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(-w1, y1);
      c.quadraticCurveTo(0, y1 - 3 + wav, w1, y1);
      c.stroke();
    }

    function fillLower(amt) {
      if (amt < 0.008) return;
      const bulbH = h - nh;
      const k = Math.pow(clamp(amt, 0, 1), 0.62);
      const sh = lerp(6, bulbH * 0.92, k);
      const y1 = h;
      const y0 = h - sh;
      const t = sh / Math.max(1, bulbH);
      const ww = lerp(w, nw, t);
      const wav = Math.sin(wave + 1.2) * 2.4 * Math.min(1, amt * 3);
      c.beginPath();
      c.moveTo(-w, y1);
      c.lineTo(w, y1);
      c.lineTo(ww, y0);
      c.quadraticCurveTo(0, y0 - 4 + wav, -ww, y0);
      c.closePath();
      const gd = c.createLinearGradient(0, y0, 0, y1);
      gd.addColorStop(0, rgb(col, 0.98));
      gd.addColorStop(1, rgb(col2, 1));
      c.fillStyle = gd;
      c.fill();
      c.strokeStyle = rgb(GOLD, 0.5);
      c.lineWidth = 1.15;
      c.beginPath();
      c.moveTo(-ww, y0);
      c.quadraticCurveTo(0, y0 - 4 + wav, ww, y0);
      c.stroke();
    }

    c.save();
    glassPath(c, w * 0.92, h * 0.96, nw * 0.9, nh);
    c.clip();
    fillUpper(topAmt);
    fillLower(botAmt);
    c.restore();
  }

  function drawStream(c, amt, w, nw, nh, isTarget) {
    if (amt < 0.02) return;
    const a = 0.35 + Math.sin(G.clock * 18) * 0.12;
    const thick = lerp(0.7, 2.6, clamp(amt * 1.4, 0, 1));
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gd = c.createLinearGradient(0, -nh - 8, 0, nh + 18);
    const col = isTarget ? 'rgba(255,227,107,' : 'rgba(255,200,90,';
    gd.addColorStop(0, col + '0)');
    gd.addColorStop(0.35, col + a + ')');
    gd.addColorStop(1, col + '0)');
    c.fillStyle = gd;
    c.fillRect(-thick, -nh - 6, thick * 2, nh * 2 + 28);
    c.restore();
  }

  function drawLock(c, s) {
    c.save();
    c.strokeStyle = 'rgba(190, 198, 230, 0.9)';
    c.fillStyle = 'rgba(22, 24, 40, 0.92)';
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(0, -6 * s, 6 * s, Math.PI, 0, false);
    c.stroke();
    roundRect(c, -8.5 * s, -3 * s, 17 * s, 14 * s, 2.4 * s);
    c.fill();
    c.stroke();
    c.fillStyle = 'rgba(0, 240, 255, 0.5)';
    c.beginPath();
    c.arc(0, 2.2 * s, 1.7 * s, 0, TAU);
    c.fill();
    c.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, 3.6 * s);
    c.lineTo(0, 7.2 * s);
    c.stroke();
    c.restore();
  }

  function drawGlass(g) {
    const isT = g.i === G.target;
    const s = g.s;
    const w = 44 * s;
    const h = 80 * s;
    const nw = 4.4 * s;
    const nh = 5.6 * s;
    const capW = 94 * s;
    const capH = 12 * s;
    const ang = g.flipping ? ease(clamp(g.flip, 0, 1)) * Math.PI : 0;
    const ready = canFlip(g);
    const sel = G.sel === g.i && (G.mode === 'play' || G.mode === 'title');
    const hover = pointer.hover === g.i;
    const wave = G.clock * 5 + g.i * 1.7;

    ctx.save();
    const jx = (g.shake ? Math.sin(G.t * 62) * g.shake : 0) + (g.deny ? Math.sin(G.t * 70) * 2.4 * g.deny : 0);
    ctx.translate(sx(g.x + jx), sy(g.y));
    ctx.scale(scale, scale);

    ctx.save();
    ctx.translate(0, h + capH + 6);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 36 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a1024';
    roundRect(ctx, -28 * s, -8 * s, 56 * s, 10 * s, 3);
    ctx.fill();
    ctx.strokeStyle = isT ? 'rgba(255,227,107,0.35)' : 'rgba(0,240,255,0.22)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    if (isT) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const pulse = 0.14 + Math.sin(G.clock * 3.2) * 0.05;
      ctx.fillStyle = rgb(GOLD, pulse);
      ctx.beginPath();
      ctx.ellipse(0, 0, 70 * s, 118 * s, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else if (ready) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgb(CYN, 0.06 + g.pulse * 0.07);
      ctx.beginPath();
      ctx.ellipse(0, 0, 64 * s, 110 * s, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.rotate(ang);

    ctx.fillStyle = g.sealed ? '#2a3144' : '#1c142c';
    roundRect(ctx, -capW * 0.5, -h - capH, capW, capH, 3);
    ctx.fill();
    roundRect(ctx, -capW * 0.5, h, capW, capH, 3);
    ctx.fill();
    ctx.strokeStyle = g.sealed ? 'rgba(160,170,200,0.45)' : (isT ? rgb(GOLD, 0.8) : rgb(CYN, 0.7));
    ctx.lineWidth = 1.5;
    roundRect(ctx, -capW * 0.5, -h - capH, capW, capH, 3);
    ctx.stroke();
    roundRect(ctx, -capW * 0.5, h, capW, capH, 3);
    ctx.stroke();

    glassPath(ctx, w, h, nw, nh);
    ctx.fillStyle = g.sealed ? 'rgba(70, 80, 110, 0.18)' : 'rgba(90, 200, 255, 0.07)';
    ctx.fill();

    const topAmt = g.flipping ? g.top : g.top;
    const botAmt = 1 - g.top;
    drawSandInBulb(ctx, topAmt, botAmt, w, h, nw, nh, wave, isT);
    if (!g.done && !g.flipping && g.top > 0.02) drawStream(ctx, g.top, w, nw, nh, isT);

    glassPath(ctx, w, h, nw, nh);
    ctx.strokeStyle = g.sealed
      ? 'rgba(170, 178, 210, 0.55)'
      : (isT ? rgb(GOLD, 0.92) : rgb(CYN, 0.78 + g.pulse * 0.22));
    ctx.lineWidth = (isT ? 2.15 : 1.7) + (hover ? 0.4 : 0);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.55, -h * 0.55);
    ctx.quadraticCurveTo(-w * 0.7, -h * 0.1, -nw - 1, -nh);
    ctx.stroke();

    ctx.restore();

    if (sel) {
      ctx.strokeStyle = rgb(CYN, 0.7);
      ctx.setLineDash([5, 4]);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 58 * s, 108 * s, 0, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (g.sealed) {
      ctx.save();
      ctx.translate(0, -h - capH - 20 * s);
      drawLock(ctx, s);
      ctx.restore();
    }

    ctx.font = '700 ' + Math.round(13 * s) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = 'rgba(5, 3, 12, 0.72)';
    ctx.strokeText(String(g.i + 1), 0, h + capH + 8 * s);
    ctx.fillStyle = isT ? rgb(GOLD, 0.95) : 'rgba(210, 230, 255, 0.9)';
    ctx.fillText(String(g.i + 1), 0, h + capH + 8 * s);

    if (isT) {
      ctx.font = '800 ' + Math.round(12 * s) + 'px "PingFang SC", "Noto Sans SC", sans-serif';
      ctx.lineWidth = 3.2;
      ctx.strokeStyle = 'rgba(5, 3, 12, 0.75)';
      ctx.strokeText('标', 0, -h - capH - 16 * s);
      ctx.fillStyle = rgb(GOLD, 0.95);
      ctx.fillText('标', 0, -h - capH - 16 * s);
      ctx.strokeStyle = rgb(GOLD, 0.85);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -h - capH - 16 * s, 11 * s, 0, TAU);
      ctx.stroke();
    }

    if (g.done) {
      ctx.strokeStyle = rgb(CYN, 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-7 * s, 2 * s);
      ctx.lineTo(-2 * s, 8 * s);
      ctx.lineTo(9 * s, -8 * s);
      ctx.stroke();
    }

    if (g.deny > 0.2) {
      ctx.strokeStyle = rgb(MAG, g.deny);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10 * s, -10 * s);
      ctx.lineTo(10 * s, 10 * s);
      ctx.moveTo(10 * s, -10 * s);
      ctx.lineTo(-10 * s, 10 * s);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGrains() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < grains.length; i++) {
      const p = grains[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.gold ? rgb(GOLD, 0.55 * a) : 'rgba(255, 200, 90,' + (0.5 * a) + ')';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.mag ? rgb(MAG, 0.7 * a) : rgb(GOLD, 0.7 * a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.55;
      ctx.strokeStyle = r.gold ? rgb(GOLD, 0.55 * (1 - k)) : rgb(CYN, 0.5 * (1 - k));
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (12 + k * 46) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlashes() {
    if (G.magFlash > 0) {
      ctx.fillStyle = rgb(MAG, G.magFlash * 0.16);
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = rgb(GOLD, G.goldFlash * 0.1);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    drawBg();
    ctx.save();
    if (G.shake > 0.2) {
      ctx.translate(
        Math.sin(G.t * 57) * G.shake * scale * 0.35,
        Math.cos(G.t * 49) * G.shake * scale * 0.2
      );
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawLanterns();
    drawShelf();
    for (let i = 0; i < G.glasses.length; i++) drawGlass(G.glasses[i]);
    drawGrains();
    drawParticles();
    ctx.restore();
    ctx.restore();
    drawFlashes();
  }

  function onKey(e) {
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
    if (k === 'Escape' && (G.mode === 'fail' || G.mode === 'win')) {
      bootTitle();
      e.preventDefault();
      return;
    }
    if (G.mode === 'title' || G.mode === 'fail' || G.mode === 'win') {
      if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
        overlayAction();
        e.preventDefault();
      }
      return;
    }
    if (G.mode !== 'play') return;
    if (k >= '1' && k <= '9') {
      const i = k.charCodeAt(0) - 49;
      if (i < G.glasses.length) tryFlip(i, true);
      e.preventDefault();
      return;
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      G.sel = (G.sel + G.glasses.length - 1) % G.glasses.length;
      e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      G.sel = (G.sel + 1) % G.glasses.length;
      e.preventDefault();
      return;
    }
    if (k === ' ' || k === 'Spacebar' || k === 'Enter' || k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'f' || k === 'F') {
      tryFlip(G.sel, true);
      e.preventDefault();
    }
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (e.target.closest && e.target.closest('.tools, .panel')) return;
    if (G.mode === 'title' || G.mode === 'fail' || G.mode === 'win') {
      if (e.target === ovBtn || (e.target.closest && e.target.closest('.panel'))) return;
      return;
    }
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    const hit = hitGlass(w.x, w.y);
    pointer.hover = hit;
    if (hit >= 0 && G.mode === 'play') tryFlip(hit, true);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }

  function onPointerMove(e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.hover = hitGlass(w.x, w.y);
  }

  function onPointerUp(e) {
    pointer.down = false;
    pointer.id = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  }

  ovBtn.addEventListener('click', function (e) {
    e.stopPropagation();
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
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlayAction();
  });

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) audio.setHiss(0);
  });

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  resize();
  seedMotes();
  bootTitle();

  let acc = 0;
  let last = performance.now();
  function loop(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (hidden) {
      requestAnimationFrame(loop);
      return;
    }
    dt = Math.min(0.05, dt);
    acc += dt;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
