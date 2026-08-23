'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const BOMB_CAP = 6;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 4.5;
  const CHARGE_T = 0.38;
  const BEST_KEY = 'playbox-blast-off-best';
  const MUTE_KEY = 'playbox-blast-off-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击（按住成球）· X 切式 · Shift / Z 爆射 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [74, 212, 255];
  const GOLD = [255, 227, 107];
  const GRN = [92, 255, 122];
  const RED = [255, 58, 58];
  const YEL = [255, 212, 40];
  const HOT = [255, 74, 28];
  const WHT = [255, 240, 230];
  const DEEP = [22, 8, 8];
  const BALLS = [RED, CYN, YEL, GRN, GOLD, HOT];

  const PATS = ['red', 'blue', 'yellow', 'green'];
  const PAT_NAME = { red: '红', blue: '蓝', yellow: '黄', green: '绿' };
  const PAT_RGB = { red: RED, blue: CYN, yellow: YEL, green: GRN };
  const PAT_HINT = {
    red: '红 · 双螺旋向前',
    blue: '蓝 · 前后齐射',
    yellow: '黄 · 前左右丁字',
    green: '绿 · 斜前加后'
  };

  const SCORE = {
    grunt: 50,
    dive: 80,
    missile: 90,
    turret: 150,
    hex: 120,
    elite: 240,
    carrier: 280,
    cannon: 120,
    mid: 2200,
    boss: 4500,
    chip: 10,
    stage: 1500
  };

  const STAGES = [
    {
      name: '云廊',
      biome: 'cloud',
      mid: '环巢',
      boss: '云堡',
      midHp: 36,
      bossHp: 88,
      midRad: 52,
      bossRad: 68,
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.0, kind: 'stream', dir: 1 },
        { t: 5.4, kind: 'dive', n: 4 },
        { t: 7.6, kind: 'hex', n: 3 },
        { t: 9.8, kind: 'carrier' },
        { t: 12.0, kind: 'v', n: 7 },
        { t: 14.2, kind: 'mid' },
        { t: 20.2, kind: 'missile', n: 5 },
        { t: 22.4, kind: 'stream', dir: -1 },
        { t: 24.6, kind: 'turrets' },
        { t: 26.8, kind: 'v', n: 7 },
        { t: 32.2, kind: 'boss' }
      ]
    },
    {
      name: '炎带',
      biome: 'fire',
      mid: '炎巢',
      boss: '炎堡',
      midHp: 48,
      bossHp: 118,
      midRad: 56,
      bossRad: 72,
      waves: [
        { t: 0.6, kind: 'v', n: 7 },
        { t: 2.6, kind: 'dive', n: 5 },
        { t: 4.8, kind: 'hex', n: 4 },
        { t: 7.0, kind: 'stream', dir: -1 },
        { t: 9.2, kind: 'elite' },
        { t: 11.2, kind: 'carrier' },
        { t: 13.2, kind: 'missile', n: 4 },
        { t: 15.2, kind: 'mid' },
        { t: 21.2, kind: 'v', n: 9 },
        { t: 23.2, kind: 'dive', n: 6 },
        { t: 25.2, kind: 'turrets' },
        { t: 27.2, kind: 'hex', n: 4 },
        { t: 29.2, kind: 'elite' },
        { t: 34.6, kind: 'boss' }
      ]
    },
    {
      name: '宙门',
      biome: 'gate',
      mid: '六卫',
      boss: '爆核',
      midHp: 60,
      bossHp: 162,
      midRad: 60,
      bossRad: 78,
      waves: [
        { t: 0.5, kind: 'v', n: 7 },
        { t: 2.4, kind: 'dive', n: 5 },
        { t: 4.4, kind: 'elite' },
        { t: 6.4, kind: 'hex', n: 5 },
        { t: 8.2, kind: 'turrets' },
        { t: 10.0, kind: 'carrier' },
        { t: 11.8, kind: 'missile', n: 6 },
        { t: 13.6, kind: 'mid' },
        { t: 19.6, kind: 'v', n: 9 },
        { t: 21.4, kind: 'dive', n: 6 },
        { t: 23.2, kind: 'elite' },
        { t: 25.0, kind: 'hex', n: 5 },
        { t: 26.8, kind: 'stream', dir: 1 },
        { t: 28.6, kind: 'turrets' },
        { t: 30.4, kind: 'carrier' },
        { t: 36.2, kind: 'boss' }
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
  const btnBlast = document.getElementById('btn-blast');
  const btnRain = document.getElementById('btn-rain');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPat = document.getElementById('btn-pat');
  const btnPad = document.getElementById('btn-pad');
  const btnPadPat = document.getElementById('btn-pad-pat');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const patLabel = document.getElementById('pat-label');
  const bombLabel = document.getElementById('bomb-label');
  const comboEl = document.getElementById('combo-label');
  const chgWrap = document.getElementById('chg-wrap');
  const chgBar = document.getElementById('chg-bar');
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
  let patTok = 0;

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
    kind: 'blast',
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
    pat: 'red',
    holdT: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    bombR: 0,
    enemies: [],
    shots: [],
    bullets: [],
    pows: [],
    ship: { x: VW * 0.5, y: 630, vx: 0, vy: 0 },
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0,
    stageClear: false,
    stun: 0
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
    return G.kind === 'rain';
  }
  function dens() {
    return isDense() ? 1.28 : 1;
  }
  function shipSpeed() {
    return isDense() ? 318 : 276;
  }
  function bulletSpd() {
    return isDense() ? 186 : 146;
  }
  function scrollSpd() {
    if (hasBoss() || hasMid()) return 22;
    return isDense() ? 124 : 88;
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
  function patRgb() {
    return PAT_RGB[G.pat] || RED;
  }
  function charged() {
    return G.holdT >= CHARGE_T;
  }
  function shipScale() {
    return hasBoss() ? 1.52 : 1;
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
    shoot(pat, orb) {
      this.ensure();
      if (orb) {
        this.noise(0.045, 0.032, 700);
        this.beep(280, 0.08, 'sine', 0.04, 520);
        this.beep(880, 0.055, 'triangle', 0.022, 440);
        return;
      }
      if (pat === 'blue') {
        this.beep(920, 0.04, 'square', 0.026, 1480);
        this.beep(220, 0.055, 'sawtooth', 0.02, 90);
      } else if (pat === 'yellow') {
        this.beep(640, 0.045, 'square', 0.024, 980);
        this.beep(980, 0.04, 'triangle', 0.016, 1320);
      } else if (pat === 'green') {
        this.beep(480, 0.05, 'sawtooth', 0.026, 220);
        this.beep(760, 0.04, 'square', 0.018, 1100);
      } else {
        this.beep(700, 0.042, 'square', 0.028, 1420);
        this.beep(980, 0.03, 'triangle', 0.014, 1560);
      }
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.03, 0.028, 1400);
      this.beep(640 * lift, 0.055, 'square', 0.036, 980 * lift);
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
    cycle() {
      this.ensure();
      this.beep(520, 0.06, 'square', 0.032, 780);
      this.beep(780, 0.08, 'triangle', 0.028, 1170);
    },
    bomb() {
      this.ensure();
      this.noise(0.2, 0.07, 220);
      this.beep(140, 0.26, 'sawtooth', 0.06, 42);
      this.beep(360, 0.18, 'square', 0.04, 90);
      this.beep(880, 0.22, 'sine', 0.04, 1760);
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
      this.beep(330, 0.08, 'square', 0.04, 440);
      this.beep(440, 0.1, 'square', 0.038, 659);
      this.beep(659, 0.16, 'triangle', 0.045, 880);
      this.beep(880, 0.22, 'sine', 0.04, 1320);
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const st = stageData();
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '爆射';
      else if (hasBoss()) stageLabel.textContent = st.boss;
      else if (hasMid()) stageLabel.textContent = st.mid;
      else stageLabel.textContent = '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '炎雨' : '爆射';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isDense());
      tagLabel.classList.toggle('hot', G.combo >= 8 || charged());
    }
    if (patLabel) {
      patLabel.textContent = PAT_NAME[G.pat] || '红';
      patLabel.classList.remove('red', 'blue', 'yellow', 'green');
      patLabel.classList.add(G.pat);
    }
    if (chgBar) {
      const p = clamp(G.holdT / CHARGE_T, 0, 1);
      chgBar.style.transform = 'scaleX(' + p + ')';
    }
    if (chgWrap) chgWrap.classList.toggle('hot', charged());
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
    else if (G.mode === 'lose') setHint('R 重开 · 空格连射，X 切式，Shift 爆射', 'warn');
    else if (G.mode === 'win') setHint('宙门已破 · R 再来', 'hot');
    else if (charged()) setHint('成球穿甲 · 环弹不散', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 爆射清场', 'warn');
    else if (hasBoss()) setHint('先打六炮再打核 · 成球穿甲', 'hot');
    else setHint('空格连射 · 按住成球 · X 切' + (PAT_NAME[G.pat] || '红'), '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'BLST';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvModes) {
      if (kind === 'win' && G.kind === 'blast') btnOvModes.textContent = '炎雨';
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
  }

  function makeCannons(n, hp) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        a: i * (TAU / n) - Math.PI / 2,
        hp: hp,
        maxHp: hp,
        alive: true,
        flash: 0,
        fireCd: 0.35 + i * 0.11
      });
    }
    return arr;
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
      enter: spec.enter || 0,
      spin: spec.spin || 0,
      pattern: 0,
      drop: spec.drop || null,
      name: spec.name || '',
      rad: spec.rad || 54,
      cannons: spec.cannons || null,
      stun: 0
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
      r: r || 3.6,
      life: 8,
      rgb: rgb || WHT
    });
    capArr(G.bullets, 280);
  }

  function aimedFire(e, n, spread, spd, rgb) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.4, rgb);
    }
  }

  function ringFire(e, n, spd, rot, rgb) {
    const s = spd || bulletSpd() * 0.82;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      const col = rgb || BALLS[i % BALLS.length];
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.6, col);
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
    const extra = isDense() ? 2 : 0;
    const total = n + extra;
    for (let i = 0; i < total; i++) {
      const k = i - (total - 1) * 0.5;
      spawnGrunt(c + k * 34, -26 - Math.abs(k) * 16, 0, 100 * dens());
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isDense() ? 3 : 0;
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: 'grunt',
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
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
    for (let i = 0; i < n + extra; i++) {
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

  function spawnMissile(n) {
    const extra = isDense() ? 2 : 0;
    for (let i = 0; i < n + extra; i++) {
      spawnEnemy({
        kind: 'missile',
        x: 40 + Math.random() * (VW - 80),
        y: -24 - i * 20,
        vy: 70 * dens(),
        hp: 2,
        r: 10,
        score: SCORE.missile,
        fireCd: 99,
        amp: 0
      });
    }
  }

  function spawnTurrets() {
    const n = isDense() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'turret',
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18,
        vy: 44 * dens(),
        hp: 6,
        r: 14,
        score: SCORE.turret,
        fireCd: 0.55 + i * 0.1
      });
    }
  }

  function spawnHex(n) {
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'hex',
        x: 80 + i * ((VW - 160) / Math.max(1, n - 1)),
        y: -24 - (i % 2) * 18,
        vy: 62 * dens(),
        hp: 5,
        r: 14,
        amp: 36,
        phase: i * 0.8,
        score: SCORE.hex,
        fireCd: 0.8 + i * 0.1
      });
    }
  }

  function spawnElite() {
    spawnEnemy({
      kind: 'elite',
      x: 150,
      vy: 56 * dens(),
      hp: 10,
      r: 18,
      amp: 86,
      score: SCORE.elite,
      fireCd: 0.5
    });
    spawnEnemy({
      kind: 'elite',
      x: 330,
      vy: 56 * dens(),
      hp: 10,
      r: 18,
      amp: 86,
      phase: 1.6,
      score: SCORE.elite,
      fireCd: 0.7
    });
    if (isDense()) {
      spawnEnemy({
        kind: 'elite',
        x: 240,
        vy: 50 * dens(),
        hp: 10,
        r: 18,
        amp: 70,
        phase: 0.8,
        score: SCORE.elite,
        fireCd: 0.6
      });
    }
  }

  function spawnCarrier() {
    spawnEnemy({
      kind: 'carrier',
      x: Math.random() < 0.5 ? 140 : 340,
      vy: 52 * dens(),
      hp: 8,
      r: 17,
      amp: 64,
      score: SCORE.carrier,
      fireCd: 0.7,
      drop: 'bomb'
    });
  }

  function spawnMid() {
    const st = stageData();
    const e = spawnEnemy({
      kind: 'mid',
      x: VW * 0.5,
      y: -70,
      vy: 0,
      hp: Math.round(st.midHp * hpMul()),
      r: 22,
      score: SCORE.mid,
      enter: 1.05,
      fireCd: 0.7,
      name: st.mid,
      rad: st.midRad,
      cannons: makeCannons(6, Math.round(4 * hpMul()))
    });
    e.maxHp = e.hp;
    toast(st.mid, false, true);
    audio.wave();
    screenFlash(HOT, 0.28);
    kick(3.8, 'boss');
    syncHud();
  }

  function spawnBoss() {
    const st = stageData();
    const e = spawnEnemy({
      kind: 'boss',
      x: VW * 0.5,
      y: -90,
      vy: 0,
      hp: Math.round(st.bossHp * hpMul()),
      r: 28,
      score: SCORE.boss + 1500 * G.stage,
      enter: 1.35,
      fireCd: 0.85,
      name: st.boss,
      rad: st.bossRad,
      cannons: makeCannons(6, Math.round((G.stage === 3 ? 8 : 6) * hpMul()))
    });
    e.maxHp = e.hp;
    toast(st.boss, false, true);
    audio.wave();
    screenFlash(MAG, 0.36);
    kick(4.8, 'boss');
    syncHud();
    return e;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n, w.x);
    else if (w.kind === 'stream') spawnStream(w.dir);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'missile') spawnMissile(w.n);
    else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'hex') spawnHex(w.n + (isDense() ? 1 : 0));
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

  function cannonPos(e, c) {
    return {
      x: e.x + Math.cos(e.spin + c.a) * e.rad,
      y: e.y + Math.sin(e.spin + c.a) * e.rad
    };
  }

  function cannonsAlive(e) {
    if (!e.cannons) return 0;
    let n = 0;
    for (let i = 0; i < e.cannons.length; i++) if (e.cannons[i].alive) n += 1;
    return n;
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function fireRate() {
    const dense = isDense() ? 0.085 : 0.1;
    return charged() ? dense + 0.038 : dense;
  }

  function addShot(spec) {
    G.shots.push(spec);
    capArr(G.shots, 64);
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    const orb = charged();
    const cap = orb ? 12 : 18;
    if (G.shots.length >= cap) return;
    G.fireCd = fireRate();
    G.muzzle = orb ? 0.08 : 0.05;
    const x = G.ship.x;
    const y = G.ship.y;
    const pat = G.pat;
    const rgb = patRgb();
    const dmg = orb ? 2.15 : 1;
    const pierce = orb ? 4 : 0;
    const r = orb ? 7.2 : 4.2;
    const spd = orb ? 620 : 740;
    const kind = orb ? 'orb' : 'ring';

    function shot(ox, oy, vx, vy, phase) {
      addShot({
        x: x + ox,
        y: y + oy,
        vx: vx,
        vy: vy,
        r: r,
        dmg: dmg,
        pierce: pierce,
        last: null,
        kind: kind,
        rgb: rgb,
        helix: phase != null,
        phase: phase || 0,
        cx: x + ox,
        amp: 11,
        trail: REDUCE ? null : []
      });
    }

    if (pat === 'blue') {
      shot(0, -14, 0, -spd, null);
      shot(0, 14, 0, spd * 0.72, null);
    } else if (pat === 'yellow') {
      shot(0, -14, 0, -spd, null);
      shot(-10, 0, -spd * 0.88, -spd * 0.12, null);
      shot(10, 0, spd * 0.88, -spd * 0.12, null);
    } else if (pat === 'green') {
      shot(-6, -10, -spd * 0.38, -spd * 0.9, null);
      shot(6, -10, spd * 0.38, -spd * 0.9, null);
      shot(0, 14, 0, spd * 0.72, null);
    } else {
      shot(-7, -12, 0, -spd, 0);
      shot(7, -12, 0, -spd, Math.PI);
    }
    audio.shoot(pat, orb);
  }

  function cyclePat() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const i = PATS.indexOf(G.pat);
    G.pat = PATS[(i + 1) % PATS.length];
    audio.cycle();
    toast(PAT_HINT[G.pat], false, G.pat === 'yellow' || G.pat === 'green');
    floatText(G.ship.x, G.ship.y - 36, PAT_NAME[G.pat], patRgb(), true);
    kick(2.4, 'pow');
    if (patLabel) {
      patLabel.classList.remove('hot');
      void patLabel.offsetWidth;
      patLabel.classList.add('hot');
    }
    patTok += 1;
    syncHud();
  }

  function tryBomb() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      audio.empty();
      toast('爆弹用尽', true);
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.52;
    G.invuln = Math.max(G.invuln, 0.52);
    G.bombFlash = 0.36;
    G.bombR = 12;
    G.bullets.length = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.cannons) {
        for (let k = 0; k < e.cannons.length; k++) {
          if (e.cannons[k].alive) damageCannon(e, e.cannons[k], 3);
        }
      }
      if (e.alive) damageEnemy(e, e.kind === 'boss' || e.kind === 'mid' ? 14 : 8, 'bomb');
    }
    explode(G.ship.x, G.ship.y, GOLD, 28);
    ring(G.ship.x, G.ship.y, HOT);
    hitStop(0.078);
    kick(5.6, 'bomb');
    screenFlash(GOLD, 0.55);
    audio.bomb();
    toast('BLAST OFF', false, true);
    syncHud();
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x,
      y: y,
      vx: rand(-40, 40),
      vy: -80,
      t: 0,
      kind: kind || 'bomb'
    });
    capArr(G.pows, 8);
  }

  function collectPow(p) {
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) G.bombs += 1;
      else addScore(400 * G.mult);
      audio.pickup();
      toast('爆 +1', false, true);
      explode(p.x, p.y, GOLD, 10);
    }
    bumpCombo();
    syncHud();
  }

  function killEnemy(e, how) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.kind === 'boss' || e.kind === 'mid' ? GOLD : HOT;
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 36 : e.kind === 'mid' ? 24 : 14);
    if (e.cannons) {
      for (let i = 0; i < e.cannons.length; i++) {
        const c = e.cannons[i];
        if (!c.alive) continue;
        c.alive = false;
        const p = cannonPos(e, c);
        explode(p.x, p.y, CYN, 10);
      }
    }
    const bonus = how === 'cannons' ? Math.round(e.score * 0.5) : 0;
    const pts = Math.round((e.score + bonus) * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, '+' + pts, GOLD, pts >= 400);
    if (e.drop) spawnPow(e.x, e.y, e.drop);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(7.2, 'boss');
      screenFlash(GOLD, 0.6);
      G.winT = 1.35;
      addScore(Math.round(SCORE.stage * G.mult));
    } else if (e.kind === 'mid') {
      audio.explode();
      hitStop(0.06);
      kick(5.2, 'boss');
      screenFlash(HOT, 0.4);
      toast('突入', false, true);
    } else {
      audio.explode();
      hitStop(0.034);
      kick(2.2, 'hit');
    }
  }

  function damageCannon(e, c, dmg) {
    if (!c.alive) return false;
    c.hp -= dmg;
    c.flash = 0.08;
    e.stun = Math.max(e.stun, 0.22);
    addScore(SCORE.chip * G.mult);
    const p = cannonPos(e, c);
    burst(p.x, p.y, CYN, 6, 70);
    spark(p.x, p.y, CYN);
    audio.hit(G.combo);
    hitStop(0.03);
    kick(1.8, 'hit');
    if (c.hp <= 0) {
      c.alive = false;
      explode(p.x, p.y, GOLD, 12);
      e.stun = 1.15;
      addScore(Math.round(SCORE.cannon * G.mult));
      bumpCombo();
      floatText(p.x, p.y, '炮破', GOLD, true);
      audio.explode();
      hitStop(0.05);
      if (cannonsAlive(e) <= 0) {
        floatText(e.x, e.y - 18, '全炮', GOLD, true);
        killEnemy(e, 'cannons');
      }
    }
    return true;
  }

  function damageEnemy(e, dmg, src) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.07;
    if (e.kind === 'boss' || e.kind === 'mid') {
      audio.bossHit();
      hitStop(src === 'bomb' ? 0.05 : 0.038);
      kick(2.6, 'hit');
      burst(e.x, e.y, GOLD, 5, 60);
    } else {
      audio.hit(G.combo);
      hitStop(0.032);
      kick(1.6, 'hit');
      burst(e.x, e.y, patRgb(), 4, 55);
      spark(e.x, e.y, patRgb());
    }
    if (e.hp <= 0) killEnemy(e, src);
  }

  function hitBase(e, sx0, sy0, sr, dmg, skip) {
    const hurt = dmg || 1;
    if (e.cannons) {
      for (let i = 0; i < e.cannons.length; i++) {
        const c = e.cannons[i];
        if (!c.alive || c === skip) continue;
        const p = cannonPos(e, c);
        const dx = p.x - sx0;
        const dy = p.y - sy0;
        const rr = 11 + sr;
        if (dx * dx + dy * dy < rr * rr) {
          damageCannon(e, c, hurt);
          return c;
        }
      }
    }
    if (skip === e) return null;
    const dx = e.x - sx0;
    const dy = e.y - sy0;
    const rr = e.r + sr;
    if (dx * dx + dy * dy < rr * rr) {
      damageEnemy(e, hurt, 'shot');
      return e;
    }
    return null;
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.holdT = 0;
    G.pat = 'red';
    explode(G.ship.x, G.ship.y, MAG, 26);
    hitStop(0.072);
    kick(7.4, 'die');
    screenFlash(MAG, 0.55);
    audio.death();
    G.bullets.length = 0;
    breakCombo();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = 642;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.invuln = 1.5;
    G.deadT = 0;
    G.holdT = 0;
    G.pat = 'red';
    G.bullets.length = 0;
    toast('再飞', false, false);
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

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'rain' ? 'rain' : 'blast';
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
    G.pat = 'red';
    G.holdT = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.bombR = 0;
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
    G.ship.x = VW * 0.5;
    G.ship.y = 642;
    G.ship.vx = 0;
    G.ship.vy = 0;
    clearWorld();
    hideOverlay();
    if (scoreEl) scoreEl.textContent = '0';
    toast(isDense() ? '炎雨' : '爆射', isDense(), !isDense());
    audio.start();
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    G.stageClear = false;
    G.winT = 0;
    if (G.bombs < BOMB_CAP) G.bombs += 1;
    clearWorld();
    G.invuln = Math.max(G.invuln, 0.8);
    toast(stageData().name, false, true);
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'blast';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.pat = 'red';
    G.holdT = 0;
    G.bombs = 3;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = 630;
    clearWorld();
    showOverlay('title', '爆射', '切四式环弹，按住成球穿甲。六角基先打炮再打核。短关之后是堡。');
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '云里机群还在。R 立刻再飞。');
    syncHud();
  }

  function goWin() {
    const bonus = isDense() ? 10000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    saveBest();
    audio.win();
    const lead = isDense()
      ? '炎雨通关。四式环弹把爆核打穿了。'
      : '云廊尽碎。四式环弹把机群从云里打散了。';
    showOverlay('win', isDense() ? '炎雨通关' : '宙门尽碎', lead);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('blast');
    else startGame(G.kind || 'blast');
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
    if (G.bombT > 0) G.bombR = lerp(G.bombR, 240, 1 - Math.exp(-dt * 7));
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

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (wantFire()) {
      G.holdT += dt;
      fireShot();
    } else {
      G.holdT = Math.max(0, G.holdT - dt * 2.4);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.helix) {
        s.phase += dt * 16;
        s.cx += s.vx * dt;
        s.x = s.cx + Math.sin(s.phase) * s.amp;
        s.y += s.vy * dt;
      } else {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
      if (s.trail) {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 6) s.trail.shift();
      }
      if (s.y < -40 || s.y > VH + 40 || s.x < -40 || s.x > VW + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let k = 0; k < G.enemies.length; k++) {
        const e = G.enemies[k];
        if (!e.alive) continue;
        let got = null;
        if (e.kind === 'boss' || e.kind === 'mid') {
          got = hitBase(e, s.x, s.y, s.r || 4, s.dmg || 1, s.last);
        } else {
          if (s.last === e) continue;
          const rr = e.r + (s.r || 3);
          const dx = e.x - s.x;
          const dy = e.y - s.y;
          if (dx * dx + dy * dy < rr * rr) {
            damageEnemy(e, s.dmg || 1, 'shot');
            got = e;
          }
        }
        if (got) {
          if (s.kind === 'orb' && s.pierce > 0) {
            s.pierce -= 1;
            s.last = got;
            burst(s.x, s.y, s.rgb, 5, 50);
            if (s.pierce <= 0) hit = true;
          } else {
            hit = true;
          }
          if (hit) break;
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
    const slow = isDense() ? 0.74 : 1;
    if (e.kind === 'boss') return 0.55 * slow;
    if (e.kind === 'mid') return 0.62 * slow;
    if (e.kind === 'elite') return 0.85 * slow;
    if (e.kind === 'turret') return 1.05 * slow;
    if (e.kind === 'hex') return 1.15 * slow;
    if (e.kind === 'carrier') return 1.15 * slow;
    return 1.35 * slow;
  }

  function thinkBase(e, dt) {
    if (e.enter > 0) {
      e.enter -= dt;
      e.y = lerp(e.y, e.kind === 'boss' ? 124 : 112, 1 - Math.exp(-dt * 2.4));
      return;
    }
    e.x = VW * 0.5 + Math.sin(e.t * 0.72 + e.phase) * (e.kind === 'boss' ? 96 : 78);
    e.y = (e.kind === 'boss' ? 124 : 112) + Math.sin(e.t * 1.15) * 10;
    e.spin += dt * (e.kind === 'boss' ? 0.55 : 0.72);
    if (e.stun > 0) e.stun -= dt;
    const spd = bulletSpd();
    const ratio = e.hp / Math.max(1, e.maxHp);
    if (e.cannons) {
      for (let i = 0; i < e.cannons.length; i++) {
        const c = e.cannons[i];
        if (c.flash > 0) c.flash -= dt;
        if (!c.alive) continue;
        c.fireCd -= dt;
        if (c.fireCd <= 0 && e.stun <= 0) {
          const p = cannonPos(e, c);
          const a = Math.atan2(G.ship.y - p.y, G.ship.x - p.x);
          const s = spd * 0.62;
          enemyShot(p.x, p.y, Math.cos(a) * s, Math.sin(a) * s, 3.2, CYN);
          c.fireCd = (e.kind === 'boss' ? 1.05 : 1.25) * (isDense() ? 0.78 : 1);
        }
      }
    }
    if (e.stun > 0) return;
    e.fireCd -= dt;
    if (e.fireCd > 0) return;
    if (e.kind === 'mid') {
      if (ratio > 0.5) {
        aimedFire(e, 1, 0, spd, YEL);
        e.fireCd = fireInterval(e);
      } else {
        ringFire(e, 6, spd * 0.64, e.spin);
        aimedFire(e, 1, 0, spd, HOT);
        e.fireCd = fireInterval(e) * 0.9;
      }
      return;
    }
    if (ratio > 0.62) {
      aimedFire(e, 3, 0.16, spd, YEL);
      if ((e.pattern++ % 3) === 0) ringFire(e, 8, spd * 0.66, e.spin);
      e.fireCd = 0.7 * (isDense() ? 0.78 : 1);
    } else if (ratio > 0.32) {
      ringFire(e, 10, spd * 0.72, e.spin);
      aimedFire(e, 3, 0.14, spd * 1.02, HOT);
      e.fireCd = 0.52 * (isDense() ? 0.78 : 1);
    } else {
      ringFire(e, 12, spd * 0.78, e.spin);
      ringFire(e, 8, spd * 0.52, -e.spin * 0.7);
      aimedFire(e, 5, 0.12, spd * 1.06, MAG);
      if ((e.pattern++ % 4) === 0) {
        spawnGrunt(e.x - 40, e.y + 24, -30, 110);
        spawnGrunt(e.x + 40, e.y + 24, 30, 110);
      }
      e.fireCd = 0.42 * (isDense() ? 0.78 : 1);
    }
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    const spd = bulletSpd();

    if (e.kind === 'boss' || e.kind === 'mid') {
      thinkBase(e, dt);
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

    if (e.kind === 'missile') {
      const ax = clamp(G.ship.x - e.x, -160, 160);
      e.vx = lerp(e.vx, ax * 1.1, 1 - Math.exp(-dt * 1.6));
      e.vy = Math.min(e.vy + 90 * dt, 220 * dens());
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      return;
    }

    if (e.kind === 'turret') {
      e.y += e.vy * dt;
      e.fireCd -= dt;
      if (e.fireCd <= 0 && e.y > 20 && e.y < VH - 80) {
        aimedFire(e, isDense() ? 2 : 1, 0.12, spd * 0.9, HOT);
        e.fireCd = fireInterval(e);
      }
      return;
    }

    if (e.kind === 'hex') {
      e.y += e.vy * dt;
      e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp;
      e.spin += dt * 2.4;
      e.fireCd -= dt;
      if (e.fireCd <= 0 && e.y > 30) {
        ringFire(e, 6, spd * 0.58, e.spin);
        e.fireCd = fireInterval(e);
      }
      return;
    }

    e.y += e.vy * dt;
    e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp + e.vx * e.t * 0.15;
    e.fireCd -= dt;
    if (e.fireCd <= 0 && e.y > 24 && e.y < VH - 90) {
      if (e.kind === 'elite') aimedFire(e, 3, 0.18, spd, YEL);
      else if (e.kind === 'carrier') aimedFire(e, 1, 0, spd * 0.9, HOT);
      else if (Math.random() < (isDense() ? 0.85 : 0.55)) aimedFire(e, 1, 0, spd, WHT);
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
      if (canHurt) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = (e.kind === 'boss' || e.kind === 'mid' ? e.r * 0.7 : e.r * 0.7) + HIT_R;
        if (dx * dx + dy * dy < rr * rr) diePlayer();
        if (e.cannons && G.deadT <= 0) {
          for (let k = 0; k < e.cannons.length; k++) {
            const c = e.cannons[k];
            if (!c.alive) continue;
            const p = cannonPos(e, c);
            const cx = p.x - G.ship.x;
            const cy = p.y - G.ship.y;
            if (cx * cx + cy * cy < (10 + HIT_R) * (10 + HIT_R)) diePlayer();
          }
        }
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
      G.holdT = 0.2 + (Math.sin(G.t * 2) * 0.5 + 0.5) * 0.4;
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
      if (G.winT <= 0) {
        if (G.stage >= STAGES.length) goWin();
        else nextStage();
      }
      return;
    }

    if (!hasBoss() && !hasMid()) G.stageT += dt;
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

  function pathHex(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (rot || 0) + i * (TAU / 6);
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawHpBar(e) {
    const w = e.kind === 'boss' ? 120 : 86;
    const x = e.x - w * 0.5;
    const y = e.y - (e.kind === 'boss' ? e.rad + 22 : e.rad + 18);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, 5 * scale);
    const p = clamp(e.hp / Math.max(1, e.maxHp), 0, 1);
    ctx.fillStyle = rgba(p < 0.32 ? MAG : p < 0.6 ? YEL : GRN, 0.95);
    ctx.fillRect(sx(x), sy(y), w * p * scale, 5 * scale);
  }

  function drawBg() {
    const st = stageData();
    const biome = G.mode === 'title' ? 'cloud' : st.biome;
    const g = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    if (biome === 'fire') {
      g.addColorStop(0, '#2a0c08');
      g.addColorStop(0.45, '#1a0806');
      g.addColorStop(1, '#0c0404');
    } else if (biome === 'gate') {
      g.addColorStop(0, '#1a0a10');
      g.addColorStop(0.5, '#120608');
      g.addColorStop(1, '#080304');
    } else {
      g.addColorStop(0, '#24100c');
      g.addColorStop(0.4, '#160808');
      g.addColorStop(1, '#0a0404');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const scr = G.scroll;
    for (let i = 0; i < embers.length; i++) {
      const s = embers[i];
      ctx.fillStyle = rgba(i % 4 === 0 ? GOLD : i % 3 === 0 ? HOT : WHT, s.a * 0.7);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.s * scale, 0, TAU);
      ctx.fill();
    }

    if (biome === 'cloud') {
      for (let i = 0; i < 10; i++) {
        const yy = ((hash(i + 2) * VH * 1.6 + scr * 0.35) % (VH + 80)) - 40;
        const xx = 40 + hash(i * 9) * (VW - 80);
        ctx.fillStyle = 'rgba(255, 90, 40, ' + (0.05 + hash(i) * 0.07) + ')';
        ctx.beginPath();
        ctx.ellipse(sx(xx), sy(yy), (50 + hash(i * 3) * 40) * scale, (16 + hash(i * 5) * 12) * scale, 0, 0, TAU);
        ctx.fill();
      }
    } else if (biome === 'fire') {
      for (let i = 0; i < 8; i++) {
        const yy = ((hash(i + 4) * VH * 1.4 + scr * 0.5) % (VH + 60)) - 30;
        const xx = 30 + hash(i * 7) * (VW - 60);
        ctx.fillStyle = rgba(HOT, 0.08 + hash(i) * 0.08);
        pathHex(ctx, xx, yy, 18 + hash(i * 2) * 16, hash(i) * TAU);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = 'rgba(255, 74, 28, 0.1)';
      ctx.lineWidth = 1;
      const step = 36;
      const off = (scr * 0.4) % step;
      for (let y = -step; y < VH + step; y += step) {
        ctx.beginPath();
        ctx.moveTo(sx(40), sy(y + off));
        ctx.lineTo(sx(VW - 40), sy(y + off));
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255, 74, 28, 0.06)';
      ctx.fillRect(sx(0), sy(0), 36 * scale, VH * scale);
      ctx.fillRect(sx(VW - 36), sy(0), 36 * scale, VH * scale);
    }

    if (hasBoss()) {
      ctx.fillStyle = 'rgba(255, 74, 28, 0.05)';
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawEnemy(e) {
    const flash = e.flash > 0;
    const rgb = flash ? WHT : (e.kind === 'boss' || e.kind === 'mid' ? HOT : e.kind === 'elite' ? YEL : e.kind === 'hex' ? CYN : HOT);

    if (e.kind === 'boss' || e.kind === 'mid') {
      const rad = e.rad;
      ctx.strokeStyle = rgba(GOLD, 0.35);
      ctx.lineWidth = 2 * scale;
      pathHex(ctx, e.x, e.y, rad + 6, e.spin);
      ctx.stroke();
      ctx.fillStyle = rgba(DEEP, 0.85);
      pathHex(ctx, e.x, e.y, rad, e.spin);
      ctx.fill();
      ctx.strokeStyle = rgba(flash ? WHT : HOT, 0.95);
      ctx.lineWidth = 2.2 * scale;
      pathHex(ctx, e.x, e.y, rad, e.spin);
      ctx.stroke();
      ctx.fillStyle = rgba(e.stun > 0 ? GOLD : (flash ? WHT : HOT), 0.95);
      pathHex(ctx, e.x, e.y, e.r, e.spin * 0.4);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), 5 * scale, 0, TAU);
      ctx.fill();
      if (e.cannons) {
        for (let i = 0; i < e.cannons.length; i++) {
          const c = e.cannons[i];
          const p = cannonPos(e, c);
          if (!c.alive) {
            ctx.fillStyle = 'rgba(80,20,30,0.5)';
            ctx.beginPath();
            ctx.arc(sx(p.x), sy(p.y), 7 * scale, 0, TAU);
            ctx.fill();
            continue;
          }
          ctx.fillStyle = rgba(c.flash > 0 ? WHT : BALLS[i % BALLS.length], 0.95);
          ctx.beginPath();
          ctx.arc(sx(p.x), sy(p.y), 9 * scale, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = rgba(WHT, 0.7);
          ctx.lineWidth = 1.2 * scale;
          ctx.stroke();
          ctx.fillStyle = rgba(DEEP, 0.85);
          ctx.beginPath();
          ctx.arc(sx(p.x), sy(p.y), 3.2 * scale, 0, TAU);
          ctx.fill();
        }
      }
      drawHpBar(e);
      return;
    }

    if (e.kind === 'missile') {
      ctx.save();
      ctx.translate(sx(e.x), sy(e.y));
      const ang = Math.atan2(e.vy, e.vx || 0.001);
      ctx.rotate(ang);
      ctx.fillStyle = rgba(flash ? WHT : YEL, 0.95);
      ctx.beginPath();
      ctx.moveTo(10 * scale, 0);
      ctx.lineTo(-8 * scale, 5 * scale);
      ctx.lineTo(-5 * scale, 0);
      ctx.lineTo(-8 * scale, -5 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return;
    }

    if (e.kind === 'turret') {
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.fillRect(sx(e.x - 10), sy(e.y - 8), 20 * scale, 16 * scale);
      ctx.strokeStyle = rgba(flash ? WHT : HOT, 0.95);
      ctx.lineWidth = 1.6 * scale;
      ctx.strokeRect(sx(e.x - 10), sy(e.y - 8), 20 * scale, 16 * scale);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), 4 * scale, 0, TAU);
      ctx.fill();
      return;
    }

    if (e.kind === 'hex' || e.kind === 'elite' || e.kind === 'carrier') {
      const rr = e.kind === 'elite' ? 16 : e.kind === 'carrier' ? 15 : 12;
      ctx.fillStyle = rgba(DEEP, 0.9);
      pathHex(ctx, e.x, e.y, rr, e.spin || e.t);
      ctx.fill();
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = 1.8 * scale;
      pathHex(ctx, e.x, e.y, rr, e.spin || e.t);
      ctx.stroke();
      ctx.fillStyle = rgba(flash ? WHT : GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), 3.2 * scale, 0, TAU);
      ctx.fill();
      return;
    }

    ctx.fillStyle = rgba(rgb, 0.92);
    pathHex(ctx, e.x, e.y, 11, e.t * 0.4);
    ctx.fill();
    ctx.fillStyle = rgba(DEEP, 0.9);
    ctx.beginPath();
    ctx.arc(sx(e.x), sy(e.y - 1), 2.6 * scale, 0, TAU);
    ctx.fill();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.trail && s.trail.length > 1) {
        ctx.strokeStyle = rgba(s.rgb, 0.28);
        ctx.lineWidth = (s.kind === 'orb' ? 5 : 2.2) * scale;
        ctx.beginPath();
        for (let k = 0; k < s.trail.length; k++) {
          const p = s.trail[k];
          if (k === 0) ctx.moveTo(sx(p.x), sy(p.y));
          else ctx.lineTo(sx(p.x), sy(p.y));
        }
        ctx.stroke();
      }
      if (s.kind === 'orb') {
        ctx.fillStyle = rgba(s.rgb, 0.28);
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y), (s.r + 4) * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.9);
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y), s.r * 0.55 * scale, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(s.rgb, 0.95);
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
        ctx.stroke();
      } else {
        ctx.strokeStyle = rgba(s.rgb, 0.95);
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = rgba(s.rgb, 0.35);
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y), s.r * 0.45 * scale, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawBullets() {
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const col = b.rgb || WHT;
      ctx.fillStyle = rgba(col, 0.95);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.55);
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const pulse = 1 + Math.sin(p.t * 8) * 0.12;
      ctx.fillStyle = rgba(GOLD, 0.95);
      pathHex(ctx, p.x, p.y, 11 * pulse, p.t * 2);
      ctx.fill();
      ctx.fillStyle = rgba(DEEP, 0.95);
      ctx.font = '700 ' + Math.round(10 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('爆', sx(p.x), sy(p.y + 0.5));
    }
  }

  function drawShip() {
    if (G.mode === 'play' && G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const rgb = patRgb();
    const big = shipScale();
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(big, big);

    if (charged() && G.mode === 'play') {
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 22 * scale, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(rgb, 0.35);
      ctx.beginPath();
      ctx.arc(0, 0, 28 * scale, 0, TAU);
      ctx.stroke();
    }

    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.beginPath();
    ctx.moveTo(-6 * scale, 12 * scale);
    ctx.quadraticCurveTo(0, 26 * scale, 6 * scale, 12 * scale);
    ctx.fill();

    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -16 * scale);
    ctx.lineTo(11 * scale, 2 * scale);
    ctx.lineTo(7 * scale, 12 * scale);
    ctx.lineTo(-7 * scale, 12 * scale);
    ctx.lineTo(-11 * scale, 2 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * (TAU / 6);
      const px = Math.cos(a) * 7.4 * scale;
      const py = 1.2 * scale + Math.sin(a) * 7.4 * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -8 * scale);
    ctx.lineTo(3.4 * scale, 2 * scale);
    ctx.lineTo(-3.4 * scale, 2 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-1.2 * scale, -14 * scale, 2.4 * scale, 10 * scale);

    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(0, -18 * scale, 5 * scale, 0, TAU);
      ctx.fill();
    }

    ctx.restore();

    if (G.bombT > 0) {
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), G.bombR * scale, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(HOT, 0.4);
      ctx.lineWidth = 8 * scale;
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), G.bombR * 0.72 * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life * 3, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 2 * scale;
      const r = (8 + s.t * 18) * scale;
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
      ctx.lineWidth = (3 - r.t * 2) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (12 + r.t * 46) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = (f.gold ? '800 ' : '700 ') + Math.round((f.gold ? 16 : 13) * scale) + 'px sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.35);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#160808';
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
    ctx.fillStyle = '#160808';
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
      startGame('blast');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isBomb = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const isPat = k === 'x' || k === 'X' || k === 'c' || k === 'C' || k === 'Control' || code === 'ControlLeft' || code === 'ControlRight';
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
    if (k === 'ArrowUp' || k === 'ArrowDown' || isBomb || isPat) {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R' || isBomb || isPat)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (isPat) {
      cyclePat();
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
      startGame('blast');
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

  function bindPatBtn(el) {
    if (!el) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      audio.ensure();
      cyclePat();
    });
  }

  seedEmbers();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnBlast) {
    btnBlast.addEventListener('click', function () {
      audio.ensure();
      startGame('blast');
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
      startGame(G.kind || 'blast');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && G.kind === 'blast') startGame('rain');
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
  bindPatBtn(btnPat);
  bindPatBtn(btnPadPat);

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.sht = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = keys.u = keys.d = keys.sht = false;
    } else {
      last = 0;
    }
  });

  requestAnimationFrame(frame);
})();
