'use strict';

(function () {
  const VW = 480;
  const VH = 760;
  const MOUTH_Y = 548;
  const GROUND_Y = 686;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-snow-catch-mute';
  const LAN_ACC = 2580;
  const LAN_MAX = 520;
  const LAN_FRIC = 8.6;
  const MAX_FLAKES = 18;
  const MAX_PART = 160;

  const C = {
    pink: { id: 'pink', name: '粉', en: 'PINK', hex: '#ff3db8', rgb: [255, 61, 184], freq: 523 },
    cyan: { id: 'cyan', name: '青', en: 'CYAN', hex: '#00f0ff', rgb: [0, 240, 255], freq: 784 },
    gold: { id: 'gold', name: '金', en: 'GOLD', hex: '#ffe36b', rgb: [255, 227, 107], freq: 659 },
    vio: { id: 'vio', name: '紫', en: 'VIO', hex: '#c77dff', rgb: [199, 125, 255], freq: 440 }
  };

  const STAGES = [
    {
      name: '认粉',
      sub: 'FIRST',
      target: 'pink',
      colors: ['pink'],
      need: 5,
      interval: 1.05,
      vy0: 82,
      vy1: 104,
      bowl: 112,
      miss: 4,
      wind: 0,
      rate: 1,
      lanes: [168, 240, 312],
      mark: 1,
      hint: '粉雪接到灯里 · 现在没有别的颜色'
    },
    {
      name: '躲开',
      sub: 'DODGE',
      target: 'pink',
      colors: ['pink', 'cyan'],
      need: 6,
      interval: 0.86,
      vy0: 96,
      vy1: 126,
      bowl: 104,
      miss: 3,
      wind: 0,
      rate: 0.62,
      force: 2,
      lanes: [118, 186, 254, 322, 380],
      mark: 1,
      burst: 0.12,
      hint: '只接粉雪 · 青雪要躲开'
    },
    {
      name: '青灯',
      sub: 'CYAN',
      target: 'cyan',
      colors: ['cyan', 'pink'],
      need: 6,
      interval: 0.76,
      vy0: 108,
      vy1: 142,
      bowl: 96,
      miss: 3,
      wind: 0,
      rate: 0.55,
      force: 1,
      mark: 0.7,
      burst: 0.18,
      hint: '灯芯换成青了 · 粉雪躲开'
    },
    {
      name: '金屑',
      sub: 'GOLD',
      target: 'gold',
      colors: ['gold', 'pink', 'cyan'],
      need: 7,
      interval: 0.68,
      vy0: 118,
      vy1: 158,
      bowl: 90,
      miss: 3,
      wind: 0,
      rate: 0.48,
      mark: 0.45,
      burst: 0.22,
      hint: '三色里只接金雪'
    },
    {
      name: '斜风',
      sub: 'WIND',
      target: 'pink',
      colors: ['pink', 'cyan', 'gold'],
      need: 7,
      interval: 0.64,
      vy0: 124,
      vy1: 168,
      bowl: 86,
      miss: 3,
      wind: 78,
      period: 4.4,
      rate: 0.48,
      mark: 0.3,
      burst: 0.2,
      hint: '风在推雪 · 提前挪灯'
    },
    {
      name: '换芯',
      sub: 'SWITCH',
      target: 'pink',
      colors: ['pink', 'cyan'],
      need: 8,
      interval: 0.6,
      vy0: 128,
      vy1: 176,
      bowl: 82,
      miss: 3,
      wind: 36,
      period: 5.2,
      rate: 0.5,
      force: 2,
      burst: 0.22,
      switches: [{ t: 8.5, color: 'cyan' }],
      hint: '灯芯会换色 · 空中的旧色要躲开'
    },
    {
      name: '密雪',
      sub: 'DENSE',
      target: 'gold',
      colors: ['gold', 'pink', 'cyan'],
      need: 8,
      interval: 0.46,
      vy0: 142,
      vy1: 198,
      bowl: 76,
      miss: 2,
      wind: 48,
      period: 3.8,
      rate: 0.42,
      burst: 0.34,
      hint: '雪更密 · 灯口更窄'
    },
    {
      name: '连换',
      sub: 'CHAIN',
      target: 'cyan',
      colors: ['pink', 'cyan', 'gold'],
      need: 9,
      interval: 0.52,
      vy0: 148,
      vy1: 204,
      bowl: 72,
      miss: 2,
      wind: 58,
      period: 3.6,
      rate: 0.46,
      force: 2,
      burst: 0.28,
      switches: [{ t: 7.2, color: 'pink' }, { t: 14.4, color: 'gold' }],
      hint: '灯芯连换两次 · 看焰不看习惯'
    },
    {
      name: '乱舞',
      sub: 'STORM',
      target: 'cyan',
      colors: ['cyan', 'pink', 'gold', 'vio'],
      need: 10,
      interval: 0.42,
      vy0: 158,
      vy1: 218,
      bowl: 68,
      miss: 2,
      wind: 118,
      period: 3.1,
      rate: 0.38,
      burst: 0.36,
      hint: '四色乱舞 · 只接青雪'
    },
    {
      name: '暴雪',
      sub: 'BLIZZARD',
      target: 'pink',
      colors: ['pink', 'cyan', 'gold', 'vio'],
      need: 12,
      interval: 0.38,
      vy0: 168,
      vy1: 236,
      bowl: 62,
      miss: 2,
      wind: 136,
      period: 2.55,
      rate: 0.36,
      force: 2,
      burst: 0.42,
      switches: [{ t: 8, color: 'gold' }, { t: 16.2, color: 'cyan' }],
      hint: '暴雪 · 灯芯再换 · 一色不接错'
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
  const colorChip = document.getElementById('color-chip');
  const colorName = document.getElementById('color-name');
  const stageLabel = document.getElementById('stage-label');
  const missLabel = document.getElementById('miss-label');
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
  const flakes = [];
  const rings = [];
  const pips = [];
  const gusts = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    song: 0,
    stage: 0,
    lives: LIVES,
    fill: 0,
    need: 5,
    misses: 0,
    missMax: 3,
    target: 'pink',
    spawnT: 0.4,
    forceLeft: 0,
    switchI: 0,
    lan: { x: 240, vx: 0, w: 112 },
    tilt: 0,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    switchFlash: 0,
    flame: 1,
    lock: 0,
    settle: 0,
    toastT: 0,
    why: '',
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
  function col(id) {
    return C[id] || C.pink;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function windNow() {
    const st = STAGES[G.stage] || STAGES[0];
    const amp = st.wind || 0;
    if (!amp) return 0;
    const p = st.period || 4;
    return Math.sin(G.song * TAU / p) * amp;
  }
  function innerHalf() {
    return G.lan.w * 0.44;
  }
  function lanBounds() {
    const half = G.lan.w * 0.5;
    return { lo: 28 + half, hi: VW - 28 - half };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
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
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, Math.floor(sr * n)), sr);
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
    catch(id) {
      this.ensure();
      const f = col(id).freq;
      this.noise(0.07, 0.04, 1400);
      this.beep(f, 0.1, 'sine', 0.07, f * 1.7);
      this.beep(f * 1.5, 0.16, 'triangle', 0.04, f * 2.1);
    },
    miss() {
      this.ensure();
      this.beep(196, 0.12, 'sine', 0.04, 90);
      this.noise(0.08, 0.03, 700);
    },
    wrong() {
      this.ensure();
      this.noise(0.22, 0.08, 380);
      this.beep(180, 0.28, 'sawtooth', 0.055, 70);
      this.beep(92, 0.36, 'sine', 0.07, 40);
    },
    leak() {
      this.ensure();
      this.beep(220, 0.2, 'triangle', 0.05, 110);
      this.beep(146, 0.28, 'sine', 0.05, 70);
    },
    switchTo(id) {
      this.ensure();
      const f = col(id).freq;
      this.beep(392, 0.1, 'sine', 0.05, f);
      this.beep(f, 0.22, 'triangle', 0.055, f * 1.5);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.055);
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
      if (particles.length > MAX_PART) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.45, spec.j * 0.45),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb || C.cyan.rgb,
        g: spec.g == null ? 280 : spec.g
      });
    }
  }

  function addRing(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    if (rings.length > 20) rings.shift();
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.7;
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

  function paintTargetHud() {
    const c = col(G.target);
    colorName.textContent = c.name;
    colorName.style.color = c.hex;
    colorName.style.textShadow = '0 0 10px ' + rgba(c.rgb, 0.5);
    colorChip.style.background = c.hex;
    colorChip.style.boxShadow = '0 0 10px ' + rgba(c.rgb, 0.85);
    fillBar.style.background = 'linear-gradient(90deg, ' + c.hex + ', #fff 72%)';
    fillBar.style.boxShadow = '0 0 10px ' + rgba(c.rgb, 0.55);
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const fill = G.mode === 'title' ? G.demoFill : G.fill;
    const need = G.need;
    const k = need ? clamp(fill / need, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = fill + '/' + need;
    const left = Math.max(0, G.missMax - G.misses);
    const near = G.mode === 'play' && fill >= need - 1 && fill < need;
    fillWrap.classList.toggle('hot', G.mode === 'play' && fill >= need);
    fillWrap.classList.toggle('warn', near);
    paintTargetHud();
    if (G.mode === 'title') {
      stageLabel.textContent = '十夜';
      missLabel.textContent = '同色才接';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 夜 · ' + (st ? st.name : '');
      missLabel.textContent = '可漏 ' + left;
    }
    stageLabel.classList.toggle('hot', G.mode === 'play' && fill >= need);
    missLabel.classList.toggle('warn', G.mode === 'play' && left <= 1);
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
    ovOps.textContent = ops || '← → / A D 挪灯 · 拖动灯笼 · M 静音';
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function resetLan(w, x) {
    G.lan.w = w;
    G.lan.vx = 0;
    const b = { lo: 28 + w * 0.5, hi: VW - 28 - w * 0.5 };
    G.lan.x = clamp(x == null ? VW * 0.5 : x, b.lo, b.hi);
    G.tilt = 0;
  }

  function applyStage(st, demo) {
    G.need = st.need;
    G.fill = demo ? G.demoFill : 0;
    G.misses = 0;
    G.missMax = st.miss;
    G.target = st.target;
    G.spawnT = demo ? 0.55 : 0.72;
    G.forceLeft = st.force || 0;
    G.switchI = 0;
    G.flame = 1;
    flakes.length = 0;
    if (!demo) resetLan(st.bowl, VW * 0.5);
  }

  function setTarget(id, announce) {
    G.target = id;
    G.forceLeft = Math.max(G.forceLeft, 2);
    G.switchFlash = 1;
    G.flame = 1.35;
    paintTargetHud();
    if (announce) {
      const c = col(id);
      audio.switchTo(id);
      toast('灯芯换成' + c.name, false, true);
      setHint('现在只接' + c.name + '雪', 'hot');
      emit(18, {
        x: G.lan.x, y: MOUTH_Y + 36, j: 22,
        vx0: -80, vx1: 80, vy0: -140, vy1: -20,
        life: 0.55, r0: 1.2, r1: 3.2, rgb: c.rgb, g: 180
      });
    }
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.song = 0;
    G.lock = 0.18;
    G.why = '';
    G.settle = 0;
    applyStage(STAGES[i], false);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    const c = col(G.target);
    toast('只接' + c.name + '雪 · ' + STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.demoFill = 0;
    startStage(0);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    G.demoFill = 0;
    G.fill = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.song = 0;
    G.why = '';
    applyStage(STAGES[1], true);
    G.target = 'pink';
    G.need = 6;
    resetLan(112, VW * 0.5);
    showOverlay(
      'title',
      '接雪',
      '灯芯是什么色，就只接什么色。<br />别的雪要躲开，沾上就灭。',
      '开接',
      'SNOW',
      '← → / A D 挪灯 · 拖动灯笼 · M 静音'
    );
    setHint('灯芯同色才接 · 异色躲开', '');
    syncHud();
  }

  function pickDecoy(st) {
    const list = [];
    for (let i = 0; i < st.colors.length; i++) {
      if (st.colors[i] !== G.target) list.push(st.colors[i]);
    }
    if (!list.length) return G.target;
    return list[(Math.random() * list.length) | 0];
  }

  function spawnX(st) {
    const w = windNow();
    let lo = 46;
    let hi = VW - 46;
    if (w > 50) hi = VW * 0.64;
    if (w < -50) lo = VW * 0.36;
    if (st.lanes && st.lanes.length) {
      const lane = st.lanes[(Math.random() * st.lanes.length) | 0];
      return clamp(lane + rand(-14, 14), lo, hi);
    }
    return rand(lo, hi);
  }

  function addFlake(x, id, st) {
    if (flakes.length >= MAX_FLAKES) return;
    flakes.push({
      x: x,
      y: -16,
      vx: windNow() * 0.25 + rand(-18, 18),
      vy: rand(st.vy0, st.vy1),
      r: rand(10.5, 13.4),
      rot: rand(0, TAU),
      vr: rand(-1.6, 1.6),
      color: id,
      wob: rand(0, TAU),
      wobSp: rand(2.2, 4.4),
      alive: true
    });
  }

  function spawnOne(st, forceId) {
    let id;
    if (forceId) id = forceId;
    else if (G.forceLeft > 0) id = G.target;
    else if (Math.random() < (st.rate == null ? 0.5 : st.rate)) id = G.target;
    else id = pickDecoy(st);
    if (id === G.target && G.forceLeft > 0) G.forceLeft -= 1;
    const x1 = spawnX(st);
    addFlake(x1, id, st);
    if (st.burst && Math.random() < st.burst && st.colors.length > 1) {
      const decoy = pickDecoy(st);
      const side = Math.random() < 0.5 ? -1 : 1;
      addFlake(clamp(x1 + side * rand(54, 96), 46, VW - 46), decoy, st);
    }
  }

  function catchFlake(f) {
    f.alive = false;
    const c = col(f.color);
    addRing(f.x, MOUTH_Y + 4, c.rgb);
    if (G.mode === 'title') {
      if (f.color === G.target) {
        G.demoFill = Math.min(G.need, G.demoFill + 1);
        audio.catch(f.color);
      }
      emit(9, {
        x: f.x, y: MOUTH_Y + 6, j: 12,
        vx0: -70, vx1: 70, vy0: -120, vy1: -10,
        life: 0.45, r0: 1.1, r1: 2.8, rgb: c.rgb, g: 240
      });
      return;
    }
    if (G.mode !== 'play' || G.why) {
      emit(8, {
        x: f.x, y: MOUTH_Y + 6, j: 10,
        vx0: -60, vx1: 60, vy0: -100, vy1: -8,
        life: 0.4, r0: 1, r1: 2.6, rgb: c.rgb, g: 260
      });
      return;
    }
    if (f.color !== G.target) {
      beginWrong(f);
      return;
    }
    G.fill += 1;
    G.flame = 1.4;
    audio.catch(f.color);
    emit(12, {
      x: f.x, y: MOUTH_Y + 8, j: 14,
      vx0: -80, vx1: 80, vy0: -150, vy1: -20,
      life: 0.5, r0: 1.2, r1: 3.2, rgb: c.rgb, g: 220
    });
    if (G.fill >= G.need) {
      G.goldFlash = 0.7;
      clearStage();
    } else if (G.fill === G.need - 1) {
      toast('还差一片');
    }
    syncHud();
  }

  function missFlake(f) {
    f.alive = false;
    emit(6, {
      x: f.x, y: GROUND_Y - 6, j: 10,
      vx0: -40, vx1: 40, vy0: -50, vy1: -6,
      life: 0.38, r0: 1, r1: 2.4, rgb: col(f.color).rgb, g: 360
    });
    if (G.mode !== 'play' || G.why) return;
    if (f.color !== G.target) return;
    G.misses += 1;
    audio.miss();
    const left = G.missMax - G.misses;
    if (left <= 0) {
      beginMiss();
    } else if (left === 1) {
      toast('还能漏 1 片', true);
      setHint('同色雪别漏到地上', 'warn');
    } else if (G.misses === 1) {
      toast(col(G.target).name + '雪漏了 · 还能漏 ' + left + ' 片', true);
    }
    syncHud();
  }

  function beginWrong(f) {
    G.why = 'wrong';
    G.magFlash = 0.85;
    G.shake = 16;
    G.lock = 0.85;
    G.flame = 0.2;
    audio.wrong();
    toast('沾了异色', true);
    setHint('接错颜色，灯芯灭了一截', 'warn');
    emit(24, {
      x: f.x, y: MOUTH_Y + 8, j: 20,
      vx0: -160, vx1: 160, vy0: -180, vy1: 30,
      life: 0.7, r0: 1.6, r1: 4.2, rgb: C.pink.rgb, g: 480
    });
  }

  function beginMiss() {
    G.why = 'miss';
    G.magFlash = 0.55;
    G.shake = 10;
    G.lock = 0.8;
    audio.leak();
    toast('漏雪过多', true);
    setHint('该接的雪落到地上了', 'warn');
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    if (why === 'wrong') {
      showOverlay(
        'lose',
        '沾了',
        more
          ? '接错颜色，灯芯灭了一截。只接灯焰同色的雪。<br />还剩 ' + G.lives + ' 次。'
          : '接错颜色。十夜未完。',
        more ? '再试本夜' : '再来一局',
        'STAINED'
      );
    } else {
      showOverlay(
        'lose',
        '漏了',
        more
          ? '该接的雪落到地上了。灯口要对准同色。<br />还剩 ' + G.lives + ' 次。'
          : '同色雪漏完了。十夜未完。',
        more ? '再试本夜' : '再来一局',
        'MISSED'
      );
    }
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.9;
    G.goldFlash = 0.85;
    audio.clear();
    toast('这一夜接满了', false, true);
    emit(18, {
      x: G.lan.x, y: MOUTH_Y + 40, j: 24,
      vx0: -70, vx1: 70, vy0: -90, vy1: -8,
      life: 0.7, r0: 1.2, r1: 3.2, rgb: col(G.target).rgb, g: 160
    });
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '接满',
        '十夜灯火，一色不沾。',
        '再接一巡',
        'FULL LAMP'
      );
      setHint('十夜灯火', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 1.05;
  }

  function overlayAction() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win') {
      startRun();
      return;
    }
    if (G.mode === 'fail') {
      if (G.lives > 0) startStage(G.stage);
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
    for (let i = 0; i < 64; i++) {
      motes.push({
        x: rand(8, VW - 8),
        y: rand(0, VH),
        r: rand(0.6, 2.1),
        a: rand(0.08, 0.28),
        p: rand(0, TAU),
        s: rand(18, 56),
        drift: rand(-12, 12)
      });
    }
    gusts.length = 0;
    for (let i = 0; i < 10; i++) {
      gusts.push({
        x: rand(0, VW),
        y: rand(40, GROUND_Y - 40),
        w: rand(28, 70),
        a: rand(0.04, 0.12),
        s: rand(40, 90)
      });
    }
  }

  function updateLan(dt) {
    const b = lanBounds();
    const playing = G.mode === 'play' || G.mode === 'title';
    if (!playing) {
      G.lan.vx *= Math.exp(-dt * 6);
      G.lan.x = clamp(G.lan.x + G.lan.vx * dt, b.lo, b.hi);
      G.tilt = lerp(G.tilt, -G.lan.vx * 0.0009, 1 - Math.exp(-8 * dt));
      return;
    }
    const usePtr = pointer.down || pointer.hover;
    if (usePtr) {
      const tx = clamp(pointer.x, b.lo, b.hi);
      const nx = lerp(G.lan.x, tx, 1 - Math.exp(-16 * dt));
      G.lan.vx = (nx - G.lan.x) / Math.max(dt, 0.001);
      G.lan.x = nx;
    } else {
      let ax = 0;
      if (keys.l) ax -= LAN_ACC;
      if (keys.r) ax += LAN_ACC;
      G.lan.vx += ax * dt;
      if (!keys.l && !keys.r) G.lan.vx *= Math.exp(-dt * LAN_FRIC);
      G.lan.vx = clamp(G.lan.vx, -LAN_MAX, LAN_MAX);
      G.lan.x += G.lan.vx * dt;
    }
    if (G.lan.x < b.lo) {
      G.lan.x = b.lo;
      G.lan.vx *= 0.2;
    } else if (G.lan.x > b.hi) {
      G.lan.x = b.hi;
      G.lan.vx *= 0.2;
    }
    G.tilt = lerp(G.tilt, -G.lan.vx * 0.0011, 1 - Math.exp(-10 * dt));
    G.tilt = clamp(G.tilt, -0.16, 0.16);
  }

  function updateFlakes(dt) {
    const st = STAGES[G.stage] || STAGES[0];
    const w = windNow();
    const half = innerHalf();
    for (let i = flakes.length - 1; i >= 0; i--) {
      const f = flakes[i];
      if (!f.alive) {
        flakes.splice(i, 1);
        continue;
      }
      f.vx = lerp(f.vx, w + Math.sin(f.wob) * 22, 1 - Math.exp(-2.4 * dt));
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
      f.wob += f.wobSp * dt;
      if (f.x < 18) {
        f.x = 18;
        f.vx = Math.abs(f.vx) * 0.4;
      } else if (f.x > VW - 18) {
        f.x = VW - 18;
        f.vx = -Math.abs(f.vx) * 0.4;
      }
      const inMouth = f.y + f.r >= MOUTH_Y - 12 && f.y - f.r <= MOUTH_Y + 24;
      if (inMouth && Math.abs(f.x - G.lan.x) < half + f.r * 0.28) {
        catchFlake(f);
        flakes.splice(i, 1);
        continue;
      }
      if (f.y - f.r > GROUND_Y - 4) {
        missFlake(f);
        flakes.splice(i, 1);
      }
    }

    const spawning = (G.mode === 'play' && !G.why && G.fill < G.need && G.lock <= 0) || G.mode === 'title';
    if (spawning) {
      G.spawnT -= dt;
      if (G.spawnT <= 0) {
        const jitter = st.interval * rand(0.72, 1.22);
        G.spawnT = Math.max(0.22, jitter);
        spawnOne(st);
      }
    }
  }

  function maybeSwitch() {
    const st = STAGES[G.stage];
    if (!st || !st.switches || G.mode !== 'play' || G.why) return;
    while (G.switchI < st.switches.length && G.song >= st.switches[G.switchI].t) {
      const sw = st.switches[G.switchI];
      G.switchI += 1;
      if (sw.color !== G.target) setTarget(sw.color, true);
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.7);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.45);
    G.switchFlash = Math.max(0, G.switchFlash - dt * 1.3);
    G.lock = Math.max(0, G.lock - dt);
    G.flame = lerp(G.flame, 1, 1 - Math.exp(-3.2 * dt));
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
  }

  function nearestTarget() {
    let best = 9e9;
    let f = null;
    for (let i = 0; i < flakes.length; i++) {
      const d = flakes[i];
      if (!d.alive || d.color !== G.target) continue;
      const tleft = (MOUTH_Y - d.y) / Math.max(40, d.vy);
      const score = tleft + Math.abs(d.x - G.lan.x) * 0.004;
      if (tleft > -0.15 && score < best) {
        best = score;
        f = d;
      }
    }
    return f;
  }

  function decoyThreat() {
    const half = innerHalf();
    for (let i = 0; i < flakes.length; i++) {
      const d = flakes[i];
      if (!d.alive || d.color === G.target) continue;
      const tleft = (MOUTH_Y - d.y) / Math.max(40, d.vy);
      if (tleft > 0 && tleft < 0.42 && Math.abs(d.x - G.lan.x) < half + 8) return d;
    }
    return null;
  }

  function updateTitle(dt) {
    G.song += dt;
    updateFlakes(dt);
    const threat = decoyThreat();
    const tgt = nearestTarget();
    let tx = G.lan.x;
    if (threat) {
      tx = threat.x < G.lan.x ? threat.x + 90 : threat.x - 90;
    } else if (tgt) {
      tx = tgt.x;
    }
    const b = lanBounds();
    G.lan.x = lerp(G.lan.x, clamp(tx, b.lo, b.hi), 1 - Math.exp(-3.4 * dt));
    G.lan.vx = 0;
    if (G.demoFill >= G.need && flakes.length === 0) {
      G.demoFill = 0;
      G.song = 0;
    }
  }

  function updatePlay(dt) {
    G.song += dt;
    updateLan(dt);
    maybeSwitch();
    if (!G.why || G.lock > 0) updateFlakes(dt);
    if (G.why && G.lock <= 0) failStage(G.why);
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      G.settle -= dt;
      updateLan(dt);
      updateFlakes(dt);
      if (G.settle <= 0) startStage(G.stage + 1);
    } else {
      updateLan(dt);
      updateFlakes(dt);
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

  function drawCrystal(x, y, r, rot, rgb, glow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.7);
    g.addColorStop(0, rgba(rgb, 0.5 * glow));
    g.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.7, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.lineWidth = Math.max(1.05 * scale, r * 0.15);
    ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r);
      ctx.moveTo(0, -r * 0.42);
      ctx.lineTo(-r * 0.28, -r * 0.64);
      ctx.moveTo(0, -r * 0.42);
      ctx.lineTo(r * 0.28, -r * 0.64);
      ctx.moveTo(0, -r * 0.72);
      ctx.lineTo(-r * 0.16, -r * 0.9);
      ctx.moveTo(0, -r * 0.72);
      ctx.lineTo(r * 0.16, -r * 0.9);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,' + (0.55 + glow * 0.3) + ')';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.16, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createRadialGradient(sx(86), sy(36), 8 * scale, sx(86), sy(36), 280 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.14)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(70), 8 * scale, sx(400), sy(70), 270 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    g2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    const sky = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    sky.addColorStop(0, '#070318');
    sky.addColorStop(0.55, '#05030c');
    sky.addColorStop(1, '#080616');
    ctx.fillStyle = sky;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const moonX = sx(392);
    const moonY = sy(78);
    const mg = ctx.createRadialGradient(moonX, moonY, 4 * scale, moonX, moonY, 70 * scale);
    mg.addColorStop(0, 'rgba(0, 240, 255, 0.22)');
    mg.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 70 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d8fbff';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 16 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(moonX + 7 * scale, moonY - 3 * scale, 12 * scale, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#0a0820';
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(GROUND_Y - 8));
    ctx.lineTo(sx(70), sy(430));
    ctx.lineTo(sx(150), sy(498));
    ctx.lineTo(sx(240), sy(410));
    ctx.lineTo(sx(340), sy(490));
    ctx.lineTo(sx(430), sy(428));
    ctx.lineTo(sx(VW), sy(GROUND_Y - 8));
    ctx.lineTo(sx(VW), sy(VH));
    ctx.lineTo(sx(0), sy(VH));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#070516';
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(GROUND_Y + 4));
    ctx.lineTo(sx(90), sy(510));
    ctx.lineTo(sx(190), sy(560));
    ctx.lineTo(sx(300), sy(500));
    ctx.lineTo(sx(400), sy(548));
    ctx.lineTo(sx(VW), sy(505));
    ctx.lineTo(sx(VW), sy(VH));
    ctx.lineTo(sx(0), sy(VH));
    ctx.closePath();
    ctx.fill();

    const w = windNow();
    for (let i = 0; i < gusts.length; i++) {
      const u = gusts[i];
      const x = ((u.x + G.clock * u.s * 0.2 + w * 0.35) % (VW + 80)) - 40;
      ctx.strokeStyle = 'rgba(0, 240, 255,' + u.a + ')';
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(u.y));
      ctx.lineTo(sx(x + u.w), sy(u.y + Math.sin(G.clock + i) * 6));
      ctx.stroke();
    }

    const gy = sy(GROUND_Y);
    const gg = ctx.createLinearGradient(sx(0), gy - 24 * scale, sx(0), sy(VH));
    gg.addColorStop(0, 'rgba(180, 230, 255, 0.08)');
    gg.addColorStop(0.12, '#12101c');
    gg.addColorStop(1, '#05030c');
    ctx.fillStyle = gg;
    ctx.fillRect(sx(0), gy - 18 * scale, VW * scale, sy(VH) - (gy - 18 * scale));

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(18), sy(GROUND_Y));
    ctx.lineTo(sx(VW - 18), sy(GROUND_Y));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.14)';
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(40), sy(GROUND_Y + 10));
    ctx.lineTo(sx(VW - 40), sy(GROUND_Y + 10));
    ctx.stroke();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(36), sy(MOUTH_Y + 92));
    ctx.lineTo(sx(VW - 36), sy(MOUTH_Y + 92));
    ctx.stroke();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = (m.x + Math.sin(G.clock * 0.5 + m.p) * 16 + w * 0.12 * m.drift) % VW;
      const y = (m.y + G.clock * m.s) % (VH + 20);
      ctx.fillStyle = 'rgba(210, 235, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(sx(x < 0 ? x + VW : x), sy(y), m.r * scale, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawGhosts() {
    const half = innerHalf();
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      if (!f.alive) continue;
      const over = Math.abs(f.x - G.lan.x) < half + 6;
      const match = f.color === G.target;
      const rgb = col(f.color).rgb;
      let a = 0.14;
      if (over && match) a = 0.38;
      else if (over && !match) a = 0.42;
      else if (match) a = 0.22;
      ctx.strokeStyle = rgba(rgb, a);
      ctx.lineWidth = 1.15 * scale;
      ctx.setLineDash([4 * scale, 5 * scale]);
      ctx.beginPath();
      ctx.moveTo(sx(f.x), sy(f.y + 10));
      ctx.lineTo(sx(f.x), sy(MOUTH_Y));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = rgba(rgb, a * 0.9);
      ctx.beginPath();
      ctx.ellipse(sx(f.x), sy(MOUTH_Y + 3), 9 * scale, 3.2 * scale, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFlakes() {
    const st = STAGES[G.stage] || STAGES[0];
    const mark = st.mark == null ? 0 : st.mark;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      if (!f.alive) continue;
      const c = col(f.color);
      const match = f.color === G.target;
      const glow = match ? 1 : 0.72;
      drawCrystal(sx(f.x), sy(f.y), f.r * scale, f.rot, c.rgb, glow);
      if (match && mark > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(c.rgb, 0.28 * mark);
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.arc(sx(f.x), sy(f.y), (f.r + 5 + Math.sin(G.clock * 6) * 1.5) * scale, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function lanternDanger() {
    const half = innerHalf();
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      if (!f.alive || f.color === G.target) continue;
      if (f.y > MOUTH_Y - 70 && f.y < MOUTH_Y + 18 && Math.abs(f.x - G.lan.x) < half + f.r) return true;
    }
    return false;
  }

  function drawLantern() {
    const xw = G.lan.x;
    const x = sx(xw);
    const mouth = sy(MOUTH_Y);
    const c = col(G.target);
    const danger = lanternDanger();
    const rgb = danger ? C.pink.rgb : c.rgb;
    const topH = G.lan.w * 0.5 * scale;
    const bodyH = 86 * scale;
    const flame = G.flame * (0.82 + Math.sin(G.clock * 7.4) * 0.08);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    ctx.translate(x, sy(GROUND_Y));
    ctx.rotate(G.tilt);
    ctx.translate(-x, -sy(GROUND_Y));

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 3.2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, mouth + 78 * scale);
    ctx.lineTo(x, sy(GROUND_Y - 4));
    ctx.stroke();

    ctx.fillStyle = '#141022';
    ctx.strokeStyle = rgba(rgb, 0.7);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.ellipse(x, sy(GROUND_Y - 2), 16 * scale, 5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    const glow = ctx.createRadialGradient(x, mouth + 40 * scale, 4 * scale, x, mouth + 36 * scale, 70 * scale);
    glow.addColorStop(0, rgba(rgb, 0.22 * flame));
    glow.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, mouth + 38 * scale, 70 * scale, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - topH * 0.92, mouth + 10 * scale);
    ctx.quadraticCurveTo(x - topH * 1.02, mouth + bodyH * 0.5, x - topH * 0.62, mouth + bodyH);
    ctx.quadraticCurveTo(x, mouth + bodyH + 10 * scale, x + topH * 0.62, mouth + bodyH);
    ctx.quadraticCurveTo(x + topH * 1.02, mouth + bodyH * 0.5, x + topH * 0.92, mouth + 10 * scale);
    ctx.closePath();
    ctx.fillStyle = '#12081c';
    ctx.fill();
    ctx.strokeStyle = rgba(rgb, 0.85);
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    ctx.save();
    ctx.clip();
    ctx.strokeStyle = rgba(rgb, 0.28);
    ctx.lineWidth = 1.2 * scale;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * topH * 0.28, mouth + 12 * scale);
      ctx.quadraticCurveTo(x + i * topH * 0.22, mouth + bodyH * 0.55, x + i * topH * 0.16, mouth + bodyH - 4 * scale);
      ctx.stroke();
    }
    ctx.restore();

    const fr = 11 * scale * flame;
    const fy = mouth + 40 * scale;
    const fg = ctx.createRadialGradient(x - fr * 0.15, fy - fr * 0.3, fr * 0.1, x, fy, fr * 1.6);
    fg.addColorStop(0, 'rgba(255,255,255,0.95)');
    fg.addColorStop(0.35, rgba(rgb, 0.95));
    fg.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(x, fy, fr * 0.7, fr * 1.25, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.lineWidth = 3.4 * scale;
    ctx.beginPath();
    ctx.ellipse(x, mouth, topH * 0.98, 7.5 * scale, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.ellipse(x, mouth - 1.2 * scale, topH * 0.9, 5.2 * scale, 0, 0, TAU);
    ctx.stroke();

    if (danger) {
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.7)';
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.ellipse(x, mouth, (topH + 6 * scale), 11 * scale, 0, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, 0.15 + a * 0.7);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale * (0.5 + a), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.55;
      ctx.strokeStyle = rgba(r.rgb, 0.55 * (1 - k));
      ctx.lineWidth = 2 * scale * (1 - k * 0.4);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (12 + k * 34) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBanner() {
    const c = col(G.target);
    const y = sy(36);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    ctx.font = '700 ' + Math.round(13 * scale) + 'px "Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = rgba(c.rgb, 0.18 + G.switchFlash * 0.4);
    roundRect(ctx, sx(VW * 0.5 - 78), sy(22), 156 * scale, 28 * scale, 14 * scale);
    ctx.fill();
    ctx.strokeStyle = rgba(c.rgb, 0.45 + G.switchFlash * 0.4);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.fillStyle = '#e8faff';
    ctx.shadowColor = rgba(c.rgb, 0.7);
    ctx.shadowBlur = 10 * scale;
    ctx.fillText('只接  ' + c.name, sx(VW * 0.5), y);
    ctx.restore();
  }

  function drawVignette() {
    if (G.magFlash > 0.02) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.magFlash * 0.18) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0.02) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (G.goldFlash * 0.1) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.switchFlash > 0.02) {
      const c = col(G.target);
      ctx.fillStyle = rgba(c.rgb, G.switchFlash * 0.1);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    drawBg();
    const shx = G.shake > 0 ? rand(-G.shake, G.shake) * scale * 0.35 : 0;
    const shy = G.shake > 0 ? rand(-G.shake, G.shake) * scale * 0.25 : 0;
    ctx.save();
    ctx.translate(shx, shy);
    drawGhosts();
    drawLantern();
    drawFlakes();
    drawParticles();
    if (G.mode !== 'title') drawBanner();
    ctx.restore();
    drawVignette();
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowLeft' || k === 'ArrowRight' || k === ' ' || k === 'Spacebar') e.preventDefault();
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
