'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const HORIZON = 158;
  const FOCAL = 420;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.45;
  const BEST_KEY = 'playbox-after-burn-best';
  const MUTE_KEY = 'playbox-after-burn-mute';
  const OPS = '方向 / WASD 移动 · 空格机炮 · Z / Shift 导弹 · 按住上 加力 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 200, 255];
  const HOT = [92, 232, 255];
  const GOLD = [255, 227, 107];
  const FLM = [255, 154, 60];
  const RED = [255, 72, 96];
  const WHT = [236, 248, 255];
  const PNK = [255, 154, 212];

  const STAGES = [
    { name: '远海', theme: 'sea', len: 740 },
    { name: '裂谷', theme: 'canyon', len: 800 },
    { name: '夜城', theme: 'city', len: 860 }
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
  const btnCruise = document.getElementById('btn-cruise');
  const btnSonic = document.getElementById('btn-sonic');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnMsl = document.getElementById('btn-msl');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const spdEl = document.getElementById('spd');
  const spdBox = document.getElementById('spd-box');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const mslEl = document.getElementById('msl-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const abBar = document.getElementById('ab-bar');
  const abWrap = document.getElementById('ab-wrap');

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
  const pointer = { down: false, hover: false, x: CX, y: 320, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const floats = [];
  const smears = [];
  const ghosts = [];
  const ents = [];
  const shots = [];
  const missiles = [];
  const incoming = [];
  const decos = [];
  const clouds = [];

  const G = {
    mode: 'title',
    kind: 'cruise',
    t: 0,
    clock: 0,
    stage: 1,
    dist: 0,
    stageDist: 0,
    px: 0,
    py: 0,
    vx: 0,
    vy: 0,
    bank: 0,
    spd: 24,
    ab: false,
    abAmt: 0,
    score: 0,
    scoreAcc: 0,
    best: { c: 0, s: 0 },
    combo: 0,
    comboT: 0,
    mult: 1,
    lives: LIVES,
    missiles: 10,
    nextLife: LIFE_EVERY,
    fireCd: 0,
    fireHold: false,
    mslCd: 0,
    lock: { ent: null, t: 0, locked: false, beep: 0 },
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    warn: 0,
    warnBeep: 0,
    spawnT: 0.8,
    heavy: false,
    toastT: 0,
    why: '',
    ending: '',
    endT: 0,
    ghostT: 0
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
  function isSonic() {
    return G.kind === 'sonic';
  }
  function stageDef() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function kindBest() {
    return isSonic() ? G.best.s : G.best.c;
  }
  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }

  function project(wx, wy, wz) {
    const z = wz < 0.5 ? 0.5 : wz;
    const s = FOCAL / z;
    const camX = G.px * 0.7;
    const camY = G.py * 0.48;
    return {
      x: CX + (wx - camX) * s,
      y: HORIZON - (wy - camY) * s * 0.72,
      s: s,
      z: z
    };
  }

  function jetScreen() {
    return {
      x: CX + G.px * 228,
      y: 328 - G.py * 148
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
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startEngine();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.32;
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
    tickEngine(spd01, on) {
      if (!this.engG || !this.ctx) return;
      const t = this.ctx.currentTime;
      if (!on) {
        this.engG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const f = 58 + spd01 * 140 + Math.sin(G.t * 28) * (2 + spd01 * 8);
      this.eng.frequency.setTargetAtTime(f, t, 0.045);
      this.eng2.frequency.setTargetAtTime(f * 2.05, t, 0.045);
      this.engF.frequency.setTargetAtTime(420 + spd01 * 1100, t, 0.08);
      this.engG.gain.setTargetAtTime(this.muted ? 0 : (0.028 + spd01 * 0.07), t, 0.06);
    },
    gun() {
      this.beep(720, 0.045, 'square', 0.034, 1680);
    },
    lockTick(p) {
      const f = 780 + p * 620;
      this.beep(f, 0.055, 'square', 0.036);
    },
    lockOn() {
      this.beep(1180, 0.07, 'square', 0.07);
      this.beep(1560, 0.11, 'square', 0.05);
      this.beep(1960, 0.08, 'triangle', 0.03);
    },
    lockHold() {
      this.beep(1320, 0.04, 'square', 0.028);
    },
    missile() {
      this.noise(0.12, 0.07, 420);
      this.beep(240, 0.16, 'sawtooth', 0.06, 80);
      this.beep(880, 0.1, 'square', 0.04, 420);
    },
    hit(combo) {
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.036, 1100);
      this.beep(520 * lift, 0.07, 'square', 0.046, 880 * lift);
    },
    boom(big) {
      this.noise(big ? 0.18 : 0.09, big ? 0.08 : 0.05, big ? 240 : 480);
      this.beep(big ? 160 : 260, big ? 0.24 : 0.12, 'sawtooth', 0.055, 50);
    },
    warn() {
      this.beep(920, 0.07, 'square', 0.07);
      this.beep(620, 0.09, 'square', 0.05);
    },
    miss() {
      this.beep(160, 0.08, 'sine', 0.03, 80);
    },
    death() {
      this.noise(0.16, 0.07, 280);
      this.beep(280, 0.2, 'sawtooth', 0.06, 70);
      this.beep(140, 0.32, 'sine', 0.05, 42);
    },
    stage() {
      this.beep(392, 0.09, 'square', 0.045, 523);
      this.beep(523, 0.11, 'triangle', 0.04, 659);
      this.beep(784, 0.2, 'square', 0.045, 1046);
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
    empty() {
      this.beep(180, 0.1, 'square', 0.03, 90);
    },
    ab() {
      this.noise(0.1, 0.05, 280);
      this.beep(160, 0.14, 'sawtooth', 0.045, 480);
    }
  };

  function palette() {
    const theme = stageDef().theme;
    if (theme === 'canyon') {
      return {
        skyTop: [28, 8, 14],
        skyMid: [120, 32, 24],
        skyHor: [255, 128, 64],
        sun: [255, 180, 70],
        g1: [96, 42, 28],
        g2: [72, 30, 20],
        gLine: [180, 80, 40],
        mtn1: [70, 22, 18],
        mtn2: [48, 14, 14],
        fog: [180, 70, 40],
        deco: [140, 64, 36]
      };
    }
    if (theme === 'city') {
      return {
        skyTop: [6, 6, 22],
        skyMid: [18, 12, 48],
        skyHor: [70, 24, 90],
        sun: [220, 230, 255],
        g1: [18, 18, 32],
        g2: [12, 14, 26],
        gLine: [0, 200, 255],
        mtn1: [16, 12, 36],
        mtn2: [10, 8, 24],
        fog: [40, 20, 60],
        deco: [80, 40, 120]
      };
    }
    return {
      skyTop: [8, 18, 36],
      skyMid: [18, 70, 120],
      skyHor: [70, 170, 210],
      sun: [255, 220, 110],
      g1: [10, 72, 108],
      g2: [8, 56, 88],
      gLine: [180, 230, 255],
      mtn1: [20, 50, 70],
      mtn2: [12, 32, 48],
      fog: [40, 120, 150],
      deco: [20, 90, 70]
    };
  }

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
    floats.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85 });
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
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
      vx0: -140 * m, vx1: 140 * m,
      vy0: -160 * m, vy1: 80 * m,
      r0: 1.5, r1: 4.5 * m,
      life: 0.42 + 0.18 * m,
      rgb: rgb
    });
    for (let i = 0; i < (REDUCE ? 3 : 8); i++) {
      sparks.push({
        x: p.x, y: p.y,
        vx: rand(-220, 220) * m,
        vy: rand(-240, 120) * m,
        life: rand(0.12, 0.32),
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
        G.best.c = o.c | 0;
        G.best.s = o.s | 0;
      } else {
        G.best.c = parseInt(raw, 10) | 0;
      }
    } catch (err) { /* ignore */ }
  }
  function maybeBest() {
    const k = isSonic() ? 's' : 'c';
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
    const mach = (0.62 + G.spd * 0.028).toFixed(1);
    if (spdEl) spdEl.textContent = mach;
    if (spdBox) spdBox.classList.toggle('hot', G.abAmt > 0.55);
    const st = stageDef();
    if (stageLabel) {
      stageLabel.textContent = st.name;
      stageLabel.classList.toggle('hot', G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isSonic() ? '超音速' : '巡航';
      tagLabel.classList.toggle('warn', isSonic());
    }
    if (mslEl) {
      mslEl.textContent = '弹 ' + G.missiles;
      mslEl.classList.toggle('low', G.missiles <= 2);
    }
    if (abBar) abBar.style.transform = 'scaleX(' + clamp(G.abAmt, 0, 1).toFixed(3) + ')';
    if (abWrap) abWrap.classList.toggle('hot', G.abAmt > 0.6);
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.combo + (G.mult > 1 ? '  ' + G.mult + '倍' : '');
      } else comboEl.hidden = true;
    }
    if (btnMsl) btnMsl.classList.toggle('ready', !!(G.lock.locked && G.missiles > 0 && G.mode === 'play'));
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
    if (ovKicker) ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'STALL' : 'BURNER';
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
    missiles.length = 0;
    incoming.length = 0;
    particles.length = 0;
    sparks.length = 0;
    floats.length = 0;
    smears.length = 0;
    ghosts.length = 0;
    G.lock.ent = null;
    G.lock.t = 0;
    G.lock.locked = false;
  }

  function seedWorld() {
    decos.length = 0;
    clouds.length = 0;
    const theme = stageDef().theme;
    const seed = G.stage * 17 + (isSonic() ? 9 : 3);
    for (let i = 0; i < 22; i++) {
      const h = hash2(seed + i * 13);
      const side = h > 0.5 ? 1 : -1;
      let kind = 'rock';
      if (theme === 'sea') kind = h > 0.55 ? 'island' : 'rock';
      else if (theme === 'canyon') kind = h > 0.4 ? 'cliff' : 'mesa';
      else kind = h > 0.35 ? 'build' : 'tower';
      decos.push({
        k: kind,
        x: side * (1.8 + h * 3.4),
        y: -1.05,
        z: 8 + hash2(i + 4) * 96,
        h: 0.6 + h * 1.8,
        w: 0.4 + h * 0.8,
        col: (h * 6) | 0
      });
    }
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: rand(-8, 8),
        y: rand(0.6, 2.2),
        z: rand(20, 110),
        s: rand(0.8, 2.2)
      });
    }
  }

  function recycleDeco(d) {
    const theme = stageDef().theme;
    const h = Math.random();
    const side = h > 0.5 ? 1 : -1;
    d.x = side * (1.7 + h * 3.6);
    d.y = -1.05;
    d.z = 78 + rand(0, 36);
    d.h = 0.55 + h * 1.9;
    d.w = 0.35 + h * 0.9;
    if (theme === 'sea') d.k = h > 0.55 ? 'island' : 'rock';
    else if (theme === 'canyon') d.k = h > 0.4 ? 'cliff' : 'mesa';
    else d.k = h > 0.35 ? 'build' : 'tower';
  }

  function enemyHp(type) {
    if (type === 'bmb') return isSonic() ? 8 : 6;
    if (type === 'int') return 3;
    return 2;
  }
  function enemyScore(type, msl) {
    let n = 120;
    if (type === 'int') n = 180;
    if (type === 'bmb') n = 500;
    if (type === 'hvy') n = 1400;
    if (msl) n = (n * 2.2) | 0;
    return n;
  }

  function spawnEnemy(type, x, y, z) {
    if (ents.length > 16) return null;
    const e = {
      type: type,
      x: x,
      y: y,
      z: z,
      vx: 0,
      vy: 0,
      hp: enemyHp(type),
      t: rand(0, TAU),
      fire: rand(0.4, 1.4),
      bank: 0,
      dead: false
    };
    if (type === 'hvy') e.hp = isSonic() ? 14 : 10;
    ents.push(e);
    return e;
  }

  function spawnWave() {
    const roll = Math.random();
    const z0 = 86 + rand(0, 22);
    if (roll < 0.52) {
      const n = 3 + (Math.random() * 3 | 0);
      const bx = rand(-0.75, 0.75);
      const by = rand(-0.2, 0.5);
      for (let i = 0; i < n; i++) {
        spawnEnemy('fgt', bx + (i - (n - 1) * 0.5) * 0.42, by + (i % 2) * 0.1, z0 + i * 3.5);
      }
    } else if (roll < 0.82) {
      spawnEnemy('int', rand(-0.9, 0.9), rand(-0.15, 0.55), z0);
      if (isSonic() && Math.random() < 0.55) {
        spawnEnemy('int', rand(-0.9, 0.9), rand(-0.15, 0.55), z0 + 8);
      }
    } else {
      spawnEnemy('bmb', rand(-0.5, 0.5), rand(0.05, 0.55), z0 + 6);
    }
  }

  function fireGun() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    G.fireCd = isSonic() ? 0.068 : 0.082;
    G.muzzle = 0.08;
    const jx = G.px;
    const jy = G.py;
    const aim = G.lock.ent;
    let vx = 0;
    let vy = 0;
    if (aim) {
      vx = (aim.x - jx) * 0.35;
      vy = (aim.y - jy) * 0.35;
    }
    shots.push({ x: jx - 0.07, y: jy, z: 5.2, vx: vx, vy: vy, vz: 62, from: 'p' });
    shots.push({ x: jx + 0.07, y: jy, z: 5.2, vx: vx, vy: vy, vz: 62, from: 'p' });
    audio.gun();
  }

  function tryMissile() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.mslCd > 0) return;
    if (G.missiles <= 0) {
      toast('导弹用尽', true, false);
      audio.empty();
      return;
    }
    if (!G.lock.locked || !G.lock.ent) {
      toast('未锁定', true, false);
      audio.miss();
      return;
    }
    const tgt = G.lock.ent;
    G.missiles -= 1;
    G.mslCd = 0.32;
    missiles.push({
      x: G.px, y: G.py, z: 5.5,
      vx: 0, vy: 0, vz: 38,
      tgt: tgt,
      life: 2.4,
      trail: []
    });
    audio.missile();
    screenFlash(FLM, 0.18);
    kick(2.5);
    hud();
  }

  function fireIncoming(e) {
    if (incoming.length >= (isSonic() ? 6 : 4)) return;
    incoming.push({
      x: e.x, y: e.y, z: e.z - 1,
      vx: 0, vy: 0,
      life: 3.4,
      trail: [],
      from: e.type
    });
  }

  function fireBolt(e) {
    shots.push({
      x: e.x, y: e.y, z: e.z,
      vx: (G.px - e.x) * 0.25,
      vy: (G.py - e.y) * 0.25,
      vz: -28,
      from: 'e'
    });
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

  function killEnemy(e, via) {
    if (e.dead) return;
    e.dead = true;
    const msl = via === 'msl';
    const big = e.type === 'bmb' || e.type === 'hvy' || msl;
    const pts = (enemyScore(e.type, msl) * G.mult) | 0;
    const p = project(e.x, e.y, e.z);
    burstAt(e.x, e.y, e.z, big ? 28 : 16, msl ? FLM : GOLD, big ? 1.5 : 1);
    floatText(p.x, p.y - 10, '+' + pts, msl ? FLM : GOLD);
    if (G.mode === 'play') {
      noteCombo();
      bumpScore(pts);
      if (msl) {
        hitStop(0.058);
        kick(7);
        screenFlash(FLM, 0.32);
      } else {
        hitStop(0.032);
        kick(3.2);
        screenFlash(GOLD, 0.16);
      }
      audio.hit(G.combo);
      audio.boom(big);
    } else {
      audio.boom(false);
    }
    if (G.lock.ent === e) {
      G.lock.ent = null;
      G.lock.locked = false;
      G.lock.t = 0;
    }
  }

  function killIncoming(m, viaGun) {
    const p = project(m.x, m.y, m.z);
    burstAt(m.x, m.y, m.z, 12, MAG, 0.85);
    m.life = 0;
    if (G.mode === 'play' && viaGun) {
      const pts = (80 * G.mult) | 0;
      noteCombo();
      bumpScore(pts);
      floatText(p.x, p.y, '+' + pts, MAG);
      hitStop(0.038);
      kick(4);
      audio.hit(G.combo);
    } else audio.boom(false);
  }

  function playerHit(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    const j = jetScreen();
    emit(REDUCE ? 10 : 26, {
      x: j.x, y: j.y, j: 14,
      vx0: -180, vx1: 180, vy0: -200, vy1: 80,
      r0: 2, r1: 6, life: 0.55, rgb: FLM
    });
    screenFlash(MAG, 0.45);
    hitStop(0.078);
    kick(10);
    audio.death();
    G.deadT = 0.9;
    G.why = why || '击坠';
    G.lock.ent = null;
    G.lock.locked = false;
    G.combo = 0;
    G.mult = 1;
    G.ab = false;
  }

  function targetSpd() {
    const base = isSonic() ? 34 : 24;
    return base * (G.ab ? 1.74 : 1);
  }

  function lockDist(e) {
    return Math.abs(e.x - G.px) + Math.abs(e.y - G.py) * 0.85;
  }
  function inLockRange(e, lim) {
    if (!e || e.dead) return false;
    if (e.z < 7 || e.z > 74) return false;
    return lockDist(e) < lim;
  }

  function updateLock(dt) {
    const need = isSonic() ? 0.28 : 0.4;
    let best = null;
    let bestD = 99;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (!inLockRange(e, 0.7)) continue;
      const d = lockDist(e);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    if (G.lock.ent && G.lock.ent.dead) {
      G.lock.ent = null;
      G.lock.locked = false;
      G.lock.t = 0;
    }
    const hold = G.lock.locked && inLockRange(G.lock.ent, 1.12);
    if (hold) {
      G.lock.beep -= dt;
      if (G.lock.beep <= 0) {
        G.lock.beep = 0.2;
        audio.lockHold();
      }
    } else if (best) {
      G.lock.ent = best;
      G.lock.t = Math.min(need, G.lock.t + dt);
      G.lock.beep -= dt;
      if (G.lock.t >= need) {
        if (!G.lock.locked) {
          G.lock.locked = true;
          audio.lockOn();
          toast('锁定', false, true);
        }
      } else {
        G.lock.locked = false;
        if (G.lock.beep <= 0) {
          G.lock.beep = 0.11;
          audio.lockTick(G.lock.t / need);
        }
      }
    } else {
      G.lock.locked = false;
      G.lock.t = Math.max(0, G.lock.t - dt * 2.4);
      if (G.lock.t <= 0) G.lock.ent = null;
    }
  }

  function updatePlayer(dt) {
    let ax = 0;
    let ay = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const tx = clamp((pointer.x - CX) / 228, -1.2, 1.2);
      const ty = clamp((328 - pointer.y) / 148, -0.85, 0.9);
      ax = (tx - G.px) * 3.4;
      ay = (ty - G.py) * 3.4;
      if (pointer.down) G.ab = ty > 0.42;
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay += 1;
      if (keys.d) ay -= 1;
      G.ab = keys.u && !keys.d;
    }
    if (G.mode === 'title') {
      G.px = Math.sin(G.t * 0.62) * 0.72;
      G.py = Math.cos(G.t * 0.4) * 0.38;
      G.ab = Math.sin(G.t * 0.9) > 0.15;
      G.bank = lerp(G.bank, Math.cos(G.t * 0.62) * 0.45, 0.12);
      return;
    }
    if (G.deadT > 0) {
      G.ab = false;
      G.vx *= 0.9;
      G.vy *= 0.9;
      return;
    }
    const acc = 9.6;
    G.vx += ax * acc * dt;
    G.vy += ay * acc * dt;
    G.vx *= Math.pow(0.14, dt);
    G.vy *= Math.pow(0.14, dt);
    const cap = 2.25;
    const sp = Math.hypot(G.vx, G.vy);
    if (sp > cap) {
      G.vx *= cap / sp;
      G.vy *= cap / sp;
    }
    G.px = clamp(G.px + G.vx * dt, -1.2, 1.2);
    G.py = clamp(G.py + G.vy * dt, -0.85, 0.9);
    G.bank = lerp(G.bank, clamp(G.vx * 0.42, -0.7, 0.7), 0.18);
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
        for (let k = ents.length - 1; k >= 0; k--) {
          const e = ents[k];
          if (e.dead) continue;
          const dz = Math.abs(e.z - s.z);
          if (dz > 5) continue;
          const r = e.type === 'bmb' || e.type === 'hvy' ? 0.48 : 0.36;
          const dx = e.x - s.x;
          const dy = e.y - s.y;
          if (dx * dx + dy * dy < r * r) {
            e.hp -= 1;
            burstAt(s.x, s.y, s.z, 5, CYN, 0.4);
            if (e.hp <= 0) killEnemy(e, 'gun');
            else audio.hit(G.combo);
            hit = true;
            break;
          }
        }
        if (!hit) {
          for (let k = incoming.length - 1; k >= 0; k--) {
            const m = incoming[k];
            if (m.life <= 0) continue;
            if (Math.abs(m.z - s.z) > 5) continue;
            const dx = m.x - s.x;
            const dy = m.y - s.y;
            if (dx * dx + dy * dy < 0.22 * 0.22) {
              killIncoming(m, true);
              incoming.splice(k, 1);
              hit = true;
              break;
            }
          }
        }
        if (hit) shots.splice(i, 1);
      } else {
        if (s.z < 1.4) {
          const dx = s.x - G.px;
          const dy = s.y - G.py;
          if (dx * dx + dy * dy < 0.2 * 0.2) playerHit('被弹');
          shots.splice(i, 1);
        }
      }
    }
  }

  function updateMissiles(dt) {
    for (let i = missiles.length - 1; i >= 0; i--) {
      const m = missiles[i];
      m.life -= dt;
      const tgt = m.tgt && !m.tgt.dead ? m.tgt : null;
      if (tgt) {
        const dx = tgt.x - m.x;
        const dy = tgt.y - m.y;
        const dz = tgt.z - m.z;
        m.vx = lerp(m.vx, dx * 6.5, 0.14);
        m.vy = lerp(m.vy, dy * 6.5, 0.14);
        m.vz = lerp(m.vz, 22 + dz * 1.8, 0.12);
      } else m.vz += 18 * dt;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.z += m.vz * dt;
      m.trail.push({ x: m.x, y: m.y, z: m.z });
      if (m.trail.length > 10) m.trail.shift();
      let boom = false;
      if (tgt) {
        const dx = tgt.x - m.x;
        const dy = tgt.y - m.y;
        const dz = tgt.z - m.z;
        if (dx * dx + dy * dy + dz * dz * 0.08 < 0.55) {
          tgt.hp = 0;
          killEnemy(tgt, 'msl');
          boom = true;
        }
      } else {
        for (let k = 0; k < ents.length; k++) {
          const e = ents[k];
          if (e.dead) continue;
          const dx = e.x - m.x;
          const dy = e.y - m.y;
          const dz = e.z - m.z;
          if (dx * dx + dy * dy + dz * dz * 0.08 < 0.4) {
            e.hp = 0;
            killEnemy(e, 'msl');
            boom = true;
            break;
          }
        }
      }
      if (boom || m.life <= 0 || m.z > 100) missiles.splice(i, 1);
    }
  }

  function updateIncoming(dt) {
    G.warn = 0;
    for (let i = incoming.length - 1; i >= 0; i--) {
      const m = incoming[i];
      m.life -= dt;
      const tight = m.z < 12 ? 2.4 : 1.15;
      m.x += (G.px - m.x) * tight * dt;
      m.y += (G.py - m.y) * tight * dt;
      m.z -= (G.spd * 0.85 + 26) * dt;
      m.trail.push({ x: m.x, y: m.y, z: m.z });
      if (m.trail.length > 8) m.trail.shift();
      if (m.z < 38) G.warn = Math.max(G.warn, clamp((38 - m.z) / 36, 0, 1));
      if (m.z < 3.4) {
        const dx = m.x - G.px;
        const dy = m.y - G.py;
        if (dx * dx + dy * dy < 0.24 * 0.24) {
          playerHit('来弹');
          burstAt(m.x, m.y, m.z, 18, MAG, 1.2);
        } else {
          burstAt(m.x, m.y, 3, 6, PNK, 0.4);
        }
        incoming.splice(i, 1);
        continue;
      }
      if (m.life <= 0 || m.z < 1) incoming.splice(i, 1);
    }
    if (G.warn > 0.15 && G.mode === 'play') {
      G.warnBeep -= dt;
      if (G.warnBeep <= 0) {
        G.warnBeep = 0.26;
        audio.warn();
        if (G.warn > 0.55) toast('来弹', true, false);
      }
    }
  }

  function updateEnts(dt) {
    const close = G.spd * 0.42 + 10;
    for (let i = ents.length - 1; i >= 0; i--) {
      const e = ents[i];
      if (e.dead) {
        ents.splice(i, 1);
        continue;
      }
      e.t += dt;
      let wx = 0;
      let wy = 0;
      if (e.type === 'fgt') {
        wx = Math.sin(e.t * 1.6 + e.x) * 0.32;
        wy = Math.cos(e.t * 1.1) * 0.12;
      } else if (e.type === 'int') {
        wx = Math.sin(e.t * 2.2) * 0.5;
        wy = Math.sin(e.t * 1.4) * 0.22;
      } else {
        wx = Math.sin(e.t * 0.7) * 0.18;
        wy = 0.04;
      }
      e.x = clamp(e.x + wx * dt, -1.35, 1.35);
      e.y = clamp(e.y + wy * dt, -0.7, 0.95);
      e.z -= close * dt * (e.type === 'int' ? 1.15 : e.type === 'hvy' ? 0.72 : 1);
      e.bank = lerp(e.bank, wx * 0.4, 0.12);
      e.fire -= dt;
      if (e.fire <= 0 && e.z < 58 && e.z > 10 && G.mode === 'play') {
        const dx = e.x - G.px;
        const dy = e.y - G.py;
        const aligned = Math.abs(dx) < 0.95 && Math.abs(dy) < 0.8;
        if (e.type === 'int' || e.type === 'hvy' || e.type === 'bmb') {
          if (aligned) {
            fireIncoming(e);
            if (e.type === 'bmb' || e.type === 'hvy') {
              incoming[incoming.length - 1].x += 0.12;
              fireIncoming(e);
            }
            e.fire = (isSonic() ? 1.05 : 1.7) + rand(0, 0.6);
          } else e.fire = 0.35;
        } else if (aligned && Math.random() < (isSonic() ? 0.55 : 0.32)) {
          fireBolt(e);
          e.fire = 0.9 + rand(0, 0.5);
        } else e.fire = 0.4;
      }
      if (e.z < 4.1 && G.mode === 'play' && G.deadT <= 0) {
        const dx = e.x - G.px;
        const dy = e.y - G.py;
        if (dx * dx + dy * dy < 0.26 * 0.26) {
          playerHit('相撞');
          killEnemy(e, 'gun');
          continue;
        }
      }
      if (G.mode === 'title' && e.z < 14) {
        killEnemy(e, 'gun');
        continue;
      }
      if (e.z < 1.3) ents.splice(i, 1);
    }
  }

  function updateDecos(dt) {
    const vz = G.spd;
    for (let i = 0; i < decos.length; i++) {
      decos[i].z -= vz * dt;
      if (decos[i].z < 2.2) recycleDeco(decos[i]);
    }
    for (let i = 0; i < clouds.length; i++) {
      clouds[i].z -= vz * 0.35 * dt;
      if (clouds[i].z < 8) {
        clouds[i].z = 90 + rand(0, 30);
        clouds[i].x = rand(-8, 8);
        clouds[i].y = rand(0.5, 2.2);
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
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
      floats[i].y -= 28 * dt;
      floats[i].t -= dt;
      if (floats[i].t <= 0) floats.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].t -= dt;
      if (ghosts[i].t <= 0) ghosts.splice(i, 1);
    }
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    G.punch = lerp(G.punch, 1, 0.18);
    if (G.muzzle > 0) G.muzzle -= dt;
  }

  function maybeSpawn(dt) {
    if (G.mode === 'title') {
      G.spawnT -= dt;
      if (G.spawnT <= 0 && ents.length < 6) {
        G.spawnT = 1.4 + rand(0, 0.8);
        spawnEnemy('fgt', rand(-0.8, 0.8), rand(-0.2, 0.4), 90);
      }
      return;
    }
    if (G.mode !== 'play' || G.deadT > 0) return;
    G.spawnT -= dt;
    const dens = (isSonic() ? 0.62 : 0.95) / (1 + (G.stage - 1) * 0.1);
    if (G.spawnT <= 0) {
      G.spawnT = dens * rand(0.75, 1.35);
      spawnWave();
    }
    if (!G.heavy && G.stageDist > stageDef().len * 0.78) {
      G.heavy = true;
      spawnEnemy('hvy', rand(-0.3, 0.3), 0.2, 96);
      toast('大型机', false, true);
      audio.stage();
    }
  }

  function nextStage() {
    const bonus = (2000 + G.stage * 400 + G.missiles * 40) | 0;
    bumpScore(bonus);
    toast(stageDef().name + ' 肃清 +' + bonus, false, true);
    audio.stage();
    screenFlash(GOLD, 0.28);
    if (G.stage >= 3) {
      bumpScore(5000);
      G.mode = 'win';
      G.endT = 0;
      audio.win();
      showOverlay('win', '航线打穿', '三关冲完。分数 ' + G.score + '　再来一局？');
      setHint('R 再飞同一模式', 'hot');
      return;
    }
    G.stage += 1;
    G.stageDist = 0;
    G.heavy = false;
    G.missiles = Math.min(18, G.missiles + (isSonic() ? 4 : 5));
    seedWorld();
    toast(stageDef().name, false, true);
    hud();
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
      const why = G.why === '来弹' ? '来弹没躲开。' : G.why === '相撞' ? '空中相撞。' : '被弹击坠。';
      showOverlay('lose', '坠海了', why + '分数 ' + G.score);
      setHint('R 再飞　顶栏重开不挡', 'warn');
      return;
    }
    G.px = 0;
    G.py = 0;
    G.vx = 0;
    G.vy = 0;
    G.invuln = 1.45;
    G.deadT = 0;
    incoming.length = 0;
    toast('重整', false, false);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt);
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') {
      G.spd = lerp(G.spd, 10, 0.04);
      G.dist += G.spd * dt;
      updateDecos(dt);
      updateEnts(dt);
      updateFx(dt);
      audio.tickEngine(G.spd / 50, true);
      return;
    }

    updatePlayer(dt);
    const want = targetSpd();
    const abWas = G.abAmt;
    G.spd = lerp(G.spd, want, G.ab ? 0.08 : 0.05);
    G.abAmt = lerp(G.abAmt, G.ab ? 1 : clamp((G.spd - 24) / 28, 0, 1), 0.12);
    if (G.mode === 'play' && abWas < 0.42 && G.abAmt >= 0.42) audio.ab();
    G.dist += G.spd * dt;
    if (G.mode === 'play' && G.deadT <= 0) {
      G.clock += dt;
      G.stageDist += G.spd * dt;
      G.scoreAcc += G.spd * 0.42 * dt * (G.ab ? 1.5 : 1);
      if (G.scoreAcc >= 1) {
        const n = G.scoreAcc | 0;
        G.scoreAcc -= n;
        G.score += n;
        maybeBest();
      }
    }

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.mslCd > 0) G.mslCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fireGun();

    maybeSpawn(dt);
    updateDecos(dt);
    updateEnts(dt);
    updateShots(dt);
    updateMissiles(dt);
    updateIncoming(dt);
    if (G.mode === 'play' && G.deadT <= 0) updateLock(dt);
    updateFx(dt);

    if (G.ab && !REDUCE) {
      G.ghostT -= dt;
      if (G.ghostT <= 0) {
        G.ghostT = 0.045;
        const j = jetScreen();
        ghosts.push({ x: j.x, y: j.y, bank: G.bank, t: 0.18 });
      }
      if (Math.random() < 0.5) {
        smears.push({
          x: CX - G.px * 80 + rand(-30, 30),
          y: HORIZON + rand(10, 200),
          v: 420 + G.spd * 8,
          life: 0.18
        });
      }
    }
    for (let i = smears.length - 1; i >= 0; i--) {
      smears[i].y += smears[i].v * dt;
      smears[i].life -= dt;
      if (smears[i].life <= 0) smears.splice(i, 1);
    }

    if (G.deadT > 0) afterDeath(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.stageDist >= stageDef().len) nextStage();

    audio.tickEngine(clamp(G.spd / 52, 0, 1.2), G.mode === 'play' || G.mode === 'title');
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) hud();
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

  function drawSky(pal) {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON + 40);
    g.addColorStop(0, rgba(pal.skyTop, 1));
    g.addColorStop(0.55, rgba(pal.skyMid, 1));
    g.addColorStop(1, rgba(pal.skyHor, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const sunX = CX + 180 - G.px * 30;
    const sunY = 48 + G.py * 10;
    ctx.fillStyle = rgba(pal.sun, 0.9);
    ctx.beginPath();
    ctx.arc(sunX, sunY, stageDef().theme === 'city' ? 7 : 16, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(pal.sun, 0.12);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 38, 0, TAU);
    ctx.fill();

    const hor = HORIZON + G.py * 36;
    const shift = -G.px * 36;
    ctx.fillStyle = rgba(pal.mtn2, 1);
    ctx.beginPath();
    ctx.moveTo(-20, hor);
    for (let i = 0; i <= 10; i++) {
      const x = (VW / 10) * i + shift;
      const hgt = 28 + hash2(G.stage * 9 + i) * 42;
      ctx.lineTo(x, hor - hgt);
    }
    ctx.lineTo(VW + 20, hor);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(pal.mtn1, 1);
    ctx.beginPath();
    ctx.moveTo(-20, hor);
    for (let i = 0; i <= 12; i++) {
      const x = (VW / 12) * i + G.px * 8;
      const hgt = 16 + hash2(G.stage * 5 + i + 3) * 28;
      ctx.lineTo(x, hor - hgt);
    }
    ctx.lineTo(VW + 20, hor);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba(WHT, 0.25);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, hor);
    ctx.lineTo(VW, hor);
    ctx.stroke();
    ctx.fillStyle = rgba(pal.fog, 0.25);
    ctx.fillRect(0, hor - 6, VW, 14);
  }

  function drawGround(pal) {
    const vpX = CX - G.px * 110;
    const hor = HORIZON + G.py * 36;
    const rows = 30;
    const theme = stageDef().theme;
    for (let i = 0; i < rows; i++) {
      const t0 = i / rows;
      const t1 = (i + 1) / rows;
      const p0 = t0 * t0;
      const p1 = t1 * t1;
      const y0 = hor + (VH - hor) * p0;
      const y1 = hor + (VH - hor) * p1;
      const w0 = 28 + p0 * 2400;
      const w1 = 28 + p1 * 2400;
      const zA = 2.6 / (0.1 + p1 * 1.5);
      const band = ((G.dist * 0.2 + zA * 1.15) | 0) & 1;
      let c = band ? pal.g1 : pal.g2;
      if (theme === 'city') {
        c = band ? pal.g1 : pal.g2;
      }
      quad(vpX - w0 * 0.5, y0, vpX + w0 * 0.5, y0, vpX + w1 * 0.5, y1, vpX - w1 * 0.5, y1, c, 1);
      if (band && theme === 'sea') {
        ctx.strokeStyle = rgba(WHT, 0.08 + p1 * 0.08);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vpX - w1 * 0.48, y1);
        ctx.lineTo(vpX + w1 * 0.48, y1);
        ctx.stroke();
      }
      if (theme === 'city' && (i % 3) === 0) {
        ctx.strokeStyle = rgba((i % 6) === 0 ? MAG : CYN, 0.18 + p1 * 0.2);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vpX, y0);
        ctx.lineTo(vpX - w1 * 0.12, y1);
        ctx.moveTo(vpX, y0);
        ctx.lineTo(vpX + w1 * 0.12, y1);
        ctx.stroke();
      }
    }
    ctx.strokeStyle = rgba(pal.gLine, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vpX, hor);
    ctx.lineTo(vpX, VH);
    ctx.stroke();
  }

  function drawDeco(d) {
    const p = project(d.x, d.y + d.h * 0.35, d.z);
    const sc = p.s * 0.018;
    const w = d.w * 38 * sc * 12;
    const h = d.h * 42 * sc * 12;
    if (p.y > VH + 20 || w < 1) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    const theme = d.k;
    if (theme === 'island') {
      ctx.fillStyle = rgba([18, 90, 64], 1);
      ctx.beginPath();
      ctx.ellipse(0, h * 0.35, w * 0.7, h * 0.22, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba([40, 160, 90], 1);
      ctx.beginPath();
      ctx.moveTo(-w * 0.15, h * 0.2);
      ctx.lineTo(0, -h * 0.55);
      ctx.lineTo(w * 0.15, h * 0.2);
      ctx.fill();
    } else if (theme === 'cliff' || theme === 'mesa') {
      ctx.fillStyle = rgba(theme === 'cliff' ? [120, 48, 32] : [160, 80, 40], 1);
      ctx.fillRect(-w * 0.4, -h * 0.6, w * 0.8, h);
      ctx.fillStyle = rgba([80, 28, 18], 1);
      ctx.fillRect(-w * 0.4, -h * 0.6, w * 0.8, h * 0.12);
    } else if (theme === 'build' || theme === 'tower') {
      const bw = theme === 'tower' ? w * 0.35 : w * 0.55;
      ctx.fillStyle = rgba([18, 16, 40], 1);
      ctx.fillRect(-bw * 0.5, -h, bw, h);
      ctx.fillStyle = rgba((d.col & 1) ? MAG : CYN, 0.7);
      const rows = 3 + (d.col % 4);
      for (let r = 0; r < rows; r++) {
        ctx.fillRect(-bw * 0.32, -h + 6 + r * (h / (rows + 1)), bw * 0.18, 3);
        ctx.fillRect(bw * 0.08, -h + 6 + r * (h / (rows + 1)), bw * 0.18, 3);
      }
    } else {
      ctx.fillStyle = rgba([90, 90, 100], 1);
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, h * 0.2);
      ctx.lineTo(0, -h * 0.3);
      ctx.lineTo(w * 0.45, h * 0.2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawCloud(c) {
    const p = project(c.x, c.y, c.z);
    const sc = p.s * 0.04 * c.s;
    ctx.fillStyle = rgba(WHT, 0.16);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 28 * sc, 10 * sc, 0, 0, TAU);
    ctx.fill();
  }

  function drawCraft(x, y, s, bank, col, type, flame) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(bank);
    ctx.scale(s, s);
    ctx.fillStyle = rgba(col, 1);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(7, 4);
    ctx.lineTo(0, 8);
    ctx.lineTo(-7, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(mix(col, WHT, 0.35), 1);
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(3, -2);
    ctx.lineTo(-3, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(col, 1);
    ctx.beginPath();
    ctx.moveTo(-16, 2);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, 2);
    ctx.lineTo(6, 0);
    ctx.lineTo(5, 5);
    ctx.closePath();
    ctx.fill();
    if (type === 'bmb' || type === 'hvy') {
      ctx.fillRect(-10, -2, 6, 4);
      ctx.fillRect(4, -2, 6, 4);
    }
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(-2.2, -8, 4.4, 5);
    if (flame > 0) {
      const fl = 8 + flame * 16 + Math.sin(G.t * 40) * 3;
      ctx.fillStyle = rgba(FLM, 0.9);
      ctx.beginPath();
      ctx.moveTo(-3.2, 8);
      ctx.lineTo(0, 8 + fl);
      ctx.lineTo(3.2, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.moveTo(-1.6, 8);
      ctx.lineTo(0, 8 + fl * 0.65);
      ctx.lineTo(1.6, 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    const p = project(e.x, e.y, e.z);
    const sc = clamp(p.s * 0.042, 0.15, 2.4);
    let col = MAG;
    if (e.type === 'int') col = RED;
    if (e.type === 'bmb') col = [200, 160, 80];
    if (e.type === 'hvy') col = [255, 90, 70];
    if (e.type === 'fgt') col = PNK;
    drawCraft(p.x, p.y, sc, e.bank, col, e.type, 0.35);
  }

  function drawShot(s) {
    const p = project(s.x, s.y, s.z);
    const p2 = project(s.x, s.y, s.z + (s.from === 'p' ? 3.5 : -3));
    ctx.strokeStyle = rgba(s.from === 'p' ? GOLD : MAG, 0.9);
    ctx.lineWidth = s.from === 'p' ? 2.2 : 1.6;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  function drawMissile(m, enemy) {
    const p = project(m.x, m.y, m.z);
    ctx.fillStyle = rgba(enemy ? MAG : FLM, 1);
    ctx.beginPath();
    ctx.arc(p.x, p.y, clamp(p.s * 0.028, 2, 9), 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(enemy ? PNK : GOLD, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < m.trail.length; i++) {
      const t = project(m.trail[i].x, m.trail[i].y, m.trail[i].z);
      if (i === 0) ctx.moveTo(t.x, t.y);
      else ctx.lineTo(t.x, t.y);
    }
    ctx.stroke();
    if (enemy && m.z < 40) {
      const sz = 8 + (40 - m.z) * 0.35;
      ctx.strokeStyle = rgba(MAG, 0.7);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
    }
  }

  function drawPlayer() {
    const j = jetScreen();
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0 && G.deadT <= 0) return;
    for (let i = 0; i < ghosts.length; i++) {
      const g = ghosts[i];
      ctx.globalAlpha = clamp(g.t * 3.2, 0, 0.35);
      drawCraft(g.x, g.y, 1.05, g.bank, CYN, 'fgt', 0);
      ctx.globalAlpha = 1;
    }
    if (G.deadT > 0) return;
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.arc(j.x - 16, j.y - 8, 5, 0, TAU);
      ctx.arc(j.x + 16, j.y - 8, 5, 0, TAU);
      ctx.fill();
    }
    drawCraft(j.x, j.y, 1.34, G.bank, HOT, 'fgt', 0.4 + G.abAmt * 1.3);
  }

  function drawLock() {
    const e = G.lock.ent;
    if (!e || e.dead) {
      const j = jetScreen();
      ctx.strokeStyle = rgba(CYN, 0.28);
      ctx.lineWidth = 1;
      ctx.strokeRect(j.x - 48, j.y - 118, 96, 78);
      return;
    }
    const p = project(e.x, e.y, e.z);
    const need = isSonic() ? 0.28 : 0.4;
    const k = G.lock.locked ? 1 : clamp(G.lock.t / need, 0, 1);
    const sz = lerp(28, 14, k) + p.s * 0.04;
    ctx.strokeStyle = rgba(G.lock.locked ? MAG : CYN, 0.4 + k * 0.6);
    ctx.lineWidth = G.lock.locked ? 2.4 : 1.5;
    ctx.strokeRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
    ctx.beginPath();
    ctx.moveTo(p.x - sz - 4, p.y);
    ctx.lineTo(p.x - sz + 6, p.y);
    ctx.moveTo(p.x + sz - 6, p.y);
    ctx.lineTo(p.x + sz + 4, p.y);
    ctx.moveTo(p.x, p.y - sz - 4);
    ctx.lineTo(p.x, p.y - sz + 6);
    ctx.moveTo(p.x, p.y + sz - 6);
    ctx.lineTo(p.x, p.y + sz + 4);
    ctx.stroke();
    if (G.lock.locked) {
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.font = 'bold 11px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOCK', p.x, p.y - sz - 6);
    }
  }

  function drawSmear() {
    if (REDUCE) return;
    ctx.save();
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      ctx.strokeStyle = rgba(WHT, clamp(s.life * 2.2, 0, 0.28));
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 18);
      ctx.lineTo(s.x, s.y + 28);
      ctx.stroke();
    }
    if (G.abAmt > 0.35) {
      const vpX = CX - G.px * 90;
      const hor = HORIZON + G.py * 36;
      ctx.strokeStyle = rgba(CYN, 0.08 + G.abAmt * 0.12);
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + G.t * 0.4;
        ctx.beginPath();
        ctx.moveTo(vpX, hor);
        ctx.lineTo(vpX + Math.cos(a) * 520, hor + 40 + Math.sin(a) * 80 + 180);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawHudCanvas() {
    if (G.warn > 0.12 && G.mode === 'play') {
      const a = 0.1 + G.warn * 0.22 + Math.sin(G.t * 16) * 0.06;
      ctx.fillStyle = rgba(MAG, a);
      ctx.fillRect(0, 0, VW, 8);
      ctx.fillRect(0, VH - 8, VW, 8);
      ctx.fillRect(0, 0, 8, VH);
      ctx.fillRect(VW - 8, 0, 8, VH);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.font = 'bold 16px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('来弹  MISSILE', CX, 36);
    }
    if (G.abAmt > 0.7 && G.mode === 'play') {
      ctx.fillStyle = rgba(FLM, 0.8);
      ctx.font = 'bold 12px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('AFTERBURNER', 18, VH - 16);
    }
    const prog = clamp(G.stageDist / stageDef().len, 0, 1);
    ctx.fillStyle = rgba(WHT, 0.12);
    ctx.fillRect(CX - 80, 10, 160, 4);
    ctx.fillStyle = rgba(CYN, 0.8);
    ctx.fillRect(CX - 80, 10, 160 * prog, 4);
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
      ctx.font = 'bold 18px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pw = stageEl ? stageEl.clientWidth : 800;
    const ph = stageEl ? stageEl.clientHeight : 450;
    if (pw !== W || ph !== H || canvas.width !== (pw * dpr | 0)) resize();

    const pal = palette();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#041018';
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

    const list = [];
    for (let i = 0; i < clouds.length; i++) list.push({ z: clouds[i].z, k: 'c', i: i });
    for (let i = 0; i < decos.length; i++) list.push({ z: decos[i].z, k: 'd', i: i });
    for (let i = 0; i < ents.length; i++) {
      if (!ents[i].dead) list.push({ z: ents[i].z, k: 'e', i: i });
    }
    for (let i = 0; i < shots.length; i++) list.push({ z: shots[i].z, k: 's', i: i });
    for (let i = 0; i < missiles.length; i++) list.push({ z: missiles[i].z, k: 'm', i: i });
    for (let i = 0; i < incoming.length; i++) list.push({ z: incoming[i].z, k: 'n', i: i });
    list.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (it.k === 'c') drawCloud(clouds[it.i]);
      else if (it.k === 'd') drawDeco(decos[it.i]);
      else if (it.k === 'e') drawEnemy(ents[it.i]);
      else if (it.k === 's') drawShot(shots[it.i]);
      else if (it.k === 'm') drawMissile(missiles[it.i], false);
      else drawMissile(incoming[it.i], true);
    }

    drawSmear();
    drawPlayer();
    if (G.mode === 'play' && G.deadT <= 0) drawLock();
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
    G.kind = kind === 'sonic' ? 'sonic' : 'cruise';
    G.stage = 1;
    G.t = 0;
    G.clock = 0;
    G.dist = 0;
    G.stageDist = 0;
    G.px = 0;
    G.py = 0;
    G.vx = 0;
    G.vy = 0;
    G.bank = 0;
    G.spd = isSonic() ? 32 : 22;
    G.ab = false;
    G.abAmt = 0;
    G.score = 0;
    G.scoreAcc = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.missiles = isSonic() ? 8 : 10;
    G.nextLife = LIFE_EVERY;
    G.fireCd = 0;
    G.mslCd = 0;
    G.deadT = 0;
    G.invuln = 1.1;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.warn = 0;
    G.spawnT = 0.7;
    G.heavy = false;
    G.why = '';
    clearField();
    seedWorld();
    hideOverlay();
    hud();
    audio.start();
    toast(isSonic() ? '超音速 · 来弹更密' : '巡航 · 远海', false, true);
    setHint('空格机炮 · Z 导弹（锁定后）· 按住上 加力躲来弹', '');
    if (scoreEl) scoreEl.textContent = '0';
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'cruise';
    G.stage = 1;
    G.lives = LIVES;
    G.missiles = 10;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.score = 0;
    G.px = 0;
    G.py = 0;
    G.spd = 26;
    G.abAmt = 0.4;
    clearField();
    seedWorld();
    showOverlay('title', '超音', '冲进画面。锁定导弹，躲开来弹，按住上加力。');
    setHint('方向移动 · 空格机炮 · Z 锁定导弹 · 按住上 加力 · 躲来弹', '');
    hud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('cruise');
    else startGame(G.kind || 'cruise');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('cruise');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMsl = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
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

    if (down && (isMove || space || isMsl || k === 'Enter')) e.preventDefault();

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
      startGame('cruise');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('sonic');
      return;
    }
    if (isMsl) {
      if (!e.repeat) tryMissile();
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
      if (G.mode === 'title') startGame('cruise');
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

  if (btnCruise) {
    btnCruise.addEventListener('click', function () {
      audio.ensure();
      startGame('cruise');
    });
  }
  if (btnSonic) {
    btnSonic.addEventListener('click', function () {
      audio.ensure();
      startGame('sonic');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'cruise');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMsl) btnMsl.addEventListener('click', function () {
    audio.ensure();
    tryMissile();
  });
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
