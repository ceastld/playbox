'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GROUND = 676;
  const AMMO = 10;
  const CITY_N = 6;
  const COMBO_WIN = 0.78;
  const CITY_X = [90, 138, 186, 294, 342, 390];
  const BAT_X = [40, 240, 440];
  const BEST_KEY = 'playbox-miss-cmd-best';
  const MUTE_KEY = 'playbox-miss-cmd-mute';
  const OPS = '点按瞄准开火 · ← → ↑ ↓ 准星 · 空格发射 · 1 2 3 选炮 · R 重开';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 74, 40];
  const HOT2 = [255, 138, 74];
  const WHT = [246, 243, 255];
  const PUR = [155, 92, 255];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnClassic = document.getElementById('btn-classic');
  const btnMeteor = document.getElementById('btn-meteor');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const ammoLabel = document.getElementById('ammo-label');
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
    kind: 'classic',
    t: 0,
    clock: 0,
    wave: 1,
    score: 0,
    best: 0,
    bestC: 0,
    bestM: 0,
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
    aim: { x: VW * 0.5, y: 280 },
    bonus: null
  };

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
  function sx(x) { return ox + x * scale; }
  function sy(y) { return oy + y * scale; }
  function isMeteor() { return G.kind === 'meteor'; }
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
        this.master.gain.value = this.muted ? 0 : 0.38;
        this.master.connect(this.ctx.destination);
      } catch (err) {
        this.ctx = null;
        this.master = null;
      }
    },
    setMuted(m) {
      this.muted = !!m;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.38;
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
      this.beep(220, 0.09, 'sawtooth', 0.03, 880);
      this.beep(640, 0.07, 'square', 0.028, 1400);
    },
    boom() {
      this.ensure();
      this.noise(0.16, 0.07, 280);
      this.beep(140, 0.18, 'sine', 0.06, 48);
      this.beep(90, 0.22, 'triangle', 0.04, 40);
    },
    intercept(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.7, combo * 0.07);
      this.noise(0.055, 0.05, 1100);
      this.beep(520 * lift, 0.07, 'square', 0.055, 980 * lift);
      this.beep(880 * lift, 0.1, 'triangle', 0.04, 1320 * lift);
      if (combo >= 3) this.beep(1240, 0.12, 'sine', 0.035, 1760);
    },
    combo(n) {
      this.ensure();
      this.beep(392 * n, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1176);
    },
    split() {
      this.ensure();
      this.beep(980, 0.06, 'square', 0.03, 420);
      this.beep(640, 0.08, 'sawtooth', 0.025, 220);
    },
    city() {
      this.ensure();
      this.noise(0.28, 0.09, 180);
      this.beep(180, 0.32, 'sawtooth', 0.07, 46);
      this.beep(90, 0.42, 'sine', 0.06, 36);
    },
    empty() {
      this.ensure();
      this.beep(90, 0.05, 'square', 0.03);
      this.beep(70, 0.07, 'triangle', 0.02);
    },
    tick() {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.028);
    },
    bonus() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.035, 659);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'sine', 0.04, 659);
      this.beep(784, 0.18, 'triangle', 0.045, 1046);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 660);
      this.beep(660, 0.12, 'triangle', 0.035, 990);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.22, 'sawtooth', 0.05, 80);
      this.beep(110, 0.38, 'sine', 0.055, 40);
    }
  };

  function loadBest() {
    G.bestC = 0;
    G.bestM = 0;
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw && raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.bestC = Math.max(0, parseInt(o.c, 10) || 0);
        G.bestM = Math.max(0, parseInt(o.m, 10) || 0);
      } else {
        const n = parseInt(raw || '0', 10);
        G.bestC = isFinite(n) && n > 0 ? n : 0;
      }
    } catch (err) {
      G.bestC = 0;
      G.bestM = 0;
    }
    G.best = Math.max(G.bestC, G.bestM);
    if (bestEl) bestEl.textContent = String(modeBest());
  }

  function modeBest() {
    if (G.mode === 'title') return Math.max(G.bestC, G.bestM);
    return isMeteor() ? G.bestM : G.bestC;
  }

  function saveBest() {
    if (isMeteor()) {
      if (G.score > G.bestM) G.bestM = G.score;
    } else if (G.score > G.bestC) {
      G.bestC = G.score;
    }
    G.best = Math.max(G.bestC, G.bestM);
    if (bestEl) bestEl.textContent = String(modeBest());
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, m: G.bestM }));
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
    G.toastT = 1.4;
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
    return Math.min(6, 1 + Math.floor((G.wave - 1) / 2));
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(modeBest());
    const ammo = ammoLeft();
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '防空';
      else if (G.mode === 'bonus') stageLabel.textContent = '结算';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 5);
    }
    if (tagLabel) {
      tagLabel.textContent = isMeteor() ? '流星' : '经典';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || citiesAlive() <= 1);
      tagLabel.classList.toggle('hot', G.combo >= 4);
    }
    if (ammoLabel) {
      ammoLabel.textContent = '弹 ' + ammo;
      ammoLabel.classList.toggle('warn', G.mode === 'play' && ammo <= 5);
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
    else if (G.mode === 'lose') setHint('R 重开 · 六城全毁即负', 'warn');
    else if (G.mode === 'bonus') setHint('余弹与守城结算中', 'hot');
    else if (citiesAlive() === 1) setHint('最后一座城 · 别漏', 'warn');
    else if (ammo <= 4 && G.mode === 'play') setHint('弹药告急 · 瞄准再打', 'warn');
    else setHint('点按开火 · 火球吞弹 · R 重开', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'MISSILE';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnClassic.textContent = primary;
    btnMeteor.classList.remove('hidden');
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
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
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
    capArr(particles, 320);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 40);
    capArr(rings, 28);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      text: text,
      rgb: rgb,
      t: 0,
      life: gold ? 0.95 : 0.68,
      size: gold ? 20 : 14,
      gold: !!gold,
      vy: gold ? -90 : -72
    });
    capArr(floats, 28);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(10 + (p * 12) | 0, {
      x: x, y: y, j: 7 + p * 6,
      vx0: -220 * p, vx1: 220 * p, vy0: -260 * p, vy1: 110 * p,
      life: 0.3 + p * 0.16, r0: 1.1, r1: 2.8 + p, rgb: rgb, g: 280
    });
    popSpark(x, y, rgb, 12 + p * 14);
    screenFlash(rgb, 0.2 + p * 0.18);
    kick(2.2 + p * 2.6);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 52; i++) {
      stars.push({
        x: rand(6, VW - 6),
        y: rand(8, GROUND - 40),
        r: rand(0.45, 1.55),
        a: rand(0.12, 0.55),
        p: rand(0, TAU),
        rgb: i % 6 === 0 ? HOT : i % 4 === 0 ? CYN : WHT
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
        seed: i * 17 + 3
      });
    }
  }

  function makeBats() {
    G.bats = [];
    for (let i = 0; i < 3; i++) {
      G.bats.push({
        x: BAT_X[i],
        y: GROUND,
        peak: GROUND - (i === 1 ? 38 : 32),
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
    if (!opts.length) return { x: rand(40, VW - 40), y: GROUND, kind: 'ground', id: -1 };
    return opts[irand(0, opts.length - 1)];
  }

  function waveCount() {
    const n = 7 + G.wave * 2;
    return Math.min(isMeteor() ? 22 : 20, n);
  }

  function waveSpeed() {
    const s = 76 + (G.wave - 1) * 12;
    return Math.min(isMeteor() ? 188 : 168, s * (isMeteor() ? 1.12 : 1));
  }

  function waveInterval() {
    const t = 0.94 - (G.wave - 1) * 0.07;
    return Math.max(isMeteor() ? 0.24 : 0.28, t * (isMeteor() ? 0.82 : 1));
  }

  function splitChance() {
    if (isMeteor()) return clamp(0.4 + (G.wave - 1) * 0.055, 0.4, 0.82);
    if (G.wave < 2) return 0;
    return clamp(0.1 + (G.wave - 2) * 0.055, 0.1, 0.58);
  }

  function smartChance() {
    if (isMeteor()) return clamp(0.12 + (G.wave - 1) * 0.035, 0.12, 0.42);
    if (G.wave < 3) return 0;
    return clamp(0.06 + (G.wave - 3) * 0.04, 0.06, 0.32);
  }

  function spawnMissile(opt) {
    const tgt = (opt && opt.tgt) || pickTarget();
    const x0 = opt && opt.x != null ? opt.x : rand(18, VW - 18);
    const y0 = opt && opt.y != null ? opt.y : rand(-8, 10);
    const kind = (opt && opt.kind) || 'plain';
    const speed = (opt && opt.speed) || waveSpeed() * rand(0.88, 1.12);
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
      splitY: rand(210, 390),
      splitN: G.wave >= 5 ? 3 : 2,
      didSplit: false,
      trail: [],
      tgtKind: tgt.kind,
      tgtId: tgt.id,
      child: !!(opt && opt.child)
    });
  }

  function spawnIncoming() {
    const roll = Math.random();
    let kind = 'plain';
    if (roll < smartChance()) kind = 'smart';
    else if (roll < smartChance() + splitChance()) kind = 'split';
    spawnMissile({ kind: kind });
  }

  function spawnBlast(x, y, maxR, rgb, kind) {
    G.blasts.push({
      x: x,
      y: y,
      r: 4,
      maxR: maxR,
      t: 0,
      growT: kind === 'chain' ? 0.12 : 0.22,
      fadeT: kind === 'chain' ? 0.42 : 0.7,
      rgb: rgb,
      kind: kind,
      hurt: false
    });
    capArr(G.blasts, 36);
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

  function fireAt(tx, ty, batIndex) {
    if (G.mode !== 'play' && G.mode !== 'title') return false;
    if (G.mode === 'play' && G.dying > 0) return false;
    if (G.fireCd > 0) return false;
    tx = clamp(tx, 10, VW - 10);
    ty = clamp(ty, 16, GROUND - 10);
    let i = batIndex;
    const specified = i != null && i >= 0 && i <= 2;
    if (!specified) i = nearestBattery(tx, ty);
    else if (!G.bats[i] || !G.bats[i].alive || G.bats[i].ammo <= 0) i = -1;
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
    G.fireCd = 0.05;
    const speed = i === 1 ? 580 : 440;
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
      trail: [],
      rgb: i === 1 ? WHT : CYN
    });
    audio.launch();
    emit(6, {
      x: b.x, y: b.peak, j: 3,
      vx0: -40, vx1: 40, vy0: -90, vy1: -20,
      life: 0.22, r0: 1, r1: 2.2, rgb: CYN, g: 80
    });
    b.flash = 0.18;
    syncHud();
    return true;
  }

  function firePointer() {
    fireAt(G.aim.x, G.aim.y, -1);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = comboMult();
    if (comboEl && G.combo >= 2) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
      comboTok += 1;
    }
    syncHud();
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
    const pts = 25 * G.wmult * G.mult;
    addScore(pts);
    const gold = G.combo >= 3;
    floatText(m.x, m.y - 8, '+' + pts, gold ? GOLD : CYN, gold);
    if (G.combo === 3) floatText(m.x, m.y - 26, '三连', GOLD, true);
    else if (G.combo === 5) floatText(m.x, m.y - 26, '五连', GOLD, true);
    else if (G.combo === 8) floatText(m.x, m.y - 26, '火网', GOLD, true);
    juice(m.x, m.y, cause === 'chain' ? GOLD : CYN, 0.85 + Math.min(0.9, G.combo * 0.1));
    hitStop(clamp(0.038 + G.combo * 0.005, 0.038, 0.078));
    audio.intercept(G.combo);
    if (G.combo === 3 || G.combo === 5 || G.combo === 8) audio.combo(Math.min(4, G.mult));
    if (cause !== 'chain') {
      spawnBlast(m.x, m.y, 18 + Math.min(8, G.combo), CYN, 'chain');
    } else {
      spawnBlast(m.x, m.y, 14, GOLD, 'chain');
    }
  }

  function killCity(c) {
    if (!c.alive) return;
    c.alive = false;
    c.fall = 0.01;
    audio.city();
    juice(c.x, c.y - 16, HOT, 1.35);
    emit(16, {
      x: c.x, y: c.y - 10, j: 10,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      life: 0.7, r0: 1.4, r1: 3.4, rgb: GOLD, g: 520
    });
    hitStop(0.075);
    kick(7.2);
    screenFlash(HOT, 0.58);
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
    spawnBlast(a.tx, a.ty, 44, a.rgb === WHT ? WHT : CYN, 'abm');
    audio.boom();
    popSpark(a.tx, a.ty, CYN, 22);
    kick(2.6);
    screenFlash(CYN, 0.22);
  }

  function detonateWarhead(m) {
    spawnBlast(m.x, m.y, 24, m.rgb, 'warhead');
    audio.boom();
    juice(m.x, m.y, m.rgb, 0.85);
    kick(4.4);
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
        speed: m.speed * rand(1.05, 1.22),
        tgt: pickTarget()
      });
    }
    emit(8, {
      x: m.x, y: m.y, j: 4,
      vx0: -80, vx1: 80, vy0: -40, vy1: 80,
      life: 0.22, r0: 1, r1: 2, rgb: m.rgb, g: 40
    });
  }

  function startWave(n) {
    G.wave = n;
    G.wmult = waveMult();
    G.ready = 0.42;
    G.spawnLeft = waveCount();
    G.spawnWait = 0.18;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.missiles.length = 0;
    G.abms.length = 0;
    G.blasts.length = 0;
    G.bonus = null;
    refillBats();
    toast('第 ' + G.wave + ' 波' + (G.wmult > 1 ? '  ×' + G.wmult : ''), false, G.wave % 2 === 1);
    if (G.wave > 1) audio.wave();
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
      total: 0
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
    showOverlay('lose', '城破了', lead, '再来');
    btnMeteor.textContent = '换模式';
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'meteor' ? 'meteor' : 'classic';
    G.mode = 'play';
    G.wave = 1;
    G.score = 0;
    G.nextCity = 10000;
    G.dying = 0;
    G.aim.x = VW * 0.5;
    G.aim.y = 260;
    makeCities();
    makeBats();
    resetFx();
    hideOverlay();
    audio.start();
    startWave(1);
    toast(isMeteor() ? '流星 · 分裂更多' : '经典 · 护住六城', false, !isMeteor());
    syncHud();
  }

  function demoReset() {
    makeCities();
    makeBats();
    G.missiles.length = 0;
    G.abms.length = 0;
    G.blasts.length = 0;
    G.wave = 1;
    G.wmult = 1;
    G.spawnLeft = 6;
    G.spawnWait = 0.4;
    G.ready = 0;
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'classic';
    G.wave = 1;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.dying = 0;
    G.bonus = null;
    demoReset();
    resetFx();
    showOverlay('title', '防空', '炸掉落弹，护住六城。', '经典');
    btnMeteor.textContent = '流星';
    btnMeteor.classList.remove('hidden');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('classic');
    else startGame(G.kind || 'classic');
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
      const danger = e.r + 30;
      if (d < danger) {
        const w = (danger - d) / danger;
        ax += dx / d * w * 140;
        ay += dy / d * w * 80;
      }
    }
    m.vx += ax * dt;
    m.vy += ay * dt;
    const sp = hypot(m.vx, m.vy) || 1;
    const want = m.speed;
    m.vx = m.vx / sp * want;
    m.vy = m.vy / sp * want;
  }

  function hurtFromBlast(e) {
    if (e.kind !== 'warhead' || e.hurt) return;
    if (e.r < e.maxR * 0.42) return;
    e.hurt = true;
    for (let i = 0; i < G.cities.length; i++) {
      const c = G.cities[i];
      if (!c.alive) continue;
      if (hypot(c.x - e.x, c.y - 10 - e.y) < e.r + 12) killCity(c);
    }
    for (let i = 0; i < G.bats.length; i++) {
      const b = G.bats[i];
      if (!b.alive) continue;
      if (hypot(b.x - e.x, b.peak + 6 - e.y) < e.r + 14) killBat(b);
    }
  }

  function updateMissiles(dt) {
    for (let i = G.missiles.length - 1; i >= 0; i--) {
      const m = G.missiles[i];
      smartSteer(m, dt);
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.trail.push({ x: m.x, y: m.y });
      if (m.trail.length > 16) m.trail.shift();

      if (!m.child && !m.didSplit && (m.kind === 'split' || m.kind === 'smart') && m.y >= m.splitY) {
        doSplit(m);
        G.missiles.splice(i, 1);
        continue;
      }

      let eaten = false;
      for (let j = 0; j < G.blasts.length; j++) {
        const e = G.blasts[j];
        if (hypot(m.x - e.x, m.y - e.y) <= e.r + 2.2) {
          killMissile(i, e.kind === 'chain' ? 'chain' : 'abm');
          eaten = true;
          break;
        }
      }
      if (eaten) continue;

      const hitGround = m.y >= GROUND - 6 || hypot(m.x - m.tx, m.y - m.ty) < 7;
      if (hitGround || m.y > VH + 8) {
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
      a.trail.push({ x: a.x, y: a.y });
      if (a.trail.length > 10) a.trail.shift();
      const toGo = hypot(a.tx - a.x, a.ty - a.y);
      const along = (a.tx - a.x) * a.vx + (a.ty - a.y) * a.vy;
      if (toGo < a.speed * dt + 4 || along <= 0) {
        detonateAbm(a);
        G.abms.splice(i, 1);
      }
    }
  }

  function updateAim(dt) {
    const spd = 340;
    if (keys.l) G.aim.x -= spd * dt;
    if (keys.r) G.aim.x += spd * dt;
    if (keys.u) G.aim.y -= spd * dt;
    if (keys.d) G.aim.y += spd * dt;
    G.aim.x = clamp(G.aim.x, 8, VW - 8);
    G.aim.y = clamp(G.aim.y, 12, GROUND - 8);
  }

  function waveClear() {
    return G.spawnLeft <= 0 && G.missiles.length === 0 && G.abms.length === 0;
  }

  function updateBonus(dt) {
    const b = G.bonus;
    if (!b) return;
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
        floatText(bat ? bat.x : VW * 0.5, GROUND - 48, '+' + pts, GOLD, false);
        b.wait = 0.07;
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
        const pts = 100 * G.wmult;
        addScore(pts);
        audio.tick();
        b.total += pts;
        let shown = 0;
        for (let i = 0; i < G.cities.length; i++) {
          if (G.cities[i].alive) {
            if (shown === b.cities) {
              floatText(G.cities[i].x, G.cities[i].y - 36, '+' + pts, GOLD, true);
              G.cities[i].flash = 0.35;
              juice(G.cities[i].x, G.cities[i].y - 18, GOLD, 0.55);
              break;
            }
            shown += 1;
          }
        }
        b.wait = 0.16;
        syncHud();
        return;
      }
      b.phase = 'hold';
      b.wait = 0.85;
      toast('+' + b.total + '  下一波', false, true);
      return;
    }
    G.mode = 'play';
    startWave(G.wave + 1);
  }

  function updateDemo(dt) {
    G.spawnWait -= dt;
    if (G.spawnWait <= 0 && G.missiles.length < 5) {
      spawnIncoming();
      G.spawnWait = rand(0.55, 1.15);
    }
    if (ammoLeft() <= 4) refillBats();
    if (G.missiles.length) {
      let threat = G.missiles[0];
      for (let i = 1; i < G.missiles.length; i++) {
        if (G.missiles[i].y > threat.y) threat = G.missiles[i];
      }
      if (threat.y > 160 && ammoLeft() > 0 && Math.random() < 0.045) {
        const lead = 0.35;
        fireAt(threat.x + threat.vx * lead, threat.y + threat.vy * lead, -1);
      }
    }
    if (citiesAlive() <= 1) demoReset();
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
      return;
    }

    updateAim(dt);
    updateBlasts(dt);
    for (let i = 0; i < G.blasts.length; i++) hurtFromBlast(G.blasts[i]);
    updateAbms(dt);
    updateMissiles(dt);

    if (G.mode === 'title') {
      updateDemo(dt);
      return;
    }

    if (G.mode === 'lose') return;

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
        G.spawnWait = waveInterval() * rand(0.72, 1.18);
      }
    } else if (waveClear()) {
      beginBonus();
    }
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#12060c');
    g.addColorStop(0.42, '#08040e');
    g.addColorStop(1, '#05030c');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(240), sy(180), 10 * scale, sx(240), sy(260), 340 * scale);
    vg.addColorStop(0, 'rgba(255, 74, 40, 0.1)');
    vg.addColorStop(0.55, 'rgba(255, 61, 184, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.3 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawGround() {
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(VH));
    ctx.lineTo(sx(0), sy(GROUND + 6));
    ctx.lineTo(sx(18), sy(GROUND + 2));
    ctx.lineTo(sx(BAT_X[0] - 22), sy(GROUND + 4));
    ctx.lineTo(sx(BAT_X[0]), sy(GROUND - 6));
    ctx.lineTo(sx(BAT_X[0] + 22), sy(GROUND + 4));
    ctx.lineTo(sx(120), sy(GROUND + 2));
    ctx.lineTo(sx(BAT_X[1] - 28), sy(GROUND + 4));
    ctx.lineTo(sx(BAT_X[1]), sy(GROUND - 8));
    ctx.lineTo(sx(BAT_X[1] + 28), sy(GROUND + 4));
    ctx.lineTo(sx(360), sy(GROUND + 2));
    ctx.lineTo(sx(BAT_X[2] - 22), sy(GROUND + 4));
    ctx.lineTo(sx(BAT_X[2]), sy(GROUND - 6));
    ctx.lineTo(sx(BAT_X[2] + 22), sy(GROUND + 4));
    ctx.lineTo(sx(VW), sy(GROUND + 6));
    ctx.lineTo(sx(VW), sy(VH));
    ctx.closePath();
    const gg = ctx.createLinearGradient(sx(0), sy(GROUND - 20), sx(0), sy(VH));
    gg.addColorStop(0, '#2a1014');
    gg.addColorStop(0.45, '#14080c');
    gg.addColorStop(1, '#08040a');
    ctx.fillStyle = gg;
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.35);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(GROUND + 5));
    ctx.lineTo(sx(VW), sy(GROUND + 5));
    ctx.stroke();
  }

  function drawCity(c) {
    const dead = !c.alive;
    const fall = dead ? Math.min(1, c.fall || 1) : 0;
    const baseX = c.x;
    const baseY = c.y + fall * 6;
    const cols = [
      { w: 7, h: 20, ox: -11 },
      { w: 6, h: 14, ox: -3 },
      { w: 8, h: 26, ox: 4 },
      { w: 5, h: 12, ox: 13 }
    ];
    ctx.save();
    if (c.flash > 0) ctx.globalAlpha = 0.55 + c.flash;
    if (dead) {
      ctx.fillStyle = 'rgba(255, 74, 40, 0.12)';
      ctx.beginPath();
      ctx.ellipse(sx(baseX), sy(c.y - 2), 16 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      const rubble = [
        { w: 9, h: 6, ox: -10 },
        { w: 7, h: 4, ox: -1 },
        { w: 8, h: 7, ox: 6 },
        { w: 5, h: 3, ox: 14 }
      ];
      for (let i = 0; i < rubble.length; i++) {
        const b = rubble[i];
        ctx.fillStyle = i % 2 ? 'rgba(90, 32, 40, 0.9)' : 'rgba(58, 22, 30, 0.9)';
        ctx.fillRect(sx(baseX + b.ox), sy(c.y - b.h), b.w * scale, b.h * scale);
      }
      ctx.fillStyle = rgba(HOT, 0.35 + 0.2 * Math.sin(G.t * 5 + c.seed));
      ctx.fillRect(sx(baseX - 2), sy(c.y - 5), 2 * scale, 2 * scale);
      ctx.fillRect(sx(baseX + 6), sy(c.y - 3), 1.6 * scale, 1.6 * scale);
      ctx.restore();
      return;
    }
    for (let i = 0; i < cols.length; i++) {
      const b = cols[i];
      const h = b.h;
      const x = baseX + b.ox;
      const y = baseY - h;
      ctx.fillStyle = rgba(i % 2 ? GOLD : HOT2, 0.92);
      ctx.fillRect(sx(x), sy(y), b.w * scale, h * scale);
      ctx.fillStyle = rgba(CYN, 0.45 + 0.25 * Math.sin(G.t * 3 + c.seed + i));
      ctx.fillRect(sx(x + 1.5), sy(y + 3), 1.4 * scale, 1.4 * scale);
      ctx.fillRect(sx(x + 1.5), sy(y + 8), 1.4 * scale, 1.4 * scale);
      if (h > 16) ctx.fillRect(sx(x + 4), sy(y + 5), 1.4 * scale, 1.4 * scale);
    }
    ctx.fillStyle = rgba(GOLD, 0.18);
    ctx.beginPath();
    ctx.ellipse(sx(baseX), sy(baseY - 6), 16 * scale, 6 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBat(b, idx) {
    const peak = b.peak;
    ctx.beginPath();
    ctx.moveTo(sx(b.x - (idx === 1 ? 26 : 20)), sy(b.y + 2));
    ctx.lineTo(sx(b.x), sy(peak));
    ctx.lineTo(sx(b.x + (idx === 1 ? 26 : 20)), sy(b.y + 2));
    ctx.closePath();
    ctx.fillStyle = b.alive ? (idx === 1 ? '#3a1420' : '#2c1018') : '#161018';
    ctx.fill();
    ctx.strokeStyle = rgba(b.alive ? HOT : MAG, b.flash > 0 ? 0.9 : 0.55);
    ctx.lineWidth = 1.3 * scale;
    ctx.stroke();
    if (!b.alive) {
      ctx.fillStyle = rgba(MAG, 0.25);
      ctx.beginPath();
      ctx.ellipse(sx(b.x), sy(b.y - 4), 14 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      return;
    }
    const rows = 2;
    const cols = 5;
    const startY = peak + 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const n = r * cols + c;
        const lit = n < b.ammo;
        ctx.fillStyle = lit ? rgba(CYN, 0.9) : 'rgba(40, 20, 28, 0.7)';
        const px = b.x - 9 + c * 4.5;
        const py = startY + r * 6;
        ctx.fillRect(sx(px), sy(py), 3 * scale, 3.4 * scale);
      }
    }
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.beginPath();
    ctx.arc(sx(b.x), sy(peak + 1), 2.1 * scale, 0, TAU);
    ctx.fill();
  }

  function drawTrails() {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < G.missiles.length; i++) {
      const m = G.missiles[i];
      ctx.beginPath();
      ctx.moveTo(sx(m.x0), sy(m.y0));
      ctx.lineTo(sx(m.x), sy(m.y));
      ctx.strokeStyle = rgba(m.rgb, 0.72);
      ctx.lineWidth = (m.kind === 'smart' ? 2.4 : 1.85) * scale;
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.22);
      ctx.lineWidth = 0.7 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), (m.kind === 'smart' ? 3.6 : 2.6) * scale, 0, TAU);
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fill();
      if (m.kind === 'smart') {
        ctx.strokeStyle = rgba(MAG, 0.85);
        ctx.lineWidth = 1.3 * scale;
        ctx.beginPath();
        ctx.arc(sx(m.x), sy(m.y), 5.4 * scale, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.abms.length; i++) {
      const a = G.abms[i];
      ctx.beginPath();
      ctx.moveTo(sx(a.x0), sy(a.y0));
      ctx.lineTo(sx(a.x), sy(a.y));
      ctx.strokeStyle = rgba(CYN, 0.8);
      ctx.lineWidth = 2.2 * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 1);
      ctx.beginPath();
      ctx.arc(sx(a.x), sy(a.y), 2.8 * scale, 0, TAU);
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
      const grd = ctx.createRadialGradient(sx(e.x), sy(e.y), 0, sx(e.x), sy(e.y), Math.max(1, e.r * scale));
      grd.addColorStop(0, rgba(WHT, 0.95 * fade));
      grd.addColorStop(0.22, rgba(e.rgb, 0.72 * fade));
      grd.addColorStop(0.55, rgba(HOT, 0.32 * fade));
      grd.addColorStop(1, rgba(e.rgb, 0));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), e.r * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.55 * fade);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), e.r * scale, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(e.rgb, 0.35 * fade);
      ctx.lineWidth = 4 * scale;
      ctx.beginPath();
      ctx.arc(sx(e.x), sy(e.y), (e.r + 3) * scale, 0, TAU);
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
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.4;
      ctx.strokeStyle = rgba(s.rgb, 0.65 * (1 - k));
      ctx.lineWidth = (2.6 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * 0.35 + k * s.rad * 1.15) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const k = s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, 0.42 * (1 - k));
      ctx.lineWidth = (2.2 - k * 1.5) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + k * 28) * scale, 0, TAU);
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
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawTargets() {
    ctx.save();
    ctx.lineWidth = 1.2 * scale;
    for (let i = 0; i < G.abms.length; i++) {
      const a = G.abms[i];
      const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 10 + i));
      ctx.strokeStyle = rgba(CYN, 0.55 * pulse);
      const s = 5;
      ctx.strokeRect(sx(a.tx - s), sy(a.ty - s), (s * 2) * scale, (s * 2) * scale);
      ctx.beginPath();
      ctx.moveTo(sx(a.tx - 8), sy(a.ty));
      ctx.lineTo(sx(a.tx + 8), sy(a.ty));
      ctx.moveTo(sx(a.tx), sy(a.ty - 8));
      ctx.lineTo(sx(a.tx), sy(a.ty + 8));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAim() {
    if (G.mode !== 'play' || G.dying > 0) return;
    const x = G.aim.x;
    const y = G.aim.y;
    const pulse = 0.65 + 0.35 * Math.sin(G.t * 8);
    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.55 * pulse);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(x - 10), sy(y));
    ctx.lineTo(sx(x - 3), sy(y));
    ctx.moveTo(sx(x + 3), sy(y));
    ctx.lineTo(sx(x + 10), sy(y));
    ctx.moveTo(sx(x), sy(y - 10));
    ctx.lineTo(sx(x), sy(y - 3));
    ctx.moveTo(sx(x), sy(y + 3));
    ctx.lineTo(sx(x), sy(y + 10));
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 7 * scale, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.2);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawBonusMark() {
    if (G.mode !== 'bonus' || !G.bonus) return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.font = '700 ' + (16 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    const label = G.bonus.phase === 'ammo' ? '余弹 ×' + G.wmult : G.bonus.phase === 'city' ? '守城 ×' + G.wmult : '下一波';
    ctx.fillText(label, sx(VW * 0.5), sy(120));
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.55);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawTrails();
    drawBlasts();
    drawGround();
    for (let i = 0; i < G.cities.length; i++) drawCity(G.cities[i]);
    for (let i = 0; i < G.bats.length; i++) drawBat(G.bats[i], i);
    drawParticles();
    drawTargets();
    drawAim();
    drawFloats();
    drawBonusMark();
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

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('classic');
    else if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') keys.l = down;
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') keys.r = down;
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') keys.u = down;
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') keys.d = down;
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (down && (k.indexOf('Arrow') === 0 || space || k === 'Enter')) e.preventDefault();
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === '1' || k === '2' || k === '3') {
      audio.ensure();
      if (G.mode === 'title') {
        if (k === '1') startGame('classic');
        if (k === '2') startGame('meteor');
        return;
      }
      if (G.mode === 'play') fireAt(G.aim.x, G.aim.y, k.charCodeAt(0) - 49);
      return;
    }
    if (space || k === 'Enter') {
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') firePointer();
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      const p = pointerWorld(e);
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = p.x;
      pointer.y = p.y;
      G.aim.x = clamp(p.x, 8, VW - 8);
      G.aim.y = clamp(p.y, 12, GROUND - 8);
      if (G.mode === 'play') firePointer();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = pointerWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
      if (pointer.down || e.pointerType === 'mouse') {
        G.aim.x = clamp(p.x, 8, VW - 8);
        G.aim.y = clamp(p.y, 12, GROUND - 8);
        pointer.hover = true;
      }
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () { pointer.hover = false; });
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
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) last = 0;
  });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (btnRetry) btnRetry.addEventListener('click', function () {
    audio.ensure();
    restart();
  });
  if (btnClassic) btnClassic.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startGame('classic');
    else if (G.mode === 'lose') startGame(G.kind);
  });
  if (btnMeteor) btnMeteor.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startGame('meteor');
    else if (G.mode === 'lose') goTitle();
  });
  requestAnimationFrame(frame);
})();
