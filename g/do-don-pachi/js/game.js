'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.18;
  const LASER_DELAY = 0.16;
  const HIT_R = 4.5;
  const SHOT_V = 760;
  const BOMB_T = 0.62;
  const BOMB_R0 = 28;
  const BOMB_R1 = 210;
  const BOMBS_START = 3;
  const BOMBS_CAP = 6;
  const HIVE_NEED = 13;
  const BEST_KEY = 'playbox-do-don-pachi-best';
  const MUTE_KEY = 'playbox-do-don-pachi-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击（按住锁束）· Shift / Z 蜂爆 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const AMB = [255, 154, 26];
  const HON = [255, 200, 74];
  const FIRE = [255, 90, 20];
  const WHT = [255, 246, 232];
  const RED = [255, 86, 110];
  const DEEP = [28, 18, 8];

  const SCORE = {
    drone: 50,
    dive: 80,
    hornet: 140,
    comb: 160,
    elite: 260,
    pod: 300,
    hive: 9000,
    bee: 30,
    shred: 6,
    chip: 12,
    hit: 8,
    stage: 1600
  };

  const STAGES = [
    {
      name: '狂廊',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.0, kind: 'stream', dir: 1 },
        { t: 5.4, kind: 'v', n: 7 },
        { t: 7.8, kind: 'combs' },
        { t: 10.2, kind: 'dive', n: 4 },
        { t: 12.6, kind: 'hornet' },
        { t: 15.0, kind: 'v', n: 7 },
        { t: 17.4, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '蜂门',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.4, kind: 'dive', n: 5 },
        { t: 4.4, kind: 'stream', dir: -1 },
        { t: 6.6, kind: 'hornet' },
        { t: 8.2, kind: 'hornet' },
        { t: 10.0, kind: 'combs' },
        { t: 12.0, kind: 'elite' },
        { t: 14.2, kind: 'v', n: 9 },
        { t: 16.4, kind: 'dive', n: 6 },
        { t: 18.6, kind: 'stream', dir: 1 }
      ]
    },
    {
      name: '核巢',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.2, kind: 'dive', n: 5 },
        { t: 4.0, kind: 'elite' },
        { t: 6.0, kind: 'combs' },
        { t: 7.8, kind: 'hornet' },
        { t: 9.4, kind: 'v', n: 9 },
        { t: 13.2, kind: 'hive' }
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
  const btnMania = document.getElementById('btn-mania');
  const btnCore = document.getElementById('btn-core');
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
  const wpnLabel = document.getElementById('wpn-label');
  const hitLabel = document.getElementById('hit-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const bombsEl = document.getElementById('bombs');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const hiveBar = document.getElementById('hive-bar');
  const hiveWrap = document.getElementById('hive-wrap');

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
  let hitTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false, bmb: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const bombPips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];

  const G = {
    mode: 'title',
    kind: 'mania',
    t: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    hits: 0,
    comboT: 0,
    kills: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    enemies: [],
    shots: [],
    bullets: [],
    bees: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    holdT: 0,
    laser: false,
    laserBuzz: 0,
    lock: null,
    lockFlash: 0,
    fireCd: 0,
    bombs: BOMBS_START,
    bombT: 0,
    bombR: 0,
    bombCd: 0,
    hive: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: AMB,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    laserHitY: 0
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
  function dens() {
    return isCore() ? 1.32 : 1;
  }
  function shipSpeed() {
    const base = isCore() ? 322 : 280;
    return G.laser ? base * 0.68 : base;
  }
  function fireRate() {
    return isCore() ? 0.072 : 0.086;
  }
  function bulletSpd() {
    return isCore() ? 194 : 150;
  }
  function scrollSpd() {
    if (hasHive()) return 22;
    return isCore() ? 128 : 90;
  }
  function hpMul() {
    return isCore() ? 1.24 : 1;
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
      this.beep(920, 0.042, 'square', 0.028, 1760);
    },
    laserOn() {
      this.ensure();
      this.beep(160, 0.12, 'sawtooth', 0.05, 70);
      this.beep(780, 0.16, 'square', 0.04, 1620);
      this.beep(1560, 0.2, 'sine', 0.032, 2400);
      this.noise(0.12, 0.046, 480);
    },
    laserHum() {
      this.ensure();
      this.beep(130, 0.09, 'sawtooth', 0.022, 80);
      this.beep(1080, 0.055, 'triangle', 0.016, 1480);
    },
    lockOn() {
      this.ensure();
      this.beep(980, 0.07, 'triangle', 0.036, 1760);
      this.beep(1480, 0.09, 'sine', 0.024, 2200);
    },
    hit(hits) {
      this.ensure();
      const lift = 1 + Math.min(0.55, hits * 0.004);
      this.noise(0.03, 0.028, 1500);
      this.beep(620 * lift, 0.055, 'square', 0.036, 1040 * lift);
    },
    bee() {
      this.ensure();
      this.beep(880, 0.07, 'sine', 0.034, 1480);
      this.beep(1320, 0.09, 'triangle', 0.022, 1980);
    },
    shred() {
      this.ensure();
      this.beep(540, 0.06, 'triangle', 0.028, 1180);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 680 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1400);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(260, 0.14, 'sawtooth', 0.046, 66);
    },
    bomb() {
      this.ensure();
      this.noise(0.18, 0.07, 280);
      this.beep(140, 0.22, 'sawtooth', 0.055, 48);
      this.beep(420, 0.16, 'square', 0.04, 180);
      this.beep(980, 0.2, 'sine', 0.036, 1560);
    },
    empty() {
      this.ensure();
      this.beep(180, 0.1, 'square', 0.03, 90);
    },
    bossHit() {
      this.ensure();
      this.beep(220, 0.05, 'sawtooth', 0.036, 160);
      this.beep(640, 0.065, 'square', 0.028, 920);
    },
    hiveDie() {
      this.ensure();
      this.noise(0.24, 0.065, 240);
      this.beep(160, 0.3, 'sawtooth', 0.052, 46);
      this.beep(480, 0.22, 'triangle', 0.042, 200);
      this.beep(1100, 0.34, 'sine', 0.04, 1680);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 400);
      this.beep(300, 0.16, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.045, 46);
    },
    wave() {
      this.ensure();
      this.beep(370, 0.09, 'sine', 0.04, 494);
      this.beep(494, 0.11, 'sine', 0.04, 622);
      this.beep(740, 0.2, 'triangle', 0.045, 988);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(200, 0.18, 'sawtooth', 0.04, 80);
      this.beep(120, 0.3, 'sine', 0.05, 44);
    },
    win() {
      this.ensure();
      this.beep(494, 0.1, 'square', 0.045, 622);
      this.beep(622, 0.12, 'triangle', 0.04, 740);
      this.beep(880, 0.18, 'sine', 0.05, 1175);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
    },
    start() {
      this.ensure();
      this.beep(370, 0.09, 'square', 0.04, 740);
      this.beep(740, 0.14, 'triangle', 0.035, 1175);
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

  function hitMult() {
    return 1 + Math.min(5, Math.floor(G.hits / 40));
  }

  function bumpHit() {
    G.hits += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = hitMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.05);
      kick(3.1);
      floatText(G.ship.x, G.ship.y - 36, G.mult + ' 倍', HON, true);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    }
    if (G.hits === 50 || G.hits === 100 || G.hits === 200 || G.hits === 300 || G.hits === 500) {
      floatText(G.ship.x, G.ship.y - 52, G.hits + ' HIT', FIRE, true);
      hitStop(0.046);
      audio.combo(2);
      ring(G.ship.x, G.ship.y - 18, FIRE);
    }
    if (hitLabel) {
      hitLabel.classList.remove('hot');
      void hitLabel.offsetWidth;
      hitLabel.classList.add('hot');
    }
    hitTok += 1;
    syncHud();
  }

  function bumpKill() {
    G.kills += 1;
    G.comboT = COMBO_WIN;
    if (G.kills % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 28, G.kills + ' 链', AMB, true);
      hitStop(0.042);
    }
  }

  function breakCombo() {
    G.hits = 0;
    G.kills = 0;
    G.mult = 1;
    G.comboT = 0;
    if (comboEl) comboEl.hidden = true;
    if (hitLabel) hitLabel.hidden = true;
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

  function syncBombs() {
    if (!bombsEl) return;
    while (bombPips.length < BOMBS_CAP) {
      const d = document.createElement('span');
      d.className = 'bomb';
      bombsEl.appendChild(d);
      bombPips.push(d);
    }
    for (let i = 0; i < BOMBS_CAP; i++) {
      bombPips[i].classList.toggle('on', i < G.bombs);
      bombPips[i].style.display = i < Math.max(BOMBS_START, G.bombs) ? '' : 'none';
    }
    if (btnBomb) btnBomb.classList.toggle('hot', G.bombT > 0);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '蜂狂';
      else if (hasHive()) stageLabel.textContent = '大巢';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasHive()));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '蜂核' : '蜂狂';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isCore());
      tagLabel.classList.toggle('hot', G.hits >= 80 || G.laser);
    }
    if (wpnLabel) {
      wpnLabel.textContent = G.laser ? (G.lock ? '锁' : '束') : G.holdT > 0 ? '散' : '点';
      wpnLabel.classList.toggle('laser', G.laser);
    }
    if (hiveBar) {
      const p = clamp(G.hive / HIVE_NEED, 0, 1);
      hiveBar.style.transform = 'scaleX(' + p + ')';
    }
    if (hiveWrap) hiveWrap.classList.toggle('hot', G.hive >= HIVE_NEED - 2 || G.bombT > 0);
    if (hitLabel) {
      if (G.mode === 'play' && G.hits >= 2) {
        hitLabel.hidden = false;
        hitLabel.textContent = 'HIT ' + G.hits;
      } else {
        hitLabel.hidden = true;
      }
    }
    if (comboEl) {
      if (G.mode === 'play' && G.mult >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 点射扫群，按住锁束，蜂爆清核', 'warn');
    else if (G.mode === 'win') setHint('核巢已碎 · R 再来', 'hot');
    else if (G.laser) setHint(G.lock ? '锁束钉核 · 舰身变慢 · 命中不断链' : '锁束直上 · 对准机体锁住', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 蜂爆清核续命中', 'warn');
    else setHint('点射扫群 · 按住锁束 · Shift 蜂爆', '');
    syncPips();
    syncBombs();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DDON';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5.5 ? 'bomb' : mag >= 5 ? 'boss' : mag >= 3.5 ? 'laser' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('laser');
    stageEl.classList.remove('boss');
    stageEl.classList.remove('bomb');
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
    for (let i = 0; i < 64; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.16, 0.64),
        z: rand(0.35, 1.15)
      });
    }
  }

  function spawnBee(x, y) {
    G.bees.push({
      x: x,
      y: y,
      vx: rand(-50, 50),
      vy: rand(16, 64),
      t: 0,
      spin: rand(0, TAU)
    });
    capArr(G.bees, 36);
  }

  function collectBee(b) {
    const pts = Math.round(SCORE.bee * G.mult);
    addScore(pts);
    G.hive += 1;
    G.comboT = Math.max(G.comboT, 0.45);
    burst(b.x, b.y, HON, 8, 90);
    audio.bee();
    if (G.hive >= HIVE_NEED) {
      G.hive = 0;
      if (G.bombs < BOMBS_CAP) {
        G.bombs += 1;
        toast('蜂满 · 爆+1', false, true);
        audio.extra();
      } else {
        addScore(Math.round(800 * G.mult));
        toast('蜂满', false, true);
      }
      ring(G.ship.x, G.ship.y, HON);
      hitStop(0.04);
    }
    syncHud();
  }

  function shredBullets(x, y, rad) {
    let n = 0;
    const rr = rad * rad;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy < rr) {
        addScore(Math.round(SCORE.shred * G.mult));
        burst(b.x, b.y, AMB, 3, 60);
        G.bullets.splice(i, 1);
        n += 1;
      }
    }
    if (n > 0) audio.shred();
    return n;
  }

  function spawnEnemy(spec) {
    const special = spec.kind === 'hive' || spec.kind === 'pod';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (special ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'drone',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 94 * dens() : spec.vy,
      hp: special ? spec.hp : hp,
      maxHp: special ? spec.hp : hp,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 48 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.drone,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      laserTick: 0,
      bombTick: 0
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.4,
      life: 8,
      spin: rand(0, TAU)
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
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.2);
    }
  }

  function hexFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    const count = n || 6;
    for (let i = 0; i < count; i++) {
      const a = (rot || 0) + i * (TAU / count);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.5);
    }
  }

  function spawnDrone(x, y, vx, vy) {
    spawnEnemy({
      kind: 'drone',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 98 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.drone,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnDrone(c + k * 36, -26 - Math.abs(k) * 16, 0, 102 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isCore() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'drone',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 90 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.drone,
        fireCd: 0.7 + i * 0.12
      });
    }
  }

  function spawnDive(n) {
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'dive',
        x: 50 + Math.random() * (VW - 100),
        y: -30 - i * 18,
        vy: 42,
        hp: 2,
        r: 12,
        score: SCORE.dive,
        fireCd: 99
      });
    }
  }

  function spawnHornet(x) {
    spawnEnemy({
      kind: 'hornet',
      x: x == null ? (Math.random() < 0.5 ? 120 : 360) : x,
      y: -32,
      vy: 64 * dens(),
      hp: 6,
      r: 15,
      amp: 72,
      score: SCORE.hornet,
      fireCd: 0.42
    });
  }

  function spawnCombs() {
    const n = isCore() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'comb',
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18,
        vy: 46 * dens(),
        hp: 8,
        r: 14,
        score: SCORE.comb,
        fireCd: 0.52 + i * 0.1
      });
    }
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      x: 150,
      vy: 56 * dens(),
      hp: 12,
      r: 17,
      amp: 86,
      score: SCORE.elite,
      fireCd: 0.48
    });
    spawnEnemy({
      kind: 'elite',
      x: 330,
      vy: 56 * dens(),
      hp: 12,
      r: 17,
      amp: 86,
      phase: 1.6,
      score: SCORE.elite,
      fireCd: 0.68
    });
  }

  function spawnHive() {
    const core = isCore();
    const hive = spawnEnemy({
      kind: 'hive',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: core ? 136 : 108,
      r: 38,
      score: SCORE.hive,
      enter: 1.4,
      fireCd: 0.85
    });
    hive.maxHp = hive.hp;
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 + 76,
      y: 30,
      hp: core ? 18 : 14,
      r: 13,
      score: SCORE.pod,
      ang: 0,
      rad: 86,
      fireCd: 0.78
    });
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 - 76,
      y: 30,
      hp: core ? 18 : 14,
      r: 13,
      score: SCORE.pod,
      ang: Math.PI,
      rad: 86,
      fireCd: 1.02
    });
    toast('大巢', false, true);
    audio.wave();
    screenFlash(FIRE, 0.38);
    kick(4.8, 'boss');
    syncHud();
    return hive;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isCore() ? 2 : 0), w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n + (isCore() ? 1 : 0));
    else if (w.kind === 'hornet') {
      spawnHornet(140);
      spawnHornet(340);
      if (isCore()) spawnHornet(240);
    } else if (w.kind === 'combs') spawnCombs();
    else if (w.kind === 'elite') {
      spawnElite();
      if (isCore() && G.stage >= 2) {
        spawnEnemy({
          kind: 'elite',
          x: 240,
          vy: 50 * dens(),
          hp: 12,
          r: 17,
          amp: 70,
          phase: 0.8,
          score: SCORE.elite,
          fireCd: 0.58
        });
      }
    } else if (w.kind === 'hive') spawnHive();
  }

  function living() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) n += 1;
    return n;
  }

  function hasHive() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'hive') return true;
    }
    return false;
  }

  function findHive() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'hive') return G.enemies[i];
    }
    return null;
  }

  function findLock() {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.y > G.ship.y - 10) continue;
      const dx = Math.abs(e.x - G.ship.x);
      if (dx > 118) continue;
      const d = hypot(e.x - G.ship.x, e.y - G.ship.y) - e.r;
      const cone = dx + Math.max(0, (G.ship.y - e.y) * -0.02);
      const score = d + cone * 0.15;
      if (score < bestD) {
        bestD = score;
        best = e;
      }
    }
    return best;
  }

  function distToSeg(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    let t = ab2 > 0.0001 ? (apx * abx + apy * aby) / ab2 : 0;
    t = clamp(t, 0, 1);
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    return hypot(px - cx, py - cy);
  }

  function inLaser(x, y, r) {
    const hw = 13 + (r || 0);
    const ax = G.ship.x;
    const ay = G.ship.y - 12;
    if (G.lock && G.lock.alive) {
      return distToSeg(x, y, ax, ay, G.lock.x, G.lock.y) < hw;
    }
    return x > ax - hw && x < ax + hw && y < ay && y > -24;
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.055;
    const spread = 0.16;
    for (let i = -2; i <= 2; i++) {
      const a = -Math.PI * 0.5 + i * spread;
      G.shots.push({
        x: G.ship.x + i * 6,
        y: G.ship.y - 14,
        vx: Math.cos(a) * SHOT_V,
        vy: Math.sin(a) * SHOT_V,
        r: 3.2,
        dmg: i === 0 ? 1.15 : 1
      });
    }
    capArr(G.shots, 70);
    audio.shoot();
  }

  function engageLaser() {
    G.laser = true;
    audio.laserOn();
    hitStop(0.048);
    kick(3.8, 'laser');
    screenFlash(CYN, 0.36);
    ring(G.ship.x, G.ship.y - 12, CYN);
    burst(G.ship.x, G.ship.y - 16, FIRE, 16, 180);
    floatText(G.ship.x, G.ship.y - 30, '锁', CYN, true);
    if (wpnLabel) {
      wpnLabel.classList.remove('hot');
      void wpnLabel.offsetWidth;
      wpnLabel.classList.add('hot');
      wpnTok += 1;
    }
    syncHud();
  }

  function applyLaser(dt) {
    G.laserHitY = 0;
    const prev = G.lock;
    G.lock = findLock();
    if (G.lock && G.lock !== prev) {
      audio.lockOn();
      G.lockFlash = 0.16;
      spark(G.lock.x, G.lock.y, CYN);
    }
    const dps = 28;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (inLaser(e.x, e.y, e.r)) {
        damageEnemy(e, dps * dt, 'laser');
        G.laserHitY = Math.max(G.laserHitY, e.y);
        if (!REDUCE) spark(e.x + rand(-6, 6), Math.max(e.y, 8), HON);
        e.laserTick -= dt;
        if (e.laserTick <= 0) {
          e.laserTick = 0.09;
          bumpHit();
          addScore(Math.round(SCORE.hit * 0.75 * G.mult));
        }
      }
    }
    G.laserBuzz -= dt;
    if (G.laserBuzz <= 0) {
      G.laserBuzz = 0.1;
      audio.laserHum();
    }
  }

  function tryBomb() {
    if (G.mode !== 'play' || overlayOpen() || G.deadT > 0) return;
    if (G.bombT > 0 || G.bombCd > 0) return;
    if (G.bombs <= 0) {
      audio.empty();
      toast('蜂爆用尽', true, false);
      return;
    }
    G.bombs -= 1;
    G.bombT = BOMB_T;
    G.bombR = BOMB_R0;
    G.bombCd = 0.45;
    G.invuln = Math.max(G.invuln, 0.72);
    for (let i = 0; i < G.enemies.length; i++) G.enemies[i].bombTick = 0;
    audio.bomb();
    hitStop(0.068);
    kick(6.4, 'bomb');
    screenFlash(FIRE, 0.58);
    ring(G.ship.x, G.ship.y, FIRE);
    ring(G.ship.x, G.ship.y, HON);
    explode(G.ship.x, G.ship.y, FIRE, 32);
    floatText(G.ship.x, G.ship.y - 34, '爆', FIRE, true);
    syncHud();
  }

  function applyBomb(dt) {
    const u = 1 - G.bombT / BOMB_T;
    G.bombR = lerp(BOMB_R0, BOMB_R1, u);
    const r = G.bombR;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dx = e.x - G.ship.x;
      const dy = e.y - G.ship.y;
      if (dx * dx + dy * dy < (r + e.r) * (r + e.r)) {
        damageEnemy(e, 36 * dt, 'bomb');
        e.bombTick -= dt;
        if (e.bombTick <= 0) {
          e.bombTick = 0.1;
          bumpHit();
        }
        if (!REDUCE && Math.random() < 0.32) spark(e.x + rand(-6, 6), e.y, FIRE);
      }
    }
    shredBullets(G.ship.x, G.ship.y, r);
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (src === 'shot') {
      spark(e.x, e.y, AMB);
      hitStop(0.034);
      audio.hit(G.hits);
      kick(1.7);
      bumpHit();
      addScore(Math.round(SCORE.hit * G.mult));
    }
    if (e.kind === 'hive' && src === 'shot') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function dropBees(e) {
    let n = 0;
    if (e.kind === 'hornet' || e.kind === 'comb') n = 1;
    else if (e.kind === 'elite' || e.kind === 'pod') n = 2;
    else if (e.kind === 'hive') n = 8;
    for (let i = 0; i < n; i++) spawnBee(e.x + rand(-10, 10), e.y + rand(-8, 8));
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'hive' ? HON : e.kind === 'elite' || e.kind === 'hornet' ? FIRE : AMB;
    explode(e.x, e.y, rgb, e.kind === 'hive' ? 48 : e.kind === 'elite' ? 22 : 14);
    const pts = Math.round(e.score * G.mult);
    addScore(pts);
    bumpKill();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'hive');
    dropBees(e);
    if (e.kind === 'hive') {
      audio.hiveDie();
      hitStop(0.08);
      kick(8.4, 'boss');
      screenFlash(AMB, 0.74);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, HON);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      shredBullets(e.x, e.y, 520);
      G.winT = 1.4;
      G.invuln = Math.max(G.invuln, 1.5);
      toast('大巢碎裂', false, true);
    } else if (e.kind === 'elite' || e.kind === 'pod' || e.kind === 'hornet') {
      audio.explode();
      hitStop(0.05);
      kick(3.2);
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.laser = false;
    G.holdT = 0;
    G.lock = null;
    G.bombT = 0;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, FIRE, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.invuln = 1.5;
    G.deadT = 0;
    G.laser = false;
    G.holdT = 0;
    G.lock = null;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    G.laser = false;
    G.lock = null;
    audio.lose();
    showOverlay('lose', '舰毁了', '点射扫群，按住锁束，蜂爆清核。分数 ' + G.score + '。');
    setHint('R 重开 · 点射扫群，按住锁束，蜂爆清核', 'warn');
  }

  function goWin() {
    addScore(isCore() ? 10000 : 8000);
    G.mode = 'win';
    G.laser = false;
    G.lock = null;
    audio.win();
    showOverlay(
      'win',
      isCore() ? '蜂核通关' : '核巢尽碎',
      '三关打穿，大巢已碎。分数 ' + G.score + (isCore() ? ' · 蜂核' : ' · 蜂狂') + '。'
    );
    setHint('核巢已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.bees.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * G.mult));
    if (G.bombs < BOMBS_CAP) G.bombs += 1;
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    const st = STAGES[G.stage - 1];
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '核巢'), false, true);
    audio.wave();
    screenFlash(AMB, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'core' ? 'core' : 'mania';
    G.t = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.lives = LIVES;
    G.score = 0;
    G.hits = 0;
    G.kills = 0;
    G.comboT = 0;
    G.mult = 1;
    G.next1up = LIFE_EVERY;
    G.holdT = 0;
    G.laser = false;
    G.lock = null;
    G.laserBuzz = 0;
    G.fireCd = 0;
    G.bombs = BOMBS_START;
    G.bombT = 0;
    G.bombR = 0;
    G.bombCd = 0;
    G.hive = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.winT = 0;
    G.gapT = 0;
    G.scroll = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isCore() ? '蜂核' : '蜂狂', isCore(), !isCore());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'mania';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.hits = 0;
    G.kills = 0;
    G.mult = 1;
    G.laser = false;
    G.lock = null;
    G.holdT = 0;
    G.deadT = 0;
    G.bombs = BOMBS_START;
    G.hive = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    showOverlay('title', '蜂狂', '点射扫群，按住锁束，蜂爆清核。短关之后是大巢。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('mania');
    else startGame(G.kind || 'mania');
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
    if (G.lockFlash > 0) G.lockFlash -= dt;
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < embers.length; i++) {
      const s = embers[i];
      s.y += scr * 0.42 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
  }

  function updateShip(dt) {
    let ax = 0;
    let ay = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      ax = tx - G.ship.x;
      ay = ty - G.ship.y;
      const d = hypot(ax, ay);
      const max = shipSpeed() * dt * 1.8;
      if (d > max && d > 0.1) {
        ax = ax / d * max;
        ay = ay / d * max;
      }
      G.ship.x += ax;
      G.ship.y += ay;
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax || ay) {
        const inv = 1 / Math.max(1, hypot(ax, ay));
        const sp = shipSpeed();
        G.ship.x += ax * inv * sp * dt;
        G.ship.y += ay * inv * sp * dt;
      }
    }
    G.ship.x = clamp(G.ship.x, 22, VW - 22);
    G.ship.y = clamp(G.ship.y, 40, VH - 28);
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.bombCd > 0) G.bombCd -= dt;
    if (G.bombT > 0) {
      G.bombT -= dt;
      applyBomb(dt);
      if (G.bombT <= 0) G.bombT = 0;
    }
    if (wantFire()) {
      G.holdT += dt;
      if (!G.laser && G.holdT >= LASER_DELAY) engageLaser();
      if (G.laser) applyLaser(dt);
      else fireShot();
    } else {
      if (G.laser) {
        G.laser = false;
        G.lock = null;
        syncHud();
      }
      G.holdT = 0;
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -16 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = s.x - e.x;
        const dy = s.y - e.y;
        const rr = (s.r + e.r) * (s.r + e.r);
        if (dx * dx + dy * dy < rr) {
          damageEnemy(e, s.dmg, 'shot');
          burst(s.x, s.y, HON, 4, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      b.spin += dt * 6;
      if (b.life <= 0 || b.y > VH + 16 || b.y < -30 || b.x < -24 || b.x > VW + 24) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = b.x - G.ship.x;
        const dy = b.y - G.ship.y;
        const rr = (HIT_R + b.r * 0.55) * (HIT_R + b.r * 0.55);
        if (dx * dx + dy * dy < rr) {
          diePlayer();
          G.bullets.splice(i, 1);
        }
      }
    }
  }

  function updateBees(dt) {
    const magR = 96 + Math.min(40, G.hits * 0.2);
    for (let i = G.bees.length - 1; i >= 0; i--) {
      const b = G.bees[i];
      b.t += dt;
      b.spin += dt * 8;
      const dx = G.ship.x - b.x;
      const dy = G.ship.y - b.y;
      const d = hypot(dx, dy);
      if (G.deadT <= 0 && d < 18) {
        collectBee(b);
        G.bees.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && d < magR && d > 0.1) {
        const pull = 240 + G.hits * 1.4;
        b.vx += dx / d * pull * dt;
        b.vy += dy / d * pull * dt;
      }
      b.vy += 18 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= Math.exp(-dt * 1.4);
      if (b.y > VH + 20 || b.t > 8) G.bees.splice(i, 1);
    }
  }

  function fireInterval(e) {
    const sea = isCore() ? 0.72 : 1;
    if (e.kind === 'drone') return 1.15 * sea;
    if (e.kind === 'hornet') return 0.78 * sea;
    if (e.kind === 'comb') return 0.9 * sea;
    if (e.kind === 'elite') return 0.8 * sea;
    if (e.kind === 'pod') return 1.05 * sea;
    if (e.kind === 'hive') return 0.52 * sea;
    return 1.15 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'drone') {
      e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp * 0.35;
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20 && e.y < VH - 80) {
        aimedFire(e, 1, 0, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'dive') {
      if (e.t > 0.35) {
        const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
        e.vx = lerp(e.vx, Math.cos(a) * 216 * dens(), 1 - Math.exp(-dt * 3));
        e.vy = lerp(e.vy, Math.sin(a) * 246 * dens(), 1 - Math.exp(-dt * 3));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else if (e.kind === 'hornet') {
      e.x = e.baseX + Math.sin(e.t * 1.6 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 28) e.vy = 28;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.22, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'comb') {
      e.y += e.vy * dt;
      if (e.y > 70 && e.vy > 16) e.vy = 16;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        hexFire(e, 6, bulletSpd() * 0.78, e.t * 0.6);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'elite') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        hexFire(e, isCore() ? 8 : 6, bulletSpd() * 0.82, e.spin);
        e.spin += 0.4;
        if ((e.pattern++ % 2) === 0) aimedFire(e, 3, 0.16, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'pod') {
      const b = findHive();
      const cx = b ? b.x : VW * 0.5;
      const cy = b ? b.y : 110;
      e.ang += dt * 1.45;
      e.x = cx + Math.cos(e.ang) * e.rad;
      e.y = cy + Math.sin(e.ang) * e.rad * 0.55;
      if (G.mode === 'play' && e.fireCd <= 0) {
        aimedFire(e, 1, 0, bulletSpd() * 0.9);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'hive') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, 118, 1 - Math.exp(-dt * 3.2));
      } else {
        e.x = VW * 0.5 + Math.sin(e.t * 0.7) * 96;
        e.y = 118 + Math.sin(e.t * 1.1) * 10;
      }
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.5 : 2.6);
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      if (ratio > 0.66) {
        aimedFire(e, 3, 0.2, spd);
        if (Math.random() < 0.55) hexFire(e, 6, spd * 0.72, e.spin);
        e.fireCd = 1.05 * (isCore() ? 0.76 : 1);
      } else if (ratio > 0.33) {
        hexFire(e, 12, spd * 0.8, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 5, 0.16, spd);
        e.fireCd = 0.48 * (isCore() ? 0.76 : 1);
      } else {
        hexFire(e, 12, spd * 0.78, e.spin);
        hexFire(e, 8, spd * 0.56, -e.spin * 0.7);
        aimedFire(e, 5, 0.14, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnDrone(e.x - 40, e.y + 20, -30, 110);
          spawnDrone(e.x + 40, e.y + 20, 30, 110);
        }
        e.fireCd = 0.4 * (isCore() ? 0.76 : 1);
      }
    }
  }

  function updateEnemies(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) {
        G.enemies.splice(i, 1);
        continue;
      }
      thinkEnemy(e, dt);
      if (e.y > VH + 40 || e.x < -50 || e.x > VW + 50) {
        if (e.kind !== 'hive' && e.kind !== 'pod') {
          e.alive = false;
          G.enemies.splice(i, 1);
        }
        continue;
      }
      if (canHurt) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = (e.kind === 'hive' ? e.r * 0.62 : e.r * 0.7) + HIT_R;
        if (dx * dx + dy * dy < rr * rr) diePlayer();
      }
    }
  }

  function updateWaves(dt) {
    if (hasHive()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
    if (G.waveI >= st.waves.length && !hasHive() && living() === 0) {
      G.gapT += dt;
      if (G.gapT >= 1.55) {
        G.gapT = 0;
        if (G.stage < 3) nextStage();
      }
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
      updateBees(dt);
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
    if (G.winT > 0) {
      G.winT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateBees(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasHive()) G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateBees(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathHex(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (rot || 0) + i * (TAU / 6) - Math.PI / 2;
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0c0804';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(90), 10 * scale, sx(VW * 0.5), sy(VH * 0.4), 380 * scale);
    g.addColorStop(0, 'rgba(255,90,20,0.1)');
    g.addColorStop(1, 'rgba(12,8,4,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const size = 20;
    const h = size * 1.732;
    const yOff = (G.scroll * 0.42) % h;
    c.strokeStyle = 'rgba(255,154,26,0.075)';
    c.lineWidth = Math.max(0.6, 0.7 * scale);
    for (let row = -2; row < 28; row++) {
      for (let col = -1; col < 16; col++) {
        const x = 18 + col * size * 1.5;
        const y = row * h + ((col & 1) ? h * 0.5 : 0) - yOff;
        if (x < -10 || x > VW + 10) continue;
        pathHex(c, x, y, size * 0.52, 0);
        c.stroke();
      }
    }

    c.fillStyle = 'rgba(28,12,4,0.58)';
    c.fillRect(sx(0), sy(0), 36 * scale, VH * scale);
    c.fillRect(sx(VW - 36), sy(0), 36 * scale, VH * scale);
    const wallOff = (G.scroll * 0.7) % 32;
    for (let i = -1; i < 26; i++) {
      const y = i * 32 - wallOff;
      c.fillStyle = 'rgba(255,90,20,0.1)';
      pathHex(c, 18, y, 14, 0);
      c.fill();
      pathHex(c, VW - 18, y + 16, 14, 0);
      c.fill();
      c.strokeStyle = 'rgba(255,154,26,0.24)';
      c.lineWidth = Math.max(0.8, scale);
      pathHex(c, 18, y, 14, 0);
      c.stroke();
      pathHex(c, VW - 18, y + 16, 14, 0);
      c.stroke();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      c.fillStyle = rgba(i % 2 ? FIRE : AMB, p.a * 0.55);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    if (e.kind === 'comb') {
      c.fillStyle = rgba(DEEP, 0.92);
      pathHex(c, e.x, e.y, e.r + 2, 0);
      c.fill();
      c.strokeStyle = rgba(AMB, 0.9);
      c.lineWidth = Math.max(1, 1.3 * scale);
      pathHex(c, e.x, e.y, e.r + 2, 0);
      c.stroke();
      pathHex(c, e.x, e.y, 6, e.t);
      c.strokeStyle = rgba(HON, 0.85);
      c.lineWidth = Math.max(0.8, scale);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : FIRE, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 2), 3.8 * scale, 0, TAU);
      c.fill();
      return;
    }
    if (e.kind === 'hive') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(FIRE, 0.18);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 52 * scale, 38 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(DEEP, 0.95);
      pathHex(c, e.x, e.y, e.r + 5, 0);
      c.fill();
      c.strokeStyle = rgba(AMB, 0.96);
      c.lineWidth = Math.max(1.5, 1.9 * scale);
      pathHex(c, e.x, e.y, e.r + 5, 0);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : FIRE, 0.92);
      pathHex(c, e.x, e.y - 6, 18, 0);
      c.fill();
      c.fillStyle = rgba(HON, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 8), 8 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MAG, 0.88);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 20), 5.2 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(CYN, 0.55);
      c.lineWidth = Math.max(1, scale);
      c.beginPath();
      c.moveTo(sx(e.x - 22), sy(e.y - 8));
      c.lineTo(sx(e.x - 34), sy(e.y + 6));
      c.moveTo(sx(e.x + 22), sy(e.y - 8));
      c.lineTo(sx(e.x + 34), sy(e.y + 6));
      c.stroke();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 36), sy(e.y - e.r - 16), 72 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : ratio < 0.66 ? FIRE : AMB, 0.95);
      c.fillRect(sx(e.x - 36), sy(e.y - e.r - 16), 72 * ratio * scale, 5 * scale);
      return;
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(WHT, 0.14);
    c.beginPath();
    c.ellipse(sx(e.x - 10), sy(e.y - 2), 8 * scale, 4 * scale, -0.4, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(sx(e.x + 10), sy(e.y - 2), 8 * scale, 4 * scale, 0.4, 0, TAU);
    c.fill();
    c.restore();
    const rgb = flash ? WHT : (e.kind === 'hornet' || e.kind === 'elite' ? FIRE : AMB);
    c.fillStyle = rgba(rgb, 0.95);
    pathHex(c, e.x, e.y, e.r - (e.kind === 'elite' ? 0 : 1), e.kind === 'dive' ? e.t : 0);
    c.fill();
    c.strokeStyle = rgba(HON, 0.82);
    c.lineWidth = Math.max(0.8, scale);
    pathHex(c, e.x, e.y, e.r - (e.kind === 'elite' ? 0 : 1), e.kind === 'dive' ? e.t : 0);
    c.stroke();
    c.fillStyle = rgba(CYN, 0.85);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y + 1), (e.kind === 'elite' ? 4.2 : 2.8) * scale, 0, TAU);
    c.fill();
    if (e.kind === 'dive') {
      c.strokeStyle = rgba(FIRE, 0.7);
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y - 8));
      c.lineTo(sx(e.x), sy(e.y + 10));
      c.stroke();
    }
  }

  function drawLaser() {
    if (!G.laser || G.deadT > 0) return;
    const c = ctx;
    const ax = G.ship.x;
    const ay = G.ship.y - 12;
    let bx = ax;
    let by = -8;
    if (G.lock && G.lock.alive) {
      bx = G.lock.x;
      by = G.lock.y;
    }
    const w = 13 * scale;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(CYN, 0.22);
    c.lineWidth = w * 2.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(sx(ax), sy(ay));
    c.lineTo(sx(bx), sy(by));
    c.stroke();
    c.strokeStyle = rgba(FIRE, 0.55);
    c.lineWidth = w * 1.15;
    c.beginPath();
    c.moveTo(sx(ax), sy(ay));
    c.lineTo(sx(bx), sy(by));
    c.stroke();
    c.strokeStyle = rgba(HON, 0.95);
    c.lineWidth = w * 0.38;
    c.beginPath();
    c.moveTo(sx(ax), sy(ay));
    c.lineTo(sx(bx), sy(by));
    c.stroke();
    if (G.lock && G.lock.alive) {
      const pulse = 10 + Math.sin(G.t * 18) * 2 + (G.lockFlash > 0 ? 4 : 0);
      c.strokeStyle = rgba(CYN, 0.9);
      c.lineWidth = Math.max(1.2, 1.4 * scale);
      pathHex(c, G.lock.x, G.lock.y, pulse, G.t * 3);
      c.stroke();
      pathHex(c, G.lock.x, G.lock.y, pulse * 0.55, -G.t * 2);
      c.stroke();
    }
    c.restore();
  }

  function drawBomb() {
    if (G.bombT <= 0) return;
    const c = ctx;
    const u = 1 - G.bombT / BOMB_T;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(FIRE, 0.7 - u * 0.4);
    c.lineWidth = Math.max(2, (4 - u * 2) * scale);
    pathHex(c, G.ship.x, G.ship.y, G.bombR, G.t * 2);
    c.stroke();
    c.strokeStyle = rgba(HON, 0.5 - u * 0.3);
    c.lineWidth = Math.max(1, 1.6 * scale);
    pathHex(c, G.ship.x, G.ship.y, G.bombR * 0.72, -G.t);
    c.stroke();
    c.fillStyle = rgba(FIRE, 0.08);
    pathHex(c, G.ship.x, G.ship.y, G.bombR, 0);
    c.fill();
    c.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const c = ctx;
    const blink = G.invuln > 0 && ((G.invuln * 16) | 0) % 2 === 0;
    if (blink) c.globalAlpha = 0.42;
    const x = G.ship.x;
    const y = G.ship.y;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(CYN, G.laser ? 0.42 : 0.22);
    c.beginPath();
    c.ellipse(sx(x), sy(y + 14), 6 * scale, (G.laser ? 16 : 10) * scale, 0, 0, TAU);
    c.fill();
    c.restore();
    c.fillStyle = rgba(AMB, 0.95);
    c.beginPath();
    c.moveTo(sx(x), sy(y - 14));
    c.lineTo(sx(x + 9), sy(y + 10));
    c.lineTo(sx(x), sy(y + 6));
    c.lineTo(sx(x - 9), sy(y + 10));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(HON, 0.95);
    c.beginPath();
    c.moveTo(sx(x), sy(y - 10));
    c.lineTo(sx(x + 4.2), sy(y + 4));
    c.lineTo(sx(x - 4.2), sy(y + 4));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.5);
    c.beginPath();
    c.ellipse(sx(x - 11), sy(y + 1), 7 * scale, 3.2 * scale, -0.5, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(sx(x + 11), sy(y + 1), 7 * scale, 3.2 * scale, 0.5, 0, TAU);
    c.fill();
    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(HON, G.muzzle * 10);
      c.beginPath();
      c.arc(sx(x), sy(y - 16), 7 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
    c.fillStyle = rgba(FIRE, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y), HIT_R * 0.45 * scale, 0, TAU);
    c.fill();
    c.globalAlpha = 1;
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.fillStyle = rgba(HON, 0.95);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y), 2.2 * scale, 6.5 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.8);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y), 1.1 * scale, 3.2 * scale, 0, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawBullets() {
    const c = ctx;
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      c.fillStyle = rgba(FIRE, 0.92);
      pathHex(c, b.x, b.y, b.r + 0.6, b.spin);
      c.fill();
      c.fillStyle = rgba(WHT, 0.85);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), Math.max(1.1, b.r * 0.42) * scale, 0, TAU);
      c.fill();
    }
  }

  function drawBees() {
    const c = ctx;
    for (let i = 0; i < G.bees.length; i++) {
      const b = G.bees[i];
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(HON, 0.95);
      pathHex(c, b.x, b.y, 5.2, b.spin);
      c.fill();
      c.fillStyle = rgba(WHT, 0.45);
      c.beginPath();
      c.ellipse(sx(b.x - 4), sy(b.y), 3.4 * scale, 1.6 * scale, -0.4, 0, TAU);
      c.fill();
      c.beginPath();
      c.ellipse(sx(b.x + 4), sy(b.y), 3.4 * scale, 1.6 * scale, 0.4, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawFx() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life * 2.4, 0, 0.9));
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = Math.max(1, 1.4 * scale);
      const r = (6 + s.t * 10) * scale;
      c.beginPath();
      c.moveTo(sx(s.x) - r, sy(s.y));
      c.lineTo(sx(s.x) + r, sy(s.y));
      c.moveTo(sx(s.x), sy(s.y) - r);
      c.lineTo(sx(s.x), sy(s.y) + r);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      c.strokeStyle = rgba(r.rgb, 1 - r.t);
      c.lineWidth = Math.max(1, (2.4 - r.t * 1.6) * scale);
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (12 + r.t * 42) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.font = (f.gold ? 16 : 12) * scale + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawHitBanner() {
    if (G.mode !== 'play' || G.hits < 8) return;
    const c = ctx;
    c.save();
    c.font = '700 ' + (18 + Math.min(10, G.hits * 0.02)) * scale + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.textAlign = 'right';
    c.fillStyle = rgba(FIRE, 0.85);
    c.fillText(G.hits + ' HIT', sx(VW - 44), sy(64));
    if (G.mult >= 2) {
      c.font = '700 ' + 13 * scale + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.fillStyle = rgba(HON, 0.85);
      c.fillText('×' + G.mult, sx(VW - 44), sy(82));
    }
    c.restore();
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140c06';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m * 0.7);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = W * 0.5;
      const cy = H * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].kind === 'comb') drawEnemy(G.enemies[i]);
    }
    drawBees();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].kind !== 'comb') drawEnemy(G.enemies[i]);
    }
    drawLaser();
    drawShots();
    drawBomb();
    drawShip();
    drawBullets();
    drawFx();
    drawHitBanner();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    ctx.restore();
    ctx.fillStyle = '#140c06';
    ctx.fillRect(0, 0, W, oy);
    ctx.fillRect(0, oy + VH * scale, W, H);
    ctx.fillRect(0, 0, ox, H);
    ctx.fillRect(ox + VW * scale, 0, W, H);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorldX(e) {
    const r = canvas.getBoundingClientRect();
    return (e.clientX - r.left - ox) / scale;
  }
  function pointerWorldY(e) {
    const r = canvas.getBoundingClientRect();
    return (e.clientY - r.top - oy) / scale;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('mania');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind || 'mania');
  }

  function onKey(e, down) {
    const k = e.code || e.key;
    if (k === 'ArrowLeft' || k === 'KeyA') keys.l = down;
    else if (k === 'ArrowRight' || k === 'KeyD') keys.r = down;
    else if (k === 'ArrowUp' || k === 'KeyW') keys.u = down;
    else if (k === 'ArrowDown' || k === 'KeyS') keys.d = down;
    else if (k === 'Space') {
      keys.sht = down;
      if (down && overlayOpen() && G.mode === 'title') {
        e.preventDefault();
        primaryAction();
        return;
      }
      if (down && overlayOpen() && (G.mode === 'win' || G.mode === 'lose')) {
        e.preventDefault();
        return;
      }
    } else if (k === 'ShiftLeft' || k === 'ShiftRight' || k === 'KeyZ') {
      if (down && !keys.bmb) {
        audio.ensure();
        tryBomb();
      }
      keys.bmb = down;
    }
    if (down && (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight' || k === 'Space')) {
      e.preventDefault();
    }
    if (!down) return;
    if (k === 'KeyR') {
      e.preventDefault();
      restart();
      return;
    }
    if (k === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'Enter') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === 'Digit1' && G.mode === 'title') {
      audio.ensure();
      startGame('mania');
      return;
    }
    if (k === 'Digit2' && G.mode === 'title') {
      audio.ensure();
      startGame('core');
    }
    if (down) inputSrc = 'key';
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

  seedEmbers();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnMania) {
    btnMania.addEventListener('click', function () {
      audio.ensure();
      startGame('mania');
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
      startGame(G.kind || 'mania');
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
  function bombClick(e) {
    if (e) e.preventDefault();
    audio.ensure();
    tryBomb();
  }
  if (btnBomb) btnBomb.addEventListener('click', bombClick);
  if (btnPad) btnPad.addEventListener('click', bombClick);

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
      keys.bmb = false;
    }
  });

  requestAnimationFrame(frame);
})();
