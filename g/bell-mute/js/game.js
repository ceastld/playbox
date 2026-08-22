'use strict';

(function () {
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-bell-mute-mute';
  const KEEP_HZ = 392;

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const INK = { r: 246, g: 243, b: 255 };
  const FAR_HZ = [261.63, 293.66, 220, 523.25, 587.33, 196, 659.26, 174.61];
  const NEAR_HZ = [369.99, 415.3, 349.23, 440, 466.16, 329.63, 493.88, 311.13];

  const STAGES = [
    {
      name: '初铃', sub: 'FIRST', n: 3, keep: 1, time: 38, period: 1.18,
      glow: 1, dim: 0, drift: 0, amp: 0.24, tight: 0, arc: 0, pitchTight: 0,
      hint: '按掉左右乱晃的铃。中间那只跟金拍一起响',
      toast: '乱响按掉 · 同拍留下'
    },
    {
      name: '齐拍', sub: 'BEAT', n: 4, time: 34, period: 1.08,
      glow: 0.68, dim: 0, drift: 0, amp: 0.22, tight: 0.12, arc: 0, pitchTight: 0.08,
      hint: '金拍一闪，看哪只铃一起亮',
      toast: '跟金拍同闪的留下'
    },
    {
      name: '听心', sub: 'EAR', n: 4, time: 32, period: 1.02,
      glow: 0.26, dim: 0, drift: 0, amp: 0.2, tight: 0.22, arc: 0, pitchTight: 0.22,
      hint: '光淡了。听哪只跟金拍同音',
      toast: '同音同拍 · 其余按掉'
    },
    {
      name: '五檐', sub: 'FIVE', n: 5, time: 32, period: 0.96,
      glow: 0.12, dim: 0, drift: 0, amp: 0.19, tight: 0.3, arc: 0, pitchTight: 0.28,
      hint: '五只铃。先按掉明显错拍的',
      toast: '五铃 · 错拍先按'
    },
    {
      name: '近相', sub: 'NEAR', n: 5, time: 30, period: 0.92,
      glow: 0.05, dim: 0.1, drift: 0, amp: 0.18, tight: 0.62, arc: 0, pitchTight: 0.48,
      hint: '有的铃几乎同拍。盯金拍闪光的瞬间',
      toast: '近相会骗人 · 盯闪光'
    },
    {
      name: '密铃', sub: 'DENSE', n: 6, time: 30, period: 0.88,
      glow: 0, dim: 0.12, drift: 0, amp: 0.17, tight: 0.42, arc: 0, pitchTight: 0.38,
      hint: '六只挤在一檐。凭闪光和音高',
      toast: '密铃 · 一只一只按'
    },
    {
      name: '游相', sub: 'DRIFT', n: 6, time: 32, period: 0.9,
      glow: 0, dim: 0.14, drift: 0.24, amp: 0.18, tight: 0.34, arc: 0, pitchTight: 0.42,
      hint: '错拍会慢慢游走，偶尔看起来同拍',
      toast: '游相会靠近 · 留下一直同拍的'
    },
    {
      name: '环廊', sub: 'ARC', n: 7, time: 30, period: 0.84,
      glow: 0, dim: 0.18, drift: 0.18, amp: 0.16, tight: 0.5, arc: 1, pitchTight: 0.52,
      hint: '铃挂成弧。金拍在正中，对闪光',
      toast: '环廊 · 对上金拍再按'
    },
    {
      name: '暗檐', sub: 'DARK', n: 7, time: 28, period: 0.8,
      glow: 0, dim: 0.56, drift: 0.2, amp: 0.15, tight: 0.7, arc: 1, pitchTight: 0.64,
      hint: '檐很暗。听同音，看闪光',
      toast: '暗檐 · 用耳朵'
    },
    {
      name: '终响', sub: 'FINAL', n: 8, time: 28, period: 0.74,
      glow: 0, dim: 0.4, drift: 0.28, amp: 0.15, tight: 0.78, arc: 1, pitchTight: 0.76,
      hint: '八铃终响。只留一直跟着金拍的那只',
      toast: '终响 · 只留一只'
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
  const stageLabel = document.getElementById('stage-label');
  const noiseLabel = document.getElementById('noise-label');
  const timeLabel = document.getElementById('time-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');

  const view = { w: 1, h: 1, dpr: 1 };
  const ptr = { down: false, x: 0, y: 0 };
  const particles = [];
  const motes = [];
  const rings = [];

  const G = {
    mode: 'title',
    stage: 0,
    lives: LIVES,
    time: 0,
    t: 0,
    bells: [],
    sel: 0,
    keep: 1,
    need: 2,
    did: 0,
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: '0,240,255',
    toastT: 0,
    paused: false,
    clearT: 0,
    solitude: 0,
    teach: true,
    hud: '',
    spec: STAGES[0],
    beamY: 40,
    gongX: 0,
    gongY: 0,
    gongR: 18,
    beatFlash: 0,
    beatS: 0,
    prevBeatS: 0,
    quiet: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function ease(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgb(c, a) {
    return a == null
      ? 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')'
      : 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
  }
  function mix(a, b, t) {
    return {
      r: (lerp(a.r, b.r, t) + 0.5) | 0,
      g: (lerp(a.g, b.g, t) + 0.5) | 0,
      b: (lerp(a.b, b.b, t) + 0.5) | 0
    };
  }
  function hzColor(hz) {
    if (Math.abs(hz - KEEP_HZ) < 8) return GOLD;
    if (hz < KEEP_HZ) return MAG;
    return CYN;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure: function () {
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
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, from, to) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(from || 700, t);
      if (to) f.frequency.exponentialRampToValueAtTime(Math.max(60, to), t + dur);
      f.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    ding: function (freq, vol, dur) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o1 = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      o1.type = 'sine';
      o2.type = 'triangle';
      o1.frequency.setValueAtTime(freq, t);
      o2.frequency.setValueAtTime(freq * 2.01, t);
      o1.frequency.exponentialRampToValueAtTime(freq * 0.985, t + dur);
      o2.frequency.exponentialRampToValueAtTime(freq * 1.96, t + dur);
      f.type = 'lowpass';
      f.frequency.setValueAtTime(freq * 7, t);
      f.frequency.exponentialRampToValueAtTime(freq * 2.2, t + dur);
      f.Q.value = 0.7;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.01);
      g.gain.exponentialRampToValueAtTime(vol * 0.42, t + 0.09);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o1.connect(g);
      o2.connect(g);
      g.connect(f);
      f.connect(this.master);
      o1.start(t);
      o2.start(t);
      o1.stop(t + dur + 0.02);
      o2.stop(t + dur + 0.02);
    },
    pulse: function (kind) {
      this.ensure();
      if (kind === 'select') {
        this.beep(640, 0.04, 'sine', 0.018);
      } else if (kind === 'mute') {
        this.beep(210, 0.12, 'triangle', 0.045, 90);
        this.noise(0.1, 0.04, 900, 180);
      } else if (kind === 'deny') {
        this.beep(140, 0.1, 'square', 0.035, 70);
      } else if (kind === 'wrong') {
        this.beep(196, 0.32, 'sawtooth', 0.08, 70);
        this.beep(98, 0.45, 'square', 0.05, 40);
        this.noise(0.18, 0.07, 500, 80);
      } else if (kind === 'gong') {
        this.ding(KEEP_HZ * 0.5, 0.045, 0.55);
      } else if (kind === 'keep') {
        this.ding(KEEP_HZ, 0.11, 1.15);
        this.ding(KEEP_HZ * 2, 0.04, 0.8);
      } else if (kind === 'win') {
        this.ding(392, 0.1, 0.5);
        this.ding(523, 0.08, 0.7);
        this.ding(784, 0.06, 1.0);
      } else if (kind === 'lose') {
        this.beep(180, 0.55, 'sawtooth', 0.09, 55);
        this.beep(90, 0.75, 'triangle', 0.05, 36);
      } else if (kind === 'start') {
        this.ding(392, 0.07, 0.35);
        this.ding(588, 0.05, 0.5);
      } else if (kind === 'tick') {
        this.beep(880, 0.045, 'square', 0.028, 440);
      } else if (kind === 'clear') {
        this.ding(523, 0.08, 0.45);
        this.ding(784, 0.06, 0.7);
      } else if (kind === 'life') {
        this.beep(170, 0.22, 'sawtooth', 0.06, 64);
        this.noise(0.14, 0.055, 380, 80);
      }
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 170) particles.shift();
      particles.push({
        x: spec.x + (Math.random() - 0.5) * spec.j,
        y: spec.y + (Math.random() - 0.5) * spec.j,
        vx: lerp(spec.vx0, spec.vx1, Math.random()),
        vy: lerp(spec.vy0, spec.vy1, Math.random()),
        life: spec.life * (0.65 + Math.random() * 0.5),
        max: spec.life,
        r: lerp(spec.r0, spec.r1, Math.random()),
        col: spec.col
      });
    }
  }

  function ringAt(x, y, col, mag) {
    if (rings.length > 22) rings.shift();
    rings.push({ x: x, y: y, r: 8, max: mag ? 92 : 56, t: 1, col: col });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    G.toastT = 2.35;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 52; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.2 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.1 + 0.025
      });
    }
  }

  function decoyPhase(s, decoyIndex, decoyCount) {
    const t = s.tight || 0;
    const minP = lerp(0.28, 0.055, t);
    const maxP = lerp(0.78, 0.16, t);
    const u = decoyCount <= 1 ? 0.5 : decoyIndex / (decoyCount - 1);
    const mag = lerp(minP, maxP, u);
    return decoyIndex % 2 === 0 ? mag * TAU : -mag * TAU;
  }

  function pitchFor(i, keep, s) {
    if (i === keep) return KEEP_HZ;
    const t = s.pitchTight || 0;
    const pool = t > 0.55 ? NEAR_HZ : t > 0.18 ? NEAR_HZ.concat(FAR_HZ) : FAR_HZ;
    return pool[(i * 3 + keep * 5) % pool.length];
  }

  function extrasLeft() {
    let n = 0;
    for (let i = 0; i < G.bells.length; i++) {
      const b = G.bells[i];
      if (!b.keep && !b.muted) n += 1;
    }
    return n;
  }

  function ringingCount() {
    let n = 0;
    for (let i = 0; i < G.bells.length; i++) {
      if (!G.bells[i].muted) n += 1;
    }
    return n;
  }

  function layout() {
    const w = view.w;
    const h = view.h;
    const n = G.bells.length;
    if (!n) return;
    const beamY = h * 0.148;
    const pad = w < 540 ? 0.18 : 0.12;
    const span0 = w * pad;
    const span1 = w * (1 - pad);
    const r = clamp(Math.min((span1 - span0) / n * 0.32, h * 0.088), 18, 44);
    G.beamY = beamY;
    G.gongX = w * 0.5;
    G.gongY = h * 0.092;
    G.gongR = clamp(h * 0.038, 14, 26);
    const arc = G.spec && G.spec.arc;
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      let x = lerp(span0, span1, u);
      let rope = h * (0.30 + 0.046 * Math.sin(i * 2.15 + 0.5));
      if (arc) {
        const a = (u - 0.5) * 1.15;
        x = w * 0.5 + Math.sin(a) * (w * 0.39);
        rope = h * 0.26 + (1 - Math.cos(a)) * h * 0.15;
      }
      const b = G.bells[i];
      b.anchorX = x;
      b.rope = rope;
      b.r = G.spec && G.spec.glow < 0.25 ? r : r * (0.94 + 0.06 * Math.sin(i * 2.8));
      poseBell(b);
    }
  }

  function poseBell(b) {
    const damp = b.muted ? 1 - ease(Math.min(1, b.muteT)) : 1;
    const wave = Math.sin(TAU * G.t / b.period + b.phase);
    const ampScale = view.w < 540 ? 0.62 : 1;
    b.ang = b.amp * ampScale * wave * damp;
    b.px = b.anchorX + Math.sin(b.ang) * b.rope;
    b.py = G.beamY + Math.cos(b.ang) * b.rope;
    b.wave = wave;
  }

  function makeBells(spec, keep) {
    const n = spec.n;
    const bells = [];
    let decoy = 0;
    const decoyCount = n - 1;
    for (let i = 0; i < n; i++) {
      const isKeep = i === keep;
      const phase = isKeep ? 0 : decoyPhase(spec, decoy, decoyCount);
      if (!isKeep) decoy += 1;
      bells.push({
        i: i,
        keep: isKeep,
        muted: false,
        muteT: 0,
        freq: pitchFor(i, keep, spec),
        phase: phase,
        period: spec.period,
        drift: isKeep ? 0 : (spec.drift || 0) * (0.65 + (i % 3) * 0.22) * (i % 2 ? 1 : -1),
        amp: spec.amp,
        prevS: Math.sin(phase),
        flash: 0,
        press: 0,
        hover: 0,
        anchorX: 0,
        rope: 0,
        r: 24,
        ang: 0,
        px: 0,
        py: 0,
        wave: 0
      });
    }
    return bells;
  }

  function loadStage(index) {
    const s = STAGES[index];
    G.stage = index;
    G.spec = s;
    G.keep = s.keep != null ? s.keep : ((Math.random() * s.n) | 0);
    G.bells = makeBells(s, G.keep);
    G.need = s.n - 1;
    G.did = 0;
    G.sel = index === 0 ? 0 : G.keep;
    G.time = s.time;
    G.lock = 0.32;
    G.clearT = 0;
    G.solitude = 0;
    G.teach = index === 0;
    G.beatS = 0;
    G.beatFlash = 0;
    G.quiet = 0;
    ptr.down = false;
    layout();
    syncStrikes();
    toast(s.toast);
    hintEl.textContent = s.hint;
    hintEl.classList.remove('hot', 'warn');
    syncHud(true);
  }

  function syncStrikes() {
    const period = (G.spec && G.spec.period) || 1.1;
    G.prevBeatS = Math.sin(TAU * G.t / period);
    for (let i = 0; i < G.bells.length; i++) {
      const b = G.bells[i];
      b.prevS = Math.sin(TAU * G.t / b.period + b.phase);
    }
  }

  function spawnTitleBells() {
    const s = {
      n: 5, period: 1.12, glow: 0.55, dim: 0.08, drift: 0.04,
      amp: 0.2, tight: 0.2, arc: 0, pitchTight: 0.1
    };
    G.spec = s;
    G.keep = 2;
    G.bells = makeBells(s, 2);
    G.need = 4;
    G.did = 0;
    G.sel = 2;
    G.teach = false;
    layout();
    syncStrikes();
  }

  function startRun() {
    G.mode = 'play';
    G.lives = LIVES;
    G.shake = 0;
    G.flash = 0;
    hideOverlay();
    loadStage(0);
    audio.pulse('start');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function showOverlay(kind) {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (kind === 'title') {
      ovKicker.textContent = 'MUTE';
      ovTitle.textContent = '止铃';
      ovLead.innerHTML = '檐下铃一起响。按掉乱拍的，<br />只留跟金拍同闪、同音的那一只。';
      ovOps.textContent = '点按止铃 · ←→ 选择 · 空格 / 1–8 · M 静音';
      ovBtn.textContent = '入檐';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'ONE';
      ovTitle.textContent = '一铃';
      ovLead.textContent = '十檐都只剩那一只同拍的铃。夜静了。';
      ovOps.textContent = '止尽 ' + STAGES.length + ' 檐 · 命余 ' + G.lives;
      ovBtn.textContent = '再止一次';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = 'NOISE';
      ovTitle.textContent = '乱鸣';
      ovLead.textContent = '金拍被按灭，或者喧铃没有止住。';
      ovOps.textContent = STAGES[G.stage].name + ' · 已止 ' + G.stage + ' 檐';
      ovBtn.textContent = '再来一局';
    }
  }

  function stageClear() {
    G.mode = 'clear';
    G.clearT = 0.95;
    G.lock = 1;
    audio.pulse('clear');
    G.flash = 0.28;
    G.flashCol = '255,227,107';
    hintEl.classList.add('hot');
    hintEl.classList.remove('warn');
    toast('一铃', 'gold');
    const k = G.bells[G.keep];
    if (k) {
      emit(22, {
        x: k.px, y: k.py, j: 28,
        vx0: -90, vx1: 90, vy0: -160, vy1: -20,
        life: 0.72, r0: 1.2, r1: 3.6, col: GOLD
      });
      ringAt(k.px, k.py, GOLD, true);
    }
  }

  function loseLife(reason) {
    G.lives -= 1;
    audio.pulse('life');
    G.flash = 0.36;
    G.flashCol = '255,61,184';
    G.shake = 8;
    if (G.lives <= 0) {
      G.mode = 'lose';
      showOverlay('lose');
      audio.pulse('lose');
      return;
    }
    loadStage(G.stage);
    toast(reason || '喧铃未止 · 命 -1', 'warn');
  }

  function beginSolitude() {
    G.solitude = 0.82;
    G.lock = 0.9;
    G.sel = G.keep;
    audio.pulse('keep');
    G.flash = 0.2;
    G.flashCol = '255,227,107';
    const k = G.bells[G.keep];
    if (k) ringAt(k.px, k.py, GOLD, true);
    toast('只剩同拍', 'gold');
  }

  function tryMute(id) {
    if (G.mode !== 'play' || G.lock > 0 || G.solitude > 0) return;
    if (id < 0 || id >= G.bells.length) return;
    const b = G.bells[id];
    if (b.muted) {
      audio.pulse('deny');
      b.press = 0.45;
      return;
    }
    G.teach = false;
    b.press = 1;
    if (b.keep) {
      audio.pulse('wrong');
      emit(16, {
        x: b.px, y: b.py, j: 18,
        vx0: -120, vx1: 120, vy0: -40, vy1: 80,
        life: 0.45, r0: 1.2, r1: 3.2, col: MAG
      });
      loseLife('同拍被按灭 · 命 -1');
      return;
    }
    b.muted = true;
    b.muteT = 0;
    G.did += 1;
    audio.pulse('mute');
    const col = hzColor(b.freq);
    emit(10, {
      x: b.px, y: b.py, j: 12,
      vx0: -40, vx1: 40, vy0: 20, vy1: 90,
      life: 0.4, r0: 1, r1: 2.6, col: col
    });
    ringAt(b.px, b.py, col, false);
    const left = extrasLeft();
    if (left === 0) beginSolitude();
    else toast('止 ' + G.did + '/' + G.need);
    syncHud(true);
  }

  function distSeg(x, y, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const l2 = dx * dx + dy * dy || 1;
    let t = ((x - x1) * dx + (y - y1) * dy) / l2;
    t = clamp(t, 0, 1);
    return hypot(x - (x1 + t * dx), y - (y1 + t * dy));
  }

  function hitBell(x, y) {
    let best = -1;
    let bestD = 1e9;
    for (let i = 0; i < G.bells.length; i++) {
      const b = G.bells[i];
      const dx = x - b.px;
      const dy = y - (b.py + b.r * 0.18);
      const hr = Math.max(b.r * 1.65, 30);
      const dBody = Math.sqrt(dx * dx + dy * dy);
      const dRope = distSeg(x, y, b.anchorX, G.beamY, b.px, b.py - b.r * 0.8);
      const d = Math.min(dBody, dRope * 1.8);
      if (d < hr && d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function eventPos(e) {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches && e.touches[0]
      ? e.touches[0]
      : e.changedTouches && e.changedTouches[0]
        ? e.changedTouches[0]
        : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  function onDown(e) {
    if (G.mode !== 'play') return;
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const p = eventPos(e);
    ptr.down = true;
    ptr.x = p.x;
    ptr.y = p.y;
    const id = hitBell(p.x, p.y);
    if (id >= 0) {
      if (G.sel !== id) G.sel = id;
      tryMute(id);
      if (e.pointerId != null && canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    }
    e.preventDefault();
  }

  function onMove(e) {
    const p = eventPos(e);
    ptr.x = p.x;
    ptr.y = p.y;
    if (G.mode === 'play' && !ptr.down) {
      const id = hitBell(p.x, p.y);
      if (id >= 0) G.sel = id;
    }
  }

  function onUp() {
    ptr.down = false;
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
      if (G.mode === 'play' || G.mode === 'clear') loadStage(G.stage);
      else startRun();
      e.preventDefault();
      return;
    }
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
      if (k === ' ' || k === 'Enter') {
        audio.ensure();
        startRun();
        e.preventDefault();
      }
      return;
    }
    if (G.mode !== 'play') return;
    audio.ensure();
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      G.sel = (G.sel + G.bells.length - 1) % G.bells.length;
      audio.pulse('select');
      e.preventDefault();
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      G.sel = (G.sel + 1) % G.bells.length;
      audio.pulse('select');
      e.preventDefault();
    } else if (k === ' ' || k === 'Enter' || k === 'j' || k === 'J' || k === 'k' || k === 'K') {
      tryMute(G.sel);
      e.preventDefault();
    } else if (k === 'Home') {
      G.sel = 0;
      audio.pulse('select');
      e.preventDefault();
    } else if (k === 'End') {
      G.sel = G.bells.length - 1;
      audio.pulse('select');
      e.preventDefault();
    } else if (k >= '1' && k <= '9') {
      const id = (k | 0) - 1;
      if (id < G.bells.length) {
        G.sel = id;
        tryMute(id);
      }
      e.preventDefault();
    }
  }

  function tickTime(dt) {
    if (G.mode !== 'play' || G.lock > 0 || G.paused || G.solitude > 0) return;
    const prev = G.time;
    G.time -= dt;
    if (G.time <= 10 && (prev | 0) !== (G.time | 0) && G.time > 0) audio.pulse('tick');
    if (G.time <= 0) {
      G.time = 0;
      loseLife('喧铃未止 · 命 -1');
    }
  }

  function syncHud(force) {
    const left = extrasLeft();
    const sec = Math.max(0, Math.ceil(G.time));
    const key = G.mode + ':' + G.stage + ':' + G.lives + ':' + left + ':' + sec + ':' + G.sel;
    if (!force && key === G.hud) return;
    G.hud = key;
    const s = G.spec || STAGES[0];
    if (G.mode === 'title') {
      stageLabel.textContent = '止铃';
      noiseLabel.textContent = 'MUTE';
      noiseLabel.classList.remove('warn');
      timeLabel.textContent = '—';
      timeLabel.classList.remove('warn');
      fillNum.textContent = '—';
      fillBar.style.transform = 'scaleX(0)';
      fillWrap.classList.remove('hot', 'warn');
    } else {
      stageLabel.textContent = (G.stage + 1) + '/' + STAGES.length + ' · ' + (STAGES[G.stage] ? STAGES[G.stage].name : s.name);
      stageLabel.classList.toggle('hot', G.mode === 'clear' || G.solitude > 0);
      noiseLabel.textContent = '噪 ' + left;
      noiseLabel.classList.toggle('warn', left >= 3 && G.mode === 'play');
      timeLabel.textContent = sec + 's';
      timeLabel.classList.toggle('warn', G.mode === 'play' && sec <= 8);
      const done = G.need > 0 ? G.did / G.need : 1;
      fillBar.style.transform = 'scaleX(' + clamp(done, 0, 1) + ')';
      fillNum.textContent = G.did + '/' + G.need;
      fillWrap.classList.toggle('hot', G.mode === 'clear' || left === 0);
      fillWrap.classList.toggle('warn', G.mode === 'play' && sec <= 8 && left > 0);
    }
    let html = '';
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 ? ' on warn' : ' on') : '') + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function strikeBell(b) {
    const live = G.mode === 'title' || G.mode === 'play' || G.mode === 'clear' || G.solitude > 0;
    if (!live || b.muted) return;
    b.flash = 1;
    const nRing = ringingCount();
    const vol = (b.keep ? 0.07 : 0.038) / Math.sqrt(Math.max(1, nRing * 0.55));
    const boost = (G.sel === b.i && G.mode === 'play') ? 1.35 : 1;
    const dur = b.keep ? 0.85 : 0.55;
    audio.ding(b.freq, vol * boost, dur);
    const glow = G.spec ? G.spec.glow : 0.4;
    const col = mix(hzColor(b.freq), mix(CYN, INK, 0.4), 1 - glow);
    ringAt(b.px, b.py + b.r * 0.2, col, b.keep && glow > 0.4);
  }

  function update(dt) {
    G.t += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.lock > 0) G.lock = Math.max(0, G.lock - dt);
    if (G.beatFlash > 0) G.beatFlash = Math.max(0, G.beatFlash - dt * 3.2);

    const period = (G.spec && G.spec.period) || 1.1;
    const beatS = Math.sin(TAU * G.t / period);
    if (G.prevBeatS <= 0 && beatS > 0) {
      G.beatFlash = 1;
      if (G.mode === 'play' || G.mode === 'title' || G.solitude > 0) audio.pulse('gong');
      ringAt(G.gongX, G.gongY, GOLD, true);
    }
    G.prevBeatS = beatS;

    const left = extrasLeft();
    const wantQuiet = G.need > 0 ? 1 - left / G.need : 1;
    G.quiet = lerp(G.quiet, G.mode === 'title' ? 0.15 : wantQuiet, 1 - Math.pow(0.04, dt));

    for (let i = 0; i < G.bells.length; i++) {
      const b = G.bells[i];
      if (b.drift) b.phase += b.drift * dt;
      if (b.muted && b.muteT < 1) b.muteT = Math.min(1, b.muteT + dt * 2.8);
      if (b.flash > 0) b.flash = Math.max(0, b.flash - dt * 2.6);
      if (b.press > 0) b.press = Math.max(0, b.press - dt * 4.2);
      const wantHov = G.sel === i ? 1 : 0;
      b.hover = lerp(b.hover, wantHov, 1 - Math.pow(0.0008, dt));
      poseBell(b);
      const s = Math.sin(TAU * G.t / b.period + b.phase);
      if (!b.muted && b.prevS <= 0 && s > 0) strikeBell(b);
      b.prevS = s;
    }

    if (G.mode === 'play') {
      tickTime(dt);
      if (G.solitude > 0) {
        G.solitude -= dt;
        if (G.solitude <= 0) {
          G.solitude = 0;
          if (G.mode === 'play') stageClear();
        }
      }
    }

    if (G.mode === 'clear') {
      G.clearT -= dt;
      if (G.clearT <= 0) {
        if (G.stage + 1 >= STAGES.length) {
          G.mode = 'win';
          showOverlay('win');
          audio.pulse('win');
        } else {
          G.mode = 'play';
          loadStage(G.stage + 1);
        }
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 110 * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t -= dt * 1.35;
      r.r += dt * r.max * 1.35;
      if (r.t <= 0) rings.splice(i, 1);
    }

    syncHud(false);
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function glowDot(x, y, r, col, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = r * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBg() {
    const w = view.w;
    const h = view.h;
    const dim = G.spec ? G.spec.dim : 0;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0c0718');
    g.addColorStop(0.5, '#05030c');
    g.addColorStop(1, '#070312');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const q = G.quiet;
    const rg = ctx.createRadialGradient(w * 0.22, h * 0.04, 8, w * 0.22, h * 0.04, w * 0.55);
    rg.addColorStop(0, 'rgba(255,61,184,' + (0.13 * (1 - q * 0.5)) + ')');
    rg.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, w, h);
    const rg2 = ctx.createRadialGradient(G.gongX, G.gongY, 6, G.gongX, G.gongY, w * 0.42);
    rg2.addColorStop(0, 'rgba(255,227,107,' + (0.08 + q * 0.12 + G.beatFlash * 0.1) + ')');
    rg2.addColorStop(1, 'rgba(255,227,107,0)');
    ctx.fillStyle = rg2;
    ctx.fillRect(0, 0, w, h);
    const rg3 = ctx.createRadialGradient(w * 0.86, h * 0.08, 8, w * 0.86, h * 0.08, w * 0.48);
    rg3.addColorStop(0, 'rgba(0,240,255,' + (0.1 * (0.45 + q)) + ')');
    rg3.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = rg3;
    ctx.fillRect(0, 0, w, h);

    if (dim > 0.02) {
      ctx.fillStyle = 'rgba(2,1,8,' + (dim * 0.72) + ')';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const mx = (m.x * w + Math.sin(G.t * m.s + m.p) * 18);
      const my = ((m.y * h + G.t * 8 * m.s) % (h + 12)) - 6;
      ctx.fillStyle = rgb(i % 3 === 0 ? GOLD : i % 3 === 1 ? CYN : MAG, m.a);
      ctx.beginPath();
      ctx.arc(mx, my, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    const floorY = h * 0.9;
    const fg = ctx.createRadialGradient(w * 0.5, floorY, 10, w * 0.5, floorY, w * 0.48);
    fg.addColorStop(0, 'rgba(0,240,255,0.05)');
    fg.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, floorY, w * 0.42, h * 0.035, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(8,6,18,0.55)';
    roundRect(w * 0.04, h * 0.02, w * 0.045, h * 0.9, 4);
    ctx.fill();
    roundRect(w * 0.915, h * 0.02, w * 0.045, h * 0.9, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.12)';
    ctx.lineWidth = 1.2;
    roundRect(w * 0.04, h * 0.02, w * 0.045, h * 0.9, 4);
    ctx.stroke();
    roundRect(w * 0.915, h * 0.02, w * 0.045, h * 0.9, 4);
    ctx.stroke();
  }

  function drawBeam() {
    const w = view.w;
    const y = G.beamY;
    ctx.save();
    roundRect(w * 0.07, y - 7, w * 0.86, 14, 5);
    const bg = ctx.createLinearGradient(0, y - 8, 0, y + 8);
    bg.addColorStop(0, '#2a1a3a');
    bg.addColorStop(0.45, '#15101f');
    bg.addColorStop(1, '#0a0712');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.28)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    const n = G.bells.length;
    for (let i = 0; i < n; i++) {
      const b = G.bells[i];
      glowDot(b.anchorX, y, 2.1, rgb(CYN), 0.55);
    }
    ctx.restore();
  }

  function drawGong() {
    const x = G.gongX;
    const y = G.gongY;
    const r = G.gongR;
    const flash = G.beatFlash;
    ctx.save();
    ctx.strokeStyle = rgb(GOLD, 0.18 + flash * 0.35);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y + r * 0.2);
    ctx.lineTo(x, G.beamY - 2);
    ctx.stroke();

    glowDot(x, y, r * 0.55, rgb(GOLD), 0.18 + flash * 0.45);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = '#1a1208';
    ctx.fill();
    ctx.strokeStyle = rgb(GOLD, 0.7 + flash * 0.3);
    ctx.lineWidth = 2;
    ctx.shadowColor = rgb(GOLD, 0.8);
    ctx.shadowBlur = 12 + flash * 16;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.42, 0, TAU);
    ctx.strokeStyle = rgb(GOLD, 0.35 + flash * 0.4);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    glowDot(x, y, 2.4, rgb(GOLD), 0.85 + flash * 0.15);

    if (flash > 0.05) {
      ctx.beginPath();
      ctx.arc(x, y, r + (1 - flash) * 22, 0, TAU);
      ctx.strokeStyle = rgb(GOLD, flash * 0.45);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBell(b) {
    const s = b.r * (1 - b.press * 0.06);
    const glow = G.spec ? G.spec.glow : 0.4;
    const muted = b.muted;
    const damp = muted ? 1 - ease(Math.min(1, b.muteT)) : 1;
    const keepMark = b.keep && glow > 0.04 && !muted;
    const pitchCol = hzColor(b.freq);
    const bodyCol = muted
      ? mix({ r: 18, g: 14, b: 28 }, { r: 40, g: 32, b: 52 }, 0.4)
      : mix({ r: 28, g: 18, b: 42 }, pitchCol, 0.08 + b.flash * 0.18);
    const rim = keepMark
      ? mix(GOLD, pitchCol, 1 - glow)
      : mix(mix(MAG, CYN, 0.45), pitchCol, glow * 0.5 + 0.15);
    const rimA = muted ? 0.22 : (0.55 + b.flash * 0.4 + (keepMark ? glow * 0.4 : 0));

    ctx.save();
    ctx.strokeStyle = rgb(keepMark ? GOLD : CYN, muted ? 0.12 : 0.28);
    ctx.lineWidth = 1.35;
    ctx.beginPath();
    ctx.moveTo(b.anchorX, G.beamY);
    ctx.lineTo(b.px, b.py - s * 0.92);
    ctx.stroke();

    ctx.translate(b.px, b.py);
    ctx.rotate(b.ang);

    if (G.sel === b.i && G.mode === 'play') {
      ctx.beginPath();
      ctx.ellipse(0, s * 0.22, s * 1.35, s * 1.55, 0, 0, TAU);
      ctx.strokeStyle = rgb(muted ? MAG : CYN, muted ? 0.16 : 0.3 + b.hover * 0.25);
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    if (keepMark && b.flash > 0.2) {
      glowDot(0, s * 0.15, s * 0.7, rgb(GOLD), b.flash * 0.35 * glow);
    }

    ctx.beginPath();
    ctx.moveTo(-s * 0.22, -s * 0.9);
    ctx.bezierCurveTo(-s * 0.28, -s * 0.2, -s * 0.82, s * 0.12, -s * 0.9, s * 0.68);
    ctx.lineTo(-s * 1.05, s * 0.82);
    ctx.quadraticCurveTo(0, s * 1.05, s * 1.05, s * 0.82);
    ctx.lineTo(s * 0.9, s * 0.68);
    ctx.bezierCurveTo(s * 0.82, s * 0.12, s * 0.28, -s * 0.2, s * 0.22, -s * 0.9);
    ctx.closePath();
    const lg = ctx.createLinearGradient(-s, -s, s, s);
    lg.addColorStop(0, rgb(mix(bodyCol, CYN, 0.12)));
    lg.addColorStop(0.45, rgb(bodyCol));
    lg.addColorStop(1, rgb(mix(bodyCol, MAG, 0.1)));
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.shadowColor = rgb(rim, muted ? 0.1 : 0.55);
    ctx.shadowBlur = muted ? 0 : 10 + b.flash * 14;
    ctx.strokeStyle = rgb(rim, rimA);
    ctx.lineWidth = keepMark ? 2.1 : 1.5;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.ellipse(0, -s * 0.92, s * 0.26, s * 0.12, 0, 0, TAU);
    ctx.fillStyle = '#1c1428';
    ctx.fill();
    ctx.strokeStyle = rgb(keepMark ? GOLD : CYN, 0.45);
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-s * 0.22, s * 0.05, s * 0.22, s * 0.5, -0.2, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,' + (muted ? 0.03 : 0.07 + b.flash * 0.08) + ')';
    ctx.fill();

    const clap = b.wave * s * 0.16 * damp;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.lineTo(clap, s * 0.28);
    ctx.strokeStyle = rgb(keepMark ? GOLD : INK, muted ? 0.15 : 0.55);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    glowDot(clap, s * 0.32, keepMark ? 3.1 : 2.4, rgb(keepMark ? GOLD : pitchCol), muted ? 0.15 : 0.7 + b.flash * 0.3);

    if (!muted && b.flash > 0.12) {
      ctx.beginPath();
      ctx.ellipse(0, s * 0.2, s * (0.9 + b.flash * 0.3), s * (1.05 + b.flash * 0.25), 0, 0, TAU);
      ctx.strokeStyle = rgb(keepMark ? GOLD : rim, b.flash * 0.45);
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (G.teach && !b.keep && !b.muted && G.mode === 'play') {
      const bob = 6 + Math.sin(G.t * 6 + b.i) * 3;
      ctx.fillStyle = rgb(MAG, 0.75);
      ctx.beginPath();
      ctx.moveTo(0, s * 1.22 + bob);
      ctx.lineTo(-6, s * 1.05 + bob);
      ctx.lineTo(6, s * 1.05 + bob);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    if (G.mode === 'play' || G.mode === 'clear') {
      ctx.save();
      ctx.font = '10px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgb(INK, G.sel === b.i ? 0.75 : 0.38);
      ctx.fillText(String(b.i + 1), b.px, b.py - b.r * 1.12);
      ctx.restore();
    }
  }

  function drawRings() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.strokeStyle = rgb(r.col, r.t * 0.45);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      glowDot(p.x, p.y, p.r, rgb(p.col), Math.max(0, p.life / p.max));
    }
  }

  function draw() {
    const w = view.w;
    const h = view.h;
    ctx.save();
    if (G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake * 1.5, (Math.random() - 0.5) * G.shake * 1.5);
    }
    drawBg();
    drawBeam();
    drawGong();
    drawRings();
    const order = G.bells.slice().sort(function (a, b) { return a.py - b.py; });
    for (let i = 0; i < order.length; i++) drawBell(order[i]);
    drawParticles();
    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(' + G.flashCol + ',' + (G.flash * 0.18) + ')';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  function resize() {
    const stage = document.getElementById('stage');
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    view.dpr = dpr;
    canvas.width = (view.w * dpr) | 0;
    canvas.height = (view.h * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  function bootBoard() {
    spawnTitleBells();
    G.mode = 'title';
    G.time = STAGES[0].time;
    hideToast();
    hintEl.textContent = '乱响按掉 · 同拍留下';
    showOverlay('title');
    syncHud(true);
    if (location.hash === '#play') startRun();
  }

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    startRun();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'play' || G.mode === 'clear') loadStage(G.stage);
    else startRun();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  let acc = 0;
  let last = performance.now() / 1000;

  canvas.addEventListener('pointerdown', onDown, { passive: false });
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    if (!document.hidden) last = performance.now() / 1000;
  });

  makeMotes();
  resize();
  bootBoard();
  function frame(now) {
    const t = now / 1000;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    if (acc > 0.2) acc = 0.2;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
