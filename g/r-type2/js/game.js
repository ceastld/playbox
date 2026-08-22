'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const STAGE_LEN = 1480;
  const TAP = 0.08;
  const CHG1 = 0.4;
  const CHG2 = 0.86;
  const CHG3 = 1.42;
  const BEST_KEY = 'playbox-r-type2-best';
  const MUTE_KEY = 'playbox-r-type2-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击（按住蓄力）· R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const CYN = [46, 196, 240];
  const TEAL = [20, 208, 200];
  const GOLD = [255, 227, 107];
  const STEEL = [72, 108, 140];
  const WHT = [232, 246, 255];
  const HOT = [90, 212, 255];
  const ORG = [58, 168, 232];
  const MAG = [255, 90, 154];
  const DEEP = [8, 24, 40];
  const PNK = [255, 154, 196];
  const CORE = [255, 180, 64];

  const SCORE = {
    drone: 50,
    turret: 80,
    wrecker: 150,
    mite: 70,
    prism: 120,
    shard: 30,
    walker: 180,
    gate: 100,
    boss: 9000,
    clear: 1500,
    all: 4000
  };

  const STAGES = [
    {
      name: '废都',
      boss: '巨砦',
      seed: 1,
      waves: [
        { x: 40, kind: 'drones', n: 4, y: 0.4 },
        { x: 180, kind: 'turret', side: -1 },
        { x: 260, kind: 'drones', n: 5, y: 0.62 },
        { x: 380, kind: 'wrecker' },
        { x: 500, kind: 'turret', side: 1 },
        { x: 560, kind: 'drones', n: 5, y: 0.34 },
        { x: 700, kind: 'turret', side: -1 },
        { x: 740, kind: 'turret', side: 1 },
        { x: 860, kind: 'wrecker' },
        { x: 960, kind: 'drones', n: 6, y: 0.5 },
        { x: 1100, kind: 'drones', n: 4, y: 0.28 },
        { x: 1140, kind: 'drones', n: 4, y: 0.72 },
        { x: 1280, kind: 'wrecker' },
        { x: 1380, kind: 'turret', side: -1 }
      ]
    },
    {
      name: '晶洞',
      boss: '巨砦',
      seed: 2,
      waves: [
        { x: 30, kind: 'mites', n: 6 },
        { x: 140, kind: 'prism' },
        { x: 240, kind: 'drones', n: 5, y: 0.45 },
        { x: 340, kind: 'turret', side: -1 },
        { x: 420, kind: 'mites', n: 7 },
        { x: 540, kind: 'prism' },
        { x: 640, kind: 'wrecker' },
        { x: 760, kind: 'prism' },
        { x: 860, kind: 'mites', n: 8 },
        { x: 980, kind: 'turret', side: 1 },
        { x: 1060, kind: 'drones', n: 6, y: 0.32 },
        { x: 1180, kind: 'prism' },
        { x: 1280, kind: 'mites', n: 7 },
        { x: 1380, kind: 'wrecker' }
      ]
    },
    {
      name: '要塞',
      boss: '巨砦',
      seed: 3,
      bossHp: 112,
      waves: [
        { x: 20, kind: 'gates', n: 3 },
        { x: 140, kind: 'walker' },
        { x: 240, kind: 'drones', n: 6, y: 0.4 },
        { x: 340, kind: 'turret', side: -1 },
        { x: 380, kind: 'turret', side: 1 },
        { x: 500, kind: 'gates', n: 4 },
        { x: 620, kind: 'walker' },
        { x: 740, kind: 'drones', n: 7, y: 0.55 },
        { x: 860, kind: 'walker' },
        { x: 980, kind: 'gates', n: 4 },
        { x: 1100, kind: 'turret', side: -1 },
        { x: 1140, kind: 'turret', side: 1 },
        { x: 1260, kind: 'walker' },
        { x: 1360, kind: 'drones', n: 6, y: 0.5 }
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
  let inputSrc = 'key';

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
      grace: 0
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
    return isStorm() ? 306 : 264;
  }
  function scrollSpd() {
    if (G.boss) return isStorm() ? 18 : 10;
    return isStorm() ? 144 : 98;
  }
  function chargeLevel() {
    if (G.chargeT >= CHG3) return 3;
    if (G.chargeT >= CHG2) return 2;
    if (G.chargeT >= CHG1) return 1;
    return 0;
  }
  function fireRate() {
    return isStorm() ? 1.28 : 1;
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
      const n = fbm(wx * 0.01, 1);
      top = 22 + n * 16;
      bot = VH - 22 - fbm(wx * 0.01, 5) * 16;
      const i = Math.round(wx / 72);
      const h = 18 + hash2(i + 11) * 64;
      if (hash2(i + 3) > 0.55) {
        if (hash2(i + 7) > 0.5) top += h * 0.55;
        else bot -= h * 0.55;
      }
    } else if (st === 2) {
      top = 42 + fbm(wx * 0.014, 2) * 48 + Math.sin(wx * 0.02) * 10;
      bot = VH - 42 - fbm(wx * 0.014, 8) * 48 - Math.cos(wx * 0.018) * 10;
      const i = Math.round(wx / 56);
      const spike = hash2(i + 21) > 0.62 ? 22 + hash2(i) * 28 : 0;
      if (spike) {
        if (hash2(i + 4) > 0.5) top += spike;
        else bot -= spike;
      }
    } else {
      const step = (Math.floor(wx / 86) % 3) * 16;
      top = 36 + step;
      bot = VH - 36 - ((Math.floor(wx / 86 + 1) % 3) * 14);
      if (G.boss || local > STAGE_LEN - 90) {
        top = 18;
        bot = VH - 18;
      }
    }
    if (top > bot - 90) {
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
      this.beep(920, 0.048, 'square', 0.03, 1840);
    },
    laser() {
      this.ensure();
      this.beep(1240, 0.07, 'triangle', 0.028, 620);
      this.beep(1860, 0.05, 'sine', 0.02, 880);
    },
    bounce() {
      this.ensure();
      this.beep(1480, 0.035, 'square', 0.03, 720);
    },
    chargeTick(lv) {
      this.ensure();
      const f = 240 + lv * 190;
      this.beep(f, 0.07, lv >= 3 ? 'triangle' : 'sine', 0.032, f * 1.55);
    },
    beam(lv) {
      this.ensure();
      this.noise(0.11 + lv * 0.045, 0.058, 240);
      this.beep(160 + lv * 36, 0.2, 'sawtooth', 0.055, 64);
      this.beep(480 + lv * 90, 0.14, 'square', 0.04, 160);
    },
    launch() {
      this.ensure();
      this.beep(260, 0.11, 'sawtooth', 0.046, 780);
      this.beep(990, 0.12, 'triangle', 0.03, 240);
      this.noise(0.08, 0.036, 520);
    },
    dock() {
      this.ensure();
      this.beep(700, 0.06, 'square', 0.04, 240);
      this.beep(350, 0.1, 'triangle', 0.034, 150);
    },
    block() {
      this.ensure();
      this.beep(1320, 0.04, 'square', 0.034, 400);
      this.noise(0.03, 0.02, 1700);
    },
    ram() {
      this.ensure();
      this.noise(0.05, 0.04, 380);
      this.beep(210, 0.08, 'sawtooth', 0.04, 88);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 190 : kind === 'prism' ? 520 : 500;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.042, 0.034, 1100);
      this.beep(base * lift, 0.075, 'square', 0.046, base * lift * 1.5);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.065, 260);
      this.beep(270, 0.22, 'sawtooth', 0.052, 60);
      this.beep(130, 0.34, 'sine', 0.045, 38);
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
      tagLabel.textContent = isStorm() ? '密械' : '突入';
      tagLabel.className = isStorm() ? 'warn' : '';
    }
    if (forceLabel) {
      const st = G.force.state;
      forceLabel.textContent = st === 'back' ? '后核' : st === 'fly' ? '游离' : '前核';
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
    else if (G.mode === 'lose') setHint('R 重开 · 满波把力核打出去，飞过去对接挡弹', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 要塞已崩', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 用力核挡弹，空格蓄满再放', 'warn');
    else if (G.force.state === 'fly') setHint('力核游离 · 从左对接前核，从右对接后核', '');
    else if (G.force.state === 'back') setHint('后核向后打 · 满波把力核打出去', '');
    else setHint('前核探射反弹 · 空格蓄力 · 满波出击', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'RT2';
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
    for (let i = 0; i < 72; i++) {
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

  function snapForce() {
    if (G.force.state === 'front') {
      G.force.x = G.px + 30;
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
    if (G.force.state === 'fly') return;
    G.force.state = 'fly';
    G.force.vx = 480;
    G.force.vy = 0;
    G.force.grace = 0.28;
    audio.launch();
    emit(12, {
      x: G.force.x, y: G.force.y, j: 4,
      vx0: -90, vx1: 90, vy0: -80, vy1: 80,
      r0: 1.4, r1: 3.4, life: 0.3, rgb: GOLD, g: 30
    });
    popSpark(G.force.x, G.force.y, TEAL, 15);
    floatText(G.force.x, G.force.y - 16, '出击', GOLD, true);
    hitStop(0.034);
    kick(2.4);
    screenFlash(TEAL, 0.16);
    popForm();
    syncHud();
  }

  function fireVulcan() {
    if (G.vulcCd > 0) return;
    G.vulcCd = isStorm() ? 0.088 : 0.1;
    G.shots.push({
      type: 'vulc',
      x: G.px + 16,
      y: G.py,
      vx: 660,
      vy: 0,
      w: 11,
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
    const h = lv === 3 ? 42 : lv === 2 ? 22 : 10;
    const dmg = lv === 3 ? 24 : lv === 2 ? 11 : 4;
    const pierce = lv === 3 ? 99 : lv === 2 ? 3 : 1;
    G.shots.push({
      type: 'beam',
      x: G.px + 28,
      y: G.py,
      vx: 540,
      vy: 0,
      w: 46 + lv * 10,
      h: h,
      dmg: dmg,
      pierce: pierce,
      life: 0.72,
      rgb: lv >= 3 ? GOLD : lv >= 2 ? HOT : CYN,
      lv: lv,
      hit: {}
    });
    G.muzzle = 0.12;
    audio.beam(lv);
    hitStop(lv === 3 ? 0.07 : 0.048);
    kick(lv === 3 ? 3.8 : 2.6);
    screenFlash(lv >= 3 ? GOLD : CYN, lv === 3 ? 0.32 : 0.16);
    if (lv >= 3) floatText(G.px + 40, G.py - 22, 'WAVE', GOLD, true);
    if (lv >= 2) launchForce();
    emit(10 + lv * 4, {
      x: G.px + 24, y: G.py, j: 8,
      vx0: 80, vx1: 280, vy0: -80, vy1: 80,
      r0: 1.4, r1: 3.6, life: 0.28, rgb: lv >= 3 ? GOLD : CYN, g: 40
    });
  }

  function fireLaser(x, y, vx, vy) {
    G.shots.push({
      type: 'laser',
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      w: 16,
      h: 3.4,
      dmg: 2,
      pierce: 1,
      bounces: 3,
      life: 1.15,
      rgb: TEAL
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
      rgb: TEAL
    });
  }

  function fireForceShot() {
    const f = G.force;
    if (f.state === 'front') {
      fireLaser(f.x + 8, f.y - 6, 500, -240);
      fireLaser(f.x + 8, f.y + 6, 500, 240);
      audio.laser();
    } else if (f.state === 'back') {
      fireForcePellet(f.x - 10, f.y, -520, 0);
      fireForcePellet(f.x - 8, f.y - 8, -470, -150);
      fireForcePellet(f.x - 8, f.y + 8, -470, 150);
      audio.shoot();
    } else {
      fireForcePellet(f.x + 10, f.y, 480, 0);
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

  function spawnDrones(n, yNorm) {
    const y0 = 40 + yNorm * (VH - 80);
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'drone',
        x: G.cam + VW + 24 + i * 28,
        y: y0 + Math.sin(i * 0.9) * 26,
        y0: y0,
        w: 16,
        h: 12,
        hp: 1,
        maxHp: 1,
        fireCd: 0.4 + i * 0.12,
        vx: -70 - i * 4
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

  function spawnWrecker() {
    pushEnt({
      type: 'wrecker',
      x: G.cam + VW + 30,
      y: VH * 0.5 + rand(-40, 40),
      w: 36,
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

  function spawnPrism() {
    pushEnt({
      type: 'prism',
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

  function spawnWalker() {
    const top = hash2((G.cam * 0.01) | 0) > 0.5;
    const c = caveAt(G.cam + VW + 16);
    pushEnt({
      type: 'walker',
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

  function spawnGates(n) {
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'gate',
        x: G.cam + VW + 20 + i * 36,
        y: 90 + (i % 3) * 90,
        w: 18,
        h: 18,
        hp: 3,
        maxHp: 3,
        fireCd: 0.5 + i * 0.15,
        open: 0
      });
    }
  }

  function spawnWave(w) {
    if (w.kind === 'drones') spawnDrones(w.n + (isStorm() ? 2 : 0), w.y);
    else if (w.kind === 'turret') spawnTurret(w.side);
    else if (w.kind === 'wrecker') spawnWrecker();
    else if (w.kind === 'mites') spawnMites(w.n + (isStorm() ? 2 : 0));
    else if (w.kind === 'prism') spawnPrism();
    else if (w.kind === 'walker') spawnWalker();
    else if (w.kind === 'gates') spawnGates(w.n + (isStorm() ? 1 : 0));
  }

  function spawnBoss() {
    if (G.boss) return;
    G.boss = true;
    const hp = Math.round((STAGES[2].bossHp || 112) * (isStorm() ? 1.28 : 1));
    pushEnt({
      type: 'boss',
      x: G.cam + 575,
      y: VH * 0.5,
      w: 92,
      h: 118,
      hp: hp,
      maxHp: hp,
      fireCd: 0.4,
      clawY: 0,
      clawDir: 1,
      phase: 0,
      rage: false
    });
    toast('巨砦', true, false);
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
    let hw = e.w * 0.5;
    let hh = e.h * 0.5;
    if (e.type === 'boss') {
      hw = 38;
      hh = 48;
    }
    const sw = s.w * 0.5;
    const sh = s.h * 0.5;
    if (aabb(s.x, s.y, sw, sh, ex, ey, hw, hh)) {
      return { hx: s.x, hy: s.y };
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

  function killEnt(e, hx, hy) {
    e.alive = false;
    const pts = SCORE[e.type] || 50;
    const n = pts * G.mult;
    addScore(n);
    floatText(hx, hy - 10, String(n), GOLD, G.mult >= 2);
    if (e.type === 'boss') {
      explode(hx, hy, GOLD, 48);
      explode(hx + 20, hy - 16, CYN, 28);
      hitStop(0.085);
      kick(8);
      screenFlash(GOLD, 0.55);
      onBossDown();
    } else if (e.type === 'prism') {
      explode(hx, hy, TEAL, 22);
      spawnShard(e.x, e.y, -1);
      spawnShard(e.x, e.y, 1);
      hitStop(0.05);
      kick(3);
    } else if (e.type === 'wrecker' || e.type === 'walker') {
      explode(hx, hy, ORG, 24);
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
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
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
    snapForce();
    G.chargeT = 0;
    G.eShots.length = 0;
    if (keys.sht) G.fireHold = true;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '满波把力核打出去当撞锤，再飞过去对接。分数 ' + G.score + '。');
    setHint('R 重开 · 满波把力核打出去，飞过去对接挡弹', 'warn');
  }

  function goWin() {
    G.mode = 'win';
    audio.win();
    showOverlay('win', '要塞崩解', '短关打穿，巨砦崩解。分数 ' + G.score + (isStorm() ? ' · 密械' : ' · 突入') + '。');
    setHint('R 重开 · 要塞已崩', 'hot');
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
    G.force.state = 'front';
    G.force.vx = 0;
    G.force.vy = 0;
    G.force.ramT = 0;
    G.force.blockT = 0;
    G.force.fireCd = 0;
    G.force.spin = 0;
    G.force.grace = 0;
    snapForce();
    if (scoreEl) scoreEl.textContent = '0';
    toast(isStorm() ? '密械' : '突入', false, !isStorm());
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
    showOverlay('title', '武装2', '力核前后对接。空格蓄力放波炮，满波把力核打出去，再飞过去对接。短关之后打要塞。');
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.9);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.force.blockT > 0) G.force.blockT -= dt;
    if (G.force.ramT > 0) G.force.ramT -= dt;
    G.force.spin += dt * (G.force.state === 'fly' ? 8 : 3.4);
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
      const tx = G.px + 128;
      const ty = G.py;
      if (f.grace > 0.08) {
        f.vx *= 0.985;
        f.vy *= 0.92;
      } else {
        f.vx += (tx - f.x) * 2.2 * dt;
        f.vy += (ty - f.y) * 3.1 * dt;
        f.vx *= 0.92;
        f.vy *= 0.9;
        f.vx = clamp(f.vx, -260, 360);
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
      const cd = f.state === 'front' ? 0.28 : f.state === 'back' ? 0.18 : 0.24;
      f.fireCd = cd;
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
        screenFlash(lv === 3 ? GOLD : CYN, lv === 3 ? 0.28 : 0.14);
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
      if (e.type === 'drone') {
        e.x += (e.vx || -72) * dt;
        e.y = e.y0 + Math.sin(e.t * 2.6 + e.x * 0.01) * 28;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 40) {
          e.fireCd = 1.35;
          aimShot(e.x, e.y, 180, 0);
        }
      } else if (e.type === 'turret') {
        const c = caveAt(e.x);
        e.y = e.side < 0 ? c.top + 14 : c.bot - 14;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 20 && e.x - G.cam > 40) {
          e.fireCd = 1.15;
          aimShot(e.x, e.y, 200, rand(-0.08, 0.08));
        }
      } else if (e.type === 'wrecker') {
        e.x += (e.vx || -42) * dt;
        e.y += Math.sin(e.t * 1.4) * 12 * dt;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 30) {
          e.fireCd = 1.5;
          for (let k = -1; k <= 1; k++) aimShot(e.x - 10, e.y, 170, k * 0.28);
        }
      } else if (e.type === 'mite') {
        e.x -= 110 * dt;
        e.y = e.y0 + Math.sin(e.t * 4.2 + e.phase) * 42;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 60) {
          e.fireCd = 1.7;
          enemyShot(e.x, e.y, -160, Math.sin(e.t) * 40, false);
        }
      } else if (e.type === 'prism') {
        e.x -= 58 * dt;
        e.spin += dt * 2.4;
        e.y += Math.sin(e.t * 1.8) * 18 * dt;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 40) {
          e.fireCd = 1.2;
          for (let k = 0; k < 4; k++) {
            const a = e.spin + k * (TAU / 4);
            enemyShot(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, false);
          }
        }
      } else if (e.type === 'shard') {
        e.x += (e.vx || -80) * dt;
        e.y += (e.vy || 0) * dt;
        const c = caveAt(e.x);
        if (e.y < c.top + 8 || e.y > c.bot - 8) e.vy *= -1;
      } else if (e.type === 'walker') {
        e.x += (e.vx || -36) * dt;
        const c = caveAt(e.x);
        e.y = e.side < 0 ? c.top + 18 : c.bot - 18;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 30) {
          e.fireCd = 1.4;
          for (let k = -1; k <= 1; k++) aimShot(e.x, e.y, 190, k * 0.22);
        }
      } else if (e.type === 'gate') {
        e.x -= 64 * dt;
        e.open = 0.5 + Math.sin(e.t * 3) * 0.5;
        if (e.fireCd <= 0 && e.x - G.cam < VW - 50) {
          e.fireCd = 1.25;
          aimShot(e.x, e.y, 210, 0);
        }
      } else if (e.type === 'boss') {
        e.x = G.cam + 575;
        e.y = VH * 0.5 + Math.sin(e.t * 0.72) * 52;
        if (!e.rage && e.hp < e.maxHp * 0.5) {
          e.rage = true;
          toast('要塞狂暴', true, false);
          audio.warn();
        }
        e.clawY += e.clawDir * (e.rage ? 140 : 90) * dt;
        if (e.clawY > 70) e.clawDir = -1;
        if (e.clawY < -70) e.clawDir = 1;
        if (e.fireCd <= 0) {
          e.phase = (e.phase + 1) % (e.rage ? 4 : 3);
          e.fireCd = e.rage ? 0.55 : 0.85;
          const cx = e.x - 18;
          if (e.phase === 0) {
            aimShot(cx, e.y - 36, 210, 0);
            aimShot(cx, e.y + 36, 210, 0);
          } else if (e.phase === 1) {
            const n = e.rage ? 7 : 5;
            for (let k = 0; k < n; k++) {
              const a = Math.PI + (k - (n - 1) * 0.5) * 0.22;
              enemyShot(cx, e.y, Math.cos(a) * 190, Math.sin(a) * 190, false);
            }
          } else if (e.phase === 2) {
            enemyShot(cx, e.y + e.clawY, -240, 0, true);
            aimShot(cx, e.y, 170, 0);
          } else {
            for (let k = -2; k <= 2; k++) {
              enemyShot(cx, e.y, -220, k * 55, k === 0);
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
      if (s.type === 'laser' && inSolid(G.cam + s.x, s.y, 2)) {
        if (s.bounces > 0) {
          s.bounces -= 1;
          s.vy *= -1;
          s.y += s.vy * 0.02;
          popSpark(s.x, s.y, TEAL, 7);
          audio.bounce();
        } else {
          popSpark(s.x, s.y, s.rgb || TEAL, 6);
          G.shots.splice(i, 1);
          continue;
        }
      } else if (s.type !== 'beam' && s.type !== 'laser' && inSolid(G.cam + s.x, s.y, 2)) {
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
      if (G.deadT <= 0 && s.blockable && hypot(sxv - f.x, s.y - f.y) < 16 + s.r) {
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
      if (e.type === 'boss') {
        hits.push({ x: e.x - G.cam, y: e.y, r: 42 });
        hits.push({ x: e.x - G.cam - 28, y: e.y + e.clawY, r: 14 });
      } else {
        hits.push({ x: e.x - G.cam, y: e.y, r: Math.max(e.w, e.h) * 0.55 });
      }
      for (let h = 0; h < hits.length; h++) {
        const p = hits[h];
        if (hypot(p.x - f.x, p.y - f.y) < 15 + p.r * 0.7) {
          if (f.ramT <= 0) {
            f.ramT = 0.1;
            hurtEnt(e, isStorm() ? 2 : 1, f.x, f.y, true);
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
    c.fillStyle = st === 2 ? '#082430' : st === 3 ? '#0a1c28' : '#071c28';
    c.beginPath();
    c.moveTo(sx(-20), sy(-4));
    for (let i = 0; i < topPts.length; i += 2) c.lineTo(sx(topPts[i]), sy(topPts[i + 1]));
    c.lineTo(sx(VW + 24), sy(-4));
    c.closePath();
    c.fill();
    c.fillStyle = st === 2 ? '#061c26' : '#06161f';
    c.beginPath();
    c.moveTo(sx(-20), sy(VH + 4));
    for (let i = 0; i < botPts.length; i += 2) c.lineTo(sx(botPts[i]), sy(botPts[i + 1]));
    c.lineTo(sx(VW + 24), sy(VH + 4));
    c.closePath();
    c.fill();

    c.strokeStyle = rgba(st === 2 ? TEAL : CYN, 0.55);
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
      c.fillStyle = rgba(STEEL, 0.35);
      for (let x = 0; x < VW; x += 72) {
        const wx = G.cam + x;
        const i = Math.round(wx / 72);
        if (hash2(i + 3) <= 0.55) continue;
        const cv = caveAt(i * 72);
        const h = 18 + hash2(i + 11) * 64;
        if (hash2(i + 7) > 0.5) {
          c.fillRect(sx(i * 72 - G.cam - 10), sy(cv.top - h * 0.15), 20 * scale, h * 0.55 * scale);
        } else {
          c.fillRect(sx(i * 72 - G.cam - 10), sy(cv.bot - h * 0.4), 20 * scale, h * 0.55 * scale);
        }
      }
    } else if (st === 2) {
      c.fillStyle = rgba(TEAL, 0.28);
      for (let x = 0; x < VW; x += 56) {
        const wx = G.cam + x;
        const i = Math.round(wx / 56);
        if (hash2(i + 21) <= 0.62) continue;
        const cv = caveAt(i * 56);
        const spike = 22 + hash2(i) * 28;
        c.beginPath();
        if (hash2(i + 4) > 0.5) {
          c.moveTo(sx(i * 56 - G.cam), sy(cv.top));
          c.lineTo(sx(i * 56 - G.cam + 7), sy(cv.top + spike));
          c.lineTo(sx(i * 56 - G.cam - 7), sy(cv.top + spike));
        } else {
          c.moveTo(sx(i * 56 - G.cam), sy(cv.bot));
          c.lineTo(sx(i * 56 - G.cam + 7), sy(cv.bot - spike));
          c.lineTo(sx(i * 56 - G.cam - 7), sy(cv.bot - spike));
        }
        c.closePath();
        c.fill();
      }
    } else {
      c.fillStyle = rgba(STEEL, 0.4);
      for (let x = 0; x < VW; x += 86) {
        const wx = G.cam + x;
        const i = Math.floor(wx / 86);
        const cv = caveAt(i * 86);
        c.fillRect(sx(i * 86 - G.cam - 18), sy(cv.top), 36 * scale, 8 * scale);
        c.fillRect(sx(i * 86 - G.cam - 18), sy(cv.bot - 8), 36 * scale, 8 * scale);
      }
    }
  }

  function drawDrone(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(PNK, 0.95);
    c.beginPath();
    c.moveTo(10 * scale, 0);
    c.lineTo(-8 * scale, -7 * scale);
    c.lineTo(-4 * scale, 0);
    c.lineTo(-8 * scale, 7 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(MAG, 0.95);
    c.fillRect(-2 * scale, -2.2 * scale, 6 * scale, 4.4 * scale);
    c.restore();
  }

  function drawTurret(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(STEEL, 0.95);
    c.fillRect(-9 * scale, -8 * scale, 18 * scale, 16 * scale);
    c.fillStyle = rgba(ORG, 0.9);
    c.beginPath();
    c.arc(0, 0, 5 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.7);
    c.fillRect(0, -2 * scale, 10 * scale, 4 * scale);
    c.restore();
  }

  function drawWrecker(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(STEEL, 0.95);
    c.fillRect(-18 * scale, -10 * scale, 36 * scale, 20 * scale);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(-8 * scale, -5 * scale, 14 * scale, 10 * scale);
    c.fillStyle = rgba(MAG, 0.85);
    c.fillRect(10 * scale, -3 * scale, 10 * scale, 6 * scale);
    c.fillStyle = rgba(HOT, 0.5);
    c.fillRect(-20 * scale, -2 * scale, 6 * scale, 4 * scale);
    c.restore();
  }

  function drawMite(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(TEAL, 0.95);
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

  function drawPrism(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.rotate(e.spin || 0);
    c.fillStyle = rgba(TEAL, 0.9);
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

  function drawShard(e) {
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

  function drawWalker(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(STEEL, 0.95);
    c.fillRect(-14 * scale, -8 * scale, 28 * scale, 16 * scale);
    c.fillStyle = rgba(ORG, 0.9);
    c.fillRect(-4 * scale, -4 * scale, 12 * scale, 8 * scale);
    const leg = Math.sin(e.t * 8) * 4;
    c.strokeStyle = rgba(CYN, 0.8);
    c.lineWidth = Math.max(1, 1.6 * scale);
    c.beginPath();
    c.moveTo(-10 * scale, 8 * scale);
    c.lineTo((-10 + leg) * scale, 14 * scale);
    c.moveTo(8 * scale, 8 * scale);
    c.lineTo((8 - leg) * scale, 14 * scale);
    c.stroke();
    c.restore();
  }

  function drawGate(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.strokeStyle = rgba(ORG, 0.9);
    c.lineWidth = Math.max(1.4, 2 * scale);
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6 - Math.PI / 6;
      const px = Math.cos(a) * 11 * scale;
      const py = Math.sin(a) * 11 * scale;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();
    const o = 0.4 + (e.open || 0) * 0.6;
    c.fillStyle = rgba(MAG, 0.85 * o);
    c.beginPath();
    c.arc(0, 0, 4.5 * scale * o, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawBoss(e) {
    const c = ctx;
    const x = e.x - G.cam;
    const y = e.y;
    c.save();
    c.translate(sx(x), sy(y));
    c.fillStyle = rgba(STEEL, 0.96);
    c.fillRect(-46 * scale, -58 * scale, 92 * scale, 116 * scale);
    c.fillStyle = rgba(DEEP, 0.92);
    c.fillRect(-32 * scale, -44 * scale, 50 * scale, 88 * scale);
    c.fillStyle = rgba(ORG, 0.7);
    c.fillRect(-46 * scale, -58 * scale, 92 * scale, 8 * scale);
    c.fillRect(-46 * scale, 50 * scale, 92 * scale, 8 * scale);
    const beat = 1 + Math.sin(e.t * (e.rage ? 8 : 4)) * 0.08;
    c.fillStyle = rgba(e.rage ? MAG : GOLD, 0.95);
    c.beginPath();
    c.arc(-8 * scale, 0, 14 * scale * beat, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.85);
    c.beginPath();
    c.arc(-8 * scale, 0, 6 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(MAG, 0.9);
    c.fillRect(-40 * scale, -38 * scale, 16 * scale, 10 * scale);
    c.fillRect(-40 * scale, 28 * scale, 16 * scale, 10 * scale);
    c.fillStyle = rgba(CYN, 0.85);
    c.fillRect(20 * scale, -50 * scale, 18 * scale, 12 * scale);
    c.fillRect(20 * scale, 38 * scale, 18 * scale, 12 * scale);
    c.restore();

    c.fillStyle = rgba(ORG, 0.92);
    c.beginPath();
    c.arc(sx(x - 28), sy(y + e.clawY), 12 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.7);
    c.beginPath();
    c.arc(sx(x - 28), sy(y + e.clawY), 5 * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(STEEL, 0.85);
    c.lineWidth = Math.max(2, 3 * scale);
    c.beginPath();
    c.moveTo(sx(x - 8), sy(y));
    c.lineTo(sx(x - 28), sy(y + e.clawY));
    c.stroke();

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
    c.fillStyle = rgba(CYN, 0.35);
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
    c.fillStyle = rgba(CYN, 0.95);
    c.fillRect(-2 * scale, -3.2 * scale, 12 * scale, 6.4 * scale);
    c.fillStyle = rgba(DEEP, 0.85);
    c.fillRect(2 * scale, -1.6 * scale, 6 * scale, 3.2 * scale);
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle / 0.12);
      c.fillRect(16 * scale, -2 * scale, 10 * scale, 4 * scale);
    }
    const lv = chargeLevel();
    if (lv >= 1) {
      const rad = 4 + lv * 5 + Math.sin(G.t * 14) * 1.2;
      c.fillStyle = rgba(lv >= 3 ? GOLD : lv >= 2 ? HOT : CYN, 0.55);
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

  function drawBits() {
    if (G.force.state !== 'front' || G.deadT > 0) return;
    const c = ctx;
    for (let i = 0; i < 2; i++) {
      const a = G.t * 3.2 + i * Math.PI;
      const bx = G.px + 18 + Math.cos(a) * 6;
      const by = G.py + (i === 0 ? -16 : 16) + Math.sin(a) * 3;
      c.fillStyle = rgba(TEAL, 0.95);
      c.beginPath();
      c.moveTo(sx(bx), sy(by - 4));
      c.lineTo(sx(bx + 4), sy(by));
      c.lineTo(sx(bx), sy(by + 4));
      c.lineTo(sx(bx - 4), sy(by));
      c.closePath();
      c.fill();
    }
  }

  function drawForce() {
    if (G.deadT > 0 && G.force.state !== 'fly') return;
    const f = G.force;
    const c = ctx;
    c.save();
    c.translate(sx(f.x), sy(f.y));
    c.rotate(f.spin * 0.35);
    const glow = f.blockT > 0 ? 1 : 0.72;
    c.strokeStyle = rgba(f.state === 'fly' ? GOLD : CYN, 0.55 + (f.blockT > 0 ? 0.4 : 0));
    c.lineWidth = Math.max(1, 1.5 * scale);
    c.beginPath();
    c.ellipse(0, 0, 15 * scale, 10 * scale, 0, 0, TAU);
    c.stroke();
    c.beginPath();
    c.ellipse(0, 0, 10 * scale, 15 * scale, 0, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(TEAL, glow);
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6;
      const px = Math.cos(a) * 9.2 * scale;
      const py = Math.sin(a) * 9.2 * scale;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.fill();
    c.fillStyle = rgba(f.blockT > 0 ? WHT : GOLD, 0.95);
    c.beginPath();
    c.arc(0, 0, 3.8 * scale, 0, TAU);
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
      } else if (s.type === 'laser') {
        c.save();
        c.translate(sx(s.x), sy(s.y));
        const ang = Math.atan2(s.vy, s.vx);
        c.rotate(ang);
        c.fillStyle = rgba(TEAL, 0.95);
        c.fillRect(-10 * scale, -1.6 * scale, 22 * scale, 3.2 * scale);
        c.fillStyle = rgba(WHT, 0.85);
        c.fillRect(-8 * scale, -0.7 * scale, 18 * scale, 1.4 * scale);
        c.restore();
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
    c.fillStyle = '#041820';
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
    g.addColorStop(0, '#07202c');
    g.addColorStop(1, '#041820');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawTerrain();

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = (e.x || 0) - G.cam;
      if (e.type !== 'boss' && (x < -50 || x > VW + 50)) continue;
      if (e.type === 'drone') drawDrone(e);
      else if (e.type === 'turret') drawTurret(e);
      else if (e.type === 'wrecker') drawWrecker(e);
      else if (e.type === 'mite') drawMite(e);
      else if (e.type === 'prism') drawPrism(e);
      else if (e.type === 'shard') drawShard(e);
      else if (e.type === 'walker') drawWalker(e);
      else if (e.type === 'gate') drawGate(e);
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
    if (space) keys.sht = down;
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter')) {
      e.preventDefault();
    }
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

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
  });
  requestAnimationFrame(frame);
})();
