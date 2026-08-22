'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const GROUND = 396;
  const BASE_X = 190;
  const PAD_W = 120;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const BEST_KEY = 'playbox-choplifter-best';
  const MUTE_KEY = 'playbox-choplifter-mute';
  const AUTO_SPEED_KEY = 'playbox-choplifter-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];
  const OPS = '方向 / WASD 飞 · 空格开火 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const HOT = [45, 255, 136];
  const GOLD = [255, 227, 107];
  const WHT = [232, 255, 244];
  const PNK = [255, 154, 212];
  const RED = [255, 72, 96];
  const OLIVE = [48, 120, 72];
  const SKY = [8, 28, 22];

  const SORTIES = [
    {
      name: '边哨',
      w: 2860,
      barracks: [1020, 1780],
      each: 8,
      tanks: [740, 1340, 2060],
      aa: [1500],
      hills: [
        { x: 620, w: 150, h: 70 },
        { x: 1400, w: 190, h: 108 },
        { x: 2300, w: 170, h: 86 }
      ]
    },
    {
      name: '荒原',
      w: 3480,
      barracks: [980, 1760, 2580],
      each: 8,
      tanks: [700, 1280, 1980, 2920],
      aa: [1460, 2240],
      hills: [
        { x: 560, w: 140, h: 64 },
        { x: 1360, w: 200, h: 118 },
        { x: 2140, w: 180, h: 96 },
        { x: 3100, w: 160, h: 88 }
      ]
    },
    {
      name: '前线',
      w: 4120,
      barracks: [920, 1680, 2480, 3380],
      each: 8,
      tanks: [640, 1220, 1880, 2680, 3640],
      aa: [1380, 2100, 3040],
      hills: [
        { x: 520, w: 140, h: 62 },
        { x: 1280, w: 210, h: 126 },
        { x: 2060, w: 190, h: 104 },
        { x: 2920, w: 200, h: 118 },
        { x: 3800, w: 160, h: 90 }
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
  const btnRescue = document.getElementById('btn-rescue');
  const btnFlak = document.getElementById('btn-flak');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const cargoEl = document.getElementById('cargo');
  const cargoBox = document.getElementById('cargo-box');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const saveLabel = document.getElementById('save-label');
  const lostLabel = document.getElementById('lost-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');

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
  const pointer = { down: false, hover: false, x: CX, y: 220, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const floats = [];
  const hostages = [];
  const tanks = [];
  const jets = [];
  const aas = [];
  const barracks = [];
  const hills = [];
  const trees = [];
  const shots = [];
  const eshots = [];
  const bombs = [];

  const G = {
    mode: 'title',
    kind: 'rescue',
    t: 0,
    clock: 0,
    stage: 1,
    worldW: 2860,
    hx: BASE_X,
    hy: GROUND - 14,
    vx: 0,
    vy: 0,
    face: 1,
    lastSide: 1,
    landed: true,
    rotor: 0,
    thr: 0,
    cargo: 0,
    cap: 8,
    score: 0,
    best: { r: 0, f: 0 },
    combo: 0,
    comboT: 0,
    mult: 1,
    lives: LIVES,
    nextLife: LIFE_EVERY,
    saved: 0,
    lost: 0,
    sortieSaved: 0,
    total: 16,
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    camX: BASE_X,
    jetT: 1.6,
    unloadT: 0,
    thumpT: 0,
    toastT: 0,
    why: '',
    ending: '',
    dustT: 0,
    demo: 0
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoStuck = 0;
  let autoLastX = BASE_X;
  let autoLastY = GROUND - 16;
  let autoLandX = BASE_X;
  let autoWait = 0;

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
  function isFlak() {
    return G.kind === 'flak';
  }
  function stageDef() {
    return SORTIES[clamp(G.stage - 1, 0, SORTIES.length - 1)];
  }
  function kindBest() {
    return isFlak() ? G.best.f : G.best.r;
  }
  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function capOf() {
    return isFlak() ? 6 : 8;
  }
  function sx(x) {
    return x - G.camX + CX;
  }
  function inView(x, pad) {
    const p = pad == null ? 80 : pad;
    const s = sx(x);
    return s > -p && s < VW + p;
  }

  function terrainY(x) {
    let y = GROUND;
    for (let i = 0; i < hills.length; i++) {
      const h = hills[i];
      const d = Math.abs(x - h.x);
      if (d < h.w) {
        const t = 1 - d / h.w;
        const rise = h.h * t * t * (1.15 - 0.15 * t);
        y = Math.min(y, GROUND - rise);
      }
    }
    return y;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    rot: null,
    rot2: null,
    rotG: null,
    rotF: null,
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
      this.startRotor();
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
    startRotor() {
      if (!this.ctx || this.rot) return;
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      const o2 = this.ctx.createOscillator();
      o2.type = 'triangle';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 420;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      o.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start();
      o2.start();
      this.rot = o;
      this.rot2 = o2;
      this.rotG = g;
      this.rotF = f;
    },
    tickRotor(on, thr) {
      if (!this.rotG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on) {
        this.rotG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const k = clamp(thr, 0, 1);
      const f = 34 + k * 48 + Math.sin(G.t * 52) * (1.6 + k * 4);
      this.rot.frequency.setTargetAtTime(f, t, 0.04);
      this.rot2.frequency.setTargetAtTime(f * 2.04, t, 0.04);
      this.rotF.frequency.setTargetAtTime(280 + k * 520, t, 0.08);
      this.rotG.gain.setTargetAtTime(this.muted ? 0 : (0.018 + k * 0.046), t, 0.05);
    },
    thump() {
      this.beep(72, 0.05, 'sine', 0.04, 48);
      this.noise(0.035, 0.028, 180);
    },
    gun() {
      this.noise(0.04, 0.04, 900);
      this.beep(880, 0.04, 'square', 0.036, 420);
    },
    hit(combo) {
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.034, 1100);
      this.beep(480 * lift, 0.07, 'square', 0.044, 820 * lift);
    },
    boom(big) {
      this.noise(big ? 0.2 : 0.1, big ? 0.09 : 0.055, big ? 180 : 420);
      this.beep(big ? 140 : 240, big ? 0.26 : 0.13, 'sawtooth', 0.058, 46);
    },
    land() {
      this.noise(0.06, 0.03, 240);
      this.beep(110, 0.08, 'sine', 0.04, 70);
    },
    board() {
      this.beep(660, 0.06, 'square', 0.04, 990);
      this.beep(990, 0.08, 'triangle', 0.03);
    },
    save() {
      this.beep(523, 0.07, 'square', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.045, 1046);
    },
    full() {
      this.beep(320, 0.08, 'square', 0.035, 180);
    },
    death() {
      this.noise(0.18, 0.08, 220);
      this.beep(240, 0.22, 'sawtooth', 0.06, 60);
      this.beep(110, 0.34, 'sine', 0.05, 40);
    },
    combo(m) {
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.11, 'triangle', 0.028, 1320);
    },
    start() {
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    win() {
      this.beep(523, 0.1, 'square', 0.05, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.26, 'sine', 0.055, 1318);
    },
    lose() {
      this.beep(220, 0.22, 'sawtooth', 0.05, 80);
      this.beep(140, 0.32, 'sine', 0.05, 46);
    },
    oneup() {
      this.beep(660, 0.08, 'square', 0.045, 880);
      this.beep(880, 0.12, 'triangle', 0.05, 1320);
    },
    stage() {
      this.beep(392, 0.09, 'square', 0.045, 523);
      this.beep(523, 0.11, 'triangle', 0.04, 659);
      this.beep(784, 0.2, 'square', 0.045, 1046);
    },
    warn() {
      this.beep(880, 0.07, 'square', 0.05);
      this.beep(540, 0.1, 'square', 0.04);
    }
  };

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }
  function saveAutoSpeed(n) {
    try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (err) { /* ignore */ }
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    if (autoOn && autoSpeed >= 4) return;
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
    }, 1200);
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
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
    }
    maybeBest();
    hud();
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: sx(x), y: y, text: text, rgb: rgb, t: 0.85 });
  }

  function emit(n, spec) {
    const count = (n * (REDUCE ? 0.42 : 1)) | 0;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.5, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
  }

  function burstAt(x, y, n, rgb, mag) {
    const m = mag || 1;
    emit(n, {
      x: sx(x), y: y, j: 8 * m,
      vx0: -160 * m, vx1: 160 * m,
      vy0: -200 * m, vy1: 90 * m,
      r0: 1.4, r1: 4.6 * m,
      life: 0.42 + 0.2 * m,
      rgb: rgb,
      g: 280
    });
    const sn = REDUCE ? 3 : 8;
    for (let i = 0; i < sn; i++) {
      sparks.push({
        x: sx(x), y: y,
        vx: rand(-240, 240) * m,
        vy: rand(-260, 90) * m,
        life: rand(0.12, 0.34),
        rgb: i & 1 ? WHT : rgb
      });
    }
  }

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.best.r = o.r | 0;
        G.best.f = o.f | 0;
      } else {
        G.best.r = parseInt(raw, 10) | 0;
      }
    } catch (err) { /* ignore */ }
  }
  function maybeBest() {
    const k = isFlak() ? 'f' : 'r';
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

  function remainingField() {
    let n = 0;
    for (let i = 0; i < hostages.length; i++) {
      const h = hostages[i];
      if (h.state === 'in' || h.state === 'run') n += 1;
    }
    return n;
  }

  function hud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(kindBest());
    if (cargoEl) cargoEl.textContent = G.cargo + '/' + G.cap;
    if (cargoBox) cargoBox.classList.toggle('full', G.cargo >= G.cap && G.cap > 0);
    const st = stageDef();
    if (stageLabel) {
      stageLabel.textContent = st.name;
      stageLabel.classList.toggle('hot', G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isFlak() ? '火网' : '救人';
      tagLabel.classList.toggle('warn', isFlak());
    }
    if (saveLabel) saveLabel.textContent = '救 ' + G.saved;
    if (lostLabel) {
      lostLabel.textContent = '亡 ' + G.lost;
      lostLabel.classList.toggle('warn', G.lost > 0);
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.combo + (G.mult > 1 ? '  ' + G.mult + '倍' : '');
      } else comboEl.hidden = true;
    }
    syncPips();
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
    if (ovKicker) ovKicker.textContent = kind === 'win' ? 'RESCUED' : kind === 'lose' ? 'DOWN' : 'CHOP';
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function noteCombo(pts, x, y, label, rgb) {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    } else G.mult = next;
    const n = Math.round(pts * G.mult);
    bumpScore(n);
    floatText(x, y, (label || '+' + n), rgb || GOLD);
    comboTok += 1;
  }

  function clearField() {
    hostages.length = 0;
    tanks.length = 0;
    jets.length = 0;
    aas.length = 0;
    barracks.length = 0;
    hills.length = 0;
    trees.length = 0;
    shots.length = 0;
    eshots.length = 0;
    bombs.length = 0;
    particles.length = 0;
    sparks.length = 0;
    floats.length = 0;
  }

  function seedWorld(demo) {
    const st = stageDef();
    G.worldW = demo ? 2200 : st.w;
    const hillSrc = demo ? st.hills.slice(0, 2) : st.hills;
    for (let i = 0; i < hillSrc.length; i++) {
      const h = hillSrc[i];
      hills.push({ x: h.x, w: h.w, h: h.h });
    }
    if (isFlak() && !demo) {
      hills.push({ x: st.w * 0.42, w: 150, h: 90 });
    }
    const bxs = demo ? [st.barracks[0]] : st.barracks;
    const each = st.each;
    G.total = 0;
    for (let i = 0; i < bxs.length; i++) {
      const x = bxs[i];
      barracks.push({ x: x, hp: 4, max: 4, dead: false, w: 54, h: 36 });
      for (let k = 0; k < each; k++) {
        hostages.push({
          x: x + rand(-10, 10),
          y: GROUND - 8,
          vx: 0,
          state: demo && k < 4 ? 'run' : 'in',
          wait: rand(0, 0.4),
          wave: rand(0, TAU),
          frame: rand(0, 4)
        });
        G.total += 1;
      }
    }
    const txs = demo ? [st.tanks[0]] : st.tanks.slice();
    if (isFlak() && !demo && st.tanks.length) txs.push(st.tanks[0] + 220);
    for (let i = 0; i < txs.length; i++) {
      const x = txs[i];
      tanks.push({
        x: x,
        y: GROUND - 12,
        vx: (i & 1) ? 36 : -36,
        hp: isFlak() ? 4 : 3,
        fireCd: rand(0.4, 1.4),
        dir: (i & 1) ? 1 : -1,
        zone: x,
        span: 160
      });
    }
    const axs = demo ? [] : st.aa.slice();
    if (isFlak() && !demo) {
      for (let i = 0; i < st.barracks.length; i++) axs.push(st.barracks[i] - 90);
    }
    for (let i = 0; i < axs.length; i++) {
      aas.push({
        x: axs[i],
        y: GROUND - 10,
        hp: isFlak() ? 4 : 3,
        fireCd: rand(0.3, 1.1),
        ang: -1.2
      });
    }
    const tw = G.worldW;
    for (let i = 0; i < 28; i++) {
      const x = 80 + hash2(i * 19 + 3) * (tw - 160);
      if (terrainY(x) < GROUND - 18) continue;
      if (Math.abs(x - BASE_X) < 140) continue;
      trees.push({
        x: x,
        h: 18 + hash2(i * 7) * 22,
        w: 7 + hash2(i * 11) * 5,
        kind: hash2(i * 13) > 0.55 ? 1 : 0
      });
    }
  }

  function spawnJet() {
    const fromL = Math.random() < 0.5;
    const y = 70 + Math.random() * 140;
    jets.push({
      x: fromL ? G.camX - 460 : G.camX + 460,
      y: y,
      vx: fromL ? rand(170, 230) : -rand(170, 230),
      hp: 2,
      fireCd: rand(0.2, 0.6),
      bomb: isFlak() && Math.random() < 0.55
    });
  }

  function fireGun() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    const dir = G.face === 0 ? G.lastSide : G.face;
    const nose = dir * (G.face === 0 ? 10 : 22);
    shots.push({
      x: G.hx + nose,
      y: G.hy + 2,
      vx: dir * 560,
      vy: G.vy * 0.12 + 36,
      life: 0.9
    });
    G.fireCd = 0.11;
    G.muzzle = 0.06;
    audio.gun();
  }

  function killHostage(h, why) {
    if (h.state === 'dead' || h.state === 'saved' || h.state === 'aboard') return;
    h.state = 'dead';
    G.lost += 1;
    burstAt(h.x, h.y, 8, PNK, 0.55);
    floatText(h.x, h.y - 10, '亡', MAG);
    audio.warn();
    hud();
    if (why) { /* reserved */ }
  }

  function boardHostage(h) {
    h.state = 'aboard';
    G.cargo += 1;
    audio.board();
    noteCombo(40, h.x, h.y - 16, '上机', CYN);
    burstAt(h.x, h.y, 6, HOT, 0.4);
    if (G.cargo >= G.cap) {
      toast('已满员 · 回基地', false, true);
      audio.full();
    }
    hud();
  }

  function unloadOne() {
    if (G.cargo <= 0) return;
    let h = null;
    for (let i = 0; i < hostages.length; i++) {
      if (hostages[i].state === 'aboard') {
        h = hostages[i];
        break;
      }
    }
    if (!h) {
      G.cargo = 0;
      return;
    }
    h.state = 'saved';
    h.x = G.hx - 18 - Math.random() * 10;
    h.y = GROUND - 8;
    h.vx = -70;
    h.wait = 1.6;
    G.cargo -= 1;
    G.saved += 1;
    G.sortieSaved += 1;
    noteCombo(150, G.hx, G.hy - 18, '送达', GOLD);
    audio.save();
    hud();
  }

  function crash(why) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.invuln > 0 && why !== '降落太猛' && why !== '撞上山脊') return;
    G.why = why || '坠机';
    G.deadT = 1.35;
    G.landed = false;
    burstAt(G.hx, G.hy, 28, MAG, 1.6);
    burstAt(G.hx, G.hy, 14, GOLD, 1.1);
    screenFlash(MAG, 0.55);
    hitStop(0.078);
    kick(10);
    audio.death();
    const lostCargo = G.cargo;
    if (lostCargo > 0) {
      G.lost += lostCargo;
      G.cargo = 0;
      for (let i = 0; i < hostages.length; i++) {
        if (hostages[i].state === 'aboard') hostages[i].state = 'gone';
      }
      toast('舱内人质遇难 +' + lostCargo, true, false);
    }
    G.lives -= 1;
    G.combo = 0;
    G.mult = 1;
    hud();
    if (G.lives <= 0) {
      G.deadT = 0.85;
    }
  }

  function respawn() {
    if (G.lives <= 0) {
      endGame(false);
      return;
    }
    G.hx = BASE_X;
    G.hy = GROUND - 16;
    G.vx = 0;
    G.vy = 0;
    G.landed = true;
    G.face = 0;
    G.invuln = 1.7;
    G.deadT = 0;
    G.camX = BASE_X;
    toast('再升一架', false, true);
  }

  function endGame(win) {
    G.mode = win ? 'win' : 'lose';
    maybeBest();
    const rec = G.score >= kindBest() && G.score > 0;
    const recTxt = rec ? ' 新纪录。' : '';
    if (win) {
      const all = G.saved + G.lost;
      const lead = '救出 ' + G.saved + ' / ' + all + '。' + (G.lost === 0 ? '无一阵亡。' : '亡 ' + G.lost + '。') + recTxt;
      showOverlay('win', G.lost === 0 ? '全员归营' : '营救完成', lead);
      audio.win();
      setHint(autoOn ? '自动仍开着 · 即将再飞 · A 停下' : 'R 再飞 · 换模式回标题', 'hot');
    } else {
      const why = G.why || '坠机了';
      const lead = why + '。救出 ' + G.saved + '，亡 ' + G.lost + '。' + recTxt + ' R 立刻再飞。';
      showOverlay('lose', G.why === '人质全灭' ? '人质全灭' : '坠机了', lead);
      audio.lose();
      setHint(autoOn ? '自动仍开着 · 即将再飞 · A 停下' : 'R 重开 · 空格再飞', 'warn');
    }
    hud();
  }

  function checkSortieEnd() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const field = remainingField();
    if (field > 0 || G.cargo > 0) return;
    const inB = barracks.some(function (b) { return !b.dead; });
    if (inB) return;
    if (G.sortieSaved <= 0) {
      G.why = '人质全灭';
      endGame(false);
      return;
    }
    const bonus = 1200 + G.sortieSaved * 40 + G.lives * 200;
    bumpScore(bonus);
    if (G.stage >= SORTIES.length) {
      bumpScore(isFlak() ? 5000 : 3500);
      endGame(true);
      return;
    }
    G.stage += 1;
    toast(stageDef().name + ' · 下一营', false, true);
    audio.stage();
    const keepScore = G.score;
    const keepLives = G.lives;
    const keepSaved = G.saved;
    const keepLost = G.lost;
    const keepCombo = G.combo;
    const keepMult = G.mult;
    clearField();
    G.cargo = 0;
    G.sortieSaved = 0;
    seedWorld(false);
    G.hx = BASE_X;
    G.hy = GROUND - 16;
    G.vx = 0;
    G.vy = 0;
    G.landed = true;
    G.invuln = 1.1;
    G.camX = BASE_X;
    G.score = keepScore;
    G.lives = keepLives;
    G.saved = keepSaved;
    G.lost = keepLost;
    G.combo = keepCombo;
    G.mult = keepMult;
    G.jetT = 1.4;
    hud();
    setHint(autoOn ? '托管中 · 救人回营 · A 停下' : '降落接人 · 满员回营 · 空格开火', autoOn ? 'hot' : '');
  }

  function autoClearInput() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    pointer.down = false;
    G.fireHold = false;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl) return;
    speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function autoPlayHint() {
    if (autoOn) {
      if (G.mode === 'play') setHint('托管中 · 救人回营 · A 停下', 'hot');
      else if (G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下', 'hot');
      else setHint('自动仍开着 · 即将再飞 · A 停下', G.mode === 'win' ? 'hot' : 'warn');
    }
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoStuck = 0;
    autoWait = 0;
    autoClearInput();
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      autoPlayHint();
      if (G.mode === 'title') startGame('rescue');
    } else if (G.mode === 'play') {
      setHint('飞向营房开火 · 降落接人 · 送回基地 H 坪', '');
    } else if (G.mode === 'title') {
      setHint('方向飞 · 空格开火 · 降落接人 · 送回基地 · A 自动', '');
    } else {
      setHint(G.mode === 'win' ? 'R 再飞 · 换模式回标题' : 'R 重开 · 空格再飞', G.mode === 'win' ? 'hot' : 'warn');
    }
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame('rescue');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'rescue');
      }
    }
  }

  function peakAhead(dir, dist) {
    let peak = GROUND;
    const step = 18;
    for (let d = 0; d <= dist; d += step) {
      const y = terrainY(G.hx + dir * d);
      if (y < peak) peak = y;
    }
    return peak;
  }

  function isFlat(x) {
    return terrainY(x) >= GROUND - 6
      && terrainY(x - 18) >= GROUND - 10
      && terrainY(x + 18) >= GROUND - 10;
  }

  function tankAt(x, rad) {
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      if (t.hp > 0 && Math.abs(t.x - x) < rad) return t;
    }
    return null;
  }

  function pickLandX(preferX) {
    let best = preferX;
    let bestS = 1e9;
    const padL = BASE_X - PAD_W * 0.5;
    const padR = BASE_X + PAD_W * 0.5;
    for (let d = 0; d <= 260; d += 10) {
      for (let s = -1; s <= 1; s += 2) {
        const x = preferX + s * d;
        if (x < 60 || x > G.worldW - 60) continue;
        if (x > padL - 8 && x < padR + 8 && Math.abs(preferX - BASE_X) > 80) continue;
        if (!isFlat(x)) continue;
        if (tankAt(x, 36)) continue;
        const sScore = Math.abs(x - preferX) + (tankAt(x, 70) ? 50 : 0);
        if (sScore < bestS) {
          bestS = sScore;
          best = x;
        }
      }
      if (bestS < 16) break;
    }
    return clamp(best, 60, G.worldW - 60);
  }

  function hostageInLane(dir, reach) {
    const lim = reach == null ? 240 : reach;
    for (let i = 0; i < hostages.length; i++) {
      const h = hostages[i];
      if (h.state !== 'run') continue;
      const dx = h.x - G.hx;
      if (dx * dir <= 10) continue;
      if (Math.abs(dx) > lim) continue;
      if (G.hy > GROUND - 92) return true;
    }
    return false;
  }

  function liveNearest(arr, hpKey) {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < arr.length; i++) {
      const o = arr[i];
      if (hpKey && o[hpKey] <= 0) continue;
      if (!hpKey && o.dead) continue;
      const d = Math.abs(o.x - G.hx);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  function nearestRunner() {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < hostages.length; i++) {
      const h = hostages[i];
      if (h.state !== 'run') continue;
      const d = Math.abs(h.x - G.hx) + Math.abs(h.x - autoLandX) * 0.15;
      if (d < bestD) {
        bestD = d;
        best = h;
      }
    }
    return best;
  }

  function barracksPeople(b) {
    for (let i = 0; i < hostages.length; i++) {
      const h = hostages[i];
      if (h.state === 'in' && Math.abs(h.x - b.x) < 48) return true;
    }
    return false;
  }

  function faceToward(x) {
    const dir = x >= G.hx ? 1 : -1;
    if (G.face === dir || G.lastSide === dir) return dir;
    if (dir > 0) {
      keys.r = true;
      keys.l = false;
    } else {
      keys.l = true;
      keys.r = false;
    }
    return 0;
  }

  function wantShoot(tx, ty, ground) {
    const dir = tx >= G.hx ? 1 : -1;
    const dx = Math.abs(tx - G.hx);
    const dy = Math.abs((ty == null ? GROUND - 16 : ty) - G.hy);
    if (dx < 28 || dx > 430) return false;
    if (ground && (G.hy < 268 || G.hy > GROUND - 16)) return false;
    if (ground && dy > 160) return false;
    if (!ground && dy > 48) return false;
    if (ground && hostageInLane(dir, dx + 20)) return false;
    if (!faceToward(tx)) return false;
    return true;
  }

  function autoSteer(tx, ty, land) {
    const dx = tx - G.hx;
    const dir = dx > 8 ? 1 : dx < -8 ? -1 : (G.vx > 12 ? 1 : G.vx < -12 ? -1 : G.lastSide || 1);
    const peak = peakAhead(dir, land ? 70 : 160);
    const attack = !land && ty >= 280 && Math.abs(dx) < 250;
    const clearY = peak - (attack ? 42 : (isFlak() ? 86 : 72));
    let wantY = ty;
    if (!land) {
      wantY = Math.min(ty, clearY);
    } else {
      if (Math.abs(dx) > 58 || terrainY(G.hx) < GROUND - 16 || peak < GROUND - 18) {
        wantY = Math.min(clearY, isFlak() ? 170 : 200);
      } else {
        wantY = Math.max(ty, terrainY(tx) - 14);
      }
    }

    if (G.landed) {
      if (!land || Math.abs(dx) > 28) keys.u = true;
      return;
    }

    if (G.hy > clearY + 8) {
      keys.u = true;
      if (Math.abs(dx) > 90 && G.hy > peak - 40) {
        /* climb first over the ridge */
        return;
      }
    }

    if (land && Math.abs(dx) < 80) {
      if (G.vx > 42) keys.l = true;
      else if (G.vx < -42) keys.r = true;
      else if (dx > 16) keys.r = true;
      else if (dx < -16) keys.l = true;
    } else {
      if (dx > 22) {
        if (G.vx > 110 && dx < 150) keys.l = true;
        else keys.r = true;
      } else if (dx < -22) {
        if (G.vx < -110 && dx > -150) keys.r = true;
        else keys.l = true;
      } else {
        if (G.vx > 28) keys.l = true;
        else if (G.vx < -28) keys.r = true;
      }
    }

    const gNow = terrainY(G.hx);
    if (land) {
      if (G.vy > 48) keys.u = true;
      if (G.hy > gNow - 36 && G.vy > 28) keys.u = true;
      if (G.hy > wantY + 12 && G.vy < 40 && Math.abs(dx) < 50) {
        /* allow descent */
      } else if (G.hy > wantY + 8) {
        keys.u = true;
      }
      if (Math.abs(G.vx) > 70 && G.hy > gNow - 50) keys.u = true;
    } else {
      if (G.hy > wantY + 10 || G.vy > 26) keys.u = true;
      else if (G.hy < wantY - 28 && G.vy < 40) keys.d = true;
    }
  }

  function autoDodge() {
    let threat = null;
    let threatT = 0.62;
    for (let i = 0; i < eshots.length; i++) {
      const s = eshots[i];
      const dx = G.hx - s.x;
      const dy = G.hy - s.y;
      const d = Math.hypot(dx, dy);
      if (d > 170) continue;
      const nd = Math.hypot(dx - s.vx * 0.12, dy - s.vy * 0.12);
      if (nd >= d - 1) continue;
      const sp = Math.hypot(s.vx, s.vy) || 1;
      const t = d / sp;
      if (t < threatT) {
        threatT = t;
        threat = s;
      }
    }
    for (let i = 0; i < bombs.length; i++) {
      const b = bombs[i];
      const dx = G.hx - b.x;
      const dy = G.hy - b.y;
      const d = Math.hypot(dx, dy);
      if (d < 90 && d < 140) {
        if (!threat || d < 70) threat = b;
      }
    }
    for (let i = 0; i < jets.length; i++) {
      const j = jets[i];
      if (j.hp <= 0) continue;
      if (Math.abs(j.x - G.hx) < 70 && Math.abs(j.y - G.hy) < 28) {
        threat = threat || j;
        keys.u = true;
        if (j.y <= G.hy) keys.d = false;
      }
    }
    const tk = tankAt(G.hx, 40);
    if (tk && G.hy > GROUND - 50) {
      keys.u = true;
      return true;
    }
    if (!threat) return false;
    keys.u = true;
    if (threat.x >= G.hx) keys.l = true;
    else keys.r = true;
    if (G.hy < 70) {
      keys.u = false;
      keys.d = true;
    }
    return true;
  }

  function autoCombat() {
    let jet = null;
    let jetD = 1e9;
    for (let i = 0; i < jets.length; i++) {
      const j = jets[i];
      if (j.hp <= 0) continue;
      const d = Math.abs(j.x - G.hx) + Math.abs(j.y - G.hy) * 0.45;
      if (d < jetD) {
        jetD = d;
        jet = j;
      }
    }
    if (jet && Math.abs(jet.y - G.hy) < 42 && Math.abs(jet.x - G.hx) < 320) {
      if (wantShoot(jet.x, jet.y, false)) G.fireHold = true;
      return jet;
    }
    const aa = liveNearest(aas, 'hp');
    if (aa && Math.abs(aa.x - G.hx) < 280 && G.hy < GROUND - 40) {
      if (wantShoot(aa.x, aa.y, true)) G.fireHold = true;
    }
    const tank = liveNearest(tanks, 'hp');
    if (tank && Math.abs(tank.x - G.hx) < 260 && G.hy < GROUND - 30) {
      if (wantShoot(tank.x, tank.y, true)) G.fireHold = true;
    }
    return null;
  }

  function autoThink() {
    autoClearInput();
    if (G.mode !== 'play' || G.deadT > 0) return;

    const moved = Math.hypot(G.hx - autoLastX, G.hy - autoLastY);
    if (moved < 7 && !G.landed) autoStuck += STEP;
    else autoStuck = 0;
    autoLastX = G.hx;
    autoLastY = G.hy;
    if (autoStuck > 2.2) {
      keys.u = true;
      if (G.hx > BASE_X + 280) keys.l = true;
      else keys.r = true;
      return;
    }

    const field = remainingField();
    const onPad = G.landed && Math.abs(G.hx - BASE_X) < PAD_W * 0.48 && terrainY(G.hx) >= GROUND - 4;
    const runner = nearestRunner();
    const bar = liveNearest(barracks, null);

    function standoffSide(x) {
      if (G.hx <= x - 24) return -1;
      if (G.hx >= x + 24) return 1;
      return G.lastSide >= 0 ? -1 : 1;
    }

    let goal = 'fly';
    let tx = autoLandX;
    let ty = isFlak() ? 168 : 200;
    let land = false;
    let prey = null;

    if (onPad && G.cargo > 0) {
      goal = 'unload';
    } else if (G.cargo >= G.cap || (G.cargo > 0 && field <= 0)) {
      goal = 'return';
      tx = BASE_X;
      ty = GROUND - 12;
      land = true;
    } else if (runner && G.cargo < G.cap && (Math.abs(runner.x - G.hx) < 520 || G.landed)) {
      goal = 'pickup';
      autoLandX = pickLandX(runner.x);
      tx = autoLandX;
      ty = GROUND - 12;
      prey = tankAt(autoLandX, 52) || tankAt(G.hx, 42);
      if (!prey) {
        const aa = liveNearest(aas, 'hp');
        if (aa && Math.abs(aa.x - autoLandX) < 90) prey = aa;
      }
      land = !prey;
    } else if (bar) {
      goal = 'crack';
      const side = standoffSide(bar.x);
      const close = Math.abs(G.hx - bar.x) < 300;
      tx = bar.x + side * (close ? 128 : 200);
      ty = close ? 336 : 220;
      land = false;
      autoLandX = pickLandX(bar.x + (side > 0 ? 40 : -40));
    } else if (G.cargo > 0) {
      goal = 'return';
      tx = BASE_X;
      ty = GROUND - 12;
      land = true;
    } else {
      const tank = liveNearest(tanks, 'hp');
      const aa = liveNearest(aas, 'hp');
      prey = tank && (!aa || Math.abs(tank.x - G.hx) <= Math.abs(aa.x - G.hx)) ? tank : aa;
      if (prey) {
        goal = 'hunt';
        const side = standoffSide(prey.x);
        tx = prey.x + side * 120;
        ty = 348;
      } else {
        goal = 'return';
        tx = BASE_X;
        ty = GROUND - 12;
        land = true;
      }
    }

    if (goal === 'unload') {
      autoCombat();
      return;
    }

    if (goal === 'pickup' && prey && !G.landed) {
      const side = standoffSide(prey.x);
      autoSteer(prey.x + side * 120, 348, false);
      if (wantShoot(prey.x, prey.y, true)) G.fireHold = true;
      autoCombat();
      autoDodge();
      return;
    }

    autoSteer(tx, ty, land);

    if (goal === 'crack' && bar) {
      if (wantShoot(bar.x, GROUND - 20, true)) G.fireHold = true;
    } else if (goal === 'hunt' && prey) {
      if (wantShoot(prey.x, prey.y, true)) G.fireHold = true;
    }

    if (goal === 'pickup' && G.landed && Math.abs(G.hx - autoLandX) < 40) {
      autoClearInput();
      autoWait += STEP;
      if (autoWait > 2.8 && !runner) keys.u = true;
    } else if (goal === 'return' && onPad) {
      autoClearInput();
    } else {
      autoWait = 0;
    }

    autoCombat();
    const settling = land && Math.abs(G.hx - tx) < 55 && G.hy > terrainY(G.hx) - 62;
    if (!settling && !(G.landed && (goal === 'pickup' || goal === 'return'))) autoDodge();
  }

  function wishDir() {
    let l = keys.l;
    let r = keys.r;
    let u = keys.u;
    let d = keys.d;
    if (!autoOn && inputSrc === 'ptr' && pointer.down) {
      const px = pointer.x;
      const py = pointer.y;
      const hx = sx(G.hx);
      if (px < hx - 18) l = true;
      if (px > hx + 18) r = true;
      if (py < G.hy - 16) u = true;
      if (py > G.hy + 16) d = true;
    }
    return { l: l, r: r, u: u, d: d };
  }

  function updateHeli(dt) {
    const w = wishDir();
    let ax = 0;
    let ay = 0;
    if (w.l) ax -= 1;
    if (w.r) ax += 1;
    if (w.u) ay -= 1;
    if (w.d) ay += 1;
    const wantThr = w.u || Math.abs(ax) > 0 || (!G.landed && !w.d);
    G.thr = lerp(G.thr, wantThr ? (w.u ? 1 : 0.55) : (G.landed ? 0.22 : 0.4), 0.18);

    if (G.landed) {
      G.vx *= Math.pow(0.12, dt * 4);
      G.vy = 0;
      if (w.u) {
        G.landed = false;
        G.vy = -70;
      }
    } else {
      G.vx += ax * 420 * dt;
      if (w.u) G.vy -= 520 * dt;
      else G.vy += 240 * dt;
      if (w.d) G.vy += 180 * dt;
      G.vx *= Math.pow(0.42, dt * 3.2);
      G.vy *= Math.pow(0.62, dt * 2.4);
      G.vx = clamp(G.vx, -260, 260);
      G.vy = clamp(G.vy, -210, 240);
    }

    G.hx += G.vx * dt;
    G.hy += G.vy * dt;
    G.hx = clamp(G.hx, 36, G.worldW - 36);
    G.hy = clamp(G.hy, 28, GROUND - 6);

    if (Math.abs(G.vx) > 38) {
      G.face = G.vx > 0 ? 1 : -1;
      G.lastSide = G.face;
    } else if (G.landed || Math.abs(G.vx) < 16) {
      G.face = 0;
    }

    const gY = terrainY(G.hx);
    const skid = G.hy + 10;
    if (skid >= gY) {
      G.hy = gY - 10;
      const steep = gY < GROUND - 20;
      const tooFast = G.vy > 88 || Math.abs(G.vx) > 96;
      if (!G.landed && (steep || tooFast)) {
        crash(steep ? '撞上山脊' : '降落太猛');
        return;
      }
      if (!G.landed) {
        G.landed = true;
        G.vy = 0;
        G.vx *= 0.2;
        audio.land();
        emit(REDUCE ? 4 : 10, {
          x: sx(G.hx), y: gY, j: 12,
          vx0: -50, vx1: 50, vy0: -40, vy1: -8,
          r0: 1.2, r1: 3.2, life: 0.32, rgb: [160, 190, 140], g: 40
        });
        kick(2.2);
      } else {
        G.vy = 0;
      }
    }

    const onPad = G.landed && Math.abs(G.hx - BASE_X) < PAD_W * 0.5 && terrainY(G.hx) >= GROUND - 4;
    if (onPad && G.cargo > 0) {
      G.unloadT -= dt;
      if (G.unloadT <= 0) {
        G.unloadT = 0.16;
        unloadOne();
      }
    } else G.unloadT = 0.05;

    G.rotor += (14 + G.thr * 22) * dt;
    G.invuln = Math.max(0, G.invuln - dt);
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.muzzle = Math.max(0, G.muzzle - dt);

    G.thumpT -= dt;
    if (G.thumpT <= 0) {
      G.thumpT = 0.09 - G.thr * 0.032;
      if (G.mode === 'play' || G.mode === 'title') audio.thump();
    }

    if (G.hy > gY - 36 && !G.landed) {
      G.dustT -= dt;
      if (G.dustT <= 0) {
        G.dustT = 0.05;
        emit(2, {
          x: sx(G.hx), y: gY - 2, j: 10,
          vx0: -30, vx1: 30, vy0: -24, vy1: -4,
          r0: 1, r1: 2.6, life: 0.22, rgb: [140, 170, 120], g: 20
        });
      }
    }

    if (G.fireHold) fireGun();

    G.camX = lerp(G.camX, clamp(G.hx + G.lastSide * 70, CX, Math.max(CX, G.worldW - CX)), 0.12);
  }

  function updateHostages(dt) {
    for (let i = 0; i < hostages.length; i++) {
      const h = hostages[i];
      h.wave += dt * 8;
      h.frame += dt * 10;
      if (h.state === 'in' || h.state === 'dead') continue;
      if (h.state === 'saved') {
        h.x += h.vx * dt;
        h.wait -= dt;
        if (h.wait <= 0 || h.x < 40) h.state = 'gone';
        continue;
      }
      if (h.state !== 'run') continue;
      h.wait -= dt;
      const canBoard = G.landed && G.deadT <= 0 && G.cargo < G.cap && G.mode === 'play';
      const near = Math.abs(h.x - G.hx) < 260;
      if (canBoard && near) {
        h.vx = h.x < G.hx ? 78 : -78;
        if (Math.abs(h.x - G.hx) < 22 && Math.abs((G.hy + 10) - terrainY(G.hx)) < 18) {
          boardHostage(h);
          continue;
        }
      } else if (Math.abs(h.x - G.hx) < 420) {
        h.vx = h.x < G.hx ? 42 : -42;
      } else {
        h.vx = Math.sin(h.wave * 0.35 + i) * 22;
      }
      const next = h.x + h.vx * dt;
      if (terrainY(next) < GROUND - 14) h.vx *= -1;
      h.x += h.vx * dt;
      h.x = clamp(h.x, 50, G.worldW - 40);
      h.y = GROUND - 8;
    }
    let w = 0;
    for (let i = 0; i < hostages.length; i++) {
      if (hostages[i].state !== 'gone') hostages[w++] = hostages[i];
    }
    hostages.length = w;
  }

  function updateTanks(dt) {
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      if (t.hp <= 0) continue;
      t.x += t.vx * dt;
      if (Math.abs(t.x - t.zone) > t.span || terrainY(t.x) < GROUND - 16) {
        t.vx *= -1;
        t.dir *= -1;
        t.x += t.vx * dt;
      }
      t.y = GROUND - 12;
      for (let k = 0; k < hostages.length; k++) {
        const h = hostages[k];
        if (h.state === 'run' && Math.abs(h.x - t.x) < 16) killHostage(h, '碾压');
      }
      t.fireCd -= dt;
      if (G.mode !== 'play' || G.deadT > 0) continue;
      const dx = G.hx - t.x;
      const dy = G.hy - t.y;
      const dist = Math.hypot(dx, dy);
      if (dist < (isFlak() ? 460 : 380) && t.fireCd <= 0 && inView(t.x, 120)) {
        const lead = isFlak() ? 0.22 : 0.12;
        const ang = Math.atan2(dy + G.vy * lead, dx + G.vx * lead);
        const sp = isFlak() ? 230 : 190;
        eshots.push({
          x: t.x, y: t.y - 8,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          life: 2.2,
          kind: 'shell',
          r: 4
        });
        t.fireCd = isFlak() ? 0.95 : 1.35;
      }
      if (G.invuln <= 0 && Math.abs(G.hx - t.x) < 26 && Math.abs(G.hy - t.y) < 18) {
        crash('撞上坦克');
      }
    }
  }

  function updateJets(dt) {
    G.jetT -= dt;
    const rate = isFlak() ? 3.1 : 4.6;
    const st = G.stage;
    if (G.mode === 'play' && G.deadT <= 0 && G.jetT <= 0) {
      spawnJet();
      G.jetT = rate / (0.85 + st * 0.18);
    }
    for (let i = 0; i < jets.length; i++) {
      const j = jets[i];
      if (j.hp <= 0) continue;
      j.x += j.vx * dt;
      j.fireCd -= dt;
      if (G.mode === 'play' && j.fireCd <= 0 && Math.abs(j.x - G.hx) < 280) {
        eshots.push({
          x: j.x, y: j.y + 6,
          vx: (j.vx > 0 ? 1 : -1) * 280,
          vy: 70,
          life: 1.6,
          kind: 'jet',
          r: 3.2
        });
        if (j.bomb) {
          bombs.push({ x: j.x, y: j.y + 8, vx: j.vx * 0.2, vy: 40, life: 3 });
        }
        j.fireCd = isFlak() ? 0.7 : 1.05;
      }
      if (G.invuln <= 0 && Math.abs(G.hx - j.x) < 28 && Math.abs(G.hy - j.y) < 14) {
        crash('撞上喷气机');
      }
    }
  }

  function updateAA(dt) {
    for (let i = 0; i < aas.length; i++) {
      const a = aas[i];
      if (a.hp <= 0) continue;
      const dx = G.hx - a.x;
      const dy = G.hy - a.y;
      a.ang = Math.atan2(dy, dx);
      a.fireCd -= dt;
      if (G.mode !== 'play' || G.deadT > 0) continue;
      const dist = Math.hypot(dx, dy);
      if (dist < (isFlak() ? 520 : 420) && a.fireCd <= 0 && inView(a.x, 80)) {
        const sp = isFlak() ? 250 : 200;
        const n = isFlak() ? 3 : 2;
        for (let k = 0; k < n; k++) {
          const ang = a.ang + (k - (n - 1) * 0.5) * 0.12;
          eshots.push({
            x: a.x,
            y: a.y - 12,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp,
            life: isFlak() ? 1.15 : 1.4,
            kind: 'flak',
            r: 3.4,
            fuse: isFlak() ? 0.55 + k * 0.08 : 0.85
          });
        }
        a.fireCd = isFlak() ? 0.72 : 1.15;
      }
    }
  }

  function flakBurst(x, y) {
    burstAt(x, y, 12, MAG, 0.7);
    audio.boom(false);
    if (G.invuln <= 0 && Math.hypot(G.hx - x, G.hy - y) < 36) crash('被高炮击落');
    for (let i = 0; i < hostages.length; i++) {
      const h = hostages[i];
      if (h.state === 'run' && Math.hypot(h.x - x, h.y - y) < 28) killHostage(h, '炮火');
    }
  }

  function hitHeliShot(s) {
    for (let i = 0; i < barracks.length; i++) {
      const b = barracks[i];
      if (b.dead) continue;
      if (Math.abs(s.x - b.x) < b.w * 0.55 && s.y > GROUND - b.h - 38 && s.y < GROUND + 6) {
        b.hp -= 1;
        burstAt(s.x, s.y, 6, GOLD, 0.45);
        hitStop(0.032);
        audio.hit(G.combo);
        if (b.hp <= 0) destroyBarracks(b);
        return true;
      }
    }
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      if (t.hp <= 0) continue;
      if (Math.abs(s.x - t.x) < 24 && Math.abs(s.y - t.y) < 22) {
        t.hp -= 1;
        burstAt(s.x, s.y, 8, GOLD, 0.5);
        hitStop(0.038);
        audio.hit(G.combo);
        kick(2.4);
        if (t.hp <= 0) {
          t.hp = 0;
          burstAt(t.x, t.y, 22, MAG, 1.15);
          hitStop(0.058);
          kick(6);
          audio.boom(true);
          noteCombo(200, t.x, t.y - 20, '坦克', GOLD);
          screenFlash(GOLD, 0.22);
        }
        return true;
      }
    }
    for (let i = 0; i < jets.length; i++) {
      const j = jets[i];
      if (j.hp <= 0) continue;
      if (Math.abs(s.x - j.x) < 22 && Math.abs(s.y - j.y) < 12) {
        j.hp -= 1;
        burstAt(s.x, s.y, 7, CYN, 0.5);
        hitStop(0.034);
        audio.hit(G.combo);
        if (j.hp <= 0) {
          burstAt(j.x, j.y, 18, MAG, 1.05);
          hitStop(0.052);
          kick(5);
          audio.boom(true);
          noteCombo(280, j.x, j.y, '喷气', CYN);
        }
        return true;
      }
    }
    for (let i = 0; i < aas.length; i++) {
      const a = aas[i];
      if (a.hp <= 0) continue;
      if (Math.abs(s.x - a.x) < 18 && Math.abs(s.y - a.y) < 22) {
        a.hp -= 1;
        burstAt(s.x, s.y, 6, GOLD, 0.45);
        hitStop(0.032);
        audio.hit(G.combo);
        if (a.hp <= 0) {
          burstAt(a.x, a.y, 16, MAG, 0.95);
          hitStop(0.05);
          kick(4.5);
          audio.boom(true);
          noteCombo(180, a.x, a.y - 16, '高炮', GOLD);
        }
        return true;
      }
    }
    for (let i = 0; i < hostages.length; i++) {
      const h = hostages[i];
      if (h.state === 'run' && Math.abs(s.x - h.x) < 8 && Math.abs(s.y - h.y) < 12) {
        killHostage(h, '误伤');
        return true;
      }
    }
    return false;
  }

  function destroyBarracks(b) {
    b.dead = true;
    b.hp = 0;
    burstAt(b.x, b.y - 16, 26, GOLD, 1.35);
    screenFlash(GOLD, 0.28);
    hitStop(0.062);
    kick(7);
    audio.boom(true);
    bumpScore(80);
    toast('营房炸开 · 快降落', false, true);
    for (let i = 0; i < hostages.length; i++) {
      const h = hostages[i];
      if (h.state === 'in' && Math.abs(h.x - b.x) < 40) {
        h.state = 'run';
        h.x = b.x + rand(-28, 28);
        h.vx = h.x < b.x ? -40 : 40;
        h.wait = rand(0, 0.25);
      }
    }
  }

  function updateShots(dt) {
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 160 * dt;
      s.life -= dt;
      if (s.y > terrainY(s.x)) {
        s.life = 0;
        emit(3, {
          x: sx(s.x), y: terrainY(s.x), j: 3,
          vx0: -20, vx1: 20, vy0: -40, vy1: -8,
          r0: 1, r1: 2, life: 0.18, rgb: GOLD, g: 80
        });
        continue;
      }
      if (hitHeliShot(s)) s.life = 0;
    }
    compactLife(shots);

    for (let i = 0; i < eshots.length; i++) {
      const s = eshots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.kind === 'shell') s.vy += 70 * dt;
      s.life -= dt;
      if (s.fuse != null) {
        s.fuse -= dt;
        if (s.fuse <= 0) {
          flakBurst(s.x, s.y);
          s.life = 0;
          continue;
        }
      }
      if (s.y > terrainY(s.x)) {
        if (s.kind === 'flak') flakBurst(s.x, terrainY(s.x) - 4);
        s.life = 0;
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (Math.hypot(s.x - G.hx, s.y - G.hy) < 14 + (s.r || 3)) {
          crash(s.kind === 'flak' ? '被高炮击落' : '被击落');
          s.life = 0;
        }
      }
    }
    compactLife(eshots);

    for (let i = 0; i < bombs.length; i++) {
      const b = bombs[i];
      b.vy += 320 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.y > terrainY(b.x)) {
        flakBurst(b.x, terrainY(b.x) - 6);
        b.life = 0;
        continue;
      }
      if (G.invuln <= 0 && Math.hypot(b.x - G.hx, b.y - G.hy) < 16) {
        crash('被航弹击中');
        b.life = 0;
      }
    }
    compactLife(bombs);
  }

  function compactLife(arr) {
    let w = 0;
    for (let i = 0; i < arr.length; i++) {
      const s = arr[i];
      if (s.life > 0 && s.x > -40 && s.x < G.worldW + 40) arr[w++] = s;
    }
    arr.length = w;
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 0.18);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    compactFx(particles);
    for (let i = 0; i < sparks.length; i++) {
      const p = sparks[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.life -= dt;
    }
    compactFx(sparks);
    for (let i = 0; i < floats.length; i++) {
      floats[i].y -= 28 * dt;
      floats[i].t -= dt;
    }
    let w = 0;
    for (let i = 0; i < floats.length; i++) {
      if (floats[i].t > 0) floats[w++] = floats[i];
    }
    floats.length = w;
  }

  function compactFx(arr) {
    let w = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].life > 0) arr[w++] = arr[i];
    }
    arr.length = w;
  }

  function pruneDead() {
    let w = 0;
    for (let i = 0; i < tanks.length; i++) if (tanks[i].hp > 0) tanks[w++] = tanks[i];
    tanks.length = w;
    w = 0;
    for (let i = 0; i < jets.length; i++) {
      const j = jets[i];
      if (j.hp > 0 && j.x > G.camX - 700 && j.x < G.camX + 700) jets[w++] = j;
    }
    jets.length = w;
    w = 0;
    for (let i = 0; i < aas.length; i++) if (aas[i].hp > 0) aas[w++] = aas[i];
    aas.length = w;
  }

  function updateTitle(dt) {
    G.demo += dt;
    G.hx = BASE_X + 90 + Math.sin(G.demo * 0.55) * 220;
    G.hy = 210 + Math.sin(G.demo * 0.8) * 36;
    G.vx = Math.cos(G.demo * 0.55) * 90;
    G.landed = false;
    G.face = G.vx > 8 ? 1 : G.vx < -8 ? -1 : 0;
    if (G.face) G.lastSide = G.face;
    G.thr = 0.7;
    G.rotor += 20 * dt;
    G.camX = lerp(G.camX, clamp(G.hx, CX, G.worldW - CX), 0.08);
    G.thumpT -= dt;
    if (G.thumpT <= 0) {
      G.thumpT = 0.08;
      audio.thump();
    }
    for (let i = 0; i < tanks.length; i++) {
      const t = tanks[i];
      t.x += t.vx * dt;
      if (Math.abs(t.x - t.zone) > t.span) t.vx *= -1;
    }
    updateHostages(dt);
    updateFx(dt);
    audio.tickRotor(true, G.thr);
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    if (autoOn) tickAutoFlow(dt);
    if (G.stop > 0) {
      if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
      else {
        G.stop -= dt;
        updateFx(dt);
        audio.tickRotor(G.mode !== 'lose', G.thr);
        return;
      }
    }
    if (G.mode === 'title') {
      updateTitle(dt);
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') {
      G.rotor += 8 * dt;
      G.thr = lerp(G.thr, 0, 0.04);
      updateFx(dt);
      audio.tickRotor(false, 0);
      return;
    }
    if (autoOn && G.deadT <= 0) autoThink();
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateTanks(dt);
      updateJets(dt);
      updateAA(dt);
      updateShots(dt);
      updateHostages(dt);
      updateFx(dt);
      pruneDead();
      audio.tickRotor(false, 0);
      if (G.deadT <= 0) respawn();
      return;
    }
    updateHeli(dt);
    updateHostages(dt);
    updateTanks(dt);
    updateJets(dt);
    updateAA(dt);
    updateShots(dt);
    updateFx(dt);
    pruneDead();
    audio.tickRotor(true, G.thr);
    checkSortieEnd();
    hud();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#071810');
    g.addColorStop(0.45, '#0c2a1c');
    g.addColorStop(0.72, '#163c28');
    g.addColorStop(1, '#1a2814');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    ctx.fillStyle = 'rgba(255,255,220,0.85)';
    ctx.beginPath();
    ctx.arc(640, 58, 22, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(45,255,136,0.12)';
    ctx.beginPath();
    ctx.arc(640, 58, 42, 0, TAU);
    ctx.fill();

    for (let i = 0; i < 36; i++) {
      const hx = hash2(i * 17 + 4);
      const hy = hash2(i * 29 + 8);
      ctx.fillStyle = 'rgba(232,255,244,' + (0.25 + hx * 0.5) + ')';
      ctx.fillRect(((hx * VW) - G.camX * 0.04 + VW) % VW, 8 + hy * 120, 1.4, 1.4);
    }

    ctx.fillStyle = '#0a2218';
    ctx.beginPath();
    ctx.moveTo(0, 250);
    for (let x = 0; x <= VW; x += 16) {
      const wx = G.camX - CX + x;
      const n = hash2((wx / 90) | 0) * 40 + Math.sin(wx * 0.01) * 18;
      ctx.lineTo(x, 210 - n);
    }
    ctx.lineTo(VW, 280);
    ctx.lineTo(0, 280);
    ctx.fill();

    ctx.fillStyle = '#102c1c';
    ctx.beginPath();
    ctx.moveTo(0, 300);
    for (let x = 0; x <= VW; x += 14) {
      const wx = G.camX - CX + x;
      const n = hash2((wx / 70 + 9) | 0) * 34 + Math.sin(wx * 0.014 + 1) * 14;
      ctx.lineTo(x, 250 - n * 0.7);
    }
    ctx.lineTo(VW, 330);
    ctx.lineTo(0, 330);
    ctx.fill();
  }

  function drawHills() {
    for (let i = 0; i < hills.length; i++) {
      const h = hills[i];
      if (!inView(h.x, h.w + 20)) continue;
      const x = sx(h.x);
      ctx.beginPath();
      ctx.moveTo(x - h.w, GROUND + 6);
      ctx.quadraticCurveTo(x, GROUND - h.h - 8, x + h.w, GROUND + 6);
      ctx.fillStyle = '#163820';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - h.w * 0.55, GROUND + 2);
      ctx.quadraticCurveTo(x, GROUND - h.h + 10, x + h.w * 0.4, GROUND + 2);
      ctx.fillStyle = 'rgba(45,255,136,0.08)';
      ctx.fill();
    }
  }

  function drawGround() {
    ctx.fillStyle = '#1a2e18';
    ctx.fillRect(0, GROUND, VW, VH - GROUND);
    ctx.fillStyle = '#243c20';
    ctx.fillRect(0, GROUND, VW, 6);
    ctx.strokeStyle = 'rgba(45,255,136,0.35)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    ctx.lineTo(VW, GROUND);
    ctx.stroke();

    const x0 = G.camX - CX;
    for (let x = ((x0 / 18) | 0) * 18; x < x0 + VW + 18; x += 18) {
      if (terrainY(x) < GROUND - 8) continue;
      const h = 3 + hash2((x / 18) | 0) * 7;
      ctx.strokeStyle = 'rgba(80,160,90,' + (0.25 + hash2(x) * 0.35) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(x), GROUND);
      ctx.lineTo(sx(x) + 2, GROUND - h);
      ctx.stroke();
    }
    ctx.fillStyle = '#121c10';
    ctx.fillRect(0, GROUND + 28, VW, VH - GROUND);
  }

  function drawBase() {
    if (!inView(BASE_X, 180)) return;
    const x = sx(BASE_X);
    ctx.fillStyle = 'rgba(0,232,255,0.12)';
    roundRect(x - PAD_W * 0.5, GROUND - 4, PAD_W, 8, 2);
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.7);
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x - 22, GROUND - 3, 44, 5);
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.font = 'bold 11px "Segoe UI",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('H', x, GROUND - 8);

    ctx.fillStyle = '#1c3a28';
    roundRect(x - 108, GROUND - 52, 70, 52, 3);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.55);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,232,255,0.25)';
    ctx.fillRect(x - 96, GROUND - 40, 14, 12);
    ctx.fillRect(x - 76, GROUND - 40, 14, 12);
    ctx.fillStyle = '#0c1810';
    ctx.fillRect(x - 88, GROUND - 22, 22, 22);

    const fx = x - 128;
    ctx.strokeStyle = rgba(GOLD, 0.8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(fx, GROUND);
    ctx.lineTo(fx, GROUND - 58);
    ctx.stroke();
    const flap = Math.sin(G.t * 6) * 5;
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.beginPath();
    ctx.moveTo(fx, GROUND - 58);
    ctx.lineTo(fx + 18 + flap, GROUND - 50);
    ctx.lineTo(fx, GROUND - 42);
    ctx.fill();
  }

  function drawTrees() {
    for (let i = 0; i < trees.length; i++) {
      const t = trees[i];
      if (!inView(t.x, 20)) continue;
      const x = sx(t.x);
      ctx.fillStyle = '#1a2a14';
      ctx.fillRect(x - 1.4, GROUND - t.h, 2.8, t.h);
      ctx.fillStyle = t.kind ? '#1e5c38' : '#247048';
      ctx.beginPath();
      if (t.kind) {
        ctx.moveTo(x, GROUND - t.h - 10);
        ctx.lineTo(x + t.w, GROUND - t.h + 8);
        ctx.lineTo(x - t.w, GROUND - t.h + 8);
      } else {
        ctx.arc(x, GROUND - t.h, t.w, 0, TAU);
      }
      ctx.fill();
    }
  }

  function drawBarracks() {
    for (let i = 0; i < barracks.length; i++) {
      const b = barracks[i];
      if (!inView(b.x, 50)) continue;
      const x = sx(b.x);
      if (b.dead) {
        ctx.fillStyle = '#1a1810';
        ctx.fillRect(x - 24, GROUND - 10, 48, 10);
        ctx.fillStyle = '#3a3020';
        ctx.fillRect(x - 18, GROUND - 16, 12, 8);
        ctx.fillRect(x + 4, GROUND - 13, 16, 6);
        continue;
      }
      ctx.fillStyle = '#2a2418';
      ctx.fillRect(x - b.w * 0.5, GROUND - b.h, b.w, b.h);
      ctx.strokeStyle = rgba(GOLD, 0.45);
      ctx.lineWidth = 1.3;
      ctx.strokeRect(x - b.w * 0.5, GROUND - b.h, b.w, b.h);
      ctx.fillStyle = '#3a2010';
      ctx.fillRect(x - 8, GROUND - 18, 14, 18);
      ctx.fillStyle = b.hp < 3 ? rgba(MAG, 0.45) : 'rgba(0,232,255,0.28)';
      ctx.fillRect(x - 20, GROUND - 28, 10, 8);
      ctx.fillRect(x + 8, GROUND - 28, 10, 8);
      const ratio = b.hp / b.max;
      ctx.fillStyle = rgba(ratio < 0.5 ? MAG : HOT, 0.7);
      ctx.fillRect(x - 20, GROUND - b.h - 6, 40 * ratio, 3);
    }
  }

  function drawHostage(h) {
    if (h.state === 'in' || h.state === 'aboard' || h.state === 'dead' || h.state === 'gone') return;
    if (!inView(h.x, 12)) return;
    const x = sx(h.x);
    const y = h.y;
    const run = Math.sin(h.frame) * 3;
    ctx.fillStyle = rgba(GOLD, h.state === 'saved' ? 0.7 : 1);
    ctx.fillRect(x - 2.2, y - 10, 4.4, 7);
    ctx.beginPath();
    ctx.arc(x, y - 13, 2.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x - 3, y + 4 + run);
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + 3, y + 4 - run);
    ctx.stroke();
    if (G.landed && Math.abs(h.x - G.hx) < 200 && h.state === 'run') {
      ctx.beginPath();
      ctx.moveTo(x + 2, y - 9);
      ctx.lineTo(x + 5, y - 14 - Math.abs(Math.sin(h.wave)) * 3);
      ctx.stroke();
    }
  }

  function drawTank(t) {
    if (t.hp <= 0 || !inView(t.x, 30)) return;
    const x = sx(t.x);
    const y = t.y;
    ctx.fillStyle = '#2a2018';
    roundRect(x - 20, y - 6, 40, 14, 3);
    ctx.fill();
    ctx.fillStyle = '#3a3024';
    roundRect(x - 12, y - 16, 24, 12, 2);
    ctx.fill();
    ctx.strokeStyle = rgba(MAG, 0.55);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(x - 20, y - 6, 40, 14);
    const ang = Math.atan2(G.hy - t.y, G.hx - t.x);
    ctx.strokeStyle = rgba(PNK, 0.9);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + Math.cos(ang) * 22, y - 10 + Math.sin(ang) * 10);
    ctx.stroke();
    ctx.fillStyle = '#1a140e';
    for (let k = -3; k <= 3; k++) ctx.fillRect(x + k * 5 - 2, y + 4, 4, 4);
  }

  function drawJet(j) {
    if (j.hp <= 0 || !inView(j.x, 40)) return;
    const x = sx(j.x);
    const y = j.y;
    const d = j.vx > 0 ? 1 : -1;
    ctx.fillStyle = '#c8d8e0';
    ctx.beginPath();
    ctx.moveTo(x + d * 22, y);
    ctx.lineTo(x - d * 16, y - 7);
    ctx.lineTo(x - d * 10, y);
    ctx.lineTo(x - d * 16, y + 7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.7);
    ctx.fillRect(x - d * 4, y - 3, 8, 6);
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.beginPath();
    ctx.moveTo(x - d * 16, y);
    ctx.lineTo(x - d * 26, y - 3);
    ctx.lineTo(x - d * 26, y + 3);
    ctx.fill();
  }

  function drawAA(a) {
    if (a.hp <= 0 || !inView(a.x, 24)) return;
    const x = sx(a.x);
    const y = a.y;
    ctx.fillStyle = '#2a2418';
    ctx.fillRect(x - 12, y - 6, 24, 12);
    ctx.strokeStyle = rgba(MAG, 0.6);
    ctx.strokeRect(x - 12, y - 6, 24, 12);
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 6);
    ctx.lineTo(x + Math.cos(a.ang) * 20, y - 6 + Math.sin(a.ang) * 20);
    ctx.stroke();
    ctx.fillStyle = rgba(MAG, 0.8);
    ctx.beginPath();
    ctx.arc(x, y - 6, 4, 0, TAU);
    ctx.fill();
  }

  function drawHeli() {
    if (G.deadT > 0 && G.mode === 'play') return;
    const x = sx(G.hx);
    const y = G.hy;
    const blink = G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.38;

    const spin = G.rotor;
    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = rgba(CYN, 0.35 + G.thr * 0.35);
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const rw = 26 + G.thr * 4;
    ctx.ellipse(0, -12, rw, 2.4, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.55);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(spin) * rw, -12 + Math.sin(spin) * 1.5);
    ctx.lineTo(Math.cos(spin + Math.PI) * rw, -12 + Math.sin(spin + Math.PI) * 1.5);
    ctx.stroke();

    if (G.face === 0) {
      ctx.fillStyle = rgba(HOT, 0.95);
      roundRect(-14, -8, 28, 16, 5);
      ctx.fill();
      ctx.fillStyle = '#06140e';
      roundRect(-8, -5, 16, 8, 2);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(-6, -3, 5, 5);
      ctx.fillRect(1, -3, 5, 5);
      if (G.muzzle > 0) {
        ctx.fillStyle = rgba(GOLD, Math.min(1, G.muzzle * 10));
        ctx.beginPath();
        ctx.arc(G.lastSide * 16, 2, 5, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(-10, 6);
      ctx.lineTo(10, 6);
      ctx.lineTo(16, 10);
      ctx.stroke();
      if (G.cargo > 0) {
        ctx.fillStyle = rgba(GOLD, 0.85);
        for (let i = 0; i < Math.min(G.cargo, 6); i++) {
          ctx.fillRect(-9 + i * 3.2, 1, 2.4, 3.2);
        }
      }
    } else {
      const d = G.face;
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.moveTo(d * 18, 0);
      ctx.lineTo(d * 8, -8);
      ctx.lineTo(-d * 10, -7);
      ctx.lineTo(-d * 14, 2);
      ctx.lineTo(-d * 8, 8);
      ctx.lineTo(d * 10, 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#06140e';
      ctx.fillRect(d * 2 - 4, -5, 10, 7);
      ctx.fillStyle = rgba(CYN, 0.75);
      ctx.fillRect(d * 4 - 2, -3, 6, 4);
      ctx.fillStyle = 'rgba(92,255,176,0.9)';
      ctx.fillRect(d < 0 ? -d * 10 - 22 : -d * 10, -3, 22, 3);
      ctx.beginPath();
      ctx.moveTo(-d * 14, 0);
      ctx.lineTo(-d * 32, -2);
      ctx.lineTo(-d * 32, 2);
      ctx.closePath();
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-d * 32, -6);
      ctx.lineTo(-d * 32, 6);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-d * 12, 10);
      ctx.lineTo(-d * 6, 7);
      ctx.lineTo(d * 12, 7);
      ctx.lineTo(d * 16, 10);
      ctx.stroke();
      if (G.muzzle > 0) {
        ctx.fillStyle = rgba(GOLD, G.muzzle * 8);
        ctx.beginPath();
        ctx.arc(d * 20, 1, 6, 0, TAU);
        ctx.fill();
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawShots() {
    ctx.lineWidth = 2;
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(sx(s.x), s.y);
      ctx.lineTo(sx(s.x - s.vx * 0.02), s.y - s.vy * 0.02);
      ctx.stroke();
    }
    for (let i = 0; i < eshots.length; i++) {
      const s = eshots[i];
      ctx.fillStyle = s.kind === 'flak' ? rgba(MAG, 0.9) : rgba(PNK, 0.9);
      ctx.beginPath();
      ctx.arc(sx(s.x), s.y, s.r || 3, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < bombs.length; i++) {
      const b = bombs[i];
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(sx(b.x), b.y, 4, 0, TAU);
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
      ctx.strokeStyle = rgba(p.rgb, clamp(p.life * 4, 0, 1));
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = clamp(f.t * 1.4, 0, 1);
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold 16px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawRadar() {
    const rw = 220;
    const rh = 10;
    const rx = CX - rw * 0.5;
    const ry = 10;
    ctx.fillStyle = 'rgba(6,20,14,0.55)';
    roundRect(rx, ry, rw, rh, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(45,255,136,0.35)';
    ctx.lineWidth = 1;
    ctx.stroke();
    const mapX = function (x) {
      return rx + (x / G.worldW) * rw;
    };
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillRect(mapX(BASE_X) - 2, ry + 1, 4, rh - 2);
    for (let i = 0; i < barracks.length; i++) {
      if (barracks[i].dead) continue;
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(mapX(barracks[i].x) - 1.5, ry + 2, 3, rh - 4);
    }
    for (let i = 0; i < tanks.length; i++) {
      if (tanks[i].hp <= 0) continue;
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(mapX(tanks[i].x) - 1, ry + 3, 2, rh - 6);
    }
    ctx.fillStyle = rgba(HOT, 1);
    ctx.beginPath();
    ctx.arc(mapX(G.hx), ry + rh * 0.5, 3.2, 0, TAU);
    ctx.fill();
  }

  function draw() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pw = stageEl ? stageEl.clientWidth : 800;
    const ph = stageEl ? stageEl.clientHeight : 450;
    if (pw !== W || ph !== H || canvas.width !== (pw * dpr | 0)) resize();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#04110c';
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
    drawHills();
    drawGround();
    drawBase();
    drawTrees();
    drawBarracks();
    for (let i = 0; i < hostages.length; i++) drawHostage(hostages[i]);
    for (let i = 0; i < tanks.length; i++) drawTank(tanks[i]);
    for (let i = 0; i < aas.length; i++) drawAA(aas[i]);
    drawShots();
    for (let i = 0; i < jets.length; i++) drawJet(jets[i]);
    if (!(G.deadT > 0 && G.mode === 'play')) drawHeli();
    drawParticles();
    drawRadar();

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
    G.kind = kind === 'flak' ? 'flak' : 'rescue';
    G.stage = 1;
    G.t = 0;
    G.clock = 0;
    G.cap = capOf();
    G.hx = BASE_X;
    G.hy = GROUND - 16;
    G.vx = 0;
    G.vy = 0;
    G.face = 0;
    G.lastSide = 1;
    G.landed = true;
    G.thr = 0.25;
    G.cargo = 0;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.nextLife = LIFE_EVERY;
    G.saved = 0;
    G.lost = 0;
    G.sortieSaved = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 0.8;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.why = '';
    G.jetT = 2.2;
    G.camX = BASE_X;
    G.unloadT = 0;
    clearField();
    seedWorld(false);
    hideOverlay();
    hud();
    audio.start();
    autoOvWait = 0;
    autoStuck = 0;
    autoWait = 0;
    autoLandX = BASE_X + 80;
    autoLastX = G.hx;
    autoLastY = G.hy;
    toast(isFlak() ? '火网 · 高炮更密' : '救人 · 边哨', false, !isFlak());
    setHint(autoOn ? '托管中 · 救人回营 · A 停下' : '飞向营房开火 · 降落接人 · 送回基地 H 坪', autoOn ? 'hot' : '');
    if (scoreEl) scoreEl.textContent = '0';
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'rescue';
    G.stage = 1;
    G.lives = LIVES;
    G.cap = 8;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.score = 0;
    G.saved = 0;
    G.lost = 0;
    G.sortieSaved = 0;
    G.cargo = 0;
    G.demo = 0;
    clearField();
    seedWorld(true);
    G.hx = BASE_X + 80;
    G.hy = 210;
    G.camX = BASE_X + 80;
    showOverlay('title', '救升', '降落救人，送回基地。舱位有限，坦克会碾人。别当成河袭——这是侧视救援，不是河道突围。');
    setHint(autoOn ? '自动托管 · 即将开局 · A 停下' : '方向飞 · 空格开火 · 降落接人 · 送回基地 · A 自动', autoOn ? 'hot' : '');
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('rescue');
    else startGame(G.kind || 'rescue');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('rescue');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      e.preventDefault();
      if (down && !e.repeat) toggleAuto();
      return;
    }
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

    if (!autoOn) {
      if (k === 'ArrowLeft' || k === 'Left') {
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
    } else if (!down) {
      if (k === 'ArrowLeft' || k === 'Left') keys.l = false;
      if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = false;
      if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = false;
      if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = false;
    }

    if (down && (isMove || space || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space && !autoOn) G.fireHold = false;
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
    if (autoOn) return;
    if (k === '1' && G.mode === 'title') {
      audio.ensure();
      startGame('rescue');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('flak');
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
      if (autoOn) return;
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerVirtX(e), 0, VW);
      pointer.y = pointerVirtY(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fireGun();
      if (G.mode === 'title') startGame('rescue');
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (autoOn) return;
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

  function bindPad(el, key, isFire) {
    if (!el) return;
    const set = function (v, e) {
      if (e) e.preventDefault();
      if (autoOn) return;
      if (isFire) G.fireHold = v;
      else keys[key] = v;
      inputSrc = 'pad';
      el.classList.toggle('on', v);
    };
    el.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (autoOn) return;
      set(true, e);
      if (isFire && G.mode === 'play') fireGun();
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    el.addEventListener('pointerup', function (e) { set(false, e); });
    el.addEventListener('pointercancel', function (e) { set(false, e); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
    const turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    let n = 0;
    const maxSteps = turbo ? 16 : 5;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * 4) acc = 0;
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();
  bindPad(document.getElementById('pad-left'), 'l', false);
  bindPad(document.getElementById('pad-right'), 'r', false);
  bindPad(document.getElementById('pad-up'), 'u', false);
  bindPad(document.getElementById('pad-down'), 'd', false);
  bindPad(document.getElementById('pad-fire'), 'fire', true);

  if (btnRescue) {
    btnRescue.addEventListener('click', function () {
      audio.ensure();
      startGame('rescue');
    });
  }
  if (btnFlak) {
    btnFlak.addEventListener('click', function () {
      audio.ensure();
      startGame('flak');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'rescue');
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
  if (btnAuto) btnAuto.addEventListener('click', toggleAuto);
  if (speedEl) {
    const onSpeed = function () { setAutoSpeed(speedEl.value); };
    speedEl.addEventListener('input', onSpeed);
    speedEl.addEventListener('change', onSpeed);
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

  if (padsEl && typeof window !== 'undefined' && window.matchMedia) {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (coarse) padsEl.classList.add('show');
  }

  requestAnimationFrame(frame);
})();
