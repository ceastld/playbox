'use strict';

/* 田赛 — Track & Field remake. Mash to run, Space to jump/throw. No CDN. */

(function () {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MPP = 21;
  const GRAV_JUMP = 18.4;
  const GRAV_JAV = 9.8;
  const BOARD = 22;
  const BOARD_W = 0.2;
  const JAV_LINE = 20;
  const DASH_END = 100;
  const BEST_KEY = 'playbox-track-dash-best';
  const MUTE_KEY = 'playbox-track-dash-mute';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const OPS = 'A D 交替猛按 · 空格起跳/掷枪 · 点按猛按 · R 重开 · M 静音';

  const HOT = [255, 58, 24];
  const EMB = [255, 107, 50];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const LIME = [61, 255, 136];
  const MAG = [255, 61, 184];
  const WHT = [255, 244, 236];
  const SKIN = [255, 214, 186];

  const LANE_Y = [318, 348, 378, 408, 438, 468];
  const PLAYER_LANE = 4;
  const EVENT_Y = 428;

  const NAMES = {
    dash: '100米',
    jump: '跳远',
    jav: '标枪'
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
  const btnAll = document.getElementById('btn-all');
  const btnSprint = document.getElementById('btn-sprint');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnA = document.getElementById('btn-a');
  const btnD = document.getElementById('btn-d');
  const btnAct = document.getElementById('btn-act');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const markEl = document.getElementById('mark');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const markBox = document.getElementById('mark-box');
  const modeLabel = document.getElementById('mode-label');
  const eventLabel = document.getElementById('event-label');
  const qualLabel = document.getElementById('qual-label');
  const powBar = document.getElementById('pow-bar');
  const powWrap = document.getElementById('pow-wrap');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padEl = document.getElementById('pad');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const particles = [];
  const rings = [];
  const pops = [];
  const dusts = [];
  const lines = [];

  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let comboTok = 0;
  let mashKickTok = 0;
  let tapSide = -1;
  let hudDirty = true;

  const G = {
    mode: 'title',
    kind: 'all',
    event: 'dash',
    eventI: 0,
    list: ['dash', 'jump', 'jav'],
    phase: 'run',
    phaseT: 0,
    t: 0,
    clock: 0,
    power: 0,
    spd: 0,
    x: 0,
    z: 0,
    vx: 0,
    vz: 0,
    cam: -4,
    lastSide: 0,
    mashGap: 1,
    mashStreak: 0,
    maxStreak: 0,
    heat: 0,
    score: 0,
    combo: 0,
    best: { a: 0, s: 0 },
    newBest: false,
    ang: 45,
    setT: 0,
    lastBeep: 4,
    foul: false,
    mark: 0,
    place: 1,
    qualOk: false,
    passed: 0,
    lastPass: -1,
    demo: true,
    demoAcc: 0,
    demoSide: -1,
    stop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: HOT,
    cheer: 0.35,
    lean: 0,
    phaseRun: 0,
    toastT: 0,
    banner: '',
    bannerCol: GOLD,
    meterPunch: 1,
    jav: null,
    landX: 0,
    flag: 0,
    records: [],
    gunFlash: 0,
    maxed: false,
    stepSide: 1,
    lastStep: 0
  };

  const rivals = [];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgba(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  }
  function hex(c) {
    return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  }
  function sx(m) {
    return (m - G.cam) * MPP + 200;
  }
  function groundY() {
    return G.event === 'dash' ? LANE_Y[PLAYER_LANE] : EVENT_Y;
  }
  function qualOf(ev) {
    if (ev === 'dash') return G.kind === 'sprint' ? 12.30 : 13.50;
    if (ev === 'jump') return 6.00;
    return 50.00;
  }
  function fmtTime(t) {
    return (Math.max(0, t)).toFixed(2);
  }
  function fmtDist(d) {
    return (Math.max(0, d)).toFixed(2);
  }
  function runSpeed(p) {
    return 2.15 + p * 10.5;
  }

  const audio = {
    ctx: null,
    master: null,
    rumble: null,
    rumbleG: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, from, to) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(from || 900, t);
      if (to) f.frequency.exponentialRampToValueAtTime(Math.max(40, to), t + dur);
      f.Q.value = 0.85;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    tickRumble: function (on, power) {
      if (!this.ctx || this.muted) {
        if (this.rumbleG) this.rumbleG.gain.setTargetAtTime(0.0001, this.ctx ? this.ctx.currentTime : 0, 0.05);
        return;
      }
      if (!this.rumble) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = 58;
        g.gain.value = 0.0001;
        const f = this.ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 140;
        o.connect(f);
        f.connect(g);
        g.connect(this.master);
        o.start();
        this.rumble = o;
        this.rumbleG = g;
      }
      const t = this.ctx.currentTime;
      const p = on ? power : 0;
      this.rumble.frequency.setTargetAtTime(52 + p * 70, t, 0.05);
      this.rumbleG.gain.setTargetAtTime(0.0001 + p * 0.042, t, 0.04);
    },
    mash: function (power, streak, alt) {
      this.ensure();
      const p = clamp(power, 0, 1);
      const n = 1 + Math.min(16, streak) * 0.035;
      this.beep((alt ? 210 : 170) * n + p * 260, 0.045, alt ? 'square' : 'triangle', 0.03 + p * 0.04, 90 + p * 80);
      this.noise(0.028, 0.03 + p * 0.05, 1800 + p * 900, 420);
    },
    crowd: function (big) {
      this.ensure();
      this.noise(big ? 0.28 : 0.12, big ? 0.14 : 0.07, big ? 900 : 1400, big ? 280 : 600);
      if (big) this.beep(180, 0.2, 'sine', 0.03, 90);
    },
    gun: function () {
      this.ensure();
      this.noise(0.18, 0.22, 700, 90);
      this.beep(90, 0.16, 'sine', 0.08, 40);
      this.beep(240, 0.08, 'square', 0.05, 70);
    },
    tick: function (n) {
      this.ensure();
      this.beep(n >= 1 ? 520 : 880, 0.08, 'square', 0.045, n >= 1 ? 260 : 440);
    },
    takeoff: function (perfect) {
      this.ensure();
      this.noise(0.16, perfect ? 0.18 : 0.12, 400, 1400);
      this.beep(perfect ? 140 : 110, 0.12, 'sine', 0.07, 55);
      this.beep(perfect ? 720 : 480, 0.14, 'triangle', 0.07, perfect ? 1400 : 820);
      if (perfect) this.beep(1180, 0.18, 'sine', 0.045, 1760);
    },
    throw: function (sweet) {
      this.ensure();
      this.noise(0.14, 0.12, 900, 2200);
      this.beep(sweet ? 280 : 200, 0.1, 'sawtooth', 0.05, 90);
      this.beep(sweet ? 880 : 540, 0.16, 'triangle', 0.06, sweet ? 1480 : 720);
    },
    land: function () {
      this.ensure();
      this.noise(0.18, 0.14, 280, 80);
      this.beep(70, 0.16, 'sine', 0.05, 36);
    },
    pass: function (n) {
      this.ensure();
      const p = 1 + n * 0.08;
      this.beep(420 * p, 0.08, 'square', 0.04, 820 * p);
      this.beep(660 * p, 0.12, 'sine', 0.035, 990 * p);
    },
    qualify: function () {
      this.ensure();
      this.crowd(true);
      this.beep(440, 0.12, 'triangle', 0.07, 880);
      this.beep(660, 0.18, 'sine', 0.055, 1320);
      this.beep(880, 0.26, 'sine', 0.04, 1760);
    },
    fail: function () {
      this.ensure();
      this.beep(180, 0.28, 'sawtooth', 0.06, 70);
      this.beep(90, 0.4, 'square', 0.04, 40);
    },
    foul: function () {
      this.ensure();
      this.noise(0.22, 0.16, 500, 120);
      this.beep(160, 0.22, 'square', 0.07, 70);
      this.beep(90, 0.32, 'sawtooth', 0.04, 40);
    },
    win: function () {
      this.ensure();
      this.crowd(true);
      this.beep(520, 0.14, 'triangle', 0.08, 780);
      this.beep(780, 0.2, 'sine', 0.06, 1170);
      this.beep(1040, 0.32, 'sine', 0.05, 1560);
    },
    maxed: function () {
      this.ensure();
      this.beep(880, 0.08, 'square', 0.05, 1320);
      this.beep(1320, 0.12, 'sine', 0.04, 1760);
    }
  };

  function loadBest() {
    try {
      const r = JSON.parse(localStorage.getItem(BEST_KEY) || '{}');
      return { a: +r.a || 0, s: +r.s || 0 };
    } catch (err) {
      return { a: 0, s: 0 };
    }
  }

  function saveBest() {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(G.best)); } catch (err) { /* ignore */ }
  }

  function currentBest() {
    if (G.mode === 'title') return Math.max(G.best.a, G.best.s);
    return G.kind === 'sprint' ? G.best.s : G.best.a;
  }

  function considerBest() {
    if (G.demo) return;
    const k = G.kind === 'sprint' ? 's' : 'a';
    if (G.score > G.best[k]) {
      G.best[k] = G.score;
      G.newBest = true;
      saveBest();
      hudDirty = true;
    }
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead, start) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'FOUL' : kind === 'win' ? 'GOAL' : 'TRACK';
    if (kind === 'lose' && !G.foul) ovKicker.textContent = 'OUT';
    if (kind === 'win' && G.newBest) ovKicker.textContent = 'BEST';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', !start);
    if (ovEnd) ovEnd.classList.toggle('gone', !!start);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE || G.demo) return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.055, mag * 0.008));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : mag >= 2.6 ? 'hit' : 'pass';
    stageEl.classList.remove('die', 'hit', 'pass', 'mash');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) stageEl.classList.remove('die', 'hit', 'pass');
    }, 360);
  }

  function mashKick() {
    if (REDUCE || !stageEl) return;
    mashKickTok += 1;
    stageEl.classList.remove('mash');
    void stageEl.offsetWidth;
    stageEl.classList.add('mash');
    const tok = mashKickTok;
    setTimeout(function () {
      if (tok === mashKickTok && stageEl) stageEl.classList.remove('mash');
    }, 90);
  }

  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden', 'warn', 'gold', 'cyan');
    if (kind) toastEl.classList.add(kind);
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.15;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function flashScore(add) {
    if (G.demo) return;
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    if (add > 0) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + add;
      scoreAdd.classList.remove('score-add');
      void scoreAdd.offsetWidth;
      scoreAdd.classList.add('score-add');
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
  }

  function popCombo() {
    comboEl.textContent = '×' + G.mashStreak;
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
    comboTok += 1;
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 240) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.45, spec.j * 0.45),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.55, 1.2),
        t: 0,
        r: rand(spec.r0, spec.r1),
        col: spec.col,
        g: spec.g == null ? 520 : spec.g
      });
    }
  }

  function ring(x, y, col, max) {
    rings.push({ x: x, y: y, col: col, r: 6, max: max, t: 0, life: 0.42 });
  }

  function pop(x, y, text, col) {
    pops.push({ x: x, y: y, text: text, col: col, t: 0, life: 0.9 });
  }

  function speedLine(x, y) {
    if (lines.length > 48) lines.shift();
    lines.push({
      x: x,
      y: y + rand(-18, 8),
      w: rand(18, 46),
      t: 0,
      life: rand(0.12, 0.22)
    });
  }

  function canMash() {
    if (G.mode === 'over') return false;
    if (G.phase === 'air' || G.phase === 'land' || G.phase === 'result') return false;
    return G.phase === 'intro' || G.phase === 'set' || G.phase === 'run';
  }

  function mash(side) {
    if (!canMash()) return;
    audio.ensure();
    const alt = G.lastSide !== 0 && side !== G.lastSide;
    G.lastSide = side;
    const gain = alt ? 0.082 : 0.068;
    const was = G.power;
    G.power = Math.min(1, G.power + gain);
    G.mashGap = 0;
    G.mashStreak += 1;
    if (G.mashStreak > G.maxStreak) G.maxStreak = G.mashStreak;
    G.meterPunch = 1.12;
    G.heat = Math.min(1, G.heat + 0.04);
    G.cheer = Math.min(1, G.cheer + 0.03);
    audio.mash(G.power, G.mashStreak, alt);
    if (!G.demo) {
      mashKick();
      if (!REDUCE) G.shake = Math.max(G.shake, 0.7 + G.power * 1.4);
      hudDirty = true;
      if (G.mashStreak === 8 || G.mashStreak === 14 || G.mashStreak === 22) {
        toast('节奏 ×' + G.mashStreak, 'gold');
        popCombo();
        audio.crowd(false);
      }
      if (was < 0.98 && G.power >= 0.98 && !G.maxed) {
        G.maxed = true;
        audio.maxed();
        toast('爆表', 'gold');
        ring(sx(G.x), groundY() - 40, GOLD, 70);
      }
    }
    const gy = groundY();
    const px = sx(G.x);
    emit(alt ? 5 : 3, {
      x: px - 8, y: gy - 6, j: 8,
      vx0: -40, vx1: 30, vy0: -90, vy1: -10,
      life: 0.28, r0: 1.2, r1: 3.1, col: G.power > 0.8 ? 'g' : (alt ? 'c' : 'h')
    });
    if (G.mashStreak % 5 === 0) audio.crowd(false);
  }

  function doAction() {
    if (G.mode !== 'play' || G.demo) return;
    if (G.phase !== 'run') return;
    if (G.event === 'jump') takeoff();
    else if (G.event === 'jav') throwJav();
  }

  function spawnRivals() {
    rivals.length = 0;
    const sprint = G.kind === 'sprint';
    const pal = [
      { col: CYN, lane: 2, name: '青', pace: sprint ? 9.55 : 8.15, j: 0.28 },
      { col: MAG, lane: 3, name: '绯', pace: sprint ? 9.25 : 7.70, j: 0.34 },
      { col: GOLD, lane: 5, name: '金', pace: sprint ? 8.95 : 7.25, j: 0.4 }
    ];
    for (let i = 0; i < pal.length; i++) {
      const p = pal[i];
      rivals.push({
        col: p.col,
        lane: p.lane,
        name: p.name,
        pace: p.pace,
        j: p.j,
        x: 0,
        spd: 0,
        z: 0,
        phase: rand(0, 1),
        delay: 0.04 + i * 0.03,
        done: false,
        led: false,
        _passed: false
      });
    }
  }

  function resetAthlete() {
    G.x = 0;
    G.z = 0;
    G.vx = 0;
    G.vz = 0;
    G.spd = 0;
    G.power = 0;
    G.lastSide = 0;
    G.mashGap = 1;
    G.mashStreak = 0;
    G.lean = 0;
    G.phaseRun = 0;
    G.foul = false;
    G.mark = 0;
    G.place = 1;
    G.qualOk = false;
    G.passed = 0;
    G.lastPass = -1;
    G.ang = 42;
    G.jav = null;
    G.landX = 0;
    G.flag = 0;
    G.maxed = false;
    G.gunFlash = 0;
    G.clock = 0;
    G.cam = -5.2;
    G.lastBeep = 4;
    G.stepSide = 1;
    G.lastStep = 0;
  }

  function startEvent(name, demo) {
    G.event = name;
    G.demo = !!demo;
    G.phase = demo ? 'run' : 'intro';
    G.phaseT = demo ? 0 : 1.28;
    resetAthlete();
    if (name === 'dash') spawnRivals();
    else rivals.length = 0;
    if (demo) {
      G.power = 0.55;
      G.clock = 0;
      G.phase = 'run';
    }
    G.banner = NAMES[name];
    G.bannerCol = GOLD;
    particles.length = 0;
    rings.length = 0;
    pops.length = 0;
    dusts.length = 0;
    lines.length = 0;
    hudDirty = true;
    if (btnAct) {
      btnAct.textContent = name === 'jav' ? '投' : '跳';
      btnAct.style.visibility = name === 'dash' ? 'hidden' : 'visible';
    }
    if (padEl) padEl.setAttribute('aria-hidden', demo ? 'true' : 'false');
    if (!demo) {
      hideOverlay();
      if (stageEl) {
        stageEl.classList.remove('idle');
        stageEl.classList.add('play');
      }
      const q = qualOf(name);
      const qtxt = name === 'dash' ? fmtTime(q) : fmtDist(q) + 'm';
      toast(NAMES[name] + ' · 达标 ' + qtxt, 'gold');
      if (hintEl) {
        if (name === 'dash') hintEl.textContent = 'A D 交替猛按冲刺 · 点按也可 · R 重开 · M 静音';
        else if (name === 'jump') hintEl.textContent = '猛按加速，白板起跳 · 踩过线犯规 · 空格 / 跳';
        else hintEl.textContent = '猛按加速，金角掷出 · 踩过线犯规 · 空格 / 投';
      }
    }
    syncHud(true);
  }

  function startGame(kind) {
    audio.ensure();
    G.mode = 'play';
    G.kind = kind === 'sprint' ? 'sprint' : 'all';
    G.list = G.kind === 'sprint' ? ['dash'] : ['dash', 'jump', 'jav'];
    G.eventI = 0;
    G.score = 0;
    G.combo = 0;
    G.maxStreak = 0;
    G.heat = 0;
    G.newBest = false;
    G.records = [];
    G.stop = 0;
    hideOverlay();
    audio.beep(280, 0.1, 'sine', 0.05, 560);
    startEvent(G.list[0], false);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'all';
    G.demo = true;
    G.score = 0;
    G.list = ['dash'];
    G.eventI = 0;
    G.stop = 0;
    G.cheer = 0.4;
    startEvent('dash', true);
    if (stageEl) {
      stageEl.classList.add('idle');
      stageEl.classList.remove('play');
    }
    showOverlay('title', '田赛', '连打加速，踩板起跳，看准角度掷枪。', true);
    if (hintEl) hintEl.textContent = 'A D 交替猛按跑步 · 空格起跳 / 掷枪 · 踩过板算犯规 · R 重开 · M 静音';
    if (btnAct) btnAct.style.visibility = 'hidden';
    hudDirty = true;
    syncHud(true);
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('all');
    else startGame(G.kind || 'all');
  }

  function addScore(n) {
    if (G.demo || n <= 0) return;
    n = n | 0;
    G.score += n;
    considerBest();
    flashScore(n);
    hudDirty = true;
  }

  function boardQ(x) {
    if (x > BOARD + BOARD_W) return 0;
    if (x >= BOARD - 0.16) return 1;
    const d = BOARD - 0.16 - x;
    if (d < 0.4) return 1 - d * 0.55;
    return clamp(0.8 - (d - 0.4) * 0.32, 0.32, 0.8);
  }

  function takeoff() {
    if (G.x < 10) {
      audio.beep(140, 0.08, 'square', 0.03, 80);
      toast('还早', 'warn');
      return;
    }
    if (G.x > BOARD + BOARD_W) {
      foulNow();
      return;
    }
    const q = boardQ(G.x);
    const perfect = q >= 0.96;
    const spd = runSpeed(G.power);
    G.vx = spd * (0.94 + 0.08 * q);
    G.vz = 4.15 + spd * 0.38 * q;
    G.z = 0.02;
    G.phase = 'air';
    G.phaseT = 0;
    G.spd = spd;
    audio.takeoff(perfect);
    hitStop(perfect ? 0.078 : 0.052);
    kick(perfect ? 5.8 : 3.6);
    G.flash = perfect ? 0.38 : 0.22;
    G.flashRgb = perfect ? GOLD : CYN;
    G.cheer = Math.min(1, G.cheer + (perfect ? 0.45 : 0.22));
    const px = sx(G.x);
    const py = groundY();
    ring(px, py - 10, perfect ? GOLD : CYN, perfect ? 90 : 64);
    emit(perfect ? 28 : 16, {
      x: px, y: py - 8, j: 14,
      vx0: -120, vx1: 220, vy0: -280, vy1: -20,
      life: 0.55, r0: 1.6, r1: 4.4, col: perfect ? 'g' : 'c'
    });
    emit(10, {
      x: px, y: py, j: 10,
      vx0: -80, vx1: 90, vy0: -40, vy1: 20,
      life: 0.4, r0: 1.2, r1: 3.2, col: 'w', g: 80
    });
    if (perfect) {
      toast('板前！', 'gold');
      pop(px, py - 70, '板前', '#ffe36b');
    } else if (q < 0.55) {
      toast('起跳偏早', 'cyan');
    }
    G.flag = perfect ? 1 : 0;
  }

  function throwJav() {
    if (G.x < 8) {
      audio.beep(140, 0.08, 'square', 0.03, 80);
      toast('还早', 'warn');
      return;
    }
    if (G.x > JAV_LINE) {
      foulNow();
      return;
    }
    const ang = G.ang * Math.PI / 180;
    const spd = runSpeed(G.power);
    const v = 16.1 + spd * 0.95;
    const sweet = Math.abs(G.ang - 45) <= 5.5;
    G.jav = {
      x: G.x + 0.4,
      z: 1.7,
      vx: v * Math.cos(ang),
      vz: v * Math.sin(ang),
      ang: ang,
      stuck: false
    };
    G.phase = 'air';
    G.phaseT = 0;
    G.vx = spd * 0.35;
    G.vz = 0;
    G.z = 0;
    audio.throw(sweet);
    hitStop(sweet ? 0.07 : 0.048);
    kick(sweet ? 5.2 : 3.2);
    G.flash = sweet ? 0.34 : 0.2;
    G.flashRgb = sweet ? GOLD : EMB;
    G.cheer = Math.min(1, G.cheer + (sweet ? 0.4 : 0.18));
    const px = sx(G.x);
    const py = groundY();
    ring(px + 18, py - 36, sweet ? GOLD : HOT, 72);
    emit(20, {
      x: px + 16, y: py - 40, j: 12,
      vx0: 40, vx1: 280, vy0: -160, vy1: 40,
      life: 0.5, r0: 1.4, r1: 3.8, col: sweet ? 'g' : 'h'
    });
    if (sweet) {
      toast('起飞角！', 'gold');
      pop(px, py - 78, '起飞角', '#ffe36b');
      G.flag = 1;
    }
  }

  function foulNow() {
    if (G.foul || G.phase === 'result') return;
    G.foul = true;
    G.phase = 'land';
    G.phaseT = 0.95;
    G.power = 0;
    G.spd *= 0.22;
    G.vx = G.spd;
    G.vz = 0;
    G.z = 0;
    G.mark = 0;
    G.jav = null;
    audio.foul();
    hitStop(0.07);
    kick(7.2);
    G.flash = 0.4;
    G.flashRgb = HOT;
    G.cheer = 0.12;
    toast('犯规', 'warn');
    const px = sx(G.x);
    const py = groundY();
    emit(22, {
      x: px, y: py - 10, j: 16,
      vx0: -160, vx1: 160, vy0: -120, vy1: 40,
      life: 0.5, r0: 1.6, r1: 4.2, col: 'h'
    });
    pop(px, py - 64, '犯规', '#ff3a18');
  }

  function finishDash() {
    G.phase = 'land';
    G.phaseT = 0.62;
    G.x = DASH_END;
    G.mark = G.clock;
    G.place = 1;
    for (let i = 0; i < rivals.length; i++) {
      if (rivals[i].x >= DASH_END - 0.02) G.place += 1;
    }
    const q = qualOf('dash');
    G.qualOk = !G.foul && G.mark <= q;
    audio.crowd(true);
    hitStop(0.055);
    kick(G.qualOk ? 4.4 : 2.4);
    G.flash = 0.32;
    G.flashRgb = G.qualOk ? GOLD : WHT;
    G.gunFlash = 0.28;
    ring(sx(DASH_END), groundY() - 20, GOLD, 100);
    emit(24, {
      x: sx(DASH_END), y: groundY() - 24, j: 20,
      vx0: -80, vx1: 80, vy0: -200, vy1: 20,
      life: 0.6, r0: 1.4, r1: 4.2, col: G.qualOk ? 'g' : 'c'
    });
    pop(sx(G.x), groundY() - 80, fmtTime(G.mark), G.qualOk ? '#ffe36b' : '#fff4ec');
    if (G.place === 1) toast('第一', 'gold');
    else toast(fmtTime(G.mark), G.qualOk ? 'gold' : 'warn');
  }

  function landJump() {
    G.z = 0;
    G.vz = 0;
    G.phase = 'land';
    G.phaseT = 0.7;
    G.landX = G.x;
    const dist = Math.max(0, G.x - (BOARD + BOARD_W));
    G.mark = G.foul ? 0 : dist;
    G.qualOk = !G.foul && G.mark >= qualOf('jump');
    audio.land();
    if (G.qualOk) audio.crowd(true);
    hitStop(0.04);
    kick(3.8);
    const px = sx(G.x);
    const py = groundY();
    emit(26, {
      x: px, y: py, j: 18,
      vx0: -140, vx1: 140, vy0: -90, vy1: 30,
      life: 0.55, r0: 1.4, r1: 4.6, col: 'g', g: 180
    });
    dusts.push({ x: G.x, y: py, t: 0, life: 0.8, r: 28 });
    pop(px, py - 72, fmtDist(G.mark) + 'm', G.qualOk ? '#ffe36b' : '#ff6b32');
    toast((G.foul ? '犯规' : fmtDist(G.mark) + 'm'), G.qualOk ? 'gold' : 'warn');
  }

  function landJav() {
    G.phase = 'land';
    G.phaseT = 0.75;
    if (G.jav) {
      G.jav.stuck = true;
      G.jav.z = 0;
      G.jav.vz = 0;
      G.jav.vx = 0;
    }
    const dist = G.jav ? Math.max(0, G.jav.x - JAV_LINE) : 0;
    G.mark = G.foul ? 0 : dist;
    G.qualOk = !G.foul && G.mark >= qualOf('jav');
    audio.land();
    if (G.qualOk) audio.crowd(true);
    kick(3.2);
    const jx = G.jav ? sx(G.jav.x) : sx(G.x);
    const py = groundY();
    emit(18, {
      x: jx, y: py, j: 12,
      vx0: -70, vx1: 70, vy0: -70, vy1: 10,
      life: 0.45, r0: 1.2, r1: 3.4, col: 'g', g: 140
    });
    pop(jx, py - 64, fmtDist(G.mark) + 'm', G.qualOk ? '#ffe36b' : '#ff6b32');
    toast((G.foul ? '犯规' : fmtDist(G.mark) + 'm'), G.qualOk ? 'gold' : 'warn');
  }

  function settleResult() {
    G.phase = 'result';
    G.phaseT = 2.05;
    const ev = G.event;
    let pts = 0;
    let line = NAMES[ev] + ' ';
    if (ev === 'dash') {
      line += fmtTime(G.mark);
      if (!G.foul) {
        pts = Math.max(0, ((18 - G.mark) * 140) | 0);
        if (G.place === 1) pts += 420;
        else if (G.place === 2) pts += 220;
        else if (G.place === 3) pts += 90;
        pts += G.passed * 90;
        pts += Math.min(24, G.maxStreak) * 10;
      }
    } else if (ev === 'jump') {
      line += (G.foul ? '犯规' : fmtDist(G.mark) + 'm');
      if (!G.foul) {
        pts = (G.mark * 118) | 0;
        if (G.flag) pts += 220;
      }
    } else {
      line += (G.foul ? '犯规' : fmtDist(G.mark) + 'm');
      if (!G.foul) {
        pts = (G.mark * 14) | 0;
        if (G.flag) pts += 180;
      }
    }
    if (G.qualOk) {
      G.combo += 1;
      pts = (pts * (1 + 0.12 * (G.combo - 1))) | 0;
      pts += 200;
      line += ' 达标';
      audio.qualify();
      G.banner = '达标';
      G.bannerCol = LIME;
    } else {
      G.combo = 0;
      line += G.foul ? '' : ' 未达标';
      audio.fail();
      G.banner = G.foul ? '犯规' : '未达标';
      G.bannerCol = HOT;
    }
    addScore(pts);
    G.records.push({ ev: ev, mark: G.mark, ok: G.qualOk, foul: G.foul, pts: pts, place: G.place });
    hudDirty = true;
  }

  function afterResult() {
    if (G.demo) {
      resetAthlete();
      G.power = 0.5;
      G.phase = 'run';
      spawnRivals();
      return;
    }
    if (!G.qualOk) {
      endGame(false);
      return;
    }
    G.eventI += 1;
    if (G.eventI >= G.list.length) {
      endGame(true);
      return;
    }
    startEvent(G.list[G.eventI], false);
  }

  function endGame(win) {
    G.mode = 'over';
    G.phase = 'result';
    considerBest();
    if (win) audio.win();
    else if (!G.foul) audio.fail();
    const recs = G.records.map(function (r) {
      const n = NAMES[r.ev];
      if (r.ev === 'dash') return n + ' ' + fmtTime(r.mark) + (r.ok ? ' 达标' : ' 未达标');
      return n + ' ' + (r.foul ? '犯规' : fmtDist(r.mark) + 'm') + (r.ok ? ' 达标' : ' 未达标');
    }).join(' · ');
    const bestNote = G.newBest ? ' 新纪录 ' + G.score : ' 分数 ' + G.score;
    if (win) {
      const title = G.kind === 'sprint' ? '冲线' : '三项达标';
      showOverlay('win', title, recs + '。' + bestNote, false);
    } else {
      const title = G.foul ? '犯规出局' : '未达标';
      showOverlay('lose', title, recs + '。' + bestNote, false);
    }
    if (stageEl) stageEl.classList.add('idle');
    hudDirty = true;
    syncHud(true);
  }

  function gunGo() {
    G.phase = 'run';
    G.clock = 0;
    G.spd = runSpeed(G.power) * 0.62;
    audio.gun();
    audio.crowd(true);
    G.gunFlash = 0.45;
    G.flash = 0.28;
    G.flashRgb = WHT;
    kick(3.2);
    ring(sx(G.x), groundY() - 24, WHT, 80);
    emit(14, {
      x: sx(G.x), y: groundY() - 12, j: 12,
      vx0: 40, vx1: 180, vy0: -80, vy1: 10,
      life: 0.35, r0: 1.4, r1: 3.6, col: 'w'
    });
    toast('跑！', 'cyan');
    G.cheer = Math.min(1, G.cheer + 0.35);
  }

  function updateTitle(dt) {
    G.demoAcc += dt;
    while (G.demoAcc > 0.108) {
      mash(G.demoSide);
      G.demoSide *= -1;
      G.demoAcc -= 0.108;
    }
    updatePlay(dt);
    if (G.x > 108 || G.phase === 'result') {
      resetAthlete();
      G.power = 0.52;
      G.phase = 'run';
      spawnRivals();
    }
  }

  function updatePlay(dt) {
    G.phaseT -= dt;
    G.mashGap += dt;
    if (G.mashGap > 0.3) {
      if (G.mashStreak > 0) {
        G.mashStreak = 0;
        hudDirty = true;
      }
      G.lastSide = 0;
    }
    G.power = Math.max(0, G.power - dt * (0.30 + G.power * 0.48));
    if (G.power < 0.9) G.maxed = false;
    G.cheer = lerp(G.cheer, 0.22 + G.power * 0.5, 1 - Math.pow(0.12, dt));
    G.heat = Math.max(0, G.heat - dt * 0.12);
    G.lean = lerp(G.lean, G.power * -0.22, 1 - Math.pow(0.02, dt));

    if (G.phase === 'intro') {
      if (G.phaseT <= 0) {
        G.phase = 'set';
        G.setT = 2.85;
        G.lastBeep = 4;
      }
    } else if (G.phase === 'set') {
      G.setT -= dt;
      const n = Math.ceil(G.setT);
      if (n < G.lastBeep && n >= 1 && n <= 3) {
        audio.tick(n);
        G.lastBeep = n;
      }
      if (G.setT <= 0) gunGo();
    }

    const moving = G.phase === 'run' && (G.demo || G.mode === 'play' || G.mode === 'title');
    const afterGun = G.phase === 'run' || G.phase === 'air' || G.phase === 'land';

    if (G.event === 'jav' && (G.phase === 'run' || G.phase === 'set')) {
      G.ang = 45 + 26 * Math.sin(G.t * 4.35);
    }

    if (G.phase === 'run') {
      const target = runSpeed(G.power);
      G.spd = lerp(G.spd, target, 1 - Math.pow(0.018, dt));
      if (!G.demo && G.mode === 'title') G.spd = target;
      G.x += G.spd * dt;
      G.phaseRun += dt * (1.6 + G.spd * 0.55);
      const step = G.phaseRun % 1;
      if (step < G.lastStep) {
        G.stepSide *= -1;
        const py = groundY();
        emit(2, {
          x: sx(G.x) - 6, y: py, j: 4,
          vx0: -20, vx1: 10, vy0: -30, vy1: -4,
          life: 0.22, r0: 1, r1: 2.4, col: 'w', g: 40
        });
      }
      G.lastStep = step;
      if (G.power > 0.72 && Math.random() < 0.45) speedLine(sx(G.x) + 10, groundY() - 28);

      if (G.event === 'dash' && G.x >= DASH_END && !G.demo) finishDash();
      if (G.event === 'jump' && G.x > BOARD + BOARD_W && !G.demo) foulNow();
      if (G.event === 'jav' && G.x > JAV_LINE && !G.demo) foulNow();
    } else if (G.phase === 'air') {
      if (G.event === 'jump') {
        G.x += G.vx * dt;
        G.vz -= GRAV_JUMP * dt;
        G.z += G.vz * dt;
        G.phaseRun += dt * 1.4;
        if (G.z <= 0 && G.vz <= 0) landJump();
      } else if (G.event === 'jav') {
        G.x += G.vx * dt;
        G.vx *= Math.pow(0.18, dt);
        G.phaseRun += dt * 0.8;
        if (G.jav && !G.jav.stuck) {
          G.jav.x += G.jav.vx * dt;
          G.jav.vz -= GRAV_JAV * dt;
          G.jav.z += G.jav.vz * dt;
          G.jav.ang = Math.atan2(G.jav.vz, G.jav.vx);
          if (G.jav.z <= 0 && G.jav.vz <= 0) landJav();
        }
      }
    } else if (G.phase === 'land') {
      G.x += G.spd * 0.25 * dt;
      G.spd *= Math.pow(0.08, dt);
      G.phaseRun += dt * 0.5;
      if (G.phaseT <= 0) settleResult();
    } else if (G.phase === 'result') {
      G.spd *= Math.pow(0.04, dt);
      if (G.phaseT <= 0 && G.mode === 'play') afterResult();
    }

    if (afterGun && G.event === 'dash') {
      if (G.phase === 'run' || G.phase === 'land' || G.phase === 'result' || G.phase === 'air') {
        G.clock += (G.phase === 'run' && G.x < DASH_END) ? dt : 0;
      }
    }

    updateRivals(dt);
    updatePass();

    const look = G.event === 'dash' ? 9.2 : 7.4;
    const targetCam = G.x - look;
    G.cam = lerp(G.cam, targetCam, 1 - Math.pow(0.012, dt));
    if (G.phase === 'intro' || G.phase === 'set') {
      G.cam = lerp(G.cam, G.x - 6.5, 1 - Math.pow(0.04, dt));
    }
  }

  function updateRivals(dt) {
    if (G.event !== 'dash') return;
    const go = G.phase === 'run' || G.phase === 'land' || G.phase === 'result' || G.phase === 'air' || G.demo;
    for (let i = 0; i < rivals.length; i++) {
      const r = rivals[i];
      r.phase += dt * (1.5 + r.spd * 0.5);
      if (!go) continue;
      if (G.phase === 'set' || G.phase === 'intro') continue;
      r.delay -= dt;
      if (r.delay > 0 && G.phase === 'run' && G.clock < 0.2) continue;
      const wob = Math.sin(G.t * (2.1 + i * 0.4) + i) * r.j;
      const tgt = r.pace + wob;
      r.spd = lerp(r.spd, tgt, 1 - Math.pow(0.04, dt));
      r.x += r.spd * dt;
      if (r.x >= DASH_END) {
        r.x = DASH_END;
        r.spd *= 0.92;
        r.done = true;
      }
    }
  }

  function updatePass() {
    if (G.demo || G.event !== 'dash' || G.phase !== 'run') return;
    for (let i = 0; i < rivals.length; i++) {
      const r = rivals[i];
      if (r.x > G.x + 0.25) r.led = true;
      if (r.led && !r._passed && G.x > r.x) {
        r._passed = true;
        G.passed += 1;
        audio.pass(G.passed);
        toast('超越 ' + r.name, 'cyan');
        pop(sx(G.x), groundY() - 86, '超越', '#00f0ff');
        hitStop(0.03);
        kick(2.1);
        G.flash = 0.16;
        G.flashRgb = CYN;
        addScore(80);
      }
    }
  }

  function updateFx(dt) {
    G.shake *= Math.pow(0.0008, dt);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0004, dt));
    G.meterPunch = lerp(G.meterPunch, 1, 1 - Math.pow(0.0002, dt));
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.gunFlash > 0) G.gunFlash = Math.max(0, G.gunFlash - dt * 2.8);
    G.toastT = Math.max(0, G.toastT - dt);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.98;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt;
      r.r = lerp(6, r.max, r.t / r.life);
      if (r.t >= r.life) rings.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.t += dt;
      p.y -= 38 * dt;
      if (p.t >= p.life) pops.splice(i, 1);
    }
    for (let i = lines.length - 1; i >= 0; i--) {
      const p = lines[i];
      p.t += dt;
      p.x -= 280 * dt;
      if (p.t >= p.life) lines.splice(i, 1);
    }
    for (let i = dusts.length - 1; i >= 0; i--) {
      const p = dusts[i];
      p.t += dt;
      if (p.t >= p.life) dusts.splice(i, 1);
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

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    g.addColorStop(0, '#140606');
    g.addColorStop(0.42, '#2a0c0c');
    g.addColorStop(0.62, '#4a1810');
    g.addColorStop(1, '#1a0806');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.fillStyle = 'rgba(255,227,107,0.7)';
    ctx.beginPath();
    ctx.arc(780, 58, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,240,255,0.5)';
    ctx.beginPath();
    ctx.arc(120, 40, 1.6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,244,236,0.45)';
    for (let i = 0; i < 18; i++) {
      const x = (i * 97 + G.cam * 3) % WORLD_W;
      const y = 18 + (i * 37) % 70;
      ctx.fillRect(x, y, 1.4, 1.4);
    }

    ctx.fillStyle = '#2c1010';
    ctx.beginPath();
    ctx.ellipse(820, 70, 34, 34, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a1612';
    ctx.beginPath();
    ctx.ellipse(808, 64, 24, 24, 0, 0, TAU);
    ctx.fill();
  }

  function drawStands() {
    const par = G.cam * 6;
    ctx.fillStyle = '#1c0a0a';
    ctx.fillRect(0, 118, WORLD_W, 168);

    for (let row = 0; row < 7; row++) {
      const y = 128 + row * 18;
      for (let i = 0; i < 42; i++) {
        const x = ((i * 28 + row * 11 - par) % (WORLD_W + 40)) - 20;
        const bounce = Math.sin(G.t * (7 + (i % 5)) + i + row) * (2 + G.cheer * 5);
        const pal = i % 5 === 0 ? HOT : i % 5 === 1 ? CYN : i % 5 === 2 ? GOLD : i % 5 === 3 ? MAG : EMB;
        ctx.fillStyle = rgba(pal, 0.45 + G.cheer * 0.4);
        ctx.fillRect(x, y - bounce, 4.2, 6.5);
      }
    }

    ctx.fillStyle = '#3a1410';
    for (let i = 0; i < 8; i++) {
      const x = ((i * 160 - par * 0.4) % (WORLD_W + 120)) - 40;
      ctx.fillRect(x, 86, 18, 50);
      ctx.fillStyle = rgba(GOLD, 0.18);
      ctx.beginPath();
      ctx.moveTo(x + 9, 92);
      ctx.lineTo(x - 50, 300);
      ctx.lineTo(x + 70, 300);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#3a1410';
    }

    ctx.fillStyle = '#120606';
    ctx.fillRect(0, 270, WORLD_W, 36);
    ctx.fillStyle = rgba(HOT, 0.35);
    ctx.fillRect(0, 298, WORLD_W, 3);
  }

  function drawTrack() {
    const y0 = 304;
    const y1 = 508;
    if (G.event === 'dash') {
      const clay = ctx.createLinearGradient(0, y0, 0, y1);
      clay.addColorStop(0, '#8a2c18');
      clay.addColorStop(0.5, '#c43a1c');
      clay.addColorStop(1, '#6a1c10');
      ctx.fillStyle = clay;
      ctx.fillRect(0, y0, WORLD_W, y1 - y0);

      for (let i = 0; i < LANE_Y.length; i++) {
        const y = LANE_Y[i] - 16;
        ctx.strokeStyle = 'rgba(255,236,220,0.55)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(WORLD_W, y);
        ctx.stroke();
        if (i === LANE_Y.length - 1) {
          ctx.beginPath();
          ctx.moveTo(0, y + 30);
          ctx.lineTo(WORLD_W, y + 30);
          ctx.stroke();
        }
      }

      const start = Math.floor((G.cam - 8) / 10) * 10;
      for (let m = start; m < G.cam + 48; m += 10) {
        if (m < 0) continue;
        const x = sx(m);
        ctx.strokeStyle = m === 0 || m === 100 ? 'rgba(255,244,236,0.9)' : 'rgba(17,6,5,0.35)';
        ctx.lineWidth = m === 0 || m === 100 ? 4 : 2;
        ctx.beginPath();
        ctx.moveTo(x, y0 + 4);
        ctx.lineTo(x, y1 - 8);
        ctx.stroke();
        if (m > 0 && m < 100) {
          ctx.fillStyle = 'rgba(255,244,236,0.55)';
          ctx.font = '800 13px Segoe UI, sans-serif';
          ctx.fillText(String(m), x + 6, y0 + 18);
        }
      }

      const fx = sx(DASH_END);
      ctx.fillStyle = 'rgba(255,244,236,0.92)';
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = i % 2 ? '#fff4ec' : '#110605';
        ctx.fillRect(fx - 7, y0 + 4 + i * 16, 14, 16);
      }
      ctx.fillStyle = '#110605';
      ctx.fillRect(fx - 18, y0 - 36, 8, 40);
      ctx.fillRect(fx + 10, y0 - 36, 8, 40);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.font = '900 16px Segoe UI, sans-serif';
      ctx.fillText('终点', fx - 16, y0 - 42);

      const sx0 = sx(0);
      for (let i = 0; i < LANE_Y.length; i++) {
        const y = LANE_Y[i];
        ctx.fillStyle = '#1a0a08';
        ctx.fillRect(sx0 - 22, y - 8, 16, 5);
        ctx.fillRect(sx0 - 18, y - 4, 12, 4);
      }
    } else if (G.event === 'jump') {
      const clay = ctx.createLinearGradient(0, y0, 0, y1);
      clay.addColorStop(0, '#7a2816');
      clay.addColorStop(1, '#5a180e');
      ctx.fillStyle = clay;
      ctx.fillRect(0, y0, WORLD_W, 80);
      ctx.fillStyle = '#c43a1c';
      ctx.fillRect(0, EVENT_Y - 28, WORLD_W, 56);
      ctx.strokeStyle = 'rgba(255,236,220,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, EVENT_Y - 28);
      ctx.lineTo(WORLD_W, EVENT_Y - 28);
      ctx.moveTo(0, EVENT_Y + 28);
      ctx.lineTo(WORLD_W, EVENT_Y + 28);
      ctx.stroke();

      const bx = sx(BOARD);
      ctx.fillStyle = '#fff4ec';
      ctx.fillRect(bx, EVENT_Y - 30, BOARD_W * MPP, 60);
      ctx.fillStyle = '#ff3a18';
      ctx.fillRect(bx + BOARD_W * MPP, EVENT_Y - 30, 4, 60);

      const pit0 = sx(BOARD + BOARD_W);
      const pit1 = sx(BOARD + 14);
      const sg = ctx.createLinearGradient(0, EVENT_Y - 24, 0, EVENT_Y + 36);
      sg.addColorStop(0, '#d2b07a');
      sg.addColorStop(1, '#9a7844');
      ctx.fillStyle = sg;
      ctx.fillRect(pit0, EVENT_Y - 24, pit1 - pit0, 60);
      ctx.fillStyle = 'rgba(80,50,20,0.35)';
      for (let i = 0; i < 18; i++) {
        ctx.fillRect(pit0 + 12 + i * 22, EVENT_Y - 10 + (i % 3) * 8, 9, 2);
      }

      for (let m = 1; m <= 10; m++) {
        const x = sx(BOARD + BOARD_W + m);
        ctx.strokeStyle = 'rgba(17,6,5,0.28)';
        ctx.beginPath();
        ctx.moveTo(x, EVENT_Y - 24);
        ctx.lineTo(x, EVENT_Y + 36);
        ctx.stroke();
        if (m % 2 === 0) {
          ctx.fillStyle = 'rgba(17,6,5,0.55)';
          ctx.font = '700 11px Segoe UI, sans-serif';
          ctx.fillText(m + 'm', x + 3, EVENT_Y + 50);
        }
      }
    } else {
      ctx.fillStyle = '#7a2816';
      ctx.fillRect(0, y0, WORLD_W, 70);
      ctx.fillStyle = '#c43a1c';
      ctx.fillRect(0, EVENT_Y - 26, WORLD_W, 52);
      const grass = ctx.createLinearGradient(0, EVENT_Y + 26, 0, y1);
      grass.addColorStop(0, '#143018');
      grass.addColorStop(1, '#0c1c10');
      ctx.fillStyle = grass;
      ctx.fillRect(0, EVENT_Y + 26, WORLD_W, y1 - (EVENT_Y + 26));

      const lx = sx(JAV_LINE);
      ctx.fillStyle = '#fff4ec';
      ctx.fillRect(lx - 3, EVENT_Y - 30, 6, 58);
      ctx.fillStyle = '#ff3a18';
      ctx.fillRect(lx + 3, EVENT_Y - 30, 4, 58);

      for (let m = 10; m <= 90; m += 10) {
        const x = sx(JAV_LINE + m);
        ctx.strokeStyle = 'rgba(61,255,136,0.22)';
        ctx.beginPath();
        ctx.moveTo(x, EVENT_Y + 26);
        ctx.lineTo(x, y1);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,227,107,0.7)';
        ctx.font = '700 12px Segoe UI, sans-serif';
        ctx.fillText(m + 'm', x + 4, EVENT_Y + 48);
        ctx.fillStyle = rgba(GOLD, 0.8);
        ctx.fillRect(x - 2, EVENT_Y + 26, 4, 12);
      }
    }

    ctx.fillStyle = '#0a0404';
    ctx.fillRect(0, 508, WORLD_W, 32);
  }

  function drawAthlete(px, py, phase, col, o) {
    o = o || {};
    const s = o.s || 1;
    const z = o.z || 0;
    const air = z * MPP;
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = 'rgba(0,0,0,' + (0.32 * (1 - Math.min(0.7, z * 0.18))) + ')';
    ctx.beginPath();
    ctx.ellipse(0, 3, 13 * s * (1 + z * 0.12), 4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.translate(0, -air);
    ctx.rotate(o.lean || 0);

    const swing = Math.sin(phase * TAU);
    const swing2 = Math.sin(phase * TAU + Math.PI);
    const tuck = o.pose === 'tuck';
    const land = o.pose === 'land';
    const a1 = tuck ? 0.9 : land ? 0.15 : swing;
    const a2 = tuck ? -0.5 : land ? 0.2 : swing2;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = rgba(col, 0.75);
    ctx.lineWidth = 3.1 * s;
    ctx.beginPath();
    ctx.moveTo(1 * s, -30 * s);
    ctx.lineTo((-8 + a1 * 12) * s, -16 * s);
    ctx.lineTo((-10 + a1 * 18) * s, (-6 + (tuck ? -8 : 0)) * s);
    ctx.stroke();

    ctx.strokeStyle = '#2a1210';
    ctx.lineWidth = 3.5 * s;
    ctx.beginPath();
    ctx.moveTo(0, -18 * s);
    ctx.lineTo((-5 + a2 * 9) * s, -7 * s);
    ctx.lineTo((-3 + a2 * 16) * s, (2 + (tuck ? -10 : 0)) * s);
    ctx.stroke();
    ctx.fillStyle = o.me ? '#00f0ff' : rgba(col, 0.9);
    ctx.beginPath();
    ctx.ellipse((-1 + a2 * 16) * s, (3 + (tuck ? -10 : 0)) * s, 5.4 * s, 2.1 * s, 0.25, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = '#2a1210';
    ctx.beginPath();
    ctx.moveTo(0, -18 * s);
    ctx.lineTo((-5 + a1 * 9) * s, -7 * s);
    ctx.lineTo((-3 + a1 * 16) * s, (2 + (tuck ? -6 : 0)) * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse((-1 + a1 * 16) * s, (3 + (tuck ? -6 : 0)) * s, 5.4 * s, 2.1 * s, 0.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = hex(col);
    roundRect(-7 * s, -38 * s, 13 * s, 22 * s, 4 * s);
    ctx.fill();
    if (o.me) {
      ctx.fillStyle = 'rgba(0,0,255,0.0)';
      ctx.fillStyle = '#fff4ec';
      ctx.font = '900 ' + (9 * s) + 'px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('1', 0, -24 * s);
      ctx.textAlign = 'left';
    }

    ctx.strokeStyle = rgba(col, 0.95);
    ctx.lineWidth = 3.1 * s;
    ctx.beginPath();
    ctx.moveTo(2 * s, -32 * s);
    ctx.lineTo((8 + a2 * 12) * s, -18 * s);
    ctx.lineTo((12 + a2 * 16) * s, (-8 + (tuck ? 6 : 0)) * s);
    ctx.stroke();

    if (o.javHold) {
      ctx.save();
      ctx.translate(10 * s, -30 * s);
      ctx.rotate(-0.7);
      ctx.fillStyle = '#ffe36b';
      ctx.fillRect(-6, -1.5, 36, 3);
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(38, -3);
      ctx.lineTo(38, 3);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = hex(SKIN);
    ctx.beginPath();
    ctx.arc(1.4 * s, -46 * s, 6.3 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0808';
    ctx.beginPath();
    ctx.arc(0.2 * s, -48.4 * s, 5.2 * s, Math.PI * 1.05, -0.15, false);
    ctx.fill();

    if (o.flash) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.beginPath();
      ctx.arc(0, -28 * s, 22 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawJavelin() {
    const j = G.jav;
    if (!j) return;
    const px = sx(j.x);
    const py = groundY() - j.z * MPP;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-j.ang);
    ctx.shadowColor = rgba(GOLD, 0.55);
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffe36b';
    ctx.fillRect(-30, -2, 46, 3.4);
    ctx.fillStyle = '#ff3a18';
    ctx.fillRect(-4, -3, 10, 5.2);
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(28, -4);
    ctx.lineTo(28, 4);
    ctx.fill();
    ctx.restore();
    if (j.stuck) {
      ctx.strokeStyle = 'rgba(255,227,107,0.35)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(sx(JAV_LINE), groundY() + 8);
      ctx.lineTo(px, groundY() + 8);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawMeters() {
    const x = 70;
    const y = 404;
    const w = 680;
    const h = 16;
    ctx.save();
    ctx.translate(WORLD_W * 0.5, y + h * 0.5);
    ctx.scale(G.meterPunch, G.meterPunch);
    ctx.translate(-WORLD_W * 0.5, -(y + h * 0.5));
    roundRect(x, y, w, h, 8);
    ctx.fillStyle = 'rgba(10,4,4,0.72)';
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.45);
    ctx.lineWidth = 2;
    ctx.stroke();
    const p = clamp(G.power, 0, 1);
    const grd = ctx.createLinearGradient(x, 0, x + w, 0);
    grd.addColorStop(0, '#00f0ff');
    grd.addColorStop(0.45, '#ffe36b');
    grd.addColorStop(0.78, '#ff6b32');
    grd.addColorStop(1, '#fff4ec');
    roundRect(x + 2, y + 2, Math.max(2, (w - 4) * p), h - 4, 6);
    ctx.fillStyle = grd;
    ctx.fill();
    if (p > 0.92) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(GOLD, 0.35 + Math.sin(G.t * 18) * 0.12);
      roundRect(x + 2, y + 2, (w - 4) * p, h - 4, 6);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.font = '800 11px Segoe UI, sans-serif';
    ctx.fillText('力量', x, y - 6);
    if (p >= 0.98) {
      ctx.fillStyle = hex(GOLD);
      ctx.font = '900 13px Segoe UI, sans-serif';
      ctx.fillText('MAX', x + w - 40, y - 6);
    }

    if (G.event === 'jav' && (G.phase === 'run' || G.phase === 'set' || G.phase === 'intro')) {
      const cx = 888;
      const cy = 368;
      ctx.strokeStyle = 'rgba(255,244,236,0.18)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, 54, -Math.PI * 0.08, -Math.PI * 0.92, true);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.78);
      ctx.lineWidth = 10;
      const a0 = -40 * Math.PI / 180;
      const a1 = -50 * Math.PI / 180;
      ctx.beginPath();
      ctx.arc(cx, cy, 54, a0, a1, true);
      ctx.stroke();
      const ang = -G.ang * Math.PI / 180;
      ctx.strokeStyle = hex(HOT);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang) * 58, cy + Math.sin(ang) * 58);
      ctx.stroke();
      ctx.fillStyle = hex(GOLD);
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.font = '800 12px Segoe UI, sans-serif';
      ctx.fillText((G.ang | 0) + '°', cx - 14, cy + 28);
    }

    if (G.event === 'jump' && G.phase === 'run') {
      const d = BOARD + BOARD_W - G.x;
      const on = G.x >= BOARD - 0.16 && d >= 0;
      const cx = 860;
      const cy = 360;
      roundRect(cx - 50, cy - 46, 100, 92, 12);
      ctx.fillStyle = 'rgba(10,4,4,0.55)';
      ctx.fill();
      ctx.strokeStyle = d < 0 ? rgba(HOT, 0.8) : (on ? rgba(GOLD, 0.8) : rgba(CYN, 0.45));
      ctx.stroke();
      ctx.fillStyle = d < 0 ? hex(HOT) : (on ? hex(GOLD) : hex(CYN));
      ctx.font = '800 12px Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d < 0 ? '过线' : (on ? '起跳' : '距板'), cx, cy - 20);
      ctx.font = '900 22px Segoe UI, sans-serif';
      ctx.fillText(d < 0 ? '犯规' : d.toFixed(2), cx, cy + 10);
      ctx.textAlign = 'left';
    }
  }

  function drawBanner() {
    if (G.phase === 'intro') {
      ctx.fillStyle = 'rgba(10,3,2,0.28)';
      ctx.fillRect(0, 150, WORLD_W, 120);
      ctx.fillStyle = hex(GOLD);
      ctx.font = '900 42px Segoe UI, PingFang SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(NAMES[G.event], WORLD_W * 0.5, 204);
      const q = qualOf(G.event);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.font = '700 18px Segoe UI, PingFang SC, sans-serif';
      ctx.fillText('达标 ' + (G.event === 'dash' ? fmtTime(q) : fmtDist(q) + 'm'), WORLD_W * 0.5, 238);
      ctx.textAlign = 'left';
    }
    if (G.phase === 'set') {
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.font = '800 20px Segoe UI, PingFang SC, sans-serif';
      const word = G.setT > 1.7 ? '各就位' : '预备';
      ctx.fillText(word, WORLD_W * 0.5, 168);
      const n = Math.max(1, Math.ceil(G.setT));
      if (G.setT > 0) {
        ctx.fillStyle = hex(n === 1 ? HOT : GOLD);
        ctx.font = '900 92px Segoe UI, sans-serif';
        ctx.fillText(String(n), WORLD_W * 0.5, 268);
      }
      ctx.textAlign = 'left';
    }
    if (G.phase === 'result' && G.banner) {
      ctx.textAlign = 'center';
      ctx.fillStyle = hex(G.bannerCol);
      ctx.font = '900 48px Segoe UI, PingFang SC, sans-serif';
      ctx.fillText(G.banner, WORLD_W * 0.5, 188);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.font = '800 28px Segoe UI, sans-serif';
      if (G.event === 'dash') ctx.fillText(fmtTime(G.mark) + (G.place ? '  ·  第' + G.place : ''), WORLD_W * 0.5, 230);
      else ctx.fillText(G.foul ? '—' : fmtDist(G.mark) + 'm', WORLD_W * 0.5, 230);
      ctx.textAlign = 'left';
    }
    if (G.mode === 'title') {
      ctx.fillStyle = rgba(HOT, 0.12);
    }
  }

  function drawFx() {
    for (let i = 0; i < lines.length; i++) {
      const p = lines[i];
      const a = 1 - p.t / p.life;
      ctx.strokeStyle = rgba(WHT, 0.22 * a);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.w, p.y);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / r.life;
      ctx.strokeStyle = rgba(r.col, 0.55 * a);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < dusts.length; i++) {
      const d = dusts[i];
      const a = 1 - d.t / d.life;
      ctx.fillStyle = 'rgba(210,176,122,' + (0.35 * a) + ')';
      ctx.beginPath();
      ctx.ellipse(sx(d.x), d.y, d.r * (1 + d.t * 1.4), 8 * a + 4, 0, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = 1 - p.t / p.life;
      const col = p.col === 'c' ? CYN : p.col === 'g' ? GOLD : p.col === 'w' ? WHT : p.col === 'm' ? MAG : HOT;
      ctx.fillStyle = rgba(col, 0.85 * a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.7 + a * 0.3), 0, TAU);
      ctx.fill();
    }
    ctx.font = '900 16px Segoe UI, PingFang SC, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const a = 1 - p.t / p.life;
      ctx.fillStyle = p.col;
      ctx.globalAlpha = a;
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    }
    ctx.textAlign = 'left';
  }

  function draw() {
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#110605';
    ctx.fillRect(0, 0, view.w, view.h);

    const shx = REDUCE ? 0 : (Math.sin(G.t * 54) * G.shake);
    const shy = REDUCE ? 0 : (Math.cos(G.t * 47) * G.shake * 0.6);
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);
    ctx.translate(WORLD_W * 0.5, WORLD_H * 0.5);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-WORLD_W * 0.5 + shx, -WORLD_H * 0.5 + shy);

    drawSky();
    drawStands();
    drawTrack();

    if (G.event === 'dash') {
      const order = rivals.slice().sort(function (a, b) {
        return LANE_Y[a.lane] - LANE_Y[b.lane];
      });
      const py = LANE_Y[PLAYER_LANE];
      const drawn = [];
      for (let i = 0; i < order.length; i++) {
        if (LANE_Y[order[i].lane] < py) {
          drawAthlete(sx(order[i].x), LANE_Y[order[i].lane], order[i].phase, order[i].col, { s: 0.92 });
        } else drawn.push(order[i]);
      }
      const pose = G.phase === 'air' ? 'tuck' : (G.phase === 'land' || G.phase === 'result' ? 'land' : 'run');
      drawAthlete(sx(G.x), py, G.phaseRun, HOT, {
        s: 1.05, z: G.z, lean: G.lean, me: true, pose: pose, flash: G.power > 0.92
      });
      for (let i = 0; i < drawn.length; i++) {
        drawAthlete(sx(drawn[i].x), LANE_Y[drawn[i].lane], drawn[i].phase, drawn[i].col, { s: 0.92 });
      }
    } else {
      const pose = G.phase === 'air' && G.event === 'jump' ? 'tuck'
        : (G.phase === 'land' || G.phase === 'result' ? 'land' : 'run');
      drawAthlete(sx(G.x), groundY(), G.phaseRun, HOT, {
        s: 1.08, z: G.z, lean: G.lean, me: true, pose: pose,
        javHold: G.event === 'jav' && !G.jav, flash: G.power > 0.92
      });
      drawJavelin();
    }

    drawFx();
    drawMeters();
    drawBanner();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.28);
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    if (G.gunFlash > 0) {
      ctx.fillStyle = rgba(WHT, G.gunFlash * 0.45);
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }

    ctx.restore();
  }

  function syncHud(force) {
    if (!force && !hudDirty) {
      if (powBar) powBar.style.transform = 'scaleX(' + clamp(G.power, 0, 1).toFixed(3) + ')';
      return;
    }
    hudDirty = false;
    scoreEl.textContent = String(G.score);
    bestEl.textContent = String(currentBest());
    comboEl.textContent = '×' + G.mashStreak;
    if (modeLabel) {
      modeLabel.textContent = G.kind === 'sprint' ? '冲刺' : '全能';
      modeLabel.classList.toggle('sprint', G.kind === 'sprint');
    }
    if (eventLabel) eventLabel.textContent = NAMES[G.event] || '100米';
    const q = qualOf(G.event);
    if (qualLabel) {
      qualLabel.textContent = G.event === 'dash' ? '达标 ' + fmtTime(q) : '达标 ' + fmtDist(q) + 'm';
    }
    let mark = '—';
    if (G.event === 'dash' && (G.phase === 'run' || G.phase === 'land' || G.phase === 'result')) {
      mark = fmtTime(G.clock);
    } else if (G.event === 'jump' && G.phase !== 'intro' && G.phase !== 'set') {
      mark = G.phase === 'result' || G.phase === 'land' ? fmtDist(G.mark) : fmtDist(Math.max(0, G.x - BOARD));
    } else if (G.event === 'jav' && G.phase !== 'intro' && G.phase !== 'set') {
      mark = G.phase === 'result' || G.phase === 'land' ? fmtDist(G.mark)
        : (G.jav ? fmtDist(Math.max(0, G.jav.x - JAV_LINE)) : '—');
    }
    if (G.mode === 'title') mark = '—';
    markEl.textContent = mark;
    if (powBar) powBar.style.transform = 'scaleX(' + clamp(G.power, 0, 1).toFixed(3) + ')';
    if (powWrap) {
      powWrap.classList.toggle('hot', G.power > 0.82);
      powWrap.classList.toggle('max', G.power > 0.96);
    }
    if (markBox) markBox.classList.toggle('flash', G.phase === 'result');
  }

  function resize() {
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    canvas.width = Math.max(1, (view.w * view.dpr) | 0);
    canvas.height = Math.max(1, (view.h * view.dpr) | 0);
    canvas.style.width = view.w + 'px';
    canvas.style.height = view.h + 'px';
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    view.scale = Math.min(view.w / WORLD_W, view.h / WORLD_H);
    view.ox = (view.w - WORLD_W * view.scale) * 0.5;
    view.oy = (view.h - WORLD_H * view.scale) * 0.5;
  }

  function onKey(e, down) {
    const c = e.code;
    if (c === 'ArrowLeft' || c === 'ArrowRight' || c === 'ArrowUp' || c === 'ArrowDown' || c === 'Space') {
      e.preventDefault();
    }
    if (!down) {
      if (c === 'KeyA' || c === 'ArrowLeft' || c === 'KeyZ') {
        if (btnA) btnA.classList.remove('held');
      }
      if (c === 'KeyD' || c === 'ArrowRight' || c === 'KeyC' || c === 'KeyX') {
        if (btnD) btnD.classList.remove('held');
      }
      if (c === 'Space' || c === 'KeyK' || c === 'KeyJ') {
        if (btnAct) btnAct.classList.remove('held');
      }
      return;
    }
    if (c === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (c === 'KeyR') {
      e.preventDefault();
      restart();
      return;
    }
    if (e.repeat) return;
    if (G.mode === 'title') {
      if (c === 'Digit1' || c === 'Numpad1' || c === 'Enter' || c === 'Space') {
        startGame('all');
        return;
      }
      if (c === 'Digit2' || c === 'Numpad2') {
        startGame('sprint');
        return;
      }
    }
    if (G.mode === 'over') {
      if (c === 'Enter' || c === 'Space') {
        startGame(G.kind || 'all');
        return;
      }
      if (c === 'Digit1' || c === 'KeyB') {
        goTitle();
        return;
      }
    }
    if (c === 'KeyA' || c === 'ArrowLeft' || c === 'KeyZ') {
      mash(-1);
      if (btnA) btnA.classList.add('held');
      return;
    }
    if (c === 'KeyD' || c === 'ArrowRight' || c === 'KeyC' || c === 'KeyX') {
      mash(1);
      if (btnD) btnD.classList.add('held');
      return;
    }
    if (c === 'Space' || c === 'KeyK' || c === 'KeyJ') {
      if (btnAct) btnAct.classList.add('held');
      doAction();
    }
  }

  function bindPad(el, fnDown, fnUp) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      el.classList.add('held');
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      fnDown(e);
    });
    function up(e) {
      el.classList.remove('held');
      if (fnUp) fnUp(e);
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  bindPad(btnA, function () { mash(-1); });
  bindPad(btnD, function () { mash(1); });
  bindPad(btnAct, function () { doAction(); });

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (e.pointerType === 'touch') document.body.classList.add('touchy');
    if (G.mode === 'title') return;
    if (G.mode === 'over') return;
    if (overlayOpen()) return;
    e.preventDefault();
    mash(tapSide);
    tapSide *= -1;
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') document.body.classList.add('touchy');
  }, { passive: true });

  let last = 0;
  let acc = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const t = now * 0.001;
    let dt = t - (last || t);
    last = t;
    if (dt > 0.08) dt = 0.08;
    G.t = t;
    if (hidden) return;
    if (G.stop > 0 && !REDUCE) {
      G.stop -= dt;
    } else {
      acc += dt;
      if (acc > 0.12) acc = 0.12;
      while (acc >= STEP) {
        if (G.mode === 'title') updateTitle(STEP);
        else if (G.mode === 'play' || G.mode === 'over') updatePlay(STEP);
        acc -= STEP;
      }
    }
    updateFx(dt);
    const rumbleOn = (G.phase === 'set' || G.phase === 'run') && G.power > 0.08 && G.mode !== 'over';
    audio.tickRumble(rumbleOn, G.power);
    syncHud(false);
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  G.best = loadBest();
  initMute();
  goTitle();
  resize();

  if (btnAll) btnAll.addEventListener('click', function () { audio.ensure(); startGame('all'); });
  if (btnSprint) btnSprint.addEventListener('click', function () { audio.ensure(); startGame('sprint'); });
  if (ovRetry) ovRetry.addEventListener('click', function () { audio.ensure(); startGame(G.kind || 'all'); });
  if (ovModes) ovModes.addEventListener('click', function () { audio.ensure(); goTitle(); });
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
      audio.tickRumble(false, 0);
    }
  });

  requestAnimationFrame(loop);
})();
