'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 180;
  const AIR = 0.92;
  const JUMP_V = 490;
  const GRAV = 1500;
  const MAX_FALL = 560;
  const COYOTE = 0.08;
  const BUFFER = 0.1;
  const PW = 26;
  const PH = 36;
  const DASH_SPD = 520;
  const DASH_T = 0.14;
  const DASH_IFRAME = 0.22;
  const DASH_CD = 0.7;
  const FIRE_CD = 0.088;
  const SHOT_SPD = 600;
  const MAX_PSHOT = 7;
  const HEAT_T = 1.08;
  const RAIL_T = 0.82;
  const INVULN = 1.18;
  const DIE_T = 0.86;
  const BEST_KEY = 'playbox-gunhed-best';
  const MUTE_KEY = 'playbox-gunhed-mute';
  const OPS = '方向 / WASD 走跳 · 空格射击 · Shift / Z 冲刺 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [0, 240, 212];
  const HOT2 = [125, 255, 240];
  const WHT = [228, 250, 248];
  const STL = [56, 92, 96];
  const IRON = [28, 48, 52];
  const RUST = [176, 88, 64];
  const LEAF = [61, 255, 154];

  const SCORE = {
    crawler: 80, hover: 100, gunner: 140, roller: 120,
    sentry: 160, ceiling: 180, boss: 3500, stage: 1500
  };

  const STAGES = [
    {
      name: '废岛', boss: '掘甲', w: 1720, hp: 24, theme: 'isle',
      ground: [[0, 420], [500, 210], [790, 230], [1080, 640]],
      plats: [
        [150, MY, 140], [360, MY, 150], [620, MY, 150],
        [980, MY, 160], [1180, MY, 140], [1480, MY, 150],
        [700, HY, 120], [1100, HY, 130]
      ],
      ents: [
        [240, GY, 'crawler', 20, 420],
        [360, GY, 'crawler', 40, 420],
        [420, MY, 'gunner', 360, 510],
        [640, GY, 'roller', 540, 740],
        [700, MY, 'sentry', 0, 0],
        [760, HY, 'hover', 680, 840],
        [900, GY, 'crawler', 790, 1010],
        [1080, MY, 'gunner', 980, 1140],
        [1220, GY, 'roller', 1080, 1480],
        [1320, MY, 'sentry', 0, 0],
        [1400, HY, 'hover', 1320, 1540],
        [1520, GY, 'crawler', 1280, 1680]
      ]
    },
    {
      name: '钢廊', boss: '塔卫', w: 1960, hp: 32, theme: 'hall',
      ground: [[0, 400], [480, 190], [750, 210], [1040, 220], [1340, 620]],
      plats: [
        [90, MY, 130], [300, MY, 150], [560, MY, 140],
        [840, MY, 150], [1100, MY, 150], [1360, MY, 160], [1680, MY, 150],
        [220, HY, 120], [640, HY, 130], [1040, HY, 140], [1480, HY, 140]
      ],
      ents: [
        [200, GY, 'crawler', 20, 360],
        [320, MY, 'sentry', 0, 0],
        [360, HY, 'ceiling', 0, 0],
        [600, GY, 'roller', 480, 760],
        [680, MY, 'gunner', 560, 700],
        [720, HY, 'hover', 620, 820],
        [880, GY, 'crawler', 750, 950],
        [1040, MY, 'sentry', 0, 0],
        [1120, HY, 'ceiling', 0, 0],
        [1420, GY, 'roller', 1340, 1680],
        [1380, MY, 'gunner', 1360, 1520],
        [1540, HY, 'hover', 1460, 1680],
        [1660, GY, 'crawler', 1500, 1920],
        [1740, MY, 'sentry', 0, 0]
      ]
    },
    {
      name: '核芯', boss: '气门', w: 2200, hp: 44, theme: 'core',
      ground: [[0, 380], [460, 190], [730, 210], [1020, 200], [1300, 210], [1590, 610]],
      plats: [
        [80, MY, 130], [280, MY, 140], [540, MY, 150],
        [820, MY, 150], [1100, MY, 160], [1380, MY, 150],
        [1660, MY, 160], [1940, MY, 140],
        [200, HY, 120], [620, HY, 130], [1020, HY, 140],
        [1440, HY, 140], [1860, HY, 130]
      ],
      ents: [
        [180, GY, 'crawler', 20, 340],
        [280, MY, 'gunner', 80, 420],
        [340, HY, 'hover', 200, 440],
        [520, GY, 'roller', 460, 740],
        [600, MY, 'sentry', 0, 0],
        [680, HY, 'ceiling', 0, 0],
        [860, GY, 'crawler', 730, 930],
        [980, MY, 'gunner', 820, 970],
        [1080, HY, 'hover', 1000, 1220],
        [1380, GY, 'roller', 1300, 1500],
        [1320, MY, 'sentry', 0, 0],
        [1400, HY, 'ceiling', 0, 0],
        [1680, GY, 'crawler', 1590, 1900],
        [1660, MY, 'gunner', 1660, 1820],
        [1780, HY, 'hover', 1660, 1900],
        [1960, GY, 'roller', 1820, 2160],
        [2040, MY, 'sentry', 0, 0]
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
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function airDist() {
    return WALK * AIR * (2 * JUMP_V / GRAV);
  }
  function maxPit(spec) {
    const segs = spec.ground.slice().sort(function (a, b) { return a[0] - b[0]; });
    let cover = 0;
    let gap = 0;
    let i;
    for (i = 0; i < segs.length; i++) {
      if (segs[i][0] > cover) gap = Math.max(gap, segs[i][0] - cover);
      cover = Math.max(cover, segs[i][0] + segs[i][1]);
    }
    return gap;
  }
  function isAlley() {
    return G.kind === 'alley';
  }
  function spdMul(alley, stage) {
    return (alley ? 1.28 : 1) * (1 + Math.max(0, stage - 1) * 0.07);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function crushable(kind) {
    return kind === 'crawler' || kind === 'hover' || kind === 'gunner' || kind === 'roller';
  }
  function hpOf(kind) {
    if (kind === 'sentry') return 3;
    if (kind === 'gunner' || kind === 'ceiling') return 2;
    return 1;
  }
  function sizeOf(kind) {
    if (kind === 'sentry') return { w: 18, h: 16 };
    if (kind === 'ceiling') return { w: 16, h: 14 };
    if (kind === 'gunner') return { w: 16, h: 24 };
    if (kind === 'hover') return { w: 14, h: 12 };
    if (kind === 'roller') return { w: 14, h: 14 };
    return { w: 16, h: 16 };
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-gunhed-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-gunhed-mute') throw new Error('mute key');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 90) throw new Error('jump height ' + h);
    const ad = airDist();
    if (ad < 100) throw new Error('air distance ' + ad);
    if (DASH_SPD <= WALK) throw new Error('dash faster');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('alley faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (HEAT_T <= 0.4) throw new Error('heat time');
    if (RAIL_T <= 0.4) throw new Error('rail window');
    if (!crushable('crawler') || crushable('sentry') || crushable('ceiling')) {
      throw new Error('crush rules');
    }
    let i, j;
    for (i = 0; i < STAGES.length; i++) {
      if (!STAGES[i].ground.length || !STAGES[i].ents.length) throw new Error('stage ' + STAGES[i].name);
      if (maxPit(STAGES[i]) + 18 > ad) throw new Error('pit too wide ' + STAGES[i].name);
      const segs = STAGES[i].ground;
      for (j = 0; j < STAGES[i].ents.length; j++) {
        const e = STAGES[i].ents[j];
        if (e[1] !== GY) continue;
        let on = false;
        let k;
        for (k = 0; k < segs.length; k++) {
          if (e[0] >= segs[k][0] + 8 && e[0] <= segs[k][0] + segs[k][1] - 8) on = true;
        }
        if (!on) throw new Error('ent in pit ' + STAGES[i].name + ' ' + e[0]);
      }
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
    shot(rail) {
      this.ensure();
      if (rail) {
        this.beep(220, 0.12, 'sawtooth', 0.055, 80);
        this.beep(1480, 0.08, 'square', 0.04, 420);
        this.noise(0.08, 0.05, 400);
      } else {
        this.beep(980, 0.04, 'square', 0.038, 360);
        this.noise(0.02, 0.018, 1600);
      }
    },
    hop() {
      this.ensure();
      this.beep(240, 0.06, 'square', 0.04, 540);
    },
    land() {
      this.ensure();
      this.noise(0.05, 0.032, 380);
      this.beep(110, 0.06, 'triangle', 0.028, 60);
    },
    dash() {
      this.ensure();
      this.noise(0.1, 0.048, 480);
      this.beep(260, 0.1, 'sine', 0.04, 90);
    },
    crush() {
      this.ensure();
      this.noise(0.1, 0.06, 280);
      this.beep(160, 0.12, 'sawtooth', 0.05, 50);
      this.beep(720, 0.06, 'square', 0.03, 180);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.035, 0.032, 1100);
      this.beep(560 * lift, 0.06, 'square', 0.04, 900 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(180, 0.16, 'sawtooth', 0.05, 50);
    },
    railReady() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1176);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 70);
      this.beep(140, 0.32, 'sine', 0.045, 42);
    },
    boss() {
      this.ensure();
      this.beep(110, 0.2, 'sawtooth', 0.06, 55);
      this.beep(330, 0.16, 'square', 0.04, 180);
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
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
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
  const btnAlley = el('btn-alley');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const modeRaid = el('mode-raid');
  const modeAlley = el('mode-alley');
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
  const heatBar = el('heat-bar');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
  const hintEl = el('hint');
  const stageEl = el('stage');

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
  let kickTok = 0;
  let uid = 1;
  let dashQueued = false;

  const keys = { u: false, d: false, l: false, r: false, fire: false, dash: false };
  const demo = { u: false, d: false, l: false, r: true, fire: true, dash: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 1720,
    plats: [],
    ents: [],
    shots: [],
    beams: [],
    player: null,
    boss: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    fireCd: 0,
    heat: 0,
    overdrive: 0,
    checkX: 70,
    checkY: GY,
    jumpBuf: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    nextLife: LIFE_EVERY,
    clearT: 0,
    lock: 0,
    why: '',
    muzzle: 0,
    dashT: 0,
    dashCd: 0,
    dashI: 0
  };

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
  function fireHeld() {
    if (G.mode === 'title') return demo.fire;
    if (overlayBlocksPlay()) return false;
    return keys.fire;
  }
  function dashHeld() {
    if (G.mode === 'title') return demo.dash;
    if (overlayBlocksPlay()) return false;
    return keys.dash || dashQueued;
  }
  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
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
  function addScore(n) {
    if (!playing() || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
    }
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
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1350);
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
      const node = document.createElement('span');
      node.className = 'pip';
      pipsEl.appendChild(node);
      pips.push(node);
    }
    while (pips.length > n) {
      const node = pips.pop();
      if (node && node.parentNode) node.parentNode.removeChild(node);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }
  function syncModes() {
    const a = isAlley();
    if (modeRaid) modeRaid.setAttribute('aria-pressed', a ? 'false' : 'true');
    if (modeAlley) modeAlley.setAttribute('aria-pressed', a ? 'true' : 'false');
  }
  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = isAlley() ? '巷战 ' + spec.name : spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isAlley() ? '巷战' : '钢魂';
      tagLabel.classList.toggle('warn', isAlley());
      tagLabel.classList.toggle('hot', !isAlley() && G.stage >= 3);
    }
    if (dashLabel) {
      const ready = G.dashCd <= 0 && G.dashT <= 0;
      dashLabel.textContent = G.dashT > 0 ? '冲!' : '冲';
      dashLabel.classList.toggle('cool', !ready);
      dashLabel.classList.toggle('ready', ready && playing());
    }
    if (heatBar) {
      const v = G.overdrive > 0 ? 1 : clamp(G.heat, 0, 1);
      heatBar.style.transform = 'scaleX(' + v + ')';
      heatBar.classList.toggle('hot', G.overdrive > 0);
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞击丢命', 'warn');
    else if (G.mode === 'win') setHint('核芯捣毁 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 冲刺碾压 · 打热出钢轨', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else setHint('走跳射击 · 冲刺碾压 · 打热出钢轨', '');
    syncPips();
    syncModes();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind === 'win' || kind === 'lose');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) {
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GHED';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = '换模式';
  }
  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }
  function kick(mag, cls) {
    if (REDUCE || G.mode === 'title') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    const c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash');
      }
    }, 380);
  }
  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
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
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 280);
  }
  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 40);
    capArr(rings, 24);
  }
  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.68,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? 90 : 72
    });
    capArr(floats, 28);
  }
  function boomAt(x, y, power, rgb) {
    const p = power || 1;
    emit(10 + (p * 12) | 0, {
      x: x, y: y, j: 8 + p * 6,
      vx0: -240 * p, vx1: 240 * p, vy0: -320 * p, vy1: 40 * p,
      life: 0.32 + p * 0.16, r0: 1.2, r1: 3.4 + p, rgb: rgb || HOT
    });
    popSpark(x, y, rgb || HOT, 12 + p * 12);
    screenFlash(rgb || HOT, 0.16 + p * 0.1);
    kick(2.4 + p * 2.6);
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
      if (tok === chainTok && chainPop) chainPop.classList.add('hidden');
    }, 700);
  }
  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.04);
    }
    syncHud();
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH,
      grounded: true, coyote: 0,
      squash: 1, run: 0
    };
  }
  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }
  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const sz = sizeOf(kind);
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b,
      t: rand(0, 1), fire: rand(0.2, 1),
      grounded: kind !== 'hover' && kind !== 'ceiling',
      dead: false, hitN: 0,
      w: sz.w, h: sz.h
    };
  }
  function makeBoss(spec) {
    const hp = (spec.hp * (isAlley() ? 1.24 : 1)) | 0;
    return {
      id: uid++,
      x: spec.w - 150, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 40, h: 46, name: spec.boss
    };
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.plats = [];
    let i, g, p;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0], GY, g[1], true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      p = spec.plats[i];
      G.plats.push(makePlat(p[0], p[1], p[2], false));
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isAlley() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 3 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'sentry' || e[2] === 'ceiling') continue;
        G.ents.push(makeEnt(e[0] + 42, e[1], e[2], e[3], e[4]));
      }
    }
    G.shots = [];
    G.beams = [];
    G.boss = makeBoss(spec);
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.4;
    G.clearT = 0;
    G.lock = 0;
    G.jumpBuf = 0;
    G.muzzle = 0;
    G.dashT = 0;
    G.dashCd = 0;
    G.dashI = 0;
    G.heat = attract ? 0.35 : 0;
    G.overdrive = 0;
    dashQueued = false;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
      trails.length = 0;
    }
    syncHud();
  }

  function platUnder(x, fy, ignore) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 3 || x > p.x + p.w - 3) continue;
      if (fy >= p.y - 3 && fy <= p.y + 8) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }
  function landOn(x, y0, y1, ignore) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 4 || x > p.x + p.w - 4) continue;
      if (y0 <= p.y + 2 && y1 >= p.y) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }
  function standAt(x, y) {
    return !!platUnder(x, y, null);
  }
  function pitAhead(x, y, face) {
    return standAt(x, y) && !standAt(x + face * 22, y);
  }
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.4, y: p.y - p.h, w: p.w * 0.8, h: p.h * 0.92 };
  }
  function onScreen(x, y, pad) {
    const m = pad || 40;
    return x > G.camX - m && x < G.camX + VW + m && y > G.camY - m && y < G.camY + VH + m;
  }

  function countShots(from, kind) {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.from === from && s.life > 0 && (!kind || s.kind === kind)) n += 1;
    }
    return n;
  }
  function spawnShot(s) {
    s.id = uid++;
    s.hit = s.hit || [];
    G.shots.push(s);
    if (G.shots.length > 96) {
      for (let i = 0; i < G.shots.length && G.shots.length > 80; i++) {
        if (G.shots[i].from === 'e') {
          G.shots.splice(i, 1);
          i -= 1;
        }
      }
    }
    capArr(G.shots, 96);
  }
  function enemyShoot(e, dx, dy, spd, kind) {
    const len = hypot(dx, dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    spawnShot({
      x: e.x + nx * 12,
      y: e.y - e.h * 0.55 + ny * 6,
      vx: nx * spd,
      vy: ny * spd,
      from: 'e',
      kind: kind || 'e',
      dmg: 1,
      pierce: 0,
      life: 1.6,
      rgb: MAG,
      r: kind === 'bomb' ? 5 : 3.2,
      grav: kind === 'bomb' ? 420 : 0,
      hit: []
    });
  }
  function tryShoot() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.fireCd > 0) return;
    const rail = G.overdrive > 0;
    if (!rail && countShots('p', 'vulcan') >= MAX_PSHOT) return;
    const p = G.player;
    const face = p.face;
    const ox0 = p.x + face * 22;
    const oy0 = p.y - 20;
    if (rail) {
      spawnShot({
        x: ox0, y: oy0,
        vx: face * 820, vy: 0,
        from: 'p', kind: 'rail',
        dmg: 3, pierce: 8, life: 0.42,
        rgb: GOLD, w: 30, h: 6, hit: []
      });
      G.fireCd = 0.12;
      audio.shot(true);
      emit(10, {
        x: ox0, y: oy0, j: 6,
        vx0: face * 80, vx1: face * 280, vy0: -80, vy1: 80,
        life: 0.22, r0: 1.4, r1: 3.2, rgb: GOLD, g: 40
      });
      kick(2.2, 'thump');
      hitStop(0.046);
    } else {
      spawnShot({
        x: ox0, y: oy0,
        vx: face * SHOT_SPD, vy: 0,
        from: 'p', kind: 'vulcan',
        dmg: 1, pierce: 0, life: 0.62,
        rgb: HOT, r: 3.2, hit: []
      });
      G.fireCd = FIRE_CD;
      audio.shot(false);
      emit(4, {
        x: ox0, y: oy0, j: 3,
        vx0: face * 40, vx1: face * 160, vy0: -40, vy1: 40,
        life: 0.14, r0: 1, r1: 2.2, rgb: HOT, g: 60
      });
    }
    G.muzzle = rail ? 0.1 : 0.05;
  }

  function tryDash() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (G.dashT > 0 || G.dashCd > 0) return;
    const p = G.player;
    G.dashT = DASH_T;
    G.dashI = DASH_IFRAME;
    G.dashCd = DASH_CD;
    p.vx = p.face * DASH_SPD;
    p.vy *= 0.35;
    dashQueued = false;
    keys.dash = false;
    if (playing()) audio.dash();
    emit(8, {
      x: p.x, y: p.y - 16, j: 8,
      vx0: -p.face * 220, vx1: -p.face * 40, vy0: -40, vy1: 40,
      life: 0.22, r0: 1.4, r1: 3, rgb: CYN, g: 80
    });
    kick(1.8, 'thump');
    syncHud();
  }

  function die(why) {
    if (!playing() || G.deadT > 0 || G.invuln > 0 || G.dashI > 0) return;
    G.why = why || 'hit';
    G.deadT = DIE_T;
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    G.heat = 0;
    G.overdrive = 0;
    G.player.vy = -160;
    boomAt(G.player.x, G.player.y - 16, 1.4, MAG);
    audio.death();
    hitStop(0.074);
    kick(7, 'die');
    screenFlash(MAG, 0.45);
    syncHud();
  }
  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    G.dashT = 0;
    G.dashI = 0;
    G.heat = 0;
    G.overdrive = 0;
    toast('重生', true, false);
    syncHud();
  }
  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入井里了' : G.why === 'touch' ? '撞上了' : G.why === 'beam' ? '被钢轨扫到了' : '中弹了';
    showOverlay('lose', '机甲碎了', why + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }
  function goWin() {
    addScore(isAlley() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isAlley() ? '巷战得手' : '核芯捣毁了',
      (isAlley() ? '巷战打穿三关。' : '钢魂打穿核芯。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }
  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    loadStage(G.stage + 1, false);
    G.invuln = 1.05;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }
  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'alley' ? 'alley' : 'raid';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    keys.fire = false;
    dashQueued = false;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isAlley() ? '巷战' : STAGES[0].name, false, !isAlley());
    syncHud();
  }
  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '钢魂', '驾驶重机甲向右推进。空格连射，打热了打出钢轨。Shift 冲刺可碾碎小机。撞上、中弹、坠井丢一条命。短关之后是关底。');
    syncHud();
  }
  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }
  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function crush(e, how) {
    if (!e || e.dead) return;
    e.dead = true;
    e.hp = 0;
    bumpCombo();
    const base = SCORE[e.kind] || 80;
    const mul = how === 'crush' ? 2 : 1;
    const n = (base * mul * G.mult) | 0;
    addScore(n);
    floatText(e.x, e.y - e.h, how === 'crush' ? '碾 ' + n : String(n), how === 'crush' ? GOLD : HOT, how === 'crush');
    boomAt(e.x, e.y - e.h * 0.5, how === 'crush' ? 1.15 : 0.85, how === 'crush' ? GOLD : HOT);
    if (how === 'crush') audio.crush();
    else audio.boom();
    hitStop(how === 'crush' ? 0.07 : 0.046);
  }

  function hurtEnt(e, dmg, shot) {
    if (!e || e.dead) return;
    e.hp -= dmg;
    e.hitN = 0.08;
    const px = shot ? shot.x : e.x;
    const py = shot ? shot.y : e.y - e.h * 0.5;
    emit(6, {
      x: px, y: py, j: 5,
      vx0: -140, vx1: 140, vy0: -180, vy1: 20,
      life: 0.2, r0: 1, r1: 2.4, rgb: HOT, g: 200
    });
    popSpark(px, py, HOT, 10);
    if (e.hp <= 0) {
      crush(e, 'shot');
    } else {
      bumpCombo();
      audio.hit(G.combo);
      hitStop(0.034 + Math.min(0.04, G.combo * 0.004));
      kick(1.6, 'hit');
      addScore((20 * G.mult) | 0);
    }
  }
  function hurtBoss(dmg, shot) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.hp -= dmg;
    b.hitN = 0.1;
    bumpCombo();
    audio.hit(G.combo);
    const px = shot ? shot.x : b.x;
    const py = shot ? shot.y : b.y - 24;
    emit(8, {
      x: px, y: py, j: 8,
      vx0: -160, vx1: 160, vy0: -200, vy1: 20,
      life: 0.24, r0: 1.2, r1: 3, rgb: GOLD, g: 180
    });
    hitStop(0.042);
    kick(2.2, 'hit');
    if (b.hp <= 0) {
      b.dead = true;
      b.active = false;
      boomAt(b.x, b.y - 22, 1.8, GOLD);
      audio.boom();
      addScore((SCORE.boss * G.mult) | 0);
      addScore((SCORE.stage * G.stage * G.mult) | 0);
      floatText(b.x, b.y - 50, '击破', GOLD, true);
      toast(b.name + ' 击破', false, true);
      G.clearT = 1.35;
      G.lock = 0.4;
      screenFlash(GOLD, 0.4);
      hitStop(0.08);
    }
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.fire = true;
    demo.u = pitAhead(p.x, p.y, 1) && p.grounded;
    demo.dash = false;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      if (crushable(e.kind) && e.x > p.x && e.x - p.x < 90 && Math.abs(e.y - p.y) < 40) {
        demo.dash = true;
        break;
      }
    }
    if (p.x > G.levelW - 280 || p.y > VH + 20) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.heat = 0.2;
      G.overdrive = 0;
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.4;
      p.squash = 1.16;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    if (G.lock > 0) return;

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (ax) p.face = ax;

    if (dashHeld()) tryDash();

    const dashing = G.dashT > 0;
    if (dashing) {
      p.x += p.face * DASH_SPD * dt;
      trails.push({ x: p.x, y: p.y, t: 0, face: p.face, squash: p.squash });
      capArr(trails, 18);
    } else {
      const spd = WALK * (p.grounded ? 1 : AIR);
      p.vx = ax * spd;
      p.x += p.vx * dt;
    }
    p.x = clamp(p.x, 18, G.levelW - 18);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    if (inU() && !dashing) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = (p.grounded || p.coyote > 0) && !dashing;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 0.78;
      if (playing()) audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.2, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.026);
    }
    if (!inU() && p.vy < -80) p.vy *= Math.pow(0.42, dt * 8);

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    p.grounded = false;
    if (p.vy >= 0) {
      const plat = landOn(p.x, y0, y1, null);
      if (plat) {
        y1 = plat.y;
        if (p.vy > 220 && playing()) {
          audio.land();
          p.squash = 0.82;
          emit(6, {
            x: p.x, y: p.y, j: 10,
            vx0: -80, vx1: 80, vy0: -30, vy1: 10,
            life: 0.2, r0: 1, r1: 2.4, rgb: HOT2, g: 180
          });
          kick(1.6, 'thump');
        }
        p.vy = 0;
        p.grounded = true;
        p.coyote = COYOTE;
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (p.y > VH + 90) die('fall');

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded && !dashing) p.run += dt * 9;
    else p.run += dt * 2;

    if (p.grounded && p.x > G.checkX + 80) {
      const ck = platUnder(p.x, p.y, null);
      if (ck && ck.base && p.x > ck.x + 36 && p.x < ck.x + ck.w - 36) {
        G.checkX = p.x;
        G.checkY = p.y;
      }
    }

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (fireHeld()) {
      tryShoot();
      if (playing() && G.overdrive <= 0) G.heat += dt / HEAT_T;
    } else if (G.heat > 0) {
      G.heat -= dt * 0.28;
      if (G.heat < 0) G.heat = 0;
    }
    if (G.heat >= 1 && G.overdrive <= 0) {
      G.overdrive = RAIL_T;
      G.heat = 0;
      if (playing()) {
        toast('钢轨', false, true);
        audio.railReady();
        kick(2, 'pickup');
      }
    }

    const pb = pBox();
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      const eb = { x: e.x - e.w * 0.45, y: e.y - e.h, w: e.w * 0.9, h: e.h * 0.92 };
      if (!overlap(pb.x, pb.y, pb.w, pb.h, eb.x, eb.y, eb.w, eb.h)) continue;
      if (crushable(e.kind) && (G.dashI > 0 || (p.vy > 90 && p.y - 8 < e.y - e.h + 10))) {
        crush(e, 'crush');
        if (p.vy > 0) p.vy = -220;
        continue;
      }
      if (G.invuln > 0 || G.dashI > 0) continue;
      die('touch');
      return;
    }
    if (G.boss && !G.boss.dead && G.boss.active) {
      const b = G.boss;
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.42, b.y - b.h, b.w * 0.84, b.h * 0.9)) {
        if (G.dashI > 0) {
          p.x -= p.face * 18;
        } else if (G.invuln <= 0) {
          die('touch');
        }
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isAlley(), G.stage);
    const p = G.player;
    if (!onScreen(e.x, e.y, 90)) return;

    if (e.kind === 'hover') {
      e.x += (e.face || -1) * 42 * mul * dt;
      if (e.x < e.a) e.face = 1;
      if (e.x > e.b) e.face = -1;
      e.y = HY - 18 + Math.sin(e.t * 2.6) * 14;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0) {
        e.fire = (isAlley() ? 1.05 : 1.45) / mul;
        enemyShoot(e, 0, 1, 210, 'bomb');
      }
      return;
    }
    if (e.kind === 'ceiling') {
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 340) {
        e.fire = (isAlley() ? 1.0 : 1.4) / mul;
        enemyShoot(e, p.x - e.x, 80, 200, 'bomb');
      }
      return;
    }
    if (e.kind === 'sentry') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.deadT <= 0 && Math.abs(p.x - e.x) < 380) {
        e.fire = (isAlley() ? 0.9 : 1.22) / mul;
        const ay = (p.y - 18) - (e.y - 8);
        enemyShoot(e, e.face, ay * 0.35, 250, 'e');
      }
      return;
    }
    if (e.kind === 'roller') {
      if (playing() && Math.abs(p.x - e.x) < 240 && Math.abs(p.y - e.y) < 40) {
        e.face = p.x < e.x ? -1 : 1;
        e.x += e.face * 130 * mul * dt;
      } else {
        if (e.x < e.a) e.face = 1;
        if (e.x > e.b) e.face = -1;
        if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
        else e.x += e.face * 70 * mul * dt;
      }
      return;
    }

    const walk = (e.kind === 'gunner' ? 36 : 52) * mul;
    if (e.x < e.a) e.face = 1;
    if (e.x > e.b) e.face = -1;
    if (!standAt(e.x + e.face * 12, e.y) && standAt(e.x, e.y)) e.face *= -1;
    else e.x += e.face * walk * dt;
    e.fire -= dt;
    if (e.kind === 'crawler' && e.fire <= 0 && playing() && G.deadT <= 0) {
      if (Math.abs(p.x - e.x) < 300 && Math.abs(p.y - e.y) < 50) {
        e.fire = (isAlley() ? 1.15 : 1.6) / mul;
        e.face = p.x < e.x ? -1 : 1;
        enemyShoot(e, e.face, 0, 240, 'e');
      } else e.fire = 0.35;
    }
    if (e.kind === 'gunner' && e.fire <= 0 && playing() && G.deadT <= 0) {
      if (Math.abs(p.x - e.x) < 360) {
        e.fire = (isAlley() ? 0.95 : 1.3) / mul;
        e.face = p.x < e.x ? -1 : 1;
        enemyShoot(e, e.face, (p.y - 18) < e.y - 20 ? -0.25 : 0, 270, 'e');
      } else e.fire = 0.4;
    }
  }

  function spawnBeam(x, y, h, life) {
    G.beams.push({ x: x, y: y, h: h, t: 0, life: life || 0.55, w: 10 });
    capArr(G.beams, 8);
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    const p = G.player;
    if (!b.active) {
      if (playing() && p.x > G.levelW - 420) {
        b.active = true;
        audio.boss();
        toast(b.name + ' 现身', false, true);
        screenFlash(HOT, 0.3);
        kick(3.2, 'boom');
      }
      return;
    }
    b.t += dt;
    const mul = spdMul(isAlley(), G.stage);
    const low = b.hp / b.max < 0.42;
    const arenaL = G.levelW - VW + 40;
    const arenaR = G.levelW - 70;

    if (b.kind === '掘甲') {
      b.y = GY;
      if (b.state === 'wait') {
        b.x += b.face * 70 * mul * dt;
        if (b.x < arenaL) b.face = 1;
        if (b.x > arenaR) b.face = -1;
        b.fire -= dt;
        if (b.fire <= 0 && playing() && G.deadT <= 0) {
          if (Math.random() < 0.4) {
            b.state = 'pound';
            b.fire = 0.42;
            b.vy = -320;
          } else {
            b.fire = (low ? 0.55 : 0.85) / mul;
            enemyShoot(b, p.x - b.x, (p.y - 18) - (b.y - 24), 250, 'e');
            enemyShoot(b, p.x - b.x, (p.y - 18) - (b.y - 24) - 50, 230, 'e');
            enemyShoot(b, p.x - b.x, (p.y - 18) - (b.y - 24) + 40, 230, 'e');
          }
        }
      } else {
        b.vy += GRAV * dt;
        b.y += b.vy * dt;
        if (b.y >= GY) {
          b.y = GY;
          b.state = 'wait';
          b.fire = (low ? 0.35 : 0.55) / mul;
          kick(4, 'thump');
          emit(14, {
            x: b.x, y: GY, j: 18,
            vx0: -220, vx1: 220, vy0: -160, vy1: -20,
            life: 0.28, r0: 1.5, r1: 3.4, rgb: RUST, g: 300
          });
          if (playing() && G.deadT <= 0 && G.player.grounded && Math.abs(G.player.x - b.x) < 160) {
            die('touch');
          }
        }
      }
    } else if (b.kind === '塔卫') {
      b.x = G.levelW - 120;
      b.y = GY;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        if (Math.random() < 0.45) {
          b.fire = (low ? 0.7 : 1.05) / mul;
          const bx = arenaL + 40 + ((b.t * 90) % (VW - 160));
          spawnBeam(bx, 40, GY - 48, 0.62);
          audio.shot(true);
        } else {
          b.fire = (low ? 0.5 : 0.78) / mul;
          enemyShoot(b, p.x - b.x, (p.y - 18) - (b.y - 28), 260, 'e');
          enemyShoot(b, p.x - b.x - 40, (p.y - 18) - (b.y - 28), 240, 'e');
        }
      }
    } else {
      b.y = GY;
      b.x += b.face * 54 * mul * dt;
      if (b.x < arenaL) b.face = 1;
      if (b.x > arenaR) b.face = -1;
      b.fire -= dt;
      if (b.fire <= 0 && playing() && G.deadT <= 0) {
        if (Math.random() < 0.38) {
          b.fire = (low ? 0.85 : 1.2) / mul;
          spawnBeam(p.x, GY - 18, 22, 0.5);
          spawnShot({
            x: b.x - 20, y: GY - 18,
            vx: -520, vy: 0,
            from: 'e', kind: 'rail',
            dmg: 1, pierce: 0, life: 0.7,
            rgb: MAG, w: 36, h: 7, hit: []
          });
          audio.shot(true);
        } else {
          b.fire = (low ? 0.48 : 0.72) / mul;
          enemyShoot(b, -1, 0, 280, 'e');
          enemyShoot(b, -1, -0.35, 260, 'e');
          enemyShoot(b, -1, 0.25, 260, 'e');
          if (low) enemyShoot(b, p.x - b.x, (p.y - 18) - (b.y - 24), 240, 'e');
        }
      }
    }
  }

  function updateShots(dt) {
    let i, s;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y > VH + 40 || s.x < G.camX - 80 || s.x > G.camX + VW + 80) {
        s.life = 0;
        continue;
      }
      if (s.from === 'p') {
        let j;
        for (j = 0; j < G.ents.length; j++) {
          const e = G.ents[j];
          if (e.dead) continue;
          if (s.hit.indexOf(e.id) >= 0) continue;
          const rw = s.w || s.r * 2 || 6;
          const rh = s.h || s.r * 2 || 6;
          if (overlap(s.x - rw * 0.5, s.y - rh * 0.5, rw, rh, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h)) {
            s.hit.push(e.id);
            hurtEnt(e, s.dmg, s);
            if (!s.pierce) {
              s.life = 0;
              break;
            }
            s.pierce -= 1;
            if (s.pierce < 0) {
              s.life = 0;
              break;
            }
          }
        }
        const b = G.boss;
        if (s.life > 0 && b && b.active && !b.dead && s.hit.indexOf(b.id) < 0) {
          const rw = s.w || s.r * 2 || 6;
          const rh = s.h || s.r * 2 || 6;
          if (overlap(s.x - rw * 0.5, s.y - rh * 0.5, rw, rh, b.x - b.w * 0.42, b.y - b.h, b.w * 0.84, b.h)) {
            s.hit.push(b.id);
            hurtBoss(s.dmg, s);
            if (!s.pierce) s.life = 0;
            else {
              s.pierce -= 1;
              if (s.pierce < 0) s.life = 0;
            }
          }
        }
      } else if (playing() && G.deadT <= 0 && G.invuln <= 0 && G.dashI <= 0) {
        const pb = pBox();
        const rw = s.w || (s.r || 3) * 2;
        const rh = s.h || (s.r || 3) * 2;
        if (overlap(s.x - rw * 0.5, s.y - rh * 0.5, rw, rh, pb.x, pb.y, pb.w, pb.h)) {
          s.life = 0;
          die(s.kind === 'rail' ? 'beam' : 'shot');
        }
      }
    }
    G.shots = G.shots.filter(function (o) { return o.life > 0; });

    for (i = 0; i < G.beams.length; i++) {
      const bm = G.beams[i];
      bm.t += dt;
      if (playing() && G.deadT <= 0 && G.invuln <= 0 && G.dashI <= 0 && G.player) {
        const pb = pBox();
        if (overlap(bm.x - bm.w * 0.5, bm.y, bm.w, bm.h, pb.x, pb.y, pb.w, pb.h) && bm.t > 0.12) {
          die('beam');
        }
      }
    }
    G.beams = G.beams.filter(function (o) { return o.t < o.life; });
  }

  function updateFx(dt) {
    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const o = particles[i];
      o.life -= dt;
      o.vy += o.g * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > 0.18) trails.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));
  }

  function updateCam(dt) {
    const p = G.player;
    let target = p.x - 180;
    if (G.boss && G.boss.active && !G.boss.dead) target = G.levelW - VW;
    target = clamp(target, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, target, 1 - Math.pow(0.0004, dt));
    G.camY = 0;
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }
    if (G.mode === 'title') demoThink();
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.invuln > 0 && G.mode === 'play') G.invuln -= dt;
    if (G.dashT > 0) G.dashT -= dt;
    if (G.dashI > 0) G.dashI -= dt;
    if (G.dashCd > 0 && G.dashT <= 0) {
      G.dashCd -= dt;
      if (G.dashCd <= 0) syncHud();
    }
    if (G.overdrive > 0) {
      G.overdrive -= dt;
      if (G.overdrive <= 0) syncHud();
    }
    if (G.lock > 0) G.lock -= dt;
    if (G.toastT > 0) G.toastT -= dt;

    if (G.player) updatePlayer(dt);
    if (G.mode === 'play' || G.mode === 'title') {
      let i;
      for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
      updateBoss(dt);
      updateShots(dt);
    }
    if (G.clearT > 0 && playing()) {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
    if (G.player) updateCam(dt);
    updateFx(dt);
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) syncHud();
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'hall') {
      g.addColorStop(0, '#06181c');
      g.addColorStop(1, '#0a1014');
    } else if (spec.theme === 'core') {
      g.addColorStop(0, '#081014');
      g.addColorStop(0.55, '#0c1c20');
      g.addColorStop(1, '#041018');
    } else {
      g.addColorStop(0, '#062428');
      g.addColorStop(0.55, '#04181c');
      g.addColorStop(1, '#031014');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }
  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.35;
    let i;
    for (i = 0; i < 10; i++) {
      const hsh = hash2(i * 19 + G.stage * 7);
      const x = ox + ((i * 92 - par) % (VW + 80) - 20) * scale;
      const h = (40 + hsh * 90) * scale;
      ctx.fillStyle = spec.theme === 'core'
        ? 'rgba(0, 80, 88, 0.28)'
        : spec.theme === 'hall'
          ? 'rgba(12, 36, 42, 0.55)'
          : 'rgba(8, 40, 44, 0.4)';
      ctx.fillRect(x, oy + (VH * scale) - h - 32 * scale, (40 + hsh * 36) * scale, h);
    }
    if (spec.theme === 'core') {
      ctx.strokeStyle = rgba(HOT, 0.18);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(G.levelW - 200), sy(160), 70 * scale, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.12);
      ctx.beginPath();
      ctx.arc(sx(G.levelW - 200), sy(160), 110 * scale, 0, TAU);
      ctx.stroke();
    }
    if (spec.theme === 'hall') {
      ctx.fillStyle = 'rgba(0, 240, 212, 0.05)';
      for (i = 0; i < 8; i++) {
        const px = ((i * 180 - G.camX * 0.5) % (VW + 60));
        ctx.fillRect(ox + px * scale, oy + 40 * scale, 8 * scale, 180 * scale);
      }
    }
  }
  function drawPlats() {
    let i;
    for (i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      if (p.base) {
        ctx.fillStyle = '#0e2a30';
        ctx.fillRect(x, y, w, (VH - (p.y - G.camY) + 8) * scale);
        ctx.fillStyle = rgba(HOT, 0.55);
        ctx.fillRect(x, y, w, 3 * scale);
        ctx.fillStyle = rgba(IRON, 0.9);
        ctx.fillRect(x, y + 3 * scale, w, 6 * scale);
        let k;
        for (k = 0; k < p.w; k += 28) {
          ctx.fillStyle = rgba(STL, 0.35);
          ctx.fillRect(x + k * scale, y + 10 * scale, 2 * scale, 16 * scale);
        }
      } else {
        ctx.fillStyle = rgba(IRON, 0.95);
        ctx.fillRect(x, y, w, 8 * scale);
        ctx.fillStyle = rgba(HOT, 0.7);
        ctx.fillRect(x, y, w, 2.2 * scale);
      }
    }
  }
  function drawMech(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale * (opt.size || 1);
    const sq = opt.squash || 1;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    const leg = Math.sin(opt.run || 0) * (opt.dash ? 2 : 7) * s;
    ctx.strokeStyle = rgba(STL, 0.95);
    ctx.lineWidth = 4.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-6 * s, -10 * s);
    ctx.lineTo(-8 * s + (opt.grounded ? -leg : 4 * s), 0);
    ctx.moveTo(7 * s, -10 * s);
    ctx.lineTo(9 * s + (opt.grounded ? leg : -4 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(IRON, 0.95);
    ctx.fillRect(-11 * s, -6 * s, 8 * s, 5 * s);
    ctx.fillRect(3 * s, -6 * s, 8 * s, 5 * s);
    ctx.fillStyle = rgba(opt.rgb || HOT, 0.95);
    ctx.fillRect(-14 * s, -30 * s, 26 * s, 22 * s);
    ctx.fillStyle = rgba(STL, 0.95);
    ctx.fillRect(-14 * s, -30 * s, 26 * s, 4 * s);
    ctx.fillStyle = rgba(IRON, 0.9);
    ctx.fillRect(-16 * s, -34 * s, 8 * s, 6 * s);
    ctx.fillRect(-6 * s, -36 * s, 6 * s, 6 * s);
    ctx.fillStyle = rgba(WHT, 0.88);
    ctx.fillRect(-4 * s, -26 * s, 12 * s, 6 * s);
    ctx.fillStyle = rgba(G.overdrive > 0 ? GOLD : CYN, 0.95);
    ctx.fillRect(-1 * s, -24.5 * s, 8 * s, 3.2 * s);
    ctx.fillStyle = rgba(GOLD, 0.45);
    ctx.fillRect(-14 * s, -18 * s, 7 * s, 4 * s);
    ctx.fillStyle = rgba(IRON, 0.95);
    ctx.fillRect(8 * s, -22 * s, 10 * s, 8 * s);
    const glow = G.overdrive > 0 ? GOLD : (G.heat > 0.6 ? [255, 200, 90] : HOT);
    ctx.fillStyle = rgba(glow, 0.95);
    ctx.fillRect(16 * s, -20 * s, 18 * s, 4.4 * s);
    ctx.fillStyle = rgba(WHT, G.overdrive > 0 ? 0.9 : 0.35 + G.heat * 0.5);
    ctx.fillRect(32 * s, -19 * s, 5 * s, 2.4 * s);
    if (opt.muzzle) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(38 * s, -18 * s, 5 * s, 0, TAU);
      ctx.fill();
    }
    if (opt.dash) {
      ctx.fillStyle = rgba(CYN, 0.28);
      ctx.fillRect(-20 * s, -28 * s, 12 * s, 20 * s);
    }
    ctx.restore();
  }
  function drawTrail(t) {
    const a = 1 - t.t / 0.18;
    ctx.save();
    ctx.globalAlpha = a * 0.35;
    drawMech({ x: t.x, y: t.y, face: t.face }, {
      rgb: CYN, squash: t.squash, grounded: true, run: 0, size: 0.92, dash: true
    });
    ctx.restore();
  }
  function drawEnt(e) {
    if (e.dead) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const flash = e.hitN > 0;
    if (e.kind === 'hover') {
      ctx.fillStyle = rgba(flash ? WHT : CYN, 0.9);
      ctx.beginPath();
      ctx.ellipse(x, y - 8 * scale, 10 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(x - 3 * scale, y - 10 * scale, 6 * scale, 3 * scale);
      return;
    }
    if (e.kind === 'ceiling') {
      ctx.fillStyle = rgba(flash ? WHT : STL, 0.95);
      ctx.fillRect(x - 9 * scale, y - 20 * scale, 18 * scale, 12 * scale);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(x - 3 * scale, y - 8 * scale, 6 * scale, 8 * scale);
      return;
    }
    if (e.kind === 'sentry') {
      ctx.fillStyle = rgba(flash ? WHT : IRON, 0.95);
      ctx.fillRect(x - 10 * scale, y - 16 * scale, 20 * scale, 16 * scale);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(x - 10 * scale, y - 16 * scale, 20 * scale, 3 * scale);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(x + (e.face > 0 ? 4 : -14) * scale, y - 12 * scale, 10 * scale, 3 * scale);
      return;
    }
    if (e.kind === 'roller') {
      ctx.fillStyle = rgba(flash ? WHT : MAG, 0.92);
      ctx.beginPath();
      ctx.arc(x, y - 8 * scale, 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(x, y - 8 * scale, 4 * scale, e.t * 8, e.t * 8 + 2);
      ctx.stroke();
      return;
    }
    if (e.kind === 'gunner') {
      ctx.fillStyle = rgba(flash ? WHT : RUST, 0.95);
      ctx.fillRect(x - 8 * scale, y - 24 * scale, 16 * scale, 16 * scale);
      ctx.fillStyle = rgba(IRON, 0.9);
      ctx.fillRect(x - 7 * scale, y - 10 * scale, 5 * scale, 10 * scale);
      ctx.fillRect(x + 2 * scale, y - 10 * scale, 5 * scale, 10 * scale);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(x + (e.face > 0 ? 6 : -14) * scale, y - 20 * scale, 8 * scale, 3 * scale);
      return;
    }
    ctx.fillStyle = rgba(flash ? WHT : STL, 0.95);
    ctx.fillRect(x - 9 * scale, y - 14 * scale, 18 * scale, 10 * scale);
    ctx.fillStyle = rgba(HOT, 0.5);
    ctx.fillRect(x - 9 * scale, y - 14 * scale, 18 * scale, 2 * scale);
    ctx.fillStyle = rgba(IRON, 0.9);
    ctx.fillRect(x - 8 * scale, y - 6 * scale, 6 * scale, 6 * scale);
    ctx.fillRect(x + 2 * scale, y - 6 * scale, 6 * scale, 6 * scale);
  }
  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active && G.mode !== 'title') {
      if (b.x < G.camX - 40) return;
    }
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.hitN > 0;
    ctx.fillStyle = rgba(flash ? WHT : IRON, 0.96);
    ctx.fillRect(x - 22 * scale, y - 44 * scale, 44 * scale, 32 * scale);
    ctx.fillStyle = rgba(HOT, 0.8);
    ctx.fillRect(x - 22 * scale, y - 44 * scale, 44 * scale, 5 * scale);
    ctx.fillStyle = rgba(flash ? WHT : STL, 0.95);
    ctx.fillRect(x - 18 * scale, y - 16 * scale, 12 * scale, 16 * scale);
    ctx.fillRect(x + 6 * scale, y - 16 * scale, 12 * scale, 16 * scale);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(x - 8 * scale, y - 36 * scale, 16 * scale, 8 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(x - 28 * scale, y - 30 * scale, 14 * scale, 5 * scale);
    if (b.kind === '塔卫') {
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(x - 6 * scale, y - 70 * scale, 12 * scale, 28 * scale);
    }
    if (b.kind === '气门') {
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(x - 26 * scale, y - 52 * scale, 8 * scale, 10 * scale);
      ctx.fillRect(x + 18 * scale, y - 52 * scale, 8 * scale, 10 * scale);
    }
  }
  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    if (s.kind === 'rail') {
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.fillRect(x - (s.w || 28) * 0.5 * scale, y - (s.h || 6) * 0.5 * scale, (s.w || 28) * scale, (s.h || 6) * scale);
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(x - (s.w || 28) * 0.5 * scale, y - 1.2 * scale, (s.w || 28) * scale, 2.4 * scale);
      return;
    }
    ctx.fillStyle = rgba(s.rgb, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, (s.r || 3) * scale, 0, TAU);
    ctx.fill();
  }
  function drawBeams() {
    let i;
    for (i = 0; i < G.beams.length; i++) {
      const bm = G.beams[i];
      const a = bm.t < 0.12 ? bm.t / 0.12 * 0.35 : 1 - (bm.t / bm.life) * 0.4;
      ctx.fillStyle = rgba(MAG, 0.22 + a * 0.5);
      ctx.fillRect(sx(bm.x - bm.w * 0.5), sy(bm.y), bm.w * scale, bm.h * scale);
      ctx.fillStyle = rgba(WHT, 0.4 * a);
      ctx.fillRect(sx(bm.x - 2), sy(bm.y), 4 * scale, bm.h * scale);
    }
  }
  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead || !playing()) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(b.name, x, y - 3 * scale);
  }
  function drawFx() {
    let i, o;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      const k = o.t / 0.4;
      ctx.strokeStyle = rgba(o.rgb, 1 - k);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + k * 22) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      const k = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(o.rgb, k);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * k * 0.4) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      ctx.fillStyle = rgba(o.rgb, clamp(o.life / o.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      const a = 1 - o.t / o.life;
      ctx.fillStyle = rgba(o.rgb, a);
      ctx.font = 'bold ' + (o.size * scale) + 'px sans-serif';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#041618';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const shx = G.shake && !REDUCE ? (hash2((G.t * 80) | 0) - 0.5) * G.shake : 0;
    const shy = G.shake && !REDUCE ? (hash2((G.t * 80 + 9) | 0) - 0.5) * G.shake : 0;
    ctx.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * scale * 0.5;
      const cy = oy + VH * scale * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }

    drawSky();
    drawBackdrop();
    drawPlats();
    drawBeams();

    let i;
    for (i = 0; i < trails.length; i++) drawTrail(trails[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0) {
      drawMech(G.player, {
        rgb: HOT,
        run: G.player.run,
        grounded: G.player.grounded,
        squash: G.player.squash,
        muzzle: G.muzzle > 0,
        blink: G.invuln > 0 && G.mode === 'play',
        dash: G.dashT > 0
      });
    }

    drawFx();
    drawBossBar();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
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

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const shift = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';
    const zee = k === 'z' || k === 'Z';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) keys.fire = down;
    if (shift || zee) {
      keys.dash = down;
      if (down) dashQueued = true;
    }

    if (down && (isMove || space || shift || zee || k === 'Enter')) e.preventDefault();
    if (!down) return;

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
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('alley');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        keys.fire = false;
        return;
      }
    }
  }

  function bindPad() {
    function hold(node, on, off) {
      if (!node) return;
      const down = function (e) {
        e.preventDefault();
        audio.ensure();
        node.classList.add('held');
        on();
      };
      const up = function (e) {
        e.preventDefault();
        node.classList.remove('held');
        if (off) off();
      };
      node.addEventListener('pointerdown', down);
      node.addEventListener('pointerup', up);
      node.addEventListener('pointercancel', up);
      node.addEventListener('pointerleave', up);
    }
    hold(el('btn-left'), function () { keys.l = true; }, function () { keys.l = false; });
    hold(el('btn-right'), function () { keys.r = true; }, function () { keys.r = false; });
    hold(el('btn-jump'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(el('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
    hold(el('btn-dash'), function () { keys.dash = true; dashQueued = true; }, function () { keys.dash = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      keys.fire = true;
    });
    canvas.addEventListener('pointerup', function () { keys.fire = false; });
    canvas.addEventListener('pointercancel', function () { keys.fire = false; });
    canvas.addEventListener('pointerleave', function () { keys.fire = false; });
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

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindPad();

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnAlley) {
    btnAlley.addEventListener('click', function () {
      audio.ensure();
      startGame('alley');
    });
  }
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (modeRaid) {
    modeRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (modeAlley) {
    modeAlley.addEventListener('click', function () {
      audio.ensure();
      startGame('alley');
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
      keys.fire = false;
      keys.dash = false;
    }
  });

  requestAnimationFrame(frame);
})();
