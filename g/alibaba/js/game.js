'use strict';

(function () {
  const COLS = 15;
  const ROWS = 13;
  const EMPTY = 0;
  const WALL = 1;
  const GOLD = 2;
  const BONUS = 3;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const WALK_T = 0.1;
  const SWIPE = 24;
  const BEST_KEY = 'playbox-alibaba-best';
  const MUTE_KEY = 'playbox-alibaba-mute';
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const OPS = '方向键 / WASD 走 · 空格踢 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLDC = [255, 227, 107];
  const AMB = [255, 176, 32];
  const SAND = [255, 138, 61];
  const LIME = [61, 255, 136];

  function M(rows) {
    const wall = '###############';
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
      name: '洞口',
      sub: 'GATE',
      hint: '捡金袋，空格踢晕卫兵。金够了出口亮。',
      need: 6,
      shrink: 0,
      shrinkAt: 0,
      map: M([
        '@..G.....G.E.',
        '.##.#.#.##.#.',
        'G..#.....#...',
        '.#.........G.',
        '.....X.......',
        '###..$...###.',
        'G............',
        '.#.........G.',
        '...#.....#..G',
        '.##.#.#.##.#.',
        'E..G.....G...'
      ])
    },
    {
      name: '金巷',
      sub: 'LANE',
      hint: '巷子里连捡，踢开挡路的兵',
      need: 10,
      shrink: 0,
      shrinkAt: 0,
      map: M([
        '@G...G...G...',
        '.#.###.###.#.',
        'G....#....G.E',
        '.#.E....#..#.',
        'G....X....G..',
        '###..$...###.',
        'G....#....G..',
        '.#.#....E..#.',
        'EG...#....G..',
        '.#.###.###.#.',
        '.G...G...G...'
      ])
    },
    {
      name: '岔口',
      sub: 'FORK',
      hint: '先踢再抄近路，别被两头夹',
      need: 10,
      shrink: 0,
      shrinkAt: 0,
      map: M([
        '@...G#G...E..',
        '.###.#.###.#.',
        'G...#.#...G..',
        '.#....X....#.',
        'G.G.#.#.G.G..',
        '##.#.$.#.##.#',
        '..G.#.#.G....',
        '.#....#....#.',
        'G...#.#...G..',
        '.###.#.###.#.',
        'E...G#G......'
      ])
    },
    {
      name: '宝室',
      sub: 'VAULT',
      hint: '中室有大奖，门口常有兵',
      need: 10,
      shrink: 0,
      shrinkAt: 0,
      map: M([
        '@G.G.....G.E.',
        '#####.#####.#',
        'G....#....G..',
        '.#.E.#.E...#.',
        'G..#.X.#..G..',
        '#..#.$.#..#.#',
        'G..#...#..G..',
        '.#...#.#.E.#.',
        'G....#....G..',
        '#####.#####.#',
        '.G.G.....G.E.'
      ])
    },
    {
      name: '缩壁',
      sub: 'CLOSE',
      hint: '石壁会合拢，金要趁早捡',
      need: 8,
      shrink: 2,
      shrinkAt: 16,
      map: M([
        'E..G.....G..E',
        '.##.###.##.#.',
        'G..#.....#..G',
        '.#...E.....#.',
        '...G.X.G.....',
        '###@.$.#.###.',
        '.....E.......',
        '.#.........#.',
        'G..#.....#..G',
        '.##.###.##.#.',
        'E..G.....G..E'
      ])
    },
    {
      name: '追影',
      sub: 'CHASE',
      hint: '兵多了，踢完立刻换位',
      need: 10,
      shrink: 0,
      shrinkAt: 0,
      map: M([
        '@..G.E.G..E..',
        '.#.###.###.#.',
        'G..#.....#..G',
        '.#....E....#.',
        'G.G..X..G.G..',
        '##...$.....##',
        'G.G.....#.G..',
        '.#....E....#.',
        'G..#.....#..G',
        '.#.###.###.#.',
        'E..G.E.G.....'
      ])
    },
    {
      name: '夹金',
      sub: 'PINCH',
      hint: '窄道里一脚定身再冲金',
      need: 11,
      shrink: 1,
      shrinkAt: 20,
      map: M([
        'GG.G...G.G.GG',
        '.#.#.#.#.#.#.',
        'G...#.#.#...G',
        '.##.E...E.##.',
        'G...#.X.#...G',
        '##.@..$...##.',
        'G...#...#...G',
        '.##.E...E.##.',
        'G...#.#.#...G',
        '.#.#.#.#.#.#.',
        'EG.G...G.G.GE'
      ])
    },
    {
      name: '终窟',
      sub: 'PEAK',
      hint: '最后一面，壁合兵密，冲门',
      need: 12,
      shrink: 2,
      shrinkAt: 14,
      map: M([
        'EG.G.#.G.G.GE',
        '.#.#.#.#.#.#.',
        'G.#.G.X.G.#.G',
        '.#.#.E.E.#.#.',
        'G...#.#.#...G',
        '##.G.$.@G.##.',
        'G...#.#.#...G',
        '.#.#.E.E.#.#.',
        'G.#.G...G.#.G',
        '.#.#.#.#.#.#.',
        'EG.G.#.G.G.GE'
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
  function ringOf(c, r) {
    return Math.min(c, COLS - 1 - c, r, ROWS - 1 - r);
  }

  function kickHits(px, py, fc, fr, gx, gy) {
    const ax = px + fc * 0.45;
    const ay = py + fr * 0.45;
    const dx = gx - ax;
    const dy = gy - ay;
    const d2 = dx * dx + dy * dy;
    if (d2 > 1.45 * 1.45) return false;
    const dist = Math.sqrt(d2);
    const dot = dx * fc + dy * fr;
    if (dot < -0.2 && dist > 0.62) return false;
    return true;
  }

  function parseMap(rows) {
    const grid = new Uint8Array(COLS * ROWS);
    const golds = [];
    const guards = [];
    let player = { c: 1, r: 1 };
    let exit = { c: 7, r: 6 };
    let gold = 0;
    let bonus = 0;
    for (let r = 0; r < ROWS; r++) {
      const row = rows[r];
      for (let c = 0; c < COLS; c++) {
        const ch = row.charAt(c);
        const i = idx(c, r);
        if (ch === '#') grid[i] = WALL;
        else if (ch === 'G') {
          grid[i] = GOLD;
          gold += 1;
          golds.push({ c: c, r: r });
        } else if (ch === '$') {
          grid[i] = BONUS;
          bonus += 1;
        } else if (ch === '@') {
          grid[i] = EMPTY;
          player = { c: c, r: r };
        } else if (ch === 'E') {
          grid[i] = EMPTY;
          guards.push({ c: c, r: r });
        } else if (ch === 'X') {
          grid[i] = EMPTY;
          exit = { c: c, r: r };
        } else grid[i] = EMPTY;
      }
    }
    return {
      grid: grid,
      player: player,
      exit: exit,
      guards: guards,
      gold: gold,
      bonus: bonus,
      golds: golds
    };
  }

  function flood(grid, sc, sr) {
    const seen = new Uint8Array(COLS * ROWS);
    const q = [sc, sr];
    seen[idx(sc, sr)] = 1;
    let qi = 0;
    let n = 0;
    while (qi < q.length) {
      const c = q[qi++];
      const r = q[qi++];
      n += 1;
      for (let d = 0; d < 4; d++) {
        const nc = c + DX[d];
        const nr = r + DY[d];
        if (!inb(nc, nr)) continue;
        const i = idx(nc, nr);
        if (seen[i] || grid[i] === WALL) continue;
        seen[i] = 1;
        q.push(nc, nr);
      }
    }
    return { n: n, seen: seen };
  }

  function selfCheck() {
    if (STAGES.length !== 8) throw new Error('need 8 stages');
    for (let i = 0; i < STAGES.length; i++) {
      const st = STAGES[i];
      const parsed = parseMap(st.map);
      if (parsed.grid[idx(0, 0)] !== WALL || parsed.grid[idx(COLS - 1, ROWS - 1)] !== WALL) {
        throw new Error('outer wall ' + i);
      }
      if (parsed.grid[idx(parsed.player.c, parsed.player.r)] !== EMPTY) {
        throw new Error('player blocked ' + i);
      }
      if (parsed.gold < st.need) throw new Error('need gold ' + i);
      if (parsed.guards.length < 1) throw new Error('no guards ' + i);
      if (parsed.bonus < 1) throw new Error('no bonus ' + i);
      const fl = flood(parsed.grid, parsed.player.c, parsed.player.r);
      if (!fl.seen[idx(parsed.exit.c, parsed.exit.r)]) throw new Error('exit cut ' + i);
      for (let k = 0; k < parsed.golds.length; k++) {
        const g = parsed.golds[k];
        if (!fl.seen[idx(g.c, g.r)]) throw new Error('gold cut ' + i + ' ' + g.c + ',' + g.r);
      }
      if (st.shrink > 0 && ringOf(parsed.player.c, parsed.player.r) <= st.shrink) {
        throw new Error('spawn shrink ' + i);
      }
      if (st.shrink > 0 && ringOf(parsed.exit.c, parsed.exit.r) <= st.shrink) {
        throw new Error('exit shrink ' + i);
      }
    }
    if (ringOf(0, 0) !== 0) throw new Error('ring corner');
    if (ringOf(1, 6) !== 1) throw new Error('ring inner');
    if (ringOf(7, 6) !== 6) throw new Error('ring center');
    if (!kickHits(3, 3, 1, 0, 4, 3)) throw new Error('kick front');
    if (!kickHits(3, 3, 1, 0, 3, 3)) throw new Error('kick same');
    if (kickHits(3, 3, 1, 0, 2, 3)) throw new Error('kick behind');
    if (kickHits(3, 3, 1, 0, 8, 3)) throw new Error('kick far');
    if (!kickHits(5, 5, 0, -1, 5, 4)) throw new Error('kick up');
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
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
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
    gold() {
      this.ensure();
      this.beep(784, 0.07, 'sine', 0.05);
      this.beep(1046, 0.12, 'triangle', 0.055, 1320);
    },
    bonus() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.05);
      this.beep(784, 0.1, 'sine', 0.05);
      this.beep(1175, 0.18, 'triangle', 0.06, 1560);
    },
    kick() {
      this.ensure();
      this.noise(0.08, 0.05, 180);
      this.beep(140, 0.12, 'sine', 0.07, 52);
      this.beep(320, 0.06, 'square', 0.03, 110);
    },
    stun() {
      this.ensure();
      this.beep(880, 0.07, 'square', 0.04, 240);
      this.beep(1320, 0.1, 'sine', 0.045, 440);
    },
    miss() {
      this.ensure();
      this.noise(0.05, 0.03, 600);
      this.beep(240, 0.06, 'triangle', 0.025, 120);
    },
    hurt() {
      this.ensure();
      this.beep(180, 0.16, 'sawtooth', 0.05, 70);
      this.noise(0.1, 0.04, 500);
    },
    door() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.055);
      this.beep(1175, 0.22, 'sine', 0.05, 1568);
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
    shrink() {
      this.ensure();
      this.noise(0.14, 0.05, 120);
      this.beep(90, 0.22, 'sawtooth', 0.05, 40);
    },
    bump() {
      this.ensure();
      this.beep(160, 0.05, 'triangle', 0.03, 90);
    }
  };

  if (!hasDom) {
    console.log('alibaba ok');
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
  const btnHunt = el('btn-hunt');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const modeCamp = el('mode-camp');
  const modeHunt = el('mode-hunt');
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
    kick: el('btn-kick')
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
    guards: [],
    player: {
      c: 1, r: 1, x: 1, y: 1, fc: 1, fr: 0,
      fromC: 1, fromR: 1, lock: 0, squash: 0, spawnC: 1, spawnR: 1
    },
    exit: { c: 7, r: 6 },
    goldLeft: 0,
    goldGot: 0,
    goldNeed: 6,
    goldTotal: 0,
    door: false,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: AMB,
    toastT: 0,
    kick: { dc: 0, dr: 0, t: 0, x: 0, y: 0 },
    dead: false,
    actCd: 0,
    shrinkMax: 0,
    shrinkLv: 0,
    shrinkT: 0,
    roundT: 0
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
    if (x != null) spawnPop(x, y, '+' + n, n >= 400 ? GOLDC : AMB);
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
    if (modeHunt) modeHunt.setAttribute('aria-pressed', G.kind === 'hunt' ? 'true' : 'false');
  }

  function bumpCombo() {
    if (G.comboT <= 0) G.combo = 1;
    else G.combo += 1;
    G.comboT = 1.9;
    if (G.combo >= 2) showChain(G.combo);
    return G.combo;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (tagLabel) {
      const t = '金 ' + G.goldGot + '/' + G.goldNeed + (G.door ? ' · 门开' : ' · 门闭');
      tagLabel.textContent = t;
      tagLabel.classList.toggle('warn', !G.door && G.mode === 'play' && G.shrinkLv > 0);
      tagLabel.classList.toggle('open', G.door);
    }
    if (stageLabel) {
      const st = STAGES[G.stage] || STAGES[0];
      const modeName = G.kind === 'hunt' ? '追兵' : '寻宝';
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
      if (ovKicker) ovKicker.textContent = 'ALI';
      if (ovTitle) ovTitle.textContent = '宝洞';
      if (ovLead) ovLead.innerHTML = '迷宫里捡金袋。空格踢晕卫兵。<br />金够了出口才开，碰到卫兵扣一命。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (G.stage >= STAGES.length - 1) {
        if (ovTitle) ovTitle.textContent = G.kind === 'hunt' ? '追兵平了' : '宝洞清空';
        if (ovLead) ovLead.textContent = '八面都出了。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '') + '。';
        if (ovAgain) ovAgain.textContent = '再来一轮';
      } else {
        if (ovTitle) ovTitle.textContent = '出洞了';
        const st = STAGES[G.stage] || STAGES[0];
        if (ovLead) ovLead.textContent = st.name + ' 的金子够了。下一面更密。';
        if (ovAgain) ovAgain.textContent = '下一关';
      }
      if (ovOps) ovOps.textContent = 'R 重开 · 空格下一关';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = '被抓住了';
      if (ovLead) ovLead.textContent = (G.kind === 'hunt' ? '追兵里 ' : '') + '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
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
      chainPop.textContent = '连击 ×' + n;
      chainPop.classList.remove('hidden');
      chainPop.style.animation = 'none';
      void chainPop.offsetWidth;
      chainPop.style.animation = '';
      setTimeout(function () {
        if (tok === chainTok) chainPop.classList.add('hidden');
      }, 720);
    } else {
      toast('连击 ×' + n, false, true);
    }
  }

  function tile(c, r) {
    if (!inb(c, r)) return WALL;
    return G.grid[idx(c, r)];
  }

  function walkBlocked(c, r) {
    if (!inb(c, r)) return true;
    return tile(c, r) === WALL;
  }

  function stunTime() {
    const base = G.kind === 'hunt' ? 1.85 : 3.35;
    return base * (1 - G.stage * 0.04);
  }

  function guardSpeed() {
    let spd = 1.55 + G.stage * 0.16;
    if (G.kind === 'hunt') spd *= 1.55;
    spd *= 1 + Math.min(0.32, G.roundT * 0.004);
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
    if (walkBlocked(nc, nr)) {
      G.player.squash = 0.55;
      return;
    }
    G.player.fromC = G.player.c;
    G.player.fromR = G.player.r;
    G.player.c = nc;
    G.player.r = nr;
    G.player.lock = WALK_T;
  }

  function goldBurst(c, r, bonus) {
    emit(bonus ? 22 : 14, {
      x: c, y: r, j: 0.18,
      vx0: -4.4, vx1: 4.4, vy0: -5.8, vy1: 1.2,
      life: 0.46, r0: 0.05, r1: 0.15, rgb: bonus ? GOLDC : AMB, g: 9
    });
    emit(bonus ? 10 : 6, {
      x: c, y: r, j: 0.1,
      vx0: -2, vx1: 2, vy0: -4.5, vy1: 0,
      life: 0.38, r0: 0.04, r1: 0.09, rgb: SAND, g: 6
    });
  }

  function pickupAt(c, r, sealed) {
    const t = tile(c, r);
    if (t !== GOLD && t !== BONUS) return false;
    const i = idx(c, r);
    G.grid[i] = EMPTY;
    const bonus = t === BONUS;
    if (!bonus) {
      G.goldGot += 1;
      G.goldLeft = Math.max(0, G.goldLeft - 1);
    }
    goldBurst(c, r, bonus);
    if (sealed) {
      addScore(bonus ? 200 : 50, c, r);
      maybeOpenDoor();
      return true;
    }
    const mul = bumpCombo();
    const pts = (bonus ? 400 : 100) * mul;
    addScore(pts, c, r);
    G.player.squash = Math.max(G.player.squash, 0.7);
    if (bonus) {
      audio.bonus();
      toast('宝袋', false, true);
      hitStop(56);
      G.flash = 0.22;
      G.flashRgb = GOLDC;
    } else {
      audio.gold();
      hitStop(42);
    }
    maybeOpenDoor();
    return true;
  }

  function maybeOpenDoor() {
    if (G.door || G.mode !== 'play') return;
    if (G.goldGot < G.goldNeed) return;
    G.door = true;
    audio.door();
    hitStop(64);
    G.flash = 0.32;
    G.flashRgb = LIME;
    kickBoard('gem');
    toast('出口开了', false, true);
    emit(28, {
      x: G.exit.c, y: G.exit.r, j: 0.28,
      vx0: -3.5, vx1: 3.5, vy0: -5, vy1: 1.5,
      life: 0.55, r0: 0.05, r1: 0.14, rgb: LIME, g: 6
    });
    setHint('冲向出口 · 空格踢开挡路的兵', 'hot');
  }

  function makeGuard(c, r) {
    const dir = (Math.random() * 4) | 0;
    return {
      c: c, r: r, x: c, y: r, dir: dir,
      lock: 0, stun: 0, dead: false,
      wob: Math.random() * TAU, flash: 0
    };
  }

  function spawnExtraGuards(n) {
    if (n <= 0) return;
    const spots = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (tile(c, r) === WALL) continue;
        if (c === G.player.c && r === G.player.r) continue;
        if (c === G.exit.c && r === G.exit.r) continue;
        let busy = false;
        for (let i = 0; i < G.guards.length; i++) {
          if (G.guards[i].c === c && G.guards[i].r === r) busy = true;
        }
        if (busy) continue;
        const d = Math.abs(c - G.player.c) + Math.abs(r - G.player.r);
        if (d < 4) continue;
        spots.push({ c: c, r: r, d: d });
      }
    }
    spots.sort(function (a, b) { return b.d - a.d; });
    for (let i = 0; i < n && i < spots.length; i++) {
      G.guards.push(makeGuard(spots[i].c, spots[i].r));
    }
  }

  function buildStage(si, demo) {
    const st = STAGES[si] || STAGES[0];
    const parsed = parseMap(st.map);
    G.grid = parsed.grid;
    G.guards.length = 0;
    G.dead = false;
    G.door = false;
    G.goldGot = 0;
    G.goldLeft = parsed.gold;
    G.goldTotal = parsed.gold;
    G.goldNeed = st.need;
    G.exit.c = parsed.exit.c;
    G.exit.r = parsed.exit.r;
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
    G.invuln = demo ? 0 : 0.45;
    lastDir = 1;
    for (let i = 0; i < parsed.guards.length; i++) {
      G.guards.push(makeGuard(parsed.guards[i].c, parsed.guards[i].r));
    }
    if (!demo && G.kind === 'hunt') spawnExtraGuards(2 + (si >= 4 ? 1 : 0));
    G.shrinkMax = st.shrink || 0;
    G.shrinkLv = 0;
    G.shrinkT = st.shrink > 0 ? st.shrinkAt : 0;
    G.roundT = 0;
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

  function openDirs(c, r) {
    const out = [];
    for (let d = 0; d < 4; d++) {
      const nc = c + DX[d];
      const nr = r + DY[d];
      if (!walkBlocked(nc, nr)) out.push(d);
    }
    return out;
  }

  function buildDist() {
    const dist = new Int16Array(COLS * ROWS);
    dist.fill(32767);
    const pc = clamp(Math.round(G.player.x), 0, COLS - 1);
    const pr = clamp(Math.round(G.player.y), 0, ROWS - 1);
    if (tile(pc, pr) === WALL) return dist;
    dist[idx(pc, pr)] = 0;
    const q = [pc, pr];
    let qi = 0;
    while (qi < q.length) {
      const c = q[qi++];
      const r = q[qi++];
      const d = dist[idx(c, r)];
      for (let dir = 0; dir < 4; dir++) {
        const nc = c + DX[dir];
        const nr = r + DY[dir];
        if (walkBlocked(nc, nr)) continue;
        const i = idx(nc, nr);
        if (dist[i] <= d + 1) continue;
        dist[i] = d + 1;
        q.push(nc, nr);
      }
    }
    return dist;
  }

  function updateGuard(b, dt, dist) {
    if (b.dead) return;
    b.wob += dt * (b.stun > 0 ? 14 : 8);
    if (b.flash > 0) b.flash = Math.max(0, b.flash - dt * 3.2);
    if (b.stun > 0) {
      b.stun -= dt;
      b.lock = 0;
      b.x = b.c;
      b.y = b.r;
      return;
    }
    if (b.lock > 0) {
      b.lock -= dt;
      const span = Math.max(0.08, 1 / Math.max(0.6, guardSpeed()));
      const t = 1 - clamp(b.lock / span, 0, 1);
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
    if (!dirs.length) return;
    let pick = b.dir;
    if (G.mode === 'title') {
      pick = dirs.indexOf(b.dir) >= 0 && Math.random() > 0.22
        ? b.dir
        : dirs[(Math.random() * dirs.length) | 0];
    } else {
      const chase = G.kind === 'hunt' ? 0.9 : 0.78;
      const here = dist[idx(b.c, b.r)];
      const opts = [];
      for (let k = 0; k < dirs.length; k++) {
        const d = dirs[k];
        const nd = dist[idx(b.c + DX[d], b.r + DY[d])];
        if (nd < here) opts.push(d);
      }
      if (opts.length && Math.random() < chase) {
        pick = opts[(Math.random() * opts.length) | 0];
      } else if (dirs.indexOf(b.dir) < 0 || Math.random() < 0.18) {
        pick = dirs[(Math.random() * dirs.length) | 0];
      } else {
        pick = b.dir;
      }
    }
    b.dir = pick;
    b.c = b.c + DX[pick];
    b.r = b.r + DY[pick];
    b.lock = 1 / Math.max(0.7, guardSpeed());
  }

  function nearestInner(c, r) {
    const lim = ringOf(c, r);
    let best = null;
    let bd = 999;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (tile(x, y) === WALL) continue;
        if (ringOf(x, y) <= lim) continue;
        const d = Math.abs(x - c) + Math.abs(y - r);
        if (d < bd) {
          bd = d;
          best = { c: x, r: y };
        }
      }
    }
    return best;
  }

  function applyShrink() {
    if (G.shrinkLv >= G.shrinkMax) return;
    G.shrinkLv += 1;
    const ring = G.shrinkLv;
    audio.shrink();
    if (!REDUCE) G.shake = Math.max(G.shake, 12);
    G.flash = 0.28;
    G.flashRgb = SAND;
    kickBoard('boom');
    toast('石壁合拢', true);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (ringOf(c, r) !== ring) continue;
        if (tile(c, r) === WALL) continue;
        if (c === G.exit.c && r === G.exit.r) continue;
        const t = tile(c, r);
        if (t === GOLD || t === BONUS) pickupAt(c, r, true);
        G.grid[idx(c, r)] = WALL;
        emit(8, {
          x: c, y: r, j: 0.12,
          vx0: -2, vx1: 2, vy0: -3, vy1: 1,
          life: 0.32, r0: 0.04, r1: 0.1, rgb: SAND, g: 5
        });
      }
    }
    if (tile(G.player.spawnC, G.player.spawnR) === WALL) {
      const sn = nearestInner(G.player.spawnC, G.player.spawnR);
      if (sn) {
        G.player.spawnC = sn.c;
        G.player.spawnR = sn.r;
      }
    }
    if (tile(G.player.c, G.player.r) === WALL) {
      const n = nearestInner(G.player.c, G.player.r);
      if (n) {
        G.player.c = n.c;
        G.player.r = n.r;
        snapPlayer();
        G.invuln = Math.max(G.invuln, 0.7);
      } else hurtPlayer();
    }
    for (let i = 0; i < G.guards.length; i++) {
      const b = G.guards[i];
      if (tile(b.c, b.r) !== WALL) continue;
      const n = nearestInner(b.c, b.r);
      if (n) {
        b.c = n.c;
        b.r = n.r;
        b.x = n.c;
        b.y = n.r;
        b.stun = Math.max(b.stun, 0.8);
        b.lock = 0;
      }
    }
  }

  function doKick() {
    if (G.mode !== 'play' || G.dead) return;
    if (G.player.lock > 0.05) return;
    if (G.actCd > 0) return;
    snapPlayer();
    G.actCd = 0.22;
    const dc = G.player.fc;
    const dr = G.player.fr;
    G.kick.dc = dc;
    G.kick.dr = dr;
    G.kick.t = 0.22;
    G.kick.x = G.player.x;
    G.kick.y = G.player.y;
    G.player.squash = 1;
    audio.kick();
    kickBoard('boom');
    const px = G.player.x + dc * 0.55;
    const py = G.player.y + dr * 0.55;
    emit(14, {
      x: px, y: py, j: 0.16,
      vx0: dc * 2 - 1.6, vx1: dc * 2 + 1.6, vy0: dr * 2 - 1.6, vy1: dr * 2 + 1.6,
      life: 0.28, r0: 0.04, r1: 0.11, rgb: GOLDC, g: 4
    });
    let hits = 0;
    const dur = stunTime();
    for (let i = 0; i < G.guards.length; i++) {
      const b = G.guards[i];
      if (b.dead) continue;
      if (!kickHits(G.player.x, G.player.y, dc, dr, b.x, b.y)) continue;
      const restun = b.stun > 0;
      b.stun = Math.max(b.stun, dur);
      b.flash = 1;
      b.lock = 0;
      hits += 1;
      if (restun) {
        const nc = b.c + dc;
        const nr = b.r + dr;
        if (!walkBlocked(nc, nr)) {
          b.c = nc;
          b.r = nr;
          b.x = nc;
          b.y = nr;
        }
      }
      emit(12, {
        x: b.x, y: b.y, j: 0.14,
        vx0: -2.4, vx1: 2.4, vy0: -3.6, vy1: 1,
        life: 0.38, r0: 0.04, r1: 0.11, rgb: CYN, g: 5
      });
      const mul = bumpCombo();
      addScore((restun ? 350 : 200) * mul, b.x, b.y);
      spawnPop(b.x, b.y - 0.12, restun ? '再踢' : '晕', CYN);
    }
    if (hits) {
      audio.stun();
      hitStop(48 + Math.min(32, hits * 10));
      if (!REDUCE) G.shake = Math.max(G.shake, 8 + hits * 2);
      G.flash = 0.2;
      G.flashRgb = CYN;
      toast(hits > 1 ? '连踢 ' + hits : '踢晕了', false, true);
    } else {
      audio.miss();
      hitStop(30);
    }
  }

  function hurtPlayer() {
    if (G.mode !== 'play' || G.dead || G.invuln > 0) return;
    G.lives -= 1;
    audio.hurt();
    hitStop(68);
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
    let sc = G.player.spawnC;
    let sr = G.player.spawnR;
    if (tile(sc, sr) === WALL) {
      const n = nearestInner(sc, sr);
      if (n) {
        sc = n.c;
        sr = n.r;
        G.player.spawnC = sc;
        G.player.spawnR = sr;
      }
    }
    G.player.c = sc;
    G.player.r = sr;
    snapPlayer();
    G.invuln = 1.85;
    toast('碰到卫兵', true);
  }

  function winStage() {
    if (G.mode !== 'play') return;
    G.mode = 'win';
    const left = G.goldLeft;
    const bonus = 800 + G.stage * 200 + left * 20 + G.lives * 80;
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

  function maybeExit() {
    if (G.mode !== 'play' || !G.door || G.dead) return;
    if (Math.abs(G.player.x - G.exit.c) < 0.42 && Math.abs(G.player.y - G.exit.r) < 0.42) {
      winStage();
    }
  }

  function startKind(kind) {
    G.kind = kind === 'hunt' ? 'hunt' : 'campaign';
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
    startKind(G.kind);
  }

  function retry() {
    audio.ensure();
    startKind(G.kind || 'campaign');
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'campaign';
    G.lives = LIVES;
    G.score = 0;
    G.stage = 0;
    buildStage(0, true);
    showOverlay('title');
    setHint('走格子捡金 · 空格踢晕卫兵 · 金够了出洞');
    syncHud();
  }

  function overlayPrimary() {
    if (!overlayOpen()) return;
    if (G.mode === 'title') {
      startKind(G.kind);
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') nextOrRestart();
  }

  function collectUnderPlayer() {
    const c = G.player.c;
    const r = G.player.r;
    const t = tile(c, r);
    if (t === GOLD || t === BONUS) pickupAt(c, r, false);
  }

  function updatePlayer(dt) {
    if (G.player.squash > 0) G.player.squash = Math.max(0, G.player.squash - dt * 3.4);
    if (G.player.lock > 0) {
      G.player.lock -= dt;
      const t = 1 - clamp(G.player.lock / WALK_T, 0, 1);
      const e = t * t * (3 - 2 * t);
      G.player.x = lerp(G.player.fromC, G.player.c, e);
      G.player.y = lerp(G.player.fromR, G.player.r, e);
      if (G.player.lock <= 0) {
        snapPlayer();
        collectUnderPlayer();
      }
      return;
    }
    snapPlayer();
    collectUnderPlayer();
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
      const dist = buildDist();
      for (let i = 0; i < G.guards.length; i++) updateGuard(G.guards[i], dt * 0.65, dist);
      updateParticles(dt);
      return;
    }
    if (G.mode !== 'play') {
      updateParticles(dt);
      return;
    }

    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);
    G.roundT += dt;
    if (G.shrinkMax > 0 && G.shrinkLv < G.shrinkMax) {
      G.shrinkT -= dt;
      if (G.shrinkT <= 0) {
        applyShrink();
        G.shrinkT = 7.2;
      }
    }

    updatePlayer(dt);
    const dist = buildDist();
    for (let i = 0; i < G.guards.length; i++) updateGuard(G.guards[i], dt, dist);

    if (!G.dead && G.invuln <= 0) {
      for (let i = 0; i < G.guards.length; i++) {
        const b = G.guards[i];
        if (b.stun > 0) continue;
        if (Math.abs(b.x - G.player.x) < 0.46 && Math.abs(b.y - G.player.y) < 0.46) {
          hurtPlayer();
          break;
        }
      }
    }

    maybeExit();
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
    const wc = Math.round(G.kick.x + G.kick.dc);
    const wr = Math.round(G.kick.y + G.kick.dr);
    if (c === wc && r === wr) return { x: G.kick.dc * k, y: G.kick.dr * k };
    if (G.kick.dc === -1 && c === 0 && r === wr) return { x: G.kick.dc * k, y: 0 };
    if (G.kick.dc === 1 && c === COLS - 1 && r === wr) return { x: G.kick.dc * k, y: 0 };
    if (G.kick.dr === -1 && r === 0 && c === wc) return { x: 0, y: G.kick.dr * k };
    if (G.kick.dr === 1 && r === ROWS - 1 && c === wc) return { x: 0, y: G.kick.dr * k };
    return { x: 0, y: 0 };
  }

  function drawFloor() {
    ctx.fillStyle = '#0a0706';
    ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W * 0.5, H * 0.4, 20, W * 0.5, H * 0.5, Math.max(W, H) * 0.7);
    g.addColorStop(0, 'rgba(255, 176, 32, 0.08)');
    g.addColorStop(1, 'rgba(5, 3, 12, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = ox + c * cell;
        const y = oy + r * cell;
        if (tile(c, r) === WALL) continue;
        ctx.fillStyle = (c + r) % 2 === 0 ? 'rgba(255, 176, 32, 0.045)' : 'rgba(22, 12, 8, 0.55)';
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
        const hot = ringOf(c, r) === G.shrinkLv && G.shrinkLv > 0;
        rr(x + p * 0.4, y + p * 0.4, cell - p * 0.8, cell - p * 0.8, cell * 0.16);
        ctx.fillStyle = (G.kick.t > 0 && (k.x || k.y))
          ? 'rgba(255, 227, 107, 0.62)'
          : hot ? 'rgba(72, 32, 14, 0.96)' : 'rgba(42, 24, 14, 0.96)';
        ctx.fill();
        ctx.strokeStyle = hot ? 'rgba(255, 106, 31, 0.75)' : 'rgba(255, 176, 32, 0.5)';
        ctx.lineWidth = Math.max(1, cell * 0.045);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255, 227, 107, 0.12)';
        ctx.fillRect(x + p, y + p, cell - p * 2, cell * 0.22);
      }
    }
  }

  function drawBag(c, r, bonus) {
    const s = cell;
    const x = ox + c * s + s * 0.5;
    const y = oy + r * s + s * 0.52 + Math.sin(G.clock * 3.2 + c + r) * s * 0.03;
    ctx.save();
    ctx.translate(x, y);
    if (bonus) {
      const pulse = 1 + Math.sin(G.clock * 7) * 0.08;
      ctx.scale(pulse, pulse);
    }
    ctx.beginPath();
    ctx.ellipse(0, s * 0.04, s * 0.22, s * 0.2, 0, 0, TAU);
    ctx.fillStyle = bonus ? '#e8a030' : '#c4782a';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.08, s * 0.12, s * 0.08, 0, 0, TAU);
    ctx.fillStyle = '#8a4a18';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.02, s * (bonus ? 0.11 : 0.09), 0, TAU);
    ctx.fillStyle = rgba(GOLDC, 0.95);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.05, -s * 0.05, s * 0.04, s * 0.025, -0.4, 0, TAU);
    ctx.fill();
    if (bonus) {
      const star = s * 0.16;
      ctx.rotate(G.clock * 1.8);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = i * TAU / 4;
        ctx.lineTo(Math.cos(a) * star, Math.sin(a) * star);
        ctx.lineTo(Math.cos(a + TAU / 8) * star * 0.35, Math.sin(a + TAU / 8) * star * 0.35);
      }
      ctx.closePath();
      ctx.fillStyle = rgba(GOLDC, 0.9);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawExit() {
    const s = cell;
    const x = ox + G.exit.c * s + s * 0.5;
    const y = oy + G.exit.r * s + s * 0.5;
    const on = G.door;
    const pulse = on ? 0.55 + Math.sin(G.clock * 6) * 0.2 : 0.18;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = on ? rgba(LIME, 0.85) : 'rgba(255, 176, 32, 0.28)';
    ctx.lineWidth = Math.max(1.5, s * 0.07);
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, s * 0.28);
    ctx.lineTo(-s * 0.28, -s * 0.02);
    ctx.quadraticCurveTo(0, -s * 0.38, s * 0.28, -s * 0.02);
    ctx.lineTo(s * 0.28, s * 0.28);
    ctx.stroke();
    ctx.fillStyle = on ? rgba(LIME, pulse * 0.35) : 'rgba(8, 6, 12, 0.35)';
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, s * 0.26);
    ctx.lineTo(-s * 0.22, 0);
    ctx.quadraticCurveTo(0, -s * 0.28, s * 0.22, 0);
    ctx.lineTo(s * 0.22, s * 0.26);
    ctx.closePath();
    ctx.fill();
    if (on) {
      ctx.fillStyle = rgba(GOLDC, 0.8);
      ctx.beginPath();
      ctx.arc(0, s * 0.04, s * 0.045, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAli(px, py, fc, fr, squash, blink) {
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
    ctx.ellipse(0, s * 0.12, s * 0.22, s * 0.2, 0, 0, TAU);
    ctx.fillStyle = '#ffb020';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.02, s * 0.175, 0, TAU);
    ctx.fillStyle = '#ffe8c8';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.16, s * 0.2, s * 0.1, 0, Math.PI, TAU);
    ctx.fillStyle = '#ff8a3d';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.22, s * 0.08, s * 0.05, 0, 0, TAU);
    ctx.fillStyle = '#ffe36b';
    ctx.fill();
    const oxe = fc * s * 0.06;
    const oye = fr * s * 0.04;
    ctx.fillStyle = '#071018';
    ctx.beginPath();
    ctx.arc(-s * 0.06 + oxe, -s * 0.02 + oye, s * 0.035, 0, TAU);
    ctx.arc(s * 0.06 + oxe, -s * 0.02 + oye, s * 0.035, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff6a1f';
    ctx.beginPath();
    ctx.moveTo(oxe, s * 0.05);
    ctx.lineTo(oxe + fc * s * 0.12, s * 0.08 + fr * s * 0.08);
    ctx.lineTo(oxe - fc * s * 0.02, s * 0.1);
    ctx.closePath();
    ctx.fill();
    if (G.kick.t > 0) {
      ctx.strokeStyle = rgba(GOLDC, G.kick.t / 0.22);
      ctx.lineWidth = Math.max(2, s * 0.08);
      ctx.lineCap = 'round';
      ctx.beginPath();
      const a0 = Math.atan2(fr, fc) - 0.9;
      const a1 = Math.atan2(fr, fc) + 0.9;
      ctx.arc(fc * s * 0.1, fr * s * 0.1, s * 0.32, a0, a1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGuard(b) {
    const s = cell;
    const x = ox + b.x * s + s * 0.5;
    const y = oy + b.y * s + s * 0.5 + Math.sin(b.wob) * s * 0.035;
    const stunned = b.stun > 0;
    ctx.save();
    ctx.translate(x, y);
    if (stunned) ctx.globalAlpha = 0.72 + Math.sin(G.clock * 22) * 0.22;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.12, s * 0.2, s * 0.18, 0, 0, TAU);
    ctx.fillStyle = stunned ? '#8cefff' : (b.flash > 0 ? '#fff4c4' : '#ff3db8');
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.02, s * 0.15, 0, TAU);
    ctx.fillStyle = stunned ? '#d8fbff' : '#ffd0ec';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.16, -s * 0.08);
    ctx.lineTo(0, -s * 0.28);
    ctx.lineTo(s * 0.16, -s * 0.08);
    ctx.closePath();
    ctx.fillStyle = stunned ? '#7af6ff' : '#ff6ad4';
    ctx.fill();
    ctx.fillStyle = '#071018';
    ctx.beginPath();
    ctx.arc(-s * 0.05, -s * 0.02, s * 0.032, 0, TAU);
    ctx.arc(s * 0.05, -s * 0.02, s * 0.032, 0, TAU);
    ctx.fill();
    if (stunned) {
      ctx.strokeStyle = rgba(CYN, 0.85);
      ctx.lineWidth = Math.max(1.2, s * 0.04);
      ctx.beginPath();
      ctx.arc(s * 0.2, -s * 0.22, s * 0.09, 0, TAU * 0.7);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-s * 0.18, -s * 0.26, s * 0.07, 0.4, TAU * 0.8);
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
    drawExit();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = tile(c, r);
        if (t === GOLD || t === BONUS) drawBag(c, r, t === BONUS);
      }
    }
    for (let i = 0; i < G.guards.length; i++) drawGuard(G.guards[i]);
    const blink = G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0;
    if (G.mode !== 'lose' || G.lives > 0) {
      drawAli(G.player.x, G.player.y, G.player.fc, G.player.fr, G.player.squash, blink);
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
      doKick();
      return;
    }
    if (Math.abs(dc) + Math.abs(dr) === 1) {
      const dir = dc === 1 ? 1 : dc === -1 ? 3 : dr === 1 ? 2 : 0;
      faceFromDir(dir);
      let guardHere = false;
      for (let i = 0; i < G.guards.length; i++) {
        const b = G.guards[i];
        if (Math.abs(b.x - c) < 0.6 && Math.abs(b.y - r) < 0.6) guardHere = true;
      }
      if (guardHere || tile(c, r) === WALL) doKick();
      else tryWalk(dir);
      return;
    }
    if (Math.abs(dc) >= Math.abs(dr)) faceFromDir(dc > 0 ? 1 : 3);
    else faceFromDir(dr > 0 ? 2 : 0);
    tryWalk(lastDir);
  }

  function bindPad(btn, dir) {
    if (!btn) return;
    const down = function (e) {
      e.preventDefault();
      audio.ensure();
      btn.classList.add('held');
      if (dir < 0) {
        doKick();
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
  bindPad(padBtns.kick, -1);

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
    if (k === ' ') {
      e.preventDefault();
      doKick();
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
      startKind('campaign');
    });
  }
  if (btnHunt) {
    btnHunt.addEventListener('click', function () {
      audio.ensure();
      startKind('hunt');
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
      startKind('campaign');
    });
  }
  if (modeHunt) {
    modeHunt.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'title') {
        G.kind = 'hunt';
        syncModes();
        return;
      }
      startKind('hunt');
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
