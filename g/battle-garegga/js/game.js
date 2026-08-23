'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const BOMB_CAP = 6;
  const PWR_MAX = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 4.4;
  const BEST_KEY = 'playbox-battle-garegga-best';
  const MUTE_KEY = 'playbox-battle-garegga-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · Shift / Z 黑翼爆 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const STEEL = [77, 140, 255];
  const CYN = [90, 180, 255];
  const GOLD = [255, 227, 107];
  const RUST = [255, 122, 58];
  const WHT = [232, 240, 255];
  const PNK = [255, 154, 212];
  const INK = [20, 36, 72];
  const DEEP = [6, 12, 24];
  const PALE = [200, 220, 255];
  const SMOKE = [88, 104, 132];

  const MEDAL = [100, 200, 400, 800, 1500, 2400, 4000, 10000];
  const DROP_CYCLE = ['pwr', 'pwr', 'medal', 'bomb'];
  const OPT_SLOTS = [
    [-22, 16], [22, 16],
    [-38, 6], [38, 6]
  ];

  const SCORE = {
    grunt: 50,
    dive: 80,
    turret: 150,
    bomber: 180,
    elite: 260,
    carrier: 280,
    mid: 2000,
    boss: 4000,
    chip: 10,
    stage: 1500,
    pmax: 500
  };

  const STAGES = [
    {
      name: '锈港',
      biome: 'port',
      mid: '吊臂',
      boss: '货仓',
      form: 'crate',
      midHp: 34,
      bossHp: 84,
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.0, kind: 'stream', dir: 1 },
        { t: 5.4, kind: 'dive', n: 4 },
        { t: 7.6, kind: 'bomber' },
        { t: 9.8, kind: 'carrier' },
        { t: 12.0, kind: 'v', n: 7 },
        { t: 14.2, kind: 'mid' },
        { t: 20.0, kind: 'stream', dir: -1 },
        { t: 22.2, kind: 'dive', n: 4 },
        { t: 24.4, kind: 'turrets' },
        { t: 26.6, kind: 'v', n: 7 },
        { t: 31.4, kind: 'boss' }
      ]
    },
    {
      name: '黑廊',
      biome: 'hangar',
      mid: '翼台',
      boss: '双翼',
      form: 'twin',
      midHp: 46,
      bossHp: 114,
      waves: [
        { t: 0.6, kind: 'v', n: 7 },
        { t: 2.6, kind: 'turrets' },
        { t: 4.8, kind: 'dive', n: 5 },
        { t: 7.0, kind: 'stream', dir: -1 },
        { t: 9.2, kind: 'elite' },
        { t: 11.2, kind: 'carrier' },
        { t: 13.2, kind: 'bomber' },
        { t: 15.2, kind: 'mid' },
        { t: 21.0, kind: 'v', n: 9 },
        { t: 23.0, kind: 'dive', n: 6 },
        { t: 25.0, kind: 'turrets' },
        { t: 27.0, kind: 'stream', dir: 1 },
        { t: 29.0, kind: 'elite' },
        { t: 34.4, kind: 'boss' }
      ]
    },
    {
      name: '铁巢',
      biome: 'nest',
      mid: '炉卫',
      boss: '黑王',
      form: 'black',
      midHp: 58,
      bossHp: 158,
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.4, kind: 'dive', n: 5 },
        { t: 4.4, kind: 'elite' },
        { t: 6.4, kind: 'bomber' },
        { t: 8.2, kind: 'turrets' },
        { t: 10.0, kind: 'carrier' },
        { t: 11.8, kind: 'stream', dir: 1 },
        { t: 13.6, kind: 'mid' },
        { t: 19.4, kind: 'v', n: 9 },
        { t: 21.2, kind: 'dive', n: 6 },
        { t: 23.0, kind: 'elite' },
        { t: 24.8, kind: 'bomber' },
        { t: 26.6, kind: 'stream', dir: -1 },
        { t: 28.4, kind: 'turrets' },
        { t: 30.2, kind: 'carrier' },
        { t: 36.0, kind: 'boss' }
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
  const btnWing = document.getElementById('btn-wing');
  const btnDense = document.getElementById('btn-dense');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const pwrLabel = document.getElementById('pwr-label');
  const bombLabel = document.getElementById('bomb-label');
  const medalLabel = document.getElementById('medal-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const rankBar = document.getElementById('rank-bar');
  const rankWrap = document.getElementById('rank-wrap');

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
  let pwrTok = 0;
  let medalTok = 0;
  let dropCycle = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];
  const smokes = [];

  const G = {
    mode: 'title',
    kind: 'wing',
    t: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    pwr: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    wingT: 0,
    rank: 0,
    medalLv: 0,
    enemies: [],
    shots: [],
    bullets: [],
    pows: [],
    opts: [
      { x: VW * 0.5, y: 640, on: false },
      { x: VW * 0.5, y: 640, on: false },
      { x: VW * 0.5, y: 640, on: false },
      { x: VW * 0.5, y: 640, on: false }
    ],
    ship: { x: VW * 0.5, y: 630, vx: 0, vy: 0 },
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: STEEL,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    stageClear: false,
    prop: 0
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
  function isDense() {
    return G.kind === 'dense';
  }
  function dens() {
    return isDense() ? 1.28 : 1;
  }
  function optionCount() {
    if (G.pwr <= 0) return 0;
    return G.pwr >= PWR_MAX ? 4 : 2;
  }
  function shipSpeed() {
    return (isDense() ? 312 : 270) + G.pwr * 10;
  }
  function bulletSpd() {
    return (isDense() ? 188 : 148) * (1 + G.rank * 0.22);
  }
  function scrollSpd() {
    if (hasBoss() || hasMid()) return 28;
    return isDense() ? 116 : 84;
  }
  function hpMul() {
    return isDense() ? 1.22 : 1;
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function stageData() {
    return STAGES[G.stage - 1] || STAGES[0];
  }
  function medalVal() {
    return MEDAL[Math.min(G.medalLv, MEDAL.length - 1)];
  }
  function suicideN() {
    const n = Math.floor(G.rank * (isDense() ? 10 : 7));
    return n < 2 ? 0 : n;
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
    shoot(lv) {
      this.ensure();
      const lift = 1 + (lv || 0) * 0.08;
      this.beep(620 * lift, 0.038, 'square', 0.024 + (lv || 0) * 0.004, 1280 * lift);
      this.beep(180, 0.03, 'sawtooth', 0.012, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.028, 0.026, 1500);
      this.beep(580 * lift, 0.05, 'square', 0.034, 920 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.038, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.028, 1176);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(260, 0.14, 'sawtooth', 0.045, 64);
    },
    bossHit() {
      this.ensure();
      this.beep(220, 0.055, 'sawtooth', 0.036, 160);
      this.beep(540, 0.07, 'square', 0.028, 820);
    },
    bossDie() {
      this.ensure();
      this.noise(0.22, 0.06, 260);
      this.beep(160, 0.28, 'sawtooth', 0.05, 46);
      this.beep(480, 0.2, 'triangle', 0.04, 200);
      this.beep(960, 0.32, 'sine', 0.04, 1440);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 380);
      this.beep(300, 0.16, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.045, 46);
    },
    wave() {
      this.ensure();
      this.beep(349, 0.09, 'sine', 0.04, 466);
      this.beep(466, 0.11, 'sine', 0.04, 622);
      this.beep(698, 0.2, 'triangle', 0.045, 932);
    },
    extra() {
      this.ensure();
      this.beep(698, 0.1, 'square', 0.04, 932);
      this.beep(1046, 0.16, 'sine', 0.04, 1396);
    },
    power() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.036, 1175);
      this.beep(1175, 0.16, 'sine', 0.03, 1568);
    },
    max() {
      this.ensure();
      this.beep(466, 0.1, 'square', 0.045, 698);
      this.beep(698, 0.12, 'triangle', 0.04, 932);
      this.beep(1046, 0.2, 'sine', 0.05, 1396);
    },
    bomb() {
      this.ensure();
      this.noise(0.22, 0.072, 200);
      this.beep(120, 0.28, 'sawtooth', 0.06, 38);
      this.beep(320, 0.18, 'square', 0.04, 80);
      this.beep(760, 0.22, 'sine', 0.04, 1520);
    },
    medal() {
      this.ensure();
      this.beep(880, 0.06, 'sine', 0.034, 1320);
      this.beep(1320, 0.08, 'triangle', 0.022, 1760);
    },
    pickup() {
      this.ensure();
      this.beep(700, 0.07, 'sine', 0.036, 1400);
      this.beep(1120, 0.09, 'triangle', 0.022, 1680);
    },
    empty() {
      this.ensure();
      this.beep(170, 0.1, 'square', 0.03, 80);
    },
    rankUp() {
      this.ensure();
      this.beep(440, 0.08, 'square', 0.036, 660);
      this.beep(660, 0.12, 'triangle', 0.03, 880);
    },
    rankWarn() {
      this.ensure();
      this.beep(220, 0.1, 'sawtooth', 0.04, 140);
      this.beep(440, 0.14, 'square', 0.03, 220);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.04, 80);
      this.beep(130, 0.3, 'sine', 0.05, 44);
    },
    win() {
      this.ensure();
      this.beep(466, 0.1, 'square', 0.045, 587);
      this.beep(587, 0.12, 'triangle', 0.04, 698);
      this.beep(784, 0.18, 'sine', 0.05, 1046);
      this.beep(1175, 0.28, 'triangle', 0.04, 1568);
    },
    start() {
      this.ensure();
      this.beep(349, 0.09, 'square', 0.04, 698);
      this.beep(698, 0.14, 'triangle', 0.035, 1046);
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
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
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
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    while (G.score >= G.next1up && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.next1up += LIFE_EVERY;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.055);
      kick(3.2);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    }
    if (G.combo % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 28, G.combo + ' 链', GOLD, true);
      hitStop(0.046);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (comboEl) comboEl.hidden = true;
  }

  function raiseRank(n) {
    const prev = G.rank;
    G.rank = clamp(G.rank + n, 0, 1);
    if (prev < 0.5 && G.rank >= 0.5) {
      toast('热度升', false, true);
      audio.rankUp();
    } else if (prev < 0.8 && G.rank >= 0.8) {
      toast('热度危险', true, false);
      audio.rankWarn();
    }
  }

  function dropRank(n) {
    const prev = G.rank;
    G.rank = clamp(G.rank - n, 0, 1);
    if (prev >= 0.55 && G.rank < 0.5) toast('热度回落', false, true);
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1150);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = LIFE_CAP;
    while (pips.length < n) {
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < n; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const st = stageData();
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '黑翼';
      else if (hasBoss()) stageLabel.textContent = st.boss;
      else if (hasMid()) stageLabel.textContent = st.mid;
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密弹' : '黑翼';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isDense() || G.rank >= 0.8);
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.pwr >= PWR_MAX);
    }
    if (rankBar) rankBar.style.width = (G.rank * 100).toFixed(0) + '%';
    if (rankWrap) {
      rankWrap.classList.toggle('hot', G.rank >= 0.8);
      rankWrap.classList.toggle('warn', G.rank >= 0.5 && G.rank < 0.8);
    }
    if (medalLabel) {
      medalLabel.textContent = '章 ' + medalVal();
      medalLabel.classList.toggle('hot', G.medalLv >= 3);
    }
    if (pwrLabel) {
      pwrLabel.textContent = G.pwr >= PWR_MAX ? '翼 MAX' : '翼 ' + G.pwr;
      pwrLabel.classList.toggle('max', G.pwr >= PWR_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    const bombOff = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
    if (btnBomb) btnBomb.disabled = bombOff;
    if (btnPad) btnPad.disabled = bombOff;
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格连射，Shift 黑翼爆', 'warn');
    else if (G.mode === 'win') setHint('铁巢已碎 · R 再来', 'hot');
    else if (G.rank >= 0.8) setHint('热度危险 · 自杀弹喷涌 · 爆弹可压热', 'warn');
    else if (G.pwr >= PWR_MAX) setHint('翼 MAX · 四机跟射铺路', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 黑翼爆清场压热', 'warn');
    else setHint('空格连射 · Shift 黑翼爆 · 捡 章 叠分', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GARE';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvModes) {
      if (kind === 'win' && G.kind === 'wing') btnOvModes.textContent = '密弹';
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

  function kick(mag, cls) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.8 ? 'bomb' : mag >= 3.2 ? 'pow' : 'hit');
    stageEl.classList.remove('die', 'hit', 'pow', 'boss', 'bomb');
    void stageEl.offsetWidth;
    stageEl.classList.add(name);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 180,
        life: rand(0.22, 0.5),
        r: rand(1.2, 2.8),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 180);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 16);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      t: 0,
      life: gold ? 0.9 : 0.65,
      vy: gold ? -70 : -48,
      text: text,
      rgb: rgb,
      gold: !!gold
    });
    capArr(floats, 18);
  }

  function explode(x, y, rgb, power) {
    const p = power || 16;
    burst(x, y, rgb, Math.min(28, 8 + (p * 0.45) | 0), 80 + p * 4);
    spark(x, y, rgb);
    ring(x, y, rgb);
  }

  function seedEmbers() {
    embers.length = 0;
    for (let i = 0; i < 72; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.12, 0.62),
        z: rand(0.35, 1.2)
      });
    }
    smokes.length = 0;
    for (let i = 0; i < 18; i++) {
      smokes.push({
        x: rand(20, VW - 20),
        y: rand(0, VH),
        s: rand(10, 28),
        a: rand(0.04, 0.14),
        z: rand(0.4, 1)
      });
    }
  }

  function living() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) n += 1;
    return n;
  }

  function hasBoss() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'boss') return true;
    }
    return false;
  }

  function hasMid() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'mid') return true;
    }
    return false;
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss' || spec.kind === 'mid';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'grunt',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 92 * dens() : spec.vy,
      hp: bossish ? spec.hp : hp,
      maxHp: bossish ? spec.hp : hp,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 48 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.grunt,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      ground: !!spec.ground,
      drop: spec.drop || null,
      form: spec.form || '',
      name: spec.name || '',
      prop: rand(0, TAU)
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r, sui) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.5,
      life: 8,
      sui: !!sui
    });
    capArr(G.bullets, 280);
  }

  function aimedFire(e, n, spread, spd) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.3, false);
    }
  }

  function ringFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.4, false);
    }
  }

  function suicideSpray(e) {
    const n = suicideN();
    if (n < 2) return;
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const s = bulletSpd() * 0.78;
    for (let i = 0; i < n; i++) {
      const a = a0 + (i - (n - 1) * 0.5) * 0.22;
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.1, true);
    }
  }

  function spawnGrunt(x, y, vx, vy) {
    spawnEnemy({
      kind: 'grunt',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 96 * dens() : vy,
      hp: 2,
      r: 12,
      amp: 42,
      score: SCORE.grunt,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    const count = (n || 5) + (isDense() ? 2 : 0);
    for (let i = 0; i < count; i++) {
      const t = i - (count - 1) * 0.5;
      spawnGrunt(c + t * 36, -24 - Math.abs(t) * 18, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const d = dir || 1;
    const side = d < 0 ? VW - 70 : 70;
    const extra = isDense() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'grunt',
        x: side,
        y: -20 - i * 22,
        vx: d * 38,
        vy: 88 * dens(),
        hp: 2,
        r: 12,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.grunt,
        fireCd: 0.7 + i * 0.12
      });
    }
  }

  function spawnDive(n) {
    const extra = isDense() ? 1 : 0;
    const count = (n || 4) + extra;
    for (let i = 0; i < count; i++) {
      spawnEnemy({
        kind: 'dive',
        x: 50 + Math.random() * (VW - 100),
        y: -30 - i * 18,
        vx: 0,
        vy: 40,
        hp: 2,
        r: 11,
        amp: 0,
        score: SCORE.dive,
        fireCd: 9
      });
    }
  }

  function spawnTurrets() {
    spawnEnemy({
      kind: 'turret',
      x: 70 + rand(0, 40),
      y: -20,
      vy: 72 * dens(),
      hp: 6,
      r: 16,
      ground: true,
      amp: 0,
      score: SCORE.turret,
      fireCd: 0.4
    });
    spawnEnemy({
      kind: 'turret',
      x: VW - 70 - rand(0, 40),
      y: -50,
      vy: 72 * dens(),
      hp: 6,
      r: 16,
      ground: true,
      amp: 0,
      score: SCORE.turret,
      fireCd: 0.8
    });
  }

  function spawnBomber() {
    spawnEnemy({
      kind: 'bomber',
      x: VW * 0.5 + rand(-80, 80),
      y: -36,
      vy: 58 * dens(),
      hp: 8,
      r: 22,
      amp: 70,
      omega: 1.4,
      score: SCORE.bomber,
      fireCd: 0.5
    });
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      x: VW * 0.5 + rand(-40, 40),
      y: -30,
      vy: 64 * dens(),
      hp: 12,
      r: 18,
      amp: 90,
      omega: 1.6,
      score: SCORE.elite,
      fireCd: 0.35,
      drop: nextDrop()
    });
  }

  function spawnCarrier() {
    spawnEnemy({
      kind: 'carrier',
      x: VW * 0.5,
      y: -34,
      vy: 52 * dens(),
      hp: 10,
      r: 20,
      amp: 50,
      omega: 1.1,
      score: SCORE.carrier,
      fireCd: 0.8,
      drop: nextDrop()
    });
  }

  function spawnMid() {
    const st = stageData();
    spawnEnemy({
      kind: 'mid',
      x: VW * 0.5,
      y: -80,
      hp: Math.round(st.midHp * hpMul()),
      r: 36,
      enter: 1.2,
      amp: 86,
      score: SCORE.mid,
      form: st.form,
      name: st.mid,
      fireCd: 0.6,
      drop: 'pwr'
    });
    toast(st.mid, false, true);
    audio.wave();
  }

  function spawnBoss() {
    const st = stageData();
    spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -100,
      hp: Math.round(st.bossHp * hpMul()),
      r: 48,
      enter: 1.6,
      amp: 110,
      score: SCORE.boss + 1500 * G.stage,
      form: st.form,
      name: st.boss,
      fireCd: 0.5,
      drop: 'bomb'
    });
    toast(st.boss, false, true);
    audio.wave();
    screenFlash(STEEL, 0.28);
  }

  function nextDrop() {
    const k = DROP_CYCLE[dropCycle % DROP_CYCLE.length];
    dropCycle += 1;
    return k;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n || 5);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n || 4);
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'bomber') spawnBomber();
    else if (w.kind === 'elite') spawnElite();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
    if (isDense() && w.kind !== 'mid' && w.kind !== 'boss' && Math.random() < 0.55) {
      spawnGrunt(80 + Math.random() * (VW - 160), -40, 0, 110);
    }
  }

  function addShot(s) {
    G.shots.push(s);
    capArr(G.shots, 90);
  }

  function wantFire() {
    if (G.mode !== 'play' || G.deadT > 0 || overlayOpen()) return false;
    return keys.sht || pointer.down;
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    const lv = G.pwr;
    G.fireCd = Math.max(0.068, 0.112 - lv * 0.012);
    G.muzzle = 0.06;
    raiseRank(0.00085);
    const x = G.ship.x;
    const y = G.ship.y - 16;
    const n = lv <= 0 ? 2 : lv === 1 ? 3 : lv === 2 ? 4 : 5;
    const spread = lv <= 1 ? 0.05 : lv === 2 ? 0.1 : 0.16;
    const dmg = 1 + lv * 0.18;
    const spd = 700;
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0 : (i - (n - 1) * 0.5);
      const a = -Math.PI * 0.5 + t * spread;
      addShot({
        x: x + t * (5 + lv),
        y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: 3.2 + lv * 0.35,
        dmg: dmg,
        kind: 'trace',
        rgb: STEEL
      });
    }
    const oc = optionCount();
    for (let i = 0; i < oc; i++) {
      const o = G.opts[i];
      if (!o.on) continue;
      addShot({
        x: o.x,
        y: o.y - 8,
        vx: 0,
        vy: -640,
        r: 2.6,
        dmg: 0.7 + lv * 0.1,
        kind: 'opt',
        rgb: CYN
      });
    }
    audio.shoot(lv);
  }

  function tryBomb() {
    if (G.mode !== 'play' || overlayOpen() || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      audio.empty();
      toast('爆弹用尽', true, false);
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.48;
    G.bombFlash = 0.6;
    G.wingT = 0.62;
    G.invuln = Math.max(G.invuln, 0.42);
    dropRank(0.14);
    audio.bomb();
    hitStop(0.078);
    kick(6.6, 'bomb');
    screenFlash(STEEL, 0.74);
    ring(G.ship.x, G.ship.y - 12, GOLD);
    ring(G.ship.x, G.ship.y - 12, STEEL);
    burst(G.ship.x, G.ship.y - 16, STEEL, 28, 250);
    burst(G.ship.x, G.ship.y - 16, RUST, 18, 200);
    floatText(G.ship.x, G.ship.y - 36, '黑翼爆', GOLD, true);
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      burst(G.bullets[i].x, G.bullets[i].y, GOLD, 3, 60);
      G.bullets.splice(i, 1);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dmg = e.kind === 'boss' ? 14 : e.kind === 'mid' ? 10 : 6;
      damageEnemy(e, dmg, 'bomb');
    }
    syncHud();
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x,
      y: y,
      vx: rand(-28, 28),
      vy: kind === 'medal' ? 56 : 42,
      kind: kind,
      t: 0
    });
    capArr(G.pows, 18);
  }

  function pulsePwr() {
    if (!pwrLabel) return;
    pwrLabel.classList.remove('hot');
    void pwrLabel.offsetWidth;
    pwrLabel.classList.add('hot');
    pwrTok += 1;
  }

  function pulseMedal() {
    if (!medalLabel) return;
    medalLabel.classList.remove('hot');
    void medalLabel.offsetWidth;
    medalLabel.classList.add('hot');
    medalTok += 1;
  }

  function collectPow(p) {
    if (p.kind === 'medal') {
      const val = medalVal();
      const pts = Math.round(val * G.mult);
      addScore(pts);
      floatText(p.x, p.y, String(pts), GOLD, G.medalLv >= 3);
      if (G.medalLv < MEDAL.length - 1) G.medalLv += 1;
      raiseRank(0.01);
      audio.medal();
      pulseMedal();
      burst(p.x, p.y, GOLD, 8, 90);
      spark(p.x, p.y, RUST);
    } else if (p.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        floatText(p.x, p.y, '爆', GOLD, true);
      } else {
        const pts = Math.round(400 * G.mult);
        addScore(pts);
        floatText(p.x, p.y, '+' + pts, GOLD, false);
      }
      audio.pickup();
      burst(p.x, p.y, GOLD, 10, 110);
    } else {
      if (G.pwr < PWR_MAX) {
        G.pwr += 1;
        audio.power();
        floatText(p.x, p.y, '翼 ' + G.pwr, CYN, true);
        pulsePwr();
        if (G.pwr >= PWR_MAX) {
          audio.max();
          toast('翼 MAX', false, true);
          floatText(G.ship.x, G.ship.y - 40, 'MAX', GOLD, true);
          hitStop(0.055);
          kick(3.6, 'pow');
          screenFlash(STEEL, 0.42);
        } else {
          kick(2.8, 'pow');
          screenFlash(CYN, 0.22);
        }
      } else {
        const pts = Math.round(SCORE.pmax * G.mult);
        addScore(pts);
        floatText(p.x, p.y, '+' + pts, CYN, true);
        audio.pickup();
      }
      raiseRank(0.016);
      burst(p.x, p.y, STEEL, 10, 110);
      spark(p.x, p.y, CYN);
    }
    if (G.combo >= 1) bumpCombo();
    else {
      G.combo = 1;
      G.comboT = COMBO_WIN;
      G.mult = 1;
    }
    syncHud();
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (src === 'shot') {
      spark(e.x, e.y, STEEL);
      hitStop(0.034);
      audio.hit(G.combo);
      kick(1.7);
    }
    if ((e.kind === 'boss' || e.kind === 'mid') && src === 'shot') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'mid' || e.kind === 'elite' || e.kind === 'carrier' ? STEEL : RUST;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 48 : e.kind === 'mid' ? 32 : e.kind === 'elite' ? 22 : 14);
    const pts = Math.round(e.score * G.mult);
    addScore(pts);
    bumpCombo();
    raiseRank(0.006);
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss' || e.kind === 'mid');
    if (e.drop) spawnPow(e.x, e.y, e.drop);
    else if (e.kind !== 'boss' && e.kind !== 'mid' && Math.random() < 0.52 + G.rank * 0.28) {
      spawnPow(e.x, e.y, 'medal');
    }
    if (src !== 'bomb') suicideSpray(e);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(GOLD, 0.72);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, GOLD);
      G.bullets.length = 0;
      spawnPow(e.x - 18, e.y, 'medal');
      spawnPow(e.x + 18, e.y, 'medal');
      spawnPow(e.x, e.y - 16, 'medal');
      toast(e.name + '坠毁', false, true);
      if (G.stage >= 3) G.winT = 2.05;
      else {
        G.stageClear = true;
        G.gapT = 0;
      }
    } else if (e.kind === 'mid') {
      audio.explode();
      hitStop(0.062);
      kick(5.2, 'boss');
      screenFlash(STEEL, 0.4);
      G.bullets.length = 0;
      spawnPow(e.x, e.y, 'medal');
    } else if (e.kind === 'elite' || e.kind === 'carrier') {
      audio.explode();
      hitStop(0.05);
      kick(3.2);
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play' || G.bombT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    breakCombo();
    dropRank(0.32);
    G.medalLv = 0;
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, STEEL, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    if (G.pwr > 0) spawnPow(G.ship.x, G.ship.y - 10, 'pwr');
    G.pwr = Math.max(0, G.pwr - 1);
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = 630;
    G.invuln = 1.55;
    G.deadT = 0;
    G.bombT = 0;
    G.wingT = 0;
    for (let i = 0; i < G.opts.length; i++) {
      G.opts[i].x = G.ship.x;
      G.opts[i].y = G.ship.y + 10;
    }
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '翼折了', '黑翼已坠。热度催生自杀弹，捡章叠分。分数 ' + G.score + '。');
    setHint('R 重开 · 空格连射，Shift 黑翼爆', 'warn');
  }

  function goWin() {
    addScore(isDense() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    showOverlay(
      'win',
      isDense() ? '密弹通关' : '铁巢尽破',
      '三关打穿，黑王已坠。分数 ' + G.score + (isDense() ? ' · 密弹' : ' · 黑翼') + '。'
    );
    setHint('铁巢已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.pows.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * G.mult));
    G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    G.stageClear = false;
    const st = stageData();
    toast('第 ' + G.stage + ' 关 · ' + st.name, false, true);
    audio.wave();
    screenFlash(STEEL, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    dropCycle = 0;
    G.mode = 'play';
    G.kind = kind === 'dense' ? 'dense' : 'wing';
    G.t = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.next1up = LIFE_EVERY;
    G.pwr = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.wingT = 0;
    G.rank = 0;
    G.medalLv = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.winT = 0;
    G.gapT = 0;
    G.stageClear = false;
    G.scroll = 0;
    G.prop = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = 630;
    G.ship.vx = 0;
    G.ship.vy = 0;
    for (let i = 0; i < G.opts.length; i++) {
      G.opts[i].x = G.ship.x;
      G.opts[i].y = G.ship.y + 12;
      G.opts[i].on = false;
    }
    if (scoreEl) scoreEl.textContent = '0';
    toast(isDense() ? '密弹' : '黑翼', isDense(), !isDense());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'wing';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.pwr = 0;
    G.bombs = 3;
    G.deadT = 0;
    G.rank = 0;
    G.medalLv = 0;
    G.wingT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = 630;
    clearWorld();
    showOverlay('title', '黑翼', '纵向黑翼。打得越狠热度越高，击坠会喷自杀弹。捡章叠分，翼机跟射。短关之后是铁巢。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('wing');
    else startGame(G.kind || 'wing');
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
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.bombFlash > 0) G.bombFlash -= dt;
    if (G.wingT > 0) G.wingT -= dt;
    G.prop += dt * 18;
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < embers.length; i++) {
      const s = embers[i];
      s.y += scr * 0.45 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < smokes.length; i++) {
      const s = smokes[i];
      s.y += scr * 0.22 * s.z * dt;
      s.x += Math.sin(G.t * 0.4 + i) * 6 * dt;
      if (s.y > VH + 30) {
        s.y = -30;
        s.x = rand(20, VW - 20);
      }
    }
  }

  function updateShip(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = shipSpeed();
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
      G.ship.vx = dx * spd;
      G.ship.vy = dy * spd;
      inputSrc = 'key';
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      G.ship.x = lerp(G.ship.x, tx, 1 - Math.exp(-dt * 16));
      G.ship.y = lerp(G.ship.y, ty, 1 - Math.exp(-dt * 16));
      G.ship.vx = 0;
      G.ship.vy = 0;
    } else {
      G.ship.vx *= Math.exp(-dt * 10);
      G.ship.vy *= Math.exp(-dt * 10);
    }
    G.ship.x += G.ship.vx * dt;
    G.ship.y += G.ship.vy * dt;
    G.ship.x = clamp(G.ship.x, 22, VW - 22);
    G.ship.y = clamp(G.ship.y, 40, VH - 28);
    const oc = optionCount();
    for (let i = 0; i < G.opts.length; i++) {
      const on = i < oc;
      G.opts[i].on = on;
      const tx = G.ship.x + (on ? OPT_SLOTS[i][0] : 0);
      const ty = G.ship.y + (on ? OPT_SLOTS[i][1] : 10);
      G.opts[i].x = lerp(G.opts[i].x, tx, 1 - Math.exp(-dt * 9));
      G.opts[i].y = lerp(G.opts[i].y, ty, 1 - Math.exp(-dt * 9));
    }
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (wantFire()) fireShot();
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -40 || s.y > VH + 40 || s.x < -40 || s.x > VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let k = 0; k < G.enemies.length; k++) {
        const e = G.enemies[k];
        if (!e.alive) continue;
        const rr = e.r + (s.r || 3);
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, s.dmg || 1, 'shot');
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > VH + 20 || b.y < -30 || b.x < -20 || b.x > VW + 20) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = b.x - G.ship.x;
        const dy = b.y - G.ship.y;
        const rr = HIT_R + b.r * 0.55;
        if (dx * dx + dy * dy < rr * rr) {
          G.bullets.splice(i, 1);
          diePlayer();
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
      p.vy += 18 * dt;
      p.vx *= Math.exp(-dt * 0.6);
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      p.x = clamp(p.x, 18, VW - 18);
      if (p.y > VH + 20) {
        if (p.kind === 'medal' && G.medalLv > 0 && G.mode === 'play') {
          G.medalLv = 0;
          toast('章链断', true, false);
          audio.empty();
          syncHud();
        }
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = p.x - G.ship.x;
        const dy = p.y - G.ship.y;
        if (dx * dx + dy * dy < 26 * 26) {
          collectPow(p);
          G.pows.splice(i, 1);
        }
      }
    }
  }

  function fireInterval(e) {
    const slow = (isDense() ? 0.74 : 1) * (1 - G.rank * 0.32);
    if (e.kind === 'boss') return 0.55 * slow;
    if (e.kind === 'mid') return 0.62 * slow;
    if (e.kind === 'elite') return 0.85 * slow;
    if (e.kind === 'turret') return 1.05 * slow;
    if (e.kind === 'bomber') return 0.95 * slow;
    if (e.kind === 'carrier') return 1.15 * slow;
    return 1.35 * slow;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.prop += dt * 14;
    if (e.flash > 0) e.flash -= dt;
    const spd = bulletSpd();

    if (e.kind === 'boss' || e.kind === 'mid') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, e.kind === 'boss' ? 118 : 108, 1 - Math.exp(-dt * 2.4));
        return;
      }
      e.x = VW * 0.5 + Math.sin(e.t * 0.85 + e.phase) * (e.kind === 'boss' ? 110 : 86);
      e.y = (e.kind === 'boss' ? 118 : 108) + Math.sin(e.t * 1.3) * 10;
      e.spin += dt * (e.form === 'twin' ? 2.2 : 1.6);
      e.fireCd -= dt;
      if (e.fireCd > 0) return;
      const ratio = e.hp / Math.max(1, e.maxHp);
      if (e.kind === 'mid') {
        if (e.form === 'twin') {
          ringFire(e, 8, spd * 0.72, e.spin);
          e.fireCd = fireInterval(e);
        } else if (e.form === 'black') {
          aimedFire(e, 3, 0.18, spd);
          if (ratio < 0.55) ringFire(e, 8, spd * 0.64, e.spin);
          e.fireCd = fireInterval(e);
        } else {
          aimedFire(e, ratio < 0.5 ? 3 : 1, 0.2, spd);
          e.fireCd = fireInterval(e);
        }
        return;
      }
      if (e.form === 'crate') {
        if (ratio > 0.5) {
          aimedFire(e, 5, 0.14, spd);
          e.fireCd = 0.72 * (isDense() ? 0.78 : 1);
        } else {
          aimedFire(e, 3, 0.16, spd * 1.05);
          ringFire(e, 6, spd * 0.7, e.spin);
          e.fireCd = 0.52 * (isDense() ? 0.78 : 1);
        }
      } else if (e.form === 'twin') {
        if (ratio > 0.5) {
          ringFire(e, 10, spd * 0.76, e.spin);
          e.fireCd = 0.64 * (isDense() ? 0.78 : 1);
        } else {
          ringFire(e, 12, spd * 0.7, e.spin);
          ringFire(e, 8, spd * 0.5, -e.spin * 0.7);
          e.fireCd = 0.5 * (isDense() ? 0.78 : 1);
        }
      } else {
        if (ratio > 0.55) {
          aimedFire(e, 5, 0.15, spd);
          if ((e.pattern++ % 3) === 0) ringFire(e, 8, spd * 0.68, e.spin);
          e.fireCd = 0.58 * (isDense() ? 0.78 : 1);
        } else if (ratio > 0.28) {
          ringFire(e, 12, spd * 0.78, e.spin);
          ringFire(e, 8, spd * 0.58, -e.spin * 0.7);
          aimedFire(e, 3, 0.16, spd * 1.05);
          e.fireCd = 0.46 * (isDense() ? 0.78 : 1);
        } else {
          ringFire(e, 14, spd * 0.8, e.spin);
          aimedFire(e, 5, 0.12, spd * 1.08);
          if ((e.pattern++ % 4) === 0) {
            spawnGrunt(e.x - 40, e.y + 24, -30, 110);
            spawnGrunt(e.x + 40, e.y + 24, 30, 110);
          }
          e.fireCd = 0.4 * (isDense() ? 0.78 : 1);
        }
      }
      return;
    }

    if (e.kind === 'dive') {
      if (e.t > 0.35) {
        e.vy = Math.min(e.vy + 280 * dt, 280 * dens());
        const ax = clamp(G.ship.x - e.x, -140, 140);
        e.vx = lerp(e.vx, ax * 0.9, 1 - Math.exp(-dt * 2));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      return;
    }

    if (e.kind === 'turret') {
      e.y += e.vy * dt;
      e.fireCd -= dt;
      if (e.fireCd <= 0 && e.y > 20 && e.y < VH - 80) {
        aimedFire(e, isDense() ? 2 : 1, 0.12, spd * 0.9);
        e.fireCd = fireInterval(e);
      }
      return;
    }

    if (e.kind === 'bomber') {
      e.y += e.vy * dt;
      e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp;
      e.fireCd -= dt;
      if (e.fireCd <= 0 && e.y > 30) {
        enemyShot(e.x - 10, e.y + 8, -12, spd * 0.7, 4.2, false);
        enemyShot(e.x + 10, e.y + 8, 12, spd * 0.7, 4.2, false);
        if (isDense() || G.rank > 0.4) enemyShot(e.x, e.y + 12, 0, spd * 0.85, 4.4, false);
        e.fireCd = fireInterval(e);
      }
      return;
    }

    e.y += e.vy * dt;
    e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp + e.vx * e.t * 0.15;
    e.fireCd -= dt;
    if (e.fireCd <= 0 && e.y > 24 && e.y < VH - 90) {
      if (e.kind === 'elite') aimedFire(e, 3, 0.18, spd);
      else if (e.kind === 'carrier') aimedFire(e, 1, 0, spd * 0.9);
      else if (Math.random() < (isDense() ? 0.85 : 0.55)) aimedFire(e, 1, 0, spd);
      e.fireCd = fireInterval(e);
    }
  }

  function updateEnemies(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) {
        G.enemies.splice(i, 1);
        continue;
      }
      thinkEnemy(e, dt);
      if (e.y > VH + 40 || e.x < -50 || e.x > VW + 50) {
        if (e.kind !== 'boss' && e.kind !== 'mid') {
          e.alive = false;
          G.enemies.splice(i, 1);
        }
        continue;
      }
      if (canHurt && !e.ground) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = (e.kind === 'boss' || e.kind === 'mid' ? e.r * 0.62 : e.r * 0.7) + HIT_R;
        if (dx * dx + dy * dy < rr * rr) diePlayer();
      }
    }
  }

  function updateWaves(dt) {
    if (hasBoss() || hasMid()) return;
    if (G.stageClear) {
      G.gapT += dt;
      if (G.gapT >= 1.6) nextStage();
      return;
    }
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.ship.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.ship.y = VH - 96;
      if (living() < 6 && (G.t * 2 | 0) !== ((G.t - dt) * 2 | 0) && Math.random() < 0.45) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 50);
      }
      updateEnemies(dt);
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      updateWorld(dt * 0.5);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateBullets(dt);
      updatePows(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.bombT > 0) G.bombT -= dt;
    if (G.winT > 0) {
      G.winT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updatePows(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss() && !hasMid()) G.stageT += dt;
    raiseRank(dt * 0.0032);
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePows(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathWing(c, x, y, hw, h) {
    c.beginPath();
    c.moveTo(sx(x), sy(y - h * 0.7));
    c.lineTo(sx(x + hw), sy(y + h * 0.15));
    c.lineTo(sx(x + hw * 0.35), sy(y + h * 0.5));
    c.lineTo(sx(x - hw * 0.35), sy(y + h * 0.5));
    c.lineTo(sx(x - hw), sy(y + h * 0.15));
    c.closePath();
  }

  function drawHpBar(e) {
    const w = e.kind === 'boss' ? 160 : 110;
    const x = e.x - w * 0.5;
    const y = e.y - e.r - 16;
    const t = clamp(e.hp / Math.max(1, e.maxHp), 0, 1);
    ctx.fillStyle = 'rgba(6,12,24,0.7)';
    ctx.fillRect(sx(x), sy(y), w * scale, 5 * scale);
    ctx.fillStyle = rgba(t < 0.3 ? MAG : t < 0.55 ? RUST : STEEL, 0.95);
    ctx.fillRect(sx(x), sy(y), w * t * scale, 5 * scale);
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, 5 * scale);
  }

  function drawBg() {
    const st = stageData();
    const biome = st.biome || 'port';
    ctx.fillStyle = '#040814';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (biome === 'hangar') {
      g.addColorStop(0, '#0a1428');
      g.addColorStop(0.55, '#08101e');
      g.addColorStop(1, '#120c10');
    } else if (biome === 'nest') {
      g.addColorStop(0, '#100810');
      g.addColorStop(0.5, '#0a101c');
      g.addColorStop(1, '#180c0a');
    } else {
      g.addColorStop(0, '#081428');
      g.addColorStop(0.5, '#06101c');
      g.addColorStop(1, '#0c1014');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const scr = G.scroll;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    for (let i = 0; i < 7; i++) {
      const gx = 36 + i * 68;
      const gy = ((i * 97 + scr * 0.35) % (VH + 80)) - 40;
      ctx.strokeStyle = rgba(STEEL, 0.07);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(gx - 18), sy(gy));
      ctx.lineTo(sx(gx), sy(gy - 40));
      ctx.lineTo(sx(gx + 18), sy(gy));
      ctx.stroke();
    }

    for (let i = 0; i < 5; i++) {
      const hx = hash(i * 19 + G.stage * 3);
      const bx = 30 + hx * (VW - 80);
      const by = ((i * 170 + scr * 0.55) % (VH + 140)) - 70;
      const bw = 40 + hash(i + 8) * 50;
      const bh = 50 + hash(i + 3) * 70;
      ctx.fillStyle = rgba(INK, 0.55);
      ctx.fillRect(sx(bx), sy(by), bw * scale, bh * scale);
      ctx.fillStyle = rgba(STEEL, 0.08);
      ctx.fillRect(sx(bx + 6), sy(by + 8), (bw - 12) * scale, 6 * scale);
      if (biome === 'nest' || biome === 'port') {
        const chx = bx + bw * 0.7;
        const chy = by - 28;
        ctx.fillStyle = rgba(SMOKE, 0.35);
        ctx.fillRect(sx(chx), sy(chy), 8 * scale, 30 * scale);
      }
    }

    if (biome === 'hangar') {
      ctx.strokeStyle = rgba(STEEL, 0.1);
      ctx.lineWidth = 1.5 * scale;
      for (let i = 0; i < 6; i++) {
        const y = ((i * 130 + scr * 0.4) % (VH + 40)) - 20;
        ctx.beginPath();
        ctx.moveTo(sx(20), sy(y));
        ctx.lineTo(sx(VW - 20), sy(y));
        ctx.stroke();
      }
    }

    for (let i = 0; i < smokes.length; i++) {
      const s = smokes[i];
      ctx.fillStyle = rgba(SMOKE, s.a);
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), s.s * scale, s.s * 0.6 * scale, 0, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < embers.length; i++) {
      const s = embers[i];
      const col = i % 5 === 0 ? RUST : i % 3 === 0 ? GOLD : STEEL;
      ctx.fillStyle = rgba(col, s.a * 0.7);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.s * scale, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const col = flash ? WHT : (e.kind === 'boss' ? STEEL : e.kind === 'elite' ? INK : RUST);
    const s = scale;

    if (e.kind === 'turret') {
      c.fillStyle = rgba(INK, 0.9);
      c.fillRect(sx(e.x - 14), sy(e.y - 6), 28 * s, 16 * s);
      c.fillStyle = rgba(flash ? WHT : RUST, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y - 4), 8 * s, 0, TAU);
      c.fill();
      const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
      c.strokeStyle = rgba(PALE, 0.8);
      c.lineWidth = 3 * s;
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y - 4));
      c.lineTo(sx(e.x + Math.cos(a) * 16), sy(e.y - 4 + Math.sin(a) * 16));
      c.stroke();
      return;
    }

    if (e.kind === 'boss' || e.kind === 'mid') {
      const hw = e.kind === 'boss' ? 54 : 38;
      const hh = e.kind === 'boss' ? 28 : 22;
      c.fillStyle = rgba(INK, 0.95);
      pathWing(c, e.x, e.y, hw, hh * 2);
      c.fill();
      c.fillStyle = rgba(flash ? WHT : STEEL, 0.9);
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y - hh * 0.9));
      c.lineTo(sx(e.x + hw * 0.35), sy(e.y + 4));
      c.lineTo(sx(e.x - hw * 0.35), sy(e.y + 4));
      c.closePath();
      c.fill();
      c.fillStyle = rgba(CYN, 0.7);
      c.fillRect(sx(e.x - 6), sy(e.y - 4), 12 * s, 10 * s);
      if (e.form === 'twin') {
        c.fillStyle = rgba(RUST, 0.8);
        c.fillRect(sx(e.x - hw * 0.7), sy(e.y - 6), 10 * s, 18 * s);
        c.fillRect(sx(e.x + hw * 0.7 - 10), sy(e.y - 6), 10 * s, 18 * s);
      } else if (e.form === 'black') {
        c.strokeStyle = rgba(MAG, 0.7);
        c.lineWidth = 2 * s;
        c.beginPath();
        c.arc(sx(e.x), sy(e.y), (18 + Math.sin(e.spin * 2) * 4) * s, 0, TAU);
        c.stroke();
      } else {
        c.fillStyle = rgba(RUST, 0.7);
        c.fillRect(sx(e.x - 18), sy(e.y + 8), 36 * s, 10 * s);
      }
      drawHpBar(e);
      return;
    }

    if (e.kind === 'bomber' || e.kind === 'carrier') {
      c.fillStyle = rgba(INK, 0.95);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 22 * s, 10 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(flash ? WHT : RUST, 0.9);
      c.fillRect(sx(e.x - 26), sy(e.y - 3), 52 * s, 5 * s);
      c.fillStyle = rgba(STEEL, 0.6);
      c.fillRect(sx(e.x - 4), sy(e.y - 8), 8 * s, 6 * s);
      return;
    }

    if (e.kind === 'dive') {
      c.fillStyle = rgba(flash ? WHT : RUST, 0.95);
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y + 12));
      c.lineTo(sx(e.x + 8), sy(e.y - 10));
      c.lineTo(sx(e.x - 8), sy(e.y - 10));
      c.closePath();
      c.fill();
      return;
    }

    if (e.kind === 'elite') {
      c.fillStyle = rgba(flash ? WHT : INK, 0.96);
      pathWing(c, e.x, e.y, 20, 22);
      c.fill();
      c.fillStyle = rgba(STEEL, 0.9);
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y - 10));
      c.lineTo(sx(e.x + 6), sy(e.y + 4));
      c.lineTo(sx(e.x - 6), sy(e.y + 4));
      c.closePath();
      c.fill();
      return;
    }

    c.fillStyle = rgba(flash ? WHT : RUST, 0.95);
    pathWing(c, e.x, e.y, 13, 16);
    c.fill();
    c.strokeStyle = rgba(PALE, 0.45);
    c.lineWidth = 1;
    c.beginPath();
    const pr = 5 * s;
    c.ellipse(sx(e.x), sy(e.y - 6), pr, pr * 0.35, e.prop, 0, TAU);
    c.stroke();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(s.rgb || STEEL, 0.95);
      const w = (s.kind === 'opt' ? 2.2 : 2.8) * scale;
      const h = (s.kind === 'opt' ? 8 : 11) * scale;
      ctx.fillRect(sx(s.x) - w * 0.5, sy(s.y) - h, w, h);
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(sx(s.x) - w * 0.25, sy(s.y) - h, w * 0.5, 4 * scale);
    }
  }

  function drawBullets() {
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const rgb = b.sui ? MAG : RUST;
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), (b.r || 3.2) * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.beginPath();
      ctx.arc(sx(b.x - 0.6), sy(b.y - 0.6), (b.r || 3.2) * 0.35 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 8) * 2;
      if (p.kind === 'medal') {
        ctx.save();
        ctx.translate(sx(p.x), sy(p.y + bob));
        ctx.rotate(p.t * 2.4);
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = k * TAU / 6;
          const px = Math.cos(a) * 8 * scale;
          const py = Math.sin(a) * 8 * scale;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(RUST, 0.85);
        ctx.beginPath();
        ctx.arc(0, 0, 3.2 * scale, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'bomb') {
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y + bob), 8 * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#1a1408';
        ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('爆', sx(p.x), sy(p.y + bob + 0.5));
      } else {
        ctx.fillStyle = rgba(STEEL, 0.95);
        ctx.fillRect(sx(p.x - 8), sy(p.y - 8 + bob), 16 * scale, 16 * scale);
        ctx.fillStyle = '#061018';
        ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('翼', sx(p.x), sy(p.y + bob + 0.5));
      }
    }
  }

  function drawOption(o) {
    if (!o.on) return;
    ctx.fillStyle = rgba(INK, 0.95);
    pathWing(ctx, o.x, o.y, 8, 10);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.beginPath();
    ctx.arc(sx(o.x), sy(o.y), 2.2 * scale, 0, TAU);
    ctx.fill();
  }

  function drawShip() {
    if (G.mode === 'play' && G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    const x = G.ship.x;
    const y = G.ship.y;
    for (let i = 0; i < G.opts.length; i++) drawOption(G.opts[i]);

    ctx.fillStyle = rgba(CYN, 0.35 + Math.sin(G.t * 22) * 0.12);
    ctx.beginPath();
    ctx.moveTo(sx(x - 4), sy(y + 10));
    ctx.lineTo(sx(x), sy(y + 22 + (G.muzzle > 0 ? 4 : 0)));
    ctx.lineTo(sx(x + 4), sy(y + 10));
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(INK, 0.98);
    pathWing(ctx, x, y, 18, 22);
    ctx.fill();
    ctx.fillStyle = rgba(STEEL, 0.95);
    ctx.beginPath();
    ctx.moveTo(sx(x), sy(y - 14));
    ctx.lineTo(sx(x + 7), sy(y + 6));
    ctx.lineTo(sx(x - 7), sy(y + 6));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(sx(x - 3), sy(y - 6), 6 * scale, 8 * scale);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(sx(x), sy(y - 16), 5 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(STEEL, 0.45);
    ctx.fillRect(sx(x - 1.2), sy(y - 2), 2.4 * scale, 12 * scale);
  }

  function drawWingBomb() {
    if (G.wingT <= 0) return;
    const t = 1 - G.wingT / 0.62;
    const x = G.ship.x;
    const y = G.ship.y - 12;
    ctx.save();
    ctx.globalAlpha = 0.55 * (1 - t);
    ctx.fillStyle = rgba(STEEL, 0.8);
    pathWing(ctx, x, y, 40 + t * 180, 50 + t * 140);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life * 2.2, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      const r = (6 + s.t * 14) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x) - r, sy(s.y));
      ctx.lineTo(sx(s.x) + r, sy(s.y));
      ctx.moveTo(sx(s.x), sy(s.y) - r);
      ctx.lineTo(sx(s.x), sy(s.y) + r);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = (2.2 - r.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + r.t * 42) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = (f.gold ? 'bold ' : '') + ((f.gold ? 14 : 11) * scale) + 'px sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb || STEEL, G.flash * 0.35);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.bombFlash > 0) {
      ctx.fillStyle = rgba(WHT, G.bombFlash * 0.28);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.mode === 'play' && G.rank > 0.45) {
      const a = (G.rank - 0.45) * 0.28;
      const vg = ctx.createRadialGradient(sx(VW * 0.5), sy(VH * 0.55), VW * 0.2 * scale, sx(VW * 0.5), sy(VH * 0.5), VW * 0.72 * scale);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, rgba(MAG, a));
      ctx.fillStyle = vg;
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawLetterbox() {
    ctx.fillStyle = '#060c18';
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H);
    }
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#060c18';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
    }
    drawPows();
    drawShots();
    drawBullets();
    drawWingBomb();
    drawShip();
    drawFx();
    drawFlash();
    ctx.restore();
    drawLetterbox();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const r = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pointerWorldX(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    return (x - ox) / scale;
  }
  function pointerWorldY(e) {
    const r = canvas.getBoundingClientRect();
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return (y - oy) / scale;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('wing');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isBomb = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const space = k === ' ' || k === 'Spacebar' || k === 'Space' || code === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (space) {
      keys.sht = down;
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (k === 'ArrowUp' || k === 'ArrowDown' || isBomb) {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R' || isBomb)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (isBomb) {
      tryBomb();
      return;
    }
    if (space) {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      return;
    }
    if (k === 'Enter') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      audio.ensure();
      startGame('wing');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('dense');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (e.button === 2) return;
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
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

  function bindBombBtn(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      audio.ensure();
      tryBomb();
    });
  }

  seedEmbers();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnWing) {
    btnWing.addEventListener('click', function () {
      audio.ensure();
      startGame('wing');
    });
  }
  if (btnDense) {
    btnDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'wing');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && G.kind === 'wing') startGame('dense');
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
  bindBombBtn(btnBomb);
  bindBombBtn(btnPad);

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
    }
  });

  requestAnimationFrame(frame);
})();
