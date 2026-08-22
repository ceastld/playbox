'use strict';

(function () {
  const VW = 720;
  const VH = 540;
  const CX = 360;
  const CY = 270;
  const HEX_R = 248;
  const COS30 = Math.sqrt(3) / 2;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const P_R = 11;
  const P_SPD = 198;
  const SHOT_SPD = 540;
  const SHOT_LIFE = 0.72;
  const FIRE_CD = 0.068;
  const MAX_SHOTS = 14;
  const COMBO_WIN = 1.24;
  const BEST_KEY = 'playbox-black-widow-best';
  const MUTE_KEY = 'playbox-black-widow-mute';
  const AUTO_SPEED_KEY = 'playbox-black-widow-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 1, 2, 4, 10];
  const AUTO_START_WAIT = [0, 0.55, 0.38, 0.2, 0.06];
  const AUTO_RETRY_WAIT = [0, 1.2, 0.9, 0.65, 0.32];
  const OPS = 'WASD 走 · 方向键或 IJKL 射 · 鼠标瞄准空格 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 74, 214];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [224, 112, 255];
  const HOT2 = [255, 154, 236];
  const WHT = [244, 232, 255];
  const MOSQ = [90, 230, 255];
  const BEET = [255, 186, 64];
  const HORN = [255, 220, 96];
  const GRUB = [122, 255, 107];
  const BOOM = [255, 74, 160];
  const SLAY = [180, 255, 255];
  const EGGC = [255, 236, 196];

  const KIND = {
    mosq: { r: 8, spd: 118, score: 100, drop: true, lethal: true, rgb: MOSQ, why: '撞上蚊子了' },
    beetle: { r: 11, spd: 74, score: 200, drop: true, lethal: true, rgb: BEET, why: '甲虫咬到了' },
    hornet: { r: 9, spd: 94, score: 300, drop: true, lethal: true, rgb: HORN, why: '黄蜂扎到了' },
    grub: { r: 7, spd: 54, score: 200, drop: false, lethal: true, rgb: GRUB, why: '蛆虫贴上了' },
    boom: { r: 12, spd: 66, score: 400, drop: false, lethal: true, rgb: BOOM, why: '雷虫撞上了' },
    slayer: { r: 13, spd: 98, score: 0, drop: false, lethal: false, rgb: SLAY, why: '' }
  };

  const WEB_WAVES = [
    { name: '入网', mosq: 6, beetle: 0, hornet: 0, grub: 1, boom: 0, slayer: 0 },
    { name: '蚊群', mosq: 8, beetle: 1, hornet: 0, grub: 2, boom: 0, slayer: 0 },
    { name: '甲行', mosq: 6, beetle: 3, hornet: 1, grub: 1, boom: 0, slayer: 0 },
    { name: '产卵', mosq: 5, beetle: 2, hornet: 3, grub: 2, boom: 0, slayer: 0 },
    { name: '雷虫', mosq: 6, beetle: 2, hornet: 2, grub: 2, boom: 2, slayer: 0 },
    { name: '合围', mosq: 8, beetle: 3, hornet: 3, grub: 2, boom: 1, slayer: 1 },
    { name: '狂孵', mosq: 8, beetle: 3, hornet: 4, grub: 3, boom: 2, slayer: 1 },
    { name: '终网', mosq: 10, beetle: 4, hornet: 4, grub: 3, boom: 3, slayer: 1 }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnWeb = document.getElementById('btn-web');
  const btnSwarm = document.getElementById('btn-swarm');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const modeWeb = document.getElementById('mode-web');
  const modeSwarm = document.getElementById('mode-swarm');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const eggLabel = document.getElementById('egg-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');
  const vpadL = document.getElementById('vpad-l');
  const vpadR = document.getElementById('vpad-r');
  const knobL = document.getElementById('knob-l');
  const knobR = document.getElementById('knob-r');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let kickTok = 0;
  let comboTok = 0;
  let chainTok = 0;

  const keys = { u: false, d: false, l: false, r: false };
  const shoot = { u: false, d: false, l: false, r: false };
  const mouse = { x: CX, y: CY, down: false, hover: false };
  const stickL = { on: false, x: 0, y: 0, id: null };
  const stickR = { on: false, x: 0, y: 0, id: null };
  const padMove = { x: 0, y: 0 };
  const padShoot = { x: 0, y: 0 };
  let fireHold = false;
  const autoMove = { x: 0, y: 0 };
  const autoAimV = { x: 0, y: -1 };
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoStrafe = 1;
  let autoWallT = 0;
  let autoTarget = null;
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const shards = [];
  const strands = [];
  const nodes = [];

  const G = {
    mode: 'title',
    kind: 'web',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    bestWeb: 0,
    bestSwarm: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    nextLife: LIFE_EVERY,
    player: { x: CX, y: CY, vx: 0, vy: 0, face: 0, aim: -Math.PI / 2 },
    bugs: [],
    eggs: [],
    pick: [],
    shots: [],
    queue: [],
    fireCd: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    waveWait: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    muzzle: 0,
    kicks: 0,
    why: '',
    twangT: 0
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function norm(x, y) {
    const l = hypot(x, y);
    if (l < 0.0001) return { x: 0, y: 0, l: 0 };
    return { x: x / l, y: y / l, l: l };
  }
  function isSwarm() {
    return G.kind === 'swarm';
  }

  function hexOut(dx, dy, pad) {
    const A = HEX_R * COS30 - pad;
    let maxD = -1e9;
    let nx = 1;
    let ny = 0;
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 3 + i * Math.PI / 3;
      const nxx = Math.cos(ang);
      const nyy = Math.sin(ang);
      const d = dx * nxx + dy * nyy - A;
      if (d > maxD) {
        maxD = d;
        nx = nxx;
        ny = nyy;
      }
    }
    return { nx: nx, ny: ny, d: maxD };
  }

  function clampHex(x, y, rad) {
    for (let k = 0; k < 4; k++) {
      const h = hexOut(x - CX, y - CY, rad);
      if (h.d <= 0) break;
      x -= h.nx * h.d;
      y -= h.ny * h.d;
    }
    return { x: x, y: y };
  }

  function bounceHex(e, rad) {
    const h = hexOut(e.x - CX, e.y - CY, rad);
    if (h.d <= 0) return false;
    e.x -= h.nx * h.d;
    e.y -= h.ny * h.d;
    const vdot = e.vx * h.nx + e.vy * h.ny;
    if (vdot > 0) {
      e.vx -= 2 * vdot * h.nx;
      e.vy -= 2 * vdot * h.ny;
      twangAt(e.x, e.y, 7 + Math.min(14, vdot * 0.05));
      return true;
    }
    return false;
  }

  function insideHex(x, y, pad) {
    return hexOut(x - CX, y - CY, pad).d <= 0;
  }

  function edgePoint(i, inset) {
    const ang = -Math.PI / 3 + i * Math.PI / 3;
    const A = HEX_R * COS30 - inset;
    return { x: CX + Math.cos(ang) * A, y: CY + Math.sin(ang) * A, nx: Math.cos(ang), ny: Math.sin(ang) };
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
      this.beep(1320, 0.045, 'square', 0.026, 280);
      this.beep(680, 0.032, 'triangle', 0.014, 160);
    },
    splat(kind) {
      this.ensure();
      const hi = kind === 'boom' ? 220 : kind === 'hornet' ? 880 : kind === 'beetle' ? 420 : 640;
      this.noise(kind === 'boom' ? 0.18 : 0.09, kind === 'boom' ? 0.07 : 0.046, 240);
      this.beep(hi, 0.1, 'square', 0.046, hi * 0.28);
      this.beep(hi * 0.45, 0.12, 'triangle', 0.024, 70);
    },
    twang(freq) {
      this.ensure();
      this.beep(freq || 240, 0.16, 'triangle', 0.03, (freq || 240) * 2.4);
      this.beep((freq || 240) * 1.5, 0.08, 'sine', 0.016, (freq || 240) * 0.7);
    },
    pickup() {
      this.ensure();
      this.beep(523, 0.06, 'sine', 0.036, 784);
      this.beep(784, 0.1, 'triangle', 0.03, 1176);
    },
    kickEgg() {
      this.ensure();
      this.beep(196, 0.08, 'square', 0.04, 620);
      this.beep(784, 0.14, 'triangle', 0.036, 1568);
      this.noise(0.06, 0.03, 600);
    },
    hatch() {
      this.ensure();
      this.noise(0.08, 0.04, 400);
      this.beep(180, 0.12, 'sawtooth', 0.028, 90);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.038, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.028, 1176);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.1, 'triangle', 0.038, 1046);
      this.beep(1046, 0.18, 'sine', 0.042, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.062, 220);
      this.beep(220, 0.24, 'sawtooth', 0.05, 52);
      this.beep(110, 0.34, 'sine', 0.04, 40);
    },
    wave() {
      this.ensure();
      this.beep(330, 0.08, 'sine', 0.038, 494);
      this.beep(494, 0.1, 'sine', 0.038, 659);
      this.beep(784, 0.18, 'triangle', 0.038, 988);
    },
    win() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
      this.beep(784, 0.22, 'sine', 0.046, 1176);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.038, 80);
      this.beep(110, 0.32, 'sine', 0.046, 42);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.14, 'triangle', 0.032, 1176);
    },
    boom() {
      this.ensure();
      this.noise(0.22, 0.08, 180);
      this.beep(90, 0.28, 'sawtooth', 0.055, 40);
      this.beep(280, 0.12, 'square', 0.04, 90);
    }
  };

  function currentBest() {
    return isSwarm() ? G.bestSwarm : G.bestWeb;
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw) {
        if (raw.charAt(0) === '{') {
          const o = JSON.parse(raw);
          G.bestWeb = o.web | 0;
          G.bestSwarm = o.swarm | 0;
        } else {
          const n = parseInt(raw, 10) | 0;
          G.bestWeb = n;
          G.bestSwarm = n;
        }
      }
    } catch (err) { /* ignore */ }
    G.best = currentBest();
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function saveBest() {
    G.best = currentBest();
    if (G.score > G.best) {
      if (isSwarm()) G.bestSwarm = G.score;
      else G.bestWeb = G.score;
      G.best = G.score;
      try {
        localStorage.setItem(BEST_KEY, JSON.stringify({ web: G.bestWeb, swarm: G.bestSwarm }));
      } catch (err) { /* ignore */ }
    }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function addScore(n, x, y, rgb, gold) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    while (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        audio.extra();
        toast('额外生命', false, true);
        screenFlash(GOLD, 0.55);
        kick(3.2);
        syncPips();
      }
    }
    if (x != null) floatTxt(x, y, '+' + n, rgb || GOLD, gold);
    if (!scoreBox || !scoreAdd) return;
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

  function toast(msg, warn, gold) {
    G.toastT = 1.35;
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
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    while (pips.length > n && pips.length > LIVES) {
      const d = pips.pop();
      if (d && d.parentNode) d.parentNode.removeChild(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (G.mult > prev) {
      audio.combo(G.mult);
      toast('连击 ×' + G.mult, false, true);
      showChain(G.mult);
    }
  }

  function showChain(m) {
    if (!chainPop || REDUCE) return;
    chainPop.textContent = '×' + m;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    clearTimeout(chainTok);
    chainTok = setTimeout(function () {
      chainPop.classList.add('hidden');
    }, 700);
  }

  function syncModes() {
    const sw = isSwarm();
    if (modeWeb) modeWeb.setAttribute('aria-pressed', sw ? 'false' : 'true');
    if (modeSwarm) modeSwarm.setAttribute('aria-pressed', sw ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(currentBest());
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = isSwarm() ? '虫潮' : '蛛网';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 5);
    }
    if (tagLabel) {
      tagLabel.textContent = isSwarm() ? '虫潮' : (G.mode === 'title' ? 'WIDOW' : waveName());
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (eggLabel) {
      const n = G.eggs.length;
      eggLabel.textContent = n > 0 ? '卵 ×' + n : '卵 —';
      eggLabel.classList.toggle('hot', n >= 3);
    }
    if (autoOn && G.mode === 'play') setHint('自动托管 · 走射清虫 · 踢卵出网 · A 停下', G.lives === 1 ? 'warn' : '');
    else if (autoOn && G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下');
    else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) {
      setHint('自动仍开着 · 即将再来 · A 停下', G.mode === 'win' ? 'hot' : 'warn');
    } else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 碰到虫子即扣命', 'warn');
    else if (G.mode === 'win') setHint('网清了 · R 再来', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 踢卵出网叠分', 'warn');
    else setHint('WASD 走 · 方向键或 IJKL 射 · 踢卵出网 · A 自动', G.combo >= 6 ? 'hot' : '');
    syncPips();
    syncModes();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind === 'lose' || kind === 'win');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'WIDOW';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function kick(n) {
    G.shake = Math.max(G.shake, n);
    if (REDUCE) return;
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, n * 0.006));
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.45);
    G.flashRgb = rgb || HOT;
  }

  function hitStop(ms) {
    if (REDUCE) return;
    if (autoOn && autoSpeed >= 3) return;
    G.stop = Math.max(G.stop, clamp(ms, 0.03, 0.08));
  }

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
    } catch (err) { /* ignore */ }
  }

  function boardKick(cls) {
    if (REDUCE || !stageEl) return;
    stageEl.classList.remove('boom', 'die', 'hit', 'twang', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    clearTimeout(kickTok);
    kickTok = setTimeout(function () {
      stageEl.classList.remove(cls);
    }, 420);
  }

  function emit(n, o) {
    const cap = 220;
    for (let i = 0; i < n; i++) {
      if (particles.length >= cap) particles.shift();
      particles.push({
        x: o.x + rand(-o.j, o.j),
        y: o.y + rand(-o.j, o.j),
        vx: rand(o.vx0, o.vx1),
        vy: rand(o.vy0, o.vy1),
        r: rand(o.r0, o.r1),
        life: o.life * rand(0.7, 1.2),
        max: o.life,
        rgb: o.rgb,
        g: o.g || 0
      });
    }
  }

  function popSpark(x, y, rgb, n) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, n: n || 8 });
  }

  function popRing(x, y, rgb, w) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, w: w || 6 });
  }

  function floatTxt(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, t: 0, life: 0.7, vy: -42,
      text: text, rgb: rgb || GOLD, gold: !!gold, size: gold ? 16 : 13
    });
  }

  function splat(x, y, rgb, n) {
    emit(n || 16, {
      x: x, y: y, j: 6,
      vx0: -220, vx1: 220, vy0: -240, vy1: 160,
      r0: 1.2, r1: 3.4, life: 0.42, rgb: rgb, g: 280
    });
    popSpark(x, y, rgb, 12);
    popRing(x, y, rgb, 5);
    for (let i = 0; i < 5; i++) {
      shards.push({
        x: x, y: y,
        vx: rand(-160, 160), vy: rand(-180, 80),
        ang: rand(0, TAU), spin: rand(-8, 8),
        len: rand(5, 12), life: rand(0.22, 0.46), max: 0.46, rgb: rgb
      });
    }
  }

  function twangAt(x, y, amp) {
    let best = -1;
    let bd = 1e9;
    for (let i = 0; i < strands.length; i++) {
      const s = strands[i];
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const len2 = dx * dx + dy * dy || 1;
      let t = ((x - s.x1) * dx + (y - s.y1) * dy) / len2;
      t = clamp(t, 0, 1);
      const px = s.x1 + dx * t;
      const py = s.y1 + dy * t;
      const d = hypot(x - px, y - py);
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    if (best >= 0 && bd < 48) {
      strands[best].amp = Math.min(18, strands[best].amp + amp);
    }
    G.twangT = 0.12;
    const freq = 180 + clamp(HEX_R - hypot(x - CX, y - CY), 0, HEX_R) * 1.1;
    if (amp > 6) audio.twang(freq);
  }

  function buildWeb() {
    strands.length = 0;
    nodes.length = 0;
    const ringsN = 5;
    for (let r = 1; r <= ringsN; r++) {
      const rad = HEX_R * (r / ringsN);
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const ang = -Math.PI / 2 + i * Math.PI / 3;
        pts.push({ x: CX + Math.cos(ang) * rad, y: CY + Math.sin(ang) * rad });
      }
      for (let i = 0; i < 6; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % 6];
        strands.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, amp: 0, ph: rand(0, TAU) });
        nodes.push({ x: a.x, y: a.y, p: rand(0, TAU) });
      }
    }
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 3;
      strands.push({
        x1: CX, y1: CY,
        x2: CX + Math.cos(ang) * HEX_R,
        y2: CY + Math.sin(ang) * HEX_R,
        amp: 0, ph: rand(0, TAU)
      });
    }
  }

  function spdMul() {
    let m = 1 + (G.wave - 1) * 0.046;
    if (isSwarm()) m *= 1.28;
    return m;
  }

  function waveName() {
    if (isSwarm()) return '潮 ' + G.wave;
    const w = WEB_WAVES[Math.min(G.wave - 1, WEB_WAVES.length - 1)];
    return w.name;
  }

  function waveSpec(kind, wave) {
    if (kind !== 'swarm') {
      return WEB_WAVES[Math.min(Math.max(1, wave) - 1, WEB_WAVES.length - 1)];
    }
    const n = Math.max(1, wave);
    return {
      name: '潮 ' + n,
      mosq: Math.min(14, 5 + n),
      beetle: Math.min(5, 1 + (n >> 1)),
      hornet: Math.min(5, n >> 1),
      grub: Math.min(4, n),
      boom: n >= 3 ? Math.min(4, 1 + ((n - 3) >> 1)) : 0,
      slayer: n >= 4 ? 1 : 0
    };
  }

  function spawnBug(type, x, y, vx, vy) {
    const k = KIND[type];
    if (!k) return;
    if (G.bugs.length >= 32) return;
    const c = clampHex(x, y, k.r + 1);
    G.bugs.push({
      type: type,
      x: c.x, y: c.y,
      vx: vx, vy: vy,
      r: k.r,
      age: 0,
      cd: 0,
      spin: rand(0, TAU)
    });
  }

  function spawnFromEdge(type) {
    const k = KIND[type];
    if (!k) return;
    let tries = 8;
    while (tries--) {
      const i = irand(0, 5);
      const e = edgePoint(i, k.r + 10);
      const along = rand(-36, 36);
      const tx = -e.ny * along;
      const ty = e.nx * along;
      const x = e.x + tx;
      const y = e.y + ty;
      if (G.mode === 'play' && hypot(x - G.player.x, y - G.player.y) < 96) continue;
      const spd = k.spd * spdMul() * rand(0.86, 1.12);
      const jitter = rand(-0.42, 0.42);
      const nx = -e.nx * Math.cos(jitter) + -e.ny * Math.sin(jitter);
      const ny = -e.ny * Math.cos(jitter) + e.nx * Math.sin(jitter);
      const nn = norm(nx, ny);
      spawnBug(type, x, y, nn.x * spd, nn.y * spd);
      twangAt(x, y, 5);
      return;
    }
  }

  function spawnEgg(x, y) {
    if (G.eggs.length >= 10) return;
    const c = clampHex(x, y, 10);
    G.eggs.push({
      x: c.x, y: c.y, vx: 0, vy: 0,
      r: 10, grow: 0,
      max: isSwarm() ? 3.35 : 4.8
    });
  }

  function spawnPick(x, y) {
    if (G.pick.length >= 12) return;
    const c = clampHex(x, y, 8);
    G.pick.push({ x: c.x, y: c.y, t: 0, life: 7.5, bob: rand(0, TAU) });
  }

  function queueWave() {
    const spec = waveSpec(G.kind, G.wave);
    const list = [];
    function add(type, n) {
      for (let i = 0; i < n; i++) list.push(type);
    }
    add('mosq', spec.mosq);
    add('beetle', spec.beetle);
    add('hornet', spec.hornet);
    add('grub', spec.grub);
    add('boom', spec.boom);
    add('slayer', spec.slayer);
    for (let i = list.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    G.queue.length = 0;
    const gap = isSwarm() ? 0.11 : 0.17;
    for (let i = 0; i < list.length; i++) {
      G.queue.push({ type: list[i], t: 0.08 + i * gap });
    }
  }

  function threatCount() {
    let n = G.eggs.length;
    for (let i = 0; i < G.bugs.length; i++) {
      if (G.bugs[i].type !== 'slayer') n += 1;
    }
    for (let i = 0; i < G.queue.length; i++) {
      if (G.queue[i].type !== 'slayer') n += 1;
    }
    return n;
  }

  function resetWorld(demo) {
    G.bugs.length = 0;
    G.eggs.length = 0;
    G.pick.length = 0;
    G.shots.length = 0;
    G.queue.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    shards.length = 0;
    G.player.x = CX;
    G.player.y = CY;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.face = 0;
    G.player.aim = -Math.PI / 2;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = demo ? 0 : 1.15;
    G.waveWait = 0;
    G.kicks = 0;
    G.muzzle = 0;
    G.stop = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.ready = demo ? 0 : 0.35;
    for (let i = 0; i < strands.length; i++) strands[i].amp = 0;
    if (demo) {
      spawnFromEdge('mosq');
      spawnFromEdge('mosq');
      spawnFromEdge('mosq');
      spawnFromEdge('beetle');
      spawnFromEdge('hornet');
    }
  }

  function startGame(kind) {
    G.kind = kind === 'swarm' ? 'swarm' : 'web';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.best = currentBest();
    resetWorld(false);
    fireHold = false;
    mouse.down = false;
    autoOvWait = 0;
    autoTarget = null;
    queueWave();
    hideOverlay();
    audio.start();
    toast('第 1 波 · ' + waveName(), false, true);
    if (scoreEl) scoreEl.textContent = '0';
    syncHud();
    boardKick('twang');
  }

  function goTitle() {
    G.mode = 'title';
    G.why = '';
    G.score = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.combo = 0;
    G.mult = 1;
    G.best = currentBest();
    resetWorld(true);
    autoOvWait = 0;
    showOverlay('title', '黑蛛', '六角蛛网上双摇杆走射。虫子从边弹入，卵要踢出网。碰到虫子掉命。');
    syncHud();
  }

  function loseRun(why) {
    G.why = why;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.7);
    boardKick('die');
    G.mode = 'lose';
    autoOvWait = 0;
    const rec = G.score >= currentBest() && G.score > 0;
    showOverlay(
      rec ? 'win' : 'lose',
      rec ? '新纪录' : why,
      '分数 ' + G.score + (rec ? ' · 写入最高' : ' · ' + (isSwarm() ? '虫潮' : '蛛网'))
    );
    syncHud();
  }

  function winRun() {
    addScore(5000, CX, CY, GOLD, true);
    audio.win();
    kick(5);
    screenFlash(GOLD, 0.7);
    boardKick('win-flash');
    G.mode = 'win';
    autoOvWait = 0;
    const rec = G.score >= currentBest() && G.score > 0;
    showOverlay('win', rec ? '新纪录' : '网清了', '八波守住了。分数 ' + G.score);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame(G.kind || 'web');
    else startGame(G.kind || 'web');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame(G.kind || 'web');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function nearestPick(x, y) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.pick.length; i++) {
      const p = G.pick[i];
      const d = hypot(p.x - x, p.y - y);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  function nearestBug(x, y, skip) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.bugs.length; i++) {
      const b = G.bugs[i];
      if (b === skip || b.type === 'slayer') continue;
      const d = hypot(b.x - x, b.y - y);
      if (d < bd) {
        bd = d;
        best = b;
      }
    }
    return best;
  }

  function killWeight(b) {
    if (b.type === 'grub') return 2.8 + Math.max(0, 1.6 - b.age * 0.28);
    if (b.type === 'hornet') return 2.4;
    if (b.type === 'boom') return 2.0;
    if (b.type === 'beetle') return 1.5;
    if (b.type === 'mosq') return 1.2;
    return 0.4;
  }

  function pickKickEgg() {
    let best = null;
    let bestS = -1e9;
    for (let i = 0; i < G.eggs.length; i++) {
      const e = G.eggs[i];
      const h = hexOut(e.x - CX, e.y - CY, e.r);
      const distEdge = Math.max(0, -h.d);
      const hatch = clamp(e.grow / Math.max(0.2, e.max), 0, 1);
      const sc = hatch * 920 + (90 - Math.min(90, distEdge)) * 6 + (e.vx * h.nx + e.vy * h.ny) * 0.4;
      if (sc > bestS) {
        bestS = sc;
        best = e;
      }
    }
    return best;
  }

  function pickAutoTarget() {
    const px = G.player.x;
    const py = G.player.y;
    const inv = G.invuln > 0.12;
    let best = null;
    let bestS = -1e12;
    for (let i = 0; i < G.bugs.length; i++) {
      const b = G.bugs[i];
      if (b.type === 'slayer') continue;
      const d = hypot(b.x - px, b.y - py);
      let sc = killWeight(b) * 1200 / (d + 16);
      if (b.type === 'boom' && d < 88 && !inv) sc *= 0.12;
      if (b.type === 'grub') sc += 420 / (d + 10);
      if (b.type === 'hornet') sc += 180;
      if (sc > bestS) {
        bestS = sc;
        best = b;
      }
    }
    const egg = pickKickEgg();
    if (egg) {
      const d = hypot(egg.x - px, egg.y - py);
      const h = hexOut(egg.x - CX, egg.y - CY, egg.r);
      const aligned = (egg.x - px) * h.nx + (egg.y - py) * h.ny;
      const hatch = clamp(egg.grow / Math.max(0.2, egg.max), 0, 1);
      let sc = 380 / (d + 22) + hatch * 420;
      if (aligned > 0) sc += 520;
      if (sc > bestS) {
        bestS = sc;
        best = egg;
      }
    }
    if (autoTarget) {
      const t = autoTarget;
      const still = G.bugs.indexOf(t) >= 0 || G.eggs.indexOf(t) >= 0;
      if (still && t.type !== 'slayer') {
        const d = hypot(t.x - px, t.y - py);
        if (d < 240) {
          const keep = (t.r > 9 && !t.type ? 500 : killWeight(t) * 1200) / (d + 16);
          if (keep > bestS * 0.72) best = t;
        }
      }
    }
    autoTarget = best;
    return best;
  }

  function scoreAutoMove(nx, ny, dx, dy, look) {
    const inv = G.invuln > 0.12 || G.ready > 0;
    const panicMul = inv ? 0.14 : 1;
    let score = 0;
    const wallH = hexOut(nx - CX, ny - CY, P_R + 2);
    if (wallH.d > 0) return -1e9;
    const wall = -wallH.d;
    const kicking = !inv && G.eggs.length > 0;
    if (wall < 30) score -= (30 - wall) * (kicking ? 28 : (inv ? 36 : 190));
    if (wall < 12 && !kicking) score -= 7000;

    let closest = 1e9;
    let nearX = 0;
    let nearY = 0;
    let nearN = 0;
    let huntX = 0;
    let huntY = 0;
    let huntW = 0;
    for (let i = 0; i < G.bugs.length; i++) {
      const b = G.bugs[i];
      if (b.type === 'slayer') continue;
      const k = KIND[b.type];
      const ex = b.x + b.vx * look;
      const ey = b.y + b.vy * look;
      const edx = ex - nx;
      const edy = ey - ny;
      const d = hypot(edx, edy) || 1;
      const mass = b.type === 'grub' ? 2.4 : (b.type === 'boom' ? 2.1 : (b.type === 'hornet' ? 1.6 : 1.15));
      const contact = (k ? k.r : 8) + P_R + (b.type === 'grub' ? 20 : 14);
      if (d < closest) closest = d;
      if (d < 210) {
        nearX += edx * mass;
        nearY += edy * mass;
        nearN += mass;
      }
      if (d < contact + 6) score -= 98000 * mass * panicMul;
      else if (d < contact + 72) score -= (27000 * mass * panicMul) / Math.max(8, d - (k ? k.r : 8));
      if (b.type === 'boom' && d < 92) score -= 5200 / Math.max(10, d) * panicMul;
      const w = killWeight(b);
      huntX += edx * w;
      huntY += edy * w;
      huntW += w;
    }

    if (nearN > 0) {
      const nd = hypot(nearX, nearY) || 1;
      const away = -(nearX / nd) * dx - (nearY / nd) * dy;
      const side = (-nearY / nd) * dx + (nearX / nd) * dy;
      if (closest < 54) score += away * 6800 * panicMul;
      else if (closest < 128) {
        score += away * 1500 * panicMul;
        score += Math.abs(side) * 1200;
        score += autoStrafe * side * 860;
      } else {
        score += autoStrafe * side * 300;
      }
    }

    const panic = !inv && closest < 50;
    if (!panic) {
      const egg = pickKickEgg();
      if (egg) {
        const eh = hexOut(egg.x - CX, egg.y - CY, egg.r);
        const behindX = egg.x - eh.nx * (egg.r + P_R + 12);
        const behindY = egg.y - eh.ny * (egg.r + P_R + 12);
        const bx = behindX - nx;
        const by = behindY - ny;
        const bd = hypot(bx, by) || 1;
        const hatch = clamp(egg.grow / Math.max(0.2, egg.max), 0, 1);
        const urge = 1.2 + hatch * 1.8;
        score += (22000 * urge) / (bd + 14);
        score += ((bx * dx + by * dy) / bd) * (3200 * urge);
        if (bd < 18) {
          score += (eh.nx * dx + eh.ny * dy) * 2400;
        }
      } else if (G.pick.length && closest > 70) {
        let bestP = null;
        let bestPd = 1e9;
        for (let i = 0; i < G.pick.length; i++) {
          const pk = G.pick[i];
          const d = hypot(pk.x - nx, pk.y - ny);
          if (d < bestPd) {
            bestPd = d;
            bestP = pk;
          }
        }
        if (bestP) {
          const pxd = bestP.x - nx;
          const pyd = bestP.y - ny;
          const pd = hypot(pxd, pyd) || 1;
          score += 14000 / (pd + 16);
          score += ((pxd * dx + pyd * dy) / pd) * 1800;
        }
      } else if (huntW > 0) {
        const hd = hypot(huntX, huntY) || 1;
        const chase = huntW <= 3 ? 2000 : 900;
        if (closest > 92) score += (huntX * dx + huntY * dy) / hd * chase;
        else if (closest < 64) score -= (huntX * dx + huntY * dy) / hd * 620;
      }
    }

    score += (dx * autoMove.x + dy * autoMove.y) * 500;
    score -= hypot(nx - CX, ny - CY) * 0.06;
    if (dx === 0 && dy === 0) score -= G.bugs.length || G.eggs.length ? 280 : 40;
    return score;
  }

  function autoThink() {
    if (G.deadT > 0) return;
    const look = 0.18;
    const reach = P_SPD * look;
    const px = G.player.x;
    const py = G.player.y;
    let bestS = -1e15;
    let bx = autoMove.x;
    let by = autoMove.y;
    const nDir = 16;
    for (let i = 0; i < nDir; i++) {
      const a = (TAU * i) / nDir;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const c = clampHex(px + dx * reach, py + dy * reach, P_R);
      const s = scoreAutoMove(c.x, c.y, dx, dy, look);
      if (s > bestS) {
        bestS = s;
        bx = dx;
        by = dy;
      }
    }
    const stay = scoreAutoMove(px, py, 0, 0, look);
    if (stay > bestS + 80) {
      bx = 0;
      by = 0;
      bestS = stay;
    }
    const curC = clampHex(px + autoMove.x * reach, py + autoMove.y * reach, P_R);
    const cur = scoreAutoMove(curC.x, curC.y, autoMove.x, autoMove.y, look);
    const danger = cur < -4000 || bestS < -4000;
    if (bestS > cur + (danger ? 40 : 160) || hypot(autoMove.x, autoMove.y) < 0.05) {
      autoMove.x = bx;
      autoMove.y = by;
    }

    autoWallT = Math.max(0, autoWallT - look);
    const next = clampHex(px + autoMove.x * 28, py + autoMove.y * 28, P_R);
    const nh = hexOut(next.x - CX, next.y - CY, P_R + 8);
    if (nh.d > -6) {
      if (autoWallT <= 0) {
        autoStrafe *= -1;
        autoWallT = 0.42;
      }
    }

    const tgt = pickAutoTarget();
    if (tgt) {
      const d = hypot(tgt.x - px, tgt.y - py);
      const t = Math.min(0.32, d / SHOT_SPD);
      const vx = tgt.vx || 0;
      const vy = tgt.vy || 0;
      const ax = tgt.x + vx * t - px;
      const ay = tgt.y + vy * t - py;
      const n = norm(ax, ay);
      if (n.l > 0.01) {
        autoAimV.x = n.x;
        autoAimV.y = n.y;
      }
    } else {
      autoAimV.x = 0;
      autoAimV.y = 0;
    }
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (AUTO_START_WAIT[autoSpeed] || 0.2)) {
        autoOvWait = 0;
        startGame(G.kind || 'web');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (AUTO_RETRY_WAIT[autoSpeed] || 0.7)) {
        autoOvWait = 0;
        startGame(G.kind || 'web');
      }
    }
  }

  function keepSpeed(b, spd) {
    const n = norm(b.vx, b.vy);
    if (n.l < 8) {
      const a = rand(0, TAU);
      b.vx = Math.cos(a) * spd;
      b.vy = Math.sin(a) * spd;
      return;
    }
    b.vx = n.x * spd;
    b.vy = n.y * spd;
  }

  function steer(b, tx, ty, amt, spd) {
    const n = norm(tx - b.x, ty - b.y);
    b.vx += n.x * amt;
    b.vy += n.y * amt;
    keepSpeed(b, spd);
  }

  function killBug(b, scored, blast) {
    const i = G.bugs.indexOf(b);
    if (i < 0) return;
    G.bugs.splice(i, 1);
    const k = KIND[b.type];
    splat(b.x, b.y, k.rgb, b.type === 'boom' ? 28 : 16);
    twangAt(b.x, b.y, 10);
    if (b.type === 'boom') {
      explode(b.x, b.y);
      if (scored && G.mode === 'play') {
        bumpCombo();
        addScore(k.score * G.mult, b.x, b.y, k.rgb, G.mult >= 3);
        hitStop(0.078);
        kick(6);
        boardKick('boom');
      }
      return;
    }
    if (scored && G.mode === 'play' && k.score) {
      bumpCombo();
      let pts = k.score;
      if (b.type === 'grub') pts = Math.max(50, 500 - (b.age * 80) | 0);
      if (blast) pts = 500;
      addScore(pts * G.mult, b.x, b.y, k.rgb, G.mult >= 3);
      hitStop(blast ? 0.04 : (b.type === 'beetle' ? 0.052 : 0.038));
      kick(blast ? 3 : 2.4);
      boardKick('hit');
    }
    if (k.drop && G.mode === 'play' && !blast) spawnPick(b.x, b.y);
    audio.splat(b.type);
  }

  function explode(x, y) {
    audio.boom();
    popRing(x, y, MAG, 14);
    emit(32, {
      x: x, y: y, j: 8,
      vx0: -280, vx1: 280, vy0: -280, vy1: 220,
      r0: 1.4, r1: 4.2, life: 0.5, rgb: MAG, g: 120
    });
    const R = 78;
    for (let i = G.bugs.length - 1; i >= 0; i--) {
      const b = G.bugs[i];
      if (b.type === 'slayer') continue;
      if (hypot(b.x - x, b.y - y) < R + b.r) killBug(b, G.mode === 'play', true);
    }
    for (let i = G.eggs.length - 1; i >= 0; i--) {
      const e = G.eggs[i];
      if (hypot(e.x - x, e.y - y) < R + e.r) {
        if (G.mode === 'play') {
          bumpCombo();
          addScore(500 * G.mult, e.x, e.y, EGGC, true);
        }
        splat(e.x, e.y, EGGC, 10);
        G.eggs.splice(i, 1);
      }
    }
  }

  function kickEggOff(e) {
    const i = G.eggs.indexOf(e);
    if (i < 0) return;
    G.eggs.splice(i, 1);
    G.kicks += 1;
    const pts = Math.min(2500, 500 * G.kicks);
    if (G.mode === 'play') {
      bumpCombo();
      addScore(pts * G.mult, e.x, e.y, GOLD, true);
    }
    splat(e.x, e.y, GOLD, 18);
    popRing(e.x, e.y, GOLD, 10);
    audio.kickEgg();
    hitStop(0.055);
    kick(4);
    boardKick('twang');
    toast('踢出 +' + (pts * G.mult), false, true);
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 1.15;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.why = why;
    splat(G.player.x, G.player.y, HOT2, 26);
    popRing(G.player.x, G.player.y, MAG, 12);
    audio.death();
    kick(8);
    hitStop(0.08);
    screenFlash(MAG, 0.65);
    boardKick('die');
    syncPips();
    toast(why, true, false);
  }

  function aimVector() {
    if (autoOn && G.mode === 'play') return norm(autoAimV.x, autoAimV.y);
    let ax = 0;
    let ay = 0;
    if (shoot.l) ax -= 1;
    if (shoot.r) ax += 1;
    if (shoot.u) ay -= 1;
    if (shoot.d) ay += 1;
    if (ax || ay) return norm(ax, ay);
    if (stickR.on && hypot(stickR.x, stickR.y) > 0.28) return norm(stickR.x, stickR.y);
    if (hypot(padShoot.x, padShoot.y) > 0.28) return norm(padShoot.x, padShoot.y);
    if (mouse.hover || mouse.down) {
      return norm(mouse.x - G.player.x, mouse.y - G.player.y);
    }
    return { x: Math.cos(G.player.aim), y: Math.sin(G.player.aim), l: 1 };
  }

  function wantFire() {
    if (overlayOpen() || G.mode !== 'play' || G.deadT > 0) return false;
    if (autoOn) {
      if (!autoTarget) return false;
      if (autoTarget.type === 'boom' && G.invuln <= 0) {
        if (hypot(autoTarget.x - G.player.x, autoTarget.y - G.player.y) < 86) return false;
      }
      return hypot(autoAimV.x, autoAimV.y) > 0.01;
    }
    if (fireHold || mouse.down) return true;
    if (shoot.u || shoot.d || shoot.l || shoot.r) return true;
    if (stickR.on && hypot(stickR.x, stickR.y) > 0.38) return true;
    if (hypot(padShoot.x, padShoot.y) > 0.38) return true;
    return false;
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0) return;
    if (G.fireCd > 0) return;
    if (G.shots.length >= MAX_SHOTS) return;
    const a = aimVector();
    if (a.l < 0.2 && !a.x && !a.y) return;
    const nx = a.x;
    const ny = a.y;
    G.player.aim = Math.atan2(ny, nx);
    G.fireCd = FIRE_CD;
    G.muzzle = 0.06;
    const nose = 14;
    const x = G.player.x + nx * nose;
    const y = G.player.y + ny * nose;
    G.shots.push({
      x: x, y: y,
      vx: nx * SHOT_SPD, vy: ny * SHOT_SPD,
      life: SHOT_LIFE
    });
    audio.shoot();
    if (!REDUCE) G.punch = Math.max(G.punch, 1.008);
    popSpark(x, y, CYN, 7);
    emit(3, {
      x: x, y: y, j: 1.4,
      vx0: nx * 40, vx1: nx * 120, vy0: ny * 40, vy1: ny * 120,
      r0: 0.7, r1: 1.6, life: 0.14, rgb: WHT, g: 0
    });
    twangAt(x, y, 3.5);
  }

  function moveInput() {
    if (autoOn && G.mode === 'play') return norm(autoMove.x, autoMove.y);
    let mx = 0;
    let my = 0;
    if (keys.l) mx -= 1;
    if (keys.r) mx += 1;
    if (keys.u) my -= 1;
    if (keys.d) my += 1;
    if (stickL.on && hypot(stickL.x, stickL.y) > 0.2) {
      mx = stickL.x;
      my = stickL.y;
    } else if (hypot(padMove.x, padMove.y) > 0.2) {
      mx = padMove.x;
      my = padMove.y;
    }
    return norm(mx, my);
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.deadT > 0) return;
    if (G.mode === 'title') {
      const a = G.t * 0.45;
      p.vx = Math.cos(a) * 52;
      p.vy = Math.sin(a * 0.85) * 40;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const c = clampHex(p.x, p.y, P_R);
      p.x = c.x;
      p.y = c.y;
      if (hypot(p.vx, p.vy) > 8) p.face = Math.atan2(p.vy, p.vx);
      p.aim = p.face;
      return;
    }
    if (overlayOpen()) return;
    const m = moveInput();
    const spd = P_SPD;
    p.vx = m.x * spd;
    p.vy = m.y * spd;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const c = clampHex(p.x, p.y, P_R);
    if (c.x !== p.x || c.y !== p.y) {
      const h = hexOut(p.x - CX, p.y - CY, P_R);
      if (h.d > 1.5) twangAt(p.x, p.y, 2.2);
    }
    p.x = c.x;
    p.y = c.y;
    if (m.l > 0.2) p.face = Math.atan2(m.y, m.x);
    const a = aimVector();
    if (a.l > 0.15) p.aim = Math.atan2(a.y, a.x);
    if (G.fireCd > 0) G.fireCd -= dt;
    if (wantFire()) fire();
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || !insideHex(s.x, s.y, 2)) {
        if (!insideHex(s.x, s.y, 2)) {
          twangAt(s.x, s.y, 4);
          popSpark(s.x, s.y, CYN, 5);
        }
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = G.bugs.length - 1; j >= 0; j--) {
        const b = G.bugs[j];
        if (hypot(b.x - s.x, b.y - s.y) < b.r + 3.2) {
          if (b.type === 'slayer') {
            popSpark(s.x, s.y, SLAY, 6);
            G.shots.splice(i, 1);
            hit = true;
            break;
          }
          G.shots.splice(i, 1);
          killBug(b, true, false);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      for (let j = 0; j < G.eggs.length; j++) {
        const e = G.eggs[j];
        if (hypot(e.x - s.x, e.y - s.y) < e.r + 3) {
          e.vx += s.vx * 0.22;
          e.vy += s.vy * 0.22;
          popSpark(s.x, s.y, EGGC, 6);
          twangAt(e.x, e.y, 5);
          G.shots.splice(i, 1);
          audio.twang(320);
          break;
        }
      }
    }
  }

  function updateBugs(dt) {
    const mul = spdMul();
    for (let i = G.bugs.length - 1; i >= 0; i--) {
      const b = G.bugs[i];
      const k = KIND[b.type];
      const spd = k.spd * mul;
      b.age += dt;
      b.spin += dt * (b.type === 'mosq' ? 14 : 4);
      if (b.cd > 0) b.cd -= dt;
      if (b.type === 'mosq') {
        if (Math.random() < 0.018) {
          steer(b, G.player.x + rand(-40, 40), G.player.y + rand(-40, 40), 70, spd);
        } else keepSpeed(b, spd);
      } else if (b.type === 'beetle') {
        const p = nearestPick(b.x, b.y);
        if (p) steer(b, p.x, p.y, 110, spd);
        else steer(b, G.player.x, G.player.y, 36, spd * 0.85);
      } else if (b.type === 'hornet') {
        const p = nearestPick(b.x, b.y);
        if (p) steer(b, p.x, p.y, 120, spd);
        else {
          if (Math.random() < 0.02) steer(b, G.player.x, G.player.y, 40, spd);
          else keepSpeed(b, spd);
        }
      } else if (b.type === 'grub') {
        steer(b, G.player.x, G.player.y, 90, spd);
      } else if (b.type === 'boom') {
        if (Math.random() < 0.012) {
          const a = rand(0, TAU);
          b.vx += Math.cos(a) * 30;
          b.vy += Math.sin(a) * 30;
        }
        keepSpeed(b, spd);
      } else if (b.type === 'slayer') {
        const prey = nearestBug(b.x, b.y, b);
        const pk = nearestPick(b.x, b.y);
        if (prey && (!pk || hypot(prey.x - b.x, prey.y - b.y) < hypot(pk.x - b.x, pk.y - b.y) + 20)) {
          steer(b, prey.x, prey.y, 130, spd);
        } else if (pk) steer(b, pk.x, pk.y, 100, spd);
        else keepSpeed(b, spd * 0.7);
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (bounceHex(b, k.r)) keepSpeed(b, spd);
    }
  }

  function updateEggs(dt) {
    const p = G.player;
    for (let i = G.eggs.length - 1; i >= 0; i--) {
      const e = G.eggs[i];
      e.grow += dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vx *= Math.exp(-dt * 2.4);
      e.vy *= Math.exp(-dt * 2.4);
      if (G.deadT <= 0) {
        const d = hypot(e.x - p.x, e.y - p.y);
        const min = e.r + P_R - 1;
        if (d < min && d > 0.01) {
          const n = norm(e.x - p.x, e.y - p.y);
          const push = (min - d);
          e.x += n.x * push;
          e.y += n.y * push;
          e.vx += n.x * 92 + p.vx * 0.35;
          e.vy += n.y * 92 + p.vy * 0.35;
          twangAt(e.x, e.y, 4);
        }
      }
      const h = hexOut(e.x - CX, e.y - CY, e.r);
      if (h.d > 0) {
        const vdot = e.vx * h.nx + e.vy * h.ny;
        if (vdot > 36 || h.d > 10) {
          kickEggOff(e);
          continue;
        }
        e.x -= h.nx * h.d;
        e.y -= h.ny * h.d;
        if (vdot > 0) {
          e.vx -= 2 * vdot * h.nx;
          e.vy -= 2 * vdot * h.ny;
          twangAt(e.x, e.y, 6);
        }
      }
      if (e.grow >= e.max) {
        const type = Math.random() < 0.55 ? 'mosq' : 'hornet';
        const k = KIND[type];
        const a = rand(0, TAU);
        spawnBug(type, e.x, e.y, Math.cos(a) * k.spd * spdMul(), Math.sin(a) * k.spd * spdMul());
        splat(e.x, e.y, EGGC, 12);
        audio.hatch();
        G.eggs.splice(i, 1);
      }
    }
  }

  function updatePick(dt) {
    for (let i = G.pick.length - 1; i >= 0; i--) {
      const p = G.pick[i];
      p.t += dt;
      if (p.t >= p.life) {
        G.pick.splice(i, 1);
        continue;
      }
      const c = clampHex(p.x, p.y, 7);
      p.x = c.x;
      p.y = c.y;
    }
  }

  function collide() {
    if (G.mode !== 'play') return;
    const p = G.player;
    for (let i = G.bugs.length - 1; i >= 0; i--) {
      const b = G.bugs[i];
      const k = KIND[b.type];
      if (b.type === 'slayer') {
        for (let j = G.bugs.length - 1; j >= 0; j--) {
          const o = G.bugs[j];
          if (o === b || o.type === 'slayer') continue;
          if (hypot(o.x - b.x, o.y - b.y) < o.r + b.r - 1) {
            splat(o.x, o.y, k.rgb, 10);
            G.bugs.splice(j, 1);
            if (j < i) i -= 1;
            audio.splat(o.type);
          }
        }
        for (let j = G.pick.length - 1; j >= 0; j--) {
          const pk = G.pick[j];
          if (hypot(pk.x - b.x, pk.y - b.y) < 16) G.pick.splice(j, 1);
        }
        continue;
      }
      if (b.type === 'beetle') {
        for (let j = G.pick.length - 1; j >= 0; j--) {
          const pk = G.pick[j];
          if (hypot(pk.x - b.x, pk.y - b.y) < 16) {
            G.pick.splice(j, 1);
            emit(6, {
              x: pk.x, y: pk.y, j: 3,
              vx0: -40, vx1: 40, vy0: -40, vy1: 20,
              r0: 1, r1: 2, life: 0.2, rgb: GOLD, g: 0
            });
          }
        }
      }
      if (b.type === 'hornet' && b.cd <= 0) {
        for (let j = G.pick.length - 1; j >= 0; j--) {
          const pk = G.pick[j];
          if (hypot(pk.x - b.x, pk.y - b.y) < 15) {
            G.pick.splice(j, 1);
            spawnEgg(pk.x, pk.y);
            b.cd = 0.85;
            audio.hatch();
            twangAt(pk.x, pk.y, 6);
            break;
          }
        }
      }
      if (G.deadT <= 0 && G.invuln <= 0 && k.lethal) {
        if (hypot(b.x - p.x, b.y - p.y) < b.r + P_R - 1.2) {
          killPlayer(k.why);
          return;
        }
      }
    }
    if (G.deadT > 0) return;
    for (let i = G.pick.length - 1; i >= 0; i--) {
      const pk = G.pick[i];
      if (hypot(pk.x - p.x, pk.y - p.y) < P_R + 9) {
        G.pick.splice(i, 1);
        bumpCombo();
        addScore(200 * G.mult, pk.x, pk.y, GOLD, true);
        audio.pickup();
        popSpark(pk.x, pk.y, GOLD, 10);
      }
    }
  }

  function updateQueue(dt) {
    for (let i = G.queue.length - 1; i >= 0; i--) {
      G.queue[i].t -= dt;
      if (G.queue[i].t <= 0) {
        spawnFromEdge(G.queue[i].type);
        G.queue.splice(i, 1);
      }
    }
  }

  function tryClear(dt) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (threatCount() > 0) {
      G.waveWait = 0;
      return;
    }
    if (G.waveWait <= 0) {
      G.waveWait = 0.85;
      return;
    }
    G.waveWait -= dt;
    if (G.waveWait > 0) return;
    addScore(200 * G.wave * G.mult, CX, CY - 20, GOLD, true);
    if (!isSwarm() && G.wave >= WEB_WAVES.length) {
      winRun();
      return;
    }
    G.wave += 1;
    G.kicks = 0;
    G.comboT = Math.max(G.comboT, 0.4);
    queueWave();
    audio.wave();
    toast('第 ' + G.wave + ' 波 · ' + waveName(), false, true);
    boardKick('twang');
    screenFlash(HOT, 0.28);
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.twangT = Math.max(0, G.twangT - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        if (comboEl) comboEl.textContent = '×1';
      }
    }
    if (G.invuln > 0) G.invuln -= dt;
    for (let i = 0; i < strands.length; i++) {
      const s = strands[i];
      if (s.amp > 0.15) {
        s.amp *= Math.exp(-dt * 5.5);
        s.ph += dt * 18;
      } else s.amp = 0;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.2);
      q.vy *= Math.exp(-dt * 1.2);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.34) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.ang += s.spin * dt;
      s.vx *= Math.exp(-dt * 0.8);
      s.vy *= Math.exp(-dt * 0.8);
      if (s.life <= 0) shards.splice(i, 1);
    }
  }

  function pollPad() {
    padMove.x = padMove.y = 0;
    padShoot.x = padShoot.y = 0;
    if (autoOn) return;
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    if (!pads) return;
    const gp = pads[0];
    if (!gp) return;
    const lx = gp.axes[0] || 0;
    const ly = gp.axes[1] || 0;
    const rx = gp.axes[2] || 0;
    const ry = gp.axes[3] || 0;
    if (hypot(lx, ly) > 0.22) {
      padMove.x = lx;
      padMove.y = ly;
    }
    if (hypot(rx, ry) > 0.26) {
      padShoot.x = rx;
      padShoot.y = ry;
    }
  }

  function playSim(dt) {
    if (G.ready > 0) G.ready -= dt;
    pollPad();
    updatePlayer(dt);
    updateQueue(dt);
    updateBugs(dt);
    updateEggs(dt);
    updatePick(dt);
    updateShots(dt);
    collide();
    if (G.mode === 'play' && G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '撞上虫子了');
          return;
        }
        G.player.x = CX;
        G.player.y = CY;
        G.player.vx = 0;
        G.player.vy = 0;
        G.invuln = 1.55;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
    }
    tryClear(dt);
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    tickAutoFlow(dt);
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }
    if (G.mode === 'title') {
      pollPad();
      updatePlayer(dt);
      updateBugs(dt);
      if (G.bugs.length < 5 && Math.random() < 0.02) spawnFromEdge('mosq');
      updateFx(dt);
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      updateBugs(dt);
      updateEggs(dt);
      updateShots(dt);
      updateFx(dt);
      return;
    }
    if (autoOn && G.deadT <= 0) autoThink();
    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function hexPath(r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 3;
      const x = sx(CX + Math.cos(ang) * r);
      const y = sy(CY + Math.sin(ang) * r);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawBg() {
    ctx.fillStyle = '#07010e';
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createRadialGradient(sx(CX), sy(CY), 20 * scale, sx(CX), sy(CY), HEX_R * 1.25 * scale);
    vg.addColorStop(0, 'rgba(224, 112, 255, 0.1)');
    vg.addColorStop(0.45, 'rgba(90, 20, 80, 0.08)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    hexPath(HEX_R + 8);
    ctx.fillStyle = vg;
    ctx.fill();
    hexPath(HEX_R);
    ctx.fillStyle = '#10041a';
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.85);
    ctx.lineWidth = 2.2 * scale;
    ctx.stroke();
    hexPath(HEX_R + 6);
    ctx.strokeStyle = rgba(MAG, 0.28);
    ctx.lineWidth = 6 * scale;
    ctx.stroke();
  }

  function drawWeb() {
    ctx.lineCap = 'round';
    for (let i = 0; i < strands.length; i++) {
      const s = strands[i];
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const len = hypot(dx, dy) || 1;
      const px = -dy / len;
      const py = dx / len;
      const midX = (s.x1 + s.x2) * 0.5;
      const midY = (s.y1 + s.y2) * 0.5;
      const off = s.amp * Math.sin(s.ph);
      ctx.beginPath();
      ctx.moveTo(sx(s.x1), sy(s.y1));
      if (s.amp > 0.4) {
        ctx.quadraticCurveTo(sx(midX + px * off), sy(midY + py * off), sx(s.x2), sy(s.y2));
      } else {
        ctx.lineTo(sx(s.x2), sy(s.y2));
      }
      ctx.strokeStyle = rgba(HOT, s.amp > 0.5 ? 0.85 : 0.32);
      ctx.lineWidth = (s.amp > 0.5 ? 1.8 : 1.05) * scale;
      ctx.stroke();
    }
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const a = REDUCE ? 0.35 : 0.22 + 0.28 * (0.5 + 0.5 * Math.sin(G.t * 2.2 + n.p));
      ctx.fillStyle = rgba(HOT2, a);
      ctx.beginPath();
      ctx.arc(sx(n.x), sy(n.y), 1.6 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPickups() {
    for (let i = 0; i < G.pick.length; i++) {
      const p = G.pick[i];
      const blink = p.t > p.life - 1.4 && ((G.t * 10) | 0) % 2 === 0;
      if (blink) continue;
      const bob = Math.sin(G.t * 4 + p.bob) * 2.2;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.rotate(G.t * 1.6 + p.bob);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 6.5 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.8);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(-2.2 * scale, -3.2 * scale);
      ctx.lineTo(2.2 * scale, -3.2 * scale);
      ctx.moveTo(0, -3.2 * scale);
      ctx.lineTo(0, 3.4 * scale);
      ctx.moveTo(-2.2 * scale, 3.4 * scale);
      ctx.lineTo(2.2 * scale, 3.4 * scale);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEggs() {
    for (let i = 0; i < G.eggs.length; i++) {
      const e = G.eggs[i];
      const g = clamp(e.grow / e.max, 0, 1);
      const rx = (7 + g * 5) * scale;
      const ry = (9 + g * 6) * scale;
      ctx.save();
      ctx.translate(sx(e.x), sy(e.y));
      ctx.fillStyle = rgba(EGGC, 0.22 + g * 0.25);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 3 * scale, ry + 3 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(EGGC, 0.92);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(BEET, 0.55 + g * 0.35);
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
      if (g > 0.55) {
        ctx.strokeStyle = rgba(MAG, 0.45);
        ctx.beginPath();
        ctx.moveTo(-rx * 0.3, -ry * 0.1);
        ctx.lineTo(rx * 0.15, ry * 0.35);
        ctx.moveTo(rx * 0.2, -ry * 0.25);
        ctx.lineTo(-rx * 0.05, ry * 0.2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawBugs() {
    for (let i = 0; i < G.bugs.length; i++) {
      const b = G.bugs[i];
      const k = KIND[b.type];
      const ang = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(sx(b.x), sy(b.y));
      ctx.rotate(ang);
      if (b.type === 'mosq') {
        ctx.strokeStyle = rgba(k.rgb, 0.9);
        ctx.lineWidth = 1.3 * scale;
        ctx.beginPath();
        ctx.moveTo(-8 * scale, 0);
        ctx.lineTo(8 * scale, 0);
        ctx.stroke();
        ctx.fillStyle = rgba(k.rgb, 0.55);
        ctx.beginPath();
        ctx.ellipse(-1 * scale, -4 * scale, 5 * scale, 2.4 * scale, -0.4, 0, TAU);
        ctx.ellipse(-1 * scale, 4 * scale, 5 * scale, 2.4 * scale, 0.4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.95);
        ctx.beginPath();
        ctx.arc(6 * scale, 0, 2.1 * scale, 0, TAU);
        ctx.fill();
      } else if (b.type === 'beetle') {
        ctx.fillStyle = rgba(k.rgb, 0.95);
        ctx.beginPath();
        ctx.ellipse(0, 0, 11 * scale, 8 * scale, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(WHT, 0.35);
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(0, -7 * scale);
        ctx.lineTo(0, 7 * scale);
        ctx.stroke();
        ctx.fillStyle = rgba([40, 20, 8], 0.9);
        ctx.beginPath();
        ctx.arc(7 * scale, 0, 3.2 * scale, 0, TAU);
        ctx.fill();
      } else if (b.type === 'hornet') {
        ctx.fillStyle = rgba(k.rgb, 0.95);
        ctx.beginPath();
        ctx.ellipse(0, 0, 10 * scale, 5.5 * scale, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(MAG, 0.8);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.moveTo(-4 * scale, -5 * scale);
        ctx.lineTo(-4 * scale, 5 * scale);
        ctx.moveTo(1 * scale, -5 * scale);
        ctx.lineTo(1 * scale, 5 * scale);
        ctx.stroke();
        ctx.fillStyle = rgba(WHT, 0.5);
        ctx.beginPath();
        ctx.ellipse(-2 * scale, -6 * scale, 4 * scale, 2 * scale, -0.3, 0, TAU);
        ctx.fill();
      } else if (b.type === 'grub') {
        for (let s = 0; s < 4; s++) {
          const oxp = (-6 + s * 4) * scale;
          const wob = Math.sin(b.spin + s) * 1.4 * scale;
          ctx.fillStyle = rgba(k.rgb, 0.7 + s * 0.07);
          ctx.beginPath();
          ctx.arc(oxp, wob, (3.4 - s * 0.25) * scale, 0, TAU);
          ctx.fill();
        }
      } else if (b.type === 'boom') {
        ctx.fillStyle = rgba(k.rgb, 0.9);
        ctx.beginPath();
        ctx.arc(0, 0, 10 * scale, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(GOLD, 0.85);
        ctx.lineWidth = 1.3 * scale;
        for (let s = 0; s < 6; s++) {
          const a = s * TAU / 6 + b.spin * 0.15;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 8 * scale, Math.sin(a) * 8 * scale);
          ctx.lineTo(Math.cos(a) * 14 * scale, Math.sin(a) * 14 * scale);
          ctx.stroke();
        }
      } else if (b.type === 'slayer') {
        ctx.fillStyle = rgba(k.rgb, 0.88);
        ctx.beginPath();
        ctx.arc(0, 0, 12 * scale, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(CYN, 0.9);
        ctx.lineWidth = 1.6 * scale;
        ctx.stroke();
        ctx.fillStyle = '#0b0312';
        ctx.beginPath();
        ctx.arc(4 * scale, -3 * scale, 2.2 * scale, 0, TAU);
        ctx.arc(4 * scale, 3 * scale, 2.2 * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(CYN, 1);
        ctx.beginPath();
        ctx.arc(4.6 * scale, -3 * scale, 0.9 * scale, 0, TAU);
        ctx.arc(4.6 * scale, 3 * scale, 0.9 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawShots() {
    ctx.lineCap = 'round';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const n = norm(s.vx, s.vy);
      ctx.strokeStyle = rgba(CYN, 0.95);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x - n.x * 7), sy(s.y - n.y * 7));
      ctx.lineTo(sx(s.x + n.x * 5), sy(s.y + n.y * 5));
      ctx.stroke();
      ctx.strokeStyle = rgba(HOT2, 0.7);
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x - n.x * 11), sy(s.y - n.y * 11));
      ctx.lineTo(sx(s.x), sy(s.y));
      ctx.stroke();
    }
  }

  function drawSpider() {
    const p = G.player;
    if (G.mode === 'play' && G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    const walk = hypot(p.vx, p.vy);
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1;
      const k = i % 4;
      const base = p.face + side * (0.5 + k * 0.34);
      const swing = Math.sin(G.t * 11 + k * 0.9 + (side < 0 ? 0 : 1.4)) * (0.16 + Math.min(0.22, walk * 0.0012));
      const ang = base + swing;
      const len = (12 + k * 1.6) * scale;
      ctx.strokeStyle = rgba(HOT2, 0.85);
      ctx.lineWidth = 1.35 * scale;
      ctx.beginPath();
      ctx.moveTo(Math.cos(p.face) * -2 * scale, Math.sin(p.face) * -2 * scale);
      const mx = Math.cos(ang) * len * 0.55;
      const my = Math.sin(ang) * len * 0.55;
      ctx.quadraticCurveTo(mx, my, Math.cos(ang) * len, Math.sin(ang) * len);
      ctx.stroke();
    }
    ctx.rotate(p.face);
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.ellipse(-6 * scale, 0, 8.5 * scale, 6.4 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 1);
    ctx.beginPath();
    ctx.ellipse(5 * scale, 0, 6.2 * scale, 5.2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(-5 * scale, 0);
    ctx.lineTo(-8.5 * scale, 3.2 * scale);
    ctx.lineTo(-7 * scale, 0);
    ctx.lineTo(-8.5 * scale, -3.2 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.arc(8.5 * scale, -2.1 * scale, 1.5 * scale, 0, TAU);
    ctx.arc(8.5 * scale, 2.1 * scale, 1.5 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();

    const ax = Math.cos(p.aim);
    const ay = Math.sin(p.aim);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(sx(p.x + ax * 14), sy(p.y + ay * 14), 5 * scale, 0, TAU);
      ctx.fill();
    }
    if (G.mode === 'play' && G.deadT <= 0) {
      ctx.strokeStyle = rgba(CYN, 0.22);
      ctx.lineWidth = 1 * scale;
      ctx.setLineDash([4 * scale, 5 * scale]);
      ctx.beginPath();
      ctx.moveTo(sx(p.x + ax * 16), sy(p.y + ay * 16));
      ctx.lineTo(sx(p.x + ax * 42), sy(p.y + ay * 42));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / (q.max || 0.4), 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const u = s.t / 0.34;
      ctx.strokeStyle = rgba(s.rgb, 1 - u);
      ctx.lineWidth = 1.2 * scale;
      for (let k = 0; k < s.n; k++) {
        const a = (k / s.n) * TAU;
        const r = (4 + u * 16) * scale;
        ctx.beginPath();
        ctx.moveTo(sx(s.x), sy(s.y));
        ctx.lineTo(sx(s.x) + Math.cos(a) * r, sy(s.y) + Math.sin(a) * r);
        ctx.stroke();
      }
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const u = r.t / 0.4;
      ctx.strokeStyle = rgba(r.rgb, 1 - u);
      ctx.lineWidth = (r.w * (1 - u * 0.6)) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + u * 38) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const a = clamp(s.life / (s.max || 0.4), 0, 1);
      const hx = Math.cos(s.ang) * s.len * 0.5;
      const hy = Math.sin(s.ang) * s.len * 0.5;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.3 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x - hx), sy(s.y - hy));
      ctx.lineTo(sx(s.x + hx), sy(s.y + hy));
      ctx.stroke();
    }
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(1 - f.t / f.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, 1);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    hexPath(HEX_R);
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
    ctx.fill();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#07010e';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(CX);
      const cy = sy(CY);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    ctx.save();
    hexPath(HEX_R - 0.5);
    ctx.clip();
    drawWeb();
    drawPickups();
    drawEggs();
    drawBugs();
    drawShots();
    drawSpider();
    drawFx();
    drawFlash();
    ctx.restore();
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function toWorld(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    const x = (clientX - r.left) * (W / Math.max(1, r.width));
    const y = (clientY - r.top) * (H / Math.max(1, r.height));
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function setStickKnob(el, x, y) {
    if (!el) return;
    const m = 22;
    el.style.transform = 'translate(' + (x * m) + 'px,' + (y * m) + 'px)';
  }

  function bindStick(pad, stick, knob) {
    if (!pad) return;
    pad.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (autoOn) return;
      stick.on = true;
      stick.id = e.pointerId;
      if (pad.setPointerCapture) {
        try { pad.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      moveStick(e, pad, stick, knob);
    });
    pad.addEventListener('pointermove', function (e) {
      if (!stick.on || stick.id !== e.pointerId) return;
      e.preventDefault();
      moveStick(e, pad, stick, knob);
    });
    function up(e) {
      if (stick.id != null && e && e.pointerId !== stick.id) return;
      stick.on = false;
      stick.id = null;
      stick.x = 0;
      stick.y = 0;
      setStickKnob(knob, 0, 0);
    }
    pad.addEventListener('pointerup', up);
    pad.addEventListener('pointercancel', up);
    pad.addEventListener('lostpointercapture', up);
  }

  function moveStick(e, pad, stick, knob) {
    const r = pad.getBoundingClientRect();
    const cx = r.left + r.width * 0.5;
    const cy = r.top + r.height * 0.5;
    const n = norm(e.clientX - cx, e.clientY - cy);
    const mag = Math.min(1, n.l / (r.width * 0.42));
    stick.x = n.x * mag;
    stick.y = n.y * mag;
    setStickKnob(knob, stick.x, stick.y);
  }

  function clearPlayKeys() {
    keys.u = keys.d = keys.l = keys.r = false;
    shoot.u = shoot.d = shoot.l = shoot.r = false;
    fireHold = false;
    mouse.down = false;
    stickL.on = stickR.on = false;
    stickL.x = stickL.y = stickR.x = stickR.y = 0;
    setStickKnob(knobL, 0, 0);
    setStickKnob(knobR, 0, 0);
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl || !speedLab) return;
    speedEl.value = String(autoSpeed);
    speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoTarget = null;
    syncAutoUi();
    if (autoOn) {
      clearPlayKeys();
      audio.ensure();
    } else {
      autoMove.x = 0;
      autoMove.y = 0;
    }
    syncHud();
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!(n >= 1 && n <= 4)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function autoScale() {
    if (!autoOn) return 1;
    if (G.mode === 'play') return AUTO_SCALE[autoSpeed] || 1;
    return 1;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code || '';
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      e.preventDefault();
      if (down && !e.repeat) toggleAuto();
      return;
    }
    const isUp = code === 'KeyW' || k === 'w' || k === 'W';
    const isDn = code === 'KeyS' || k === 's' || k === 'S';
    const isLf = code === 'KeyA' || k === 'a' || k === 'A';
    const isRt = code === 'KeyD' || k === 'd' || k === 'D';
    const shUp = code === 'ArrowUp' || code === 'KeyI' || k === 'i' || k === 'I';
    const shDn = code === 'ArrowDown' || code === 'KeyK' || k === 'k' || k === 'K';
    const shLf = code === 'ArrowLeft' || code === 'KeyJ' || k === 'j' || k === 'J';
    const shRt = code === 'ArrowRight' || code === 'KeyL' || k === 'l' || k === 'L';
    const isSp = code === 'Space' || k === ' ' || k === 'Spacebar';
    if (isUp || isDn || isLf || isRt || shUp || shDn || shLf || shRt || isSp) e.preventDefault();

    if ((autoOn || overlayOpen()) && (isUp || isDn || isLf || isRt || shUp || shDn || shLf || shRt || isSp)) {
      if (!down) {
        if (isUp) keys.u = false;
        if (isDn) keys.d = false;
        if (isLf) keys.l = false;
        if (isRt) keys.r = false;
        if (shUp) shoot.u = false;
        if (shDn) shoot.d = false;
        if (shLf) shoot.l = false;
        if (shRt) shoot.r = false;
        if (isSp) fireHold = false;
      }
    } else {
      if (isUp) keys.u = down;
      if (isDn) keys.d = down;
      if (isLf) keys.l = down;
      if (isRt) keys.r = down;
      if (shUp) shoot.u = down;
      if (shDn) shoot.d = down;
      if (shLf) shoot.l = down;
      if (shRt) shoot.r = down;
      if (isSp) fireHold = down;
    }

    if (!down) return;
    if (code === 'KeyM' || k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (code === 'KeyR' || k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (e.repeat) return;
    if (isSp || k === 'Enter') {
      if (e.target && e.target.tagName === 'BUTTON') return;
      if (autoOn) return;
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
    }
    if ((k === '1' || code === 'Digit1') && overlayOpen() && G.mode === 'title') startGame('web');
    if ((k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') startGame('swarm');
  }

  function selfCheck() {
    const c = hexOut(0, 0, 0);
    if (c.d >= 0) throw new Error('hex center');
    const top = hexOut(0, -HEX_R, 0);
    if (Math.abs(top.d) > 1.2) throw new Error('hex vertex');
    G.combo = 0;
    if (comboMult() !== 1) throw new Error('combo0');
    G.combo = 4;
    if (comboMult() !== 2) throw new Error('combo');
    G.combo = 0;
    const w1 = waveSpec('web', 1);
    if (w1.mosq < 1) throw new Error('wave1');
    const s1 = waveSpec('swarm', 4);
    if (s1.boom < 1) throw new Error('swarm boom');
    if (clamp(3, 0, 2) !== 2) throw new Error('clamp');
    const sm = scoreAutoMove(CX, CY, 1, 0, 0.18);
    if (!isFinite(sm)) throw new Error('scoreAutoMove');
    return true;
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
    if (autoOn && autoSpeed >= 3 && G.mode === 'play') G.stop = 0;
    const aScale = autoScale();
    acc += dt * aScale;
    let n = 0;
    const maxSteps = autoOn ? (aScale >= 8 ? 48 : aScale >= 4 ? 24 : 12) : 5;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc >= STEP) acc = 0;
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  buildWeb();
  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  selfCheck();
  goTitle();
  resize();
  bindStick(vpadL, stickL, knobL);
  bindStick(vpadR, stickR, knobR);

  if (btnWeb) btnWeb.addEventListener('click', function () { audio.ensure(); startGame('web'); });
  if (btnSwarm) btnSwarm.addEventListener('click', function () { audio.ensure(); startGame('swarm'); });
  if (ovAgain) ovAgain.addEventListener('click', function () { audio.ensure(); primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); goTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnAuto) btnAuto.addEventListener('click', function () {
    audio.ensure();
    toggleAuto();
  });
  if (speedEl) {
    speedEl.addEventListener('input', function () { setAutoSpeed(speedEl.value); });
    speedEl.addEventListener('change', function () { setAutoSpeed(speedEl.value); });
  }
  if (modeWeb) {
    modeWeb.addEventListener('click', function () {
      audio.ensure();
      G.kind = 'web';
      G.best = currentBest();
      if (G.mode === 'title') {
        syncHud();
        return;
      }
      startGame('web');
    });
  }
  if (modeSwarm) {
    modeSwarm.addEventListener('click', function () {
      audio.ensure();
      G.kind = 'swarm';
      G.best = currentBest();
      if (G.mode === 'title') {
        syncHud();
        return;
      }
      startGame('swarm');
    });
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      audio.ensure();
      if (e.button != null && e.button !== 0) return;
      const w = toWorld(e.clientX, e.clientY);
      mouse.x = w.x;
      mouse.y = w.y;
      mouse.hover = true;
      if (overlayOpen()) {
        if (autoOn) return;
        if (e.pointerType !== 'touch') primaryAction();
        return;
      }
      if (autoOn) return;
      if (G.mode === 'play') {
        mouse.down = true;
        fire();
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      e.preventDefault();
      const w = toWorld(e.clientX, e.clientY);
      mouse.x = w.x;
      mouse.y = w.y;
      mouse.hover = true;
    });
    function ptrUp() { mouse.down = false; }
    canvas.addEventListener('pointerup', ptrUp);
    canvas.addEventListener('pointercancel', ptrUp);
    canvas.addEventListener('lostpointercapture', ptrUp);
    canvas.addEventListener('pointerleave', function () {
      mouse.hover = false;
      mouse.down = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', clearPlayKeys);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) clearPlayKeys();
  });

  requestAnimationFrame(frame);
})();
