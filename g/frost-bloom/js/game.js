'use strict';

(function () {
  const COLS = 17;
  const ROWS = 19;
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SPEED = 256;
  const MUTE_KEY = 'playbox-frost-bloom-mute';
  const OPS = 'WASD / 方向键移冷息 · 点按或拖动画布 · M 静音';
  const DC = [1, -1, 0, 0];
  const DR = [0, 0, 1, -1];

  const MAG = { r: 255, g: 61, b: 184 };
  const CYN = { r: 0, g: 240, b: 255 };
  const GOLD = { r: 255, g: 227, b: 107 };
  const ICE = { r: 186, g: 236, b: 255 };
  const DEEP = { r: 10, g: 24, b: 48 };

  function blank() {
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      let s = '';
      for (let c = 0; c < COLS; c++) {
        s += (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) ? '#' : '.';
      }
      rows.push(s);
    }
    return rows;
  }

  function put(g, c, r, ch) {
    if (c <= 0 || r <= 0 || c >= COLS - 1 || r >= ROWS - 1) return;
    g[r] = g[r].slice(0, c) + ch + g[r].slice(c + 1);
  }

  function putEmpty(g, c, r, ch) {
    if (c <= 0 || r <= 0 || c >= COLS - 1 || r >= ROWS - 1) return;
    if (g[r].charAt(c) !== '.') return;
    put(g, c, r, ch);
  }

  function putIsolated(g, c, r, ch) {
    if (c <= 0 || r <= 0 || c >= COLS - 1 || r >= ROWS - 1) return;
    if (g[r].charAt(c) !== '.') return;
    for (let d = 0; d < 4; d++) {
      const k = g[r + DR[d]].charAt(c + DC[d]);
      if (k === '*' || k === 'S') return;
    }
    put(g, c, r, ch);
  }

  function manh(g, cx, cy, rad, ch) {
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (Math.abs(c - cx) + Math.abs(r - cy) <= rad) put(g, c, r, ch);
      }
    }
  }

  function disk(g, cx, cy, rad, ch) {
    const r2 = rad * rad;
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        const dx = c - cx;
        const dy = r - cy;
        if (dx * dx + dy * dy <= r2) put(g, c, r, ch);
      }
    }
  }

  function line4(g, c0, r0, c1, r1, ch) {
    let c = c0;
    let r = r0;
    put(g, c, r, ch);
    let guard = 80;
    while ((c !== c1 || r !== r1) && guard-- > 0) {
      const dc = c1 - c;
      const dr = r1 - r;
      if (Math.abs(dc) >= Math.abs(dr)) c += dc > 0 ? 1 : -1;
      else r += dr > 0 ? 1 : -1;
      put(g, c, r, ch);
    }
  }

  function plus(g, cx, cy, arm, tip) {
    for (let i = -arm; i <= arm; i++) {
      put(g, cx, cy + i, '*');
      put(g, cx + i, cy, '*');
    }
    if (tip) {
      for (let k = -1; k <= 1; k++) {
        put(g, cx + k, cy - arm, '*');
        put(g, cx + k, cy + arm, '*');
        put(g, cx - arm, cy + k, '*');
        put(g, cx + arm, cy + k, '*');
      }
      put(g, cx, cy - arm + 1, '*');
      put(g, cx, cy + arm - 1, '*');
      put(g, cx - arm + 1, cy, '*');
      put(g, cx + arm - 1, cy, '*');
    }
  }

  function flake(g, cx, cy, arm, diags) {
    plus(g, cx, cy, arm, false);
    manh(g, cx, cy, 1, '*');
    if (!diags) return;
    const d = Math.max(3, arm - 1);
    line4(g, cx, cy, cx - d, cy - d, '*');
    line4(g, cx, cy, cx + d, cy - d, '*');
    line4(g, cx, cy, cx - d, cy + d, '*');
    line4(g, cx, cy, cx + d, cy + d, '*');
  }

  function finish(g, sc, sr) {
    put(g, sc, sr, 'S');
    return g;
  }

  const STAGES = [
    {
      name: '初蕊',
      sub: 'FIRST',
      hint: '把冷息贴着淡青的十字走，霜会跟着长',
      toast: '冷息在亮 · 霜追着它',
      time: 46,
      grow: 9.4,
      cold: 2.55,
      spill: 14,
      heat: 0,
      map: finish((function () {
        const g = blank();
        plus(g, 8, 9, 5, true);
        return g;
      })(), 8, 9)
    },
    {
      name: '菱晶',
      sub: 'DIAMOND',
      hint: '花纹更满。沿菱边走，别抄空玻璃的近路',
      toast: '贴边长满菱晶',
      time: 44,
      grow: 9.2,
      cold: 2.4,
      spill: 11,
      heat: 0,
      map: finish((function () {
        const g = blank();
        manh(g, 8, 9, 5, '*');
        return g;
      })(), 8, 9)
    },
    {
      name: '花茎',
      sub: 'STEM',
      hint: '从窗台的籽往上长茎，再到顶端绽开',
      toast: '先长茎，再开花',
      time: 44,
      grow: 9.0,
      cold: 2.3,
      spill: 10,
      heat: 0,
      map: finish((function () {
        const g = blank();
        manh(g, 8, 5, 3, '*');
        disk(g, 8, 5, 2.35, '*');
        for (let r = 8; r <= 16; r++) put(g, 8, r, '*');
        put(g, 7, 16, '*');
        put(g, 9, 16, '*');
        return g;
      })(), 8, 16)
    },
    {
      name: '暖边',
      sub: 'WARM',
      hint: '品红是暖气，霜贴上去会化。沿十字走',
      toast: '躲开两侧暖气',
      time: 42,
      grow: 9.0,
      cold: 2.25,
      spill: 9,
      heat: 0.72,
      map: finish((function () {
        const g = blank();
        plus(g, 8, 9, 5, true);
        putIsolated(g, 2, 4, 'H');
        putIsolated(g, 14, 4, 'H');
        putIsolated(g, 2, 14, 'H');
        putIsolated(g, 14, 14, 'H');
        putIsolated(g, 4, 6, 'H');
        putIsolated(g, 12, 6, 'H');
        putIsolated(g, 4, 12, 'H');
        putIsolated(g, 12, 12, 'H');
        return g;
      })(), 8, 9)
    },
    {
      name: '六出',
      sub: 'HEX',
      hint: '六条臂都要长到。走完一条沿原路回到芯再出下一条',
      toast: '沿原路回芯，再出下一臂',
      time: 50,
      grow: 8.6,
      cold: 2.15,
      spill: 8,
      heat: 0,
      map: finish((function () {
        const g = blank();
        flake(g, 8, 9, 6, true);
        return g;
      })(), 8, 9)
    },
    {
      name: '细脉',
      sub: 'VEIN',
      hint: '脉只有一格宽。冷息别晃，溢一点就满',
      toast: '细脉，手要稳',
      time: 48,
      grow: 8.4,
      cold: 1.98,
      spill: 5,
      heat: 0,
      map: finish((function () {
        const g = blank();
        plus(g, 8, 9, 6, false);
        line4(g, 8, 9, 3, 3, '*');
        line4(g, 8, 9, 13, 3, '*');
        line4(g, 8, 9, 3, 15, '*');
        line4(g, 8, 9, 13, 15, '*');
        return g;
      })(), 8, 9)
    },
    {
      name: '心孔',
      sub: 'HOLE',
      hint: '中间要空着。绕着圈长，别抄进空洞',
      toast: '心要留空',
      time: 50,
      grow: 8.5,
      cold: 2.08,
      spill: 6,
      heat: 0,
      map: finish((function () {
        const g = blank();
        manh(g, 8, 9, 6, '*');
        manh(g, 8, 9, 3, '.');
        return g;
      })(), 8, 3)
    },
    {
      name: '窗格',
      sub: 'PANE',
      hint: '青晶格挡路。花纹从缝里过，别硬撞',
      toast: '从格子缝里走',
      time: 48,
      grow: 8.3,
      cold: 2.02,
      spill: 7,
      heat: 0,
      map: finish((function () {
        const g = blank();
        flake(g, 8, 9, 6, true);
        putEmpty(g, 4, 7, 'X');
        putEmpty(g, 5, 7, 'X');
        putEmpty(g, 11, 7, 'X');
        putEmpty(g, 12, 7, 'X');
        putEmpty(g, 4, 11, 'X');
        putEmpty(g, 5, 11, 'X');
        putEmpty(g, 11, 11, 'X');
        putEmpty(g, 12, 11, 'X');
        putEmpty(g, 7, 5, 'X');
        putEmpty(g, 9, 5, 'X');
        putEmpty(g, 7, 13, 'X');
        putEmpty(g, 9, 13, 'X');
        return g;
      })(), 8, 9)
    },
    {
      name: '夹暖',
      sub: 'NEST',
      hint: '暖气夹在臂与臂之间。贴脉走，别抄近路',
      toast: '臂间全是暖气',
      time: 46,
      grow: 8.2,
      cold: 1.95,
      spill: 6,
      heat: 0.9,
      map: finish((function () {
        const g = blank();
        flake(g, 8, 9, 6, true);
        [
          [3, 5], [5, 3], [11, 3], [13, 5],
          [3, 13], [5, 15], [11, 15], [13, 13],
          [3, 7], [13, 7], [3, 11], [13, 11],
          [6, 3], [10, 3], [6, 15], [10, 15]
        ].forEach(function (p) {
          putIsolated(g, p[0], p[1], 'H');
        });
        return g;
      })(), 8, 9)
    },
    {
      name: '夜绽',
      sub: 'NIGHT',
      hint: '四瓣都要满。暖气在对角，溢额很紧',
      toast: '末窗，四瓣夜花',
      time: 52,
      grow: 8.0,
      cold: 1.88,
      spill: 5,
      heat: 0.85,
      map: finish((function () {
        const g = blank();
        manh(g, 8, 9, 1, '*');
        disk(g, 8, 4, 2.35, '*');
        disk(g, 8, 14, 2.35, '*');
        disk(g, 3, 9, 2.35, '*');
        disk(g, 13, 9, 2.35, '*');
        line4(g, 8, 9, 8, 4, '*');
        line4(g, 8, 9, 8, 14, '*');
        line4(g, 8, 9, 3, 9, '*');
        line4(g, 8, 9, 13, 9, '*');
        putIsolated(g, 3, 3, 'H');
        putIsolated(g, 4, 4, 'H');
        putIsolated(g, 13, 3, 'H');
        putIsolated(g, 12, 4, 'H');
        putIsolated(g, 3, 15, 'H');
        putIsolated(g, 4, 14, 'H');
        putIsolated(g, 13, 15, 'H');
        putIsolated(g, 12, 14, 'H');
        return g;
      })(), 8, 9)
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
  const stageLabel = document.getElementById('stage-label');
  const spillLabel = document.getElementById('spill-label');
  const timeLabel = document.getElementById('time-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillNum = document.getElementById('fill-num');

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
    on: false
  };

  const keys = { l: false, r: false, u: false, d: false };

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    time: 46,
    timeMax: 46,
    cells: [],
    cols: COLS,
    rows: ROWS,
    cs: 28,
    originX: 40,
    originY: 110,
    gridW: 28 * COLS,
    gridH: 28 * ROWS,
    seed: null,
    heats: [],
    cx: VW * 0.5,
    cy: VH * 0.5,
    vx: 0,
    vy: 0,
    coldR: 56,
    grow: 9,
    growAcc: 0,
    heatRate: 0,
    spill: 0,
    spillMax: 14,
    filled: 0,
    needN: 1,
    lock: 0,
    settle: 0,
    shake: 0,
    flash: 0,
    magFlash: 0,
    goldFlash: 0,
    toastT: 0,
    why: '',
    demoT: 0,
    growSfx: 0,
    taughtSpill: false,
    taughtHeat: false,
    taughtFar: false,
    warnTime: false,
    warnSpill: false,
    stall: 0,
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
      f.frequency.value = hp || 1400;
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
    grow: function (spill) {
      this.ensure();
      this.beep(spill ? 420 : 1320, 0.045, 'sine', spill ? 0.03 : 0.028, spill ? 180 : 1760);
      if (spill) this.noise(0.04, 0.03, 900);
    },
    melt: function () {
      this.ensure();
      this.noise(0.12, 0.05, 420);
      this.beep(240, 0.14, 'sine', 0.04, 70);
    },
    deny: function () {
      this.ensure();
      this.beep(160, 0.07, 'square', 0.03, 80);
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
    fail: function () {
      this.ensure();
      this.noise(0.28, 0.1, 220);
      this.beep(196, 0.32, 'sine', 0.06, 60);
    },
    warn: function () {
      this.ensure();
      this.beep(740, 0.08, 'square', 0.035, 220);
    }
  };

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 200) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.5, spec.j * 0.5),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        mag: !!spec.mag,
        gold: !!spec.gold,
        g: spec.g == null ? 40 : spec.g
      });
    }
  }

  function addRing(x, y, mag) {
    rings.push({ x: x, y: y, t: 0, mag: !!mag });
    if (rings.length > 16) rings.shift();
  }

  function toast(msg, warn, gold) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = 1.65;
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

  function cover() {
    return G.needN <= 0 ? 0 : G.filled / G.needN;
  }

  function syncHud() {
    const st = STAGES[G.stage];
    const playing = G.mode === 'play';
    const k = cover();
    if (G.mode === 'title') {
      stageLabel.textContent = '十窗';
      spillLabel.textContent = '溢 —';
      timeLabel.textContent = '时 —';
      fillNum.textContent = '0%';
      fillBar.style.transform = 'scaleX(0)';
    } else {
      stageLabel.textContent = '第 ' + (G.stage + 1) + ' 窗 · ' + (st ? st.name : '');
      spillLabel.textContent = '溢 ' + G.spill + '/' + G.spillMax;
      timeLabel.textContent = '时 ' + Math.max(0, G.time).toFixed(1);
      fillNum.textContent = Math.round(k * 100) + '%';
      fillBar.style.transform = 'scaleX(' + clamp(k, 0, 1).toFixed(3) + ')';
    }
    const lowT = playing && G.time < 6;
    const lowS = playing && G.spill / Math.max(1, G.spillMax) > 0.68;
    timeLabel.classList.toggle('warn', lowT);
    spillLabel.classList.toggle('warn', lowS);
    stageLabel.classList.toggle('hot', G.mode === 'clear' || G.mode === 'win' || G.mode === 'bloom');
    fillWrap.classList.toggle('warn', lowS);
    fillWrap.classList.toggle('hot', k > 0.92 || G.mode === 'clear' || G.mode === 'win');
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

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 46; i++) {
      motes.push({
        x: rand(16, VW - 16),
        y: rand(30, VH - 30),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.16),
        p: rand(0, TAU),
        s: rand(5, 16),
        mag: i % 5 === 0
      });
    }
  }

  function at(c, r) {
    if (c < 0 || r < 0 || c >= G.cols || r >= G.rows) return null;
    return G.cells[r * G.cols + c];
  }

  function cellCenter(cell) {
    return {
      x: G.originX + (cell.c + 0.5) * G.cs,
      y: G.originY + (cell.r + 0.5) * G.cs
    };
  }

  function relayout() {
    const availW = VW - 36;
    const availH = VH - 168;
    const cs = Math.max(20, Math.min(34, Math.floor(availW / COLS), Math.floor(availH / ROWS)));
    G.cs = cs;
    G.gridW = cs * COLS;
    G.gridH = cs * ROWS;
    G.originX = (VW - G.gridW) * 0.5;
    G.originY = 86 + Math.max(0, (availH - G.gridH) * 0.18);
  }

  function parseMap(map) {
    G.rows = map.length;
    G.cols = map[0].length;
    G.cells = [];
    G.seed = null;
    G.heats = [];
    G.needN = 0;
    G.filled = 0;
    G.spill = 0;
    for (let r = 0; r < G.rows; r++) {
      const row = map[r];
      for (let c = 0; c < G.cols; c++) {
        const ch = row.charAt(c);
        const cell = {
          c: c,
          r: r,
          kind: 'glass',
          target: false,
          frost: false,
          seed: false,
          melt: 0,
          age: 0,
          flash: 0,
          fromC: c,
          fromR: r,
          spin: hash(c, r, 2) * TAU
        };
        if (ch === '#') {
          cell.kind = 'wall';
        } else if (ch === 'H') {
          cell.kind = 'heat';
          G.heats.push(cell);
        } else if (ch === 'X') {
          cell.kind = 'block';
        } else if (ch === '*' || ch === 'S') {
          cell.target = true;
          G.needN += 1;
          if (ch === 'S') {
            cell.seed = true;
            cell.frost = true;
            cell.kind = 'glass';
            G.seed = cell;
            G.filled = 1;
          }
        }
        G.cells.push(cell);
      }
    }
    if (G.seed) {
      const p = cellCenter(G.seed);
      G.seed.x = p.x;
      G.seed.y = p.y;
    }
  }

  function applyStage(st, demo) {
    relayout();
    parseMap(st.map);
    G.timeMax = st.time;
    G.time = st.time;
    G.grow = demo ? st.grow * 0.42 : st.grow;
    G.growAcc = 0;
    G.coldR = G.cs * st.cold;
    G.spillMax = st.spill;
    G.heatRate = st.heat;
    G.why = '';
    G.warnTime = false;
    G.warnSpill = false;
    G.demoT = 0;
    G.stall = 0;
    if (G.seed) {
      G.cx = G.seed.x;
      G.cy = G.seed.y;
    }
    G.vx = 0;
    G.vy = 0;
    G.hudNeed = true;
  }

  function startStage(i) {
    G.mode = 'play';
    G.stage = i;
    G.lock = 0.16;
    particles.length = 0;
    rings.length = 0;
    applyStage(STAGES[i], false);
    hideOverlay();
    setHint(STAGES[i].hint, '');
    toast(STAGES[i].toast || STAGES[i].name);
    syncHud();
    audio.start();
  }

  function startRun() {
    particles.length = 0;
    G.lives = LIVES;
    G.taughtSpill = false;
    G.taughtHeat = false;
    G.taughtFar = false;
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
      '霜花',
      '窗玻璃上有淡青的花纹。把冷息挪到霜边，霜会跟着长。<br />沿花纹走，别让霜爬出淡影，也别碰到品红暖气。',
      '结霜',
      'FROST',
      OPS
    );
    setHint('冷息引霜 · 沿淡青花纹长 · 别爬出窗外', '');
    syncHud();
  }

  function beginFail(why) {
    if (G.mode !== 'play') return;
    G.why = why;
    G.mode = 'thaw';
    G.settle = 0.78;
    G.magFlash = 0.85;
    G.shake = 12;
    audio.fail();
    const msg = why === 'time' ? '窗暖了' : why === 'spill' ? '霜爬出花纹' : '暖气化霜了';
    toast(msg, true);
    setHint(msg, 'warn');
    if (G.seed) addRing(G.seed.x, G.seed.y, true);
  }

  function failStage() {
    G.lives -= 1;
    syncHud();
    const more = G.lives > 0;
    let title = '化了';
    let kicker = 'THAW';
    let lead;
    if (G.why === 'time') {
      title = '窗暖了';
      kicker = 'WARM';
      lead = more
        ? '霜还没结满花纹，玻璃自己暖回来了。<br />还剩 ' + G.lives + ' 次。'
        : '窗暖了，十窗未完。';
    } else if (G.why === 'spill') {
      title = '爬出了';
      kicker = 'BLOOM';
      lead = more
        ? '霜长出了淡影。沿原路回芯，再出下一瓣。<br />还剩 ' + G.lives + ' 次。'
        : '霜爬满空玻璃，十窗未完。';
    } else {
      title = '化了';
      kicker = 'HEAT';
      lead = more
        ? '品红暖气把霜化了。贴着花纹走，别抄近路。<br />还剩 ' + G.lives + ' 次。'
        : '霜化尽了，十窗未完。';
    }
    showOverlay('lose', title, lead, more ? '再结本窗' : '再来一局', kicker);
    G.mode = 'fail';
  }

  function clearStage() {
    if (G.mode !== 'play') return;
    G.lock = 0.9;
    G.goldFlash = 0.8;
    G.flash = 0.45;
    audio.good();
    toast('花成了', false, true);
    if (G.seed) addRing(G.seed.x, G.seed.y, false);
    emit(22, {
      x: G.cx,
      y: G.cy,
      j: 18,
      vx0: -90,
      vx1: 90,
      vy0: -110,
      vy1: -10,
      life: 0.7,
      r0: 1.1,
      r1: 3.2,
      gold: true,
      g: 50
    });
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      audio.win();
      showOverlay('win', '绽了', '十扇窗上的霜花都结成了指定花纹。', '再结一巡', 'BLOOM');
      setHint('十窗霜花全开', 'hot');
      syncHud();
      return;
    }
    G.mode = 'clear';
    G.settle = 0.92;
    setHint(STAGES[G.stage].name + ' · 成', 'hot');
    syncHud();
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

  function growOne() {
    const rMax = G.coldR;
    let best = null;
    let bestScore = -1e9;
    for (let i = 0; i < G.cells.length; i++) {
      const cell = G.cells[i];
      if (!cell.frost) continue;
      for (let d = 0; d < 4; d++) {
        const n = at(cell.c + DC[d], cell.r + DR[d]);
        if (!n || n.frost) continue;
        if (n.kind !== 'glass') continue;
        const p = cellCenter(n);
        const dist = hypot(p.x - G.cx, p.y - G.cy);
        if (dist > rMax) continue;
        const bonus = n.target ? G.cs * 0.42 : 0;
        const score = (rMax - dist) + bonus - (n.melt > 0 ? 12 : 0);
        if (score > bestScore) {
          bestScore = score;
          best = { cell: n, parent: cell, x: p.x, y: p.y };
        }
      }
    }
    if (!best) return false;
    const n = best.cell;
    n.frost = true;
    n.age = 0;
    n.flash = 1;
    n.fromC = best.parent.c;
    n.fromR = best.parent.r;
    n.melt = 0;
    if (n.target) {
      G.filled += 1;
    } else {
      G.spill += 1;
      if (!G.taughtSpill && G.mode === 'play') {
        G.taughtSpill = true;
        toast('霜爬出花纹了', true);
      }
    }
    if (G.mode === 'play') {
      if (G.growSfx <= 0) {
        audio.grow(!n.target);
        G.growSfx = n.target ? 0.05 : 0.07;
      }
      emit(n.target ? 3 : 5, {
        x: best.x,
        y: best.y,
        j: G.cs * 0.18,
        vx0: -40,
        vx1: 40,
        vy0: -70,
        vy1: -8,
        life: 0.38,
        r0: 0.7,
        r1: 2.1,
        mag: !n.target,
        gold: n.target && hash(n.c, n.r, 4) > 0.72,
        g: 30
      });
    }
    if (G.mode === 'play' && G.spill > G.spillMax) {
      beginFail('spill');
      return true;
    }
    if (G.mode === 'play' && G.filled >= G.needN) {
      clearStage();
    }
    return true;
  }

  function growTick(dt) {
    if (G.mode === 'thaw' || G.mode === 'fail') return;
    if (G.filled >= G.needN && G.mode !== 'title') {
      G.growAcc = 0;
      return;
    }
    G.growAcc += dt * G.grow;
    if (G.growAcc > 2.2) G.growAcc = 2.2;
    let n = 0;
    let grew = false;
    while (G.growAcc >= 1 && n < 3) {
      if (G.mode === 'clear' || G.mode === 'win' || G.mode === 'thaw') break;
      if (!growOne()) break;
      G.growAcc -= 1;
      n += 1;
      grew = true;
    }
    if (G.mode === 'play') {
      if (!grew && n === 0) G.stall += dt;
      else G.stall = 0;
      if (G.stall > 1.15 && !G.taughtFar) {
        G.taughtFar = true;
        toast('冷息要贴着霜边', false, true);
      }
    }
  }

  function heatTick(dt) {
    if (G.heatRate <= 0) return;
    let meltedSeed = false;
    for (let i = 0; i < G.heats.length; i++) {
      const h = G.heats[i];
      for (let d = 0; d < 4; d++) {
        const n = at(h.c + DC[d], h.r + DR[d]);
        if (!n || !n.frost) continue;
        n.melt += dt * G.heatRate;
        if (n.melt >= 1) {
          if (n.seed) {
            meltedSeed = true;
            continue;
          }
          n.frost = false;
          n.melt = 0;
          n.flash = 0.6;
          if (n.target) G.filled = Math.max(0, G.filled - 1);
          const p = cellCenter(n);
          emit(7, {
            x: p.x,
            y: p.y,
            j: 6,
            vx0: -50,
            vx1: 50,
            vy0: -30,
            vy1: 40,
            life: 0.4,
            r0: 0.8,
            r1: 2.2,
            mag: true,
            g: -40
          });
          if (G.mode === 'play') {
            audio.melt();
            if (!G.taughtHeat) {
              G.taughtHeat = true;
              toast('暖气化霜了', true);
            }
          }
        }
      }
    }
    if (meltedSeed && G.mode === 'play') beginFail('heat');
  }

  function moveCold(dt) {
    const keying = keys.l || keys.r || keys.u || keys.d;
    const pad = G.cs * 0.7;
    const minX = G.originX + pad;
    const maxX = G.originX + G.gridW - pad;
    const minY = G.originY + pad;
    const maxY = G.originY + G.gridH - pad;
    if (keying) {
      let ax = 0;
      let ay = 0;
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      const len = hypot(ax, ay) || 1;
      G.vx = (ax / len) * SPEED;
      G.vy = (ay / len) * SPEED;
      G.cx += G.vx * dt;
      G.cy += G.vy * dt;
    } else if (G.mode === 'play' && ptr.on) {
      const k = 1 - Math.exp(-14 * dt);
      G.cx = lerp(G.cx, ptr.x, k);
      G.cy = lerp(G.cy, ptr.y, k);
      G.vx = 0;
      G.vy = 0;
    } else {
      G.vx *= Math.exp(-10 * dt);
      G.vy *= Math.exp(-10 * dt);
      G.cx += G.vx * dt;
      G.cy += G.vy * dt;
    }
    G.cx = clamp(G.cx, minX, maxX);
    G.cy = clamp(G.cy, minY, maxY);
  }

  function updateDemo(dt) {
    G.demoT += dt;
    if (!G.seed) return;
    const a = G.demoT * 0.62;
    const r = G.cs * (2.1 + Math.sin(G.demoT * 0.45) * 1.6);
    const tx = G.seed.x + Math.cos(a) * r;
    const ty = G.seed.y + Math.sin(a * 1.7) * r * 0.88;
    const k = 1 - Math.exp(-6 * dt);
    G.cx = lerp(G.cx, tx, k);
    G.cy = lerp(G.cy, ty, k);
    growTick(dt);
    if (G.filled >= G.needN * 0.7 || G.spill >= 7) applyStage(STAGES[0], true);
  }

  function updatePlay(dt) {
    if (G.lock > 0) return;
    G.time -= dt;
    if (!G.warnTime && G.time < 6) {
      G.warnTime = true;
      audio.warn();
    }
    if (!G.warnSpill && G.spill / Math.max(1, G.spillMax) > 0.7) {
      G.warnSpill = true;
      audio.warn();
    }
    moveCold(dt);
    heatTick(dt);
    if (G.mode !== 'play') return;
    growTick(dt);
    if (G.mode === 'play' && G.time <= 0) beginFail('time');
  }

  function thawStep(dt) {
    G.settle -= dt;
    let thawed = 0;
    for (let i = 0; i < G.cells.length; i++) {
      const cell = G.cells[i];
      if (!cell.frost || cell.seed) continue;
      if (Math.random() < dt * 10) {
        cell.frost = false;
        cell.flash = 0.4;
        thawed += 1;
        const p = cellCenter(cell);
        emit(2, {
          x: p.x,
          y: p.y,
          j: 4,
          vx0: -30,
          vx1: 30,
          vy0: -10,
          vy1: 40,
          life: 0.32,
          r0: 0.6,
          r1: 1.6,
          mag: true,
          g: -20
        });
      }
    }
    if (G.settle <= 0) failStage();
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 26);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    G.magFlash = Math.max(0, G.magFlash - dt * 1.7);
    G.goldFlash = Math.max(0, G.goldFlash - dt * 1.45);
    G.lock = Math.max(0, G.lock - dt);
    G.growSfx = Math.max(0, G.growSfx - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) toastEl.classList.add('hidden');
    }
    for (let i = 0; i < G.cells.length; i++) {
      const cell = G.cells[i];
      cell.flash = Math.max(0, cell.flash - dt * 3.4);
      if (cell.frost) cell.age += dt;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.99;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 1.8;
      if (rings[i].t > 1) rings.splice(i, 1);
    }
    if (Math.random() < dt * 9 && G.seed) {
      emit(1, {
        x: G.cx,
        y: G.cy,
        j: 10,
        vx0: -12,
        vx1: 12,
        vy0: -18,
        vy1: 6,
        life: 0.55,
        r0: 0.6,
        r1: 1.5,
        g: -8
      });
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.mode === 'title') {
      updateDemo(dt);
    } else if (G.mode === 'play') {
      updatePlay(dt);
    } else if (G.mode === 'clear') {
      G.settle -= dt;
      growTick(dt * 0.35);
      if (G.settle <= 0) startStage(G.stage + 1);
    } else if (G.mode === 'thaw') {
      thawStep(dt);
    } else if (G.mode === 'win') {
      growTick(dt * 0.2);
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

  function hex(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * TAU / 6;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    const g = ctx.createRadialGradient(sx(80), sy(36), 8, sx(80), sy(36), 280 * scale);
    g.addColorStop(0, 'rgba(255, 61, 184, 0.14)');
    g.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(sx(400), sy(70), 8, sx(400), sy(70), 260 * scale);
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
    vg.addColorStop(0, 'rgba(10, 22, 44, 0.85)');
    vg.addColorStop(0.55, 'rgba(8, 6, 20, 0.18)');
    vg.addColorStop(1, 'rgba(12, 10, 36, 0.72)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.5 + 0.5 * Math.sin(G.clock * 0.7 + m.p));
      ctx.fillStyle = rgb(m.mag ? MAG : CYN, a);
      ctx.beginPath();
      ctx.arc(
        sx(m.x + Math.sin(G.clock * 0.3 + m.p) * m.s * 0.18),
        sy(m.y + (G.clock * m.s * 0.28) % VH),
        m.r * scale,
        0,
        TAU
      );
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPane() {
    const pad = 14;
    roundRect(
      ctx,
      sx(G.originX - pad),
      sy(G.originY - pad),
      (G.gridW + pad * 2) * scale,
      (G.gridH + pad * 2) * scale,
      14 * scale
    );
    ctx.fillStyle = 'rgba(6, 14, 28, 0.94)';
    ctx.fill();
    ctx.strokeStyle = rgb(mix(CYN, MAG, clamp(G.spill / Math.max(1, G.spillMax), 0, 1)), 0.5);
    ctx.lineWidth = 1.7 * scale;
    ctx.stroke();

    roundRect(
      ctx,
      sx(G.originX - 4),
      sy(G.originY - 4),
      (G.gridW + 8) * scale,
      (G.gridH + 8) * scale,
      8 * scale
    );
    const glass = ctx.createLinearGradient(sx(G.originX), sy(G.originY), sx(G.originX + G.gridW), sy(G.originY + G.gridH));
    glass.addColorStop(0, 'rgba(12, 28, 48, 0.9)');
    glass.addColorStop(0.5, 'rgba(6, 10, 22, 0.95)');
    glass.addColorStop(1, 'rgba(14, 18, 40, 0.92)');
    ctx.fillStyle = glass;
    ctx.fill();
  }

  function drawFlake(cx, cy, r, col, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.strokeStyle = rgb(col, 1);
    ctx.lineWidth = Math.max(0.8, r * 0.18) * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 2 + i * TAU / 6;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawCell(cell) {
    const s = G.cs;
    const x = G.originX + cell.c * s;
    const y = G.originY + cell.r * s;
    const cx = x + s * 0.5;
    const cy = y + s * 0.5;

    if (cell.kind === 'wall') {
      roundRect(ctx, sx(x + 0.6), sy(y + 0.6), (s - 1.2) * scale, (s - 1.2) * scale, 3 * scale);
      ctx.fillStyle = 'rgba(18, 22, 44, 0.95)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
      return;
    }

    if (cell.kind === 'block') {
      const pulse = 0.88 + 0.12 * Math.sin(G.clock * 2.1 + cell.c);
      hex(ctx, sx(cx), sy(cy), s * 0.34 * pulse * scale);
      const lg = ctx.createLinearGradient(sx(x), sy(y), sx(x + s), sy(y + s));
      lg.addColorStop(0, rgb(mix(MAG, CYN, 0.45), 0.85));
      lg.addColorStop(0.5, 'rgba(18, 10, 32, 0.96)');
      lg.addColorStop(1, rgb(CYN, 0.55));
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.strokeStyle = rgb(CYN, 0.7);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
      return;
    }

    if (cell.kind === 'heat') {
      const pulse = 0.75 + 0.25 * Math.sin(G.clock * 5 + cell.r);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy), s * 0.62 * pulse * scale, 0, TAU);
      ctx.fillStyle = rgb(MAG, 0.16 + 0.1 * pulse);
      ctx.fill();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy), s * 0.22 * pulse * scale, 0, TAU);
      ctx.fillStyle = rgb(MAG, 0.95);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx(cx - s * 0.06), sy(cy - s * 0.07), s * 0.07 * scale, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
      return;
    }

    if (cell.target && !cell.frost) {
      hex(ctx, sx(cx), sy(cy), s * 0.32 * scale);
      ctx.strokeStyle = rgb(CYN, 0.22 + 0.1 * Math.sin(G.clock * 2.4 + cell.c));
      ctx.lineWidth = 1.15 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy), 1.15 * scale, 0, TAU);
      ctx.fillStyle = rgb(CYN, 0.28);
      ctx.fill();
    }

    if (!cell.frost) return;

    const overflow = !cell.target;
    const col = overflow ? mix(ICE, MAG, 0.55) : mix(ICE, CYN, 0.35);
    const parent = at(cell.fromC, cell.fromR);
    if (parent && parent.frost && (parent.c !== cell.c || parent.r !== cell.r)) {
      const p = cellCenter(parent);
      ctx.beginPath();
      ctx.moveTo(sx(p.x), sy(p.y));
      ctx.lineTo(sx(cx), sy(cy));
      ctx.strokeStyle = rgb(overflow ? MAG : CYN, 0.55);
      ctx.lineWidth = Math.max(1.2, s * 0.12) * scale;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    const grow = ease(clamp(cell.age * 6, 0, 1));
    const rad = s * (0.18 + 0.16 * grow);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    hex(ctx, sx(cx), sy(cy), rad * 1.55 * scale);
    ctx.fillStyle = rgb(overflow ? MAG : (cell.seed ? GOLD : CYN), 0.12 + 0.08 * grow);
    ctx.fill();
    ctx.restore();

    hex(ctx, sx(cx), sy(cy), rad * scale);
    const lg = ctx.createRadialGradient(
      sx(cx - rad * 0.25),
      sy(cy - rad * 0.3),
      1,
      sx(cx),
      sy(cy),
      rad * scale
    );
    lg.addColorStop(0, '#f4ffff');
    lg.addColorStop(0.4, rgb(col, 1));
    lg.addColorStop(1, rgb(mix(col, DEEP, 0.45), 0.95));
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = rgb(overflow ? MAG : (cell.seed ? GOLD : CYN), 0.75);
    ctx.lineWidth = 1.05 * scale;
    ctx.stroke();

    if (cell.seed) {
      ctx.beginPath();
      ctx.arc(sx(cx), sy(cy), s * 0.13 * scale, 0, TAU);
      ctx.fillStyle = rgb(GOLD, 0.95);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx(cx - s * 0.04), sy(cy - s * 0.05), s * 0.05 * scale, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
    } else {
      drawFlake(sx(cx), sy(cy), rad * 0.72, overflow ? MAG : ICE, 0.55);
    }

    if (cell.flash > 0) {
      hex(ctx, sx(cx), sy(cy), rad * 1.15 * scale);
      ctx.fillStyle = rgb(overflow ? MAG : GOLD, cell.flash * 0.4);
      ctx.fill();
    }

    if (cell.melt > 0.15) {
      hex(ctx, sx(cx), sy(cy), rad * 0.9 * scale);
      ctx.fillStyle = rgb(MAG, cell.melt * 0.45);
      ctx.fill();
    }
  }

  function drawBreath() {
    if (G.mode !== 'play' && G.mode !== 'title' && G.mode !== 'clear' && G.mode !== 'win') return;
    const pulse = 0.86 + 0.14 * Math.sin(G.clock * 5.2);
    const R = G.coldR * pulse;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.arc(sx(G.cx), sy(G.cy), R * scale, 0, TAU);
    ctx.fillStyle = rgb(CYN, 0.06);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx(G.cx), sy(G.cy), R * scale, 0, TAU);
    ctx.strokeStyle = rgb(CYN, 0.22 + 0.1 * pulse);
    ctx.lineWidth = 1.2 * scale;
    ctx.setLineDash([4 * scale, 6 * scale]);
    ctx.stroke();
    ctx.setLineDash([]);
    hex(ctx, sx(G.cx), sy(G.cy), 9.5 * pulse * scale);
    ctx.strokeStyle = rgb(CYN, 0.85);
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(G.cx), sy(G.cy), 4.4 * pulse * scale, 0, TAU);
    const lg = ctx.createRadialGradient(sx(G.cx - 1.5), sy(G.cy - 1.8), 1, sx(G.cx), sy(G.cy), 5 * scale);
    lg.addColorStop(0, '#ffffff');
    lg.addColorStop(0.45, rgb(CYN, 1));
    lg.addColorStop(1, 'rgba(0, 40, 50, 0.2)');
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fillStyle = rgb(p.mag ? MAG : (p.gold ? GOLD : CYN), a * 0.85);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const t = ease(rg.t);
      ctx.beginPath();
      ctx.arc(sx(rg.x), sy(rg.y), (8 + t * 48) * scale, 0, TAU);
      ctx.strokeStyle = rgb(rg.mag ? MAG : GOLD, 0.55 * (1 - t));
      ctx.lineWidth = (2.2 - t * 1.4) * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLabels() {
    const st = STAGES[G.stage];
    if (!st) return;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.font = '600 ' + Math.max(10, 11 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = 'rgba(180, 230, 255, 0.45)';
    ctx.fillText(st.sub, sx(VW * 0.5), sy(G.originY - 18));
    ctx.font = '700 ' + Math.max(12, 13 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = rgb(CYN, 0.7);
    ctx.fillText(st.name, sx(VW * 0.5), sy(G.originY - 4));
  }

  function drawFlash() {
    if (G.goldFlash > 0) {
      ctx.fillStyle = rgb(GOLD, G.goldFlash * 0.12);
      ctx.fillRect(0, 0, W, H);
    }
    if (G.magFlash > 0) {
      ctx.fillStyle = rgb(MAG, G.magFlash * 0.14);
      ctx.fillRect(0, 0, W, H);
    }
    if (G.flash > 0) {
      ctx.fillStyle = rgb(CYN, G.flash * 0.08);
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    const shx = G.shake ? rand(-G.shake, G.shake) * 0.35 : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) * 0.35 : 0;
    drawBg();
    ctx.save();
    ctx.translate(shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawPane();
    for (let i = 0; i < G.cells.length; i++) drawCell(G.cells[i]);
    drawBreath();
    drawParticles();
    drawLabels();
    ctx.restore();
    ctx.restore();
    drawFlash();
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
    if (G.cells.length) {
      const oldCs = G.cs;
      const ox0 = G.originX;
      const oy0 = G.originY;
      relayout();
      if (oldCs > 0) {
        const nx = (G.cx - ox0) / oldCs;
        const ny = (G.cy - oy0) / oldCs;
        G.cx = G.originX + nx * G.cs;
        G.cy = G.originY + ny * G.cs;
      }
      const st = STAGES[G.stage];
      if (st) G.coldR = G.cs * st.cold;
      if (G.seed) {
        const p = cellCenter(G.seed);
        G.seed.x = p.x;
        G.seed.y = p.y;
      }
    }
  }

  function onKey(e, down) {
    const k = e.key;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || k === ' ' || k === 'Spacebar' || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S')) {
      e.preventDefault();
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = down;
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
      }
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    audio.ensure();
    const w = worldFromEvent(e);
    ptr.down = true;
    ptr.on = true;
    ptr.id = e.pointerId;
    ptr.x = w.x;
    ptr.y = w.y;
    ptr.hover = true;
    if (G.mode === 'play') {
      G.cx = lerp(G.cx, w.x, 0.55);
      G.cy = lerp(G.cy, w.y, 0.55);
    }
    canvas.classList.add('drag');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    ptr.x = w.x;
    ptr.y = w.y;
    if (e.pointerType === 'mouse') {
      ptr.hover = true;
      ptr.on = G.mode === 'play';
    }
    if (ptr.down && (ptr.id == null || e.pointerId === ptr.id)) ptr.on = true;
  });

  function endPtr(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    ptr.down = false;
    ptr.id = null;
    canvas.classList.remove('drag');
    if (e.pointerType !== 'mouse') {
      ptr.hover = false;
      ptr.on = false;
    }
  }

  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') {
      ptr.hover = false;
      if (!ptr.down) ptr.on = false;
    }
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
