'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.38;
  const BOMB_CAP = 6;
  const WPN_MAX = 3;
  const BEST_KEY = 'playbox-twin-cobra-best';
  const MUTE_KEY = 'playbox-twin-cobra-mute';
  const OPS = '方向 / WASD 移动 · 空格开火 · Shift / Z 丢弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const MINT = [18, 232, 138];
  const TEAL = [0, 200, 120];
  const GOLD = [255, 227, 107];
  const WHT = [232, 255, 244];
  const RED = [255, 90, 106];
  const BLU = [74, 212, 255];
  const ORG = [255, 160, 72];
  const PNK = [255, 154, 212];
  const LEAF = [125, 255, 74];
  const SAND = [196, 150, 72];

  const WPN_NAME = { red: '赤', blue: '青', green: '绿' };
  const WPN_RGB = { red: RED, blue: BLU, green: MINT };
  const DROP_CYCLE = ['red', 'blue', 'green', 'bomb'];
  const DROP_GLYPH = { red: '赤', blue: '青', green: '绿', bomb: '弹' };

  const STAGES = [
    {
      name: '第 1 关 · 河谷',
      mid: '炮艇',
      boss: '河霸',
      midHp: 34,
      bossHp: 82,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.2, kind: 'turrets' },
        { t: 5.8, kind: 'stream', dir: 1 },
        { t: 8.4, kind: 'tank' },
        { t: 11.0, kind: 'carrier' },
        { t: 13.4, kind: 'dive', n: 4 },
        { t: 16.0, kind: 'gun' },
        { t: 18.6, kind: 'turrets' },
        { t: 21.2, kind: 'mid' },
        { t: 26.8, kind: 'v', n: 7 },
        { t: 29.2, kind: 'tank' },
        { t: 31.6, kind: 'bunker' },
        { t: 34.2, kind: 'stream', dir: -1 },
        { t: 36.8, kind: 'carrier' },
        { t: 39.4, kind: 'turrets' },
        { t: 41.8, kind: 'tank' },
        { t: 47.2, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 沙垒',
      mid: '碉堡',
      boss: '铁甲',
      midHp: 46,
      bossHp: 112,
      waves: [
        { t: 0.6, kind: 'v', n: 7 },
        { t: 2.8, kind: 'tank' },
        { t: 5.2, kind: 'dive', n: 5 },
        { t: 7.6, kind: 'bunker' },
        { t: 10.0, kind: 'turrets' },
        { t: 12.4, kind: 'gun' },
        { t: 14.8, kind: 'carrier' },
        { t: 17.2, kind: 'v', n: 9 },
        { t: 19.6, kind: 'mid' },
        { t: 25.2, kind: 'stream', dir: 1 },
        { t: 27.6, kind: 'tank' },
        { t: 29.8, kind: 'tank' },
        { t: 32.2, kind: 'bunker' },
        { t: 34.6, kind: 'dive', n: 6 },
        { t: 37.0, kind: 'gun' },
        { t: 39.4, kind: 'carrier' },
        { t: 41.8, kind: 'turrets' },
        { t: 49.4, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 蛇巢',
      mid: '双炮',
      boss: '双头蛇',
      midHp: 58,
      bossHp: 154,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.4, kind: 'stream', dir: 1 },
        { t: 4.2, kind: 'stream', dir: -1 },
        { t: 6.4, kind: 'dive', n: 6 },
        { t: 8.6, kind: 'bunker' },
        { t: 10.8, kind: 'turrets' },
        { t: 13.0, kind: 'carrier' },
        { t: 15.2, kind: 'gun' },
        { t: 17.4, kind: 'tank' },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'dive', n: 7 },
        { t: 27.0, kind: 'gun' },
        { t: 29.0, kind: 'bunker' },
        { t: 31.2, kind: 'v', n: 11 },
        { t: 33.6, kind: 'carrier' },
        { t: 35.8, kind: 'stream', dir: 1 },
        { t: 37.6, kind: 'stream', dir: -1 },
        { t: 40.0, kind: 'tank' },
        { t: 42.2, kind: 'turrets' },
        { t: 52.0, kind: 'boss' }
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
  const btnSweep = document.getElementById('btn-sweep');
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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const trees = [];
  const fires = [];

  const G = {
    mode: 'title',
    kind: 'sweep',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: VW * 0.5, y: VH - 90, vx: 0, vy: 0 },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    wpn: 'red',
    wpnLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    bombLetCd: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MINT,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    why: '',
    rotorT: 0
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
  function plySpd() {
    return (isDense() ? 312 : 270) + G.wpnLv * 10;
  }
  function scrollSpd() {
    if (hasBig()) return isDense() ? 34 : 26;
    const base = isDense() ? 112 : 82;
    const rush = G.combo >= 8 ? 14 : G.combo >= 4 ? 7 : 0;
    return base + rush + (G.stage - 1) * (isDense() ? 10 : 7);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isDense() ? 160 : 104;
  }
  function hpMul() {
    return isDense() ? 1.24 : 1;
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
    shoot(kind) {
      this.ensure();
      if (kind === 'blue') this.beep(920, 0.065, 'sawtooth', 0.032, 380);
      else if (kind === 'green') this.beep(420, 0.08, 'triangle', 0.034, 880);
      else this.beep(640, 0.048, 'square', 0.03, 1480);
    },
    bomblet() {
      this.ensure();
      this.beep(210, 0.05, 'square', 0.022, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1100);
      this.beep(520 * lift, 0.066, 'square', 0.042, 900 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.18 : 0.09, big ? 0.074 : 0.046, big ? 220 : 460);
      this.beep(big ? 160 : 250, big ? 0.24 : 0.13, 'sawtooth', 0.05, 52);
    },
    bomb() {
      this.ensure();
      this.noise(0.26, 0.082, 160);
      this.beep(86, 0.4, 'sawtooth', 0.07, 38);
      this.beep(620, 0.18, 'sine', 0.038, 180);
    },
    rotor() {
      if (!this.ctx || this.muted) return;
      this.beep(72, 0.04, 'sine', 0.012, 58);
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
    miss() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.025, 80);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.055, 350);
      this.beep(280, 0.18, 'sawtooth', 0.05, 76);
      this.beep(150, 0.3, 'sine', 0.045, 44);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(110, 0.2, 'sawtooth', 0.05, 70);
      this.beep(196, 0.16, 'square', 0.04, 90);
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
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
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
    G.toastT = 1.35;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1350);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function wpnText() {
    const n = WPN_NAME[G.wpn] || '赤';
    if (G.wpnLv >= WPN_MAX) return n + ' MAX';
    if (G.wpnLv <= 0) return n;
    return n + ' ' + ['', 'Ⅱ', 'Ⅲ', 'Ⅳ'][G.wpnLv];
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
      const st = STAGES[G.stage - 1];
      stageLabel.textContent = st ? st.name : '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.stage >= 3 || hasBig());
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密弹' : '扫射';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('blue', G.wpn === 'blue');
      wpnLabel.classList.toggle('green', G.wpn === 'green');
    }
    if (bombLabel) {
      bombLabel.textContent = '弹 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    const noBomb = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
    if (btnBomb) btnBomb.disabled = noBomb;
    if (btnPad) btnPad.disabled = noBomb;
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或撞机扣一命', 'warn');
    else if (G.mode === 'win') setHint('双蛇尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 丢弹清地面', 'warn');
    else setHint('空格打空中 · Shift 丢弹打坦克炮台 · 捡 赤/青/绿', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'COBRA';
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

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 56; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.3, 1.2),
        a: rand(0.12, 0.5)
      });
    }
  }

  function seedTrees() {
    trees.length = 0;
    for (let i = 0; i < 16; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      trees.push({
        x: side < 0 ? rand(10, 78) : rand(VW - 78, VW - 10),
        y: rand(-40, VH),
        s: rand(0.7, 1.3),
        kind: hash2(i * 17 + 3)
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
    if (G.ents.length > 54) return null;
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

  function spawnScout(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'scout',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 92,
      hp: 1, r: 10, score: 50,
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
    spawnScout(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnScout(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnScout(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = 6 + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnScout(side + rand(-8, 8), -20 - i * 24, {
        vx: dir * -78,
        vy: 118,
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
        vx: 0, vy: 60,
        hp: 1, r: 10, score: 80,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnGun(x) {
    spawnEnt({
      type: 'gun',
      x: x == null ? rand(80, VW - 80) : x,
      y: -40,
      vx: rand(-28, 28),
      vy: 50,
      hp: 4, r: 18, score: 160,
      rgb: RED,
      drop: Math.random() < 0.34,
      w: 38, h: 22,
      fireCd: rand(0.35, 0.8)
    });
  }

  function spawnCarrier() {
    spawnEnt({
      type: 'carrier',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 74,
      hp: 2, r: 13, score: 300,
      rgb: GOLD,
      drop: 'cycle',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnTurret(x, y) {
    spawnEnt({
      type: 'turret',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 3, r: 12, score: 140,
      rgb: GOLD,
      ground: true,
      w: 22, h: 18,
      fireCd: rand(0.45, 1.3)
    });
  }

  function spawnTank(x) {
    spawnEnt({
      type: 'tank',
      x: x == null ? rand(70, VW - 70) : x,
      y: -28,
      vx: rand(-42, 42),
      vy: 0,
      hp: 5, r: 16, score: 200,
      rgb: ORG,
      ground: true,
      drop: Math.random() < 0.22,
      w: 30, h: 18,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnBunker(x) {
    spawnEnt({
      type: 'bunker',
      x: x == null ? rand(90, VW - 90) : x,
      y: -36,
      vx: 0, vy: 0,
      hp: 8, r: 20, score: 260,
      rgb: SAND,
      ground: true,
      drop: Math.random() < 0.4,
      w: 40, h: 24,
      fireCd: rand(0.55, 1.0)
    });
  }

  function spawnTurretWave() {
    const n = isDense() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnTurret(clamp(x, 40, VW - 40), -24 - i * 18);
    }
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.midHp * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -60,
      vx: 58,
      vy: 44,
      hp: hp,
      r: 32,
      score: 1800,
      rgb: TEAL,
      drop: 'bomb',
      w: 72,
      h: 36,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(TEAL, 0.36);
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
      vx: 66,
      vy: 42,
      hp: hp,
      r: 46,
      score: 3500 + G.stage * 1200,
      rgb: MINT,
      drop: 'cycle',
      w: 108,
      h: 50,
      fireCd: 0.55,
      phase: 0,
      spin: 0
    });
    toast(st.boss, false, true);
    audio.boss();
    screenFlash(MINT, 0.42);
    kick(5.4);
  }

  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'mid' || t === 'boss') && G.ents[i].hp > 0) return true;
    }
    return false;
  }

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'gun') spawnGun();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'turrets') spawnTurretWave();
    else if (w.kind === 'tank') spawnTank();
    else if (w.kind === 'bunker') spawnBunker();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function nextDropKind() {
    const k = DROP_CYCLE[G.dropI % DROP_CYCLE.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    kind = kind || nextDropKind();
    G.pows.push({
      x: x, y: y, vy: 64, t: 0,
      vx: rand(-38, 38),
      kind: kind
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
      vy: spec.vy || 0,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      kind: spec.kind || 'red',
      pierce: spec.pierce || 0,
      dmg: spec.dmg || 1,
      layer: spec.layer || 'air',
      ttl: spec.ttl,
      g: spec.g || 0,
      phase: spec.phase || 0
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || overlayOpen()) return;
    if (G.fireCd > 0) return;
    const lv = G.wpnLv;
    const x = G.player.x;
    const y = G.player.y - 16;
    G.muzzle = 0.05;
    const rgb = WPN_RGB[G.wpn] || RED;
    if (G.wpn === 'blue') {
      G.fireCd = 0.136 - lv * 0.014;
      const pierce = 1 + lv;
      const n = lv <= 0 ? 1 : lv === 1 ? 2 : 3;
      const spd = -780 - lv * 20;
      if (n === 1) {
        addShot({ x: x, y: y, vy: spd, r: 3.8, rgb: rgb, kind: 'blue', pierce: pierce, dmg: 1, layer: 'both' });
      } else if (n === 2) {
        addShot({ x: x - 8, y: y, vy: spd, r: 3.5, rgb: rgb, kind: 'blue', pierce: pierce, dmg: 1, layer: 'both' });
        addShot({ x: x + 8, y: y, vy: spd, r: 3.5, rgb: rgb, kind: 'blue', pierce: pierce, dmg: 1, layer: 'both' });
      } else {
        addShot({ x: x, y: y - 2, vy: spd - 20, r: 4.2, rgb: rgb, kind: 'blue', pierce: pierce + 1, dmg: 1, layer: 'both' });
        addShot({ x: x - 12, y: y, vy: spd, r: 3.4, rgb: rgb, kind: 'blue', pierce: pierce, dmg: 1, layer: 'both' });
        addShot({ x: x + 12, y: y, vy: spd, r: 3.4, rgb: rgb, kind: 'blue', pierce: pierce, dmg: 1, layer: 'both' });
      }
    } else if (G.wpn === 'green') {
      G.fireCd = 0.128 - lv * 0.012;
      const n = lv >= 2 ? 4 : 2;
      const spd = -620 - lv * 24;
      for (let i = 0; i < n; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const row = (i / 2) | 0;
        addShot({
          x: x + side * (8 + row * 10),
          y: y + row * 4,
          vx: side * 40,
          vy: spd,
          r: 3.6,
          rgb: rgb,
          kind: 'green',
          dmg: 1,
          layer: 'air',
          phase: side * (1 + row)
        });
      }
    } else {
      G.fireCd = 0.104 - lv * 0.014;
      const spd = -650;
      function fan(ox, oy, vx, vy) {
        addShot({
          x: x + ox, y: y + oy,
          vx: vx || 0, vy: vy == null ? spd : vy,
          r: 3.1, rgb: lv >= 2 ? GOLD : RED,
          kind: 'red', dmg: 1, layer: 'air'
        });
      }
      if (lv <= 0) {
        fan(0, 0);
      } else if (lv === 1) {
        fan(-8, 2, -70, spd);
        fan(0, -2);
        fan(8, 2, 70, spd);
      } else if (lv === 2) {
        fan(-14, 4, -110, spd);
        fan(-6, 0, -40, spd);
        fan(0, -3);
        fan(6, 0, 40, spd);
        fan(14, 4, 110, spd);
      } else {
        fan(-16, 5, -130, spd);
        fan(-9, 1, -60, spd);
        fan(-3, -2);
        fan(3, -2);
        fan(9, 1, 60, spd);
        fan(16, 5, 130, spd);
      }
    }
    audio.shoot(G.wpn);
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: rgb, g: 0
    });
    if (G.bombLetCd <= 0) {
      G.bombLetCd = 0.24 - lv * 0.018;
      const bn = lv >= 2 ? 2 : 1;
      for (let b = 0; b < bn; b++) {
        addShot({
          x: x + (bn === 1 ? 0 : b === 0 ? -7 : 7),
          y: y + 8,
          vx: (bn === 1 ? 0 : b === 0 ? -36 : 36),
          vy: -380,
          r: 3.5,
          rgb: GOLD,
          kind: 'bomblet',
          dmg: 2,
          layer: 'ground',
          ttl: 0.62,
          g: 220
        });
      }
      audio.bomblet();
    }
  }

  function explodeCluster(x, y, big) {
    const radG = big ? 86 : 38;
    const radA = big ? 54 : 18;
    const radB = big ? 96 : 28;
    juice(x, y, big ? ORG : GOLD, big ? 2.1 : 0.7);
    if (big) {
      audio.boom(true);
      hitStop(0.072);
      screenFlash(WHT, 0.62);
      popSpark(x, y, GOLD, 36);
      fires.push({ x: x, y: y, t: 0.78, r: 52, tick: 0 });
      capArr(fires, 8);
      if (stageEl && !REDUCE) {
        stageEl.classList.remove('bomb');
        void stageEl.offsetWidth;
        stageEl.classList.add('bomb');
      }
    } else {
      hitStop(0.032);
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      const dx = s.x - x;
      const dy = s.y - y;
      if (dx * dx + dy * dy < radB * radB) {
        emit(2, {
          x: s.x, y: s.y, j: 2,
          vx0: -50, vx1: 50, vy0: -50, vy1: 50,
          life: 0.12, r0: 1, r1: 2, rgb: WHT, g: 0
        });
        G.eShots.splice(i, 1);
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dx = en.x - x;
      const dy = en.y - y;
      const d2 = dx * dx + dy * dy;
      if (en.ground && d2 < radG * radG) {
        hurtEnt(en, big ? 10 : 2, en.x, en.y);
      } else if (!en.ground && d2 < radA * radA) {
        hurtEnt(en, big ? 3 : 0, en.x, en.y);
      }
    }
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('炸弹用尽', true);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.42;
    G.bombFlash = 0.55;
    G.invuln = Math.max(G.invuln, 0.28);
    audio.bomb();
    const x = G.player.x;
    const y = G.player.y - 8;
    const n = 5;
    for (let i = 0; i < n; i++) {
      const u = i - (n - 1) / 2;
      addShot({
        x: x + u * 10,
        y: y,
        vx: u * 52,
        vy: -420,
        r: 5.2,
        rgb: ORG,
        kind: 'cluster',
        dmg: 10,
        layer: 'ground',
        ttl: 0.55,
        g: 280
      });
    }
    emit(16, {
      x: x, y: y, j: 10,
      vx0: -160, vx1: 160, vy0: -220, vy1: 40,
      life: 0.28, r0: 1.4, r1: 3.2, rgb: GOLD, g: 80
    });
    kick(5.2);
    syncHud();
  }

  function hurtEnt(en, dmg, hx, hy) {
    if (en.hp <= 0 || dmg <= 0) return;
    en.hp -= dmg;
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
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.ground ? 1.15 : 0.85;
    juice(en.x, en.y, en.rgb, pwr);
    audio.hit(G.combo);
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.drop === 'cycle' || en.drop === true) spawnPow(en.x, en.y, nextDropKind());
    else if (en.drop === 'bomb') spawnPow(en.x, en.y, 'bomb');
    else if (en.drop) spawnPow(en.x, en.y, en.drop);
    else if ((en.type === 'gun' || en.type === 'tank' || en.type === 'bunker') && Math.random() < 0.2) {
      spawnPow(en.x, en.y, nextDropKind());
    }
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(1200 * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      toast(STAGES[G.stage - 1] ? STAGES[G.stage - 1].name.replace(/^第 \d 关 · /, '') + '肃清' : '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        toast('炸弹 +1', false, true);
      } else {
        addScore(800 * G.mult);
        toast('+800', false, true);
      }
    } else {
      const kind = p.kind === 'blue' || p.kind === 'green' ? p.kind : 'red';
      if (G.wpn === kind) {
        if (G.wpnLv < WPN_MAX) {
          G.wpnLv += 1;
          toast(WPN_NAME[kind] + (G.wpnLv >= WPN_MAX ? ' MAX' : ' 强化'), false, true);
        } else {
          addScore(500 * G.mult);
          toast('+500', false, true);
        }
      } else {
        G.wpn = kind;
        G.wpnLv = Math.max(1, Math.min(G.wpnLv, 2));
        toast('武装 · ' + WPN_NAME[kind], false, true);
      }
      flashWpn();
    }
    juice(p.x, p.y, p.kind === 'blue' ? BLU : p.kind === 'green' ? MINT : p.kind === 'bomb' ? GOLD : RED, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, DROP_GLYPH[p.kind] || '赤', p.kind === 'blue' ? BLU : p.kind === 'green' ? MINT : p.kind === 'bomb' ? GOLD : RED, true);
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.bombT = 0;
    breakCombo();
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.wpnLv > 0 || G.wpn !== 'red') {
      spawnPow(G.player.x, G.player.y - 18, G.wpn);
    }
    G.wpn = 'red';
    G.wpnLv = 0;
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
    G.why = '坠机了';
    saveBest();
    audio.lose();
    showOverlay('lose', '坠机了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : '') + ' · 被弹或撞机扣尽三命');
    syncHud();
  }

  function winGame() {
    addScore(isDense() ? 8500 : 7000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '双蛇尽破', (isDense() ? '密弹通关' : '三关打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function livingCount() {
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

  function denseThink(dt) {
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
    G.spawnT = clamp(1.5 / (1 + G.stage * 0.12), 0.4, 1.5);
    if (livingCount() > 26) return;
    const r = Math.random();
    if (r < 0.3) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.48) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.62) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.74) spawnGun();
    else if (r < 0.84) spawnCarrier();
    else if (r < 0.93) spawnTank();
    else spawnBunker();
  }

  function bossFire(en, dense) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += dense ? 0.22 : 0.16;
    if (en.type === 'mid') {
      if (stg === 1) {
        aimShot(en.x, en.y + 16, dense ? 206 : 172, TEAL);
        eShot(en.x - 18, en.y + 10, -46, 186, PNK);
        eShot(en.x + 18, en.y + 10, 46, 186, PNK);
      } else if (stg === 2) {
        eShot(en.x - 12, en.y + 14, -28, 190, SAND);
        eShot(en.x, en.y + 16, 0, 204, SAND);
        eShot(en.x + 12, en.y + 14, 28, 190, SAND);
        if (mid) aimShot(en.x, en.y + 10, 188, ORG);
      } else {
        aimShot(en.x - 22, en.y + 8, dense ? 210 : 176, MINT);
        aimShot(en.x + 22, en.y + 8, dense ? 210 : 176, MINT);
        if (mid) ringShot(en.x, en.y, dense ? 10 : 8, 142, en.spin, TEAL, 3.1);
      }
      if (low) {
        aimShot(en.x - 22, en.y + 8, 200, MAG);
        aimShot(en.x + 22, en.y + 8, 200, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 18, 208, MAG);
      eShot(en.x - 26, en.y + 12, -50, 196, RED);
      eShot(en.x + 26, en.y + 12, 50, 196, RED);
      if (mid) ringShot(en.x, en.y + 6, dense ? 12 : 9, 134, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 42, 208, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, dense ? 14 : 11, 142, en.spin, ORG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 8, dense ? 10 : 8, 114, -en.spin * 1.4, SAND, 3.0);
        aimShot(en.x, en.y + 16, 196, GOLD);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 214, RED);
        aimShot(en.x + 28, en.y + 10, 214, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      const hx = 30 + Math.sin(en.t * 1.6) * 6;
      aimShot(en.x - hx, en.y + 8, dense ? 214 : 186, MINT);
      aimShot(en.x + hx, en.y + 8, dense ? 214 : 186, MINT);
      eShot(en.x - hx, en.y + 12, Math.sin(en.t * 4) * 70, 168, LEAF);
      eShot(en.x + hx, en.y + 12, -Math.sin(en.t * 4) * 70, 168, LEAF);
      if (mid) ringShot(en.x, en.y + 6, dense ? 12 : 10, 128, en.spin, TEAL, 3.0);
      if (low) {
        ringShot(en.x, en.y, dense ? 16 : 12, 158, en.t * 3.2, GOLD, 3.3);
        aimShot(en.x, en.y + 18, 220, MAG);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (dense) en.fireCd *= 0.78;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0 || G.bombT > 0;
    const dense = isDense();
    const scr = scrollSpd();

    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.ground) {
        en.y += scr * dt;
        if (en.type === 'tank') {
          en.x += en.vx * dt;
          if (en.x < 40 || en.x > VW - 40) en.vx *= -1;
        }
      } else if (en.type === 'mid' || en.type === 'boss') {
        const rest = en.type === 'boss' ? 108 : 124;
        if (en.y < rest) en.y += en.vy * dt;
        else {
          en.y = rest;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 96 : 78;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
      } else if (en.type === 'carrier') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 66;
        }
      } else if (en.type === 'dive') {
        if (en.t > 0.32) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 174;
          en.vx = lerp(en.vx, dx / len * asp, 1 - Math.exp(-dt * 3.1));
          en.vy = lerp(en.vy, dy / len * asp, 1 - Math.exp(-dt * 3.1));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'scout') {
        if (!en.dive && en.t > 1.28 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.28) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 92, dt * 2);
          en.vy = Math.max(en.vy, 150);
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'gun') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < 46 || en.x > VW - 46) en.vx *= -1;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 52 || en.x < -64 || en.x > VW + 64) {
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && en.y > -10 && en.y < VH + 10) {
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          if (en.type === 'scout' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, dense ? 196 : 168, MAG);
            if (dense && Math.random() < 0.45) aimShot(en.x, en.y + 8, 164, PNK);
            en.fireCd = (dense ? 1.32 : 2.3) + rand(0, 0.55);
          } else if (en.type === 'gun') {
            eShot(en.x - 9, en.y + 12, -34, 172, RED);
            eShot(en.x, en.y + 14, 0, 192, RED);
            eShot(en.x + 9, en.y + 12, 34, 172, RED);
            if (dense) aimShot(en.x, en.y + 10, 182, ORG);
            en.fireCd = dense ? 0.7 : 1.02;
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 210 : 170, GOLD);
            if (dense) {
              eShot(en.x - 8, en.y + 4, -40, 156, ORG);
              eShot(en.x + 8, en.y + 4, 40, 156, ORG);
            }
            en.fireCd = (dense ? 0.76 : 1.14) + rand(0, 0.28);
          } else if (en.type === 'tank' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, dense ? 196 : 162, ORG);
            en.fireCd = dense ? 0.68 : 1.0;
          } else if (en.type === 'bunker' && en.y > 8 && en.y < VH - 70) {
            eShot(en.x - 10, en.y + 8, -36, 176, SAND);
            eShot(en.x, en.y + 10, 0, 188, SAND);
            eShot(en.x + 10, en.y + 8, 36, 176, SAND);
            if (dense) aimShot(en.x, en.y, 178, ORG);
            en.fireCd = dense ? 0.78 : 1.12;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, dense);
            else en.fireCd = 0.4;
          } else {
            en.fireCd = 2;
          }
        }
      }

      if (canHurt) {
        const rr = en.r + 4.4;
        const dx = en.x - px;
        const dy = en.y - py;
        if (dx * dx + dy * dy < rr * rr) {
          if (!inv) killPlayer();
        }
      }
    }
  }

  function shotHitsLayer(s, en) {
    if (s.layer === 'both') return true;
    if (s.layer === 'ground') return !!en.ground;
    return !en.ground;
  }

  function updateShots(dt) {
    const playing = G.mode === 'play';
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.kind === 'green') {
        s.phase = (s.phase || 1);
        s.vx = Math.sin((s.y * 0.04) + G.t * 10) * 170 * Math.sign(s.phase || 1);
      }
      if (s.g) s.vy += s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.ttl != null) {
        s.ttl -= dt;
        if (s.ttl <= 0) {
          if (s.kind === 'cluster') explodeCluster(s.x, s.y, true);
          else if (s.kind === 'bomblet') explodeCluster(s.x, s.y, false);
          G.shots.splice(i, 1);
          continue;
        }
      }
      if (s.y < -28 || s.x < -20 || s.x > VW + 20 || s.y > VH + 28) {
        if (s.kind === 'cluster') explodeCluster(clamp(s.x, 20, VW - 20), clamp(s.y, 8, VH - 8), true);
        else if (s.kind === 'bomblet') explodeCluster(clamp(s.x, 20, VW - 20), clamp(s.y, 8, VH - 8), false);
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (!shotHitsLayer(s, en)) continue;
        if (s.struck && s.struck.indexOf(en) >= 0) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          if (s.kind === 'cluster') {
            explodeCluster(s.x, s.y, true);
            hit = true;
            break;
          }
          if (s.kind === 'bomblet') {
            hurtEnt(en, s.dmg || 2, s.x, s.y);
            explodeCluster(s.x, s.y, false);
            hit = true;
            break;
          }
          if (!s.struck) s.struck = [];
          s.struck.push(en);
          hurtEnt(en, s.dmg || 1, s.x, s.y);
          if (s.kind === 'blue' && s.pierce > 0) {
            s.pierce -= 1;
            continue;
          }
          if (s.pierce > 0) s.pierce -= 1;
          else hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0;
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
        const rr = 4.5 + s.r;
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

  function updateFires(dt) {
    const scr = scrollSpd();
    for (let i = fires.length - 1; i >= 0; i--) {
      const f = fires[i];
      f.t -= dt;
      f.y += scr * dt;
      f.tick -= dt;
      if (f.t <= 0) {
        fires.splice(i, 1);
        continue;
      }
      if (f.tick <= 0) {
        f.tick = 0.16;
        for (let j = 0; j < G.ents.length; j++) {
          const en = G.ents[j];
          if (en.hp <= 0 || !en.ground) continue;
          const dx = en.x - f.x;
          const dy = en.y - f.y;
          if (dx * dx + dy * dy < (f.r + en.r) * (f.r + en.r)) {
            hurtEnt(en, 1, en.x, en.y);
          }
        }
      }
    }
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += scr * 0.22 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < trees.length; i++) {
      const tr = trees[i];
      tr.y += scr * dt;
      if (tr.y > VH + 40) {
        tr.y = -50 - rand(0, 80);
        const side = tr.x < VW * 0.5 ? -1 : 1;
        tr.x = side < 0 ? rand(10, 82) : rand(VW - 82, VW - 10);
        tr.s = rand(0.7, 1.35);
        tr.kind = Math.random();
      }
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
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.bombFlash > 0) G.bombFlash -= dt;
    if (G.toastT > 0) G.toastT -= dt;
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
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingCount() < 7) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 40);
        if (Math.random() < 0.4) spawnTank();
        G.spawnT = 2.6;
      }
      updateEnts(dt);
      updateWorld(dt * 0.55);
      G.rotorT -= dt;
      if (G.rotorT <= 0) {
        G.rotorT = 0.09;
        if (!audio.muted && audio.ctx) audio.rotor();
      }
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
    if (G.bombLetCd > 0) G.bombLetCd -= dt;
    if (G.bombT > 0) G.bombT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    G.rotorT -= dt;
    if (G.rotorT <= 0 && G.deadT <= 0) {
      G.rotorT = 0.086;
      audio.rotor();
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
        G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
        G.invuln = Math.max(G.invuln, 0.85);
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isDense()) denseThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
    updateFires(dt);
  }

  function riverX(y) {
    return VW * 0.5 + Math.sin((y + G.scroll) * 0.012) * 38 + Math.sin((y + G.scroll) * 0.031) * 16;
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#1c1608');
      g.addColorStop(0.5, '#142010');
      g.addColorStop(1, '#0a1810');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#081610');
      g.addColorStop(0.5, '#04140e');
      g.addColorStop(1, '#061410');
    } else {
      g.addColorStop(0, '#0a2418');
      g.addColorStop(0.55, '#061810');
      g.addColorStop(1, '#061410');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = 'rgba(180,255,220,' + s.a + ')';
      ctx.fillRect(sx(s.x), sy(s.y), Math.max(1, s.z * scale), Math.max(1, s.z * 1.4 * scale));
    }

    if (G.stage !== 2) {
      ctx.fillStyle = G.stage === 3 ? 'rgba(0, 80, 56, 0.35)' : 'rgba(0, 140, 110, 0.28)';
      ctx.beginPath();
      for (let y = -20; y <= VH + 20; y += 8) {
        const rx = riverX(y);
        const w = G.stage === 3 ? 46 : 58;
        if (y === -20) ctx.moveTo(sx(rx - w), sy(y));
        else ctx.lineTo(sx(rx - w), sy(y));
      }
      for (let y = VH + 20; y >= -20; y -= 8) {
        const rx = riverX(y);
        const w = G.stage === 3 ? 46 : 58;
        ctx.lineTo(sx(rx + w), sy(y));
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(MINT, G.stage === 3 ? 0.16 : 0.28);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      for (let y = -20; y <= VH + 20; y += 10) {
        const rx = riverX(y) + Math.sin((y + G.scroll) * 0.05) * 6;
        if (y === -20) ctx.moveTo(sx(rx), sy(y));
        else ctx.lineTo(sx(rx), sy(y));
      }
      ctx.stroke();
    } else {
      const off = G.scroll % 48;
      ctx.strokeStyle = 'rgba(196,150,72,0.14)';
      ctx.lineWidth = 1.2 * scale;
      for (let y = -48; y < VH + 48; y += 48) {
        const yy = y + (48 - off);
        ctx.beginPath();
        for (let x = 0; x <= VW; x += 16) {
          const yy2 = yy + Math.sin((x + G.scroll) * 0.018) * 7;
          if (x === 0) ctx.moveTo(sx(x), sy(yy2));
          else ctx.lineTo(sx(x), sy(yy2));
        }
        ctx.stroke();
      }
    }

    if (G.stage === 3) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = rgba(MINT, 0.8);
      ctx.lineWidth = 1.1 * scale;
      for (let i = 0; i < 6; i++) {
        const cx = 70 + (i % 3) * 170;
        const cy = ((G.scroll * 0.4 + i * 140) % (VH + 80)) - 40;
        ctx.beginPath();
        ctx.ellipse(sx(cx), sy(cy), 18 * scale, 10 * scale, 0, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(sx(cx - 10), sy(cy), 2.4 * scale, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (let i = 0; i < trees.length; i++) {
      const tr = trees[i];
      const x = sx(tr.x);
      const y = sy(tr.y);
      ctx.save();
      ctx.fillStyle = G.stage === 2 ? 'rgba(80, 58, 22, 0.7)' : 'rgba(8, 48, 32, 0.85)';
      ctx.beginPath();
      ctx.moveTo(x, y - 22 * tr.s * scale);
      ctx.lineTo(x + 12 * tr.s * scale, y + 6 * tr.s * scale);
      ctx.lineTo(x - 12 * tr.s * scale, y + 6 * tr.s * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(G.stage === 2 ? SAND : MINT, 0.18 + tr.kind * 0.1);
      ctx.beginPath();
      ctx.moveTo(x, y - 14 * tr.s * scale);
      ctx.lineTo(x + 7 * tr.s * scale, y + 2 * tr.s * scale);
      ctx.lineTo(x - 7 * tr.s * scale, y + 2 * tr.s * scale);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < fires.length; i++) {
      const f = fires[i];
      const a = clamp(f.t / 0.78, 0, 1);
      ctx.save();
      ctx.fillStyle = rgba(ORG, 0.22 * a);
      ctx.beginPath();
      ctx.ellipse(sx(f.x), sy(f.y), f.r * scale, f.r * 0.45 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.35 * a);
      ctx.beginPath();
      ctx.ellipse(sx(f.x), sy(f.y), f.r * 0.45 * scale, f.r * 0.22 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawHeli(x, y, a) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.player.vx * 0.0014);
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    const rgb = WPN_RGB[G.wpn] || MINT;
    ctx.shadowColor = rgba(rgb, 0.55);
    ctx.shadowBlur = 12;
    const spin = G.t * 28;
    ctx.strokeStyle = rgba(WHT, 0.55);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 5.5, spin, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 2, 16, 5.5, spin + Math.PI * 0.5, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = G.muzzle > 0 ? '#e8fff8' : rgba(MINT, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(5, -2);
    ctx.lineTo(11, 5);
    ctx.lineTo(4, 4);
    ctx.lineTo(5, 13);
    ctx.lineTo(0, 9);
    ctx.lineTo(-5, 13);
    ctx.lineTo(-4, 4);
    ctx.lineTo(-11, 5);
    ctx.lineTo(-5, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.86);
    ctx.fillRect(-1.4, -9, 2.8, 10);
    ctx.fillStyle = rgba(rgb, 0.9);
    ctx.fillRect(-9, 3, 5, 2.2);
    ctx.fillRect(4, 3, 5, 2.2);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(-3.2, -4, 1.3, 0, TAU);
    ctx.arc(3.2, -4, 1.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(8,24,16,0.7)';
    ctx.fillRect(-8, 10, 4, 2);
    ctx.fillRect(4, 10, 4, 2);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.moveTo(-3, -15);
      ctx.lineTo(0, -26);
      ctx.lineTo(3, -15);
      ctx.fill();
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
    if (en.type === 'scout' || en.type === 'dive') {
      ctx.strokeStyle = rgba(WHT, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 11, 3.5, G.t * 22, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(8, 1);
      ctx.lineTo(3, 1);
      ctx.lineTo(2, -8);
      ctx.lineTo(-2, -8);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-8, 1);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'gun') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 9, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-18, -3, 8, 14);
      ctx.fillRect(10, -3, 8, 14);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-6, -4, 12, 5);
    } else if (en.type === 'turret') {
      const dx = G.player.x - en.x;
      const dy = G.player.y - en.y;
      ctx.fillStyle = 'rgba(28, 40, 34, 0.95)';
      ctx.beginPath();
      ctx.arc(0, 4, 11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, TAU);
      ctx.fill();
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillRect(4, -2.1, 14, 4.2);
    } else if (en.type === 'tank') {
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.fillRect(-16, -6, 32, 14);
      ctx.fillRect(-18, 6, 10, 5);
      ctx.fillRect(8, 6, 10, 5);
      ctx.fillStyle = rgba(WHT, 0.25);
      ctx.fillRect(-8, -3, 16, 5);
      ctx.fillStyle = GOLD;
      ctx.fillRect(-2, -8, 4, 8);
    } else if (en.type === 'bunker') {
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.fillRect(-20, -8, 40, 20);
      ctx.fillRect(-14, -14, 28, 8);
      ctx.fillStyle = 'rgba(20, 28, 22, 0.85)';
      ctx.fillRect(-10, -4, 6, 5);
      ctx.fillRect(4, -4, 6, 5);
      ctx.fillStyle = rgba(RED, 0.7);
      ctx.fillRect(-2, -16, 4, 10);
    } else if (en.type === 'carrier') {
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, 13);
      ctx.lineTo(10, 1);
      ctx.lineTo(3, 1);
      ctx.lineTo(2, -12);
      ctx.lineTo(-2, -12);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-10, 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#041810';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('色', 0, 2);
    } else if (en.type === 'mid') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 38, 14, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-32, -6, 12, 24);
      ctx.fillRect(20, -6, 12, 24);
      ctx.fillStyle = rgba(GOLD, 0.65);
      ctx.fillRect(-8, -2, 16, 8);
    } else if (en.type === 'boss') {
      const hx = 30 + Math.sin(en.t * 1.6) * 4;
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 10, 42, 14, 0, 0, TAU);
      ctx.fill();
      function head(ox) {
        ctx.beginPath();
        ctx.moveTo(ox, -6);
        ctx.lineTo(ox + 12, 8);
        ctx.lineTo(ox + 4, 10);
        ctx.lineTo(ox - 4, 10);
        ctx.lineTo(ox - 12, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(ox - 4, 0, 2.1, 0, TAU);
        ctx.arc(ox + 4, 0, 2.1, 0, TAU);
        ctx.fill();
        ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      }
      head(-hx);
      head(hx);
      ctx.fillStyle = rgba(GOLD, 0.55);
      ctx.fillRect(-18, 6, 36, 6);
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.85);
      ctx.shadowBlur = 9 * scale;
      if (s.kind === 'blue') {
        ctx.fillRect(sx(s.x - 1.8), sy(s.y - 16), 3.6 * scale, 28 * scale);
        if (!REDUCE) {
          ctx.globalAlpha = 0.32;
          ctx.fillRect(sx(s.x - 3.2), sy(s.y - 8), 6.4 * scale, 22 * scale);
        }
      } else if (s.kind === 'green') {
        ctx.beginPath();
        ctx.ellipse(sx(s.x), sy(s.y), 3.4 * scale, 7 * scale, 0, 0, TAU);
        ctx.fill();
        if (!REDUCE) {
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.ellipse(sx(s.x - s.vx * 0.012), sy(s.y + 8), 2.4 * scale, 6 * scale, 0, 0, TAU);
          ctx.fill();
        }
      } else if (s.kind === 'cluster' || s.kind === 'bomblet') {
        ctx.translate(sx(s.x), sy(s.y));
        ctx.beginPath();
        ctx.ellipse(0, 0, (s.kind === 'cluster' ? 4.4 : 2.8) * scale, (s.kind === 'cluster' ? 6.2 : 4.2) * scale, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.5);
        ctx.fillRect(-1 * scale, -3 * scale, 2 * scale, 5 * scale);
      } else {
        ctx.fillRect(sx(s.x - 1.4), sy(s.y - 6), 2.8 * scale, 11 * scale);
        if (!REDUCE) {
          ctx.globalAlpha = 0.32;
          ctx.fillRect(sx(s.x - 1.2), sy(s.y), 2.4 * scale, 10 * scale);
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

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 8) * 2;
      const rgb = p.kind === 'blue' ? BLU : p.kind === 'green' ? MINT : p.kind === 'bomb' ? GOLD : RED;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.rotate(p.t * 2.2);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.shadowColor = rgba(rgb, 0.8);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#041810';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.2);
      ctx.shadowBlur = 0;
      ctx.fillText(DROP_GLYPH[p.kind] || '赤', 0, 1);
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
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : MINT, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : MINT, 0.6);
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
    if (G.bombFlash > 0) {
      ctx.strokeStyle = rgba(GOLD, G.bombFlash * 0.9);
      ctx.lineWidth = 7 * scale;
      ctx.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020c0a';
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
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawHeli(G.player.x, G.player.y, 1);
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
    fires.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'dense' ? 'dense' : 'sweep';
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
    G.wpn = 'red';
    G.wpnLv = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.bombLetCd = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.fireCd = 0;
    G.fireHold = false;
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
    G.dropI = 0;
    G.why = '';
    G.rotorT = 0;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedStars();
    seedTrees();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isDense() ? '密弹 · 更密更快' : '扫射 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'sweep';
    G.stage = 1;
    G.lives = LIVES;
    G.bombs = 3;
    G.wpn = 'red';
    G.wpnLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bombT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedStars();
    seedTrees();
    showOverlay('title', '双蛇', '纵卷武装直升机。空格机枪打空中，Shift 丢弹打地面。捡色荚切赤散、青穿、绿蛇。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('sweep');
    else startGame(G.kind || 'sweep');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('sweep');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('dense');
    else if (G.mode === 'lose' || G.mode === 'win') goTitle();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isBomb = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

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

    if (down && (isMove || space || isBomb || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
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
    if (isBomb) {
      if (!e.repeat) tryBomb();
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

  if (btnSweep) {
    btnSweep.addEventListener('click', function () {
      audio.ensure();
      startGame('sweep');
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
      startGame(G.kind);
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnBomb) btnBomb.addEventListener('click', tryBomb);
  if (btnPad) btnPad.addEventListener('click', tryBomb);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
