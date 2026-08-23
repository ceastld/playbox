'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const BOMB_CAP = 6;
  const WPN_MAX = 3;
  const CLAW_MAX = 4;
  const SPD_MAX = 4;
  const BEST_KEY = 'playbox-thunder-cross-best';
  const MUTE_KEY = 'playbox-thunder-cross-mute';
  const OPS = '方向 / WASD 移动 · 空格开火 · Shift / Z 交弹 · R 重开 · M 静音';
  const LEAD = '交爪张开成十字。捡 O 加爪、S 加速、V 速射、B 回旋、L 前后激光。Shift 扔交弹。每关中核与关底核。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [92, 239, 255];
  const SKY = [126, 232, 255];
  const GOLD = [255, 225, 74];
  const AMB = [255, 176, 32];
  const HOT = [255, 138, 42];
  const VIO = [196, 92, 255];
  const WHT = [255, 246, 232];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];

  const WPN_NAME = { vulcan: '火', boom: '旋', laser: '束' };
  const DROP_CYCLE = ['opt', 'spd', 'vulcan', 'boom', 'laser', 'bomb'];
  const DROP_GLYPH = { opt: 'O', spd: 'S', vulcan: 'V', boom: 'B', laser: 'L', bomb: '弹' };
  const DROP_RGB = { opt: CYN, spd: GOLD, vulcan: WHT, boom: HOT, laser: SKY, bomb: AMB };

  const STAGES = [
    {
      name: '第 1 关 · 废都',
      mid: '炮巢',
      boss: '交卫',
      midHp: 38,
      bossHp: 92,
      waves: [
        { t: 0.85, kind: 'v', n: 5 },
        { t: 3.2, kind: 'slash', dir: 1 },
        { t: 5.8, kind: 'v', n: 7 },
        { t: 8.4, kind: 'cannons' },
        { t: 10.8, kind: 'pod' },
        { t: 13.2, kind: 'dive', n: 4 },
        { t: 15.8, kind: 'clawer' },
        { t: 18.4, kind: 'v', n: 7 },
        { t: 21.0, kind: 'mid' },
        { t: 26.6, kind: 'slash', dir: -1 },
        { t: 29.0, kind: 'v', n: 9 },
        { t: 31.4, kind: 'pod' },
        { t: 33.8, kind: 'dive', n: 5 },
        { t: 36.2, kind: 'clawer' },
        { t: 38.8, kind: 'cannons' },
        { t: 41.4, kind: 'orbit' },
        { t: 47.2, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 舰廊',
      mid: '舰桥',
      boss: '黑脉',
      midHp: 50,
      bossHp: 124,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 2.8, kind: 'dive', n: 5 },
        { t: 5.2, kind: 'slash', dir: -1 },
        { t: 7.6, kind: 'cannons' },
        { t: 10.0, kind: 'clawer' },
        { t: 12.4, kind: 'pod' },
        { t: 14.8, kind: 'v', n: 9 },
        { t: 17.2, kind: 'orbit' },
        { t: 19.6, kind: 'mid' },
        { t: 25.2, kind: 'slash', dir: 1 },
        { t: 27.6, kind: 'dive', n: 6 },
        { t: 30.0, kind: 'clawer' },
        { t: 32.4, kind: 'clawer' },
        { t: 34.8, kind: 'v', n: 9 },
        { t: 37.2, kind: 'pod' },
        { t: 39.6, kind: 'cannons' },
        { t: 42.2, kind: 'orbit' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 核门',
      mid: '环核',
      boss: '黑冲',
      midHp: 62,
      bossHp: 172,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.4, kind: 'slash', dir: 1 },
        { t: 4.2, kind: 'slash', dir: -1 },
        { t: 6.4, kind: 'dive', n: 6 },
        { t: 8.6, kind: 'clawer' },
        { t: 10.6, kind: 'pod' },
        { t: 12.8, kind: 'v', n: 11 },
        { t: 15.0, kind: 'cannons' },
        { t: 17.2, kind: 'orbit' },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'dive', n: 7 },
        { t: 27.0, kind: 'clawer' },
        { t: 29.0, kind: 'clawer' },
        { t: 31.2, kind: 'v', n: 11 },
        { t: 33.6, kind: 'pod' },
        { t: 35.8, kind: 'slash', dir: 1 },
        { t: 37.6, kind: 'slash', dir: -1 },
        { t: 40.0, kind: 'orbit' },
        { t: 42.4, kind: 'cannons' },
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
  const btnRaid = document.getElementById('btn-raid');
  const btnCore = document.getElementById('btn-core');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPadBomb = document.getElementById('btn-pad-bomb');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const clawLabel = document.getElementById('claw-label');
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

  const G = {
    mode: 'title',
    kind: 'raid',
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
    wpn: 'vulcan',
    wpnLv: 0,
    claws: 0,
    spread: 0.22,
    spdLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    blocks: [],
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
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    why: '',
    nextBlock: 40
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
  function plySpd() {
    return (isCore() ? 312 : 270) + G.spdLv * 28;
  }
  function scrollSpd() {
    if (hasBig()) return isCore() ? 36 : 28;
    const base = isCore() ? 114 : 82;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isCore() ? 10 : 8);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isCore() ? 160 : 110;
  }
  function hpMul() {
    return isCore() ? 1.22 : 1;
  }

  function clawCount() {
    return G.mode === 'title' ? CLAW_MAX : G.claws;
  }

  function clawSlots() {
    const n = clawCount();
    const d = lerp(16, 56, G.spread);
    const slots = [];
    if (n >= 1) slots.push({ x: -d, y: 2 });
    if (n >= 2) slots.push({ x: d, y: 2 });
    if (n >= 3) slots.push({ x: 0, y: -d * 0.72 });
    if (n >= 4) slots.push({ x: 0, y: d * 0.78 });
    return slots;
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
      if (kind === 'laser') this.beep(920, 0.07, 'sawtooth', 0.032, 380);
      else if (kind === 'boom') this.beep(420, 0.09, 'triangle', 0.036, 180);
      else this.beep(720, 0.048, 'square', 0.03, 1680);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.038, 0.034, 1200);
      this.beep(560 * lift, 0.068, 'square', 0.044, 980 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.18 : 0.09, big ? 0.074 : 0.046, big ? 240 : 480);
      this.beep(big ? 170 : 260, big ? 0.24 : 0.13, 'sawtooth', 0.05, 55);
    },
    bomb() {
      this.ensure();
      this.noise(0.28, 0.08, 180);
      this.beep(90, 0.42, 'sawtooth', 0.07, 40);
      this.beep(740, 0.2, 'sine', 0.04, 220);
    },
    pow() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    claw() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.046, 990);
      this.beep(1320, 0.14, 'sine', 0.04, 1760);
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
      this.beep(300, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.3, 'sine', 0.045, 46);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(196, 0.16, 'sawtooth', 0.05, 110);
      this.beep(147, 0.28, 'square', 0.04, 80);
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
    const n = WPN_NAME[G.wpn] || '火';
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
      tagLabel.textContent = isCore() ? '交核' : '雷交';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('boom', G.wpn === 'boom');
      wpnLabel.classList.toggle('laser', G.wpn === 'laser');
    }
    if (clawLabel) {
      clawLabel.textContent = '爪 ×' + G.claws;
      clawLabel.classList.toggle('max', G.claws >= CLAW_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '弹 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    const noBomb = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
    if (btnBomb) btnBomb.disabled = noBomb;
    if (btnPadBomb) btnPadBomb.disabled = noBomb;
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
    else if (G.mode === 'win') setHint('核门尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 交弹清屏', 'warn');
    else setHint('平移张开交爪 · 空格开火 · Shift 交弹 · 捡 O/S/V/B/L', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showSecond) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TCRO';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind === 'title') {
      if (btnRaid) btnRaid.textContent = '雷交';
      if (btnCore) btnCore.textContent = '交核';
    } else {
      if (ovRetry) ovRetry.textContent = primary;
      if (ovModes) {
        ovModes.classList.toggle('gone', !showSecond);
        if (kind === 'lose') ovModes.textContent = '换模式';
        else ovModes.textContent = isCore() ? '换模式' : '交核';
      }
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
        g: spec.g == null ? 520 : spec.g
      });
    }
    capArr(particles, 360);
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
    for (let i = 0; i < 72; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.4),
        a: rand(0.18, 0.7)
      });
    }
  }

  function seedBlocks() {
    G.blocks.length = 0;
    for (let i = 0; i < 8; i++) spawnBlock(-40 - i * 90);
  }

  function spawnBlock(y) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const w = rand(26, 52);
    const h = rand(44, 96);
    const x = side < 0 ? rand(10, 68) : rand(VW - 68, VW - 10);
    G.blocks.push({
      x: x, y: y, w: w, h: h,
      hue: hash2((G.scroll + y) | 0),
      win: 2 + ((hash2(((G.scroll + y) * 3) | 0) * 4) | 0)
    });
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

  function spawnCross(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'cross',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 98,
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
    spawnCross(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnCross(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnCross(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnSlash(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = 6 + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnCross(side + rand(-8, 8), -20 - i * 24, {
        vx: dir * -82,
        vy: 124,
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
        vx: 0, vy: 64,
        hp: 1, r: 10, score: 100,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnClawer(x) {
    spawnEnt({
      type: 'clawer',
      x: x == null ? rand(80, VW - 80) : x,
      y: -42,
      vx: rand(-36, 36),
      vy: 54,
      hp: 5, r: 18, score: 220,
      rgb: HOT,
      drop: Math.random() < 0.42,
      w: 36, h: 24,
      fireCd: rand(0.4, 0.9)
    });
  }

  function spawnPod() {
    spawnEnt({
      type: 'pod',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 76,
      hp: 2, r: 13, score: 300,
      rgb: GOLD,
      drop: 'cycle',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnCannon(x, y) {
    spawnEnt({
      type: 'cannon',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 3, r: 12, score: 150,
      rgb: AMB,
      ground: true,
      w: 22, h: 18,
      fireCd: rand(0.45, 1.3)
    });
  }

  function spawnOrbit(x) {
    spawnEnt({
      type: 'orbit',
      x: x == null ? rand(70, VW - 70) : x,
      y: -30,
      vx: rand(-48, 48),
      vy: 0,
      hp: 5, r: 16, score: 180,
      rgb: VIO,
      ground: true,
      drop: Math.random() < 0.24,
      w: 28, h: 18,
      fireCd: rand(0.5, 1.1),
      spin: rand(0, TAU)
    });
  }

  function spawnCannonWave() {
    const n = isCore() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 70 + i * ((VW - 140) / Math.max(1, n - 1)) + rand(-18, 18);
      spawnCannon(clamp(x, 40, VW - 40), -24 - i * 18);
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
      vx: 62,
      vy: 46,
      hp: hp,
      r: 32,
      score: 2000,
      rgb: VIO,
      drop: 'bomb',
      w: 72,
      h: 36,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(VIO, 0.36);
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
      vx: 70,
      vy: 44,
      hp: hp,
      r: 46,
      score: 4000 + G.stage * 1500,
      rgb: MAG,
      drop: 'cycle',
      w: 102,
      h: 48,
      fireCd: 0.55,
      phase: 0,
      spin: 0
    });
    toast(st.boss, false, true);
    audio.boss();
    screenFlash(MAG, 0.42);
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
    else if (w.kind === 'slash') spawnSlash(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'clawer') spawnClawer();
    else if (w.kind === 'pod') spawnPod();
    else if (w.kind === 'cannons') spawnCannonWave();
    else if (w.kind === 'orbit') spawnOrbit();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function nextDropKind() {
    const k = DROP_CYCLE[G.dropI % DROP_CYCLE.length];
    G.dropI += 1;
    return k;
  }

  function cycleKind(kind) {
    const i = DROP_CYCLE.indexOf(kind);
    return DROP_CYCLE[(i + 1) % DROP_CYCLE.length];
  }

  function spawnPow(x, y, kind) {
    kind = kind || nextDropKind();
    G.pows.push({
      x: x, y: y, vy: 62, t: 0,
      vx: rand(-38, 38),
      kind: kind,
      cycleT: 0
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

  function crossShot(x, y, spd, rot, rgb, r) {
    for (let i = 0; i < 4; i++) {
      const a = rot + (i * TAU) / 4;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r);
    }
  }

  function addShot(spec) {
    if (G.shots.length > 96) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      kind: spec.kind || 'vulcan',
      pierce: spec.pierce || 0,
      dmg: spec.dmg || 1,
      bounce: spec.bounce || 0
    });
  }

  function fireFrom(ox, oy, full) {
    const lv = G.wpnLv;
    if (G.wpn === 'laser') {
      const pierce = 1 + lv;
      const rgb = CYN;
      addShot({ x: ox, y: oy - 4, vy: -820, r: 3.5, rgb: rgb, kind: 'laser', pierce: pierce, dmg: 1 });
      addShot({ x: ox, y: oy + 4, vy: 760, r: 3.2, rgb: rgb, kind: 'laser', pierce: pierce, dmg: 1 });
      if (full && lv >= 2) {
        addShot({ x: ox - 8, y: oy - 2, vy: -800, vx: -40, r: 2.8, rgb: SKY, kind: 'laser', pierce: pierce, dmg: 1 });
        addShot({ x: ox + 8, y: oy - 2, vy: -800, vx: 40, r: 2.8, rgb: SKY, kind: 'laser', pierce: pierce, dmg: 1 });
      }
    } else if (G.wpn === 'boom') {
      const spd = -420 - lv * 28;
      const out = 70 + lv * 14;
      if (full) {
        addShot({ x: ox - 4, y: oy, vx: -out, vy: spd, r: 4.4, rgb: HOT, kind: 'boom', dmg: 2, bounce: 0 });
        addShot({ x: ox + 4, y: oy, vx: out, vy: spd, r: 4.4, rgb: HOT, kind: 'boom', dmg: 2, bounce: 0 });
        if (lv >= 2) {
          addShot({ x: ox, y: oy - 2, vx: 0, vy: spd - 40, r: 4.6, rgb: AMB, kind: 'boom', dmg: 2, bounce: 0 });
        }
      } else {
        addShot({
          x: ox, y: oy,
          vx: Math.abs(ox - G.player.x) < 1 ? 0 : (ox < G.player.x ? -out : out),
          vy: spd, r: 4.2, rgb: HOT, kind: 'boom', dmg: 2, bounce: 0
        });
      }
    } else {
      const spd = -670;
      const rgb = lv >= 2 ? GOLD : WHT;
      addShot({ x: ox, y: oy - 2, vy: spd, r: 3.1, rgb: rgb, kind: 'vulcan', dmg: 1 });
      if (full && lv >= 1) {
        addShot({ x: ox - 7, y: oy, vx: -70, vy: spd, r: 2.8, rgb: rgb, kind: 'vulcan', dmg: 1 });
        addShot({ x: ox + 7, y: oy, vx: 70, vy: spd, r: 2.8, rgb: rgb, kind: 'vulcan', dmg: 1 });
      }
      if (full && lv >= 3) {
        addShot({ x: ox - 12, y: oy + 2, vx: -120, vy: spd, r: 2.6, rgb: AMB, kind: 'vulcan', dmg: 1 });
        addShot({ x: ox + 12, y: oy + 2, vx: 120, vy: spd, r: 2.6, rgb: AMB, kind: 'vulcan', dmg: 1 });
      }
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.wpnLv;
    if (G.wpn === 'laser') G.fireCd = 0.122 - lv * 0.012;
    else if (G.wpn === 'boom') G.fireCd = 0.168 - lv * 0.016;
    else G.fireCd = 0.102 - lv * 0.014;
    const px = G.player.x;
    const py = G.player.y;
    fireFrom(px, py - 12, true);
    const slots = clawSlots();
    for (let i = 0; i < slots.length; i++) {
      fireFrom(px + slots[i].x, py + slots[i].y, false);
    }
    G.muzzle = 0.05;
    audio.shoot(G.wpn);
    emit(3, {
      x: px, y: py - 10, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: G.wpn === 'boom' ? HOT : G.wpn === 'laser' ? CYN : GOLD,
      g: 0
    });
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('交弹用尽', true);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.5;
    G.bombFlash = 0.55;
    G.invuln = Math.max(G.invuln, 0.42);
    audio.bomb();
    screenFlash(GOLD, 0.78);
    popSpark(G.player.x, G.player.y, AMB, 48);
    rings.push({ x: G.player.x, y: G.player.y, t: 0, rgb: GOLD, r: 22 });
    rings.push({ x: VW * 0.5, y: VH * 0.42, t: 0, rgb: CYN, r: 40 });
    const slots = clawSlots();
    emit(22, {
      x: G.player.x, y: G.player.y, j: 18,
      vx0: -280, vx1: 280, vy0: -320, vy1: 220,
      life: 0.52, r0: 1.6, r1: 4.2, rgb: AMB, g: 40
    });
    for (let i = 0; i < slots.length; i++) {
      const cx = G.player.x + slots[i].x;
      const cy = G.player.y + slots[i].y;
      popSpark(cx, cy, CYN, 22);
      emit(10, {
        x: cx, y: cy, j: 8,
        vx0: -160, vx1: 160, vy0: -200, vy1: 80,
        life: 0.36, r0: 1.4, r1: 3.2, rgb: CYN, g: 20
      });
    }
    hitStop(0.078);
    kick(7.4);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      emit(2, {
        x: s.x, y: s.y, j: 2,
        vx0: -50, vx1: 50, vy0: -50, vy1: 50,
        life: 0.14, r0: 1, r1: 2.2, rgb: WHT, g: 0
      });
    }
    G.eShots.length = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dmg = en.type === 'boss' ? 14 : en.type === 'mid' ? 10 : 6;
      hurtEnt(en, dmg, en.x, en.y);
    }
    syncHud();
  }

  function hurtEnt(en, dmg, hx, hy) {
    if (en.hp <= 0) return;
    en.hp -= dmg || 1;
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
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.type === 'clawer' ? 1.25 : 0.85;
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
    else if ((en.type === 'clawer' || en.type === 'orbit') && Math.random() < 0.2) spawnPow(en.x, en.y, nextDropKind());
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(1500 * G.stage);
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
        toast('交弹 +1', false, true);
      } else {
        addScore(800 * G.mult);
        toast('+800', false, true);
      }
    } else if (p.kind === 'opt') {
      if (G.claws < CLAW_MAX) {
        G.claws += 1;
        toast(G.claws >= CLAW_MAX ? '交爪 MAX' : '交爪 +1', false, true);
        audio.claw();
      } else {
        addScore(500 * G.mult);
        toast('+500', false, true);
      }
    } else if (p.kind === 'spd') {
      if (G.spdLv < SPD_MAX) {
        G.spdLv += 1;
        toast('加速 ' + ['', 'Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ'][G.spdLv], false, true);
      } else {
        addScore(400 * G.mult);
        toast('+400', false, true);
      }
    } else {
      const kind = p.kind === 'laser' || p.kind === 'boom' ? p.kind : 'vulcan';
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
    juice(p.x, p.y, DROP_RGB[p.kind] || GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, DROP_GLYPH[p.kind] || 'O', DROP_RGB[p.kind] || GOLD, true);
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
    const slots = clawSlots();
    for (let i = 0; i < slots.length; i++) {
      juice(G.player.x + slots[i].x, G.player.y + slots[i].y, CYN, 1.1);
    }
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.claws > 0) spawnPow(G.player.x - 16, G.player.y - 18, 'opt');
    if (G.wpnLv > 0 || G.wpn !== 'vulcan') spawnPow(G.player.x + 16, G.player.y - 18, G.wpn);
    G.wpn = 'vulcan';
    G.wpnLv = 0;
    G.claws = 0;
    G.spdLv = 0;
    G.spread = 0.22;
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
    G.why = '舰毁了';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''), '再来', true);
    syncHud();
  }

  function winGame() {
    addScore(isCore() ? 10000 : 8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '核门尽破', (isCore() ? '交核通关' : '三关打穿') + ' · 分数 ' + G.score, '再来', true);
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

  function coreThink(dt) {
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
    if (r < 0.34) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.52) spawnSlash(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.68) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.8) spawnClawer();
    else if (r < 0.9) spawnPod();
    else spawnOrbit();
  }

  function bossFire(en, storm) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += storm ? 0.22 : 0.16;
    if (en.type === 'mid') {
      crossShot(en.x, en.y + 8, storm ? 168 : 142, en.spin, VIO, 3.1);
      aimShot(en.x, en.y + 16, storm ? 210 : 176, VIO);
      if (mid) ringShot(en.x, en.y, storm ? 10 : 8, 150, en.spin, PNK, 3.2);
      if (low) {
        aimShot(en.x - 22, en.y + 8, 200, MAG);
        aimShot(en.x + 22, en.y + 8, 200, MAG);
      }
      en.fireCd = low ? 0.34 : mid ? 0.48 : 0.64;
    } else if (stg === 1) {
      crossShot(en.x, en.y + 10, 156, en.spin, MAG, 3.2);
      crossShot(en.x, en.y + 10, 132, en.spin + Math.PI / 4, HOT, 2.9);
      if (mid) ringShot(en.x, en.y + 6, storm ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 42, 208, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, storm ? 14 : 11, 146, en.spin, MAG, 3.15);
      crossShot(en.x, en.y + 8, 170, -en.spin, CYN, 3.0);
      if (mid) {
        ringShot(en.x, en.y + 8, storm ? 10 : 8, 118, -en.spin * 1.4, VIO, 3.0);
        aimShot(en.x, en.y + 16, 200, GOLD);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 220, RED);
        aimShot(en.x + 28, en.y + 10, 220, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 6, storm ? 16 : 12, 152, en.spin, MAG, 3.2);
      crossShot(en.x, en.y + 6, 188, en.spin * 0.5, GOLD, 3.3);
      ringShot(en.x, en.y + 6, storm ? 10 : 8, 108, -en.spin * 0.7, CYN, 2.8);
      if (mid) {
        aimShot(en.x - 20, en.y + 14, 210, PNK);
        aimShot(en.x + 20, en.y + 14, 210, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, storm ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (storm) en.fireCd *= 0.78;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0 || G.bombT > 0;
    const storm = isCore();
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
        if (en.type === 'orbit') {
          en.x += en.vx * dt;
          en.spin += dt * 2.4;
          if (en.x < 40 || en.x > VW - 40) en.vx *= -1;
        }
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < (en.type === 'boss' ? 108 : 124)) en.y += en.vy * dt;
        else {
          en.y = en.type === 'boss' ? 108 : 124;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 92 : 78;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
      } else if (en.type === 'pod') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'dive') {
        if (en.t > 0.32) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 178;
          en.vx = lerp(en.vx, dx / len * asp, 1 - Math.exp(-dt * 3.1));
          en.vy = lerp(en.vy, dy / len * asp, 1 - Math.exp(-dt * 3.1));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'cross') {
        if (!en.dive && en.t > 1.28 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.28) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 92, dt * 2);
          en.vy = Math.max(en.vy, 154);
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'clawer') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        en.spin += dt * 3.2;
        if (en.x < 46 || en.x > VW - 46) en.vx *= -1;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 52 || en.x < -64 || en.x > VW + 64 || (en.ground && en.y > VH + 42)) {
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && en.y > -10 && en.y < VH + 10) {
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          if (en.type === 'cross' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, storm ? 198 : 172, MAG);
            if (storm && Math.random() < 0.45) aimShot(en.x, en.y + 8, 168, PNK);
            en.fireCd = (storm ? 1.35 : 2.35) + rand(0, 0.55);
          } else if (en.type === 'clawer') {
            crossShot(en.x, en.y + 8, 156, en.spin, HOT, 3.0);
            if (storm) aimShot(en.x, en.y + 10, 186, HOT);
            en.fireCd = storm ? 0.72 : 1.05;
          } else if (en.type === 'cannon' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, storm ? 214 : 174, AMB);
            if (storm) {
              eShot(en.x - 8, en.y + 4, -40, 160, HOT);
              eShot(en.x + 8, en.y + 4, 40, 160, HOT);
            }
            en.fireCd = (storm ? 0.78 : 1.16) + rand(0, 0.28);
          } else if (en.type === 'orbit' && en.y > 8 && en.y < VH - 70) {
            crossShot(en.x, en.y, storm ? 170 : 148, en.spin, VIO, 3.0);
            en.fireCd = storm ? 0.7 : 1.02;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, storm);
            else en.fireCd = 0.4;
          } else {
            en.fireCd = 2;
          }
        }
      }

      if (canHurt) {
        const rr = en.r + 4.6;
        const dx = en.x - px;
        const dy = en.y - py;
        if (dx * dx + dy * dy < rr * rr) {
          if (!inv) killPlayer();
        }
      }
    }
  }

  function updateShots(dt) {
    const playing = G.mode === 'play';
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.kind === 'boom') {
        let bounced = false;
        if (s.x < 8) { s.x = 8; s.vx = Math.abs(s.vx); bounced = true; }
        else if (s.x > VW - 8) { s.x = VW - 8; s.vx = -Math.abs(s.vx); bounced = true; }
        if (s.y < 8) { s.y = 8; s.vy = Math.abs(s.vy); bounced = true; }
        else if (s.y > VH - 8) { s.y = VH - 8; s.vy = -Math.abs(s.vy); bounced = true; }
        if (bounced) {
          s.bounce += 1;
          emit(3, {
            x: s.x, y: s.y, j: 2,
            vx0: -40, vx1: 40, vy0: -40, vy1: 40,
            life: 0.1, r0: 1, r1: 2, rgb: HOT, g: 0
          });
        }
        if (s.bounce >= 4) {
          G.shots.splice(i, 1);
          continue;
        }
      } else if (s.y < -22 || s.x < -16 || s.x > VW + 16 || s.y > VH + 24) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (s.struck && s.struck.indexOf(en) >= 0) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          if (!s.struck) s.struck = [];
          s.struck.push(en);
          hurtEnt(en, s.dmg || 1, s.x, s.y);
          if (s.kind === 'laser') continue;
          if (s.kind === 'boom') {
            s.vx *= -1;
            s.vy = -Math.abs(s.vy) * 0.88;
            s.bounce += 1;
            if (s.bounce >= 4) hit = true;
            break;
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
        const rr = 4.6 + s.r;
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
      p.cycleT += dt;
      if (p.cycleT >= 1.55) {
        p.cycleT = 0;
        p.kind = cycleKind(p.kind);
      }
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

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    G.nextBlock -= scr * dt;
    if (G.nextBlock <= 0) {
      G.nextBlock = rand(70, 130);
      spawnBlock(-90);
    }
    for (let i = G.blocks.length - 1; i >= 0; i--) {
      G.blocks[i].y += scr * dt;
      if (G.blocks[i].y - G.blocks[i].h > VH + 20) G.blocks.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += scr * 0.35 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
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

  function updateSpread(dt) {
    const moving = hypot(G.player.vx, G.player.vy) > 36;
    const want = moving ? 1 : 0.18;
    const k = moving ? 2.4 : 3.1;
    G.spread = lerp(G.spread, want, 1 - Math.exp(-dt * k));
    if (G.mode === 'title') {
      G.spread = 0.45 + Math.sin(G.t * 1.6) * 0.4;
    }
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
      const lx = G.player.x;
      const ly = G.player.y;
      G.player.x = lerp(G.player.x, tx, 1 - Math.exp(-dt * 16));
      G.player.y = lerp(G.player.y, ty, 1 - Math.exp(-dt * 16));
      G.player.vx = (G.player.x - lx) / Math.max(dt, 0.0001);
      G.player.vy = (G.player.y - ly) / Math.max(dt, 0.0001);
    } else {
      G.player.vx *= Math.exp(-dt * 10);
      G.player.vy *= Math.exp(-dt * 10);
    }
    if (inputSrc !== 'ptr' || dx || dy) {
      G.player.x += G.player.vx * dt;
      G.player.y += G.player.vy * dt;
    }
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
    updateSpread(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.player.vx = Math.cos(G.t * 0.7) * 48 * 0.7;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingCount() < 8) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 40);
        G.spawnT = 2.5;
      }
      updateEnts(dt);
      updateWorld(dt * 0.55);
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
    if (G.bombT > 0) G.bombT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
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

    if (isCore()) coreThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#1a1408');
      g.addColorStop(0.45, '#120e08');
      g.addColorStop(1, '#0a0704');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#180810');
      g.addColorStop(0.5, '#10060c');
      g.addColorStop(1, '#0a0408');
    } else {
      g.addColorStop(0, '#1c1208');
      g.addColorStop(0.5, '#140c06');
      g.addColorStop(1, '#0a0704');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = rgba(G.stage === 3 ? PNK : GOLD, s.a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), Math.max(0.6, s.z * 1.15) * scale, 0, TAU);
      ctx.fill();
    }

    if (G.stage === 3) {
      ctx.save();
      ctx.strokeStyle = rgba(MAG, 0.1);
      ctx.lineWidth = 1 * scale;
      const hex = 36;
      const off = (G.scroll * 0.12) % hex;
      for (let y = -hex; y < VH + hex; y += hex) {
        for (let x = 0; x < VW; x += hex) {
          ctx.strokeRect(sx(x + ((y / hex) | 0) % 2 * 18), sy(y + off), 20 * scale, 20 * scale);
        }
      }
      ctx.restore();
    }

    for (let i = 0; i < G.blocks.length; i++) {
      const b = G.blocks[i];
      const col = G.stage === 2 ? [58, 42, 28] : G.stage === 3 ? [48, 22, 36] : [62, 40, 18];
      ctx.fillStyle = rgba(col, 0.72);
      ctx.fillRect(sx(b.x - b.w * 0.5), sy(b.y), b.w * scale, b.h * scale);
      ctx.strokeStyle = rgba(G.stage === 3 ? MAG : AMB, 0.22);
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(sx(b.x - b.w * 0.5), sy(b.y), b.w * scale, b.h * scale);
      for (let w = 0; w < b.win; w++) {
        const wx = b.x - b.w * 0.3 + (w % 2) * b.w * 0.28;
        const wy = b.y + 10 + Math.floor(w / 2) * 16;
        if (wy > b.y + b.h - 8) continue;
        ctx.fillStyle = rgba(w % 3 === 0 ? GOLD : CYN, 0.28 + hash2((b.hue * 100 + w) | 0) * 0.35);
        ctx.fillRect(sx(wx), sy(wy), 4 * scale, 5 * scale);
      }
    }

    ctx.fillStyle = rgba(AMB, 0.06);
    ctx.fillRect(sx(0), sy(0), 18 * scale, VH * scale);
    ctx.fillRect(sx(VW - 18), sy(0), 18 * scale, VH * scale);
  }

  function drawShip(x, y, dead) {
    if (dead) return;
    const blink = G.invuln > 0 && ((G.invuln * 18) | 0) % 2 === 0;
    if (blink && G.mode === 'play') ctx.globalAlpha = 0.45;
    const slots = clawSlots();
    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.35 + G.spread * 0.4);
    ctx.lineWidth = 1.4 * scale;
    ctx.shadowColor = rgba(CYN, 0.5);
    ctx.shadowBlur = 8 * scale;
    if (slots.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(sx(x + slots[0].x), sy(y + slots[0].y));
      ctx.lineTo(sx(x + slots[1].x), sy(y + slots[1].y));
      ctx.stroke();
    }
    if (slots.length >= 4) {
      ctx.beginPath();
      ctx.moveTo(sx(x + slots[2].x), sy(y + slots[2].y));
      ctx.lineTo(sx(x + slots[3].x), sy(y + slots[3].y));
      ctx.stroke();
    } else if (slots.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(sx(x + slots[2].x), sy(y + slots[2].y));
      ctx.lineTo(sx(x), sy(y));
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < slots.length; i++) {
      const cx = x + slots[i].x;
      const cy = y + slots[i].y;
      ctx.save();
      ctx.translate(sx(cx), sy(cy));
      ctx.rotate(G.t * 2.2);
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.shadowColor = rgba(CYN, 0.8);
      ctx.shadowBlur = 10 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -6 * scale);
      ctx.lineTo(5 * scale, 0);
      ctx.lineTo(0, 6 * scale);
      ctx.lineTo(-5 * scale, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 1.6 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.fillStyle = rgba(HOT, 0.85);
    ctx.beginPath();
    ctx.moveTo(-7 * scale, 12 * scale);
    ctx.lineTo(-3 * scale, 18 * scale);
    ctx.lineTo(-1 * scale, 12 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7 * scale, 12 * scale);
    ctx.lineTo(3 * scale, 18 * scale);
    ctx.lineTo(1 * scale, 12 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.shadowColor = rgba(GOLD, 0.7);
    ctx.shadowBlur = 12 * scale;
    ctx.beginPath();
    ctx.moveTo(0, -16 * scale);
    ctx.lineTo(10 * scale, 6 * scale);
    ctx.lineTo(4 * scale, 4 * scale);
    ctx.lineTo(0, 12 * scale);
    ctx.lineTo(-4 * scale, 4 * scale);
    ctx.lineTo(-10 * scale, 6 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -2 * scale, 3.2 * scale, 5 * scale, 0, 0, TAU);
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(0, -16 * scale, 6 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawEnt(en) {
    const x = sx(en.x);
    const y = sy(en.y);
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(x, y);
    if (en.type === 'boss' || en.type === 'mid') ctx.rotate(en.spin * 0.15);
    else if (en.type === 'orbit' || en.type === 'clawer') ctx.rotate(en.spin);
    const rgb = flash ? WHT : en.rgb;
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.shadowColor = rgba(rgb, 0.55);
    ctx.shadowBlur = 10 * scale;
    if (en.type === 'boss') {
      ctx.beginPath();
      ctx.moveTo(0, -28 * scale);
      ctx.lineTo(12 * scale, -8 * scale);
      ctx.lineTo(34 * scale, 0);
      ctx.lineTo(12 * scale, 8 * scale);
      ctx.lineTo(0, 26 * scale);
      ctx.lineTo(-12 * scale, 8 * scale);
      ctx.lineTo(-34 * scale, 0);
      ctx.lineTo(-12 * scale, -8 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 10 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 5 * scale, 0, TAU);
      ctx.fill();
      for (let k = 0; k < 4; k++) {
        const a = en.spin + k * TAU / 4;
        ctx.fillStyle = rgba(CYN, 0.9);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 22 * scale, Math.sin(a) * 22 * scale, 5 * scale, 0, TAU);
        ctx.fill();
      }
    } else if (en.type === 'mid') {
      ctx.fillRect(-28 * scale, -14 * scale, 56 * scale, 28 * scale);
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, 8 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(rgb, 0.9);
      ctx.fillRect(-6 * scale, -22 * scale, 12 * scale, 10 * scale);
      ctx.fillRect(-22 * scale, -6 * scale, 10 * scale, 12 * scale);
      ctx.fillRect(12 * scale, -6 * scale, 10 * scale, 12 * scale);
    } else if (en.type === 'clawer') {
      ctx.beginPath();
      ctx.moveTo(0, -14 * scale);
      ctx.lineTo(14 * scale, 0);
      ctx.lineTo(0, 12 * scale);
      ctx.lineTo(-14 * scale, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.beginPath();
      ctx.arc(Math.cos(en.spin) * 16 * scale, Math.sin(en.spin) * 10 * scale, 3.4 * scale, 0, TAU);
      ctx.arc(Math.cos(en.spin + Math.PI) * 16 * scale, Math.sin(en.spin + Math.PI) * 10 * scale, 3.4 * scale, 0, TAU);
      ctx.fill();
    } else if (en.type === 'cannon') {
      ctx.fillRect(-10 * scale, -8 * scale, 20 * scale, 16 * scale);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-3 * scale, -14 * scale, 6 * scale, 10 * scale);
      ctx.fillRect(-14 * scale, -3 * scale, 8 * scale, 6 * scale);
      ctx.fillRect(6 * scale, -3 * scale, 8 * scale, 6 * scale);
    } else if (en.type === 'orbit') {
      ctx.beginPath();
      ctx.arc(0, 0, 11 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(-14 * scale, 0);
      ctx.lineTo(14 * scale, 0);
      ctx.moveTo(0, -14 * scale);
      ctx.lineTo(0, 14 * scale);
      ctx.stroke();
    } else if (en.type === 'pod') {
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = k * TAU / 6 - Math.PI / 6;
        const px = Math.cos(a) * 12 * scale;
        const py = Math.sin(a) * 12 * scale;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.font = (9 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('O', 0, 1 * scale);
    } else if (en.type === 'dive') {
      ctx.beginPath();
      ctx.moveTo(0, 12 * scale);
      ctx.lineTo(8 * scale, -8 * scale);
      ctx.lineTo(0, -4 * scale);
      ctx.lineTo(-8 * scale, -8 * scale);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -9 * scale);
      ctx.lineTo(8 * scale, 0);
      ctx.lineTo(0, 9 * scale);
      ctx.lineTo(-8 * scale, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(-1.4 * scale, -6 * scale, 2.8 * scale, 12 * scale);
      ctx.fillRect(-6 * scale, -1.4 * scale, 12 * scale, 2.8 * scale);
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.8);
      ctx.shadowBlur = 8 * scale;
      if (s.kind === 'laser') {
        ctx.fillRect(sx(s.x - 1.4), sy(s.y - 9), 2.8 * scale, 18 * scale);
      } else if (s.kind === 'boom') {
        ctx.translate(sx(s.x), sy(s.y));
        ctx.rotate(Math.atan2(s.vy, s.vx));
        ctx.beginPath();
        ctx.moveTo(7 * scale, 0);
        ctx.lineTo(-5 * scale, 4 * scale);
        ctx.lineTo(-2 * scale, 0);
        ctx.lineTo(-5 * scale, -4 * scale);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(sx(s.x), sy(s.y), 2.2 * scale, 5.5 * scale, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.7);
      ctx.shadowBlur = 6 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = DROP_RGB[p.kind] || GOLD;
      const pulse = 1 + Math.sin(p.t * 8) * 0.08;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.rotate(p.t * 1.4);
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.shadowColor = rgba(rgb, 0.7);
      ctx.shadowBlur = 12 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -11 * scale * pulse);
      ctx.lineTo(11 * scale * pulse, 0);
      ctx.lineTo(0, 11 * scale * pulse);
      ctx.lineTo(-11 * scale * pulse, 0);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1a1004';
      ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 1.4);
      ctx.fillText(DROP_GLYPH[p.kind] || '?', 0, 1 * scale);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / (p.max || 0.3));
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = 2.4 * scale * (1 - r.t);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 40) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = 'bold ' + (f.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = rgba(f.rgb, 0.5);
      ctx.shadowBlur = 8 * scale;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.shadowBlur = 0;
  }

  function drawBossBar() {
    let en = null;
    for (let i = 0; i < G.ents.length; i++) {
      if ((G.ents[i].type === 'boss' || G.ents[i].type === 'mid') && G.ents[i].hp > 0) {
        en = G.ents[i];
        break;
      }
    }
    if (!en) return;
    const w = 220;
    const h = 7;
    const x = (VW - w) * 0.5;
    const y = 16;
    const ratio = clamp(en.hp / en.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(10,6,4,0.7)';
    ctx.fillRect(sx(x - 2), sy(y - 2), (w + 4) * scale, (h + 4) * scale);
    ctx.fillStyle = rgba(en.type === 'boss' ? MAG : VIO, 0.95);
    ctx.fillRect(sx(x), sy(y), w * ratio * scale, h * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    const st = STAGES[G.stage - 1];
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(en.type === 'boss' ? (st ? st.boss : '核') : (st ? st.mid : '中核'), sx(VW * 0.5), sy(y - 6));
  }

  function drawFlash() {
    if (G.flash <= 0 && G.bombFlash <= 0) return;
    const a = Math.max(G.flash, G.bombFlash * 0.55);
    ctx.fillStyle = rgba(G.flashRgb || GOLD, a * 0.55);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#100a06';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const shx = G.shake && !REDUCE ? rand(-G.shake, G.shake) * scale * 0.35 : 0;
    const shy = G.shake && !REDUCE ? rand(-G.shake, G.shake) * scale * 0.35 : 0;
    ctx.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
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
    if (G.mode === 'title' || (G.mode === 'play' && G.deadT <= 0) || G.mode === 'win') {
      drawShip(G.player.x, G.player.y, G.mode === 'play' && G.deadT > 0);
    }
    drawFloats();
    drawBossBar();
    drawFlash();
    ctx.restore();
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
    G.blocks.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'raid';
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
    G.wpn = 'vulcan';
    G.wpnLv = 0;
    G.claws = 0;
    G.spread = 0.22;
    G.spdLv = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
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
    G.nextBlock = 28;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedStars();
    seedBlocks();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '交核 · 更密更快' : '雷交 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.lives = LIVES;
    G.bombs = 3;
    G.wpn = 'vulcan';
    G.wpnLv = 0;
    G.claws = 0;
    G.spread = 0.55;
    G.spdLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bombT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedStars();
    seedBlocks();
    showOverlay('title', '雷交', LEAD, '雷交', true);
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

  function bind() {
    window.addEventListener('keydown', function (e) { onKey(e, true); });
    window.addEventListener('keyup', function (e) { onKey(e, false); });
    window.addEventListener('resize', resize);
    window.addEventListener('blur', function () {
      keys.l = keys.r = keys.u = keys.d = false;
      G.fireHold = false;
    });
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (hidden) {
        keys.l = keys.r = keys.u = keys.d = false;
        G.fireHold = false;
      }
    });
    bindPointer();
    if (btnRaid) btnRaid.addEventListener('click', function () { audio.ensure(); startGame('raid'); });
    if (btnCore) btnCore.addEventListener('click', function () { audio.ensure(); startGame('core'); });
    if (ovRetry) ovRetry.addEventListener('click', function () { audio.ensure(); startGame(G.kind); });
    if (ovModes) ovModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win') {
        if (isCore()) goTitle();
        else startGame('core');
      }
    });
    if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
    if (btnMute) btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
    if (btnBomb) btnBomb.addEventListener('click', function () { tryBomb(); });
    if (btnPadBomb) btnPadBomb.addEventListener('click', function (e) {
      e.preventDefault();
      tryBomb();
    });
  }

  function loadMute() {
    try {
      if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
      else audio.setMuted(false);
    } catch (err) {
      audio.setMuted(false);
    }
  }

  loadBest();
  loadMute();
  bind();
  resize();
  seedStars();
  seedBlocks();
  G.claws = 0;
  showOverlay('title', '雷交', LEAD, '雷交', true);
  syncHud();
  requestAnimationFrame(frame);
})();
