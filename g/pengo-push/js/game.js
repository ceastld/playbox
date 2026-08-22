'use strict';

(function () {
  const COLS = 13;
  const ROWS = 11;
  const EMPTY = 0;
  const WALL = 1;
  const ICE = 2;
  const DIAMOND = 3;
  const EGG = 4;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const WALK_T = 0.108;
  const SLIDE_SPD = 15.2;
  const SWIPE = 24;
  const BEST_KEY = 'playbox-pengo-push-best';
  const MUTE_KEY = 'playbox-pengo-push-mute';
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const CRUSH_PTS = [400, 1600, 3200, 6400];
  const OPS = '方向键 / WASD 走 · 空格推块或踢墙 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const ICEC = [122, 246, 255];
  const TEAL = [26, 224, 255];
  const LIME = [61, 255, 136];

  function M(rows) {
    const wall = '#############';
    if (rows.length !== ROWS - 2) throw new Error('stage rows ' + rows.length);
    const out = [wall];
    for (let i = 0; i < rows.length; i++) {
      const s = rows[i];
      if (s.length !== COLS - 2) throw new Error('len ' + s.length + ' [' + s + ']');
      out.push('#' + s + '#');
    }
    out.push(wall);
    return out;
  }

  const STAGES = [
    {
      name: '初推',
      sub: 'PUSH',
      hint: '空格推冰块，把雪蜂碾在墙上',
      hatch: 18,
      map: M([
        '@  I   I   ',
        ' I   I   I ',
        '  I D I    ',
        ' I       I ',
        '  B   B    ',
        ' I       I ',
        '  I D I    ',
        ' I   I   I ',
        '  I   D    '
      ])
    },
    {
      name: '夹道',
      sub: 'LANE',
      hint: '巷子里推，别把自己堵住',
      hatch: 16,
      map: M([
        '@I I  I  I ',
        ' I I    I I',
        '  D  I     ',
        'I I I I I I',
        ' B  I   B  ',
        'I I I I I I',
        '    I  D   ',
        ' I I    I I',
        'I  I D  I  '
      ])
    },
    {
      name: '钻列',
      sub: 'GEM',
      hint: '三颗钻推成一条线，大奖加全晕',
      hatch: 15,
      map: M([
        '@   I I   I',
        ' I I   I I ',
        'D  I I I  D',
        '  I  B  I  ',
        ' I I I I I ',
        '  I  B  I  ',
        'I   I I   I',
        '  I     I  ',
        ' I  D  I I '
      ])
    },
    {
      name: '蜂口',
      sub: 'HIVE',
      hint: '蜂多了，先踢墙再碾',
      hatch: 14,
      map: M([
        '@ I I I I I',
        'I   I   I  ',
        ' I B I B I ',
        'I   D   I  ',
        '  I I I I  ',
        'I   D   I  ',
        ' I B I B I ',
        'I   I   I  ',
        ' I I D I I '
      ])
    },
    {
      name: '卵冰',
      sub: 'EGG',
      hint: '卵冰要在孵出前砸掉',
      hatch: 12,
      map: M([
        '@  I E I   ',
        ' I  I I  I ',
        '  D   I    ',
        ' I E B E I ',
        'I   I I   I',
        ' I B   B I ',
        '  I   D    ',
        ' I I E I I ',
        'I   D   I  '
      ])
    },
    {
      name: '冰牢',
      sub: 'CAGE',
      hint: '砸开通道，再找碾点',
      hatch: 11,
      map: M([
        '@I I I I  I',
        'I I   I I I',
        ' I D I   I ',
        'I I I I I I',
        '  B  I  B  ',
        'I I I I I I',
        ' I   I D I ',
        'I I   I I I',
        'I  B I D I '
      ])
    },
    {
      name: '狂舞',
      sub: 'SWARM',
      hint: '别被围住，踢墙找空档',
      hatch: 10,
      map: M([
        '@ I   I I I',
        ' I B I   I ',
        'I  I D I  I',
        '  B   I B  ',
        ' I I I I I ',
        '  B I   B  ',
        'I  I D I  I',
        ' I   I B I ',
        'I I I   D I'
      ])
    },
    {
      name: '终原',
      sub: 'PEAK',
      hint: '最后一面，排钻清场',
      hatch: 9,
      map: M([
        '@I I E I I ',
        ' I B I B I ',
        'I D I I I I',
        ' I I   I I ',
        'E  B I B  E',
        ' I I   I I ',
        'I I I I D I',
        ' I B I B I ',
        'I I E I D I'
      ])
    }
  ];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }
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
  function idx(c, r) {
    return r * COLS + c;
  }
  function inb(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }

  function diamondLine(ds) {
    if (!ds || ds.length !== 3) return false;
    const a = ds.slice().sort(function (p, q) {
      return p.r === q.r ? p.c - q.c : p.r - q.r;
    });
    const sameR = a[0].r === a[1].r && a[1].r === a[2].r;
    const sameC = a[0].c === a[1].c && a[1].c === a[2].c;
    if (sameR) return a[1].c === a[0].c + 1 && a[2].c === a[1].c + 1;
    if (sameC) return a[1].r === a[0].r + 1 && a[2].r === a[1].r + 1;
    return false;
  }

  function parseMap(rows) {
    const grid = new Uint8Array(COLS * ROWS);
    const hatch = new Float32Array(COLS * ROWS);
    const bees = [];
    let player = { c: 1, r: 1 };
    let diamonds = 0;
    for (let r = 0; r < ROWS; r++) {
      const row = rows[r];
      for (let c = 0; c < COLS; c++) {
        const ch = row.charAt(c);
        const i = idx(c, r);
        if (ch === '#') grid[i] = WALL;
        else if (ch === 'I') grid[i] = ICE;
        else if (ch === 'D') {
          grid[i] = DIAMOND;
          diamonds += 1;
        } else if (ch === 'E') grid[i] = EGG;
        else if (ch === '@') {
          grid[i] = EMPTY;
          player = { c: c, r: r };
        } else if (ch === 'B') {
          grid[i] = EMPTY;
          bees.push({ c: c, r: r });
        } else grid[i] = EMPTY;
      }
    }
    return { grid: grid, hatch: hatch, bees: bees, player: player, diamonds: diamonds };
  }

  function slidePath(grid, c, r, dc, dr) {
    const path = [];
    let x = c;
    let y = r;
    for (let n = 0; n < COLS + ROWS; n++) {
      const nx = x + dc;
      const ny = y + dr;
      if (!inb(nx, ny)) break;
      const t = grid[idx(nx, ny)];
      if (t === WALL || t === ICE || t === DIAMOND || t === EGG) break;
      x = nx;
      y = ny;
      path.push({ c: x, r: y });
    }
    return { c: x, r: y, path: path };
  }

  function selfCheck() {
    if (STAGES.length !== 8) throw new Error('need 8 stages');
    for (let i = 0; i < STAGES.length; i++) {
      const parsed = parseMap(STAGES[i].map);
      if (parsed.diamonds !== 3) throw new Error('diamonds ' + i);
      if (parsed.grid[idx(parsed.player.c, parsed.player.r)] !== EMPTY) {
        throw new Error('player blocked ' + i);
      }
      if (parsed.grid[idx(0, 0)] !== WALL || parsed.grid[idx(COLS - 1, ROWS - 1)] !== WALL) {
        throw new Error('outer wall ' + i);
      }
      if (parsed.bees.length < 1) throw new Error('no bees ' + i);
      const ds = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (parsed.grid[idx(c, r)] === DIAMOND) ds.push({ c: c, r: r });
        }
      }
      if (diamondLine(ds)) throw new Error('start aligned ' + i);
    }
    if (!diamondLine([{ c: 2, r: 3 }, { c: 3, r: 3 }, { c: 4, r: 3 }])) {
      throw new Error('row line');
    }
    if (!diamondLine([{ c: 5, r: 1 }, { c: 5, r: 2 }, { c: 5, r: 3 }])) {
      throw new Error('col line');
    }
    if (diamondLine([{ c: 2, r: 3 }, { c: 4, r: 3 }, { c: 5, r: 3 }])) {
      throw new Error('gapped row must fail');
    }
    if (diamondLine([{ c: 1, r: 1 }, { c: 2, r: 2 }, { c: 3, r: 3 }])) {
      throw new Error('diag must fail');
    }
    const g = new Uint8Array(COLS * ROWS);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (c === 0 || r === 0 || c === COLS - 1 || r === ROWS - 1) g[idx(c, r)] = WALL;
      }
    }
    g[idx(2, 1)] = ICE;
    g[idx(8, 1)] = ICE;
    const sl = slidePath(g, 2, 1, 1, 0);
    if (sl.c !== 7 || sl.path.length !== 5) throw new Error('slide stop');
    const crush = sl.path.some(function (p) { return p.c === 5 && p.r === 1; });
    if (!crush) throw new Error('crush path must include mid cell');
    return true;
  }

  selfCheck();

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
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
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
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
    whoosh() {
      this.ensure();
      this.noise(0.09, 0.04, 500);
      this.beep(420, 0.12, 'triangle', 0.04, 180);
    },
    smash() {
      this.ensure();
      this.noise(0.08, 0.05, 900);
      this.beep(620, 0.07, 'square', 0.035, 160);
    },
    crush(n) {
      this.ensure();
      const k = Math.max(1, n || 1);
      this.noise(0.1 + k * 0.02, 0.06, 280);
      this.beep(180 + k * 40, 0.14, 'sawtooth', 0.055, 70);
      this.beep(90, 0.16, 'sine', 0.05, 40);
    },
    kick() {
      this.ensure();
      this.noise(0.08, 0.05, 200);
      this.beep(110, 0.14, 'sine', 0.06, 48);
      this.beep(330, 0.06, 'square', 0.03, 120);
    },
    chime() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.055);
      this.beep(659, 0.14, 'sine', 0.05);
      this.beep(784, 0.16, 'triangle', 0.05);
      this.beep(1046, 0.28, 'sine', 0.06, 1320);
    },
    egg() {
      this.ensure();
      this.beep(880, 0.08, 'square', 0.04, 220);
      this.beep(440, 0.12, 'triangle', 0.035, 180);
    },
    hatch() {
      this.ensure();
      this.beep(240, 0.1, 'sawtooth', 0.04, 420);
      this.noise(0.06, 0.03, 600);
    },
    stun() {
      this.ensure();
      this.beep(760, 0.08, 'sine', 0.04, 220);
    },
    hurt() {
      this.ensure();
      this.beep(180, 0.16, 'sawtooth', 0.05, 70);
      this.noise(0.1, 0.04, 500);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.055);
      this.beep(659, 0.12, 'sine', 0.05);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.28, 'triangle', 0.055, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.28, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 784);
    },
    bump() {
      this.ensure();
      this.beep(160, 0.05, 'triangle', 0.03, 90);
    }
  };

  if (!hasDom) {
    console.log('pengo-push ok');
    return;
  }

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const btnCampaign = el('btn-campaign');
  const btnSwarm = el('btn-swarm');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const modeCamp = el('mode-camp');
  const modeSwarm = el('mode-swarm');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
  const hintEl = el('hint');
  const stageEl = el('stage');
  const padBtns = {
    up: el('btn-up'),
    down: el('btn-down'),
    left: el('btn-left'),
    right: el('btn-right'),
    push: el('btn-push')
  };

  let W = 1;
  let H = 1;
  let dpr = 1;
  let cell = 32;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;

  const keys = { u: false, d: false, l: false, r: false };
  let lastDir = 1;
  const ptr = { down: false, id: null, sx: 0, sy: 0, x: 0, y: 0, dragging: false, dir: -1 };
  const pips = [];
  const particles = [];
  const pops = [];

  const G = {
    mode: 'title',
    kind: 'campaign',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 1,
    comboT: 0,
    grid: new Uint8Array(COLS * ROWS),
    hatch: new Float32Array(COLS * ROWS),
    slides: [],
    bees: [],
    player: {
      c: 1, r: 1, x: 1, y: 1, fc: 1, fr: 0,
      fromC: 1, fromR: 1, lock: 0, squash: 0, spawnC: 1, spawnR: 1
    },
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: TEAL,
    toastT: 0,
    kick: { dc: 0, dr: 0, t: 0 },
    gemOn: false,
    angry: false,
    roundT: 50,
    dead: false,
    actCd: 0,
    hatch0: 16
  };

  function loadBest() {
    try {
      const n = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);
      G.best = isFinite(n) && n > 0 ? n : 0;
    } catch (err) {
      G.best = 0;
    }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function saveBest() {
    if (G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n, x, y) {
    if (n <= 0) return;
    if (G.mode !== 'play' && G.mode !== 'win') return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (scoreBox && scoreAdd) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
      addTok += 1;
      const tok = addTok;
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      scoreAdd.style.animation = 'none';
      void scoreAdd.offsetWidth;
      scoreAdd.style.animation = '';
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    if (x != null) spawnPop(x, y, '+' + n, n >= 1000 ? GOLD : ICEC);
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.45;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < LIVES) {
      const iel = document.createElement('i');
      iel.className = 'pip on';
      pipsEl.appendChild(iel);
      pips.push(iel);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncModes() {
    if (modeCamp) modeCamp.setAttribute('aria-pressed', G.kind === 'campaign' ? 'true' : 'false');
    if (modeSwarm) modeSwarm.setAttribute('aria-pressed', G.kind === 'swarm' ? 'true' : 'false');
  }

  function beeCount() {
    let n = 0;
    for (let i = 0; i < G.bees.length; i++) if (!G.bees[i].dead) n += 1;
    return n;
  }

  function eggCount() {
    let n = 0;
    for (let i = 0; i < G.grid.length; i++) if (G.grid[i] === EGG) n += 1;
    for (let i = 0; i < G.slides.length; i++) if (G.slides[i].kind === EGG) n += 1;
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const bees = beeCount();
    const eggs = eggCount();
    const time = Math.max(0, Math.ceil(G.roundT));
    if (tagLabel) {
      let t = '蜂 ' + bees;
      if (eggs) t += ' · 卵 ' + eggs;
      if (G.mode === 'play') t += ' · ' + time + 's';
      if (G.gemOn) t += ' · 钻齐';
      tagLabel.textContent = t;
      tagLabel.classList.toggle('warn', G.angry || time <= 8);
    }
    if (stageLabel) {
      const st = STAGES[G.stage] || STAGES[0];
      const modeName = G.kind === 'swarm' ? '狂蜂' : '冰原';
      if (G.mode === 'title') stageLabel.textContent = modeName;
      else stageLabel.textContent = modeName + ' ' + (G.stage + 1) + '/' + STAGES.length + ' · ' + st.name;
      stageLabel.classList.toggle('hot', G.combo >= 2);
    }
    if (comboEl) comboEl.textContent = '×' + G.combo;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.comboT > 0);
    syncPips();
    syncModes();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function showOverlay(kind) {
    if (!overlay || !panel) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind !== 'title');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind === 'title') {
      if (ovKicker) ovKicker.textContent = 'PENGO';
      if (ovTitle) ovTitle.textContent = '推冰';
      if (ovLead) ovLead.innerHTML = '推冰块，碾雪蜂。贴墙踢一脚震晕邻蜂。<br />三颗钻排成一线有大奖。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (G.stage >= STAGES.length - 1) {
        if (ovTitle) ovTitle.textContent = G.kind === 'swarm' ? '蜂潮平了' : '冰原肃清';
        if (ovLead) ovLead.textContent = '八面都清了。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '') + '。';
        if (ovAgain) ovAgain.textContent = '再来一轮';
      } else {
        if (ovTitle) ovTitle.textContent = '面清了';
        const st = STAGES[G.stage] || STAGES[0];
        if (ovLead) ovLead.textContent = st.name + ' 的雪蜂全灭。下一面更密。';
        if (ovAgain) ovAgain.textContent = '下一关';
      }
      if (ovOps) ovOps.textContent = 'R 重开 · 空格下一关';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = '冻僵了';
      if (ovLead) ovLead.textContent = (G.kind === 'swarm' ? '狂蜂里 ' : '') + '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    }
  }

  function kickBoard(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function hitStop(ms) {
    if (REDUCE) return;
    const t = clamp(ms / 1000, 0.03, 0.08);
    G.stop = Math.max(G.stop, t);
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        t: spec.life,
        life: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
  }

  function spawnPop(x, y, text, rgb) {
    pops.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85, life: 0.85 });
  }

  function showChain(n) {
    if (n < 2) return;
    if (comboEl) comboEl.textContent = '×' + n;
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (chainPop && !REDUCE) {
      chainTok += 1;
      const tok = chainTok;
      chainPop.textContent = '碾碎 ×' + n;
      chainPop.classList.remove('hidden');
      chainPop.style.animation = 'none';
      void chainPop.offsetWidth;
      chainPop.style.animation = '';
      setTimeout(function () {
        if (tok === chainTok) chainPop.classList.add('hidden');
      }, 720);
    } else {
      toast('碾碎 ×' + n, false, true);
    }
  }

  function tile(c, r) {
    if (!inb(c, r)) return WALL;
    return G.grid[idx(c, r)];
  }

  function isBlock(t) {
    return t === ICE || t === DIAMOND || t === EGG || t === WALL;
  }

  function slideOccupies(c, r) {
    for (let i = 0; i < G.slides.length; i++) {
      const s = G.slides[i];
      if (s.c === c && s.r === r) return true;
      if (s.prog > 0.4 && s.c + s.dc === c && s.r + s.dr === r) return true;
    }
    return false;
  }

  function blockedForWalk(c, r) {
    if (!inb(c, r)) return true;
    if (isBlock(tile(c, r))) return true;
    if (slideOccupies(c, r)) return true;
    return false;
  }

  function blockedForSlide(c, r) {
    if (!inb(c, r)) return true;
    if (isBlock(tile(c, r))) return true;
    for (let i = 0; i < G.slides.length; i++) {
      const s = G.slides[i];
      if (s.c === c && s.r === r) return true;
    }
    return false;
  }

  function beeAt(c, r) {
    for (let i = 0; i < G.bees.length; i++) {
      const b = G.bees[i];
      if (b.dead) continue;
      if (Math.abs(b.x - c) < 0.58 && Math.abs(b.y - r) < 0.58) return b;
      if (b.c === c && b.r === r) return b;
    }
    return null;
  }

  function stunBee(b, dur) {
    if (!b || b.dead) return;
    b.stun = Math.max(b.stun, dur);
    b.eat = 0;
    b.eatC = -1;
  }

  function stunTime() {
    const base = G.kind === 'swarm' ? 2.35 : 4.15;
    return G.angry ? base * 0.7 : base;
  }

  function beeSpeed() {
    const st = G.stage;
    let spd = 1.72 + st * 0.2;
    if (G.kind === 'swarm') spd *= 1.65;
    if (G.angry) spd *= 1.48;
    return spd;
  }

  function faceFromDir(dir) {
    G.player.fc = DX[dir];
    G.player.fr = DY[dir];
    lastDir = dir;
  }

  function wishDir() {
    if (ptr.down && ptr.dragging && ptr.dir >= 0) return ptr.dir;
    if (lastDir === 0 && keys.u) return 0;
    if (lastDir === 1 && keys.r) return 1;
    if (lastDir === 2 && keys.d) return 2;
    if (lastDir === 3 && keys.l) return 3;
    if (keys.u) return 0;
    if (keys.r) return 1;
    if (keys.d) return 2;
    if (keys.l) return 3;
    return -1;
  }

  function snapPlayer() {
    G.player.x = G.player.c;
    G.player.y = G.player.r;
    G.player.fromC = G.player.c;
    G.player.fromR = G.player.r;
    G.player.lock = 0;
  }

  function tryWalk(dir) {
    if (G.mode !== 'play' || G.dead) return;
    if (G.player.lock > 0.02) return;
    snapPlayer();
    faceFromDir(dir);
    const nc = G.player.c + DX[dir];
    const nr = G.player.r + DY[dir];
    if (blockedForWalk(nc, nr)) return;
    G.player.fromC = G.player.c;
    G.player.fromR = G.player.r;
    G.player.c = nc;
    G.player.r = nr;
    G.player.lock = WALK_T;
  }

  function iceBurst(c, r, rgb, n) {
    emit(n || 14, {
      x: c, y: r, j: 0.22,
      vx0: -4.2, vx1: 4.2, vy0: -5.5, vy1: 1.4,
      life: 0.42, r0: 0.05, r1: 0.14, rgb: rgb || ICEC, g: 9
    });
  }

  function smashAt(c, r) {
    const t = tile(c, r);
    if (t !== ICE && t !== EGG) return false;
    const i = idx(c, r);
    G.grid[i] = EMPTY;
    G.hatch[i] = 0;
    audio.smash();
    iceBurst(c, r, t === EGG ? MAG : ICEC, t === EGG ? 18 : 12);
    G.player.squash = 1;
    hitStop(32);
    if (t === EGG) {
      addScore(500, c, r);
      toast('灭卵', false, true);
      audio.egg();
    } else {
      addScore(30, c, r);
    }
    return true;
  }

  function startSlide(c, r, dc, dr) {
    const t = tile(c, r);
    if (t !== ICE && t !== DIAMOND && t !== EGG) return;
    const i = idx(c, r);
    const hatch = G.hatch[i];
    G.grid[i] = EMPTY;
    G.hatch[i] = 0;
    G.slides.push({
      kind: t,
      c: c,
      r: r,
      dc: dc,
      dr: dr,
      prog: 0,
      crush: 0,
      hatch: hatch,
      squash: 1
    });
    audio.whoosh();
    G.player.squash = 1;
    iceBurst(c, r, t === DIAMOND ? MAG : ICEC, 6);
  }

  function bump() {
    audio.bump();
    G.player.squash = 0.7;
  }

  function kickWall() {
    if (G.actCd > 0) return;
    G.actCd = 0.28;
    const dc = G.player.fc;
    const dr = G.player.fr;
    G.kick.dc = dc;
    G.kick.dr = dr;
    G.kick.t = 0.34;
    if (!REDUCE) G.shake = Math.max(G.shake, 10);
    audio.kick();
    kickBoard('boom');
    hitStop(40);
    G.player.squash = 1;
    const dur = stunTime();
    let n = 0;
    for (let i = 0; i < G.bees.length; i++) {
      const b = G.bees[i];
      if (b.dead) continue;
      const c = Math.round(b.x);
      const r = Math.round(b.y);
      let hit = false;
      if (dc === -1 && c === 1) hit = true;
      if (dc === 1 && c === COLS - 2) hit = true;
      if (dr === -1 && r === 1) hit = true;
      if (dr === 1 && r === ROWS - 2) hit = true;
      const wc = G.player.c + dc;
      const wr = G.player.r + dr;
      if (Math.max(Math.abs(c - wc), Math.abs(r - wr)) <= 2) hit = true;
      if (hit) {
        stunBee(b, dur);
        n += 1;
        emit(8, {
          x: b.x, y: b.y, j: 0.15,
          vx0: -2, vx1: 2, vy0: -3, vy1: 1,
          life: 0.35, r0: 0.04, r1: 0.1, rgb: CYN, g: 4
        });
      }
    }
    const px = G.player.c + dc * 0.55;
    const py = G.player.r + dr * 0.55;
    emit(16, {
      x: px, y: py, j: 0.2,
      vx0: -dc * 2 - 2, vx1: -dc * 2 + 2, vy0: -dr * 2 - 2, vy1: -dr * 2 + 2,
      life: 0.32, r0: 0.05, r1: 0.12, rgb: TEAL, g: 5
    });
    if (n) {
      audio.stun();
      toast('震晕 ' + n, false, true);
    } else {
      toast('墙震了');
    }
  }

  function act() {
    if (G.mode !== 'play' || G.dead) return;
    if (G.player.lock > 0.05) return;
    if (G.actCd > 0) return;
    snapPlayer();
    const c = G.player.c;
    const r = G.player.r;
    const dc = G.player.fc;
    const dr = G.player.fr;
    const nc = c + dc;
    const nr = r + dr;
    const t = tile(nc, nr);
    if (t === WALL) {
      kickWall();
      return;
    }
    if (t === ICE || t === EGG || t === DIAMOND) {
      const ac = nc + dc;
      const ar = nr + dr;
      if (blockedForSlide(ac, ar)) {
        if (t === DIAMOND) bump();
        else {
          G.actCd = 0.12;
          smashAt(nc, nr);
        }
        return;
      }
      G.actCd = 0.12;
      startSlide(nc, nr, dc, dr);
      return;
    }
    bump();
  }

  function noteCrush(s, b) {
    if (!b || b.dead) return;
    b.dead = true;
    s.crush += 1;
    if (G.comboT <= 0) G.combo = 0;
    G.combo += 1;
    G.comboT = 1.55;
    const pts = CRUSH_PTS[Math.min(CRUSH_PTS.length - 1, G.combo - 1)];
    addScore(pts, b.x, b.y);
    audio.crush(s.crush);
    hitStop(45 + Math.min(35, s.crush * 10));
    if (!REDUCE) G.shake = Math.max(G.shake, 7 + s.crush * 2);
    G.flash = 0.22;
    G.flashRgb = GOLD;
    kickBoard('boom');
    emit(22, {
      x: b.x, y: b.y, j: 0.18,
      vx0: -5, vx1: 5, vy0: -6, vy1: 2,
      life: 0.5, r0: 0.05, r1: 0.16, rgb: GOLD, g: 10
    });
    emit(10, {
      x: b.x, y: b.y, j: 0.1,
      vx0: -2, vx1: 2, vy0: -4, vy1: 0,
      life: 0.4, r0: 0.04, r1: 0.1, rgb: MAG, g: 6
    });
    spawnPop(b.x, b.y - 0.15, '碾碎', GOLD);
    if (G.combo >= 2) showChain(G.combo);
  }

  function placeSlide(s) {
    const i = idx(s.c, s.r);
    G.grid[i] = s.kind;
    G.hatch[i] = s.hatch || 0;
    if (s.crush > 0) {
      iceBurst(s.c, s.r, GOLD, 10);
      s.squash = 1.2;
    }
  }

  function updateSlides(dt) {
    for (let i = G.slides.length - 1; i >= 0; i--) {
      const s = G.slides[i];
      s.squash = Math.max(0, s.squash - dt * 3.2);
      s.prog += SLIDE_SPD * dt;
      let live = true;
      while (s.prog >= 1 && live) {
        const nc = s.c + s.dc;
        const nr = s.r + s.dr;
        if (blockedForSlide(nc, nr)) {
          placeSlide(s);
          live = false;
          break;
        }
        s.c = nc;
        s.r = nr;
        s.prog -= 1;
        const bee = beeAt(nc, nr);
        if (bee) noteCrush(s, bee);
        if (G.mode === 'play' && !G.dead && G.invuln <= 0) {
          if (Math.round(G.player.x) === nc && Math.round(G.player.y) === nr) {
            if (Math.abs(G.player.x - nc) < 0.55 && Math.abs(G.player.y - nr) < 0.55) {
              hurtPlayer('crush');
            }
          }
        }
      }
      if (!live) G.slides.splice(i, 1);
    }
  }

  function onAlign() {
    addScore(10000, G.player.x, G.player.y);
    audio.chime();
    hitStop(72);
    G.flash = 0.45;
    G.flashRgb = MAG;
    if (!REDUCE) G.shake = Math.max(G.shake, 12);
    kickBoard('gem');
    toast('三钻齐了', false, true);
    const dur = stunTime() + 1.4;
    for (let i = 0; i < G.bees.length; i++) stunBee(G.bees[i], dur);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (tile(c, r) === DIAMOND) {
          emit(16, {
            x: c, y: r, j: 0.2,
            vx0: -3, vx1: 3, vy0: -5, vy1: 1,
            life: 0.55, r0: 0.05, r1: 0.14, rgb: MAG, g: 6
          });
        }
      }
    }
  }

  function diamondCells() {
    const ds = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (G.grid[idx(c, r)] === DIAMOND) ds.push({ c: c, r: r });
      }
    }
    return ds;
  }

  function checkGems() {
    if (G.slides.some(function (s) { return s.kind === DIAMOND; })) return;
    const ds = diamondCells();
    const on = diamondLine(ds);
    if (on && !G.gemOn) {
      G.gemOn = true;
      onAlign();
    } else if (!on) {
      G.gemOn = false;
    }
  }

  function makeBee(c, r) {
    const dir = (Math.random() * 4) | 0;
    return {
      c: c, r: r, x: c, y: r, dir: dir,
      lock: 0, stun: 0, eat: 0, eatC: -1, eatR: -1,
      dead: false, wob: Math.random() * TAU, hatch: 0
    };
  }

  function spawnExtraBees(n) {
    if (n <= 0) return;
    const spots = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (tile(c, r) !== EMPTY) continue;
        if (c === G.player.c && r === G.player.r) continue;
        if (beeAt(c, r)) continue;
        const d = Math.abs(c - G.player.c) + Math.abs(r - G.player.r);
        if (d < 3) continue;
        spots.push({ c: c, r: r, d: d });
      }
    }
    spots.sort(function (a, b) { return b.d - a.d; });
    for (let i = 0; i < n && i < spots.length; i++) {
      G.bees.push(makeBee(spots[i].c, spots[i].r));
    }
  }

  function buildStage(si, demo) {
    const st = STAGES[si] || STAGES[0];
    const parsed = parseMap(st.map);
    G.grid = parsed.grid;
    G.hatch = parsed.hatch;
    G.slides.length = 0;
    G.bees.length = 0;
    G.gemOn = false;
    G.angry = false;
    G.dead = false;
    G.hatch0 = st.hatch || 14;
    if (G.kind === 'swarm') G.hatch0 *= 0.72;
    const ht = G.hatch0;
    for (let i = 0; i < G.grid.length; i++) {
      if (G.grid[i] === EGG) G.hatch[i] = ht * (0.75 + Math.random() * 0.5);
    }
    G.player.spawnC = parsed.player.c;
    G.player.spawnR = parsed.player.r;
    G.player.c = parsed.player.c;
    G.player.r = parsed.player.r;
    G.player.fromC = parsed.player.c;
    G.player.fromR = parsed.player.r;
    G.player.x = parsed.player.c;
    G.player.y = parsed.player.r;
    G.player.fc = 1;
    G.player.fr = 0;
    G.player.lock = 0;
    G.player.squash = 0;
    G.invuln = demo ? 0 : 0.4;
    lastDir = 1;
    for (let i = 0; i < parsed.bees.length; i++) {
      G.bees.push(makeBee(parsed.bees[i].c, parsed.bees[i].r));
    }
    if (!demo && G.kind === 'swarm') spawnExtraBees(1 + (si >= 5 ? 1 : 0));
    G.roundT = Math.max(34, 54 - si * 2);
    if (G.kind === 'swarm') G.roundT *= 0.86;
    particles.length = 0;
    pops.length = 0;
    G.kick.t = 0;
    G.flash = 0;
    G.shake = 0;
    G.stop = 0;
    G.combo = 1;
    G.comboT = 0;
    G.actCd = 0;
  }

  function hatchEgg(c, r) {
    const i = idx(c, r);
    G.grid[i] = EMPTY;
    G.hatch[i] = 0;
    audio.hatch();
    iceBurst(c, r, MAG, 14);
    if (G.mode !== 'play') return;
    const b = makeBee(c, r);
    b.hatch = 0.35;
    G.bees.push(b);
    toast('孵出来了', true);
  }

  function updateHatch(dt) {
    if (G.mode !== 'play') return;
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        const i = idx(c, r);
        if (G.grid[i] !== EGG) continue;
        G.hatch[i] -= dt;
        if (G.hatch[i] <= 0) hatchEgg(c, r);
      }
    }
  }

  function openDirs(c, r) {
    const out = [];
    for (let d = 0; d < 4; d++) {
      const nc = c + DX[d];
      const nr = r + DY[d];
      if (!inb(nc, nr)) continue;
      const t = tile(nc, nr);
      if (t === EMPTY && !slideOccupies(nc, nr)) out.push(d);
    }
    return out;
  }

  function iceDirs(c, r) {
    const out = [];
    for (let d = 0; d < 4; d++) {
      const nc = c + DX[d];
      const nr = r + DY[d];
      const t = tile(nc, nr);
      if (t === ICE || t === EGG) out.push(d);
    }
    return out;
  }

  function updateBee(b, dt) {
    if (b.dead) return;
    b.wob += dt * (b.stun > 0 ? 10 : 7);
    if (b.hatch > 0) {
      b.hatch -= dt;
      return;
    }
    if (b.stun > 0) {
      b.stun -= dt;
      b.lock = 0;
      b.eat = 0;
      return;
    }
    if (b.lock > 0) {
      b.lock -= dt;
      const t = 1 - clamp(b.lock / Math.max(0.08, 1 / Math.max(0.6, beeSpeed())), 0, 1);
      const pc = b.c - DX[b.dir];
      const pr = b.r - DY[b.dir];
      b.x = lerp(pc, b.c, t);
      b.y = lerp(pr, b.r, t);
      if (b.lock <= 0) {
        b.x = b.c;
        b.y = b.r;
      }
      return;
    }
    b.x = b.c;
    b.y = b.r;
    const dirs = openDirs(b.c, b.r);
    const eatDur = G.kind === 'swarm' ? 0.55 : 0.95;
    if (G.mode === 'title') {
      if (dirs.length) {
        b.dir = dirs.indexOf(b.dir) >= 0 && Math.random() > 0.2
          ? b.dir
          : dirs[(Math.random() * dirs.length) | 0];
        b.c = b.c + DX[b.dir];
        b.r = b.r + DY[b.dir];
        b.lock = 1 / Math.max(0.7, beeSpeed() * 0.7);
      }
      return;
    }
    if (b.eatC >= 0) {
      const et = tile(b.eatC, b.eatR);
      if (et !== ICE && et !== EGG) {
        b.eat = 0;
        b.eatC = -1;
      } else {
        b.eat += dt;
        if (b.eat >= eatDur) {
          const kind = tile(b.eatC, b.eatR);
          const i = idx(b.eatC, b.eatR);
          G.grid[i] = EMPTY;
          G.hatch[i] = 0;
          iceBurst(b.eatC, b.eatR, kind === EGG ? MAG : ICEC, 10);
          audio.smash();
          if (kind === EGG && G.mode === 'play') {
            const nb = makeBee(b.eatC, b.eatR);
            nb.hatch = 0.2;
            G.bees.push(nb);
          }
          b.eat = 0;
          b.eatC = -1;
        }
        return;
      }
    }
    let pick = b.dir;
    if (dirs.length) {
      const opts = [];
      if (G.player.x < b.x - 0.2 && dirs.indexOf(3) >= 0) opts.push(3);
      if (G.player.x > b.x + 0.2 && dirs.indexOf(1) >= 0) opts.push(1);
      if (G.player.y < b.y - 0.2 && dirs.indexOf(0) >= 0) opts.push(0);
      if (G.player.y > b.y + 0.2 && dirs.indexOf(2) >= 0) opts.push(2);
      if (opts.length && Math.random() < (G.kind === 'swarm' ? 0.88 : 0.72)) {
        pick = opts[(Math.random() * opts.length) | 0];
      } else if (dirs.indexOf(b.dir) < 0 || Math.random() < 0.16) {
        pick = dirs[(Math.random() * dirs.length) | 0];
      }
      b.dir = pick;
      const nc = b.c + DX[pick];
      const nr = b.r + DY[pick];
      b.c = nc;
      b.r = nr;
      b.lock = 1 / Math.max(0.7, beeSpeed());
      return;
    }
    const ice = iceDirs(b.c, b.r);
    if (ice.length) {
      let d = ice[(Math.random() * ice.length) | 0];
      const opts = [];
      for (let k = 0; k < ice.length; k++) {
        const nc = b.c + DX[ice[k]];
        const nr = b.r + DY[ice[k]];
        const toward =
          (nc - b.c) * (G.player.c - b.c) + (nr - b.r) * (G.player.r - b.r) > 0;
        if (toward) opts.push(ice[k]);
      }
      if (opts.length) d = opts[(Math.random() * opts.length) | 0];
      b.eatC = b.c + DX[d];
      b.eatR = b.r + DY[d];
      b.eat = 0.01;
      b.dir = d;
    }
  }

  function hurtPlayer(why) {
    if (G.mode !== 'play' || G.dead || G.invuln > 0) return;
    G.lives -= 1;
    audio.hurt();
    hitStop(64);
    if (!REDUCE) G.shake = 14;
    G.flash = 0.38;
    G.flashRgb = MAG;
    kickBoard('die');
    emit(24, {
      x: G.player.x, y: G.player.y, j: 0.2,
      vx0: -4, vx1: 4, vy0: -5, vy1: 2,
      life: 0.45, r0: 0.05, r1: 0.14, rgb: MAG, g: 8
    });
    syncPips();
    if (G.lives <= 0) {
      gameOver();
      return;
    }
    G.player.c = G.player.spawnC;
    G.player.r = G.player.spawnR;
    snapPlayer();
    G.invuln = 1.9;
    toast(why === 'crush' ? '被冰块碾到' : '碰到雪蜂', true);
  }

  function countIce() {
    let n = 0;
    for (let i = 0; i < G.grid.length; i++) if (G.grid[i] === ICE) n += 1;
    return n;
  }

  function winStage() {
    if (G.mode !== 'play') return;
    G.mode = 'win';
    const ice = countIce();
    const bonus = 800 + G.stage * 200 + ice * 10;
    addScore(bonus, G.player.x, G.player.y);
    audio.win();
    kickBoard('win-flash');
    G.flash = 0.3;
    G.flashRgb = LIME;
    showOverlay('win');
    setHint(G.stage >= STAGES.length - 1 ? 'R 重开 · 空格再来一轮' : '空格下一关 · R 重开', 'hot');
    syncHud();
  }

  function gameOver() {
    G.mode = 'lose';
    G.dead = true;
    saveBest();
    audio.lose();
    showOverlay('lose');
    setHint('R 重开随时可用', 'warn');
    syncHud();
  }

  function maybeClear() {
    if (G.mode !== 'play') return;
    if (beeCount() > 0) return;
    if (eggCount() > 0) return;
    winStage();
  }

  function startKind(kind, fromRetry) {
    G.kind = kind === 'swarm' ? 'swarm' : 'campaign';
    G.stage = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 1;
    G.comboT = 0;
    G.dead = false;
    buildStage(0, false);
    G.mode = 'play';
    hideOverlay();
    audio.start();
    const st = STAGES[0];
    toast(st.name);
    setHint(st.hint);
    syncHud();
    if (canvas) canvas.focus();
    void fromRetry;
  }

  function nextOrRestart() {
    if (G.mode === 'win' && G.stage < STAGES.length - 1) {
      G.stage += 1;
      buildStage(G.stage, false);
      G.mode = 'play';
      hideOverlay();
      const st = STAGES[G.stage];
      toast(st.name);
      setHint(st.hint);
      audio.start();
      syncHud();
      return;
    }
    startKind(G.kind, true);
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') {
      startKind(G.kind || 'campaign', true);
      return;
    }
    startKind(G.kind, true);
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'campaign';
    G.lives = LIVES;
    G.score = 0;
    G.stage = 0;
    buildStage(0, true);
    showOverlay('title');
    setHint('走过去对准 · 空格推冰碾蜂 · 贴墙再踢 · 三钻排齐');
    syncHud();
  }

  function overlayPrimary() {
    if (!overlayOpen()) return;
    if (G.mode === 'title') {
      startKind(G.kind, false);
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') nextOrRestart();
  }

  function updatePlayer(dt) {
    if (G.player.squash > 0) G.player.squash = Math.max(0, G.player.squash - dt * 3.4);
    if (G.player.lock > 0) {
      G.player.lock -= dt;
      const t = 1 - clamp(G.player.lock / WALK_T, 0, 1);
      const e = t * t * (3 - 2 * t);
      G.player.x = lerp(G.player.fromC, G.player.c, e);
      G.player.y = lerp(G.player.fromR, G.player.r, e);
      if (G.player.lock <= 0) snapPlayer();
      return;
    }
    snapPlayer();
    const dir = wishDir();
    if (dir >= 0) tryWalk(dir);
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= dt * 0.7;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
  }

  function update(dt) {
    G.clock += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 1;
        if (comboEl) comboEl.textContent = '×1';
        if (comboBox) comboBox.classList.remove('hot');
      }
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 26);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.3);
    if (G.kick.t > 0) G.kick.t = Math.max(0, G.kick.t - dt);
    if (G.actCd > 0) G.actCd = Math.max(0, G.actCd - dt);
    if (G.stop > 0) {
      G.stop -= dt;
      updateParticles(dt);
      return;
    }

    if (G.mode === 'title') {
      for (let i = 0; i < G.bees.length; i++) updateBee(G.bees[i], dt * 0.7);
      updateParticles(dt);
      return;
    }
    if (G.mode !== 'play') {
      updateParticles(dt);
      return;
    }

    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);
    G.roundT -= dt;
    if (!G.angry && G.roundT <= 0) {
      G.angry = true;
      G.roundT = 0;
      toast('蜂怒了', true);
      audio.hurt();
      G.flash = 0.2;
      G.flashRgb = MAG;
    }

    updatePlayer(dt);
    updateSlides(dt);
    updateHatch(dt);
    for (let i = 0; i < G.bees.length; i++) updateBee(G.bees[i], dt);
    let w = 0;
    for (let i = 0; i < G.bees.length; i++) {
      if (!G.bees[i].dead) G.bees[w++] = G.bees[i];
    }
    G.bees.length = w;

    checkGems();

    if (!G.dead && G.invuln <= 0) {
      for (let i = 0; i < G.bees.length; i++) {
        const b = G.bees[i];
        if (b.stun > 0 || b.hatch > 0) continue;
        if (Math.abs(b.x - G.player.x) < 0.46 && Math.abs(b.y - G.player.y) < 0.46) {
          hurtPlayer('touch');
          break;
        }
      }
    }

    maybeClear();
    updateParticles(dt);
    syncHud();
  }

  function rr(x, y, w, h, rad) {
    const r = Math.min(rad, w * 0.5, h * 0.5);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
    }
  }

  function cellKick(c, r) {
    if (G.kick.t <= 0) return { x: 0, y: 0 };
    const k = Math.sin(G.kick.t * 28) * G.kick.t * cell * 0.18;
    let hit = false;
    if (G.kick.dc === -1 && c === 0) hit = true;
    if (G.kick.dc === 1 && c === COLS - 1) hit = true;
    if (G.kick.dr === -1 && r === 0) hit = true;
    if (G.kick.dr === 1 && r === ROWS - 1) hit = true;
    if (!hit) return { x: 0, y: 0 };
    return { x: G.kick.dc * k, y: G.kick.dr * k };
  }

  function drawFloor() {
    ctx.fillStyle = '#07060f';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.5, H * 0.4, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(26, 224, 255, 0.07)');
    g.addColorStop(1, 'rgba(5, 3, 12, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = ox + c * cell;
        const y = oy + r * cell;
        const t = tile(c, r);
        if (t === WALL) continue;
        ctx.fillStyle = (c + r) % 2 === 0 ? 'rgba(26, 224, 255, 0.035)' : 'rgba(8, 16, 28, 0.5)';
        ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
      }
    }
  }

  function drawWalls() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (tile(c, r) !== WALL) continue;
        const k = cellKick(c, r);
        const x = ox + c * cell + k.x;
        const y = oy + r * cell + k.y;
        const p = cell * 0.08;
        rr(x + p * 0.4, y + p * 0.4, cell - p * 0.8, cell - p * 0.8, cell * 0.16);
        ctx.fillStyle = G.kick.t > 0 && (k.x || k.y) ? 'rgba(122, 246, 255, 0.55)' : 'rgba(18, 42, 58, 0.96)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(26, 224, 255, 0.55)';
        ctx.lineWidth = Math.max(1, cell * 0.045);
        ctx.stroke();
        ctx.fillStyle = 'rgba(122, 246, 255, 0.12)';
        ctx.fillRect(x + p, y + p, cell - p * 2, cell * 0.22);
      }
    }
  }

  function drawBlock(c, r, kind, prog, dc, dr, squash) {
    let x = ox + (c + (dc || 0) * (prog || 0)) * cell;
    let y = oy + (r + (dr || 0) * (prog || 0)) * cell;
    const sq = squash || 0;
    const stretch = 1 + sq * 0.18;
    const thin = 1 - sq * 0.12;
    let sx = cell;
    let sy = cell;
    if (dc) {
      sx *= stretch;
      sy *= thin;
      x -= (sx - cell) * 0.5;
    } else if (dr) {
      sy *= stretch;
      sx *= thin;
      y -= (sy - cell) * 0.5;
    }
    const p = Math.max(2, cell * 0.1);
    const gem = kind === DIAMOND;
    const egg = kind === EGG;
    ctx.save();
    ctx.shadowColor = gem ? 'rgba(255, 61, 184, 0.45)' : 'rgba(26, 224, 255, 0.42)';
    ctx.shadowBlur = cell * 0.18;
    rr(x + p, y + p, sx - p * 2, sy - p * 2, cell * 0.16);
    if (gem) {
      ctx.fillStyle = 'rgba(255, 72, 186, 0.9)';
    } else if (egg) {
      const pulse = 0.62 + Math.sin(G.clock * 8) * 0.14;
      ctx.fillStyle = 'rgba(64, 186, 230,' + pulse + ')';
    } else {
      ctx.fillStyle = 'rgba(92, 232, 255, 0.9)';
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = gem ? 'rgba(255, 210, 246, 0.85)' : 'rgba(210, 255, 255, 0.8)';
    ctx.lineWidth = Math.max(1, cell * 0.045);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
    rr(x + p + 2, y + p + 2, (sx - p * 2) * 0.5, (sy - p * 2) * 0.24, 3);
    ctx.fill();
    if (gem) {
      const cx = x + sx * 0.5;
      const cy = y + sy * 0.5;
      const s = cell * 0.22;
      const rot = G.clock * 1.6;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.72, 0);
      ctx.lineTo(0, s);
      ctx.lineTo(-s * 0.72, 0);
      ctx.closePath();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fill();
      ctx.restore();
    }
    if (egg) {
      const cx = x + sx * 0.5;
      const cy = y + sy * 0.52;
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.12, 0, TAU);
      ctx.fillStyle = rgba(MAG, 0.7 + Math.sin(G.clock * 10) * 0.2);
      ctx.fill();
    }
  }

  function drawPenguin(px, py, fc, fr, squash, blink) {
    const s = cell;
    const x = ox + px * s + s * 0.5;
    const y = oy + py * s + s * 0.5;
    const bob = (G.player.lock > 0 ? Math.sin(G.clock * 22) * s * 0.03 : Math.sin(G.clock * 3) * s * 0.015);
    const sx = 1 + squash * 0.22;
    const sy = 1 - squash * 0.16;
    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(sx, sy);
    if (blink) ctx.globalAlpha = 0.45 + Math.sin(G.clock * 28) * 0.25;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.1, s * 0.28, s * 0.3, 0, 0, TAU);
    ctx.fillStyle = '#e9ffff';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, s * 0.16, s * 0.16, s * 0.17, 0, 0, TAU);
    ctx.fillStyle = '#7af6ff';
    ctx.fill();
    ctx.fillStyle = '#ffb020';
    ctx.beginPath();
    ctx.ellipse(-s * 0.1, s * 0.34, s * 0.07, s * 0.045, -0.2, 0, TAU);
    ctx.ellipse(s * 0.1, s * 0.34, s * 0.07, s * 0.045, 0.2, 0, TAU);
    ctx.fill();
    const oxe = fc * s * 0.07;
    const oye = fr * s * 0.05;
    ctx.beginPath();
    ctx.arc(-s * 0.08 + oxe, -s * 0.02 + oye, s * 0.045, 0, TAU);
    ctx.arc(s * 0.08 + oxe, -s * 0.02 + oye, s * 0.045, 0, TAU);
    ctx.fillStyle = '#071018';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(oxe * 1.4, s * 0.05);
    ctx.lineTo(oxe * 1.4 + fc * s * 0.16 + (fc === 0 ? s * 0.08 : 0), s * 0.08 + fr * s * 0.12);
    ctx.lineTo(oxe * 1.4 - (fc === 0 ? s * 0.08 : 0), s * 0.1);
    ctx.closePath();
    ctx.fillStyle = '#ffb020';
    ctx.fill();
    ctx.restore();
  }

  function drawBee(b) {
    const s = cell;
    const x = ox + b.x * s + s * 0.5;
    const y = oy + b.y * s + s * 0.5 + Math.sin(b.wob) * s * 0.04;
    const stunned = b.stun > 0;
    const angry = G.angry && !stunned;
    ctx.save();
    ctx.translate(x, y);
    if (b.hatch > 0) ctx.scale(1.15 - b.hatch, 1.15 - b.hatch);
    const wing = Math.sin(b.wob * 2.2) * s * 0.08;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.ellipse(-s * 0.16, -s * 0.08, s * 0.12, s * 0.07 + Math.abs(wing) * 0.3, -0.5, 0, TAU);
    ctx.ellipse(s * 0.16, -s * 0.08, s * 0.12, s * 0.07 + Math.abs(wing) * 0.3, 0.5, 0, TAU);
    ctx.fillStyle = stunned ? '#b8f6ff' : '#fff4c4';
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.02, s * 0.2, s * 0.17, 0, 0, TAU);
    ctx.fillStyle = stunned ? '#8cefff' : angry ? '#ff6ad4' : '#ffe36b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(7, 16, 24, 0.45)';
    ctx.lineWidth = Math.max(1, s * 0.04);
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, 0);
    ctx.lineTo(s * 0.12, 0);
    ctx.stroke();
    ctx.fillStyle = '#071018';
    ctx.beginPath();
    ctx.arc(-s * 0.07, -s * 0.02, s * 0.035, 0, TAU);
    ctx.arc(s * 0.07, -s * 0.02, s * 0.035, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = stunned ? '#7af6ff' : '#ffe36b';
    ctx.lineWidth = Math.max(1, s * 0.03);
    ctx.beginPath();
    ctx.moveTo(-s * 0.06, -s * 0.16);
    ctx.lineTo(-s * 0.12, -s * 0.26);
    ctx.moveTo(s * 0.06, -s * 0.16);
    ctx.lineTo(s * 0.12, -s * 0.26);
    ctx.stroke();
    if (stunned) {
      ctx.strokeStyle = rgba(CYN, 0.8);
      ctx.beginPath();
      ctx.arc(s * 0.22, -s * 0.2, s * 0.08, 0, TAU * 0.7);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.t / p.life, 0, 1);
      const x = ox + p.x * cell + cell * 0.5;
      const y = oy + p.y * cell + cell * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.2, p.r * cell), 0, TAU);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fill();
    }
    ctx.font = '700 ' + Math.max(11, cell * 0.32) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const a = clamp(p.t / p.life, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fillText(p.text, ox + p.x * cell + cell * 0.5, oy + p.y * cell + cell * 0.2);
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFloor();
    const sx = REDUCE ? 0 : (Math.sin(G.clock * 40) * G.shake * 0.35);
    const sy = REDUCE ? 0 : (Math.cos(G.clock * 36) * G.shake * 0.28);
    ctx.save();
    ctx.translate(sx, sy);
    drawWalls();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = tile(c, r);
        if (t === ICE || t === DIAMOND || t === EGG) drawBlock(c, r, t, 0, 0, 0, 0);
      }
    }
    for (let i = 0; i < G.slides.length; i++) {
      const s = G.slides[i];
      drawBlock(s.c, s.r, s.kind, s.prog, s.dc, s.dr, s.squash);
    }
    for (let i = 0; i < G.bees.length; i++) drawBee(G.bees[i]);
    const blink = G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0;
    if (G.mode !== 'lose' || G.lives > 0) {
      drawPenguin(G.player.x, G.player.y, G.player.fc, G.player.fr, G.player.squash, blink);
    }
    drawParticles();
    ctx.restore();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.28);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function resize() {
    if (!canvas || !ctx) return;
    const wrap = canvas.parentElement;
    const rw = wrap ? wrap.clientWidth : 640;
    const rh = wrap ? wrap.clientHeight : 480;
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    W = Math.max(1, rw);
    H = Math.max(1, rh);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const pad = 8;
    cell = Math.floor(Math.min((W - pad * 2) / COLS, (H - pad * 2) / ROWS));
    cell = Math.max(16, cell);
    ox = Math.floor((W - cell * COLS) * 0.5);
    oy = Math.floor((H - cell * ROWS) * 0.5);
    draw();
  }

  function eventCell(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / Math.max(1, rect.width));
    const y = (e.clientY - rect.top) * (H / Math.max(1, rect.height));
    return {
      c: Math.floor((x - ox) / cell),
      r: Math.floor((y - oy) / cell),
      x: x,
      y: y
    };
  }

  function tapCell(c, r) {
    if (G.mode !== 'play' || G.dead) return;
    if (!inb(c, r)) return;
    const pc = G.player.c;
    const pr = G.player.r;
    const dc = c - pc;
    const dr = r - pr;
    if (dc === 0 && dr === 0) {
      act();
      return;
    }
    if (Math.abs(dc) + Math.abs(dr) === 1) {
      const dir = dc === 1 ? 1 : dc === -1 ? 3 : dr === 1 ? 2 : 0;
      faceFromDir(dir);
      const t = tile(c, r);
      if (t === ICE || t === EGG || t === DIAMOND || t === WALL) act();
      else tryWalk(dir);
      return;
    }
    if (Math.abs(dc) >= Math.abs(dr)) faceFromDir(dc > 0 ? 1 : 3);
    else faceFromDir(dr > 0 ? 2 : 0);
    const dir = lastDir;
    tryWalk(dir);
  }

  function bindPad(btn, dir) {
    if (!btn) return;
    const down = function (e) {
      e.preventDefault();
      audio.ensure();
      btn.classList.add('held');
      if (dir < 0) {
        act();
        return;
      }
      keys.u = dir === 0;
      keys.r = dir === 1;
      keys.d = dir === 2;
      keys.l = dir === 3;
      lastDir = dir;
      tryWalk(dir);
    };
    const up = function (e) {
      if (e) e.preventDefault();
      btn.classList.remove('held');
      if (dir < 0) return;
      if (dir === 0) keys.u = false;
      if (dir === 1) keys.r = false;
      if (dir === 2) keys.d = false;
      if (dir === 3) keys.l = false;
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  }

  bindPad(padBtns.up, 0);
  bindPad(padBtns.right, 1);
  bindPad(padBtns.down, 2);
  bindPad(padBtns.left, 3);
  bindPad(padBtns.push, -1);

  function onKey(e, down) {
    const k = e.key;
    let dir = -1;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') dir = 0;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') dir = 1;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') dir = 2;
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') dir = 3;
    if (dir >= 0) {
      e.preventDefault();
      if (dir === 0) keys.u = down;
      if (dir === 1) keys.r = down;
      if (dir === 2) keys.d = down;
      if (dir === 3) keys.l = down;
      if (down) {
        lastDir = dir;
        audio.ensure();
        if (!overlayOpen()) tryWalk(dir);
      }
    }
  }

  window.addEventListener('keydown', function (e) {
    audio.ensure();
    const k = e.key;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      if (!e.repeat) retry();
      return;
    }
    if (k === 'm' || k === 'M') {
      e.preventDefault();
      audio.setMuted(!audio.muted);
      return;
    }
    if (overlayOpen()) {
      if (k === ' ' || k === 'Enter') {
        e.preventDefault();
        if (!e.repeat) overlayPrimary();
      }
      if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
      }
      return;
    }
    if (k === ' ' ) {
      e.preventDefault();
      act();
      return;
    }
    onKey(e, true);
  });

  window.addEventListener('keyup', function (e) {
    onKey(e, false);
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (overlayOpen()) return;
    audio.ensure();
    canvas.focus();
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.sx = e.clientX;
    ptr.sy = e.clientY;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.dragging = false;
    ptr.dir = -1;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!ptr.down || e.pointerId !== ptr.id) return;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    const dx = ptr.x - ptr.sx;
    const dy = ptr.y - ptr.sy;
    if (!ptr.dragging && dx * dx + dy * dy > SWIPE * SWIPE) ptr.dragging = true;
    if (ptr.dragging) {
      if (Math.abs(dx) > Math.abs(dy)) ptr.dir = dx > 0 ? 1 : 3;
      else ptr.dir = dy > 0 ? 2 : 0;
      lastDir = ptr.dir;
    }
    e.preventDefault();
  });

  function ptrUp(e) {
    if (!ptr.down || (e && e.pointerId !== ptr.id && e.type !== 'blur')) return;
    if (ptr.down && !ptr.dragging && e && e.clientX != null) {
      const p = eventCell(e);
      tapCell(p.c, p.r);
    }
    ptr.down = false;
    ptr.dragging = false;
    ptr.dir = -1;
  }

  canvas.addEventListener('pointerup', function (e) {
    e.preventDefault();
    ptrUp(e);
  });
  canvas.addEventListener('pointercancel', ptrUp);
  canvas.addEventListener('pointerleave', function (e) {
    if (ptr.down) ptrUp(e);
  });

  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnRetry) {
    btnRetry.addEventListener('click', function () {
      audio.ensure();
      retry();
    });
  }
  if (btnCampaign) {
    btnCampaign.addEventListener('click', function () {
      audio.ensure();
      startKind('campaign', false);
    });
  }
  if (btnSwarm) {
    btnSwarm.addEventListener('click', function () {
      audio.ensure();
      startKind('swarm', false);
    });
  }
  if (modeCamp) {
    modeCamp.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'title') {
        G.kind = 'campaign';
        syncModes();
        return;
      }
      startKind('campaign', true);
    });
  }
  if (modeSwarm) {
    modeSwarm.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'title') {
        G.kind = 'swarm';
        syncModes();
        return;
      }
      startKind('swarm', true);
    });
  }
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      nextOrRestart();
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      bootTitle();
    });
  }

  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = false;
    ptr.down = false;
    ptr.dragging = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.u = keys.d = keys.l = keys.r = false;
    }
  });
  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  loadBest();
  bootTitle();
  resize();

  let acc = 0;
  let last = performance.now() / 1000;
  function frame(nowMs) {
    requestAnimationFrame(frame);
    const now = nowMs / 1000;
    if (hidden) {
      last = now;
      return;
    }
    let dt = now - last;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
  }
  requestAnimationFrame(frame);
})();
