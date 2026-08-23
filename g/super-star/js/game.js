'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const BOMB_CAP = 6;
  const WPN_MAX = 3;
  const BEST_KEY = 'playbox-super-star-best';
  const MUTE_KEY = 'playbox-super-star-mute';
  const OPS = '方向 / WASD 飞 · 空格开火 · Shift / Z 星爆 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [10, 194, 255];
  const SKY = [92, 232, 255];
  const GOLD = [255, 227, 107];
  const MINT = [46, 232, 200];
  const WHT = [232, 251, 255];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 160, 72];
  const VIO = [120, 140, 255];
  const DEEP = [8, 36, 48];

  const WPN_NAME = { five: '五', beam: '束', chase: '追' };
  const DROP_CYCLE = ['five', 'beam', 'chase', 'bomb'];
  const DROP_GLYPH = { five: '五', beam: '束', chase: '追', bomb: '爆' };
  const WPN_RGB = { five: CYN, beam: MINT, chase: SKY, bomb: GOLD };

  const STAGES = [
    {
      name: '第 1 关 · 星原',
      mid: '星卫',
      boss: '星门',
      midHp: 34,
      bossHp: 80,
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.0, kind: 'weaver', dir: 1 },
        { t: 5.4, kind: 'dive', n: 4 },
        { t: 7.8, kind: 'turrets' },
        { t: 10.2, kind: 'carrier' },
        { t: 12.6, kind: 'v', n: 7 },
        { t: 15.0, kind: 'mid' },
        { t: 20.2, kind: 'ring', n: 4 },
        { t: 22.6, kind: 'dive', n: 4 },
        { t: 24.8, kind: 'weaver', dir: -1 },
        { t: 27.2, kind: 'v', n: 7 },
        { t: 32.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 晶海',
      mid: '晶卫',
      boss: '晶塔',
      midHp: 46,
      bossHp: 108,
      waves: [
        { t: 0.55, kind: 'v', n: 7 },
        { t: 2.6, kind: 'dive', n: 5 },
        { t: 4.8, kind: 'weaver', dir: -1 },
        { t: 7.2, kind: 'ring', n: 5 },
        { t: 9.4, kind: 'carrier' },
        { t: 11.6, kind: 'turrets' },
        { t: 13.8, kind: 'v', n: 9 },
        { t: 16.0, kind: 'mid' },
        { t: 21.4, kind: 'weaver', dir: 1 },
        { t: 23.6, kind: 'dive', n: 6 },
        { t: 25.8, kind: 'ring', n: 5 },
        { t: 28.0, kind: 'carrier' },
        { t: 30.2, kind: 'v', n: 9 },
        { t: 36.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 核渊',
      mid: '核卫',
      boss: '超武核',
      midHp: 58,
      bossHp: 152,
      waves: [
        { t: 0.45, kind: 'v', n: 9 },
        { t: 2.2, kind: 'weaver', dir: 1 },
        { t: 4.0, kind: 'weaver', dir: -1 },
        { t: 6.0, kind: 'dive', n: 6 },
        { t: 8.0, kind: 'ring', n: 6 },
        { t: 10.0, kind: 'carrier' },
        { t: 11.8, kind: 'turrets' },
        { t: 13.8, kind: 'mid' },
        { t: 19.0, kind: 'v', n: 11 },
        { t: 21.0, kind: 'dive', n: 6 },
        { t: 23.0, kind: 'ring', n: 6 },
        { t: 25.0, kind: 'carrier' },
        { t: 27.0, kind: 'weaver', dir: 1 },
        { t: 28.8, kind: 'weaver', dir: -1 },
        { t: 31.0, kind: 'v', n: 9 },
        { t: 38.0, kind: 'boss' }
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
  const btnStorm = document.getElementById('btn-storm');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
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
  let eid = 1;
  let inputSrc = 'key';

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
    wpn: 'five',
    wpnLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    reefs: [],
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
    spawnT: 0.7,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    nextReef: 40,
    why: ''
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
  function isDense() {
    return G.kind === 'storm';
  }
  function plySpd() {
    return (isDense() ? 318 : 272) + G.wpnLv * 12;
  }
  function scrollSpd() {
    if (hasBig()) return isDense() ? 36 : 28;
    return (isDense() ? 134 : 96) + G.stage * 6 + Math.min(18, G.combo);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isDense() ? 168 : 112;
  }
  function wingSpan() {
    return 10 + G.wpnLv * 6;
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
      if (kind === 'beam') this.beep(880, 0.07, 'sawtooth', 0.03, 360);
      else if (kind === 'chase') this.beep(560, 0.06, 'triangle', 0.032, 980);
      else this.beep(720, 0.046, 'square', 0.03, 1520);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1300);
      this.beep(580 * lift, 0.066, 'square', 0.042, 1040 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.1, big ? 0.076 : 0.046, big ? 220 : 460);
      this.beep(big ? 160 : 250, big ? 0.26 : 0.13, 'sawtooth', 0.05, 52);
    },
    bomb() {
      this.ensure();
      this.noise(0.3, 0.082, 160);
      this.beep(86, 0.44, 'sawtooth', 0.072, 38);
      this.beep(880, 0.22, 'sine', 0.04, 220);
    },
    pow() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.044, 784);
      this.beep(784, 0.13, 'triangle', 0.04, 1175);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.04, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.03, 1176);
    },
    miss() {
      this.ensure();
      this.beep(150, 0.07, 'sine', 0.025, 84);
    },
    death() {
      this.ensure();
      this.noise(0.15, 0.056, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 76);
      this.beep(150, 0.32, 'sine', 0.045, 44);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(185, 0.18, 'sawtooth', 0.052, 98);
      this.beep(138, 0.3, 'square', 0.04, 72);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(208, 0.18, 'sawtooth', 0.04, 86);
      this.beep(130, 0.3, 'sine', 0.05, 46);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    oneup() {
      this.ensure();
      this.beep(659, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1318);
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
    if (G.score > G.best) G.best = G.score;
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function addScore(n) {
    if (n <= 0) return;
    G.score += n;
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
      if (bestEl) bestEl.textContent = String(G.best);
    }
    let up = false;
    while (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      up = true;
    }
    if (up) {
      audio.oneup();
      toast('1UP', false, true);
      syncHud();
    }
    if (scoreEl) scoreEl.textContent = String(G.score);
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
        if (tok === addTok && scoreAdd) scoreAdd.hidden = true;
      }, 700);
    }
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok && toastEl) toastEl.classList.add('hidden');
    }, 1100);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function wpnText() {
    const name = WPN_NAME[G.wpn] || '五';
    if (G.wpnLv <= 0) return name;
    if (G.wpnLv >= WPN_MAX) return name + ' MAX';
    return name + ' ' + G.wpnLv;
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
      const el = document.createElement('i');
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
      tagLabel.textContent = isDense() ? '星核' : '超武';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('five', G.wpn === 'five');
      wpnLabel.classList.toggle('beam', G.wpn === 'beam');
      wpnLabel.classList.toggle('chase', G.wpn === 'chase');
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
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
    else if (G.mode === 'win') setHint('超武通关 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 星爆清屏', 'warn');
    else setHint('方向飞 · 空格开火 · Shift 星爆 · 捡 五/束/追', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SSOL';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isDense() ? '换模式' : '星核';
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
        g: spec.g == null ? 520 : spec.g,
        star: !!spec.star
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
      life: 0.28 + p * 0.14, r0: 1, r1: 2.6 + p, rgb: rgb, star: p >= 1.2
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.18 + p * 0.14);
    kick(2.2 + p * 2.6);
  }

  function burstStars(x, y, rgb, n) {
    const k = n || 5;
    for (let i = 0; i < k; i++) {
      const a = -Math.PI / 2 + i * (TAU / k);
      emit(2, {
        x: x + Math.cos(a) * 8, y: y + Math.sin(a) * 8, j: 2,
        vx0: Math.cos(a) * 80, vx1: Math.cos(a) * 160,
        vy0: Math.sin(a) * 80, vy1: Math.sin(a) * 160,
        life: 0.32, r0: 1.4, r1: 2.8, rgb: rgb, g: 40, star: true
      });
    }
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.5),
        a: rand(0.18, 0.78),
        tw: rand(0, TAU)
      });
    }
  }

  function seedReefs() {
    G.reefs.length = 0;
    for (let i = 0; i < 7; i++) spawnReef(-30 - i * 110);
  }

  function spawnReef(y) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const w = rand(32, 72);
    const h = rand(44, 100);
    const x = side < 0 ? rand(10, 74) : rand(VW - 74, VW - 10);
    G.reefs.push({
      x: x, y: y, w: w, h: h,
      kind: G.stage,
      hue: hash2((G.scroll + y) | 0),
      shards: 2 + ((hash2(((G.scroll + y) * 5) | 0) * 3) | 0)
    });
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      burstStars(G.player.x, G.player.y - 12, GOLD, 5);
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
      id: eid++,
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
      spin: spec.spin || 0,
      baseX: spec.x
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
      vy: extra.vy == null ? 84 : extra.vy,
      hp: extra.hp || 1,
      r: 11,
      score: 50,
      rgb: extra.rgb || CYN,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.6, 1.4),
      phase: extra.phase || 0
    });
  }

  function spawnV(n, xmid) {
    const mid = xmid == null ? VW * 0.5 + rand(-40, 40) : xmid;
    const gap = 28;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2;
      spawnScout(mid + k * gap, -18 - Math.abs(k) * 16, { vy: 92, fireCd: 0.7 + Math.abs(k) * 0.12 });
    }
  }

  function spawnWeaver(dir) {
    const x = dir > 0 ? -20 : VW + 20;
    for (let i = 0; i < 6; i++) {
      spawnEnt({
        type: 'weaver',
        x: x, y: 40 + i * 28,
        vx: dir * 98, vy: 46,
        hp: 1, r: 10, score: 60,
        rgb: SKY, phase: i * 0.4, fireCd: 0.9 + i * 0.08
      });
    }
  }

  function spawnDive(n) {
    for (let i = 0; i < n; i++) {
      const x = 50 + i * ((VW - 100) / Math.max(1, n - 1));
      spawnEnt({
        type: 'dive',
        x: x, y: -24 - i * 18,
        vx: 0, vy: 44,
        hp: 2, r: 13, score: 80,
        rgb: VIO, dive: true, fireCd: 0.5 + i * 0.1
      });
    }
  }

  function spawnTurret(x, y) {
    spawnEnt({
      type: 'turret',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 4, r: 14, score: 150,
      rgb: ORG, ground: true, fireCd: rand(0.6, 1.2),
      w: 26, h: 22
    });
  }

  function spawnTurretWave() {
    spawnTurret(rand(50, 130), -20);
    spawnTurret(rand(VW - 130, VW - 50), -80);
  }

  function spawnCarrier() {
    return spawnEnt({
      type: 'carrier',
      x: rand(90, VW - 90), y: -30,
      vx: rand(-30, 30), vy: 50,
      hp: 8, r: 20, score: 300,
      rgb: GOLD, drop: 'cycle', fireCd: 0.55
    });
  }

  function spawnRing(n) {
    const cx = VW * 0.5 + rand(-50, 50);
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'ring',
        x: cx, y: -16,
        vx: 0, vy: 38,
        hp: 2, r: 12, score: 120,
        rgb: PNK, phase: (i / n) * TAU, spin: 1.4, fireCd: 0.8 + i * 0.12
      });
    }
  }

  function hpMul() {
    return isDense() ? 1.24 : 1;
  }

  function spawnMid() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.midHp : 34) * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5, y: -50,
      vx: 48, vy: 30,
      hp: hp, r: 28, score: 2000,
      rgb: GOLD, fireCd: 0.4, w: 54, h: 56
    });
    audio.boss();
    toast(st ? st.mid : '星卫', false, true);
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.bossHp : 80) * hpMul());
    spawnEnt({
      type: 'boss',
      x: VW * 0.5, y: -70,
      vx: 40, vy: 22,
      hp: hp, r: 42, score: 4000 + 1500 * G.stage,
      rgb: MAG, fireCd: 0.3, w: 80, h: 88
    });
    audio.boss();
    toast(st ? st.boss : '超武核', true, false);
    kick(4.2);
  }

  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'boss' || t === 'mid') && G.ents[i].hp > 0) return true;
    }
    return false;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n || 5);
    else if (w.kind === 'weaver') spawnWeaver(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n || 4);
    else if (w.kind === 'turrets') spawnTurretWave();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'ring') spawnRing(w.n || 4);
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
      x: x, y: y, vx: rand(-28, 28), vy: 42,
      kind: kind, t: 0, r: 12
    });
  }

  function eShot(x, y, vx, vy, rgb, r, star) {
    if (G.eShots.length > shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      rgb: rgb || MAG, r: r || 3.4, t: 0, star: !!star
    });
  }

  function aimShot(x, y, spd, rgb, r, star) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = Math.max(0.001, hypot(dx, dy));
    eShot(x, y, dx / len * spd, dy / len * spd, rgb, r, star);
  }

  function ringShot(x, y, n, spd, rot, rgb, r, star) {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r, star);
    }
  }

  function fiveWay(x, y, spd, rgb, r, star) {
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 0.22 + i * (Math.PI * 0.56 / (n - 1));
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r, star);
    }
  }

  function addShot(spec) {
    if (G.shots.length > 96) return;
    G.shots.push({
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r,
      rgb: spec.rgb,
      kind: spec.kind,
      pierce: spec.pierce || 0,
      dmg: spec.dmg || 1,
      age: 0,
      seen: {},
      homing: !!spec.homing,
      turn: spec.turn || 0
    });
  }

  function fireFrom(x, y) {
    const lv = G.wpnLv;
    const w = G.wpn;
    if (w === 'beam') {
      const n = lv <= 0 ? 1 : lv === 1 ? 1 : lv === 2 ? 2 : 3;
      const pierce = lv <= 0 ? 0 : lv === 1 ? 1 : 2;
      const gap = 8 + lv * 2;
      if (n === 1) {
        addShot({ x: x, y: y, vy: -780, r: 4.6, rgb: MINT, kind: 'beam', pierce: pierce, dmg: 1 });
      } else if (n === 2) {
        addShot({ x: x - 7, y: y, vy: -780, r: 4.2, rgb: MINT, kind: 'beam', pierce: pierce, dmg: 1 });
        addShot({ x: x + 7, y: y, vy: -780, r: 4.2, rgb: MINT, kind: 'beam', pierce: pierce, dmg: 1 });
      } else {
        addShot({ x: x, y: y - 2, vy: -820, r: 5, rgb: SKY, kind: 'beam', pierce: pierce + 1, dmg: 1 });
        addShot({ x: x - gap, y: y, vy: -760, r: 4, rgb: MINT, kind: 'beam', pierce: pierce, dmg: 1 });
        addShot({ x: x + gap, y: y, vy: -760, r: 4, rgb: MINT, kind: 'beam', pierce: pierce, dmg: 1 });
      }
    } else if (w === 'chase') {
      const n = lv <= 0 ? 1 : lv === 1 ? 2 : lv === 2 ? 3 : 4;
      const turn = 3.8 + lv * 0.7;
      const spd = -420 - lv * 20;
      for (let i = 0; i < n; i++) {
        const ox = (i - (n - 1) / 2) * 10;
        addShot({
          x: x + ox, y: y, vx: ox * 4, vy: spd, r: 3.6, rgb: SKY,
          kind: 'chase', dmg: 1, homing: true, turn: turn
        });
      }
    } else {
      const spd = -660;
      function fan(ox, vx) {
        addShot({ x: x + ox, y: y, vx: vx, vy: spd, r: 3.3, rgb: CYN, kind: 'five', dmg: 1 });
      }
      if (lv <= 0) {
        fan(-9, -70); fan(0, 0); fan(9, 70);
      } else if (lv === 1) {
        fan(-16, -140); fan(-8, -70); fan(0, 0); fan(8, 70); fan(16, 140);
      } else if (lv === 2) {
        fan(-16, -140); fan(-8, -70); fan(0, 0); fan(8, 70); fan(16, 140);
      } else {
        fan(-20, -180); fan(-13, -120); fan(-6, -50); fan(0, 0);
        fan(6, 50); fan(13, 120); fan(20, 180);
      }
    }
    if (lv >= 2) {
      const span = wingSpan();
      const rgb = WPN_RGB[w] || CYN;
      addShot({
        x: x - span, y: y + 4, vy: w === 'beam' ? -740 : -580,
        r: 2.6, rgb: rgb, kind: w, dmg: 1,
        pierce: w === 'beam' ? 1 : 0,
        homing: w === 'chase', turn: 3.2
      });
      addShot({
        x: x + span, y: y + 4, vy: w === 'beam' ? -740 : -580,
        r: 2.6, rgb: rgb, kind: w, dmg: 1,
        pierce: w === 'beam' ? 1 : 0,
        homing: w === 'chase', turn: 3.2
      });
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.wpnLv;
    const w = G.wpn;
    if (w === 'beam') G.fireCd = 0.134 - lv * 0.012;
    else if (w === 'chase') G.fireCd = 0.148 - lv * 0.014;
    else G.fireCd = 0.102 - lv * 0.012;
    G.muzzle = 0.05;
    fireFrom(G.player.x, G.player.y - 14);
    audio.shoot(w);
    emit(3, {
      x: G.player.x, y: G.player.y - 10, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: WPN_RGB[w] || CYN,
      g: 0, star: true
    });
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('星爆用尽', true);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.48;
    G.bombFlash = 0.55;
    G.invuln = Math.max(G.invuln, 0.42);
    audio.bomb();
    screenFlash(WHT, 0.78);
    popSpark(G.player.x, G.player.y, CYN, 48);
    rings.push({ x: G.player.x, y: G.player.y, t: 0, rgb: GOLD, r: 22 });
    rings.push({ x: VW * 0.5, y: VH * 0.42, t: 0, rgb: CYN, r: 40 });
    burstStars(G.player.x, G.player.y, GOLD, 8);
    emit(28, {
      x: G.player.x, y: G.player.y, j: 18,
      vx0: -280, vx1: 280, vy0: -320, vy1: 220,
      life: 0.52, r0: 1.6, r1: 4.2, rgb: SKY, g: 40, star: true
    });
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
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.type === 'carrier' ? 1.35 : 0.85;
    juice(en.x, en.y, en.rgb, pwr);
    burstStars(en.x, en.y, GOLD, en.type === 'boss' ? 8 : 5);
    audio.hit(G.combo);
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.drop === 'cycle' || en.drop === true) spawnPow(en.x, en.y, nextDropKind());
    else if (en.drop === 'bomb') spawnPow(en.x, en.y, 'bomb');
    else if (en.drop) spawnPow(en.x, en.y, en.drop);
    else if ((en.type === 'turret' || en.type === 'ring') && Math.random() < 0.22) spawnPow(en.x, en.y, nextDropKind());
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(1500 * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      const short = STAGES[G.stage - 1] ? STAGES[G.stage - 1].name.replace(/^第 \d 关 · /, '') : '';
      toast(short + '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        toast('星爆 +1', false, true);
      } else {
        addScore(800 * G.mult);
        toast('+800', false, true);
      }
    } else {
      const kind = p.kind === 'beam' || p.kind === 'chase' || p.kind === 'five' ? p.kind : 'five';
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
    juice(p.x, p.y, WPN_RGB[p.kind] || GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, DROP_GLYPH[p.kind] || '五', WPN_RGB[p.kind] || GOLD, true);
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
    burstStars(G.player.x, G.player.y, MAG, 8);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.wpnLv > 0 || G.wpn !== 'five') {
      spawnPow(G.player.x, G.player.y - 18, G.wpn);
    }
    G.wpn = 'five';
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
    G.why = '坠星了';
    saveBest();
    audio.lose();
    showOverlay('lose', '坠星了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function winGame() {
    addScore(8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '超武通关', (isDense() ? '星核通关' : '三关打穿') + ' · 分数 ' + G.score);
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

  function stormThink(dt) {
    if (hasBig() || G.stageClearT > 0) return;
    const st = STAGES[G.stage - 1];
    if (st) {
      while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t * 0.84) {
        fireWave(st.waves[G.waveI]);
        G.waveI += 1;
      }
    }
    if (hasBig()) return;
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    G.spawnT = clamp(1.42 / (1 + G.stage * 0.12), 0.38, 1.42);
    if (livingCount() > 26) return;
    const r = Math.random();
    if (r < 0.34) spawnV(5 + (Math.random() * 6) | 0);
    else if (r < 0.54) spawnWeaver(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.72) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.86) spawnRing(3 + (Math.random() * 3) | 0);
    else spawnTurretWave();
  }

  function bossFire(en, dense) {
    const half = en.hp < en.maxHp * 0.5;
    const stg = G.stage;
    if (en.type === 'mid') {
      if (en.fireCd > 0) return;
      en.fireCd = dense ? 0.4 : 0.52;
      if (stg === 1) {
        fiveWay(en.x, en.y + 14, dense ? 150 : 120, GOLD, 3.4, true);
      } else if (stg === 2) {
        aimShot(en.x, en.y + 16, dense ? 210 : 170, GOLD, 4);
        eShot(en.x - 18, en.y + 10, -50, 160, ORG, 3.4);
        eShot(en.x + 18, en.y + 10, 50, 160, ORG, 3.4);
        if (half) ringShot(en.x, en.y, dense ? 8 : 6, 118, en.t, MAG, 3.2, true);
      } else {
        ringShot(en.x, en.y, dense ? 8 : 6, 124, en.t * 1.2, GOLD, 3.2, true);
        if (half) aimShot(en.x, en.y + 18, 200, MAG, 4);
      }
      return;
    }
    if (en.fireCd > 0) return;
    if (stg === 1) {
      en.fireCd = (dense ? 0.34 : 0.46) - (half ? 0.08 : 0);
      aimShot(en.x - 24, en.y + 8, 180, MAG, 4);
      aimShot(en.x + 24, en.y + 8, 180, MAG, 4);
      if (half) fiveWay(en.x, en.y + 18, dense ? 160 : 130, PNK, 3.4, true);
    } else if (stg === 2) {
      en.fireCd = (dense ? 0.3 : 0.4) - (half ? 0.07 : 0);
      const n = half ? (dense ? 8 : 6) : 5;
      for (let i = 0; i < n; i++) {
        const a = en.t * 1.6 + i * (TAU / n);
        eShot(en.x, en.y + 6, Math.cos(a) * 140, Math.sin(a) * 140, VIO, 3.3, true);
      }
      if (half) aimShot(en.x, en.y + 20, 200, GOLD, 4.2);
    } else {
      en.fireCd = (dense ? 0.28 : 0.38) - (half ? 0.08 : 0);
      ringShot(en.x, en.y, half ? (dense ? 14 : 10) : (dense ? 10 : 8), 128, en.t * 0.7, MAG, 3.2, true);
      aimShot(en.x, en.y + 24, 210, GOLD, 4.4);
      if (half) {
        ringShot(en.x, en.y, dense ? 10 : 8, 90, -en.t * 0.9, SKY, 3, true);
        fiveWay(en.x, en.y + 16, 140, PNK, 3.2, true);
      }
    }
  }

  function updateEnts(dt) {
    const dense = isDense();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.fireCd > 0) en.fireCd -= dt;

      const canShoot = G.mode === 'play';
      if (en.type === 'scout') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (canShoot && en.fireCd <= 0 && en.y > 40 && en.y < VH - 80 && Math.random() < (dense ? 0.018 : 0.01)) {
          en.fireCd = dense ? 0.7 : 1.05;
          aimShot(en.x, en.y + 6, dense ? 180 : 140, MAG, 3.2, true);
        }
      } else if (en.type === 'weaver') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 3 + en.phase) * 28 * dt;
        if (canShoot && en.fireCd <= 0 && en.y > 50) {
          en.fireCd = dense ? 0.85 : 1.2;
          eShot(en.x, en.y + 6, 0, dense ? 170 : 130, SKY, 3.2, true);
        }
      } else if (en.type === 'dive') {
        if (en.y < G.player.y - 40) {
          en.vx = lerp(en.vx, (G.player.x - en.x) * 0.9, 1 - Math.exp(-dt * 2.2));
          en.vy = lerp(en.vy, 218, 1 - Math.exp(-dt * 1.6));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (canShoot && en.fireCd <= 0 && en.y > 80) {
          en.fireCd = 9;
          aimShot(en.x, en.y, dense ? 200 : 160, VIO, 3.4, true);
        }
      } else if (en.type === 'turret') {
        en.y += scrollSpd() * dt;
        if (canShoot && en.fireCd <= 0 && en.y > 20 && en.y < VH - 40) {
          en.fireCd = dense ? 0.72 : 1.05;
          aimShot(en.x, en.y - 8, dense ? 170 : 130, ORG, 3.6);
        }
      } else if (en.type === 'carrier') {
        en.x += en.vx * dt + Math.sin(en.t * 1.6) * 40 * dt;
        en.y += en.vy * dt;
        if (en.x < 60 || en.x > VW - 60) en.vx *= -1;
        if (canShoot && en.fireCd <= 0) {
          en.fireCd = dense ? 0.55 : 0.78;
          fiveWay(en.x, en.y + 10, 130, GOLD, 3.2, true);
        }
      } else if (en.type === 'ring') {
        const R = 48 + Math.sin(en.t) * 8;
        const cx = VW * 0.5;
        en.x = cx + Math.cos(en.t * en.spin + en.phase) * R;
        en.y += en.vy * dt;
        if (canShoot && en.fireCd <= 0 && en.y > 60) {
          en.fireCd = dense ? 1.0 : 1.4;
          ringShot(en.x, en.y, dense ? 6 : 5, 110, en.t, PNK, 3, true);
        }
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < 110) en.y += en.vy * dt;
        else {
          en.x += en.vx * dt;
          if (en.x < 80 || en.x > VW - 80) en.vx *= -1;
          en.x = clamp(en.x, 80, VW - 80);
          if (en.type === 'boss' && G.stage === 2) {
            en.y = 118 + Math.sin(en.t * 1.3) * 22;
          }
        }
        if (canShoot) bossFire(en, dense);
      }

      if (en.y > VH + 50 || en.x < -70 || en.x > VW + 70) {
        G.ents.splice(i, 1);
        continue;
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !en.ground) {
        const pr = 6;
        if (hypot(en.x - G.player.x, en.y - G.player.y) < en.r * 0.72 + pr) {
          killPlayer();
        }
      }
    }
  }

  function nearestEnt(x, y) {
    let best = null;
    let bestD = 260;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const d = hypot(en.x - x, en.y - y);
      if (d < bestD) {
        bestD = d;
        best = en;
      }
    }
    return best;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.age += dt;
      if (s.homing) {
        const en = nearestEnt(s.x, s.y);
        if (en) {
          const ang = Math.atan2(s.vy, s.vx);
          const want = Math.atan2(en.y - s.y, en.x - s.x);
          let diff = want - ang;
          while (diff > Math.PI) diff -= TAU;
          while (diff < -Math.PI) diff += TAU;
          const turn = (s.turn || 4) * dt;
          const na = ang + clamp(diff, -turn, turn);
          const spd = Math.max(220, hypot(s.vx, s.vy));
          s.vx = Math.cos(na) * spd;
          s.vy = Math.sin(na) * spd;
        }
      }
      s.x += (s.vx || 0) * dt;
      s.y += s.vy * dt;
      if (s.y < -28 || s.y > VH + 24 || s.x < -30 || s.x > VW + 30) {
        G.shots.splice(i, 1);
        continue;
      }
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (s.seen[en.id]) continue;
        const rr = en.r + s.r;
        if (hypot(s.x - en.x, s.y - en.y) > rr) continue;
        s.seen[en.id] = 1;
        hurtEnt(en, s.dmg, s.x, s.y);
        if (s.pierce > 0) {
          s.pierce -= 1;
          if (s.pierce <= 0) {
            G.shots.splice(i, 1);
            break;
          }
        } else {
          G.shots.splice(i, 1);
          break;
        }
      }
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.t += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -24 || s.y > VH + 24 || s.x < -24 || s.x > VW + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (hypot(s.x - G.player.x, s.y - G.player.y) < 6 + s.r) {
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
      if (p.x < 16 || p.x > VW - 16) p.vx *= -1;
      p.vy = Math.min(70, p.vy + 18 * dt);
      if (p.y > VH + 24) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        if (hypot(p.x - G.player.x, p.y - G.player.y) < 22) {
          pickPow(p);
          G.pows.splice(i, 1);
        }
      }
    }
  }

  function updateWorld(dt) {
    const spd = G.mode === 'play' ? scrollSpd() : 40;
    G.scroll += spd * dt;
    G.nextReef -= spd * dt;
    if (G.nextReef <= 0) {
      spawnReef(-80);
      G.nextReef = rand(88, 146);
    }
    for (let i = G.reefs.length - 1; i >= 0; i--) {
      G.reefs[i].y += spd * dt;
      if (G.reefs[i].y > VH + 80) G.reefs.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += spd * s.z * 0.38 * dt;
      s.tw += dt * (1.4 + s.z);
      if (s.y > VH) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
  }

  function updateFx(dt) {
    G.shake *= Math.exp(-dt * 8);
    if (G.shake < 0.15) G.shake = 0;
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.bombFlash > 0) G.bombFlash = Math.max(0, G.bombFlash - dt * 1.8);
    if (G.muzzle > 0) G.muzzle -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.2;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.4;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
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

    if (isDense()) stormThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function pathStar(px, py, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = rot - Math.PI / 2 + i * TAU / 5;
      const b = a + TAU / 10;
      if (i === 0) ctx.moveTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
      else ctx.lineTo(px + Math.cos(a) * r, py + Math.sin(a) * r);
      ctx.lineTo(px + Math.cos(b) * r * 0.4, py + Math.sin(b) * r * 0.4);
    }
    ctx.closePath();
  }

  function drawWorld() {
    const stg = G.stage;
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (stg >= 3) {
      g.addColorStop(0, '#061018');
      g.addColorStop(0.5, '#04101a');
      g.addColorStop(1, '#02080e');
    } else if (stg === 2) {
      g.addColorStop(0, '#061828');
      g.addColorStop(0.45, '#05202a');
      g.addColorStop(1, '#03141c');
    } else {
      g.addColorStop(0, '#052430');
      g.addColorStop(0.4, '#041c28');
      g.addColorStop(1, '#03141c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + Math.sin(s.tw) * 0.45;
      ctx.fillStyle = rgba(stg >= 3 ? SKY : WHT, s.a * tw);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (0.55 + s.z * 0.95) * scale, 0, TAU);
      ctx.fill();
    }

    if (stg === 1) {
      ctx.strokeStyle = 'rgba(10, 194, 255, 0.1)';
      ctx.lineWidth = 1.1 * scale;
      const wy = ((G.scroll * 0.42) % 56);
      for (let y = -56; y < VH + 56; y += 56) {
        ctx.beginPath();
        ctx.moveTo(sx(0), sy(y + wy));
        for (let x = 0; x <= VW; x += 24) {
          ctx.lineTo(sx(x), sy(y + wy + Math.sin((x + G.scroll) * 0.035) * 7));
        }
        ctx.stroke();
      }
    } else if (stg === 2) {
      ctx.fillStyle = 'rgba(92, 232, 255, 0.07)';
      for (let i = 0; i < 7; i++) {
        const cy = ((G.scroll * 0.42 + i * 130) % (VH + 160)) - 80;
        const cx = 36 + (i * 71) % (VW - 72);
        ctx.beginPath();
        ctx.ellipse(sx(cx), sy(cy), 42 * scale, 14 * scale, 0.3, 0, TAU);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = 'rgba(10, 194, 255, 0.12)';
      ctx.lineWidth = 1.2 * scale;
      const off = (G.scroll * 0.55) % 44;
      for (let y = -44; y < VH + 44; y += 44) {
        ctx.beginPath();
        ctx.moveTo(sx(28), sy(y + off));
        ctx.lineTo(sx(28), sy(y + 26 + off));
        ctx.moveTo(sx(VW - 28), sy(y + off));
        ctx.lineTo(sx(VW - 28), sy(y + 26 + off));
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255, 61, 184, 0.1)';
      ctx.strokeRect(sx(16), sy(0), 24 * scale, VH * scale);
      ctx.strokeRect(sx(VW - 40), sy(0), 24 * scale, VH * scale);
    }

    for (let i = 0; i < G.reefs.length; i++) {
      const b = G.reefs[i];
      ctx.save();
      const rgb = stg === 1 ? [12, 70 + b.hue * 50, 90] : stg === 2 ? [20, 80, 110] : [18, 40, 70];
      ctx.fillStyle = rgba(rgb, 0.82);
      ctx.translate(sx(b.x), sy(b.y));
      ctx.scale(scale, scale);
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = k * TAU / 6 - 0.2;
        const rr = (k % 2 ? b.w * 0.38 : b.h * 0.28);
        const px = Math.cos(a) * rr;
        const py = Math.sin(a) * rr;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(stg >= 3 ? MAG : SKY, 0.28);
      ctx.beginPath();
      ctx.arc(0, -4, 6 + b.hue * 4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.35);
      ctx.lineWidth = 1.2;
      for (let p = 0; p < b.shards; p++) {
        const a = p * 1.1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 4);
        ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 12 - 8);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawShip(x, y, a) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(scale, scale);
    ctx.globalAlpha = a;
    const span = wingSpan();
    ctx.shadowColor = rgba(CYN, 0.75);
    ctx.shadowBlur = 12;
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(-span, 5);
    ctx.lineTo(-span + 4, -2);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(span, 5);
    ctx.lineTo(span - 4, -2);
    ctx.lineTo(8, 4);
    ctx.closePath();
    ctx.fill();
    if (G.wpnLv >= 2) {
      ctx.fillStyle = rgba(SKY, 0.95);
      ctx.fillRect(-span - 2, -1, 4, 7);
      ctx.fillRect(span - 2, -1, 4, 7);
    }
    ctx.fillStyle = rgba(CYN, 0.98);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(11, 8);
    ctx.lineTo(4, 6);
    ctx.lineTo(0, 13);
    ctx.lineTo(-4, 6);
    ctx.lineTo(-11, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(3.4, 2);
    ctx.lineTo(0, 5);
    ctx.lineTo(-3.4, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-1.2, 6, 2.4, 7);
    ctx.shadowBlur = 0;
    pathStar(0, -8, 3.2, G.t * 1.4);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 14);
      ctx.beginPath();
      ctx.arc(0, -16, 5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnt(en) {
    const a = en.flash > 0 ? 1 : 1;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.globalAlpha = a;
    if (en.flash > 0) ctx.globalAlpha = 0.55 + Math.sin(en.flash * 80) * 0.45;
    const rgb = en.rgb || CYN;
    ctx.fillStyle = rgba(en.flash > 0 ? WHT : rgb, 0.95);
    ctx.shadowColor = rgba(rgb, 0.55);
    ctx.shadowBlur = 8;
    if (en.type === 'scout') {
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.lineTo(8, -4);
      ctx.lineTo(0, -8);
      ctx.lineTo(-8, -4);
      ctx.closePath();
      ctx.fill();
      pathStar(0, -1, 4, en.t * 2);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fill();
    } else if (en.type === 'weaver') {
      ctx.beginPath();
      ctx.ellipse(-8, 0, 8, 4, -0.4, 0, TAU);
      ctx.ellipse(8, 0, 8, 4, 0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, TAU);
      ctx.fill();
    } else if (en.type === 'dive') {
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(7, -8);
      ctx.lineTo(0, -4);
      ctx.lineTo(-7, -8);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'turret') {
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a6 = k * TAU / 6;
        const px = Math.cos(a6) * 12;
        const py = Math.sin(a6) * 10;
        if (k === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-2, -10, 4, 12);
    } else if (en.type === 'carrier') {
      pathStar(0, 0, 18, en.t * 0.6);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, TAU);
      ctx.fill();
    } else if (en.type === 'ring') {
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.7);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 14, en.t, en.t + 2);
      ctx.stroke();
    } else if (en.type === 'mid' || en.type === 'boss') {
      const big = en.type === 'boss';
      const R = big ? 36 : 24;
      pathStar(0, 0, R, en.t * 0.35);
      ctx.fill();
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.beginPath();
      ctx.arc(0, 4, big ? 16 : 11, 0, TAU);
      ctx.fill();
      const ratio = clamp(en.hp / en.maxHp, 0, 1);
      ctx.fillStyle = rgba(ratio < 0.35 ? MAG : GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 4, (big ? 9 : 6) * ratio + 2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(rgb, 0.85);
      ctx.fillRect(-R * 0.85, 6, 8, 16);
      ctx.fillRect(R * 0.85 - 8, 6, 8, 16);
      const bw = big ? 64 : 44;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-bw / 2, -R - 10, bw, 4);
      ctx.fillStyle = rgba(ratio < 0.35 ? MAG : CYN, 0.95);
      ctx.fillRect(-bw / 2, -R - 10, bw * ratio, 4);
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.scale(scale, scale);
      if (s.kind === 'beam') {
        const h = 18 + Math.sin(s.age * 28) * 3;
        ctx.fillStyle = rgba(s.rgb, 0.28);
        ctx.fillRect(-s.r * 1.6, -h, s.r * 3.2, h + 6);
        ctx.fillStyle = rgba(WHT, 0.95);
        ctx.fillRect(-s.r * 0.45, -h, s.r * 0.9, h + 4);
        ctx.fillStyle = rgba(s.rgb, 0.9);
        ctx.fillRect(-s.r * 0.9, -h + 2, s.r * 1.8, h);
      } else if (s.kind === 'chase') {
        pathStar(0, 0, s.r * 1.7, s.age * 8);
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.fill();
      } else {
        pathStar(0, 0, s.r * 1.55, s.age * 10);
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.85);
        ctx.beginPath();
        ctx.arc(0, 0, s.r * 0.45, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.scale(scale, scale);
      if (s.star) {
        pathStar(0, 0, s.r * 1.8, s.t * 6);
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.beginPath();
        ctx.arc(0, 0, s.r, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.7);
        ctx.beginPath();
        ctx.arc(-0.6, -0.6, s.r * 0.35, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = WPN_RGB[p.kind] || GOLD;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.scale(scale, scale);
      ctx.rotate(p.t * 1.8);
      pathStar(0, 0, 13, 0);
      ctx.fillStyle = rgba(rgb, 0.92);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.font = '700 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 1.8);
      ctx.fillText(DROP_GLYPH[p.kind] || '☆', 0, 0.5);
      ctx.restore();
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(p.rgb, 1);
      if (p.star) {
        ctx.translate(sx(p.x), sy(p.y));
        ctx.scale(scale, scale);
        pathStar(0, 0, p.r * 1.6, p.life * 8);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t;
      ctx.strokeStyle = rgba(r.rgb, a * 0.7);
      ctx.lineWidth = 2.2 * scale * (1 - r.t);
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 48) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = '700 ' + (f.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.globalAlpha = 1;
    }
  }

  function drawBombNova() {
    if (G.bombFlash <= 0) return;
    const t = 1 - G.bombFlash / 0.55;
    ctx.save();
    ctx.translate(sx(G.player.x), sy(G.player.y));
    ctx.scale(scale, scale);
    ctx.globalAlpha = G.bombFlash * 1.2;
    pathStar(0, 0, 28 + t * 90, t * 0.8);
    ctx.strokeStyle = rgba(GOLD, 0.85);
    ctx.lineWidth = 3;
    ctx.stroke();
    pathStar(0, 0, 16 + t * 60, -t * 0.6);
    ctx.strokeStyle = rgba(CYN, 0.7);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const shx = G.shake ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake ? rand(-G.shake * 0.6, G.shake * 0.6) : 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#02080e';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(shx, shy);
    if (G.punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }
    drawWorld();
    drawPows();
    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawShots();
    drawBombNova();
    if (G.mode === 'play' && G.deadT <= 0) {
      const blink = G.invuln > 0 ? (Math.sin(G.t * 28) > 0 ? 0.45 : 1) : 1;
      drawShip(G.player.x, G.player.y, blink);
    } else if (G.mode === 'title') {
      drawShip(G.player.x, G.player.y, 1);
    }
    drawFx();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function resize() {
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resetRun(kind) {
    G.kind = kind || 'raid';
    G.t = 0;
    G.clock = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.scroll = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.wpn = 'five';
    G.wpnLv = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pows.length = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 1.2;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.spawnT = 0.5;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.dropI = 0;
    G.nextReef = 40;
    G.why = '';
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    seedStars();
    seedReefs();
    if (scoreEl) scoreEl.textContent = '0';
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.wpn = 'five';
    G.wpnLv = 0;
    G.bombs = 3;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pows.length = 0;
    G.deadT = 0;
    G.invuln = 0;
    G.fireHold = false;
    G.spawnT = 0.4;
    seedStars();
    seedReefs();
    showOverlay('title', '超武', '纵向卷轴。五向星弹是招牌。捡星核切五向、星束、追星。翼炮随火力张开。中型星卫后是关底。');
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    resetRun(kind);
    G.mode = 'play';
    hideOverlay();
    toast(isDense() ? '星核' : '超武', isDense(), !isDense());
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || code === 'KeyA') {
      keys.l = down;
      if (down) { e.preventDefault(); inputSrc = 'key'; }
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD') {
      keys.r = down;
      if (down) { e.preventDefault(); inputSrc = 'key'; }
    } else if (k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW') {
      keys.u = down;
      if (down) { e.preventDefault(); inputSrc = 'key'; }
    } else if (k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS') {
      keys.d = down;
      if (down) { e.preventDefault(); inputSrc = 'key'; }
    }

    if (!down) {
      if (k === ' ' || k === 'Spacebar' || code === 'Space') G.fireHold = false;
      return;
    }

    if (k === 'r' || k === 'R' || code === 'KeyR') {
      e.preventDefault();
      restart();
      return;
    }
    if (k === 'm' || k === 'M' || code === 'KeyM') {
      e.preventDefault();
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }

    if (overlayOpen() && G.mode !== 'play') {
      if (k === 'Enter' || k === ' ' || k === 'Spacebar' || code === 'Space' || k === '1') {
        e.preventDefault();
        if (G.mode === 'title') startGame('raid');
        else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
        return;
      }
      if ((k === '2') && G.mode === 'title') {
        e.preventDefault();
        startGame('storm');
        return;
      }
      return;
    }

    if (k === ' ' || k === 'Spacebar' || code === 'Space') {
      e.preventDefault();
      G.fireHold = true;
      fire();
    } else if (k === 'Shift' || k === 'z' || k === 'Z' || code === 'KeyZ' || code === 'ShiftLeft' || code === 'ShiftRight') {
      e.preventDefault();
      tryBomb();
    }
  }

  function ptrToGame(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left);
    const y = (e.clientY - r.top);
    pointer.x = (x - ox) / scale;
    pointer.y = (y - oy) / scale;
  }

  function bindPointer() {
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (overlayOpen() && G.mode !== 'play') return;
      canvas.setPointerCapture(e.pointerId);
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      ptrToGame(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      fire();
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) {
      ptrToGame(e);
      pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id) return;
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
      startGame('raid');
    });
  }
  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      startGame('storm');
    });
  }
  if (ovRetry) {
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovModes) {
    ovModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && !isDense()) startGame('storm');
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
