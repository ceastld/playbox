'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const BEST_KEY = 'playbox-twin-bee-best';
  const MUTE_KEY = 'playbox-twin-bee-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · C 投弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const BEE = [240, 212, 25];
  const WHT = [244, 247, 255];
  const RED = [255, 84, 84];
  const BLU = [70, 170, 255];
  const ORG = [255, 168, 48];
  const LEAF = [156, 255, 74];
  const PNK = [255, 154, 212];
  const DEEP = [16, 14, 4];

  const BELL_RGB = [GOLD, BLU, WHT, RED];
  const BELL_NAME = ['金铃', '双联', '护罩', '加速'];
  const YEL_SCORE = [500, 1000, 2000, 4000, 8000, 10000];

  const STAGES = [
    { name: '花野', boss: '花冠', bossHp: 78, seed: 1, len: 2100 },
    { name: '云城', boss: '云台', bossHp: 108, seed: 2, len: 2300 },
    { name: '蜂巢', boss: '蜂后', bossHp: 142, seed: 3, len: 2500 }
  ];
  const BOSS_SCORE = [4000, 6000, 9000];

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
  const btnPatrol = document.getElementById('btn-patrol');
  const btnFrenzy = document.getElementById('btn-frenzy');
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
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const slotDouble = document.querySelector('.slot[data-id="double"]');
  const slotBarrier = document.querySelector('.slot[data-id="barrier"]');
  const slotSpeed = document.querySelector('.slot[data-id="speed"]');

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
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false, fire: false, bomb: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH * 0.78, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'patrol',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    cam: 0,
    spawnI: 0,
    spawns: [],
    air: [],
    ground: [],
    clouds: [],
    bells: [],
    shots: [],
    bombs: [],
    eShots: [],
    ship: { x: VW * 0.5, y: VH * 0.78 },
    fireCd: 0,
    bombCd: 0,
    double: false,
    barrier: false,
    speedLv: 0,
    yellow: 0,
    invuln: 0,
    deadT: 0,
    ready: 0,
    stop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: GOLD,
    muzzle: 0,
    powT: 0,
    boss: null,
    bossDone: false,
    clearT: 0,
    why: '',
    toastT: 0,
    padBomb: false
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
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function isDense() {
    return G.kind === 'frenzy';
  }
  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }
  function hit(ax, ay, ar, bx, by, br) {
    const r = ar + br;
    return dist2(ax, ay, bx, by) <= r * r;
  }
  function mulberry(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function thash(ix, iy) {
    let n = (ix * 374761393 + iy * 668265263) ^ ((STAGES[G.stage] ? STAGES[G.stage].seed : 1) * 127);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
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
      this.beep(920, 0.05, 'square', 0.03, 1760);
    },
    bomb() {
      this.ensure();
      this.beep(220, 0.08, 'sawtooth', 0.04, 90);
      this.noise(0.06, 0.04, 400);
    },
    ding(color) {
      this.ensure();
      const f = 660 + color * 160;
      this.beep(f, 0.08, 'sine', 0.05, f * 1.5);
      this.beep(f * 2, 0.12, 'triangle', 0.032, f * 2.4);
    },
    power(color) {
      this.ensure();
      const base = [523, 659, 784, 880][color] || 659;
      this.beep(base, 0.1, 'square', 0.05, base * 1.5);
      this.beep(base * 1.5, 0.16, 'triangle', 0.042, base * 2);
      this.beep(base * 2, 0.22, 'sine', 0.036, base * 2.4);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.035, 0.034, 1200);
      this.beep(560 * lift, 0.06, 'square', 0.042, 900 * lift);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(260, 0.14, 'sawtooth', 0.045, 70);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.055, 360);
      this.beep(320, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.3, 'sine', 0.045, 48);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
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
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    miss() {
      this.ensure();
      this.beep(180, 0.05, 'sine', 0.016, 90);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    shield() {
      this.ensure();
      this.beep(880, 0.08, 'triangle', 0.04, 420);
      this.noise(0.08, 0.04, 700);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.06, 'sawtooth', 0.04, 160);
      this.beep(620, 0.08, 'square', 0.032, 880);
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

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
    comboTok += 1;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.15;
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

  function flashSlot(el) {
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
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

  function syncPwr() {
    if (slotDouble) {
      slotDouble.classList.toggle('on', !!G.double);
      slotDouble.classList.toggle('hot', !!G.double && G.powT > 0);
    }
    if (slotBarrier) {
      slotBarrier.classList.toggle('on', !!G.barrier);
      slotBarrier.classList.toggle('hot', !!G.barrier && G.powT > 0);
    }
    if (slotSpeed) {
      slotSpeed.classList.toggle('on', G.speedLv > 0);
      slotSpeed.classList.toggle('hot', G.speedLv >= 3);
      slotSpeed.textContent = G.speedLv > 1 ? '速' + G.speedLv : '速';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const st = STAGES[G.stage];
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '双蜂';
      else if (G.boss) stageLabel.textContent = st.boss;
      else stageLabel.textContent = '第 ' + (G.stage + 1) + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (!!G.boss || G.stage >= 2));
    }
    if (tagLabel) {
      let tag = isDense() ? '乱舞' : '巡逻';
      if (G.mode === 'play' && G.barrier) tag = '护罩';
      if (G.mode === 'play' && G.boss) tag = st.boss;
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.double);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 中弹或相撞扣命，护罩可挡一次', 'warn');
    else if (G.mode === 'win') setHint('通关 · R 再来 · 打铃攒武装', 'hot');
    else if (G.boss) setHint('Boss · 空格打空中 · C 也能砸', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 白铃护罩能挡一次', 'warn');
    else if (G.double) setHint('双联在身 · 继续打铃换色', 'hot');
    else setHint('打云出铃 · 黄分 蓝双 白盾 红速', '');
    syncPips();
    syncPwr();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'BEE';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'win' || kind === 'lose';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
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
    const cls = mag >= 6 ? 'die' : mag >= 3.5 ? 'pow' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('pow');
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
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 220,
        life: rand(0.22, 0.52),
        max: 0.52,
        r: rand(1.2, 2.9),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 160);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 14);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.72, vy: -48, text: text, rgb: rgb, size: 12 });
    capArr(floats, 18);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.78 ? 0.7 : 1.2,
        a: rand(0.2, 0.7),
        p: rand(0, TAU),
        v: rand(10, 42),
        rgb: Math.random() < 0.2 ? BEE : Math.random() < 0.15 ? CYN : WHT
      });
    }
  }

  function camSpeed() {
    if (G.boss) return 10;
    return isDense() ? 188 : 128;
  }

  function shipSpd() {
    return 208 + G.speedLv * 44;
  }

  function sightY() {
    return G.ship.y - 54;
  }

  function buildSpawns(si, dense) {
    const st = STAGES[si];
    const rng = mulberry(st.seed * 104729 + (dense ? 17 : 3));
    const events = [];
    const dens = dense ? 0.68 : 1;
    const len = st.len;
    const extra = dense ? 1 : 0;

    for (let y = 140; y < len - 220; y += (170 * dens) + rng() * 70) {
      events.push({ y: y, kind: 'cloud', x: 50 + rng() * 380 });
      if (dense && rng() < 0.45) {
        events.push({ y: y + 40, kind: 'cloud', x: 50 + rng() * 380 });
      }
    }
    for (let y = 70; y < len - 200; y += (108 * dens) + rng() * 46) {
      const roll = rng();
      const x = 70 + rng() * 340;
      if (roll < 0.38) events.push({ y: y, kind: 'bees', n: 3 + extra + (si > 0 ? 1 : 0), x: x });
      else if (roll < 0.6) events.push({ y: y, kind: 'wasp', n: 2 + extra });
      else if (roll < 0.8) events.push({ y: y, kind: 'hover', x: x });
      else events.push({ y: y, kind: 'dart', n: 2 + extra, x: x });
    }
    for (let y = 90; y < len - 180; y += (92 * dens) + rng() * 40) {
      const roll = rng();
      const x = 46 + rng() * 388;
      if (roll < 0.32) events.push({ y: y, kind: 'house', x: x });
      else if (roll < 0.58) events.push({ y: y, kind: 'turret', x: x });
      else if (roll < 0.8) events.push({ y: y, kind: 'tank', x: x });
      else events.push({ y: y, kind: 'bunker', x: x });
    }
    events.sort(function (a, b) { return a.y - b.y; });
    return events;
  }

  function spawnCloud(x, y) {
    G.clouds.push({
      x: x,
      y: y == null ? -28 : y,
      vx: rand(-18, 18),
      hp: 2,
      phase: rand(0, TAU),
      r: 22
    });
  }

  function spawnBell(x, y) {
    G.bells.push({
      x: x,
      y: y,
      vx: rand(-30, 30),
      vy: 46,
      color: 0,
      hits: 0,
      wob: rand(0, TAU)
    });
  }

  function spawnAir(kind, x, y, extra) {
    const e = {
      kind: kind,
      x: x,
      y: y == null ? -24 : y,
      vx: 0,
      vy: 82,
      hp: 1,
      maxHp: 1,
      phase: rand(0, TAU),
      fireCd: rand(0.5, 1.4),
      r: 12,
      score: 80,
      hitFlash: 0,
      dir: Math.random() < 0.5 ? -1 : 1
    };
    if (kind === 'bee') {
      e.vy = 76;
      e.score = 80;
      e.r = 11;
    } else if (kind === 'wasp') {
      e.vy = 70;
      e.score = 120;
      e.r = 12;
    } else if (kind === 'hover') {
      e.vy = 90;
      e.hp = 2;
      e.maxHp = 2;
      e.score = 200;
      e.r = 14;
      e.fireCd = 0.6;
    } else if (kind === 'dart') {
      e.vy = 40;
      e.score = 110;
      e.r = 10;
    }
    if (extra) {
      for (const k in extra) e[k] = extra[k];
    }
    G.air.push(e);
    return e;
  }

  function spawnGround(kind, x, y) {
    const e = {
      kind: kind,
      x: x,
      y: y == null ? -20 : y,
      vx: 0,
      hp: 1,
      maxHp: 1,
      fireCd: rand(0.8, 1.8),
      r: 14,
      score: 60,
      hitFlash: 0,
      dir: Math.random() < 0.5 ? -1 : 1
    };
    if (kind === 'house') {
      e.r = 15;
      e.score = 50;
    } else if (kind === 'turret') {
      e.hp = 2;
      e.maxHp = 2;
      e.r = 14;
      e.score = 150;
    } else if (kind === 'tank') {
      e.hp = 2;
      e.maxHp = 2;
      e.r = 15;
      e.score = 180;
      e.vx = e.dir * 36;
    } else if (kind === 'bunker') {
      e.hp = 3;
      e.maxHp = 3;
      e.r = 17;
      e.score = 250;
    }
    if (isDense() && e.hp > 1) e.hp += 1;
    e.maxHp = e.hp;
    G.ground.push(e);
  }

  function spawnEvent(ev) {
    const y = -26;
    if (ev.kind === 'cloud') spawnCloud(ev.x, y);
    else if (ev.kind === 'bees') {
      const n = ev.n || 3;
      for (let i = 0; i < n; i++) {
        spawnAir('bee', ev.x + (i - (n - 1) * 0.5) * 34, y - i * 20);
      }
    } else if (ev.kind === 'wasp') {
      const n = ev.n || 2;
      for (let i = 0; i < n; i++) {
        spawnAir('wasp', 80 + i * (VW - 160) / Math.max(1, n - 1), y - i * 16);
      }
    } else if (ev.kind === 'hover') {
      spawnAir('hover', ev.x, y);
    } else if (ev.kind === 'dart') {
      const n = ev.n || 2;
      for (let i = 0; i < n; i++) {
        spawnAir('dart', ev.x + (i - (n - 1) * 0.5) * 40, y - i * 18);
      }
    } else if (ev.kind === 'house' || ev.kind === 'turret' || ev.kind === 'tank' || ev.kind === 'bunker') {
      spawnGround(ev.kind, ev.x, y);
    }
  }

  function spawnBoss() {
    const st = STAGES[G.stage];
    const hp = (st.bossHp * (isDense() ? 1.22 : 1)) | 0;
    G.boss = {
      x: VW * 0.5,
      y: -70,
      vx: 70,
      hp: hp,
      maxHp: hp,
      fireCd: 1.1,
      phase: 0,
      t: 0,
      r: 34,
      hitFlash: 0,
      name: st.boss
    };
    toast(st.boss + ' 来袭', false, true);
    audio.stage();
    kick(3);
    screenFlash(ORG, 0.35);
  }

  function enemyShot(x, y, vx, vy, r, fat) {
    G.eShots.push({
      x: x, y: y,
      vx: vx, vy: vy,
      r: r || 3.4,
      fat: !!fat
    });
    capArr(G.eShots, 90);
  }

  function aimShot(x, y, spd, r) {
    const dx = G.ship.x - x;
    const dy = G.ship.y - y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    enemyShot(x, y, dx / d * spd, dy / d * spd, r || 3.2, false);
  }

  function fireAir() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0.55) return;
    if (G.fireCd > 0) return;
    const max = G.double ? 6 : 3;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].air) n += 1;
    if (n >= max) return;
    G.fireCd = G.double ? 0.1 : 0.12;
    G.muzzle = 0.06;
    const y = G.ship.y - 16;
    if (G.double) {
      G.shots.push({ x: G.ship.x - 8, y: y, vy: -640, air: true });
      G.shots.push({ x: G.ship.x + 8, y: y, vy: -640, air: true });
    } else {
      G.shots.push({ x: G.ship.x, y: y, vy: -640, air: true });
    }
    capArr(G.shots, 12);
    audio.shoot();
  }

  function fireBomb() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0.55) return;
    if (G.bombCd > 0) return;
    if (G.bombs.length >= 2) return;
    G.bombCd = 0.28;
    const tx = G.ship.x;
    const ty = sightY();
    G.bombs.push({
      x: G.ship.x,
      y: G.ship.y - 8,
      tx: tx,
      ty: ty,
      t: 0,
      life: 0.18
    });
    audio.bomb();
  }

  function powerFlash(rgb) {
    G.powT = 0.42;
    screenFlash(rgb, 0.5);
    kick(3.2);
    hitStop(0.04);
    ring(G.ship.x, G.ship.y, rgb);
    burst(G.ship.x, G.ship.y, rgb, 18, 220);
    if (stageEl) {
      stageEl.classList.remove('pow');
      void stageEl.offsetWidth;
      stageEl.classList.add('pow');
    }
  }

  function collectBell(b) {
    const rgb = BELL_RGB[b.color];
    if (b.color === 0) {
      const idx = Math.min(YEL_SCORE.length - 1, G.yellow);
      const n = YEL_SCORE[idx] * G.mult;
      G.yellow += 1;
      addScore(n);
      floatText(b.x, b.y, '+' + n, GOLD);
      toast(G.yellow >= 3 ? '金铃 ×' + G.yellow : '金铃', false, true);
      kick(1.8);
      screenFlash(GOLD, 0.28);
    } else if (b.color === 1) {
      G.double = true;
      G.yellow = 0;
      addScore(200 * G.mult);
      floatText(b.x, b.y, '双联', BLU);
      toast('双联射击', false, false);
      flashSlot(slotDouble);
      powerFlash(BLU);
    } else if (b.color === 2) {
      G.barrier = true;
      G.yellow = 0;
      addScore(200 * G.mult);
      floatText(b.x, b.y, '护罩', WHT);
      toast('护罩展开', false, false);
      flashSlot(slotBarrier);
      powerFlash(WHT);
    } else {
      G.speedLv = Math.min(5, G.speedLv + 1);
      G.yellow = 0;
      addScore(200 * G.mult);
      floatText(b.x, b.y, '加速 ' + G.speedLv, RED);
      toast('加速 ' + G.speedLv, false, false);
      flashSlot(slotSpeed);
      powerFlash(RED);
    }
    audio.power(b.color);
    spark(b.x, b.y, rgb);
    burst(b.x, b.y, rgb, 14, 180);
    syncPwr();
  }

  function pingBell(b, sx0, sy0) {
    b.hits += 1;
    b.vy = -150;
    b.vx += (b.x < sx0 ? 1 : -1) * 18;
    audio.ding(b.color);
    spark(b.x, b.y, BELL_RGB[b.color]);
    burst(b.x, b.y, BELL_RGB[b.color], 6, 90);
    if (b.hits >= 2) {
      b.hits = 0;
      b.color = (b.color + 1) % 4;
      ring(b.x, b.y, BELL_RGB[b.color]);
      floatText(b.x, b.y - 8, BELL_NAME[b.color], BELL_RGB[b.color]);
      audio.ding(b.color);
    }
  }

  function scoreKill(base, x, y, rgb) {
    bumpCombo();
    const n = base * G.mult;
    addScore(n);
    floatText(x, y, n >= 1000 ? '' + n : '+' + n, rgb || GOLD);
    audio.hit(G.combo);
    hitStop(0.042);
    kick(2.2);
    burst(x, y, rgb || ORG, 14, 200);
    spark(x, y, rgb || GOLD);
  }

  function damageAir(e) {
    e.hp -= 1;
    e.hitFlash = 0.08;
    if (e.hp <= 0) {
      scoreKill(e.score, e.x, e.y, e.kind === 'hover' ? CYN : BEE);
      ring(e.x, e.y, BEE);
      e.dead = true;
    } else {
      audio.hit(G.combo);
      burst(e.x, e.y, WHT, 5, 80);
    }
  }

  function damageGround(e) {
    e.hp -= 1;
    e.hitFlash = 0.1;
    if (e.hp <= 0) {
      scoreKill(e.score, e.x, e.y, ORG);
      ring(e.x, e.y, ORG);
      burst(e.x, e.y, GOLD, 16, 210);
      hitStop(0.055);
      kick(2.8);
      e.dead = true;
    } else {
      audio.hit(G.combo);
      burst(e.x, e.y, ORG, 6, 90);
      hitStop(0.03);
    }
  }

  function damageBoss(n, x, y) {
    const b = G.boss;
    if (!b || b.hp <= 0) return;
    b.hp -= n;
    b.hitFlash = 0.08;
    audio.bossHit();
    burst(x, y, ORG, 8, 120);
    hitStop(0.038);
    kick(2);
    if (b.hp <= 0) {
      b.hp = 0;
      scoreKill(BOSS_SCORE[G.stage] || 4000, b.x, b.y, GOLD);
      burst(b.x, b.y, GOLD, 36, 280);
      ring(b.x, b.y, GOLD);
      ring(b.x, b.y, MAG);
      screenFlash(GOLD, 0.55);
      hitStop(0.08);
      kick(6);
      audio.explode();
      G.clearT = 1.15;
      G.bossDone = true;
      G.boss = null;
      toast(STAGES[G.stage].name + '肃清', false, true);
    }
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.invuln > 0) return;
    if (G.barrier) {
      G.barrier = false;
      G.invuln = 0.85;
      audio.shield();
      screenFlash(WHT, 0.45);
      ring(G.ship.x, G.ship.y, WHT);
      burst(G.ship.x, G.ship.y, WHT, 18, 200);
      kick(3);
      hitStop(0.05);
      toast('护罩碎了', true, false);
      syncPwr();
      return;
    }
    G.lives -= 1;
    G.deadT = 0.92;
    G.double = false;
    G.speedLv = 0;
    G.yellow = 0;
    G.combo = 0;
    G.mult = 1;
    G.why = why || '坠机了';
    audio.death();
    burst(G.ship.x, G.ship.y, MAG, 28, 260);
    ring(G.ship.x, G.ship.y, MAG);
    screenFlash(MAG, 0.5);
    hitStop(0.072);
    kick(7);
    syncPips();
    syncPwr();
  }

  function bombExplode(b) {
    ring(b.tx, b.ty, GOLD);
    burst(b.tx, b.ty, ORG, 16, 180);
    spark(b.tx, b.ty, GOLD);
    kick(2.4);
    hitStop(0.04);
    audio.explode();
    let hitAny = false;
    for (let i = 0; i < G.ground.length; i++) {
      const e = G.ground[i];
      if (e.dead) continue;
      if (hit(b.tx, b.ty, 32, e.x, e.y, e.r)) {
        damageGround(e);
        hitAny = true;
      }
    }
    if (G.boss && hit(b.tx, b.ty, 30, G.boss.x, G.boss.y, G.boss.r)) {
      damageBoss(2, b.tx, b.ty);
      hitAny = true;
    }
    if (!hitAny) floatText(b.tx, b.ty, '空', WHT);
  }

  function resetField() {
    G.air.length = 0;
    G.ground.length = 0;
    G.clouds.length = 0;
    G.bells.length = 0;
    G.shots.length = 0;
    G.bombs.length = 0;
    G.eShots.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
    G.cam = 0;
    G.spawnI = 0;
    G.boss = null;
    G.bossDone = false;
    G.clearT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH * 0.78;
    G.fireCd = 0;
    G.bombCd = 0;
    G.invuln = 0;
    G.deadT = 0;
    G.stop = 0;
    G.shake = 0;
    G.punch = 1;
    G.flash = 0;
    G.muzzle = 0;
    G.powT = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
  }

  function setupStage(si) {
    G.stage = si;
    G.spawns = buildSpawns(si, isDense());
    G.spawnI = 0;
    G.cam = 0;
    G.boss = null;
    G.bossDone = false;
    G.clearT = 0;
    G.ready = 0.75;
    G.air.length = 0;
    G.ground.length = 0;
    G.clouds.length = 0;
    G.eShots.length = 0;
    const st = STAGES[si];
    toast((isDense() ? '乱舞 · ' : '') + st.name, false, si === 0);
  }

  function nextStage() {
    addScore(2000);
    audio.stage();
    if (G.stage >= STAGES.length - 1) {
      winRun();
      return;
    }
    setupStage(G.stage + 1);
    G.invuln = Math.max(G.invuln, 0.8);
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play') return;
    addScore(isDense() ? 6000 : 5000);
    G.mode = 'win';
    audio.win();
    screenFlash(GOLD, 0.55);
    kick(3);
    const title = isDense() ? '乱舞通关' : '双蜂凯旋';
    const lead = STAGES[G.stage].name + '肃清  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('win', title, lead);
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.why = why;
    keys.fire = false;
    keys.bomb = false;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    const lead = (why || '坠机了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '坠机了', lead);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'frenzy' ? 'frenzy' : 'patrol';
    G.mode = 'play';
    G.lives = LIVES;
    G.score = 0;
    G.why = '';
    G.clock = 0;
    G.double = false;
    G.barrier = false;
    G.speedLv = 0;
    G.yellow = 0;
    G.next1up = LIFE_EVERY;
    resetField();
    setupStage(0);
    hideOverlay();
    audio.start();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'patrol';
    G.stage = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    G.double = false;
    G.barrier = false;
    G.speedLv = 0;
    resetField();
    G.spawns = buildSpawns(0, false);
    G.ready = 0;
    showOverlay('title', '双蜂', '打云出铃，打铃换色。空中空格，地面投弹。', '巡逻', '乱舞');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('patrol');
    else startGame(G.kind || 'patrol');
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const spd = shipSpd();
    let ax = 0;
    let ay = 0;
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (keys.u) ay -= 1;
    if (keys.d) ay += 1;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      G.ship.x = lerp(G.ship.x, pointer.x, 1 - Math.exp(-dt * 14));
      G.ship.y = lerp(G.ship.y, pointer.y, 1 - Math.exp(-dt * 14));
    } else if (ax || ay) {
      const inv = ax && ay ? 0.7071 : 1;
      G.ship.x += ax * spd * inv * dt;
      G.ship.y += ay * spd * inv * dt;
    }
    G.ship.x = clamp(G.ship.x, 22, VW - 22);
    G.ship.y = clamp(G.ship.y, 70, VH - 36);

    if (!REDUCE && G.mode === 'play') {
      trails.push({
        x: G.ship.x,
        y: G.ship.y + 12,
        t: 0,
        rgb: G.double ? CYN : BEE
      });
      capArr(trails, 18);
    }
  }

  function updateSpawns() {
    while (G.spawnI < G.spawns.length && G.spawns[G.spawnI].y <= G.cam) {
      spawnEvent(G.spawns[G.spawnI]);
      G.spawnI += 1;
    }
    const st = STAGES[G.stage];
    if (G.mode === 'play' && !G.boss && !G.bossDone && G.cam >= st.len) {
      spawnBoss();
    }
  }

  function updateClouds(dt) {
    const scroll = camSpeed();
    for (let i = G.clouds.length - 1; i >= 0; i--) {
      const c = G.clouds[i];
      c.y += scroll * dt;
      c.x += c.vx * dt + Math.sin(G.t * 1.4 + c.phase) * 12 * dt;
      c.phase += dt;
      if (c.y > VH + 40) {
        G.clouds.splice(i, 1);
      }
    }
  }

  function updateBells(dt) {
    for (let i = G.bells.length - 1; i >= 0; i--) {
      const b = G.bells[i];
      b.vy += 92 * dt;
      if (b.vy > 120) b.vy = 120;
      b.y += b.vy * dt;
      b.x += b.vx * dt;
      b.vx *= Math.exp(-dt * 0.6);
      b.wob += dt * 8;
      if (b.x < 18) { b.x = 18; b.vx = Math.abs(b.vx); }
      if (b.x > VW - 18) { b.x = VW - 18; b.vx = -Math.abs(b.vx); }
      if (b.y < 12) { b.y = 12; b.vy = Math.abs(b.vy) * 0.6; }
      if (b.y > VH + 24) {
        G.bells.splice(i, 1);
        if (G.mode === 'play') audio.miss();
        G.yellow = 0;
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && hit(b.x, b.y, 15, G.ship.x, G.ship.y, 12)) {
        collectBell(b);
        G.bells.splice(i, 1);
      }
    }
  }

  function updateAir(dt) {
    const dense = isDense();
    for (let i = G.air.length - 1; i >= 0; i--) {
      const e = G.air[i];
      if (e.dead) {
        G.air.splice(i, 1);
        continue;
      }
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.phase += dt;
      if (e.kind === 'bee') {
        e.y += e.vy * dt;
        e.x += Math.sin(G.t * 2.2 + e.phase) * 46 * dt;
      } else if (e.kind === 'wasp') {
        e.y += e.vy * dt;
        e.x += Math.cos(G.t * 3.4 + e.phase) * 140 * dt;
      } else if (e.kind === 'hover') {
        if (e.y < 118) e.y += e.vy * dt;
        else {
          e.x += e.dir * 70 * dt;
          if (e.x < 40 || e.x > VW - 40) e.dir *= -1;
        }
      } else if (e.kind === 'dart') {
        e.vy += 140 * dt;
        if (e.vy > 280) e.vy = 280;
        e.y += e.vy * dt;
        e.x += clamp(G.ship.x - e.x, -1, 1) * 50 * dt;
      }
      e.x = clamp(e.x, 16, VW - 16);
      e.fireCd -= dt;
      const canShoot = G.mode === 'play' && G.deadT <= 0 && e.y > 20 && e.y < VH - 80;
      if (canShoot && e.fireCd <= 0) {
        if (e.kind === 'hover') {
          aimShot(e.x, e.y + 10, dense ? 220 : 180, 3.6);
          e.fireCd = dense ? 1.05 : 1.35;
        } else if (e.kind === 'wasp' && Math.random() < 0.55) {
          enemyShot(e.x, e.y + 8, 0, dense ? 210 : 170, 3.2, false);
          e.fireCd = dense ? 1.2 : 1.6;
        } else if (e.kind === 'bee' && Math.random() < 0.28) {
          enemyShot(e.x, e.y + 8, 0, 160, 3, false);
          e.fireCd = 2.2;
        } else {
          e.fireCd = 0.8;
        }
      }
      if (e.y > VH + 40) G.air.splice(i, 1);
    }
  }

  function updateGround(dt) {
    const scroll = camSpeed();
    const dense = isDense();
    for (let i = G.ground.length - 1; i >= 0; i--) {
      const e = G.ground[i];
      if (e.dead) {
        G.ground.splice(i, 1);
        continue;
      }
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.y += scroll * dt;
      if (e.kind === 'tank') {
        e.x += e.vx * dt;
        if (e.x < 30 || e.x > VW - 30) e.vx *= -1;
      }
      e.fireCd -= dt;
      const canShoot = G.mode === 'play' && G.deadT <= 0 && e.y > 40 && e.y < VH - 60;
      if (canShoot && e.fireCd <= 0 && (e.kind === 'turret' || e.kind === 'bunker')) {
        aimShot(e.x, e.y - 6, dense ? 200 : 160, e.kind === 'bunker' ? 4 : 3.2);
        e.fireCd = (e.kind === 'bunker' ? 1.5 : 1.7) / (dense ? 1.2 : 1);
      }
      if (e.y > VH + 36) G.ground.splice(i, 1);
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b) return;
    b.t += dt;
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    if (b.y < 108) {
      b.y += 90 * dt;
      return;
    }
    const si = G.stage;
    const dense = isDense();
    if (si === 0) {
      b.x += b.vx * dt;
      if (b.x < 70 || b.x > VW - 70) b.vx *= -1;
      b.y = 108 + Math.sin(b.t * 1.5) * 16;
    } else if (si === 1) {
      b.x += b.vx * 1.15 * dt;
      if (b.x < 80 || b.x > VW - 80) b.vx *= -1;
      b.y = 100 + Math.sin(b.t * 0.9) * 22;
    } else {
      b.x = VW * 0.5 + Math.sin(b.t * 1.1) * 150;
      b.y = 112 + Math.cos(b.t * 1.7) * 28;
    }
    b.fireCd -= dt;
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (b.fireCd > 0) return;
    const hpN = b.hp / b.maxHp;
    const angry = hpN < 0.45;
    if (si === 0) {
      for (let k = -1; k <= 1; k++) {
        enemyShot(b.x + k * 16, b.y + 20, k * 70, 180, 3.6, false);
      }
      if (angry) aimShot(b.x, b.y + 18, 210, 4);
      b.fireCd = (angry ? 0.72 : 1.05) / (dense ? 1.15 : 1);
    } else if (si === 1) {
      for (let k = -2; k <= 2; k++) {
        enemyShot(b.x, b.y + 22, k * 55, 170, 3.4, k === 0);
      }
      if (angry) {
        enemyShot(b.x - 28, b.y + 8, 0, 200, 4, true);
        enemyShot(b.x + 28, b.y + 8, 0, 200, 4, true);
      }
      b.fireCd = (angry ? 0.78 : 1.12) / (dense ? 1.15 : 1);
    } else {
      const n = angry ? 10 : 8;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + b.t;
        enemyShot(b.x, b.y, Math.cos(a) * 150, Math.sin(a) * 150, 3.5, false);
      }
      if (angry && Math.random() < 0.5) {
        spawnAir('bee', b.x + rand(-40, 40), b.y + 20);
      }
      b.fireCd = (angry ? 0.85 : 1.2) / (dense ? 1.12 : 1);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.y += s.vy * dt;
      if (s.y < -18) {
        G.shots.splice(i, 1);
        continue;
      }
      let consumed = false;
      for (let j = 0; j < G.bells.length; j++) {
        const b = G.bells[j];
        if (hit(s.x, s.y, 5, b.x, b.y, 14)) {
          pingBell(b, s.x, s.y);
          G.shots.splice(i, 1);
          consumed = true;
          break;
        }
      }
      if (consumed) continue;
      for (let j = 0; j < G.clouds.length; j++) {
        const c = G.clouds[j];
        if (hit(s.x, s.y, 5, c.x, c.y, c.r)) {
          c.hp -= 1;
          burst(s.x, s.y, WHT, 8, 80);
          audio.hit(1);
          G.shots.splice(i, 1);
          if (c.hp <= 0) {
            spawnBell(c.x, c.y);
            burst(c.x, c.y, WHT, 16, 140);
            ring(c.x, c.y, WHT);
            G.clouds.splice(j, 1);
            audio.ding(0);
          }
          consumed = true;
          break;
        }
      }
      if (consumed) continue;
      for (let j = 0; j < G.air.length; j++) {
        const e = G.air[j];
        if (e.dead) continue;
        if (hit(s.x, s.y, 5, e.x, e.y, e.r)) {
          damageAir(e);
          G.shots.splice(i, 1);
          consumed = true;
          break;
        }
      }
      if (consumed) continue;
      if (G.boss && hit(s.x, s.y, 6, G.boss.x, G.boss.y, G.boss.r)) {
        damageBoss(1, s.x, s.y);
        G.shots.splice(i, 1);
      }
    }
  }

  function updateBombs(dt) {
    for (let i = G.bombs.length - 1; i >= 0; i--) {
      const b = G.bombs[i];
      b.t += dt;
      const u = clamp(b.t / b.life, 0, 1);
      b.x = lerp(b.x, b.tx, u);
      b.y = lerp(b.y, b.ty, u);
      if (u >= 1) {
        bombExplode(b);
        G.bombs.splice(i, 1);
      }
    }
  }

  function updateEShots(dt) {
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.x < -20 || s.x > VW + 20 || s.y < -30 || s.y > VH + 30) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode !== 'play' || G.deadT > 0) continue;
      const pr = G.barrier ? 14 : 8;
      if (G.invuln <= 0 && hit(s.x, s.y, s.r, G.ship.x, G.ship.y, pr)) {
        G.eShots.splice(i, 1);
        killPlayer('中弹了');
      }
    }
  }

  function collideBodies() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    const pr = G.barrier ? 14 : 8;
    for (let i = 0; i < G.air.length; i++) {
      const e = G.air[i];
      if (e.dead) continue;
      if (hit(e.x, e.y, e.r * 0.75, G.ship.x, G.ship.y, pr)) {
        e.dead = true;
        burst(e.x, e.y, BEE, 10, 140);
        killPlayer('相撞了');
        return;
      }
    }
    if (G.boss && hit(G.boss.x, G.boss.y, G.boss.r * 0.7, G.ship.x, G.ship.y, pr)) {
      killPlayer('撞上 Boss');
    }
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.powT = Math.max(0, G.powT - dt);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    const scroll = camSpeed();
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      s.y += (s.v + scroll * 0.12) * dt;
      if (s.y > VH) s.y = 0;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.3);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.36) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > 0.22) trails.splice(i, 1);
    }
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.bombCd = Math.max(0, G.bombCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    updatePlayer(dt);
    if (G.mode === 'play' && G.deadT <= 0) {
      if (keys.fire || pointer.down) fireAir();
      if (keys.bomb || G.padBomb) fireBomb();
    }
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      updateBombs(dt);
      updateClouds(dt);
      updateBells(dt);
      return;
    }
    G.cam += camSpeed() * dt;
    updateSpawns();
    updateClouds(dt);
    updateBells(dt);
    updateAir(dt);
    updateGround(dt);
    updateBoss(dt);
    updateShots(dt);
    updateBombs(dt);
    updateEShots(dt);
    collideBodies();
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      G.cam += 70 * dt;
      updateSpawns();
      updateClouds(dt);
      updateAir(dt);
      updateGround(dt);
      updateBells(dt);
      if (G.air.length + G.clouds.length < 4 && Math.random() < 0.02) {
        spawnCloud(60 + Math.random() * 360, -20);
        spawnAir('bee', 80 + Math.random() * 320, -24);
      }
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      updateClouds(dt * 0.4);
      updateAir(dt * 0.3);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      updateClouds(dt);
      updateAir(dt);
      updateGround(dt);
      updateBoss(dt);
      updateEShots(dt);
      updateBells(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('坠机了');
          updateFx(dt);
          return;
        }
        G.ship.x = VW * 0.5;
        G.ship.y = VH * 0.78;
        G.invuln = 1.5;
        G.eShots.length = 0;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }

    updateFx(dt);
    syncHud();
  }

  function drawTerrain() {
    const c = ctx;
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#1a2408');
    g.addColorStop(0.45, '#121806');
    g.addColorStop(1, '#0c0a03');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const TILE = 48;
    const start = Math.floor(G.cam / TILE) - 1;
    const rows = Math.ceil(VH / TILE) + 3;
    for (let r = 0; r < rows; r++) {
      const iy = start + r;
      const y = iy * TILE - G.cam;
      for (let ix = 0; ix < 11; ix++) {
        const h = thash(ix, iy);
        const x = ix * TILE - 16;
        if (h < 0.12) {
          c.fillStyle = 'rgba(40, 90, 110, 0.28)';
          c.beginPath();
          c.ellipse(sx(x + 24), sy(y + 24), 20 * scale, 12 * scale, 0, 0, TAU);
          c.fill();
        } else if (h < 0.22) {
          c.fillStyle = 'rgba(80, 50, 20, 0.22)';
          c.fillRect(sx(x + 18), sy(y), 10 * scale, TILE * scale);
        } else if (h > 0.82) {
          c.fillStyle = rgba(h > 0.92 ? MAG : h > 0.88 ? CYN : BEE, 0.35);
          c.beginPath();
          c.arc(sx(x + 16 + h * 12), sy(y + 18), 2.2 * scale, 0, TAU);
          c.fill();
          c.beginPath();
          c.arc(sx(x + 28), sy(y + 30), 1.6 * scale, 0, TAU);
          c.fill();
        } else if (h > 0.7) {
          c.fillStyle = 'rgba(40, 70, 18, 0.35)';
          c.beginPath();
          c.arc(sx(x + 22), sy(y + 26), 8 * scale, 0, TAU);
          c.fill();
        }
      }
    }

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(G.t * 1.5 + s.p)));
      c.fillStyle = rgba(s.rgb, a);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
    }
  }

  function drawCloud(cl) {
    const c = ctx;
    const wob = Math.sin(G.t * 1.6 + cl.phase) * 2;
    c.save();
    c.globalAlpha = 0.82;
    c.fillStyle = 'rgba(230, 236, 255, 0.72)';
    c.beginPath();
    c.ellipse(sx(cl.x), sy(cl.y + wob), 26 * scale, 14 * scale, 0, 0, TAU);
    c.ellipse(sx(cl.x - 16), sy(cl.y + 2 + wob), 16 * scale, 10 * scale, 0, 0, TAU);
    c.ellipse(sx(cl.x + 16), sy(cl.y + 2 + wob), 16 * scale, 10 * scale, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(BEE, 0.35);
    c.lineWidth = Math.max(1, 1.2 * scale);
    c.stroke();
    c.restore();
  }

  function drawBell(b) {
    const c = ctx;
    const rgb = BELL_RGB[b.color];
    const wob = Math.sin(b.wob) * 3;
    c.save();
    c.translate(sx(b.x), sy(b.y));
    c.rotate(wob * 0.04);
    c.fillStyle = rgba(rgb, 0.25);
    c.beginPath();
    c.arc(0, 0, 16 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(rgb, 1);
    c.beginPath();
    c.moveTo(0, -11 * scale);
    c.quadraticCurveTo(12 * scale, -4 * scale, 10 * scale, 6 * scale);
    c.quadraticCurveTo(0, 12 * scale, -10 * scale, 6 * scale);
    c.quadraticCurveTo(-12 * scale, -4 * scale, 0, -11 * scale);
    c.fill();
    c.fillStyle = rgba(WHT, 0.85);
    c.beginPath();
    c.arc(0, 7 * scale, 2.2 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.4);
    c.beginPath();
    c.ellipse(-3 * scale, -3 * scale, 3 * scale, 2 * scale, -0.4, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawBeeBody(x, y, rgb, s, wing) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(y));
    const wf = 0.7 + 0.3 * Math.sin(G.t * 26 + wing);
    c.fillStyle = 'rgba(232, 255, 248, 0.55)';
    c.beginPath();
    c.ellipse(-11 * s * scale, -1 * s * scale, 8 * s * scale, 4 * s * wf * scale, -0.3, 0, TAU);
    c.ellipse(11 * s * scale, -1 * s * scale, 8 * s * scale, 4 * s * wf * scale, 0.3, 0, TAU);
    c.fill();
    c.fillStyle = rgba(rgb, 1);
    c.beginPath();
    c.ellipse(0, 1 * s * scale, 9 * s * scale, 7.5 * s * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#1a1404';
    c.fillRect(-7 * s * scale, -1 * s * scale, 14 * s * scale, 2.2 * s * scale);
    c.fillStyle = rgba(WHT, 0.95);
    c.beginPath();
    c.arc(-3.2 * s * scale, -3.2 * s * scale, 1.6 * s * scale, 0, TAU);
    c.arc(3.2 * s * scale, -3.2 * s * scale, 1.6 * s * scale, 0, TAU);
    c.fill();
    c.fillStyle = '#120e04';
    c.beginPath();
    c.arc(-3.2 * s * scale, -3.2 * s * scale, 0.7 * s * scale, 0, TAU);
    c.arc(3.2 * s * scale, -3.2 * s * scale, 0.7 * s * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawAirEnt(e) {
    const rgb = e.hitFlash > 0 ? WHT : (e.kind === 'wasp' ? MAG : e.kind === 'hover' ? CYN : e.kind === 'dart' ? ORG : BEE);
    if (e.kind === 'hover') {
      const c = ctx;
      c.save();
      c.translate(sx(e.x), sy(e.y));
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.moveTo(0, -12 * scale);
      c.lineTo(12 * scale, 8 * scale);
      c.lineTo(-12 * scale, 8 * scale);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(WHT, 0.8);
      c.fillRect(-3 * scale, -2 * scale, 6 * scale, 6 * scale);
      c.restore();
    } else if (e.kind === 'dart') {
      const c = ctx;
      c.save();
      c.translate(sx(e.x), sy(e.y));
      c.fillStyle = rgba(rgb, 1);
      c.beginPath();
      c.moveTo(0, 12 * scale);
      c.lineTo(6 * scale, -8 * scale);
      c.lineTo(-6 * scale, -8 * scale);
      c.closePath();
      c.fill();
      c.restore();
    } else {
      drawBeeBody(e.x, e.y, rgb, e.kind === 'wasp' ? 0.95 : 0.85, e.phase);
    }
  }

  function drawGroundEnt(e) {
    const c = ctx;
    const rgb = e.hitFlash > 0 ? WHT : (e.kind === 'turret' ? MAG : e.kind === 'tank' ? ORG : e.kind === 'bunker' ? CYN : LEAF);
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(rgb, 0.95);
    if (e.kind === 'house') {
      c.fillRect(-10 * scale, -6 * scale, 20 * scale, 14 * scale);
      c.fillStyle = rgba(MAG, 0.9);
      c.beginPath();
      c.moveTo(-12 * scale, -6 * scale);
      c.lineTo(0, -16 * scale);
      c.lineTo(12 * scale, -6 * scale);
      c.closePath();
      c.fill();
    } else if (e.kind === 'tank') {
      c.fillRect(-12 * scale, -6 * scale, 24 * scale, 12 * scale);
      c.fillStyle = rgba(GOLD, 0.9);
      c.fillRect(-2 * scale, -14 * scale, 4 * scale, 10 * scale);
    } else if (e.kind === 'turret') {
      c.beginPath();
      c.arc(0, 2 * scale, 11 * scale, 0, TAU);
      c.fill();
      const ang = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
      c.strokeStyle = rgba(WHT, 0.85);
      c.lineWidth = 3 * scale;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(ang) * 14 * scale, Math.sin(ang) * 14 * scale);
      c.stroke();
    } else {
      c.fillRect(-14 * scale, -8 * scale, 28 * scale, 16 * scale);
      c.fillStyle = rgba(DEEP, 0.7);
      c.fillRect(-8 * scale, -4 * scale, 16 * scale, 8 * scale);
      c.fillStyle = rgba(WHT, 0.5);
      c.fillRect(-3 * scale, -14 * scale, 6 * scale, 8 * scale);
    }
    if (e.maxHp > 1) {
      const w = 18;
      const p = e.hp / e.maxHp;
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(-w * 0.5 * scale, 12 * scale, w * scale, 3 * scale);
      c.fillStyle = rgba(p < 0.4 ? MAG : GOLD, 0.9);
      c.fillRect(-w * 0.5 * scale, 12 * scale, w * p * scale, 3 * scale);
    }
    c.restore();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b) return;
    const rgb = b.hitFlash > 0 ? WHT : (G.stage === 2 ? MAG : G.stage === 1 ? CYN : BEE);
    const c = ctx;
    c.save();
    c.translate(sx(b.x), sy(b.y));
    c.fillStyle = rgba(rgb, 0.2);
    c.beginPath();
    c.ellipse(0, 0, 46 * scale, 32 * scale, 0, 0, TAU);
    c.fill();
    const wf = 0.75 + 0.25 * Math.sin(G.t * 18);
    c.fillStyle = 'rgba(232,255,248,0.45)';
    c.beginPath();
    c.ellipse(-34 * scale, 0, 22 * scale, 12 * wf * scale, -0.2, 0, TAU);
    c.ellipse(34 * scale, 0, 22 * scale, 12 * wf * scale, 0.2, 0, TAU);
    c.fill();
    c.fillStyle = rgba(rgb, 1);
    c.beginPath();
    c.ellipse(0, 4 * scale, 28 * scale, 22 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#1a1404';
    c.fillRect(-20 * scale, 0, 40 * scale, 6 * scale);
    c.fillStyle = rgba(WHT, 0.95);
    c.beginPath();
    c.arc(-8 * scale, -6 * scale, 4 * scale, 0, TAU);
    c.arc(8 * scale, -6 * scale, 4 * scale, 0, TAU);
    c.fill();
    if (G.stage === 0) {
      c.fillStyle = rgba(MAG, 0.9);
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(i * 8 * scale, -18 * scale);
        c.lineTo(i * 8 * scale, -28 * scale);
        c.lineTo((i * 8 + 4) * scale, -20 * scale);
        c.closePath();
        c.fill();
      }
    }
    c.restore();
    const p = b.hp / b.maxHp;
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillRect(sx(b.x - 36), sy(b.y + 30), 72 * scale, 5 * scale);
    c.fillStyle = rgba(p < 0.35 ? MAG : GOLD, 0.95);
    c.fillRect(sx(b.x - 36), sy(b.y + 30), 72 * p * scale, 5 * scale);
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;

    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      c.fillStyle = rgba(t.rgb, 0.35 * (1 - t.t / 0.22));
      c.beginPath();
      c.arc(sx(t.x), sy(t.y), (3 + t.t * 10) * scale, 0, TAU);
      c.fill();
    }

    if (G.barrier) {
      const pulse = 0.55 + 0.45 * Math.sin(G.t * 10);
      c.save();
      c.strokeStyle = rgba(WHT, 0.55 * pulse);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.ellipse(sx(x), sy(y), 20 * scale, 16 * scale, G.t * 1.4, 0, TAU);
      c.stroke();
      c.strokeStyle = rgba(CYN, 0.4 * pulse);
      c.beginPath();
      c.ellipse(sx(x), sy(y), 16 * scale, 20 * scale, -G.t, 0, TAU);
      c.stroke();
      c.restore();
    }

    c.save();
    c.globalAlpha = 0.28 + G.powT * 0.5;
    c.fillStyle = rgba(G.double ? CYN : BEE, 1);
    c.beginPath();
    c.ellipse(sx(x), sy(y), 16 * scale, 11 * scale, 0, 0, TAU);
    c.fill();
    c.restore();

    c.save();
    c.translate(sx(x), sy(y));
    c.fillStyle = rgba(CYN, 0.95);
    if (G.double) {
      c.fillRect(-11 * scale, -18 * scale, 4 * scale, 10 * scale);
      c.fillRect(7 * scale, -18 * scale, 4 * scale, 10 * scale);
    } else {
      c.fillRect(-2 * scale, -18 * scale, 4 * scale, 10 * scale);
    }
    c.restore();

    drawBeeBody(x, y, G.powT > 0 ? WHT : BEE, 1.15, 0);

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, G.muzzle * 10);
      if (G.double) {
        c.beginPath();
        c.arc(sx(x - 9), sy(y - 20), 5 * scale, 0, TAU);
        c.fill();
        c.beginPath();
        c.arc(sx(x + 9), sy(y - 20), 5 * scale, 0, TAU);
        c.fill();
      } else {
        c.beginPath();
        c.arc(sx(x), sy(y - 20), 5 * scale, 0, TAU);
        c.fill();
      }
      c.restore();
    }

    if (G.mode === 'play') {
      const sy0 = sightY();
      c.save();
      c.strokeStyle = rgba(GOLD, 0.55 + 0.25 * Math.sin(G.t * 8));
      c.lineWidth = Math.max(1, 1.2 * scale);
      c.beginPath();
      c.moveTo(sx(x - 8), sy(sy0));
      c.lineTo(sx(x + 8), sy(sy0));
      c.moveTo(sx(x), sy(sy0 - 8));
      c.lineTo(sx(x), sy(sy0 + 8));
      c.stroke();
      c.strokeRect(sx(x - 7), sy(sy0 - 7), 14 * scale, 14 * scale);
      c.restore();
    }
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!REDUCE) {
        c.fillStyle = rgba(BEE, 0.25);
        c.fillRect(sx(s.x - 1.4), sy(s.y), 2.8 * scale, 14 * scale);
      }
      c.fillStyle = rgba(WHT, 0.95);
      c.fillRect(sx(s.x - 1.6), sy(s.y - 8), 3.2 * scale, 14 * scale);
      c.fillStyle = rgba(CYN, 0.85);
      c.fillRect(sx(s.x - 2.2), sy(s.y - 6), 4.4 * scale, 8 * scale);
    }
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), 4 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(ORG, 0.8);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), 2 * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      c.fillStyle = rgba(s.fat ? MAG : PNK, 0.95);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      if (s.fat) {
        c.fillStyle = rgba(GOLD, 0.55);
        c.beginPath();
        c.arc(sx(s.x), sy(s.y), s.r * 0.4 * scale, 0, TAU);
        c.fill();
      }
    }
    c.restore();
  }

  function drawFx() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / 0.4, 0, 1);
      c.fillStyle = rgba(q.rgb, a);
      c.beginPath();
      c.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.36;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (6 + s.t * 40) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.36;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    c.font = '700 ' + (12 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = '#100e04';
    c.fillRect(0, 0, W, H);

    c.save();
    if (G.shake > 0 && !REDUCE) {
      c.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    if (!REDUCE && G.punch !== 1) {
      c.translate(W * 0.5, H * 0.5);
      c.scale(G.punch, G.punch);
      c.translate(-W * 0.5, -H * 0.5);
    }

    drawTerrain();
    for (let i = 0; i < G.ground.length; i++) drawGroundEnt(G.ground[i]);
    for (let i = 0; i < G.clouds.length; i++) drawCloud(G.clouds[i]);
    for (let i = 0; i < G.air.length; i++) {
      if (!G.air[i].dead) drawAirEnt(G.air[i]);
    }
    drawBoss();
    for (let i = 0; i < G.bells.length; i++) drawBell(G.bells[i]);
    drawShots();
    drawShip();
    drawFx();
    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    c.restore();

    c.fillStyle = '#100e04';
    if (oy > 0) {
      c.fillRect(0, 0, W, oy);
      c.fillRect(0, oy + VH * scale, W, H);
    }
    if (ox > 0) {
      c.fillRect(0, 0, ox, H);
      c.fillRect(ox + VW * scale, 0, W, H);
    }
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
    return (e.clientX - r.left - ox) / scale;
  }
  function pointerWorldY(e) {
    const r = canvas.getBoundingClientRect();
    return (e.clientY - r.top - oy) / scale;
  }

  function setBombHeld(on) {
    G.padBomb = on;
    if (btnBomb) btnBomb.classList.toggle('held', on);
    if (btnPad) btnPad.classList.toggle('held', on);
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('patrol');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'c' || k === 'C') {
      keys.bomb = down;
      setBombHeld(down);
      if (down) {
        e.preventDefault();
        audio.ensure();
        if (G.mode === 'play') fireBomb();
      }
      return;
    }
    if (space || k === 'ArrowUp' || k === 'ArrowDown') {
      if (down) e.preventDefault();
    }
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
      return;
    }
    if (k === '1' && overlayOpen() && G.mode === 'title') {
      startGame('patrol');
      return;
    }
    if (k === '2' && overlayOpen() && G.mode === 'title') {
      startGame('frenzy');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') {
        keys.fire = true;
        fireAir();
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
      pointer.x = clamp(pointerWorldX(e), 22, VW - 22);
      pointer.y = clamp(pointerWorldY(e), 70, VH - 36);
      inputSrc = 'ptr';
      keys.fire = true;
      if (G.mode === 'title') {
        startGame('patrol');
        return;
      }
      if (G.mode === 'lose' || G.mode === 'win') {
        startGame(G.kind);
        return;
      }
      if (G.mode === 'play') fireAir();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 22, VW - 22);
      pointer.y = clamp(pointerWorldY(e), 70, VH - 36);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      keys.fire = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) keys.fire = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function bindBombBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      setBombHeld(true);
      if (G.mode === 'play') fireBomb();
    });
    function up() { setBombHeld(false); }
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

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindBombBtn(btnBomb);
  bindBombBtn(btnPad);

  if (btnPatrol) {
    btnPatrol.addEventListener('click', function () {
      audio.ensure();
      startGame('patrol');
    });
  }
  if (btnFrenzy) {
    btnFrenzy.addEventListener('click', function () {
      audio.ensure();
      startGame('frenzy');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'patrol');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
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
      keys.fire = false;
      keys.bomb = false;
      setBombHeld(false);
    }
  });

  requestAnimationFrame(frame);
})();
