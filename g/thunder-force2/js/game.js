'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.34;
  const HIT_R = 5.6;
  const BOMB_CAP = 6;
  const BOMB_START = 3;
  const CELL = 70;
  const MW = 1680;
  const MH = 1260;
  const BEST_KEY = 'playbox-thunder-force2-best';
  const MUTE_KEY = 'playbox-thunder-force2-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Q / E 切武器 · Shift / Z 崩弹 · R 重开 · M 静音';
  const LEAD = '横空混飞。星云俯冲打核，裂谷横贯，核城再俯冲打雷核。双射、回射、波刃、新星。崩弹清圈。撞机、中弹、擦地都掉命。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const TEAL = [46, 240, 196];
  const MINT = [92, 255, 216];
  const GOLD = [255, 227, 107];
  const MAG = [255, 61, 184];
  const WHT = [228, 255, 248];
  const PNK = [255, 154, 212];
  const LEAF = [78, 224, 138];
  const LAVA = [255, 122, 60];
  const HOT = [122, 255, 212];
  const DEEP = [4, 22, 20];
  const AMB = [255, 176, 64];

  const WEPS = [
    { name: '双射', cd: 0.088, dmg: 1 },
    { name: '回射', cd: 0.098, dmg: 1.12 },
    { name: '波刃', cd: 0.155, dmg: 1.32 },
    { name: '新星', cd: 0.20, dmg: 0.95 }
  ];

  const SCORE = {
    scout: 50,
    disk: 70,
    turret: 90,
    dart: 80,
    fort: 420,
    carrier: 180,
    elite: 220,
    boss: [2400, 4000, 7200],
    clear: 1500,
    all: 4000,
    core: 5200,
    bombMax: 380
  };

  const STAGES = [
    {
      name: '星云',
      boss: '星卫',
      view: 'over',
      theme: 'nebula',
      bossHp: 72,
      cores: [
        { x: 380, y: 300 },
        { x: 1300, y: 300 },
        { x: 380, y: 960 },
        { x: 1300, y: 960 }
      ]
    },
    {
      name: '裂谷',
      boss: '谷卫',
      view: 'side',
      theme: 'canyon',
      bossHp: 98,
      waves: [
        { t: 0.5, kind: 'v', n: 5 },
        { t: 2.0, kind: 'turret', n: 2 },
        { t: 3.6, kind: 'dart', n: 3 },
        { t: 5.4, kind: 'disk', n: 3 },
        { t: 7.6, kind: 'v', n: 6 },
        { t: 10.0, kind: 'carrier' },
        { t: 12.2, kind: 'elite' },
        { t: 14.8, kind: 'mix' },
        { t: 17.6, kind: 'v', n: 7 },
        { t: 20.2, kind: 'turret', n: 2 },
        { t: 23.0, kind: 'boss' }
      ]
    },
    {
      name: '核城',
      boss: '雷核',
      view: 'over',
      theme: 'core',
      bossHp: 138,
      cores: [
        { x: 420, y: 340 },
        { x: 1260, y: 340 },
        { x: 840, y: 980 }
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
  const btnForce = document.getElementById('btn-force');
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnWep = document.getElementById('btn-wep');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPadWep = document.getElementById('btn-pad-wep');
  const btnPadBomb = document.getElementById('btn-pad-bomb');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const viewLabel = document.getElementById('view-label');
  const wepLabel = document.getElementById('wep-label');
  const raidLabel = document.getElementById('raid-label');
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
  let wepTok = 0;
  let uid = 1;
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 96, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const trails = [];
  const wisps = [];

  const G = {
    mode: 'title',
    kind: 'force',
    t: 0,
    clock: 0,
    camX: 0,
    camY: 0,
    wx: 96,
    wy: VH * 0.5,
    px: 96,
    py: VH * 0.5,
    ang: 0,
    bank: 0,
    lives: LIVES,
    score: 0,
    best: { l: 0, r: 0 },
    combo: 0,
    comboT: 0,
    mult: 1,
    stage: 1,
    waveI: 0,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    drops: [],
    bombs: BOMB_START,
    coresLeft: 0,
    coresMax: 0,
    raidT: 0,
    view: 'over',
    wep: 0,
    fireCd: 0,
    fireHold: false,
    swapCd: 0,
    bombCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: TEAL,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    boss: false,
    winT: 0,
    engine: 0
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
  function hypot(ax, ay) {
    return Math.sqrt(ax * ax + ay * ay);
  }
  function rgba(rgb, a) {
    if (a == null || a >= 0.995) return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hash2(n) {
    const x = Math.sin(n * 127.1) * 43758.5453;
    return x - Math.floor(x);
  }
  function isDense() {
    return G.kind === 'core';
  }
  function isOver() {
    return G.view === 'over';
  }
  function stageDef() {
    return STAGES[clamp(G.stage, 1, 3) - 1];
  }
  function kindBest() {
    return isDense() ? G.best.r : G.best.l;
  }
  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function playing() {
    return G.mode === 'play' && G.deadT <= 0;
  }
  function nextId() {
    uid += 1;
    return uid;
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function vx(wx) {
    return wx - G.camX;
  }
  function vy(wy) {
    return wy - G.camY;
  }
  function wepRgb() {
    if (G.wep === 1) return MINT;
    if (G.wep === 2) return GOLD;
    if (G.wep === 3) return LAVA;
    return TEAL;
  }
  function fireScale() {
    return isDense() ? 0.92 : 1;
  }
  function enemyFire() {
    return isDense() ? 0.76 : 1;
  }
  function fireAng() {
    return isOver() ? G.ang : 0;
  }

  function groundY(wx) {
    const n = Math.sin(wx * 0.012) * 16 + Math.sin(wx * 0.031 + 1.1) * 10 + Math.sin(wx * 0.007 + 0.6) * 8;
    let g = VH - 22 + n * 0.85;
    if (G.boss) g = Math.max(g, VH - 40);
    if (wx < G.camX + 80) g = lerp(VH - 16, g, (wx - G.camX) / 80);
    return clamp(g, VH - 82, VH - 12);
  }

  function ridgeHAt(wx) {
    if (G.view !== 'side' || G.boss) return 0;
    const cell = Math.floor((wx + 30) / 220);
    const h = hash2(cell * 17 + 5);
    if (h < 0.62) return 0;
    return 36 + h * 70;
  }

  function ridgeHit(px, py) {
    if (G.view !== 'side' || G.boss) return false;
    const wx = G.camX + px;
    const cell = Math.floor((wx + 30) / 220);
    const cx = cell * 220 + 110;
    if (Math.abs(wx - cx) > 14) return false;
    const h = ridgeHAt(cx);
    return h > 0 && py < h + 8;
  }

  function cellSolid(cx, cy) {
    if (!isOver()) return false;
    const cols = Math.ceil(MW / CELL);
    const rows = Math.ceil(MH / CELL);
    if (cx <= 0 || cy <= 0 || cx >= cols - 1 || cy >= rows - 1) return true;
    const wx = cx * CELL + CELL * 0.5;
    const wy = cy * CELL + CELL * 0.5;
    if (hypot(wx - MW * 0.5, wy - MH * 0.5) < 170) return false;
    const cores = stageDef().cores || [];
    for (let i = 0; i < cores.length; i++) {
      if (hypot(wx - cores[i].x, wy - cores[i].y) < 96) return false;
    }
    return hash2(cx * 13.7 + cy * 29.1 + G.stage * 4.2) > 0.835;
  }

  function worldSolid(wx, wy) {
    if (!isOver()) return false;
    if (wx < 24 || wy < 24 || wx > MW - 24 || wy > MH - 24) return true;
    return cellSolid(Math.floor(wx / CELL), Math.floor(wy / CELL));
  }

  function onScreen(wx, wy, pad) {
    const p = pad == null ? 40 : pad;
    return wx > G.camX - p && wx < G.camX + VW + p && wy > G.camY - p && wy < G.camY + VH + p;
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
    shoot(w) {
      this.ensure();
      if (w === 1) {
        this.beep(700, 0.045, 'square', 0.028, 260);
        this.beep(340, 0.06, 'triangle', 0.018, 130);
      } else if (w === 2) {
        this.beep(230, 0.08, 'sawtooth', 0.036, 700);
        this.beep(460, 0.07, 'triangle', 0.02, 150);
      } else if (w === 3) {
        this.beep(310, 0.06, 'sawtooth', 0.034, 880);
        this.beep(620, 0.05, 'square', 0.026, 1240);
        this.noise(0.04, 0.022, 1200);
      } else {
        this.beep(900, 0.036, 'square', 0.028, 1700);
      }
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.62, combo * 0.04);
      this.noise(0.034, 0.03, 1400);
      this.beep(540 * lift, 0.068, 'square', 0.036, 900 * lift);
    },
    swap() {
      this.ensure();
      this.beep(392, 0.06, 'square', 0.04, 523);
      this.beep(659, 0.09, 'triangle', 0.036, 784);
    },
    bomb() {
      this.ensure();
      this.noise(0.22, 0.08, 160);
      this.beep(180, 0.26, 'sawtooth', 0.05, 48);
      this.beep(90, 0.36, 'sine', 0.036, 36);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.036, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.026, 1320);
    },
    pickup() {
      this.ensure();
      this.beep(415, 0.07, 'square', 0.04, 622);
      this.beep(622, 0.09, 'triangle', 0.036, 830);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.064, 260);
      this.beep(290, 0.22, 'sawtooth', 0.048, 66);
      this.beep(145, 0.34, 'sine', 0.04, 42);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.044, 784);
      this.beep(784, 0.12, 'triangle', 0.038, 1046);
    },
    boom() {
      this.ensure();
      this.noise(0.22, 0.078, 170);
      this.beep(170, 0.28, 'sawtooth', 0.052, 52);
      this.beep(86, 0.4, 'sine', 0.038, 38);
    },
    warn() {
      this.ensure();
      this.beep(220, 0.1, 'sawtooth', 0.04, 110);
      this.beep(330, 0.16, 'square', 0.036, 165);
    },
    start() {
      this.ensure();
      this.beep(311, 0.09, 'square', 0.038, 622);
      this.beep(622, 0.14, 'triangle', 0.033, 933);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.048, 784);
      this.beep(784, 0.16, 'triangle', 0.042, 1046);
      this.beep(1046, 0.28, 'sine', 0.038, 1568);
    },
    lose() {
      this.ensure();
      this.beep(208, 0.18, 'sawtooth', 0.038, 86);
      this.beep(130, 0.3, 'sine', 0.048, 46);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.045, 523);
      this.beep(523, 0.11, 'triangle', 0.04, 659);
      this.beep(784, 0.2, 'square', 0.045, 1046);
    }
  };

  function loadBest() {
    G.best = { l: 0, r: 0 };
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw && raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.best.l = Math.max(0, parseInt(o.l, 10) || 0);
        G.best.r = Math.max(0, parseInt(o.r, 10) || 0);
      } else {
        const n = parseInt(raw || '0', 10);
        G.best.l = isFinite(n) && n > 0 ? n : 0;
      }
    } catch (err) {
      G.best = { l: 0, r: 0 };
    }
    if (bestEl) bestEl.textContent = String(kindBest());
  }

  function saveBest() {
    const k = isDense() ? 'r' : 'l';
    if (G.score <= G.best[k]) return;
    G.best[k] = G.score;
    if (bestEl) bestEl.textContent = String(G.best[k]);
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(G.best));
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

  function toast(msg, warn, gold) {
    G.toastT = 1.35;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    while (pips.length > n && pips.length > LIVES) {
      const d = pips.pop();
      if (d && d.parentNode) d.parentNode.removeChild(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.mode === 'title' ? Math.max(G.best.l, G.best.r) : kindBest());
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '星云';
      else if (G.boss) stageLabel.textContent = stageDef().boss;
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + stageDef().name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '雷核' : '雷突';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isDense());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (viewLabel) {
      viewLabel.textContent = isOver() ? '俯冲' : '横贯';
      viewLabel.className = 'view' + (isOver() ? ' over' : ' side');
    }
    if (wepLabel) {
      wepLabel.textContent = WEPS[G.wep].name;
      wepLabel.className = 'wep w' + G.wep;
    }
    if (raidLabel) {
      if (isOver() && G.mode === 'play' && !G.boss) {
        raidLabel.hidden = false;
        raidLabel.textContent = '核 ' + G.coresLeft;
        raidLabel.classList.toggle('off', G.coresLeft <= 0);
      } else if (G.mode === 'title') {
        raidLabel.hidden = false;
        raidLabel.textContent = '核 4';
        raidLabel.classList.remove('off');
      } else {
        raidLabel.hidden = false;
        raidLabel.textContent = G.boss ? '卫' : '核 0';
        raidLabel.classList.toggle('off', !G.boss);
      }
    }
    if (bombLabel) {
      bombLabel.textContent = '崩 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
        comboEl.classList.toggle('hot', G.combo >= 6);
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格射击，Q/E 切武器，Shift 崩弹', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 雷核尽碎', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 撞机、中弹、擦地都掉命', 'warn');
    else if (isOver() && G.coresLeft > 0) setHint('打掉地面核 · 新星八向清圈', 'hot');
    else if (G.wep === 1) setHint('回射 · 打身后与绕后机', '');
    else if (G.wep === 2) setHint('波刃 · 宽波穿群', 'hot');
    else if (G.wep === 3) setHint(isOver() ? '新星 · 八向清圈' : '新星 · 五向扇面', 'hot');
    else setHint('空格连射 · Q/E 切双射、回射、波刃、新星 · Shift 崩弹', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TF02';
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
    const cls = mag >= 6 ? 'die' : mag >= 3.2 ? 'pow' : 'hit';
    stageEl.classList.remove('die', 'hit', 'pow');
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
    const count = REDUCE ? Math.ceil(n * 0.4) : n;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 280 : spec.g
      });
    }
    capArr(particles, REDUCE ? 120 : 280);
  }

  function burst(x, y, n, rgb, rad) {
    emit(n, {
      x: x, y: y, j: 6,
      vx0: -rad, vx1: rad, vy0: -rad, vy1: rad * 0.6,
      r0: 1.2, r1: 3.4, life: 0.42, rgb: rgb, g: 40
    });
    if (!REDUCE) {
      sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad * 0.45 });
      rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad * 0.35 });
      capArr(sparks, 36);
      capArr(rings, 28);
    }
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb || GOLD, t: 0, life: 0.72, size: 13 });
    capArr(floats, 18);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * MW,
        y: Math.random() * MH,
        z: 0.18 + Math.random() * 0.9,
        s: 0.5 + Math.random() * 1.6,
        tw: Math.random() * TAU
      });
    }
  }

  function pushEnt(e) {
    e.id = nextId();
    e.alive = true;
    e.flash = 0;
    e.ph = e.ph || 0;
    e.fireCd = e.fireCd == null ? rand(0.2, 0.8) : e.fireCd;
    G.ents.push(e);
  }

  function spawnScout(x, y, ph) {
    pushEnt({
      kind: 'scout', x: x, y: y, hp: 1, r: 10, score: SCORE.scout,
      vx: isOver() ? rand(-40, 40) : (isDense() ? -74 : -58),
      vy: isOver() ? rand(-40, 40) : 0,
      ph: ph || 0
    });
  }
  function spawnDisk(x, y) {
    pushEnt({
      kind: 'disk', x: x, y: y, hp: 3, r: 13, score: SCORE.disk,
      vx: isOver() ? rand(-30, 30) : (isDense() ? -46 : -36),
      vy: 0
    });
  }
  function spawnTurret(x, y) {
    pushEnt({
      kind: 'turret', x: x, y: y, hp: 4, r: 14, score: SCORE.turret,
      vx: 0, vy: 0
    });
  }
  function spawnDart(x, y) {
    pushEnt({
      kind: 'dart', x: x, y: y, hp: 2, r: 11, score: SCORE.dart,
      vx: isOver() ? 0 : (isDense() ? -240 : -210),
      vy: 0, ph: 0
    });
  }
  function spawnFort(x, y) {
    const hp = Math.round((isDense() ? 22 : 18) * (G.stage === 3 ? 1.15 : 1));
    pushEnt({
      kind: 'fort', x: x, y: y, hp: hp, max: hp, r: 22, score: SCORE.fort,
      vx: 0, vy: 0, core: true, fireCd: rand(0.4, 1.1)
    });
  }
  function spawnCarrier(x, y) {
    pushEnt({
      kind: 'carrier', x: x, y: y, hp: 8, r: 18, score: SCORE.carrier,
      vx: isOver() ? rand(-24, 24) : (isDense() ? -30 : -22),
      vy: isOver() ? rand(-24, 24) : 0,
      drop: 'bomb'
    });
  }
  function spawnElite(x, y) {
    pushEnt({
      kind: 'elite', x: x, y: y, hp: 10, r: 16, score: SCORE.elite,
      vx: isOver() ? rand(-28, 28) : (isDense() ? -32 : -24),
      vy: isOver() ? rand(-28, 28) : 0,
      drop: 'bomb'
    });
  }

  function spawnBoss() {
    const st = stageDef();
    const hp = Math.round(st.bossHp * (isDense() ? 1.26 : 1));
    const bx = isOver() ? MW * 0.5 : G.camX + VW + 80;
    const by = isOver() ? MH * 0.5 : VH * 0.5;
    pushEnt({
      kind: 'boss',
      x: bx,
      y: by,
      hp: hp,
      max: hp,
      r: G.stage === 3 ? 42 : 36,
      score: SCORE.boss[clamp(G.stage - 1, 0, 2)],
      vx: isOver() ? 0 : -46,
      vy: 0,
      ph: 0,
      fireCd: 0.6,
      drop: 'bomb',
      open: 1,
      name: st.boss
    });
    G.boss = true;
    toast(st.boss + (isOver() ? ' 现形' : ' 入轨'), true, false);
    audio.warn();
    hud();
  }

  function spawnWave(w) {
    const baseX = G.camX + VW + 36;
    const extra = isDense() && w.kind !== 'boss' && w.kind !== 'carrier' && w.kind !== 'elite' ? 2 : 0;
    const n = (w.n || 1) + extra;
    if (w.kind === 'v') {
      for (let i = 0; i < n; i++) {
        const k = i - (n - 1) * 0.5;
        spawnScout(baseX + Math.abs(k) * 18, VH * 0.46 + k * 36, i * 0.2);
      }
    } else if (w.kind === 'disk') {
      for (let i = 0; i < n; i++) {
        spawnDisk(baseX + i * 28, 80 + i * ((VH - 170) / Math.max(1, n - 1)));
      }
    } else if (w.kind === 'turret') {
      for (let i = 0; i < n; i++) {
        const gx = baseX + i * 54;
        spawnTurret(gx, groundY(gx) - 14);
      }
    } else if (w.kind === 'dart') {
      for (let i = 0; i < n; i++) spawnDart(baseX + i * 28, 70 + (i * 73) % (VH - 170));
    } else if (w.kind === 'carrier') {
      spawnCarrier(baseX + 20, VH * 0.5 + rand(-40, 40));
    } else if (w.kind === 'elite') {
      spawnElite(baseX + 16, VH * 0.42 + rand(-30, 30));
      if (isDense()) spawnElite(baseX + 50, VH * 0.62);
    } else if (w.kind === 'mix') {
      spawnCarrier(baseX, VH * 0.46);
      spawnDisk(baseX + 40, 80);
      spawnTurret(baseX + 50, groundY(baseX + 50) - 14);
      spawnScout(baseX + 70, VH * 0.5, 0);
      if (isDense()) spawnDart(baseX + 90, VH * 0.3);
    } else if (w.kind === 'boss') {
      spawnBoss();
    }
  }

  function maybeSpawn(dt) {
    if (G.view === 'side') {
      const waves = stageDef().waves || [];
      while (G.waveI < waves.length && G.clock >= waves[G.waveI].t) {
        spawnWave(waves[G.waveI]);
        G.waveI += 1;
      }
      return;
    }
    if (G.boss || G.mode !== 'play') return;
    G.raidT -= dt;
    if (G.raidT > 0) return;
    if (G.ents.length > (isDense() ? 26 : 20)) {
      G.raidT = 0.4;
      return;
    }
    G.raidT = (isDense() ? 1.45 : 2.05) + rand(0, 0.4);
    spawnRaidPack();
  }

  function spawnRaidPack() {
    const pad = 36;
    const edge = (Math.random() * 4) | 0;
    let x = G.camX + VW * 0.5;
    let y = G.camY + VH * 0.5;
    if (edge === 0) { x = G.camX - pad; y = G.camY + rand(40, VH - 40); }
    else if (edge === 1) { x = G.camX + VW + pad; y = G.camY + rand(40, VH - 40); }
    else if (edge === 2) { y = G.camY - pad; x = G.camX + rand(40, VW - 40); }
    else { y = G.camY + VH + pad; x = G.camX + rand(40, VW - 40); }
    x = clamp(x, 40, MW - 40);
    y = clamp(y, 40, MH - 40);
    const n = (isDense() ? 5 : 3) + (Math.random() < 0.35 ? 1 : 0);
    const roll = Math.random();
    if (roll < 0.12) {
      spawnElite(x, y);
      spawnScout(x + 24, y - 18, 0);
    } else if (roll < 0.28) {
      spawnCarrier(x, y);
    } else if (roll < 0.48) {
      for (let i = 0; i < Math.min(n, 4); i++) spawnDisk(x + (i - 1) * 22, y + (i % 2) * 18);
    } else if (roll < 0.66) {
      spawnDart(x, y);
      spawnDart(x + 18, y + 24);
      if (isDense()) spawnDart(x - 16, y - 20);
    } else {
      for (let i = 0; i < n; i++) {
        spawnScout(x + rand(-16, 16), y + rand(-16, 16), i * 0.2);
      }
    }
  }

  function setupOverhead() {
    G.view = 'over';
    G.camX = MW * 0.5 - VW * 0.5;
    G.camY = MH * 0.5 - VH * 0.5;
    G.wx = MW * 0.5;
    G.wy = MH * 0.5;
    G.ang = -Math.PI / 2;
    G.px = G.wx - G.camX;
    G.py = G.wy - G.camY;
    const cores = stageDef().cores || [];
    G.coresMax = cores.length;
    G.coresLeft = cores.length;
    for (let i = 0; i < cores.length; i++) spawnFort(cores[i].x, cores[i].y);
    const tN = isDense() ? 6 : 4;
    let placed = 0;
    let guard = 0;
    while (placed < tN && guard < 80) {
      guard += 1;
      const cx = 2 + ((Math.random() * (MW / CELL - 4)) | 0);
      const cy = 2 + ((Math.random() * (MH / CELL - 4)) | 0);
      if (!cellSolid(cx, cy)) continue;
      const x = cx * CELL + CELL * 0.5;
      const y = cy * CELL + CELL * 0.5;
      if (hypot(x - G.wx, y - G.wy) < 180) continue;
      spawnTurret(x, y);
      placed += 1;
    }
    G.raidT = 0.8;
  }

  function setupSide() {
    G.view = 'side';
    G.camX = 0;
    G.camY = 0;
    G.px = 96;
    G.py = VH * 0.5;
    G.wx = G.camX + G.px;
    G.wy = G.py;
    G.ang = 0;
    G.coresLeft = 0;
    G.coresMax = 0;
    G.waveI = 0;
    G.clock = 0;
  }

  function beginStage(n) {
    G.stage = n;
    G.clock = 0;
    G.waveI = 0;
    G.boss = false;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.drops.length = 0;
    G.winT = 0;
    const st = stageDef();
    if (st.view === 'over') setupOverhead();
    else setupSide();
    G.invuln = Math.max(G.invuln, 0.9);
    toast(st.name + (st.view === 'over' ? ' 俯冲' : ' 横贯'), false, true);
    hud();
  }

  function noteCombo() {
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
        const tok = comboTok;
        setTimeout(function () {
          if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
        }, 280);
      }
      floatText(G.px + 20, G.py - 18, G.combo + ' 链', GOLD);
    }
    hud();
  }

  function dropItem(x, y, kind) {
    G.drops.push({
      x: x, y: y,
      vx: isOver() ? rand(-18, 18) : -20,
      vy: rand(-18, 18),
      t: 0, life: 12, kind: kind || 'bomb'
    });
    capArr(G.drops, 8);
  }

  function collectDrop(d) {
    if (G.bombs < BOMB_CAP) {
      G.bombs += 1;
      toast('崩弹 +1', false, true);
      floatText(vx(d.x), vy(d.y) - 10, '崩', LAVA);
      audio.pickup();
    } else {
      const n = Math.round(SCORE.bombMax * G.mult);
      addScore(n);
      toast('MAX', false, true);
      floatText(vx(d.x), vy(d.y) - 10, '+' + n, GOLD);
      audio.up();
    }
    burst(vx(d.x), vy(d.y), 12, LAVA, 20);
    hitStop(0.05);
    kick(2.2);
    screenFlash(LAVA, 0.22);
    hud();
  }

  function popWepBadge() {
    if (!wepLabel) return;
    wepLabel.classList.remove('swap');
    void wepLabel.offsetWidth;
    wepLabel.classList.add('swap');
    wepTok += 1;
    const tok = wepTok;
    setTimeout(function () {
      if (tok === wepTok && wepLabel) wepLabel.classList.remove('swap');
    }, 280);
  }

  function swapWep(dir) {
    if (G.swapCd > 0) return;
    if (G.mode === 'title' || overlayOpen()) return;
    if (!playing()) return;
    const d = dir == null ? 1 : dir;
    G.wep = (G.wep + d + WEPS.length) % WEPS.length;
    G.swapCd = 0.16;
    audio.swap();
    toast(WEPS[G.wep].name, false, G.wep === 2 || G.wep === 3);
    hitStop(0.036);
    kick(1.6);
    screenFlash(wepRgb(), 0.2);
    popWepBadge();
    hud();
  }

  function pushShot(spec) {
    spec.hits = spec.hits || {};
    spec.life = spec.life == null ? 1.6 : spec.life;
    G.shots.push(spec);
    capArr(G.shots, 90);
  }

  function fireBullet(ang, kind, dmg, r, spd, pierce, oxp, oyp) {
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const px = -sa;
    const py = ca;
    const wx = G.wx + ca * 14 + px * (oxp || 0);
    const wy = G.wy + sa * 14 + py * (oyp || 0);
    pushShot({
      kind: kind,
      wx: wx,
      wy: wy,
      cx: wx,
      cy: wy,
      vx: ca * spd,
      vy: sa * spd,
      ang: ang,
      amp: 24,
      ph: 0,
      dmg: dmg,
      r: r,
      pierce: pierce || 0,
      spd: spd
    });
  }

  function fire() {
    if (!playing() || G.fireCd > 0) return;
    const w = WEPS[G.wep];
    G.fireCd = w.cd * fireScale();
    G.muzzle = 0.055;
    audio.shoot(G.wep);
    const a = fireAng();
    const rgb = wepRgb();
    if (G.wep === 0) {
      fireBullet(a, 'twin', w.dmg, 3.2, 640, 0, 0, -5);
      fireBullet(a, 'twin', w.dmg, 3.2, 640, 0, 0, 5);
    } else if (G.wep === 1) {
      fireBullet(a, 'back', w.dmg, 3.3, 620, 0, 0, 0);
      fireBullet(a + Math.PI, 'back', w.dmg, 3.3, 560, 0, 0, -6);
      fireBullet(a + Math.PI, 'back', w.dmg, 3.3, 560, 0, 0, 6);
    } else if (G.wep === 2) {
      fireBullet(a, 'wave', w.dmg, 13, 500, 1, 0, 0);
    } else if (isOver()) {
      for (let i = 0; i < 8; i++) {
        fireBullet(a + i * (TAU / 8), 'nova', w.dmg, 3.1, 520, 0, 0, 0);
      }
    } else {
      for (let i = -2; i <= 2; i++) {
        fireBullet(a + i * 0.22, 'nova', w.dmg, 3.1, 540, 0, 0, 0);
      }
    }
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    emit(3, {
      x: G.px + ca * 16, y: G.py + sa * 16, j: 3,
      vx0: ca * 40, vx1: ca * 120, vy0: sa * 40 - 20, vy1: sa * 120 + 20,
      r0: 1, r1: 2.2, life: 0.16, rgb: rgb, g: 0
    });
  }

  function useBomb() {
    if (G.mode === 'title' || overlayOpen()) return;
    if (!playing()) return;
    if (G.bombCd > 0) return;
    if (G.bombs <= 0) {
      toast('崩弹用尽', true, false);
      return;
    }
    G.bombs -= 1;
    G.bombCd = 0.48;
    G.invuln = Math.max(G.invuln, 0.42);
    audio.bomb();
    burst(G.px, G.py, 28, LAVA, 52);
    rings.push({ x: G.px, y: G.py, t: 0, rgb: LAVA, r: 28 });
    screenFlash(LAVA, 0.48);
    hitStop(0.078);
    kick(6.4);
    const rad = isOver() ? 132 : 148;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      if (hypot(G.eShots[i].x - G.wx, G.eShots[i].y - G.wy) < rad) G.eShots.splice(i, 1);
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (hypot(e.x - G.wx, e.y - G.wy) < rad + e.r) {
        hurtEnemy(e, e.kind === 'boss' ? 16 : 7, e.x, e.y);
      }
    }
    hud();
  }

  function enemyShot(x, y, vxv, vyv, r, fat) {
    G.eShots.push({
      x: x, y: y, vx: vxv, vy: vyv,
      r: r || 3.4, fat: !!fat, life: 3.2
    });
    capArr(G.eShots, 100);
  }

  function aimPlayer(ex, ey, spd) {
    const dx = G.wx - ex;
    const dy = G.wy - ey;
    const d = hypot(dx, dy) || 1;
    return { vx: dx / d * spd, vy: dy / d * spd };
  }

  function coreOpen(b) {
    return 0.5 + 0.5 * Math.sin(b.ph * 1.35);
  }

  function hurtEnemy(e, dmg, hx, hy) {
    if (!e.alive) return;
    let dealt = dmg;
    if (e.kind === 'boss' && G.stage === 3) {
      const open = coreOpen(e);
      e.open = open;
      if (open < 0.55) dealt = dmg * 0.35;
    }
    e.hp -= dealt;
    e.flash = 0.08;
    noteCombo();
    audio.hit(G.combo);
    emit(4, {
      x: vx(hx), y: vy(hy), j: 3,
      vx0: -50, vx1: 80, vy0: -60, vy1: 60,
      r0: 1, r1: 2.4, life: 0.22, rgb: e.kind === 'boss' ? GOLD : TEAL, g: 40
    });
    const stop = e.kind === 'boss' ? 0.055 : dmg >= 1.3 ? 0.048 : 0.038;
    hitStop(stop);
    kick(e.kind === 'boss' ? 2.6 : 1.5);
    if (e.hp <= 0) killEnemy(e);
  }

  function killEnemy(e) {
    e.alive = false;
    const sxv = vx(e.x);
    const syv = vy(e.y);
    const rgb = e.kind === 'boss' ? GOLD
      : e.kind === 'fort' ? GOLD
        : e.kind === 'elite' ? MINT
          : e.kind === 'disk' ? LEAF
            : e.kind === 'dart' ? LAVA
              : TEAL;
    burst(sxv, syv, e.kind === 'boss' ? 28 : e.kind === 'fort' ? 20 : 12, rgb, e.kind === 'boss' ? 46 : 22);
    floatText(sxv, syv - 8, String(Math.round(e.score * G.mult)), GOLD);
    addScore(Math.round(e.score * G.mult));
    if (e.kind === 'fort') {
      G.coresLeft = Math.max(0, G.coresLeft - 1);
      toast(G.coresLeft > 0 ? '核 ' + G.coresLeft : '核尽', false, true);
      hud();
      if (G.coresLeft <= 0 && !G.boss) {
        toast('核尽 · 卫现', true, false);
        spawnBoss();
      }
    }
    if (e.drop === 'bomb' || (e.kind !== 'scout' && e.kind !== 'fort' && Math.random() < (e.kind === 'carrier' ? 1 : 0.18))) {
      dropItem(e.x, e.y, 'bomb');
    }
    if (e.kind === 'boss') {
      audio.boom();
      screenFlash(GOLD, 0.55);
      hitStop(0.08);
      kick(7);
      afterBoss();
    }
  }

  function playerHit(why) {
    if (G.invuln > 0 || G.deadT > 0 || !playing()) return;
    G.why = why || '撞机';
    G.deadT = 0.92;
    G.fireHold = false;
    burst(G.px, G.py, 26, MAG, 38);
    screenFlash(MAG, 0.5);
    hitStop(0.072);
    kick(7.2);
    audio.death();
    G.eShots.length = 0;
    hud();
  }

  function finishDeath() {
    G.lives -= 1;
    syncPips();
    if (G.lives <= 0) {
      loseGame();
      return;
    }
    G.deadT = 0;
    if (isOver()) {
      G.wx = clamp(G.wx, 80, MW - 80);
      G.wy = clamp(G.wy, 80, MH - 80);
      if (worldSolid(G.wx, G.wy)) {
        G.wx = MW * 0.5;
        G.wy = MH * 0.5;
      }
    } else {
      G.px = 96;
      G.py = VH * 0.5;
      G.wx = G.camX + G.px;
      G.wy = G.py;
    }
    G.invuln = 1.45;
    toast('残机 ' + G.lives, true, false);
    hud();
  }

  function loseGame() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '崩弹没护住。R 立刻重开，或换模式。');
    hud();
  }

  function winGame() {
    G.mode = 'win';
    addScore(isDense() ? SCORE.core : SCORE.all);
    saveBest();
    audio.win();
    screenFlash(GOLD, 0.6);
    showOverlay(
      'win',
      isDense() ? '雷核通关' : '雷核尽碎',
      isDense() ? '密核打穿。雷核从核城散了。' : '三关打穿。俯冲、横贯，把雷核打穿。'
    );
    hud();
  }

  function afterBoss() {
    addScore(SCORE.clear);
    toast(stageDef().name + ' 肃清', false, true);
    audio.stage();
    G.boss = false;
    if (G.stage >= STAGES.length) {
      G.winT = 1.32;
      G.invuln = Math.max(G.invuln, 1.4);
    } else {
      G.invuln = Math.max(G.invuln, 0.9);
      beginStage(G.stage + 1);
    }
  }

  function updateDrops(dt) {
    for (let i = G.drops.length - 1; i >= 0; i--) {
      const d = G.drops[i];
      d.t += dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (!isOver()) {
        d.vy += 18 * dt;
        const gy = groundY(d.x) - 10;
        if (d.y > gy) {
          d.y = gy;
          d.vy *= -0.4;
        }
      } else {
        d.vy *= 0.98;
        d.vx *= 0.98;
      }
      if (d.t > d.life || !onScreen(d.x, d.y, 80)) {
        G.drops.splice(i, 1);
        continue;
      }
      if (playing() && hypot(d.x - G.wx, d.y - G.wy) < 22) {
        collectDrop(d);
        G.drops.splice(i, 1);
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const sh = G.shots[i];
      sh.life -= dt;
      if (sh.kind === 'wave') {
        sh.ph += dt * 11;
        sh.cx += sh.vx * dt;
        sh.cy += sh.vy * dt;
        const px = -Math.sin(sh.ang);
        const py = Math.cos(sh.ang);
        const wob = Math.sin(sh.ph) * sh.amp;
        sh.wx = sh.cx + px * wob;
        sh.wy = sh.cy + py * wob;
      } else {
        sh.wx += sh.vx * dt;
        sh.wy += (sh.vy || 0) * dt;
        if (sh.kind === 'nova' && !REDUCE) {
          trails.push({ x: vx(sh.wx), y: vy(sh.wy), t: 0.16, rgb: LAVA });
          capArr(trails, 48);
        }
      }
      if (sh.life <= 0 || !onScreen(sh.wx, sh.wy, 70)) {
        G.shots.splice(i, 1);
        continue;
      }
      let dead = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        const rr = e.r + sh.r;
        if (hypot(e.x - sh.wx, e.y - sh.wy) >= rr) continue;
        if (sh.hits[e.id]) continue;
        sh.hits[e.id] = 1;
        hurtEnemy(e, sh.dmg, sh.wx, sh.wy);
        if (!sh.pierce) {
          dead = true;
          break;
        }
        sh.pierce -= 1;
      }
      if (dead) G.shots.splice(i, 1);
    }
  }

  function updateEShots(dt) {
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const sh = G.eShots[i];
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      sh.life -= dt;
      if (sh.life <= 0 || !onScreen(sh.x, sh.y, 50)) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (!playing()) continue;
      if (G.invuln <= 0 && hypot(sh.x - G.wx, sh.y - G.wy) < sh.r + HIT_R) {
        G.eShots.splice(i, 1);
        playerHit('中弹');
      }
    }
  }

  function bossFire(e, dt) {
    const half = e.hp < e.max * 0.5;
    const gap = (half ? 0.4 : 0.68) * enemyFire();
    e.fireCd -= dt;
    if (e.fireCd > 0) return;
    e.fireCd = gap;
    const st = G.stage;
    if (st === 1) {
      const n = half ? 10 : 7;
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + e.ph;
        enemyShot(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, 3.5, false);
      }
      if (half) {
        const aim = aimPlayer(e.x, e.y, 190);
        enemyShot(e.x, e.y, aim.vx, aim.vy, 3.8, false);
      }
    } else if (st === 2) {
      const aim = aimPlayer(e.x, e.y, 200);
      enemyShot(e.x - 16, e.y, aim.vx, aim.vy, 3.8, false);
      enemyShot(e.x - 16, e.y - 16, aim.vx, aim.vy - 40, 3.5, false);
      enemyShot(e.x - 16, e.y + 16, aim.vx, aim.vy + 40, 3.5, false);
      if (half) enemyShot(e.x - 10, e.y, aim.vx * 0.7, aim.vy * 0.7, 7.2, true);
    } else {
      e.open = coreOpen(e);
      const ring = half ? 14 : 10;
      for (let i = 0; i < ring; i++) {
        const a = i / ring * TAU + e.ph * 0.6;
        enemyShot(e.x, e.y, Math.cos(a) * 128, Math.sin(a) * 128, 3.5, false);
      }
      if (half) {
        const aim = aimPlayer(e.x, e.y, 210);
        enemyShot(e.x, e.y, aim.vx, aim.vy, 7.4, true);
      }
    }
  }

  function steerOver(e, spd, dt) {
    const aim = aimPlayer(e.x, e.y, 1);
    e.vx = lerp(e.vx, aim.vx * spd, 0.04);
    e.vy = lerp(e.vy, aim.vy * spd, 0.04);
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    if (worldSolid(e.x, e.y) && e.kind !== 'turret' && e.kind !== 'fort') {
      e.x -= e.vx * dt;
      e.y -= e.vy * dt;
      e.vx *= -0.6;
      e.vy *= -0.6;
    }
  }

  function updateEnts(dt) {
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      e.flash = Math.max(0, e.flash - dt);
      e.ph += dt;
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.kind === 'boss') {
        if (isOver()) {
          const tx = MW * 0.5 + Math.cos(e.ph * 0.55) * 90;
          const ty = MH * 0.5 + Math.sin(e.ph * 0.7) * 70;
          e.x = lerp(e.x, tx, 0.04);
          e.y = lerp(e.y, ty, 0.04);
        } else {
          const tx = G.camX + VW - 128;
          if (e.x > tx) e.x += e.vx * dt;
          else e.x = tx;
          e.y = G.stage === 2
            ? lerp(e.y, clamp(G.wy, 70, VH - 90), 0.04)
            : VH * 0.5 + Math.sin(e.ph * 1.2) * 64;
          e.y = clamp(e.y, 60, groundY(e.x) - 40);
        }
        bossFire(e, dt);
      } else if (e.kind === 'fort') {
        e.fireCd -= dt;
        if (e.fireCd <= 0 && onScreen(e.x, e.y, 80)) {
          e.fireCd = (1.15 + rand(0, 0.4)) * enemyFire();
          const a = aimPlayer(e.x, e.y, 155);
          enemyShot(e.x, e.y, a.vx, a.vy, 3.6, false);
          if (isDense()) {
            enemyShot(e.x, e.y, a.vx * 0.85 - 20, a.vy * 0.85 + 20, 3.2, false);
          }
        }
      } else if (e.kind === 'scout') {
        if (isOver()) steerOver(e, isDense() ? 96 : 78, dt);
        else {
          e.x += e.vx * dt;
          e.y += Math.sin(e.ph * 3) * 18 * dt;
        }
        e.fireCd -= dt;
        if (e.fireCd <= 0 && onScreen(e.x, e.y, 20)) {
          e.fireCd = (1.4 + rand(0, 0.6)) * enemyFire();
          const a = aimPlayer(e.x, e.y, 160);
          enemyShot(e.x, e.y, a.vx, a.vy, 3.2, false);
        }
      } else if (e.kind === 'disk') {
        if (isOver()) {
          e.x += Math.cos(e.ph * 1.6) * 70 * dt + e.vx * dt * 0.2;
          e.y += Math.sin(e.ph * 1.6) * 70 * dt;
          steerOver(e, 40, dt * 0.35);
        } else {
          e.x += e.vx * dt;
          e.y += Math.sin(e.ph * 2.2) * 46 * dt;
        }
      } else if (e.kind === 'turret') {
        if (!isOver()) e.y = groundY(e.x) - 14;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && onScreen(e.x, e.y, 40)) {
          e.fireCd = (1.1 + rand(0, 0.3)) * enemyFire();
          const a = aimPlayer(e.x, e.y, 170);
          enemyShot(e.x, e.y - (isOver() ? 0 : 8), a.vx, a.vy, 3.4, false);
        }
      } else if (e.kind === 'dart') {
        if (isOver()) {
          if (!e.dash) {
            const a = aimPlayer(e.x, e.y, isDense() ? 260 : 220);
            e.vx = a.vx;
            e.vy = a.vy;
            e.dash = true;
          }
          e.x += e.vx * dt;
          e.y += e.vy * dt;
        } else {
          if (e.x > G.wx - 10 && !e.passed) {
            e.vx = isDense() ? -250 : -220;
          } else {
            e.passed = true;
            e.vx = lerp(e.vx, isDense() ? 90 : 70, 0.1);
            e.fireCd -= dt;
            if (e.fireCd <= 0) {
              e.fireCd = 0.55 * enemyFire();
              const a = aimPlayer(e.x, e.y, 150);
              enemyShot(e.x + 6, e.y, a.vx, a.vy, 3.3, false);
            }
          }
          e.x += e.vx * dt;
          e.y += Math.sin(e.ph * 2) * 10 * dt;
        }
      } else if (e.kind === 'carrier') {
        if (isOver()) steerOver(e, 42, dt);
        else {
          e.x += e.vx * dt;
          e.y += Math.sin(e.ph * 1.6) * 22 * dt;
        }
        e.fireCd -= dt;
        if (e.fireCd <= 0 && onScreen(e.x, e.y, 20)) {
          e.fireCd = 1.3 * enemyFire();
          const a = aimPlayer(e.x, e.y, 130);
          enemyShot(e.x, e.y, a.vx, a.vy, 3.4, false);
        }
      } else if (e.kind === 'elite') {
        if (isOver()) steerOver(e, 70, dt);
        else {
          e.x += e.vx * dt;
          e.y += Math.sin(e.ph * 1.8) * 28 * dt;
        }
        e.fireCd -= dt;
        if (e.fireCd <= 0 && onScreen(e.x, e.y, 20)) {
          e.fireCd = 0.85 * enemyFire();
          const a = aimPlayer(e.x, e.y, 180);
          enemyShot(e.x, e.y, a.vx, a.vy - 28, 3.4, false);
          enemyShot(e.x, e.y, a.vx, a.vy + 28, 3.4, false);
        }
      }
      if (!isOver() && e.kind !== 'turret' && e.kind !== 'boss' && e.kind !== 'fort') {
        e.y = clamp(e.y, 36, groundY(e.x) - 18);
      }
      if (e.kind !== 'boss' && e.kind !== 'fort' && e.kind !== 'turret') {
        if (!onScreen(e.x, e.y, 220)) {
          G.ents.splice(i, 1);
          continue;
        }
      }
      if (playing() && G.invuln <= 0 && hypot(e.x - G.wx, e.y - G.wy) < e.r + HIT_R) {
        playerHit('撞机');
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 0.18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.engine += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
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
      f.y -= 22 * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t -= dt;
      if (trails[i].t <= 0) trails.splice(i, 1);
    }
    for (let i = wisps.length - 1; i >= 0; i--) {
      const w = wisps[i];
      w.t += dt;
      w.x -= 40 * dt;
      if (w.t > w.life) wisps.splice(i, 1);
    }
  }

  function updatePlayer(dt) {
    const spd = isDense() ? 318 : 276;
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover) && !overlayOpen()) {
      const tx = G.camX + pointer.x;
      const ty = G.camY + pointer.y;
      dx = tx - G.wx;
      dy = ty - G.wy;
      G.wx = lerp(G.wx, tx, 0.22);
      G.wy = lerp(G.wy, ty, 0.22);
    } else {
      dx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
      dy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0);
      if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
      }
      G.wx += dx * spd * dt;
      G.wy += dy * spd * dt;
    }
    if (isOver()) {
      if (dx || dy) G.ang = Math.atan2(dy, dx);
      G.wx = clamp(G.wx, CELL + 16, MW - CELL - 16);
      G.wy = clamp(G.wy, CELL + 16, MH - CELL - 16);
      if (worldSolid(G.wx, G.wy)) {
        if (G.invuln > 0) {
          G.wx = lerp(G.wx, MW * 0.5, 0.2);
          G.wy = lerp(G.wy, MH * 0.5, 0.2);
        } else playerHit('撞垒');
      }
      const follow = 0.14;
      G.camX = lerp(G.camX, G.wx - VW * 0.5, follow);
      G.camY = lerp(G.camY, G.wy - VH * 0.5, follow);
      G.camX = clamp(G.camX, 0, MW - VW);
      G.camY = clamp(G.camY, 0, MH - VH);
      G.px = G.wx - G.camX;
      G.py = G.wy - G.camY;
    } else {
      G.ang = 0;
      G.px = G.wx - G.camX;
      G.py = G.wy;
      G.px = clamp(G.px, 28, 720);
      G.py = clamp(G.py, 22, VH - 10);
      G.wx = G.camX + G.px;
      G.wy = G.py;
      const gy = groundY(G.wx);
      if (G.invuln > 0) {
        if (G.py > gy - 12) G.py = gy - 12;
        if (ridgeHit(G.px, G.py)) G.py = Math.max(G.py, ridgeHAt(G.wx) + 12);
        G.wy = G.py;
      } else {
        if (G.py > gy - 8) playerHit('撞地');
        else if (ridgeHit(G.px, G.py)) playerHit('擦脊');
      }
    }
    G.bank = lerp(G.bank, clamp(((keys.r ? 1 : 0) - (keys.l ? 1 : 0)) * 0.4, -1, 1), 0.12);
    if (!REDUCE && playing()) {
      wisps.push({
        x: G.px - Math.cos(fireAng()) * 12,
        y: G.py - Math.sin(fireAng()) * 12 + rand(-2, 2),
        t: 0, life: 0.28, rgb: wepRgb()
      });
      capArr(wisps, 28);
    }
  }

  function update(dt) {
    G.t += dt;
    updateFx(dt);
    if (G.mode === 'title') {
      G.camX += 22 * dt;
      G.camY += 9 * dt;
      if (G.camX > 400) G.camX = 0;
      if (G.camY > 220) G.camY = 0;
      return;
    }
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.mode === 'lose') return;
    if (G.mode === 'win') return;

    G.fireCd = Math.max(0, G.fireCd - dt);
    G.swapCd = Math.max(0, G.swapCd - dt);
    G.bombCd = Math.max(0, G.bombCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateShots(dt);
      updateEnts(dt);
      updateEShots(dt);
      updateDrops(dt);
      if (G.deadT <= 0) finishDeath();
      return;
    }

    if (!isOver()) {
      let cruise = isDense() ? 162 : 108;
      if (G.boss) cruise = isDense() ? 40 : 20;
      G.camX += cruise * dt;
      G.wx += cruise * dt;
    }
    G.clock += dt;

    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        hud();
      }
    }

    updatePlayer(dt);
    if (G.fireHold) fire();
    maybeSpawn(dt);
    updateEnts(dt);
    updateShots(dt);
    updateEShots(dt);
    updateDrops(dt);

    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) winGame();
    }
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      let x;
      let y;
      if (isOver()) {
        x = ((s.x - G.camX * s.z * 0.35) % VW + VW) % VW;
        y = ((s.y - G.camY * s.z * 0.35) % VH + VH) % VH;
      } else {
        x = ((s.x - G.camX * s.z * 0.18) % VW + VW) % VW;
        y = ((s.y) % VH + VH) % VH * 0.86 + 8;
      }
      const a = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(G.t * 2 + s.tw));
      c.fillStyle = rgba(WHT, a);
      c.fillRect(sx(x), sy(y), s.s * scale, s.s * scale);
    }
  }

  function drawOverMap() {
    const c = ctx;
    const theme = stageDef().theme;
    const col0 = Math.max(0, Math.floor(G.camX / CELL) - 1);
    const row0 = Math.max(0, Math.floor(G.camY / CELL) - 1);
    const col1 = Math.min(Math.ceil(MW / CELL), col0 + Math.ceil(VW / CELL) + 3);
    const row1 = Math.min(Math.ceil(MH / CELL), row0 + Math.ceil(VH / CELL) + 3);
    for (let cy = row0; cy < row1; cy++) {
      for (let cx = col0; cx < col1; cx++) {
        const x = vx(cx * CELL);
        const y = vy(cy * CELL);
        const pulse = 0.04 + 0.03 * Math.sin(G.t * 1.4 + cx * 0.3 + cy * 0.2);
        c.fillStyle = theme === 'core'
          ? 'rgba(8, 28, 32, ' + (0.55 + pulse) + ')'
          : 'rgba(6, 32, 28, ' + (0.45 + pulse) + ')';
        c.fillRect(sx(x + 1), sy(y + 1), (CELL - 2) * scale, (CELL - 2) * scale);
        if (cellSolid(cx, cy)) {
          c.fillStyle = theme === 'core' ? 'rgba(18, 52, 58, 0.95)' : 'rgba(12, 48, 42, 0.95)';
          c.fillRect(sx(x + 6), sy(y + 6), (CELL - 12) * scale, (CELL - 12) * scale);
          c.strokeStyle = rgba(theme === 'core' ? MINT : TEAL, 0.45);
          c.lineWidth = Math.max(1, 1.2 * scale);
          c.strokeRect(sx(x + 6), sy(y + 6), (CELL - 12) * scale, (CELL - 12) * scale);
          c.fillStyle = rgba(GOLD, 0.18 + 0.1 * Math.sin(G.t * 4 + cx));
          c.fillRect(sx(x + CELL * 0.5 - 4), sy(y + 8), 8 * scale, 5 * scale);
        }
      }
    }
  }

  function drawGround() {
    if (isOver()) {
      drawOverMap();
      return;
    }
    const c = ctx;
    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += 8) {
      c.lineTo(sx(x), sy(groundY(G.camX + x)));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    c.fillStyle = '#061510';
    c.fill();
    c.beginPath();
    c.moveTo(sx(0), sy(groundY(G.camX)));
    for (let x = 0; x <= VW; x += 8) {
      c.lineTo(sx(x), sy(groundY(G.camX + x)));
    }
    c.strokeStyle = rgba(TEAL, 0.5);
    c.lineWidth = Math.max(1, 1.6 * scale);
    c.stroke();
    for (let k = 0; k < 12; k++) {
      const cell = Math.floor(G.camX / 64) + k;
      const wx = cell * 64 + hash2(cell) * 18;
      const x = vx(wx);
      if (x < -20 || x > VW + 20) continue;
      const g = groundY(wx);
      const h = 14 + hash2(cell + 3) * 28;
      c.fillStyle = rgba(LEAF, 0.28 + hash2(cell + 1) * 0.22);
      c.beginPath();
      c.moveTo(sx(x), sy(g));
      c.lineTo(sx(x - 8), sy(g - h));
      c.lineTo(sx(x + 8), sy(g - h * 0.65));
      c.closePath();
      c.fill();
    }
    if (!G.boss) {
      const cell0 = Math.floor((G.camX + 30) / 220) - 1;
      for (let k = 0; k < 6; k++) {
        const cell = cell0 + k;
        const wx = cell * 220 + 110;
        const h = ridgeHAt(wx);
        if (h <= 0) continue;
        const x = vx(wx);
        c.fillStyle = rgba(TEAL, 0.2);
        c.fillRect(sx(x - 9), sy(0), 18 * scale, h * scale);
        c.strokeStyle = rgba(MINT, 0.5);
        c.lineWidth = Math.max(1, 1.3 * scale);
        c.strokeRect(sx(x - 9), sy(0), 18 * scale, h * scale);
        c.fillStyle = rgba(GOLD, 0.7);
        c.fillRect(sx(x - 9), sy(h - 4), 18 * scale, 4 * scale);
      }
    }
  }

  function drawShip(px, py, a) {
    const c = ctx;
    const s = scale;
    c.save();
    c.globalAlpha = a;
    c.translate(sx(px), sy(py));
    c.rotate(isOver() ? G.ang : G.bank * 0.18);
    if (G.muzzle > 0) {
      c.fillStyle = rgba(wepRgb(), G.muzzle * 8);
      c.beginPath();
      c.ellipse(16 * s, 0, 10 * s, 3 * s, 0, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(TEAL, 0.95);
    c.beginPath();
    c.moveTo(16 * s, 0);
    c.lineTo(-8 * s, -8 * s);
    c.lineTo(-12 * s, 0);
    c.lineTo(-8 * s, 8 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.fillRect(-4 * s, -3 * s, 12 * s, 6 * s);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(-1 * s, -1.6 * s, 8 * s, 3.2 * s);
    c.fillStyle = rgba(GOLD, 0.9);
    c.beginPath();
    c.moveTo(-7 * s, -7 * s);
    c.lineTo(-1 * s, -3 * s);
    c.lineTo(-7 * s, -2 * s);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-7 * s, 7 * s);
    c.lineTo(-1 * s, 3 * s);
    c.lineTo(-7 * s, 2 * s);
    c.closePath();
    c.fill();
    const pulse = 0.5 + 0.5 * Math.sin(G.t * 18);
    c.fillStyle = rgba(TEAL, 0.45 + pulse * 0.4);
    c.beginPath();
    c.ellipse(-12 * s, 0, (5 + pulse * 2) * s, 1.6 * s, 0, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawScout(e) {
    const c = ctx;
    const s = scale;
    const x = sx(vx(e.x));
    const y = sy(vy(e.y));
    c.save();
    c.translate(x, y);
    c.fillStyle = rgba(e.flash > 0 ? WHT : TEAL, 0.95);
    c.beginPath();
    c.moveTo(10 * s, 0);
    c.lineTo(-6 * s, -6 * s);
    c.lineTo(-4 * s, 0);
    c.lineTo(-6 * s, 6 * s);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawDisk(e) {
    const c = ctx;
    const s = scale;
    const x = sx(vx(e.x));
    const y = sy(vy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : LEAF, 0.9);
    c.beginPath();
    c.ellipse(x, y, 12 * s, 7 * s, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.85);
    c.beginPath();
    c.ellipse(x, y, 4 * s, 3 * s, 0, 0, TAU);
    c.fill();
  }

  function drawTurret(e) {
    const c = ctx;
    const s = scale;
    const x = sx(vx(e.x));
    const y = sy(vy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : MINT, 0.9);
    c.fillRect(x - 8 * s, y - 8 * s, 16 * s, 16 * s);
    c.fillStyle = rgba(DEEP, 0.85);
    c.beginPath();
    c.arc(x, y, 3.4 * s, 0, TAU);
    c.fill();
  }

  function drawDart(e) {
    const c = ctx;
    const s = scale;
    const x = sx(vx(e.x));
    const y = sy(vy(e.y));
    c.save();
    c.translate(x, y);
    c.fillStyle = rgba(e.flash > 0 ? WHT : LAVA, 0.95);
    c.beginPath();
    c.moveTo(12 * s, 0);
    c.lineTo(-8 * s, -5 * s);
    c.lineTo(-5 * s, 0);
    c.lineTo(-8 * s, 5 * s);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawFort(e) {
    const c = ctx;
    const s = scale;
    const x = sx(vx(e.x));
    const y = sy(vy(e.y));
    const glow = 0.45 + 0.35 * Math.sin(G.t * 5 + e.ph);
    c.save();
    c.translate(x, y);
    c.rotate(e.ph * 0.15);
    c.fillStyle = rgba(GOLD, 0.18 + glow * 0.12);
    c.beginPath();
    c.arc(0, 0, 26 * s, 0, TAU);
    c.fill();
    c.fillStyle = rgba(e.flash > 0 ? WHT : TEAL, 0.95);
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU - Math.PI / 6;
      const px = Math.cos(a) * 18 * s;
      const py = Math.sin(a) * 18 * s;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.85 + glow * 0.15);
    c.beginPath();
    c.arc(0, 0, 6 * s, 0, TAU);
    c.fill();
    c.restore();
    if (e.max) {
      const ratio = clamp(e.hp / e.max, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(x - 16 * s, y + 22 * s, 32 * s, 3 * s);
      c.fillStyle = rgba(GOLD, 0.9);
      c.fillRect(x - 16 * s, y + 22 * s, 32 * s * ratio, 3 * s);
    }
  }

  function drawCarrier(e) {
    const c = ctx;
    const s = scale;
    const x = sx(vx(e.x));
    const y = sy(vy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : MINT, 0.92);
    c.fillRect(x - 16 * s, y - 8 * s, 32 * s, 16 * s);
    c.fillStyle = rgba(LAVA, 0.8);
    c.fillRect(x - 6 * s, y - 3 * s, 12 * s, 6 * s);
  }

  function drawElite(e) {
    const c = ctx;
    const s = scale;
    const x = sx(vx(e.x));
    const y = sy(vy(e.y));
    c.save();
    c.translate(x, y);
    c.rotate(e.ph * 0.8);
    c.fillStyle = rgba(e.flash > 0 ? WHT : MAG, 0.92);
    c.beginPath();
    c.moveTo(14 * s, 0);
    c.lineTo(0, 10 * s);
    c.lineTo(-12 * s, 0);
    c.lineTo(0, -10 * s);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawBoss(e) {
    const c = ctx;
    const s = scale;
    const x = sx(vx(e.x));
    const y = sy(vy(e.y));
    const open = G.stage === 3 ? coreOpen(e) : 1;
    c.save();
    c.translate(x, y);
    c.rotate(isOver() ? e.ph * 0.25 : 0);
    c.fillStyle = rgba(e.flash > 0 ? WHT : TEAL, 0.28);
    c.beginPath();
    c.arc(0, 0, 48 * s, 0, TAU);
    c.fill();
    const petals = G.stage === 3 ? 6 : 4;
    for (let i = 0; i < petals; i++) {
      const a = i / petals * TAU + e.ph * 0.2;
      c.save();
      c.rotate(a);
      c.fillStyle = rgba(e.flash > 0 ? WHT : (G.stage === 3 ? MINT : GOLD), 0.9);
      c.beginPath();
      c.moveTo(12 * s, 0);
      c.lineTo(34 * s, (-10 - open * 6) * s);
      c.lineTo(40 * s, 0);
      c.lineTo(34 * s, (10 + open * 6) * s);
      c.closePath();
      c.fill();
      c.restore();
    }
    c.fillStyle = rgba(GOLD, 0.55 + open * 0.4);
    c.beginPath();
    c.arc(0, 0, (10 + open * 6) * s, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.85);
    c.beginPath();
    c.arc(0, 0, 4 * s, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || !onScreen(e.x, e.y, 50)) continue;
      if (e.kind === 'scout') drawScout(e);
      else if (e.kind === 'disk') drawDisk(e);
      else if (e.kind === 'turret') drawTurret(e);
      else if (e.kind === 'dart') drawDart(e);
      else if (e.kind === 'fort') drawFort(e);
      else if (e.kind === 'carrier') drawCarrier(e);
      else if (e.kind === 'elite') drawElite(e);
      else if (e.kind === 'boss') drawBoss(e);
    }
  }

  function drawShots() {
    const c = ctx;
    const s = scale;
    for (let i = 0; i < G.shots.length; i++) {
      const sh = G.shots[i];
      const x = sx(vx(sh.wx));
      const y = sy(vy(sh.wy));
      if (sh.kind === 'wave') {
        c.save();
        c.translate(x, y);
        c.rotate(sh.ang);
        c.fillStyle = rgba(GOLD, 0.8);
        c.beginPath();
        c.ellipse(0, 0, 16 * s, 7 * s, 0, 0, TAU);
        c.fill();
        c.restore();
      } else if (sh.kind === 'nova') {
        c.fillStyle = rgba(LAVA, 0.95);
        c.beginPath();
        c.arc(x, y, 3.2 * s, 0, TAU);
        c.fill();
      } else if (sh.kind === 'back') {
        c.fillStyle = rgba(MINT, 0.95);
        c.fillRect(x - 5 * s, y - 1.6 * s, 10 * s, 3.2 * s);
      } else {
        c.fillStyle = rgba(TEAL, 0.95);
        c.fillRect(x - 6 * s, y - 1.5 * s, 12 * s, 3 * s);
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const sh = G.eShots[i];
      const x = sx(vx(sh.x));
      const y = sy(vy(sh.y));
      c.fillStyle = rgba(sh.fat ? MAG : PNK, 0.95);
      c.beginPath();
      c.arc(x, y, (sh.fat ? 7 : sh.r) * s, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < G.drops.length; i++) {
      const d = G.drops[i];
      const x = sx(vx(d.x));
      const y = sy(vy(d.y));
      const bounce = 1 + 0.12 * Math.sin(G.t * 10);
      c.fillStyle = rgba(LAVA, 0.9);
      c.beginPath();
      c.arc(x, y, 7 * s * bounce, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      c.fillRect(x - 1.4 * s, y - 4 * s, 2.8 * s, 8 * s);
    }
  }

  function drawBossBar() {
    let b = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].kind === 'boss' && G.ents[i].alive) {
        b = G.ents[i];
        break;
      }
    }
    if (!b) return;
    const c = ctx;
    const x = sx(VW * 0.5 - 140);
    const y = sy(14);
    const w = 280 * scale;
    const h = 8 * scale;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(x, y, w, h);
    const ratio = clamp(b.hp / b.max, 0, 1);
    c.fillStyle = rgba(ratio < 0.5 ? MAG : GOLD, 0.9);
    c.fillRect(x, y, w * ratio, h);
    c.strokeStyle = rgba(WHT, 0.45);
    c.lineWidth = Math.max(1, 1.1 * scale);
    c.strokeRect(x, y, w, h);
    c.fillStyle = rgba(GOLD, 0.9);
    c.font = (11 * scale) + 'px sans-serif';
    c.textAlign = 'center';
    c.fillText(b.name || stageDef().boss, sx(VW * 0.5), sy(12));
  }

  function drawFx() {
    const c = ctx;
    const s = scale;
    for (let i = 0; i < wisps.length; i++) {
      const w = wisps[i];
      c.fillStyle = rgba(w.rgb, 0.35 * (1 - w.t / w.life));
      c.beginPath();
      c.arc(sx(w.x), sy(w.y), 2.4 * s, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      c.fillStyle = rgba(t.rgb, 0.45 * (t.t / 0.16));
      c.beginPath();
      c.arc(sx(t.x), sy(t.y), 2 * s, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * s, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const k = sparks[i];
      const a = 1 - k.t / 0.28;
      c.strokeStyle = rgba(k.rgb, a);
      c.lineWidth = Math.max(1, 1.4 * s);
      c.beginPath();
      c.arc(sx(k.x), sy(k.y), (k.rad + k.t * 90) * s, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const k = rings[i];
      const a = 1 - k.t / 0.42;
      c.strokeStyle = rgba(k.rgb, a * 0.8);
      c.lineWidth = Math.max(1, 2 * s);
      c.beginPath();
      c.arc(sx(k.x), sy(k.y), (k.r + k.t * 140) * s, 0, TAU);
      c.stroke();
    }
    c.font = 'bold ' + (13 * scale) + 'px sans-serif';
    c.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      c.fillStyle = rgba(f.rgb, 1 - f.t / f.life);
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawSky() {
    const c = ctx;
    const theme = stageDef().theme;
    let top;
    let bot;
    if (theme === 'canyon') {
      top = '#071814';
      bot = '#0c241c';
    } else if (theme === 'core') {
      top = '#06141a';
      bot = '#0a2228';
    } else {
      top = '#041814';
      bot = '#08241e';
    }
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    const a = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0 ? 0.35 : 1;
    drawShip(G.px, G.py, a);
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#031210';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const mag = G.shake * 0.55;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }
    drawSky();
    drawStars();
    drawGround();
    drawEnts();
    drawShots();
    drawPlayer();
    drawFx();
    drawBossBar();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    ctx.restore();
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

  function resetRun(kind) {
    G.kind = kind || 'force';
    G.t = 0;
    G.clock = 0;
    G.camX = 0;
    G.camY = 0;
    G.wx = 96;
    G.wy = VH * 0.5;
    G.px = 96;
    G.py = VH * 0.5;
    G.ang = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stage = 1;
    G.waveI = 0;
    G.nextLife = LIFE_EVERY;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.drops.length = 0;
    G.bombs = BOMB_START;
    G.coresLeft = 0;
    G.wep = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.swapCd = 0;
    G.bombCd = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.toastT = 0;
    G.why = '';
    G.boss = false;
    G.winT = 0;
    G.view = 'over';
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wisps.length = 0;
    trails.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    uid = 1;
  }

  function startGame(kind) {
    resetRun(kind || 'force');
    G.mode = 'play';
    hideOverlay();
    audio.start();
    beginStage(1);
    hud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('force');
    G.mode = 'title';
    G.view = 'over';
    showOverlay('title', '雷突', LEAD);
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('force');
    else startGame(G.kind || 'force');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('force');
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
    const bombKey = k === 'z' || k === 'Z' || k === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    const wepNext = k === 'e' || k === 'E';
    const wepPrev = k === 'q' || k === 'Q';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || bombKey || wepNext || wepPrev)) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || bombKey || wepNext || wepPrev)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (wepNext || wepPrev) {
      audio.ensure();
      swapWep(wepPrev ? -1 : 1);
      return;
    }
    if (bombKey) {
      audio.ensure();
      useBomb();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'core' : 'force');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
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
      if (e.button === 2) {
        e.preventDefault();
        swapWep(1);
        return;
      }
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
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

  if (btnForce) {
    btnForce.addEventListener('click', function () {
      audio.ensure();
      startGame('force');
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
      startGame(G.kind || 'force');
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
  function bindSwap(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      swapWep(1);
    });
  }
  function bindBomb(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      useBomb();
    });
  }
  bindSwap(btnWep);
  bindSwap(btnPadWep);
  bindBomb(btnBomb);
  bindBomb(btnPadBomb);

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    G.fireHold = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = keys.u = keys.d = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
