'use strict';

(function () {
  const VW = 1080;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const BOMB_CAP = 6;
  const WPN_MAX = 3;
  const BEST_KEY = 'playbox-darius2-best';
  const MUTE_KEY = 'playbox-darius2-mute';
  const OPS = '方向 / WASD 飞 · 空格开火 · Shift / Z 爆弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 78, 200];
  const CYN = [62, 200, 255];
  const TEAL = [46, 240, 208];
  const GOLD = [255, 227, 107];
  const HOT = [90, 212, 255];
  const WHT = [232, 246, 255];
  const SUN = [255, 154, 60];
  const BONE = [214, 228, 236];
  const DEEP = [6, 16, 24];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ICE = [180, 220, 255];

  const SCORE = {
    dart: 50,
    orb: 80,
    spike: 70,
    turret: 90,
    manta: 120,
    carrier: 280,
    spine: 200,
    dive: 60,
    boss: 5000,
    clear: 1800,
    all: 6000,
    weak: 40
  };

  const STAGES = [
    {
      name: '日冕',
      boss: '骨王',
      bossKind: 'fossil',
      bossHp: 78,
      hue: 28,
      waves: [
        { t: 0.5, kind: 'dartV', n: 5, y: 0.42 },
        { t: 2.1, kind: 'ring', n: 6, y: 0.55 },
        { t: 3.6, kind: 'turret', n: 2 },
        { t: 4.8, kind: 'dartV', n: 6, y: 0.28 },
        { t: 6.2, kind: 'spine', n: 7 },
        { t: 7.6, kind: 'manta', n: 1, y: 0.48 },
        { t: 9.0, kind: 'dive', n: 4 },
        { t: 10.2, kind: 'carrier' },
        { t: 11.4, kind: 'diamond', n: 8 },
        { t: 12.8, kind: 'turret', n: 2 },
        { t: 13.8, kind: 'dartV', n: 7, y: 0.62 },
        { t: 15.2, kind: 'ring', n: 6, y: 0.38 },
        { t: 16.8, kind: 'boss' }
      ]
    },
    {
      name: '汞海',
      boss: '灯鮟',
      bossKind: 'lantern',
      bossHp: 96,
      hue: 210,
      waves: [
        { t: 0.4, kind: 'spike', n: 4 },
        { t: 1.6, kind: 'turret', n: 3 },
        { t: 2.8, kind: 'dartV', n: 6, y: 0.36 },
        { t: 4.2, kind: 'ring', n: 7, y: 0.5 },
        { t: 5.6, kind: 'manta', n: 2, y: 0.32 },
        { t: 7.0, kind: 'spine', n: 8 },
        { t: 8.4, kind: 'carrier' },
        { t: 9.6, kind: 'diamond', n: 9 },
        { t: 10.8, kind: 'dive', n: 5 },
        { t: 12.0, kind: 'turret', n: 2 },
        { t: 13.2, kind: 'spike', n: 5 },
        { t: 14.6, kind: 'dartV', n: 7, y: 0.58 },
        { t: 16.4, kind: 'boss' }
      ]
    },
    {
      name: '土环',
      boss: '巨物',
      bossKind: 'whale',
      bossHp: 132,
      hue: 195,
      waves: [
        { t: 0.4, kind: 'dartV', n: 6, y: 0.3 },
        { t: 1.6, kind: 'dartV', n: 6, y: 0.7 },
        { t: 2.8, kind: 'ring', n: 7, y: 0.48 },
        { t: 4.2, kind: 'manta', n: 2, y: 0.4 },
        { t: 5.6, kind: 'turret', n: 3 },
        { t: 6.8, kind: 'spine', n: 9 },
        { t: 8.0, kind: 'diamond', n: 10 },
        { t: 9.2, kind: 'carrier' },
        { t: 10.4, kind: 'dive', n: 6 },
        { t: 11.6, kind: 'manta', n: 2, y: 0.62 },
        { t: 12.8, kind: 'ring', n: 8, y: 0.36 },
        { t: 14.0, kind: 'spike', n: 5 },
        { t: 15.4, kind: 'dartV', n: 8, y: 0.5 },
        { t: 17.0, kind: 'boss' }
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
  const btnRaid = document.getElementById('btn-raid');
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
  const pointer = { down: false, hover: false, x: 120, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const motes = [];
  const hills = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    stage: 0,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    px: 120,
    py: VH * 0.5,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    wpnLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
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
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    winT: 0,
    nextLife: LIFE_EVERY,
    dropI: 0,
    why: '',
    bossIn: false,
    pullX: 0,
    pullY: 0
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
  function stageOf() {
    return STAGES[G.stage] || STAGES[0];
  }
  function comboMul(c) {
    return 1 + Math.min(4, Math.floor(Math.max(0, c - 1) / 3));
  }
  function plySpd() {
    return isCore() ? 318 : 276;
  }
  function scrollSpd() {
    if (G.bossIn) return isCore() ? 32 : 22;
    const base = isCore() ? 142 : 98;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function hueRgb(h, s, l) {
    s = s == null ? 0.72 : s;
    l = l == null ? 0.52 : l;
    const a = ((h % 360) + 360) % 360 / 60;
    const i = Math.floor(a);
    const f = a - i;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(f - 1));
    const m = l - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (i === 0) { r = c; g = x; }
    else if (i === 1) { r = x; g = c; }
    else if (i === 2) { g = c; b = x; }
    else if (i === 3) { g = x; b = c; }
    else if (i === 4) { r = x; b = c; }
    else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function moveVec(l, r, u, d) {
    let dx = (r ? 1 : 0) - (l ? 1 : 0);
    let dy = (d ? 1 : 0) - (u ? 1 : 0);
    const m = Math.sqrt(dx * dx + dy * dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    return { x: dx, y: dy };
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
      this.beep(760 + G.wpnLv * 50, 0.042, 'square', 0.028, 1680);
    },
    missile() {
      this.ensure();
      this.beep(240, 0.07, 'sawtooth', 0.026, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.032, 0.03, 1500);
      this.beep(580 * lift, 0.06, 'square', 0.04, 1020 * lift);
    },
    weak() {
      this.ensure();
      this.beep(920, 0.07, 'triangle', 0.046, 1380);
      this.beep(1380, 0.1, 'sine', 0.03, 1840);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.09, big ? 0.078 : 0.046, big ? 200 : 480);
      this.beep(big ? 140 : 240, big ? 0.28 : 0.13, 'sawtooth', 0.052, 48);
    },
    bomb() {
      this.ensure();
      this.noise(0.32, 0.084, 150);
      this.beep(82, 0.46, 'sawtooth', 0.07, 36);
      this.beep(820, 0.2, 'sine', 0.04, 190);
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
    death() {
      this.ensure();
      this.noise(0.16, 0.058, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 70);
      this.beep(150, 0.32, 'sine', 0.045, 42);
    },
    boss() {
      this.ensure();
      this.beep(170, 0.2, 'sawtooth', 0.054, 88);
      this.beep(118, 0.32, 'square', 0.04, 64);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.04, 86);
      this.beep(130, 0.32, 'sine', 0.05, 44);
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
    stage() {
      this.ensure();
      this.beep(440, 0.08, 'sine', 0.04, 660);
      this.beep(880, 0.16, 'triangle', 0.042, 1320);
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
    if (G.wpnLv >= WPN_MAX) return '七向';
    if (G.wpnLv <= 0) return '火';
    return '火 ' + ['', 'Ⅱ', 'Ⅲ'][G.wpnLv];
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
    const st = stageOf();
    if (stageLabel) {
      stageLabel.textContent = G.bossIn ? st.boss : st.name;
      stageLabel.classList.toggle('hot', G.bossIn || G.stage >= 2);
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '流核' : '大流2';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 2);
    }
    if (wpnLabel) wpnLabel.textContent = wpnText();
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
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
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹即失一命', 'warn');
    else if (G.mode === 'win') setHint('星路尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 打发光弱点 · Shift 爆弹', 'warn');
    else if (G.wpnLv >= WPN_MAX) setHint('七向齐射 · 后弹清尾 · 打鱼舰弱点', 'hot');
    else setHint('方向飞 · 空格开火 · Shift 爆弹 · 满火七向含后射', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DAR2';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvRetry) btnOvRetry.textContent = '再来';
    if (btnOvModes) {
      if (kind === 'win' && !isCore()) btnOvModes.textContent = '流核';
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
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 420);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 52);
    capArr(rings, 36);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.92 : 0.64,
      size: gold ? 20 : 14, gold: !!gold, vy: gold ? -88 : -72
    });
    capArr(floats, 28);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const m = comboMul(G.combo);
    if (m > G.mult) {
      audio.combo(m);
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
    G.mult = m;
  }

  function seedDecor() {
    stars.length = 0;
    motes.length = 0;
    hills.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        x: hash2(i * 3 + 1) * VW,
        y: hash2(i * 7 + 4) * VH,
        s: 0.6 + hash2(i * 11) * 1.8,
        v: 18 + hash2(i * 13) * 70,
        a: 0.18 + hash2(i * 17) * 0.55
      });
    }
    for (let i = 0; i < 36; i++) {
      motes.push({
        x: hash2(i * 5 + 2) * VW,
        y: hash2(i * 9 + 8) * VH,
        s: 1.2 + hash2(i) * 3.4,
        v: 28 + hash2(i * 19) * 90,
        a: 0.12 + hash2(i * 23) * 0.35,
        rgb: i % 3 === 0 ? SUN : i % 3 === 1 ? CYN : ICE
      });
    }
    for (let i = 0; i < 14; i++) {
      hills.push({
        x: i * 90 + hash2(i + 3) * 40,
        w: 50 + hash2(i * 2) * 70,
        h: 10 + hash2(i * 4 + 1) * 28
      });
    }
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
  }

  function makeShot(x, y, vx, vy, dmg, kind) {
    return {
      x: x, y: y, vx: vx, vy: vy || 0, r: kind === 'mis' ? 4.2 : 3.2,
      life: kind === 'mis' ? 1.5 : 0.95, dmg: dmg || 1,
      kind: kind || 'pulse', g: 0, dead: false
    };
  }

  function makeEShot(x, y, vx, vy, r, rgb) {
    return { x: x, y: y, vx: vx, vy: vy, r: r || 3.6, life: 3.4, rgb: rgb || SUN, dead: false };
  }

  function aimShot(x, y, tx, ty, spd, r, rgb) {
    const d = hypot(tx - x, ty - y) || 1;
    return makeEShot(x, y, (tx - x) / d * spd, (ty - y) / d * spd, r, rgb);
  }

  function makeDart(x, y, amp) {
    return {
      type: 'dart', x: x, y: y, baseY: y, w: 16, h: 9, hp: 1, score: SCORE.dart,
      vx: isCore() ? -168 : -132, amp: amp || 14, bob: rand(0, TAU),
      cd: rand(0.8, 1.6), dead: false, hitT: 0
    };
  }

  function makeOrb(cx, cy, ang, rad) {
    return {
      type: 'orb', x: cx, y: cy, cx: cx, cy: cy, w: 14, h: 14, hp: 1, score: SCORE.orb,
      vx: isCore() ? -96 : -78, ang: ang, rad: rad || 40, spin: isCore() ? 2.4 : 1.8,
      cd: rand(1.0, 1.8), dead: false, hitT: 0
    };
  }

  function makeSpike(x, y) {
    return {
      type: 'spike', x: x, y: y, w: 12, h: 16, hp: 1, score: SCORE.spike,
      vx: isCore() ? -70 : -52, vy: isCore() ? 90 : 70, phase: 0,
      dead: false, hitT: 0
    };
  }

  function makeTurret(x) {
    return {
      type: 'turret', x: x, y: VH - 22, w: 20, h: 16, hp: 3, score: SCORE.turret,
      vx: isCore() ? -58 : -44, cd: rand(0.4, 1.1), flash: 0, dead: false, hitT: 0
    };
  }

  function makeManta(x, y) {
    return {
      type: 'manta', x: x, y: y, baseY: y, w: 34, h: 16, hp: 3, score: SCORE.manta,
      vx: isCore() ? -88 : -70, bob: rand(0, TAU), amp: 22,
      cd: rand(0.5, 1.2), dead: false, hitT: 0
    };
  }

  function makeCarrier(x, y) {
    return {
      type: 'carrier', x: x, y: y, baseY: y, w: 36, h: 18, hp: 5, score: SCORE.carrier,
      vx: isCore() ? -66 : -50, bob: 0, drop: true, dead: false, hitT: 0
    };
  }

  function makeSpine(x, y, n) {
    const segs = [];
    for (let i = 0; i < n; i++) segs.push({ x: x + i * 13, y: y });
    return {
      type: 'spine', x: x, y: y, baseY: y, w: 16, h: 12, hp: n - 2, score: SCORE.spine,
      segs: segs, vx: isCore() ? -92 : -74, bob: rand(0, TAU), dead: false, hitT: 0
    };
  }

  function makeDive(x, y) {
    return {
      type: 'dive', x: x, y: y, w: 16, h: 10, hp: 1, score: SCORE.dive,
      vx: isCore() ? -86 : -64, vy: 0, dash: 0.5 + rand(0, 0.45), dead: false, hitT: 0
    };
  }

  function makeBoss(kind, name, hp) {
    const mul = isCore() ? 1.26 : 1;
    const h = Math.round(hp * mul);
    return {
      type: 'boss', kind: kind, name: name,
      x: VW + 120, y: VH * 0.5, vx: -54, vy: 0,
      hp: h, maxhp: h, score: SCORE.boss,
      t: 0, cd: 0.7, flash: 0, phase: 1,
      park: kind === 'whale' ? VW - 210 : VW - 168,
      lure: 1, open: 0, ang: 0, vac: 0,
      dead: false, hitT: 0, weakFlash: 0
    };
  }

  function nextDrop() {
    const cycle = ['shot', 'bomb', 'shot', 'shot', 'bomb'];
    const k = cycle[G.dropI % cycle.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      kind: kind || nextDrop(), x: x, y: y, vx: -36, vy: rand(-24, 24),
      bob: 0, dead: false, r: 11
    });
  }

  function spawnWave(w) {
    const extra = isCore() ? 1 : 0;
    if (w.kind === 'dartV') {
      const n = w.n + extra;
      const cy = VH * (w.y == null ? 0.5 : w.y);
      for (let i = 0; i < n; i++) {
        const row = i === 0 ? 0 : Math.ceil(i / 2);
        const sign = i === 0 ? 0 : (i % 2 ? 1 : -1);
        G.ents.push(makeDart(VW + 28 + row * 20, cy + sign * row * 16, 12 + row * 2));
      }
    } else if (w.kind === 'ring') {
      const n = w.n + extra;
      const cx = VW + 70;
      const cy = VH * (w.y == null ? 0.5 : w.y);
      for (let i = 0; i < n; i++) {
        G.ents.push(makeOrb(cx, cy, (i / n) * TAU, 36 + extra * 4));
      }
    } else if (w.kind === 'spike') {
      for (let i = 0; i < w.n + extra; i++) {
        G.ents.push(makeSpike(VW * 0.55 + i * 70, -12 - i * 18));
      }
    } else if (w.kind === 'turret') {
      for (let i = 0; i < w.n + extra; i++) {
        G.ents.push(makeTurret(VW + 40 + i * 70));
      }
    } else if (w.kind === 'manta') {
      for (let i = 0; i < w.n + extra; i++) {
        G.ents.push(makeManta(VW + 36 + i * 64, VH * ((w.y || 0.4) + i * 0.18)));
      }
    } else if (w.kind === 'carrier') {
      G.ents.push(makeCarrier(VW + 48, VH * 0.42));
    } else if (w.kind === 'spine') {
      G.ents.push(makeSpine(VW + 30, VH * 0.5, (w.n || 7) + extra));
    } else if (w.kind === 'dive') {
      for (let i = 0; i < w.n + extra; i++) {
        G.ents.push(makeDive(VW + 18 + i * 26, 40 + hash2(i + G.stageT * 3) * (VH - 80)));
      }
    } else if (w.kind === 'diamond') {
      const n = w.n + extra;
      const cx = VW + 50;
      const cy = VH * 0.5;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const rx = 28 + Math.abs(Math.cos(a)) * 18;
        const ry = 18 + Math.abs(Math.sin(a)) * 14;
        G.ents.push(makeDart(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 10));
      }
    } else if (w.kind === 'boss') {
      const st = stageOf();
      G.ents.push(makeBoss(st.bossKind, st.boss, st.bossHp));
      G.bossIn = true;
      audio.boss();
      toast('警告 · ' + st.boss + '接近', true, false);
      kick(5.4);
      screenFlash(SUN, 0.3);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    const lv = G.wpnLv;
    const cd = lv >= 3 ? 0.068 : lv === 2 ? 0.086 : lv === 1 ? 0.1 : 0.118;
    G.fireCd = isCore() ? cd * 0.9 : cd;
    G.muzzle = 0.06;
    const x = G.px + 18;
    const y = G.py;
    const spd = 700 + lv * 28;
    if (lv <= 0) {
      G.shots.push(makeShot(x, y, spd, 0, 1, 'pulse'));
    } else if (lv === 1) {
      G.shots.push(makeShot(x, y - 5, spd, 0, 1, 'pulse'));
      G.shots.push(makeShot(x, y + 5, spd, 0, 1, 'pulse'));
      G.shots.push(makeShot(G.px + 4, y + 6, 110, 40, 2, 'mis'));
      G.shots[G.shots.length - 1].g = 560;
    } else if (lv === 2) {
      G.shots.push(makeShot(x, y, spd, 0, 1, 'pulse'));
      G.shots.push(makeShot(x, y, spd * 0.94, -170, 1, 'pulse'));
      G.shots.push(makeShot(x, y, spd * 0.94, 170, 1, 'pulse'));
      const up = makeShot(G.px + 4, y - 6, 100, -50, 2, 'mis');
      up.g = -560;
      G.shots.push(up);
      const dn = makeShot(G.px + 4, y + 6, 100, 50, 2, 'mis');
      dn.g = 560;
      G.shots.push(dn);
    } else {
      G.shots.push(makeShot(x, y, spd, 0, 1, 'pulse'));
      G.shots.push(makeShot(x, y - 3, spd * 0.96, -120, 1, 'pulse'));
      G.shots.push(makeShot(x, y + 3, spd * 0.96, 120, 1, 'pulse'));
      G.shots.push(makeShot(G.px - 10, y - 4, -520, -210, 1, 'pulse'));
      G.shots.push(makeShot(G.px - 10, y + 4, -520, 210, 1, 'pulse'));
      const up = makeShot(G.px + 2, y - 7, 96, -60, 2, 'mis');
      up.g = -580;
      G.shots.push(up);
      const dn = makeShot(G.px + 2, y + 7, 96, 60, 2, 'mis');
      dn.g = 580;
      G.shots.push(dn);
    }
    capArr(G.shots, 96);
    audio.shoot();
    if (lv >= 1) audio.missile();
    emit(3, {
      x: x, y: y, j: 3,
      vx0: 50, vx1: 140, vy0: -28, vy1: 28,
      r0: 1.2, r1: 2.6, life: 0.16, rgb: CYN, g: 0
    });
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombs <= 0 || G.bombT > 0) {
      if (G.bombs <= 0) toast('爆弹用尽', true, false);
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.42;
    G.bombFlash = 0.55;
    G.invuln = Math.max(G.invuln, 0.42);
    audio.bomb();
    hitStop(0.078);
    kick(7.2);
    screenFlash(TEAL, 0.64);
    popSpark(G.px, G.py, GOLD, 52);
    rings.push({ x: G.px, y: G.py, t: 0, rgb: CYN, r: 90 });
    if (stageEl) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
      setTimeout(function () {
        if (stageEl) stageEl.classList.remove('bomb');
      }, 520);
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      if (s.dead) continue;
      s.dead = true;
      emit(3, {
        x: s.x, y: s.y, j: 4,
        vx0: -80, vx1: 80, vy0: -80, vy1: 80,
        r0: 1.2, r1: 2.8, life: 0.22, rgb: GOLD, g: 0
      });
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      hurtEnt(e, e.type === 'boss' ? 16 : 8, e.x, e.y, false);
    }
    syncHud();
  }

  function weakPoints(e) {
    const pts = [];
    if (e.type !== 'boss') return pts;
    const k = e.kind;
    if (k === 'fossil') pts.push({ x: e.x - 52, y: e.y - 10, r: 14 });
    else if (k === 'lantern') {
      if (e.phase < 2) {
        const lx = e.x - 38 + Math.sin(e.t * 2.4) * 26;
        const ly = e.y - 48 + Math.cos(e.t * 1.8) * 8;
        pts.push({ x: lx, y: ly, r: 13 });
      } else {
        pts.push({ x: e.x - 44, y: e.y + 4, r: 16 });
      }
    } else if (k === 'whale') {
      if (e.phase < 2) pts.push({ x: e.x - 86, y: e.y - 8, r: 16 });
      else pts.push({ x: e.x - 108, y: e.y + 6, r: 20 });
    }
    return pts;
  }

  function bodyHit(e, x, y, r) {
    if (e.type === 'spine' && e.segs) {
      for (let i = 0; i < e.segs.length; i++) {
        const s = e.segs[i];
        if (hypot(x - s.x, y - s.y) < 9 + r) return true;
      }
      return false;
    }
    if (e.type === 'boss') {
      const k = e.kind;
      let bw = 88;
      let bh = 36;
      if (k === 'lantern') { bw = 62; bh = 44; }
      else if (k === 'whale') { bw = 168; bh = 48; }
      return Math.abs(x - e.x) < bw + r && Math.abs(y - e.y) < bh + r;
    }
    const hw = (e.w || 16) * 0.5 + r;
    const hh = (e.h || 12) * 0.5 + r;
    return Math.abs(x - e.x) < hw && Math.abs(y - e.y) < hh;
  }

  function explodeEnt(e, big) {
    const rgb = e.type === 'boss' ? SUN : e.type === 'turret' ? GOLD : CYN;
    emit(big ? 28 : 12, {
      x: e.x, y: e.y, j: big ? 22 : 8,
      vx0: -160, vx1: 160, vy0: -180, vy1: 140,
      r0: 1.6, r1: big ? 6 : 3.4, life: big ? 0.7 : 0.38, rgb: rgb, g: 280
    });
    popSpark(e.x, e.y, rgb, big ? 42 : 16);
    if (e.type === 'spine' && e.segs) {
      for (let i = 0; i < e.segs.length; i++) {
        emit(4, {
          x: e.segs[i].x, y: e.segs[i].y, j: 4,
          vx0: -90, vx1: 90, vy0: -90, vy1: 90,
          r0: 1.2, r1: 2.8, life: 0.3, rgb: BONE, g: 200
        });
      }
    }
  }

  function killEnt(e, weak) {
    if (e.dead) return;
    e.dead = true;
    const big = e.type === 'boss';
    explodeEnt(e, big);
    audio.boom(big);
    bumpCombo();
    const pts = Math.round(e.score * G.mult);
    addScore(pts);
    floatText(e.x, e.y - 8, String(pts), weak ? GOLD : WHT, weak || big);
    hitStop(big ? 0.09 : weak ? 0.052 : 0.038);
    kick(big ? 7.4 : weak ? 3.2 : 1.6);
    if (e.type === 'carrier' && e.drop) {
      e.drop = false;
      spawnPow(e.x, e.y);
    } else if (e.type === 'manta' && Math.random() < 0.35) {
      spawnPow(e.x, e.y);
    }
    if (big) onBossDown(e);
  }

  function hurtEnt(e, dmg, hx, hy, weak) {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitT = 0.08;
    if (weak) e.weakFlash = 0.18;
    audio.hit(G.combo);
    emit(weak ? 8 : 4, {
      x: hx, y: hy, j: 5,
      vx0: -70, vx1: 110, vy0: -90, vy1: 70,
      r0: 1.2, r1: 3.2, life: 0.22, rgb: weak ? GOLD : CYN, g: 0
    });
    if (weak) {
      audio.weak();
      bumpCombo();
      addScore(Math.round(SCORE.weak * G.mult));
      floatText(hx, hy - 10, '弱点', GOLD, true);
      hitStop(0.052);
      kick(2.8);
      screenFlash(GOLD, 0.16);
    } else {
      hitStop(e.type === 'boss' ? 0.036 : 0.03);
    }
    if (e.hp <= 0) killEnt(e, weak);
  }

  function onBossDown(e) {
    G.bossIn = false;
    screenFlash(GOLD, 0.5);
    addScore(Math.round(SCORE.clear * G.mult));
    toast(e.name + ' 击坠', false, true);
    G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
    if (G.stage >= STAGES.length - 1) {
      addScore(SCORE.all);
      G.winT = 1.65;
    } else {
      G.stage += 1;
      G.stageT = 0;
      G.waveI = 0;
      audio.stage();
      const st = stageOf();
      toast('转入 · ' + st.name, false, true);
    }
    syncHud();
  }

  function hurtPlayer(why, hx, hy) {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.why = why;
    diePlayer(hx, hy);
  }

  function diePlayer(hx, hy) {
    G.lives -= 1;
    G.deadT = 0.92;
    G.fireHold = false;
    G.wpnLv = Math.max(0, G.wpnLv - 1);
    audio.death();
    hitStop(0.075);
    kick(7.6);
    screenFlash(MAG, 0.55);
    emit(32, {
      x: hx == null ? G.px : hx, y: hy == null ? G.py : hy, j: 16,
      vx0: -200, vx1: 200, vy0: -220, vy1: 160,
      r0: 1.8, r1: 6, life: 0.62, rgb: MAG, g: 260
    });
    popSpark(G.px, G.py, MAG, 36);
    for (let i = 0; i < G.eShots.length; i++) G.eShots[i].dead = true;
    syncHud();
  }

  function respawn() {
    G.px = 110;
    G.py = VH * 0.5;
    G.invuln = 1.55;
    G.deadT = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    for (let i = 0; i < G.eShots.length; i++) G.eShots[i].dead = true;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay(
      'lose',
      '银鹰坠了',
      '三命打尽。撞机或中弹即失一命。R 立刻重开同一模式。'
    );
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    audio.win();
    const tag = isCore() ? '流核' : '大流2';
    showOverlay(
      'win',
      '星路尽破',
      tag + ' 打穿土环巨物。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '') + '。'
    );
    syncHud();
  }

  function collectPow(p) {
    if (p.dead) return;
    p.dead = true;
    audio.pow();
    popSpark(p.x, p.y, p.kind === 'bomb' ? TEAL : GOLD, 18);
    bumpCombo();
    if (p.kind === 'bomb') {
      if (G.bombs >= BOMB_CAP) addScore(Math.round(300 * G.mult));
      else G.bombs += 1;
      toast('爆 +1', false, true);
    } else {
      if (G.wpnLv >= WPN_MAX) addScore(Math.round(400 * G.mult));
      else {
        G.wpnLv += 1;
        flashWpn();
        toast(G.wpnLv >= WPN_MAX ? '七向解锁 · 后射' : '火力上升', false, true);
      }
    }
    hitStop(0.04);
    kick(1.8);
    syncHud();
  }

  function updateFx(dt) {
    if (G.stop > 0) {
      G.stop -= dt;
      if (G.stop < 0) G.stop = 0;
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.6);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.bombT > 0) G.bombT = Math.max(0, G.bombT - dt);
    if (G.bombFlash > 0) G.bombFlash = Math.max(0, G.bombFlash - dt);
    if (G.fireCd > 0) G.fireCd = Math.max(0, G.fireCd - dt);
    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
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
      f.y += f.vy * dt;
      f.vy *= 0.96;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      stars[i].x -= stars[i].v * dt;
      if (stars[i].x < -4) stars[i].x = VW + 4;
    }
    for (let i = 0; i < motes.length; i++) {
      motes[i].x -= motes[i].v * dt;
      if (motes[i].x < -8) motes[i].x = VW + 8;
    }
    for (let i = 0; i < hills.length; i++) {
      hills[i].x -= 46 * dt;
      if (hills[i].x < -hills[i].w) hills[i].x += 14 * 90;
    }
  }

  function updateMove(dt) {
    if (G.deadT > 0) return;
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      dx = pointer.x - G.px;
      dy = pointer.y - G.py;
      const d = hypot(dx, dy);
      const max = plySpd() * dt;
      if (d > max && d > 0.001) {
        dx = dx / d * max;
        dy = dy / d * max;
      }
    } else {
      const v = moveVec(keys.l, keys.r, keys.u, keys.d);
      dx = v.x * plySpd() * dt;
      dy = v.y * plySpd() * dt;
    }
    dx += G.pullX * dt;
    dy += G.pullY * dt;
    G.px = clamp(G.px + dx, 28, VW - 28);
    G.py = clamp(G.py + dy, 20, VH - 20);
    G.pullX *= 0.86;
    G.pullY *= 0.86;
  }

  function fireBoss(e) {
    const core = isCore();
    const spd = (core ? 1.22 : 1) * (e.phase >= 2 ? 1.18 : 1);
    const k = e.kind;
    if (k === 'fossil') {
      const n = e.phase >= 2 ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i - (n - 1) / 2) * 0.28;
        G.eShots.push(makeEShot(e.x - 70, e.y, Math.cos(a) * 210 * spd, Math.sin(a) * 210 * spd, 4, BONE));
      }
      if (e.phase >= 2) {
        G.eShots.push(aimShot(e.x - 20, e.y - 18, G.px, G.py, 190 * spd, 4.4, SUN));
        G.eShots.push(aimShot(e.x - 20, e.y + 18, G.px, G.py, 190 * spd, 4.4, SUN));
      }
    } else if (k === 'lantern') {
      const pts = weakPoints(e);
      if (pts[0] && e.phase < 2) {
        G.eShots.push(aimShot(pts[0].x, pts[0].y, G.px, G.py, 175 * spd, 4.2, GOLD));
      }
      const n = e.phase >= 2 ? 6 : 4;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i - (n - 1) / 2) * 0.22;
        G.eShots.push(makeEShot(e.x - 50, e.y + 6, Math.cos(a) * 200 * spd, Math.sin(a) * 200 * spd, 3.8, MAG));
      }
      if (e.phase >= 2) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU + e.t;
          G.eShots.push(makeEShot(e.x, e.y, Math.cos(a) * 80, Math.sin(a) * 80, 3.2, TEAL));
        }
      }
    } else if (k === 'whale') {
      const n = e.phase >= 2 ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const a = Math.PI + (i - (n - 1) / 2) * 0.18;
        G.eShots.push(makeEShot(e.x - 120, e.y + 8, Math.cos(a) * 220 * spd, Math.sin(a) * 220 * spd, 4.6, ICE));
      }
      G.eShots.push(makeEShot(e.x - 40, e.y - 36, -160 * spd, -40, 5.2, SUN));
      G.eShots.push(makeEShot(e.x - 40, e.y + 36, -160 * spd, 40, 5.2, SUN));
      if (e.phase >= 2) {
        G.eShots.push(makeEShot(VW * 0.4, 8, 0, 150 * spd, 4.8, MAG));
        G.eShots.push(makeEShot(VW * 0.55, VH - 8, 0, -150 * spd, 4.8, MAG));
        G.eShots.push(aimShot(e.x - 80, e.y, G.px, G.py, 200 * spd, 5, GOLD));
      }
    }
    capArr(G.eShots, 140);
  }

  function updateBoss(e, dt) {
    e.t += dt;
    if (e.x > e.park) e.x += e.vx * dt;
    else {
      e.x = e.park + Math.sin(e.t * 0.7) * (e.kind === 'whale' ? 10 : 16);
      e.y = VH * 0.5 + Math.sin(e.t * 0.85) * (e.kind === 'whale' ? 28 : 42);
    }
    if (e.hp < e.maxhp * 0.5 && e.phase < 2) {
      e.phase = 2;
      toast(e.name + ' 狂暴', true, false);
      screenFlash(MAG, 0.22);
      kick(4);
    }
    e.cd -= dt;
    const rate = (isCore() ? 0.72 : 0.9) * (e.phase >= 2 ? 0.72 : 1);
    if (e.cd <= 0) {
      e.cd = rate;
      fireBoss(e);
    }
    if (e.kind === 'whale') {
      e.open = 0.5 + Math.sin(e.t * 1.6) * 0.5;
      if (e.open > 0.72 && G.deadT <= 0) {
        const dx = (e.x - 90) - G.px;
        const dy = e.y - G.py;
        const d = hypot(dx, dy) || 1;
        if (d < 420) {
          G.pullX += (dx / d) * 210 * dt * e.open;
          G.pullY += (dy / d) * 160 * dt * e.open;
        }
      }
    }
    if (e.hitT > 0) e.hitT -= dt;
    if (e.weakFlash > 0) e.weakFlash -= dt;
  }

  function maybeShoot(e, cd, fn, dt) {
    if (e.x > VW - 20 || e.x < 40) return;
    e.cd -= dt || STEP;
    if (e.cd > 0) return;
    e.cd = cd * (isCore() ? 0.78 : 1);
    fn();
    capArr(G.eShots, 140);
  }

  function updateEnts(dt) {
    G.pullX = 0;
    G.pullY = 0;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.dead) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.hitT > 0) e.hitT -= dt;
      if (e.type === 'boss') {
        updateBoss(e, dt);
        continue;
      }
      if (e.type === 'dart') {
        e.x += e.vx * dt;
        e.bob += dt * 3.6;
        e.y = e.baseY + Math.sin(e.bob) * e.amp;
        maybeShoot(e, isCore() ? 1.45 : 2.35, function () {
          G.eShots.push(aimShot(e.x - 6, e.y, G.px, G.py, isCore() ? 170 : 150, 3.2, HOT));
        }, dt);
      } else if (e.type === 'orb') {
        e.cx += e.vx * dt;
        e.ang += e.spin * dt;
        e.x = e.cx + Math.cos(e.ang) * e.rad;
        e.y = e.cy + Math.sin(e.ang) * e.rad;
      } else if (e.type === 'spike') {
        if (e.phase === 0) {
          e.y += e.vy * dt;
          e.x += e.vx * 0.25 * dt;
          if (e.y >= G.py - 8 || e.y > VH * 0.72) {
            e.phase = 1;
            const d = hypot(G.px - e.x, G.py - e.y) || 1;
            e.vx = (G.px - e.x) / d * (isCore() ? 240 : 190);
            e.vy = (G.py - e.y) / d * (isCore() ? 240 : 190);
          }
        } else {
          e.x += e.vx * dt;
          e.y += e.vy * dt;
        }
      } else if (e.type === 'turret') {
        e.x += e.vx * dt;
        e.y = VH - 22;
        maybeShoot(e, 1.05, function () {
          G.eShots.push(aimShot(e.x, e.y - 8, G.px, G.py, isCore() ? 200 : 160, 3.8, SUN));
          e.flash = 0.12;
        }, dt);
        if (e.flash > 0) e.flash -= dt;
      } else if (e.type === 'manta') {
        e.x += e.vx * dt;
        e.bob += dt * 2.2;
        e.y = e.baseY + Math.sin(e.bob) * e.amp;
        maybeShoot(e, 1.15, function () {
          for (let k = -1; k <= 1; k++) {
            G.eShots.push(makeEShot(e.x - 14, e.y, -180, k * 70, 3.6, MAG));
          }
        }, dt);
      } else if (e.type === 'carrier') {
        e.x += e.vx * dt;
        e.bob += dt;
        e.y = e.baseY + Math.sin(e.bob * 1.4) * 16;
        if (e.drop && e.x < VW * 0.62) {
          e.drop = false;
          spawnPow(e.x, e.y);
        }
      } else if (e.type === 'spine') {
        e.bob += dt * 2.6;
        e.x += e.vx * dt;
        e.y = e.baseY + Math.sin(e.bob) * 36;
        e.segs[0].x = e.x;
        e.segs[0].y = e.y;
        for (let s = 1; s < e.segs.length; s++) {
          const p = e.segs[s - 1];
          const c = e.segs[s];
          const dx = p.x - c.x;
          const dy = p.y - c.y;
          const d = hypot(dx, dy) || 1;
          const want = 13;
          c.x = p.x - dx / d * want;
          c.y = p.y - dy / d * want;
        }
      } else if (e.type === 'dive') {
        e.dash -= dt;
        if (e.dash <= 0 && Math.abs(e.y - G.py) < 40) {
          e.vx = isCore() ? -280 : -220;
          e.dash = 9;
        }
        e.x += e.vx * dt;
        if (e.y < G.py) e.y += 40 * dt;
        else e.y -= 40 * dt;
      }
      if (e.x < -70 || e.y > VH + 50 || e.y < -50) e.dead = true;
    }
  }

  function shotHitsWeak(e, s) {
    const pts = weakPoints(e);
    for (let i = 0; i < pts.length; i++) {
      if (hypot(s.x - pts[i].x, s.y - pts[i].y) < pts[i].r + s.r) return true;
    }
    return false;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.dead) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.g) s.vy += s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < -30 || s.x > VW + 40 || s.y < -24 || s.y > VH + 24) {
        s.dead = true;
        continue;
      }
      for (let j = 0; j < G.ents.length; j++) {
        const e = G.ents[j];
        if (e.dead) continue;
        if (e.type === 'boss') {
          const weak = shotHitsWeak(e, s);
          if (weak || bodyHit(e, s.x, s.y, s.r)) {
            s.dead = true;
            const dmg = weak ? s.dmg : s.dmg * 0.38;
            hurtEnt(e, dmg, s.x, s.y, weak);
            break;
          }
        } else if (bodyHit(e, s.x, s.y, s.r)) {
          s.dead = true;
          hurtEnt(e, s.dmg, s.x, s.y, false);
          break;
        }
      }
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      if (s.dead) {
        G.eShots.splice(i, 1);
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < -20 || s.x > VW + 30 || s.y < -20 || s.y > VH + 20) {
        s.dead = true;
        continue;
      }
      if (G.deadT <= 0 && hypot(s.x - G.px, s.y - G.py) < s.r + 6.4) {
        s.dead = true;
        hurtPlayer('shot', s.x, s.y);
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      if (p.dead) {
        G.pows.splice(i, 1);
        continue;
      }
      p.bob += dt * 3;
      p.x += p.vx * dt;
      p.y += p.vy * dt + Math.sin(p.bob) * 10 * dt;
      if (p.y < 18) { p.y = 18; p.vy = Math.abs(p.vy); }
      if (p.y > VH - 18) { p.y = VH - 18; p.vy = -Math.abs(p.vy); }
      if (p.x < -20) p.dead = true;
      if (G.deadT <= 0 && hypot(p.x - G.px, p.y - G.py) < 22) collectPow(p);
    }
  }

  function maybeSpawn() {
    const st = stageOf();
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      spawnWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function update(dt) {
    updateFx(dt);
    if (G.mode !== 'play') {
      G.t += dt;
      G.scroll += 28 * dt;
      if (G.ents.length && G.ents[0].type === 'boss') {
        const e = G.ents[0];
        e.t += dt;
        e.y = VH * 0.52 + Math.sin(e.t * 0.7) * 16;
      }
      return;
    }
    if (G.stop > 0) return;
    G.t += dt;
    G.scroll += scrollSpd() * dt;
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        respawn();
      }
    }
    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) {
        goWin();
        return;
      }
    }
    G.stageT += dt;
    updateMove(dt);
    if (G.fireHold && G.deadT <= 0) fire();
    if (!REDUCE && G.deadT <= 0 && ((G.t * 22) | 0) !== (((G.t - dt) * 22) | 0)) {
      emit(1, {
        x: G.px - 14, y: G.py, j: 2.2,
        vx0: -90, vx1: -24, vy0: -14, vy1: 14,
        r0: 1.1, r1: 2.4, life: 0.2, rgb: CYN, g: 0
      });
    }
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
    if (G.deadT <= 0) {
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.dead) continue;
        if (bodyHit(e, G.px, G.py, 7)) {
          hurtPlayer('crash', G.px, G.py);
          if (e.type !== 'boss' && !e.dead) killEnt(e, false);
        }
      }
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else comboEl.hidden = true;
    }
  }

  function drawSpace() {
    const c = ctx;
    const st = stageOf();
    const rgb = hueRgb(st.hue, 0.55, 0.12);
    const top = hueRgb((st.hue + 40) % 360, 0.35, 0.08);
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, rgba(top, 1));
    g.addColorStop(0.55, rgba(rgb, 1));
    g.addColorStop(1, rgba(DEEP, 1));
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (G.stage === 0) {
      const sun = c.createRadialGradient(sx(VW * 0.82), sy(VH * 0.5), 10 * scale, sx(VW * 0.82), sy(VH * 0.5), 220 * scale);
      sun.addColorStop(0, rgba(GOLD, 0.55));
      sun.addColorStop(0.35, rgba(SUN, 0.28));
      sun.addColorStop(1, rgba(SUN, 0));
      c.fillStyle = sun;
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
      c.strokeStyle = rgba(SUN, 0.18 + Math.sin(G.t * 1.4) * 0.06);
      c.lineWidth = 1.4 * scale;
      for (let i = 0; i < 5; i++) {
        const a = G.t * 0.3 + i * 0.7;
        c.beginPath();
        c.moveTo(sx(VW * 0.72), sy(VH * 0.5 + Math.sin(a) * 40));
        c.quadraticCurveTo(
          sx(VW * 0.5), sy(VH * 0.5 + Math.sin(a + 1) * 80),
          sx(VW * 0.18), sy(VH * 0.2 + i * 40)
        );
        c.stroke();
      }
    } else if (G.stage === 2) {
      c.fillStyle = rgba(ICE, 0.08);
      c.fillRect(sx(0), sy(VH * 0.42), VW * scale, 28 * scale);
      c.strokeStyle = rgba(CYN, 0.16);
      c.lineWidth = 1.2 * scale;
      c.beginPath();
      c.ellipse(sx(VW * 0.88), sy(VH * 0.78), 90 * scale, 28 * scale, -0.2, 0, TAU);
      c.stroke();
      c.fillStyle = rgba([40, 70, 90], 0.45);
      c.beginPath();
      c.ellipse(sx(VW * 0.88), sy(VH * 0.78), 54 * scale, 54 * scale, 0, 0, TAU);
      c.fill();
    }

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      c.fillStyle = rgba(WHT, s.a);
      c.fillRect(sx(s.x), sy(s.y), s.s * scale, s.s * scale);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      c.fillStyle = rgba(m.rgb, m.a);
      c.beginPath();
      c.arc(sx(m.x), sy(m.y), m.s * scale, 0, TAU);
      c.fill();
    }

    if (G.stage >= 1) {
      c.fillStyle = rgba(G.stage === 1 ? [28, 36, 40] : [24, 40, 52], 0.85);
      c.beginPath();
      c.moveTo(sx(0), sy(VH));
      for (let i = 0; i < hills.length; i++) {
        const h = hills[i];
        c.lineTo(sx(h.x), sy(VH - h.h));
        c.lineTo(sx(h.x + h.w * 0.5), sy(VH - h.h - 6));
        c.lineTo(sx(h.x + h.w), sy(VH - 4));
      }
      c.lineTo(sx(VW), sy(VH));
      c.closePath();
      c.fill();
    }

    c.fillStyle = rgba(CYN, 0.1);
    c.fillRect(sx(VW / 3 - 1), sy(0), 2 * scale, VH * scale);
    c.fillRect(sx(VW * 2 / 3 - 1), sy(0), 2 * scale, VH * scale);
    c.strokeStyle = rgba(CYN, 0.16);
    c.lineWidth = 1;
    c.strokeRect(sx(0.5), sy(0.5), VW * scale - 1, VH * scale - 1);
  }

  function drawHawk() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    const c = ctx;
    const x = G.px;
    const y = G.py;
    c.save();
    c.translate(sx(x), sy(y));
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.ellipse(18 * scale, 0, 11 * scale, 3.2 * scale, 0, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(CYN, 0.7);
    c.beginPath();
    c.ellipse(-15 * scale, -3 * scale, 8 * scale, 2.4 * scale, 0, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(-15 * scale, 3 * scale, 8 * scale, 2.4 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.96);
    c.beginPath();
    c.moveTo(17 * scale, 0);
    c.lineTo(-4 * scale, -6.5 * scale);
    c.lineTo(-11 * scale, 0);
    c.lineTo(-4 * scale, 6.5 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(HOT, 0.95);
    c.beginPath();
    c.moveTo(2 * scale, -2 * scale);
    c.lineTo(-14 * scale, -11 * scale);
    c.lineTo(-5 * scale, -1 * scale);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(2 * scale, 2 * scale);
    c.lineTo(-14 * scale, 11 * scale);
    c.lineTo(-5 * scale, 1 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(TEAL, 0.95);
    c.fillRect(-1 * scale, -2.2 * scale, 10 * scale, 4.4 * scale);
    if (G.wpnLv >= WPN_MAX) {
      c.strokeStyle = rgba(GOLD, 0.7);
      c.lineWidth = 1.2 * scale;
      c.beginPath();
      c.arc(0, 0, 11 * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  function drawWeak(e) {
    const pts = weakPoints(e);
    const c = ctx;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const pulse = 1 + Math.sin(G.t * 9) * 0.18;
      c.fillStyle = rgba(GOLD, 0.22 + (e.weakFlash || 0) * 1.4);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * pulse * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.9);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * 0.55 * scale, 0, TAU);
      c.stroke();
      c.fillStyle = rgba(WHT, 0.85);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), 2.2 * scale, 0, TAU);
      c.fill();
    }
  }

  function flashCol(base, e) {
    return e.hitT > 0 ? WHT : base;
  }

  function drawDart(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(HOT, e), 0.95);
    c.beginPath();
    c.moveTo(-10 * scale, 0);
    c.lineTo(8 * scale, -5 * scale);
    c.lineTo(4 * scale, 0);
    c.lineTo(8 * scale, 5 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(TEAL, 0.8);
    c.fillRect(-2 * scale, -1.6 * scale, 6 * scale, 3.2 * scale);
    c.restore();
  }

  function drawOrb(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.strokeStyle = rgba(MAG, 0.55);
    c.lineWidth = 1.2 * scale;
    c.beginPath();
    c.arc(0, 0, 8 * scale, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(flashCol(PNK, e), 0.92);
    c.beginPath();
    c.arc(0, 0, 5 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawSpike(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(SUN, e), 0.95);
    c.beginPath();
    c.moveTo(0, 10 * scale);
    c.lineTo(-6 * scale, -8 * scale);
    c.lineTo(6 * scale, -8 * scale);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawTurret(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol([80, 90, 100], e), 0.95);
    c.fillRect(-10 * scale, 0, 20 * scale, 10 * scale);
    c.fillStyle = rgba(flashCol(SUN, e), e.flash > 0 ? 1 : 0.9);
    c.beginPath();
    c.arc(0, 0, 8 * scale, Math.PI, 0);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.8);
    c.fillRect(-2 * scale, -10 * scale, 4 * scale, 10 * scale);
    c.restore();
  }

  function drawManta(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(MAG, e), 0.92);
    c.beginPath();
    c.moveTo(16 * scale, 0);
    c.lineTo(-6 * scale, -14 * scale);
    c.lineTo(-14 * scale, 0);
    c.lineTo(-6 * scale, 14 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.7);
    c.beginPath();
    c.arc(-2 * scale, 0, 3 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawCarrier(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(BONE, e), 0.92);
    c.fillRect(-16 * scale, -8 * scale, 32 * scale, 16 * scale);
    c.fillStyle = rgba(GOLD, 0.85);
    c.fillRect(-6 * scale, -4 * scale, 10 * scale, 8 * scale);
    c.fillStyle = rgba(CYN, 0.7);
    c.fillRect(-18 * scale, -3 * scale, 6 * scale, 6 * scale);
    c.restore();
  }

  function drawSpine(e) {
    const c = ctx;
    for (let i = e.segs.length - 1; i >= 0; i--) {
      const s = e.segs[i];
      c.fillStyle = rgba(flashCol(BONE, e), 0.55 + (1 - i / e.segs.length) * 0.4);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y), (7 - i * 0.25) * scale, 5 * scale, 0, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(RED, 0.9);
    c.beginPath();
    c.arc(sx(e.x - 4), sy(e.y - 2), 2.2 * scale, 0, TAU);
    c.fill();
  }

  function drawDive(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(flashCol(TEAL, e), 0.95);
    c.beginPath();
    c.moveTo(-10 * scale, 0);
    c.lineTo(9 * scale, -4 * scale);
    c.lineTo(9 * scale, 4 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(SUN, 0.7);
    c.fillRect(6 * scale, -1.5 * scale, 8 * scale, 3 * scale);
    c.restore();
  }

  function drawBossFossil(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    const col = flashCol(BONE, e);
    c.fillStyle = rgba(col, 0.2);
    c.beginPath();
    c.ellipse(-10 * scale, 0, 100 * scale, 42 * scale, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(col, 0.95);
    c.lineWidth = 2.2 * scale;
    for (let i = 0; i < 6; i++) {
      const rx = (-20 + i * 16) * scale;
      c.beginPath();
      c.moveTo(rx, -28 * scale);
      c.quadraticCurveTo(rx + 8 * scale, 0, rx, 28 * scale);
      c.stroke();
    }
    c.fillStyle = rgba(col, 0.92);
    c.beginPath();
    c.ellipse(-48 * scale, -4 * scale, 32 * scale, 22 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.9);
    c.beginPath();
    c.ellipse(-58 * scale, -10 * scale, 10 * scale, 8 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(SUN, 0.85);
    c.beginPath();
    c.moveTo(-78 * scale, 6 * scale);
    c.lineTo(-108 * scale, 2 * scale);
    c.lineTo(-78 * scale, 16 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(col, 0.8);
    c.beginPath();
    c.moveTo(70 * scale, 0);
    c.lineTo(108 * scale, -18 * scale);
    c.lineTo(96 * scale, 0);
    c.lineTo(108 * scale, 18 * scale);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawBossLantern(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    const col = flashCol([48, 90, 110], e);
    const pts = weakPoints(e);
    if (e.phase < 2 && pts[0]) {
      const lx = (pts[0].x - e.x) * scale;
      const ly = (pts[0].y - e.y) * scale;
      c.strokeStyle = rgba(GOLD, 0.7);
      c.lineWidth = 1.6 * scale;
      c.beginPath();
      c.moveTo(-18 * scale, -22 * scale);
      c.lineTo(lx, ly);
      c.stroke();
    }
    c.fillStyle = rgba(col, 0.95);
    c.beginPath();
    c.ellipse(0, 4 * scale, 58 * scale, 40 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.85);
    c.beginPath();
    c.ellipse(-36 * scale, 8 * scale, 22 * scale, 14 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(MAG, 0.5);
    for (let i = 0; i < 5; i++) {
      c.fillRect((-48 + i * 5) * scale, (2 + (i % 2) * 6) * scale, 4 * scale, 10 * scale);
    }
    c.fillStyle = rgba(TEAL, 0.8);
    c.beginPath();
    c.moveTo(40 * scale, -8 * scale);
    c.lineTo(70 * scale, 4 * scale);
    c.lineTo(40 * scale, 16 * scale);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawBossWhale(e) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    const col = flashCol([70, 110, 130], e);
    c.fillStyle = rgba(col, 0.96);
    c.beginPath();
    c.ellipse(-20 * scale, 0, 170 * scale, 52 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba([30, 50, 64], 0.7);
    c.beginPath();
    c.ellipse(-20 * scale, 18 * scale, 140 * scale, 22 * scale, 0, 0, TAU);
    c.fill();
    const open = 8 + e.open * 16;
    c.fillStyle = rgba(RED, 0.75);
    c.beginPath();
    c.ellipse(-118 * scale, 8 * scale, 28 * scale, open * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(col, 0.9);
    c.beginPath();
    c.moveTo(120 * scale, -8 * scale);
    c.lineTo(175 * scale, -36 * scale);
    c.lineTo(148 * scale, 0);
    c.lineTo(175 * scale, 36 * scale);
    c.lineTo(120 * scale, 10 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(ICE, 0.8);
    c.beginPath();
    c.moveTo(-10 * scale, -48 * scale);
    c.lineTo(30 * scale, -78 * scale);
    c.lineTo(18 * scale, -40 * scale);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawBoss(e) {
    if (e.kind === 'fossil') drawBossFossil(e);
    else if (e.kind === 'lantern') drawBossLantern(e);
    else drawBossWhale(e);
    drawWeak(e);
  }

  function drawEnt(e) {
    if (e.type === 'dart') drawDart(e);
    else if (e.type === 'orb') drawOrb(e);
    else if (e.type === 'spike') drawSpike(e);
    else if (e.type === 'turret') drawTurret(e);
    else if (e.type === 'manta') drawManta(e);
    else if (e.type === 'carrier') drawCarrier(e);
    else if (e.type === 'spine') drawSpine(e);
    else if (e.type === 'dive') drawDive(e);
    else if (e.type === 'boss') drawBoss(e);
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.dead) continue;
      if (s.kind === 'mis') {
        c.fillStyle = rgba(GOLD, 0.95);
        c.beginPath();
        c.ellipse(sx(s.x), sy(s.y), 3.4 * scale, 5.2 * scale, 0, 0, TAU);
        c.fill();
        if (!REDUCE) {
          c.fillStyle = rgba(SUN, 0.35);
          c.fillRect(sx(s.x - 2), sy(s.y - s.vy * 0.02), 4 * scale, 8 * scale);
        }
      } else {
        const rear = s.vx < 0;
        c.fillStyle = rgba(rear ? GOLD : CYN, 0.95);
        c.beginPath();
        c.ellipse(sx(s.x), sy(s.y), (rear ? 5 : 6.5) * scale, 2.1 * scale, 0, 0, TAU);
        c.fill();
        if (!REDUCE) {
          c.fillStyle = rgba(WHT, 0.28);
          c.fillRect(sx(s.x - (rear ? 0 : 8)), sy(s.y - 1), 8 * scale, 2 * scale);
        }
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      if (s.dead) continue;
      c.fillStyle = rgba(s.rgb, 0.95);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.45);
      c.beginPath();
      c.arc(sx(s.x - 0.8), sy(s.y - 0.8), s.r * 0.35 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawPows() {
    const c = ctx;
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      if (p.dead) continue;
      const rgb = p.kind === 'bomb' ? TEAL : GOLD;
      c.save();
      c.translate(sx(p.x), sy(p.y));
      c.rotate(p.bob * 0.4);
      c.fillStyle = rgba(rgb, 0.25);
      c.beginPath();
      c.arc(0, 0, 14 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(rgb, 0.92);
      c.beginPath();
      c.moveTo(0, -9 * scale);
      c.lineTo(9 * scale, 0);
      c.lineTo(0, 9 * scale);
      c.lineTo(-9 * scale, 0);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.font = 'bold ' + Math.max(9, 10 * scale) + 'px sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(p.kind === 'bomb' ? '爆' : '火', 0, 0.5 * scale);
      c.restore();
    }
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * a * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = 1.6 * scale;
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (s.rad + s.t * 90) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, a * 0.7);
      c.lineWidth = 2.4 * scale;
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + r.t * 160) * scale, 0, TAU);
      c.stroke();
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.fillStyle = rgba(f.rgb, a);
      c.font = 'bold ' + Math.max(11, f.size * scale) + 'px sans-serif';
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && !G.ents[i].dead) {
        boss = G.ents[i];
        break;
      }
    }
    if (!boss || G.mode !== 'play') return;
    const c = ctx;
    const x = VW * 0.22;
    const y = 12;
    const w = VW * 0.56;
    c.fillStyle = rgba(DEEP, 0.55);
    c.fillRect(sx(x), sy(y), w * scale, 8 * scale);
    c.fillStyle = rgba(boss.hp < boss.maxhp * 0.5 ? MAG : GOLD, 0.9);
    c.fillRect(sx(x), sy(y), w * (boss.hp / boss.maxhp) * scale, 8 * scale);
    c.strokeStyle = rgba(WHT, 0.35);
    c.lineWidth = 1;
    c.strokeRect(sx(x), sy(y), w * scale, 8 * scale);
  }

  function drawScreens() {
    const c = ctx;
    c.fillStyle = rgba(WHT, 0.22);
    c.font = Math.max(9, 10 * scale) + 'px sans-serif';
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText('L', sx(8), sy(4));
    c.textAlign = 'center';
    c.fillText('C', sx(VW * 0.5), sy(4));
    c.textAlign = 'right';
    c.fillText('R', sx(VW - 8), sy(4));
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#040c14';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    let kx = 0;
    let ky = 0;
    if (G.shake > 0 && !REDUCE) {
      kx = (Math.random() - 0.5) * G.shake * 1.4;
      ky = (Math.random() - 0.5) * G.shake * 1.1;
    }
    ctx.translate(kx, ky);
    if (G.punch > 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawSpace();
    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawPows();
    drawShots();
    drawHawk();
    drawFx();
    drawBossBar();
    drawScreens();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.bombFlash > 0) {
      ctx.strokeStyle = rgba(TEAL, G.bombFlash);
      ctx.lineWidth = 6 * scale;
      ctx.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
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

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'raid';
    G.mode = 'play';
    G.t = 0;
    G.stage = 0;
    G.stageT = 0;
    G.waveI = 0;
    G.scroll = 0;
    G.px = 120;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.wpnLv = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.winT = 0;
    G.nextLife = LIFE_EVERY;
    G.dropI = 0;
    G.why = '';
    G.bossIn = false;
    G.pullX = 0;
    G.pullY = 0;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedDecor();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '流核 · 更密更快' : '大流2 · 日冕', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 2;
    G.lives = LIVES;
    G.bombs = 3;
    G.wpnLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bossIn = false;
    G.px = 120;
    G.py = VH * 0.5;
    clearField();
    seedDecor();
    G.ents.push(makeBoss('whale', '巨物', 132));
    G.ents[0].x = VW - 220;
    G.ents[0].y = VH * 0.52;
    G.ents[0].open = 0.4;
    showOverlay(
      'title',
      '大流2',
      '三屏横卷。银鹰七向齐射，打巨鱼舰发光弱点。短关之后出鱼舰。撞机或中弹即失一命。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isCore()) goTitle();
      else startGame('core');
    }
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (e.target && (e.target.id === 'btn-mute' || e.target.tagName === 'INPUT')) return;
    const isBomb = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'Left' || k === 'Right' || k === 'Up' || k === 'Down';
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
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    if (acc > STEP * 4) acc = 0;
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

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
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
      startGame(G.kind);
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && !isCore()) startGame('core');
      else goTitle();
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
