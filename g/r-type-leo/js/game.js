'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.28;
  const STAGE_LEN = 1680;
  const BLAST_COST = 0.52;
  const BLAST_REGEN = 0.34;
  const BLAST_DUR = 0.44;
  const WIDE_MAX = 3;
  const BITS_MAX = 3;
  const SHOT_CD = 0.085;
  const BIT_CD = 0.11;
  const BEST_KEY = 'playbox-r-type-leo-best';
  const MUTE_KEY = 'playbox-r-type-leo-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 比特激光 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const GOLD = [255, 212, 58];
  const AMBER = [255, 176, 32];
  const LION = [255, 140, 40];
  const CYN = [90, 240, 255];
  const HOT = [255, 227, 107];
  const WHT = [255, 246, 228];
  const MAG = [255, 90, 74];
  const DEEP = [26, 20, 8];
  const PNK = [255, 170, 140];
  const STONE = [90, 70, 32];
  const STEEL = [80, 72, 48];
  const TEAL = [64, 210, 196];

  const SCORE = {
    scout: 50,
    turret: 80,
    diver: 70,
    barge: 160,
    spinner: 140,
    corelet: 90,
    boss: [4000, 6500, 10000],
    clear: 2000,
    all: 4500,
    drop: 0
  };

  const STAGES = [
    {
      name: '狮原',
      boss: '金瞳',
      bossKind: 'eye',
      bossHp: 78,
      seed: 1,
      waves: [
        { x: 40, kind: 'v', n: 5, y: 0.42 },
        { x: 180, kind: 'turret', side: -1 },
        { x: 260, kind: 'stream', n: 6 },
        { x: 380, kind: 'divers', n: 3 },
        { x: 500, kind: 'barge', drop: 'W' },
        { x: 620, kind: 'v', n: 6, y: 0.58 },
        { x: 740, kind: 'turret', side: 1 },
        { x: 820, kind: 'ring', n: 6 },
        { x: 940, kind: 'stream', n: 7 },
        { x: 1060, kind: 'barge' },
        { x: 1160, kind: 'turret', side: -1 },
        { x: 1200, kind: 'turret', side: 1 },
        { x: 1320, kind: 'divers', n: 4 },
        { x: 1440, kind: 'v', n: 6, y: 0.36 },
        { x: 1540, kind: 'carrier', drop: 'B' }
      ]
    },
    {
      name: '钢脊',
      boss: '脊环',
      bossKind: 'ring',
      bossHp: 96,
      seed: 2,
      waves: [
        { x: 30, kind: 'spinner' },
        { x: 140, kind: 'stream', n: 8 },
        { x: 260, kind: 'turret', side: -1 },
        { x: 300, kind: 'turret', side: 1 },
        { x: 420, kind: 'divers', n: 4 },
        { x: 540, kind: 'barge', drop: 'W' },
        { x: 660, kind: 'ring', n: 7 },
        { x: 780, kind: 'spinner' },
        { x: 900, kind: 'v', n: 7, y: 0.48 },
        { x: 1020, kind: 'stream', n: 8 },
        { x: 1140, kind: 'turret', side: -1 },
        { x: 1260, kind: 'divers', n: 5 },
        { x: 1380, kind: 'barge' },
        { x: 1480, kind: 'spinner' },
        { x: 1560, kind: 'carrier', drop: 'B' }
      ]
    },
    {
      name: '核庭',
      boss: '狮核',
      bossKind: 'core',
      bossHp: 132,
      seed: 3,
      waves: [
        { x: 20, kind: 'corelets', n: 4 },
        { x: 140, kind: 'v', n: 7, y: 0.4 },
        { x: 260, kind: 'spinner' },
        { x: 360, kind: 'turret', side: -1 },
        { x: 400, kind: 'turret', side: 1 },
        { x: 520, kind: 'corelets', n: 5 },
        { x: 640, kind: 'barge', drop: 'W' },
        { x: 760, kind: 'divers', n: 5 },
        { x: 880, kind: 'ring', n: 8 },
        { x: 1000, kind: 'spinner' },
        { x: 1120, kind: 'corelets', n: 5 },
        { x: 1240, kind: 'stream', n: 8 },
        { x: 1360, kind: 'barge' },
        { x: 1460, kind: 'v', n: 8, y: 0.52 },
        { x: 1560, kind: 'carrier', drop: 'B' }
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
  const btnBlast = document.getElementById('btn-blast');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const bitLabel = document.getElementById('bit-label');
  const pwrLabel = document.getElementById('pwr-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const blastBar = document.getElementById('blast-bar');
  const blastWrap = document.getElementById('blast-wrap');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let last = 0;
  let acc = 0;
  let addTok = 0;
  let toastTok = 0;
  let comboTok = 0;
  let formTok = 0;
  let uid = 1;

  const keys = { l: false, r: false, u: false, d: false, sht: false, blast: false };
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
    fireCd: 0,
    bitCd: 0,
    bitE: 1,
    bits: 2,
    wide: 0,
    blastT: 0,
    blastHeld: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    muzzle: 0,
    boss: false,
    winT: 0,
    bitsArr: [],
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
    return isStorm() ? 312 : 270;
  }
  function scrollSpd() {
    if (G.boss) return isStorm() ? 20 : 12;
    return isStorm() ? 152 : 104;
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
  function originOf(st) {
    return (st - 1) * STAGE_LEN;
  }

  function caveAt(wx) {
    const st = stageAt(wx);
    const local = wx - originOf(st);
    let top;
    let bot;
    if (st === 1) {
      const n = fbm(wx * 0.009, 11);
      top = 26 + n * 22;
      bot = VH - 26 - fbm(wx * 0.009, 17) * 22;
      const i = Math.round(wx / 92);
      const h = 22 + hash2(i + 9) * 58;
      if (hash2(i + 4) > 0.58) {
        if (hash2(i + 8) > 0.5) top += h * 0.5;
        else bot -= h * 0.5;
      }
    } else if (st === 2) {
      top = 38 + fbm(wx * 0.016, 3) * 40 + Math.sin(wx * 0.022) * 8;
      bot = VH - 38 - fbm(wx * 0.016, 9) * 40 - Math.cos(wx * 0.02) * 8;
      const i = Math.round(wx / 52);
      const spike = hash2(i + 31) > 0.6 ? 20 + hash2(i) * 30 : 0;
      if (spike) {
        if (hash2(i + 5) > 0.5) top += spike;
        else bot -= spike;
      }
    } else {
      const step = (Math.floor(wx / 90) % 3) * 14;
      top = 34 + step + fbm(wx * 0.012, 5) * 10;
      bot = VH - 34 - ((Math.floor(wx / 90 + 1) % 3) * 12);
      if (G.boss || local > STAGE_LEN - 100) {
        top = 20;
        bot = VH - 20;
      }
    }
    if (top > bot - 96) {
      const mid = (top + bot) * 0.5;
      top = mid - 52;
      bot = mid + 52;
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
      this.beep(980, 0.042, 'square', 0.028, 1960);
    },
    bitShot() {
      this.ensure();
      this.beep(1320, 0.036, 'triangle', 0.022, 640);
    },
    blast() {
      this.ensure();
      this.noise(0.12, 0.055, 280);
      this.beep(220, 0.22, 'sawtooth', 0.05, 80);
      this.beep(1480, 0.16, 'square', 0.036, 420);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 180 : kind === 'corelet' ? 560 : 480;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.038, 0.03, 1200);
      this.beep(base * lift, 0.07, 'square', 0.044, base * lift * 1.55);
    },
    combo(m) {
      this.ensure();
      this.beep(460 * m, 0.08, 'sine', 0.038, 690 * m);
      this.beep(920, 0.11, 'triangle', 0.028, 1380);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.062, 240);
      this.beep(250, 0.22, 'sawtooth', 0.05, 55);
      this.beep(120, 0.32, 'sine', 0.042, 36);
    },
    pickup() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.04, 990);
      this.beep(990, 0.1, 'triangle', 0.032, 1320);
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
      this.beep(210, 0.18, 'sawtooth', 0.04, 88);
      this.beep(130, 0.3, 'sine', 0.05, 46);
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

  function popCombo() {
    if (!comboEl) return;
    comboEl.classList.remove('hot');
    void comboEl.offsetWidth;
    comboEl.classList.add('hot');
    comboTok += 1;
    const tok = comboTok;
    setTimeout(function () {
      if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
    }, 280);
  }

  function popForm() {
    if (!bitLabel) return;
    bitLabel.classList.remove('pop');
    void bitLabel.offsetWidth;
    bitLabel.classList.add('pop');
    formTok += 1;
    const tok = formTok;
    setTimeout(function () {
      if (tok === formTok && bitLabel) bitLabel.classList.remove('pop');
    }, 280);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const info = stageInfo();
      stageLabel.textContent = G.boss ? info.boss : (G.mode === 'title' ? '狮原' : info.name);
      stageLabel.classList.toggle('hot', G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isStorm() ? '狮核' : '武装狮';
      tagLabel.className = isStorm() ? 'warn' : '';
    }
    if (bitLabel) {
      const blasting = G.blastT > 0;
      bitLabel.textContent = blasting ? '激射' : (G.bits >= 3 ? '三比特' : '双比特');
      bitLabel.className = 'form ' + (blasting ? 'hot' : 'front');
    }
    if (pwrLabel) pwrLabel.textContent = '扇 ' + G.wide;
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
    if (blastBar) blastBar.style.transform = 'scaleX(' + clamp(G.bitE, 0, 1) + ')';
    if (blastWrap) blastWrap.classList.toggle('hot', G.bitE >= BLAST_COST && G.blastT <= 0);
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 比特挡小弹，撞机体才掉命', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 狮核已碎', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift / Z 打比特激光清场', 'warn');
    else if (G.blastT > 0) setHint('比特激光贯穿 · 对着核心打', 'hot');
    else if (G.bitE >= BLAST_COST) setHint('激光就绪 · Shift / Z 激射', '');
    else setHint('空格宽幅扇弹 · 吃 W 加扇、B 充激光', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'RTLE';
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
  }

  function hitStop(ms) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, ms / 1000);
  }

  function kick(kind) {
    if (REDUCE || !stageEl) return;
    G.shake = Math.max(G.shake, kind === 'die' ? 11 : kind === 'blast' ? 6 : 3.6);
    stageEl.classList.remove('hit', 'die', 'morph', 'blast');
    void stageEl.offsetWidth;
    const cls = kind === 'die' ? 'die' : kind === 'blast' ? 'blast' : kind === 'kill' ? 'morph' : 'hit';
    stageEl.classList.add(cls);
  }

  function flash(rgb, t) {
    G.flash = t || 0.12;
    G.flashRgb = rgb || GOLD;
  }

  function burst(x, y, n, rgb, spd, rad) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.25, spd);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        r: rad || rand(1.6, 4.2),
        rgb: rgb,
        life: rand(0.18, 0.52),
        max: 0.52
      });
    }
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, rgb: rgb || WHT, t: 0, rad: rand(4, 9) });
  }

  function ring(x, y, rgb, r) {
    rings.push({ x: x, y: y, rgb: rgb || GOLD, t: 0, r: r || 8 });
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb || GOLD, t: 0 });
  }

  function noteHit(kind) {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      popCombo();
      floatText(G.px + 24, G.py - 18, '×' + G.mult, HOT);
    }
    audio.hit(kind, G.combo);
    hitStop(kind === 'boss' ? 48 : 34);
    kick('hit');
    syncHud();
  }

  function resetBits() {
    G.bitsArr = [];
    for (let i = 0; i < G.bits; i++) {
      G.bitsArr.push({ x: G.px, y: G.py, ang: 0 });
    }
  }

  function bitTarget(i) {
    const n = G.bits;
    const wob = Math.sin(G.t * 5.2 + i * 2.1) * 3;
    if (n === 2) {
      return { x: G.px + 10, y: G.py + (i === 0 ? -20 : 20) + wob * 0.4 };
    }
    if (i === 0) return { x: G.px + 10, y: G.py - 22 + wob * 0.4 };
    if (i === 1) return { x: G.px + 10, y: G.py + 22 + wob * 0.4 };
    return { x: G.px - 18, y: G.py + wob };
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        z: 0.25 + Math.random() * 1.4,
        s: 0.6 + Math.random() * 1.8
      });
    }
  }

  function clearWorld() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    G.spawnI = 0;
    G.boss = false;
    G.blastT = 0;
    G.muzzle = 0;
    G.fireCd = 0;
    G.bitCd = 0;
    G.winT = 0;
    G.deadT = 0;
    G.stop = 0;
  }

  function resetShip() {
    G.px = 96;
    G.py = VH * 0.5;
    G.invuln = 0;
    G.fireHold = false;
    G.blastHeld = false;
    resetBits();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.t = 0;
    G.cam = 40;
    G.stage = 1;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.wide = 0;
    G.bits = 2;
    G.bitE = 1;
    G.flash = 0;
    G.shake = 0;
    clearWorld();
    resetShip();
    showOverlay(
      'title',
      '武装狮',
      '没有力爪。比特贴着舰自动打，空格放宽幅扇弹，Shift / Z 打出比特激光。过关打核心。'
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'storm' ? 'storm' : 'raid';
    G.mode = 'play';
    G.t = 0;
    G.cam = 0;
    G.stage = 1;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.wide = 0;
    G.bits = 2;
    G.bitE = 1;
    G.flash = 0;
    G.shake = 0;
    G.punch = 1;
    clearWorld();
    resetShip();
    hideOverlay();
    audio.start();
    toast(isStorm() ? '狮核突入' : '武装狮出航', false, true);
    flash(GOLD, 0.16);
    kick('blast');
    syncHud();
    if (canvas) canvas.focus();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }

  function nextStage() {
    addScore(SCORE.clear * G.mult);
    toast(stageInfo().name + '肃清', false, true);
    if (G.stage >= 3) {
      addScore(SCORE.all);
      G.winT = 1.35;
      return;
    }
    G.stage += 1;
    G.spawnI = 0;
    G.boss = false;
    G.eShots.length = 0;
    G.cam = originOf(G.stage);
    const cv = caveAt(G.cam + G.px);
    G.py = clamp(G.py, cv.top + 24, cv.bot - 24);
    resetBits();
    flash(CYN, 0.14);
    audio.up();
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    audio.win();
    showOverlay('win', '狮核崩解', '核心碎了。比特还贴着你。R 再来一局。');
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '撞体、撞壁、中弹都会掉命。比特只能挡小弹。R 重开。');
    syncHud();
  }

  function die() {
    if (G.deadT > 0 || G.invuln > 0 || G.mode !== 'play' || G.winT > 0) return;
    burst(G.px, G.py, 28, LION, 220, 4);
    burst(G.px, G.py, 16, MAG, 160, 3);
    ring(G.px, G.py, MAG, 12);
    flash(MAG, 0.18);
    hitStop(72);
    kick('die');
    audio.death();
    G.deadT = 0.9;
    G.blastT = 0;
    G.combo = 0;
    G.mult = 1;
    G.wide = Math.max(0, G.wide - 1);
    G.eShots.length = 0;
    syncHud();
  }

  function respawn() {
    G.lives -= 1;
    if (G.lives <= 0) {
      loseGame();
      return;
    }
    const cv = caveAt(G.cam + 96);
    G.px = 96;
    G.py = cv.mid;
    G.deadT = 0;
    G.invuln = 1.45;
    G.bitE = Math.max(G.bitE, 0.7);
    resetBits();
    toast('舰体重构', true, false);
    syncHud();
  }

  function spawnEnt(kind, x, y, extra) {
    const e = extra || {};
    const storm = isStorm();
    const base = {
      id: uid++,
      kind: kind,
      x: x,
      y: y,
      t: 0,
      hp: 1,
      r: 10,
      score: SCORE[kind] || 50
    };
    if (kind === 'scout') {
      base.hp = 1;
      base.r = 9;
      base.vy = e.vy || 0;
      base.amp = e.amp || 26;
      base.phase = e.phase || 0;
      base.fire = rand(0.6, 1.4);
    } else if (kind === 'turret') {
      base.hp = storm ? 4 : 3;
      base.r = 12;
      base.side = e.side || -1;
      base.fire = rand(0.4, 1.1);
      base.score = SCORE.turret;
    } else if (kind === 'diver') {
      base.hp = 2;
      base.r = 10;
      base.vx = -40;
      base.vy = 0;
      base.dived = false;
      base.fire = 9;
      base.score = SCORE.diver;
    } else if (kind === 'barge') {
      base.hp = storm ? 10 : 8;
      base.r = 18;
      base.fire = 0.8;
      base.drop = e.drop || null;
      base.score = SCORE.barge;
    } else if (kind === 'spinner') {
      base.hp = storm ? 8 : 6;
      base.r = 14;
      base.spin = 0;
      base.fire = 0.3;
      base.score = SCORE.spinner;
    } else if (kind === 'corelet') {
      base.hp = storm ? 5 : 4;
      base.r = 12;
      base.open = 0;
      base.fire = 0.7;
      base.score = SCORE.corelet;
    } else if (kind === 'drop') {
      base.hp = 99;
      base.r = 9;
      base.item = e.item || 'W';
      base.vy = 28;
    } else if (kind === 'boss') {
      const info = stageInfo();
      const hp = Math.round(info.bossHp * (storm ? 1.22 : 1));
      base.hp = hp;
      base.maxHp = hp;
      base.r = 42;
      base.bossKind = info.bossKind;
      base.fire = 0.4;
      base.rage = false;
      base.open = 0;
      base.spin = 0;
      base.phase = 0;
      base.shields = [];
      base.score = SCORE.boss[clamp(G.stage - 1, 0, 2)];
      if (base.bossKind === 'core') {
        for (let i = 0; i < 6; i++) {
          base.shields.push({ a: i * TAU / 6, hp: storm ? 6 : 5, r: 10 });
        }
      } else if (base.bossKind === 'ring') {
        for (let i = 0; i < 8; i++) {
          base.shields.push({ a: i * TAU / 8, hp: storm ? 4 : 3, r: 8 });
        }
      }
    }
    G.ents.push(base);
    return base;
  }

  function spawnWave(w, oxw) {
    const x = oxw + w.x + VW + 40;
    const storm = isStorm();
    const cv = caveAt(x);
    const mid = cv.mid;
    if (w.kind === 'v') {
      const n = w.n + (storm ? 2 : 0);
      for (let i = 0; i < n; i++) {
        const k = i - (n - 1) * 0.5;
        spawnEnt('scout', x + Math.abs(k) * 18, mid + k * 22, { phase: i * 0.4 });
      }
    } else if (w.kind === 'stream') {
      const n = w.n + (storm ? 2 : 0);
      for (let i = 0; i < n; i++) {
        spawnEnt('scout', x + i * 28, mid + Math.sin(i) * 36, { phase: i });
      }
    } else if (w.kind === 'ring') {
      const n = w.n + (storm ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const a = i * TAU / n;
        spawnEnt('scout', x + Math.cos(a) * 28, mid + Math.sin(a) * 34, { phase: a });
      }
    } else if (w.kind === 'turret') {
      const side = w.side || -1;
      const y = side < 0 ? cv.top + 14 : cv.bot - 14;
      spawnEnt('turret', x, y, { side: side });
    } else if (w.kind === 'divers') {
      const n = w.n + (storm ? 1 : 0);
      for (let i = 0; i < n; i++) {
        spawnEnt('diver', x + i * 22, mid + (i - n * 0.5) * 18);
      }
    } else if (w.kind === 'barge' || w.kind === 'carrier') {
      spawnEnt('barge', x, mid, { drop: w.drop || (w.kind === 'carrier' ? 'W' : null) });
    } else if (w.kind === 'spinner') {
      spawnEnt('spinner', x, mid);
    } else if (w.kind === 'corelets') {
      const n = w.n + (storm ? 1 : 0);
      for (let i = 0; i < n; i++) {
        spawnEnt('corelet', x + (i % 2) * 30, mid + (i - n * 0.5) * 28);
      }
    }
  }

  function spawnBoss() {
    if (G.boss) return;
    G.boss = true;
    const info = stageInfo();
    const cv = caveAt(G.cam + 640);
    spawnEnt('boss', G.cam + 640, cv.mid);
    toast(info.boss + ' 现身', true, false);
    audio.warn();
    flash(LION, 0.2);
    kick('die');
    syncHud();
  }

  function spawnDrops() {
    const info = stageInfo();
    const oxw = originOf(G.stage);
    const local = G.cam - oxw;
    while (G.spawnI < info.waves.length) {
      const w = info.waves[G.spawnI];
      if (local + 40 < w.x) break;
      spawnWave(w, oxw);
      G.spawnI += 1;
    }
    if (!G.boss && local >= STAGE_LEN - 70 && G.ents.filter(function (e) { return e.kind !== 'drop'; }).length === 0) {
      spawnBoss();
    } else if (!G.boss && local >= STAGE_LEN + 40) {
      spawnBoss();
    }
  }

  function fireEnemy(x, y, ang, spd, fat) {
    const s = spd || 160;
    G.eShots.push({
      x: x,
      y: y,
      vx: Math.cos(ang) * s,
      vy: Math.sin(ang) * s,
      r: fat ? 7.5 : 3.4,
      fat: !!fat
    });
  }

  function aimPlayer(x, y) {
    return Math.atan2(G.py - y, (G.px + G.cam) - x);
  }

  function wideAngles() {
    if (G.wide <= 0) return [-0.2, 0, 0.2];
    if (G.wide === 1) return [-0.36, -0.18, 0, 0.18, 0.36];
    if (G.wide === 2) return [-0.38, -0.19, 0, 0.19, 0.38];
    return [-0.5, -0.32, -0.16, 0, 0.16, 0.32, 0.5];
  }

  function fireWide() {
    const dmg = G.wide >= 2 ? 2 : 1;
    const angs = wideAngles();
    const spd = 640;
    for (let i = 0; i < angs.length; i++) {
      const a = angs[i];
      G.shots.push({
        type: 'wide',
        x: G.px + 16,
        y: G.py + a * 6,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        w: 10,
        h: 3.2,
        dmg: dmg,
        pierce: 0,
        rgb: i === ((angs.length / 2) | 0) ? GOLD : AMBER,
        life: 1.1
      });
    }
    G.muzzle = 0.08;
    audio.shoot();
  }

  function fireBits() {
    for (let i = 0; i < G.bitsArr.length; i++) {
      const b = G.bitsArr[i];
      let ang = 0;
      let nearest = 1e9;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (e.kind === 'drop') continue;
        const dx = (e.x - G.cam) - b.x;
        const dy = e.y - b.y;
        const d = dx * dx + dy * dy;
        if (dx > -20 && d < nearest) {
          nearest = d;
          ang = Math.atan2(dy, Math.max(40, dx)) * 0.45;
        }
      }
      G.shots.push({
        type: 'bit',
        x: b.x + 6,
        y: b.y,
        vx: Math.cos(ang) * 560,
        vy: Math.sin(ang) * 560,
        w: 8,
        h: 2.2,
        dmg: 1,
        pierce: 0,
        rgb: CYN,
        life: 0.9
      });
    }
    audio.bitShot();
  }

  function tryBlast() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.blastT > 0) return;
    if (G.bitE < BLAST_COST) return;
    G.bitE -= BLAST_COST;
    G.blastT = BLAST_DUR;
    audio.blast();
    flash(CYN, 0.14);
    hitStop(52);
    kick('blast');
    ring(G.px + 12, G.py, CYN, 10);
    for (let i = 0; i < G.bitsArr.length; i++) {
      const b = G.bitsArr[i];
      spark(b.x, b.y, CYN);
      G.shots.push({
        type: 'blast',
        x: b.x + 40,
        y: b.y,
        vx: 0,
        vy: 0,
        w: VW,
        h: 10,
        dmg: 3,
        pierce: 99,
        rgb: CYN,
        life: BLAST_DUR,
        bit: i
      });
    }
    popForm();
    syncHud();
  }

  function grabDrop(item, x, y) {
    if (item === 'W') {
      if (G.wide < WIDE_MAX) G.wide += 1;
      toast('扇幅 +' + G.wide, false, true);
      floatText(x, y - 10, 'W', GOLD);
    } else {
      G.bitE = clamp(G.bitE + 0.55, 0, 1);
      if (G.bitE >= 0.99 && G.bits < BITS_MAX) {
        G.bits += 1;
        resetBits();
        toast('第三比特', false, true);
        popForm();
      } else toast('激光充能', false, false);
      floatText(x, y - 10, 'B', CYN);
    }
    audio.pickup();
    burst(x, y, 12, item === 'W' ? GOLD : CYN, 140, 3);
    ring(x, y, item === 'W' ? GOLD : CYN, 6);
    kick('hit');
    syncHud();
  }

  function killEnt(e, blast) {
    const sxv = e.x - G.cam;
    if (e.kind === 'drop') return;
    const pts = Math.round((e.score || 50) * G.mult);
    addScore(pts);
    noteHit(e.kind === 'boss' ? 'boss' : e.kind);
    burst(sxv, e.y, e.kind === 'boss' ? 42 : 16, e.kind === 'boss' ? GOLD : LION, e.kind === 'boss' ? 260 : 180, 4);
    burst(sxv, e.y, 10, CYN, 120, 2.5);
    ring(sxv, e.y, GOLD, e.r);
    spark(sxv, e.y, WHT);
    if (pts > 0) floatText(sxv, e.y - 8, '+' + pts, HOT);
    if (e.drop) spawnEnt('drop', e.x, e.y, { item: e.drop });
    if (e.kind === 'boss') {
      hitStop(80);
      kick('kill');
      flash(GOLD, 0.22);
      nextStage();
    } else if (blast) hitStop(42);
    e.dead = true;
  }

  function hurtEnt(e, dmg, hx, hy, blast) {
    if (e.kind === 'drop' || e.dead) return;
    if (e.kind === 'boss') {
      const open = e.open > 0.55 || e.bossKind === 'ring';
      if (e.bossKind === 'eye' && !open && !blast) {
        spark(hx, hy, STEEL);
        return;
      }
      if (e.bossKind === 'core') {
        let blocked = false;
        for (let i = 0; i < e.shields.length; i++) {
          const sh = e.shields[i];
          if (sh.hp <= 0) continue;
          const rad = 46 + Math.sin(e.t * 2) * 4;
          const sxv = e.x - G.cam + Math.cos(sh.a + e.spin) * rad;
          const syv = e.y + Math.sin(sh.a + e.spin) * rad;
          if (hypot(hx - sxv, hy - syv) < 16) {
            sh.hp -= dmg;
            spark(sxv, syv, CYN);
            audio.hit('corelet', G.combo);
            if (sh.hp <= 0) {
              burst(sxv, syv, 10, CYN, 140, 3);
              addScore(40 * G.mult);
            }
            blocked = true;
            break;
          }
        }
        if (blocked && e.open < 0.45 && !blast) return;
      }
    }
    e.hp -= dmg;
    spark(hx, hy, GOLD);
    G.punch = 0.986;
    if (e.hp <= 0) killEnt(e, blast);
    else {
      noteHit(e.kind === 'boss' ? 'boss' : e.kind);
      if (e.kind === 'boss' && !e.rage && e.hp < e.maxHp * 0.5) {
        e.rage = true;
        toast('核心狂暴', true, false);
        audio.warn();
        flash(MAG, 0.16);
      }
    }
  }

  function shotHits(s, e) {
    const ex = e.x - G.cam;
    const ey = e.y;
    if (s.type === 'blast') {
      return Math.abs(ey - s.y) < (e.r + s.h * 0.55) && ex > s.x - 30 && ex < VW + 20;
    }
    const hw = s.w * 0.5 + e.r;
    const hh = s.h * 0.5 + e.r;
    return Math.abs(s.x - ex) < hw && Math.abs(s.y - ey) < hh;
  }

  function updateBits(dt) {
    while (G.bitsArr.length < G.bits) G.bitsArr.push({ x: G.px, y: G.py, ang: 0 });
    while (G.bitsArr.length > G.bits) G.bitsArr.pop();
    for (let i = 0; i < G.bitsArr.length; i++) {
      const b = G.bitsArr[i];
      const t = bitTarget(i);
      b.x = lerp(b.x, t.x, 1 - Math.pow(0.0008, dt));
      b.y = lerp(b.y, t.y, 1 - Math.pow(0.0008, dt));
      b.ang += dt * 8;
    }
    if (G.blastT > 0) {
      for (let i = 0; i < G.shots.length; i++) {
        const s = G.shots[i];
        if (s.type !== 'blast') continue;
        const b = G.bitsArr[s.bit];
        if (!b) continue;
        s.x = b.x + 8;
        s.y = b.y;
        s.w = VW - b.x;
      }
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) respawn();
      return;
    }
    let mx = 0;
    let my = 0;
    if (pointer.down) {
      mx = pointer.x - G.px;
      my = pointer.y - G.py;
      const d = hypot(mx, my);
      if (d > 4) {
        const cap = moveSpd() * dt;
        const k = Math.min(1, cap / d);
        G.px += mx * k;
        G.py += my * k;
      }
      G.fireHold = true;
    } else {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
      if (mx || my) {
        const inv = hypot(mx, my) || 1;
        G.px += (mx / inv) * moveSpd() * dt;
        G.py += (my / inv) * moveSpd() * dt;
      }
      G.fireHold = keys.sht;
    }
    G.px = clamp(G.px, 24, 360);
    G.py = clamp(G.py, 18, VH - 18);
    const cv = caveAt(G.cam + G.px);
    if (G.py < cv.top + 16) G.py = cv.top + 16;
    if (G.py > cv.bot - 16) G.py = cv.bot - 16;
    if (G.invuln > 0) G.invuln -= dt;

    if (inSolid(G.cam + G.px, G.py, 7) && G.invuln <= 0) die();

    if (G.blastT > 0) G.blastT -= dt;
    if (G.bitE < 1 && G.blastT <= 0) G.bitE = Math.min(1, G.bitE + BLAST_REGEN * dt);

    if (G.fireHold) {
      G.fireCd -= dt;
      G.bitCd -= dt;
      if (G.fireCd <= 0) {
        fireWide();
        G.fireCd = SHOT_CD / fireRate();
      }
      if (G.bitCd <= 0) {
        fireBits();
        G.bitCd = BIT_CD / fireRate();
      }
    } else {
      G.fireCd = Math.min(G.fireCd, 0.02);
      G.bitCd = Math.min(G.bitCd, 0.02);
    }

    if (G.muzzle > 0) G.muzzle -= dt;
    updateBits(dt);
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.x > VW + 40 || s.y < -30 || s.y > VH + 30) {
        G.shots.splice(i, 1);
        continue;
      }
      for (let k = G.ents.length - 1; k >= 0; k--) {
        const e = G.ents[k];
        if (e.dead || e.kind === 'drop') continue;
        if (shotHits(s, e)) {
          if (s.type === 'blast' && e.hurtT && G.t - e.hurtT < 0.07) continue;
          if (s.type === 'blast') e.hurtT = G.t;
          hurtEnt(e, s.dmg, e.x - G.cam, e.y, s.type === 'blast');
          if (s.pierce > 0) {
            s.pierce -= 1;
            if (s.type !== 'blast') {
              s.x += 8;
            }
          } else if (s.type !== 'blast') {
            G.shots.splice(i, 1);
            break;
          }
        }
      }
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const scr = s.x - G.cam;
      if (scr < -40 || scr > VW + 40 || s.y < -30 || s.y > VH + 30) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (inSolid(s.x, s.y, s.r * 0.5)) {
        G.eShots.splice(i, 1);
        continue;
      }
      let blocked = false;
      if (!s.fat && G.deadT <= 0) {
        for (let b = 0; b < G.bitsArr.length; b++) {
          const bit = G.bitsArr[b];
          if (hypot(scr - bit.x, s.y - bit.y) < 11) {
            burst(bit.x, bit.y, 5, CYN, 80, 2);
            spark(bit.x, bit.y, CYN);
            audio.bitShot();
            blocked = true;
            break;
          }
        }
      }
      if (blocked) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && G.invuln <= 0 && hypot(scr - G.px, s.y - G.py) < 8 + s.r) {
        G.eShots.splice(i, 1);
        die();
      }
    }
  }

  function updateEnt(e, dt) {
    e.t += dt;
    const scr = e.x - G.cam;
    if (e.kind === 'drop') {
      e.y += Math.sin(e.t * 3) * 10 * dt;
      e.x -= 18 * dt;
      if (G.deadT <= 0 && hypot(scr - G.px, e.y - G.py) < 22) {
        grabDrop(e.item, scr, e.y);
        e.dead = true;
      }
      return;
    }
    if (e.kind === 'scout') {
      e.x -= (isStorm() ? 78 : 62) * dt;
      e.y += Math.sin(e.t * 2.4 + e.phase) * e.amp * dt;
      e.fire -= dt;
      if (e.fire <= 0 && scr < VW - 40) {
        e.fire = (isStorm() ? 1.15 : 1.5) + rand(0, 0.5);
        fireEnemy(e.x, e.y, Math.PI, 150);
      }
    } else if (e.kind === 'turret') {
      const cv = caveAt(e.x);
      e.y = e.side < 0 ? cv.top + 14 : cv.bot - 14;
      e.fire -= dt * fireRate();
      if (e.fire <= 0 && scr < VW - 20 && scr > 40) {
        e.fire = isStorm() ? 1.05 : 1.35;
        fireEnemy(e.x, e.y, aimPlayer(e.x, e.y), 170);
      }
    } else if (e.kind === 'diver') {
      if (!e.dived && scr < 520) {
        const a = aimPlayer(e.x, e.y);
        e.vx = Math.cos(a) * 210;
        e.vy = Math.sin(a) * 210;
        e.dived = true;
      }
      e.x += (e.vx - 40) * dt;
      e.y += e.vy * dt;
    } else if (e.kind === 'barge') {
      e.x -= 38 * dt;
      e.y += Math.sin(e.t * 1.4) * 18 * dt;
      e.fire -= dt * fireRate();
      if (e.fire <= 0 && scr < VW - 30) {
        e.fire = isStorm() ? 1.1 : 1.4;
        for (let k = -1; k <= 1; k++) fireEnemy(e.x - 12, e.y, Math.PI + k * 0.22, 150);
      }
    } else if (e.kind === 'spinner') {
      e.x -= 44 * dt;
      e.spin += dt * 2.4;
      e.y += Math.sin(e.t * 1.6) * 12 * dt;
      e.fire -= dt * fireRate();
      if (e.fire <= 0 && scr < VW - 40) {
        e.fire = isStorm() ? 0.72 : 0.95;
        for (let k = 0; k < 4; k++) fireEnemy(e.x, e.y, e.spin + k * TAU / 4, 130);
      }
    } else if (e.kind === 'corelet') {
      e.x -= 36 * dt;
      e.open = 0.5 + Math.sin(e.t * 2.2) * 0.5;
      e.fire -= dt * fireRate();
      if (e.fire <= 0 && e.open > 0.7 && scr < VW - 40) {
        e.fire = isStorm() ? 0.9 : 1.2;
        fireEnemy(e.x, e.y, aimPlayer(e.x, e.y), 165);
      }
    } else if (e.kind === 'boss') {
      const tx = G.cam + 620;
      const cv = caveAt(tx);
      e.x = lerp(e.x, tx, 1 - Math.pow(0.02, dt));
      e.y = lerp(e.y, cv.mid + Math.sin(e.t * 0.7) * 36, 1 - Math.pow(0.04, dt));
      e.spin += dt * (e.rage ? 1.6 : 0.9);
      if (e.bossKind === 'eye') {
        e.open = 0.5 + Math.sin(e.t * (e.rage ? 2.2 : 1.3)) * 0.5;
        e.fire -= dt * fireRate();
        if (e.fire <= 0 && e.open > 0.62) {
          e.fire = e.rage ? 0.42 : 0.7;
          const n = e.rage ? 7 : 5;
          const base = aimPlayer(e.x, e.y);
          for (let k = 0; k < n; k++) {
            fireEnemy(e.x - 18, e.y, base + (k - (n - 1) * 0.5) * 0.16, 170, k === ((n / 2) | 0) && e.rage);
          }
        }
      } else if (e.bossKind === 'ring') {
        e.fire -= dt * fireRate();
        if (e.fire <= 0) {
          e.fire = e.rage ? 0.38 : 0.62;
          for (let i = 0; i < e.shields.length; i++) {
            const sh = e.shields[i];
            if (sh.hp <= 0) continue;
            const a = sh.a + e.spin;
            fireEnemy(e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40, a, 150);
          }
          if (e.rage) fireEnemy(e.x - 10, e.y, aimPlayer(e.x, e.y), 190, true);
        }
      } else {
        e.open = 0.5 + Math.sin(e.t * (e.rage ? 1.8 : 1.05)) * 0.5;
        e.fire -= dt * fireRate();
        if (e.fire <= 0) {
          e.fire = e.rage ? 0.34 : 0.55;
          if (e.open > 0.55) {
            const n = e.rage ? 10 : 6;
            for (let k = 0; k < n; k++) fireEnemy(e.x - 8, e.y, k * TAU / n + e.t, 155, k % 3 === 0 && e.rage);
          } else {
            for (let i = 0; i < e.shields.length; i++) {
              const sh = e.shields[i];
              if (sh.hp <= 0) continue;
              const a = sh.a + e.spin;
              fireEnemy(e.x + Math.cos(a) * 48, e.y + Math.sin(a) * 48, a + Math.PI * 0.5, 140);
            }
          }
        }
      }
    }

    if (G.deadT <= 0 && G.invuln <= 0 && e.kind !== 'drop') {
      const er = e.kind === 'boss' ? 28 : e.r;
      if (hypot(scr - G.px, e.y - G.py) < er + 7) die();
      if (e.kind === 'boss' && e.shields) {
        for (let i = 0; i < e.shields.length; i++) {
          const sh = e.shields[i];
          if (sh.hp <= 0) continue;
          const rad = e.bossKind === 'core' ? 46 : 40;
          const sxv = scr + Math.cos(sh.a + e.spin) * rad;
          const syv = e.y + Math.sin(sh.a + e.spin) * rad;
          if (hypot(sxv - G.px, syv - G.py) < 12) die();
        }
      }
    }
  }

  function updateEnts(dt) {
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      updateEnt(e, dt);
      if (e.dead || e.x - G.cam < -80 || e.y < -60 || e.y > VH + 60) {
        G.ents.splice(i, 1);
      }
    }
  }

  function updateFx(dt) {
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    if (G.flash > 0) G.flash -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0002, dt));
    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) winGame();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
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
      f.y -= 28 * dt;
      if (f.t > 0.7) floats.splice(i, 1);
    }
  }

  function step(dt) {
    G.t += dt;
    if (G.mode === 'title') {
      G.cam += 28 * dt;
      updateBits(dt);
      updateFx(dt);
      return;
    }
    if (G.mode !== 'play') {
      updateFx(dt);
      updateBits(dt);
      return;
    }
    G.cam += scrollSpd() * dt;
    spawnDrops();
    updatePlayer(dt);
    updateShots(dt);
    updateEnts(dt);
    updateFx(dt);
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) syncHud();
  }

  function drawBg() {
    const c = ctx;
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    const st = stageAt(G.cam + VW * 0.5);
    if (st === 1) {
      g.addColorStop(0, '#1c1408');
      g.addColorStop(0.5, '#120e06');
      g.addColorStop(1, '#1a1006');
    } else if (st === 2) {
      g.addColorStop(0, '#16120c');
      g.addColorStop(0.5, '#0e0c08');
      g.addColorStop(1, '#18140c');
    } else {
      g.addColorStop(0, '#1a0e08');
      g.addColorStop(0.5, '#100806');
      g.addColorStop(1, '#1c1008');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const x = ((s.x - G.cam * s.z * 0.12) % VW + VW) % VW;
      c.fillStyle = rgba(i % 3 === 0 ? GOLD : i % 3 === 1 ? CYN : WHT, 0.25 + s.z * 0.35);
      c.fillRect(sx(x), sy(s.y), s.s * scale, s.s * scale);
    }
  }

  function drawCave() {
    const c = ctx;
    const topPts = [];
    const botPts = [];
    const step = 8;
    for (let x = -16; x <= VW + 16; x += step) {
      const cv = caveAt(G.cam + x);
      topPts.push(x, cv.top);
      botPts.push(x, cv.bot);
    }
    const st = stageAt(G.cam + VW * 0.4);
    c.fillStyle = rgba(st === 3 ? [48, 22, 12] : st === 2 ? STEEL : STONE, 0.96);
    c.beginPath();
    c.moveTo(sx(-16), sy(-4));
    for (let i = 0; i < topPts.length; i += 2) c.lineTo(sx(topPts[i]), sy(topPts[i + 1]));
    c.lineTo(sx(VW + 16), sy(-4));
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(sx(-16), sy(VH + 4));
    for (let i = 0; i < botPts.length; i += 2) c.lineTo(sx(botPts[i]), sy(botPts[i + 1]));
    c.lineTo(sx(VW + 16), sy(VH + 4));
    c.closePath();
    c.fill();

    c.strokeStyle = rgba(st === 3 ? LION : GOLD, 0.5);
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
      c.fillStyle = rgba(AMBER, 0.28);
      for (let x = 0; x < VW; x += 92) {
        const wx = G.cam + x;
        const i = Math.round(wx / 92);
        if (hash2(i + 4) <= 0.58) continue;
        const cv = caveAt(i * 92);
        const h = 22 + hash2(i + 9) * 58;
        if (hash2(i + 8) > 0.5) c.fillRect(sx(i * 92 - G.cam - 9), sy(cv.top - 4), 18 * scale, h * 0.55 * scale);
        else c.fillRect(sx(i * 92 - G.cam - 9), sy(cv.bot - h * 0.45), 18 * scale, h * 0.5 * scale);
      }
    } else if (st === 2) {
      c.fillStyle = rgba(GOLD, 0.22);
      for (let x = 0; x < VW; x += 52) {
        const wx = G.cam + x;
        const i = Math.round(wx / 52);
        if (hash2(i + 31) <= 0.6) continue;
        const cv = caveAt(i * 52);
        const spike = 20 + hash2(i) * 30;
        c.beginPath();
        if (hash2(i + 5) > 0.5) {
          c.moveTo(sx(i * 52 - G.cam), sy(cv.top));
          c.lineTo(sx(i * 52 - G.cam + 7), sy(cv.top + spike));
          c.lineTo(sx(i * 52 - G.cam - 7), sy(cv.top + spike));
        } else {
          c.moveTo(sx(i * 52 - G.cam), sy(cv.bot));
          c.lineTo(sx(i * 52 - G.cam + 7), sy(cv.bot - spike));
          c.lineTo(sx(i * 52 - G.cam - 7), sy(cv.bot - spike));
        }
        c.closePath();
        c.fill();
      }
    } else {
      c.fillStyle = rgba(LION, 0.28);
      for (let x = 0; x < VW; x += 90) {
        const i = Math.floor((G.cam + x) / 90);
        const cv = caveAt(i * 90);
        c.fillRect(sx(i * 90 - G.cam - 16), sy(cv.top), 32 * scale, 7 * scale);
        c.fillRect(sx(i * 90 - G.cam - 16), sy(cv.bot - 7), 32 * scale, 7 * scale);
      }
    }
  }

  function drawScout(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(PNK, 0.95);
    c.beginPath();
    c.moveTo(10 * scale, 0);
    c.lineTo(-8 * scale, -6.5 * scale);
    c.lineTo(-3 * scale, 0);
    c.lineTo(-8 * scale, 6.5 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(MAG, 0.9);
    c.fillRect(-1 * scale, -2 * scale, 6 * scale, 4 * scale);
    c.restore();
  }

  function drawTurret(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(STEEL, 0.95);
    c.fillRect(-9 * scale, -8 * scale, 18 * scale, 16 * scale);
    c.fillStyle = rgba(LION, 0.9);
    c.beginPath();
    c.arc(0, 0, 5 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.75);
    c.fillRect(0, -2 * scale, 11 * scale, 4 * scale);
    c.restore();
  }

  function drawDiver(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(LION, 0.95);
    c.beginPath();
    c.moveTo(12 * scale, 0);
    c.lineTo(-8 * scale, -7 * scale);
    c.lineTo(-8 * scale, 7 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.8);
    c.fillRect(-2 * scale, -2 * scale, 7 * scale, 4 * scale);
    c.restore();
  }

  function drawBarge(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(STEEL, 0.95);
    c.fillRect(-20 * scale, -11 * scale, 40 * scale, 22 * scale);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(-8 * scale, -5 * scale, 16 * scale, 10 * scale);
    c.fillStyle = rgba(MAG, 0.85);
    c.fillRect(12 * scale, -3 * scale, 10 * scale, 6 * scale);
    c.fillStyle = rgba(GOLD, 0.55);
    c.fillRect(-22 * scale, -2 * scale, 6 * scale, 4 * scale);
    c.restore();
  }

  function drawSpinner(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.rotate(e.spin || 0);
    c.fillStyle = rgba(TEAL, 0.9);
    c.beginPath();
    c.moveTo(0, -13 * scale);
    c.lineTo(11 * scale, 0);
    c.lineTo(0, 13 * scale);
    c.lineTo(-11 * scale, 0);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.8);
    c.beginPath();
    c.arc(0, 0, 4 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawCorelet(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.strokeStyle = rgba(LION, 0.9);
    c.lineWidth = Math.max(1.4, 2 * scale);
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6;
      const px = Math.cos(a) * 11 * scale;
      const py = Math.sin(a) * 11 * scale;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();
    const o = 0.35 + (e.open || 0) * 0.65;
    c.fillStyle = rgba(GOLD, 0.85 * o);
    c.beginPath();
    c.arc(0, 0, 4.6 * scale * o, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawDrop(e) {
    const c = ctx;
    const gold = e.item === 'W';
    c.save();
    c.translate(sx(e.x - G.cam), sy(e.y));
    c.fillStyle = rgba(gold ? GOLD : CYN, 0.92);
    c.beginPath();
    c.moveTo(0, -8 * scale);
    c.lineTo(8 * scale, 0);
    c.lineTo(0, 8 * scale);
    c.lineTo(-8 * scale, 0);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(DEEP, 0.9);
    c.font = (9 * scale) + 'px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(e.item, 0, 0.5 * scale);
    c.restore();
  }

  function drawBossHp(e) {
    const c = ctx;
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

  function drawBoss(e) {
    const c = ctx;
    const x = e.x - G.cam;
    const y = e.y;
    if (e.bossKind === 'eye') {
      c.save();
      c.translate(sx(x), sy(y));
      c.fillStyle = rgba(STONE, 0.96);
      c.beginPath();
      c.ellipse(0, 0, 48 * scale, 32 * scale, 0, 0, TAU);
      c.fill();
      const lid = 1 - e.open * 0.85;
      c.fillStyle = rgba(DEEP, 0.92);
      c.beginPath();
      c.ellipse(0, 0, 30 * scale, 20 * scale * (0.25 + e.open), 0, 0, TAU);
      c.fill();
      if (e.open > 0.4) {
        const beat = 1 + Math.sin(e.t * (e.rage ? 9 : 5)) * 0.08;
        c.fillStyle = rgba(e.rage ? MAG : GOLD, 0.95);
        c.beginPath();
        c.arc(-4 * scale, 0, 12 * scale * beat * e.open, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.85);
        c.beginPath();
        c.arc(-4 * scale, 0, 4.5 * scale * e.open, 0, TAU);
        c.fill();
      }
      c.fillStyle = rgba(AMBER, 0.7);
      c.fillRect(-48 * scale, (-32 * lid) * scale, 96 * scale, 8 * scale);
      c.fillRect(-48 * scale, (24 * lid) * scale, 96 * scale, 8 * scale);
      c.restore();
    } else if (e.bossKind === 'ring') {
      c.save();
      c.translate(sx(x), sy(y));
      c.strokeStyle = rgba(STEEL, 0.95);
      c.lineWidth = Math.max(4, 7 * scale);
      c.beginPath();
      c.arc(0, 0, 40 * scale, 0, TAU);
      c.stroke();
      const beat = 1 + Math.sin(e.t * (e.rage ? 8 : 4)) * 0.08;
      c.fillStyle = rgba(e.rage ? MAG : GOLD, 0.95);
      c.beginPath();
      c.arc(0, 0, 14 * scale * beat, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.8);
      c.beginPath();
      c.arc(0, 0, 6 * scale, 0, TAU);
      c.fill();
      c.restore();
      for (let i = 0; i < e.shields.length; i++) {
        const sh = e.shields[i];
        if (sh.hp <= 0) continue;
        const a = sh.a + e.spin;
        const px = x + Math.cos(a) * 40;
        const py = y + Math.sin(a) * 40;
        c.fillStyle = rgba(LION, 0.92);
        c.beginPath();
        c.arc(sx(px), sy(py), 8 * scale, 0, TAU);
        c.fill();
        c.fillStyle = rgba(GOLD, 0.7);
        c.beginPath();
        c.arc(sx(px), sy(py), 3 * scale, 0, TAU);
        c.fill();
      }
    } else {
      c.save();
      c.translate(sx(x), sy(y));
      c.fillStyle = rgba(STONE, 0.96);
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6 - Math.PI / 6;
        const px = Math.cos(a) * 52 * scale;
        const py = Math.sin(a) * 46 * scale;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.92);
      c.beginPath();
      c.arc(0, 0, 22 * scale, 0, TAU);
      c.fill();
      const beat = 1 + Math.sin(e.t * (e.rage ? 9 : 4.5)) * 0.1;
      const show = 0.4 + e.open * 0.6;
      c.fillStyle = rgba(e.rage ? MAG : GOLD, 0.95 * show);
      c.beginPath();
      c.arc(0, 0, 14 * scale * beat * show, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.85 * show);
      c.beginPath();
      c.arc(0, 0, 6 * scale * show, 0, TAU);
      c.fill();
      c.restore();
      for (let i = 0; i < e.shields.length; i++) {
        const sh = e.shields[i];
        if (sh.hp <= 0) continue;
        const rad = 46 + Math.sin(e.t * 2) * 4;
        const a = sh.a + e.spin;
        const px = x + Math.cos(a) * rad;
        const py = y + Math.sin(a) * rad;
        c.fillStyle = rgba(CYN, 0.92);
        c.beginPath();
        c.moveTo(sx(px), sy(py - 7));
        c.lineTo(sx(px + 7), sy(py));
        c.lineTo(sx(px), sy(py + 7));
        c.lineTo(sx(px - 7), sy(py));
        c.closePath();
        c.fill();
        c.fillStyle = rgba(WHT, 0.75);
        c.beginPath();
        c.arc(sx(px), sy(py), 2.2 * scale, 0, TAU);
        c.fill();
      }
    }
    drawBossHp(e);
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.kind === 'scout') drawScout(e);
      else if (e.kind === 'turret') drawTurret(e);
      else if (e.kind === 'diver') drawDiver(e);
      else if (e.kind === 'barge') drawBarge(e);
      else if (e.kind === 'spinner') drawSpinner(e);
      else if (e.kind === 'corelet') drawCorelet(e);
      else if (e.kind === 'drop') drawDrop(e);
      else if (e.kind === 'boss') drawBoss(e);
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.type === 'blast') {
        const a = clamp(s.life / BLAST_DUR, 0, 1);
        c.fillStyle = rgba(s.rgb, 0.22 * a);
        c.fillRect(sx(s.x), sy(s.y - s.h * 0.9), s.w * scale, s.h * 1.8 * scale);
        c.fillStyle = rgba(s.rgb, 0.85 * a);
        c.fillRect(sx(s.x), sy(s.y - s.h * 0.45), s.w * scale, s.h * 0.9 * scale);
        c.fillStyle = rgba(WHT, 0.8 * a);
        c.fillRect(sx(s.x), sy(s.y - 1.4), s.w * scale, 2.8 * scale);
        if (!REDUCE) {
          for (let k = 0; k < 3; k++) {
            const oy2 = Math.sin(G.t * 26 + k + s.y * 0.1) * s.h * 0.35;
            c.fillStyle = rgba(GOLD, 0.35 * a);
            c.fillRect(sx(s.x), sy(s.y + oy2), s.w * 0.9 * scale, 1.4 * scale);
          }
        }
      } else if (s.type === 'bit') {
        c.save();
        c.translate(sx(s.x), sy(s.y));
        const ang = Math.atan2(s.vy, s.vx);
        c.rotate(ang);
        c.fillStyle = rgba(CYN, 0.95);
        c.fillRect(-8 * scale, -1.4 * scale, 16 * scale, 2.8 * scale);
        c.fillStyle = rgba(WHT, 0.85);
        c.fillRect(-6 * scale, -0.6 * scale, 12 * scale, 1.2 * scale);
        c.restore();
      } else {
        c.save();
        c.translate(sx(s.x), sy(s.y));
        const ang = Math.atan2(s.vy, s.vx);
        c.rotate(ang);
        c.fillStyle = rgba(s.rgb || GOLD, 0.95);
        c.beginPath();
        c.moveTo(8 * scale, 0);
        c.lineTo(-6 * scale, -2.4 * scale);
        c.lineTo(-6 * scale, 2.4 * scale);
        c.closePath();
        c.fill();
        c.restore();
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

  function drawBits() {
    if (G.deadT > 0) return;
    const c = ctx;
    for (let i = 0; i < G.bitsArr.length; i++) {
      const b = G.bitsArr[i];
      c.strokeStyle = rgba(CYN, G.blastT > 0 ? 0.55 : 0.28);
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.beginPath();
      c.moveTo(sx(G.px + 4), sy(G.py));
      c.lineTo(sx(b.x), sy(b.y));
      c.stroke();
      c.save();
      c.translate(sx(b.x), sy(b.y));
      c.rotate(b.ang * 0.15);
      c.fillStyle = rgba(CYN, 0.95);
      c.beginPath();
      c.moveTo(6 * scale, 0);
      c.lineTo(0, -5 * scale);
      c.lineTo(-5 * scale, 0);
      c.lineTo(0, 5 * scale);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(G.blastT > 0 ? GOLD : WHT, 0.9);
      c.beginPath();
      c.arc(0, 0, 2 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const c = ctx;
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink) return;
    c.save();
    c.translate(sx(G.px), sy(G.py));
    c.fillStyle = rgba(GOLD, 0.32);
    c.beginPath();
    c.ellipse(-10 * scale, 0, 16 * scale, 7 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(LION, 0.95);
    c.beginPath();
    c.moveTo(-16 * scale, -7 * scale);
    c.lineTo(-7 * scale, 0);
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
    c.fillStyle = rgba(GOLD, 0.95);
    c.fillRect(-2 * scale, -3.4 * scale, 12 * scale, 6.8 * scale);
    c.fillStyle = rgba(DEEP, 0.85);
    c.fillRect(2 * scale, -1.7 * scale, 6 * scale, 3.4 * scale);
    c.fillStyle = rgba(CYN, 0.85);
    c.fillRect(-6 * scale, -2 * scale, 4 * scale, 4 * scale);
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle / 0.12);
      c.fillRect(16 * scale, -2.2 * scale, 12 * scale, 4.4 * scale);
    }
    if (G.blastT > 0) {
      const rad = 6 + Math.sin(G.t * 18) * 2;
      c.fillStyle = rgba(CYN, 0.45);
      c.beginPath();
      c.arc(16 * scale, 0, rad * scale, 0, TAU);
      c.fill();
    }
    c.restore();
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
      const a = 1 - f.t / 0.7;
      c.fillStyle = rgba(f.rgb, a);
      c.font = '700 ' + (12 * scale) + 'px "Segoe UI", sans-serif';
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#100c04';
    c.fillRect(0, 0, W, H);
    c.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake;
      shy = (Math.random() - 0.5) * G.shake;
    }
    c.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      c.translate(sx(VW * 0.5), sy(VH * 0.5));
      c.scale(G.punch, G.punch);
      c.translate(-sx(VW * 0.5), -sy(VH * 0.5));
    }
    drawBg();
    drawCave();
    drawEnts();
    drawShots();
    drawBits();
    drawShip();
    drawFx();
    drawFlash();
    c.restore();
  }

  function resize() {
    const rect = stageEl ? stageEl.getBoundingClientRect() : canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function toVirtual(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const x = (cx - rect.left) * (W / Math.max(1, rect.width));
    const y = (cy - rect.top) * (H / Math.max(1, rect.height));
    return {
      x: clamp((x - ox) / scale, 0, VW),
      y: clamp((y - oy) / scale, 0, VH)
    };
  }

  function bindPointer() {
    function down(e) {
      if (overlayOpen() && e.target !== canvas) return;
      if (G.mode === 'title') return;
      audio.ensure();
      const p = toVirtual(e.clientX, e.clientY);
      pointer.down = true;
      pointer.hover = true;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.id = e.pointerId;
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      if (e.button === 2) tryBlast();
      e.preventDefault();
    }
    function move(e) {
      const p = toVirtual(e.clientX, e.clientY);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.hover = true;
    }
    function up(e) {
      pointer.down = false;
      pointer.id = null;
      if (e && e.pointerId != null && canvas.releasePointerCapture) {
        try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    }
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    if (btnBlast) {
      const blastDown = function (e) {
        e.preventDefault();
        audio.ensure();
        btnBlast.classList.add('held');
        tryBlast();
      };
      const blastUp = function () { btnBlast.classList.remove('held'); };
      btnBlast.addEventListener('pointerdown', blastDown);
      btnBlast.addEventListener('pointerup', blastUp);
      btnBlast.addEventListener('pointerleave', blastUp);
    }
  }

  function onKey(e, down) {
    const code = e.code || '';
    const key = e.key || '';
    if (code === 'ArrowLeft' || code === 'KeyA') keys.l = down;
    else if (code === 'ArrowRight' || code === 'KeyD') keys.r = down;
    else if (code === 'ArrowUp' || code === 'KeyW') keys.u = down;
    else if (code === 'ArrowDown' || code === 'KeyS') keys.d = down;
    else if (code === 'Space') keys.sht = down;
    else if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ') {
      if (down && !keys.blast) tryBlast();
      keys.blast = down;
    }

    if (!down) return;

    if (code === 'KeyR') {
      e.preventDefault();
      restart();
      return;
    }
    if (code === 'KeyM') {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }

    audio.ensure();

    if (G.mode === 'title') {
      if (code === 'Digit2' || key === '2') {
        e.preventDefault();
        startGame('storm');
        return;
      }
      if (code === 'Digit1' || key === '1' || code === 'Enter' || code === 'Space') {
        e.preventDefault();
        startGame('raid');
        return;
      }
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      if (code === 'Enter' || code === 'Space') {
        e.preventDefault();
        startGame(G.kind || 'raid');
      }
    }

    if (code === 'Space' || code.indexOf('Arrow') === 0) e.preventDefault();
  }

  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (!hidden) {
      acc += dt;
      if (acc > STEP * 5) acc = STEP * 5;
      let n = 0;
      while (acc >= STEP && n < 5) {
        acc -= STEP;
        if (G.stop > 0) G.stop -= STEP;
        else step(STEP);
        n += 1;
      }
    }
    draw();
    requestAnimationFrame(frame);
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
      pointer.down = false;
      G.fireHold = false;
    }
  });
  requestAnimationFrame(frame);
})();
