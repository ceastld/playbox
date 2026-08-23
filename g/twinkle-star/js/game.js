'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const HIT_R = 5;
  const SHOT_V = 720;
  const NEED = 2;
  const BOMB_CAP = 3;
  const BEST_KEY = 'playbox-twinkle-star-best';
  const MUTE_KEY = 'playbox-twinkle-star-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 星闪 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const PNK = [255, 122, 217];
  const VIO = [196, 77, 255];
  const WHT = [255, 232, 248];
  const RED = [255, 86, 110];

  const SCORE = {
    twinkle: 50,
    dart: 60,
    diamond: 80,
    twin: 120,
    reflect: 80,
    round: 1500,
    duel: 3000,
    boss: 8000,
    chip: 12
  };

  const RIVALS = [
    { name: '闪灵', spd: 196, reflect: 0.32, fire: 0.11, bombUse: 0.38, dodge: 0.9, aim: 0.55, rgb: CYN },
    { name: '流星', spd: 228, reflect: 0.55, fire: 0.088, bombUse: 0.62, dodge: 0.94, aim: 0.7, rgb: [80, 210, 255] },
    { name: '暗闪', spd: 252, reflect: 0.74, fire: 0.076, bombUse: 0.86, dodge: 0.97, aim: 0.82, rgb: VIO }
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
  const btnDuel = document.getElementById('btn-duel');
  const btnChaos = document.getElementById('btn-chaos');
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
  const roundLabel = document.getElementById('round-label');
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
  let bombTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'duel',
    phase: 'duel',
    t: 0,
    duel: 0,
    wins: 0,
    losses: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    enemies: [],
    shots: [],
    bombs: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0, muzzle: 0, flash: 0 },
    rival: { x: VW * 0.5, y: 78, vx: 0, vy: 0, muzzle: 0, flash: 0, fireCd: 0, bombCd: 0, bombs: 2, think: 0, tx: VW * 0.5, want: 'wander' },
    boss: null,
    bombsLeft: 2,
    bombCd: 0,
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    rInvuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    scroll: 0,
    roundT: 0,
    winT: 0,
    spawnT: 0,
    ended: false
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
  function isChaos() {
    return G.kind === 'chaos';
  }
  function dens() {
    return isChaos() ? 1.28 : 1;
  }
  function shipSpeed() {
    return isChaos() ? 318 : 276;
  }
  function fireRate() {
    return isChaos() ? 0.078 : 0.092;
  }
  function rivalSpec() {
    return RIVALS[Math.min(G.duel, RIVALS.length - 1)];
  }
  function inBoss() {
    return G.phase === 'boss';
  }
  function bombR(lv) {
    return 7 + lv * 6.4;
  }
  function bombSpd(lv) {
    return 176 - lv * 11;
  }
  function bombDmg(lv) {
    return 6 * lv;
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
      this.beep(920, 0.042, 'square', 0.026, 1680);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.03, 0.028, 1400);
      this.beep(680 * lift, 0.055, 'square', 0.034, 1040 * lift);
    },
    reflect(lv) {
      this.ensure();
      const k = 1 + lv * 0.12;
      this.beep(520 * k, 0.07, 'sine', 0.04, 880 * k);
      this.beep(880 * k, 0.1, 'triangle', 0.032, 1480 * k);
      this.noise(0.05, 0.03, 700);
    },
    bomb() {
      this.ensure();
      this.noise(0.14, 0.05, 380);
      this.beep(220, 0.16, 'sawtooth', 0.048, 70);
      this.beep(980, 0.18, 'triangle', 0.036, 1760);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 500);
      this.beep(280, 0.14, 'sawtooth', 0.045, 70);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 400);
      this.beep(320, 0.16, 'sawtooth', 0.05, 90);
      this.beep(180, 0.28, 'sine', 0.045, 50);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.055, 'sawtooth', 0.036, 180);
      this.beep(620, 0.07, 'square', 0.028, 880);
    },
    bossDie() {
      this.ensure();
      this.noise(0.22, 0.06, 280);
      this.beep(180, 0.28, 'sawtooth', 0.05, 50);
      this.beep(520, 0.2, 'triangle', 0.04, 220);
      this.beep(1040, 0.32, 'sine', 0.04, 1560);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
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
    while (G.score >= G.next1up) {
      G.next1up += LIFE_EVERY;
      if (inBoss() && G.lives < LIFE_CAP) {
        G.lives += 1;
        audio.extra();
        toast('1UP', false, true);
        syncPips();
      } else if (!inBoss() && G.bombsLeft < BOMB_CAP) {
        G.bombsLeft += 1;
        audio.extra();
        toast('闪 +1', false, true);
      } else {
        audio.extra();
      }
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.055);
      kick(3.2);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    }
    if (G.combo % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 28, G.combo + ' 链', GOLD, true);
      hitStop(0.046);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function toast(text, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
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
    const n = inBoss() ? LIFE_CAP : NEED;
    const on = inBoss() ? G.lives : G.wins;
    const shown = inBoss() ? Math.max(LIVES, G.lives) : NEED;
    while (pips.length < LIFE_CAP) {
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < LIFE_CAP; i++) {
      pips[i].classList.toggle('on', i < on);
      pips[i].classList.toggle('gone', inBoss() && G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < shown ? '' : 'none';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '星闪';
      else if (inBoss()) stageLabel.textContent = '星核';
      else stageLabel.textContent = rivalSpec().name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.duel >= 2 || inBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isChaos() ? '乱核' : '星闪';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || isChaos() || (inBoss() && G.lives === 1));
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (roundLabel) {
      if (G.mode === 'title') roundLabel.textContent = '对飞';
      else if (inBoss()) roundLabel.textContent = G.boss ? '核 ' + Math.max(0, G.boss.hp) : '星核';
      else roundLabel.textContent = '局 ' + G.wins + '-' + G.losses;
    }
    if (bombLabel) {
      bombLabel.textContent = '闪 ×' + G.bombsLeft;
      bombLabel.classList.toggle('hot', G.bombsLeft <= 0);
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
    else if (G.mode === 'lose') setHint('R 重开 · 把核弹打回去', 'warn');
    else if (G.mode === 'win') setHint('星核已碎 · R 再来', 'hot');
    else if (inBoss() && G.lives === 1) setHint('最后一命 · 打回大核', 'warn');
    else if (G.combo >= 6) setHint('连击在窜 · 把核打大', 'hot');
    else setHint('空格射击 · 打回核弹 · Shift 星闪 · 相撞丢局', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'TWIN';
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

  function kick(mag, cls) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.5 ? 'bomb' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('bomb');
    stageEl.classList.remove('boss');
    void stageEl.offsetWidth;
    stageEl.classList.add(name);
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
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 140,
        life: rand(0.22, 0.5),
        r: rand(1.2, 2.8),
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

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      t: 0,
      life: gold ? 0.9 : 0.65,
      vy: gold ? -70 : -48,
      text: text,
      rgb: rgb,
      gold: !!gold
    });
    capArr(floats, 18);
  }

  function explode(x, y, rgb, power) {
    const p = power || 16;
    burst(x, y, rgb, Math.min(28, 8 + (p * 0.45) | 0), 80 + p * 4);
    spark(x, y, rgb);
    ring(x, y, rgb);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.16, 0.7),
        z: rand(0.35, 1.2),
        tw: Math.random() * TAU
      });
    }
  }

  function spawnShot(from, x, y, vx, vy) {
    G.shots.push({
      from: from,
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: 3.1,
      life: 1.2
    });
    capArr(G.shots, 90);
  }

  function firePlayer() {
    const s = G.ship;
    spawnShot('p', s.x, s.y - 12, 0, -SHOT_V);
    spawnShot('p', s.x - 8, s.y - 8, -46, -SHOT_V * 0.96);
    spawnShot('p', s.x + 8, s.y - 8, 46, -SHOT_V * 0.96);
    s.muzzle = 0.08;
    audio.shoot();
  }

  function fireRival() {
    const r = G.rival;
    const aim = inBoss() && G.boss ? 0 : 0.22;
    let vx = 0;
    if (aim && Math.random() < rivalSpec().aim) {
      vx = clamp((G.ship.x - r.x) * 0.35, -90, 90);
    }
    spawnShot('r', r.x, r.y + 12, vx, SHOT_V * 0.9);
    spawnShot('r', r.x - 7, r.y + 8, vx - 40, SHOT_V * 0.86);
    spawnShot('r', r.x + 7, r.y + 8, vx + 40, SHOT_V * 0.86);
    r.muzzle = 0.08;
  }

  function spawnBomb(x, y, from, lv) {
    let n = 0;
    for (let i = 0; i < G.bombs.length; i++) {
      if (G.bombs[i].alive && G.bombs[i].from === from) n += 1;
    }
    if (n >= 6) return;
    const v = bombSpd(lv);
    const dir = from === 'p' ? -1 : 1;
    const grade = clamp(lv, 1, 5);
    G.bombs.push({
      x: x,
      y: y,
      vx: rand(-36, 36),
      vy: dir * v,
      from: from,
      lv: grade,
      r: bombR(grade),
      t: 0,
      flash: 0.12,
      home: grade <= 1 ? 0 : 0.16 + grade * 0.07,
      alive: true
    });
    capArr(G.bombs, 22);
  }

  function spawnEnemy(kind, x, y) {
    let hp = 1;
    let r = 10;
    let score = SCORE.twinkle;
    let vy = 70 * dens();
    if (kind === 'diamond') {
      hp = 2;
      r = 13;
      score = SCORE.diamond;
      vy = 48 * dens();
    } else if (kind === 'dart') {
      hp = 1;
      r = 9;
      score = SCORE.dart;
      vy = 130 * dens();
    } else if (kind === 'twin') {
      hp = 3;
      r = 14;
      score = SCORE.twin;
      vy = 56 * dens();
    }
    G.enemies.push({
      alive: true,
      kind: kind,
      x: x,
      y: y == null ? -18 : y,
      vx: 0,
      vy: vy,
      hp: hp,
      maxHp: hp,
      r: r,
      t: 0,
      phase: rand(0, TAU),
      baseX: x,
      amp: rand(28, 64),
      flash: 0,
      score: score
    });
    capArr(G.enemies, 24);
  }

  function killEnemy(e, by) {
    e.alive = false;
    const rgb = e.kind === 'twin' ? GOLD : e.kind === 'diamond' ? VIO : PNK;
    explode(e.x, e.y, rgb, 12 + e.maxHp * 4);
    audio.explode();
    if (by === 'p') {
      bumpCombo();
      addScore(Math.round(e.score * G.mult));
      hitStop(0.034);
      kick(2.2);
      floatText(e.x, e.y, '+' + Math.round(e.score * G.mult), rgb, false);
    }
    let lv = 1;
    if (by === 'p' && G.combo >= 6) lv = 2;
    if (by === 'p' && G.combo >= 9) lv = 3;
    if (e.kind === 'twin') lv = Math.max(lv, 2);
    spawnBomb(e.x, e.y, by, lv);
  }

  function hurtEnemy(e, by) {
    e.hp -= 1;
    e.flash = 0.08;
    if (by === 'p') {
      audio.hit(G.combo);
      spark(e.x, e.y, MAG);
      hitStop(0.03);
    }
    if (e.hp <= 0) killEnemy(e, by);
  }

  function reflectBomb(b, from) {
    b.from = from;
    b.lv = Math.min(5, b.lv + 1);
    b.r = bombR(b.lv);
    const dir = from === 'p' ? -1 : 1;
    b.vy = dir * bombSpd(b.lv);
    b.vx *= 0.35;
    b.home = b.lv <= 1 ? 0.08 : 0.22 + b.lv * 0.08;
    b.flash = 0.2;
    b.t = 0;
    const rgb = from === 'p' ? MAG : CYN;
    explode(b.x, b.y, rgb, 10 + b.lv * 5);
    if (from === 'p') {
      bumpCombo();
      addScore(Math.round(SCORE.reflect * b.lv * G.mult));
      audio.reflect(b.lv);
      hitStop(0.032 + b.lv * 0.008);
      kick(2.2 + b.lv * 0.55);
      const label = b.lv >= 5 ? '超核' : '返 ×' + b.lv;
      floatText(b.x, b.y - 14, label, b.lv >= 3 ? GOLD : MAG, b.lv >= 3);
      if (b.lv >= 5) {
        toast('超核', false, true);
        screenFlash(GOLD, 0.28);
      } else if (b.lv >= 3) toast('大核', false, true);
    }
  }

  function popBomb(b, rgb) {
    b.alive = false;
    explode(b.x, b.y, rgb || (b.from === 'p' ? MAG : CYN), 10 + b.lv * 6);
  }

  function useBomb(who) {
    if (G.mode !== 'play' || G.roundT > 0) return;
    if (who === 'p') {
      if (G.bombsLeft <= 0 || G.bombCd > 0 || G.deadT > 0) {
        if (G.bombsLeft <= 0) toast('没有星闪', true, false);
        return;
      }
      G.bombsLeft -= 1;
      G.bombCd = 0.55;
      G.invuln = Math.max(G.invuln, 0.38);
      const s = G.ship;
      spawnBomb(s.x, s.y - 28, 'p', 3);
      reflectNear(s.x, s.y, 108, 'p');
      burst(s.x, s.y, MAG, 22, 220);
      ring(s.x, s.y, GOLD);
      screenFlash(MAG, 0.32);
      hitStop(0.068);
      kick(5.4, 'bomb');
      audio.bomb();
      floatText(s.x, s.y - 36, '星闪', GOLD, true);
      if (bombLabel) {
        bombLabel.classList.remove('hot');
        void bombLabel.offsetWidth;
        bombLabel.classList.add('hot');
      }
      bombTok += 1;
      syncHud();
    } else {
      const r = G.rival;
      if (r.bombs <= 0 || r.bombCd > 0) return;
      r.bombs -= 1;
      r.bombCd = 0.7;
      G.rInvuln = Math.max(G.rInvuln, 0.32);
      spawnBomb(r.x, r.y + 28, 'r', 3);
      reflectNear(r.x, r.y, 96, 'r');
      burst(r.x, r.y, CYN, 16, 180);
      ring(r.x, r.y, CYN);
      audio.bomb();
    }
  }

  function reflectNear(x, y, rad, from) {
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (!b.alive || b.from === from) continue;
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy < rad * rad) reflectBomb(b, from);
    }
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy < (rad * 0.72) * (rad * 0.72)) {
        e.hp -= 4;
        if (e.hp <= 0) killEnemy(e, from);
        else e.flash = 0.1;
      }
    }
  }

  function crashPlayer() {
    if (G.mode !== 'play' || G.invuln > 0 || G.deadT > 0 || G.roundT > 0 || G.ended) return;
    explode(G.ship.x, G.ship.y, MAG, 28);
    screenFlash(MAG, 0.5);
    hitStop(0.072);
    kick(8, 'die');
    audio.death();
    breakCombo();
    if (inBoss()) {
      G.lives -= 1;
      G.deadT = 0.92;
      G.ship.flash = 0.4;
      syncPips();
    } else {
      G.ended = true;
      G.losses += 1;
      G.roundT = 1.35;
      toast('被撞了', true, false);
      syncHud();
    }
  }

  function crashRival() {
    if (G.mode !== 'play' || G.rInvuln > 0 || G.roundT > 0 || G.ended) return;
    if (inBoss()) return;
    explode(G.rival.x, G.rival.y, CYN, 28);
    screenFlash(CYN, 0.4);
    hitStop(0.06);
    kick(6.2, 'boss');
    audio.explode();
    G.ended = true;
    G.wins += 1;
    addScore(Math.round(SCORE.round * G.mult));
    G.roundT = 1.35;
    toast('这一局你赢', false, true);
    audio.wave();
    syncHud();
  }

  function hurtBoss(n, x, y) {
    const b = G.boss;
    if (!b || !b.alive) return;
    b.hp -= n;
    b.flash = 0.1;
    audio.bossHit();
    spark(x, y, GOLD);
    addScore(Math.round(SCORE.chip * n * 0.35 * G.mult));
    hitStop(0.03);
    if (b.hp <= 0) {
      b.alive = false;
      b.hp = 0;
      explode(b.x, b.y, GOLD, 42);
      ring(b.x, b.y, MAG);
      screenFlash(GOLD, 0.55);
      hitStop(0.08);
      kick(8.5, 'boss');
      audio.bossDie();
      addScore(SCORE.boss);
      for (let i = G.bombs.length - 1; i >= 0; i--) popBomb(G.bombs[i], GOLD);
      G.winT = 1.35;
      toast('星核碎了', false, true);
    }
    syncHud();
  }

  function afterRound() {
    G.ended = false;
    G.roundT = 0;
    if (G.wins >= NEED) {
      addScore(SCORE.duel);
      G.duel += 1;
      G.wins = 0;
      G.losses = 0;
      if (G.duel >= RIVALS.length) {
        startBoss();
        return;
      }
      toast(rivalSpec().name, false, true);
      audio.wave();
      resetArena();
      return;
    }
    if (G.losses >= NEED) {
      goLose();
      return;
    }
    resetArena();
  }

  function resetArena() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bombs.length = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.rival.x = VW * 0.5 + rand(-40, 40);
    G.rival.y = 78;
    G.rival.vx = 0;
    G.rival.vy = 0;
    G.rival.fireCd = 0.4;
    G.rival.bombCd = 0.8;
    G.rival.bombs = 2;
    G.rival.tx = VW * 0.5;
    G.rival.want = 'wander';
    G.bombsLeft = 2;
    G.bombCd = 0;
    G.fireCd = 0;
    G.invuln = 1.15;
    G.rInvuln = 1.15;
    G.deadT = 0;
    G.spawnT = 0.35;
    G.ended = false;
    syncHud();
  }

  function startBoss() {
    G.phase = 'boss';
    G.lives = LIVES;
    G.wins = 0;
    G.losses = 0;
    resetArena();
    const hp = isChaos() ? 114 : 92;
    G.boss = {
      alive: true,
      x: VW * 0.5,
      y: -40,
      hp: hp,
      maxHp: hp,
      r: 36,
      t: 0,
      enter: 1.35,
      fireCd: 0.8,
      spin: 0,
      flash: 0,
      pattern: 0
    };
    G.rival.y = 78;
    toast('星核', false, true);
    audio.wave();
    screenFlash(VIO, 0.28);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const lead = inBoss()
      ? '星核没碎。把核弹打回去再试。分数 ' + G.score + '。'
      : rivalSpec().name + '把你撞下去了。打回核弹，别相撞。分数 ' + G.score + '。';
    showOverlay('lose', '撞碎了', lead);
    setHint('R 重开 · 把核弹打回去', 'warn');
  }

  function goWin() {
    addScore(isChaos() ? 10000 : 8000);
    G.mode = 'win';
    audio.win();
    showOverlay(
      'win',
      isChaos() ? '乱核通关' : '星核尽碎',
      '三场决斗打穿，星核已碎。分数 ' + G.score + (isChaos() ? ' · 乱核' : ' · 星闪') + '。'
    );
    setHint('星核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bombs.length = 0;
    G.boss = null;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'chaos' ? 'chaos' : 'duel';
    G.phase = 'duel';
    G.t = 0;
    G.duel = 0;
    G.wins = 0;
    G.losses = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.next1up = LIFE_EVERY;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.scroll = 0;
    G.roundT = 0;
    G.winT = 0;
    G.ended = false;
    if (scoreEl) scoreEl.textContent = '0';
    resetArena();
    toast(isChaos() ? '乱核' : rivalSpec().name, isChaos(), !isChaos());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'duel';
    G.phase = 'duel';
    G.t = 0;
    G.duel = 0;
    G.wins = 0;
    G.losses = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.ended = false;
    G.roundT = 0;
    G.winT = 0;
    G.deadT = 0;
    G.boss = null;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.rival.x = VW * 0.5;
    G.rival.y = 78;
    G.bombsLeft = 2;
    clearWorld();
    showOverlay('title', '星闪', '对飞一架，把核弹打回去。相撞丢一局。短决斗之后是星核。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('duel');
    else startGame(G.kind || 'duel');
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
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.ship.muzzle > 0) G.ship.muzzle -= dt;
    if (G.ship.flash > 0) G.ship.flash -= dt;
    if (G.rival.muzzle > 0) G.rival.muzzle -= dt;
    if (G.rival.flash > 0) G.rival.flash -= dt;
    G.scroll += 42 * dt;
  }

  function updateWorld(dt) {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += (18 + s.z * 42) * dt;
      s.tw += dt * 3;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = Math.random() * VW;
      }
    }
  }

  function updateShip(dt) {
    const s = G.ship;
    let dx = 0;
    let dy = 0;
    if (keys.l) dx -= 1;
    if (keys.r) dx += 1;
    if (keys.u) dy -= 1;
    if (keys.d) dy += 1;
    if (dx && dy) {
      dx *= 0.707;
      dy *= 0.707;
    }
    const spd = shipSpeed();
    if (inputSrc === 'ptr' && pointer.down) {
      s.x = lerp(s.x, pointer.x, 1 - Math.exp(-dt * 12));
      s.y = lerp(s.y, pointer.y, 1 - Math.exp(-dt * 12));
    } else {
      s.x += dx * spd * dt;
      s.y += dy * spd * dt;
    }
    s.x = clamp(s.x, 22, VW - 22);
    s.y = clamp(s.y, 360, VH - 28);
  }

  function incomingAt(who) {
    let best = null;
    let bestD = 1e9;
    const t = who === 'p' ? G.ship : G.rival;
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (!b.alive || b.from === who) continue;
      const toward = who === 'p' ? b.vy > 0 : b.vy < 0;
      if (!toward) continue;
      const dy = who === 'p' ? b.y - t.y : t.y - b.y;
      if (dy > 30) continue;
      const d = hypot(b.x - t.x, b.y - t.y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    }
    return best;
  }

  function nearestEnemy(x, y, yMin, yMax) {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.y < yMin || e.y > yMax) continue;
      const d = hypot(e.x - x, e.y - y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  function updateRival(dt) {
    const r = G.rival;
    const spec = rivalSpec();
    r.fireCd -= dt;
    r.bombCd -= dt;
    r.think -= dt;
    if (inBoss()) {
      r.x = lerp(r.x, VW * 0.5, 1 - Math.exp(-dt * 3));
      r.y = 78;
      return;
    }
    const threat = incomingAt('r');
    if (r.think <= 0) {
      r.think = rand(0.1, 0.2);
      if (threat) {
        const aligned = Math.abs(threat.x - r.x) < 20 + threat.r;
        const dist = hypot(threat.x - r.x, threat.y - r.y);
        const close = dist < 124 + threat.r;
        if (aligned && dist < 160 && Math.random() < spec.reflect) {
          r.want = 'reflect';
          r.tx = threat.x;
        } else if (Math.random() < spec.dodge) {
          r.want = 'dodge';
          const away = r.x >= threat.x ? 1 : -1;
          r.tx = clamp(r.x + away * (72 + threat.lv * 10), 36, VW - 36);
        } else {
          r.want = 'hold';
        }
        if (threat.lv >= 3 && close && Math.random() < spec.bombUse) useBomb('r');
      } else {
        const e = nearestEnemy(r.x, r.y, 40, 360);
        if (e) {
          r.want = 'hunt';
          r.tx = e.x;
        } else {
          r.want = 'wander';
          r.tx = clamp(VW * 0.5 + Math.sin(G.t * 0.7 + G.duel) * 120 + rand(-36, 36), 40, VW - 40);
        }
      }
    } else if (r.want === 'reflect' && threat) {
      r.tx = threat.x;
    } else if (r.want === 'dodge' && threat) {
      const away = r.x >= threat.x ? 1 : -1;
      r.tx = clamp(r.x + away * (72 + threat.lv * 10), 36, VW - 36);
    } else if (r.want === 'hunt') {
      const e = nearestEnemy(r.x, r.y, 40, 360);
      if (e) r.tx = e.x;
    }
    r.tx = clamp(r.tx, 28, VW - 28);
    const spd = spec.spd * (isChaos() ? 1.12 : 1);
    const ax = r.tx - r.x;
    const step = clamp(Math.abs(ax) < 2 ? 0 : ax > 0 ? 1 : -1, -1, 1);
    r.x += step * spd * dt;
    r.x = clamp(r.x, 22, VW - 22);
    r.y = clamp(lerp(r.y, 78 + Math.sin(G.t * 1.4) * 10, 1 - Math.exp(-dt * 4)), 28, 280);
    const aligned = Math.abs(r.tx - r.x) < 28;
    const shouldFire = r.want === 'reflect' || r.want === 'hunt' || (r.want === 'wander' && aligned);
    if (r.fireCd <= 0 && shouldFire) {
      fireRival();
      r.fireCd = spec.fire * (isChaos() ? 0.82 : 1);
    }
  }

  function updateFire(dt) {
    if (G.deadT > 0) return;
    G.fireCd -= dt;
    G.bombCd -= dt;
    const hold = keys.sht || (inputSrc === 'ptr' && pointer.down);
    if (hold && G.fireCd <= 0 && !overlayOpen()) {
      firePlayer();
      G.fireCd = fireRate();
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y < -20 || s.y > VH + 20 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.bombs.length; j++) {
        const b = G.bombs[j];
        if (!b.alive) continue;
        const dx = b.x - s.x;
        const dy = b.y - s.y;
        const rr = b.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          if (s.from !== b.from) reflectBomb(b, s.from);
          else {
            b.vy += s.from === 'p' ? -28 : 28;
            b.vx += s.vx * 0.04;
            spark(s.x, s.y, s.from === 'p' ? MAG : CYN);
          }
          hit = true;
          break;
        }
      }
      if (hit) {
        G.shots.splice(i, 1);
        continue;
      }
      if (inBoss() && G.boss && G.boss.alive && s.from === 'p') {
        const b = G.boss;
        const dx = b.x - s.x;
        const dy = b.y - s.y;
        const rr = b.r * 0.72 + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtBoss(1, s.x, s.y);
          G.shots.splice(i, 1);
          continue;
        }
      }
      for (let j = G.enemies.length - 1; j >= 0; j--) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        const rr = e.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnemy(e, s.from);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBombs(dt) {
    const canHurtP = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.roundT <= 0 && !G.ended;
    const canHurtR = G.mode === 'play' && G.rInvuln <= 0 && G.roundT <= 0 && !G.ended && !inBoss();
    for (let i = G.bombs.length - 1; i >= 0; i--) {
      const b = G.bombs[i];
      if (!b.alive) {
        G.bombs.splice(i, 1);
        continue;
      }
      b.t += dt;
      if (b.flash > 0) b.flash -= dt;
      const target = b.from === 'p' ? G.rival : G.ship;
      if (b.t > 0.12) {
        b.vx += (target.x - b.x) * b.home * dt;
        b.vx = clamp(b.vx, -90 - b.lv * 8, 90 + b.lv * 8);
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < 18 || b.x > VW - 18) {
        b.x = clamp(b.x, 18, VW - 18);
        b.vx *= -0.6;
      }
      if (b.y < -50 || b.y > VH + 50) {
        G.bombs.splice(i, 1);
        continue;
      }
      for (let j = i + 1; j < G.bombs.length; j++) {
        const o = G.bombs[j];
        if (!o.alive) continue;
        const dx = o.x - b.x;
        const dy = o.y - b.y;
        const rr = b.r + o.r;
        if (dx * dx + dy * dy < rr * rr * 0.72) {
          if (b.from === o.from) {
            const lv = Math.min(5, Math.max(b.lv, o.lv) + 1);
            b.lv = lv;
            b.r = bombR(lv);
            b.home = 0.28 + lv * 0.08;
            o.alive = false;
            explode(b.x, b.y, b.from === 'p' ? MAG : CYN, 14);
            if (b.from === 'p' && lv >= 3) {
              floatText(b.x, b.y, '合 ×' + lv, GOLD, true);
              audio.combo(G.mult || 1);
            }
          } else if (b.lv === o.lv) {
            popBomb(b, WHT);
            popBomb(o, WHT);
            if (b.from === 'p' || o.from === 'p') bumpCombo();
          } else if (b.lv > o.lv) {
            b.lv = Math.max(1, b.lv - 1);
            b.r = bombR(b.lv);
            popBomb(o, o.from === 'p' ? MAG : CYN);
          } else {
            o.lv = Math.max(1, o.lv - 1);
            o.r = bombR(o.lv);
            popBomb(b, b.from === 'p' ? MAG : CYN);
          }
          break;
        }
      }
      if (!b.alive) {
        G.bombs.splice(i, 1);
        continue;
      }
      if (inBoss() && G.boss && G.boss.alive && b.from === 'p' && b.t > 0.1) {
        const boss = G.boss;
        const dx = boss.x - b.x;
        const dy = boss.y - b.y;
        const rr = boss.r * 0.7 + b.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtBoss(bombDmg(b.lv), b.x, b.y);
          popBomb(b, GOLD);
          kick(3.8);
          G.bombs.splice(i, 1);
          continue;
        }
      }
      if (canHurtP && b.from === 'r' && b.t > 0.16) {
        const dx = G.ship.x - b.x;
        const dy = G.ship.y - b.y;
        const rr = HIT_R + b.r * 0.72;
        if (dx * dx + dy * dy < rr * rr) {
          popBomb(b, MAG);
          crashPlayer();
          G.bombs.splice(i, 1);
          continue;
        }
      }
      if (canHurtR && b.from === 'p' && b.t > 0.16) {
        const dx = G.rival.x - b.x;
        const dy = G.rival.y - b.y;
        const rr = HIT_R + b.r * 0.72;
        if (dx * dx + dy * dy < rr * rr) {
          popBomb(b, CYN);
          crashRival();
          G.bombs.splice(i, 1);
        }
      }
    }
  }

  function updateEnemies(dt) {
    const canHurtP = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.roundT <= 0 && !G.ended;
    const canHurtR = G.mode === 'play' && G.rInvuln <= 0 && G.roundT <= 0 && !G.ended && !inBoss();
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) {
        G.enemies.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.kind === 'dart') {
        if (e.t > 0.25) {
          const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
          e.vx = lerp(e.vx, Math.cos(a) * 160 * dens(), 1 - Math.exp(-dt * 2.4));
          e.vy = lerp(e.vy, Math.sin(a) * 180 * dens(), 1 - Math.exp(-dt * 2.4));
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      } else {
        e.x = e.baseX + Math.sin(e.t * 1.5 + e.phase) * e.amp;
        e.y += e.vy * dt;
        if (e.y > 210 && e.y < 500 && e.vy > 28) e.vy = lerp(e.vy, 22, 1 - Math.exp(-dt * 2));
      }
      if (e.y > VH + 30 || e.x < -40 || e.x > VW + 40) {
        e.alive = false;
        G.enemies.splice(i, 1);
        continue;
      }
      if (canHurtP) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = e.r * 0.7 + HIT_R;
        if (dx * dx + dy * dy < rr * rr) {
          explode(e.x, e.y, PNK, 10);
          e.alive = false;
          crashPlayer();
          G.enemies.splice(i, 1);
          continue;
        }
      }
      if (canHurtR) {
        const dx = e.x - G.rival.x;
        const dy = e.y - G.rival.y;
        const rr = e.r * 0.7 + HIT_R;
        if (dx * dx + dy * dy < rr * rr) {
          explode(e.x, e.y, CYN, 10);
          e.alive = false;
          crashRival();
          G.enemies.splice(i, 1);
        }
      }
    }
  }

  function updateSpawns(dt) {
    if (inBoss()) return;
    G.spawnT -= dt;
    const maxE = isChaos() ? 16 : 10;
    const gap = isChaos() ? 0.54 : 0.82;
    if (G.spawnT > 0 || G.enemies.length >= maxE) return;
    G.spawnT = gap * rand(0.75, 1.15);
    const roll = Math.random();
    const x = rand(50, VW - 50);
    if (roll < 0.12) spawnEnemy('twin', x, -16);
    else if (roll < 0.32) spawnEnemy('diamond', x, -16);
    else if (roll < 0.5) spawnEnemy('dart', x, -10);
    else spawnEnemy('twinkle', x, -14);
    if (isChaos() && Math.random() < 0.45) spawnEnemy('twinkle', clamp(x + rand(-80, 80), 50, VW - 50), -28);
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || !b.alive) return;
    b.t += dt;
    b.fireCd -= dt;
    b.spin += dt * (b.hp / b.maxHp > 0.33 ? 1.5 : 2.6);
    if (b.flash > 0) b.flash -= dt;
    if (b.enter > 0) {
      b.enter -= dt;
      b.y = lerp(b.y, 118, 1 - Math.exp(-dt * 3.2));
      return;
    }
    b.x = VW * 0.5 + Math.sin(b.t * 0.7) * 108;
    b.y = 118 + Math.sin(b.t * 1.15) * 12;
    G.rival.x = b.x;
    G.rival.y = b.y;
    if (G.mode !== 'play' || b.fireCd > 0) return;
    const ratio = b.hp / b.maxHp;
    const chaos = isChaos();
    if (ratio > 0.66) {
      spawnBomb(b.x + rand(-20, 20), b.y + 24, 'r', 1);
      if (Math.random() < 0.4) spawnEnemy('twinkle', b.x + rand(-60, 60), b.y + 30);
      b.fireCd = (chaos ? 0.95 : 1.25);
    } else if (ratio > 0.33) {
      spawnBomb(b.x - 24, b.y + 20, 'r', 2);
      spawnBomb(b.x + 24, b.y + 20, 'r', 1);
      if ((b.pattern++ % 2) === 0) spawnEnemy('diamond', b.x, b.y + 36);
      b.fireCd = (chaos ? 0.72 : 0.95);
    } else {
      spawnBomb(b.x, b.y + 26, 'r', 3);
      spawnBomb(b.x - 40, b.y + 16, 'r', 1);
      spawnBomb(b.x + 40, b.y + 16, 'r', 1);
      if ((b.pattern++ % 3) === 0) {
        spawnEnemy('twin', b.x - 50, b.y + 20);
        spawnEnemy('dart', b.x + 50, b.y + 20);
      }
      b.fireCd = (chaos ? 0.58 : 0.78);
    }
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.invuln = 1.5;
    G.deadT = 0;
    for (let i = G.bombs.length - 1; i >= 0; i--) {
      if (G.bombs[i].from === 'r') G.bombs.splice(i, 1);
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
      G.ship.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.ship.y = VH - 96;
      G.rival.x = VW * 0.5 + Math.sin(G.t * 0.7 + 1.2) * 48;
      G.rival.y = 88;
      if (G.enemies.length < 5 && (G.t * 1.4 | 0) !== ((G.t - dt) * 1.4 | 0) && Math.random() < 0.5) {
        spawnEnemy('twinkle', rand(60, VW - 60), rand(180, 420));
      }
      updateEnemies(dt);
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateWorld(dt * 0.5);
      return;
    }

    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    if (G.roundT > 0) {
      G.roundT -= dt;
      updateWorld(dt);
      if (G.roundT <= 0) afterRound();
      return;
    }

    if (G.winT > 0) {
      G.winT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateBombs(dt);
      updateBoss(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.rInvuln > 0) G.rInvuln -= dt;

    updateShip(dt);
    updateRival(dt);
    updateFire(dt);
    updateShots(dt);
    updateEnemies(dt);
    updateBombs(dt);
    updateSpawns(dt);
    updateBoss(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathStar(c, x, y, r, rot, n) {
    const k = n || 5;
    c.beginPath();
    for (let i = 0; i < k * 2; i++) {
      const a = rot + i * Math.PI / k - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.42;
      const px = sx(x + Math.cos(a) * rad);
      const py = sy(y + Math.sin(a) * rad);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#0c060c';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createLinearGradient(sx(VW * 0.5), sy(0), sx(VW * 0.5), sy(VH));
    g.addColorStop(0, 'rgba(0,232,255,0.08)');
    g.addColorStop(0.46, 'rgba(196,77,255,0.05)');
    g.addColorStop(1, 'rgba(255,61,184,0.1)');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.45 + Math.sin(s.tw) * 0.45;
      c.fillStyle = rgba(i % 5 === 0 ? GOLD : i % 3 === 0 ? CYN : WHT, s.a * tw);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.s * scale, 0, TAU);
      c.fill();
    }

    c.fillStyle = 'rgba(20,6,18,0.55)';
    c.fillRect(sx(0), sy(0), 28 * scale, VH * scale);
    c.fillRect(sx(VW - 28), sy(0), 28 * scale, VH * scale);

    c.strokeStyle = 'rgba(255,61,184,0.18)';
    c.lineWidth = Math.max(1, 1.2 * scale);
    c.beginPath();
    c.moveTo(sx(28), sy(330));
    c.lineTo(sx(VW - 28), sy(330));
    c.stroke();
    c.strokeStyle = 'rgba(0,232,255,0.12)';
    c.beginPath();
    c.moveTo(sx(28), sy(318));
    c.lineTo(sx(VW - 28), sy(318));
    c.stroke();
  }

  function drawCraft(x, y, rgb, dir, muzzle, flash, inv) {
    const c = ctx;
    const blink = inv > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const glow = c.createRadialGradient(sx(x), sy(y), 2 * scale, sx(x), sy(y), 28 * scale);
    glow.addColorStop(0, rgba(rgb, 0.35));
    glow.addColorStop(1, rgba(rgb, 0));
    c.fillStyle = glow;
    c.beginPath();
    c.arc(sx(x), sy(y), 28 * scale, 0, TAU);
    c.fill();

    c.save();
    c.translate(sx(x), sy(y));
    c.scale(scale, scale);
    c.fillStyle = flash > 0 ? '#fff' : rgba(rgb, 1);
    c.beginPath();
    c.moveTo(0, -16 * dir);
    c.lineTo(11, 8 * dir);
    c.lineTo(0, 4 * dir);
    c.lineTo(-11, 8 * dir);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.92);
    c.beginPath();
    c.moveTo(0, -8 * dir);
    c.lineTo(5, 2 * dir);
    c.lineTo(-5, 2 * dir);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.arc(0, -1 * dir, 2.2, 0, TAU);
    c.fill();
    c.fillStyle = rgba(rgb, 0.85);
    c.beginPath();
    c.moveTo(-12, 2 * dir);
    c.lineTo(-18, 10 * dir);
    c.lineTo(-6, 6 * dir);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(12, 2 * dir);
    c.lineTo(18, 10 * dir);
    c.lineTo(6, 6 * dir);
    c.closePath();
    c.fill();
    if (muzzle > 0) {
      c.fillStyle = rgba(WHT, muzzle * 8);
      c.beginPath();
      c.moveTo(-3, -16 * dir);
      c.lineTo(0, -26 * dir);
      c.lineTo(3, -16 * dir);
      c.closePath();
      c.fill();
    }
    const trail = c.createLinearGradient(0, 6 * dir, 0, 22 * dir);
    trail.addColorStop(0, rgba(rgb, 0.55));
    trail.addColorStop(1, rgba(rgb, 0));
    c.fillStyle = trail;
    c.fillRect(-2.2, 6 * dir, 4.4, 16 * dir);
    c.restore();
  }

  function drawEnemies() {
    const c = ctx;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const rgb = e.kind === 'twin' ? GOLD : e.kind === 'diamond' ? VIO : e.kind === 'dart' ? CYN : PNK;
      const col = e.flash > 0 ? WHT : rgb;
      pathStar(c, e.x, e.y, e.r, e.t * (e.kind === 'dart' ? 6 : 2.2), e.kind === 'diamond' ? 4 : 5);
      c.fillStyle = rgba(col, 0.92);
      c.fill();
      c.strokeStyle = rgba(WHT, 0.45);
      c.lineWidth = Math.max(0.7, 0.8 * scale);
      c.stroke();
    }
  }

  function drawBombs() {
    const c = ctx;
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (!b.alive) continue;
      const rgb = b.from === 'p' ? MAG : CYN;
      const col = b.flash > 0 ? WHT : (b.lv >= 5 ? GOLD : b.lv >= 3 ? PNK : rgb);
      const g = c.createRadialGradient(sx(b.x), sy(b.y), 1 * scale, sx(b.x), sy(b.y), b.r * 1.8 * scale);
      g.addColorStop(0, rgba(WHT, 0.85));
      g.addColorStop(0.35, rgba(col, 0.7));
      g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * 1.8 * scale, 0, TAU);
      c.fill();
      pathStar(c, b.x, b.y, b.r, G.t * 2.4 + b.lv, b.lv >= 4 ? 8 : 5);
      c.fillStyle = rgba(col, 0.95);
      c.fill();
      if (b.lv >= 3) {
        c.strokeStyle = rgba(GOLD, 0.7);
        c.lineWidth = Math.max(1, 1.3 * scale);
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), (b.r + 4) * scale, 0, TAU);
        c.stroke();
      }
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const rgb = s.from === 'p' ? MAG : CYN;
      c.strokeStyle = rgba(rgb, 0.9);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      c.beginPath();
      c.moveTo(sx(s.x), sy(s.y));
      c.lineTo(sx(s.x - s.vx * 0.012), sy(s.y - s.vy * 0.012));
      c.stroke();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), 1.6 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || !b.alive) return;
    const c = ctx;
    const rgb = b.flash > 0 ? WHT : VIO;
    const g = c.createRadialGradient(sx(b.x), sy(b.y), 4 * scale, sx(b.x), sy(b.y), 70 * scale);
    g.addColorStop(0, rgba(MAG, 0.45));
    g.addColorStop(1, rgba(VIO, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(sx(b.x), sy(b.y), 70 * scale, 0, TAU);
    c.fill();
    pathStar(c, b.x, b.y, b.r + 6, b.spin, 8);
    c.fillStyle = rgba(rgb, 0.92);
    c.fill();
    pathStar(c, b.x, b.y, b.r * 0.55, -b.spin * 1.4, 5);
    c.fillStyle = rgba(WHT, 0.9);
    c.fill();
    const p = clamp(b.hp / b.maxHp, 0, 1);
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(sx(b.x - 40), sy(b.y - b.r - 14), 80 * scale, 5 * scale);
    c.fillStyle = rgba(p < 0.33 ? MAG : GOLD, 0.95);
    c.fillRect(sx(b.x - 40), sy(b.y - b.r - 14), 80 * p * scale, 5 * scale);
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life * 2.2, 0, 1));
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = 1 - s.t;
      c.strokeStyle = rgba(s.rgb, k);
      c.lineWidth = Math.max(1, 1.6 * scale);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (6 + s.t * 16) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      c.strokeStyle = rgba(r.rgb, 1 - r.t);
      c.lineWidth = Math.max(1.2, 2.2 * (1 - r.t) * scale);
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (10 + r.t * 52) * scale, 0, TAU);
      c.stroke();
    }
    c.font = 'bold ' + Math.max(11, 13 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    c.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = f.t < 0.1 ? f.t / 0.1 : 1 - (f.t / f.life);
      c.fillStyle = rgba(f.rgb, clamp(a, 0, 1));
      if (f.gold) c.shadowColor = rgba(GOLD, 0.7);
      c.shadowBlur = f.gold ? 12 : 0;
      c.fillText(f.text, sx(f.x), sy(f.y));
      c.shadowBlur = 0;
    }
  }

  function drawFlash() {
    if (G.flash <= 0 || REDUCE) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#140814';
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H);
    }
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W, H);
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140814';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m * 1.4, (Math.random() - 0.5) * m * 1.4);
    }
    if (G.punch > 1 && !REDUCE) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }
    drawBg();
    drawEnemies();
    drawBombs();
    drawShots();
    if (inBoss()) drawBoss();
    else drawCraft(G.rival.x, G.rival.y, rivalSpec().rgb, -1, G.rival.muzzle, G.rival.flash, G.rInvuln);
    if (G.deadT <= 0) drawCraft(G.ship.x, G.ship.y, MAG, 1, G.ship.muzzle, G.ship.flash, G.invuln);
    drawFx();
    drawFlash();
    ctx.restore();
    drawLetterbox();
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
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    return (x - ox) / scale;
  }
  function pointerWorldY(e) {
    const r = canvas.getBoundingClientRect();
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return (y - oy) / scale;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('duel');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (space) {
      keys.sht = down;
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R' || k === 'z' || k === 'Z' || k === 'Shift')) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === 'Shift' || k === 'z' || k === 'Z') {
      e.preventDefault();
      audio.ensure();
      if (!overlayOpen()) useBomb('p');
      return;
    }
    if (space) {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      return;
    }
    if (k === 'Enter') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      audio.ensure();
      startGame('duel');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('chaos');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (e.button === 2) return;
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 360, VH - 22);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 360, VH - 22);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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

  if (btnDuel) {
    btnDuel.addEventListener('click', function () {
      audio.ensure();
      startGame('duel');
    });
  }
  if (btnChaos) {
    btnChaos.addEventListener('click', function () {
      audio.ensure();
      startGame('chaos');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'duel');
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
  function bombBtn() {
    audio.ensure();
    if (!overlayOpen()) useBomb('p');
  }
  if (btnBomb) btnBomb.addEventListener('click', bombBtn);
  if (btnPad) btnPad.addEventListener('click', bombBtn);

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
      keys.sht = false;
    }
  });

  requestAnimationFrame(frame);
})();
