'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const FOCAL = 390;
  const LIVES = 3;
  const SHIELD = 100;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const BEST_KEY = 'playbox-star-trench-best';
  const MUTE_KEY = 'playbox-star-trench-mute';
  const OPS = '方向 / WASD 移动 · 空格开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 196, 74];
  const FLM = [255, 154, 50];
  const RED = [255, 72, 96];
  const WHT = [255, 246, 228];
  const PNK = [255, 154, 212];
  const GRN = [92, 255, 170];

  const ACTS = {
    space: { name: '太空', len: 560, spd: 26, tag: 'SPACE' },
    towers: { name: '塔林', len: 520, spd: 31, tag: 'TOWER' },
    trench: { name: '星沟', len: 700, spd: 38, tag: 'TRENCH' }
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
  const btnRaid = document.getElementById('btn-raid');
  const btnDeep = document.getElementById('btn-deep');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const timeEl = document.getElementById('time');
  const timeBox = document.getElementById('time-box');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const shieldBar = document.getElementById('shield-bar');
  const shieldWrap = document.getElementById('shield-wrap');

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
  const pointer = { down: false, hover: false, x: CX, y: 280, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const floats = [];
  const rings = [];
  const smears = [];
  const stars = [];
  const ents = [];
  const shots = [];
  const obs = [];
  const turrets = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    act: 'space',
    t: 0,
    clock: 0,
    dist: 0,
    actDist: 0,
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    bank: 0,
    spd: 24,
    horizon: 168,
    score: 0,
    scoreAcc: 0,
    best: { r: 0, d: 0 },
    combo: 0,
    comboT: 0,
    mult: 1,
    lives: LIVES,
    shield: SHIELD,
    time: 99,
    timeCap: 99,
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    muzzle: 0,
    transT: 0,
    whooshT: 0,
    trenchEnd: 700,
    port: null,
    portHit: false,
    boomT: 0,
    spawnT: 0.6,
    toastT: 0,
    why: '',
    ending: '',
    warn: 0,
    warnBeep: 0,
    lock: null,
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
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function isDeep() {
    return G.kind === 'deep';
  }
  function actDef() {
    return ACTS[G.act] || ACTS.space;
  }
  function kindBest() {
    return isDeep() ? G.best.d : G.best.r;
  }
  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function trenchW() {
    return isDeep() ? 0.86 : 1.04;
  }
  function targetSpd() {
    return actDef().spd * (isDeep() && G.act === 'trench' ? 1.32 : 1);
  }
  function playing() {
    return G.mode === 'play' && G.deadT <= 0 && G.boomT <= 0;
  }

  function project(wx, wy, wz) {
    const z = wz < 0.42 ? 0.42 : wz;
    const s = FOCAL / z;
    const camX = G.px * 0.62;
    const camY = G.py * 0.46;
    return {
      x: CX + (wx - camX) * s,
      y: G.horizon - (wy - camY) * s * 0.78,
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
      f.frequency.value = 680;
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
    tickEngine(spd01, on) {
      if (!this.engG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on) {
        this.engG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const trench = G.act === 'trench' ? 1 : 0;
      const f = 52 + spd01 * 150 + trench * 40 + Math.sin(G.t * 22) * (2 + spd01 * 10);
      this.eng.frequency.setTargetAtTime(f, t, 0.045);
      this.eng2.frequency.setTargetAtTime(f * 2.08, t, 0.045);
      this.engF.frequency.setTargetAtTime(380 + spd01 * 1200 + trench * 280, t, 0.08);
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.022 + spd01 * 0.06 + trench * 0.018), t, 0.06);
    },
    gun() {
      this.beep(880, 0.04, 'square', 0.036, 1960);
      this.beep(420, 0.05, 'sawtooth', 0.02, 180);
    },
    hit(combo) {
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.034, 1100);
      this.beep(560 * lift, 0.07, 'square', 0.048, 920 * lift);
    },
    boom(big) {
      this.noise(big ? 0.2 : 0.09, big ? 0.085 : 0.05, big ? 220 : 480);
      this.beep(big ? 150 : 250, big ? 0.26 : 0.12, 'sawtooth', 0.055, 48);
    },
    shield() {
      this.beep(210, 0.08, 'square', 0.05, 90);
      this.noise(0.07, 0.04, 600);
    },
    death() {
      this.noise(0.18, 0.08, 240);
      this.beep(280, 0.22, 'sawtooth', 0.06, 70);
      this.beep(130, 0.34, 'sine', 0.05, 40);
    },
    whoosh() {
      this.noise(0.28, 0.09, 180);
      this.beep(90, 0.22, 'sawtooth', 0.05, 320);
      this.beep(220, 0.16, 'triangle', 0.03, 80);
    },
    dive() {
      this.beep(180, 0.18, 'sawtooth', 0.05, 60);
      this.noise(0.22, 0.07, 140);
      this.beep(392, 0.12, 'square', 0.04, 784);
    },
    portBoom() {
      this.noise(0.55, 0.14, 80);
      this.beep(90, 0.5, 'sawtooth', 0.08, 32);
      this.beep(220, 0.32, 'sine', 0.06, 55);
      this.beep(523, 0.18, 'triangle', 0.045, 1046);
      this.beep(784, 0.28, 'square', 0.04, 196);
    },
    warn() {
      this.beep(880, 0.06, 'square', 0.055);
      this.beep(520, 0.08, 'square', 0.04);
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
    },
    tick() {
      this.beep(1480, 0.03, 'square', 0.022);
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
  }

  function burstAt(wx, wy, wz, n, rgb, mag) {
    const p = project(wx, wy, wz);
    const m = mag || 1;
    emit((n * (REDUCE ? 0.45 : 1)) | 0, {
      x: p.x, y: p.y, j: 8 * m,
      vx0: -150 * m, vx1: 150 * m,
      vy0: -170 * m, vy1: 90 * m,
      r0: 1.4, r1: 4.6 * m,
      life: 0.42 + 0.18 * m,
      rgb: rgb
    });
    const ns = REDUCE ? 3 : 8;
    for (let i = 0; i < ns; i++) {
      sparks.push({
        x: p.x, y: p.y,
        vx: rand(-240, 240) * m,
        vy: rand(-260, 120) * m,
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
        G.best.r = o.r | 0;
        G.best.d = o.d | 0;
      } else {
        G.best.r = parseInt(raw, 10) | 0;
      }
    } catch (err) { /* ignore */ }
  }
  function maybeBest() {
    const k = isDeep() ? 'd' : 'r';
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
    const ts = Math.max(0, Math.ceil(G.time));
    if (timeEl) timeEl.textContent = String(ts);
    if (timeBox) timeBox.classList.toggle('hot', G.time <= 10 && G.mode === 'play');
    const st = actDef();
    if (stageLabel) {
      stageLabel.textContent = st.name;
      stageLabel.classList.toggle('hot', G.act === 'trench');
    }
    if (tagLabel) {
      tagLabel.textContent = isDeep() ? '深沟' : '突袭';
      tagLabel.classList.toggle('warn', isDeep());
      tagLabel.classList.toggle('hot', !!(G.port && G.port.z < 22));
    }
    if (shieldBar) shieldBar.style.transform = 'scaleX(' + clamp(G.shield / SHIELD, 0, 1).toFixed(3) + ')';
    if (shieldWrap) shieldWrap.classList.toggle('low', G.shield <= 28);
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
    if (ovKicker) ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'STALL' : 'TRENCH';
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
    obs.length = 0;
    turrets.length = 0;
    particles.length = 0;
    sparks.length = 0;
    floats.length = 0;
    rings.length = 0;
    smears.length = 0;
    G.port = null;
    G.portHit = false;
    G.lock = null;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: rand(-2.6, 2.6),
        y: rand(-1.6, 1.6),
        z: rand(2, 90)
      });
    }
  }

  function spawnTie(x, y, z) {
    if (ents.length > 14) return;
    ents.push({
      type: 'tie',
      x: x,
      y: y,
      z: z,
      ph: rand(0, TAU),
      t: rand(0, 4),
      hp: 1,
      fire: rand(0.35, 1.2),
      bank: 0,
      dead: false
    });
  }

  function spawnTower(x, z, h) {
    ents.push({
      type: 'tower',
      x: x,
      y: -1,
      z: z,
      h: h,
      hp: 2,
      fire: rand(0.6, 1.8),
      dead: false
    });
  }

  function seedTowers() {
    ents.length = 0;
    obs.length = 0;
    turrets.length = 0;
    for (let i = 0; i < 10; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const h = hash2(i * 17 + 3);
      spawnTower(side * (0.55 + h * 0.85), 48 + i * 16 + h * 8, 0.9 + h * 1.4);
    }
  }

  function seedTrench() {
    ents.length = 0;
    obs.length = 0;
    turrets.length = 0;
    G.portHit = false;
    let z = 56;
    const end = isDeep() ? 560 : 480;
    const gap0 = isDeep() ? 13.5 : 18.5;
    let i = 0;
    let lastZ = z;
    while (z < end) {
      const roll = hash2(i * 19 + (isDeep() ? 7 : 2) + G.runSeed);
      const kinds = ['L', 'R', 'U', 'D'];
      const kind = kinds[(roll * 4) | 0];
      obs.push({ z: z, kind: kind, scored: false });
      if (roll > 0.28) {
        turrets.push({
          z: z + 4 + roll * 5,
          side: roll > 0.66 ? 1 : -1,
          y: -0.12 + (roll - 0.5) * 0.55,
          hp: 1,
          fire: rand(0.2, 0.9),
          dead: false
        });
      }
      lastZ = z;
      z += gap0 + roll * 5;
      i += 1;
    }
    G.trenchEnd = lastZ + 52;
    G.port = { x: 0, y: -0.42, z: G.trenchEnd, type: 'port', announced: false };
  }

  function spawnSpaceWave() {
    const n = 2 + ((Math.random() * 3) | 0);
    const bx = rand(-0.7, 0.7);
    const by = rand(-0.25, 0.45);
    for (let i = 0; i < n; i++) {
      spawnTie(bx + (i - (n - 1) * 0.5) * 0.38, by + (i % 2) * 0.12, 78 + i * 4);
    }
  }

  function noteCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
      }
    }
  }

  function nearestAim() {
    let best = null;
    let bestD = 0.55;
    const list = ents;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.dead) continue;
      if (e.z < 6 || e.z > 64) continue;
      const dx = e.x - G.px;
      const dy = (e.type === 'tower' ? e.y + e.h * 0.55 : e.y) - G.py;
      const d = Math.abs(dx) + Math.abs(dy) * 0.85;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    for (let i = 0; i < turrets.length; i++) {
      const e = turrets[i];
      if (e.dead || e.hp <= 0) continue;
      if (e.z < 6 || e.z > 64) continue;
      const dx = e.side * trenchW() * 0.72 - G.px;
      const dy = e.y - G.py;
      const d = Math.abs(dx) + Math.abs(dy) * 0.85;
      if (d < bestD) {
        bestD = d;
        best = { x: e.side * trenchW() * 0.72, y: e.y, z: e.z, _tur: e };
      }
    }
    if (G.port && G.port.z < 26 && G.port.z > 3) {
      const dx = G.port.x - G.px;
      const dy = G.port.y - G.py;
      const d = Math.abs(dx) + Math.abs(dy) * 0.7;
      if (d < 0.72) best = G.port;
    }
    G.lock = best;
    return best;
  }

  function fireGun() {
    if (G.mode !== 'play' || G.deadT > 0 || G.boomT > 0 || G.fireCd > 0) return;
    if (shots.length > 10) return;
    G.fireCd = isDeep() ? 0.072 : 0.09;
    G.muzzle = 0.07;
    const aim = nearestAim();
    let vx = 0;
    let vy = 0;
    if (aim) {
      vx = (aim.x - G.px) * 0.42;
      vy = ((aim.y || 0) - G.py) * 0.42;
    }
    const torp = !!(G.port && G.port.z < 20);
    const vz = torp ? 48 : 62;
    shots.push({ x: G.px - 0.08, y: G.py - 0.02, z: 3.6, vx: vx, vy: vy, vz: vz, from: 'p', torp: torp });
    shots.push({ x: G.px + 0.08, y: G.py - 0.02, z: 3.6, vx: vx, vy: vy, vz: vz, from: 'p', torp: torp });
    audio.gun();
  }

  function fireBolt(e, fromTur) {
    const x = fromTur ? e.side * trenchW() * 0.72 : e.x;
    const y = fromTur ? e.y : (e.type === 'tower' ? e.y + e.h * 0.7 : e.y);
    shots.push({
      x: x,
      y: y,
      z: e.z,
      vx: (G.px - x) * 0.22,
      vy: (G.py - y) * 0.22,
      vz: -22,
      from: 'e'
    });
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    const isTie = e.type === 'tie';
    const pts = ((isTie ? 200 : 150) * G.mult) | 0;
    const wy = isTie ? e.y : e.y + e.h * 0.55;
    const p = project(e.x, wy, e.z);
    burstAt(e.x, wy, e.z, isTie ? 18 : 22, isTie ? MAG : GOLD, isTie ? 1 : 1.25);
    pushRing(p.x, p.y, isTie ? MAG : GOLD, 180);
    floatText(p.x, p.y - 10, '+' + pts, isTie ? MAG : GOLD);
    if (G.mode === 'play') {
      noteCombo();
      bumpScore(pts);
      hitStop(isTie ? 0.042 : 0.055);
      kick(isTie ? 3.4 : 4.6);
      screenFlash(isTie ? MAG : GOLD, 0.16);
      audio.hit(G.combo);
      audio.boom(!isTie);
    } else {
      audio.boom(false);
    }
  }

  function killTurret(t) {
    t.dead = true;
    t.hp = 0;
    const x = t.side * trenchW() * 0.72;
    const p = project(x, t.y, t.z);
    const pts = (120 * G.mult) | 0;
    burstAt(x, t.y, t.z, 14, FLM, 0.9);
    floatText(p.x, p.y, '+' + pts, FLM);
    if (G.mode === 'play') {
      noteCombo();
      bumpScore(pts);
      hitStop(0.038);
      kick(3);
      audio.hit(G.combo);
      audio.boom(false);
    }
  }

  function playerDie(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.boomT > 0) return;
    const p = project(G.px, G.py, 4.2);
    emit(REDUCE ? 12 : 30, {
      x: p.x, y: p.y, j: 16,
      vx0: -200, vx1: 200, vy0: -220, vy1: 90,
      r0: 2, r1: 7, life: 0.58, rgb: FLM
    });
    pushRing(p.x, p.y, MAG, 260);
    screenFlash(MAG, 0.5);
    hitStop(0.078);
    kick(11);
    audio.death();
    G.deadT = 0.92;
    G.why = why || '击坠';
    G.combo = 0;
    G.mult = 1;
    G.shield = 0;
  }

  function playerHit(why, crash) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.boomT > 0 || G.transT > 0) return;
    if (crash) {
      playerDie(why);
      return;
    }
    if (G.shield > 0) {
      G.shield = Math.max(0, G.shield - (isDeep() ? 34 : 26));
      const p = project(G.px, G.py, 4);
      burstAt(G.px, G.py, 4.2, 10, CYN, 0.7);
      pushRing(p.x, p.y, CYN, 140);
      screenFlash(CYN, 0.28);
      hitStop(0.045);
      kick(5.5);
      audio.shield();
      G.invuln = 0.38;
      if (G.shield <= 0) {
        G.shield = 0;
        toast('护盾耗尽', true, false);
      }
      hud();
      return;
    }
    playerDie(why);
  }

  function hitPort() {
    if (G.portHit || G.mode !== 'play') return;
    G.portHit = true;
    G.port = G.port || { x: 0, y: -0.42, z: 8 };
    const p = project(G.port.x, G.port.y, Math.max(4, G.port.z));
    burstAt(G.port.x, G.port.y, Math.max(4, G.port.z), 42, GOLD, 2.2);
    emit(REDUCE ? 16 : 48, {
      x: p.x, y: p.y, j: 28,
      vx0: -280, vx1: 280, vy0: -300, vy1: 120,
      r0: 2, r1: 9, life: 0.9, rgb: GOLD
    });
    pushRing(p.x, p.y, GOLD, 420);
    pushRing(p.x, p.y, CYN, 280);
    const timePts = (G.time * 80) | 0;
    noteCombo();
    const pts = ((5000 + timePts) * G.mult) | 0;
    bumpScore(pts);
    floatText(p.x, p.y - 24, '+' + (pts | 0), GOLD);
    hitStop(0.08);
    kick(12);
    screenFlash(WHT, 0.7);
    audio.portBoom();
    G.boomT = 1.35;
    G.ending = 'boom';
    toast('正中排热口', false, true);
    setHint('核心过载', 'hot');
  }

  function afterDeath(dt) {
    G.deadT -= dt;
    if (G.deadT > 0) return;
    G.lives -= 1;
    syncPips();
    hud();
    if (G.lives <= 0) {
      G.mode = 'lose';
      audio.lose();
      const why = G.why === '撞墙' ? '擦到沟壁。'
        : G.why === '梁柱' ? '撞上横梁。'
        : G.why === '塔' ? '擦到塔基。'
        : G.why === '相撞' ? '空中相撞。'
        : G.why === '错过' ? '没打进排热口。'
        : G.why === '超时' ? '时间耗尽。'
        : '被弹击中。';
      showOverlay('lose', '坠沟了', why + '分数 ' + G.score);
      setHint('R 再飞　顶栏重开不挡', 'warn');
      return;
    }
    G.px = 0;
    G.py = 0;
    G.vx = 0;
    G.vy = 0;
    G.shield = SHIELD;
    G.invuln = 1.45;
    G.deadT = 0;
    G.time = Math.max(G.time, 8);
    if (G.act === 'trench') {
      for (let i = 0; i < obs.length; i++) {
        if (obs[i].z < 18) obs[i].z += 22;
      }
      for (let i = 0; i < turrets.length; i++) {
        if (turrets[i].z < 18) turrets[i].z += 22;
      }
      if (G.port && G.port.z < 16) G.port.z += 18;
    }
    shots.length = 0;
    toast('重整', false, false);
    hud();
  }

  function finishWin() {
    G.mode = 'win';
    G.boomT = 0;
    audio.win();
    const lead = (isDeep() ? '深沟打穿。' : '三幕打穿。') + '分数 ' + G.score + '　再来一局？';
    showOverlay('win', '星核崩了', lead);
    setHint('R 再飞同一模式', 'hot');
  }

  function nextAct() {
    if (G.act === 'space') {
      G.act = 'towers';
      G.actDist = 0;
      G.transT = 0.55;
      G.spawnT = 0.4;
      seedTowers();
      toast('进入表面', false, true);
      audio.stage();
      audio.whoosh();
      screenFlash(GOLD, 0.22);
      setHint('打塔 · 别擦塔基 · 空格开火', 'hot');
    } else if (G.act === 'towers') {
      G.act = 'trench';
      G.actDist = 0;
      G.transT = 0.5;
      G.px = 0;
      G.py = 0;
      seedTrench();
      toast('俯冲星沟', false, true);
      audio.dive();
      audio.whoosh();
      screenFlash(FLM, 0.28);
      kick(4);
      setHint('躲梁柱炮台 · 尽头打进排热口', 'hot');
    }
    hud();
  }

  function updatePlayer(dt) {
    let ax = 0;
    let ay = 0;
    const limX = G.act === 'trench' ? trenchW() - 0.28 : 1.18;
    const limY = G.act === 'trench' ? 0.62 : 0.78;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover) && G.mode === 'play') {
      const tx = clamp((pointer.x - CX) / 240, -limX, limX);
      const ty = clamp((300 - pointer.y) / 160, -limY, limY);
      ax = (tx - G.px) * 3.6;
      ay = (ty - G.py) * 3.6;
    } else if (G.mode === 'play') {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay += 1;
      if (keys.d) ay -= 1;
    }
    if (G.mode === 'title') {
      G.px = Math.sin(G.t * 0.55) * 0.62;
      G.py = Math.cos(G.t * 0.38) * 0.32;
      G.bank = lerp(G.bank, Math.cos(G.t * 0.55) * 0.4, 0.12);
      return;
    }
    if (G.deadT > 0 || G.boomT > 0) {
      G.vx *= 0.88;
      G.vy *= 0.88;
      return;
    }
    const acc = G.act === 'trench' ? 11.2 : 9.4;
    G.vx += ax * acc * dt;
    G.vy += ay * acc * dt;
    G.vx *= Math.pow(0.12, dt);
    G.vy *= Math.pow(0.12, dt);
    const cap = 2.4;
    const sp = Math.hypot(G.vx, G.vy);
    if (sp > cap) {
      G.vx *= cap / sp;
      G.vy *= cap / sp;
    }
    G.px = clamp(G.px + G.vx * dt, -limX, limX);
    G.py = clamp(G.py + G.vy * dt, -limY, limY);
    G.bank = lerp(G.bank, clamp(G.vx * 0.4, -0.7, 0.7), 0.2);
  }

  function updateStars(dt) {
    const vz = G.spd * (G.act === 'space' ? 1.15 : 0.55);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.z -= vz * dt;
      if (s.z < 1.1) {
        s.z = rand(70, 96);
        s.x = rand(-2.6, 2.6);
        s.y = rand(-1.6, 1.6);
      }
    }
  }

  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      if (s.from === 'p') {
        if (s.z > 92) { shots.splice(i, 1); continue; }
        let hit = false;
        if (G.port && !G.portHit && s.z > G.port.z - 3 && s.z < G.port.z + 4 && G.port.z < 22) {
          const dx = s.x - G.port.x;
          const dy = s.y - G.port.y;
          const rad = s.torp ? 0.38 : 0.28;
          if (dx * dx + dy * dy < rad * rad) {
            hitPort();
            shots.splice(i, 1);
            continue;
          }
        }
        for (let k = ents.length - 1; k >= 0; k--) {
          const e = ents[k];
          if (e.dead) continue;
          const ez = e.z;
          if (Math.abs(ez - s.z) > (e.type === 'tower' ? 6 : 5)) continue;
          const ey = e.type === 'tower' ? e.y + e.h * 0.5 : e.y;
          const r = e.type === 'tower' ? 0.34 : 0.32;
          const dx = e.x - s.x;
          const dy = ey - s.y;
          const extraY = e.type === 'tower' ? 0.22 : 0;
          if (dx * dx + (dy * dy) * (extraY ? 0.45 : 1) < (r + extraY) * (r + extraY)) {
            e.hp -= 1;
            burstAt(s.x, s.y, s.z, 5, CYN, 0.4);
            if (e.hp <= 0) killEnt(e);
            else audio.hit(G.combo);
            hit = true;
            break;
          }
        }
        if (!hit) {
          for (let k = turrets.length - 1; k >= 0; k--) {
            const t = turrets[k];
            if (t.dead || t.hp <= 0) continue;
            if (Math.abs(t.z - s.z) > 5) continue;
            const tx = t.side * trenchW() * 0.72;
            const dx = tx - s.x;
            const dy = t.y - s.y;
            if (dx * dx + dy * dy < 0.28 * 0.28) {
              t.hp -= 1;
              burstAt(s.x, s.y, s.z, 5, FLM, 0.4);
              if (t.hp <= 0) killTurret(t);
              hit = true;
              break;
            }
          }
        }
        if (hit) shots.splice(i, 1);
      } else {
        if (s.z < 1.35) {
          const dx = s.x - G.px;
          const dy = s.y - G.py;
          if (dx * dx + dy * dy < 0.2 * 0.2) playerHit('被弹', false);
          shots.splice(i, 1);
        }
      }
    }
  }

  function updateEnts(dt) {
    const close = G.spd * 0.48 + (G.act === 'space' ? 12 : G.spd);
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i];
      if (e.dead) {
        ents.splice(i, 1);
        continue;
      }
      e.t = (e.t || 0) + dt;
      if (e.type === 'tie') {
        const wx = Math.sin(e.t * 1.7 + e.ph) * 0.48;
        const wy = Math.cos(e.t * 1.15 + e.ph) * 0.18;
        e.x = clamp(e.x + wx * dt, -1.25, 1.25);
        e.y = clamp(e.y + wy * dt, -0.7, 0.85);
        e.z -= close * dt;
        e.bank = lerp(e.bank || 0, wx * 0.35, 0.12);
        e.fire -= dt;
        if (e.fire <= 0 && e.z < 52 && e.z > 10 && playing()) {
          const aligned = Math.abs(e.x - G.px) < 0.95 && Math.abs(e.y - G.py) < 0.8;
          if (aligned && Math.random() < (isDeep() ? 0.55 : 0.38)) {
            fireBolt(e, false);
            e.fire = 0.85 + rand(0, 0.55);
          } else e.fire = 0.28;
        }
        if (playing() && e.z < 4.2) {
          const dx = e.x - G.px;
          const dy = e.y - G.py;
          if (dx * dx + dy * dy < 0.24 * 0.24) {
            playerHit('相撞', true);
            killEnt(e);
            continue;
          }
        }
        if (G.mode === 'title' && e.z < 12) {
          killEnt(e);
          continue;
        }
        if (e.z < 1.2) ents.splice(i, 1);
      } else if (e.type === 'tower') {
        e.z -= G.spd * dt;
        e.fire -= dt;
        if (e.fire <= 0 && e.z < 48 && e.z > 8 && playing()) {
          if (Math.abs(e.x - G.px) < 1.1) {
            fireBolt(e, false);
            e.fire = (isDeep() ? 0.9 : 1.35) + rand(0, 0.5);
          } else e.fire = 0.3;
        }
        if (playing() && e.z < 5.2 && e.z > 2.2) {
          const dx = Math.abs(e.x - G.px);
          const top = e.y + e.h;
          if (dx < 0.28 && G.py < top - 0.15) {
            playerHit('塔', true);
          }
        }
        if (e.z < 1.6) ents.splice(i, 1);
      }
    }
  }

  function updateTrenchStuff(dt) {
    if (G.act !== 'trench') return;
    const vz = G.spd;
    G.warn = 0;
    for (let i = obs.length - 1; i >= 0; i--) {
      const o = obs[i];
      o.z -= vz * dt;
      if (playing() && G.transT <= 0 && o.z < 7.4 && o.z > 2.6) {
        let crash = false;
        if (o.kind === 'L' && G.px < 0.12) crash = true;
        if (o.kind === 'R' && G.px > -0.12) crash = true;
        if (o.kind === 'U' && G.py > -0.08) crash = true;
        if (o.kind === 'D' && G.py < 0.08) crash = true;
        if (crash) {
          playerHit('梁柱', true);
          burstAt(G.px, G.py, 4, 16, GOLD, 1.1);
        }
      }
      if (playing() && G.transT <= 0 && o.z <= 2.6 && !o.scored) {
        o.scored = true;
        const pts = (50 * G.mult) | 0;
        bumpScore(pts);
        const p = project(0, 0, 5);
        floatText(p.x, p.y - 20, '+' + pts, GRN);
        audio.tick();
        kick(1.8);
      }
      if (o.z < 8 && o.z > 3 && !o.scored) {
        G.whooshT -= dt;
        if (G.whooshT <= 0) {
          G.whooshT = 0.42;
          audio.whoosh();
        }
      }
      if (o.z < 1.3) obs.splice(i, 1);
    }
    for (let i = turrets.length - 1; i >= 0; i--) {
      const t = turrets[i];
      t.z -= vz * dt;
      if (t.dead || t.hp <= 0) {
        if (t.z < 1.4) turrets.splice(i, 1);
        continue;
      }
      t.fire -= dt;
      if (t.fire <= 0 && t.z < 46 && t.z > 8 && playing()) {
        fireBolt(t, true);
        t.fire = (isDeep() ? 0.7 : 1.05) + rand(0, 0.4);
      }
      if (t.z < 1.4) turrets.splice(i, 1);
    }
    if (G.port && !G.portHit) {
      G.port.z -= vz * dt;
      if (!G.port.announced && G.port.z < 36) {
        G.port.announced = true;
        toast('排热口在前', false, true);
        audio.stage();
      }
      if (G.port.z < 22) G.warn = clamp((22 - G.port.z) / 20, 0, 1);
      if (playing() && G.port.z < 2.15) {
        playerHit('错过', true);
      }
    }
  }

  function maybeSpawn(dt) {
    if (G.mode === 'title') {
      G.spawnT -= dt;
      if (G.spawnT <= 0 && ents.length < 5) {
        G.spawnT = 1.3 + rand(0, 0.7);
        spawnTie(rand(-0.8, 0.8), rand(-0.2, 0.4), 88);
      }
      return;
    }
    if (!playing() || G.transT > 0) return;
    if (G.act === 'space') {
      G.spawnT -= dt;
      if (G.spawnT <= 0) {
        G.spawnT = (isDeep() ? 0.55 : 0.78) * rand(0.75, 1.2);
        spawnSpaceWave();
      }
    } else if (G.act === 'towers') {
      G.spawnT -= dt;
      if (G.spawnT <= 0 && G.actDist < actDef().len - 60) {
        G.spawnT = 0.85 + rand(0, 0.45);
        const side = Math.random() < 0.5 ? -1 : 1;
        spawnTower(side * rand(0.4, 1.15), 78 + rand(0, 16), rand(0.85, 2.1));
        if (Math.random() < 0.4) {
          spawnTower(-side * rand(0.5, 1.1), 86 + rand(0, 10), rand(0.7, 1.6));
        }
      }
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
      smears[i].life -= dt;
      smears[i].y += smears[i].v * dt;
      if (smears[i].life <= 0) smears.splice(i, 1);
    }
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.2);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    G.punch = lerp(G.punch, 1, 0.18);
    if (G.muzzle > 0) G.muzzle -= dt;
  }

  function update(dt) {
    G.t += dt;
    const wantH = G.act === 'trench' ? 186 : G.act === 'towers' ? 172 : 160;
    G.horizon = lerp(G.horizon, wantH, 0.08);

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt);
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') {
      G.spd = lerp(G.spd, 8, 0.04);
      G.dist += G.spd * dt;
      updateStars(dt);
      updateEnts(dt);
      updateFx(dt);
      audio.tickEngine(G.spd / 48, true);
      return;
    }

    if (G.boomT > 0) {
      G.boomT -= dt;
      G.spd = lerp(G.spd, 6, 0.05);
      updateStars(dt);
      updateFx(dt);
      if (G.t * 12 % 2 < 1) screenFlash(GOLD, 0.2);
      audio.tickEngine(0.2, true);
      if (G.boomT <= 0) finishWin();
      return;
    }

    updatePlayer(dt);
    const want = targetSpd();
    G.spd = lerp(G.spd, G.transT > 0 ? want * 1.35 : want, 0.07);
    G.dist += G.spd * dt;

    if (G.transT > 0) G.transT -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;

    if (G.mode === 'play' && G.deadT <= 0) {
      G.clock += dt;
      G.actDist += G.spd * dt;
      G.time -= dt;
      if (G.time <= 0) {
        G.time = 0;
        playerHit('超时', true);
      }
      G.scoreAcc += G.spd * 0.28 * dt;
      if (G.scoreAcc >= 1) {
        const n = G.scoreAcc | 0;
        G.scoreAcc -= n;
        G.score += n;
        maybeBest();
      }
    }

    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fireGun();

    maybeSpawn(dt);
    updateStars(dt);
    updateEnts(dt);
    updateTrenchStuff(dt);
    updateShots(dt);
    nearestAim();
    updateFx(dt);

    if (G.act === 'trench' && !REDUCE && Math.random() < 0.55) {
      smears.push({
        x: CX - G.px * 90 + rand(-40, 40),
        y: G.horizon + rand(8, 180),
        v: 380 + G.spd * 10,
        life: 0.16
      });
    }

    if (G.warn > 0.2 && playing() && G.port && G.port.z < 18) {
      G.warnBeep -= dt;
      if (G.warnBeep <= 0) {
        G.warnBeep = 0.28;
        audio.warn();
      }
    }

    if (G.deadT > 0) afterDeath(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.transT <= 0 && G.act !== 'trench') {
      if (G.actDist >= actDef().len) nextAct();
    }

    audio.tickEngine(clamp(G.spd / 50, 0, 1.25), G.mode === 'play' || G.mode === 'title');
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) hud();
  }

  function vline(x1, y1, x2, y2, rgb, a, w) {
    if (!isFinite(x1) || !isFinite(y1) || !isFinite(x2) || !isFinite(y2)) return;
    const lw = w || 1.25;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    if (!REDUCE) {
      ctx.strokeStyle = rgba(rgb, a * 0.22);
      ctx.lineWidth = lw * 3.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = lw;
    ctx.stroke();
  }

  function line3(x1, y1, z1, x2, y2, z2, rgb, a, w) {
    if (z1 < 0.8 && z2 < 0.8) return;
    const p = project(x1, y1, z1);
    const q = project(x2, y2, z2);
    vline(p.x, p.y, q.x, q.y, rgb, a, w);
  }

  function quad(x1, y1, x2, y2, x3, y3, x4, y4, rgb, a) {
    ctx.fillStyle = rgba(rgb, a == null ? 1 : a);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.lineTo(x4, y4);
    ctx.closePath();
    ctx.fill();
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const p = project(s.x, s.y, s.z);
      const len = G.act === 'trench' ? 2 + G.spd * 0.12 : 1.4 + G.spd * 0.08;
      const a = clamp(1.2 - s.z / 90, 0.15, 0.9);
      ctx.fillStyle = rgba(WHT, a);
      ctx.fillRect(p.x, p.y, 1.2, len);
    }
  }

  function drawHex(cx, cy, r, rot, rgb, a, w) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = rot + i * TAU / 6;
      const x = cx + Math.cos(ang) * r;
      const y = cy + Math.sin(ang) * r * 0.9;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    if (!REDUCE) {
      ctx.strokeStyle = rgba(rgb, a * 0.22);
      ctx.lineWidth = (w || 1.3) * 3;
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = w || 1.3;
    ctx.stroke();
  }

  function drawTie(e) {
    const p = project(e.x, e.y, e.z);
    const s = clamp(p.s * 0.11, 3, 46);
    const bank = e.bank || 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(bank * 0.35);
    const rgb = MAG;
    const a = clamp(1.1 - e.z / 110, 0.35, 1);
    drawHex(-s * 1.55, 0, s * 0.72, 0, rgb, a, 1.4);
    drawHex(s * 1.55, 0, s * 0.72, 0, rgb, a, 1.4);
    drawHex(0, 0, s * 0.32, TAU / 12, GOLD, a, 1.2);
    vline(-s * 0.9, 0, -s * 0.32, 0, rgb, a, 1.2);
    vline(s * 0.32, 0, s * 0.9, 0, rgb, a, 1.2);
    ctx.restore();
  }

  function drawTower(e) {
    const h = e.h;
    const hw = 0.16;
    const x = e.x;
    const y0 = e.y;
    const y1 = e.y + h;
    const z = e.z;
    const rgb = mix(GOLD, MAG, 0.25);
    const a = clamp(1.05 - z / 100, 0.3, 1);
    line3(x - hw, y0, z, x - hw, y1, z, rgb, a, 1.4);
    line3(x + hw, y0, z, x + hw, y1, z, rgb, a, 1.4);
    line3(x - hw, y1, z, x + hw, y1, z, rgb, a, 1.3);
    line3(x - hw, y0, z, x + hw, y0, z, rgb, a * 0.7, 1);
    const z2 = z + 0.22;
    line3(x - hw, y0, z2, x - hw, y1, z2, rgb, a * 0.7, 1);
    line3(x + hw, y0, z2, x + hw, y1, z2, rgb, a * 0.7, 1);
    line3(x - hw, y1, z, x - hw, y1, z2, rgb, a, 1);
    line3(x + hw, y1, z, x + hw, y1, z2, rgb, a, 1);
    line3(x - hw, y1, z2, x + hw, y1, z2, rgb, a, 1);
    const top = project(x, y1, z);
    ctx.fillStyle = rgba(FLM, 0.7 * a);
    ctx.beginPath();
    ctx.arc(top.x, top.y, clamp(top.s * 0.02, 1.2, 4), 0, TAU);
    ctx.fill();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    if (G.act === 'towers') {
      g.addColorStop(0, '#140c08');
      g.addColorStop(0.42, '#1a100c');
      g.addColorStop(1, '#0c0804');
    } else if (G.act === 'trench') {
      g.addColorStop(0, '#100804');
      g.addColorStop(0.5, '#0a0603');
      g.addColorStop(1, '#050301');
    } else {
      g.addColorStop(0, '#08060c');
      g.addColorStop(0.55, '#0a0804');
      g.addColorStop(1, '#050301');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawStation() {
    if (G.act !== 'space') return;
    const k = clamp(G.actDist / ACTS.space.len, 0, 1);
    if (k < 0.42 && G.mode === 'play') return;
    const grow = G.mode === 'title' ? 0.35 + Math.sin(G.t * 0.3) * 0.04 : clamp((k - 0.42) / 0.58, 0, 1);
    const r = 40 + grow * 210;
    const cx = CX + 80 - G.px * 20;
    const cy = G.horizon + 40 + grow * 30;
    ctx.strokeStyle = rgba(GOLD, 0.18 + grow * 0.35);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, cy - r * 0.08, r * 1.02, r * 0.12, 0, 0, TAU);
    ctx.stroke();
    vline(cx - r * 0.2, cy - r * 0.9, cx - r * 0.2, cy + r * 0.7, GOLD, 0.25 + grow * 0.3, 1);
  }

  function drawSurface() {
    const hor = G.horizon;
    const vpX = CX - G.px * 90;
    const rows = 22;
    for (let i = 0; i < rows; i++) {
      const t0 = i / rows;
      const t1 = (i + 1) / rows;
      const p0 = t0 * t0;
      const p1 = t1 * t1;
      const y0 = hor + (VH - hor) * p0;
      const y1 = hor + (VH - hor) * p1;
      const band = ((G.dist * 0.18 + i) | 0) & 1;
      ctx.fillStyle = rgba(band ? [28, 18, 10] : [18, 12, 8], 1);
      ctx.fillRect(0, y0, VW, Math.max(1, y1 - y0 + 1));
      const a = 0.12 + p1 * 0.35;
      vline(vpX - 18, y0,  -80, y1, GOLD, a * 0.45, 1);
      vline(vpX + 18, y0, VW + 80, y1, GOLD, a * 0.45, 1);
    }
    ctx.strokeStyle = rgba(GOLD, 0.22);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, hor);
    ctx.lineTo(VW, hor);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const h = hash2(i * 13 + 4);
      const x = ((i / 8) * VW + G.px * -18 + G.dist * 2) % (VW + 40) - 20;
      const r = 10 + h * 16;
      ctx.strokeStyle = rgba(GOLD, 0.16);
      ctx.beginPath();
      ctx.ellipse(x, hor + 8 + h * 6, r, r * 0.22, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawTrench() {
    const tw = trenchW();
    const far = 78;
    const near = 2.6;
    const floor = -0.95;
    const ceil = 0.78;
    const rgb = GOLD;
    const left = -tw;
    const right = tw;
    const nf = project(left, floor, near);
    const nfr = project(right, floor, near);
    const ff = project(left, floor, far);
    const ffr = project(right, floor, far);
    const nt = project(left, ceil, near);
    const ntr = project(right, ceil, near);
    const ft = project(left, ceil, far);
    const ftr = project(right, ceil, far);
    quad(nf.x, nf.y, nfr.x, nfr.y, ffr.x, ffr.y, ff.x, ff.y, [18, 12, 6], 0.92);
    quad(nf.x, nf.y, ff.x, ff.y, ft.x, ft.y, nt.x, nt.y, [14, 10, 6], 0.88);
    quad(nfr.x, nfr.y, ffr.x, ffr.y, ftr.x, ftr.y, ntr.x, ntr.y, [14, 10, 6], 0.88);

    line3(left, floor, near, left, floor, far, rgb, 0.85, 1.6);
    line3(right, floor, near, right, floor, far, rgb, 0.85, 1.6);
    line3(left, ceil, near, left, ceil, far, rgb, 0.7, 1.3);
    line3(right, ceil, near, right, ceil, far, rgb, 0.7, 1.3);
    line3(left, floor, near, left, ceil, near, rgb, 0.55, 1.2);
    line3(right, floor, near, right, ceil, near, rgb, 0.55, 1.2);

    const gap = 7;
    const off = G.dist % gap;
    for (let z = off + 2; z < far; z += gap) {
      const a = clamp(0.15 + (1 - z / far) * 0.7, 0.08, 0.85);
      line3(left, floor, z, right, floor, z, rgb, a * 0.55, 1);
      line3(left, floor, z, left, ceil, z, rgb, a, 1.15);
      line3(right, floor, z, right, ceil, z, rgb, a, 1.15);
      const mid = 0.08;
      line3(left, mid, z, left, mid, z + 1.2, rgb, a * 0.5, 1);
      line3(right, mid, z, right, mid, z + 1.2, rgb, a * 0.5, 1);
    }

    const vp = project(0, 0, far);
    ctx.fillStyle = rgba(FLM, 0.08);
    ctx.beginPath();
    ctx.arc(vp.x, vp.y, 28, 0, TAU);
    ctx.fill();
  }

  function drawBeam(o) {
    if (o.z < 1.6 || o.z > 74) return;
    const tw = trenchW();
    const rgb = mix(GOLD, MAG, 0.35);
    const a = clamp(1.1 - o.z / 80, 0.35, 1);
    const z = o.z;
    const z2 = z + 1.1;
    if (o.kind === 'L') {
      line3(-tw, -0.95, z, 0.08, -0.95, z, rgb, a, 2);
      line3(-tw, 0.78, z, 0.08, 0.78, z, rgb, a, 2);
      line3(0.08, -0.95, z, 0.08, 0.78, z, rgb, a, 2.2);
      line3(-tw, -0.95, z2, 0.08, -0.95, z2, rgb, a * 0.6, 1.2);
      line3(0.08, -0.95, z, 0.08, -0.95, z2, rgb, a, 1.4);
      line3(0.08, 0.78, z, 0.08, 0.78, z2, rgb, a, 1.4);
    } else if (o.kind === 'R') {
      line3(tw, -0.95, z, -0.08, -0.95, z, rgb, a, 2);
      line3(tw, 0.78, z, -0.08, 0.78, z, rgb, a, 2);
      line3(-0.08, -0.95, z, -0.08, 0.78, z, rgb, a, 2.2);
      line3(tw, -0.95, z2, -0.08, -0.95, z2, rgb, a * 0.6, 1.2);
      line3(-0.08, -0.95, z, -0.08, -0.95, z2, rgb, a, 1.4);
      line3(-0.08, 0.78, z, -0.08, 0.78, z2, rgb, a, 1.4);
    } else if (o.kind === 'U') {
      const y = 0.12;
      line3(-tw, y, z, tw, y, z, rgb, a, 2.2);
      line3(-tw, 0.78, z, tw, 0.78, z, rgb, a * 0.7, 1.3);
      line3(-tw, y, z, -tw, 0.78, z, rgb, a, 1.6);
      line3(tw, y, z, tw, 0.78, z, rgb, a, 1.6);
      line3(-tw, y, z2, tw, y, z2, rgb, a * 0.6, 1.3);
    } else {
      const y = -0.12;
      line3(-tw, y, z, tw, y, z, rgb, a, 2.2);
      line3(-tw, -0.95, z, tw, -0.95, z, rgb, a * 0.7, 1.3);
      line3(-tw, y, z, -tw, -0.95, z, rgb, a, 1.6);
      line3(tw, y, z, tw, -0.95, z, rgb, a, 1.6);
      line3(-tw, y, z2, tw, y, z2, rgb, a * 0.6, 1.3);
    }
  }

  function drawTurret(t) {
    if (t.dead || t.z < 1.6 || t.z > 74) return;
    const x = t.side * trenchW() * 0.78;
    const p = project(x, t.y, t.z);
    const s = clamp(p.s * 0.045, 2, 14);
    const rgb = MAG;
    const a = clamp(1.1 - t.z / 80, 0.4, 1);
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(p.x - s, p.y - s, s * 2, s * 2);
    ctx.fillStyle = rgba(FLM, 0.8 * a);
    ctx.beginPath();
    ctx.arc(p.x, p.y, s * 0.35, 0, TAU);
    ctx.fill();
    line3(x, t.y, t.z, x - t.side * 0.18, t.y, t.z, rgb, a, 1.2);
  }

  function drawPort() {
    if (!G.port || G.portHit) return;
    const e = G.port;
    if (e.z < 1.2 || e.z > 90) return;
    const hw = 0.16;
    const hh = 0.1;
    const rgb = CYN;
    const a = 0.55 + Math.sin(G.t * 12) * 0.25;
    line3(e.x - hw, e.y - hh, e.z, e.x + hw, e.y - hh, e.z, rgb, a, 2);
    line3(e.x + hw, e.y - hh, e.z, e.x + hw, e.y + hh, e.z, rgb, a, 2);
    line3(e.x + hw, e.y + hh, e.z, e.x - hw, e.y + hh, e.z, rgb, a, 2);
    line3(e.x - hw, e.y + hh, e.z, e.x - hw, e.y - hh, e.z, rgb, a, 2);
    const p = project(e.x, e.y, e.z);
    ctx.fillStyle = rgba(CYN, 0.18 + a * 0.25);
    ctx.beginPath();
    ctx.arc(p.x, p.y, clamp(p.s * 0.05, 3, 18), 0, TAU);
    ctx.fill();
    if (e.z < 24) {
      const sz = lerp(26, 10, clamp((24 - e.z) / 20, 0, 1));
      ctx.strokeStyle = rgba(GOLD, 0.55 + a * 0.4);
      ctx.lineWidth = 1.6;
      ctx.strokeRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = 'bold 11px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PORT', p.x, p.y - sz - 6);
    }
  }

  function drawShot(s) {
    const p = project(s.x, s.y, s.z);
    const q = project(s.x, s.y, s.z + (s.from === 'p' ? 2.4 : -2.2));
    const rgb = s.from === 'p' ? (s.torp ? GOLD : CYN) : MAG;
    vline(p.x, p.y, q.x, q.y, rgb, 0.95, s.torp ? 2.6 : 1.6);
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, s.torp ? 3.2 : 2, 0, TAU);
    ctx.fill();
  }

  function drawCockpit() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    const rgb = GOLD;
    vline(18, 18, 18, 52, rgb, 0.55, 1.4);
    vline(18, 18, 58, 18, rgb, 0.55, 1.4);
    vline(VW - 18, 18, VW - 18, 52, rgb, 0.55, 1.4);
    vline(VW - 18, 18, VW - 58, 18, rgb, 0.55, 1.4);
    vline(18, VH - 18, 18, VH - 58, rgb, 0.55, 1.4);
    vline(18, VH - 18, 58, VH - 18, rgb, 0.55, 1.4);
    vline(VW - 18, VH - 18, VW - 18, VH - 58, rgb, 0.55, 1.4);
    vline(VW - 18, VH - 18, VW - 58, VH - 18, rgb, 0.55, 1.4);

    const ch = 11;
    const cx = CX + G.bank * 6;
    const cy = 232 - G.py * 18;
    vline(cx - ch, cy, cx - 4, cy, CYN, 0.8, 1.3);
    vline(cx + 4, cy, cx + ch, cy, CYN, 0.8, 1.3);
    vline(cx, cy - ch, cx, cy - 4, CYN, 0.8, 1.3);
    vline(cx, cy + 4, cx, cy + ch, CYN, 0.8, 1.3);
    ctx.strokeStyle = rgba(CYN, 0.35);
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 22, cy - 16, 44, 32);

    const gunY = VH - 28;
    const g1 = 210 + G.bank * 10;
    const g2 = 590 + G.bank * 10;
    vline(g1 - 16, gunY + 16, g1, gunY - 8, GOLD, 0.85, 1.8);
    vline(g1 + 16, gunY + 16, g1, gunY - 8, GOLD, 0.85, 1.8);
    vline(g2 - 16, gunY + 16, g2, gunY - 8, GOLD, 0.85, 1.8);
    vline(g2 + 16, gunY + 16, g2, gunY - 8, GOLD, 0.85, 1.8);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(g1, gunY - 10, 6, 0, TAU);
      ctx.arc(g2, gunY - 10, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.55);
      ctx.beginPath();
      ctx.arc(g1, gunY - 18, 3, 0, TAU);
      ctx.arc(g2, gunY - 18, 3, 0, TAU);
      ctx.fill();
    }
  }

  function drawSmears() {
    if (REDUCE) return;
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      ctx.strokeStyle = rgba(WHT, clamp(s.life * 2.4, 0, 0.28));
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 16);
      ctx.lineTo(s.x, s.y + 26);
      ctx.stroke();
    }
  }

  function drawHudCanvas() {
    if (G.mode !== 'play') return;
    const len = G.act === 'trench' ? (G.trenchEnd || ACTS.trench.len) : actDef().len;
    const prog = clamp(G.actDist / len, 0, 1);
    ctx.fillStyle = rgba(WHT, 0.12);
    ctx.fillRect(CX - 80, 10, 160, 4);
    ctx.fillStyle = rgba(G.act === 'trench' ? GOLD : CYN, 0.85);
    ctx.fillRect(CX - 80, 10, 160 * prog, 4);
    if (G.port && G.port.z < 20 && !G.portHit) {
      const pulse = 0.12 + Math.sin(G.t * 14) * 0.08;
      ctx.fillStyle = rgba(GOLD, pulse);
      ctx.fillRect(0, 0, VW, 6);
      ctx.fillRect(0, VH - 6, VW, 6);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.font = 'bold 14px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('锁定排热口  FIRE', CX, 36);
    }
    if (G.transT > 0) {
      ctx.fillStyle = rgba(GOLD, G.transT * 0.25);
      ctx.fillRect(0, 0, VW, VH);
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
      ctx.strokeStyle = rgba(p.rgb, clamp(p.life * 4, 0, 1));
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, clamp(r.t * 1.6, 0, 0.8));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = clamp(f.t * 1.4, 0, 1);
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold 18px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawBoom() {
    if (G.boomT <= 0) return;
    const k = 1 - G.boomT / 1.35;
    const p = project(0, 0, 8);
    ctx.fillStyle = rgba(WHT, 0.18 + k * 0.35);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20 + k * 280, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.8 - k * 0.4);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 40 + k * 340, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(FLM, 0.6);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 18 + k * 180, 0, TAU);
    ctx.stroke();
  }

  function draw() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pw = stageEl ? stageEl.clientWidth : 800;
    const ph = stageEl ? stageEl.clientHeight : 450;
    if (pw !== W || ph !== H || canvas.width !== (pw * dpr | 0)) resize();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#050301';
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

    drawSky();
    if (G.act === 'towers') drawSurface();
    if (G.act === 'trench') drawTrench();
    if (G.act === 'space') drawStation();
    drawStars();
    drawSmears();

    const list = [];
    for (let i = 0; i < ents.length; i++) {
      if (!ents[i].dead) list.push({ z: ents[i].z, k: 'e', i: i });
    }
    for (let i = 0; i < obs.length; i++) list.push({ z: obs[i].z, k: 'o', i: i });
    for (let i = 0; i < turrets.length; i++) list.push({ z: turrets[i].z, k: 't', i: i });
    for (let i = 0; i < shots.length; i++) list.push({ z: shots[i].z, k: 's', i: i });
    if (G.port) list.push({ z: G.port.z, k: 'p', i: 0 });
    list.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (it.k === 'e') {
        const e = ents[it.i];
        if (e.type === 'tie') drawTie(e);
        else drawTower(e);
      } else if (it.k === 'o') drawBeam(obs[it.i]);
      else if (it.k === 't') drawTurret(turrets[it.i]);
      else if (it.k === 's') drawShot(shots[it.i]);
      else drawPort();
    }

    drawCockpit();
    drawParticles();
    drawBoom();
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
    G.kind = kind === 'deep' ? 'deep' : 'raid';
    G.act = isDeep() ? 'trench' : 'space';
    G.t = 0;
    G.clock = 0;
    G.dist = 0;
    G.actDist = 0;
    G.px = 0;
    G.py = 0;
    G.vx = 0;
    G.vy = 0;
    G.bank = 0;
    G.spd = isDeep() ? 42 : 22;
    G.horizon = isDeep() ? 186 : 160;
    G.score = 0;
    G.scoreAcc = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.shield = SHIELD;
    G.timeCap = isDeep() ? 45 : 99;
    G.time = G.timeCap;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.05;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.transT = isDeep() ? 0.4 : 0.15;
    G.whooshT = 0;
    G.portHit = false;
    G.port = null;
    G.boomT = 0;
    G.spawnT = 0.5;
    G.why = '';
    G.ending = '';
    G.warn = 0;
    G.runSeed = 1 + ((Math.random() * 999) | 0);
    clearField();
    seedStars();
    if (isDeep()) seedTrench();
    hideOverlay();
    hud();
    audio.start();
    if (isDeep()) {
      audio.dive();
      toast('深沟 · 更快更窄', false, true);
      setHint('躲梁柱 · 尽头打进排热口', 'hot');
    } else {
      toast('突袭 · 太空对战', false, true);
      setHint('打掉战机 · 再掠塔林 · 俯冲星沟', '');
    }
    if (scoreEl) scoreEl.textContent = '0';
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.act = 'space';
    G.lives = LIVES;
    G.shield = SHIELD;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.boomT = 0;
    G.score = 0;
    G.time = 99;
    G.px = 0;
    G.py = 0;
    G.spd = 24;
    G.horizon = 160;
    G.port = null;
    clearField();
    seedStars();
    showOverlay('title', '星沟', '太空对战，掠过塔林，俯冲星沟。打进排热口。');
    setHint('方向移动 · 空格开火 · 三幕打进排热口 · R 重开', '');
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
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

    if (down && (isMove || space || k === 'Enter')) e.preventDefault();

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
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('deep');
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
        fireGun();
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
      if (G.mode === 'play') fireGun();
      if (G.mode === 'title') startGame('raid');
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

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnDeep) {
    btnDeep.addEventListener('click', function () {
      audio.ensure();
      startGame('deep');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'raid');
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
      pointer.down = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
