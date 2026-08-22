'use strict';

(function () {
  const VW = 960;
  const VH = 540;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const BEAD_R = 11.4;
  const GRAV = 760;
  const MU_S = 0.058;
  const MU_K = 0.03;
  const DRAG = 0.42;
  const TILT_RATE = 1.05;
  const TILT_FOLLOW = 11;
  const CUP_Y = 502;
  const CUP_W = 280;
  const MUTE_KEY = 'playbox-bead-drop-mute';

  const STAGES = [
    {
      name: '初倾', sub: 'TILT',
      hint: '向右倾斜，珠子会滚进金洞',
      toast: '轻轻向右倾',
      maxAng: 0.3,
      boards: [{ y: 248, len: 720, th: 24, holes: [{ s: 64, w: 108, kind: 'gold', skip: 520 }] }],
      beads: [{ s: -236 }]
    },
    {
      name: '刹滚', sub: 'BRAKE',
      hint: '太快会跳过窄洞，过洞前反向刹住',
      toast: '轻倾能进；太快就反向减速',
      maxAng: 0.4,
      boards: [{ y: 248, len: 720, th: 24, holes: [{ s: 22, w: 64, kind: 'gold', skip: 200 }] }],
      beads: [{ s: -248 }]
    },
    {
      name: '双珠', sub: 'PAIR',
      hint: '两颗都要进洞，别把它们甩出台面',
      toast: '两颗都要进',
      maxAng: 0.4,
      boards: [{ y: 248, len: 720, th: 24, holes: [{ s: 18, w: 72, kind: 'gold', skip: 200 }] }],
      beads: [{ s: -262 }, { s: -198 }]
    },
    {
      name: '回倾', sub: 'BACK',
      hint: '珠子在右侧，向左倾才能进洞',
      toast: '往左边倒',
      maxAng: 0.4,
      boards: [{ y: 248, len: 720, th: 24, holes: [{ s: -88, w: 96, kind: 'gold', skip: 420 }] }],
      beads: [{ s: 248 }]
    },
    {
      name: '伪洞', sub: 'TRAP',
      hint: '冲过粉洞再刹住，只要金色那一个',
      toast: '快过粉洞，慢进金洞',
      maxAng: 0.42,
      boards: [{
        y: 248, len: 740, th: 24,
        holes: [
          { s: -46, w: 52, kind: 'trap' },
          { s: 132, w: 62, kind: 'gold', skip: 170 }
        ]
      }],
      beads: [{ s: -282 }]
    },
    {
      name: '叠板', sub: 'TIER',
      hint: '先从上层金洞落下，再反向滚进下层',
      toast: '上板进洞，下板往回',
      maxAng: 0.4,
      boards: [
        { y: 176, len: 680, th: 22, holes: [{ s: 96, w: 76, kind: 'gold', skip: 240 }] },
        { y: 334, len: 680, th: 22, holes: [{ s: -74, w: 64, kind: 'gold', skip: 180 }] }
      ],
      beads: [{ s: -248, board: 0 }]
    },
    {
      name: '游洞', sub: 'DRIFT',
      hint: '金洞在滑，滚进它的路径再刹住',
      toast: '洞在动，对准再减速',
      maxAng: 0.42,
      boards: [{
        y: 248, len: 740, th: 24,
        holes: [{ s: 8, w: 64, kind: 'gold', skip: 210, move: { amp: 96, spd: 0.78, ph: 0.2 } }]
      }],
      beads: [{ s: -210 }]
    },
    {
      name: '三珠', sub: 'TRIO',
      hint: '三颗会互相撞，慢慢聚到洞口',
      toast: '别甩飞，让它们挤着进',
      maxAng: 0.44,
      boards: [{ y: 248, len: 740, th: 24, holes: [{ s: 8, w: 62, kind: 'gold', skip: 175 }] }],
      beads: [{ s: -286 }, { s: -222 }, { s: 258 }]
    },
    {
      name: '夹缝', sub: 'PINCH',
      hint: '落下后反向，右边粉洞会吞珠',
      toast: '下板往左，躲开右粉洞',
      maxAng: 0.44,
      boards: [
        { y: 168, len: 700, th: 22, holes: [{ s: 78, w: 66, kind: 'gold' }] },
        {
          y: 336, len: 700, th: 22,
          holes: [
            { s: 148, w: 50, kind: 'trap' },
            { s: -88, w: 50, kind: 'gold' }
          ]
        }
      ],
      beads: [{ s: -256, board: 0 }, { s: 236, board: 0 }]
    },
    {
      name: '终落', sub: 'FINALE',
      hint: '游动金洞、粉洞、三珠。慢才进得去',
      toast: '最窄的洞，最急的摆',
      maxAng: 0.46,
      boards: [
        {
          y: 158, len: 720, th: 20,
          holes: [{ s: 36, w: 56, kind: 'gold', move: { amp: 78, spd: 1.05, ph: 0.5 } }]
        },
        {
          y: 328, len: 720, th: 20,
          holes: [
            { s: -136, w: 46, kind: 'trap' },
            { s: 48, w: 42, kind: 'gold', move: { amp: 68, spd: 1.35, ph: 1.4 } }
          ]
        }
      ],
      beads: [{ s: -278, board: 0 }, { s: -208, board: 0 }, { s: 248, board: 0 }]
    }
  ];

  const COLS = [
    { glow: '#00f0ff', mid: '#7af6ff', deep: '#146a80', rim: '#ff3db8' },
    { glow: '#ffe36b', mid: '#fff3c2', deep: '#8a6a18', rim: '#00f0ff' },
    { glow: '#ff3db8', mid: '#ff9ad4', deep: '#7a1858', rim: '#00f0ff' }
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
  const tiltWrap = document.getElementById('tilt-wrap');
  const tiltBar = document.getElementById('tilt-bar');
  const tiltNum = document.getElementById('tilt-num');
  const stageLabel = document.getElementById('stage-label');
  const beadLabel = document.getElementById('bead-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false };
  const pointer = { down: false, id: null, x: VW * 0.5 };

  const particles = [];
  const motes = [];
  const rings = [];
  const pips = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    angle: 0,
    target: 0,
    maxAng: 0.34,
    boards: [],
    beads: [],
    bowl: [],
    stashed: 0,
    caught: 0,
    need: 1,
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: 'c',
    toastT: 0,
    settle: 0,
    why: '',
    skipped: false,
    taughtSkip: false,
    taught: false,
    hotHole: false,
    demoPhase: 'tilt',
    demoWait: 0,
    spec: STAGES[0]
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
    return view.ox + x * view.scale;
  }
  function sy(y) {
    return view.oy + y * view.scale;
  }

  function holeS(h) {
    let s = h.s;
    if (h.move) s += Math.sin(G.clock * h.move.spd + h.move.ph) * h.move.amp;
    return s;
  }

  function skipVel(h) {
    if (h.skip != null) return h.skip;
    return h.w * 2.35 + 30;
  }

  function cosA() {
    return Math.cos(G.angle);
  }
  function sinA() {
    return Math.sin(G.angle);
  }

  function boardPoint(board, s, n) {
    const c = cosA();
    const si = sinA();
    return {
      x: board.cx + c * s + si * n,
      y: board.cy + si * s - c * n
    };
  }

  function toBoard(board, x, y) {
    const dx = x - board.cx;
    const dy = y - board.cy;
    const c = cosA();
    const si = sinA();
    return {
      s: dx * c + dy * si,
      n: dx * si - dy * c
    };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    rollT: 0,
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
      if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
      f.Q.value = 0.8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    tick: function () {
      this.ensure();
      this.beep(620 + rand(-40, 40), 0.04, 'triangle', 0.018, 280);
    },
    creak: function (k) {
      this.ensure();
      this.noise(0.07, 0.025 + k * 0.02, 180, 90);
      this.beep(90 + k * 40, 0.09, 'sine', 0.02, 50);
    },
    drop: function () {
      this.ensure();
      this.beep(280, 0.12, 'sine', 0.055, 120);
      this.noise(0.08, 0.04, 900, 400);
    },
    catch: function () {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.07, 784);
      this.beep(784, 0.18, 'triangle', 0.05, 1175);
    },
    skip: function () {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.025, 440);
      this.noise(0.05, 0.03, 1400, 600);
    },
    miss: function () {
      this.ensure();
      this.noise(0.18, 0.08, 500, 120);
      this.beep(180, 0.28, 'sawtooth', 0.05, 55);
    },
    land: function () {
      this.ensure();
      this.beep(240, 0.07, 'triangle', 0.04, 140);
      this.noise(0.05, 0.03, 700, 240);
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
    lose: function () {
      this.ensure();
      this.beep(220, 0.42, 'sawtooth', 0.08, 55);
      this.beep(90, 0.64, 'square', 0.045, 40);
    },
    start: function () {
      this.ensure();
      this.beep(196, 0.14, 'sine', 0.055, 392);
      this.beep(294, 0.18, 'triangle', 0.04, 587);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.5, spec.j * 0.5),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.65, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || 'c',
        g: spec.g == null ? 420 : spec.g
      });
    }
  }

  function addRing(x, y, col) {
    rings.push({ x: x, y: y, t: 0, col: col || 'g' });
    if (rings.length > 16) rings.shift();
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.6;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
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

  function overlayOpen() {
    return !overlay.classList.contains('hidden');
  }

  function syncHud() {
    const max = G.maxAng || 0.34;
    const u = clamp(G.angle / max, -1, 1);
    const track = tiltBar.parentNode;
    const tw = track.clientWidth || 120;
    const px = u * (tw * 0.5 - 8);
    tiltBar.style.transform = 'translateX(' + px + 'px)';
    const deg = Math.round(G.angle * 57.3);
    tiltNum.textContent = (deg > 0 ? '+' : '') + deg + '°';
    const hot = G.hotHole && G.mode === 'play';
    const warn = Math.abs(u) > 0.86;
    tiltWrap.classList.toggle('hot', hot);
    tiltWrap.classList.toggle('warn', warn && !hot);

    const st = STAGES[G.stage];
    if (G.mode === 'title') {
      stageLabel.textContent = '十板';
      beadLabel.textContent = '进洞';
      beadLabel.className = '';
      stageLabel.classList.remove('hot');
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 板 · ' + (st ? st.name : '');
      beadLabel.textContent = G.caught + '/' + G.need;
      beadLabel.classList.toggle('hot', G.caught >= G.need && G.mode === 'play');
      beadLabel.classList.toggle('warn', G.why === 'trap' || G.why === 'off');
      stageLabel.classList.toggle('hot', G.mode === 'clear' || G.mode === 'win');
    }
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
    ovOps.textContent = ops || '← → / A D 倾斜 · 拖动画布左右倾 · M 静音';
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function holeAt(board, s, r) {
    const holes = board.holes;
    for (let i = 0; i < holes.length; i++) {
      const h = holes[i];
      const hs = holeS(h);
      const inner = Math.max(6, h.w * 0.5 - r * 0.28);
      if (Math.abs(s - hs) < inner) return h;
    }
    return null;
  }

  function holeEffect(boardIdx, hole) {
    if (hole.kind === 'trap') return 'trap';
    if (boardIdx < G.boards.length - 1) return 'pass';
    return 'score';
  }

  function makeBoards(spec) {
    const out = [];
    for (let i = 0; i < spec.boards.length; i++) {
      const b = spec.boards[i];
      out.push({
        cx: VW * 0.5,
        cy: b.y,
        len: b.len,
        th: b.th,
        holes: b.holes
      });
    }
    return out;
  }

  function makeBeads(spec) {
    const out = [];
    for (let i = 0; i < spec.beads.length; i++) {
      const d = spec.beads[i];
      out.push({
        s: d.s,
        v: 0,
        r: BEAD_R,
        board: d.board || 0,
        state: 'roll',
        col: i % COLS.length,
        hop: 0,
        travel: rand(0, 20),
        goal: false,
        doom: '',
        doomY: 0,
        wx: 0,
        wy: 0,
        wvx: 0,
        wvy: 0,
        squish: 1,
        spin: 0
      });
    }
    return out;
  }

  function spawnStage(spec, demo) {
    G.spec = spec;
    G.maxAng = spec.maxAng || 0.4;
    G.boards = makeBoards(spec);
    G.beads = makeBeads(spec);
    G.need = spec.beads.length;
    G.caught = 0;
    G.skipped = false;
    if (!demo) {
      while (G.bowl.length > G.stashed) G.bowl.pop();
    }
  }

  function resetBeads() {
    G.beads = makeBeads(G.spec);
    G.caught = 0;
    G.why = '';
    G.skipped = false;
    while (G.bowl.length > G.stashed) G.bowl.pop();
  }

  function worldBead(b) {
    if (b.state === 'fall' || b.state === 'caught' || b.state === 'gone') {
      return { x: b.wx, y: b.wy };
    }
    const board = G.boards[b.board];
    if (!board) return { x: VW * 0.5, y: 200 };
    const n = board.th * 0.5 + b.r + b.hop * 8;
    return boardPoint(board, b.s, n);
  }

  function startFall(b, fromBoard) {
    const p = worldBead(b);
    const c = cosA();
    const si = sinA();
    b.state = 'fall';
    b.wx = p.x;
    b.wy = p.y + 2;
    b.wvx = b.v * c;
    b.wvy = b.v * si + 28;
    b.hop = 0;
    if (fromBoard) {
      const board = G.boards[b.board];
      if (board) {
        const edge = b.s > 0 ? board.len * 0.5 : -board.len * 0.5;
        const ep = boardPoint(board, edge, board.th * 0.5);
        b.wx = ep.x;
        b.wy = ep.y;
        b.wvx = (b.s > 0 ? 1 : -1) * (40 + Math.abs(b.v) * 0.35) * c;
        b.wvy = Math.abs(b.v) * 0.2 + 40;
      }
    }
  }

  function enterHole(b, boardIdx, hole) {
    const effect = holeEffect(boardIdx, hole);
    const hs = holeS(hole);
    const board = G.boards[boardIdx];
    const p = boardPoint(board, hs, 0);
    addRing(p.x, p.y + 6, hole.kind === 'trap' ? 'm' : 'g');
    if (effect === 'trap') {
      b.goal = false;
      startFall(b, false);
      b.wvy = 90;
      b.doom = 'trap';
      b.doomY = p.y + 46;
      if (G.mode === 'play') audio.drop();
      emit(8, {
        x: p.x, y: p.y, j: 10,
        vx0: -70, vx1: 70, vy0: 20, vy1: 90,
        life: 0.38, r0: 1.2, r1: 2.8, col: 'm', g: 280
      });
      return;
    }
    if (effect === 'score') b.goal = true;
    else b.goal = false;
    startFall(b, false);
    b.wvy = 50;
    if (G.mode === 'play') audio.drop();
    emit(8, {
      x: p.x, y: p.y, j: 10,
      vx0: -70, vx1: 70, vy0: 20, vy1: 90,
      life: 0.38, r0: 1.2, r1: 2.8,
      col: hole.kind === 'trap' ? 'm' : 'g', g: 280
    });
  }

  function shatterSoon(b, why, x, y) {
    if (G.mode !== 'play') {
      b.state = 'gone';
      return;
    }
    b.state = 'gone';
    shatterAt(x, y, why);
  }

  function shatterAt(x, y, why) {
    if (G.mode !== 'play' || G.lock > 0 || G.why) return;
    G.why = why;
    G.lock = 0.82;
    G.shake = 11;
    G.flash = 1;
    G.flashCol = 'm';
    audio.miss();
    emit(22, {
      x: x, y: y, j: 14,
      vx0: -180, vx1: 180, vy0: -160, vy1: 40,
      life: 0.55, r0: 1.4, r1: 3.6, col: 'm', g: 520
    });
    addRing(x, y, 'm');
    G.lives -= 1;
    const msg = why === 'trap' ? '掉进粉洞' : '飞出台面';
    toast(msg, true, false);
    setHint(msg, 'warn');
    if (G.lives <= 0) {
      G.mode = 'lose';
      G.lock = 0.55;
      audio.lose();
    }
  }

  function catchBead(b) {
    if (b.state === 'caught' || b.state === 'gone') return;
    b.state = 'caught';
    b.wx = lerp(b.wx, VW * 0.5, 0.4);
    b.wy = CUP_Y - 18;
    G.caught += 1;
    G.bowl.push({
      x: clamp(b.wx - VW * 0.5, -70, 70) * 0.55 + rand(-8, 8),
      col: b.col,
      t: 0,
      ph: rand(0, TAU)
    });
    addRing(VW * 0.5 + G.bowl[G.bowl.length - 1].x, CUP_Y - 16, 'g');
    emit(10, {
      x: b.wx, y: CUP_Y - 12, j: 12,
      vx0: -50, vx1: 50, vy0: -90, vy1: -10,
      life: 0.45, r0: 1.2, r1: 2.8, col: 'g', g: 240
    });
    if (G.mode === 'play') {
      audio.catch();
      G.flash = 0.55;
      G.flashCol = 'g';
    }
  }

  function rollingCount() {
    let n = 0;
    for (let i = 0; i < G.beads.length; i++) {
      const st = G.beads[i].state;
      if (st === 'roll' || st === 'fall') n++;
    }
    return n;
  }

  function collideBeads() {
    for (let bi = 0; bi < G.boards.length; bi++) {
      const list = [];
      for (let i = 0; i < G.beads.length; i++) {
        const b = G.beads[i];
        if (b.state === 'roll' && b.board === bi) list.push(b);
      }
      list.sort(function (a, b) { return a.s - b.s; });
      for (let i = 0; i < list.length - 1; i++) {
        const a = list[i];
        const b = list[i + 1];
        const min = a.r + b.r;
        const d = b.s - a.s;
        if (d < min) {
          const overlap = min - d;
          a.s -= overlap * 0.5;
          b.s += overlap * 0.5;
          const ua = a.v;
          const ub = b.v;
          a.v = ub * 0.9;
          b.v = ua * 0.9;
          a.squish = 0.82;
          b.squish = 0.82;
          if (G.mode === 'play' && Math.abs(ua - ub) > 40) audio.tick();
        }
      }
    }
  }

  function updateRoll(b, dt) {
    const board = G.boards[b.board];
    if (!board) return;
    const th = G.angle;
    const along = GRAV * Math.sin(th);
    const N = GRAV * Math.max(0.12, Math.cos(th));
    if (Math.abs(b.v) < 8 && Math.abs(along) < MU_S * N) {
      b.v = 0;
    } else {
      const fric = -Math.sign(b.v !== 0 ? b.v : along) * MU_K * N;
      b.v += (along + fric) * dt;
    }
    b.v *= Math.exp(-DRAG * dt);
    b.s += b.v * dt;
    b.spin += b.v * dt / b.r;
    b.hop = Math.max(0, b.hop - dt * 5.5);
    b.squish = lerp(b.squish, 1, 1 - Math.exp(-10 * dt));
    b.travel += Math.abs(b.v) * dt;
    if (b.travel > 34) {
      b.travel = 0;
      if (G.mode === 'play' && Math.abs(b.v) > 50) audio.tick();
    }

    const half = board.len * 0.5;
    if (Math.abs(b.s) > half - b.r * 0.28) {
      const p = worldBead(b);
      startFall(b, true);
      b.doom = 'off';
      b.doomY = p.y + 52;
      if (G.mode !== 'play') b.state = 'gone';
      return;
    }

    const hole = holeAt(board, b.s, b.r);
    if (hole) {
      const lim = skipVel(hole);
      if (Math.abs(b.v) <= lim) {
        enterHole(b, b.board, hole);
      } else {
        if (b.hop < 0.2) {
          b.hop = 1;
          if (G.mode === 'play' && !G.skipped) {
            G.skipped = true;
            audio.skip();
            if (!G.taughtSkip) {
              G.taughtSkip = true;
              toast('太快，跳过了洞', true, false);
            }
          }
        }
      }
    }

    if (Math.abs(b.v) > 36 && Math.random() < dt * Math.abs(b.v) * 0.012) {
      const p = worldBead(b);
      emit(1, {
        x: p.x, y: p.y + 6, j: 4,
        vx0: -20, vx1: 20, vy0: -10, vy1: 16,
        life: 0.28, r0: 0.7, r1: 1.6, col: 'c', g: 80
      });
    }
  }

  function updateFall(b, dt) {
    b.wvy += GRAV * dt;
    if (b.goal) {
      b.wvx += (VW * 0.5 - b.wx) * 3.4 * dt;
      b.wvx *= Math.exp(-dt * 1.4);
    }
    b.wx += b.wvx * dt;
    b.wy += b.wvy * dt;
    b.spin += b.wvx * dt * 0.08;
    b.squish = lerp(b.squish, 1.06, 6 * dt);

    if (b.doom && b.wy > b.doomY) {
      if (G.mode === 'play') shatterSoon(b, b.doom, b.wx, b.wy);
      else b.state = 'gone';
      return;
    }

    for (let i = 0; i < G.boards.length; i++) {
      if (i === b.board) continue;
      const board = G.boards[i];
      const loc = toBoard(board, b.wx, b.wy);
      const surf = board.th * 0.5 + b.r;
      if (loc.n <= surf && loc.n > surf - 40 && b.wvy > 16 && Math.abs(loc.s) < board.len * 0.5 - 6) {
        const hole = holeAt(board, loc.s, b.r);
        if (hole) {
          b.board = i;
          b.s = loc.s;
          b.v = b.wvx * cosA() + b.wvy * sinA();
          enterHole(b, i, hole);
          return;
        }
        b.state = 'roll';
        b.board = i;
        b.s = loc.s;
        b.v = (b.wvx * cosA() + b.wvy * sinA()) * 0.62;
        b.hop = 0.35;
        b.squish = 0.72;
        b.goal = false;
        b.doom = '';
        if (G.mode === 'play') audio.land();
        return;
      }
    }

    if (b.goal && b.wy > CUP_Y - 28 && Math.abs(b.wx - VW * 0.5) < CUP_W * 0.48) {
      catchBead(b);
      return;
    }
    if (b.wy > VH + 36) {
      if (b.goal) catchBead(b);
      else if (G.mode === 'play') shatterSoon(b, b.doom || 'off', b.wx, VH - 8);
      else b.state = 'gone';
    }
  }

  function updateTilt(dt) {
    const max = G.maxAng;
    if (!overlayOpen() && G.mode !== 'lose' && G.mode !== 'win') {
      if (pointer.down && G.mode !== 'title') {
        const u = (pointer.x - VW * 0.5) / (VW * 0.42);
        G.target = clamp(u, -1, 1) * max;
      } else if (G.mode !== 'title') {
        if (keys.l) G.target -= TILT_RATE * dt;
        if (keys.r) G.target += TILT_RATE * dt;
      }
    }
    G.target = clamp(G.target, -max, max);
    const prev = G.angle;
    G.angle = lerp(G.angle, G.target, 1 - Math.exp(-TILT_FOLLOW * dt));
    const d = Math.abs(G.angle - prev);
    if (G.mode === 'play' && d > 0.012 && Math.random() < dt * 3.2) {
      audio.creak(d * 18);
    }
  }

  function holeHotState() {
    G.hotHole = false;
    for (let i = 0; i < G.beads.length; i++) {
      const b = G.beads[i];
      if (b.state !== 'roll') continue;
      const board = G.boards[b.board];
      if (!board) continue;
      for (let k = 0; k < board.holes.length; k++) {
        const h = board.holes[k];
        if (h.kind === 'trap') continue;
        const hs = holeS(h);
        if (Math.abs(b.s - hs) < h.w * 0.5 + 70 && Math.abs(b.v) <= skipVel(h)) {
          G.hotHole = true;
          return;
        }
      }
    }
  }

  function updatePhysics(dt) {
    updateTilt(dt);
    if (G.lock > 0 && G.mode === 'play' && G.why) {
      // freeze beads after fail
    } else if (G.mode !== 'lose' && G.mode !== 'win') {
      for (let i = 0; i < G.beads.length; i++) {
        const b = G.beads[i];
        if (b.state === 'roll') updateRoll(b, dt);
        else if (b.state === 'fall') updateFall(b, dt);
      }
      collideBeads();
    }
    holeHotState();
    for (let i = 0; i < G.bowl.length; i++) G.bowl[i].t += dt;
  }

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.16;
    G.why = '';
    G.settle = 0;
    G.taught = G.taught && fromFail;
    spawnStage(STAGES[i], false);
    if (!fromFail) {
      G.angle = 0;
      G.target = 0;
    }
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
    G.taughtSkip = false;
    G.bowl.length = 0;
    G.stashed = 0;
    G.angle = 0;
    G.target = 0;
    G.clock = 0;
    startStage(0, false);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    G.angle = 0;
    G.target = 0;
    G.clock = 0;
    G.bowl.length = 0;
    G.stashed = 0;
    G.demoPhase = 'tilt';
    G.demoWait = 0;
    spawnStage(STAGES[0], true);
    showOverlay(
      'title',
      '落珠',
      '倾斜木板，让珠子滚进金洞。<br />太快会跳过，掉出台面就碎。',
      '开倾',
      'BEADS',
      '← → / A D 倾斜 · 拖动画布左右倾 · M 静音'
    );
    setHint('倾斜木板 · 珠子进金洞', '');
    syncHud();
  }

  function clearStage() {
    G.mode = 'clear';
    G.settle = 0.85;
    G.stashed = G.bowl.length;
    G.flash = 0.7;
    G.flashCol = 'g';
    audio.clear();
    toast(STAGES[G.stage].name + ' · 落定', false, true);
    setHint('落定', 'hot');
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      G.settle = 0.4;
      audio.win();
    }
  }

  function maybeResolve() {
    if (G.mode !== 'play' || G.why || G.lock > 0) return;
    if (G.caught >= G.need && rollingCount() === 0) {
      G.lock = 0.2;
      G.settle = 0.35;
      G.mode = 'pending';
    }
  }

  function updateTitle(dt) {
    const alive = rollingCount();
    if (G.demoPhase === 'tilt') {
      G.target = 0.2 + Math.sin(G.clock * 0.7) * 0.03;
      if (G.caught > 0) {
        G.demoPhase = 'wait';
        G.demoWait = 1.25;
      } else if (alive === 0 && G.clock > 0.4) {
        G.demoPhase = 'wait';
        G.demoWait = 0.6;
      }
    } else {
      G.target = lerp(G.target, 0, 1 - Math.exp(-3 * dt));
      G.demoWait -= dt;
      if (G.demoWait <= 0) {
        spawnStage(STAGES[0], true);
        G.angle = 0;
        G.target = 0;
        G.demoPhase = 'tilt';
        G.bowl.length = 0;
        G.stashed = 0;
      }
    }
    updatePhysics(dt);
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    if (G.mode === 'pending') {
      G.settle -= dt;
      updatePhysics(dt);
      if (G.settle <= 0) clearStage();
      return;
    }
    if (G.mode === 'clear') {
      G.settle -= dt;
      G.target = lerp(G.target, 0, 1 - Math.exp(-3 * dt));
      updatePhysics(dt);
      if (G.settle <= 0) startStage(G.stage + 1, false);
      return;
    }
    if (G.mode === 'lose') {
      G.lock = Math.max(0, G.lock - dt);
      if (G.lock <= 0 && !overlayOpen()) {
        const why = G.why === 'trap' ? '珠子掉进了粉洞。' : '珠子飞出了台面。';
        showOverlay(
          'lose',
          '碎珠',
          why + '<br />三命用尽。',
          '再来一局',
          'DROP',
          'R 重开 · M 静音'
        );
      }
      updatePhysics(dt);
      return;
    }
    if (G.mode === 'win') {
      G.lock = Math.max(0, G.lock - dt);
      G.target = lerp(G.target, 0, 1 - Math.exp(-2.4 * dt));
      updatePhysics(dt);
      if (!overlayOpen()) {
        showOverlay(
          'win',
          '珠落',
          '十块木板，珠子都进了金洞。',
          '再倾一次',
          'BEADS',
          'R 重开 · M 静音'
        );
      }
      return;
    }

    updatePhysics(dt);

    if (G.why && G.mode === 'play' && G.lock <= 0) {
      if (G.lives > 0) {
        resetBeads();
        G.lock = 0.12;
        setHint(STAGES[G.stage].hint, '');
        toast('还剩 ' + G.lives + ' 命', true, false);
      }
      return;
    }

    maybeResolve();
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.1);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
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

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateTitle(dt);
    else updatePlay(dt);
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

  function segments(board) {
    const cuts = [];
    for (let i = 0; i < board.holes.length; i++) {
      const h = board.holes[i];
      const s = holeS(h);
      cuts.push({ a: s - h.w * 0.5, b: s + h.w * 0.5, hole: h });
    }
    cuts.sort(function (p, q) { return p.a - q.a; });
    const half = board.len * 0.5;
    const segs = [];
    let cursor = -half;
    for (let i = 0; i < cuts.length; i++) {
      if (cuts[i].a > cursor + 1) segs.push({ a: cursor, b: cuts[i].a });
      cursor = Math.max(cursor, cuts[i].b);
    }
    if (cursor < half - 1) segs.push({ a: cursor, b: half });
    return segs;
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, view.w, view.h);

    const g = ctx.createRadialGradient(sx(80), sy(20), 8, sx(80), sy(20), 300 * view.scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.15)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, view.w, view.h);

    const g2 = ctx.createRadialGradient(sx(820), sy(40), 8, sx(820), sy(40), 280 * view.scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    g2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, view.w, view.h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * view.scale, VH * view.scale);
    ctx.clip();

    ctx.fillStyle = '#070414';
    ctx.fillRect(sx(0), sy(0), VW * view.scale, VH * view.scale);

    const vg = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    vg.addColorStop(0, 'rgba(22, 10, 36, 0.85)');
    vg.addColorStop(0.5, 'rgba(8, 6, 18, 0.2)');
    vg.addColorStop(1, 'rgba(18, 12, 8, 0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * view.scale, VH * view.scale);

    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1;
    for (let y = 40; y < VH; y += 46) {
      ctx.beginPath();
      ctx.moveTo(sx(24), sy(y));
      ctx.lineTo(sx(VW - 24), sy(y));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = sx(m.x + Math.sin(G.clock * 0.35 + m.p) * 12);
      const y = sy((m.y + G.clock * m.s) % VH);
      ctx.fillStyle = 'rgba(180, 230, 255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r * view.scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFloor() {
    const y = sy(CUP_Y + 10);
    const g = ctx.createLinearGradient(sx(0), y - 20 * view.scale, sx(0), sy(VH));
    g.addColorStop(0, 'rgba(0, 240, 255, 0.05)');
    g.addColorStop(0.1, '#12081c');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), y - 10 * view.scale, VW * view.scale, sy(VH) - (y - 10 * view.scale));

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.5 * view.scale;
    ctx.beginPath();
    ctx.moveTo(sx(20), sy(CUP_Y + 12));
    ctx.lineTo(sx(VW - 20), sy(CUP_Y + 12));
    ctx.stroke();
  }

  function drawCup() {
    const x = sx(VW * 0.5);
    const y = sy(CUP_Y);
    const hw = CUP_W * 0.5 * view.scale;
    const h = 36 * view.scale;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x, sy(CUP_Y + 14), hw * 0.92, 7 * view.scale, 0, 0, TAU);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x - hw, y);
    ctx.lineTo(x + hw, y);
    ctx.lineTo(x + hw * 0.72, y + h);
    ctx.quadraticCurveTo(x, y + h + 10 * view.scale, x - hw * 0.72, y + h);
    ctx.closePath();
    const bowl = ctx.createLinearGradient(x, y, x, y + h);
    bowl.addColorStop(0, 'rgba(18, 12, 32, 0.2)');
    bowl.addColorStop(1, 'rgba(12, 8, 24, 0.75)');
    ctx.fillStyle = bowl;
    ctx.fill();
    ctx.strokeStyle = G.caught >= G.need && G.mode === 'play'
      ? 'rgba(255, 227, 107, 0.9)'
      : 'rgba(255, 227, 107, 0.7)';
    ctx.shadowColor = '#ffe36b';
    ctx.shadowBlur = 12 * view.scale;
    ctx.lineWidth = 2.1 * view.scale;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1.2 * view.scale;
    ctx.beginPath();
    ctx.ellipse(x, y + 2 * view.scale, hw * 0.96, 5.5 * view.scale, 0, 0, TAU);
    ctx.stroke();

    for (let i = 0; i < G.bowl.length; i++) {
      const bb = G.bowl[i];
      const bx = VW * 0.5 + bb.x + Math.sin(G.clock * 1.6 + bb.ph) * 2;
      const row = Math.min(2, (i / 5) | 0);
      const by = CUP_Y - 6 - row * 11 + Math.sin(G.clock * 2.1 + bb.ph) * 1.2;
      drawBeadWorld(bx, by, 7.2, bb.col, 1, 0.9);
    }
    ctx.restore();
  }

  function drawStand() {
    if (!G.boards.length) return;
    const top = G.boards[0];
    const bot = G.boards[G.boards.length - 1];
    const x = sx(VW * 0.5);
    const y0 = sy(top.cy);
    const y1 = sy(CUP_Y - 8);
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 6 * view.scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    ctx.strokeStyle = '#16102a';
    ctx.lineWidth = 3.4 * view.scale;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 61, 184, 0.28)';
    ctx.lineWidth = 1.4 * view.scale;
    ctx.beginPath();
    ctx.moveTo(sx(VW * 0.5 - 18), sy(bot.cy + 28));
    ctx.lineTo(sx(VW * 0.5 - 52), sy(CUP_Y + 6));
    ctx.moveTo(sx(VW * 0.5 + 18), sy(bot.cy + 28));
    ctx.lineTo(sx(VW * 0.5 + 52), sy(CUP_Y + 6));
    ctx.stroke();
    ctx.restore();
  }

  function holeMood(board, hole) {
    let mood = 'idle';
    for (let i = 0; i < G.beads.length; i++) {
      const b = G.beads[i];
      if (b.state !== 'roll') continue;
      if (G.boards[b.board] !== board) continue;
      const hs = holeS(hole);
      const d = Math.abs(b.s - hs);
      if (d < hole.w * 0.5 + 86) {
        if (hole.kind === 'trap') mood = 'trap';
        else if (Math.abs(b.v) <= skipVel(hole)) mood = 'in';
        else mood = 'skip';
      }
    }
    return mood;
  }

  function drawHoleGlow(board, hole) {
    const hs = holeS(hole);
    const p = boardPoint(board, hs, 0);
    const mood = holeMood(board, hole);
    const trap = hole.kind === 'trap';
    let col = trap ? '255,61,184' : '255,227,107';
    let a = 0.12;
    if (mood === 'in') a = 0.32;
    if (mood === 'skip') {
      col = '255,61,184';
      a = 0.22;
    }
    if (mood === 'trap') a = 0.28;
    const x = sx(p.x);
    const y = sy(p.y);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grd = ctx.createLinearGradient(x, y, x, sy(Math.min(VH - 8, p.y + 140)));
    grd.addColorStop(0, 'rgba(' + col + ',' + a + ')');
    grd.addColorStop(1, 'rgba(' + col + ',0)');
    ctx.fillStyle = grd;
    const w = (hole.w * 0.55 + (mood === 'in' ? 10 : 0)) * view.scale;
    ctx.fillRect(x - w, y, w * 2, 150 * view.scale);
    ctx.restore();
  }

  function drawBoard(board, idx) {
    for (let i = 0; i < board.holes.length; i++) drawHoleGlow(board, board.holes[i]);

    ctx.save();
    ctx.translate(sx(board.cx), sy(board.cy));
    ctx.rotate(G.angle);
    const sc = view.scale;
    const th = board.th;
    const segs = segments(board);

    for (let i = 0; i < segs.length; i++) {
      const a = segs[i].a;
      const b = segs[i].b;
      const w = b - a;
      const x = a * sc;
      const y = -th * 0.5 * sc;
      const ww = w * sc;
      const hh = th * sc;

      roundRect(ctx, x, y, ww, hh, 5 * sc);
      const wood = ctx.createLinearGradient(0, y, 0, y + hh);
      wood.addColorStop(0, '#2a1a3e');
      wood.addColorStop(0.45, '#1a1028');
      wood.addColorStop(1, '#12081c');
      ctx.fillStyle = wood;
      ctx.fill();

      ctx.save();
      roundRect(ctx, x, y, ww, hh, 5 * sc);
      ctx.clip();
      ctx.strokeStyle = 'rgba(80, 50, 30, 0.45)';
      ctx.lineWidth = 1;
      for (let g = 1; g < 5; g++) {
        const gy = y + hh * (g / 5) + Math.sin(a * 0.04 + g) * 1.2 * sc;
        ctx.beginPath();
        ctx.moveTo(x + 4 * sc, gy);
        ctx.lineTo(x + ww - 4 * sc, gy);
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.beginPath();
      ctx.moveTo(x + 6 * sc, y + 3.2 * sc);
      ctx.lineTo(x + ww - 6 * sc, y + 3.2 * sc);
      ctx.stroke();
      ctx.restore();

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8 * sc;
      ctx.lineWidth = 1.8 * sc;
      roundRect(ctx, x, y, ww, hh, 5 * sc);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.45)';
      ctx.lineWidth = 1.1 * sc;
      ctx.beginPath();
      ctx.moveTo(x + 6 * sc, y + hh - 3 * sc);
      ctx.lineTo(x + ww - 6 * sc, y + hh - 3 * sc);
      ctx.stroke();
    }

    for (let i = 0; i < board.holes.length; i++) {
      const h = board.holes[i];
      const hs = holeS(h);
      const hw = h.w * 0.5;
      const trap = h.kind === 'trap';
      const mood = holeMood(board, h);
      const col = trap || mood === 'skip' ? '#ff3db8' : '#ffe36b';
      ctx.strokeStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = (mood === 'in' ? 16 : 8) * sc;
      ctx.lineWidth = 2.2 * sc;
      ctx.beginPath();
      ctx.moveTo((hs - hw) * sc, -th * 0.5 * sc);
      ctx.lineTo((hs - hw) * sc, th * 0.5 * sc);
      ctx.moveTo((hs + hw) * sc, -th * 0.5 * sc);
      ctx.lineTo((hs + hw) * sc, th * 0.5 * sc);
      ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.fillStyle = trap ? 'rgba(255,61,184,0.18)' : 'rgba(255,227,107,0.14)';
      ctx.fillRect((hs - hw) * sc, -th * 0.5 * sc, h.w * sc, th * sc);

      ctx.fillStyle = col;
      ctx.globalAlpha = 0.9;
      const tag = trap ? '吞' : '洞';
      ctx.font = '600 ' + Math.max(9, 10 * sc) + 'px "PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tag, hs * sc, (th * 0.5 + 12) * sc);
      ctx.globalAlpha = 1;
    }

    const cap = 10;
    ctx.fillStyle = '#0e0a1c';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
    ctx.lineWidth = 1.4 * sc;
    roundRect(ctx, (-board.len * 0.5 - 4) * sc, (-th * 0.62) * sc, cap * sc, th * 1.24 * sc, 3 * sc);
    ctx.fill();
    ctx.stroke();
    roundRect(ctx, (board.len * 0.5 - cap + 4) * sc, (-th * 0.62) * sc, cap * sc, th * 1.24 * sc, 3 * sc);
    ctx.fill();
    ctx.stroke();

    if (idx === G.boards.length - 1 || G.boards.length === 1) {
      const vialW = 52;
      const vialH = 8;
      roundRect(ctx, -vialW * 0.5 * sc, (-th * 0.5 - 16) * sc, vialW * sc, vialH * sc, 4 * sc);
      ctx.fillStyle = 'rgba(8, 12, 28, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
      ctx.lineWidth = 1.1 * sc;
      ctx.stroke();
      const u = clamp(G.angle / G.maxAng, -1, 1);
      const bx = u * (vialW * 0.5 - 7);
      ctx.fillStyle = G.hotHole ? '#ffe36b' : '#00f0ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8 * sc;
      ctx.beginPath();
      ctx.arc(bx * sc, (-th * 0.5 - 12) * sc, 3.2 * sc, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = '#0a0814';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2 * sc;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10 * sc;
    ctx.beginPath();
    ctx.arc(0, 0, 9 * sc, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.arc(0, 0, 3.2 * sc, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawBeadWorld(x, y, r, colIdx, squish, alpha) {
    const col = COLS[colIdx % COLS.length];
    const sc = view.scale;
    const px = sx(x);
    const py = sy(y);
    const rr = r * sc;
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.translate(px, py);
    ctx.scale(1 / Math.max(0.7, squish), Math.max(0.7, squish));
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = col.glow;
    ctx.globalAlpha *= 0.22;
    ctx.beginPath();
    ctx.arc(0, 0, rr * 2.1, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    const grd = ctx.createRadialGradient(-rr * 0.32, -rr * 0.38, rr * 0.08, 0, 0, rr);
    grd.addColorStop(0, '#ffffff');
    grd.addColorStop(0.22, col.mid);
    grd.addColorStop(0.72, col.glow);
    grd.addColorStop(1, col.deep);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, rr, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = col.rim;
    ctx.globalAlpha *= 0.55;
    ctx.lineWidth = 1.1 * sc;
    ctx.stroke();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.ellipse(-rr * 0.28, -rr * 0.32, rr * 0.22, rr * 0.14, -0.5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBeadShadow(b) {
    if (b.state !== 'roll') return;
    const board = G.boards[b.board];
    if (!board) return;
    const p = boardPoint(board, b.s, board.th * 0.5);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx(p.x), sy(p.y + 1), b.r * 0.9 * view.scale, 3.2 * view.scale, G.angle, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBeads() {
    for (let i = 0; i < G.beads.length; i++) {
      const b = G.beads[i];
      if (b.state === 'gone' || b.state === 'caught') continue;
      drawBeadShadow(b);
    }
    for (let i = 0; i < G.beads.length; i++) {
      const b = G.beads[i];
      if (b.state === 'gone' || b.state === 'caught') continue;
      const p = worldBead(b);
      drawBeadWorld(p.x, p.y, b.r, b.col, b.squish, 1);
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      const col = p.col === 'm' ? '255,61,184' : p.col === 'g' ? '255,227,107' : '0,240,255';
      ctx.fillStyle = 'rgba(' + col + ',' + (0.15 + a * 0.75) + ')';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * view.scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.55;
      const col = r.col === 'm' ? '255,61,184' : '255,227,107';
      ctx.strokeStyle = 'rgba(' + col + ',' + (1 - k) * 0.7 + ')';
      ctx.lineWidth = (2 - k) * view.scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + k * 28) * view.scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * view.scale, VH * view.scale);
    ctx.clip();
    const col = G.flashCol === 'm' ? '255,61,184' : G.flashCol === 'g' ? '255,227,107' : '0,240,255';
    ctx.fillStyle = 'rgba(' + col + ',' + (G.flash * 0.12) + ')';
    ctx.fillRect(sx(0), sy(0), VW * view.scale, VH * view.scale);
    ctx.restore();
  }

  function drawChevrons() {
    if (overlayOpen() && G.mode === 'title') return;
    if (G.mode === 'win' || G.mode === 'lose') return;
    const a = G.angle / Math.max(0.001, G.maxAng);
    if (Math.abs(a) < 0.08) return;
    ctx.save();
    ctx.globalAlpha = clamp(Math.abs(a) * 0.7, 0.12, 0.45);
    ctx.fillStyle = a > 0 ? '#00f0ff' : '#ff3db8';
    const dir = a > 0 ? 1 : -1;
    const x = VW * 0.5 + dir * 300;
    const y = G.boards[0] ? G.boards[0].cy - 64 : 160;
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y));
    ctx.lineTo(sx(x - dir * 16), sy(y - 10));
    ctx.lineTo(sx(x - dir * 16), sy(y + 10));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw() {
    const sh = G.shake;
    const ox0 = view.ox;
    const oy0 = view.oy;
    if (sh > 0.2) {
      view.ox += (Math.random() - 0.5) * sh * view.scale;
      view.oy += (Math.random() - 0.5) * sh * view.scale;
    }
    drawBg();
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * view.scale, VH * view.scale);
    ctx.clip();
    drawFloor();
    drawStand();
    drawCup();
    for (let i = G.boards.length - 1; i >= 0; i--) drawBoard(G.boards[i], i);
    drawChevrons();
    drawBeads();
    drawParticles();
    drawFlash();
    ctx.restore();
    view.ox = ox0;
    view.oy = oy0;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.dpr = dpr;
    view.w = Math.max(1, Math.floor(rect.width * dpr));
    view.h = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = view.w;
    canvas.height = view.h;
    const fit = Math.min(view.w / VW, view.h / VH);
    view.scale = fit;
    view.ox = (view.w - VW * fit) * 0.5;
    view.oy = (view.h - VH * fit) * 0.5;
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 38; i++) {
      motes.push({
        x: rand(20, VW - 20),
        y: rand(30, VH - 30),
        r: rand(0.6, 1.8),
        a: rand(0.04, 0.16),
        p: rand(0, TAU),
        s: rand(5, 16)
      });
    }
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * view.dpr - view.ox) / view.scale;
    return x;
  }

  function onPtrDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (overlayOpen()) return;
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = worldFromEvent(e);
    canvas.classList.add('press');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    audio.ensure();
    e.preventDefault();
  }

  function onPtrMove(e) {
    pointer.x = worldFromEvent(e);
    if (pointer.down) e.preventDefault();
  }

  function onPtrUp(e) {
    if (pointer.id != null && e.pointerId !== pointer.id && e.type !== 'pointerleave') return;
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove('press');
  }

  function toggleMute() {
    audio.ensure();
    audio.setMuted(!audio.muted);
  }

  function onKey(e, down) {
    const k = e.code || e.key;
    if (k === 'ArrowLeft' || k === 'KeyA' || k === 'KeyH' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'KeyD' || k === 'KeyL' || k === 'Right') keys.r = down;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Space' || k === 'ArrowUp' || k === 'ArrowDown')) {
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'KeyM') {
      toggleMute();
      return;
    }
    if (k === 'KeyR') {
      audio.ensure();
      startRun();
      return;
    }
    if ((k === 'Enter' || k === 'Space' || k === 'NumpadEnter') && overlayOpen()) {
      audio.ensure();
      if (G.mode === 'title' || G.mode === 'lose' || G.mode === 'win') startRun();
      e.preventDefault();
    }
  }

  canvas.addEventListener('pointerdown', onPtrDown);
  canvas.addEventListener('pointermove', onPtrMove);
  canvas.addEventListener('pointerup', onPtrUp);
  canvas.addEventListener('pointercancel', onPtrUp);
  window.addEventListener('pointerup', onPtrUp);
  window.addEventListener('pointercancel', onPtrUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = false;
    keys.r = false;
    pointer.down = false;
  });

  btnMute.addEventListener('click', function () {
    audio.ensure();
    toggleMute();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    startRun();
  });
  ovBtn.addEventListener('click', function () {
    audio.ensure();
    startRun();
  });

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    last = 0;
    acc = 0;
  });

  let last = 0;
  let acc = 0;
  let hiddenWait = false;

  function frame(ts) {
    if (document.hidden) {
      hiddenWait = true;
      last = 0;
      requestAnimationFrame(frame);
      return;
    }
    if (!last) last = ts;
    let dt = (ts - last) / 1000;
    last = ts;
    if (hiddenWait) {
      hiddenWait = false;
      dt = STEP;
    }
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    if (acc > 0.12) acc = 0.12;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  }

  resize();
  seedMotes();
  bootTitle();
  requestAnimationFrame(frame);
})();
