'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const BOMB_CAP = 6;
  const WPN_MAX = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 4.5;
  const BEST_KEY = 'playbox-daioh-best';
  const MUTE_KEY = 'playbox-daioh-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 王爆 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const AMB = [255, 196, 74];
  const GOLD = [255, 232, 160];
  const NUC = [255, 210, 32];
  const VER = [255, 58, 28];
  const WHT = [255, 244, 232];
  const PNK = [255, 154, 180];
  const DEEP = [28, 10, 8];
  const CRIM = [255, 92, 48];

  const WPN_CYCLE = ['spread', 'laser', 'homing', 'napalm', 'wide', 'bomb'];
  const WPN_GLYPH = {
    spread: '散',
    laser: '束',
    homing: '追',
    napalm: '炎',
    wide: '阔',
    bomb: '爆'
  };
  const WPN_RGB = {
    spread: VER,
    laser: CRIM,
    homing: AMB,
    napalm: [255, 120, 32],
    wide: GOLD,
    bomb: NUC
  };

  const SCORE = {
    grunt: 50,
    dive: 80,
    turret: 150,
    elite: 240,
    carrier: 280,
    drip: 90,
    pod: 220,
    boss: 3500,
    chip: 10,
    stage: 1600,
    pmax: 500
  };

  const STAGES = [
    {
      name: '熔脊',
      boss: '脊王',
      form: 'ridge',
      bossHp: 110,
      bossR: 48,
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.0, kind: 'stream', dir: 1 },
        { t: 5.4, kind: 'dive', n: 4 },
        { t: 7.6, kind: 'turrets' },
        { t: 9.4, kind: 'carrier' },
        { t: 11.4, kind: 'v', n: 7 },
        { t: 13.8, kind: 'elite' },
        { t: 16.2, kind: 'drip', n: 3 },
        { t: 18.6, kind: 'stream', dir: -1 },
        { t: 22.4, kind: 'boss' }
      ]
    },
    {
      name: '王垒',
      boss: '垒王',
      form: 'fort',
      bossHp: 148,
      bossR: 62,
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.4, kind: 'dive', n: 5 },
        { t: 4.4, kind: 'turrets' },
        { t: 6.2, kind: 'stream', dir: -1 },
        { t: 8.2, kind: 'elite' },
        { t: 10.0, kind: 'carrier' },
        { t: 12.0, kind: 'drip', n: 4 },
        { t: 14.0, kind: 'v', n: 9 },
        { t: 16.2, kind: 'dive', n: 6 },
        { t: 18.2, kind: 'elite' },
        { t: 22.6, kind: 'boss' }
      ]
    },
    {
      name: '核殿',
      boss: '大王',
      form: 'king',
      bossHp: 210,
      bossR: 88,
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.2, kind: 'drip', n: 5 },
        { t: 4.0, kind: 'elite' },
        { t: 5.8, kind: 'turrets' },
        { t: 7.6, kind: 'carrier' },
        { t: 9.4, kind: 'stream', dir: 1 },
        { t: 11.2, kind: 'dive', n: 6 },
        { t: 13.0, kind: 'v', n: 9 },
        { t: 15.0, kind: 'elite' },
        { t: 16.8, kind: 'drip', n: 5 },
        { t: 21.2, kind: 'boss' }
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
  const btnKing = document.getElementById('btn-king');
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
  const pwrLabel = document.getElementById('pwr-label');
  const bombLabel = document.getElementById('bomb-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const pwrBar = document.getElementById('pwr-bar');
  const pwrWrap = document.getElementById('pwr-wrap');

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
  let dropCycle = 0;
  let shotSeq = 1;
  let rainT = 0;

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
    kind: 'king',
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
    wpn: 'spread',
    power: 0,
    charge: 0,
    kingOn: false,
    kingTx: VW * 0.5,
    kingTy: 80,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    enemies: [],
    shots: [],
    bullets: [],
    pows: [],
    ship: { x: VW * 0.5, y: VH - 80, vx: 0, vy: 0 },
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: NUC,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    clearT: 0
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
    return isRain() ? 1.22 : 1;
  }
  function shipSpeed() {
    return isRain() ? 316 : 272;
  }
  function bulletSpd() {
    return isRain() ? 182 : 142;
  }
  function hpMul() {
    return isRain() ? 1.22 : 1;
  }
  function hash(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }
  function wrapAng(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function wpnRgb() {
    return WPN_RGB[G.wpn] || VER;
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
    shoot(wpn, p) {
      this.ensure();
      const lift = 1 + (p || 0) * 0.1;
      if (wpn === 'laser') {
        this.beep(880 * lift, 0.05, 'sawtooth', 0.028, 240);
        this.beep(220, 0.06, 'square', 0.016, 80);
      } else if (wpn === 'homing') {
        this.beep(420 * lift, 0.07, 'triangle', 0.03, 720 * lift);
      } else if (wpn === 'napalm') {
        this.noise(0.04, 0.028, 600);
        this.beep(180 * lift, 0.07, 'sawtooth', 0.028, 90);
      } else if (wpn === 'wide') {
        this.beep(260 * lift, 0.05, 'square', 0.034, 140);
        this.noise(0.03, 0.02, 400);
      } else {
        this.beep(680 * lift, 0.04, 'square', 0.026 + (p || 0) * 0.004, 1320 * lift);
      }
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.03, 0.028, 1400);
      this.beep(620 * lift, 0.055, 'square', 0.036, 940 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 500);
      this.beep(280, 0.14, 'sawtooth', 0.045, 70);
    },
    bossHit() {
      this.ensure();
      this.beep(220, 0.055, 'sawtooth', 0.036, 160);
      this.beep(580, 0.07, 'square', 0.028, 820);
    },
    bossDie() {
      this.ensure();
      this.noise(0.24, 0.065, 240);
      this.beep(160, 0.3, 'sawtooth', 0.055, 46);
      this.beep(480, 0.22, 'triangle', 0.042, 180);
      this.beep(980, 0.34, 'sine', 0.04, 1480);
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
      this.noise(0.2, 0.065, 220);
      this.beep(140, 0.26, 'sawtooth', 0.058, 44);
      this.beep(380, 0.18, 'square', 0.042, 820);
      this.beep(760, 0.24, 'sine', 0.04, 1520);
    },
    king() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.05, 520);
      this.beep(520, 0.22, 'square', 0.042, 1240);
      this.beep(1040, 0.28, 'sine', 0.04, 1760);
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

  function pwrName() {
    const g = WPN_GLYPH[G.wpn] || '散';
    return G.power >= WPN_MAX ? g + ' MAX' : g + ' ' + G.power;
  }

  function bossName() {
    const st = STAGES[G.stage - 1];
    return st ? st.boss : '大王';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '大王';
      else if (hasBoss()) stageLabel.textContent = bossName();
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss() || G.kingOn));
    }
    if (tagLabel) {
      tagLabel.textContent = isRain() ? '核雨' : '大王';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isRain());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.kingOn || G.power >= WPN_MAX);
    }
    if (pwrLabel) {
      pwrLabel.textContent = pwrName();
      pwrLabel.classList.toggle('max', G.power >= WPN_MAX || G.kingOn);
    }
    if (pwrBar) pwrBar.style.transform = 'scaleX(' + clamp(G.charge, 0, 1) + ')';
    if (pwrWrap) pwrWrap.classList.toggle('hot', G.charge >= 0.98 || G.kingOn);
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
    else if (G.mode === 'lose') setHint('R 重开 · 空格连射蓄王核，Shift 王爆', 'warn');
    else if (G.mode === 'win') setHint('核殿已碎 · R 再来', 'hot');
    else if (G.kingOn) setHint('王炮锁定 · 寻敌贯穿', 'hot');
    else if (G.power >= WPN_MAX) setHint(pwrName() + ' · 空格蓄满放出王炮', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 吃核续链', 'warn');
    else setHint('空格连射蓄王核 · Shift 王爆 · 吃核换武', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DAIO';
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
        a: rand(0.12, 0.58),
        z: rand(0.35, 1.2),
        hot: Math.random() < 0.35
      });
    }
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss' || spec.kind === 'pod';
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
      laserId: 0
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r, rgb) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.5,
      life: 8,
      rgb: rgb || MAG
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
      enemyShot(e.x, e.y + 8, Math.cos(a) * s, Math.sin(a) * s, 3.4);
    }
  }

  function ringFire(e, n, spd, rot) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y + 10, Math.cos(a) * s, Math.sin(a) * s, 3.5, i % 2 ? MAG : VER);
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
      r: 11,
      amp: 42,
      score: SCORE.grunt,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnGrunt(c + k * 36, -26 - Math.abs(k) * 16, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isRain() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'grunt',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 88 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.grunt,
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
      hp: 10,
      r: 17,
      amp: 86,
      score: SCORE.elite,
      fireCd: 0.5
    });
    spawnEnemy({
      kind: 'elite',
      x: 330,
      vy: 58 * dens(),
      hp: 10,
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
        hp: 10,
        r: 17,
        amp: 70,
        phase: 0.8,
        score: SCORE.elite,
        fireCd: 0.6
      });
    }
  }

  function spawnDrip(n) {
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'drip',
        x: 70 + Math.random() * (VW - 140),
        y: -24 - i * 26,
        vy: 52 * dens(),
        hp: 3,
        r: 13,
        score: SCORE.drip,
        fireCd: 0.9 + i * 0.15
      });
    }
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
      drop: 'cycle'
    });
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    const rain = isRain();
    const hp = Math.round((st ? st.bossHp : 210) * (rain ? 1.22 : 1));
    const r = st ? st.bossR : 88;
    const form = st ? st.form : 'king';
    const boss = spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -r,
      vy: 0,
      hp: hp,
      r: r,
      score: SCORE.boss + 1500 * G.stage,
      enter: 1.45,
      fireCd: 1.0,
      form: form
    });
    boss.maxHp = boss.hp;
    const podHp = rain ? 18 : 14;
    const rad = r + 28;
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 + rad,
      y: 40,
      hp: podHp,
      r: 14,
      score: SCORE.pod,
      ang: 0,
      rad: rad,
      fireCd: 0.85
    });
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 - rad,
      y: 40,
      hp: podHp,
      r: 14,
      score: SCORE.pod,
      ang: Math.PI,
      rad: rad,
      fireCd: 1.1
    });
    if (form === 'king') {
      spawnEnemy({
        kind: 'pod',
        x: VW * 0.5,
        y: 20,
        hp: podHp + 4,
        r: 15,
        score: SCORE.pod,
        ang: 1.2,
        rad: rad * 0.72,
        fireCd: 0.7
      });
    }
    toast(bossName(), false, true);
    audio.wave();
    screenFlash(VER, 0.4);
    kick(5.2, 'boss');
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
    else if (w.kind === 'drip') spawnDrip(w.n + (isRain() ? 2 : 0));
    else if (w.kind === 'boss') spawnBoss();
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

  function findBoss() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'boss') return G.enemies[i];
    }
    return null;
  }

  function nearestEnemy(x, y) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const d = hypot(e.x - x, e.y - y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  function scrollSpd() {
    if (hasBoss()) return 24;
    return isRain() ? 122 : 86;
  }

  function fireRate() {
    const p = G.power;
    const rain = isRain() ? 0.88 : 1;
    if (G.wpn === 'laser') return (0.118 - p * 0.008) * rain;
    if (G.wpn === 'homing') return (0.148 - p * 0.012) * rain;
    if (G.wpn === 'napalm') return (0.132 - p * 0.01) * rain;
    if (G.wpn === 'wide') return (0.108 - p * 0.007) * rain;
    return (0.092 - p * 0.006) * rain;
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function pushShot(spec) {
    const s = {
      id: shotSeq++,
      x: spec.x,
      y: spec.y,
      vx: spec.vx,
      vy: spec.vy,
      r: spec.r,
      w: spec.w,
      dmg: spec.dmg,
      p: spec.p,
      kind: spec.kind,
      pierce: spec.pierce || 0,
      life: spec.life == null ? 2.4 : spec.life,
      g: spec.g || 0,
      rgb: spec.rgb
    };
    G.shots.push(s);
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.05 + G.power * 0.012;
    const p = G.power;
    const wpn = G.wpn;
    const rgb = wpnRgb();
    if (wpn === 'laser') {
      const n = p === 0 ? 1 : p === 1 ? 2 : 3;
      const dmg = 1.15 + p * 0.22;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i - (n - 1) * 0.5);
        pushShot({
          x: G.ship.x + t * (10 + p * 2),
          y: G.ship.y - 18,
          vx: t * 18,
          vy: -920,
          r: 4.2 + p * 0.6,
          w: 5 + p * 1.6,
          dmg: dmg,
          p: p,
          kind: 'laser',
          pierce: 4,
          rgb: rgb
        });
      }
    } else if (wpn === 'homing') {
      const n = 1 + Math.min(3, p);
      const dmg = 1.05 + p * 0.18;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i - (n - 1) * 0.5);
        const a = -Math.PI * 0.5 + t * 0.32;
        const spd = 400 + p * 20;
        pushShot({
          x: G.ship.x + t * 8,
          y: G.ship.y - 12,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          r: 4.4,
          w: 6,
          dmg: dmg,
          p: p,
          kind: 'homing',
          rgb: rgb
        });
      }
    } else if (wpn === 'napalm') {
      const n = 1 + Math.min(3, p);
      const dmg = 1.3 + p * 0.28;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : (i - (n - 1) * 0.5);
        pushShot({
          x: G.ship.x + t * 10,
          y: G.ship.y - 14,
          vx: t * 70,
          vy: -480 - p * 20,
          r: 5.2,
          w: 7,
          dmg: dmg,
          p: p,
          kind: 'napalm',
          g: 620,
          life: 0.85,
          rgb: rgb
        });
      }
    } else if (wpn === 'wide') {
      const n = p === 0 ? 3 : p === 1 ? 4 : p === 2 ? 5 : 7;
      const dmg = 1.55 + p * 0.35;
      const spread = 0.22 + p * 0.06;
      for (let i = 0; i < n; i++) {
        const t = i - (n - 1) * 0.5;
        const a = -Math.PI * 0.5 + t * spread;
        const spd = 640;
        pushShot({
          x: G.ship.x + t * 4,
          y: G.ship.y - 12,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          r: 5.5 + p * 0.5,
          w: 8 + p,
          dmg: dmg,
          p: p,
          kind: 'wide',
          life: 0.28,
          rgb: rgb
        });
      }
    } else {
      const streams = p === 0 ? 2 : p === 1 ? 3 : p === 2 ? 5 : 7;
      const spread = p === 0 ? 0.055 : p === 1 ? 0.15 : p === 2 ? 0.2 : 0.3;
      const dmg = 1 + p * 0.28;
      const r = 3.2 + p * 1.05;
      const w = 3.2 + p * 2.2;
      for (let i = 0; i < streams; i++) {
        const t = streams === 1 ? 0 : (i - (streams - 1) * 0.5);
        const a = -Math.PI * 0.5 + t * spread;
        const spd = 740;
        pushShot({
          x: G.ship.x + t * (3.5 + p * 1.4),
          y: G.ship.y - 16,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd,
          r: r,
          w: w,
          dmg: dmg,
          p: p,
          kind: 'spread',
          rgb: rgb
        });
      }
    }
    capArr(G.shots, 90);
    audio.shoot(wpn, p);
  }

  function distToSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 < 1) return hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = clamp(t, 0, 1);
    return hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function applyKing(dt) {
    const x0 = G.ship.x;
    const y0 = G.ship.y - 16;
    const target = nearestEnemy(x0, y0 - 80);
    const aimX = target ? target.x : G.ship.x;
    const aimY = target ? target.y : 36;
    G.kingTx = lerp(G.kingTx, aimX, 1 - Math.exp(-dt * 8.5));
    G.kingTy = lerp(G.kingTy, aimY, 1 - Math.exp(-dt * 8.5));
    const x1 = G.kingTx;
    const y1 = G.kingTy;
    const half = 12 + G.power * 2;
    const dps = 28 + G.power * 4;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (distToSeg(e.x, e.y, x0, y0, x1, y1) < half + e.r * 0.45) {
        damageEnemy(e, dps * dt, 'king');
        if (!REDUCE && Math.random() < 0.35) spark(e.x + rand(-8, 8), e.y, NUC);
      }
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      if (distToSeg(b.x, b.y, x0, y0, x1, y1) < half + 4) {
        burst(b.x, b.y, NUC, 3, 60);
        G.bullets.splice(i, 1);
      }
    }
  }

  function napalmBoom(s) {
    explode(s.x, s.y, s.rgb || VER, 18);
    ring(s.x, s.y, NUC);
    const rad = 38 + s.p * 6;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (hypot(e.x - s.x, e.y - s.y) < rad + e.r * 0.4) {
        damageEnemy(e, s.dmg * 1.6, 'shot');
      }
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      if (hypot(b.x - s.x, b.y - s.y) < rad * 0.7) {
        burst(b.x, b.y, VER, 3, 50);
        G.bullets.splice(i, 1);
      }
    }
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
    G.bombFlash = 0.58;
    G.invuln = Math.max(G.invuln, 0.48);
    audio.bomb();
    hitStop(0.078);
    kick(6.6, 'bomb');
    screenFlash(NUC, 0.74);
    ring(G.ship.x, G.ship.y - 12, NUC);
    ring(G.ship.x, G.ship.y - 12, VER);
    burst(G.ship.x, G.ship.y - 16, NUC, 34, 270);
    burst(G.ship.x, G.ship.y - 16, WHT, 18, 200);
    floatText(G.ship.x, G.ship.y - 36, '王爆', NUC, true);
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      burst(G.bullets[i].x, G.bullets[i].y, NUC, 3, 60);
      G.bullets.splice(i, 1);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      damageEnemy(e, e.kind === 'boss' ? 16 : 12, 'bomb');
    }
    syncHud();
  }

  function spawnPow(x, y, startKind) {
    let slot = 0;
    if (startKind && startKind !== 'cycle') {
      const i = WPN_CYCLE.indexOf(startKind);
      slot = i >= 0 ? i : 0;
    } else {
      slot = dropCycle % WPN_CYCLE.length;
      dropCycle += 1;
    }
    G.pows.push({
      x: x,
      y: y,
      vx: rand(-28, 28),
      vy: 40,
      slot: slot,
      kind: WPN_CYCLE[slot],
      t: 0,
      cycleT: 0
    });
    capArr(G.pows, 12);
  }

  function collectPow(p) {
    const kind = p.kind;
    if (kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        floatText(p.x, p.y, '爆', GOLD, true);
      } else {
        const pts = Math.round(400 * G.mult);
        addScore(pts);
        floatText(p.x, p.y, '+' + pts, GOLD, false);
      }
      audio.pickup();
    } else if (kind === G.wpn) {
      if (G.power < WPN_MAX) {
        G.power += 1;
        audio.power();
        floatText(p.x, p.y, pwrName(), wpnRgb(), true);
        if (pwrLabel) {
          pwrLabel.classList.remove('hot');
          void pwrLabel.offsetWidth;
          pwrLabel.classList.add('hot');
          pwrTok += 1;
        }
        if (G.power >= WPN_MAX) {
          audio.max();
          toast(WPN_GLYPH[G.wpn] + ' MAX', false, true);
          floatText(G.ship.x, G.ship.y - 40, 'MAX', GOLD, true);
          hitStop(0.055);
          kick(3.4, 'fan');
          screenFlash(wpnRgb(), 0.4);
        }
      } else {
        const pts = Math.round(SCORE.pmax * G.mult);
        addScore(pts);
        floatText(p.x, p.y, '+' + pts, wpnRgb(), true);
        audio.pickup();
      }
    } else {
      G.wpn = kind;
      G.power = Math.max(1, Math.min(G.power, 2));
      audio.power();
      floatText(p.x, p.y, pwrName(), wpnRgb(), true);
      toast(WPN_GLYPH[kind], false, true);
      burst(p.x, p.y, wpnRgb(), 12, 130);
      kick(2.4, 'fan');
    }
    burst(p.x, p.y, kind === 'bomb' ? GOLD : (WPN_RGB[kind] || VER), 10, 110);
    spark(p.x, p.y, kind === 'bomb' ? GOLD : (WPN_RGB[kind] || VER));
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
      spark(e.x, e.y, wpnRgb());
      hitStop(0.034);
      audio.hit(G.combo);
      kick(1.7);
    }
    if (e.kind === 'boss' && src === 'shot') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'elite' || e.kind === 'carrier' ? VER : NUC;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 52 : e.kind === 'elite' ? 22 : 14);
    const pts = Math.round(e.score * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss');
    if (e.drop) spawnPow(e.x, e.y, e.drop);
    if (e.kind === 'drip') {
      const s = bulletSpd() * 0.9;
      for (let k = -1; k <= 1; k++) {
        const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x) + k * 0.28;
        enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.2, VER);
      }
    }
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.082);
      kick(8.4, 'boss');
      screenFlash(NUC, 0.76);
      burst(e.x, e.y, MAG, 40, 300);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, GOLD);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      G.bullets.length = 0;
      toast(bossName() + '碎裂', false, true);
      if (G.stage >= 3) G.winT = 1.4;
      else G.clearT = 1.4;
    } else if (e.kind === 'elite' || e.kind === 'pod' || e.kind === 'carrier') {
      audio.explode();
      hitStop(0.05);
      kick(3.2);
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play' || G.bombT > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.kingOn = false;
    G.charge = 0;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, VER, 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    spawnPow(G.ship.x, G.ship.y - 10, G.wpn);
    G.power = Math.max(0, G.power - 1);
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 80;
    G.invuln = 1.5;
    G.deadT = 0;
    G.bombT = 0;
    G.kingOn = false;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '吃核切换五武。蓄满王核放出寻敌王炮。分数 ' + G.score + '。');
    setHint('R 重开 · 空格连射蓄王核，Shift 王爆', 'warn');
  }

  function goWin() {
    addScore(isRain() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    showOverlay(
      'win',
      isRain() ? '核雨通关' : '核殿尽碎',
      '三关打穿，大王已碎。分数 ' + G.score + (isRain() ? ' · 核雨' : ' · 大王') + '。'
    );
    setHint('核殿已碎 · R 再来', 'hot');
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
    G.clearT = 0;
    const st = STAGES[G.stage - 1];
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '核殿'), false, true);
    audio.wave();
    screenFlash(VER, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    dropCycle = 0;
    rainT = 0;
    G.mode = 'play';
    G.kind = kind === 'rain' ? 'rain' : 'king';
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
    G.wpn = 'spread';
    G.power = 0;
    G.charge = 0;
    G.kingOn = false;
    G.kingTx = VW * 0.5;
    G.kingTy = 80;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
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
    G.clearT = 0;
    G.scroll = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 80;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isRain() ? '核雨' : '大王', isRain(), !isRain());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'king';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.wpn = 'spread';
    G.power = 0;
    G.charge = 0;
    G.kingOn = false;
    G.bombs = 3;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 80;
    clearWorld();
    showOverlay('title', '大王', '吃核切换五武。蓄满王核放出寻敌王炮。短关之后是巨大的大王。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('king');
    else startGame(G.kind || 'king');
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
  }

  function updateCharge(dt) {
    if (G.deadT > 0) {
      G.kingOn = false;
      return;
    }
    if (wantFire()) {
      if (!G.kingOn) G.charge = Math.min(1, G.charge + dt * 0.4);
      if (G.charge >= 1 && !G.kingOn) {
        G.kingOn = true;
        G.kingTx = G.ship.x;
        G.kingTy = G.ship.y - 180;
        audio.king();
        hitStop(0.05);
        kick(3.6, 'fan');
        screenFlash(NUC, 0.42);
        floatText(G.ship.x, G.ship.y - 40, '王炮', NUC, true);
        toast('王炮', false, true);
      }
      if (G.kingOn) {
        applyKing(dt);
        G.charge = Math.max(0, G.charge - dt * 0.36);
        if (G.charge <= 0) G.kingOn = false;
      }
    } else {
      G.kingOn = false;
      G.charge = Math.max(0, G.charge - dt * 0.16);
    }
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (wantFire()) fireShot();
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.kind === 'homing') {
        const t = nearestEnemy(s.x, s.y);
        if (t) {
          const a = Math.atan2(t.y - s.y, t.x - s.x);
          const cur = Math.atan2(s.vy, s.vx);
          const da = wrapAng(a - cur);
          const turn = 5.2 * dt;
          const na = cur + clamp(da, -turn, turn);
          const spd = hypot(s.vx, s.vy);
          s.vx = Math.cos(na) * spd;
          s.vy = Math.sin(na) * spd;
        }
      }
      if (s.g) s.vy += s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const out = s.y < -28 || s.x < -24 || s.x > VW + 24 || s.y > VH + 20;
      if (out || s.life <= 0) {
        if (s.kind === 'napalm' && s.life <= 0) napalmBoom(s);
        G.shots.splice(i, 1);
        continue;
      }
      if (s.kind === 'napalm' && s.y > VH - 38) {
        napalmBoom(s);
        G.shots.splice(i, 1);
        continue;
      }
      let dead = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = s.x - e.x;
        const dy = s.y - e.y;
        const rr = e.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          if (s.kind === 'laser' && e.laserId === s.id) continue;
          if (s.kind === 'laser') e.laserId = s.id;
          if (s.kind === 'napalm') {
            napalmBoom(s);
            dead = true;
            break;
          }
          damageEnemy(e, s.dmg, 'shot');
          burst(s.x, s.y, s.rgb || VER, 5, 70);
          if (s.kind === 'laser') {
            s.pierce -= 1;
            if (s.pierce <= 0) {
              dead = true;
              break;
            }
          } else {
            dead = true;
            break;
          }
        }
      }
      if (dead) G.shots.splice(i, 1);
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
          diePlayer();
        }
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.cycleT += dt;
      if (p.cycleT >= 0.62) {
        p.cycleT = 0;
        p.slot = (p.slot + 1) % WPN_CYCLE.length;
        p.kind = WPN_CYCLE[p.slot];
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 16 * dt;
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
    const sea = isRain() ? 0.74 : 1;
    if (e.kind === 'grunt') return 1.45 * sea;
    if (e.kind === 'turret') return 0.92 * sea;
    if (e.kind === 'elite') return 0.82 * sea;
    if (e.kind === 'carrier') return 1.05 * sea;
    if (e.kind === 'drip') return 1.2 * sea;
    if (e.kind === 'pod') return 1.05 * sea;
    if (e.kind === 'boss') return 0.52 * sea;
    return 1.2 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'grunt') {
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
    } else if (e.kind === 'drip') {
      e.x = e.baseX + Math.sin(e.t * 1.6 + e.phase) * 28;
      e.y += e.vy * dt;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 24) {
        ringFire(e, 6, bulletSpd() * 0.62, e.t);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'pod') {
      const b = findBoss();
      const cx = b ? b.x : VW * 0.5;
      const cy = b ? b.y : 120;
      e.ang += dt * 1.25;
      e.x = cx + Math.cos(e.ang) * e.rad;
      e.y = cy + Math.sin(e.ang) * e.rad * 0.48;
      if (G.mode === 'play' && e.fireCd <= 0) {
        aimedFire(e, 1, 0, bulletSpd() * 0.9);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'boss') {
      const park = e.form === 'king' ? 132 : e.form === 'fort' ? 118 : 108;
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, park, 1 - Math.exp(-dt * 2.6));
      } else {
        const sway = e.form === 'king' ? 48 : 86;
        e.x = VW * 0.5 + Math.sin(e.t * 0.55) * sway;
        e.y = park + Math.sin(e.t * 0.9) * 8;
      }
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.15 : 2.1);
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      const rain = isRain() ? 0.78 : 1;
      if (ratio > 0.66) {
        aimedFire(e, e.form === 'king' ? 7 : 5, 0.16, spd);
        if (Math.random() < 0.5) ringFire(e, e.form === 'king' ? 12 : 8, spd * 0.7, e.spin);
        e.fireCd = 1.12 * rain;
      } else if (ratio > 0.33) {
        ringFire(e, e.form === 'king' ? 14 : 10, spd * 0.78, e.spin);
        if ((e.pattern++ % 2) === 0) aimedFire(e, 5, 0.14, spd);
        e.fireCd = 0.5 * rain;
      } else {
        ringFire(e, 12, spd * 0.8, e.spin);
        ringFire(e, 8, spd * 0.55, -e.spin * 0.7);
        aimedFire(e, 5, 0.12, spd * 1.05);
        if ((e.pattern++ % 3) === 0) {
          spawnGrunt(e.x - 50, e.y + 24, -28, 108);
          spawnGrunt(e.x + 50, e.y + 24, 28, 108);
        }
        e.fireCd = 0.4 * rain;
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
      if (e.y > VH + 50 || e.x < -60 || e.x > VW + 60) {
        if (e.kind !== 'boss' && e.kind !== 'pod') {
          e.alive = false;
          G.enemies.splice(i, 1);
        }
        continue;
      }
      if (canHurt && !e.ground) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const hitR = e.kind === 'boss' ? e.r * 0.52 : e.r * 0.7;
        const rr = hitR + HIT_R;
        if (dx * dx + dy * dy < rr * rr) diePlayer();
      }
    }
  }

  function updateRainFall(dt) {
    if (!isRain() || G.mode !== 'play' || G.deadT > 0) return;
    rainT -= dt;
    if (rainT > 0) return;
    rainT = hasBoss() ? 0.38 : 0.55;
    const x = 24 + Math.random() * (VW - 48);
    enemyShot(x, -8, rand(-18, 18), 92 + Math.random() * 30, 3.1, NUC);
  }

  function updateWaves(dt) {
    if (hasBoss()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
    if (G.waveI >= st.waves.length && !hasBoss() && living() === 0 && G.clearT <= 0 && G.winT <= 0) {
      G.gapT += dt;
      if (G.gapT >= 1.2) {
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
    if (G.clearT > 0) {
      G.clearT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updatePows(dt);
      updateShip(dt);
      if (G.clearT <= 0) nextStage();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateCharge(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updatePows(dt);
    updateRainFall(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathTrap(c, x, y, hw, h, peak) {
    c.beginPath();
    c.moveTo(sx(x), sy(y - h * (peak || 0.55)));
    c.lineTo(sx(x + hw), sy(y + h * 0.45));
    c.lineTo(sx(x - hw), sy(y + h * 0.45));
    c.closePath();
  }

  function pathBox(c, x, y, w, h) {
    c.beginPath();
    c.moveTo(sx(x - w), sy(y - h));
    c.lineTo(sx(x + w), sy(y - h));
    c.lineTo(sx(x + w * 0.78), sy(y + h));
    c.lineTo(sx(x - w * 0.78), sy(y + h));
    c.closePath();
  }

  function pathCrown(c, x, y, w, h) {
    c.beginPath();
    c.moveTo(sx(x - w), sy(y + h * 0.4));
    c.lineTo(sx(x - w * 0.72), sy(y - h * 0.15));
    c.lineTo(sx(x - w * 0.38), sy(y - h));
    c.lineTo(sx(x), sy(y - h * 0.35));
    c.lineTo(sx(x + w * 0.38), sy(y - h));
    c.lineTo(sx(x + w * 0.72), sy(y - h * 0.15));
    c.lineTo(sx(x + w), sy(y + h * 0.4));
    c.closePath();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0c0504';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(70), 8 * scale, sx(VW * 0.5), sy(VH * 0.42), 400 * scale);
    g.addColorStop(0, 'rgba(255,58,28,0.16)');
    g.addColorStop(0.45, 'rgba(255,140,32,0.05)');
    g.addColorStop(1, 'rgba(12,5,4,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const yOff = G.scroll * 0.5;
    for (let col = 0; col < 6; col++) {
      const x = 40 + col * 72;
      const seed = col * 19.1 + G.stage * 4;
      for (let row = -2; row < 12; row++) {
        const hgt = 70 + hash(seed + row) * 90;
        const y = ((row * 110 - yOff) % (110 * 10) + 110 * 10) % (110 * 10) - 50;
        c.fillStyle = 'rgba(42,12,8,' + (0.4 + hash(seed + row + 3) * 0.3) + ')';
        pathTrap(c, x + 20, y + hgt * 0.4, 22 + hash(seed + row) * 10, hgt, 0.7);
        c.fill();
        c.strokeStyle = 'rgba(255,58,28,0.16)';
        c.lineWidth = Math.max(0.6, 0.7 * scale);
        pathTrap(c, x + 20, y + hgt * 0.4, 22 + hash(seed + row) * 10, hgt, 0.7);
        c.stroke();
        if (hash(seed + row + 7) > 0.55) {
          c.fillStyle = rgba(hash(seed + row + 9) > 0.5 ? NUC : VER, 0.22);
          c.fillRect(sx(x + 12), sy(y + 16), 8 * scale, 5 * scale);
        }
      }
    }

    c.fillStyle = 'rgba(28,8,6,0.78)';
    c.fillRect(sx(0), sy(0), 32 * scale, VH * scale);
    c.fillRect(sx(VW - 32), sy(0), 32 * scale, VH * scale);
    const wallOff = (G.scroll * 0.72) % 40;
    for (let i = -1; i < 22; i++) {
      const y = i * 40 - wallOff;
      c.fillStyle = 'rgba(255,58,28,0.2)';
      c.fillRect(sx(5), sy(y), 22 * scale, 26 * scale);
      c.fillRect(sx(VW - 27), sy(y + 14), 22 * scale, 26 * scale);
      c.fillStyle = rgba(NUC, 0.28);
      c.beginPath();
      c.arc(sx(12), sy(y + 8), 1.7 * scale, 0, TAU);
      c.arc(sx(VW - 12), sy(y + 20), 1.7 * scale, 0, TAU);
      c.fill();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      c.fillStyle = rgba(p.hot ? VER : NUC, p.a * 0.52);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawBoss(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const R = e.r;
    const form = e.form || 'ridge';
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(VER, 0.14);
    c.beginPath();
    c.ellipse(sx(e.x), sy(e.y), (R + 22) * scale, (R * 0.72) * scale, 0, 0, TAU);
    c.fill();
    c.restore();

    c.fillStyle = rgba(DEEP, 0.96);
    pathBox(c, e.x, e.y + 6, R * 0.95, R * 0.62);
    c.fill();
    c.strokeStyle = rgba(flash ? WHT : VER, 0.95);
    c.lineWidth = Math.max(1.6, 2.1 * scale);
    pathBox(c, e.x, e.y + 6, R * 0.95, R * 0.62);
    c.stroke();

    c.fillStyle = rgba(flash ? WHT : NUC, 0.92);
    pathCrown(c, e.x, e.y - R * 0.28, R * 0.72, R * 0.55);
    c.fill();
    c.strokeStyle = rgba(VER, 0.9);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    pathCrown(c, e.x, e.y - R * 0.28, R * 0.72, R * 0.55);
    c.stroke();

    c.fillStyle = rgba(VER, 0.9);
    c.fillRect(sx(e.x - R * 0.82), sy(e.y - 4), R * 0.28 * scale, R * 0.22 * scale);
    c.fillRect(sx(e.x + R * 0.54), sy(e.y - 4), R * 0.28 * scale, R * 0.22 * scale);

    c.fillStyle = rgba(flash ? WHT : MAG, 0.95);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y + 8), (form === 'king' ? 12 : 8) * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(NUC, 0.95);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y + 8), (form === 'king' ? 6 : 4) * scale, 0, TAU);
    c.fill();

    if (form === 'king' || form === 'fort') {
      c.fillStyle = rgba(CRIM, 0.85);
      c.fillRect(sx(e.x - R * 0.5), sy(e.y + R * 0.35), 10 * scale, 18 * scale);
      c.fillRect(sx(e.x + R * 0.5 - 10), sy(e.y + R * 0.35), 10 * scale, 18 * scale);
    }

    const ratio = clamp(e.hp / e.maxHp, 0, 1);
    const bw = form === 'king' ? 200 : 120;
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillRect(sx(e.x - bw * 0.5), sy(e.y - R - 18), bw * scale, 6 * scale);
    c.fillStyle = rgba(ratio < 0.33 ? MAG : NUC, 0.95);
    c.fillRect(sx(e.x - bw * 0.5), sy(e.y - R - 18), bw * ratio * scale, 6 * scale);
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    if (e.kind === 'boss') {
      drawBoss(e);
      return;
    }
    if (e.kind === 'turret') {
      c.fillStyle = rgba(DEEP, 0.92);
      pathBox(c, e.x, e.y, e.r + 2, e.r * 0.7);
      c.fill();
      c.strokeStyle = rgba(VER, 0.85);
      c.lineWidth = Math.max(1, 1.3 * scale);
      pathBox(c, e.x, e.y, e.r + 2, e.r * 0.7);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : NUC, 0.95);
      c.fillRect(sx(e.x - 2), sy(e.y - 10), 4 * scale, 12 * scale);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 2), 4.2 * scale, 0, TAU);
      c.fill();
      return;
    }
    if (e.kind === 'dive') {
      c.fillStyle = rgba(flash ? WHT : VER, 0.95);
      pathTrap(c, e.x, e.y, 8, 16, 0.7);
      c.fill();
      c.strokeStyle = rgba(NUC, 0.8);
      c.lineWidth = Math.max(0.8, scale);
      pathTrap(c, e.x, e.y, 8, 16, 0.7);
      c.stroke();
      return;
    }
    if (e.kind === 'drip') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(flash ? WHT : NUC, 0.55);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 10 * scale, 14 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(flash ? WHT : VER, 0.95);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 7 * scale, 10 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y - 2), 2.4 * scale, 0, TAU);
      c.fill();
      return;
    }
    const rgb = flash ? WHT : (e.kind === 'elite' || e.kind === 'carrier' ? VER : AMB);
    c.fillStyle = rgba(rgb, 0.95);
    pathBox(c, e.x, e.y, e.r - 1, e.r * 0.7);
    c.fill();
    c.strokeStyle = rgba(NUC, 0.8);
    c.lineWidth = Math.max(0.8, scale);
    pathBox(c, e.x, e.y, e.r - 1, e.r * 0.7);
    c.stroke();
    c.fillStyle = rgba(DEEP, 0.85);
    c.fillRect(sx(e.x - 1.4), sy(e.y - 4), 2.8 * scale, e.r * 0.7 * scale);
    if (e.kind === 'elite' || e.kind === 'carrier' || e.kind === 'pod') {
      c.fillStyle = rgba(e.kind === 'carrier' ? NUC : MAG, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + e.r - 4), 3.2 * scale, 0, TAU);
      c.fill();
      c.fillRect(sx(e.x - 14), sy(e.y - 2), 6 * scale, 4 * scale);
      c.fillRect(sx(e.x + 8), sy(e.y - 2), 6 * scale, 4 * scale);
    }
  }

  function drawKingBeam() {
    if (!G.kingOn || G.deadT > 0) return;
    const c = ctx;
    const x0 = G.ship.x;
    const y0 = G.ship.y - 16;
    const x1 = G.kingTx;
    const y1 = G.kingTy;
    const fade = 0.7 + Math.sin(G.t * 22) * 0.15;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = rgba(VER, 0.22 * fade);
    c.lineWidth = 28 * scale;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(sx(x0), sy(y0));
    c.lineTo(sx(x1), sy(y1));
    c.stroke();
    c.strokeStyle = rgba(NUC, 0.45 * fade);
    c.lineWidth = 14 * scale;
    c.beginPath();
    c.moveTo(sx(x0), sy(y0));
    c.lineTo(sx(x1), sy(y1));
    c.stroke();
    c.strokeStyle = rgba(WHT, 0.85 * fade);
    c.lineWidth = 4.2 * scale;
    c.beginPath();
    c.moveTo(sx(x0), sy(y0));
    c.lineTo(sx(x1), sy(y1));
    c.stroke();
    c.fillStyle = rgba(NUC, 0.55);
    c.beginPath();
    c.arc(sx(x1), sy(y1), 10 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const ang = Math.atan2(s.vy, s.vx);
      const rgb = s.rgb || VER;
      if (s.kind === 'laser') {
        const len = 22 + s.p * 6;
        c.strokeStyle = rgba(rgb, 0.55);
        c.lineWidth = (3.2 + s.p) * scale;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y + 8));
        c.lineTo(sx(s.x), sy(s.y - len));
        c.stroke();
        c.strokeStyle = rgba(WHT, 0.9);
        c.lineWidth = 1.6 * scale;
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y + 4));
        c.lineTo(sx(s.x), sy(s.y - len * 0.7));
        c.stroke();
        continue;
      }
      if (s.kind === 'napalm') {
        c.fillStyle = rgba(rgb, 0.7);
        c.beginPath();
        c.arc(sx(s.x), sy(s.y), (5 + s.p) * scale, 0, TAU);
        c.fill();
        c.fillStyle = rgba(NUC, 0.9);
        c.beginPath();
        c.arc(sx(s.x), sy(s.y), 2.6 * scale, 0, TAU);
        c.fill();
        continue;
      }
      const len = s.kind === 'wide' ? 10 : 12 + s.p * 4;
      const hw = s.w * 0.5;
      c.save();
      c.translate(sx(s.x), sy(s.y));
      c.rotate(ang);
      c.fillStyle = rgba(rgb, 0.55);
      c.beginPath();
      c.moveTo(len * scale, 0);
      c.lineTo(-len * 0.35 * scale, hw * scale);
      c.lineTo(-len * 0.35 * scale, -hw * scale);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.moveTo(len * 0.7 * scale, 0);
      c.lineTo(-len * 0.1 * scale, hw * 0.35 * scale);
      c.lineTo(-len * 0.1 * scale, -hw * 0.35 * scale);
      c.closePath();
      c.fill();
      if (!REDUCE && s.kind !== 'wide') {
        c.strokeStyle = rgba(GOLD, 0.32);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(-len * 1.1 * scale, 0);
        c.stroke();
      }
      c.restore();
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const rgb = b.rgb || MAG;
      c.fillStyle = rgba(rgb, 0.92);
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
      const rgb = WPN_RGB[p.kind] || NUC;
      const pulse = 1 + Math.sin(G.t * 10 + p.t) * 0.12;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(rgb, 0.95);
      c.translate(sx(p.x), sy(p.y));
      c.rotate(p.t * 2);
      c.beginPath();
      c.moveTo(0, -9 * scale * pulse);
      c.lineTo(8 * scale * pulse, 0);
      c.lineTo(0, 9 * scale * pulse);
      c.lineTo(-8 * scale * pulse, 0);
      c.closePath();
      c.fill();
      c.restore();
      c.fillStyle = rgba(WHT, 0.95);
      c.font = (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(WPN_GLYPH[p.kind] || '核', sx(p.x), sy(p.y));
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;
    const core = 0.18 + G.charge * 0.45 + (G.kingOn ? 0.25 : 0);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(G.kingOn ? NUC : VER, core);
    c.beginPath();
    c.ellipse(sx(x), sy(y), (14 + G.charge * 8) * scale, (11 + G.charge * 4) * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(AMB, 0.5);
    c.beginPath();
    c.moveTo(sx(x - 5), sy(y + 8));
    c.lineTo(sx(x), sy(y + 18 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x + 5), sy(y + 8));
    c.fill();
    c.restore();

    c.fillStyle = rgba(VER, 0.96);
    pathTrap(c, x, y + 2, 13, 22, 0.62);
    c.fill();
    c.strokeStyle = rgba(NUC, 0.95);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    pathTrap(c, x, y + 2, 13, 22, 0.62);
    c.stroke();

    c.fillStyle = rgba(WHT, 0.95);
    pathTrap(c, x, y - 2, 5, 12, 0.7);
    c.fill();

    c.fillStyle = rgba(G.kingOn ? NUC : MAG, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y + 2), (2.6 + G.charge * 2.2) * scale, 0, TAU);
    c.fill();

    c.fillStyle = rgba(NUC, 0.9);
    c.fillRect(sx(x - 12), sy(y + 4), 5 * scale, 3 * scale);
    c.fillRect(sx(x + 7), sy(y + 4), 5 * scale, 3 * scale);

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 16), (5 + G.power) * scale, 0, TAU);
      c.fill();
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
      c.fillStyle = rgba(q.rgb, a);
      c.beginPath();
      c.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      c.fill();
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
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    if (G.bombFlash > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(NUC, G.bombFlash * 0.9);
      c.lineWidth = 3 * scale;
      c.beginPath();
      c.arc(sx(G.ship.x), sy(G.ship.y), (30 + (1 - G.bombFlash) * 150) * scale, 0, TAU);
      c.stroke();
      c.fillStyle = rgba(VER, G.bombFlash * 0.12);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
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
    ctx.fillStyle = '#160806';
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
    ctx.fillStyle = '#160806';
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
    drawKingBeam();
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
      startGame('king');
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
      startGame('king');
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

  if (btnKing) {
    btnKing.addEventListener('click', function () {
      audio.ensure();
      startGame('king');
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
      startGame(G.kind || 'king');
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
