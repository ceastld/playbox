'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const BOMB_CAP = 6;
  const WPN_MAX = 3;
  const BEST_KEY = 'playbox-cotton-best';
  const MUTE_KEY = 'playbox-cotton-mute';
  const OPS = '方向 / WASD 飞 · 空格射击蓄咒 · Shift / Z 爆弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 138];
  const PNK = [255, 77, 154];
  const HOT = [255, 138, 184];
  const GOLD = [255, 227, 107];
  const MINT = [94, 255, 212];
  const PUMP = [255, 154, 58];
  const WHT = [255, 240, 246];
  const DEEP = [28, 10, 20];
  const SKIN = [255, 184, 212];
  const WOOD = [196, 138, 74];
  const PURP = [176, 92, 255];

  const SCORE = {
    bat: 50,
    candy: 60,
    imp: 90,
    wisp: 70,
    toad: 110,
    wool: 140,
    pumpkin: 130,
    sprite: 100,
    cart: 300,
    turret: 150,
    boss: 4000,
    clear: 2000
  };

  const STAGES = [
    {
      id: 0, name: '糖林', boss: '糖蝠', bossKind: 'bat', bossHp: 86, hue: 328,
      waves: [
        { t: 0.5, kind: 'bats', n: 5, y: 0.34 },
        { t: 2.1, kind: 'candy', n: 3 },
        { t: 3.4, kind: 'bats', n: 6, y: 0.64 },
        { t: 4.8, kind: 'imps', n: 2 },
        { t: 6.2, kind: 'sprites', n: 3 },
        { t: 7.4, kind: 'dive', n: 4 },
        { t: 8.4, kind: 'wisps', n: 4, rain: true },
        { t: 8.8, kind: 'cart' },
        { t: 10.2, kind: 'bats', n: 7, y: 0.46 },
        { t: 11.4, kind: 'turrets', n: 2 },
        { t: 12.8, kind: 'imps', n: 3 },
        { t: 14.0, kind: 'candy', n: 4 },
        { t: 15.2, kind: 'bats', n: 6, y: 0.72, rain: true },
        { t: 16.2, kind: 'boss' }
      ]
    },
    {
      id: 1, name: '星沼', boss: '星蛤', bossKind: 'toad', bossHp: 108, hue: 268,
      waves: [
        { t: 0.45, kind: 'wisps', n: 5 },
        { t: 1.8, kind: 'toads', n: 2 },
        { t: 3.2, kind: 'bats', n: 6, y: 0.3 },
        { t: 4.6, kind: 'wool', n: 2 },
        { t: 5.8, kind: 'dive', n: 5 },
        { t: 7.0, kind: 'sprites', n: 3 },
        { t: 8.2, kind: 'cart' },
        { t: 8.8, kind: 'candy', n: 4, rain: true },
        { t: 9.6, kind: 'toads', n: 3 },
        { t: 11.0, kind: 'turrets', n: 2 },
        { t: 12.2, kind: 'wisps', n: 6 },
        { t: 13.6, kind: 'wool', n: 2 },
        { t: 14.8, kind: 'imps', n: 3, rain: true },
        { t: 16.4, kind: 'boss' }
      ]
    },
    {
      id: 2, name: '棉城', boss: '南瓜王', bossKind: 'king', bossHp: 148, hue: 18,
      waves: [
        { t: 0.4, kind: 'pumpkins', n: 3 },
        { t: 1.8, kind: 'imps', n: 3 },
        { t: 3.2, kind: 'bats', n: 7, y: 0.4 },
        { t: 4.6, kind: 'turrets', n: 3 },
        { t: 5.8, kind: 'sprites', n: 4 },
        { t: 7.0, kind: 'wool', n: 2 },
        { t: 8.2, kind: 'cart' },
        { t: 8.8, kind: 'dive', n: 6, rain: true },
        { t: 9.6, kind: 'pumpkins', n: 4 },
        { t: 11.0, kind: 'toads', n: 2 },
        { t: 12.2, kind: 'wisps', n: 5 },
        { t: 13.4, kind: 'imps', n: 3 },
        { t: 14.6, kind: 'candy', n: 5 },
        { t: 15.4, kind: 'pumpkins', n: 3, rain: true },
        { t: 16.8, kind: 'boss' }
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
  const btnRide = document.getElementById('btn-ride');
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
  const wpnLabel = document.getElementById('wpn-label');
  const bombLabel = document.getElementById('bomb-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chgWrap = document.getElementById('chg-wrap');
  const chgBar = document.getElementById('chg-bar');

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
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const motes = [];
  const trees = [];
  const pads = [];

  const G = {
    mode: 'title',
    kind: 'ride',
    t: 0,
    stage: 0,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    px: 90,
    py: VH * 0.5,
    lean: 0,
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
    charge: 0,
    silk: { x: 70, y: 200, a: 0 },
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
    flashRgb: GOLD,
    punch: 1,
    muzzle: 0,
    winT: 0,
    nextT: 0,
    nextLife: LIFE_EVERY,
    dropI: 0,
    why: '',
    bossIn: false
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
  function stageOf(i) {
    return STAGES[i] || STAGES[0];
  }
  function comboMul(c) {
    return 1 + Math.min(4, Math.floor(Math.max(0, c - 1) / 3));
  }
  function plySpd() {
    return (isRain() ? 326 : 282) + G.wpnLv * 8;
  }
  function scrollSpd() {
    if (G.bossIn) return isRain() ? 32 : 24;
    const base = isRain() ? 128 : 92;
    const rush = G.combo >= 8 ? 14 : G.combo >= 4 ? 7 : 0;
    return base + rush + G.stage * 6;
  }
  function hpMul() {
    return isRain() ? 1.26 : 1;
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
  function wpnText() {
    return G.wpnLv <= 0 ? '星' : G.wpnLv === 1 ? '双星' : G.wpnLv === 2 ? '扇星' : '魔星';
  }
  function kindName() {
    return isRain() ? '魔雨' : '骑扫';
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
      this.beep(880 + G.wpnLv * 50 + G.charge * 220, 0.044, 'square', 0.028, 1760);
    },
    charge() {
      this.ensure();
      this.beep(420, 0.16, 'sawtooth', 0.05, 1400);
      this.beep(880, 0.22, 'triangle', 0.04, 1760);
      this.beep(1320, 0.12, 'sine', 0.03, 1980);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.032, 0.03, 1500);
      this.beep(620 * lift, 0.06, 'square', 0.04, 1100 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.09, big ? 0.074 : 0.044, big ? 200 : 480);
      this.beep(big ? 160 : 280, big ? 0.26 : 0.12, 'sawtooth', 0.05, 52);
    },
    bomb() {
      this.ensure();
      this.noise(0.32, 0.08, 140);
      this.beep(92, 0.46, 'sawtooth', 0.068, 36);
      this.beep(980, 0.22, 'sine', 0.042, 240);
    },
    pow() {
      this.ensure();
      this.beep(587, 0.08, 'square', 0.044, 880);
      this.beep(880, 0.12, 'triangle', 0.038, 1174);
    },
    combo(m) {
      this.ensure();
      this.beep(520 + m * 90, 0.09, 'triangle', 0.04, 1040 + m * 80);
    },
    hurt() {
      this.ensure();
      this.noise(0.12, 0.06, 300);
      this.beep(240, 0.16, 'sawtooth', 0.05, 70);
    },
    death() {
      this.ensure();
      this.noise(0.28, 0.08, 180);
      this.beep(180, 0.36, 'sawtooth', 0.06, 40);
    },
    life() {
      this.ensure();
      this.beep(660, 0.1, 'square', 0.045, 880);
      this.beep(880, 0.14, 'triangle', 0.04, 1320);
    },
    boss() {
      this.ensure();
      this.beep(140, 0.3, 'sawtooth', 0.055, 70);
      this.beep(420, 0.18, 'square', 0.035, 210);
    },
    win() {
      this.ensure();
      this.beep(523, 0.14, 'triangle', 0.05, 784);
      this.beep(659, 0.16, 'triangle', 0.045, 987);
      this.beep(784, 0.22, 'sine', 0.04, 1174);
    },
    lose() {
      this.ensure();
      this.beep(330, 0.22, 'sawtooth', 0.05, 110);
      this.beep(196, 0.36, 'triangle', 0.04, 80);
    },
    start() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1046, 0.14, 'triangle', 0.035, 1318);
    },
    empty() {
      this.ensure();
      this.beep(160, 0.08, 'square', 0.03, 90);
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
    try {
      localStorage.setItem(BEST_KEY, String(G.best | 0));
    } catch (err) { /* ignore */ }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function flashScore(n) {
    if (!scoreBox) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    if (scoreAdd && n > 0) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok && scoreAdd) scoreAdd.hidden = true;
      }, 700);
    }
  }

  function addScore(n) {
    n = Math.round(n);
    if (!n) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    flashScore(n);
    while (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.life();
        syncHud();
      }
    }
    if (G.score > G.best) {
      G.best = G.score;
      saveBest();
    }
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
      if (tok === toastTok && toastEl) toastEl.classList.add('hidden');
    }, 1120);
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
    while (pips.length < LIFE_CAP) {
      const s = document.createElement('span');
      s.className = 'pip';
      pipsEl.appendChild(s);
      pips.push(s);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode === 'lose' && i < LIVES && i >= G.lives);
    }
  }

  function syncHud() {
    const st = stageOf(G.stage);
    if (stageLabel) {
      stageLabel.textContent = st.name;
      stageLabel.classList.toggle('hot', G.bossIn);
    }
    if (tagLabel) {
      tagLabel.textContent = G.bossIn ? st.boss : kindName();
      tagLabel.classList.toggle('warn', isRain() && !G.bossIn);
      tagLabel.classList.toggle('hot', G.bossIn);
    }
    if (wpnLabel) wpnLabel.textContent = wpnText();
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (btnBomb) btnBomb.disabled = G.mode === 'play' && G.bombs <= 0;
    if (btnPad) btnPad.disabled = G.mode === 'play' && G.bombs <= 0;
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.charge, 0, 1) + ')';
    if (chgWrap) chgWrap.classList.toggle('full', G.charge >= 0.92);
    if (hintEl) {
      hintEl.classList.toggle('hot', G.bossIn);
      hintEl.classList.toggle('warn', G.lives <= 1 && G.mode === 'play');
      if (G.mode === 'title') hintEl.textContent = '空格连射蓄咒 · Shift 爆弹 · 捡糖升星 · 撞上掉命';
      else if (G.bossIn) hintEl.textContent = st.boss + ' · 蓄满咒放魔星 · 爆弹清弹';
      else hintEl.textContent = st.name + ' · 空格蓄咒 · Shift 爆弹';
    }
    if (comboEl && (G.mode !== 'play' || G.combo < 2)) comboEl.hidden = true;
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'COTT';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvRetry) btnOvRetry.textContent = '再扫';
    if (btnOvModes) {
      if (kind === 'win' && !isRain()) btnOvModes.textContent = '魔雨';
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
    capArr(particles, 380);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 48);
    capArr(rings, 32);
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
    trees.length = 0;
    pads.length = 0;
    for (let i = 0; i < 46; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH * 0.72),
        s: rand(0.6, 2.1),
        a: rand(0.18, 0.7),
        tw: rand(0, TAU)
      });
    }
    for (let i = 0; i < 36; i++) {
      motes.push({
        x: rand(0, VW),
        y: rand(0, VH),
        s: rand(1.2, 3.4),
        v: rand(22, 64),
        a: rand(0.2, 0.55),
        rgb: i % 3 === 0 ? GOLD : i % 3 === 1 ? PNK : MINT
      });
    }
    for (let i = 0; i < 9; i++) {
      trees.push({
        x: rand(0, VW),
        y: VH - rand(18, 56),
        h: rand(38, 92),
        k: (hash2(i + 11) * 3) | 0
      });
    }
    for (let i = 0; i < 8; i++) {
      pads.push({
        x: rand(0, VW),
        y: VH - rand(28, 70),
        w: rand(18, 34)
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

  function makeShot(x, y, vx, vy, dmg, extra) {
    const s = {
      x: x, y: y, vx: vx, vy: vy || 0, r: extra && extra.r ? extra.r : 3.6,
      life: extra && extra.life ? extra.life : 0.92, dmg: dmg || 1, dead: false,
      pierce: !!(extra && extra.pierce), charged: !!(extra && extra.charged),
      spin: 0, split: false, hits: 0
    };
    return s;
  }

  function makeEShot(x, y, vx, vy, r, rgb) {
    return { x: x, y: y, vx: vx, vy: vy, r: r || 3.5, life: 2.7, rgb: rgb || PUMP, dead: false };
  }

  function aimShot(x, y, tx, ty, spd, r, rgb) {
    const d = hypot(tx - x, ty - y) || 1;
    return makeEShot(x, y, (tx - x) / d * spd, (ty - y) / d * spd, r, rgb);
  }

  function nextDrop() {
    const cycle = ['candy', 'candy', 'bomb'];
    const k = cycle[G.dropI % cycle.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vx: -40, vy: rand(-30, 30), kind: kind || 'candy',
      t: 0, dead: false
    });
  }

  function makeBat(x, y, amp) {
    return {
      type: 'bat', x: x, y: y, baseY: y, w: 20, h: 14, hp: 1, score: SCORE.bat,
      vx: isRain() ? -156 : -124, amp: amp || 22, bob: rand(0, TAU), dead: false, hitT: 0
    };
  }

  function makeCandy(x, y) {
    return {
      type: 'candy', x: x, y: y, w: 14, h: 14, hp: 1, score: SCORE.candy,
      vx: isRain() ? -110 : -88, vy: rand(-70, 70), dead: false, hitT: 0, spin: rand(0, TAU)
    };
  }

  function makeImp(x, y) {
    return {
      type: 'imp', x: x, y: y, w: 18, h: 18, hp: 2, score: SCORE.imp,
      vx: isRain() ? -78 : -62, cd: rand(0.5, 1.2), dead: false, hitT: 0, bob: rand(0, TAU)
    };
  }

  function makeWisp(x, y) {
    return {
      type: 'wisp', x: x, y: y, baseY: y, w: 14, h: 14, hp: 1, score: SCORE.wisp,
      vx: isRain() ? -102 : -82, bob: rand(0, TAU), amp: 36, cd: rand(0.6, 1.3),
      dead: false, hitT: 0
    };
  }

  function makeToad(x, y) {
    return {
      type: 'toad', x: x, y: y, w: 24, h: 18, hp: 3, score: SCORE.toad,
      vx: isRain() ? -70 : -54, vy: -40, hop: 0, cd: rand(0.8, 1.5), dead: false, hitT: 0
    };
  }

  function makeWool(x, y) {
    return {
      type: 'wool', x: x, y: y, w: 30, h: 22, hp: 4, score: SCORE.wool,
      vx: isRain() ? -58 : -46, bob: rand(0, TAU), dead: false, hitT: 0
    };
  }

  function makePumpkin(x, y) {
    return {
      type: 'pumpkin', x: x, y: y, baseY: y, w: 22, h: 20, hp: 3, score: SCORE.pumpkin,
      vx: isRain() ? -72 : -58, bob: rand(0, TAU), cd: rand(0.7, 1.4), dead: false, hitT: 0
    };
  }

  function makeSprite(x, y) {
    return {
      type: 'sprite', x: x, y: y, w: 16, h: 16, hp: 2, score: SCORE.sprite,
      vx: isRain() ? -90 : -72, vy: 0, cd: rand(0.5, 1.1), dead: false, hitT: 0, bob: rand(0, TAU)
    };
  }

  function makeCart(x, y) {
    return {
      type: 'cart', x: x, y: y, w: 34, h: 20, hp: 5, score: SCORE.cart,
      vx: isRain() ? -62 : -50, drop: true, dead: false, hitT: 0
    };
  }

  function makeTurret(x, y) {
    return {
      type: 'turret', x: x, y: y, w: 22, h: 26, hp: 4, score: SCORE.turret,
      vx: isRain() ? -90 : -70, ground: true, cd: rand(0.4, 1.0), dead: false, hitT: 0
    };
  }

  function makeBoss(kind, name, hp) {
    return {
      type: 'boss', kind: kind, name: name, x: VW + 80, y: VH * 0.5,
      w: kind === 'king' ? 110 : kind === 'toad' ? 88 : 96,
      h: kind === 'king' ? 86 : kind === 'toad' ? 70 : 64,
      hp: Math.round(hp * hpMul()), maxhp: Math.round(hp * hpMul()),
      score: SCORE.boss, vx: -70, vy: 0, t: 0, cd: 0.8, phase: 1,
      in: true, dead: false, hitT: 0, flash: 0, bob: 0
    };
  }

  function spawnWave(w) {
    if (w.rain && !isRain()) return;
    const n = (w.n || 1) + (isRain() && !w.rain ? 1 : 0);
    const y = (w.y || 0.5) * VH;
    if (w.kind === 'bats') {
      for (let i = 0; i < n; i++) G.ents.push(makeBat(VW + 24 + i * 28, y + rand(-16, 16), 18 + i * 3));
    } else if (w.kind === 'candy') {
      for (let i = 0; i < n; i++) G.ents.push(makeCandy(VW + 20 + i * 26, rand(50, VH - 50)));
    } else if (w.kind === 'imps') {
      for (let i = 0; i < n; i++) G.ents.push(makeImp(VW + 28 + i * 40, 70 + i * 70));
    } else if (w.kind === 'wisps') {
      for (let i = 0; i < n; i++) G.ents.push(makeWisp(VW + 18 + i * 30, 80 + (i % 4) * 70));
    } else if (w.kind === 'toads') {
      for (let i = 0; i < n; i++) G.ents.push(makeToad(VW + 30 + i * 46, VH - 80 - i * 20));
    } else if (w.kind === 'wool') {
      for (let i = 0; i < n; i++) G.ents.push(makeWool(VW + 36 + i * 50, 90 + i * 80));
    } else if (w.kind === 'pumpkins') {
      for (let i = 0; i < n; i++) G.ents.push(makePumpkin(VW + 24 + i * 34, 70 + (i % 3) * 90));
    } else if (w.kind === 'sprites') {
      for (let i = 0; i < n; i++) G.ents.push(makeSprite(VW + 22 + i * 32, 60 + i * 55));
    } else if (w.kind === 'dive') {
      for (let i = 0; i < n; i++) {
        const b = makeBat(VW + 16 + i * 22, 36 + (i % 2) * (VH - 80), 8);
        b.dive = true;
        G.ents.push(b);
      }
    } else if (w.kind === 'cart') {
      G.ents.push(makeCart(VW + 30, VH * 0.42));
    } else if (w.kind === 'turrets') {
      for (let i = 0; i < n; i++) G.ents.push(makeTurret(VW + 40 + i * 70, VH - 34));
    } else if (w.kind === 'boss') {
      const st = stageOf(G.stage);
      G.ents.push(makeBoss(st.bossKind, st.boss, st.bossHp));
      G.bossIn = true;
      audio.boss();
      toast(st.boss + ' 来了', false, true);
      screenFlash(hueRgb(st.hue), 0.32);
      syncHud();
    }
  }

  function bodyHit(e, x, y, r) {
    if (e.type === 'boss') {
      const bw = (e.w || 90) * 0.42;
      const bh = (e.h || 60) * 0.42;
      const nx = clamp(x, e.x - bw, e.x + bw);
      const ny = clamp(y, e.y - bh, e.y + bh);
      return hypot(x - nx, y - ny) <= r + 3;
    }
    const hw = (e.w || 16) * 0.5;
    const hh = (e.h || 12) * 0.5;
    const nx = clamp(x, e.x - hw, e.x + hw);
    const ny = clamp(y, e.y - hh, e.y + hh);
    return hypot(x - nx, y - ny) <= r;
  }

  function explodeEnt(e, big) {
    const rgb = e.type === 'boss' ? GOLD : e.type === 'cart' ? MINT : e.type === 'pumpkin' || e.type === 'imp' ? PUMP : PNK;
    emit(big ? 30 : 12, {
      x: e.x, y: e.y, j: big ? 28 : 10,
      vx0: -170, vx1: 170, vy0: -170, vy1: 170,
      r0: 1.6, r1: big ? 6.2 : 3.4, life: big ? 0.56 : 0.32, rgb: rgb, g: 70
    });
    popSpark(e.x, e.y, rgb, big ? 36 : 16);
    audio.boom(big);
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    const pts = Math.round((e.score || 50) * G.mult);
    addScore(pts);
    bumpCombo();
    G.charge = Math.min(1, G.charge + (e.type === 'boss' ? 0.35 : 0.045));
    floatText(e.x, e.y - 10, '+' + pts, e.type === 'boss' ? GOLD : WHT, e.type === 'boss' || pts >= 280);
    explodeEnt(e, e.type === 'boss' || e.type === 'cart' || e.type === 'wool');
    if (e.type === 'cart' && e.drop) spawnPow(e.x, e.y, nextDrop());
    if (e.type === 'boss') onBossDown(e);
    hitStop(e.type === 'boss' ? 0.08 : clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    kick(e.type === 'boss' ? 7.6 : 2.5);
  }

  function hurtEnt(e, dmg, hx, hy) {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitT = 0.08;
    e.flash = 0.1;
    if (e.hp <= 0) {
      killEnt(e);
      return;
    }
    audio.hit(G.combo);
    emit(4, {
      x: hx, y: hy, j: 5,
      vx0: -90, vx1: 40, vy0: -70, vy1: 70,
      r0: 1, r1: 2.4, life: 0.18, rgb: GOLD, g: 0
    });
    hitStop(0.03);
    G.charge = Math.min(1, G.charge + 0.02);
  }

  function onBossDown(e) {
    G.bossIn = false;
    addScore(Math.round(1500 * (G.stage + 1) * G.mult));
    addScore(SCORE.clear);
    G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
    screenFlash(GOLD, 0.5);
    for (let i = 0; i < G.eShots.length; i++) G.eShots[i].dead = true;
    for (let i = 0; i < G.ents.length; i++) {
      const o = G.ents[i];
      if (!o.dead && o.type !== 'boss') o.vx = -260;
    }
    const st = stageOf(G.stage);
    toast(st.name + ' 扫净', false, true);
    if (G.stage >= STAGES.length - 1) G.winT = 1.9;
    else G.nextT = 1.65;
    syncHud();
  }

  function nextStage() {
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.bossIn = false;
    G.nextT = 0;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.invuln = Math.max(G.invuln, 0.85);
    G.px = clamp(G.px, 40, 160);
    seedDecor();
    const st = stageOf(G.stage);
    audio.start();
    screenFlash(hueRgb(st.hue), 0.4);
    hitStop(0.06);
    kick(3.6);
    toast('第 ' + (G.stage + 1) + ' 夜 · ' + st.name, false, true);
    syncHud();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    const lv = G.wpnLv;
    const cds = [0.112, 0.098, 0.086, 0.074];
    G.fireCd = cds[lv] || 0.074;
    G.muzzle = 0.055;
    audio.shoot();
    const spd = 640;
    const x = G.px + 18;
    const y = G.py;
    if (lv <= 0) {
      G.shots.push(makeShot(x, y, spd, 0, 1));
    } else if (lv === 1) {
      G.shots.push(makeShot(x, y - 7, spd, 0, 1));
      G.shots.push(makeShot(x, y + 7, spd, 0, 1));
    } else if (lv === 2) {
      G.shots.push(makeShot(x, y, spd, 0, 1));
      G.shots.push(makeShot(x, y, spd * 0.96, -95, 1));
      G.shots.push(makeShot(x, y, spd * 0.96, 95, 1));
    } else {
      G.shots.push(makeShot(x, y, spd, 0, 1));
      G.shots.push(makeShot(x, y, spd * 0.97, -72, 1));
      G.shots.push(makeShot(x, y, spd * 0.97, 72, 1));
      G.shots.push(makeShot(x, y, spd * 0.92, -148, 1));
      G.shots.push(makeShot(x, y, spd * 0.92, 148, 1));
    }
    if (lv >= 2) {
      G.shots.push(makeShot(G.silk.x + 10, G.silk.y, spd * 0.9, 0, 1, { r: 2.8 }));
    }
    if (!REDUCE) {
      emit(2, {
        x: x, y: y, j: 2,
        vx0: 40, vx1: 90, vy0: -20, vy1: 20,
        r0: 1, r1: 2, life: 0.12, rgb: GOLD, g: 0
      });
    }
  }

  function fireCharge() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    G.muzzle = 0.14;
    audio.charge();
    hitStop(0.056);
    kick(4.4);
    screenFlash(GOLD, 0.34);
    floatText(G.px + 28, G.py - 20, '魔星', GOLD, true);
    G.shots.push(makeShot(G.px + 22, G.py, 530, 0, 5, { r: 12, life: 1.25, pierce: true, charged: true }));
    emit(18, {
      x: G.px + 18, y: G.py, j: 10,
      vx0: 40, vx1: 220, vy0: -120, vy1: 120,
      r0: 1.6, r1: 4.2, life: 0.32, rgb: GOLD, g: 0
    });
    popSpark(G.px + 22, G.py, GOLD, 22);
  }

  function splitCharge(shot) {
    if (shot.split) return;
    shot.split = true;
    const angs = [-0.46, -0.22, 0, 0.22, 0.46];
    for (let i = 0; i < angs.length; i++) {
      const a = angs[i];
      G.shots.push(makeShot(shot.x + 8, shot.y, Math.cos(a) * 460, Math.sin(a) * 460, 2, { r: 4.2, life: 0.7 }));
    }
    popSpark(shot.x, shot.y, PNK, 20);
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombs <= 0) {
      audio.empty();
      toast('爆弹用尽', true, false);
      return;
    }
    if (G.bombT > 0.2) return;
    G.bombs -= 1;
    G.bombT = 0.52;
    G.bombFlash = 0.55;
    G.invuln = Math.max(G.invuln, 0.52);
    G.charge = 1;
    audio.bomb();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MINT, 0.48);
    if (stageEl) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
      setTimeout(function () {
        if (stageEl) stageEl.classList.remove('bomb');
      }, 500);
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      if (!s.dead) {
        s.dead = true;
        emit(3, {
          x: s.x, y: s.y, j: 4,
          vx0: -80, vx1: 80, vy0: -80, vy1: 80,
          r0: 1, r1: 2.4, life: 0.22, rgb: MINT, g: 0
        });
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      hurtEnt(e, e.type === 'boss' ? 16 : 8, e.x, e.y);
    }
    emit(42, {
      x: G.px, y: G.py, j: 40,
      vx0: -240, vx1: 240, vy0: -240, vy1: 240,
      r0: 2, r1: 6, life: 0.5, rgb: MINT, g: 20
    });
    popSpark(G.px, G.py, MINT, 48);
    rings.push({ x: G.px, y: G.py, t: 0, rgb: PNK, r: 60 });
    toast('丝爆', false, true);
    syncHud();
  }

  function hurtPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.bombT > 0) return;
    G.why = why;
    diePlayer();
  }

  function diePlayer() {
    G.lives -= 1;
    G.deadT = 0.95;
    G.fireHold = false;
    G.charge = 0;
    audio.death();
    hitStop(0.078);
    kick(8);
    screenFlash(MAG, 0.55);
    emit(34, {
      x: G.px, y: G.py, j: 18,
      vx0: -210, vx1: 210, vy0: -210, vy1: 210,
      r0: 2, r1: 6.2, life: 0.52, rgb: MAG, g: 50
    });
    popSpark(G.px, G.py, MAG, 32);
    for (let i = 0; i < G.eShots.length; i++) G.eShots[i].dead = true;
    if (G.wpnLv > 0) {
      spawnPow(G.px + 26, G.py, 'candy');
      G.wpnLv = Math.max(0, G.wpnLv - 1);
    }
    syncHud();
  }

  function respawn() {
    G.deadT = 0;
    G.invuln = 1.55;
    G.px = 90;
    G.py = VH * 0.5;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.charge = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'shot' ? '中弹坠夜' : '撞上断帚';
    const st = stageOf(G.stage);
    showOverlay(
      'lose',
      '扫帚断了',
      why + ' · ' + st.name + ' · ' + G.score + ' 分。R 重开。'
    );
    syncHud();
  }

  function goWin() {
    addScore(8000);
    G.mode = 'win';
    audio.win();
    screenFlash(GOLD, 0.5);
    showOverlay(
      'win',
      '夜尽了',
      (isRain() ? '魔雨' : '骑扫') + ' · 南瓜王击破 · ' + G.score + ' 分'
    );
    syncHud();
  }

  function collectPow(p) {
    p.dead = true;
    audio.pow();
    popSpark(p.x, p.y, GOLD, 16);
    screenFlash(GOLD, 0.18);
    hitStop(0.04);
    G.charge = Math.min(1, G.charge + 0.18);
    if (p.kind === 'candy') {
      if (G.wpnLv >= WPN_MAX) addScore(500 * G.mult);
      else {
        G.wpnLv += 1;
        flashWpn();
        toast(wpnText(), false, true);
      }
      floatText(p.x, p.y - 8, '糖', GOLD, true);
    } else {
      if (G.bombs >= BOMB_CAP) addScore(400 * G.mult);
      else {
        G.bombs += 1;
        toast('爆 +1', false, true);
      }
      floatText(p.x, p.y - 8, '爆', MINT, true);
    }
    emit(10, {
      x: p.x, y: p.y, j: 8,
      vx0: -70, vx1: 70, vy0: -90, vy1: 40,
      r0: 1.2, r1: 3, life: 0.28, rgb: GOLD, g: 80
    });
    syncHud();
  }

  function updateFx(dt) {
    if (G.stop > 0) G.stop = Math.max(0, G.stop - dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.6);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.bombFlash > 0) G.bombFlash = Math.max(0, G.bombFlash - dt);
    if (G.bombT > 0) G.bombT = Math.max(0, G.bombT - dt);
    if (G.fireCd > 0) G.fireCd = Math.max(0, G.fireCd - dt);
    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    G.silk.a += dt * 3.1;
    G.silk.x = G.px - 8 + Math.cos(G.silk.a) * 18;
    G.silk.y = G.py - 22 + Math.sin(G.silk.a * 1.3) * 12;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.46) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    const sc = scrollSpd();
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= sc * 0.08 * dt;
      s.tw += dt * 2;
      if (s.x < -4) {
        s.x = VW + 6;
        s.y = rand(0, VH * 0.72);
      }
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.x -= m.v * dt;
      m.y += Math.sin(G.t * 2.2 + i) * 10 * dt;
      if (m.x < -6) {
        m.x = VW + 8;
        m.y = rand(0, VH);
      }
    }
    for (let i = 0; i < trees.length; i++) {
      const t = trees[i];
      t.x -= sc * 0.45 * dt;
      if (t.x < -40) {
        t.x = VW + rand(10, 80);
        t.h = rand(38, 92);
        t.k = (hash2((G.scroll | 0) + i) * 3) | 0;
      }
    }
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      p.x -= sc * 0.55 * dt;
      if (p.x < -40) {
        p.x = VW + rand(8, 70);
        p.y = VH - rand(28, 70);
      }
    }
  }

  function updateMove(dt) {
    if (G.deadT > 0) return;
    const spd = plySpd();
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      dx = pointer.x - G.px;
      dy = pointer.y - G.py;
      const d = hypot(dx, dy);
      if (d > 4) {
        const step = Math.min(d, spd * dt * 1.15);
        G.px += dx / d * step;
        G.py += dy / d * step;
        G.lean = lerp(G.lean, clamp(dy / 80, -1, 1), 0.2);
      } else G.lean = lerp(G.lean, 0, 0.15);
    } else {
      const v = moveVec(keys.l, keys.r, keys.u, keys.d);
      G.px += v.x * spd * dt;
      G.py += v.y * spd * dt;
      G.lean = lerp(G.lean, v.y, 0.18);
    }
    G.px = clamp(G.px, 22, G.bossIn ? 420 : 496);
    G.py = clamp(G.py, 22, 428);
  }

  function fanShot(x, y, n, spd, spread, rgb) {
    const mid = (n - 1) * 0.5;
    for (let i = 0; i < n; i++) {
      const a = (i - mid) * spread;
      G.eShots.push(makeEShot(x, y, Math.cos(a) * -spd, Math.sin(a) * spd, 3.4, rgb));
    }
  }

  function ringShot(x, y, n, spd, rgb, rot) {
    for (let i = 0; i < n; i++) {
      const a = TAU * i / n + (rot || 0);
      G.eShots.push(makeEShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 3.3, rgb));
    }
  }

  function updateBoss(e, dt) {
    e.t += dt;
    e.cd -= dt;
    if (e.in) {
      e.x += e.vx * dt;
      if (e.x <= 640) {
        e.x = 640;
        e.in = false;
        e.vx = 0;
      }
      return;
    }
    if (e.hp <= e.maxhp * 0.5 && e.phase === 1) {
      e.phase = 2;
      toast(e.name + ' 急了', false, true);
      audio.boss();
      screenFlash(PUMP, 0.28);
    }
    const rain = isRain() ? 0.82 : 1;
    if (e.kind === 'bat') {
      e.y = VH * 0.5 + Math.sin(e.t * 1.6) * 96;
      if (e.phase === 2) e.x = 640 + Math.sin(e.t * 1.1) * 70;
      if (e.cd <= 0) {
        fanShot(e.x - 30, e.y, e.phase === 2 ? 7 : 5, isRain() ? 170 : 140, 0.22, PNK);
        if (e.phase === 2) {
          G.eShots.push(aimShot(e.x - 20, e.y, G.px, G.py, isRain() ? 190 : 150, 4, GOLD));
        }
        e.cd = (e.phase === 2 ? 0.72 : 1.05) * rain;
      }
    } else if (e.kind === 'toad') {
      e.y = lerp(e.y, VH * (0.28 + 0.22 * (1 + Math.sin(e.t * 0.7))), 0.04);
      e.x = 630 + Math.sin(e.t * 0.6) * 24;
      if (e.cd <= 0) {
        if (((e.t * 2) | 0) % 2 === 0) {
          ringShot(e.x - 10, e.y, e.phase === 2 ? 14 : 10, isRain() ? 130 : 108, PURP, e.t);
        } else {
          for (let k = 0; k < (e.phase === 2 ? 5 : 3); k++) {
            G.eShots.push(aimShot(e.x - 24, e.y + 8, G.px, G.py, 150 + k * 18, 3.6, GOLD));
          }
        }
        e.cd = (e.phase === 2 ? 0.78 : 1.12) * rain;
      }
    } else {
      e.y = VH * 0.5 + Math.sin(e.t * 0.9) * 70;
      e.x = 620 + Math.cos(e.t * 0.5) * 28;
      if (e.cd <= 0) {
        const n = e.phase === 2 ? 10 : 7;
        for (let i = 0; i < n; i++) {
          const a = -0.7 + i * (1.4 / Math.max(1, n - 1)) + Math.sin(e.t) * 0.1;
          G.eShots.push(makeEShot(e.x - 36, e.y, Math.cos(a) * -150, Math.sin(a) * 150, 3.8, PUMP));
        }
        if (e.phase === 2) {
          ringShot(e.x, e.y, 12, isRain() ? 120 : 96, GOLD, e.t * 0.7);
          G.eShots.push(aimShot(e.x - 20, e.y, G.px, G.py, isRain() ? 200 : 160, 5, PNK));
        }
        e.cd = (e.phase === 2 ? 0.7 : 1.0) * rain;
      }
    }
  }

  function updateEnts(dt) {
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.dead) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.hitT > 0) e.hitT -= dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.type === 'boss') {
        updateBoss(e, dt);
        continue;
      }
      e.x += (e.vx || 0) * dt;
      if (e.type === 'bat') {
        if (e.dive) {
          const ty = G.py;
          e.y += clamp(ty - e.y, -90, 90) * dt * 1.4;
        } else {
          e.bob += dt * 3.2;
          e.y = e.baseY + Math.sin(e.bob) * e.amp;
        }
      } else if (e.type === 'candy') {
        e.y += e.vy * dt;
        e.spin += dt * 6;
        if (e.y < 18 || e.y > VH - 18) e.vy *= -1;
      } else if (e.type === 'imp') {
        e.bob += dt * 2;
        e.y += Math.sin(e.bob) * 20 * dt;
        e.cd -= dt;
        if (e.cd <= 0) {
          G.eShots.push(aimShot(e.x - 8, e.y, G.px, G.py, isRain() ? 150 : 118, 3.4, PUMP));
          e.cd = isRain() ? 1.15 : 1.45;
        }
      } else if (e.type === 'wisp') {
        e.bob += dt * 2.6;
        e.y = e.baseY + Math.sin(e.bob) * e.amp;
        e.x += Math.cos(e.bob * 0.7) * 28 * dt;
        e.cd -= dt;
        if (e.cd <= 0) {
          G.eShots.push(makeEShot(e.x, e.y, -40, 70, 3.2, PURP));
          e.cd = isRain() ? 1.0 : 1.35;
        }
      } else if (e.type === 'toad') {
        e.vy += 220 * dt;
        e.y += e.vy * dt;
        if (e.y > VH - 40) {
          e.y = VH - 40;
          e.vy = -160;
        }
        e.cd -= dt;
        if (e.cd <= 0) {
          fanShot(e.x - 6, e.y, 3, 120, 0.28, GOLD);
          e.cd = isRain() ? 1.2 : 1.55;
        }
      } else if (e.type === 'wool') {
        e.bob += dt * 1.4;
        e.y += Math.sin(e.bob) * 16 * dt;
      } else if (e.type === 'pumpkin') {
        e.bob += dt * 1.8;
        e.y = e.baseY + Math.sin(e.bob) * 18;
        e.cd -= dt;
        if (e.cd <= 0) {
          fanShot(e.x - 8, e.y, 3, 128, 0.24, PUMP);
          e.cd = isRain() ? 1.1 : 1.4;
        }
      } else if (e.type === 'sprite') {
        e.bob += dt * 3;
        e.y += Math.sin(e.bob) * 30 * dt;
        e.vy = (G.py - e.y) * 0.6;
        e.y += e.vy * dt * 0.15;
        e.cd -= dt;
        if (e.cd <= 0) {
          G.eShots.push(aimShot(e.x, e.y, G.px, G.py, isRain() ? 160 : 128, 3.2, MINT));
          e.cd = isRain() ? 1.05 : 1.38;
        }
      } else if (e.type === 'cart') {
        e.y += Math.sin(G.t * 2.2) * 12 * dt;
      } else if (e.type === 'turret') {
        e.cd -= dt;
        if (e.cd <= 0) {
          G.eShots.push(aimShot(e.x, e.y - 12, G.px, G.py, isRain() ? 155 : 122, 3.6, PNK));
          e.cd = isRain() ? 1.05 : 1.4;
        }
      }
      if (e.x < -50 || e.y < -60 || e.y > VH + 60) e.dead = true;
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      s.spin += dt * 10;
      if (s.life <= 0 || s.x > VW + 30 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const e = G.ents[j];
        if (e.dead) continue;
        if (s.hitList) {
          let seen = false;
          for (let h = 0; h < s.hitList.length; h++) {
            if (s.hitList[h] === e) { seen = true; break; }
          }
          if (seen) continue;
        }
        if (bodyHit(e, s.x, s.y, s.r)) {
          if (s.pierce) {
            if (!s.hitList) s.hitList = [];
            s.hitList.push(e);
          }
          hurtEnt(e, s.dmg, s.x, s.y);
          if (s.charged) splitCharge(s);
          s.hits += 1;
          if (!s.pierce || s.hits > 6) {
            s.dead = true;
            hit = true;
          }
          break;
        }
      }
      if (hit || s.dead) G.shots.splice(i, 1);
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.dead || s.life <= 0 || s.x < -20 || s.x > VW + 30 || s.y < -20 || s.y > VH + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && hypot(s.x - G.px, s.y - G.py) < 7 + s.r * 0.55) {
        s.dead = true;
        G.eShots.splice(i, 1);
        hurtPlayer('shot');
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += Math.sin(p.t * 4) * 8 * dt;
      if (p.y < 20 || p.y > VH - 20) p.vy *= -0.8;
      if (p.x < -20 || p.t > 9) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && hypot(p.x - G.px, p.y - G.py) < 22) {
        collectPow(p);
        G.pows.splice(i, 1);
      }
    }
  }

  function maybeSpawn() {
    if (G.bossIn || G.winT > 0 || G.nextT > 0) return;
    const st = stageOf(G.stage);
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      spawnWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function update(dt) {
    updateFx(dt);
    if (G.mode !== 'play') {
      G.t += dt;
      G.scroll += 26 * dt;
      G.py = VH * 0.5 + Math.sin(G.t * 1.4) * 10;
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
    if (G.nextT > 0) {
      G.nextT -= dt;
      if (G.nextT <= 0) nextStage();
    }
    if (!G.bossIn) G.stageT += dt;
    updateMove(dt);
    if (G.fireHold && G.deadT <= 0) {
      G.charge = Math.min(1, G.charge + dt * ((isRain() ? 0.46 : 0.38) + (G.combo >= 8 ? 0.08 : 0)));
      fire();
      if (G.charge >= 1) {
        G.charge = 0;
        fireCharge();
        G.fireCd = 0.14;
      }
    }
    if (!REDUCE && G.deadT <= 0 && ((G.t * 22) | 0) !== (((G.t - dt) * 22) | 0)) {
      emit(1, {
        x: G.px - 18, y: G.py + 4, j: 2.2,
        vx0: -90, vx1: -20, vy0: -16, vy1: 16,
        r0: 1.1, r1: 2.6, life: 0.22, rgb: GOLD, g: 0
      });
    }
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
    if (G.deadT <= 0) {
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.dead || e.ground) continue;
        if (bodyHit(e, G.px, G.py, 8)) {
          if (e.type === 'boss') hurtPlayer('crash');
          else {
            const was = G.deadT <= 0;
            hurtPlayer('crash');
            if (was && !e.dead) killEnt(e);
          }
        }
      }
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else comboEl.hidden = true;
    }
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.charge, 0, 1) + ')';
    if (chgWrap) chgWrap.classList.toggle('full', G.charge >= 0.92);
  }

  function starPath(c, x, y, r, n, inner) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n;
      const rad = i % 2 === 0 ? r : r * inner;
      const px = x + Math.cos(a) * rad;
      const py = y + Math.sin(a) * rad;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawNight() {
    const c = ctx;
    const st = stageOf(G.stage);
    const hue = st.hue;
    const top = hueRgb(hue, 0.45, 0.1);
    const mid = hueRgb((hue + 24) % 360, 0.5, 0.16);
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, rgba(top, 1));
    g.addColorStop(0.55, rgba(mid, 1));
    g.addColorStop(1, rgba(DEEP, 1));
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const moonX = 0.78 * VW;
    const moonY = 0.18 * VH;
    c.fillStyle = rgba(st.id === 2 ? PUMP : st.id === 1 ? PURP : GOLD, 0.16);
    c.beginPath();
    c.arc(sx(moonX), sy(moonY), 38 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(st.id === 2 ? PUMP : GOLD, 0.85);
    c.beginPath();
    c.arc(sx(moonX), sy(moonY), 22 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(top, 1);
    c.beginPath();
    c.arc(sx(moonX + 8), sy(moonY - 4), 16 * scale, 0, TAU);
    c.fill();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.55 + 0.45 * Math.sin(s.tw));
      c.fillStyle = rgba(WHT, a);
      c.fillRect(sx(s.x), sy(s.y), s.s * scale, s.s * scale);
    }

    const y0 = st.id === 1 ? VH * 0.74 : VH * 0.8;
    c.beginPath();
    c.moveTo(sx(-16), sy(VH + 6));
    c.lineTo(sx(-16), sy(y0));
    const step = 30;
    const sc = G.scroll * 0.32;
    for (let x = 0; x <= VW + 40; x += step) {
      const h = hash2(((x + sc) / step) | 0);
      const y = y0 - 14 - h * (st.id === 2 ? 58 : 40);
      c.lineTo(sx(x), sy(y));
    }
    c.lineTo(sx(VW + 20), sy(VH + 6));
    c.closePath();
    c.fillStyle = rgba(hueRgb(hue, 0.42, 0.11), 0.95);
    c.fill();

    if (st.id === 0) {
      for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        const tx = sx(t.x);
        const ty = sy(VH - 8);
        c.strokeStyle = rgba(WOOD, 0.85);
        c.lineWidth = Math.max(1.4, 2.2 * scale);
        c.beginPath();
        c.moveTo(tx, ty);
        c.lineTo(tx, ty - t.h * scale);
        c.stroke();
        const rgb = t.k === 0 ? PNK : t.k === 1 ? GOLD : MINT;
        c.fillStyle = rgba(rgb, 0.9);
        c.beginPath();
        c.arc(tx, ty - t.h * scale, 8 * scale, 0, TAU);
        c.fill();
        c.strokeStyle = rgba(WHT, 0.35);
        c.lineWidth = Math.max(1, 1.2 * scale);
        c.beginPath();
        c.moveTo(tx, ty - t.h * scale + 8 * scale);
        c.lineTo(tx, ty - t.h * scale - 8 * scale);
        c.moveTo(tx - 7 * scale, ty - t.h * scale);
        c.lineTo(tx + 7 * scale, ty - t.h * scale);
        c.stroke();
      }
    } else if (st.id === 1) {
      c.fillStyle = rgba([40, 18, 64], 0.55);
      c.fillRect(sx(0), sy(VH * 0.82), VW * scale, VH * 0.2 * scale);
      for (let i = 0; i < pads.length; i++) {
        const p = pads[i];
        c.fillStyle = rgba(MINT, 0.28);
        c.beginPath();
        c.ellipse(sx(p.x), sy(p.y), p.w * scale, 6 * scale, 0, 0, TAU);
        c.fill();
      }
    } else {
      for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        const bw = 18 + (t.k + 1) * 6;
        c.fillStyle = rgba(hueRgb(18, 0.35, 0.14), 0.9);
        c.fillRect(sx(t.x - bw * 0.5), sy(VH - t.h * 0.55), bw * scale, t.h * 0.55 * scale);
        c.fillStyle = rgba(PUMP, 0.55);
        c.fillRect(sx(t.x - 4), sy(VH - t.h * 0.42), 8 * scale, 8 * scale);
      }
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      c.fillStyle = rgba(m.rgb, m.a);
      c.beginPath();
      c.arc(sx(m.x), sy(m.y), m.s * scale, 0, TAU);
      c.fill();
    }
  }

  function drawCotton() {
    if (G.deadT > 0) return;
    const c = ctx;
    const x = sx(G.px);
    const y = sy(G.py);
    const s = scale;
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink) c.globalAlpha = 0.4;
    const lean = clamp(G.lean, -0.4, 0.4);
    c.save();
    c.translate(x, y);
    c.rotate(lean * 0.35);

    c.strokeStyle = rgba(WOOD, 1);
    c.lineWidth = Math.max(1.6, 2.5 * s);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-30 * s, 5 * s);
    c.lineTo(22 * s, -2 * s);
    c.stroke();

    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.moveTo(-24 * s, 3 * s);
    c.lineTo(-40 * s, -10 * s);
    c.lineTo(-42 * s, 2 * s);
    c.lineTo(-36 * s, 14 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(PUMP, 0.7);
    c.beginPath();
    c.moveTo(-26 * s, 3 * s);
    c.lineTo(-38 * s, -4 * s);
    c.lineTo(-39 * s, 4 * s);
    c.closePath();
    c.fill();

    c.fillStyle = rgba(PNK, 0.96);
    c.beginPath();
    c.moveTo(-4 * s, 1 * s);
    c.lineTo(12 * s, 16 * s);
    c.lineTo(-10 * s, 16 * s);
    c.closePath();
    c.fill();

    c.fillStyle = rgba(SKIN, 1);
    c.beginPath();
    c.arc(6 * s, -5 * s, 6.4 * s, 0, TAU);
    c.fill();

    c.fillStyle = rgba(PNK, 1);
    c.beginPath();
    c.moveTo(-1 * s, -7 * s);
    c.lineTo(6 * s, -20 * s);
    c.lineTo(14 * s, -7 * s);
    c.closePath();
    c.fill();
    c.fillRect(-3 * s, -8 * s, 18 * s, 2.6 * s);

    c.fillStyle = rgba(HOT, 0.9);
    c.beginPath();
    c.arc(2 * s, -2 * s, 2.4 * s, 0, TAU);
    c.fill();
    c.beginPath();
    c.arc(4 * s, 1 * s, 2.2 * s, 0, TAU);
    c.fill();

    c.fillStyle = rgba(DEEP, 0.92);
    c.beginPath();
    c.arc(9 * s, -5 * s, 1.15 * s, 0, TAU);
    c.fill();
    c.fillStyle = rgba([255, 140, 170], 0.7);
    c.beginPath();
    c.arc(8.4 * s, -2.2 * s, 1.3 * s, 0, TAU);
    c.fill();

    if (G.muzzle > 0) {
      c.fillStyle = rgba(GOLD, clamp(G.muzzle * 10, 0, 1));
      c.beginPath();
      c.arc(20 * s, -2 * s, (5 + G.muzzle * 40) * s, 0, TAU);
      c.fill();
    }

    c.restore();

    if (G.charge > 0.06) {
      const a = 0.22 + G.charge * 0.7;
      c.strokeStyle = rgba(G.charge > 0.85 ? GOLD : PNK, a);
      c.lineWidth = Math.max(1.2, (1.3 + G.charge * 2.2) * s);
      c.beginPath();
      c.arc(x, y, (15 + G.charge * 11) * s, 0, TAU);
      c.stroke();
      if (G.charge > 0.85 && !REDUCE) {
        c.strokeStyle = rgba(GOLD, 0.35 + 0.3 * Math.sin(G.t * 14));
        c.beginPath();
        c.arc(x, y, 30 * s, 0, TAU);
        c.stroke();
      }
    }

    c.globalAlpha = 1;
    drawSilk();
  }

  function drawSilk() {
    const c = ctx;
    const x = sx(G.silk.x);
    const y = sy(G.silk.y);
    const s = scale;
    if (G.deadT > 0) return;
    c.fillStyle = rgba(MINT, 0.28);
    c.beginPath();
    c.ellipse(x - 6 * s, y, 7 * s, 3.2 * s, -0.4, 0, TAU);
    c.ellipse(x + 6 * s, y, 7 * s, 3.2 * s, 0.4, 0, TAU);
    c.fill();
    c.fillStyle = rgba(MINT, 0.95);
    c.beginPath();
    c.arc(x, y, 4.4 * s, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.95);
    starPath(c, x, y - 6 * s, 3.2 * s, 4, 0.45);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.85);
    c.beginPath();
    c.arc(x - 1.2 * s, y - 0.4 * s, 0.8 * s, 0, TAU);
    c.arc(x + 1.4 * s, y - 0.4 * s, 0.8 * s, 0, TAU);
    c.fill();
  }

  function drawEnt(e) {
    const c = ctx;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    const flash = e.hitT > 0;
    c.save();
    if (flash) c.globalAlpha = 0.55 + 0.45 * Math.sin(G.t * 40);
    if (e.type === 'boss') {
      drawBoss(e);
      c.restore();
      return;
    }
    if (e.type === 'bat') {
      c.fillStyle = rgba(PNK, 0.95);
      c.beginPath();
      c.ellipse(x, y, 7 * s, 5 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(HOT, 0.85);
      const flap = Math.sin(G.t * 12 + e.x) * 0.5;
      c.beginPath();
      c.ellipse(x - 10 * s, y, 8 * s, (3.2 + flap) * s, -0.4, 0, TAU);
      c.ellipse(x + 10 * s, y, 8 * s, (3.2 + flap) * s, 0.4, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 2 * s, y, 1 * s, 0, TAU);
      c.arc(x + 2.4 * s, y, 1 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'candy') {
      c.save();
      c.translate(x, y);
      c.rotate(e.spin || 0);
      c.fillStyle = rgba(GOLD, 0.95);
      c.fillRect(-7 * s, -5 * s, 14 * s, 10 * s);
      c.fillStyle = rgba(PNK, 0.95);
      c.fillRect(-4 * s, -5 * s, 8 * s, 10 * s);
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.moveTo(-7 * s, 0);
      c.lineTo(-12 * s, -4 * s);
      c.lineTo(-12 * s, 4 * s);
      c.closePath();
      c.fill();
      c.restore();
    } else if (e.type === 'imp') {
      c.fillStyle = rgba(PUMP, 0.95);
      c.beginPath();
      c.arc(x, y, 9 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 3 * s, y - 1 * s, 1.4 * s, 0, TAU);
      c.arc(x + 3.2 * s, y - 1 * s, 1.4 * s, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(DEEP, 0.7);
      c.lineWidth = Math.max(1, 1.2 * s);
      c.beginPath();
      c.arc(x, y + 3 * s, 3.2 * s, 0.2, Math.PI - 0.2);
      c.stroke();
    } else if (e.type === 'wisp') {
      c.fillStyle = rgba(PURP, 0.28);
      c.beginPath();
      c.arc(x, y, 10 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(PURP, 0.95);
      c.beginPath();
      c.arc(x, y, 5 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(x, y, 2 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'toad') {
      c.fillStyle = rgba(PURP, 0.92);
      c.beginPath();
      c.ellipse(x, y, 13 * s, 9 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      starPath(c, x, y - 2 * s, 5 * s, 5, 0.45);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.85);
      c.beginPath();
      c.arc(x - 5 * s, y - 3 * s, 1.4 * s, 0, TAU);
      c.arc(x + 5 * s, y - 3 * s, 1.4 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'wool') {
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(x - 8 * s, y, 9 * s, 0, TAU);
      c.arc(x + 8 * s, y, 9 * s, 0, TAU);
      c.arc(x, y - 6 * s, 10 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(PNK, 0.5);
      c.beginPath();
      c.arc(x, y, 4 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'pumpkin') {
      c.fillStyle = rgba(PUMP, 0.95);
      c.beginPath();
      c.ellipse(x, y, 11 * s, 10 * s, 0, 0, TAU);
      c.fill();
      c.strokeStyle = rgba([120, 50, 10], 0.5);
      c.lineWidth = Math.max(1, 1.1 * s);
      c.beginPath();
      c.ellipse(x, y, 4 * s, 10 * s, 0, 0, TAU);
      c.stroke();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.moveTo(x - 4 * s, y - 2 * s);
      c.lineTo(x - 1 * s, y + 1 * s);
      c.lineTo(x - 5 * s, y + 1 * s);
      c.fill();
      c.beginPath();
      c.moveTo(x + 4 * s, y - 2 * s);
      c.lineTo(x + 1 * s, y + 1 * s);
      c.lineTo(x + 5 * s, y + 1 * s);
      c.fill();
      c.fillStyle = rgba([60, 140, 50], 0.9);
      c.fillRect(x - 1.4 * s, y - 13 * s, 2.8 * s, 4 * s);
    } else if (e.type === 'sprite') {
      c.fillStyle = rgba(MINT, 0.3);
      c.beginPath();
      c.ellipse(x - 7 * s, y, 6 * s, 2.6 * s, -0.5, 0, TAU);
      c.ellipse(x + 7 * s, y, 6 * s, 2.6 * s, 0.5, 0, TAU);
      c.fill();
      c.fillStyle = rgba(HOT, 0.95);
      c.beginPath();
      c.arc(x, y, 5.2 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.85);
      c.beginPath();
      c.arc(x - 1.5 * s, y - 0.6 * s, 0.8 * s, 0, TAU);
      c.arc(x + 1.6 * s, y - 0.6 * s, 0.8 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'cart') {
      c.fillStyle = rgba(WOOD, 0.95);
      c.fillRect(x - 16 * s, y - 6 * s, 32 * s, 14 * s);
      c.fillStyle = rgba(PNK, 0.9);
      c.beginPath();
      c.arc(x - 6 * s, y - 10 * s, 5 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(x + 6 * s, y - 12 * s, 6 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.8);
      c.beginPath();
      c.arc(x - 10 * s, y + 10 * s, 4 * s, 0, TAU);
      c.arc(x + 10 * s, y + 10 * s, 4 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'turret') {
      c.fillStyle = rgba(WOOD, 0.9);
      c.fillRect(x - 8 * s, y - 4 * s, 16 * s, 16 * s);
      c.fillStyle = rgba(PNK, 0.95);
      c.beginPath();
      c.arc(x, y - 10 * s, 8 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.85);
      c.fillRect(x - 2 * s, y - 18 * s, 4 * s, 10 * s);
    }
    c.restore();
  }

  function drawBoss(e) {
    const c = ctx;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    if (e.kind === 'bat') {
      c.fillStyle = rgba(PNK, 0.95);
      c.beginPath();
      c.ellipse(x, y, 36 * s, 22 * s, 0, 0, TAU);
      c.fill();
      const flap = 8 + Math.sin(G.t * 8) * 6;
      c.fillStyle = rgba(HOT, 0.8);
      c.beginPath();
      c.ellipse(x - 48 * s, y, 32 * s, flap * s, -0.3, 0, TAU);
      c.ellipse(x + 40 * s, y + 4 * s, 26 * s, (flap * 0.8) * s, 0.3, 0, TAU);
      c.fill();
      c.fillStyle = rgba(SKIN, 0.95);
      c.beginPath();
      c.arc(x - 10 * s, y - 4 * s, 14 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(PNK, 1);
      c.beginPath();
      c.moveTo(x - 20 * s, y - 12 * s);
      c.lineTo(x - 10 * s, y - 32 * s);
      c.lineTo(x, y - 12 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 6 * s, y - 4 * s, 2.2 * s, 0, TAU);
      c.fill();
    } else if (e.kind === 'toad') {
      c.fillStyle = rgba(PURP, 0.95);
      c.beginPath();
      c.ellipse(x, y + 6 * s, 42 * s, 28 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      starPath(c, x - 6 * s, y - 4 * s, 16 * s, 5, 0.46);
      c.fill();
      c.fillStyle = rgba(SKIN, 0.9);
      c.beginPath();
      c.arc(x - 16 * s, y - 10 * s, 12 * s, 0, TAU);
      c.arc(x + 10 * s, y - 8 * s, 10 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 14 * s, y - 10 * s, 2.4 * s, 0, TAU);
      c.arc(x + 10 * s, y - 8 * s, 2.2 * s, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.7);
      c.lineWidth = Math.max(1.4, 2 * s);
      c.beginPath();
      c.moveTo(x - 36 * s, y + 8 * s);
      c.quadraticCurveTo(sx(G.px), sy(G.py), sx(G.px + 4), sy(G.py));
      if (e.phase === 2) c.stroke();
    } else {
      c.fillStyle = rgba(PUMP, 0.96);
      c.beginPath();
      c.ellipse(x, y, 48 * s, 40 * s, 0, 0, TAU);
      c.fill();
      c.strokeStyle = rgba([110, 40, 8], 0.45);
      c.lineWidth = Math.max(1.2, 1.6 * s);
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.ellipse(x + i * 12 * s, y, 8 * s, 38 * s, 0, 0, TAU);
        c.stroke();
      }
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.moveTo(x - 22 * s, y - 36 * s);
      c.lineTo(x, y - 58 * s);
      c.lineTo(x + 22 * s, y - 36 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.92);
      c.beginPath();
      c.moveTo(x - 16 * s, y - 8 * s);
      c.lineTo(x - 4 * s, y + 4 * s);
      c.lineTo(x - 18 * s, y + 6 * s);
      c.fill();
      c.beginPath();
      c.moveTo(x + 16 * s, y - 8 * s);
      c.lineTo(x + 4 * s, y + 4 * s);
      c.lineTo(x + 18 * s, y + 6 * s);
      c.fill();
      c.fillStyle = rgba(MAG, 0.85);
      c.beginPath();
      c.ellipse(x, y + 16 * s, 14 * s, 8 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba([50, 120, 40], 0.9);
      c.fillRect(x - 4 * s, y - 46 * s, 8 * s, 10 * s);
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = sx(s.x);
      const y = sy(s.y);
      if (s.charged) {
        c.save();
        c.translate(x, y);
        c.rotate(s.spin);
        c.fillStyle = rgba(GOLD, 0.95);
        starPath(c, 0, 0, 14 * scale, 6, 0.42);
        c.fill();
        c.fillStyle = rgba(PNK, 0.9);
        starPath(c, 0, 0, 8 * scale, 6, 0.42);
        c.fill();
        c.restore();
        if (!REDUCE) {
          c.fillStyle = rgba(GOLD, 0.25);
          c.beginPath();
          c.ellipse(x - 16 * scale, y, 16 * scale, 5 * scale, 0, 0, TAU);
          c.fill();
        }
      } else {
        c.fillStyle = rgba(GOLD, 0.95);
        starPath(c, x, y, s.r * 1.6 * scale, 4, 0.45);
        c.fill();
        c.fillStyle = rgba(WHT, 0.85);
        c.beginPath();
        c.arc(x, y, Math.max(1.2, s.r * 0.5 * scale), 0, TAU);
        c.fill();
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      c.fillStyle = rgba(s.rgb || PUMP, 0.95);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.arc(sx(s.x - 0.8), sy(s.y - 0.8), s.r * 0.35 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawPows() {
    const c = ctx;
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const x = sx(p.x);
      const y = sy(p.y + Math.sin(p.t * 6) * 3);
      const s = scale;
      c.save();
      c.translate(x, y);
      c.rotate(p.t * 2);
      if (p.kind === 'candy') {
        c.fillStyle = rgba(GOLD, 0.95);
        c.beginPath();
        c.moveTo(0, -9 * s);
        c.lineTo(8 * s, 0);
        c.lineTo(0, 9 * s);
        c.lineTo(-8 * s, 0);
        c.closePath();
        c.fill();
        c.fillStyle = rgba(PNK, 0.95);
        c.fillRect(-3 * s, -3 * s, 6 * s, 6 * s);
      } else {
        c.fillStyle = rgba(MINT, 0.95);
        c.beginPath();
        c.moveTo(0, -9 * s);
        c.lineTo(8 * s, 0);
        c.lineTo(0, 9 * s);
        c.lineTo(-8 * s, 0);
        c.closePath();
        c.fill();
      }
      c.restore();
    }
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * scale * (0.6 + 0.4 * a), 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = Math.max(1, 1.6 * scale);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (s.rad * (0.3 + s.t * 3)) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.46;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = Math.max(1.2, 2.4 * scale * a);
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + r.t * 90) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.globalAlpha = a;
      c.fillStyle = rgba(f.rgb, 1);
      c.font = '700 ' + Math.round(f.size * scale) + 'px sans-serif';
      c.textAlign = 'center';
      c.fillText(f.text, sx(f.x), sy(f.y));
      c.globalAlpha = 1;
    }
  }

  function drawBossBar() {
    if (!G.bossIn) return;
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && !G.ents[i].dead) {
        boss = G.ents[i];
        break;
      }
    }
    if (!boss) return;
    const c = ctx;
    const w = 220;
    const x = (VW - w) * 0.5;
    const y = 14;
    c.fillStyle = rgba(DEEP, 0.55);
    c.fillRect(sx(x), sy(y), w * scale, 10 * scale);
    const t = clamp(boss.hp / boss.maxhp, 0, 1);
    c.fillStyle = rgba(t < 0.35 ? MAG : PNK, 0.95);
    c.fillRect(sx(x), sy(y), w * t * scale, 10 * scale);
    c.strokeStyle = rgba(WHT, 0.45);
    c.lineWidth = Math.max(1, 1 * scale);
    c.strokeRect(sx(x), sy(y), w * scale, 10 * scale);
    c.fillStyle = rgba(GOLD, 0.9);
    c.font = Math.round(10 * scale) + 'px sans-serif';
    c.textAlign = 'center';
    c.fillText(boss.name, sx(VW * 0.5), sy(y - 4));
  }

  function draw() {
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#0e060a';
    c.fillRect(0, 0, W, H);
    c.save();
    let kx = 0;
    let ky = 0;
    if (G.shake > 0 && !REDUCE) {
      kx = (Math.random() - 0.5) * G.shake * 1.4;
      ky = (Math.random() - 0.5) * G.shake * 1.2;
    }
    c.translate(kx, ky);
    if (G.punch !== 1 && !REDUCE) {
      c.translate(sx(VW * 0.5), sy(VH * 0.5));
      c.scale(G.punch, G.punch);
      c.translate(-sx(VW * 0.5), -sy(VH * 0.5));
    }
    drawNight();
    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawPows();
    drawShots();
    drawCotton();
    drawFx();
    drawBossBar();
    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb || GOLD, G.flash);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.bombFlash > 0) {
      c.strokeStyle = rgba(MINT, G.bombFlash);
      c.lineWidth = Math.max(2, 6 * scale);
      c.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
    c.restore();
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
    G.kind = kind === 'rain' ? 'rain' : 'ride';
    G.mode = 'play';
    G.t = 0;
    G.stage = 0;
    G.stageT = 0;
    G.waveI = 0;
    G.scroll = 0;
    G.px = 90;
    G.py = VH * 0.5;
    G.lean = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.wpnLv = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.charge = 0;
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
    G.nextT = 0;
    G.nextLife = LIFE_EVERY;
    G.dropI = 0;
    G.why = '';
    G.bossIn = false;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedDecor();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isRain() ? '魔雨 · 更密更快' : '骑扫 · 糖林', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'ride';
    G.stage = 0;
    G.lives = LIVES;
    G.bombs = 3;
    G.wpnLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.charge = 0;
    G.deadT = 0;
    G.bossIn = false;
    G.px = 90;
    G.py = VH * 0.5;
    clearField();
    seedDecor();
    G.ents.push(makeBoss('king', '南瓜王', 148));
    G.ents[0].x = VW - 150;
    G.ents[0].y = VH * 0.55;
    G.ents[0].in = false;
    showOverlay(
      'title',
      '魔棉',
      '骑扫帚从左往右扫夜。空格连射并蓄咒，满了放出大魔星。Shift 丢丝爆。撞上就掉命。过关才见 Boss。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('ride');
    else startGame(G.kind || 'ride');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('ride');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('rain');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isRain()) goTitle();
      else startGame('rain');
    }
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
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

  if (btnRide) {
    btnRide.addEventListener('click', function () {
      audio.ensure();
      startGame('ride');
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
      startGame(G.kind);
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && !isRain()) startGame('rain');
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
