'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-ice-carve-mute';
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const ICE = { r: 148, g: 214, b: 242 };
  const DEEP = { r: 28, g: 72, b: 112 };

  const STAGES = [
    {
      name: '初凿',
      sub: 'CHIP',
      hint: '点冰块凿开，连通右侧冰种',
      time: 22,
      hit: 0.052,
      fault: 0,
      map: ['.......', 'S.....G', '.......']
    },
    {
      name: '转弯',
      sub: 'BEND',
      hint: '晶石凿不开，绕过去',
      time: 20,
      hit: 0.048,
      fault: 0,
      map: ['S.x..G', '..x...', '......']
    },
    {
      name: '硬冰',
      sub: 'THICK',
      hint: '厚冰要凿两下',
      time: 18,
      hit: 0.042,
      fault: 0,
      map: ['S::..G', 'xx...x', '......']
    },
    {
      name: '裂隙',
      sub: 'FAULT',
      hint: '粉纹是裂隙，凿了冰裂得更快',
      time: 18,
      hit: 0.046,
      fault: 0.2,
      map: ['S.ff.G', '......', '.xx...']
    },
    {
      name: '晶门',
      sub: 'GATE',
      hint: '绕开晶墙，走底下那条缝',
      time: 16,
      hit: 0.04,
      fault: 0,
      map: ['S.x.xG', '..x.x.', '......']
    },
    {
      name: '深凿',
      sub: 'DENSE',
      hint: '最厚的冰要凿三下',
      time: 18,
      hit: 0.036,
      fault: 0,
      map: ['S++..G', 'xx.x..', '......']
    },
    {
      name: '绕裂',
      sub: 'DETOUR',
      hint: '近路全是裂隙，绕开更稳',
      time: 15,
      hit: 0.04,
      fault: 0.15,
      map: ['S.ffffG', '.......', '.xxxxx.', '.......']
    },
    {
      name: '夹缝',
      sub: 'SQUEEZE',
      hint: '选薄的凿，厚冰费裂',
      time: 15,
      hit: 0.034,
      fault: 0,
      map: ['S:+x:.G', '..x....', '.......']
    },
    {
      name: '蛛裂',
      sub: 'WEB',
      hint: '别走粉纹，贴底边凿过去',
      time: 14,
      hit: 0.032,
      fault: 0.12,
      map: ['S.f.f.f.G', '.x.x.x.x.', '.........']
    },
    {
      name: '绝凿',
      sub: 'LAST',
      hint: '裂隙绕一下，别贪近路',
      time: 16,
      hit: 0.024,
      fault: 0.08,
      map: ['S:+f+:.G', 'x.xxx.x.', '..f+f...', 'xx.x.xx.', '........']
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
  const btnCarve = document.getElementById('btn-carve');
  const stageLabel = document.getElementById('stage-label');
  const timeLabel = document.getElementById('time-label');
  const stressLabel = document.getElementById('stress-label');
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
  const pips = [];

  const ptr = {
    down: false,
    id: null,
    x: VW * 0.5,
    y: VH * 0.5,
    hover: false,
    lastC: -1,
    lastR: -1,
    dwell: 0
  };

  const keys = { l: false, r: false, u: false, d: false, carve: false };

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    time: 22,
    timeMax: 22,
    stress: 0,
    hitCost: 0.05,
    faultCost: 0,
    cells: [],
    cols: 1,
    rows: 1,
    cs: 48,
    originX: 40,
    originY: 140,
    gridW: 48,
    gridH: 48,
    start: null,
    gem: null,
    curC: 0,
    curR: 0,
    lock: 0,
    settle: 0,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    strikeT: 0,
    toastT: 0,
    why: '',
    warnAt: 4,
    creakAt: 0.55,
    taughtAdj: false,
    taughtCry: false,
    flowPath: [],
    flowU: 0,
    cracks: [],
    moveCd: 0,
    carveCd: 0,
    demoChip: 0
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
  function hash(c, r, k) {
    let n = (c * 157 + r * 311 + k * 97 + G.stage * 13) | 0;
    n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
    return ((n >>> 0) % 10000) / 10000;
  }
  function rngFn(seed) {
    let s = seed % 2147483646;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
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
        this.master.gain.value = this.muted ? 0 : 0.26;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.26;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (err) { /* ignore */ }
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
      const n = Math.min(0.22, Math.max(0.03, dur));
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 1200;
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
    chip: function (thick, fault) {
      this.ensure();
      this.noise(0.05, fault ? 0.07 : 0.045, fault ? 600 : 2200);
      this.beep(thick ? 740 : 1680, 0.06, 'triangle', 0.05, thick ? 280 : 920);
      if (fault) this.beep(140, 0.14, 'sawtooth', 0.05, 48);
    },
    deny: function () {
      this.ensure();
      this.beep(180, 0.07, 'square', 0.03, 90);
    },
    creak: function () {
      this.ensure();
      this.noise(0.16, 0.05, 280);
      this.beep(90, 0.2, 'sine', 0.04, 40);
    },
    shatter: function () {
      this.ensure();
      this.noise(0.32, 0.12, 180);
      this.beep(220, 0.28, 'sawtooth', 0.07, 48);
      this.beep(70, 0.4, 'sine', 0.08, 28);
    },
    flow: function () {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.045, 784);
    },
    good: function () {
      this.ensure();
      this.beep(659, 0.1, 'sine', 0.05);
      this.beep(880, 0.16, 'triangle', 0.05, 1320);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.055);
      this.beep(784, 0.18, 'sine', 0.055);
      this.beep(1046, 0.34, 'triangle', 0.07, 1560);
    },
    start: function () {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 784);
    },
    warn: function () {
      this.ensure();
      this.beep(740, 0.08, 'square', 0.035, 220);
    },
    tick: function () {
      this.ensure();
      this.beep(196, 0.05, 'sine', 0.025, 90);
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
        g: spec.g == null ? 380 : spec.g
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
      const on = i < G.lives;
      pips[i].className = 'pip' + (on ? ' on' : ' gone') + (on && G.lives === 1 ? ' warn' : '');
    }
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const playing = G.mode === 'play';
    if (G.mode === 'title') {
      stageLabel.textContent = '十关';
      timeLabel.textContent = '时 —';
      stressLabel.textContent = '裂 —';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 关 · ' + (st ? st.name : '');
      timeLabel.textContent = '时 ' + Math.max(0, G.time).toFixed(1);
      stressLabel.textContent = '裂 ' + Math.round(clamp(G.stress, 0, 1) * 100) + '%';
    }
    const lowT = playing && G.time < 5;
    const lowS = playing && G.stress > 0.72;
    timeLabel.classList.toggle('warn', lowT);
    stressLabel.classList.toggle('warn', lowS);
    stageLabel.classList.toggle('hot', G.mode === 'clear' || G.mode === 'win' || G.mode === 'flow');
    const cur = at(G.curC, G.curR);
    btnCarve.disabled = !playing;
    btnCarve.classList.toggle('hot', playing && canCarve(cur));
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
    ovOps.textContent = ops || '点按 / 拖凿冰块 · 方向键移动 · 空格凿 · M 静音';
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: rand(18, VW - 18),
        y: rand(40, VH - 40),
        r: rand(0.5, 1.8),
        a: rand(0.04, 0.16),
        p: rand(0, TAU),
        s: rand(6, 18)
      });
    }
  }

  function at(c, r) {
    if (c < 0 || r < 0 || c >= G.cols || r >= G.rows) return null;
    return G.cells[r * G.cols + c];
  }

  function isOpen(cell) {
    return !!(cell && (cell.kind === 'start' || (cell.kind === 'ice' && cell.hp <= 0)));
  }

  function canCarve(cell) {
    if (!cell || cell.kind !== 'ice' || cell.hp <= 0) return false;
    for (let i = 0; i < 4; i++) {
      if (isOpen(at(cell.c + DIRS[i][0], cell.r + DIRS[i][1]))) return true;
    }
    return false;
  }

  function cellCenter(cell) {
    return {
      x: G.originX + (cell.c + 0.5) * G.cs,
      y: G.originY + (cell.r + 0.5) * G.cs
    };
  }

  function relayout() {
    const cols = G.cols;
    const rows = G.rows;
    const availW = VW - 56;
    const availH = VH - 220;
    const cs = Math.max(26, Math.min(64, Math.floor(availW / cols), Math.floor(availH / rows)));
    G.cs = cs;
    G.gridW = cs * cols;
    G.gridH = cs * rows;
    G.originX = (VW - G.gridW) * 0.5;
    G.originY = 128 + Math.max(0, (availH - G.gridH) * 0.22);
  }

  function parseMap(map) {
    G.rows = map.length;
    G.cols = map[0].length;
    G.cells = [];
    G.start = null;
    G.gem = null;
    for (let r = 0; r < G.rows; r++) {
      const row = map[r];
      for (let c = 0; c < G.cols; c++) {
        const ch = row.charAt(c);
        const cell = {
          c: c,
          r: r,
          kind: 'ice',
          hp: 1,
          max: 1,
          fault: false,
          flash: 0,
          shake: 0,
          fly: false,
          px: 0,
          py: 0,
          vx: 0,
          vy: 0,
          rot: 0,
          vr: 0
        };
        if (ch === 'S') {
          cell.kind = 'start';
          cell.hp = 0;
          cell.max = 0;
          G.start = cell;
        } else if (ch === 'G') {
          cell.kind = 'gem';
          cell.hp = 0;
          cell.max = 0;
          G.gem = cell;
        } else if (ch === 'x') {
          cell.kind = 'crystal';
          cell.hp = 99;
          cell.max = 99;
        } else if (ch === ':') {
          cell.hp = 2;
          cell.max = 2;
        } else if (ch === '+') {
          cell.hp = 3;
          cell.max = 3;
        } else if (ch === 'f') {
          cell.hp = 1;
          cell.max = 1;
          cell.fault = true;
        }
        G.cells.push(cell);
      }
    }
    if (!G.start) G.start = G.cells[0];
    if (!G.gem) G.gem = G.cells[G.cells.length - 1];
  }

  function buildCracks() {
    G.cracks = [];
    const rng = rngFn(1300000 + G.stage * 9173 + 17);
    const n = 6 + G.stage;
    const x0 = G.originX;
    const y0 = G.originY;
    const w = G.gridW;
    const h = G.gridH;
    for (let i = 0; i < n; i++) {
      const side = (rng() * 4) | 0;
      let x;
      let y;
      let a;
      if (side === 0) {
        x = x0 + rng() * w;
        y = y0;
        a = 0.35 + rng() * (Math.PI - 0.7);
      } else if (side === 1) {
        x = x0 + rng() * w;
        y = y0 + h;
        a = -(0.35 + rng() * (Math.PI - 0.7));
      } else if (side === 2) {
        x = x0;
        y = y0 + rng() * h;
        a = rng() * 1.4 - 0.7;
      } else {
        x = x0 + w;
        y = y0 + rng() * h;
        a = Math.PI + rng() * 1.4 - 0.7;
      }
      const pts = [{ x: x, y: y }];
      const steps = 7 + ((rng() * 9) | 0);
      for (let k = 0; k < steps; k++) {
        a += (rng() - 0.5) * 1.05;
        const len = 8 + rng() * 16;
        x += Math.cos(a) * len;
        y += Math.sin(a) * len;
        x = clamp(x, x0 - 6, x0 + w + 6);
        y = clamp(y, y0 - 6, y0 + h + 6);
        pts.push({ x: x, y: y });
        if (rng() < 0.22 && k > 1) {
          const b = a + (rng() < 0.5 ? 0.9 : -0.9);
          pts.push({
            x: x + Math.cos(b) * (6 + rng() * 10),
            y: y + Math.sin(b) * (6 + rng() * 10)
          });
          pts.push({ x: x, y: y });
        }
      }
      G.cracks.push({
        pts: pts,
        w: 0.7 + rng() * 1.5,
        delay: rng() * 0.38
      });
    }
  }

  function gemTouched() {
    const gem = G.gem;
    if (!gem) return null;
    for (let i = 0; i < 4; i++) {
      const n = at(gem.c + DIRS[i][0], gem.r + DIRS[i][1]);
      if (isOpen(n)) return n;
    }
    return null;
  }

  function bfsToStart(from) {
    const q = [from];
    const prev = {};
    const key0 = from.c + ',' + from.r;
    prev[key0] = null;
    let qi = 0;
    while (qi < q.length) {
      const cur = q[qi++];
      if (cur.kind === 'start') {
        const path = [];
        let node = cur;
        while (node) {
          path.push(node);
          node = prev[node.c + ',' + node.r];
        }
        path.reverse();
        return path;
      }
      for (let i = 0; i < 4; i++) {
        const n = at(cur.c + DIRS[i][0], cur.r + DIRS[i][1]);
        if (!n || !isOpen(n)) continue;
        const k = n.c + ',' + n.r;
        if (k in prev) continue;
        prev[k] = cur;
        q.push(n);
      }
    }
    return null;
  }

  function applyStage(si) {
    const st = STAGES[si];
    parseMap(st.map);
    relayout();
    buildCracks();
    G.hitCost = st.hit;
    G.faultCost = st.fault || 0;
    G.timeMax = st.time;
    G.time = st.time;
    G.stress = 0;
    G.why = '';
    G.warnAt = 4;
    G.creakAt = 0.55;
    G.flowPath = [];
    G.flowU = 0;
    G.curC = G.start.c;
    G.curR = G.start.r;
    G.taughtAdj = false;
    G.taughtCry = false;
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.18;
    G.settle = 0;
    particles.length = 0;
    rings.length = 0;
    applyStage(i);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].name + ' · ' + STAGES[i].sub);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    startStage(0);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    G.demoChip = 0;
    applyStage(0);
    G.stress = 0.16;
    showOverlay(
      'title',
      '凿冰',
      '在冰块裂开前凿出通路。<br />从暖口凿到冰种。凿得越多、越慢，冰裂得越快。',
      '开凿',
      'CARVE',
      '点按 / 拖凿冰块 · 方向键移动 · 空格凿 · M 静音'
    );
    setHint('点冰块凿开 · 连通冰种 · 粉纹裂隙别凿', '');
    syncHud();
  }

  function canPlay() {
    return G.mode === 'play' && G.lock <= 0 && !G.why;
  }

  function checkWin() {
    const touch = gemTouched();
    if (!touch) return false;
    const chain = bfsToStart(touch);
    if (!chain) return false;
    G.mode = 'flow';
    G.goldFlash = 0.55;
    G.lock = 9;
    audio.flow();
    toast('通路已开', false, true);
    setHint('冰种滑出', 'hot');
    const pts = [];
    pts.push(cellCenter(G.gem));
    for (let i = 0; i < chain.length; i++) pts.push(cellCenter(chain[i]));
    G.flowPath = pts;
    G.flowU = 0;
    return true;
  }

  function finishFlow() {
    audio.good();
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '凿通',
        '十块冰全部凿通，冰种都救出来了。',
        '再凿一巡',
        'THAWED'
      );
      setHint('十关通路全开', 'hot');
    } else {
      G.mode = 'clear';
      G.settle = 0.72;
    }
    syncHud();
  }

  function beginShatter(why) {
    if (G.mode !== 'play') return;
    G.why = why;
    G.mode = 'shatter';
    G.settle = 1.05;
    G.magFlash = 0.9;
    G.shake = 18;
    G.stress = 1;
    audio.shatter();
    toast(why === 'time' ? '冻裂了' : '凿裂了', true);
    setHint(why === 'time' ? '来不及了' : '冰块裂开了', 'warn');
    const midX = G.originX + G.gridW * 0.5;
    const midY = G.originY + G.gridH * 0.5;
    for (let i = 0; i < G.cells.length; i++) {
      const cell = G.cells[i];
      if (cell.kind === 'start' || cell.kind === 'gem') continue;
      const p = cellCenter(cell);
      cell.fly = true;
      cell.vx = (p.x - midX) * rand(1.6, 3.4) + rand(-40, 40);
      cell.vy = (p.y - midY) * rand(0.8, 2.2) - rand(40, 160);
      cell.vr = rand(-8, 8);
      const n = cell.kind === 'crystal' ? 5 : 8;
      emit(n, {
        x: p.x,
        y: p.y,
        j: G.cs * 0.28,
        vx0: -160,
        vx1: 160,
        vy0: -200,
        vy1: 40,
        life: 0.7,
        r0: 1.2,
        r1: 3.6,
        mag: cell.fault || cell.kind === 'crystal',
        g: 520
      });
    }
    addRing(midX, midY, true);
  }

  function failStage() {
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    const stress = G.why === 'stress';
    showOverlay(
      'lose',
      stress ? '凿裂' : '冻裂',
      more
        ? (stress
          ? '凿得太多，裂隙连成了缝。<br />还剩 ' + G.lives + ' 次。'
          : '没赶上。冰自己也会裂。<br />还剩 ' + G.lives + ' 次。')
        : (stress ? '冰块裂开，十关未完。' : '冻裂了，十关未完。'),
      more ? '再凿本关' : '再来一局',
      stress ? 'SPLIT' : 'FROST'
    );
    G.mode = 'fail';
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

  function tryCarve(cell, fromPtr) {
    if (!canPlay()) return false;
    if (!cell) return false;
    if (cell.kind === 'crystal') {
      cell.shake = 0.5;
      audio.deny();
      if (!G.taughtCry) {
        toast('晶石凿不开', true);
        G.taughtCry = true;
      }
      return false;
    }
    if (cell.kind === 'gem' || cell.kind === 'start') return false;
    if (cell.kind === 'ice' && cell.hp > 0 && !canCarve(cell)) {
      cell.shake = 0.55;
      audio.deny();
      if (!G.taughtAdj) {
        toast('要从通路凿起', true);
        G.taughtAdj = true;
      }
      return false;
    }
    if (!canCarve(cell)) return false;

    cell.hp -= 1;
    cell.flash = 1;
    cell.shake = 0.35;
    G.strikeT = 0.14;
    G.curC = cell.c;
    G.curR = cell.r;
    G.carveCd = fromPtr ? 0.09 : 0.12;
    const nick = cell.hp > 0;
    const cost = G.hitCost * (nick ? 0.7 : 1);
    G.stress = Math.min(1.05, G.stress + cost + (cell.fault ? G.faultCost : 0));
    const p = cellCenter(cell);
    audio.chip(cell.max > 1 && nick, cell.fault && !nick);
    emit(nick ? 6 : 11, {
      x: p.x,
      y: p.y,
      j: G.cs * 0.22,
      vx0: -90,
      vx1: 90,
      vy0: -130,
      vy1: -10,
      life: 0.42,
      r0: 1,
      r1: 2.6,
      mag: cell.fault,
      gold: !cell.fault && !nick,
      g: 420
    });
    addRing(p.x, p.y, cell.fault);
    if (cell.hp <= 0) {
      if (checkWin()) {
        syncHud();
        return true;
      }
    }
    if (G.stress >= 1) beginShatter('stress');
    syncHud();
    return true;
  }

  function moveCursor(dc, dr) {
    const nc = clamp(G.curC + dc, 0, G.cols - 1);
    const nr = clamp(G.curR + dr, 0, G.rows - 1);
    if (nc === G.curC && nr === G.curR) return;
    G.curC = nc;
    G.curR = nr;
    G.moveCd = 0.11;
    audio.tick();
  }

  function cellFromWorld(x, y) {
    const c = Math.floor((x - G.originX) / G.cs);
    const r = Math.floor((y - G.originY) / G.cs);
    return at(c, r);
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;
    return {
      x: (x - ox) / scale,
      y: (y - oy) / scale
    };
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.7);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lock = Math.max(0, G.lock - dt);
    G.strikeT = Math.max(0, G.strikeT - dt);
    G.moveCd = Math.max(0, G.moveCd - dt);
    G.carveCd = Math.max(0, G.carveCd - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    for (let i = 0; i < G.cells.length; i++) {
      const cell = G.cells[i];
      cell.flash = Math.max(0, cell.flash - dt * 4);
      cell.shake = Math.max(0, cell.shake - dt * 5);
      if (cell.fly) {
        cell.vy += 520 * dt;
        cell.px += cell.vx * dt;
        cell.py += cell.vy * dt;
        cell.rot += cell.vr * dt;
        cell.vx *= 0.992;
      }
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
    if ((G.mode === 'play' || G.mode === 'title') && Math.random() < dt * 7) {
      emit(1, {
        x: rand(G.originX, G.originX + G.gridW),
        y: G.originY - 8,
        j: 4,
        vx0: -12,
        vx1: 12,
        vy0: 12,
        vy1: 40,
        life: 1.4,
        r0: 0.6,
        r1: 1.4,
        g: 40
      });
    }
  }

  function updateDemo(dt) {
    G.stress = 0.14 + 0.12 * (0.5 + 0.5 * Math.sin(G.clock * 0.7));
    G.demoChip += dt;
    if (G.demoChip > 1.15) {
      G.demoChip = 0;
      const cell = at(G.start.c + 1, G.start.r);
      if (cell) {
        cell.flash = 1;
        const p = cellCenter(cell);
        emit(5, {
          x: p.x, y: p.y, j: 8,
          vx0: -50, vx1: 50, vy0: -80, vy1: -10,
          life: 0.4, r0: 1, r1: 2.2, gold: true, g: 300
        });
        G.strikeT = 0.12;
        G.curC = cell.c;
        G.curR = cell.r;
      }
    }
  }

  function updatePlay(dt) {
    G.time -= dt;
    G.stress = Math.min(1.05, G.stress + dt * (0.22 / Math.max(8, G.timeMax)));
    if (G.time < G.warnAt) {
      audio.warn();
      G.warnAt = G.time < 2 ? G.time - 0.5 : G.time - 1;
    }
    if (G.stress > G.creakAt) {
      audio.creak();
      G.creakAt = G.stress > 0.86 ? 1.2 : G.stress + 0.16;
      G.shake = Math.max(G.shake, 5);
    }
    if (G.stress >= 1) {
      beginShatter('stress');
      return;
    }
    if (G.time <= 0) {
      G.time = 0;
      beginShatter('time');
      return;
    }
    if (G.moveCd <= 0) {
      if (keys.l) moveCursor(-1, 0);
      else if (keys.r) moveCursor(1, 0);
      else if (keys.u) moveCursor(0, -1);
      else if (keys.d) moveCursor(0, 1);
    }
    if (keys.carve && G.carveCd <= 0) {
      const hold = at(G.curC, G.curR);
      if (canCarve(hold)) tryCarve(hold, false);
    }
    if (ptr.down && ptr.dwell > 0) {
      ptr.dwell -= dt;
      if (ptr.dwell <= 0) {
        const cell = cellFromWorld(ptr.x, ptr.y);
        if (cell && cell.c === ptr.lastC && cell.r === ptr.lastR && canCarve(cell)) {
          tryCarve(cell, true);
          ptr.dwell = 0.12;
        }
      }
    }
  }

  function updateFlow(dt) {
    const n = G.flowPath.length;
    if (n < 2) {
      finishFlow();
      return;
    }
    G.flowU += dt * 6.2;
    const max = n - 1;
    if (G.flowU >= max) {
      G.flowU = max;
      const p = G.flowPath[max];
      emit(16, {
        x: p.x, y: p.y, j: 10,
        vx0: -80, vx1: 80, vy0: -140, vy1: -20,
        life: 0.55, r0: 1.2, r1: 3, gold: true, g: 240
      });
      addRing(p.x, p.y, false);
      finishFlow();
    } else if (Math.random() < dt * 28) {
      const f = flowPos();
      emit(1, {
        x: f.x, y: f.y, j: 3,
        vx0: -20, vx1: 20, vy0: -30, vy1: 10,
        life: 0.35, r0: 0.8, r1: 1.8, g: 80
      });
    }
  }

  function flowPos() {
    const pts = G.flowPath;
    if (!pts.length) return cellCenter(G.gem);
    const u = clamp(G.flowU, 0, pts.length - 1);
    const i = Math.min(pts.length - 2, u | 0);
    const t = u - i;
    return {
      x: lerp(pts[i].x, pts[i + 1].x, t),
      y: lerp(pts[i].y, pts[i + 1].y, t)
    };
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') {
      updateDemo(dt);
    } else if (G.mode === 'play') {
      updatePlay(dt);
    } else if (G.mode === 'flow') {
      updateFlow(dt);
    } else if (G.mode === 'clear') {
      G.settle -= dt;
      if (G.settle <= 0) startStage(G.stage + 1);
    } else if (G.mode === 'shatter') {
      G.settle -= dt;
      if (G.settle <= 0) failStage();
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

    const g = ctx.createRadialGradient(sx(70), sy(40), 8, sx(70), sy(40), 280 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.14)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(410), sy(80), 8, sx(410), sy(80), 270 * scale);
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
    vg.addColorStop(0, 'rgba(10, 18, 40, 0.85)');
    vg.addColorStop(0.5, 'rgba(8, 6, 20, 0.2)');
    vg.addColorStop(1, 'rgba(12, 8, 32, 0.7)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.clock * 0.7 + m.p));
      ctx.fillStyle = rgb(i % 3 === 0 ? MAG : CYN, a);
      ctx.beginPath();
      ctx.arc(
        sx(m.x + Math.sin(G.clock * 0.28 + m.p) * m.s * 0.16),
        sy(m.y + (G.clock * m.s * 0.35) % VH),
        m.r * scale,
        0,
        TAU
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStressBar() {
    const x = G.originX;
    const y = G.originY - 28;
    const w = G.gridW;
    const h = 8;
    roundRect(ctx, sx(x), sy(y), w * scale, h * scale, 4 * scale);
    ctx.fillStyle = 'rgba(12, 10, 24, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
    const k = clamp(G.stress, 0, 1);
    if (k > 0.01) {
      roundRect(ctx, sx(x + 1.5), sy(y + 1.4), Math.max(2, (w - 3) * k) * scale, (h - 2.8) * scale, 3 * scale);
      const hot = k > 0.72;
      ctx.fillStyle = hot ? rgb(MAG, 0.95) : rgb(mix(CYN, MAG, k), 0.9);
      ctx.fill();
    }
    ctx.font = '600 ' + Math.max(9, 10 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = k > 0.72 ? rgb(MAG, 0.85) : 'rgba(180, 230, 255, 0.55)';
    ctx.fillText('裂', sx(x), sy(y - 6));
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(k * 100) + '%', sx(x + w), sy(y - 6));
  }

  function drawFrame() {
    const pad = 10;
    roundRect(
      ctx,
      sx(G.originX - pad),
      sy(G.originY - pad),
      (G.gridW + pad * 2) * scale,
      (G.gridH + pad * 2) * scale,
      12 * scale
    );
    ctx.fillStyle = 'rgba(6, 16, 28, 0.92)';
    ctx.fill();
    ctx.strokeStyle = rgb(mix(CYN, MAG, clamp(G.stress, 0, 1)), 0.45 + G.stress * 0.35);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();
  }

  function drawHole(cell, x, y, s, gold) {
    const inset = s * 0.12;
    roundRect(ctx, sx(x + inset), sy(y + inset), (s - inset * 2) * scale, (s - inset * 2) * scale, 6 * scale);
    ctx.fillStyle = gold ? 'rgba(28, 16, 8, 0.96)' : 'rgba(4, 6, 14, 0.96)';
    ctx.fill();
    ctx.save();
    ctx.clip();
    const glow = ctx.createRadialGradient(
      sx(x + s * 0.5),
      sy(y + s * 0.5),
      2 * scale,
      sx(x + s * 0.5),
      sy(y + s * 0.5),
      s * 0.55 * scale
    );
    glow.addColorStop(0, gold ? 'rgba(255, 180, 80, 0.16)' : 'rgba(0, 240, 255, 0.12)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx(x), sy(y), s * scale, s * scale);
    ctx.restore();
    for (let i = 0; i < 4; i++) {
      const n = at(cell.c + DIRS[i][0], cell.r + DIRS[i][1]);
      if (!n) continue;
      if (n.kind !== 'ice' || n.hp <= 0) continue;
      ctx.strokeStyle = gold ? rgb(GOLD, 0.55) : rgb(CYN, 0.45);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      const m = 3;
      if (DIRS[i][0] === 1) {
        ctx.moveTo(sx(x + s - m), sy(y + s * 0.2));
        ctx.lineTo(sx(x + s - m), sy(y + s * 0.8));
      } else if (DIRS[i][0] === -1) {
        ctx.moveTo(sx(x + m), sy(y + s * 0.2));
        ctx.lineTo(sx(x + m), sy(y + s * 0.8));
      } else if (DIRS[i][1] === 1) {
        ctx.moveTo(sx(x + s * 0.2), sy(y + s - m));
        ctx.lineTo(sx(x + s * 0.8), sy(y + s - m));
      } else {
        ctx.moveTo(sx(x + s * 0.2), sy(y + m));
        ctx.lineTo(sx(x + s * 0.8), sy(y + m));
      }
      ctx.stroke();
    }
  }

  function drawIceCell(cell, x, y, s) {
    const k = cell.max <= 0 ? 0 : cell.hp / cell.max;
    const col = mix(mix(DEEP, ICE, 0.35 + k * 0.55), cell.fault ? MAG : ICE, cell.fault ? 0.22 : 0);
    const rad = Math.max(4, s * 0.16);
    roundRect(ctx, sx(x + 1.5), sy(y + 1.5), (s - 3) * scale, (s - 3) * scale, rad * scale);
    const lg = ctx.createLinearGradient(sx(x), sy(y), sx(x + s), sy(y + s));
    lg.addColorStop(0, rgb(mix(col, { r: 230, g: 250, b: 255 }, 0.45), 0.92));
    lg.addColorStop(0.55, rgb(col, 0.88));
    lg.addColorStop(1, rgb(mix(col, DEEP, 0.35), 0.92));
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = rgb(mix(CYN, { r: 255, g: 255, b: 255 }, 0.4), 0.22 + k * 0.18);
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sx(x + s * 0.18), sy(y + s * 0.22));
    ctx.lineTo(sx(x + s * 0.55), sy(y + s * 0.16));
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.2 * scale;
    ctx.lineCap = 'round';
    ctx.stroke();

    const bubbles = 2 + (cell.max > 1 ? 1 : 0);
    for (let i = 0; i < bubbles; i++) {
      const bx = x + s * (0.22 + hash(cell.c, cell.r, i) * 0.52);
      const by = y + s * (0.28 + hash(cell.c, cell.r, i + 9) * 0.48);
      ctx.beginPath();
      ctx.arc(sx(bx), sy(by), (0.8 + hash(cell.c, cell.r, i + 3) * 1.6) * scale, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
    }

    if (cell.max > 1) {
      roundRect(ctx, sx(x + s * 0.18), sy(y + s * 0.18), s * 0.64 * scale, s * 0.64 * scale, 4 * scale);
      ctx.strokeStyle = rgb(CYN, 0.12 + k * 0.2);
      ctx.lineWidth = (0.8 + cell.max * 0.3) * scale;
      ctx.stroke();
    }

    if (cell.hp < cell.max) {
      ctx.beginPath();
      const nicks = cell.max - cell.hp;
      for (let i = 0; i < nicks; i++) {
        const a = hash(cell.c, cell.r, 20 + i) * TAU;
        const r0 = s * 0.12;
        const r1 = s * (0.28 + hash(cell.c, cell.r, 30 + i) * 0.22);
        const cx = x + s * 0.5;
        const cy = y + s * 0.5;
        ctx.moveTo(sx(cx + Math.cos(a) * r0), sy(cy + Math.sin(a) * r0));
        ctx.lineTo(sx(cx + Math.cos(a) * r1), sy(cy + Math.sin(a) * r1));
      }
      ctx.strokeStyle = rgb(MAG, 0.45);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
    }

    if (cell.max > 1 && cell.hp > 0) {
      for (let i = 0; i < cell.max; i++) {
        ctx.beginPath();
        ctx.arc(sx(x + s * 0.28 + i * s * 0.2), sy(y + s * 0.82), 2.1 * scale, 0, TAU);
        ctx.fillStyle = i < cell.hp ? rgb(GOLD, 0.85) : 'rgba(255,255,255,0.14)';
        ctx.fill();
      }
    }

    if (cell.fault) {
      ctx.beginPath();
      ctx.moveTo(sx(x + s * 0.22), sy(y + s * 0.2));
      ctx.lineTo(sx(x + s * 0.4), sy(y + s * 0.52));
      ctx.lineTo(sx(x + s * 0.72), sy(y + s * 0.78));
      ctx.moveTo(sx(x + s * 0.7), sy(y + s * 0.24));
      ctx.lineTo(sx(x + s * 0.5), sy(y + s * 0.48));
      ctx.strokeStyle = rgb(MAG, 0.55 + 0.25 * Math.sin(G.clock * 6 + cell.c));
      ctx.lineWidth = 1.3 * scale;
      ctx.stroke();
    }

    if (cell.flash > 0) {
      roundRect(ctx, sx(x + 1.5), sy(y + 1.5), (s - 3) * scale, (s - 3) * scale, rad * scale);
      ctx.fillStyle = rgb(GOLD, cell.flash * 0.35);
      ctx.fill();
    }
  }

  function drawCrystal(cell, x, y, s) {
    const cx = x + s * 0.5;
    const cy = y + s * 0.5;
    const pulse = 0.85 + 0.15 * Math.sin(G.clock * 2.2 + cell.c * 0.7);
    ctx.save();
    ctx.translate(sx(cx), sy(cy));
    ctx.rotate(0.12);
    ctx.beginPath();
    const rr = s * 0.34 * pulse * scale;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr * 1.15;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const lg = ctx.createLinearGradient(-rr, -rr, rr, rr);
    lg.addColorStop(0, rgb(MAG, 0.85));
    lg.addColorStop(0.5, 'rgba(40, 12, 48, 0.95)');
    lg.addColorStop(1, rgb(CYN, 0.7));
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = rgb(CYN, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -rr * 0.8);
    ctx.lineTo(0, rr * 0.8);
    ctx.moveTo(-rr * 0.55, 0);
    ctx.lineTo(rr * 0.55, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 0.8 * scale;
    ctx.stroke();
    ctx.restore();
  }

  function drawGem(x, y, s, traveling) {
    const cx = traveling ? x : x + s * 0.5;
    const cy = traveling ? y : y + s * 0.5;
    const pulse = 0.86 + 0.14 * Math.sin(G.clock * 4.2);
    const R = (traveling ? G.cs * 0.28 : s * 0.32) * pulse;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(sx(cx), sy(cy), R * 2.1 * scale, 0, TAU);
    ctx.fillStyle = rgb(CYN, 0.12);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(sx(cx), sy(cy), R * scale, 0, TAU);
    const lg = ctx.createRadialGradient(sx(cx - R * 0.3), sy(cy - R * 0.35), 1, sx(cx), sy(cy), R * scale);
    lg.addColorStop(0, '#e8ffff');
    lg.addColorStop(0.4, rgb(CYN, 1));
    lg.addColorStop(1, '#04303a');
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = rgb(CYN, 0.9);
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(cx - R * 0.22), sy(cy - R * 0.24), R * 0.22 * scale, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
  }

  function drawStartMouth(cell, x, y, s) {
    drawHole(cell, x, y, s, true);
    const cx = x + s * 0.5;
    const cy = y + s * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(sx(cx), sy(cy), s * 0.42 * scale, 0, TAU);
    ctx.fillStyle = rgb(GOLD, 0.12 + 0.08 * Math.sin(G.clock * 3));
    ctx.fill();
    ctx.restore();
  }

  function drawCracks() {
    const k = clamp(G.stress, 0, 1);
    if (k < 0.04) return;
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, sx(G.originX), sy(G.originY), G.gridW * scale, G.gridH * scale, 8 * scale);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.cracks.length; i++) {
      const cr = G.cracks[i];
      const vis = clamp((k - cr.delay) / Math.max(0.12, 1 - cr.delay), 0, 1);
      if (vis <= 0) continue;
      const n = Math.max(2, Math.ceil(cr.pts.length * vis));
      ctx.beginPath();
      for (let p = 0; p < n; p++) {
        const pt = cr.pts[p];
        if (p === 0) ctx.moveTo(sx(pt.x), sy(pt.y));
        else ctx.lineTo(sx(pt.x), sy(pt.y));
      }
      ctx.strokeStyle = rgb(MAG, 0.18 + vis * 0.45);
      ctx.lineWidth = cr.w * scale * (0.7 + vis);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawChisel() {
    if (G.mode !== 'play' && G.mode !== 'title') return;
    const cell = at(G.curC, G.curR);
    if (!cell) return;
    const s = G.cs;
    const x = G.originX + cell.c * s + cell.px;
    const y = G.originY + cell.r * s + cell.py;
    const ready = canCarve(cell);
    roundRect(ctx, sx(x + 2), sy(y + 2), (s - 4) * scale, (s - 4) * scale, 7 * scale);
    ctx.strokeStyle = ready ? rgb(GOLD, 0.85) : rgb(CYN, 0.4);
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();
    const cx = x + s * 0.72;
    const cy = y + s * 0.28;
    const dip = G.strikeT > 0 ? 0.45 : 0;
    ctx.save();
    ctx.translate(sx(cx), sy(cy));
    ctx.rotate(-0.7 + dip);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(7 * scale, 16 * scale);
    ctx.lineTo(-3.5 * scale, 16 * scale);
    ctx.closePath();
    ctx.fillStyle = rgb(GOLD, 0.95);
    ctx.fill();
    ctx.fillStyle = 'rgba(40, 28, 8, 0.9)';
    ctx.fillRect(-1.4 * scale, 16 * scale, 2.8 * scale, 9 * scale);
    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = ease(r.t / 0.55);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + k * 34) * scale, 0, TAU);
      ctx.strokeStyle = rgb(r.mag ? MAG : CYN, 0.4 * (1 - k));
      ctx.lineWidth = (2.2 - k * 1.4) * scale;
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fillStyle = rgb(p.mag ? MAG : p.gold ? GOLD : ICE, a * 0.9);
      ctx.fill();
    }
  }

  function drawLabels() {
    ctx.font = '600 ' + Math.max(10, 11 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    const ly = G.originY + G.gridH + 22;
    if (G.start) {
      const p = cellCenter(G.start);
      ctx.fillStyle = rgb(GOLD, 0.6);
      ctx.fillText('暖口', sx(p.x), sy(ly));
    }
    if (G.gem && G.mode !== 'flow' && G.mode !== 'clear' && G.mode !== 'win') {
      const p = cellCenter(G.gem);
      ctx.fillStyle = rgb(CYN, 0.6);
      ctx.fillText('冰种', sx(p.x), sy(ly));
    }
    ctx.fillStyle = 'rgba(180, 200, 230, 0.38)';
    const st = STAGES[G.stage];
    if (st && G.mode !== 'title') {
      ctx.fillText(st.sub, sx(VW * 0.5), sy(ly + 16));
    }
  }

  function drawFlash() {
    if (G.magFlash > 0) {
      ctx.fillStyle = rgb(MAG, G.magFlash * 0.18);
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = rgb(GOLD, G.goldFlash * 0.1);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    const shx = G.shake ? rand(-G.shake, G.shake) * 0.35 : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) * 0.35 : 0;
    ctx.save();
    ctx.translate(shx * scale, shy * scale);
    drawBg();

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    drawFrame();
    drawStressBar();

    const s = G.cs;
    for (let i = 0; i < G.cells.length; i++) {
      const cell = G.cells[i];
      const jx = cell.shake ? rand(-1.4, 1.4) * cell.shake : 0;
      const jy = cell.shake ? rand(-1.4, 1.4) * cell.shake : 0;
      const x = G.originX + cell.c * s + cell.px + jx;
      const y = G.originY + cell.r * s + cell.py + jy;
      ctx.save();
      if (cell.rot) {
        ctx.translate(sx(x + s * 0.5), sy(y + s * 0.5));
        ctx.rotate(cell.rot);
        ctx.translate(-sx(x + s * 0.5), -sy(y + s * 0.5));
      }
      if (cell.kind === 'ice') {
        if (cell.hp > 0) drawIceCell(cell, x, y, s);
        else drawHole(cell, x, y, s, false);
      } else if (cell.kind === 'crystal') {
        roundRect(ctx, sx(x + 2), sy(y + 2), (s - 4) * scale, (s - 4) * scale, 6 * scale);
        ctx.fillStyle = 'rgba(10, 8, 22, 0.8)';
        ctx.fill();
        drawCrystal(cell, x, y, s);
      } else if (cell.kind === 'start') {
        drawStartMouth(cell, x, y, s);
      } else if (cell.kind === 'gem') {
        roundRect(ctx, sx(x + 2), sy(y + 2), (s - 4) * scale, (s - 4) * scale, 6 * scale);
        ctx.fillStyle = 'rgba(6, 18, 28, 0.9)';
        ctx.fill();
        if (G.mode !== 'flow' && G.mode !== 'clear' && G.mode !== 'win') {
          drawGem(x, y, s, false);
        } else if (G.mode === 'clear' || G.mode === 'win') {
          /* gem already traveled */
        }
      }
      ctx.restore();
    }

    drawCracks();
    drawChisel();

    if (G.mode === 'flow') {
      const f = flowPos();
      drawGem(f.x, f.y, G.cs, true);
    } else if (G.mode === 'clear' || G.mode === 'win') {
      const p = cellCenter(G.start);
      drawGem(p.x, p.y, G.cs, true);
    }

    drawParticles();
    drawLabels();
    ctx.restore();
    ctx.restore();
    drawFlash();
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
    if (G.cols && G.cells.length) {
      relayout();
      buildCracks();
    }
  }

  function onKey(e, down) {
    const k = e.key;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === ' ' || k === 'Spacebar' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S')) {
      e.preventDefault();
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = down;
    if (k === ' ' || k === 'Spacebar') keys.carve = down;
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
        keys.carve = false;
        return;
      }
    }
    if (G.mode !== 'play') return;
    if ((k === ' ' || k === 'Spacebar' || k === 'Enter') && G.carveCd <= 0) {
      tryCarve(at(G.curC, G.curR), false);
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    audio.ensure();
    if (!canPlay()) return;
    const w = worldFromEvent(e);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.x = w.x;
    ptr.y = w.y;
    ptr.hover = true;
    const cell = cellFromWorld(w.x, w.y);
    if (cell) {
      G.curC = cell.c;
      G.curR = cell.r;
      ptr.lastC = cell.c;
      ptr.lastR = cell.r;
      tryCarve(cell, true);
      ptr.dwell = 0.14;
    }
    canvas.classList.add('drag');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    ptr.x = w.x;
    ptr.y = w.y;
    if (e.pointerType === 'mouse') ptr.hover = true;
    if (!ptr.down || (ptr.id != null && e.pointerId !== ptr.id)) return;
    const cell = cellFromWorld(w.x, w.y);
    if (!cell) return;
    G.curC = cell.c;
    G.curR = cell.r;
    if (cell.c !== ptr.lastC || cell.r !== ptr.lastR) {
      ptr.lastC = cell.c;
      ptr.lastR = cell.r;
      tryCarve(cell, true);
      ptr.dwell = 0.14;
    }
  });

  function endPtr(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    ptr.down = false;
    ptr.id = null;
    ptr.dwell = 0;
    canvas.classList.remove('drag');
    if (e.pointerType !== 'mouse') ptr.hover = false;
  }

  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') ptr.hover = false;
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
  btnCarve.addEventListener('click', function () {
    audio.ensure();
    if (canPlay()) tryCarve(at(G.curC, G.curR), false);
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
