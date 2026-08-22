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
  const LOOP_MAX = 3;
  const LOOP_DUR = 0.78;
  const BEST_KEY = 'playbox-capcom-1941-best';
  const MUTE_KEY = 'playbox-capcom-1941-mute';
  const OPS = '方向 / WASD 移动 · 空格射击蓄雷 · Shift / Z 翻环落雷 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [26, 212, 255];
  const SKY = [126, 232, 255];
  const GOLD = [255, 227, 107];
  const WHT = [230, 248, 255];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 160, 72];
  const SEA = [26, 122, 168];
  const LAND = [48, 128, 96];
  const SAND = [200, 176, 112];
  const STEEL = [120, 156, 176];
  const BOLT = [255, 248, 200];

  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'MAX'];

  const SCORE = {
    fighter: 50,
    dive: 80,
    twin: 120,
    boat: 100,
    ship: 200,
    turret: 160,
    bunker: 150,
    rocket: 180,
    carrier: 300,
    mid: 2000,
    boss: 4000,
    clear: 1500,
    all: 8000,
    loop: 500
  };

  const STAGES = [
    {
      name: '北大西洋',
      biome: 'sea',
      mid: '驱逐舰',
      boss: '战列舰',
      midHp: 40,
      bossHp: 96,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.2, kind: 'boats' },
        { t: 5.6, kind: 'stream', dir: 1 },
        { t: 8.0, kind: 'ship' },
        { t: 10.6, kind: 'dive', n: 4 },
        { t: 13.0, kind: 'carrier' },
        { t: 15.4, kind: 'boats' },
        { t: 17.8, kind: 'v', n: 7 },
        { t: 20.6, kind: 'mid' },
        { t: 26.2, kind: 'stream', dir: -1 },
        { t: 28.6, kind: 'ship' },
        { t: 31.0, kind: 'dive', n: 5 },
        { t: 33.6, kind: 'boats' },
        { t: 36.0, kind: 'twin' },
        { t: 38.4, kind: 'v', n: 7 },
        { t: 41.0, kind: 'carrier' },
        { t: 43.4, kind: 'ship' },
        { t: 48.2, kind: 'boss' }
      ]
    },
    {
      name: '欧陆港口',
      biome: 'port',
      mid: '岸防炮',
      boss: '港湾要塞',
      midHp: 52,
      bossHp: 126,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 2.8, kind: 'boats' },
        { t: 5.0, kind: 'turrets' },
        { t: 7.4, kind: 'dive', n: 5 },
        { t: 9.6, kind: 'bunkers' },
        { t: 12.0, kind: 'stream', dir: -1 },
        { t: 14.4, kind: 'ship' },
        { t: 16.8, kind: 'carrier' },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'turrets' },
        { t: 27.0, kind: 'twin' },
        { t: 29.2, kind: 'dive', n: 6 },
        { t: 31.6, kind: 'bunkers' },
        { t: 34.0, kind: 'v', n: 9 },
        { t: 36.4, kind: 'boats' },
        { t: 38.8, kind: 'turrets' },
        { t: 41.2, kind: 'carrier' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '火箭基地',
      biome: 'land',
      mid: '发射台',
      boss: '指挥部',
      midHp: 66,
      bossHp: 174,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.4, kind: 'rockets' },
        { t: 4.4, kind: 'twin' },
        { t: 6.4, kind: 'bunkers' },
        { t: 8.4, kind: 'dive', n: 6 },
        { t: 10.4, kind: 'turrets' },
        { t: 12.6, kind: 'stream', dir: 1 },
        { t: 14.6, kind: 'rockets' },
        { t: 16.6, kind: 'carrier' },
        { t: 18.8, kind: 'mid' },
        { t: 24.6, kind: 'twin' },
        { t: 26.6, kind: 'dive', n: 7 },
        { t: 28.8, kind: 'bunkers' },
        { t: 31.0, kind: 'rockets' },
        { t: 33.2, kind: 'turrets' },
        { t: 35.4, kind: 'v', n: 11 },
        { t: 37.6, kind: 'stream', dir: -1 },
        { t: 39.8, kind: 'rockets' },
        { t: 42.0, kind: 'bunkers' },
        { t: 52.2, kind: 'boss' }
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
  const btnGuns = document.getElementById('btn-guns');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnLoop = document.getElementById('btn-loop');
  const btnPadLoop = document.getElementById('btn-pad-loop');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const comboEl = document.getElementById('combo-label');
  const loopLabel = document.getElementById('loop-label');
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
  let wpnTok = 0;
  let loopTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false, lp: false };
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
  const ghosts = [];

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
    loops: LOOP_MAX,
    loopT: 0,
    loopAng: 0,
    charge: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    fireCd: 0,
    fireHold: false,
    loopHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
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
  function isGuns() {
    return G.kind === 'guns';
  }
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'sea';
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function plySpd() {
    return (isGuns() ? 310 : 276) + G.powLv * 8;
  }
  function scrollSpd() {
    if (hasBig()) return isGuns() ? 36 : 28;
    const base = isGuns() ? 112 : 80;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isGuns() ? 10 : 8);
  }
  function hpMul() {
    return isGuns() ? 1.22 : 1;
  }
  function shotCap() {
    return isGuns() ? 168 : 112;
  }
  function chargeTime() {
    return 0.92 - G.powLv * 0.11;
  }
  function looping() {
    return G.loopT > 0;
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
      this.beep(740 + G.powLv * 44, 0.046, 'square', 0.03, 1540);
    },
    chargeTick() {
      this.ensure();
      this.beep(280 + G.charge * 520, 0.04, 'sine', 0.018, 420 + G.charge * 700);
    },
    charged() {
      this.ensure();
      this.beep(180, 0.16, 'sawtooth', 0.055, 980);
      this.beep(980, 0.12, 'square', 0.04, 1600);
      this.noise(0.1, 0.05, 700);
    },
    loopBoom() {
      this.ensure();
      this.noise(0.18, 0.078, 160);
      this.beep(140, 0.24, 'sawtooth', 0.06, 48);
      this.beep(720, 0.16, 'square', 0.04, 180);
      this.beep(90, 0.2, 'sine', 0.038, 40);
    },
    hit(kind, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      if (kind === 'ground') {
        this.noise(0.05, 0.038, 380);
        this.beep(220 * lift, 0.09, 'sawtooth', 0.038, 70);
      } else {
        this.noise(0.036, 0.032, 1200);
        this.beep(540 * lift, 0.066, 'square', 0.042, 920 * lift);
      }
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.1, big ? 0.076 : 0.048, big ? 220 : 460);
      this.beep(big ? 160 : 250, big ? 0.26 : 0.14, 'sawtooth', 0.05, 52);
    },
    pow() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    prop() {
      this.ensure();
      this.beep(92, 0.032, 'sawtooth', 0.01, 70);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 300);
      this.beep(270, 0.22, 'sawtooth', 0.052, 64);
      this.beep(140, 0.32, 'sine', 0.044, 40);
    },
    boss() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.05, 96);
      this.beep(130, 0.3, 'square', 0.04, 70);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
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

  function flashLoopHud() {
    if (!loopLabel) return;
    loopLabel.classList.remove('hot');
    void loopLabel.offsetWidth;
    loopLabel.classList.add('hot');
    loopTok += 1;
    const tok = loopTok;
    setTimeout(function () {
      if (tok === loopTok && loopLabel) loopLabel.classList.remove('hot');
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
      tagLabel.textContent = isGuns() ? '舰炮' : '反击';
      tagLabel.classList.toggle('warn', isGuns());
      tagLabel.classList.toggle('hot', !isGuns() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.powLv >= WPN_MAX);
    }
    if (loopLabel) {
      loopLabel.textContent = '环 ×' + G.loops;
      loopLabel.classList.toggle('empty', G.loops <= 0);
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.charge, 0, 1) + ')';
    if (chgWrap) chgWrap.classList.toggle('hot', G.charge >= 0.92 && G.mode === 'play');
    if (btnLoop) btnLoop.classList.toggle('held', looping());
    if (btnPadLoop) btnPadLoop.classList.toggle('held', looping());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint('航线反击 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格蓄雷 · Shift 翻环', 'warn');
    else setHint('空格打空打地 · 蓄满放雷贯射 · Shift 翻环落雷炸舰', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : '1941';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const start = kind === 'title';
    if (ovStart) ovStart.classList.toggle('gone', !start);
    if (ovEnd) ovEnd.classList.toggle('gone', start);
    if (btnOvModes) {
      if (kind === 'lose') btnOvModes.textContent = '换模式';
      else if (kind === 'win') btnOvModes.textContent = isGuns() ? '换模式' : '舰炮';
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

  function addBolt(x0, y0, x1, y1, life, thick, rgb) {
    const pts = [];
    const segs = 7 + ((Math.random() * 4) | 0);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const jx = i === 0 || i === segs ? 0 : rand(-18, 18);
      pts.push({ x: lerp(x0, x1, t) + jx, y: lerp(y0, y1, t) });
    }
    bolts.push({ pts: pts, t: 0, life: life || 0.22, thick: thick || 2.2, rgb: rgb || BOLT });
    capArr(bolts, 22);
  }

  function seedWorld() {
    foam.length = 0;
    islands.length = 0;
    for (let i = 0; i < 48; i++) {
      foam.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.4, 1.3),
        a: rand(0.12, 0.5),
        w: rand(8, 22)
      });
    }
    for (let i = 0; i < 7; i++) {
      islands.push({
        x: hash2(i * 17 + 3) * VW,
        y: -40 - i * 110,
        w: 36 + hash2(i * 9) * 70,
        h: 22 + hash2(i * 13) * 36,
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
      spin: spec.spin || 0
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
      vy: extra.vy != null ? extra.vy : 98,
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
        vy: 122,
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
        vx: 0, vy: 64,
        hp: 1, r: 10, score: SCORE.dive,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnTwin() {
    const left = Math.random() < 0.5;
    spawnEnt({
      type: 'twin',
      x: left ? -30 : VW + 30,
      y: rand(70, 170),
      vx: left ? 88 : -88,
      vy: 22,
      hp: 4, r: 18, score: SCORE.twin,
      rgb: STEEL,
      w: 38, h: 18,
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
    const n = isGuns() ? 3 : 2;
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

  function spawnBunker(x) {
    spawnEnt({
      type: 'bunker',
      x: x == null ? rand(60, VW - 60) : x,
      y: -26,
      vx: 0, vy: 0,
      hp: 7, r: 18, score: SCORE.bunker,
      rgb: SAND,
      ground: true,
      drop: Math.random() < 0.28,
      w: 32, h: 20,
      fireCd: rand(0.6, 1.3)
    });
  }

  function spawnBunkers() {
    const n = isGuns() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 64 + i * ((VW - 128) / Math.max(1, n - 1)) + rand(-16, 16);
      spawnBunker(clamp(x, 48, VW - 48));
    }
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
    const n = isGuns() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnTurret(clamp(x, 40, VW - 40), -24 - i * 16);
    }
  }

  function spawnRocket(x) {
    spawnEnt({
      type: 'rocket',
      x: x == null ? rand(70, VW - 70) : x,
      y: -32,
      vx: rand(-20, 20),
      vy: 0,
      hp: 5, r: 15, score: SCORE.rocket,
      rgb: ORG,
      ground: true,
      drop: Math.random() < 0.24,
      w: 18, h: 28,
      fireCd: rand(0.5, 1.0)
    });
  }

  function spawnRockets() {
    const n = isGuns() ? 3 : 2;
    for (let i = 0; i < n; i++) spawnRocket();
  }

  function spawnCarrier() {
    spawnEnt({
      type: 'carrier',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 78,
      hp: 2, r: 13, score: SCORE.carrier,
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
    const sea = st.biome === 'sea';
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -60,
      vx: 58,
      vy: 46,
      hp: hp,
      r: 34,
      score: SCORE.mid,
      rgb: sea ? SEA : LAND,
      drop: 'p',
      ground: true,
      w: 76,
      h: 36,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(CYN, 0.36);
    kick(4.6);
  }

  function spawnBoss() {
    if (hasBig()) return;
    const st = stageInfo();
    const hp = Math.round(st.bossHp * hpMul());
    spawnEnt({
      type: 'boss',
      x: VW * 0.5,
      y: -74,
      vx: 66,
      vy: 42,
      hp: hp,
      r: 46,
      score: SCORE.boss + G.stage * SCORE.clear,
      rgb: MAG,
      drop: 'p',
      ground: true,
      w: 102,
      h: 48,
      fireCd: 0.55,
      phase: 0,
      spin: 0
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
    else if (w.kind === 'bunkers') spawnBunkers();
    else if (w.kind === 'turrets') spawnTurretWave();
    else if (w.kind === 'twin') spawnTwin();
    else if (w.kind === 'rockets') spawnRockets();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y) {
    G.pows.push({
      x: x, y: y, vy: 62, t: 0,
      vx: rand(-38, 38)
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
      dmg: spec.dmg || 1,
      pierce: spec.pierce || 0,
      bolt: !!spec.bolt
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || looping()) return;
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
      fan(0, 0);
    } else if (lv === 1) {
      fan(-8, 2);
      fan(8, 2);
    } else if (lv === 2) {
      fan(-12, 3, -70, spd);
      fan(0, -2);
      fan(12, 3, 70, spd);
    } else if (lv === 3) {
      fan(-16, 5, -120, spd);
      fan(-7, 1, -40, spd);
      fan(0, -3);
      fan(7, 1, 40, spd);
      fan(16, 5, 120, spd);
    } else {
      fan(-18, 6, -150, spd);
      fan(-11, 2, -80, spd);
      fan(-4, -1);
      fan(0, -4);
      fan(4, -1);
      fan(11, 2, 80, spd);
      fan(18, 6, 150, spd);
    }
    if (lv >= 2) {
      addShot({ x: x - 18, y: y + 6, vx: -40, vy: spd * 0.92, r: 2.6, rgb: CYN, dmg: 1 });
      addShot({ x: x + 18, y: y + 6, vx: 40, vy: spd * 0.92, r: 2.6, rgb: CYN, dmg: 1 });
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

  function fireCharged() {
    if (G.mode !== 'play' || G.deadT > 0 || looping()) return;
    const lv = G.powLv;
    const x = G.player.x;
    const y = G.player.y - 18;
    const dmg = 3 + lv;
    const wide = 22 + lv * 6;
    addShot({
      x: x, y: y, vx: 0, vy: -820,
      r: wide * 0.28, rgb: BOLT, dmg: dmg, pierce: 4 + lv, bolt: true
    });
    addBolt(x, y, x + rand(-10, 10), -20, 0.28, 3.4 + lv * 0.4, BOLT);
    addBolt(x - 8, y, x - wide * 0.4, -30, 0.2, 1.8, CYN);
    addBolt(x + 8, y, x + wide * 0.4, -30, 0.2, 1.8, CYN);
    G.muzzle = 0.1;
    G.charge = 0;
    G.fireCd = 0.16;
    audio.charged();
    juice(x, y - 20, CYN, 1.35);
    hitStop(0.05);
    screenFlash(BOLT, 0.42);
    kick(3.4);
    emit(14, {
      x: x, y: y, j: 8,
      vx0: -80, vx1: 80, vy0: -280, vy1: -40,
      life: 0.22, r0: 1.2, r1: 3.2, rgb: BOLT, g: 0
    });
    syncHud();
  }

  function doLoop() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (looping()) return;
    if (G.loops <= 0) {
      toast('环用尽', true, false);
      return;
    }
    G.loops -= 1;
    G.loopT = LOOP_DUR;
    G.loopAng = 0;
    G.invuln = Math.max(G.invuln, LOOP_DUR);
    G.charge = 0;
    G.fireHold = false;
    flashLoopHud();
    audio.loopBoom();
    screenFlash(BOLT, 0.62);
    hitStop(0.056);
    kick(5.8);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    const px = G.player.x;
    const py = G.player.y;
    for (let k = 0; k < 6; k++) {
      addBolt(px + rand(-90, 90), -10, px + rand(-70, 70), VH * 0.7 + rand(-40, 80), 0.28, 2.4, k % 2 ? CYN : BOLT);
    }
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dmg = en.ground ? 5 : 3;
      addBolt(en.x + rand(-8, 8), -8, en.x, en.y, 0.2, en.ground ? 3.2 : 2.0, GOLD);
      hurtEnt(en, dmg, en.x, en.y);
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      emit(2, {
        x: s.x, y: s.y, j: 3,
        vx0: -60, vx1: 60, vy0: -40, vy1: 40,
        life: 0.14, r0: 1, r1: 2, rgb: CYN, g: 0
      });
      G.eShots.splice(i, 1);
    }
    juice(px, py, CYN, 2.1);
    toast('落雷', false, true);
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
        life: 0.32, r0: 1.4, r1: 3.4, rgb: SAND, g: 280
      });
    } else {
      audio.hit('air', G.combo);
    }
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.drop === 'p' || en.drop === true) spawnPow(en.x, en.y);
    else if ((en.type === 'ship' || en.type === 'rocket' || en.type === 'bunker') && Math.random() < 0.22) spawnPow(en.x, en.y);
    if (en.type === 'boss') {
      G.stageClearT = 2.1;
      addScore(SCORE.clear * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      toast(stageInfo().name + '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (G.powLv < WPN_MAX) {
      G.powLv += 1;
      toast(G.powLv >= WPN_MAX ? '雷 MAX' : '雷加宽', false, true);
    } else if (G.loops < LOOP_MAX + 2) {
      G.loops += 1;
      toast('环 +1', false, true);
      flashLoopHud();
    } else {
      addScore(500 * G.mult);
      toast('+500', false, true);
    }
    flashWpn();
    juice(p.x, p.y, GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, '雷', GOLD, true);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('pow');
      void stageEl.offsetWidth;
      stageEl.classList.add('pow');
    }
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0 || looping()) return;
    G.lives -= 1;
    G.deadT = 0.95;
    breakCombo();
    G.fireHold = false;
    G.charge = 0;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.powLv > 0) spawnPow(G.player.x, G.player.y - 18);
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
    G.charge = 0;
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
    addScore(SCORE.all);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '航线反击', (isGuns() ? '舰炮通关' : '三关打穿') + ' · 分数 ' + G.score);
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

  function gunsThink(dt) {
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
    G.spawnT = clamp(1.42 / (1 + G.stage * 0.12), 0.38, 1.42);
    if (livingAir() > 24) return;
    const r = Math.random();
    if (r < 0.2) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.34) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.46) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.58) spawnBoats();
    else if (r < 0.7) spawnTurretWave();
    else if (r < 0.8) spawnShip();
    else if (r < 0.88) spawnRockets();
    else if (r < 0.94) spawnTwin();
    else spawnCarrier();
  }

  function bossFire(en, dens) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += dens ? 0.22 : 0.16;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 16, dens ? 210 : 176, CYN);
      eShot(en.x - 18, en.y + 10, -46, 186, PNK);
      eShot(en.x + 18, en.y + 10, 46, 186, PNK);
      if (mid) ringShot(en.x, en.y, dens ? 10 : 8, 150, en.spin, GOLD, 3.2);
      if (low) {
        aimShot(en.x - 22, en.y + 8, 200, MAG);
        aimShot(en.x + 22, en.y + 8, 200, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 18, 214, MAG);
      eShot(en.x - 28, en.y + 12, -50, 196, RED);
      eShot(en.x + 28, en.y + 12, 50, 196, RED);
      if (mid) ringShot(en.x, en.y + 6, dens ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 42, 208, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, dens ? 14 : 11, 146, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 8, dens ? 10 : 8, 118, -en.spin * 1.4, GOLD, 3.0);
        aimShot(en.x, en.y + 16, 200, ORG);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 220, RED);
        aimShot(en.x + 28, en.y + 10, 220, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 6, dens ? 16 : 12, 152, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 6, dens ? 10 : 8, 108, -en.spin * 0.7, CYN, 2.8);
      if (mid) {
        aimShot(en.x - 20, en.y + 14, 210, PNK);
        aimShot(en.x + 20, en.y + 14, 210, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, dens ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (dens) en.fireCd *= 0.76;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0 && !looping();
    const inv = G.invuln > 0;
    const dens = isGuns();
    const scr = scrollSpd();
    const ram = looping();

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
        if (en.type === 'boat' || en.type === 'ship' || en.type === 'rocket') {
          en.x += en.vx * dt;
          const pad = en.type === 'ship' ? 54 : 40;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
        }
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < (en.type === 'boss' ? 108 : 124)) en.y += en.vy * dt;
        else {
          en.y = en.type === 'boss' ? 108 : 124;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 92 : 78;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
      } else if (en.type === 'carrier') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'twin') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 4.4) * 16 * dt;
        if (en.x > 80 && en.x < VW - 80) en.vx *= Math.exp(-dt * 0.32);
      } else if (en.type === 'dive') {
        if (en.t > 0.32) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 178;
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
          en.vy = Math.max(en.vy, 154);
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 52 || en.x < -72 || en.x > VW + 72 || (en.ground && en.y > VH + 42)) {
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && en.y > -10 && en.y < VH + 10) {
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          if (en.type === 'fighter' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, dens ? 198 : 172, MAG);
            if (dens && Math.random() < 0.45) aimShot(en.x, en.y + 8, 168, PNK);
            en.fireCd = (dens ? 1.3 : 2.3) + rand(0, 0.55);
          } else if (en.type === 'twin' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x, en.y + 8, dens ? 196 : 164, STEEL);
            eShot(en.x - 12, en.y + 6, -28, 150, CYN);
            eShot(en.x + 12, en.y + 6, 28, 150, CYN);
            en.fireCd = dens ? 0.72 : 1.08;
          } else if (en.type === 'boat' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dens ? 188 : 156, SEA);
            en.fireCd = (dens ? 0.62 : 1.02) + rand(0, 0.22);
          } else if (en.type === 'ship' && en.y > 8 && en.y < VH - 70) {
            eShot(en.x - 12, en.y + 10, -36, 176, RED);
            eShot(en.x, en.y + 12, 0, 196, RED);
            eShot(en.x + 12, en.y + 10, 36, 176, RED);
            if (dens) aimShot(en.x, en.y + 8, 186, ORG);
            en.fireCd = dens ? 0.58 : 0.88;
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dens ? 218 : 176, GOLD);
            if (dens) {
              eShot(en.x - 8, en.y + 4, -42, 164, ORG);
              eShot(en.x + 8, en.y + 4, 42, 164, ORG);
            }
            en.fireCd = (dens ? 0.58 : 0.98) + rand(0, 0.24);
          } else if (en.type === 'rocket' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y - 10, dens ? 214 : 178, ORG);
            eShot(en.x, en.y - 12, 0, -120, GOLD, 3.4);
            en.fireCd = dens ? 0.7 : 1.08;
          } else if (en.type === 'bunker' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dens ? 210 : 170, SAND);
            eShot(en.x - 12, en.y + 4, -48, 154, GOLD);
            eShot(en.x + 12, en.y + 4, 48, 154, GOLD);
            en.fireCd = dens ? 0.7 : 1.12;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, dens);
            else en.fireCd = 0.4;
          } else {
            en.fireCd = 2;
          }
        }
      }

      if (ram && !en.ground) {
        const rr = en.r + 14;
        const dx = en.x - px;
        const dy = en.y - py;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(en, 3, en.x, en.y);
        }
      } else if (canHurt && !en.ground) {
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
        const extra = s.bolt && en.ground ? 8 : 0;
        const rr = en.r + s.r + extra;
        if (dx * dx + dy * dy < rr * rr) {
          const dmg = s.dmg + (s.bolt && en.ground ? 2 : 0);
          hurtEnt(en, dmg, s.x, s.y);
          if (s.bolt) {
            addBolt(s.x, s.y - 8, en.x, en.y, 0.12, 1.8, CYN);
            popSpark(en.x, en.y, BOLT, 12);
          }
          if (s.pierce > 0) {
            s.pierce -= 1;
          } else {
            hit = true;
            break;
          }
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && !looping();
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y > VH + 22 || s.y < -32 || s.x < -22 || s.x > VW + 22) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (looping()) {
        const dx = s.x - G.player.x;
        const dy = s.y - G.player.y;
        if (dx * dx + dy * dy < 28 * 28) {
          emit(3, {
            x: s.x, y: s.y, j: 4,
            vx0: -80, vx1: 80, vy0: -60, vy1: 40,
            life: 0.14, r0: 1, r1: 2.2, rgb: CYN, g: 0
          });
          G.eShots.splice(i, 1);
          continue;
        }
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
        isl.w = 36 + hash2((G.scroll * 0.1) | 0) * 70;
        isl.h = 22 + hash2((G.scroll * 0.13) | 0) * 36;
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
    for (let i = bolts.length - 1; i >= 0; i--) {
      bolts[i].t += dt;
      if (bolts[i].t >= bolts[i].life) bolts.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].t += dt;
      if (ghosts[i].t >= ghosts[i].life) ghosts.splice(i, 1);
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
    const spd = plySpd() * (looping() ? 0.72 : 1);
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
    if (looping() && !REDUCE) {
      ghosts.push({
        x: G.player.x, y: G.player.y,
        ang: G.loopAng, t: 0, life: 0.22, bank: G.player.bank
      });
      capArr(ghosts, 10);
    }
  }

  function updateCharge(dt) {
    if (G.mode !== 'play' || G.deadT > 0 || looping()) {
      if (!G.fireHold) G.charge = Math.max(0, G.charge - dt * 1.6);
      return;
    }
    if (G.fireHold) {
      const prev = G.charge;
      G.charge = clamp(G.charge + dt / chargeTime(), 0, 1);
      if (G.charge >= 0.25 && ((G.t * 14) | 0) !== (((G.t - dt) * 14) | 0)) audio.chargeTick();
      if (prev < 1 && G.charge >= 1) {
        fireCharged();
      }
    }
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.charge, 0, 1) + ')';
    if (chgWrap) chgWrap.classList.toggle('hot', G.charge >= 0.92 && G.mode === 'play');
  }

  function grantLoopBonus() {
    if (G.loops <= 0) return;
    const n = G.loops * SCORE.loop;
    addScore(n);
    toast('余环 +' + n, false, true);
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
    if (G.loopT > 0) {
      G.loopT -= dt;
      G.loopAng += dt * (REDUCE ? 6 : 14);
      if (G.loopT <= 0) G.loopT = 0;
    }

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
        grantLoopBonus();
        if (G.stage >= 3) {
          winGame();
          return;
        }
        G.stage += 1;
        G.stageT = 0;
        G.waveI = 0;
        G.loops = LOOP_MAX;
        G.invuln = Math.max(G.invuln, 0.85);
        toast('第 ' + G.stage + ' 关 · ' + stageInfo().name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    updatePlayer(dt);
    updateCharge(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold && !looping()) fire();

    if (isGuns()) gunsThink(dt);
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
    if (bio === 'land') {
      ctx.fillStyle = 'rgba(18, 48, 36, 0.92)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.55, h * 0.55, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LAND, 0.35);
      ctx.beginPath();
      ctx.ellipse(x, y - h * 0.12, w * 0.32, h * 0.22, 0, 0, TAU);
      ctx.fill();
    } else if (bio === 'port') {
      ctx.fillStyle = 'rgba(36, 52, 48, 0.92)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.5, h * 0.42, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(SAND, 0.4);
      ctx.beginPath();
      ctx.ellipse(x, y + h * 0.12, w * 0.42, h * 0.18, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(80, 110, 120, 0.7)';
      ctx.fillRect(x - w * 0.22, y - h * 0.18, w * 0.44, h * 0.16);
    } else {
      ctx.fillStyle = 'rgba(10, 42, 58, 0.88)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.48, h * 0.38, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.22);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWorld() {
    const bio = biome();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (bio === 'land') {
      g.addColorStop(0, '#0a1814');
      g.addColorStop(0.5, '#081614');
      g.addColorStop(1, '#041410');
    } else if (bio === 'port') {
      g.addColorStop(0, '#082028');
      g.addColorStop(0.42, '#061c22');
      g.addColorStop(0.7, '#0c2020');
      g.addColorStop(1, '#081418');
    } else {
      g.addColorStop(0, '#042838');
      g.addColorStop(0.55, '#031c28');
      g.addColorStop(1, '#021820');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (bio !== 'land') {
      ctx.save();
      ctx.strokeStyle = rgba(CYN, 0.12);
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
    } else {
      ctx.save();
      ctx.strokeStyle = 'rgba(30, 70, 52, 0.45)';
      ctx.lineWidth = 10 * scale;
      const roadX = sx(VW * 0.5 + Math.sin(G.scroll * 0.004) * 40);
      ctx.beginPath();
      ctx.moveTo(roadX, sy(-10));
      ctx.lineTo(roadX, sy(VH + 10));
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.18);
      ctx.lineWidth = 1.4 * scale;
      ctx.setLineDash([8 * scale, 12 * scale]);
      ctx.lineDashOffset = -G.scroll * scale * 0.4;
      ctx.beginPath();
      ctx.moveTo(roadX, sy(-10));
      ctx.lineTo(roadX, sy(VH + 10));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    for (let i = 0; i < foam.length; i++) {
      const s = foam[i];
      if (bio === 'land') {
        ctx.fillStyle = rgba(LAND, s.a * 0.35);
        ctx.fillRect(sx(s.x), sy(s.y), 2 * scale, 2 * scale);
      } else {
        ctx.fillStyle = rgba(WHT, s.a * 0.45);
        ctx.fillRect(sx(s.x), sy(s.y), s.w * 0.4 * scale, 1.4 * scale);
      }
    }

    for (let i = 0; i < islands.length; i++) drawIsland(islands[i], bio);

    for (let i = 0; i < wash.length; i++) {
      const w = wash[i];
      ctx.strokeStyle = rgba(CYN, (1 - w.t) * 0.28);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(w.y), w.r * (0.6 + w.t) * scale, w.r * 0.35 * scale, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawP38(x, y, a, flashHit, ang, bank) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang || (bank || 0));
    const lp = looping();
    const sc = lp && !REDUCE ? 1.18 + Math.sin(G.loopAng * 2) * 0.08 : 1;
    ctx.scale(scale * sc, scale * sc);
    ctx.globalAlpha = a == null ? 1 : a;
    const flash = flashHit || G.muzzle > 0;
    const body = flash ? WHT : CYN;
    ctx.shadowColor = rgba(G.charge > 0.45 ? BOLT : body, 0.6 + G.charge * 0.35);
    ctx.shadowBlur = 12 + G.charge * 10;
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
    ctx.fillStyle = flash ? '#fff' : rgba(body, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(3.4, -2);
    ctx.lineTo(0, 8);
    ctx.lineTo(-3.4, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.82);
    ctx.beginPath();
    ctx.ellipse(0, -7, 2.2, 3.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.arc(-11, -4, 2.1, 0, TAU);
    ctx.arc(11, -4, 2.1, 0, TAU);
    ctx.fill();
    if (G.powLv >= 2) {
      ctx.fillStyle = rgba(SKY, 0.9);
      ctx.beginPath();
      ctx.arc(-18, 4, 2.4, 0, TAU);
      ctx.arc(18, 4, 2.4, 0, TAU);
      ctx.fill();
    }
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(BOLT, 0.95);
      ctx.beginPath();
      ctx.moveTo(-2.4, -16);
      ctx.lineTo(0, -28);
      ctx.lineTo(2.4, -16);
      ctx.fill();
    }
    if (G.charge > 0.2) {
      ctx.strokeStyle = rgba(BOLT, 0.35 + G.charge * 0.55);
      ctx.lineWidth = 1.2 + G.charge * 2;
      ctx.beginPath();
      ctx.arc(0, 0, 14 + G.charge * 8, 0, TAU);
      ctx.stroke();
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
      ctx.lineTo(9, 1);
      ctx.lineTo(3, 1);
      ctx.lineTo(2.2, -10);
      ctx.lineTo(-2.2, -10);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-9, 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.32);
      ctx.fillRect(-1.1, -2, 2.2, 7);
    } else if (en.type === 'twin') {
      ctx.lineWidth = 2;
      ctx.strokeStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(-10, -6);
      ctx.lineTo(-10, 10);
      ctx.moveTo(10, -6);
      ctx.lineTo(10, 10);
      ctx.stroke();
      ctx.fillRect(-16, -2, 32, 5);
      ctx.fillStyle = rgba(WHT, 0.3);
      ctx.fillRect(-3, -8, 6, 10);
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
      ctx.fillStyle = 'rgba(28, 40, 46, 0.95)';
      ctx.beginPath();
      ctx.arc(0, 4, 11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, TAU);
      ctx.fill();
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillRect(4, -2.1, 14, 4.2);
    } else if (en.type === 'rocket') {
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(6, 4);
      ctx.lineTo(3, 14);
      ctx.lineTo(-3, 14);
      ctx.lineTo(-6, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-2, 8, 4, 8);
    } else if (en.type === 'bunker') {
      ctx.fillRect(-16, -6, 32, 16);
      ctx.fillStyle = 'rgba(18, 28, 28, 0.9)';
      ctx.fillRect(-12, -2, 8, 6);
      ctx.fillRect(4, -2, 8, 6);
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.8);
      ctx.fillRect(-2, -10, 4, 10);
    } else if (en.type === 'carrier') {
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
      ctx.fillStyle = '#021820';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('雷', 0, 1);
    } else if (en.type === 'mid') {
      if (biome() === 'sea') {
        ctx.beginPath();
        ctx.ellipse(0, 2, 40, 15, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-34, -8, 12, 26);
        ctx.fillRect(22, -8, 12, 26);
        ctx.fillRect(-8, -14, 16, 32);
      } else if (biome() === 'port') {
        ctx.fillRect(-38, -8, 76, 24);
        ctx.fillRect(-14, -20, 28, 16);
        ctx.fillRect(-28, 12, 12, 10);
        ctx.fillRect(16, 12, 12, 10);
      } else {
        ctx.fillRect(-16, -22, 12, 40);
        ctx.fillRect(4, -22, 12, 40);
        ctx.fillRect(-28, 10, 56, 12);
      }
      ctx.fillStyle = rgba(GOLD, 0.65);
      ctx.fillRect(-8, -2, 16, 8);
    } else if (en.type === 'boss') {
      if (G.stage === 1) {
        ctx.beginPath();
        ctx.ellipse(0, 4, 56, 16, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-48, -10, 16, 32);
        ctx.fillRect(-10, -16, 20, 42);
        ctx.fillRect(32, -10, 16, 32);
      } else if (G.stage === 2) {
        ctx.fillRect(-50, -8, 100, 28);
        ctx.fillRect(-18, -22, 36, 18);
        ctx.fillRect(-44, 16, 18, 10);
        ctx.fillRect(26, 16, 18, 10);
        ctx.fillRect(-8, -8, 16, 22);
      } else {
        ctx.fillRect(-52, -12, 104, 34);
        ctx.fillRect(-28, -28, 56, 18);
        ctx.fillRect(-46, 16, 16, 12);
        ctx.fillRect(30, 16, 16, 12);
        ctx.fillRect(-8, 16, 16, 16);
      }
      ctx.fillStyle = rgba(GOLD, 0.72);
      ctx.fillRect(-24, 0, 8, 8);
      ctx.fillRect(16, 0, 8, 8);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-30, -2, 60, 7);
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.85);
      ctx.shadowBlur = (s.bolt ? 16 : 9) * scale;
      if (s.bolt) {
        ctx.fillRect(sx(s.x - 2.6), sy(s.y - 16), 5.2 * scale, 28 * scale);
        if (!REDUCE) {
          ctx.globalAlpha = 0.4;
          ctx.fillRect(sx(s.x - 1.2), sy(s.y), 2.4 * scale, 18 * scale);
        }
      } else {
        ctx.fillRect(sx(s.x - 1.4), sy(s.y - 7), 2.8 * scale, 13 * scale);
        if (!REDUCE) {
          ctx.globalAlpha = 0.32;
          ctx.fillRect(sx(s.x - 1.2), sy(s.y), 2.4 * scale, 11 * scale);
        }
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

  function drawBolts() {
    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      const a = 1 - b.t / b.life;
      ctx.save();
      ctx.strokeStyle = rgba(b.rgb, a);
      ctx.lineWidth = b.thick * scale;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = rgba(b.rgb, 0.8);
      ctx.shadowBlur = 10 * scale;
      ctx.beginPath();
      for (let k = 0; k < b.pts.length; k++) {
        const p = b.pts[k];
        if (k === 0) ctx.moveTo(sx(p.x), sy(p.y));
        else ctx.lineTo(sx(p.x), sy(p.y));
      }
      ctx.stroke();
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
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.shadowColor = rgba(GOLD, 0.8);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#021820';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.2);
      ctx.shadowBlur = 0;
      ctx.fillText('雷', 0, 1);
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
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : CYN, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : CYN, 0.6);
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
    ctx.fillStyle = '#021820';
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
    drawBolts();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();

    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      drawP38(g.x, g.y, 0.28 * (1 - g.t / g.life), false, g.ang, g.bank);
    }

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && !looping() && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawP38(G.player.x, G.player.y, 1, false, looping() ? G.loopAng : 0, G.player.bank);
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
    ghosts.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'guns' ? 'guns' : 'raid';
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
    G.loops = LOOP_MAX;
    G.loopT = 0;
    G.charge = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.loopHold = false;
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
    toast(isGuns() ? '舰炮 · 对空更密' : '反击 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.lives = LIVES;
    G.powLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.loops = LOOP_MAX;
    G.loopT = 0;
    G.charge = 0;
    G.deadT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '反击',
      '双尾闪电。空格蓄雷贯射，Shift 翻环落雷炸舰。先扫北大西洋再打欧陆港口。'
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
    if (G.mode === 'title') startGame('guns');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isGuns()) goTitle();
      else startGame('guns');
    }
  }

  function tryLoop() {
    audio.ensure();
    if (overlayOpen()) return;
    if (G.mode === 'play') doLoop();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const loopKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ';

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

    if (down && (isMove || space || loopKey || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) {
        if (G.charge >= 0.45 && G.mode === 'play' && !looping()) fireCharged();
        G.fireHold = false;
      }
      if (loopKey) G.loopHold = false;
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
    if (loopKey) {
      if (!G.loopHold) {
        G.loopHold = true;
        tryLoop();
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
      if (pointer.down && G.charge >= 0.45 && G.mode === 'play' && !looping()) fireCharged();
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
  if (btnGuns) {
    btnGuns.addEventListener('click', function () {
      audio.ensure();
      startGame('guns');
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
      else if (G.mode === 'win' && isGuns()) goTitle();
      else if (G.mode === 'win') startGame('guns');
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
  function bindLoopBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      tryLoop();
    });
  }
  bindLoopBtn(btnLoop);
  bindLoopBtn(btnPadLoop);

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
      G.loopHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
