'use strict';

(function () {
  const VW = 420;
  const VH = 740;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const BALL_R = 7.3;
  const LIVES = 3;
  const MAX_BALLS = 4;
  const MAX_SPD = 1240;
  const L = 20;
  const PF = 348;
  const PL = 356;
  const PR = 404;
  const ARCH_CX = 184;
  const ARCH_CY = 196;
  const ARCH_R = 164;
  const FLIP_Y = 642;
  const FLIP_L = 102;
  const FLIP_R = 266;
  const FLIP_LEN = 70;
  const FLIP_HALF = 7.2;
  const REST_ANG = 0.4;
  const ACT_ANG = -0.62;
  const DRAIN_Y = 708;
  const COMBO_WIN = 1.28;
  const BEST_KEY = 'playbox-pin-ball-best';
  const MUTE_KEY = 'playbox-pin-ball-mute';
  const AUTO_SPEED_KEY = 'playbox-pin-ball-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const OPS = 'Z 左 · M 右 · 空格发射 · 点左右半边弹板 · A 自动';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 34];
  const WHT = [255, 248, 236];
  const PUR = [209, 76, 255];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnClassic = document.getElementById('btn-classic');
  const btnCrazy = document.getElementById('btn-crazy');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboLabel = document.getElementById('combo-label');
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
  let kickTok = 0;

  const keys = { l: false, r: false, space: false };
  const ptrs = [];
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'classic',
    t: 0,
    clock: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    balls: [],
    walls: [],
    bumpers: [],
    posts: [],
    slings: [],
    rolls: [],
    saucer: null,
    flipL: null,
    flipR: null,
    plungerY: 678,
    power: 0,
    charging: false,
    waiting: true,
    multi: false,
    litNeed: 3,
    extra: false,
    maxCombo: 0,
    multiballs: 0,
    shake: 0,
    kickX: 0,
    kickY: 0,
    punch: 1,
    flash: 0,
    flashRgb: HOT,
    toastT: 0,
    stop: 0,
    lock: 0,
    capture: 0,
    captured: null,
    demoLaunch: 0.4,
    wallCd: 0
  };

  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoPlunge = 0;
  let autoHoldL = 0;
  let autoHoldR = 0;

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
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function grav() {
    return G.kind === 'crazy' ? 1020 : 1480;
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
      const n = 0.09;
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
    bumper(combo) {
      this.ensure();
      const p = 1 + Math.min(8, combo) * 0.045;
      this.beep(660 * p, 0.07, 'triangle', 0.055, 1320 * p);
      this.beep(990 * p, 0.09, 'sine', 0.04, 1480 * p);
      this.noise(0.03, 0.025, 1800);
    },
    sling() {
      this.ensure();
      this.noise(0.04, 0.04, 700);
      this.beep(210, 0.05, 'square', 0.04, 380);
    },
    flip() {
      this.ensure();
      this.noise(0.025, 0.02, 400);
      this.beep(140, 0.04, 'sawtooth', 0.03, 90);
    },
    flipHit() {
      this.ensure();
      this.beep(280, 0.06, 'triangle', 0.05, 520);
      this.noise(0.03, 0.028, 900);
    },
    wall(hard) {
      this.ensure();
      this.beep(hard ? 220 : 170, 0.03, 'square', hard ? 0.028 : 0.014);
    },
    roll() {
      this.ensure();
      this.beep(920, 0.05, 'sine', 0.04, 1240);
    },
    saucer() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.05, 220);
      this.beep(220, 0.16, 'triangle', 0.04, 110);
    },
    eject() {
      this.ensure();
      this.beep(180, 0.06, 'sawtooth', 0.045, 640);
      this.beep(720, 0.1, 'sine', 0.04, 1100);
    },
    plunge() {
      this.ensure();
      this.beep(90, 0.08, 'sawtooth', 0.05, 420);
      this.beep(540, 0.12, 'triangle', 0.04, 880);
    },
    charge() {
      this.ensure();
      this.beep(120 + G.power * 280, 0.04, 'sine', 0.02);
    },
    drain() {
      this.ensure();
      this.beep(240, 0.16, 'sine', 0.05, 70);
      this.beep(140, 0.22, 'triangle', 0.04, 50);
    },
    multi() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.06);
      this.beep(659, 0.12, 'sine', 0.055);
      this.beep(784, 0.16, 'triangle', 0.05);
      this.beep(1046, 0.28, 'sine', 0.055, 1560);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'sine', 0.05, 1175);
      this.beep(1175, 0.16, 'triangle', 0.045);
    },
    comboDrop() {
      this.ensure();
      this.beep(440, 0.08, 'sine', 0.03, 180);
    },
    miss() {
      this.ensure();
      this.beep(180, 0.14, 'sine', 0.045, 70);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.055);
      this.beep(784, 0.2, 'triangle', 0.05, 1400);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
      this.beep(523, 0.12, 'triangle', 0.04);
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

  autoSpeed = loadAutoSpeed();

  function saveBest() {
    if (G.mode !== 'play' || G.score <= G.best) return;
    G.best = G.score;
    if (bestEl) bestEl.textContent = String(G.best);
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n, x, y, rgb) {
    if (G.mode !== 'play' || n <= 0) return;
    const v = n * G.mult;
    G.score += v;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= 18000 && !G.extra) {
      G.extra = true;
      G.lives += 1;
      syncPips();
      toast('再来一球', false, true);
      audio.extra();
      juice(x || ARCH_CX, y || 240, GOLD, 1);
    }
    if (scoreBox && scoreAdd) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
      addTok += 1;
      const tok = addTok;
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + v;
      scoreAdd.style.animation = 'none';
      void scoreAdd.offsetWidth;
      scoreAdd.style.animation = '';
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    if (x != null) {
      floats.push({
        x: x, y: y, text: '+' + v,
        life: 0.7, max: 0.7, vy: -46,
        rgb: rgb || GOLD
      });
      if (floats.length > 18) floats.splice(0, floats.length - 18);
    }
    syncHud();
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
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > n) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const crazy = G.kind === 'crazy';
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '弹珠';
      else stageLabel.textContent = crazy ? '疯狂' : '一球三命';
      stageLabel.classList.toggle('hot', G.mode === 'win' || G.multi);
    }
    if (tagLabel) {
      if (G.multi) tagLabel.textContent = '多球';
      else if (G.mode === 'lose') tagLabel.textContent = '漏球';
      else if (G.mode === 'win') tagLabel.textContent = '新纪录';
      else tagLabel.textContent = crazy ? 'WILD' : 'PIN';
      tagLabel.classList.toggle('hot', G.multi || G.mode === 'win');
      tagLabel.classList.toggle('warn', G.mode === 'lose');
    }
    if (comboLabel) {
      if (G.combo >= 2 && (G.mode === 'play' || G.mode === 'title')) {
        comboLabel.hidden = false;
        comboLabel.textContent = '×' + G.mult + ' 连' + G.combo;
        comboLabel.classList.toggle('hot', G.combo >= 5);
      } else {
        comboLabel.hidden = true;
      }
    }
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showCrazy) {
    autoOvWait = 0;
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'win' ? 'RECORD' : kind === 'lose' ? 'DRAIN' : 'PIN';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnClassic.textContent = primary;
    btnCrazy.classList.toggle('hidden', !showCrazy);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(nx, ny, mag) {
    if (REDUCE) return;
    G.kickX += nx * mag;
    G.kickY += ny * mag;
    G.shake = Math.max(G.shake, mag * 0.55);
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.003));
    if (!stageEl) return;
    kickTok += 1;
    stageEl.classList.remove('cut');
    void stageEl.offsetWidth;
    if (mag >= 4) stageEl.classList.add('cut');
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.42);
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb
      });
    }
    if (particles.length > 220) particles.splice(0, particles.length - 220);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    if (sparks.length > 28) sparks.splice(0, sparks.length - 28);
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    if (rings.length > 18) rings.splice(0, rings.length - 18);
  }

  function juice(x, y, rgb, power, nx, ny) {
    const p = power || 1;
    const n = 8 + (p * 10) | 0;
    emit(n, {
      x: x, y: y, j: 8 + p * 6,
      vx0: -160 * p, vx1: 160 * p, vy0: -200 * p, vy1: 80 * p,
      life: 0.28 + p * 0.16, r0: 1, r1: 2.8 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 12 + p * 10);
    screenFlash(rgb, 0.28 + p * 0.18);
    const kx = nx == null ? rand(-1, 1) : nx;
    const ky = ny == null ? rand(-1, 0.2) : ny;
    const kn = hypot(kx, ky) || 1;
    kick(kx / kn, ky / kn, 3.2 + p * 3.4);
    hitStop(p >= 1.6 ? 0.068 : p >= 1.2 ? 0.042 : 0.03);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = 1 + Math.min(7, Math.floor((G.combo - 1) / 2));
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    if (comboLabel && G.combo >= 2) {
      comboLabel.classList.remove('hot');
      void comboLabel.offsetWidth;
      comboLabel.classList.add('hot');
    }
    syncHud();
  }

  function makeBall(x, y, vx, vy) {
    return {
      x: x, y: y, vx: vx || 0, vy: vy || 0,
      r: BALL_R, dead: false, lane: false, trail: []
    };
  }

  function inLane(b) {
    return b.x > PF + 2;
  }

  function seg(x1, y1, x2, y2, opt) {
    opt = opt || {};
    return {
      x1: x1, y1: y1, x2: x2, y2: y2,
      rest: opt.rest == null ? 0.48 : opt.rest,
      kick: opt.kick || 0,
      thick: opt.thick == null ? 2.4 : opt.thick,
      kind: opt.kind || 'wall',
      gate: !!opt.gate,
      rgb: opt.rgb || CYN
    };
  }

  function addPoly(walls, pts, opt) {
    for (let i = 1; i < pts.length; i++) {
      walls.push(seg(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], opt));
    }
  }

  function makeFlip(x, y, left) {
    return {
      x: x, y: y, left: left,
      ang: left ? REST_ANG : Math.PI - REST_ANG,
      prev: left ? REST_ANG : Math.PI - REST_ANG,
      omega: 0, glow: 0, hitCd: 0, was: false
    };
  }

  function flipTarget(f, up) {
    if (f.left) return up ? ACT_ANG : REST_ANG;
    return up ? Math.PI - ACT_ANG : Math.PI - REST_ANG;
  }

  function flipTip(f) {
    return {
      x: f.x + Math.cos(f.ang) * FLIP_LEN,
      y: f.y + Math.sin(f.ang) * FLIP_LEN
    };
  }

  function buildTable() {
    const walls = [];
    const bumpers = [];
    const posts = [];
    const slings = [];
    const rolls = [];
    const crazy = G.kind === 'crazy';

    const arch = [];
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI * (1 - i / 18);
      arch.push([
        ARCH_CX + ARCH_R * Math.cos(a),
        ARCH_CY - ARCH_R * Math.sin(a)
      ]);
    }
    addPoly(walls, arch, { rest: 0.58, kind: 'wall', rgb: HOT });

    addPoly(walls, [[L, ARCH_CY], [L, 448]], { rest: 0.5, rgb: CYN });
    addPoly(walls, [[L, 448], [88, 622], [98, 638]], { rest: 0.46, rgb: CYN });
    addPoly(walls, [[PF, ARCH_CY], [PF, 448]], { rest: 0.5, rgb: CYN });
    addPoly(walls, [[PF, 448], [280, 622], [270, 638]], { rest: 0.46, rgb: CYN });

    addPoly(walls, [[PL, 710], [PL, 118]], { rest: 0.42, rgb: CYN });
    addPoly(walls, [[PR, 710], [PR, 86]], { rest: 0.42, rgb: CYN });
    addPoly(walls, [
      [PL, 118], [PL, 72], [346, 44], [310, 30], [262, 28]
    ], { rest: 0.28, rgb: GOLD });
    addPoly(walls, [
      [PR, 86], [402, 48], [386, 26], [352, 14], [300, 10], [240, 16]
    ], { rest: 0.38, rgb: HOT });
    walls.push(seg(330, 70, PL, 118, { rest: 0.4, gate: true, rgb: GOLD }));
    addPoly(walls, [[PL, 710], [PR, 710]], { rest: 0.2, kind: 'gutter', rgb: MAG });

    slings.push({
      x1: 64, y1: 496, x2: 104, y2: 572,
      rest: 1.15, kick: 620, thick: 5.5, cd: 0, rgb: MAG
    });
    slings.push({
      x1: 304, y1: 496, x2: 264, y2: 572,
      rest: 1.15, kick: 620, thick: 5.5, cd: 0, rgb: MAG
    });
    addPoly(walls, [[46, 478], [46, 558], [104, 572]], { rest: 0.4, rgb: MAG });
    addPoly(walls, [[322, 478], [322, 558], [264, 572]], { rest: 0.4, rgb: MAG });

    function bumper(x, y, r, rgb, pts) {
      bumpers.push({
        x: x, y: y, r: r, rgb: rgb, pts: pts || 100,
        lit: false, flash: 0, punch: 1, cd: 0
      });
    }
    bumper(118, 214, 20, HOT, 100);
    bumper(184, 168, 23, GOLD, 150);
    bumper(250, 214, 20, MAG, 100);
    if (crazy) {
      bumper(92, 286, 16, CYN, 80);
      bumper(184, 258, 17, PUR, 90);
      bumper(276, 286, 16, CYN, 80);
      bumper(184, 328, 14, HOT, 70);
    }

    posts.push({ x: FLIP_L, y: FLIP_Y, r: 8.4, rgb: CYN });
    posts.push({ x: FLIP_R, y: FLIP_Y, r: 8.4, rgb: CYN });
    posts.push({ x: 58, y: 488, r: 6.2, rgb: MAG });
    posts.push({ x: 310, y: 488, r: 6.2, rgb: MAG });
    posts.push({ x: 128, y: 92, r: 5.4, rgb: GOLD });
    posts.push({ x: 240, y: 92, r: 5.4, rgb: GOLD });
    addPoly(walls, [[128, 92], [128, 118]], { rest: 0.45, rgb: GOLD, thick: 3 });
    addPoly(walls, [[240, 92], [240, 118]], { rest: 0.45, rgb: GOLD, thick: 3 });

    rolls.push({ x: 86, y: 78, w: 36, h: 16, on: false, cd: 0 });
    rolls.push({ x: 166, y: 52, w: 36, h: 16, on: false, cd: 0 });
    rolls.push({ x: 246, y: 78, w: 36, h: 16, on: false, cd: 0 });

    G.walls = walls;
    G.bumpers = bumpers;
    G.posts = posts;
    G.slings = slings;
    G.rolls = rolls;
    G.saucer = { x: 64, y: 312, r: 12, hold: 0, flash: 0 };
    G.flipL = makeFlip(FLIP_L, FLIP_Y, true);
    G.flipR = makeFlip(FLIP_R, FLIP_Y, false);
    G.litNeed = crazy ? 4 : 3;
  }

  function clearFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
  }

  function spawnPlungerBall() {
    const b = makeBall((PL + PR) * 0.5, G.plungerY - BALL_R - 1, 0, 0);
    b.lane = true;
    G.balls.push(b);
    G.waiting = true;
    G.power = 0;
    G.charging = false;
    autoPlunge = 0;
  }

  function resetRun(kind, play) {
    G.kind = kind || 'classic';
    G.lives = LIVES;
    G.score = play ? 0 : G.score;
    if (play) G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.maxCombo = 0;
    G.multiballs = 0;
    G.multi = false;
    G.extra = false;
    G.balls = [];
    G.power = 0;
    G.charging = false;
    G.waiting = true;
    G.plungerY = 678;
    G.stop = 0;
    G.lock = 0;
    G.capture = 0;
    G.captured = null;
    G.shake = 0;
    G.kickX = 0;
    G.kickY = 0;
    G.flash = 0;
    G.punch = 1;
    clearFx();
    buildTable();
    spawnPlungerBall();
    if (play) {
      G.mode = 'play';
      hideOverlay();
      audio.start();
      toast(G.kind === 'crazy' ? '疯狂 · 重力更轻' : '一球三命', false, G.kind === 'crazy');
      setHint('Z 左 · M 右 · 空格蓄力发射', '');
    } else {
      G.mode = 'title';
      G.demoLaunch = 0.55;
      showOverlay('title', '弹珠', '弹板一磕，连撞爆炸。', '一球三命', true);
      setHint('Z 左弹板 · M 右弹板 · 空格发射 · 点左右半边也能打', '');
    }
    syncHud();
  }

  function startClassic() {
    audio.ensure();
    resetRun('classic', true);
  }

  function startCrazy() {
    audio.ensure();
    resetRun('crazy', true);
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') {
      startClassic();
      return;
    }
    resetRun(G.kind, true);
  }

  function loseRun() {
    G.mode = 'lose';
    G.waiting = true;
    audio.lose();
    screenFlash(MAG, 0.7);
    kick(0, 1, 9);
    hitStop(0.08);
    if (stageEl) {
      stageEl.classList.remove('die');
      void stageEl.offsetWidth;
      if (!REDUCE) stageEl.classList.add('die');
    }
    const beat = G.score >= G.best && G.score > 0;
    const title = beat ? '新纪录' : '球漏尽了';
    const lead = '得分 ' + G.score + (G.maxCombo >= 6 ? ' · 最高连撞 ' + G.maxCombo : '') +
      (G.multiballs ? ' · 多球 ' + G.multiballs + ' 次' : '') + '。';
    showOverlay(beat ? 'win' : 'lose', title, lead, '再来', false);
    setHint(beat ? '新纪录' : '球漏尽了', beat ? 'hot' : 'warn');
    if (beat) audio.win();
    syncHud();
  }

  function liveBalls() {
    const a = [];
    for (let i = 0; i < G.balls.length; i++) {
      if (!G.balls[i].dead) a.push(G.balls[i]);
    }
    return a;
  }

  function pruneBalls() {
    const keep = [];
    for (let i = 0; i < G.balls.length; i++) {
      if (!G.balls[i].dead) keep.push(G.balls[i]);
    }
    G.balls = keep;
  }

  function startMultiball(x, y) {
    if (G.mode !== 'play') return;
    G.multi = true;
    G.multiballs += 1;
    toast('多球', false, true);
    audio.multi();
    juice(x, y, GOLD, 1.8, 0, -1);
    hitStop(0.08);
    screenFlash(GOLD, 0.8);
    pruneBalls();
    const live = liveBalls();
    const src = live[0] || { x: ARCH_CX, y: 220, vx: 0, vy: -200 };
    const spots = [
      [184, 200], [118, 230], [250, 230]
    ];
    const want = G.kind === 'crazy' ? 4 : 3;
    let k = 0;
    while (G.balls.length < want && k < spots.length) {
      const s = spots[k];
      const ang = -1.2 + k * 0.7 + rand(-0.2, 0.2);
      const spd = 420 + k * 40;
      G.balls.push(makeBall(s[0], s[1], Math.cos(ang) * spd, Math.sin(ang) * spd));
      k += 1;
    }
    if (src && src.vy > -40) src.vy = -360;
    for (let i = 0; i < G.bumpers.length; i++) G.bumpers[i].lit = false;
    addScore(1000, x, y, GOLD);
    syncHud();
  }

  function checkLit(x, y) {
    let n = 0;
    for (let i = 0; i < G.bumpers.length; i++) {
      if (G.bumpers[i].lit) n += 1;
    }
    if (n >= G.litNeed && !G.multi) startMultiball(x, y);
  }

  function checkRolls(x, y) {
    let n = 0;
    for (let i = 0; i < G.rolls.length; i++) {
      if (G.rolls[i].on) n += 1;
    }
    if (n >= G.rolls.length) {
      for (let i = 0; i < G.rolls.length; i++) G.rolls[i].on = false;
      toast('顶道全亮', false, true);
      audio.extra();
      juice(x, y, CYN, 1.3);
      addScore(500, x, y, CYN);
      if (!G.multi) {
        let lit = 0;
        for (let i = 0; i < G.bumpers.length; i++) {
          if (!G.bumpers[i].lit) {
            G.bumpers[i].lit = true;
            lit += 1;
            if (lit >= 2) break;
          }
        }
        checkLit(x, y);
      }
    }
  }

  function launch() {
    const live = liveBalls();
    let ball = null;
    for (let i = 0; i < live.length; i++) {
      if (inLane(live[i]) && live[i].y > 520) {
        ball = live[i];
        break;
      }
    }
    if (!ball || !G.waiting) return;
    const p = clamp(G.power, 0.18, 1);
    ball.vx = rand(-8, 8);
    ball.vy = -lerp(520, 1080, p);
    ball.lane = true;
    G.waiting = false;
    G.charging = false;
    G.power = 0;
    autoPlunge = 0;
    audio.plunge();
    juice(ball.x, ball.y, CYN, 0.85, 0, -1);
    emit(10, {
      x: ball.x, y: ball.y, j: 4,
      vx0: -40, vx1: 40, vy0: -220, vy1: -40,
      life: 0.32, r0: 1, r1: 2.4, rgb: GOLD
    });
  }

  function drainBall(b) {
    if (b.dead) return;
    b.dead = true;
    pruneBalls();
    audio.drain();
    juice(b.x, Math.min(b.y, DRAIN_Y), MAG, 1.15, 0, 1);
    hitStop(0.055);
    const left = liveBalls();
    if (left.length > 0) {
      if (G.multi && left.length === 1) {
        G.multi = false;
        toast('多球结束', true, false);
        syncHud();
      }
      return;
    }
    G.multi = false;
    if (G.mode !== 'play') {
      G.lock = 0.35;
      return;
    }
    G.lives -= 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncPips();
    audio.miss();
    if (G.lives <= 0) {
      loseRun();
      return;
    }
    toast('还剩 ' + G.lives + ' 球', true, false);
    G.lock = 0.55;
    setHint('空格蓄力发射', 'warn');
    syncHud();
  }

  function hitCapsule(b, x1, y1, x2, y2, rad, rest, kickAmt, svx, svy) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = 0;
    if (len2 > 1e-6) t = ((b.x - x1) * dx + (b.y - y1) * dy) / len2;
    t = clamp(t, 0, 1);
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    let nx = b.x - px;
    let ny = b.y - py;
    let dist = hypot(nx, ny);
    const minD = b.r + rad;
    if (dist >= minD) return 0;
    if (dist < 1e-5) {
      nx = -dy;
      ny = dx;
      dist = hypot(nx, ny) || 1;
    }
    nx /= dist;
    ny /= dist;
    const overlap = minD - dist;
    b.x += nx * (overlap + 0.05);
    b.y += ny * (overlap + 0.05);
    const rvx = b.vx - (svx || 0);
    const rvy = b.vy - (svy || 0);
    const vn = rvx * nx + rvy * ny;
    if (kickAmt > 0) {
      if (vn < kickAmt) {
        b.vx += (kickAmt - vn) * nx;
        b.vy += (kickAmt - vn) * ny;
      }
      return vn < 8 ? Math.max(-vn, 24) : 0;
    }
    if (vn >= 0) return 0;
    const j = -(1 + rest) * vn;
    b.vx += j * nx;
    b.vy += j * ny;
    return -vn;
  }

  function hitCircle(b, cx, cy, cr, rest, kickAmt) {
    let dx = b.x - cx;
    let dy = b.y - cy;
    let d = hypot(dx, dy);
    const min = b.r + cr;
    if (d >= min) return 0;
    if (d < 1e-5) {
      dx = 0;
      dy = -1;
      d = 1;
    }
    const nx = dx / d;
    const ny = dy / d;
    const overlap = min - d;
    b.x += nx * (overlap + 0.05);
    b.y += ny * (overlap + 0.05);
    const vn = b.vx * nx + b.vy * ny;
    if (kickAmt > 0) {
      if (vn < kickAmt) {
        b.vx += (kickAmt - vn) * nx;
        b.vy += (kickAmt - vn) * ny;
      }
      return vn < 24 ? Math.max(-vn, 40) : 0;
    }
    if (vn < 0) {
      b.vx -= (1 + rest) * vn * nx;
      b.vy -= (1 + rest) * vn * ny;
      return -vn;
    }
    return 0;
  }

  function clampSpd(b) {
    const s = hypot(b.vx, b.vy);
    if (s > MAX_SPD) {
      b.vx = b.vx / s * MAX_SPD;
      b.vy = b.vy / s * MAX_SPD;
    }
  }

  function collideWalls(b) {
    for (let i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      if (w.gate && b.vx <= 30 && b.x > PF) continue;
      if (w.gate && b.vx < 0) continue;
      const imp = hitCapsule(b, w.x1, w.y1, w.x2, w.y2, w.thick, w.rest, 0, 0, 0);
      if (imp > 360 && G.wallCd <= 0 && w.kind !== 'gutter') {
        G.wallCd = 0.06;
        audio.wall(imp > 480);
        if (imp > 420) {
          emit(5, {
            x: b.x, y: b.y, j: 4,
            vx0: -60, vx1: 60, vy0: -80, vy1: 20,
            life: 0.2, r0: 0.6, r1: 1.6, rgb: w.rgb || CYN
          });
          kick(0, 0, 1.6);
        }
      }
    }
  }

  function collidePosts(b) {
    for (let i = 0; i < G.posts.length; i++) {
      const p = G.posts[i];
      hitCircle(b, p.x, p.y, p.r, 0.42, 0);
    }
  }

  function collideBumpers(b) {
    for (let i = 0; i < G.bumpers.length; i++) {
      const bp = G.bumpers[i];
      let dx = b.x - bp.x;
      let dy = b.y - bp.y;
      const min = b.r + bp.r;
      if (dx * dx + dy * dy >= min * min) continue;
      const kickAmt = G.kind === 'crazy' ? 640 : 580;
      const imp = hitCircle(b, bp.x, bp.y, bp.r, 1.2, kickAmt);
      if (imp <= 0 || bp.cd > 0) continue;
      bp.cd = 0.09;
      bp.flash = 1;
      bp.punch = 1.42;
      bp.lit = true;
      const n = hypot(b.x - bp.x, b.y - bp.y) || 1;
      const nx = (b.x - bp.x) / n;
      const ny = (b.y - bp.y) / n;
      bumpCombo();
      audio.bumper(G.combo);
      juice(bp.x, bp.y, bp.rgb, 1.05 + Math.min(0.5, G.combo * 0.06), nx, ny);
      addScore(bp.pts, bp.x, bp.y - 10, bp.rgb);
      checkLit(bp.x, bp.y);
    }
  }

  function collideSlings(b) {
    for (let i = 0; i < G.slings.length; i++) {
      const s = G.slings[i];
      const imp = hitCapsule(b, s.x1, s.y1, s.x2, s.y2, s.thick, s.rest, s.kick, 0, 0);
      if (imp <= 0 || s.cd > 0) continue;
      s.cd = 0.12;
      bumpCombo();
      audio.sling();
      const mx = (s.x1 + s.x2) * 0.5;
      const my = (s.y1 + s.y2) * 0.5;
      juice(b.x, b.y, s.rgb, 1.1, b.x - mx, b.y - my);
      addScore(50, b.x, b.y, MAG);
    }
  }

  function collideFlip(b, f) {
    const tip = flipTip(f);
    const rx = (b.x - f.x);
    const ry = (b.y - f.y);
    const svx = -f.omega * ry;
    const svy = f.omega * rx;
    const swinging = Math.abs(f.omega) > 8;
    const rest = swinging ? 0.48 : 0.12;
    const extra = swinging ? Math.min(740, Math.abs(f.omega) * 24) : 0;
    const imp = hitCapsule(b, f.x, f.y, tip.x, tip.y, FLIP_HALF, rest, extra, svx, svy);
    if (imp > 0 && !swinging) {
      const tx = Math.cos(f.ang);
      const ty = Math.sin(f.ang);
      const along = b.vx * tx + b.vy * ty;
      b.vx -= tx * along * 0.22;
      b.vy -= ty * along * 0.22;
    }
    if (imp <= 8) return;
    if ((swinging || imp > 160) && f.hitCd <= 0) {
      f.hitCd = 0.12;
      audio.flipHit();
      juice(b.x, b.y, CYN, swinging ? 1.25 : 0.85, 0, -1);
      if (G.mode === 'play') bumpCombo();
      addScore(swinging ? 25 : 10, b.x, b.y, CYN);
    }
  }

  function collideBalls() {
    const live = liveBalls();
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const a = live[i];
        const b = live[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = hypot(dx, dy);
        const min = a.r + b.r;
        if (d >= min) continue;
        if (d < 1e-5) {
          dx = 1;
          dy = 0;
          d = 1;
        }
        const nx = dx / d;
        const ny = dy / d;
        const overlap = (min - d) * 0.5;
        a.x -= nx * overlap;
        a.y -= ny * overlap;
        b.x += nx * overlap;
        b.y += ny * overlap;
        const va = a.vx * nx + a.vy * ny;
        const vb = b.vx * nx + b.vy * ny;
        const diff = vb - va;
        if (diff > 0) continue;
        a.vx += diff * nx;
        a.vy += diff * ny;
        b.vx -= diff * nx;
        b.vy -= diff * ny;
        if (Math.abs(diff) > 180) {
          audio.wall(true);
          emit(6, {
            x: (a.x + b.x) * 0.5, y: (a.y + b.y) * 0.5, j: 4,
            vx0: -70, vx1: 70, vy0: -80, vy1: 20,
            life: 0.22, r0: 0.8, r1: 2, rgb: WHT
          });
        }
      }
    }
  }

  function collideRolls(b) {
    for (let i = 0; i < G.rolls.length; i++) {
      const r = G.rolls[i];
      if (r.cd > 0) continue;
      if (b.x > r.x && b.x < r.x + r.w && b.y > r.y && b.y < r.y + r.h) {
        r.cd = 0.35;
        r.on = true;
        bumpCombo();
        audio.roll();
        juice(r.x + r.w * 0.5, r.y + r.h * 0.5, GOLD, 0.85, 0, 1);
        addScore(200, r.x + r.w * 0.5, r.y, GOLD);
        checkRolls(r.x + r.w * 0.5, r.y);
      }
    }
  }

  function collideSaucer(b) {
    const s = G.saucer;
    if (!s || G.captured) return;
    const d = hypot(b.x - s.x, b.y - s.y);
    const spd = hypot(b.vx, b.vy);
    if (d < s.r + 2 && spd < 340 && b.y < s.y + 8) {
      G.captured = b;
      G.capture = 0.48;
      b.vx = 0;
      b.vy = 0;
      b.x = s.x;
      b.y = s.y;
      s.flash = 1;
      audio.saucer();
      juice(s.x, s.y, PUR, 1.2);
      bumpCombo();
      addScore(400, s.x, s.y, PUR);
    }
  }

  function stepBall(b, dt) {
    if (b.dead) return;
    if (G.captured === b) return;
    b.lane = inLane(b);
    if (G.waiting && b.lane && b.y > 500) {
      b.x = (PL + PR) * 0.5;
      b.vx = 0;
      b.vy = 0;
      b.y = G.plungerY - b.r - 0.5;
      return;
    }
    b.vy += grav() * dt;
    b.vx *= Math.pow(0.9992, dt * 60);
    b.vy *= Math.pow(0.9992, dt * 60);
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    collideWalls(b);
    collidePosts(b);
    collideBumpers(b);
    collideSlings(b);
    collideFlip(b, G.flipL);
    collideFlip(b, G.flipR);
    collideRolls(b);
    collideSaucer(b);
    clampSpd(b);

    if (b.x < L - 20 || b.x > PR + 20) {
      drainBall(b);
      return;
    }
    if (b.y > DRAIN_Y && b.x < PF) {
      drainBall(b);
      return;
    }
    if (b.y > VH + 20) {
      drainBall(b);
      return;
    }

    if (!REDUCE) {
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 10) b.trail.shift();
    }
  }

  function updateFlippers(dt) {
    const wantL = keys.l || pointerLeft();
    const wantR = keys.r || pointerRight();
    function drive(f, want) {
      f.prev = f.ang;
      const tgt = flipTarget(f, want);
      const up = want;
      const rate = up ? 40 : 17;
      if (up && !f.was) audio.flip();
      f.was = up;
      f.ang = lerp(f.ang, tgt, 1 - Math.exp(-rate * dt));
      f.omega = (f.ang - f.prev) / Math.max(dt, 0.001);
      f.glow = lerp(f.glow, up ? 1 : 0, 1 - Math.exp(-18 * dt));
      f.hitCd = Math.max(0, f.hitCd - dt);
    }
    drive(G.flipL, wantL);
    drive(G.flipR, wantR);
  }

  function pointerLeft() {
    for (let i = 0; i < ptrs.length; i++) {
      if (ptrs[i].side === 'l') return true;
    }
    return false;
  }

  function pointerRight() {
    for (let i = 0; i < ptrs.length; i++) {
      if (ptrs[i].side === 'r') return true;
    }
    return false;
  }

  function pointerPlunge() {
    if (ptrs.length === 0) return false;
    if (G.waiting) return true;
    for (let i = 0; i < ptrs.length; i++) {
      if (ptrs[i].side === 'p') return true;
    }
    return false;
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * W;
    const y = (e.clientY - rect.top) / rect.height * H;
    return {
      x: (x - ox) / scale,
      y: (y - oy) / scale,
      sx: x
    };
  }

  function sideFromWorld(wx, sxv) {
    if (G.waiting) return 'p';
    if (wx > PF - 8) return 'p';
    const mid = ox + (ARCH_CX * scale);
    return sxv < mid ? 'l' : 'r';
  }

  function updatePlunger(dt) {
    const hold = G.waiting && (keys.space || pointerPlunge());
    const can = G.waiting && liveBalls().length > 0 && G.mode !== 'lose' && G.mode !== 'win';
    if (can && hold) {
      if (!G.charging) G.charging = true;
      const prev = G.power;
      G.power = clamp(G.power + dt * 1.35, 0, 1);
      G.plungerY = lerp(678, 704, G.power);
      if (G.power > 0.08 && ((G.power * 12) | 0) !== ((prev * 12) | 0)) audio.charge();
    } else {
      G.plungerY = lerp(G.plungerY, 678, 1 - Math.exp(-16 * dt));
      if (G.charging && can && G.power > 0.08) launch();
      G.charging = false;
      if (!hold) G.power = lerp(G.power, 0, 1 - Math.exp(-10 * dt));
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += 420 * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.38) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life -= dt;
      f.y += f.vy * dt;
      if (f.life <= 0) floats.splice(i, 1);
    }
    for (let i = 0; i < G.bumpers.length; i++) {
      const bp = G.bumpers[i];
      bp.cd = Math.max(0, bp.cd - dt);
      bp.flash = Math.max(0, bp.flash - dt * 3.2);
      bp.punch = lerp(bp.punch, 1, 1 - Math.exp(-14 * dt));
    }
    for (let i = 0; i < G.slings.length; i++) {
      G.slings[i].cd = Math.max(0, G.slings[i].cd - dt);
    }
    for (let i = 0; i < G.rolls.length; i++) {
      G.rolls[i].cd = Math.max(0, G.rolls[i].cd - dt);
    }
    if (G.saucer) G.saucer.flash = Math.max(0, G.saucer.flash - dt * 2.4);
    G.wallCd = Math.max(0, G.wallCd - dt);
    G.flash = Math.max(0, G.flash - dt * 2.6);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.kickX *= Math.exp(-dt * 14);
    G.kickY *= Math.exp(-dt * 14);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-10 * dt));
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
  }

  function updateCapture(dt) {
    if (!G.captured) return;
    G.capture -= dt;
    const b = G.captured;
    b.x = G.saucer.x;
    b.y = G.saucer.y;
    b.vx = 0;
    b.vy = 0;
    if (G.capture > 0) return;
    b.vx = 280;
    b.vy = -560;
    G.captured = null;
    audio.eject();
    juice(G.saucer.x, G.saucer.y, GOLD, 1.25, 0.4, -1);
  }

  function steerFlippers(dt, skill) {
    const look = [0.18, 0.16, 0.12, 0.09, 0.07][skill] || 0.12;
    const early = [28, 18, 8, 0, -6][skill] || 8;
    let wantL = false;
    let wantR = false;
    const live = liveBalls();
    let threat = null;
    let threatS = -1e9;
    for (let i = 0; i < live.length; i++) {
      const b = live[i];
      if (inLane(b) && b.y > 400) continue;
      const py = b.y + b.vy * look + 0.5 * grav() * look * look;
      const s = py + b.vy * 0.12 - (b.vy < 0 ? 80 : 0);
      if (s > threatS) {
        threatS = s;
        threat = b;
      }
    }
    if (threat && threat.vy > -40) {
      const px = threat.x + threat.vx * look;
      const py = threat.y + threat.vy * look;
      const near = threat.y > 548 - early;
      const very = threat.y > 600;
      if (near && px < ARCH_CX + 12 && px > 36) wantL = true;
      if (near && px > ARCH_CX - 12 && px < PF - 10) wantR = true;
      if (very && threat.x < ARCH_CX) wantL = true;
      if (very && threat.x >= ARCH_CX) wantR = true;
      if (threat.y > 575 && threat.x > 150 && threat.x < 218) {
        wantL = true;
        wantR = true;
      }
      if (skill <= 2 && py < 560 && threat.y < 580) {
        wantL = false;
        wantR = false;
      }
      if (skill === 1 && threat.y < 590 && Math.sin(G.t * 3.1) > 0.82) {
        wantL = false;
        wantR = false;
      }
    }
    if (wantL) autoHoldL = skill >= 3 ? 0.1 : 0.16;
    if (wantR) autoHoldR = skill >= 3 ? 0.1 : 0.16;
    autoHoldL = Math.max(0, autoHoldL - dt);
    autoHoldR = Math.max(0, autoHoldR - dt);
    keys.l = autoHoldL > 0;
    keys.r = autoHoldR > 0;
  }

  function autoThink(dt) {
    if (G.mode === 'title' && !autoOn) {
      if (!G.waiting) steerFlippers(dt, 3);
      return;
    }
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.28 : 0.6)) {
        autoOvWait = 0;
        startClassic();
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        retry();
      }
      return;
    }
    if (G.waiting) {
      autoPlunge += dt;
      const hold = autoSpeed >= 4 ? 0.42 : autoSpeed >= 3 ? 0.55 : autoSpeed === 2 ? 0.7 : 0.9;
      const miss = autoSpeed === 1 && (G.clock % 7 < 0.02);
      keys.space = autoPlunge > 0.12 && autoPlunge < hold && !miss;
      if (autoPlunge > hold + 0.05) keys.space = false;
      keys.l = false;
      keys.r = false;
      return;
    }
    keys.space = false;
    steerFlippers(dt, autoSpeed);
  }

  function update(dt) {
    G.t += dt;
    if (G.mode === 'play' || G.mode === 'title') G.clock += dt;

    if (G.comboT > 0 && G.stop <= 0) {
      G.comboT -= dt;
      if (G.comboT <= 0 && G.combo >= 2) {
        if (G.combo >= 4) audio.comboDrop();
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }

    updateFx(dt * (G.stop > 0 ? 0.45 : 1));
    autoThink(dt);
    updateFlippers(dt);
    updatePlunger(dt);

    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }

    if (G.lock > 0) {
      G.lock -= dt;
      if (G.lock <= 0 && G.mode === 'play' && liveBalls().length === 0) {
        G.balls = [];
        spawnPlungerBall();
        setHint('空格蓄力发射', '');
      } else if (G.lock <= 0 && G.mode === 'title' && liveBalls().length === 0) {
        G.balls = [];
        spawnPlungerBall();
        G.demoLaunch = 0.4;
      }
    }

    updateCapture(dt);

    if (!G.waiting) {
      const liveNow = liveBalls();
      if (liveNow.length === 1 && inLane(liveNow[0]) && liveNow[0].y > 560 && liveNow[0].vy > 40) {
        G.waiting = true;
        liveNow[0].vx *= 0.2;
        autoPlunge = 0;
      }
    }

    if (G.mode === 'title' && G.waiting && !autoOn) {
      G.demoLaunch -= dt;
      if (G.demoLaunch <= 0) {
        G.power = 0.72 + rand(0, 0.2);
        G.charging = true;
        launch();
      }
    }

    const live = liveBalls();
    let maxStep = 0;
    for (let i = 0; i < live.length; i++) {
      const s = hypot(live[i].vx, live[i].vy);
      if (s > maxStep) maxStep = s;
    }
    const steps = Math.max(1, Math.min(10, Math.ceil(maxStep * dt / 3.6)));
    const h = dt / steps;
    for (let s = 0; s < steps; s++) {
      const now = liveBalls();
      for (let i = 0; i < now.length; i++) stepBall(now[i], h);
      collideBalls();
    }
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

  function drawTable() {
    ctx.save();
    const g = ctx.createRadialGradient(
      sx(ARCH_CX), sy(220), 20 * scale,
      sx(ARCH_CX), sy(360), 340 * scale
    );
    g.addColorStop(0, '#1a0c14');
    g.addColorStop(0.45, '#0c0712');
    g.addColorStop(1, '#05030c');
    roundRect(ctx, sx(L - 8), sy(18), (PR - L + 16) * scale, (VH - 28) * scale, 28 * scale);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#120814';
    ctx.font = '900 ' + (86 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PIN', sx(ARCH_CX), sy(400));
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255,122,34,0.55)';
    ctx.shadowColor = 'rgba(255,122,34,0.45)';
    ctx.shadowBlur = 12 * scale;
    ctx.lineWidth = 3.2 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const a = Math.PI * (1 - i / 18);
      const x = ARCH_CX + ARCH_R * Math.cos(a);
      const y = ARCH_CY - ARCH_R * Math.sin(a);
      if (i === 0) ctx.moveTo(sx(x), sy(y));
      else ctx.lineTo(sx(x), sy(y));
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(0,240,255,0.38)';
    ctx.lineWidth = 2.4 * scale;
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,240,255,0.25)';
    ctx.shadowBlur = 8 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(L), sy(ARCH_CY));
    ctx.lineTo(sx(L), sy(448));
    ctx.lineTo(sx(88), sy(622));
    ctx.lineTo(sx(98), sy(638));
    ctx.moveTo(sx(PF), sy(ARCH_CY));
    ctx.lineTo(sx(PF), sy(448));
    ctx.lineTo(sx(280), sy(622));
    ctx.lineTo(sx(270), sy(638));
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(0, 20, 28, 0.55)';
    ctx.fillRect(sx(PL), sy(34), (PR - PL) * scale, 680 * scale);
    ctx.strokeStyle = 'rgba(0,240,255,0.28)';
    ctx.lineWidth = 1.4 * scale;
    ctx.strokeRect(sx(PL), sy(34), (PR - PL) * scale, 680 * scale);
    ctx.restore();
  }

  function drawSaucer() {
    const s = G.saucer;
    if (!s) return;
    ctx.save();
    ctx.shadowColor = rgba(PUR, 0.55 + s.flash * 0.4);
    ctx.shadowBlur = 14 * scale;
    ctx.beginPath();
    ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
    ctx.fillStyle = 'rgba(18, 6, 22, 0.9)';
    ctx.fill();
    ctx.strokeStyle = rgba(PUR, 0.7 + s.flash * 0.3);
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(s.x), sy(s.y), 4.2 * scale, 0, TAU);
    ctx.fillStyle = rgba(PUR, 0.45 + s.flash * 0.4);
    ctx.fill();
    ctx.restore();
  }

  function drawRolls() {
    for (let i = 0; i < G.rolls.length; i++) {
      const r = G.rolls[i];
      const on = r.on;
      ctx.save();
      roundRect(ctx, sx(r.x), sy(r.y), r.w * scale, r.h * scale, 5 * scale);
      ctx.fillStyle = on ? rgba(GOLD, 0.55) : 'rgba(255,227,107,0.08)';
      ctx.fill();
      ctx.strokeStyle = on ? rgba(GOLD, 0.95) : 'rgba(255,227,107,0.28)';
      ctx.lineWidth = (on ? 1.8 : 1) * scale;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBumpers() {
    for (let i = 0; i < G.bumpers.length; i++) {
      const bp = G.bumpers[i];
      const p = bp.punch;
      const r = bp.r * p;
      ctx.save();
      ctx.translate(sx(bp.x), sy(bp.y));
      ctx.shadowColor = rgba(bp.rgb, bp.lit ? 0.75 : 0.35);
      ctx.shadowBlur = (bp.lit ? 22 : 10) * scale;
      ctx.beginPath();
      ctx.arc(0, 0, r * scale, 0, TAU);
      const g = ctx.createRadialGradient(-r * 0.3 * scale, -r * 0.35 * scale, 0, 0, 0, r * scale);
      g.addColorStop(0, '#fff6e8');
      g.addColorStop(0.28, rgba(bp.rgb, 0.95));
      g.addColorStop(1, 'rgba(20,8,12,0.95)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = rgba(bp.rgb, bp.lit ? 1 : 0.55);
      ctx.lineWidth = (bp.lit ? 2.4 : 1.4) * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.42 * scale, 0, TAU);
      ctx.strokeStyle = rgba(WHT, 0.35 + bp.flash * 0.5);
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
      if (bp.flash > 0) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.beginPath();
        ctx.arc(0, 0, r * scale, 0, TAU);
        ctx.fillStyle = rgba(WHT, bp.flash * 0.55);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawSlings() {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(255,61,184,0.5)';
    ctx.shadowBlur = 10 * scale;
    ctx.strokeStyle = 'rgba(255,61,184,0.85)';
    ctx.lineWidth = 6 * scale;
    for (let i = 0; i < G.slings.length; i++) {
      const s = G.slings[i];
      ctx.beginPath();
      ctx.moveTo(sx(s.x1), sy(s.y1));
      ctx.lineTo(sx(s.x2), sy(s.y2));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPosts() {
    for (let i = 0; i < G.posts.length; i++) {
      const p = G.posts[i];
      ctx.save();
      ctx.shadowColor = rgba(p.rgb, 0.5);
      ctx.shadowBlur = 8 * scale;
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fillStyle = '#1a1424';
      ctx.fill();
      ctx.strokeStyle = rgba(p.rgb, 0.8);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFlipper(f) {
    const tip = flipTip(f);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = f.glow > 0.2 ? 'rgba(0,240,255,0.7)' : 'rgba(255,176,74,0.35)';
    ctx.shadowBlur = (10 + f.glow * 10) * scale;
    ctx.strokeStyle = f.left
      ? (f.glow > 0.3 ? '#7af0ff' : '#00d4e8')
      : (f.glow > 0.3 ? '#ffe36b' : '#ffb04a');
    ctx.lineWidth = (FLIP_HALF * 2) * scale;
    ctx.beginPath();
    ctx.moveTo(sx(f.x), sy(f.y));
    ctx.lineTo(sx(tip.x), sy(tip.y));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 3.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(f.x), sy(f.y));
    ctx.lineTo(sx(tip.x), sy(tip.y));
    ctx.stroke();
    ctx.restore();
  }

  function drawPlunger() {
    const x = (PL + PR) * 0.5;
    const w = PR - PL - 10;
    ctx.save();
    roundRect(ctx, sx(x - w * 0.5), sy(G.plungerY), w * scale, 18 * scale, 4 * scale);
    const g = ctx.createLinearGradient(sx(x), sy(G.plungerY), sx(x), sy(G.plungerY + 18));
    g.addColorStop(0, G.charging ? '#ffe36b' : '#8ae8ff');
    g.addColorStop(1, G.charging ? '#ff7a22' : '#3aa0c8');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    if (G.waiting) {
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(G.t * 5);
      ctx.fillStyle = G.charging ? '#ffe36b' : '#d5d2ee';
      ctx.font = '600 ' + (11 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(G.charging ? '蓄力' : '空格', sx(x), sy(G.plungerY - 16));
      ctx.restore();
      if (G.power > 0.02) {
        ctx.save();
        ctx.fillStyle = rgba(HOT, 0.18);
        ctx.fillRect(sx(PL + 4), sy(120), (PR - PL - 8) * scale, 520 * scale);
        const h = G.power * 200;
        ctx.fillStyle = rgba(GOLD, 0.55);
        ctx.fillRect(sx(PL + 6), sy(G.plungerY - 8 - h), (PR - PL - 12) * scale, h * scale);
        ctx.restore();
      }
    }
  }

  function drawBall(b) {
    if (b.dead) return;
    if (!REDUCE && b.trail) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < b.trail.length; i++) {
        const t = b.trail[i];
        const k = (i + 1) / b.trail.length;
        ctx.fillStyle = rgba(G.multi ? GOLD : CYN, 0.14 * k);
        ctx.beginPath();
        ctx.arc(sx(t.x), sy(t.y), b.r * k * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.shadowColor = G.multi ? 'rgba(255,227,107,0.85)' : 'rgba(0,240,255,0.85)';
    ctx.shadowBlur = 14 * scale;
    const g = ctx.createRadialGradient(
      sx(b.x - 1.6), sy(b.y - 1.8), 0.4 * scale,
      sx(b.x), sy(b.y), b.r * scale
    );
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, G.multi ? '#fff4c8' : '#e8ffff');
    g.addColorStop(1, G.multi ? '#ff9a32' : '#00c8e0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.38;
      ctx.strokeStyle = rgba(s.rgb, 0.7 * (1 - k));
      ctx.lineWidth = (2.4 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad + k * 26) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const k = r.t / 0.42;
      ctx.strokeStyle = rgba(r.rgb, 0.55 * (1 - k));
      ctx.lineWidth = (1.8 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + k * 34) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 ' + (13 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(f.life / f.max, 0, 1);
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawHints() {
    if (G.mode === 'lose' || G.mode === 'win') return;
    ctx.save();
    ctx.globalAlpha = 0.28 + 0.08 * Math.sin(G.t * 3);
    ctx.fillStyle = '#8b90b8';
    ctx.font = '700 ' + (12 * scale) + 'px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Z', sx(92), sy(690));
    ctx.fillText('M', sx(276), sy(690));
    ctx.restore();
    if (G.combo >= 4 && G.mode === 'play') {
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(G.t * 8);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = '900 ' + (22 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('×' + G.mult, sx(ARCH_CX), sy(390));
      ctx.restore();
    }
  }

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const sk = REDUCE ? 0 : G.shake;
    const kx = REDUCE ? 0 : G.kickX;
    const ky = REDUCE ? 0 : G.kickY;
    const p = REDUCE ? 1 : G.punch;
    ctx.translate(
      (kx + (sk ? rand(-sk, sk) : 0)) * scale,
      (ky + (sk ? rand(-sk, sk) * 0.6 : 0)) * scale
    );
    if (p !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(p, p);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    drawTable();
    drawRolls();
    drawSaucer();
    drawSlings();
    drawBumpers();
    drawPosts();
    drawPlunger();
    drawFlipper(G.flipL);
    drawFlipper(G.flipR);
    for (let i = 0; i < G.balls.length; i++) drawBall(G.balls[i]);
    drawParticles();
    drawHints();
    drawFlash();
    ctx.restore();
  }

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl) return;
    speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!(n >= 1 && n <= 4)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoPlunge = 0;
    if (!autoOn) {
      keys.l = false;
      keys.r = false;
      keys.space = false;
    }
    syncAutoUi();
    audio.ensure();
    if (autoOn && G.mode === 'title') startClassic();
  }

  function toggleMute() {
    audio.ensure();
    audio.setMuted(!audio.muted);
  }

  function onKey(e, down) {
    const c = e.code;
    if (c === 'Space') e.preventDefault();
    if (c === 'ArrowLeft' || c === 'ArrowRight' || c === 'ArrowDown' || c === 'ArrowUp') e.preventDefault();
    if (c === 'KeyZ' || c === 'KeyX' || c === 'ArrowLeft') keys.l = down;
    if (c === 'KeyM' || c === 'Period' || c === 'Slash' || c === 'ArrowRight') keys.r = down;
    if (c === 'Space' || c === 'ArrowDown') keys.space = down;
    if (!down) return;
    if (c === 'KeyR') {
      retry();
      return;
    }
    if (c === 'KeyA') {
      toggleAuto();
      return;
    }
    if (c === 'KeyK') {
      toggleMute();
      return;
    }
    if (c === 'Space' && G.mode === 'title' && !G.waiting) {
      startClassic();
    }
  }

  function findPtr(id) {
    for (let i = 0; i < ptrs.length; i++) {
      if (ptrs[i].id === id) return i;
    }
    return -1;
  }

  function ptrDown(e) {
    audio.ensure();
    if (e.target && e.target.closest && e.target.closest('button, input, label, .tools')) return;
    const w = worldFromEvent(e);
    const id = e.pointerId == null ? 1 : e.pointerId;
    if (findPtr(id) >= 0) return;
    const side = sideFromWorld(w.x, w.sx);
    ptrs.push({ id: id, side: side, x: w.x, y: w.y });
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(id); } catch (err) { /* ignore */ }
    }
    if (e.cancelable) e.preventDefault();
  }

  function ptrMove(e) {
    const i = findPtr(e.pointerId == null ? 1 : e.pointerId);
    if (i < 0) return;
    const w = worldFromEvent(e);
    ptrs[i].x = w.x;
    ptrs[i].y = w.y;
    if (!G.waiting) ptrs[i].side = sideFromWorld(w.x, w.sx);
  }

  function ptrUp(e) {
    const id = e.pointerId == null ? 1 : e.pointerId;
    const i = findPtr(id);
    if (i >= 0) ptrs.splice(i, 1);
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    let n = 0;
    while (acc >= STEP && n < 5) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    draw();
  }

  function bind() {
    window.addEventListener('keydown', function (e) {
      if (e.repeat && (e.code === 'KeyR' || e.code === 'KeyA' || e.code === 'KeyK')) return;
      onKey(e, true);
    });
    window.addEventListener('keyup', function (e) { onKey(e, false); });
    canvas.addEventListener('pointerdown', ptrDown);
    canvas.addEventListener('pointermove', ptrMove);
    window.addEventListener('pointerup', ptrUp);
    window.addEventListener('pointercancel', ptrUp);
    window.addEventListener('blur', function () {
      keys.l = keys.r = keys.space = false;
      ptrs.length = 0;
    });
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (hidden) {
        keys.l = keys.r = keys.space = false;
        ptrs.length = 0;
      } else last = 0;
    });
    window.addEventListener('resize', resize);
    if (btnClassic) btnClassic.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'title') startClassic();
      else retry();
    });
    if (btnCrazy) btnCrazy.addEventListener('click', function () {
      audio.ensure();
      startCrazy();
    });
    if (btnRetry) btnRetry.addEventListener('click', retry);
    if (btnMute) btnMute.addEventListener('click', toggleMute);
    if (btnAuto) btnAuto.addEventListener('click', toggleAuto);
    if (speedEl) speedEl.addEventListener('input', function () {
      setAutoSpeed(speedEl.value);
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function loadMute() {
    try {
      audio.setMuted(localStorage.getItem(MUTE_KEY) === '1');
    } catch (err) {
      audio.setMuted(false);
    }
  }

  loadBest();
  loadMute();
  syncSpeedUi();
  syncAutoUi();
  bind();
  resetRun('classic', false);
  resize();
  requestAnimationFrame(frame);
})();
