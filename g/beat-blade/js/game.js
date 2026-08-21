'use strict';

(function () {
  const HIT_WIN = 0.108;
  const NEAR_WIN = 0.22;
  const PERFECT = 0.05;
  const LIVES = 3;
  const COUNT_IN = 4;
  const LOOKAHEAD = 4.35;
  const ARC = 2.52;
  const STRIKE = Math.PI / 2;
  const MUTE_KEY = 'beat-blade-mute';

  const PHRASES = [
    { name: '起式', sub: 'OPEN', bpm: 100, pattern: '1110111010101101' },
    { name: '交错', sub: 'CROSS', bpm: 110, pattern: '1101101110011110' },
    { name: '收刃', sub: 'CLOSE', bpm: 124, pattern: '1011010111011011' }
  ];

  const TOTAL = PHRASES.reduce(function (n, p) {
    return n + p.pattern.length;
  }, 0);

  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d', { alpha: false });
  const hud = document.getElementById('hud');
  const hintEl = document.getElementById('hint');
  const phraseEl = document.getElementById('phrase');
  const comboEl = document.getElementById('combo');
  const beatEl = document.getElementById('beat');
  const bladesEl = document.getElementById('blades');
  const panel = document.getElementById('panel');
  const card = document.getElementById('card');
  const kickerEl = document.getElementById('panel-kicker');
  const titleEl = document.getElementById('panel-title');
  const leadEl = document.getElementById('panel-lead');
  const metaEl = document.getElementById('panel-meta');
  const footEl = document.getElementById('panel-foot');
  const btnMain = document.getElementById('btn-main');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');

  let W = 1;
  let H = 1;
  let dpr = 1;
  const layout = { cx: 0, cy: 0, r: 120 };

  const stars = [];
  const particles = [];
  const shards = [];
  const floats = [];
  const frags = [];
  const ripples = [];

  let notes = [];
  let pulses = [];
  let songStart = 0;
  let songEnd = 0;

  const G = {
    mode: 'title',
    songT: 0,
    clock: 0,
    lives: LIVES,
    combo: 0,
    maxCombo: 0,
    perfects: 0,
    resolved: 0,
    lock: 0,
    slash: 0,
    pulse: 0,
    shake: 0,
    flash: 0,
    flashCol: '#ff3db8',
    pause: false,
    ending: '',
    endT: 0,
    judge: '',
    judgeT: 0,
    countN: 0,
    phrase: 0,
    hintLock: 0,
    lastHint: ''
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
        this.master.gain.value = this.muted ? 0 : 0.24;
        this.master.connect(this.ctx.destination);
        const n = (this.ctx.sampleRate * 0.28) | 0;
        const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.24;
      btnMute.textContent = m ? '静音' : '声开';
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
      f.Q.value = 0.7;
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
      this.beep(accent ? 1480 : 1100, 0.03, 'sine', accent ? 0.07 : 0.035, 700);
      this.beep(accent ? 180 : 90, 0.07, 'sine', accent ? 0.08 : 0.04, 50);
    },
    kick: function () {
      this.beep(140, 0.14, 'sine', 0.11, 42);
    },
    snare: function () {
      this.noise(0.09, 0.07, 2200);
      this.beep(210, 0.08, 'triangle', 0.03, 90);
    },
    hat: function () {
      this.noise(0.035, 0.03, 7000);
    },
    slash: function (perfect) {
      this.noise(0.1, perfect ? 0.1 : 0.07, perfect ? 2400 : 1600);
      this.beep(perfect ? 880 : 620, 0.1, 'triangle', 0.08, perfect ? 1640 : 980);
      this.beep(220, 0.08, 'sine', 0.04, 80);
    },
    rest: function () {
      this.beep(520, 0.06, 'sine', 0.035, 280);
    },
    fail: function () {
      this.beep(220, 0.22, 'sawtooth', 0.09, 70);
      this.noise(0.16, 0.08, 900);
    },
    win: function () {
      this.beep(440, 0.22, 'triangle', 0.1, 880);
      this.beep(660, 0.32, 'sine', 0.07, 1320);
      this.beep(880, 0.4, 'triangle', 0.05, 1760);
    },
    lose: function () {
      this.beep(330, 0.45, 'sawtooth', 0.1, 60);
      this.beep(110, 0.7, 'square', 0.06, 40);
      this.noise(0.4, 0.08, 600);
    },
    start: function () {
      this.beep(220, 0.16, 'sine', 0.07, 440);
      this.beep(440, 0.2, 'triangle', 0.05, 880);
    },
    onPulse: function (p) {
      if (!this.ctx || this.muted) return;
      const accent = p.bar === 0;
      this.click(accent);
      if (p.type === 'count') return;
      if (p.bar === 0) {
        this.kick();
        const roots = [110, 146, 164];
        this.beep(roots[p.ph % 3], 0.22, 'sine', 0.05, roots[p.ph % 3] * 0.5);
      } else if (p.bar === 2) {
        this.snare();
      }
      this.hat();
    }
  };

  try {
    audio.muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch (e) {}

  function compile() {
    notes = [];
    pulses = [];
    let t = 0;
    const bpm0 = PHRASES[0].bpm;
    const cd = 60 / bpm0;
    for (let i = 0; i < COUNT_IN; i++) {
      pulses.push({ t: t, type: 'count', n: COUNT_IN - i, bar: i % 4, ph: 0, fired: false });
      t += cd;
    }
    songStart = t;
    let idx = 0;
    for (let p = 0; p < PHRASES.length; p++) {
      const ph = PHRASES[p];
      const d = 60 / ph.bpm;
      for (let k = 0; k < ph.pattern.length; k++) {
        const hit = ph.pattern.charAt(k) === '1';
        const ev = {
          t: t,
          hit: hit,
          i: idx,
          ph: p,
          bar: k % 4,
          state: 'open',
          dur: d
        };
        notes.push(ev);
        pulses.push({ t: t, type: hit ? 'hit' : 'rest', n: 0, bar: k % 4, ph: p, fired: false });
        t += d;
        idx += 1;
      }
    }
    songEnd = t;
  }

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 86; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.42 + 0.06,
        p: Math.random() * Math.PI * 2,
        s: 0.25 + Math.random() * 0.9
      });
    }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 110) particles.shift();
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

  function emitShards(x, y, ang, hit, perfect) {
    const tx = -Math.sin(ang);
    const ty = Math.cos(ang);
    const col = hit ? (perfect ? '#ffffff' : '#ff3db8') : '#00f0ff';
    for (let s = -1; s <= 1; s += 2) {
      if (shards.length > 24) shards.shift();
      shards.push({
        x: x,
        y: y,
        vx: tx * s * rand(90, 160) + rand(-20, 20),
        vy: ty * s * rand(90, 160) + rand(-30, 10),
        rot: ang,
        vr: s * rand(4, 8),
        life: 0.42,
        max: 0.42,
        hit: hit,
        col: col
      });
    }
  }

  function floatText(x, y, text, col) {
    floats.push({ x: x, y: y, vy: -42, life: 0.7, max: 0.7, text: text, col: col });
  }

  function ripple(r, col) {
    ripples.push({ r: r, life: 0.45, max: 0.45, col: col });
  }

  function spawnFrags() {
    frags.length = 0;
    const { cx, cy, r } = layout;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + rand(-0.2, 0.2);
      frags.push({
        x: cx + Math.cos(a) * 8,
        y: cy + Math.sin(a) * 10,
        vx: Math.cos(a) * rand(80, 220),
        vy: Math.sin(a) * rand(40, 180) - 40,
        rot: rand(0, Math.PI),
        vr: rand(-8, 8),
        len: rand(14, 36),
        life: 1.1,
        col: i % 2 ? '#ff3db8' : '#00f0ff'
      });
    }
    emit(28, {
      x: cx,
      y: cy,
      j: 16,
      vx0: -160,
      vx1: 160,
      vy0: -180,
      vy1: 80,
      life: 0.8,
      r0: 2,
      r1: 5,
      col: '#ff3db8',
      g: 40
    });
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const m = Math.min(W, H);
    layout.cx = W * 0.5;
    layout.cy = H * (H < 520 ? 0.52 : 0.54);
    layout.r = m * (W < 720 ? 0.30 : 0.33);
    if (layout.r < 88) layout.r = 88;
    if (layout.r > 210) layout.r = 210;
  }

  function resetRun() {
    compile();
    G.songT = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.maxCombo = 0;
    G.perfects = 0;
    G.resolved = 0;
    G.lock = 0;
    G.slash = 0;
    G.pulse = 0;
    G.shake = 0;
    G.flash = 0;
    G.ending = '';
    G.endT = 0;
    G.judge = '';
    G.judgeT = 0;
    G.countN = COUNT_IN;
    G.phrase = 0;
    G.hintLock = 0;
    G.lastHint = '';
    particles.length = 0;
    shards.length = 0;
    floats.length = 0;
    frags.length = 0;
    ripples.length = 0;
  }

  function syncHud() {
    let phIdx = G.phrase;
    for (let i = 0; i < notes.length; i++) {
      if (notes[i].state === 'open') {
        phIdx = notes[i].ph;
        break;
      }
    }
    const ph = PHRASES[phIdx] || PHRASES[0];
    phraseEl.textContent = ph.name;
    comboEl.textContent = String(G.combo);
    beatEl.textContent = G.resolved + '/' + TOTAL;
    const pips = bladesEl.querySelectorAll('i');
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('off', i >= G.lives);
    }
  }

  function setHint(text, cls) {
    const key = text + '|' + (cls || '');
    if (G.lastHint === key) return;
    G.lastHint = key;
    hintEl.textContent = text;
    hintEl.className = 'hint' + (cls ? ' ' + cls : '');
  }

  function nextHint() {
    if (G.hintLock > 0) return;
    if (G.songT < songStart - 0.02) {
      setHint('听拍 · ' + (G.countN > 0 ? G.countN : '起'), 'gold');
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
      setHint('收势', 'gold');
      return;
    }
    if (next.hit) setHint('下一拍 · 出刀', 'warn');
    else setHint('下一拍 · 收刃', 'cool');
  }

  function strikePos() {
    return {
      x: layout.cx + Math.cos(STRIKE) * layout.r,
      y: layout.cy + Math.sin(STRIKE) * layout.r
    };
  }

  function noteAngle(note, now) {
    return STRIKE + ((note.t - now) / LOOKAHEAD) * ARC;
  }

  function buzz(ms) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  function succeed(note, ad) {
    note.state = 'done';
    G.resolved += 1;
    G.combo += 1;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    G.phrase = note.ph;
    const perfect = note.hit && ad <= PERFECT;
    if (perfect) G.perfects += 1;
    const pos = strikePos();
    const ang = noteAngle(note, G.songT);
    if (note.hit) {
      G.judge = perfect ? '完美' : '准';
      G.flashCol = perfect ? '#ffffff' : '#ff3db8';
      G.flash = perfect ? 0.28 : 0.16;
      audio.slash(perfect);
      emitShards(pos.x, pos.y, ang, true, perfect);
      emit(perfect ? 16 : 10, {
        x: pos.x,
        y: pos.y,
        j: 8,
        vx0: -140,
        vx1: 140,
        vy0: -40,
        vy1: 160,
        life: 0.45,
        r0: 1.4,
        r1: 3.4,
        col: perfect ? '#ffffff' : '#ff3db8',
        g: 30
      });
      ripple(layout.r, perfect ? '#00f0ff' : '#ff3db8');
      floatText(pos.x, pos.y - 18, G.judge, perfect ? '#ffe36b' : '#ff3db8');
      buzz(perfect ? 8 : 12);
    } else {
      G.judge = '收';
      audio.rest();
      emit(6, {
        x: pos.x,
        y: pos.y,
        j: 6,
        vx0: -50,
        vx1: 50,
        vy0: 20,
        vy1: 80,
        life: 0.35,
        r0: 1,
        r1: 2.2,
        col: '#00f0ff',
        g: 10
      });
      floatText(pos.x, pos.y - 16, '收', '#00f0ff');
    }
    G.judgeT = 0.55;
    syncHud();
    nextHint();
    if (G.resolved >= TOTAL) beginEnd('win');
  }

  function fail(note, why) {
    if (note) {
      note.state = 'done';
      G.resolved += 1;
      G.phrase = note.ph;
    }
    G.combo = 0;
    G.lives -= 1;
    G.shake = 0.55;
    G.flash = 0.45;
    G.flashCol = '#ff3db8';
    G.judge = why;
    G.judgeT = 0.7;
    audio.fail();
    const pos = strikePos();
    emit(18, {
      x: pos.x,
      y: pos.y,
      j: 10,
      vx0: -180,
      vx1: 180,
      vy0: -80,
      vy1: 140,
      life: 0.5,
      r0: 1.5,
      r1: 3.6,
      col: '#ff3db8',
      g: 50
    });
    floatText(pos.x, pos.y - 20, why, '#ff3db8');
    buzz(28);
    syncHud();
    G.hintLock = 0.7;
    setHint(why === '空拍' ? '空拍折刃' : '失拍折刃', 'warn');
    if (G.lives <= 0) beginEnd('lose');
    else if (G.resolved >= TOTAL) beginEnd('win');
  }

  function beginEnd(kind) {
    if (G.ending) return;
    G.ending = kind;
    G.endT = 0;
    G.mode = 'ending';
    if (kind === 'win') {
      audio.win();
      ripple(layout.r, '#00f0ff');
      emit(32, {
        x: layout.cx,
        y: layout.cy,
        j: 20,
        vx0: -120,
        vx1: 120,
        vy0: -140,
        vy1: 40,
        life: 0.9,
        r0: 2,
        r1: 5,
        col: '#00f0ff',
        g: 20
      });
    } else {
      audio.lose();
      spawnFrags();
    }
  }

  function showPanel(kind) {
    panel.classList.remove('hidden');
    card.classList.remove('win', 'lose');
    hud.classList.add('hidden');
    if (kind === 'title') {
      kickerEl.textContent = 'BEAT BLADE';
      titleEl.textContent = '节拍刃';
      leadEl.innerHTML = '只在拍点出刀。<br />空拍会折刃。';
      metaEl.textContent = '粉菱必须砍，青色空圈必须收。刃裂三次则负。';
      btnMain.textContent = '拔刀';
      footEl.textContent = '空格 / 点击出刀 · M 静音';
    } else if (kind === 'win') {
      card.classList.add('win');
      kickerEl.textContent = 'HOLD';
      titleEl.textContent = '刃未折';
      leadEl.textContent = '这一曲，刃还在。';
      metaEl.textContent =
        TOTAL +
        ' 拍 · 连击 ' +
        G.maxCombo +
        ' · 完美 ' +
        G.perfects +
        ' · 余刃 ' +
        G.lives;
      btnMain.textContent = '再来一曲';
      footEl.textContent = '空格 / 回车 · R 重开';
    } else {
      card.classList.add('lose');
      kickerEl.textContent = 'BROKEN';
      titleEl.textContent = '刃已折';
      leadEl.textContent = '空拍吞掉了刃。';
      metaEl.textContent =
        '收于第 ' +
        G.resolved +
        ' 拍 · 最高连击 ' +
        G.maxCombo;
      btnMain.textContent = '重铸';
      footEl.textContent = '空格 / 回车 · R 重开';
    }
  }

  function startPlay() {
    audio.ensure();
    audio.start();
    resetRun();
    G.mode = 'play';
    G.pause = false;
    panel.classList.add('hidden');
    hud.classList.remove('hidden');
    syncHud();
    nextHint();
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
  }

  function slash() {
    if (G.mode !== 'play' || G.ending) return;
    if (G.songT < songStart - 0.04) {
      G.slash = 1;
      audio.noise(0.06, 0.03, 1400);
      return;
    }
    if (G.lock > 0) return;
    G.lock = 0.09;
    G.slash = 1;
    if (G.songT > songEnd + 0.12) return;

    let near = null;
    let best = 1e9;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.state !== 'open') continue;
      const ad = Math.abs(G.songT - n.t);
      if (ad < best) {
        best = ad;
        near = n;
      }
    }
    if (near && best <= HIT_WIN) {
      if (near.hit) succeed(near, best);
      else fail(near, '空拍');
    } else if (near && best <= NEAR_WIN) {
      fail(near, near.hit ? '失拍' : '空拍');
    } else {
      G.combo = 0;
      audio.noise(0.07, 0.04, 1100);
      audio.beep(180, 0.08, 'sine', 0.03, 70);
      syncHud();
    }
  }

  function primary() {
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') startPlay();
    else if (G.mode === 'play') slash();
  }

  function resolveExpired() {
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.state !== 'open') continue;
      if (G.songT > n.t + HIT_WIN) {
        if (n.hit) fail(n, '失拍');
        else succeed(n, 0);
        if (G.ending) return;
      }
    }
  }

  function firePulses() {
    for (let i = 0; i < pulses.length; i++) {
      const p = pulses[i];
      if (p.fired) continue;
      if (G.songT >= p.t) {
        p.fired = true;
        G.pulse = 1;
        audio.onPulse(p);
        if (p.type === 'count') {
          G.countN = p.n;
          nextHint();
        }
      }
    }
  }

  function stepFx(dt) {
    G.clock += dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.slash > 0) G.slash = Math.max(0, G.slash - dt * 5.6);
    if (G.pulse > 0) G.pulse = Math.max(0, G.pulse - dt * 4.2);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 2.4);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.8);
    if (G.judgeT > 0) G.judgeT = Math.max(0, G.judgeT - dt);
    if (G.hintLock > 0) {
      G.hintLock -= dt;
      if (G.hintLock <= 0) {
        G.hintLock = 0;
        G.lastHint = '';
        nextHint();
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 90 * dt;
      s.rot += s.vr * dt;
      if (s.life <= 0) shards.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life -= dt;
      f.y += f.vy * dt;
      if (f.life <= 0) floats.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.life -= dt;
      if (r.life <= 0) ripples.splice(i, 1);
    }
    for (let i = frags.length - 1; i >= 0; i--) {
      const f = frags[i];
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vy += 240 * dt;
      f.rot += f.vr * dt;
      if (f.life <= 0) frags.splice(i, 1);
    }
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(layout.cx, layout.cy, 10, layout.cx, layout.cy, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(40, 8, 48, 0.55)');
    g.addColorStop(0.45, 'rgba(8, 6, 22, 0.2)');
    g.addColorStop(1, 'rgba(5, 3, 12, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const pulse = G.pulse;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.clock * (1.2 + s.s) + s.p);
      ctx.beginPath();
      ctx.fillStyle = rgba(i % 3 === 0 ? '#ff3db8' : '#00f0ff', s.a * tw + pulse * 0.08);
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    const vg = ctx.createRadialGradient(layout.cx, H * 0.12, 0, layout.cx, H * 0.12, W * 0.6);
    vg.addColorStop(0, 'rgba(255, 61, 184, 0.10)');
    vg.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function drawVinyl() {
    const { cx, cy, r } = layout;
    const beatGlow = 0.35 + G.pulse * 0.65;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.beginPath();
    ctx.arc(0, 0, r + 28, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.stroke();

    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, r * (0.28 + i * 0.1), 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, ' + (0.04 + i * 0.012) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(0, 0, r, STRIKE, STRIKE + ARC);
    ctx.strokeStyle = rgba('#ff3db8', 0.1 + beatGlow * 0.08);
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = rgba('#00f0ff', 0.18 + beatGlow * 0.2);
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = rgba('#ff3db8', 0.22 + beatGlow * 0.25);
    ctx.lineWidth = 2.2;
    ctx.stroke();

    const prog = TOTAL ? G.resolved / TOTAL : 0;
    if (prog > 0 && G.mode !== 'title') {
      ctx.beginPath();
      ctx.arc(0, 0, r + 14, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
      ctx.strokeStyle = rgba('#ffe36b', 0.7);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    for (let i = 0; i < ripples.length; i++) {
      const rp = ripples[i];
      const u = 1 - rp.life / rp.max;
      ctx.beginPath();
      ctx.arc(0, 0, r + u * 40, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(rp.col, 0.45 * (1 - u));
      ctx.lineWidth = 3 - u * 2;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawStrike() {
    const { cx, cy, r } = layout;
    const pos = strikePos();
    const glow = 0.4 + G.pulse * 0.6 + (G.slash > 0 ? G.slash * 0.5 : 0);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(pos.x + (pos.x - cx) * 0.18, pos.y + (pos.y - cy) * 0.18);
    ctx.strokeStyle = rgba('#ffffff', 0.08 + glow * 0.12);
    ctx.lineWidth = 2;
    ctx.stroke();

    const gate = 18 + glow * 6;
    ctx.translate(pos.x, pos.y);
    ctx.rotate(STRIKE);
    ctx.fillStyle = rgba('#00f0ff', 0.08 + glow * 0.12);
    ctx.beginPath();
    ctx.moveTo(0, -gate);
    ctx.lineTo(gate * 0.7, 0);
    ctx.lineTo(0, gate);
    ctx.lineTo(-gate * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba('#00f0ff', 0.55 + glow * 0.4);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = rgba('#ffffff', 0.7 + glow * 0.3);
    ctx.fill();
    ctx.restore();
  }

  function drawNotes(now) {
    const { cx, cy, r } = layout;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.state !== 'open' && G.songT - n.t > 0.16) continue;
      const remain = n.t - now;
      if (remain > LOOKAHEAD + 0.08 || remain < -0.2) continue;
      const ang = noteAngle(n, now);
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r;
      let a = 1;
      if (remain > LOOKAHEAD - 0.28) a = clamp(1 - (remain - (LOOKAHEAD - 0.28)) / 0.28, 0, 1);
      if (remain < 0) a = clamp(1 + remain / 0.2, 0, 1);
      if (n.state !== 'open') a *= 0.35;
      const near = 1 - clamp(Math.abs(remain) / LOOKAHEAD, 0, 1);
      const sc = 0.72 + near * 0.42 + (Math.abs(remain) < HIT_WIN ? 0.12 : 0);
      const rad = (n.hit ? 13 : 12) * sc;

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = a;
      ctx.globalCompositeOperation = 'lighter';
      if (n.hit) {
        ctx.beginPath();
        ctx.arc(0, 0, rad + 7, 0, Math.PI * 2);
        ctx.fillStyle = rgba('#ff3db8', 0.16 + near * 0.18);
        ctx.fill();
        ctx.rotate(ang + Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -rad);
        ctx.lineTo(rad * 0.72, 0);
        ctx.lineTo(0, rad);
        ctx.lineTo(-rad * 0.72, 0);
        ctx.closePath();
        ctx.fillStyle = '#ff3db8';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 1.4;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, rad + 6, 0, Math.PI * 2);
        ctx.fillStyle = rgba('#00f0ff', 0.08 + near * 0.1);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, rad * 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = rgba('#00f0ff', 0.55);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawBlade() {
    const { cx, cy, r } = layout;
    if (G.ending === 'lose' || G.mode === 'lose') return;
    const swing = G.slash > 0 ? (1 - G.slash) : 0;
    const ease = swing * swing * (3 - 2 * swing);
    const rot = Math.sin(G.clock * 1.6) * 0.05 + mix(-0.55, 0.85, ease) * (G.slash > 0 ? 1 : 0);
    const len = r * 0.62;
    const cracks = LIVES - G.lives;

    ctx.save();
    ctx.translate(cx, cy + 6);
    ctx.rotate(rot);
    ctx.globalCompositeOperation = 'lighter';

    const grd = ctx.createLinearGradient(0, -len, 0, len * 0.2);
    grd.addColorStop(0, 'rgba(255,255,255,0.95)');
    grd.addColorStop(0.35, '#00f0ff');
    grd.addColorStop(1, rgba('#ff3db8', 0.15));
    ctx.beginPath();
    ctx.moveTo(0, -len);
    ctx.lineTo(7, len * 0.08);
    ctx.lineTo(0, len * 0.16);
    ctx.lineTo(-5, len * 0.08);
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(1.2, -len * 0.88);
    ctx.lineTo(1.6, len * 0.02);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.fillStyle = '#ff3db8';
    ctx.fillRect(-7, len * 0.12, 14, 7);
    ctx.fillStyle = '#1a1028';
    ctx.fillRect(-4, len * 0.19, 8, 22);
    ctx.fillStyle = rgba('#00f0ff', 0.8);
    ctx.fillRect(-4, len * 0.19, 8, 3);
    ctx.fillRect(-4, len * 0.28, 8, 2);

    if (cracks > 0) {
      ctx.strokeStyle = rgba('#ff3db8', 0.85);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-2, -len * 0.4);
      ctx.lineTo(3, -len * 0.22);
      ctx.lineTo(-1, -len * 0.08);
      ctx.stroke();
      if (cracks > 1) {
        ctx.beginPath();
        ctx.moveTo(2, -len * 0.7);
        ctx.lineTo(-3, -len * 0.52);
        ctx.lineTo(1, -len * 0.38);
        ctx.stroke();
      }
    }
    ctx.restore();

    if (G.slash > 0) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.globalCompositeOperation = 'lighter';
      const u = 1 - G.slash;
      const a0 = mix(Math.PI * 0.12, Math.PI * 0.92, Math.max(0, u - 0.18));
      const a1 = mix(Math.PI * 0.12, Math.PI * 0.92, Math.min(1, u + 0.1));
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.92, a0, a1);
      ctx.strokeStyle = rgba('#ffffff', 0.55 * G.slash);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.92, a0, a1);
      ctx.strokeStyle = rgba('#ff3db8', 0.7 * G.slash);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.78, a0, a1);
      ctx.strokeStyle = rgba('#00f0ff', 0.45 * G.slash);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawCore() {
    const { cx, cy } = layout;
    const p = 0.55 + G.pulse * 0.45 + Math.sin(G.clock * 3.2) * 0.08;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 16 + p * 6, 0, Math.PI * 2);
    ctx.fillStyle = rgba('#ff3db8', 0.12 + p * 0.08);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy + 6, 6, 0, Math.PI * 2);
    ctx.fillStyle = rgba('#ffffff', 0.55 + p * 0.3);
    ctx.fill();
    ctx.restore();
  }

  function drawCount() {
    if (G.mode !== 'play') return;
    if (G.songT >= songStart) return;
    const n = Math.max(1, G.countN);
    const { cx, cy, r } = layout;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.font = '900 64px "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba('#ffe36b', 0.55 + G.pulse * 0.4);
    ctx.fillText(String(n), cx, cy - r - 26);
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = p.life / p.max;
      ctx.beginPath();
      ctx.fillStyle = rgba(p.col, a);
      ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const a = s.life / s.max;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = s.col;
      ctx.beginPath();
      if (s.hit) {
        ctx.moveTo(0, -10);
        ctx.lineTo(6, 0);
        ctx.lineTo(0, 4);
        ctx.closePath();
      } else {
        ctx.arc(0, 0, 6, 0, Math.PI * 1.2);
      }
      ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i];
      const a = clamp(f.life / 0.4, 0, 1);
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.globalAlpha = a;
      ctx.strokeStyle = f.col;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -f.len * 0.5);
      ctx.lineTo(0, f.len * 0.5);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 18px "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.fillStyle = rgba(f.col, f.life / f.max);
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();

    if (G.combo >= 4 && G.mode === 'play' && !G.ending) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = '900 34px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillStyle = rgba('#00f0ff', 0.55 + G.pulse * 0.3);
      ctx.fillText(G.combo + ' 连', layout.cx, layout.cy - layout.r - 18);
      ctx.restore();
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashCol, G.flash * 0.18);
    ctx.fillRect(0, 0, W, H);
  }

  function drawTitleGhost() {
    const { cx, cy, r } = layout;
    const t = G.clock;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.22);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const hit = i % 3 !== 2;
      ctx.beginPath();
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (hit) {
        ctx.fillStyle = rgba('#ff3db8', 0.45);
        ctx.moveTo(x, y - 7);
        ctx.lineTo(x + 5, y);
        ctx.lineTo(x, y + 7);
        ctx.lineTo(x - 5, y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.strokeStyle = rgba('#00f0ff', 0.5);
        ctx.lineWidth = 2;
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function draw() {
    const sx = G.shake ? rand(-5, 5) * G.shake : 0;
    const sy = G.shake ? rand(-4, 4) * G.shake : 0;
    ctx.save();
    ctx.translate(sx, sy);
    drawBg();
    drawVinyl();
    if (G.mode === 'title') drawTitleGhost();
    else if (G.ending !== 'lose') drawNotes(G.songT);
    drawStrike();
    drawCore();
    drawBlade();
    drawCount();
    drawFx();
    ctx.restore();
    drawFlash();
  }

  function update(dt) {
    if (G.mode === 'title') {
      G.clock += dt;
      G.pulse = 0.5 + 0.5 * Math.sin(G.clock * (Math.PI * 2 * (PHRASES[0].bpm / 60)));
      stepFx(dt);
      if (Math.random() < dt * 1.5) {
        emit(1, {
          x: rand(0, W),
          y: rand(0, H * 0.4),
          j: 0,
          vx0: -8,
          vx1: 8,
          vy0: 10,
          vy1: 28,
          life: 2.2,
          r0: 0.6,
          r1: 1.4,
          col: Math.random() > 0.5 ? '#ff3db8' : '#00f0ff',
          g: 0
        });
      }
      return;
    }

    if (G.mode === 'play' && !G.pause) {
      G.songT += dt;
      firePulses();
      resolveExpired();
      if (!G.ending) nextHint();
    }

    if (G.mode === 'ending') {
      G.endT += dt;
      G.songT += dt * 0.35;
      firePulses();
      if (G.endT > (G.ending === 'lose' ? 0.95 : 0.72)) {
        G.mode = G.ending;
        showPanel(G.ending);
      }
    }

    stepFx(dt);
  }

  let last = 0;
  function loop(now) {
    const dt = last ? clamp((now - last) / 1000, 0, 0.05) : 0.016;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function onPointer(e) {
    if (e.target && e.target.closest && e.target.closest('button')) return;
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
      if (e.target === btnMain) return;
      if (panel.contains(e.target) && e.target !== panel) return;
      primary();
      return;
    }
    e.preventDefault();
    slash();
  }

  function toggleMute() {
    audio.ensure();
    audio.setMuted(!audio.muted);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('pointerdown', onPointer, { passive: false });
  window.addEventListener(
    'touchmove',
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );
  window.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    if (e.code === 'KeyM') {
      e.preventDefault();
      toggleMute();
      return;
    }
    if (e.code === 'KeyR') {
      e.preventDefault();
      startPlay();
      return;
    }
    if (
      e.code === 'Space' ||
      e.code === 'Enter' ||
      e.code === 'KeyJ' ||
      e.code === 'KeyF' ||
      e.code === 'KeyK'
    ) {
      e.preventDefault();
      if (G.mode === 'play') {
        slash();
        return;
      }
      if (e.target && e.target.tagName === 'BUTTON') return;
      primary();
    }
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      G.pause = true;
    } else {
      G.pause = false;
      last = performance.now();
    }
  });

  btnMain.addEventListener('click', function (e) {
    e.stopPropagation();
    primary();
  });
  btnMute.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleMute();
  });
  btnRetry.addEventListener('click', function (e) {
    e.stopPropagation();
    startPlay();
  });

  compile();
  makeStars();
  resize();
  audio.setMuted(audio.muted);
  showPanel('title');
  requestAnimationFrame(loop);
})();
