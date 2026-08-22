'use strict';

(function () {
  const VW = 720;
  const VH = 400;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const HORIZON = 86;
  const GROUND = 318;
  const HP_MAX = 100;
  const LIVES = 3;
  const LIFE_MAX = 5;
  const FIRE_CD = 0.072;
  const NADE_MAX = 6;
  const COMBO_WIN = 1.55;
  const UP_EVERY = 18000;
  const BEST_KEY = 'playbox-cabal-best';
  const MUTE_KEY = 'playbox-cabal-mute';
  const OPS = '← → / AD 移动 · 鼠标或 IJKL 瞄准 · 空格射击 · Shift/Z 手雷 · ↓ 蹲 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAGC = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [198, 255, 61];
  const HOT2 = [232, 255, 138];
  const WHT = [243, 255, 240];
  const SKIN = [214, 168, 126];
  const FAT = [58, 86, 44];
  const FAT2 = [38, 58, 30];
  const STEEL = [62, 72, 70];
  const STEEL2 = [36, 44, 42];

  const SCORE = {
    grunt: 100,
    gunner: 160,
    runner: 130,
    tank: 600,
    boss: 2800,
    crate: 80,
    cover: 400
  };

  const STAGES = [
    {
      id: 'outpost', name: '哨所', tag: 'POST',
      sky0: [10, 16, 14], sky1: [48, 42, 18], far: [28, 40, 22],
      mid: [42, 48, 24], ground: [58, 52, 28], accent: HOT, fog: 0.1
    },
    {
      id: 'town', name: '街区', tag: 'TOWN',
      sky0: [8, 10, 22], sky1: [22, 18, 40], far: [24, 28, 42],
      mid: [30, 36, 32], ground: [36, 38, 30], accent: CYN, fog: 0.12
    },
    {
      id: 'fort', name: '要塞', tag: 'FORT',
      sky0: [6, 10, 12], sky1: [16, 28, 22], far: [18, 32, 26],
      mid: [22, 36, 28], ground: [28, 34, 26], accent: GOLD, fog: 0.16
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
  const btnFront = document.getElementById('btn-front');
  const btnRain = document.getElementById('btn-rain');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnNade = document.getElementById('btn-nade');
  const btnFire = document.getElementById('btn-fire');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnDuck = document.getElementById('btn-duck');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const nadeLabel = document.getElementById('nade-label');
  const hpBar = document.getElementById('hp-bar');
  const hpWrap = document.getElementById('hp-wrap');
  const pipsEl = document.getElementById('pips');
  const livesEl = document.getElementById('lives');
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
  let comboTok = 0;
  let kickTok = 0;

  const keys = {
    l: false, r: false, duck: false, fire: false,
    aimL: false, aimR: false, aimU: false, aimD: false
  };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: 170, id: null };
  const pips = [];
  const lifeDots = [];
  const particles = [];
  const rings = [];
  const floats = [];
  const holes = [];
  const casings = [];
  const tracers = [];
  const inbound = [];
  const nades = [];
  const chunks = [];
  const smoke = [];
  const buildings = [];
  const ents = [];

  const G = {
    mode: 'title',
    kind: 'front',
    stage: 0,
    phase: 'cover',
    t: 0,
    clock: 0,
    score: 0,
    best: 0,
    bestC: 0,
    bestR: 0,
    combo: 0,
    comboT: 0,
    comboPeak: 0,
    mult: 1,
    hp: HP_MAX,
    lives: LIVES,
    nades: 4,
    fireCd: 0,
    nadeCd: 0,
    invuln: 0,
    spawnT: 0.4,
    kills: 0,
    trans: 0,
    bossOn: false,
    px: VW * 0.5,
    duck: 0,
    facing: 1,
    walk: 0,
    aim: { x: VW * 0.5, y: 170 },
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: WHT,
    punch: 1,
    hurtFlash: 0,
    gunKick: 0,
    toastT: 0,
    nextUp: UP_EVERY,
    coverDown: 0
  };

  function clamp(n, a, b) {
    return n < a ? a : n > b ? b : n;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot(ax, ay) {
    return Math.sqrt(ax * ax + ay * ay);
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function rgbStr(rgb) {
    return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
  }
  function hash(n) {
    n = ((n | 0) * 374761393) | 0;
    n = (n ^ (n >>> 13)) >>> 0;
    return n / 4294967296;
  }
  function pal() {
    return STAGES[G.stage] || STAGES[0];
  }
  function isFront() { return G.kind === 'front'; }
  function isRain() { return G.kind === 'rain'; }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function comboMul(n) {
    return 1 + Math.min(4, Math.floor(Math.max(0, n - 1) / 2));
  }
  function playing() {
    return G.mode === 'play' && !overlayOpen();
  }
  function dens() {
    return isRain() ? 1.7 : 1;
  }
  function project(wx, z) {
    const zz = clamp(z, 0.08, 1.15);
    const s = 0.3 + zz * 0.7;
    const y = HORIZON + zz * (GROUND - HORIZON);
    const x = VW * 0.5 + (wx - VW * 0.5) * (0.4 + zz * 0.6);
    return { x: x, y: y, s: s, z: zz };
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
        this.master.gain.value = this.muted ? 0 : 0.44;
        this.master.connect(this.ctx.destination);
      } catch (err) {
        this.ctx = null;
        this.master = null;
      }
    },
    setMuted(m) {
      this.muted = !!m;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.44;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
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
    noise(dur, vol, hp, delay) {
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
      const t = this.ctx.currentTime + (delay || 0);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    shot() {
      this.ensure();
      this.noise(0.048, 0.12, 380);
      this.beep(148, 0.055, 'square', 0.055, 52);
      this.beep(72, 0.08, 'triangle', 0.04, 30);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.95, Math.max(0, combo - 1) * 0.09);
      this.noise(0.035, 0.05, 1600);
      this.beep(620 * lift, 0.055, 'square', 0.05, 980 * lift);
      this.beep(1180 * lift, 0.09, 'triangle', 0.03, 1720 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.3, 0.18, 160);
      this.beep(84, 0.24, 'triangle', 0.11, 32);
      this.beep(44, 0.32, 'sine', 0.09, 20);
      this.beep(210, 0.08, 'square', 0.04, 64);
    },
    collapse() {
      this.ensure();
      this.noise(0.42, 0.2, 90);
      this.beep(110, 0.28, 'sawtooth', 0.07, 36);
      this.beep(58, 0.4, 'triangle', 0.08, 22, 0.05);
      this.beep(180, 0.12, 'square', 0.035, 50, 0.14);
    },
    whoosh() {
      this.ensure();
      this.noise(0.14, 0.07, 520);
      this.beep(340, 0.14, 'sawtooth', 0.035, 80);
    },
    duck() {
      this.ensure();
      this.noise(0.08, 0.04, 1400);
      this.beep(420, 0.07, 'sine', 0.03, 180);
    },
    miss() {
      this.ensure();
      this.noise(0.06, 0.035, 2200);
      this.beep(880, 0.05, 'triangle', 0.02, 1400);
    },
    hurt() {
      this.ensure();
      this.noise(0.11, 0.09, 420);
      this.beep(260, 0.13, 'sawtooth', 0.065, 72);
      this.beep(130, 0.2, 'triangle', 0.05, 46, 0.04);
    },
    pick() {
      this.ensure();
      this.beep(700, 0.06, 'sine', 0.045, 1040);
      this.beep(1040, 0.1, 'triangle', 0.04, 1400, 0.05);
    },
    combo(n) {
      this.ensure();
      this.beep(420 + n * 40, 0.07, 'sine', 0.042, 840);
      this.beep(840, 0.12, 'triangle', 0.032, 1260);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.05, 784);
      this.beep(784, 0.1, 'triangle', 0.045, 1046, 0.08);
      this.beep(1046, 0.14, 'sine', 0.04, 1318, 0.16);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'sine', 0.04, 659, 0.08);
      this.beep(784, 0.16, 'triangle', 0.045, 1046, 0.16);
    },
    start() {
      this.ensure();
      this.beep(349, 0.08, 'square', 0.04, 698);
      this.beep(523, 0.12, 'triangle', 0.04, 880, 0.08);
    },
    win() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.05, 659);
      this.beep(659, 0.08, 'sine', 0.045, 784, 0.08);
      this.beep(784, 0.1, 'triangle', 0.05, 1046, 0.16);
      this.beep(1046, 0.22, 'sine', 0.05, 1318, 0.26);
    },
    lose() {
      this.ensure();
      this.beep(330, 0.14, 'sawtooth', 0.055, 150);
      this.beep(196, 0.3, 'triangle', 0.05, 72, 0.1);
    }
  };

  function loadBest() {
    G.bestC = 0;
    G.bestR = 0;
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.bestC = (o.c | 0) || 0;
        G.bestR = (o.r | 0) || 0;
      } else {
        G.bestC = parseInt(raw, 10) || 0;
      }
    } catch (err) { /* ignore */ }
  }

  function saveBest() {
    if (isFront()) {
      if (G.score > G.bestC) G.bestC = G.score;
    } else if (G.score > G.bestR) G.bestR = G.score;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, r: G.bestR }));
    } catch (err) { /* ignore */ }
  }

  function modeBest() {
    return isFront() ? G.bestC : G.bestR;
  }

  function toast(text, warn, gold) {
    if (!toastEl) return;
    toastTok += 1;
    const id = toastTok;
    toastEl.textContent = text;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = gold ? 1.45 : 1.05;
    setTimeout(function () {
      if (id === toastTok && G.toastT <= 0) toastEl.classList.add('hidden');
    }, 1800);
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function bumpScore(n) {
    if (!scoreAdd) return;
    addTok += 1;
    const id = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    setTimeout(function () {
      if (id === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function bumpCombo() {
    if (!comboBox) return;
    comboTok += 1;
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
    const id = comboTok;
    setTimeout(function () {
      if (id === comboTok) comboBox.classList.remove('hot');
    }, 360);
  }

  function syncPips() {
    if (pipsEl) {
      while (pips.length < NADE_MAX) {
        const d = document.createElement('i');
        d.className = 'pip';
        pipsEl.appendChild(d);
        pips.push(d);
      }
      for (let i = 0; i < pips.length; i++) {
        pips[i].className = i < G.nades ? 'pip on' : 'pip gone';
      }
    }
    if (livesEl) {
      while (lifeDots.length < LIFE_MAX) {
        const d = document.createElement('i');
        d.className = 'life';
        livesEl.appendChild(d);
        lifeDots.push(d);
      }
      for (let i = 0; i < lifeDots.length; i++) {
        lifeDots[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
        lifeDots[i].className = i < G.lives ? 'life on' : 'life gone';
      }
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(modeBest());
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '卡巴';
      else stageLabel.textContent = isFront() ? '前线' : '弹雨';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.combo >= 6);
    }
    if (tagLabel) {
      if (G.mode === 'title') tagLabel.textContent = 'CABAL';
      else if (G.phase === 'boss') tagLabel.textContent = '首领';
      else tagLabel.textContent = pal().name;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || (G.mode === 'play' && (G.hp <= 28 || G.lives <= 1)));
      tagLabel.classList.toggle('hot', G.mode === 'win' || G.phase === 'boss' || G.combo >= 5);
    }
    if (nadeLabel) {
      nadeLabel.textContent = '雷 ' + G.nades;
      nadeLabel.classList.toggle('warn', G.mode === 'play' && G.nades <= 0);
    }
    if (hpBar) {
      const p = clamp(G.hp / HP_MAX, 0, 1);
      hpBar.style.transform = 'scaleX(' + p + ')';
    }
    if (hpWrap) {
      const track = hpWrap.querySelector('.fill-track');
      if (track) track.classList.toggle('warn', G.hp <= 28);
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 命尽即负', 'warn');
    else if (G.mode === 'win') setHint((isFront() ? '前线打穿' : '弹雨穿过') + ' · R 再来', 'hot');
    else if (G.hp <= 28) setHint('重伤 · 蹲下躲弹，侧移躲炮', 'warn');
    else if (G.combo >= 6) setHint('连击 ×' + G.mult + ' · 别断', 'hot');
    else if (G.phase === 'boss') setHint('首领 · 炮要侧移，枪弹可蹲', 'hot');
    else setHint(OPS, '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'CABAL';
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

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.006));
    if (!stageEl || G.mode === 'title') return;
    kickTok += 1;
    const id = kickTok;
    stageEl.classList.remove('hit', 'die', 'boom');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls || 'hit');
    setTimeout(function () {
      if (id === kickTok) stageEl.classList.remove('hit', 'die', 'boom');
    }, 420);
  }

  function screenFlash(rgb, amt) {
    G.flash = Math.max(G.flash, amt);
    G.flashRgb = rgb;
  }

  function addScore(n) {
    if (n <= 0) return;
    G.score += n;
    bumpScore(n);
    while (G.score >= G.nextUp) {
      G.nextUp += UP_EVERY;
      if (G.lives < LIFE_MAX) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.extra();
        floatTxt(G.px, GROUND - 50, '1UP', GOLD);
      }
    }
    saveBest();
    syncHud();
  }

  function floatTxt(x, y, text, rgb) {
    floats.push({ x: x, y: y - 18, text: text, t: 0, life: 0.74, rgb: rgb || GOLD });
  }

  function burst(x, y, n, rgb, spd, grav) {
    if (particles.length > 180) particles.splice(0, n);
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.3, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - rand(20, 90),
        life: rand(0.28, 0.72),
        t: 0,
        r: rand(1.4, 3.6),
        rgb: rgb,
        g: grav == null ? 240 : grav
      });
    }
  }

  function addRing(x, y, rgb) {
    rings.push({ x: x, y: y, r: 6, tr: 56, t: 0, life: 0.36, rgb: rgb });
  }

  function addSmoke(x, y, n) {
    for (let i = 0; i < n; i++) {
      smoke.push({
        x: x + rand(-8, 8), y: y + rand(-6, 4),
        vx: rand(-12, 12), vy: rand(-38, -12),
        t: 0, life: rand(0.5, 1.1), r: rand(4, 10),
        rgb: [80, 84, 70]
      });
    }
  }

  function resetFx() {
    particles.length = 0;
    rings.length = 0;
    floats.length = 0;
    holes.length = 0;
    casings.length = 0;
    tracers.length = 0;
    inbound.length = 0;
    nades.length = 0;
    chunks.length = 0;
    smoke.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.hurtFlash = 0;
    G.gunKick = 0;
  }

  function clearWorld() {
    ents.length = 0;
    buildings.length = 0;
  }

  function countLive() {
    let n = 0;
    for (let i = 0; i < ents.length; i++) {
      if (!ents[i].dead && ents[i].state !== 'die') n += 1;
    }
    return n;
  }

  function coverLeft() {
    let n = 0;
    for (let i = 0; i < buildings.length; i++) {
      if (buildings[i].state === 'up') n += 1;
    }
    return n;
  }

  function gunOrigin() {
    const duck = G.duck;
    return {
      x: G.px + G.facing * 16,
      y: GROUND - 26 + duck * 18 + G.gunKick * 7
    };
  }

  function chestY() {
    return GROUND - 36 + G.duck * 22;
  }

  function addBldg(kind, wx, z, w, h) {
    let hp = 8;
    if (kind === 'brick') hp = 14;
    if (kind === 'bunker') hp = 18;
    if (kind === 'wall') hp = 10;
    if (kind === 'bags') hp = 6;
    if (kind === 'gate') hp = 16;
    if (isRain()) hp += 2;
    buildings.push({
      kind: kind,
      wx: wx,
      z: z,
      w: w,
      h: h,
      hp: hp,
      max: hp,
      state: 'up',
      fallT: 0,
      tilt: Math.random() < 0.5 ? -1 : 1,
      flash: 0,
      smokeT: 0
    });
  }

  function layoutBuildings(st) {
    buildings.length = 0;
    if (st === 0) {
      addBldg('wood', 200, 0.5, 88, 74);
      addBldg('wood', 520, 0.54, 94, 80);
      addBldg('bags', 360, 0.7, 70, 26);
    } else if (st === 1) {
      addBldg('brick', 160, 0.4, 78, 90);
      addBldg('brick', 360, 0.34, 72, 98);
      addBldg('brick', 560, 0.44, 82, 88);
      addBldg('wall', 360, 0.62, 210, 22);
    } else {
      addBldg('bunker', 190, 0.46, 102, 62);
      addBldg('gate', 360, 0.38, 90, 96);
      addBldg('bunker', 530, 0.48, 102, 62);
      addBldg('bags', 280, 0.72, 52, 24);
      addBldg('bags', 450, 0.74, 52, 24);
    }
  }

  function bldgHit(b, ax, ay) {
    if (b.state === 'gone') return false;
    if (b.state === 'fall' && b.fallT > 0.4) return false;
    const p = project(b.wx, b.z);
    const w = b.w * p.s * 0.52;
    const h = b.h * p.s * (b.state === 'fall' ? Math.max(0.2, 1 - b.fallT) : 1);
    return ax > p.x - w && ax < p.x + w && ay > p.y - h && ay < p.y + 8;
  }

  function pickBuilding(ax, ay) {
    let best = null;
    let bestZ = -1;
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (!bldgHit(b, ax, ay)) continue;
      if (b.z > bestZ) {
        best = b;
        bestZ = b.z;
      }
    }
    return best;
  }

  function bodyPt(e) {
    const p = project(e.wx, e.z);
    const peek = e.peek == null ? 1 : e.peek;
    const duck = e.kind === 'tank' || e.boss ? 0 : (1 - peek) * 18 * p.s;
    return { x: p.x, y: p.y - 22 * p.s + duck, s: p.s };
  }

  function hitR(e) {
    const p = project(e.wx, e.z);
    const peek = e.peek == null ? 1 : e.peek;
    const base = e.r || 16;
    return base * p.s * (0.55 + peek * 0.45);
  }

  function pickEnt(ax, ay) {
    let best = null;
    let bestD = 1e9;
    let bestZ = -1;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.dead || e.state === 'die') continue;
      const p = bodyPt(e);
      const d = hypot(p.x - ax, p.y - ay);
      const lim = hitR(e) + 7;
      if (d < lim && (e.z > bestZ + 0.04 || (Math.abs(e.z - bestZ) < 0.04 && d < bestD))) {
        best = e;
        bestD = d;
        bestZ = e.z;
      }
    }
    return best;
  }

  function mkEnt(kind) {
    const e = {
      kind: kind,
      wx: 360,
      z: 0.6,
      vx: 0,
      hp: 1,
      t: 0,
      state: 'live',
      dieT: 0,
      shootT: rand(0.8, 1.6),
      facing: 1,
      peek: 1,
      hide: rand(0, 1),
      flash: 0,
      fireGlow: 0,
      walk: rand(0, TAU),
      boss: false,
      drop: '',
      r: 15,
      dead: false,
      bldg: -1
    };
    if (kind === 'grunt') { e.hp = 1; e.r = 14; }
    if (kind === 'gunner') { e.hp = 2; e.r = 16; e.shootT = rand(0.4, 0.9); }
    if (kind === 'runner') { e.hp = 1; e.r = 13; }
    if (kind === 'tank') { e.hp = isRain() ? 12 : 10; e.r = 28; }
    if (kind === 'crate') { e.hp = 1; e.r = 12; }
    return e;
  }

  function liveCover() {
    const list = [];
    for (let i = 0; i < buildings.length; i++) {
      if (buildings[i].state === 'up' && buildings[i].kind !== 'bags' && buildings[i].kind !== 'wall') {
        list.push(i);
      }
    }
    return list;
  }

  function spawnKind(kind) {
    const e = mkEnt(kind);
    if (kind === 'grunt' || kind === 'gunner') {
      const cov = liveCover();
      if (cov.length) {
        const i = cov[(Math.random() * cov.length) | 0];
        const b = buildings[i];
        e.bldg = i;
        e.wx = b.wx + rand(-b.w * 0.28, b.w * 0.28);
        e.z = b.z + rand(0.02, 0.08);
        e.peek = 0.4;
      } else {
        e.kind = 'runner';
        kind = 'runner';
        e.r = 13;
        e.hp = 1;
      }
    }
    if (kind === 'runner') {
      const left = Math.random() < 0.5;
      e.wx = left ? -40 : VW + 40;
      e.z = rand(0.55, 0.78);
      e.facing = left ? 1 : -1;
      e.vx = (left ? 1 : -1) * rand(70, 110);
    }
    if (kind === 'tank') {
      const left = Math.random() < 0.5;
      e.wx = left ? -80 : VW + 80;
      e.z = rand(0.52, 0.66);
      e.facing = left ? 1 : -1;
      e.vx = (left ? 1 : -1) * rand(36, 58);
      e.shootT = rand(0.7, 1.3);
    }
    if (kind === 'crate') {
      e.wx = rand(140, VW - 140);
      e.z = rand(0.48, 0.7);
      e.drop = Math.random() < 0.5 ? 'nade' : 'med';
      e.life = 7;
    }
    ents.push(e);
    return e;
  }

  function spawnBoss() {
    const e = mkEnt('tank');
    e.boss = true;
    e.kind = 'tank';
    const st = G.stage;
    e.hp = st === 0 ? 22 : st === 1 ? 28 : 36;
    e.r = st === 2 ? 34 : 30;
    e.z = 0.5;
    e.wx = VW * 0.5;
    e.vx = st === 2 ? 0 : 48;
    e.shootT = 0.45;
    e.facing = 1;
    ents.push(e);
    G.bossOn = true;
    G.phase = 'boss';
    const name = st === 0 ? '装甲车' : st === 1 ? '重坦克' : '要塞炮';
    toast('掩体全毁 · ' + name, false, true);
    audio.stage();
    return e;
  }

  function rollKind() {
    const r = Math.random();
    const rain = isRain();
    if (G.phase === 'boss') {
      if (r < 0.55) return 'grunt';
      if (r < 0.82) return 'gunner';
      return 'runner';
    }
    if (G.mode === 'title') {
      if (r < 0.6) return 'grunt';
      if (r < 0.85) return 'gunner';
      return 'runner';
    }
    const st = G.stage;
    const tankChance = rain ? 0.14 : 0.08;
    if (r < tankChance && st >= 0) return 'tank';
    if (st === 0) {
      if (r < 0.22) return 'gunner';
      if (r < 0.4) return 'runner';
      return 'grunt';
    }
    if (st === 1) {
      if (r < 0.32) return 'gunner';
      if (r < 0.5) return 'runner';
      if (r < 0.58) return 'tank';
      return 'grunt';
    }
    if (r < 0.36) return 'gunner';
    if (r < 0.52) return 'runner';
    if (r < 0.64) return 'tank';
    return 'grunt';
  }

  function spawnCap() {
    if (G.mode === 'title') return 5;
    const base = isRain() ? 9 : 6;
    return base + G.stage + (G.phase === 'boss' ? 1 : 0);
  }

  function spawnInterval() {
    if (G.mode === 'title') return 1.2;
    const rain = isRain() ? 0.58 : 1;
    const boss = G.phase === 'boss' ? 1.25 : 1;
    return Math.max(0.28, (1.18 - G.stage * 0.12) * rain * boss);
  }

  function maybeSpawn(dt) {
    if (G.mode !== 'title' && G.mode !== 'play') return;
    if (G.trans > 0 || G.phase === 'clear') return;
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    G.spawnT = spawnInterval() * rand(0.72, 1.2);
    if (countLive() >= spawnCap()) return;
    if (G.mode === 'play' && Math.random() < 0.08 && countLive() < spawnCap()) {
      spawnKind('crate');
      return;
    }
    spawnKind(rollKind());
  }

  function missFx(ax, ay) {
    holes.push({ x: ax, y: ay, t: 0, life: 2.2 });
    burst(ax, ay, 3, HOT2, 70, 70);
  }

  function enemyShot(e) {
    if (G.mode !== 'play') return;
    e.fireGlow = 0.12;
    const p = bodyPt(e);
    const shell = e.kind === 'tank' || e.boss;
    const rain = dens();
    const life = (shell ? 0.72 : e.kind === 'gunner' ? 0.42 : 0.55) / Math.min(1.35, 0.75 + rain * 0.25);
    const tx = G.px + rand(shell ? -18 : -40, shell ? 18 : 40);
    const ty = shell ? GROUND - 6 : chestY() + rand(-8, 10);
    inbound.push({
      x: p.x, y: p.y,
      tx: tx, ty: ty,
      t: 0, life: life,
      dmg: e.boss ? (G.stage === 2 ? 24 : 18) : shell ? 22 : e.kind === 'gunner' ? 12 : 10,
      duckable: !shell,
      shell: shell,
      rgb: shell ? GOLD : MAGC
    });
    burst(p.x, p.y, 4, HOT, 70, 40);
  }

  function loseLife() {
    if (G.mode !== 'play') return;
    G.lives -= 1;
    kick(9, 'die');
    screenFlash(MAGC, 0.5);
    hitStop(0.06);
    audio.hurt();
    if (G.lives <= 0) {
      dieNow();
      return;
    }
    G.hp = HP_MAX;
    G.invuln = 1.45;
    G.px = VW * 0.5;
    G.duck = 0;
    toast('命 -1', true, false);
    floatTxt(G.px, GROUND - 48, '命 -1', MAGC);
    syncHud();
  }

  function hurt(dmg) {
    if (!playing() || G.invuln > 0) return;
    G.hp = Math.max(0, G.hp - dmg);
    G.invuln = 0.5;
    G.hurtFlash = 0.34;
    screenFlash(MAGC, 0.4);
    kick(7.2, 'hit');
    audio.hurt();
    syncHud();
    if (G.hp <= 0) loseLife();
  }

  function pickup(e) {
    e.dead = true;
    if (e.drop === 'nade') {
      G.nades = Math.min(NADE_MAX, G.nades + 1);
      toast('手雷 +1', false, true);
    } else {
      G.hp = Math.min(HP_MAX, G.hp + 30);
      toast('急救 +30', false, true);
    }
    addScore(SCORE.crate);
    const p = project(e.wx, e.z);
    floatTxt(p.x, p.y, '+80', GOLD);
    burst(p.x, p.y, 12, e.drop === 'med' ? CYN : GOLD, 140, 120);
    addRing(p.x, p.y, GOLD);
    audio.pick();
    syncHud();
  }

  function noteCombo(x, y) {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.comboPeak) G.comboPeak = G.combo;
    G.mult = comboMul(G.combo);
    if (G.combo === 3 || G.combo === 6 || G.combo === 10) {
      audio.combo(G.combo);
      bumpCombo();
      floatTxt(x + 16, y - 20, '连击 ×' + G.mult, GOLD);
    } else bumpCombo();
  }

  function kill(e) {
    e.state = 'die';
    e.dieT = 0;
    G.kills += 1;
    const p = bodyPt(e);
    noteCombo(p.x, p.y);
    const key = e.boss ? 'boss' : e.kind;
    const n = Math.floor((SCORE[key] || 100) * G.mult);
    addScore(n);
    floatTxt(p.x, p.y - 10, '+' + n, e.boss ? GOLD : HOT2);
    const rgb = e.boss ? GOLD : (G.combo >= 5 ? CYN : HOT);
    burst(p.x, p.y, e.boss ? 30 : 12, rgb, e.boss ? 250 : 170, 200);
    addRing(p.x, p.y, rgb);
    audio.hit(G.combo);
    hitStop(e.boss ? 0.08 : 0.042 + Math.min(0.03, G.combo * 0.004));
    kick(e.boss ? 12 : 4.4, e.boss ? 'boom' : 'hit');
    screenFlash(rgb, e.boss ? 0.42 : 0.16);
    if (e.boss) {
      G.bossOn = false;
      toast(G.stage === 2 ? '要塞炮哑了' : '首领击毁', false, true);
      stageClear();
    }
    syncHud();
  }

  function damageEnt(e, dmg) {
    if (e.kind === 'crate') {
      pickup(e);
      return;
    }
    e.hp -= dmg;
    e.flash = 0.14;
    const p = bodyPt(e);
    burst(p.x, p.y, 6, WHT, 90, 60);
    if (e.hp <= 0) kill(e);
    else {
      audio.hit(G.combo);
      hitStop(0.032);
      G.gunKick = 1;
    }
  }

  function collapseBuilding(b) {
    if (b.state !== 'up') return;
    b.state = 'fall';
    b.fallT = 0;
    const p = project(b.wx, b.z);
    G.coverDown += 1;
    noteCombo(p.x, p.y - b.h * p.s * 0.5);
    const n = Math.floor(SCORE.cover * G.mult);
    addScore(n);
    floatTxt(p.x, p.y - b.h * p.s * 0.6, '+' + n, GOLD);
    audio.collapse();
    hitStop(0.07);
    kick(12, 'boom');
    screenFlash(HOT, 0.38);
    addRing(p.x, p.y - 20, HOT);
    addRing(p.x, p.y - 10, GOLD);
    burst(p.x, p.y - 20, 26, HOT, 240, 90);
    burst(p.x, p.y - 10, 16, GOLD, 180, 70);
    addSmoke(p.x, p.y - 24, 10);
    const col = b.kind === 'brick' ? [92, 70, 52] : b.kind === 'bunker' ? [70, 78, 72] : [110, 96, 58];
    for (let i = 0; i < 16; i++) {
      chunks.push({
        x: p.x + rand(-b.w * p.s * 0.4, b.w * p.s * 0.4),
        y: p.y - rand(8, b.h * p.s * 0.9),
        vx: rand(-90, 90),
        vy: rand(-160, -20),
        rot: rand(0, TAU),
        rv: rand(-6, 6),
        w: rand(5, 14),
        h: rand(4, 10),
        t: 0,
        life: rand(0.55, 1.05),
        rgb: col
      });
    }
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.dead || e.state === 'die') continue;
      if (e.bldg < 0) continue;
      if (buildings[e.bldg] === b) {
        damageEnt(e, 99);
      }
    }
    toast('掩体崩了', false, true);
    syncHud();
  }

  function damageBldg(b, dmg) {
    if (b.state !== 'up') return;
    b.hp -= dmg;
    b.flash = 0.12;
    const p = project(b.wx, b.z);
    burst(G.aim.x, G.aim.y, 5, WHT, 80, 50);
    addSmoke(p.x, p.y - b.h * p.s * 0.6, 1);
    const chip = Math.floor(15 * G.mult);
    addScore(chip);
    if (b.hp <= 0) collapseBuilding(b);
    else {
      audio.hit(G.combo);
      hitStop(0.03);
      G.gunKick = 1;
    }
  }

  function tryFire() {
    if (!playing()) return;
    if (G.fireCd > 0) return;
    G.fireCd = FIRE_CD;
    G.gunKick = 1;
    audio.shot();
    const g = gunOrigin();
    casings.push({
      x: g.x + 6, y: g.y,
      vx: rand(-40, 40) + G.facing * 40,
      vy: rand(-220, -90),
      t: 0, life: 0.5, rot: rand(0, TAU), rv: rand(8, 16)
    });
    const spread = G.combo >= 8 ? 2 : 4.2;
    const ax = G.aim.x + rand(-spread, spread);
    const ay = G.aim.y + rand(-spread * 0.55, spread * 0.55);
    tracers.push({
      x0: g.x, y0: g.y, x1: ax, y1: ay,
      t: 0, life: 0.05
    });
    const ent = pickEnt(ax, ay);
    const bld = pickBuilding(ax, ay);
    if (ent && bld) {
      if (ent.z >= bld.z - 0.02) damageEnt(ent, 1);
      else damageBldg(bld, 1);
    } else if (ent) damageEnt(ent, 1);
    else if (bld) damageBldg(bld, 1);
    else missFx(ax, ay);
    syncHud();
  }

  function throwNade() {
    if (!playing()) return;
    if (G.nades <= 0 || G.nadeCd > 0) return;
    G.nades -= 1;
    G.nadeCd = 0.46;
    const g = gunOrigin();
    const dist = hypot(G.aim.x - g.x, G.aim.y - g.y);
    nades.push({
      x0: g.x, y0: g.y,
      x1: G.aim.x, y1: G.aim.y,
      t: 0,
      fuse: 0.22 + dist / 900
    });
    audio.whoosh();
    syncHud();
  }

  function nadePos(n) {
    const p = clamp(n.t / n.fuse, 0, 1);
    return {
      x: lerp(n.x0, n.x1, p),
      y: lerp(n.y0, n.y1, p) - Math.sin(p * Math.PI) * 78,
      p: p
    };
  }

  function boom(x, y) {
    hitStop(0.072);
    kick(13, 'boom');
    screenFlash(GOLD, 0.48);
    audio.boom();
    addRing(x, y, GOLD);
    addRing(x, y, HOT);
    burst(x, y, 32, HOT, 280, 80);
    burst(x, y, 18, GOLD, 200, 60);
    burst(x, y, 10, WHT, 160, 40);
    addSmoke(x, y, 6);
    let n = 0;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.dead || e.state === 'die') continue;
      const p = bodyPt(e);
      if (hypot(p.x - x, p.y - y) > 96) continue;
      if (e.kind === 'crate') pickup(e);
      else {
        damageEnt(e, 4);
        n += 1;
      }
    }
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (b.state !== 'up') continue;
      const p = project(b.wx, b.z);
      const cy = p.y - b.h * p.s * 0.45;
      if (hypot(p.x - x, cy - y) > 110) continue;
      damageBldg(b, 4);
      n += 1;
    }
    if (n >= 3) {
      const b = 100 * n;
      addScore(b);
      toast('手雷清场 ×' + n, false, true);
      floatTxt(x, y - 36, '清场 +' + b, GOLD);
    }
  }

  function maybeBoss() {
    if (G.mode !== 'play') return;
    if (G.phase !== 'cover') return;
    if (coverLeft() > 0) return;
    G.phase = 'boss';
    G.spawnT = 0.55;
    spawnBoss();
  }

  function dieNow() {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.hp = 0;
    G.lives = 0;
    saveBest();
    audio.lose();
    kick(8, 'die');
    screenFlash(MAGC, 0.55);
    hitStop(0.07);
    const lead = pal().name + '  ·  击毁 ' + G.kills + '  ·  本局 ' + G.score + '  ·  最高 ' + modeBest();
    showOverlay('lose', '战死', lead);
    syncHud();
  }

  function winNow() {
    G.mode = 'win';
    const bonus = 4000 + G.nades * 200 + G.hp * 12 + G.lives * 400;
    addScore(bonus);
    saveBest();
    audio.win();
    kick(10, 'boom');
    screenFlash(GOLD, 0.5);
    const title = isFront() ? '前线打穿' : '弹雨穿过';
    const lead = '击毁 ' + G.kills + '  ·  掩体 ' + G.coverDown + '  ·  本局 ' + G.score + '  ·  最高 ' + modeBest();
    showOverlay('win', title, lead);
    toast(isFront() ? '要塞拿下' : '弹雨穿过', false, true);
    syncHud();
  }

  function stageClear() {
    const bonus = 1500 + Math.floor(G.hp * 8) + G.lives * 200;
    addScore(bonus);
    G.phase = 'clear';
    G.trans = 1.2;
    audio.stage();
    toast(pal().name + ' 肃清', false, true);
  }

  function beginStage(i) {
    G.stage = i;
    G.phase = 'cover';
    G.bossOn = false;
    G.spawnT = 0.32;
    ents.length = 0;
    inbound.length = 0;
    nades.length = 0;
    chunks.length = 0;
    layoutBuildings(i);
    toast(STAGES[i].name, false, true);
    audio.stage();
    syncHud();
  }

  function nextStage() {
    if (G.stage >= 2) {
      winNow();
      return;
    }
    beginStage(G.stage + 1);
  }

  function startGame(kind) {
    G.kind = kind === 'rain' ? 'rain' : 'front';
    G.mode = 'play';
    G.score = 0;
    G.combo = 0;
    G.comboPeak = 0;
    G.mult = 1;
    G.comboT = 0;
    G.hp = HP_MAX;
    G.lives = LIVES;
    G.nades = isFront() ? 4 : 3;
    G.fireCd = 0;
    G.nadeCd = 0;
    G.invuln = 0.5;
    G.kills = 0;
    G.trans = 0;
    G.spawnT = 0.28;
    G.px = VW * 0.5;
    G.duck = 0;
    G.nextUp = UP_EVERY;
    G.coverDown = 0;
    G.aim.x = VW * 0.5;
    G.aim.y = 170;
    resetFx();
    hideOverlay();
    audio.start();
    beginStage(0);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'front';
    G.stage = 0;
    G.phase = 'cover';
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.hp = HP_MAX;
    G.lives = LIVES;
    G.nades = 4;
    G.px = VW * 0.5;
    G.duck = 0;
    G.bossOn = false;
    G.spawnT = 0.45;
    resetFx();
    clearWorld();
    layoutBuildings(0);
    showOverlay('title', '卡巴', '士兵站在战壕。左右挪位，准星点杀。蹲下躲弹，手雷掀屋。打掉掩体，再干首领。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('front');
    else startGame(G.kind || 'front');
  }

  function updateEnt(e, dt) {
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.fireGlow > 0) e.fireGlow -= dt;
    if (e.state === 'die') {
      e.dieT += dt;
      e.z = Math.min(1.05, e.z + dt * 0.15);
      e.peek = Math.max(0, e.peek - dt * 2.2);
      if (e.dieT > 0.5) e.dead = true;
      return;
    }
    e.walk += dt * 8;

    if (e.kind === 'crate') {
      e.life -= dt;
      if (e.life <= 0) e.dead = true;
      return;
    }

    if (e.kind === 'runner' || (e.kind === 'tank' && !e.boss)) {
      e.wx += e.vx * dt;
      e.peek = 1;
      if (e.wx < -90 || e.wx > VW + 90) {
        e.dead = true;
        return;
      }
    }

    if (e.boss) {
      e.peek = 1;
      if (G.stage === 2) {
        e.wx = VW * 0.5 + Math.sin(e.t * 0.7) * 40;
      } else {
        e.wx += e.vx * dt;
        if (e.wx < 120 || e.wx > VW - 120) e.vx *= -1;
      }
    }

    if (e.kind === 'grunt' || e.kind === 'gunner') {
      if (e.bldg >= 0) {
        const b = buildings[e.bldg];
        if (!b || b.state !== 'up') {
          e.kind = 'runner';
          e.vx = (e.wx < VW * 0.5 ? -1 : 1) * rand(70, 110);
          e.bldg = -1;
        }
      }
      if (G.mode === 'title' && e.t > 5.2) {
        e.dead = true;
        return;
      }
      e.hide += dt;
      const cycle = e.kind === 'gunner' ? 1.7 : 2.05;
      const show = e.kind === 'gunner' ? 1.15 : 1.0;
      const ph = e.hide % cycle;
      e.peek = ph < show ? clamp((show - Math.abs(ph - show * 0.5)) / (show * 0.25), 0.32, 1) : 0.22;
    }

    if (G.mode !== 'play') return;
    if (e.peek < 0.42 && e.kind !== 'tank' && e.kind !== 'runner') return;
    e.shootT -= dt;
    const cap = isRain() ? 16 : 10;
    if (e.shootT <= 0 && inbound.length < cap) {
      enemyShot(e);
      const rain = isRain() ? 0.72 : 1;
      const cd = e.boss ? rand(0.38, 0.62)
        : e.kind === 'tank' ? rand(0.95, 1.5)
          : e.kind === 'gunner' ? rand(0.72, 1.2)
            : rand(1.15, 1.95);
      e.shootT = cd * rain;
    }
  }

  function updateBuildings(dt) {
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (b.flash > 0) b.flash -= dt;
      if (b.state === 'fall') {
        b.fallT += dt * 1.15;
        if (b.fallT >= 1) b.state = 'gone';
      } else if (b.state === 'up' && b.hp < b.max * 0.5) {
        b.smokeT += dt;
        if (b.smokeT > 0.22) {
          b.smokeT = 0;
          const p = project(b.wx, b.z);
          addSmoke(p.x + rand(-12, 12), p.y - b.h * p.s * 0.7, 1);
        }
      }
    }
  }

  function updateFx(dt) {
    G.clock += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.hurtFlash > 0) G.hurtFlash = Math.max(0, G.hurtFlash - dt * 2.2);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.35);
    if (G.gunKick > 0) G.gunKick = Math.max(0, G.gunKick - dt * 8);
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.nadeCd > 0) G.nadeCd -= dt;

    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0 && G.combo > 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.t += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.r += 8 * dt;
      if (s.t >= s.life) smoke.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      if (rings[i].t + dt >= rings[i].life) rings.splice(i, 1);
      else rings[i].t += dt;
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= 40 * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = holes.length - 1; i >= 0; i--) {
      holes[i].t += dt;
      if (holes[i].t >= holes[i].life) holes.splice(i, 1);
    }
    for (let i = casings.length - 1; i >= 0; i--) {
      const c = casings[i];
      c.t += dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 780 * dt;
      c.rot += c.rv * dt;
      if (c.t >= c.life) casings.splice(i, 1);
    }
    for (let i = tracers.length - 1; i >= 0; i--) {
      tracers[i].t += dt;
      if (tracers[i].t >= tracers[i].life) tracers.splice(i, 1);
    }
    for (let i = chunks.length - 1; i >= 0; i--) {
      const c = chunks[i];
      c.t += dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 520 * dt;
      c.rot += c.rv * dt;
      if (c.t >= c.life) chunks.splice(i, 1);
    }
    for (let i = nades.length - 1; i >= 0; i--) {
      const n = nades[i];
      n.t += dt;
      if (n.t >= n.fuse) {
        const p = nadePos(n);
        boom(p.x, p.y);
        nades.splice(i, 1);
      }
    }
    for (let i = inbound.length - 1; i >= 0; i--) {
      const s = inbound[i];
      s.t += dt;
      if (s.t >= s.life) {
        if (G.mode === 'play') {
          if (s.duckable) {
            if (G.duck > 0.55 || Math.abs(s.tx - G.px) > 46) {
              audio.miss();
              floatTxt(G.px + rand(-12, 12), GROUND - 64, G.duck > 0.55 ? '躲' : '偏', CYN);
              burst(G.px, GROUND - 70, 5, CYN, 70, 20);
            } else {
              hurt(s.dmg);
              burst(s.tx, s.ty, 8, MAGC, 110, 40);
            }
          } else if (s.shell) {
            const dx = Math.abs(s.tx - G.px);
            burst(s.tx, GROUND - 8, 14, GOLD, 140, 40);
            addRing(s.tx, GROUND - 6, GOLD);
            if (dx < 34) hurt(s.dmg);
            else {
              audio.miss();
              floatTxt(s.tx, GROUND - 40, '偏', HOT2);
            }
          }
        }
        inbound.splice(i, 1);
      }
    }
  }

  function updateAim(dt) {
    const spd = 320;
    if (!(pointer.hover || pointer.down)) {
      if (keys.aimL) G.aim.x -= spd * dt;
      if (keys.aimR) G.aim.x += spd * dt;
      if (keys.aimU) G.aim.y -= spd * dt;
      if (keys.aimD) G.aim.y += spd * dt;
    } else {
      G.aim.x = pointer.x;
      G.aim.y = pointer.y;
    }
    G.aim.x = clamp(G.aim.x, 10, VW - 10);
    G.aim.y = clamp(G.aim.y, 16, GROUND - 8);
  }

  function updatePlayer(dt) {
    const wantDuck = keys.duck ? 1 : 0;
    const prev = G.duck;
    G.duck += (wantDuck - G.duck) * Math.min(1, dt * 14);
    if (wantDuck > 0.5 && prev < 0.2 && playing()) audio.duck();
    const spd = (G.duck > 0.5 ? 96 : 214);
    if (G.mode === 'title') {
      G.px = VW * 0.5 + Math.sin(G.t * 0.65) * 130;
      let live = null;
      for (let i = 0; i < ents.length; i++) {
        if (!ents[i].dead && ents[i].state !== 'die' && ents[i].kind !== 'crate') {
          live = ents[i];
          break;
        }
      }
      if (live) {
        const p = bodyPt(live);
        G.aim.x += (p.x - G.aim.x) * Math.min(1, dt * 4);
        G.aim.y += (p.y - G.aim.y) * Math.min(1, dt * 4);
      }
      if (G.fireCd <= 0) {
        G.fireCd = FIRE_CD * 1.4;
        G.gunKick = 1;
        const g = gunOrigin();
        tracers.push({ x0: g.x, y0: g.y, x1: G.aim.x, y1: G.aim.y, t: 0, life: 0.05 });
        const hit = pickEnt(G.aim.x, G.aim.y) || pickBuilding(G.aim.x, G.aim.y);
        if (hit && hit.kind) {
          if (hit.max) {
            hit.hp -= 1;
            hit.flash = 0.1;
            if (hit.hp <= 0) {
              hit.hp = hit.max;
              burst(G.aim.x, G.aim.y, 8, HOT, 120, 80);
            }
          } else {
            hit.flash = 0.1;
          }
        }
      }
      return;
    }
    if (!playing()) return;
    if (keys.l) G.px -= spd * dt;
    if (keys.r) G.px += spd * dt;
    G.px = clamp(G.px, 54, VW - 54);
    G.facing = G.aim.x >= G.px ? 1 : -1;
    G.walk += (keys.l || keys.r ? 1 : 0) * dt * 10;
    if (keys.fire || pointer.down) tryFire();
  }

  function update(dt) {
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.15);
      return;
    }
    G.t += dt;
    updateAim(dt);
    updatePlayer(dt);
    updateFx(dt);
    updateBuildings(dt);

    if (G.trans > 0) {
      G.trans -= dt;
      if (G.trans <= 0) {
        G.trans = 0;
        if (G.phase === 'clear') {
          if (G.stage >= 2) winNow();
          else nextStage();
        }
      }
    }

    maybeSpawn(dt);
    for (let i = ents.length - 1; i >= 0; i--) {
      updateEnt(ents[i], dt);
      if (ents[i].dead) ents.splice(i, 1);
    }
    maybeBoss();
  }

  function drawSky() {
    const p = pal();
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON + 8);
    g.addColorStop(0, rgbStr(p.sky0));
    g.addColorStop(1, rgbStr(p.sky1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, HORIZON + 10);
    ctx.fillStyle = rgba(p.accent, 0.55);
    ctx.beginPath();
    ctx.arc(VW * 0.78, 34, 16, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.35);
    ctx.beginPath();
    ctx.arc(VW * 0.78, 34, 8, 0, TAU);
    ctx.fill();
  }

  function drawHills() {
    const p = pal();
    ctx.fillStyle = rgbStr(p.far);
    ctx.beginPath();
    ctx.moveTo(0, HORIZON);
    for (let x = 0; x <= VW; x += 18) {
      const h = 10 + hash(x * 3 + G.stage * 17) * 28;
      ctx.lineTo(x, HORIZON - h);
    }
    ctx.lineTo(VW, HORIZON);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgbStr(p.mid);
    ctx.beginPath();
    ctx.moveTo(0, HORIZON + 6);
    for (let x = 0; x <= VW; x += 22) {
      const h = 6 + hash(x * 5 + 40) * 18;
      ctx.lineTo(x, HORIZON + 8 - h);
    }
    ctx.lineTo(VW, GROUND);
    ctx.lineTo(0, GROUND);
    ctx.closePath();
    ctx.fill();
  }

  function drawGround() {
    const p = pal();
    const g = ctx.createLinearGradient(0, HORIZON, 0, VH);
    g.addColorStop(0, rgbStr(p.mid));
    g.addColorStop(0.45, rgbStr(p.ground));
    g.addColorStop(1, '#12180e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, VH);
    ctx.lineTo(0, GROUND + 8);
    ctx.lineTo(VW * 0.5 - 210, HORIZON + 4);
    ctx.lineTo(VW * 0.5 + 210, HORIZON + 4);
    ctx.lineTo(VW, GROUND + 8);
    ctx.lineTo(VW, VH);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba(p.accent, 0.12);
    ctx.lineWidth = 1;
    const vpX = VW * 0.5;
    const vpY = HORIZON;
    for (let i = -5; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(vpX + i * 18, vpY);
      ctx.lineTo(vpX + i * 92, VH);
      ctx.stroke();
    }
    for (let z = 0.2; z <= 1; z += 0.12) {
      const y = HORIZON + z * (GROUND - HORIZON);
      const w = 80 + z * 280;
      ctx.beginPath();
      ctx.moveTo(vpX - w, y);
      ctx.lineTo(vpX + w, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#161c10';
    ctx.fillRect(0, GROUND + 10, VW, VH - GROUND);
    ctx.fillStyle = rgba(HOT, 0.08);
    ctx.fillRect(0, GROUND + 8, VW, 3);
  }

  function drawBldg(b) {
    if (b.state === 'gone') return;
    const p = project(b.wx, b.z);
    const fall = b.state === 'fall' ? b.fallT : 0;
    const s = p.s;
    const w = b.w * s;
    const h = b.h * s * (fall ? Math.max(0.18, 1 - fall * 1.05) : 1);
    const x = p.x;
    const y = p.y;
    ctx.save();
    ctx.translate(x, y);
    if (fall) ctx.rotate(fall * 0.55 * b.tilt);
    ctx.globalAlpha = fall ? Math.max(0, 1 - fall * 0.85) : 1;

    let c0 = [108, 92, 52];
    let c1 = [72, 60, 34];
    if (b.kind === 'brick') { c0 = [96, 62, 48]; c1 = [62, 38, 30]; }
    if (b.kind === 'bunker') { c0 = [70, 82, 74]; c1 = [40, 50, 46]; }
    if (b.kind === 'wall') { c0 = [86, 78, 58]; c1 = [54, 48, 34]; }
    if (b.kind === 'bags') { c0 = [110, 96, 54]; c1 = [78, 66, 36]; }
    if (b.kind === 'gate') { c0 = [58, 64, 60]; c1 = [32, 38, 36]; }
    if (b.flash > 0) {
      c0 = [220, 230, 200];
      c1 = [180, 190, 160];
    }

    const hw = w * 0.5;
    ctx.fillStyle = rgbStr(c1);
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.lineTo(-hw + 8 * s, -h);
    ctx.lineTo(hw + 8 * s, -h);
    ctx.lineTo(hw, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = rgbStr(c0);
    ctx.fillRect(-hw, -h, w, h);

    ctx.fillStyle = rgba([20, 24, 16], 0.35);
    ctx.fillRect(-hw, -h, w, 4 * s);

    const ratio = b.hp / b.max;
    if (b.kind !== 'bags' && b.kind !== 'wall') {
      const win = b.kind === 'bunker' ? 3 : 2;
      for (let i = 0; i < win; i++) {
        const wx = -hw + w * (0.22 + i * 0.28);
        const wy = -h * 0.62;
        ctx.fillStyle = ratio < 0.45 ? rgba(HOT, 0.35) : rgba([12, 16, 14], 0.7);
        ctx.fillRect(wx, wy, 8 * s, 10 * s);
      }
    }

    if (ratio < 0.7) {
      ctx.strokeStyle = rgba([20, 16, 10], 0.55);
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.4, -h * 0.8);
      ctx.lineTo(hw * 0.1, -h * 0.2);
      ctx.moveTo(-hw * 0.1, -h * 0.55);
      ctx.lineTo(hw * 0.45, -h * 0.15);
      ctx.stroke();
    }
    if (ratio < 0.4) {
      ctx.fillStyle = rgba([10, 10, 8], 0.55);
      ctx.beginPath();
      ctx.arc(-hw * 0.15, -h * 0.4, 6 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.25);
      ctx.fillRect(-hw * 0.3, -h * 0.9, w * 0.2, 5 * s);
    }

    if (b.kind === 'bags') {
      ctx.fillStyle = rgbStr(c0);
      for (let r = 0; r < 2; r++) {
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(-hw + i * (w / 4) + 1, -h + r * (h / 2) + 1, w / 4 - 2, h / 2 - 2);
        }
      }
    }
    if (b.kind === 'gate') {
      ctx.fillStyle = rgba([8, 10, 8], 0.65);
      ctx.fillRect(-10 * s, -h * 0.55, 20 * s, h * 0.55);
      ctx.fillStyle = rgba(HOT, 0.4);
      ctx.fillRect(-3 * s, -h * 0.95, 6 * s, 8 * s);
    }

    ctx.restore();
  }

  function drawPerson(e, gunner) {
    const p = bodyPt(e);
    const s = p.s;
    const peek = e.peek;
    ctx.save();
    ctx.translate(p.x, project(e.wx, e.z).y);
    ctx.scale(e.facing || 1, 1);
    const rise = 28 * s * peek;
    if (e.flash > 0) ctx.globalAlpha = 0.55;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, -2, 10 * s, 3.2 * s, 0, 0, TAU);
    ctx.fill();
    const body = gunner ? [62, 52, 40] : [70, 64, 42];
    ctx.fillStyle = rgbStr(body);
    ctx.fillRect(-6 * s, -rise * 0.55, 12 * s, rise * 0.45);
    ctx.fillStyle = rgbStr(SKIN);
    ctx.beginPath();
    ctx.arc(0, -rise * 0.72, 5 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgbStr(FAT2);
    ctx.fillRect(-5.5 * s, -rise * 0.86, 11 * s, 4 * s);
    ctx.fillStyle = rgbStr(HOT);
    ctx.fillRect(-5.5 * s, -rise * 0.78, 11 * s, 1.4 * s);
    ctx.fillStyle = rgbStr(STEEL2);
    ctx.fillRect(4 * s, -rise * 0.5, 12 * s, 2 * s);
    if (e.fireGlow > 0) {
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(16 * s, -rise * 0.48, 4 * s, 0, TAU);
      ctx.fill();
    }
    if (gunner) {
      ctx.fillStyle = rgbStr(STEEL);
      ctx.fillRect(3 * s, -rise * 0.58, 14 * s, 3.2 * s);
    }
    ctx.restore();
  }

  function drawTank(e) {
    const p = project(e.wx, e.z);
    const s = p.s * (e.boss ? 1.25 : 1);
    ctx.save();
    ctx.translate(p.x, p.y);
    if (e.flash > 0) ctx.globalAlpha = 0.6;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 22 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    const col = e.boss && G.stage === 2 ? [54, 68, 58] : STEEL;
    ctx.fillStyle = rgbStr(STEEL2);
    ctx.fillRect(-20 * s, -10 * s, 40 * s, 8 * s);
    ctx.fillStyle = rgbStr(col);
    ctx.fillRect(-16 * s, -22 * s, 32 * s, 14 * s);
    ctx.fillStyle = rgbStr(STEEL2);
    ctx.fillRect(-10 * s, -30 * s, 20 * s, 10 * s);
    const ang = Math.atan2(chestY() - (p.y - 26 * s), G.px - p.x);
    ctx.save();
    ctx.translate(0, -26 * s);
    ctx.rotate(ang);
    ctx.fillStyle = rgbStr(STEEL);
    ctx.fillRect(0, -2.2 * s, (e.boss ? 28 : 22) * s, 4.4 * s);
    if (e.fireGlow > 0) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc((e.boss ? 28 : 22) * s, 0, 5 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.fillStyle = rgba(HOT, 0.5);
    ctx.fillRect(-12 * s, -18 * s, 6 * s, 3 * s);
    ctx.fillRect(6 * s, -18 * s, 6 * s, 3 * s);
    if (e.boss) {
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-18 * s, -32 * s, 36 * s, 34 * s);
    }
    ctx.restore();
  }

  function drawCrate(e) {
    const p = project(e.wx, e.z);
    const s = p.s;
    const bob = Math.sin(G.clock * 3 + e.t) * 3;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.fillStyle = e.drop === 'med' ? rgba(CYN, 0.9) : rgba(GOLD, 0.9);
    ctx.fillRect(-8 * s, -16 * s, 16 * s, 16 * s);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-8 * s, -16 * s, 16 * s, 16 * s);
    ctx.fillStyle = '#142016';
    ctx.font = 'bold ' + Math.floor(9 * s) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.drop === 'med' ? '+' : '雷', 0, -4 * s);
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.kind === 'tank') drawTank(e);
    else if (e.kind === 'crate') drawCrate(e);
    else drawPerson(e, e.kind === 'gunner');
  }

  function drawPlayer() {
    const x = G.px;
    const duck = G.duck;
    const y = GROUND + 18;
    const lean = clamp((G.aim.x - x) / 140, -0.4, 0.4);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean * 0.12);
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) ctx.globalAlpha = 0.4;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 16, 4.5, 0, 0, TAU);
    ctx.fill();

    const squat = duck * 16;
    ctx.fillStyle = rgbStr(FAT2);
    ctx.fillRect(-8, -18 + squat * 0.4, 7, 18 - squat * 0.3);
    ctx.fillRect(1, -18 + squat * 0.4, 7, 18 - squat * 0.3);

    ctx.fillStyle = rgbStr(FAT);
    ctx.fillRect(-11, -40 + squat, 22, 24);

    ctx.fillStyle = rgbStr(SKIN);
    ctx.beginPath();
    ctx.arc(lean * 4, -50 + squat, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgbStr(FAT2);
    ctx.fillRect(-9, -58 + squat, 18, 8);
    ctx.fillStyle = rgbStr(HOT);
    ctx.fillRect(-9, -52 + squat, 18, 2.2);
    ctx.fillStyle = rgba(CYN, 0.55);
    ctx.fillRect(-6, -50 + squat, 12, 2);

    const g = gunOrigin();
    const ang = Math.atan2(G.aim.y - g.y, G.aim.x - g.x);
    ctx.save();
    ctx.translate(g.x - x, g.y - y);
    ctx.rotate(ang);
    ctx.fillStyle = rgbStr(STEEL2);
    ctx.fillRect(0, -2.4, 28, 4.8);
    ctx.fillStyle = rgbStr(STEEL);
    ctx.fillRect(18, -3.2, 14, 6.4);
    if (G.gunKick > 0.2) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(34, 0, 6 + G.gunKick * 4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(36, 0, 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawAim() {
    const x = G.aim.x;
    const y = G.aim.y;
    const hot = G.combo >= 5;
    const rgb = hot ? GOLD : HOT;
    ctx.save();
    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 3.2, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y - 18); ctx.lineTo(x, y - 7);
    ctx.moveTo(x, y + 7); ctx.lineTo(x, y + 18);
    ctx.moveTo(x - 18, y); ctx.lineTo(x - 7, y);
    ctx.moveTo(x + 7, y); ctx.lineTo(x + 18, y);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, TAU);
    ctx.fill();
    if (pickEnt(x, y) || pickBuilding(x, y)) {
      ctx.strokeStyle = rgba(MAGC, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < holes.length; i++) {
      const h = holes[i];
      const a = 1 - h.t / h.life;
      ctx.fillStyle = rgba([20, 18, 12], a * 0.7);
      ctx.beginPath();
      ctx.arc(h.x, h.y, 2.2, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < tracers.length; i++) {
      const t = tracers[i];
      const a = 1 - t.t / t.life;
      ctx.strokeStyle = rgba(HOT2, a);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(t.x0, t.y0);
      ctx.lineTo(t.x1, t.y1);
      ctx.stroke();
    }
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const a = 1 - c.t / c.life;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgbStr(c.rgb);
      ctx.fillRect(-c.w * 0.5, -c.h * 0.5, c.w, c.h);
      ctx.restore();
    }
    for (let i = 0; i < smoke.length; i++) {
      const s = smoke[i];
      const a = (1 - s.t / s.life) * 0.35;
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = 1 - p.t / p.life;
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const u = r.t / r.life;
      ctx.strokeStyle = rgba(r.rgb, 1 - u);
      ctx.lineWidth = 2.4 * (1 - u);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r + (r.tr - r.r) * u, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < casings.length; i++) {
      const c = casings[i];
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(-2, -1, 4, 2);
      ctx.restore();
    }
  }

  function drawIncoming() {
    for (let i = 0; i < inbound.length; i++) {
      const s = inbound[i];
      const p = clamp(s.t / s.life, 0, 1);
      const x = lerp(s.x, s.tx, p);
      const y = lerp(s.y, s.ty, p);
      const sc = 0.45 + p * 1.35;
      if (s.shell) {
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.beginPath();
        ctx.arc(x, y, 4.5 * sc, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(HOT, 0.5);
        ctx.beginPath();
        ctx.arc(x - (s.tx - s.x) * 0.04, y - (s.ty - s.y) * 0.04, 7 * sc, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.beginPath();
        ctx.arc(x, y, 2.4 * sc, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(WHT, 0.5);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lerp(s.x, s.tx, Math.max(0, p - 0.08)), lerp(s.y, s.ty, Math.max(0, p - 0.08)));
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    for (let i = 0; i < nades.length; i++) {
      const p = nadePos(nades[i]);
      ctx.fillStyle = rgbStr(GOLD);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.8);
      ctx.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = 'bold 13px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function drawHurt() {
    if (G.hurtFlash > 0) {
      ctx.fillStyle = rgba(MAGC, G.hurtFlash * 0.28);
      ctx.fillRect(0, 0, VW, VH);
      ctx.strokeStyle = rgba(MAGC, G.hurtFlash * 0.8);
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, VW - 8, VH - 8);
    }
    if (G.duck > 0.4 && playing()) {
      ctx.fillStyle = rgba(CYN, 0.06 * G.duck);
      ctx.fillRect(0, 0, VW, 36);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = rgba(CYN, 0.55 * G.duck);
      ctx.textAlign = 'center';
      ctx.fillText('蹲', VW * 0.5, 22);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05080c';
    ctx.fillRect(0, 0, W, H);
    const skx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake;
    const sky = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * 0.7;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    ctx.translate(ox + skx, oy + sky);
    ctx.scale(scale * G.punch, scale * G.punch);
    ctx.translate((VW * (1 - G.punch)) * 0.5 / G.punch, (VH * (1 - G.punch)) * 0.5 / G.punch);

    drawSky();
    drawHills();
    drawGround();

    const layer = [];
    for (let i = 0; i < buildings.length; i++) {
      layer.push({ z: buildings[i].z, kind: 'b', ref: buildings[i] });
    }
    for (let i = 0; i < ents.length; i++) {
      layer.push({ z: ents[i].z, kind: 'e', ref: ents[i] });
    }
    layer.sort(function (a, b) { return a.z - b.z; });
    for (let i = 0; i < layer.length; i++) {
      if (layer[i].kind === 'b') drawBldg(layer[i].ref);
      else drawEnt(layer[i].ref);
    }

    drawFx();
    drawPlayer();
    drawIncoming();
    if (G.mode !== 'title' || pointer.hover || pointer.down) drawAim();
    drawHurt();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
      ctx.fillRect(0, 0, VW, VH);
    }
    if (G.trans > 0.55) {
      ctx.fillStyle = 'rgba(5,8,12,' + ((G.trans - 0.55) / 0.65) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
    ctx.restore();
  }

  function pointerWorld(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (W / r.width);
    const y = (e.clientY - r.top) * (H / r.height);
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * fit) / 2;
    oy = (H - VH * fit) / 2;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code || '';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') keys.l = down;
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') keys.r = down;
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') keys.duck = down;
    if (k === 'j' || k === 'J') keys.aimL = down;
    if (k === 'l' || k === 'L') keys.aimR = down;
    if (k === 'i' || k === 'I') keys.aimU = down;
    if (k === 'k' || k === 'K') keys.aimD = down;
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (space) keys.fire = down;
    if (down && (k.indexOf('Arrow') === 0 || space || k === 'Enter')) e.preventDefault();
    if (!down || e.repeat) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      restart();
      return;
    }
    if (k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z') {
      audio.ensure();
      throwNade();
      return;
    }
    if (k === '1' || k === '2') {
      audio.ensure();
      if (G.mode === 'title' || overlayOpen()) {
        if (k === '1') startGame('front');
        if (k === '2') {
          if (G.mode === 'lose' || G.mode === 'win') goTitle();
          else startGame('rain');
        }
        return;
      }
    }
    if (space || k === 'Enter') {
      audio.ensure();
      if (overlayOpen()) {
        if (G.mode === 'title') startGame('front');
        else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
        return;
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      const p = pointerWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
      G.aim.x = clamp(p.x, 10, VW - 10);
      G.aim.y = clamp(p.y, 16, GROUND - 8);
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      if (playing()) tryFire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = pointerWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
      if (pointer.down || e.pointerType === 'mouse') {
        G.aim.x = clamp(p.x, 10, VW - 10);
        G.aim.y = clamp(p.y, 16, GROUND - 8);
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

  function holdBtn(el, onDown, onUp) {
    if (!el) return;
    function down(e) {
      e.preventDefault();
      audio.ensure();
      el.classList.add('held');
      onDown();
    }
    function up(e) {
      if (e) e.preventDefault();
      el.classList.remove('held');
      if (onUp) onUp();
    }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
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
  if (btnFront) btnFront.addEventListener('click', function () {
    audio.ensure();
    startGame('front');
  });
  if (btnRain) btnRain.addEventListener('click', function () {
    audio.ensure();
    startGame('rain');
  });
  if (ovAgain) ovAgain.addEventListener('click', function () {
    audio.ensure();
    startGame(G.kind);
  });
  if (ovMenu) ovMenu.addEventListener('click', function () {
    audio.ensure();
    goTitle();
  });
  holdBtn(btnLeft, function () { keys.l = true; }, function () { keys.l = false; });
  holdBtn(btnRight, function () { keys.r = true; }, function () { keys.r = false; });
  holdBtn(btnDuck, function () { keys.duck = true; }, function () { keys.duck = false; });
  holdBtn(btnFire, function () { keys.fire = true; if (playing()) tryFire(); }, function () { keys.fire = false; });
  if (btnNade) {
    btnNade.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      audio.ensure();
      throwNade();
    });
  }
  requestAnimationFrame(frame);
})();
