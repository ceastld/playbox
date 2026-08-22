'use strict';

(function () {
  const VW = 480;
  const VH = 800;
  const CX = 240;
  const GROUND = 718;
  const MARGIN = 34;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-jar-firefly-mute';
  const ACC = 2140;
  const MAX_SPD = 276;
  const FRIC = 7.6;
  const GOLD = [255, 227, 107];
  const MAG = [255, 61, 184];
  const OPS = 'WASD / 方向键移罐 · 空格放走 · 拖动 / 轻点 · M 静音';

  const STAGES = [
    {
      name: '初捉', sub: 'FIRST', hint: '把罐口伸到金萤下面，舀进去',
      toast: '金光慢闪的是真萤', time: 42, need: 2, mouth: 34, fuse: 2.6, spd: 0.52,
      flies: [
        { x: 148, y: 250, real: true },
        { x: 348, y: 340, real: true }
      ]
    },
    {
      name: '识假', sub: 'FAKE', hint: '假萤粉芯乱闪。舀到就空格放走',
      toast: '捉住假的立刻甩出去', time: 44, need: 2, mouth: 32, fuse: 2.4, spd: 0.58,
      flies: [
        { x: 120, y: 220, real: true },
        { x: 360, y: 300, real: true },
        { x: 240, y: 168, real: false }
      ]
    },
    {
      name: '夜草', sub: 'MEADOW', hint: '真的慢闪，假的乱闪。先舀金的',
      toast: '罐里有假萤会裂', time: 46, need: 3, mouth: 30, fuse: 2.2, spd: 0.66,
      flies: [
        { x: 88, y: 260, real: true },
        { x: 240, y: 180, real: true },
        { x: 392, y: 310, real: true },
        { x: 160, y: 420, real: false },
        { x: 330, y: 140, real: false }
      ]
    },
    {
      name: '双色', sub: 'PAIR', hint: '假萤会贴着真萤飞，看芯再舀',
      toast: '贴飞的那只看粉芯', time: 48, need: 3, mouth: 28, fuse: 2.05, spd: 0.74,
      flies: [
        { x: 110, y: 210, real: true },
        { x: 250, y: 280, real: true },
        { x: 380, y: 190, real: true },
        { x: 70, y: 360, real: true },
        { x: 200, y: 150, real: false },
        { x: 300, y: 360, real: false },
        { x: 140, y: 470, real: false }
      ]
    },
    {
      name: '穿风', sub: 'WIND', hint: '青带有横风，提前迎上去舀',
      toast: '风会把萤吹偏', time: 50, need: 4, mouth: 28, fuse: 1.95, spd: 0.78,
      winds: [{ y: 250, h: 110, vx: 92, osc: 28, period: 2.8, ph: 0 }],
      flies: [
        { x: 90, y: 200, real: true },
        { x: 180, y: 320, real: true },
        { x: 300, y: 170, real: true },
        { x: 390, y: 360, real: true },
        { x: 230, y: 460, real: true },
        { x: 140, y: 120, real: false },
        { x: 260, y: 430, real: false },
        { x: 360, y: 250, real: false }
      ]
    },
    {
      name: '密萤', sub: 'DENSE', hint: '罐口更窄，对准金光再伸',
      toast: '对准再舀，别扫进假的', time: 50, need: 4, mouth: 22, fuse: 1.85, spd: 0.84,
      flies: [
        { x: 80, y: 180, real: true },
        { x: 170, y: 260, real: true },
        { x: 280, y: 150, real: true },
        { x: 370, y: 300, real: true },
        { x: 230, y: 380, real: true },
        { x: 120, y: 420, real: false },
        { x: 320, y: 210, real: false },
        { x: 400, y: 140, real: false },
        { x: 210, y: 90, real: false }
      ]
    },
    {
      name: '拟真', sub: 'MIMIC', hint: '假萤会装金，看芯是不是粉星',
      toast: '芯里有粉星就是假的', time: 52, need: 5, mouth: 24, fuse: 1.75, spd: 0.88,
      flies: [
        { x: 90, y: 160, real: true },
        { x: 170, y: 250, real: true },
        { x: 260, y: 140, real: true },
        { x: 350, y: 280, real: true },
        { x: 210, y: 360, real: true },
        { x: 420, y: 400, real: true },
        { x: 130, y: 320, real: false, mimic: true },
        { x: 300, y: 190, real: false, mimic: true },
        { x: 400, y: 110, real: false, mimic: true },
        { x: 70, y: 430, real: false, mimic: true }
      ]
    },
    {
      name: '乱舞', sub: 'SWARM', hint: '有的会冲。等它停再舀',
      toast: '冲过来的先别伸罐', time: 54, need: 5, mouth: 23, fuse: 1.65, spd: 0.94,
      flies: [
        { x: 80, y: 150, real: true },
        { x: 160, y: 240, real: true },
        { x: 250, y: 120, real: true },
        { x: 340, y: 270, real: true },
        { x: 420, y: 180, real: true },
        { x: 200, y: 360, real: true, dart: true },
        { x: 110, y: 400, real: false, dart: true },
        { x: 290, y: 200, real: false, mimic: true },
        { x: 380, y: 90, real: false, dart: true },
        { x: 60, y: 280, real: false, mimic: true },
        { x: 330, y: 430, real: false }
      ]
    },
    {
      name: '月诱', sub: 'MOON', hint: '真萤会被月拉走，早点捉',
      toast: '别让金萤飞出夜空', time: 56, need: 6, mouth: 24, fuse: 1.55, spd: 0.9,
      moonPull: 22,
      winds: [{ y: 180, h: 90, vx: -70, osc: 22, period: 3.1, ph: 0.4 }],
      flies: [
        { x: 70, y: 220, real: true },
        { x: 150, y: 310, real: true },
        { x: 240, y: 180, real: true },
        { x: 330, y: 260, real: true },
        { x: 410, y: 340, real: true },
        { x: 190, y: 430, real: true },
        { x: 80, y: 480, real: true },
        { x: 100, y: 140, real: false, mimic: true },
        { x: 280, y: 100, real: false, dart: true },
        { x: 370, y: 200, real: false, mimic: true },
        { x: 50, y: 380, real: false },
        { x: 300, y: 460, real: false, mimic: true }
      ]
    },
    {
      name: '夜宴', sub: 'FEST', hint: '风、拟真、乱冲都来了。看芯，甩假，舀真',
      toast: '终夜 · 罐满即胜', time: 60, need: 6, mouth: 21, fuse: 1.42, spd: 1.02,
      moonPull: 16,
      winds: [
        { y: 210, h: 86, vx: 88, osc: 26, period: 2.4, ph: 0 },
        { y: 390, h: 70, vx: -76, osc: 18, period: 2.1, ph: 1.1 }
      ],
      flies: [
        { x: 70, y: 160, real: true },
        { x: 140, y: 250, real: true },
        { x: 220, y: 130, real: true },
        { x: 300, y: 280, real: true },
        { x: 380, y: 190, real: true },
        { x: 180, y: 380, real: true },
        { x: 420, y: 360, real: true, dart: true },
        { x: 90, y: 90, real: false, mimic: true, dart: true },
        { x: 260, y: 200, real: false, mimic: true },
        { x: 340, y: 90, real: false, dart: true },
        { x: 50, y: 320, real: false, mimic: true },
        { x: 310, y: 450, real: false },
        { x: 400, y: 120, real: false, mimic: true }
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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = {
    down: false, hover: false, touch: false, x: CX, y: 560, id: null,
    sx: 0, sy: 0, st: 0, moved: false
  };

  const particles = [];
  const motes = [];
  const stars = [];
  const reeds = [];
  const pips = [];
  const rings = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    need: 2,
    caught: 0,
    time: 42,
    timeMax: 42,
    mouth: 32,
    fuse: 2.2,
    spd: 0.6,
    moonPull: 0,
    px: CX,
    py: 560,
    pvx: 0,
    pvy: 0,
    flies: [],
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    lock: 0,
    settle: 0,
    toastT: 0,
    why: '',
    taught: false,
    fakeTaught: false,
    dumpPop: 0,
    whooshT: 0,
    warnT: 0,
    pulse: 0,
    rattle: 0
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
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
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
    start() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 659);
      this.beep(784, 0.16, 'triangle', 0.03, 1046);
    },
    catchReal() {
      this.ensure();
      this.beep(659, 0.08, 'sine', 0.05, 880);
      this.beep(988, 0.14, 'triangle', 0.035, 1318);
    },
    catchFake() {
      this.ensure();
      this.beep(220, 0.1, 'square', 0.035, 140);
      this.beep(180, 0.16, 'sawtooth', 0.02, 90);
    },
    dump() {
      this.ensure();
      this.noise(0.1, 0.03, 1200);
      this.beep(520, 0.08, 'sine', 0.03, 240);
    },
    warn() {
      this.ensure();
      this.beep(196, 0.06, 'sine', 0.028, 120);
    },
    crack() {
      this.ensure();
      this.noise(0.22, 0.08, 380);
      this.beep(110, 0.28, 'sawtooth', 0.05, 48);
    },
    lost() {
      this.ensure();
      this.beep(330, 0.12, 'sine', 0.03, 180);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.055, 523);
      this.beep(659, 0.12, 'sine', 0.045, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.05);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.32, 'triangle', 0.065, 1560);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 170) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.5, spec.j * 0.5),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.18),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        cyan: !!spec.cyan,
        g: spec.g == null ? 42 : spec.g
      });
    }
  }

  function addRing(x, y, mag) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag, gold: !mag });
    if (rings.length > 22) rings.shift();
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

  function countCaught() {
    let n = 0;
    for (let i = 0; i < G.flies.length; i++) {
      const f = G.flies[i];
      if (f.real && f.caught && !f.gone) n += 1;
    }
    return n;
  }

  function countFakesIn() {
    let n = 0;
    for (let i = 0; i < G.flies.length; i++) {
      const f = G.flies[i];
      if (!f.real && f.caught && !f.gone) n += 1;
    }
    return n;
  }

  function hope() {
    let n = G.caught;
    for (let i = 0; i < G.flies.length; i++) {
      const f = G.flies[i];
      if (f.real && !f.caught && !f.gone) n += 1;
    }
    return n;
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const need = G.need;
    const fill = G.caught;
    const k = need ? clamp(fill / need, 0, 1) : 0;
    const fakes = countFakesIn();
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = fill + '/' + need;
    fillWrap.classList.toggle('hot', G.mode === 'play' && fill >= need);
    fillWrap.classList.toggle('warn', G.mode === 'play' && (fakes > 0 || G.time < 8));
    if (G.mode === 'title') {
      stageLabel.textContent = '十夜';
      leftLabel.textContent = '舀金放假';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 夜 · ' + (st ? st.name : '');
      leftLabel.textContent = fakes > 0
        ? ('假 ' + fakes + ' · ' + Math.max(0, Math.ceil(G.time)) + 's')
        : (Math.max(0, Math.ceil(G.time)) + 's');
    }
    stageLabel.classList.toggle('hot', G.mode === 'play' && fill >= need);
    leftLabel.classList.toggle('warn', G.mode === 'play' && (fakes > 0 || G.time < 8));
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

  function windAt(y) {
    const st = STAGES[G.stage];
    if (!st || !st.winds) return 0;
    let wx = 0;
    for (let i = 0; i < st.winds.length; i++) {
      const b = st.winds[i];
      if (y >= b.y && y <= b.y + b.h) {
        wx += b.vx + Math.sin(G.clock * TAU / (b.period || 3) + (b.ph || 0)) * (b.osc || 0);
      }
    }
    return wx;
  }

  function spawnFly(spec) {
    return {
      x: spec.x,
      y: spec.y,
      vx: rand(-18, 18),
      vy: rand(-10, 10),
      real: !!spec.real,
      mimic: !!spec.mimic,
      dart: !!spec.dart,
      phase: rand(0, TAU),
      blink: rand(0, TAU),
      wing: rand(0, TAU),
      caught: false,
      gone: false,
      perchA: rand(0, TAU),
      perchR: rand(5.5, 11.5),
      perchT: 0,
      fakeT: 0,
      inv: 0.28,
      age: 0,
      tx: spec.x + rand(-40, 40),
      ty: spec.y + rand(-30, 30),
      retarget: rand(0.3, 1.1),
      dashT: spec.dart ? rand(0.8, 2.2) : 99,
      glow: spec.real ? 1 : 0.7
    };
  }

  function applyStage(st) {
    G.need = st.need;
    G.time = st.time;
    G.timeMax = st.time;
    G.mouth = st.mouth;
    G.fuse = st.fuse;
    G.spd = st.spd;
    G.moonPull = st.moonPull || 0;
    G.caught = 0;
    G.flies = st.flies.map(spawnFly);
    G.why = '';
    G.fakeTaught = false;
    G.dumpPop = 0;
    G.rattle = 0;
  }

  function resetPlayer() {
    G.px = CX;
    G.py = 580;
    G.pvx = 0;
    G.pvy = 0;
  }

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.2;
    G.settle = 0;
    G.taught = G.taught && fromFail;
    applyStage(STAGES[i]);
    resetPlayer();
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].toast || STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.taught = false;
    startStage(0, false);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    applyStage(STAGES[0]);
    resetPlayer();
    showOverlay(
      'title',
      '萤罐',
      '金光慢闪是真萤，粉芯乱闪是假的。<br />舀进罐里，假的要立刻放走。',
      '捉萤',
      'JAR',
      OPS
    );
    setHint('金萤舀进罐 · 假萤空格放走', '');
    syncHud();
  }

  function catchFly(f) {
    if (f.caught || f.gone) return;
    f.caught = true;
    f.perchT = 0;
    f.perchA = rand(0, TAU);
    f.fakeT = 0;
    addRing(G.px, G.py, !f.real);
    if (f.real) {
      G.caught = countCaught();
      G.goldFlash = Math.max(G.goldFlash, 0.32);
      G.pulse = 1;
      emit(10, {
        x: f.x, y: f.y, j: 8,
        vx0: -50, vx1: 50, vy0: -70, vy1: -8,
        life: 0.5, r0: 1.1, r1: 2.6, gold: true, g: -20
      });
      if (G.mode === 'play') {
        audio.catchReal();
        if (!G.taught) {
          G.taught = true;
          toast('真萤进罐', false, true);
        } else if (G.caught >= G.need) {
          toast('满罐 ' + G.caught + '/' + G.need, false, true);
        }
      }
    } else {
      G.magFlash = Math.max(G.magFlash, 0.28);
      G.rattle = Math.max(G.rattle, 0.18);
      emit(12, {
        x: f.x, y: f.y, j: 8,
        vx0: -70, vx1: 70, vy0: -50, vy1: 30,
        life: 0.48, r0: 1.1, r1: 2.8, mag: true, g: 30
      });
      if (G.mode === 'play') {
        audio.catchFake();
        if (!G.fakeTaught) {
          G.fakeTaught = true;
          toast('假的！空格 / 轻点放走', true);
          setHint('空格或轻点，把假萤甩出罐', 'warn');
        } else {
          toast('假萤进罐', true);
        }
      }
    }
    syncHud();
  }

  function dumpFakes() {
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.lock > 0 && G.mode === 'play') return;
    let n = 0;
    for (let i = 0; i < G.flies.length; i++) {
      const f = G.flies[i];
      if (f.real || !f.caught || f.gone) continue;
      f.caught = false;
      f.gone = true;
      f.x = G.px + rand(-8, 8);
      f.y = G.py - 10;
      f.vx = rand(-90, 90) + G.pvx * 0.2;
      f.vy = rand(-240, -150);
      n += 1;
      emit(8, {
        x: f.x, y: f.y, j: 10,
        vx0: -80, vx1: 80, vy0: -160, vy1: -40,
        life: 0.45, r0: 1, r1: 2.4, mag: true, cyan: true, g: -40
      });
    }
    if (n > 0) {
      G.dumpPop = 1;
      G.rattle = 0;
      addRing(G.px, G.py - 8, true);
      audio.dump();
      if (G.mode === 'play') {
        toast('放走假萤', false, false);
        setHint(STAGES[G.stage].hint, '');
      }
      syncHud();
    }
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    const map = {
      crack: ['罐裂', '假萤在罐里炸开，玻璃碎了。', 'CRACK'],
      time: ['夜尽', '天要亮了，真萤还没收齐。', 'DAWN'],
      lost: ['飞走', '金萤飞出夜空，凑不齐一罐。', 'FLED']
    };
    const m = map[why] || map.lost;
    showOverlay(
      'lose',
      m[0],
      more
        ? m[1] + '<br />还剩 ' + G.lives + ' 次。'
        : m[1] + '<br />十夜未完。',
      more ? '再捉本夜' : '再来一局',
      m[2]
    );
    setHint(m[0], 'warn');
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.9;
    G.goldFlash = 0.85;
    audio.clear();
    toast(STAGES[G.stage].name + ' · 满罐', false, true);
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '萤满罐',
        '十夜金萤都进了罐，假的一颗不留。',
        '再捉一巡',
        'GLOW'
      );
      setHint('十夜萤满罐', 'hot');
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
      if (G.lives > 0) startStage(G.stage, true);
      else startRun();
    }
  }

  function beginFail(why) {
    if (G.mode !== 'play' || G.why) return;
    G.why = why;
    G.magFlash = 0.72;
    G.shake = 14;
    G.lock = 0.78;
    if (why === 'crack') audio.crack();
    else audio.lost();
    const msg = why === 'crack' ? '罐裂了'
      : why === 'time' ? '夜尽了'
      : '金萤飞走了';
    toast(msg, true);
    setHint(msg, 'warn');
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
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

  function seedDecor() {
    motes.length = 0;
    stars.length = 0;
    reeds.length = 0;
    for (let i = 0; i < 46; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(40, GROUND - 40),
        r: rand(0.5, 1.6),
        a: rand(0.04, 0.16),
        p: rand(0, TAU),
        s: rand(7, 20)
      });
    }
    for (let i = 0; i < 52; i++) {
      stars.push({
        x: rand(10, VW - 10),
        y: rand(10, 380),
        r: rand(0.45, 1.45),
        a: rand(0.22, 0.85),
        p: rand(0, TAU),
        tw: rand(1.1, 3.3)
      });
    }
    for (let i = 0; i < 36; i++) {
      reeds.push({
        x: 8 + i * (VW / 35),
        h: rand(22, 54),
        p: rand(0, TAU),
        w: rand(1.1, 2.2),
        mag: i % 5 === 0
      });
    }
  }

  function updatePlayer(dt, auto) {
    const playing = G.mode === 'play' || G.mode === 'title';
    const loX = MARGIN;
    const hiX = VW - MARGIN;
    const loY = 70;
    const hiY = GROUND - 78;

    if (!playing) {
      G.pvx *= Math.exp(-dt * 6);
      G.pvy *= Math.exp(-dt * 6);
      G.px = clamp(G.px + G.pvx * dt, loX, hiX);
      G.py = clamp(G.py + G.pvy * dt, loY, hiY);
      return;
    }

    if (auto) {
      let tx = CX;
      let ty = 560;
      let best = 1e9;
      for (let i = 0; i < G.flies.length; i++) {
        const f = G.flies[i];
        if (!f.real || f.caught || f.gone) continue;
        const d = hypot2(f.x - G.px, f.y - G.py);
        if (d < best) {
          best = d;
          tx = f.x;
          ty = f.y + 18;
        }
      }
      G.px = lerp(G.px, tx, 1 - Math.exp(-2.2 * dt));
      G.py = lerp(G.py, ty, 1 - Math.exp(-2.0 * dt));
      G.pvx = 0;
      G.pvy = 0;
      return;
    }

    const usePtr = pointer.down || pointer.hover;
    if (usePtr) {
      let tx = pointer.x;
      let ty = pointer.y;
      if (pointer.touch) ty -= 42;
      tx = clamp(tx, loX, hiX);
      ty = clamp(ty, loY, hiY);
      const nx = lerp(G.px, tx, 1 - Math.exp(-13.5 * dt));
      const ny = lerp(G.py, ty, 1 - Math.exp(-13.5 * dt));
      G.pvx = (nx - G.px) / Math.max(dt, 0.001);
      G.pvy = (ny - G.py) / Math.max(dt, 0.001);
      G.px = nx;
      G.py = ny;
    } else {
      let ax = 0;
      let ay = 0;
      if (keys.l) ax -= ACC;
      if (keys.r) ax += ACC;
      if (keys.u) ay -= ACC;
      if (keys.d) ay += ACC;
      G.pvx += ax * dt;
      G.pvy += ay * dt;
      if (!keys.l && !keys.r) G.pvx *= Math.exp(-dt * FRIC);
      if (!keys.u && !keys.d) G.pvy *= Math.exp(-dt * FRIC);
      const spd = hypot2(G.pvx, G.pvy);
      if (spd > MAX_SPD) {
        G.pvx *= MAX_SPD / spd;
        G.pvy *= MAX_SPD / spd;
      }
      G.px += G.pvx * dt;
      G.py += G.pvy * dt;
    }

    if (G.px < loX) { G.px = loX; G.pvx *= 0.2; }
    if (G.px > hiX) { G.px = hiX; G.pvx *= 0.2; }
    if (G.py < loY) { G.py = loY; G.pvy *= 0.2; }
    if (G.py > hiY) { G.py = hiY; G.pvy *= 0.2; }
  }

  function flyGlow(f) {
    if (f.real) {
      return 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(G.clock * 2.15 + f.phase));
    }
    const stutter = Math.sin(G.clock * 18 + f.blink);
    const gate = Math.sin(G.clock * 7.4 + f.phase);
    if (f.mimic) {
      const base = 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(G.clock * 2.4 + f.phase));
      return gate > 0.35 ? base : (stutter > 0.2 ? 0.95 : 0.12);
    }
    return stutter > -0.15 ? (0.45 + 0.55 * Math.abs(gate)) : 0.08;
  }

  function updateFlies(dt, canFail) {
    const mouthR = G.mouth;
    let hottestFake = 0;

    for (let i = 0; i < G.flies.length; i++) {
      const f = G.flies[i];
      f.age += dt;
      f.inv = Math.max(0, f.inv - dt);
      f.glow = flyGlow(f);

      if (f.gone) {
        if (f.caught) continue;
        f.vy += -40 * dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        continue;
      }

      if (f.caught) {
        f.perchT += dt;
        f.perchA += dt * (f.real ? 1.7 : 6.4);
        const ratt = G.rattle > 0 ? Math.sin(G.clock * 42) * G.rattle * 3.2 : 0;
        const oxp = Math.cos(f.perchA) * f.perchR * 0.55;
        const oyp = 20 + Math.sin(f.perchA * 1.15) * f.perchR * 0.38;
        f.x = lerp(f.x, G.px + oxp + ratt, 1 - Math.exp(-14 * dt));
        f.y = lerp(f.y, G.py + oyp - G.dumpPop * 6, 1 - Math.exp(-14 * dt));
        if (!f.real) {
          f.fakeT += dt;
          hottestFake = Math.max(hottestFake, f.fakeT / G.fuse);
          if (canFail && f.fakeT > G.fuse * 0.62 && G.warnT <= 0) {
            audio.warn();
            G.warnT = 0.45;
            toast('罐要裂了', true);
          }
          if (canFail && f.fakeT >= G.fuse) {
            emit(22, {
              x: G.px, y: G.py + 18, j: 16,
              vx0: -180, vx1: 180, vy0: -160, vy1: 90,
              life: 0.7, r0: 1.4, r1: 3.6, mag: true, g: 80
            });
            addRing(G.px, G.py + 16, true);
            beginFail('crack');
          }
        }
        continue;
      }

      f.retarget -= dt;
      if (f.retarget <= 0) {
        f.tx = rand(48, VW - 48);
        f.ty = rand(90, GROUND - 120);
        f.retarget = rand(1.1, 2.6);
      }
      f.dashT -= dt;
      if (f.dart && f.dashT <= 0) {
        const ang = rand(0, TAU);
        const dist = rand(90, 170);
        f.tx = clamp(f.x + Math.cos(ang) * dist, 48, VW - 48);
        f.ty = clamp(f.y + Math.sin(ang) * dist, 80, GROUND - 110);
        f.vx += Math.cos(ang) * 160;
        f.vy += Math.sin(ang) * 120;
        f.dashT = rand(1.6, 3.2);
      }

      const k = (f.real ? 1.15 : 1.45) * G.spd;
      f.vx += (f.tx - f.x) * k * dt;
      f.vy += (f.ty - f.y) * k * dt;
      f.vx += Math.sin(f.age * 2.1 + f.phase) * 38 * dt;
      f.vy += Math.cos(f.age * 1.6 + f.phase) * 26 * dt;
      f.vx += windAt(f.y) * dt;

      if (f.real && G.moonPull) {
        f.vy -= G.moonPull * dt;
        f.vx += (392 - f.x) * 0.12 * dt;
      }

      f.vx *= Math.exp(-dt * 1.55);
      f.vy *= Math.exp(-dt * 1.55);
      const cap = f.dart ? 210 : 150;
      const spd = hypot2(f.vx, f.vy);
      if (spd > cap) {
        f.vx *= cap / spd;
        f.vy *= cap / spd;
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      if (f.x < 22) { f.x = 22; f.vx = Math.abs(f.vx) * 0.4; }
      if (f.x > VW - 22) { f.x = VW - 22; f.vx = -Math.abs(f.vx) * 0.4; }
      if (f.y > GROUND - 70) { f.y = GROUND - 70; f.vy = Math.min(f.vy, -8); }

      if (f.real && f.y < 18) {
        f.gone = true;
        emit(8, {
          x: f.x, y: 24, j: 8,
          vx0: -40, vx1: 40, vy0: -80, vy1: -10,
          life: 0.5, r0: 1, r1: 2.2, gold: true, g: -30
        });
        if (canFail && hope() < G.need) beginFail('lost');
        continue;
      }
      if (!f.real && f.y < -20) {
        f.gone = true;
        continue;
      }

      if (f.inv <= 0 && G.lock <= 0) {
        const dx = f.x - G.px;
        const dy = f.y - G.py;
        const d = hypot2(dx, dy);
        if (d < mouthR * 0.92 && dy > -mouthR * 0.55 && dy < mouthR * 0.85) {
          catchFly(f);
        }
      }
    }

    G.rattle = hottestFake > 0 ? hottestFake : Math.max(0, G.rattle - dt * 2.8);
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 1.2);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.62) rings.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    G.lock = Math.max(0, G.lock - dt);
    G.settle = Math.max(0, G.settle - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    G.whooshT = Math.max(0, G.whooshT - dt);
    G.warnT = Math.max(0, G.warnT - dt);
    G.dumpPop = Math.max(0, G.dumpPop - dt * 2.8);
    G.pulse = Math.max(0, G.pulse - dt * 1.8);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.6);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.4);
    if (G.toastT <= 0) toastEl.classList.add('hidden');

    const auto = G.mode === 'title';
    const canFail = G.mode === 'play' && G.lock <= 0 && !G.why;
    updatePlayer(dt, auto);
    updateFlies(dt, canFail);
    updateParticles(dt);

    if (G.mode === 'play' && G.lock <= 0 && !G.why) {
      G.time -= dt;
      if (G.time <= 0) {
        G.time = 0;
        if (G.caught >= G.need && countFakesIn() === 0) clearStage();
        else if (countFakesIn() > 0) beginFail('crack');
        else beginFail('time');
      } else if (G.caught >= G.need && countFakesIn() === 0) {
        clearStage();
      }
    }

    if (G.mode === 'play' && G.why && G.lock <= 0) {
      failStage(G.why);
    }

    if (G.mode === 'clear' && G.settle <= 0) {
      startStage(G.stage + 1, false);
    }
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#05030c');
    g.addColorStop(0.42, '#070616');
    g.addColorStop(0.72, '#08140f');
    g.addColorStop(1, '#05080a');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W - ox - VW * scale, H);
    }
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H - oy - VH * scale);
    }

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.clock * s.tw + s.p)));
      ctx.fillStyle = 'rgba(232, 250, 255,' + tw + ')';
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.5 + 0.5 * Math.sin(G.clock * 0.7 + m.p));
      ctx.fillStyle = 'rgba(0, 240, 255,' + a + ')';
      ctx.beginPath();
      ctx.arc(sx(m.x + Math.sin(G.clock * 0.3 + m.p) * m.s * 0.15), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawMoon() {
    const mx = sx(392);
    const my = sy(86);
    const r = 28 * scale;
    const halo = ctx.createRadialGradient(mx, my, r * 0.2, mx, my, r * 3.2);
    halo.addColorStop(0, 'rgba(0, 240, 255, 0.16)');
    halo.addColorStop(0.45, 'rgba(0, 240, 255, 0.04)');
    halo.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(mx, my, r * 3.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0a1422';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.arc(mx, my, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath();
    ctx.arc(mx - r * 0.28, my - r * 0.3, r * 0.28, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(mx + r * 0.22, my + r * 0.18, r * 0.16, 0, TAU);
    ctx.fill();
  }

  function drawWinds() {
    const st = STAGES[G.stage];
    if (!st || !st.winds) return;
    for (let i = 0; i < st.winds.length; i++) {
      const b = st.winds[i];
      const dir = Math.sign(b.vx) || 1;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.fillRect(sx(0), sy(b.y), VW * scale, b.h * scale);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
      ctx.lineWidth = 1 * scale;
      for (let k = 0; k < 7; k++) {
        const yy = b.y + 10 + k * (b.h - 20) / 6;
        const shift = ((G.clock * 70 * dir + k * 40) % (VW + 40)) - 20;
        ctx.beginPath();
        ctx.moveTo(sx(shift), sy(yy));
        ctx.lineTo(sx(shift + 28 * dir), sy(yy + Math.sin(G.clock * 4 + k) * 3));
        ctx.stroke();
      }
    }
  }

  function drawGround() {
    const g = ctx.createLinearGradient(sx(0), sy(GROUND - 40), sx(0), sy(VH));
    g.addColorStop(0, 'rgba(6, 18, 12, 0)');
    g.addColorStop(0.35, 'rgba(6, 18, 12, 0.55)');
    g.addColorStop(1, 'rgba(4, 10, 8, 0.95)');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(GROUND - 40), VW * scale, (VH - GROUND + 40) * scale);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    for (let i = 0; i <= 24; i++) {
      const x = (VW * i) / 24;
      const yy = GROUND + Math.sin(G.clock * 1.1 + i * 0.55) * 1.8;
      if (i === 0) ctx.moveTo(sx(x), sy(yy));
      else ctx.lineTo(sx(x), sy(yy));
    }
    ctx.stroke();

    for (let i = 0; i < reeds.length; i++) {
      const r = reeds[i];
      const sway = Math.sin(G.clock * 1.35 + r.p) * 7;
      ctx.strokeStyle = r.mag ? 'rgba(255, 61, 184, 0.28)' : 'rgba(0, 240, 255, 0.28)';
      ctx.lineWidth = r.w * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(r.x), sy(GROUND + 8));
      ctx.quadraticCurveTo(sx(r.x + sway * 0.4), sy(GROUND - r.h * 0.45), sx(r.x + sway), sy(GROUND - r.h));
      ctx.stroke();
    }
  }

  function drawFly(f) {
    if (f.gone && !f.caught) {
      if (f.y < -30 || f.y > VH + 20) return;
    }
    const x = sx(f.x);
    const y = sy(f.y);
    const g = f.glow;
    const real = f.real;
    const col = real ? GOLD : (f.mimic ? GOLD : MAG);
    const glowR = (real ? 16 : 14) * (0.7 + g * 0.6) * scale;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grd = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    grd.addColorStop(0, rgba(col, 0.55 * g));
    grd.addColorStop(0.4, rgba(real ? GOLD : MAG, 0.16 * g));
    grd.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, TAU);
    ctx.fill();
    ctx.restore();

    const flap = Math.sin(G.clock * (real ? 16 : 28) + f.wing);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(clamp(f.vx * 0.004, -0.4, 0.4));

    ctx.fillStyle = 'rgba(0, 240, 255,' + (0.18 + g * 0.16) + ')';
    ctx.beginPath();
    ctx.ellipse(-5.2 * scale, -1.2 * scale, 4.4 * scale, (2.1 + flap * 1.1) * scale, -0.5, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(5.2 * scale, -1.2 * scale, 4.4 * scale, (2.1 + flap * 1.1) * scale, 0.5, 0, TAU);
    ctx.fill();

    if (real) {
      ctx.fillStyle = rgba(GOLD, 0.55 + g * 0.45);
      ctx.beginPath();
      ctx.ellipse(0, 0, 3.1 * scale, 2.2 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,' + (0.55 + g * 0.35) + ')';
      ctx.beginPath();
      ctx.arc(-0.8 * scale, -0.6 * scale, 0.9 * scale, 0, TAU);
      ctx.fill();
    } else {
      const core = f.mimic ? GOLD : MAG;
      ctx.fillStyle = rgba(core, 0.5 + g * 0.5);
      ctx.beginPath();
      ctx.moveTo(0, -3.4 * scale);
      ctx.lineTo(2.6 * scale, 0);
      ctx.lineTo(0, 3.4 * scale);
      ctx.lineTo(-2.6 * scale, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.55 + g * 0.45);
      ctx.beginPath();
      ctx.arc(0, 0, 1.15 * scale, 0, TAU);
      ctx.fill();
      if (g > 0.4) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.arc(-0.3 * scale, -0.3 * scale, 0.55 * scale, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawJar() {
    const ratt = G.rattle > 0 ? Math.sin(G.clock * 42) * G.rattle * 3.2 : 0;
    const pop = G.dumpPop * 6;
    const x = sx(G.px + ratt);
    const y = sy(G.py - pop);
    const s = scale;
    const fakes = countFakesIn();
    const reals = countCaught();
    const warn = fakes > 0;

    ctx.save();
    ctx.translate(x, y);
    const tilt = clamp(G.pvx * 0.0009, -0.22, 0.22);
    ctx.rotate(tilt);

    const glowR = (42 + G.pulse * 16) * s;
    const halo = ctx.createRadialGradient(0, 18 * s, 4 * s, 0, 18 * s, glowR);
    if (warn) {
      halo.addColorStop(0, 'rgba(255, 61, 184, 0.28)');
      halo.addColorStop(1, 'rgba(255, 61, 184, 0)');
    } else {
      halo.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
      halo.addColorStop(0.5, reals ? 'rgba(255, 227, 107, 0.08)' : 'rgba(0, 240, 255, 0.05)');
      halo.addColorStop(1, 'rgba(0, 240, 255, 0)');
    }
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 18 * s, glowR, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = warn ? 'rgba(255, 61, 184, 0.55)' : 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.ellipse(0, 0, G.mouth * 0.72 * s, 5.5 * s, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 1.8 * s;
    ctx.beginPath();
    ctx.ellipse(0, -1.5 * s, G.mouth * 0.55 * s, 3.6 * s, 0, 0, TAU);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-11 * s, 4 * s);
    ctx.quadraticCurveTo(-18 * s, 22 * s, -16 * s, 44 * s);
    ctx.quadraticCurveTo(0, 56 * s, 16 * s, 44 * s);
    ctx.quadraticCurveTo(18 * s, 22 * s, 11 * s, 4 * s);
    const glass = ctx.createLinearGradient(-18 * s, 0, 18 * s, 50 * s);
    glass.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    glass.addColorStop(0.45, warn ? 'rgba(40, 8, 22, 0.55)' : 'rgba(10, 8, 22, 0.5)');
    glass.addColorStop(1, 'rgba(0, 240, 255, 0.1)');
    ctx.fillStyle = glass;
    ctx.fill();
    ctx.strokeStyle = warn ? 'rgba(255, 61, 184, 0.85)' : 'rgba(0, 240, 255, 0.85)';
    ctx.lineWidth = 1.7 * s;
    ctx.stroke();
    ctx.restore();

    for (let i = 0; i < G.flies.length; i++) {
      const f = G.flies[i];
      if (f.caught && !f.gone) drawFly(f);
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.15 * s;
    ctx.beginPath();
    ctx.moveTo(-8 * s, 10 * s);
    ctx.quadraticCurveTo(-11 * s, 26 * s, -7 * s, 40 * s);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.45)';
    ctx.lineWidth = 1.3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 52 * s);
    ctx.lineTo(0, 62 * s);
    ctx.stroke();

    if (warn) {
      ctx.strokeStyle = 'rgba(255, 61, 184,' + (0.45 + G.rattle * 0.5) + ')';
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, 22 * s, 11 * s, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(G.rattle, 0, 1));
      ctx.stroke();
      const bounce = 6 + Math.sin(G.clock * 10) * 3;
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.9)';
      ctx.lineWidth = 2.2 * s;
      ctx.beginPath();
      ctx.moveTo(-7 * s, (-10 - bounce) * s);
      ctx.lineTo(0, (-18 - bounce) * s);
      ctx.lineTo(7 * s, (-10 - bounce) * s);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
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
        : 'rgba(255, 227, 107,' + (0.45 * (1 - k)) + ')';
      ctx.lineWidth = 1.7 * scale * (1 - k * 0.4);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + k * 34) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.magFlash * 0.2) + ')';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (G.goldFlash * 0.1) + ')';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawCursor() {
    if (pointer.touch || (!pointer.hover && !pointer.down)) return;
    const x = sx(pointer.x);
    const y = sy(pointer.y);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.arc(x, y, 7 * scale, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 227, 107, 0.8)';
    ctx.beginPath();
    ctx.arc(x, y, 1.6 * scale, 0, TAU);
    ctx.fill();
  }

  function draw() {
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.32 : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.32 : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawBg();
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawMoon();
    drawWinds();
    drawGround();
    for (let i = 0; i < G.flies.length; i++) {
      const f = G.flies[i];
      if (!(f.caught && !f.gone)) drawFly(f);
    }
    drawJar();
    drawParticles();
    drawFlash();
    drawCursor();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ' || k === 'Spacebar')) {
      e.preventDefault();
    }
    if (!down) return;
    if (e.repeat) return;
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
      } else if (k === ' ' || k === 'Spacebar') {
        dumpFakes();
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const p = pointerWorld(e);
    pointer.down = true;
    pointer.hover = true;
    pointer.touch = e.pointerType === 'touch' || e.pointerType === 'pen';
    pointer.id = e.pointerId;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.sx = p.x;
    pointer.sy = p.y;
    pointer.st = G.t;
    pointer.moved = false;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', function (e) {
    const p = pointerWorld(e);
    pointer.x = p.x;
    pointer.y = p.y;
    if (e.pointerType === 'mouse') pointer.hover = true;
    if (pointer.down && hypot2(p.x - pointer.sx, p.y - pointer.sy) > 12) pointer.moved = true;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    const tap = !pointer.moved && (G.t - pointer.st) < 0.28;
    pointer.down = false;
    pointer.id = null;
    if (e.pointerType !== 'mouse') pointer.hover = false;
    if (tap && overlay.classList.contains('hidden')) dumpFakes();
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
    keys.l = keys.r = keys.u = keys.d = false;
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

  seedDecor();
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
    syncHud();
    draw();
  }
  requestAnimationFrame(frame);
})();
