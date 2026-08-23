'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const WALL = 18;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const P_R = 13;
  const P_SPD = 162;
  const DASH_SPD = 520;
  const DASH_T = 0.14;
  const DASH_IFRAME = 0.22;
  const DASH_CD = 0.68;
  const SWORD_R = 48;
  const SWORD_DOT = 0.32;
  const SWORD_CD = 0.26;
  const SWORD_T = 0.12;
  const FIRE_CD = 0.085;
  const SHOT_SPD = 560;
  const SHOT_R = 3.2;
  const MAX_PSHOT = 8;
  const INVULN = 1.22;
  const DIE_T = 0.88;
  const BEST_KEY = 'playbox-cybattler-best';
  const MUTE_KEY = 'playbox-cybattler-mute';
  const OPS = '方向 / WASD 走 · 空格射击 · Shift / Z 冲刺 · X 斩 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [0, 221, 255];
  const HOT2 = [125, 255, 240];
  const WHT = [228, 248, 252];
  const LEAF = [184, 255, 74];
  const STL = [48, 84, 96];
  const IRON = [24, 44, 52];

  const OCT = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];

  const ENT = {
    drone: { r: 9, hp: 1, spd: 86, score: 80, fire: 1.72, shot: 150, sr: 2.6 },
    walker: { r: 13, hp: 2, spd: 74, score: 140, fire: 1.32, shot: 186, sr: 3.2 },
    blade: { r: 11, hp: 1, spd: 0, score: 120, fire: 0, shot: 0, sr: 0, rush: 268 },
    turret: { r: 12, hp: 3, spd: 0, score: 160, fire: 1.12, shot: 210, sr: 3.4 },
    heavy: { r: 16, hp: 4, spd: 50, score: 220, fire: 1.78, shot: 118, sr: 5.2 }
  };

  const STAGES = [
    {
      name: '月港', boss: '月牙', bossHp: 36, bossR: 28, kind: 'moon',
      covers: [
        [96, 72, 44, 36], [500, 72, 44, 36],
        [96, 252, 44, 36], [500, 252, 44, 36]
      ],
      waves: [
        [{ k: 'drone', n: 4 }, { k: 'walker', n: 1 }],
        [{ k: 'drone', n: 3 }, { k: 'walker', n: 2 }, { k: 'blade', n: 2 }],
        [{ k: 'walker', n: 2 }, { k: 'turret', n: 2 }, { k: 'blade', n: 2 }]
      ]
    },
    {
      name: '钢轨', boss: '铁臂', bossHp: 48, bossR: 30, kind: 'arm',
      covers: [
        [220, 64, 72, 22], [348, 64, 72, 22],
        [220, 274, 72, 22], [348, 274, 72, 22],
        [70, 156, 28, 48], [542, 156, 28, 48]
      ],
      waves: [
        [{ k: 'walker', n: 3 }, { k: 'drone', n: 3 }, { k: 'blade', n: 2 }],
        [{ k: 'turret', n: 3 }, { k: 'heavy', n: 1 }, { k: 'blade', n: 2 }],
        [{ k: 'walker', n: 3 }, { k: 'heavy', n: 1 }, { k: 'drone', n: 3 }, { k: 'blade', n: 2 }]
      ]
    },
    {
      name: '核门', boss: '核甲王', bossHp: 64, bossR: 32, kind: 'king',
      covers: [
        [160, 88, 36, 36], [444, 88, 36, 36],
        [160, 236, 36, 36], [444, 236, 36, 36],
        [300, 50, 40, 22], [300, 288, 40, 22]
      ],
      waves: [
        [{ k: 'drone', n: 4 }, { k: 'walker', n: 2 }, { k: 'blade', n: 3 }],
        [{ k: 'heavy', n: 2 }, { k: 'turret', n: 2 }, { k: 'blade', n: 3 }],
        [{ k: 'walker', n: 3 }, { k: 'heavy', n: 2 }, { k: 'drone', n: 3 }, { k: 'blade', n: 3 }]
      ]
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function snap8(dx, dy) {
    if (dx === 0 && dy === 0) return OCT[0];
    let oct = Math.round(Math.atan2(dy, dx) / (Math.PI / 4));
    if (oct < 0) oct += 8;
    if (oct === 8) oct = 0;
    return OCT[oct];
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function coreMul() {
    return 1.42;
  }
  function spdMul(core, stage) {
    return (core ? 1.22 : 1) * (1 + Math.max(0, stage) * 0.07);
  }
  function walkSpd(core) {
    return core ? 176 : P_SPD;
  }
  function circleBox(cx, cy, r, bx, by, bw, bh) {
    const nx = clamp(cx, bx, bx + bw);
    const ny = clamp(cy, by, by + bh);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }
  function segHit(px, py, pr, ax, ay, bx, by, thick) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby || 1;
    let t = (apx * abx + apy * aby) / ab2;
    t = clamp(t, 0, 1);
    const qx = ax + abx * t;
    const qy = ay + aby * t;
    return hypot(px - qx, py - qy) < pr + thick;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-cybattler-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-cybattler-mute') throw new Error('mute key');
    if (SWORD_R <= P_R + 20) throw new Error('sword reach');
    if (DASH_SPD <= P_SPD) throw new Error('dash faster');
    if (coreMul() <= 1) throw new Error('core denser');
    if (spdMul(true, 0) <= spdMul(false, 0)) throw new Error('core faster');
    if (walkSpd(true) <= walkSpd(false)) throw new Error('core walk');
    if (STAGES[0].bossHp >= STAGES[1].bossHp || STAGES[1].bossHp >= STAGES[2].bossHp) {
      throw new Error('boss hp');
    }
    const e = snap8(10, 0);
    if (e[0] !== 1 || e[1] !== 0) throw new Error('snap8 east');
    const n = snap8(0, -4);
    if (n[0] !== 0 || n[1] !== -1) throw new Error('snap8 north');
    const ne = snap8(3, -3);
    if (ne[0] !== 1 || ne[1] !== -1) throw new Error('snap8 ne');
    if (!ENT.drone || !ENT.walker || !ENT.blade || !ENT.turret || !ENT.heavy) {
      throw new Error('ents');
    }
    if (ENT.blade.score * 2 <= ENT.blade.score) throw new Error('melee 2x');
    let i;
    for (i = 0; i < STAGES.length; i++) {
      if (STAGES[i].waves.length !== 3) throw new Error('3 waves ' + STAGES[i].name);
      if (!STAGES[i].covers.length) throw new Error('covers ' + STAGES[i].name);
    }
    return true;
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
    zap() {
      this.ensure();
      this.beep(1080, 0.05, 'square', 0.046, 280);
      this.beep(1640, 0.035, 'sawtooth', 0.026, 620);
    },
    slash() {
      this.ensure();
      this.noise(0.08, 0.05, 1400);
      this.beep(720, 0.09, 'sawtooth', 0.05, 180);
      this.beep(1480, 0.05, 'square', 0.03, 420);
    },
    dash() {
      this.ensure();
      this.noise(0.1, 0.045, 500);
      this.beep(240, 0.1, 'sine', 0.04, 90);
    },
    hit() {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.03, 420);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(180, 0.16, 'sawtooth', 0.05, 50);
    },
    split() {
      this.ensure();
      this.noise(0.1, 0.055, 900);
      this.beep(520, 0.08, 'triangle', 0.04, 140);
      this.beep(980, 0.07, 'square', 0.03, 260);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.04, f * 1.5);
    },
    hurt() {
      this.ensure();
      this.beep(160, 0.18, 'sawtooth', 0.055, 60);
      this.noise(0.14, 0.055, 360);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.05);
      this.beep(659, 0.12, 'sine', 0.045);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.26, 'triangle', 0.05, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.045, 90);
      this.beep(140, 0.3, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
    },
    wave() {
      this.ensure();
      this.beep(440, 0.07, 'sine', 0.035, 660);
    },
    boss() {
      this.ensure();
      this.beep(110, 0.2, 'sawtooth', 0.06, 55);
      this.beep(330, 0.16, 'square', 0.04, 180);
    }
  };

  if (!hasDom) {
    selfCheck();
    return;
  }

  selfCheck();

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
  const btnRaid = el('btn-raid');
  const btnCore = el('btn-core');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const modeRaid = el('mode-raid');
  const modeCore = el('mode-core');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const dashLabel = el('dash-label');
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
    fire: el('btn-fire'),
    slash: el('btn-slash'),
    dash: el('btn-dash')
  };

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;
  let toastTok = 0;
  let fireHold = false;
  let slashHold = false;
  let dashHold = false;
  let dashQueued = false;

  const keys = { u: false, d: false, l: false, r: false };
  const demo = { u: false, d: false, l: false, r: false, fire: true, slash: false, dash: false };
  const ptr = { down: false, id: null, x: 0, y: 0 };
  const pips = [];
  const particles = [];
  const pops = [];
  const rings = [];
  const lasers = [];
  const motes = [];
  const trails = [];
  const halves = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    covers: [],
    ents: [],
    shots: [],
    pShots: [],
    boss: null,
    player: { x: 320, y: 180, fx: 1, fy: 0, walk: 0 },
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    toastT: 0,
    deadT: 0,
    ready: 0,
    why: '',
    punch: 1,
    fireCd: 0,
    slashCd: 0,
    slashT: 0,
    dashT: 0,
    dashCd: 0,
    dashI: 0,
    muzzle: 0,
    waveT: 0,
    clearT: 0,
    nextLife: LIFE_EVERY,
    phase: 'wave'
  };

  function isCore() {
    return G.kind === 'core';
  }
  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function overlayBlocksPlay() {
    return overlayOpen() && G.mode !== 'play';
  }
  function inL() {
    return G.mode === 'title' ? demo.l : keys.l;
  }
  function inR() {
    return G.mode === 'title' ? demo.r : keys.r;
  }
  function inU() {
    return G.mode === 'title' ? demo.u : keys.u;
  }
  function inD() {
    return G.mode === 'title' ? demo.d : keys.d;
  }
  function fireHeld() {
    return G.mode === 'title' ? demo.fire : (fireHold || ptr.down);
  }
  function slashHeld() {
    return G.mode === 'title' ? demo.slash : slashHold;
  }
  function dashWanted() {
    return G.mode === 'title' ? demo.dash : (dashHold || dashQueued);
  }
  function stageSpec() {
    return STAGES[Math.min(G.stage, STAGES.length - 1)];
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }

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
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    while (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.beep(880, 0.1, 'sine', 0.05, 1320);
      }
    }
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
    if (x != null) spawnPop(x, y, '+' + n, GOLD);
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.45;
    if (!toastEl) return;
    toastTok += 1;
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
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const iel = document.createElement('i');
      iel.className = 'pip on';
      pipsEl.appendChild(iel);
      pips.push(iel);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncModes() {
    if (modeRaid) modeRaid.setAttribute('aria-pressed', G.kind === 'raid' ? 'true' : 'false');
    if (modeCore) modeCore.setAttribute('aria-pressed', G.kind === 'core' ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.comboT > 0);
    const st = stageSpec();
    if (stageLabel) {
      stageLabel.textContent = G.mode === 'title' ? (isCore() ? '核甲' : '机战') : st.name;
      stageLabel.classList.toggle('hot', G.combo >= 3 || G.phase === 'boss');
    }
    if (tagLabel) {
      if (G.mode === 'title') {
        tagLabel.textContent = isCore() ? '核甲' : '机战';
        tagLabel.className = isCore() ? 'warn' : '';
      } else if (G.phase === 'boss') {
        tagLabel.textContent = st.boss;
        tagLabel.className = 'hot';
      } else {
        tagLabel.textContent = '第 ' + G.wave + ' 波';
        tagLabel.className = G.wave >= 3 ? 'warn' : '';
      }
    }
    if (dashLabel) {
      if (G.dashT > 0) {
        dashLabel.textContent = '冲';
        dashLabel.className = 'dash go';
      } else if (G.dashCd > 0) {
        dashLabel.textContent = '冲 ' + Math.ceil(G.dashCd * 10) / 10;
        dashLabel.className = 'dash wait';
      } else {
        dashLabel.textContent = '冲';
        dashLabel.className = 'dash';
      }
    }
    syncPips();
    syncModes();
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
      if (ovKicker) ovKicker.textContent = 'CYBT';
      if (ovTitle) ovTitle.textContent = '机战';
      if (ovLead) {
        ovLead.textContent = '驾驶机甲在环形场里八向开火。按住射击会侧移锁朝向，近身挥光剑，冲刺穿过弹幕。撞机丢一条命。清波之后是敌方机甲王。';
      }
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = isCore() ? '核门已破' : '机甲王倒下';
      if (ovLead) ovLead.textContent = '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来一轮';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '机甲碎了';
      if (ovLead) ovLead.textContent = '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    }
  }

  function kick(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function screenFlash(rgb, a) {
    G.flash = a;
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 6);
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
    capArr(particles, REDUCE ? 80 : 220);
  }

  function spawnPop(x, y, text, rgb) {
    pops.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85, life: 0.85 });
    capArr(pops, 18);
  }

  function spawnRing(x, y, rgb, maxR) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, maxR: maxR || 42 });
    capArr(rings, 16);
  }

  function showChain(n) {
    if (!chainPop || REDUCE) return;
    chainTok += 1;
    const tok = chainTok;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    setTimeout(function () {
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }

  function bumpCombo() {
    const prev = G.mult;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = 1 + Math.min(4, (G.combo - 1) / 3 | 0);
    if (G.combo >= 2) audio.combo(G.combo);
    if (G.mult > prev) showChain(G.mult);
  }

  function resetFx() {
    particles.length = 0;
    pops.length = 0;
    rings.length = 0;
    lasers.length = 0;
    trails.length = 0;
    halves.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 28; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.6, 1.8),
        a: rand(0.08, 0.22),
        p: Math.random()
      });
    }
  }

  function blockedAt(x, y, r) {
    if (x - r < WALL || y - r < WALL || x + r > VW - WALL || y + r > VH - WALL) return true;
    for (let i = 0; i < G.covers.length; i++) {
      const c = G.covers[i];
      if (c.hp <= 0) continue;
      if (circleBox(x, y, r, c.x, c.y, c.w, c.h)) return true;
    }
    return false;
  }

  function tryMove(ent, dx, dy, r) {
    const nx = ent.x + dx;
    const ny = ent.y + dy;
    if (!blockedAt(nx, ent.y, r)) ent.x = nx;
    if (!blockedAt(ent.x, ny, r)) ent.y = ny;
    ent.x = clamp(ent.x, WALL + r, VW - WALL - r);
    ent.y = clamp(ent.y, WALL + r, VH - WALL - r);
  }

  function coverAtShot(x, y) {
    for (let i = 0; i < G.covers.length; i++) {
      const c = G.covers[i];
      if (c.hp <= 0) continue;
      if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return c;
    }
    return null;
  }

  function spawnEdge(r) {
    let tries = 0;
    while (tries < 40) {
      tries += 1;
      const side = (Math.random() * 4) | 0;
      let x;
      let y;
      if (side === 0) { x = WALL + 28 + rand(0, VW - WALL * 2 - 56); y = WALL + r + 8; }
      else if (side === 1) { x = WALL + 28 + rand(0, VW - WALL * 2 - 56); y = VH - WALL - r - 8; }
      else if (side === 2) { x = WALL + r + 8; y = WALL + 28 + rand(0, VH - WALL * 2 - 56); }
      else { x = VW - WALL - r - 8; y = WALL + 28 + rand(0, VH - WALL * 2 - 56); }
      if (hypot(x - G.player.x, y - G.player.y) < 90) continue;
      if (blockedAt(x, y, r + 2)) continue;
      return { x: x, y: y };
    }
    return { x: VW * 0.5 + rand(-80, 80), y: WALL + 40 };
  }

  function addEnt(kind, x, y, dummy) {
    const spec = ENT[kind];
    const face = snap8(G.player.x - x, G.player.y - y);
    G.ents.push({
      k: kind,
      x: x,
      y: y,
      r: spec.r,
      hp: spec.hp,
      max: spec.hp,
      fx: face[0],
      fy: face[1],
      cd: rand(0.2, spec.fire || 1),
      walk: rand(0, TAU),
      rushT: rand(0.3, 1.1),
      phase: 0,
      dummy: !!dummy,
      alive: true
    });
  }

  function spawnWave() {
    const st = stageSpec();
    const packs = st.waves[Math.min(G.wave - 1, st.waves.length - 1)];
    const dens = isCore() ? coreMul() : 1;
    for (let i = 0; i < packs.length; i++) {
      let n = Math.ceil(packs[i].n * dens);
      if (isCore() && packs[i].k === 'drone') n += 1;
      for (let k = 0; k < n; k++) {
        const pos = spawnEdge(ENT[packs[i].k].r);
        addEnt(packs[i].k, pos.x, pos.y, false);
      }
    }
    G.phase = 'wave';
    G.waveT = 0;
    G.ready = 0.28;
    audio.wave();
    toast(st.name + ' · 第 ' + G.wave + ' 波', false, G.wave === 1);
  }

  function spawnBoss() {
    const st = stageSpec();
    const hp = Math.round(st.bossHp * (isCore() ? 1.24 : 1));
    G.boss = {
      k: st.kind,
      name: st.boss,
      x: VW * 0.5,
      y: 128,
      r: st.bossR,
      hp: hp,
      max: hp,
      fx: 0,
      fy: 1,
      t: 0,
      cd: 1.1,
      armL: 1,
      armR: 1,
      swipe: 0,
      swipeA: 0,
      swipeLen: 28,
      ringT: 0,
      charge: 0,
      vx: 0,
      vy: 0,
      alive: true
    };
    G.phase = 'boss';
    G.ready = 0.45;
    audio.boss();
    toast(st.boss + ' 入场', true, false);
    spawnRing(G.boss.x, G.boss.y, MAG, 80);
    kick('thump');
    screenFlash(MAG, 0.28);
    hitStop(0.05);
  }

  function buildArena() {
    const st = stageSpec();
    G.covers = [];
    for (let i = 0; i < st.covers.length; i++) {
      const c = st.covers[i];
      G.covers.push({ x: c[0], y: c[1], w: c[2], h: c[3], hp: 4, max: 4 });
    }
    G.ents = [];
    G.shots = [];
    G.pShots = [];
    G.boss = null;
    G.phase = 'wave';
    G.wave = 1;
    G.player.x = VW * 0.5;
    G.player.y = VH * 0.62;
    G.player.fx = 0;
    G.player.fy = -1;
    G.fireCd = 0;
    G.slashCd = 0;
    G.slashT = 0;
    G.dashT = 0;
    G.dashCd = 0;
    G.dashI = 0;
    G.deadT = 0;
    G.invuln = 0.7;
    G.clearT = 0;
    resetFx();
  }

  function liveEnts() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) if (G.ents[i].alive) n += 1;
    return n;
  }

  function inSword(x, y) {
    const p = G.player;
    const dx = x - p.x;
    const dy = y - p.y;
    const d = hypot(dx, dy);
    if (d > SWORD_R || d < 2) return false;
    const fl = hypot(p.fx, p.fy) || 1;
    const dot = (dx * p.fx + dy * p.fy) / (d * fl);
    return dot > SWORD_DOT;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'raid';
    G.mode = 'play';
    G.stage = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.why = '';
    G.nextLife = LIFE_EVERY;
    buildArena();
    spawnWave();
    hideOverlay();
    audio.start();
    setHint(isCore() ? '核甲更密 · 按住射击侧移 · 近斩双倍' : '按住射击侧移 · 近身斩双倍 · 冲刺穿弹', isCore() ? 'warn' : '');
    syncHud();
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 0;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    buildArena();
    G.invuln = 99;
    G.phase = 'wave';
    for (let i = 0; i < 5; i++) {
      const pos = spawnEdge(ENT.drone.r);
      addEnt(i % 2 ? 'walker' : 'drone', pos.x, pos.y, true);
    }
    showOverlay('title');
    setHint('按住射击侧移 · 近身斩双倍 · 冲刺穿弹 · 撞机丢命');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('raid');
      return;
    }
    startGame(G.kind);
  }

  function winRun() {
    if (G.mode !== 'play') return;
    G.mode = 'win';
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.45);
    hitStop(0.08);
    showOverlay('win');
    setHint((isCore() ? '核门已破' : '机甲王倒下') + ' · R 再来', 'hot');
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.why = why;
    fireHold = false;
    slashHold = false;
    audio.lose();
    kick('die');
    screenFlash(MAG, 0.5);
    hitStop(0.08);
    showOverlay('lose');
    setHint('R 重开随时可用', 'warn');
    syncHud();
  }

  function hurtPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.dashI > 0) return;
    G.deadT = DIE_T;
    G.lives -= 1;
    G.shots = [];
    dashQueued = false;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    audio.hurt();
    kick('die');
    screenFlash(MAG, 0.42);
    hitStop(0.072);
    G.shake = Math.max(G.shake, 9);
    emit(26, {
      x: G.player.x, y: G.player.y, j: 8,
      vx0: -220, vx1: 220, vy0: -240, vy1: 160,
      life: 0.5, r0: 1.6, r1: 4.2, rgb: CYN, g: 280
    });
    spawnRing(G.player.x, G.player.y, MAG, 56);
    G.why = why;
    toast(why, true, false);
    syncHud();
  }

  function finishDeath() {
    if (G.lives <= 0) {
      loseRun(G.why || '机甲碎了');
      return;
    }
    G.player.x = VW * 0.5;
    G.player.y = VH * 0.62;
    G.invuln = INVULN;
    G.deadT = 0;
    G.ready = 0.18;
    G.dashI = 0;
    dashQueued = false;
    toast('剩余 ' + G.lives + ' 命', true, false);
    syncHud();
  }

  function hitCover(c, dmg) {
    if (!c || c.hp <= 0) return;
    c.hp -= dmg;
    emit(8, {
      x: c.x + c.w * 0.5, y: c.y + c.h * 0.5, j: 10,
      vx0: -80, vx1: 80, vy0: -90, vy1: 40,
      life: 0.22, r0: 1.2, r1: 2.8, rgb: STL, g: 40
    });
    if (c.hp <= 0) {
      audio.boom();
      emit(16, {
        x: c.x + c.w * 0.5, y: c.y + c.h * 0.5, j: 14,
        vx0: -160, vx1: 160, vy0: -180, vy1: 80,
        life: 0.36, r0: 1.6, r1: 4, rgb: HOT, g: 120
      });
      hitStop(0.03);
    }
  }

  function splitEnt(ent, ux, uy) {
    const px = -uy;
    const py = ux;
    halves.push({
      x: ent.x, y: ent.y, vx: px * 90, vy: py * 90 - 20,
      ang: Math.atan2(ent.fy, ent.fx), t: 0.42, life: 0.42, rgb: palFor(ent.k).bodyArr, side: -1, r: ent.r
    });
    halves.push({
      x: ent.x, y: ent.y, vx: -px * 90, vy: -py * 90 - 20,
      ang: Math.atan2(ent.fy, ent.fx), t: 0.42, life: 0.42, rgb: palFor(ent.k).bodyArr, side: 1, r: ent.r
    });
  }

  function killEnt(ent, how) {
    if (!ent.alive) return;
    ent.alive = false;
    const melee = how === 'slash';
    if (melee) {
      audio.split();
      const fl = hypot(G.player.fx, G.player.fy) || 1;
      splitEnt(ent, G.player.fx / fl, G.player.fy / fl);
      kick('slash');
    } else {
      audio.boom();
      kick('boom');
    }
    emit(melee ? 22 : 18, {
      x: ent.x, y: ent.y, j: 6,
      vx0: -200, vx1: 200, vy0: -220, vy1: 120,
      life: 0.42, r0: 1.4, r1: 3.8, rgb: melee ? LEAF : palFor(ent.k).bodyArr, g: 180
    });
    spawnRing(ent.x, ent.y, melee ? LEAF : palFor(ent.k).bodyArr, 36);
    if (G.mode !== 'play' || ent.dummy) {
      if (G.mode === 'title') {
        const pos = spawnEdge(ENT[ent.k] ? ENT[ent.k].r : 10);
        addEnt(ent.k, pos.x, pos.y, true);
      }
      return;
    }
    bumpCombo();
    const base = ENT[ent.k] ? ENT[ent.k].score : 100;
    const pts = (melee ? base * 2 : base) * G.mult;
    addScore(pts, ent.x, ent.y);
    hitStop(melee ? 0.058 : (0.034 + Math.min(0.04, G.combo * 0.005)));
    G.shake = Math.max(G.shake, melee ? 6 : 4 + Math.min(3, G.combo * 0.4));
    G.punch = melee ? 0.96 : 0.978;
  }

  function damageEnt(ent, dmg, how, hx, hy) {
    if (!ent.alive) return;
    ent.hp -= dmg;
    audio.hit();
    emit(6, {
      x: hx, y: hy, j: 3,
      vx0: -70, vx1: 70, vy0: -80, vy1: 30,
      life: 0.18, r0: 1, r1: 2.2, rgb: WHT, g: 0
    });
    if (ent.hp <= 0) killEnt(ent, how);
    else {
      hitStop(0.032);
      G.shake = Math.max(G.shake, 2);
      kick('hit');
    }
  }

  function killBoss(how) {
    const b = G.boss;
    if (!b || !b.alive) return;
    b.alive = false;
    audio.boom();
    audio.split();
    emit(48, {
      x: b.x, y: b.y, j: 18,
      vx0: -280, vx1: 280, vy0: -300, vy1: 160,
      life: 0.7, r0: 2, r1: 6, rgb: GOLD, g: 240
    });
    spawnRing(b.x, b.y, GOLD, 90);
    kick('boom');
    hitStop(0.078);
    G.shake = 12;
    screenFlash(GOLD, 0.4);
    if (G.mode !== 'play') return;
    bumpCombo();
    addScore(4000 * G.mult, b.x, b.y);
    const st = stageSpec();
    addScore(1500 * (G.stage + 1) * G.mult, b.x, b.y - 20);
    toast(st.boss + ' 击破', false, true);
    G.clearT = 1.35;
    G.boss = null;
  }

  function damageBoss(dmg, how, hx, hy) {
    const b = G.boss;
    if (!b || !b.alive) return;
    b.hp -= dmg;
    audio.hit();
    emit(8, {
      x: hx, y: hy, j: 4,
      vx0: -90, vx1: 90, vy0: -100, vy1: 40,
      life: 0.2, r0: 1.2, r1: 2.6, rgb: GOLD, g: 0
    });
    hitStop(how === 'slash' ? 0.055 : 0.038);
    G.shake = Math.max(G.shake, 4);
    kick('hit');
    if (b.k === 'arm') {
      if (b.hp < b.max * 0.66 && b.armL) {
        b.armL = 0;
        toast('左臂斩断', false, true);
        audio.split();
      }
      if (b.hp < b.max * 0.33 && b.armR) {
        b.armR = 0;
        toast('右臂斩断', false, true);
        audio.split();
      }
    }
    if (b.hp <= 0) killBoss(how);
  }

  function firePlayer() {
    if ((G.mode !== 'play' && G.mode !== 'title') || G.deadT > 0 || G.ready > 0) return;
    if (G.fireCd > 0 || G.pShots.length >= MAX_PSHOT) return;
    const p = G.player;
    let fx = p.fx;
    let fy = p.fy;
    if (ptr.down && G.mode === 'play') {
      const s = snap8(ptr.x - p.x, ptr.y - p.y);
      fx = s[0];
      fy = s[1];
      p.fx = fx;
      p.fy = fy;
    }
    const len = hypot(fx, fy) || 1;
    const ux = fx / len;
    const uy = fy / len;
    G.pShots.push({
      x: p.x + ux * 18,
      y: p.y + uy * 18,
      vx: ux * SHOT_SPD,
      vy: uy * SHOT_SPD,
      r: SHOT_R,
      life: 0.72
    });
    G.fireCd = FIRE_CD;
    G.muzzle = 0.06;
    audio.zap();
    lasers.push({ x: p.x, y: p.y, ux: ux, uy: uy, t: 0.08, rgb: CYN });
    emit(4, {
      x: p.x + ux * 16, y: p.y + uy * 16, j: 2,
      vx0: ux * 40, vx1: ux * 140, vy0: uy * 40, vy1: uy * 140,
      life: 0.12, r0: 1, r1: 2.2, rgb: CYN, g: 0
    });
  }

  function doSlash() {
    if ((G.mode !== 'play' && G.mode !== 'title') || G.deadT > 0 || G.ready > 0) return;
    if (G.slashCd > 0) return;
    G.slashCd = SWORD_CD;
    G.slashT = SWORD_T;
    audio.slash();
    kick('slash');
    screenFlash(LEAF, 0.16);
    G.punch = 0.97;
    const p = G.player;
    const fl = hypot(p.fx, p.fy) || 1;
    const ux = p.fx / fl;
    const uy = p.fy / fl;
    emit(10, {
      x: p.x + ux * 22, y: p.y + uy * 22, j: 10,
      vx0: ux * 40 - 80, vx1: ux * 180 + 80, vy0: uy * 40 - 80, vy1: uy * 180 + 80,
      life: 0.18, r0: 1.2, r1: 2.8, rgb: LEAF, g: 0
    });
    let hits = 0;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (inSword(s.x, s.y)) {
        emit(5, {
          x: s.x, y: s.y, j: 2,
          vx0: -60, vx1: 60, vy0: -70, vy1: 30,
          life: 0.14, r0: 1, r1: 2, rgb: LEAF, g: 0
        });
        G.shots.splice(i, 1);
        hits += 1;
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (inSword(e.x, e.y)) {
        damageEnt(e, 2, 'slash', e.x, e.y);
        hits += 1;
      }
    }
    if (G.boss && G.boss.alive && inSword(G.boss.x, G.boss.y)) {
      damageBoss(2, 'slash', G.boss.x, G.boss.y);
      hits += 1;
    }
    if (hits) hitStop(0.05);
  }

  function tryDash() {
    if ((G.mode !== 'play' && G.mode !== 'title') || G.deadT > 0 || G.ready > 0) return;
    if (G.dashCd > 0 || G.dashT > 0) return;
    let mx = (inR() ? 1 : 0) - (inL() ? 1 : 0);
    let my = (inD() ? 1 : 0) - (inU() ? 1 : 0);
    if (!mx && !my) {
      mx = G.player.fx;
      my = G.player.fy;
    }
    const s = snap8(mx, my);
    G.player.fx = s[0];
    G.player.fy = s[1];
    G.dashT = DASH_T;
    G.dashI = DASH_IFRAME;
    G.dashCd = DASH_CD;
    dashQueued = false;
    audio.dash();
    kick('thump');
    screenFlash(HOT, 0.12);
    const p = G.player;
    for (let i = 0; i < 4; i++) {
      trails.push({ x: p.x, y: p.y, fx: p.fx, fy: p.fy, t: 0.16 + i * 0.02 });
    }
  }

  function enemyShot(ent, ux, uy, spd, r, rgb) {
    const len = hypot(ux, uy) || 1;
    G.shots.push({
      x: ent.x + ux / len * (ent.r + 6),
      y: ent.y + uy / len * (ent.r + 6),
      vx: ux / len * spd,
      vy: uy / len * spd,
      r: r,
      rgb: rgb || MAG,
      life: 1.6
    });
    capArr(G.shots, 48);
  }

  function demoThink() {
    const p = G.player;
    const ang = G.t * 0.55;
    const tx = VW * 0.5 + Math.cos(ang) * 110;
    const ty = VH * 0.55 + Math.sin(ang * 1.3) * 70;
    demo.l = p.x > tx + 6;
    demo.r = p.x < tx - 6;
    demo.u = p.y > ty + 6;
    demo.d = p.y < ty - 6;
    demo.fire = true;
    demo.slash = false;
    demo.dash = false;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (hypot(e.x - p.x, e.y - p.y) < 56) demo.slash = true;
    }
    if (((G.t * 2) | 0) % 7 === 0 && (G.t * 10 | 0) % 10 < 2) demo.dash = true;
    let nearest = null;
    let nd = 9999;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const d = hypot(e.x - p.x, e.y - p.y);
      if (d < nd) { nd = d; nearest = e; }
    }
    if (nearest) {
      const s = snap8(nearest.x - p.x, nearest.y - p.y);
      p.fx = s[0];
      p.fy = s[1];
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const p = G.player;
    p.walk += dt * 10;
    let mx = (inR() ? 1 : 0) - (inL() ? 1 : 0);
    let my = (inD() ? 1 : 0) - (inU() ? 1 : 0);
    const lock = fireHeld() || slashHeld() || G.slashT > 0;
    if (ptr.down && G.mode === 'play') {
      const s = snap8(ptr.x - p.x, ptr.y - p.y);
      p.fx = s[0];
      p.fy = s[1];
    }
    if (G.dashT > 0) {
      const len = hypot(p.fx, p.fy) || 1;
      tryMove(p, p.fx / len * DASH_SPD * dt, p.fy / len * DASH_SPD * dt, P_R);
      if ((G.t * 40 | 0) % 2 === 0) {
        trails.push({ x: p.x, y: p.y, fx: p.fx, fy: p.fy, t: 0.18 });
        capArr(trails, 12);
      }
    } else if (mx || my) {
      const s = snap8(mx, my);
      const len = hypot(s[0], s[1]) || 1;
      if (!lock) {
        p.fx = s[0];
        p.fy = s[1];
      }
      const spd = walkSpd(isCore() && G.mode === 'play');
      tryMove(p, s[0] / len * spd * dt, s[1] / len * spd * dt, P_R);
    }
    if (dashWanted()) tryDash();
    if (fireHeld()) firePlayer();
    let wantSlash = slashHeld();
    if (!wantSlash) {
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.alive && inSword(e.x, e.y)) { wantSlash = true; break; }
      }
      if (!wantSlash && G.boss && G.boss.alive && inSword(G.boss.x, G.boss.y)) wantSlash = true;
    }
    if (wantSlash) doSlash();
  }

  function updateEnts(dt) {
    const p = G.player;
    const mul = spdMul(isCore() && G.mode === 'play', G.stage);
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const spec = ENT[e.k];
      e.walk += dt * 8;
      e.cd -= dt;
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = hypot(dx, dy) || 1;
      if (e.k !== 'turret' && e.k !== 'blade') {
        const face = snap8(dx, dy);
        e.fx = face[0];
        e.fy = face[1];
        if (e.k === 'drone') {
          const ang = Math.atan2(e.y - VH * 0.5, e.x - VW * 0.5) + dt * 1.2;
          const rad = 70 + (e.walk % 1) * 40;
          const tx = VW * 0.5 + Math.cos(ang) * rad;
          const ty = VH * 0.5 + Math.sin(ang) * rad * 0.7;
          tryMove(e, (tx - e.x) * dt * 1.6, (ty - e.y) * dt * 1.6, e.r);
        } else {
          const spd = spec.spd * mul;
          tryMove(e, dx / d * spd * dt, dy / d * spd * dt, e.r);
        }
      }
      if (e.k === 'blade') {
        e.rushT -= dt;
        if (e.phase === 0 && e.rushT <= 0) {
          e.phase = 1;
          e.rushT = 0.18;
          const s = snap8(dx, dy);
          e.fx = s[0];
          e.fy = s[1];
        } else if (e.phase === 1 && e.rushT <= 0) {
          e.phase = 2;
          e.rushT = 0.28;
        } else if (e.phase === 2) {
          const len = hypot(e.fx, e.fy) || 1;
          tryMove(e, e.fx / len * spec.rush * mul * dt, e.fy / len * spec.rush * mul * dt, e.r);
          if (e.rushT <= 0) {
            e.phase = 0;
            e.rushT = 0.55;
          }
        }
      }
      if (e.k === 'turret') {
        const s = snap8(dx, dy);
        e.fx = s[0];
        e.fy = s[1];
      }
      if (!e.dummy && G.mode === 'play' && spec.fire && e.cd <= 0 && G.deadT <= 0) {
        e.cd = spec.fire / mul * rand(0.85, 1.15);
        enemyShot(e, dx, dy, spec.shot * (isCore() ? 1.12 : 1), spec.sr, e.k === 'heavy' ? GOLD : MAG);
        lasers.push({ x: e.x, y: e.y, ux: dx / d, uy: dy / d, t: 0.05, rgb: MAG });
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || !b.alive) return;
    const p = G.player;
    const mul = spdMul(isCore() && G.mode === 'play', G.stage);
    b.t += dt;
    b.cd -= dt;
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    const d = hypot(dx, dy) || 1;
    const s = snap8(dx, dy);
    b.fx = s[0];
    b.fy = s[1];

    if (b.k === 'moon') {
      if (b.charge > 0) {
        b.charge -= dt;
        tryMove(b, b.vx * dt, b.vy * dt, b.r);
        if (b.charge <= 0) { b.vx = 0; b.vy = 0; }
      } else {
        const ang = b.t * 0.7;
        const tx = VW * 0.5 + Math.cos(ang) * 130;
        const ty = 110 + Math.sin(ang * 1.4) * 36;
        tryMove(b, (tx - b.x) * dt * 2.2, (ty - b.y) * dt * 2.2, b.r);
        if (b.cd <= 0) {
          if (Math.random() < 0.28) {
            b.charge = 0.38;
            b.vx = dx / d * 280;
            b.vy = dy / d * 280;
            b.cd = 1.6 / mul;
            toast('月牙突进', true, false);
          } else {
            const base = Math.atan2(dy, dx);
            for (let k = -2; k <= 2; k++) {
              const a = base + k * 0.22;
              enemyShot(b, Math.cos(a), Math.sin(a), 168 * mul, 3.4, MAG);
            }
            b.cd = 1.25 / mul;
          }
        }
      }
    } else if (b.k === 'arm') {
      tryMove(b, (VW * 0.5 - b.x) * dt * 1.4, (128 - b.y) * dt * 1.2, b.r);
      if (b.swipe > 0) {
        b.swipe -= dt;
        const u = 1 - Math.abs(b.swipe / 0.42 - 1);
        b.swipeLen = 28 + u * 78;
        if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.dashI <= 0) {
          const ax = b.x;
          const ay = b.y;
          const bx2 = b.x + Math.cos(b.swipeA) * b.swipeLen;
          const by2 = b.y + Math.sin(b.swipeA) * b.swipeLen;
          if ((b.armL && Math.cos(b.swipeA) < 0.2) || (b.armR && Math.cos(b.swipeA) > -0.2)) {
            if (segHit(p.x, p.y, P_R, ax, ay, bx2, by2, 8)) hurtPlayer('被斩了');
          }
        }
      } else if (b.cd <= 0) {
        if ((b.armL || b.armR) && Math.random() < 0.55) {
          b.swipe = 0.42;
          b.swipeA = Math.atan2(dy, dx);
          b.cd = 1.05 / mul;
        } else {
          enemyShot(b, dx, dy, 200 * mul, 4.2, GOLD);
          if (b.hp < b.max * 0.5) {
            enemyShot(b, dx - dy * 0.25, dy + dx * 0.25, 180 * mul, 3.2, MAG);
            enemyShot(b, dx + dy * 0.25, dy - dx * 0.25, 180 * mul, 3.2, MAG);
          }
          b.cd = 0.95 / mul;
        }
      }
    } else {
      if (b.ringT > 0) {
        b.ringT -= dt;
        const rad = (1 - b.ringT / 0.55) * 90;
        if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.dashI <= 0) {
          const dd = hypot(p.x - b.x, p.y - b.y);
          if (Math.abs(dd - rad) < 10) hurtPlayer('被斩了');
        }
      }
      if (b.cd <= 0) {
        const roll = Math.random();
        if (roll < 0.34) {
          let nx = b.x;
          let ny = b.y;
          let ok = false;
          for (let t = 0; t < 12 && !ok; t++) {
            nx = WALL + 70 + Math.random() * (VW - 140);
            ny = WALL + 56 + Math.random() * 170;
            if (!blockedAt(nx, ny, b.r + 4) && hypot(nx - p.x, ny - p.y) > 70) ok = true;
          }
          if (ok) {
            b.x = nx;
            b.y = ny;
          }
          spawnRing(b.x, b.y, MAG, 50);
          audio.boss();
          b.cd = 1.15 / mul;
        } else if (roll < 0.7) {
          for (let k = 0; k < 8; k++) {
            const a = k * TAU / 8 + b.t;
            enemyShot(b, Math.cos(a), Math.sin(a), 150 * mul, 3.3, MAG);
          }
          b.cd = 1.05 / mul;
        } else {
          b.ringT = 0.55;
          spawnRing(b.x, b.y, LEAF, 90);
          kick('slash');
          b.cd = 1.35 / mul;
        }
      } else {
        tryMove(b, dx / d * 36 * dt, dy / d * 36 * dt, b.r);
      }
    }
  }

  function updateShots(dt) {
    const steps = 3;
    const h = dt / steps;
    for (let i = G.pShots.length - 1; i >= 0; i--) {
      const s = G.pShots[i];
      let live = true;
      for (let k = 0; k < steps && live; k++) {
        s.x += s.vx * h;
        s.y += s.vy * h;
        if (s.x < WALL || s.y < WALL || s.x > VW - WALL || s.y > VH - WALL) {
          live = false;
        } else {
          const cov = coverAtShot(s.x, s.y);
          if (cov) {
            hitCover(cov, 1);
            live = false;
          } else {
            for (let n = 0; n < G.ents.length; n++) {
              const e = G.ents[n];
              if (!e.alive) continue;
              if (hypot(s.x - e.x, s.y - e.y) < e.r + s.r) {
                damageEnt(e, 1, 'shot', s.x, s.y);
                live = false;
                break;
              }
            }
            if (live && G.boss && G.boss.alive && hypot(s.x - G.boss.x, s.y - G.boss.y) < G.boss.r + s.r) {
              damageBoss(1, 'shot', s.x, s.y);
              live = false;
            }
          }
        }
      }
      s.life -= dt;
      if (!live || s.life <= 0) G.pShots.splice(i, 1);
    }

    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      let live = true;
      for (let k = 0; k < steps && live; k++) {
        s.x += s.vx * h;
        s.y += s.vy * h;
        if (s.x < WALL || s.y < WALL || s.x > VW - WALL || s.y > VH - WALL) live = false;
        else if (coverAtShot(s.x, s.y)) live = false;
        else if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.dashI <= 0) {
          if (hypot(s.x - G.player.x, s.y - G.player.y) < P_R * 0.72 + s.r) {
            hurtPlayer('中弹了');
            live = false;
          }
        }
      }
      s.life -= dt;
      if (!live || s.life <= 0) {
        if (live === false) {
          emit(4, {
            x: s.x, y: s.y, j: 2,
            vx0: -50, vx1: 50, vy0: -50, vy1: 30,
            life: 0.12, r0: 0.8, r1: 1.8, rgb: s.rgb || MAG, g: 0
          });
        }
        G.shots.splice(i, 1);
      }
    }
  }

  function crashCheck() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.dashI > 0) return;
    const p = G.player;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (hypot(e.x - p.x, e.y - p.y) < e.r + P_R - 2) {
        hurtPlayer(e.k === 'blade' ? '被斩了' : '撞上了');
        return;
      }
    }
    if (G.boss && G.boss.alive && hypot(G.boss.x - p.x, G.boss.y - p.y) < G.boss.r + P_R - 4) {
      hurtPlayer('撞上了');
    }
  }

  function checkWave() {
    if (G.mode !== 'play' || G.deadT > 0 || G.clearT > 0) return;
    if (G.phase === 'wave' && liveEnts() === 0 && G.waveT > 0.4) {
      if (G.wave < 3) {
        G.wave += 1;
        G.waveT = 0;
        spawnWave();
        syncHud();
      } else {
        spawnBoss();
        syncHud();
      }
    }
  }

  function finishClear() {
    if (G.mode !== 'play') return;
    if (G.stage >= STAGES.length - 1) {
      addScore(isCore() ? 10000 : 8000, G.player.x, G.player.y);
      toast(isCore() ? '核甲得手' : '机战清场', false, true);
      winRun();
      return;
    }
    G.stage += 1;
    G.comboT = Math.max(G.comboT, 0.8);
    buildArena();
    spawnWave();
    toast(stageSpec().name, false, true);
    setHint(stageSpec().name + ' · 清波后是 ' + stageSpec().boss);
    syncHud();
  }

  function updateFx(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.slashCd = Math.max(0, G.slashCd - dt);
    G.slashT = Math.max(0, G.slashT - dt);
    G.dashT = Math.max(0, G.dashT - dt);
    G.dashCd = Math.max(0, G.dashCd - dt);
    G.dashI = Math.max(0, G.dashI - dt);
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    G.ready = Math.max(0, G.ready - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl && !toastEl.classList.contains('hidden')) toastEl.classList.add('hidden');
    G.shake = Math.max(0, G.shake - dt * 28);
    G.flash = Math.max(0, G.flash - dt * 2.6);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.001, dt));
    G.waveT += dt;
    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) finishClear();
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) finishDeath();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.t -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy += q.g * dt;
      if (q.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= 22 * dt;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.36) rings.splice(i, 1);
    }
    for (let i = lasers.length - 1; i >= 0; i--) {
      lasers[i].t -= dt;
      if (lasers[i].t <= 0) lasers.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t -= dt;
      if (trails[i].t <= 0) trails.splice(i, 1);
    }
    for (let i = halves.length - 1; i >= 0; i--) {
      const h = halves[i];
      h.t -= dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.vy += 280 * dt;
      if (h.t <= 0) halves.splice(i, 1);
    }
  }

  function update(dt) {
    if (G.mode === 'title') demoThink();
    if (G.mode === 'title' || G.mode === 'play') {
      updatePlayer(dt);
      updateEnts(dt);
      updateBoss(dt);
      updateShots(dt);
      crashCheck();
      checkWave();
    }
    updateFx(dt);
    if ((G.clock * 8 | 0) !== ((G.clock - dt) * 8 | 0)) syncHud();
  }

  function palFor(kind) {
    if (kind === 'drone') {
      return { body: '#ff5ec8', visor: '#ffd0ec', gun: '#ffe36b', leg: '#c83a90', sword: rgba(MAG, 0.9), bodyArr: MAG };
    }
    if (kind === 'walker') {
      return { body: '#ff8a3a', visor: '#ffe0c0', gun: '#ffe36b', leg: '#b85a22', sword: rgba(GOLD, 0.85), bodyArr: [255, 138, 58] };
    }
    if (kind === 'blade') {
      return { body: '#c86bff', visor: '#f0d0ff', gun: '#b8ff4a', leg: '#7a38b0', sword: rgba(LEAF, 1), bodyArr: [200, 107, 255] };
    }
    if (kind === 'turret') {
      return { body: '#3a6a78', visor: '#7dfff0', gun: '#00ddff', leg: '#244850', sword: rgba(HOT, 0.7), bodyArr: STL };
    }
    if (kind === 'heavy') {
      return { body: '#d4a24a', visor: '#fff0c8', gun: '#ff6b3a', leg: '#8a6830', sword: rgba(GOLD, 0.8), bodyArr: GOLD };
    }
    return { body: '#00ddff', visor: '#e8ffff', gun: '#ffe36b', leg: '#00a0b8', sword: rgba(LEAF, 1), bodyArr: HOT };
  }

  function drawFloor() {
    ctx.fillStyle = '#071820';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.strokeStyle = 'rgba(0,221,255,0.07)';
    ctx.lineWidth = 1;
    const step = 32;
    for (let x = WALL; x < VW - WALL; x += step) {
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(WALL));
      ctx.lineTo(sx(x), sy(VH - WALL));
      ctx.stroke();
    }
    for (let y = WALL; y < VH - WALL; y += step) {
      ctx.beginPath();
      ctx.moveTo(sx(WALL), sy(y));
      ctx.lineTo(sx(VW - WALL), sy(y));
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(HOT, 0.55);
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.strokeRect(sx(WALL), sy(WALL), (VW - WALL * 2) * scale, (VH - WALL * 2) * scale);
    ctx.strokeStyle = rgba(HOT, 0.18);
    ctx.lineWidth = Math.max(6, 8 * scale);
    ctx.strokeRect(sx(WALL - 4), sy(WALL - 4), (VW - WALL * 2 + 8) * scale, (VH - WALL * 2 + 8) * scale);
  }

  function drawCovers() {
    for (let i = 0; i < G.covers.length; i++) {
      const c = G.covers[i];
      if (c.hp <= 0) continue;
      const a = 0.45 + 0.4 * (c.hp / c.max);
      ctx.fillStyle = rgba(IRON, a);
      ctx.fillRect(sx(c.x), sy(c.y), c.w * scale, c.h * scale);
      ctx.strokeStyle = rgba(HOT, 0.45 * (c.hp / c.max) + 0.2);
      ctx.lineWidth = Math.max(1.2, 1.6 * scale);
      ctx.strokeRect(sx(c.x), sy(c.y), c.w * scale, c.h * scale);
    }
  }

  function drawMech(x, y, fx, fy, pal, walk, size, ghost, kind, extra) {
    const ang = Math.atan2(fy, fx);
    const s = size * scale;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    if (ghost && ((G.t * 16) | 0) % 2) ctx.globalAlpha = 0.38;
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(2, 6, s * 0.72, s * 0.3, 0, 0, TAU);
    ctx.fill();
    const w = Math.sin(walk) * s * 0.18;
    ctx.fillStyle = pal.leg;
    ctx.fillRect(-s * 0.28, -s * 0.42 + w, s * 0.46, s * 0.28);
    ctx.fillRect(-s * 0.28, s * 0.14 - w, s * 0.46, s * 0.28);
    ctx.fillStyle = pal.body;
    ctx.beginPath();
    ctx.moveTo(s * 0.78, 0);
    ctx.lineTo(-s * 0.18, s * 0.52);
    ctx.lineTo(-s * 0.52, 0);
    ctx.lineTo(-s * 0.18, -s * 0.52);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(WHT, 0.25);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = pal.visor;
    ctx.fillRect(s * 0.18, -s * 0.2, s * 0.34, s * 0.4);
    ctx.fillStyle = pal.gun;
    ctx.fillRect(s * 0.36, s * 0.2, s * 0.58, s * 0.14);
    if (kind !== 'drone' && kind !== 'turret') {
      ctx.strokeStyle = pal.sword;
      ctx.lineWidth = Math.max(2, s * 0.12);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.28, -s * 0.26);
      ctx.lineTo(s * 1.05, -s * 0.52);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(s * 0.28, -s * 0.26, s * 0.08, 0, TAU);
      ctx.fill();
    }
    if (extra === 'king') {
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(-s * 0.1, -s * 0.7, s * 0.2, s * 0.18);
    }
    ctx.restore();
  }

  function drawSlashArc() {
    if (G.slashT <= 0 || G.deadT > 0) return;
    const p = G.player;
    const ang = Math.atan2(p.fy, p.fx);
    const span = Math.acos(SWORD_DOT);
    const a = G.slashT / SWORD_T;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.strokeStyle = rgba(LEAF, 0.85 * a);
    ctx.lineWidth = Math.max(3, 7 * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, SWORD_R * scale, ang - span, ang + span);
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.7 * a);
    ctx.lineWidth = Math.max(1.4, 2.4 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function drawShot(s, player) {
    const rgb = s.rgb || (player ? CYN : MAG);
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.arc(sx(s.x), sy(s.y), Math.max(1.6, s.r * scale), 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.beginPath();
    ctx.arc(sx(s.x), sy(s.y), Math.max(0.8, s.r * scale * 0.4), 0, TAU);
    ctx.fill();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || !b.alive) return;
    if (b.k === 'arm') {
      const angs = [];
      if (b.swipe > 0) {
        angs.push(b.swipeA);
      } else {
        if (b.armL) angs.push(Math.PI * 0.92);
        if (b.armR) angs.push(0.08);
      }
      const len = b.swipe > 0 ? b.swipeLen : 36;
      for (let i = 0; i < angs.length; i++) {
        ctx.strokeStyle = rgba([255, 138, 58], 0.92);
        ctx.lineWidth = Math.max(5, 8 * scale);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx(b.x), sy(b.y));
        ctx.lineTo(sx(b.x + Math.cos(angs[i]) * len), sy(b.y + Math.sin(angs[i]) * len));
        ctx.stroke();
        ctx.strokeStyle = rgba(GOLD, 0.7);
        ctx.lineWidth = Math.max(2, 3 * scale);
        ctx.stroke();
      }
    }
    const pal = b.k === 'moon'
      ? { body: '#7dfff0', visor: '#e8ffff', gun: '#ffe36b', leg: '#00a8c0', sword: rgba(CYN, 1), bodyArr: HOT }
      : b.k === 'arm'
        ? { body: '#ff8a3a', visor: '#ffe0c0', gun: '#ffe36b', leg: '#b85a22', sword: rgba(GOLD, 1), bodyArr: GOLD }
        : { body: '#ff4ad4', visor: '#fff0ff', gun: '#b8ff4a', leg: '#a02880', sword: rgba(LEAF, 1), bodyArr: MAG };
    drawMech(b.x, b.y, b.fx, b.fy, pal, b.t * 6, b.r * 0.9, false, b.k, b.k);
    const bw = 72 * scale;
    const bh = 5 * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(b.x) - bw / 2, sy(b.y) - b.r * scale - 12, bw, bh);
    ctx.fillStyle = rgba(b.hp < b.max * 0.34 ? MAG : GOLD, 0.9);
    ctx.fillRect(sx(b.x) - bw / 2, sy(b.y) - b.r * scale - 12, bw * clamp(b.hp / b.max, 0, 1), bh);
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#04151a';
    ctx.fillRect(0, 0, W, H);

    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake) * 0.45;
      shy = rand(-G.shake, G.shake) * 0.45;
    }
    ctx.save();
    ctx.translate(shx, shy);
    const punch = REDUCE ? 1 : G.punch;
    if (punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(punch, punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgba(HOT, m.a);
      ctx.beginPath();
      ctx.arc(m.x * W, ((m.y + G.t * 0.015 + m.p) % 1) * H, m.r, 0, TAU);
      ctx.fill();
    }

    drawFloor();
    drawCovers();

    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const k = rg.t / 0.36;
      ctx.strokeStyle = rgba(rg.rgb, 0.7 * (1 - k));
      ctx.lineWidth = Math.max(1.5, 2.4 * scale * (1 - k));
      ctx.beginPath();
      ctx.arc(sx(rg.x), sy(rg.y), rg.maxR * scale * (0.2 + k * 0.85), 0, TAU);
      ctx.stroke();
    }

    for (let i = 0; i < lasers.length; i++) {
      const L = lasers[i];
      const a = L.t / 0.08;
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(L.rgb, 0.5 * a);
      ctx.lineWidth = 6 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(L.x), sy(L.y));
      ctx.lineTo(sx(L.x + L.ux * 22), sy(L.y + L.uy * 22));
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.85 * a);
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    }

    for (let i = 0; i < trails.length; i++) {
      const tr = trails[i];
      ctx.globalAlpha = Math.max(0.12, tr.t / 0.2) * 0.45;
      drawMech(tr.x, tr.y, tr.fx, tr.fy, palFor('player'), 0, P_R, false, 'player');
      ctx.globalAlpha = 1;
    }

    for (let i = 0; i < halves.length; i++) {
      const h = halves[i];
      const a = h.t / h.life;
      ctx.save();
      ctx.translate(sx(h.x), sy(h.y));
      ctx.rotate(h.ang);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(h.rgb, 0.9);
      ctx.beginPath();
      if (h.side < 0) {
        ctx.moveTo(h.r * scale * 0.6, 0);
        ctx.lineTo(-h.r * scale * 0.4, -h.r * scale * 0.5);
        ctx.lineTo(-h.r * scale * 0.4, 0);
      } else {
        ctx.moveTo(h.r * scale * 0.6, 0);
        ctx.lineTo(-h.r * scale * 0.4, h.r * scale * 0.5);
        ctx.lineTo(-h.r * scale * 0.4, 0);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    for (let i = 0; i < G.pShots.length; i++) drawShot(G.pShots[i], true);
    for (let i = 0; i < G.shots.length; i++) drawShot(G.shots[i], false);

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      drawMech(e.x, e.y, e.fx, e.fy, palFor(e.k), e.walk, e.r, false, e.k);
    }

    drawBoss();

    if (G.deadT <= 0) {
      const ghost = G.invuln > 0 && G.mode === 'play';
      const pal = {
        body: '#b8f8ff', visor: '#e8ffff', gun: '#ffe36b',
        leg: '#00b8d4', sword: rgba(LEAF, 1), bodyArr: HOT
      };
      drawMech(G.player.x, G.player.y, G.player.fx, G.player.fy, pal, G.player.walk, P_R, ghost, 'player');
      if (G.muzzle > 0) {
        const len = hypot(G.player.fx, G.player.fy) || 1;
        const mx = G.player.x + G.player.fx / len * 20;
        const my = G.player.y + G.player.fy / len * 20;
        ctx.fillStyle = rgba(WHT, G.muzzle / 0.06);
        ctx.beginPath();
        ctx.arc(sx(mx), sy(my), 5 * scale, 0, TAU);
        ctx.fill();
      }
      drawSlashArc();
    }

    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = q.t / q.life;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), Math.max(0.8, q.r * scale * (0.5 + a)), 0, TAU);
      ctx.fill();
    }

    ctx.font = '700 ' + Math.max(11, 12 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const f = pops[i];
      ctx.fillStyle = rgba(f.rgb, f.t / f.life);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }

    if (G.flash > 0 && !REDUCE) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.22);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }

    ctx.restore();
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, canvas.clientWidth);
    H = Math.max(1, canvas.clientHeight);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) / 2;
    oy = (H - VH * scale) / 2;
  }

  function worldFromPtr(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (W / Math.max(1, rect.width));
    const y = (clientY - rect.top) * (H / Math.max(1, rect.height));
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (overlayBlocksPlay()) return;
    e.preventDefault();
    const w = worldFromPtr(e.clientX, e.clientY);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.x = w.x;
    ptr.y = w.y;
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  }
  function onPointerMove(e) {
    if (!ptr.down || (ptr.id != null && e.pointerId !== ptr.id)) return;
    const w = worldFromPtr(e.clientX, e.clientY);
    ptr.x = w.x;
    ptr.y = w.y;
  }
  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    ptr.down = false;
    ptr.id = null;
  }

  function setPad(elBtn, on) {
    if (elBtn) elBtn.classList.toggle('held', on);
  }

  function bindPad(btn, downFn, upFn) {
    if (!btn) return;
    const down = function (e) {
      e.preventDefault();
      audio.ensure();
      downFn();
      setPad(btn, true);
    };
    const up = function (e) {
      e.preventDefault();
      upFn();
      setPad(btn, false);
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointerleave', up);
    btn.addEventListener('pointercancel', up);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isUp = k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW';
    const isDn = k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS';
    const isLf = k === 'ArrowLeft' || k === 'a' || k === 'A' || code === 'KeyA';
    const isRt = k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD';
    const isFire = k === ' ' || k === 'Spacebar' || code === 'Space';
    const isDash = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ';
    const isSlash = k === 'x' || k === 'X' || k === 'c' || k === 'C' || code === 'KeyX' || code === 'KeyC';
    const isR = k === 'r' || k === 'R' || code === 'KeyR';
    const isM = k === 'm' || k === 'M' || code === 'KeyM';

    if (isUp || isDn || isLf || isRt || isFire || isDash || isSlash) e.preventDefault();

    if (down && isR) {
      e.preventDefault();
      audio.ensure();
      restart();
      return;
    }
    if (down && isM) {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (overlayBlocksPlay()) {
      if (down && G.mode === 'title') {
        if (isFire || k === 'Enter' || k === '1') {
          e.preventDefault();
          startGame('raid');
          if (isFire) fireHold = true;
        } else if (k === '2') {
          e.preventDefault();
          startGame('core');
        }
      }
      return;
    }
    if (isUp) keys.u = down;
    if (isDn) keys.d = down;
    if (isLf) keys.l = down;
    if (isRt) keys.r = down;
    if (isFire) fireHold = down;
    if (isSlash) slashHold = down;
    if (isDash) {
      dashHold = down;
      if (down) dashQueued = true;
    }
  }

  function frame(now) {
    if (!G._last) G._last = now;
    let raw = (now - G._last) / 1000;
    G._last = now;
    if (raw > 0.05) raw = 0.05;
    if (!hidden) {
      if (G.stop > 0) {
        G.stop -= raw;
        draw();
      } else {
        G._acc = (G._acc || 0) + raw;
        let guard = 0;
        while (G._acc >= STEP && guard < 5) {
          update(STEP);
          G._acc -= STEP;
          guard += 1;
        }
        draw();
      }
    }
    requestAnimationFrame(frame);
  }

  function boot() {
    loadBest();
    try {
      audio.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch (err) { /* ignore */ }
    audio.setMuted(audio.muted);
    seedMotes();
    resize();
    bootTitle();
    if (canvas) canvas.focus();

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (!hidden) G._last = performance.now();
    });
    window.addEventListener('keydown', function (e) { onKey(e, true); });
    window.addEventListener('keyup', function (e) { onKey(e, false); });

    if (canvas) {
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerUp);
      canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    }

    bindPad(padBtns.up, function () { keys.u = true; }, function () { keys.u = false; });
    bindPad(padBtns.down, function () { keys.d = true; }, function () { keys.d = false; });
    bindPad(padBtns.left, function () { keys.l = true; }, function () { keys.l = false; });
    bindPad(padBtns.right, function () { keys.r = true; }, function () { keys.r = false; });
    bindPad(padBtns.fire, function () { fireHold = true; }, function () { fireHold = false; });
    bindPad(padBtns.slash, function () { slashHold = true; }, function () { slashHold = false; });
    bindPad(padBtns.dash, function () { dashHold = true; dashQueued = true; }, function () { dashHold = false; });

    if (btnRaid) btnRaid.addEventListener('click', function () { audio.ensure(); startGame('raid'); });
    if (btnCore) btnCore.addEventListener('click', function () { audio.ensure(); startGame('core'); });
    if (modeRaid) modeRaid.addEventListener('click', function () { audio.ensure(); startGame('raid'); });
    if (modeCore) modeCore.addEventListener('click', function () { audio.ensure(); startGame('core'); });
    if (ovAgain) ovAgain.addEventListener('click', function () { audio.ensure(); startGame(G.kind); });
    if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
    if (btnRetry) btnRetry.addEventListener('click', function () { audio.ensure(); restart(); });
    if (btnMute) btnMute.addEventListener('click', function () { audio.ensure(); audio.setMuted(!audio.muted); });

    requestAnimationFrame(frame);
  }

  boot();
})();
