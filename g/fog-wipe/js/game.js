'use strict';

(function () {
  const VW = 480;
  const VH = 672;
  const COLS = 15;
  const ROWS = 21;
  const TILE = 32;
  const FOG_CELL = 8;
  const FOG_COLS = VW / FOG_CELL;
  const FOG_ROWS = VH / FOG_CELL;
  const PLAYER_R = 9.6;
  const SPEED = 176;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = 'playbox-fog-wipe-mute';
  const OPS = 'WASD / 方向键走 · 按住拖动 · M 静音';

  const STAGES = [
    {
      name: '初窗',
      sub: 'PANE',
      hint: '朝那点青光擦过去 · 看见门再走进去',
      cloth: 100,
      drain: 5.2,
      regen: 6,
      fogBack: 0.07,
      wipeR: 56,
      glow: 1,
      see: 0.54,
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
        '#.............#',
        '#.............#',
        '#......P......#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '侧廊',
      sub: 'SIDE',
      hint: '门偏在右上 · 布要省着擦',
      cloth: 100,
      drain: 6.1,
      regen: 3.2,
      fogBack: 0.11,
      wipeR: 52,
      glow: 0.82,
      see: 0.5,
      map: [
        '###############',
        '#.............#',
        '#...........E.#',
        '#.............#',
        '#.............#',
        '#......##.....#',
        '#......##.....#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.##..........#',
        '#.##..........#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#P............#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '回潮',
      sub: 'HAZE',
      hint: '雾回得快 · 别停太久',
      cloth: 94,
      drain: 6.6,
      regen: 0.8,
      fogBack: 0.32,
      wipeR: 50,
      glow: 0.72,
      see: 0.48,
      map: [
        '###############',
        '#.............#',
        '#......E......#',
        '#.............#',
        '#...##...##...#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#...##...##...#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#...##...##...#',
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
      name: '裂地',
      sub: 'CRACK',
      hint: '中间裂了 · 绕开品红的口',
      cloth: 92,
      drain: 6.8,
      regen: 0,
      fogBack: 0.16,
      wipeR: 48,
      glow: 0.64,
      see: 0.46,
      map: [
        '###############',
        '#.............#',
        '#......E......#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#......X......#',
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
      name: '假扉',
      sub: 'DECOY',
      hint: '品红是假门 · 青色才是出口',
      cloth: 90,
      drain: 7,
      regen: 0,
      fogBack: 0.18,
      wipeR: 48,
      glow: 0.5,
      see: 0.44,
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
        '#.............#',
        '#.............#',
        '#P...........F#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '折廊',
      sub: 'BEND',
      hint: '墙挡着，要绕到右边再上去',
      cloth: 88,
      drain: 7.2,
      regen: 0,
      fogBack: 0.15,
      wipeR: 46,
      glow: 0.46,
      see: 0.42,
      map: [
        '###############',
        '#...........E.#',
        '#...........#.#',
        '#...........#.#',
        '#...........#.#',
        '#...........#.#',
        '#...........#.#',
        '#...........#.#',
        '#############.#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#P............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '双坑',
      sub: 'PITS',
      hint: '两条裂口 · 先擦开再迈步',
      cloth: 86,
      drain: 7.4,
      regen: 0,
      fogBack: 0.2,
      wipeR: 44,
      glow: 0.4,
      see: 0.4,
      map: [
        '###############',
        '#...........E.#',
        '#...........#.#',
        '#.....X.....#.#',
        '#...........#.#',
        '#...........#.#',
        '#...........#.#',
        '#...........#.#',
        '#######.#####.#',
        '#.....#.#.....#',
        '#.....#X#.....#',
        '#.....#.#.....#',
        '#P....#.#.....#',
        '#.....#.#.....#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '游门',
      sub: 'SLIDE',
      hint: '门在游 · 擦住它再跟进去',
      cloth: 84,
      drain: 7.2,
      regen: 0,
      fogBack: 0.22,
      wipeR: 44,
      glow: 0.36,
      see: 0.4,
      slide: { amp: 156, speed: 0.88 },
      map: [
        '###############',
        '#.............#',
        '#......E......#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.##.......##.#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.............#',
        '#.##.......##.#',
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
      name: '逆风',
      sub: 'WIND',
      hint: '雾往下灌 · 要不停地擦开路',
      cloth: 82,
      drain: 7.6,
      regen: 0,
      fogBack: 0.16,
      wipeR: 40,
      glow: 0.26,
      see: 0.38,
      wind: { dx: 0, dy: 1, k: 1.55 },
      map: [
        '###############',
        '#...........E.#',
        '#.###.....###.#',
        '#.#.........#.#',
        '#.#.#######.#.#',
        '#.#.#.....#.#.#',
        '#.#.#.....#.#.#',
        '#.#.#..#..#.#.#',
        '#.............#',
        '#######.#######',
        '#.............#',
        '#.###.....###.#',
        '#.............#',
        '#.............#',
        '#......#......#',
        '#......#......#',
        '#.............#',
        '#.............#',
        '#P............#',
        '#.............#',
        '###############'
      ]
    },
    {
      name: '盲隙',
      sub: 'SLIT',
      hint: '刚够看见就进 · 假门和裂口都在',
      cloth: 86,
      drain: 7.4,
      regen: 0,
      fogBack: 0.24,
      wipeR: 36,
      glow: 0.16,
      see: 0.34,
      wind: { dx: 0, dy: 1, k: 0.85 },
      map: [
        '###############',
        '#F..........E.#',
        '#.###X...X###.#',
        '#.#.........#.#',
        '#.#.#######.#.#',
        '#.#.#.....#.#.#',
        '#.#.#..X..#.#.#',
        '#.#.#.....#.#.#',
        '#.....#.#.....#',
        '#######.#.#####',
        '#.....#.#.....#',
        '#.###.....###.#',
        '#.............#',
        '#......X......#',
        '#.............#',
        '#......#......#',
        '#.............#',
        '#.............#',
        '#P............#',
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
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');
  const stageLabel = document.getElementById('stage-label');
  const seeLabel = document.getElementById('see-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');

  const fogCanvas = document.createElement('canvas');
  fogCanvas.width = FOG_COLS;
  fogCanvas.height = FOG_ROWS;
  const fogCtx = fogCanvas.getContext('2d');
  const fogImg = fogCtx.createImageData(FOG_COLS, FOG_ROWS);
  const fog = new Float32Array(FOG_COLS * FOG_ROWS);
  const wet = new Float32Array(FOG_COLS * FOG_ROWS);
  const fogTmp = new Float32Array(FOG_COLS * FOG_ROWS);

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH * 0.7, id: null };
  const particles = [];
  const motes = [];
  const drips = [];
  const pips = [];
  const walls = [];
  const pits = [];
  const fakes = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    cloth: 100,
    clothMax: 100,
    px: VW * 0.5,
    py: VH * 0.75,
    vx: 0,
    vy: 0,
    face: -Math.PI / 2,
    clothX: VW * 0.5,
    clothY: VH * 0.75,
    start: { x: 0, y: 0 },
    exit: { x: 0, y: 0, ox: 0, oy: 0 },
    slide: null,
    wind: null,
    wipeR: 52,
    fogBack: 0.1,
    drain: 6,
    regen: 0,
    glow: 1,
    seeNeed: 0.5,
    seen: false,
    sawOnce: false,
    dry: false,
    dryT: 0,
    lock: 0,
    settle: 0,
    dieT: 0,
    toastT: 0,
    shake: 0,
    magFlash: 0,
    goldFlash: 0,
    warnLow: false,
    why: '',
    wipePulse: 0,
    seePulse: 0,
    moving: 0
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
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function fogI(c, r) {
    return r * FOG_COLS + c;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    lastWipe: -9,
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
      const n = 0.1;
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
    wipe() {
      if (G.clock - this.lastWipe < 0.09) return;
      this.lastWipe = G.clock;
      this.ensure();
      this.noise(0.07, 0.028, 1400);
    },
    see() {
      this.ensure();
      this.beep(784, 0.12, 'sine', 0.07, 1180);
      this.beep(1175, 0.18, 'triangle', 0.04, 1560);
    },
    enter() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.06, 523);
      this.beep(659, 0.12, 'sine', 0.05, 659);
      this.beep(784, 0.2, 'triangle', 0.05, 1046);
    },
    pit() {
      this.ensure();
      this.noise(0.18, 0.07, 280);
      this.beep(110, 0.32, 'sine', 0.08, 40);
    },
    fake() {
      this.ensure();
      this.beep(220, 0.16, 'sawtooth', 0.05, 90);
      this.beep(185, 0.28, 'triangle', 0.05, 70);
    },
    blocked() {
      this.ensure();
      this.beep(196, 0.08, 'sine', 0.035, 140);
    },
    dry() {
      this.ensure();
      this.beep(247, 0.18, 'triangle', 0.05, 90);
    },
    warn() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 330);
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

  function syncHud() {
    const st = STAGES[G.stage];
    const k = G.clothMax > 0 ? clamp(G.cloth / G.clothMax, 0, 1) : 0;
    fillBar.style.transform = 'scaleX(' + k + ')';
    fillNum.textContent = String(Math.round(G.cloth));
    const low = G.mode === 'play' && k < 0.22;
    fillWrap.classList.toggle('warn', low || G.dry);
    fillWrap.classList.toggle('hot', G.seen && G.mode === 'play');
    if (G.mode === 'title') {
      stageLabel.textContent = '十面';
      seeLabel.textContent = '刚够看见';
      seeLabel.className = '';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 面 · ' + (st ? st.name : '');
      if (G.dry) {
        seeLabel.textContent = '布湿了';
        seeLabel.className = 'warn';
      } else if (G.seen) {
        seeLabel.textContent = '看见了';
        seeLabel.className = 'hot';
      } else {
        seeLabel.textContent = '雾中';
        seeLabel.className = '';
      }
    }
    stageLabel.classList.toggle('hot', G.seen && G.mode === 'play');
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

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 160) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.4, spec.j * 0.4),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        mist: !!spec.mist,
        g: spec.g == null ? 40 : spec.g
      });
    }
  }

  function tileAt(x, y) {
    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return '#';
    const st = STAGES[G.stage];
    return st.map[r].charAt(c);
  }

  function solidAt(x, y) {
    return tileAt(x, y) === '#';
  }

  function blocked(x, y, rad) {
    const pts = [
      [x, y],
      [x - rad, y],
      [x + rad, y],
      [x, y - rad],
      [x, y + rad],
      [x - rad * 0.7, y - rad * 0.7],
      [x + rad * 0.7, y - rad * 0.7],
      [x - rad * 0.7, y + rad * 0.7],
      [x + rad * 0.7, y + rad * 0.7]
    ];
    for (let i = 0; i < pts.length; i++) {
      if (solidAt(pts[i][0], pts[i][1])) return true;
    }
    return false;
  }

  function wipeAt(x, y, radius, amount, ang) {
    const rCells = radius / FOG_CELL + 1;
    const cc = x / FOG_CELL;
    const rr = y / FOG_CELL;
    const ca = Math.cos(ang || 0);
    const sa = Math.sin(ang || 0);
    const stretch = G.moving > 0.12 ? 1.28 : 1;
    const thin = G.moving > 0.12 ? 0.78 : 1;
    const c0 = Math.max(0, Math.floor(cc - rCells));
    const c1 = Math.min(FOG_COLS - 1, Math.ceil(cc + rCells));
    const r0 = Math.max(0, Math.floor(rr - rCells));
    const r1 = Math.min(FOG_ROWS - 1, Math.ceil(rr + rCells));
    let cleared = 0;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const dx = (c + 0.5 - cc) * FOG_CELL;
        const dy = (r + 0.5 - rr) * FOG_CELL;
        const lx = (dx * ca + dy * sa) / stretch;
        const ly = (-dx * sa + dy * ca) / thin;
        const d = Math.sqrt(lx * lx + ly * ly);
        if (d >= radius) continue;
        const fall = Math.pow(1 - d / radius, 1.15);
        const i = fogI(c, r);
        const before = fog[i];
        fog[i] = Math.max(0, fog[i] - amount * fall);
        wet[i] = Math.min(1, wet[i] + amount * fall * 1.4);
        cleared += before - fog[i];
      }
    }
    return cleared;
  }

  function resetFog(fill) {
    const v = fill == null ? 1 : fill;
    for (let i = 0; i < fog.length; i++) {
      fog[i] = v;
      wet[i] = 0;
    }
  }

  function returnFog(dt) {
    const back = G.fogBack;
    const wind = G.wind;
    for (let i = 0; i < fog.length; i++) {
      const rec = back * (1 - wet[i] * 0.78) * dt;
      fog[i] = Math.min(1, fog[i] + rec);
      wet[i] = Math.max(0, wet[i] - dt * 0.55);
    }
    if (wind && wind.k) {
      const mix = clamp(wind.k * dt, 0, 0.45);
      const dx = wind.dx | 0;
      const dy = wind.dy | 0;
      for (let r = 0; r < FOG_ROWS; r++) {
        for (let c = 0; c < FOG_COLS; c++) {
          const sc = clamp(c - dx, 0, FOG_COLS - 1);
          const sr = clamp(r - dy, 0, FOG_ROWS - 1);
          const i = fogI(c, r);
          const j = fogI(sc, sr);
          fogTmp[i] = fog[i] * (1 - mix) + fog[j] * mix;
        }
      }
      fog.set(fogTmp);
    }
  }

  function sampleDoorFog(x, y, hw, hh) {
    const c0 = clamp(Math.floor((x - hw) / FOG_CELL), 0, FOG_COLS - 1);
    const c1 = clamp(Math.floor((x + hw) / FOG_CELL), 0, FOG_COLS - 1);
    const r0 = clamp(Math.floor((y - hh) / FOG_CELL), 0, FOG_ROWS - 1);
    const r1 = clamp(Math.floor((y + hh) / FOG_CELL), 0, FOG_ROWS - 1);
    let s = 0;
    let n = 0;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        s += fog[fogI(c, r)];
        n += 1;
      }
    }
    return n ? s / n : 1;
  }

  function overlapsDoor(px, py, door, hw, hh) {
    const dx = Math.abs(px - door.x);
    const dy = Math.abs(py - door.y);
    return dx < hw + PLAYER_R * 0.55 && dy < hh + PLAYER_R * 0.55;
  }

  function parseMap(st) {
    walls.length = 0;
    pits.length = 0;
    fakes.length = 0;
    G.start.x = TILE * 1.5;
    G.start.y = TILE * (ROWS - 2.5);
    G.exit.x = TILE * (COLS - 1.5);
    G.exit.y = TILE * 1.5;
    for (let r = 0; r < ROWS; r++) {
      const line = st.map[r];
      for (let c = 0; c < COLS; c++) {
        const ch = line.charAt(c);
        const x = (c + 0.5) * TILE;
        const y = (r + 0.5) * TILE;
        if (ch === '#') walls.push({ c: c, r: r, x: x, y: y });
        else if (ch === 'P') {
          G.start.x = x;
          G.start.y = y;
        } else if (ch === 'E') {
          G.exit.x = x;
          G.exit.y = y;
          G.exit.ox = x;
          G.exit.oy = y;
        } else if (ch === 'X') {
          pits.push({ x: x, y: y, c: c, r: r });
        } else if (ch === 'F') {
          fakes.push({ x: x, y: y, seen: false });
        }
      }
    }
  }

  function placePlayer(x, y) {
    G.px = x;
    G.py = y;
    G.vx = 0;
    G.vy = 0;
    G.clothX = x;
    G.clothY = y;
    G.face = -Math.PI / 2;
  }

  function applyStage(st, demo) {
    parseMap(st);
    G.clothMax = st.cloth;
    G.cloth = st.cloth;
    G.wipeR = st.wipeR;
    G.fogBack = st.fogBack;
    G.drain = st.drain;
    G.regen = st.regen;
    G.glow = st.glow;
    G.seeNeed = st.see;
    G.slide = st.slide || null;
    G.wind = st.wind || null;
    G.seen = false;
    G.sawOnce = false;
    G.dry = false;
    G.dryT = 0;
    G.warnLow = false;
    G.why = '';
    G.wipePulse = 0;
    G.seePulse = 0;
    placePlayer(G.start.x, G.start.y);
    G.exit.x = G.exit.ox;
    G.exit.y = G.exit.oy;
    resetFog(1);
    wipeAt(G.px, G.py, 38, 1.2, 0);
    if (demo) wipeAt(lerp(G.px, G.exit.x, 0.18), lerp(G.py, G.exit.y, 0.18), 34, 0.55, 0);
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.16;
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
      '擦雾',
      '雾蒙住整面玻璃。擦出刚够看见出口的一块，走进去。',
      '开擦',
      'WIPE',
      OPS
    );
    setHint('朝那点青光擦 · 看见门再进去', '');
    syncHud();
  }

  function failStage(why) {
    if (G.mode !== 'play') return;
    G.mode = 'fail';
    G.why = why;
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    let title = '雾里';
    let lead;
    let kicker = 'LOST';
    if (why === 'cloth') {
      title = '布湿了';
      kicker = 'WET';
      lead = more
        ? '布湿透了。要擦得省，刚够看见门就进去。<br />还剩 ' + G.lives + ' 次。'
        : '布湿透了。十面未完。';
      audio.dry();
    } else if (why === 'pit') {
      title = '踩空';
      kicker = 'CRACK';
      lead = more
        ? '看不清就踩进裂口了。先擦开再走。<br />还剩 ' + G.lives + ' 次。'
        : '踩进裂口。十面未完。';
    } else if (why === 'fake') {
      title = '假门';
      kicker = 'FALSE';
      lead = more
        ? '那是假门。青色的才是出口。<br />还剩 ' + G.lives + ' 次。'
        : '走进假门。十面未完。';
    } else {
      lead = more ? '还剩 ' + G.lives + ' 次。' : '十面未完。';
    }
    showOverlay('lose', title, lead, more ? '再擦这面' : '再来一局', kicker);
    setHint(why === 'pit' ? '先擦开裂口再走' : why === 'fake' ? '只进青色的门' : '擦得省一点', 'warn');
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.9;
    G.goldFlash = 0.75;
    G.seePulse = 1;
    audio.enter();
    toast('看见了', false, true);
    emit(18, {
      x: G.exit.x, y: G.exit.y, j: 16,
      vx0: -70, vx1: 70, vy0: -90, vy1: -10,
      life: 0.7, r0: 1.2, r1: 3.2, gold: true, g: 80
    });
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay('win', '雾散了', '十面玻璃都擦出了出口。', '再擦一巡', 'CLEAR');
      setHint('十面皆见', 'hot');
      return;
    }
    G.mode = 'clear';
    G.settle = 0.92;
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

  function updateExit(dt) {
    if (!G.slide) return;
    const t = G.clock * G.slide.speed;
    G.exit.x = G.exit.ox + Math.sin(t) * G.slide.amp;
    G.exit.y = G.exit.oy;
  }

  function movePlayer(dt, canMove) {
    let ax = 0;
    let ay = 0;
    if (canMove) {
      if (pointer.down) {
        const dx = pointer.x - G.px;
        const dy = pointer.y - G.py;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 8) {
          ax = dx / d;
          ay = dy / d;
        }
      } else {
        if (keys.l) ax -= 1;
        if (keys.r) ax += 1;
        if (keys.u) ay -= 1;
        if (keys.d) ay += 1;
        const m = Math.sqrt(ax * ax + ay * ay);
        if (m > 1) {
          ax /= m;
          ay /= m;
        }
      }
    }
    const spd = SPEED * (G.dry ? 0.78 : 1);
    const tx = ax * spd;
    const ty = ay * spd;
    G.vx = lerp(G.vx, tx, 1 - Math.exp(-14 * dt));
    G.vy = lerp(G.vy, ty, 1 - Math.exp(-14 * dt));
    const nx = G.px + G.vx * dt;
    const ny = G.py + G.vy * dt;
    if (!blocked(nx, G.py, PLAYER_R)) G.px = nx;
    else G.vx *= 0.2;
    if (!blocked(G.px, ny, PLAYER_R)) G.py = ny;
    else G.vy *= 0.2;
    G.px = clamp(G.px, TILE + PLAYER_R, VW - TILE - PLAYER_R);
    G.py = clamp(G.py, TILE + PLAYER_R, VH - TILE - PLAYER_R);
    const mag = Math.sqrt(G.vx * G.vx + G.vy * G.vy);
    G.moving = mag / SPEED;
    if (mag > 18) G.face = Math.atan2(G.vy, G.vx);
    G.clothX = lerp(G.clothX, G.px - Math.cos(G.face) * 11, 1 - Math.exp(-10 * dt));
    G.clothY = lerp(G.clothY, G.py - Math.sin(G.face) * 11, 1 - Math.exp(-10 * dt));
  }

  function tryDoors() {
    const hw = 13;
    const hh = 17;
    if (overlapsDoor(G.px, G.py, G.exit, hw, hh)) {
      const fogAvg = sampleDoorFog(G.exit.x, G.exit.y, hw, hh);
      if (fogAvg <= G.seeNeed) {
        clearStage();
        return true;
      }
      if (G.mode === 'play' && G.lock <= 0) {
        const dx = G.px - G.exit.x;
        const dy = G.py - G.exit.y;
        const d = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
        G.px += (dx / d) * 10;
        G.py += (dy / d) * 10;
        G.vx *= -0.4;
        G.vy *= -0.4;
        audio.blocked();
        toast('雾还挡着', true);
        G.lock = 0.42;
      }
      return false;
    }
    for (let i = 0; i < fakes.length; i++) {
      const f = fakes[i];
      if (!overlapsDoor(G.px, G.py, f, hw, hh)) continue;
      const fogAvg = sampleDoorFog(f.x, f.y, hw, hh);
      if (fogAvg <= G.seeNeed + 0.06) {
        G.magFlash = 0.7;
        G.shake = 12;
        audio.fake();
        emit(16, {
          x: f.x, y: f.y, j: 12,
          vx0: -80, vx1: 80, vy0: -70, vy1: 20,
          life: 0.55, r0: 1.2, r1: 3, mag: true, g: 120
        });
        failStage('fake');
        return true;
      }
      const dx = G.px - f.x;
      const dy = G.py - f.y;
      const d = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
      G.px += (dx / d) * 10;
      G.py += (dy / d) * 10;
      audio.blocked();
      toast('雾还挡着', true);
      G.lock = 0.42;
      return false;
    }
    return false;
  }

  function checkPits() {
    for (let i = 0; i < pits.length; i++) {
      const p = pits[i];
      const dx = G.px - p.x;
      const dy = G.py - p.y;
      if (dx * dx + dy * dy < 13 * 13) {
        G.magFlash = 0.75;
        G.shake = 14;
        audio.pit();
        emit(20, {
          x: p.x, y: p.y, j: 10,
          vx0: -60, vx1: 60, vy0: -40, vy1: 40,
          life: 0.5, r0: 1, r1: 2.8, mag: true, g: 160
        });
        failStage('pit');
        return true;
      }
    }
    return false;
  }

  function updateSee() {
    const avg = sampleDoorFog(G.exit.x, G.exit.y, 13, 17);
    const now = avg <= G.seeNeed;
    if (now && !G.seen && G.mode === 'play') {
      G.sawOnce = true;
      G.seePulse = 1;
      audio.see();
      toast('看见了', false, true);
      setHint('门开了 · 走进去', 'hot');
    }
    G.seen = now;
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.8);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.5);
    G.lock = Math.max(0, G.lock - dt);
    G.wipePulse = Math.max(0, G.wipePulse - dt * 2.2);
    G.seePulse = Math.max(0, G.seePulse - dt * 1.4);
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
    for (let i = 0; i < drips.length; i++) {
      const d = drips[i];
      d.y += d.vy * dt;
      if (d.y > VH - 18) {
        d.y = rand(18, 80);
        d.x = rand(18, VW - 18);
      }
    }
  }

  function updateTitle(dt) {
    const tx = G.exit.x - G.px;
    const ty = G.exit.y - G.py;
    const d = Math.sqrt(tx * tx + ty * ty);
    if (d < 64) {
      placePlayer(G.start.x, G.start.y);
      resetFog(1);
      wipeAt(G.px, G.py, 38, 1.1, 0);
    } else {
      const ang = Math.atan2(ty, tx);
      G.vx = Math.cos(ang) * 78;
      G.vy = Math.sin(ang) * 78;
      const nx = G.px + G.vx * dt;
      const ny = G.py + G.vy * dt;
      if (!blocked(nx, G.py, PLAYER_R)) G.px = nx;
      if (!blocked(G.px, ny, PLAYER_R)) G.py = ny;
      G.moving = 0.45;
      G.face = ang;
      G.clothX = lerp(G.clothX, G.px - Math.cos(ang) * 11, 1 - Math.exp(-10 * dt));
      G.clothY = lerp(G.clothY, G.py - Math.sin(ang) * 11, 1 - Math.exp(-10 * dt));
      wipeAt(G.px, G.py, 50, 2.6 * dt, ang);
    }
    returnFog(dt);
    updateExit(dt);
    updateSee();
  }

  function updatePlay(dt) {
    const can = G.lock <= 0;
    movePlayer(dt, can);
    updateExit(dt);
    const wiping = G.cloth > 0 && !G.dry;
    if (wiping) {
      const amt = (G.moving > 0.08 ? 3.15 : 2.35) * dt;
      const cleared = wipeAt(G.px, G.py, G.wipeR, amt, G.face);
      if (G.moving > 0.08) {
        G.cloth = Math.max(0, G.cloth - G.drain * G.moving * dt);
        G.wipePulse = 0.6;
        if (cleared > 0.08) {
          audio.wipe();
          if (Math.random() < dt * 18) {
            emit(1, {
              x: G.px + rand(-8, 8), y: G.py + rand(-8, 8), j: 6,
              vx0: -20, vx1: 20, vy0: -30, vy1: -6,
              life: 0.45, r0: 1.2, r1: 2.6, mist: true, g: -20
            });
          }
        }
      } else {
        G.wipePulse = Math.max(G.wipePulse, 0.25);
      }
    } else if (G.regen > 0 && G.moving < 0.05 && !G.dry) {
      G.cloth = Math.min(G.clothMax, G.cloth + G.regen * dt);
    }
    returnFog(dt);
    updateSee();
    if (G.mode !== 'play') return;
    if (checkPits()) return;
    if (tryDoors()) return;
    if (G.cloth <= 0) {
      G.cloth = 0;
      if (!G.dry) {
        G.dry = true;
        G.dryT = 0;
        audio.warn();
        toast('布湿透了', true);
        setHint('布湿了 · 趁门还在赶紧进', 'warn');
      }
      G.dryT += dt;
      if (!G.seen && G.dryT > 0.35) failStage('cloth');
      else if (G.dryT > 1.15) failStage('cloth');
    } else if (G.cloth < G.clothMax * 0.22 && !G.warnLow) {
      G.warnLow = true;
      toast('布快湿了', true);
      audio.warn();
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') updateTitle(dt);
    else if (G.mode === 'play') updatePlay(dt);
    else if (G.mode === 'clear') {
      G.settle -= dt;
      movePlayer(dt, false);
      returnFog(dt * 0.3);
      wipeAt(G.exit.x, G.exit.y, 70, 2.2 * dt, 0);
      if (G.settle <= 0) startStage(G.stage + 1);
    } else {
      movePlayer(dt, false);
      returnFog(dt * 0.5);
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

  function paintFog() {
    const data = fogImg.data;
    const t = G.clock;
    for (let r = 0; r < FOG_ROWS; r++) {
      for (let c = 0; c < FOG_COLS; c++) {
        const i = fogI(c, r);
        const f = fog[i];
        const w = wet[i];
        const swirl = 0.9 + 0.1 * Math.sin(t * 1.3 + c * 0.37 + r * 0.29);
        const a = clamp(f * swirl * (1 - w * 0.12), 0, 1);
        const p = i * 4;
        data[p] = 186 + w * 20;
        data[p + 1] = 176 + w * 12;
        data[p + 2] = 214;
        data[p + 3] = a * 238;
      }
    }
    fogCtx.putImageData(fogImg, 0, 0);
  }

  function drawDoor(door, fake, t) {
    const x = sx(door.x);
    const y = sy(door.y);
    const w = 22 * scale;
    const h = 32 * scale;
    const seen = fake
      ? sampleDoorFog(door.x, door.y, 13, 17) <= G.seeNeed + 0.06
      : G.seen;
    const col = fake ? '#ff3db8' : '#00f0ff';
    const glow = fake ? G.glow * 0.7 : G.glow;
    const pulse = 0.55 + 0.45 * Math.sin(t * 2.4 + door.x * 0.02);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 4 * scale, x, y, 70 * scale * (0.7 + glow * 0.5));
    if (fake) {
      g.addColorStop(0, 'rgba(255, 61, 184,' + (0.16 * glow * pulse) + ')');
      g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    } else {
      g.addColorStop(0, 'rgba(0, 240, 255,' + (0.22 * glow * pulse) + ')');
      g.addColorStop(1, 'rgba(0, 240, 255, 0)');
    }
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 72 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();

    roundRect(ctx, x - w, y - h, w * 2, h * 2, 6 * scale);
    ctx.fillStyle = fake ? '#1a0714' : '#07141c';
    ctx.fill();
    ctx.strokeStyle = col;
    ctx.globalAlpha = seen ? 0.95 : 0.55;
    ctx.lineWidth = (seen ? 2.2 : 1.4) * scale;
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.save();
    roundRect(ctx, x - w * 0.72, y - h * 0.62, w * 1.44, h * 1.42, 4 * scale);
    ctx.clip();
    if (!fake) {
      const hall = ctx.createLinearGradient(x, y - h, x, y + h);
      hall.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
      hall.addColorStop(0.45, 'rgba(10, 40, 60, 0.5)');
      hall.addColorStop(1, 'rgba(5, 8, 20, 0.2)');
      ctx.fillStyle = hall;
      ctx.fillRect(x - w, y - h, w * 2, h * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.5);
      ctx.lineTo(x, y + h * 0.6);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(40, 8, 24, 0.85)';
      ctx.fillRect(x - w, y - h, w * 2, h * 2);
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(x - 6 * scale, y - 8 * scale);
      ctx.lineTo(x + 6 * scale, y + 10 * scale);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = fake ? '#ff3db8' : '#ffe36b';
    ctx.beginPath();
    ctx.arc(x + (fake ? -7 : 7) * scale, y + 4 * scale, 1.6 * scale, 0, TAU);
    ctx.fill();

    if (seen && !fake) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255, 227, 107,' + (0.45 + G.seePulse * 0.5) + ')';
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(x, y, (18 + (1 - G.seePulse) * 16) * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPit(p, t) {
    const x = sx(p.x);
    const y = sy(p.y);
    const pulse = 0.7 + 0.3 * Math.sin(t * 3 + p.x);
    ctx.beginPath();
    ctx.ellipse(x, y, 12 * scale, 9 * scale, 0, 0, TAU);
    ctx.fillStyle = '#050208';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184,' + (0.45 + pulse * 0.4) + ')';
    ctx.lineWidth = 1.7 * scale;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.35)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 6 * scale, y - 2 * scale);
    ctx.lineTo(x + 2 * scale, y + 5 * scale);
    ctx.lineTo(x + 7 * scale, y - 3 * scale);
    ctx.stroke();
  }

  function drawRoom(t) {
    ctx.fillStyle = '#070414';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    vg.addColorStop(0, 'rgba(12, 28, 48, 0.35)');
    vg.addColorStop(0.55, 'rgba(8, 6, 20, 0.1)');
    vg.addColorStop(1, 'rgba(18, 8, 36, 0.28)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        const ch = STAGES[G.stage].map[r].charAt(c);
        if (ch === '#') continue;
        const h = hash(c, r);
        const x = sx(c * TILE);
        const y = sy(r * TILE);
        ctx.fillStyle = 'rgba(0, 240, 255,' + (0.018 + h * 0.03) + ')';
        ctx.fillRect(x + 1 * scale, y + 1 * scale, (TILE - 2) * scale, (TILE - 2) * scale);
        if (h > 0.72) {
          ctx.strokeStyle = 'rgba(255, 61, 184, 0.06)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + 6 * scale, y + 20 * scale);
          ctx.lineTo(x + 22 * scale, y + 10 * scale);
          ctx.stroke();
        }
      }
    }

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.045)';
    ctx.lineWidth = 1;
    for (let x = TILE; x < VW; x += TILE) {
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(TILE));
      ctx.lineTo(sx(x), sy(VH - TILE));
      ctx.stroke();
    }
    for (let y = TILE; y < VH; y += TILE) {
      ctx.beginPath();
      ctx.moveTo(sx(TILE), sy(y));
      ctx.lineTo(sx(VW - TILE), sy(y));
      ctx.stroke();
    }

    for (let i = 0; i < pits.length; i++) drawPit(pits[i], t);
    for (let i = 0; i < fakes.length; i++) drawDoor(fakes[i], true, t);
    drawDoor(G.exit, false, t);

    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (w.c === 0 || w.r === 0 || w.c === COLS - 1 || w.r === ROWS - 1) continue;
      const x = sx(w.c * TILE + 2);
      const y = sy(w.r * TILE + 2);
      const s = (TILE - 4) * scale;
      roundRect(ctx, x, y, s, s, 5 * scale);
      ctx.fillStyle = '#12081c';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.16)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(x + 4 * scale, y + s - 5 * scale);
      ctx.lineTo(x + s - 4 * scale, y + s - 5 * scale);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 6 * scale;
    roundRect(ctx, sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale, 10 * scale);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.18)';
    ctx.lineWidth = 2 * scale;
    roundRect(ctx, sx(10), sy(10), (VW - 20) * scale, (VH - 20) * scale, 8 * scale);
    ctx.stroke();
  }

  function drawFogLayer() {
    paintFog();
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    ctx.drawImage(fogCanvas, sx(0), sy(0), VW * scale, VH * scale);
    ctx.restore();

    for (let i = 0; i < drips.length; i++) {
      const d = drips[i];
      const c = clamp(Math.floor(d.x / FOG_CELL), 0, FOG_COLS - 1);
      const r = clamp(Math.floor(d.y / FOG_CELL), 0, FOG_ROWS - 1);
      const f = fog[fogI(c, r)];
      if (f < 0.35) continue;
      ctx.strokeStyle = 'rgba(220, 210, 240,' + (0.12 * f) + ')';
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(d.x), sy(d.y));
      ctx.lineTo(sx(d.x + 0.4), sy(d.y + d.len));
      ctx.stroke();
    }
  }

  function drawPlayer() {
    const x = sx(G.px);
    const y = sy(G.py);
    const ang = G.face;
    const cx = sx(G.clothX);
    const cy = sy(G.clothY);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 9 * scale, 10 * scale, 4 * scale, 0, 0, TAU);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang + 0.6);
    ctx.fillStyle = 'rgba(255, 61, 184, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 * scale, 10 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.85)';
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, 10 * scale, 6 * scale, 0.2, 0, TAU);
    ctx.stroke();
    ctx.restore();

    if (G.mode === 'play' || G.mode === 'title' || G.wipePulse > 0 || G.moving > 0.1) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(0, 240, 255,' + (0.1 + G.wipePulse * 0.28) + ')';
      ctx.lineWidth = 1.3 * scale;
      ctx.setLineDash([5 * scale, 6 * scale]);
      ctx.beginPath();
      ctx.arc(x, y, G.wipeR * scale * 0.92, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(x, y + 2 * scale, 7.2 * scale, 0, TAU);
    ctx.fillStyle = '#1a1230';
    ctx.fill();
    ctx.strokeStyle = G.seen ? '#ffe36b' : '#00f0ff';
    ctx.lineWidth = 1.7 * scale;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y - 6.5 * scale, 4.4 * scale, 0, TAU);
    ctx.fillStyle = '#2a1a44';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.arc(x + Math.cos(ang) * 2.2 * scale, y - 6.5 * scale + Math.sin(ang) * 1.4 * scale, 1.1 * scale, 0, TAU);
    ctx.fill();
  }

  function drawMotes(t) {
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = m.x + Math.sin(t * 0.35 + m.p) * 10;
      const y = (m.y + t * m.s) % VH;
      const c = clamp(Math.floor(x / FOG_CELL), 0, FOG_COLS - 1);
      const r = clamp(Math.floor(y / FOG_CELL), 0, FOG_ROWS - 1);
      const f = fog[fogI(c, r)];
      ctx.fillStyle = 'rgba(200, 220, 255,' + (m.a * (0.35 + f * 0.65)) + ')';
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
      ctx.fillStyle = p.gold ? '#ffe36b' : p.mag ? '#ff3db8' : p.mist ? '#d8d0ee' : '#00f0ff';
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

  function drawBleed(t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = 0.03 + G.glow * 0.16;
    if (g > 0.01) {
      const x = sx(G.exit.x);
      const y = sy(G.exit.y);
      const grd = ctx.createRadialGradient(x, y, 6 * scale, x, y, 90 * scale);
      grd.addColorStop(0, 'rgba(0, 240, 255,' + (g * (0.8 + 0.2 * Math.sin(t * 2))) + ')');
      grd.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, 90 * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < fakes.length; i++) {
      const f = fakes[i];
      const x = sx(f.x);
      const y = sy(f.y);
      const grd = ctx.createRadialGradient(x, y, 4 * scale, x, y, 70 * scale);
      grd.addColorStop(0, 'rgba(255, 61, 184,' + (G.glow * 0.06) + ')');
      grd.addColorStop(1, 'rgba(255, 61, 184, 0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, 70 * scale, 0, TAU);
      ctx.fill();
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
    const g1 = ctx.createRadialGradient(sx(80), sy(40), 10, sx(80), sy(40), 280 * scale);
    g1.addColorStop(0, 'rgba(255, 61, 184, 0.14)');
    g1.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(sx(400), sy(80), 10, sx(400), sy(80), 260 * scale);
    g2.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
    g2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawRoom(t);
    drawFogLayer();
    drawBleed(t);
    drawMotes(t);
    drawParticles();
    drawPlayer();
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
    for (let i = 0; i < 40; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(16, VH - 16),
        r: rand(0.6, 1.9),
        a: rand(0.04, 0.14),
        p: rand(0, TAU),
        s: rand(4, 16)
      });
    }
    drips.length = 0;
    for (let i = 0; i < 18; i++) {
      drips.push({
        x: rand(20, VW - 20),
        y: rand(20, VH - 40),
        vy: rand(12, 28),
        len: rand(8, 18)
      });
    }
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
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
    keys.l = keys.r = keys.u = keys.d = false;
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
    for (let r = 0; r < ROWS; r++) {
      if (st.map[r].length !== COLS) throw new Error('cols ' + s + ':' + r);
    }
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
