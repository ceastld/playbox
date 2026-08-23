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
  const STAGE_LEN = 1520;
  const TAP = 0.08;
  const CHG1 = 0.38;
  const CHG2 = 0.82;
  const CHG3 = 1.36;
  const BEST_KEY = 'playbox-r-type3-best';
  const MUTE_KEY = 'playbox-r-type3-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击（按住蓄力）· Shift / Z 力荚 · R 重开 · M 静音';
  const LEAD = '力荚横射。空格蓄力放超波，Shift 把力荚打出去，比特贴舰抄射。短关之后打武核。别当成武装、武装2 或武装狮——这是力荚加比特，不是力爪格挡，不是满波打核，不是扇弹激光。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const LIME = [212, 255, 58];
  const GOLD = [255, 233, 74];
  const HOT = [200, 224, 32];
  const TEAL = [126, 224, 74];
  const CYN = [0, 240, 200];
  const VIO = [184, 120, 255];
  const MAG = [255, 90, 122];
  const WHT = [244, 248, 222];
  const DEEP = [26, 30, 12];
  const STEEL = [72, 88, 40];
  const PNK = [255, 170, 140];

  const SCORE = {
    bolt: 50,
    mast: 80,
    hull: 150,
    frost: 70,
    crystal: 120,
    splinter: 30,
    crawler: 180,
    spore: 90,
    sentinel: 110,
    orb: 80,
    boss: 9000,
    clear: 1600,
    all: 4500
  };

  const STAGES = [
    {
      name: '雷廊',
      boss: '武核',
      seed: 1,
      waves: [
        { x: 40, kind: 'bolts', n: 5, y: 0.4 },
        { x: 180, kind: 'mast', side: -1 },
        { x: 260, kind: 'bolts', n: 6, y: 0.58 },
        { x: 380, kind: 'hull' },
        { x: 500, kind: 'mast', side: 1 },
        { x: 580, kind: 'bolts', n: 5, y: 0.32 },
        { x: 700, kind: 'mast', side: -1 },
        { x: 740, kind: 'mast', side: 1 },
        { x: 860, kind: 'hull' },
        { x: 980, kind: 'bolts', n: 7, y: 0.5 },
        { x: 1100, kind: 'bolts', n: 4, y: 0.26 },
        { x: 1140, kind: 'bolts', n: 4, y: 0.74 },
        { x: 1280, kind: 'hull' },
        { x: 1400, kind: 'mast', side: -1 }
      ]
    },
    {
      name: '霜骸',
      boss: '武核',
      seed: 2,
      waves: [
        { x: 30, kind: 'frost', n: 6 },
        { x: 140, kind: 'crystal' },
        { x: 240, kind: 'bolts', n: 5, y: 0.45 },
        { x: 340, kind: 'mast', side: -1 },
        { x: 420, kind: 'frost', n: 7 },
        { x: 540, kind: 'crystal' },
        { x: 640, kind: 'crawler' },
        { x: 760, kind: 'crystal' },
        { x: 860, kind: 'frost', n: 8 },
        { x: 980, kind: 'mast', side: 1 },
        { x: 1060, kind: 'bolts', n: 6, y: 0.34 },
        { x: 1180, kind: 'crystal' },
        { x: 1280, kind: 'frost', n: 7 },
        { x: 1400, kind: 'crawler' }
      ]
    },
    {
      name: '核门',
      boss: '武核',
      seed: 3,
      bossHp: 118,
      waves: [
        { x: 20, kind: 'spores', n: 4 },
        { x: 140, kind: 'sentinel' },
        { x: 240, kind: 'bolts', n: 6, y: 0.4 },
        { x: 340, kind: 'mast', side: -1 },
        { x: 380, kind: 'mast', side: 1 },
        { x: 500, kind: 'spores', n: 5 },
        { x: 620, kind: 'sentinel' },
        { x: 740, kind: 'crawler' },
        { x: 860, kind: 'spores', n: 5 },
        { x: 980, kind: 'sentinel' },
        { x: 1100, kind: 'mast', side: -1 },
        { x: 1140, kind: 'mast', side: 1 },
        { x: 1260, kind: 'sentinel' },
        { x: 1380, kind: 'bolts', n: 6, y: 0.5 }
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
  const bitLabel = document.getElementById('bit-label');
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
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false, sht: false, force: false };
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
    spawnI: 0,
    fireHold: false,
    chargeT: 0,
    lastLv: 0,
    vulcCd: 0,
    bitCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: LIME,
    punch: 1,
    muzzle: 0,
    boss: false,
    winT: 0,
    force: {
      state: 'front',
      x: 122,
      y: VH * 0.5,
      vx: 0,
      vy: 0,
      spin: 0,
      fireCd: 0,
      ramT: 0,
      blockT: 0,
      grace: 0,
      recall: false,
      from: 'front'
    },
    bits: [
      { x: 96, y: VH * 0.5 - 20, blockT: 0 },
      { x: 96, y: VH * 0.5 + 20, blockT: 0 }
    ],
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
    return isStorm() ? 308 : 268;
  }
  function scrollSpd() {
    if (G.boss) return isStorm() ? 18 : 11;
    return isStorm() ? 148 : 100;
  }
  function chargeLevel() {
    if (G.chargeT >= CHG3) return 3;
    if (G.chargeT >= CHG2) return 2;
    if (G.chargeT >= CHG1) return 1;
    return 0;
  }
  function fireRate() {
    return isStorm() ? 1.26 : 1;
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
      const n = fbm(wx * 0.01, 2);
      top = 24 + n * 18;
      bot = VH - 24 - fbm(wx * 0.01, 6) * 18;
      const i = Math.round(wx / 78);
      const h = 20 + hash2(i + 13) * 58;
      if (hash2(i + 5) > 0.56) {
        if (hash2(i + 9) > 0.5) top += h * 0.5;
        else bot -= h * 0.5;
      }
    } else if (st === 2) {
      top = 40 + fbm(wx * 0.015, 4) * 46 + Math.sin(wx * 0.021) * 9;
      bot = VH - 40 - fbm(wx * 0.015, 10) * 46 - Math.cos(wx * 0.019) * 9;
      const i = Math.round(wx / 54);
      const spike = hash2(i + 23) > 0.6 ? 20 + hash2(i) * 30 : 0;
      if (spike) {
        if (hash2(i + 6) > 0.5) top += spike;
        else bot -= spike;
      }
    } else {
      const step = (Math.floor(wx / 88) % 3) * 15;
      top = 34 + step + fbm(wx * 0.012, 7) * 8;
      bot = VH - 34 - ((Math.floor(wx / 88 + 1) % 3) * 13);
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
      this.beep(980, 0.046, 'square', 0.03, 1960);
    },
    bit() {
      this.ensure();
      this.beep(1480, 0.04, 'triangle', 0.022, 720);
    },
    cyclone() {
      this.ensure();
      this.beep(420, 0.07, 'sawtooth', 0.03, 880);
      this.beep(880, 0.05, 'triangle', 0.02, 240);
    },
    chargeTick(lv) {
      this.ensure();
      const f = 250 + lv * 210;
      this.beep(f, 0.075, lv >= 3 ? 'triangle' : 'sine', 0.034, f * 1.6);
    },
    beam(lv) {
      this.ensure();
      this.noise(0.12 + lv * 0.05, 0.06, 220);
      this.beep(150 + lv * 40, 0.22, 'sawtooth', 0.056, 58);
      this.beep(520 + lv * 110, 0.15, 'square', 0.042, 140);
      if (lv >= 3) this.beep(1320, 0.18, 'triangle', 0.04, 2200);
    },
    launch() {
      this.ensure();
      this.beep(280, 0.12, 'sawtooth', 0.048, 820);
      this.beep(1040, 0.12, 'triangle', 0.03, 260);
      this.noise(0.08, 0.036, 480);
    },
    recall() {
      this.ensure();
      this.beep(760, 0.08, 'square', 0.034, 220);
      this.beep(380, 0.1, 'sine', 0.028, 140);
    },
    dock() {
      this.ensure();
      this.beep(680, 0.06, 'square', 0.04, 230);
      this.beep(340, 0.1, 'triangle', 0.034, 140);
    },
    block() {
      this.ensure();
      this.beep(1360, 0.038, 'square', 0.032, 420);
      this.noise(0.03, 0.018, 1600);
    },
    ram() {
      this.ensure();
      this.noise(0.05, 0.04, 360);
      this.beep(200, 0.08, 'sawtooth', 0.04, 80);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 180 : kind === 'crystal' ? 540 : 490;
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
      this.beep(260, 0.22, 'sawtooth', 0.052, 55);
      this.beep(120, 0.34, 'sine', 0.045, 36);
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const info = stageInfo();
      stageLabel.textContent = G.boss ? info.boss : info.name;
      stageLabel.classList.toggle('hot', G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isStorm() ? '武核' : '武装三';
      tagLabel.className = isStorm() ? 'warn' : '';
    }
    if (forceLabel) {
      const st = G.force.state;
      forceLabel.textContent = st === 'back' ? '后荚' : st === 'fly' ? (G.force.recall ? '回收' : '游离') : '前荚';
      forceLabel.className = 'form ' + (st === 'back' ? 'back' : st === 'fly' ? 'fly' : 'front');
    }
    if (bitLabel) bitLabel.textContent = '双比特';
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
    else if (G.mode === 'lose') setHint('R 重开 · 力荚挡弹，蓄满超波打核', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 武核已崩', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 力荚挡弹，空格蓄满超波', 'warn');
    else if (G.force.state === 'fly' && G.force.recall) setHint('力荚回收中 · 对接后继续出击', '');
    else if (G.force.state === 'fly') setHint('力荚游离旋射 · 再按 Shift 收回', '');
    else if (G.force.state === 'back') setHint('后荚向后打 · 比特仍向前 · Shift 出击', '');
    else setHint('前荚探射 · 比特贴舰 · 空格蓄超波', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'RT3';
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

  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function popForm() {
    if (!forceLabel) return;
    forceLabel.classList.remove('pop');
    void forceLabel.offsetWidth;
    forceLabel.classList.add('pop');
    formTok += 1;
  }

  function snapBits() {
    const bob = Math.sin(G.t * 5.4) * 2.4;
    G.bits[0].x = G.px + 6;
    G.bits[0].y = G.py - 20 + bob;
    G.bits[1].x = G.px + 6;
    G.bits[1].y = G.py + 20 - bob;
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

  function dockForce(side) {
    G.force.state = side;
    G.force.vx = 0;
    G.force.vy = 0;
    G.force.recall = false;
    G.force.from = side;
    snapForce();
    audio.dock();
    popSpark(G.force.x, G.force.y, GOLD, 16);
    floatText(G.force.x, G.force.y - 18, side === 'back' ? '后荚' : '前荚', GOLD, true);
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
        floatText(f.x, f.y - 16, '回收', VIO, false);
        popForm();
        syncHud();
      }
      return;
    }
    f.from = f.state === 'back' ? 'back' : 'front';
    f.state = 'fly';
    f.recall = false;
    f.vx = f.from === 'back' ? -500 : 520;
    f.vy = 0;
    f.grace = 0.26;
    audio.launch();
    emit(12, {
      x: f.x, y: f.y, j: 4,
      vx0: -90, vx1: 90, vy0: -80, vy1: 80,
      r0: 1.4, r1: 3.4, life: 0.3, rgb: VIO, g: 30
    });
    popSpark(f.x, f.y, LIME, 15);
    floatText(f.x, f.y - 16, '出击', LIME, true);
    hitStop(0.036);
    kick(2.5);
    screenFlash(VIO, 0.16);
    popForm();
    syncHud();
  }

  function fireVulcan() {
    if (G.vulcCd > 0) return;
    G.vulcCd = isStorm() ? 0.086 : 0.1;
    G.shots.push({
      type: 'vulc',
      x: G.px + 16,
      y: G.py,
      vx: 650,
      vy: 0,
      w: 11,
      h: 3.2,
      dmg: 1,
      pierce: 1,
      life: 1.15,
      rgb: LIME
    });
    G.muzzle = 0.06;
    audio.shoot();
    emit(3, {
      x: G.px + 18, y: G.py, j: 2,
      vx0: 40, vx1: 110, vy0: -30, vy1: 30,
      r0: 1, r1: 2.2, life: 0.12, rgb: HOT, g: 0
    });
  }

  function fireBitShots() {
    if (G.bitCd > 0 || G.deadT > 0) return;
    G.bitCd = isStorm() ? 0.11 : 0.13;
    for (let i = 0; i < G.bits.length; i++) {
      const b = G.bits[i];
      G.shots.push({
        type: 'bit',
        x: b.x + 8,
        y: b.y,
        vx: 580,
        vy: 0,
        w: 8,
        h: 2.6,
        dmg: 1,
        pierce: 1,
        life: 1.05,
        rgb: VIO
      });
    }
    audio.bit();
  }

  function fireBeam(lv) {
    const h = lv === 3 ? 46 : lv === 2 ? 22 : 10;
    const dmg = lv === 3 ? 26 : lv === 2 ? 12 : 4;
    const pierce = lv === 3 ? 99 : lv === 2 ? 3 : 1;
    G.shots.push({
      type: 'beam',
      x: G.px + 28,
      y: G.py,
      vx: 530,
      vy: 0,
      w: 48 + lv * 10,
      h: h,
      dmg: dmg,
      pierce: pierce,
      life: 0.74,
      rgb: lv >= 3 ? GOLD : lv >= 2 ? HOT : LIME,
      lv: lv,
      hit: {}
    });
    if (lv >= 3) {
      for (let i = 0; i < G.bits.length; i++) {
        const b = G.bits[i];
        G.shots.push({
          type: 'beam',
          x: b.x + 12,
          y: b.y,
          vx: 560,
          vy: 0,
          w: 34,
          h: 8,
          dmg: 6,
          pierce: 99,
          life: 0.62,
          rgb: VIO,
          lv: 3,
          hit: {}
        });
      }
      if (bitLabel) {
        bitLabel.classList.remove('pop');
        void bitLabel.offsetWidth;
        bitLabel.classList.add('pop');
      }
    }
    G.muzzle = 0.12;
    audio.beam(lv);
    hitStop(lv === 3 ? 0.072 : 0.048);
    kick(lv === 3 ? 4.0 : 2.6);
    screenFlash(lv >= 3 ? GOLD : LIME, lv === 3 ? 0.34 : 0.16);
    if (lv >= 3) floatText(G.px + 40, G.py - 22, 'HYPER', GOLD, true);
    emit(10 + lv * 4, {
      x: G.px + 24, y: G.py, j: 8,
      vx0: 80, vx1: 280, vy0: -80, vy1: 80,
      r0: 1.4, r1: 3.6, life: 0.28, rgb: lv >= 3 ? GOLD : LIME, g: 40
    });
  }

  function fireForcePellet(x, y, vx, vy) {
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
      rgb: CYN
    });
  }

  function fireProbe(x, y, vx, vy) {
    G.shots.push({
      type: 'probe',
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      w: 14,
      h: 3.2,
      dmg: 2,
      pierce: 1,
      life: 1.05,
      rgb: TEAL
    });
  }

  function fireForceShot() {
    const f = G.force;
    if (f.state === 'front') {
      fireProbe(f.x + 10, f.y - 5, 520, -170);
      fireProbe(f.x + 10, f.y + 5, 520, 170);
      audio.bit();
    } else if (f.state === 'back') {
      fireForcePellet(f.x - 10, f.y, -510, 0);
      fireForcePellet(f.x - 8, f.y - 8, -460, -140);
      fireForcePellet(f.x - 8, f.y + 8, -460, 140);
      audio.shoot();
    } else {
      for (let k = 0; k < 3; k++) {
        const a = f.spin + k * (TAU / 3);
        fireForcePellet(f.x + Math.cos(a) * 8, f.y + Math.sin(a) * 8, Math.cos(a) * 270, Math.sin(a) * 270);
      }
      audio.cyclone();
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
    if (lv >= 1) fireBeam(lv);
    else fireVulcan();
  }

  function pushEnt(e) {
    e.id = uid++;
    e.alive = true;
    e.t = 0;
    G.ents.push(e);
  }

  function spawnBolts(n, yNorm) {
    const y0 = 40 + yNorm * (VH - 80);
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'bolt',
        x: G.cam + VW + 24 + i * 28,
        y: y0 + Math.sin(i * 0.9) * 26,
        y0: y0,
        w: 16,
        h: 12,
        hp: 1,
        maxHp: 1,
        fireCd: 0.4 + i * 0.12,
        vx: -74 - i * 4
      });
    }
  }

  function spawnMast(side) {
    const x = G.cam + VW + 10;
    const c = caveAt(x);
    const top = side < 0;
    pushEnt({
      type: 'mast',
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

  function spawnHull() {
    pushEnt({
      type: 'hull',
      x: G.cam + VW + 30,
      y: VH * 0.5 + rand(-40, 40),
      w: 38,
      h: 20,
      hp: 6,
      maxHp: 6,
      fireCd: 0.9,
      vx: -40
    });
  }

  function spawnFrost(n) {
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'frost',
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

  function spawnCrystal() {
    pushEnt({
      type: 'crystal',
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

  function spawnSplinter(x, y, dir) {
    pushEnt({
      type: 'splinter',
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

  function spawnCrawler() {
    const top = hash2((G.cam * 0.01) | 0) > 0.5;
    const c = caveAt(G.cam + VW + 16);
    pushEnt({
      type: 'crawler',
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

  function spawnSpores(n) {
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'spore',
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

  function spawnSentinel() {
    pushEnt({
      type: 'sentinel',
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
    if (w.kind === 'bolts') spawnBolts(w.n + (isStorm() ? 2 : 0), w.y);
    else if (w.kind === 'mast') spawnMast(w.side);
    else if (w.kind === 'hull') spawnHull();
    else if (w.kind === 'frost') spawnFrost(w.n + (isStorm() ? 2 : 0));
    else if (w.kind === 'crystal') spawnCrystal();
    else if (w.kind === 'crawler') spawnCrawler();
    else if (w.kind === 'spores') spawnSpores(w.n + (isStorm() ? 1 : 0));
    else if (w.kind === 'sentinel') spawnSentinel();
  }

  function spawnBoss() {
    if (G.boss) return;
    G.boss = true;
    const hp = Math.round((STAGES[2].bossHp || 118) * (isStorm() ? 1.26 : 1));
    const orbs = [];
    for (let i = 0; i < 4; i++) {
      orbs.push({ ang: i * (TAU / 4), hp: 3, maxHp: 3, deadT: 0, r: 11 });
    }
    pushEnt({
      type: 'boss',
      x: G.cam + 568,
      y: VH * 0.5,
      w: 88,
      h: 88,
      hp: hp,
      maxHp: hp,
      fireCd: 0.4,
      phase: 0,
      rage: false,
      orbs: orbs,
      open: 1
    });
    toast('武核', true, false);
    audio.warn();
    syncHud();
  }

  function enemyShot(x, y, vx, vy, fat) {
    G.eShots.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: fat ? 6.2 : 3.4,
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

  function shotHitsEnt(s, e) {
    const ex = e.x - G.cam;
    const ey = e.y;
    if (e.type === 'boss') {
      const nx = ex - 8;
      const ny = ey;
      if (s.type !== 'beam' && e.orbs) {
        for (let i = 0; i < e.orbs.length; i++) {
          const o = e.orbs[i];
          if (o.hp <= 0) continue;
          const oxp = ex + Math.cos(o.ang) * 50;
          const oyp = ey + Math.sin(o.ang) * 50;
          if (hypot(s.x - oxp, s.y - oyp) < o.r + Math.max(s.w, s.h) * 0.4) {
            return { hx: oxp, hy: oyp, part: 'orb', orb: o };
          }
        }
      }
      const hw = s.type === 'beam' ? 26 : 22;
      const hh = s.type === 'beam' ? 26 : 22;
      if (aabb(s.x, s.y, s.w * 0.5, s.h * 0.5, nx, ny, hw, hh)) {
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
      r0: 1.1, r1: 2.8, life: 0.22, rgb: e.type === 'boss' ? GOLD : LIME, g: 60
    });
    if (e.type === 'boss') {
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

  function hurtOrb(e, orb, dmg, hx, hy) {
    if (orb.hp <= 0) return;
    orb.hp -= dmg;
    bumpCombo();
    audio.hit('orb', G.combo);
    emit(5, {
      x: hx, y: hy, j: 3,
      vx0: -80, vx1: 80, vy0: -80, vy1: 80,
      r0: 1.1, r1: 2.6, life: 0.2, rgb: VIO, g: 40
    });
    hitStop(0.03);
    if (orb.hp <= 0) {
      orb.deadT = 3.6;
      const n = SCORE.orb * G.mult;
      addScore(n);
      floatText(hx, hy - 8, String(n), VIO, G.mult >= 2);
      explode(hx, hy, VIO, 16);
    } else popSpark(hx, hy, VIO, 8);
  }

  function killEnt(e, hx, hy) {
    e.alive = false;
    const pts = SCORE[e.type] || 50;
    const n = pts * G.mult;
    addScore(n);
    floatText(hx, hy - 10, String(n), GOLD, G.mult >= 2);
    if (e.type === 'boss') {
      explode(hx, hy, GOLD, 48);
      explode(hx + 20, hy - 16, VIO, 28);
      explode(hx - 12, hy + 10, LIME, 22);
      hitStop(0.085);
      kick(8);
      screenFlash(GOLD, 0.55);
      onBossDown();
    } else if (e.type === 'crystal') {
      explode(hx, hy, CYN, 22);
      spawnSplinter(e.x, e.y, -1);
      spawnSplinter(e.x, e.y, 1);
      hitStop(0.05);
      kick(3);
    } else if (e.type === 'hull' || e.type === 'crawler' || e.type === 'sentinel') {
      explode(hx, hy, HOT, 24);
      hitStop(0.048);
      kick(2.8);
    } else {
      explode(hx, hy, LIME, 14);
      hitStop(0.036);
      kick(2.1);
    }
    syncHud();
  }

  function onBossDown() {
    addScore(SCORE.all);
    G.winT = 1.38;
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play' || G.winT > 0) return;
    G.lives -= 1;
    G.deadT = 0.9;
    G.chargeT = 0;
    G.lastLv = 0;
    G.fireHold = false;
    breakCombo();
    explode(G.px, G.py, MAG, 36);
    explode(G.px + 8, G.py, LIME, 18);
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
    G.invuln = 1.4;
    G.deadT = 0;
    G.force.state = 'front';
    G.force.vx = 0;
    G.force.vy = 0;
    G.force.grace = 0;
    G.force.recall = false;
    G.force.from = 'front';
    snapForce();
    snapBits();
    G.chargeT = 0;
    G.eShots.length = 0;
    if (keys.sht) G.fireHold = true;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', 'Shift 把力荚打出去挡弹旋射，空格蓄满超波打核。分数 ' + G.score + '。');
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    audio.win();
    showOverlay('win', '武核崩解', '短关打穿，武核崩解。分数 ' + G.score + (isStorm() ? ' · 武核' : ' · 武装三') + '。');
    setHint('R 重开 · 武核已崩', 'hot');
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
    G.chargeT = 0;
    G.lastLv = 0;
    G.vulcCd = 0;
    G.bitCd = 0;
    G.deadT = 0;
    G.invuln = 1.12;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.boss = false;
    G.winT = 0;
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
    snapForce();
    snapBits();
    G.fireHold = false;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isStorm() ? '武核' : '武装三', false, !isStorm());
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
    G.force.recall = false;
    snapForce();
    snapBits();
    clearWorld();
    showOverlay('title', '武装三', LEAD);
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.9);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.force.blockT > 0) G.force.blockT -= dt;
    if (G.force.ramT > 0) G.force.ramT -= dt;
    G.force.spin += dt * (G.force.state === 'fly' ? 7.2 : 3.2);
    for (let i = 0; i < G.bits.length; i++) {
      if (G.bits[i].blockT > 0) G.bits[i].blockT -= dt;
    }
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
        tx = f.from === 'back' ? G.px - 108 : G.px + 136;
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
    if (G.deadT <= 0 && f.fireCd <= 0) {
      const cd = f.state === 'front' ? 0.26 : f.state === 'back' ? 0.18 : 0.22;
      f.fireCd = cd;
      fireForceShot();
    }
  }

  function updateCharge(dt) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    if (G.vulcCd > 0) G.vulcCd -= dt;
    if (G.bitCd > 0) G.bitCd -= dt;
    if (G.fireHold) {
      const prev = chargeLevel();
      G.chargeT += dt;
      if (G.chargeT > CHG3 + 0.4) G.chargeT = CHG3 + 0.4;
      const lv = chargeLevel();
      if (lv > prev && lv >= 1) {
        audio.chargeTick(lv);
        screenFlash(lv === 3 ? GOLD : LIME, lv === 3 ? 0.28 : 0.14);
        kick(lv === 3 ? 3.2 : 1.8);
        if (lv === 3) hitStop(0.05);
        G.lastLv = lv;
      }
      fireBitShots();
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
      if (e.type === 'bolt') {
        e.x += (e.vx || -74) * dt;
        e.y = e.y0 + Math.sin(e.t * 2.7 + e.x * 0.01) * 28;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 40) {
          e.fireCd = 1.32;
          aimShot(e.x, e.y, 184, 0);
        }
      } else if (e.type === 'mast') {
        const c = caveAt(e.x);
        e.y = e.side < 0 ? c.top + 14 : c.bot - 14;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 20 && e.x - G.cam > 40) {
          e.fireCd = 1.12;
          aimShot(e.x, e.y, 204, rand(-0.08, 0.08));
        }
      } else if (e.type === 'hull') {
        e.x += (e.vx || -40) * dt;
        e.y += Math.sin(e.t * 1.4) * 12 * dt;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 30) {
          e.fireCd = 1.48;
          for (let k = -1; k <= 1; k++) aimShot(e.x - 10, e.y, 172, k * 0.28);
        }
      } else if (e.type === 'frost') {
        e.x -= 112 * dt;
        e.y = e.y0 + Math.sin(e.t * 4.4 + e.phase) * 42;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 60) {
          e.fireCd = 1.68;
          enemyShot(e.x, e.y, -164, Math.sin(e.t) * 42, false);
        }
      } else if (e.type === 'crystal') {
        e.x -= 56 * dt;
        e.spin += dt * 2.5;
        e.y += Math.sin(e.t * 1.8) * 18 * dt;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 40) {
          e.fireCd = 1.18;
          for (let k = 0; k < 4; k++) {
            const a = e.spin + k * (TAU / 4);
            enemyShot(e.x, e.y, Math.cos(a) * 148, Math.sin(a) * 148, false);
          }
        }
      } else if (e.type === 'splinter') {
        e.x += (e.vx || -80) * dt;
        e.y += (e.vy || 0) * dt;
        const c = caveAt(e.x);
        if (e.y < c.top + 8 || e.y > c.bot - 8) e.vy *= -1;
      } else if (e.type === 'crawler') {
        e.x += (e.vx || -36) * dt;
        const c = caveAt(e.x);
        e.y = e.side < 0 ? c.top + 18 : c.bot - 18;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 30) {
          e.fireCd = 1.38;
          for (let k = -1; k <= 1; k++) aimShot(e.x, e.y, 188, k * 0.22);
        }
      } else if (e.type === 'spore') {
        e.x -= 62 * dt;
        e.open = 0.5 + Math.sin(e.t * 3.1) * 0.5;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 50) {
          e.fireCd = 1.22;
          aimShot(e.x, e.y, 206, 0);
        }
      } else if (e.type === 'sentinel') {
        e.x += (e.vx || -48) * dt;
        e.spin += dt * 1.8;
        e.y += Math.sin(e.t * 1.5) * 22 * dt;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 40) {
          e.fireCd = 1.28;
          aimShot(e.x, e.y, 198, 0);
          aimShot(e.x, e.y, 176, 0.22);
          aimShot(e.x, e.y, 176, -0.22);
        }
      } else if (e.type === 'boss') {
        e.x = G.cam + 568;
        e.y = VH * 0.5 + Math.sin(e.t * 0.7) * 50;
        e.open = 0.72 + Math.sin(e.t * (e.rage ? 5.5 : 2.8)) * 0.28;
        if (!e.rage && e.hp < e.maxHp * 0.5) {
          e.rage = true;
          toast('武核狂暴', true, false);
          audio.warn();
        }
        if (e.orbs) {
          for (let k = 0; k < e.orbs.length; k++) {
            const o = e.orbs[k];
            o.ang += dt * (e.rage ? 1.55 : 1.05);
            if (o.hp <= 0) {
              o.deadT -= dt;
              if (o.deadT <= 0) {
                o.hp = o.maxHp;
                popSpark(e.x - G.cam + Math.cos(o.ang) * 50, e.y + Math.sin(o.ang) * 50, VIO, 10);
              }
            }
          }
        }
        if (e.fireCd <= 0) {
          e.phase = (e.phase + 1) % (e.rage ? 4 : 3);
          e.fireCd = e.rage ? 0.52 : 0.82;
          const cx = e.x - 16;
          if (e.phase === 0) {
            aimShot(cx, e.y - 28, 214, 0);
            aimShot(cx, e.y + 28, 214, 0);
          } else if (e.phase === 1) {
            const n = e.rage ? 8 : 6;
            for (let k = 0; k < n; k++) {
              const a = Math.PI + (k - (n - 1) * 0.5) * 0.2;
              enemyShot(cx, e.y, Math.cos(a) * 188, Math.sin(a) * 188, false);
            }
          } else if (e.phase === 2) {
            enemyShot(cx, e.y, -236, 0, true);
            aimShot(cx, e.y, 168, 0);
            if (e.orbs) {
              for (let k = 0; k < e.orbs.length; k++) {
                const o = e.orbs[k];
                if (o.hp <= 0) continue;
                const oxp = e.x + Math.cos(o.ang) * 50;
                const oyp = e.y + Math.sin(o.ang) * 50;
                aimShot(oxp, oyp, 160, 0);
              }
            }
          } else {
            for (let k = -2; k <= 2; k++) {
              enemyShot(cx, e.y, -218, k * 52, k === 0);
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
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > VW + 90 || s.x < -70 || s.y < -40 || s.y > VH + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.type !== 'beam' && inSolid(G.cam + s.x, s.y, 2)) {
        popSpark(s.x, s.y, s.rgb || LIME, 6);
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
        if (hit.part === 'orb' && hit.orb) {
          hurtOrb(e, hit.orb, s.dmg, hit.hx, hit.hy);
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
      if (G.deadT <= 0 && s.blockable && hypot(sxv - f.x, s.y - f.y) < 15 + s.r) {
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
      let blocked = false;
      if (G.deadT <= 0 && s.blockable) {
        for (let b = 0; b < G.bits.length; b++) {
          const bit = G.bits[b];
          if (hypot(sxv - bit.x, s.y - bit.y) < 10 + s.r) {
            G.eShots.splice(i, 1);
            bit.blockT = 0.1;
            popSpark(bit.x, bit.y, VIO, 8);
            audio.block();
            blocked = true;
            break;
          }
        }
      }
      if (blocked) continue;
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
        if (e.orbs) {
          for (let k = 0; k < e.orbs.length; k++) {
            const o = e.orbs[k];
            if (o.hp <= 0) continue;
            hits.push({
              x: e.x - G.cam + Math.cos(o.ang) * 50,
              y: e.y + Math.sin(o.ang) * 50,
              r: o.r,
              orb: o
            });
          }
        }
      } else {
        hits.push({ x: e.x - G.cam, y: e.y, r: Math.max(e.w, e.h) * 0.55 });
      }
      for (let h = 0; h < hits.length; h++) {
        const p = hits[h];
        if (hypot(p.x - f.x, p.y - f.y) < 15 + p.r * 0.7) {
          if (f.ramT <= 0) {
            f.ramT = 0.1;
            if (p.orb) hurtOrb(e, p.orb, isStorm() ? 2 : 1, f.x, f.y);
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
      snapBits();
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
    snapBits();
    updateForce(dt);
    updateCharge(dt);
    if (!REDUCE && G.deadT <= 0 && ((G.t * 24) | 0) !== (((G.t - dt) * 24) | 0)) {
      emit(1, {
        x: G.px - 12, y: G.py, j: 2.2,
        vx0: -90, vx1: -24, vy0: -18, vy1: 18,
        r0: 1.1, r1: 2.4, life: 0.2, rgb: LIME, g: 0
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
    c.fillStyle = st === 2 ? '#141c10' : st === 3 ? '#16140c' : '#14180c';
    c.beginPath();
    c.moveTo(sx(-20), sy(-4));
    for (let i = 0; i < topPts.length; i += 2) c.lineTo(sx(topPts[i]), sy(topPts[i + 1]));
    c.lineTo(sx(VW + 24), sy(-4));
    c.closePath();
    c.fill();
    c.fillStyle = st === 2 ? '#10180c' : '#10140a';
    c.beginPath();
    c.moveTo(sx(-20), sy(VH + 4));
    for (let i = 0; i < botPts.length; i += 2) c.lineTo(sx(botPts[i]), sy(botPts[i + 1]));
    c.lineTo(sx(VW + 24), sy(VH + 4));
    c.closePath();
    c.fill();

    c.strokeStyle = rgba(st === 2 ? CYN : st === 3 ? VIO : LIME, 0.55);
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
      c.fillStyle = rgba(STEEL, 0.38);
      for (let x = 0; x < VW; x += 78) {
        const wx = G.cam + x;
        const i = Math.round(wx / 78);
        if (hash2(i + 5) <= 0.56) continue;
        const cv = caveAt(i * 78);
        const h = 20 + hash2(i + 13) * 58;
        const px = i * 78 - G.cam;
        c.fillStyle = rgba(STEEL, 0.38);
        if (hash2(i + 9) > 0.5) {
          c.fillRect(sx(px - 6), sy(cv.top - h * 0.12), 12 * scale, h * 0.5 * scale);
          c.fillStyle = rgba(LIME, 0.28);
          c.fillRect(sx(px - 1.4), sy(cv.top), 2.8 * scale, h * 0.42 * scale);
        } else {
          c.fillRect(sx(px - 6), sy(cv.bot - h * 0.38), 12 * scale, h * 0.5 * scale);
          c.fillStyle = rgba(LIME, 0.28);
          c.fillRect(sx(px - 1.4), sy(cv.bot - h * 0.38), 2.8 * scale, h * 0.38 * scale);
        }
      }
    } else if (st === 2) {
      c.fillStyle = rgba(CYN, 0.3);
      for (let x = 0; x < VW; x += 54) {
        const wx = G.cam + x;
        const i = Math.round(wx / 54);
        if (hash2(i + 23) <= 0.6) continue;
        const cv = caveAt(i * 54);
        const spike = 20 + hash2(i) * 30;
        const px = i * 54 - G.cam;
        c.beginPath();
        if (hash2(i + 6) > 0.5) {
          c.moveTo(sx(px), sy(cv.top));
          c.lineTo(sx(px + 7), sy(cv.top + spike));
          c.lineTo(sx(px - 7), sy(cv.top + spike));
        } else {
          c.moveTo(sx(px), sy(cv.bot));
          c.lineTo(sx(px + 7), sy(cv.bot - spike));
          c.lineTo(sx(px - 7), sy(cv.bot - spike));
        }
        c.closePath();
        c.fill();
      }
    } else {
      c.fillStyle = rgba(STEEL, 0.42);
      for (let x = 0; x < VW; x += 88) {
        const wx = G.cam + x;
        const i = Math.floor(wx / 88);
        const cv = caveAt(i * 88);
        const px = i * 88 - G.cam;
        c.fillRect(sx(px - 18), sy(cv.top), 36 * scale, 8 * scale);
        c.fillRect(sx(px - 18), sy(cv.bot - 8), 36 * scale, 8 * scale);
        c.fillStyle = rgba(VIO, 0.22);
        c.fillRect(sx(px - 2), sy(cv.top + 8), 4 * scale, 10 * scale);
        c.fillStyle = rgba(STEEL, 0.42);
      }
    }
  }

  function drawBolt(e) {
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
    c.fillStyle = rgba(LIME, 0.9);
    c.fillRect(-2 * scale, -2 * scale, 7 * scale, 4 * scale);
    c.restore();
  }

  function drawMast(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(STEEL, 0.95);
    c.fillRect(-9 * scale, -8 * scale, 18 * scale, 16 * scale);
    c.fillStyle = rgba(HOT, 0.9);
    c.beginPath();
    c.arc(0, 0, 5 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(LIME, 0.7);
    c.fillRect(0, -2 * scale, 10 * scale, 4 * scale);
    c.restore();
  }

  function drawHull(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(STEEL, 0.95);
    c.fillRect(-19 * scale, -10 * scale, 38 * scale, 20 * scale);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(-8 * scale, -5 * scale, 14 * scale, 10 * scale);
    c.fillStyle = rgba(MAG, 0.85);
    c.fillRect(10 * scale, -3 * scale, 10 * scale, 6 * scale);
    c.fillStyle = rgba(LIME, 0.5);
    c.fillRect(-21 * scale, -2 * scale, 6 * scale, 4 * scale);
    c.restore();
  }

  function drawFrost(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.moveTo(7 * scale, 0);
    c.lineTo(-5 * scale, -5 * scale);
    c.lineTo(-5 * scale, 5 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.8);
    c.beginPath();
    c.arc(-1 * scale, 0, 1.6 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawCrystal(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.rotate(e.spin || 0);
    c.fillStyle = rgba(CYN, 0.9);
    c.beginPath();
    c.moveTo(0, -12 * scale);
    c.lineTo(10 * scale, 0);
    c.lineTo(0, 12 * scale);
    c.lineTo(-10 * scale, 0);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.75);
    c.beginPath();
    c.moveTo(0, -5 * scale);
    c.lineTo(4 * scale, 0);
    c.lineTo(0, 5 * scale);
    c.lineTo(-4 * scale, 0);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawSplinter(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(HOT, 0.95);
    c.beginPath();
    c.moveTo(0, -6 * scale);
    c.lineTo(5 * scale, 0);
    c.lineTo(0, 6 * scale);
    c.lineTo(-5 * scale, 0);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawCrawler(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    if (e.side < 0) c.scale(1, -1);
    c.fillStyle = rgba(STEEL, 0.95);
    c.fillRect(-14 * scale, -8 * scale, 28 * scale, 16 * scale);
    c.fillStyle = rgba(HOT, 0.9);
    c.fillRect(-4 * scale, -4 * scale, 12 * scale, 8 * scale);
    const leg = Math.sin(e.t * 8) * 4;
    c.strokeStyle = rgba(LIME, 0.8);
    c.lineWidth = Math.max(1, 1.6 * scale);
    c.beginPath();
    c.moveTo(-10 * scale, 8 * scale);
    c.lineTo((-10 + leg) * scale, 14 * scale);
    c.moveTo(8 * scale, 8 * scale);
    c.lineTo((8 - leg) * scale, 14 * scale);
    c.stroke();
    c.restore();
  }

  function drawSpore(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    const o = 0.55 + (e.open || 0) * 0.45;
    c.fillStyle = rgba(VIO, 0.55);
    c.beginPath();
    c.arc(0, 0, 10 * scale * o, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(MAG, 0.9);
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

  function drawSentinel(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.rotate(e.spin || 0);
    c.strokeStyle = rgba(VIO, 0.95);
    c.lineWidth = Math.max(1.4, 2 * scale);
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6;
      const px = Math.cos(a) * 12 * scale;
      const py = Math.sin(a) * 12 * scale;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();
    c.fillStyle = rgba(LIME, 0.85);
    c.beginPath();
    c.arc(0, 0, 4 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawBoss(e) {
    const c = ctx;
    const x = e.x - G.cam;
    const y = e.y;
    if (e.orbs) {
      for (let i = 0; i < e.orbs.length; i++) {
        const o = e.orbs[i];
        const oxp = x + Math.cos(o.ang) * 50;
        const oyp = y + Math.sin(o.ang) * 50;
        c.strokeStyle = rgba(VIO, o.hp > 0 ? 0.55 : 0.18);
        c.lineWidth = Math.max(1, 1.4 * scale);
        c.beginPath();
        c.moveTo(sx(x - 8), sy(y));
        c.lineTo(sx(oxp), sy(oyp));
        c.stroke();
        c.fillStyle = rgba(o.hp > 0 ? VIO : STEEL, o.hp > 0 ? 0.95 : 0.35);
        c.beginPath();
        c.arc(sx(oxp), sy(oyp), o.r * scale, 0, TAU);
        c.fill();
        if (o.hp > 0) {
          c.fillStyle = rgba(GOLD, 0.8);
          c.beginPath();
          c.arc(sx(oxp), sy(oyp), 3.4 * scale, 0, TAU);
          c.fill();
        }
      }
    }
    c.save();
    c.translate(sx(x), sy(y));
    const beat = (e.open || 1) * (1 + Math.sin(e.t * (e.rage ? 8 : 4)) * 0.06);
    c.fillStyle = rgba(STEEL, 0.92);
    c.beginPath();
    c.ellipse(0, 0, 42 * scale, 36 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.92);
    c.beginPath();
    c.ellipse(-6 * scale, 0, 26 * scale, 22 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(e.rage ? MAG : GOLD, 0.95);
    c.beginPath();
    c.arc(-8 * scale, 0, 14 * scale * beat, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.85);
    c.beginPath();
    c.arc(-8 * scale, 0, 6 * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(LIME, 0.55);
    c.lineWidth = Math.max(1, 1.5 * scale);
    c.beginPath();
    c.ellipse(0, 0, 46 * scale, 18 * scale, 0, 0, TAU);
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
    c.fillStyle = rgba(LIME, 0.32);
    c.beginPath();
    c.ellipse(-10 * scale, 0, 16 * scale, 7 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(HOT, 0.95);
    c.beginPath();
    c.moveTo(-16 * scale, -6 * scale);
    c.lineTo(-8 * scale, 0);
    c.lineTo(-16 * scale, 6 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.96);
    c.beginPath();
    c.moveTo(-8 * scale, -8 * scale);
    c.lineTo(18 * scale, 0);
    c.lineTo(-8 * scale, 8 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(LIME, 0.95);
    c.fillRect(-2 * scale, -3.2 * scale, 12 * scale, 6.4 * scale);
    c.fillStyle = rgba(DEEP, 0.85);
    c.fillRect(2 * scale, -1.6 * scale, 6 * scale, 3.2 * scale);
    c.fillStyle = rgba(VIO, 0.8);
    c.fillRect(-6 * scale, -2 * scale, 3.4 * scale, 4 * scale);
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle / 0.12);
      c.fillRect(16 * scale, -2 * scale, 10 * scale, 4 * scale);
    }
    const lv = chargeLevel();
    if (lv >= 1) {
      const rad = 4 + lv * 5 + Math.sin(G.t * 14) * 1.2;
      c.fillStyle = rgba(lv >= 3 ? GOLD : lv >= 2 ? HOT : LIME, 0.55);
      c.beginPath();
      c.arc(18 * scale, 0, rad * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(lv >= 3 ? VIO : WHT, 0.7);
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.beginPath();
      c.arc(18 * scale, 0, (rad + 3) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  function drawBits() {
    if (G.deadT > 0) return;
    const c = ctx;
    for (let i = 0; i < G.bits.length; i++) {
      const b = G.bits[i];
      c.strokeStyle = rgba(VIO, b.blockT > 0 ? 0.7 : 0.28);
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.beginPath();
      c.moveTo(sx(G.px + 4), sy(G.py));
      c.lineTo(sx(b.x), sy(b.y));
      c.stroke();
      c.save();
      c.translate(sx(b.x), sy(b.y));
      c.rotate(G.t * 2.4 + i * Math.PI);
      c.fillStyle = rgba(VIO, 0.95);
      c.beginPath();
      c.moveTo(6 * scale, 0);
      c.lineTo(0, -5 * scale);
      c.lineTo(-5 * scale, 0);
      c.lineTo(0, 5 * scale);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(b.blockT > 0 ? WHT : GOLD, 0.9);
      c.beginPath();
      c.arc(0, 0, 2 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawForce() {
    if (G.deadT > 0 && G.force.state !== 'fly') return;
    const f = G.force;
    const c = ctx;
    c.save();
    c.translate(sx(f.x), sy(f.y));
    c.rotate(f.spin * 0.28);
    const glow = f.blockT > 0 ? 1 : 0.74;
    const col = f.state === 'fly' ? VIO : f.state === 'back' ? CYN : LIME;
    c.strokeStyle = rgba(col, 0.55 + (f.blockT > 0 ? 0.4 : 0));
    c.lineWidth = Math.max(1, 1.5 * scale);
    c.beginPath();
    c.ellipse(0, 0, 16 * scale, 8 * scale, 0, 0, TAU);
    c.stroke();
    c.beginPath();
    c.ellipse(0, 0, 8 * scale, 14 * scale, 0, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(CYN, glow);
    c.beginPath();
    c.ellipse(0, 0, 11 * scale, 6.5 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(f.blockT > 0 ? WHT : GOLD, 0.95);
    c.beginPath();
    c.arc(0, 0, 3.6 * scale, 0, TAU);
    c.fill();
    if (f.state === 'fly') {
      c.strokeStyle = rgba(VIO, 0.45);
      c.beginPath();
      for (let k = 0; k < 3; k++) {
        const a = f.spin + k * (TAU / 3);
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * 18 * scale, Math.sin(a) * 18 * scale);
      }
      c.stroke();
    }
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.type === 'beam') {
        const a = clamp(s.life / 0.74, 0, 1);
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
      } else if (s.type === 'probe') {
        c.save();
        c.translate(sx(s.x), sy(s.y));
        const ang = Math.atan2(s.vy, s.vx);
        c.rotate(ang);
        c.fillStyle = rgba(TEAL, 0.95);
        c.fillRect(-10 * scale, -1.6 * scale, 22 * scale, 3.2 * scale);
        c.fillStyle = rgba(WHT, 0.85);
        c.fillRect(-8 * scale, -0.7 * scale, 18 * scale, 1.4 * scale);
        c.restore();
      } else if (s.type === 'bit') {
        c.fillStyle = rgba(VIO, 0.95);
        c.fillRect(sx(s.x - s.w * 0.5), sy(s.y - s.h * 0.5), s.w * scale, Math.max(2, s.h * scale));
        c.fillStyle = rgba(WHT, 0.7);
        c.fillRect(sx(s.x - s.w * 0.2), sy(s.y - 0.7), s.w * 0.5 * scale, 1.4 * scale);
      } else {
        c.fillStyle = rgba(s.rgb || LIME, 0.95);
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
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#12160a';
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
    g.addColorStop(0, '#161c0c');
    g.addColorStop(1, '#12160a');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawTerrain();

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = (e.x || 0) - G.cam;
      if (e.type !== 'boss' && (x < -50 || x > VW + 50)) continue;
      if (e.type === 'bolt') drawBolt(e);
      else if (e.type === 'mast') drawMast(e);
      else if (e.type === 'hull') drawHull(e);
      else if (e.type === 'frost') drawFrost(e);
      else if (e.type === 'crystal') drawCrystal(e);
      else if (e.type === 'splinter') drawSplinter(e);
      else if (e.type === 'crawler') drawCrawler(e);
      else if (e.type === 'spore') drawSpore(e);
      else if (e.type === 'sentinel') drawSentinel(e);
      else if (e.type === 'boss') drawBoss(e);
    }

    if (G.force.state === 'back') drawForce();
    drawBits();
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
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'Left' || k === 'Right' || k === 'Up' || k === 'Down';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const forceKey = code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ' || k === 'z' || k === 'Z' || k === 'Shift';

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
    if (space) keys.sht = down;
    if (forceKey) {
      if (down && !keys.force) launchForce();
      keys.force = down;
    }

    if (down && (isMove || space || forceKey || k === 'Enter')) e.preventDefault();
    if (!down) {
      if (space && G.fireHold) {
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
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space && G.mode === 'play' && !G.fireHold) G.fireHold = true;
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
      keys.sht = false;
      keys.force = false;
      pointer.down = false;
      G.fireHold = false;
    }
  });
  requestAnimationFrame(frame);
})();
