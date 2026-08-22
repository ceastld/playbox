'use strict';

(function () {
  const COLS = 15;
  const ROWS = 19;
  const TILE = 32;
  const VW = COLS * TILE;
  const VH = ROWS * TILE;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SPEED = 252;
  const SPRAY_R = 42;
  const DRAIN = 10.8;
  const WET_ADD = 18.5;
  const MUTE_KEY = 'playbox-moss-grow-mute';
  const OPS = 'WASD / 方向键移刷 · 空格喷湿 · 按住拖动 · M 静音';

  const WALL = 0;
  const STONE = 1;
  const SEEP = 2;
  const HEAT = 3;
  const SALT = 4;
  const SEED = 5;
  const DOOR = 6;

  const DC = [1, -1, 0, 0];
  const DR = [0, 0, 1, -1];

  const STAGES = [
    {
      name: '初潮',
      sub: 'FIRST',
      hint: '从脚边刷一条湿痕，青苔会顺着爬到门',
      dew: 100,
      time: 48,
      evap: 0.09,
      grow: 3.15,
      map: [
        '###############',
        '#.............#',
        '#......E......#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#......P......#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '绕石',
      sub: 'ROCK',
      hint: '石块长不出苔，把湿气绕过去',
      dew: 86,
      time: 44,
      evap: 0.11,
      grow: 3.05,
      map: [
        '###############',
        '#.............#',
        '#......E......#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#...#######...#',
        '#...#######...#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#......P......#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '省露',
      sub: 'DEW',
      hint: '露水有限，只湿要走的那条路',
      dew: 48,
      time: 46,
      evap: 0.1,
      grow: 3.1,
      map: [
        '###############',
        '#E............#',
        '#.............#',
        '#####.........#',
        '#.............#',
        '#.............#',
        '#........######',
        '#.............#',
        '#.............#',
        '######........#',
        '#.............#',
        '#.............#',
        '#........######',
        '#.............#',
        '#.............#',
        '#.............#',
        '#............P#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '热缝',
      sub: 'HEAT',
      hint: '品红热口会烤干湿气和青苔，绕开',
      dew: 78,
      time: 44,
      evap: 0.13,
      grow: 3.0,
      map: [
        '###############',
        '#.............#',
        '#......E......#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#...HHHHHHH...#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#......P......#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '回干',
      sub: 'DRY',
      hint: '湿气回得快。先湿一截，等苔跟上再刷',
      dew: 88,
      time: 42,
      evap: 0.4,
      grow: 3.25,
      map: [
        '###############',
        '#.............#',
        '#......E......#',
        '#.............#',
        '#..###...###..#',
        '#.............#',
        '#.............#',
        '#......#......#',
        '#...~.....~...#',
        '#......#......#',
        '#.............#',
        '#.............#',
        '#..###...###..#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#......P......#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '盐线',
      sub: 'SALT',
      hint: '盐地上长不出苔，从缺口绕',
      dew: 72,
      time: 44,
      evap: 0.14,
      grow: 3.0,
      map: [
        '###############',
        '#.............#',
        '#......E......#',
        '#.............#',
        '#.............#',
        '#....SSSSSSSSS#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#SSSSSSSSS....#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#......P......#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '穿廊',
      sub: 'HALL',
      hint: '窄廊里把湿痕送到头，别刷进死角',
      dew: 58,
      time: 50,
      evap: 0.16,
      grow: 2.95,
      map: [
        '###############',
        '#............E#',
        '#.............#',
        '#......########',
        '#......#......#',
        '#......#......#',
        '#......#......#',
        '#......#......#',
        '#......#......#',
        '#......#......#',
        '#......#......#',
        '#......#......#',
        '#......#......#',
        '#......#......#',
        '#......#......#',
        '#......#......#',
        '#P.....#......#',
        '#......#......#',
        '###############'
      ]
    },
    {
      name: '日扫',
      sub: 'BEAM',
      hint: '躲开扫过的热光，湿痕断了要补',
      dew: 76,
      time: 46,
      evap: 0.16,
      grow: 3.05,
      beam: { axis: 'x', mid: 7, amp: 4.35, speed: 1.12, width: 1.12 },
      map: [
        '###############',
        '#.............#',
        '#......E......#',
        '#.............#',
        '#.##.......##.#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.##.......##.#',
        '#.............#',
        '#.............#',
        '#......P......#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '风廊',
      sub: 'WIND',
      hint: '风把湿气吹偏，往上风处多刷一点',
      dew: 70,
      time: 44,
      evap: 0.18,
      grow: 3.0,
      wind: { dx: 1, dy: 0, k: 1.18 },
      map: [
        '###############',
        '#.............#',
        '#...........E.#',
        '#.............#',
        '#..###...###..#',
        '#.............#',
        '#.............#',
        '#####.....##.##',
        '#.............#',
        '#.............#',
        '##.##.....#####',
        '#.............#',
        '#.............#',
        '#..###...###..#',
        '#.............#',
        '#.............#',
        '#.P...........#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '门庭',
      sub: 'GATE',
      hint: '热、盐、风一起。省着刷，连到门',
      dew: 62,
      time: 52,
      evap: 0.2,
      grow: 2.92,
      wind: { dx: 1, dy: 0, k: 0.62 },
      map: [
        '###############',
        '#......E......#',
        '#.##.......##.#',
        '#.##..H....##.#',
        '#......S......#',
        '#SSS.......SSS#',
        '#.............#',
        '###..#####..###',
        '#.............#',
        '#..H.......H..#',
        '#.............#',
        '###..#####..###',
        '#.............#',
        '#.SSS.....SSS.#',
        '#.............#',
        '#.##.......##.#',
        '#......P......#',
        '#.............#',
        '###############'
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
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');
  const stageLabel = document.getElementById('stage-label');
  const distLabel = document.getElementById('dist-label');
  const timeLabel = document.getElementById('time-label');
  const pipsEl = document.getElementById('pips');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');

  const N = COLS * ROWS;
  const kind = new Uint8Array(N);
  const wet = new Float32Array(N);
  const moss = new Float32Array(N);
  const growBuf = new Float32Array(N);
  const heatMap = new Float32Array(N);
  const wetTmp = new Float32Array(N);
  const distField = new Int16Array(N);
  const qBuf = new Int16Array(N);

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const keys = { l: false, r: false, u: false, d: false, spray: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH * 0.7, id: null };
  const particles = [];
  const motes = [];
  const pips = [];
  const heats = [];
  const salts = [];
  const seeps = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    dew: 100,
    dewMax: 100,
    time: 48,
    timeMax: 48,
    evap: 0.1,
    grow: 3,
    bx: VW * 0.5,
    by: VH * 0.75,
    bvx: 0,
    bvy: 0,
    seed: { c: 7, r: 16, x: 0, y: 0 },
    door: { c: 7, r: 2, x: 0, y: 0 },
    wind: null,
    beam: null,
    dist: 12,
    spraying: false,
    connected: false,
    lock: 0,
    settle: 0,
    toastT: 0,
    shake: 0,
    magFlash: 0,
    goldFlash: 0,
    warnDew: false,
    warnTime: false,
    arid: 0,
    why: '',
    pulse: 0,
    sprayPulse: 0,
    growTick: 0,
    lastGrow: -9,
    hudNeed: true
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
  function hash(c, r) {
    const n = Math.sin(c * 12.9898 + r * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }
  function idx(c, r) {
    return r * COLS + c;
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function cxOf(c) {
    return (c + 0.5) * TILE;
  }
  function cyOf(r) {
    return (r + 0.5) * TILE;
  }
  function canWet(k) {
    return k === STONE || k === SEEP || k === SALT || k === SEED;
  }
  function canMoss(k) {
    return k === STONE || k === SEEP || k === SEED;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    lastSpray: -9,
    lastGrow: -9,
    ensure() {
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
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
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
      const n = 0.12;
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, Math.floor(sr * n)), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = hp || 900;
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
    spray() {
      if (G.clock - this.lastSpray < 0.08) return;
      this.lastSpray = G.clock;
      this.ensure();
      this.noise(0.07, 0.022, 1600);
    },
    grow() {
      if (G.clock - this.lastGrow < 0.09) return;
      this.lastGrow = G.clock;
      this.ensure();
      this.beep(520 + Math.random() * 180, 0.07, 'sine', 0.028, 880);
    },
    burn() {
      this.ensure();
      this.noise(0.16, 0.05, 420);
      this.beep(196, 0.22, 'sawtooth', 0.04, 70);
    },
    dry() {
      this.ensure();
      this.beep(247, 0.2, 'triangle', 0.05, 90);
    },
    warn() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 330);
    },
    connect() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.06, 523);
      this.beep(659, 0.12, 'sine', 0.05, 659);
      this.beep(784, 0.22, 'triangle', 0.055, 1175);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.07);
      this.beep(659, 0.14, 'sine', 0.06);
      this.beep(784, 0.16, 'sine', 0.06);
      this.beep(1046, 0.34, 'triangle', 0.07, 1560);
    },
    start() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 784);
    }
  };

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.55;
  }

  function setHint(text, kindName) {
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kindName === 'hot');
    hintEl.classList.toggle('warn', kindName === 'warn');
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

  function syncHud() {
    const st = STAGES[G.stage];
    const k = G.dewMax > 0 ? clamp(G.dew / G.dewMax, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = String(Math.round(G.dew));
    const low = G.mode === 'play' && k < 0.22;
    fillWrap.classList.toggle('warn', low);
    fillWrap.classList.toggle('hot', G.connected && G.mode === 'play');
    if (G.mode === 'title') {
      stageLabel.textContent = '十面';
      distLabel.textContent = '连到门';
      distLabel.className = '';
      timeLabel.textContent = '—';
      timeLabel.className = '';
      stageLabel.className = '';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 面 · ' + (st ? st.name : '');
      if (G.connected) {
        distLabel.textContent = '到了';
        distLabel.className = 'hot';
      } else if (G.dist < 0) {
        distLabel.textContent = '无路';
        distLabel.className = 'warn';
      } else {
        distLabel.textContent = '距门 ' + G.dist;
        distLabel.className = G.dist <= 2 ? 'hot' : '';
      }
      const sec = Math.max(0, Math.ceil(G.time));
      timeLabel.textContent = sec + 's';
      timeLabel.className = G.mode === 'play' && G.time < 8 ? 'warn' : G.mode === 'play' && G.time < 16 ? 'hot' : '';
      stageLabel.classList.toggle('hot', G.connected);
    }
    syncPips();
    G.hudNeed = false;
  }

  function showOverlay(kindName, title, lead, btn, kicker, ops) {
    overlay.classList.remove('hidden');
    panel.classList.toggle('win', kindName === 'win');
    panel.classList.toggle('lose', kindName === 'lose');
    ovKicker.textContent = kicker;
    ovTitle.textContent = title;
    ovLead.innerHTML = lead;
    ovBtn.textContent = btn;
    ovOps.textContent = ops || OPS;
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 170) particles.shift();
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
        mist: !!spec.mist,
        moss: !!spec.moss,
        g: spec.g == null ? 42 : spec.g
      });
    }
  }

  function chKind(ch) {
    if (ch === '#') return WALL;
    if (ch === '~') return SEEP;
    if (ch === 'H') return HEAT;
    if (ch === 'S') return SALT;
    if (ch === 'P') return SEED;
    if (ch === 'E') return DOOR;
    return STONE;
  }

  function parseMap(st) {
    heats.length = 0;
    salts.length = 0;
    seeps.length = 0;
    G.seed.c = 7;
    G.seed.r = ROWS - 3;
    G.door.c = 7;
    G.door.r = 2;
    for (let r = 0; r < ROWS; r++) {
      const line = st.map[r];
      for (let c = 0; c < COLS; c++) {
        const ch = line.charAt(c);
        const k = chKind(ch);
        const i = idx(c, r);
        kind[i] = k;
        wet[i] = 0;
        moss[i] = 0;
        if (k === SEED) {
          G.seed.c = c;
          G.seed.r = r;
          moss[i] = 1;
          wet[i] = 0.85;
        } else if (k === DOOR) {
          G.door.c = c;
          G.door.r = r;
        } else if (k === HEAT) {
          heats.push({ c: c, r: r, x: cxOf(c), y: cyOf(r) });
        } else if (k === SALT) {
          salts.push({ c: c, r: r, x: cxOf(c), y: cyOf(r) });
        } else if (k === SEEP) {
          seeps.push({ c: c, r: r, x: cxOf(c), y: cyOf(r) });
          wet[i] = 0.7;
        }
      }
    }
    G.seed.x = cxOf(G.seed.c);
    G.seed.y = cyOf(G.seed.r);
    G.door.x = cxOf(G.door.c);
    G.door.y = cyOf(G.door.r);
  }

  function applyStage(st, demo) {
    parseMap(st);
    G.dewMax = st.dew;
    G.dew = st.dew;
    G.timeMax = st.time;
    G.time = st.time;
    G.evap = st.evap;
    G.grow = st.grow;
    G.wind = st.wind || null;
    G.beam = st.beam || null;
    G.connected = false;
    G.warnDew = false;
    G.warnTime = false;
    G.arid = 0;
    G.why = '';
    G.pulse = 0;
    G.sprayPulse = 0;
    G.dist = 12;
    G.bx = G.seed.x;
    G.by = G.seed.y - 8;
    G.bvx = 0;
    G.bvy = 0;
    if (demo) {
      const midY = lerp(G.seed.y, G.door.y, 0.22);
      sprayAt(G.seed.x, midY, 0.45, true);
      sprayAt(G.seed.x, G.seed.y, 0.5, true);
    }
    G.hudNeed = true;
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.18;
    particles.length = 0;
    applyStage(STAGES[i], false);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    G.lives = LIVES;
    startStage(0);
  }

  function bootTitle() {
    particles.length = 0;
    G.lives = LIVES;
    G.stage = 0;
    G.mode = 'title';
    G.why = '';
    applyStage(STAGES[0], true);
    showOverlay(
      'title',
      '青苔',
      '石墙太干。刷一层湿气，让墙角那簇青苔爬到门上。',
      '开潮',
      'MOSS',
      OPS
    );
    setHint('刷湿气 · 青苔沿湿处爬 · 连到门', '');
    syncHud();
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    G.hudNeed = true;
    syncHud();
    const more = G.lives > 0;
    let title = '干了';
    let kicker = 'DRY';
    let lead;
    if (why === 'time') {
      title = '时限到';
      kicker = 'LATE';
      lead = more
        ? '青苔还没爬到门。湿痕要连着，别让它干断。<br />还剩 ' + G.lives + ' 次。'
        : '时限到。十面未完。';
      audio.dry();
    } else if (why === 'burn') {
      title = '烤干了';
      kicker = 'HEAT';
      lead = more
        ? '热口把整丛青苔烤没了。绕开品红的缝。<br />还剩 ' + G.lives + ' 次。'
        : '青苔烤尽。十面未完。';
      audio.burn();
    } else {
      title = '干透了';
      kicker = 'ARID';
      lead = more
        ? '露水用尽，墙上也干了。只湿要走的路。<br />还剩 ' + G.lives + ' 次。'
        : '墙干透了。十面未完。';
      audio.dry();
    }
    showOverlay('lose', title, lead, more ? '再刷这面' : '再来一局', kicker);
    setHint(why === 'burn' ? '绕开热口' : '湿痕要连着送到门', 'warn');
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.connected = true;
    G.lock = 0.95;
    G.goldFlash = 0.75;
    G.pulse = 1;
    audio.connect();
    toast('爬到了', false, true);
    emit(20, {
      x: G.door.x, y: G.door.y, j: 16,
      vx0: -70, vx1: 70, vy0: -90, vy1: -8,
      life: 0.72, r0: 1.2, r1: 3.4, gold: true, g: 70
    });
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay('win', '青了', '十面石墙，青苔都爬上了门框。', '再潮一巡', 'CLEAR');
      setHint('十面皆青', 'hot');
      G.hudNeed = true;
      return;
    }
    G.mode = 'clear';
    G.settle = 0.95;
    G.hudNeed = true;
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

  function beamPos(t) {
    const b = G.beam;
    if (!b) return 0;
    return b.mid + Math.sin(t * b.speed) * b.amp;
  }

  function rebuildHeat(t) {
    heatMap.fill(0);
    for (let i = 0; i < heats.length; i++) {
      const h = heats[i];
      for (let r = h.r - 3; r <= h.r + 3; r++) {
        if (r < 0 || r >= ROWS) continue;
        for (let c = h.c - 3; c <= h.c + 3; c++) {
          if (c < 0 || c >= COLS) continue;
          const d = Math.sqrt((c - h.c) * (c - h.c) + (r - h.r) * (r - h.r));
          if (d >= 1.65) continue;
          const v = 1 - d / 1.65;
          const id = idx(c, r);
          if (v > heatMap[id]) heatMap[id] = v;
        }
      }
    }
    if (G.beam) {
      const b = G.beam;
      const p = beamPos(t);
      const w = b.width;
      if (b.axis === 'x') {
        for (let r = 3; r < ROWS - 4; r++) {
          for (let c = 1; c < COLS - 1; c++) {
            const d = Math.abs(c + 0.5 - p);
            if (d >= w) continue;
            const v = (1 - d / w) * 0.92;
            const id = idx(c, r);
            if (v > heatMap[id]) heatMap[id] = v;
          }
        }
      } else {
        for (let r = 1; r < ROWS - 1; r++) {
          const d = Math.abs(r + 0.5 - p);
          if (d >= w) continue;
          const v = (1 - d / w) * 0.92;
          for (let c = 1; c < COLS - 1; c++) {
            const id = idx(c, r);
            if (v > heatMap[id]) heatMap[id] = v;
          }
        }
      }
    }
  }

  function sprayAt(x, y, dt, free) {
    const rad = SPRAY_R;
    const c0 = clamp(Math.floor((x - rad) / TILE) - 1, 0, COLS - 1);
    const c1 = clamp(Math.floor((x + rad) / TILE) + 1, 0, COLS - 1);
    const r0 = clamp(Math.floor((y - rad) / TILE) - 1, 0, ROWS - 1);
    const r1 = clamp(Math.floor((y + rad) / TILE) + 1, 0, ROWS - 1);
    let hit = 0;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = idx(c, r);
        const k = kind[i];
        if (!canWet(k)) continue;
        const dx = cxOf(c) - x;
        const dy = cyOf(r) - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= rad) continue;
        const fall = Math.pow(1 - d / rad, 0.72);
        const add = WET_ADD * fall * dt;
        const before = wet[i];
        wet[i] = Math.min(1, wet[i] + add);
        hit += wet[i] - before;
      }
    }
    if (!free && G.mode === 'play') {
      G.dew = Math.max(0, G.dew - DRAIN * dt);
    }
    return hit;
  }

  function updateWet(dt) {
    const ev = G.evap;
    for (let i = 0; i < N; i++) {
      const k = kind[i];
      if (k === WALL || k === DOOR || k === HEAT) {
        wet[i] = 0;
        continue;
      }
      const h = heatMap[i];
      let dry = ev * (0.55 + (1 - wet[i]) * 0.2);
      if (h > 0) dry += h * 1.85;
      wet[i] = Math.max(0, wet[i] - dry * dt);
      if (k === SEEP) {
        wet[i] = Math.min(1, Math.max(wet[i], 0.42) + 0.22 * dt);
      }
    }
    if (G.wind && G.wind.k) {
      const mix = clamp(G.wind.k * dt, 0, 0.42);
      const dx = G.wind.dx | 0;
      const dy = G.wind.dy | 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const i = idx(c, r);
          const sc = clamp(c - dx, 0, COLS - 1);
          const sr = clamp(r - dy, 0, ROWS - 1);
          const j = idx(sc, sr);
          const k = kind[i];
          if (!canWet(k)) {
            wetTmp[i] = 0;
          } else {
            wetTmp[i] = wet[i] * (1 - mix) + wet[j] * mix;
          }
        }
      }
      wet.set(wetTmp);
    }
  }

  function updateMoss(dt) {
    growBuf.fill(0);
    let grew = 0;
    let mossMax = 0;
    let mossSum = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(c, r);
        const k = kind[i];
        const h = heatMap[i];
        if (k === SEED) {
          moss[i] = Math.max(moss[i], 0.82);
          wet[i] = Math.max(wet[i], 0.32);
        }
        if (k === SALT && moss[i] > 0) {
          moss[i] = Math.max(0, moss[i] - dt * 6);
        }
        if (h > 0.42 && moss[i] > 0 && k !== SEED) {
          const burn = (h - 0.28) * 2.4 * dt;
          const before = moss[i];
          moss[i] = Math.max(0, moss[i] - burn);
          if (before > 0.35 && moss[i] < 0.2) {
            emit(3, {
              x: cxOf(c), y: cyOf(r), j: 6,
              vx0: -30, vx1: 30, vy0: -40, vy1: -4,
              life: 0.4, r0: 1, r1: 2.2, mag: true, g: 90
            });
          }
        }
        if (moss[i] > mossMax) mossMax = moss[i];
        mossSum += moss[i];
        if (moss[i] < 0.42) continue;
        if (!canMoss(k)) continue;
        for (let d = 0; d < 4; d++) {
          const nc = c + DC[d];
          const nr = r + DR[d];
          if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
          const j = idx(nc, nr);
          const nk = kind[j];
          if (!canMoss(nk)) continue;
          if (wet[j] < 0.2) continue;
          if (heatMap[j] > 0.62) continue;
          const rate = G.grow * (0.28 + wet[j] * 0.9) * moss[i];
          growBuf[j] += rate * dt;
        }
      }
    }
    for (let i = 0; i < N; i++) {
      if (growBuf[i] <= 0) continue;
      const before = moss[i];
      moss[i] = Math.min(1, moss[i] + growBuf[i]);
      if (before < 0.18 && moss[i] >= 0.18) {
        grew += 1;
        const c = i % COLS;
        const r = (i / COLS) | 0;
        if (particles.length < 140) {
          emit(2, {
            x: cxOf(c), y: cyOf(r), j: 5,
            vx0: -18, vx1: 18, vy0: -36, vy1: -8,
            life: 0.55, r0: 0.8, r1: 1.8, moss: true, g: 28
          });
        }
      }
    }
    if (grew > 0) {
      G.growTick += grew;
      audio.grow();
      G.hudNeed = true;
    }
    return { mossMax: mossMax, mossSum: mossSum };
  }

  function updateDist() {
    const INF = 4000;
    distField.fill(INF);
    let qh = 0;
    let qt = 0;
    const dc = G.door.c;
    const dr = G.door.r;
    for (let d = 0; d < 4; d++) {
      const c = dc + DC[d];
      const r = dr + DR[d];
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
      const i = idx(c, r);
      if (!canMoss(kind[i])) continue;
      distField[i] = 0;
      qBuf[qt++] = i;
    }
    while (qh < qt) {
      const i = qBuf[qh++];
      const c = i % COLS;
      const r = (i / COLS) | 0;
      const nd = distField[i] + 1;
      for (let d = 0; d < 4; d++) {
        const nc = c + DC[d];
        const nr = r + DR[d];
        if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
        const j = idx(nc, nr);
        if (distField[j] <= nd) continue;
        if (!canMoss(kind[j])) continue;
        distField[j] = nd;
        qBuf[qt++] = j;
      }
    }
    let best = INF;
    let nearDoor = false;
    for (let i = 0; i < N; i++) {
      if (moss[i] < 0.48) continue;
      if (distField[i] < best) best = distField[i];
    }
    for (let d = 0; d < 4; d++) {
      const c = dc + DC[d];
      const r = dr + DR[d];
      if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
      if (moss[idx(c, r)] >= 0.5) nearDoor = true;
    }
    G.dist = best >= INF ? -1 : best;
    return nearDoor;
  }

  function moveBrush(dt, canMove) {
    let ax = 0;
    let ay = 0;
    let spraying = false;
    if (canMove && pointer.down) {
      const dx = pointer.x - G.bx;
      const dy = pointer.y - G.by;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 3) {
        const k = 1 - Math.exp(-16 * dt);
        G.bx += dx * k;
        G.by += dy * k;
      }
      spraying = true;
    } else if (canMove) {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      const m = Math.sqrt(ax * ax + ay * ay);
      if (m > 1) {
        ax /= m;
        ay /= m;
      }
      const tx = ax * SPEED;
      const ty = ay * SPEED;
      G.bvx = lerp(G.bvx, tx, 1 - Math.exp(-14 * dt));
      G.bvy = lerp(G.bvy, ty, 1 - Math.exp(-14 * dt));
      G.bx += G.bvx * dt;
      G.by += G.bvy * dt;
      spraying = keys.spray;
    } else {
      G.bvx *= 0.8;
      G.bvy *= 0.8;
    }
    G.bx = clamp(G.bx, TILE * 0.7, VW - TILE * 0.7);
    G.by = clamp(G.by, TILE * 0.7, VH - TILE * 0.7);
    G.spraying = spraying && (G.dew > 0.15 || G.mode !== 'play');
    if (spraying && G.mode === 'play' && G.dew <= 0.15) {
      G.spraying = false;
      if (G.lock <= 0) {
        toast('露水干了', true);
        G.lock = 0.7;
        audio.warn();
      }
    }
    return G.spraying;
  }

  function updateDemo(dt) {
    const cycle = G.clock % 10.5;
    if (cycle < dt * 1.6) {
      applyStage(STAGES[0], true);
      G.connected = false;
    }
    const u = clamp(cycle / 8.2, 0, 1);
    const y = lerp(G.seed.y - 4, G.door.y + 20, u);
    G.bx = lerp(G.bx, G.seed.x + Math.sin(G.clock * 0.9) * 6, 0.12);
    G.by = lerp(G.by, y, 0.12);
    sprayAt(G.bx, G.by, dt * 1.15, true);
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  function maybeAmbient(dt) {
    if (Math.random() < 0.35 * dt) {
      const c = 1 + ((Math.random() * (COLS - 2)) | 0);
      const r = 1 + ((Math.random() * (ROWS - 2)) | 0);
      const i = idx(c, r);
      if (moss[i] > 0.55) {
        emit(1, {
          x: cxOf(c), y: cyOf(r), j: 4,
          vx0: -8, vx1: 8, vy0: -22, vy1: -6,
          life: 0.8, r0: 0.6, r1: 1.4, moss: true, g: 10
        });
      }
    }
    if (heats.length && Math.random() < 0.55 * dt) {
      const h = heats[(Math.random() * heats.length) | 0];
      emit(1, {
        x: h.x, y: h.y, j: 8,
        vx0: -12, vx1: 12, vy0: -28, vy1: -6,
        life: 0.5, r0: 0.7, r1: 1.6, mag: true, g: 20
      });
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.lock > 0) G.lock -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.magFlash > 0) G.magFlash = Math.max(0, G.magFlash - dt * 1.6);
    if (G.goldFlash > 0) G.goldFlash = Math.max(0, G.goldFlash - dt * 1.4);
    if (G.pulse > 0) G.pulse = Math.max(0, G.pulse - dt * 0.85);
    if (G.sprayPulse > 0) G.sprayPulse = Math.max(0, G.sprayPulse - dt * 3.2);

    const playing = G.mode === 'play';
    const sim = playing || G.mode === 'title' || G.mode === 'clear' || G.mode === 'win' || G.mode === 'fail';
    if (!sim) return;

    rebuildHeat(G.clock);

    if (G.mode === 'title') {
      updateDemo(dt);
    } else {
      const canMove = playing && G.lock <= 0;
      const spraying = moveBrush(dt, canMove);
      if (spraying) {
        const hit = sprayAt(G.bx, G.by, dt, false);
        G.sprayPulse = 1;
        audio.spray();
        if (hit > 0.002 && Math.random() < 0.45) {
          emit(1, {
            x: G.bx + rand(-10, 10), y: G.by + rand(-8, 8), j: 4,
            vx0: -16, vx1: 16, vy0: -8, vy1: 18,
            life: 0.32, r0: 0.8, r1: 2.1, mist: true, g: 50
          });
        }
      }
    }

    updateWet(dt);
    const ms = updateMoss(dt);
    const reached = updateDist();
    updateParticles(dt);
    maybeAmbient(dt);

    if (playing) {
      G.time -= dt;
      if (!G.warnDew && G.dew < 16) {
        G.warnDew = true;
        toast('露水不多了', true);
        audio.warn();
      }
      if (!G.warnTime && G.time < 8) {
        G.warnTime = true;
        toast('时间不多', true);
        audio.warn();
      }
      if (reached && !G.connected) {
        clearStage();
      }
      if (G.mode === 'play') {
        if (G.time <= 0) {
          G.shake = 10;
          failStage('time');
        } else if (ms.mossMax < 0.08 && ms.mossSum < 0.12) {
          G.magFlash = 0.7;
          G.shake = 12;
          failStage('burn');
        } else {
          let maxWet = 0;
          for (let i = 0; i < N; i++) {
            if (wet[i] > maxWet) maxWet = wet[i];
          }
          if (G.dew <= 0.4 && maxWet < 0.12 && G.dist !== 0) {
            G.arid += dt;
            if (G.arid > 1.35) failStage('dry');
          } else {
            G.arid = 0;
          }
        }
      }
      G.hudNeed = true;
    } else if (G.mode === 'title') {
      if (reached) G.connected = true;
    }

    if (G.mode === 'clear') {
      G.settle -= dt;
      if (G.settle <= 0) startStage(G.stage + 1);
    }

    if (G.hudNeed) syncHud();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawRoom(t) {
    const x0 = sx(0);
    const y0 = sy(0);
    const tw = TILE * scale;
    ctx.fillStyle = '#0b0914';
    ctx.fillRect(x0, y0, VW * scale, VH * scale);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(c, r);
        const k = kind[i];
        const x = sx(c * TILE);
        const y = sy(r * TILE);
        const hsh = hash(c, r);
        if (k === WALL) {
          const g = 10 + hsh * 10;
          ctx.fillStyle = 'rgb(' + (g + 2) + ',' + (g - 1) + ',' + (g + 12) + ')';
          ctx.fillRect(x, y, tw + 0.5, tw + 0.5);
          ctx.fillStyle = 'rgba(0, 240, 255,' + (0.03 + hsh * 0.04) + ')';
          ctx.fillRect(x, y, tw, 1.2 * scale);
          continue;
        }
        const base = 16 + hsh * 9;
        ctx.fillStyle = 'rgb(' + (base + 4) + ',' + (base + 2) + ',' + (base + 14) + ')';
        ctx.fillRect(x, y, tw + 0.4, tw + 0.4);
        if ((c + r) % 2 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.12)';
          ctx.fillRect(x, y, tw, tw);
        }
        const w = wet[i];
        if (w > 0.03) {
          ctx.fillStyle = 'rgba(2, 28, 36,' + (0.18 + w * 0.5) + ')';
          ctx.fillRect(x, y, tw, tw);
          ctx.fillStyle = 'rgba(0, 240, 255,' + (0.05 + w * 0.22) + ')';
          ctx.fillRect(x + 1.5 * scale, y + 1.5 * scale, tw - 3 * scale, tw - 3 * scale);
          ctx.fillStyle = 'rgba(180, 255, 255,' + (w * 0.16) + ')';
          ctx.fillRect(x + 3 * scale, y + 2.2 * scale, tw * 0.42, 1.4 * scale);
        }
        if (k === SEEP) {
          ctx.fillStyle = 'rgba(0, 180, 210,' + (0.1 + 0.08 * Math.sin(t * 2 + hsh * 8)) + ')';
          ctx.fillRect(x, y, tw, tw);
        }
        if (k === SALT) {
          ctx.fillStyle = 'rgba(220, 214, 232,' + (0.16 + hsh * 0.1) + ')';
          ctx.fillRect(x, y, tw, tw);
          ctx.fillStyle = 'rgba(255, 255, 255,0.18)';
          ctx.beginPath();
          ctx.arc(x + tw * (0.3 + hsh * 0.4), y + tw * 0.45, 1.4 * scale, 0, TAU);
          ctx.fill();
        }
        if (k === HEAT) {
          ctx.fillStyle = 'rgba(40, 8, 18,0.85)';
          ctx.fillRect(x, y, tw, tw);
        }
        const ht = heatMap[i];
        if (ht > 0.08 && k !== WALL) {
          ctx.fillStyle = 'rgba(255, 61, 184,' + (ht * 0.16) + ')';
          ctx.fillRect(x, y, tw, tw);
        }
      }
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.lineWidth = Math.max(1, scale * 0.6);
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(sx(c * TILE), sy(TILE));
      ctx.lineTo(sx(c * TILE), sy((ROWS - 1) * TILE));
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(sx(TILE), sy(r * TILE));
      ctx.lineTo(sx((COLS - 1) * TILE), sy(r * TILE));
      ctx.stroke();
    }
  }

  function drawMoss(t) {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = idx(c, r);
        const m = moss[i];
        if (m < 0.05) continue;
        const hsh = hash(c + 2, r + 5);
        const x = sx(cxOf(c) + (hsh - 0.5) * 5);
        const y = sy(cyOf(r) + (hash(c, r + 9) - 0.5) * 5);
        const near = distField[i] < 3 && distField[i] >= 0;
        const pulse = 0.78 + 0.22 * Math.sin(t * 3.2 + hsh * 6);
        const a = clamp(m * 0.95, 0, 1) * pulse;
        const rad = (8.4 + m * 9.2) * (0.82 + hsh * 0.38) * scale;
        ctx.globalAlpha = a;
        if (G.connected || near) {
          ctx.fillStyle = m > 0.7 ? '#7af6ff' : '#00f0ff';
        } else {
          ctx.fillStyle = m > 0.75 ? '#2ee6b0' : '#148a68';
        }
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
          x + (hsh - 0.5) * 7 * scale,
          y + (hash(c + 4, r) - 0.5) * 6 * scale,
          rad * 0.62,
          0, TAU
        );
        ctx.fill();
        ctx.globalAlpha = a * 0.55;
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(x - rad * 0.25, y - rad * 0.2, rad * 0.28, 0, TAU);
        ctx.fill();
        if (m > 0.4) {
          ctx.globalAlpha = a * 0.7;
          ctx.strokeStyle = near || G.connected ? 'rgba(255,227,107,0.45)' : 'rgba(0,240,255,0.28)';
          ctx.lineWidth = Math.max(1, 1.1 * scale);
          for (let d = 0; d < 4; d++) {
            const nc = c + DC[d];
            const nr = r + DR[d];
            if (nc < 0 || nr < 0 || nc >= COLS || nr >= ROWS) continue;
            const j = idx(nc, nr);
            if (moss[j] < 0.12 && wet[j] < 0.45) continue;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(sx(cxOf(nc)), sy(cyOf(nr)));
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawDoor(t) {
    const x = sx(G.door.x);
    const y = sy(G.door.y);
    const w = 18 * scale;
    const h = 24 * scale;
    const glow = G.connected ? 0.55 : (G.dist >= 0 && G.dist <= 3 ? 0.32 : 0.16);
    const pulse = 0.75 + 0.25 * Math.sin(t * 2.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grd = ctx.createRadialGradient(x, y, 4 * scale, x, y, 70 * scale);
    grd.addColorStop(0, 'rgba(0, 240, 255,' + (glow * pulse) + ')');
    grd.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, 70 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();

    roundRect(x - w, y - h * 0.55, w * 2, h, 4 * scale);
    ctx.fillStyle = '#07050f';
    ctx.fill();
    ctx.strokeStyle = G.connected ? '#ffe36b' : '#00f0ff';
    ctx.lineWidth = Math.max(1.4, 1.8 * scale);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.45)';
    ctx.lineWidth = Math.max(1, 0.9 * scale);
    roundRect(x - w + 3 * scale, y - h * 0.55 + 3 * scale, w * 2 - 6 * scale, h - 6 * scale, 3 * scale);
    ctx.stroke();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(x + w * 0.42, y + 1 * scale, 1.6 * scale, 0, TAU);
    ctx.fill();
    if (G.connected) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.28)';
      roundRect(x - w + 4 * scale, y - 2 * scale, w * 2 - 8 * scale, h * 0.38, 2 * scale);
      ctx.fill();
    }
  }

  function drawHeats(t) {
    for (let i = 0; i < heats.length; i++) {
      const h = heats[i];
      const x = sx(h.x);
      const y = sy(h.y);
      const p = 0.7 + 0.3 * Math.sin(t * 5 + i);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grd = ctx.createRadialGradient(x, y, 2 * scale, x, y, 36 * scale);
      grd.addColorStop(0, 'rgba(255, 61, 184,' + (0.42 * p) + ')');
      grd.addColorStop(1, 'rgba(255, 61, 184, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, 36 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#ff3db8';
      ctx.beginPath();
      ctx.moveTo(x, y - 7 * scale);
      ctx.lineTo(x + 4.2 * scale, y + 5 * scale);
      ctx.lineTo(x - 4.2 * scale, y + 5 * scale);
      ctx.closePath();
      ctx.fill();
    }
    if (G.beam) {
      const b = G.beam;
      const p = beamPos(t);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      if (b.axis === 'x') {
        const x = sx(p * TILE);
        const grd = ctx.createLinearGradient(x - 18 * scale, 0, x + 18 * scale, 0);
        grd.addColorStop(0, 'rgba(255,61,184,0)');
        grd.addColorStop(0.5, 'rgba(255,61,184,0.22)');
        grd.addColorStop(1, 'rgba(255,61,184,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(x - 18 * scale, sy(TILE), 36 * scale, (ROWS - 2) * TILE * scale);
      } else {
        const y = sy(p * TILE);
        const grd = ctx.createLinearGradient(0, y - 16 * scale, 0, y + 16 * scale);
        grd.addColorStop(0, 'rgba(255,61,184,0)');
        grd.addColorStop(0.5, 'rgba(255,61,184,0.22)');
        grd.addColorStop(1, 'rgba(255,61,184,0)');
        ctx.fillStyle = grd;
        ctx.fillRect(sx(TILE), y - 16 * scale, (COLS - 2) * TILE * scale, 32 * scale);
      }
      ctx.restore();
    }
  }

  function drawSeed(t) {
    const x = sx(G.seed.x);
    const y = sy(G.seed.y);
    const p = 0.8 + 0.2 * Math.sin(t * 2.6);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grd = ctx.createRadialGradient(x, y, 2 * scale, x, y, 26 * scale);
    grd.addColorStop(0, 'rgba(0, 240, 255,' + (0.28 * p) + ')');
    grd.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, 26 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBrush(t) {
    const x = sx(G.bx);
    const y = sy(G.by);
    const spray = G.spraying || G.sprayPulse > 0.2;
    const rad = (spray ? 13 : 9) * scale;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const grd = ctx.createRadialGradient(x, y, 2 * scale, x, y, rad * 2.4);
    const a = spray ? 0.28 : (pointer.hover || keys.spray ? 0.16 : 0.1);
    grd.addColorStop(0, 'rgba(0, 240, 255,' + a + ')');
    grd.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(x, y, rad * 2.4, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = spray ? '#ffe36b' : '#00f0ff';
    ctx.lineWidth = Math.max(1.2, 1.5 * scale);
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.55)';
    ctx.lineWidth = Math.max(1, 0.9 * scale);
    ctx.beginPath();
    ctx.arc(x, y, rad * 0.45, t * 3, t * 3 + 1.8);
    ctx.stroke();
    if (spray) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.beginPath();
      ctx.arc(x, y, SPRAY_R * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawMotes(t) {
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = m.x + Math.sin(t * 0.4 + m.p) * 8;
      const y = (m.y + t * m.s) % VH;
      ctx.fillStyle = 'rgba(120, 230, 220,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.gold ? '#ffe36b' : p.mag ? '#ff3db8' : p.moss ? '#2ee6b0' : p.mist ? '#c8f6ff' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawFlash() {
    if (G.magFlash > 0) {
      ctx.fillStyle = 'rgba(255, 61, 184,' + (G.magFlash * 0.22) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.goldFlash > 0) {
      ctx.fillStyle = 'rgba(255, 227, 107,' + (G.goldFlash * 0.1) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawWind(t) {
    if (!G.wind) return;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = Math.max(1, 1.1 * scale);
    const dir = G.wind.dx >= 0 ? 1 : -1;
    for (let i = 0; i < 7; i++) {
      const y = ((t * 40 + i * 78) % (VH - 48)) + 24;
      const x0 = 40 + (i * 53 + t * 30 * dir) % (VW - 80);
      ctx.beginPath();
      ctx.moveTo(sx(x0), sy(y));
      ctx.quadraticCurveTo(sx(x0 + 16 * dir), sy(y - 6), sx(x0 + 28 * dir), sy(y));
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    const t = G.clock;
    const shx = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0;
    const shy = G.shake ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0;
    ctx.setTransform(1, 0, 0, 1, shx, shy);

    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const g1 = ctx.createRadialGradient(sx(70), sy(40), 10, sx(70), sy(40), 280 * scale);
    g1.addColorStop(0, 'rgba(255, 61, 184, 0.13)');
    g1.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(sx(400), sy(70), 10, sx(400), sy(70), 260 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
    g2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawRoom(t);
    drawSeed(t);
    drawHeats(t);
    drawWind(t);
    drawMoss(t);
    drawDoor(t);
    drawMotes(t);
    drawParticles();
    if (G.mode !== 'title' || pointer.hover) drawBrush(t);
    if (G.mode === 'title') drawBrush(t);
    drawFlash();
    ctx.restore();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * W;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * H;
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

  function seedFx() {
    motes.length = 0;
    for (let i = 0; i < 36; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(16, VH - 16),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.13),
        p: rand(0, TAU),
        s: rand(3, 14)
      });
    }
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (k === ' ' || k === 'Spacebar') keys.spray = down;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ' || k === 'Spacebar')) {
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
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    const p = pointerWorld(e);
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    pointer.x = p.x;
    pointer.y = p.y;
    canvas.classList.add('drag');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
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
    canvas.classList.remove('drag');
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
    keys.l = keys.r = keys.u = keys.d = keys.spray = false;
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

  for (let s = 0; s < STAGES.length; s++) {
    const st = STAGES[s];
    if (st.map.length !== ROWS) throw new Error('rows ' + s);
    let p = 0;
    let e = 0;
    for (let r = 0; r < ROWS; r++) {
      if (st.map[r].length !== COLS) throw new Error('cols ' + s + ':' + r);
      for (let c = 0; c < COLS; c++) {
        const ch = st.map[r].charAt(c);
        if (ch === 'P') p += 1;
        if (ch === 'E') e += 1;
      }
    }
    if (p !== 1 || e !== 1) throw new Error('pe ' + s);
  }

  seedFx();
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
