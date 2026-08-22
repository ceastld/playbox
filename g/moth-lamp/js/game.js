'use strict';

(function () {
  const VW = 480;
  const VH = 800;
  const CX = 240;
  const MARGIN = 28;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-moth-lamp-mute';
  const ACC = 1980;
  const MAX_SPD = 232;
  const FRIC = 7.2;
  const MOTH_ACC = 620;
  const MOTH_MAX = 164;
  const MOTH_FOLLOW = 226;
  const HOLD_R = 210;
  const LAMP_BRIGHT = 286;
  const SAFE_BRIGHT = 210;
  const OPS = 'WASD / 方向键提灯 · 按住拖动 · M 静音';

  const STAGES = [
    {
      name: '初引',
      sub: 'FIRST',
      hint: '把灯靠近蛾，再绕开火送到青灯',
      toast: '蛾会跟着最亮的光走',
      time: 42,
      start: { x: 392, y: 686 },
      safe: { x: 368, y: 108, r: 44 },
      flames: [{ x: 132, y: 528, r: 18, bright: 250, orbit: 58 }],
      moths: [{ flame: 0, a: 0.35 }]
    },
    {
      name: '贴火',
      sub: 'CLOSE',
      hint: '火更亮，灯要贴着蛾才能偷走',
      toast: '别从火心穿过去',
      time: 40,
      start: { x: 406, y: 712 },
      safe: { x: 240, y: 98, r: 42 },
      flames: [{ x: 240, y: 430, r: 20, bright: 318, orbit: 48 }],
      moths: [{ flame: 0, a: 1.15 }]
    },
    {
      name: '双蛾',
      sub: 'PAIR',
      hint: '两只都会跟灯。别把后一只甩回火里',
      toast: '带走两只，一起送到青灯',
      time: 46,
      start: { x: 64, y: 704 },
      safe: { x: 392, y: 108, r: 44 },
      flames: [{ x: 168, y: 536, r: 18, bright: 286, orbit: 54 }],
      moths: [
        { flame: 0, a: 0.2 },
        { flame: 0, a: 3.45 }
      ]
    },
    {
      name: '隔焰',
      sub: 'HALL',
      hint: '两火中间会把蛾烧掉，走外圈',
      toast: '中间是火廊 · 绕开',
      time: 48,
      start: { x: 240, y: 728 },
      safe: { x: 240, y: 96, r: 42 },
      flames: [
        { x: 164, y: 390, r: 20, bright: 310, orbit: 50 },
        { x: 316, y: 390, r: 20, bright: 310, orbit: 50 }
      ],
      moths: [{ flame: 0, a: 2.35 }]
    },
    {
      name: '风廊',
      sub: 'GUST',
      hint: '青带有横风，等风停再过火',
      toast: '风会把蛾推向火',
      time: 50,
      start: { x: 72, y: 690 },
      safe: { x: 392, y: 108, r: 42 },
      flames: [{ x: 304, y: 428, r: 20, bright: 304, orbit: 52 }],
      moths: [{ flame: 0, a: 4.05 }],
      winds: [{ y: 248, h: 96, vx: 88, osc: 78, period: 2.8, ph: 0 }]
    },
    {
      name: '三烛',
      sub: 'TRIO',
      hint: '先偷近的一只，再绕去另一只',
      toast: '三支烛 · 一次引一路',
      time: 54,
      start: { x: 240, y: 736 },
      safe: { x: 240, y: 92, r: 42 },
      flames: [
        { x: 112, y: 572, r: 18, bright: 286, orbit: 50 },
        { x: 368, y: 572, r: 18, bright: 286, orbit: 50 },
        { x: 240, y: 338, r: 20, bright: 318, orbit: 48 }
      ],
      moths: [
        { flame: 0, a: 0.55 },
        { flame: 1, a: 2.9 }
      ]
    },
    {
      name: '摇焰',
      sub: 'SWAY',
      hint: '火在摇，等它偏开再贴上去偷',
      toast: '烛火左右晃',
      time: 50,
      start: { x: 68, y: 704 },
      safe: { x: 400, y: 106, r: 42 },
      flames: [
        { x: 240, y: 468, r: 20, bright: 328, orbit: 50, sway: 92, spd: 0.86, ph: 0 }
      ],
      moths: [
        { flame: 0, a: 0.9 },
        { flame: 0, a: 4.05 }
      ]
    },
    {
      name: '庭灯',
      sub: 'GARDEN',
      hint: '花园四烛，沿空当把三只都送上去',
      toast: '绕着走，别抄近道',
      time: 58,
      start: { x: 240, y: 742 },
      safe: { x: 240, y: 88, r: 40 },
      flames: [
        { x: 108, y: 628, r: 18, bright: 292, orbit: 48 },
        { x: 372, y: 628, r: 18, bright: 292, orbit: 48 },
        { x: 156, y: 376, r: 19, bright: 306, orbit: 46 },
        { x: 324, y: 376, r: 19, bright: 306, orbit: 46 }
      ],
      moths: [
        { flame: 0, a: 0.25 },
        { flame: 1, a: 2.15 },
        { flame: 2, a: 4.2 }
      ]
    },
    {
      name: '群蛾',
      sub: 'SWARM',
      hint: '五只会散。先拢成一群再过火',
      toast: '灯亮的一侧会聚蛾',
      time: 60,
      start: { x: 56, y: 722 },
      safe: { x: 400, y: 100, r: 44 },
      flames: [
        { x: 198, y: 522, r: 20, bright: 304, orbit: 52 },
        { x: 344, y: 356, r: 20, bright: 314, orbit: 50 },
        { x: 132, y: 276, r: 18, bright: 282, orbit: 48 }
      ],
      moths: [
        { flame: 0, a: 0.18 },
        { flame: 0, a: 2.05 },
        { flame: 1, a: 1.12 },
        { flame: 1, a: 3.55 },
        { flame: 2, a: 4.48 }
      ]
    },
    {
      name: '灯会',
      sub: 'FEST',
      hint: '风、晃、四火。一只一只引，别贪',
      toast: '终夜 · 一只不燃',
      time: 66,
      start: { x: 240, y: 742 },
      safe: { x: 240, y: 86, r: 40 },
      flames: [
        { x: 98, y: 604, r: 18, bright: 304, orbit: 48, sway: 42, spd: 0.72, ph: 0 },
        { x: 382, y: 604, r: 18, bright: 304, orbit: 48, sway: 42, spd: 0.72, ph: 2.2 },
        { x: 158, y: 378, r: 20, bright: 326, orbit: 46, sway: 58, spd: 0.92, ph: 1.0 },
        { x: 322, y: 378, r: 20, bright: 326, orbit: 46, sway: 58, spd: 0.92, ph: 3.0 }
      ],
      moths: [
        { flame: 0, a: 0.4 },
        { flame: 1, a: 2.6 },
        { flame: 2, a: 1.5 },
        { flame: 3, a: 4.05 }
      ],
      winds: [
        { y: 232, h: 82, vx: 74, osc: 82, period: 2.4, ph: 0 },
        { y: 478, h: 72, vx: -64, osc: 72, period: 2.8, ph: 1.2 }
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
  const timeLabel = document.getElementById('time-label');
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
  const pointer = { down: false, hover: false, touch: false, x: CX, y: 560, id: null };
  const particles = [];
  const motes = [];
  const stars = [];
  const tufts = [];
  const pips = [];
  const rings = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    need: 1,
    saved: 0,
    time: 40,
    timeMax: 40,
    px: CX,
    py: 680,
    pvx: 0,
    pvy: 0,
    pBright: LAMP_BRIGHT,
    moths: [],
    flames: [],
    safe: { x: 360, y: 108, r: 44 },
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    lock: 0,
    settle: 0,
    toastT: 0,
    why: '',
    taught: false,
    stealTaught: false,
    nearTaught: false,
    timeTaught: false,
    warnT: 0,
    whooshT: 0,
    pulse: 0
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
      this.beep(392, 0.1, 'sine', 0.045, 784);
      this.beep(523, 0.16, 'triangle', 0.03, 1046);
    },
    steal() {
      this.ensure();
      this.beep(660, 0.08, 'sine', 0.04, 880);
    },
    save() {
      this.ensure();
      this.beep(784, 0.1, 'sine', 0.05, 1174);
      this.beep(988, 0.16, 'triangle', 0.035, 1318);
    },
    warn() {
      this.ensure();
      this.beep(220, 0.07, 'sine', 0.03, 140);
    },
    whoosh() {
      this.ensure();
      this.noise(0.08, 0.022, 1500);
    },
    burn() {
      this.ensure();
      this.noise(0.22, 0.075, 380);
      this.beep(180, 0.26, 'sawtooth', 0.045, 60);
      this.beep(90, 0.34, 'sine', 0.055, 40);
    },
    tick() {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.018);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05, 523);
      this.beep(659, 0.12, 'sine', 0.045, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.055);
      this.beep(784, 0.16, 'sine', 0.055);
      this.beep(1046, 0.34, 'triangle', 0.065, 1560);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 220) particles.shift();
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
        g: spec.g == null ? 40 : spec.g
      });
    }
  }

  function addRing(x, y, mag) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag });
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

  function liveCount() {
    let n = 0;
    for (let i = 0; i < G.moths.length; i++) {
      if (!G.moths[i].dead && !G.moths[i].saved) n += 1;
    }
    return n;
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const need = G.need;
    const fill = G.saved;
    const k = need ? clamp(fill / need, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = fill + '/' + need;
    fillWrap.classList.toggle('hot', G.mode === 'play' && fill >= need);
    fillWrap.classList.toggle('warn', G.mode === 'play' && liveCount() > 0 && fill < need && G.time < 8);
    if (G.mode === 'title') {
      stageLabel.textContent = '十夜';
      timeLabel.textContent = '引蛾';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 夜 · ' + (st ? st.name : '');
      timeLabel.textContent = Math.max(0, Math.ceil(G.time)) + 's';
    }
    stageLabel.classList.toggle('hot', G.mode === 'play' && fill >= need);
    timeLabel.classList.toggle('warn', G.mode === 'play' && G.time < 8);
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

  function flamePos(f) {
    const sway = f.sway || 0;
    const spd = f.spd || 0;
    const ph = f.ph || 0;
    return {
      x: f.x + Math.sin(G.clock * spd + ph) * sway,
      y: f.y + Math.cos(G.clock * spd * 0.62 + ph) * sway * 0.16
    };
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

  function spawnMoth(spec, flames) {
    const f = flames[spec.flame] || flames[0];
    const fp = flamePos(f);
    const a = spec.a || 0;
    const orbit = f.orbit || 52;
    return {
      x: fp.x + Math.cos(a) * orbit,
      y: fp.y + Math.sin(a) * orbit * 0.72,
      vx: -Math.sin(a) * 64,
      vy: Math.cos(a) * 46,
      a: a,
      phase: rand(0, TAU),
      home: spec.flame || 0,
      follow: 'flame',
      dead: false,
      saved: false,
      perchA: rand(0, TAU),
      perchR: rand(20, 30),
      warn: 0,
      inv: 0.35,
      dust: 0
    };
  }

  function applyStage(st) {
    G.need = st.moths.length;
    G.saved = 0;
    G.time = st.time;
    G.timeMax = st.time;
    G.safe = { x: st.safe.x, y: st.safe.y, r: st.safe.r };
    G.flames = st.flames.map(function (f) {
      return {
        x: f.x, y: f.y, r: f.r, bright: f.bright, orbit: f.orbit,
        sway: f.sway || 0, spd: f.spd || 0, ph: f.ph || 0,
        flick: rand(0, TAU)
      };
    });
    G.moths = st.moths.map(function (m) { return spawnMoth(m, G.flames); });
    G.px = st.start.x;
    G.py = st.start.y;
    G.pvx = 0;
    G.pvy = 0;
    G.why = '';
    G.stealTaught = false;
    G.nearTaught = false;
    G.timeTaught = false;
    G.pBright = LAMP_BRIGHT;
  }

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.18;
    G.settle = 0;
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
    showOverlay(
      'title',
      '扑灯',
      '蛾会扑向最亮的光。把灯靠近它们，<br />再绕开火，送到青灯里。',
      '提灯',
      'MOTH',
      OPS
    );
    setHint('灯靠近蛾 · 绕开火 · 送到青灯', '');
    syncHud();
  }

  function burnMoth(m) {
    if (m.dead || m.saved) return;
    m.dead = true;
    addRing(m.x, m.y, true);
    emit(20, {
      x: m.x, y: m.y, j: 12,
      vx0: -160, vx1: 160, vy0: -140, vy1: 90,
      life: 0.7, r0: 1.2, r1: 3.4, mag: true, gold: true, g: 70
    });
  }

  function saveMoth(m) {
    if (m.dead || m.saved) return;
    m.saved = true;
    G.saved += 1;
    G.goldFlash = Math.max(G.goldFlash, 0.38);
    G.pulse = 1;
    m.perchA = rand(0, TAU);
    m.perchR = rand(18, 28);
    addRing(G.safe.x, G.safe.y, false);
    emit(14, {
      x: m.x, y: m.y, j: 8,
      vx0: -50, vx1: 50, vy0: -90, vy1: -10,
      life: 0.65, r0: 1.1, r1: 2.6, cyan: true, gold: true, g: -24
    });
    if (G.mode === 'play') {
      audio.save();
      toast('入灯 ' + G.saved + '/' + G.need, false, true);
    }
    syncHud();
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    const map = {
      burn: ['扑火', '蛾扑进火里了。', 'FLAME'],
      time: ['夜尽', '灯油耗尽，蛾还在火边。', 'DUSK']
    };
    const m = map[why] || map.burn;
    showOverlay(
      'lose',
      m[0],
      more
        ? m[1] + '<br />还剩 ' + G.lives + ' 次。'
        : m[1] + '<br />十夜未完。',
      more ? '再引本夜' : '再来一局',
      m[2]
    );
    setHint(m[0], 'warn');
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.85;
    G.goldFlash = 0.85;
    audio.clear();
    toast(STAGES[G.stage].name + ' · 入灯', false, true);
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '夜尽灯安',
        '十夜蛾都进了青灯，一只不燃。',
        '再引一巡',
        'SAFE'
      );
      setHint('十夜灯安', 'hot');
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
    G.magFlash = 0.78;
    G.shake = 12;
    G.lock = 0.78;
    if (why === 'burn') audio.burn();
    else audio.warn();
    const msg = why === 'burn' ? '蛾扑进火里' : '夜尽了';
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
    tufts.length = 0;
    for (let i = 0; i < 46; i++) {
      stars.push({
        x: rand(10, VW - 10),
        y: rand(8, 420),
        r: rand(0.5, 1.5),
        a: rand(0.22, 0.82),
        p: rand(0, TAU),
        tw: rand(1.1, 3.2)
      });
    }
    for (let i = 0; i < 36; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(60, VH - 40),
        r: rand(0.6, 1.6),
        a: rand(0.05, 0.16),
        p: rand(0, TAU),
        s: rand(7, 18)
      });
    }
    for (let i = 0; i < 18; i++) {
      tufts.push({
        x: rand(18, VW - 18),
        y: rand(640, 788),
        h: rand(8, 18),
        p: rand(0, TAU)
      });
    }
  }

  function lampInFlame() {
    for (let i = 0; i < G.flames.length; i++) {
      const fp = flamePos(G.flames[i]);
      if (hypot2(G.px - fp.x, G.py - fp.y) < G.flames[i].r + 26) return true;
    }
    return false;
  }

  function updatePlayer(dt, auto) {
    const playing = G.mode === 'play' || G.mode === 'title';
    if (!playing) {
      G.pvx *= Math.exp(-dt * 6);
      G.pvy *= Math.exp(-dt * 6);
      G.px = clamp(G.px + G.pvx * dt, MARGIN, VW - MARGIN);
      G.py = clamp(G.py + G.pvy * dt, 48, VH - 28);
      return;
    }

    if (auto) {
      let tx = G.safe.x;
      let ty = G.safe.y + 70;
      let follow = 0;
      let nearest = 1e9;
      let nx = G.px;
      let ny = G.py;
      for (let i = 0; i < G.moths.length; i++) {
        const m = G.moths[i];
        if (m.dead || m.saved) continue;
        const d = hypot2(m.x - G.px, m.y - G.py);
        if (m.follow === 'lamp') follow += 1;
        if (d < nearest) {
          nearest = d;
          nx = m.x;
          ny = m.y;
        }
      }
      if (follow === 0 && nearest < 1e8) {
        tx = nx + 20;
        ty = ny + 4;
      } else if (follow > 0) {
        tx = G.safe.x;
        ty = G.safe.y + 12;
      }
      const dx = tx - G.px;
      const dy = ty - G.py;
      const d = hypot2(dx, dy);
      if (d > 3) {
        const spd = Math.min(MAX_SPD * 0.7, d * 3.4);
        G.pvx = (dx / d) * spd;
        G.pvy = (dy / d) * spd;
        G.px += G.pvx * dt;
        G.py += G.pvy * dt;
      } else {
        G.pvx = 0;
        G.pvy = 0;
      }
    } else {
      const usePtr = pointer.down || pointer.hover;
      if (usePtr) {
        let tx = pointer.x;
        let ty = pointer.y;
        if (pointer.touch) ty -= 38;
        tx = clamp(tx, MARGIN, VW - MARGIN);
        ty = clamp(ty, 48, VH - 28);
        const nx = lerp(G.px, tx, 1 - Math.exp(-14 * dt));
        const ny = lerp(G.py, ty, 1 - Math.exp(-14 * dt));
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
      if (G.px < MARGIN) { G.px = MARGIN; G.pvx *= 0.2; }
      if (G.px > VW - MARGIN) { G.px = VW - MARGIN; G.pvx *= 0.2; }
      if (G.py < 48) { G.py = 48; G.pvy *= 0.2; }
      if (G.py > VH - 28) { G.py = VH - 28; G.pvy *= 0.2; }
    }

    G.pBright = lampInFlame() ? LAMP_BRIGHT * 0.28 : LAMP_BRIGHT;

    const pspd = hypot2(G.pvx, G.pvy);
    if (G.mode === 'play' && pspd > 210 && G.whooshT <= 0) {
      audio.whoosh();
      G.whooshT = 0.3;
      emit(2, {
        x: G.px, y: G.py, j: 5,
        vx0: -G.pvx * 0.12, vx1: -G.pvx * 0.04,
        vy0: -G.pvy * 0.12, vy1: -G.pvy * 0.04,
        life: 0.26, r0: 1, r1: 2.1, cyan: true, g: 0
      });
    }
  }

  function pickLight(m) {
    const pd2 = Math.max(36, (m.x - G.px) * (m.x - G.px) + (m.y - G.py) * (m.y - G.py));
    const dLamp = Math.sqrt(pd2);
    const pForce = G.pBright / (pd2 + 88);
    const lampOk = G.pBright > LAMP_BRIGHT * 0.55;

    let bestKind = 'lamp';
    let bestForce = pForce;
    let bx = G.px;
    let by = G.py;
    let bi = -1;

    for (let i = 0; i < G.flames.length; i++) {
      const f = G.flames[i];
      const fp = flamePos(f);
      const dx = m.x - fp.x;
      const dy = m.y - fp.y;
      const d2 = Math.max(16, dx * dx + dy * dy);
      const force = f.bright / (d2 + 34);
      if (force > bestForce) {
        bestForce = force;
        bestKind = 'flame';
        bx = fp.x;
        by = fp.y;
        bi = i;
      }
    }

    const sdx = m.x - G.safe.x;
    const sdy = m.y - G.safe.y;
    const sd2 = Math.max(25, sdx * sdx + sdy * sdy);
    const sForce = SAFE_BRIGHT / (sd2 + 64);
    if (sForce > bestForce) {
      bestKind = 'safe';
      bx = G.safe.x;
      by = G.safe.y;
      bi = -1;
      bestForce = sForce;
    }

    if (m.follow === 'lamp' && lampOk && dLamp < HOLD_R) {
      if (bestKind !== 'safe' || hypot2(m.x - G.safe.x, m.y - G.safe.y) > G.safe.r * 1.05) {
        bestKind = 'lamp';
        bx = G.px;
        by = G.py;
        bi = -1;
        bestForce = pForce;
      }
    }

    return { kind: bestKind, x: bx, y: by, i: bi, force: bestForce };
  }

  function steer(m, tx, ty, dt, cap) {
    const dx = tx - m.x;
    const dy = ty - m.y;
    const d = hypot2(dx, dy);
    if (d < 0.2) return;
    const acc = MOTH_ACC;
    m.vx += (dx / d) * acc * dt;
    m.vy += (dy / d) * acc * dt;
    const spd = hypot2(m.vx, m.vy);
    const max = cap || MOTH_MAX;
    if (spd > max) {
      m.vx *= max / spd;
      m.vy *= max / spd;
    }
  }

  function updateMoths(dt, canFail) {
    const list = G.moths;
    for (let i = 0; i < list.length; i++) {
      const m = list[i];
      m.warn = Math.max(0, m.warn - dt * 2.2);
      if (m.dead) continue;
      m.inv = Math.max(0, m.inv - dt);
      m.phase += dt * 18;
      m.dust += dt;

      if (m.saved) {
        const ang = m.perchA + G.clock * 0.55;
        const tx = G.safe.x + Math.cos(ang) * m.perchR;
        const ty = G.safe.y + Math.sin(ang) * m.perchR * 0.55 + 6;
        m.x = lerp(m.x, tx, 1 - Math.exp(-5 * dt));
        m.y = lerp(m.y, ty, 1 - Math.exp(-5 * dt));
        m.vx = 0;
        m.vy = 0;
        continue;
      }

      const light = pickLight(m);
      const prev = m.follow;
      m.follow = light.kind;

      if (G.mode === 'play' && prev === 'flame' && light.kind === 'lamp' && !G.stealTaught) {
        G.stealTaught = true;
        toast('跟上了', false, true);
        audio.steal();
      } else if (prev === 'flame' && light.kind === 'lamp' && G.mode === 'play') {
        if (G.whooshT <= 0) {
          audio.steal();
          G.whooshT = 0.12;
        }
      }

      if (light.kind === 'flame') {
        const f = G.flames[light.i] || G.flames[0];
        m.a += 1.28 * dt;
        const ox = light.x + Math.cos(m.a) * f.orbit;
        const oy = light.y + Math.sin(m.a) * f.orbit * 0.72;
        steer(m, ox, oy, dt, MOTH_MAX * 0.92);
        const dFlame = hypot2(m.x - light.x, m.y - light.y);
        if (dFlame < f.r + 16) m.warn = 1;
        if (canFail && m.inv <= 0 && dFlame < f.r * 0.92) {
          burnMoth(m);
          beginFail('burn');
          continue;
        }
      } else if (light.kind === 'safe') {
        steer(m, light.x, light.y + 4, dt, MOTH_FOLLOW);
      } else {
        const trail = 14;
        const ang = Math.atan2(G.pvy, G.pvx);
        const moving = hypot2(G.pvx, G.pvy) > 28;
        const tx = G.px - (moving ? Math.cos(ang) * trail : 0) + Math.sin(m.phase * 0.2 + i) * 5;
        const ty = G.py - (moving ? Math.sin(ang) * trail : 0) + Math.cos(m.phase * 0.17 + i) * 4;
        steer(m, tx, ty, dt, MOTH_FOLLOW);
      }

      m.vx += windAt(m.y) * dt;
      m.vx *= Math.exp(-dt * 1.15);
      m.vy *= Math.exp(-dt * 1.15);
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      if (m.x < MARGIN + 8) { m.x = MARGIN + 8; m.vx = Math.abs(m.vx) * 0.4; }
      if (m.x > VW - MARGIN - 8) { m.x = VW - MARGIN - 8; m.vx = -Math.abs(m.vx) * 0.4; }
      if (m.y < 56) { m.y = 56; m.vy = Math.abs(m.vy) * 0.4; }
      if (m.y > VH - 24) { m.y = VH - 24; m.vy = -Math.abs(m.vy) * 0.4; }

      const ds = hypot2(m.x - G.safe.x, m.y - G.safe.y);
      if (ds < G.safe.r * 0.78) {
        saveMoth(m);
        continue;
      }

      if (canFail) {
        for (let f = 0; f < G.flames.length; f++) {
          const fp = flamePos(G.flames[f]);
          const d = hypot2(m.x - fp.x, m.y - fp.y);
          if (d < G.flames[f].r + 14) m.warn = Math.max(m.warn, 1);
          if (m.inv <= 0 && d < G.flames[f].r * 0.92) {
            burnMoth(m);
            beginFail('burn');
            break;
          }
        }
      }

      if (m.dust > 0.07 && (m.follow === 'lamp' || Math.random() < 0.4)) {
        m.dust = 0;
        emit(1, {
          x: m.x, y: m.y, j: 2,
          vx0: -8, vx1: 8, vy0: -16, vy1: -2,
          life: 0.35, r0: 0.6, r1: 1.4,
          cyan: m.follow === 'lamp', gold: m.follow !== 'lamp', g: -10
        });
      }
    }

    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (a.dead || a.saved) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (b.dead || b.saved) continue;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = hypot2(dx, dy);
        if (d < 0.001) { dx = 0.4; dy = 0; d = 0.4; }
        if (d < 16) {
          const push = (16 - d) * 0.5;
          const nx = dx / d;
          const ny = dy / d;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
        }
      }
    }

    if (canFail && G.mode === 'play' && !G.nearTaught) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].warn > 0.4 && list[i].follow === 'lamp') {
          G.nearTaught = true;
          toast('离火远一点', true);
          setHint('带着蛾走外圈，别贴火心', 'warn');
          break;
        }
      }
    }
  }

  function updateFlames(dt) {
    for (let i = 0; i < G.flames.length; i++) {
      const f = G.flames[i];
      f.flick += dt * (9 + i);
      const fp = flamePos(f);
      if (Math.random() < dt * 14) {
        emit(1, {
          x: fp.x, y: fp.y - 10, j: 3,
          vx0: -12, vx1: 12, vy0: -48, vy1: -10,
          life: 0.5, r0: 0.7, r1: 1.8, gold: true, mag: Math.random() < 0.35, g: -30
        });
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.8);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lock = Math.max(0, G.lock - dt);
    G.pulse = Math.max(0, G.pulse - dt * 1.6);
    G.whooshT = Math.max(0, G.whooshT - dt);
    G.warnT = Math.max(0, G.warnT - dt);
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
      p.vx *= 0.985;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.62) rings.splice(i, 1);
    }
  }

  function updateTitle(dt) {
    updatePlayer(dt, true);
    updateMoths(dt, false);
    updateFlames(dt);
    if (G.saved >= G.need || liveCount() === 0) {
      G.settle += dt;
      if (G.settle > 1.1) {
        applyStage(STAGES[0]);
        G.settle = 0;
      }
    }
  }

  function updatePlay(dt) {
    if (G.lock <= 0) G.time -= dt;
    updatePlayer(dt, false);
    if (!G.why) updateMoths(dt, true);
    else updateMoths(dt, false);
    updateFlames(dt);

    if (G.why) {
      if (G.lock <= 0) failStage(G.why);
      return;
    }

    if (G.mode === 'play' && G.time < 8 && !G.timeTaught) {
      G.timeTaught = true;
      toast('夜要尽了', true);
      audio.tick();
    }
    if (G.mode === 'play' && G.time < 8 && G.warnT <= 0) {
      audio.tick();
      G.warnT = 1;
    }

    if (G.saved >= G.need) {
      G.settle += dt;
      if (G.settle > 0.42) clearStage();
      return;
    }

    if (G.time <= 0) {
      beginFail('time');
      return;
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      G.settle -= dt;
      updatePlayer(dt, false);
      updateMoths(dt, false);
      updateFlames(dt);
      if (G.settle <= 0) startStage(G.stage + 1, false);
    } else {
      updatePlayer(dt, false);
      updateMoths(dt, false);
      updateFlames(dt);
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

    const g = ctx.createRadialGradient(sx(86), sy(24), 8, sx(86), sy(24), 300 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.15)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(36), 8, sx(400), sy(36), 280 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.13)');
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
    vg.addColorStop(0, 'rgba(10, 8, 28, 0.95)');
    vg.addColorStop(0.4, 'rgba(8, 6, 20, 0.2)');
    vg.addColorStop(0.78, 'rgba(16, 10, 28, 0.42)');
    vg.addColorStop(1, 'rgba(8, 12, 22, 0.82)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(G.clock * s.tw + s.p));
      ctx.fillStyle = 'rgba(220, 240, 255,' + (s.a * tw) + ')';
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(6, 4, 14, 0.55)';
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(210));
    ctx.lineTo(sx(70), sy(150));
    ctx.lineTo(sx(128), sy(198));
    ctx.lineTo(sx(190), sy(132));
    ctx.lineTo(sx(250), sy(188));
    ctx.lineTo(sx(330), sy(118));
    ctx.lineTo(sx(400), sy(176));
    ctx.lineTo(sx(480), sy(128));
    ctx.lineTo(sx(480), sy(240));
    ctx.lineTo(sx(0), sy(240));
    ctx.fill();

    ctx.fillStyle = 'rgba(10, 8, 22, 0.7)';
    ctx.fillRect(sx(0), sy(640), VW * scale, 160 * scale);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1 * scale;
    for (let i = 0; i < 6; i++) {
      const y = 660 + i * 22;
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(y));
      ctx.lineTo(sx(VW), sy(y));
      ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(sx(i * 60), sy(640));
      ctx.lineTo(sx(i * 60), sy(VH));
      ctx.stroke();
    }

    for (let i = 0; i < tufts.length; i++) {
      const t = tufts[i];
      const sway = Math.sin(G.clock * 1.4 + t.p) * 2.2;
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.22)';
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(t.x), sy(t.y));
      ctx.quadraticCurveTo(sx(t.x + sway), sy(t.y - t.h * 0.6), sx(t.x + sway * 1.4), sy(t.y - t.h));
      ctx.stroke();
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.35 + m.p) * 12);
      const y = sy((m.y - G.clock * m.s + VH * 8) % VH);
      ctx.fillStyle = 'rgba(255, 210, 160,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWinds() {
    const st = STAGES[G.stage];
    if (!st || !st.winds) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    for (let i = 0; i < st.winds.length; i++) {
      const b = st.winds[i];
      const wx = b.vx + Math.sin(G.clock * TAU / (b.period || 3) + (b.ph || 0)) * (b.osc || 0);
      const right = wx >= 0;
      ctx.fillStyle = right ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 61, 184, 0.055)';
      ctx.fillRect(sx(MARGIN), sy(b.y), (VW - MARGIN * 2) * scale, b.h * scale);
      ctx.strokeStyle = right ? 'rgba(0, 240, 255, 0.24)' : 'rgba(255, 61, 184, 0.24)';
      ctx.lineWidth = 1.2 * scale;
      for (let r = 0; r < 3; r++) {
        const yy = b.y + b.h * (0.22 + r * 0.28);
        const shift = (G.clock * Math.abs(wx) * 0.35) % 48;
        for (let x = MARGIN - 40; x < VW - MARGIN; x += 48) {
          const xx = x + (right ? shift : -shift);
          ctx.beginPath();
          if (right) {
            ctx.moveTo(sx(xx), sy(yy - 5));
            ctx.lineTo(sx(xx + 10), sy(yy));
            ctx.lineTo(sx(xx), sy(yy + 5));
          } else {
            ctx.moveTo(sx(xx + 10), sy(yy - 5));
            ctx.lineTo(sx(xx), sy(yy));
            ctx.lineTo(sx(xx + 10), sy(yy + 5));
          }
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawSafe() {
    const x = sx(G.safe.x);
    const y = sy(G.safe.y);
    const pulse = 0.85 + Math.sin(G.clock * 2.4) * 0.12 + G.pulse * 0.35;
    const halo = ctx.createRadialGradient(x, y, 4 * scale, x, y, G.safe.r * 2.1 * scale);
    halo.addColorStop(0, 'rgba(0, 240, 255,' + (0.28 * pulse) + ')');
    halo.addColorStop(0.45, 'rgba(255, 227, 107, 0.1)');
    halo.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, G.safe.r * 2.1 * scale, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.setLineDash([5 * scale, 6 * scale]);
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.arc(x, y, G.safe.r * scale, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y - 28 * scale);
    ctx.lineTo(x, y - 16 * scale);
    ctx.stroke();

    ctx.fillStyle = '#0c1422';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
    ctx.lineWidth = 1.5 * scale;
    roundRect(ctx, x - 11 * scale, y - 16 * scale, 22 * scale, 28 * scale, 3.5 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 227, 107,' + (0.55 + 0.25 * pulse) + ')';
    ctx.beginPath();
    ctx.arc(x, y - 2 * scale, 4.2 * scale, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 11 * scale, y - 4 * scale);
    ctx.lineTo(x + 11 * scale, y - 4 * scale);
    ctx.moveTo(x, y - 16 * scale);
    ctx.lineTo(x, y + 12 * scale);
    ctx.stroke();

    ctx.fillStyle = 'rgba(232, 250, 255, 0.8)';
    ctx.font = '600 ' + Math.max(9, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('青灯', x, y + 28 * scale);
  }

  function drawFlame(f) {
    const fp = flamePos(f);
    const x = sx(fp.x);
    const y = sy(fp.y);
    const flick = 0.86 + Math.sin(G.clock * 11 + f.flick) * 0.1 + Math.sin(G.clock * 23 + f.flick) * 0.06;
    const h = (22 + f.r * 0.4) * flick;

    const glow = ctx.createRadialGradient(x, y - 8 * scale, 2 * scale, x, y, (f.r + 36) * scale);
    glow.addColorStop(0, 'rgba(255, 227, 107, 0.42)');
    glow.addColorStop(0.35, 'rgba(255, 61, 184, 0.18)');
    glow.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, (f.r + 36) * scale, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 61, 184,' + (0.16 + 0.1 * flick) + ')';
    ctx.lineWidth = 1.1 * scale;
    ctx.setLineDash([4 * scale, 5 * scale]);
    ctx.beginPath();
    ctx.arc(x, y, (f.r + 10) * scale, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#1a1014';
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.45)';
    ctx.lineWidth = 1.1 * scale;
    roundRect(ctx, x - 5.5 * scale, y + 2 * scale, 11 * scale, 16 * scale, 2 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 227, 107, 0.7)';
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.moveTo(x, y + 2 * scale);
    ctx.lineTo(x, y - 4 * scale);
    ctx.stroke();

    ctx.save();
    ctx.translate(x, y - 4 * scale);
    ctx.fillStyle = 'rgba(255, 61, 184, 0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -h * scale);
    ctx.quadraticCurveTo(7 * scale * flick, -h * 0.35 * scale, 0, 6 * scale);
    ctx.quadraticCurveTo(-7 * scale * flick, -h * 0.35 * scale, 0, -h * scale);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 227, 107, 0.95)';
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.62 * scale);
    ctx.quadraticCurveTo(3.2 * scale * flick, -h * 0.2 * scale, 0, 3 * scale);
    ctx.quadraticCurveTo(-3.2 * scale * flick, -h * 0.2 * scale, 0, -h * 0.62 * scale);
    ctx.fill();
    ctx.restore();
  }

  function lampStyle() {
    const dim = G.pBright < LAMP_BRIGHT * 0.5;
    const pulse = 0.9 + Math.sin(G.clock * 3.2) * 0.08;
    return { dim: dim, pulse: pulse, x: sx(G.px), y: sy(G.py) };
  }

  function drawLampGlow() {
    const L = lampStyle();
    const rad = (L.dim ? 42 : 70) * scale;
    const halo = ctx.createRadialGradient(L.x, L.y, 2 * scale, L.x, L.y, rad);
    halo.addColorStop(0, L.dim ? 'rgba(255, 61, 184, 0.28)' : 'rgba(0, 240, 255,' + (0.38 * L.pulse) + ')');
    halo.addColorStop(0.4, L.dim ? 'rgba(255, 61, 184, 0.08)' : 'rgba(0, 240, 255, 0.1)');
    halo.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(L.x, L.y, rad, 0, TAU);
    ctx.fill();
  }

  function drawLampBody() {
    const L = lampStyle();
    ctx.fillStyle = '#0b101c';
    ctx.strokeStyle = L.dim ? 'rgba(255, 61, 184, 0.8)' : 'rgba(0, 240, 255, 0.95)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.ellipse(L.x, L.y, 11 * scale, 13 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = L.dim ? 'rgba(255, 120, 170, 0.7)' : 'rgba(255, 227, 107,' + (0.7 * L.pulse) + ')';
    ctx.beginPath();
    ctx.arc(L.x, L.y + 1 * scale, 3.6 * scale, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.arc(L.x, L.y - 13 * scale, 4 * scale, Math.PI, 0);
    ctx.stroke();
  }

  function drawMoth(m) {
    if (m.dead) return;
    const x = sx(m.x);
    const y = sy(m.y);
    const flap = Math.sin(m.phase) * 0.55;
    const ang = m.saved ? m.perchA + G.clock * 0.55 : Math.atan2(m.vy, m.vx || 0.01);
    const warn = m.warn;
    const followLamp = m.follow === 'lamp' && !m.saved;

    if (followLamp) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
      ctx.lineWidth = 1 * scale;
      ctx.setLineDash([3 * scale, 5 * scale]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(sx(G.px), sy(G.py));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    const s = scale;

    ctx.fillStyle = warn > 0.2
      ? 'rgba(255, 61, 184, 0.28)'
      : followLamp
        ? 'rgba(0, 240, 255, 0.2)'
        : m.saved
          ? 'rgba(255, 227, 107, 0.22)'
          : 'rgba(255, 227, 107, 0.14)';
    ctx.beginPath();
    ctx.arc(0, 0, 10 * s, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.rotate(-0.55 + flap);
    ctx.fillStyle = warn > 0.2 ? 'rgba(255, 140, 190, 0.72)' : 'rgba(246, 243, 255, 0.55)';
    ctx.strokeStyle = warn > 0.2 ? 'rgba(255, 61, 184, 0.9)' : followLamp ? 'rgba(0, 240, 255, 0.85)' : 'rgba(255, 61, 184, 0.7)';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.ellipse(-2 * s, 0, 8.4 * s, 3.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.rotate(0.55 - flap);
    ctx.fillStyle = warn > 0.2 ? 'rgba(255, 140, 190, 0.72)' : 'rgba(232, 250, 255, 0.5)';
    ctx.strokeStyle = warn > 0.2 ? 'rgba(255, 61, 184, 0.9)' : followLamp ? 'rgba(0, 240, 255, 0.85)' : 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.ellipse(2 * s, 0, 8.4 * s, 3.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = m.saved ? '#ffe36b' : '#f6f3ff';
    ctx.beginPath();
    ctx.ellipse(0, 0, 2.1 * s, 4.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawRings() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.62;
      ctx.strokeStyle = r.mag
        ? 'rgba(255, 61, 184,' + (0.7 * (1 - k)) + ')'
        : 'rgba(0, 240, 255,' + (0.7 * (1 - k)) + ')';
      ctx.lineWidth = (2.2 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (10 + k * 42) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.cyan
        ? 'rgba(0, 240, 255,' + (0.7 * a) + ')'
        : p.mag
          ? 'rgba(255, 61, 184,' + (0.75 * a) + ')'
          : 'rgba(255, 227, 107,' + (0.75 * a) + ')';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVignette() {
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (0.16 * G.magFlash) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (0.1 * G.goldFlash) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.28, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawBg();
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawWinds();
    drawSafe();
    for (let i = 0; i < G.flames.length; i++) drawFlame(G.flames[i]);
    drawLampGlow();
    drawRings();
    for (let i = 0; i < G.moths.length; i++) drawMoth(G.moths[i]);
    drawLampBody();
    drawParticles();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawVignette();
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    if (hidden) return;
    acc += dt;
    if (acc > 0.25) acc = 0.25;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
  }

  function keyOn(code, down) {
    if (code === 'ArrowLeft' || code === 'KeyA') keys.l = down;
    if (code === 'ArrowRight' || code === 'KeyD') keys.r = down;
    if (code === 'ArrowUp' || code === 'KeyW') keys.u = down;
    if (code === 'ArrowDown' || code === 'KeyS') keys.d = down;
  }

  window.addEventListener('keydown', function (e) {
    if (e.repeat && (e.code === 'KeyM' || e.code === 'KeyR' || e.code === 'Space' || e.code === 'Enter')) return;
    keyOn(e.code, true);
    if (e.code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
    }
    if (e.code === 'KeyR') {
      audio.ensure();
      if (G.mode === 'title') startRun();
      else if (G.mode === 'fail' && G.lives > 0) startStage(G.stage, true);
      else startRun();
      e.preventDefault();
    }
    if (e.code === 'Space' || e.code === 'Enter') {
      if (!overlay.classList.contains('hidden')) {
        overlayAction();
        e.preventDefault();
      }
    }
    if (e.code.indexOf('Arrow') === 0 || e.code === 'Space') e.preventDefault();
  });

  window.addEventListener('keyup', function (e) {
    keyOn(e.code, false);
  });

  function onPtr(e, kind) {
    if (e.target.closest && e.target.closest('.tools, .panel, button')) return;
    const w = pointerWorld(e);
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.touch = e.pointerType === 'touch';
    if (kind === 'down') {
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      audio.ensure();
    } else if (kind === 'move') {
      if (pointer.down || e.pointerType === 'mouse') pointer.hover = true;
    } else {
      if (pointer.id == null || e.pointerId === pointer.id) {
        pointer.down = false;
        pointer.id = null;
        if (e.pointerType === 'touch') pointer.hover = false;
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) { onPtr(e, 'down'); e.preventDefault(); });
  canvas.addEventListener('pointermove', function (e) { onPtr(e, 'move'); });
  canvas.addEventListener('pointerup', function (e) { onPtr(e, 'up'); });
  canvas.addEventListener('pointercancel', function (e) { onPtr(e, 'up'); });
  canvas.addEventListener('pointerleave', function () {
    if (!pointer.down) pointer.hover = false;
  });

  ovBtn.addEventListener('click', function () { overlayAction(); });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startRun();
    else startRun();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) last = 0;
  });

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  seedDecor();
  resize();
  bootTitle();
  requestAnimationFrame(frame);
})();
