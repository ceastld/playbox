'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
  const SIGHT = 72;
  const BOMB_R = 30;
  const BEST_KEY = 'playbox-xevi-run-best';
  const MUTE_KEY = 'playbox-xevi-run-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · C 投弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const LIME = [182, 255, 42];
  const LEAF = [125, 255, 26];
  const WHT = [244, 255, 232];
  const ORG = [255, 168, 48];
  const PNK = [255, 154, 212];
  const RED = [255, 84, 84];
  const DEEP = [7, 12, 4];

  const STAGES = [
    { name: '绿野', boss: '侦察舰', bossHp: 92, seed: 1, len: 2180 },
    { name: '河岸', boss: '巡洋舰', bossHp: 128, seed: 2, len: 2380 },
    { name: '遗迹', boss: '母舰', bossHp: 176, seed: 3, len: 2580 }
  ];
  const BOSS_SCORE = [4000, 7000, 10000];

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
  const btnScout = document.getElementById('btn-scout');
  const btnJungle = document.getElementById('btn-jungle');
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
  const solLabel = document.getElementById('sol-label');
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
    kind: 'scout',
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
    shots: [],
    bombs: [],
    eShots: [],
    ship: { x: VW * 0.5, y: VH * 0.78 },
    fireCd: 0,
    bombCd: 0,
    invuln: 0,
    deadT: 0,
    ready: 0,
    stop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: GOLD,
    muzzle: 0,
    boss: null,
    bossDone: false,
    clearT: 0,
    why: '',
    toastT: 0,
    padBomb: false,
    sols: 0,
    solStage: 0,
    solLock: null,
    solChimeT: 0
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
    return G.kind === 'jungle';
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
  function sightY() {
    return G.ship.y - SIGHT;
  }
  function camSpeed() {
    if (G.boss) return 12;
    return isDense() ? 168 : 118;
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
      this.beep(1080, 0.045, 'square', 0.028, 1880);
    },
    bomb() {
      this.ensure();
      this.beep(240, 0.07, 'sawtooth', 0.04, 80);
      this.noise(0.05, 0.035, 420);
    },
    bombFlash() {
      this.ensure();
      this.noise(0.09, 0.05, 380);
      this.beep(180, 0.12, 'sawtooth', 0.042, 60);
    },
    solChime() {
      this.ensure();
      this.beep(523, 0.09, 'sine', 0.05, 659);
      this.beep(784, 0.14, 'triangle', 0.042, 1046);
      this.beep(1318, 0.22, 'sine', 0.036, 1568);
    },
    solBoom() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.14, 'sine', 0.05, 1175);
      this.beep(1568, 0.22, 'triangle', 0.04, 2093);
      this.noise(0.1, 0.045, 600);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.03);
      this.noise(0.032, 0.03, 1400);
      this.beep(520 * lift, 0.055, 'square', 0.04, 880 * lift);
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
      this.beep(160, 0.05, 'sine', 0.016, 80);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    spark() {
      this.ensure();
      this.beep(1400, 0.03, 'square', 0.018, 420);
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const st = STAGES[G.stage];
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '空袭';
      else if (G.boss) stageLabel.textContent = st.boss;
      else stageLabel.textContent = '第 ' + (G.stage + 1) + ' 关';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (!!G.boss || G.stage >= 2));
    }
    if (tagLabel) {
      let tag = isDense() ? '密林' : '侦察';
      if (G.mode === 'play' && G.solLock) tag = '锁定';
      if (G.mode === 'play' && G.boss) tag = st.boss;
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8 || !!G.solLock);
    }
    if (solLabel) {
      solLabel.textContent = 'SOL ' + G.sols;
      solLabel.classList.toggle('lock', !!G.solLock);
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
    else if (G.mode === 'lose') setHint('R 重开 · 中弹或相撞扣命', 'warn');
    else if (G.mode === 'win') setHint('通关 · R 再来 · 索尔塔给高分', 'hot');
    else if (G.boss) setHint('母舰 · 空格打核心 · C 也能砸', 'hot');
    else if (G.solLock) setHint('索尔塔锁定 · C 投弹拿奖励', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 躲弹并扫准星找塔', 'warn');
    else setHint('空格打空中 · C 投弹打地面 · 准星扫过点亮索尔塔', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'XEVI';
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
    const cls = mag >= 6 ? 'die' : mag >= 3.4 ? 'pow' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('pow');
    stageEl.classList.remove('bomb');
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
    capArr(particles, 180);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 16);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.78, vy: -52, text: text, rgb: rgb, size: 12 });
    capArr(floats, 18);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 48; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.78 ? 0.6 : 1.1,
        a: rand(0.12, 0.45),
        p: rand(0, TAU),
        v: rand(8, 28),
        rgb: Math.random() < 0.25 ? LIME : Math.random() < 0.2 ? CYN : WHT
      });
    }
  }

  function buildSpawns(si, dense) {
    const st = STAGES[si];
    const rng = mulberry(st.seed * 104729 + (dense ? 19 : 5));
    const events = [];
    const dens = dense ? 0.66 : 1;
    const len = st.len;
    const extra = dense ? 1 : 0;

    for (let y = 80; y < len - 220; y += (96 * dens) + rng() * 42) {
      const roll = rng();
      const x = 64 + rng() * 352;
      if (roll < 0.34) events.push({ y: y, kind: 'toroid', n: 3 + extra + (si > 0 ? 1 : 0), x: x });
      else if (roll < 0.56) events.push({ y: y, kind: 'torkan', n: 3 + extra, x: x });
      else if (roll < 0.74) events.push({ y: y, kind: 'zoshi', n: 2 + extra, x: x });
      else if (roll < 0.9) events.push({ y: y, kind: 'jara', n: 2 + extra, x: x });
      else events.push({ y: y, kind: 'bacura', x: 90 + rng() * 300 });
    }
    for (let y = 70; y < len - 200; y += (88 * dens) + rng() * 36) {
      const roll = rng();
      const x = 40 + rng() * 400;
      if (roll < 0.3) events.push({ y: y, kind: 'tank', x: x });
      else if (roll < 0.55) events.push({ y: y, kind: 'turret', x: x });
      else if (roll < 0.78) events.push({ y: y, kind: 'bunker', x: x });
      else events.push({ y: y, kind: 'ruin', x: x });
    }
    const solGap = dense ? 210 : 320;
    for (let y = 140; y < len - 260; y += solGap + rng() * 90) {
      events.push({ y: y, kind: 'sol', x: 50 + rng() * 380 });
      if (dense && rng() < 0.45) {
        events.push({ y: y + 50, kind: 'sol', x: 50 + rng() * 380 });
      }
      if (si === 2 && rng() < 0.5) {
        events.push({ y: y + 80, kind: 'sol', x: 70 + rng() * 340 });
      }
    }
    events.sort(function (a, b) { return a.y - b.y; });
    return events;
  }

  function spawnAir(kind, x, y, extra) {
    const e = {
      kind: kind,
      x: x,
      y: y == null ? -24 : y,
      vx: 0,
      vy: 86,
      hp: 1,
      maxHp: 1,
      phase: rand(0, TAU),
      fireCd: rand(0.45, 1.35),
      r: 12,
      score: 70,
      hitFlash: 0,
      dir: Math.random() < 0.5 ? -1 : 1,
      invuln: false
    };
    if (kind === 'toroid') {
      e.vy = 78;
      e.score = 60;
      e.r = 13;
    } else if (kind === 'torkan') {
      e.vy = 96;
      e.score = 90;
      e.r = 11;
    } else if (kind === 'zoshi') {
      e.vy = 64;
      e.hp = 2;
      e.maxHp = 2;
      e.score = 140;
      e.r = 14;
      e.fireCd = 0.55;
    } else if (kind === 'jara') {
      e.vy = 36;
      e.score = 110;
      e.r = 10;
    } else if (kind === 'bacura') {
      e.vy = 70;
      e.invuln = true;
      e.hp = 99;
      e.maxHp = 99;
      e.score = 0;
      e.r = 16;
      e.fireCd = 99;
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
      y: y == null ? -22 : y,
      vx: 0,
      hp: 1,
      maxHp: 1,
      fireCd: rand(0.7, 1.7),
      r: 14,
      score: 80,
      hitFlash: 0,
      dir: Math.random() < 0.5 ? -1 : 1,
      hidden: false,
      seen: true,
      glow: 0
    };
    if (kind === 'tank') {
      e.hp = 2;
      e.maxHp = 2;
      e.r = 15;
      e.score = 200;
      e.vx = e.dir * 34;
    } else if (kind === 'turret') {
      e.hp = 2;
      e.maxHp = 2;
      e.r = 14;
      e.score = 300;
    } else if (kind === 'bunker') {
      e.hp = 3;
      e.maxHp = 3;
      e.r = 17;
      e.score = 450;
    } else if (kind === 'ruin') {
      e.r = 13;
      e.score = 80;
    } else if (kind === 'sol') {
      e.hp = 1;
      e.maxHp = 1;
      e.r = 16;
      e.score = 2000;
      e.hidden = true;
      e.seen = false;
      e.glow = 0;
    }
    if (isDense() && e.hp > 1 && kind !== 'sol') e.hp += 1;
    e.maxHp = e.hp;
    G.ground.push(e);
  }

  function spawnEvent(ev) {
    const y = -26;
    if (ev.kind === 'toroid') {
      const n = ev.n || 3;
      for (let i = 0; i < n; i++) {
        spawnAir('toroid', ev.x + (i - (n - 1) * 0.5) * 36, y - i * 18);
      }
    } else if (ev.kind === 'torkan') {
      const n = ev.n || 3;
      for (let i = 0; i < n; i++) {
        spawnAir('torkan', 70 + i * (VW - 140) / Math.max(1, n - 1), y - i * 14);
      }
    } else if (ev.kind === 'zoshi') {
      const n = ev.n || 2;
      for (let i = 0; i < n; i++) {
        spawnAir('zoshi', ev.x + (i - (n - 1) * 0.5) * 48, y - i * 16);
      }
    } else if (ev.kind === 'jara') {
      const n = ev.n || 2;
      for (let i = 0; i < n; i++) {
        spawnAir('jara', ev.x + (i - (n - 1) * 0.5) * 40, y - i * 20);
      }
    } else if (ev.kind === 'bacura') {
      spawnAir('bacura', ev.x, y);
    } else if (ev.kind === 'tank' || ev.kind === 'turret' || ev.kind === 'bunker' || ev.kind === 'ruin' || ev.kind === 'sol') {
      spawnGround(ev.kind, ev.x, y);
    }
  }

  function spawnBoss() {
    const st = STAGES[G.stage];
    const hp = (st.bossHp * (isDense() ? 1.24 : 1)) | 0;
    G.boss = {
      x: VW * 0.5,
      y: -80,
      vx: 64,
      hp: hp,
      maxHp: hp,
      fireCd: 1.05,
      phase: 0,
      t: 0,
      r: 42,
      hitFlash: 0,
      open: false,
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
    capArr(G.eShots, 96);
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
    if (G.shots.length >= 4) return;
    G.fireCd = 0.11;
    G.muzzle = 0.055;
    G.shots.push({ x: G.ship.x, y: G.ship.y - 16, vy: -660 });
    capArr(G.shots, 8);
    audio.shoot();
  }

  function fireBomb() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0.55) return;
    if (G.bombCd > 0) return;
    if (G.bombs.length >= 2) return;
    G.bombCd = 0.26;
    const tx = G.ship.x;
    const ty = sightY();
    G.bombs.push({
      x: G.ship.x,
      y: G.ship.y - 8,
      tx: tx,
      ty: ty,
      t: 0,
      life: 0.16
    });
    audio.bomb();
  }

  function scoreKill(base, x, y, rgb) {
    bumpCombo();
    const n = base * G.mult;
    addScore(n);
    floatText(x, y, n >= 1000 ? '' + n : '+' + n, rgb || GOLD);
    audio.hit(G.combo);
    hitStop(0.038);
    kick(2.2);
    burst(x, y, rgb || ORG, 14, 200);
    spark(x, y, rgb || GOLD);
  }

  function damageAir(e) {
    if (e.invuln) {
      audio.spark();
      spark(e.x, e.y, CYN);
      burst(e.x, e.y, WHT, 4, 70);
      return false;
    }
    e.hp -= 1;
    e.hitFlash = 0.08;
    if (e.hp <= 0) {
      scoreKill(e.score, e.x, e.y, e.kind === 'zoshi' ? CYN : LIME);
      ring(e.x, e.y, LIME);
      e.dead = true;
    } else {
      audio.hit(G.combo);
      burst(e.x, e.y, WHT, 5, 80);
    }
    return true;
  }

  function damageGround(e) {
    e.hp -= 1;
    e.hitFlash = 0.1;
    if (e.hp <= 0) {
      if (e.kind === 'sol') {
        G.sols += 1;
        G.solStage += 1;
        bumpCombo();
        const n = e.score * G.mult;
        addScore(n);
        floatText(e.x, e.y, 'SOL +' + n, GOLD);
        toast('索尔塔 +' + n, false, true);
        audio.solBoom();
        burst(e.x, e.y, GOLD, 28, 260);
        burst(e.x, e.y, CYN, 12, 180);
        ring(e.x, e.y, GOLD);
        ring(e.x, e.y, LIME);
        screenFlash(GOLD, 0.55);
        hitStop(0.07);
        kick(5);
        if (stageEl) {
          stageEl.classList.remove('bomb');
          void stageEl.offsetWidth;
          stageEl.classList.add('bomb');
        }
      } else {
        scoreKill(e.score, e.x, e.y, ORG);
        ring(e.x, e.y, ORG);
        burst(e.x, e.y, GOLD, 16, 210);
        hitStop(0.05);
        kick(2.8);
      }
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
    const dmg = b.open ? n * 2 : n;
    b.hp -= dmg;
    b.hitFlash = 0.08;
    audio.bossHit();
    burst(x, y, b.open ? GOLD : ORG, 8, 120);
    hitStop(0.038);
    kick(2);
    if (b.hp <= 0) {
      b.hp = 0;
      scoreKill(BOSS_SCORE[G.stage] || 4000, b.x, b.y, GOLD);
      burst(b.x, b.y, GOLD, 40, 300);
      burst(b.x, b.y, MAG, 18, 220);
      ring(b.x, b.y, GOLD);
      ring(b.x, b.y, MAG);
      screenFlash(GOLD, 0.55);
      hitStop(0.08);
      kick(6);
      audio.explode();
      G.clearT = 1.2;
      G.bossDone = true;
      G.boss = null;
      toast(STAGES[G.stage].name + '肃清', false, true);
    }
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.combo = 0;
    G.mult = 1;
    G.solLock = null;
    G.why = why || '坠机了';
    audio.death();
    burst(G.ship.x, G.ship.y, MAG, 28, 260);
    ring(G.ship.x, G.ship.y, MAG);
    screenFlash(MAG, 0.5);
    hitStop(0.072);
    kick(7);
    syncPips();
  }

  function bombExplode(b) {
    ring(b.tx, b.ty, GOLD);
    burst(b.tx, b.ty, ORG, 18, 190);
    spark(b.tx, b.ty, GOLD);
    kick(2.6);
    hitStop(0.042);
    audio.bombFlash();
    screenFlash(GOLD, 0.28);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    let hitAny = false;
    for (let i = 0; i < G.ground.length; i++) {
      const e = G.ground[i];
      if (e.dead) continue;
      if (hit(b.tx, b.ty, BOMB_R, e.x, e.y, e.r)) {
        if (e.kind === 'sol' && !e.seen) {
          e.seen = true;
          e.glow = 0.5;
        }
        damageGround(e);
        hitAny = true;
      }
    }
    if (G.boss && hit(b.tx, b.ty, 34, G.boss.x, G.boss.y, G.boss.r)) {
      damageBoss(2, b.tx, b.ty);
      hitAny = true;
    }
    if (!hitAny) {
      floatText(b.tx, b.ty, '空', WHT);
      audio.miss();
    }
  }

  function resetField() {
    G.air.length = 0;
    G.ground.length = 0;
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
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.solLock = null;
    G.solChimeT = 0;
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
    G.eShots.length = 0;
    G.solStage = 0;
    G.solLock = null;
    const st = STAGES[si];
    toast((isDense() ? '密林 · ' : '') + st.name, false, si === 0);
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
    addScore(isDense() ? 7000 : 5000);
    G.mode = 'win';
    audio.win();
    screenFlash(GOLD, 0.55);
    kick(3);
    const title = isDense() ? '密林通关' : '空域肃清';
    const lead = STAGES[G.stage].name + '肃清  索尔塔 ' + G.sols + '  本局 ' + G.score + ' · 最高 ' + G.best;
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
    const lead = (why || '坠机了') + '  索尔塔 ' + G.sols + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '坠机了', lead);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'jungle' ? 'jungle' : 'scout';
    G.mode = 'play';
    G.lives = LIVES;
    G.score = 0;
    G.why = '';
    G.clock = 0;
    G.sols = 0;
    G.next1up = LIFE_EVERY;
    resetField();
    setupStage(0);
    hideOverlay();
    audio.start();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'scout';
    G.stage = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    G.sols = 0;
    resetField();
    G.spawns = buildSpawns(0, false);
    G.ready = 0;
    showOverlay('title', '空袭', '空格打飞机，C 投弹打地面。准星扫过会点亮隐藏索尔塔。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('scout');
    else startGame(G.kind || 'scout');
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const spd = 220;
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
        y: G.ship.y + 14,
        t: 0,
        rgb: LIME
      });
      capArr(trails, 16);
    }
  }

  function updateSolLock() {
    G.solLock = null;
    if (G.mode !== 'play' || G.deadT > 0) return;
    const tx = G.ship.x;
    const ty = sightY();
    for (let i = 0; i < G.ground.length; i++) {
      const e = G.ground[i];
      if (e.dead || e.kind !== 'sol') continue;
      if (hit(tx, ty, 18, e.x, e.y, e.r)) {
        if (!e.seen) {
          e.seen = true;
          audio.solChime();
          toast('索尔塔', false, true);
          ring(e.x, e.y, GOLD);
          spark(e.x, e.y, LIME);
          floatText(e.x, e.y - 10, 'SOL', GOLD);
          screenFlash(GOLD, 0.22);
        }
        e.glow = 0.45;
        G.solLock = e;
      }
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
      if (e.kind === 'toroid') {
        e.y += e.vy * dt;
        e.x += Math.sin(G.t * 2.4 + e.phase) * 52 * dt;
      } else if (e.kind === 'torkan') {
        e.y += e.vy * dt;
        e.x += Math.cos(G.t * 3.2 + e.phase) * 130 * dt;
      } else if (e.kind === 'zoshi') {
        if (e.y < 122) e.y += e.vy * dt;
        else {
          e.x += e.dir * 76 * dt;
          if (e.x < 40 || e.x > VW - 40) e.dir *= -1;
        }
      } else if (e.kind === 'jara') {
        e.vy += 150 * dt;
        if (e.vy > 300) e.vy = 300;
        e.y += e.vy * dt;
        e.x += clamp(G.ship.x - e.x, -1, 1) * 54 * dt;
      } else if (e.kind === 'bacura') {
        e.y += e.vy * dt;
        e.x += Math.sin(G.t * 1.6 + e.phase) * 40 * dt;
      }
      e.x = clamp(e.x, 16, VW - 16);
      e.fireCd -= dt;
      const canShoot = G.mode === 'play' && G.deadT <= 0 && e.y > 20 && e.y < VH - 80;
      if (canShoot && e.fireCd <= 0 && !e.invuln) {
        if (e.kind === 'zoshi') {
          aimShot(e.x, e.y + 10, dense ? 230 : 186, 3.6);
          e.fireCd = dense ? 1.0 : 1.3;
        } else if (e.kind === 'torkan' && Math.random() < 0.6) {
          enemyShot(e.x, e.y + 8, 0, dense ? 220 : 176, 3.2, false);
          e.fireCd = dense ? 1.15 : 1.5;
        } else if (e.kind === 'toroid' && Math.random() < 0.32) {
          enemyShot(e.x, e.y + 8, 0, 164, 3, false);
          e.fireCd = 2.05;
        } else if (e.kind === 'jara' && Math.random() < 0.4) {
          aimShot(e.x, e.y + 6, 200, 3);
          e.fireCd = 1.6;
        } else {
          e.fireCd = 0.85;
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
      e.glow = Math.max(0, e.glow - dt);
      e.y += scroll * dt;
      if (e.kind === 'tank') {
        e.x += e.vx * dt;
        if (e.x < 30 || e.x > VW - 30) e.vx *= -1;
      }
      e.fireCd -= dt;
      const canShoot = G.mode === 'play' && G.deadT <= 0 && e.y > 40 && e.y < VH - 60;
      if (canShoot && e.fireCd <= 0 && (e.kind === 'turret' || e.kind === 'bunker')) {
        aimShot(e.x, e.y - 6, dense ? 206 : 164, e.kind === 'bunker' ? 4 : 3.2);
        e.fireCd = (e.kind === 'bunker' ? 1.45 : 1.65) / (dense ? 1.2 : 1);
      }
      if (e.y > VH + 36) G.ground.splice(i, 1);
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b) return;
    b.t += dt;
    b.hitFlash = Math.max(0, b.hitFlash - dt);
    if (b.y < 112) {
      b.y += 88 * dt;
      return;
    }
    const si = G.stage;
    const dense = isDense();
    b.open = Math.sin(b.t * 0.72) > 0.12;
    if (si === 0) {
      b.x += b.vx * dt;
      if (b.x < 86 || b.x > VW - 86) b.vx *= -1;
      b.y = 112 + Math.sin(b.t * 1.4) * 14;
    } else if (si === 1) {
      b.x += b.vx * 1.12 * dt;
      if (b.x < 90 || b.x > VW - 90) b.vx *= -1;
      b.y = 108 + Math.sin(b.t * 0.95) * 22;
    } else {
      b.x = VW * 0.5 + Math.sin(b.t * 1.05) * 142;
      b.y = 116 + Math.cos(b.t * 1.55) * 26;
    }
    b.fireCd -= dt;
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (b.fireCd > 0) return;
    const hpN = b.hp / b.maxHp;
    const angry = hpN < 0.42;
    if (si === 0) {
      for (let k = -1; k <= 1; k++) {
        enemyShot(b.x + k * 18, b.y + 22, k * 68, 176, 3.6, false);
      }
      if (angry || b.open) aimShot(b.x, b.y + 18, 210, 4);
      b.fireCd = (angry ? 0.7 : 1.02) / (dense ? 1.15 : 1);
    } else if (si === 1) {
      for (let k = -2; k <= 2; k++) {
        enemyShot(b.x, b.y + 24, k * 52, 168, 3.4, k === 0);
      }
      if (b.open) {
        enemyShot(b.x - 30, b.y + 10, 0, 200, 4, true);
        enemyShot(b.x + 30, b.y + 10, 0, 200, 4, true);
      }
      b.fireCd = (angry ? 0.76 : 1.08) / (dense ? 1.15 : 1);
    } else {
      const n = angry ? 10 : 8;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + b.t;
        enemyShot(b.x, b.y, Math.cos(a) * 148, Math.sin(a) * 148, 3.5, false);
      }
      if (b.open) aimShot(b.x, b.y + 16, 230, 4.2);
      if (angry && Math.random() < 0.45) {
        spawnAir('toroid', b.x + rand(-44, 44), b.y + 22);
      }
      b.fireCd = (angry ? 0.82 : 1.16) / (dense ? 1.12 : 1);
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
      const ease = u * u;
      b.x = lerp(b.x, b.tx, ease);
      b.y = lerp(b.y, b.ty, ease);
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
      if (G.invuln <= 0 && hit(s.x, s.y, s.r, G.ship.x, G.ship.y, 8)) {
        G.eShots.splice(i, 1);
        killPlayer('中弹了');
      }
    }
  }

  function collideBodies() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    for (let i = 0; i < G.air.length; i++) {
      const e = G.air[i];
      if (e.dead) continue;
      if (hit(e.x, e.y, e.r * 0.72, G.ship.x, G.ship.y, 8)) {
        if (!e.invuln) {
          e.dead = true;
          burst(e.x, e.y, LIME, 10, 140);
        }
        killPlayer(e.invuln ? '撞上屏障' : '相撞了');
        return;
      }
    }
    if (G.boss && hit(G.boss.x, G.boss.y, G.boss.r * 0.68, G.ship.x, G.ship.y, 8)) {
      killPlayer('撞上母舰');
    }
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    G.solChimeT = Math.max(0, G.solChimeT - dt);
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
      s.y += (s.v + scroll * 0.1) * dt;
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
    updateSolLock();
    if (G.mode === 'play' && G.deadT <= 0) {
      if (keys.fire || pointer.down) fireAir();
      if (keys.bomb || G.padBomb) fireBomb();
    }
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      updateBombs(dt);
      return;
    }
    G.cam += camSpeed() * dt;
    updateSpawns();
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
      G.cam += 64 * dt;
      updateSpawns();
      updateAir(dt);
      updateGround(dt);
      if (G.air.length < 3 && Math.random() < 0.018) {
        spawnAir('toroid', 80 + Math.random() * 320, -24);
      }
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      updateAir(dt * 0.3);
      updateGround(dt * 0.4);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      updateAir(dt);
      updateGround(dt);
      updateBoss(dt);
      updateEShots(dt);
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
    const si = G.stage;
    if (si === 1) {
      g.addColorStop(0, '#0a1610');
      g.addColorStop(0.5, '#08140c');
      g.addColorStop(1, '#070c08');
    } else if (si === 2) {
      g.addColorStop(0, '#121408');
      g.addColorStop(0.5, '#0c1006');
      g.addColorStop(1, '#080c04');
    } else {
      g.addColorStop(0, '#12200a');
      g.addColorStop(0.45, '#0c1808');
      g.addColorStop(1, '#070c04');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const TILE = 40;
    const start = Math.floor(G.cam / TILE) - 1;
    const rows = Math.ceil(VH / TILE) + 3;
    for (let r = 0; r < rows; r++) {
      const iy = start + r;
      const y = iy * TILE - G.cam;
      for (let ix = 0; ix < 13; ix++) {
        const h = thash(ix, iy);
        const x = ix * TILE - 20;
        if (si === 1 && h < 0.22) {
          c.fillStyle = 'rgba(18, 70, 78, 0.42)';
          c.fillRect(sx(x), sy(y), TILE * scale, TILE * scale);
        } else if (si === 2 && h > 0.78) {
          c.strokeStyle = rgba(GOLD, 0.16 + (h - 0.78) * 0.5);
          c.lineWidth = Math.max(1, 1.2 * scale);
          c.beginPath();
          c.moveTo(sx(x + 4), sy(y + 4));
          c.lineTo(sx(x + TILE - 4), sy(y + TILE - 4));
          c.stroke();
          if (h > 0.92) {
            c.beginPath();
            c.moveTo(sx(x + 8), sy(y + TILE - 6));
            c.lineTo(sx(x + TILE * 0.5), sy(y + 6));
            c.lineTo(sx(x + TILE - 8), sy(y + TILE - 6));
            c.closePath();
            c.stroke();
          }
        } else if (h < 0.14) {
          c.fillStyle = 'rgba(48, 56, 22, 0.38)';
          c.fillRect(sx(x + 14), sy(y), 8 * scale, TILE * scale);
        } else if (h < 0.22) {
          c.fillStyle = 'rgba(40, 48, 18, 0.3)';
          c.fillRect(sx(x), sy(y + 16), TILE * scale, 7 * scale);
        } else if (h > 0.84) {
          c.fillStyle = 'rgba(22, 52, 14, 0.55)';
          c.beginPath();
          c.arc(sx(x + 18), sy(y + 20), 9 * scale, 0, TAU);
          c.fill();
          c.fillStyle = 'rgba(16, 36, 10, 0.5)';
          c.beginPath();
          c.arc(sx(x + 26), sy(y + 26), 7 * scale, 0, TAU);
          c.fill();
        } else if (h > 0.7) {
          c.fillStyle = 'rgba(28, 64, 16, 0.32)';
          c.fillRect(sx(x + 10), sy(y + 10), 18 * scale, 16 * scale);
        }
      }
    }

    if (si === 1) {
      const ry = ((G.cam * 0.15) % 80);
      c.fillStyle = 'rgba(20, 90, 96, 0.18)';
      for (let k = -1; k < 12; k++) {
        const yy = k * 80 - ry;
        const wx = 180 + Math.sin((G.cam + yy) * 0.012) * 70;
        c.beginPath();
        c.ellipse(sx(wx), sy(yy), 70 * scale, 28 * scale, 0, 0, TAU);
        c.fill();
      }
    }

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)));
      c.fillStyle = rgba(s.rgb, a);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
    }
  }

  function drawSol(e) {
    const c = ctx;
    if (!e.seen && e.glow <= 0) return;
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 10);
    const a = e.seen ? (0.85 + e.glow * pulse) : e.glow * pulse;
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.globalAlpha = clamp(a, 0.15, 1);
    if (e.glow > 0) {
      c.fillStyle = rgba(GOLD, 0.18 * pulse);
      c.beginPath();
      c.arc(0, 0, 22 * scale, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(e.hitFlash > 0 ? WHT : GOLD, 0.95);
    c.beginPath();
    c.moveTo(0, -16 * scale);
    c.lineTo(12 * scale, -4 * scale);
    c.lineTo(8 * scale, 12 * scale);
    c.lineTo(-8 * scale, 12 * scale);
    c.lineTo(-12 * scale, -4 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.9);
    c.fillRect(-3 * scale, -8 * scale, 6 * scale, 10 * scale);
    c.fillStyle = rgba(LIME, 0.85);
    c.fillRect(-6 * scale, 4 * scale, 12 * scale, 4 * scale);
    c.restore();
  }

  function drawGroundEnt(e) {
    if (e.kind === 'sol') {
      drawSol(e);
      return;
    }
    const c = ctx;
    const rgb = e.hitFlash > 0 ? WHT : (e.kind === 'turret' ? MAG : e.kind === 'tank' ? ORG : e.kind === 'bunker' ? CYN : LEAF);
    c.save();
    c.translate(sx(e.x), sy(e.y));
    c.fillStyle = rgba(rgb, 0.95);
    if (e.kind === 'ruin') {
      c.fillRect(-11 * scale, -5 * scale, 22 * scale, 12 * scale);
      c.fillStyle = rgba(GOLD, 0.45);
      c.fillRect(-6 * scale, -10 * scale, 4 * scale, 6 * scale);
      c.fillRect(3 * scale, -8 * scale, 5 * scale, 4 * scale);
    } else if (e.kind === 'tank') {
      c.fillRect(-13 * scale, -6 * scale, 26 * scale, 12 * scale);
      c.fillStyle = rgba(GOLD, 0.9);
      c.fillRect(-2 * scale, -14 * scale, 4 * scale, 10 * scale);
      c.fillStyle = rgba(DEEP, 0.55);
      c.fillRect(-11 * scale, 4 * scale, 6 * scale, 4 * scale);
      c.fillRect(5 * scale, 4 * scale, 6 * scale, 4 * scale);
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
      c.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + 0.2;
        const px = Math.cos(a) * 16 * scale;
        const py = Math.sin(a) * 12 * scale;
        if (k === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.7);
      c.fillRect(-7 * scale, -4 * scale, 14 * scale, 8 * scale);
      c.fillStyle = rgba(WHT, 0.5);
      c.fillRect(-2.5 * scale, -12 * scale, 5 * scale, 8 * scale);
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

  function drawAirEnt(e) {
    const c = ctx;
    const rgb = e.hitFlash > 0 ? WHT : (e.kind === 'zoshi' ? CYN : e.kind === 'torkan' ? MAG : e.kind === 'jara' ? ORG : e.kind === 'bacura' ? GOLD : LIME);
    c.save();
    c.translate(sx(e.x), sy(e.y));
    if (e.kind === 'toroid') {
      c.rotate(e.phase * 3);
      c.strokeStyle = rgba(rgb, 0.95);
      c.lineWidth = 2.4 * scale;
      c.beginPath();
      c.arc(0, 0, 11 * scale, 0, TAU);
      c.stroke();
      c.strokeStyle = rgba(CYN, 0.7);
      c.beginPath();
      c.arc(0, 0, 6 * scale, 0, TAU);
      c.stroke();
    } else if (e.kind === 'torkan') {
      c.rotate(Math.sin(e.phase * 4) * 0.15);
      c.fillStyle = rgba(rgb, 1);
      c.beginPath();
      c.moveTo(0, 12 * scale);
      c.lineTo(8 * scale, -6 * scale);
      c.lineTo(0, -10 * scale);
      c.lineTo(-8 * scale, -6 * scale);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(WHT, 0.8);
      c.fillRect(-1.5 * scale, -4 * scale, 3 * scale, 8 * scale);
    } else if (e.kind === 'zoshi') {
      c.rotate(e.phase * 4);
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.moveTo(0, -13 * scale);
      c.lineTo(10 * scale, 0);
      c.lineTo(0, 13 * scale);
      c.lineTo(-10 * scale, 0);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(MAG, 0.8);
      c.beginPath();
      c.arc(0, 0, 4 * scale, 0, TAU);
      c.fill();
    } else if (e.kind === 'jara') {
      c.fillStyle = rgba(rgb, 1);
      c.beginPath();
      c.moveTo(0, 14 * scale);
      c.lineTo(6 * scale, -8 * scale);
      c.lineTo(-6 * scale, -8 * scale);
      c.closePath();
      c.fill();
    } else {
      c.rotate(e.phase * 2.4);
      c.fillStyle = rgba(GOLD, 0.95);
      c.fillRect(-16 * scale, -3.5 * scale, 32 * scale, 7 * scale);
      c.fillStyle = rgba(MAG, 0.9);
      c.fillRect(-3.5 * scale, -16 * scale, 7 * scale, 32 * scale);
    }
    c.restore();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b) return;
    const rgb = b.hitFlash > 0 ? WHT : (b.open ? GOLD : MAG);
    const c = ctx;
    c.save();
    c.translate(sx(b.x), sy(b.y));
    c.fillStyle = rgba(LIME, 0.12);
    c.beginPath();
    c.ellipse(0, 0, 58 * scale, 38 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = '#101808';
    c.beginPath();
    c.ellipse(0, 2 * scale, 48 * scale, 28 * scale, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(rgb, 0.85);
    c.lineWidth = 2 * scale;
    c.beginPath();
    c.ellipse(0, 2 * scale, 48 * scale, 28 * scale, 0, 0, TAU);
    c.stroke();
    c.strokeStyle = rgba(LIME, 0.45);
    c.beginPath();
    c.ellipse(0, 2 * scale, 32 * scale, 18 * scale, 0, 0, TAU);
    c.stroke();
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * TAU + b.t * 0.4;
      const px = Math.cos(a) * 40 * scale;
      const py = Math.sin(a) * 22 * scale;
      c.fillStyle = rgba(k % 2 ? MAG : CYN, 0.85);
      c.fillRect(px - 5 * scale, py - 3 * scale, 10 * scale, 6 * scale);
    }
    const coreR = b.open ? 11 : 6;
    c.fillStyle = rgba(b.open ? GOLD : MAG, b.open ? 0.95 : 0.45);
    c.beginPath();
    c.arc(0, 2 * scale, coreR * scale, 0, TAU);
    c.fill();
    if (b.open) {
      c.fillStyle = rgba(WHT, 0.8);
      c.beginPath();
      c.arc(0, 2 * scale, 4.5 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
    const p = b.hp / b.maxHp;
    c.fillStyle = 'rgba(0,0,0,0.5)';
    c.fillRect(sx(b.x - 40), sy(b.y + 34), 80 * scale, 5 * scale);
    c.fillStyle = rgba(p < 0.35 ? MAG : GOLD, 0.95);
    c.fillRect(sx(b.x - 40), sy(b.y + 34), 80 * p * scale, 5 * scale);
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
      c.fillStyle = rgba(t.rgb, 0.32 * (1 - t.t / 0.22));
      c.beginPath();
      c.arc(sx(t.x), sy(t.y), (3 + t.t * 10) * scale, 0, TAU);
      c.fill();
    }

    c.save();
    c.globalAlpha = 0.22;
    c.fillStyle = rgba(LIME, 1);
    c.beginPath();
    c.ellipse(sx(x), sy(y), 16 * scale, 11 * scale, 0, 0, TAU);
    c.fill();
    c.restore();

    c.save();
    c.translate(sx(x), sy(y));
    c.fillStyle = rgba(CYN, 0.9);
    c.fillRect(-7 * scale, 8 * scale, 4 * scale, 8 * scale);
    c.fillRect(3 * scale, 8 * scale, 4 * scale, 8 * scale);
    c.fillStyle = rgba(WHT, 0.98);
    c.beginPath();
    c.moveTo(0, -16 * scale);
    c.lineTo(7 * scale, 2 * scale);
    c.lineTo(14 * scale, 6 * scale);
    c.lineTo(4 * scale, 6 * scale);
    c.lineTo(0, 12 * scale);
    c.lineTo(-4 * scale, 6 * scale);
    c.lineTo(-14 * scale, 6 * scale);
    c.lineTo(-7 * scale, 2 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(LIME, 0.95);
    c.beginPath();
    c.moveTo(0, -16 * scale);
    c.lineTo(4 * scale, 2 * scale);
    c.lineTo(-4 * scale, 2 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.9);
    c.fillRect(-2 * scale, -6 * scale, 4 * scale, 6 * scale);
    c.restore();

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, G.muzzle * 12);
      c.beginPath();
      c.arc(sx(x), sy(y - 18), 5 * scale, 0, TAU);
      c.fill();
      c.restore();
    }

    if (G.mode === 'play') {
      const sy0 = sightY();
      const lock = !!G.solLock;
      c.save();
      c.strokeStyle = rgba(lock ? GOLD : LIME, lock ? 0.95 : 0.55 + 0.25 * Math.sin(G.t * 8));
      c.lineWidth = Math.max(1, (lock ? 1.8 : 1.2) * scale);
      c.beginPath();
      c.moveTo(sx(x - 9), sy(sy0));
      c.lineTo(sx(x + 9), sy(sy0));
      c.moveTo(sx(x), sy(sy0 - 9));
      c.lineTo(sx(x), sy(sy0 + 9));
      c.stroke();
      c.strokeRect(sx(x - 8), sy(sy0 - 8), 16 * scale, 16 * scale);
      if (lock) {
        c.strokeStyle = rgba(GOLD, 0.35);
        c.beginPath();
        c.arc(sx(x), sy(sy0), 14 * scale, 0, TAU);
        c.stroke();
      }
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
        c.fillStyle = rgba(LIME, 0.28);
        c.fillRect(sx(s.x - 1.4), sy(s.y), 2.8 * scale, 16 * scale);
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
      c.arc(sx(b.x), sy(b.y), 4.2 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(ORG, 0.85);
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
    c.fillStyle = '#070c04';
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
    for (let i = 0; i < G.air.length; i++) {
      if (!G.air[i].dead) drawAirEnt(G.air[i]);
    }
    drawBoss();
    drawShots();
    drawShip();
    drawFx();
    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    c.restore();

    c.fillStyle = '#070c04';
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
      startGame('scout');
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
      startGame('scout');
      return;
    }
    if (k === '2' && overlayOpen() && G.mode === 'title') {
      startGame('jungle');
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
        startGame('scout');
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

  if (btnScout) {
    btnScout.addEventListener('click', function () {
      audio.ensure();
      startGame('scout');
    });
  }
  if (btnJungle) {
    btnJungle.addEventListener('click', function () {
      audio.ensure();
      startGame('jungle');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'scout');
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
