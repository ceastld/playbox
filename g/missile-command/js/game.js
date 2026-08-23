'use strict';

(function () {
  const VW = 960;
  const VH = 540;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GROUND = 492;
  const AMMO = 10;
  const CITY_N = 6;
  const WAVES = 6;
  const COMBO_WIN = 0.82;
  const CITY_X = [186, 258, 330, 630, 702, 774];
  const BAT_X = [72, 480, 888];
  const BEST_KEY = 'playbox-missile-command-best';
  const MUTE_KEY = 'playbox-missile-command-mute';
  const OPS = '点按 / 空格开火 · ← → ↑ ↓ 准星 · R 重开 · M 静音';
  const WAVE_NAME = ['', '初袭', '裂变', '巡空', '智避', '密袭', '智弹雨'];

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 136, 32];
  const HOT2 = [255, 176, 64];
  const WHT = [255, 244, 232];
  const PUR = [180, 92, 255];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const btnMslc = el('btn-mslc');
  const btnRain = el('btn-rain');
  const ovRetry = el('ov-retry');
  const ovModes = el('ov-modes');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const ammoLabel = el('ammo-label');
  const comboEl = el('combo-label');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const hintEl = el('hint');
  const stageEl = el('stage');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH * 0.38, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'mslc',
    t: 0,
    clock: 0,
    wave: 1,
    rain: false,
    score: 0,
    best: 0,
    bestM: 0,
    bestR: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    wmult: 1,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    fireCd: 0,
    spawnLeft: 0,
    spawnWait: 0,
    ready: 0,
    dying: 0,
    toastT: 0,
    nextCity: 10000,
    cities: [],
    bats: [],
    missiles: [],
    abms: [],
    blasts: [],
    carriers: [],
    aim: { x: VW * 0.5, y: 220 },
    bonus: null
  };

  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;

  function clamp(n, a, b) {
    return n < a ? a : n > b ? b : n;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function irand(a, b) {
    return (a + Math.random() * (b - a + 1)) | 0;
  }
  function hypot(ax, ay) {
    return Math.sqrt(ax * ax + ay * ay);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function isRain() {
    return G.kind === 'rain';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          try { this.ctx.resume(); } catch (err) { /* ignore */ }
        }
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.4;
        this.master.connect(this.ctx.destination);
      } catch (err) {
        this.ctx = null;
        this.master = null;
      }
    },
    setMuted(m) {
      this.muted = !!m;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.4;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
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
    launch() {
      this.ensure();
      this.beep(240, 0.08, 'sawtooth', 0.032, 920);
      this.beep(720, 0.06, 'square', 0.026, 1480);
    },
    boom() {
      this.ensure();
      this.noise(0.18, 0.075, 240);
      this.beep(150, 0.2, 'sine', 0.062, 46);
      this.beep(88, 0.24, 'triangle', 0.042, 38);
    },
    intercept(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.75, combo * 0.07);
      this.noise(0.05, 0.048, 1200);
      this.beep(540 * lift, 0.07, 'square', 0.056, 1020 * lift);
      this.beep(900 * lift, 0.11, 'triangle', 0.04, 1400 * lift);
      if (combo >= 3) this.beep(1280, 0.12, 'sine', 0.034, 1820);
    },
    combo(n) {
      this.ensure();
      this.beep(392 * n, 0.08, 'sine', 0.042, 784);
      this.beep(784, 0.15, 'triangle', 0.036, 1176);
    },
    split() {
      this.ensure();
      this.beep(1040, 0.06, 'square', 0.03, 380);
      this.beep(620, 0.08, 'sawtooth', 0.024, 200);
    },
    city() {
      this.ensure();
      this.noise(0.3, 0.095, 160);
      this.beep(170, 0.34, 'sawtooth', 0.072, 42);
      this.beep(84, 0.44, 'sine', 0.06, 32);
    },
    empty() {
      this.ensure();
      this.beep(92, 0.05, 'square', 0.03);
      this.beep(68, 0.07, 'triangle', 0.02);
    },
    tick() {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.028);
    },
    bonus() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.036, 659);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    wave() {
      this.ensure();
      this.beep(330, 0.08, 'sine', 0.04, 494);
      this.beep(494, 0.1, 'sine', 0.04, 659);
      this.beep(784, 0.18, 'triangle', 0.046, 1046);
    },
    rainWarn() {
      this.ensure();
      this.beep(196, 0.12, 'sawtooth', 0.05, 110);
      this.beep(392, 0.16, 'square', 0.04, 220);
      this.beep(784, 0.22, 'triangle', 0.045, 1568);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 660);
      this.beep(660, 0.12, 'triangle', 0.035, 990);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.045, 659);
      this.beep(784, 0.14, 'triangle', 0.05, 1046);
      this.beep(1046, 0.22, 'sine', 0.04, 1318);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.22, 'sawtooth', 0.05, 80);
      this.beep(110, 0.4, 'sine', 0.055, 40);
    },
    carrier() {
      this.ensure();
      this.beep(280, 0.07, 'square', 0.03, 140);
    }
  };

  function loadBest() {
    G.bestM = 0;
    G.bestR = 0;
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw && raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.bestM = Math.max(0, parseInt(o.m, 10) || 0);
        G.bestR = Math.max(0, parseInt(o.r, 10) || 0);
      } else {
        const n = parseInt(raw || '0', 10);
        G.bestM = isFinite(n) && n > 0 ? n : 0;
      }
    } catch (err) {
      G.bestM = 0;
      G.bestR = 0;
    }
    G.best = Math.max(G.bestM, G.bestR);
    if (bestEl) bestEl.textContent = String(modeBest());
  }

  function modeBest() {
    if (G.mode === 'title') return Math.max(G.bestM, G.bestR);
    return isRain() ? G.bestR : G.bestM;
  }

  function saveBest() {
    if (isRain()) {
      if (G.score > G.bestR) G.bestR = G.score;
    } else if (G.score > G.bestM) {
      G.bestM = G.score;
    }
    G.best = Math.max(G.bestM, G.bestR);
    if (bestEl) bestEl.textContent = String(modeBest());
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ m: G.bestM, r: G.bestR }));
    } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if ((G.mode !== 'play' && G.mode !== 'bonus') || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    maybeBonusCity();
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

  function maybeBonusCity() {
    if (G.mode !== 'play' && G.mode !== 'bonus') return;
    while (G.score >= G.nextCity) {
      G.nextCity += 10000;
      const dead = [];
      for (let i = 0; i < G.cities.length; i++) {
        if (!G.cities[i].alive) dead.push(G.cities[i]);
      }
      if (!dead.length) continue;
      const c = dead[irand(0, dead.length - 1)];
      c.alive = true;
      c.fall = 0;
      c.flash = 0.5;
      toast('加城 +1', false, true);
      audio.bonus();
      juice(c.x, c.y - 18, GOLD, 1.1);
      syncHud();
    }
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.45;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function citiesAlive() {
    let n = 0;
    for (let i = 0; i < G.cities.length; i++) if (G.cities[i].alive) n += 1;
    return n;
  }

  function ammoLeft() {
    let n = 0;
    for (let i = 0; i < G.bats.length; i++) {
      if (G.bats[i].alive) n += G.bats[i].ammo;
    }
    return n;
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 2));
  }

  function waveMult() {
    return Math.min(4, 1 + Math.floor((G.wave - 1) / 2));
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < CITY_N) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < pips.length; i++) {
      const on = G.cities[i] && G.cities[i].alive;
      pips[i].className = 'pip' + (on ? ' on' : ' gone');
    }
  }

  function waveLabel() {
    if (G.mode === 'title') return '导弹';
    if (G.mode === 'bonus') return G.rain ? '雨后' : '结算';
    if (G.mode === 'win') return '通关';
    if (G.rain) return isRain() ? '核雨' : '智弹雨';
    return WAVE_NAME[G.wave] || ('第 ' + G.wave + ' 波');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(modeBest());
    const ammo = ammoLeft();
    if (stageLabel) {
      stageLabel.textContent = waveLabel();
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.rain || G.wave >= 5));
    }
    if (tagLabel) {
      tagLabel.textContent = isRain() ? '核雨' : '导弹';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || citiesAlive() <= 1);
      tagLabel.classList.toggle('hot', G.combo >= 4 || G.rain);
    }
    if (ammoLabel) {
      ammoLabel.textContent = '弹 ' + ammo;
      ammoLabel.classList.toggle('warn', G.mode === 'play' && ammo <= 5);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.combo + ' 链 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 六城全毁即负', 'warn');
    else if (G.mode === 'win') setHint('R 再来 · 智弹雨已尽', 'hot');
    else if (G.mode === 'bonus') setHint('余弹与守城结算中', 'hot');
    else if (G.rain) setHint('智弹雨 · 火球拦路 · 别漏城', 'warn');
    else if (citiesAlive() === 1) setHint('最后一座城 · 别漏', 'warn');
    else if (ammo <= 4 && G.mode === 'play') setHint('弹药告急 · 瞄准再打', 'warn');
    else setHint('点按开火 · 火球吞弹 · 护住六城 · 智弹雨通关', '');
    syncPips();
  }

  function setEndButtons(win) {
    if (ovStart) ovStart.classList.add('gone');
    if (ovEnd) ovEnd.classList.remove('gone');
    if (ovRetry) ovRetry.textContent = '再来';
    if (ovModes) {
      if (win && !isRain()) {
        ovModes.textContent = '核雨';
      } else {
        ovModes.textContent = '换模式';
      }
    }
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) {
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'MSLC';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = OPS;
    if (kind === 'title') {
      if (ovStart) ovStart.classList.remove('gone');
      if (ovEnd) ovEnd.classList.add('gone');
    } else {
      setEndButtons(kind === 'win');
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.006));
    if (!stageEl || G.mode === 'title') return;
    kickTok += 1;
    const cls = mag >= 5.5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
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
    capArr(particles, 360);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 44);
    capArr(rings, 32);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      text: text,
      rgb: rgb,
      t: 0,
      life: gold ? 0.98 : 0.7,
      size: gold ? 22 : 14,
      gold: !!gold,
      vy: gold ? -92 : -74
    });
    capArr(floats, 32);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(10 + (p * 14) | 0, {
      x: x, y: y, j: 7 + p * 6,
      vx0: -240 * p, vx1: 240 * p, vy0: -280 * p, vy1: 120 * p,
      life: 0.3 + p * 0.16, r0: 1.1, r1: 2.9 + p, rgb: rgb, g: 280
    });
    popSpark(x, y, rgb, 12 + p * 14);
    screenFlash(rgb, 0.2 + p * 0.18);
    kick(2.2 + p * 2.6);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 68; i++) {
      stars.push({
        x: rand(8, VW - 8),
        y: rand(8, GROUND - 48),
        r: rand(0.4, 1.6),
        a: rand(0.1, 0.52),
        p: rand(0, TAU),
        rgb: i % 7 === 0 ? HOT : i % 5 === 0 ? CYN : WHT
      });
    }
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

  function makeCities() {
    G.cities = [];
    for (let i = 0; i < CITY_N; i++) {
      G.cities.push({
        x: CITY_X[i],
        y: GROUND - 4,
        alive: true,
        fall: 0,
        flash: 0,
        seed: i * 19 + 5
      });
    }
  }

  function makeBats() {
    G.bats = [];
    for (let i = 0; i < 3; i++) {
      G.bats.push({
        x: BAT_X[i],
        y: GROUND,
        peak: GROUND - (i === 1 ? 46 : 38),
        ammo: AMMO,
        alive: true,
        flash: 0
      });
    }
  }

  function refillBats() {
    for (let i = 0; i < G.bats.length; i++) {
      G.bats[i].alive = true;
      G.bats[i].ammo = AMMO;
      G.bats[i].flash = 0.25;
    }
  }

  function pickTarget() {
    const opts = [];
    for (let i = 0; i < G.cities.length; i++) {
      if (G.cities[i].alive) opts.push({ x: G.cities[i].x, y: G.cities[i].y - 8, kind: 'city', id: i });
    }
    for (let i = 0; i < G.bats.length; i++) {
      if (G.bats[i].alive) opts.push({ x: G.bats[i].x, y: G.bats[i].peak + 8, kind: 'bat', id: i });
    }
    if (!opts.length) return { x: rand(50, VW - 50), y: GROUND, kind: 'ground', id: -1 };
    const cityBias = Math.random() < 0.78;
    if (cityBias) {
      const cities = [];
      for (let i = 0; i < opts.length; i++) if (opts[i].kind === 'city') cities.push(opts[i]);
      if (cities.length) return cities[irand(0, cities.length - 1)];
    }
    return opts[irand(0, opts.length - 1)];
  }

  function waveCount() {
    if (G.rain) return isRain() ? 28 : 18;
    const n = [0, 10, 12, 14, 16, 18][G.wave] || 16;
    return isRain() ? n + 4 : n;
  }

  function waveSpeed() {
    const s = 68 + (G.wave - 1) * 13;
    return Math.min(isRain() ? 196 : 168, s * (isRain() ? 1.16 : 1));
  }

  function waveInterval() {
    if (G.rain) return isRain() ? 0.2 : 0.3;
    const t = 0.9 - (G.wave - 1) * 0.08;
    return Math.max(isRain() ? 0.22 : 0.28, t * (isRain() ? 0.78 : 1));
  }

  function splitChance() {
    if (G.rain) return 0;
    if (isRain()) return clamp(0.28 + (G.wave - 1) * 0.08, 0.28, 0.72);
    if (G.wave < 2) return 0;
    return clamp(0.12 + (G.wave - 2) * 0.08, 0.12, 0.52);
  }

  function smartChance() {
    if (G.rain) return 1;
    if (isRain()) {
      if (G.wave < 2) return 0.08;
      return clamp(0.14 + (G.wave - 2) * 0.07, 0.14, 0.42);
    }
    if (G.wave < 4) return 0;
    return clamp(0.08 + (G.wave - 4) * 0.08, 0.08, 0.28);
  }

  function spawnMissile(opt) {
    const tgt = (opt && opt.tgt) || pickTarget();
    const x0 = opt && opt.x != null ? opt.x : rand(22, VW - 22);
    const y0 = opt && opt.y != null ? opt.y : rand(-10, 12);
    const kind = (opt && opt.kind) || 'plain';
    let speed = (opt && opt.speed) || waveSpeed() * rand(0.88, 1.12);
    if (kind === 'smart') speed *= 0.78;
    const dx = tgt.x - x0;
    const dy = tgt.y - y0;
    const len = hypot(dx, dy) || 1;
    const rgb = kind === 'smart' ? MAG : kind === 'split' ? HOT2 : HOT;
    G.missiles.push({
      x: x0,
      y: y0,
      x0: x0,
      y0: y0,
      tx: tgt.x,
      ty: tgt.y,
      vx: dx / len * speed,
      vy: dy / len * speed,
      speed: speed,
      kind: kind,
      rgb: rgb,
      splitY: rand(150, 280),
      splitN: G.wave >= 5 || isRain() ? 3 : 2,
      didSplit: false,
      tgtKind: tgt.kind,
      tgtId: tgt.id,
      child: !!(opt && opt.child)
    });
  }

  function spawnIncoming() {
    const roll = Math.random();
    let kind = 'plain';
    const sc = smartChance();
    const sp = splitChance();
    if (roll < sc) kind = 'smart';
    else if (roll < sc + sp) kind = 'split';
    spawnMissile({ kind: kind });
  }

  function spawnCarrier(kind) {
    const left = Math.random() < 0.5;
    const bomber = kind === 'bomber';
    const y = bomber ? rand(78, 132) : rand(42, 88);
    const speed = (bomber ? rand(78, 108) : rand(110, 148)) * (isRain() ? 1.18 : 1);
    G.carriers.push({
      kind: kind,
      x: left ? -28 : VW + 28,
      y: y,
      vx: left ? speed : -speed,
      drops: bomber ? (isRain() ? 3 : 2) : (isRain() ? 2 : 1),
      dropWait: rand(0.35, 0.7),
      flash: 0,
      w: bomber ? 34 : 22,
      h: bomber ? 10 : 8
    });
    audio.carrier();
  }

  function maybeSpawnCarrier() {
    if (G.rain || G.mode !== 'play') return;
    if (G.wave < 2) return;
    if (G.carriers.length >= (isRain() ? 2 : 1)) return;
    if (G.spawnLeft <= 1) return;
    const chance = isRain() ? 0.012 : 0.008;
    if (Math.random() > chance) return;
    const sat = G.wave >= 3 && Math.random() < 0.45;
    spawnCarrier(sat ? 'sat' : 'bomber');
  }

  function spawnBlast(x, y, maxR, rgb, kind) {
    G.blasts.push({
      x: x,
      y: y,
      r: 4,
      maxR: maxR,
      t: 0,
      growT: kind === 'chain' ? 0.12 : 0.22,
      fadeT: kind === 'chain' ? 0.44 : 0.72,
      rgb: rgb,
      kind: kind,
      hurt: false
    });
    capArr(G.blasts, 40);
  }

  function nearestBattery(x, y) {
    let best = -1;
    let bestD = 1e9;
    for (let i = 0; i < G.bats.length; i++) {
      const b = G.bats[i];
      if (!b.alive || b.ammo <= 0) continue;
      const d = hypot(b.x - x, b.peak - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function fireAt(tx, ty) {
    if (G.mode !== 'play' && G.mode !== 'title') return false;
    if (G.mode === 'play' && G.dying > 0) return false;
    if (G.fireCd > 0) return false;
    tx = clamp(tx, 12, VW - 12);
    ty = clamp(ty, 16, GROUND - 12);
    const i = nearestBattery(tx, ty);
    if (i < 0) {
      if (G.mode === 'play') {
        audio.empty();
        toast('弹尽', true, false);
        kick(1.2);
      }
      return false;
    }
    const b = G.bats[i];
    b.ammo -= 1;
    G.fireCd = 0.055;
    const speed = i === 1 ? 620 : 460;
    const dx = tx - b.x;
    const dy = ty - b.peak;
    const len = hypot(dx, dy) || 1;
    G.abms.push({
      x: b.x,
      y: b.peak,
      x0: b.x,
      y0: b.peak,
      tx: tx,
      ty: ty,
      vx: dx / len * speed,
      vy: dy / len * speed,
      speed: speed,
      rgb: i === 1 ? WHT : CYN
    });
    audio.launch();
    emit(6, {
      x: b.x, y: b.peak, j: 3,
      vx0: -50, vx1: 50, vy0: -110, vy1: -20,
      life: 0.22, r0: 1, r1: 2.2, rgb: CYN, g: 80
    });
    b.flash = 0.18;
    syncHud();
    return true;
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = comboMult();
    if (comboEl && G.combo >= 2) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
    }
    syncHud();
  }

  function basePts(kind) {
    if (kind === 'smart') return 50;
    if (kind === 'split') return 35;
    if (kind === 'bomber') return 200;
    if (kind === 'sat') return 280;
    return 25;
  }

  function killMissile(i, cause) {
    const m = G.missiles[i];
    if (!m) return;
    G.missiles.splice(i, 1);
    if (G.mode !== 'play') {
      juice(m.x, m.y, m.rgb, 0.45);
      return;
    }
    bumpCombo();
    const pts = basePts(m.kind) * G.wmult * G.mult;
    addScore(pts);
    const gold = G.combo >= 3;
    floatText(m.x, m.y - 8, '+' + pts, gold ? GOLD : CYN, gold);
    if (G.combo === 3) floatText(m.x, m.y - 28, '三连', GOLD, true);
    else if (G.combo === 5) floatText(m.x, m.y - 28, '五连', GOLD, true);
    else if (G.combo === 8) floatText(m.x, m.y - 28, '火网', GOLD, true);
    juice(m.x, m.y, cause === 'chain' ? GOLD : CYN, 0.9 + Math.min(0.9, G.combo * 0.1));
    hitStop(clamp(0.036 + G.combo * 0.006, 0.036, 0.078));
    audio.intercept(G.combo);
    if (G.combo === 3 || G.combo === 5 || G.combo === 8) audio.combo(Math.min(4, G.mult));
    spawnBlast(m.x, m.y, cause === 'chain' ? 16 : 20 + Math.min(8, G.combo), cause === 'chain' ? GOLD : CYN, 'chain');
  }

  function killCarrier(i) {
    const c = G.carriers[i];
    if (!c) return;
    G.carriers.splice(i, 1);
    if (G.mode !== 'play') {
      juice(c.x, c.y, GOLD, 0.7);
      return;
    }
    bumpCombo();
    const pts = basePts(c.kind) * G.wmult * G.mult;
    addScore(pts);
    floatText(c.x, c.y - 12, '+' + pts, GOLD, true);
    floatText(c.x, c.y - 32, c.kind === 'sat' ? '卫星' : '轰炸机', CYN, false);
    juice(c.x, c.y, GOLD, 1.15);
    hitStop(0.055);
    audio.intercept(G.combo);
    spawnBlast(c.x, c.y, 22, GOLD, 'chain');
  }

  function killCity(c) {
    if (!c.alive) return;
    c.alive = false;
    c.fall = 0.01;
    audio.city();
    juice(c.x, c.y - 16, HOT, 1.4);
    emit(18, {
      x: c.x, y: c.y - 10, j: 12,
      vx0: -160, vx1: 160, vy0: -240, vy1: -16,
      life: 0.72, r0: 1.4, r1: 3.6, rgb: GOLD, g: 520
    });
    hitStop(0.078);
    kick(7.4);
    screenFlash(HOT, 0.6);
    const left = citiesAlive();
    if (left === 0) {
      G.dying = 0.95;
      toast('城破了', true, false);
    } else if (left === 1) {
      toast('最后一座', true, false);
    } else {
      toast('一城陷落', true, false);
    }
    syncHud();
  }

  function killBat(b) {
    if (!b.alive) return;
    b.alive = false;
    b.ammo = 0;
    b.flash = 0.4;
    audio.boom();
    juice(b.x, b.peak, MAG, 1.05);
    hitStop(0.05);
    kick(5.2);
    screenFlash(MAG, 0.36);
    toast('炮台被毁', true, false);
    syncHud();
  }

  function detonateAbm(a) {
    spawnBlast(a.tx, a.ty, 48, a.rgb === WHT ? WHT : CYN, 'abm');
    audio.boom();
    popSpark(a.tx, a.ty, CYN, 24);
    kick(2.7);
    screenFlash(CYN, 0.22);
  }

  function detonateWarhead(m) {
    spawnBlast(m.x, m.y, 26, m.rgb, 'warhead');
    audio.boom();
    juice(m.x, m.y, m.rgb, 0.88);
    kick(4.5);
  }

  function doSplit(m) {
    m.didSplit = true;
    audio.split();
    popSpark(m.x, m.y, m.rgb, 12);
    const n = m.splitN;
    for (let k = 0; k < n; k++) {
      spawnMissile({
        x: m.x,
        y: m.y,
        kind: 'plain',
        child: true,
        speed: m.speed * rand(1.06, 1.24),
        tgt: pickTarget()
      });
    }
    emit(8, {
      x: m.x, y: m.y, j: 4,
      vx0: -90, vx1: 90, vy0: -40, vy1: 90,
      life: 0.22, r0: 1, r1: 2, rgb: m.rgb, g: 40
    });
  }

  function startWave(n) {
    G.wave = n;
    G.rain = n >= WAVES;
    G.wmult = waveMult();
    G.ready = G.rain ? 0.72 : 0.42;
    G.spawnLeft = waveCount();
    G.spawnWait = 0.18;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.missiles.length = 0;
    G.abms.length = 0;
    G.blasts.length = 0;
    G.carriers.length = 0;
    G.bonus = null;
    refillBats();
    if (G.rain) {
      toast(isRain() ? '核雨 · 智弹倾泻' : '智弹雨 · 护城', true, false);
      audio.rainWarn();
      screenFlash(MAG, 0.42);
      kick(3.2);
    } else {
      toast(WAVE_NAME[G.wave] + (G.wmult > 1 ? '  ×' + G.wmult : ''), false, G.wave % 2 === 1);
      if (G.wave > 1) audio.wave();
    }
    syncHud();
  }

  function beginBonus() {
    if (G.mode !== 'play') return;
    if (citiesAlive() <= 0) {
      G.dying = Math.max(G.dying, 0.2);
      return;
    }
    G.mode = 'bonus';
    G.bonus = {
      phase: 'ammo',
      ammo: ammoLeft(),
      cities: citiesAlive(),
      wait: 0.18,
      total: 0,
      afterRain: G.rain
    };
    toast('余弹奖励', false, true);
    audio.bonus();
    syncHud();
  }

  function loseRun() {
    if (G.mode !== 'play' && G.mode !== 'bonus') return;
    G.mode = 'lose';
    G.dying = 0;
    audio.lose();
    kick(8);
    screenFlash(MAG, 0.6);
    hitStop(0.08);
    const lead = '六城尽毁  本局 ' + G.score + ' · 最高 ' + modeBest();
    showOverlay('lose', '城破了', lead);
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play' && G.mode !== 'bonus') return;
    G.mode = 'win';
    const extra = isRain() ? 10000 : 8000;
    G.mode = 'bonus';
    addScore(extra);
    G.mode = 'win';
    audio.win();
    kick(4);
    screenFlash(GOLD, 0.5);
    floatText(VW * 0.5, 180, '+' + extra, GOLD, true);
    const title = isRain() ? '核雨尽破' : '弹雨尽破';
    const lead = (isRain() ? '核雨通关' : '智弹雨已尽') + '  本局 ' + G.score + ' · 最高 ' + modeBest();
    showOverlay('win', title, lead);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'rain' ? 'rain' : 'mslc';
    G.mode = 'play';
    G.wave = 1;
    G.rain = false;
    G.score = 0;
    G.nextCity = 10000;
    G.dying = 0;
    G.aim.x = VW * 0.5;
    G.aim.y = 220;
    makeCities();
    makeBats();
    resetFx();
    hideOverlay();
    audio.start();
    startWave(1);
    toast(isRain() ? '核雨 · 更密更快' : '导弹 · 五波后智弹雨', false, !isRain());
    syncHud();
  }

  function demoReset() {
    makeCities();
    makeBats();
    G.missiles.length = 0;
    G.abms.length = 0;
    G.blasts.length = 0;
    G.carriers.length = 0;
    G.wave = 1;
    G.rain = false;
    G.wmult = 1;
    G.spawnLeft = 7;
    G.spawnWait = 0.4;
    G.ready = 0;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'mslc';
    G.wave = 1;
    G.rain = false;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.dying = 0;
    G.bonus = null;
    demoReset();
    resetFx();
    showOverlay('title', '导弹', '瞄准拦截来袭弹雨，护住六城。五波之后是智弹雨。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('mslc');
    else startGame(G.kind || 'mslc');
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.punch > 1) G.punch = 1 + (G.punch - 1) * Math.max(0, 1 - dt * 10);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.4) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy += 40 * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
  }

  function updateBlasts(dt) {
    for (let i = G.blasts.length - 1; i >= 0; i--) {
      const e = G.blasts[i];
      e.t += dt;
      if (e.t <= e.growT) {
        const k = e.t / e.growT;
        e.r = e.maxR * (1 - Math.pow(1 - k, 3));
      } else {
        const k = (e.t - e.growT) / e.fadeT;
        e.r = e.maxR * Math.max(0, 1 - k * k);
        if (k >= 1) {
          G.blasts.splice(i, 1);
          continue;
        }
      }
    }
  }

  function smartSteer(m, dt) {
    if (m.kind !== 'smart') return;
    let ax = 0;
    let ay = 0;
    for (let i = 0; i < G.blasts.length; i++) {
      const e = G.blasts[i];
      const dx = m.x - e.x;
      const dy = m.y - e.y;
      const d = hypot(dx, dy) || 1;
      const danger = e.r + 36;
      if (d < danger) {
        const w = (danger - d) / danger;
        ax += dx / d * w * 210;
        ay += dy / d * w * 90;
      }
    }
    const tx = m.tx - m.x;
    const ty = m.ty - m.y;
    const tl = hypot(tx, ty) || 1;
    ax += tx / tl * 40;
    ay += ty / tl * 50;
    m.vx += ax * dt;
    m.vy += ay * dt;
    if (m.vy < 28) m.vy = 28;
    const sp = hypot(m.vx, m.vy) || 1;
    m.vx = m.vx / sp * m.speed;
    m.vy = m.vy / sp * m.speed;
  }

  function hurtFromBlast(e) {
    if (e.kind !== 'warhead' || e.hurt) return;
    if (e.r < e.maxR * 0.42) return;
    e.hurt = true;
    for (let i = 0; i < G.cities.length; i++) {
      const c = G.cities[i];
      if (!c.alive) continue;
      if (hypot(c.x - e.x, c.y - 10 - e.y) < e.r + 14) killCity(c);
    }
    for (let i = 0; i < G.bats.length; i++) {
      const b = G.bats[i];
      if (!b.alive) continue;
      if (hypot(b.x - e.x, b.peak + 6 - e.y) < e.r + 16) killBat(b);
    }
  }

  function updateMissiles(dt) {
    for (let i = G.missiles.length - 1; i >= 0; i--) {
      const m = G.missiles[i];
      smartSteer(m, dt);
      m.x += m.vx * dt;
      m.y += m.vy * dt;

      if (!m.child && !m.didSplit && m.kind === 'split' && m.y >= m.splitY) {
        doSplit(m);
        G.missiles.splice(i, 1);
        continue;
      }

      let eaten = false;
      for (let j = 0; j < G.blasts.length; j++) {
        const e = G.blasts[j];
        const pad = m.kind === 'smart' ? 0.6 : 2.4;
        if (hypot(m.x - e.x, m.y - e.y) <= e.r + pad) {
          killMissile(i, e.kind === 'chain' ? 'chain' : 'abm');
          eaten = true;
          break;
        }
      }
      if (eaten) continue;

      const hitGround = m.y >= GROUND - 6 || hypot(m.x - m.tx, m.y - m.ty) < 8;
      if (hitGround || m.y > VH + 10) {
        detonateWarhead(m);
        G.missiles.splice(i, 1);
      }
    }
  }

  function updateAbms(dt) {
    for (let i = G.abms.length - 1; i >= 0; i--) {
      const a = G.abms[i];
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      const toGo = hypot(a.tx - a.x, a.ty - a.y);
      const along = (a.tx - a.x) * a.vx + (a.ty - a.y) * a.vy;
      if (toGo < a.speed * dt + 4 || along <= 0) {
        detonateAbm(a);
        G.abms.splice(i, 1);
      }
    }
  }

  function updateCarriers(dt) {
    for (let i = G.carriers.length - 1; i >= 0; i--) {
      const c = G.carriers[i];
      c.x += c.vx * dt;
      if (c.flash > 0) c.flash -= dt;
      if (c.x < -50 || c.x > VW + 50) {
        G.carriers.splice(i, 1);
        continue;
      }
      let eaten = false;
      for (let j = 0; j < G.blasts.length; j++) {
        const e = G.blasts[j];
        if (hypot(c.x - e.x, c.y - e.y) <= e.r + 8) {
          killCarrier(i);
          eaten = true;
          break;
        }
      }
      if (eaten) continue;
      if (c.drops > 0 && c.x > 40 && c.x < VW - 40) {
        c.dropWait -= dt;
        if (c.dropWait <= 0) {
          spawnMissile({
            x: c.x,
            y: c.y + 8,
            kind: Math.random() < (isRain() ? 0.35 : 0.12) ? 'smart' : 'plain',
            child: true,
            speed: waveSpeed() * rand(0.95, 1.12)
          });
          c.drops -= 1;
          c.dropWait = rand(0.42, 0.78);
          c.flash = 0.16;
        }
      }
    }
  }

  function updateAim(dt) {
    const spd = 380;
    if (keys.l) G.aim.x -= spd * dt;
    if (keys.r) G.aim.x += spd * dt;
    if (keys.u) G.aim.y -= spd * dt;
    if (keys.d) G.aim.y += spd * dt;
    G.aim.x = clamp(G.aim.x, 10, VW - 10);
    G.aim.y = clamp(G.aim.y, 14, GROUND - 10);
  }

  function waveClear() {
    if (G.spawnLeft > 0 || G.missiles.length || G.abms.length || G.carriers.length) return false;
    for (let i = 0; i < G.blasts.length; i++) {
      if (G.blasts[i].kind === 'warhead') return false;
    }
    return true;
  }

  function updateBonus(dt) {
    const b = G.bonus;
    if (!b) return;
    if (citiesAlive() <= 0) {
      loseRun();
      return;
    }
    b.wait -= dt;
    if (b.wait > 0) return;
    if (b.phase === 'ammo') {
      if (b.ammo > 0) {
        b.ammo -= 1;
        const pts = 5 * G.wmult;
        addScore(pts);
        audio.tick();
        b.total += pts;
        let bat = null;
        for (let i = 0; i < G.bats.length; i++) {
          if (G.bats[i].ammo > 0) {
            G.bats[i].ammo -= 1;
            bat = G.bats[i];
            break;
          }
        }
        floatText(bat ? bat.x : VW * 0.5, GROUND - 52, '+' + pts, GOLD, false);
        b.wait = 0.065;
        syncHud();
        return;
      }
      for (let i = 0; i < G.bats.length; i++) G.bats[i].ammo = 0;
      b.phase = 'city';
      b.wait = 0.22;
      toast('守城奖励', false, true);
      return;
    }
    if (b.phase === 'city') {
      if (b.cities > 0) {
        b.cities -= 1;
        const pts = 120 * G.wmult;
        addScore(pts);
        audio.tick();
        b.total += pts;
        let shown = 0;
        for (let i = 0; i < G.cities.length; i++) {
          if (G.cities[i].alive) {
            if (shown === b.cities) {
              floatText(G.cities[i].x, G.cities[i].y - 38, '+' + pts, GOLD, true);
              G.cities[i].flash = 0.35;
              juice(G.cities[i].x, G.cities[i].y - 18, GOLD, 0.55);
              break;
            }
            shown += 1;
          }
        }
        b.wait = 0.15;
        syncHud();
        return;
      }
      b.phase = 'hold';
      b.wait = 0.82;
      toast('+' + b.total + (b.afterRain ? '  通关' : '  下一波'), false, true);
      return;
    }
    G.mode = 'play';
    if (b.afterRain) {
      winRun();
      return;
    }
    startWave(G.wave + 1);
  }

  function updateDemo(dt) {
    G.spawnWait -= dt;
    if (G.spawnWait <= 0 && G.missiles.length < 6) {
      spawnIncoming();
      G.spawnWait = rand(0.5, 1.1);
    }
    if (ammoLeft() <= 6) refillBats();
    if (G.missiles.length) {
      let threat = G.missiles[0];
      for (let i = 1; i < G.missiles.length; i++) {
        if (G.missiles[i].y > threat.y) threat = G.missiles[i];
      }
      if (threat.y > 140 && ammoLeft() > 0 && Math.random() < 0.05) {
        const lead = 0.32;
        fireAt(threat.x + threat.vx * lead, threat.y + threat.vy * lead);
      }
    }
    if (citiesAlive() <= 2) demoReset();
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    updateFx(dt);
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0 && G.combo) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
    for (let i = 0; i < G.cities.length; i++) {
      const c = G.cities[i];
      if (c.flash > 0) c.flash -= dt;
      if (!c.alive && c.fall > 0 && c.fall < 1) c.fall = Math.min(1, c.fall + dt * 1.8);
    }
    for (let i = 0; i < G.bats.length; i++) {
      if (G.bats[i].flash > 0) G.bats[i].flash -= dt;
    }

    if (G.stop > 0) {
      G.stop -= dt;
      updateBlasts(dt);
      for (let i = G.missiles.length - 1; i >= 0; i--) {
        const m = G.missiles[i];
        for (let j = 0; j < G.blasts.length; j++) {
          const e = G.blasts[j];
          const pad = m.kind === 'smart' ? 0.6 : 2.4;
          if (hypot(m.x - e.x, m.y - e.y) <= e.r + pad) {
            killMissile(i, e.kind === 'chain' ? 'chain' : 'abm');
            break;
          }
        }
      }
      for (let i = G.carriers.length - 1; i >= 0; i--) {
        const c = G.carriers[i];
        for (let j = 0; j < G.blasts.length; j++) {
          const e = G.blasts[j];
          if (hypot(c.x - e.x, c.y - e.y) <= e.r + 8) {
            killCarrier(i);
            break;
          }
        }
      }
      return;
    }

    updateAim(dt);
    updateBlasts(dt);
    for (let i = 0; i < G.blasts.length; i++) hurtFromBlast(G.blasts[i]);
    updateAbms(dt);
    updateMissiles(dt);
    updateCarriers(dt);

    if (G.mode === 'title') {
      updateDemo(dt);
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') return;
    if (G.mode === 'bonus') {
      updateBonus(dt);
      return;
    }
    if (G.dying > 0) {
      G.dying -= dt;
      if (G.dying <= 0) loseRun();
      return;
    }
    if (G.ready > 0) {
      G.ready -= dt;
      return;
    }
    if (G.spawnLeft > 0) {
      G.spawnWait -= dt;
      if (G.spawnWait <= 0) {
        spawnIncoming();
        G.spawnLeft -= 1;
        G.spawnWait = waveInterval() * rand(0.7, 1.16);
      }
      maybeSpawnCarrier();
    } else if (waveClear()) {
      beginBonus();
    }
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#1a0a08');
    g.addColorStop(0.38, '#100604');
    g.addColorStop(1, '#0a0404');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const vg = ctx.createRadialGradient(VW * 0.5, 160, 20, VW * 0.5, 240, 420);
    vg.addColorStop(0, 'rgba(255, 136, 32, 0.1)');
    vg.addColorStop(0.55, 'rgba(255, 61, 184, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, VW, VH);

    if (G.rain) {
      ctx.fillStyle = 'rgba(255, 61, 184, ' + (0.04 + 0.03 * Math.sin(G.t * 6)) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.3 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawGround() {
    ctx.beginPath();
    ctx.moveTo(0, VH);
    ctx.lineTo(0, GROUND + 8);
    ctx.lineTo(BAT_X[0] - 36, GROUND + 4);
    ctx.lineTo(BAT_X[0], GROUND - 8);
    ctx.lineTo(BAT_X[0] + 36, GROUND + 4);
    ctx.lineTo(BAT_X[1] - 48, GROUND + 3);
    ctx.lineTo(BAT_X[1], GROUND - 10);
    ctx.lineTo(BAT_X[1] + 48, GROUND + 3);
    ctx.lineTo(BAT_X[2] - 36, GROUND + 4);
    ctx.lineTo(BAT_X[2], GROUND - 8);
    ctx.lineTo(BAT_X[2] + 36, GROUND + 4);
    ctx.lineTo(VW, GROUND + 8);
    ctx.lineTo(VW, VH);
    ctx.closePath();
    const gg = ctx.createLinearGradient(0, GROUND - 24, 0, VH);
    gg.addColorStop(0, '#2c1410');
    gg.addColorStop(0.45, '#180a08');
    gg.addColorStop(1, '#0c0504');
    ctx.fillStyle = gg;
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.38);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 6);
    ctx.lineTo(VW, GROUND + 6);
    ctx.stroke();
  }

  function drawCity(c) {
    const dead = !c.alive;
    const fall = dead ? Math.min(1, c.fall || 1) : 0;
    const baseX = c.x;
    const baseY = c.y + fall * 6;
    const cols = [
      { w: 8, h: 22, ox: -14 },
      { w: 7, h: 16, ox: -5 },
      { w: 9, h: 30, ox: 3 },
      { w: 6, h: 14, ox: 13 }
    ];
    ctx.save();
    if (c.flash > 0) ctx.globalAlpha = 0.55 + c.flash;
    if (dead) {
      ctx.fillStyle = 'rgba(255, 136, 32, 0.12)';
      ctx.beginPath();
      ctx.ellipse(baseX, c.y - 2, 18, 5, 0, 0, TAU);
      ctx.fill();
      const rubble = [
        { w: 10, h: 7, ox: -12 },
        { w: 8, h: 5, ox: -1 },
        { w: 9, h: 8, ox: 7 },
        { w: 6, h: 4, ox: 16 }
      ];
      for (let i = 0; i < rubble.length; i++) {
        const b = rubble[i];
        ctx.fillStyle = i % 2 ? 'rgba(96, 36, 24, 0.92)' : 'rgba(62, 24, 18, 0.92)';
        ctx.fillRect(baseX + b.ox, c.y - b.h, b.w, b.h);
      }
      ctx.fillStyle = rgba(HOT, 0.35 + 0.22 * Math.sin(G.t * 5 + c.seed));
      ctx.fillRect(baseX - 2, c.y - 6, 2.2, 2.2);
      ctx.fillRect(baseX + 7, c.y - 4, 1.8, 1.8);
      ctx.restore();
      return;
    }
    for (let i = 0; i < cols.length; i++) {
      const b = cols[i];
      const x = baseX + b.ox;
      const y = baseY - b.h;
      ctx.fillStyle = rgba(i % 2 ? GOLD : HOT2, 0.94);
      ctx.fillRect(x, y, b.w, b.h);
      ctx.fillStyle = rgba(CYN, 0.42 + 0.28 * Math.sin(G.t * 3 + c.seed + i));
      ctx.fillRect(x + 1.8, y + 3, 1.6, 1.6);
      ctx.fillRect(x + 1.8, y + 8, 1.6, 1.6);
      if (b.h > 18) ctx.fillRect(x + 4.5, y + 5, 1.6, 1.6);
    }
    ctx.fillStyle = rgba(GOLD, 0.16);
    ctx.beginPath();
    ctx.ellipse(baseX, baseY - 6, 18, 6, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBat(b, idx) {
    const peak = b.peak;
    const wide = idx === 1 ? 32 : 24;
    ctx.beginPath();
    ctx.moveTo(b.x - wide, b.y + 2);
    ctx.lineTo(b.x, peak);
    ctx.lineTo(b.x + wide, b.y + 2);
    ctx.closePath();
    ctx.fillStyle = b.alive ? (idx === 1 ? '#3a1810' : '#2a1210') : '#161014';
    ctx.fill();
    ctx.strokeStyle = rgba(b.alive ? HOT : MAG, b.flash > 0 ? 0.92 : 0.55);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    if (!b.alive) {
      ctx.fillStyle = rgba(MAG, 0.25);
      ctx.beginPath();
      ctx.ellipse(b.x, b.y - 4, 16, 5, 0, 0, TAU);
      ctx.fill();
      return;
    }
    const cols = 5;
    const rows = 2;
    const startY = peak + 10;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n = r * cols + c;
        const lit = n < b.ammo;
        ctx.fillStyle = lit ? rgba(CYN, 0.92) : 'rgba(40, 18, 14, 0.7)';
        ctx.fillRect(b.x - 11 + c * 5, startY + r * 6.4, 3.4, 3.8);
      }
    }
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.beginPath();
    ctx.arc(b.x, peak + 1, 2.3, 0, TAU);
    ctx.fill();
  }

  function drawCarrier(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    if (c.vx < 0) ctx.scale(-1, 1);
    if (c.kind === 'bomber') {
      ctx.fillStyle = rgba(HOT2, c.flash > 0 ? 1 : 0.9);
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(16, -3);
      ctx.lineTo(18, 0);
      ctx.lineTo(12, 4);
      ctx.lineTo(-14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.fillRect(-4, -2, 10, 2);
      ctx.strokeStyle = rgba(HOT, 0.7);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-6, 2);
      ctx.lineTo(-16, 8);
      ctx.moveTo(4, 2);
      ctx.lineTo(10, 8);
      ctx.stroke();
    } else {
      ctx.strokeStyle = rgba(CYN, 0.85);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-4, 0);
      ctx.moveTo(4, 0);
      ctx.lineTo(12, 0);
      ctx.stroke();
      ctx.fillStyle = rgba(PUR, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTrails() {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < G.missiles.length; i++) {
      const m = G.missiles[i];
      ctx.beginPath();
      ctx.moveTo(m.x0, m.y0);
      ctx.lineTo(m.x, m.y);
      ctx.strokeStyle = rgba(m.rgb, 0.74);
      ctx.lineWidth = m.kind === 'smart' ? 2.6 : 1.9;
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.22);
      ctx.lineWidth = 0.7;
      ctx.stroke();
      if (m.kind === 'smart') {
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(G.t * 4);
        ctx.strokeStyle = rgba(MAG, 0.9);
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(5, 0);
        ctx.lineTo(0, 6);
        ctx.lineTo(-5, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = rgba(WHT, 0.95);
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2.2, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(WHT, 0.95);
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2.7, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.abms.length; i++) {
      const a = G.abms[i];
      ctx.beginPath();
      ctx.moveTo(a.x0, a.y0);
      ctx.lineTo(a.x, a.y);
      ctx.strokeStyle = rgba(CYN, 0.82);
      ctx.lineWidth = 2.3;
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 1);
      ctx.beginPath();
      ctx.arc(a.x, a.y, 2.9, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBlasts() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.blasts.length; i++) {
      const e = G.blasts[i];
      const fade = e.t > e.growT ? Math.max(0.18, 1 - (e.t - e.growT) / e.fadeT) : 1;
      const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, Math.max(1, e.r));
      grd.addColorStop(0, rgba(WHT, 0.95 * fade));
      grd.addColorStop(0.22, rgba(e.rgb, 0.72 * fade));
      grd.addColorStop(0.55, rgba(HOT, 0.32 * fade));
      grd.addColorStop(1, rgba(e.rgb, 0));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.55 * fade);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(e.rgb, 0.35 * fade);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 3, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.4;
      ctx.strokeStyle = rgba(s.rgb, 0.65 * (1 - k));
      ctx.lineWidth = 2.6 - k;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.rad * 0.35 + k * s.rad * 1.15, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const k = s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, 0.42 * (1 - k));
      ctx.lineWidth = 2.2 - k * 1.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r + k * 30, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(1 - f.t / f.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, 1);
      ctx.font = '700 ' + f.size + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.restore();
  }

  function drawTargets() {
    ctx.save();
    ctx.lineWidth = 1.2;
    for (let i = 0; i < G.abms.length; i++) {
      const a = G.abms[i];
      const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 10 + i));
      ctx.strokeStyle = rgba(CYN, 0.55 * pulse);
      const s = 6;
      ctx.strokeRect(a.tx - s, a.ty - s, s * 2, s * 2);
      ctx.beginPath();
      ctx.moveTo(a.tx - 9, a.ty);
      ctx.lineTo(a.tx + 9, a.ty);
      ctx.moveTo(a.tx, a.ty - 9);
      ctx.lineTo(a.tx, a.ty + 9);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAim() {
    if (G.mode === 'win' || G.mode === 'lose' || G.dying > 0) return;
    const x = G.aim.x;
    const y = G.aim.y;
    const pulse = 0.65 + 0.35 * Math.sin(G.t * 8);
    ctx.save();
    ctx.strokeStyle = rgba(GOLD, 0.35 * pulse);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    ctx.lineTo(x + 10, y);
    ctx.lineTo(x, y + 14);
    ctx.lineTo(x - 10, y);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = rgba(CYN, 0.7 * pulse);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.lineTo(x - 4, y);
    ctx.moveTo(x + 4, y);
    ctx.lineTo(x + 12, y);
    ctx.moveTo(x, y - 12);
    ctx.lineTo(x, y - 4);
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x, y + 12);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBonusMark() {
    if (G.mode !== 'bonus' || !G.bonus) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(GOLD, 0.88);
    ctx.font = '700 18px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    const label = G.bonus.phase === 'ammo'
      ? '余弹 ×' + G.wmult
      : G.bonus.phase === 'city'
        ? '守城 ×' + G.wmult
        : (G.bonus.afterRain ? '通关' : '下一波');
    ctx.fillText(label, VW * 0.5, 108);
    ctx.restore();
  }

  function drawWorld() {
    drawBg();
    drawTrails();
    for (let i = 0; i < G.carriers.length; i++) drawCarrier(G.carriers[i]);
    drawTargets();
    drawBlasts();
    drawGround();
    for (let i = 0; i < G.cities.length; i++) drawCity(G.cities[i]);
    for (let i = 0; i < G.bats.length; i++) drawBat(G.bats[i], i);
    drawParticles();
    drawFloats();
    drawAim();
    drawBonusMark();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.22);
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = '#0a0503';
    ctx.fillRect(0, 0, view.w, view.h);

    const shx = G.shake && !REDUCE ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake && !REDUCE ? rand(-G.shake, G.shake) : 0;
    const punch = REDUCE ? 1 : G.punch;
    const rw = VW * view.scale;
    const rh = VH * view.scale;

    ctx.save();
    ctx.beginPath();
    roundRect(view.ox, view.oy, rw, rh, 14);
    ctx.clip();
    ctx.translate(view.ox + shx + rw * 0.5, view.oy + shy + rh * 0.5);
    ctx.scale(view.scale * punch, view.scale * punch);
    ctx.translate(-VW * 0.5, -VH * 0.5);
    drawWorld();
    ctx.restore();
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - view.ox) / view.scale,
      y: (e.clientY - rect.top - view.oy) / view.scale
    };
  }

  function firePointer() {
    fireAt(G.aim.x, G.aim.y);
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('mslc');
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function onEndModes() {
    audio.ensure();
    if (G.mode === 'win' && !isRain()) startGame('rain');
    else goTitle();
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) e.preventDefault();
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) e.preventDefault();
    }
    if (k === ' ' || k === 'Spacebar') e.preventDefault();
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      if (!e.repeat) {
        audio.ensure();
        restart();
      }
      return;
    }
    if (k === '1' || k === 'Digit1') {
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
        audio.ensure();
        startGame('mslc');
      }
      return;
    }
    if (k === '2' || k === 'Digit2') {
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
        audio.ensure();
        startGame('rain');
      }
      return;
    }
    if (k === 'Enter') {
      e.preventDefault();
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      if (overlayOpen() && (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose')) {
        primaryAction();
        return;
      }
      firePointer();
    }
  }

  function resize() {
    if (!canvas || !ctx) return;
    const parent = canvas.parentElement || stageEl;
    const rect = parent.getBoundingClientRect();
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    canvas.width = Math.max(1, (view.w * view.dpr) | 0);
    canvas.height = Math.max(1, (view.h * view.dpr) | 0);
    canvas.style.width = view.w + 'px';
    canvas.style.height = view.h + 'px';
    view.scale = Math.min(view.w / VW, view.h / VH);
    view.ox = (view.w - VW * view.scale) * 0.5;
    view.oy = (view.h - VH * view.scale) * 0.5;
  }

  if (!hasDom || !canvas || !ctx) return;

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }
  loadBest();
  seedStars();
  makeCities();
  makeBats();
  goTitle();
  resize();

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    G.aim.x = clamp(w.x, 10, VW - 10);
    G.aim.y = clamp(w.y, 14, GROUND - 10);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (G.mode === 'play' || G.mode === 'title') firePointer();
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    if (e.pointerType === 'mouse') pointer.hover = true;
    if (G.mode === 'play' || G.mode === 'title' || G.mode === 'bonus') {
      G.aim.x = clamp(w.x, 10, VW - 10);
      G.aim.y = clamp(w.y, 14, GROUND - 10);
    }
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    if (e.pointerType !== 'mouse') pointer.hover = false;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') pointer.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
  });
  window.addEventListener('resize', resize);

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
  });

  if (btnMslc) btnMslc.addEventListener('click', function () {
    audio.ensure();
    startGame('mslc');
  });
  if (btnRain) btnRain.addEventListener('click', function () {
    audio.ensure();
    startGame('rain');
  });
  if (ovRetry) ovRetry.addEventListener('click', function () {
    audio.ensure();
    restart();
  });
  if (ovModes) ovModes.addEventListener('click', onEndModes);
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (btnRetry) btnRetry.addEventListener('click', function () {
    audio.ensure();
    restart();
  });

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const t = now / 1000;
    if (hidden) {
      last = t;
      return;
    }
    if (!last) last = t;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
  }
  requestAnimationFrame(frame);
})();
