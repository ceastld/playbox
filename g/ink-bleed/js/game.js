'use strict';

(function () {
  const COLS = 20;
  const ROWS = 20;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-ink-bleed-mute';
  const WIN_COVER = 0.8;
  const SETTLE = 0.42;
  const LOCK = 0.2;
  const MOVE_EVERY = 0.075;

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  const STAGES = [
    {
      name: '一',
      sub: 'STROKE',
      hint: '沿淡影围一圈空白，把墨堵在横画里',
      blank: 54,
      delay: 2.2,
      rate: 2.55,
      map: [
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....##############..',
        '....##############..',
        '....S#############..',
        '....##############..',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................'
      ]
    },
    {
      name: '口',
      sub: 'GATE',
      hint: '口心也要封，别让墨淌进空洞',
      blank: 100,
      delay: 2.05,
      rate: 2.55,
      map: [
        '....................',
        '....................',
        '....................',
        '...##############...',
        '...######S#######...',
        '...##############...',
        '...###........###...',
        '...###........###...',
        '...###........###...',
        '...###........###...',
        '...###........###...',
        '...###........###...',
        '...##############...',
        '...##############...',
        '...##############...',
        '....................',
        '....................',
        '....................',
        '....................',
        '....................'
      ]
    },
    {
      name: '日',
      sub: 'SUN',
      hint: '上下两格的空都要封死',
      blank: 112,
      delay: 1.75,
      rate: 2.8,
      map: [
        '....................',
        '....................',
        '...##############...',
        '...######S#######...',
        '...##############...',
        '...###........###...',
        '...###........###...',
        '...###........###...',
        '...##############...',
        '...##############...',
        '...##############...',
        '...###........###...',
        '...###........###...',
        '...###........###...',
        '...##############...',
        '...##############...',
        '...##############...',
        '....................',
        '....................',
        '....................'
      ]
    },
    {
      name: '木',
      sub: 'TREE',
      hint: '树干、横画、两斜都要贴边堵住',
      blank: 92,
      delay: 1.22,
      rate: 3.5,
      map: [
        '....................',
        '....................',
        '........####........',
        '........####........',
        '........####........',
        '........####........',
        '...##############...',
        '...##############...',
        '........S###........',
        '........####........',
        '......########......',
        '.....####..####.....',
        '....####....####....',
        '...####......####...',
        '..####........####..',
        '.####..........####.',
        '....................',
        '....................',
        '....................',
        '....................'
      ]
    },
    {
      name: '田',
      sub: 'FIELD',
      hint: '四格空心都不能进墨。第二滴会落',
      blank: 128,
      delay: 1.28,
      rate: 3.15,
      drop2: 3.05,
      map: [
        '....................',
        '....................',
        '...###############..',
        '...######S########..',
        '...###############..',
        '...###...###...###..',
        '...###...###...###..',
        '...###...###...###..',
        '...###############..',
        '...###############..',
        '...###############..',
        '...###...###...###..',
        '...###...###...###..',
        '...###...###...###..',
        '...###############..',
        '...######s########..',
        '...###############..',
        '....................',
        '....................',
        '....................'
      ]
    }
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : 0 + v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function nhash(c, r, s) {
    let n = (c * 374761 + r * 668265 + (s | 0) * 911) | 0;
    n = (n ^ (n >>> 13)) | 0;
    n = Math.imul(n, 127412647);
    return ((n >>> 0) % 1000) / 1000;
  }

  function inb(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }

  function idx(c, r) {
    return r * COLS + c;
  }

  STAGES.forEach(function (st, si) {
    if (st.map.length !== ROWS) throw new Error(st.name + ' rows ' + st.map.length);
    for (let i = 0; i < ROWS; i++) {
      if (st.map[i].length !== COLS) {
        throw new Error(st.name + ' row ' + i + ' len ' + st.map[i].length);
      }
    }
    let seeds = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = st.map[r][c];
        if (ch === 'S' || ch === 's') seeds++;
      }
    }
    if (!seeds) throw new Error(st.name + ' no seed');
    if (si === 4 && !st.drop2) throw new Error('field drop2');
  });

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const stageEl = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovBtn = document.getElementById('ov-btn');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageLabel = document.getElementById('stage-label');
  const fillLabel = document.getElementById('fill-label');
  const leakLabel = document.getElementById('leak-label');
  const blankLabel = document.getElementById('blank-label');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');

  const N = COLS * ROWS;
  const target = new Uint8Array(N);
  const hole = new Uint8Array(N);
  const cell = new Uint8Array(N);
  const soak = new Float32Array(N);
  const age = new Float32Array(N);
  const addSoak = new Float32Array(N);

  const EMPTY = 0;
  const RESIST = 1;
  const INK = 2;

  const view = {
    cssW: 1,
    cssH: 1,
    dpr: 1,
    cell: 16,
    ox: 0,
    oy: 0,
    gw: 1,
    gh: 1
  };

  let paper = null;
  let mode = 'title';
  let stageIndex = 0;
  let time = 0;
  let acc = 0;
  let blankLeft = 0;
  let blankMax = 0;
  let delay = 1;
  let rate = 3;
  let bleedAt = 9;
  let settledFor = 0;
  let ending = null;
  let endT = 0;
  let bleedSaid = false;
  let prevLeak = 0;
  let shake = 0;
  let toastT = 0;
  let fillCount = 0;
  let leakCount = 0;
  let targetCount = 0;
  let cursorC = 10;
  let cursorR = 10;
  let pointerOn = false;
  let painting = false;
  let lastPC = -1;
  let lastPR = -1;
  let keyWait = 0;
  let firstKey = true;
  let inputLock = 0;
  let hudDirty = true;
  let lastFillShown = -1;
  let lastLeakShown = -1;
  let lastBlankShown = -1;

  const keys = Object.create(null);
  const particles = [];
  const drops = [];
  const sparks = [];

  const audio = {
    ctx: null,
    master: null,
    noise: null,
    muted: false,
    lastScratch: 0,
    lastBleed: 0,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.ctx.destination);
        const n = Math.floor(this.ctx.sampleRate * 0.35);
        this.noise = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.22;
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
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    scratch: function () {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      if (now - this.lastScratch < 0.032) return;
      this.lastScratch = now;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1400 + Math.random() * 900;
      bp.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.045, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
      src.connect(bp);
      bp.connect(g);
      g.connect(this.master);
      src.start(now);
      src.stop(now + 0.06);
    },
    drip: function () {
      this.ensure();
      this.beep(420, 0.16, 'sine', 0.08, 140);
      this.beep(180, 0.22, 'triangle', 0.05, 70);
    },
    bleedTick: function () {
      if (!this.ctx || this.muted) return;
      const now = this.ctx.currentTime;
      if (now - this.lastBleed < 0.08) return;
      this.lastBleed = now;
      this.beep(90 + Math.random() * 40, 0.07, 'sine', 0.025, 50);
    },
    leak: function () {
      this.ensure();
      this.beep(220, 0.14, 'sawtooth', 0.04, 110);
    },
    deny: function () {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.03, 90);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.12, 'triangle', 0.07, 0);
      this.beep(659, 0.16, 'triangle', 0.07, 0);
      this.beep(784, 0.28, 'sine', 0.08, 392);
    },
    lose: function () {
      this.ensure();
      this.beep(196, 0.28, 'sawtooth', 0.06, 70);
      this.beep(120, 0.4, 'sine', 0.05, 50);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.muted = true;
  } catch (e) { /* ignore */ }
  audio.setMuted(audio.muted);

  function burst(x, y, rgb, n, spd, life) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = spd * (0.25 + Math.random());
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: 0,
        life: life * (0.6 + Math.random() * 0.6),
        rgb: rgb,
        r: 0.9 + Math.random() * 1.8
      });
    }
  }

  function toast(msg, warn) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.remove('hidden');
    toastT = 1.65;
  }

  function parseStage(st) {
    target.fill(0);
    hole.fill(0);
    cell.fill(EMPTY);
    soak.fill(0);
    age.fill(0);
    drops.length = 0;
    particles.length = 0;
    sparks.length = 0;
    targetCount = 0;
    const seeds = [];
    let minC = COLS;
    let minR = ROWS;
    let maxC = 0;
    let maxR = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const ch = st.map[r][c];
        const i = idx(c, r);
        if (ch === '#' || ch === 'S' || ch === 's') {
          target[i] = 1;
          targetCount++;
          if (c < minC) minC = c;
          if (r < minR) minR = r;
          if (c > maxC) maxC = c;
          if (r > maxR) maxR = r;
        }
        if (ch === 'S') seeds.push({ c: c, r: r, at: 0 });
        if (ch === 's') seeds.push({ c: c, r: r, at: st.drop2 || 2.4 });
      }
    }
    const seen = new Uint8Array(N);
    const q = [];
    let qi = 0;
    function pushOut(c, r) {
      if (!inb(c, r)) return;
      const i = idx(c, r);
      if (target[i] || seen[i]) return;
      seen[i] = 1;
      q.push(i);
    }
    for (let c = 0; c < COLS; c++) {
      pushOut(c, 0);
      pushOut(c, ROWS - 1);
    }
    for (let r = 0; r < ROWS; r++) {
      pushOut(0, r);
      pushOut(COLS - 1, r);
    }
    while (qi < q.length) {
      const i = q[qi++];
      const c = i % COLS;
      const r = (i / COLS) | 0;
      for (let d = 0; d < 4; d++) pushOut(c + DIRS[d][0], r + DIRS[d][1]);
    }
    for (let i = 0; i < N; i++) {
      hole[i] = !target[i] && !seen[i] ? 1 : 0;
    }
    seeds.forEach(function (s) {
      drops.push({
        c: s.c,
        r: s.r,
        start: s.at,
        dur: s.at === 0 ? 0.62 : 0.48,
        landed: false
      });
    });
    cursorC = clamp(((minC + maxC) / 2) | 0, 0, COLS - 1);
    cursorR = clamp(minR - 1, 0, ROWS - 1);
    return seeds;
  }

  function countInk() {
    fillCount = 0;
    leakCount = 0;
    for (let i = 0; i < N; i++) {
      if (cell[i] !== INK) continue;
      if (target[i]) fillCount++;
      else leakCount++;
    }
  }

  function coverage() {
    return targetCount ? fillCount / targetCount : 0;
  }

  function leakLimit() {
    return Math.max(8, (targetCount * 0.17) | 0);
  }

  function winLeakMax() {
    return Math.max(2, (targetCount * 0.055) | 0);
  }

  function rebuildPaper() {
    if (!paper) paper = document.createElement('canvas');
    paper.width = canvas.width;
    paper.height = canvas.height;
    const p = paper.getContext('2d');
    const w = paper.width;
    const h = paper.height;
    p.fillStyle = '#07050f';
    p.fillRect(0, 0, w, h);
    const g = p.createRadialGradient(w * 0.3, h * 0.1, 10, w * 0.5, h * 0.4, Math.max(w, h) * 0.8);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.07)');
    g.addColorStop(0.45, 'rgba(0, 240, 255, 0.04)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    p.fillStyle = g;
    p.fillRect(0, 0, w, h);
    p.lineWidth = Math.max(1, view.dpr);
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w;
      p.strokeStyle = 'rgba(255, 236, 210,' + (0.02 + Math.random() * 0.045) + ')';
      p.beginPath();
      p.moveTo(x, 0);
      p.lineTo(x + (Math.random() - 0.5) * 40, h);
      p.stroke();
    }
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w;
      p.strokeStyle = 'rgba(120, 90, 160,' + (0.02 + Math.random() * 0.04) + ')';
      p.beginPath();
      p.moveTo(0, x % h);
      p.lineTo(w, (x + (Math.random() - 0.5) * 80) % h);
      p.stroke();
    }
    for (let i = 0; i < 420; i++) {
      p.fillStyle = Math.random() < 0.5
        ? 'rgba(255, 230, 210,' + (0.02 + Math.random() * 0.05) + ')'
        : 'rgba(0, 0, 0,' + (0.04 + Math.random() * 0.08) + ')';
      p.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.4, 1 + Math.random() * 1.4);
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    const sizeChanged = canvas.width !== w || canvas.height !== h;
    if (sizeChanged) {
      canvas.width = w;
      canvas.height = h;
    }
    view.cssW = rect.width;
    view.cssH = rect.height;
    view.dpr = dpr;
    const pad = 28 * dpr;
    const side = Math.min(w, h) - pad * 2;
    view.cell = Math.max(8, Math.floor(side / COLS));
    view.gw = view.cell * COLS;
    view.gh = view.cell * ROWS;
    view.ox = Math.floor((w - view.gw) / 2);
    view.oy = Math.floor((h - view.gh) / 2);
    if (sizeChanged) rebuildPaper();
  }

  function cellCenter(c, r) {
    return {
      x: view.ox + (c + 0.5) * view.cell,
      y: view.oy + (r + 0.5) * view.cell
    };
  }

  function eventCell(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const c = Math.floor((x - view.ox) / view.cell);
    const r = Math.floor((y - view.oy) / view.cell);
    return { c: c, r: r };
  }

  function paintCell(c, r) {
    if (!inb(c, r)) return false;
    if (mode !== 'play' || ending) return false;
    const i = idx(c, r);
    if (cell[i] === INK) {
      audio.deny();
      return false;
    }
    if (cell[i] === RESIST) return false;
    if (blankLeft <= 0) {
      audio.deny();
      toast('空白用尽', true);
      return false;
    }
    cell[i] = RESIST;
    soak[i] = 0;
    blankLeft--;
    const p = cellCenter(c, r);
    burst(p.x, p.y, '200, 240, 255', 4, 40 * view.dpr, 0.28);
    audio.scratch();
    hudDirty = true;
    return true;
  }

  function paintLine(c0, r0, c1, r1) {
    const n = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0), 1);
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      paintCell((c0 + (c1 - c0) * t + 0.5) | 0, (r0 + (r1 - r0) * t + 0.5) | 0);
    }
  }

  function inkCell(c, r, fromDrop) {
    if (!inb(c, r)) return false;
    const i = idx(c, r);
    if (cell[i] === RESIST) return false;
    if (cell[i] === INK) return false;
    cell[i] = INK;
    soak[i] = 1;
    age[i] = 0;
    const p = cellCenter(c, r);
    const leak = !target[i];
    burst(
      p.x,
      p.y,
      leak ? '255, 61, 184' : '0, 240, 255',
      fromDrop ? 16 : 5,
      (fromDrop ? 90 : 36) * view.dpr,
      fromDrop ? 0.45 : 0.28
    );
    if (!fromDrop) audio.bleedTick();
    hudDirty = true;
    return true;
  }

  function openFrontier() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (cell[idx(c, r)] !== INK) continue;
        for (let d = 0; d < 4; d++) {
          const nc = c + DIRS[d][0];
          const nr = r + DIRS[d][1];
          if (!inb(nc, nr)) continue;
          if (cell[idx(nc, nr)] === EMPTY) return true;
        }
      }
    }
    return false;
  }

  function inkOnEdge() {
    for (let c = 0; c < COLS; c++) {
      if (cell[idx(c, 0)] === INK) return true;
      if (cell[idx(c, ROWS - 1)] === INK) return true;
    }
    for (let r = 0; r < ROWS; r++) {
      if (cell[idx(0, r)] === INK) return true;
      if (cell[idx(COLS - 1, r)] === INK) return true;
    }
    return false;
  }

  function beginEnd(kind, reason) {
    if (ending) return;
    ending = kind;
    endT = 0;
    painting = false;
    if (kind === 'win') {
      audio.win();
      for (let i = 0; i < N; i++) {
        if (cell[i] !== INK || !target[i]) continue;
        if (Math.random() > 0.18) continue;
        const c = i % COLS;
        const r = (i / COLS) | 0;
        const p = cellCenter(c, r);
        sparks.push({ x: p.x, y: p.y, t: 0, life: 0.5 + Math.random() * 0.35 });
      }
    } else {
      audio.lose();
      shake = 7;
      toast(reason === 'edge' ? '洇到纸边' : reason === 'cover' ? '字没成' : '墨溢出去了', true);
    }
  }

  function showOverlay(kind, reason) {
    mode = kind === 'title' ? 'title' : kind === 'win' || kind === 'winall' ? 'win' : 'lose';
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    ovOps.style.display = '';
    if (kind === 'title') {
      ovKicker.textContent = 'INK';
      ovTitle.textContent = '洇墨';
      ovLead.textContent = '墨会扩散。用空白堵住它，让它洇成字。';
      ovOps.textContent = '拖动画空白 · WASD 移笔 · 空格落空白 · M 静音';
      ovBtn.textContent = '落墨';
    } else if (kind === 'win') {
      panel.classList.add('win');
      const st = STAGES[stageIndex];
      ovKicker.textContent = st.sub;
      ovTitle.textContent = '墨成';
      ovLead.textContent = '这一帖定住了。淡影里的墨收成了「' + st.name + '」。';
      ovOps.textContent = '成 ' + Math.round(coverage() * 100) + '% · 字外 ' + leakCount + ' 格';
      ovBtn.textContent = '下一帖';
    } else if (kind === 'winall') {
      panel.classList.add('win');
      ovKicker.textContent = 'INK';
      ovTitle.textContent = '满纸';
      ovLead.textContent = '五帖都堵住了。墨在空白里成了字。';
      ovOps.textContent = '一 口 日 木 田';
      ovBtn.textContent = '再来一局';
    } else {
      panel.classList.add('lose');
      if (reason === 'edge') {
        ovKicker.textContent = '纸边';
        ovTitle.textContent = '洇出';
        ovLead.textContent = '墨爬到了纸边。先把外圈封死。';
      } else if (reason === 'cover') {
        ovKicker.textContent = '缺笔';
        ovTitle.textContent = '字残';
        ovLead.textContent = '空白咬进了笔画，或墨没走满。字心要留给墨。';
      } else {
        ovKicker.textContent = '洇开';
        ovTitle.textContent = '墨溢';
        ovLead.textContent = '墨淌出字外。空白要贴着淡影围死。';
      }
      ovOps.textContent = '成 ' + Math.round(coverage() * 100) + '% · 字外 ' + leakCount + ' 格';
      ovBtn.textContent = '重洇本帖';
    }
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function renderHud() {
    if (mode === 'title') {
      stageLabel.textContent = '宣纸待墨';
      fillLabel.textContent = '成 —';
      leakLabel.textContent = '洇 —';
      blankLabel.textContent = '空白 —';
      fillLabel.classList.remove('hot');
      leakLabel.classList.remove('warn');
      blankLabel.classList.remove('warn');
      hintEl.textContent = '墨会扩散，用空白把它堵成字';
      hintEl.className = 'hint';
      hudDirty = false;
      lastFillShown = -1;
      lastLeakShown = -1;
      lastBlankShown = -1;
      return;
    }
    const st = STAGES[stageIndex];
    const cov = coverage();
    const covPct = Math.round(cov * 100);
    stageLabel.textContent = (stageIndex + 1) + ' / ' + STAGES.length + '　' + st.name + ' · ' + st.sub;
    if (covPct !== lastFillShown) {
      fillLabel.textContent = '成 ' + covPct + '%';
      lastFillShown = covPct;
    }
    if (leakCount !== lastLeakShown) {
      leakLabel.textContent = '洇 ' + leakCount;
      lastLeakShown = leakCount;
    }
    if (blankLeft !== lastBlankShown) {
      blankLabel.textContent = '空白 ' + blankLeft;
      lastBlankShown = blankLeft;
    }
    fillLabel.classList.toggle('hot', cov >= WIN_COVER);
    leakLabel.classList.toggle('warn', leakCount >= 3);
    blankLabel.classList.toggle('warn', blankLeft <= 8);
    if (ending) {
      hintEl.textContent = ending === 'win' ? '墨定了' : '这一帖洇开了';
      hintEl.className = 'hint ' + (ending === 'win' ? 'hot' : 'warn');
    } else if (mode === 'play' && time < bleedAt) {
      hintEl.textContent = '趁还没洇，先围一圈';
      hintEl.className = 'hint hot';
    } else {
      hintEl.textContent = st.hint;
      hintEl.className = leakCount >= 3 ? 'hint warn' : 'hint';
    }
    hudDirty = false;
  }

  function startStage(i) {
    stageIndex = i;
    const st = STAGES[i];
    parseStage(st);
    blankLeft = st.blank;
    blankMax = st.blank;
    delay = st.delay;
    rate = st.rate;
    time = 0;
    acc = 0;
    settledFor = 0;
    ending = null;
    endT = 0;
    bleedSaid = false;
    prevLeak = 0;
    shake = 0;
    fillCount = 0;
    leakCount = 0;
    lastFillShown = -1;
    lastLeakShown = -1;
    lastBlankShown = -1;
    painting = false;
    lastPC = -1;
    lastPR = -1;
    keyWait = 0;
    firstKey = true;
    inputLock = LOCK;
    bleedAt = 0.62 + delay;
    mode = 'play';
    hideOverlay();
    toast('先下空白');
    hudDirty = true;
    renderHud();
    canvas.focus();
  }

  function landDrop(d) {
    d.landed = true;
    const i = idx(d.c, d.r);
    if (cell[i] === RESIST) {
      toast('空白接住一滴', true);
      audio.deny();
      const p = cellCenter(d.c, d.r);
      burst(p.x, p.y, '255, 61, 184', 10, 70 * view.dpr, 0.35);
      return;
    }
    inkCell(d.c, d.r, true);
    soak[i] = 1;
    audio.drip();
    shake = Math.max(shake, 3.2);
    if (d.start > 0.2) toast('第二滴');
  }

  function moveCursor(dc, dr) {
    const nc = clamp(cursorC + dc, 0, COLS - 1);
    const nr = clamp(cursorR + dr, 0, ROWS - 1);
    if (nc === cursorC && nr === cursorR) return;
    cursorC = nc;
    cursorR = nr;
    if (keys[' '] || keys.space) paintCell(cursorC, cursorR);
  }

  function keyDir() {
    let dx = 0;
    let dy = 0;
    if (keys.a || keys.arrowleft) dx -= 1;
    if (keys.d || keys.arrowright) dx += 1;
    if (keys.w || keys.arrowup) dy -= 1;
    if (keys.s || keys.arrowdown) dy += 1;
    return { dx: dx, dy: dy };
  }

  function update(dt) {
    time += dt;
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add('hidden');
    }
    if (shake > 0) shake = Math.max(0, shake - dt * 18);
    if (inputLock > 0) inputLock -= dt;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t >= sparks[i].life) sparks.splice(i, 1);
    }

    if (mode !== 'play') return;

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      if (d.landed) continue;
      if (time >= d.start + d.dur) landDrop(d);
    }

    if (!ending) {
      const dir = keyDir();
      if (dir.dx || dir.dy) {
        if (firstKey) {
          moveCursor(dir.dx, dir.dy);
          firstKey = false;
          keyWait = MOVE_EVERY * 1.6;
        } else {
          keyWait -= dt;
          if (keyWait <= 0) {
            moveCursor(dir.dx, dir.dy);
            keyWait = MOVE_EVERY;
          }
        }
      } else {
        firstKey = true;
        keyWait = 0;
      }
    }

    if (ending) {
      endT += dt;
      if (endT >= (ending === 'win' ? 0.62 : 0.55)) {
        if (ending === 'win') {
          if (stageIndex >= STAGES.length - 1) showOverlay('winall');
          else showOverlay('win');
        } else {
          showOverlay('lose', ending);
        }
      }
      return;
    }

    const bleeding = time >= bleedAt;
    if (bleeding && !bleedSaid) {
      bleedSaid = true;
      toast('墨开始洇了', true);
    }

    if (bleeding) {
      addSoak.fill(0);
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = idx(c, r);
          if (cell[i] !== INK) continue;
          age[i] += dt;
          const organic = 0.62 + 0.78 * nhash(c, r, (time * 4) | 0);
          const flow = rate * dt * organic;
          for (let d = 0; d < 4; d++) {
            const nc = c + DIRS[d][0];
            const nr = r + DIRS[d][1];
            if (!inb(nc, nr)) continue;
            const j = idx(nc, nr);
            if (cell[j] !== EMPTY) continue;
            addSoak[j] += flow;
          }
        }
      }
      let grew = 0;
      for (let i = 0; i < N; i++) {
        if (cell[i] !== EMPTY || addSoak[i] <= 0) continue;
        soak[i] += addSoak[i];
        if (soak[i] >= 1) {
          const c = i % COLS;
          const r = (i / COLS) | 0;
          if (inkCell(c, r, false)) grew++;
        }
      }
      if (grew > 0 && leakCount >= 2) shake = Math.max(shake, 1.2);
    }

    countInk();
    if (leakCount > prevLeak) {
      audio.leak();
      if (leakCount === 1) toast('在漏', true);
    }
    prevLeak = leakCount;
    hudDirty = true;

    if (inkOnEdge()) {
      beginEnd('edge', 'edge');
      return;
    }
    if (leakCount >= leakLimit()) {
      beginEnd('leak', 'leak');
      return;
    }

    if (bleeding && !openFrontier()) {
      settledFor += dt;
      if (settledFor >= SETTLE) {
        if (coverage() >= WIN_COVER && leakCount <= winLeakMax()) beginEnd('win');
        else beginEnd('cover', 'cover');
      }
    } else {
      settledFor = 0;
    }
  }

  function drawDrop(d) {
    if (d.landed) return;
    if (time < d.start) return;
    const t = clamp((time - d.start) / d.dur, 0, 1);
    const dest = cellCenter(d.c, d.r);
    const y0 = view.oy - view.cell * 1.4;
    const y = lerp(y0, dest.y, smooth(t));
    const s = view.cell;
    const wob = Math.sin(time * 18 + d.c) * s * 0.04 * (1 - t);
    const grd = ctx.createRadialGradient(dest.x + wob, y, 1, dest.x + wob, y, s * 0.42);
    grd.addColorStop(0, 'rgba(255, 227, 107, 0.95)');
    grd.addColorStop(0.35, 'rgba(255, 61, 184, 0.9)');
    grd.addColorStop(1, 'rgba(80, 10, 40, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(dest.x + wob, y, s * 0.22, s * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(dest.x + wob - s * 0.06, y - s * 0.08, s * 0.07, 0, TAU);
    ctx.fill();
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const s = view.cell;
    const ox = view.ox + (Math.random() - 0.5) * shake * view.dpr * 0.35;
    const oy = view.oy + (Math.random() - 0.5) * shake * view.dpr * 0.35;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (paper) ctx.drawImage(paper, 0, 0);
    else {
      ctx.fillStyle = '#05030c';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.save();
    ctx.translate(ox - view.ox, oy - view.oy);

    ctx.fillStyle = 'rgba(12, 8, 22, 0.72)';
    ctx.fillRect(view.ox, view.oy, view.gw, view.gh);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.lineWidth = Math.max(1, view.dpr);
    ctx.strokeRect(view.ox + 0.5, view.oy + 0.5, view.gw - 1, view.gh - 1);
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.12)';
    ctx.strokeRect(view.ox - 4, view.oy - 4, view.gw + 8, view.gh + 8);

    const pulse = 0.5 + 0.5 * Math.sin(time * 2.4);
    const delayPhase = mode === 'play' && time < bleedAt;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(c, r);
        const x = view.ox + c * s;
        const y = view.oy + r * s;
        if (hole[i]) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.fillRect(x, y, s, s);
        }
        if (target[i] && cell[i] !== INK) {
          const a = delayPhase ? 0.16 + pulse * 0.14 : 0.11 + pulse * 0.06;
          ctx.fillStyle = 'rgba(0, 240, 255,' + a + ')';
          ctx.fillRect(x - 0.5, y - 0.5, s + 1, s + 1);
        }
      }
    }

    ctx.strokeStyle = 'rgba(0, 240, 255,' + (delayPhase ? 0.38 + pulse * 0.22 : 0.16) + ')';
    ctx.lineWidth = Math.max(1.2, s * 0.07);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(c, r);
        if (!target[i]) continue;
        const x = view.ox + c * s;
        const y = view.oy + r * s;
        if (c === 0 || !target[idx(c - 1, r)]) {
          ctx.moveTo(x + 0.5, y);
          ctx.lineTo(x + 0.5, y + s);
        }
        if (c === COLS - 1 || !target[idx(c + 1, r)]) {
          ctx.moveTo(x + s - 0.5, y);
          ctx.lineTo(x + s - 0.5, y + s);
        }
        if (r === 0 || !target[idx(c, r - 1)]) {
          ctx.moveTo(x, y + 0.5);
          ctx.lineTo(x + s, y + 0.5);
        }
        if (r === ROWS - 1 || !target[idx(c, r + 1)]) {
          ctx.moveTo(x, y + s - 0.5);
          ctx.lineTo(x + s, y + s - 0.5);
        }
      }
    }
    ctx.stroke();

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(c, r);
        if (cell[i] !== EMPTY || soak[i] < 0.05) continue;
        const x = view.ox + (c + 0.5) * s;
        const y = view.oy + (r + 0.5) * s;
        const rad = s * (0.18 + 0.38 * clamp(soak[i], 0, 1));
        ctx.fillStyle = 'rgba(255, 61, 184,' + (0.12 + soak[i] * 0.28) + ')';
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, TAU);
        ctx.fill();
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(c, r);
        if (cell[i] !== RESIST) continue;
        const x = view.ox + c * s;
        const y = view.oy + r * s;
        const pad = s * 0.12;
        ctx.fillStyle = 'rgba(228, 236, 255, 0.88)';
        roundRect(ctx, x + pad, y + pad, s - pad * 2, s - pad * 2, s * 0.16);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
        ctx.lineWidth = Math.max(1, s * 0.05);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.fillRect(x + pad + 1, y + pad + 1, (s - pad * 2) * 0.4, Math.max(1, s * 0.08));
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(c, r);
        if (cell[i] !== INK) continue;
        const x = view.ox + (c + 0.5) * s;
        const y = view.oy + (r + 0.5) * s;
        const leak = !target[i];
        const wob = 0.92 + 0.08 * nhash(c, r, 3);
        const rad = s * 0.62 * wob;
        const g = ctx.createRadialGradient(x - rad * 0.2, y - rad * 0.22, rad * 0.08, x, y, rad);
        if (ending === 'win' && target[i]) {
          const flash = 0.35 + 0.65 * Math.sin(endT * 14);
          g.addColorStop(0, 'rgba(255, 227, 107, 0.95)');
          g.addColorStop(0.35, 'rgba(0, 240, 255,' + (0.75 + flash * 0.2) + ')');
          g.addColorStop(1, 'rgba(255, 61, 184, 0.05)');
        } else if (leak) {
          g.addColorStop(0, 'rgba(255, 180, 220, 0.95)');
          g.addColorStop(0.4, 'rgba(255, 61, 184, 0.9)');
          g.addColorStop(1, 'rgba(90, 8, 40, 0.05)');
        } else {
          g.addColorStop(0, 'rgba(255, 120, 190, 0.95)');
          g.addColorStop(0.32, 'rgba(190, 30, 110, 0.92)');
          g.addColorStop(0.72, 'rgba(40, 6, 24, 0.88)');
          g.addColorStop(1, 'rgba(10, 2, 8, 0)');
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, TAU);
        ctx.fill();

        let open = false;
        for (let d = 0; d < 4; d++) {
          const nc = c + DIRS[d][0];
          const nr = r + DIRS[d][1];
          if (!inb(nc, nr) || cell[idx(nc, nr)] === EMPTY) open = true;
        }
        if (open) {
          ctx.strokeStyle = leak
            ? 'rgba(255, 61, 184, 0.55)'
            : 'rgba(0, 240, 255, 0.35)';
          ctx.lineWidth = Math.max(1, s * 0.06);
          ctx.beginPath();
          ctx.arc(x, y, s * 0.38, 0, TAU);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < drops.length; i++) drawDrop(drops[i]);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = 1 - p.t / p.life;
      ctx.fillStyle = 'rgba(' + p.rgb + ',' + a + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * view.dpr, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      const a = 1 - sp.t / sp.life;
      ctx.fillStyle = 'rgba(255, 227, 107,' + a + ')';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, (2 + a * 3) * view.dpr, 0, TAU);
      ctx.fill();
    }

    if (mode === 'play' && !ending) {
      const x = view.ox + cursorC * s;
      const y = view.oy + cursorR * s;
      ctx.strokeStyle = painting ? 'rgba(255, 61, 184, 0.9)' : 'rgba(0, 240, 255, 0.85)';
      ctx.lineWidth = Math.max(1.4, s * 0.08);
      roundRect(ctx, x + 2, y + 2, s - 4, s - 4, s * 0.18);
      ctx.stroke();
      const frac = blankMax ? blankLeft / blankMax : 0;
      ctx.beginPath();
      ctx.strokeStyle = frac < 0.18 ? 'rgba(255, 61, 184, 0.9)' : 'rgba(255, 227, 107, 0.8)';
      ctx.lineWidth = Math.max(1.5, s * 0.07);
      ctx.arc(x + s * 0.5, y + s * 0.5, s * 0.28, -Math.PI / 2, -Math.PI / 2 + TAU * frac);
      ctx.stroke();
    }

    ctx.restore();

    if (hudDirty) renderHud();
  }

  function roundRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  let lastTs = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.05) dt = 0.05;
    if (document.hidden) return;
    resize();
    if (mode === 'play') {
      acc += dt;
      if (acc > 0.2) acc = 0.2;
      while (acc >= STEP) {
        update(STEP);
        acc -= STEP;
      }
    } else {
      time += dt;
      if (toastT > 0) {
        toastT -= dt;
        if (toastT <= 0) toastEl.classList.add('hidden');
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.t >= p.life) particles.splice(i, 1);
      }
    }
    draw();
  }

  function onMain() {
    audio.ensure();
    if (mode === 'title' || mode === 'lose') {
      startStage(stageIndex);
      return;
    }
    if (mode === 'win') {
      if (stageIndex >= STAGES.length - 1) startStage(0);
      else startStage(stageIndex + 1);
    }
  }

  function retry() {
    audio.ensure();
    if (mode === 'title') return;
    if (mode === 'win' && stageIndex >= STAGES.length - 1) startStage(0);
    else startStage(stageIndex);
  }

  ovBtn.addEventListener('click', onMain);
  btnRetry.addEventListener('click', retry);
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  }

  window.addEventListener('keydown', function (e) {
    if (e.repeat && (e.key === 'm' || e.key === 'M' || e.key === 'r' || e.key === 'R')) return;
    if (isTypingTarget(e.target)) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    if (k === 'm') {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r') {
      e.preventDefault();
      retry();
      return;
    }
    if (k === 'enter') {
      e.preventDefault();
      if (mode !== 'play') onMain();
      return;
    }
    if (k === ' ' || k === 'spacebar') {
      e.preventDefault();
      keys[' '] = true;
      keys.space = true;
      if (mode !== 'play') {
        onMain();
        return;
      }
      if (inputLock <= 0 && !ending) paintCell(cursorC, cursorR);
      return;
    }
    if (k === 'w' || k === 'a' || k === 's' || k === 'd' ||
        k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright') {
      e.preventDefault();
      keys[k] = true;
    }
  });

  window.addEventListener('keyup', function (e) {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    keys[k] = false;
    if (k === ' ' || k === 'spacebar') {
      keys[' '] = false;
      keys.space = false;
    }
  });

  function pointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (mode !== 'play' || ending) return;
    if (inputLock > 0) return;
    audio.ensure();
    const p = eventCell(e);
    pointerOn = true;
    painting = true;
    if (inb(p.c, p.r)) {
      cursorC = p.c;
      cursorR = p.r;
      paintCell(p.c, p.r);
      lastPC = p.c;
      lastPR = p.r;
    }
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }
    e.preventDefault();
  }

  function pointerMove(e) {
    const p = eventCell(e);
    if (inb(p.c, p.r)) {
      cursorC = p.c;
      cursorR = p.r;
      pointerOn = true;
    }
    if (!painting || mode !== 'play' || ending) return;
    if (inb(p.c, p.r) && lastPC >= 0) paintLine(lastPC, lastPR, p.c, p.r);
    else if (inb(p.c, p.r)) paintCell(p.c, p.r);
    if (inb(p.c, p.r)) {
      lastPC = p.c;
      lastPR = p.r;
    }
  }

  function pointerUp(e) {
    painting = false;
    lastPC = -1;
    lastPR = -1;
    if (e && e.pointerId != null) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (err) { /* ignore */ }
    }
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('pointerleave', function () {
    pointerOn = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  overlay.addEventListener('pointerdown', function (e) {
    if (e.target === ovBtn) return;
    e.stopPropagation();
  });

  window.addEventListener('blur', function () {
    painting = false;
    for (const k in keys) keys[k] = false;
  });

  showOverlay('title');
  resize();
  renderHud();
  requestAnimationFrame(frame);
})();
