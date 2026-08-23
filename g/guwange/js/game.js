'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 4.6;
  const SHOT_V = 760;
  const LOCK_R = 86;
  const SPIRIT_Y = 168;
  const BEST_KEY = 'playbox-guwange-best';
  const MUTE_KEY = 'playbox-guwange-mute';
  const AUTO_SPEED_KEY = 'playbox-guwange-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.48, 0.72, 1, 2.55];
  const OPS = '←↑↓→ / WASD 移动 · 空格射箭 · Shift / Z 锁定 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const ROSE = [239, 57, 142];
  const MAG = [255, 61, 138];
  const CYN = [122, 244, 232];
  const GOLD = [255, 196, 90];
  const LAN = [255, 154, 74];
  const WHT = [255, 240, 244];
  const PNK = [255, 154, 196];
  const RED = [255, 86, 110];
  const DEEP = [26, 8, 18];
  const INK = [18, 6, 14];

  const SCORE = {
    lamp: 50,
    dive: 80,
    shrine: 120,
    gate: 150,
    wraith: 240,
    pod: 280,
    soul: 30,
    boss: 8000,
    chip: 10,
    stage: 1500
  };

  const STAGES = [
    {
      name: '灯巷',
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.1, kind: 'stream', dir: 1 },
        { t: 5.6, kind: 'v', n: 7 },
        { t: 8.0, kind: 'gates' },
        { t: 10.4, kind: 'dive', n: 4 },
        { t: 12.8, kind: 'shrine' },
        { t: 15.2, kind: 'v', n: 7 },
        { t: 17.6, kind: 'stream', dir: -1 }
      ]
    },
    {
      name: '鸟居',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.5, kind: 'dive', n: 5 },
        { t: 4.6, kind: 'stream', dir: -1 },
        { t: 6.8, kind: 'shrine' },
        { t: 8.4, kind: 'shrine' },
        { t: 10.2, kind: 'gates' },
        { t: 12.2, kind: 'wraith' },
        { t: 14.4, kind: 'v', n: 9 },
        { t: 16.6, kind: 'dive', n: 6 },
        { t: 18.8, kind: 'stream', dir: 1 }
      ]
    },
    {
      name: '冥核',
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.3, kind: 'dive', n: 5 },
        { t: 4.2, kind: 'wraith' },
        { t: 6.2, kind: 'gates' },
        { t: 8.0, kind: 'shrine' },
        { t: 9.6, kind: 'v', n: 9 },
        { t: 13.4, kind: 'boss' }
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
  const btnHunt = document.getElementById('btn-hunt');
  const btnSea = document.getElementById('btn-sea');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const btnLock = document.getElementById('btn-lock');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const lockBar = document.getElementById('lock-bar');
  const lockWrap = document.getElementById('lock-wrap');

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

  const keys = { l: false, r: false, u: false, d: false, sht: false, lock: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const embers = [];
  const lanterns = [];

  const G = {
    mode: 'title',
    kind: 'hunt',
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
    enemies: [],
    shots: [],
    bolts: [],
    bullets: [],
    souls: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    spirit: { x: VW * 0.5, y: VH - 96, on: false, n: 0, fireCd: 0 },
    lockToggle: false,
    padLock: false,
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: ROSE,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    lockBuzz: 0
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoTx = VW * 0.5;
  let autoTy = VH - 78;
  let autoStickS = -1e9;
  let autoOvWait = 0;

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
  function dens() {
    return isSea() ? 1.28 : 1;
  }
  function shipSpeed() {
    return isSea() ? 318 : 276;
  }
  function fireRate() {
    return isSea() ? 0.078 : 0.088;
  }
  function bulletSpd() {
    return isSea() ? 186 : 146;
  }
  function scrollSpd() {
    if (hasBoss()) return 22;
    return isSea() ? 124 : 88;
  }
  function hpMul() {
    return isSea() ? 1.22 : 1;
  }
  function lockCap() {
    return isSea() ? 7 : 5;
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
      this.beep(980, 0.04, 'square', 0.026, 1560);
      this.beep(520, 0.05, 'triangle', 0.018, 220);
    },
    lockOn() {
      this.ensure();
      this.beep(220, 0.12, 'sine', 0.04, 660);
      this.beep(880, 0.16, 'triangle', 0.034, 1760);
      this.beep(1320, 0.2, 'sine', 0.028, 1980);
      this.noise(0.1, 0.03, 700);
    },
    lockHum() {
      this.ensure();
      this.beep(180, 0.08, 'sine', 0.016, 320);
      this.beep(740, 0.05, 'triangle', 0.012, 1100);
    },
    lockPing() {
      this.ensure();
      this.beep(1180, 0.05, 'sine', 0.028, 1760);
    },
    bolt() {
      this.ensure();
      this.beep(640, 0.035, 'triangle', 0.02, 1280);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.028, 0.026, 1600);
      this.beep(720 * lift, 0.055, 'square', 0.034, 1100 * lift);
    },
    soul(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.7, combo * 0.035);
      this.beep(660 * lift, 0.07, 'sine', 0.034, 1320 * lift);
      this.beep(990 * lift, 0.1, 'triangle', 0.022, 1760 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.038, 587 * m);
      this.beep(784, 0.12, 'triangle', 0.028, 1175);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(260, 0.14, 'sawtooth', 0.042, 70);
    },
    bossHit() {
      this.ensure();
      this.beep(220, 0.055, 'sawtooth', 0.036, 160);
      this.beep(580, 0.07, 'square', 0.028, 880);
    },
    bossDie() {
      this.ensure();
      this.noise(0.22, 0.06, 260);
      this.beep(160, 0.28, 'sawtooth', 0.05, 46);
      this.beep(480, 0.2, 'triangle', 0.04, 200);
      this.beep(960, 0.32, 'sine', 0.04, 1480);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 380);
      this.beep(300, 0.16, 'sawtooth', 0.05, 80);
      this.beep(160, 0.28, 'sine', 0.045, 48);
    },
    wave() {
      this.ensure();
      this.beep(349, 0.09, 'sine', 0.04, 440);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.04, 80);
      this.beep(130, 0.3, 'sine', 0.05, 44);
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
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(880, 0.14, 'triangle', 0.035, 1320);
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

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
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

  function syncLockBtns() {
    const on = G.spirit.on;
    if (btnLock) {
      btnLock.classList.toggle('on', on || G.lockToggle);
      btnLock.setAttribute('aria-pressed', on || G.lockToggle ? 'true' : 'false');
    }
    if (btnPad) btnPad.classList.toggle('on', on || G.padLock);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '弓眼';
      else if (hasBoss()) stageLabel.textContent = '弓眼';
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isSea() ? '怨海' : '狩灵';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isSea());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.spirit.on);
    }
    if (wpnLabel) {
      wpnLabel.textContent = G.spirit.on ? '锁' : '矢';
      wpnLabel.classList.toggle('lock', G.spirit.on);
    }
    if (lockBar) {
      const p = G.spirit.on ? clamp(G.spirit.n / lockCap(), 0.18, 1) : 0;
      lockBar.style.transform = 'scaleX(' + p + ')';
    }
    if (lockWrap) lockWrap.classList.toggle('hot', G.spirit.on && G.spirit.n > 0);
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (autoOn && (G.mode === 'play' || G.mode === 'title')) setHint('托管中 · A 停下', 'hot');
    else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) setHint('托管中 · R 重开接着打', 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格射箭，Shift 锁敌', 'warn');
    else if (G.mode === 'win') setHint('冥核已碎 · R 再来', 'hot');
    else if (G.spirit.on) setHint('式神锁定 · 锁杀掉魂 · 舰可躲开', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 锁敌续链', 'warn');
    else setHint('空格射箭 · Shift 式神锁敌 · 锁杀掉魂 · A 自动', '');
    syncPips();
    syncLockBtns();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GUWA';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.5 ? 'lock' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('lock');
    stageEl.classList.remove('boss');
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
        g: 160,
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
    lanterns.length = 0;
    for (let i = 0; i < 64; i++) {
      embers.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.0),
        a: rand(0.16, 0.62),
        z: rand(0.35, 1.15)
      });
    }
    for (let i = 0; i < 8; i++) {
      lanterns.push({
        x: i % 2 === 0 ? rand(10, 34) : rand(VW - 34, VW - 10),
        y: rand(0, VH),
        bob: rand(0, TAU),
        s: rand(0.75, 1.15)
      });
    }
  }

  function spawnSoul(x, y) {
    G.souls.push({
      x: x,
      y: y,
      vx: rand(-50, 50),
      vy: rand(16, 64),
      t: 0,
      spin: rand(0, TAU)
    });
    capArr(G.souls, 80);
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss' || spec.kind === 'pod';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'lamp',
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
      score: spec.score || SCORE.lamp,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0,
      locked: 0
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

  function spawnLamp(x, y, vx, vy) {
    spawnEnemy({
      kind: 'lamp',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 96 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: SCORE.lamp,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx) {
    const c = cx == null ? VW * 0.5 : cx;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnLamp(c + k * 36, -26 - Math.abs(k) * 16, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isSea() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'lamp',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 88 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: SCORE.lamp,
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

  function spawnShrine(x) {
    spawnEnemy({
      kind: 'shrine',
      x: x == null ? (Math.random() < 0.5 ? 120 : 360) : x,
      y: -32,
      vy: 62 * dens(),
      hp: 5,
      r: 15,
      amp: 70,
      score: SCORE.shrine,
      fireCd: 0.45
    });
  }

  function spawnGates() {
    const n = isSea() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'gate',
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18,
        vy: 44 * dens(),
        hp: 6,
        r: 14,
        score: SCORE.gate,
        fireCd: 0.55 + i * 0.1
      });
    }
  }

  function spawnWraith() {
    spawnEnemy({
      kind: 'wraith',
      x: 150,
      vy: 58 * dens(),
      hp: 10,
      r: 17,
      amp: 86,
      score: SCORE.wraith,
      fireCd: 0.5
    });
    spawnEnemy({
      kind: 'wraith',
      x: 330,
      vy: 58 * dens(),
      hp: 10,
      r: 17,
      amp: 86,
      phase: 1.6,
      score: SCORE.wraith,
      fireCd: 0.7
    });
  }

  function spawnBoss() {
    const sea = isSea();
    const boss = spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: sea ? 118 : 90,
      r: 36,
      score: SCORE.boss,
      enter: 1.35,
      fireCd: 0.9
    });
    boss.maxHp = boss.hp;
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 + 72,
      y: 30,
      hp: sea ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: 0,
      rad: 82,
      fireCd: 0.8
    });
    spawnEnemy({
      kind: 'pod',
      x: VW * 0.5 - 72,
      y: 30,
      hp: sea ? 16 : 12,
      r: 13,
      score: SCORE.pod,
      ang: Math.PI,
      rad: 82,
      fireCd: 1.05
    });
    toast('弓眼', false, true);
    audio.wave();
    screenFlash(ROSE, 0.36);
    kick(4.6, 'boss');
    syncHud();
    return boss;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isSea() ? 2 : 0), w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n + (isSea() ? 1 : 0));
    else if (w.kind === 'shrine') {
      spawnShrine(140);
      spawnShrine(340);
      if (isSea()) spawnShrine(240);
    } else if (w.kind === 'gates') spawnGates();
    else if (w.kind === 'wraith') spawnWraith();
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

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function wantLock() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.lock || G.lockToggle || G.padLock);
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.055;
    const extra = G.combo >= 6 ? 1 : 0;
    for (let i = -1; i <= 1; i++) {
      if (i === 0 && !extra) continue;
      const a = -Math.PI * 0.5 + i * 0.09;
      G.shots.push({
        x: G.ship.x + i * 6,
        y: G.ship.y - 16,
        vx: Math.cos(a) * SHOT_V,
        vy: Math.sin(a) * SHOT_V,
        r: 3.2,
        dmg: 1,
        kind: 'arrow'
      });
    }
    capArr(G.shots, 48);
    audio.shoot();
  }

  function engageSpirit() {
    G.spirit.on = true;
    audio.lockOn();
    hitStop(0.048);
    kick(3.8, 'lock');
    screenFlash(CYN, 0.34);
    ring(G.spirit.x, G.spirit.y, CYN);
    burst(G.spirit.x, G.spirit.y, ROSE, 16, 180);
    floatText(G.spirit.x, G.spirit.y - 18, '锁', CYN, true);
    if (wpnLabel) {
      wpnLabel.classList.remove('hot');
      void wpnLabel.offsetWidth;
      wpnLabel.classList.add('hot');
      wpnTok += 1;
    }
    syncHud();
  }

  function releaseSpirit() {
    G.spirit.on = false;
    G.spirit.n = 0;
    for (let i = 0; i < G.enemies.length; i++) G.enemies[i].locked = 0;
    syncHud();
  }

  function pickLocks() {
    const cap = lockCap();
    const list = [];
    const sx0 = G.spirit.x;
    const sy0 = G.spirit.y;
    const rr = LOCK_R * LOCK_R;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dx = e.x - sx0;
      const dy = e.y - sy0;
      const d2 = dx * dx + dy * dy;
      if (d2 < rr) list.push({ e: e, d2: d2, was: e.locked });
    }
    list.sort(function (a, b) { return a.d2 - b.d2; });
    for (let i = 0; i < G.enemies.length; i++) G.enemies[i].locked = 0;
    let n = 0;
    let fresh = false;
    for (let i = 0; i < list.length && n < cap; i++) {
      list[i].e.locked = 1;
      n += 1;
      if (!list[i].was) fresh = true;
    }
    G.spirit.n = n;
    if (fresh) audio.lockPing();
  }

  function fireBolts() {
    if (G.spirit.fireCd > 0) return;
    if (G.spirit.n <= 0) return;
    G.spirit.fireCd = isSea() ? 0.09 : 0.11;
    let shot = false;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || !e.locked) continue;
      const a = Math.atan2(e.y - G.spirit.y, e.x - G.spirit.x);
      G.bolts.push({
        x: G.spirit.x,
        y: G.spirit.y,
        vx: Math.cos(a) * 420,
        vy: Math.sin(a) * 420,
        r: 3.4,
        dmg: 1,
        life: 1.6,
        tx: e
      });
      shot = true;
    }
    capArr(G.bolts, 48);
    if (shot) audio.bolt();
  }

  function updateSpirit(dt) {
    const on = wantLock();
    if (on && !G.spirit.on) engageSpirit();
    if (!on && G.spirit.on) releaseSpirit();
    const tx = G.ship.x;
    const ty = G.spirit.on ? G.ship.y - SPIRIT_Y : G.ship.y - 18;
    const follow = G.spirit.on ? 3.05 : 10;
    const rise = G.spirit.on ? 7.2 : 12;
    G.spirit.x = lerp(G.spirit.x, tx, 1 - Math.exp(-dt * follow));
    G.spirit.y = lerp(G.spirit.y, ty, 1 - Math.exp(-dt * rise));
    G.spirit.y = clamp(G.spirit.y, 28, VH - 24);
    G.spirit.x = clamp(G.spirit.x, 22, VW - 22);
    if (G.spirit.fireCd > 0) G.spirit.fireCd -= dt;
    if (G.spirit.on) {
      pickLocks();
      fireBolts();
      G.lockBuzz -= dt;
      if (G.lockBuzz <= 0) {
        G.lockBuzz = 0.16;
        audio.lockHum();
      }
    } else {
      G.spirit.n = 0;
    }
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (src === 'shot' || src === 'bolt') {
      spark(e.x, e.y, src === 'bolt' ? CYN : GOLD);
      hitStop(src === 'bolt' ? 0.03 : 0.034);
      audio.hit(G.combo);
      kick(1.7);
    }
    if (e.kind === 'boss' && src !== 'bolt') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const locked = e.locked || src === 'bolt';
    const rgb = e.kind === 'boss' ? GOLD : e.kind === 'wraith' || e.kind === 'shrine' ? ROSE : LAN;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 44 : e.kind === 'wraith' ? 22 : 14);
    const pts = Math.round(e.score * G.mult * (locked ? 1.25 : 1));
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss');
    if (locked && e.kind !== 'boss') {
      spawnSoul(e.x, e.y);
      burst(e.x, e.y, CYN, 10, 140);
    }
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(GOLD, 0.72);
      burst(e.x, e.y, ROSE, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, GOLD);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      G.bullets.length = 0;
      G.winT = 1.35;
      toast('弓眼碎裂', false, true);
    } else if (e.kind === 'wraith' || e.kind === 'pod' || e.kind === 'shrine') {
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
    releaseSpirit();
    G.lockToggle = false;
    G.padLock = false;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, GOLD, 18);
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
    G.spirit.x = G.ship.x;
    G.spirit.y = G.ship.y - 18;
    G.invuln = 1.5;
    G.deadT = 0;
    releaseSpirit();
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    releaseSpirit();
    audio.lose();
    showOverlay('lose', '魂散了', '空格射灵矢，Shift 放出式神锁敌。锁杀掉魂。分数 ' + G.score + '。');
    setHint('R 重开 · 空格射箭，Shift 锁敌', 'warn');
  }

  function goWin() {
    addScore(isSea() ? 10000 : 8000);
    G.mode = 'win';
    releaseSpirit();
    audio.win();
    showOverlay(
      'win',
      isSea() ? '怨海通关' : '冥核尽碎',
      '三关打穿，弓眼已碎。分数 ' + G.score + (isSea() ? ' · 怨海' : ' · 狩灵') + '。'
    );
    setHint('冥核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bolts.length = 0;
    G.bullets.length = 0;
    G.souls.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * G.mult));
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    const st = STAGES[G.stage - 1];
    toast('第 ' + G.stage + ' 关 · ' + (st ? st.name : '冥核'), false, true);
    audio.wave();
    screenFlash(ROSE, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'sea' ? 'sea' : 'hunt';
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
    G.lockToggle = false;
    G.padLock = false;
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
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.spirit.x = VW * 0.5;
    G.spirit.y = VH - 96;
    G.spirit.on = false;
    G.spirit.n = 0;
    G.spirit.fireCd = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isSea() ? '怨海' : '狩灵', isSea(), !isSea());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'hunt';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.lockToggle = false;
    G.padLock = false;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.spirit.x = VW * 0.5;
    G.spirit.y = VH - 110;
    G.spirit.on = false;
    clearWorld();
    showOverlay('title', '弓眼', '纵卷夜巷。空格射灵矢，Shift 放出式神锁敌。锁杀掉魂，短关之后是弓眼。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('hunt');
    else startGame(G.kind || 'hunt');
  }

  function collectSoul(s) {
    const pts = Math.round(SCORE.soul * G.mult);
    addScore(pts);
    if (G.combo >= 1) bumpCombo();
    else {
      G.combo = 1;
      G.comboT = COMBO_WIN;
      G.mult = 1;
    }
    burst(s.x, s.y, CYN, 8, 90);
    audio.soul(G.combo);
    syncHud();
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
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < embers.length; i++) {
      const s = embers[i];
      s.y += scr * 0.4 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < lanterns.length; i++) {
      const L = lanterns[i];
      L.y += scr * 0.55 * dt;
      L.bob += dt * 1.6;
      if (L.y > VH + 28) {
        L.y = -24;
        L.x = i % 2 === 0 ? rand(10, 34) : rand(VW - 34, VW - 10);
      }
    }
  }

  function autoClearInput() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.sht = false;
    keys.lock = false;
    pointer.down = false;
    G.lockToggle = false;
    G.padLock = false;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl) return;
    speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoClearInput();
    autoTx = G.ship.x;
    autoTy = G.ship.y;
    autoStickS = -1e9;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('hunt');
    }
    syncHud();
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.22 : 0.48)) {
        autoOvWait = 0;
        autoTx = VW * 0.5;
        autoTy = VH - 78;
        autoStickS = -1e9;
        startGame('hunt');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.65 : 1.1)) {
        autoOvWait = 0;
        autoTx = VW * 0.5;
        autoTy = VH - 78;
        autoStickS = -1e9;
        startGame(G.kind || 'hunt');
      }
    }
  }

  function autoDanger(x, y, horizon) {
    let d = 0;
    const look = horizon;
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const relx = b.x - x;
      const rely = b.y - y;
      const vv = b.vx * b.vx + b.vy * b.vy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * b.vx + rely * b.vy) / vv, 0, look);
      const dist = hypot(relx + b.vx * t, rely + b.vy * t);
      const rad = HIT_R + b.r * 0.55 + 1.2;
      if (t <= look && dist < rad + 34) {
        const soon = (look - t) / Math.max(0.08, look);
        d += Math.max(0.5, rad + 12 - dist) * soon * 26;
        if (dist < rad) d += 260 * soon;
      }
    }
    const den = dens();
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      let evx = e.vx || 0;
      let evy = e.vy || 0;
      if (e.kind === 'dive' && e.t > 0.35) {
        const a = Math.atan2(y - e.y, x - e.x);
        evx = Math.cos(a) * 210 * den;
        evy = Math.sin(a) * 240 * den;
      }
      const relx = e.x - x;
      const rely = e.y - y;
      const vv = evx * evx + evy * evy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * evx + rely * evy) / vv, 0, look);
      const dist = hypot(relx + evx * t, rely + evy * t);
      const r = e.r * (e.kind === 'boss' ? 0.62 : 0.7);
      const hitR = HIT_R + r;
      if (dist < hitR + 28) {
        const soon = (look - t) / Math.max(0.08, look);
        const w = e.kind === 'dive' ? 34 : e.kind === 'boss' ? 14 : 18;
        d += Math.max(0.4, hitR + 14 - dist) * soon * w;
        if (dist < hitR) d += 250 * soon;
      }
      if (hypot(e.x - x, e.y - y) < hitR + 8) d += 120;
    }
    return d;
  }

  function autoThink() {
    if (!autoOn) return;
    if (G.mode !== 'play' || G.deadT > 0) {
      keys.sht = false;
      keys.lock = false;
      return;
    }

    const sea = isSea();
    const horizon = sea ? 0.62 : 0.5;
    const boss = findBoss();
    const px = G.ship.x;
    const py = G.ship.y;
    let aimX = VW * 0.5;
    let aimY = null;
    let aimW = -1e9;
    let cluster = 0;
    let colHp = 0;
    let nearBullets = 0;
    let colBullets = 0;
    let grazeN = 0;
    let lockN = 0;
    let pick = null;
    let pickW = -1e9;

    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.y < -36 || e.y > py + 20) continue;
      let w = 32;
      if (e.kind === 'dive') w = 70;
      else if (e.kind === 'shrine') w = 96;
      else if (e.kind === 'gate') w = 88;
      else if (e.kind === 'wraith') w = 130;
      else if (e.kind === 'pod') w = 110;
      else if (e.kind === 'boss') w = 280;
      else w = 36 + (e.hp || 1) * 8;
      w += e.hp * 6;
      w -= Math.abs(e.x - px) * 0.22;
      w -= Math.max(0, py - e.y) * 0.06;
      if (e.y > 40 && e.y < py - 10) w += 22;
      if (Math.abs(e.x - px) < 14 && e.y < py) colHp += e.hp;
      const sdx = e.x - px;
      const sdy = e.y - (py - SPIRIT_Y);
      if (sdx * sdx + sdy * sdy < LOCK_R * LOCK_R) lockN += 1;
      if (w > aimW) {
        aimW = w;
        aimX = e.x;
        aimY = e.y;
      }
    }
    if (aimY != null) {
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (!e.alive) continue;
        if (Math.abs(e.x - aimX) < 28 && e.y < py) cluster += 1;
      }
    }

    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const dist = hypot(b.x - px, b.y - py);
      if (dist < 130) nearBullets += 1;
      if (Math.abs(b.x - px) < 12 && b.y < py && b.y > py - 280) colBullets += 1;
      const hitR = HIT_R + b.r * 0.55;
      if (dist > hitR + 6 && dist < hitR + 28) grazeN += 1;
    }

    for (let i = 0; i < G.souls.length; i++) {
      const s = G.souls[i];
      let w = 78 - hypot(s.x - px, s.y - py) * 0.45;
      if (s.y > py - 40) w += 22;
      if (w > pickW) {
        pickW = w;
        pick = s;
      }
    }

    const hereDang = autoDanger(px, py, horizon);
    const panic = hereDang > 92 || (G.lives <= 1 && hereDang > 58);
    const dense = nearBullets >= (sea ? 6 : 8);
    const grabSoul = pick && (G.invuln > 0.2 || autoDanger(pick.x, pick.y, 0.28) < 36 || hypot(pick.x - px, pick.y - py) < 70);

    let desiredX = aimY != null ? aimX : VW * 0.5;
    let desiredY = VH - 78;
    if (boss) desiredY = clamp(boss.y + SPIRIT_Y, 240, VH - 78);
    else if (aimY != null) desiredY = clamp(aimY + SPIRIT_Y * 0.72, 210, VH - 72);
    if (panic) desiredY = clamp(py + 28, 220, VH - 32);
    else if (hereDang > 50) desiredY = Math.max(desiredY, VH - 64);
    if (colBullets >= 2) desiredY = Math.max(desiredY, VH - 70);
    if (grabSoul && pick && !panic) {
      desiredX = pick.x;
      desiredY = clamp(pick.y, 80, VH - 32);
    }

    const xMin = 28;
    const xMax = VW - 28;
    const yMin = 70;
    const yMax = VH - 28;
    let bestX = clamp(autoTx, xMin, xMax);
    let bestY = clamp(autoTy, yMin, yMax);
    let bestS = -1e15;

    function consider(x, y) {
      x = clamp(x, xMin, xMax);
      y = clamp(y, yMin, yMax);
      let s = -autoDanger(x, y, horizon) * (sea ? 7.4 : 6.1);
      s -= Math.abs(x - desiredX) * (boss || cluster >= 3 ? 1.05 : 0.55);
      s -= Math.abs(y - desiredY) * 0.72;
      s -= hypot(x - px, y - py) * 0.1;
      if (y < 140) s -= 28;
      if (y > VH - 36) s -= 6;
      if (x < 40 || x > VW - 40) s -= 12;
      if (aimY != null && Math.abs(x - aimX) < 12) s += 22;
      if (colHp > 0 && Math.abs(x - px) < 10) s += 10;
      if (grabSoul && pick) s -= hypot(x - pick.x, y - pick.y) * 0.5;
      if (!panic && grazeN > 0) {
        for (let i = 0; i < G.bullets.length; i++) {
          const b = G.bullets[i];
          const dist = hypot(b.x - x, b.y - y);
          const hitR = HIT_R + b.r * 0.55;
          if (dist > hitR + 6 && dist < hitR + 24) s += (24 - (dist - hitR)) * 0.42;
        }
      }
      if (s > bestS) {
        bestS = s;
        bestX = x;
        bestY = y;
      }
    }

    consider(px, py);
    consider(autoTx, autoTy);
    consider(desiredX, desiredY);
    for (let ix = 0; ix < 9; ix++) {
      const x = 40 + ix * ((VW - 80) / 8);
      for (let iy = 0; iy < 8; iy++) {
        consider(x, 96 + iy * ((VH - 140) / 7));
      }
    }
    if (aimY != null) {
      consider(aimX, desiredY);
      consider(aimX, py);
      consider(px, desiredY);
      consider(aimX - 48, desiredY);
      consider(aimX + 48, desiredY);
      consider(aimX, Math.min(VH - 40, aimY + 120));
    }
    if (grabSoul && pick) consider(pick.x, pick.y);
    consider(px - 70, py);
    consider(px + 70, py);
    consider(px, py - 56);
    consider(px, py + 48);
    consider(px - 36, py - 28);
    consider(px + 36, py - 28);

    const switchGap = hereDang > 48 ? 6 : 20;
    if (bestS > autoStickS + switchGap || hereDang > 55 || hypot(autoTx - px, autoTy - py) < 5) {
      autoTx = bestX;
      autoTy = bestY;
      autoStickS = bestS;
    }

    keys.sht = true;
    const wantBomb = panic || dense || (boss && (nearBullets >= 4 || colBullets >= 2)) || cluster >= 3 || lockN >= 1 || (aimY != null && G.spirit.on);
    keys.lock = !!wantBomb;
  }

  function updateShip(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = shipSpeed();
    let dx = 0;
    let dy = 0;
    if (autoOn) {
      const ax = autoTx - G.ship.x;
      const ay = autoTy - G.ship.y;
      const d = hypot(ax, ay);
      const boost = autoSpeed >= 4 ? 1.22 : autoSpeed >= 3 ? 1.06 : autoSpeed <= 1 ? 0.86 : 0.96;
      const max = spd * dt * boost;
      if (d > 1.2) {
        const k = Math.min(1, max / d);
        G.ship.x += ax * k;
        G.ship.y += ay * k;
        G.ship.vx = (ax * k) / Math.max(dt, 0.016);
        G.ship.vy = (ay * k) / Math.max(dt, 0.016);
      } else {
        G.ship.vx = 0;
        G.ship.vy = 0;
      }
    } else if (keys.l || keys.r || keys.u || keys.d) {
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
      }
      G.ship.x += G.ship.vx * dt;
      G.ship.y += G.ship.vy * dt;
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
      G.ship.x += G.ship.vx * dt;
      G.ship.y += G.ship.vy * dt;
    }
    G.ship.x = clamp(G.ship.x, 22, VW - 22);
    G.ship.y = clamp(G.ship.y, 40, VH - 28);
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (!wantFire()) return;
    fireShot();
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -24 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = s.x - e.x;
        const dy = s.y - e.y;
        const rr = e.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, s.dmg, 'shot');
          burst(s.x, s.y, GOLD, 5, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBolts(dt) {
    for (let i = G.bolts.length - 1; i >= 0; i--) {
      const b = G.bolts[i];
      b.life -= dt;
      const tgt = b.tx && b.tx.alive ? b.tx : null;
      if (tgt) {
        const a = Math.atan2(tgt.y - b.y, tgt.x - b.x);
        const spd = 460;
        b.vx = lerp(b.vx, Math.cos(a) * spd, 1 - Math.exp(-dt * 9));
        b.vy = lerp(b.vy, Math.sin(a) * spd, 1 - Math.exp(-dt * 9));
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0 || b.y < -28 || b.y > VH + 24 || b.x < -24 || b.x > VW + 24) {
        G.bolts.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const rr = e.r + b.r;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, b.dmg, 'bolt');
          burst(b.x, b.y, CYN, 5, 80);
          hit = true;
          break;
        }
      }
      if (hit) G.bolts.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
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

  function updateSouls(dt) {
    for (let i = G.souls.length - 1; i >= 0; i--) {
      const s = G.souls[i];
      s.t += dt;
      s.spin += dt * 5;
      const magnet = G.combo >= 2 ? 300 : 190;
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = G.ship.x - s.x;
        const dy = G.ship.y - s.y;
        const d = hypot(dx, dy);
        if (d < 18) {
          collectSoul(s);
          G.souls.splice(i, 1);
          continue;
        }
        if (d < 108) {
          const k = magnet / Math.max(24, d);
          s.vx += (dx / d) * k * dt * 60;
          s.vy += (dy / d) * k * dt * 60;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= Math.exp(-dt * 1.4);
      if (s.y > VH + 20 || s.t > 6) G.souls.splice(i, 1);
    }
  }

  function fireInterval(e) {
    const sea = isSea() ? 0.74 : 1;
    if (e.kind === 'lamp') return 1.45 * sea;
    if (e.kind === 'shrine') return 1.05 * sea;
    if (e.kind === 'gate') return 0.92 * sea;
    if (e.kind === 'wraith') return 0.82 * sea;
    if (e.kind === 'pod') return 1.1 * sea;
    if (e.kind === 'boss') return 0.55 * sea;
    return 1.2 * sea;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'lamp') {
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
    } else if (e.kind === 'shrine') {
      e.x = e.baseX + Math.sin(e.t * 1.6 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 28) e.vy = 28;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.22, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'gate') {
      e.y += e.vy * dt;
      if (e.y > 70 && e.vy > 16) e.vy = 16;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, isSea() ? 2 : 1, 0.16, bulletSpd() * 0.92);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'wraith') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 5, 0.18, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'pod') {
      const b = findBoss();
      const cx = b ? b.x : VW * 0.5;
      const cy = b ? b.y : 110;
      e.ang += dt * 1.45;
      e.x = cx + Math.cos(e.ang) * e.rad;
      e.y = cy + Math.sin(e.ang) * e.rad * 0.55;
      if (G.mode === 'play' && e.fireCd <= 0) {
        aimedFire(e, 1, 0, bulletSpd() * 0.9);
        e.fireCd = fireInterval(e);
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
        aimedFire(e, 5, 0.2, spd);
        if (Math.random() < 0.45) ringFire(e, 8, spd * 0.72, e.spin);
        e.fireCd = 1.15 * (isSea() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        ringFire(e, 10, spd * 0.8, e.spin);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 3, 0.18, spd);
        e.fireCd = 0.52 * (isSea() ? 0.78 : 1);
      } else {
        ringFire(e, 12, spd * 0.78, e.spin);
        ringFire(e, 8, spd * 0.58, -e.spin * 0.7);
        aimedFire(e, 3, 0.16, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnLamp(e.x - 40, e.y + 20, -30, 110);
          spawnLamp(e.x + 40, e.y + 20, 30, 110);
        }
        e.fireCd = 0.42 * (isSea() ? 0.78 : 1);
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
        if (e.kind !== 'boss' && e.kind !== 'pod') {
          e.alive = false;
          G.enemies.splice(i, 1);
        }
        continue;
      }
      if (canHurt && e.kind !== 'boss') {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = e.r * 0.7 + HIT_R;
        if (dx * dx + dy * dy < rr * rr) diePlayer();
      } else if (canHurt && e.kind === 'boss') {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = e.r * 0.62 + HIT_R;
        if (dx * dx + dy * dy < rr * rr) diePlayer();
      }
    }
  }

  function updateWaves(dt) {
    if (hasBoss()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
    if (G.waveI >= st.waves.length && !hasBoss() && living() === 0) {
      G.gapT += dt;
      if (G.gapT >= 1.55) {
        G.gapT = 0;
        if (G.stage < 3) nextStage();
      }
    }
  }

  function update(dt) {
    G.t += dt;
    tickAutoFlow(dt);
    if (G.stop > 0) {
      if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
      else {
        G.stop -= dt;
        return;
      }
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.ship.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.ship.y = VH - 96;
      G.spirit.x = G.ship.x + Math.cos(G.t * 1.4) * 36;
      G.spirit.y = G.ship.y - 52 + Math.sin(G.t * 1.8) * 10;
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
      updateBolts(dt);
      updateBullets(dt);
      updateSouls(dt);
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
      updateBolts(dt);
      updateSouls(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    if (autoOn) autoThink();
    updateShip(dt);
    updateSpirit(dt);
    updateFire(dt);
    updateShots(dt);
    updateBolts(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateSouls(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathDiamond(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (rot || 0) + i * (TAU / 4) - Math.PI / 2;
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawLantern(c, x, y, s, rgb, flash) {
    const w = 7 * s;
    const h = 10 * s;
    c.fillStyle = rgba(DEEP, 0.88);
    c.fillRect(sx(x - w * 0.35), sy(y - h * 0.85), w * 0.7 * scale, 4 * scale);
    c.fillStyle = rgba(flash ? WHT : rgb, 0.95);
    c.beginPath();
    c.ellipse(sx(x), sy(y), w * scale, h * 0.55 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.55);
    c.beginPath();
    c.ellipse(sx(x), sy(y + 1), w * 0.45 * scale, h * 0.28 * scale, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(LAN, 0.7);
    c.lineWidth = Math.max(0.7, scale);
    c.beginPath();
    c.moveTo(sx(x), sy(y - h * 0.85));
    c.lineTo(sx(x), sy(y - h * 1.15));
    c.stroke();
  }

  function drawTorii(c, x, y, s, rgb) {
    const w = 16 * s;
    const h = 14 * s;
    c.strokeStyle = rgba(rgb, 0.95);
    c.lineWidth = Math.max(1.4, 1.8 * scale);
    c.beginPath();
    c.moveTo(sx(x - w * 0.45), sy(y + h * 0.45));
    c.lineTo(sx(x - w * 0.45), sy(y - h * 0.15));
    c.moveTo(sx(x + w * 0.45), sy(y + h * 0.45));
    c.lineTo(sx(x + w * 0.45), sy(y - h * 0.15));
    c.moveTo(sx(x - w * 0.58), sy(y - h * 0.18));
    c.lineTo(sx(x + w * 0.58), sy(y - h * 0.18));
    c.moveTo(sx(x - w * 0.5), sy(y - h * 0.38));
    c.lineTo(sx(x + w * 0.5), sy(y - h * 0.38));
    c.stroke();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0a0408';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(90), 10 * scale, sx(VW * 0.5), sy(VH * 0.4), 380 * scale);
    g.addColorStop(0, 'rgba(239,57,142,0.1)');
    g.addColorStop(0.55, 'rgba(80,18,48,0.08)');
    g.addColorStop(1, 'rgba(10,4,8,0)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    c.fillStyle = 'rgba(22,8,16,0.62)';
    c.fillRect(sx(0), sy(0), 36 * scale, VH * scale);
    c.fillRect(sx(VW - 36), sy(0), 36 * scale, VH * scale);

    const wallOff = (G.scroll * 0.7) % 56;
    for (let i = -1; i < 16; i++) {
      const y = i * 56 - wallOff;
      drawTorii(c, 18, y, 0.85, ROSE);
      drawTorii(c, VW - 18, y + 28, 0.85, ROSE);
    }

    for (let i = 0; i < lanterns.length; i++) {
      const L = lanterns[i];
      const yy = L.y + Math.sin(L.bob) * 4;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(LAN, 0.16);
      c.beginPath();
      c.ellipse(sx(L.x), sy(yy), 10 * L.s * scale, 12 * L.s * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      drawLantern(c, L.x, yy, L.s, LAN, false);
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < embers.length; i++) {
      const p = embers[i];
      c.fillStyle = rgba(i % 3 === 0 ? CYN : GOLD, p.a * 0.5);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawLockMark(e) {
    if (!e.locked) return;
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const pulse = 1 + Math.sin(G.t * 14) * 0.08;
    c.strokeStyle = rgba(CYN, 0.85);
    c.lineWidth = Math.max(1.1, 1.3 * scale);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y), (e.r + 7) * pulse * scale, 0, TAU);
    c.stroke();
    c.strokeStyle = rgba(ROSE, 0.7);
    c.beginPath();
    pathDiamond(c, e.x, e.y, e.r + 3, G.t * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(sx(G.spirit.x), sy(G.spirit.y));
    c.lineTo(sx(e.x), sy(e.y));
    c.strokeStyle = rgba(CYN, 0.28);
    c.lineWidth = 1.1 * scale;
    c.stroke();
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    if (e.kind === 'gate') {
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y + 4), 14 * scale, 8 * scale, 0, 0, TAU);
      c.fill();
      drawTorii(c, e.x, e.y, 1.05, flash ? WHT : ROSE);
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 2), 3.2 * scale, 0, TAU);
      c.fill();
      drawLockMark(e);
      return;
    }
    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(ROSE, 0.18);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 52 * scale, 38 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.strokeStyle = rgba(flash ? WHT : ROSE, 0.95);
      c.lineWidth = Math.max(1.6, 2.1 * scale);
      c.beginPath();
      c.moveTo(sx(e.x - 48), sy(e.y + 6));
      c.quadraticCurveTo(sx(e.x), sy(e.y + 28), sx(e.x + 48), sy(e.y + 6));
      c.stroke();
      c.beginPath();
      c.moveTo(sx(e.x - 46), sy(e.y - 4));
      c.lineTo(sx(e.x + 46), sy(e.y - 4));
      c.stroke();
      c.fillStyle = rgba(DEEP, 0.95);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y - 2), 28 * scale, 22 * scale, 0, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.95);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y - 2), 28 * scale, 22 * scale, 0, 0, TAU);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : ROSE, 0.95);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y - 2), 12 * scale, 9 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(INK, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y - 2), 4.6 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(CYN, 0.9);
      c.beginPath();
      c.arc(sx(e.x + 2), sy(e.y - 4), 1.6 * scale, 0, TAU);
      c.fill();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 34), sy(e.y - e.r - 16), 68 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : GOLD, 0.95);
      c.fillRect(sx(e.x - 34), sy(e.y - e.r - 16), 68 * ratio * scale, 5 * scale);
      drawLockMark(e);
      return;
    }
    if (e.kind === 'lamp' || e.kind === 'dive') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(LAN, 0.18);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 12 * scale, 14 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      drawLantern(c, e.x, e.y, e.kind === 'dive' ? 1.05 : 1, flash ? WHT : LAN, flash);
      if (e.kind === 'dive') {
        c.fillStyle = rgba(ROSE, 0.8);
        c.beginPath();
        c.moveTo(sx(e.x - 6), sy(e.y + 8));
        c.lineTo(sx(e.x), sy(e.y + 16));
        c.lineTo(sx(e.x + 6), sy(e.y + 8));
        c.fill();
      }
      drawLockMark(e);
      return;
    }
    const rgb = flash ? WHT : (e.kind === 'wraith' ? ROSE : GOLD);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(CYN, 0.12);
    c.beginPath();
    c.ellipse(sx(e.x), sy(e.y), (e.r + 6) * scale, (e.r + 2) * scale, 0, 0, TAU);
    c.fill();
    c.restore();
    c.fillStyle = rgba(rgb, 0.95);
    pathDiamond(c, e.x, e.y, e.r, e.t * 0.8);
    c.fill();
    c.strokeStyle = rgba(CYN, 0.7);
    c.lineWidth = Math.max(0.8, scale);
    pathDiamond(c, e.x, e.y, e.r, e.t * 0.8);
    c.stroke();
    c.fillStyle = rgba(DEEP, 0.9);
    c.beginPath();
    c.ellipse(sx(e.x), sy(e.y - 1), 4.2 * scale, 3.2 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y - 1), 1.6 * scale, 0, TAU);
    c.fill();
    drawLockMark(e);
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.moveTo(sx(s.x), sy(s.y - 8));
      c.lineTo(sx(s.x + 2.4), sy(s.y + 4));
      c.lineTo(sx(s.x - 2.4), sy(s.y + 4));
      c.closePath();
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.fillRect(sx(s.x - 0.7), sy(s.y - 2), 1.4 * scale, 7 * scale);
      if (!REDUCE) {
        c.strokeStyle = rgba(LAN, 0.35);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y));
        c.lineTo(sx(s.x - s.vx * 0.016), sy(s.y - s.vy * 0.016));
        c.stroke();
      }
    }
    for (let i = 0; i < G.bolts.length; i++) {
      const b = G.bolts[i];
      c.fillStyle = rgba(CYN, 0.95);
      pathDiamond(c, b.x, b.y, 4.4, G.t * 10);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), 1.4 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(ROSE, 0.4);
        c.lineWidth = 1.2 * scale;
        c.beginPath();
        c.moveTo(sx(b.x), sy(b.y));
        c.lineTo(sx(b.x - b.vx * 0.02), sy(b.y - b.vy * 0.02));
        c.stroke();
      }
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
    for (let i = 0; i < G.souls.length; i++) {
      const s = G.souls[i];
      c.fillStyle = rgba(CYN, 0.95);
      pathDiamond(c, s.x, s.y, 5.4, s.spin);
      c.fill();
      c.fillStyle = rgba(ROSE, 0.9);
      pathDiamond(c, s.x, s.y, 2.4, s.spin + 0.6);
      c.fill();
    }
    c.restore();
  }

  function drawSpirit() {
    if (G.deadT > 0) return;
    const x = G.spirit.x;
    const y = G.spirit.y;
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    if (G.spirit.on) {
      c.strokeStyle = rgba(CYN, 0.22);
      c.lineWidth = 1.2 * scale;
      c.setLineDash([4 * scale, 5 * scale]);
      c.beginPath();
      c.moveTo(sx(G.ship.x), sy(G.ship.y - 10));
      c.quadraticCurveTo(sx((G.ship.x + x) * 0.5), sy((G.ship.y + y) * 0.5), sx(x), sy(y));
      c.stroke();
      c.setLineDash([]);
      c.strokeStyle = rgba(CYN, 0.35);
      c.beginPath();
      c.arc(sx(x), sy(y), LOCK_R * scale, 0, TAU);
      c.stroke();
    }
    const glow = G.spirit.on ? 0.42 : 0.18;
    c.fillStyle = rgba(CYN, glow);
    c.beginPath();
    c.arc(sx(x), sy(y), (10 + Math.sin(G.t * 8) * 2) * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(G.spirit.on ? CYN : ROSE, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y), 5.2 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.beginPath();
    c.arc(sx(x - 1.2), sy(y - 1.4), 1.8 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(G.spirit.on ? CYN : ROSE, 0.2 + (G.muzzle > 0 ? 0.2 : 0));
    c.beginPath();
    c.ellipse(sx(x), sy(y), 16 * scale, 12 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(ROSE, 0.45);
    c.beginPath();
    c.moveTo(sx(x - 5), sy(y + 8));
    c.lineTo(sx(x), sy(y + 18 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x + 5), sy(y + 8));
    c.fill();
    c.restore();

    c.strokeStyle = rgba(GOLD, 0.95);
    c.lineWidth = Math.max(1.3, 1.6 * scale);
    c.beginPath();
    c.moveTo(sx(x - 14), sy(y + 4));
    c.quadraticCurveTo(sx(x), sy(y + 14), sx(x + 14), sy(y + 4));
    c.stroke();
    c.beginPath();
    c.moveTo(sx(x - 13), sy(y - 2));
    c.lineTo(sx(x + 13), sy(y - 2));
    c.stroke();

    c.fillStyle = rgba(ROSE, 0.96);
    pathDiamond(c, x, y + 1, 10, 0);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.9);
    c.lineWidth = Math.max(1.1, 1.3 * scale);
    pathDiamond(c, x, y + 1, 10, 0);
    c.stroke();

    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.moveTo(sx(x), sy(y - 16));
    c.lineTo(sx(x + 4.2), sy(y - 5));
    c.lineTo(sx(x - 4.2), sy(y - 5));
    c.closePath();
    c.fill();

    c.fillStyle = rgba(WHT, 0.95);
    c.beginPath();
    c.ellipse(sx(x), sy(y - 1), 3.2 * scale, 2.4 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(INK, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y - 1), 1.2 * scale, 0, TAU);
    c.fill();

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 16), 5 * scale, 0, TAU);
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
    c.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.textAlign = 'center';
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
    ctx.fillStyle = '#12060e';
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
    ctx.fillStyle = '#12060e';
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
    drawSpirit();
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
      startGame('hunt');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'a' || k === 'A' || e.code === 'KeyA') {
      if (down) {
        e.preventDefault();
        if (!e.repeat) toggleAuto();
      }
      return;
    }
    if (e.target === speedEl) return;
    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down && !autoOn;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (space) {
      keys.sht = down && !autoOn;
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (k === 'Shift' || k === 'z' || k === 'Z') {
      keys.lock = down && !autoOn;
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R')) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (autoOn && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S' || k === 'Shift' || k === 'z' || k === 'Z')) {
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
      startGame('hunt');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('sea');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (autoOn) return;
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
      if (autoOn) return;
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

  function bindLockHold(el, which) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      e.stopPropagation();
      if (autoOn) return;
      if (which === 'pad') G.padLock = true;
      else G.lockToggle = !G.lockToggle;
      syncLockBtns();
    });
    el.addEventListener('pointerup', function (e) {
      if (which === 'pad') {
        G.padLock = false;
        syncLockBtns();
      }
      e.preventDefault();
    });
    el.addEventListener('pointercancel', function () {
      if (which === 'pad') {
        G.padLock = false;
        syncLockBtns();
      }
    });
    el.addEventListener('pointerleave', function () {
      if (which === 'pad') {
        G.padLock = false;
        syncLockBtns();
      }
    });
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
    const turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    let n = 0;
    const maxSteps = turbo ? 16 : 5;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * 4) acc = 0;
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
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();
  bindLockHold(btnLock, 'toggle');
  bindLockHold(btnPad, 'pad');

  if (btnHunt) {
    btnHunt.addEventListener('click', function () {
      audio.ensure();
      startGame('hunt');
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
      startGame(G.kind || 'hunt');
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
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
    });
    speedEl.addEventListener('change', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
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
      keys.lock = false;
      G.padLock = false;
    }
  });

  requestAnimationFrame(frame);
})();
