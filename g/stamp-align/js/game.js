'use strict';

(function () {
  const VW = 480;
  const VH = 760;
  const PAPER_CX = 240;
  const PAPER_CY = 448;
  const PAPER = 286;
  const LIFT = 118;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const ACC = 2550;
  const MAX_V = 460;
  const FRIC = 9.4;
  const ROT_SPD = 2.45;
  const MUTE_KEY = 'playbox-stamp-align-mute';
  const OPS = 'WASD / 方向键挪印 · Q E 旋转 · 拖动 / 拖圆环 · 空格盖下 · M 静音';

  const STAGES = [
    {
      name: '初盖',
      sub: 'FIRST',
      pat: 'plus',
      sym: 4,
      size: 110,
      fall: 6.9,
      posTol: 32,
      rotTol: 0.85,
      start: { x: -92, y: 6, rot: 0 },
      target: { x: 0, y: 0, rot: 0 },
      hint: '左右把印挪到青影上 · 合上会亮金'
    },
    {
      name: '对格',
      sub: 'GRID',
      pat: 'plus',
      sym: 4,
      size: 104,
      fall: 6.4,
      posTol: 24,
      rotTol: 0.8,
      start: { x: 74, y: -68, rot: 0 },
      target: { x: 10, y: 16, rot: 0 },
      hint: '上下左右都要对上'
    },
    {
      name: '转角',
      sub: 'TWIST',
      pat: 'chev',
      size: 100,
      fall: 6.7,
      posTol: 22,
      rotTol: 0.2,
      start: { x: -10, y: 6, rot: 1.18 },
      target: { x: 0, y: 0, rot: 0.12 },
      hint: 'Q E 或拖圆环把印转正'
    },
    {
      name: '斜印',
      sub: 'SKEW',
      pat: 'ring',
      size: 98,
      fall: 5.8,
      posTol: 18,
      rotTol: 0.16,
      start: { x: 86, y: 52, rot: -0.78 },
      target: { x: -14, y: -8, rot: 0.4 },
      hint: '位置和角度一起合'
    },
    {
      name: '游纸',
      sub: 'SLIDE',
      pat: 'grid',
      size: 96,
      fall: 6.3,
      posTol: 16,
      rotTol: 0.15,
      start: { x: -58, y: 44, rot: 0.34 },
      target: { x: 0, y: 0, rot: 0.08 },
      paper: { kind: 'x', amp: 52, period: 3.5 },
      hint: '纸在游 · 跟着青影走'
    },
    {
      name: '自旋',
      sub: 'SPIN',
      pat: 'moon',
      size: 96,
      fall: 6.1,
      posTol: 16,
      rotTol: 0.14,
      start: { x: 44, y: -36, rot: 0.1 },
      target: { x: 8, y: 6, rot: 0.55 },
      spin: 0.82,
      hint: '印自己在转 · 借力对上，或反拧'
    },
    {
      name: '微隙',
      sub: 'HAIR',
      pat: 'dia',
      size: 92,
      fall: 5.2,
      posTol: 11,
      rotTol: 0.09,
      start: { x: -76, y: 50, rot: 0.62 },
      target: { x: 16, y: -12, rot: 0.72 },
      hint: '缝很窄 · 金光稳住再盖'
    },
    {
      name: '偏心',
      sub: 'OFF',
      pat: 'fork',
      size: 94,
      fall: 5.4,
      posTol: 13,
      rotTol: 0.1,
      start: { x: 62, y: 68, rot: -1.15 },
      target: { x: -18, y: 10, rot: 0.28 },
      paper: { kind: 'y', amp: 30, period: 4.0 },
      hint: '图案不对称 · 转错方向合不上'
    },
    {
      name: '急落',
      sub: 'DROP',
      pat: 'petal',
      size: 90,
      fall: 4.05,
      posTol: 12,
      rotTol: 0.1,
      start: { x: -88, y: -48, rot: 1.22 },
      target: { x: 16, y: 20, rot: -0.38 },
      spin: -0.58,
      hint: '落得快 · 对准就空格盖下'
    },
    {
      name: '封缄',
      sub: 'SEAL',
      pat: 'seal',
      size: 88,
      fall: 3.65,
      posTol: 9,
      rotTol: 0.072,
      start: { x: 82, y: -58, rot: -0.5 },
      target: { x: 0, y: 4, rot: 0.86 },
      spin: 1.12,
      paper: { kind: 'orbit', amp: 34, period: 3.15 },
      hint: '纸绕圈、印在转 · 封上最后一印'
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
  const btnStamp = document.getElementById('btn-stamp');
  const fitWrap = document.getElementById('fit-wrap');
  const fitBar = document.getElementById('fit-bar');
  const fallWrap = document.getElementById('fall-wrap');
  const fallBar = document.getElementById('fall-bar');
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

  const keys = { l: false, r: false, u: false, d: false, ccw: false, cw: false };
  const ptr = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    grabX: 0,
    grabY: 0,
    rot: false,
    originY: 0,
    ang0: 0,
    moved: 0,
    t0: 0
  };

  const particles = [];
  const motes = [];
  const rings = [];
  const pips = [];
  const impressions = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    song: 0,
    stage: 0,
    lives: LIVES,
    h: 1,
    fall: 6.8,
    sx: PAPER_CX,
    sy: PAPER_CY,
    rot: 0,
    vx: 0,
    vy: 0,
    size: 110,
    pat: 'plus',
    sym: 4,
    tbase: { x: 0, y: 0, rot: 0 },
    tx: PAPER_CX,
    ty: PAPER_CY,
    trot: 0,
    posTol: 30,
    rotTol: 0.3,
    paper: null,
    spin: 0,
    fit: 0,
    fitShow: 0,
    aligned: false,
    wasAligned: false,
    slam: 0,
    impact: 0,
    lock: 0,
    settle: 0,
    shake: 0,
    magFlash: 0,
    goldFlash: 0,
    toastT: 0,
    warned: false,
    taught: false,
    why: '',
    rotBucket: 0
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
  function normAng(a) {
    while (a <= -Math.PI) a += TAU;
    while (a > Math.PI) a -= TAU;
    return a;
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
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

  function paperShift() {
    const p = G.paper;
    if (!p) return { x: 0, y: 0 };
    const a = G.song * TAU / Math.max(0.2, p.period);
    if (p.kind === 'x') return { x: Math.sin(a) * p.amp, y: 0 };
    if (p.kind === 'y') return { x: 0, y: Math.sin(a) * p.amp };
    if (p.kind === 'orbit') return { x: Math.cos(a) * p.amp, y: Math.sin(a) * p.amp };
    return { x: 0, y: 0 };
  }

  function refreshTarget() {
    const sh = paperShift();
    G.tx = PAPER_CX + G.tbase.x + sh.x;
    G.ty = PAPER_CY + G.tbase.y + sh.y;
    G.trot = G.tbase.rot;
  }

  function posErr() {
    return hypot(G.sx - G.tx, G.sy - G.ty);
  }

  function rotErr() {
    let d = Math.abs(normAng(G.rot - G.trot));
    const fold = G.sym || 1;
    if (fold > 1) {
      const step = TAU / fold;
      d = d % step;
      if (d > step * 0.5) d = step - d;
    }
    return d;
  }

  function computeFit() {
    const p = clamp(1 - posErr() / (G.posTol * 2.35), 0, 1);
    const r = clamp(1 - rotErr() / (G.rotTol * 2.6), 0, 1);
    return p * r;
  }

  function isAligned() {
    return posErr() <= G.posTol && rotErr() <= G.rotTol;
  }

  function stampBounds() {
    const half = G.size * 0.5;
    const pad = PAPER * 0.5 - 10;
    return {
      loX: PAPER_CX - pad + half * 0.15,
      hiX: PAPER_CX + pad - half * 0.15,
      loY: PAPER_CY - pad + half * 0.15,
      hiY: PAPER_CY + pad - half * 0.15
    };
  }

  function clampStamp() {
    const b = stampBounds();
    G.sx = clamp(G.sx, b.loX, b.hiX);
    G.sy = clamp(G.sy, b.loY, b.hiY);
  }

  function visY() {
    return G.sy - G.h * LIFT;
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
      const n = Math.min(0.18, Math.max(0.04, dur));
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
    lock() {
      this.ensure();
      this.beep(784, 0.1, 'sine', 0.055, 1175);
      this.beep(1175, 0.16, 'triangle', 0.04);
    },
    unlock() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.03, 220);
    },
    reject() {
      this.ensure();
      this.beep(196, 0.09, 'triangle', 0.04, 140);
    },
    tick() {
      this.ensure();
      this.beep(880, 0.03, 'sine', 0.02);
    },
    warn() {
      this.ensure();
      this.beep(240, 0.08, 'sine', 0.05, 160);
    },
    slam() {
      this.ensure();
      this.noise(0.16, 0.07, 400);
      this.beep(90, 0.22, 'sine', 0.08, 48);
    },
    ok() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06, 523);
      this.beep(659, 0.14, 'sine', 0.05, 659);
      this.beep(784, 0.22, 'triangle', 0.055, 1046);
    },
    miss() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(220, 0.22, 'sawtooth', 0.045, 70);
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
      this.beep(392, 0.1, 'sine', 0.05, 784);
    },
    rotClick() {
      this.ensure();
      this.beep(640, 0.03, 'square', 0.016);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
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
        g: spec.g == null ? 380 : spec.g
      });
    }
  }

  function addRing(x, y, gold, mag) {
    rings.push({ x: x, y: y, t: 0, gold: !!gold, mag: !!mag });
    if (rings.length > 16) rings.shift();
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

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const fit = G.mode === 'title' ? G.fitShow : G.fitShow;
    const h = clamp(G.h, 0, 1);
    fitBar.style.transform = 'scaleX(' + clamp(fit, 0, 1) + ')';
    fallBar.style.transform = 'scaleX(' + h + ')';
    const aligned = G.aligned && (G.mode === 'play' || G.mode === 'title');
    const low = G.mode === 'play' && h < 0.22 && G.slam === 0;
    fitWrap.classList.toggle('hot', aligned);
    fallWrap.classList.toggle('warn', low);
    if (G.mode === 'title') {
      stageLabel.textContent = '十印';
      timeLabel.textContent = '对齐再盖';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 印 · ' + (st ? st.name : '');
      const sec = G.fall * h;
      timeLabel.textContent = sec.toFixed(1) + 's';
    }
    stageLabel.classList.toggle('hot', aligned);
    timeLabel.classList.toggle('warn', low);
    btnStamp.classList.toggle('go', aligned && G.mode === 'play' && G.slam === 0);
    btnStamp.disabled = G.mode !== 'play' || G.slam !== 0;
    syncPips();
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
    G.pat = st.pat;
    G.sym = st.sym || 1;
    G.size = st.size;
    G.fall = st.fall;
    G.posTol = st.posTol;
    G.rotTol = st.rotTol;
    G.paper = st.paper || null;
    G.spin = st.spin || 0;
    G.tbase.x = st.target.x;
    G.tbase.y = st.target.y;
    G.tbase.rot = st.target.rot;
    G.song = 0;
    G.h = demo ? 0.62 : 1;
    G.sx = PAPER_CX + st.start.x;
    G.sy = PAPER_CY + st.start.y;
    G.rot = st.start.rot;
    G.vx = 0;
    G.vy = 0;
    G.slam = 0;
    G.impact = 0;
    G.fit = 0;
    G.aligned = false;
    G.wasAligned = false;
    G.warned = false;
    G.why = '';
    refreshTarget();
    clampStamp();
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.18;
    G.settle = 0;
    applyStage(STAGES[i], false);
    impressions.length = 0;
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    impressions.length = 0;
    G.lives = LIVES;
    G.taught = false;
    startStage(0);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    impressions.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    G.taught = false;
    applyStage(STAGES[0], true);
    showOverlay(
      'title',
      '盖印',
      '印落下前把图案对齐纸。<br />合上会亮金，空格或点「盖」提前按下。',
      '开盖',
      'STAMP',
      OPS
    );
    setHint('对上金光再盖 · 印会自己落下', '');
    syncHud();
  }

  function trySlam() {
    if (G.mode !== 'play' || G.slam !== 0 || G.lock > 0) return;
    if (!G.aligned) {
      audio.reject();
      toast('还没合上', true);
      G.shake = Math.max(G.shake, 5);
      return;
    }
    G.slam = 1;
    audio.tick();
  }

  function land() {
    if (G.slam >= 2) return;
    G.h = 0;
    G.slam = 2;
    G.impact = 1;
    G.vx = 0;
    G.vy = 0;
    refreshTarget();
    const ok = isAligned();
    G.why = ok ? 'ok' : 'miss';
    audio.slam();
    addRing(G.sx, G.sy, ok, !ok);
    if (ok) {
      impressions.push({
        x: G.tx,
        y: G.ty,
        rot: G.trot,
        size: G.size,
        pat: G.pat,
        gold: true,
        smear: 0,
        t: 1
      });
      G.goldFlash = 0.7;
      emit(22, {
        x: G.sx, y: G.sy, j: 18,
        vx0: -90, vx1: 90, vy0: -160, vy1: -20,
        life: 0.62, r0: 1.2, r1: 3.4, gold: true, g: 240
      });
    } else {
      impressions.push({
        x: G.sx + rand(-6, 6),
        y: G.sy + rand(-4, 4),
        rot: G.rot + rand(-0.12, 0.12),
        size: G.size,
        pat: G.pat,
        gold: false,
        smear: 0.18,
        t: 1
      });
      G.magFlash = 0.7;
      G.shake = 16;
      emit(18, {
        x: G.sx, y: G.sy, j: 16,
        vx0: -110, vx1: 110, vy0: -90, vy1: 30,
        life: 0.55, r0: 1.1, r1: 3.2, mag: true, g: 420
      });
    }
  }

  function succeed() {
    if (G.mode !== 'play') return;
    audio.ok();
    toast('合印', false, true);
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '封缄',
        '十印皆合，纸上留金。',
        '再盖一巡',
        'SEALED'
      );
      setHint('十印皆合', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 0.95;
    setHint('下一印', 'hot');
  }

  function failLand() {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.lives -= 1;
    syncHud();
    audio.miss();
    const more = G.lives > 0;
    showOverlay(
      'lose',
      '偏了',
      more
        ? '落下时没对齐，纸上花了。<br />还剩 ' + G.lives + ' 次。'
        : '三印皆偏，纸上花了。',
      more ? '再试本印' : '再来一局',
      'MISALIGN'
    );
    setHint('印偏了', 'warn');
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

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function nearRing(wx, wy) {
    const half = G.size * 0.5;
    const inner = half * 0.9;
    const outer = half * 1.68;
    const d1 = hypot(wx - G.sx, wy - visY());
    const d2 = hypot(wx - G.sx, wy - G.sy);
    if (d1 > inner && d1 < outer) return { x: G.sx, y: visY() };
    if (d2 > inner && d2 < outer) return { x: G.sx, y: G.sy };
    return null;
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
        r: rand(0.55, 1.7),
        a: rand(0.04, 0.15),
        p: rand(0, TAU),
        s: rand(5, 16)
      });
    }
  }

  function updateMove(dt) {
    const can = (G.mode === 'play' || G.mode === 'title') && G.slam === 0;
    if (!can) {
      G.vx *= Math.exp(-dt * 8);
      G.vy *= Math.exp(-dt * 8);
      return;
    }
    if (G.mode === 'play' && ptr.down && !ptr.rot) {
      const tx = ptr.x - ptr.grabX;
      const ty = ptr.y - ptr.grabY;
      const nx = lerp(G.sx, tx, 1 - Math.exp(-18 * dt));
      const ny = lerp(G.sy, ty, 1 - Math.exp(-18 * dt));
      G.vx = (nx - G.sx) / Math.max(dt, 0.001);
      G.vy = (ny - G.sy) / Math.max(dt, 0.001);
      G.sx = nx;
      G.sy = ny;
    } else if (G.mode === 'play') {
      let ax = 0;
      let ay = 0;
      if (keys.l) ax -= ACC;
      if (keys.r) ax += ACC;
      if (keys.u) ay -= ACC;
      if (keys.d) ay += ACC;
      G.vx += ax * dt;
      G.vy += ay * dt;
      if (!keys.l && !keys.r) G.vx *= Math.exp(-dt * FRIC);
      if (!keys.u && !keys.d) G.vy *= Math.exp(-dt * FRIC);
      G.vx = clamp(G.vx, -MAX_V, MAX_V);
      G.vy = clamp(G.vy, -MAX_V, MAX_V);
      G.sx += G.vx * dt;
      G.sy += G.vy * dt;
    }
    if (G.mode === 'play' && ptr.down && ptr.rot) {
      const ang = Math.atan2(ptr.y - ptr.originY, ptr.x - G.sx);
      G.rot = ang - ptr.ang0;
    } else if (G.mode === 'play') {
      if (keys.ccw) G.rot -= ROT_SPD * dt;
      if (keys.cw) G.rot += ROT_SPD * dt;
    }
    if (G.mode === 'play' && G.spin) G.rot += G.spin * dt;
    clampStamp();
    if (G.mode === 'play' && G.aligned && G.slam === 0 && !(ptr.down && !ptr.rot)) {
      const keying = keys.l || keys.r || keys.u || keys.d;
      const k = (G.spin ? 1.5 : 4.6) * (keying ? 0.28 : 1);
      G.sx = lerp(G.sx, G.tx, 1 - Math.exp(-k * dt));
      G.sy = lerp(G.sy, G.ty, 1 - Math.exp(-k * dt));
      if (!keys.ccw && !keys.cw && !(ptr.down && ptr.rot)) {
        let best = normAng(G.trot - G.rot);
        const fold = G.sym || 1;
        if (fold > 1) {
          const step = TAU / fold;
          for (let i = 1; i < fold; i++) {
            const cand = normAng(G.trot + i * step - G.rot);
            if (Math.abs(cand) < Math.abs(best)) best = cand;
          }
        }
        G.rot += best * (1 - Math.exp(-k * 0.85 * dt));
      }
    }
    const bucket = Math.round(G.rot / (TAU / 16));
    if (bucket !== G.rotBucket && (keys.ccw || keys.cw || (ptr.down && ptr.rot))) {
      G.rotBucket = bucket;
      if (G.mode === 'play') audio.rotClick();
    } else {
      G.rotBucket = bucket;
    }
  }

  function updateTitle(dt) {
    G.song += dt;
    refreshTarget();
    const wob = G.clock;
    G.h = 0.52 + Math.sin(wob * 0.65) * 0.16;
    const wantX = G.tx + Math.sin(wob * 0.55) * 38;
    const wantY = G.ty + Math.cos(wob * 0.42) * 28;
    G.sx = lerp(G.sx, wantX, 1 - Math.exp(-1.6 * dt));
    G.sy = lerp(G.sy, wantY, 1 - Math.exp(-1.6 * dt));
    G.rot = lerp(G.rot, G.trot + Math.sin(wob * 0.5) * 0.28, 1 - Math.exp(-1.4 * dt));
    clampStamp();
  }

  function updatePlay(dt) {
    G.song += dt;
    refreshTarget();
    if (G.slam === 0) {
      G.h = Math.max(0, G.h - dt / G.fall);
      if (G.h <= 0) land();
    } else if (G.slam === 1) {
      G.h = Math.max(0, G.h - dt / 0.16);
      if (G.h <= 0) land();
    } else if (G.slam === 2) {
      G.impact = Math.max(0, G.impact - dt * 2.4);
      if (G.impact <= 0.38 && G.why === 'ok') {
        G.why = 'done';
        succeed();
      } else if (G.impact <= 0.38 && G.why === 'miss') {
        G.why = 'done';
        failLand();
      }
    }
    if (G.mode === 'play' && G.slam === 0 && G.h < 0.2 && !G.warned) {
      G.warned = true;
      audio.warn();
      toast('要落下了', true);
      setHint('要落下了', 'warn');
    }
  }

  function updateFit(dt) {
    refreshTarget();
    G.fit = computeFit();
    G.fitShow = lerp(G.fitShow, G.fit, 1 - Math.exp(-14 * dt));
    const on = isAligned();
    G.aligned = on;
    if (on && !G.wasAligned) {
      if (G.mode === 'play') {
        audio.lock();
        addRing(G.tx, G.ty, true, false);
        if (!G.taught) {
          G.taught = true;
          toast('合上了 · 空格盖下', false, true);
        }
        setHint('合上了 · 空格或点「盖」', 'hot');
      }
    } else if (!on && G.wasAligned && G.mode === 'play' && G.slam === 0) {
      audio.unlock();
      const st = STAGES[G.stage];
      if (st) setHint(st.hint, '');
    }
    G.wasAligned = on;
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.8);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lock = Math.max(0, G.lock - dt);
    G.impact = G.slam === 2 ? G.impact : Math.max(0, G.impact - dt * 2);
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
    for (let i = impressions.length - 1; i >= 0; i--) {
      impressions[i].t = Math.min(1.4, impressions[i].t + dt);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') {
      updateTitle(dt);
      updateFit(dt);
    } else if (G.mode === 'play') {
      updateMove(dt);
      updatePlay(dt);
      updateFit(dt);
    } else if (G.mode === 'clear') {
      G.settle -= dt;
      if (G.settle <= 0) startStage(G.stage + 1);
    }
    updateFx(dt);
    syncHud();
  }

  function styleOf(mode) {
    if (mode === 'ghost') {
      return {
        stroke: G.aligned ? 'rgba(255, 227, 107, 0.95)' : 'rgba(0, 240, 255, 0.88)',
        fill: G.aligned ? 'rgba(255, 227, 107, 0.14)' : 'rgba(0, 240, 255, 0.07)',
        w: 0.09
      };
    }
    if (mode === 'proj') {
      return {
        stroke: G.aligned ? 'rgba(255, 227, 107, 0.7)' : 'rgba(255, 61, 184, 0.55)',
        fill: G.aligned ? 'rgba(255, 227, 107, 0.1)' : 'rgba(255, 61, 184, 0.08)',
        w: 0.08
      };
    }
    if (mode === 'carve') {
      return {
        stroke: G.aligned ? 'rgba(255, 227, 107, 0.95)' : 'rgba(255, 90, 180, 0.95)',
        fill: G.aligned ? 'rgba(255, 227, 107, 0.2)' : 'rgba(255, 61, 184, 0.16)',
        w: 0.1
      };
    }
    if (mode === 'gold') {
      return { stroke: 'rgba(255, 227, 107, 0.92)', fill: 'rgba(255, 227, 107, 0.55)', w: 0.1 };
    }
    return { stroke: 'rgba(255, 61, 184, 0.7)', fill: 'rgba(255, 61, 184, 0.42)', w: 0.11 };
  }

  function faceClip(c) {
    roundRect(c, -0.98, -0.98, 1.96, 1.96, 0.14);
    c.clip();
  }

  function drawPat(c, name, mode) {
    const s = styleOf(mode);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = s.stroke;
    c.fillStyle = s.fill;
    c.lineWidth = s.w;
    faceClip(c);
    roundRect(c, -0.9, -0.9, 1.8, 1.8, 0.1);
    c.fill();
    c.stroke();

    const ink = mode === 'gold' || mode === 'smear';
    if (ink) c.fillStyle = s.fill;

    if (name === 'plus') {
      c.beginPath();
      roundRect(c, -0.16, -0.68, 0.32, 1.36, 0.08);
      c.fill();
      c.stroke();
      c.beginPath();
      roundRect(c, -0.68, -0.16, 1.36, 0.32, 0.08);
      c.fill();
      c.stroke();
      c.beginPath();
      roundRect(c, -0.14, -0.14, 0.28, 0.28, 0.05);
      c.stroke();
    } else if (name === 'ring') {
      c.beginPath();
      c.arc(0, 0, 0.56, 0, TAU);
      c.stroke();
      c.beginPath();
      c.arc(0, 0, 0.26, 0, TAU);
      if (ink) c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(0, -0.86);
      c.lineTo(0, -0.62);
      c.moveTo(-0.78, 0);
      c.lineTo(-0.6, 0);
      c.moveTo(0.78, 0);
      c.lineTo(0.6, 0);
      c.stroke();
      c.beginPath();
      c.arc(0, -0.74, 0.08, 0, TAU);
      c.fill();
      c.stroke();
    } else if (name === 'chev') {
      c.beginPath();
      c.moveTo(-0.62, 0.12);
      c.lineTo(0, -0.62);
      c.lineTo(0.62, 0.12);
      c.stroke();
      c.beginPath();
      c.moveTo(-0.42, 0.46);
      c.lineTo(0.42, 0.46);
      c.stroke();
      c.beginPath();
      c.moveTo(0, -0.18);
      c.lineTo(0, 0.7);
      c.stroke();
      c.beginPath();
      c.arc(0, 0.7, 0.1, 0, TAU);
      c.fill();
      c.stroke();
    } else if (name === 'grid') {
      c.beginPath();
      c.moveTo(-0.3, -0.72);
      c.lineTo(-0.3, 0.72);
      c.moveTo(0.3, -0.72);
      c.lineTo(0.3, 0.72);
      c.moveTo(-0.72, -0.3);
      c.lineTo(0.72, -0.3);
      c.moveTo(-0.72, 0.3);
      c.lineTo(0.72, 0.3);
      c.stroke();
      roundRect(c, -0.68, -0.68, 0.34, 0.34, 0.05);
      c.fill();
      c.stroke();
      c.beginPath();
      c.arc(0.5, 0.5, 0.12, 0, TAU);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(0.32, -0.62);
      c.lineTo(0.68, -0.62);
      c.stroke();
    } else if (name === 'moon') {
      c.beginPath();
      c.arc(-0.12, 0, 0.54, 0.45, -0.45, false);
      c.stroke();
      c.beginPath();
      c.arc(0.12, 0, 0.38, 0.7, -0.7, true);
      c.stroke();
      c.beginPath();
      c.moveTo(0.42, -0.62);
      c.lineTo(0.42, 0.62);
      c.stroke();
      c.beginPath();
      c.arc(0.62, -0.48, 0.1, 0, TAU);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(0.28, 0.7);
      c.lineTo(0.58, 0.7);
      c.stroke();
    } else if (name === 'dia') {
      c.beginPath();
      c.moveTo(0, -0.78);
      c.lineTo(0.78, 0);
      c.lineTo(0, 0.78);
      c.lineTo(-0.78, 0);
      c.closePath();
      c.stroke();
      c.beginPath();
      c.moveTo(0, -0.42);
      c.lineTo(0.42, 0);
      c.lineTo(0, 0.42);
      c.lineTo(-0.42, 0);
      c.closePath();
      if (ink) c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(0, -0.78);
      c.lineTo(0, -0.5);
      c.moveTo(-0.16, -0.62);
      c.lineTo(0.16, -0.62);
      c.stroke();
    } else if (name === 'fork') {
      c.beginPath();
      c.moveTo(0.04, 0.72);
      c.lineTo(0.04, 0.04);
      c.lineTo(-0.58, -0.58);
      c.moveTo(0.04, 0.04);
      c.lineTo(0.42, -0.32);
      c.stroke();
      c.beginPath();
      c.moveTo(-0.28, 0.72);
      c.lineTo(0.34, 0.72);
      c.stroke();
      c.beginPath();
      c.arc(-0.58, -0.58, 0.1, 0, TAU);
      c.fill();
      c.stroke();
      c.beginPath();
      c.arc(0.46, -0.36, 0.07, 0, TAU);
      c.stroke();
    } else if (name === 'petal') {
      function petal(ang, rx, ry) {
        c.save();
        c.rotate(ang);
        c.beginPath();
        c.ellipse(0, -0.42, rx, ry, 0, 0, TAU);
        c.stroke();
        if (ink) c.fill();
        c.restore();
      }
      petal(0, 0.2, 0.36);
      petal(2.1, 0.18, 0.3);
      petal(-2.1, 0.18, 0.3);
      c.beginPath();
      c.moveTo(0, 0.12);
      c.lineTo(0, 0.78);
      c.stroke();
      c.beginPath();
      c.arc(0, 0, 0.16, 0, TAU);
      c.fill();
      c.stroke();
      c.beginPath();
      c.arc(0, -0.72, 0.08, 0, TAU);
      c.fill();
      c.stroke();
    } else {
      roundRect(c, -0.62, -0.62, 1.24, 1.24, 0.08);
      c.stroke();
      c.beginPath();
      c.moveTo(0, -0.46);
      c.lineTo(0.46, 0);
      c.lineTo(0, 0.46);
      c.lineTo(-0.46, 0);
      c.closePath();
      c.stroke();
      c.beginPath();
      c.moveTo(-0.34, -0.18);
      c.lineTo(0.34, -0.18);
      c.moveTo(-0.26, 0.06);
      c.lineTo(0.26, 0.06);
      c.moveTo(-0.16, 0.28);
      c.lineTo(0.16, 0.28);
      c.stroke();
      c.beginPath();
      c.arc(-0.7, -0.7, 0.08, 0, TAU);
      c.fill();
      c.beginPath();
      c.arc(0.7, -0.7, 0.08, 0, TAU);
      c.fill();
      c.beginPath();
      c.arc(0.7, 0.7, 0.08, 0, TAU);
      c.fill();
      c.beginPath();
      c.moveTo(-0.78, 0.62);
      c.lineTo(-0.52, 0.78);
      c.stroke();
    }
  }

  function withFace(x, y, rot, size, fn) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(rot);
    const s = size * 0.5 * scale;
    ctx.scale(s, s);
    fn(ctx);
    ctx.restore();
  }

  function faceCorners(cx, cy, rot, half) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const src = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const out = [];
    for (let i = 0; i < 4; i++) {
      const x = src[i][0] * half;
      const y = src[i][1] * half;
      out.push({
        x: cx + x * c - y * s,
        y: cy + x * s + y * c
      });
    }
    return out;
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createRadialGradient(sx(80), sy(40), 8, sx(80), sy(40), 300 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.15)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(70), 8, sx(400), sy(70), 280 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.11)');
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
    vg.addColorStop(1, 'rgba(6, 10, 24, 0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.35 + m.p) * 8);
      const y = sy((m.y + G.clock * m.s) % VH);
      ctx.fillStyle = 'rgba(180, 230, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPress() {
    const lift = G.h * LIFT;
    const topY = visY() - G.size * 0.5 - 26;
    const beamY = Math.min(48, topY - 10);

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(36), sy(18));
    ctx.lineTo(sx(36), sy(PAPER_CY + PAPER * 0.42));
    ctx.moveTo(sx(VW - 36), sy(18));
    ctx.lineTo(sx(VW - 36), sy(PAPER_CY + PAPER * 0.42));
    ctx.stroke();

    ctx.fillStyle = 'rgba(12, 8, 22, 0.92)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 1.6 * scale;
    roundRect(ctx, sx(22), sy(beamY - 10), (VW - 44) * scale, 18 * scale, 5 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = G.aligned
      ? 'rgba(255, 227, 107, 0.55)'
      : 'rgba(255, 61, 184, 0.4)';
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(G.sx), sy(beamY + 8));
    ctx.lineTo(sx(G.sx), sy(topY + 4));
    ctx.stroke();

    ctx.fillStyle = G.h < 0.22 && G.mode === 'play'
      ? 'rgba(255, 61, 184, 0.85)'
      : 'rgba(0, 240, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(sx(G.sx), sy(beamY + 8), 4.2 * scale, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(139, 144, 184, 0.35)';
    ctx.font = '600 ' + Math.max(10, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('落', sx(44), sy(beamY - 1));
    ctx.restore();
  }

  function drawPaper() {
    const x = sx(PAPER_CX - PAPER * 0.5);
    const y = sy(PAPER_CY - PAPER * 0.5);
    const w = PAPER * scale;
    const h = PAPER * scale;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    roundRect(ctx, x + 8 * scale, y + 12 * scale, w, h, 10 * scale);
    ctx.fill();

    roundRect(ctx, x, y, w, h, 10 * scale);
    const pg = ctx.createLinearGradient(x, y, x + w, y + h);
    pg.addColorStop(0, '#161225');
    pg.addColorStop(0.5, '#12101c');
    pg.addColorStop(1, '#0e101c');
    ctx.fillStyle = pg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.38)';
    ctx.lineWidth = 1.7 * scale;
    ctx.stroke();

    ctx.save();
    roundRect(ctx, x, y, w, h, 10 * scale);
    ctx.clip();
    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    for (let i = 18; i < PAPER; i += 14) {
      ctx.beginPath();
      ctx.moveTo(x, y + i * scale);
      ctx.lineTo(x + w, y + i * scale);
      ctx.stroke();
    }
    ctx.restore();

    const marks = [
      [PAPER_CX - PAPER * 0.42, PAPER_CY - PAPER * 0.42, 1, 1],
      [PAPER_CX + PAPER * 0.42, PAPER_CY - PAPER * 0.42, -1, 1],
      [PAPER_CX - PAPER * 0.42, PAPER_CY + PAPER * 0.42, 1, -1],
      [PAPER_CX + PAPER * 0.42, PAPER_CY + PAPER * 0.42, -1, -1]
    ];
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 1.8 * scale;
    ctx.lineCap = 'round';
    for (let i = 0; i < marks.length; i++) {
      const m = marks[i];
      ctx.beginPath();
      ctx.moveTo(sx(m[0]), sy(m[1] + 12 * m[3]));
      ctx.lineTo(sx(m[0]), sy(m[1]));
      ctx.lineTo(sx(m[0] + 12 * m[2]), sy(m[1]));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGhost() {
    const pulse = G.aligned ? 0.55 + Math.sin(G.clock * 9) * 0.2 : 0.2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.35 + pulse;
    withFace(G.tx, G.ty, G.trot, G.size * 1.02, function (c) {
      drawPat(c, G.pat, 'ghost');
    });
    ctx.restore();

    if (G.aligned && G.slam === 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255, 227, 107,' + (0.35 + pulse * 0.4) + ')';
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(G.tx), sy(G.ty), (G.size * 0.72 + Math.sin(G.clock * 8) * 3) * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawImpressions() {
    for (let i = 0; i < impressions.length; i++) {
      const im = impressions[i];
      const a = clamp(im.t, 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.35 + a * 0.5;
      withFace(im.x + (im.smear ? 8 : 0), im.y + (im.smear ? 5 : 0), im.rot, im.size, function (c) {
        drawPat(c, im.pat, im.gold ? 'gold' : 'smear');
      });
      ctx.restore();
    }
  }

  function drawProjection() {
    if (G.h <= 0.02) return;
    const a = 0.22 + (1 - G.h) * 0.45;
    ctx.save();
    ctx.globalAlpha = a;
    withFace(G.sx, G.sy, G.rot, G.size, function (c) {
      drawPat(c, G.pat, 'proj');
    });
    ctx.restore();

    const shx = G.sx + G.h * 16;
    const shy = G.sy + G.h * 12;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0,' + (0.18 + G.h * 0.18) + ')';
    ctx.beginPath();
    ctx.ellipse(
      sx(shx),
      sy(shy),
      G.size * 0.58 * scale,
      G.size * 0.22 * scale,
      0.2,
      0,
      TAU
    );
    ctx.fill();
    ctx.restore();
  }

  function drawStamp() {
    const cx = G.sx;
    const cy = visY();
    const half = G.size * 0.5;
    const thick = 7 + G.h * 18;
    const oxw = thick * 0.22;
    const oyw = -thick;
    const squash = G.slam === 2 ? (1 - G.impact) * 4 : 0;
    const faceY = cy + squash;
    const bot = faceCorners(cx, faceY, G.rot, half);
    const top = faceCorners(cx + oxw, faceY + oyw, G.rot, half * 0.96);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx(bot[1].x), sy(bot[1].y));
    ctx.lineTo(sx(top[1].x), sy(top[1].y));
    ctx.lineTo(sx(top[2].x), sy(top[2].y));
    ctx.lineTo(sx(bot[2].x), sy(bot[2].y));
    ctx.closePath();
    ctx.fillStyle = '#2a1020';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.lineWidth = 1.1 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx(bot[0].x), sy(bot[0].y));
    ctx.lineTo(sx(top[0].x), sy(top[0].y));
    ctx.lineTo(sx(top[1].x), sy(top[1].y));
    ctx.lineTo(sx(bot[1].x), sy(bot[1].y));
    ctx.closePath();
    ctx.fillStyle = '#1a0c16';
    ctx.fill();
    ctx.stroke();

    withFace(cx + oxw, faceY + oyw, G.rot, G.size * 0.96, function (c) {
      roundRect(c, -1, -1, 2, 2, 0.14);
      c.fillStyle = '#241018';
      c.fill();
      c.strokeStyle = 'rgba(255, 61, 184, 0.4)';
      c.lineWidth = 0.06;
      c.stroke();
    });

    const hx = cx + oxw;
    const hy = faceY + oyw - half * 0.15;
    ctx.fillStyle = '#2a1420';
    ctx.strokeStyle = G.aligned ? 'rgba(255, 227, 107, 0.8)' : 'rgba(255, 61, 184, 0.7)';
    ctx.lineWidth = 1.5 * scale;
    roundRect(ctx, sx(hx - 9), sy(hy - 22), 18 * scale, 24 * scale, 5 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(hx), sy(hy - 24), 7.2 * scale, 0, TAU);
    ctx.fillStyle = G.aligned ? '#ffe36b' : '#ff3db8';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();

    withFace(cx, faceY, G.rot, G.size, function (c) {
      roundRect(c, -1, -1, 2, 2, 0.14);
      c.fillStyle = '#140814';
      c.fill();
      c.strokeStyle = G.aligned ? 'rgba(255, 227, 107, 0.95)' : 'rgba(255, 61, 184, 0.9)';
      c.lineWidth = 0.08;
      c.stroke();
      drawPat(c, G.pat, 'carve');
    });

    const ringR = half * 1.28;
    ctx.save();
    ctx.strokeStyle = G.aligned
      ? 'rgba(255, 227, 107, 0.55)'
      : 'rgba(0, 240, 255, 0.38)';
    ctx.lineWidth = 1.5 * scale;
    ctx.setLineDash([5 * scale, 5 * scale]);
    ctx.beginPath();
    ctx.arc(sx(cx), sy(cy), ringR * scale, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    const kn = G.rot - Math.PI * 0.5;
    const kx = cx + Math.cos(kn) * ringR;
    const ky = cy + Math.sin(kn) * ringR;
    ctx.beginPath();
    ctx.arc(sx(kx), sy(ky), 6.2 * scale, 0, TAU);
    ctx.fillStyle = G.aligned ? '#ffe36b' : '#00f0ff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.restore();

    if (G.aligned && G.slam === 0) {
      ctx.fillStyle = 'rgba(255, 227, 107, 0.92)';
      ctx.font = '700 ' + Math.max(12, 14 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('合', sx(cx), sy(cy - half - 36));
    }
    ctx.restore();
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
      ctx.strokeStyle = r.gold
        ? 'rgba(255, 227, 107,' + (0.5 * (1 - k)) + ')'
        : r.mag
          ? 'rgba(255, 61, 184,' + (0.45 * (1 - k)) + ')'
          : 'rgba(0, 240, 255,' + (0.4 * (1 - k)) + ')';
      ctx.lineWidth = 1.8 * scale * (1 - k * 0.35);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (10 + k * 36) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFlash() {
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.magFlash * 0.2) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (G.goldFlash * 0.1) + ')';
      ctx.fillRect(0, 0, W, H);
    }
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
    drawPress();
    drawPaper();
    drawImpressions();
    drawGhost();
    drawProjection();
    drawStamp();
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
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (k === 'q' || k === 'Q' || k === 'z' || k === 'Z') keys.ccw = down;
    if (k === 'e' || k === 'E' || k === 'c' || k === 'C' || k === 'x' || k === 'X') keys.cw = down;
    if (down && (
      k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' ||
      k === ' ' || k === 'Spacebar'
    )) {
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
        return;
      }
      if (k === ' ' || k === 'Spacebar') {
        e.preventDefault();
        trySlam();
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    if (G.mode !== 'play' || G.slam !== 0) return;
    audio.ensure();
    const w = worldFromEvent(e);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.x = w.x;
    ptr.y = w.y;
    ptr.moved = 0;
    ptr.t0 = G.clock;
    const ring = nearRing(w.x, w.y);
    if (ring) {
      ptr.rot = true;
      ptr.originY = ring.y;
      ptr.ang0 = Math.atan2(w.y - ring.y, w.x - G.sx) - G.rot;
      canvas.classList.add('turn');
    } else {
      ptr.rot = false;
      ptr.grabX = w.x - G.sx;
      ptr.grabY = w.y - G.sy;
      canvas.classList.add('drag');
    }
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    if (ptr.down) {
      ptr.moved += hypot(w.x - ptr.x, w.y - ptr.y);
    }
    ptr.x = w.x;
    ptr.y = w.y;
  });

  function endPtr(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    const tap = !ptr.rot && ptr.moved < 11 && (G.clock - ptr.t0) < 0.28;
    ptr.down = false;
    ptr.id = null;
    ptr.rot = false;
    canvas.classList.remove('drag');
    canvas.classList.remove('turn');
    if (tap && G.aligned && G.mode === 'play') trySlam();
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    if (G.mode !== 'play' || G.slam !== 0) return;
    G.rot += e.deltaY * 0.0032;
  }, { passive: false });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.ccw = keys.cw = false;
    ptr.down = false;
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
  btnStamp.addEventListener('click', function () {
    audio.ensure();
    trySlam();
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
