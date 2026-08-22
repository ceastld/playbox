'use strict';

(function () {
  const COLS = 18;
  const ROWS = 13;
  const TILE = 40;
  const VW = COLS * TILE;
  const VH = ROWS * TILE;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-crumb-trail-mute';
  const BIRD_R = 11;
  const CAT_R = 15;
  const MOUSE_R = 8.5;
  const CRUMB_R = 4.6;
  const NEST_R = 17;
  const POISON_R = 9.5;
  const MIN_GAP = 26;
  const CUR_ACC = 2400;
  const CUR_MAX = 340;
  const CUR_FRIC = 8.2;
  const OPS = '点地撒屑 · WASD 移准星 · 空格投屑 · M 静音';

  const DC = [1, -1, 0, 0];
  const DR = [0, 0, 1, -1];

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
  function wrap(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function lerpAng(a, b, t) {
    return a + wrap(b - a) * t;
  }
  function cellHash(c, r) {
    const n = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
  function cxOf(c) {
    return (c + 0.5) * TILE;
  }
  function cyOf(r) {
    return (r + 0.5) * TILE;
  }
  function tileAt(x, y) {
    return {
      c: clamp((x / TILE) | 0, 0, COLS - 1),
      r: clamp((y / TILE) | 0, 0, ROWS - 1)
    };
  }

  const STAGES = [
    {
      name: '初屑',
      sub: 'FIRST',
      hint: '点地撒屑，鸟会跳向最近的一粒',
      toast: '沿路撒一把，把它引到金巢',
      time: 44,
      budget: 14,
      sense: 150,
      spd: 78,
      map: [
        '##################',
        '##################',
        '##################',
        '##################',
        '#B..............N#',
        '#................#',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################'
      ]
    },
    {
      name: '拐角',
      sub: 'CORNER',
      hint: '绕过墙角再撒，别隔墙投过去',
      toast: '鸟不会穿墙，屑要落在走得通的地上',
      time: 42,
      budget: 16,
      sense: 142,
      spd: 80,
      map: [
        '##################',
        '##################',
        '#B...............#',
        '#................#',
        '#..............###',
        '##############...#',
        '##############...#',
        '##############.N.#',
        '##############...#',
        '##################',
        '##################',
        '##################',
        '##################'
      ]
    },
    {
      name: '近嗅',
      sub: 'SNIFF',
      hint: '鸟只能闻到近处。把屑接成一条线',
      toast: '隔太远它闻不到 · 看身上那圈青光',
      time: 48,
      budget: 24,
      sense: 128,
      spd: 82,
      map: [
        '##################',
        '##################',
        '#B...............#',
        '################.#',
        '#................#',
        '#.################',
        '#...............N#',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################'
      ]
    },
    {
      name: '岔口',
      sub: 'FORK',
      hint: '它总去最近的一粒。别把屑丢进死胡同',
      toast: '下面是死路 · 从门缝绕上去',
      time: 42,
      budget: 16,
      sense: 132,
      spd: 84,
      map: [
        '##################',
        '##################',
        '#B....#.........N#',
        '#.....#..........#',
        '#.....#.##########',
        '#.......##########',
        '#.......##########',
        '#.......##########',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################'
      ]
    },
    {
      name: '毒籽',
      sub: 'BAIT',
      hint: '品红籽也香。别让它比你的屑更近',
      toast: '死胡同里是毒籽 · 啄到就完了',
      time: 40,
      budget: 15,
      sense: 130,
      spd: 84,
      map: [
        '##################',
        '##################',
        '#B....#.........N#',
        '#.....#..........#',
        '#.....#.##########',
        '#.......##########',
        '#.......##########',
        '#....P..##########',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################'
      ]
    },
    {
      name: '猫影',
      sub: 'CAT',
      hint: '等猫走开，再把屑撒过那条窄道',
      toast: '猫来回巡 · 贴太近会被咬',
      time: 38,
      budget: 14,
      sense: 140,
      spd: 88,
      map: [
        '##################',
        '##################',
        '##################',
        '##################',
        '#B......C.......N#',
        '#................#',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################'
      ],
      cat: { spd: 52, waypoints: [[3, 4], [14, 4]] }
    },
    {
      name: '水渠',
      sub: 'DITCH',
      hint: '水面没路。绕过水渠再接上',
      toast: '屑掉进水里会沉 · 鸟也不下水',
      time: 40,
      budget: 16,
      sense: 132,
      spd: 86,
      map: [
        '##################',
        '##################',
        '#B.....~~~~.....N#',
        '#......~~~~......#',
        '#......~~~~......#',
        '#......~~~~......#',
        '#................#',
        '#................#',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################'
      ]
    },
    {
      name: '横风',
      sub: 'GUST',
      hint: '青带里有风，屑会被吹走',
      toast: '走下面无风的路，或借风力往右送',
      time: 38,
      budget: 18,
      sense: 136,
      spd: 88,
      wind: 78,
      map: [
        '##################',
        '##################',
        '#B.....>>>>>>>>>>#',
        '#......>>>>>>>>>>#',
        '#......>>>>>>>>>>#',
        '#................#',
        '#................#',
        '#...............N#',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################'
      ]
    },
    {
      name: '贼鼠',
      sub: 'MOUSE',
      hint: '鼠会偷屑。别一次铺太长，跟在鸟嘴边撒',
      toast: '鼠专捡地上的屑 · 短线引路',
      time: 36,
      budget: 20,
      sense: 128,
      spd: 90,
      map: [
        '##################',
        '##################',
        '#B...............#',
        '#................#',
        '#................#',
        '#.......M........#',
        '#................#',
        '#...............N#',
        '##################',
        '##################',
        '##################',
        '##################',
        '##################'
      ],
      mouse: { spd: 72, waypoints: [[4, 3], [14, 3], [14, 6], [4, 6]] }
    },
    {
      name: '归巢',
      sub: 'HOME',
      hint: '毒籽、猫、风、水全在。走下面绕到右柱',
      toast: '终径 · 别贪近路',
      time: 44,
      budget: 16,
      sense: 124,
      spd: 92,
      wind: 70,
      map: [
        '##################',
        '#B....#....P.....#',
        '#.....#..........#',
        '#.....#.######...#',
        '#.......#~~~~#...#',
        '#..C....#~~~~#...#',
        '#.......#~~~~#.N.#',
        '#.......######...#',
        '#................#',
        '#>>>>>>>>>>>>>>>>#',
        '##################',
        '##################',
        '##################'
      ],
      cat: { spd: 58, waypoints: [[2, 5], [7, 5]] }
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

  const keys = { l: false, r: false, u: false, d: false, drop: false };
  const pointer = { down: false, hover: false, touch: false, x: VW * 0.5, y: VH * 0.5, id: null };

  const particles = [];
  const motes = [];
  const marks = [];
  const pips = [];
  const rings = [];

  const QC = new Int16Array(COLS * ROWS);
  const QR = new Int16Array(COLS * ROWS);
  const PREV = new Int16Array(COLS * ROWS);
  const SEEN = new Uint16Array(COLS * ROWS);
  let seenStamp = 1;
  const pathBuf = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    time: 40,
    timeMax: 40,
    budget: 12,
    left: 12,
    sense: 140,
    spd: 80,
    why: '',
    lock: 0,
    settle: 0,
    toastT: 0,
    shake: 0,
    magFlash: 0,
    goldFlash: 0,
    pulse: 0,
    stuck: 0,
    dropCool: 0,
    repath: 0,
    warnT: 0,
    taught: false,
    catTaught: false,
    poisonTaught: false,
    cx: VW * 0.4,
    cy: VH * 0.5,
    cvx: 0,
    cvy: 0,
    solid: [],
    water: [],
    wind: [],
    crumbs: [],
    poisons: [],
    cats: [],
    mice: [],
    nest: { x: 0, y: 0, c: 0, r: 0 },
    bird: null,
    demoT: 0,
    demoI: 0
  };

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
      this.beep(392, 0.1, 'sine', 0.045, 620);
      this.beep(784, 0.16, 'triangle', 0.03, 1046);
    },
    drop() {
      this.ensure();
      this.beep(880, 0.05, 'sine', 0.03, 1320);
      this.noise(0.04, 0.018, 1800);
    },
    eat() {
      this.ensure();
      this.beep(660, 0.05, 'triangle', 0.028, 420);
      this.noise(0.05, 0.02, 900);
    },
    peck() {
      this.ensure();
      this.beep(1480, 0.03, 'square', 0.012);
    },
    warn() {
      this.ensure();
      this.beep(220, 0.07, 'sine', 0.032, 140);
    },
    deny() {
      this.ensure();
      this.beep(180, 0.08, 'sine', 0.025, 110);
    },
    hit() {
      this.ensure();
      this.noise(0.16, 0.06, 480);
      this.beep(160, 0.2, 'sawtooth', 0.04, 60);
    },
    nest() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.04, 1174);
    },
    clear() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.055);
      this.beep(659, 0.12, 'sine', 0.045);
      this.beep(784, 0.2, 'triangle', 0.05, 1175);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.05);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.32, 'triangle', 0.065, 1568);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.5, spec.j * 0.5),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        cyan: !!spec.cyan,
        g: spec.g == null ? 80 : spec.g
      });
    }
  }

  function addRing(x, y, mag) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag });
    if (rings.length > 18) rings.shift();
  }

  function addMark(x, y) {
    marks.push({ x: x, y: y, t: 1 });
    if (marks.length > 70) marks.shift();
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

  function nestDist() {
    const b = G.bird;
    if (!b) return 999;
    return hypot2(b.x - G.nest.x, b.y - G.nest.y);
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const k = G.budget ? clamp(G.left / G.budget, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = G.left + '/' + G.budget;
    const near = G.mode === 'play' && nestDist() < G.sense;
    fillWrap.classList.toggle('hot', near);
    fillWrap.classList.toggle('warn', G.mode === 'play' && G.left <= 3);
    if (G.mode === 'title') {
      stageLabel.textContent = '十径';
      leftLabel.textContent = '引鸟归巢';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 径 · ' + (st ? st.name : '');
      const sec = Math.max(0, Math.ceil(G.time));
      leftLabel.textContent = '余 ' + sec + 's';
    }
    stageLabel.classList.toggle('hot', near);
    leftLabel.classList.toggle('warn', G.mode === 'play' && G.time < 8);
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

  function walkable(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return false;
    return !G.solid[r][c];
  }

  function blockedAt(x, y) {
    const t = tileAt(x, y);
    return !walkable(t.c, t.r);
  }

  function bfs(sc, sr, tc, tr) {
    if (!walkable(sc, sr) || !walkable(tc, tr)) return null;
    seenStamp += 1;
    if (seenStamp > 65000) {
      SEEN.fill(0);
      seenStamp = 1;
    }
    let qh = 0;
    let qt = 0;
    const start = sr * COLS + sc;
    QC[qt] = sc;
    QR[qt] = sr;
    qt += 1;
    SEEN[start] = seenStamp;
    PREV[start] = -1;
    let found = -1;
    while (qh < qt) {
      const c = QC[qh];
      const r = QR[qh];
      qh += 1;
      if (c === tc && r === tr) {
        found = r * COLS + c;
        break;
      }
      for (let i = 0; i < 4; i++) {
        const nc = c + DC[i];
        const nr = r + DR[i];
        if (!walkable(nc, nr)) continue;
        const k = nr * COLS + nc;
        if (SEEN[k] === seenStamp) continue;
        SEEN[k] = seenStamp;
        PREV[k] = r * COLS + c;
        QC[qt] = nc;
        QR[qt] = nr;
        qt += 1;
      }
    }
    if (found < 0) return null;
    pathBuf.length = 0;
    let i = found;
    while (i >= 0) {
      pathBuf.push(i);
      i = PREV[i];
    }
    pathBuf.reverse();
    const out = [];
    for (let p = 0; p < pathBuf.length; p++) {
      const k = pathBuf[p];
      out.push({ c: k % COLS, r: (k / COLS) | 0 });
    }
    return out;
  }

  function reachable(sc, sr, tc, tr) {
    if (sc === tc && sr === tr) return true;
    return !!bfs(sc, sr, tc, tr);
  }

  function makeMover(c, r, spec, kind) {
    const wps = (spec && spec.waypoints) ? spec.waypoints : [[c, r]];
    const pts = [];
    for (let i = 0; i < wps.length; i++) {
      pts.push({ c: wps[i][0], r: wps[i][1], x: cxOf(wps[i][0]), y: cyOf(wps[i][1]) });
    }
    return {
      kind: kind,
      x: cxOf(c),
      y: cyOf(r),
      ang: 0,
      i: 0,
      dir: 1,
      spd: (spec && spec.spd) || 50,
      pts: pts,
      hop: rand(0, TAU)
    };
  }

  function applyStage(st) {
    if (!st || st.map.length !== ROWS) throw new Error('bad map rows');
    G.solid = [];
    G.water = [];
    G.wind = [];
    G.crumbs.length = 0;
    G.poisons.length = 0;
    G.cats.length = 0;
    G.mice.length = 0;
    marks.length = 0;
    let birdC = 1;
    let birdR = 1;
    let nestC = COLS - 2;
    let nestR = 1;
    let catC = -1;
    let catR = -1;
    let mouseC = -1;
    let mouseR = -1;
    const wstr = st.wind || 72;
    for (let r = 0; r < ROWS; r++) {
      const line = st.map[r];
      if (!line || line.length !== COLS) throw new Error('bad map ' + r + ' ' + (line && line.length));
      G.solid[r] = [];
      G.water[r] = [];
      G.wind[r] = [];
      for (let c = 0; c < COLS; c++) {
        const ch = line.charAt(c);
        const water = ch === '~';
        const wall = ch === '#';
        const windL = ch === '<';
        const windR = ch === '>';
        const windU = ch === '^';
        const windD = ch === 'v';
        G.solid[r][c] = wall || water;
        G.water[r][c] = water;
        G.wind[r][c] = null;
        if (windL) G.wind[r][c] = { vx: -wstr, vy: 0 };
        if (windR) G.wind[r][c] = { vx: wstr, vy: 0 };
        if (windU) G.wind[r][c] = { vx: 0, vy: -wstr };
        if (windD) G.wind[r][c] = { vx: 0, vy: wstr };
        if (ch === 'B') { birdC = c; birdR = r; }
        if (ch === 'N') { nestC = c; nestR = r; }
        if (ch === 'P') G.poisons.push({ x: cxOf(c), y: cyOf(r), c: c, r: r, ph: rand(0, TAU) });
        if (ch === 'C') { catC = c; catR = r; }
        if (ch === 'M') { mouseC = c; mouseR = r; }
      }
    }
    G.nest = { x: cxOf(nestC), y: cyOf(nestR), c: nestC, r: nestR };
    G.bird = {
      x: cxOf(birdC),
      y: cyOf(birdR),
      vx: 0,
      vy: 0,
      ang: 0,
      hop: 0,
      eat: 0,
      path: [],
      pi: 0,
      target: null,
      peck: 0,
      alive: true,
      home: false
    };
    if (catC >= 0) G.cats.push(makeMover(catC, catR, st.cat, 'cat'));
    if (mouseC >= 0) G.mice.push(makeMover(mouseC, mouseR, st.mouse, 'mouse'));
    G.budget = st.budget;
    G.left = st.budget;
    G.sense = st.sense;
    G.spd = st.spd;
    G.time = st.time;
    G.timeMax = st.time;
    G.why = '';
    G.stuck = 0;
    G.repath = 0;
    G.catTaught = false;
    G.poisonTaught = false;
    G.cx = G.bird.x + 48;
    G.cy = G.bird.y;
    G.cvx = 0;
    G.cvy = 0;
  }

  function startStage(i, fromFail) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.16;
    G.settle = 0;
    G.taught = G.taught && fromFail;
    particles.length = 0;
    rings.length = 0;
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
    marks.length = 0;
    G.lives = LIVES;
    G.taught = false;
    startStage(0, false);
  }

  function bootTitle() {
    particles.length = 0;
    rings.length = 0;
    marks.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    G.demoT = 0;
    G.demoI = 0;
    applyStage(STAGES[0]);
    showOverlay(
      'title',
      '屑径',
      '撒一把屑，鸟会去最近的一粒。<br />把它引到金巢，别喂错。',
      '撒屑',
      'CRUMB',
      OPS
    );
    setHint('点地撒屑 · 鸟会去最近的一粒', '');
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
      cat: ['猫口', '鸟被猫一口叼走了。', 'CAT'],
      poison: ['毒籽', '它啄了品红的籽。', 'BAIT'],
      stuck: ['饿住', '屑尽了，鸟还闻不到巢。', 'HUNGER'],
      time: ['入夜', '天黑了，巢还没到。', 'DUSK']
    };
    const m = map[why] || map.stuck;
    showOverlay(
      'lose',
      m[0],
      more ? m[1] + '<br />还剩 ' + G.lives + ' 次。' : m[1] + '<br />十径未完。',
      more ? '再撒本径' : '再来一局',
      m[2]
    );
    setHint(m[0], 'warn');
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.85;
    G.goldFlash = 0.8;
    audio.clear();
    toast(STAGES[G.stage].name + ' · 归巢', false, true);
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay(
        'win',
        '归巢',
        '十径屑路都接到了金巢。鸟安睡。',
        '再撒一巡',
        'HOME'
      );
      setHint('十径归巢', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 0.95;
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
    G.magFlash = 0.7;
    G.shake = 12;
    G.lock = 0.78;
    audio.hit();
    if (G.bird) G.bird.alive = false;
    const msg = why === 'cat' ? '被猫咬了'
      : why === 'poison' ? '啄了毒籽'
      : why === 'time' ? '天黑了'
      : '屑尽饿住';
    toast(msg, true);
    setHint(msg, 'warn');
    if (G.bird) {
      emit(22, {
        x: G.bird.x, y: G.bird.y, j: 12,
        vx0: -160, vx1: 160, vy0: -140, vy1: 60,
        life: 0.55, r0: 1.2, r1: 3.2, mag: true, g: 90
      });
      addRing(G.bird.x, G.bird.y, true);
    }
  }

  function tryDrop(x, y, silent) {
    if (G.mode !== 'play' && G.mode !== 'title') return false;
    if (G.mode === 'play' && G.lock > 0) return false;
    if (G.left <= 0 && G.mode === 'play') {
      if (!silent && G.warnT <= 0) {
        audio.deny();
        toast('屑用尽了', true);
        G.warnT = 0.7;
      }
      return false;
    }
    const t = tileAt(x, y);
    if (G.solid[t.r][t.c]) {
      if (!silent && G.warnT <= 0) {
        audio.deny();
        if (G.water[t.r][t.c]) toast('水里沉下去', true);
        else toast('墙里撒不了', true);
        G.warnT = 0.55;
      }
      return false;
    }
    for (let i = 0; i < G.poisons.length; i++) {
      if (G.poisons[i].c === t.c && G.poisons[i].r === t.r) {
        if (!silent && G.warnT <= 0) {
          audio.deny();
          toast('别盖在毒籽上', true);
          G.warnT = 0.55;
        }
        return false;
      }
    }
    for (let i = 0; i < G.crumbs.length; i++) {
      if (hypot2(G.crumbs[i].x - x, G.crumbs[i].y - y) < MIN_GAP) return false;
    }
    const crumb = {
      x: x + rand(-2.2, 2.2),
      y: y + rand(-2.2, 2.2),
      vx: 0,
      vy: 0,
      r: CRUMB_R + rand(-0.6, 0.8),
      ang: rand(0, TAU),
      spin: rand(-2, 2),
      ph: rand(0, TAU)
    };
    G.crumbs.push(crumb);
    if (G.mode === 'play') G.left -= 1;
    G.repath = 0;
    emit(5, {
      x: crumb.x, y: crumb.y, j: 4,
      vx0: -30, vx1: 30, vy0: -50, vy1: -8,
      life: 0.32, r0: 0.8, r1: 1.8, gold: true, g: 40
    });
    if (G.mode === 'play') audio.drop();
    if (G.mode === 'play' && !G.taught) {
      G.taught = true;
      setHint('青圈是嗅距 · 接成一条线', '');
    }
    return true;
  }

  function pickTarget() {
    const b = G.bird;
    if (!b || !b.alive || b.home) return null;
    const bt = tileAt(b.x, b.y);
    let best = null;
    let bestD = G.sense;
    const consider = function (x, y, c, r, kind, item) {
      const d = hypot2(x - b.x, y - b.y);
      if (d >= bestD) return;
      if (!reachable(bt.c, bt.r, c, r)) return;
      bestD = d;
      best = { x: x, y: y, c: c, r: r, kind: kind, item: item, d: d };
    };
    for (let i = 0; i < G.crumbs.length; i++) {
      const cr = G.crumbs[i];
      const t = tileAt(cr.x, cr.y);
      consider(cr.x, cr.y, t.c, t.r, 'crumb', cr);
    }
    for (let i = 0; i < G.poisons.length; i++) {
      const p = G.poisons[i];
      consider(p.x, p.y, p.c, p.r, 'poison', p);
    }
    consider(G.nest.x, G.nest.y, G.nest.c, G.nest.r, 'nest', G.nest);
    return best;
  }

  function rebuildPath() {
    const b = G.bird;
    if (!b) return;
    const t = pickTarget();
    b.target = t;
    b.path = [];
    b.pi = 0;
    if (!t) return;
    const s = tileAt(b.x, b.y);
    const path = bfs(s.c, s.r, t.c, t.r);
    if (!path) return;
    b.path = path;
    if (path.length > 1) {
      const n = path[0];
      if (hypot2(b.x - cxOf(n.c), b.y - cyOf(n.r)) < 10) b.pi = 1;
    }
  }

  function updateCursor(dt) {
    const playing = G.mode === 'play';
    const usePtr = pointer.down || pointer.hover;
    if (playing && usePtr) {
      let tx = pointer.x;
      let ty = pointer.y;
      if (pointer.touch) ty -= 28;
      tx = clamp(tx, 12, VW - 12);
      ty = clamp(ty, 12, VH - 12);
      const nx = lerp(G.cx, tx, 1 - Math.exp(-16 * dt));
      const ny = lerp(G.cy, ty, 1 - Math.exp(-16 * dt));
      G.cvx = (nx - G.cx) / Math.max(dt, 0.001);
      G.cvy = (ny - G.cy) / Math.max(dt, 0.001);
      G.cx = nx;
      G.cy = ny;
    } else if (playing) {
      let ax = 0;
      let ay = 0;
      if (keys.l) ax -= CUR_ACC;
      if (keys.r) ax += CUR_ACC;
      if (keys.u) ay -= CUR_ACC;
      if (keys.d) ay += CUR_ACC;
      G.cvx += ax * dt;
      G.cvy += ay * dt;
      if (!keys.l && !keys.r) G.cvx *= Math.exp(-dt * CUR_FRIC);
      if (!keys.u && !keys.d) G.cvy *= Math.exp(-dt * CUR_FRIC);
      const spd = hypot2(G.cvx, G.cvy);
      if (spd > CUR_MAX) {
        G.cvx *= CUR_MAX / spd;
        G.cvy *= CUR_MAX / spd;
      }
      G.cx += G.cvx * dt;
      G.cy += G.cvy * dt;
    } else {
      G.cvx *= Math.exp(-dt * 6);
      G.cvy *= Math.exp(-dt * 6);
      G.cx += G.cvx * dt;
      G.cy += G.cvy * dt;
    }
    G.cx = clamp(G.cx, 10, VW - 10);
    G.cy = clamp(G.cy, 10, VH - 10);

    if (playing && G.lock <= 0) {
      const want = pointer.down || keys.drop;
      if (want && G.dropCool <= 0) {
        if (tryDrop(G.cx, G.cy, pointer.down)) G.dropCool = pointer.down ? 0.09 : 0.16;
        else G.dropCool = 0.08;
      }
    }
  }

  function stepMover(m, dt) {
    if (!m.pts.length) return;
    const dest = m.pts[m.i];
    const dx = dest.x - m.x;
    const dy = dest.y - m.y;
    const d = hypot2(dx, dy);
    if (d < 4) {
      m.i += m.dir;
      if (m.i >= m.pts.length) {
        m.dir = -1;
        m.i = Math.max(0, m.pts.length - 2);
      } else if (m.i < 0) {
        m.dir = 1;
        m.i = Math.min(m.pts.length - 1, 1);
      }
      return;
    }
    const s = m.spd * dt;
    m.x += (dx / d) * Math.min(s, d);
    m.y += (dy / d) * Math.min(s, d);
    m.ang = lerpAng(m.ang, Math.atan2(dy, dx), 1 - Math.exp(-10 * dt));
    m.hop += dt * 10;
  }

  function updateCrumbs(dt) {
    for (let i = G.crumbs.length - 1; i >= 0; i--) {
      const cr = G.crumbs[i];
      const t = tileAt(cr.x, cr.y);
      const w = G.wind[t.r][t.c];
      if (w) {
        cr.vx += w.vx * 1.6 * dt;
        cr.vy += w.vy * 1.6 * dt;
      }
      cr.vx *= Math.exp(-dt * 1.8);
      cr.vy *= Math.exp(-dt * 1.8);
      let nx = cr.x + cr.vx * dt;
      let ny = cr.y + cr.vy * dt;
      if (blockedAt(nx, cr.y)) {
        nx = cr.x;
        cr.vx *= -0.2;
      }
      if (blockedAt(cr.x, ny)) {
        ny = cr.y;
        cr.vy *= -0.2;
      }
      cr.x = nx;
      cr.y = ny;
      cr.ang += cr.spin * dt;
      const t2 = tileAt(cr.x, cr.y);
      if (G.water[t2.r][t2.c]) {
        emit(7, {
          x: cr.x, y: cr.y, j: 5,
          vx0: -40, vx1: 40, vy0: -20, vy1: 40,
          life: 0.4, r0: 1, r1: 2.2, cyan: true, g: 50
        });
        G.crumbs.splice(i, 1);
        G.repath = 0;
      }
    }
  }

  function eatCrumb(item) {
    const idx = G.crumbs.indexOf(item);
    if (idx >= 0) G.crumbs.splice(idx, 1);
    addMark(item.x, item.y);
    emit(8, {
      x: item.x, y: item.y, j: 5,
      vx0: -50, vx1: 50, vy0: -70, vy1: -10,
      life: 0.36, r0: 0.8, r1: 2, gold: true, g: 30
    });
    if (G.mode === 'play') audio.eat();
    G.repath = 0;
  }

  function updateBird(dt, canFail) {
    const b = G.bird;
    if (!b) return;
    b.peck = Math.max(0, b.peck - dt);
    b.eat = Math.max(0, b.eat - dt);
    if (!b.alive) {
      b.hop += dt * 8;
      return;
    }
    if (b.home) {
      b.hop += dt * 6;
      b.x = lerp(b.x, G.nest.x, 1 - Math.exp(-6 * dt));
      b.y = lerp(b.y, G.nest.y, 1 - Math.exp(-6 * dt));
      return;
    }

    G.repath -= dt;
    if (G.repath <= 0) {
      rebuildPath();
      G.repath = 0.18;
    }

    const t = b.target;
    if (t && t.kind === 'poison' && canFail && !G.poisonTaught) {
      G.poisonTaught = true;
      toast('别去品红籽', true);
      setHint('撒近一点的屑，把它从毒籽旁拉开', 'warn');
    }

    if (b.eat > 0) {
      b.hop += dt * 16;
      b.vx *= Math.exp(-dt * 8);
      b.vy *= Math.exp(-dt * 8);
    } else if (t && b.path && b.path.length) {
      let tx = t.x;
      let ty = t.y;
      if (b.pi < b.path.length) {
        const n = b.path[b.pi];
        tx = cxOf(n.c);
        ty = cyOf(n.r);
        if (hypot2(b.x - tx, b.y - ty) < 7) {
          b.pi += 1;
          if (b.pi < b.path.length) {
            tx = cxOf(b.path[b.pi].c);
            ty = cyOf(b.path[b.pi].r);
          } else {
            tx = t.x;
            ty = t.y;
          }
        }
      }
      const dx = tx - b.x;
      const dy = ty - b.y;
      const d = hypot2(dx, dy);
      if (d > 0.4) {
        const sp = G.spd;
        b.vx = (dx / d) * sp;
        b.vy = (dy / d) * sp;
        b.ang = lerpAng(b.ang, Math.atan2(dy, dx), 1 - Math.exp(-12 * dt));
        let nx = b.x + b.vx * dt;
        let ny = b.y + b.vy * dt;
        if (blockedAt(nx, b.y)) nx = b.x;
        if (blockedAt(b.x, ny)) ny = b.y;
        if (blockedAt(nx, ny)) {
          nx = b.x;
          ny = b.y;
        }
        b.x = nx;
        b.y = ny;
        b.hop += dt * (10 + hypot2(b.vx, b.vy) * 0.04);
      }
    } else {
      b.vx *= Math.exp(-dt * 7);
      b.vy *= Math.exp(-dt * 7);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.hop += dt * 3.5;
      if (b.peck <= 0 && Math.random() < dt * 1.4) {
        b.peck = 0.28;
        if (G.mode === 'play') audio.peck();
      }
    }

    if (t) {
      const reach = t.kind === 'nest' ? NEST_R * 0.72 : (t.kind === 'poison' ? POISON_R : CRUMB_R + 7);
      if (hypot2(b.x - t.x, b.y - t.y) < reach) {
        if (t.kind === 'crumb') {
          eatCrumb(t.item);
          b.eat = 0.1;
        } else if (t.kind === 'poison') {
          if (canFail) beginFail('poison');
        } else if (t.kind === 'nest') {
          b.home = true;
          G.goldFlash = Math.max(G.goldFlash, 0.5);
          G.pulse = 1;
          addRing(G.nest.x, G.nest.y, false);
          emit(16, {
            x: G.nest.x, y: G.nest.y, j: 12,
            vx0: -70, vx1: 70, vy0: -90, vy1: -10,
            life: 0.6, r0: 1.2, r1: 2.8, gold: true, g: -20
          });
          if (G.mode === 'play') audio.nest();
        }
      }
    }

    if (canFail && G.cats.length) {
      for (let i = 0; i < G.cats.length; i++) {
        const cat = G.cats[i];
        const d = hypot2(b.x - cat.x, b.y - cat.y);
        if (d < BIRD_R + CAT_R - 3) {
          beginFail('cat');
          return;
        }
        if (d < 52 && !G.catTaught) {
          G.catTaught = true;
          toast('猫近了', true);
          setHint('等猫走开再撒过道', 'warn');
          if (G.warnT <= 0) {
            audio.warn();
            G.warnT = 0.5;
          }
        }
      }
    }

    if (canFail) {
      const noCrumb = G.left <= 0 && G.crumbs.length === 0;
      const noHome = !(t && t.kind === 'nest');
      if (noCrumb && noHome) {
        G.stuck += dt;
        if (G.stuck > 1.15) beginFail('stuck');
      } else {
        G.stuck = 0;
      }
    }
  }

  function updateMice(dt) {
    for (let i = 0; i < G.mice.length; i++) {
      const m = G.mice[i];
      let nearest = null;
      let nd = 90;
      for (let k = 0; k < G.crumbs.length; k++) {
        const d = hypot2(G.crumbs[k].x - m.x, G.crumbs[k].y - m.y);
        if (d < nd) {
          nd = d;
          nearest = G.crumbs[k];
        }
      }
      if (nearest) {
        const dx = nearest.x - m.x;
        const dy = nearest.y - m.y;
        const d = hypot2(dx, dy) || 1;
        const s = (m.spd + 18) * dt;
        m.x += (dx / d) * s;
        m.y += (dy / d) * s;
        m.ang = lerpAng(m.ang, Math.atan2(dy, dx), 1 - Math.exp(-10 * dt));
        m.hop += dt * 14;
        if (d < 12) {
          eatCrumb(nearest);
          emit(4, {
            x: m.x, y: m.y, j: 4,
            vx0: -30, vx1: 30, vy0: -40, vy1: 10,
            life: 0.28, r0: 0.7, r1: 1.6, mag: true, g: 40
          });
        }
      } else {
        stepMover(m, dt);
      }
    }
  }

  function updateTitle(dt) {
    G.demoT += dt;
    if (G.bird && G.bird.home) {
      G.settle += dt;
      if (G.settle > 1.1) {
        applyStage(STAGES[0]);
        G.demoT = 0;
        G.demoI = 0;
        G.settle = 0;
      }
    } else if (G.demoT > 0.35 + G.demoI * 0.3 && G.demoI < 9) {
      const y = cyOf(4) + (G.demoI % 2) * 8;
      const x = cxOf(2) + G.demoI * 64;
      tryDrop(x, y, true);
      G.demoI += 1;
    }
    updateCrumbs(dt);
    updateBird(dt, false);
  }

  function updatePlay(dt) {
    if (G.why) {
      if (G.lock <= 0) failStage(G.why);
      return;
    }
    if (!(G.bird && G.bird.home)) {
      G.time -= dt;
      if (G.time <= 0) {
        G.time = 0;
        beginFail('time');
        return;
      }
    }
    updateCrumbs(dt);
    for (let i = 0; i < G.cats.length; i++) stepMover(G.cats[i], dt);
    updateMice(dt);
    updateBird(dt, true);
    if (G.bird && G.bird.home) {
      G.settle += dt;
      if (G.settle > 0.42) clearStage();
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.8);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lock = Math.max(0, G.lock - dt);
    G.pulse = Math.max(0, G.pulse - dt * 1.6);
    G.dropCool = Math.max(0, G.dropCool - dt);
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
      if (rings[i].t > 0.55) rings.splice(i, 1);
    }
    for (let i = marks.length - 1; i >= 0; i--) {
      marks[i].t -= dt * 0.28;
      if (marks[i].t <= 0) marks.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    updateCursor(dt);
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      G.settle -= dt;
      updateCrumbs(dt);
      updateBird(dt, false);
      for (let i = 0; i < G.cats.length; i++) stepMover(G.cats[i], dt);
      if (G.settle <= 0) startStage(G.stage + 1, false);
    } else {
      updateCrumbs(dt);
      updateBird(dt, false);
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
    const g = ctx.createRadialGradient(sx(80), sy(40), 8, sx(80), sy(40), 280 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.14)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(sx(VW - 60), sy(30), 8, sx(VW - 60), sy(30), 260 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.12)');
    g2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    ctx.fillStyle = '#070414';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const tw = 0.45 + 0.55 * Math.abs(Math.sin(G.clock * m.tw + m.p));
      ctx.fillStyle = 'rgba(255, 227, 107,' + (m.a * tw) + ')';
      ctx.beginPath();
      ctx.arc(sx(m.x + Math.sin(G.clock * 0.3 + m.p) * 6), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawMaze() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = sx(c * TILE);
        const y = sy(r * TILE);
        const tw = TILE * scale;
        const hsh = cellHash(c, r);
        if (G.water[r][c]) {
          const pulse = 0.5 + 0.5 * Math.sin(G.clock * 1.6 + c * 0.4 + r * 0.3);
          ctx.fillStyle = 'rgba(0, 40, 70,' + (0.55 + pulse * 0.12) + ')';
          ctx.fillRect(x, y, tw + 0.5, tw + 0.5);
          ctx.strokeStyle = 'rgba(0, 240, 255,' + (0.18 + pulse * 0.16) + ')';
          ctx.lineWidth = 1 * scale;
          ctx.beginPath();
          const yy = y + tw * (0.35 + 0.12 * Math.sin(G.clock * 2 + c));
          ctx.moveTo(x, yy);
          ctx.quadraticCurveTo(x + tw * 0.5, yy + 3 * scale * pulse, x + tw, yy);
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255, 61, 184, 0.12)';
          ctx.beginPath();
          const yy2 = y + tw * (0.62 + 0.1 * Math.sin(G.clock * 1.7 + r));
          ctx.moveTo(x, yy2);
          ctx.quadraticCurveTo(x + tw * 0.5, yy2 - 3 * scale, x + tw, yy2);
          ctx.stroke();
          continue;
        }
        const w = G.wind[r][c];
        if (w) {
          ctx.fillStyle = w.vx > 0 ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255, 61, 184, 0.05)';
          ctx.fillRect(x, y, tw + 0.5, tw + 0.5);
          ctx.strokeStyle = w.vx > 0 ? 'rgba(0, 240, 255, 0.28)' : 'rgba(255, 61, 184, 0.28)';
          ctx.lineWidth = 1.1 * scale;
          const shift = ((G.clock * 48) + c * 10 + r * 6) % (TILE * 0.7);
          const dir = w.vx >= 0 ? 1 : -1;
          for (let k = 0; k < 2; k++) {
            const px = x + ((shift + k * 14) % tw);
            const py = y + tw * (0.32 + k * 0.36);
            ctx.beginPath();
            ctx.moveTo(px, py - 3 * scale);
            ctx.lineTo(px + 7 * scale * dir, py);
            ctx.lineTo(px, py + 3 * scale);
            ctx.stroke();
          }
        } else if (!G.solid[r][c]) {
          ctx.fillStyle = hsh > 0.72 ? '#0b0818' : '#090616';
          ctx.fillRect(x, y, tw + 0.5, tw + 0.5);
          if (hsh > 0.86) {
            ctx.fillStyle = 'rgba(0, 240, 255, 0.04)';
            ctx.fillRect(x + tw * 0.3, y + tw * 0.4, 2 * scale, 2 * scale);
          }
        }
      }
    }

    for (let i = 0; i < marks.length; i++) {
      const m = marks[i];
      ctx.fillStyle = 'rgba(255, 227, 107,' + (0.12 * m.t) + ')';
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), 3.2 * scale, 0, TAU);
      ctx.fill();
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!G.solid[r][c] || G.water[r][c]) continue;
        const x = sx(c * TILE);
        const y = sy(r * TILE);
        const tw = TILE * scale;
        const hsh = cellHash(c, r);
        const mag = hsh > 0.55;
        ctx.fillStyle = mag ? '#14081c' : '#0c1020';
        roundRect(ctx, x + 1.2 * scale, y + 1.2 * scale, tw - 2.4 * scale, tw - 2.4 * scale, 6 * scale);
        ctx.fill();
        ctx.strokeStyle = mag ? 'rgba(255, 61, 184, 0.42)' : 'rgba(0, 240, 255, 0.38)';
        ctx.lineWidth = 1.15 * scale;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(x + 6 * scale, y + 7 * scale);
        ctx.lineTo(x + tw - 8 * scale, y + 7 * scale);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(sx(0) + 1, sy(0) + 1, VW * scale - 2, VH * scale - 2);
  }

  function drawNest() {
    const n = G.nest;
    const pulse = 0.55 + 0.45 * Math.sin(G.clock * 2.4) + G.pulse * 0.4;
    const halo = ctx.createRadialGradient(sx(n.x), sy(n.y), 4 * scale, sx(n.x), sy(n.y), NEST_R * 2.1 * scale);
    halo.addColorStop(0, 'rgba(255, 227, 107,' + (0.22 * pulse) + ')');
    halo.addColorStop(1, 'rgba(255, 227, 107, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx(n.x), sy(n.y), NEST_R * 2.1 * scale, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(sx(n.x), sy(n.y));
    ctx.rotate(Math.sin(G.clock * 0.4) * 0.04);
    ctx.strokeStyle = 'rgba(255, 227, 107,' + (0.55 + pulse * 0.3) + ')';
    ctx.lineWidth = 2.1 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 2 * scale, 15 * scale, 10 * scale, 0.15, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 1 * scale, 10 * scale, 6.5 * scale, -0.2, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.45)';
    ctx.lineWidth = 1.1 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, 5.2 * scale, 0.2, 2.6);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 227, 107, 0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, 2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPoisons() {
    for (let i = 0; i < G.poisons.length; i++) {
      const p = G.poisons[i];
      const tw = 0.6 + 0.4 * Math.sin(G.clock * 3 + p.ph);
      ctx.fillStyle = 'rgba(255, 61, 184,' + (0.12 + tw * 0.1) + ')';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 14 * scale, 0, TAU);
      ctx.fill();
      const berries = [
        [0, -2.4], [-4.2, 2.2], [4.4, 2.4]
      ];
      for (let k = 0; k < berries.length; k++) {
        ctx.fillStyle = k === 1 ? '#c2187a' : '#ff3db8';
        ctx.beginPath();
        ctx.arc(sx(p.x + berries[k][0]), sy(p.y + berries[k][1]), 4.1 * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 180, 220, 0.45)';
        ctx.beginPath();
        ctx.arc(sx(p.x + berries[k][0] - 1.1), sy(p.y + berries[k][1] - 1.2), 1.1 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255, 227, 107, 0.25)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(p.x), sy(p.y - 8));
      ctx.lineTo(sx(p.x + 2), sy(p.y - 12));
      ctx.stroke();
    }
  }

  function drawCrumbs() {
    const b = G.bird;
    for (let i = 0; i < G.crumbs.length; i++) {
      const cr = G.crumbs[i];
      const near = b && hypot2(cr.x - b.x, cr.y - b.y) < G.sense;
      const tw = 0.7 + 0.3 * Math.sin(G.clock * 5 + cr.ph);
      if (near) {
        ctx.fillStyle = 'rgba(255, 227, 107,' + (0.1 + tw * 0.08) + ')';
        ctx.beginPath();
        ctx.arc(sx(cr.x), sy(cr.y), 9 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.save();
      ctx.translate(sx(cr.x), sy(cr.y));
      ctx.rotate(cr.ang);
      ctx.fillStyle = near ? '#ffe36b' : '#d4b85a';
      ctx.beginPath();
      ctx.moveTo(cr.r * scale, 0);
      ctx.lineTo(-cr.r * 0.6 * scale, cr.r * 0.7 * scale);
      ctx.lineTo(-cr.r * 0.3 * scale, -cr.r * 0.8 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(-0.6 * scale, -0.8 * scale, 0.9 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBird() {
    const b = G.bird;
    if (!b) return;
    const hop = Math.abs(Math.sin(b.hop)) * (b.alive ? 6.5 : 1);
    const x = sx(b.x);
    const y = sy(b.y - hop);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(sx(b.x), sy(b.y + 8), 8 * scale, 3 * scale, 0, 0, TAU);
    ctx.fill();

    if (b.alive && !b.home && G.mode !== 'fail') {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255,' + (0.18 + 0.1 * Math.sin(G.clock * 3)) + ')';
      ctx.setLineDash([5 * scale, 6 * scale]);
      ctx.lineDashOffset = -G.clock * 22 * scale;
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), G.sense * scale, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(b.ang);
    if (!b.alive) ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#0c2230';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.35 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10.5 * scale, 6.4 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.ellipse(-1.5 * scale, -1.2 * scale, 6.2 * scale, 3.4 * scale, -0.35 + Math.sin(b.hop) * 0.25, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.moveTo(10.2 * scale, -1.4 * scale);
    ctx.lineTo(15.5 * scale, 0);
    ctx.lineTo(10.2 * scale, 1.5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-9.5 * scale, -2 * scale);
    ctx.lineTo(-15 * scale, 0);
    ctx.lineTo(-9.5 * scale, 2.4 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f6f3ff';
    ctx.beginPath();
    ctx.arc(5.2 * scale, -2.1 * scale, 1.35 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(5.5 * scale, -2.1 * scale, 0.7 * scale, 0, TAU);
    ctx.fill();
    if (hop < 2.2) {
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.8)';
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(-2 * scale, 6 * scale);
      ctx.lineTo(-1 * scale, 9 * scale);
      ctx.moveTo(3 * scale, 6 * scale);
      ctx.lineTo(4 * scale, 9 * scale);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCat(cat) {
    const hop = Math.abs(Math.sin(cat.hop)) * 2;
    ctx.save();
    ctx.translate(sx(cat.x), sy(cat.y - hop));
    ctx.rotate(cat.ang);
    ctx.fillStyle = 'rgba(255, 61, 184, 0.12)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18 * scale, 11 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0814';
    ctx.strokeStyle = '#ff3db8';
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 1 * scale, 13 * scale, 7.2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8 * scale, -4 * scale);
    ctx.lineTo(11 * scale, -11 * scale);
    ctx.lineTo(4.5 * scale, -6 * scale);
    ctx.moveTo(12.5 * scale, -2 * scale);
    ctx.lineTo(16 * scale, -9 * scale);
    ctx.lineTo(9.5 * scale, -4 * scale);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(-12 * scale, 1 * scale);
    ctx.quadraticCurveTo(-20 * scale, -8 * scale + Math.sin(cat.hop) * 4 * scale, -18 * scale, 6 * scale);
    ctx.stroke();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(10.2 * scale, -0.6 * scale, 1.2 * scale, 0, TAU);
    ctx.arc(7.4 * scale, -0.2 * scale, 1.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawMouse(m) {
    const hop = Math.abs(Math.sin(m.hop)) * 2.4;
    ctx.save();
    ctx.translate(sx(m.x), sy(m.y - hop));
    ctx.rotate(m.ang);
    ctx.fillStyle = '#161022';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.15 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8 * scale, 5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 61, 184, 0.7)';
    ctx.beginPath();
    ctx.arc(-2 * scale, -5.2 * scale, 2.4 * scale, 0, TAU);
    ctx.arc(2.2 * scale, -5 * scale, 2.4 * scale, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.75)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(-7 * scale, 1 * scale);
    ctx.quadraticCurveTo(-14 * scale, 6 * scale, -12 * scale, 2 * scale);
    ctx.stroke();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(3.4 * scale, -1 * scale, 0.8 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawCursor() {
    if (G.mode !== 'play' && G.mode !== 'title') return;
    if (G.mode === 'title') return;
    const t = tileAt(G.cx, G.cy);
    const ok = walkable(t.c, t.r) && G.left > 0;
    const x = sx(G.cx);
    const y = sy(G.cy);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = ok ? '#ffe36b' : '#ff3db8';
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 8 * scale, y);
    ctx.lineTo(x + 8 * scale, y);
    ctx.moveTo(x, y - 8 * scale);
    ctx.lineTo(x, y + 8 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 11 * scale, 0, TAU);
    ctx.stroke();
    if (ok) {
      ctx.fillStyle = 'rgba(255, 227, 107, 0.55)';
      ctx.beginPath();
      ctx.arc(x + 4 * scale, y + 5 * scale, 1.6 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.55;
      ctx.strokeStyle = r.mag
        ? 'rgba(255, 61, 184,' + (0.55 * (1 - k)) + ')'
        : 'rgba(255, 227, 107,' + (0.5 * (1 - k)) + ')';
      ctx.lineWidth = (1.6 + (1 - k) * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (10 + k * 38) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.mag
        ? 'rgba(255, 61, 184,' + a + ')'
        : p.cyan
          ? 'rgba(0, 240, 255,' + a + ')'
          : 'rgba(255, 227, 107,' + a + ')';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawFlashes() {
    ctx.restore();
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.magFlash * 0.18) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (G.goldFlash * 0.12) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    const shx = G.shake ? rand(-G.shake, G.shake) * scale * 0.35 : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) * scale * 0.35 : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);
    drawBg();
    drawMaze();
    drawNest();
    drawPoisons();
    drawCrumbs();
    for (let i = 0; i < G.mice.length; i++) drawMouse(G.mice[i]);
    for (let i = 0; i < G.cats.length; i++) drawCat(G.cats[i]);
    drawBird();
    drawFx();
    drawCursor();
    drawFlashes();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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
    for (let i = 0; i < 36; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(16, VH - 16),
        r: rand(0.5, 1.5),
        a: rand(0.04, 0.16),
        p: rand(0, TAU),
        tw: rand(1.1, 3.2)
      });
    }
  }

  function onKey(e, down) {
    const code = e.code;
    if (code === 'ArrowLeft' || code === 'ArrowRight' || code === 'ArrowUp' || code === 'ArrowDown' || code === 'Space') {
      e.preventDefault();
    }
    if (code === 'KeyA' || code === 'ArrowLeft') keys.l = down;
    if (code === 'KeyD' || code === 'ArrowRight') keys.r = down;
    if (code === 'KeyW' || code === 'ArrowUp') keys.u = down;
    if (code === 'KeyS' || code === 'ArrowDown') keys.d = down;
    if (code === 'Space' || code === 'Enter') {
      if (down) {
        if (G.mode === 'title' || G.mode === 'win' || G.mode === 'fail') {
          overlayAction();
          return;
        }
        keys.drop = true;
      } else {
        keys.drop = false;
      }
    }
    if (!down) return;
    if (code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
    }
    if (code === 'KeyR') {
      e.preventDefault();
      audio.ensure();
      startRun();
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
    G.cx = p.x;
    G.cy = pointer.touch ? p.y - 28 : p.y;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }
    if (G.mode === 'play') {
      tryDrop(G.cx, G.cy, false);
      G.dropCool = 0.12;
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    const p = pointerWorld(e);
    pointer.x = p.x;
    pointer.y = p.y;
    if (e.pointerType === 'mouse') pointer.hover = true;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    if (e.pointerType !== 'mouse') pointer.hover = false;
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
    keys.l = keys.r = keys.u = keys.d = keys.drop = false;
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
    draw();
  }
  requestAnimationFrame(frame);
})();
