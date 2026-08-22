'use strict';

(function () {
  const VW = 720;
  const VH = 720;
  const WW = 2200;
  const WH = 2200;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SHIP_R = 10;
  const ROT = 4.45;
  const THRUST = 252;
  const REV = 96;
  const MAX_V = 298;
  const DRAG = 0.22;
  const SHOT_V = 540;
  const SHOT_LIFE = 0.7;
  const SHOT_CD = 0.11;
  const MAX_SHOTS = 4;
  const BOMB_V = 318;
  const BOMB_TURN = 8.2;
  const BOMB_CD = 0.3;
  const BOMB_LIFE = 3.8;
  const BOMB_R = 8;
  const BOMB_CAP = 13;
  const CRYSTAL_R = 7;
  const WORKER_R = 9;
  const WARRIOR_R = 11;
  const SINI_R = 48;
  const PIECES = 6;
  const ZONES = 4;
  const COMBO_WIN = 1.52;
  const EXTRA_LIFE = 12000;
  const BEST_KEY = 'playbox-sinistar-best';
  const MUTE_KEY = 'playbox-sinistar-mute';
  const AUTO_SPEED_KEY = 'playbox-sinistar-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 1, 2, 4, 10];
  const AUTO_START_WAIT = [0, 0.55, 0.38, 0.2, 0.06];
  const AUTO_RETRY_WAIT = [0, 1.2, 0.9, 0.65, 0.32];
  const OPS = '← → 转向 · W / ↑ 推进 · 空格开火 · C 星弹 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 110];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const WHT = [255, 236, 240];
  const ROSE = [255, 138, 160];
  const YLW = [255, 196, 74];
  const RED = [255, 72, 88];
  const ROCKC = [255, 110, 140];
  const ROCK2 = [255, 158, 120];
  const ROCK3 = [255, 200, 140];

  const ROCK = [
    { r: 36, hp: 3, score: 50, next: 1, kids: 2, crystals: 2, spd0: 16, spd1: 40, spin: 0.55, rgb: ROCKC },
    { r: 22, hp: 2, score: 80, next: 2, kids: 2, crystals: 1, spd0: 26, spd1: 62, spin: 0.95, rgb: ROCK2 },
    { r: 12, hp: 1, score: 120, next: -1, kids: 0, crystals: 1, spd0: 38, spd1: 86, spin: 1.6, rgb: ROCK3 }
  ];

  const ROARS = ['我活了', '逃啊', '胆小鬼', '我是星吞', '来被吞掉'];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnCamp = document.getElementById('btn-camp');
  const btnFrenzy = document.getElementById('btn-frenzy');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const bombLabel = document.getElementById('bomb-label');
  const siniLabel = document.getElementById('sini-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');
  const padCcw = document.getElementById('pad-ccw');
  const padCw = document.getElementById('pad-cw');
  const padThrust = document.getElementById('pad-thrust');
  const padFire = document.getElementById('pad-fire');
  const padBomb = document.getElementById('pad-bomb');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');

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

  const keys = { l: false, r: false, u: false, d: false, fire: false, bomb: false };
  const pointer = { down: false, aim: 0, id: null, bomb: false };
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoGoal = null;
  let autoFire = false;
  let autoBomb = false;
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'camp',
    t: 0,
    clock: 0,
    zone: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    nextLife: EXTRA_LIFE,
    bombs: 0,
    ship: { x: WW * 0.5, y: WH * 0.5, vx: 0, vy: 0, ang: 0 },
    cam: { x: WW * 0.5, y: WH * 0.5 },
    sini: { x: 400, y: 400, vx: 0, vy: 0, pieces: 0, max: PIECES, live: false, roarT: 0, hitFlash: 0 },
    rocks: [],
    crystals: [],
    workers: [],
    warriors: [],
    shots: [],
    sBombs: [],
    wShots: [],
    fireCd: 0,
    bombCd: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    toastT: 0,
    thrustT: 0,
    muzzle: 0,
    zoneWait: 0,
    workerWait: 0,
    warriorWait: 0,
    why: '',
    demoT: 1.2
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
  function wrap(v, max) {
    v = v % max;
    if (v < 0) v += max;
    return v;
  }
  function wrapDelta(a, b, size) {
    let d = a - b;
    const h = size * 0.5;
    if (d > h) d -= size;
    if (d < -h) d += size;
    return d;
  }
  function wrapDist(ax, ay, bx, by) {
    const dx = wrapDelta(ax, bx, WW);
    const dy = wrapDelta(ay, by, WH);
    return { dx: dx, dy: dy, d: hypot(dx, dy) };
  }
  function angNorm(a) {
    a = (a + Math.PI) % TAU;
    if (a < 0) a += TAU;
    return a - Math.PI;
  }
  function isFrenzy() {
    return G.kind === 'frenzy';
  }
  function diff() {
    return 1 + (G.zone - 1) * 0.12 + (isFrenzy() ? 0.4 : 0);
  }
  function viewX(x) {
    return VW * 0.5 + wrapDelta(x, G.cam.x, WW);
  }
  function viewY(y) {
    return VH * 0.5 + wrapDelta(y, G.cam.y, WH);
  }
  function onScreen(x, y, r) {
    const vx = viewX(x);
    const vy = viewY(y);
    return vx > -r && vx < VW + r && vy > -r && vy < VH + r;
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
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
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
      this.beep(880, 0.05, 'square', 0.028, 1640);
      this.beep(420, 0.035, 'triangle', 0.014, 180);
    },
    thrust() {
      this.ensure();
      this.noise(0.045, 0.016, 380);
      this.beep(82, 0.045, 'sawtooth', 0.012, 50);
    },
    rockHit() {
      this.ensure();
      this.noise(0.05, 0.032, 700);
      this.beep(420, 0.05, 'square', 0.028, 180);
    },
    bust(size) {
      this.ensure();
      const low = size === 0 ? 110 : size === 1 ? 170 : 260;
      const hi = size === 0 ? 300 : size === 1 ? 500 : 780;
      this.noise(size === 0 ? 0.12 : 0.07, size === 0 ? 0.06 : 0.04, 260);
      this.beep(hi, 0.08, 'square', 0.046, low);
    },
    crystal() {
      this.ensure();
      this.beep(1320, 0.07, 'sine', 0.05, 1980);
      this.beep(1980, 0.11, 'triangle', 0.032, 2640);
    },
    steal() {
      this.ensure();
      this.beep(740, 0.05, 'square', 0.028, 420);
    },
    deliver() {
      this.ensure();
      this.beep(180, 0.09, 'sawtooth', 0.04, 90);
      this.beep(320, 0.07, 'square', 0.03, 160);
    },
    empty() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.02, 80);
    },
    bombFire() {
      this.ensure();
      this.beep(240, 0.08, 'square', 0.042, 110);
      this.beep(90, 0.14, 'sawtooth', 0.036, 48);
    },
    bombHit() {
      this.ensure();
      this.noise(0.12, 0.07, 180);
      this.beep(200, 0.16, 'sawtooth', 0.06, 48);
      this.beep(480, 0.09, 'square', 0.04, 140);
    },
    roar() {
      this.ensure();
      this.beep(88, 0.48, 'sawtooth', 0.08, 40);
      this.beep(150, 0.3, 'square', 0.05, 52);
      this.noise(0.24, 0.055, 90);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.04, 784);
      this.beep(784, 0.1, 'triangle', 0.04, 1046);
      this.beep(1046, 0.18, 'sine', 0.045, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.06, 300);
      this.beep(280, 0.2, 'sawtooth', 0.055, 70);
      this.beep(160, 0.32, 'sine', 0.045, 48);
    },
    eat() {
      this.ensure();
      this.noise(0.22, 0.08, 80);
      this.beep(70, 0.4, 'sawtooth', 0.08, 32);
      this.beep(180, 0.22, 'square', 0.05, 40);
    },
    kill() {
      this.ensure();
      this.noise(0.08, 0.045, 500);
      this.beep(620, 0.08, 'square', 0.04, 240);
    },
    siniDown() {
      this.ensure();
      this.noise(0.22, 0.08, 140);
      this.beep(160, 0.28, 'sawtooth', 0.07, 42);
      this.beep(392, 0.14, 'triangle', 0.05, 784);
      this.beep(784, 0.22, 'sine', 0.045, 1568);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.18, 'triangle', 0.04, 1046);
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
      this.beep(330, 0.08, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.035, 990);
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

  function autoScale() {
    if (!autoOn) return 1;
    if (G.mode === 'play') return AUTO_SCALE[autoSpeed] || 1;
    return 1;
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    while (G.score >= G.nextLife && G.lives < 6) {
      G.nextLife += EXTRA_LIFE;
      G.lives += 1;
      audio.extra();
      toast('1UP', false, true);
      screenFlash(GOLD, 0.5);
      kick(3.2);
      syncPips();
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
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    while (pips.length > n && pips.length > LIVES) {
      const d = pips.pop();
      if (d && d.parentNode) d.parentNode.removeChild(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : (G.mode !== 'title' ? ' gone' : ''));
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      toast('连击 ×' + G.mult, false, true);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '星吞';
      else stageLabel.textContent = '第 ' + G.zone + ' 矿区';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.sini.live || G.zone >= 3));
    }
    if (tagLabel) {
      tagLabel.textContent = isFrenzy() ? '狂暴' : '采矿';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || G.sini.live);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (bombLabel) {
      bombLabel.textContent = '弹 ' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (siniLabel) {
      if (G.sini.live) siniLabel.textContent = '它活了';
      else siniLabel.textContent = '脸 ' + G.sini.pieces + '/' + G.sini.max;
      siniLabel.classList.toggle('warn', G.sini.live);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (autoOn && G.mode === 'play') {
      setHint('自动托管 · 凿矿取晶 · 星弹打脸 · A 停下', G.sini.live ? 'warn' : '');
    } else if (autoOn && G.mode === 'title') {
      setHint('自动托管 · 即将开局 · A 停下');
    } else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) {
      setHint('自动仍开着 · 即将再来 · A 停下', G.mode === 'win' ? 'hot' : 'warn');
    } else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 战士撞击或被吞即扣命', 'warn');
    else if (G.mode === 'win') setHint('星吞粉碎 · R 再来', 'hot');
    else if (G.sini.live) setHint('它活了 · C 星弹打脸 · 别被吞', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 雷达盯工人和那张脸', 'warn');
    else if (G.bombs <= 0) setHint('凿矿取晶 · 炼成星弹 · 别让工人先拼完', '');
    else setHint('星弹 ×' + G.bombs + ' · C 打正在拼的脸', G.combo >= 6 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SINI';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (btnCamp) btnCamp.textContent = primary;
    if (btnFrenzy) {
      btnFrenzy.textContent = secondary;
      btnFrenzy.classList.remove('hidden');
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
    if (autoOn && autoSpeed >= 3) return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 7 ? 'roar' : mag >= 5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('roar');
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

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.3, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 0,
        life: rand(0.22, 0.55),
        max: 0.55,
        r: rand(1.1, 2.8),
        rgb: i % 4 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 280);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 40);
  }

  function popRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 12 });
    capArr(rings, 28);
  }

  function popFloat(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, vy: -52, t: 0, life: 0.72,
      text: text, rgb: rgb, gold: !!gold, size: gold ? 16 : 13
    });
    capArr(floats, 24);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * WW,
        y: Math.random() * WH,
        r: Math.random() < 0.18 ? 1.5 : 0.7,
        a: rand(0.22, 0.9),
        p: Math.random() * TAU,
        layer: Math.random() < 0.35 ? 0.35 : Math.random() < 0.5 ? 0.62 : 1,
        rgb: Math.random() < 0.16 ? MAG : Math.random() < 0.12 ? CYN : Math.random() < 0.1 ? GOLD : WHT
      });
    }
  }

  function makeShape(r) {
    const n = 8 + ((Math.random() * 5) | 0);
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.12, 0.12);
      const rr = r * rand(0.68, 1.14);
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    return pts;
  }

  function spawnRock(size, x, y, vx, vy) {
    const spec = ROCK[size];
    const spd = rand(spec.spd0, spec.spd1) * (0.85 + diff() * 0.18);
    const dir = Math.random() * TAU;
    return {
      x: wrap(x, WW),
      y: wrap(y, WH),
      vx: vx == null ? Math.cos(dir) * spd : vx,
      vy: vy == null ? Math.sin(dir) * spd : vy,
      r: spec.r,
      size: size,
      hp: spec.hp,
      ang: Math.random() * TAU,
      spin: rand(-spec.spin, spec.spin),
      pts: makeShape(spec.r),
      rgb: spec.rgb,
      alive: true
    };
  }

  function spawnCrystal(x, y, vx, vy) {
    G.crystals.push({
      x: wrap(x, WW),
      y: wrap(y, WH),
      vx: vx == null ? rand(-28, 28) : vx,
      vy: vy == null ? rand(-28, 28) : vy,
      ang: Math.random() * TAU,
      spin: rand(-2.4, 2.4),
      life: 18,
      alive: true
    });
    capArr(G.crystals, 28);
  }

  function farFrom(x, y, minD) {
    for (let i = 0; i < 18; i++) {
      const px = rand(0, WW);
      const py = rand(0, WH);
      if (wrapDist(px, py, x, y).d >= minD) return { x: px, y: py };
    }
    return { x: wrap(x + WW * 0.5, WW), y: wrap(y + WH * 0.42, WH) };
  }

  function spawnWorker(x, y) {
    G.workers.push({
      x: x, y: y,
      vx: 0, vy: 0,
      ang: Math.random() * TAU,
      carry: false,
      mineT: 0,
      alive: true,
      hitFlash: 0
    });
  }

  function nearestRock(x, y) {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      const d = wrapDist(x, y, r.x, r.y).d;
      if (d < bestD) {
        bestD = d;
        best = r;
      }
    }
    return best;
  }

  function spawnWarrior(x, y) {
    G.warriors.push({
      x: x, y: y,
      vx: 0, vy: 0,
      ang: Math.random() * TAU,
      shootT: rand(0.6, 1.6),
      alive: true,
      hitFlash: 0
    });
  }

  function workerCount() {
    let n = 0;
    for (let i = 0; i < G.workers.length; i++) if (G.workers[i].alive) n += 1;
    return n;
  }
  function warriorCount() {
    let n = 0;
    for (let i = 0; i < G.warriors.length; i++) if (G.warriors[i].alive) n += 1;
    return n;
  }
  function rockCount() {
    let n = 0;
    for (let i = 0; i < G.rocks.length; i++) if (G.rocks[i].alive) n += 1;
    return n;
  }

  function wantedWorkers() {
    return (isFrenzy() ? 5 : 3) + (G.zone >= 3 ? 1 : 0);
  }
  function wantedWarriors() {
    return (isFrenzy() ? 3 : 1) + (G.zone - 1);
  }
  function wantedRocks() {
    return 8 + G.zone + (isFrenzy() ? 2 : 0);
  }

  function workerSpd() {
    return 90 * (isFrenzy() ? 1.58 : 1) * (1 + (G.zone - 1) * 0.08);
  }
  function warriorSpd() {
    return 112 * (isFrenzy() ? 1.38 : 1) * (1 + (G.zone - 1) * 0.1);
  }
  function siniSpd() {
    return 96 * (isFrenzy() ? 1.42 : 1) * (1 + (G.zone - 1) * 0.12);
  }

  function clearField() {
    G.rocks.length = 0;
    G.crystals.length = 0;
    G.workers.length = 0;
    G.warriors.length = 0;
    G.shots.length = 0;
    G.sBombs.length = 0;
    G.wShots.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function placeSiniFar() {
    const p = farFrom(G.ship.x, G.ship.y, 720);
    G.sini.x = p.x;
    G.sini.y = p.y;
    G.sini.vx = 0;
    G.sini.vy = 0;
    G.sini.pieces = 0;
    G.sini.max = PIECES;
    G.sini.live = false;
    G.sini.roarT = 0;
    G.sini.hitFlash = 0;
  }

  function spawnZoneField() {
    const ship = G.ship;
    const nR = wantedRocks();
    for (let i = 0; i < nR; i++) {
      const p = farFrom(ship.x, ship.y, 220);
      G.rocks.push(spawnRock(0, p.x, p.y, null, null));
    }
    const nW = wantedWorkers();
    for (let i = 0; i < nW; i++) {
      const p = farFrom(ship.x, ship.y, 280);
      spawnWorker(p.x, p.y);
    }
    const nA = wantedWarriors();
    for (let i = 0; i < nA; i++) {
      const p = farFrom(ship.x, ship.y, 340);
      spawnWarrior(p.x, p.y);
    }
    G.workerWait = 0;
    G.warriorWait = 0;
  }

  function resetShip(center) {
    if (center) {
      G.ship.x = WW * 0.5;
      G.ship.y = WH * 0.5;
    }
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.ship.ang = 0;
    G.cam.x = G.ship.x;
    G.cam.y = G.ship.y;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'camp';
    G.zone = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.bombs = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.ready = 0;
    G.zoneWait = 0;
    G.why = '';
    G.sini.live = false;
    clearField();
    resetShip(true);
    placeSiniFar();
    G.sini.pieces = 3;
    for (let i = 0; i < 6; i++) {
      const p = farFrom(G.ship.x, G.ship.y, 160);
      G.rocks.push(spawnRock((Math.random() * 3) | 0, p.x, p.y, null, null));
    }
    spawnWorker(G.ship.x + 220, G.ship.y - 80);
    spawnWorker(G.ship.x - 180, G.ship.y + 140);
    spawnCrystal(G.ship.x + 90, G.ship.y - 120, 10, -8);
    showOverlay('title', '星吞', '凿矿取晶，炼成星弹。工人在拼那张脸。拼完它会追着吞你。', '采矿', '狂暴');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'frenzy' ? 'frenzy' : 'camp';
    G.mode = 'play';
    G.zone = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = EXTRA_LIFE;
    G.bombs = 0;
    G.deadT = 0;
    G.invuln = 1.1;
    G.fireCd = 0;
    G.bombCd = 0;
    G.stop = 0;
    G.zoneWait = 0;
    G.why = '';
    autoOvWait = 0;
    autoGoal = null;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    resetShip(true);
    placeSiniFar();
    spawnZoneField();
    G.ready = 0.9;
    hideOverlay();
    audio.start();
    audio.wave();
    toast((isFrenzy() ? '狂暴' : '采矿') + ' · 第 1 矿区', false, true);
    screenFlash(CYN, 0.35);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('camp');
    else startGame(G.kind);
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why || '舰毁了';
    audio.lose();
    kick(6.5);
    screenFlash(MAG, 0.55);
    const rec = G.score >= G.best && G.score > 0 ? ' 新纪录。' : '';
    showOverlay('lose', G.why, '第 ' + G.zone + ' 矿区 · ' + G.score + ' 分。' + rec + '工人拼完那张脸就会吞你。', '再来', '换模式');
    syncHud();
  }

  function winRun() {
    G.mode = 'win';
    addScore(isFrenzy() ? 12000 : 8000);
    audio.win();
    kick(4.5);
    screenFlash(GOLD, 0.6);
    const rec = G.score >= G.best && G.score > 0 ? ' 新纪录。' : '';
    showOverlay(
      'win',
      isFrenzy() ? '狂暴通关' : '采矿通关',
      '四矿区星吞尽碎 · ' + G.score + ' 分。' + rec,
      '再来',
      isFrenzy() ? '换模式' : '狂暴'
    );
    syncHud();
  }

  function nextZone() {
    G.zone += 1;
    if (G.zone > ZONES) {
      winRun();
      return;
    }
    G.zoneWait = 0;
    G.shots.length = 0;
    G.sBombs.length = 0;
    G.wShots.length = 0;
    placeSiniFar();
    G.invuln = Math.max(G.invuln, 0.9);
    const needR = wantedRocks() - rockCount();
    for (let i = 0; i < needR; i++) {
      const p = farFrom(G.ship.x, G.ship.y, 240);
      G.rocks.push(spawnRock(0, p.x, p.y, null, null));
    }
    audio.wave();
    toast('第 ' + G.zone + ' 矿区 · 加速', false, true);
    screenFlash(GOLD, 0.4);
    kick(3.4);
    G.ready = 0.7;
    syncHud();
  }

  function awakenSini() {
    if (G.sini.live) return;
    G.sini.live = true;
    G.sini.roarT = 0.2;
    audio.roar();
    toast('我活了', true, false);
    popRing(G.sini.x, G.sini.y, MAG, 40);
    burst(G.sini.x, G.sini.y, MAG, 28, 220);
    screenFlash(MAG, 0.62);
    kick(7.5);
    hitStop(0.07);
  }

  function siniKilled() {
    const live = G.sini.live;
    const pts = (live ? 4000 : 1500) * G.zone * G.mult;
    addScore(pts);
    bumpCombo();
    audio.siniDown();
    popRing(G.sini.x, G.sini.y, GOLD, 70);
    burst(G.sini.x, G.sini.y, MAG, 42, 280);
    burst(G.sini.x, G.sini.y, GOLD, 18, 180);
    popFloat(G.sini.x, G.sini.y, '+' + pts, GOLD, true);
    screenFlash(GOLD, 0.55);
    kick(6.2);
    hitStop(0.08);
    toast(live ? '星吞粉碎' : '脸被拆了', false, true);
    G.sini.live = false;
    G.sini.pieces = 0;
    G.sini.vx = 0;
    G.sini.vy = 0;
    G.zoneWait = 1.35;
  }

  function killPlayer(why) {
    if (G.deadT > 0 || G.invuln > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 1.15;
    G.why = why || 'warrior';
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (why === 'eat') audio.eat();
    else audio.death();
    burst(G.ship.x, G.ship.y, CYN, 26, 240);
    burst(G.ship.x, G.ship.y, MAG, 10, 160);
    popRing(G.ship.x, G.ship.y, MAG, 28);
    screenFlash(MAG, 0.5);
    kick(6);
    hitStop(0.06);
    G.wShots.length = 0;
    syncPips();
    syncHud();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (overlayOpen()) return;
    if (G.fireCd > 0) return;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].alive) n += 1;
    if (n >= MAX_SHOTS) return;
    const ship = G.ship;
    const ca = Math.sin(ship.ang);
    const sa = -Math.cos(ship.ang);
    G.shots.push({
      x: ship.x + ca * 14,
      y: ship.y + sa * 14,
      vx: ship.vx * 0.25 + ca * SHOT_V,
      vy: ship.vy * 0.25 + sa * SHOT_V,
      life: SHOT_LIFE,
      alive: true
    });
    G.fireCd = SHOT_CD;
    G.muzzle = 0.06;
    audio.shoot();
  }

  function fireBomb() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (overlayOpen()) return;
    if (G.bombCd > 0) return;
    if (G.bombs <= 0) {
      if (G.bombCd <= 0) {
        audio.empty();
        G.bombCd = 0.2;
      }
      return;
    }
    G.bombs -= 1;
    G.bombCd = BOMB_CD;
    const ship = G.ship;
    const ca = Math.sin(ship.ang);
    const sa = -Math.cos(ship.ang);
    G.sBombs.push({
      x: ship.x + ca * 16,
      y: ship.y + sa * 16,
      ang: ship.ang,
      life: BOMB_LIFE,
      alive: true
    });
    G.muzzle = 0.08;
    audio.bombFire();
    popSpark(ship.x + ca * 16, ship.y + sa * 16, GOLD, 12);
    syncHud();
  }

  function pickupCrystal(c) {
    if (!c.alive) return;
    c.alive = false;
    if (G.mode === 'play') {
      const n = 200 * G.mult;
      addScore(n);
      bumpCombo();
      if (G.bombs < BOMB_CAP) G.bombs += 1;
      audio.crystal();
      popSpark(c.x, c.y, GOLD, 18);
      burst(c.x, c.y, GOLD, 12, 140);
      popFloat(c.x, c.y, '+' + n, GOLD, true);
      if (G.bombs === 1) toast('星弹就绪', false, true);
    } else {
      burst(c.x, c.y, GOLD, 8, 100);
    }
  }

  function breakRock(r, scored) {
    r.alive = false;
    const spec = ROCK[r.size];
    audio.bust(r.size);
    burst(r.x, r.y, spec.rgb, 10 + (2 - r.size) * 6, 140 + (2 - r.size) * 40);
    popSpark(r.x, r.y, spec.rgb, r.r);
    if (scored !== false && G.mode === 'play') {
      const n = spec.score * G.mult;
      addScore(n);
      bumpCombo();
      popFloat(r.x, r.y, '+' + n, spec.rgb, G.mult >= 2);
      hitStop(r.size === 0 ? 0.04 : 0.028);
      kick(r.size === 0 ? 2.6 : 1.6);
    }
    for (let i = 0; i < spec.crystals; i++) {
      const a = rand(0, TAU);
      spawnCrystal(r.x + Math.cos(a) * 8, r.y + Math.sin(a) * 8, Math.cos(a) * rand(20, 70), Math.sin(a) * rand(20, 70));
    }
    if (spec.next >= 0) {
      for (let i = 0; i < spec.kids; i++) {
        const a = rand(0, TAU);
        const spd = rand(40, 90);
        G.rocks.push(spawnRock(spec.next, r.x, r.y, Math.cos(a) * spd, Math.sin(a) * spd));
      }
    }
  }

  function hitRock(r, scored) {
    r.hp -= 1;
    audio.rockHit();
    popSpark(r.x, r.y, r.rgb, 10);
    burst(r.x, r.y, r.rgb, 4, 80);
    if (scored !== false && G.mode === 'play') addScore(10 * G.mult);
    if (r.hp <= 0) breakRock(r, scored);
  }

  function killWorker(w) {
    w.alive = false;
    audio.kill();
    burst(w.x, w.y, YLW, 12, 150);
    popSpark(w.x, w.y, YLW, 14);
    if (w.carry) spawnCrystal(w.x, w.y, rand(-40, 40), rand(-40, 40));
    if (G.mode === 'play') {
      const n = 150 * G.mult;
      addScore(n);
      bumpCombo();
      popFloat(w.x, w.y, '+' + n, YLW, false);
      hitStop(0.032);
      kick(2);
    }
    G.workerWait = Math.max(G.workerWait, isFrenzy() ? 2.2 : 3.4);
  }

  function killWarrior(w) {
    w.alive = false;
    audio.kill();
    burst(w.x, w.y, RED, 16, 180);
    popSpark(w.x, w.y, RED, 16);
    if (G.mode === 'play') {
      const n = 500 * G.mult;
      addScore(n);
      bumpCombo();
      popFloat(w.x, w.y, '+' + n, RED, G.mult >= 2);
      hitStop(0.04);
      kick(2.8);
    }
    G.warriorWait = Math.max(G.warriorWait, isFrenzy() ? 1.8 : 2.8);
  }

  function nearestCrystal(x, y) {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.crystals.length; i++) {
      const c = G.crystals[i];
      if (!c.alive) continue;
      const d = wrapDist(x, y, c.x, c.y).d;
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  function nearestWarrior(x, y) {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.warriors.length; i++) {
      const w = G.warriors[i];
      if (!w.alive) continue;
      const d = wrapDist(x, y, w.x, w.y).d;
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    }
    return best;
  }

  function workerNearCrystal(c, slack) {
    if (!c) return null;
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.workers.length; i++) {
      const w = G.workers[i];
      if (!w.alive || w.carry) continue;
      const d = wrapDist(w.x, w.y, c.x, c.y).d;
      if (d < bestD) {
        bestD = d;
        best = w;
      }
    }
    if (best && bestD < slack) return best;
    return null;
  }

  function facingErrTo(x, y) {
    const w = wrapDist(x, y, G.ship.x, G.ship.y);
    const desired = Math.atan2(w.dx, -w.dy);
    return { err: angNorm(desired - G.ship.ang), d: w.d, dx: w.dx, dy: w.dy };
  }

  function shotClearsCrystal(alongMax) {
    const ca = Math.sin(G.ship.ang);
    const sa = -Math.cos(G.ship.ang);
    for (let i = 0; i < G.crystals.length; i++) {
      const c = G.crystals[i];
      if (!c.alive) continue;
      const w = wrapDist(c.x, c.y, G.ship.x, G.ship.y);
      const along = w.dx * ca + w.dy * sa;
      if (along < 8 || along > alongMax) continue;
      const px = w.dx - ca * along;
      const py = w.dy - sa * along;
      if (hypot(px, py) < CRYSTAL_R + 10) return false;
    }
    return true;
  }

  function inShotCone(ent, rad, maxD) {
    if (!ent || !ent.alive) return false;
    const leadT = Math.min(0.28, wrapDist(ent.x, ent.y, G.ship.x, G.ship.y).d / SHOT_V);
    const tx = wrap(ent.x + (ent.vx || 0) * leadT, WW);
    const ty = wrap(ent.y + (ent.vy || 0) * leadT, WH);
    const f = facingErrTo(tx, ty);
    if (f.d > maxD || f.d < rad + 6) return false;
    if (Math.abs(f.err) > (rad > 20 ? 0.32 : 0.22)) return false;
    if (!shotClearsCrystal(f.d - rad)) return false;
    return true;
  }

  function clearPlayerMotion() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.fire = false;
    keys.bomb = false;
    pointer.down = false;
    pointer.id = null;
    autoFire = false;
    autoBomb = false;
    if (padCcw) padCcw.classList.remove('on');
    if (padCw) padCw.classList.remove('on');
    if (padThrust) padThrust.classList.remove('on');
    if (padFire) padFire.classList.remove('on');
    if (padBomb) padBomb.classList.remove('on');
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl || !speedLab) return;
    speedEl.value = String(autoSpeed);
    speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoGoal = null;
    clearPlayerMotion();
    syncAutoUi();
    if (!autoOn) {
      syncHud();
      return;
    }
    audio.ensure();
    syncHud();
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!(n >= 1 && n <= 4)) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function autoPickGoal() {
    const ship = G.ship;
    let best = null;
    let bestS = -1e12;

    function consider(kind, ref, x, y, hold, score) {
      if (score > bestS) {
        bestS = score;
        best = { kind: kind, ref: ref, x: x, y: y, hold: hold };
      }
    }

    if (autoGoal) {
      if (autoGoal.ref && autoGoal.ref.alive === false) autoGoal = null;
      else if (autoGoal.kind === 'sini' && !G.sini.live && G.sini.pieces <= 0) autoGoal = null;
    }

    for (let i = 0; i < G.crystals.length; i++) {
      const c = G.crystals[i];
      if (!c.alive) continue;
      const d = wrapDist(ship.x, ship.y, c.x, c.y).d;
      let s = 1400 - d;
      const thief = workerNearCrystal(c, d + 40);
      if (thief) s += 220;
      if (d < 90) s += 360;
      if (autoGoal && autoGoal.kind === 'crystal' && autoGoal.ref === c) s += 80;
      consider('crystal', c, wrap(c.x + c.vx * 0.12, WW), wrap(c.y + c.vy * 0.12, WH), 0, s);
    }

    for (let i = 0; i < G.workers.length; i++) {
      const w = G.workers[i];
      if (!w.alive || !w.carry) continue;
      const d = wrapDist(ship.x, ship.y, w.x, w.y).d;
      let s = 980 - d * 0.85;
      if (autoGoal && autoGoal.kind === 'worker' && autoGoal.ref === w) s += 70;
      consider('worker', w, w.x, w.y, 70, s);
    }

    const needBombs = G.bombs < (G.sini.live ? 4 : 6);
    if (needBombs || !best || best.kind !== 'crystal') {
      for (let i = 0; i < G.rocks.length; i++) {
        const r = G.rocks[i];
        if (!r.alive) continue;
        const d = wrapDist(ship.x, ship.y, r.x, r.y).d;
        let s = (needBombs ? 720 : 380) - d * 0.45 + (2 - r.size) * 40;
        if (autoGoal && autoGoal.kind === 'rock' && autoGoal.ref === r) s += 90;
        consider('rock', r, r.x, r.y, r.r + 78, s);
      }
    }

    if (G.bombs > 0 && (G.sini.live || G.sini.pieces >= 2)) {
      const d = wrapDist(ship.x, ship.y, G.sini.x, G.sini.y).d;
      const hold = G.sini.live ? 240 : 150;
      let s = (G.sini.live ? 860 : 520) - Math.abs(d - hold) * 0.7;
      if (G.bombs >= 4) s += 160;
      consider('sini', G.sini, G.sini.x, G.sini.y, hold, s);
    }

    const war = nearestWarrior(ship.x, ship.y);
    if (war) {
      const d = wrapDist(ship.x, ship.y, war.x, war.y).d;
      if (d < 280) {
        consider('warrior', war, war.x, war.y, 130, 340 - d * 0.4);
      }
    }

    if (autoGoal && best && autoGoal.kind === best.kind && autoGoal.ref === best.ref) {
      return best;
    }
    if (autoGoal && autoGoal.ref && (autoGoal.ref.alive !== false) && best) {
      const stick = autoGoal.kind === 'crystal' ? 140 : 90;
      const dOld = wrapDist(ship.x, ship.y, autoGoal.x, autoGoal.y).d;
      if (dOld < 420 && bestS < 700) {
        autoGoal.x = autoGoal.ref.x;
        autoGoal.y = autoGoal.ref.y;
        return autoGoal;
      }
      if (bestS < stick) return autoGoal;
    }
    return best;
  }

  function autoSteer(tx, ty, holdR, fleeX, fleeY, panic) {
    const ship = G.ship;
    const w = wrapDist(tx, ty, ship.x, ship.y);
    const d = Math.max(0.001, w.d);
    const nx = w.dx / d;
    const ny = w.dy / d;
    const spd = hypot(ship.vx, ship.vy);
    const closing = ship.vx * nx + ship.vy * ny;

    let faceX = nx;
    let faceY = ny;
    if (panic > 0.55) {
      faceX = fleeX;
      faceY = fleeY;
    }
    const fln = hypot(faceX, faceY) || 1;
    faceX /= fln;
    faceY /= fln;

    const desired = Math.atan2(faceX, -faceY);
    const errA = angNorm(desired - ship.ang);
    if (errA > 0.07) keys.r = true;
    else if (errA < -0.07) keys.l = true;

    const aligned = Math.abs(errA) < (panic > 0.45 ? 0.9 : 0.42);
    const thrustAlign = Math.abs(errA) < (d > 180 ? 1.05 : 0.7);
    const tooFast = holdR > 0 && d < holdR + 18 && closing > 85;
    const overshoot = holdR <= 0 && d < 52 && closing > 64 && spd > 80;
    if (overshoot || tooFast) {
      const velH = Math.atan2(ship.vx, -ship.vy);
      if (Math.abs(angNorm(velH - ship.ang)) < 0.55) keys.d = true;
    } else if (holdR > 0 && d < holdR + 10 && d > holdR - 18 && aligned) {
      if (spd < 70) keys.u = true;
    } else if (aligned || thrustAlign) {
      if (!(holdR > 0 && d < holdR - 8 && closing > 20)) keys.u = true;
    }
  }

  function autoThink() {
    autoFire = false;
    autoBomb = false;
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.fire = false;
    keys.bomb = false;
    pointer.down = false;
    if (G.mode !== 'play' || G.deadT > 0) return;

    const ship = G.ship;
    let fleeX = 0;
    let fleeY = 0;
    let panic = 0;

    for (let i = 0; i < G.warriors.length; i++) {
      const w = G.warriors[i];
      if (!w.alive) continue;
      const dist = wrapDist(ship.x, ship.y, w.x, w.y);
      if (dist.d < 240 && dist.d > 0.001) {
        const k = (240 - dist.d) / 240;
        fleeX -= (dist.dx / dist.d) * k * 1.6;
        fleeY -= (dist.dy / dist.d) * k * 1.6;
        panic = Math.max(panic, k);
      }
    }
    for (let i = 0; i < G.wShots.length; i++) {
      const s = G.wShots[i];
      if (!s.alive) continue;
      const dist = wrapDist(ship.x, ship.y, s.x, s.y);
      const relVx = s.vx - ship.vx;
      const relVy = s.vy - ship.vy;
      const relSpd2 = relVx * relVx + relVy * relVy;
      let tHit = 0;
      if (relSpd2 > 1) tHit = -(dist.dx * relVx + dist.dy * relVy) / relSpd2;
      tHit = clamp(tHit, 0, 0.7);
      const cx = dist.dx + relVx * tHit;
      const cy = dist.dy + relVy * tHit;
      const miss = hypot(cx, cy);
      if (tHit > 0 && tHit < 0.55 && miss < 28) {
        const k = (0.55 - tHit) / 0.55;
        const mx = miss > 1 ? -cx / miss : -dist.dx;
        const my = miss > 1 ? -cy / miss : -dist.dy;
        fleeX += mx * k * 2.2;
        fleeY += my * k * 2.2;
        panic = Math.max(panic, 0.55 + k * 0.45);
      }
    }
    if (G.sini.live) {
      const dist = wrapDist(ship.x, ship.y, G.sini.x, G.sini.y);
      if (dist.d < 320 && dist.d > 0.001) {
        const k = (320 - dist.d) / 320;
        fleeX -= (dist.dx / dist.d) * k * 2.4;
        fleeY -= (dist.dy / dist.d) * k * 2.4;
        panic = Math.max(panic, dist.d < 170 ? 0.92 : k * 0.85);
      }
    }
    for (let i = 0; i < G.workers.length; i++) {
      const w = G.workers[i];
      if (!w.alive) continue;
      const dist = wrapDist(ship.x, ship.y, w.x, w.y);
      if (dist.d < 56 && dist.d > 0.001) {
        const k = (56 - dist.d) / 56;
        fleeX -= (dist.dx / dist.d) * k * 0.7;
        fleeY -= (dist.dy / dist.d) * k * 0.7;
        panic = Math.max(panic, k * 0.28);
      }
    }
    const fl = hypot(fleeX, fleeY);
    if (fl > 0.001) {
      fleeX /= fl;
      fleeY /= fl;
    }

    let goal = autoPickGoal();
    if (goal) autoGoal = goal;
    let tx = ship.x + Math.sin(ship.ang) * 80;
    let ty = ship.y - Math.cos(ship.ang) * 80;
    let holdR = 0;
    if (goal) {
      tx = goal.x;
      ty = goal.y;
      holdR = goal.hold || 0;
    }
    if (panic > 0.5) {
      tx = wrap(ship.x + fleeX * 260, WW);
      ty = wrap(ship.y + fleeY * 260, WH);
      holdR = 0;
    } else if (fl > 0.001) {
      tx = wrap(tx + fleeX * panic * 140, WW);
      ty = wrap(ty + fleeY * panic * 140, WH);
    }
    autoSteer(tx, ty, holdR, fleeX, fleeY, panic);

    let crystalClose = false;
    for (let i = 0; i < G.crystals.length; i++) {
      const c = G.crystals[i];
      if (!c.alive) continue;
      if (wrapDist(ship.x, ship.y, c.x, c.y).d < 42) {
        crystalClose = true;
        break;
      }
    }
    if (!crystalClose) {
      const range = SHOT_V * SHOT_LIFE * 0.92;
      for (let i = 0; i < G.rocks.length; i++) {
        if (inShotCone(G.rocks[i], G.rocks[i].r, range)) {
          autoFire = true;
          break;
        }
      }
      if (!autoFire) {
        for (let i = 0; i < G.workers.length; i++) {
          const w = G.workers[i];
          if (!w.alive) continue;
          if ((w.carry || wrapDist(ship.x, ship.y, w.x, w.y).d < 160) && inShotCone(w, WORKER_R, range)) {
            autoFire = true;
            break;
          }
        }
      }
      if (!autoFire) {
        for (let i = 0; i < G.warriors.length; i++) {
          if (inShotCone(G.warriors[i], WARRIOR_R, range)) {
            autoFire = true;
            break;
          }
        }
      }
      if (!autoFire && goal && (goal.kind === 'rock' || goal.kind === 'worker' || goal.kind === 'warrior') && goal.ref && goal.ref.alive !== false) {
        const f = facingErrTo(goal.ref.x, goal.ref.y);
        const rad = goal.kind === 'rock' ? goal.ref.r : goal.kind === 'worker' ? WORKER_R : WARRIOR_R;
        if (Math.abs(f.err) < 0.3 && f.d < range && f.d > rad + 8 && shotClearsCrystal(f.d)) autoFire = true;
      }
    }
    if (G.bombs > 0 && (G.sini.live || G.sini.pieces > 0) && G.zoneWait <= 0) {
      autoBomb = true;
    }
    keys.fire = autoFire;
    keys.bomb = autoBomb;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (AUTO_START_WAIT[autoSpeed] || 0.2)) {
        autoOvWait = 0;
        startGame(G.kind === 'frenzy' ? 'frenzy' : 'camp');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (AUTO_RETRY_WAIT[autoSpeed] || 0.7)) {
        autoOvWait = 0;
        startGame(G.kind);
      }
    }
  }

  function steerTo(ent, tx, ty, spd, turn, dt) {
    const w = wrapDist(tx, ty, ent.x, ent.y);
    const desired = Math.atan2(w.dx, -w.dy);
    const err = angNorm(desired - ent.ang);
    ent.ang += clamp(err, -turn * dt, turn * dt);
    ent.vx = Math.sin(ent.ang) * spd;
    ent.vy = -Math.cos(ent.ang) * spd;
    return w;
  }

  function updatePlayer(dt) {
    const ship = G.ship;
    if (G.deadT > 0) return;
    let thrusting = false;
    let reversing = false;
    if (!autoOn && pointer.down && !overlayOpen()) {
      const err = angNorm(pointer.aim - ship.ang);
      ship.ang += clamp(err, -ROT * 1.25 * dt, ROT * 1.25 * dt);
      if (Math.abs(err) < 0.55) thrusting = true;
    } else {
      if (keys.l) ship.ang -= ROT * dt;
      if (keys.r) ship.ang += ROT * dt;
      thrusting = keys.u;
      reversing = keys.d;
    }
    if (thrusting) {
      ship.vx += Math.sin(ship.ang) * THRUST * dt;
      ship.vy -= Math.cos(ship.ang) * THRUST * dt;
      G.thrustT -= dt;
      if (G.thrustT <= 0) {
        G.thrustT = 0.07;
        if (!(autoOn && autoSpeed >= 4)) audio.thrust();
      }
      if (!REDUCE) {
        const bx = ship.x - Math.sin(ship.ang) * 12;
        const by = ship.y + Math.cos(ship.ang) * 12;
        particles.push({
          x: bx + rand(-2, 2),
          y: by + rand(-2, 2),
          vx: -Math.sin(ship.ang) * rand(40, 120) + ship.vx * 0.3,
          vy: Math.cos(ship.ang) * rand(40, 120) + ship.vy * 0.3,
          g: 0,
          life: rand(0.12, 0.28),
          max: 0.28,
          r: rand(1.2, 2.4),
          rgb: Math.random() < 0.4 ? GOLD : CYN
        });
        capArr(particles, 280);
      }
    } else if (reversing) {
      ship.vx -= Math.sin(ship.ang) * REV * dt;
      ship.vy += Math.cos(ship.ang) * REV * dt;
    }
    const spd = hypot(ship.vx, ship.vy);
    if (spd > MAX_V) {
      ship.vx *= MAX_V / spd;
      ship.vy *= MAX_V / spd;
    }
    const drag = Math.exp(-DRAG * dt);
    ship.vx *= drag;
    ship.vy *= drag;
    ship.x = wrap(ship.x + ship.vx * dt, WW);
    ship.y = wrap(ship.y + ship.vy * dt, WH);

    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      const w = wrapDist(ship.x, ship.y, r.x, r.y);
      const minD = SHIP_R + r.r - 1;
      if (w.d < minD && w.d > 0.001) {
        const nx = w.dx / w.d;
        const ny = w.dy / w.d;
        const overlap = minD - w.d;
        ship.x = wrap(ship.x + nx * overlap, WW);
        ship.y = wrap(ship.y + ny * overlap, WH);
        const vn = (ship.vx - r.vx) * nx + (ship.vy - r.vy) * ny;
        if (vn < 0) {
          ship.vx -= vn * nx * 1.35;
          ship.vy -= vn * ny * 1.35;
        }
      }
    }
  }

  function updateCam() {
    const ship = G.ship;
    const tx = wrap(ship.x + ship.vx * 0.12, WW);
    const ty = wrap(ship.y + ship.vy * 0.12, WH);
    const dx = wrapDelta(tx, G.cam.x, WW);
    const dy = wrapDelta(ty, G.cam.y, WH);
    G.cam.x = wrap(G.cam.x + dx * 0.18, WW);
    G.cam.y = wrap(G.cam.y + dy * 0.18, WH);
  }

  function updateRocks(dt) {
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      r.x = wrap(r.x + r.vx * dt, WW);
      r.y = wrap(r.y + r.vy * dt, WH);
      r.ang += r.spin * dt;
    }
    if (G.mode === 'play' && rockCount() < wantedRocks() - 2) {
      const p = farFrom(G.ship.x, G.ship.y, 420);
      G.rocks.push(spawnRock(0, p.x, p.y, null, null));
    }
  }

  function updateCrystals(dt) {
    for (let i = G.crystals.length - 1; i >= 0; i--) {
      const c = G.crystals[i];
      if (!c.alive) {
        G.crystals.splice(i, 1);
        continue;
      }
      c.x = wrap(c.x + c.vx * dt, WW);
      c.y = wrap(c.y + c.vy * dt, WH);
      c.vx *= Math.exp(-dt * 0.35);
      c.vy *= Math.exp(-dt * 0.35);
      c.ang += c.spin * dt;
      c.life -= dt;
      if (c.life <= 0) {
        c.alive = false;
        G.crystals.splice(i, 1);
      }
    }
  }

  function updateWorkers(dt) {
    const spd = workerSpd();
    for (let i = 0; i < G.workers.length; i++) {
      const w = G.workers[i];
      if (!w.alive) continue;
      w.hitFlash = Math.max(0, w.hitFlash - dt);
      let target = null;
      if (w.carry) {
        target = G.sini;
      } else {
        target = nearestCrystal(w.x, w.y);
        if (!target) target = nearestRock(w.x, w.y);
      }
      if (target) {
        const dist = steerTo(w, target.x, target.y, spd, 3.6, dt);
        const isCrystal = target.hp == null && target.life != null;
        const isRock = target.hp != null && target.r != null;
        if (!w.carry && isCrystal && target.alive && dist.d < WORKER_R + CRYSTAL_R + 4) {
          target.alive = false;
          w.carry = true;
          w.mineT = 0;
          audio.steal();
          burst(w.x, w.y, GOLD, 6, 70);
        } else if (!w.carry && isRock && target.alive && dist.d < target.r + WORKER_R + 6) {
          w.mineT += dt;
          const mineNeed = isFrenzy() ? 0.52 : 0.82;
          if (w.mineT >= mineNeed) {
            w.mineT = 0;
            const a = Math.atan2(wrapDelta(w.y, target.y, WH), wrapDelta(w.x, target.x, WW));
            spawnCrystal(
              target.x + Math.cos(a) * (target.r + 8),
              target.y + Math.sin(a) * (target.r + 8),
              Math.cos(a) * 40,
              Math.sin(a) * 40
            );
            popSpark(target.x, target.y, GOLD, 8);
            if (Math.random() < 0.45) hitRock(target, false);
          }
        } else if (!w.carry) {
          w.mineT = 0;
        }
        if (w.carry && target === G.sini && G.zoneWait <= 0 && dist.d < SINI_R * (0.55 + G.sini.pieces / G.sini.max * 0.25) + 10) {
          w.carry = false;
          if (G.mode === 'play' || G.mode === 'title') {
            G.sini.pieces = Math.min(G.sini.max, G.sini.pieces + 1);
            G.sini.hitFlash = 0.12;
            audio.deliver();
            popSpark(G.sini.x, G.sini.y, MAG, 22);
            popRing(G.sini.x, G.sini.y, MAG, 18);
            if (G.mode === 'play' && G.sini.pieces >= G.sini.max) awakenSini();
          }
        }
      } else {
        w.ang += 0.4 * dt;
        w.vx = Math.sin(w.ang) * spd * 0.35;
        w.vy = -Math.cos(w.ang) * spd * 0.35;
      }
      w.x = wrap(w.x + w.vx * dt, WW);
      w.y = wrap(w.y + w.vy * dt, WH);
    }
    if (G.mode === 'play' && workerCount() < wantedWorkers()) {
      G.workerWait -= dt;
      if (G.workerWait <= 0) {
        const p = farFrom(G.ship.x, G.ship.y, 380);
        spawnWorker(p.x, p.y);
        G.workerWait = 0.4;
      }
    }
  }

  function updateWarriors(dt) {
    const spd = warriorSpd();
    const ship = G.ship;
    for (let i = 0; i < G.warriors.length; i++) {
      const w = G.warriors[i];
      if (!w.alive) continue;
      w.hitFlash = Math.max(0, w.hitFlash - dt);
      const dist = steerTo(w, ship.x, ship.y, spd, 3.2, dt);
      w.x = wrap(w.x + w.vx * dt, WW);
      w.y = wrap(w.y + w.vy * dt, WH);
      w.shootT -= dt;
      if (G.mode === 'play' && G.deadT <= 0 && w.shootT <= 0 && dist.d < 520 && dist.d > 50) {
        const lead = dist.d / 210;
        const tx = ship.x + ship.vx * lead;
        const ty = ship.y + ship.vy * lead;
        const aim = wrapDist(tx, ty, w.x, w.y);
        const d = Math.max(1, aim.d);
        G.wShots.push({
          x: w.x,
          y: w.y,
          vx: aim.dx / d * 168 * (isFrenzy() ? 1.18 : 1),
          vy: aim.dy / d * 168 * (isFrenzy() ? 1.18 : 1),
          life: 2.4,
          alive: true
        });
        w.shootT = (isFrenzy() ? 0.95 : 1.42) / (0.85 + diff() * 0.2);
        audio.beep(280, 0.05, 'square', 0.02, 140);
      }
    }
    if (G.mode === 'play' && warriorCount() < wantedWarriors()) {
      G.warriorWait -= dt;
      if (G.warriorWait <= 0) {
        const p = farFrom(G.ship.x, G.ship.y, 420);
        spawnWarrior(p.x, p.y);
        G.warriorWait = 0.5;
      }
    }
  }

  function updateSini(dt) {
    const s = G.sini;
    s.hitFlash = Math.max(0, s.hitFlash - dt);
    if (!s.live) {
      s.vx *= Math.exp(-dt * 1.2);
      s.vy *= Math.exp(-dt * 1.2);
      s.x = wrap(s.x + s.vx * dt, WW);
      s.y = wrap(s.y + s.vy * dt, WH);
      return;
    }
    const ship = G.ship;
    const w = wrapDist(ship.x, ship.y, s.x, s.y);
    const d = Math.max(1, w.d);
    const spd = siniSpd();
    s.vx = w.dx / d * spd;
    s.vy = w.dy / d * spd;
    s.x = wrap(s.x + s.vx * dt, WW);
    s.y = wrap(s.y + s.vy * dt, WH);
    s.roarT -= dt;
    if (s.roarT <= 0) {
      s.roarT = rand(3.6, 5.4);
      audio.roar();
      toast(ROARS[(Math.random() * ROARS.length) | 0], true, false);
      popRing(s.x, s.y, MAG, 36);
      kick(5.5);
      screenFlash(MAG, 0.28);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (!s.alive) {
        G.shots.splice(i, 1);
        continue;
      }
      s.x = wrap(s.x + s.vx * dt, WW);
      s.y = wrap(s.y + s.vy * dt, WH);
      s.life -= dt;
      if (s.life <= 0) {
        s.alive = false;
        G.shots.splice(i, 1);
      }
    }
  }

  function updateBombs(dt) {
    const s = G.sini;
    for (let i = G.sBombs.length - 1; i >= 0; i--) {
      const b = G.sBombs[i];
      if (!b.alive) {
        G.sBombs.splice(i, 1);
        continue;
      }
      const w = wrapDist(s.x, s.y, b.x, b.y);
      const desired = Math.atan2(w.dx, -w.dy);
      const err = angNorm(desired - b.ang);
      b.ang += clamp(err, -BOMB_TURN * dt, BOMB_TURN * dt);
      b.x = wrap(b.x + Math.sin(b.ang) * BOMB_V * dt, WW);
      b.y = wrap(b.y - Math.cos(b.ang) * BOMB_V * dt, WH);
      b.life -= dt;
      if (b.life <= 0) {
        b.alive = false;
        G.sBombs.splice(i, 1);
      }
    }
  }

  function updateWShots(dt) {
    for (let i = G.wShots.length - 1; i >= 0; i--) {
      const s = G.wShots[i];
      if (!s.alive) {
        G.wShots.splice(i, 1);
        continue;
      }
      s.x = wrap(s.x + s.vx * dt, WW);
      s.y = wrap(s.y + s.vy * dt, WH);
      s.life -= dt;
      if (s.life <= 0) {
        s.alive = false;
        G.wShots.splice(i, 1);
      }
    }
  }

  function collideShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.alive) continue;
      for (let j = 0; j < G.rocks.length; j++) {
        const r = G.rocks[j];
        if (!r.alive) continue;
        if (wrapDist(s.x, s.y, r.x, r.y).d < r.r + 3) {
          s.alive = false;
          hitRock(r);
          break;
        }
      }
      if (!s.alive) continue;
      for (let j = 0; j < G.workers.length; j++) {
        const w = G.workers[j];
        if (!w.alive) continue;
        if (wrapDist(s.x, s.y, w.x, w.y).d < WORKER_R + 4) {
          s.alive = false;
          killWorker(w);
          break;
        }
      }
      if (!s.alive) continue;
      for (let j = 0; j < G.warriors.length; j++) {
        const w = G.warriors[j];
        if (!w.alive) continue;
        if (wrapDist(s.x, s.y, w.x, w.y).d < WARRIOR_R + 4) {
          s.alive = false;
          killWarrior(w);
          break;
        }
      }
      if (!s.alive) continue;
      for (let j = 0; j < G.crystals.length; j++) {
        const c = G.crystals[j];
        if (!c.alive) continue;
        if (wrapDist(s.x, s.y, c.x, c.y).d < CRYSTAL_R + 3) {
          s.alive = false;
          c.alive = false;
          burst(c.x, c.y, GOLD, 5, 70);
          break;
        }
      }
      if (!s.alive) continue;
      const siniHit = wrapDist(s.x, s.y, G.sini.x, G.sini.y).d;
      const siniR = SINI_R * (0.45 + G.sini.pieces / G.sini.max * 0.55);
      if (G.sini.pieces > 0 && siniHit < siniR) {
        s.alive = false;
        popSpark(s.x, s.y, MAG, 10);
        G.sini.hitFlash = 0.08;
      }
    }
    for (let i = G.shots.length - 1; i >= 0; i--) {
      if (!G.shots[i].alive) G.shots.splice(i, 1);
    }
  }

  function collideBombs() {
    const s = G.sini;
    const r = SINI_R * (0.5 + s.pieces / s.max * 0.55) + (s.live ? 8 : 0);
    for (let i = G.sBombs.length - 1; i >= 0; i--) {
      const b = G.sBombs[i];
      if (!b.alive) continue;
      if (s.pieces <= 0 && !s.live) continue;
      if (wrapDist(b.x, b.y, s.x, s.y).d < r + BOMB_R) {
        b.alive = false;
        G.sBombs.splice(i, 1);
        s.pieces = Math.max(0, s.pieces - 1);
        s.hitFlash = 0.18;
        const n = 800 * G.mult;
        if (G.mode === 'play') {
          addScore(n);
          bumpCombo();
          popFloat(b.x, b.y, '+' + n, MAG, true);
        }
        audio.bombHit();
        burst(b.x, b.y, MAG, 22, 220);
        burst(b.x, b.y, GOLD, 8, 140);
        popRing(s.x, s.y, MAG, 30);
        screenFlash(MAG, 0.4);
        kick(5.2);
        hitStop(0.064);
        if (s.live && s.pieces <= 0) {
          siniKilled();
        } else if (!s.live && s.pieces <= 0) {
          toast('拼装中断', false, true);
        }
      }
    }
  }

  function collectAndHit() {
    const ship = G.ship;
    if (G.deadT > 0) return;
    for (let i = 0; i < G.crystals.length; i++) {
      const c = G.crystals[i];
      if (!c.alive) continue;
      if (wrapDist(ship.x, ship.y, c.x, c.y).d < SHIP_R + CRYSTAL_R + 6) pickupCrystal(c);
    }
    if (G.invuln > 0) return;
    for (let i = 0; i < G.warriors.length; i++) {
      const w = G.warriors[i];
      if (!w.alive) continue;
      if (wrapDist(ship.x, ship.y, w.x, w.y).d < SHIP_R + WARRIOR_R - 1) {
        killPlayer('warrior');
        return;
      }
    }
    for (let i = 0; i < G.wShots.length; i++) {
      const s = G.wShots[i];
      if (!s.alive) continue;
      if (wrapDist(ship.x, ship.y, s.x, s.y).d < SHIP_R + 4) {
        s.alive = false;
        killPlayer('shot');
        return;
      }
    }
    if (G.sini.live) {
      const eatR = SINI_R * 0.72;
      if (wrapDist(ship.x, ship.y, G.sini.x, G.sini.y).d < eatR) {
        killPlayer('eat');
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.1);
      q.vy *= Math.exp(-dt * 1.1);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.bombCd = Math.max(0, G.bombCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    G.ready = Math.max(0, G.ready - dt);
    if (autoOn) autoThink();
    updatePlayer(dt);
    updateCam();
    updateRocks(dt);
    updateCrystals(dt);
    updateWorkers(dt);
    updateWarriors(dt);
    updateSini(dt);
    updateShots(dt);
    updateBombs(dt);
    updateWShots(dt);
    if ((keys.fire || (!autoOn && pointer.down)) && G.mode === 'play' && !overlayOpen() && G.deadT <= 0) fire();
    if (keys.bomb && G.mode === 'play' && !overlayOpen()) fireBomb();
    if (G.mode === 'play' && G.deadT <= 0) {
      collideShots();
      collideBombs();
      collectAndHit();
    } else if (G.mode === 'title') {
      collideShots();
    }

    if (G.mode === 'play' && G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why === 'eat' ? '被吞了' : '舰毁了');
          return;
        }
        const p = farFrom(G.sini.x, G.sini.y, 380);
        G.ship.x = p.x;
        G.ship.y = p.y;
        G.ship.vx = 0;
        G.ship.vy = 0;
        G.invuln = 1.8;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
    }

    if (G.mode === 'play' && G.zoneWait > 0 && G.deadT <= 0) {
      G.zoneWait -= dt;
      if (G.zoneWait <= 0) nextZone();
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    tickAutoFlow(dt);

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      if (autoOn || !(keys.l || keys.r || pointer.down)) G.ship.ang += 0.32 * dt;
      else updatePlayer(dt);
      updateCam();
      updateRocks(dt);
      updateCrystals(dt);
      updateWorkers(dt);
      updateSini(dt);
      G.demoT -= dt;
      if (G.demoT <= 0) {
        G.demoT = 2.8;
        if (rockCount() < 5) {
          const p = farFrom(G.ship.x, G.ship.y, 180);
          G.rocks.push(spawnRock((Math.random() * 3) | 0, p.x, p.y, null, null));
        }
        if (G.sini.pieces >= G.sini.max) G.sini.pieces = 2;
      }
      updateFx(dt);
      syncHud();
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateRocks(dt);
      updateCrystals(dt);
      updateWorkers(dt);
      updateSini(dt * 0.45);
      updateFx(dt);
      return;
    }

    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function drawLetterbox() {
    ctx.fillStyle = '#0a0308';
    if (ox > 0.5) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W - ox - VW * scale + 2, H);
    }
    if (oy > 0.5) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H - oy - VH * scale + 2);
    }
  }

  function drawBg() {
    const g = ctx.createRadialGradient(sx(VW * 0.5), sy(VH * 0.42), 20 * scale, sx(VW * 0.5), sy(VH * 0.5), 420 * scale);
    g.addColorStop(0, G.sini.live ? '#2a0814' : '#1a0810');
    g.addColorStop(0.45, '#10040a');
    g.addColorStop(1, '#0a0308');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(VW * 0.5), sy(VH * 0.5), 10 * scale, sx(VW * 0.5), sy(VH * 0.5), 360 * scale);
    vg.addColorStop(0, rgba(MAG, G.sini.live ? 0.16 : 0.07));
    vg.addColorStop(0.55, rgba(MAG, 0.03));
    vg.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const vx = VW * 0.5 + wrapDelta(s.x, G.cam.x, WW) * s.layer;
      const vy = VH * 0.5 + wrapDelta(s.y, G.cam.y, WH) * s.layer;
      if (vx < -4 || vx > VW + 4 || vy < -4 || vy > VH + 4) continue;
      const a = s.a * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(vx), sy(vy), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPoly(vx, vy, ang, pts, rgb, glow) {
    ctx.save();
    ctx.translate(sx(vx), sy(vy));
    ctx.rotate(ang);
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0] * scale;
      const py = pts[i][1] * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(rgb, glow ? 0.22 : 1);
    ctx.lineWidth = (glow ? 4.2 : 1.5) * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    if (!glow) {
      ctx.fillStyle = rgba(rgb, 0.08);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRocks() {
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (!r.alive) continue;
      if (!onScreen(r.x, r.y, r.r + 8)) continue;
      const vx = viewX(r.x);
      const vy = viewY(r.y);
      drawPoly(vx, vy, r.ang, r.pts, r.rgb, true);
      drawPoly(vx, vy, r.ang, r.pts, r.rgb, false);
    }
  }

  function drawCrystals() {
    for (let i = 0; i < G.crystals.length; i++) {
      const c = G.crystals[i];
      if (!c.alive) continue;
      if (!onScreen(c.x, c.y, 16)) continue;
      const vx = viewX(c.x);
      const vy = viewY(c.y);
      const blink = 0.65 + 0.35 * Math.sin(G.t * 10 + c.ang);
      ctx.save();
      ctx.translate(sx(vx), sy(vy));
      ctx.rotate(c.ang);
      ctx.fillStyle = rgba(GOLD, 0.18 * blink);
      ctx.beginPath();
      ctx.arc(0, 0, 10 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.fillStyle = rgba(GOLD, 0.35);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -7 * scale);
      ctx.lineTo(5 * scale, 0);
      ctx.lineTo(0, 7 * scale);
      ctx.lineTo(-5 * scale, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(-1.2 * scale, -1.4 * scale, 1.3 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawWorker(w) {
    if (!onScreen(w.x, w.y, 20)) return;
    const vx = viewX(w.x);
    const vy = viewY(w.y);
    const rgb = w.hitFlash > 0 ? WHT : YLW;
    ctx.save();
    ctx.translate(sx(vx), sy(vy));
    ctx.rotate(w.ang);
    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.fillStyle = rgba(rgb, 0.12);
    ctx.lineWidth = 1.5 * scale;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -9 * scale);
    ctx.lineTo(7 * scale, 7 * scale);
    ctx.lineTo(0, 3 * scale);
    ctx.lineTo(-7 * scale, 7 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (w.carry) {
      ctx.rotate(-w.ang);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(0, -14 * scale);
      ctx.lineTo(3.2 * scale, -10 * scale);
      ctx.lineTo(0, -6 * scale);
      ctx.lineTo(-3.2 * scale, -10 * scale);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWarrior(w) {
    if (!onScreen(w.x, w.y, 22)) return;
    const vx = viewX(w.x);
    const vy = viewY(w.y);
    const rgb = w.hitFlash > 0 ? WHT : RED;
    ctx.save();
    ctx.translate(sx(vx), sy(vy));
    ctx.rotate(w.ang);
    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.fillStyle = rgba(rgb, 0.14);
    ctx.lineWidth = 1.6 * scale;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -12 * scale);
    ctx.lineTo(10 * scale, 4 * scale);
    ctx.lineTo(4 * scale, 2 * scale);
    ctx.lineTo(6 * scale, 11 * scale);
    ctx.lineTo(0, 6 * scale);
    ctx.lineTo(-6 * scale, 11 * scale);
    ctx.lineTo(-4 * scale, 2 * scale);
    ctx.lineTo(-10 * scale, 4 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawSkull(vx, vy) {
    const s0 = G.sini;
    const k = s0.max <= 0 ? 0 : s0.pieces / s0.max;
    if (k <= 0 && !s0.live) return;
    const live = s0.live;
    const pulse = live ? 1 + 0.07 * Math.sin(G.t * 7.4) : 1;
    const s = (20 + k * 28) * pulse;
    const rgb = s0.hitFlash > 0 ? WHT : (live ? MAG : ROSE);
    ctx.save();
    ctx.translate(sx(vx), sy(vy));
    const grd = ctx.createRadialGradient(0, 0, 4 * scale, 0, 0, s * 1.7 * scale);
    grd.addColorStop(0, rgba(rgb, live ? 0.5 : 0.14 * k));
    grd.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.7 * scale, 0, TAU);
    ctx.fill();

    ctx.scale(scale, scale);
    ctx.globalAlpha = live ? 1 : 0.28 + k * 0.72;
    ctx.strokeStyle = rgba(live ? WHT : rgb, 0.95);
    ctx.fillStyle = rgba(rgb, live ? 0.2 : 0.1);
    ctx.lineWidth = live ? 1.85 : 1.35;
    ctx.lineJoin = 'round';

    const n = 12;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = -Math.PI / 2 + (i / n) * TAU;
      const spike = (i % 2 === 0) ? s * 1.16 : s * 0.8;
      const vis = live || i <= Math.round(k * n) + 1;
      const rr = vis ? spike : spike * 0.42;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr * 0.92;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, -s * 0.06, s * 0.6, s * 0.56, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    if (k > 0.2 || live) {
      const eye = live ? GOLD : rgb;
      const er = s * (live ? 0.15 : 0.11);
      ctx.fillStyle = rgba(eye, 0.95);
      ctx.beginPath();
      ctx.ellipse(-s * 0.22, -s * 0.08, er, er * 0.82, 0, 0, TAU);
      ctx.ellipse(s * 0.22, -s * 0.08, er, er * 0.82, 0, 0, TAU);
      ctx.fill();
      if (live) {
        ctx.fillStyle = rgba(WHT, 0.95);
        ctx.beginPath();
        ctx.arc(-s * 0.18, -s * 0.12, er * 0.32, 0, TAU);
        ctx.arc(s * 0.26, -s * 0.12, er * 0.32, 0, TAU);
        ctx.fill();
      }
    }
    if (k > 0.38 || live) {
      ctx.strokeStyle = rgba(WHT, 0.55 + k * 0.35);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-s * 0.09, s * 0.16);
      ctx.lineTo(s * 0.09, s * 0.16);
      ctx.closePath();
      ctx.stroke();
    }
    if (k > 0.55 || live) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, s * 0.18);
      ctx.quadraticCurveTo(0, s * 0.68, s * 0.4, s * 0.18);
      ctx.stroke();
      if (k > 0.72 || live) {
        for (let t = 0; t < 5; t++) {
          const tx = -s * 0.22 + t * s * 0.11;
          ctx.beginPath();
          ctx.moveTo(tx, s * 0.3);
          ctx.lineTo(tx, s * 0.44);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const ship = G.ship;
    const vx = viewX(ship.x);
    const vy = viewY(ship.y);
    const ghost = G.invuln > 0 && ((G.t * 12) | 0) % 2 === 0;
    ctx.save();
    ctx.translate(sx(vx), sy(vy));
    ctx.rotate(ship.ang);
    if (keys.u || (!autoOn && pointer.down && !overlayOpen())) {
      ctx.fillStyle = rgba(GOLD, 0.55 + 0.35 * Math.sin(G.t * 28));
      ctx.beginPath();
      ctx.moveTo(-4 * scale, 8 * scale);
      ctx.lineTo(0, (16 + Math.sin(G.t * 40) * 4) * scale);
      ctx.lineTo(4 * scale, 8 * scale);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(0, -13 * scale);
    ctx.lineTo(9 * scale, 11 * scale);
    ctx.lineTo(0, 6.5 * scale);
    ctx.lineTo(-9 * scale, 11 * scale);
    ctx.closePath();
    ctx.strokeStyle = rgba(CYN, ghost ? 0.35 : 1);
    ctx.lineWidth = 1.8 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = rgba(CYN, ghost ? 0.05 : 0.12);
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(0, -16 * scale, 4 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.alive) continue;
      const vx = viewX(s.x);
      const vy = viewY(s.y);
      ctx.save();
      ctx.strokeStyle = rgba(CYN, 0.95);
      ctx.lineWidth = 2 * scale;
      ctx.lineCap = 'round';
      const ang = Math.atan2(s.vy, s.vx);
      ctx.beginPath();
      ctx.moveTo(sx(vx - Math.cos(ang) * 7), sy(vy - Math.sin(ang) * 7));
      ctx.lineTo(sx(vx + Math.cos(ang) * 4), sy(vy + Math.sin(ang) * 4));
      ctx.stroke();
      if (!REDUCE) {
        ctx.strokeStyle = rgba(WHT, 0.35);
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(vx - Math.cos(ang) * 14), sy(vy - Math.sin(ang) * 14));
        ctx.lineTo(sx(vx), sy(vy));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawBombs() {
    for (let i = 0; i < G.sBombs.length; i++) {
      const b = G.sBombs[i];
      if (!b.alive) continue;
      const vx = viewX(b.x);
      const vy = viewY(b.y);
      ctx.save();
      ctx.translate(sx(vx), sy(vy));
      ctx.rotate(b.ang);
      ctx.fillStyle = rgba(GOLD, 0.25);
      ctx.beginPath();
      ctx.arc(0, 0, 9 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.fillStyle = rgba(MAG, 0.55);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -8 * scale);
      ctx.lineTo(5 * scale, 6 * scale);
      ctx.lineTo(0, 3 * scale);
      ctx.lineTo(-5 * scale, 6 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawWShots() {
    for (let i = 0; i < G.wShots.length; i++) {
      const s = G.wShots[i];
      if (!s.alive) continue;
      const vx = viewX(s.x);
      const vy = viewY(s.y);
      ctx.fillStyle = rgba(RED, 0.95);
      ctx.beginPath();
      ctx.arc(sx(vx), sy(vy), 2.6 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.35);
      ctx.beginPath();
      ctx.arc(sx(vx), sy(vy), 5 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      if (!onScreen(q.x, q.y, 8)) continue;
      const a = q.life / q.max;
      ctx.fillStyle = rgba(q.rgb, clamp(a, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(viewX(q.x)), sy(viewY(q.y)), q.r * scale * (0.6 + a), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.36;
      const vx = viewX(s.x);
      const vy = viewY(s.y);
      ctx.strokeStyle = rgba(s.rgb, 1 - t);
      ctx.lineWidth = (2.2 - t) * scale;
      ctx.beginPath();
      ctx.arc(sx(vx), sy(vy), s.rad * t * 1.8 * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const t = s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, 1 - t);
      ctx.lineWidth = (2.4 - t * 1.6) * scale;
      ctx.beginPath();
      ctx.arc(sx(viewX(s.x)), sy(viewY(s.y)), (s.r + t * 46) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, a);
      ctx.fillText(f.text, sx(viewX(f.x)), sy(viewY(f.y)));
    }
  }

  function drawRadar() {
    const R = 76;
    const cx = sx(VW - 18 - R);
    const cy = sy(18 + R);
    const range = Math.max(WW, WH) * 0.5;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * scale, 0, TAU);
    ctx.fillStyle = 'rgba(8, 2, 6, 0.72)';
    ctx.fill();
    ctx.strokeStyle = rgba(MAG, G.sini.live ? 0.8 : 0.45);
    ctx.lineWidth = 1.3 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.5 * scale, 0, TAU);
    ctx.strokeStyle = rgba(MAG, 0.18);
    ctx.lineWidth = 1 * scale;
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.12);
    ctx.beginPath();
    ctx.moveTo(cx - R * scale, cy);
    ctx.lineTo(cx + R * scale, cy);
    ctx.moveTo(cx, cy - R * scale);
    ctx.lineTo(cx, cy + R * scale);
    ctx.stroke();

    function blip(x, y, rgb, r, a) {
      const dx = wrapDelta(x, G.ship.x, WW);
      const dy = wrapDelta(y, G.ship.y, WH);
      const px = cx + dx / range * R * scale;
      const py = cy + dy / range * R * scale;
      if (hypot(dx, dy) > range) return;
      ctx.fillStyle = rgba(rgb, a);
      ctx.beginPath();
      ctx.arc(px, py, r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < G.rocks.length; i++) {
      if (G.rocks[i].alive) blip(G.rocks[i].x, G.rocks[i].y, ROCKC, 1.1, 0.35);
    }
    for (let i = 0; i < G.crystals.length; i++) {
      if (G.crystals[i].alive) blip(G.crystals[i].x, G.crystals[i].y, GOLD, 1.6, 0.9);
    }
    for (let i = 0; i < G.workers.length; i++) {
      if (G.workers[i].alive) blip(G.workers[i].x, G.workers[i].y, YLW, 1.8, 0.9);
    }
    for (let i = 0; i < G.warriors.length; i++) {
      if (G.warriors[i].alive) blip(G.warriors[i].x, G.warriors[i].y, RED, 2.1, 0.95);
    }
    if (G.sini.pieces > 0 || G.sini.live) {
      blip(G.sini.x, G.sini.y, MAG, G.sini.live ? 3.4 : 2.6, 1);
    }
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.arc(cx, cy, 2.3 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawAssembleBar() {
    if (G.mode === 'title') return;
    const w = 160;
    const h = 6;
    const x = VW * 0.5 - w * 0.5;
    const y = 14;
    const k = G.sini.max <= 0 ? 0 : G.sini.pieces / G.sini.max;
    ctx.save();
    ctx.fillStyle = 'rgba(8,2,6,0.55)';
    ctx.strokeStyle = rgba(MAG, G.sini.live ? 0.8 : 0.35);
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(sx(x), sy(y), w * scale, h * scale, 4 * scale);
    else ctx.rect(sx(x), sy(y), w * scale, h * scale);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgba(G.sini.live ? MAG : ROSE, 0.9);
    const fw = Math.max(0, (w - 2) * k);
    ctx.fillRect(sx(x + 1), sy(y + 1), fw * scale, (h - 2) * scale);
    ctx.restore();
  }

  function draw() {
    ctx.fillStyle = '#0a0308';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake);
      shy = rand(-G.shake, G.shake);
    }
    ctx.translate(W * 0.5 + shx, H * 0.5 + shy);
    const punch = REDUCE ? 1 : G.punch;
    ctx.scale(punch, punch);
    ctx.translate(-W * 0.5, -H * 0.5);
    drawBg();
    drawRocks();
    drawCrystals();
    for (let i = 0; i < G.workers.length; i++) if (G.workers[i].alive) drawWorker(G.workers[i]);
    for (let i = 0; i < G.warriors.length; i++) if (G.warriors[i].alive) drawWarrior(G.warriors[i]);
    if (onScreen(G.sini.x, G.sini.y, 90)) drawSkull(viewX(G.sini.x), viewY(G.sini.y));
    drawWShots();
    drawShots();
    drawBombs();
    drawShip();
    drawFx();
    drawAssembleBar();
    drawRadar();
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
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pointerAimFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    const mx = (x - ox) / scale;
    const my = (y - oy) / scale;
    const shipVx = viewX(G.ship.x);
    const shipVy = viewY(G.ship.y);
    return Math.atan2(mx - shipVx, -(my - shipVy));
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('camp');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      e.preventDefault();
      if (down && !e.repeat) toggleAuto();
      return;
    }
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const left = k === 'ArrowLeft' || k === 'Left';
    const right = k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D' || code === 'KeyD';
    const up = k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W' || code === 'KeyW';
    const dn = k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S' || code === 'KeyS';
    const bomb = k === 'c' || k === 'C' || k === 'x' || k === 'X' || code === 'KeyC' || code === 'KeyX';

    if (left) {
      if (down) e.preventDefault();
      if (autoOn) {
        if (!down) keys.l = false;
        return;
      }
      keys.l = down;
      return;
    }
    if (right) {
      if (down) e.preventDefault();
      if (autoOn) {
        if (!down) keys.r = false;
        return;
      }
      keys.r = down;
      return;
    }
    if (up) {
      if (down) e.preventDefault();
      if (autoOn) {
        if (!down) keys.u = false;
        return;
      }
      keys.u = down;
      return;
    }
    if (dn) {
      if (down) e.preventDefault();
      if (autoOn) {
        if (!down) keys.d = false;
        return;
      }
      keys.d = down;
      return;
    }
    if (space) {
      keys.fire = down && !autoOn;
      if (down) e.preventDefault();
    }
    if (bomb) keys.bomb = down && !autoOn;

    if (!down) {
      if (space) keys.fire = false;
      return;
    }

    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      e.preventDefault();
      return;
    }
    if ((k === '1' || code === 'Digit1') && G.mode === 'title') {
      startGame('camp');
      return;
    }
    if ((k === '2' || code === 'Digit2') && G.mode === 'title') {
      startGame('frenzy');
      return;
    }
    if (autoOn) {
      if ((space || k === 'Enter') && overlayOpen()) primaryAction();
      return;
    }
    if (bomb) {
      fireBomb();
      e.preventDefault();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') fire();
    }
  }

  function holdPad(el, press, release) {
    if (!el) return;
    let held = false;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (autoOn) return;
      if (padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      held = true;
      el.classList.add('on');
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      press();
    });
    function up() {
      if (!held) return;
      held = false;
      el.classList.remove('on');
      if (release) release();
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  function bindPads() {
    holdPad(padCcw, function () { keys.l = true; }, function () { keys.l = false; });
    holdPad(padCw, function () { keys.r = true; }, function () { keys.r = false; });
    holdPad(padThrust, function () { keys.u = true; }, function () { keys.u = false; });
    holdPad(padFire, function () { keys.fire = true; fire(); }, function () { keys.fire = false; });
    holdPad(padBomb, function () { keys.bomb = true; fireBomb(); }, function () { keys.bomb = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (autoOn) return;
      if (e.pointerType === 'touch') {
        if (padsEl) {
          padsEl.classList.add('show');
          padsEl.setAttribute('aria-hidden', 'false');
        }
        return;
      }
      e.preventDefault();
      if (e.button === 2) {
        fireBomb();
        return;
      }
      pointer.down = true;
      pointer.id = e.pointerId;
      pointer.aim = pointerAimFromEvent(e);
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down) return;
      pointer.aim = pointerAimFromEvent(e);
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
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
    if (autoOn && autoSpeed >= 3 && G.mode === 'play') G.stop = 0;
    const scaleN = autoScale();
    acc += dt * scaleN;
    let n = 0;
    const maxSteps = scaleN >= 8 ? 48 : scaleN >= 4 ? 24 : 12;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc >= STEP) acc = 0;
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
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPads();
  bindPointer();

  if (btnCamp) {
    btnCamp.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('camp');
    });
  }
  if (btnFrenzy) {
    btnFrenzy.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && !isFrenzy()) startGame('frenzy');
      else if (G.mode === 'win') goTitle();
      else startGame('frenzy');
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
      setAutoSpeed(parseInt(speedEl.value, 10));
    });
    speedEl.addEventListener('change', function () {
      setAutoSpeed(parseInt(speedEl.value, 10));
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
      keys.fire = false;
      keys.bomb = false;
      pointer.down = false;
      if (!autoOn) {
        autoFire = false;
        autoBomb = false;
      }
    }
  });

  requestAnimationFrame(frame);
})();
