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
  const GUN_MAX = 4;
  const BEST_KEY = 'playbox-prehistoric-isle-best';
  const MUTE_KEY = 'playbox-prehistoric-isle-mute';
  const OPS = '方向 / WASD 飞 · 空格开火 · Shift / Z 炸弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (BEST_KEY !== 'playbox-prehistoric-isle-best') throw new Error('best key');

  const MAG = [255, 61, 184];
  const LIME = [198, 255, 50];
  const MOSS = [122, 212, 32];
  const GOLD = [255, 227, 107];
  const HOT = [232, 255, 122];
  const WHT = [244, 255, 232];
  const PNK = [255, 154, 212];
  const AMBER = [255, 176, 64];
  const BONE = [232, 214, 186];
  const LAVA = [255, 90, 36];
  const DEEP = [14, 28, 8];
  const SLV = [196, 214, 186];

  const DROP_CYCLE = ['gun', 'bomb'];
  const DROP_GLYPH = { gun: '弹', bomb: '爆' };
  const DROP_RGB = { gun: GOLD, bomb: MAG };
  const WPN_NAME = ['双管', '三管', '五向', '七向', 'MAX'];

  const STAGES = [
    {
      name: '第 1 关 · 密林',
      mid: '角龙',
      boss: '翼龙王',
      midHp: 36,
      bossHp: 88,
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.0, kind: 'raptor', n: 3 },
        { t: 5.4, kind: 'pack', dir: 1 },
        { t: 7.8, kind: 'nests' },
        { t: 10.2, kind: 'dimo', n: 4 },
        { t: 12.6, kind: 'v', n: 7 },
        { t: 15.0, kind: 'mid' },
        { t: 20.2, kind: 'cargo' },
        { t: 22.6, kind: 'raptor', n: 4 },
        { t: 24.8, kind: 'pack', dir: -1 },
        { t: 27.2, kind: 'v', n: 7 },
        { t: 32.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 骨原',
      mid: '剑龙',
      boss: '暴龙',
      midHp: 50,
      bossHp: 116,
      waves: [
        { t: 0.55, kind: 'v', n: 7 },
        { t: 2.6, kind: 'dimo', n: 5 },
        { t: 4.8, kind: 'pack', dir: -1 },
        { t: 7.2, kind: 'stego', n: 2 },
        { t: 9.4, kind: 'trike' },
        { t: 11.6, kind: 'nests' },
        { t: 13.8, kind: 'v', n: 9 },
        { t: 16.0, kind: 'mid' },
        { t: 21.4, kind: 'pack', dir: 1 },
        { t: 23.6, kind: 'dimo', n: 6 },
        { t: 25.8, kind: 'raptor', n: 5 },
        { t: 28.0, kind: 'cargo' },
        { t: 30.2, kind: 'v', n: 9 },
        { t: 36.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 炎口',
      mid: '熔蜥',
      boss: '泰坦龙',
      midHp: 64,
      bossHp: 164,
      waves: [
        { t: 0.45, kind: 'v', n: 9 },
        { t: 2.3, kind: 'pack', dir: 1 },
        { t: 4.1, kind: 'pack', dir: -1 },
        { t: 6.1, kind: 'dimo', n: 6 },
        { t: 8.1, kind: 'trike' },
        { t: 10.1, kind: 'stego', n: 3 },
        { t: 12.0, kind: 'nests' },
        { t: 14.0, kind: 'mid' },
        { t: 19.2, kind: 'v', n: 11 },
        { t: 21.2, kind: 'dimo', n: 6 },
        { t: 23.2, kind: 'raptor', n: 6 },
        { t: 25.2, kind: 'cargo' },
        { t: 27.2, kind: 'pack', dir: 1 },
        { t: 29.0, kind: 'pack', dir: -1 },
        { t: 31.2, kind: 'v', n: 9 },
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
  const btnIsle = document.getElementById('btn-isle');
  const btnFire = document.getElementById('btn-fire');
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
  const leaves = [];

  const G = {
    mode: 'title',
    kind: 'isle',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: VW * 0.5, y: VH - 90, vx: 0, vy: 0, bank: 0 },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    gunLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    coins: [],
    scenery: [],
    naps: [],
    fires: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: LIME,
    punch: 1,
    muzzle: 0,
    prop: 0,
    spawnT: 0.7,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    nextSc: 40,
    stormT: 0,
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
    return G.kind === 'fire';
  }
  function plySpd() {
    return (isDense() ? 314 : 276) + G.gunLv * 14;
  }
  function scrollSpd() {
    if (hasBig()) return isDense() ? 36 : 28;
    return (isDense() ? 116 : 86) + G.stage * 7 + Math.min(20, G.combo);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isDense() ? 176 : 118;
  }
  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if (t === 'mid' || t === 'boss') return true;
    }
    return false;
  }
  function livingCount() {
    return G.ents.length;
  }
  function gunOffsets() {
    const lv = G.gunLv;
    if (lv >= 3) {
      return [
        { x: -22, a: -0.28 }, { x: -12, a: -0.14 }, { x: 0, a: 0 },
        { x: 12, a: 0.14 }, { x: 22, a: 0.28 }, { x: -6, a: -0.05 }, { x: 6, a: 0.05 }
      ];
    }
    if (lv >= 2) return [{ x: -20, a: -0.22 }, { x: -10, a: -0.1 }, { x: 0, a: 0 }, { x: 10, a: 0.1 }, { x: 20, a: 0.22 }];
    if (lv >= 1) return [{ x: -10, a: 0 }, { x: 0, a: 0 }, { x: 10, a: 0 }];
    return [{ x: -7, a: 0 }, { x: 7, a: 0 }];
  }
  function wpnText() {
    return WPN_NAME[Math.min(G.gunLv, GUN_MAX)] || '双管';
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
      this.beep(920, 0.028, 'square', 0.022, 1640);
      this.beep(420, 0.04, 'square', 0.014, 180);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.028, 0.026, 1600);
      this.beep(480 * lift, 0.055, 'square', 0.036, 860 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.24 : 0.1, big ? 0.08 : 0.044, big ? 160 : 380);
      this.beep(big ? 128 : 210, big ? 0.3 : 0.12, 'sawtooth', 0.05, 42);
    },
    bomb() {
      this.ensure();
      this.noise(0.3, 0.084, 140);
      this.beep(84, 0.42, 'sawtooth', 0.072, 34);
      this.beep(620, 0.18, 'triangle', 0.038, 180);
      this.beep(1480, 0.1, 'sine', 0.028, 380);
    },
    pow() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.044, 784);
      this.beep(784, 0.13, 'triangle', 0.04, 1175);
    },
    coin() {
      this.ensure();
      this.beep(740, 0.05, 'sine', 0.026, 1180);
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
      this.noise(0.18, 0.06, 260);
      this.beep(220, 0.24, 'sawtooth', 0.05, 58);
      this.beep(110, 0.36, 'sine', 0.045, 34);
    },
    wave() {
      this.ensure();
      this.beep(330, 0.09, 'sine', 0.04, 494);
      this.beep(494, 0.12, 'sine', 0.04, 660);
      this.beep(740, 0.2, 'triangle', 0.045, 988);
    },
    boss() {
      this.ensure();
      this.beep(98, 0.28, 'sawtooth', 0.056, 52);
      this.beep(72, 0.36, 'square', 0.04, 40);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1397);
    },
    lose() {
      this.ensure();
      this.beep(185, 0.18, 'sawtooth', 0.04, 76);
      this.beep(110, 0.3, 'sine', 0.05, 40);
    },
    start() {
      this.ensure();
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.035, 990);
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

  function addScore(n) {
    if (n <= 0) return;
    G.score += n;
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
      if (bestEl) bestEl.textContent = String(G.best);
    }
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
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
      tagLabel.textContent = isDense() ? '炎岛' : '史前';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', G.gunLv >= GUN_MAX);
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
    else if (G.mode === 'lose') setHint('R 重开 · 撞体或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint('岛尽肃清 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 炸弹清场', 'warn');
    else setHint('方向飞 · 空格开火 · Shift 炸弹 · 吃弹加宽', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'PREH';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isDense() ? '换模式' : '炎岛';
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
    screenFlash(rgb, 0.16 + p * 0.14);
    kick(2.2 + p * 2.6);
  }

  function seedLeaves() {
    leaves.length = 0;
    for (let i = 0; i < 48; i++) {
      leaves.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.4, 1.3),
        a: rand(0.18, 0.62),
        s: rand(1.2, 3.4),
        spin: rand(0, TAU)
      });
    }
  }

  function seedScenery() {
    G.scenery.length = 0;
    for (let i = 0; i < 8; i++) spawnScenery(-40 - i * 96);
  }

  function spawnScenery(y) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const w = rand(28, 68);
    const h = rand(40, 110);
    const x = side < 0 ? rand(10, 74) : rand(VW - 74, VW - 10);
    G.scenery.push({
      x: x, y: y, w: w, h: h,
      kind: G.stage,
      hue: hash2((G.scroll + y) | 0),
      n: 1 + ((hash2(((G.scroll + y) * 5) | 0) * 3) | 0)
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
    if (G.ents.length > 56) return null;
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

  function spawnPtero(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'ptero',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy == null ? 84 : extra.vy,
      hp: extra.hp || 1,
      r: 12,
      score: 50,
      rgb: extra.rgb || MOSS,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.6, 1.4),
      phase: extra.phase || 0
    });
  }

  function spawnV(n, xmid) {
    const mid = xmid == null ? VW * 0.5 + rand(-40, 40) : xmid;
    const gap = 28;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2;
      spawnPtero(mid + k * gap, -18 - Math.abs(k) * 16, { vy: 92, fireCd: 0.7 + Math.abs(k) * 0.12 });
    }
  }

  function spawnPack(dir) {
    const x = dir > 0 ? -20 : VW + 20;
    for (let i = 0; i < 6; i++) {
      spawnEnt({
        type: 'pack',
        x: x, y: 36 + i * 30,
        vx: dir * 98, vy: 36,
        hp: 1, r: 11, score: 70,
        rgb: LIME, phase: i * 0.4, fireCd: 0.9 + i * 0.08
      });
    }
  }

  function spawnDimos(n) {
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'dimo',
        x: rand(50, VW - 50),
        y: -24 - i * 22,
        vx: rand(-20, 20),
        vy: 46,
        hp: 1, r: 11, score: 80,
        rgb: AMBER, dive: true,
        fireCd: 0.5 + i * 0.1, phase: i
      });
    }
  }

  function spawnRaptors(n) {
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'raptor',
        x: 70 + i * ((VW - 140) / Math.max(1, n - 1)),
        y: -24,
        vx: 0, vy: 0,
        hp: 2, r: 14, score: 100,
        rgb: AMBER, ground: true,
        fireCd: 0.7 + i * 0.12, phase: i * 0.6, w: 26, h: 18
      });
    }
  }

  function spawnNests() {
    const xs = [70, VW - 70, VW * 0.5];
    for (let i = 0; i < xs.length; i++) {
      spawnEnt({
        type: 'nest',
        x: xs[i], y: -18,
        vx: 0, vy: 0,
        hp: 4, r: 16, score: 140,
        rgb: GOLD, ground: true,
        fireCd: 0.8 + i * 0.2, w: 28, h: 24
      });
    }
  }

  function spawnStegos(n) {
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'stego',
        x: rand(80, VW - 80), y: -28 - i * 20,
        vx: 0, vy: 0,
        hp: 5, r: 18, score: 180,
        rgb: SLV, ground: true,
        fireCd: 1.0 + i * 0.15, w: 36, h: 22
      });
    }
  }

  function spawnTrike() {
    spawnEnt({
      type: 'trike',
      x: rand(90, VW - 90), y: -30,
      vx: 0, vy: 0,
      hp: 6, r: 20, score: 200,
      rgb: BONE, ground: true, fireCd: 0.95, w: 38, h: 26
    });
  }

  function spawnCargo() {
    spawnEnt({
      type: 'cargo',
      x: rand(90, VW - 90), y: -28,
      vx: rand(-32, 32), vy: 50,
      hp: 5, r: 18, score: 300,
      rgb: GOLD, drop: true, fireCd: 1.4
    });
  }

  function spawnMid() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.midHp : 36) * (isDense() ? 1.24 : 1));
    const rgb = G.stage === 3 ? LAVA : G.stage === 2 ? BONE : GOLD;
    spawnEnt({
      type: 'mid',
      x: VW * 0.5, y: -50,
      vx: 0, vy: 42,
      hp: hp, r: 28, score: 2000,
      rgb: rgb,
      fireCd: 0.58, w: 56, h: 42, ground: true
    });
    audio.boss();
    toast(st ? st.mid : '中型', false, true);
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.bossHp : 88) * (isDense() ? 1.24 : 1));
    const rgb = G.stage === 3 ? GOLD : G.stage === 2 ? AMBER : LIME;
    const air = G.stage === 1;
    spawnEnt({
      type: 'boss',
      x: VW * 0.5, y: -70,
      vx: 0, vy: 28,
      hp: hp, r: 44, score: 4000 + 1500 * G.stage,
      rgb: rgb,
      fireCd: 0.42, w: 90, h: 66,
      ground: !air
    });
    audio.boss();
    toast(st ? st.boss : '关底', false, true);
    kick(5.5);
    screenFlash(GOLD, 0.45);
  }

  function spawnWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n || 5);
    else if (w.kind === 'pack') spawnPack(w.dir || 1);
    else if (w.kind === 'dimo') spawnDimos(w.n || 4);
    else if (w.kind === 'raptor') spawnRaptors(w.n || 3);
    else if (w.kind === 'nests') spawnNests();
    else if (w.kind === 'stego') spawnStegos(w.n || 2);
    else if (w.kind === 'trike') spawnTrike();
    else if (w.kind === 'cargo') spawnCargo();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function nextDrop() {
    const k = DROP_CYCLE[G.dropI % DROP_CYCLE.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vx: rand(-36, 36), vy: -70,
      kind: kind, t: 0, life: 9.5, r: 11
    });
  }

  function spawnCoin(x, y, val) {
    G.coins.push({
      x: x + rand(-8, 8),
      y: y + rand(-6, 6),
      vx: rand(-50, 50),
      vy: rand(-90, -20),
      t: 0,
      life: 6.5,
      r: 6,
      val: val || 20
    });
    capArr(G.coins, 48);
  }

  function eShot(x, y, vx, vy, r) {
    if (G.eShots.length >= shotCap()) return;
    G.eShots.push({ x: x, y: y, vx: vx, vy: vy, r: r || 3.5, life: 4.2 });
  }

  function aimShot(x, y, spd, r) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const l = hypot(dx, dy) || 1;
    eShot(x, y, dx / l * spd, dy / l * spd, r);
  }

  function fanShot(x, y, n, spread, spd, base) {
    const mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      const a = (base == null ? Math.PI * 0.5 : base) + (i - mid) * spread;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 3.2);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const cd = 0.108 - G.gunLv * 0.01;
    G.fireCd = Math.max(0.058, cd);
    G.muzzle = 1;
    audio.shoot();
    const offs = gunOffsets();
    const spd = 680 + G.gunLv * 40;
    const dmg = 1 + (G.gunLv >= 3 ? 1 : 0);
    const r = 3.6 + G.gunLv * 0.45;
    for (let i = 0; i < offs.length; i++) {
      const a = -Math.PI * 0.5 + offs[i].a;
      G.shots.push({
        kind: 'gun',
        x: G.player.x + offs[i].x,
        y: G.player.y - 18,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        r: r,
        dmg: dmg,
        life: 1.05,
        ang: a,
        trail: !REDUCE
      });
    }
  }

  function napalmCut(x, y, roar) {
    juice(x, y, AMBER, roar ? 2.4 : 1.6);
    popSpark(x, y, LIME, roar ? 48 : 26);
    emit(roar ? 32 : 14, {
      x: x, y: y, j: roar ? 22 : 12,
      vx0: -280, vx1: 280, vy0: -320, vy1: 140,
      life: 0.5, r0: 2, r1: 5.2, rgb: GOLD
    });
    const clearR = roar ? 999 : 150;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      if (hypot(s.x - x, s.y - y) < clearR) {
        emit(3, {
          x: s.x, y: s.y, j: 4,
          vx0: -80, vx1: 80, vy0: -80, vy1: 40,
          life: 0.22, r0: 1, r1: 2.2, rgb: PNK
        });
        G.eShots.splice(i, 1);
      }
    }
    const hitR = roar ? 999 : 124;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (hypot(en.x - x, en.y - y) > hitR) continue;
      let dmg = en.ground ? 8 : 5;
      if (en.type === 'mid') dmg = roar ? 11 : 6;
      if (en.type === 'boss') dmg = roar ? 15 : 8;
      hurtEnt(en, dmg, en.x, en.y);
    }
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('弹尽', true);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.46;
    G.invuln = Math.max(G.invuln, 0.46);
    G.bombFlash = 1;
    G.muzzle = 1;
    audio.bomb();
    hitStop(0.08);
    kick(7.4);
    screenFlash(AMBER, 0.74);
    if (stageEl) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
      setTimeout(function () {
        if (stageEl) stageEl.classList.remove('bomb');
      }, 520);
    }
    const px = G.player.x;
    const py = G.player.y;
    for (let i = 0; i < 5; i++) {
      G.naps.push({
        x: px + (i - 2) * 28,
        y: py - 8,
        vy: 240 + i * 28,
        t: 0,
        life: 0.22 + i * 0.04,
        rgb: i % 2 ? GOLD : AMBER
      });
    }
    G.fires.push({ x: px, y: py + 40, t: 0, life: 0.7, r: 46 });
    G.fires.push({ x: px - 50, y: py + 18, t: 0, life: 0.55, r: 28 });
    G.fires.push({ x: px + 50, y: py + 18, t: 0, life: 0.55, r: 28 });
    rings.push({ x: px, y: py, t: 0, rgb: GOLD, r: 30 });
    rings.push({ x: px, y: py, t: -0.1, rgb: AMBER, r: 48 });
    napalmCut(px, py - 12, true);
    syncHud();
  }

  function raidThink() {
    const st = STAGES[G.stage - 1];
    if (!st || G.stageClearT > 0) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      const w = st.waves[G.waveI];
      G.waveI += 1;
      if ((w.kind === 'mid' || w.kind === 'boss') && hasBig()) {
        G.waveI -= 1;
        break;
      }
      spawnWave(w);
    }
  }

  function stormThink(dt) {
    raidThink();
    G.stormT -= dt;
    if (G.stormT <= 0 && !hasBig() && G.stageClearT <= 0) {
      G.stormT = rand(1.2, 2.0);
      const r = Math.random();
      if (r < 0.32) spawnV(5, rand(80, VW - 80));
      else if (r < 0.54) spawnDimos(3);
      else if (r < 0.74) spawnPack(Math.random() < 0.5 ? 1 : -1);
      else spawnRaptors(3);
    }
  }

  function hurtEnt(en, dmg, x, y) {
    if (!en || en.hp <= 0) return;
    en.hp -= dmg;
    en.flash = 0.08;
    audio.hit(G.combo);
    emit(5, {
      x: x, y: y, j: 4,
      vx0: -90, vx1: 90, vy0: -120, vy1: 40,
      life: 0.18, r0: 1, r1: 2.4, rgb: en.ground ? AMBER : LIME
    });
    const stop = en.type === 'boss' ? 0.074 : en.type === 'mid' ? 0.056 : 0.034;
    hitStop(stop);
    kick(en.type === 'boss' ? 4.4 : 1.8);
    if (en.hp <= 0) killEnt(en);
  }

  function killEnt(en) {
    const big = en.type === 'boss' || en.type === 'mid';
    juice(en.x, en.y, en.rgb || LIME, big ? 2.4 : en.ground ? 1.35 : 1);
    audio.boom(big);
    bumpCombo();
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    floatText(en.x, en.y - 8, String(pts), GOLD, big || G.mult >= 3);
    const coins = big ? 5 : en.ground ? 2 : (Math.random() < 0.55 ? 1 : 0);
    for (let i = 0; i < coins; i++) spawnCoin(en.x, en.y, big ? 50 : 20);
    if (en.drop) spawnPow(en.x, en.y, nextDrop());
    else if (!big && Math.random() < (isDense() ? 0.08 : 0.05)) spawnPow(en.x, en.y, nextDrop());
    if (en.type === 'mid') {
      toast((STAGES[G.stage - 1] ? STAGES[G.stage - 1].mid : '中型') + ' 击破', false, true);
    }
    if (en.type === 'boss') {
      addScore(1500 * G.stage);
      G.eShots.length = 0;
      G.stageClearT = 2.05;
      toast(G.stage >= 3 ? '岛尽肃清' : '关底击破', false, true);
      audio.wave();
    }
    const i = G.ents.indexOf(en);
    if (i >= 0) G.ents.splice(i, 1);
  }

  function playerDie() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.invuln = 0;
    breakCombo();
    audio.death();
    juice(G.player.x, G.player.y, MAG, 2.8);
    kick(8);
    screenFlash(MAG, 0.7);
    G.eShots.length = 0;
    if (G.gunLv > 0) spawnPow(G.player.x + rand(-20, 20), G.player.y, 'gun');
    G.gunLv = 0;
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    toast('复活', false, true);
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = 'crash';
    audio.lose();
    showOverlay('lose', '坠机了', '撞体或中弹。机枪扫空打地，炸弹砸场。R 重开同一模式。');
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    addScore(8000);
    audio.win();
    showOverlay(
      'win',
      isDense() ? '炎岛肃清' : '岛尽肃清',
      isDense()
        ? '三关打穿。8000 通关分已入账。换模式回标题，或再来一局炎岛。'
        : '三关打穿。8000 通关分已入账。要不要再下炎岛？'
    );
    syncHud();
  }

  function collectPow(p) {
    audio.pow();
    juice(p.x, p.y, DROP_RGB[p.kind] || GOLD, 1.2);
    flashWpn();
    if (p.kind === 'gun') {
      if (G.gunLv >= GUN_MAX) addScore(500 * G.mult);
      else {
        G.gunLv += 1;
        toast(wpnText(), false, true);
      }
    } else if (p.kind === 'bomb') {
      if (G.bombs >= BOMB_CAP) addScore(500 * G.mult);
      else {
        G.bombs += 1;
        toast('爆 +1', false, true);
      }
    }
    floatText(p.x, p.y - 6, DROP_GLYPH[p.kind] || '+', DROP_RGB[p.kind] || GOLD, true);
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 14));
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.bombFlash > 0) G.bombFlash = Math.max(0, G.bombFlash - dt * 2.1);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt * 8);
    if (!REDUCE) G.prop += dt * 28;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += (p.g || 420) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 2.2);
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
    for (let i = G.naps.length - 1; i >= 0; i--) {
      const n = G.naps[i];
      n.t += dt;
      n.y += n.vy * dt;
      if (n.t >= n.life) {
        popSpark(n.x, n.y, n.rgb, 22);
        emit(10, {
          x: n.x, y: n.y, j: 10,
          vx0: -140, vx1: 140, vy0: -180, vy1: 40,
          life: 0.32, r0: 1.5, r1: 4, rgb: n.rgb
        });
        G.fires.push({ x: n.x, y: n.y, t: 0, life: 0.4, r: 22 });
        G.naps.splice(i, 1);
      }
    }
    for (let i = G.fires.length - 1; i >= 0; i--) {
      G.fires[i].t += dt;
      if (G.fires[i].t >= G.fires[i].life) G.fires.splice(i, 1);
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
    const want = clamp(G.player.vx / 280, -1, 1);
    G.player.bank = lerp(G.player.bank, want, 1 - Math.exp(-dt * 10));
    if (!REDUCE && G.mode === 'play' && Math.random() < 0.45) {
      emit(1, {
        x: G.player.x + rand(-4, 4),
        y: G.player.y + 14,
        j: 1,
        vx0: -12, vx1: 12, vy0: 40, vy1: 90,
        life: 0.18, r0: 1, r1: 2.2, rgb: AMBER, g: 40
      });
    }
  }

  function updateWorld(dt) {
    const spd = scrollSpd();
    G.scroll += spd * dt;
    for (let i = 0; i < leaves.length; i++) {
      const s = leaves[i];
      s.y += spd * s.z * 0.42 * dt;
      s.x += Math.sin(G.t * 1.4 + s.spin) * 8 * dt;
      s.spin += dt * 1.6;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = rand(0, VW);
      }
    }
    for (let i = G.scenery.length - 1; i >= 0; i--) {
      G.scenery[i].y += spd * dt;
      if (G.scenery[i].y > VH + 80) G.scenery.splice(i, 1);
    }
    G.nextSc -= spd * dt;
    if (G.nextSc <= 0) {
      spawnScenery(-50);
      G.nextSc = rand(70, 130);
    }
  }

  function updateEnts(dt) {
    const dense = isDense();
    const scr = scrollSpd();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.type === 'ptero') {
        en.x += en.vx * dt + Math.sin(en.t * 3.6 + en.phase) * 30 * dt;
        en.y += en.vy * dt;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && en.y > 20 && en.y < VH - 80) {
          en.fireCd = dense ? 0.82 : 1.22;
          aimShot(en.x, en.y + 8, dense ? 154 : 120, 3.2);
        }
      } else if (en.type === 'pack') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 4 + en.phase) * 18 * dt;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && en.y > 16 && en.y < VH - 70) {
          en.fireCd = dense ? 0.9 : 1.28;
          aimShot(en.x, en.y + 6, dense ? 148 : 116, 3.3);
        }
      } else if (en.type === 'dimo') {
        if (en.y < G.player.y - 40) {
          en.vx += (G.player.x - en.x) * dt * 1.7;
          en.vx = clamp(en.vx, -128, 128);
        }
        en.vy = Math.min(228, en.vy + dt * 50);
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'raptor') {
        en.y += scr * dt;
        en.x = en.baseX + Math.sin(en.t * 2.2 + en.phase) * 36;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && en.y > 10 && en.y < VH - 50) {
          en.fireCd = dense ? 0.86 : 1.2;
          aimShot(en.x, en.y - 6, dense ? 150 : 118, 3.4);
        }
      } else if (en.type === 'nest' || en.type === 'stego' || en.type === 'trike') {
        en.y += scr * dt;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && en.y > 8 && en.y < VH - 40) {
          if (en.type === 'nest') {
            en.fireCd = dense ? 0.7 : 1.02;
            aimShot(en.x, en.y - 10, dense ? 172 : 136, 3.6);
          } else if (en.type === 'stego') {
            en.fireCd = dense ? 0.92 : 1.24;
            fanShot(en.x, en.y - 8, 3, 0.28, dense ? 128 : 104, -Math.PI * 0.5);
          } else {
            en.fireCd = dense ? 0.8 : 1.12;
            fanShot(en.x, en.y - 8, 5, 0.26, dense ? 136 : 110, -Math.PI * 0.5);
          }
        }
      } else if (en.type === 'cargo') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < 40 || en.x > VW - 40) en.vx *= -1;
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < 108) en.y += 46 * dt;
        else {
          en.y = 108 + Math.sin(en.t * 1.3) * 10;
          en.x = VW * 0.5 + Math.sin(en.t * (en.type === 'boss' ? 0.68 : 1.02)) * (en.type === 'boss' ? 112 : 88);
        }
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          const low = en.hp < en.maxHp * 0.5;
          if (en.type === 'mid') {
            en.fireCd = dense ? 0.46 : 0.68;
            if (G.stage === 1) fanShot(en.x, en.y + 16, low ? 5 : 3, 0.22, 132, Math.PI * 0.5);
            else if (G.stage === 2) {
              aimShot(en.x - 14, en.y + 10, 154, 3.4);
              aimShot(en.x + 14, en.y + 10, 154, 3.4);
            } else {
              fanShot(en.x, en.y + 12, 6, TAU / 6, 110, en.t);
            }
          } else {
            en.fireCd = dense ? (low ? 0.26 : 0.38) : (low ? 0.36 : 0.52);
            if (G.stage === 1) {
              fanShot(en.x, en.y + 20, low ? 7 : 5, 0.18, 140, Math.PI * 0.5);
              if (low) aimShot(en.x, en.y + 18, 176, 4);
            } else if (G.stage === 2) {
              fanShot(en.x - 24, en.y + 8, 3, 0.2, 144, Math.PI * 0.5);
              fanShot(en.x + 24, en.y + 8, 3, 0.2, 144, Math.PI * 0.5);
              if (low) aimShot(en.x, en.y + 16, 190, 4);
            } else {
              const n = low ? 10 : 8;
              for (let k = 0; k < n; k++) {
                const a = en.t * 1.45 + k * TAU / n;
                eShot(en.x + Math.cos(a) * 30, en.y + Math.sin(a) * 16, Math.cos(a) * 94, Math.sin(a) * 94 + 42, 3.4);
              }
              if (low) {
                aimShot(en.x, en.y + 20, 206, 4.4);
                fanShot(en.x, en.y + 18, 5, 0.16, 154, Math.PI * 0.5);
              }
            }
          }
        }
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 50 || en.x < -70 || en.x > VW + 70) {
        G.ents.splice(i, 1);
        continue;
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !en.ground) {
        const pr = 7;
        if (hypot(en.x - G.player.x, en.y - G.player.y) < en.r * 0.72 + pr) {
          playerDie();
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.trail && !REDUCE && Math.random() < 0.5) {
        emit(1, {
          x: s.x, y: s.y, j: 1.4,
          vx0: -10, vx1: 10, vy0: 20, vy1: 70,
          life: 0.12, r0: 0.8, r1: 1.8, rgb: LIME, g: 50
        });
      }
      let dead = s.life <= 0 || s.y < -20 || s.y > VH + 30 || s.x < -20 || s.x > VW + 20;
      if (!dead) {
        for (let j = 0; j < G.ents.length; j++) {
          const en = G.ents[j];
          const rad = en.r + s.r;
          if (hypot(en.x - s.x, en.y - s.y) < rad) {
            hurtEnt(en, s.dmg, s.x, s.y);
            dead = true;
            break;
          }
        }
      }
      if (dead) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y < -30 || s.y > VH + 30 || s.x < -30 || s.x > VW + 30) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (hypot(s.x - G.player.x, s.y - G.player.y) < s.r + 6.2) {
          G.eShots.splice(i, 1);
          playerDie();
        }
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.life -= dt;
      p.vy += 210 * dt;
      if (p.vy > 78) p.vy = 78;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (p.y > VH - 16) {
        p.y = VH - 16;
        p.vy *= -0.35;
        p.vx *= 0.8;
      }
      if (p.life <= 0) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && hypot(p.x - G.player.x, p.y - G.player.y) < 22) {
        collectPow(p);
        G.pows.splice(i, 1);
      }
    }
  }

  function updateCoins(dt) {
    for (let i = G.coins.length - 1; i >= 0; i--) {
      const c = G.coins[i];
      c.t += dt;
      c.life -= dt;
      const dx = G.player.x - c.x;
      const dy = G.player.y - c.y;
      const d = hypot(dx, dy);
      if (G.mode === 'play' && G.deadT <= 0 && d < 96) {
        const pull = d < 28 ? 620 : 280;
        c.vx += (dx / (d || 1)) * pull * dt;
        c.vy += (dy / (d || 1)) * pull * dt;
      } else {
        c.vy += 160 * dt;
        if (c.vy > 90) c.vy = 90;
      }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vx *= Math.exp(-dt * 1.6);
      if (c.life <= 0 || c.y > VH + 20) {
        G.coins.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && d < 16) {
        const pts = c.val * G.mult;
        addScore(pts);
        audio.coin();
        emit(4, {
          x: c.x, y: c.y, j: 3,
          vx0: -50, vx1: 50, vy0: -80, vy1: -10,
          life: 0.2, r0: 1, r1: 2, rgb: GOLD, g: 80
        });
        G.coins.splice(i, 1);
      }
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
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.player.bank = Math.sin(G.t * 0.7) * 0.35;
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
    updateCoins(dt);
  }

  function drawWorld() {
    const stg = G.stage;
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (stg >= 3) {
      g.addColorStop(0, '#140806');
      g.addColorStop(0.45, '#180804');
      g.addColorStop(1, '#0a1204');
    } else if (stg === 2) {
      g.addColorStop(0, '#10140c');
      g.addColorStop(0.5, '#0c1408');
      g.addColorStop(1, '#081204');
    } else {
      g.addColorStop(0, '#0c1c08');
      g.addColorStop(0.4, '#0a1606');
      g.addColorStop(1, '#061002');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < leaves.length; i++) {
      const s = leaves[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(s.spin);
      ctx.fillStyle = rgba(stg >= 3 ? LAVA : stg === 2 ? BONE : MOSS, s.a * (stg >= 2 ? 0.55 : 0.42));
      ctx.fillRect(-s.s * 0.6 * scale, -s.s * 0.25 * scale, s.s * 1.2 * scale, s.s * 0.5 * scale);
      ctx.restore();
    }

    if (stg === 1) {
      const wy = ((G.scroll * 0.42) % 52);
      for (let y = -52; y < VH + 52; y += 52) {
        ctx.fillStyle = 'rgba(80, 160, 40, 0.12)';
        ctx.beginPath();
        ctx.moveTo(sx(40), sy(y + wy + 52));
        for (let x = 40; x <= VW - 40; x += 18) {
          ctx.lineTo(sx(x), sy(y + wy + Math.sin((x + G.scroll) * 0.045) * 7));
        }
        ctx.lineTo(sx(VW - 40), sy(y + wy + 52));
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(40, 90, 20, 0.28)';
      ctx.fillRect(sx(0), sy(0), 44 * scale, VH * scale);
      ctx.fillRect(sx(VW - 44), sy(0), 44 * scale, VH * scale);
      ctx.fillStyle = 'rgba(122, 212, 32, 0.16)';
      for (let i = 0; i < 4; i++) {
        const bx = 28 + (i % 2) * (VW - 56);
        const by = ((G.scroll * 0.3 + i * 180) % (VH + 120)) - 40;
        ctx.beginPath();
        ctx.moveTo(sx(bx), sy(by + 28));
        ctx.lineTo(sx(bx + (i % 2 ? -16 : 16)), sy(by));
        ctx.lineTo(sx(bx + (i % 2 ? 8 : -8)), sy(by + 10));
        ctx.closePath();
        ctx.fill();
      }
    } else if (stg === 2) {
      ctx.fillStyle = 'rgba(180, 160, 120, 0.1)';
      ctx.fillRect(sx(0), sy(0), 40 * scale, VH * scale);
      ctx.fillRect(sx(VW - 40), sy(0), 40 * scale, VH * scale);
      ctx.strokeStyle = 'rgba(232, 214, 186, 0.16)';
      ctx.lineWidth = 1.6 * scale;
      const off = (G.scroll * 0.48) % 64;
      for (let y = -64; y < VH + 64; y += 64) {
        ctx.beginPath();
        ctx.arc(sx(36), sy(y + off), 10 * scale, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx(VW - 48), sy(y + 10 + off));
        ctx.lineTo(sx(VW - 22), sy(y + 28 + off));
        ctx.lineTo(sx(VW - 48), sy(y + 44 + off));
        ctx.stroke();
      }
    } else {
      const wy = ((G.scroll * 0.5) % 64);
      ctx.fillStyle = 'rgba(255, 80, 24, 0.16)';
      for (let y = -64; y < VH + 64; y += 64) {
        ctx.beginPath();
        ctx.moveTo(sx(VW * 0.32), sy(y + wy + 20));
        for (let x = VW * 0.32; x <= VW * 0.68; x += 14) {
          ctx.lineTo(sx(x), sy(y + wy + Math.sin((x + G.scroll) * 0.06) * 8));
        }
        ctx.lineTo(sx(VW * 0.68), sy(y + wy + 40));
        ctx.lineTo(sx(VW * 0.32), sy(y + wy + 40));
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(40, 16, 8, 0.55)';
      ctx.fillRect(sx(0), sy(0), 52 * scale, VH * scale);
      ctx.fillRect(sx(VW - 52), sy(0), 52 * scale, VH * scale);
      ctx.fillStyle = 'rgba(255, 90, 36, 0.22)';
      for (let i = 0; i < 3; i++) {
        const cy = ((G.scroll * 0.4 + i * 200) % (VH + 140)) - 50;
        ctx.beginPath();
        ctx.ellipse(sx(26), sy(cy), 10 * scale, 6 * scale, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(sx(VW - 26), sy(cy + 40), 10 * scale, 6 * scale, 0, 0, TAU);
        ctx.fill();
      }
    }

    for (let i = 0; i < G.scenery.length; i++) {
      const b = G.scenery[i];
      ctx.save();
      if (stg === 1) {
        ctx.fillStyle = rgba([36 + b.hue * 30, 72 + b.hue * 40, 18], 0.9);
        ctx.beginPath();
        ctx.moveTo(sx(b.x), sy(b.y - b.h * 0.48));
        ctx.lineTo(sx(b.x + b.w * 0.32), sy(b.y + b.h * 0.18));
        ctx.lineTo(sx(b.x - b.w * 0.32), sy(b.y + b.h * 0.18));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(MOSS, 0.45);
        ctx.beginPath();
        ctx.ellipse(sx(b.x), sy(b.y - b.h * 0.18), 14 * scale, 8 * scale, 0, 0, TAU);
        ctx.fill();
      } else if (stg === 2) {
        ctx.fillStyle = rgba([170 + b.hue * 40, 150, 110], 0.78);
        ctx.beginPath();
        ctx.arc(sx(b.x), sy(b.y), 12 * scale, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(BONE, 0.5);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(b.x - 10), sy(b.y + 8));
        ctx.lineTo(sx(b.x + 14), sy(b.y - 16));
        ctx.stroke();
      } else {
        ctx.fillStyle = rgba([72 + b.hue * 30, 28, 14], 0.92);
        ctx.fillRect(sx(b.x - b.w * 0.24), sy(b.y - b.h * 0.28), b.w * 0.48 * scale, b.h * 0.62 * scale);
        ctx.fillStyle = rgba(LAVA, 0.4);
        ctx.fillRect(sx(b.x - 5), sy(b.y - 8), 10 * scale, 8 * scale);
      }
      ctx.restore();
    }
  }

  function drawPlane(x, y, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(sx(x), sy(y));
    ctx.rotate(G.player.bank * 0.32);
    ctx.scale(scale, scale);
    ctx.shadowColor = rgba(LIME, 0.55);
    ctx.shadowBlur = 12;
    ctx.fillStyle = rgba(LIME, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(5, -4);
    ctx.lineTo(16, 2);
    ctx.lineTo(16, 6);
    ctx.lineTo(5, 4);
    ctx.lineTo(4, 12);
    ctx.lineTo(10, 16);
    ctx.lineTo(0, 13);
    ctx.lineTo(-10, 16);
    ctx.lineTo(-4, 12);
    ctx.lineTo(-5, 4);
    ctx.lineTo(-16, 6);
    ctx.lineTo(-16, 2);
    ctx.lineTo(-5, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(2.4, 8);
    ctx.lineTo(0, 11);
    ctx.lineTo(-2.4, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(DEEP, 0.9);
    ctx.beginPath();
    ctx.ellipse(0, -2, 2.6, 3.4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.arc(0, -3, 1.1, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(0, -17);
    ctx.rotate(G.prop);
    ctx.strokeStyle = rgba(WHT, 0.55);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.moveTo(0, -3.2);
    ctx.lineTo(0, 3.2);
    ctx.stroke();
    ctx.restore();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, Math.min(1, G.muzzle * 1.4));
      ctx.beginPath();
      ctx.arc(-7, -18, 3.6, 0, TAU);
      ctx.arc(7, -18, 3.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(LIME, G.muzzle);
      ctx.beginPath();
      ctx.arc(0, -22, 4.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnt(en) {
    const flash = en.flash > 0;
    const rgb = flash ? WHT : en.rgb;
    const big = en.type === 'mid' || en.type === 'boss';
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale * (big ? (en.type === 'boss' ? 1.16 : 0.9) : 1), scale * (big ? (en.type === 'boss' ? 1.16 : 0.9) : 1));
    ctx.shadowColor = rgba(rgb, 0.55);
    ctx.shadowBlur = big ? 16 : 10;
    ctx.fillStyle = rgba(rgb, 0.95);
    const flap = Math.sin(en.t * 10 + en.phase) * 5;

    if (en.type === 'nest') {
      ctx.beginPath();
      ctx.ellipse(0, 6, 16, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(-5, 2, 3.2, 0, TAU);
      ctx.arc(5, 2, 3.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MOSS, 0.9);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(10, flap * 0.4);
      ctx.lineTo(-10, flap * 0.4);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'raptor') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 14, 6, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(20, -4);
      ctx.lineTo(14, 4);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(-4, -4, 6, 5);
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.beginPath();
      ctx.arc(4, -1, 1.2, 0, TAU);
      ctx.fill();
    } else if (en.type === 'stego') {
      ctx.beginPath();
      ctx.ellipse(0, 4, 18, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(BONE, 0.9);
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(k * 6 - 3, 0);
        ctx.lineTo(k * 6, -12);
        ctx.lineTo(k * 6 + 3, 0);
        ctx.fill();
      }
    } else if (en.type === 'trike') {
      ctx.beginPath();
      ctx.ellipse(0, 4, 16, 9, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(BONE, 0.95);
      ctx.beginPath();
      ctx.moveTo(-6, -2);
      ctx.lineTo(-14, -14);
      ctx.lineTo(-2, -6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(6, -2);
      ctx.lineTo(14, -14);
      ctx.lineTo(2, -6);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(0, -16);
      ctx.lineTo(3, -4);
      ctx.fill();
    } else if (en.type === 'cargo') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 18, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.rect(-8, 4, 16, 10);
      ctx.fill();
      ctx.fillStyle = rgba(MOSS, 0.9);
      ctx.beginPath();
      ctx.moveTo(-4, -2);
      ctx.quadraticCurveTo(-22, flap - 6, -26, flap + 4);
      ctx.quadraticCurveTo(-10, 4, -2, 4);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(4, -2);
      ctx.quadraticCurveTo(22, flap - 6, 26, flap + 4);
      ctx.quadraticCurveTo(10, 4, 2, 4);
      ctx.fill();
    } else if (en.type === 'dimo') {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(12, flap);
      ctx.lineTo(3, 4);
      ctx.lineTo(0, 10);
      ctx.lineTo(-3, 4);
      ctx.lineTo(-12, flap);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(3, -4);
      ctx.lineTo(-3, -4);
      ctx.fill();
    } else if (en.type === 'mid' || en.type === 'boss') {
      if (G.stage === 1) {
        ctx.beginPath();
        ctx.ellipse(0, 6, 30, 14, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-18, -4);
        ctx.quadraticCurveTo(-2, flap * 0.6 - 22, 18, -4);
        ctx.fill();
        if (en.type === 'boss') {
          ctx.fillStyle = rgba(LIME, 0.9);
          ctx.beginPath();
          ctx.moveTo(-28, flap * 0.4);
          ctx.quadraticCurveTo(-46, flap - 8, -38, 10);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(28, flap * 0.4);
          ctx.quadraticCurveTo(46, flap - 8, 38, 10);
          ctx.fill();
        } else {
          ctx.fillStyle = rgba(BONE, 0.95);
          ctx.beginPath();
          ctx.moveTo(-8, -6);
          ctx.lineTo(-18, -18);
          ctx.lineTo(-2, -8);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(8, -6);
          ctx.lineTo(18, -18);
          ctx.lineTo(2, -8);
          ctx.fill();
        }
        ctx.fillStyle = rgba(DEEP, 0.9);
        ctx.beginPath();
        ctx.arc(-8, -2, 3, 0, TAU);
        ctx.arc(8, -2, 3, 0, TAU);
        ctx.fill();
      } else if (G.stage === 2) {
        ctx.beginPath();
        ctx.ellipse(0, 8, 28, 14, 0, 0, TAU);
        ctx.fill();
        if (en.type === 'boss') {
          ctx.fillStyle = rgba(AMBER, 0.95);
          ctx.beginPath();
          ctx.moveTo(-6, -8);
          ctx.lineTo(0, -28);
          ctx.lineTo(10, -10);
          ctx.fill();
          ctx.fillStyle = rgba(BONE, 0.9);
          ctx.fillRect(-18, 10, 8, 10);
          ctx.fillRect(10, 10, 8, 10);
        } else {
          ctx.fillStyle = rgba(BONE, 0.95);
          for (let k = -3; k <= 3; k++) {
            ctx.beginPath();
            ctx.moveTo(k * 6 - 3, 0);
            ctx.lineTo(k * 6, -16);
            ctx.lineTo(k * 6 + 3, 0);
            ctx.fill();
          }
        }
        ctx.fillStyle = rgba(DEEP, 0.9);
        ctx.beginPath();
        ctx.arc(-7, 0, 2.8, 0, TAU);
        ctx.arc(7, 0, 2.8, 0, TAU);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 8, 26, 16, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.beginPath();
        ctx.moveTo(-4, -6);
        ctx.quadraticCurveTo(4, -40, 10, -8);
        ctx.lineTo(2, -4);
        ctx.fill();
        ctx.fillStyle = rgba(LAVA, 0.9);
        ctx.beginPath();
        ctx.arc(0, 6, 8, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(DEEP, 0.9);
        ctx.beginPath();
        ctx.arc(-8, -2, 3.2, 0, TAU);
        ctx.arc(8, -2, 3.2, 0, TAU);
        ctx.fill();
      }
      if (en.type === 'boss') {
        ctx.strokeStyle = rgba(GOLD, 0.5);
        ctx.lineWidth = 2;
        ctx.strokeRect(-32, -26, 64, 52);
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(16, flap - 2);
      ctx.lineTo(4, -2);
      ctx.lineTo(0, -12);
      ctx.lineTo(-4, -2);
      ctx.lineTo(-16, flap - 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, -16);
      ctx.lineTo(2, -8);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(s.ang + Math.PI * 0.5);
      ctx.scale(scale, scale);
      ctx.shadowColor = rgba(LIME, 0.85);
      ctx.shadowBlur = 10;
      ctx.fillStyle = rgba(LIME, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, s.r * 0.55, s.r * 2.1, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -s.r * 0.4, s.r * 0.28, s.r * 0.9, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.scale(scale, scale);
      ctx.shadowColor = rgba(MAG, 0.7);
      ctx.shadowBlur = 8;
      ctx.fillStyle = rgba(PNK, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(-0.8, -0.8, s.r * 0.35, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = DROP_RGB[p.kind] || GOLD;
      const pulse = 1 + Math.sin(p.t * 8) * 0.08;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.scale(scale * pulse, scale * pulse);
      ctx.shadowColor = rgba(rgb, 0.8);
      ctx.shadowBlur = 12;
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(DEEP, 0.92);
      ctx.font = 'bold 9px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(DROP_GLYPH[p.kind] || '?', 0, 1);
      ctx.restore();
    }
  }

  function drawCoins() {
    for (let i = 0; i < G.coins.length; i++) {
      const c = G.coins[i];
      const pulse = 1 + Math.sin(c.t * 10) * 0.1;
      ctx.save();
      ctx.translate(sx(c.x), sy(c.y));
      ctx.scale(scale * pulse, scale * pulse);
      ctx.shadowColor = rgba(AMBER, 0.8);
      ctx.shadowBlur = 8;
      ctx.fillStyle = rgba(AMBER, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.4, 4.4, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 2.1, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawNaps() {
    for (let i = 0; i < G.naps.length; i++) {
      const n = G.naps[i];
      ctx.save();
      ctx.translate(sx(n.x), sy(n.y));
      ctx.scale(scale, scale);
      ctx.shadowColor = rgba(n.rgb, 0.8);
      ctx.shadowBlur = 10;
      ctx.fillStyle = rgba(n.rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.quadraticCurveTo(5, 0, 0, -10);
      ctx.quadraticCurveTo(-5, 0, 0, 8);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(-3, -2, 6, 2);
      ctx.restore();
    }
    for (let i = 0; i < G.fires.length; i++) {
      const f = G.fires[i];
      const a = 1 - f.t / f.life;
      ctx.save();
      ctx.translate(sx(f.x), sy(f.y));
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(AMBER, a * 0.45);
      ctx.beginPath();
      ctx.ellipse(0, 0, f.r, f.r * 0.45, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, a * 0.55);
      ctx.beginPath();
      ctx.ellipse(0, -4, f.r * 0.45, f.r * 0.7, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), Math.max(0.4, p.r * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = (2.2 - s.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      if (r.t < 0) continue;
      ctx.strokeStyle = rgba(r.rgb, 0.85 - r.t * 0.85);
      ctx.lineWidth = (3.5 - r.t * 2) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 46) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' || G.ents[i].type === 'mid') {
        if (!boss || G.ents[i].type === 'boss') boss = G.ents[i];
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
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : LIME, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : LIME, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    const st = STAGES[G.stage - 1];
    const name = boss.type === 'boss' ? (st ? st.boss : '关底') : (st ? st.mid : '中型');
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = 'bold ' + (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name, sx(x), sy(y - 4));
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    if (G.bombFlash > 0) {
      ctx.strokeStyle = rgba(AMBER, G.bombFlash * 0.9);
      ctx.lineWidth = 7 * scale;
      ctx.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#061002';
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
    drawNaps();
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawCoins();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawPlane(G.player.x, G.player.y, 1);
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
    G.coins.length = 0;
    G.scenery.length = 0;
    G.naps.length = 0;
    G.fires.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'fire' ? 'fire' : 'isle';
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
    G.gunLv = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.prop = 0;
    G.spawnT = 0.7;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.dropI = 0;
    G.nextSc = 40;
    G.stormT = 1.6;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedLeaves();
    seedScenery();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isDense() ? '炎岛 · 更密更快' : '史前 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'isle';
    G.stage = 1;
    G.lives = LIVES;
    G.bombs = 3;
    G.gunLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bombT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedLeaves();
    seedScenery();
    showOverlay('title', '史前', '战机北上。机枪扫翼龙，炸弹砸地兽。吃弹加宽，撞体扣命。三关之后是泰坦龙。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('isle');
    else startGame(G.kind || 'isle');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('isle');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('fire');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isDense()) goTitle();
      else startGame('fire');
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

  if (btnIsle) {
    btnIsle.addEventListener('click', function () {
      audio.ensure();
      startGame('isle');
    });
  }
  if (btnFire) {
    btnFire.addEventListener('click', function () {
      audio.ensure();
      startGame('fire');
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
      if (G.mode === 'win' && !isDense()) startGame('fire');
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
