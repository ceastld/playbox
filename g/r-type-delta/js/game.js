'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.28;
  const STAGE_LEN = 1500;
  const CHG1 = 0.4;
  const CHG2 = 0.86;
  const CHG3 = 1.42;
  const BEST_KEY = 'playbox-r-type-delta-best';
  const MUTE_KEY = 'playbox-r-type-delta-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格 / Z 射击（按住蓄力）· X 力核 · R 重开 · M 静音';
  const LEAD = 'Δ核吸收。空格蓄力放波炮，满核再放变成Δ炮。X 把力核打出去吸弹，再飞过去对接。短关之后打武核。别当成武装、武装2、武装三或武装狮——这是Δ核吸收，不是力爪格挡，不是满波打核，不是力荚比特，不是扇弹激光。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const CYN = [42, 212, 224];
  const TEAL = [20, 212, 196];
  const GOLD = [255, 227, 107];
  const HOT = [90, 224, 240];
  const MAG = [255, 90, 154];
  const FLESH = [224, 112, 136];
  const WHT = [230, 248, 252];
  const DEEP = [6, 24, 32];
  const STEEL = [42, 72, 80];
  const PNK = [255, 160, 176];

  const SCORE = {
    dart: 50,
    turret: 80,
    wreck: 150,
    mite: 70,
    cell: 120,
    shard: 30,
    limb: 180,
    cyst: 90,
    guard: 110,
    arm: 80,
    boss: 10000,
    clear: 1500,
    all: 4200
  };

  const DOSE_AMT = {
    dart: 0.1,
    turret: 0.12,
    wreck: 0.18,
    mite: 0.1,
    cell: 0.16,
    shard: 0.06,
    limb: 0.18,
    cyst: 0.14,
    guard: 0.16,
    arm: 0.12,
    boss: 0.03
  };

  const STAGES = [
    {
      name: '赤湾',
      boss: 'Δ核',
      seed: 11,
      waves: [
        { x: 40, kind: 'darts', n: 5, y: 0.42 },
        { x: 170, kind: 'turret', side: -1 },
        { x: 250, kind: 'darts', n: 6, y: 0.58 },
        { x: 370, kind: 'wreck' },
        { x: 490, kind: 'turret', side: 1 },
        { x: 570, kind: 'darts', n: 5, y: 0.3 },
        { x: 690, kind: 'turret', side: -1 },
        { x: 730, kind: 'turret', side: 1 },
        { x: 850, kind: 'wreck' },
        { x: 970, kind: 'darts', n: 7, y: 0.5 },
        { x: 1090, kind: 'darts', n: 4, y: 0.24 },
        { x: 1130, kind: 'darts', n: 4, y: 0.74 },
        { x: 1260, kind: 'wreck' },
        { x: 1380, kind: 'turret', side: -1 }
      ]
    },
    {
      name: '胞廊',
      boss: 'Δ核',
      seed: 22,
      waves: [
        { x: 30, kind: 'mites', n: 6 },
        { x: 140, kind: 'cell' },
        { x: 240, kind: 'darts', n: 5, y: 0.46 },
        { x: 340, kind: 'turret', side: -1 },
        { x: 420, kind: 'mites', n: 7 },
        { x: 540, kind: 'cell' },
        { x: 640, kind: 'limb' },
        { x: 760, kind: 'cell' },
        { x: 860, kind: 'mites', n: 8 },
        { x: 980, kind: 'turret', side: 1 },
        { x: 1060, kind: 'darts', n: 6, y: 0.34 },
        { x: 1180, kind: 'cell' },
        { x: 1280, kind: 'mites', n: 7 },
        { x: 1400, kind: 'limb' }
      ]
    },
    {
      name: '核门',
      boss: 'Δ核',
      seed: 33,
      bossHp: 124,
      waves: [
        { x: 20, kind: 'cysts', n: 4 },
        { x: 140, kind: 'guard' },
        { x: 240, kind: 'darts', n: 6, y: 0.4 },
        { x: 340, kind: 'turret', side: -1 },
        { x: 380, kind: 'turret', side: 1 },
        { x: 500, kind: 'cysts', n: 5 },
        { x: 620, kind: 'guard' },
        { x: 740, kind: 'limb' },
        { x: 860, kind: 'cysts', n: 5 },
        { x: 980, kind: 'guard' },
        { x: 1100, kind: 'turret', side: -1 },
        { x: 1140, kind: 'turret', side: 1 },
        { x: 1260, kind: 'guard' },
        { x: 1380, kind: 'darts', n: 6, y: 0.5 }
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
  const doseBar = document.getElementById('dose-bar');
  const doseWrap = document.getElementById('dose-wrap');

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
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false, space: false, z: false, force: false };
  let uid = 1;
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const doses = [];

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
    spawnI: 0,
    fireHold: false,
    chargeT: 0,
    lastLv: 0,
    vulcCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    boss: false,
    winT: 0,
    dose: 0,
    doseReady: false,
    force: {
      state: 'front',
      x: 120,
      y: VH * 0.5,
      vx: 0,
      vy: 0,
      spin: 0,
      fireCd: 0,
      ramT: 0,
      blockT: 0,
      grace: 0,
      recall: false,
      from: 'front',
      suck: 0
    },
    ents: [],
    shots: [],
    eShots: []
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
    return 1 + Math.min(4, Math.floor((Math.max(1, G.combo) - 1) / 3));
  }
  function moveSpd() {
    return isStorm() ? 310 : 266;
  }
  function scrollSpd() {
    if (G.boss) return isStorm() ? 16 : 10;
    return isStorm() ? 146 : 98;
  }
  function chargeLevel() {
    if (G.chargeT >= CHG3) return 3;
    if (G.chargeT >= CHG2) return 2;
    if (G.chargeT >= CHG1) return 1;
    return 0;
  }
  function fireRate() {
    return isStorm() ? 1.24 : 1;
  }
  function shootHeld() {
    return keys.space || keys.z;
  }
  function hash2(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function valNoise(x, salt) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return lerp(hash2(i + salt * 19), hash2(i + 1 + salt * 19), u);
  }
  function fbm(x, salt) {
    return valNoise(x, salt) * 0.6 + valNoise(x * 2.1, salt + 3) * 0.3 + valNoise(x * 4.3, salt + 7) * 0.1;
  }
  function stageAt(wx) {
    return clamp(Math.floor(wx / STAGE_LEN) + 1, 1, 3);
  }
  function caveAt(wx) {
    const st = stageAt(wx);
    const local = wx - (st - 1) * STAGE_LEN;
    let top;
    let bot;
    if (st === 1) {
      const n = fbm(wx * 0.01, 11);
      top = 22 + n * 20;
      bot = VH - 22 - fbm(wx * 0.01, 17) * 20;
      const i = Math.round(wx / 82);
      const h = 18 + hash2(i + 13) * 54;
      if (hash2(i + 5) > 0.54) {
        if (hash2(i + 9) > 0.5) top += h * 0.48;
        else bot -= h * 0.48;
      }
    } else if (st === 2) {
      top = 42 + fbm(wx * 0.016, 8) * 48 + Math.sin(wx * 0.023) * 10;
      bot = VH - 42 - fbm(wx * 0.016, 14) * 48 - Math.cos(wx * 0.02) * 10;
      const i = Math.round(wx / 50);
      const spike = hash2(i + 29) > 0.58 ? 22 + hash2(i) * 34 : 0;
      if (spike) {
        if (hash2(i + 6) > 0.5) top += spike;
        else bot -= spike;
      }
    } else {
      const step = (Math.floor(wx / 90) % 3) * 16;
      top = 32 + step + fbm(wx * 0.012, 9) * 8;
      bot = VH - 32 - ((Math.floor(wx / 90 + 1) % 3) * 14);
      if (G.boss || local > STAGE_LEN - 96) {
        top = 18;
        bot = VH - 18;
      }
    }
    if (top > bot - 92) {
      const mid = (top + bot) * 0.5;
      top = mid - 50;
      bot = mid + 50;
    }
    return { top: top, bot: bot, mid: (top + bot) * 0.5 };
  }
  function inSolid(wx, y, r) {
    const c = caveAt(wx);
    return y - r < c.top || y + r > c.bot;
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
      this.beep(920, 0.044, 'square', 0.03, 1880);
    },
    pulse() {
      this.ensure();
      this.beep(640, 0.06, 'sine', 0.028, 1280);
      this.beep(1280, 0.04, 'triangle', 0.018, 420);
    },
    chargeTick(lv) {
      this.ensure();
      const f = 240 + lv * 220;
      this.beep(f, 0.075, lv >= 3 ? 'triangle' : 'sine', 0.034, f * 1.6);
    },
    beam(lv) {
      this.ensure();
      this.noise(0.12 + lv * 0.05, 0.06, 220);
      this.beep(150 + lv * 40, 0.22, 'sawtooth', 0.056, 58);
      this.beep(520 + lv * 110, 0.15, 'square', 0.042, 140);
      if (lv >= 3) this.beep(1380, 0.18, 'triangle', 0.04, 2200);
    },
    delta() {
      this.ensure();
      this.noise(0.2, 0.07, 180);
      this.beep(180, 0.28, 'sawtooth', 0.06, 70);
      this.beep(720, 0.2, 'triangle', 0.05, 1680);
      this.beep(1440, 0.16, 'sine', 0.04, 280);
    },
    launch() {
      this.ensure();
      this.beep(260, 0.12, 'sawtooth', 0.048, 860);
      this.beep(980, 0.12, 'triangle', 0.03, 240);
      this.noise(0.08, 0.036, 480);
    },
    recall() {
      this.ensure();
      this.beep(820, 0.08, 'square', 0.034, 240);
      this.beep(360, 0.1, 'sine', 0.028, 140);
    },
    dock() {
      this.ensure();
      this.beep(700, 0.06, 'square', 0.04, 240);
      this.beep(350, 0.1, 'triangle', 0.034, 140);
    },
    block() {
      this.ensure();
      this.beep(1420, 0.038, 'square', 0.032, 420);
      this.noise(0.03, 0.018, 1600);
    },
    suck() {
      this.ensure();
      this.beep(980, 0.05, 'sine', 0.03, 220);
      this.noise(0.04, 0.022, 700);
    },
    ram() {
      this.ensure();
      this.noise(0.05, 0.04, 360);
      this.beep(190, 0.08, 'sawtooth', 0.04, 80);
    },
    dose() {
      this.ensure();
      this.beep(880, 0.05, 'sine', 0.026, 1320);
    },
    doseFull() {
      this.ensure();
      this.beep(523, 0.08, 'triangle', 0.04, 784);
      this.beep(784, 0.12, 'sine', 0.038, 1175);
      this.beep(1175, 0.16, 'square', 0.03, 1568);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 170 : kind === 'cell' ? 560 : 470;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.032, 1080);
      this.beep(base * lift, 0.072, 'square', 0.046, base * lift * 1.5);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.065, 250);
      this.beep(250, 0.22, 'sawtooth', 0.052, 55);
      this.beep(118, 0.34, 'sine', 0.045, 36);
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
      this.beep(210, 0.18, 'sawtooth', 0.04, 86);
      this.beep(130, 0.3, 'sine', 0.05, 46);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    warn() {
      this.ensure();
      this.beep(210, 0.16, 'square', 0.04, 105);
      this.beep(320, 0.22, 'sawtooth', 0.035, 78);
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
    if (n <= 0) return;
    G.score += n;
    saveBest();
    if (scoreEl) scoreEl.textContent = String(G.score);
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
        if (tok === addTok && scoreAdd) scoreAdd.hidden = true;
      }, 700);
    }
    while (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      audio.up();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIFE_CAP, G.lives);
    while (pips.length < n) {
      const el = document.createElement('i');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
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
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function syncDoseBar() {
    if (doseBar) doseBar.style.transform = 'scaleX(' + clamp(G.dose, 0, 1) + ')';
    if (doseWrap) doseWrap.classList.toggle('hot', G.dose >= 1);
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
      tagLabel.textContent = isStorm() ? '武核' : '武装Δ';
      tagLabel.className = isStorm() ? 'warn' : '';
    }
    if (forceLabel) {
      const st = G.force.state;
      forceLabel.textContent = st === 'back' ? '后核' : st === 'fly' ? (G.force.recall ? '回收' : '吸弹') : '前核';
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
    if (chgWrap) chgWrap.classList.toggle('hot', lv >= 3 || (lv >= 2 && G.dose >= 1));
    syncDoseBar();
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 力核吸弹，满Δ核放Δ炮', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · Δ核已崩', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 力核挡弹吸弹，满核放Δ炮', 'warn');
    else if (G.dose >= 1) setHint('Δ核已满 · 蓄二档以上放出Δ炮', 'hot');
    else if (G.force.state === 'fly' && G.force.recall) setHint('力核回收中 · 对接后继续出击', '');
    else if (G.force.state === 'fly') setHint('力核游离吸弹 · 再按 X 收回', '');
    else if (G.force.state === 'back') setHint('后核向后打 · X 出击吸弹', '');
    else setHint('前核寻的脉冲 · 空格蓄波炮 · 击杀掉Δ核', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'RTD';
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
    for (let i = 0; i < 76; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.1),
        a: rand(0.18, 0.7),
        p: rand(18, 70)
      });
    }
  }

  function popForm() {
    if (!forceLabel) return;
    forceLabel.classList.remove('pop');
    void forceLabel.offsetWidth;
    forceLabel.classList.add('pop');
    formTok += 1;
  }

  function snapForce() {
    if (G.force.state === 'front') {
      G.force.x = G.px + 30;
      G.force.y = G.py;
    } else if (G.force.state === 'back') {
      G.force.x = G.px - 28;
      G.force.y = G.py;
    }
  }

  function addDose(n) {
    if (n <= 0) return;
    const was = G.dose;
    G.dose = clamp(G.dose + n, 0, 1);
    syncDoseBar();
    if (was < 1 && G.dose >= 1 && !G.doseReady) {
      G.doseReady = true;
      toast('Δ核满', false, true);
      audio.doseFull();
      screenFlash(MAG, 0.22);
      kick(2.4);
      if (doseWrap) {
        doseWrap.classList.remove('hot');
        void doseWrap.offsetWidth;
        doseWrap.classList.add('hot');
      }
    }
  }

  function spawnDose(x, y, amt) {
    if (amt <= 0) return;
    doses.push({
      x: x,
      y: y,
      amt: amt,
      t: 0,
      vx: rand(-50, 40),
      vy: rand(-70, 70)
    });
    capArr(doses, 48);
  }

  function dockForce(side) {
    G.force.state = side;
    G.force.vx = 0;
    G.force.vy = 0;
    G.force.recall = false;
    G.force.from = side;
    snapForce();
    audio.dock();
    popSpark(G.force.x, G.force.y, GOLD, 16);
    floatText(G.force.x, G.force.y - 18, side === 'back' ? '后核' : '前核', GOLD, true);
    hitStop(0.04);
    kick(2.6);
    screenFlash(GOLD, 0.22);
    popForm();
    syncHud();
  }

  function launchForce() {
    if (G.deadT > 0 || G.mode !== 'play') return;
    const f = G.force;
    if (f.state === 'fly') {
      if (!f.recall) {
        f.recall = true;
        f.grace = 0;
        audio.recall();
        floatText(f.x, f.y - 16, '回收', MAG, false);
        popForm();
        syncHud();
      }
      return;
    }
    f.from = f.state === 'back' ? 'back' : 'front';
    f.state = 'fly';
    f.recall = false;
    f.vx = f.from === 'back' ? -490 : 500;
    f.vy = 0;
    f.grace = 0.28;
    audio.launch();
    emit(12, {
      x: f.x, y: f.y, j: 4,
      vx0: -90, vx1: 90, vy0: -80, vy1: 80,
      r0: 1.4, r1: 3.4, life: 0.3, rgb: MAG, g: 30
    });
    popSpark(f.x, f.y, CYN, 15);
    floatText(f.x, f.y - 16, '出击', MAG, true);
    hitStop(0.036);
    kick(2.5);
    screenFlash(MAG, 0.16);
    popForm();
    syncHud();
  }

  function nearestEnemyScreen(x, y) {
    let best = null;
    let bestD = 220;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const ex = e.x - G.cam;
      const ey = e.y;
      if (ex < x - 20 || ex > VW + 40) continue;
      const d = hypot(ex - x, ey - y);
      if (d < bestD) {
        bestD = d;
        best = { x: ex, y: ey, e: e };
      }
    }
    return best;
  }

  function fireVulcan() {
    if (G.vulcCd > 0) return;
    G.vulcCd = isStorm() ? 0.082 : 0.098;
    G.shots.push({
      type: 'vulc',
      x: G.px + 16,
      y: G.py,
      vx: 670,
      vy: 0,
      w: 12,
      h: 3.2,
      dmg: 1,
      pierce: 1,
      life: 1.15,
      rgb: CYN
    });
    G.muzzle = 0.06;
    audio.shoot();
    emit(3, {
      x: G.px + 18, y: G.py, j: 2,
      vx0: 40, vx1: 110, vy0: -30, vy1: 30,
      r0: 1, r1: 2.2, life: 0.12, rgb: HOT, g: 0
    });
  }

  function fireBeam(lv) {
    const h = lv === 3 ? 44 : lv === 2 ? 20 : 10;
    const dmg = lv === 3 ? 24 : lv === 2 ? 11 : 4;
    const pierce = lv === 3 ? 99 : lv === 2 ? 3 : 1;
    G.shots.push({
      type: 'beam',
      x: G.px + 28,
      y: G.py,
      vx: 540,
      vy: 0,
      w: 48 + lv * 10,
      h: h,
      dmg: dmg,
      pierce: pierce,
      life: 0.74,
      rgb: lv >= 3 ? GOLD : lv >= 2 ? HOT : CYN,
      lv: lv,
      hit: {}
    });
    G.muzzle = 0.12;
    audio.beam(lv);
    hitStop(lv === 3 ? 0.07 : 0.048);
    kick(lv === 3 ? 4.0 : 2.6);
    screenFlash(lv >= 3 ? GOLD : CYN, lv === 3 ? 0.32 : 0.16);
    if (lv >= 3) floatText(G.px + 40, G.py - 22, 'WAVE', GOLD, true);
    emit(10 + lv * 4, {
      x: G.px + 24, y: G.py, j: 8,
      vx0: 80, vx1: 280, vy0: -80, vy1: 80,
      r0: 1.4, r1: 3.6, life: 0.28, rgb: lv >= 3 ? GOLD : CYN, g: 40
    });
  }

  function fireDelta() {
    G.dose = 0;
    G.doseReady = false;
    syncDoseBar();
    const angs = [-0.24, 0, 0.24];
    for (let i = 0; i < angs.length; i++) {
      const a = angs[i];
      const spd = 560;
      G.shots.push({
        type: 'beam',
        x: G.px + 28,
        y: G.py,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        w: 46,
        h: 22,
        dmg: 16,
        pierce: 99,
        life: 0.78,
        rgb: i === 1 ? GOLD : MAG,
        lv: 3,
        delta: true,
        hit: {}
      });
    }
    const f = G.force;
    explode(f.x, f.y, MAG, 22);
    for (let k = 0; k < G.ents.length; k++) {
      const e = G.ents[k];
      if (!e.alive) continue;
      const ex = e.x - G.cam;
      const d = hypot(ex - f.x, e.y - f.y);
      if (d < 78) {
        if (e.type === 'boss') hurtEnt(e, 8, f.x, f.y, true);
        else hurtEnt(e, isStorm() ? 4 : 3, f.x, f.y, true);
      }
    }
    G.muzzle = 0.16;
    audio.delta();
    hitStop(0.072);
    kick(4.4);
    screenFlash(MAG, 0.38);
    floatText(G.px + 42, G.py - 24, 'Δ炮', GOLD, true);
    emit(18, {
      x: G.px + 24, y: G.py, j: 10,
      vx0: 60, vx1: 300, vy0: -120, vy1: 120,
      r0: 1.6, r1: 4.2, life: 0.34, rgb: MAG, g: 30
    });
    syncHud();
  }

  function firePulse(x, y, vx, vy) {
    G.shots.push({
      type: 'pulse',
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      w: 9,
      h: 9,
      dmg: 2,
      pierce: 1,
      life: 1.12,
      rgb: TEAL,
      home: true
    });
  }

  function firePellet(x, y, vx, vy) {
    G.shots.push({
      type: 'vulc',
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      w: 8,
      h: 3,
      dmg: 1,
      pierce: 1,
      life: 1.05,
      rgb: TEAL
    });
  }

  function fireForceShot() {
    const f = G.force;
    if (f.state === 'front') {
      firePulse(f.x + 8, f.y - 4, 500, -90);
      firePulse(f.x + 8, f.y + 4, 500, 90);
      audio.pulse();
    } else if (f.state === 'back') {
      firePellet(f.x - 10, f.y, -500, 0);
      firePellet(f.x - 8, f.y - 8, -450, -150);
      firePellet(f.x - 8, f.y + 8, -450, 150);
      audio.shoot();
    }
  }

  function releaseCharge() {
    if (G.mode !== 'play' || G.deadT > 0) {
      G.chargeT = 0;
      G.lastLv = 0;
      return;
    }
    const t = G.chargeT;
    const lv = t >= CHG3 ? 3 : t >= CHG2 ? 2 : t >= CHG1 ? 1 : 0;
    G.chargeT = 0;
    G.lastLv = 0;
    if (lv >= 2 && G.dose >= 1) fireDelta();
    else if (lv >= 1) fireBeam(lv);
    else fireVulcan();
  }

  function pushEnt(e) {
    e.id = uid++;
    e.alive = true;
    e.t = 0;
    G.ents.push(e);
  }

  function spawnDarts(n, yNorm) {
    const y0 = 40 + yNorm * (VH - 80);
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'dart',
        x: G.cam + VW + 24 + i * 28,
        y: y0 + Math.sin(i * 0.9) * 26,
        y0: y0,
        w: 16,
        h: 12,
        hp: 1,
        maxHp: 1,
        fireCd: 0.4 + i * 0.12,
        vx: -76 - i * 4
      });
    }
  }

  function spawnTurret(side) {
    const x = G.cam + VW + 10;
    const c = caveAt(x);
    const top = side < 0;
    pushEnt({
      type: 'turret',
      x: x,
      y: top ? c.top + 14 : c.bot - 14,
      w: 18,
      h: 16,
      hp: 3,
      maxHp: 3,
      side: top ? -1 : 1,
      fireCd: 0.6
    });
  }

  function spawnWreck() {
    pushEnt({
      type: 'wreck',
      x: G.cam + VW + 30,
      y: VH * 0.5 + rand(-40, 40),
      w: 38,
      h: 20,
      hp: 6,
      maxHp: 6,
      fireCd: 0.9,
      vx: -42
    });
  }

  function spawnMites(n) {
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'mite',
        x: G.cam + VW + 18 + i * 22,
        y: 80 + (i % 5) * 55,
        y0: 80 + (i % 5) * 55,
        w: 12,
        h: 10,
        hp: 1,
        maxHp: 1,
        fireCd: 0.8 + i * 0.1,
        phase: i * 0.7
      });
    }
  }

  function spawnCell() {
    pushEnt({
      type: 'cell',
      x: G.cam + VW + 22,
      y: VH * 0.5 + rand(-70, 70),
      w: 20,
      h: 20,
      hp: 4,
      maxHp: 4,
      fireCd: 0.7,
      spin: 0
    });
  }

  function spawnShard(x, y, dir) {
    pushEnt({
      type: 'shard',
      x: x,
      y: y,
      w: 10,
      h: 10,
      hp: 1,
      maxHp: 1,
      vx: -80,
      vy: dir * 140,
      fireCd: 99
    });
  }

  function spawnLimb() {
    const top = hash2((G.cam * 0.01) | 0) > 0.5;
    const c = caveAt(G.cam + VW + 16);
    pushEnt({
      type: 'limb',
      x: G.cam + VW + 20,
      y: top ? c.top + 18 : c.bot - 18,
      w: 28,
      h: 18,
      hp: 5,
      maxHp: 5,
      side: top ? -1 : 1,
      fireCd: 0.8,
      vx: -36
    });
  }

  function spawnCysts(n) {
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'cyst',
        x: G.cam + VW + 20 + i * 34,
        y: 88 + (i % 3) * 88,
        w: 16,
        h: 16,
        hp: 3,
        maxHp: 3,
        fireCd: 0.5 + i * 0.14,
        open: 0
      });
    }
  }

  function spawnGuard() {
    pushEnt({
      type: 'guard',
      x: G.cam + VW + 26,
      y: VH * 0.5 + rand(-60, 60),
      w: 24,
      h: 24,
      hp: 5,
      maxHp: 5,
      fireCd: 0.7,
      spin: 0,
      vx: -48
    });
  }

  function spawnWave(w) {
    if (w.kind === 'darts') spawnDarts(w.n + (isStorm() ? 2 : 0), w.y);
    else if (w.kind === 'turret') spawnTurret(w.side);
    else if (w.kind === 'wreck') spawnWreck();
    else if (w.kind === 'mites') spawnMites(w.n + (isStorm() ? 2 : 0));
    else if (w.kind === 'cell') spawnCell();
    else if (w.kind === 'limb') spawnLimb();
    else if (w.kind === 'cysts') spawnCysts(w.n + (isStorm() ? 1 : 0));
    else if (w.kind === 'guard') spawnGuard();
  }

  function spawnBoss() {
    if (G.boss) return;
    G.boss = true;
    const hp = Math.round((STAGES[2].bossHp || 124) * (isStorm() ? 1.24 : 1));
    const arms = [];
    for (let i = 0; i < 3; i++) {
      arms.push({
        ang: i * (TAU / 3) + 0.4,
        hp: 4,
        maxHp: 4,
        deadT: 0,
        len: 54,
        r: 12
      });
    }
    pushEnt({
      type: 'boss',
      x: G.cam + 572,
      y: VH * 0.5,
      w: 90,
      h: 90,
      hp: hp,
      maxHp: hp,
      fireCd: 0.38,
      phase: 0,
      rage: false,
      arms: arms,
      open: 1
    });
    toast('Δ核', true, false);
    audio.warn();
    syncHud();
  }

  function enemyShot(x, y, vx, vy, fat) {
    G.eShots.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: fat ? 6.4 : 3.4,
      life: 3.4,
      fat: !!fat,
      blockable: !fat
    });
    capArr(G.eShots, 90);
  }

  function aimShot(x, y, spd, spread) {
    const dx = (G.cam + G.px) - x;
    const dy = G.py - y;
    const d = hypot(dx, dy) || 1;
    const a = Math.atan2(dy, dx) + (spread || 0);
    enemyShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, false);
  }

  function armPos(e, arm) {
    const len = arm.len || 54;
    return {
      x: e.x - G.cam + Math.cos(arm.ang) * len,
      y: e.y + Math.sin(arm.ang) * len
    };
  }

  function shotHitsEnt(s, e) {
    const ex = e.x - G.cam;
    const ey = e.y;
    if (e.type === 'boss') {
      const pierceArm = s.type === 'beam' && (s.lv >= 2 || s.delta);
      if (!pierceArm && e.arms) {
        for (let i = 0; i < e.arms.length; i++) {
          const a = e.arms[i];
          if (a.hp <= 0) continue;
          const p = armPos(e, a);
          if (hypot(s.x - p.x, s.y - p.y) < a.r + Math.max(s.w, s.h) * 0.38) {
            return { hx: p.x, hy: p.y, part: 'arm', arm: a };
          }
        }
      }
      const hw = s.type === 'beam' ? 26 : 22;
      const hh = s.type === 'beam' ? 26 : 22;
      if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, ex - 8, ey, hw, hh)) {
        return { hx: s.x, hy: s.y, part: 'core' };
      }
      return null;
    }
    const hw = e.w * 0.5;
    const hh = e.h * 0.5;
    if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, ex, ey, hw, hh)) {
      return { hx: s.x, hy: s.y, part: 'body' };
    }
    return null;
  }

  function hurtEnt(e, dmg, hx, hy, ram) {
    if (!e.alive) return;
    e.hp -= dmg;
    bumpCombo();
    audio.hit(e.type, G.combo);
    emit(4 + dmg, {
      x: hx, y: hy, j: 4,
      vx0: -90, vx1: 70, vy0: -80, vy1: 80,
      r0: 1.1, r1: 2.8, life: 0.22, rgb: e.type === 'boss' ? GOLD : CYN, g: 60
    });
    if (e.type === 'boss') {
      spawnDose(hx, hy, DOSE_AMT.boss);
      hitStop(ram ? 0.03 : 0.038);
      kick(2.4);
    } else if (e.hp <= 0) {
      hitStop(0.04);
    } else {
      hitStop(0.032);
    }
    if (e.hp <= 0) killEnt(e, hx, hy);
    else popSpark(hx, hy, HOT, 8);
  }

  function hurtArm(e, arm, dmg, hx, hy) {
    if (arm.hp <= 0) return;
    arm.hp -= dmg;
    bumpCombo();
    audio.hit('arm', G.combo);
    emit(5, {
      x: hx, y: hy, j: 3,
      vx0: -80, vx1: 80, vy0: -80, vy1: 80,
      r0: 1.1, r1: 2.6, life: 0.2, rgb: MAG, g: 40
    });
    hitStop(0.03);
    if (arm.hp <= 0) {
      arm.deadT = 3.4;
      const n = SCORE.arm * G.mult;
      addScore(n);
      floatText(hx, hy - 8, String(n), MAG, G.mult >= 2);
      explode(hx, hy, MAG, 16);
      spawnDose(hx, hy, DOSE_AMT.arm);
    } else popSpark(hx, hy, MAG, 8);
  }

  function killEnt(e, hx, hy) {
    e.alive = false;
    const pts = SCORE[e.type] || 50;
    const n = pts * G.mult;
    addScore(n);
    floatText(hx, hy - 10, String(n), GOLD, G.mult >= 2);
    spawnDose(hx, hy, DOSE_AMT[e.type] || 0.08);
    if (e.type === 'boss') {
      explode(hx, hy, GOLD, 48);
      explode(hx + 20, hy - 16, MAG, 28);
      explode(hx - 12, hy + 10, CYN, 22);
      hitStop(0.085);
      kick(8);
      screenFlash(GOLD, 0.55);
      onBossDown();
    } else if (e.type === 'cell') {
      explode(hx, hy, MAG, 22);
      spawnShard(e.x, e.y, -1);
      spawnShard(e.x, e.y, 1);
      hitStop(0.05);
      kick(3);
    } else if (e.type === 'wreck' || e.type === 'limb' || e.type === 'guard') {
      explode(hx, hy, HOT, 24);
      hitStop(0.048);
      kick(2.8);
    } else {
      explode(hx, hy, CYN, 14);
      hitStop(0.036);
      kick(2.1);
    }
    syncHud();
  }

  function onBossDown() {
    addScore(SCORE.all);
    G.winT = 1.4;
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play' || G.winT > 0) return;
    G.lives -= 1;
    G.deadT = 0.88;
    G.chargeT = 0;
    G.lastLv = 0;
    G.fireHold = false;
    breakCombo();
    explode(G.px, G.py, MAG, 36);
    explode(G.px + 8, G.py, CYN, 18);
    audio.death();
    hitStop(0.075);
    kick(7.4);
    screenFlash(MAG, 0.58);
    syncPips();
    syncHud();
  }

  function respawn() {
    const c = caveAt(G.cam + 90);
    G.px = 90;
    G.py = c.mid;
    G.invuln = 1.42;
    G.deadT = 0;
    G.force.state = 'front';
    G.force.vx = 0;
    G.force.vy = 0;
    G.force.grace = 0;
    G.force.recall = false;
    G.force.from = 'front';
    snapForce();
    G.chargeT = 0;
    G.eShots.length = 0;
    if (shootHeld()) G.fireHold = true;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', 'X 把力核打出去吸弹挡弹，满Δ核蓄波放出Δ炮。分数 ' + G.score + '。');
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    audio.win();
    showOverlay('win', 'Δ核崩解', '短关打穿，Δ核崩解。分数 ' + G.score + (isStorm() ? ' · 武核' : ' · 武装Δ') + '。');
    setHint('R 重开 · Δ核已崩', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    doses.length = 0;
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
    G.chargeT = 0;
    G.lastLv = 0;
    G.vulcCd = 0;
    G.deadT = 0;
    G.invuln = 1.12;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.boss = false;
    G.winT = 0;
    G.dose = 0;
    G.doseReady = false;
    G.force.state = 'front';
    G.force.vx = 0;
    G.force.vy = 0;
    G.force.ramT = 0;
    G.force.blockT = 0;
    G.force.fireCd = 0;
    G.force.spin = 0;
    G.force.grace = 0;
    G.force.recall = false;
    G.force.from = 'front';
    G.force.suck = 0;
    snapForce();
    G.fireHold = shootHeld() || pointer.down;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isStorm() ? '武核' : '武装Δ', false, !isStorm());
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
    G.dose = 0;
    G.doseReady = false;
    G.force.state = 'front';
    G.force.recall = false;
    snapForce();
    clearWorld();
    showOverlay('title', '武装Δ', LEAD);
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.9);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.force.blockT > 0) G.force.blockT -= dt;
    if (G.force.ramT > 0) G.force.ramT -= dt;
    if (G.force.suck > 0) G.force.suck -= dt;
    G.force.spin += dt * (G.force.state === 'fly' ? 7.6 : 3.4);
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

  function updateDoses(dt) {
    if (G.deadT > 0) return;
    for (let i = doses.length - 1; i >= 0; i--) {
      const d = doses[i];
      const dp = hypot(d.x - G.px, d.y - G.py);
      const df = hypot(d.x - G.force.x, d.y - G.force.y);
      let ax = G.px;
      let ay = G.py;
      let dist = dp;
      if (df + 6 < dp) {
        ax = G.force.x;
        ay = G.force.y;
        dist = df;
      }
      d.vx += (ax - d.x) * 10 * dt;
      d.vy += (ay - d.y) * 10 * dt;
      d.vx *= 0.9;
      d.vy *= 0.9;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.t += dt;
      if (dist < 13 || d.t > 2.6) {
        addDose(d.amt);
        audio.dose();
        popSpark(d.x, d.y, MAG, 7);
        doses.splice(i, 1);
      }
    }
  }

  function updateMove(dt) {
    let mx = 0;
    let my = 0;
    if (inputSrc === 'ptr' && pointer.down) {
      const dx = pointer.x - G.px;
      const dy = pointer.y - G.py;
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
    G.px = clamp(G.px + mx, 24, 360);
    G.py = clamp(G.py + my, 18, VH - 18);
    const wx = G.cam + G.px;
    if (inSolid(wx, G.py, 7)) {
      if (G.invuln > 0) {
        const c = caveAt(wx);
        G.py = clamp(G.py, c.top + 14, c.bot - 14);
        if (inSolid(G.cam + G.px, G.py, 7)) {
          G.px = clamp(G.px - 8, 24, 360);
        }
      } else {
        diePlayer();
      }
    }
  }

  function updateForce(dt) {
    const f = G.force;
    if (f.fireCd > 0) f.fireCd -= dt;
    if (f.state === 'front' || f.state === 'back') {
      snapForce();
    } else {
      let tx;
      let ty;
      if (f.recall) {
        tx = G.px;
        ty = G.py;
      } else {
        tx = f.from === 'back' ? G.px - 108 : G.px + 128;
        ty = G.py;
      }
      if (f.grace > 0.08 && !f.recall) {
        f.vx *= 0.985;
        f.vy *= 0.92;
      } else {
        const pull = f.recall ? 9.5 : 2.4;
        f.vx += (tx - f.x) * pull * dt;
        f.vy += (ty - f.y) * (f.recall ? 8.2 : 3.2) * dt;
        f.vx *= f.recall ? 0.86 : 0.91;
        f.vy *= 0.88;
        f.vx = clamp(f.vx, -320, 380);
        f.vy = clamp(f.vy, -260, 260);
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
    if (G.deadT <= 0 && f.fireCd <= 0 && f.state !== 'fly') {
      f.fireCd = f.state === 'front' ? 0.28 : 0.18;
      fireForceShot();
    }
  }

  function updateCharge(dt) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    if (G.vulcCd > 0) G.vulcCd -= dt;
    if (G.fireHold) {
      const prev = chargeLevel();
      G.chargeT += dt;
      if (G.chargeT > CHG3 + 0.4) G.chargeT = CHG3 + 0.4;
      const lv = chargeLevel();
      if (lv > prev && lv >= 1) {
        audio.chargeTick(lv);
        const deltaReady = G.dose >= 1 && lv >= 2;
        screenFlash(deltaReady ? MAG : (lv === 3 ? GOLD : CYN), lv === 3 ? 0.28 : 0.14);
        kick(lv === 3 ? 3.2 : 1.8);
        if (lv === 3) hitStop(0.05);
        G.lastLv = lv;
      }
    }
  }

  function maybeSpawn() {
    if (G.boss || G.winT > 0) return;
    const local = G.cam - (G.stage - 1) * STAGE_LEN;
    const info = stageInfo();
    if (G.stage === 3 && local >= STAGE_LEN) {
      spawnBoss();
      return;
    }
    if (G.stage < 3 && local >= STAGE_LEN) {
      addScore(SCORE.clear);
      toast(info.name + '肃清', false, true);
      G.stage += 1;
      G.spawnI = 0;
      syncHud();
      return;
    }
    while (G.spawnI < info.waves.length && info.waves[G.spawnI].x <= local) {
      spawnWave(info.waves[G.spawnI]);
      G.spawnI += 1;
    }
  }

  function updateEnts(dt) {
    const fr = fireRate();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.fireCd > 0) e.fireCd -= dt * fr;
      if (e.type === 'dart') {
        e.x += (e.vx || -76) * dt;
        e.y = e.y0 + Math.sin(e.t * 2.7 + e.x * 0.01) * 28;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 40) {
          e.fireCd = 1.34;
          aimShot(e.x, e.y, 186, 0);
        }
      } else if (e.type === 'turret') {
        const c = caveAt(e.x);
        e.y = e.side < 0 ? c.top + 14 : c.bot - 14;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 20 && e.x - G.cam > 40) {
          e.fireCd = 1.14;
          aimShot(e.x, e.y, 206, rand(-0.08, 0.08));
        }
      } else if (e.type === 'wreck') {
        e.x += (e.vx || -42) * dt;
        e.y += Math.sin(e.t * 1.4) * 12 * dt;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 30) {
          e.fireCd = 1.5;
          for (let k = -1; k <= 1; k++) aimShot(e.x - 10, e.y, 170, k * 0.28);
        }
      } else if (e.type === 'mite') {
        e.x -= 114 * dt;
        e.y = e.y0 + Math.sin(e.t * 4.4 + e.phase) * 42;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 60) {
          e.fireCd = 1.7;
          enemyShot(e.x, e.y, -166, Math.sin(e.t) * 42, false);
        }
      } else if (e.type === 'cell') {
        e.x -= 58 * dt;
        e.spin += dt * 2.6;
        e.y += Math.sin(e.t * 1.8) * 18 * dt;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 40) {
          e.fireCd = 1.2;
          for (let k = 0; k < 3; k++) {
            const a = e.spin + k * (TAU / 3);
            enemyShot(e.x, e.y, Math.cos(a) * 152, Math.sin(a) * 152, false);
          }
        }
      } else if (e.type === 'shard') {
        e.x += (e.vx || -80) * dt;
        e.y += (e.vy || 0) * dt;
        const c = caveAt(e.x);
        if (e.y < c.top + 8 || e.y > c.bot - 8) e.vy *= -1;
      } else if (e.type === 'limb') {
        e.x += (e.vx || -36) * dt;
        const c = caveAt(e.x);
        e.y = e.side < 0 ? c.top + 18 : c.bot - 18;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 30) {
          e.fireCd = 1.4;
          for (let k = -1; k <= 1; k++) aimShot(e.x, e.y, 186, k * 0.22);
        }
      } else if (e.type === 'cyst') {
        e.x -= 64 * dt;
        e.open = 0.5 + Math.sin(e.t * 3.1) * 0.5;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 50) {
          e.fireCd = 1.24;
          aimShot(e.x, e.y, 208, 0);
        }
      } else if (e.type === 'guard') {
        e.x += (e.vx || -48) * dt;
        e.spin += dt * 1.9;
        e.y += Math.sin(e.t * 1.5) * 22 * dt;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 40) {
          e.fireCd = 1.3;
          aimShot(e.x, e.y, 196, 0);
          aimShot(e.x, e.y, 174, 0.24);
          aimShot(e.x, e.y, 174, -0.24);
        }
      } else if (e.type === 'boss') {
        e.x = G.cam + 572;
        e.y = VH * 0.5 + Math.sin(e.t * 0.68) * 48;
        e.open = 0.72 + Math.sin(e.t * (e.rage ? 5.6 : 2.7)) * 0.28;
        if (!e.rage && e.hp < e.maxHp * 0.5) {
          e.rage = true;
          toast('Δ核狂暴', true, false);
          audio.warn();
        }
        if (e.arms) {
          for (let k = 0; k < e.arms.length; k++) {
            const a = e.arms[k];
            a.ang += dt * (e.rage ? 1.35 : 0.92);
            const whip = 50 + Math.sin(e.t * (e.rage ? 3.4 : 2.1) + k) * (e.rage ? 18 : 12);
            a.len = whip;
            if (a.hp <= 0) {
              a.deadT -= dt;
              if (a.deadT <= 0) {
                a.hp = a.maxHp;
                const p = armPos(e, a);
                popSpark(p.x, p.y, MAG, 10);
              }
            }
          }
        }
        if (e.fireCd <= 0) {
          e.phase = (e.phase + 1) % (e.rage ? 4 : 3);
          e.fireCd = e.rage ? 0.5 : 0.8;
          const cx = e.x - 16;
          if (e.phase === 0) {
            aimShot(cx, e.y - 26, 210, 0);
            aimShot(cx, e.y + 26, 210, 0);
          } else if (e.phase === 1) {
            const n = e.rage ? 7 : 5;
            for (let k = 0; k < n; k++) {
              const a = Math.PI + (k - (n - 1) * 0.5) * 0.22;
              enemyShot(cx, e.y, Math.cos(a) * 184, Math.sin(a) * 184, false);
            }
          } else if (e.phase === 2) {
            enemyShot(cx, e.y, -232, 0, true);
            aimShot(cx, e.y, 166, 0);
            if (e.arms) {
              for (let k = 0; k < e.arms.length; k++) {
                const a = e.arms[k];
                if (a.hp <= 0) continue;
                const p = armPos(e, a);
                aimShot(G.cam + p.x, p.y, 158, 0);
              }
            }
          } else {
            for (let k = -2; k <= 2; k++) {
              enemyShot(cx, e.y, -214, k * 54, k === 0);
            }
          }
        }
      }
      if (e.type !== 'boss' && e.x - G.cam < -80) {
        e.alive = false;
        G.ents.splice(i, 1);
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.home) {
        const t = nearestEnemyScreen(s.x, s.y);
        if (t) {
          const spd = hypot(s.vx, s.vy) || 500;
          const a = Math.atan2(t.y - s.y, t.x - s.x);
          s.vx = lerp(s.vx, Math.cos(a) * spd, 0.085);
          s.vy = lerp(s.vy, Math.sin(a) * spd, 0.085);
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > VW + 90 || s.x < -70 || s.y < -40 || s.y > VH + 40) {
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
        if (hit.part === 'arm' && hit.arm) {
          hurtArm(e, hit.arm, s.dmg, hit.hx, hit.hy);
          s.pierce -= 1;
          if (s.pierce <= 0) {
            dead = true;
            break;
          }
          continue;
        }
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

    const f = G.force;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      if (f.state === 'fly' && s.blockable && G.deadT <= 0) {
        const sxv0 = s.x - G.cam;
        const d0 = hypot(sxv0 - f.x, s.y - f.y);
        if (d0 < 48) {
          const pull = 520 * dt;
          const nx = (f.x + G.cam - s.x) / (d0 || 1);
          const ny = (f.y - s.y) / (d0 || 1);
          s.vx += nx * pull * 6;
          s.vy += ny * pull * 6;
        }
      }
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
      if (G.deadT <= 0 && s.blockable && hypot(sxv - f.x, s.y - f.y) < 16 + s.r) {
        G.eShots.splice(i, 1);
        f.blockT = 0.12;
        if (f.state === 'fly') {
          f.suck = 0.16;
          addDose(0.04);
          audio.suck();
        } else {
          audio.block();
        }
        popSpark(f.x, f.y, f.state === 'fly' ? MAG : GOLD, 11);
        emit(4, {
          x: f.x, y: f.y, j: 3,
          vx0: -60, vx1: 60, vy0: -60, vy1: 60,
          r0: 1, r1: 2.4, life: 0.18, rgb: f.state === 'fly' ? MAG : GOLD, g: 0
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
      if (e.type === 'boss') {
        hits.push({ x: e.x - G.cam - 8, y: e.y, r: 22, core: true });
        if (e.arms) {
          for (let k = 0; k < e.arms.length; k++) {
            const a = e.arms[k];
            if (a.hp <= 0) continue;
            const p = armPos(e, a);
            hits.push({ x: p.x, y: p.y, r: a.r, arm: a });
          }
        }
      } else {
        hits.push({ x: e.x - G.cam, y: e.y, r: Math.max(e.w, e.h) * 0.55 });
      }
      for (let h = 0; h < hits.length; h++) {
        const p = hits[h];
        if (hypot(p.x - f.x, p.y - f.y) < 16 + p.r * 0.7) {
          if (f.ramT <= 0) {
            f.ramT = 0.1;
            if (p.arm) hurtArm(e, p.arm, isStorm() ? 2 : 1, f.x, f.y);
            else hurtEnt(e, isStorm() ? 2 : 1, f.x, f.y, true);
            audio.ram();
          }
        }
        if (G.invuln <= 0 && hypot(p.x - G.px, p.y - G.py) < 8 + p.r * 0.5) {
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
      updateDoses(dt);
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
    updateDoses(dt);
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
    if (chgWrap) chgWrap.classList.toggle('hot', chargeLevel() >= 3 || (chargeLevel() >= 2 && G.dose >= 1));
    syncDoseBar();
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

  function drawTerrain() {
    const c = ctx;
    const step = 10;
    const topPts = [];
    const botPts = [];
    for (let x = -20; x <= VW + 24; x += step) {
      const cv = caveAt(G.cam + x);
      topPts.push(x, cv.top);
      botPts.push(x, cv.bot);
    }
    const st = stageAt(G.cam + VW * 0.5);
    c.fillStyle = st === 2 ? '#1a1014' : st === 3 ? '#081418' : '#0a1820';
    c.beginPath();
    c.moveTo(sx(-20), sy(-4));
    for (let i = 0; i < topPts.length; i += 2) c.lineTo(sx(topPts[i]), sy(topPts[i + 1]));
    c.lineTo(sx(VW + 24), sy(-4));
    c.closePath();
    c.fill();
    c.fillStyle = st === 2 ? '#140c10' : '#061014';
    c.beginPath();
    c.moveTo(sx(-20), sy(VH + 4));
    for (let i = 0; i < botPts.length; i += 2) c.lineTo(sx(botPts[i]), sy(botPts[i + 1]));
    c.lineTo(sx(VW + 24), sy(VH + 4));
    c.closePath();
    c.fill();

    c.strokeStyle = rgba(st === 2 ? MAG : st === 3 ? GOLD : CYN, 0.55);
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

    if (st === 1) {
      for (let x = 0; x < VW; x += 82) {
        const wx = G.cam + x;
        const i = Math.round(wx / 82);
        if (hash2(i + 5) <= 0.54) continue;
        const cv = caveAt(i * 82);
        const h = 18 + hash2(i + 13) * 54;
        const px = i * 82 - G.cam;
        c.fillStyle = rgba(STEEL, 0.4);
        if (hash2(i + 9) > 0.5) {
          c.beginPath();
          c.moveTo(sx(px - 7), sy(cv.top));
          c.lineTo(sx(px + 7), sy(cv.top));
          c.lineTo(sx(px + 3), sy(cv.top + h * 0.5));
          c.lineTo(sx(px - 3), sy(cv.top + h * 0.5));
          c.closePath();
          c.fill();
          c.fillStyle = rgba(FLESH, 0.32);
          c.fillRect(sx(px - 1.5), sy(cv.top), 3 * scale, h * 0.42 * scale);
        } else {
          c.beginPath();
          c.moveTo(sx(px - 7), sy(cv.bot));
          c.lineTo(sx(px + 7), sy(cv.bot));
          c.lineTo(sx(px + 3), sy(cv.bot - h * 0.5));
          c.lineTo(sx(px - 3), sy(cv.bot - h * 0.5));
          c.closePath();
          c.fill();
          c.fillStyle = rgba(FLESH, 0.32);
          c.fillRect(sx(px - 1.5), sy(cv.bot - h * 0.42), 3 * scale, h * 0.42 * scale);
        }
      }
    } else if (st === 2) {
      c.fillStyle = rgba(MAG, 0.32);
      for (let x = 0; x < VW; x += 50) {
        const wx = G.cam + x;
        const i = Math.round(wx / 50);
        if (hash2(i + 29) <= 0.58) continue;
        const cv = caveAt(i * 50);
        const spike = 22 + hash2(i) * 34;
        const px = i * 50 - G.cam;
        c.beginPath();
        if (hash2(i + 6) > 0.5) {
          c.moveTo(sx(px), sy(cv.top));
          c.lineTo(sx(px + 8), sy(cv.top + spike));
          c.lineTo(sx(px - 8), sy(cv.top + spike));
        } else {
          c.moveTo(sx(px), sy(cv.bot));
          c.lineTo(sx(px + 8), sy(cv.bot - spike));
          c.lineTo(sx(px - 8), sy(cv.bot - spike));
        }
        c.closePath();
        c.fill();
      }
    } else {
      c.fillStyle = rgba(STEEL, 0.42);
      for (let x = 0; x < VW; x += 90) {
        const wx = G.cam + x;
        const i = Math.floor(wx / 90);
        const cv = caveAt(i * 90);
        const px = i * 90 - G.cam;
        c.fillRect(sx(px - 18), sy(cv.top), 36 * scale, 8 * scale);
        c.fillRect(sx(px - 18), sy(cv.bot - 8), 36 * scale, 8 * scale);
        c.fillStyle = rgba(MAG, 0.24);
        c.fillRect(sx(px - 2), sy(cv.top + 8), 4 * scale, 10 * scale);
        c.fillStyle = rgba(STEEL, 0.42);
      }
    }
  }

  function drawDart(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(PNK, 0.95);
    c.beginPath();
    c.moveTo(10 * scale, 0);
    c.lineTo(-8 * scale, -6 * scale);
    c.lineTo(-3 * scale, 0);
    c.lineTo(-8 * scale, 6 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.9);
    c.fillRect(-2 * scale, -2 * scale, 7 * scale, 4 * scale);
    c.fillStyle = rgba(MAG, 0.85);
    c.beginPath();
    c.arc(-1 * scale, 0, 1.6 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawTurret(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(FLESH, 0.95);
    c.beginPath();
    c.ellipse(0, 0, 10 * scale, 8 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(STEEL, 0.9);
    c.fillRect(-6 * scale, -6 * scale, 12 * scale, 12 * scale);
    c.fillStyle = rgba(HOT, 0.9);
    c.beginPath();
    c.arc(0, 0, 4.4 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.7);
    c.fillRect(0, -2 * scale, 10 * scale, 4 * scale);
    c.restore();
  }

  function drawWreck(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(STEEL, 0.95);
    c.fillRect(-19 * scale, -10 * scale, 38 * scale, 20 * scale);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(-8 * scale, -5 * scale, 14 * scale, 10 * scale);
    c.fillStyle = rgba(MAG, 0.85);
    c.fillRect(10 * scale, -3 * scale, 10 * scale, 6 * scale);
    c.fillStyle = rgba(FLESH, 0.55);
    c.fillRect(-21 * scale, -2 * scale, 6 * scale, 4 * scale);
    c.restore();
  }

  function drawMite(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    const beat = 1 + Math.sin(e.t * 8 + (e.phase || 0)) * 0.12;
    c.fillStyle = rgba(MAG, 0.92);
    c.beginPath();
    c.ellipse(0, 0, 7 * scale * beat, 5 * scale * beat, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.8);
    c.beginPath();
    c.arc(-1 * scale, 0, 1.6 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawCell(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.rotate(e.spin || 0);
    c.fillStyle = rgba(MAG, 0.88);
    c.beginPath();
    c.moveTo(0, -12 * scale);
    c.lineTo(11 * scale, 7 * scale);
    c.lineTo(-11 * scale, 7 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.75);
    c.beginPath();
    c.moveTo(0, -5 * scale);
    c.lineTo(4 * scale, 3 * scale);
    c.lineTo(-4 * scale, 3 * scale);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawShard(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(HOT, 0.95);
    c.beginPath();
    c.moveTo(0, -6 * scale);
    c.lineTo(5 * scale, 3 * scale);
    c.lineTo(-5 * scale, 3 * scale);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawLimb(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    if (e.side < 0) c.scale(1, -1);
    c.fillStyle = rgba(FLESH, 0.95);
    c.fillRect(-14 * scale, -8 * scale, 28 * scale, 16 * scale);
    c.fillStyle = rgba(HOT, 0.9);
    c.fillRect(-4 * scale, -4 * scale, 12 * scale, 8 * scale);
    const leg = Math.sin(e.t * 8) * 4;
    c.strokeStyle = rgba(MAG, 0.85);
    c.lineWidth = Math.max(1, 1.8 * scale);
    c.beginPath();
    c.moveTo(-10 * scale, 8 * scale);
    c.lineTo((-10 + leg) * scale, 16 * scale);
    c.moveTo(8 * scale, 8 * scale);
    c.lineTo((8 - leg) * scale, 16 * scale);
    c.stroke();
    c.restore();
  }

  function drawCyst(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    const o = 0.55 + (e.open || 0) * 0.45;
    c.fillStyle = rgba(MAG, 0.5);
    c.beginPath();
    c.arc(0, 0, 10 * scale * o, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(FLESH, 0.9);
    c.lineWidth = Math.max(1.2, 1.8 * scale);
    c.beginPath();
    c.arc(0, 0, 9 * scale, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(GOLD, 0.9 * o);
    c.beginPath();
    c.arc(0, 0, 3.6 * scale * o, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawGuard(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.rotate(e.spin || 0);
    c.strokeStyle = rgba(MAG, 0.95);
    c.lineWidth = Math.max(1.4, 2 * scale);
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = i * TAU / 3 - Math.PI / 2;
      const px = Math.cos(a) * 13 * scale;
      const py = Math.sin(a) * 13 * scale;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();
    c.fillStyle = rgba(CYN, 0.85);
    c.beginPath();
    c.arc(0, 0, 4 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawBoss(e) {
    const c = ctx;
    const x = e.x - G.cam;
    const y = e.y;
    if (e.arms) {
      for (let i = 0; i < e.arms.length; i++) {
        const a = e.arms[i];
        const p = armPos(e, a);
        c.strokeStyle = rgba(MAG, a.hp > 0 ? 0.7 : 0.18);
        c.lineWidth = Math.max(1.6, 3.2 * scale);
        c.beginPath();
        c.moveTo(sx(x - 6), sy(y));
        c.quadraticCurveTo(
          sx(x - 6 + Math.cos(a.ang) * a.len * 0.45),
          sy(y + Math.sin(a.ang) * a.len * 0.45 + Math.sin(e.t * 4 + i) * 8),
          sx(p.x),
          sy(p.y)
        );
        c.stroke();
        c.fillStyle = rgba(a.hp > 0 ? MAG : STEEL, a.hp > 0 ? 0.95 : 0.35);
        c.beginPath();
        c.arc(sx(p.x), sy(p.y), a.r * scale, 0, TAU);
        c.fill();
        if (a.hp > 0) {
          c.fillStyle = rgba(GOLD, 0.8);
          c.beginPath();
          c.arc(sx(p.x), sy(p.y), 3.4 * scale, 0, TAU);
          c.fill();
        }
      }
    }
    c.save();
    c.translate(sx(x), sy(y));
    const beat = (e.open || 1) * (1 + Math.sin(e.t * (e.rage ? 8 : 4)) * 0.06);
    c.fillStyle = rgba(STEEL, 0.92);
    c.beginPath();
    c.ellipse(0, 0, 40 * scale, 34 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.92);
    c.beginPath();
    c.moveTo(-22 * scale, 16 * scale);
    c.lineTo(8 * scale, -28 * scale);
    c.lineTo(18 * scale, 16 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(e.rage ? MAG : GOLD, 0.95);
    c.beginPath();
    c.arc(-6 * scale, 2 * scale, 13 * scale * beat, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.85);
    c.beginPath();
    c.arc(-6 * scale, 2 * scale, 5.4 * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(CYN, 0.55);
    c.lineWidth = Math.max(1, 1.5 * scale);
    c.beginPath();
    c.moveTo(-4 * scale, -22 * scale);
    c.lineTo(16 * scale, 14 * scale);
    c.lineTo(-24 * scale, 14 * scale);
    c.closePath();
    c.stroke();
    c.restore();

    const pct = clamp(e.hp / e.maxHp, 0, 1);
    const bw = 180;
    const bh = 7;
    const bx = VW * 0.5 - bw * 0.5;
    const by = 14;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(sx(bx - 2), sy(by - 2), (bw + 4) * scale, (bh + 4) * scale);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(sx(bx), sy(by), bw * scale, bh * scale);
    c.fillStyle = rgba(pct < 0.5 ? MAG : GOLD, 0.95);
    c.fillRect(sx(bx), sy(by), bw * pct * scale, bh * scale);
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const c = ctx;
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink) return;
    c.save();
    c.translate(sx(G.px), sy(G.py));
    c.fillStyle = rgba(CYN, 0.32);
    c.beginPath();
    c.ellipse(-10 * scale, 0, 16 * scale, 7 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(HOT, 0.95);
    c.beginPath();
    c.moveTo(-16 * scale, -7 * scale);
    c.lineTo(-6 * scale, 0);
    c.lineTo(-16 * scale, 7 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.96);
    c.beginPath();
    c.moveTo(-8 * scale, -8 * scale);
    c.lineTo(18 * scale, 0);
    c.lineTo(-8 * scale, 8 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.95);
    c.fillRect(-2 * scale, -3.2 * scale, 12 * scale, 6.4 * scale);
    c.fillStyle = rgba(DEEP, 0.85);
    c.fillRect(2 * scale, -1.6 * scale, 6 * scale, 3.2 * scale);
    c.fillStyle = rgba(MAG, 0.85);
    c.beginPath();
    c.moveTo(-8 * scale, -3 * scale);
    c.lineTo(-2 * scale, 0);
    c.lineTo(-8 * scale, 3 * scale);
    c.closePath();
    c.fill();
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle / 0.12);
      c.fillRect(16 * scale, -2 * scale, 10 * scale, 4 * scale);
    }
    const lv = chargeLevel();
    if (lv >= 1) {
      const rad = 4 + lv * 5 + Math.sin(G.t * 14) * 1.2;
      const col = G.dose >= 1 && lv >= 2 ? MAG : (lv >= 3 ? GOLD : lv >= 2 ? HOT : CYN);
      c.fillStyle = rgba(col, 0.55);
      c.beginPath();
      c.arc(18 * scale, 0, rad * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(lv >= 2 && G.dose >= 1 ? GOLD : WHT, 0.7);
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.beginPath();
      c.arc(18 * scale, 0, (rad + 3) * scale, 0, TAU);
      c.stroke();
      if (G.dose >= 1 && lv >= 2) {
        c.strokeStyle = rgba(MAG, 0.7);
        c.beginPath();
        c.moveTo(18 * scale, (-rad - 6) * scale);
        c.lineTo((18 + rad) * scale, (rad * 0.6) * scale);
        c.lineTo((18 - rad) * scale, (rad * 0.6) * scale);
        c.closePath();
        c.stroke();
      }
    }
    c.restore();
  }

  function drawForce() {
    if (G.deadT > 0 && G.force.state !== 'fly') return;
    const f = G.force;
    const c = ctx;
    c.save();
    c.translate(sx(f.x), sy(f.y));
    c.rotate(f.spin * 0.28);
    const glow = f.blockT > 0 || f.suck > 0 ? 1 : 0.74;
    const col = f.state === 'fly' ? MAG : f.state === 'back' ? TEAL : CYN;
    if (f.state === 'fly') {
      c.strokeStyle = rgba(MAG, 0.22 + (f.suck > 0 ? 0.35 : 0));
      c.lineWidth = Math.max(1, 1.4 * scale);
      c.beginPath();
      c.arc(0, 0, 46 * scale, 0, TAU);
      c.stroke();
    }
    c.strokeStyle = rgba(col, 0.55 + (f.blockT > 0 ? 0.4 : 0));
    c.lineWidth = Math.max(1, 1.5 * scale);
    c.beginPath();
    c.ellipse(0, 0, 16 * scale, 8 * scale, 0, 0, TAU);
    c.stroke();
    c.beginPath();
    c.ellipse(0, 0, 8 * scale, 14 * scale, 0, 0, TAU);
    c.stroke();
    for (let k = 0; k < 3; k++) {
      const a = f.spin + k * (TAU / 3);
      c.fillStyle = rgba(MAG, 0.8);
      c.beginPath();
      c.moveTo(Math.cos(a) * 6 * scale, Math.sin(a) * 6 * scale);
      c.lineTo(Math.cos(a) * 18 * scale + Math.cos(a + 1.2) * 4 * scale, Math.sin(a) * 18 * scale + Math.sin(a + 1.2) * 4 * scale);
      c.lineTo(Math.cos(a) * 18 * scale + Math.cos(a - 1.2) * 4 * scale, Math.sin(a) * 18 * scale + Math.sin(a - 1.2) * 4 * scale);
      c.closePath();
      c.fill();
    }
    c.fillStyle = rgba(CYN, glow);
    c.beginPath();
    c.ellipse(0, 0, 11 * scale, 6.5 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(f.blockT > 0 || G.dose >= 1 ? GOLD : WHT, 0.95);
    c.beginPath();
    c.arc(0, 0, 3.6 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.type === 'beam') {
        const a = clamp(s.life / 0.74, 0, 1);
        const ang = Math.atan2(s.vy, s.vx);
        c.save();
        c.translate(sx(s.x), sy(s.y));
        c.rotate(ang);
        c.fillStyle = rgba(s.rgb, 0.35 * a);
        c.fillRect(-s.w * 0.2 * scale, -s.h * 0.7 * scale, s.w * 1.4 * scale, s.h * 1.4 * scale);
        c.fillStyle = rgba(s.rgb, 0.9 * a);
        c.fillRect(-s.w * 0.5 * scale, -s.h * 0.5 * scale, s.w * scale, s.h * scale);
        c.fillStyle = rgba(WHT, 0.8 * a);
        c.fillRect(-s.w * 0.5 * scale, -s.h * 0.18 * scale, s.w * scale, s.h * 0.36 * scale);
        if (!REDUCE) {
          for (let k = 0; k < 3; k++) {
            const oy2 = Math.sin(G.t * 24 + k + s.x * 0.05) * s.h * 0.35;
            c.fillStyle = rgba(WHT, 0.35 * a);
            c.fillRect(-s.w * 0.4 * scale, oy2 * scale, s.w * 0.8 * scale, 1.4 * scale);
          }
        }
        if (s.delta) {
          c.strokeStyle = rgba(GOLD, 0.55 * a);
          c.beginPath();
          c.moveTo(s.w * 0.2 * scale, -s.h * 0.7 * scale);
          c.lineTo(s.w * 0.55 * scale, 0);
          c.lineTo(s.w * 0.2 * scale, s.h * 0.7 * scale);
          c.stroke();
        }
        c.restore();
      } else if (s.type === 'pulse') {
        c.fillStyle = rgba(TEAL, 0.35);
        c.beginPath();
        c.arc(sx(s.x), sy(s.y), 7 * scale, 0, TAU);
        c.fill();
        c.fillStyle = rgba(CYN, 0.95);
        c.beginPath();
        c.arc(sx(s.x), sy(s.y), 3.4 * scale, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.85);
        c.beginPath();
        c.arc(sx(s.x), sy(s.y), 1.4 * scale, 0, TAU);
        c.fill();
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

  function drawDoses() {
    const c = ctx;
    for (let i = 0; i < doses.length; i++) {
      const d = doses[i];
      const pulse = 1 + Math.sin(G.t * 10 + d.t * 6) * 0.18;
      c.fillStyle = rgba(MAG, 0.35);
      c.beginPath();
      c.arc(sx(d.x), sy(d.y), 7 * pulse * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(sx(d.x), sy(d.y), 2.4 * pulse * scale, 0, TAU);
      c.fill();
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
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#04181e';
    c.fillRect(0, 0, W, H);

    c.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake;
      shy = (Math.random() - 0.5) * G.shake * 0.7;
    }
    const punch = REDUCE ? 1 : G.punch;
    c.translate(W * 0.5 + shx, H * 0.5 + shy);
    c.scale(punch, punch);
    c.translate(-W * 0.5, -H * 0.5);

    const g = c.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    g.addColorStop(0, '#061c24');
    g.addColorStop(1, '#04181e');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawTerrain();

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = (e.x || 0) - G.cam;
      if (e.type !== 'boss' && (x < -50 || x > VW + 50)) continue;
      if (e.type === 'dart') drawDart(e);
      else if (e.type === 'turret') drawTurret(e);
      else if (e.type === 'wreck') drawWreck(e);
      else if (e.type === 'mite') drawMite(e);
      else if (e.type === 'cell') drawCell(e);
      else if (e.type === 'shard') drawShard(e);
      else if (e.type === 'limb') drawLimb(e);
      else if (e.type === 'cyst') drawCyst(e);
      else if (e.type === 'guard') drawGuard(e);
      else if (e.type === 'boss') drawBoss(e);
    }

    if (G.force.state === 'back') drawForce();
    drawShip();
    if (G.force.state !== 'back') drawForce();
    drawShots();
    drawDoses();
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
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'Left' || k === 'Right' || k === 'Up' || k === 'Down';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const zKey = code === 'KeyZ' || k === 'z' || k === 'Z';
    const forceKey = code === 'KeyX' || k === 'x' || k === 'X';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    if (space) keys.space = down;
    if (zKey) keys.z = down;
    if (forceKey) {
      if (down && !keys.force) launchForce();
      keys.force = down;
    }

    if (down && (isMove || space || zKey || forceKey || k === 'Enter')) e.preventDefault();
    if (!down) {
      if ((space || zKey) && G.fireHold && !shootHeld()) {
        G.fireHold = false;
        releaseCharge();
      }
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R')) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'storm' : 'raid');
      return;
    }
    if (space || zKey || k === 'Enter') {
      if (overlayOpen()) {
        if (k === 'Enter' || space || zKey) primaryAction();
        if ((space || zKey) && G.mode === 'play' && !G.fireHold) G.fireHold = true;
        return;
      }
      if (G.mode === 'play' && (space || zKey)) {
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
    if (btnForce) {
      const forceDown = function (e) {
        e.preventDefault();
        audio.ensure();
        btnForce.classList.add('held');
        launchForce();
      };
      const forceUp = function () { btnForce.classList.remove('held'); };
      btnForce.addEventListener('pointerdown', forceDown);
      btnForce.addEventListener('pointerup', forceUp);
      btnForce.addEventListener('pointerleave', forceUp);
    }
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
    if (acc > STEP * 4) acc = 0;
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
      keys.space = false;
      keys.z = false;
      keys.force = false;
      pointer.down = false;
      G.fireHold = false;
    }
  });
  requestAnimationFrame(frame);
})();
