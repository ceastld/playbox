'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 17000;
  const BOMB_CAP = 6;
  const POWER_MAX = 3;
  const SHIELD_MAX = 4;
  const SHIELD_RESPAWN = 2;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.5;
  const HIT_R = 4.5;
  const SHOT_V = 760;
  const BEST_KEY = 'playbox-gunnail-best';
  const MUTE_KEY = 'playbox-gunnail-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · Shift / Z 钢雨 · R 重开 · M 静音';
  const WPN_NAME = ['直钉', '散钉', '锁钉'];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 138];
  const STEEL = [142, 200, 224];
  const GOLD = [255, 212, 90];
  const VER = [255, 74, 20];
  const WHT = [255, 242, 230];
  const NAIL = [255, 232, 200];
  const DEEP = [26, 10, 6];
  const PNK = [255, 154, 190];

  const SCORE = {
    rivet: 50,
    dive: 80,
    turret: 140,
    elite: 260,
    carrier: 220,
    mid: 4000,
    boss: 9000,
    chip: 10,
    stage: 1600,
    pmax: 500
  };

  const STAGES = [
    {
      name: '钉廊',
      waves: [
        { t: 0.6, kind: 'v', n: 5 },
        { t: 3.0, kind: 'stream', dir: 1 },
        { t: 5.4, kind: 'v', n: 7 },
        { t: 7.8, kind: 'turrets' },
        { t: 9.2, kind: 'carrier' },
        { t: 10.6, kind: 'dive', n: 4 },
        { t: 12.4, kind: 'elite' },
        { t: 14.6, kind: 'mid' }
      ]
    },
    {
      name: '钢核',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.4, kind: 'dive', n: 5 },
        { t: 4.4, kind: 'stream', dir: -1 },
        { t: 6.4, kind: 'elite' },
        { t: 8.2, kind: 'turrets' },
        { t: 10.0, kind: 'carrier' },
        { t: 11.8, kind: 'v', n: 9 },
        { t: 14.0, kind: 'dive', n: 6 },
        { t: 16.0, kind: 'stream', dir: 1 },
        { t: 17.8, kind: 'elite' },
        { t: 19.6, kind: 'boss' }
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
  const btnNail = document.getElementById('btn-nail');
  const btnRain = document.getElementById('btn-rain');
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
  const jiaLabel = document.getElementById('jia-label');
  const jiaBar = document.getElementById('jia-bar');
  const jiaWrap = document.getElementById('jia-wrap');
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
  let jiaTok = 0;
  let wpnTok = 0;
  let dropCycle = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];

  const G = {
    mode: 'title',
    kind: 'nail',
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
    power: 0,
    wpn: 0,
    shields: SHIELD_MAX,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    rainT: 0,
    enemies: [],
    shots: [],
    bullets: [],
    pows: [],
    rain: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    optL: { x: VW * 0.5 - 24, y: VH - 68 },
    optR: { x: VW * 0.5 + 24, y: VH - 68 },
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
    platesT: 0
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
  function isRain() {
    return G.kind === 'rain';
  }
  function dens() {
    return isRain() ? 1.28 : 1;
  }
  function shipSpeed() {
    return isRain() ? 312 : 272;
  }
  function fireRate() {
    const base = isRain() ? 0.076 : 0.09;
    const naked = G.shields <= 0 ? 0.72 : 1;
    return base * (1 - G.power * 0.05) * naked;
  }
  function bulletSpd() {
    return isRain() ? 178 : 140;
  }
  function scrollSpd() {
    if (hasMid() || hasBoss()) return 22;
    return isRain() ? 118 : 84;
  }
  function hpMul() {
    return isRain() ? 1.22 : 1;
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function shieldMult() {
    return 1 + (SHIELD_MAX - G.shields) * 0.75;
  }
  function scoreMul() {
    return comboMult() * shieldMult();
  }
  function wpnName() {
    const n = WPN_NAME[G.wpn] || '直钉';
    return G.power >= POWER_MAX ? n + ' MAX' : n;
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
    shoot(p) {
      this.ensure();
      const lift = 1 + (p || 0) * 0.08;
      this.beep(1480 * lift, 0.028, 'square', 0.022, 380 * lift);
      this.noise(0.016, 0.016, 2200);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.028, 0.026, 1600);
      this.beep(720 * lift, 0.05, 'square', 0.032, 1100 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(480 * m, 0.08, 'sine', 0.038, 720 * m);
      this.beep(960, 0.12, 'triangle', 0.028, 1440);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 500);
      this.beep(280, 0.14, 'sawtooth', 0.045, 70);
    },
    plate() {
      this.ensure();
      this.noise(0.055, 0.045, 1700);
      this.beep(980, 0.08, 'square', 0.042, 220);
      this.beep(420, 0.14, 'sawtooth', 0.036, 90);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.055, 'sawtooth', 0.038, 180);
      this.beep(620, 0.07, 'square', 0.03, 880);
    },
    bossDie() {
      this.ensure();
      this.noise(0.22, 0.06, 280);
      this.beep(180, 0.28, 'sawtooth', 0.05, 50);
      this.beep(520, 0.2, 'triangle', 0.04, 220);
      this.beep(1040, 0.32, 'sine', 0.04, 1560);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 400);
      this.beep(320, 0.16, 'sawtooth', 0.05, 90);
      this.beep(180, 0.28, 'sine', 0.045, 50);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    power() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 990);
      this.beep(990, 0.12, 'triangle', 0.036, 1480);
      this.beep(1320, 0.16, 'sine', 0.03, 1760);
    },
    max() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
      this.beep(1175, 0.2, 'sine', 0.05, 1568);
    },
    bomb() {
      this.ensure();
      this.noise(0.2, 0.06, 240);
      this.beep(140, 0.24, 'sawtooth', 0.055, 42);
      this.beep(520, 0.16, 'square', 0.04, 1280);
      this.beep(980, 0.22, 'sine', 0.04, 1960);
    },
    pickup() {
      this.ensure();
      this.beep(740, 0.07, 'sine', 0.036, 1480);
      this.beep(1180, 0.09, 'triangle', 0.022, 1760);
    },
    empty() {
      this.ensure();
      this.beep(180, 0.1, 'square', 0.03, 90);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(880, 0.18, 'sine', 0.05, 1175);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
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
      hitStop(0.05);
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
      hitStop(0.042);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (comboEl) comboEl.hidden = true;
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
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '钉枪';
      else if (hasBoss()) stageLabel.textContent = '钉核';
      else if (hasMid()) stageLabel.textContent = '砧甲';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 2 || hasMid() || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isRain() ? '钢雨' : '钉射';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isRain());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.shields <= 0);
    }
    if (jiaLabel) {
      jiaLabel.textContent = G.shields <= 0 ? '裸甲' : '甲 ×' + G.shields;
      jiaLabel.classList.toggle('naked', G.shields <= 0);
      jiaLabel.classList.toggle('max', G.shields >= SHIELD_MAX);
    }
    if (jiaBar) jiaBar.style.transform = 'scaleX(' + (G.shields / SHIELD_MAX) + ')';
    if (jiaWrap) jiaWrap.classList.toggle('naked', G.shields <= 0);
    if (wpnLabel) wpnLabel.textContent = wpnName();
    if (bombLabel) {
      bombLabel.textContent = '雨 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    const bombOff = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
    if (btnBomb) btnBomb.disabled = bombOff;
    if (btnPad) btnPad.disabled = bombOff;
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + comboMult() + (G.shields < SHIELD_MAX ? ' 甲×' + shieldMult() : '');
      } else if (G.mode === 'play' && G.shields < SHIELD_MAX) {
        comboEl.hidden = false;
        comboEl.textContent = '甲倍 ×' + shieldMult();
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格钉射，Shift 钢雨', 'warn');
    else if (G.mode === 'win') setHint('钉核已碎 · R 再来', 'hot');
    else if (G.shields <= 0) setHint('裸甲 MAX 倍率 · 再撞就掉命', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 甲少分高', 'warn');
    else setHint('空格钉射 · Shift 钢雨 · 甲少分高 · 双钉不散', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GNAI';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.8 ? 'bomb' : mag >= 3.2 ? 'fan' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('fan');
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
        rgb: i % 3 === 0 ? WHT : rgb,
        nail: i % 4 === 0
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
        a: rand(0.12, 0.55),
        z: rand(0.35, 1.15),
        rivet: i % 3 === 0
      });
    }
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss' || spec.kind === 'mid';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'rivet',
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
      score: spec.score || SCORE.rivet,
      ang: spec.ang || 0,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      ground: !!spec.ground,
      drop: spec.drop || null
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
      r: r || 3.5,
      life: 8
    });
    capArr(G.bullets, 240);
  }

  function aimedFire(e, n, spread, spd) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.3);
    }
  }

  function ringFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.4);
    }
  }

  function colFire(e, n, gap) {
    const g = gap || 18;
    for (let i = 0; i < n; i++) {
      enemyShot(e.x + (i - (n - 1) * 0.5) * g, e.y + 10, 0, bulletSpd() * 0.92, 3.2);
    }
  }

  function spawnRivet(x, y, vx, vy) {
    spawnEnemy({
      kind: 'rivet',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 96 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.rivet,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnRivet(c + k * 36, -26 - Math.abs(k) * 16, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isRain() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'rivet',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 88 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.rivet,
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
        vy: 40,
        hp: 2,
        r: 12,
        score: SCORE.dive,
        fireCd: 99
      });
    }
  }

  function spawnTurrets() {
    const n = isRain() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'turret',
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18,
        vy: 44 * dens(),
        hp: 6,
        r: 14,
        score: SCORE.turret,
        fireCd: 0.55 + i * 0.1,
        ground: true
      });
    }
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      x: 150,
      vy: 58 * dens(),
      hp: 12,
      r: 17,
      amp: 86,
      score: SCORE.elite,
      fireCd: 0.5
    });
    spawnEnemy({
      kind: 'elite',
      x: 330,
      vy: 58 * dens(),
      hp: 12,
      r: 17,
      amp: 86,
      phase: 1.6,
      score: SCORE.elite,
      fireCd: 0.7
    });
    if (isRain()) {
      spawnEnemy({
        kind: 'elite',
        x: 240,
        vy: 52 * dens(),
        hp: 12,
        r: 17,
        amp: 70,
        phase: 0.8,
        score: SCORE.elite,
        fireCd: 0.6
      });
    }
  }

  function nextDrop() {
    const cycle = ['pwr', 'pwr', 'jia', 'bomb'];
    const k = cycle[dropCycle % cycle.length];
    dropCycle += 1;
    return k;
  }

  function spawnCarrier() {
    spawnEnemy({
      kind: 'carrier',
      x: Math.random() < 0.5 ? 140 : 340,
      vy: 54 * dens(),
      hp: 8,
      r: 16,
      amp: 64,
      score: SCORE.carrier,
      fireCd: 0.7,
      drop: nextDrop()
    });
  }

  function spawnMid() {
    const rain = isRain();
    const mid = spawnEnemy({
      kind: 'mid',
      x: VW * 0.5,
      y: -70,
      vy: 0,
      hp: rain ? 64 : 52,
      r: 32,
      score: SCORE.mid,
      enter: 1.2,
      fireCd: 0.85
    });
    mid.maxHp = mid.hp;
    toast('砧甲', false, true);
    audio.wave();
    screenFlash(STEEL, 0.32);
    kick(4.2, 'boss');
    syncHud();
    return mid;
  }

  function spawnBoss() {
    const rain = isRain();
    const boss = spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: rain ? 122 : 100,
      r: 38,
      score: SCORE.boss,
      enter: 1.35,
      fireCd: 0.9
    });
    boss.maxHp = boss.hp;
    toast('钉核', false, true);
    audio.wave();
    screenFlash(VER, 0.36);
    kick(4.8, 'boss');
    syncHud();
    return boss;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isRain() ? 2 : 0), w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n + (isRain() ? 1 : 0));
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'elite') spawnElite();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function living() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) n += 1;
    return n;
  }

  function hasKind(kind) {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === kind) return true;
    }
    return false;
  }

  function hasBoss() {
    return hasKind('boss');
  }

  function hasMid() {
    return hasKind('mid');
  }

  function nearestEnemy(x, y, ignore) {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (ignore && ignore.indexOf(e) >= 0) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function pushNail(x, y, a, dmg, pierce, home, wpn) {
    G.shots.push({
      x: x,
      y: y,
      vx: Math.cos(a) * SHOT_V,
      vy: Math.sin(a) * SHOT_V,
      r: 3.4 + G.power * 0.4,
      w: 2.2 + G.power * 0.5,
      dmg: dmg,
      pierce: pierce,
      home: !!home,
      wpn: wpn,
      ignore: []
    });
  }

  function fireFrom(x, y, extra) {
    const p = G.power;
    const naked = G.shields <= 0;
    const wpn = G.wpn;
    const dmg = 1 + p * 0.32 + (naked ? 0.25 : 0);
    const pierce = wpn === 0 ? 1 + p + (naked ? 2 : 0) : (naked && wpn === 2 ? 1 : 0);
    const home = wpn === 2;
    if (wpn === 1) {
      const streams = extra ? 1 : (p === 0 ? 3 : p === 1 ? 4 : p === 2 ? 5 : 7);
      const spread = 0.12 + p * 0.05;
      for (let i = 0; i < streams; i++) {
        const t = streams === 1 ? 0 : (i - (streams - 1) * 0.5);
        pushNail(x + t * 3.2, y, -Math.PI * 0.5 + t * spread, dmg * 0.92, 0, false, wpn);
      }
    } else if (wpn === 2) {
      const n = extra ? 1 : (p >= 3 ? 3 : p >= 1 ? 2 : 1);
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i - (n - 1) * 0.5);
        pushNail(x + t * 6, y, -Math.PI * 0.5 + t * 0.08, dmg, pierce, true, wpn);
      }
    } else {
      const n = extra ? 1 : (p >= 2 ? 3 : p >= 1 ? 2 : 1);
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i - (n - 1) * 0.5);
        pushNail(x + t * 5, y, -Math.PI * 0.5, dmg, pierce, false, wpn);
      }
    }
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.05 + G.power * 0.01;
    fireFrom(G.ship.x, G.ship.y - 16, false);
    fireFrom(G.optL.x, G.optL.y - 8, true);
    fireFrom(G.optR.x, G.optR.y - 8, true);
    capArr(G.shots, 90);
    audio.shoot(G.power);
  }

  function spawnRainNail(x) {
    G.rain.push({
      x: x,
      y: -12,
      vy: 520 + rand(0, 80),
      dmg: 4,
      life: 1.6,
      pierce: 6,
      ignore: []
    });
    capArr(G.rain, 48);
  }

  function tryBomb() {
    if (G.mode !== 'play' || overlayOpen() || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      audio.empty();
      toast('钢雨用尽', true, false);
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.55;
    G.bombFlash = 0.6;
    G.rainT = 0.7;
    G.invuln = Math.max(G.invuln, 0.55);
    audio.bomb();
    hitStop(0.078);
    kick(6.4, 'bomb');
    screenFlash(STEEL, 0.7);
    ring(G.ship.x, G.ship.y - 12, STEEL);
    ring(G.ship.x, G.ship.y - 12, GOLD);
    burst(G.ship.x, G.ship.y - 16, STEEL, 28, 240);
    burst(G.ship.x, G.ship.y - 16, WHT, 16, 180);
    floatText(G.ship.x, G.ship.y - 36, '钢雨', STEEL, true);
    for (let i = 0; i < 16; i++) spawnRainNail(18 + i * ((VW - 36) / 15));
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      burst(G.bullets[i].x, G.bullets[i].y, STEEL, 3, 60);
      G.bullets.splice(i, 1);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      damageEnemy(e, e.kind === 'boss' || e.kind === 'mid' ? 16 : 12, 'bomb');
    }
    syncHud();
  }

  function spawnPow(x, y, kind) {
    const k = kind === 'bomb' ? 'bomb' : kind === 'jia' ? 'jia' : 'pwr';
    G.pows.push({
      x: x,
      y: y,
      vx: rand(-28, 28),
      vy: 42,
      kind: k,
      t: 0
    });
    capArr(G.pows, 12);
  }

  function collectPow(p) {
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        floatText(p.x, p.y, '雨', GOLD, true);
      } else {
        const pts = Math.round(400 * scoreMul());
        addScore(pts);
        floatText(p.x, p.y, '+' + pts, GOLD, false);
      }
      audio.pickup();
    } else if (p.kind === 'jia') {
      if (G.shields < SHIELD_MAX) {
        G.shields += 1;
        floatText(p.x, p.y, '甲', STEEL, true);
        toast(G.shields >= SHIELD_MAX ? '甲满' : '甲回 倍率↓', false, true);
        audio.pickup();
        if (jiaLabel) {
          jiaLabel.classList.remove('hot');
          void jiaLabel.offsetWidth;
          jiaLabel.classList.add('hot');
          jiaTok += 1;
        }
      } else {
        const pts = Math.round(300 * scoreMul());
        addScore(pts);
        floatText(p.x, p.y, '+' + pts, STEEL, false);
        audio.pickup();
      }
    } else if (G.power < POWER_MAX) {
      G.power += 1;
      audio.power();
      floatText(p.x, p.y, wpnName(), GOLD, true);
      if (wpnLabel) {
        wpnLabel.classList.remove('hot');
        void wpnLabel.offsetWidth;
        wpnLabel.classList.add('hot');
        wpnTok += 1;
      }
      if (G.power >= POWER_MAX) {
        audio.max();
        toast(WPN_NAME[G.wpn] + ' MAX', false, true);
        floatText(G.ship.x, G.ship.y - 40, 'MAX', GOLD, true);
        hitStop(0.05);
        kick(3.4, 'fan');
        screenFlash(GOLD, 0.4);
      }
    } else {
      G.wpn = (G.wpn + 1) % 3;
      audio.max();
      toast(WPN_NAME[G.wpn], false, true);
      floatText(p.x, p.y, WPN_NAME[G.wpn], STEEL, true);
      const pts = Math.round(SCORE.pmax * scoreMul());
      addScore(pts);
      hitStop(0.04);
      kick(3.0, 'fan');
    }
    burst(p.x, p.y, p.kind === 'jia' ? STEEL : p.kind === 'bomb' ? GOLD : VER, 10, 110);
    spark(p.x, p.y, GOLD);
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
      spark(e.x, e.y, G.wpn === 2 ? STEEL : GOLD);
      hitStop(0.032);
      audio.hit(G.combo);
      kick(1.6);
    }
    if ((e.kind === 'boss' || e.kind === 'mid') && src === 'shot') {
      addScore(Math.round(SCORE.chip * scoreMul()));
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'mid' ? STEEL : e.kind === 'elite' || e.kind === 'carrier' ? VER : NAIL;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 44 : e.kind === 'mid' ? 34 : e.kind === 'elite' ? 22 : 14);
    const pts = Math.round(e.score * scoreMul());
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss' || e.kind === 'mid');
    if (e.drop) spawnPow(e.x, e.y, e.drop);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(STEEL, 0.72);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, GOLD);
      G.bullets.length = 0;
      G.winT = 1.35;
      toast('钉核碎裂', false, true);
    } else if (e.kind === 'mid') {
      audio.bossDie();
      hitStop(0.07);
      kick(6.4, 'boss');
      screenFlash(STEEL, 0.55);
      burst(e.x, e.y, STEEL, 28, 220);
      G.bullets.length = 0;
      G.gapT = 0.2;
      toast('砧甲已碎', false, true);
    } else if (e.kind === 'elite' || e.kind === 'carrier') {
      audio.explode();
      hitStop(0.048);
      kick(3.1);
    }
    syncHud();
  }

  function stripOrDie() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play' || G.bombT > 0) return;
    if (G.shields > 0) {
      G.shields -= 1;
      G.invuln = 1.2;
      G.platesT = 0.42;
      audio.plate();
      hitStop(0.05);
      kick(4.4, 'hit');
      screenFlash(STEEL, 0.45);
      explode(G.ship.x, G.ship.y, STEEL, 18);
      burst(G.ship.x, G.ship.y, WHT, 14, 160);
      ring(G.ship.x, G.ship.y, STEEL);
      if (G.shields <= 0) {
        toast('裸甲 倍率MAX', true, false);
        floatText(G.ship.x, G.ship.y - 36, '裸甲', MAG, true);
      } else {
        toast('甲碎 ×' + shieldMult(), false, true);
        floatText(G.ship.x, G.ship.y - 32, '甲碎', STEEL, true);
      }
      if (jiaLabel) {
        jiaLabel.classList.remove('hot');
        void jiaLabel.offsetWidth;
        jiaLabel.classList.add('hot');
      }
      syncHud();
      return;
    }
    diePlayer();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play' || G.bombT > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.optL.x, G.optL.y, VER, 12);
    explode(G.optR.x, G.optR.y, VER, 12);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    if (G.power > 0) {
      spawnPow(G.ship.x, G.ship.y - 10, 'pwr');
      G.power = Math.max(0, G.power - 1);
    }
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.optL.x = G.ship.x - 24;
    G.optL.y = G.ship.y + 10;
    G.optR.x = G.ship.x + 24;
    G.optR.y = G.ship.y + 10;
    G.shields = SHIELD_RESPAWN;
    G.invuln = 1.5;
    G.deadT = 0;
    G.rainT = 0;
    G.bombT = 0;
    toast('甲 ×2', false, true);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '多重甲尽，钉核未碎。分数 ' + G.score + '。');
    setHint('R 重开 · 空格钉射，Shift 钢雨', 'warn');
  }

  function goWin() {
    addScore(isRain() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    showOverlay(
      'win',
      isRain() ? '钢雨通关' : '钉核尽碎',
      '砧甲、钉核都碎了。分数 ' + G.score + (isRain() ? ' · 钢雨' : ' · 钉射') + '。'
    );
    setHint('钉核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.pows.length = 0;
    G.rain.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * scoreMul()));
    G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    const st = STAGES[G.stage - 1];
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '钢核'), false, true);
    audio.wave();
    screenFlash(VER, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    dropCycle = 0;
    G.mode = 'play';
    G.kind = kind === 'rain' ? 'rain' : 'nail';
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
    G.power = 0;
    G.wpn = 0;
    G.shields = SHIELD_MAX;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.rainT = 0;
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
    G.scroll = 0;
    G.platesT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.optL.x = G.ship.x - 24;
    G.optL.y = G.ship.y + 10;
    G.optR.x = G.ship.x + 24;
    G.optR.y = G.ship.y + 10;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isRain() ? '钢雨' : '钉射', isRain(), !isRain());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'nail';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.power = 0;
    G.wpn = 0;
    G.shields = SHIELD_MAX;
    G.bombs = 3;
    G.deadT = 0;
    G.rainT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.optL.x = G.ship.x - 24;
    G.optL.y = G.ship.y + 10;
    G.optR.x = G.ship.x + 24;
    G.optR.y = G.ship.y + 10;
    clearWorld();
    showOverlay('title', '钉枪', '多重甲。甲越少倍率越高。双钉不散。先砧甲，再钉核。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('nail');
    else startGame(G.kind || 'nail');
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
    if (G.platesT > 0) G.platesT -= dt;
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

  function updateOpts(dt) {
    const naked = G.shields <= 0;
    const oxp = 22 + (naked ? 10 : 0);
    const oy = 12;
    const wob = Math.sin(G.t * 7) * 2;
    G.optL.x = lerp(G.optL.x, G.ship.x - oxp + wob, 1 - Math.exp(-dt * 9));
    G.optL.y = lerp(G.optL.y, G.ship.y + oy, 1 - Math.exp(-dt * 9));
    G.optR.x = lerp(G.optR.x, G.ship.x + oxp - wob, 1 - Math.exp(-dt * 9));
    G.optR.y = lerp(G.optR.y, G.ship.y + oy, 1 - Math.exp(-dt * 9));
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
    updateOpts(dt);
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (wantFire()) fireShot();
  }

  function shotHits(s, e) {
    if (s.ignore.indexOf(e) >= 0) return false;
    const dx = s.x - e.x;
    const dy = s.y - e.y;
    const rr = e.r + s.r;
    return dx * dx + dy * dy < rr * rr;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.home) {
        const e = nearestEnemy(s.x, s.y, s.ignore);
        if (e) {
          const want = Math.atan2(e.y - s.y, e.x - s.x);
          const have = Math.atan2(s.vy, s.vx);
          let d = want - have;
          while (d > Math.PI) d -= TAU;
          while (d < -Math.PI) d += TAU;
          const turn = clamp(d, -3.4 * dt, 3.4 * dt);
          const a = have + turn;
          const spd = hypot(s.vx, s.vy);
          s.vx = Math.cos(a) * spd;
          s.vy = Math.sin(a) * spd;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -24 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let dead = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        if (!shotHits(s, e)) continue;
        damageEnemy(e, s.dmg, 'shot');
        burst(s.x, s.y, s.wpn === 2 ? STEEL : GOLD, 5, 70);
        s.ignore.push(e);
        s.pierce -= 1;
        if (s.pierce < 0) {
          dead = true;
          break;
        }
      }
      if (dead) G.shots.splice(i, 1);
    }
  }

  function updateRain(dt) {
    if (G.rainT > 0) {
      G.rainT -= dt;
      if (!REDUCE && G.rainT > 0 && ((G.t * 18) | 0) !== (((G.t - dt) * 18) | 0)) {
        spawnRainNail(rand(16, VW - 16));
      }
    }
    for (let i = G.rain.length - 1; i >= 0; i--) {
      const r = G.rain[i];
      r.y += r.vy * dt;
      r.life -= dt;
      if (r.life <= 0 || r.y > VH + 20) {
        G.rain.splice(i, 1);
        continue;
      }
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        if (r.ignore.indexOf(e) >= 0) continue;
        const dx = r.x - e.x;
        const dy = r.y - e.y;
        if (dx * dx + dy * dy < (e.r + 5) * (e.r + 5)) {
          damageEnemy(e, r.dmg, 'bomb');
          burst(r.x, r.y, STEEL, 4, 60);
          r.ignore.push(e);
          r.pierce -= 1;
          if (r.pierce < 0) {
            G.rain.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > VH + 22 || b.y < -32 || b.x < -22 || b.x > VW + 22) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = b.x - G.ship.x;
        const dy = b.y - (G.ship.y - 2);
        const rr = HIT_R + b.r * 0.55;
        if (dx * dx + dy * dy < rr * rr) {
          G.bullets.splice(i, 1);
          stripOrDie();
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
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = G.ship.x - p.x;
        const dy = G.ship.y - p.y;
        const d = hypot(dx, dy);
        if (d < 22) {
          collectPow(p);
          G.pows.splice(i, 1);
          continue;
        }
        if (d < 96) {
          const k = 220 / Math.max(24, d);
          p.vx += (dx / d) * k * dt * 60;
          p.vy += (dy / d) * k * dt * 60;
        }
      }
      if (p.y > VH + 24 || p.t > 9) G.pows.splice(i, 1);
    }
  }

  function fireInterval(e) {
    const rain = isRain() ? 0.74 : 1;
    if (e.kind === 'rivet') return 1.45 * rain;
    if (e.kind === 'turret') return 0.92 * rain;
    if (e.kind === 'elite') return 0.82 * rain;
    if (e.kind === 'carrier') return 1.05 * rain;
    if (e.kind === 'mid') return 0.62 * rain;
    if (e.kind === 'boss') return 0.55 * rain;
    return 1.2 * rain;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'rivet') {
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
        e.vx = lerp(e.vx, Math.cos(a) * 210 * dens(), 1 - Math.exp(-dt * 3));
        e.vy = lerp(e.vy, Math.sin(a) * 240 * dens(), 1 - Math.exp(-dt * 3));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else if (e.kind === 'turret') {
      e.y += e.vy * dt;
      if (e.y > 70 && e.vy > 16) e.vy = 16;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, isRain() ? 2 : 1, 0.16, bulletSpd() * 0.92);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'elite') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 5, 0.18, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'carrier') {
      e.x = e.baseX + Math.sin(e.t * 1.15 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 28) e.vy = 28;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.22, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'mid') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, 126, 1 - Math.exp(-dt * 3.1));
      } else {
        e.x = VW * 0.5 + Math.sin(e.t * 0.85) * 88;
        e.y = 126 + Math.sin(e.t * 1.4) * 8;
      }
      e.spin += dt * 1.6;
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      if (ratio > 0.5) {
        aimedFire(e, 3, 0.2, spd);
        if ((e.pattern++ % 2) === 0) colFire(e, 4, 22);
        e.fireCd = 0.95 * (isRain() ? 0.78 : 1);
      } else {
        ringFire(e, 8, spd * 0.72, e.spin);
        aimedFire(e, 3, 0.16, spd);
        if ((e.pattern++ % 3) === 0) {
          spawnRivet(e.x - 36, e.y + 16, -24, 108);
          spawnRivet(e.x + 36, e.y + 16, 24, 108);
        }
        e.fireCd = 0.58 * (isRain() ? 0.78 : 1);
      }
    } else if (e.kind === 'boss') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, 118, 1 - Math.exp(-dt * 3.2));
      } else {
        e.x = VW * 0.5 + Math.sin(e.t * 0.7) * 96;
        e.y = 118 + Math.sin(e.t * 1.1) * 10;
      }
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.4 : 2.4);
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      if (ratio > 0.66) {
        aimedFire(e, 4, 0.18, spd);
        if (Math.random() < 0.42) ringFire(e, 8, spd * 0.72, e.spin);
        e.fireCd = 1.1 * (isRain() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        ringFire(e, 10, spd * 0.8, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 3, 0.18, spd);
        e.fireCd = 0.5 * (isRain() ? 0.78 : 1);
      } else {
        ringFire(e, 12, spd * 0.78, e.spin);
        ringFire(e, 8, spd * 0.58, -e.spin * 0.7);
        aimedFire(e, 3, 0.16, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnRivet(e.x - 40, e.y + 20, -30, 110);
          spawnRivet(e.x + 40, e.y + 20, 30, 110);
          colFire(e, 5, 20);
        }
        e.fireCd = 0.4 * (isRain() ? 0.78 : 1);
      }
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
        const rr = ((e.kind === 'boss' || e.kind === 'mid') ? e.r * 0.62 : e.r * 0.7) + HIT_R;
        if (dx * dx + dy * dy < rr * rr) stripOrDie();
      }
    }
  }

  function updateWaves(dt) {
    if (hasMid() || hasBoss()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
    if (G.waveI >= st.waves.length && !hasMid() && !hasBoss() && living() === 0) {
      G.gapT += dt;
      if (G.gapT >= 1.45) {
        G.gapT = 0;
        if (G.stage < STAGES.length) nextStage();
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
      updateOpts(dt);
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
      updateRain(dt);
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
      updateRain(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasMid() && !hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePows(dt);
    updateRain(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathHex(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + i * (TAU / 6);
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function pathTrap(c, x, y, hw, h, peak) {
    c.beginPath();
    c.moveTo(sx(x), sy(y - h * (peak || 0.55)));
    c.lineTo(sx(x + hw), sy(y + h * 0.45));
    c.lineTo(sx(x - hw), sy(y + h * 0.45));
    c.closePath();
  }

  function pathNailBody(c, x, y, hw, h) {
    c.beginPath();
    c.moveTo(sx(x), sy(y - h));
    c.lineTo(sx(x + hw * 0.35), sy(y - h * 0.35));
    c.lineTo(sx(x + hw), sy(y + h * 0.55));
    c.lineTo(sx(x - hw), sy(y + h * 0.55));
    c.lineTo(sx(x - hw * 0.35), sy(y - h * 0.35));
    c.closePath();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0a0504';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(70), 8 * scale, sx(VW * 0.5), sy(VH * 0.38), 360 * scale);
    g.addColorStop(0, 'rgba(255,74,20,0.16)');
    g.addColorStop(0.45, 'rgba(142,200,224,0.04)');
    g.addColorStop(1, 'rgba(10,5,4,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const yOff = G.scroll * 0.5;
    for (let col = 0; col < 6; col++) {
      const x = 54 + col * 68;
      const seed = col * 19.1;
      for (let row = -2; row < 12; row++) {
        const hgt = 70 + hash(seed + row) * 50;
        const y = ((row * 108 - yOff) % (108 * 10) + 108 * 10) % (108 * 10) - 50;
        c.fillStyle = 'rgba(32,12,8,' + (0.4 + hash(seed + row + 2) * 0.3) + ')';
        c.fillRect(sx(x), sy(y), 18 * scale, hgt * scale);
        c.fillRect(sx(x - 10), sy(y), 38 * scale, 7 * scale);
        c.fillRect(sx(x - 10), sy(y + hgt - 7), 38 * scale, 7 * scale);
        c.strokeStyle = 'rgba(142,200,224,0.14)';
        c.lineWidth = Math.max(0.6, 0.7 * scale);
        c.strokeRect(sx(x), sy(y), 18 * scale, hgt * scale);
        const rivets = 2 + ((hash(seed + row + 6) * 3) | 0);
        for (let k = 0; k < rivets; k++) {
          c.fillStyle = hash(seed + row + k) > 0.5 ? 'rgba(255,74,20,0.35)' : 'rgba(142,200,224,0.22)';
          c.beginPath();
          c.arc(sx(x + 9), sy(y + 14 + k * 16), 2.1 * scale, 0, TAU);
          c.fill();
        }
      }
    }

    c.fillStyle = 'rgba(18,8,6,0.78)';
    c.fillRect(sx(0), sy(0), 34 * scale, VH * scale);
    c.fillRect(sx(VW - 34), sy(0), 34 * scale, VH * scale);
    const wallOff = (G.scroll * 0.72) % 40;
    for (let i = -1; i < 22; i++) {
      const y = i * 40 - wallOff;
      c.fillStyle = 'rgba(255,74,20,0.14)';
      c.fillRect(sx(8), sy(y), 18 * scale, 8 * scale);
      c.fillRect(sx(VW - 26), sy(y + 14), 18 * scale, 8 * scale);
      c.fillStyle = 'rgba(142,200,224,0.28)';
      c.beginPath();
      c.arc(sx(14), sy(y + 4), 1.8 * scale, 0, TAU);
      c.arc(sx(22), sy(y + 18), 1.8 * scale, 0, TAU);
      c.arc(sx(VW - 14), sy(y + 20), 1.8 * scale, 0, TAU);
      c.fill();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      if (p.rivet) {
        c.fillStyle = rgba(i % 2 ? VER : STEEL, p.a * 0.55);
        c.beginPath();
        c.arc(sx(p.x), sy(p.y), (p.s + 0.6) * scale, 0, TAU);
        c.fill();
      } else {
        c.fillStyle = rgba(i % 2 ? VER : GOLD, p.a * 0.45);
        c.beginPath();
        c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
        c.fill();
      }
    }
    c.restore();
  }

  function drawHpBar(e, rgb) {
    const c = ctx;
    const ratio = clamp(e.hp / e.maxHp, 0, 1);
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(sx(e.x - 34), sy(e.y - e.r - 16), 68 * scale, 5 * scale);
    c.fillStyle = rgba(ratio < 0.33 ? MAG : rgb, 0.95);
    c.fillRect(sx(e.x - 34), sy(e.y - e.r - 16), 68 * ratio * scale, 5 * scale);
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    if (e.kind === 'turret') {
      c.fillStyle = rgba(DEEP, 0.92);
      pathTrap(c, e.x, e.y + 2, e.r + 4, e.r * 0.9, 0.2);
      c.fill();
      c.strokeStyle = rgba(STEEL, 0.85);
      c.lineWidth = Math.max(1, 1.3 * scale);
      pathTrap(c, e.x, e.y + 2, e.r + 4, e.r * 0.9, 0.2);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : VER, 0.95);
      c.fillRect(sx(e.x - 2.2), sy(e.y - 12), 4.4 * scale, 16 * scale);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 4), 4.4 * scale, 0, TAU);
      c.fill();
      return;
    }
    if (e.kind === 'mid') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(STEEL, 0.14);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 46 * scale, 30 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(DEEP, 0.95);
      c.beginPath();
      c.moveTo(sx(e.x - 36), sy(e.y - 10));
      c.lineTo(sx(e.x + 36), sy(e.y - 10));
      c.lineTo(sx(e.x + 26), sy(e.y + 22));
      c.lineTo(sx(e.x - 26), sy(e.y + 22));
      c.closePath();
      c.fill();
      c.strokeStyle = rgba(flash ? WHT : STEEL, 0.95);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : GOLD, 0.9);
      c.fillRect(sx(e.x - 22), sy(e.y - 22), 44 * scale, 10 * scale);
      c.fillStyle = rgba(VER, 0.9);
      c.fillRect(sx(e.x - 4), sy(e.y - 8), 8 * scale, 24 * scale);
      drawHpBar(e, STEEL);
      return;
    }
    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(VER, 0.16);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 52 * scale, 38 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.save();
      c.translate(sx(e.x), sy(e.y));
      c.rotate(e.spin * 0.35);
      c.fillStyle = rgba(DEEP, 0.95);
      c.beginPath();
      c.moveTo(0, -42 * scale);
      c.lineTo(16 * scale, 8 * scale);
      c.lineTo(10 * scale, 28 * scale);
      c.lineTo(-10 * scale, 28 * scale);
      c.lineTo(-16 * scale, 8 * scale);
      c.closePath();
      c.fill();
      c.strokeStyle = rgba(flash ? WHT : VER, 0.95);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      c.stroke();
      c.fillStyle = rgba(STEEL, 0.9);
      c.fillRect(-5 * scale, -8 * scale, 10 * scale, 34 * scale);
      c.fillStyle = rgba(GOLD, 0.9);
      c.fillRect(-12 * scale, 22 * scale, 24 * scale, 6 * scale);
      c.restore();
      c.fillStyle = rgba(MAG, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 6), 5 * scale, 0, TAU);
      c.fill();
      drawHpBar(e, GOLD);
      return;
    }
    if (e.kind === 'dive') {
      c.fillStyle = rgba(flash ? WHT : VER, 0.95);
      pathNailBody(c, e.x, e.y, 7, 15);
      c.fill();
      c.strokeStyle = rgba(STEEL, 0.8);
      c.lineWidth = Math.max(0.8, scale);
      pathNailBody(c, e.x, e.y, 7, 15);
      c.stroke();
      return;
    }
    const rgb = flash ? WHT : (e.kind === 'elite' || e.kind === 'carrier' ? VER : STEEL);
    pathHex(c, e.x, e.y, e.r - 1);
    c.fillStyle = rgba(rgb, 0.92);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.8);
    c.lineWidth = Math.max(0.8, scale);
    pathHex(c, e.x, e.y, e.r - 1);
    c.stroke();
    c.fillStyle = rgba(NAIL, 0.95);
    c.fillRect(sx(e.x - 1.3), sy(e.y - e.r + 2), 2.6 * scale, (e.r * 1.4) * scale);
    if (e.kind === 'elite' || e.kind === 'carrier') {
      c.fillStyle = rgba(e.kind === 'carrier' ? GOLD : MAG, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + e.r - 4), 3.2 * scale, 0, TAU);
      c.fill();
      c.fillRect(sx(e.x - 14), sy(e.y - 2), 6 * scale, 4 * scale);
      c.fillRect(sx(e.x + 8), sy(e.y - 2), 6 * scale, 4 * scale);
    }
  }

  function drawNailShot(s) {
    const c = ctx;
    const ang = Math.atan2(s.vy, s.vx);
    const len = 13 + G.power * 3;
    const hw = s.w * 0.55;
    const rgb = s.wpn === 2 ? STEEL : s.wpn === 1 ? VER : GOLD;
    c.save();
    c.translate(sx(s.x), sy(s.y));
    c.rotate(ang);
    c.fillStyle = rgba(rgb, 0.55);
    c.beginPath();
    c.moveTo(len * scale, 0);
    c.lineTo(-len * 0.28 * scale, hw * 1.4 * scale);
    c.lineTo(-len * 0.28 * scale, -hw * 1.4 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.fillRect(-len * 0.5 * scale, -hw * 1.7 * scale, len * 0.22 * scale, hw * 3.4 * scale);
    c.fillRect(-len * 0.22 * scale, -hw * 0.55 * scale, len * 0.7 * scale, hw * 1.1 * scale);
    if (!REDUCE) {
      c.strokeStyle = rgba(rgb, 0.32);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(-len * 1.15 * scale, 0);
      c.stroke();
    }
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) drawNailShot(G.shots[i]);
    for (let i = 0; i < G.rain.length; i++) {
      const r = G.rain[i];
      c.fillStyle = rgba(STEEL, 0.9);
      c.beginPath();
      c.moveTo(sx(r.x), sy(r.y + 14));
      c.lineTo(sx(r.x - 2.2), sy(r.y - 8));
      c.lineTo(sx(r.x + 2.2), sy(r.y - 8));
      c.closePath();
      c.fill();
      c.fillStyle = rgba(WHT, 0.85);
      c.fillRect(sx(r.x - 2.6), sy(r.y - 11), 5.2 * scale, 2.4 * scale);
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      c.fillStyle = rgba(MAG, 0.92);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * 0.42 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(PNK, 0.28);
        c.lineWidth = 1;
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), (b.r + 3.2) * scale, 0, TAU);
        c.stroke();
      }
    }
    c.restore();
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = p.kind === 'bomb' ? GOLD : p.kind === 'jia' ? STEEL : VER;
      const pulse = 1 + Math.sin(G.t * 10 + p.t) * 0.12;
      const lab = p.kind === 'bomb' ? '雨' : p.kind === 'jia' ? '甲' : '钉';
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(rgb, 0.95);
      c.translate(sx(p.x), sy(p.y));
      c.rotate(p.t * 2);
      c.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = -Math.PI / 2 + k * (TAU / 6);
        const px = Math.cos(a) * 8 * pulse * scale;
        const py = Math.sin(a) * 8 * pulse * scale;
        if (k === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
      c.restore();
      c.fillStyle = rgba(WHT, 0.95);
      c.font = (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(lab, sx(p.x), sy(p.y));
    }
  }

  function drawOpt(o) {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(STEEL, 0.22);
    c.beginPath();
    c.arc(sx(o.x), sy(o.y), 8 * scale, 0, TAU);
    c.fill();
    c.restore();
    c.fillStyle = rgba(VER, 0.95);
    pathTrap(c, o.x, o.y, 6, 10, 0.7);
    c.fill();
    c.fillStyle = rgba(STEEL, 0.95);
    c.fillRect(sx(o.x - 1.2), sy(o.y - 8), 2.4 * scale, 10 * scale);
    c.beginPath();
    c.arc(sx(o.x), sy(o.y + 2), 2.1 * scale, 0, TAU);
    c.fill();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;
    const naked = G.shields <= 0;

    drawOpt(G.optL);
    drawOpt(G.optR);

    if (G.shields > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < G.shields; i++) {
        const r = 15 + i * 5 + Math.sin(G.t * 5 + i) * 0.6;
        c.strokeStyle = rgba(STEEL, 0.28 + i * 0.08);
        c.lineWidth = Math.max(1, (1.1 + i * 0.15) * scale);
        pathHex(c, x, y, r);
        c.stroke();
      }
      c.restore();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(naked ? MAG : VER, 0.2 + (G.muzzle > 0 ? 0.22 : 0) + (naked ? 0.12 : 0));
    c.beginPath();
    c.ellipse(sx(x), sy(y), (16 + (naked ? 4 : 0)) * scale, 12 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(STEEL, 0.55);
    c.beginPath();
    c.moveTo(sx(x - 5), sy(y + 8));
    c.lineTo(sx(x), sy(y + 18 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x + 5), sy(y + 8));
    c.fill();
    c.restore();

    c.fillStyle = rgba(naked ? MAG : VER, 0.96);
    pathNailBody(c, x, y + 2, 13, 22);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.95);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    pathNailBody(c, x, y + 2, 13, 22);
    c.stroke();

    c.fillStyle = rgba(WHT, 0.95);
    pathTrap(c, x, y - 4, 4.4, 14, 0.78);
    c.fill();

    c.fillStyle = rgba(STEEL, 0.9);
    c.fillRect(sx(x - 12), sy(y + 4), 5 * scale, 3 * scale);
    c.fillRect(sx(x + 7), sy(y + 4), 5 * scale, 3 * scale);

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 18), (5 + G.power) * scale, 0, TAU);
      c.fill();
      c.restore();
    }

    if (G.platesT > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(STEEL, G.platesT * 1.4);
      c.lineWidth = 2 * scale;
      pathHex(c, x, y, 18 + (1 - G.platesT) * 36);
      c.stroke();
      c.restore();
    }
  }

  function drawFx() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / 0.4, 0, 1);
      if (q.nail) {
        c.strokeStyle = rgba(q.rgb, a);
        c.lineWidth = 1.2 * scale;
        c.beginPath();
        c.moveTo(sx(q.x), sy(q.y));
        c.lineTo(sx(q.x + q.vx * 0.04), sy(q.y + q.vy * 0.04));
        c.stroke();
      } else {
        c.fillStyle = rgba(q.rgb, a);
        c.beginPath();
        c.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
        c.fill();
      }
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (6 + s.t * 42) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = 2 * scale;
      pathHex(c, r.x, r.y, 8 + r.t * 80);
      c.stroke();
    }
    c.restore();
    if (G.bombFlash > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(STEEL, G.bombFlash * 0.9);
      c.lineWidth = 3 * scale;
      c.beginPath();
      c.arc(sx(G.ship.x), sy(G.ship.y), (30 + (1 - G.bombFlash) * 140) * scale, 0, TAU);
      c.stroke();
      c.restore();
    }
    c.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.fillStyle = rgba(f.rgb, a);
      c.font = ((f.gold ? 13 : 11) * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#120704';
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
    ctx.fillStyle = '#120704';
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
    drawShots();
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
      startGame('nail');
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
      startGame('nail');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('rain');
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

  if (btnNail) {
    btnNail.addEventListener('click', function () {
      audio.ensure();
      startGame('nail');
    });
  }
  if (btnRain) {
    btnRain.addEventListener('click', function () {
      audio.ensure();
      startGame('rain');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'nail');
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
