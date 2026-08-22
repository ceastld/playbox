'use strict';

(function () {
  const VW = 720;
  const VH = 480;
  const CX = 360;
  const HORIZON = 158;
  const EYE = 1.72;
  const SIGHT_Y = 182;
  const FOCAL = 340;
  const NEAR = 1.35;
  const DASH = 118;
  const WORLD = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 3.2;
  const TURN = 1.55;
  const FWD = 32;
  const BACK = 20;
  const SHOT_V = 52;
  const ESHOT_V = 38;
  const P_RAD = 3.2;
  const RADAR_RANGE = 100;
  const BEST_KEY = 'playbox-battlezone-best';
  const MUTE_KEY = 'playbox-battlezone-mute';
  const OPS = '←→ 转向 · ↑↓ 进退 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const COARSE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(pointer: coarse)').matches
    : false;

  const LIME = [176, 240, 25];
  const DIMG = [86, 132, 38];
  const CYN = [125, 255, 106];
  const GOLD = [255, 227, 107];
  const MAG = [255, 61, 184];
  const ORG = [255, 158, 48];
  const WHT = [240, 255, 220];
  const RED = [255, 72, 80];
  const SKY = [8, 14, 8];

  const KIND_RGB = { tank: LIME, super: GOLD, missile: MAG };
  const KIND_SCORE = { tank: 1000, super: 3000, missile: 2000 };
  const KIND_RAD = { tank: 3.6, super: 3.9, missile: 2.2 };

  const BLOCK_SPEC = [
    { x: 248, z: 268, s: 10, h: 12 },
    { x: 92, z: 220, s: 8, h: 9 },
    { x: 230, z: 72, s: 14, h: 16 },
    { x: 140, z: 100, s: 7, h: 8 },
    { x: 310, z: 160, s: 9, h: 11 },
    { x: 60, z: 280, s: 11, h: 10 },
    { x: 200, z: 320, s: 8, h: 14 },
    { x: 30, z: 130, s: 6, h: 7 },
    { x: 280, z: 310, s: 12, h: 8 },
    { x: 120, z: 340, s: 9, h: 12 },
    { x: 300, z: 40, s: 8, h: 10 },
    { x: 170, z: 50, s: 10, h: 9 }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnCamp = document.getElementById('btn-camp');
  const btnRaid = document.getElementById('btn-raid');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const radarLabel = document.getElementById('radar-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let comboTok = 0;
  let hudN = -1;
  let volcanoA = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const ptrs = {};
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const shards = [];
  const mountains = [];
  const blocks = [];
  const vis = [];

  function boxEdges(x0, y0, z0, x1, y1, z1) {
    const c = [
      [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
      [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]
    ];
    const e = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
    const out = [];
    for (let i = 0; i < e.length; i += 2) {
      const a = c[e[i]];
      const b = c[e[i + 1]];
      out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    }
    return out;
  }

  function concatEdges() {
    const out = [];
    for (let i = 0; i < arguments.length; i++) {
      const e = arguments[i];
      for (let j = 0; j < e.length; j++) out.push(e[j]);
    }
    return out;
  }

  const TANK_EDGES = concatEdges(
    boxEdges(-2.2, 0.18, -3.1, 2.2, 1.32, 2.7),
    boxEdges(-1.15, 1.32, -0.7, 1.15, 2.12, 1.35),
    boxEdges(-0.18, 1.62, 1.2, 0.18, 1.92, 3.55),
    boxEdges(-2.55, 0, -3.05, -1.65, 0.72, 2.85),
    boxEdges(1.65, 0, -3.05, 2.55, 0.72, 2.85)
  );

  const SUPER_EDGES = concatEdges(
    boxEdges(-2.45, 0.18, -3.3, 2.45, 1.48, 2.9),
    boxEdges(-1.35, 1.48, -0.9, 1.35, 2.42, 1.5),
    boxEdges(-0.22, 1.82, 1.3, 0.22, 2.18, 4.1),
    boxEdges(-2.8, 0, -3.25, -1.7, 0.82, 3.0),
    boxEdges(1.7, 0, -3.25, 2.8, 0.82, 3.0),
    [0, 2.42, 0.2, 0, 3.4, 0.2, 0, 3.4, 0.2, 0.55, 3.15, 0.2]
  );

  const MISS_EDGES = [
    0, 0.5, 2.9, 0.95, 0.5, 0.4,
    0, 0.5, 2.9, -0.95, 0.5, 0.4,
    0, 0.5, 2.9, 0, 1.35, 0.3,
    0.95, 0.5, 0.4, -0.95, 0.5, 0.4,
    0.95, 0.5, 0.4, 0, 1.35, 0.3,
    -0.95, 0.5, 0.4, 0, 1.35, 0.3,
    0, 0.5, 0.4, 0, 0.5, -2.3,
    0, 0.5, -1.2, 1.45, 0.5, -2.25,
    0, 0.5, -1.2, -1.45, 0.5, -2.25,
    0, 0.5, -1.2, 0, 1.55, -2.05
  ];

  const SHELL_EDGES = boxEdges(-0.38, 1.38, -0.38, 0.38, 2.08, 0.38);

  const G = {
    mode: 'title',
    kind: 'camp',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    px: WORLD * 0.5,
    pz: WORLD * 0.5,
    ang: 0,
    cosA: 1,
    sinA: 0,
    enemies: [],
    shots: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: LIME,
    punch: 1,
    toastT: 0,
    why: '',
    muzzle: 0,
    recoil: 0,
    sweep: 0,
    pinged: false,
    sight: false,
    warnT: 0,
    waveT: 0,
    missT: 0,
    contacts: 0,
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
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function wrap(v) {
    v %= WORLD;
    if (v < 0) v += WORLD;
    return v;
  }
  function wrapD(d) {
    const h = WORLD * 0.5;
    if (d > h) d -= WORLD;
    if (d < -h) d += WORLD;
    return d;
  }
  function wrapAng(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function distWrap(ax, az, bx, bz) {
    const dx = wrapD(bx - ax);
    const dz = wrapD(bz - az);
    return hypot(dx, dz);
  }
  function turnToward(ang, want, max) {
    let d = wrapAng(want - ang);
    if (d > max) d = max;
    if (d < -max) d = -max;
    return ang + d;
  }
  function isRaid() {
    return G.kind === 'raid';
  }
  function isCamp() {
    return G.kind !== 'raid';
  }
  function dashY() {
    return VH - DASH;
  }
  function padL() {
    return { x: 86, y: VH - 58, r: 54 };
  }
  function padF() {
    return { x: VW - 86, y: VH - 58, r: 42 };
  }
  function radC() {
    return { x: CX, y: VH - 58, r: 50 };
  }

  function camPoint(wx, wy, wz) {
    const dx = wrapD(wx - G.px);
    const dz = wrapD(wz - G.pz);
    return {
      x: dx * G.cosA - dz * G.sinA,
      y: wy - EYE,
      z: dx * G.sinA + dz * G.cosA
    };
  }

  function projCam(p) {
    const z = Math.max(NEAR, p.z);
    const inv = 1 / z;
    return {
      x: CX + FOCAL * p.x * inv,
      y: HORIZON - FOCAL * p.y * inv,
      s: FOCAL * inv,
      z: p.z,
      inv: inv
    };
  }

  function project(wx, wy, wz) {
    const c = camPoint(wx, wy, wz);
    if (c.z < NEAR) return null;
    return projCam(c);
  }

  function clipNear(a, b) {
    if (a.z < NEAR && b.z < NEAR) return null;
    if (a.z >= NEAR && b.z >= NEAR) return [a, b];
    const t = (NEAR - a.z) / (b.z - a.z);
    const n = {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: NEAR
    };
    return a.z >= NEAR ? [a, n] : [n, b];
  }

  function xf(lx, ly, lz, px, pz, ang) {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    return {
      x: px + c * lx + s * lz,
      y: ly,
      z: pz - s * lx + c * lz
    };
  }

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
      o.type = type || 'square';
      o.frequency.setValueAtTime(Math.max(40, freq), t);
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
    shoot() {
      this.ensure();
      this.beep(220, 0.08, 'square', 0.04, 90);
      this.beep(640, 0.05, 'sawtooth', 0.03, 180);
      this.noise(0.05, 0.03, 700);
    },
    enemyShot() {
      this.ensure();
      this.beep(180, 0.06, 'square', 0.024, 80);
    },
    hit(kind) {
      this.ensure();
      const base = kind === 'super' ? 280 : kind === 'missile' ? 820 : 520;
      this.noise(0.05, 0.04, 900);
      this.beep(base, 0.08, 'square', 0.05, base * 1.55);
    },
    explode() {
      this.ensure();
      this.noise(0.14, 0.055, 420);
      this.beep(240, 0.18, 'sawtooth', 0.048, 55);
    },
    ping() {
      this.ensure();
      this.beep(1560, 0.05, 'sine', 0.026, 2400);
    },
    warn() {
      this.ensure();
      this.beep(880, 0.07, 'square', 0.038, 420);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(260, 0.22, 'sawtooth', 0.052, 58);
      this.beep(140, 0.32, 'sine', 0.046, 40);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'sine', 0.04, 659);
      this.beep(784, 0.18, 'triangle', 0.044, 1046);
    },
    start() {
      this.ensure();
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.034, 990);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.042, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    miss() {
      this.ensure();
      this.beep(140, 0.05, 'sine', 0.014, 70);
    },
    block() {
      this.ensure();
      this.beep(210, 0.05, 'square', 0.022, 90);
      this.noise(0.04, 0.02, 600);
    }
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

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    while (G.score >= G.next1up && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.next1up += LIFE_EVERY;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
    comboTok += 1;
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.15;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1150);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = LIFE_CAP;
    while (pips.length < n) {
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < n; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '坦克';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 5);
    }
    if (tagLabel) {
      let tag = isCamp() ? '阵地' : '突袭';
      if (G.mode === 'play' && G.warnT > 0) tag = '导弹';
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || G.warnT > 0);
      tagLabel.classList.toggle('hot', G.combo >= 6 || (G.mode === 'play' && G.wave >= 6));
    }
    if (radarLabel) {
      if (G.mode === 'play') {
        radarLabel.textContent = '雷达 ' + G.contacts;
        radarLabel.classList.toggle('hot', G.contacts > 0);
        radarLabel.classList.toggle('warn', G.warnT > 0);
      } else {
        radarLabel.textContent = '雷达 —';
        radarLabel.classList.remove('hot');
        radarLabel.classList.remove('warn');
      }
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult >= 2 ? '连击 ×' + G.mult : '连击 ' + G.combo;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或冲撞扣命', 'warn');
    else if (G.warnT > 0) setHint('导弹来袭 · 瞄准打掉', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 掩体躲弹', 'warn');
    else if (G.combo >= 6) setHint('连击 ×' + G.mult + ' · 继续轰', 'hot');
    else setHint('←→ 转向 · ↑↓ 进退 · 空格开火 · 雷达找敌', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'TANK';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (btnCamp) btnCamp.textContent = primary;
    if (btnRaid) {
      btnRaid.textContent = secondary;
      btnRaid.classList.remove('hidden');
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl || G.mode === 'title') return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(7, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v * 0.72 - v * 0.12,
        g: 48,
        life: rand(0.22, 0.58),
        max: 0.58,
        r: rand(1.2, 3.2),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 180);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 24);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 16);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.78, vy: -48, text: text, rgb: rgb });
    capArr(floats, 16);
  }

  function explodeAt(wx, wz, rgb, n, scoreStr) {
    const p = project(wx, 1.4, wz);
    const sxv = p ? p.x : CX;
    const syv = p ? p.y : HORIZON;
    burst(sxv, syv, rgb, n, 220);
    spark(sxv, syv, rgb);
    ring(sxv, syv, rgb);
    if (scoreStr) floatText(sxv, syv - 10, scoreStr, GOLD);
    const count = REDUCE ? 6 : 12;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(8, 26);
      shards.push({
        x: wx,
        y: rand(0.6, 2.4),
        z: wz,
        vx: Math.cos(a) * v,
        vy: rand(6, 22),
        vz: Math.sin(a) * v,
        lx: rand(-1.6, 1.6),
        ly: rand(-0.4, 1.4),
        lz: rand(-1.6, 1.6),
        life: rand(0.28, 0.7),
        rgb: i % 2 ? rgb : WHT
      });
    }
    capArr(shards, 80);
  }

  function seedMountains() {
    mountains.length = 0;
    const n = 80;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      let h = 8
        + Math.abs(Math.sin(i * 0.41) * 16)
        + Math.abs(Math.sin(i * 1.17) * 11)
        + Math.abs(Math.cos(i * 0.23) * 7);
      if (i === 22) h = 54;
      if (i === 21 || i === 23) h = 36;
      if (i === 20 || i === 24) h = 24;
      mountains.push({ a: a, h: h });
    }
    volcanoA = (22.4 / n) * TAU;
  }

  function seedBlocks() {
    blocks.length = 0;
    for (let i = 0; i < BLOCK_SPEC.length; i++) {
      const s = BLOCK_SPEC[i];
      blocks.push({
        x: s.x,
        z: s.z,
        s: s.s,
        h: s.h,
        edges: boxEdges(-s.s * 0.5, 0, -s.s * 0.5, s.s * 0.5, s.h, s.s * 0.5)
      });
    }
  }

  function hitBlock(x, z, r) {
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const dx = wrapD(x - b.x);
      const dz = wrapD(z - b.z);
      const hw = b.s * 0.5 + r;
      if (Math.abs(dx) < hw && Math.abs(dz) < hw) return b;
    }
    return null;
  }

  function blocked(ax, az, bx, bz) {
    const dx = wrapD(bx - ax);
    const dz = wrapD(bz - az);
    const steps = 9;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (hitBlock(wrap(ax + dx * t), wrap(az + dz * t), 1.1)) return true;
    }
    return false;
  }

  function tryMove(x, z, r) {
    if (!hitBlock(x, z, r)) return { x: wrap(x), z: wrap(z) };
    return null;
  }

  function slideMove(x0, z0, x1, z1, r) {
    const a = tryMove(x1, z1, r);
    if (a) return a;
    const b = tryMove(x1, z0, r);
    if (b) return b;
    const c = tryMove(x0, z1, r);
    if (c) return c;
    return { x: x0, z: z0 };
  }

  function waveSpec(n) {
    const raid = isRaid();
    const tanks = n <= 1 ? 2 : n === 3 ? 1 : n >= 8 ? 3 : 2;
    const supers = n < 3 ? 0 : n >= 7 ? 2 : 1;
    let missiles = n < 2 ? 0 : n === 3 ? 0 : n >= 5 ? 2 : 1;
    if (raid) missiles = Math.min(3, missiles + 1);
    if (n === 1 && raid) missiles = 1;
    return { tanks: tanks, supers: supers, missiles: missiles };
  }

  function diff() {
    return 1 + (G.wave - 1) * 0.055 + (isRaid() ? 0.12 : 0);
  }

  function spawnAway(kind, near) {
    for (let i = 0; i < 28; i++) {
      const a = rand(0, TAU);
      const d = near ? rand(64, 92) : rand(88, 150);
      const x = wrap(G.px + Math.sin(a) * d);
      const z = wrap(G.pz + Math.cos(a) * d);
      if (hitBlock(x, z, 7)) continue;
      if (distWrap(x, z, G.px, G.pz) < 62) continue;
      const dx = wrapD(G.px - x);
      const dz = wrapD(G.pz - z);
      G.enemies.push({
        kind: kind,
        x: x,
        z: z,
        ang: Math.atan2(dx, dz),
        cool: rand(0.5, 1.6),
        turnT: rand(0.4, 1.2),
        strafe: 0,
        alive: true,
        blip: 0,
        hitFlash: 0,
        age: 0
      });
      return;
    }
  }

  function clearField() {
    G.enemies.length = 0;
    G.shots.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    shards.length = 0;
  }

  function spawnWave() {
    const spec = waveSpec(G.wave);
    let i;
    for (i = 0; i < spec.tanks; i++) spawnAway('tank', i === 0);
    for (i = 0; i < spec.supers; i++) spawnAway('super', i === 0 && spec.tanks === 0);
    for (i = 0; i < spec.missiles; i++) spawnAway('missile', false);
    G.waveT = 0;
    G.missT = isRaid() ? 7.5 : 11;
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function countKind(kind) {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === kind) n += 1;
    }
    return n;
  }

  function playerShotAlive() {
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].alive && G.shots[i].from === 'p') return true;
    }
    return false;
  }

  function spawnShot(x, z, ang, spd, from) {
    G.shots.push({
      x: wrap(x + Math.sin(ang) * 4.2),
      z: wrap(z + Math.cos(ang) * 4.2),
      ang: ang,
      spd: spd,
      from: from,
      life: 3.6,
      alive: true
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0 || playerShotAlive()) return;
    spawnShot(G.px, G.pz, G.ang, SHOT_V, 'p');
    G.fireCd = 0.16;
    G.muzzle = 0.12;
    G.recoil = 1;
    audio.shoot();
    kick(1.6);
    screenFlash(WHT, 0.16);
  }

  function killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = KIND_RGB[e.kind] || LIME;
    const base = KIND_SCORE[e.kind] || 1000;
    bumpCombo();
    const pts = base * G.mult;
    addScore(pts);
    explodeAt(e.x, e.z, rgb, e.kind === 'super' ? 28 : 20, '+' + pts);
    audio.hit(e.kind);
    audio.explode();
    hitStop(e.kind === 'super' ? 0.072 : e.kind === 'missile' ? 0.055 : 0.042);
    kick(e.kind === 'super' ? 5.2 : 3.6);
    screenFlash(rgb, 0.38);
  }

  function hitPlayer() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.invuln = 0;
    breakCombo();
    explodeAt(G.px, G.pz, MAG, 34, '');
    audio.death();
    kick(7.2);
    hitStop(0.07);
    screenFlash(MAG, 0.55);
    syncPips();
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === 'e') G.shots[i].alive = false;
    }
  }

  function goLose() {
    G.mode = 'lose';
    G.why = 'hit';
    audio.lose();
    showOverlay(
      'lose',
      '击毁了',
      '第 ' + G.wave + ' 波 · ' + G.score + ' 分。R 立刻再来。',
      '再来',
      '换模式'
    );
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'camp';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.px = WORLD * 0.5;
    G.pz = WORLD * 0.5;
    G.ang = 0.4;
    G.flash = 0;
    G.shake = 0;
    G.warnT = 0;
    clearField();
    spawnAway('tank');
    spawnAway('super');
    spawnAway('missile');
    showOverlay(
      'title',
      '坦克',
      '第一人称线框战车。雷达找敌，掩体躲弹，慢炮对轰。',
      '阵地',
      '突袭'
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'raid' ? 'raid' : 'camp';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.next1up = LIFE_EVERY;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.px = WORLD * 0.5;
    G.pz = WORLD * 0.5;
    G.ang = 0;
    G.deadT = 0;
    G.invuln = 1.1;
    G.fireCd = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.muzzle = 0;
    G.recoil = 0;
    G.fireHold = false;
    G.sweep = 0;
    G.warnT = 0;
    G.waveT = 0;
    clearField();
    spawnWave();
    hideOverlay();
    audio.start();
    toast((isRaid() ? '突袭' : '阵地') + ' · 第 1 波', false, true);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('camp');
    else startGame(G.kind);
  }

  function nextWave() {
    G.wave += 1;
    spawnWave();
    audio.wave();
    toast('第 ' + G.wave + ' 波 · 加速', false, true);
    kick(2.2);
    screenFlash(GOLD, 0.22);
  }

  function readStick() {
    let sxv = 0;
    let syv = 0;
    let fire = false;
    const p = padL();
    const f = padF();
    const ids = Object.keys(ptrs);
    for (let i = 0; i < ids.length; i++) {
      const pt = ptrs[ids[i]];
      if (!pt) continue;
      if (pt.role === 'fire') fire = true;
      else if (pt.role === 'stick') {
        sxv = clamp((pt.x - p.x) / p.r, -1, 1);
        syv = clamp(-(pt.y - p.y) / p.r, -1, 1);
        const m = hypot(sxv, syv);
        if (m > 1) {
          sxv /= m;
          syv /= m;
        }
        if (m < 0.12) {
          sxv = 0;
          syv = 0;
        }
      }
    }
    return { x: sxv, y: syv, fire: fire };
  }

  function inCircle(x, y, c) {
    return hypot(x - c.x, y - c.y) <= c.r + 6;
  }

  function classifyPtr(x, y) {
    if (inCircle(x, y, padF())) return 'fire';
    if (inCircle(x, y, padL())) return 'stick';
    if (inCircle(x, y, radC())) return 'radar';
    if (y > dashY() - 8) {
      if (x < CX) return 'stick';
      return 'fire';
    }
    return 'view';
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const st = readStick();
    let turn = 0;
    let throttle = 0;
    if (keys.l) turn -= 1;
    if (keys.r) turn += 1;
    if (keys.u) throttle += 1;
    if (keys.d) throttle -= 1;
    turn = clamp(turn + st.x, -1, 1);
    throttle = clamp(throttle + st.y, -1, 1);
    G.ang = wrapAng(G.ang + turn * TURN * dt);
    const spd = throttle >= 0 ? FWD * throttle : BACK * throttle;
    if (Math.abs(spd) > 0.4) {
      const nx = G.px + Math.sin(G.ang) * spd * dt;
      const nz = G.pz + Math.cos(G.ang) * spd * dt;
      const m = slideMove(G.px, G.pz, nx, nz, P_RAD);
      G.px = m.x;
      G.pz = m.z;
      G.moving = 1;
    } else {
      G.moving = Math.max(0, G.moving - dt * 3);
    }
    if ((G.fireHold || st.fire) && G.mode === 'play') fire();
  }

  function updateEnemies(dt) {
    const dmul = diff();
    G.contacts = 0;
    G.sight = false;
    let missileClose = false;
    const sweepA = G.sweep;
    let didPing = false;

    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.age += dt;
      e.cool = Math.max(0, e.cool - dt);
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.blip = Math.max(0, e.blip - dt * 2.4);

      const dx = wrapD(G.px - e.x);
      const dz = wrapD(G.pz - e.z);
      const dist = hypot(dx, dz);
      const want = Math.atan2(dx, dz);
      const cam = camPoint(e.x, 1.2, e.z);

      if (dist < RADAR_RANGE) {
        G.contacts += 1;
        const rx = -dx * G.cosA + dz * G.sinA;
        const rz = -dx * G.sinA - dz * G.cosA;
        const ba = Math.atan2(rx, rz);
        const da = wrapAng(ba - sweepA);
        if (da > 0 && da < 0.09 && e.blip <= 0) {
          e.blip = 1;
          if (!didPing && G.mode === 'play') {
            audio.ping();
            didPing = true;
          }
        }
      }

      if (cam.z > NEAR && cam.z < 110) {
        const p = projCam(cam);
        if (Math.abs(p.x - CX) < 24 && Math.abs(p.y - SIGHT_Y) < 22) G.sight = true;
      }

      if (G.mode === 'title') {
        e.ang = turnToward(e.ang, want + 0.7, 0.6 * dt);
        const nx = e.x + Math.sin(e.ang) * 8 * dt;
        const nz = e.z + Math.cos(e.ang) * 8 * dt;
        const m = slideMove(e.x, e.z, nx, nz, KIND_RAD[e.kind] || 3);
        e.x = m.x;
        e.z = m.z;
        continue;
      }

      if (e.kind === 'missile') {
        const turnSpd = (isRaid() ? 2.35 : 1.55) * dmul;
        e.ang = turnToward(e.ang, want, turnSpd * dt);
        const spd = (isRaid() ? 54 : 34) * dmul;
        const nx = e.x + Math.sin(e.ang) * spd * dt;
        const nz = e.z + Math.cos(e.ang) * spd * dt;
        if (hitBlock(nx, nz, 1.8)) e.ang = wrapAng(e.ang + 1.1);
        else {
          e.x = wrap(nx);
          e.z = wrap(nz);
        }
        if (dist < 55) missileClose = true;
        if (dist < 4.4) hitPlayer();
        continue;
      }

      const superT = e.kind === 'super';
      const turnSpd = (superT ? 1.85 : 1.15) * dmul;
      e.turnT -= dt;
      if (e.turnT <= 0) {
        e.turnT = rand(0.5, 1.6);
        e.strafe = Math.random() < (superT ? 0.28 : 0.4) ? (Math.random() < 0.5 ? -1 : 1) : 0;
      }
      let face = want;
      if (e.strafe) face = want + e.strafe * 1.15;
      e.ang = turnToward(e.ang, face, turnSpd * dt);
      const dang = wrapAng(want - e.ang);
      let spd = 0;
      if (dist > (superT ? 28 : 36)) spd = (superT ? 22 : 14) * dmul;
      else if (dist < 16) spd = -12;
      else if (e.strafe) spd = (superT ? 16 : 10) * dmul;
      else spd = (superT ? 8 : 4) * dmul;
      if (Math.abs(spd) > 0.2) {
        const nx = e.x + Math.sin(e.ang) * spd * dt;
        const nz = e.z + Math.cos(e.ang) * spd * dt;
        const m = slideMove(e.x, e.z, nx, nz, KIND_RAD[e.kind]);
        e.x = m.x;
        e.z = m.z;
      }
      const aim = superT ? 0.13 : 0.2;
      if (
        e.cool <= 0 &&
        Math.abs(dang) < aim &&
        dist > 12 &&
        dist < 98 &&
        !blocked(e.x, e.z, G.px, G.pz)
      ) {
        spawnShot(e.x, e.z, e.ang, ESHOT_V * (0.92 + dmul * 0.08), 'e');
        e.cool = (superT ? 1.22 : 2.12) / Math.min(1.45, dmul);
        audio.enemyShot();
      }
      if (dist < 4.0) hitPlayer();
    }

    if (missileClose) {
      if (G.warnT <= 0) audio.warn();
      G.warnT = 0.5;
    } else {
      G.warnT = Math.max(0, G.warnT - dt);
    }

    if (G.mode === 'play' && aliveCount() === 0) {
      G.waveT += dt;
      if (G.waveT > 1.15) {
        addScore(400 * G.wave);
        nextWave();
      }
    }

    if (G.mode === 'play' && isRaid() && aliveCount() > 0) {
      G.missT -= dt;
      if (G.missT <= 0 && countKind('missile') < 2) {
        spawnAway('missile');
        G.missT = Math.max(4.2, 8.2 - G.wave * 0.35);
      }
    }
  }

  function updateShots(dt) {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.alive) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.alive = false;
        if (s.from === 'p') audio.miss();
        continue;
      }
      s.x = wrap(s.x + Math.sin(s.ang) * s.spd * dt);
      s.z = wrap(s.z + Math.cos(s.ang) * s.spd * dt);
      if (hitBlock(s.x, s.z, 0.7)) {
        s.alive = false;
        explodeAt(s.x, s.z, s.from === 'p' ? WHT : MAG, 8, '');
        audio.block();
        continue;
      }
      if (s.from === 'p') {
        for (let j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (!e.alive) continue;
          if (distWrap(s.x, s.z, e.x, e.z) < KIND_RAD[e.kind] + 1.3) {
            s.alive = false;
            killEnemy(e);
            break;
          }
        }
      } else if (G.deadT <= 0 && G.invuln <= 0) {
        if (distWrap(s.x, s.z, G.px, G.pz) < P_RAD + 0.9) {
          s.alive = false;
          hitPlayer();
        }
      }
    }
    let w = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].alive) G.shots[w++] = G.shots[i];
    }
    G.shots.length = w;
    w = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) G.enemies[w++] = G.enemies[i];
    }
    G.enemies.length = w;
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.recoil = Math.max(0, G.recoil - dt * 3.2);
    G.flash = Math.max(0, G.flash - dt * 2.6);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt;
      s.x = wrap(s.x + s.vx * dt);
      s.z = wrap(s.z + s.vz * dt);
      s.y += s.vy * dt;
      s.vy -= 32 * dt;
      if (s.y < 0) {
        s.y = 0;
        s.vy *= -0.35;
      }
      if (s.life <= 0) shards.splice(i, 1);
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    G.cosA = Math.cos(G.ang);
    G.sinA = Math.sin(G.ang);
    G.sweep = wrapAng(G.sweep + dt * 1.85);
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.toastT > 0) G.toastT -= dt;
    updateFx(dt);
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.mode === 'title') {
      G.ang = wrapAng(G.ang + dt * 0.18);
      updateEnemies(dt);
      return;
    }
    if (G.mode !== 'play') return;
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnemies(dt);
      updateShots(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        G.invuln = 1.55;
        G.ang = G.ang;
      }
      return;
    }
    if (G.invuln > 0) G.invuln -= dt;
    updatePlayer(dt);
    updateEnemies(dt);
    updateShots(dt);
  }

  function windowPath() {
    const top = 18;
    const bot = dashY();
    ctx.beginPath();
    ctx.moveTo(sx(48), sy(top));
    ctx.lineTo(sx(VW - 48), sy(top));
    ctx.lineTo(sx(VW - 10), sy(bot));
    ctx.lineTo(sx(10), sy(bot));
    ctx.closePath();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(HORIZON));
    g.addColorStop(0, '#030504');
    g.addColorStop(1, '#0a1206');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, dashY() * scale);
    const g2 = ctx.createLinearGradient(sx(0), sy(HORIZON), sx(0), sy(dashY()));
    g2.addColorStop(0, '#081006');
    g2.addColorStop(1, '#050804');
    ctx.fillStyle = g2;
    ctx.fillRect(sx(0), sy(HORIZON), VW * scale, (dashY() - HORIZON) * scale);
  }

  function drawMountains() {
    ctx.beginPath();
    let pen = false;
    const n = mountains.length;
    for (let k = -1; k <= 1; k++) {
      for (let i = 0; i <= n; i++) {
        const m = mountains[i % n];
        const da = wrapAng(m.a - G.ang + k * TAU);
        if (Math.abs(da) > 1.35) {
          pen = false;
          continue;
        }
        const x = CX + FOCAL * Math.tan(da);
        const y = HORIZON - m.h;
        if (!pen) {
          ctx.moveTo(sx(x), sy(y));
          pen = true;
        } else {
          ctx.lineTo(sx(x), sy(y));
        }
      }
      pen = false;
    }
    ctx.strokeStyle = rgba(DIMG, 0.85);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.stroke();

    const va = wrapAng(volcanoA - G.ang);
    if (Math.abs(va) < 1.2) {
      const vx = CX + FOCAL * Math.tan(va);
      const vy = HORIZON - 54;
      ctx.beginPath();
      ctx.moveTo(sx(vx - 10), sy(HORIZON - 28));
      ctx.lineTo(sx(vx), sy(vy));
      ctx.lineTo(sx(vx + 10), sy(HORIZON - 28));
      ctx.strokeStyle = rgba(ORG, 0.7);
      ctx.lineWidth = Math.max(1, 1.4 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx(vx), sy(vy + 4), 4 * scale, 0, TAU);
      ctx.fillStyle = rgba(ORG, 0.18);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(sx(0), sy(HORIZON));
    ctx.lineTo(sx(VW), sy(HORIZON));
    ctx.strokeStyle = rgba(LIME, 0.55);
    ctx.lineWidth = Math.max(1, 1.15 * scale);
    ctx.stroke();
  }

  function strokeEdges(edges, px, pz, ang, rgb, a, lw) {
    ctx.beginPath();
    let any = false;
    for (let i = 0; i < edges.length; i += 6) {
      const p1 = xf(edges[i], edges[i + 1], edges[i + 2], px, pz, ang);
      const p2 = xf(edges[i + 3], edges[i + 4], edges[i + 5], px, pz, ang);
      const c1 = camPoint(p1.x, p1.y, p1.z);
      const c2 = camPoint(p2.x, p2.y, p2.z);
      const cl = clipNear(c1, c2);
      if (!cl) continue;
      const a1 = projCam(cl[0]);
      const a2 = projCam(cl[1]);
      if ((a1.x < -40 && a2.x < -40) || (a1.x > VW + 40 && a2.x > VW + 40)) continue;
      if ((a1.y < -20 && a2.y < -20) || (a1.y > dashY() + 20 && a2.y > dashY() + 20)) continue;
      ctx.moveTo(sx(a1.x), sy(a1.y));
      ctx.lineTo(sx(a2.x), sy(a2.y));
      any = true;
    }
    if (!any) return;
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = Math.max(1, lw * scale);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function collectVis() {
    vis.length = 0;
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const c = camPoint(b.x, b.h * 0.5, b.z);
      if (c.z > NEAR && c.z < 210) vis.push({ z: c.z, kind: 'block', o: b });
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const c = camPoint(e.x, 1.2, e.z);
      if (c.z > 0.6 && c.z < 210) vis.push({ z: c.z, kind: 'enemy', o: e });
    }
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.alive) continue;
      const c = camPoint(s.x, 1.72, s.z);
      if (c.z > 0.6 && c.z < 210) vis.push({ z: c.z, kind: 'shot', o: s });
    }
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const c = camPoint(s.x, s.y, s.z);
      if (c.z > 0.6 && c.z < 210) vis.push({ z: c.z, kind: 'shard', o: s });
    }
    vis.sort(function (a, b) { return b.z - a.z; });
  }

  function drawVis() {
    for (let i = 0; i < vis.length; i++) {
      const v = vis[i];
      if (v.kind === 'block') {
        const b = v.o;
        const fade = clamp(1.15 - v.z / 200, 0.25, 0.9);
        strokeEdges(b.edges, b.x, b.z, 0, DIMG, fade, 1.25);
      } else if (v.kind === 'enemy') {
        const e = v.o;
        let rgb = e.hitFlash > 0 ? WHT : (KIND_RGB[e.kind] || LIME);
        const fade = clamp(1.2 - v.z / 180, 0.35, 1);
        const edges = e.kind === 'missile' ? MISS_EDGES : e.kind === 'super' ? SUPER_EDGES : TANK_EDGES;
        const lw = clamp(1.15 + 10 / Math.max(4, v.z), 1.15, 2.5);
        strokeEdges(edges, e.x, e.z, e.ang, rgb, fade, lw);
      } else if (v.kind === 'shot') {
        const s = v.o;
        const rgb = s.from === 'p' ? WHT : MAG;
        strokeEdges(SHELL_EDGES, s.x, s.z, s.ang, rgb, 0.95, 1.5);
        const p = project(s.x, 1.72, s.z);
        if (p) {
          ctx.beginPath();
          ctx.arc(sx(p.x), sy(p.y), Math.max(1.4, 3.2 * p.inv * 8) * scale, 0, TAU);
          ctx.fillStyle = rgba(rgb, 0.55);
          ctx.fill();
        }
      } else if (v.kind === 'shard') {
        const s = v.o;
        const p1 = project(s.x, s.y, s.z);
        const p2 = project(s.x + s.lx, s.y + s.ly, s.z + s.lz);
        if (!p1 || !p2) continue;
        ctx.beginPath();
        ctx.moveTo(sx(p1.x), sy(p1.y));
        ctx.lineTo(sx(p2.x), sy(p2.y));
        ctx.strokeStyle = rgba(s.rgb, clamp(s.life * 2.2, 0, 1));
        ctx.lineWidth = Math.max(1, 1.3 * scale);
        ctx.stroke();
      }
    }
  }

  function drawFx() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / 0.42;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (12 + t * 46) * scale, 0, TAU);
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - t));
      ctx.lineWidth = Math.max(1, (2.2 - t) * scale);
      ctx.stroke();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.28;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(s.rgb, 0.55 * (1 - t));
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (16 - t * 8) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fillRect(sx(p.x) - p.r * scale * 0.5, sy(p.y) - p.r * scale * 0.5, p.r * scale, p.r * scale);
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = '700 ' + Math.max(11, 14 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawSight() {
    const rgb = G.sight ? GOLD : LIME;
    const a = G.sight ? 0.95 : 0.62;
    const w = 34;
    const h = 24;
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = Math.max(1, 1.4 * scale);
    ctx.strokeRect(sx(CX - w), sy(SIGHT_Y - h), w * 2 * scale, h * 2 * scale);
    ctx.beginPath();
    ctx.moveTo(sx(CX), sy(SIGHT_Y - h - 8));
    ctx.lineTo(sx(CX), sy(SIGHT_Y - h));
    ctx.moveTo(sx(CX), sy(SIGHT_Y + h));
    ctx.lineTo(sx(CX), sy(SIGHT_Y + h + 8));
    ctx.moveTo(sx(CX - w - 8), sy(SIGHT_Y));
    ctx.lineTo(sx(CX - w), sy(SIGHT_Y));
    ctx.moveTo(sx(CX + w), sy(SIGHT_Y));
    ctx.lineTo(sx(CX + w + 8), sy(SIGHT_Y));
    ctx.stroke();
    if (G.muzzle > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, G.muzzle * 3.2);
      ctx.beginPath();
      ctx.arc(sx(CX), sy(SIGHT_Y + 4), 18 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    const rec = G.recoil * 10;
    const by = dashY() - 8 + rec;
    ctx.beginPath();
    ctx.moveTo(sx(CX - 26), sy(by));
    ctx.lineTo(sx(CX - 10), sy(SIGHT_Y + 42 + rec));
    ctx.lineTo(sx(CX + 10), sy(SIGHT_Y + 42 + rec));
    ctx.lineTo(sx(CX + 26), sy(by));
    ctx.strokeStyle = rgba(LIME, 0.7);
    ctx.lineWidth = Math.max(1, 1.4 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(CX - 6), sy(SIGHT_Y + 42 + rec));
    ctx.lineTo(sx(CX), sy(SIGHT_Y + 20 + rec));
    ctx.lineTo(sx(CX + 6), sy(SIGHT_Y + 42 + rec));
    ctx.stroke();
  }

  function drawFrame() {
    ctx.fillStyle = '#050806';
    ctx.fillRect(sx(0), sy(0), VW * scale, 18 * scale);
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(0));
    ctx.lineTo(sx(48), sy(18));
    ctx.lineTo(sx(10), sy(dashY()));
    ctx.lineTo(sx(0), sy(dashY()));
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx(VW), sy(0));
    ctx.lineTo(sx(VW - 48), sy(18));
    ctx.lineTo(sx(VW - 10), sy(dashY()));
    ctx.lineTo(sx(VW), sy(dashY()));
    ctx.closePath();
    ctx.fill();
    windowPath();
    ctx.strokeStyle = rgba(LIME, 0.45);
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();
  }

  function drawDash() {
    ctx.fillStyle = '#070b05';
    ctx.fillRect(sx(0), sy(dashY()), VW * scale, DASH * scale);
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(dashY()));
    ctx.lineTo(sx(VW), sy(dashY()));
    ctx.strokeStyle = rgba(LIME, 0.35);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.stroke();

    const rc = radC();
    ctx.beginPath();
    ctx.arc(sx(rc.x), sy(rc.y), (rc.r + 4) * scale, 0, TAU);
    ctx.fillStyle = '#040702';
    ctx.fill();
    ctx.strokeStyle = rgba(LIME, 0.7);
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(rc.x), sy(rc.y), rc.r * scale, 0, TAU);
    ctx.strokeStyle = rgba(DIMG, 0.5);
    ctx.lineWidth = Math.max(1, 1 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(rc.x), sy(rc.y), rc.r * 0.5 * scale, 0, TAU);
    ctx.strokeStyle = rgba(DIMG, 0.28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(rc.x - rc.r), sy(rc.y));
    ctx.lineTo(sx(rc.x + rc.r), sy(rc.y));
    ctx.moveTo(sx(rc.x), sy(rc.y - rc.r));
    ctx.lineTo(sx(rc.x), sy(rc.y + rc.r));
    ctx.strokeStyle = rgba(DIMG, 0.22);
    ctx.stroke();

    const sweep = G.sweep;
    ctx.save();
    ctx.beginPath();
    ctx.arc(sx(rc.x), sy(rc.y), rc.r * scale, 0, TAU);
    ctx.clip();
    ctx.translate(sx(rc.x), sy(rc.y));
    ctx.rotate(-sweep);
    const grd = ctx.createLinearGradient(0, 0, 0, -rc.r * scale);
    grd.addColorStop(0, rgba(CYN, 0.0));
    grd.addColorStop(1, rgba(CYN, 0.22));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, rc.r * scale, -0.55, 0.02);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -rc.r * scale);
    ctx.strokeStyle = rgba(CYN, 0.65);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    ctx.stroke();
    ctx.restore();

    const k = (rc.r - 5) / RADAR_RANGE;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dx = wrapD(e.x - G.px);
      const dz = wrapD(e.z - G.pz);
      const d = hypot(dx, dz);
      if (d > RADAR_RANGE) continue;
      const rx = dx * G.cosA - dz * G.sinA;
      const rz = dx * G.sinA + dz * G.cosA;
      const x = rc.x + rx * k;
      const y = rc.y - rz * k;
      const rgb = KIND_RGB[e.kind] || LIME;
      const r = (e.kind === 'missile' ? 2.4 : 3.1) + e.blip * 2.4;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), r * scale, 0, TAU);
      ctx.fillStyle = rgba(rgb, 0.55 + e.blip * 0.45);
      ctx.fill();
      if (e.blip > 0.2) {
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), (r + 4) * scale, 0, TAU);
        ctx.strokeStyle = rgba(rgb, e.blip);
        ctx.lineWidth = Math.max(1, 1.1 * scale);
        ctx.stroke();
      }
    }
    ctx.beginPath();
    ctx.moveTo(sx(rc.x), sy(rc.y - 7));
    ctx.lineTo(sx(rc.x - 5), sy(rc.y + 5));
    ctx.lineTo(sx(rc.x + 5), sy(rc.y + 5));
    ctx.closePath();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fill();

    const showPad = COARSE || Object.keys(ptrs).length > 0;
    const pl = padL();
    const pf = padF();
    const pa = showPad ? 0.55 : 0.22;
    ctx.beginPath();
    ctx.arc(sx(pl.x), sy(pl.y), pl.r * scale, 0, TAU);
    ctx.strokeStyle = rgba(LIME, pa);
    ctx.lineWidth = Math.max(1, 1.3 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(pl.x), sy(pl.y), 8 * scale, 0, TAU);
    ctx.fillStyle = rgba(LIME, pa * 0.5);
    ctx.fill();
    ctx.fillStyle = rgba(LIME, pa * 0.9);
    ctx.font = '600 ' + Math.max(9, 11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('驾驶', sx(pl.x), sy(pl.y + 28));

    ctx.beginPath();
    ctx.arc(sx(pf.x), sy(pf.y), pf.r * scale, 0, TAU);
    ctx.strokeStyle = rgba(GOLD, pa);
    ctx.fillStyle = rgba(GOLD, pa * 0.08);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, pa * 0.95);
    ctx.font = '700 ' + Math.max(11, 13 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('开火', sx(pf.x), sy(pf.y));

    const st = readStick();
    if (st.x || st.y) {
      ctx.beginPath();
      ctx.arc(sx(pl.x + st.x * 22), sy(pl.y - st.y * 22), 7 * scale, 0, TAU);
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fill();
    }
  }

  function drawFlash() {
    if (G.invuln > 0 && G.mode === 'play' && ((G.clock * 10) | 0) % 2 === 0) {
      ctx.fillStyle = 'rgba(176,240,25,0.05)';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.5);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawLetterbox() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#050806';
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, H - oy, W, oy + 1);
    }
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(W - ox, 0, ox + 1, H);
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#050806';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake);
      shy = rand(-G.shake, G.shake);
    }
    ctx.translate(W * 0.5 + shx, H * 0.5 + shy);
    const punch = REDUCE ? 1 : G.punch;
    ctx.scale(punch, punch);
    ctx.translate(-W * 0.5, -H * 0.5);

    ctx.save();
    windowPath();
    ctx.clip();
    drawSky();
    drawMountains();
    collectVis();
    drawVis();
    drawFx();
    drawSight();
    ctx.restore();

    drawFrame();
    drawDash();
    drawFlash();
    ctx.restore();
    drawLetterbox();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const r = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function eventToVirtual(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('camp');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) e.preventDefault();
      return;
    }
    if (space) {
      if (down) e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      startGame('camp');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('raid');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fire();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      const v = eventToVirtual(e);
      let role = classifyPtr(v.x, v.y);
      if (role === 'radar') role = 'view';
      ptrs[e.pointerId] = { x: v.x, y: v.y, role: role };
      if (G.mode === 'play') {
        if (role === 'fire' || role === 'view') {
          G.fireHold = true;
          fire();
        }
      }
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const v = eventToVirtual(e);
      if (ptrs[e.pointerId]) {
        ptrs[e.pointerId].x = v.x;
        ptrs[e.pointerId].y = v.y;
      }
    });
    function up(e) {
      delete ptrs[e.pointerId];
      let hold = false;
      const ids = Object.keys(ptrs);
      for (let i = 0; i < ids.length; i++) {
        if (ptrs[ids[i]] && ptrs[ids[i]].role === 'fire') hold = true;
      }
      if (!hold) G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now * 0.001;
      return;
    }
    const t = now * 0.001;
    if (!last) last = t;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    draw();
    if (((G.clock * 8) | 0) !== hudN) {
      hudN = (G.clock * 8) | 0;
      syncHud();
    }
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  seedMountains();
  seedBlocks();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnCamp) {
    btnCamp.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('camp');
    });
  }
  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('raid');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = false;
      keys.r = false;
      keys.u = false;
      keys.d = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
