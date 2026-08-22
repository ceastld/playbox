'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const STORY_WAVES = 5;
  const SHOT_V = 680;
  const ABSORB_R = 18;
  const PULL_R = 36;
  const HIT_R = 5.5;
  const BEST_KEY = 'playbox-ikaruga-best';
  const MUTE_KEY = 'playbox-ikaruga-mute';
  const OPS = '←↑↓→ / WASD 移动 · Z / J 开火 · 空格极性 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const PUR = [122, 107, 255];
  const WHT = [238, 240, 255];
  const PNK = [255, 154, 212];
  const DEEP = [26, 16, 48];
  const ICE = [180, 196, 255];
  const INK = [90, 40, 180];

  const WAVE_NAMES = ['初光', '交叠', '墙幕', '双旋', '潮涌'];
  const SCORE = {
    absorb: 10,
    feed: 20,
    drone: 80,
    weaver: 110,
    turret: 140,
    elite: 220,
    pod: 280,
    boss: 5000,
    chip: 12,
    wave: 500
  };

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
  const btnBliss = document.getElementById('btn-bliss');
  const btnHell = document.getElementById('btn-hell');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnPol = document.getElementById('btn-pol');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const polLabel = document.getElementById('pol-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const meterBar = document.getElementById('meter-bar');
  const meterWrap = document.getElementById('meter-wrap');

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
  let polTok = 0;

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
    kind: 'bliss',
    t: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    enemies: [],
    shots: [],
    bullets: [],
    ship: { x: VW * 0.5, y: VH - 72, vx: 0, vy: 0 },
    pol: 0,
    polCd: 0,
    polFlash: 0,
    meter: 0,
    meterReady: false,
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: PUR,
    punch: 1,
    muzzle: 0,
    laserT: 0,
    waveT: 0,
    spawnQ: [],
    gapT: 0,
    winT: 0,
    trail: 0
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
  function isHell() {
    return G.kind === 'hell';
  }
  function polRgb(pol, bright) {
    if (pol === 0) return bright ? WHT : ICE;
    return bright ? MAG : INK;
  }
  function shipSpeed() {
    return isHell() ? 338 : 292;
  }
  function fireRate() {
    return isHell() ? 0.09 : 0.11;
  }
  function bulletSpd() {
    return isHell() ? 188 : 148;
  }
  function dens() {
    return isHell() ? 1.28 : 1;
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
    shoot(pol) {
      this.ensure();
      if (pol) this.beep(520, 0.05, 'square', 0.028, 980);
      else this.beep(880, 0.05, 'square', 0.03, 1680);
    },
    absorb(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.8, combo * 0.04);
      this.beep(660 * lift, 0.07, 'sine', 0.042, 1320 * lift);
      this.beep(990 * lift, 0.09, 'triangle', 0.028, 1760 * lift);
    },
    feed() {
      this.ensure();
      this.beep(440, 0.05, 'triangle', 0.03, 880);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.035, 0.034, 1200);
      this.beep(620 * lift, 0.07, 'square', 0.042, 980 * lift);
    },
    polar(pol) {
      this.ensure();
      if (pol) {
        this.beep(220, 0.1, 'sawtooth', 0.04, 90);
        this.beep(140, 0.14, 'sine', 0.03, 70);
        this.noise(0.06, 0.03, 400);
      } else {
        this.beep(880, 0.08, 'sine', 0.042, 1760);
        this.beep(1320, 0.12, 'triangle', 0.03, 1980);
      }
    },
    laser() {
      this.ensure();
      this.beep(180, 0.12, 'sawtooth', 0.045, 80);
      this.beep(720, 0.16, 'square', 0.04, 1480);
      this.beep(1440, 0.22, 'sine', 0.038, 2200);
      this.noise(0.14, 0.05, 600);
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
    bossHit() {
      this.ensure();
      this.beep(240, 0.06, 'sawtooth', 0.04, 180);
      this.beep(620, 0.08, 'square', 0.035, 880);
    },
    bossDie() {
      this.ensure();
      this.noise(0.22, 0.06, 280);
      this.beep(180, 0.28, 'sawtooth', 0.05, 50);
      this.beep(520, 0.2, 'triangle', 0.04, 220);
      this.beep(1040, 0.32, 'sine', 0.04, 1560);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 400);
      this.beep(320, 0.16, 'sawtooth', 0.05, 90);
      this.beep(180, 0.28, 'sine', 0.045, 50);
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
    },
    ready() {
      this.ensure();
      this.beep(880, 0.08, 'square', 0.04, 1320);
      this.beep(1760, 0.16, 'sine', 0.04, 2200);
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
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (comboEl) comboEl.hidden = true;
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

  function syncMeter() {
    if (meterBar) meterBar.style.transform = 'scaleX(' + clamp(G.meter, 0, 1) + ')';
    if (meterWrap) meterWrap.classList.toggle('hot', G.meter >= 1);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '光暗';
      else if (G.wave > STORY_WAVES) stageLabel.textContent = '双极核';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 5);
    }
    if (tagLabel) {
      tagLabel.textContent = isHell() ? '无间' : '极乐';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isHell());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.meter >= 1);
    }
    if (polLabel) {
      polLabel.textContent = G.pol ? '暗' : '光';
      polLabel.classList.toggle('light', G.pol === 0);
      polLabel.classList.toggle('dark', G.pol === 1);
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
    else if (G.mode === 'lose') setHint('R 重开 · 同色吞弹，异色即死', 'warn');
    else if (G.mode === 'win') setHint('双极核已碎 · R 再来', 'hot');
    else if (G.meter >= 1) setHint('光刃就绪 · 开火放出追踪刃', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格切极性吞弹', 'warn');
    else setHint('同色吞弹积链 · 异色击破 · 空格切极性', '');
    syncPips();
    syncMeter();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'POLAR';
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
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.5 ? 'polar' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('polar');
    stageEl.classList.remove('laser');
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
        g: 180,
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
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.16, 0.7),
        p: rand(22, 90),
        pol: i % 5 === 0 ? 1 : 0
      });
    }
  }

  function fillMeter(n) {
    const was = G.meter;
    G.meter = clamp(G.meter + n, 0, 1);
    if (was < 1 && G.meter >= 1 && !G.meterReady) {
      G.meterReady = true;
      audio.ready();
      toast('光刃就绪', false, true);
      screenFlash(GOLD, 0.28);
      if (meterWrap) {
        meterWrap.classList.add('hot');
      }
    }
    syncMeter();
  }

  function flipPol() {
    if (G.mode !== 'play' || G.deadT > 0 || G.polCd > 0) return;
    G.pol = 1 - G.pol;
    G.polCd = 0.12;
    G.polFlash = 0.22;
    audio.polar(G.pol);
    const rgb = polRgb(G.pol, true);
    screenFlash(rgb, 0.52);
    ring(G.ship.x, G.ship.y, rgb);
    burst(G.ship.x, G.ship.y, rgb, 16, 160);
    hitStop(0.04);
    kick(2.6, 'polar');
    if (polLabel) {
      polLabel.classList.remove('pop');
      void polLabel.offsetWidth;
      polLabel.classList.add('pop');
      polTok += 1;
    }
    syncHud();
  }

  function spawnEnemy(spec) {
    const e = {
      alive: true,
      kind: spec.kind || 'drone',
      pol: spec.pol || 0,
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 86 * dens() : spec.vy,
      hp: spec.hp || 1,
      maxHp: spec.hp || 1,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.35, 1.1) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 46 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.2,
      flash: 0,
      score: spec.score || SCORE.drone,
      cx: spec.cx || spec.x,
      cy: spec.cy == null ? 80 : spec.cy,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      flipT: spec.flipT || 0,
      pattern: 0,
      spin: 0
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, pol, r) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      pol: pol,
      r: r || 3.4,
      life: 8
    });
    capArr(G.bullets, 220);
  }

  function aimedFire(e, n, spread, spd, pol) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    const p = pol == null ? e.pol : pol;
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, p, 3.2);
    }
  }

  function ringFire(e, n, spd, alt) {
    const s = spd || bulletSpd() * 0.85;
    for (let i = 0; i < n; i++) {
      const a = e.spin + i * (TAU / n);
      const p = alt ? (i % 2) : e.pol;
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, p, 3.4);
    }
  }

  function sprayOnDeath(e) {
    const n = e.kind === 'boss' ? 16 : e.kind === 'elite' ? 6 : 3;
    const s = 70;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand(-0.12, 0.12);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, e.pol, 3.6);
    }
  }

  function nearestEnemy(x, y) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const d = hypot(e.x - x, e.y - y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    if (G.meter >= 1) {
      fireLaser();
      return;
    }
    G.fireCd = fireRate();
    G.muzzle = 0.06;
    const pol = G.pol;
    G.shots.push({ x: G.ship.x - 6, y: G.ship.y - 10, vx: 0, vy: -SHOT_V, pol: pol, r: 3.6, dmg: 1, homing: false });
    G.shots.push({ x: G.ship.x + 6, y: G.ship.y - 10, vx: 0, vy: -SHOT_V, pol: pol, r: 3.6, dmg: 1, homing: false });
    audio.shoot(pol);
  }

  function fireLaser() {
    G.meter = 0;
    G.meterReady = false;
    G.fireCd = 0.28;
    G.laserT = 0.45;
    G.muzzle = 0.12;
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * 0.5 + (i - (n - 1) * 0.5) * 0.16;
      G.shots.push({
        x: G.ship.x,
        y: G.ship.y - 10,
        vx: Math.cos(a) * 420,
        vy: Math.sin(a) * 420,
        pol: G.pol,
        r: 5.2,
        dmg: 4,
        homing: true,
        life: 1.65
      });
    }
    audio.laser();
    hitStop(0.06);
    kick(4.2, 'laser');
    screenFlash(GOLD, 0.42);
    ring(G.ship.x, G.ship.y, GOLD);
    burst(G.ship.x, G.ship.y - 12, polRgb(G.pol, true), 22, 220);
    floatText(G.ship.x, G.ship.y - 28, '光刃', GOLD, true);
    toast('光刃', false, true);
    syncMeter();
  }

  function killEnemy(e, opposite) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = polRgb(e.pol, true);
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 42 : e.kind === 'elite' ? 22 : 14);
    const pts = Math.round(e.score * G.mult);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss');
    if (opposite) sprayOnDeath(e);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(GOLD, 0.7);
      burst(e.x, e.y, MAG, 36, 280);
      burst(e.x, e.y, WHT, 28, 240);
      ring(e.x, e.y, GOLD);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'pod') G.enemies[i].alive = false;
      }
      G.winT = 1.25;
      toast('双极核碎裂', false, true);
    } else if (e.kind === 'elite' || e.kind === 'pod') {
      audio.explode();
      hitStop(0.05);
      kick(3.4);
    } else {
      audio.hit(G.combo);
      hitStop(0.038);
      kick(2.1);
    }
    syncHud();
  }

  function damageEnemy(e, dmg, opposite) {
    if (!e.alive) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.kind === 'boss') {
      addScore(SCORE.chip * G.mult);
      audio.bossHit();
      hitStop(0.04);
      kick(2.8);
    }
    if (e.hp <= 0) killEnemy(e, opposite);
  }

  function absorbBullet(b, i) {
    G.bullets.splice(i, 1);
    const rgb = polRgb(b.pol, true);
    burst(b.x, b.y, rgb, 10, 90);
    spark(G.ship.x, G.ship.y, rgb);
    fillMeter(0.085);
    bumpCombo();
    const pts = SCORE.absorb * G.mult;
    addScore(pts);
    if (G.combo % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 22, G.combo + ' 链', GOLD, true);
      hitStop(0.048);
    } else {
      hitStop(0.032);
    }
    audio.absorb(G.combo);
    kick(1.8);
    syncHud();
  }

  function feedEnemy(e, sx0, sy0) {
    const rgb = polRgb(e.pol, true);
    burst(sx0, sy0, rgb, 8, 70);
    spark(e.x, e.y, rgb);
    fillMeter(0.04);
    bumpCombo();
    addScore(SCORE.feed * G.mult);
    audio.feed();
    hitStop(0.028);
    if (G.combo % 3 === 0) {
      floatText(e.x, e.y - 12, G.combo + ' 链', GOLD, true);
      hitStop(0.045);
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.9;
    G.fireHold = false;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, polRgb(G.pol, true), 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 72;
    G.invuln = 1.45;
    G.deadT = 0;
    G.meter = clamp(G.meter, 0, 0.65);
    G.meterReady = G.meter >= 1;
    if (keys.sht) G.fireHold = true;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '同色吞弹积链，异色击破。分数 ' + G.score + '。');
    setHint('R 重开 · 同色吞弹，异色即死', 'warn');
  }

  function goWin() {
    G.mode = 'win';
    addScore(isHell() ? 10000 : 8000);
    audio.win();
    showOverlay(
      'win',
      '极核肃清',
      '五波打穿，双极核已碎。分数 ' + G.score + (isHell() ? ' · 无间' : ' · 极乐') + '。'
    );
    setHint('双极核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.spawnQ.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function ev(t, fn) {
    return { t: t, fn: fn };
  }

  function buildWave(n) {
    const q = [];
    const hell = isHell();
    const extra = hell ? 1 : 0;
    if (n === 1) {
      for (let i = 0; i < 3 + extra; i++) {
        q.push(ev(0.35 + i * 0.42, (function (i0) {
          return function () {
            spawnEnemy({ kind: 'drone', pol: 1, x: 90 + i0 * 90, vy: 78 * dens(), score: SCORE.drone });
          };
        })(i)));
      }
      for (let i = 0; i < 3 + extra; i++) {
        q.push(ev(2.4 + i * 0.42, (function (i0) {
          return function () {
            spawnEnemy({ kind: 'drone', pol: 0, x: 130 + i0 * 90, vy: 82 * dens(), score: SCORE.drone });
          };
        })(i)));
      }
      q.push(ev(5.2, function () {
        spawnEnemy({ kind: 'weaver', pol: 0, x: 140, vy: 70 * dens(), amp: 70, score: SCORE.weaver, hp: 1 });
        spawnEnemy({ kind: 'weaver', pol: 1, x: 340, vy: 70 * dens(), amp: 70, phase: 1.2, score: SCORE.weaver, hp: 1 });
      }));
      if (hell) {
        q.push(ev(6.6, function () {
          spawnEnemy({ kind: 'drone', pol: 0, x: 200, vy: 100, score: SCORE.drone });
          spawnEnemy({ kind: 'drone', pol: 1, x: 280, vy: 100, score: SCORE.drone });
        }));
      }
    } else if (n === 2) {
      for (let i = 0; i < 6 + extra * 2; i++) {
        q.push(ev(0.2 + i * 0.38, (function (i0) {
          return function () {
            spawnEnemy({
              kind: 'weaver',
              pol: i0 % 2,
              x: 80 + (i0 % 5) * 80,
              vy: 76 * dens(),
              amp: 50 + (i0 % 3) * 12,
              phase: i0 * 0.7,
              score: SCORE.weaver
            });
          };
        })(i)));
      }
      q.push(ev(3.4, function () {
        for (let i = 0; i < 4; i++) {
          spawnEnemy({ kind: 'drone', pol: i % 2, x: 70 + i * 110, vy: 96 * dens(), score: SCORE.drone });
        }
      }));
    } else if (n === 3) {
      q.push(ev(0.2, function () {
        const nTur = 8 + extra * 2;
        for (let i = 0; i < nTur; i++) {
          spawnEnemy({
            kind: 'turret',
            pol: i % 2,
            x: 40 + i * ((VW - 80) / Math.max(1, nTur - 1)),
            y: -18,
            vy: 46 * dens(),
            hp: 2,
            r: 13,
            score: SCORE.turret,
            fireCd: 0.6 + i * 0.08
          });
        }
      }));
      q.push(ev(3.8, function () {
        spawnEnemy({ kind: 'weaver', pol: 0, x: 90, vy: 88 * dens(), amp: 40, score: SCORE.weaver });
        spawnEnemy({ kind: 'weaver', pol: 1, x: 390, vy: 88 * dens(), amp: 40, score: SCORE.weaver });
      }));
    } else if (n === 4) {
      q.push(ev(0.15, function () {
        const nC = 5 + extra;
        for (let i = 0; i < nC; i++) {
          spawnEnemy({
            kind: 'circle',
            pol: 0,
            x: 150,
            cx: 150,
            cy: 40,
            ang: i * (TAU / nC),
            rad: 58,
            omega: 1.6,
            vy: 36 * dens(),
            score: SCORE.weaver,
            hp: 1,
            r: 11
          });
        }
        for (let i = 0; i < nC; i++) {
          spawnEnemy({
            kind: 'circle',
            pol: 1,
            x: 330,
            cx: 330,
            cy: 40,
            ang: i * (TAU / nC) + 0.4,
            rad: 58,
            omega: -1.6,
            vy: 36 * dens(),
            score: SCORE.weaver,
            hp: 1,
            r: 11
          });
        }
      }));
      q.push(ev(4.2, function () {
        spawnEnemy({ kind: 'elite', pol: 0, x: 180, vy: 64 * dens(), hp: hell ? 4 : 3, r: 15, amp: 80, score: SCORE.elite });
        spawnEnemy({ kind: 'elite', pol: 1, x: 300, vy: 64 * dens(), hp: hell ? 4 : 3, r: 15, amp: 80, phase: 2, score: SCORE.elite });
      }));
    } else if (n === 5) {
      for (let i = 0; i < 8 + extra * 2; i++) {
        q.push(ev(0.12 + i * 0.28, (function (i0) {
          return function () {
            spawnEnemy({
              kind: i0 % 3 === 0 ? 'weaver' : 'drone',
              pol: i0 % 2,
              x: 60 + (i0 * 73) % 360,
              vy: (88 + (i0 % 4) * 10) * dens(),
              amp: 60,
              phase: i0,
              score: i0 % 3 === 0 ? SCORE.weaver : SCORE.drone
            });
          };
        })(i)));
      }
      q.push(ev(2.6, function () {
        spawnEnemy({ kind: 'elite', pol: 0, x: 120, vy: 70 * dens(), hp: hell ? 4 : 3, r: 15, amp: 90, score: SCORE.elite });
        spawnEnemy({ kind: 'elite', pol: 1, x: 360, vy: 70 * dens(), hp: hell ? 4 : 3, r: 15, amp: 90, score: SCORE.elite });
      }));
      q.push(ev(4.4, function () {
        for (let i = 0; i < 6; i++) {
          spawnEnemy({
            kind: 'turret',
            pol: i % 2,
            x: 70 + i * 68,
            y: -20,
            vy: 50 * dens(),
            hp: 2,
            r: 13,
            score: SCORE.turret
          });
        }
      }));
    }
    return q;
  }

  function spawnBoss() {
    G.wave = 6;
    G.waveT = 0;
    G.spawnQ = [];
    const hell = isHell();
    const boss = spawnEnemy({
      kind: 'boss',
      pol: 0,
      x: VW * 0.5,
      y: -70,
      vy: 0,
      hp: hell ? 96 : 72,
      r: 34,
      score: SCORE.boss,
      enter: 1.4,
      flipT: 2.8,
      fireCd: 1.1
    });
    boss.maxHp = boss.hp;
    spawnEnemy({
      kind: 'pod',
      pol: 0,
      x: VW * 0.5 + 70,
      y: 40,
      hp: hell ? 14 : 10,
      r: 12,
      score: SCORE.pod,
      ang: 0,
      rad: 78
    });
    spawnEnemy({
      kind: 'pod',
      pol: 1,
      x: VW * 0.5 - 70,
      y: 40,
      hp: hell ? 14 : 10,
      r: 12,
      score: SCORE.pod,
      ang: Math.PI,
      rad: 78
    });
    toast('双极核', false, true);
    audio.wave();
    screenFlash(PUR, 0.35);
    kick(4.5, 'polar');
    syncHud();
    return boss;
  }

  function beginWave(n) {
    G.wave = n;
    G.waveT = 0;
    G.gapT = 0;
    if (n > STORY_WAVES) {
      spawnBoss();
      return;
    }
    G.spawnQ = buildWave(n);
    toast('第 ' + n + ' 波 · ' + WAVE_NAMES[n - 1], false, n >= 5);
    audio.wave();
    syncHud();
  }

  function livingEnemies() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) n += 1;
    return n;
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'hell' ? 'hell' : 'bliss';
    G.t = 0;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.next1up = LIFE_EVERY;
    G.pol = 0;
    G.polCd = 0;
    G.polFlash = 0;
    G.meter = 0;
    G.meterReady = false;
    G.fireHold = false;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.laserT = 0;
    G.winT = 0;
    G.gapT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 72;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isHell() ? '无间' : '极乐', isHell(), !isHell());
    beginWave(1);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'bliss';
    G.t = 0;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.pol = 0;
    G.meter = 0;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 72;
    clearWorld();
    showOverlay('title', '光暗', '同色吞弹积链，异色击破。空格切换极性，槽满放出光刃。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('bliss');
    else startGame(G.kind || 'bliss');
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.6);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.9);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.laserT > 0) G.laserT = Math.max(0, G.laserT - dt);
    if (G.polFlash > 0) G.polFlash = Math.max(0, G.polFlash - dt);
    if (G.polCd > 0) G.polCd -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    G.trail += dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.99;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.32) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    const starSpd = 48 + (isHell() && G.mode === 'play' ? 28 : 0);
    for (let i = 0; i < stars.length; i++) {
      stars[i].y += starSpd * (0.35 + stars[i].s * 0.28) * dt;
      if (stars[i].y > VH + 4) {
        stars[i].y = -4;
        stars[i].x = Math.random() * VW;
      }
    }
  }

  function updateShip(dt) {
    if (G.deadT > 0) return;
    const spd = shipSpeed();
    let mx = 0;
    let my = 0;
    if (inputSrc === 'ptr' && pointer.down) {
      const k = Math.min(1, 14 * dt);
      G.ship.x = lerp(G.ship.x, pointer.x, k);
      G.ship.y = lerp(G.ship.y, pointer.y, k);
    } else {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
      if (mx && my) {
        mx *= 0.707;
        my *= 0.707;
      }
      G.ship.x += mx * spd * dt;
      G.ship.y += my * spd * dt;
    }
    G.ship.x = clamp(G.ship.x, 18, VW - 18);
    G.ship.y = clamp(G.ship.y, 48, VH - 22);
    if ((keys.sht || pointer.down) && G.mode === 'play' && !overlayOpen()) fire();
    if (!REDUCE && G.trail > 0.03) {
      G.trail = 0;
      particles.push({
        x: G.ship.x + rand(-3, 3),
        y: G.ship.y + 10,
        vx: rand(-12, 12),
        vy: 70,
        g: 20,
        life: 0.22,
        r: rand(1.2, 2.2),
        rgb: polRgb(G.pol, false)
      });
      capArr(particles, 180);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.homing) {
        s.life -= dt;
        const t = nearestEnemy(s.x, s.y);
        if (t) {
          const a = Math.atan2(t.y - s.y, t.x - s.x);
          const wantx = Math.cos(a) * 520;
          const wanty = Math.sin(a) * 520;
          s.vx = lerp(s.vx, wantx, 0.14);
          s.vy = lerp(s.vy, wanty, 0.14);
        }
        if (s.life <= 0) {
          G.shots.splice(i, 1);
          continue;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -20 || s.y > VH + 20 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        if (hypot(e.x - s.x, e.y - s.y) > e.r + s.r) continue;
        if (s.homing || s.pol !== e.pol) {
          damageEnemy(e, s.dmg, true);
        } else {
          feedEnemy(e, s.x, s.y);
        }
        hit = true;
        break;
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBullets(dt) {
    const px = G.ship.x;
    const py = G.ship.y;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      const dx = px - b.x;
      const dy = py - b.y;
      const d = hypot(dx, dy) || 0.001;
      if (G.deadT <= 0 && b.pol === G.pol && d < PULL_R) {
        const pull = (PULL_R - d) * 9;
        b.vx += (dx / d) * pull * dt;
        b.vy += (dy / d) * pull * dt;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < -30 || b.y > VH + 30 || b.x < -30 || b.x > VW + 30) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (G.deadT > 0 || G.mode !== 'play') continue;
      if (d < ABSORB_R && b.pol === G.pol) {
        absorbBullet(b, i);
        continue;
      }
      if (d < HIT_R && b.pol !== G.pol) {
        if (G.invuln > 0) continue;
        G.bullets.splice(i, 1);
        diePlayer();
      }
    }
  }

  function bossOf() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].kind === 'boss' && G.enemies[i].alive) return G.enemies[i];
    }
    return null;
  }

  function updateEnemies(dt) {
    const hell = isHell();
    const fireMul = hell ? 0.78 : 1;
    const boss = bossOf();
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) {
        G.enemies.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.kind === 'drone') {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      } else if (e.kind === 'weaver' || e.kind === 'elite') {
        e.y += e.vy * dt;
        e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp;
      } else if (e.kind === 'turret') {
        e.y += e.vy * dt;
        if (e.y > 150) e.vy = Math.min(e.vy, 12);
      } else if (e.kind === 'circle') {
        e.cy += e.vy * dt;
        e.ang += e.omega * dt;
        e.x = e.cx + Math.cos(e.ang) * e.rad;
        e.y = e.cy + Math.sin(e.ang) * e.rad * 0.62;
      } else if (e.kind === 'pod') {
        if (boss) {
          e.ang += dt * 1.35;
          e.x = boss.x + Math.cos(e.ang) * e.rad;
          e.y = boss.y + Math.sin(e.ang) * e.rad * 0.72;
        } else {
          e.y += 40 * dt;
        }
      } else if (e.kind === 'boss') {
        if (e.enter > 0) {
          e.enter -= dt;
          e.y = lerp(-70, 128, 1 - Math.max(0, e.enter) / 1.4);
        } else {
          e.y = 128 + Math.sin(e.t * 0.7) * 10;
          e.x = VW * 0.5 + Math.sin(e.t * 0.55) * 138;
          e.flipT -= dt;
          if (e.flipT <= 0) {
            e.pol = 1 - e.pol;
            e.flipT = hell ? 2.15 : 2.8;
            ring(e.x, e.y, polRgb(e.pol, true));
            screenFlash(polRgb(e.pol, true), 0.22);
            audio.polar(e.pol);
          }
        }
        e.spin += dt * (e.hp / e.maxHp < 0.4 ? 2.4 : 1.4);
      }
      if (e.kind !== 'boss' && e.kind !== 'pod' && (e.y > VH + 36 || e.x < -40 || e.x > VW + 40)) {
        G.enemies.splice(i, 1);
        continue;
      }
      if (G.mode !== 'play' || G.deadT > 0) continue;
      if (e.kind !== 'boss' && hypot(e.x - G.ship.x, e.y - G.ship.y) < e.r + 5) {
        diePlayer();
        continue;
      }
      if (e.kind === 'boss' && e.enter <= 0 && hypot(e.x - G.ship.x, e.y - G.ship.y) < e.r - 6) {
        diePlayer();
        continue;
      }
      if (e.y < 8 || e.y > VH - 40) continue;
      e.fireCd -= dt;
      if (e.fireCd > 0) continue;
      if (e.kind === 'drone') {
        e.fireCd = 1.55 * fireMul;
        aimedFire(e, 1, 0, bulletSpd());
      } else if (e.kind === 'weaver') {
        e.fireCd = 1.28 * fireMul;
        aimedFire(e, hell ? 2 : 1, 0.18, bulletSpd());
      } else if (e.kind === 'turret') {
        e.fireCd = 1.05 * fireMul;
        aimedFire(e, hell ? 3 : 2, 0.16, bulletSpd() * 1.05);
      } else if (e.kind === 'circle') {
        e.fireCd = 1.4 * fireMul;
        aimedFire(e, 1, 0, bulletSpd() * 0.9);
      } else if (e.kind === 'elite') {
        e.fireCd = 0.95 * fireMul;
        aimedFire(e, 3, 0.2, bulletSpd());
      } else if (e.kind === 'pod') {
        e.fireCd = 1.35 * fireMul;
        aimedFire(e, 1, 0, bulletSpd() * 0.95);
      } else if (e.kind === 'boss' && e.enter <= 0) {
        const pct = e.hp / e.maxHp;
        if (pct > 0.66) {
          e.fireCd = 1.05 * fireMul;
          aimedFire(e, 5, 0.16, bulletSpd() * 0.95);
        } else if (pct > 0.33) {
          e.fireCd = 0.88 * fireMul;
          ringFire(e, 12, bulletSpd() * 0.78, true);
          aimedFire(e, 3, 0.14, bulletSpd());
        } else {
          e.fireCd = 0.62 * fireMul;
          enemyShot(e.x, e.y, Math.cos(e.spin) * bulletSpd(), Math.sin(e.spin) * bulletSpd(), 0, 3.6);
          enemyShot(e.x, e.y, Math.cos(e.spin + Math.PI) * bulletSpd(), Math.sin(e.spin + Math.PI) * bulletSpd(), 1, 3.6);
          aimedFire(e, hell ? 5 : 3, 0.12, bulletSpd() * 1.05);
        }
      }
    }
  }

  function updateWave(dt) {
    if (G.mode !== 'play') return;
    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) goWin();
      return;
    }
    if (G.gapT > 0) {
      G.gapT -= dt;
      if (G.gapT <= 0) beginWave(G.wave + 1);
      return;
    }
    G.waveT += dt;
    while (G.spawnQ.length && G.spawnQ[0].t <= G.waveT) {
      const item = G.spawnQ.shift();
      item.fn();
    }
    if (G.spawnQ.length) return;
    if (livingEnemies() > 0) return;
    if (G.wave < STORY_WAVES) {
      addScore(SCORE.wave * G.wave * G.mult);
      toast(WAVE_NAMES[G.wave - 1] + ' 肃清', false, true);
      G.gapT = 1.15;
    } else if (G.wave === STORY_WAVES) {
      addScore(SCORE.wave * G.wave * G.mult);
      toast('潮涌肃清', false, true);
      G.gapT = 1.25;
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.15);
      return;
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.invuln > 0) G.invuln -= dt;
    updateFx(dt);
    if (G.mode === 'title') return;
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateShots(dt);
      updateBullets(dt);
      updateEnemies(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    if (G.mode !== 'play') return;
    updateShip(dt);
    updateShots(dt);
    updateBullets(dt);
    updateEnemies(dt);
    updateWave(dt);
  }

  function drawBg() {
    const c = ctx;
    c.fillStyle = '#050310';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const wash = G.polFlash > 0 ? G.polFlash * 0.35 : 0.08;
    c.fillStyle = rgba(polRgb(G.pol, false), wash);
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      c.fillStyle = rgba(s.pol ? MAG : ICE, s.a);
      const r = s.s * scale;
      c.fillRect(sx(s.x), sy(s.y), r, r * (REDUCE ? 1 : 2.4));
    }
    c.restore();
    c.strokeStyle = 'rgba(122,107,255,0.06)';
    c.lineWidth = 1;
    for (let x = 40; x < VW; x += 80) {
      c.beginPath();
      c.moveTo(sx(x), sy(0));
      c.lineTo(sx(x), sy(VH));
      c.stroke();
    }
  }

  function drawDiamond(x, y, r, rgb, fillA, rot) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(y));
    if (rot) c.rotate(rot);
    c.beginPath();
    c.moveTo(0, -r * scale);
    c.lineTo(r * 0.72 * scale, 0);
    c.lineTo(0, r * scale);
    c.lineTo(-r * 0.72 * scale, 0);
    c.closePath();
    c.fillStyle = rgba(rgb, fillA);
    c.fill();
    c.restore();
  }

  function drawEnemy(e) {
    const rgb = polRgb(e.pol, e.flash > 0);
    const glow = polRgb(e.pol, true);
    const c = ctx;
    if (e.kind === 'boss') {
      c.save();
      c.translate(sx(e.x), sy(e.y));
      const beat = 1 + Math.sin(e.t * 3.2) * 0.05;
      c.rotate(e.spin * 0.15);
      c.fillStyle = rgba(glow, 0.18);
      c.beginPath();
      c.arc(0, 0, 48 * scale * beat, 0, TAU);
      c.fill();
      c.fillStyle = rgba(e.pol ? DEEP : WHT, 0.95);
      c.beginPath();
      c.moveTo(0, -38 * scale);
      c.lineTo(28 * scale, 0);
      c.lineTo(0, 38 * scale);
      c.lineTo(-28 * scale, 0);
      c.closePath();
      c.fill();
      c.strokeStyle = rgba(glow, 0.95);
      c.lineWidth = Math.max(1.5, 2.2 * scale);
      c.stroke();
      c.fillStyle = rgba(glow, 0.95);
      c.beginPath();
      c.arc(0, 0, 10 * scale * beat, 0, TAU);
      c.fill();
      c.fillStyle = rgba(e.pol ? MAG : WHT, 0.9);
      c.beginPath();
      c.arc(0, 0, 4.5 * scale, 0, TAU);
      c.fill();
      c.restore();
      const pct = clamp(e.hp / e.maxHp, 0, 1);
      const bw = 180;
      const bh = 7;
      const bx = VW * 0.5 - bw * 0.5;
      const by = 16;
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(bx - 2), sy(by - 2), (bw + 4) * scale, (bh + 4) * scale);
      c.fillStyle = rgba(DEEP, 0.9);
      c.fillRect(sx(bx), sy(by), bw * scale, bh * scale);
      c.fillStyle = rgba(pct < 0.33 ? MAG : GOLD, 0.95);
      c.fillRect(sx(bx), sy(by), bw * pct * scale, bh * scale);
      c.fillStyle = rgba(WHT, 0.7);
      c.font = (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.fillText('双极核', sx(VW * 0.5), sy(by - 4));
      return;
    }
    c.save();
    c.globalAlpha = 0.22;
    c.fillStyle = rgba(glow, 1);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y), (e.r + 4) * scale, 0, TAU);
    c.fill();
    c.restore();
    if (e.kind === 'turret') {
      c.fillStyle = rgba(e.pol ? DEEP : ICE, 0.95);
      c.fillRect(sx(e.x - 10), sy(e.y - 8), 20 * scale, 16 * scale);
      c.strokeStyle = rgba(glow, 0.95);
      c.lineWidth = 1.4 * scale;
      c.strokeRect(sx(e.x - 10), sy(e.y - 8), 20 * scale, 16 * scale);
      drawDiamond(e.x, e.y, 6, glow, 0.95, 0);
    } else if (e.kind === 'elite') {
      drawDiamond(e.x, e.y, 16, e.pol ? DEEP : WHT, 0.95, e.t * 0.4);
      drawDiamond(e.x, e.y, 9, glow, 0.9, -e.t * 0.6);
    } else if (e.kind === 'pod') {
      c.fillStyle = rgba(glow, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 8 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(e.pol ? MAG : WHT, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 3.4 * scale, 0, TAU);
      c.fill();
    } else {
      drawDiamond(e.x, e.y, e.kind === 'weaver' ? 13 : 11, e.pol ? DEEP : WHT, 0.95, e.t * 0.8);
      drawDiamond(e.x, e.y, 5, glow, 0.95, 0);
    }
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const rgb = s.homing ? GOLD : polRgb(s.pol, true);
      if (!REDUCE) {
        c.fillStyle = rgba(rgb, 0.22);
        c.fillRect(sx(s.x - 1.6), sy(s.y), 3.2 * scale, 12 * scale);
      }
      if (s.homing) {
        c.strokeStyle = rgba(GOLD, 0.9);
        c.lineWidth = 2.2 * scale;
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y + 8));
        c.lineTo(sx(s.x), sy(s.y - 8));
        c.stroke();
        c.fillStyle = rgba(WHT, 0.95);
        c.beginPath();
        c.arc(sx(s.x), sy(s.y), 3.2 * scale, 0, TAU);
        c.fill();
      } else {
        drawDiamond(s.x, s.y, 5.5, rgb, 0.95, 0);
        c.fillStyle = rgba(WHT, 0.9);
        c.fillRect(sx(s.x - 1.1), sy(s.y - 6), 2.2 * scale, 10 * scale);
      }
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const rgb = polRgb(b.pol, true);
      const same = b.pol === G.pol && G.deadT <= 0;
      c.fillStyle = rgba(rgb, same ? 0.95 : 0.88);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), (same ? 3.6 : 3.1) * scale, 0, TAU);
      c.fill();
      if (b.pol === 0) {
        c.fillStyle = rgba(WHT, 0.95);
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), 1.5 * scale, 0, TAU);
        c.fill();
      } else {
        c.fillStyle = rgba(DEEP, 0.9);
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), 1.4 * scale, 0, TAU);
        c.fill();
      }
      if (same && !REDUCE) {
        c.strokeStyle = rgba(rgb, 0.35);
        c.lineWidth = 1;
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), 7 * scale, 0, TAU);
        c.stroke();
      }
    }
    c.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;
    const glow = polRgb(G.pol, true);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(glow, 0.22 + G.polFlash * 0.5);
    c.beginPath();
    c.ellipse(sx(x), sy(y), 16 * scale, 12 * scale, 0, 0, TAU);
    c.fill();
    c.restore();
    c.save();
    c.translate(sx(x), sy(y));
    c.fillStyle = rgba(G.pol ? DEEP : WHT, 0.96);
    c.beginPath();
    c.moveTo(0, -16 * scale);
    c.lineTo(10 * scale, 10 * scale);
    c.lineTo(0, 6 * scale);
    c.lineTo(-10 * scale, 10 * scale);
    c.closePath();
    c.fill();
    c.strokeStyle = rgba(glow, 0.95);
    c.lineWidth = Math.max(1.2, 1.6 * scale);
    c.stroke();
    c.fillStyle = rgba(G.pol ? MAG : CYN, 0.95);
    c.beginPath();
    c.arc(0, 0, 3.4 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.arc(0, -1 * scale, 1.4 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(glow, 0.7);
    c.beginPath();
    c.moveTo(-5 * scale, 8 * scale);
    c.lineTo(0, 16 * scale);
    c.lineTo(5 * scale, 8 * scale);
    c.closePath();
    c.fill();
    c.restore();
    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, G.muzzle * 10);
      c.beginPath();
      c.arc(sx(x - 6), sy(y - 16), 4 * scale, 0, TAU);
      c.fill();
      c.beginPath();
      c.arc(sx(x + 6), sy(y - 16), 4 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
    if (G.meter >= 1 && !REDUCE) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = rgba(GOLD, 0.45 + Math.sin(G.t * 10) * 0.2);
      c.lineWidth = 1.6 * scale;
      c.beginPath();
      c.arc(sx(x), sy(y), (20 + Math.sin(G.t * 8) * 3) * scale, 0, TAU);
      c.stroke();
      c.restore();
    }
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
      const a = 1 - s.t / 0.32;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (6 + s.t * 42) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    c.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.fillStyle = rgba(f.rgb, a);
      if (f.gold) c.font = (13 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      else c.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#080614';
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
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080614';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
    }
    drawShots();
    drawShip();
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
      startGame('bliss');
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
    if (k === 'z' || k === 'Z' || k === 'j' || k === 'J') {
      keys.sht = down;
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
        if (G.mode === 'play' && !overlayOpen()) fire();
      }
    }
    if (space || k === 'ArrowUp' || k === 'ArrowDown') {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R')) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (space) {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') flipPol();
      return;
    }
    if (k === 'Enter') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      audio.ensure();
      startGame('bliss');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('hell');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (e.button === 2) {
        if (G.mode === 'play') flipPol();
        return;
      }
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
      inputSrc = 'ptr';
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
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

  if (btnBliss) {
    btnBliss.addEventListener('click', function () {
      audio.ensure();
      startGame('bliss');
    });
  }
  if (btnHell) {
    btnHell.addEventListener('click', function () {
      audio.ensure();
      startGame('hell');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'bliss');
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
  if (btnPol) {
    btnPol.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      flipPol();
      btnPol.classList.add('held');
    });
    btnPol.addEventListener('pointerup', function () {
      btnPol.classList.remove('held');
    });
    btnPol.addEventListener('pointercancel', function () {
      btnPol.classList.remove('held');
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
      keys.sht = false;
    }
  });

  requestAnimationFrame(frame);
})();
