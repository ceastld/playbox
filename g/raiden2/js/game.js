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
  const BEST_KEY = 'playbox-raiden2-best';
  const MUTE_KEY = 'playbox-raiden2-mute';
  const OPS = '方向 / WASD 移动 · 空格开火 · Shift / Z 簇弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const TEAL = [43, 238, 212];
  const MINT = [122, 255, 234];
  const PUR = [196, 92, 255];
  const LIL = [232, 176, 255];
  const MAG = [255, 77, 184];
  const GOLD = [255, 227, 107];
  const WHT = [232, 255, 248];
  const RED = [255, 92, 110];
  const ORG = [255, 168, 72];
  const PNK = [255, 154, 212];

  const WPN_NAME = { spread: '散', plasma: '紫' };
  const DROP_CYCLE = ['spread', 'plasma', 'bomb'];
  const DROP_GLYPH = { spread: '散', plasma: '紫', bomb: '簇' };

  const STAGES = [
    {
      name: '第 1 关 · 废城',
      mid: '装甲',
      boss: '城卫',
      midHp: 38,
      bossHp: 92,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.2, kind: 'stream', dir: 1 },
        { t: 5.8, kind: 'cork', n: 4 },
        { t: 8.4, kind: 'turrets' },
        { t: 10.8, kind: 'pod' },
        { t: 13.2, kind: 'walker' },
        { t: 15.6, kind: 'v', n: 7 },
        { t: 18.2, kind: 'cruiser' },
        { t: 21.0, kind: 'mid' },
        { t: 26.4, kind: 'stream', dir: -1 },
        { t: 28.8, kind: 'cork', n: 5 },
        { t: 31.4, kind: 'walker' },
        { t: 33.8, kind: 'pod' },
        { t: 36.2, kind: 'turrets' },
        { t: 39.0, kind: 'v', n: 7 },
        { t: 42.0, kind: 'cruiser' },
        { t: 47.2, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 海峡',
      mid: '潜堡',
      boss: '潮核',
      midHp: 52,
      bossHp: 128,
      waves: [
        { t: 0.6, kind: 'stream', dir: -1 },
        { t: 2.8, kind: 'cork', n: 5 },
        { t: 5.2, kind: 'v', n: 7 },
        { t: 7.6, kind: 'cruiser' },
        { t: 10.0, kind: 'walker' },
        { t: 12.4, kind: 'pod' },
        { t: 14.8, kind: 'stream', dir: 1 },
        { t: 17.2, kind: 'turrets' },
        { t: 19.6, kind: 'mid' },
        { t: 25.2, kind: 'cork', n: 6 },
        { t: 27.6, kind: 'cruiser' },
        { t: 30.0, kind: 'v', n: 9 },
        { t: 32.6, kind: 'walker' },
        { t: 35.0, kind: 'pod' },
        { t: 37.6, kind: 'stream', dir: -1 },
        { t: 40.2, kind: 'turrets' },
        { t: 43.0, kind: 'cruiser' },
        { t: 50.4, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 紫核',
      mid: '环卫',
      boss: '紫皇',
      midHp: 64,
      bossHp: 180,
      waves: [
        { t: 0.45, kind: 'v', n: 9 },
        { t: 2.4, kind: 'stream', dir: 1 },
        { t: 4.2, kind: 'stream', dir: -1 },
        { t: 6.2, kind: 'cork', n: 6 },
        { t: 8.4, kind: 'cruiser' },
        { t: 10.6, kind: 'pod' },
        { t: 12.8, kind: 'walker' },
        { t: 15.0, kind: 'v', n: 11 },
        { t: 17.2, kind: 'turrets' },
        { t: 19.2, kind: 'mid' },
        { t: 24.8, kind: 'cork', n: 7 },
        { t: 27.0, kind: 'cruiser' },
        { t: 29.2, kind: 'cruiser' },
        { t: 31.4, kind: 'v', n: 11 },
        { t: 33.8, kind: 'pod' },
        { t: 36.0, kind: 'stream', dir: 1 },
        { t: 37.8, kind: 'stream', dir: -1 },
        { t: 40.2, kind: 'walker' },
        { t: 42.6, kind: 'turrets' },
        { t: 52.4, kind: 'boss' }
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
  const btnRaid = document.getElementById('btn-raid');
  const btnCore = document.getElementById('btn-core');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
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
  const wavesBg = [];

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
    wpn: 'spread',
    wpnLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    blocks: [],
    clusters: [],
    blasts: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: TEAL,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    why: '',
    nextBlock: 40,
    waveT: 1.8
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
    return (isCore() ? 324 : 282) + G.wpnLv * 10;
  }
  function scrollSpd() {
    if (hasBig()) return isCore() ? 38 : 30;
    const base = isCore() ? 122 : 90;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isCore() ? 10 : 8);
  }
  function shotCap() {
    return isCore() ? 160 : 108;
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
      if (kind === 'plasma') this.beep(420, 0.09, 'sawtooth', 0.032, 180);
      else this.beep(720, 0.048, 'square', 0.03, 1620);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1400);
      this.beep(560 * lift, 0.066, 'square', 0.044, 980 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.09, big ? 0.076 : 0.046, big ? 220 : 460);
      this.beep(big ? 160 : 250, big ? 0.26 : 0.13, 'sawtooth', 0.05, 52);
    },
    cluster() {
      this.ensure();
      this.noise(0.16, 0.06, 280);
      this.beep(140, 0.22, 'sawtooth', 0.055, 60);
      this.beep(880, 0.12, 'sine', 0.035, 240);
    },
    pop() {
      this.ensure();
      this.noise(0.05, 0.04, 700);
      this.beep(620, 0.08, 'triangle', 0.036, 220);
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
    const n = WPN_NAME[G.wpn] || '散';
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
      tagLabel.textContent = isCore() ? '雷核' : '雷二';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('plasma', G.wpn === 'plasma');
    }
    if (bombLabel) {
      bombLabel.textContent = '簇 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (btnBomb) btnBomb.disabled = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
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
    else if (G.mode === 'win') setHint('紫核尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 簇弹连环炸', 'warn');
    else setHint('方向移动 · 空格开火 · Shift 簇弹 · 捡 散/紫', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showSecond) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'RDN2';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnRaid.textContent = primary;
    if (btnCore) {
      btnCore.classList.toggle('hidden', !showSecond);
      if (kind === 'title') btnCore.textContent = '雷核';
      else if (kind === 'lose') btnCore.textContent = '换模式';
      else btnCore.textContent = isCore() ? '换模式' : '雷核';
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
    G.flash = Math.max(G.flash, a || 0.45);
    G.flashRgb = rgb || TEAL;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.ceil(n * 0.4);
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.7, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
    capArr(particles, 180);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 18 });
    capArr(sparks, 24);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb || WHT,
      t: 0, life: gold ? 0.85 : 0.62, vy: gold ? -42 : -56,
      size: gold ? 14 : 11
    });
    capArr(floats, 18);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit((10 * p) | 0, {
      x: x, y: y, j: 8 * p,
      vx0: -160 * p, vx1: 160 * p, vy0: -200 * p, vy1: 80 * p,
      life: 0.32 + p * 0.08, r0: 1.2, r1: 3.4 + p, rgb: rgb, g: 90
    });
    popSpark(x, y, rgb, 14 + p * 10);
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: 8 + p * 6 });
    capArr(rings, 16);
    kick(2.2 + p * 1.6);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.4, 2.2),
        a: rand(0.18, 0.72)
      });
    }
  }

  function seedBlocks() {
    G.blocks.length = 0;
    for (let i = 0; i < 5; i++) spawnBlock(rand(-40, VH - 80));
  }

  function spawnBlock(y) {
    G.blocks.push({
      x: rand(36, VW - 36),
      y: y,
      w: rand(28, 72),
      h: rand(36, 90),
      win: 1 + ((Math.random() * 3) | 0),
      hue: Math.random()
    });
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      floatText(G.player.x, G.player.y - 28, '×' + G.mult, GOLD, true);
    }
    if (comboEl && G.combo >= 2) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
      comboTok += 1;
      const tok = comboTok;
      setTimeout(function () {
        if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
      }, 280);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function spawnEnt(spec) {
    G.ents.push({
      type: spec.type,
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy || 0,
      r: spec.r || 12,
      hp: spec.hp,
      maxHp: spec.hp,
      rgb: spec.rgb || MAG,
      score: spec.score || 50,
      t: 0,
      fireCd: spec.fireCd != null ? spec.fireCd : rand(0.4, 1.2),
      flash: 0,
      ground: !!spec.ground,
      drop: spec.drop || null,
      phase: spec.phase || 0,
      spin: spec.spin || 0,
      dive: false,
      name: spec.name || ''
    });
  }

  function spawnDart(x, y, extra) {
    const e = extra || {};
    spawnEnt({
      type: 'dart',
      x: x, y: y,
      vx: e.vx || 0,
      vy: e.vy || 92,
      r: 11,
      hp: isCore() ? 2 : 1,
      rgb: e.rgb || MAG,
      score: 50,
      fireCd: rand(0.7, 1.6),
      drop: e.drop || null,
      phase: e.phase || rand(-1, 1)
    });
  }

  function spawnV(n, xmid) {
    const mid = xmid == null ? VW * 0.5 + rand(-40, 40) : xmid;
    const count = n || 5;
    for (let i = 0; i < count; i++) {
      const k = i - (count - 1) / 2;
      spawnDart(mid + k * 28, -18 - Math.abs(k) * 16, { vy: 96 + Math.abs(k) * 4, phase: k });
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? -16 : VW + 16;
    for (let i = 0; i < 6; i++) {
      spawnDart(side, 40 + i * 28, {
        vx: dir * (118 + i * 6),
        vy: 54 + i * 8,
        phase: dir,
        rgb: PNK
      });
    }
  }

  function spawnCork(n) {
    const count = n || 4;
    for (let i = 0; i < count; i++) {
      spawnEnt({
        type: 'cork',
        x: rand(50, VW - 50),
        y: -24 - i * 22,
        vx: rand(-40, 40),
        vy: 70,
        r: 12,
        hp: isCore() ? 3 : 2,
        rgb: ORG,
        score: 100,
        fireCd: rand(0.6, 1.3),
        phase: rand(0, TAU)
      });
    }
  }

  function spawnCruiser(x) {
    spawnEnt({
      type: 'cruiser',
      x: x == null ? rand(80, VW - 80) : x,
      y: -36,
      vx: rand(-46, 46),
      vy: 62,
      r: 22,
      hp: isCore() ? 8 : 6,
      rgb: RED,
      score: 200,
      fireCd: 0.7
    });
  }

  function spawnPod() {
    spawnEnt({
      type: 'pod',
      x: rand(70, VW - 70),
      y: -30,
      vx: 0,
      vy: 58,
      r: 14,
      hp: isCore() ? 5 : 4,
      rgb: GOLD,
      score: 300,
      drop: 'cycle',
      fireCd: 8,
      phase: Math.random() < 0.5 ? -1 : 1
    });
  }

  function spawnTurret(x, y) {
    spawnEnt({
      type: 'turret',
      x: x, y: y,
      vx: 0, vy: 0,
      r: 13,
      hp: isCore() ? 5 : 4,
      rgb: GOLD,
      score: 150,
      ground: true,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnWalker(x) {
    spawnEnt({
      type: 'walker',
      x: x == null ? rand(50, VW - 50) : x,
      y: -40,
      vx: rand(28, 54) * (Math.random() < 0.5 ? -1 : 1),
      vy: 0,
      r: 16,
      hp: isCore() ? 7 : 5,
      rgb: TEAL,
      score: 180,
      ground: true,
      fireCd: 0.9
    });
  }

  function spawnTurretWave() {
    spawnTurret(rand(50, 160), -30);
    spawnTurret(rand(320, 430), -70);
    if (G.stage >= 2) spawnTurret(rand(180, 300), -110);
  }

  function hpMul() {
    return isCore() ? 1.24 : 1;
  }

  function spawnMid() {
    const st = STAGES[G.stage - 1];
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -70,
      vx: 72,
      vy: 88,
      r: 36,
      hp: Math.round((st ? st.midHp : 40) * hpMul()),
      rgb: PNK,
      score: 2000,
      fireCd: 0.8,
      name: st ? st.mid : '中'
    });
    audio.boss();
    toast((st ? st.mid : '中') + ' 出现', false, true);
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    const huge = G.stage >= 3;
    spawnEnt({
      type: 'boss',
      x: VW * 0.5,
      y: -90,
      vx: huge ? 54 : 64,
      vy: 70,
      r: huge ? 68 : 52,
      hp: Math.round((st ? st.bossHp : 90) * hpMul()),
      rgb: huge ? PUR : MAG,
      score: 4000,
      fireCd: 0.7,
      name: st ? st.boss : 'Boss'
    });
    audio.boss();
    toast((st ? st.boss : '巨舰') + ' 降临', false, true);
    screenFlash(PUR, 0.28);
  }

  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'boss' || t === 'mid') && G.ents[i].hp > 0) return true;
    }
    return false;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'cork') spawnCork(w.n);
    else if (w.kind === 'cruiser') spawnCruiser();
    else if (w.kind === 'pod') spawnPod();
    else if (w.kind === 'turrets') spawnTurretWave();
    else if (w.kind === 'walker') spawnWalker();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function nextDropKind() {
    const k = DROP_CYCLE[G.dropI % DROP_CYCLE.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y,
      vx: rand(-40, 40),
      vy: 48,
      t: 0,
      kind: kind || 'spread'
    });
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length >= shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      rgb: rgb || MAG, r: r || 3.2, wave: false
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
      const a = rot + (i / n) * TAU;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r);
    }
  }

  function waveShot(x, y, a0, n, spd, rgb) {
    const count = n || 7;
    for (let i = 0; i < count; i++) {
      const a = a0 + (i - (count - 1) / 2) * 0.22;
      if (G.eShots.length >= shotCap()) return;
      G.eShots.push({
        x: x, y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        rgb: rgb || PUR,
        r: 4.4,
        wave: true,
        age: 0
      });
    }
  }

  function nearestEnt(x, y) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dx = en.x - x;
      const dy = en.y - y;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = en;
      }
    }
    return best;
  }

  function addShot(spec) {
    if (G.shots.length > 56) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      kind: spec.kind || 'spread',
      pierce: spec.pierce || 0,
      dmg: spec.dmg || 1,
      trail: spec.trail || null,
      age: 0
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.wpnLv;
    const x = G.player.x;
    const y = G.player.y - 14;
    G.muzzle = 0.05;
    if (G.wpn === 'plasma') {
      G.fireCd = 0.07 - lv * 0.008;
      const spd = 620 + lv * 36;
      const seekTrail = REDUCE ? null : [];
      function blob(ox, oy, vx) {
        const tr = seekTrail ? [] : null;
        addShot({
          x: x + ox, y: y + oy,
          vx: vx || 0, vy: -spd,
          r: 5.2 + lv * 0.5,
          rgb: PUR,
          kind: 'plasma',
          pierce: 12 + lv * 4,
          dmg: 1,
          trail: tr
        });
        if (tr) tr.push({ x: x + ox, y: y + oy });
      }
      if (lv <= 0) blob(0, 0, 0);
      else if (lv === 1) {
        blob(0, -2, 0);
        blob(0, 6, 0);
      } else if (lv === 2) {
        blob(-10, 2, -70);
        blob(0, -2, 0);
        blob(10, 2, 70);
      } else {
        blob(-16, 4, -110);
        blob(-6, 0, -40);
        blob(0, -3, 0);
        blob(6, 0, 40);
        blob(16, 4, 110);
      }
    } else {
      G.fireCd = 0.108 - lv * 0.016;
      const spd = -680;
      function fan(ox, oy, vx, vy) {
        addShot({
          x: x + ox, y: y + oy,
          vx: vx || 0,
          vy: vy == null ? spd : vy,
          r: 3.15,
          rgb: lv >= 2 ? GOLD : WHT,
          kind: 'spread',
          dmg: 1
        });
      }
      if (lv <= 0) fan(0, 0);
      else if (lv === 1) {
        fan(-8, 2, -76, spd);
        fan(0, -2);
        fan(8, 2, 76, spd);
      } else if (lv === 2) {
        fan(-15, 4, -118, spd);
        fan(-6, 0, -42, spd);
        fan(0, -3);
        fan(6, 0, 42, spd);
        fan(15, 4, 118, spd);
      } else {
        fan(-17, 5, -136, spd);
        fan(-10, 1, -64, spd);
        fan(-3, -2);
        fan(3, -2);
        fan(10, 1, 64, spd);
        fan(17, 5, 136, spd);
      }
    }
    audio.shoot(G.wpn);
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: G.wpn === 'plasma' ? PUR : GOLD,
      g: 0
    });
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('簇弹用尽', true);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.62;
    G.bombFlash = 0.42;
    G.invuln = Math.max(G.invuln, 0.55);
    audio.cluster();
    screenFlash(PUR, 0.38);
    popSpark(G.player.x, G.player.y - 10, GOLD, 28);
    rings.push({ x: G.player.x, y: G.player.y, t: 0, rgb: PUR, r: 16 });
    emit(16, {
      x: G.player.x, y: G.player.y, j: 10,
      vx0: -180, vx1: 180, vy0: -240, vy1: 40,
      life: 0.32, r0: 1.4, r1: 3.4, rgb: GOLD, g: 40
    });
    G.clusters.push({
      x: G.player.x,
      y: G.player.y - 12,
      vx: 0,
      vy: -260,
      t: 0,
      phase: 'seed',
      n: 7 + Math.min(2, G.wpnLv)
    });
    hitStop(0.042);
    kick(5.4);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    syncHud();
  }

  function explodeBlast(x, y, r, dmgBoss, dmgMid, dmgNorm) {
    G.blasts.push({ x: x, y: y, r: r, t: 0, life: 0.16, struck: [] });
    juice(x, y, GOLD, 1.15);
    popSpark(x, y, PUR, r * 0.7);
    rings.push({ x: x, y: y, t: 0, rgb: TEAL, r: r * 0.35 });
    audio.pop();
    hitStop(0.04);
    kick(3.6);
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      const dx = s.x - x;
      const dy = s.y - y;
      if (dx * dx + dy * dy < r * r) {
        emit(2, {
          x: s.x, y: s.y, j: 2,
          vx0: -50, vx1: 50, vy0: -50, vy1: 50,
          life: 0.14, r0: 1, r1: 2.2, rgb: LIL, g: 0
        });
        G.eShots.splice(i, 1);
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dx = en.x - x;
      const dy = en.y - y;
      const rr = r + en.r;
      if (dx * dx + dy * dy < rr * rr) {
        const dmg = en.type === 'boss' ? dmgBoss : en.type === 'mid' ? dmgMid : dmgNorm;
        hurtEnt(en, dmg, en.x, en.y);
      }
    }
  }

  function updateClusters(dt) {
    for (let i = G.clusters.length - 1; i >= 0; i--) {
      const c = G.clusters[i];
      c.t += dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.phase === 'seed') {
        c.vy += 40 * dt;
        if (c.t >= 0.16 || c.y < 90) {
          const n = c.n || 7;
          for (let k = 0; k < n; k++) {
            const a = -Math.PI * 0.72 + (k / (n - 1)) * Math.PI * 1.44;
            G.clusters.push({
              x: c.x,
              y: c.y,
              vx: Math.cos(a) * rand(160, 280),
              vy: Math.sin(a) * rand(140, 240) - 40,
              t: -k * 0.035,
              phase: 'sub',
              delay: 0.18 + k * 0.028
            });
          }
          juice(c.x, c.y, PUR, 1.4);
          audio.pop();
          G.clusters.splice(i, 1);
        }
      } else {
        c.vy += 220 * dt;
        if (c.t >= c.delay) {
          explodeBlast(c.x, c.y, 58, 15, 11, 7);
          G.clusters.splice(i, 1);
        } else if (c.y > VH + 30 || c.x < -30 || c.x > VW + 30) {
          G.clusters.splice(i, 1);
        }
      }
    }
    for (let i = G.blasts.length - 1; i >= 0; i--) {
      const b = G.blasts[i];
      b.t += dt;
      if (b.t >= b.life) G.blasts.splice(i, 1);
    }
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
    const pwr = en.type === 'boss' ? 2.8 : en.type === 'mid' ? 2.15 : en.type === 'cruiser' ? 1.3 : 0.88;
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
    else if ((en.type === 'cruiser' || en.type === 'walker') && Math.random() < 0.22) spawnPow(en.x, en.y, nextDropKind());
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
        toast('簇弹 +1', false, true);
      } else {
        addScore(800 * G.mult);
        toast('+800', false, true);
      }
    } else {
      const kind = p.kind === 'plasma' ? 'plasma' : 'spread';
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
    juice(p.x, p.y, p.kind === 'plasma' ? PUR : p.kind === 'bomb' ? GOLD : TEAL, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, DROP_GLYPH[p.kind] || '散', p.kind === 'plasma' ? PUR : p.kind === 'bomb' ? GOLD : TEAL, true);
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
    if (G.wpnLv > 0 || G.wpn !== 'spread') {
      spawnPow(G.player.x, G.player.y - 18, G.wpn);
    }
    G.wpn = 'spread';
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
    G.why = '舰毁了';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''), '再来', true);
    syncHud();
  }

  function winGame() {
    addScore(8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '紫核尽破', (isCore() ? '雷核通关' : '三关打穿') + ' · 分数 ' + G.score, '再来', true);
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
      while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t * 0.84) {
        fireWave(st.waves[G.waveI]);
        G.waveI += 1;
      }
    }
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    G.spawnT = clamp(1.48 / (1 + G.stage * 0.12), 0.4, 1.48);
    if (livingCount() > 28) return;
    const r = Math.random();
    if (r < 0.3) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.5) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.66) spawnCork(3 + (Math.random() * 4) | 0);
    else if (r < 0.78) spawnCruiser();
    else if (r < 0.88) spawnPod();
    else spawnWalker();
  }

  function bossFire(en, core) {
    const low = en.hp < en.maxHp * 0.34;
    const mid = en.hp < en.maxHp * 0.62;
    const stg = G.stage;
    en.spin += core ? 0.24 : 0.17;
    if (en.type === 'mid') {
      aimShot(en.x, en.y + 16, core ? 214 : 178, PUR);
      eShot(en.x - 20, en.y + 10, -50, 190, PNK);
      eShot(en.x + 20, en.y + 10, 50, 190, PNK);
      if (mid) waveShot(en.x, en.y + 12, Math.PI * 0.5, core ? 9 : 7, 168, PUR);
      if (low) {
        aimShot(en.x - 24, en.y + 8, 206, MAG);
        aimShot(en.x + 24, en.y + 8, 206, MAG);
      }
      en.fireCd = low ? 0.32 : mid ? 0.46 : 0.62;
    } else if (stg === 1) {
      aimShot(en.x, en.y + 18, 216, MAG);
      eShot(en.x - 28, en.y + 12, -54, 198, RED);
      eShot(en.x + 28, en.y + 12, 54, 198, RED);
      if (mid) waveShot(en.x, en.y + 14, Math.PI * 0.5, core ? 11 : 8, 160, PUR);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 44, 210, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.54;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, core ? 14 : 11, 148, en.spin, MAG, 3.15);
      waveShot(en.x, en.y + 10, Math.PI * 0.5 + Math.sin(en.t) * 0.2, 8, 154, PUR);
      if (mid) {
        ringShot(en.x, en.y + 8, core ? 10 : 8, 118, -en.spin * 1.4, LIL, 3.0);
        aimShot(en.x, en.y + 16, 204, GOLD);
      }
      if (low) {
        aimShot(en.x - 30, en.y + 10, 224, RED);
        aimShot(en.x + 30, en.y + 10, 224, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.56;
    } else {
      waveShot(en.x, en.y + 8, Math.PI * 0.5 + Math.sin(en.t * 1.6) * 0.35, core ? 13 : 10, 158, PUR);
      ringShot(en.x, en.y + 6, core ? 14 : 11, 132, en.spin, MAG, 3.2);
      if (mid) {
        waveShot(en.x - 28, en.y + 10, Math.PI * 0.55, 7, 170, LIL);
        waveShot(en.x + 28, en.y + 10, Math.PI * 0.45, 7, 170, LIL);
        aimShot(en.x, en.y + 18, 214, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, core ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
        waveShot(en.x, en.y + 6, Math.PI * 0.5, core ? 15 : 12, 188, PUR);
      }
      en.fireCd = low ? 0.24 : mid ? 0.38 : 0.5;
    }
    if (core) en.fireCd *= 0.76;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0 || G.bombT > 0;
    const core = isCore();
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
        if (en.type === 'walker') {
          en.x += en.vx * dt;
          if (en.x < 40 || en.x > VW - 40) en.vx *= -1;
        }
      } else if (en.type === 'mid' || en.type === 'boss') {
        const ty = en.type === 'boss' ? (G.stage >= 3 ? 118 : 108) : 124;
        if (en.y < ty) en.y += en.vy * dt;
        else {
          en.y = ty;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? (G.stage >= 3 ? 102 : 92) : 78;
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
      } else if (en.type === 'cork') {
        en.phase += dt * 4.2;
        en.x += Math.cos(en.phase) * 118 * dt + en.vx * dt * 0.2;
        en.y += (en.vy + 46) * dt;
      } else if (en.type === 'dart') {
        if (!en.dive && en.t > 1.22 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.22) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 96, dt * 2);
          en.vy = Math.max(en.vy, 158);
        } else {
          en.x += Math.sin(en.t * 3 + en.phase) * 28 * dt;
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'cruiser') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < 50 || en.x > VW - 50) en.vx *= -1;
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
          if (en.type === 'dart' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, core ? 202 : 174, MAG);
            if (core && Math.random() < 0.45) aimShot(en.x, en.y + 8, 170, PNK);
            en.fireCd = (core ? 1.28 : 2.2) + rand(0, 0.55);
          } else if (en.type === 'cork' && en.y > 20 && en.y < VH - 80) {
            aimShot(en.x, en.y + 8, core ? 196 : 164, ORG);
            en.fireCd = (core ? 1.05 : 1.55) + rand(0, 0.4);
          } else if (en.type === 'cruiser') {
            eShot(en.x - 12, en.y + 12, -36, 180, RED);
            eShot(en.x, en.y + 14, 0, 202, RED);
            eShot(en.x + 12, en.y + 12, 36, 180, RED);
            if (core) aimShot(en.x, en.y + 10, 188, ORG);
            en.fireCd = core ? 0.7 : 1.02;
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, core ? 216 : 176, GOLD);
            if (core) {
              eShot(en.x - 8, en.y + 4, -42, 164, ORG);
              eShot(en.x + 8, en.y + 4, 42, 164, ORG);
            }
            en.fireCd = (core ? 0.76 : 1.12) + rand(0, 0.28);
          } else if (en.type === 'walker' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, core ? 204 : 168, TEAL);
            if (Math.random() < 0.4) waveShot(en.x, en.y, Math.PI * 0.5, 5, 150, PUR);
            en.fireCd = core ? 0.68 : 0.98;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, core);
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
      s.age += dt;
      if (s.kind === 'plasma') {
        const t = nearestEnt(s.x, s.y);
        if (t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const len = hypot(dx, dy) || 1;
          const spd = hypot(s.vx, s.vy) || 640;
          const wantX = dx / len * spd;
          const wantY = dy / len * spd;
          const turn = 1 - Math.exp(-dt * (3.4 + G.wpnLv * 0.7));
          s.vx = lerp(s.vx, wantX, turn);
          s.vy = lerp(s.vy, wantY, turn);
        }
        if (s.trail) {
          s.trail.push({ x: s.x, y: s.y });
          if (s.trail.length > 12) s.trail.shift();
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -28 || s.x < -22 || s.x > VW + 22 || s.y > VH + 28 || s.age > 1.6) {
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
          if (s.kind === 'plasma') {
            if (s.pierce > 0) s.pierce -= 1;
            else hit = true;
            if (hit) break;
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
      s.age = (s.age || 0) + dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.wave) {
        s.r = Math.min(7.2, 4.4 + s.age * 3.4);
      }
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
    G.waveT -= dt;
    if (G.waveT <= 0) {
      G.waveT = rand(1.4, 3.2);
      if (!REDUCE && G.mode !== 'lose') {
        wavesBg.push({
          x: rand(40, VW - 40),
          y: rand(30, 260),
          t: 0,
          life: 0.9,
          rgb: G.stage >= 3 ? PUR : TEAL
        });
      }
    }
    for (let i = wavesBg.length - 1; i >= 0; i--) {
      wavesBg[i].t += dt;
      if (wavesBg[i].t >= wavesBg[i].life) wavesBg.splice(i, 1);
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
    updateClusters(dt);
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#062428');
      g.addColorStop(0.5, '#041c20');
      g.addColorStop(1, '#021410');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#14081c');
      g.addColorStop(0.5, '#0a1420');
      g.addColorStop(1, '#021410');
    } else {
      g.addColorStop(0, '#083028');
      g.addColorStop(0.55, '#041c18');
      g.addColorStop(1, '#021410');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = G.stage >= 3 ? 'rgba(220,180,255,' + s.a + ')' : 'rgba(180,255,240,' + s.a + ')';
      ctx.fillRect(sx(s.x), sy(s.y), Math.max(1, s.z * scale), Math.max(1, s.z * 1.6 * scale));
    }

    const off = G.scroll % 40;
    ctx.lineWidth = 1.2 * scale;
    for (let y = -40; y < VH + 40; y += 40) {
      const yy = y + (40 - off);
      ctx.strokeStyle = rgba(G.stage >= 3 ? PUR : TEAL, 0.045 + ((y / 40 | 0) % 2 === 0 ? 0.02 : 0));
      ctx.beginPath();
      for (let x = 0; x <= VW; x += 16) {
        const yy2 = yy + Math.sin((x + G.scroll) * 0.018 + G.t) * 3.4;
        if (x === 0) ctx.moveTo(sx(x), sy(yy2));
        else ctx.lineTo(sx(x), sy(yy2));
      }
      ctx.stroke();
    }

    for (let i = 0; i < wavesBg.length; i++) {
      const w = wavesBg[i];
      const a = 1 - w.t / w.life;
      ctx.strokeStyle = rgba(w.rgb, a * 0.35);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(w.y), (18 + w.t * 70) * scale, (8 + w.t * 22) * scale, 0, 0, TAU);
      ctx.stroke();
    }

    for (let i = 0; i < G.blocks.length; i++) {
      const b = G.blocks[i];
      const x = sx(b.x - b.w * 0.5);
      const y = sy(b.y);
      const w = b.w * scale;
      const h = b.h * scale;
      ctx.fillStyle = G.stage === 2 ? 'rgba(8, 32, 40, 0.9)' : G.stage === 3 ? 'rgba(22, 10, 36, 0.9)' : 'rgba(8, 36, 32, 0.92)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = rgba(b.hue > 0.55 ? PUR : TEAL, 0.18 + b.hue * 0.12);
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = rgba(b.hue > 0.55 ? PUR : TEAL, 0.22);
      const cols = Math.max(1, b.win);
      const cw = w / (cols + 1);
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < 3; r++) {
          ctx.fillRect(x + cw * (c + 0.45), y + h * (0.18 + r * 0.26), Math.max(2, 3 * scale), Math.max(2, 3.4 * scale));
        }
      }
    }
  }

  function drawShip(x, y, a) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.player.vx * 0.0015);
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.shadowColor = rgba(G.wpn === 'plasma' ? PUR : TEAL, 0.58);
    ctx.shadowBlur = 12;
    const flash = G.muzzle > 0;
    ctx.fillStyle = flash ? '#f4fff8' : rgba(TEAL, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(6, -1);
    ctx.lineTo(15, 5);
    ctx.lineTo(5, 3);
    ctx.lineTo(6, 12);
    ctx.lineTo(0, 8);
    ctx.lineTo(-6, 12);
    ctx.lineTo(-5, 3);
    ctx.lineTo(-15, 5);
    ctx.lineTo(-6, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.88);
    ctx.fillRect(-1.4, -11, 2.8, 11);
    ctx.fillStyle = rgba(PUR, 0.9);
    ctx.fillRect(-12, 2, 6, 2.4);
    ctx.fillRect(6, 2, 6, 2.4);
    const pr = Math.sin(G.t * 48);
    ctx.fillStyle = rgba(GOLD, 0.7 + pr * 0.25);
    ctx.beginPath();
    ctx.moveTo(-3.2, 10);
    ctx.lineTo(0, 17 + pr * 3);
    ctx.lineTo(3.2, 10);
    ctx.closePath();
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(G.wpn === 'plasma' ? PUR : GOLD, 0.92);
      ctx.beginPath();
      ctx.moveTo(-3.2, -16);
      ctx.lineTo(0, -28);
      ctx.lineTo(3.2, -16);
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
    if (en.type === 'dart' || en.type === 'cork') {
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(9, 2);
      ctx.lineTo(3, 1);
      ctx.lineTo(2.4, -11);
      ctx.lineTo(-2.4, -11);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-9, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.32);
      ctx.fillRect(-1.1, -2, 2.2, 7);
    } else if (en.type === 'cruiser') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-20, -4, 9, 16);
      ctx.fillRect(11, -4, 9, 16);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-7, -4, 14, 5);
    } else if (en.type === 'turret') {
      const dx = G.player.x - en.x;
      const dy = G.player.y - en.y;
      ctx.fillStyle = 'rgba(24, 42, 40, 0.95)';
      ctx.beginPath();
      ctx.arc(0, 4, 11, 0, TAU);
      ctx.fill();
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, TAU);
      ctx.fill();
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillRect(4, -2.1, 14, 4.2);
    } else if (en.type === 'walker') {
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.fillRect(-15, -8, 30, 12);
      ctx.fillRect(-18, 4, 10, 7);
      ctx.fillRect(8, 4, 10, 7);
      ctx.fillRect(-4, -14, 8, 8);
      ctx.fillStyle = rgba(WHT, 0.25);
      ctx.fillRect(-7, -4, 14, 5);
    } else if (en.type === 'pod') {
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
      ctx.fillStyle = '#041410';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText('武', 0, 2);
    } else if (en.type === 'mid') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 40, 15, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-34, -7, 13, 26);
      ctx.fillRect(21, -7, 13, 26);
      ctx.fillStyle = rgba(PUR, 0.7);
      ctx.fillRect(-8, -2, 16, 8);
    } else if (en.type === 'boss') {
      const huge = G.stage >= 3;
      ctx.beginPath();
      ctx.ellipse(0, 4, huge ? 72 : 54, huge ? 20 : 16, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(huge ? -58 : -46, -10, huge ? 16 : 14, huge ? 36 : 30);
      ctx.fillRect(-12, huge ? -16 : -12, 24, huge ? 46 : 38);
      ctx.fillRect(huge ? 42 : 32, -10, huge ? 16 : 14, huge ? 36 : 30);
      if (huge) {
        ctx.fillStyle = rgba(PUR, 0.85);
        ctx.beginPath();
        ctx.arc(-40, 8, 8, 0, TAU);
        ctx.arc(40, 8, 8, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = rgba(GOLD, 0.72);
      ctx.fillRect(-26, 0, 9, 8);
      ctx.fillRect(17, 0, 9, 8);
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(huge ? -36 : -30, -2, huge ? 72 : 60, 7);
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      if (s.kind === 'plasma') {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const pts = s.trail && s.trail.length > 1 ? s.trail : null;
        if (pts) {
          ctx.beginPath();
          ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
          for (let k = 1; k < pts.length; k++) ctx.lineTo(sx(pts[k].x), sy(pts[k].y));
          ctx.strokeStyle = rgba(PUR, 0.28);
          ctx.lineWidth = (10 + G.wpnLv) * scale;
          ctx.shadowColor = rgba(PUR, 0.85);
          ctx.shadowBlur = 14 * scale;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
          for (let k = 1; k < pts.length; k++) ctx.lineTo(sx(pts[k].x), sy(pts[k].y));
          ctx.strokeStyle = rgba(LIL, 0.95);
          ctx.lineWidth = (3.4 + G.wpnLv * 0.4) * scale;
          ctx.shadowBlur = 0;
          ctx.stroke();
        } else {
          ctx.fillStyle = rgba(PUR, 0.95);
          ctx.shadowColor = rgba(PUR, 0.85);
          ctx.shadowBlur = 12 * scale;
          ctx.beginPath();
          ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.shadowColor = rgba(s.rgb, 0.85);
        ctx.shadowBlur = 9 * scale;
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
      if (s.wave) {
        ctx.beginPath();
        ctx.ellipse(sx(s.x), sy(s.y), s.r * 1.8 * scale, s.r * 0.7 * scale, Math.atan2(s.vy, s.vx), 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.45);
        ctx.beginPath();
        ctx.ellipse(sx(s.x), sy(s.y), s.r * 0.7 * scale, s.r * 0.28 * scale, Math.atan2(s.vy, s.vx), 0, TAU);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.55);
        ctx.beginPath();
        ctx.arc(sx(s.x - 0.6), sy(s.y - 0.6), s.r * 0.35 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawClusters() {
    for (let i = 0; i < G.clusters.length; i++) {
      const c = G.clusters[i];
      ctx.save();
      ctx.translate(sx(c.x), sy(c.y));
      ctx.scale(scale, scale);
      if (c.phase === 'seed') {
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.shadowColor = rgba(PUR, 0.8);
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(6, 4);
        ctx.lineTo(0, 8);
        ctx.lineTo(-6, 4);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(PUR, 0.95);
        ctx.shadowColor = rgba(GOLD, 0.7);
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 4.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.beginPath();
        ctx.arc(0, 0, 1.8, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    for (let i = 0; i < G.blasts.length; i++) {
      const b = G.blasts[i];
      const a = 1 - b.t / b.life;
      ctx.save();
      ctx.strokeStyle = rgba(GOLD, a * 0.85);
      ctx.lineWidth = 3 * a * scale;
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * (0.45 + b.t / b.life * 0.7) * scale, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(PUR, a * 0.12);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * 0.55 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 8) * 2;
      const rgb = p.kind === 'plasma' ? PUR : p.kind === 'bomb' ? GOLD : TEAL;
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
      ctx.fillStyle = '#041410';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.2);
      ctx.shadowBlur = 0;
      ctx.fillText(DROP_GLYPH[p.kind] || '散', 0, 1);
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
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : PUR, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : PUR, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    if (boss.name) {
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.font = 'bold ' + (9 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(boss.name, sx(x), sy(y - 4));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    if (G.bombFlash > 0) {
      ctx.strokeStyle = rgba(PUR, G.bombFlash * 0.9);
      ctx.lineWidth = 7 * scale;
      ctx.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020c0c';
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
    drawClusters();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawShip(G.player.x, G.player.y, 1);
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
    G.blocks.length = 0;
    G.clusters.length = 0;
    G.blasts.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wavesBg.length = 0;
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
    G.wpn = 'spread';
    G.wpnLv = 0;
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
    G.waveT = 1.2;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedStars();
    seedBlocks();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '雷核 · 更密更快' : '雷二 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.lives = LIVES;
    G.bombs = 3;
    G.wpn = 'spread';
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
    seedBlocks();
    showOverlay('title', '雷二', '纵向卷轴。散弹铺面，紫波缠敌，Shift 扔簇弹连环炸开。撞机扣一命。三关之后是巨舰。', '雷二', true);
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
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('raid');
    });
  }
  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && isCore()) goTitle();
      else startGame('core');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnBomb) btnBomb.addEventListener('click', tryBomb);
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
