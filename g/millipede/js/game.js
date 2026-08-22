'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const COLS = 20;
  const ROWS = 30;
  const CELL = 24;
  const LIVES = 3;
  const PLAYER_ROW = 24;
  const ZONE_TOP = PLAYER_ROW * CELL;
  const SHOT_V = 740;
  const SHIP_R = 11;
  const SHIP_SPD = 290;
  const COMBO_WIN = 1.32;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const DDT_R = CELL * 2.45;
  const BEST_KEY = 'playbox-millipede-best';
  const MUTE_KEY = 'playbox-millipede-mute';
  const OPS = '← → ↑ ↓ / WASD 移动 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 200];
  const GOLD = [255, 227, 107];
  const MINT = [42, 224, 58];
  const LEAF = [20, 196, 74];
  const HOT = [122, 255, 107];
  const WHT = [232, 255, 233];
  const DDT_C = [255, 225, 74];
  const BEE_C = [255, 186, 74];
  const EAR_C = [255, 132, 64];
  const INCH_C = [80, 230, 255];
  const STEM = [46, 120, 62];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnGrove = document.getElementById('btn-grove');
  const btnTide = document.getElementById('btn-tide');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: ZONE_TOP + 72, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const chips = [];
  const booms = [];
  const stings = [];
  const motes = [];

  const G = {
    mode: 'title',
    kind: 'grove',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: 12000,
    mush: null,
    ddts: [],
    chains: [],
    pending: [],
    spiders: [],
    bees: [],
    earwigs: [],
    inch: null,
    ship: { x: VW * 0.5, y: ZONE_TOP + 88 },
    shot: null,
    spiderT: 4,
    beeT: 6,
    earT: 9,
    inchT: 12,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    toastT: 0,
    why: '',
    muzzle: 0,
    fireHold: false,
    slowT: 0,
    pendingBoom: [],
    lastWarn: 0
  };

  let inputSrc = 'key';

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function irand(a, b) {
    return (a + Math.random() * (b - a + 1)) | 0;
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
  function isTide() {
    return G.kind === 'tide';
  }
  function cellX(c) {
    return (c + 0.5) * CELL;
  }
  function cellY(r) {
    return (r + 0.5) * CELL;
  }
  function colAt(x) {
    return clamp((x / CELL) | 0, 0, COLS - 1);
  }
  function rowAt(y) {
    return clamp((y / CELL) | 0, 0, ROWS - 1);
  }
  function gi(c, r) {
    return r * COLS + c;
  }
  function mushAt(c, r) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return 0;
    return G.mush[gi(c, r)] | 0;
  }
  function setMush(c, r, hp) {
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return;
    G.mush[gi(c, r)] = hp < 0 ? 0 : hp;
  }
  function ddtAt(c, r) {
    for (let i = 0; i < G.ddts.length; i++) {
      const d = G.ddts[i];
      if (d.live && d.c === c && d.r === r) return d;
    }
    return null;
  }
  function inGrid(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
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
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
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
      this.beep(980, 0.05, 'square', 0.028, 1880);
    },
    mushChip() {
      this.ensure();
      this.noise(0.03, 0.026, 1600);
      this.beep(320, 0.04, 'square', 0.02, 140);
    },
    mushPop() {
      this.ensure();
      this.noise(0.05, 0.04, 900);
      this.beep(420, 0.07, 'triangle', 0.034, 180);
    },
    body() {
      this.ensure();
      this.noise(0.032, 0.034, 1100);
      this.beep(520, 0.07, 'square', 0.042, 780);
    },
    head() {
      this.ensure();
      this.noise(0.045, 0.04, 800);
      this.beep(740, 0.09, 'square', 0.046, 1180);
    },
    split() {
      this.ensure();
      this.beep(392, 0.06, 'sawtooth', 0.036, 220);
      this.beep(880, 0.1, 'triangle', 0.032, 1320);
    },
    spider() {
      this.ensure();
      this.noise(0.07, 0.046, 600);
      this.beep(280, 0.1, 'sawtooth', 0.04, 120);
      this.beep(990, 0.12, 'square', 0.03, 1480);
    },
    sting() {
      this.ensure();
      this.noise(0.12, 0.055, 420);
      this.beep(880, 0.08, 'square', 0.05, 220);
      this.beep(180, 0.22, 'sawtooth', 0.048, 55);
    },
    boom() {
      this.ensure();
      this.noise(0.18, 0.07, 280);
      this.beep(140, 0.22, 'sawtooth', 0.055, 48);
      this.beep(420, 0.12, 'triangle', 0.04, 90);
    },
    bee() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.034, 990);
      this.noise(0.03, 0.028, 1400);
    },
    earwig() {
      this.ensure();
      this.beep(210, 0.1, 'sawtooth', 0.038, 90);
      this.beep(540, 0.08, 'triangle', 0.03, 320);
    },
    inch() {
      this.ensure();
      this.beep(180, 0.16, 'sine', 0.04, 90);
      this.beep(360, 0.2, 'triangle', 0.034, 180);
    },
    crawl(n) {
      this.ensure();
      const f = 90 + Math.min(80, n * 4);
      this.beep(f, 0.04, 'square', 0.016, 0);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.036, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.026, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.052, 380);
      this.beep(300, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.044, 48);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.038, 523);
      this.beep(523, 0.11, 'sine', 0.038, 659);
      this.beep(784, 0.2, 'triangle', 0.042, 1046);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.036, 440);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      const n = parseInt(raw, 10);
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
    saveBest();
    while (G.score >= G.next1up) {
      G.next1up += 12000;
      if (G.lives < 6) {
        G.lives += 1;
        audio.extra();
        toast('1UP', false, true);
      }
    }
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      scoreAdd.style.animation = 'none';
      void scoreAdd.offsetWidth;
      scoreAdd.style.animation = '';
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    G.toastT = 1.15;
    toastTok += 1;
    const tok = toastTok;
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
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const s = document.createElement('span');
      s.className = 'pip';
      pipsEl.appendChild(s);
      pips.push(s);
    }
    for (let i = 0; i < pips.length; i++) {
      if (i >= n) {
        pips[i].style.display = 'none';
        continue;
      }
      pips[i].style.display = '';
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function countSegs() {
    let n = 0;
    for (let i = 0; i < G.chains.length; i++) n += G.chains[i].segs.length;
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.wave >= 5);
    }
    if (tagLabel) {
      let tag = isTide() ? '虫潮' : '菌林';
      let cls = isTide() ? 'warn' : '';
      if (G.mode === 'play' && G.slowT > 0) {
        tag = '蠕行';
        cls = 'hot';
      } else if (G.mode === 'play' && G.spiders.length) {
        tag = '蜘蛛';
        cls = 'warn';
      } else if (G.mode === 'play' && countSegs() > 0 && countSegs() <= 3) {
        tag = countSegs() === 1 ? '最后' : '收网';
        cls = 'warn';
      }
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', cls === 'warn');
      tagLabel.classList.toggle('hot', cls === 'hot');
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.combo + ' 连 ×' + G.mult;
        comboEl.classList.add('combo');
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint('方向键移动 · 空格开火 · 打节即断 · DDT 炸半径', '');
    else if (G.mode === 'lose') setHint('R 重开 · 顶栏随时可用', 'warn');
    else if (isTide()) setHint('虫潮 · 蜘蛛更快更密 · 底栏小心', 'warn');
    else setHint('方向键移动 · 空格开火 · 打节即断 · DDT 炸半径', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'MILL';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (btnGrove) btnGrove.textContent = primary;
    if (btnTide) {
      btnTide.textContent = secondary;
      btnTide.classList.remove('hidden');
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
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : mag >= 4 ? 'cap' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('cap');
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
    const count = REDUCE ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 220,
        life: rand(0.22, 0.52),
        max: 0.52,
        r: rand(1.2, 2.8),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 180);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 14);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.72, vy: -48, text: text, rgb: rgb });
    capArr(floats, 18);
  }

  function chipBurst(x, y, n, rgb) {
    const count = REDUCE ? Math.min(4, n) : n;
    const col = rgb || LEAF;
    for (let i = 0; i < count; i++) {
      chips.push({
        x: x + rand(-3, 3),
        y: y + rand(-2, 2),
        vx: rand(-80, 80),
        vy: rand(-110, -20),
        life: rand(0.28, 0.55),
        max: 0.55,
        rgb: Math.random() < 0.3 ? MINT : col,
        s: rand(1.4, 2.8)
      });
    }
    capArr(chips, 90);
  }

  function boomFx(x, y) {
    booms.push({ x: x, y: y, t: 0, life: 0.42 });
    capArr(booms, 8);
  }

  function stingFx(x, y) {
    for (let i = 0; i < 6; i++) {
      stings.push({
        x: x, y: y, t: 0,
        ang: rand(0, TAU),
        len: rand(18, 36)
      });
    }
    capArr(stings, 18);
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.7 ? 0.7 : 1.2,
        a: rand(0.18, 0.7),
        p: rand(0, TAU),
        v: rand(4, 22),
        rgb: Math.random() < 0.22 ? MINT : Math.random() < 0.12 ? GOLD : WHT
      });
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(next);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    } else {
      G.mult = next;
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
  }

  function slowFactor() {
    if (G.inch || G.slowT > 0) return 0.5;
    return 1;
  }

  function circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < cr * cr;
  }

  function solidAt(c, r) {
    return mushAt(c, r) > 0 || !!ddtAt(c, r);
  }

  function blockedHoriz(c, r) {
    if (c < 0 || c >= COLS) return true;
    if (r < 0 || r >= ROWS) return true;
    return solidAt(c, r);
  }

  function playerBlocked(x, y) {
    const rad = SHIP_R - 1;
    const c0 = Math.floor((x - rad) / CELL);
    const c1 = Math.floor((x + rad) / CELL);
    const r0 = Math.floor((y - rad) / CELL);
    const r1 = Math.floor((y + rad) / CELL);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (!inGrid(c, r)) continue;
        if (!solidAt(c, r)) continue;
        if (circleRect(x, y, rad, c * CELL + 2, r * CELL + 2, CELL - 4, CELL - 4)) return true;
      }
    }
    return false;
  }

  function placeMushroom(c, r, hp) {
    if (!inGrid(c, r)) return false;
    if (r >= PLAYER_ROW && Math.random() < 0.35) return false;
    if (ddtAt(c, r)) return false;
    if (mushAt(c, r) > 0) return false;
    setMush(c, r, hp == null ? 4 : hp);
    return true;
  }

  function scatterMushrooms(n) {
    let placed = 0;
    let guard = 0;
    while (placed < n && guard < 500) {
      guard += 1;
      const c = irand(0, COLS - 1);
      const r = irand(1, PLAYER_ROW - 3);
      if (solidAt(c, r)) continue;
      setMush(c, r, 4);
      placed += 1;
    }
  }

  function placeDdts(n) {
    G.ddts = [];
    let guard = 0;
    while (G.ddts.length < n && guard < 200) {
      guard += 1;
      const c = irand(1, COLS - 2);
      const r = irand(3, 16);
      if (solidAt(c, r)) continue;
      let far = true;
      for (let i = 0; i < G.ddts.length; i++) {
        const d = G.ddts[i];
        if (Math.abs(d.c - c) + Math.abs(d.r - r) < 5) far = false;
      }
      if (!far) continue;
      G.ddts.push({ c: c, r: r, live: true });
    }
  }

  function makeChain(n, dir, row) {
    const segs = [];
    const d = dir || 1;
    const r = row == null ? 0 : row;
    for (let i = 0; i < n; i++) {
      const c = d > 0 ? (n - 1 - i) : (COLS - n + i);
      segs.push({
        c: clamp(c, 0, COLS - 1),
        r: r,
        x: cellX(clamp(c, 0, COLS - 1)),
        y: cellY(r),
        head: i === 0
      });
    }
    return { segs: segs, dir: d, drop: 1, wait: 0, step: millInterval() };
  }

  function spawnHead(dir, row) {
    const d = dir || (Math.random() < 0.5 ? 1 : -1);
    const r = row == null ? irand(0, 3) : row;
    const c = d > 0 ? 0 : COLS - 1;
    const x = d > 0 ? -CELL : VW + CELL;
    G.chains.push({
      segs: [{ c: c, r: r, x: x, y: cellY(r), head: true }],
      dir: d,
      drop: 1,
      wait: 0,
      step: millInterval()
    });
  }

  function millInterval() {
    const segs = Math.max(1, countSegs());
    const tide = isTide() ? 0.92 : 1;
    const wave = Math.max(0.62, 1 - (G.wave - 1) * 0.045);
    let t = (0.118 - Math.min(0.04, segs * 0.0018)) * wave * tide;
    return Math.max(0.044, t);
  }

  function spawnMillipede() {
    G.chains = [];
    G.pending = [];
    const n = Math.max(4, 12 - (G.wave - 1));
    const extra = Math.min(G.wave - 1, 7);
    const dir = G.wave % 2 === 0 ? -1 : 1;
    G.chains.push(makeChain(n, dir, 0));
    for (let i = 0; i < extra; i++) {
      G.pending.push({
        t: 2.2 + i * 1.65,
        r: i % 3,
        dir: i % 2 === 0 ? -dir : dir
      });
    }
  }

  function resetField() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    chips.length = 0;
    booms.length = 0;
    stings.length = 0;
    G.mush = new Uint8Array(COLS * ROWS);
    const nMush = isTide() ? 18 + G.wave * 2 : 30 + G.wave * 2;
    scatterMushrooms(Math.min(52, nMush));
    placeDdts(4);
    spawnMillipede();
    G.spiders = [];
    G.bees = [];
    G.earwigs = [];
    G.inch = null;
    G.pendingBoom = [];
    G.ship.x = VW * 0.5;
    G.ship.y = ZONE_TOP + 88;
    G.shot = null;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.deadT = 0;
    G.invuln = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.fireHold = false;
    G.slowT = 0;
    G.lastWarn = 0;
    G.spiderT = isTide() ? rand(2.2, 3.8) : rand(4.5, 7.5);
    G.beeT = rand(5, 8);
    G.earT = rand(7, 11);
    G.inchT = rand(10, 14);
  }

  function spawnSpider() {
    const fromL = Math.random() < 0.5;
    const spd = (isTide() ? rand(210, 268) : rand(128, 168)) * (1 + Math.min(0.35, (G.wave - 1) * 0.06));
    G.spiders.push({
      x: fromL ? -16 : VW + 16,
      y: rand(ZONE_TOP + 28, VH - 36),
      vx: (fromL ? 1 : -1) * spd,
      vy: rand(-150, 150) * (isTide() ? 1.25 : 1),
      r: 11,
      life: isTide() ? rand(5.5, 8) : rand(6.5, 9.5),
      hop: rand(0, TAU)
    });
  }

  function spawnBee() {
    const x = rand(24, VW - 24);
    G.bees.push({
      x: x,
      y: -12,
      vx: rand(-40, 40),
      vy: rand(150, 210) + G.wave * 8,
      phase: rand(0, TAU),
      r: 8,
      drop: 0
    });
  }

  function spawnEarwig() {
    const fromL = Math.random() < 0.5;
    const r = irand(2, 12);
    G.earwigs.push({
      x: fromL ? -18 : VW + 18,
      y: cellY(r),
      vx: (fromL ? 1 : -1) * rand(70, 100),
      r: 10,
      acc: 0,
      row: r
    });
  }

  function spawnInch() {
    const fromL = Math.random() < 0.5;
    const r = irand(4, 14);
    G.inch = {
      x: fromL ? -22 : VW + 22,
      y: cellY(r),
      vx: (fromL ? 1 : -1) * 48,
      r: 12
    };
    toast('蠕行', false, true);
    audio.inch();
  }

  function popMushroom(c, r, scored, quiet) {
    const hp = mushAt(c, r);
    if (hp <= 0) return false;
    const x = cellX(c);
    const y = cellY(r);
    setMush(c, r, 0);
    chipBurst(x, y, quiet ? 4 : 8, MINT);
    burst(x, y, LEAF, quiet ? 4 : 8, 140);
    if (!quiet) {
      audio.mushPop();
      hitStop(0.038);
      kick(1.6);
    }
    if (scored) {
      const pts = Math.round(5 * G.mult);
      addScore(pts);
      bumpCombo();
    }
    return true;
  }

  function chipMushroom(c, r, scored) {
    const hp = mushAt(c, r);
    if (hp <= 0) return false;
    const x = cellX(c);
    const y = cellY(r);
    if (hp <= 1) return popMushroom(c, r, scored);
    setMush(c, r, hp - 1);
    chipBurst(x, y, 3, LEAF);
    audio.mushChip();
    hitStop(0.028);
    if (scored) {
      addScore(1);
      bumpCombo();
    }
    return true;
  }

  function award(x, y, base, rgb, stop, kickMag) {
    const pts = Math.round(base * G.mult);
    if (G.mode === 'play') {
      addScore(pts);
      bumpCombo();
    }
    floatText(x, y - 8, String(pts), rgb || GOLD);
    if (stop > 0) hitStop(stop);
    if (kickMag > 0) kick(kickMag);
    return pts;
  }

  function shootSeg(ci, si) {
    const ch = G.chains[ci];
    if (!ch || si < 0 || si >= ch.segs.length) return;
    const s = ch.segs[si];
    const wasHead = s.head || si === 0;
    const x = s.x;
    const y = s.y;
    if (!ddtAt(s.c, s.r)) setMush(s.c, s.r, 4);
    const tail = ch.segs.splice(si);
    tail.shift();
    if (ch.segs.length === 0) G.chains.splice(ci, 1);
    else ch.segs[0].head = true;
    const split = tail.length > 0;
    if (split) {
      tail[0].head = true;
      G.chains.push({
        segs: tail,
        dir: si === 0 ? ch.dir : -ch.dir,
        drop: ch.drop,
        wait: 0.02,
        step: millInterval()
      });
    }
    burst(x, y, wasHead ? GOLD : MINT, wasHead ? 16 : 11, wasHead ? 210 : 160);
    spark(x, y, wasHead ? GOLD : HOT);
    if (split) {
      ring(x, y, CYN);
      audio.split();
      hitStop(0.07);
      kick(3.4);
    } else if (wasHead) {
      ring(x, y, GOLD);
      audio.head();
      hitStop(0.05);
      kick(2.6);
    } else {
      audio.body();
      hitStop(0.042);
      kick(2);
    }
    award(x, y, wasHead ? 100 : 10, wasHead ? GOLD : MINT, 0, 0);
    const left = countSegs();
    if (left === 1 && G.lastWarn < 2) {
      G.lastWarn = 2;
      toast('最后一节', true, false);
    } else if (left <= 3 && left > 0 && G.lastWarn < 1) {
      G.lastWarn = 1;
      toast('收网', true, false);
    }
  }

  function pruneRadius(cx, cy, rad) {
    const r2 = rad * rad;
    const next = [];
    for (let i = 0; i < G.chains.length; i++) {
      const ch = G.chains[i];
      let buf = [];
      const flush = function () {
        if (!buf.length) return;
        buf[0].head = true;
        for (let k = 1; k < buf.length; k++) buf[k].head = false;
        next.push({
          segs: buf,
          dir: ch.dir,
          drop: ch.drop,
          wait: 0,
          step: millInterval()
        });
        buf = [];
      };
      for (let s = 0; s < ch.segs.length; s++) {
        const seg = ch.segs[s];
        const dx = seg.x - cx;
        const dy = seg.y - cy;
        if (dx * dx + dy * dy <= r2) {
          if (!ddtAt(seg.c, seg.r)) setMush(seg.c, seg.r, 4);
          burst(seg.x, seg.y, MINT, 8, 150);
          award(seg.x, seg.y, seg.head ? 100 : 10, GOLD, 0, 0);
          flush();
        } else {
          buf.push(seg);
        }
      }
      flush();
    }
    G.chains = next;
  }

  function explodeDdt(d, chained) {
    if (!d || !d.live) return;
    d.live = false;
    const x = cellX(d.c);
    const y = cellY(d.r);
    boomFx(x, y);
    burst(x, y, DDT_C, 28, 280);
    burst(x, y, MAG, 12, 200);
    spark(x, y, GOLD);
    ring(x, y, DDT_C);
    audio.boom();
    hitStop(chained ? 0.055 : 0.08);
    kick(chained ? 5 : 8);
    screenFlash(DDT_C, chained ? 0.32 : 0.5);
    if (G.mode === 'play') {
      addScore(Math.round(800 * G.mult));
      bumpCombo();
      floatText(x, y - 12, String(Math.round(800 * G.mult)), GOLD);
    }
    const rad = DDT_R;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (mushAt(c, r) <= 0) continue;
        const dx = cellX(c) - x;
        const dy = cellY(r) - y;
        if (dx * dx + dy * dy <= rad * rad) popMushroom(c, r, true, true);
      }
    }
    pruneRadius(x, y, rad);
    for (let i = G.spiders.length - 1; i >= 0; i--) {
      const sp = G.spiders[i];
      const dx = sp.x - x;
      const dy = sp.y - y;
      if (dx * dx + dy * dy <= rad * rad) {
        burst(sp.x, sp.y, MAG, 14, 200);
        award(sp.x, sp.y, 300, MAG, 0.04, 2);
        G.spiders.splice(i, 1);
      }
    }
    for (let i = G.bees.length - 1; i >= 0; i--) {
      const b = G.bees[i];
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy <= rad * rad) {
        burst(b.x, b.y, BEE_C, 10, 180);
        award(b.x, b.y, 200, BEE_C, 0.03, 1.5);
        G.bees.splice(i, 1);
      }
    }
    for (let i = G.earwigs.length - 1; i >= 0; i--) {
      const e = G.earwigs[i];
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy <= rad * rad) {
        burst(e.x, e.y, EAR_C, 10, 160);
        award(e.x, e.y, 200, EAR_C, 0.03, 1.5);
        G.earwigs.splice(i, 1);
      }
    }
    if (G.inch) {
      const dx = G.inch.x - x;
      const dy = G.inch.y - y;
      if (dx * dx + dy * dy <= rad * rad) {
        burst(G.inch.x, G.inch.y, INCH_C, 12, 150);
        award(G.inch.x, G.inch.y, 150, INCH_C, 0.04, 2);
        G.slowT = Math.max(G.slowT, 2.1);
        G.inch = null;
      }
    }
    for (let i = 0; i < G.ddts.length; i++) {
      const o = G.ddts[i];
      if (!o.live) continue;
      const dx = cellX(o.c) - x;
      const dy = cellY(o.r) - y;
      if (dx * dx + dy * dy <= rad * rad) {
        G.pendingBoom.push({ t: 0.08, d: o });
      }
    }
  }

  function fire() {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    if (G.shot) return;
    G.shot = { x: G.ship.x, y: G.ship.y - 14, vy: -SHOT_V };
    G.muzzle = 0.09;
    audio.shoot();
    if (!REDUCE) {
      for (let i = 0; i < 4; i++) {
        particles.push({
          x: G.ship.x + rand(-3, 3),
          y: G.ship.y - 12,
          vx: rand(-20, 20),
          vy: rand(-80, -20),
          g: 40,
          life: 0.16,
          max: 0.16,
          r: 1.4,
          rgb: i % 2 ? CYN : WHT
        });
      }
    }
  }

  function killPlayer(why, sting) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0 || G.invuln > 0) return;
    G.why = why || '被咬了';
    G.lives -= 1;
    G.deadT = 0.9;
    G.shot = null;
    G.fireHold = false;
    breakCombo();
    burst(G.ship.x, G.ship.y, CYN, 20, 250);
    burst(G.ship.x, G.ship.y, MAG, 10, 180);
    spark(G.ship.x, G.ship.y, WHT);
    ring(G.ship.x, G.ship.y, MAG);
    if (sting) {
      stingFx(G.ship.x, G.ship.y);
      audio.sting();
    } else {
      audio.death();
    }
    hitStop(0.072);
    kick(7);
    screenFlash(MAG, 0.48);
  }

  function stepChain(ch) {
    if (!ch.segs.length) return;
    const h = ch.segs[0];
    let nc = h.c + ch.dir;
    let nr = h.r;
    if (blockedHoriz(nc, nr)) {
      nr = h.r + ch.drop;
      nc = h.c;
      ch.dir *= -1;
      if (nr >= ROWS) {
        ch.drop = -1;
        nr = h.r - 1;
      } else if (nr < 0) {
        ch.drop = 1;
        nr = h.r + 1;
      }
      if (h.r >= PLAYER_ROW && nr < PLAYER_ROW) {
        ch.drop = 1;
        nr = h.r + 1;
        if (nr >= ROWS) nr = ROWS - 1;
      }
      if (nr < 0) nr = 0;
      if (nr >= ROWS) nr = ROWS - 1;
    }
    for (let i = ch.segs.length - 1; i > 0; i--) {
      ch.segs[i].c = ch.segs[i - 1].c;
      ch.segs[i].r = ch.segs[i - 1].r;
      ch.segs[i].head = false;
    }
    h.c = nc;
    h.r = nr;
    h.head = true;
  }

  function updateChainVisual(ch, dt) {
    const dur = Math.max(0.04, ch.step || 0.1);
    const spd = (CELL / dur) * 1.08;
    for (let i = 0; i < ch.segs.length; i++) {
      const s = ch.segs[i];
      const tx = cellX(s.c);
      const ty = cellY(s.r);
      const dx = tx - s.x;
      const dy = ty - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= spd * dt) {
        s.x = tx;
        s.y = ty;
      } else {
        s.x += dx / dist * spd * dt;
        s.y += dy / dist * spd * dt;
      }
    }
  }

  function hitShotSeg(x, y) {
    const rad = 11;
    const r2 = rad * rad;
    for (let i = 0; i < G.chains.length; i++) {
      const ch = G.chains[i];
      for (let s = 0; s < ch.segs.length; s++) {
        const seg = ch.segs[s];
        const dx = seg.x - x;
        const dy = seg.y - y;
        if (dx * dx + dy * dy <= r2) return { i: i, s: s };
      }
    }
    return null;
  }

  function updateShot(dt) {
    if (!G.shot) return;
    G.shot.y += G.shot.vy * dt;
    const x = G.shot.x;
    const y = G.shot.y;
    if (y < -8) {
      G.shot = null;
      breakCombo();
      return;
    }
    const hit = hitShotSeg(x, y);
    if (hit) {
      G.shot = null;
      shootSeg(hit.i, hit.s);
      return;
    }
    for (let i = G.spiders.length - 1; i >= 0; i--) {
      const sp = G.spiders[i];
      const dx = sp.x - x;
      const dy = sp.y - y;
      if (dx * dx + dy * dy < (sp.r + 3) * (sp.r + 3)) {
        G.shot = null;
        const near = Math.abs(sp.x - G.ship.x) * 0.45 + Math.abs(sp.y - G.ship.y);
        const base = near < 42 ? 900 : near < 92 ? 600 : 300;
        burst(sp.x, sp.y, MAG, 18, 230);
        spark(sp.x, sp.y, MAG);
        ring(sp.x, sp.y, MAG);
        audio.spider();
        award(sp.x, sp.y, base, MAG, 0.06, 4);
        G.spiders.splice(i, 1);
        return;
      }
    }
    for (let i = G.bees.length - 1; i >= 0; i--) {
      const b = G.bees[i];
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy < (b.r + 3) * (b.r + 3)) {
        G.shot = null;
        burst(b.x, b.y, BEE_C, 12, 190);
        spark(b.x, b.y, GOLD);
        audio.bee();
        award(b.x, b.y, 200, BEE_C, 0.04, 2);
        G.bees.splice(i, 1);
        return;
      }
    }
    for (let i = G.earwigs.length - 1; i >= 0; i--) {
      const e = G.earwigs[i];
      if (Math.abs(e.x - x) < 14 && Math.abs(e.y - y) < 8) {
        G.shot = null;
        burst(e.x, e.y, EAR_C, 12, 170);
        audio.earwig();
        award(e.x, e.y, 200, EAR_C, 0.04, 2);
        G.earwigs.splice(i, 1);
        return;
      }
    }
    if (G.inch && Math.abs(G.inch.x - x) < 16 && Math.abs(G.inch.y - y) < 9) {
      G.shot = null;
      burst(G.inch.x, G.inch.y, INCH_C, 14, 150);
      ring(G.inch.x, G.inch.y, INCH_C);
      audio.inch();
      award(G.inch.x, G.inch.y, 150, INCH_C, 0.05, 2);
      G.slowT = Math.max(G.slowT, 2.2);
      toast('蠕行', false, true);
      G.inch = null;
      return;
    }
    const c = colAt(x);
    const r = rowAt(y);
    const d = ddtAt(c, r);
    if (d && d.live && Math.abs(x - cellX(c)) < 12 && Math.abs(y - cellY(r)) < 13) {
      G.shot = null;
      explodeDdt(d, false);
      return;
    }
    if (mushAt(c, r) > 0 && Math.abs(x - cellX(c)) < 11 && Math.abs(y - cellY(r)) < 11) {
      G.shot = null;
      chipMushroom(c, r, true);
    }
  }

  function tryMoveShip(nx, ny) {
    nx = clamp(nx, 16, VW - 16);
    ny = clamp(ny, ZONE_TOP + 14, VH - 18);
    if (!playerBlocked(nx, G.ship.y)) G.ship.x = nx;
    else {
      const sx0 = G.ship.x;
      const dir = nx > sx0 ? 1 : -1;
      for (let k = 0; k < 8; k++) {
        const t = sx0 + dir * 2;
        if (playerBlocked(t, G.ship.y)) break;
        G.ship.x = t;
      }
    }
    if (!playerBlocked(G.ship.x, ny)) G.ship.y = ny;
    else {
      const sy0 = G.ship.y;
      const dir = ny > sy0 ? 1 : -1;
      for (let k = 0; k < 8; k++) {
        const t = sy0 + dir * 2;
        if (playerBlocked(G.ship.x, t)) break;
        G.ship.y = t;
      }
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    let ax = 0;
    let ay = 0;
    if (inputSrc === 'key' || !pointer.hover && !pointer.down) {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax || ay) {
        const m = Math.sqrt(ax * ax + ay * ay) || 1;
        tryMoveShip(G.ship.x + ax / m * SHIP_SPD * dt, G.ship.y + ay / m * SHIP_SPD * dt);
      }
    }
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const tx = clamp(pointer.x, 16, VW - 16);
      const ty = clamp(pointer.y, ZONE_TOP + 14, VH - 18);
      const k = 1 - Math.pow(0.001, dt);
      tryMoveShip(lerp(G.ship.x, tx, k), lerp(G.ship.y, ty, k));
    }
  }

  function updateMillipede(dt) {
    const sf = slowFactor();
    for (let i = G.pending.length - 1; i >= 0; i--) {
      G.pending[i].t -= dt;
      if (G.pending[i].t <= 0) {
        spawnHead(G.pending[i].dir, G.pending[i].r);
        G.pending.splice(i, 1);
      }
    }
    for (let i = 0; i < G.chains.length; i++) {
      const ch = G.chains[i];
      ch.step = millInterval();
      ch.wait -= dt * sf;
      let guard = 0;
      while (ch.wait <= 0 && guard < 3) {
        guard += 1;
        stepChain(ch);
        ch.wait += ch.step;
        if (G.mode === 'play' && i === 0 && guard === 1) audio.crawl(countSegs());
      }
      updateChainVisual(ch, dt * sf);
    }
    for (let i = G.chains.length - 1; i >= 0; i--) {
      if (!G.chains[i].segs.length) G.chains.splice(i, 1);
    }
  }

  function updateSpiders(dt) {
    const sf = slowFactor();
    const maxSp = isTide() ? (G.wave >= 3 ? 2 : 1) : 1;
    G.spiderT -= dt;
    if (G.mode === 'play' && G.spiders.length < maxSp && G.spiderT <= 0) {
      spawnSpider();
      G.spiderT = isTide()
        ? rand(3.0, 5.2) / (1 + (G.wave - 1) * 0.08)
        : rand(7.2, 11.5) / (1 + (G.wave - 1) * 0.05);
    }
    for (let i = G.spiders.length - 1; i >= 0; i--) {
      const sp = G.spiders[i];
      sp.hop += dt * 9;
      sp.life -= dt;
      sp.x += sp.vx * dt * sf;
      sp.y += (sp.vy + Math.sin(sp.hop) * 70) * dt * sf;
      if (sp.x < 12) { sp.x = 12; sp.vx = Math.abs(sp.vx); }
      if (sp.x > VW - 12) { sp.x = VW - 12; sp.vx = -Math.abs(sp.vx); }
      if (sp.y < ZONE_TOP + 12) { sp.y = ZONE_TOP + 12; sp.vy = Math.abs(sp.vy); }
      if (sp.y > VH - 16) { sp.y = VH - 16; sp.vy = -Math.abs(sp.vy); }
      const c = colAt(sp.x);
      const r = rowAt(sp.y);
      if (mushAt(c, r) > 0 && Math.random() < dt * 4.5) {
        const hp = mushAt(c, r);
        if (hp <= 1) setMush(c, r, 0);
        else setMush(c, r, hp - 1);
        chipBurst(cellX(c), cellY(r), 2, MAG);
      }
      if (sp.life <= 0 && (sp.x < 8 || sp.x > VW - 8)) {
        G.spiders.splice(i, 1);
      }
    }
  }

  function updateBees(dt) {
    const sf = slowFactor();
    G.beeT -= dt;
    if (G.mode === 'play' && G.bees.length < (G.wave >= 4 ? 2 : 1) && G.beeT <= 0) {
      spawnBee();
      G.beeT = rand(6.5, 11) / (1 + (G.wave - 1) * 0.06);
    }
    for (let i = G.bees.length - 1; i >= 0; i--) {
      const b = G.bees[i];
      b.phase += dt * 10;
      b.x += (b.vx + Math.sin(b.phase) * 90) * dt * sf;
      b.y += b.vy * dt * sf;
      b.x = clamp(b.x, 10, VW - 10);
      b.drop += dt;
      if (b.drop > 0.22) {
        b.drop = 0;
        const c = colAt(b.x);
        const r = rowAt(b.y);
        if (r < PLAYER_ROW - 1) placeMushroom(c, r, 4);
      }
      if (b.y > VH + 16) G.bees.splice(i, 1);
    }
  }

  function updateEarwigs(dt) {
    const sf = slowFactor();
    G.earT -= dt;
    if (G.mode === 'play' && G.wave >= 2 && G.earwigs.length < 1 && G.earT <= 0) {
      spawnEarwig();
      G.earT = rand(9, 15);
    }
    for (let i = G.earwigs.length - 1; i >= 0; i--) {
      const e = G.earwigs[i];
      e.x += e.vx * dt * sf;
      e.acc += Math.abs(e.vx) * dt * sf;
      if (e.acc >= CELL) {
        e.acc = 0;
        placeMushroom(colAt(e.x), e.row, 4);
      }
      if (e.x < -28 || e.x > VW + 28) {
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            const hp = mushAt(c, r);
            if (hp > 0 && hp < 4) setMush(c, r, hp + 1);
          }
        }
        G.earwigs.splice(i, 1);
      }
    }
  }

  function updateInch(dt) {
    const sf = 1;
    G.inchT -= dt;
    if (G.mode === 'play' && G.wave >= 2 && !G.inch && G.inchT <= 0) {
      spawnInch();
      G.inchT = rand(13, 20);
    }
    if (!G.inch) return;
    G.inch.x += G.inch.vx * dt * sf;
    if (G.inch.x < -30 || G.inch.x > VW + 30) G.inch = null;
  }

  function playerHitCheck() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    const px = G.ship.x;
    const py = G.ship.y;
    const pr = SHIP_R - 1;
    for (let i = 0; i < G.chains.length; i++) {
      const ch = G.chains[i];
      for (let s = 0; s < ch.segs.length; s++) {
        const seg = ch.segs[s];
        const dx = seg.x - px;
        const dy = seg.y - py;
        if (dx * dx + dy * dy < (pr + 9) * (pr + 9)) {
          killPlayer('被千足咬了', false);
          return;
        }
      }
    }
    for (let i = 0; i < G.spiders.length; i++) {
      const sp = G.spiders[i];
      const dx = sp.x - px;
      const dy = sp.y - py;
      if (dx * dx + dy * dy < (pr + sp.r - 2) * (pr + sp.r - 2)) {
        killPlayer('蜘蛛蛰了', true);
        return;
      }
    }
    for (let i = 0; i < G.bees.length; i++) {
      const b = G.bees[i];
      const dx = b.x - px;
      const dy = b.y - py;
      if (dx * dx + dy * dy < (pr + b.r - 1) * (pr + b.r - 1)) {
        killPlayer('蜜蜂撞上', false);
        return;
      }
    }
  }

  function healMushrooms() {
    let n = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const hp = mushAt(c, r);
        if (hp > 0 && hp < 4) {
          setMush(c, r, hp + 1);
          n += 1;
        }
      }
    }
    if (n && G.mode === 'play') addScore(n * 5);
    return n;
  }

  function waveClear() {
    const w = G.wave;
    addScore(250 * w);
    healMushrooms();
    audio.wave();
    hitStop(0.06);
    kick(4);
    screenFlash(GOLD, 0.22);
    toast('第 ' + w + ' 波肃清', false, true);
    G.wave += 1;
    spawnMillipede();
    const kept = [];
    for (let i = 0; i < G.ddts.length; i++) if (G.ddts[i].live) kept.push(G.ddts[i]);
    G.ddts = kept;
    let guard = 0;
    while (G.ddts.length < 4 && guard < 80) {
      guard += 1;
      const c = irand(1, COLS - 2);
      const r = irand(3, 16);
      if (solidAt(c, r)) continue;
      G.ddts.push({ c: c, r: r, live: true });
    }
    G.ready = 0.45;
    G.lastWarn = 0;
    G.spiderT = Math.min(G.spiderT, isTide() ? 1.6 : 3.2);
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.shot = null;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    const lead = (why || '菌林失守') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '菌林失守', lead, '再来', '换模式');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'tide' ? 'tide' : 'grove';
    G.mode = 'play';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.next1up = 12000;
    G.why = '';
    G.clock = 0;
    resetField();
    G.ready = 0.6;
    hideOverlay();
    audio.start();
    toast(isTide() ? '虫潮 · 蜘蛛更快' : '菌林 · 波次推进', isTide(), !isTide());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'grove';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    resetField();
    G.ready = 0;
    showOverlay('title', '千足', '千足虫穿菌林。打节即断。DDT 炸开一片。蜘蛛扎底栏。', '菌林', '虫潮');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('grove');
    else startGame(G.kind || 'grove');
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, Math.min(1, dt * 10));
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.slowT > 0) G.slowT -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = chips.length - 1; i >= 0; i--) {
      const c = chips[i];
      c.vy += 420 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.life -= dt;
      if (c.life <= 0) chips.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.36) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = booms.length - 1; i >= 0; i--) {
      booms[i].t += dt;
      if (booms[i].t > booms[i].life) booms.splice(i, 1);
    }
    for (let i = stings.length - 1; i >= 0; i--) {
      stings[i].t += dt;
      if (stings[i].t > 0.28) stings.splice(i, 1);
    }
    for (let i = G.pendingBoom.length - 1; i >= 0; i--) {
      G.pendingBoom[i].t -= dt;
      if (G.pendingBoom[i].t <= 0) {
        const d = G.pendingBoom[i].d;
        G.pendingBoom.splice(i, 1);
        explodeDdt(d, true);
      }
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y += m.v * dt * 0.15;
      if (m.y > VH) m.y = 0;
    }
  }

  function playSim(dt) {
    updatePlayer(dt);
    if ((G.fireHold || pointer.down) && G.mode === 'play') fire();
    if (G.ready > 0) {
      G.ready -= dt;
      updateShot(dt);
      updateChainVisualAll(dt);
      return;
    }
    updateMillipede(dt);
    updateSpiders(dt);
    updateBees(dt);
    updateEarwigs(dt);
    updateInch(dt);
    updateShot(dt);
    playerHitCheck();
  }

  function updateChainVisualAll(dt) {
    for (let i = 0; i < G.chains.length; i++) updateChainVisual(G.chains[i], dt);
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      playSim(dt);
      let lowest = 0;
      for (let i = 0; i < G.chains.length; i++) {
        for (let s = 0; s < G.chains[i].segs.length; s++) {
          if (G.chains[i].segs[s].y > lowest) lowest = G.chains[i].segs[s].y;
        }
      }
      if (countSegs() === 0 || lowest > ZONE_TOP + 40) resetField();
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose') {
      updateFx(dt);
      updateMillipede(dt * 0.45);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateMillipede(dt);
      updateSpiders(dt);
      updateBees(dt);
      updateEarwigs(dt);
      updateInch(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '菌林失守');
          updateFx(dt);
          return;
        }
        G.ship.x = VW * 0.5;
        G.ship.y = ZONE_TOP + 88;
        G.invuln = 1.4;
        G.shot = null;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && countSegs() === 0 && G.pending.length === 0) waveClear();

    updateFx(dt);
    syncHud();
  }

  function drawMushroom(c, r, hp) {
    const x = cellX(c);
    const y = cellY(r);
    const pulse = 0.85 + 0.15 * Math.sin(G.t * 2.2 + c * 0.7 + r);
    const cap = hp >= 3 ? 9 : hp === 2 ? 7.2 : 5.4;
    ctx.fillStyle = rgba(STEM, 0.95);
    ctx.fillRect(sx(x - 2), sy(y - 1), 4 * scale, 8 * scale);
    ctx.fillStyle = rgba(hp === 1 ? LEAF : MINT, 0.95 * pulse);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y - 3), cap * 0.55 * scale, cap * 0.42 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.beginPath();
    ctx.arc(sx(x - 2), sy(y - 4.5), 1.3 * scale, 0, TAU);
    ctx.fill();
    if (hp < 4) {
      ctx.fillStyle = rgba([8, 20, 10], 0.45);
      ctx.fillRect(sx(x + 1), sy(y - 6), 2.2 * scale, 3 * scale);
    }
  }

  function drawDdt(d) {
    const x = cellX(d.c);
    const y = cellY(d.r);
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 8 + d.c);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(DDT_C, 0.16 * pulse);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 13 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = rgba(DDT_C, 0.95);
    ctx.fillRect(sx(x - 6), sy(y - 9), 12 * scale, 18 * scale);
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.fillRect(sx(x - 6), sy(y - 2), 12 * scale, 4 * scale);
    ctx.fillStyle = rgba([40, 28, 8], 0.9);
    ctx.fillRect(sx(x - 4), sy(y - 11), 8 * scale, 3 * scale);
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = (6 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DDT', sx(x), sy(y + 8));
  }

  function drawMillipede() {
    for (let i = 0; i < G.chains.length; i++) {
      const ch = G.chains[i];
      for (let s = ch.segs.length - 1; s >= 0; s--) {
        const seg = ch.segs[s];
        const head = seg.head || s === 0;
        const rgb = head ? HOT : (s % 2 ? MINT : LEAF);
        const rad = head ? 11.2 : 9.4;
        const leg = Math.sin(G.t * 16 + s * 0.9) * 3.4;
        ctx.strokeStyle = rgba(rgb, 0.7);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(seg.x - rad + 2), sy(seg.y));
        ctx.lineTo(sx(seg.x - rad - 3), sy(seg.y + leg));
        ctx.moveTo(sx(seg.x + rad - 2), sy(seg.y));
        ctx.lineTo(sx(seg.x + rad + 3), sy(seg.y - leg));
        ctx.stroke();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = rgba(rgb, 0.18);
        ctx.beginPath();
        ctx.arc(sx(seg.x), sy(seg.y), (rad + 3) * scale, 0, TAU);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = rgba(rgb, 1);
        ctx.beginPath();
        ctx.arc(sx(seg.x), sy(seg.y), rad * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba([10, 40, 16], 0.35);
        ctx.beginPath();
        ctx.arc(sx(seg.x + 1.5), sy(seg.y + 1.5), rad * 0.55 * scale, 0, TAU);
        ctx.fill();
        if (head) {
          ctx.strokeStyle = rgba(GOLD, 0.9);
          ctx.lineWidth = 1.6 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(seg.x - 4), sy(seg.y - 6));
          ctx.lineTo(sx(seg.x - 8), sy(seg.y - 13));
          ctx.moveTo(sx(seg.x + 4), sy(seg.y - 6));
          ctx.lineTo(sx(seg.x + 8), sy(seg.y - 13));
          ctx.stroke();
          ctx.fillStyle = rgba(WHT, 0.95);
          ctx.beginPath();
          ctx.arc(sx(seg.x - 3.4), sy(seg.y - 2), 1.6 * scale, 0, TAU);
          ctx.arc(sx(seg.x + 3.4), sy(seg.y - 2), 1.6 * scale, 0, TAU);
          ctx.fill();
          ctx.fillStyle = '#041208';
          ctx.beginPath();
          ctx.arc(sx(seg.x - 3.4), sy(seg.y - 2), 0.7 * scale, 0, TAU);
          ctx.arc(sx(seg.x + 3.4), sy(seg.y - 2), 0.7 * scale, 0, TAU);
          ctx.fill();
        }
      }
    }
  }

  function drawSpider(sp) {
    const squash = 1 + Math.sin(sp.hop) * 0.12;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(MAG, 0.2);
    ctx.beginPath();
    ctx.ellipse(sx(sp.x), sy(sp.y), 14 * scale, 10 * squash * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = rgba(MAG, 0.85);
    ctx.lineWidth = 1.3 * scale;
    for (let i = 0; i < 4; i++) {
      const a = -0.9 + i * 0.55 + Math.sin(sp.hop + i) * 0.2;
      ctx.beginPath();
      ctx.moveTo(sx(sp.x), sy(sp.y));
      ctx.lineTo(sx(sp.x + Math.cos(a) * 16), sy(sp.y + Math.sin(a) * 10 * squash));
      ctx.moveTo(sx(sp.x), sy(sp.y));
      ctx.lineTo(sx(sp.x - Math.cos(a) * 16), sy(sp.y + Math.sin(a) * 10 * squash));
      ctx.stroke();
    }
    ctx.fillStyle = rgba(MAG, 1);
    ctx.beginPath();
    ctx.ellipse(sx(sp.x), sy(sp.y), 7.5 * scale, 6 * squash * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(sx(sp.x - 2.4), sy(sp.y - 1), 1.3 * scale, 0, TAU);
    ctx.arc(sx(sp.x + 2.4), sy(sp.y - 1), 1.3 * scale, 0, TAU);
    ctx.fill();
  }

  function drawBee(b) {
    const flap = 3 + Math.sin(G.t * 28) * 3;
    ctx.fillStyle = rgba(BEE_C, 0.25);
    ctx.beginPath();
    ctx.ellipse(sx(b.x - 6), sy(b.y - 2), (5 + flap) * scale, 3 * scale, -0.4, 0, TAU);
    ctx.ellipse(sx(b.x + 6), sy(b.y - 2), (5 + flap) * scale, 3 * scale, 0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(BEE_C, 1);
    ctx.beginPath();
    ctx.ellipse(sx(b.x), sy(b.y), 7 * scale, 5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([40, 24, 8], 0.7);
    ctx.fillRect(sx(b.x - 2), sy(b.y - 4), 1.4 * scale, 8 * scale);
    ctx.fillRect(sx(b.x + 1), sy(b.y - 4), 1.4 * scale, 8 * scale);
  }

  function drawEarwig(e) {
    ctx.fillStyle = rgba(EAR_C, 1);
    ctx.beginPath();
    ctx.ellipse(sx(e.x), sy(e.y), 13 * scale, 5.5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 1.5 * scale;
    const dir = e.vx > 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(sx(e.x + dir * 10), sy(e.y));
    ctx.lineTo(sx(e.x + dir * 16), sy(e.y - 5));
    ctx.moveTo(sx(e.x + dir * 10), sy(e.y));
    ctx.lineTo(sx(e.x + dir * 16), sy(e.y + 5));
    ctx.stroke();
  }

  function drawInch() {
    if (!G.inch) return;
    const e = G.inch;
    const w = 10 + Math.sin(G.t * 6) * 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(INCH_C, 0.18);
    ctx.beginPath();
    ctx.ellipse(sx(e.x), sy(e.y), 22 * scale, 10 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = rgba(INCH_C, 0.95);
    ctx.beginPath();
    ctx.ellipse(sx(e.x), sy(e.y), 18 * scale, w * 0.55 * scale, 0, 0, TAU);
    ctx.fill();
    for (let i = -2; i <= 2; i++) {
      ctx.fillStyle = rgba(WHT, 0.25);
      ctx.beginPath();
      ctx.arc(sx(e.x + i * 5), sy(e.y - 2), 2.2 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const x = G.ship.x;
    const y = G.ship.y;
    if (G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(CYN, 0.16);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 14 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y - 11));
    ctx.lineTo(sx(x + 11), sy(y + 8));
    ctx.lineTo(sx(x + 4), sy(y + 5));
    ctx.lineTo(sx(x - 4), sy(y + 5));
    ctx.lineTo(sx(x - 11), sy(y + 8));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fillRect(sx(x - 1.4), sy(y - 10), 2.8 * scale, 7 * scale);
    if (G.muzzle > 0) {
      const a = G.muzzle / 0.09;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(GOLD, 0.7 * a);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y - 14), (5 + (1 - a) * 6) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawShot() {
    if (!G.shot) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (!REDUCE) {
      ctx.strokeStyle = rgba(GOLD, 0.45);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(G.shot.x), sy(G.shot.y));
      ctx.lineTo(sx(G.shot.x), sy(G.shot.y + 16));
      ctx.stroke();
    }
    ctx.fillStyle = rgba(WHT, 1);
    ctx.fillRect(sx(G.shot.x - 1.4), sy(G.shot.y - 7), 2.8 * scale, 12 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(sx(G.shot.x), sy(G.shot.y - 7), 2.4 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < chips.length; i++) {
      const c = chips[i];
      const a = Math.max(0, c.life / c.max);
      ctx.fillStyle = rgba(c.rgb, a);
      ctx.fillRect(sx(c.x), sy(c.y), c.s * scale, c.s * scale);
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (6 + s.t * 40) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.36;
      ctx.strokeStyle = rgba(r.rgb, a * 0.8);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < booms.length; i++) {
      const b = booms[i];
      const u = b.t / b.life;
      ctx.fillStyle = rgba(DDT_C, (1 - u) * 0.35);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), (18 + u * 70) * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(MAG, (1 - u) * 0.7);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), (12 + u * 58) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < stings.length; i++) {
      const s = stings[i];
      const a = 1 - s.t / 0.28;
      ctx.strokeStyle = rgba(MAG, a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x), sy(s.y));
      ctx.lineTo(sx(s.x + Math.cos(s.ang) * s.len * (0.4 + s.t * 4)), sy(s.y + Math.sin(s.ang) * s.len * (0.4 + s.t * 4)));
      ctx.stroke();
    }
    ctx.restore();
    ctx.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, isTide() ? '#08140c' : '#062410');
    g.addColorStop(0.5, isTide() ? '#04140e' : '#041208');
    g.addColorStop(1, '#020c06');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(180), 16 * scale, sx(240), sy(320), 380 * scale);
    vg.addColorStop(0, isTide() ? 'rgba(255, 61, 184, 0.07)' : 'rgba(42, 224, 58, 0.08)');
    vg.addColorStop(0.55, 'rgba(0, 240, 200, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (G.slowT > 0 || G.inch) {
      ctx.fillStyle = 'rgba(80, 230, 255, 0.05)';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }

    for (let i = 0; i < motes.length; i++) {
      const s = motes[i];
      const a = s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }

    ctx.save();
    ctx.setLineDash([4 * scale, 6 * scale]);
    ctx.strokeStyle = rgba(CYN, 0.28);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(8), sy(ZONE_TOP));
    ctx.lineTo(sx(VW - 8), sy(ZONE_TOP));
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = rgba(MINT, 0.12);
    ctx.fillRect(sx(10), sy(VH - 14), (VW - 20) * scale, 6 * scale);
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#041208';
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H);
    }
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#041208';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * scale * 0.5;
      const cy = oy + VH * scale * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const hp = mushAt(c, r);
        if (hp > 0) drawMushroom(c, r, hp);
      }
    }
    for (let i = 0; i < G.ddts.length; i++) {
      if (G.ddts[i].live) drawDdt(G.ddts[i]);
    }
    drawMillipede();
    for (let i = 0; i < G.earwigs.length; i++) drawEarwig(G.earwigs[i]);
    drawInch();
    for (let i = 0; i < G.bees.length; i++) drawBee(G.bees[i]);
    for (let i = 0; i < G.spiders.length; i++) drawSpider(G.spiders[i]);
    drawShot();
    drawShip();
    drawFx();
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

  function pointerWorld(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('grove');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W') {
      keys.u = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S') {
      keys.d = down;
      inputSrc = 'key';
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
    if (G.mode === 'title' && (k === '1' || k === 'Digit1')) {
      startGame('grove');
      return;
    }
    if (G.mode === 'title' && (k === '2' || k === 'Digit2')) {
      startGame('tide');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        if (k === 'Enter' || space) primaryAction();
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
      const p = pointerWorld(e);
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = p.x;
      pointer.y = p.y;
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = pointerWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) G.fireHold = false;
    });
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
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  seedMotes();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnGrove) {
    btnGrove.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('grove');
    });
  }
  if (btnTide) {
    btnTide.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('tide');
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
