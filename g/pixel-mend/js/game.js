'use strict';

(function () {
  const GOAL = 5;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const PEEL = 0.52;
  const OUTRO = 0.7;
  const PENALTY = 1.2;
  const MOVE = 280;
  const MUTE_KEY = 'playbox-pixel-mend-mute';

  const CH = {
    '.': 0,
    d: 1,
    u: 2,
    p: 3,
    c: 4,
    w: 5,
    g: 6,
    k: 7,
    m: 8
  };

  const RGB = [
    [0, 0, 0],
    [26, 14, 50],
    [74, 36, 128],
    [255, 61, 184],
    [0, 240, 255],
    [246, 243, 255],
    [255, 227, 107],
    [12, 90, 102],
    [122, 26, 88]
  ];

  const STAGES = [
    {
      name: '灯芯',
      sub: 'WICK',
      hint: '拖回缺口。近了会吸住。',
      time: 20,
      holes: [
        { x: 2, y: 1, w: 4, h: 2 },
        { x: 2, y: 6, w: 4, h: 2 }
      ],
      map: [
        '........',
        '...gg...',
        '..gwwg..',
        '...wp...',
        '...ww...',
        '...uu...',
        '..kkkk..',
        '...kk...'
      ]
    },
    {
      name: '心核',
      sub: 'CORE',
      hint: '两瓣很像，看缺口朝向',
      time: 18,
      holes: [
        { x: 1, y: 1, w: 3, h: 2 },
        { x: 7, y: 1, w: 3, h: 2 },
        { x: 4, y: 8, w: 3, h: 2 }
      ],
      map: [
        '...........',
        '..pp...pp..',
        '.pwwp.pwwp.',
        '.pwwwpwwwp.',
        '.pwwwwwwwp.',
        '.pwcwwwcwp.',
        '..pwwwwwp..',
        '...pwwwp...',
        '....pwp....',
        '.....p.....'
      ]
    },
    {
      name: '游鱼',
      sub: 'KOI',
      hint: '金眼归腹，粉鳍归尾',
      time: 16,
      holes: [
        { x: 1, y: 3, w: 2, h: 3 },
        { x: 5, y: 2, w: 2, h: 2 },
        { x: 10, y: 2, w: 2, h: 1 },
        { x: 9, y: 6, w: 2, h: 2 }
      ],
      map: [
        '..............',
        '....cccc......',
        '...cwwwwc.pp..',
        '.ccwwgwwwccc..',
        '.cwwwwwwwcc...',
        '.kcwwwwwc.....',
        '..kccccc.kk...',
        '....cc...k....',
        '..............'
      ]
    },
    {
      name: '城阙',
      sub: 'GATE',
      hint: '金顶、灯笼、窗、柱，各归其位',
      time: 15,
      holes: [
        { x: 4, y: 1, w: 4, h: 2 },
        { x: 3, y: 4, w: 2, h: 2 },
        { x: 7, y: 4, w: 2, h: 2 },
        { x: 4, y: 7, w: 4, h: 2 },
        { x: 8, y: 9, w: 3, h: 3 }
      ],
      map: [
        '............',
        '....gggg....',
        '...gwwwwg...',
        '..gwwwwwwg..',
        '...uuuuuu...',
        '...p....p...',
        '..uwwwwwwu..',
        '..uwcwwcwu..',
        '..uwwwwwwu..',
        '..uu....uu..',
        '..uu....uu..',
        '.kkkkkkkkkk.'
      ]
    },
    {
      name: '星舰',
      sub: 'SHIP',
      hint: '舰首、金核、两翼、双推',
      time: 16,
      holes: [
        { x: 5, y: 1, w: 4, h: 2 },
        { x: 5, y: 4, w: 4, h: 1 },
        { x: 0, y: 6, w: 2, h: 2 },
        { x: 12, y: 6, w: 2, h: 2 },
        { x: 3, y: 9, w: 2, h: 2 },
        { x: 9, y: 9, w: 2, h: 2 }
      ],
      map: [
        '..............',
        '......cc......',
        '.....cwwc.....',
        '....cwwwwc....',
        '....cggggc....',
        '..cwwwwwwwwc..',
        '.pcwwwwwwwwcp.',
        '.p.kwwwwwwk.p.',
        '....kkkkkk....',
        '...kk....kk...',
        '..p.k....k.p..',
        '..............'
      ]
    }
  ];

  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d', { alpha: false });
  const hud = document.getElementById('hud');
  const hintEl = document.getElementById('hint');
  const roundEl = document.getElementById('round');
  const holesEl = document.getElementById('holes');
  const timeEl = document.getElementById('time');
  const holesRead = holesEl.parentElement;
  const timeRead = timeEl.parentElement;
  const pipsEl = document.getElementById('pips');
  const pipNodes = pipsEl.querySelectorAll('i');
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
  const btnSnap = document.getElementById('btn-snap');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  let W = 1;
  let H = 1;
  let dpr = 1;
  const L = {
    portrait: false,
    cell: 24,
    bx: 0,
    by: 0,
    bw: 200,
    bh: 200,
    sw: 8,
    sh: 8,
    trayX: 0,
    trayY: 0,
    trayW: 200,
    trayH: 80,
    pad: 14
  };

  const keys = { l: false, r: false, u: false, d: false };
  const ptr = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    ox: 0,
    oy: 0,
    shard: -1,
    moved: 0
  };

  const particles = [];
  const motes = [];
  const stars = [];
  const sparks = [];
  const cracks = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    round: 0,
    lives: LIVES,
    remain: 20,
    peel: 0,
    outro: 0,
    shake: 0,
    flash: 0,
    gold: 0,
    paused: false,
    seed: 1,
    rand: Math.random,
    stage: null,
    grid: null,
    shards: [],
    selected: 0,
    magnet: -1,
    nearWrong: -1,
    lock: 0,
    mended: 0,
    result: '',
    taught: false
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function easeOut(t) {
    t = clamp(t, 0, 1);
    return 1 - (1 - t) * (1 - t);
  }
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rng(seed) {
    let s = seed % 2147483646;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  function rgba(c, a) {
    if (a == null || a >= 0.999) return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function lift(c, t) {
    return [
      (mix(c[0], 255, t) + 0.5) | 0,
      (mix(c[1], 255, t) + 0.5) | 0,
      (mix(c[2], 255, t) + 0.5) | 0
    ];
  }
  function shade(c, t) {
    return [(c[0] * t) | 0, (c[1] * t) | 0, (c[2] * t) | 0];
  }

  function parseMap(rows) {
    const h = rows.length;
    const w = rows[0].length;
    const grid = [];
    for (let y = 0; y < h; y++) {
      const line = rows[y];
      if (line.length !== w) throw new Error('ragged map');
      const row = [];
      for (let x = 0; x < w; x++) {
        const ch = line.charAt(x);
        const v = CH[ch];
        if (v == null) throw new Error('bad cell ' + ch);
        row.push(v);
      }
      grid.push(row);
    }
    return { w: w, h: h, grid: grid };
  }

  function extractShard(grid, hole, used) {
    const cells = [];
    let minX = 99;
    let minY = 99;
    let maxX = 0;
    let maxY = 0;
    for (let y = hole.y; y < hole.y + hole.h; y++) {
      for (let x = hole.x; x < hole.x + hole.w; x++) {
        if (y < 0 || x < 0 || y >= grid.length || x >= grid[0].length) continue;
        const c = grid[y][x];
        if (!c) continue;
        const key = y * 64 + x;
        if (used[key]) continue;
        used[key] = 1;
        cells.push({ x: x, y: y, c: c });
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (!cells.length) return null;
    return {
      cells: cells,
      ox: minX,
      oy: minY,
      bw: maxX - minX + 1,
      bh: maxY - minY + 1,
      px: 0,
      py: 0,
      parkX: 0,
      parkY: 0,
      placed: false,
      lift: 0,
      shake: 0,
      bob: Math.random() * TAU
    };
  }

  function buildStage(def) {
    const parsed = parseMap(def.map);
    const used = {};
    const shards = [];
    for (let i = 0; i < def.holes.length; i++) {
      const sh = extractShard(parsed.grid, def.holes[i], used);
      if (sh) {
        sh.id = shards.length;
        shards.push(sh);
      }
    }
    const missing = {};
    for (let i = 0; i < shards.length; i++) {
      const cells = shards[i].cells;
      for (let k = 0; k < cells.length; k++) {
        missing[cells[k].y * 64 + cells[k].x] = shards[i].id;
      }
    }
    return {
      name: def.name,
      sub: def.sub,
      hint: def.hint,
      time: def.time,
      w: parsed.w,
      h: parsed.h,
      grid: parsed.grid,
      shards: shards,
      missing: missing
    };
  }

  const PREPPED = STAGES.map(buildStage);

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    lastTick: -9,
    lastMag: -9,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.22;
      btnMute.textContent = m ? '静' : '音';
      btnMute.classList.toggle('muted', m);
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
      o.stop(t + dur + 0.02);
    },
    noise: function (dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = 1024;
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.value = 1400;
      src.buffer = buf;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      const t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    pulse: function (kind) {
      this.ensure();
      if (kind === 'start') {
        this.beep(220, 0.14, 'sine', 0.07, 440);
        this.beep(330, 0.22, 'triangle', 0.05, 660);
        this.noise(0.08, 0.04);
      } else if (kind === 'grab') {
        this.beep(520, 0.05, 'triangle', 0.045, 740);
      } else if (kind === 'magnet') {
        this.beep(700, 0.05, 'sine', 0.03, 980);
      } else if (kind === 'snap') {
        this.beep(392, 0.1, 'triangle', 0.08, 784);
        this.beep(523, 0.16, 'sine', 0.06, 1046);
        this.noise(0.04, 0.03);
      } else if (kind === 'miss') {
        this.beep(160, 0.16, 'sawtooth', 0.055, 70);
        this.beep(90, 0.24, 'square', 0.035, 50);
      } else if (kind === 'soft') {
        this.beep(240, 0.08, 'sine', 0.03, 180);
      } else if (kind === 'clear') {
        this.beep(523, 0.14, 'triangle', 0.09, 784);
        this.beep(659, 0.22, 'sine', 0.07, 988);
        this.beep(784, 0.32, 'sine', 0.05, 1175);
      } else if (kind === 'win') {
        this.beep(523, 0.18, 'triangle', 0.1, 784);
        this.beep(659, 0.28, 'sine', 0.08, 988);
        this.beep(784, 0.45, 'sine', 0.07, 1175);
      } else if (kind === 'lose') {
        this.beep(196, 0.4, 'sawtooth', 0.08, 80);
        this.beep(110, 0.7, 'triangle', 0.06, 40);
        this.noise(0.3, 0.05);
      } else if (kind === 'tick') {
        this.beep(880, 0.04, 'sine', 0.03, 1320);
      } else if (kind === 'cycle') {
        this.beep(480, 0.04, 'triangle', 0.03, 560);
      }
    },
    tickDrone: function (filled, total) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 52;
        g.gain.value = 0.016;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const p = total ? filled / total : 0;
      this.drone.frequency.setTargetAtTime(50 + p * 38, t, 0.14);
      this.droneGain.gain.setTargetAtTime(0.014 + p * 0.02, t, 0.14);
    },
    stopDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
  };

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.25 + 0.22,
        a: Math.random() * 0.4 + 0.05,
        p: Math.random() * TAU
      });
    }
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 22; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        a: 0.07 + Math.random() * 0.12,
        p: Math.random() * TAU,
        r: 0.7 + Math.random() * 1.5,
        c: Math.random() < 0.5 ? 'cyan' : 'pink'
      });
    }
  }

  function burst(x, y, n, hue) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = 40 + Math.random() * 240;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        g: 40 + Math.random() * 50,
        life: 0.4 + Math.random() * 0.55,
        r: 1.2 + Math.random() * 2.6,
        hue: hue
      });
    }
  }

  function sparkle(x, y) {
    sparks.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 16,
      life: 0.22 + Math.random() * 0.28,
      r: 0.9 + Math.random() * 1.5
    });
  }

  function holePos(s) {
    return [L.bx + s.ox * L.cell, L.by + s.oy * L.cell];
  }

  function looseList() {
    const out = [];
    const shards = G.shards;
    for (let i = 0; i < shards.length; i++) {
      if (!shards[i].placed) out.push(i);
    }
    return out;
  }

  function selectLoose(dir) {
    const loose = looseList();
    if (!loose.length) return;
    let idx = loose.indexOf(G.selected);
    if (idx < 0) idx = 0;
    else idx = (idx + dir + loose.length) % loose.length;
    G.selected = loose[idx];
    audio.pulse('cycle');
  }

  function ensureSelected() {
    const shards = G.shards;
    if (!shards.length) return;
    if (shards[G.selected] && !shards[G.selected].placed) return;
    for (let i = 0; i < shards.length; i++) {
      if (!shards[i].placed) {
        G.selected = i;
        return;
      }
    }
  }

  function layoutParking() {
    const shards = G.shards;
    const n = shards.length;
    if (!n) return;
    const cell = L.cell;
    const gap = Math.max(10, cell * 0.45);
    const sizes = [];
    let maxW = cell * 2;
    let maxH = cell * 2;
    for (let i = 0; i < n; i++) {
      const w = shards[i].bw * cell;
      const h = shards[i].bh * cell;
      sizes.push({ w: w, h: h });
      if (w > maxW) maxW = w;
      if (h > maxH) maxH = h;
    }

    if (L.portrait) {
      const rowW = L.trayW;
      let x = L.trayX;
      let y = L.trayY;
      let rowH = 0;
      for (let i = 0; i < n; i++) {
        const w = sizes[i].w;
        const h = sizes[i].h;
        if (i > 0 && x + w > L.trayX + rowW) {
          x = L.trayX;
          y += rowH + gap;
          rowH = 0;
        }
        shards[i].parkX = x;
        shards[i].parkY = y;
        x += w + gap;
        if (h > rowH) rowH = h;
      }
    } else {
      const colW = L.trayW;
      let x = L.trayX;
      let y = L.trayY;
      const colGap = gap;
      for (let i = 0; i < n; i++) {
        const w = sizes[i].w;
        const h = sizes[i].h;
        if (i > 0 && y + h > L.trayY + L.trayH) {
          x += maxW + colGap;
          y = L.trayY;
        }
        if (x + w > L.trayX + colW) {
          x = L.trayX;
        }
        shards[i].parkX = x + (maxW - w) * 0.15;
        shards[i].parkY = y;
        y += h + gap;
      }
    }
  }

  function layout() {
    const st = G.stage;
    if (!st) return;
    L.portrait = H > W * 1.08;
    L.sw = st.w;
    L.sh = st.h;
    const hudTop = 78;
    const hudBot = 52;
    const playH = Math.max(160, H - hudTop - hudBot);
    if (L.portrait) {
      const trayH = clamp(playH * 0.3, 108, 168);
      const boardH = playH - trayH - 18;
      L.cell = clamp(Math.min((W * 0.78) / st.w, (boardH * 0.84) / st.h), 13, 40);
      L.bw = L.cell * st.w;
      L.bh = L.cell * st.h;
      L.pad = Math.max(12, L.cell * 0.55);
      L.bx = (W - L.bw) * 0.5;
      L.by = hudTop + Math.max(8, (boardH - L.bh - L.pad) * 0.38);
      L.trayX = 18;
      L.trayY = L.by + L.bh + L.pad + 38;
      L.trayW = W - 36;
      L.trayH = Math.max(80, H - L.trayY - hudBot + 8);
    } else {
      const trayW = clamp(W * 0.26, 150, 240);
      L.cell = clamp(Math.min(((W - trayW - 72) * 0.84) / st.w, (playH * 0.8) / st.h), 13, 44);
      L.bw = L.cell * st.w;
      L.bh = L.cell * st.h;
      L.pad = Math.max(12, L.cell * 0.55);
      L.bx = Math.max(28, (W - trayW - L.bw - L.pad) * 0.42);
      L.by = hudTop + Math.max(8, (playH - L.bh) * 0.38);
      L.trayX = L.bx + L.bw + L.pad + 52;
      L.trayY = L.by;
      L.trayW = Math.max(120, Math.min(trayW, W - L.trayX - 20));
      L.trayH = Math.max(L.bh, 120);
    }
    L.pad = Math.max(12, L.cell * 0.55);
    layoutParking();
    const shards = G.shards;
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      if (s.placed) {
        const hp = holePos(s);
        s.px = hp[0];
        s.py = hp[1];
      } else if (ptr.shard !== i && G.peel <= 0 && G.mode !== 'title') {
        /* keep current px/py */
      } else if (G.mode === 'title' || G.peel > 0) {
        /* animated elsewhere */
      }
    }
  }

  function setupRound(index) {
    const base = PREPPED[index];
    const shards = [];
    for (let i = 0; i < base.shards.length; i++) {
      const src = base.shards[i];
      const cells = [];
      for (let k = 0; k < src.cells.length; k++) {
        const c = src.cells[k];
        cells.push({ x: c.x, y: c.y, c: c.c });
      }
      shards.push({
        id: src.id,
        cells: cells,
        ox: src.ox,
        oy: src.oy,
        bw: src.bw,
        bh: src.bh,
        px: 0,
        py: 0,
        parkX: 0,
        parkY: 0,
        placed: false,
        lift: 0,
        shake: 0,
        bob: G.rand() * TAU
      });
    }
    G.stage = {
      name: base.name,
      sub: base.sub,
      hint: base.hint,
      time: base.time,
      w: base.w,
      h: base.h,
      grid: base.grid,
      missing: base.missing
    };
    G.shards = shards;
    G.round = index;
    G.selected = 0;
    G.magnet = -1;
    G.nearWrong = -1;
    G.peel = G.mode === 'play' ? PEEL : 0;
    G.outro = 0;
    G.lock = 0.08;
    G.remain = base.time;
    layout();
    for (let i = 0; i < shards.length; i++) {
      const hp = holePos(shards[i]);
      shards[i].px = hp[0];
      shards[i].py = hp[1];
    }
    cracks.length = 0;
    for (let i = 0; i < 5; i++) {
      cracks.push({
        x: G.rand(),
        y: 0.15 + G.rand() * 0.7,
        w: 0.08 + G.rand() * 0.18,
        a: G.rand() * TAU
      });
    }
  }

  function hidePanel() {
    panel.classList.add('hidden');
  }

  function showPanel() {
    panel.classList.remove('hidden');
    card.classList.remove('win', 'lose');
    if (G.mode === 'title') {
      kickerEl.textContent = 'MEND';
      titleEl.textContent = '补像素';
      leadEl.textContent = '图块碎了。把它们拖回原来的缺口。';
      metaEl.textContent = '五幅霓虹图。近了会吸住；放错会弹开并扣命。时尽或三命用完即负。';
      btnMain.textContent = '开补';
      footEl.textContent = '拖动图块 · Q/E 选块 · WASD 移动 · 空格放入 · M 静音';
    } else if (G.mode === 'win') {
      card.classList.add('win');
      kickerEl.textContent = 'MENDED';
      titleEl.textContent = '补全';
      leadEl.textContent = '五幅碎图重新咬合。';
      metaEl.textContent = '剩余 ' + G.remain.toFixed(1) + ' 秒 · 命 ' + G.lives;
      btnMain.textContent = '再补一回';
      footEl.textContent = '空格 / 回车 · R 重开';
    } else {
      card.classList.add('lose');
      kickerEl.textContent = 'SHATTERED';
      titleEl.textContent = '碎裂';
      leadEl.textContent = G.result === 'time' ? '时限到了，缺口没能补上。' : '命用尽，图块弹开碎掉。';
      metaEl.textContent = '已补 ' + G.mended + ' / ' + GOAL;
      btnMain.textContent = '再试一次';
      footEl.textContent = '空格 / 回车 · R 重开';
    }
  }

  function startGame() {
    audio.ensure();
    audio.pulse('start');
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.lives = LIVES;
    G.mended = 0;
    G.shake = 0;
    G.flash = 0;
    G.gold = 0;
    G.paused = false;
    G.taught = false;
    G.result = '';
    G.seed = (Date.now() % 2147483646) || 1;
    G.rand = rng(G.seed);
    setupRound(0);
    hidePanel();
    hud.classList.remove('hidden');
  }

  function endGame(win) {
    G.mode = win ? 'win' : 'lose';
    G.peel = 0;
    G.outro = 0;
    audio.stopDrone();
    audio.pulse(win ? 'win' : 'lose');
    if (win) {
      burst(L.bx + L.bw * 0.5, L.by + L.bh * 0.5, 52, 'cyan');
      burst(L.bx + L.bw * 0.5, L.by + L.bh * 0.4, 28, 'gold');
    } else {
      G.flash = 1;
      G.shake = 12;
      burst(L.bx + L.bw * 0.5, L.by + L.bh * 0.5, 30, 'pink');
    }
    hud.classList.add('hidden');
    showPanel();
  }

  function shardCenter(s) {
    return [s.px + s.bw * L.cell * 0.5, s.py + s.bh * L.cell * 0.5];
  }

  function holeCenter(s) {
    return [
      L.bx + (s.ox + s.bw * 0.5) * L.cell,
      L.by + (s.oy + s.bh * 0.5) * L.cell
    ];
  }

  function snapDist() {
    return L.cell * 0.9;
  }

  function magnetDist() {
    return L.cell * 1.18;
  }

  function distToHole(s) {
    const a = shardCenter(s);
    const b = holeCenter(s);
    return hypot2(a[0] - b[0], a[1] - b[1]);
  }

  function nearestWrong(s) {
    const a = shardCenter(s);
    let best = -1;
    let bestD = 1e9;
    const shards = G.shards;
    for (let i = 0; i < shards.length; i++) {
      if (i === s.id || shards[i].placed) continue;
      const b = holeCenter(shards[i]);
      const d = hypot2(a[0] - b[0], a[1] - b[1]);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return { id: best, d: bestD };
  }

  function placeShard(s) {
    s.placed = true;
    const hp = holePos(s);
    s.px = hp[0];
    s.py = hp[1];
    s.lift = 0;
    s.shake = 0;
    G.lock = 0.08;
    audio.pulse('snap');
    const c = holeCenter(s);
    burst(c[0], c[1], 16 + s.cells.length * 2, 'cyan');
    for (let k = 0; k < s.cells.length; k++) {
      const cell = s.cells[k];
      sparkle(L.bx + (cell.x + 0.5) * L.cell, L.by + (cell.y + 0.5) * L.cell);
    }
    G.flash = 0.28;
    G.taught = true;
    ensureSelected();
    if (!looseList().length) {
      G.outro = OUTRO;
      G.gold = 1;
      audio.pulse('clear');
      burst(L.bx + L.bw * 0.5, L.by + L.bh * 0.5, 36, 'gold');
    }
  }

  function rejectShard(s, towardId) {
    s.shake = 10;
    G.shake = 7;
    G.flash = 0.7;
    G.lives -= 1;
    G.remain = Math.max(0, G.remain - PENALTY);
    audio.pulse('miss');
    const c = shardCenter(s);
    burst(c[0], c[1], 14, 'pink');
    const parkPull = 0.55;
    s.px = mix(s.px, s.parkX, parkPull);
    s.py = mix(s.py, s.parkY, parkPull);
    if (towardId >= 0) {
      const other = G.shards[towardId];
      const hc = holeCenter(other);
      const sc = shardCenter(s);
      const dx = sc[0] - hc[0];
      const dy = sc[1] - hc[1];
      const len = Math.max(8, hypot2(dx, dy));
      s.px += (dx / len) * L.cell * 0.8;
      s.py += (dy / len) * L.cell * 0.8;
    }
    if (G.lives <= 0 || G.remain <= 0) {
      G.result = G.lives <= 0 ? 'lives' : 'time';
      endGame(false);
    }
  }

  function trySnap(fromKey) {
    if (G.mode !== 'play' || G.paused) return;
    if (G.peel > 0.04 || G.outro > 0 || G.lock > 0) return;
    ensureSelected();
    const s = G.shards[G.selected];
    if (!s || s.placed) {
      if (fromKey) audio.pulse('soft');
      return;
    }
    const d = distToHole(s);
    if (d <= magnetDist()) {
      placeShard(s);
      return;
    }
    const wrong = nearestWrong(s);
    if (wrong.id >= 0 && wrong.d <= snapDist()) {
      rejectShard(s, wrong.id);
      return;
    }
    if (fromKey) audio.pulse('soft');
  }

  function finishOutro() {
    G.mended += 1;
    if (G.mended >= GOAL) {
      endGame(true);
      return;
    }
    setupRound(G.mended);
  }

  function grabAt(x, y) {
    const shards = G.shards;
    let hit = -1;
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      if (s.placed) continue;
      const pad = 12;
      if (
        x >= s.px - pad &&
        y >= s.py - pad &&
        x <= s.px + s.bw * L.cell + pad &&
        y <= s.py + s.bh * L.cell + pad
      ) {
        hit = i;
        break;
      }
    }
    if (hit < 0) {
      const selected = shards[G.selected];
      if (selected && !selected.placed) {
        const pad = 18;
        if (
          x >= selected.px - pad &&
          y >= selected.py - pad &&
          x <= selected.px + selected.bw * L.cell + pad &&
          y <= selected.py + selected.bh * L.cell + pad
        ) {
          hit = G.selected;
        }
      }
    }
    return hit;
  }

  function updateMagnet() {
    G.magnet = -1;
    G.nearWrong = -1;
    if (G.mode !== 'play' || G.peel > 0 || G.outro > 0) return;
    const s = G.shards[G.selected];
    if (!s || s.placed) return;
    const d = distToHole(s);
    const mag = magnetDist();
    if (d <= mag) {
      G.magnet = s.id;
      return;
    }
    const wrong = nearestWrong(s);
    if (wrong.id >= 0 && wrong.d <= mag * 0.85) G.nearWrong = wrong.id;
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    if (G.peel > 0) {
      G.peel = Math.max(0, G.peel - dt);
      const t = 1 - G.peel / PEEL;
      const e = easeOut(t);
      for (let i = 0; i < G.shards.length; i++) {
        const s = G.shards[i];
        if (s.placed) continue;
        const hp = holePos(s);
        s.px = mix(hp[0], s.parkX, e);
        s.py = mix(hp[1], s.parkY, e);
      }
      return;
    }
    if (G.outro > 0) {
      G.outro -= dt;
      if (G.outro <= 0) {
        G.outro = 0;
        finishOutro();
      }
      return;
    }

    G.t += dt;
    G.remain = Math.max(0, G.remain - dt);

    const s = G.shards[G.selected];
    if (s && !s.placed && ptr.shard !== s.id) {
      let mx = 0;
      let my = 0;
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
      if (mx || my) {
        const len = Math.sqrt(mx * mx + my * my);
        s.px += (mx / len) * MOVE * dt;
        s.py += (my / len) * MOVE * dt;
      }
      if (G.magnet === s.id) {
        const hp = holePos(s);
        const pull = 2.4 * dt;
        s.px = mix(s.px, hp[0], pull);
        s.py = mix(s.py, hp[1], pull);
      }
    }

    const margin = 8;
    for (let i = 0; i < G.shards.length; i++) {
      const sh = G.shards[i];
      if (sh.placed) continue;
      const ww = sh.bw * L.cell;
      const hh = sh.bh * L.cell;
      sh.px = clamp(sh.px, margin, W - ww - margin);
      sh.py = clamp(sh.py, margin, H - hh - margin);
      sh.lift = mix(sh.lift, ptr.shard === i || G.selected === i ? 1 : 0.15, 1 - Math.pow(0.001, dt));
      sh.shake = Math.max(0, sh.shake - dt * 18);
    }

    updateMagnet();
    if (G.magnet >= 0 && G.clock - audio.lastMag > 0.55) {
      audio.lastMag = G.clock;
      audio.pulse('magnet');
    }

    const filled = G.shards.length - looseList().length;
    audio.tickDrone(filled, G.shards.length);

    if (G.remain <= 6 && G.clock - audio.lastTick > 0.48) {
      audio.lastTick = G.clock;
      audio.pulse('tick');
    }

    if (G.magnet >= 0 && Math.random() < 0.35) {
      const m = G.shards[G.magnet];
      const c = holeCenter(m);
      sparkle(c[0], c[1]);
    }

    if (G.remain <= 0) {
      G.remain = 0;
      G.result = 'time';
      endGame(false);
    }
  }

  function updateFx(dt) {
    G.clock += dt;
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.gold = Math.max(0, G.gold - dt * 1.05);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].life -= dt;
      if (sparks[i].life <= 0) sparks.splice(i, 1);
    }

    if (G.mode === 'title') {
      if (!G.stage) {
        G.rand = rng(11);
        setupRound(0);
      }
    }
  }

  function syncHud() {
    if (G.mode !== 'play') return;
    roundEl.textContent = G.round + 1 + '/' + GOAL;
    const left = looseList().length;
    holesEl.textContent = String(left);
    timeEl.textContent = G.remain.toFixed(1);
    holesRead.classList.toggle('hot', left === 0 || G.magnet >= 0);
    timeRead.classList.toggle('warn', G.remain < 6);
    btnSnap.classList.toggle('hot', G.magnet >= 0);

    for (let i = 0; i < pipNodes.length; i++) {
      const n = pipNodes[i];
      n.classList.remove('on', 'warn');
      if (i < G.lives) {
        n.classList.add('on');
        if (G.lives === 1) n.classList.add('warn');
      }
    }

    if (G.outro > 0) {
      hintEl.textContent = G.stage.name + ' · 补合';
      hintEl.className = 'hint gold';
    } else if (G.peel > 0) {
      hintEl.textContent = G.stage.hint;
      hintEl.className = 'hint';
    } else if (G.magnet >= 0) {
      hintEl.textContent = '对上了 · 松手或空格放入';
      hintEl.className = 'hint hot';
    } else if (G.nearWrong >= 0) {
      hintEl.textContent = '不是这块 · 看颜色与朝向';
      hintEl.className = 'hint warn';
    } else if (G.remain < 6) {
      hintEl.textContent = '裂纹在蔓延';
      hintEl.className = 'hint warn';
    } else if (!G.taught) {
      hintEl.textContent = '拖回缺口 · 近了会吸住';
      hintEl.className = 'hint';
    } else {
      hintEl.textContent = G.stage.hint;
      hintEl.className = 'hint';
    }
  }

  function addRoundRect(x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, rad);
      return;
    }
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    addRoundRect(x, y, w, h, r);
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(-24, -24, W + 48, H + 48);

    const g1 = ctx.createRadialGradient(W * 0.18, H * 0.06, 0, W * 0.18, H * 0.06, W * 0.7);
    g1.addColorStop(0, 'rgba(255,61,184,0.16)');
    g1.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.86, H * 0.82, 0, W * 0.86, H * 0.82, W * 0.68);
    g2.addColorStop(0, 'rgba(0,240,255,0.12)');
    g2.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.clock * 1.25 + s.p);
      ctx.fillStyle = 'rgba(246,243,255,' + s.a * tw + ')';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = ((m.x + G.clock * 0.01) % 1) * W;
      const y = ((m.y + Math.sin(G.clock * 0.28 + m.p) * 0.04 + 1) % 1) * H;
      ctx.fillStyle = m.c === 'cyan' ? 'rgba(0,240,255,' + m.a + ')' : 'rgba(255,61,184,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawCell(x, y, s, col, alpha, inset) {
    if (alpha <= 0.01) return;
    const gap = Math.max(0.8, s * 0.08);
    const ix = x + gap * 0.5;
    const iy = y + gap * 0.5;
    const iw = s - gap;
    const ih = s - gap;
    const in2 = inset || 0;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = rgba(shade(col, 0.38), 1);
    ctx.fillRect(ix + 1, iy + 1, iw, ih);
    ctx.fillStyle = rgba(col, 1);
    ctx.fillRect(ix, iy, iw, ih);
    ctx.fillStyle = rgba(lift(col, 0.42), 0.7);
    ctx.fillRect(ix, iy, iw, Math.max(1.2, s * 0.16));
    ctx.fillStyle = rgba(lift(col, 0.22), 0.45);
    ctx.fillRect(ix, iy, Math.max(1.1, s * 0.12), ih);
    ctx.fillStyle = rgba(shade(col, 0.55), 0.45);
    ctx.fillRect(ix, iy + ih - Math.max(1, s * 0.12), iw, Math.max(1, s * 0.12));
    if (in2) {
      ctx.fillStyle = rgba(lift(col, 0.55), 0.22);
      ctx.fillRect(ix + iw * 0.18, iy + ih * 0.18, iw * 0.28, ih * 0.2);
    }
    ctx.globalAlpha = 1;
  }

  function drawSocket(x, y, s, col, pulse, glitch) {
    const gap = Math.max(0.8, s * 0.08);
    const ix = x + gap * 0.5 + (glitch ? (Math.random() - 0.5) * 1.6 : 0);
    const iy = y + gap * 0.5 + (glitch ? (Math.random() - 0.5) * 1.4 : 0);
    const iw = s - gap;
    const ih = s - gap;
    ctx.fillStyle = 'rgba(8, 5, 18, 0.92)';
    ctx.fillRect(ix, iy, iw, ih);
    if (col) {
      ctx.fillStyle = rgba(col, 0.14 + pulse * 0.1);
      ctx.fillRect(ix + iw * 0.18, iy + ih * 0.18, iw * 0.64, ih * 0.64);
    }
    ctx.save();
    ctx.strokeStyle = 'rgba(255,61,184,' + (0.35 + pulse * 0.5) + ')';
    ctx.lineWidth = Math.max(1, s * 0.07);
    ctx.setLineDash([Math.max(2, s * 0.22), Math.max(2, s * 0.16)]);
    ctx.lineDashOffset = -G.clock * 18;
    ctx.strokeRect(ix + 0.6, iy + 0.6, iw - 1.2, ih - 1.2);
    ctx.restore();
  }

  function drawBoard() {
    const st = G.stage;
    if (!st) return;
    const pad = L.pad;
    const x = L.bx - pad;
    const y = L.by - pad;
    const w = L.bw + pad * 2;
    const h = L.bh + pad * 2;
    const aligned = G.outro > 0 || (G.mode === 'play' && !looseList().length);

    ctx.save();
    rr(x - 6, y - 6, w + 12, h + 12, 18);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fill();

    ctx.shadowColor = aligned ? 'rgba(0,240,255,0.45)' : 'rgba(255,61,184,0.2)';
    ctx.shadowBlur = aligned ? 22 : 12;
    rr(x, y, w, h, 16);
    ctx.fillStyle = 'rgba(12, 8, 28, 0.94)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = aligned ? 'rgba(0,240,255,0.72)' : 'rgba(255,61,184,0.42)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.save();
    rr(x, y, w, h, 16);
    ctx.clip();

    ctx.fillStyle = '#090616';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,240,255,0.045)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= st.w; gx++) {
      const px = L.bx + gx * L.cell;
      ctx.beginPath();
      ctx.moveTo(px, L.by);
      ctx.lineTo(px, L.by + L.bh);
      ctx.stroke();
    }
    for (let gy = 0; gy <= st.h; gy++) {
      const py = L.by + gy * L.cell;
      ctx.beginPath();
      ctx.moveTo(L.bx, py);
      ctx.lineTo(L.bx + L.bw, py);
      ctx.stroke();
    }

    const pulse = 0.5 + 0.5 * Math.sin(G.clock * 4.2);
    const glitch = G.mode === 'play' && G.remain < 6 && G.outro <= 0;
    const heal = G.outro > 0 ? smooth(1 - G.outro / OUTRO) : 0;

    const missing = st.missing;
    const placedSet = {};
    for (let i = 0; i < G.shards.length; i++) {
      if (!G.shards[i].placed) continue;
      const cells = G.shards[i].cells;
      for (let k = 0; k < cells.length; k++) placedSet[cells[k].y * 64 + cells[k].x] = 1;
    }

    for (let cy = 0; cy < st.h; cy++) {
      for (let cx = 0; cx < st.w; cx++) {
        const colId = st.grid[cy][cx];
        if (!colId) continue;
        const key = cy * 64 + cx;
        const holeId = missing[key];
        const px = L.bx + cx * L.cell;
        const py = L.by + cy * L.cell;
        const isHole = holeId != null && !placedSet[key];
        if (isHole && G.mode !== 'title') {
          const mag = G.magnet === holeId;
          const wrong = G.nearWrong === holeId;
          const col = RGB[colId];
          drawSocket(px, py, L.cell, col, mag ? 1 : pulse, glitch);
          if (mag) {
            ctx.strokeStyle = 'rgba(0,240,255,' + (0.45 + pulse * 0.4) + ')';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, L.cell - 2, L.cell - 2);
          } else if (wrong) {
            ctx.strokeStyle = 'rgba(255,61,184,0.7)';
            ctx.lineWidth = 2;
            ctx.strokeRect(px + 1, py + 1, L.cell - 2, L.cell - 2);
          }
        } else if (!isHole) {
          const glow = heal * 0.35;
          const c = glow > 0 ? lift(RGB[colId], glow) : RGB[colId];
          drawCell(px, py, L.cell, c, 1, 1);
        }
      }
    }

    if (glitch) {
      ctx.globalAlpha = 0.12 + (1 - G.remain / 6) * 0.12;
      ctx.fillStyle = '#ff3db8';
      for (let i = 0; i < cracks.length; i++) {
        const c = cracks[i];
        const yy = L.by + ((c.y + G.clock * 0.03) % 1) * L.bh;
        ctx.fillRect(L.bx + c.x * L.bw, yy, c.w * L.bw, 1.2);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    ctx.font = '10px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.fillStyle = 'rgba(154,160,200,0.72)';
    ctx.textAlign = 'center';
    ctx.fillText(st.name + '  ' + st.sub, L.bx + L.bw * 0.5, y - 12);
    ctx.restore();
  }

  function drawShard(s, ghost) {
    const cell = L.cell;
    let px = s.px;
    let py = s.py;
    if (G.mode === 'title') {
      const hp = holePos(s);
      const wave = 0.5 + 0.5 * Math.sin(G.clock * 0.7 + s.id * 1.1);
      const e = smooth(wave);
      px = mix(s.parkX, hp[0], e);
      py = mix(s.parkY, hp[1], e);
    }
    if (s.shake > 0) {
      px += (Math.random() - 0.5) * s.shake;
      py += (Math.random() - 0.5) * s.shake;
    }
    const liftAmt = ghost ? 0 : s.lift * 5;
    py -= liftAmt;
    const selected = !ghost && G.selected === s.id && !s.placed;
    const dragging = ptr.shard === s.id;

    if (!s.placed && !ghost) {
      ctx.fillStyle = selected ? 'rgba(0,240,255,0.2)' : 'rgba(0,0,0,0.38)';
      const drop = dragging ? 7 : 4;
      for (let k = 0; k < s.cells.length; k++) {
        const c = s.cells[k];
        const x = px + (c.x - s.ox) * cell;
        const y = py + (c.y - s.oy) * cell;
        ctx.fillRect(x + 2, y + drop, cell * 0.9, cell * 0.9);
      }
    }
    for (let k = 0; k < s.cells.length; k++) {
      const c = s.cells[k];
      const x = px + (c.x - s.ox) * cell;
      const y = py + (c.y - s.oy) * cell;
      drawCell(x, y, cell, RGB[c.c], ghost ? 0.22 : 1, 1);
    }

    if (selected && G.mode === 'play' && G.peel <= 0) {
      ctx.strokeStyle = G.magnet === s.id ? 'rgba(0,240,255,0.9)' : 'rgba(0,240,255,0.55)';
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 4]);
      ctx.lineDashOffset = -G.clock * 22;
      ctx.strokeRect(px - 4, py - 4, s.bw * cell + 8, s.bh * cell + 8);
      ctx.setLineDash([]);
    }
  }

  function drawTray() {
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') return;
    const shards = G.shards;
    let x0 = 1e9;
    let y0 = 1e9;
    let x1 = 0;
    let y1 = 0;
    let any = false;
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      if (s.placed) continue;
      any = true;
      x0 = Math.min(x0, s.parkX);
      y0 = Math.min(y0, s.parkY);
      x1 = Math.max(x1, s.parkX + s.bw * L.cell);
      y1 = Math.max(y1, s.parkY + s.bh * L.cell);
    }
    if (!any) return;
    const x = x0 - 14;
    const y = y0 - 14;
    const w = x1 - x0 + 28;
    const h = y1 - y0 + 28;
    ctx.save();
    rr(x, y, w, h, 14);
    ctx.fillStyle = 'rgba(8, 6, 20, 0.42)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.16)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '10px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.fillStyle = 'rgba(154,160,200,0.75)';
    ctx.textAlign = 'center';
    ctx.fillText('碎块  SHARDS', x + w * 0.5, y - 8);
    ctx.restore();
  }

  function drawShards() {
    const shards = G.shards;
    for (let i = 0; i < shards.length; i++) {
      if (shards[i].placed) continue;
      if (G.selected === i) continue;
      drawShard(shards[i], false);
    }
    if (shards[G.selected] && !shards[G.selected].placed) drawShard(shards[G.selected], false);
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / 0.55, 0, 1);
      ctx.globalAlpha = a;
      if (p.hue === 'cyan') ctx.fillStyle = '#00f0ff';
      else if (p.hue === 'gold') ctx.fillStyle = '#ffe36b';
      else ctx.fillStyle = '#ff3db8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.globalAlpha = clamp(s.life / 0.28, 0, 1);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(255,61,184,' + (0.16 * G.flash) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.gold > 0.35) {
      ctx.fillStyle = 'rgba(255,227,107,' + (0.07 * G.gold) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.18, W * 0.5, H * 0.5, W * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(5,3,12,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    const sx = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    const sy = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);

    drawBg();
    if (G.stage) {
      drawBoard();
      drawTray();
      drawShards();
    }
    drawFx();
  }

  function update(dt) {
    if (G.paused) return;
    if (G.mode === 'play') updatePlay(dt);
    updateFx(dt);
  }

  let last = 0;
  let acc = 0;
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    if (G.mode === 'play') syncHud();
    requestAnimationFrame(frame);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
    if (G.mode === 'title' || (G.mode === 'play' && G.peel > 0)) {
      const shards = G.shards;
      for (let i = 0; i < shards.length; i++) {
        if (shards[i].placed) {
          const hp = holePos(shards[i]);
          shards[i].px = hp[0];
          shards[i].py = hp[1];
        }
      }
    }
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = down;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = down;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = down;
    if (down) {
      if (k === 'm' || k === 'M') {
        audio.ensure();
        audio.setMuted(!audio.muted);
        e.preventDefault();
      } else if (k === 'r' || k === 'R') {
        startGame();
        e.preventDefault();
      } else if (k === 'q' || k === 'Q' || k === '[') {
        if (G.mode === 'play') selectLoose(-1);
        e.preventDefault();
      } else if (k === 'e' || k === 'E' || k === ']') {
        if (G.mode === 'play') selectLoose(1);
        e.preventDefault();
      } else if (k === 'Tab') {
        if (G.mode === 'play') {
          selectLoose(e.shiftKey ? -1 : 1);
          e.preventDefault();
        }
      } else if (k === ' ' || k === 'Enter') {
        e.preventDefault();
        audio.ensure();
        if (G.mode !== 'play') startGame();
        else trySnap(true);
      }
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].indexOf(k) >= 0) {
      e.preventDefault();
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    if (G.mode !== 'play' || G.paused) return;
    if (G.peel > 0.04 || G.outro > 0) return;
    audio.ensure();
    const x = e.clientX;
    const y = e.clientY;
    const hit = grabAt(x, y);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.x = x;
    ptr.y = y;
    ptr.moved = 0;
    ptr.shard = hit;
    if (hit >= 0) {
      G.selected = hit;
      const s = G.shards[hit];
      ptr.ox = s.px - x;
      ptr.oy = s.py - y;
      s.lift = 1;
      audio.pulse('grab');
      canvas.classList.add('grabbing');
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', function (e) {
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    if (!ptr.down || ptr.shard < 0) return;
    const s = G.shards[ptr.shard];
    if (!s || s.placed) return;
    s.px = ptr.x + ptr.ox;
    s.py = ptr.y + ptr.oy;
    ptr.moved += 1;
    updateMagnet();
  });

  function endPointer(e) {
    if (!ptr.down) return;
    const id = ptr.shard;
    ptr.down = false;
    ptr.shard = -1;
    canvas.classList.remove('grabbing');
    try {
      if (e && e.pointerId != null) canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}
    if (G.mode !== 'play') return;
    if (id >= 0) {
      G.selected = id;
      trySnap(false);
    }
  }

  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  btnMain.addEventListener('click', function () {
    audio.ensure();
    startGame();
  });
  btnRetry.addEventListener('click', function () {
    audio.ensure();
    startGame();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnSnap.addEventListener('click', function () {
    audio.ensure();
    trySnap(true);
  });
  btnPrev.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'play') selectLoose(-1);
  });
  btnNext.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'play') selectLoose(1);
  });

  window.addEventListener('keydown', function (e) {
    onKey(e, true);
  });
  window.addEventListener('keyup', function (e) {
    onKey(e, false);
  });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
  });
  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    if (document.hidden) {
      keys.l = keys.r = keys.u = keys.d = false;
      ptr.down = false;
      ptr.shard = -1;
      canvas.classList.remove('grabbing');
    }
  });
  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
    else audio.setMuted(false);
  } catch (e) {
    audio.setMuted(false);
  }

  makeStars();
  makeMotes();
  G.rand = rng(11);
  setupRound(0);
  resize();
  showPanel();
  requestAnimationFrame(frame);

  if (location.hash === '#auto' || /(?:\?|&)auto=1/.test(location.search)) {
    startGame();
    G.peel = 0;
    for (let i = 0; i < G.shards.length; i++) {
      G.shards[i].px = G.shards[i].parkX;
      G.shards[i].py = G.shards[i].parkY;
    }
  }
})();
