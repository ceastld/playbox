'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.3;
  const STAGE_LEN = 2100;
  const TAP = 0.08;
  const CHG1 = 0.42;
  const CHG2 = 0.88;
  const CHG3 = 1.48;
  const BEST_KEY = 'playbox-r-type-run-best';
  const MUTE_KEY = 'playbox-r-type-run-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击（按住蓄力）· C 力爪 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const ORG = [255, 184, 74];
  const WHT = [246, 243, 255];
  const PNK = [255, 154, 212];
  const FLESH = [196, 90, 120];
  const DEEP = [40, 12, 28];
  const PUR = [180, 77, 255];

  const SCORE = {
    fighter: 50,
    turret: 80,
    snake: 220,
    seg: 18,
    gunship: 140,
    boss: [4000, 6000, 9000],
    clear: 2000
  };

  const STAGES = [
    {
      name: '肉腔',
      boss: '胎心',
      bossHp: 72,
      seed: 1,
      waves: [
        { x: 40, kind: 'fighters', n: 3, y: 0.42 },
        { x: 200, kind: 'turret', side: -1 },
        { x: 280, kind: 'fighters', n: 4, y: 0.62 },
        { x: 380, kind: 'snake', n: 8 },
        { x: 520, kind: 'turret', side: 1 },
        { x: 600, kind: 'fighters', n: 5, y: 0.34 },
        { x: 740, kind: 'gunship' },
        { x: 820, kind: 'snake', n: 10 },
        { x: 960, kind: 'turret', side: -1 },
        { x: 1020, kind: 'turret', side: 1 },
        { x: 1100, kind: 'fighters', n: 6, y: 0.5 },
        { x: 1260, kind: 'snake', n: 9 },
        { x: 1360, kind: 'gunship' },
        { x: 1480, kind: 'fighters', n: 4, y: 0.28 },
        { x: 1540, kind: 'fighters', n: 4, y: 0.72 },
        { x: 1660, kind: 'snake', n: 11 },
        { x: 1780, kind: 'turret', side: -1 },
        { x: 1860, kind: 'gunship' },
        { x: 1960, kind: 'fighters', n: 5, y: 0.5 }
      ]
    },
    {
      name: '钢廊',
      boss: '环炮',
      bossHp: 96,
      seed: 2,
      waves: [
        { x: 40, kind: 'fighters', n: 5, y: 0.5 },
        { x: 140, kind: 'snake', n: 9 },
        { x: 240, kind: 'gunship' },
        { x: 320, kind: 'turret', side: -1 },
        { x: 360, kind: 'turret', side: 1 },
        { x: 460, kind: 'fighters', n: 6, y: 0.3 },
        { x: 540, kind: 'fighters', n: 6, y: 0.7 },
        { x: 660, kind: 'snake', n: 12 },
        { x: 780, kind: 'gunship' },
        { x: 860, kind: 'fighters', n: 5, y: 0.45 },
        { x: 980, kind: 'snake', n: 10 },
        { x: 1080, kind: 'turret', side: 1 },
        { x: 1160, kind: 'gunship' },
        { x: 1240, kind: 'fighters', n: 7, y: 0.38 },
        { x: 1360, kind: 'snake', n: 12 },
        { x: 1460, kind: 'snake', n: 8 },
        { x: 1580, kind: 'turret', side: -1 },
        { x: 1620, kind: 'turret', side: 1 },
        { x: 1720, kind: 'gunship' },
        { x: 1800, kind: 'fighters', n: 6, y: 0.55 },
        { x: 1920, kind: 'snake', n: 11 }
      ]
    },
    {
      name: '母核',
      boss: '母核',
      bossHp: 130,
      seed: 3,
      waves: [
        { x: 20, kind: 'snake', n: 10 },
        { x: 120, kind: 'fighters', n: 6, y: 0.35 },
        { x: 180, kind: 'fighters', n: 6, y: 0.65 },
        { x: 280, kind: 'gunship' },
        { x: 340, kind: 'turret', side: -1 },
        { x: 380, kind: 'turret', side: 1 },
        { x: 480, kind: 'snake', n: 12 },
        { x: 600, kind: 'fighters', n: 7, y: 0.5 },
        { x: 720, kind: 'gunship' },
        { x: 800, kind: 'snake', n: 11 },
        { x: 900, kind: 'gunship' },
        { x: 980, kind: 'fighters', n: 8, y: 0.3 },
        { x: 1080, kind: 'snake', n: 13 },
        { x: 1180, kind: 'turret', side: -1 },
        { x: 1220, kind: 'turret', side: 1 },
        { x: 1320, kind: 'fighters', n: 6, y: 0.7 },
        { x: 1420, kind: 'snake', n: 12 },
        { x: 1520, kind: 'gunship' },
        { x: 1600, kind: 'snake', n: 10 },
        { x: 1720, kind: 'fighters', n: 8, y: 0.45 },
        { x: 1840, kind: 'gunship' },
        { x: 1920, kind: 'snake', n: 14 }
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
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnRaid = document.getElementById('btn-raid');
  const btnStorm = document.getElementById('btn-storm');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnForce = document.getElementById('btn-force');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const forceLabel = document.getElementById('force-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chgBar = document.getElementById('chg-bar');
  const chgWrap = document.getElementById('chg-wrap');

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
  let formTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  let uid = 1;
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    cam: 0,
    px: 90,
    py: VH * 0.5,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    stage: 1,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    spawnI: 0,
    fireHold: false,
    chargeT: 0,
    charged: false,
    forceCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    boss: false,
    winT: 0,
    lastLv: 0,
    force: {
      state: 'front',
      x: 122,
      y: VH * 0.5,
      vx: 0,
      vy: 0,
      recall: false,
      ramT: 0,
      blockT: 0,
      fireCd: 0,
      spin: 0,
      grace: 0
    }
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
  function isStorm() {
    return G.kind === 'storm';
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }
  function moveSpd() {
    return isStorm() ? 318 : 276;
  }
  function scrollSpd() {
    if (G.boss) {
      const b = findBoss();
      if (b && b.alive) {
        const x = b.x - G.cam;
        if (x < VW - 220) return isStorm() ? 10 : 6;
        if (x < VW - 140) return isStorm() ? 36 : 22;
      }
      return isStorm() ? 48 : 32;
    }
    return isStorm() ? 162 : 108;
  }
  function chargeLevel() {
    if (G.chargeT >= CHG3) return 3;
    if (G.chargeT >= CHG2) return 2;
    if (G.chargeT >= CHG1) return 1;
    return 0;
  }

  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function valNoise(x, salt) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = hash2(i + salt * 9973);
    const b = hash2(i + 1 + salt * 9973);
    return a + (b - a) * u;
  }
  function fbm(x, salt) {
    return valNoise(x, salt) * 0.55
      + valNoise(x * 2.07, salt + 17) * 0.3
      + valNoise(x * 4.13, salt + 31) * 0.15;
  }

  function caveAt(wx) {
    const st = G.stage;
    const n1 = fbm(wx * 0.00315, st * 19 + 2);
    const n2 = fbm(wx * 0.00108, st * 7 + 5);
    let mid = VH * 0.5 + (n2 - 0.5) * (st === 2 ? 28 : 64);
    let gap = (st === 2 ? 318 : 262) + (n1 - 0.5) * (st === 3 ? 54 : 72);
    if (isStorm()) gap += 10;
    const local = ((wx % 920) + 920) % 920;
    if (st === 2 && local > 180 && local < 680) gap = Math.max(gap, 352);
    if (wx < 200) gap = lerp(410, gap, wx / 200);
    if (G.boss) gap = Math.max(gap, 330);
    gap = clamp(gap, 156, 420);
    let top = mid - gap * 0.5;
    let bot = mid + gap * 0.5;
    top = clamp(top, 10, VH - 90);
    bot = clamp(bot, 90, VH - 10);
    if (bot - top < 148) bot = top + 148;
    return { top: top, bot: bot, mid: (top + bot) * 0.5, gap: bot - top };
  }

  function columnDepth(i) {
    if (G.boss) return 0;
    const wx = i * 48;
    if (wx < 240) return 0;
    const h = hash2(i + G.stage * 13 + (isStorm() ? 4 : 0));
    if (h < 0.8) return 0;
    return 22 + (h - 0.8) * 170;
  }
  function columnTop(i) {
    return hash2(i + 91 + G.stage * 3) > 0.5;
  }

  function inSolid(wx, y, r) {
    const c = caveAt(wx);
    if (y - r < c.top) return true;
    if (y + r > c.bot) return true;
    const i = Math.round(wx / 48);
    const colWx = i * 48;
    const depth = columnDepth(i);
    if (depth > 0 && Math.abs(wx - colWx) < 13 + r) {
      if (columnTop(i)) {
        if (y - r < c.top + depth) return true;
      } else if (y + r > c.bot - depth) return true;
    }
    return false;
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
      this.beep(880, 0.05, 'square', 0.03, 1760);
    },
    forceShot() {
      this.ensure();
      this.beep(520, 0.055, 'square', 0.028, 980);
    },
    chargeTick(lv) {
      this.ensure();
      const f = 220 + lv * 180;
      this.beep(f, 0.07, 'sine', 0.03, f * 1.6);
    },
    beam(lv) {
      this.ensure();
      this.noise(0.1 + lv * 0.04, 0.055, 280);
      this.beep(180 + lv * 40, 0.18, 'sawtooth', 0.055, 70);
      this.beep(420 + lv * 80, 0.12, 'square', 0.04, 180);
    },
    launch() {
      this.ensure();
      this.beep(240, 0.1, 'sawtooth', 0.045, 720);
      this.beep(880, 0.12, 'triangle', 0.03, 220);
      this.noise(0.07, 0.035, 600);
    },
    dock() {
      this.ensure();
      this.beep(660, 0.06, 'square', 0.04, 220);
      this.beep(330, 0.1, 'triangle', 0.035, 140);
    },
    recall() {
      this.ensure();
      this.beep(880, 0.08, 'sine', 0.035, 440);
    },
    block() {
      this.ensure();
      this.beep(1240, 0.04, 'square', 0.034, 420);
      this.noise(0.03, 0.02, 1800);
    },
    ram() {
      this.ensure();
      this.noise(0.05, 0.04, 400);
      this.beep(200, 0.08, 'sawtooth', 0.04, 90);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 200 : kind === 'snake' ? 360 : 480;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.045, 0.036, 1100);
      this.beep(base * lift, 0.08, 'square', 0.046, base * lift * 1.5);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.065, 280);
      this.beep(280, 0.22, 'sawtooth', 0.052, 64);
      this.beep(140, 0.34, 'sine', 0.045, 40);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.045, 1046);
      this.beep(1046, 0.28, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    warn() {
      this.ensure();
      this.beep(220, 0.16, 'square', 0.04, 110);
      this.beep(330, 0.22, 'sawtooth', 0.035, 80);
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
    if ((G.mode !== 'play' && G.mode !== 'win') || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.up();
        syncPips();
      }
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

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < G.lives) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > Math.max(G.lives, LIVES)) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.className = 'hint' + (cls ? ' ' + cls : '');
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (warn ? ' warn' : gold ? ' gold' : '');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.05;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const info = stageInfo();
      stageLabel.textContent = G.boss ? info.boss : info.name;
      stageLabel.classList.toggle('hot', G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isStorm() ? '强袭' : '远征';
      tagLabel.className = isStorm() ? 'warn' : '';
    }
    if (forceLabel) {
      const st = G.force.state;
      forceLabel.textContent = st === 'back' ? '后装' : st === 'fly' ? '游离' : '前装';
      forceLabel.className = 'form ' + (st === 'back' ? 'back' : st === 'fly' ? 'fly' : 'front');
    }
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
    const lv = chargeLevel();
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.chargeT / CHG3, 0, 1) + ')';
    if (chgWrap) chgWrap.classList.toggle('hot', lv >= 3);
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 力爪挡弹，撞机体才掉命', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 母核已毁', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 用力爪挡弹，空格蓄满再放', 'warn');
    else if (G.force.state === 'fly') setHint('力爪游离 · 再按 C 收回，机头/机尾对接', '');
    else if (G.force.state === 'back') setHint('后装 · 力爪朝后开火挡弹 · C 发射', '');
    else setHint('前装挡弹 · 空格蓄力 · C 发射力爪', '');
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'RTYPE';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'lose' || kind === 'win';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE || (G.mode !== 'play' && G.mode !== 'win')) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : mag >= 3.4 ? 'morph' : mag >= 2.2 ? 'charge' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('morph');
    stageEl.classList.remove('charge');
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
        rgb: spec.rgb,
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 320);
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
      t: 0, life: gold ? 0.95 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -90 : -72
    });
    capArr(floats, 26);
  }

  function explode(x, y, rgb, power) {
    const p = power || 18;
    emit(Math.min(32, 10 + (p * 0.5) | 0), {
      x: x, y: y, j: 6,
      vx0: -220, vx1: 180, vy0: -180, vy1: 160,
      r0: 1.4, r1: 4.4, life: 0.42 + p * 0.006, rgb: rgb, g: 280
    });
    emit(6, {
      x: x, y: y, j: 3,
      vx0: -70, vx1: 70, vy0: -90, vy1: 70,
      r0: 2, r1: 5, life: 0.28, rgb: WHT, g: 80
    });
    popSpark(x, y, rgb, 12 + p * 0.4);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
      }
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.1),
        a: rand(0.18, 0.7),
        p: rand(18, 70)
      });
    }
  }

  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function forcePos() {
    return { x: G.force.x, y: G.force.y };
  }

  function dockForce(side) {
    G.force.state = side;
    G.force.vx = 0;
    G.force.vy = 0;
    G.force.recall = false;
    snapForce();
    audio.dock();
    popSpark(G.force.x, G.force.y, GOLD, 16);
    floatText(G.force.x, G.force.y - 18, side === 'back' ? '后装' : '前装', GOLD, true);
    hitStop(0.04);
    kick(2.6);
    screenFlash(GOLD, 0.22);
    if (forceLabel) {
      forceLabel.classList.remove('pop');
      void forceLabel.offsetWidth;
      forceLabel.classList.add('pop');
      formTok += 1;
    }
    syncHud();
  }

  function snapForce() {
    if (G.force.state === 'front') {
      G.force.x = G.px + 32;
      G.force.y = G.py;
    } else if (G.force.state === 'back') {
      G.force.x = G.px - 28;
      G.force.y = G.py;
    }
  }

  function launchForce() {
    if (G.forceCd > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.forceCd = 0.28;
    if (G.force.state === 'fly') {
      G.force.recall = true;
      audio.recall();
      return;
    }
    const dir = G.force.state === 'back' ? -1 : 1;
    G.force.state = 'fly';
    G.force.vx = dir * 460;
    G.force.vy = 0;
    G.force.recall = false;
    G.force.grace = 0.22;
    audio.launch();
    emit(10, {
      x: G.force.x, y: G.force.y, j: 4,
      vx0: -80, vx1: 80, vy0: -80, vy1: 80,
      r0: 1.4, r1: 3.2, life: 0.28, rgb: GOLD, g: 40
    });
    popSpark(G.force.x, G.force.y, ORG, 14);
    hitStop(0.032);
    kick(2.2);
    screenFlash(ORG, 0.16);
    if (forceLabel) {
      forceLabel.classList.remove('pop');
      void forceLabel.offsetWidth;
      forceLabel.classList.add('pop');
    }
    syncHud();
  }

  function fireVulcan() {
    if (G.deadT > 0) return;
    G.shots.push({
      type: 'vulcan',
      x: G.px + 16,
      y: G.py,
      vx: 640,
      vy: 0,
      w: 5,
      h: 2.2,
      dmg: 1,
      pierce: 1,
      life: 1.1,
      rgb: CYN,
      blockable: false
    });
    G.muzzle = 0.08;
    audio.shoot();
    emit(3, {
      x: G.px + 18, y: G.py, j: 2,
      vx0: 80, vx1: 180, vy0: -40, vy1: 40,
      r0: 1, r1: 2.2, life: 0.16, rgb: CYN, g: 0
    });
  }

  function fireBeam(lv) {
    const h = lv === 3 ? 36 : lv === 2 ? 22 : 12;
    const dmg = lv === 3 ? 22 : lv === 2 ? 10 : 4;
    const pierce = lv === 3 ? 99 : lv === 2 ? 3 : 1;
    G.shots.push({
      type: 'beam',
      x: G.px + 22,
      y: G.py,
      vx: 540,
      vy: 0,
      w: 26 + lv * 12,
      h: h,
      dmg: dmg,
      pierce: pierce,
      life: 0.72,
      rgb: lv === 3 ? GOLD : lv === 2 ? MAG : CYN,
      lv: lv,
      hit: {}
    });
    G.muzzle = 0.16;
    audio.beam(lv);
    hitStop(lv === 3 ? 0.07 : 0.048);
    kick(lv === 3 ? 5.6 : 3.3);
    screenFlash(lv === 3 ? GOLD : MAG, lv === 3 ? 0.52 : 0.3);
    explode(G.px + 26, G.py, lv === 3 ? GOLD : MAG, 10 + lv * 6);
    if (lv >= 2) floatText(G.px + 40, G.py - 22, lv === 3 ? 'WAVE' : 'BEAM', GOLD, lv === 3);
  }

  function fireForceShot() {
    const f = G.force;
    const back = f.state === 'back';
    G.shots.push({
      type: 'force',
      x: f.x + (back ? -12 : 12),
      y: f.y,
      vx: back ? -520 : 560,
      vy: 0,
      w: 4.4,
      h: 3.2,
      dmg: 1,
      pierce: 1,
      life: 1.0,
      rgb: ORG
    });
    audio.forceShot();
  }

  function pushEnt(e) {
    e.id = uid++;
    G.ents.push(e);
    capArr(G.ents, 110);
  }

  function spawnFighters(n, yNorm) {
    const baseY = caveAt(G.cam + VW).top + 30 + yNorm * (caveAt(G.cam + VW).gap - 60);
    const extra = isStorm() ? 2 : 0;
    const count = n + extra;
    for (let i = 0; i < count; i++) {
      pushEnt({
        type: 'fighter',
        x: G.cam + VW + 28 + i * 26,
        y: baseY + Math.sin(i * 0.9) * 18,
        vx: isStorm() ? -150 : -118,
        vy: 0,
        hp: 1,
        maxHp: 1,
        w: 11,
        h: 8,
        t: i * 0.12,
        phase: rand(0, TAU),
        shootCd: rand(0.4, 1.3),
        alive: true
      });
    }
  }

  function spawnTurret(side) {
    const wx = G.cam + VW + 10;
    const c = caveAt(wx);
    pushEnt({
      type: 'turret',
      x: wx,
      y: side < 0 ? c.top + 14 : c.bot - 14,
      side: side,
      vx: 0,
      vy: 0,
      hp: isStorm() ? 4 : 3,
      maxHp: isStorm() ? 4 : 3,
      w: 12,
      h: 10,
      t: 0,
      shootCd: rand(0.5, 1.2),
      alive: true
    });
  }

  function spawnSnake(n) {
    const wx = G.cam + VW + 24;
    const c = caveAt(wx);
    const y = c.mid + rand(-40, 40);
    const segs = [];
    const count = n + (isStorm() ? 2 : 0);
    for (let i = 0; i < count; i++) segs.push({ x: wx + i * 14, y: y });
    pushEnt({
      type: 'snake',
      segs: segs,
      x: wx,
      y: y,
      vx: isStorm() ? -128 : -96,
      hp: count,
      maxHp: count,
      w: 9,
      h: 9,
      t: 0,
      amp: 26 + rand(0, 18),
      phase: rand(0, TAU),
      alive: true
    });
  }

  function spawnGunship() {
    const wx = G.cam + VW + 20;
    const c = caveAt(wx);
    pushEnt({
      type: 'gunship',
      x: wx,
      y: c.mid,
      vx: isStorm() ? -92 : -72,
      vy: 0,
      hp: isStorm() ? 7 : 5,
      maxHp: isStorm() ? 7 : 5,
      w: 18,
      h: 12,
      t: 0,
      shootCd: 0.8,
      alive: true
    });
  }

  function spawnWave(w) {
    if (w.kind === 'fighters') spawnFighters(w.n, w.y == null ? 0.5 : w.y);
    else if (w.kind === 'turret') spawnTurret(w.side || -1);
    else if (w.kind === 'snake') spawnSnake(w.n || 8);
    else if (w.kind === 'gunship') spawnGunship();
  }

  function makeTail(x, y, n, spread) {
    const segs = [];
    for (let i = 0; i < n; i++) segs.push({ x: x + i * spread, y: y });
    return segs;
  }

  function spawnBoss() {
    G.boss = true;
    const info = stageInfo();
    const hp = info.bossHp + (isStorm() ? Math.round(info.bossHp * 0.22) : 0);
    const x = G.cam + VW + 40;
    const c = caveAt(x);
    const variant = G.stage === 1 ? 'heart' : G.stage === 2 ? 'ring' : 'core';
    pushEnt({
      type: 'boss',
      variant: variant,
      x: x,
      y: c.mid,
      vx: -40,
      vy: 0,
      hp: hp,
      maxHp: hp,
      w: variant === 'ring' ? 36 : 42,
      h: variant === 'heart' ? 48 : 36,
      t: 0,
      shootCd: 0.6,
      phase: 1,
      tail: variant === 'heart' ? makeTail(x + 10, c.mid + 20, 12, 13) : null,
      guns: variant === 'ring' ? [0, 1, 2, 3] : null,
      spin: 0,
      alive: true,
      name: info.boss
    });
    toast(info.boss, true, false);
    audio.warn();
    screenFlash(MAG, 0.28);
    kick(4);
    syncHud();
  }

  function enemyShot(x, y, vx, vy, fat) {
    G.eShots.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: fat ? 6.2 : 3.1,
      life: fat ? 2.4 : 2.8,
      blockable: !fat,
      fat: !!fat
    });
    capArr(G.eShots, 90);
  }

  function aimShot(x, y, spd, spread) {
    const dx = G.px - (x - G.cam);
    const dy = G.py - y;
    const d = hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx) + (spread || 0);
    enemyShot(x, y, Math.cos(ang) * spd, Math.sin(ang) * spd, false);
  }

  function hurtEnt(e, dmg, hx, hy, ram) {
    if (!e.alive) return;
    e.hp -= dmg;
    bumpCombo();
    const kind = e.type === 'boss' ? 'boss' : e.type === 'snake' ? 'snake' : 'hit';
    audio.hit(kind, G.combo);
    popSpark(hx, hy, e.type === 'boss' ? MAG : ORG, ram ? 12 : 8);
    emit(5, {
      x: hx, y: hy, j: 4,
      vx0: -80, vx1: 80, vy0: -80, vy1: 80,
      r0: 1.2, r1: 2.8, life: 0.22, rgb: PNK, g: 80
    });
    if (e.type === 'boss') {
      hitStop(0.038);
      kick(2.4);
    } else if (ram) {
      hitStop(0.04);
    } else {
      hitStop(0.03);
    }
    if (e.type === 'snake' && e.segs && e.hp > 0) {
      while (e.segs.length > Math.max(1, e.hp)) e.segs.pop();
    }
    if (e.hp <= 0) killEnt(e, hx, hy);
  }

  function killEnt(e, hx, hy) {
    e.alive = false;
    e.hp = 0;
    let pts = SCORE.fighter;
    let rgb = CYN;
    let pow = 16;
    if (e.type === 'turret') { pts = SCORE.turret; rgb = MAG; pow = 18; }
    else if (e.type === 'snake') { pts = SCORE.snake; rgb = PNK; pow = 22; }
    else if (e.type === 'gunship') { pts = SCORE.gunship; rgb = ORG; pow = 22; }
    else if (e.type === 'boss') {
      pts = SCORE.boss[G.stage - 1] || 4000;
      rgb = GOLD;
      pow = 48;
    }
    const n = Math.round(pts * G.mult);
    addScore(n);
    floatText(hx, hy, '+' + n, rgb, e.type === 'boss' || G.mult >= 3);
    explode(hx, hy, rgb, pow);
    if (e.type === 'boss') {
      hitStop(0.08);
      kick(7.2);
      screenFlash(GOLD, 0.55);
      for (let k = 0; k < 4; k++) {
        explode(hx + rand(-28, 28), hy + rand(-24, 24), k % 2 ? MAG : GOLD, 28);
      }
      onBossDown();
    } else if (e.type === 'snake') {
      hitStop(0.055);
      kick(3.6);
    } else {
      hitStop(0.042);
      kick(2.5);
    }
    syncHud();
  }

  function onBossDown() {
    addScore(SCORE.clear);
    if (G.stage >= 3) {
      G.winT = 1.35;
    } else {
      toast(stageInfo().name + '肃清', false, true);
      G.stage += 1;
      G.cam = 0;
      G.spawnI = 0;
      G.boss = false;
      G.ents.length = 0;
      G.eShots.length = 0;
      G.shots.length = 0;
      const c = caveAt(80);
      G.py = clamp(G.py, c.top + 24, c.bot - 24);
      syncHud();
    }
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.9;
    G.chargeT = 0;
    G.charged = false;
    G.fireHold = false;
    breakCombo();
    explode(G.px, G.py, MAG, 36);
    explode(G.px + 8, G.py, CYN, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5);
    screenFlash(MAG, 0.6);
    syncPips();
    syncHud();
  }

  function respawn() {
    const c = caveAt(G.cam + 90);
    G.px = 90;
    G.py = c.mid;
    G.invuln = 1.45;
    G.deadT = 0;
    G.force.state = 'front';
    G.force.recall = false;
    G.force.vx = 0;
    G.force.vy = 0;
    snapForce();
    G.chargeT = 0;
    if (keys.sht) G.fireHold = true;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '力爪能挡弹，机体中弹才掉命。分数 ' + G.score + '。');
    setHint('R 重开 · 力爪挡弹，撞机体才掉命', 'warn');
  }

  function goWin() {
    G.mode = 'win';
    addScore(4000);
    audio.win();
    showOverlay('win', '航线肃清', '三腔打穿。分数 ' + G.score + (isStorm() ? ' · 强袭' : ' · 远征') + '。');
    setHint('R 重开 · 母核已毁', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'storm' ? 'storm' : 'raid';
    G.t = 0;
    G.cam = 0;
    G.px = 90;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stage = 1;
    G.nextLife = LIFE_EVERY;
    G.spawnI = 0;
    G.fireHold = false;
    G.chargeT = 0;
    G.charged = false;
    G.forceCd = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.boss = false;
    G.winT = 0;
    G.lastLv = 0;
    G.why = '';
    G.force.state = 'front';
    G.force.vx = 0;
    G.force.vy = 0;
    G.force.recall = false;
    G.force.ramT = 0;
    G.force.blockT = 0;
    G.force.fireCd = 0;
    G.force.spin = 0;
    G.force.grace = 0;
    snapForce();
    if (scoreEl) scoreEl.textContent = '0';
    toast(isStorm() ? '强袭' : '远征', false, !isStorm());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.t = 0;
    G.cam = 80;
    G.px = 90;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.stage = 1;
    G.boss = false;
    G.deadT = 0;
    G.chargeT = 0;
    G.force.state = 'front';
    snapForce();
    clearWorld();
    showOverlay('title', '武装', '力爪对接、格挡、出击。空格按住蓄力开炮。');
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.9);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.force.blockT > 0) G.force.blockT -= dt;
    if (G.force.ramT > 0) G.force.ramT -= dt;
    G.force.spin += dt * (G.force.state === 'fly' ? 7 : 3.2);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.99;
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
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= (G.mode === 'title' ? 22 : scrollSpd() * 0.18 + s.p * 0.4) * dt;
      if (s.x < 0) s.x += VW;
    }
  }

  function updateMove(dt) {
    let mx = 0;
    let my = 0;
    if (inputSrc === 'ptr' && pointer.down) {
      const tx = pointer.x;
      const ty = pointer.y;
      const dx = tx - G.px;
      const dy = ty - G.py;
      const d = hypot(dx, dy);
      const max = moveSpd() * dt;
      if (d > 2) {
        const k = Math.min(1, max / d) * (d > 18 ? 1 : d / 18);
        mx = dx * k;
        my = dy * k;
      }
    } else {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
      if (mx || my) {
        const n = hypot(mx, my) || 1;
        mx = mx / n * moveSpd() * dt;
        my = my / n * moveSpd() * dt;
      }
    }
    G.px = clamp(G.px + mx, 22, VW - 70);
    G.py = clamp(G.py + my, 18, VH - 18);
    const wx = G.cam + G.px;
    if (inSolid(wx, G.py, 7)) {
      if (G.invuln > 0) {
        const c = caveAt(wx);
        G.py = clamp(G.py, c.top + 14, c.bot - 14);
        if (inSolid(G.cam + G.px, G.py, 7)) {
          G.px = clamp(G.px - 8, 22, VW - 70);
        }
      } else {
        diePlayer();
      }
    }
  }

  function updateForce(dt) {
    const f = G.force;
    if (G.forceCd > 0) G.forceCd -= dt;
    if (f.fireCd > 0) f.fireCd -= dt;
    if (f.state === 'front' || f.state === 'back') {
      snapForce();
    } else {
      if (f.recall) {
        const dx = G.px - f.x;
        const dy = G.py - f.y;
        const d = hypot(dx, dy) || 1;
        const spd = 400;
        f.vx = dx / d * spd;
        f.vy = dy / d * spd;
      } else {
        const tx = G.px + 130;
        const ty = G.py;
        f.vx += (tx - f.x) * 2.4 * dt;
        f.vy += (ty - f.y) * 3.2 * dt;
        f.vx *= 0.92;
        f.vy *= 0.9;
        f.vx = clamp(f.vx, -280, 320);
        f.vy = clamp(f.vy, -240, 240);
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.x = clamp(f.x, 16, VW - 16);
      const c = caveAt(G.cam + f.x);
      f.y = clamp(f.y, c.top + 14, c.bot - 14);
      if (inSolid(G.cam + f.x, f.y, 12)) {
        const cc = caveAt(G.cam + f.x);
        if (f.y < cc.mid) f.y = cc.top + 16;
        else f.y = cc.bot - 16;
        f.vy *= -0.4;
      }
      if (f.grace > 0) f.grace -= dt;
      const d = hypot(f.x - G.px, f.y - G.py);
      if (d < 20 && f.grace <= 0) dockForce(f.x >= G.px ? 'front' : 'back');
    }
    if (G.deadT <= 0 && f.fireCd <= 0) {
      const cd = f.state === 'fly' ? 0.22 : 0.16;
      f.fireCd = cd;
      fireForceShot();
    }
  }

  function updateCharge(dt) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    if (G.fireHold) {
      const prev = chargeLevel();
      G.chargeT += dt;
      if (G.chargeT > CHG3 + 0.4) G.chargeT = CHG3 + 0.4;
      const lv = chargeLevel();
      if (lv > prev && lv >= 1) {
        audio.chargeTick(lv);
        screenFlash(lv === 3 ? GOLD : MAG, lv === 3 ? 0.28 : 0.14);
        if (lv === 3) {
          kick(3.4);
          popSpark(G.px + 22, G.py, GOLD, 18);
          if (stageEl && !REDUCE) {
            stageEl.classList.remove('charge');
            void stageEl.offsetWidth;
            stageEl.classList.add('charge');
          }
        }
      }
      G.charged = G.chargeT >= TAP;
      if (lv >= 3 && ((G.t * 8) | 0) !== ((G.t - dt) * 8 | 0)) {
        emit(1, {
          x: G.px + 20, y: G.py, j: 10,
          vx0: -20, vx1: 40, vy0: -40, vy1: 40,
          r0: 1.2, r1: 2.6, life: 0.2, rgb: GOLD, g: 0
        });
      }
    }
  }

  function releaseCharge() {
    if (G.mode !== 'play' || G.deadT > 0) {
      G.chargeT = 0;
      G.charged = false;
      return;
    }
    const lv = chargeLevel();
    if (lv >= 1) fireBeam(lv);
    else fireVulcan();
    G.chargeT = 0;
    G.charged = false;
    G.lastLv = 0;
    syncHud();
  }

  function maybeSpawn() {
    if (G.boss || G.mode !== 'play') return;
    const info = stageInfo();
    while (G.spawnI < info.waves.length && info.waves[G.spawnI].x <= G.cam) {
      spawnWave(info.waves[G.spawnI]);
      G.spawnI += 1;
    }
    if (!G.boss && G.cam >= STAGE_LEN) spawnBoss();
  }

  function updateSnake(e, dt) {
    const head = e.segs[0];
    head.x += e.vx * dt;
    e.t += dt;
    const c = caveAt(head.x);
    let ty = c.mid + Math.sin(e.t * 2.15 + e.phase) * e.amp;
    ty = clamp(ty, c.top + 16, c.bot - 16);
    head.y += (ty - head.y) * Math.min(1, 5 * dt);
    for (let i = 1; i < e.segs.length; i++) {
      const p = e.segs[i - 1];
      const s = e.segs[i];
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      const d = hypot(dx, dy) || 1;
      const want = 13;
      if (d > want) {
        s.x += dx / d * (d - want);
        s.y += dy / d * (d - want);
      }
    }
    e.x = head.x;
    e.y = head.y;
    if (head.x < G.cam - 90) e.alive = false;
  }

  function updateBoss(e, dt) {
    e.t += dt;
    const targetX = G.cam + VW - (e.variant === 'heart' ? 118 : 100);
    e.x += (targetX - e.x) * Math.min(1, 1.6 * dt);
    const c = caveAt(e.x);
    const amp = e.variant === 'core' ? 36 : 42;
    const ty = c.mid + Math.sin(e.t * 0.7) * amp;
    e.y += (clamp(ty, c.top + 40, c.bot - 40) - e.y) * Math.min(1, 2.2 * dt);
    e.spin += dt * (e.hp < e.maxHp * 0.45 ? 1.8 : 1.1);
    e.shootCd -= dt;
    const angry = e.hp < e.maxHp * 0.45;
    const rate = (isStorm() ? 0.72 : 0.92) * (angry ? 0.7 : 1);
    if (e.variant === 'heart') {
      if (e.tail) {
        const rootX = e.x + 8;
        const rootY = e.y + 22;
        e.tail[0].x = rootX;
        e.tail[0].y = rootY;
        for (let i = 1; i < e.tail.length; i++) {
          const t = e.t * (angry ? 3.4 : 2.2) + i * 0.35;
          const wantX = rootX + i * 12;
          const wantY = rootY + Math.sin(t) * (18 + i * 2.4);
          e.tail[i].x = lerp(e.tail[i].x, wantX, Math.min(1, 8 * dt));
          e.tail[i].y = lerp(e.tail[i].y, wantY, Math.min(1, 8 * dt));
        }
      }
      if (e.shootCd <= 0) {
        e.shootCd = rate;
        const mouthX = e.x - 28;
        const mouthY = e.y - 4;
        const n = angry ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const sp = (i - (n - 1) / 2) * 0.22;
          aimShot(mouthX, mouthY, isStorm() ? 210 : 170, sp);
        }
      }
      if (angry && ((e.t * 0.35) | 0) !== (((e.t - dt) * 0.35) | 0)) {
        spawnSnake(8);
      }
    } else if (e.variant === 'ring') {
      if (e.shootCd <= 0) {
        e.shootCd = rate * 0.85;
        const n = angry ? 6 : 4;
        for (let i = 0; i < n; i++) {
          const a = e.spin + i * (TAU / n);
          const gx = e.x + Math.cos(a) * 34;
          const gy = e.y + Math.sin(a) * 28;
          aimShot(gx, gy, isStorm() ? 200 : 160, 0);
        }
      }
    } else {
      if (e.shootCd <= 0) {
        e.shootCd = angry ? 0.7 : 1.05;
        const n = angry ? 10 : 7;
        for (let i = 0; i < n; i++) {
          const a = e.spin * 0.4 + i * (TAU / n);
          enemyShot(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, i % 4 === 0);
        }
      }
      if (angry && ((e.t * 0.42) | 0) !== (((e.t - dt) * 0.42) | 0)) spawnSnake(9);
    }
  }

  function updateEnts(dt) {
    const raidShot = isStorm() ? 1.25 : 1;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        if (e.type !== 'boss') G.ents.splice(i, 1);
        continue;
      }
      if (e.type === 'snake') updateSnake(e, dt);
      else if (e.type === 'boss') updateBoss(e, dt);
      else {
        e.t += dt;
        if (e.type === 'fighter') {
          e.x += e.vx * dt;
          e.y += Math.sin(e.t * 3 + e.phase) * 28 * dt;
          const c = caveAt(e.x);
          e.y = clamp(e.y, c.top + 12, c.bot - 12);
          e.shootCd -= dt * raidShot;
          if (e.shootCd <= 0 && e.x < G.cam + VW - 20) {
            e.shootCd = rand(1.1, 2.0) / raidShot;
            if (Math.random() < (isStorm() ? 0.55 : 0.32)) {
              enemyShot(e.x, e.y, isStorm() ? -180 : -150, 0, false);
            }
          }
        } else if (e.type === 'turret') {
          const c = caveAt(e.x);
          e.y = e.side < 0 ? c.top + 14 : c.bot - 14;
          e.shootCd -= dt * raidShot;
          if (e.shootCd <= 0 && e.x < G.cam + VW - 10 && e.x > G.cam) {
            e.shootCd = (isStorm() ? 1.05 : 1.4) + Math.random() * 0.4;
            aimShot(e.x, e.y, isStorm() ? 190 : 150, rand(-0.06, 0.06));
          }
        } else if (e.type === 'gunship') {
          e.x += e.vx * dt;
          const c = caveAt(e.x);
          e.y += (c.mid + Math.sin(e.t * 1.3) * 26 - e.y) * Math.min(1, 2 * dt);
          e.shootCd -= dt * raidShot;
          if (e.shootCd <= 0) {
            e.shootCd = isStorm() ? 0.85 : 1.15;
            for (let k = -1; k <= 1; k++) aimShot(e.x - 8, e.y, isStorm() ? 185 : 150, k * 0.2);
          }
        }
        if (e.x < G.cam - 80) e.alive = false;
      }
    }
  }

  function shotHitsEnt(s, e) {
    if (e.type === 'snake') {
      for (let i = 0; i < e.segs.length; i++) {
        const g = e.segs[i];
        if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, g.x - G.cam, g.y, 8, 8)) {
          return { hx: g.x - G.cam, hy: g.y };
        }
      }
      return null;
    }
    if (e.type === 'boss') {
      if (e.variant === 'heart') {
        const hx = e.x - G.cam - 16;
        const hy = e.y - 2;
        if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, hx, hy, 16, 16)) {
          return { hx: hx, hy: hy };
        }
        if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, e.x - G.cam + 6, e.y + 2, 28, 26)) {
          return { hx: e.x - G.cam, hy: e.y };
        }
        return null;
      }
      if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, e.x - G.cam, e.y, e.w * 0.55, e.h * 0.55)) {
        return { hx: e.x - G.cam, hy: e.y };
      }
      return null;
    }
    if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, e.x - G.cam, e.y, e.w, e.h)) {
      return { hx: e.x - G.cam, hy: e.y };
    }
    return null;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += (s.vy || 0) * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > VW + 80 || s.x < -60) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.type !== 'beam' && inSolid(G.cam + s.x, s.y, 2)) {
        popSpark(s.x, s.y, s.rgb || CYN, 6);
        G.shots.splice(i, 1);
        continue;
      }
      let dead = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        if (s.type === 'beam' && s.hit && s.hit[e.id]) continue;
        const hit = shotHitsEnt(s, e);
        if (!hit) continue;
        if (s.type === 'beam') {
          if (!s.hit) s.hit = {};
          s.hit[e.id] = true;
        }
        hurtEnt(e, s.dmg, hit.hx, hit.hy, false);
        s.pierce -= 1;
        if (s.pierce <= 0) {
          dead = true;
          break;
        }
      }
      if (dead) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const sxv = s.x - G.cam;
      if (s.life <= 0 || sxv < -40 || sxv > VW + 40 || s.y < -20 || s.y > VH + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (inSolid(s.x, s.y, s.r)) {
        G.eShots.splice(i, 1);
        continue;
      }
      const f = G.force;
      if (s.blockable && hypot(sxv - f.x, s.y - f.y) < 16 + s.r) {
        G.eShots.splice(i, 1);
        f.blockT = 0.12;
        popSpark(f.x, f.y, GOLD, 11);
        audio.block();
        emit(4, {
          x: f.x, y: f.y, j: 3,
          vx0: -60, vx1: 60, vy0: -60, vy1: 60,
          r0: 1, r1: 2.4, life: 0.18, rgb: GOLD, g: 0
        });
        continue;
      }
      if (G.deadT <= 0 && G.invuln <= 0 && hypot(sxv - G.px, s.y - G.py) < 8 + s.r) {
        G.eShots.splice(i, 1);
        diePlayer();
      }
    }
  }

  function collideBodies() {
    if (G.deadT > 0) return;
    const f = G.force;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const hits = [];
      if (e.type === 'snake') {
        for (let k = 0; k < e.segs.length; k++) {
          hits.push({ x: e.segs[k].x - G.cam, y: e.segs[k].y, r: 8 });
        }
      } else if (e.type === 'boss') {
        hits.push({ x: e.x - G.cam, y: e.y, r: Math.max(e.w, e.h) * 0.45 });
        if (e.tail) {
          for (let k = 2; k < e.tail.length; k++) {
            hits.push({ x: e.tail[k].x - G.cam, y: e.tail[k].y, r: 7 });
          }
        }
      } else {
        hits.push({ x: e.x - G.cam, y: e.y, r: Math.max(e.w, e.h) * 0.7 });
      }
      for (let h = 0; h < hits.length; h++) {
        const p = hits[h];
        if (hypot(p.x - f.x, p.y - f.y) < 15 + p.r * 0.7) {
          if (f.ramT <= 0) {
            f.ramT = 0.11;
            hurtEnt(e, isStorm() ? 2 : 1, f.x, f.y, true);
            audio.ram();
          }
        }
        if (G.invuln <= 0 && hypot(p.x - G.px, p.y - G.py) < 8 + p.r * 0.55) {
          diePlayer();
          return;
        }
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.2);
      return;
    }
    updateFx(dt);
    if (G.mode === 'title') {
      G.cam += 28 * dt;
      snapForce();
      return;
    }
    if (G.mode === 'lose') return;
    if (G.mode === 'win') {
      G.cam += 18 * dt;
      return;
    }

    if (G.winT > 0) {
      G.winT -= dt;
      updateShots(dt);
      updateEnts(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    G.cam += scrollSpd() * dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnts(dt);
      updateShots(dt);
      maybeSpawn();
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    updateMove(dt);
    updateForce(dt);
    updateCharge(dt);
    if (!REDUCE && G.deadT <= 0 && ((G.t * 24) | 0) !== (((G.t - dt) * 24) | 0)) {
      emit(1, {
        x: G.px - 12, y: G.py, j: 2.2,
        vx0: -90, vx1: -24, vy0: -18, vy1: 18,
        r0: 1.1, r1: 2.4, life: 0.2, rgb: CYN, g: 0
      });
    }
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    collideBodies();
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.chargeT / CHG3, 0, 1) + ')';
    if (chgWrap) chgWrap.classList.toggle('hot', chargeLevel() >= 3);
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      c.fillStyle = rgba(WHT, s.a);
      c.fillRect(sx(s.x), sy(s.y), s.s * scale, s.s * scale);
    }
  }

  function drawCave() {
    const c = ctx;
    const step = 10;
    const topPts = [];
    const botPts = [];
    for (let x = -20; x <= VW + 24; x += step) {
      const wx = G.cam + x;
      const cv = caveAt(wx);
      let top = cv.top;
      let bot = cv.bot;
      const i = Math.round(wx / 48);
      const depth = columnDepth(i);
      if (depth > 0 && Math.abs(wx - i * 48) < 14) {
        if (columnTop(i)) top += depth;
        else bot -= depth;
      }
      topPts.push(x, top);
      botPts.push(x, bot);
    }
    c.fillStyle = '#1a0814';
    c.beginPath();
    c.moveTo(sx(-20), sy(-4));
    for (let i = 0; i < topPts.length; i += 2) c.lineTo(sx(topPts[i]), sy(topPts[i + 1]));
    c.lineTo(sx(VW + 24), sy(-4));
    c.closePath();
    c.fill();
    c.fillStyle = '#160610';
    c.beginPath();
    c.moveTo(sx(-20), sy(VH + 4));
    for (let i = 0; i < botPts.length; i += 2) c.lineTo(sx(botPts[i]), sy(botPts[i + 1]));
    c.lineTo(sx(VW + 24), sy(VH + 4));
    c.closePath();
    c.fill();

    c.strokeStyle = rgba(MAG, 0.55);
    c.lineWidth = Math.max(1, 1.6 * scale);
    c.beginPath();
    for (let i = 0; i < topPts.length; i += 2) {
      if (i === 0) c.moveTo(sx(topPts[i]), sy(topPts[i + 1]));
      else c.lineTo(sx(topPts[i]), sy(topPts[i + 1]));
    }
    c.stroke();
    c.beginPath();
    for (let i = 0; i < botPts.length; i += 2) {
      if (i === 0) c.moveTo(sx(botPts[i]), sy(botPts[i + 1]));
      else c.lineTo(sx(botPts[i]), sy(botPts[i + 1]));
    }
    c.stroke();

    c.fillStyle = rgba(FLESH, 0.35);
    for (let x = 0; x < VW; x += 48) {
      const wx = G.cam + x;
      const i = Math.round(wx / 48);
      const dpt = columnDepth(i);
      if (dpt <= 8) continue;
      const cv = caveAt(i * 48);
      if (columnTop(i)) {
        c.fillRect(sx(i * 48 - G.cam - 6), sy(cv.top), 12 * scale, dpt * scale);
      } else {
        c.fillRect(sx(i * 48 - G.cam - 6), sy(cv.bot - dpt), 12 * scale, dpt * scale);
      }
    }
  }

  function drawFighter(e) {
    const c = ctx;
    const x = e.x - G.cam;
    const y = e.y;
    c.save();
    c.translate(sx(x), sy(y));
    c.fillStyle = rgba(PNK, 0.95);
    c.beginPath();
    c.moveTo(-12 * scale, 0);
    c.lineTo(8 * scale, -7 * scale);
    c.lineTo(4 * scale, 0);
    c.lineTo(8 * scale, 7 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(MAG, 0.95);
    c.fillRect(-2 * scale, -2.2 * scale, 6 * scale, 4.4 * scale);
    c.restore();
  }

  function drawTurret(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(FLESH, 0.95);
    c.fillRect(-9 * scale, -8 * scale, 18 * scale, 16 * scale);
    c.fillStyle = rgba(MAG, 0.9);
    c.beginPath();
    c.arc(0, 0, 5 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.7);
    c.fillRect(0, -2 * scale, 10 * scale, 4 * scale);
    c.restore();
  }

  function drawGunship(e) {
    const c = ctx;
    const x = e.x - G.cam;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(MAG, 0.92);
    c.beginPath();
    c.ellipse(0, 0, 18 * scale, 10 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.9);
    c.beginPath();
    c.ellipse(-2 * scale, 0, 8 * scale, 5 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.8);
    c.fillRect(6 * scale, -2 * scale, 8 * scale, 4 * scale);
    c.restore();
  }

  function drawSegs(segs, rgb, r) {
    const c = ctx;
    for (let i = segs.length - 1; i >= 0; i--) {
      const s = segs[i];
      const rad = r * (i === 0 ? 1.25 : 1 - i * 0.03);
      c.fillStyle = rgba(i === 0 ? MAG : rgb, 0.92);
      c.beginPath();
      c.arc(sx(s.x - G.cam), sy(s.y), Math.max(2.2, rad) * scale, 0, TAU);
      c.fill();
    }
  }

  function drawSnake(e) {
    drawSegs(e.segs, PNK, 7.2);
    const h = e.segs[0];
    const c = ctx;
    c.fillStyle = rgba(GOLD, 0.9);
    c.beginPath();
    c.arc(sx(h.x - G.cam - 3), sy(h.y - 2), 1.6 * scale, 0, TAU);
    c.arc(sx(h.x - G.cam - 3), sy(h.y + 2), 1.6 * scale, 0, TAU);
    c.fill();
  }

  function drawBoss(e) {
    const c = ctx;
    const x = e.x - G.cam;
    const y = e.y;
    if (e.variant === 'heart') {
      if (e.tail) drawSegs(e.tail, FLESH, 6.4);
      c.save();
      c.translate(sx(x), sy(y));
      c.fillStyle = rgba(FLESH, 0.95);
      c.beginPath();
      c.ellipse(8 * scale, 4 * scale, 46 * scale, 38 * scale, 0.15, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.85);
      c.beginPath();
      c.ellipse(-6 * scale, -2 * scale, 22 * scale, 18 * scale, 0, 0, TAU);
      c.fill();
      const beat = 1 + Math.sin(e.t * 6) * 0.08;
      c.fillStyle = rgba(MAG, 0.96);
      c.beginPath();
      c.ellipse(-18 * scale, -2 * scale, 14 * scale * beat, 14 * scale * beat, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.7);
      c.beginPath();
      c.ellipse(-18 * scale, -2 * scale, 6 * scale, 6 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
    } else if (e.variant === 'ring') {
      c.save();
      c.translate(sx(x), sy(y));
      c.strokeStyle = rgba(ORG, 0.9);
      c.lineWidth = Math.max(2, 3.2 * scale);
      c.beginPath();
      c.ellipse(0, 0, 38 * scale, 30 * scale, e.spin, 0, TAU);
      c.stroke();
      const n = 4;
      for (let i = 0; i < n; i++) {
        const a = e.spin + i * (TAU / n);
        c.fillStyle = rgba(MAG, 0.95);
        c.beginPath();
        c.arc(Math.cos(a) * 34 * scale, Math.sin(a) * 28 * scale, 7 * scale, 0, TAU);
        c.fill();
      }
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(0, 0, 12 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MAG, 0.9);
      c.beginPath();
      c.arc(0, 0, 5.5 * scale, 0, TAU);
      c.fill();
      c.restore();
    } else {
      c.save();
      c.translate(sx(x), sy(y));
      const beat = 1 + Math.sin(e.t * 3.2) * 0.05;
      c.fillStyle = rgba(MAG, 0.88);
      c.beginPath();
      c.ellipse(0, 0, 48 * scale * beat, 36 * scale * beat, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.ellipse(-6 * scale, 0, 18 * scale, 16 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.85);
      c.beginPath();
      c.arc(-4 * scale, 0, 8 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
    const c2 = ctx;
    const pct = clamp(e.hp / e.maxHp, 0, 1);
    const bw = 180;
    const bh = 7;
    const bx = VW * 0.5 - bw * 0.5;
    const by = 14;
    c2.fillStyle = 'rgba(0,0,0,0.45)';
    c2.fillRect(sx(bx - 2), sy(by - 2), (bw + 4) * scale, (bh + 4) * scale);
    c2.fillStyle = rgba(DEEP, 0.9);
    c2.fillRect(sx(bx), sy(by), bw * scale, bh * scale);
    c2.fillStyle = rgba(pct < 0.35 ? MAG : GOLD, 0.95);
    c2.fillRect(sx(bx), sy(by), bw * pct * scale, bh * scale);
    c2.font = '700 ' + (10 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    c2.fillStyle = rgba(WHT, 0.85);
    c2.textAlign = 'center';
    c2.textBaseline = 'bottom';
    c2.fillText(e.name, sx(VW * 0.5), sy(by - 3));
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0) return;
    const c = ctx;
    const x = G.px;
    const y = G.py;
    c.save();
    c.translate(sx(x), sy(y));
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle * 10);
      c.fillRect(12 * scale, -2 * scale, 10 * scale, 4 * scale);
    }
    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.moveTo(16 * scale, 0);
    c.lineTo(-6 * scale, -8 * scale);
    c.lineTo(-12 * scale, -3 * scale);
    c.lineTo(-12 * scale, 3 * scale);
    c.lineTo(-6 * scale, 8 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.moveTo(8 * scale, 0);
    c.lineTo(-2 * scale, -3.4 * scale);
    c.lineTo(-2 * scale, 3.4 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(MAG, 0.9);
    c.fillRect(-12 * scale, -2.2 * scale, 7 * scale, 4.4 * scale);
    const thr = 0.6 + Math.sin(G.t * 28) * 0.4;
    c.fillStyle = rgba(CYN, 0.55 + thr * 0.4);
    c.beginPath();
    c.moveTo(-12 * scale, -2.4 * scale);
    c.lineTo((-18 - thr * 8) * scale, 0);
    c.lineTo(-12 * scale, 2.4 * scale);
    c.closePath();
    c.fill();
    const lv = chargeLevel();
    if (G.fireHold && G.chargeT >= TAP) {
      const rad = 4 + lv * 5 + Math.sin(G.t * 14) * 1.2;
      c.fillStyle = rgba(lv >= 3 ? GOLD : lv >= 2 ? MAG : CYN, 0.55);
      c.beginPath();
      c.arc(18 * scale, 0, rad * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(WHT, 0.7);
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.beginPath();
      c.arc(18 * scale, 0, (rad + 3) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  function drawForce() {
    if (G.deadT > 0 && G.force.state !== 'fly') return;
    const f = G.force;
    const c = ctx;
    c.save();
    c.translate(sx(f.x), sy(f.y));
    c.rotate(f.spin * 0.35);
    const glow = f.blockT > 0 ? 1 : 0.7;
    c.strokeStyle = rgba(GOLD, 0.55 + (f.blockT > 0 ? 0.4 : 0));
    c.lineWidth = Math.max(1, 1.5 * scale);
    c.beginPath();
    c.ellipse(0, 0, 16 * scale, 10 * scale, 0, 0, TAU);
    c.stroke();
    c.beginPath();
    c.ellipse(0, 0, 10 * scale, 16 * scale, 0, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(ORG, glow);
    c.beginPath();
    c.arc(0, 0, 9.5 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(f.blockT > 0 ? WHT : MAG, 0.95);
    c.beginPath();
    c.arc(0, 0, 4.2 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.type === 'beam') {
        const a = clamp(s.life / 0.72, 0, 1);
        c.fillStyle = rgba(s.rgb, 0.35 * a);
        c.fillRect(sx(s.x - s.w * 0.2), sy(s.y - s.h * 0.7), s.w * 1.4 * scale, s.h * 1.4 * scale);
        c.fillStyle = rgba(s.rgb, 0.9 * a);
        c.fillRect(sx(s.x - s.w * 0.5), sy(s.y - s.h * 0.5), s.w * scale, s.h * scale);
        c.fillStyle = rgba(WHT, 0.8 * a);
        c.fillRect(sx(s.x - s.w * 0.5), sy(s.y - s.h * 0.18), s.w * scale, s.h * 0.36 * scale);
        if (!REDUCE) {
          for (let k = 0; k < 3; k++) {
            const oy2 = Math.sin(G.t * 24 + k + s.x * 0.05) * s.h * 0.35;
            c.fillStyle = rgba(WHT, 0.35 * a);
            c.fillRect(sx(s.x - s.w * 0.4), sy(s.y + oy2), s.w * 0.8 * scale, 1.4 * scale);
          }
        }
      } else {
        c.fillStyle = rgba(s.rgb || CYN, 0.95);
        c.fillRect(sx(s.x - s.w * 0.5), sy(s.y - s.h * 0.5), s.w * scale, Math.max(2, s.h * scale));
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      c.fillStyle = rgba(s.fat ? MAG : PNK, 0.95);
      c.beginPath();
      c.arc(sx(s.x - G.cam), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      if (s.fat) {
        c.fillStyle = rgba(GOLD, 0.55);
        c.beginPath();
        c.arc(sx(s.x - G.cam), sy(s.y), s.r * 0.4 * scale, 0, TAU);
        c.fill();
      }
    }
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      c.fillRect(sx(p.x - p.r * 0.5), sy(p.y - p.r * 0.5), p.r * scale, p.r * scale);
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.28;
      c.fillStyle = rgba(s.rgb, 1 - t);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.rad * (0.4 + t) * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, 1 - t);
      c.lineWidth = Math.max(1, 2 * scale * (1 - t));
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + t * 28) * scale, 0, TAU);
      c.stroke();
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#0c0410';
    c.fillRect(0, 0, W, H);

    c.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake * scale;
      shy = (Math.random() - 0.5) * G.shake * 0.7 * scale;
    }
    const punch = REDUCE ? 1 : G.punch;
    c.translate(W * 0.5 + shx, H * 0.5 + shy);
    c.scale(punch, punch);
    c.translate(-W * 0.5, -H * 0.5);

    const g = c.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    g.addColorStop(0, '#160814');
    g.addColorStop(1, '#0c0410');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawCave();

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = (e.x || 0) - G.cam;
      if (e.type !== 'snake' && e.type !== 'boss' && (x < -50 || x > VW + 50)) continue;
      if (e.type === 'fighter') drawFighter(e);
      else if (e.type === 'turret') drawTurret(e);
      else if (e.type === 'gunship') drawGunship(e);
      else if (e.type === 'snake') drawSnake(e);
      else if (e.type === 'boss') drawBoss(e);
    }

    if (G.force.state === 'back') drawForce();
    drawShip();
    if (G.force.state !== 'back') drawForce();
    drawShots();
    drawFx();

    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    c.restore();
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerWorldY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
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

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    const forceKey = k === 'c' || k === 'C';
    if (space) keys.sht = down;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || forceKey)) {
      e.preventDefault();
    }
    if (!down) {
      if (space && G.fireHold) {
        G.fireHold = false;
        releaseCharge();
      }
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || forceKey)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (forceKey) {
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      launchForce();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'storm' : 'raid');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play' && space) {
        if (!G.fireHold) G.fireHold = true;
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (e.button === 2) {
        e.preventDefault();
        launchForce();
        return;
      }
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      inputSrc = 'ptr';
      if (G.mode === 'play' && !G.fireHold) G.fireHold = true;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      if (G.fireHold && inputSrc === 'ptr') {
        G.fireHold = false;
        releaseCharge();
      }
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
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

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      startGame('storm');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'raid');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnForce) {
    btnForce.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      launchForce();
      btnForce.classList.add('held');
    });
    btnForce.addEventListener('pointerup', function () {
      btnForce.classList.remove('held');
    });
    btnForce.addEventListener('pointercancel', function () {
      btnForce.classList.remove('held');
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
      keys.sht = false;
      if (G.fireHold) {
        G.fireHold = false;
        releaseCharge();
      }
    }
  });

  requestAnimationFrame(frame);
})();
