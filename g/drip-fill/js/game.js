'use strict';

(function () {
  const VW = 480;
  const VH = 760;
  const PIPE_Y = 118;
  const TIP_Y = 156;
  const MOUTH_Y = 538;
  const GLASS_H = 148;
  const TABLE_Y = MOUTH_Y + GLASS_H - 10;
  const COUNT_IN = 4;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-drip-fill-mute';
  const CUP_ACC = 2680;
  const CUP_MAX = 470;
  const CUP_FRIC = 9.2;

  const STAGES = [
    {
      name: '初滴',
      bpm: 68,
      fall: 2,
      need: 3,
      cup: 114,
      spouts: 1,
      hint: '对准落下的水 · 接到三滴就躲开',
      pat: [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0]]
    },
    {
      name: '满线',
      bpm: 76,
      fall: 2,
      need: 4,
      cup: 102,
      spouts: 1,
      hint: '再接一滴，满了立刻挪开',
      pat: [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0], [10, 0]]
    },
    {
      name: '偏嘴',
      bpm: 80,
      fall: 2,
      need: 4,
      cup: 96,
      spouts: 1,
      offset: 92,
      hint: '水嘴偏了，杯子跟过去',
      pat: [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0], [10, 0]]
    },
    {
      name: '左右',
      bpm: 84,
      fall: 2,
      need: 5,
      cup: 92,
      spouts: 2,
      hint: '左右轮流接，满线停手',
      pat: [[0, 0], [2, 1], [4, 0], [6, 1], [8, 0], [10, 1], [12, 0], [14, 1]]
    },
    {
      name: '同侧',
      bpm: 92,
      fall: 2,
      need: 6,
      cup: 84,
      spouts: 2,
      hint: '同一边会连滴两下',
      pat: [[0, 0], [1, 0], [3, 1], [4, 1], [6, 0], [7, 0], [9, 1], [10, 1]]
    },
    {
      name: '三口',
      bpm: 96,
      fall: 1.5,
      need: 6,
      cup: 78,
      spouts: 3,
      hint: '三张嘴轮着滴，满了别贪',
      pat: [[0, 0], [2, 1], [4, 2], [6, 0], [7, 1], [8, 2], [10, 0], [11, 1], [12, 2], [13, 1]]
    },
    {
      name: '游管',
      bpm: 100,
      fall: 2,
      need: 7,
      cup: 72,
      spouts: 1,
      move: { amp: 128, period: 8, ph: 0 },
      hint: '管子在游，盯着水滴落点',
      pat: [[0, 0], [2, 0], [4, 0], [6, 0], [8, 0], [10, 0], [12, 0], [14, 0], [16, 0], [18, 0]]
    },
    {
      name: '卡拍',
      bpm: 108,
      fall: 1.5,
      need: 7,
      cup: 64,
      spouts: 2,
      hint: '拍子不匀，看滴不看管',
      pat: [[0, 0], [1.5, 1], [2.5, 0], [4, 1], [5.5, 0], [6, 1], [8, 0], [9.5, 1], [11, 0]]
    },
    {
      name: '乱序',
      bpm: 116,
      fall: 1.5,
      need: 8,
      cup: 58,
      spouts: 3,
      hint: '落点乱跳，杯子少晃过',
      pat: [[0, 1], [1, 0], [2, 2], [3.5, 1], [4, 0], [5, 2], [6.5, 0], [7, 2], [8, 1], [9, 0], [10, 2], [11.5, 1]]
    },
    {
      name: '封喉',
      bpm: 124,
      fall: 1,
      need: 9,
      cup: 50,
      spouts: 1,
      move: { amp: 152, period: 6, ph: 0.4 },
      hint: '九滴刚好，多一滴就溢',
      pat: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0]]
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

  const keys = { l: false, r: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, id: null };

  const particles = [];
  const motes = [];
  const pips = [];
  const rings = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    fill: 0,
    need: 3,
    song: 0,
    beatDur: 0.88,
    fallBeats: 2,
    nSpouts: 1,
    bases: [240],
    move: null,
    cup: { x: 240, vx: 0, w: 114 },
    slosh: 0,
    drops: [],
    spawned: [],
    resolved: 0,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    lineGlow: 0,
    lock: 0,
    settle: 0,
    toastT: 0,
    why: '',
    full: false,
    taught: false,
    beatPulse: 0,
    overflow: 0,
    lastBeat: -1,
    pat: [],
    demoFill: 0
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

  function spoutBases(st) {
    const n = st.spouts;
    let xs;
    if (n === 1) xs = [VW * 0.5];
    else if (n === 2) xs = [148, 332];
    else xs = [108, 240, 372];
    const off = st.offset || 0;
    const out = [];
    for (let i = 0; i < xs.length; i++) out.push(xs[i] + off);
    return out;
  }

  function spoutX(i, beats) {
    let x = G.bases[i] || VW * 0.5;
    if (G.move) {
      x += Math.sin(beats * TAU / G.move.period + G.move.ph) * G.move.amp;
    }
    return x;
  }

  function cupBounds() {
    const half = G.cup.w * 0.5;
    return { lo: 28 + half, hi: VW - 28 - half };
  }

  function innerHalf() {
    return G.cup.w * 0.46;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    lastTick: -9,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide) {
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
    noise(dur, vol, hp) {
      if (!this.ctx || this.muted) return;
      const n = 0.12;
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, sr * n), sr);
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
    tick(strong) {
      this.ensure();
      if (strong) {
        this.beep(78, 0.07, 'sine', 0.06, 48);
        this.beep(620, 0.04, 'triangle', 0.03);
      } else {
        this.beep(880, 0.03, 'sine', 0.025);
      }
    },
    drop() {
      this.ensure();
      this.beep(240, 0.12, 'sine', 0.05, 90);
    },
    catch() {
      this.ensure();
      this.noise(0.08, 0.045, 1200);
      this.beep(520, 0.09, 'sine', 0.07, 980);
    },
    line() {
      this.ensure();
      this.beep(784, 0.16, 'sine', 0.08, 1180);
      this.beep(1175, 0.22, 'triangle', 0.045, 1560);
    },
    miss() {
      this.ensure();
      this.beep(180, 0.08, 'triangle', 0.03, 90);
    },
    overflow() {
      this.ensure();
      this.noise(0.22, 0.08, 400);
      this.beep(220, 0.28, 'sawtooth', 0.05, 70);
      this.beep(90, 0.4, 'sine', 0.07, 40);
    },
    under() {
      this.ensure();
      this.beep(196, 0.22, 'sine', 0.05, 110);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06, 523);
      this.beep(659, 0.14, 'sine', 0.055, 659);
      this.beep(784, 0.22, 'triangle', 0.05, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.14, 'sine', 0.07);
      this.beep(659, 0.16, 'sine', 0.06);
      this.beep(784, 0.18, 'sine', 0.06);
      this.beep(1046, 0.36, 'triangle', 0.07, 1560);
    },
    start() {
      this.ensure();
      this.beep(392, 0.12, 'sine', 0.05, 784);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 150) particles.shift();
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

  function addRing(x, y, mag) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag });
    if (rings.length > 18) rings.shift();
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

  function remainingDrops() {
    return G.pat.length - G.resolved;
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const need = G.need;
    const fill = G.mode === 'title' ? G.demoFill : G.fill;
    const k = need ? clamp(fill / need, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = fill + '/' + need;
    fillWrap.classList.toggle('hot', G.full && G.mode === 'play');
    fillWrap.classList.toggle('warn', G.mode === 'play' && fill === need - 1 && !G.full);
    if (G.mode === 'title') {
      stageLabel.textContent = '十管';
      leftLabel.textContent = '满线停';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 管 · ' + (st ? st.name : '');
      leftLabel.textContent = '余滴 ' + remainingDrops();
    }
    stageLabel.classList.toggle('hot', G.full && G.mode === 'play');
    leftLabel.classList.toggle('warn', G.full && G.mode === 'play');
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
    ovOps.textContent = ops || '← → / A D 挪杯 · 拖动杯子 · M 静音';
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function resetCup(w, x) {
    G.cup.w = w;
    G.cup.vx = 0;
    const b = { lo: 28 + w * 0.5, hi: VW - 28 - w * 0.5 };
    G.cup.x = clamp(x == null ? VW * 0.5 : x, b.lo, b.hi);
    G.slosh = 0;
  }

  function applyStage(st, demo) {
    G.need = st.need;
    G.fill = demo ? G.demoFill : 0;
    G.beatDur = 60 / st.bpm;
    G.fallBeats = st.fall;
    G.nSpouts = st.spouts;
    G.bases = spoutBases(st);
    G.move = st.move || null;
    G.pat = st.pat;
    G.spawned = [];
    for (let i = 0; i < st.pat.length; i++) G.spawned[i] = false;
    G.drops.length = 0;
    G.resolved = 0;
    G.full = false;
    G.settle = 0;
    G.overflow = 0;
    G.lastBeat = -1;
    G.lineGlow = 0;
    if (!demo) resetCup(st.cup, VW * 0.5);
  }

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.song = 0;
    G.lock = 0.12;
    G.why = '';
    G.taught = G.taught && fromFail;
    applyStage(STAGES[i], false);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.taught = false;
    G.demoFill = 0;
    startStage(0, false);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    G.demoFill = 0;
    G.fill = 0;
    G.full = false;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.song = 0;
    G.why = '';
    applyStage(STAGES[0], true);
    resetCup(114, VW * 0.5);
    showOverlay(
      'title',
      '滴满',
      '按节拍把水接到刻度。<br />满到线就躲开，溢了就输。',
      '开接',
      'DRIP',
      '← → / A D 挪杯 · 拖动杯子 · M 静音'
    );
    setHint('对准水滴 · 满线躲开', '');
    syncHud();
  }

  function spawnDrop(si, beats) {
    const x = spoutX(si, beats);
    const fallT = G.fallBeats * G.beatDur;
    const dist = MOUTH_Y - 10 - TIP_Y;
    G.drops.push({
      x: x,
      y: TIP_Y + 6,
      vy: dist / Math.max(0.12, fallT),
      r: 6.2,
      alive: true,
      caught: false
    });
    addRing(x, TIP_Y + 4, false);
    if (G.mode === 'play') audio.drop();
  }

  function catchDrop(d) {
    d.alive = false;
    d.caught = true;
    G.resolved += 1;
    if (G.mode !== 'play') {
      G.demoFill += 1;
      emit(8, {
        x: d.x, y: MOUTH_Y + 8, j: 10,
        vx0: -50, vx1: 50, vy0: -90, vy1: -10,
        life: 0.45, r0: 1.2, r1: 2.8, g: 280
      });
      return;
    }
    if (G.full || G.fill >= G.need) {
      beginOverflow(d.x);
      return;
    }
    G.fill += 1;
    G.lineGlow = 1;
    audio.catch();
    emit(10, {
      x: d.x, y: MOUTH_Y + 10, j: 12,
      vx0: -70, vx1: 70, vy0: -120, vy1: -20,
      life: 0.5, r0: 1.2, r1: 3.1, g: 260
    });
    if (G.fill === G.need) {
      G.full = true;
      G.goldFlash = 0.55;
      audio.line();
      toast('满了 · 躲开！', false, true);
      setHint('满了 · 躲开余滴', 'hot');
    } else if (G.fill === G.need - 1 && !G.taught) {
      G.taught = true;
      toast('还差一滴');
    }
    syncHud();
  }

  function missDrop(d) {
    d.alive = false;
    G.resolved += 1;
    if (G.mode === 'play') audio.miss();
    emit(7, {
      x: d.x, y: TABLE_Y - 4, j: 8,
      vx0: -40, vx1: 40, vy0: -50, vy1: -8,
      life: 0.38, r0: 1, r1: 2.4, g: 380
    });
  }

  function beginOverflow(x) {
    if (G.mode !== 'play' || G.why) return;
    G.why = 'over';
    G.overflow = 1;
    G.magFlash = 0.7;
    G.shake = 14;
    G.fill = G.need;
    G.full = true;
    audio.overflow();
    toast('溢了', true);
    setHint('水漫过了刻度', 'warn');
    emit(22, {
      x: x || G.cup.x, y: MOUTH_Y, j: 18,
      vx0: -140, vx1: 140, vy0: -180, vy1: 20,
      life: 0.7, r0: 1.6, r1: 4.2, mag: true, g: 520
    });
    G.lock = 0.9;
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    if (why === 'over') {
      showOverlay(
        'lose',
        '溢了',
        more
          ? '水漫过了刻度。满线之后要把杯子挪开。<br />还剩 ' + G.lives + ' 次。'
          : '水漫过了刻度。十管未完。',
        more ? '再试本管' : '再来一局',
        'OVERFLOW'
      );
    } else {
      audio.under();
      showOverlay(
        'lose',
        '未满',
        more
          ? '滴完了还没到线。该接的时候要对准。<br />还剩 ' + G.lives + ' 次。'
          : '滴完了还没到线。十管未完。',
        more ? '再试本管' : '再来一局',
        'SHORT'
      );
    }
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.85;
    G.goldFlash = 0.8;
    audio.clear();
    toast('满到线了', false, true);
    emit(16, {
      x: G.cup.x, y: MOUTH_Y + 40, j: 20,
      vx0: -60, vx1: 60, vy0: -80, vy1: -10,
      life: 0.7, r0: 1.2, r1: 3, gold: true, g: 200
    });
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '滴满',
        '十管皆满，一滴不溢。',
        '再接一巡',
        'FULL LINE'
      );
      setHint('十管皆满', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 1.05;
  }

  function overlayAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startRun();
      return;
    }
    if (G.mode === 'win') {
      startRun();
      return;
    }
    if (G.mode === 'fail') {
      if (G.lives > 0) startStage(G.stage, true);
      else startRun();
    }
  }

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const x = (cssX / Math.max(1, rect.width)) * W;
    return (x - ox) / scale;
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
    for (let i = 0; i < 36; i++) {
      motes.push({
        x: rand(20, VW - 20),
        y: rand(40, VH - 40),
        r: rand(0.6, 1.8),
        a: rand(0.04, 0.16),
        p: rand(0, TAU),
        s: rand(6, 18)
      });
    }
  }

  function updateCup(dt, beats) {
    const b = cupBounds();
    const playing = G.mode === 'play' || G.mode === 'title';
    if (!playing) {
      G.cup.vx *= Math.exp(-dt * 6);
      G.cup.x = clamp(G.cup.x + G.cup.vx * dt, b.lo, b.hi);
      G.slosh = lerp(G.slosh, -G.cup.vx * 0.01, 1 - Math.exp(-8 * dt));
      return;
    }
    const usePtr = pointer.down || pointer.hover;
    if (usePtr) {
      const tx = clamp(pointer.x, b.lo, b.hi);
      const nx = lerp(G.cup.x, tx, 1 - Math.exp(-16 * dt));
      G.cup.vx = (nx - G.cup.x) / Math.max(dt, 0.001);
      G.cup.x = nx;
    } else {
      let ax = 0;
      if (keys.l) ax -= CUP_ACC;
      if (keys.r) ax += CUP_ACC;
      G.cup.vx += ax * dt;
      if (!keys.l && !keys.r) G.cup.vx *= Math.exp(-dt * CUP_FRIC);
      G.cup.vx = clamp(G.cup.vx, -CUP_MAX, CUP_MAX);
      G.cup.x += G.cup.vx * dt;
    }
    if (G.cup.x < b.lo) {
      G.cup.x = b.lo;
      G.cup.vx *= 0.2;
    } else if (G.cup.x > b.hi) {
      G.cup.x = b.hi;
      G.cup.vx *= 0.2;
    }
    G.slosh = lerp(G.slosh, -G.cup.vx * 0.012, 1 - Math.exp(-10 * dt));
    G.slosh = clamp(G.slosh, -18, 18);
  }

  function growAt(si, beats) {
    let best = 9;
    for (let i = 0; i < G.pat.length; i++) {
      if (G.spawned[i]) continue;
      if (G.pat[i][1] !== si) continue;
      const spawnBeat = G.pat[i][0] + COUNT_IN;
      const until = spawnBeat - beats;
      if (until >= -0.02 && until < best) best = until;
    }
    if (best > 1.02) return 0;
    if (best < 0) return 1;
    return clamp(1 - best, 0, 1);
  }

  function updateDrops(dt, beats, prevBeats) {
    for (let i = 0; i < G.pat.length; i++) {
      if (G.spawned[i]) continue;
      const spawnBeat = G.pat[i][0] + COUNT_IN;
      if (prevBeats < spawnBeat && beats >= spawnBeat) {
        G.spawned[i] = true;
        spawnDrop(G.pat[i][1], beats);
      }
    }

    const half = innerHalf();
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      if (!d.alive) {
        G.drops.splice(i, 1);
        continue;
      }
      const py = d.y;
      d.y += d.vy * dt;
      if (py <= MOUTH_Y + 16 && d.y >= MOUTH_Y - 10) {
        if (Math.abs(d.x - G.cup.x) < half + d.r * 0.35) {
          catchDrop(d);
          G.drops.splice(i, 1);
          continue;
        }
      }
      if (d.y > TABLE_Y - 8) {
        missDrop(d);
        G.drops.splice(i, 1);
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.8);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lineGlow = Math.max(0, G.lineGlow - dt * 1.1);
    G.beatPulse = Math.max(0, G.beatPulse - dt * 3.2);
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
      if (rings[i].t > 0.55) rings.splice(i, 1);
    }
    if (G.overflow > 0) {
      G.overflow = Math.max(0, G.overflow - dt * 0.85);
      if (Math.random() < dt * 18) {
        emit(2, {
          x: G.cup.x + rand(-G.cup.w * 0.3, G.cup.w * 0.3),
          y: MOUTH_Y - 2, j: 6,
          vx0: -50, vx1: 50, vy0: -80, vy1: -10,
          life: 0.4, r0: 1.2, r1: 2.6, mag: true, g: 360
        });
      }
    }
  }

  function maybeTick(beats, prevBeats) {
    const b = Math.floor(beats);
    const pb = Math.floor(prevBeats);
    if (b !== pb && b >= 0) {
      G.beatPulse = 1;
      G.lastBeat = b;
      if (G.mode === 'play') {
        const inCount = beats < COUNT_IN;
        audio.tick(inCount || b % 2 === 0);
      }
    }
  }

  function updateTitle(dt) {
    const st = STAGES[0];
    if (!G.pat.length) applyStage(st, true);
    G.need = 3;
    const prev = G.song;
    G.song += dt;
    const beats = G.song / G.beatDur;
    const prevBeats = prev / G.beatDur;
    maybeTick(beats, prevBeats);
    updateDrops(dt, beats, prevBeats);
    const target = incomingX(beats);
    if (G.demoFill >= G.need) {
      const dodge = target > VW * 0.5 ? 118 : 362;
      G.cup.x = lerp(G.cup.x, dodge, 1 - Math.exp(-4 * dt));
    } else {
      G.cup.x = lerp(G.cup.x, clamp(target, 90, 390), 1 - Math.exp(-3.2 * dt));
    }
    G.cup.vx = 0;
    if (G.resolved >= G.pat.length && G.drops.length === 0) {
      G.song = 0;
      G.demoFill = 0;
      G.resolved = 0;
      for (let i = 0; i < G.spawned.length; i++) G.spawned[i] = false;
    }
    if (G.demoFill > G.need) G.demoFill = G.need;
  }

  function incomingX(beats) {
    let best = 9;
    let x = VW * 0.5;
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      if (!d.alive) continue;
      const tleft = (MOUTH_Y - d.y) / Math.max(40, d.vy);
      if (tleft < best) {
        best = tleft;
        x = d.x;
      }
    }
    if (best < 8) return x;
    for (let i = 0; i < G.pat.length; i++) {
      if (G.spawned[i]) continue;
      const sb = G.pat[i][0] + COUNT_IN;
      const until = (sb - beats) * G.beatDur;
      if (until >= 0 && until < best) {
        best = until;
        x = spoutX(G.pat[i][1], sb);
      }
    }
    return x;
  }

  function updatePlay(dt) {
    const prev = G.song;
    G.song += dt;
    const beats = G.song / G.beatDur;
    const prevBeats = prev / G.beatDur;
    maybeTick(beats, prevBeats);
    updateCup(dt, beats);
    if (G.lock <= 0 && !G.why) updateDrops(dt, beats, prevBeats);

    if (G.why === 'over') {
      if (G.lock <= 0) failStage('over');
      return;
    }

    if (!G.why && G.resolved >= G.pat.length && G.drops.length === 0) {
      G.settle += dt;
      if (G.settle > 0.55) {
        if (G.fill >= G.need) clearStage();
        else failStage('under');
      }
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      G.settle -= dt;
      updateCup(dt, 0);
      if (G.settle <= 0) startStage(G.stage + 1, false);
    } else {
      updateCup(dt, 0);
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

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createRadialGradient(sx(90), sy(40), 10, sx(90), sy(40), 280 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.16)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(80), 10, sx(400), sy(80), 260 * scale);
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
    vg.addColorStop(0.45, 'rgba(8, 6, 20, 0.2)');
    vg.addColorStop(1, 'rgba(4, 8, 22, 0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    for (let y = 56; y < MOUTH_Y; y += 48) {
      ctx.beginPath();
      ctx.moveTo(sx(28), sy(y));
      ctx.lineTo(sx(VW - 28), sy(y));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

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

  function drawShafts(beats) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.nSpouts; i++) {
      const x = sx(spoutX(i, beats));
      const grow = growAt(i, beats);
      const a = 0.04 + grow * 0.1 + G.beatPulse * 0.05;
      const grd = ctx.createLinearGradient(x, sy(TIP_Y), x, sy(MOUTH_Y));
      grd.addColorStop(0, 'rgba(0, 240, 255,' + a + ')');
      grd.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = grd;
      const w = (18 + grow * 10) * scale;
      ctx.fillRect(x - w * 0.5, sy(TIP_Y), w, (MOUTH_Y - TIP_Y) * scale);
    }
    ctx.restore();
  }

  function drawTable() {
    const y = sy(TABLE_Y);
    const g = ctx.createLinearGradient(sx(0), y - 18 * scale, sx(0), sy(VH));
    g.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
    g.addColorStop(0.08, '#12081c');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), y - 8 * scale, VW * scale, sy(VH) - (y - 8 * scale));

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(16), sy(TABLE_Y));
    ctx.lineTo(sx(VW - 16), sy(TABLE_Y));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.12)';
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(40), sy(TABLE_Y + 10));
    ctx.lineTo(sx(VW - 40), sy(TABLE_Y + 10));
    ctx.stroke();
  }

  function drawPipes(beats) {
    const y = PIPE_Y;
    ctx.save();
    const pulse = 0.22 + G.beatPulse * 0.35;
    ctx.strokeStyle = 'rgba(0, 240, 255,' + (0.18 + pulse * 0.25) + ')';
    ctx.lineWidth = 14 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(36), sy(y));
    ctx.lineTo(sx(VW - 36), sy(y));
    ctx.stroke();

    ctx.strokeStyle = '#1a1230';
    ctx.lineWidth = 9 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(36), sy(y));
    ctx.lineTo(sx(VW - 36), sy(y));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(36), sy(y - 4.2));
    ctx.lineTo(sx(VW - 36), sy(y - 4.2));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.45)';
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(36), sy(y + 4.5));
    ctx.lineTo(sx(VW - 36), sy(y + 4.5));
    ctx.stroke();

    for (let i = 0; i < G.nSpouts; i++) {
      const x = spoutX(i, beats);
      drawSpout(x, beats, i);
    }

    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(sx(36), sy(y), 5.5 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 61, 184, 0.8)';
    ctx.beginPath();
    ctx.arc(sx(VW - 36), sy(y), 5.5 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSpout(x, beats, i) {
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 5 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(PIPE_Y));
    ctx.lineTo(sx(x), sy(TIP_Y - 6));
    ctx.stroke();

    ctx.fillStyle = '#14102a';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 1.4 * scale;
    roundRect(ctx, sx(x - 9), sy(TIP_Y - 16), 18 * scale, 16 * scale, 4 * scale);
    ctx.fill();
    ctx.stroke();

    const grow = growAt(i, beats);
    const pulse = 0.35 + G.beatPulse * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(0, 240, 255,' + (0.25 + pulse * 0.4) + ')';
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.arc(sx(x), sy(TIP_Y - 8), (10 + G.beatPulse * 6) * scale, 0, TAU);
    ctx.stroke();
    ctx.restore();

    if (grow > 0.04) {
      const r = (2.2 + grow * 5.2) * scale;
      const gy = sy(TIP_Y - 2 + grow * 8);
      const grd = ctx.createRadialGradient(sx(x) - r * 0.25, gy - r * 0.2, r * 0.1, sx(x), gy, r);
      grd.addColorStop(0, 'rgba(230, 255, 255, 0.95)');
      grd.addColorStop(0.45, 'rgba(0, 240, 255, 0.9)');
      grd.addColorStop(1, 'rgba(255, 61, 184, 0.55)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(sx(x), gy, r, 0, TAU);
      ctx.fill();
    }
  }

  function drawGhosts() {
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      if (!d.alive) continue;
      const over = Math.abs(d.x - G.cup.x) < innerHalf() + 4;
      const danger = G.full || (G.mode === 'play' && G.fill >= G.need);
      let col;
      if (danger && over) col = 'rgba(255, 61, 184, 0.55)';
      else if (over) col = 'rgba(0, 240, 255, 0.4)';
      else col = 'rgba(139, 144, 184, 0.22)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.2 * scale;
      ctx.setLineDash([4 * scale, 5 * scale]);
      ctx.beginPath();
      ctx.moveTo(sx(d.x), sy(d.y + 8));
      ctx.lineTo(sx(d.x), sy(MOUTH_Y));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(sx(d.x), sy(MOUTH_Y + 3), 9 * scale, 3.2 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawDrops() {
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      if (!d.alive) continue;
      const x = sx(d.x);
      const y = sy(d.y);
      const r = d.r * scale;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(x, y, r * 2.4, 0, TAU);
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(x, y - r * 1.55);
      ctx.bezierCurveTo(x + r, y - r * 0.2, x + r * 0.9, y + r, x, y + r);
      ctx.bezierCurveTo(x - r * 0.9, y + r, x - r, y - r * 0.2, x, y - r * 1.55);
      const grd = ctx.createRadialGradient(x - r * 0.3, y - r * 0.2, r * 0.1, x, y, r);
      grd.addColorStop(0, '#e7ffff');
      grd.addColorStop(0.35, '#00f0ff');
      grd.addColorStop(1, '#ff3db8');
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(x - r * 0.28, y - r * 0.15, r * 0.22, r * 0.14, -0.4, 0, TAU);
      ctx.fill();
    }
  }

  function glassPath(c, x, mouth, h, topH, botH) {
    const bottom = mouth + h;
    const r = 10 * scale;
    c.beginPath();
    c.moveTo(x - topH, mouth);
    c.lineTo(x + topH, mouth);
    c.lineTo(x + botH, bottom - r);
    c.quadraticCurveTo(x + botH, bottom, x + botH - r, bottom);
    c.lineTo(x - botH + r, bottom);
    c.quadraticCurveTo(x - botH, bottom, x - botH, bottom - r);
    c.closePath();
  }

  function drawCup(beats) {
    const xw = G.cup.x;
    const x = sx(xw);
    const mouth = sy(MOUTH_Y);
    const h = GLASS_H * scale;
    const topH = G.cup.w * 0.5 * scale;
    const botH = G.cup.w * 0.34 * scale;
    const tilt = clamp(G.slosh * 0.012, -0.12, 0.12);
    const fillAmt = G.mode === 'title' ? G.demoFill : G.fill;
    const need = Math.max(1, G.need);
    const innerTop = MOUTH_Y + 12;
    const innerBot = MOUTH_Y + GLASS_H - 16;
    const targetH = (innerBot - innerTop) * 0.74;
    const lineYw = innerBot - targetH;
    const puddle = 6;
    const hasWater = fillAmt > 0 || G.overflow > 0;
    const lvl = hasWater
      ? puddle + (targetH - puddle) * clamp(fillAmt / need, 0, 1.12)
      : 0;
    let surfaceYw = innerBot - lvl;
    if (G.overflow > 0) surfaceYw = Math.min(surfaceYw, MOUTH_Y + 4);

    ctx.save();
    ctx.translate(x, sy(TABLE_Y));
    ctx.rotate(tilt);
    ctx.translate(-x, -sy(TABLE_Y));

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, sy(TABLE_Y + 6), topH * 0.95, 7 * scale, 0, 0, TAU);
    ctx.fill();

    glassPath(ctx, x, mouth, h, topH, botH);
    ctx.fillStyle = 'rgba(10, 16, 36, 0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    ctx.save();
    glassPath(ctx, x, mouth, h, topH * 0.92, botH * 0.92);
    ctx.clip();

    if (!hasWater) {
      ctx.restore();
    } else {

    const surf = sy(surfaceYw + Math.sin(G.clock * 7 + xw * 0.04) * 1.6);
    const lg = ctx.createLinearGradient(x, surf, x, sy(innerBot + 8));
    if (G.full && G.mode === 'play') {
      lg.addColorStop(0, 'rgba(255, 227, 107, 0.75)');
      lg.addColorStop(0.25, 'rgba(0, 240, 255, 0.7)');
      lg.addColorStop(1, 'rgba(255, 61, 184, 0.38)');
    } else {
      lg.addColorStop(0, 'rgba(180, 255, 255, 0.72)');
      lg.addColorStop(0.35, 'rgba(0, 240, 255, 0.62)');
      lg.addColorStop(1, 'rgba(80, 40, 120, 0.45)');
    }
    ctx.fillStyle = lg;
    ctx.fillRect(x - topH, surf, topH * 2, sy(innerBot + 20) - surf);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 1.2 * scale;
    for (let i = 0; i < 3; i++) {
      const yy = surf + (8 + i * 16) * scale + Math.sin(G.clock * 2 + i) * 3 * scale;
      ctx.beginPath();
      ctx.moveTo(x - topH * 0.5, yy);
      ctx.quadraticCurveTo(x, yy + 4 * scale, x + topH * 0.5, yy);
      ctx.stroke();
    }
    ctx.restore();

    const waveAmp = 2.4 * scale + Math.abs(G.slosh) * 0.12 * scale;
    ctx.beginPath();
    ctx.moveTo(x - topH, surf);
    for (let i = 0; i <= 12; i++) {
      const px = x - topH + (topH * 2 * i) / 12;
      const py = surf + Math.sin(G.clock * 6.5 + i * 0.7 + G.slosh * 0.08) * waveAmp;
      ctx.lineTo(px, py);
    }
    ctx.strokeStyle = G.full && G.mode === 'play'
      ? 'rgba(255, 227, 107, 0.85)'
      : 'rgba(200, 255, 255, 0.75)';
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();

    if (fillAmt > 0) {
      for (let i = 0; i < 5; i++) {
        const bx = x + Math.sin(G.clock * 1.3 + i * 1.7) * topH * 0.35;
        const by = lerp(sy(innerBot - 8), surf + 10 * scale, (Math.sin(G.clock * 0.9 + i) + 1) * 0.5);
        if (by > surf + 4 * scale) {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          ctx.beginPath();
          ctx.arc(bx, by, (1.1 + (i % 2) * 0.5) * scale, 0, TAU);
          ctx.fill();
        }
      }
    }
    ctx.restore();
    }

    const ly = sy(lineYw);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = G.full ? 0.95 : 0.45 + G.lineGlow * 0.5;
    ctx.strokeStyle = G.full
      ? 'rgba(255, 227, 107,' + glow + ')'
      : 'rgba(255, 61, 184,' + (0.55 + G.lineGlow * 0.4) + ')';
    ctx.lineWidth = (G.full ? 2.4 : 1.7) * scale;
    ctx.setLineDash(G.full ? [] : [6 * scale, 5 * scale]);
    ctx.beginPath();
    ctx.moveTo(x - topH * 0.82, ly);
    ctx.lineTo(x + topH * 0.82, ly);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = G.full ? 'rgba(255, 227, 107, 0.85)' : 'rgba(255, 61, 184, 0.7)';
    ctx.font = '600 ' + Math.max(9, 10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    const labelRight = xw < VW - 88;
    ctx.textAlign = labelRight ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('刻度', labelRight ? x + topH * 0.86 : x - topH * 0.86, ly);

    glassPath(ctx, x, mouth, h, topH, botH);
    ctx.strokeStyle = G.full
      ? 'rgba(255, 227, 107, 0.85)'
      : 'rgba(0, 240, 255, 0.8)';
    ctx.lineWidth = 2.1 * scale;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.moveTo(x - topH * 0.62, mouth + 16 * scale);
    ctx.lineTo(x - botH * 0.45, mouth + h - 22 * scale);
    ctx.stroke();

    ctx.fillStyle = 'rgba(12, 8, 24, 0.7)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.1 * scale;
    roundRect(ctx, x - 14 * scale, sy(TABLE_Y - 6), 28 * scale, 7 * scale, 3 * scale);
    ctx.fill();
    ctx.stroke();

    if (G.full && G.mode === 'play') {
      ctx.fillStyle = 'rgba(255, 227, 107, 0.9)';
      ctx.font = '700 ' + Math.max(11, 13 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('躲开', x, mouth - 16 * scale);
    }

    ctx.restore();
  }

  function drawBeatStrip(beats) {
    const n = 4;
    const y = sy(VH - 36);
    const gap = 22 * scale;
    const x0 = sx(VW * 0.5) - gap * 1.5;
    const phase = ((beats % 1) + 1) % 1;
    const cur = Math.floor(beats) % n;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * gap;
      const on = i === cur && G.mode !== 'fail';
      ctx.beginPath();
      ctx.arc(x, y, (on ? 5.2 : 3.4) * scale, 0, TAU);
      ctx.fillStyle = on
        ? (G.full ? 'rgba(255, 227, 107, 0.95)' : 'rgba(0, 240, 255, 0.9)')
        : 'rgba(139, 144, 184, 0.28)';
      ctx.fill();
      if (on) {
        ctx.strokeStyle = 'rgba(0, 240, 255,' + (0.35 + (1 - phase) * 0.4) + ')';
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.arc(x, y, (8 + (1 - phase) * 6) * scale, 0, TAU);
        ctx.stroke();
      }
    }

    if (G.mode === 'play' && beats < COUNT_IN) {
      ctx.fillStyle = 'rgba(246, 243, 255, 0.7)';
      ctx.font = '600 ' + Math.max(11, 12 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const left = Math.max(1, Math.ceil(COUNT_IN - beats));
      ctx.fillText('预备 ' + left, sx(VW * 0.5), sy(VH - 58));
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
      const k = r.t / 0.55;
      ctx.strokeStyle = r.mag
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
    if (G.beatPulse > 0.4 && G.mode === 'play') {
      ctx.strokeStyle = 'rgba(0, 240, 255,' + ((G.beatPulse - 0.4) * 0.18) + ')';
      ctx.lineWidth = 8 * scale;
      ctx.strokeRect(sx(8), sy(8), (VW - 16) * scale, (VH - 16) * scale);
    }
  }

  function draw() {
    const beats = G.song / Math.max(0.05, G.beatDur);
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawBg();
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawTable();
    drawShafts(beats);
    drawPipes(beats);
    drawGhosts();
    drawCup(beats);
    drawDrops();
    drawParticles();
    drawBeatStrip(beats);
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
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === ' ' || k === 'Spacebar')) {
      e.preventDefault();
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
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      if (!overlay.classList.contains('hidden')) {
        e.preventDefault();
        overlayAction();
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    pointer.x = pointerWorldX(e);
    canvas.classList.add('drag');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    pointer.x = pointerWorldX(e);
    if (e.pointerType === 'mouse') pointer.hover = true;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove('drag');
    if (e.pointerType !== 'mouse') pointer.hover = false;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') pointer.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = false;
    keys.r = false;
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
