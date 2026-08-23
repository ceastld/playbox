'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const CY = VH * 0.5;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const BEST_KEY = 'playbox-bio-metal-best';
  const MUTE_KEY = 'playbox-bio-metal-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 变形 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const TEAL = [0, 232, 192];
  const HOT = [61, 255, 200];
  const GOLD = [255, 227, 107];
  const WHT = [232, 255, 248];
  const PNK = [255, 154, 212];
  const VEIN = [255, 106, 138];
  const DEEP = [4, 28, 24];
  const SEA = [8, 48, 52];

  const FORMS = [
    { name: '针', tag: 'NEEDLE', cd: 0.052, spd: 1.18, hit: 5.2 },
    { name: '环', tag: 'RING', cd: 0.10, spd: 0.78, hit: 7.2 },
    { name: '翼', tag: 'WING', cd: 0.088, spd: 1.0, hit: 6.4 }
  ];

  const SCORE = {
    spore: 50,
    jelly: 80,
    eel: 220,
    crab: 70,
    squid: 140,
    drone: 55,
    sat: 90,
    mine: 60,
    cannon: 160,
    worm: 180,
    boss: [4000, 7000],
    clear: 2000,
    all: 4000,
    absorb: 10
  };

  const STAGES = [
    {
      name: '生海',
      boss: '海核',
      theme: 'sea',
      bossHp: 84,
      waves: [
        { t: 0.6, kind: 'school', n: 5 },
        { t: 2.8, kind: 'jelly', n: 3 },
        { t: 5.0, kind: 'crab', n: 2 },
        { t: 7.2, kind: 'school', n: 7 },
        { t: 9.4, kind: 'eel' },
        { t: 11.6, kind: 'squid', n: 1 },
        { t: 13.8, kind: 'mix' },
        { t: 16.2, kind: 'jelly', n: 4 },
        { t: 18.6, kind: 'boss' }
      ]
    },
    {
      name: '核巢',
      boss: '生核',
      theme: 'core',
      bossHp: 118,
      waves: [
        { t: 0.5, kind: 'drone', n: 6 },
        { t: 2.6, kind: 'sat', n: 2 },
        { t: 4.8, kind: 'mine', n: 3 },
        { t: 7.0, kind: 'cannon', n: 2 },
        { t: 9.2, kind: 'worm' },
        { t: 11.4, kind: 'drone', n: 8 },
        { t: 13.6, kind: 'mix2' },
        { t: 16.0, kind: 'sat', n: 3 },
        { t: 18.4, kind: 'cannon', n: 3 },
        { t: 21.0, kind: 'boss' }
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
  const btnBio = document.getElementById('btn-bio');
  const btnTide = document.getElementById('btn-tide');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnMorph = document.getElementById('btn-morph');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const formLabel = document.getElementById('form-label');
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
  let nid = 1;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 140, y: CY, id: null };
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
  const bubbles = [];

  const G = {
    mode: 'title',
    kind: 'bio',
    t: 0,
    clock: 0,
    stage: 1,
    dist: 0,
    px: 140,
    py: CY,
    vx: 0,
    vy: 0,
    bank: 0,
    spd: 108,
    score: 0,
    best: { s: 0, t: 0 },
    combo: 0,
    comboT: 0,
    mult: 1,
    lives: LIVES,
    nextLife: LIFE_EVERY,
    form: 0,
    morphT: 0,
    morphCd: 0,
    orbR: 0,
    orbHit: [0, 0, 0, 0],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: TEAL,
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
    return G.kind === 'tide';
  }
  function stageDef() {
    return STAGES[clamp(G.stage, 1, 2) - 1];
  }
  function kindBest() {
    return isDense() ? G.best.t : G.best.s;
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
  function formColor(f) {
    const k = f == null ? G.form : f;
    return k === 2 ? GOLD : k === 1 ? MAG : TEAL;
  }
  function hitR() {
    return FORMS[G.form].hit;
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
      o2.type = 'sine';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 640;
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
      const form = G.form;
      const base = form === 1 ? 48 : form === 2 ? 72 : 88;
      const f = base + Math.sin(G.t * 14) * 6 + Math.abs(G.vx + G.vy) * 0.04;
      this.eng.frequency.setTargetAtTime(f, t, 0.05);
      this.eng2.frequency.setTargetAtTime(f * 2.02, t, 0.05);
      this.engF.frequency.setTargetAtTime(380 + form * 180, t, 0.08);
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.018 + form * 0.006), t, 0.06);
    },
    needle() {
      this.beep(1180, 0.038, 'square', 0.032, 1880);
      this.beep(590, 0.045, 'triangle', 0.016, 220);
    },
    ringShot() {
      this.beep(420, 0.055, 'triangle', 0.04, 760);
      this.beep(210, 0.07, 'sine', 0.022, 120);
    },
    wing() {
      this.beep(660, 0.04, 'square', 0.03, 990);
      this.beep(880, 0.05, 'triangle', 0.018, 440);
    },
    absorb() {
      this.beep(980, 0.05, 'sine', 0.04, 1480);
      this.beep(490, 0.06, 'triangle', 0.02, 220);
    },
    morph() {
      this.beep(330, 0.07, 'square', 0.04, 523);
      this.beep(523, 0.09, 'triangle', 0.036, 784);
      this.beep(784, 0.12, 'sine', 0.03, 1046);
    },
    hit(combo) {
      const lift = 1 + Math.min(0.55, combo * 0.038);
      this.noise(0.032, 0.028, 1200);
      this.beep(540 * lift, 0.062, 'square', 0.044, 880 * lift);
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
    const cls = mag >= 7 ? 'die' : mag >= 4.8 ? 'morph' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('morph');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
        stageEl.classList.remove('morph');
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
      vx0: -180 * m, vx1: 120 * m,
      vy0: -180 * m, vy1: 120 * m,
      r0: 1.4, r1: 4.8 * m,
      life: 0.42 + 0.18 * m,
      rgb: rgb
    });
    const ns = REDUCE ? 3 : 8;
    for (let i = 0; i < ns; i++) {
      sparks.push({
        x: x, y: y,
        vx: rand(-280, 180) * m,
        vy: rand(-240, 240) * m,
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
        G.best.s = (o.s | 0) || (o.d | 0);
        G.best.t = (o.t | 0) || (o.b | 0);
      } else {
        G.best.s = parseInt(raw, 10) | 0;
      }
    } catch (err) { /* ignore */ }
  }
  function maybeBest() {
    const k = isDense() ? 't' : 's';
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
      stageLabel.textContent = G.boss ? st.boss : st.name;
      stageLabel.classList.toggle('hot', !!G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '核潮' : '生金';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', !!G.boss);
    }
    if (formLabel) {
      formLabel.textContent = FORMS[G.form].name;
      formLabel.className = 'form f' + G.form;
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
    if (ovKicker) ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'STALL' : 'BMET';
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
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        r: rand(0.4, 1.6),
        a: rand(0.18, 0.85),
        tw: rand(0, TAU),
        z: rand(0.35, 1.2)
      });
    }
  }

  function seedDecos() {
    decos.length = 0;
    bubbles.length = 0;
    const th = stageDef().theme;
    for (let i = 0; i < 16; i++) {
      decos.push(makeDeco(th, rand(0, VW + 220)));
    }
    for (let i = 0; i < 18; i++) {
      bubbles.push({
        x: rand(0, VW),
        y: rand(0, VH),
        r: rand(1.2, 4.2),
        vy: rand(-28, -10),
        a: rand(0.12, 0.4)
      });
    }
  }

  function makeDeco(th, x) {
    if (th === 'core') {
      return {
        k: Math.random() < 0.45 ? 'node' : 'rib',
        x: x,
        y: rand(30, VH - 30),
        w: rand(18, 46),
        h: rand(40, 120),
        ph: rand(0, TAU)
      };
    }
    return {
      k: Math.random() < 0.5 ? 'kelp' : 'rib',
      x: x,
      y: Math.random() < 0.5 ? rand(VH - 90, VH - 10) : rand(8, 70),
      w: rand(10, 28),
      h: rand(40, 110),
      ph: rand(0, TAU)
    };
  }

  function pushEnt(e) {
    if (ents.length > 30) return;
    e.id = nextId();
    e.dead = false;
    e.t = e.t || 0;
    e.flash = 0;
    ents.push(e);
  }

  function spawnSpore(x, y, ph) {
    pushEnt({
      type: 'spore', x: x, y: y, vx: -90, vy: 0,
      hp: 1, r: 11, ph: ph || rand(0, TAU), fire: 9
    });
  }
  function spawnJelly(x, y) {
    pushEnt({
      type: 'jelly', x: x, y: y, vx: -52, vy: 0,
      hp: 2, r: 16, ph: rand(0, TAU), fire: rand(0.5, 1.2)
    });
  }
  function spawnEel(x, y) {
    pushEnt({
      type: 'eel', x: x, y: y, vx: -70, vy: 0,
      hp: 6, r: 18, ph: rand(0, TAU), fire: 9, segs: 5
    });
  }
  function spawnCrab(side) {
    const top = side < 0;
    pushEnt({
      type: 'crab', x: VW + 20, y: top ? 28 : VH - 28, vx: -64, vy: 0,
      hp: 3, r: 15, ph: 0, fire: rand(0.4, 0.9), side: top ? -1 : 1
    });
  }
  function spawnSquid(x, y) {
    pushEnt({
      type: 'squid', x: x, y: y, vx: -48, vy: 0,
      hp: 4, r: 18, ph: rand(0, TAU), fire: 0.7
    });
  }
  function spawnDrone(x, y, ph) {
    pushEnt({
      type: 'drone', x: x, y: y, vx: -96, vy: 0,
      hp: 1, r: 12, ph: ph || rand(0, TAU), fire: 9
    });
  }
  function spawnSat(x, y) {
    pushEnt({
      type: 'sat', x: x, y: y, vx: -58, vy: 0,
      hp: 3, r: 16, ph: rand(0, TAU), fire: rand(0.5, 1)
    });
  }
  function spawnMine(x, y) {
    pushEnt({
      type: 'mine', x: x, y: y, vx: -44, vy: 0,
      hp: 2, r: 13, ph: rand(0, TAU), fire: 9
    });
  }
  function spawnCannon(y) {
    pushEnt({
      type: 'cannon', x: VW + 24, y: y, vx: -40, vy: 0,
      hp: 5, r: 18, ph: 0, fire: rand(0.6, 1.1)
    });
  }
  function spawnWorm(x, y) {
    pushEnt({
      type: 'worm', x: x, y: y, vx: -76, vy: 0,
      hp: 5, r: 16, ph: rand(0, TAU), fire: 0.9, segs: 4
    });
  }

  function spawnBoss() {
    const st = stageDef();
    const hp = (st.bossHp * (isDense() ? 1.28 : 1)) | 0;
    const b = {
      type: 'boss',
      name: st.boss,
      x: VW + 80,
      y: CY,
      vx: -70,
      vy: 0,
      hp: hp,
      maxHp: hp,
      r: G.stage === 2 ? 42 : 38,
      ph: 0,
      fire: 0.7,
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
    setHint('Boss · 变形打核', 'hot');
  }

  function spawnWave(w) {
    const n = w.n || 4;
    const dense = isDense();
    if (w.kind === 'school') {
      for (let i = 0; i < n + (dense ? 2 : 0); i++) {
        spawnSpore(VW + 16 + i * 28, 70 + (i % 5) * 62 + rand(-12, 12), i);
      }
    } else if (w.kind === 'jelly') {
      for (let i = 0; i < n; i++) {
        spawnJelly(VW + 20 + i * 40, 80 + i * ((VH - 160) / Math.max(1, n - 1)));
      }
    } else if (w.kind === 'eel') {
      spawnEel(VW + 30, CY + rand(-80, 80));
      if (dense) spawnEel(VW + 90, CY + rand(-100, 100));
    } else if (w.kind === 'crab') {
      spawnCrab(-1);
      spawnCrab(1);
      if (dense) spawnCrab(Math.random() < 0.5 ? -1 : 1);
    } else if (w.kind === 'squid') {
      for (let i = 0; i < n; i++) spawnSquid(VW + 24 + i * 50, 90 + i * 80);
    } else if (w.kind === 'drone') {
      for (let i = 0; i < n + (dense ? 2 : 0); i++) {
        spawnDrone(VW + 12 + i * 22, 60 + (i % 6) * 55 + rand(-8, 8), i);
      }
    } else if (w.kind === 'sat') {
      for (let i = 0; i < n; i++) spawnSat(VW + 30 + i * 46, 90 + i * 90);
    } else if (w.kind === 'mine') {
      for (let i = 0; i < n + (dense ? 1 : 0); i++) {
        spawnMine(VW + 18 + i * 36, 70 + i * 70);
      }
    } else if (w.kind === 'cannon') {
      for (let i = 0; i < n; i++) spawnCannon(70 + i * ((VH - 140) / Math.max(1, n - 1)));
    } else if (w.kind === 'worm') {
      spawnWorm(VW + 24, 120);
      spawnWorm(VW + 70, VH - 120);
    } else if (w.kind === 'mix') {
      for (let i = 0; i < 5; i++) spawnSpore(VW + i * 24, 80 + i * 55, i);
      spawnJelly(VW + 40, 140);
      spawnCrab(-1);
      spawnSquid(VW + 10, 280);
    } else if (w.kind === 'mix2') {
      for (let i = 0; i < 6; i++) spawnDrone(VW + i * 18, 70 + i * 50, i);
      spawnSat(VW + 20, 200);
      spawnMine(VW + 50, 320);
      spawnCannon(CY);
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

  function morph() {
    if (!playing() && G.mode !== 'title') return;
    if (G.morphCd > 0) return;
    G.form = (G.form + 1) % 3;
    G.morphT = 0.28;
    G.morphCd = 0.18;
    audio.morph();
    screenFlash(formColor(), 0.22);
    pushRing(G.px, G.py, formColor(), 280);
    burst(G.px, G.py, 14, formColor(), 0.7);
    if (G.mode === 'play') {
      toast(FORMS[G.form].name, false, G.form === 2);
      hitStop(0.04);
      kick(4.2);
    }
    hud();
    if (formLabel) {
      formLabel.classList.remove('swap');
      void formLabel.offsetWidth;
      formLabel.className = 'form f' + G.form + ' swap';
    }
  }

  function orbPos(i) {
    const a = G.t * 4.4 + i * (TAU / 4);
    return {
      x: G.px + Math.cos(a) * G.orbR,
      y: G.py + Math.sin(a) * G.orbR * 0.72
    };
  }

  function fireShot() {
    if (!playing() || G.invuln > 1.05) return;
    if (G.fireCd > 0) return;
    const f = G.form;
    const x = G.px + 14;
    const y = G.py;
    G.fireCd = FORMS[f].cd;
    G.muzzle = 0.06;
    if (f === 0) {
      audio.needle();
      for (let i = -1; i <= 1; i += 2) {
        shots.push({
          from: 'p', form: 0, x: x, y: y + i * 3.4,
          vx: 780, vy: i * 12,
          r: 3.4, dmg: 1.15, pierce: true, hit: {}, life: 0.95, spin: 0
        });
      }
    } else if (f === 1) {
      audio.ringShot();
      shots.push({
        from: 'p', form: 1, x: x, y: y,
        vx: 520, vy: 0,
        r: 5.2, dmg: 0.9, pierce: false, hit: null, life: 1.1, spin: 0
      });
      for (let i = 0; i < 4; i++) {
        const o = orbPos(i);
        const dx = Math.cos(G.t * 4.4 + i * (TAU / 4));
        const dy = Math.sin(G.t * 4.4 + i * (TAU / 4));
        shots.push({
          from: 'p', form: 1, x: o.x, y: o.y,
          vx: 240 + dx * 80, vy: dy * 180,
          r: 3.8, dmg: 0.7, pierce: false, hit: null, life: 0.7, spin: 0
        });
      }
    } else {
      audio.wing();
      const angs = [-0.46, -0.23, 0, 0.23, 0.46];
      for (let i = 0; i < angs.length; i++) {
        const a = angs[i];
        shots.push({
          from: 'p', form: 2, x: x + Math.cos(a) * 4, y: y + Math.sin(a) * 8,
          vx: Math.cos(a) * 620, vy: Math.sin(a) * 620,
          r: 4.0, dmg: 0.78, pierce: false, hit: null, life: 1.15, spin: 0
        });
      }
    }
  }

  function enemyFire(e, aimed, spread) {
    if (G.mode !== 'play') return;
    if (shots.length > 110) return;
    const n = spread || 1;
    const dense = isDense();
    const count = dense && n === 1 && Math.random() < 0.4 ? 3 : n;
    for (let i = 0; i < count; i++) {
      let vx = -150 - (dense ? 28 : 0);
      let vy = 0;
      if (aimed) {
        const dx = G.px - e.x;
        const dy = G.py - e.y;
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
        const a = Math.PI + (i - (count - 1) * 0.5) * 0.28;
        const spd = dense ? 176 : 148;
        vx = Math.cos(a) * spd;
        vy = Math.sin(a) * spd;
      }
      shots.push({
        from: 'e', form: 0, x: e.x - 8, y: e.y,
        vx: vx, vy: vy, r: 4.2, dmg: 1, pierce: false, hit: null, life: 4.2, spin: 0
      });
    }
  }

  function hurtEnemy(e, dmg, hx, hy) {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.08;
    if (G.mode === 'play') noteCombo();
    audio.hit(G.combo);
    const rgb = e.type === 'boss' ? GOLD : formColor();
    emit(REDUCE ? 2 : 5, {
      x: hx, y: hy, j: 4,
      vx0: -80, vx1: 80, vy0: -90, vy1: 40,
      r0: 1.1, r1: 2.6, life: 0.22, rgb: rgb
    });
    if (e.type === 'boss') {
      hitStop(0.048);
      kick(2.4);
    } else {
      hitStop(0.038);
    }
    if (e.hp <= 0) killEnemy(e);
    else if (G.combo >= 2 && (G.combo % 3) === 0) {
      floatText(e.x, e.y - 12, '×' + G.combo, GOLD);
    }
  }

  function killEnemy(e) {
    if (e.dead) return;
    e.dead = true;
    const big = e.type === 'boss' || e.type === 'eel' || e.type === 'worm';
    audio.boom(big);
    burst(e.x, e.y, big ? 36 : 16, e.type === 'mine' ? GOLD : MAG, big ? 1.6 : 1);
    pushRing(e.x, e.y, MAG, big ? 280 : 160);
    hitStop(big ? 0.07 : 0.055);
    kick(big ? 7 : 3.4);
    if (big) screenFlash(MAG, 0.32);
    let base = SCORE[e.type] || 50;
    if (e.type === 'boss') base = SCORE.boss[G.stage - 1] || 4000;
    const n = (base * G.mult) | 0;
    if (G.mode === 'play') {
      bumpScore(n);
      floatText(e.x, e.y, '+' + n, GOLD);
    }
    if (e.type === 'boss') {
      G.boss = null;
      G.boomT = 1.32;
      screenFlash(GOLD, 0.55);
      setHint(G.stage >= 2 ? '生核崩了' : '关清', 'hot');
    }
  }

  function absorbAt(x, y) {
    audio.absorb();
    emit(REDUCE ? 3 : 7, {
      x: x, y: y, j: 5,
      vx0: -70, vx1: 70, vy0: -70, vy1: 70,
      r0: 1.2, r1: 2.8, life: 0.2, rgb: HOT
    });
    hitStop(0.018);
    if (G.mode === 'play') {
      noteCombo();
      bumpScore(SCORE.absorb * G.mult);
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
    burst(G.px, G.py, 16, TEAL, 0.9);
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
    G.px = 140;
    G.py = CY;
    G.vx = 0;
    G.vy = 0;
    G.invuln = 1.45;
    G.deadT = 0;
    toast('再飞', false, true);
  }

  function loseGame() {
    G.mode = 'lose';
    G.deadT = 0;
    maybeBest();
    audio.lose();
    showOverlay('lose', '活金坠了', '三命耗尽。R 再飞同一模式。');
    setHint('R 重开 · 变形找手感', 'warn');
    hud();
  }

  function winGame() {
    bumpScore(SCORE.all);
    G.mode = 'win';
    maybeBest();
    audio.win();
    showOverlay('win', '生核粉碎', '两关打穿。分数 ' + G.score + '。');
    setHint('R 再飞 · 核潮更密', 'hot');
    hud();
  }

  function afterBoss() {
    if (G.stage >= 2) {
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
    toast(st.name, false, true);
    setHint('空格射击 · Shift/Z 变形针、环、翼', '');
    hud();
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const base = isDense() ? 318 : 276;
    const spd = base * FORMS[G.form].spd;
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
    G.px = clamp(G.px, 28, 420);
    G.py = clamp(G.py, 22, VH - 22);
    const want = clamp(G.vy / 280, -1, 1);
    G.bank = lerp(G.bank, want, 0.16);
    const wantR = G.form === 1 ? 26 : 0;
    G.orbR = lerp(G.orbR, wantR, 0.18);
    if (!REDUCE && Math.abs(G.vx) + Math.abs(G.vy) > 40 && (G.t * 60 | 0) % 3 === 0) {
      smears.push({ x: G.px, y: G.py, bank: G.bank, t: 0.16, form: G.form });
    }
    if (G.mode === 'play' && G.fireHold) fireShot();
    updateOrbs(dt);
  }

  function updateOrbs(dt) {
    if (G.form !== 1 || G.orbR < 14 || G.deadT > 0 || G.mode !== 'play') return;
    for (let i = 0; i < 4; i++) {
      if (G.orbHit[i] > 0) G.orbHit[i] -= dt;
      const o = orbPos(i);
      for (let k = 0; k < ents.length; k++) {
        const e = ents[k];
        if (e.dead) continue;
        if (dist2(o.x, o.y, e.x, e.y) < (10 + e.r * 0.7) * (10 + e.r * 0.7)) {
          if (G.orbHit[i] <= 0) {
            G.orbHit[i] = 0.14;
            hurtEnemy(e, e.type === 'boss' ? 0.55 : 0.9, o.x, o.y);
          }
        }
      }
    }
  }

  function updateTitleShip(dt) {
    G.px = 160 + Math.sin(G.t * 0.7) * 50;
    G.py = CY + Math.sin(G.t * 1.1) * 42;
    G.bank = Math.cos(G.t * 1.1) * 0.4;
    const want = ((G.t * 0.38) | 0) % 3;
    if (want !== G.form && G.morphCd <= 0) morph();
    const wantR = G.form === 1 ? 26 : 0;
    G.orbR = lerp(G.orbR, wantR, 0.18);
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
    if (ents.length < 5 && Math.random() < 0.025) {
      spawnSpore(VW + 10, rand(60, VH - 60), rand(0, TAU));
    }
  }

  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      s.spin += dt * 10;
      if (s.x < -24 || s.x > VW + 28 || s.y < -28 || s.y > VH + 28 || s.life <= 0) {
        shots.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        let hit = false;
        for (let k = 0; k < ents.length; k++) {
          const e = ents[k];
          if (e.dead) continue;
          const rr = s.r + e.r * 0.92;
          if (dist2(s.x, s.y, e.x, e.y) > rr * rr) continue;
          if (s.pierce && s.hit[e.id]) continue;
          if (s.pierce) s.hit[e.id] = 1;
          hurtEnemy(e, s.dmg, s.x, s.y);
          if (!s.pierce) {
            shots.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      } else if (G.mode === 'play' && G.deadT <= 0) {
        if (G.form === 1 && G.orbR > 16) {
          let absorbed = false;
          for (let o = 0; o < 4; o++) {
            const p = orbPos(o);
            if (dist2(s.x, s.y, p.x, p.y) < 13 * 13) {
              absorbAt(p.x, p.y);
              absorbed = true;
              break;
            }
          }
          if (absorbed) {
            shots.splice(i, 1);
            continue;
          }
        }
        if (G.invuln <= 0 && dist2(s.x, s.y, G.px, G.py) < (s.r + hitR()) * (s.r + hitR())) {
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
      if (e.type === 'spore' || e.type === 'drone') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 2.4 + e.ph) * 70 * dt;
      } else if (e.type === 'jelly') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 1.6 + e.ph) * 46 * dt;
        e.fire -= dt;
        if (e.fire <= 0 && e.x < VW - 20 && e.x > 40) {
          enemyFire(e, false, 1);
          e.fire = (dense ? 1.05 : 1.55) + rand(0, 0.3);
        }
      } else if (e.type === 'eel' || e.type === 'worm') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 2.8 + e.ph) * 90 * dt;
        e.y = clamp(e.y, 40, VH - 40);
        if (e.type === 'worm') {
          e.fire -= dt;
          if (e.fire <= 0 && e.x < VW - 40) {
            enemyFire(e, true, 1);
            e.fire = dense ? 1.1 : 1.6;
          }
        }
      } else if (e.type === 'crab') {
        e.x += e.vx * dt;
        e.y = e.side < 0 ? 28 : VH - 28;
        e.fire -= dt;
        if (e.fire <= 0 && e.x < VW - 30) {
          enemyFire(e, true, dense ? 2 : 1);
          e.fire = (dense ? 0.85 : 1.28) + rand(0, 0.2);
        }
      } else if (e.type === 'squid') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 1.3) * 36 * dt;
        e.fire -= dt;
        if (e.fire <= 0 && e.x < VW - 20) {
          enemyFire(e, false, dense ? 5 : 3);
          e.fire = dense ? 1.05 : 1.5;
        }
      } else if (e.type === 'sat') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 1.1 + e.ph) * 50 * dt;
        e.fire -= dt;
        if (e.fire <= 0 && e.x < VW - 20) {
          enemyFire(e, true, dense ? 3 : 1);
          e.fire = dense ? 0.9 : 1.35;
        }
      } else if (e.type === 'mine') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 0.9 + e.ph) * 24 * dt;
        if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
          const seek = 48 * dt;
          e.y += clamp(G.py - e.y, -seek, seek);
        }
      } else if (e.type === 'cannon') {
        e.x += e.vx * dt;
        e.fire -= dt;
        if (e.fire <= 0 && e.x < VW - 10 && e.x > 80) {
          enemyFire(e, true, dense ? 3 : 1);
          e.fire = (dense ? 0.92 : 1.4) + rand(0, 0.25);
        }
      } else if (e.type === 'boss') {
        updateBoss(e, dt);
      }
      if (e.type !== 'boss') {
        if (G.mode === 'title' && e.x < 280) {
          killEnemy(e);
          continue;
        }
        if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
          const rr = hitR() + e.r * (e.type === 'mine' ? 0.9 : 0.62);
          if (dist2(e.x, e.y, G.px, G.py) < rr * rr) {
            playerHit(e.type === 'mine' ? '贴雷' : '相撞');
            if (e.type === 'mine') killEnemy(e);
          }
        }
        if (e.x < -70 || e.y < -70 || e.y > VH + 70) ents.splice(i, 1);
      }
    }
  }

  function updateBoss(b, dt) {
    b.ph += dt;
    const stg = G.stage;
    const dense = isDense();
    const rage = b.hp < b.maxHp * 0.45;
    if (b.x > 620) b.x += b.vx * dt;
    else b.x = lerp(b.x, 640, 0.04);
    if (stg === 1) {
      b.y = CY + Math.sin(b.ph * 0.9) * 86;
    } else {
      b.y = CY + Math.sin(b.ph * 1.15) * 70;
      b.x = 640 + Math.sin(b.ph * 0.7) * 28;
    }
    b.fire -= dt;
    if (b.fire > 0 || G.mode !== 'play') return;
    const interval = (dense ? 0.42 : 0.62) * (rage ? 0.72 : 1);
    b.fire = interval;
    b.pattern = (b.pattern + 1) % 4;
    if (shots.length > 110) return;
    if (stg === 1) {
      if (b.pattern === 0 || b.pattern === 2) enemyFire(b, false, dense ? 7 : 5);
      else enemyFire(b, true, dense ? 3 : 1);
      if (rage && b.pattern === 3) {
        for (let i = 0; i < 6; i++) {
          const a = Math.PI + (i - 2.5) * 0.18;
          shots.push({
            from: 'e', form: 0, x: b.x - 20, y: b.y,
            vx: Math.cos(a) * 210, vy: Math.sin(a) * 210,
            r: 5.2, dmg: 1, pierce: false, hit: null, life: 4, spin: 0
          });
        }
      }
    } else {
      const n = dense || rage ? 12 : 8;
      for (let i = 0; i < n; i++) {
        const a = b.ph * 1.5 + i * (TAU / n);
        const spd = 118 + (rage ? 32 : 0);
        shots.push({
          from: 'e', form: 0, x: b.x + Math.cos(a) * 24, y: b.y + Math.sin(a) * 18,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          r: 4.6, dmg: 1, pierce: false, hit: null, life: 4.2, spin: 0
        });
      }
      if (b.pattern === 1 || rage) enemyFire(b, true, dense ? 5 : 3);
    }
  }

  function updateDecos(dt) {
    const vx = G.spd;
    for (let i = 0; i < decos.length; i++) {
      decos[i].x -= vx * dt;
      if (decos[i].x < -80) {
        const n = makeDeco(stageDef().theme, VW + rand(20, 180));
        decos[i].k = n.k;
        decos[i].x = n.x;
        decos[i].y = n.y;
        decos[i].w = n.w;
        decos[i].h = n.h;
        decos[i].ph = n.ph;
      }
    }
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      b.y += b.vy * dt;
      b.x -= vx * 0.22 * dt;
      if (b.y < -8 || b.x < -10) {
        b.y = VH + rand(4, 40);
        b.x = rand(0, VW);
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 70 * dt;
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
    if (G.morphT > 0) G.morphT -= dt;
    if (G.morphCd > 0) G.morphCd -= dt;
  }

  function cruiseSpd() {
    if (G.boss) return isDense() ? 36 : 22;
    return isDense() ? 152 : 108;
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt);
      return;
    }
    G.spd = lerp(G.spd, G.mode === 'play' ? cruiseSpd() : 72, 0.04);
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

  function palette() {
    const th = stageDef().theme;
    if (th === 'core') {
      return {
        sky0: [8, 6, 14], sky1: [18, 8, 22],
        g1: [22, 10, 28], g2: [10, 6, 16],
        line: [255, 80, 180], fog: [70, 18, 48],
        glow: MAG
      };
    }
    return {
      sky0: [2, 18, 20], sky1: [4, 42, 44],
      g1: [4, 36, 40], g2: [2, 22, 28],
      line: [0, 232, 192], fog: [10, 70, 72],
      glow: TEAL
    };
  }

  function drawSky(pal) {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, rgba(pal.sky0, 1));
    g.addColorStop(0.55, rgba(pal.sky1, 1));
    g.addColorStop(1, rgba(mix(pal.sky1, pal.g2, 0.5), 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const sx = ((s.x - G.dist * s.z * 0.22) % VW + VW) % VW;
      const tw = 0.45 + Math.sin(G.t * 2.2 + s.tw) * 0.35;
      ctx.fillStyle = rgba(i % 5 === 0 ? GOLD : i % 3 === 0 ? HOT : WHT, s.a * tw);
      ctx.fillRect(sx, s.y, s.r, s.r);
    }
  }

  function drawSea(pal) {
    const th = stageDef().theme;
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const x = ((i * 210 - G.dist * 0.18) % (VW + 80)) - 40;
      ctx.fillStyle = rgba(pal.glow, 0.035 + Math.sin(G.t * 0.6 + i) * 0.015);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 36, 0);
      ctx.lineTo(x + 90, VH);
      ctx.lineTo(x + 20, VH);
      ctx.closePath();
      ctx.fill();
    }
    if (th === 'sea') {
      ctx.fillStyle = rgba(SEA, 0.35);
      ctx.fillRect(0, VH - 52, VW, 52);
      ctx.fillStyle = rgba(DEEP, 0.4);
      ctx.fillRect(0, VH - 22, VW, 22);
    }
    ctx.restore();
  }

  function drawDecos(pal) {
    const th = stageDef().theme;
    for (let i = 0; i < decos.length; i++) {
      const d = decos[i];
      const sway = Math.sin(G.t * 1.4 + d.ph) * 8;
      if (d.k === 'kelp') {
        ctx.strokeStyle = rgba(mix(TEAL, pal.g1, 0.4), 0.45);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.quadraticCurveTo(d.x + sway, d.y - d.h * 0.5, d.x + sway * 0.4, d.y - d.h);
        ctx.stroke();
      } else if (d.k === 'node') {
        const pulse = 0.5 + Math.sin(G.t * 3 + d.ph) * 0.3;
        ctx.fillStyle = rgba(MAG, 0.12 + pulse * 0.12);
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.w * 0.45, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(HOT, 0.35);
        ctx.lineWidth = 1.2;
        ctx.stroke();
      } else {
        ctx.strokeStyle = rgba(th === 'core' ? MAG : TEAL, 0.16);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.h * 0.4);
        ctx.lineTo(d.x + d.w, d.y);
        ctx.lineTo(d.x, d.y + d.h * 0.4);
        ctx.stroke();
      }
    }
    if (th === 'sea') {
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        ctx.strokeStyle = rgba(HOT, b.a);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, TAU);
        ctx.stroke();
      }
    }
    if (th === 'core') {
      ctx.strokeStyle = rgba(MAG, 0.08);
      ctx.lineWidth = 1;
      const off = (G.dist * 0.12) % 48;
      for (let x = -off; x < VW; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 40, VH);
        ctx.stroke();
      }
    }
  }

  function drawShipBody(x, y, form, a, scaleS) {
    const s = scaleS || 1;
    const pulse = 0.7 + Math.sin(G.t * 10) * 0.3;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(G.bank * 0.22);
    ctx.scale(s, s);
    ctx.globalAlpha = a;
    if (form === 0) {
      ctx.fillStyle = rgba(TEAL, 0.95);
      ctx.beginPath();
      ctx.moveTo(18, 0);
      ctx.lineTo(-8, -6);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-4, -2.4);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-4, 2.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, pulse);
      ctx.fillRect(2, -1.2, 10, 2.4);
    } else if (form === 1) {
      ctx.fillStyle = rgba(MAG, 0.92);
      ctx.beginPath();
      ctx.ellipse(0, 0, 12, 9, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(TEAL, 0.95);
      ctx.beginPath();
      ctx.ellipse(2, 0, 7, 5.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, pulse);
      ctx.beginPath();
      ctx.arc(4, 0, 2.6, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(GOLD, 0.28);
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-16, -16);
      ctx.lineTo(4, -4);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(-16, 16);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-10, -7);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-10, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(TEAL, 0.95);
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.lineTo(-4, -3);
      ctx.lineTo(-6, 0);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();
    }
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(16, 0, 6 + G.muzzle * 40, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    const a = blink ? 0.35 : 1;
    if (!REDUCE) {
      for (let i = 0; i < smears.length; i++) {
        const m = smears[i];
        drawShipBody(m.x, m.y, m.form, m.t * 2.2, 0.86);
      }
    }
    const grow = G.morphT > 0 ? 1 + G.morphT * 0.45 : 1;
    drawShipBody(G.px, G.py, G.form, a, grow);
    if (G.orbR > 2) {
      for (let i = 0; i < 4; i++) {
        const o = orbPos(i);
        const pulse = 0.7 + Math.sin(G.t * 12 + i) * 0.3;
        ctx.fillStyle = rgba(i & 1 ? MAG : HOT, 0.22 * a);
        ctx.beginPath();
        ctx.arc(o.x, o.y, 9, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(i & 1 ? MAG : TEAL, a);
        ctx.beginPath();
        ctx.arc(o.x, o.y, 4.6, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, pulse * a);
        ctx.beginPath();
        ctx.arc(o.x - 1, o.y - 1, 1.6, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = rgba(HOT, 0.28 * a);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(G.px, G.py);
        ctx.lineTo(o.x, o.y);
        ctx.stroke();
      }
    }
  }

  function drawEnemy(e) {
    const flash = e.flash > 0;
    const rgb = flash ? WHT : (e.type === 'boss' ? GOLD : MAG);
    ctx.save();
    ctx.translate(e.x, e.y);
    if (e.type === 'spore' || e.type === 'drone') {
      ctx.fillStyle = rgba(e.type === 'drone' ? MAG : TEAL, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(3, 0, 2.4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT, 0.5);
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-14, 0);
      ctx.lineTo(-8, 4);
      ctx.stroke();
    } else if (e.type === 'jelly') {
      ctx.fillStyle = rgba(HOT, 0.55);
      ctx.beginPath();
      ctx.ellipse(0, -2, 14, 10, 0, Math.PI, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(TEAL, 0.7);
      ctx.lineWidth = 1.4;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 4, 4);
        ctx.quadraticCurveTo(i * 4 + Math.sin(G.t * 4 + i) * 4, 12, i * 3, 18);
        ctx.stroke();
      }
    } else if (e.type === 'eel' || e.type === 'worm') {
      const n = e.segs || 5;
      for (let i = n - 1; i >= 0; i--) {
        const ox = i * 12;
        const oy = Math.sin(e.t * 6 + i * 0.8) * 6;
        ctx.fillStyle = rgba(i === 0 ? GOLD : (e.type === 'worm' ? MAG : TEAL), 0.9);
        ctx.beginPath();
        ctx.arc(ox, oy, 7 - i * 0.6, 0, TAU);
        ctx.fill();
      }
    } else if (e.type === 'crab') {
      ctx.fillStyle = rgba(VEIN, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 8, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-16, e.side * 8);
      ctx.moveTo(8, -4);
      ctx.lineTo(16, e.side * 8);
      ctx.stroke();
    } else if (e.type === 'squid') {
      ctx.fillStyle = rgba(MAG, 0.92);
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -10);
      ctx.lineTo(-4, 0);
      ctx.lineTo(-8, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(2, 0, 3, 0, TAU);
      ctx.fill();
    } else if (e.type === 'sat') {
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, TAU);
      ctx.stroke();
      const a = e.t * 3;
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 14, Math.sin(a) * 14, 3.2, 0, TAU);
      ctx.fill();
    } else if (e.type === 'mine') {
      const pulse = 1 + Math.sin(e.t * 8) * 0.12;
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 9 * pulse, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(MAG, 0.9);
      ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        const a = i * (TAU / 6);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
        ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
        ctx.stroke();
      }
    } else if (e.type === 'cannon') {
      ctx.fillStyle = rgba(VEIN, 0.92);
      ctx.fillRect(-12, -10, 24, 20);
      ctx.fillStyle = rgba(TEAL, 0.9);
      ctx.fillRect(-18, -4, 14, 8);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(-4, -4, 8, 8);
    } else if (e.type === 'boss') {
      const stg = G.stage;
      const rage = e.hp < e.maxHp * 0.45;
      ctx.fillStyle = rgba(rage ? MAG : mix(TEAL, MAG, 0.4), 0.92);
      ctx.beginPath();
      ctx.ellipse(0, 0, e.r + 4, e.r * 0.72, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(DEEP, 0.7);
      ctx.beginPath();
      ctx.ellipse(-8, 0, e.r * 0.45, e.r * 0.38, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(rage ? GOLD : HOT, 0.7 + Math.sin(G.t * 8) * 0.25);
      ctx.beginPath();
      ctx.arc(-6, 0, 10, 0, TAU);
      ctx.fill();
      if (stg === 1) {
        ctx.strokeStyle = rgba(TEAL, 0.7);
        ctx.lineWidth = 3;
        for (let i = -3; i <= 3; i++) {
          ctx.beginPath();
          ctx.moveTo(-e.r * 0.2, i * 7);
          ctx.quadraticCurveTo(-e.r - 10, i * 10 + Math.sin(G.t * 3 + i) * 8, -e.r - 28, i * 12);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = rgba(GOLD, 0.55);
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const a = e.ph * 1.2 + i * (TAU / 6);
          ctx.beginPath();
          ctx.arc(0, 0, e.r + 8, a, a + 0.4);
          ctx.stroke();
        }
      }
      if (flash) {
        ctx.fillStyle = rgba(WHT, 0.35);
        ctx.beginPath();
        ctx.ellipse(0, 0, e.r + 4, e.r * 0.72, 0, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
    if (flash && e.type !== 'boss') {
      ctx.fillStyle = rgba(WHT, 0.45);
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawShot(s) {
    if (s.from === 'p') {
      const rgb = s.form === 2 ? GOLD : s.form === 1 ? MAG : TEAL;
      if (s.form === 0) {
        ctx.strokeStyle = rgba(rgb, 0.95);
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(s.x - 10, s.y);
        ctx.lineTo(s.x + 8, s.y);
        ctx.stroke();
        ctx.strokeStyle = rgba(WHT, 0.8);
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = rgba(rgb, 0.95);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.7);
        ctx.beginPath();
        ctx.arc(s.x - 1, s.y - 1, s.r * 0.4, 0, TAU);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = rgba(PNK, 0.95);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 0.45, 0, TAU);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / (p.max || 0.4), 0, 1));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const p = sparks[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.life / 0.28, 0, 1));
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, clamp(r.t / 0.55, 0, 1) * 0.7);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    ctx.font = '700 13px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.fillStyle = rgba(f.rgb, clamp(f.t / 0.85, 0, 1));
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.textAlign = 'left';
  }

  function drawHudCanvas() {
    if (G.mode !== 'play' || !G.boss) return;
    const p = clamp(G.boss.hp / G.boss.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(VW * 0.22, 12, VW * 0.56, 8);
    ctx.fillStyle = rgba(p < 0.28 ? MAG : TEAL, 0.9);
    ctx.fillRect(VW * 0.22, 12, VW * 0.56 * p, 8);
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale * G.punch, scale * G.punch);
    if (G.shake > 0 && !REDUCE) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake * 0.6);
    }
    const pal = palette();
    drawSky(pal);
    drawSea(pal);
    drawDecos(pal);

    for (let i = 0; i < shots.length; i++) {
      if (shots[i].from === 'e') drawShot(shots[i]);
    }
    for (let i = 0; i < ents.length; i++) drawEnemy(ents[i]);
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
    G.kind = kind === 'tide' ? 'tide' : 'bio';
    G.stage = 1;
    G.t = 0;
    G.clock = 0;
    G.dist = 0;
    G.px = 140;
    G.py = CY;
    G.vx = 0;
    G.vy = 0;
    G.bank = 0;
    G.spd = isDense() ? 152 : 108;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.form = 0;
    G.morphT = 0;
    G.morphCd = 0;
    G.orbR = 0;
    G.orbHit = [0, 0, 0, 0];
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
    toast(isDense() ? '核潮 · 更密更快' : '生金 · 生海', false, true);
    setHint('空格射击 · Shift/Z 变形针、环、翼', '');
    if (scoreEl) scoreEl.textContent = '0';
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'bio';
    G.stage = 1;
    G.lives = LIVES;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.boomT = 0;
    G.score = 0;
    G.form = 0;
    G.orbR = 0;
    G.px = 160;
    G.py = CY;
    G.spd = 72;
    G.invuln = 9;
    clearField();
    seedStars();
    seedDecos();
    showOverlay('title', '生金', '横向卷轴。活金三态：针穿甲、环盾吞弹、翼散清群。撞上掉命。先打生海再打核巢。');
    setHint('空格射击 · Shift/Z 变形针、环、翼 · 环盾吞弹 · 撞上掉命', '');
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('bio');
    else startGame(G.kind || 'bio');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('bio');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMorph = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
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

    if (down && (isMove || space || isMorph || k === 'Enter')) e.preventDefault();

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
      startGame('bio');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('tide');
      return;
    }
    if (isMorph) {
      if (!e.repeat) {
        audio.ensure();
        morph();
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
      if (G.mode === 'title') startGame('bio');
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

  if (btnBio) {
    btnBio.addEventListener('click', function () {
      audio.ensure();
      startGame('bio');
    });
  }
  if (btnTide) {
    btnTide.addEventListener('click', function () {
      audio.ensure();
      startGame('tide');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'bio');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  function doMorph() {
    audio.ensure();
    morph();
  }
  if (btnMorph) btnMorph.addEventListener('click', doMorph);
  if (btnPad) btnPad.addEventListener('click', doMorph);
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
