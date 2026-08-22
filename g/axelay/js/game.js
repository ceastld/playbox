'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = 132;
  const FOCAL = 420;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.38;
  const HIT_R = 6.4;
  const BEST_KEY = 'playbox-axelay-best';
  const MUTE_KEY = 'playbox-axelay-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · Shift / Z 换武器 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 196, 255];
  const HOT = [92, 232, 255];
  const GOLD = [255, 227, 107];
  const FLM = [255, 154, 60];
  const RED = [255, 72, 96];
  const WHT = [232, 248, 255];
  const PNK = [255, 154, 212];
  const TEA = [48, 220, 196];

  const WEPS = [
    { name: '环火', tag: 'ROUND', cd: 0.086 },
    { name: '直束', tag: 'LASER', cd: 0.046 },
    { name: '晨星', tag: 'STAR', cd: 0.30 }
  ];

  const SCORE = {
    drone: 50,
    gunner: 80,
    diver: 100,
    turret: 120,
    wing: 70,
    carrier: 240,
    boss: [2500, 4000, 6500],
    clear: 1500,
    all: 4000
  };

  const STAGES = [
    {
      name: '霓轴',
      boss: '棱塔',
      theme: 'city',
      bossHp: 72,
      waves: [
        { t: 0.7, kind: 'v', n: 5 },
        { t: 3.4, kind: 'gun', n: 2 },
        { t: 5.8, kind: 'turret', n: 3 },
        { t: 8.4, kind: 'diver', n: 4 },
        { t: 11.2, kind: 'v', n: 7 },
        { t: 14.0, kind: 'gun', n: 3 },
        { t: 16.6, kind: 'mix' },
        { t: 19.4, kind: 'carrier' },
        { t: 22.8, kind: 'boss' }
      ]
    },
    {
      name: '潮脊',
      boss: '潮环',
      theme: 'sea',
      bossHp: 92,
      waves: [
        { t: 0.5, kind: 'v', n: 6 },
        { t: 3.0, kind: 'diver', n: 5 },
        { t: 5.6, kind: 'turret', n: 4 },
        { t: 8.2, kind: 'gun', n: 3 },
        { t: 11.0, kind: 'v', n: 8 },
        { t: 13.8, kind: 'mix' },
        { t: 16.6, kind: 'diver', n: 6 },
        { t: 19.4, kind: 'carrier' },
        { t: 23.2, kind: 'boss' }
      ]
    },
    {
      name: '核轴',
      boss: '轴核',
      theme: 'core',
      bossHp: 124,
      waves: [
        { t: 0.4, kind: 'v', n: 7 },
        { t: 2.8, kind: 'gun', n: 4 },
        { t: 5.4, kind: 'diver', n: 6 },
        { t: 8.0, kind: 'turret', n: 5 },
        { t: 10.8, kind: 'mix' },
        { t: 13.4, kind: 'v', n: 9 },
        { t: 16.2, kind: 'carrier' },
        { t: 18.8, kind: 'gun', n: 4 },
        { t: 21.6, kind: 'mix' },
        { t: 24.6, kind: 'boss' }
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
  const btnDive = document.getElementById('btn-dive');
  const btnDense = document.getElementById('btn-dense');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnWep = document.getElementById('btn-wep');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wepLabel = document.getElementById('wep-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const hpBar = document.getElementById('hp-bar');
  const hpWrap = document.getElementById('hp-wrap');

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
  let wepTok = 0;
  let nid = 1;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: CX, y: 340, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const floats = [];
  const rings = [];
  const smears = [];
  const stars = [];
  const ents = [];
  const shots = [];
  const decos = [];

  const G = {
    mode: 'title',
    kind: 'dive',
    t: 0,
    clock: 0,
    stage: 1,
    dist: 0,
    px: CX,
    py: 348,
    vx: 0,
    vy: 0,
    bank: 0,
    spd: 26,
    score: 0,
    best: { d: 0, b: 0 },
    combo: 0,
    comboT: 0,
    mult: 1,
    lives: LIVES,
    nextLife: LIFE_EVERY,
    wep: 0,
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
    boomT: 0,
    waveI: 0,
    boss: null,
    why: '',
    runSeed: 1
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
  function mix(a, b, t) {
    const k = t < 0 ? 0 : t > 1 ? 1 : t;
    return [
      (a[0] + (b[0] - a[0]) * k) | 0,
      (a[1] + (b[1] - a[1]) * k) | 0,
      (a[2] + (b[2] - a[2]) * k) | 0
    ];
  }
  function rgba(rgb, a) {
    if (a == null || a >= 0.995) return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function isDense() {
    return G.kind === 'dense';
  }
  function stageDef() {
    return STAGES[clamp(G.stage, 1, 3) - 1];
  }
  function kindBest() {
    return isDense() ? G.best.b : G.best.d;
  }
  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function playing() {
    return G.mode === 'play' && G.deadT <= 0;
  }
  function nextId() {
    nid += 1;
    return nid;
  }
  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }
  function entScale(y) {
    return 0.58 + clamp(y / VH, 0, 1) * 0.72;
  }

  function project(wx, wz) {
    const z = wz < 0.5 ? 0.5 : wz;
    const s = FOCAL / z;
    const vpX = CX + G.bank * 36;
    return {
      x: vpX + wx * s,
      y: HORIZON + 1.51 * s,
      s: s,
      z: z
    };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    eng: null,
    eng2: null,
    engG: null,
    engF: null,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startEngine();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
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
      f.frequency.value = hp || 700;
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
    startEngine() {
      if (!this.ctx || this.eng) return;
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      const o2 = this.ctx.createOscillator();
      o2.type = 'triangle';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 720;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      o.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start();
      o2.start();
      this.eng = o;
      this.eng2 = o2;
      this.engG = g;
      this.engF = f;
    },
    tickEngine(on) {
      if (!this.engG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on) {
        this.engG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const spd01 = clamp(G.spd / 42, 0, 1);
      const f = 56 + spd01 * 140 + Math.sin(G.t * 18) * (3 + spd01 * 8);
      this.eng.frequency.setTargetAtTime(f, t, 0.045);
      this.eng2.frequency.setTargetAtTime(f * 2.04, t, 0.045);
      this.engF.frequency.setTargetAtTime(420 + spd01 * 980, t, 0.08);
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.02 + spd01 * 0.05), t, 0.06);
    },
    round() {
      this.beep(920, 0.04, 'square', 0.034, 1640);
      this.beep(460, 0.05, 'triangle', 0.018, 220);
    },
    laser() {
      this.beep(1480, 0.035, 'sawtooth', 0.028, 620);
      this.beep(740, 0.04, 'square', 0.016, 240);
    },
    star() {
      this.beep(280, 0.08, 'triangle', 0.045, 520);
      this.beep(140, 0.1, 'sine', 0.03, 80);
    },
    starBoom() {
      this.noise(0.16, 0.08, 280);
      this.beep(180, 0.18, 'sawtooth', 0.055, 52);
      this.beep(520, 0.1, 'triangle', 0.03, 180);
    },
    hit(combo) {
      const lift = 1 + Math.min(0.55, combo * 0.038);
      this.noise(0.035, 0.03, 1200);
      this.beep(540 * lift, 0.065, 'square', 0.044, 880 * lift);
    },
    boom(big) {
      this.noise(big ? 0.22 : 0.09, big ? 0.09 : 0.048, big ? 180 : 460);
      this.beep(big ? 140 : 240, big ? 0.28 : 0.12, 'sawtooth', 0.055, 46);
    },
    death() {
      this.noise(0.2, 0.085, 220);
      this.beep(260, 0.24, 'sawtooth', 0.06, 64);
      this.beep(120, 0.34, 'sine', 0.05, 38);
    },
    swap() {
      this.beep(392, 0.06, 'square', 0.04, 523);
      this.beep(659, 0.09, 'triangle', 0.036, 784);
    },
    combo(m) {
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    start() {
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    win() {
      this.beep(523, 0.1, 'square', 0.05, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.28, 'sine', 0.055, 1318);
    },
    lose() {
      this.beep(220, 0.22, 'sawtooth', 0.05, 80);
      this.beep(140, 0.32, 'sine', 0.05, 46);
    },
    stage() {
      this.beep(392, 0.09, 'square', 0.045, 523);
      this.beep(523, 0.11, 'triangle', 0.04, 659);
      this.beep(784, 0.2, 'square', 0.045, 1046);
    }
  };

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }
  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 7 ? 'die' : 'hit';
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
    }, 1100);
  }

  function bumpScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n | 0;
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.combo(3);
    }
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + (n | 0);
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    maybeBest();
    hud();
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85 });
  }

  function emit(n, spec) {
    const c = (n * (REDUCE ? 0.42 : 1)) | 0;
    for (let i = 0; i < c; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.5, spec.life),
        max: spec.life,
        rgb: spec.rgb
      });
    }
    if (particles.length > 240) particles.splice(0, particles.length - 200);
  }

  function burst(x, y, n, rgb, mag) {
    const m = mag || 1;
    emit((n * (REDUCE ? 0.45 : 1)) | 0, {
      x: x, y: y, j: 8 * m,
      vx0: -160 * m, vx1: 160 * m,
      vy0: -200 * m, vy1: 90 * m,
      r0: 1.4, r1: 4.8 * m,
      life: 0.42 + 0.18 * m,
      rgb: rgb
    });
    const ns = REDUCE ? 3 : 8;
    for (let i = 0; i < ns; i++) {
      sparks.push({
        x: x, y: y,
        vx: rand(-260, 260) * m,
        vy: rand(-280, 110) * m,
        life: rand(0.12, 0.34),
        rgb: i & 1 ? WHT : rgb
      });
    }
  }

  function pushRing(x, y, rgb, grow) {
    rings.push({ x: x, y: y, r: 6, t: 0.55, rgb: rgb, grow: grow || 220 });
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.best.d = o.d | 0;
        G.best.b = o.b | 0;
      } else {
        G.best.d = parseInt(raw, 10) | 0;
      }
    } catch (err) { /* ignore */ }
  }
  function maybeBest() {
    const k = isDense() ? 'b' : 'd';
    if (G.score > G.best[k]) {
      G.best[k] = G.score;
      try { localStorage.setItem(BEST_KEY, JSON.stringify(G.best)); } catch (err) { /* ignore */ }
    }
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const el = document.createElement('span');
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

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(kindBest());
    const st = stageDef();
    if (stageLabel) {
      stageLabel.textContent = G.boss ? st.boss : ('第 ' + G.stage + ' 关 · ' + st.name);
      stageLabel.classList.toggle('hot', !!G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密弹' : '俯冲';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', !!G.boss);
    }
    if (wepLabel) {
      wepLabel.textContent = WEPS[G.wep].name;
      wepLabel.className = 'wep w' + G.wep;
    }
    if (hpBar && hpWrap) {
      if (G.boss && G.mode === 'play') {
        hpWrap.hidden = false;
        const p = clamp(G.boss.hp / G.boss.maxHp, 0, 1);
        hpBar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
        hpWrap.classList.toggle('low', p <= 0.28);
      } else hpWrap.hidden = true;
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.combo + (G.mult > 1 ? '  ' + G.mult + '倍' : '');
      } else comboEl.hidden = true;
    }
    syncPips();
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function hideOverlay() {
    if (overlay) overlay.classList.add('hidden');
  }
  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'STALL' : 'AXEL';
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = OPS;
    const start = kind === 'title';
    if (ovStart) ovStart.classList.toggle('gone', !start);
    if (ovEnd) ovEnd.classList.toggle('gone', start);
  }

  function clearField() {
    ents.length = 0;
    shots.length = 0;
    particles.length = 0;
    sparks.length = 0;
    floats.length = 0;
    rings.length = 0;
    smears.length = 0;
    G.boss = null;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, HORIZON + 8),
        r: rand(0.4, 1.5),
        a: rand(0.25, 0.9),
        tw: rand(0, TAU)
      });
    }
  }

  function seedDecos() {
    decos.length = 0;
    const th = stageDef().theme;
    for (let i = 0; i < 18; i++) {
      decos.push(makeDeco(th, 4 + i * 4.6 + rand(0, 3)));
    }
  }

  function makeDeco(th, z) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const lat = side * rand(1.2, 2.55);
    if (th === 'sea') {
      return { k: 'reef', x: lat, z: z, w: rand(0.18, 0.4), h: rand(0.12, 0.32), col: (Math.random() * 4) | 0 };
    }
    if (th === 'core') {
      return { k: 'pylon', x: lat, z: z, w: rand(0.12, 0.28), h: rand(0.4, 0.9), col: (Math.random() * 4) | 0 };
    }
    return { k: Math.random() < 0.35 ? 'tower' : 'build', x: lat, z: z, w: rand(0.16, 0.42), h: rand(0.35, 0.95), col: (Math.random() * 5) | 0 };
  }

  function recycleDeco(d) {
    const th = stageDef().theme;
    const n = makeDeco(th, 62 + rand(0, 28));
    d.k = n.k; d.x = n.x; d.z = n.z; d.w = n.w; d.h = n.h; d.col = n.col;
  }

  function pushEnt(e) {
    if (ents.length > 28) return;
    e.id = nextId();
    e.dead = false;
    e.t = e.t || 0;
    e.flash = 0;
    ents.push(e);
  }

  function spawnDrone(x, y, ph) {
    pushEnt({
      type: 'drone', x: x, y: y, vx: 0, vy: 92,
      hp: 1, r: 12, ph: ph || rand(0, TAU), fire: 9
    });
  }
  function spawnGunner(x, y) {
    pushEnt({
      type: 'gunner', x: x, y: y, vx: x < CX ? 40 : -40, vy: 54,
      hp: 2, r: 14, ph: rand(0, TAU), fire: rand(0.35, 0.9)
    });
  }
  function spawnDiver(x, y) {
    pushEnt({
      type: 'diver', x: x, y: y, vx: 0, vy: 70,
      hp: 1, r: 13, ph: rand(0, TAU), fire: 9, dive: 0
    });
  }
  function spawnTurret(x, y) {
    pushEnt({
      type: 'turret', x: x, y: y, vx: 0, vy: 44,
      hp: 3, r: 16, ph: 0, fire: rand(0.4, 1.1)
    });
  }
  function spawnWing(x, y, i) {
    pushEnt({
      type: 'wing', x: x, y: y, vx: 0, vy: 86,
      hp: 1, r: 11, ph: i, fire: 9
    });
  }
  function spawnCarrier(x, y) {
    pushEnt({
      type: 'carrier', x: x, y: y, vx: 0, vy: 38,
      hp: 6, r: 22, ph: 0, fire: 0.8, dropped: 0
    });
  }

  function spawnBoss() {
    const st = stageDef();
    const hp = (st.bossHp * (isDense() ? 1.28 : 1)) | 0;
    const b = {
      type: 'boss',
      name: st.boss,
      x: CX,
      y: 86,
      vx: 70,
      vy: 0,
      hp: hp,
      maxHp: hp,
      r: G.stage === 3 ? 36 : 30,
      ph: 0,
      fire: 0.6,
      pattern: 0,
      t: 0,
      dead: false,
      flash: 0,
      id: nextId()
    };
    ents.push(b);
    G.boss = b;
    toast(st.boss, false, true);
    audio.stage();
    setHint('Boss · 换武器打弱点', 'hot');
  }

  function spawnWave(w) {
    const n = w.n || 4;
    if (w.kind === 'v') {
      for (let i = 0; i < n; i++) {
        spawnWing(CX + (i - (n - 1) * 0.5) * 52, -18 - i * 14, i);
      }
    } else if (w.kind === 'gun') {
      for (let i = 0; i < n; i++) {
        const left = i % 2 === 0;
        spawnGunner(left ? 48 + rand(0, 40) : VW - 48 - rand(0, 40), -10 - i * 28);
      }
    } else if (w.kind === 'diver') {
      for (let i = 0; i < n; i++) {
        spawnDiver(80 + i * ((VW - 160) / Math.max(1, n - 1)), -24 - (i % 3) * 18);
      }
    } else if (w.kind === 'turret') {
      for (let i = 0; i < n; i++) {
        spawnTurret(90 + i * ((VW - 180) / Math.max(1, n - 1)) + rand(-20, 20), 36 + (i % 2) * 18);
      }
    } else if (w.kind === 'carrier') {
      spawnCarrier(CX + rand(-80, 80), -20);
      spawnDrone(CX - 70, -40, 0);
      spawnDrone(CX + 70, -40, 1);
    } else if (w.kind === 'mix') {
      for (let i = 0; i < 5; i++) spawnDrone(120 + i * 130, -16 - i * 10, i);
      spawnGunner(70, -30);
      spawnGunner(VW - 70, -30);
      spawnTurret(CX, 40);
    } else if (w.kind === 'boss') {
      spawnBoss();
    }
  }

  function maybeSpawn() {
    if (G.mode !== 'play' || G.boss || G.boomT > 0) return;
    const st = stageDef();
    const tScale = isDense() ? 0.82 : 1;
    while (G.waveI < st.waves.length) {
      const w = st.waves[G.waveI];
      if (G.clock < w.t * tScale) break;
      spawnWave(w);
      G.waveI += 1;
    }
  }

  function noteCombo() {
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
      comboTok += 1;
    }
    hud();
  }

  function wepColor() {
    return G.wep === 2 ? GOLD : G.wep === 1 ? WHT : CYN;
  }

  function swapWep() {
    G.wep = (G.wep + 1) % 3;
    audio.swap();
    toast(WEPS[G.wep].name, false, G.wep === 2);
    screenFlash(wepColor(), 0.18);
    hud();
    if (wepLabel) {
      wepLabel.classList.remove('swap');
      void wepLabel.offsetWidth;
      wepLabel.className = 'wep w' + G.wep + ' swap';
    }
  }

  function fireShot() {
    if (!playing() || G.invuln > 1.05) return;
    if (G.fireCd > 0) return;
    const w = G.wep;
    const x = G.px;
    const y = G.py - 16;
    G.fireCd = WEPS[w].cd;
    G.muzzle = 0.06;
    if (w === 0) {
      audio.round();
      const angs = [-0.42, -0.21, 0, 0.21, 0.42];
      for (let i = 0; i < angs.length; i++) {
        const a = angs[i];
        shots.push({
          from: 'p', wep: 0, x: x + Math.sin(a) * 6, y: y,
          vx: Math.sin(a) * 210, vy: -640,
          r: 4.2, dmg: 1, pierce: false, hit: null, life: 1.4, spin: 0
        });
      }
    } else if (w === 1) {
      audio.laser();
      for (let i = -1; i <= 1; i += 2) {
        shots.push({
          from: 'p', wep: 1, x: x + i * 7, y: y,
          vx: 0, vy: -920,
          r: 3.2, dmg: 0.85, pierce: true, hit: {}, life: 0.9, spin: 0
        });
      }
    } else {
      audio.star();
      shots.push({
        from: 'p', wep: 2, x: x, y: y,
        vx: G.vx * 0.12, vy: -268,
        r: 7.5, dmg: 2, pierce: false, hit: null, life: 0.88, spin: 0, star: true
      });
    }
  }

  function enemyFire(e, aimed, spread) {
    if (G.mode !== 'play') return;
    if (shots.length > 96) return;
    const tx = G.px;
    const ty = G.py;
    const n = spread || 1;
    const dense = isDense();
    const count = dense && n === 1 && Math.random() < 0.45 ? 3 : n;
    for (let i = 0; i < count; i++) {
      let vx = 0;
      let vy = 160 + (dense ? 36 : 0);
      if (aimed) {
        const dx = tx - e.x;
        const dy = ty - e.y;
        const len = Math.hypot(dx, dy) || 1;
        const spd = (dense ? 195 : 158) + rand(-8, 12);
        vx = dx / len * spd;
        vy = dy / len * spd;
        if (count > 1) {
          const a = Math.atan2(vy, vx) + (i - (count - 1) * 0.5) * 0.22;
          vx = Math.cos(a) * spd;
          vy = Math.sin(a) * spd;
        }
      } else if (count > 1) {
        const a = Math.PI * 0.5 + (i - (count - 1) * 0.5) * 0.28;
        const spd = dense ? 176 : 148;
        vx = Math.cos(a) * spd;
        vy = Math.sin(a) * spd;
      }
      shots.push({
        from: 'e', wep: 0, x: e.x, y: e.y + 8,
        vx: vx, vy: vy, r: 4.2, dmg: 1, pierce: false, hit: null, life: 4, spin: 0
      });
    }
  }

  function explodeStar(x, y) {
    audio.starBoom();
    hitStop(0.07);
    kick(5.5);
    screenFlash(GOLD, 0.38);
    pushRing(x, y, GOLD, 340);
    pushRing(x, y, MAG, 240);
    burst(x, y, 28, GOLD, 1.35);
    burst(x, y, 12, MAG, 0.8);
    const rad = 58;
    const rad2 = rad * rad;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.dead) continue;
      if (dist2(e.x, e.y, x, y) < (rad + e.r) * (rad + e.r)) {
        hurtEnemy(e, 4.6, x, y, true);
      }
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      if (s.from !== 'e') continue;
      if (dist2(s.x, s.y, x, y) < rad2) {
        burst(s.x, s.y, 4, PNK, 0.3);
        shots.splice(i, 1);
      }
    }
  }

  function hurtEnemy(e, dmg, hx, hy, fromStar) {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (G.mode === 'play') noteCombo();
    audio.hit(G.combo);
    const rgb = e.type === 'boss' ? GOLD : (fromStar ? GOLD : wepColor());
    emit(REDUCE ? 2 : 5, {
      x: hx, y: hy, j: 4,
      vx0: -80, vx1: 80, vy0: -90, vy1: 40,
      r0: 1.1, r1: 2.6, life: 0.22, rgb: rgb
    });
    if (e.type === 'boss') {
      hitStop(0.042);
      kick(2.2);
    } else {
      hitStop(fromStar ? 0.05 : 0.038);
    }
    if (e.hp <= 0) killEnemy(e);
    else if (G.combo >= 2 && (G.combo % 3) === 0) {
      floatText(e.x, e.y - 12, '×' + G.combo, GOLD);
    }
  }

  function killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    const big = e.type === 'boss' || e.type === 'carrier';
    audio.boom(big);
    burst(e.x, e.y, big ? 36 : 16, e.type === 'turret' ? TEA : MAG, big ? 1.6 : 1);
    pushRing(e.x, e.y, MAG, big ? 280 : 160);
    hitStop(big ? 0.085 : 0.055);
    kick(big ? 7 : 3.4);
    if (big) screenFlash(MAG, 0.32);
    let base = SCORE[e.type] || 50;
    if (e.type === 'boss') base = SCORE.boss[G.stage - 1] || 2500;
    const n = (base * G.mult) | 0;
    if (G.mode === 'play') {
      bumpScore(n);
      floatText(e.x, e.y, '+' + n, GOLD);
    }
    if (e.type === 'boss') {
      G.boss = null;
      G.boomT = 1.32;
      screenFlash(GOLD, 0.55);
      setHint(G.stage >= 3 ? '轴核崩了' : '关清', 'hot');
    }
  }

  function playerHit(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.why = why || '相撞';
    G.deadT = 0.92;
    G.lives -= 1;
    audio.death();
    hitStop(0.078);
    kick(9);
    screenFlash(MAG, 0.55);
    burst(G.px, G.py, 40, MAG, 1.7);
    burst(G.px, G.py, 16, CYN, 0.9);
    pushRing(G.px, G.py, MAG, 300);
    G.combo = 0;
    G.mult = 1;
    G.fireHold = false;
    toast(G.why, true, false);
    hud();
    for (let i = shots.length - 1; i >= 0; i--) {
      if (shots[i].from === 'e') shots.splice(i, 1);
    }
  }

  function finishDeath() {
    if (G.lives <= 0) {
      loseGame();
      return;
    }
    G.px = CX;
    G.py = 348;
    G.vx = 0;
    G.vy = 0;
    G.invuln = 1.45;
    G.deadT = 0;
    toast('再射', false, true);
  }

  function loseGame() {
    G.mode = 'lose';
    G.deadT = 0;
    maybeBest();
    audio.lose();
    showOverlay('lose', '坠轴了', '三命耗尽。R 再射同一模式。');
    setHint('R 重开 · 换武器找手感', 'warn');
    hud();
  }

  function winGame() {
    bumpScore(SCORE.all);
    G.mode = 'win';
    maybeBest();
    audio.win();
    showOverlay('win', '轴核尽碎', '三关打穿。分数 ' + G.score + '。');
    setHint('R 再射 · 密弹更密', 'hot');
    hud();
  }

  function afterBoss() {
    if (G.stage >= 3) {
      winGame();
      return;
    }
    bumpScore(SCORE.clear);
    G.stage += 1;
    G.clock = 0;
    G.waveI = 0;
    G.invuln = 0.95;
    G.boomT = 0;
    for (let i = shots.length - 1; i >= 0; i--) {
      if (shots[i].from === 'e') shots.splice(i, 1);
    }
    seedDecos();
    audio.stage();
    const st = stageDef();
    toast('第 ' + G.stage + ' 关 · ' + st.name, false, true);
    setHint('空格射击 · Shift/Z 换武器', '');
    hud();
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const spd = isDense() ? 318 : 292;
    if (inputSrc === 'ptr' && pointer.down && G.mode === 'play') {
      const dx = pointer.x - G.px;
      const dy = pointer.y - G.py;
      G.px = lerp(G.px, pointer.x, 0.24);
      G.py = lerp(G.py, pointer.y, 0.24);
      G.vx = dx / Math.max(dt, 0.016);
      G.vy = dy / Math.max(dt, 0.016);
    } else {
      let ax = 0;
      let ay = 0;
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax || ay) {
        const len = Math.hypot(ax, ay);
        G.vx = (ax / len) * spd;
        G.vy = (ay / len) * spd;
      } else {
        G.vx = 0;
        G.vy = 0;
      }
      G.px += G.vx * dt;
      G.py += G.vy * dt;
    }
    G.px = clamp(G.px, 32, VW - 32);
    G.py = clamp(G.py, 36, VH - 26);
    const want = clamp(G.vx / 420, -1, 1);
    G.bank = lerp(G.bank, want, 0.14);
    if (!REDUCE && Math.abs(G.vx) + Math.abs(G.vy) > 40 && (G.t * 60 | 0) % 3 === 0) {
      smears.push({ x: G.px, y: G.py, bank: G.bank, t: 0.16, wep: G.wep });
    }
    if (G.mode === 'play' && G.fireHold) fireShot();
  }

  function updateTitleShip(dt) {
    G.px = CX + Math.sin(G.t * 0.7) * 160;
    G.py = 330 + Math.sin(G.t * 1.1) * 18;
    G.bank = Math.cos(G.t * 0.7) * 0.45;
    G.wep = (G.t * 0.35 | 0) % 3;
    G.fireHold = true;
    if (G.fireCd <= 0) {
      const tmp = G.mode;
      const inv = G.invuln;
      G.mode = 'play';
      G.deadT = 0;
      G.invuln = 0;
      G.boomT = 0;
      fireShot();
      G.mode = tmp;
      G.invuln = inv;
    }
    if (ents.length < 6 && Math.random() < 0.02) {
      spawnDrone(rand(80, VW - 80), -20, rand(0, TAU));
    }
  }

  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      s.spin += dt * 10;
      if (s.star) s.vy += 38 * dt;
      if (s.x < -20 || s.x > VW + 20 || s.y < -30 || s.y > VH + 30 || s.life <= 0) {
        if (s.star && s.from === 'p' && G.mode === 'play') explodeStar(s.x, clamp(s.y, 20, VH - 20));
        shots.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        let hit = false;
        for (let k = 0; k < ents.length; k++) {
          const e = ents[k];
          if (e.dead) continue;
          const rr = (s.r + e.r * entScale(e.y) * 0.92);
          if (dist2(s.x, s.y, e.x, e.y) > rr * rr) continue;
          if (s.pierce && s.hit[e.id]) continue;
          if (s.star) {
            shots.splice(i, 1);
            explodeStar(s.x, s.y);
            hit = true;
            break;
          }
          if (s.pierce) s.hit[e.id] = 1;
          hurtEnemy(e, s.dmg, s.x, s.y, false);
          if (!s.pierce) {
            shots.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      } else if (G.mode === 'play' && G.deadT <= 0) {
        if (G.invuln <= 0 && dist2(s.x, s.y, G.px, G.py) < (s.r + HIT_R) * (s.r + HIT_R)) {
          shots.splice(i, 1);
          playerHit('中弹');
        }
      }
    }
  }

  function updateEnts(dt) {
    const dense = isDense();
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i];
      if (e.dead) {
        ents.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.type === 'drone' || e.type === 'wing') {
        e.x += Math.sin(e.t * 2.2 + e.ph) * 70 * dt;
        e.y += e.vy * dt;
      } else if (e.type === 'gunner') {
        e.x += Math.sin(e.t * 1.1) * 50 * dt;
        e.y += e.vy * dt;
        e.fire -= dt;
        if (e.fire <= 0 && e.y > 40 && e.y < VH - 80) {
          enemyFire(e, true, dense ? 3 : 1);
          e.fire = (dense ? 0.72 : 1.12) + rand(0, 0.25);
        }
      } else if (e.type === 'diver') {
        if (e.y < G.py - 40) {
          e.vx = lerp(e.vx, (G.px - e.x) * 1.6, 0.04);
          e.vy = lerp(e.vy, 210, 0.03);
        }
        e.x += e.vx * dt;
        e.y += e.vy * dt;
      } else if (e.type === 'turret') {
        e.y += e.vy * dt;
        e.fire -= dt;
        if (e.fire <= 0 && e.y > 70 && e.y < VH - 60) {
          enemyFire(e, true, dense ? 3 : 1);
          e.fire = (dense ? 0.95 : 1.45) + rand(0, 0.3);
        }
      } else if (e.type === 'carrier') {
        e.x += Math.sin(e.t * 0.8) * 40 * dt;
        e.y += e.vy * dt;
        e.fire -= dt;
        if (e.dropped < 3 && e.fire <= 0 && e.y > 50) {
          spawnDrone(e.x - 24, e.y + 10, 0);
          spawnDrone(e.x + 24, e.y + 10, 1);
          e.dropped += 1;
          e.fire = 1.6;
        }
      } else if (e.type === 'boss') {
        updateBoss(e, dt);
      }
      if (e.type !== 'boss') {
        if (G.mode === 'title' && e.y > 300) {
          killEnemy(e);
          continue;
        }
        if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
          const sc = entScale(e.y);
          const rr = HIT_R + e.r * sc * 0.62;
          if (dist2(e.x, e.y, G.px, G.py) < rr * rr) {
            playerHit('相撞');
          }
        }
        if (e.y > VH + 40 || e.x < -60 || e.x > VW + 60) ents.splice(i, 1);
      }
    }
  }

  function updateBoss(b, dt) {
    b.ph += dt;
    const stg = G.stage;
    const dense = isDense();
    const rage = b.hp < b.maxHp * 0.45;
    if (stg === 1) {
      b.x += b.vx * dt;
      if (b.x < 90 || b.x > VW - 90) b.vx *= -1;
      b.y = 82 + Math.sin(b.ph * 1.2) * 10;
    } else if (stg === 2) {
      b.x = CX + Math.sin(b.ph * 0.9) * 210;
      b.y = 88 + Math.sin(b.ph * 1.7) * 22;
    } else {
      b.x = CX + Math.sin(b.ph * 1.15) * 180;
      b.y = 90 + Math.cos(b.ph * 0.8) * 16;
    }
    b.fire -= dt;
    if (b.fire > 0 || G.mode !== 'play') return;
    const interval = (dense ? 0.42 : 0.62) * (rage ? 0.72 : 1);
    b.fire = interval;
    b.pattern = (b.pattern + 1) % 4;
    if (shots.length > 96) return;
    if (stg === 1) {
      if (b.pattern === 0 || b.pattern === 2) enemyFire(b, false, dense ? 7 : 5);
      else enemyFire(b, true, dense ? 3 : 1);
    } else if (stg === 2) {
      const n = dense || rage ? 10 : 8;
      for (let i = 0; i < n; i++) {
        const a = b.ph * 1.4 + i * (TAU / n);
        const spd = 120 + (rage ? 30 : 0);
        shots.push({
          from: 'e', wep: 0, x: b.x + Math.cos(a) * 22, y: b.y + Math.sin(a) * 14,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd + 40,
          r: 4.4, dmg: 1, pierce: false, hit: null, life: 4, spin: 0
        });
      }
      if (b.pattern === 3) enemyFire(b, true, 3);
    } else {
      const n = dense || rage ? 14 : 10;
      for (let i = 0; i < n; i++) {
        const a = -b.ph * 1.6 + i * (TAU / n);
        const spd = 108 + (rage ? 36 : 0);
        shots.push({
          from: 'e', wep: 0, x: b.x, y: b.y,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd + 20,
          r: 4.6, dmg: 1, pierce: false, hit: null, life: 4.2, spin: 0
        });
      }
      if (b.pattern === 1 || rage) enemyFire(b, true, dense ? 5 : 3);
    }
  }

  function updateDecos(dt) {
    const vz = G.spd;
    for (let i = 0; i < decos.length; i++) {
      decos[i].z -= vz * dt;
      if (decos[i].z < 1.85) recycleDeco(decos[i]);
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 90 * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) sparks.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].y -= 30 * dt;
      floats[i].t -= dt;
      if (floats[i].t <= 0) floats.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].r += rings[i].grow * dt;
      rings[i].t -= dt;
      if (rings[i].t <= 0) rings.splice(i, 1);
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].t -= dt;
      if (smears[i].t <= 0) smears.splice(i, 1);
    }
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    G.punch = lerp(G.punch, 1, 0.18);
    if (G.muzzle > 0) G.muzzle -= dt;
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt);
      return;
    }
    G.spd = lerp(G.spd, G.mode === 'play' ? (isDense() ? 34 : 26) : 18, 0.04);
    G.dist += G.spd * dt;
    updateDecos(dt);
    updateFx(dt);
    G.fireCd = Math.max(0, G.fireCd - dt);
    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        hud();
      }
    }

    if (G.mode === 'title') {
      updateTitleShip(dt);
      updateShots(dt);
      updateEnts(dt);
      audio.tickEngine(true);
      return;
    }

    if (G.mode === 'win' || G.mode === 'lose') {
      audio.tickEngine(false);
      updateShots(dt);
      updateEnts(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateShots(dt);
      updateEnts(dt);
      audio.tickEngine(true);
      if (G.deadT <= 0) finishDeath();
      return;
    }

    if (G.boomT > 0) {
      G.boomT -= dt;
      G.clock += dt;
      updatePlayer(dt);
      updateShots(dt);
      updateEnts(dt);
      audio.tickEngine(true);
      if (G.boomT <= 0) afterBoss();
      return;
    }

    G.clock += dt;
    updatePlayer(dt);
    maybeSpawn();
    updateShots(dt);
    updateEnts(dt);
    audio.tickEngine(G.mode === 'play');
  }

  function quad(x0, y0, x1, y1, x2, y2, x3, y3, rgb, a) {
    ctx.fillStyle = rgba(rgb, a == null ? 1 : a);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
  }

  function palette() {
    const th = stageDef().theme;
    if (th === 'sea') {
      return {
        sky0: [2, 16, 28], sky1: [4, 48, 64],
        g1: [4, 40, 56], g2: [2, 24, 40],
        line: [80, 220, 255], fog: [16, 80, 104]
      };
    }
    if (th === 'core') {
      return {
        sky0: [14, 4, 18], sky1: [40, 8, 30],
        g1: [32, 8, 28], g2: [16, 4, 18],
        line: [255, 80, 180], fog: [80, 20, 50]
      };
    }
    return {
      sky0: [4, 14, 26], sky1: [8, 38, 56],
      g1: [6, 30, 44], g2: [3, 16, 28],
      line: [0, 196, 255], fog: [0, 70, 100]
    };
  }

  function drawSky(pal) {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON + 40);
    g.addColorStop(0, rgba(pal.sky0, 1));
    g.addColorStop(1, rgba(pal.sky1, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, HORIZON + 48);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.45 + Math.sin(G.t * 2.2 + s.tw) * 0.35;
      ctx.fillStyle = rgba(i % 5 === 0 ? GOLD : i % 3 === 0 ? PNK : WHT, s.a * tw);
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
    ctx.fillStyle = rgba(pal.fog, 0.28);
    ctx.fillRect(0, HORIZON - 8, VW, 18);
  }

  function drawGround(pal) {
    const vpX = CX + G.bank * 42;
    const hor = HORIZON;
    const rows = REDUCE ? 16 : 26;
    const th = stageDef().theme;
    for (let i = 0; i < rows; i++) {
      const t0 = i / rows;
      const t1 = (i + 1) / rows;
      const p0 = t0 * t0;
      const p1 = t1 * t1;
      const y0 = hor + (VH - hor) * p0;
      const y1 = hor + (VH - hor) * p1;
      const w0 = 36 + p0 * 2600;
      const w1 = 36 + p1 * 2600;
      const zA = 1 / (0.08 + p1);
      const band = ((G.dist * 0.28 + zA * 2.15) | 0) & 1;
      let c = band ? pal.g1 : pal.g2;
      if (th === 'core' && band) c = mix(pal.g1, MAG, 0.12);
      quad(vpX - w0 * 0.5, y0, vpX + w0 * 0.5, y0, vpX + w1 * 0.5, y1, vpX - w1 * 0.5, y1, c, 1);
      if ((i % 2) === 0) {
        ctx.strokeStyle = rgba(pal.line, 0.07 + p1 * 0.12);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vpX - w1 * 0.48, y1);
        ctx.lineTo(vpX + w1 * 0.48, y1);
        ctx.stroke();
      }
    }
    const nLines = 8;
    ctx.lineWidth = 1;
    for (let k = -nLines; k <= nLines; k++) {
      const t0 = 0;
      const t1 = 1;
      const p0 = t0 * t0;
      const p1 = t1 * t1;
      const y0 = hor;
      const y1 = VH;
      const w0 = 36 + p0 * 2600;
      const w1 = 36 + p1 * 2600;
      ctx.strokeStyle = rgba(pal.line, k === 0 ? 0.42 : 0.1 + (k % 2 === 0 ? 0.06 : 0));
      ctx.beginPath();
      ctx.moveTo(vpX + k * (w0 / (nLines * 2)), y0);
      ctx.lineTo(vpX + k * (w1 / (nLines * 2)), y1);
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(GOLD, 0.22);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vpX, hor);
    ctx.lineTo(vpX, VH);
    ctx.stroke();
  }

  function drawDeco(d) {
    const p = project(d.x, d.z);
    const sc = p.s * 0.02;
    const w = d.w * 42 * sc * 10;
    const h = d.h * 48 * sc * 10;
    if (p.y > VH + 30 || w < 1.2 || w > 260) return;
    ctx.save();
    ctx.translate(p.x, Math.min(VH - 4, p.y));
    if (d.k === 'reef') {
      ctx.fillStyle = rgba(TEA, 0.85);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.7, h * 0.35, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.5);
      ctx.beginPath();
      ctx.moveTo(-w * 0.12, 0);
      ctx.lineTo(0, -h * 0.8);
      ctx.lineTo(w * 0.12, 0);
      ctx.fill();
    } else if (d.k === 'pylon') {
      ctx.fillStyle = rgba([40, 12, 36], 1);
      ctx.fillRect(-w * 0.22, -h, w * 0.44, h);
      ctx.fillStyle = rgba(d.col & 1 ? MAG : GOLD, 0.75);
      ctx.fillRect(-w * 0.08, -h * 0.92, w * 0.16, h * 0.18);
    } else {
      const bw = d.k === 'tower' ? w * 0.32 : w * 0.5;
      ctx.fillStyle = rgba([10, 22, 36], 1);
      ctx.fillRect(-bw * 0.5, -h, bw, h);
      ctx.fillStyle = rgba((d.col & 1) ? MAG : CYN, 0.7);
      const rows = 3 + (d.col % 4);
      for (let r = 0; r < rows; r++) {
        ctx.fillRect(-bw * 0.32, -h + 6 + r * (h / (rows + 1)), bw * 0.16, 2.4);
        ctx.fillRect(bw * 0.1, -h + 6 + r * (h / (rows + 1)), bw * 0.16, 2.4);
      }
    }
    ctx.restore();
  }

  function drawShot(s) {
    if (s.from === 'e') {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.fillStyle = rgba(MAG, 1);
      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, s.r * 0.4, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(s.x, s.y);
    if (s.wep === 1) {
      const grd = ctx.createLinearGradient(0, 18, 0, -28);
      grd.addColorStop(0, rgba(CYN, 0.1));
      grd.addColorStop(0.4, rgba(WHT, 0.95));
      grd.addColorStop(1, rgba(HOT, 0.2));
      ctx.fillStyle = grd;
      ctx.fillRect(-2.2, -26, 4.4, 38);
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.fillRect(-0.8, -24, 1.6, 32);
    } else if (s.wep === 2) {
      ctx.rotate(s.spin);
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI * 0.5;
        ctx.lineTo(Math.cos(a) * 8, Math.sin(a) * 8);
        ctx.lineTo(Math.cos(a + 0.25) * 3.2, Math.sin(a + 0.25) * 3.2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, 2.4, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(CYN, 1);
      ctx.beginPath();
      ctx.arc(0, 0, 4.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT, 0.8);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 5.4, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 1.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    const sc = e.type === 'boss' ? 1 : entScale(e.y);
    const flash = e.flash > 0;
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(sc, sc);
    if (flash) ctx.globalAlpha = 0.55 + Math.sin(G.t * 80) * 0.2;
    if (e.type === 'drone' || e.type === 'wing') {
      ctx.fillStyle = rgba(MAG, 1);
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(PNK, 1);
      ctx.fillRect(-2, -2, 4, 5);
    } else if (e.type === 'gunner') {
      ctx.fillStyle = rgba([180, 40, 90], 1);
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.lineTo(-7, -8);
      ctx.lineTo(7, -8);
      ctx.lineTo(10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-2, 4, 4, 8);
    } else if (e.type === 'diver') {
      ctx.fillStyle = rgba(FLM, 1);
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(7, -8);
      ctx.lineTo(0, -4);
      ctx.lineTo(-7, -8);
      ctx.closePath();
      ctx.fill();
    } else if (e.type === 'turret') {
      ctx.fillStyle = rgba([20, 48, 62], 1);
      ctx.beginPath();
      ctx.moveTo(-14, 10);
      ctx.lineTo(-10, -4);
      ctx.lineTo(10, -4);
      ctx.lineTo(14, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(TEA, 1);
      ctx.fillRect(-3, -12, 6, 10);
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(-8, 2, 4, 3);
      ctx.fillRect(4, 2, 4, 3);
    } else if (e.type === 'carrier') {
      ctx.fillStyle = rgba([70, 24, 80], 1);
      ctx.beginPath();
      ctx.moveTo(-18, 10);
      ctx.lineTo(-14, -10);
      ctx.lineTo(14, -10);
      ctx.lineTo(18, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(-8, -6, 16, 10);
    } else if (e.type === 'boss') {
      drawBoss(e);
    }
    ctx.restore();
  }

  function drawBoss(b) {
    const stg = G.stage;
    ctx.save();
    if (stg === 1) {
      ctx.fillStyle = rgba([40, 18, 70], 1);
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(22, 8);
      ctx.lineTo(10, 24);
      ctx.lineTo(-10, 24);
      ctx.lineTo(-22, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(8, 6);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(-3, 8, 6, 14);
    } else if (stg === 2) {
      ctx.strokeStyle = rgba(CYN, 0.9);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, TAU);
      ctx.stroke();
      ctx.rotate(b.ph * 1.4);
      ctx.strokeStyle = rgba(HOT, 0.7);
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(TEA, 1);
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fill();
    } else {
      ctx.rotate(b.ph * 0.6);
      ctx.fillStyle = rgba([50, 10, 40], 1);
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6;
        ctx.save();
        ctx.rotate(a);
        ctx.fillRect(10, -5, 22, 10);
        ctx.restore();
      }
      ctx.fillStyle = rgba(MAG, 1);
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShipAt(x, y, bank, ghost) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bank * 0.38);
    if (ghost) ctx.globalAlpha = ghost;
    const col = wepColor();
    ctx.fillStyle = rgba(col, 0.55);
    ctx.beginPath();
    ctx.moveTo(-3, 10);
    ctx.lineTo(-1.4, 22);
    ctx.lineTo(1.4, 22);
    ctx.lineTo(3, 10);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(7, 2);
    ctx.lineTo(0, 8);
    ctx.lineTo(-7, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 1);
    ctx.beginPath();
    ctx.moveTo(-7, 2);
    ctx.lineTo(-16, 10);
    ctx.lineTo(-5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, 2);
    ctx.lineTo(16, 10);
    ctx.lineTo(5, 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(3, 0);
    ctx.lineTo(0, 3);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.fillRect(-2.2, 7, 1.6, 6);
    ctx.fillRect(0.6, 7, 1.6, 6);
    if (G.muzzle > 0 && !ghost) {
      ctx.fillStyle = rgba(col, 0.85);
      ctx.fillRect(-1.4, -28, 2.8, 12);
    }
    ctx.restore();
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      drawShipAt(s.x, s.y, s.bank, s.t / 0.16 * 0.22);
    }
    drawShipAt(G.px, G.py, G.bank, 0);
    if (!REDUCE) {
      ctx.save();
      ctx.strokeStyle = rgba(wepColor(), 0.18);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(G.px, G.py, 16, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < sparks.length; i++) {
      const p = sparks[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.life / 0.3, 0, 1));
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, clamp(r.t / 0.55, 0, 1) * 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = clamp(f.t / 0.85, 0, 1);
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold 16px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawHudCanvas() {
    ctx.save();
    ctx.font = 'bold 11px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'center';
    const names = ['环', '束', '星'];
    const cols = [CYN, WHT, GOLD];
    const bx = CX;
    const by = VH - 16;
    for (let i = 0; i < 3; i++) {
      const x = bx + (i - 1) * 28;
      ctx.fillStyle = rgba(cols[i], i === G.wep ? 0.95 : 0.28);
      ctx.fillText(names[i], x, by);
      if (i === G.wep) {
        ctx.strokeStyle = rgba(cols[i], 0.7);
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 10, by - 12, 20, 16);
      }
    }
    ctx.restore();
  }

  function draw() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pw = stageEl ? stageEl.clientWidth : 800;
    const ph = stageEl ? stageEl.clientHeight : 450;
    if (pw !== W || ph !== H || canvas.width !== (pw * dpr | 0)) resize();

    const pal = palette();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#02080c';
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake : 0;
    const shy = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake * 0.6 : 0;
    ctx.save();
    ctx.translate(ox + shx, oy + shy);
    ctx.scale(scale * G.punch, scale * G.punch);
    if (G.punch !== 1) {
      ctx.translate(CX * (1 / G.punch - 1) * 0.5, VH * (1 / G.punch - 1) * 0.5);
    }
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    drawSky(pal);
    drawGround(pal);

    const dlist = [];
    for (let i = 0; i < decos.length; i++) dlist.push({ z: decos[i].z, i: i });
    dlist.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < dlist.length; i++) drawDeco(decos[dlist[i].i]);

    const elist = [];
    for (let i = 0; i < ents.length; i++) {
      if (!ents[i].dead) elist.push(ents[i]);
    }
    elist.sort(function (a, b) { return a.y - b.y; });

    for (let i = 0; i < shots.length; i++) {
      if (shots[i].from === 'e') drawShot(shots[i]);
    }
    for (let i = 0; i < elist.length; i++) drawEnemy(elist[i]);
    for (let i = 0; i < shots.length; i++) {
      if (shots[i].from === 'p') drawShot(shots[i]);
    }
    drawPlayer();
    drawParticles();
    drawHudCanvas();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.5);
      ctx.fillRect(0, 0, VW, VH);
    }
    ctx.restore();
  }

  function resize() {
    if (!stageEl) return;
    W = Math.max(1, stageEl.clientWidth);
    H = Math.max(1, stageEl.clientHeight);
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerVirtX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerVirtY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'dense' ? 'dense' : 'dive';
    G.stage = 1;
    G.t = 0;
    G.clock = 0;
    G.dist = 0;
    G.px = CX;
    G.py = 348;
    G.vx = 0;
    G.vy = 0;
    G.bank = 0;
    G.spd = isDense() ? 32 : 24;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.wep = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.05;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.boomT = 0;
    G.waveI = 0;
    G.why = '';
    G.runSeed = 1 + ((Math.random() * 999) | 0);
    clearField();
    seedStars();
    seedDecos();
    hideOverlay();
    hud();
    audio.start();
    toast(isDense() ? '密弹 · 来弹更密' : '俯冲 · 霓轴', false, true);
    setHint('空格射击 · Shift/Z 换环火、直束、晨星', '');
    if (scoreEl) scoreEl.textContent = '0';
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'dive';
    G.stage = 1;
    G.lives = LIVES;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.boomT = 0;
    G.score = 0;
    G.wep = 0;
    G.px = CX;
    G.py = 340;
    G.spd = 18;
    G.invuln = 9;
    clearField();
    seedStars();
    seedDecos();
    showOverlay('title', '轴射', '透视地面扑面而来。三把武器随手换。撞上就掉命。');
    setHint('空格射击 · Shift/Z 换环火、直束、晨星 · 撞上掉命', '');
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('dive');
    else startGame(G.kind || 'dive');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('dive');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isWep = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
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

    if (down && (isMove || space || isWep || k === 'Enter')) e.preventDefault();

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
    if (k === '1' && G.mode === 'title') {
      audio.ensure();
      startGame('dive');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('dense');
      return;
    }
    if (isWep) {
      if (!e.repeat) {
        audio.ensure();
        swapWep();
      }
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
        fireShot();
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
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fireShot();
      if (G.mode === 'title') startGame('dive');
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
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

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnDive) {
    btnDive.addEventListener('click', function () {
      audio.ensure();
      startGame('dive');
    });
  }
  if (btnDense) {
    btnDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'dive');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnWep) {
    btnWep.addEventListener('click', function () {
      audio.ensure();
      swapWep();
    });
  }
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
      pointer.down = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
