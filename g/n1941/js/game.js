'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const WPN_MAX = 4;
  const BOLT_MAX = 3;
  const BOLT_DUR = 0.42;
  const BEST_KEY = 'playbox-n1941-best';
  const MUTE_KEY = 'playbox-n1941-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 落雷 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const HOT = [255, 122, 41];
  const GOLD = [255, 227, 107];
  const WHT = [255, 244, 234];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 160, 72];
  const SEA = [196, 90, 40];
  const LAG = [48, 128, 140];
  const REEF = [36, 108, 96];
  const DUSK = [168, 64, 40];
  const STEEL = [148, 136, 128];
  const CREAM = [255, 244, 220];
  const SKY = [255, 177, 74];

  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'MAX'];

  const SCORE = {
    fighter: 50,
    dive: 80,
    bomber: 140,
    boat: 100,
    ship: 200,
    turret: 160,
    escort: 220,
    powship: 300,
    mid: 2000,
    boss: 4000,
    clear: 1500,
    all: 8000,
    bolt: 500
  };

  const STAGES = [
    {
      name: '吉尔伯特',
      biome: 'lagoon',
      mid: '鱼雷艇',
      boss: '轻巡舰',
      midHp: 38,
      bossHp: 92,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.0, kind: 'boats' },
        { t: 5.4, kind: 'stream', dir: 1 },
        { t: 7.8, kind: 'escort' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'powship' },
        { t: 15.2, kind: 'boats' },
        { t: 17.6, kind: 'v', n: 7 },
        { t: 20.4, kind: 'mid' },
        { t: 26.0, kind: 'stream', dir: -1 },
        { t: 28.4, kind: 'ship' },
        { t: 30.8, kind: 'dive', n: 5 },
        { t: 33.2, kind: 'boats' },
        { t: 35.6, kind: 'bomber' },
        { t: 38.0, kind: 'v', n: 7 },
        { t: 40.6, kind: 'powship' },
        { t: 43.0, kind: 'escort' },
        { t: 47.8, kind: 'boss' }
      ]
    },
    {
      name: '马绍尔',
      biome: 'reef',
      mid: '重巡舰',
      boss: '战列舰',
      midHp: 50,
      bossHp: 122,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 2.8, kind: 'boats' },
        { t: 5.0, kind: 'turrets' },
        { t: 7.4, kind: 'dive', n: 5 },
        { t: 9.6, kind: 'ship' },
        { t: 12.0, kind: 'stream', dir: -1 },
        { t: 14.4, kind: 'bomber' },
        { t: 16.8, kind: 'powship' },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'turrets' },
        { t: 27.0, kind: 'bomber' },
        { t: 29.2, kind: 'dive', n: 6 },
        { t: 31.6, kind: 'escort' },
        { t: 34.0, kind: 'v', n: 9 },
        { t: 36.4, kind: 'boats' },
        { t: 38.8, kind: 'turrets' },
        { t: 41.2, kind: 'powship' },
        { t: 49.6, kind: 'boss' }
      ]
    },
    {
      name: '特鲁克',
      biome: 'dusk',
      mid: '补给舰',
      boss: '旗舰航母',
      midHp: 64,
      bossHp: 168,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.4, kind: 'turrets' },
        { t: 4.4, kind: 'bomber' },
        { t: 6.4, kind: 'dive', n: 6 },
        { t: 8.4, kind: 'ship' },
        { t: 10.4, kind: 'stream', dir: 1 },
        { t: 12.6, kind: 'escort' },
        { t: 14.6, kind: 'powship' },
        { t: 16.8, kind: 'mid' },
        { t: 22.6, kind: 'bomber' },
        { t: 24.6, kind: 'dive', n: 7 },
        { t: 26.8, kind: 'turrets' },
        { t: 29.0, kind: 'v', n: 11 },
        { t: 31.2, kind: 'stream', dir: -1 },
        { t: 33.4, kind: 'ship' },
        { t: 35.6, kind: 'bomber' },
        { t: 37.8, kind: 'powship' },
        { t: 40.0, kind: 'turrets' },
        { t: 51.4, kind: 'boss' }
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
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBolt = document.getElementById('btn-bolt');
  const btnPadBolt = document.getElementById('btn-pad-bolt');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const comboEl = document.getElementById('combo-label');
  const boltLabel = document.getElementById('bolt-label');
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
  let wpnTok = 0;
  let boltTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false, bl: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const foam = [];
  const islands = [];
  const wash = [];
  const bolts = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: VW * 0.5, y: VH - 90, vx: 0, vy: 0, bank: 0 },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    powLv: 0,
    bolts: BOLT_MAX,
    boltT: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    fireCd: 0,
    fireHold: false,
    boltHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    why: '',
    propT: 0
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
  function isCore() {
    return G.kind === 'core';
  }
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'lagoon';
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function plySpd() {
    return (isCore() ? 308 : 274) + G.powLv * 8;
  }
  function scrollSpd() {
    if (hasBig()) return isCore() ? 36 : 28;
    const base = isCore() ? 110 : 78;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isCore() ? 10 : 8);
  }
  function hpMul() {
    return isCore() ? 1.22 : 1;
  }
  function shotCap() {
    return isCore() ? 176 : 120;
  }
  function bolting() {
    return G.boltT > 0;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
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
      this.beep(720 + G.powLv * 52, 0.042, 'square', 0.03, 1520);
    },
    thunder() {
      this.ensure();
      this.noise(0.22, 0.08, 140);
      this.beep(90, 0.28, 'sawtooth', 0.055, 38);
      this.beep(420, 0.12, 'square', 0.04, 90);
      this.beep(1180, 0.08, 'triangle', 0.028, 280);
    },
    hit(kind, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      if (kind === 'ground') {
        this.noise(0.05, 0.038, 360);
        this.beep(200 * lift, 0.09, 'sawtooth', 0.038, 64);
      } else {
        this.noise(0.034, 0.03, 1100);
        this.beep(560 * lift, 0.064, 'square', 0.042, 980 * lift);
      }
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.1, big ? 0.078 : 0.048, big ? 200 : 440);
      this.beep(big ? 150 : 240, big ? 0.28 : 0.14, 'sawtooth', 0.05, 48);
    },
    pow() {
      this.ensure();
      this.beep(494, 0.08, 'square', 0.045, 740);
      this.beep(740, 0.12, 'triangle', 0.04, 988);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    prop() {
      this.ensure();
      this.beep(102, 0.03, 'sawtooth', 0.01, 78);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(250, 0.22, 'sawtooth', 0.052, 58);
      this.beep(128, 0.32, 'sine', 0.044, 36);
    },
    boss() {
      this.ensure();
      this.beep(170, 0.18, 'sawtooth', 0.05, 88);
      this.beep(118, 0.3, 'square', 0.04, 64);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.04, 86);
      this.beep(132, 0.3, 'sine', 0.05, 44);
    },
    start() {
      this.ensure();
      this.beep(370, 0.09, 'square', 0.04, 740);
      this.beep(740, 0.14, 'triangle', 0.035, 1110);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
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
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
    } else if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
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
    G.toastT = 1.28;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1280);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function wpnText() {
    if (G.powLv >= WPN_MAX) return '雷 MAX';
    if (G.powLv <= 0) return '雷';
    return '雷 ' + WPN_ROMAN[G.powLv];
  }

  function flashWpn() {
    if (!wpnLabel) return;
    wpnLabel.classList.remove('hot');
    void wpnLabel.offsetWidth;
    wpnLabel.classList.add('hot');
    wpnTok += 1;
    const tok = wpnTok;
    setTimeout(function () {
      if (tok === wpnTok && wpnLabel) wpnLabel.classList.remove('hot');
    }, 280);
  }

  function flashBoltHud() {
    if (!boltLabel) return;
    boltLabel.classList.remove('hot');
    void boltLabel.offsetWidth;
    boltLabel.classList.add('hot');
    boltTok += 1;
    const tok = boltTok;
    setTimeout(function () {
      if (tok === boltTok && boltLabel) boltLabel.classList.remove('hot');
    }, 280);
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const el = document.createElement('span');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > n) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const info = stageInfo();
      const big = hasBoss() ? info.boss : hasMid() ? info.mid : ('第 ' + G.stage + ' 关 · ' + info.name);
      stageLabel.textContent = big;
      stageLabel.classList.toggle('hot', hasBig() || G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '海核' : '四一';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.powLv >= WPN_MAX);
    }
    if (boltLabel) {
      boltLabel.textContent = '闪 ×' + G.bolts;
      boltLabel.classList.toggle('empty', G.bolts <= 0);
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (btnBolt) btnBolt.classList.toggle('held', bolting());
    if (btnPadBolt) btnPadBolt.classList.toggle('held', bolting());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint((isCore() ? '海核尽破' : '航母击沉') + ' · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格射击 · Shift 落雷', 'warn');
    else setHint('空格扫空打舰 · Shift 落雷清弹炸舰 · 吃 雷 加宽', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'N141';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const start = kind === 'title';
    if (ovStart) ovStart.classList.toggle('gone', !start);
    if (ovEnd) ovEnd.classList.toggle('gone', start);
    if (btnOvModes) {
      if (kind === 'lose') btnOvModes.textContent = '换模式';
      else if (kind === 'win') btnOvModes.textContent = isCore() ? '换模式' : '海核';
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
    const cls = mag >= 6.5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
      }
    }, 360);
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
        g: spec.g == null ? 520 : spec.g
      });
    }
    capArr(particles, 380);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 44);
    capArr(rings, 28);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.9 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -86 : -70
    });
    capArr(floats, 28);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -190 * p, vx1: 190 * p, vy0: -240 * p, vy1: 100 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.6 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.18 + p * 0.14);
    kick(2.2 + p * 2.6);
  }

  function zigBolt(x0, y0, x1, y1) {
    const pts = [{ x: x0, y: y0 }];
    const n = 5 + (Math.random() * 4) | 0;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      pts.push({
        x: lerp(x0, x1, t) + rand(-18, 18),
        y: lerp(y0, y1, t) + rand(-6, 6)
      });
    }
    pts.push({ x: x1, y: y1 });
    bolts.push({ pts: pts, t: 0, life: 0.28 + Math.random() * 0.12, rgb: Math.random() < 0.45 ? GOLD : CYN, w: rand(1.4, 2.8) });
    capArr(bolts, 36);
  }

  function seedWorld() {
    foam.length = 0;
    islands.length = 0;
    for (let i = 0; i < 52; i++) {
      foam.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.4, 1.3),
        a: rand(0.12, 0.52),
        w: rand(8, 24)
      });
    }
    for (let i = 0; i < 8; i++) {
      islands.push({
        x: hash2(i * 17 + 3) * VW,
        y: -40 - i * 104,
        w: 34 + hash2(i * 9) * 72,
        h: 20 + hash2(i * 13) * 34,
        kind: hash2(i * 5)
      });
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
        const tok = comboTok;
        setTimeout(function () {
          if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
        }, 280);
      }
    }
    G.mult = next;
    if (G.combo >= 3 && G.combo % 3 === 0) {
      floatText(G.player.x, G.player.y - 28, G.combo + ' 链', GOLD, true);
      hitStop(0.03);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function spawnEnt(spec) {
    if (G.ents.length > 56) return null;
    const en = {
      type: spec.type,
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy || 0,
      hp: spec.hp,
      maxHp: spec.hp,
      r: spec.r,
      t: 0,
      fireCd: spec.fireCd != null ? spec.fireCd : rand(0.28, 1.05),
      score: spec.score,
      drop: spec.drop || false,
      rgb: spec.rgb,
      ang: spec.ang || 0,
      flash: 0,
      ground: !!spec.ground,
      dive: !!spec.dive,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      spin: spec.spin || 0,
      launchCd: spec.launchCd || 0
    };
    G.ents.push(en);
    return en;
  }

  function spawnFighter(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'fighter',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 96,
      hp: 1, r: 10, score: SCORE.fighter,
      rgb: extra.rgb || MAG,
      dive: extra.dive,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.9, 2.4)
    });
  }

  function spawnV(n, xmid) {
    n = n || 7;
    xmid = xmid == null ? VW * 0.5 + rand(-36, 36) : xmid;
    const gapX = 26;
    const gapY = 20;
    const y0 = -24;
    spawnFighter(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnFighter(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnFighter(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = 6 + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnFighter(side + rand(-8, 8), -20 - i * 24, {
        vx: dir * -78,
        vy: 120,
        rgb: PNK,
        fireCd: rand(0.7, 1.6)
      });
    }
  }

  function spawnDive(n) {
    n = n || 4;
    for (let i = 0; i < n; i++) {
      const x = 50 + (i + 0.5) * ((VW - 100) / n) + rand(-16, 16);
      spawnEnt({
        type: 'dive',
        x: x, y: -30 - i * 16,
        vx: 0, vy: 62,
        hp: 1, r: 10, score: SCORE.dive,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnBomber() {
    const left = Math.random() < 0.5;
    spawnEnt({
      type: 'bomber',
      x: left ? -30 : VW + 30,
      y: rand(70, 170),
      vx: left ? 86 : -86,
      vy: 22,
      hp: 5, r: 18, score: SCORE.bomber,
      rgb: STEEL,
      w: 42, h: 18,
      fireCd: rand(0.4, 0.9),
      phase: left ? 1 : -1
    });
  }

  function spawnBoat(x) {
    spawnEnt({
      type: 'boat',
      x: x == null ? rand(50, VW - 50) : x,
      y: -30,
      vx: rand(-24, 24),
      vy: 0,
      hp: 3, r: 14, score: SCORE.boat,
      rgb: SEA,
      ground: true,
      drop: Math.random() < 0.18,
      w: 28, h: 16,
      fireCd: rand(0.55, 1.2)
    });
  }

  function spawnBoats() {
    const n = isCore() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      spawnBoat(70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-20, 20));
    }
  }

  function spawnShip(x) {
    spawnEnt({
      type: 'ship',
      x: x == null ? rand(90, VW - 90) : x,
      y: -48,
      vx: rand(-16, 16),
      vy: 0,
      hp: 7, r: 24, score: SCORE.ship,
      rgb: RED,
      ground: true,
      drop: Math.random() < 0.38,
      w: 52, h: 24,
      fireCd: rand(0.38, 0.82)
    });
  }

  function spawnTurret(x, y) {
    spawnEnt({
      type: 'turret',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 4, r: 12, score: SCORE.turret,
      rgb: GOLD,
      ground: true,
      w: 22, h: 18,
      fireCd: rand(0.4, 1.1)
    });
  }

  function spawnTurretWave() {
    const n = isCore() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnTurret(clamp(x, 40, VW - 40), -24 - i * 16);
    }
  }

  function spawnEscort() {
    spawnEnt({
      type: 'escort',
      x: rand(90, VW - 90),
      y: -58,
      vx: rand(-12, 12),
      vy: 0,
      hp: 9, r: 28, score: SCORE.escort,
      rgb: STEEL,
      ground: true,
      drop: 'bolt',
      w: 64, h: 28,
      fireCd: rand(0.4, 0.8)
    });
  }

  function spawnPowship() {
    spawnEnt({
      type: 'powship',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 76,
      hp: 2, r: 13, score: SCORE.powship,
      rgb: GOLD,
      drop: 'p',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = stageInfo();
    const hp = Math.round(st.midHp * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -70,
      vx: 52,
      vy: 46,
      hp: hp,
      r: 34,
      score: SCORE.mid,
      rgb: STEEL,
      drop: 'p',
      ground: true,
      w: 78,
      h: 28,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(HOT, 0.36);
    kick(4.6);
  }

  function spawnBoss() {
    if (hasBig()) return;
    const st = stageInfo();
    const hp = Math.round(st.bossHp * hpMul());
    const carrier = G.stage >= 3;
    spawnEnt({
      type: 'boss',
      x: VW * 0.5,
      y: -92,
      vx: 58,
      vy: 42,
      hp: hp,
      r: carrier ? 54 : 46,
      score: SCORE.boss + G.stage * SCORE.clear,
      rgb: MAG,
      drop: carrier ? 'bolt' : 'p',
      ground: true,
      w: carrier ? 124 : 102,
      h: carrier ? 42 : 34,
      fireCd: 0.55,
      phase: 0,
      spin: 0,
      launchCd: 1.1
    });
    toast(st.boss, false, true);
    audio.boss();
    screenFlash(MAG, 0.42);
    kick(5.4);
  }

  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'mid' || t === 'boss') && G.ents[i].hp > 0) return true;
    }
    return false;
  }
  function hasBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].hp > 0) return true;
    }
    return false;
  }
  function hasMid() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'mid' && G.ents[i].hp > 0) return true;
    }
    return false;
  }

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'boats') spawnBoats();
    else if (w.kind === 'ship') spawnShip();
    else if (w.kind === 'turrets') spawnTurretWave();
    else if (w.kind === 'bomber') spawnBomber();
    else if (w.kind === 'powship') spawnPowship();
    else if (w.kind === 'escort') spawnEscort();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vy: 62, t: 0,
      vx: rand(-38, 38),
      kind: kind || 'p'
    });
    capArr(G.pows, 7);
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length > shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: r || 3.05,
      rgb: rgb || MAG
    });
  }

  function aimShot(x, y, spd, rgb, r) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = hypot(dx, dy) || 1;
    eShot(x, y, dx / len * spd, dy / len * spd, rgb, r);
  }

  function ringShot(x, y, n, spd, rot, rgb, r) {
    for (let i = 0; i < n; i++) {
      const a = rot + (i * TAU) / n;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r);
    }
  }

  function addShot(spec) {
    if (G.shots.length > 52) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      dmg: spec.dmg || 1
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.powLv;
    const x = G.player.x;
    const y = G.player.y - 16;
    G.muzzle = 0.05;
    G.fireCd = 0.11 - lv * 0.011;
    const spd = -700;
    const rgb = lv >= 3 ? GOLD : lv >= 1 ? SKY : WHT;
    function fan(ox, oy, vx, vy) {
      addShot({ x: x + ox, y: y + oy, vx: vx || 0, vy: vy == null ? spd : vy, r: 3.15, rgb: rgb, dmg: 1 });
    }
    if (lv <= 0) {
      fan(-7, 2);
      fan(7, 2);
    } else if (lv === 1) {
      fan(-11, 3);
      fan(-4, 0);
      fan(4, 0);
      fan(11, 3);
    } else if (lv === 2) {
      fan(-14, 4, -80, spd);
      fan(-7, 1);
      fan(0, -2);
      fan(7, 1);
      fan(14, 4, 80, spd);
    } else if (lv === 3) {
      fan(-16, 5, -120, spd);
      fan(-9, 2, -40, spd);
      fan(-3, -1);
      fan(3, -1);
      fan(9, 2, 40, spd);
      fan(16, 5, 120, spd);
    } else {
      fan(-18, 6, -150, spd);
      fan(-12, 3, -80, spd);
      fan(-5, 0);
      fan(0, -4);
      fan(5, 0);
      fan(12, 3, 80, spd);
      fan(18, 6, 150, spd);
      addShot({ x: x - 20, y: y + 8, vx: -50, vy: spd * 0.9, r: 2.6, rgb: HOT, dmg: 1 });
      addShot({ x: x + 20, y: y + 8, vx: 50, vy: spd * 0.9, r: 2.6, rgb: HOT, dmg: 1 });
    }
    audio.shoot();
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: rgb,
      g: 0
    });
  }

  function doBolt() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (bolting()) return;
    if (G.bolts <= 0) {
      toast('闪用尽', true, false);
      return;
    }
    G.bolts -= 1;
    G.boltT = BOLT_DUR;
    G.invuln = Math.max(G.invuln, BOLT_DUR);
    flashBoltHud();
    audio.thunder();
    screenFlash(GOLD, 0.72);
    hitStop(0.056);
    kick(6.2);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    G.eShots.length = 0;
    const targets = [];
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      if (en.y < -12 || en.y > VH + 16) continue;
      targets.push(en);
    }
    for (let i = 0; i < targets.length; i++) {
      const en = targets[i];
      const dmg = (en.type === 'boss' || en.type === 'mid') ? 8 : en.ground ? 6 : 4;
      zigBolt(en.x + rand(-10, 10), -18, en.x + rand(-6, 6), en.y);
      popSpark(en.x, en.y, GOLD, 18);
      hurtEnt(en, dmg, en.x, en.y);
    }
    const extra = 3 + (isCore() ? 3 : 1);
    for (let k = 0; k < extra; k++) {
      const x = rand(30, VW - 30);
      zigBolt(x + rand(-20, 20), -16, x + rand(-24, 24), rand(80, VH - 40));
    }
    for (let i = 1; i < targets.length; i++) {
      const a = targets[i - 1];
      const b = targets[i];
      if (hypot(a.x - b.x, a.y - b.y) < 160) zigBolt(a.x, a.y, b.x, b.y);
    }
    emit(22, {
      x: VW * 0.5, y: 40, j: 90,
      vx0: -80, vx1: 80, vy0: 40, vy1: 220,
      life: 0.36, r0: 1.2, r1: 3.4, rgb: GOLD, g: 180
    });
    toast('落雷', false, true);
    floatText(G.player.x, G.player.y - 36, '闪', GOLD, true);
    syncHud();
  }

  function hurtEnt(en, dmg, hx, hy) {
    if (en.hp <= 0) return;
    en.hp -= dmg || 1;
    en.flash = 0.08;
    if (en.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -80, vx1: 80, vy0: -90, vy1: 40,
        life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
      });
      if (en.type === 'boss' || en.type === 'mid') hitStop(0.032);
      return;
    }
    killEnt(en);
  }

  function killEnt(en) {
    if (en.hp < -90) return;
    en.hp = -99;
    bumpCombo();
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.ground ? 1.2 : 0.85;
    juice(en.x, en.y, en.rgb, pwr);
    if (en.ground) {
      audio.hit('ground', G.combo);
      emit(10, {
        x: en.x, y: en.y, j: 8,
        vx0: -120, vx1: 120, vy0: -80, vy1: 40,
        life: 0.32, r0: 1.4, r1: 3.4, rgb: SEA, g: 280
      });
    } else {
      audio.hit('air', G.combo);
    }
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.drop === 'p' || en.drop === true) spawnPow(en.x, en.y, 'p');
    else if (en.drop === 'bolt') spawnPow(en.x, en.y, 'bolt');
    else if ((en.type === 'ship' || en.type === 'escort') && Math.random() < 0.22) spawnPow(en.x, en.y, 'p');
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(SCORE.clear * G.stage);
      floatText(en.x, en.y - 24, '击沉', GOLD, true);
      toast(stageInfo().name + '击沉', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (p.kind === 'bolt') {
      if (G.bolts < BOLT_MAX + 2) {
        G.bolts += 1;
        toast('闪 +1', false, true);
        flashBoltHud();
      } else {
        addScore(500 * G.mult);
        toast('+500', false, true);
      }
    } else if (G.powLv < WPN_MAX) {
      G.powLv += 1;
      toast(G.powLv >= WPN_MAX ? '雷 MAX' : '雷加宽', false, true);
    } else if (G.bolts < BOLT_MAX + 2) {
      G.bolts += 1;
      toast('闪 +1', false, true);
      flashBoltHud();
    } else {
      addScore(500 * G.mult);
      toast('+500', false, true);
    }
    flashWpn();
    juice(p.x, p.y, GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, p.kind === 'bolt' ? '闪' : '雷', GOLD, true);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('pow');
      void stageEl.offsetWidth;
      stageEl.classList.add('pow');
    }
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0 || bolting()) return;
    G.lives -= 1;
    G.deadT = 0.95;
    breakCombo();
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.powLv > 0) spawnPow(G.player.x, G.player.y - 18, 'p');
    G.powLv = 0;
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '机毁了';
    saveBest();
    audio.lose();
    showOverlay('lose', '机毁了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function winGame() {
    addScore(isCore() ? 10000 : SCORE.all);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', isCore() ? '海核尽破' : '航母击沉', (isCore() ? '海核通关' : '三关打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function livingAir() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0 && !G.ents[i].ground) n += 1;
    }
    return n;
  }

  function raidThink() {
    if (G.stageClearT > 0 || hasBig()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function coreThink(dt) {
    if (hasBig() || G.stageClearT > 0) return;
    const st = STAGES[G.stage - 1];
    if (st) {
      while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t * 0.86) {
        fireWave(st.waves[G.waveI]);
        G.waveI += 1;
      }
    }
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    G.spawnT = clamp(1.34 / (1 + G.stage * 0.12), 0.34, 1.34);
    if (livingAir() > 24) return;
    const r = Math.random();
    if (r < 0.22) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.36) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.48) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.6) spawnBoats();
    else if (r < 0.72) spawnTurretWave();
    else if (r < 0.82) spawnShip();
    else if (r < 0.9) spawnBomber();
    else if (r < 0.96) spawnPowship();
    else spawnEscort();
  }

  function bossFire(en, dens) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += dens ? 0.22 : 0.16;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 8, dens ? 204 : 170, HOT);
      eShot(en.x - 22, en.y + 6, -46, 180, PNK);
      eShot(en.x + 22, en.y + 6, 46, 180, PNK);
      if (mid) ringShot(en.x, en.y, dens ? 10 : 8, 146, en.spin, GOLD, 3.2);
      if (low) {
        aimShot(en.x - 24, en.y + 4, 196, MAG);
        aimShot(en.x + 24, en.y + 4, 196, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 10, 208, MAG);
      eShot(en.x - 30, en.y + 8, -48, 190, RED);
      eShot(en.x + 30, en.y + 8, 48, 190, RED);
      if (mid) ringShot(en.x, en.y + 4, dens ? 12 : 9, 134, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 14, k * 40, 200, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 6, dens ? 14 : 11, 142, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 6, dens ? 10 : 8, 114, -en.spin * 1.4, GOLD, 3.0);
        aimShot(en.x, en.y + 10, 194, ORG);
      }
      if (low) {
        aimShot(en.x - 30, en.y + 8, 214, RED);
        aimShot(en.x + 30, en.y + 8, 214, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 4, dens ? 16 : 12, 148, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 4, dens ? 10 : 8, 104, -en.spin * 0.7, HOT, 2.8);
      if (mid) {
        aimShot(en.x - 28, en.y + 10, 204, PNK);
        aimShot(en.x + 28, en.y + 10, 204, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, dens ? 18 : 14, 162, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (dens) en.fireCd *= 0.76;
  }

  function launchFromDeck(en) {
    if (livingAir() > 16) return;
    const side = Math.random() < 0.5 ? -1 : 1;
    spawnFighter(en.x + side * rand(10, 28), en.y - 8, {
      vx: side * 46,
      vy: -36,
      rgb: ORG,
      fireCd: rand(0.5, 1.2)
    });
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0 && !bolting();
    const inv = G.invuln > 0;
    const dens = isCore();
    const scr = scrollSpd();

    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.ground && en.type !== 'mid' && en.type !== 'boss') {
        en.y += scr * dt;
        if (en.type === 'boat' || en.type === 'ship' || en.type === 'escort') {
          en.x += en.vx * dt;
          const pad = en.type === 'escort' ? 70 : en.type === 'ship' ? 54 : 40;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
        }
      } else if (en.type === 'mid' || en.type === 'boss') {
        const park = en.type === 'boss' ? 126 : 138;
        if (en.y < park) en.y += en.vy * dt;
        else {
          en.y = park;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 96 : 82;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
        if (en.type === 'boss' && G.stage >= 3 && en.y >= park - 4) {
          en.launchCd -= dt;
          if (en.launchCd <= 0) {
            launchFromDeck(en);
            en.launchCd = dens ? 1.05 : 1.55;
          }
        }
      } else if (en.type === 'powship') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'bomber') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 4.4) * 16 * dt;
        if (en.x > 80 && en.x < VW - 80) en.vx *= Math.exp(-dt * 0.32);
      } else if (en.type === 'dive') {
        if (en.t > 0.32) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 176;
          en.vx = lerp(en.vx, dx / len * asp, 1 - Math.exp(-dt * 3.1));
          en.vy = lerp(en.vy, dy / len * asp, 1 - Math.exp(-dt * 3.1));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'fighter') {
        if (!en.dive && en.t > 1.28 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.28) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 92, dt * 2);
          en.vy = Math.max(en.vy, 150);
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 52 || en.x < -72 || en.x > VW + 72 || (en.ground && en.y > VH + 42 && en.type !== 'mid' && en.type !== 'boss')) {
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && en.y > -10 && en.y < VH + 10) {
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          if (en.type === 'fighter' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, dens ? 194 : 168, MAG);
            if (dens && Math.random() < 0.45) aimShot(en.x, en.y + 8, 164, PNK);
            en.fireCd = (dens ? 1.28 : 2.28) + rand(0, 0.55);
          } else if (en.type === 'bomber' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x, en.y + 8, dens ? 192 : 160, STEEL);
            eShot(en.x - 14, en.y + 6, -28, 146, HOT);
            eShot(en.x + 14, en.y + 6, 28, 146, HOT);
            en.fireCd = dens ? 0.7 : 1.06;
          } else if (en.type === 'boat' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dens ? 184 : 152, SEA);
            en.fireCd = (dens ? 0.6 : 1.0) + rand(0, 0.22);
          } else if (en.type === 'ship' && en.y > 8 && en.y < VH - 70) {
            eShot(en.x - 12, en.y + 10, -36, 172, RED);
            eShot(en.x, en.y + 12, 0, 192, RED);
            eShot(en.x + 12, en.y + 10, 36, 172, RED);
            if (dens) aimShot(en.x, en.y + 8, 182, ORG);
            en.fireCd = dens ? 0.56 : 0.86;
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dens ? 214 : 172, GOLD);
            if (dens) {
              eShot(en.x - 8, en.y + 4, -42, 160, ORG);
              eShot(en.x + 8, en.y + 4, 42, 160, ORG);
            }
            en.fireCd = (dens ? 0.56 : 0.96) + rand(0, 0.24);
          } else if (en.type === 'escort' && en.y > 8 && en.y < VH - 70) {
            eShot(en.x - 18, en.y + 8, -30, 164, STEEL);
            eShot(en.x + 18, en.y + 8, 30, 164, STEEL);
            aimShot(en.x, en.y + 6, dens ? 196 : 160, GOLD);
            en.fireCd = dens ? 0.6 : 0.92;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, dens);
            else en.fireCd = 0.4;
          } else {
            en.fireCd = 2;
          }
        }
      }

      if (canHurt && !en.ground) {
        const rr = en.r + 4.6;
        const dx = en.x - px;
        const dy = en.y - py;
        if (dx * dx + dy * dy < rr * rr) {
          if (!inv) killPlayer();
        }
      }
    }
  }

  function updateShots(dt) {
    const playing = G.mode === 'play';
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -28 || s.x < -18 || s.x > VW + 18 || s.y > VH + 24) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(en, s.dmg, s.x, s.y);
          if (!REDUCE) {
            emit(2, {
              x: s.x, y: s.y, j: 2,
              vx0: -50, vx1: 50, vy0: -40, vy1: 20,
              life: 0.1, r0: 0.8, r1: 1.6, rgb: GOLD, g: 0
            });
          }
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && !bolting();
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y > VH + 22 || s.y < -32 || s.x < -22 || s.x > VW + 22) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = s.x - G.player.x;
        const dy = s.y - (G.player.y - 2);
        const rr = 4.6 + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          G.eShots.splice(i, 1);
          killPlayer();
        }
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 1.15);
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (p.y > VH + 22) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = p.x - G.player.x;
        const dy = p.y - G.player.y;
        if (dx * dx + dy * dy < 24 * 24) {
          pickPow(p);
          G.pows.splice(i, 1);
        }
      }
    }
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < foam.length; i++) {
      const s = foam[i];
      s.y += scr * 0.55 * s.z * dt;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < islands.length; i++) {
      const isl = islands[i];
      isl.y += scr * dt;
      if (isl.y - isl.h > VH + 30) {
        isl.y = -60 - rand(0, 80);
        isl.x = hash2((G.scroll + isl.w) | 0) * VW;
        isl.w = 34 + hash2((G.scroll * 0.1) | 0) * 72;
        isl.h = 20 + hash2((G.scroll * 0.13) | 0) * 34;
        isl.kind = hash2(G.scroll | 0);
      }
    }
    if (!REDUCE && G.mode !== 'lose' && G.deadT <= 0) {
      wash.push({
        x: G.player.x + rand(-6, 6),
        y: G.player.y + 12,
        t: 0,
        r: rand(6, 11)
      });
      capArr(wash, 18);
    }
    for (let i = wash.length - 1; i >= 0; i--) {
      wash[i].t += dt * 2.4;
      wash[i].y += 28 * dt;
      if (wash[i].t >= 1) wash.splice(i, 1);
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      p.vx *= Math.exp(-dt * 1.8);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.6;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.6;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t >= trails[i].life) trails.splice(i, 1);
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      bolts[i].t += dt;
      if (bolts[i].t >= bolts[i].life) bolts.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.toastT > 0) G.toastT -= dt;
  }

  function tickProp(dt) {
    G.propT -= dt;
    if (G.propT > 0) return;
    G.propT = G.mode === 'play' && G.deadT <= 0 ? 0.09 : 0.16;
    if (G.mode === 'lose') return;
    if (audio.ctx && !audio.muted) audio.prop();
  }

  function updatePlayer(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = plySpd();
    let dx = 0;
    let dy = 0;
    if (keys.l) dx -= 1;
    if (keys.r) dx += 1;
    if (keys.u) dy -= 1;
    if (keys.d) dy += 1;
    if (dx || dy) {
      const len = hypot(dx, dy);
      dx /= len;
      dy /= len;
      G.player.vx = dx * spd;
      G.player.vy = dy * spd;
      inputSrc = 'key';
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      G.player.x = lerp(G.player.x, tx, 1 - Math.exp(-dt * 16));
      G.player.y = lerp(G.player.y, ty, 1 - Math.exp(-dt * 16));
      G.player.vx = 0;
      G.player.vy = 0;
    } else {
      G.player.vx *= Math.exp(-dt * 10);
      G.player.vy *= Math.exp(-dt * 10);
    }
    G.player.x += G.player.vx * dt;
    G.player.y += G.player.vy * dt;
    G.player.x = clamp(G.player.x, 22, VW - 22);
    G.player.y = clamp(G.player.y, 40, VH - 28);
    const wantBank = clamp(G.player.vx * 0.0018, -0.28, 0.28);
    G.player.bank = lerp(G.player.bank || 0, wantBank, 1 - Math.exp(-dt * 10));
    if (bolting() && !REDUCE) {
      trails.push({
        x: G.player.x, y: G.player.y,
        t: 0, life: 0.28, rgb: GOLD
      });
      capArr(trails, 16);
    }
  }

  function grantBoltBonus() {
    if (G.bolts <= 0) return;
    const n = G.bolts * SCORE.bolt;
    addScore(n);
    toast('余闪 +' + n, false, true);
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      tickProp(dt * 0.35);
      return;
    }
    updateFx(dt);
    tickProp(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.player.bank = Math.sin(G.t * 0.7) * 0.12;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingAir() < 8) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 40);
        G.spawnT = 2.5;
      }
      updateEnts(dt);
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      updateWorld(dt * 0.5);
      return;
    }

    G.clock += dt;
    if (!hasBig()) G.stageT += dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.boltT > 0) G.boltT -= dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseGame();
          return;
        }
        respawn();
      }
    }

    if (G.stageClearT > 0) {
      G.stageClearT -= dt;
      if (G.stageClearT <= 0) {
        grantBoltBonus();
        if (G.stage >= 3) {
          winGame();
          return;
        }
        G.stage += 1;
        G.stageT = 0;
        G.waveI = 0;
        G.bolts = BOLT_MAX;
        G.invuln = Math.max(G.invuln, 0.85);
        toast('第 ' + G.stage + ' 关 · ' + stageInfo().name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isCore()) coreThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) syncHud();
  }

  function drawIsland(isl, bio) {
    const x = sx(isl.x);
    const y = sy(isl.y);
    const w = isl.w * scale;
    const h = isl.h * scale;
    ctx.save();
    if (bio === 'dusk') {
      ctx.fillStyle = 'rgba(48, 22, 16, 0.94)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.55, h * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(DUSK, 0.48);
      ctx.beginPath();
      ctx.moveTo(x - w * 0.18, y + h * 0.1);
      ctx.lineTo(x, y - h * 0.48);
      ctx.lineTo(x + w * 0.18, y + h * 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 120, 40, 0.38)';
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.28, w * 0.08, h * 0.08, 0, 0, TAU);
      ctx.fill();
    } else if (bio === 'reef') {
      ctx.fillStyle = 'rgba(18, 52, 46, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.52, h * 0.4, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(REEF, 0.6);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.38, h * 0.26, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = 'rgba(210, 180, 120, 0.3)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.22, h * 0.14, 0, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(16, 48, 52, 0.88)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.48, h * 0.38, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(LAG, 0.35);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 177, 74, 0.16)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.18, h * 0.12, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWorld() {
    const bio = biome();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (bio === 'dusk') {
      g.addColorStop(0, '#2a1410');
      g.addColorStop(0.42, '#1a1014');
      g.addColorStop(1, '#140806');
    } else if (bio === 'reef') {
      g.addColorStop(0, '#142820');
      g.addColorStop(0.5, '#101818');
      g.addColorStop(1, '#140806');
    } else {
      g.addColorStop(0, '#183038');
      g.addColorStop(0.4, '#1a2018');
      g.addColorStop(1, '#140806');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.save();
    ctx.strokeStyle = rgba(bio === 'dusk' ? DUSK : bio === 'reef' ? REEF : HOT, bio === 'dusk' ? 0.16 : 0.12);
    ctx.lineWidth = 1;
    const off = (G.scroll * 0.35) % 28;
    for (let i = -1; i < 30; i++) {
      const yy = sy(i * 28 - off);
      ctx.beginPath();
      for (let x = 0; x <= VW; x += 16) {
        const wob = Math.sin((x + G.scroll * 0.4) * 0.04 + i) * 4;
        if (x === 0) ctx.moveTo(sx(x), yy + wob * scale);
        else ctx.lineTo(sx(x), yy + wob * scale);
      }
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < foam.length; i++) {
      const s = foam[i];
      ctx.fillStyle = rgba(WHT, s.a * (bio === 'dusk' ? 0.28 : 0.42));
      ctx.fillRect(sx(s.x), sy(s.y), s.w * 0.4 * scale, 1.4 * scale);
    }

    for (let i = 0; i < islands.length; i++) drawIsland(islands[i], bio);

    for (let i = 0; i < wash.length; i++) {
      const w = wash[i];
      ctx.strokeStyle = rgba(HOT, (1 - w.t) * 0.3);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(w.y), w.r * (0.6 + w.t) * scale, w.r * 0.35 * scale, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawAce(x, y, a, flashHit, ang, bank) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang || (bank || 0));
    const bt = bolting();
    const sc = bt && !REDUCE ? 1.08 : 1;
    ctx.scale(scale * sc, scale * sc);
    ctx.globalAlpha = a == null ? 1 : a;
    const flash = flashHit || G.muzzle > 0;
    const body = flash ? WHT : HOT;
    ctx.shadowColor = rgba(bt ? GOLD : body, bt ? 0.9 : 0.6);
    ctx.shadowBlur = bt ? 20 : 12;
    ctx.strokeStyle = rgba(body, 0.96);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-11, -6);
    ctx.lineTo(-11, 14);
    ctx.moveTo(11, -6);
    ctx.lineTo(11, 14);
    ctx.stroke();
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-15, 14);
    ctx.lineTo(-7, 14);
    ctx.moveTo(7, 14);
    ctx.lineTo(15, 14);
    ctx.stroke();
    ctx.strokeStyle = rgba(body, 0.95);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-16, -2);
    ctx.lineTo(16, -2);
    ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : rgba(CREAM, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(3.4, -2);
    ctx.lineTo(0, 8);
    ctx.lineTo(-3.4, -2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(-2.2, -6);
    ctx.lineTo(0, -9);
    ctx.lineTo(2.2, -6);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.86);
    ctx.beginPath();
    ctx.ellipse(0, -7, 2.2, 3.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(-11, -4, 2.1, 0, TAU);
    ctx.arc(11, -4, 2.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(RED, 0.85);
    ctx.beginPath();
    ctx.arc(-11, -4, 0.7, 0, TAU);
    ctx.arc(11, -4, 0.7, 0, TAU);
    ctx.fill();
    if (G.powLv >= 2) {
      ctx.fillStyle = rgba(SKY, 0.9);
      ctx.beginPath();
      ctx.arc(-18, 4, 2.4, 0, TAU);
      ctx.arc(18, 4, 2.4, 0, TAU);
      ctx.fill();
    }
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(-2.4, -16);
      ctx.lineTo(0, -28);
      ctx.lineTo(2.4, -16);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
    ctx.shadowColor = rgba(en.rgb, 0.5);
    ctx.shadowBlur = 10;
    if (en.ground) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(1, 8, en.w * 0.42, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.shadowBlur = 10;
    }
    if (en.type === 'fighter' || en.type === 'dive') {
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.lineTo(10, 0);
      ctx.lineTo(3, 1);
      ctx.lineTo(2.4, -9);
      ctx.lineTo(-2.4, -9);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.32);
      ctx.fillRect(-1.1, -2, 2.2, 7);
    } else if (en.type === 'bomber') {
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(-12, -6);
      ctx.lineTo(-12, 10);
      ctx.moveTo(12, -6);
      ctx.lineTo(12, 10);
      ctx.stroke();
      ctx.fillRect(-20, -2, 40, 6);
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-3, -8, 6, 12);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.arc(-12, -4, 2, 0, TAU);
      ctx.arc(12, -4, 2, 0, TAU);
      ctx.fill();
    } else if (en.type === 'boat') {
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(10, 4);
      ctx.lineTo(6, 10);
      ctx.lineTo(-6, 10);
      ctx.lineTo(-10, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-3, -2, 6, 8);
    } else if (en.type === 'ship') {
      ctx.beginPath();
      ctx.ellipse(0, 4, 28, 12, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-20, -8, 10, 20);
      ctx.fillRect(-4, -14, 8, 28);
      ctx.fillRect(12, -6, 10, 16);
      ctx.fillStyle = rgba(WHT, 0.22);
      ctx.fillRect(-8, -2, 16, 6);
    } else if (en.type === 'turret') {
      const dx = G.player.x - en.x;
      const dy = G.player.y - en.y;
      ctx.fillStyle = 'rgba(40, 24, 18, 0.95)';
      ctx.beginPath();
      ctx.arc(0, 4, 11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, TAU);
      ctx.fill();
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillRect(4, -2.1, 14, 4.2);
    } else if (en.type === 'escort') {
      ctx.beginPath();
      ctx.ellipse(0, 4, 34, 12, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.18);
      ctx.fillRect(-28, -2, 56, 6);
      ctx.fillStyle = flash ? '#fff' : rgba(STEEL, 0.95);
      ctx.fillRect(-22, -10, 10, 22);
      ctx.fillRect(8, -8, 14, 8);
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-24, 2);
      ctx.lineTo(26, 2);
      ctx.stroke();
    } else if (en.type === 'powship') {
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, 2);
      ctx.lineTo(3, 2);
      ctx.lineTo(2, 12);
      ctx.lineTo(-2, 12);
      ctx.lineTo(-3, 2);
      ctx.lineTo(-8, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#140806';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('雷', 0, 1);
    } else if (en.type === 'mid') {
      ctx.beginPath();
      ctx.ellipse(0, 4, 38, 13, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-22, -10, 12, 22);
      ctx.fillRect(-4, -16, 8, 28);
      ctx.fillRect(14, -8, 12, 16);
      ctx.fillStyle = rgba(GOLD, 0.75);
      ctx.beginPath();
      ctx.arc(-18, -2, 3, 0, TAU);
      ctx.arc(18, -2, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-10, -2, 20, 6);
    } else if (en.type === 'boss') {
      if (G.stage >= 3) {
        ctx.beginPath();
        ctx.ellipse(0, 6, 58, 16, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.16);
        ctx.fillRect(-48, -2, 96, 8);
        ctx.fillStyle = flash ? '#fff' : rgba(STEEL, 0.95);
        ctx.fillRect(-36, -16, 16, 28);
        ctx.fillRect(18, -10, 22, 12);
        ctx.strokeStyle = rgba(GOLD, 0.7);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-44, 2);
        ctx.lineTo(46, 2);
        ctx.stroke();
        ctx.fillStyle = rgba(HOT, 0.8);
        ctx.beginPath();
        ctx.arc(-28, -4, 3.2, 0, TAU);
        ctx.arc(8, -4, 3.2, 0, TAU);
        ctx.arc(32, -4, 3.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(RED, 0.7);
        ctx.fillRect(-6, 12, 12, 6);
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 4, 50, 14, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-28, -12, 14, 26);
        ctx.fillRect(-6, -18, 12, 34);
        ctx.fillRect(18, -10, 16, 20);
        ctx.fillStyle = rgba(GOLD, 0.8);
        ctx.beginPath();
        ctx.arc(-32, -2, 3.4, 0, TAU);
        ctx.arc(-10, -2, 3.4, 0, TAU);
        ctx.arc(16, -2, 3.4, 0, TAU);
        ctx.arc(34, -2, 3.4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.24);
        ctx.fillRect(-24, 0, 48, 6);
        ctx.fillStyle = rgba(RED, 0.7);
        ctx.fillRect(-4, 10, 8, 6);
      }
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.85);
      ctx.shadowBlur = 9 * scale;
      ctx.fillRect(sx(s.x - 1.4), sy(s.y - 7), 2.8 * scale, 13 * scale);
      if (!REDUCE) {
        ctx.globalAlpha = 0.32;
        ctx.fillRect(sx(s.x - 1.2), sy(s.y), 2.4 * scale, 11 * scale);
      }
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.75);
      ctx.shadowBlur = 7 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.beginPath();
      ctx.arc(sx(s.x - 0.6), sy(s.y - 0.6), s.r * 0.35 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 8) * 2;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.rotate(p.t * 2.2);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(p.kind === 'bolt' ? CYN : GOLD, 0.95);
      ctx.shadowColor = rgba(p.kind === 'bolt' ? CYN : GOLD, 0.8);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#140806';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.2);
      ctx.shadowBlur = 0;
      ctx.fillText(p.kind === 'bolt' ? '闪' : '雷', 0, 1);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), Math.max(0.6, p.r * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = 3 * (1 - r.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 46) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      const a = 1 - t.t / t.life;
      ctx.strokeStyle = rgba(t.rgb, a * 0.45);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(t.x), sy(t.y), (8 + t.t * 18) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawBolts() {
    if (REDUCE) return;
    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      const a = 1 - b.t / b.life;
      const pts = b.pts;
      if (!pts || pts.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = rgba(b.rgb, a);
      ctx.lineWidth = b.w * scale;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = rgba(b.rgb, 0.85);
      ctx.shadowBlur = 10 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
      for (let k = 1; k < pts.length; k++) ctx.lineTo(sx(pts[k].x), sy(pts[k].y));
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, a * 0.7);
      ctx.lineWidth = Math.max(0.6, b.w * 0.35) * scale;
      ctx.shadowBlur = 0;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = rgba(f.rgb, 0.7);
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'boss' || t === 'mid') && G.ents[i].hp > 0) {
        boss = G.ents[i];
        if (t === 'boss') break;
      }
    }
    if (!boss) return;
    const x = 40;
    const y = 16;
    const w = VW - 80;
    const h = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    const t = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : HOT, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : HOT, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140806';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (!REDUCE && G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = W * 0.5;
      const cy = H * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawWorld();

    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();
    drawBolts();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && !bolting() && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawAce(G.player.x, G.player.y, 1, false, 0, G.player.bank);
    }
    drawFloats();
    drawBossBar();
    drawFlash();
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

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pows.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wash.length = 0;
    bolts.length = 0;
    trails.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'raid';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.scroll = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.powLv = 0;
    G.bolts = BOLT_MAX;
    G.boltT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.boltHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.spawnT = 0.7;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.propT = 0;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '海核 · 编队更密' : '四一 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.lives = LIVES;
    G.powLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.bolts = BOLT_MAX;
    G.boltT = 0;
    G.deadT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '四一',
      '双尾闪电。空格连射扫空打舰，Shift 落雷清弹炸航母。吉尔伯特、马绍尔、特鲁克。'
    );
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

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isCore()) goTitle();
      else startGame('core');
    }
  }

  function tryBolt() {
    audio.ensure();
    if (overlayOpen()) return;
    if (G.mode === 'play') doBolt();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const boltKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ';

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

    if (down && (isMove || space || boltKey || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      if (boltKey) G.boltHold = false;
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
    if (k === '1') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '2') {
      if (overlayOpen()) secondaryAction();
      return;
    }
    if (boltKey) {
      if (!G.boltHold) {
        G.boltHold = true;
        tryBolt();
      }
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space && G.mode === 'play') G.fireHold = true;
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
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
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
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
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

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && isCore()) goTitle();
      else if (G.mode === 'win') startGame('core');
      else goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  function bindBoltBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      tryBolt();
    });
  }
  bindBoltBtn(btnBolt);
  bindBoltBtn(btnPadBolt);

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
      G.boltHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
