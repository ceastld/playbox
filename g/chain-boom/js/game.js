'use strict';

(function (root) {
  var COLS = 8;
  var ROWS = 10;
  var NCOL = 4;
  var STEP = 1 / 60;
  var TAU = Math.PI * 2;
  var TIMED_SEC = 60;
  var COMBO_WIN = 2.6;
  var CLEAR_BONUS = 400;
  var CLUSTER = 0.52;
  var BEST_KEY = 'playbox-chain-boom-best';
  var MUTE_KEY = 'playbox-chain-boom-mute';
  var MODE_KEY = 'playbox-chain-boom-mode';
  var DC = [1, -1, 0, 0];
  var DR = [0, 0, 1, -1];

  var MAG = [255, 61, 184];
  var CYN = [0, 240, 255];
  var GOLD = [255, 227, 107];
  var PUR = [180, 108, 255];
  var WHITE = [255, 255, 255];

  var PAL = [
    { rgb: MAG, hi: [255, 186, 230], lo: [120, 12, 78], glow: 'rgba(255,61,184,0.55)' },
    { rgb: CYN, hi: [186, 255, 255], lo: [0, 78, 96], glow: 'rgba(0,240,255,0.5)' },
    { rgb: GOLD, hi: [255, 248, 210], lo: [148, 108, 16], glow: 'rgba(255,227,107,0.5)' },
    { rgb: PUR, hi: [226, 196, 255], lo: [72, 28, 132], glow: 'rgba(180,108,255,0.55)' }
  ];

  var hasDom = typeof document !== 'undefined';
  var REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function mix(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t + 0.5) | 0,
      (a[1] + (b[1] - a[1]) * t + 0.5) | 0,
      (a[2] + (b[2] - a[2]) * t + 0.5) | 0
    ];
  }
  function emptyGrid() {
    var g = [];
    var r, c, row;
    for (r = 0; r < ROWS; r++) {
      row = [];
      for (c = 0; c < COLS; c++) row.push(-1);
      g.push(row);
    }
    return g;
  }
  function copyGrid(src) {
    var g = [];
    var r;
    for (r = 0; r < src.length; r++) g.push(src[r].slice());
    return g;
  }
  function cellAt(grid, c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return -1;
    return grid[r][c];
  }
  function countTiles(grid) {
    var n = 0;
    var r, c;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) if (grid[r][c] >= 0) n += 1;
    }
    return n;
  }

  function findGroup(grid, c0, r0) {
    var color = cellAt(grid, c0, r0);
    var out = [];
    if (color < 0) return out;
    var seen = [];
    var r, c, i;
    for (r = 0; r < ROWS; r++) {
      seen[r] = [];
      for (c = 0; c < COLS; c++) seen[r][c] = 0;
    }
    var stack = [[c0, r0]];
    seen[r0][c0] = 1;
    while (stack.length) {
      var cur = stack.pop();
      c = cur[0];
      r = cur[1];
      out.push({ c: c, r: r });
      for (i = 0; i < 4; i++) {
        var nc = c + DC[i];
        var nr = r + DR[i];
        if (cellAt(grid, nc, nr) === color && !seen[nr][nc]) {
          seen[nr][nc] = 1;
          stack.push([nc, nr]);
        }
      }
    }
    return out;
  }

  function hasMove(grid) {
    var r, c, g;
    var seen = [];
    for (r = 0; r < ROWS; r++) {
      seen[r] = [];
      for (c = 0; c < COLS; c++) seen[r][c] = 0;
    }
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        if (grid[r][c] < 0 || seen[r][c]) continue;
        g = findGroup(grid, c, r);
        for (var i = 0; i < g.length; i++) seen[g[i].r][g[i].c] = 1;
        if (g.length >= 2) return true;
      }
    }
    return false;
  }

  function packGrid(grid) {
    var next = emptyGrid();
    var c, r, w, dc, rr;
    var stacks = [];
    for (c = 0; c < COLS; c++) {
      var col = [];
      for (r = 0; r < ROWS; r++) if (grid[r][c] >= 0) col.push(grid[r][c]);
      stacks.push(col);
    }
    dc = 0;
    for (c = 0; c < COLS; c++) {
      if (!stacks[c].length) continue;
      w = ROWS - stacks[c].length;
      for (rr = 0; rr < stacks[c].length; rr++) next[w + rr][dc] = stacks[c][rr];
      dc += 1;
    }
    return next;
  }

  function scorePop(n, combo) {
    if (n < 2) return 0;
    var k = combo < 1 ? 1 : combo;
    return (n * n) * k;
  }

  function fillBoard(rng) {
    var rnd = rng || Math.random;
    var g = emptyGrid();
    var r, c, opts, pick;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        opts = [];
        if (c > 0 && g[r][c - 1] >= 0) opts.push(g[r][c - 1]);
        if (r > 0 && g[r - 1][c] >= 0) opts.push(g[r - 1][c]);
        if (opts.length && rnd() < CLUSTER) {
          pick = opts[(rnd() * opts.length) | 0];
        } else {
          pick = (rnd() * NCOL) | 0;
        }
        g[r][c] = pick;
      }
    }
    return g;
  }

  function makeBoard() {
    var g;
    var guard = 40;
    do {
      g = fillBoard();
      guard -= 1;
    } while (!hasMove(g) && guard > 0);
    return g;
  }

  function runSelfTest() {
    var fail = 0;
    function eq(a, b, msg) {
      if (a !== b) {
        fail += 1;
        console.error('fail', msg, a, b);
      }
    }
    eq(scorePop(2, 1), 4, '2 tiles');
    eq(scorePop(5, 1), 25, '5 tiles');
    eq(scorePop(10, 3), 300, '10 x3');
    eq(scorePop(1, 1), 0, 'single');

    var g = emptyGrid();
    g[9][0] = 1; g[9][1] = 1; g[8][0] = 1;
    eq(findGroup(g, 0, 9).length, 3, 'group 3');
    eq(hasMove(g), true, 'has move');
    g[8][0] = 2;
    eq(findGroup(g, 0, 9).length, 2, 'group 2');
    g[9][1] = 3;
    eq(hasMove(g), false, 'no move');

    var p = emptyGrid();
    p[1][2] = 0; p[3][2] = 1; p[5][5] = 2;
    p = packGrid(p);
    eq(p[8][0], 0, 'fall col0 top');
    eq(p[9][0], 1, 'fall col0 bot');
    eq(p[9][1], 2, 'shift col');
    eq(p[5][5], -1, 'old empty');
    eq(countTiles(p), 3, 'count');

    var board = emptyGrid();
    var rr, cc;
    for (rr = 8; rr < 10; rr++) {
      for (cc = 0; cc < 3; cc++) board[rr][cc] = 0;
    }
    board[9][3] = 1;
    board[9][4] = 1;
    eq(findGroup(board, 0, 9).length, 6, 'blob 6');
    eq(scorePop(6, 2), 72, '6 x2');
    var g6 = findGroup(board, 1, 8);
    for (var k = 0; k < g6.length; k++) board[g6[k].r][g6[k].c] = -1;
    board = packGrid(board);
    eq(board[9][0], 1, 'pair slid');
    eq(board[9][1], 1, 'pair slid 2');
    eq(hasMove(board), true, 'pair still a move');
    board[9][1] = -1;
    eq(hasMove(board), false, 'orphan');

    if (fail) {
      console.error('self-test failures', fail);
      if (typeof process !== 'undefined') process.exit(1);
    } else if (typeof console !== 'undefined') {
      console.log('chain-boom self-test ok');
    }
  }

  if (!hasDom) {
    runSelfTest();
    return;
  }

  var canvas = document.getElementById('c');
  var ctx = canvas.getContext('2d', { alpha: false });
  var overlay = document.getElementById('overlay');
  var panel = document.getElementById('panel');
  var ovKicker = document.getElementById('ov-kicker');
  var ovTitle = document.getElementById('ov-title');
  var ovLead = document.getElementById('ov-lead');
  var ovOps = document.getElementById('ov-ops');
  var ovClear = document.getElementById('ov-clear');
  var ovTimed = document.getElementById('ov-timed');
  var btnMute = document.getElementById('btn-mute');
  var btnRetry = document.getElementById('btn-retry');
  var modeClearBtn = document.getElementById('mode-clear');
  var modeTimedBtn = document.getElementById('mode-timed');
  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var comboEl = document.getElementById('combo');
  var scoreBox = document.getElementById('score-box');
  var comboBox = document.getElementById('combo-box');
  var scoreAdd = document.getElementById('score-add');
  var timeBox = document.getElementById('time-box');
  var timeEl = document.getElementById('time');
  var stageLabel = document.getElementById('stage-label');
  var tagLabel = document.getElementById('tag-label');
  var leftLabel = document.getElementById('left-label');
  var toastEl = document.getElementById('toast');
  var hintEl = document.getElementById('hint');
  var stageEl = document.getElementById('stage');

  var W = 1;
  var H = 1;
  var dpr = 1;
  var cell = 40;
  var gap = 4;
  var tileS = 36;
  var boardX = 0;
  var boardY = 0;
  var boardW = 0;
  var boardH = 0;
  var last = 0;
  var acc = 0;
  var hidden = false;
  var addTok = 0;
  var toastTok = 0;
  var kickTok = 0;
  var tid = 1;
  var overlayKind = 'title';
  var frozen = true;

  var particles = [];
  var sparks = [];
  var rings = [];
  var floats = [];
  var motes = [];

  var G = {
    mode: 'title',
    kind: 'clear',
    phase: 'idle',
    grid: emptyGrid(),
    tiles: [],
    score: 0,
    bestC: 0,
    bestT: 0,
    combo: 1,
    maxCombo: 1,
    comboT: 0,
    time: TIMED_SEC,
    ticking: false,
    leftover: 0,
    pops: 0,
    biggest: 0,
    boards: 0,
    hover: null,
    cursor: { c: 0, r: ROWS - 1, on: false },
    stop: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    punch: 1,
    flash: 0,
    flashRgb: PUR,
    toastT: 0,
    lock: 0,
    clock: 0,
    pendingEnd: '',
    refillKind: '',
    hintPulse: 0,
    hintGroup: [],
    landFx: false,
    startBest: 0
  };

  var audio = {
    ctx: null,
    master: null,
    muted: false,
    noiseBuf: null,
    ensure: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      var t = this.ctx.currentTime + (delay || 0);
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
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
    noise: function (dur, vol, freq, type) {
      if (!this.ctx || this.muted) return;
      if (!this.noiseBuf) {
        var sr = this.ctx.sampleRate;
        var buf = this.ctx.createBuffer(1, (sr * 0.28) | 0, sr);
        var data = buf.getChannelData(0);
        for (var i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      var src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      var f = this.ctx.createBiquadFilter();
      f.type = type || 'bandpass';
      f.frequency.value = freq || 900;
      f.Q.value = type === 'lowpass' ? 0.7 : 1.05;
      var g = this.ctx.createGain();
      var t = this.ctx.currentTime;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    pop: function (n, combo) {
      this.ensure();
      var pitch = 190 + Math.min(n, 16) * 36 + Math.min(combo, 8) * 42;
      this.noise(0.07 + n * 0.005, 0.13 + Math.min(0.12, n * 0.008), 640 + n * 36, 'bandpass');
      this.beep(pitch, 0.09, 'square', 0.055, pitch * 1.85);
      this.beep(pitch * 0.5, 0.13, 'triangle', 0.05, pitch * 0.22);
      if (n >= 6) this.beep(pitch * 1.45, 0.16, 'sine', 0.04, pitch * 2.15, 0.03);
      if (combo >= 3) this.beep(880 + combo * 70, 0.14, 'sine', 0.032, 1480, 0.05);
    },
    miss: function () {
      this.ensure();
      this.noise(0.1, 0.07, 280, 'lowpass');
      this.beep(180, 0.16, 'sawtooth', 0.04, 70);
    },
    land: function (heavy) {
      this.ensure();
      this.noise(heavy ? 0.08 : 0.04, heavy ? 0.07 : 0.035, heavy ? 220 : 340, 'lowpass');
      this.beep(heavy ? 160 : 240, 0.08, 'triangle', heavy ? 0.045 : 0.028, 80);
    },
    clear: function () {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.06, 784);
      this.beep(784, 0.14, 'triangle', 0.05, 1175, 0.05);
      this.beep(1175, 0.22, 'sine', 0.045, 1568, 0.1);
    },
    win: function () {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06, 659);
      this.beep(659, 0.14, 'triangle', 0.05, 784, 0.06);
      this.beep(784, 0.22, 'sine', 0.05, 1046, 0.12);
    },
    lose: function () {
      this.ensure();
      this.beep(220, 0.2, 'sawtooth', 0.055, 90);
      this.beep(140, 0.36, 'triangle', 0.06, 48, 0.08);
    },
    tick: function () {
      this.ensure();
      this.beep(1480, 0.03, 'sine', 0.02);
    },
    start: function () {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.045, 588);
      this.beep(784, 0.14, 'triangle', 0.04, 1175, 0.05);
    }
  };

  function loadBest() {
    G.bestC = 0;
    G.bestT = 0;
    try {
      var raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        var o = JSON.parse(raw);
        G.bestC = Math.max(0, parseInt(o.clear, 10) || 0);
        G.bestT = Math.max(0, parseInt(o.timed, 10) || 0);
      } else {
        G.bestC = Math.max(0, parseInt(raw, 10) || 0);
      }
    } catch (e) { /* ignore */ }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ clear: G.bestC, timed: G.bestT }));
    } catch (e) { /* ignore */ }
  }

  function currentBest() {
    return G.kind === 'timed' ? G.bestT : G.bestC;
  }

  function maybeBest() {
    if (G.kind === 'timed') {
      if (G.score > G.bestT) {
        G.bestT = G.score;
        saveBest();
        return true;
      }
    } else if (G.score > G.bestC) {
      G.bestC = G.score;
      saveBest();
      return true;
    }
    return false;
  }

  function bumpScore(add) {
    if (add <= 0) return;
    G.score += add;
    maybeBest();
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    var tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + add;
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function syncCombo() {
    comboEl.textContent = '×' + G.combo;
    comboBox.classList.toggle('hot', G.combo >= 2);
    if (G.combo >= 2) {
      comboBox.classList.remove('flash');
      void comboBox.offsetWidth;
      comboBox.classList.add('flash');
    }
  }

  function showToast(msg, kind) {
    G.toastT = 1.45;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    toastTok += 1;
  }

  function setHint(text, kind) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function renderHud() {
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    comboEl.textContent = '×' + G.combo;
    comboBox.classList.toggle('hot', G.combo >= 2);
    var left = countTiles(G.grid);
    leftLabel.textContent = '余 ' + left;
    if (G.kind === 'timed') {
      stageLabel.textContent = G.ticking ? '限时' : '限时 · 点一下开表';
      stageLabel.classList.toggle('hot', G.ticking && G.time < 12);
      timeBox.hidden = false;
      var sec = Math.ceil(Math.max(0, G.time));
      timeEl.textContent = String(sec);
      timeBox.classList.toggle('low', G.ticking && G.time < 10);
      tagLabel.textContent = G.combo >= 3 ? '连环' : 'CHAIN';
      tagLabel.className = G.combo >= 3 ? 'hot' : (G.time < 10 && G.ticking ? 'warn' : '');
    } else {
      stageLabel.textContent = '清盘';
      stageLabel.classList.remove('hot');
      timeBox.hidden = true;
      tagLabel.textContent = left === 0 ? '清' : G.combo >= 3 ? '连环' : 'CHAIN';
      tagLabel.className = left === 0 || G.combo >= 3 ? 'hot' : '';
    }
  }

  function setModeUi(kind) {
    document.body.classList.toggle('mode-timed', kind === 'timed');
    document.body.classList.toggle('mode-clear', kind !== 'timed');
    modeClearBtn.setAttribute('aria-pressed', kind !== 'timed' ? 'true' : 'false');
    modeTimedBtn.setAttribute('aria-pressed', kind === 'timed' ? 'true' : 'false');
  }

  function setOverlay(kind) {
    overlayKind = kind;
    frozen = kind !== 'none';
    if (kind === 'none') {
      overlay.classList.add('hidden');
      overlay.classList.remove('end');
      overlay.setAttribute('aria-hidden', 'true');
      panel.classList.remove('win', 'lose', 'time');
      return;
    }
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.toggle('end', kind !== 'title');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    panel.classList.toggle('time', kind === 'time');
    if (kind === 'title') {
      ovKicker.textContent = 'CHAIN';
      ovTitle.textContent = '连环';
      ovLead.textContent = '点一簇同色，炸开，往下砸。块越多分越炸，连环接着窜。';
      ovOps.textContent = '点两块以上同色 · 方向键选格 · 空格炸掉 · M 静音';
      ovClear.textContent = '清盘';
      ovTimed.textContent = '限时 60s';
    } else if (kind === 'win') {
      maybeBest();
      var rec = G.score > G.startBest;
      ovKicker.textContent = rec ? 'NEW' : 'CLEAR';
      ovTitle.textContent = '清干净了';
      ovLead.textContent = '全盘炸掉 · ' + G.score + ' 分 · 最大一炸 ' + G.biggest +
        ' · 连环 ×' + G.maxCombo + (rec ? ' · 新纪录' : ' · 最高 ' + currentBest());
      ovOps.textContent = 'R 重开 · 点模式再来 · M 静音';
      ovClear.textContent = '再清';
      ovTimed.textContent = '限时';
    } else if (kind === 'lose') {
      maybeBest();
      ovKicker.textContent = 'STUCK';
      ovTitle.textContent = '卡住了';
      ovLead.textContent = '剩下 ' + G.leftover + ' 块孤子 · ' + G.score + ' 分 · 最大一炸 ' +
        G.biggest + ' · 最高 ' + currentBest();
      ovOps.textContent = 'R 重开 · 点弹层外可看盘 · M 静音';
      ovClear.textContent = '再清';
      ovTimed.textContent = '限时';
    } else if (kind === 'time') {
      maybeBest();
      var recT = G.score > G.startBest;
      ovKicker.textContent = recT ? 'NEW' : 'TIME';
      ovTitle.textContent = '时间到';
      ovLead.textContent = G.score + ' 分 · 炸掉 ' + G.pops + ' 次 · 连环 ×' + G.maxCombo +
        (recT ? ' · 新纪录' : ' · 最高 ' + currentBest());
      ovOps.textContent = 'R 重开 · 点弹层外可看盘 · M 静音';
      ovClear.textContent = '清盘';
      ovTimed.textContent = '再冲';
    }
    renderHud();
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function hitStop(sec) {
    if (REDUCE) {
      G.stop = Math.max(G.stop, 0.012);
      return;
    }
    G.stop = Math.max(G.stop, sec);
  }

  function kick(nx, ny, mag) {
    if (REDUCE) {
      G.kickY += ny * mag * 0.25;
      return;
    }
    G.kickX += nx * mag;
    G.kickY += ny * mag;
    G.shake = Math.max(G.shake, mag * 0.55);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.004));
    kickTok += 1;
    stageEl.classList.remove('boom');
    void stageEl.offsetWidth;
    stageEl.classList.add('boom');
  }

  function missKick() {
    G.shake = Math.max(G.shake, 5);
    stageEl.classList.remove('miss');
    void stageEl.offsetWidth;
    stageEl.classList.add('miss');
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.42);
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    var i;
    for (i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 980 : spec.g,
        rot: rand(0, TAU),
        spin: rand(-10, 10)
      });
    }
    capArr(particles, 420);
  }

  function spark(x, y, rgb, n) {
    var i;
    for (i = 0; i < n; i++) {
      var a = rand(0, TAU);
      var sp = rand(90, 460);
      sparks.push({
        x: x, y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.12, 0.34),
        max: 0.34,
        rgb: rgb,
        w: rand(1.2, 3.6)
      });
    }
    capArr(sparks, 200);
  }

  function ring(x, y, rgb, r0, r1, life) {
    rings.push({ x: x, y: y, rgb: rgb, r0: r0, r1: r1, t: 0, life: life || 0.3 });
  }

  function floatText(x, y, text, rgb, size, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.72,
      size: size || 18, gold: !!gold, vy: -78
    });
  }

  function cellPx(c, r) {
    return {
      x: boardX + c * cell + gap * 0.5,
      y: boardY + r * cell + gap * 0.5
    };
  }

  function cellCenter(c, r) {
    var p = cellPx(c, r);
    return { x: p.x + tileS * 0.5, y: p.y + tileS * 0.5 };
  }

  function spawnTiles(grid, fromTop) {
    var tiles = [];
    var r, c, t, col;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        col = grid[r][c];
        if (col < 0) continue;
        tid += 1;
        t = {
          id: tid,
          color: col,
          c: c,
          r: r,
          x: c,
          y: fromTop ? r - ROWS - rand(0.1, 1.6) : r,
          tx: c,
          ty: r,
          vx: 0,
          vy: fromTop ? rand(2, 8) : 0,
          sx: 1,
          sy: 1,
          pop: 0,
          flash: fromTop ? 0 : 0.2,
          alive: true,
          drop: 0
        };
        tiles.push(t);
      }
    }
    return tiles;
  }

  function tilesToGrid(tiles) {
    var g = emptyGrid();
    var i, t;
    for (i = 0; i < tiles.length; i++) {
      t = tiles[i];
      if (!t.alive || t.pop > 0) continue;
      if (t.r >= 0 && t.r < ROWS && t.c >= 0 && t.c < COLS) g[t.r][t.c] = t.color;
    }
    return g;
  }

  function tileAt(c, r) {
    var i, t;
    for (i = 0; i < G.tiles.length; i++) {
      t = G.tiles[i];
      if (t.alive && t.pop === 0 && t.c === c && t.r === r) return t;
    }
    return null;
  }

  function assignPackedPositions() {
    var cols = [];
    var c, i, t, nc, nr, start;
    for (c = 0; c < COLS; c++) cols[c] = [];
    for (i = 0; i < G.tiles.length; i++) {
      t = G.tiles[i];
      if (t.alive && t.pop === 0) cols[t.c].push(t);
    }
    for (c = 0; c < COLS; c++) {
      cols[c].sort(function (a, b) { return a.r - b.r; });
    }
    nc = 0;
    for (c = 0; c < COLS; c++) {
      if (!cols[c].length) continue;
      start = ROWS - cols[c].length;
      for (i = 0; i < cols[c].length; i++) {
        t = cols[c][i];
        nr = start + i;
        t.drop = Math.max(0, nr - t.r);
        t.c = nc;
        t.r = nr;
        t.tx = nc;
        t.ty = nr;
      }
      nc += 1;
    }
    G.grid = tilesToGrid(G.tiles);
  }

  function seedMotes() {
    motes.length = 0;
    var i;
    for (i = 0; i < 28; i++) {
      motes.push({
        x: rand(0, W),
        y: rand(0, H),
        s: rand(0.6, 1.8),
        v: rand(6, 18),
        a: rand(0.04, 0.14),
        rgb: Math.random() < 0.5 ? PUR : CYN
      });
    }
  }

  function layout() {
    var padX = 18;
    var padY = 16;
    cell = Math.floor(Math.min((W - padX * 2) / COLS, (H - padY * 2) / ROWS));
    cell = Math.max(16, cell);
    gap = Math.max(2, cell * 0.09);
    tileS = cell - gap;
    boardW = COLS * cell;
    boardH = ROWS * cell;
    boardX = (W - boardW) * 0.5;
    boardY = (H - boardH) * 0.5 + 4;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
    seedMotes();
  }

  function pointerCell(ev) {
    var rect = canvas.getBoundingClientRect();
    var x = (ev.clientX - rect.left) * (W / Math.max(1, rect.width));
    var y = (ev.clientY - rect.top) * (H / Math.max(1, rect.height));
    var c = Math.floor((x - boardX) / cell);
    var r = Math.floor((y - boardY) / cell);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return null;
    return { c: c, r: r };
  }

  function groupAt(c, r) {
    return findGroup(G.grid, c, r);
  }

  function centroid(group) {
    var x = 0, y = 0, i, p;
    for (i = 0; i < group.length; i++) {
      p = cellCenter(group[i].c, group[i].r);
      x += p.x;
      y += p.y;
    }
    return { x: x / group.length, y: y / group.length };
  }

  function occupyCursor() {
    if (tileAt(G.cursor.c, G.cursor.r)) return;
    var r, c, best = null, bd = 99, d;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        if (G.grid[r][c] < 0) continue;
        d = Math.abs(c - G.cursor.c) + Math.abs(r - G.cursor.r);
        if (d < bd) { bd = d; best = { c: c, r: r }; }
      }
    }
    if (best) { G.cursor.c = best.c; G.cursor.r = best.r; }
  }

  function moveCursor(dc, dr) {
    G.cursor.on = true;
    var c = G.cursor.c;
    var r = G.cursor.r;
    var i;
    for (i = 0; i < 12; i++) {
      c += dc;
      r += dr;
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
      if (G.grid[r][c] >= 0) {
        G.cursor.c = c;
        G.cursor.r = r;
        G.hover = { c: c, r: r };
        return;
      }
    }
  }

  function boomGroup(group) {
    var n = group.length;
    if (n < 2) return false;
    if (G.kind === 'timed' && !G.ticking) G.ticking = true;

    if (G.comboT > 0) G.combo += 1;
    else G.combo = 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    var add = scorePop(n, G.combo);
    G.pops += 1;
    if (n > G.biggest) G.biggest = n;

    var pal = PAL[G.grid[group[0].r][group[0].c]] || PAL[0];
    var mid = centroid(group);
    var i, t, p, stop;

    stop = clamp(0.036 + n * 0.004 + G.combo * 0.004, 0.032, 0.08);
    hitStop(stop);
    kick(rand(-0.4, 0.4), 1, 5 + n * 0.7 + G.combo * 0.4);
    screenFlash(pal.rgb, 0.28 + Math.min(0.35, n * 0.025));
    audio.pop(n, G.combo);

    for (i = 0; i < group.length; i++) {
      t = tileAt(group[i].c, group[i].r);
      if (!t) continue;
      t.pop = 0.001;
      t.flash = 1;
      t.sx = 1.16;
      t.sy = 1.16;
      p = cellCenter(t.c, t.r);
      emit(REDUCE ? 4 : 10, {
        x: p.x, y: p.y, j: tileS * 0.28,
        vx0: -220, vx1: 220, vy0: -340, vy1: 80,
        r0: 1.4, r1: tileS * 0.22, life: 0.42, rgb: pal.rgb, g: 920
      });
      spark(p.x, p.y, pal.hi, REDUCE ? 3 : 7);
    }
    ring(mid.x, mid.y, pal.rgb, tileS * 0.2, tileS * (1.6 + n * 0.12), 0.32);
    emit(REDUCE ? 6 : 14 + n, {
      x: mid.x, y: mid.y, j: tileS * 0.5,
      vx0: -280, vx1: 280, vy0: -420, vy1: 40,
      r0: 2, r1: tileS * 0.28, life: 0.5, rgb: pal.hi, g: 860
    });
    spark(mid.x, mid.y, WHITE, REDUCE ? 4 : 10 + n);
    var label = '+' + add;
    if (G.combo >= 2) label += ' ×' + G.combo;
    floatText(mid.x, mid.y, label, pal.hi, n >= 8 ? 28 : 20, n >= 6 || G.combo >= 3);
    if (n >= 8) showToast('大爆 ' + n, 'gold');
    else if (G.combo >= 4) showToast('连环 ×' + G.combo, 'gold');

    bumpScore(add);
    syncCombo();
    G.phase = 'pop';
    G.lock = REDUCE ? 0.06 : 0.14;
    G.hover = null;
    return true;
  }

  function tryPopAt(c, r) {
    if (frozen || G.mode !== 'play') return;
    if (G.phase !== 'idle' || G.lock > 0) return;
    var group = groupAt(c, r);
    if (!group.length) return;
    if (group.length < 2) {
      audio.miss();
      missKick();
      screenFlash(MAG, 0.18);
      var t = tileAt(c, r);
      if (t) { t.sx = 0.82; t.sy = 1.12; t.flash = 0.5; }
      floatText(cellCenter(c, r).x, cellCenter(c, r).y, '至少两块', MAG, 14, false);
      showToast('至少两块', 'warn');
      return;
    }
    boomGroup(group);
  }

  function finishPop() {
    var i, t, keep = [];
    for (i = 0; i < G.tiles.length; i++) {
      t = G.tiles[i];
      if (t.pop > 0) {
        t.alive = false;
        continue;
      }
      if (t.alive) keep.push(t);
    }
    G.tiles = keep;
    assignPackedPositions();
    G.landFx = false;
    if (REDUCE) {
      for (i = 0; i < G.tiles.length; i++) {
        t = G.tiles[i];
        t.x = t.tx;
        t.y = t.ty;
        t.vy = 0;
      }
      afterSettle();
      return;
    }
    G.phase = 'fall';
  }

  function finishFall() {
    G.phase = 'shift';
  }

  function tilesSettled(axis) {
    var i, t, d;
    for (i = 0; i < G.tiles.length; i++) {
      t = G.tiles[i];
      if (!t.alive) continue;
      d = axis === 'y' ? Math.abs(t.y - t.ty) : Math.abs(t.x - t.tx);
      if (d > 0.04) return false;
      if (axis === 'y' && t.vy > 1.2) return false;
    }
    return true;
  }

  function pulseHints() {
    var r, c, g, best = [], seen = [];
    for (r = 0; r < ROWS; r++) {
      seen[r] = [];
      for (c = 0; c < COLS; c++) seen[r][c] = 0;
    }
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        if (G.grid[r][c] < 0 || seen[r][c]) continue;
        g = findGroup(G.grid, c, r);
        for (var i = 0; i < g.length; i++) seen[g[i].r][g[i].c] = 1;
        if (g.length > best.length) best = g;
      }
    }
    G.hintGroup = best.length >= 6 ? best : [];
    G.hintPulse = best.length >= 6 ? 1 : 0;
  }

  function afterSettle() {
    G.phase = 'idle';
    G.grid = tilesToGrid(G.tiles);
    occupyCursor();
    pulseHints();
    renderHud();

    var left = countTiles(G.grid);
    var moves = hasMove(G.grid);

    if (G.pendingEnd === 'time') {
      endGame('time');
      return;
    }

    if (G.kind === 'clear') {
      if (left === 0) {
        bumpScore(CLEAR_BONUS);
        audio.clear();
        screenFlash(GOLD, 0.5);
        kick(0, 1, 10);
        showToast('清盘 +' + CLEAR_BONUS, 'gold');
        G.leftover = 0;
        endGame('win');
        return;
      }
      if (!moves) {
        G.leftover = left;
        audio.lose();
        screenFlash(MAG, 0.4);
        missKick();
        showToast('卡住了', 'warn');
        endGame('lose');
        return;
      }
      return;
    }

    if (left === 0) {
      bumpScore(CLEAR_BONUS);
      audio.clear();
      screenFlash(GOLD, 0.42);
      showToast('清盘 +' + CLEAR_BONUS, 'gold');
      G.boards += 1;
      refillBoard('clear');
      return;
    }
    if (!moves) {
      G.combo = 1;
      G.comboT = 0;
      syncCombo();
      showToast('换盘', 'warn');
      audio.miss();
      G.boards += 1;
      refillBoard('stuck');
    }
  }

  function refillBoard(why) {
    G.refillKind = why;
    G.grid = makeBoard();
    G.tiles = spawnTiles(G.grid, !REDUCE);
    G.landFx = false;
    G.lock = 0.05;
    G.phase = REDUCE ? 'idle' : 'fall';
    occupyCursor();
    renderHud();
    if (G.phase === 'idle') pulseHints();
  }

  function endGame(kind) {
    G.mode = 'end';
    G.phase = 'idle';
    G.ticking = false;
    G.pendingEnd = '';
    maybeBest();
    renderHud();
    if (kind === 'win') setOverlay('win');
    else if (kind === 'time') setOverlay('time');
    else setOverlay('lose');
  }

  function startPlay(kind) {
    audio.start();
    G.kind = kind === 'timed' ? 'timed' : 'clear';
    G.mode = 'play';
    G.score = 0;
    G.combo = 1;
    G.maxCombo = 1;
    G.comboT = 0;
    G.time = TIMED_SEC;
    G.ticking = false;
    G.leftover = 0;
    G.pops = 0;
    G.biggest = 0;
    G.boards = 1;
    G.hover = null;
    G.cursor = { c: 3, r: ROWS - 1, on: false };
    G.stop = 0;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.punch = 1;
    G.flash = 0;
    G.lock = 0;
    G.pendingEnd = '';
    G.hintGroup = [];
    G.startBest = currentBest();
    G.landFx = false;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    G.grid = makeBoard();
    G.tiles = spawnTiles(G.grid, !REDUCE);
    G.phase = REDUCE ? 'idle' : 'fall';
    setModeUi(G.kind);
    setOverlay('none');
    try { localStorage.setItem(MODE_KEY, G.kind); } catch (e) { /* ignore */ }
    scoreAdd.hidden = true;
    G.toastT = 0;
    toastEl.classList.add('hidden');
    syncCombo();
    renderHud();
    setHint(G.kind === 'timed'
      ? '六十秒冲分 · 点同色两块以上 · 连环加分'
      : '清光整盘 · 点同色两块以上 · 连环加分');
    occupyCursor();
    if (G.phase === 'idle') pulseHints();
    canvas.focus();
  }

  function retry() {
    audio.ensure();
    startPlay(G.kind === 'timed' ? 'timed' : 'clear');
  }

  function roundRect(x, y, w, h, r) {
    var rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawTile(t, highlight, lone) {
    var pal = PAL[t.color] || PAL[0];
    var p = cellPx(t.x, t.y);
    var cx = p.x + tileS * 0.5;
    var cy = p.y + tileS * 0.5;
    var popK = t.pop > 0 ? clamp(1 - t.pop / 0.16, 0, 1) : 1;
    var sx = tileS * t.sx * (0.2 + 0.8 * popK);
    var sy = tileS * t.sy * (0.2 + 0.8 * popK);
    var x = cx - sx * 0.5;
    var y = cy - sy * 0.5;
    var rad = Math.max(3, sx * 0.22);
    var breathe = REDUCE ? 0 : Math.sin(G.clock * 2.2 + t.c * 0.7 + t.r * 0.5) * 0.012;
    if (t.pop === 0) {
      sx *= 1 + breathe;
      sy *= 1 - breathe * 0.6;
      x = cx - sx * 0.5;
      y = cy - sy * 0.5;
    }
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.65 * popK;
    if (t.pop === 0) {
      ctx.shadowColor = pal.glow;
      ctx.shadowBlur = highlight ? 18 : 8;
    }
    var fill = pal.rgb;
    if (t.flash > 0) fill = mix(fill, WHITE, Math.min(1, t.flash));
    if (highlight) fill = mix(fill, WHITE, 0.18);
    var grd = ctx.createLinearGradient(x, y, x, y + sy);
    grd.addColorStop(0, rgba(pal.hi, 1));
    grd.addColorStop(0.22, rgba(fill, 1));
    grd.addColorStop(1, rgba(pal.lo, 1));
    roundRect(x, y, sx, sy, rad);
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(pal.hi, highlight ? 0.85 : 0.35);
    ctx.lineWidth = highlight ? 2.2 : 1;
    ctx.stroke();
    ctx.fillStyle = rgba(WHITE, 0.18 + (highlight ? 0.12 : 0));
    roundRect(x + sx * 0.12, y + sy * 0.1, sx * 0.5, sy * 0.22, rad * 0.5);
    ctx.fill();
    if (lone) {
      ctx.strokeStyle = rgba(MAG, 0.55);
      ctx.lineWidth = 1.4;
      roundRect(x - 1, y - 1, sx + 2, sy + 2, rad + 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function inGroupMap(group) {
    var map = {};
    var i;
    for (i = 0; i < group.length; i++) map[group[i].c + ',' + group[i].r] = 1;
    return map;
  }

  function draw() {
    var i, p, t, a, k;
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, W, H);

    var glow = ctx.createRadialGradient(W * 0.5, H * 0.2, 10, W * 0.5, H * 0.45, Math.max(W, H) * 0.7);
    glow.addColorStop(0, 'rgba(180,108,255,0.1)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    for (i = 0; i < motes.length; i++) {
      p = motes[i];
      ctx.fillStyle = rgba(p.rgb, p.a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.s, 0, TAU);
      ctx.fill();
    }

    ctx.save();
    var skx = (Math.random() * 2 - 1) * G.shake * 0.35 + G.kickX;
    var sky = (Math.random() * 2 - 1) * G.shake * 0.35 + G.kickY;
    ctx.translate(skx, sky);
    var punch = G.punch;
    ctx.translate(W * 0.5, H * 0.5);
    ctx.scale(punch, punch);
    ctx.translate(-W * 0.5, -H * 0.5);

    roundRect(boardX - 8, boardY - 8, boardW + 16, boardH + 16, 14);
    ctx.fillStyle = 'rgba(12,6,20,0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180,108,255,0.32)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    var r, c, q;
    for (r = 0; r < ROWS; r++) {
      for (c = 0; c < COLS; c++) {
        q = cellPx(c, r);
        roundRect(q.x, q.y, tileS, tileS, Math.max(3, tileS * 0.18));
        ctx.fillStyle = 'rgba(180,108,255,0.045)';
        ctx.fill();
      }
    }

    var hoverG = [];
    if (G.mode === 'play' && G.phase === 'idle' && !frozen) {
      if (G.hover && G.grid[G.hover.r] && G.grid[G.hover.r][G.hover.c] >= 0) {
        hoverG = findGroup(G.grid, G.hover.c, G.hover.r);
      } else if (G.cursor.on && G.grid[G.cursor.r] && G.grid[G.cursor.r][G.cursor.c] >= 0) {
        hoverG = findGroup(G.grid, G.cursor.c, G.cursor.r);
      }
    }
    var hmap = inGroupMap(hoverG);
    var hintMap = G.hintPulse > 0 ? inGroupMap(G.hintGroup) : {};

    var list = G.tiles.slice();
    list.sort(function (a, b) { return a.r - b.r || a.c - b.c; });
    for (i = 0; i < list.length; i++) {
      t = list[i];
      if (!t.alive) continue;
      var key = t.c + ',' + t.r;
      drawTile(t, !!hmap[key], hoverG.length === 1 && !!hmap[key]);
      if (hintMap[key] && t.pop === 0) {
        q = cellPx(t.x, t.y);
        ctx.strokeStyle = rgba(GOLD, 0.22 + 0.28 * G.hintPulse);
        ctx.lineWidth = 1.5;
        roundRect(q.x - 1, q.y - 1, tileS + 2, tileS + 2, Math.max(3, tileS * 0.2));
        ctx.stroke();
      }
    }

    if (hoverG.length >= 2 && G.phase === 'idle') {
      var mid = centroid(hoverG);
      var prev = scorePop(hoverG.length, G.comboT > 0 ? G.combo + 1 : 1);
      ctx.font = '700 ' + Math.max(12, tileS * 0.38) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(WHITE, 0.92);
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 8;
      ctx.fillText(hoverG.length + ' · +' + prev, mid.x, mid.y);
      ctx.shadowBlur = 0;
    }

    if (G.cursor.on && G.mode === 'play' && !frozen) {
      q = cellPx(G.cursor.c, G.cursor.r);
      ctx.strokeStyle = rgba(CYN, 0.9);
      ctx.lineWidth = 2.2;
      roundRect(q.x - 2, q.y - 2, tileS + 4, tileS + 4, Math.max(4, tileS * 0.22));
      ctx.stroke();
    }

    for (i = 0; i < rings.length; i++) {
      p = rings[i];
      k = p.t / p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, lerp(p.r0, p.r1, k), 0, TAU);
      ctx.strokeStyle = rgba(p.rgb, 0.7 * (1 - k));
      ctx.lineWidth = 3 * (1 - k);
      ctx.stroke();
    }
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      a = p.life / p.max;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = rgba(p.rgb, 0.2 + 0.8 * a);
      ctx.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9);
      ctx.restore();
    }
    for (i = 0; i < sparks.length; i++) {
      p = sparks[i];
      a = p.life / p.max;
      ctx.strokeStyle = rgba(p.rgb, a);
      ctx.lineWidth = p.w * a;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.018, p.y - p.vy * 0.018);
      ctx.stroke();
    }
    for (i = 0; i < floats.length; i++) {
      p = floats[i];
      k = p.t / p.life;
      ctx.globalAlpha = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      ctx.font = (p.gold ? '800 ' : '700 ') + p.size + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = rgba(p.gold ? GOLD : p.rgb, 1);
      ctx.shadowColor = rgba(p.rgb, 0.6);
      ctx.shadowBlur = 10;
      ctx.fillText(p.text, p.x, p.y);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(0, 0, W, H);
    }

    if (G.combo >= 2 && G.mode === 'play') {
      var barW = 120;
      var barH = 4;
      var bx = W * 0.5 - barW * 0.5;
      var by = Math.max(8, boardY - 14);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      roundRect(bx, by, barW, barH, 2);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      roundRect(bx, by, barW * clamp(G.comboT / COMBO_WIN, 0, 1), barH, 2);
      ctx.fill();
    }
  }

  function stepFx(dt) {
    var i, p;
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && !toastEl.classList.contains('hidden')) toastEl.classList.add('hidden');
    G.flash = Math.max(0, G.flash - dt * 2.6);
    G.shake *= Math.pow(0.0004, dt);
    if (G.shake < 0.12) G.shake = 0;
    G.kickX *= Math.pow(0.0008, dt);
    G.kickY *= Math.pow(0.0008, dt);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.00025, dt));
    G.hintPulse = Math.max(0, G.hintPulse - dt * 0.55);

    for (i = 0; i < motes.length; i++) {
      p = motes[i];
      p.y -= p.v * dt;
      if (p.y < -6) { p.y = H + 6; p.x = rand(0, W); }
    }
    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.985;
      p.rot += p.spin * dt;
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      p = sparks[i];
      p.life -= dt;
      if (p.life <= 0) { sparks.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.9;
      p.vy *= 0.9;
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t >= rings[i].life) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      p = floats[i];
      p.t += dt;
      p.y += p.vy * dt;
      if (p.t >= p.life) floats.splice(i, 1);
    }
  }

  function stepTiles(dt) {
    var i, t, anyLand = 0, heavy = 0;
    for (i = 0; i < G.tiles.length; i++) {
      t = G.tiles[i];
      if (!t.alive) continue;
      t.sx = lerp(t.sx, 1, 1 - Math.pow(0.00012, dt));
      t.sy = lerp(t.sy, 1, 1 - Math.pow(0.00012, dt));
      t.flash = Math.max(0, t.flash - dt * 3.2);
      if (t.pop > 0) {
        t.pop += dt;
        t.sx = lerp(t.sx, 1.45, 0.4);
        t.sy = lerp(t.sy, 1.45, 0.4);
      }
      if (G.phase === 'fall') {
        if (t.y < t.ty - 0.02) {
          t.vy += 90 * dt;
          if (t.vy > 32) t.vy = 32;
          t.y += t.vy * dt;
          if (t.y >= t.ty) {
            t.y = t.ty;
            if (t.vy > 6 || t.drop >= 2) {
              t.sy = 0.68;
              t.sx = 1.22;
              anyLand += 1;
              if (t.drop >= 2) heavy += 1;
            }
            t.vy = 0;
            t.drop = 0;
          }
        } else {
          t.y = t.ty;
          t.vy = 0;
        }
      } else if (G.phase === 'shift') {
        var dx = t.tx - t.x;
        var stepX = 28 * dt;
        if (Math.abs(dx) <= stepX) {
          if (t.x !== t.tx) {
            t.sx = 1.1;
            t.sy = 0.92;
          }
          t.x = t.tx;
        } else t.x += dx > 0 ? stepX : -stepX;
        t.y = t.ty;
        t.vy = 0;
      } else {
        t.x = lerp(t.x, t.tx, 1 - Math.pow(0.0003, dt));
        t.y = lerp(t.y, t.ty, 1 - Math.pow(0.0003, dt));
      }
    }
    if (anyLand && G.phase === 'fall' && !G.landFx && G.mode === 'play') {
      audio.land(heavy > 0);
      G.landFx = true;
      if (heavy > 0) kick(0, 1, 3.2);
    }
  }

  function update(dt) {
    G.clock += dt;
    G.lock = Math.max(0, G.lock - dt);
    stepFx(dt);

    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }

    if (G.mode === 'play' && !frozen) {
      if (G.comboT > 0) {
        G.comboT -= dt;
        if (G.comboT <= 0) {
          G.combo = 1;
          syncCombo();
        }
      }
      if (G.kind === 'timed' && G.ticking) {
        var prev = G.time;
        G.time -= dt;
        if (G.time < 10 && Math.ceil(G.time) !== Math.ceil(prev) && G.time > 0) audio.tick();
        if (G.time <= 0) {
          G.time = 0;
          G.ticking = false;
          if (G.phase === 'idle' && G.lock <= 0) endGame('time');
          else G.pendingEnd = 'time';
        }
        timeEl.textContent = String(Math.ceil(Math.max(0, G.time)));
        timeBox.classList.toggle('low', G.ticking && G.time < 10);
      }
    }

    if (G.mode === 'play' || G.mode === 'end' || G.mode === 'title') stepTiles(dt);

    if (G.mode === 'play' && !frozen) {
      if (G.phase === 'pop') {
        var popping = false;
        var i, t;
        for (i = 0; i < G.tiles.length; i++) {
          t = G.tiles[i];
          if (t.alive && t.pop > 0 && t.pop < 0.15) popping = true;
        }
        if (!popping && G.lock <= 0) finishPop();
      } else if (G.phase === 'fall') {
        if (tilesSettled('y')) finishFall();
      } else if (G.phase === 'shift') {
        if (tilesSettled('x')) afterSettle();
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) { last = now; return; }
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    var steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
  }

  function onPointerMove(ev) {
    if (frozen || G.mode !== 'play' || G.phase !== 'idle') {
      G.hover = null;
      return;
    }
    var cellp = pointerCell(ev);
    G.hover = cellp;
    if (cellp) G.cursor.on = false;
  }

  function onPointerDown(ev) {
    if (ev.button != null && ev.button !== 0) return;
    audio.ensure();
    if (overlayKind === 'title') return;
    if (frozen && overlayKind !== 'none') {
      if (ev.target === overlay) setOverlay('none');
      return;
    }
    if (G.mode !== 'play') return;
    var cellp = pointerCell(ev);
    if (!cellp) return;
    G.cursor.c = cellp.c;
    G.cursor.r = cellp.r;
    G.cursor.on = false;
    tryPopAt(cellp.c, cellp.r);
    ev.preventDefault();
  }

  function onKey(ev) {
    var k = ev.key;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      ev.preventDefault();
      return;
    }
    if (k === 'r' || k === 'R') {
      retry();
      ev.preventDefault();
      return;
    }
    audio.ensure();
    if (k === ' ' || k === 'Enter') {
      ev.preventDefault();
      if (overlayKind === 'title') { startPlay('clear'); return; }
      if (overlayKind !== 'none' && overlayKind !== 'title') { retry(); return; }
      if (G.mode === 'play' && G.phase === 'idle') {
        occupyCursor();
        G.cursor.on = true;
        tryPopAt(G.cursor.c, G.cursor.r);
      }
      return;
    }
    if (frozen || G.mode !== 'play' || G.phase !== 'idle') return;
    var dc = 0, dr = 0;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') dc = -1;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') dc = 1;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') dr = -1;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') dr = 1;
    if (dc || dr) {
      ev.preventDefault();
      occupyCursor();
      moveCursor(dc, dr);
    }
  }

  function boot() {
    loadBest();
    try {
      if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
    } catch (e) { /* ignore */ }
    var kind = 'clear';
    try {
      var m = localStorage.getItem(MODE_KEY);
      if (m === 'timed') kind = 'timed';
    } catch (e) { /* ignore */ }
    G.kind = kind;
    setModeUi(kind);
    G.grid = makeBoard();
    G.tiles = spawnTiles(G.grid, true);
    G.mode = 'title';
    G.phase = 'fall';
    renderHud();
    setOverlay('title');
    resize();
    last = performance.now();
    requestAnimationFrame(frame);

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (!hidden) last = performance.now();
    });
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', function () { G.hover = null; });
    overlay.addEventListener('pointerdown', function (ev) {
      if (ev.target === overlay && overlayKind !== 'title') setOverlay('none');
    });
    document.addEventListener('keydown', onKey);
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
    btnRetry.addEventListener('click', retry);
    modeClearBtn.addEventListener('click', function () {
      if (G.kind === 'clear' && G.mode === 'play' && overlayKind === 'none') return;
      startPlay('clear');
    });
    modeTimedBtn.addEventListener('click', function () {
      if (G.kind === 'timed' && G.mode === 'play' && overlayKind === 'none') return;
      startPlay('timed');
    });
    ovClear.addEventListener('click', function () { startPlay('clear'); });
    ovTimed.addEventListener('click', function () { startPlay('timed'); });
  }

  boot();
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
