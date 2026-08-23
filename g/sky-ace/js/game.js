'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const ACE_NEED = 8;
  const WPN_MAX = 4;
  const BOMB_MAX = 6;
  const BOMB_START = 3;
  const BEST_KEY = 'playbox-sky-ace-best';
  const MUTE_KEY = 'playbox-sky-ace-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 云裂 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 212, 232];
  const SKY = [126, 240, 255];
  const GOLD = [255, 227, 107];
  const WHT = [228, 251, 255];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const VIO = [58, 184, 208];
  const PEAK = [42, 92, 112];
  const MIST = [180, 220, 232];
  const CORE = [255, 200, 80];

  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'MAX'];

  const SCORE = {
    dart: 50,
    dive: 90,
    wing: 130,
    spear: 160,
    keep: 180,
    haul: 300,
    mid: 2000,
    boss: 4000,
    clear: 1500,
    all: 8000
  };

  const STAGES = [
    {
      name: '云谷',
      biome: 'vale',
      mid: '雾台',
      boss: '云塔',
      midHp: 40,
      bossHp: 96,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.0, kind: 'spears' },
        { t: 5.4, kind: 'stream', dir: 1 },
        { t: 7.8, kind: 'keeps' },
        { t: 10.2, kind: 'dive', n: 4 },
        { t: 12.6, kind: 'haul' },
        { t: 15.0, kind: 'wing' },
        { t: 17.4, kind: 'v', n: 7 },
        { t: 20.2, kind: 'mid' },
        { t: 25.8, kind: 'stream', dir: -1 },
        { t: 28.2, kind: 'spears' },
        { t: 30.6, kind: 'dive', n: 5 },
        { t: 33.0, kind: 'keeps' },
        { t: 35.4, kind: 'wing' },
        { t: 37.8, kind: 'v', n: 7 },
        { t: 40.2, kind: 'haul' },
        { t: 42.6, kind: 'spears' },
        { t: 48.0, kind: 'boss' }
      ]
    },
    {
      name: '雷脊',
      biome: 'ridge',
      mid: '脊炮',
      boss: '雷堡',
      midHp: 52,
      bossHp: 126,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 2.8, kind: 'spears' },
        { t: 5.0, kind: 'dive', n: 5 },
        { t: 7.4, kind: 'keeps' },
        { t: 9.6, kind: 'stream', dir: -1 },
        { t: 12.0, kind: 'wing' },
        { t: 14.4, kind: 'haul' },
        { t: 16.8, kind: 'v', n: 9 },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'spears' },
        { t: 27.0, kind: 'dive', n: 6 },
        { t: 29.2, kind: 'keeps' },
        { t: 31.6, kind: 'stream', dir: 1 },
        { t: 34.0, kind: 'wing' },
        { t: 36.4, kind: 'v', n: 9 },
        { t: 38.8, kind: 'haul' },
        { t: 41.2, kind: 'spears' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '霸顶',
      biome: 'peak',
      mid: '顶卫',
      boss: '空霸核',
      midHp: 66,
      bossHp: 168,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.4, kind: 'wing' },
        { t: 4.4, kind: 'spears' },
        { t: 6.4, kind: 'dive', n: 6 },
        { t: 8.4, kind: 'keeps' },
        { t: 10.4, kind: 'stream', dir: 1 },
        { t: 12.6, kind: 'haul' },
        { t: 14.6, kind: 'v', n: 9 },
        { t: 16.6, kind: 'wing' },
        { t: 18.8, kind: 'mid' },
        { t: 24.6, kind: 'dive', n: 7 },
        { t: 26.6, kind: 'spears' },
        { t: 28.8, kind: 'keeps' },
        { t: 31.0, kind: 'stream', dir: -1 },
        { t: 33.2, kind: 'wing' },
        { t: 35.4, kind: 'v', n: 11 },
        { t: 37.6, kind: 'haul' },
        { t: 39.8, kind: 'dive', n: 6 },
        { t: 42.0, kind: 'keeps' },
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
  const btnAce = document.getElementById('btn-ace');
  const btnSea = document.getElementById('btn-sea');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPadBomb = document.getElementById('btn-pad-bomb');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const bombLabel = document.getElementById('bomb-label');
  const comboEl = document.getElementById('combo-label');
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
  let bombTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false, bm: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const peaks = [];
  const clouds = [];
  const trails = [];
  const bolts = [];
  const rifts = [];
  const rips = [];

  const G = {
    mode: 'title',
    kind: 'ace',
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
    bombsStock: BOMB_START,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    fireCd: 0,
    bombCd: 0,
    fireHold: false,
    bombHold: false,
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
    burnT: 0,
    burn: 0
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
  function isSea() {
    return G.kind === 'sea';
  }
  function isAce() {
    return G.combo >= ACE_NEED;
  }
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'vale';
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function plySpd() {
    return (isSea() ? 310 : 272) + G.powLv * 8 + (isAce() ? 12 : 0);
  }
  function scrollSpd() {
    if (hasBig()) return isSea() ? 34 : 26;
    const base = isSea() ? 114 : 82;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isSea() ? 10 : 8);
  }
  function hpMul() {
    return isSea() ? 1.22 : 1;
  }
  function shotCap() {
    return isSea() ? 176 : 118;
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
      this.beep(820 + G.powLv * 48, 0.042, 'square', 0.028, 1680);
    },
    rift() {
      this.ensure();
      this.noise(0.22, 0.082, 140);
      this.beep(180, 0.28, 'sawtooth', 0.058, 52);
      this.beep(880, 0.16, 'square', 0.04, 220);
      this.beep(110, 0.22, 'sine', 0.04, 40);
    },
    hit(kind, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      if (kind === 'ground') {
        this.noise(0.05, 0.036, 360);
        this.beep(240 * lift, 0.09, 'sawtooth', 0.036, 72);
      } else {
        this.noise(0.034, 0.03, 1400);
        this.beep(580 * lift, 0.062, 'square', 0.04, 980 * lift);
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
    ace() {
      this.ensure();
      this.beep(659, 0.1, 'square', 0.045, 988);
      this.beep(988, 0.16, 'triangle', 0.04, 1318);
    },
    burn() {
      this.ensure();
      this.beep(78, 0.03, 'sawtooth', 0.009, 58);
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
    },
    empty() {
      this.ensure();
      this.beep(160, 0.08, 'square', 0.03, 80);
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
    if (G.powLv >= WPN_MAX) return '穿云 MAX';
    if (G.powLv <= 0) return '针';
    return '针 ' + WPN_ROMAN[G.powLv];
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

  function flashBombHud() {
    if (!bombLabel) return;
    bombLabel.classList.remove('hot');
    void bombLabel.offsetWidth;
    bombLabel.classList.add('hot');
    bombTok += 1;
    const tok = bombTok;
    setTimeout(function () {
      if (tok === bombTok && bombLabel) bombLabel.classList.remove('hot');
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
      tagLabel.textContent = isSea() ? '云海' : '空霸';
      tagLabel.classList.toggle('warn', isSea());
      tagLabel.classList.toggle('hot', !isSea() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.powLv >= WPN_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '裂 ×' + G.bombsStock;
      bombLabel.classList.toggle('empty', G.bombsStock <= 0);
    }
    if (btnBomb) {
      btnBomb.classList.toggle('empty', G.bombsStock <= 0);
      btnBomb.classList.toggle('held', G.bombHold && G.mode === 'play');
    }
    if (btnPadBomb) btnPadBomb.classList.toggle('held', G.bombHold && G.mode === 'play');
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        const ace = isAce();
        comboEl.classList.toggle('ace', ace);
        comboEl.textContent = ace
          ? '王牌 ' + G.combo + ' ×' + G.mult
          : (G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连');
      } else {
        comboEl.hidden = true;
        comboEl.classList.remove('ace');
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint((isSea() ? '云海尽破' : '空霸尽破') + ' · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格穿云 · Shift 云裂开路', 'warn');
    else if (G.bombsStock <= 0) setHint('云裂用尽 · 吃 裂 补弹 · 针弹也能啃堡', 'warn');
    else if (isAce()) setHint('王牌穿云 · 针弹贯穿 · 云裂劈开生路', 'hot');
    else setHint('空格穿云 · Shift 云裂开路 · 吃 云 加宽 吃 裂 补弹', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SKAC';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvModes) {
      if (kind === 'win') btnOvModes.textContent = isSea() ? '换模式' : '云海';
      else btnOvModes.textContent = '换模式';
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

  function spawnBolt(x, y, x2, y2) {
    bolts.push({ x: x, y: y, x2: x2, y2: y2, t: 0 });
    capArr(bolts, 40);
  }

  function forkBolt(x, y0, y1) {
    let px = x;
    let py = y0;
    const n = REDUCE ? 4 : 7;
    for (let i = 1; i <= n; i++) {
      const ny = lerp(y0, y1, i / n);
      const nx = x + rand(-18, 18);
      spawnBolt(px, py, nx, ny);
      if (Math.random() < 0.45) {
        spawnBolt(nx, ny, nx + rand(-28, 28), ny + rand(8, 22));
      }
      px = nx;
      py = ny;
    }
  }

  function seedWorld() {
    stars.length = 0;
    peaks.length = 0;
    clouds.length = 0;
    const nStar = REDUCE ? 28 : 56;
    for (let i = 0; i < nStar; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.4),
        a: rand(0.16, 0.62),
        w: rand(1.1, 2.4)
      });
    }
    for (let i = 0; i < 6; i++) {
      peaks.push({
        x: 40 + hash2(i * 19 + 4) * (VW - 80),
        y: -50 - i * 130,
        w: 48 + hash2(i * 11) * 70,
        h: 70 + hash2(i * 7) * 50
      });
    }
    const nCloud = isSea() ? 16 : 11;
    for (let i = 0; i < nCloud; i++) {
      clouds.push({
        x: hash2(i * 23 + 9) * VW,
        y: -30 - i * (VH / nCloud),
        w: 70 + hash2(i * 5) * 90,
        h: 22 + hash2(i * 13) * 18,
        a: 0.22 + hash2(i * 17) * 0.28,
        rip: 0,
        z: 0.55 + hash2(i * 3) * 0.7
      });
    }
  }

  function cloudCover(x, y) {
    let c = 0;
    for (let i = 0; i < clouds.length; i++) {
      const cl = clouds[i];
      if (cl.rip >= 0.82) continue;
      const dx = (x - cl.x) / (cl.w * 0.55);
      const dy = (y - cl.y) / (cl.h * 0.7);
      if (dx * dx + dy * dy < 1) {
        c = Math.max(c, (1 - cl.rip) * cl.a * 2.4);
      }
    }
    return clamp(c, 0, 1);
  }

  function ripClouds(x, y, rad) {
    for (let i = 0; i < clouds.length; i++) {
      const cl = clouds[i];
      const dx = x - cl.x;
      const dy = y - cl.y;
      const rr = rad + cl.w * 0.42;
      if (dx * dx + dy * dy < rr * rr) {
        cl.rip = Math.min(1, cl.rip + 0.18);
        if (!REDUCE) {
          rips.push({
            x: x + rand(-6, 6),
            y: y + rand(-4, 4),
            t: 0,
            r: rand(6, 14)
          });
          capArr(rips, 40);
        }
      }
    }
  }

  function ripColumn(x, halfW) {
    for (let i = 0; i < clouds.length; i++) {
      const cl = clouds[i];
      if (Math.abs(cl.x - x) < halfW + cl.w * 0.4) {
        cl.rip = 1;
      }
    }
  }

  function bumpCombo() {
    const was = isAce();
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
    if (!was && isAce()) {
      toast('王牌', false, true);
      audio.ace();
      screenFlash(GOLD, 0.28);
      floatText(G.player.x, G.player.y - 28, '王牌', GOLD, true);
    }
    if (G.combo > 0 && G.combo % 3 === 0) {
      hitStop(0.034);
      floatText(G.player.x + rand(-20, 20), G.player.y - 36, G.combo + ' 链', GOLD, true);
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
      veil: spec.veil !== false && !spec.ground,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      spin: spec.spin || 0
    };
    G.ents.push(en);
    return en;
  }

  function spawnDart(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'dart',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 102,
      hp: 1, r: 10, score: SCORE.dart,
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
    spawnDart(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnDart(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnDart(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = 6 + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnDart(side + rand(-8, 8), -20 - i * 24, {
        vx: dir * -78,
        vy: 126,
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
        hp: 1, r: 11, score: SCORE.dive,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnWing() {
    const left = Math.random() < 0.5;
    spawnEnt({
      type: 'wing',
      x: left ? -28 : VW + 28,
      y: rand(70, 180),
      vx: left ? 92 : -92,
      vy: 22,
      hp: 4, r: 18, score: SCORE.wing,
      rgb: VIO,
      w: 42, h: 16,
      fireCd: rand(0.4, 0.9),
      phase: left ? 1 : -1
    });
  }

  function spawnSpear(x, y) {
    spawnEnt({
      type: 'spear',
      x: x, y: y == null ? -26 : y,
      vx: 0, vy: 0,
      hp: 4, r: 13, score: SCORE.spear,
      rgb: GOLD,
      ground: true,
      drop: Math.random() < 0.2 ? 'b' : false,
      w: 18, h: 26,
      fireCd: rand(0.45, 1.1)
    });
  }

  function spawnSpears() {
    const n = isSea() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnSpear(clamp(x, 40, VW - 40), -24 - i * 18);
    }
  }

  function spawnKeep(x) {
    spawnEnt({
      type: 'keep',
      x: x == null ? rand(60, VW - 60) : x,
      y: -28,
      vx: 0, vy: 0,
      hp: 7, r: 18, score: SCORE.keep,
      rgb: PEAK,
      ground: true,
      drop: Math.random() < 0.4 ? 'b' : false,
      w: 30, h: 22,
      fireCd: rand(0.55, 1.2)
    });
  }

  function spawnKeeps() {
    const n = isSea() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 64 + i * ((VW - 128) / Math.max(1, n - 1)) + rand(-16, 16);
      spawnKeep(clamp(x, 48, VW - 48));
    }
  }

  function spawnHaul() {
    spawnEnt({
      type: 'haul',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 76,
      hp: 2, r: 14, score: SCORE.haul,
      rgb: GOLD,
      drop: 'p',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.midHp * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -60,
      vx: 56,
      vy: 46,
      hp: hp,
      r: 34,
      score: SCORE.mid,
      rgb: st.biome === 'ridge' ? GOLD : st.biome === 'peak' ? CORE : VIO,
      drop: 'p',
      ground: true,
      veil: false,
      w: 78,
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
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.bossHp * hpMul());
    spawnEnt({
      type: 'boss',
      x: VW * 0.5,
      y: -74,
      vx: 64,
      vy: 42,
      hp: hp,
      r: 46,
      score: SCORE.boss + G.stage * SCORE.clear,
      rgb: MAG,
      drop: 'p',
      ground: true,
      veil: false,
      w: 104,
      h: 50,
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
    else if (w.kind === 'wing') spawnWing();
    else if (w.kind === 'spears') spawnSpears();
    else if (w.kind === 'keeps') spawnKeeps();
    else if (w.kind === 'haul') spawnHaul();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  let haulCycle = 0;
  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vy: 62, t: 0,
      vx: rand(-38, 38),
      kind: kind === 'b' ? 'b' : 'p'
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
    if (G.shots.length > 56) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      dmg: spec.dmg || 1,
      pierce: spec.pierce || 0,
      lance: !!spec.lance
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.powLv;
    const x = G.player.x;
    const y = G.player.y - 16;
    G.muzzle = 0.05;
    G.fireCd = 0.108 - lv * 0.011;
    const spd = -710;
    const rgb = lv >= 3 ? GOLD : lv >= 1 ? SKY : WHT;
    const aceP = isAce() ? 1 : 0;
    function gun(ox, oy, vx, vy, dmg, col, r, pierce, lance) {
      addShot({
        x: x + ox, y: y + oy,
        vx: vx || 0,
        vy: vy == null ? spd : vy,
        r: r || (lance ? 4.2 : 2.7),
        rgb: col || rgb,
        dmg: dmg || 1,
        pierce: (pierce || 0) + aceP,
        lance: !!lance
      });
    }
    if (lv <= 0) {
      gun(-5, 2);
      gun(5, 2);
    } else if (lv === 1) {
      gun(0, 0, 0, spd, 1, rgb, 3.1, 0);
      gun(-10, 3);
      gun(10, 3);
    } else if (lv === 2) {
      gun(0, -1, 0, spd, 1, rgb, 3.2, 1);
      gun(-11, 2, -36, spd);
      gun(11, 2, 36, spd);
      gun(-20, 5, -88, spd);
      gun(20, 5, 88, spd);
    } else if (lv === 3) {
      gun(0, -2, 0, spd, 1, GOLD, 3.4, 1);
      gun(-8, 0, -22, spd);
      gun(8, 0, 22, spd);
      gun(-16, 2, -70, spd);
      gun(16, 2, 70, spd);
      gun(-24, 5, -118, spd);
      gun(24, 5, 118, spd);
    } else {
      gun(0, -3, 0, spd, 2, GOLD, 4.4, 2, true);
      gun(-7, -1, -16, spd, 1, SKY, 3.2, 1);
      gun(7, -1, 16, spd, 1, SKY, 3.2, 1);
      gun(-14, 1, -54, spd);
      gun(14, 1, 54, spd);
      gun(-22, 4, -108, spd);
      gun(22, 4, 108, spd);
      gun(-18, 8, 0, spd, 2, CYN, 3.8, 2, true);
      gun(18, 8, 0, spd, 2, CYN, 3.8, 2, true);
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

  function dropRift() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombCd > 0) return;
    if (G.bombsStock <= 0) {
      toast('云裂用尽', true, false);
      audio.empty();
      return;
    }
    G.bombsStock -= 1;
    G.bombCd = 0.48;
    const x = G.player.x;
    rifts.push({
      x: x,
      t: 0,
      life: 0.68,
      halfW: 46,
      pulse: 0,
      tick: 0.12
    });
    G.invuln = Math.max(G.invuln, 0.52);
    ripColumn(x, 52);
    forkBolt(x, G.player.y - 8, 8);
    forkBolt(x + rand(-8, 8), G.player.y - 20, 40);
    juice(x, G.player.y - 40, CYN, 1.6);
    juice(x, 80, GOLD, 1.4);
    audio.rift();
    hitStop(0.078);
    kick(6.4);
    screenFlash(SKY, 0.55);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    clearLane(x, 52, true);
    flashBombHud();
    syncHud();
  }

  function clearLane(x, halfW, dmgNow) {
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      if (Math.abs(G.eShots[i].x - x) < halfW + 8) {
        emit(2, {
          x: G.eShots[i].x, y: G.eShots[i].y, j: 3,
          vx0: -40, vx1: 40, vy0: -30, vy1: 40,
          life: 0.14, r0: 1, r1: 2, rgb: SKY, g: 0
        });
        G.eShots.splice(i, 1);
      }
    }
    if (!dmgNow) return;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      if (Math.abs(en.x - x) < halfW + en.r) {
        hurtEnt(en, en.ground ? 5 : 3, en.x, en.y);
      } else if (Math.abs(en.x - x) < halfW + en.r + 36) {
        hurtEnt(en, 1, en.x, en.y);
      }
    }
  }

  function hurtEnt(en, dmg, hx, hy) {
    if (en.hp <= 0) return;
    en.hp -= dmg || 1;
    en.flash = 0.08;
    ripClouds(hx, hy, 16);
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
    ripClouds(en.x, en.y, 28);
    if (en.ground) {
      audio.hit('ground', G.combo);
      emit(10, {
        x: en.x, y: en.y, j: 8,
        vx0: -120, vx1: 120, vy0: -80, vy1: 40,
        life: 0.32, r0: 1.4, r1: 3.4, rgb: PEAK, g: 280
      });
    } else {
      audio.hit('air', G.combo);
    }
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.type === 'haul') {
      haulCycle += 1;
      spawnPow(en.x, en.y, haulCycle % 3 === 0 ? 'b' : 'p');
    } else if (en.drop === 'p' || en.drop === 'b') {
      spawnPow(en.x, en.y, en.drop);
    } else if (en.drop === true) {
      spawnPow(en.x, en.y, Math.random() < 0.45 ? 'b' : 'p');
    } else if ((en.type === 'keep' || en.type === 'spear') && Math.random() < 0.22) {
      spawnPow(en.x, en.y, 'b');
    }
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(SCORE.clear * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      toast(stageInfo().name + '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (p.kind === 'b') {
      if (G.bombsStock < BOMB_MAX) {
        G.bombsStock += 1;
        toast(G.bombsStock >= BOMB_MAX ? '裂满' : '云裂 +1', false, true);
      } else {
        addScore(400 * G.mult);
        toast('+400', false, true);
      }
      flashBombHud();
      floatText(p.x, p.y, '裂', GOLD, true);
    } else if (G.powLv < WPN_MAX) {
      G.powLv += 1;
      toast(G.powLv >= WPN_MAX ? '穿云 MAX' : '针弹加宽', false, true);
      flashWpn();
      floatText(p.x, p.y, '云', GOLD, true);
    } else if (G.bombsStock < BOMB_MAX) {
      G.bombsStock += 1;
      toast('裂 +1', false, true);
      flashBombHud();
      floatText(p.x, p.y, '裂', GOLD, true);
    } else {
      addScore(500 * G.mult);
      toast('+500', false, true);
      floatText(p.x, p.y, '云', GOLD, true);
    }
    juice(p.x, p.y, GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('pow');
      void stageEl.offsetWidth;
      stageEl.classList.add('pow');
    }
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
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
    G.bombsStock = BOMB_START;
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
    addScore(isSea() ? 10000 : SCORE.all);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', isSea() ? '云海尽破' : '空霸尽破', (isSea() ? '云海通关' : '三关打穿') + ' · 分数 ' + G.score);
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

  function seaThink(dt) {
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
    if (r < 0.24) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.4) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.54) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.68) spawnSpears();
    else if (r < 0.8) spawnKeeps();
    else if (r < 0.9) spawnWing();
    else spawnHaul();
  }

  function bossFire(en, sea) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += sea ? 0.22 : 0.16;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 16, sea ? 210 : 176, CYN);
      eShot(en.x - 18, en.y + 10, -46, 186, PNK);
      eShot(en.x + 18, en.y + 10, 46, 186, PNK);
      if (mid) ringShot(en.x, en.y, sea ? 10 : 8, 150, en.spin, GOLD, 3.2);
      if (low) {
        aimShot(en.x - 22, en.y + 8, 200, MAG);
        aimShot(en.x + 22, en.y + 8, 200, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 18, 214, MAG);
      eShot(en.x - 28, en.y + 12, -50, 196, RED);
      eShot(en.x + 28, en.y + 12, 50, 196, RED);
      if (mid) ringShot(en.x, en.y + 6, sea ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 42, 208, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, sea ? 14 : 11, 146, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 8, sea ? 10 : 8, 118, -en.spin * 1.4, GOLD, 3.0);
        aimShot(en.x, en.y + 16, 200, CORE);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 220, RED);
        aimShot(en.x + 28, en.y + 10, 220, RED);
        forkBolt(en.x, en.y + 20, en.y + 160);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 6, sea ? 16 : 12, 152, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 6, sea ? 10 : 8, 108, -en.spin * 0.7, CYN, 2.8);
      if (mid) {
        aimShot(en.x - 20, en.y + 14, 210, PNK);
        aimShot(en.x + 20, en.y + 14, 210, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, sea ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (sea) en.fireCd *= 0.76;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0;
    const sea = isSea();
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
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < (en.type === 'boss' ? 108 : 124)) en.y += en.vy * dt;
        else {
          en.y = en.type === 'boss' ? 108 : 124;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 92 : 78;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
      } else if (en.type === 'haul') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'wing') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 4.2) * 16 * dt;
        if (en.x > 80 && en.x < VW - 80) en.vx *= Math.exp(-dt * 0.32);
      } else if (en.type === 'dive') {
        if (en.t > 0.32) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 182;
          en.vx = lerp(en.vx, dx / len * asp, 1 - Math.exp(-dt * 3.1));
          en.vy = lerp(en.vy, dy / len * asp, 1 - Math.exp(-dt * 3.1));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'dart') {
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
          if (en.type === 'dart' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, sea ? 198 : 172, MAG);
            if (sea && Math.random() < 0.45) aimShot(en.x, en.y + 8, 168, PNK);
            en.fireCd = (sea ? 1.3 : 2.3) + rand(0, 0.55);
          } else if (en.type === 'wing' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x, en.y + 8, sea ? 196 : 164, VIO);
            eShot(en.x - 14, en.y + 4, -36, 150, CYN);
            eShot(en.x + 14, en.y + 4, 36, 150, CYN);
            en.fireCd = sea ? 0.72 : 1.08;
          } else if (en.type === 'spear' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, sea ? 218 : 176, GOLD);
            if (sea) {
              eShot(en.x - 6, en.y + 8, -36, 168, CORE);
              eShot(en.x + 6, en.y + 8, 36, 168, CORE);
            }
            en.fireCd = (sea ? 0.62 : 1.02) + rand(0, 0.24);
          } else if (en.type === 'keep' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, sea ? 210 : 170, PEAK);
            eShot(en.x - 12, en.y + 4, -48, 154, GOLD);
            eShot(en.x + 12, en.y + 4, 48, 154, GOLD);
            en.fireCd = sea ? 0.7 : 1.12;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, sea);
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
      if (s.y < -22 || s.x < -16 || s.x > VW + 16 || s.y > VH + 24) {
        G.shots.splice(i, 1);
        continue;
      }
      ripClouds(s.x, s.y, s.lance ? 16 : 8);
      let hit = false;
      if (!s.hitAt) s.hitAt = [];
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (s.hitAt.indexOf(en) >= 0) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          s.hitAt.push(en);
          hurtEnt(en, s.dmg || 1, s.x, s.y);
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

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0;
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

  function updateRifts(dt) {
    for (let i = rifts.length - 1; i >= 0; i--) {
      const r = rifts[i];
      r.t += dt;
      r.pulse += dt;
      r.tick -= dt;
      if (r.tick <= 0) {
        r.tick = 0.12;
        clearLane(r.x, r.halfW * (1 - r.t * 0.25), true);
        if (!REDUCE) forkBolt(r.x + rand(-10, 10), VH * 0.15, VH * 0.85);
      } else {
        clearLane(r.x, r.halfW, false);
      }
      if (r.t >= r.life) rifts.splice(i, 1);
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
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += scr * 0.42 * s.z * dt;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < peaks.length; i++) {
      const p = peaks[i];
      p.y += scr * dt;
      if (p.y - p.h > VH + 30) {
        p.y = -80 - rand(0, 90);
        p.x = 40 + hash2((G.scroll + p.w) | 0) * (VW - 80);
        p.w = 48 + hash2((G.scroll * 0.1) | 0) * 70;
        p.h = 70 + hash2((G.scroll * 0.13) | 0) * 50;
      }
    }
    const nWant = isSea() ? 16 : 11;
    while (clouds.length < nWant) {
      clouds.push({
        x: rand(0, VW),
        y: -40 - rand(0, 80),
        w: rand(70, 160),
        h: rand(20, 40),
        a: rand(0.2, 0.48),
        rip: 0,
        z: rand(0.5, 1.2)
      });
    }
    for (let i = clouds.length - 1; i >= 0; i--) {
      const cl = clouds[i];
      cl.y += scr * cl.z * dt;
      if (cl.rip > 0) cl.rip = Math.min(1, cl.rip + dt * 0.12);
      if (cl.y - cl.h > VH + 40) {
        cl.y = -50 - rand(0, 70);
        cl.x = rand(0, VW);
        cl.w = rand(70, 160);
        cl.h = rand(20, 40);
        cl.a = rand(0.2, 0.48);
        cl.rip = 0;
        cl.z = rand(0.5, 1.2);
      }
    }
    if (!REDUCE && G.mode !== 'lose' && G.deadT <= 0) {
      trails.push({
        x: G.player.x + rand(-5, 5),
        y: G.player.y + 16,
        t: 0,
        r: rand(4, 9),
        rgb: isAce() ? GOLD : CYN
      });
      capArr(trails, 20);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt * 2.6;
      trails[i].y += 36 * dt;
      if (trails[i].t >= 1) trails.splice(i, 1);
    }
    for (let i = rips.length - 1; i >= 0; i--) {
      rips[i].t += dt * 3.2;
      if (rips[i].t >= 1) rips.splice(i, 1);
    }
    if (biome() === 'ridge' && !REDUCE && Math.random() < dt * 0.9) {
      const lx = rand(40, VW - 40);
      forkBolt(lx, rand(-10, 80), rand(180, 360));
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
      bolts[i].t += dt * 4.2;
      if (bolts[i].t >= 1) bolts.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.toastT > 0) G.toastT -= dt;
  }

  function tickBurn(dt) {
    G.burn += dt * (REDUCE ? 8 : 22);
    G.burnT -= dt;
    if (G.burnT > 0) return;
    G.burnT = G.mode === 'play' && G.deadT <= 0 ? 0.088 : 0.16;
    if (G.mode === 'lose') return;
    if (audio.ctx && !audio.muted) audio.burn();
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
    const wantBank = clamp(G.player.vx * 0.0018, -0.32, 0.32);
    G.player.bank = lerp(G.player.bank || 0, wantBank, 1 - Math.exp(-dt * 10));
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      tickBurn(dt * 0.35);
      return;
    }
    updateFx(dt);
    tickBurn(dt);

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
    if (G.bombCd > 0) G.bombCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
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
        if (G.stage >= 3) {
          winGame();
          return;
        }
        G.stage += 1;
        G.stageT = 0;
        G.waveI = 0;
        G.invuln = Math.max(G.invuln, 0.85);
        G.bombsStock = Math.min(BOMB_MAX, G.bombsStock + 1);
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isSea()) seaThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updateRifts(dt);
    updatePows(dt);
  }

  function drawPeak(p, bio) {
    const x = sx(p.x);
    const y = sy(p.y);
    const w = p.w * scale;
    const h = p.h * scale;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x - w * 0.55, y + h * 0.15);
    ctx.lineTo(x + w * 0.55, y + h * 0.15);
    ctx.closePath();
    ctx.fillStyle = bio === 'ridge'
      ? 'rgba(18, 36, 52, 0.94)'
      : bio === 'peak'
        ? 'rgba(16, 28, 48, 0.94)'
        : 'rgba(14, 40, 48, 0.92)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x + w * 0.18, y - h * 0.35);
    ctx.lineTo(x + w * 0.08, y + h * 0.05);
    ctx.closePath();
    ctx.fillStyle = rgba(bio === 'peak' ? CORE : CYN, 0.22);
    ctx.fill();
    ctx.restore();
  }

  function drawCloud(cl, front) {
    const zFront = cl.z >= 0.85;
    if (front !== zFront) return;
    const a = cl.a * (1 - cl.rip * 0.92);
    if (a < 0.03) return;
    const x = sx(cl.x);
    const y = sy(cl.y);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = rgba(MIST, 0.85);
    ctx.beginPath();
    ctx.ellipse(x, y, cl.w * 0.5 * scale, cl.h * 0.55 * scale, 0, 0, TAU);
    ctx.ellipse(x - cl.w * 0.28 * scale, y + 2 * scale, cl.w * 0.28 * scale, cl.h * 0.42 * scale, 0, 0, TAU);
    ctx.ellipse(x + cl.w * 0.26 * scale, y + 3 * scale, cl.w * 0.3 * scale, cl.h * 0.4 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawWorld() {
    const bio = biome();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (bio === 'ridge') {
      g.addColorStop(0, '#061018');
      g.addColorStop(0.45, '#081820');
      g.addColorStop(1, '#040e14');
    } else if (bio === 'peak') {
      g.addColorStop(0, '#08101c');
      g.addColorStop(0.4, '#0a1424');
      g.addColorStop(1, '#040c16');
    } else {
      g.addColorStop(0, '#062028');
      g.addColorStop(0.42, '#051c24');
      g.addColorStop(1, '#031418');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (bio === 'peak' && !REDUCE) {
      ctx.save();
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = rgba(k === 1 ? MAG : CYN, 0.1);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        const off = G.scroll * (0.12 + k * 0.04) + k * 40;
        for (let x = 0; x <= VW; x += 8) {
          const yy = 90 + k * 70 + Math.sin((x + off) * 0.03 + k) * 18;
          if (x === 0) ctx.moveTo(sx(x), sy(yy));
          else ctx.lineTo(sx(x), sy(yy));
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = rgba(WHT, s.a * (bio === 'peak' ? 0.85 : 0.45));
      ctx.fillRect(sx(s.x), sy(s.y), s.w * scale, s.w * scale);
    }

    for (let i = 0; i < peaks.length; i++) drawPeak(peaks[i], bio);
    for (let i = 0; i < clouds.length; i++) drawCloud(clouds[i], false);

    for (let i = 0; i < trails.length; i++) {
      const w = trails[i];
      ctx.strokeStyle = rgba(w.rgb, (1 - w.t) * 0.32);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(w.y), w.r * (0.5 + w.t) * scale, w.r * 0.7 * scale, 0, 0, TAU);
      ctx.stroke();
    }

    for (let i = 0; i < rips.length; i++) {
      const r = rips[i];
      ctx.strokeStyle = rgba(SKY, (1 - r.t) * 0.55);
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(r.x), sy(r.y), r.r * (0.4 + r.t * 1.4) * scale, r.r * 0.28 * (0.6 + r.t) * scale, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawAce(x, y, a, enemy, flashHit) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(enemy ? Math.PI : (G.player.bank || 0));
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    const body = enemy ? MAG : (isAce() ? GOLD : CYN);
    const fuse = enemy ? PNK : SKY;
    const flash = flashHit || (!enemy && G.muzzle > 0);

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(1, 8, 12, 5, 0, 0, TAU);
    ctx.fill();

    const flame = 7 + Math.sin(G.burn * 2.4) * 3.2;
    ctx.fillStyle = rgba(isAce() ? GOLD : CYN, 0.55);
    ctx.beginPath();
    ctx.moveTo(-3.2, 12);
    ctx.lineTo(0, 12 + flame);
    ctx.lineTo(3.2, 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.moveTo(-1.4, 12);
    ctx.lineTo(0, 12 + flame * 0.55);
    ctx.lineTo(1.4, 12);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = rgba(body, 0.6);
    ctx.shadowBlur = 12;
    ctx.fillStyle = rgba(body, flash ? 1 : 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(14, 9);
    ctx.lineTo(4.2, 6);
    ctx.lineTo(5.6, 14);
    ctx.lineTo(0, 10);
    ctx.lineTo(-5.6, 14);
    ctx.lineTo(-4.2, 6);
    ctx.lineTo(-14, 9);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = rgba(fuse, 0.95);
    ctx.beginPath();
    ctx.moveTo(-6.5, -5);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-4, 1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6.5, -5);
    ctx.lineTo(12, 0);
    ctx.lineTo(4, 1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(WHT, 0.62);
    ctx.beginPath();
    ctx.ellipse(0, -4, 2.6, 4.2, 0, 0, TAU);
    ctx.fill();

    if (!enemy && G.bombsStock > 0) {
      ctx.fillStyle = rgba(GOLD, 0.88);
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(-2.4, 8);
      ctx.lineTo(2.4, 8);
      ctx.closePath();
      ctx.fill();
    }

    if (!enemy && G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.fillRect(-1.1, -22, 2.2, 8);
      if (G.powLv >= 2) {
        ctx.fillRect(-8, -16, 1.6, 5);
        ctx.fillRect(6.4, -16, 1.6, 5);
      }
    }

    ctx.restore();
  }

  function drawEnt(en) {
    ctx.save();
    const veil = en.veil ? cloudCover(en.x, en.y) : 0;
    if (en.flash > 0) ctx.globalAlpha = 0.7 + Math.sin(en.t * 80) * 0.3;
    else if (veil > 0.18) ctx.globalAlpha = lerp(1, 0.28, clamp(veil, 0, 1));
    const x = en.x;
    const y = en.y;

    if (en.type === 'dart') {
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(-8, -4);
      ctx.lineTo(0, -10);
      ctx.lineTo(8, -4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.45);
      ctx.fillRect(-1.1, -4, 2.2, 8);
      ctx.restore();
    } else if (en.type === 'dive') {
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.rotate(Math.atan2(en.vy, en.vx) - Math.PI / 2);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(-11, -2);
      ctx.lineTo(-3, -2);
      ctx.lineTo(0, -13);
      ctx.lineTo(3, -2);
      ctx.lineTo(11, -2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (en.type === 'wing') {
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(22, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-22, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(SKY, 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else if (en.type === 'spear') {
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(PEAK, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(-9, 10);
      ctx.lineTo(9, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(en.rgb, 0.95);
      ctx.fillRect(-2.2, -8, 4.4, 16);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(-3, -10);
      ctx.lineTo(3, -10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (en.type === 'keep') {
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(en.rgb, 0.95);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU - Math.PI / 6;
        const px = Math.cos(a) * 16;
        const py = Math.sin(a) * 12;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else if (en.type === 'haul') {
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(en.rgb, 0.92);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.5);
      ctx.fillRect(-6, -3, 12, 6);
      ctx.restore();
    } else if (en.type === 'mid' || en.type === 'boss') {
      const big = en.type === 'boss';
      ctx.save();
      ctx.translate(sx(x), sy(y));
      ctx.scale(scale, scale);
      ctx.shadowColor = rgba(en.rgb, 0.45);
      ctx.shadowBlur = 16;
      ctx.fillStyle = rgba(en.rgb, 0.92);
      ctx.beginPath();
      ctx.moveTo(0, -en.h * 0.55);
      ctx.lineTo(en.w * 0.48, 4);
      ctx.lineTo(en.w * 0.18, en.h * 0.42);
      ctx.lineTo(-en.w * 0.18, en.h * 0.42);
      ctx.lineTo(-en.w * 0.48, 4);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = rgba(SKY, 0.55);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = rgba(en.hp < en.maxHp * 0.34 ? MAG : GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 2, big ? 10 : 7, 0, TAU);
      ctx.fill();
      if (big) {
        ctx.strokeStyle = rgba(GOLD, 0.5);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 2, 18 + Math.sin(en.t * 4) * 3, en.spin, en.spin + TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.shadowColor = rgba(s.rgb, 0.7);
      ctx.shadowBlur = s.lance ? 12 : 7;
      ctx.fillStyle = rgba(s.rgb, 0.95);
      const h = s.lance ? 16 : 10;
      ctx.fillRect(sx(s.x - s.r * 0.45), sy(s.y - h * 0.5), s.r * 0.9 * scale, h * scale);
      if (!REDUCE) {
        ctx.fillStyle = rgba(WHT, 0.55);
        ctx.fillRect(sx(s.x - 0.6), sy(s.y - h * 0.35), 1.2 * scale, h * 0.55 * scale);
      }
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.shadowColor = rgba(s.rgb, 0.7);
      ctx.shadowBlur = 8;
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawRifts() {
    for (let i = 0; i < rifts.length; i++) {
      const r = rifts[i];
      const a = 1 - r.t / r.life;
      const w = r.halfW * (0.7 + Math.sin(r.t * 28) * 0.12);
      ctx.save();
      const g = ctx.createLinearGradient(sx(r.x), sy(0), sx(r.x), sy(VH));
      g.addColorStop(0, rgba(GOLD, 0.08 * a));
      g.addColorStop(0.4, rgba(CYN, 0.28 * a));
      g.addColorStop(1, rgba(SKY, 0.05 * a));
      ctx.fillStyle = g;
      ctx.fillRect(sx(r.x - w), sy(0), w * 2 * scale, VH * scale);
      ctx.strokeStyle = rgba(WHT, 0.55 * a);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(r.x), sy(0));
      ctx.lineTo(sx(r.x + Math.sin(r.t * 40) * 6), sy(VH));
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const gold = p.kind === 'b';
      const rgb = gold ? GOLD : CYN;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.rotate(p.t * 2.4);
      ctx.scale(scale, scale);
      ctx.shadowColor = rgba(rgb, 0.7);
      ctx.shadowBlur = 10;
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1a1400';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.4);
      ctx.fillText(gold ? '裂' : '云', 0, 0.5);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, (1 - r.t) * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), r.r * (0.4 + r.t * 1.8) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      ctx.strokeStyle = rgba(SKY, 1 - b.t);
      ctx.lineWidth = (1.6 - b.t) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(b.x), sy(b.y));
      ctx.lineTo(sx(b.x2), sy(b.y2));
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
      ctx.font = 'bold ' + (f.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if ((G.ents[i].type === 'boss' || G.ents[i].type === 'mid') && G.ents[i].hp > 0) {
        boss = G.ents[i];
        break;
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

  function drawFrontClouds() {
    for (let i = 0; i < clouds.length; i++) drawCloud(clouds[i], true);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#02161c';
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
    drawRifts();
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawAce(G.player.x, G.player.y, 1, false);
    }
    drawFrontClouds();
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
    rifts.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
    bolts.length = 0;
    rips.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'sea' ? 'sea' : 'ace';
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
    G.bombsStock = BOMB_START;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
    G.fireCd = 0;
    G.bombCd = 0;
    G.fireHold = false;
    G.bombHold = false;
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
    G.burnT = 0;
    G.why = '';
    haulCycle = 0;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isSea() ? '云海 · 云层更密' : '空霸 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'ace';
    G.stage = 1;
    G.lives = LIVES;
    G.powLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.bombsStock = BOMB_START;
    G.deadT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '空霸',
      '穿云拦截机。空格针弹撕云，Shift 云裂劈开一条生路。云谷穿雾，雷脊劈雷，霸顶端核。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('ace');
    else startGame(G.kind || 'ace');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('ace');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('sea');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isSea()) goTitle();
      else startGame('sea');
    }
  }

  function tryBomb() {
    audio.ensure();
    if (overlayOpen()) return;
    if (G.mode === 'play') dropRift();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const bombKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ';

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

    if (down && (isMove || space || bombKey || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      if (bombKey) G.bombHold = false;
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
    if (bombKey) {
      if (!G.bombHold) {
        G.bombHold = true;
        tryBomb();
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

  if (btnAce) {
    btnAce.addEventListener('click', function () {
      audio.ensure();
      startGame('ace');
    });
  }
  if (btnSea) {
    btnSea.addEventListener('click', function () {
      audio.ensure();
      startGame('sea');
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
      else if (G.mode === 'win' && isSea()) goTitle();
      else if (G.mode === 'win') startGame('sea');
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
  function bindBombBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      G.bombHold = true;
      tryBomb();
    });
    el.addEventListener('pointerup', function () { G.bombHold = false; });
    el.addEventListener('pointerleave', function () { G.bombHold = false; });
  }
  bindBombBtn(btnBomb);
  bindBombBtn(btnPadBomb);

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
      G.bombHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
