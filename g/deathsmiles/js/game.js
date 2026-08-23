'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const LOCK_WIN = 2.05;
  const WPN_MAX = 3;
  const HIT_R = 6.2;
  const SHOT_V = 640;
  const BEST_KEY = 'playbox-deathsmiles-best';
  const MUTE_KEY = 'playbox-deathsmiles-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 锁定余物 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 138];
  const VIO = [196, 77, 255];
  const CYN = [94, 255, 240];
  const GOLD = [255, 227, 107];
  const BLOOD = [255, 61, 106];
  const HOT = [232, 180, 255];
  const MOON = [232, 212, 255];
  const WHT = [244, 232, 255];
  const DEEP = [26, 10, 28];
  const SKIN = [255, 214, 232];
  const HAIR = [236, 228, 255];

  const SCORE = {
    bat: 50,
    ghost: 70,
    garg: 110,
    knight: 140,
    skull: 80,
    coffin: 160,
    extra: 80,
    carrier: 280,
    coin: 28,
    boss: 4200,
    clear: 2000
  };

  const STAGES = [
    {
      id: 0, name: '夜墓', boss: '碑鬼', bossKind: 'tomb', bossHp: 92, hue: 286,
      waves: [
        { t: 0.45, kind: 'bats', n: 5, y: 0.32 },
        { t: 1.4, kind: 'extras', n: 3, variant: 'soul' },
        { t: 2.4, kind: 'ghosts', n: 3 },
        { t: 3.6, kind: 'bats', n: 6, y: 0.62 },
        { t: 4.6, kind: 'extras', n: 4, variant: 'lamp' },
        { t: 5.8, kind: 'dive', n: 4 },
        { t: 7.0, kind: 'coffins', n: 2 },
        { t: 8.0, kind: 'carrier' },
        { t: 8.6, kind: 'skulls', n: 4 },
        { t: 9.8, kind: 'extras', n: 4, variant: 'soul', rain: true },
        { t: 10.4, kind: 'ghosts', n: 4 },
        { t: 11.6, kind: 'bats', n: 7, y: 0.48 },
        { t: 12.8, kind: 'extras', n: 3, variant: 'lamp' },
        { t: 14.0, kind: 'gargs', n: 2 },
        { t: 15.2, kind: 'skulls', n: 5, rain: true },
        { t: 16.4, kind: 'boss' }
      ]
    },
    {
      id: 1, name: '血廊', boss: '血爵', bossKind: 'count', bossHp: 118, hue: 338,
      waves: [
        { t: 0.4, kind: 'gargs', n: 3 },
        { t: 1.5, kind: 'extras', n: 4, variant: 'doll' },
        { t: 2.6, kind: 'knights', n: 2 },
        { t: 3.8, kind: 'ghosts', n: 4 },
        { t: 5.0, kind: 'extras', n: 4, variant: 'soul' },
        { t: 6.2, kind: 'dive', n: 5 },
        { t: 7.2, kind: 'carrier' },
        { t: 8.0, kind: 'coffins', n: 3 },
        { t: 9.2, kind: 'skulls', n: 5, rain: true },
        { t: 10.2, kind: 'extras', n: 5, variant: 'doll' },
        { t: 11.4, kind: 'knights', n: 3 },
        { t: 12.6, kind: 'gargs', n: 3 },
        { t: 13.8, kind: 'ghosts', n: 5 },
        { t: 15.0, kind: 'extras', n: 4, variant: 'lamp', rain: true },
        { t: 16.6, kind: 'boss' }
      ]
    },
    {
      id: 2, name: '亡月', boss: '死笑姬', bossKind: 'smile', bossHp: 156, hue: 268,
      waves: [
        { t: 0.35, kind: 'bats', n: 6, y: 0.28 },
        { t: 1.2, kind: 'extras', n: 5, variant: 'soul' },
        { t: 2.4, kind: 'knights', n: 2 },
        { t: 3.5, kind: 'gargs', n: 3 },
        { t: 4.6, kind: 'extras', n: 5, variant: 'doll' },
        { t: 5.8, kind: 'dive', n: 6 },
        { t: 6.8, kind: 'carrier' },
        { t: 7.6, kind: 'skulls', n: 6, rain: true },
        { t: 8.6, kind: 'coffins', n: 3 },
        { t: 9.8, kind: 'extras', n: 6, variant: 'lamp' },
        { t: 11.0, kind: 'ghosts', n: 5 },
        { t: 12.2, kind: 'knights', n: 3 },
        { t: 13.4, kind: 'gargs', n: 3 },
        { t: 14.6, kind: 'extras', n: 5, variant: 'soul', rain: true },
        { t: 15.6, kind: 'dive', n: 5 },
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
  const btnNight = document.getElementById('btn-night');
  const btnSea = document.getElementById('btn-sea');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
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
  const lockWrap = document.getElementById('lock-wrap');
  const lockBar = document.getElementById('lock-bar');

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

  const keys = { l: false, r: false, u: false, d: false, lock: false };
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const motes = [];
  const tombs = [];
  const columns = [];

  const G = {
    mode: 'title',
    kind: 'night',
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
    lockN: 0,
    lockChain: 0,
    lockChainT: 0,
    lockHold: false,
    lockCd: 0,
    lockAcq: 0,
    wpnLv: 0,
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
  function isSea() {
    return G.kind === 'sea';
  }
  function stageOf(i) {
    return STAGES[i] || STAGES[0];
  }
  function comboMul(c) {
    return 1 + Math.min(4, Math.floor(Math.max(0, c - 1) / 3));
  }
  function maxLocks() {
    return isSea() ? 6 : 4;
  }
  function plySpd() {
    return (isSea() ? 318 : 276) + G.wpnLv * 8;
  }
  function scrollSpd() {
    if (G.bossIn) return isSea() ? 30 : 22;
    const base = isSea() ? 124 : 88;
    const rush = G.combo >= 8 ? 14 : G.combo >= 4 ? 7 : 0;
    return base + rush + G.stage * 6;
  }
  function hpMul() {
    return isSea() ? 1.28 : 1;
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
    return G.wpnLv <= 0 ? '刃' : G.wpnLv === 1 ? '双刃' : G.wpnLv === 2 ? '扇刃' : '满开';
  }
  function kindName() {
    return isSea() ? '亡海' : '夜巡';
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
      this.beep(840 + G.wpnLv * 46, 0.042, 'square', 0.026, 1680);
    },
    lockOn() {
      this.ensure();
      this.beep(740, 0.07, 'triangle', 0.038, 1480);
      this.beep(1180, 0.09, 'sine', 0.028, 1760);
    },
    lockShot() {
      this.ensure();
      this.beep(1320 + G.lockN * 40, 0.036, 'sine', 0.022, 1980);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.03, 0.028, 1500);
      this.beep(640 * lift, 0.055, 'square', 0.038, 1140 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.09, big ? 0.074 : 0.044, big ? 200 : 480);
      this.beep(big ? 160 : 280, big ? 0.26 : 0.12, 'sawtooth', 0.05, 52);
    },
    extra() {
      this.ensure();
      this.beep(880, 0.1, 'triangle', 0.046, 1760);
      this.beep(1320, 0.14, 'sine', 0.034, 1980);
      this.noise(0.08, 0.03, 1200);
    },
    coin() {
      this.ensure();
      this.beep(1046, 0.07, 'square', 0.034, 1568);
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

  function countLocks() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.extra && e.locked && !e.dead) n += 1;
    }
    G.lockN = n;
    return n;
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
      tagLabel.classList.toggle('warn', isSea() && !G.bossIn);
      tagLabel.classList.toggle('hot', G.bossIn);
    }
    if (wpnLabel) wpnLabel.textContent = wpnText();
    const mx = maxLocks();
    const n = countLocks();
    if (lockBar) lockBar.style.transform = 'scaleX(' + clamp(n / mx, 0, 1) + ')';
    if (lockWrap) lockWrap.classList.toggle('full', n >= mx);
    if (hintEl) {
      hintEl.classList.toggle('hot', G.bossIn);
      hintEl.classList.toggle('warn', G.lives <= 1 && G.mode === 'play');
      if (G.mode === 'title') hintEl.textContent = '空格连射 · Shift 锁余物 · 锁住再打才高分 · 撞上掉命';
      else if (G.bossIn) hintEl.textContent = st.boss + ' · 锁余物打高分 · 撞上掉命';
      else hintEl.textContent = st.name + ' · 空格射击 · Shift 锁定余物';
    }
    if (comboEl) {
      if (G.mode === 'play' && (G.combo >= 2 || G.lockChain >= 2)) {
        comboEl.hidden = false;
        comboEl.textContent = G.lockChain >= 2
          ? '锁 ×' + G.lockChain + '  ·  ×' + G.mult
          : '连击 ×' + G.combo;
      } else comboEl.hidden = true;
    }
    syncPips();
    if (btnLock) btnLock.classList.toggle('on', !!G.lockHold);
    if (btnPad) btnPad.classList.toggle('on', !!G.lockHold);
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DSML';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (btnOvRetry) btnOvRetry.textContent = '再巡';
    if (btnOvModes) {
      if (kind === 'win' && !isSea()) btnOvModes.textContent = '亡海';
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
    const cls = mag >= 6.5 ? 'die' : G.lockHold && mag < 3.2 ? 'lock' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('lock');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
        stageEl.classList.remove('lock');
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

  function bumpLockChain() {
    G.lockChain += 1;
    G.lockChainT = LOCK_WIN;
    if (G.lockChain === 4 || G.lockChain === 8 || G.lockChain === 12) {
      toast('锁链 ×' + G.lockChain, false, true);
      audio.combo(2 + Math.min(3, G.lockChain / 4));
    }
  }

  function seedDecor() {
    stars.length = 0;
    motes.length = 0;
    tombs.length = 0;
    columns.length = 0;
    for (let i = 0; i < 52; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH * 0.7),
        s: rand(0.5, 2.2),
        a: rand(0.16, 0.72),
        tw: rand(0, TAU)
      });
    }
    for (let i = 0; i < 38; i++) {
      motes.push({
        x: rand(0, VW),
        y: rand(0, VH),
        s: rand(1.1, 3.2),
        v: rand(20, 62),
        a: rand(0.18, 0.52),
        rgb: i % 3 === 0 ? GOLD : i % 3 === 1 ? VIO : CYN
      });
    }
    for (let i = 0; i < 10; i++) {
      tombs.push({
        x: rand(0, VW),
        y: VH - rand(10, 28),
        h: rand(28, 64),
        w: rand(14, 22),
        k: (hash2(i + 21) * 3) | 0
      });
    }
    for (let i = 0; i < 7; i++) {
      columns.push({
        x: rand(0, VW),
        y: VH,
        h: rand(90, 180),
        w: rand(10, 18)
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
    return {
      x: x, y: y, vx: vx, vy: vy || 0,
      r: extra && extra.r ? extra.r : 3.5,
      life: extra && extra.life ? extra.life : 0.9,
      dmg: dmg || 1, dead: false,
      lock: !!(extra && extra.lock),
      target: extra && extra.target ? extra.target : null,
      spin: 0, hits: 0
    };
  }

  function makeEShot(x, y, vx, vy, r, rgb) {
    return { x: x, y: y, vx: vx, vy: vy, r: r || 3.5, life: 2.7, rgb: rgb || BLOOD, dead: false };
  }

  function aimShot(x, y, tx, ty, spd, r, rgb) {
    const d = hypot(tx - x, ty - y) || 1;
    return makeEShot(x, y, (tx - x) / d * spd, (ty - y) / d * spd, r, rgb);
  }

  function nextDrop() {
    const cycle = ['power', 'coin', 'power'];
    const k = cycle[G.dropI % cycle.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vx: -36, vy: rand(-34, 34), kind: kind || 'coin',
      t: 0, dead: false, magnet: kind === 'coin'
    });
  }

  function makeBat(x, y, amp) {
    return {
      type: 'bat', x: x, y: y, baseY: y, w: 20, h: 14, hp: 1, score: SCORE.bat,
      vx: isSea() ? -158 : -126, amp: amp || 22, bob: rand(0, TAU), dead: false, hitT: 0
    };
  }

  function makeGhost(x, y) {
    return {
      type: 'ghost', x: x, y: y, baseY: y, w: 18, h: 20, hp: 2, score: SCORE.ghost,
      vx: isSea() ? -96 : -76, bob: rand(0, TAU), amp: 34, cd: rand(0.5, 1.2),
      dead: false, hitT: 0
    };
  }

  function makeGarg(x, y) {
    return {
      type: 'garg', x: x, y: y, w: 26, h: 22, hp: 3, score: SCORE.garg,
      vx: isSea() ? -72 : -56, vy: 0, cd: rand(0.6, 1.3), dead: false, hitT: 0, bob: rand(0, TAU)
    };
  }

  function makeKnight(x, y) {
    return {
      type: 'knight', x: x, y: y, w: 22, h: 28, hp: 4, score: SCORE.knight,
      vx: isSea() ? -58 : -46, cd: rand(0.7, 1.4), dead: false, hitT: 0
    };
  }

  function makeSkull(x, y) {
    return {
      type: 'skull', x: x, y: y, w: 16, h: 16, hp: 1, score: SCORE.skull,
      vx: isSea() ? -118 : -94, vy: rand(-80, 80), dead: false, hitT: 0, spin: rand(0, TAU)
    };
  }

  function makeCoffin(x, y) {
    return {
      type: 'coffin', x: x, y: y, w: 22, h: 30, hp: 4, score: SCORE.coffin,
      vx: isSea() ? -86 : -68, ground: true, cd: rand(0.4, 1.0), dead: false, hitT: 0, open: 0
    };
  }

  function makeExtra(x, y, variant) {
    const v = variant || (['soul', 'lamp', 'doll'][(Math.random() * 3) | 0]);
    return {
      type: 'extra', extra: true, variant: v, x: x, y: y, baseY: y,
      w: 16, h: 16, hp: 2, score: SCORE.extra,
      vx: isSea() ? -74 : -58, bob: rand(0, TAU), amp: 24 + rand(0, 22),
      locked: false, lockI: 0, dead: false, hitT: 0
    };
  }

  function makeCarrier(x, y) {
    return {
      type: 'carrier', extra: false, x: x, y: y, w: 32, h: 20, hp: 5, score: SCORE.carrier,
      vx: isSea() ? -64 : -50, drop: true, dead: false, hitT: 0, bob: rand(0, TAU)
    };
  }

  function makeBoss(kind, name, hp) {
    return {
      type: 'boss', kind: kind, name: name, x: VW + 80, y: VH * 0.5,
      w: kind === 'smile' ? 108 : kind === 'count' ? 96 : 100,
      h: kind === 'smile' ? 80 : kind === 'count' ? 72 : 86,
      hp: Math.round(hp * hpMul()), maxhp: Math.round(hp * hpMul()),
      score: SCORE.boss, vx: -70, vy: 0, t: 0, cd: 0.8, extraCd: 1.6, phase: 1,
      in: true, dead: false, hitT: 0, flash: 0, bob: 0
    };
  }

  function spawnWave(w) {
    if (w.rain && !isSea()) return;
    const n = (w.n || 1) + (isSea() && !w.rain ? 1 : 0);
    const y = (w.y || 0.5) * VH;
    if (w.kind === 'bats') {
      for (let i = 0; i < n; i++) G.ents.push(makeBat(VW + 24 + i * 28, y + rand(-16, 16), 18 + i * 3));
    } else if (w.kind === 'ghosts') {
      for (let i = 0; i < n; i++) G.ents.push(makeGhost(VW + 22 + i * 34, 70 + (i % 4) * 70));
    } else if (w.kind === 'gargs') {
      for (let i = 0; i < n; i++) G.ents.push(makeGarg(VW + 30 + i * 44, 80 + i * 70));
    } else if (w.kind === 'knights') {
      for (let i = 0; i < n; i++) G.ents.push(makeKnight(VW + 36 + i * 50, 90 + i * 80));
    } else if (w.kind === 'skulls') {
      for (let i = 0; i < n; i++) G.ents.push(makeSkull(VW + 18 + i * 26, rand(50, VH - 50)));
    } else if (w.kind === 'coffins') {
      for (let i = 0; i < n; i++) G.ents.push(makeCoffin(VW + 40 + i * 70, VH - 34));
    } else if (w.kind === 'extras') {
      const v = w.variant || 'soul';
      for (let i = 0; i < n; i++) {
        G.ents.push(makeExtra(VW + 20 + i * 30, 60 + (i % 5) * 64, v));
      }
    } else if (w.kind === 'dive') {
      for (let i = 0; i < n; i++) {
        const b = makeBat(VW + 16 + i * 22, 36 + (i % 2) * (VH - 80), 8);
        b.dive = true;
        G.ents.push(b);
      }
    } else if (w.kind === 'carrier') {
      G.ents.push(makeCarrier(VW + 30, VH * 0.42));
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
    const rgb = e.extra
      ? (e.locked ? GOLD : CYN)
      : e.type === 'boss' ? GOLD
        : e.type === 'knight' || e.type === 'coffin' ? VIO
          : e.type === 'garg' ? BLOOD : HOT;
    emit(big ? 30 : e.extra && e.locked ? 22 : 12, {
      x: e.x, y: e.y, j: big ? 28 : 10,
      vx0: -170, vx1: 170, vy0: -170, vy1: 170,
      r0: 1.6, r1: big ? 6.2 : 3.4, life: big ? 0.56 : 0.32, rgb: rgb, g: 70
    });
    popSpark(e.x, e.y, rgb, big ? 36 : e.extra && e.locked ? 24 : 16);
    if (e.extra && e.locked) audio.extra();
    else audio.boom(big);
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    const locked = !!(e.extra && e.locked);
    let pts;
    if (locked) {
      bumpLockChain();
      pts = Math.round((e.score || 80) * (1 + G.lockChain) * G.mult);
    } else {
      pts = Math.round((e.score || 50) * G.mult);
    }
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, locked ? '锁 +' + pts : '+' + pts, locked ? GOLD : WHT, locked || e.type === 'boss' || pts >= 280);
    explodeEnt(e, e.type === 'boss' || e.type === 'carrier' || locked);
    if (locked) {
      const coins = 2 + Math.min(3, G.lockChain >> 1);
      for (let i = 0; i < coins; i++) spawnPow(e.x + rand(-8, 8), e.y + rand(-8, 8), 'coin');
      if (G.lockChain % 3 === 0) spawnPow(e.x, e.y, 'power');
      hitStop(clamp(0.046 + G.lockChain * 0.004, 0.046, 0.078));
      kick(3.4);
    } else {
      if (e.type === 'carrier' && e.drop) {
        spawnPow(e.x, e.y, nextDrop());
        for (let k = 0; k < 3; k++) G.ents.push(makeExtra(e.x + rand(-12, 12), e.y + rand(-18, 18), 'soul'));
      }
      if (e.type === 'boss') onBossDown(e);
      hitStop(e.type === 'boss' ? 0.08 : clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
      kick(e.type === 'boss' ? 7.6 : 2.5);
    }
    syncHud();
  }

  function hurtEnt(e, dmg, hx, hy, fromLock) {
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
      r0: 1, r1: 2.4, life: 0.18, rgb: fromLock ? CYN : GOLD, g: 0
    });
    hitStop(fromLock ? 0.028 : 0.03);
  }

  function onBossDown(e) {
    G.bossIn = false;
    addScore(Math.round(1500 * (G.stage + 1) * G.mult));
    addScore(SCORE.clear);
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
    const spd = SHOT_V;
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
    if (!REDUCE) {
      emit(2, {
        x: x, y: y, j: 2,
        vx0: 40, vx1: 90, vy0: -20, vy1: 20,
        r0: 1, r1: 2, life: 0.12, rgb: VIO, g: 0
      });
    }
  }

  function acquireLocks() {
    const mx = maxLocks();
    let n = countLocks();
    if (n >= mx) return;
    let best = null;
    let bestD = 9999;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.extra || e.dead || e.locked) continue;
      if (e.x < G.px - 16 || e.x > VW + 8) continue;
      const d = hypot(e.x - G.px, e.y - G.py);
      if (d < bestD && d < 460) {
        best = e;
        bestD = d;
      }
    }
    if (!best) return;
    n += 1;
    best.locked = true;
    best.lockI = n;
    G.lockN = n;
    popSpark(best.x, best.y, CYN, 18);
    floatText(best.x, best.y - 14, '锁', CYN, false);
    audio.lockOn();
    hitStop(0.022);
    kick(1.6);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('lock');
      void stageEl.offsetWidth;
      stageEl.classList.add('lock');
    }
    syncHud();
  }

  function fireLock() {
    if (G.mode !== 'play' || G.deadT > 0 || G.lockCd > 0) return;
    const locked = [];
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.extra && e.locked && !e.dead) locked.push(e);
    }
    if (!locked.length) return;
    if (G.shots.length > 90) return;
    G.lockCd = 0.082;
    G.muzzle = Math.max(G.muzzle, 0.04);
    audio.lockShot();
    const cap = Math.min(locked.length, isSea() ? 6 : 4);
    for (let i = 0; i < cap; i++) {
      const e = locked[i];
      const ang = Math.atan2(e.y - G.py, e.x - G.px);
      G.shots.push(makeShot(
        G.px + 14, G.py,
        Math.cos(ang) * 340, Math.sin(ang) * 340,
        1,
        { r: 3.2, life: 1.35, lock: true, target: e }
      ));
    }
  }

  function collectPow(p) {
    if (p.kind === 'power') {
      if (G.wpnLv < WPN_MAX) {
        G.wpnLv += 1;
        flashWpn();
        toast(wpnText(), false, true);
      } else addScore(500 * G.mult);
      audio.pow();
      popSpark(G.px, G.py, GOLD, 20);
    } else {
      const n = Math.round(SCORE.coin * (1 + G.lockChain * 0.35) * G.mult);
      addScore(n);
      audio.coin();
      floatText(p.x, p.y - 8, '+' + n, GOLD, false);
    }
    emit(8, {
      x: p.x, y: p.y, j: 8,
      vx0: -70, vx1: 70, vy0: -90, vy1: 40,
      r0: 1.2, r1: 3, life: 0.28, rgb: p.kind === 'power' ? VIO : GOLD, g: 80
    });
    syncHud();
  }

  function hurtPlayer(why) {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.why = why || 'crash';
    G.lives -= 1;
    G.deadT = 0.95;
    setLock(false);
    G.lockN = 0;
    G.lockChain = 0;
    G.lockChainT = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].extra) G.ents[i].locked = false;
    }
    emit(34, {
      x: G.px, y: G.py, j: 18,
      vx0: -220, vx1: 220, vy0: -220, vy1: 220,
      r0: 2, r1: 6.4, life: 0.52, rgb: MAG, g: 40
    });
    popSpark(G.px, G.py, MAG, 40);
    screenFlash(MAG, 0.42);
    hitStop(0.075);
    kick(7.4);
    if (G.lives <= 0) audio.death();
    else audio.hurt();
    if (G.wpnLv > 0) {
      spawnPow(G.px + 18, G.py, 'power');
      G.wpnLv = Math.max(0, G.wpnLv - 1);
    }
    for (let i = 0; i < G.eShots.length; i++) G.eShots[i].dead = true;
    syncHud();
  }

  function respawn() {
    G.px = 90;
    G.py = VH * 0.5;
    G.invuln = 1.55;
    G.deadT = 0;
    G.fireHold = false;
    if (keys.lock) setLock(true);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '笑停了', '余物没锁住，墓园把你留下了。分数 ' + G.score + '。');
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    addScore(8000);
    audio.win();
    showOverlay('win', isSea() ? '亡海退了' : '夜尽了', '三夜打穿。死笑姬倒下了。分数 ' + G.score + '。');
    syncHud();
  }

  function updateFx(dt) {
    if (G.stop > 0) G.stop = Math.max(0, G.stop - dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.6);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.fireCd > 0) G.fireCd = Math.max(0, G.fireCd - dt);
    if (G.lockCd > 0) G.lockCd = Math.max(0, G.lockCd - dt);
    if (G.lockAcq > 0) G.lockAcq = Math.max(0, G.lockAcq - dt);
    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        if (comboEl && G.lockChain < 2) comboEl.hidden = true;
      }
    }
    if (G.lockChainT > 0) {
      G.lockChainT -= dt;
      if (G.lockChainT <= 0) {
        G.lockChain = 0;
        if (comboEl && G.combo < 2) comboEl.hidden = true;
      }
    }
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
        s.y = rand(0, VH * 0.7);
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
    for (let i = 0; i < tombs.length; i++) {
      const t = tombs[i];
      t.x -= sc * 0.48 * dt;
      if (t.x < -40) {
        t.x = VW + rand(10, 80);
        t.h = rand(28, 64);
        t.k = (hash2((G.scroll | 0) + i) * 3) | 0;
      }
    }
    for (let i = 0; i < columns.length; i++) {
      const c = columns[i];
      c.x -= sc * 0.38 * dt;
      if (c.x < -40) {
        c.x = VW + rand(20, 90);
        c.h = rand(90, 180);
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

  function spawnBossExtra(e) {
    const v = e.kind === 'count' ? 'doll' : e.kind === 'smile' ? 'soul' : 'lamp';
    G.ents.push(makeExtra(e.x - 20, e.y + rand(-50, 50), v));
  }

  function updateBoss(e, dt) {
    e.t += dt;
    e.cd -= dt;
    e.extraCd -= dt;
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
      toast(e.name + ' 笑了', false, true);
      audio.boss();
      screenFlash(BLOOD, 0.28);
    }
    if (e.extraCd <= 0) {
      spawnBossExtra(e);
      if (e.phase === 2) spawnBossExtra(e);
      e.extraCd = isSea() ? 1.15 : 1.55;
    }
    const rain = isSea() ? 0.82 : 1;
    if (e.kind === 'tomb') {
      e.y = VH * 0.5 + Math.sin(e.t * 1.4) * 88;
      if (e.phase === 2) e.x = 640 + Math.sin(e.t * 1.05) * 64;
      if (e.cd <= 0) {
        fanShot(e.x - 30, e.y, e.phase === 2 ? 7 : 5, isSea() ? 168 : 138, 0.22, VIO);
        if (e.phase === 2) G.eShots.push(aimShot(e.x - 20, e.y, G.px, G.py, isSea() ? 188 : 148, 4, GOLD));
        e.cd = (e.phase === 2 ? 0.74 : 1.06) * rain;
      }
    } else if (e.kind === 'count') {
      e.y = lerp(e.y, VH * (0.3 + 0.2 * (1 + Math.sin(e.t * 0.72))), 0.04);
      e.x = 630 + Math.sin(e.t * 0.58) * 26;
      if (e.cd <= 0) {
        if (((e.t * 2) | 0) % 2 === 0) {
          ringShot(e.x - 10, e.y, e.phase === 2 ? 14 : 10, isSea() ? 128 : 106, BLOOD, e.t);
        } else {
          for (let k = 0; k < (e.phase === 2 ? 5 : 3); k++) {
            G.eShots.push(aimShot(e.x - 24, e.y + 8, G.px, G.py, 148 + k * 18, 3.6, GOLD));
          }
        }
        e.cd = (e.phase === 2 ? 0.78 : 1.12) * rain;
      }
    } else {
      e.y = VH * 0.5 + Math.sin(e.t * 0.92) * 72;
      e.x = 620 + Math.cos(e.t * 0.5) * 30;
      if (e.cd <= 0) {
        const n = e.phase === 2 ? 10 : 7;
        for (let i = 0; i < n; i++) {
          const a = -0.7 + i * (1.4 / Math.max(1, n - 1)) + Math.sin(e.t) * 0.1;
          G.eShots.push(makeEShot(e.x - 36, e.y, Math.cos(a) * -152, Math.sin(a) * 152, 3.8, VIO));
        }
        if (e.phase === 2) {
          ringShot(e.x, e.y, 12, isSea() ? 118 : 94, GOLD, e.t * 0.7);
          G.eShots.push(aimShot(e.x - 20, e.y, G.px, G.py, isSea() ? 198 : 158, 5, CYN));
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
          e.y += clamp(G.py - e.y, -90, 90) * dt * 1.4;
        } else {
          e.bob += dt * 3.2;
          e.y = e.baseY + Math.sin(e.bob) * e.amp;
        }
      } else if (e.type === 'ghost') {
        e.bob += dt * 2.4;
        e.y = e.baseY + Math.sin(e.bob) * e.amp;
        e.x += Math.cos(e.bob * 0.7) * 26 * dt;
        e.cd -= dt;
        if (e.cd <= 0) {
          G.eShots.push(makeEShot(e.x, e.y, -48, 64, 3.2, HOT));
          e.cd = isSea() ? 1.05 : 1.38;
        }
      } else if (e.type === 'garg') {
        e.bob += dt * 1.6;
        e.y += Math.sin(e.bob) * 18 * dt;
        e.vy = (G.py - e.y) * 0.55;
        e.y += e.vy * dt * 0.12;
        e.cd -= dt;
        if (e.cd <= 0) {
          G.eShots.push(aimShot(e.x - 8, e.y, G.px, G.py, isSea() ? 152 : 120, 3.5, BLOOD));
          e.cd = isSea() ? 1.18 : 1.5;
        }
      } else if (e.type === 'knight') {
        e.cd -= dt;
        if (e.cd <= 0) {
          fanShot(e.x - 8, e.y, 3, isSea() ? 138 : 112, 0.26, VIO);
          e.cd = isSea() ? 1.22 : 1.55;
        }
      } else if (e.type === 'skull') {
        e.y += e.vy * dt;
        e.spin += dt * 7;
        if (e.y < 18 || e.y > VH - 18) e.vy *= -1;
      } else if (e.type === 'coffin') {
        e.open = Math.min(1, e.open + dt * 0.6);
        e.cd -= dt;
        if (e.cd <= 0) {
          G.eShots.push(aimShot(e.x, e.y - 12, G.px, G.py, isSea() ? 154 : 122, 3.6, GOLD));
          e.cd = isSea() ? 1.08 : 1.42;
        }
      } else if (e.type === 'extra') {
        e.bob += dt * (e.locked ? 4.2 : 2.6);
        e.y = e.baseY + Math.sin(e.bob) * e.amp;
        if (e.locked) {
          e.x += Math.cos(e.bob * 0.9) * 18 * dt;
          e.vx = Math.max(e.vx, isSea() ? -42 : -32);
        }
      } else if (e.type === 'carrier') {
        e.bob += dt * 1.8;
        e.y += Math.sin(e.bob) * 14 * dt;
      }
      if (G.deadT <= 0 && !e.ground && hypot(e.x - G.px, e.y - G.py) < HIT_R + Math.min(e.w, e.h) * 0.28) {
        hurtPlayer('crash');
      }
      if (e.x < -50 || e.y < -60 || e.y > VH + 60) e.dead = true;
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.lock && s.target && !s.target.dead) {
        const dx = s.target.x - s.x;
        const dy = s.target.y - s.y;
        const d = hypot(dx, dy) || 1;
        const spd = 560;
        s.vx = lerp(s.vx, dx / d * spd, 0.22);
        s.vy = lerp(s.vy, dy / d * spd, 0.22);
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      s.spin += dt * 12;
      if (s.life <= 0 || s.x > VW + 36 || s.x < -24 || s.y < -24 || s.y > VH + 24) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const e = G.ents[j];
        if (e.dead) continue;
        if (s.lock && !e.extra && e.type !== 'boss') continue;
        if (bodyHit(e, s.x, s.y, s.r)) {
          let dmg = s.dmg;
          if (s.lock && e.type === 'boss') dmg = 0.35;
          if (!s.lock && e.extra && !e.locked) dmg = 0.55;
          hurtEnt(e, dmg, s.x, s.y, !!s.lock);
          s.dead = true;
          hit = true;
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
      if (p.kind === 'coin' && G.deadT <= 0) {
        const dx = G.px - p.x;
        const dy = G.py - p.y;
        const d = hypot(dx, dy) || 1;
        p.vx = lerp(p.vx, dx / d * 280, 0.12);
        p.vy = lerp(p.vy, dy / d * 280, 0.12);
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind !== 'coin') {
        p.vy += Math.sin(p.t * 4) * 8 * dt;
        if (p.y < 20 || p.y > VH - 20) p.vy *= -0.8;
      }
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
    if (G.fireHold && G.deadT <= 0) fire();
    if (G.lockHold && G.deadT <= 0) {
      if (G.lockAcq <= 0) {
        acquireLocks();
        G.lockAcq = 0.07;
      }
      fireLock();
    }
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
    countLocks();
    if (lockBar) lockBar.style.transform = 'scaleX(' + clamp(G.lockN / maxLocks(), 0, 1) + ')';
    if (lockWrap) lockWrap.classList.toggle('full', G.lockN >= maxLocks());
    if (comboEl) {
      if (G.combo >= 2 || G.lockChain >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.lockChain >= 2
          ? '锁 ×' + G.lockChain + '  ·  ×' + G.mult
          : '连击 ×' + G.combo;
      } else comboEl.hidden = true;
    }
  }

  function starPath(c, x, y, r, n, t) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n;
      const rad = i % 2 === 0 ? r : r * t;
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
    const top = hueRgb(hue, 0.55, 0.08);
    const bot = hueRgb(hue + 18, 0.4, 0.04);
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, rgba(top, 1));
    g.addColorStop(1, rgba(bot, 1));
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const moonX = sx(VW * 0.78);
    const moonY = sy(G.stage === 2 ? 78 : 64);
    const moonR = (G.stage === 2 ? 54 : 38) * scale;
    c.fillStyle = rgba(GOLD, G.stage === 2 ? 0.22 : 0.14);
    c.beginPath();
    c.arc(moonX, moonY, moonR * 1.45, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.88);
    c.beginPath();
    c.arc(moonX, moonY, moonR, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.85);
    c.beginPath();
    c.arc(moonX + moonR * 0.38, moonY - moonR * 0.18, moonR * 0.78, 0, TAU);
    c.fill();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.55 + 0.45 * Math.sin(s.tw));
      c.fillStyle = rgba(i % 5 === 0 ? GOLD : WHT, a);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.s * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      c.fillStyle = rgba(m.rgb, m.a);
      c.beginPath();
      c.arc(sx(m.x), sy(m.y), m.s * scale, 0, TAU);
      c.fill();
    }

    if (G.stage !== 1) {
      c.fillStyle = rgba(DEEP, 0.85);
      for (let i = 0; i < tombs.length; i++) {
        const t = tombs[i];
        const x = sx(t.x);
        const y = sy(t.y);
        const w = t.w * scale;
        const h = t.h * scale;
        c.fillRect(x - w * 0.5, y - h, w, h);
        c.beginPath();
        c.arc(x, y - h, w * 0.5, Math.PI, 0);
        c.fill();
        c.fillStyle = rgba(VIO, 0.28);
        c.fillRect(x - w * 0.18, y - h * 0.55, w * 0.36, h * 0.22);
        c.fillStyle = rgba(DEEP, 0.85);
      }
    }
    if (G.stage >= 1) {
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        c.fillStyle = rgba(hueRgb(st.hue, 0.25, 0.12), 0.7);
        c.fillRect(sx(col.x), sy(VH - col.h), col.w * scale, col.h * scale);
        c.fillStyle = rgba(BLOOD, 0.18);
        c.fillRect(sx(col.x + col.w * 0.35), sy(VH - col.h * 0.7), 2 * scale, col.h * 0.5 * scale);
      }
    }

    c.fillStyle = rgba(DEEP, 0.92);
    c.fillRect(sx(0), sy(VH - 16), VW * scale, 18 * scale);
    c.fillStyle = rgba(VIO, 0.12);
    c.fillRect(sx(0), sy(VH - 18), VW * scale, 3 * scale);
  }

  function drawGirl() {
    if (G.deadT > 0) return;
    const c = ctx;
    const x = sx(G.px);
    const y = sy(G.py);
    const s = scale;
    const blink = G.invuln > 0 && ((G.invuln * 18) | 0) % 2 === 0;
    if (blink) c.globalAlpha = 0.45;
    c.save();
    c.translate(x, y);
    c.rotate(G.lean * 0.18);

    if (G.lockHold) {
      c.strokeStyle = rgba(CYN, 0.45 + 0.25 * Math.sin(G.t * 10));
      c.lineWidth = Math.max(1.2, 1.6 * s);
      c.beginPath();
      c.arc(0, 0, (16 + Math.sin(G.t * 8) * 2) * s, 0, TAU);
      c.stroke();
    }

    c.fillStyle = rgba(VIO, 0.28);
    c.beginPath();
    c.ellipse(-10 * s, 4 * s, 12 * s, 4 * s, -0.3, 0, TAU);
    c.fill();

    c.fillStyle = rgba([80, 24, 110], 0.95);
    c.beginPath();
    c.moveTo(-4 * s, 2 * s);
    c.lineTo(8 * s, 4 * s);
    c.lineTo(4 * s, 16 * s);
    c.lineTo(-10 * s, 14 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.7);
    c.fillRect(-2 * s, 4 * s, 8 * s, 1.4 * s);

    c.fillStyle = rgba(SKIN, 1);
    c.beginPath();
    c.arc(4 * s, -6 * s, 6.2 * s, 0, TAU);
    c.fill();

    c.fillStyle = rgba(HAIR, 0.95);
    c.beginPath();
    c.moveTo(-8 * s, -4 * s);
    c.quadraticCurveTo(-18 * s, 2 * s, -14 * s, 12 * s);
    c.quadraticCurveTo(-6 * s, 2 * s, 2 * s, -8 * s);
    c.quadraticCurveTo(10 * s, -18 * s, 12 * s, -8 * s);
    c.lineTo(8 * s, -4 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(VIO, 0.95);
    c.beginPath();
    c.moveTo(-1 * s, -8 * s);
    c.lineTo(5 * s, -18 * s);
    c.lineTo(11 * s, -8 * s);
    c.closePath();
    c.fill();

    c.fillStyle = rgba(DEEP, 0.92);
    c.beginPath();
    c.arc(6.2 * s, -5.6 * s, 1.05 * s, 0, TAU);
    c.fill();
    c.fillStyle = rgba(BLOOD, 0.7);
    c.beginPath();
    c.arc(5.6 * s, -3.2 * s, 1.1 * s, 0, TAU);
    c.fill();

    c.fillStyle = rgba(CYN, 0.95);
    c.fillRect(10 * s, -2 * s, 14 * s, 2.4 * s);
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.moveTo(24 * s, -4 * s);
    c.lineTo(32 * s, -1 * s);
    c.lineTo(24 * s, 2.4 * s);
    c.closePath();
    c.fill();

    if (G.muzzle > 0) {
      c.fillStyle = rgba(G.lockHold ? CYN : GOLD, clamp(G.muzzle * 10, 0, 1));
      c.beginPath();
      c.arc(28 * s, 0, (5 + G.muzzle * 40) * s, 0, TAU);
      c.fill();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  function drawLockBeams() {
    const c = ctx;
    if (G.deadT > 0) return;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.extra || !e.locked || e.dead) continue;
      c.strokeStyle = rgba(CYN, 0.35 + 0.2 * Math.sin(G.t * 12 + e.lockI));
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.setLineDash([4 * scale, 5 * scale]);
      c.beginPath();
      c.moveTo(sx(G.px + 10), sy(G.py));
      c.lineTo(sx(e.x), sy(e.y));
      c.stroke();
      c.setLineDash([]);
      const r = (12 + Math.sin(G.t * 8 + e.lockI) * 2) * scale;
      c.save();
      c.translate(sx(e.x), sy(e.y));
      c.rotate(G.t * 2.2 + e.lockI);
      c.strokeStyle = rgba(CYN, 0.9);
      c.lineWidth = Math.max(1.2, 1.6 * scale);
      c.strokeRect(-r, -r, r * 2, r * 2);
      c.restore();
      c.fillStyle = rgba(GOLD, 0.95);
      c.font = '700 ' + Math.round(10 * scale) + 'px sans-serif';
      c.textAlign = 'center';
      c.fillText(String(e.lockI), sx(e.x), sy(e.y - 16));
    }
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
      c.fillStyle = rgba(VIO, 0.95);
      c.beginPath();
      c.ellipse(x, y, 7 * s, 5 * s, 0, 0, TAU);
      c.fill();
      const flap = Math.sin(G.t * 12 + e.x) * 0.5;
      c.fillStyle = rgba(HOT, 0.85);
      c.beginPath();
      c.ellipse(x - 10 * s, y, 8 * s, (3.2 + flap) * s, -0.4, 0, TAU);
      c.ellipse(x + 10 * s, y, 8 * s, (3.2 + flap) * s, 0.4, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 2 * s, y, 1 * s, 0, TAU);
      c.arc(x + 2.4 * s, y, 1 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'ghost') {
      c.fillStyle = rgba(MOON, 0.28);
      c.beginPath();
      c.arc(x, y, 12 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MOON, 0.9);
      c.beginPath();
      c.arc(x, y - 2 * s, 8 * s, Math.PI, 0);
      c.lineTo(x + 8 * s, y + 10 * s);
      c.quadraticCurveTo(x + 3 * s, y + 6 * s, x, y + 11 * s);
      c.quadraticCurveTo(x - 4 * s, y + 6 * s, x - 8 * s, y + 10 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.85);
      c.beginPath();
      c.arc(x - 2.6 * s, y - 2 * s, 1.2 * s, 0, TAU);
      c.arc(x + 2.8 * s, y - 2 * s, 1.2 * s, 0, TAU);
      c.fill();
    } else if (e.type === 'garg') {
      c.fillStyle = rgba(BLOOD, 0.92);
      c.beginPath();
      c.moveTo(x, y - 12 * s);
      c.lineTo(x + 14 * s, y + 8 * s);
      c.lineTo(x - 14 * s, y + 8 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 3 * s, y, 1.4 * s, 0, TAU);
      c.arc(x + 4 * s, y, 1.4 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.8);
      c.fillRect(x - 2 * s, y + 4 * s, 4 * s, 3 * s);
    } else if (e.type === 'knight') {
      c.fillStyle = rgba(VIO, 0.95);
      c.fillRect(x - 8 * s, y - 10 * s, 16 * s, 20 * s);
      c.fillStyle = rgba(GOLD, 0.85);
      c.beginPath();
      c.arc(x, y - 14 * s, 6 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.fillRect(x - 3 * s, y - 16 * s, 6 * s, 3 * s);
      c.strokeStyle = rgba(WHT, 0.5);
      c.lineWidth = Math.max(1, 1.2 * s);
      c.beginPath();
      c.moveTo(x + 10 * s, y - 8 * s);
      c.lineTo(x + 16 * s, y + 10 * s);
      c.stroke();
    } else if (e.type === 'skull') {
      c.save();
      c.translate(x, y);
      c.rotate(e.spin || 0);
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(0, -1 * s, 7 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.92);
      c.beginPath();
      c.arc(-2.4 * s, -1.4 * s, 1.6 * s, 0, TAU);
      c.arc(2.6 * s, -1.4 * s, 1.6 * s, 0, TAU);
      c.fill();
      c.fillRect(-2 * s, 3 * s, 4 * s, 2 * s);
      c.restore();
    } else if (e.type === 'coffin') {
      c.fillStyle = rgba([70, 28, 48], 0.95);
      c.fillRect(x - 10 * s, y - 16 * s, 20 * s, 30 * s);
      c.strokeStyle = rgba(GOLD, 0.55);
      c.lineWidth = Math.max(1, 1.1 * s);
      c.strokeRect(x - 10 * s, y - 16 * s, 20 * s, 30 * s);
      c.fillStyle = rgba(BLOOD, 0.7 * (e.open || 0));
      c.fillRect(x - 4 * s, y - 8 * s, 8 * s, 10 * s);
    } else if (e.type === 'extra') {
      const rgb = e.variant === 'lamp' ? GOLD : e.variant === 'doll' ? BLOOD : CYN;
      c.fillStyle = rgba(rgb, e.locked ? 0.45 : 0.22);
      c.beginPath();
      c.arc(x, y, (e.locked ? 14 : 11) * s, 0, TAU);
      c.fill();
      if (e.variant === 'lamp') {
        c.fillStyle = rgba(GOLD, 0.95);
        c.fillRect(x - 5 * s, y - 4 * s, 10 * s, 10 * s);
        c.fillStyle = rgba(VIO, 0.9);
        c.beginPath();
        c.moveTo(x - 4 * s, y - 4 * s);
        c.lineTo(x, y - 12 * s);
        c.lineTo(x + 4 * s, y - 4 * s);
        c.closePath();
        c.fill();
        c.fillStyle = rgba(WHT, 0.9);
        c.beginPath();
        c.arc(x, y + 1 * s, 2.2 * s, 0, TAU);
        c.fill();
      } else if (e.variant === 'doll') {
        c.fillStyle = rgba(SKIN, 0.95);
        c.beginPath();
        c.arc(x, y - 3 * s, 5 * s, 0, TAU);
        c.fill();
        c.fillStyle = rgba(BLOOD, 0.95);
        c.fillRect(x - 5 * s, y + 1 * s, 10 * s, 8 * s);
        c.fillStyle = rgba(HAIR, 0.9);
        c.beginPath();
        c.arc(x, y - 6 * s, 5.2 * s, Math.PI, 0);
        c.fill();
        c.fillStyle = rgba(DEEP, 0.9);
        c.beginPath();
        c.arc(x - 1.6 * s, y - 3 * s, 0.8 * s, 0, TAU);
        c.arc(x + 1.8 * s, y - 3 * s, 0.8 * s, 0, TAU);
        c.fill();
      } else {
        c.fillStyle = rgba(CYN, 0.95);
        c.beginPath();
        c.arc(x, y, 6 * s, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.95);
        c.beginPath();
        c.arc(x, y, 2.4 * s, 0, TAU);
        c.fill();
        c.fillStyle = rgba(DEEP, 0.8);
        c.beginPath();
        c.arc(x - 1.6 * s, y - 0.6 * s, 0.7 * s, 0, TAU);
        c.arc(x + 1.8 * s, y - 0.6 * s, 0.7 * s, 0, TAU);
        c.fill();
      }
    } else if (e.type === 'carrier') {
      c.fillStyle = rgba(VIO, 0.92);
      c.beginPath();
      c.ellipse(x, y, 16 * s, 9 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(x + 4 * s, y, 5 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(CYN, 0.85);
      c.beginPath();
      c.arc(x - 8 * s, y - 2 * s, 3.2 * s, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawBoss(e) {
    const c = ctx;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    if (e.kind === 'tomb') {
      c.fillStyle = rgba([48, 22, 58], 0.96);
      c.fillRect(x - 36 * s, y - 40 * s, 72 * s, 80 * s);
      c.beginPath();
      c.arc(x, y - 40 * s, 36 * s, Math.PI, 0);
      c.fill();
      c.fillStyle = rgba(VIO, 0.85);
      c.fillRect(x - 10 * s, y - 12 * s, 20 * s, 28 * s);
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(x - 12 * s, y - 18 * s, 6 * s, 0, TAU);
      c.arc(x + 12 * s, y - 18 * s, 6 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x - 12 * s, y - 18 * s, 2.4 * s, 0, TAU);
      c.arc(x + 12 * s, y - 18 * s, 2.4 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(BLOOD, 0.8);
      c.fillRect(x - 8 * s, y + 8 * s, 16 * s, 6 * s);
    } else if (e.kind === 'count') {
      c.fillStyle = rgba(BLOOD, 0.3);
      c.beginPath();
      c.moveTo(x, y - 10 * s);
      c.lineTo(x + 48 * s, y + 34 * s);
      c.lineTo(x - 48 * s, y + 34 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(BLOOD, 0.95);
      c.beginPath();
      c.ellipse(x, y + 8 * s, 22 * s, 28 * s, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(SKIN, 1);
      c.beginPath();
      c.arc(x, y - 18 * s, 12 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.95);
      c.beginPath();
      c.arc(x, y - 24 * s, 13 * s, Math.PI, 0);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(x - 5 * s, y - 18 * s, 2 * s, 0, TAU);
      c.arc(x + 5 * s, y - 18 * s, 2 * s, 0, TAU);
      c.fill();
    } else {
      c.fillStyle = rgba(VIO, 0.28);
      c.beginPath();
      c.arc(x, y, 48 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba([70, 18, 96], 0.95);
      c.beginPath();
      c.moveTo(x - 22 * s, y - 4 * s);
      c.lineTo(x + 18 * s, y + 4 * s);
      c.lineTo(x + 8 * s, y + 36 * s);
      c.lineTo(x - 28 * s, y + 28 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(SKIN, 1);
      c.beginPath();
      c.arc(x + 4 * s, y - 16 * s, 13 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(HAIR, 0.95);
      c.beginPath();
      c.moveTo(x - 18 * s, y - 10 * s);
      c.quadraticCurveTo(x - 36 * s, y + 8 * s, x - 22 * s, y + 24 * s);
      c.quadraticCurveTo(x + 8 * s, y - 36 * s, x + 20 * s, y - 18 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(VIO, 0.95);
      c.beginPath();
      c.moveTo(x - 6 * s, y - 22 * s);
      c.lineTo(x + 6 * s, y - 40 * s);
      c.lineTo(x + 16 * s, y - 20 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(BLOOD, 0.85);
      c.beginPath();
      c.arc(x + 2 * s, y - 12 * s, 3.2 * s, 0.15, Math.PI - 0.15);
      c.fill();
      c.fillStyle = rgba(DEEP, 0.9);
      c.beginPath();
      c.arc(x + 8 * s, y - 16 * s, 2 * s, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.9);
      c.lineWidth = Math.max(1.4, 2.2 * s);
      c.beginPath();
      c.moveTo(x + 20 * s, y - 4 * s);
      c.lineTo(x + 48 * s, y - 18 * s);
      c.stroke();
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = sx(s.x);
      const y = sy(s.y);
      if (s.lock) {
        c.save();
        c.translate(x, y);
        c.rotate(Math.atan2(s.vy, s.vx));
        c.fillStyle = rgba(CYN, 0.95);
        c.beginPath();
        c.moveTo(7 * scale, 0);
        c.lineTo(-5 * scale, 4 * scale);
        c.lineTo(-5 * scale, -4 * scale);
        c.closePath();
        c.fill();
        c.restore();
      } else {
        c.fillStyle = rgba(VIO, 0.95);
        c.beginPath();
        c.ellipse(x, y, 8 * scale, 2.4 * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(GOLD, 0.9);
        c.beginPath();
        c.arc(x + 4 * scale, y, 2.1 * scale, 0, TAU);
        c.fill();
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      c.fillStyle = rgba(s.rgb || BLOOD, 0.95);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (s.r || 3.4) * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.55);
      c.beginPath();
      c.arc(sx(s.x - 1), sy(s.y - 1), Math.max(1, (s.r || 3) * 0.35) * scale, 0, TAU);
      c.fill();
    }
  }

  function drawPows() {
    const c = ctx;
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      c.save();
      c.translate(sx(p.x), sy(p.y));
      c.rotate(p.t * 4);
      const s = scale;
      if (p.kind === 'power') {
        c.fillStyle = rgba(VIO, 0.95);
        starPath(c, 0, 0, 9 * s, 4, 0.45);
        c.fill();
        c.fillStyle = rgba(GOLD, 0.95);
        c.fillRect(-2.4 * s, -2.4 * s, 4.8 * s, 4.8 * s);
      } else {
        c.fillStyle = rgba(GOLD, 0.95);
        c.beginPath();
        c.arc(0, 0, 5.4 * s, 0, TAU);
        c.fill();
        c.fillStyle = rgba(DEEP, 0.45);
        c.beginPath();
        c.arc(0, 0, 2.2 * s, 0, TAU);
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
    c.fillStyle = rgba(t < 0.35 ? MAG : VIO, 0.95);
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
    c.fillStyle = '#0c0610';
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
    drawGirl();
    drawLockBeams();
    drawFx();
    drawBossBar();
    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb || GOLD, G.flash);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
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
    G.kind = kind === 'sea' ? 'sea' : 'night';
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
    G.lockN = 0;
    G.lockChain = 0;
    G.lockChainT = 0;
    G.lockCd = 0;
    G.lockAcq = 0;
    G.wpnLv = 0;
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
    setLock(!!keys.lock);
    syncHud();
    audio.start();
    toast(isSea() ? '亡海 · 更密更快' : '夜巡 · 夜墓', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'night';
    G.stage = 0;
    G.lives = LIVES;
    G.wpnLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.lockN = 0;
    G.lockChain = 0;
    G.lockHold = false;
    G.deadT = 0;
    G.bossIn = false;
    G.px = 90;
    G.py = VH * 0.5;
    clearField();
    seedDecor();
    G.ents.push(makeBoss('smile', '死笑姬', 156));
    G.ents[0].x = VW - 150;
    G.ents[0].y = VH * 0.55;
    G.ents[0].in = false;
    G.ents.push(makeExtra(VW * 0.58, VH * 0.32, 'soul'));
    G.ents.push(makeExtra(VW * 0.64, VH * 0.7, 'lamp'));
    G.ents[1].locked = true;
    G.ents[1].lockI = 1;
    showOverlay(
      'title',
      '死笑',
      '从左往右飞过哥特夜墓。空格连射，Shift / Z 锁定余物。锁住再打才高分。撞上掉命。过关才见关底。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('night');
    else startGame(G.kind || 'night');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('night');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('sea');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isSea()) goTitle();
      else startGame('sea');
    }
  }

  function setLock(on) {
    G.lockHold = !!on;
    if (btnLock) btnLock.classList.toggle('on', G.lockHold);
    if (btnPad) btnPad.classList.toggle('on', G.lockHold);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isLock = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
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

    if (down && (isMove || space || isLock || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      if (isLock) {
        keys.lock = false;
        setLock(false);
      }
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
    if (isLock) {
      keys.lock = true;
      if (G.mode === 'play' && !e.repeat) setLock(true);
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

  function bindLockBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (G.mode === 'play') setLock(true);
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    function up() { setLock(false); }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
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
  bindLockBtn(btnLock);
  bindLockBtn(btnPad);

  if (btnNight) {
    btnNight.addEventListener('click', function () {
      audio.ensure();
      startGame('night');
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
      startGame(G.kind);
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && !isSea()) startGame('sea');
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
      keys.lock = false;
      G.fireHold = false;
      setLock(false);
    }
  });

  requestAnimationFrame(frame);
})();
