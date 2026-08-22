'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const CX = 240;
  const HORIZON = 148;
  const FOCAL = 280;
  const YK = 2900;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.45;
  const FIRE_CD = 0.11;
  const MAX_SHOTS = 3;
  const SHOT_VZ = 28;
  const PZ = 5.45;
  const PZ_MIN = 4.35;
  const PZ_MAX = 8.6;
  const PX_MAX = 3.65;
  const MOVE_X = 5.4;
  const MOVE_Z = 2.6;
  const WARP_HOLD = 0.16;
  const WARP_DUR = 0.42;
  const WARP_SKIP = 12;
  const WARP_N = 3;
  const FUEL0 = 99;
  const COMBAT_Z = 17.5;
  const BEST_KEY = 'playbox-juno-first-best';
  const MUTE_KEY = 'playbox-juno-first-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格开火 · 按住上跃迁 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [77, 140, 255];
  const SKY = [121, 180, 255];
  const HOT = [126, 200, 255];
  const GOLD = [255, 227, 107];
  const ORG = [255, 140, 64];
  const RED = [255, 72, 96];
  const WHT = [246, 250, 255];
  const PNK = [255, 154, 212];
  const PUR = [168, 132, 255];
  const MINT = [80, 240, 210];

  const KIND_RGB = {
    scout: CYN,
    fighter: SKY,
    bomber: GOLD,
    mutant: MAG,
    homer: PUR,
    mother: ORG,
    rock: [180, 170, 150]
  };

  const WAVES = [
    {
      name: '先锋',
      jobs: [
        { t: 0.4, form: 'v', kind: 'scout', n: 7 }
      ]
    },
    {
      name: '横列',
      jobs: [
        { t: 0.3, form: 'line', kind: 'fighter', n: 8 },
        { t: 2.6, form: 'rock', kind: 'rock', n: 1 },
        { t: 4.2, form: 'line', kind: 'bomber', n: 4 }
      ]
    },
    {
      name: '母舰',
      jobs: [
        { t: 0.35, form: 'mother', kind: 'mother', n: 1 },
        { t: 0.8, form: 'v', kind: 'scout', n: 6 },
        { t: 5.4, form: 'line', kind: 'fighter', n: 6 }
      ]
    },
    {
      name: '菱阵',
      jobs: [
        { t: 0.3, form: 'diamond', kind: 'fighter', n: 8 },
        { t: 3.6, form: 'circle', kind: 'scout', n: 8 },
        { t: 6.8, form: 'line', kind: 'homer', n: 5 }
      ]
    },
    {
      name: '双牙',
      jobs: [
        { t: 0.25, form: 'pincer', kind: 'scout', n: 10 },
        { t: 2.4, form: 'rock', kind: 'rock', n: 1 },
        { t: 3.8, form: 'v', kind: 'fighter', n: 7 },
        { t: 7.2, form: 'line', kind: 'bomber', n: 4 }
      ]
    },
    {
      name: '双母',
      jobs: [
        { t: 0.3, form: 'twins', kind: 'mother', n: 2 },
        { t: 1.1, form: 'arrow', kind: 'fighter', n: 7 },
        { t: 5.8, form: 'circle', kind: 'homer', n: 6 }
      ]
    },
    {
      name: '夹击',
      jobs: [
        { t: 0.25, form: 'pincer', kind: 'fighter', n: 10 },
        { t: 2.2, form: 'snake', kind: 'scout', n: 8 },
        { t: 4.6, form: 'line', kind: 'bomber', n: 5 },
        { t: 6.4, form: 'rock', kind: 'rock', n: 1 },
        { t: 7.6, form: 'diamond', kind: 'homer', n: 6 }
      ]
    },
    {
      name: '旗舰',
      jobs: [
        { t: 0.35, form: 'flag', kind: 'mother', n: 1 },
        { t: 0.9, form: 'v', kind: 'fighter', n: 8 },
        { t: 3.4, form: 'pincer', kind: 'scout', n: 10 },
        { t: 6.4, form: 'line', kind: 'bomber', n: 5 },
        { t: 8.6, form: 'circle', kind: 'homer', n: 6 }
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
  const btnCamp = document.getElementById('btn-camp');
  const btnEnd = document.getElementById('btn-end');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const warpLabel = document.getElementById('warp-label');
  const fuelWrap = document.getElementById('fuel-wrap');
  const fuelBar = document.getElementById('fuel-bar');
  const fuelNum = document.getElementById('fuel-num');
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
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 0, y: VH - 80, id: null, warp: false, back: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'camp',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    player: { x: 0, z: PZ, vx: 0, vz: 0 },
    enemies: [],
    shots: [],
    bombs: [],
    pickups: [],
    queue: [],
    qT: 0,
    fireCd: 0,
    fireHold: false,
    ready: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    toastT: 0,
    why: '',
    fuel: FUEL0,
    warps: WARP_N,
    warpHold: 0,
    warpT: 0,
    warpVis: 0,
    warpCd: 0,
    thrust: 0,
    mysteryT: 0,
    mysteryN: 0,
    muzzle: 0,
    demoT: 0.4,
    fuelWarn: false,
    gridOff: 0
  };

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
  function isCamp() {
    return G.kind !== 'frenzy';
  }
  function isFrenzy() {
    return G.kind === 'frenzy';
  }
  function waveOf() {
    return WAVES[(Math.max(1, G.wave) - 1) % WAVES.length];
  }
  function diff() {
    const loop = Math.floor((G.wave - 1) / 8);
    return 1 + (G.wave - 1) * 0.045 + (isFrenzy() ? 0.34 : 0) + loop * 0.18;
  }
  function rgbOf(e) {
    if (e.hitFlash > 0) return WHT;
    if (e.kind === 'mother' && e.hp <= 3) return MAG;
    return KIND_RGB[e.kind] || CYN;
  }

  function project(wx, wz) {
    const z = Math.max(2.4, wz);
    const inv = 1 / z;
    const stretch = 1 + G.warpVis * 0.62;
    return {
      x: CX + wx * FOCAL * inv,
      y: HORIZON + YK * inv * stretch,
      s: 92 * inv * (1 + G.warpVis * 0.12),
      inv: inv
    };
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
    shoot() {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.028, 1680);
      this.beep(440, 0.04, 'triangle', 0.014, 220);
    },
    hit(kind, combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.032);
      const base = kind === 'mother' ? 280 : kind === 'mutant' ? 820 : kind === 'bomber' ? 520 : 640;
      this.noise(0.04, 0.034, 1100);
      this.beep(base * lift, 0.07, 'square', 0.046, base * lift * 1.5);
    },
    chip() {
      this.ensure();
      this.beep(240, 0.05, 'sawtooth', 0.034, 170);
      this.beep(620, 0.07, 'square', 0.028, 920);
    },
    explode() {
      this.ensure();
      this.noise(0.12, 0.05, 460);
      this.beep(260, 0.16, 'sawtooth', 0.044, 64);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.026, 1320);
    },
    warp() {
      this.ensure();
      this.noise(0.18, 0.048, 240);
      this.beep(140, 0.28, 'sawtooth', 0.042, 70);
      this.beep(392, 0.16, 'sine', 0.04, 784);
      this.beep(784, 0.22, 'triangle', 0.034, 1568);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.054, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 62);
      this.beep(150, 0.3, 'sine', 0.044, 40);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'sine', 0.04, 659);
      this.beep(784, 0.18, 'triangle', 0.044, 1046);
    },
    mystery() {
      this.ensure();
      this.beep(523, 0.09, 'square', 0.044, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1175);
      this.beep(1046, 0.2, 'sine', 0.038, 1568);
    },
    bomb() {
      this.ensure();
      this.beep(190, 0.05, 'square', 0.02, 120);
    },
    miss() {
      this.ensure();
      this.beep(160, 0.05, 'sine', 0.014, 80);
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
      this.beep(784, 0.14, 'triangle', 0.034, 1175);
    },
    fuel() {
      this.ensure();
      this.beep(220, 0.08, 'square', 0.03, 140);
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

  function bumpCombo() {
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
    }
    comboTok += 1;
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.15;
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

  function warpPips() {
    let s = '';
    for (let i = 0; i < WARP_N; i++) s += i < G.warps ? '●' : '○';
    return s;
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const w = waveOf();
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '朱诺';
      else if (G.warpT > 0) stageLabel.textContent = '跃迁';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.wave % 8 === 0 || G.warpT > 0 || G.mysteryT > 0));
    }
    if (tagLabel) {
      let tag = isCamp() ? '突进' : '乱舞';
      if (G.mode === 'play') tag = w.name;
      if (G.mode === 'play' && G.mysteryT > 0) tag = '人型 ×' + Math.max(1, G.mysteryN);
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || G.fuel < 18);
      tagLabel.classList.toggle('hot', G.mysteryT > 0 || G.combo >= 8 || (G.mode === 'play' && G.wave % 8 === 0));
    }
    if (warpLabel) {
      warpLabel.textContent = '跃迁 ' + warpPips();
      warpLabel.classList.toggle('hot', G.warpT > 0 || G.warpVis > 0.4);
      warpLabel.classList.toggle('warn', G.mode === 'play' && G.warps === 0);
    }
    if (fuelNum) fuelNum.textContent = String(Math.max(0, Math.ceil(G.fuel)));
    if (fuelBar) fuelBar.style.transform = 'scaleX(' + clamp(G.fuel / FUEL0, 0, 1) + ')';
    if (fuelWrap) fuelWrap.classList.toggle('warn', G.fuel < 22 && G.mode === 'play');
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult >= 2 ? '连击 ×' + G.mult : '连击 ' + G.combo;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或相撞扣命', 'warn');
    else if (G.mode === 'win') setHint('编队肃清 · R 再来', 'hot');
    else if (G.warpT > 0) setHint('跃迁拉伸 · 空域被撕开', 'hot');
    else if (G.mysteryT > 0) setHint('人型加分 · 击坠节节高', 'hot');
    else if (G.fuel < 18) setHint('燃料告急 · 清波才补', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 躲开白弹和机体', 'warn');
    else setHint('方向飞 · 空格开火 · 按住上跃迁跳过空域', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'JUNO';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (btnCamp) btnCamp.textContent = primary;
    if (btnEnd) {
      btnEnd.textContent = secondary;
      btnEnd.classList.remove('hidden');
    }
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

  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : mag >= 4.2 ? 'warp' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('warp');
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

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v * 0.72 - v * 0.12,
        g: 48,
        life: rand(0.22, 0.55),
        max: 0.55,
        r: rand(1.2, 3.1),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 160);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 24);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 14);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.72, vy: -52, text: text, rgb: rgb });
    capArr(floats, 16);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: rand(-14, 14),
        z: rand(4, 48),
        spd: rand(1.6, 5.5),
        r: Math.random() < 0.7 ? 0.7 : 1.2,
        a: rand(0.28, 0.9),
        rgb: Math.random() < 0.14 ? CYN : Math.random() < 0.1 ? MAG : Math.random() < 0.1 ? GOLD : WHT
      });
    }
  }

  function aliveCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function nearestZ() {
    let z = 99;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.age >= 0 && e.z < z) z = e.z;
    }
    return z;
  }

  function canSkip() {
    if (G.warps <= 0 || G.warpCd > 0 || G.warpT > 0) return false;
    if (G.queue.length === 0 && aliveCount() === 0) return false;
    return nearestZ() > COMBAT_Z;
  }

  function enqueue(t, fn) {
    G.queue.push({ t: t, spawn: fn });
  }

  function motherHp() {
    const flag = G.wave % 8 === 0;
    return (flag ? 12 : 8) + (isFrenzy() ? 3 : 0) + Math.floor((G.wave - 1) / 8);
  }

  function spawnOne(kind, x, z, delay, hpAdd) {
    const mother = kind === 'mother';
    const rock = kind === 'rock';
    const hp = mother ? motherHp() + (hpAdd || 0) : rock ? 2 : 1;
    G.enemies.push({
      kind: kind,
      x: x,
      z: z,
      homeX: x,
      homeZ: z,
      hp: hp,
      maxHp: hp,
      age: -(delay || 0),
      state: mother ? 'hold' : 'form',
      phase: rand(0, TAU),
      shootT: rand(0.7, 1.9),
      spawnT: rand(1.6, 2.6),
      hitFlash: 0,
      alive: true,
      mutateT: 7.2 + rand(0, 2.2),
      weave: rand(0.55, 1.35)
    });
  }

  function spawnFormation(form, kind, n, z0) {
    z0 = z0 || 30;
    if (form === 'rock') {
      spawnOne('rock', rand(-2.6, 2.6), z0 + rand(0, 4), 0);
      return;
    }
    if (form === 'mother') {
      spawnOne('mother', 0, z0 - 2, 0);
      return;
    }
    if (form === 'twins') {
      spawnOne('mother', -2.35, z0 - 1, 0);
      spawnOne('mother', 2.35, z0, 0.18);
      return;
    }
    if (form === 'flag') {
      spawnOne('mother', 0, z0 - 3, 0, 2);
      return;
    }
    const count = Math.max(1, n);
    for (let i = 0; i < count; i++) {
      const c = i - (count - 1) * 0.5;
      let x = 0;
      let z = z0;
      if (form === 'v') {
        x = c * 0.92;
        z = z0 + Math.abs(c) * 1.2;
      } else if (form === 'line') {
        x = c * 1.02;
        z = z0 + (i % 2) * 0.7;
      } else if (form === 'diamond') {
        const a = (i / count) * TAU;
        x = Math.cos(a) * 2.9;
        z = z0 + Math.sin(a) * 2.4;
      } else if (form === 'arrow') {
        x = c * 0.88;
        z = z0 + (Math.abs(c) * -1.05) + 3;
      } else if (form === 'circle') {
        const a = (i / count) * TAU;
        x = Math.cos(a) * 3.15;
        z = z0 + Math.sin(a) * 1.8;
      } else if (form === 'pincer') {
        const left = i < count / 2;
        const k = left ? i : i - Math.floor(count / 2);
        x = (left ? -1 : 1) * (2.2 + k * 0.42);
        z = z0 + k * 0.85;
      } else if (form === 'snake') {
        x = Math.sin(i * 0.72) * 3.1;
        z = z0 + i * 0.95;
      } else {
        x = c * 0.95;
        z = z0;
      }
      spawnOne(kind, x, z, i * 0.07);
    }
  }

  function spawnWaveJobs() {
    G.queue = [];
    const idx = (G.wave - 1) % WAVES.length;
    const w = WAVES[idx];
    const extra = isFrenzy() ? 2 : 0;
    const tMul = isFrenzy() ? 0.76 : 1;
    for (let i = 0; i < w.jobs.length; i++) {
      const job = w.jobs[i];
      enqueue(job.t * tMul, (function (j, ex) {
        return function () {
          const n = j.kind === 'mother' || j.kind === 'rock' ? j.n : j.n + ex;
          spawnFormation(j.form, j.kind, n, 30);
        };
      })(job, extra));
    }
    if (isFrenzy()) {
      enqueue(1.55 * tMul, function () {
        spawnFormation('v', 'scout', 5 + extra, 33);
      });
      if (G.wave >= 4) {
        enqueue(4.8 * tMul, function () {
          spawnFormation('line', 'homer', 4 + extra, 31);
        });
      }
    }
  }

  function scoreFor(e, kill) {
    const near = e.z < 12;
    if (e.kind === 'scout') return near ? 160 : 80;
    if (e.kind === 'fighter') return near ? 240 : 120;
    if (e.kind === 'bomber') return near ? 320 : 160;
    if (e.kind === 'mutant') return near ? 440 : 220;
    if (e.kind === 'homer') return near ? 360 : 180;
    if (e.kind === 'rock') return 200;
    if (e.kind === 'mother') return kill ? (near ? 2500 : 1500) : 100;
    return 80;
  }

  function dropHuman(e) {
    G.pickups.push({
      kind: 'human',
      x: e.x,
      z: e.z,
      vx: rand(-0.4, 0.4),
      alive: true,
      t: 0
    });
  }

  function hurtEnemy(e) {
    const p = project(e.x, e.z);
    e.hp -= 1;
    e.hitFlash = 0.09;
    if (e.hp > 0) {
      const n = scoreFor(e, false) * G.mult;
      bumpCombo();
      addScore(n);
      burst(p.x, p.y, GOLD, 8, 110);
      spark(p.x, p.y, WHT);
      floatText(p.x, p.y, String(n), GOLD);
      audio.chip();
      hitStop(0.032);
      kick(2.1);
      return;
    }
    let n = scoreFor(e, true) * G.mult;
    if (G.mysteryT > 0 && e.kind !== 'rock') {
      G.mysteryN += 1;
      n += 200 * G.mysteryN;
    }
    bumpCombo();
    addScore(n);
    const rgb = rgbOf(e);
    const big = e.kind === 'mother';
    burst(p.x, p.y, rgb, big ? 28 : 14, big ? 240 : 170);
    spark(p.x, p.y, rgb);
    ring(p.x, p.y, rgb);
    floatText(p.x, p.y, String(n), rgb);
    audio.hit(e.kind, G.combo);
    if (big) audio.explode();
    hitStop(big ? 0.078 : 0.042);
    kick(big ? 5.6 : 3.2);
    screenFlash(rgb, big ? 0.32 : 0.12);
    e.alive = false;
    if (e.kind === 'rock') dropHuman(e);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    if (G.shots.length >= MAX_SHOTS) return;
    G.fireCd = FIRE_CD;
    G.muzzle = 0.07;
    G.shots.push({ x: G.player.x, z: G.player.z + 0.35, hit: false });
    audio.shoot();
  }

  function spawnWBomb(e) {
    if (G.mode !== 'play') return;
    let n = 0;
    for (let i = 0; i < G.bombs.length; i++) if (G.bombs[i].kind === 'white') n += 1;
    if (n >= (isFrenzy() ? 10 : 7)) return;
    G.bombs.push({
      kind: 'white',
      x: e.x,
      z: e.z + 0.2,
      vx: 0,
      vz: -3.4 - diff() * 0.35,
      alive: true
    });
    audio.bomb();
  }

  function spawnHBomb(e) {
    if (G.mode !== 'play') return;
    let n = 0;
    for (let i = 0; i < G.bombs.length; i++) if (G.bombs[i].kind === 'home') n += 1;
    if (n >= (isFrenzy() ? 8 : 5)) return;
    G.bombs.push({
      kind: 'home',
      x: e.x,
      z: e.z + 0.2,
      vx: 0,
      vz: -4.2 - diff() * 0.4,
      alive: true
    });
    audio.bomb();
  }

  function spawnDrone(e) {
    if (aliveCount() > 28) return;
    const side = Math.random() < 0.5 ? -1 : 1;
    spawnOne('scout', e.x + side * rand(0.6, 1.4), e.z + 1.2, 0);
  }

  function doWarp() {
    G.warps -= 1;
    G.warpT = WARP_DUR;
    G.warpVis = 1;
    G.warpHold = 0;
    G.warpCd = 0.55;
    G.qT += 2.35;
    audio.warp();
    screenFlash(CYN, 0.42);
    kick(4.8);
    G.punch = 1.055;
    toast('跃迁', false, true);
    for (let i = 0; i < 18; i++) {
      const p = project(rand(-4, 4), rand(6, 22));
      burst(p.x, p.y, i % 2 ? CYN : WHT, 3, 90);
    }
  }

  function collectHuman(p) {
    p.alive = false;
    G.mysteryT = 10;
    G.mysteryN = 0;
    audio.mystery();
    screenFlash(MAG, 0.4);
    hitStop(0.055);
    kick(4);
    const n = 500 * G.mult;
    addScore(n);
    const sp = project(p.x, p.z);
    floatText(sp.x, sp.y, '人型', GOLD);
    toast('人型捕获', false, true);
  }

  function die(why) {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.mysteryT = 0;
    G.fireHold = false;
    G.thrust = 0;
    G.why = why || '舰毁了';
    const p = project(G.player.x, G.player.z);
    burst(p.x, p.y, MAG, 32, 260);
    ring(p.x, p.y, MAG);
    spark(p.x, p.y, WHT);
    audio.death();
    hitStop(0.072);
    kick(7);
    screenFlash(MAG, 0.52);
    G.bombs = [];
  }

  function waveClear() {
    const fuelB = Math.ceil(G.fuel) * 10 * G.wave;
    const warpB = G.warps * 500 * G.wave;
    const n = fuelB + warpB;
    if (n > 0) addScore(n);
    screenFlash(GOLD, 0.28);
    hitStop(0.05);
    kick(3.4);
    if (G.wave >= 8) {
      if (n > 0) toast('清波 +' + n, false, true);
      winRun();
      return;
    }
    enterWave(G.wave + 1);
  }

  function winRun() {
    const bonus = isCamp() ? 8000 : 10000;
    addScore(bonus);
    G.mode = 'win';
    G.fireHold = false;
    audio.win();
    screenFlash(GOLD, 0.5);
    hitStop(0.06);
    kick(4);
    const title = isCamp() ? '航线通关' : '乱舞通关';
    const lead = (isCamp() ? '旗舰粉碎。' : '乱舞编队打穿。') + ' 本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('win', title, lead, '再来', isCamp() ? '乱舞' : '换模式');
    syncHud();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why;
    G.fireHold = false;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    const lead = (why || '舰毁了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '舰毁了', lead, '再来', '换模式');
    syncHud();
  }

  function resetField() {
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.pickups = [];
    G.queue = [];
    G.qT = 0;
    G.player.x = 0;
    G.player.z = PZ;
    G.player.vx = 0;
    G.player.vz = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.muzzle = 0;
    G.warpHold = 0;
    G.warpT = 0;
    G.warpVis = 0;
    G.warpCd = 0;
    G.thrust = 0;
    G.mysteryT = 0;
    G.mysteryN = 0;
    G.ready = 0;
    G.stop = 0;
    G.fuel = FUEL0;
    G.warps = WARP_N;
    G.fuelWarn = false;
    G.wave = 1;
  }

  function enterWave(n) {
    G.wave = n;
    G.fuel = FUEL0;
    G.warps = WARP_N;
    G.warpT = 0;
    G.warpHold = 0;
    G.warpCd = 0;
    G.ready = 0.85;
    G.qT = 0;
    G.queue = [];
    G.enemies = [];
    G.shots = [];
    G.bombs = [];
    G.pickups = [];
    G.mysteryT = 0;
    G.mysteryN = 0;
    G.fuelWarn = false;
    G.player.z = PZ;
    spawnWaveJobs();
    const w = waveOf();
    toast(w.name, false, n % 8 === 0);
    audio.wave();
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'frenzy' ? 'frenzy' : 'camp';
    G.mode = 'play';
    G.lives = LIVES;
    G.score = 0;
    G.why = '';
    G.clock = 0;
    G.next1up = LIFE_EVERY;
    resetField();
    hideOverlay();
    audio.start();
    enterWave(1);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'camp';
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    resetField();
    G.demoT = 0.35;
    G.fuel = FUEL0;
    G.warps = WARP_N;
    showOverlay('title', '朱诺', '透视网格。编队从深处压来。按住上跃迁跳过空域。母舰与燃料。', '突进', '乱舞');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('camp');
    else startGame(G.kind || 'camp');
  }

  function updateQueue(dt) {
    if (G.ready > 0) return;
    G.qT += dt;
    while (G.queue.length && G.qT >= G.queue[0].t) {
      const job = G.queue.shift();
      job.spawn();
    }
  }

  function wantWarp() {
    return keys.u || (pointer.down && pointer.warp);
  }
  function wantBack() {
    return keys.d || (pointer.down && pointer.back);
  }

  function updatePlayer(dt) {
    let ax = 0;
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const tx = clamp(pointer.x, -PX_MAX, PX_MAX);
      ax = 0;
      G.player.x = lerp(G.player.x, tx, clamp(12 * dt, 0, 1));
    } else {
      G.player.x += ax * MOVE_X * dt;
    }
    G.player.x = clamp(G.player.x, -PX_MAX, PX_MAX);

    G.thrust = 0;
    if (G.mode === 'play' && G.deadT <= 0 && !overlayOpen()) {
      if (wantWarp()) {
        if (canSkip()) {
          G.warpHold += dt;
          G.thrust = 0.35;
          if (G.warpHold >= WARP_HOLD) doWarp();
        } else {
          G.warpHold = 0;
          G.thrust = 1;
          G.player.z -= MOVE_Z * dt;
        }
      } else {
        G.warpHold = 0;
        if (wantBack()) G.player.z += MOVE_Z * 1.15 * dt;
      }
    }
    G.player.z = clamp(G.player.z, PZ_MIN, PZ_MAX);
    G.warpCd = Math.max(0, G.warpCd - dt);
    if (G.warpT > 0) {
      G.warpT -= dt;
      const k = (WARP_SKIP / WARP_DUR) * dt;
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].alive) G.enemies[i].z = Math.max(14.2, G.enemies[i].z - k);
      }
      for (let i = 0; i < G.bombs.length; i++) {
        if (G.bombs[i].alive) G.bombs[i].z = Math.max(10, G.bombs[i].z - k * 0.85);
      }
      for (let i = 0; i < G.pickups.length; i++) {
        if (G.pickups[i].alive) G.pickups[i].z = Math.max(8, G.pickups[i].z - k);
      }
      if (G.warpT < 0) G.warpT = 0;
    }
    G.warpVis = lerp(G.warpVis, G.warpT > 0 ? 1 : (G.thrust > 0.5 ? 0.28 : 0), G.warpT > 0 ? 0.35 : 0.12);
  }

  function enemySpd(e) {
    let s = 3.15 + diff() * 0.55;
    if (e.kind === 'bomber') s *= 0.72;
    if (e.kind === 'mother') s *= 0.42;
    if (e.kind === 'rock') s *= 0.55;
    if (e.kind === 'mutant') s *= 1.45;
    if (e.kind === 'homer') s *= 0.9;
    if (G.thrust > 0.5) s *= 1.55;
    if (G.warpT > 0) s *= 0.25;
    return s;
  }

  function updateEnemies(dt) {
    const px = G.player.x;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      e.age += dt;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      if (e.age < 0) continue;

      if (e.kind === 'scout' && e.state !== 'mutant' && e.age > e.mutateT && e.z < 22) {
        e.kind = 'mutant';
        e.state = 'dive';
        const p = project(e.x, e.z);
        ring(p.x, p.y, MAG);
        spark(p.x, p.y, MAG);
      }

      const spd = enemySpd(e);
      if (e.kind === 'mother' && e.state === 'hold') {
        e.z = lerp(e.z, 15.5, 0.55 * dt);
        e.x = Math.sin(e.age * 0.72 + e.phase) * 3.05;
        e.spawnT -= dt;
        if (e.spawnT <= 0 && G.mode === 'play') {
          e.spawnT = isFrenzy() ? 1.55 : 2.25;
          spawnDrone(e);
        }
        if (e.hp <= Math.max(2, e.maxHp * 0.28)) e.state = 'dive';
      } else if (e.kind === 'mutant' || e.state === 'dive') {
        e.x += (px - e.x) * 1.85 * dt;
        e.z -= spd * dt * 1.15;
      } else {
        e.z -= spd * dt;
        e.x = e.homeX + Math.sin(e.age * 1.35 * e.weave + e.phase) * (e.state === 'break' ? 1.15 : 0.45);
        if (e.state === 'form' && e.z < 16.5) e.state = 'break';
      }

      if (G.mode === 'play' && e.z < 22 && e.z > 7) {
        e.shootT -= dt;
        if (e.shootT <= 0) {
          const rate = (isFrenzy() ? 0.72 : 1) / diff();
          if (e.kind === 'bomber') {
            e.shootT = rand(1.35, 2.1) * rate;
            spawnWBomb(e);
          } else if (e.kind === 'homer' || e.kind === 'mutant') {
            e.shootT = rand(1.1, 1.85) * rate;
            spawnHBomb(e);
          } else if (e.kind === 'fighter' || e.kind === 'mother') {
            e.shootT = rand(1.25, 2.05) * rate;
            if (Math.random() < 0.55) spawnHBomb(e);
            else spawnWBomb(e);
          } else if (e.kind === 'scout' && e.state === 'break') {
            e.shootT = rand(1.8, 2.8) * rate;
            if (Math.random() < 0.45) spawnWBomb(e);
          } else {
            e.shootT = rand(1.6, 2.6);
          }
        }
      }

      if (e.z < 3.15) {
        if (e.kind === 'mother' || e.kind === 'mutant') {
          e.z = 28;
          e.x = rand(-3, 3);
          e.homeX = e.x;
          e.state = e.kind === 'mother' ? 'hold' : 'form';
        } else {
          e.z = 31;
          e.x = clamp(e.homeX + rand(-0.8, 0.8), -3.4, 3.4);
          e.homeX = e.x;
          e.state = 'form';
        }
      }
    }
    let w = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) G.enemies[w++] = G.enemies[i];
    }
    G.enemies.length = w;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.z += SHOT_VZ * dt;
      if (s.z > 42) {
        if (!s.hit) {
          breakCombo();
          audio.miss();
        }
        G.shots.splice(i, 1);
      }
    }
  }

  function updateBombs(dt) {
    for (let i = G.bombs.length - 1; i >= 0; i--) {
      const b = G.bombs[i];
      if (!b.alive) {
        G.bombs.splice(i, 1);
        continue;
      }
      if (b.kind === 'home') {
        b.x += (G.player.x - b.x) * 1.7 * dt;
      }
      b.z += b.vz * dt;
      if (G.thrust > 0.5) b.z -= 2.2 * dt;
      if (b.z < 3) G.bombs.splice(i, 1);
    }
  }

  function updatePickups(dt) {
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const p = G.pickups[i];
      if (!p.alive) {
        G.pickups.splice(i, 1);
        continue;
      }
      p.t += dt;
      p.z -= 2.8 * dt;
      p.x += p.vx * dt;
      p.x = clamp(p.x, -3.4, 3.4);
      if (p.z < 3.4 || p.t > 9) G.pickups.splice(i, 1);
    }
  }

  function collideShots() {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      let hit = false;
      for (let j = 0; j < G.bombs.length; j++) {
        const b = G.bombs[j];
        if (!b.alive || b.kind !== 'home') continue;
        if (Math.abs(s.x - b.x) < 0.42 && Math.abs(s.z - b.z) < 2.1) {
          b.alive = false;
          s.hit = true;
          hit = true;
          const p = project(b.x, b.z);
          burst(p.x, p.y, PUR, 8, 120);
          spark(p.x, p.y, WHT);
          bumpCombo();
          addScore(80 * G.mult);
          audio.hit('homer', G.combo);
          hitStop(0.03);
          break;
        }
      }
      if (hit) {
        G.shots.splice(i, 1);
        continue;
      }
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive || e.age < 0) continue;
        const rad = e.kind === 'mother' ? 1.45 : e.kind === 'rock' ? 0.7 : 0.52;
        if (Math.abs(s.x - e.x) < rad && s.z >= e.z - 0.9 && s.z <= e.z + 2.4) {
          s.hit = true;
          hurtEnemy(e);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function hitPlayer() {
    if (G.invuln > 0 || G.deadT > 0) return;
    const px = G.player.x;
    const pz = G.player.z;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.age < 0) continue;
      const rad = e.kind === 'mother' ? 1.15 : 0.48;
      if (Math.abs(e.x - px) < rad && Math.abs(e.z - pz) < 1.15) {
        die('相撞');
        return;
      }
    }
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (!b.alive) continue;
      if (Math.abs(b.x - px) < 0.4 && Math.abs(b.z - pz) < 1.05) {
        die(b.kind === 'white' ? '白弹' : '追踪弹');
        return;
      }
    }
  }

  function collectPickups() {
    if (G.deadT > 0) return;
    const px = G.player.x;
    const pz = G.player.z;
    for (let i = 0; i < G.pickups.length; i++) {
      const p = G.pickups[i];
      if (!p.alive) continue;
      if (Math.abs(p.x - px) < 0.72 && Math.abs(p.z - pz) < 1.6) collectHuman(p);
    }
  }

  function updateFx(dt) {
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 0.18);
    G.toastT = Math.max(0, G.toastT - dt);
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.gridOff += dt * (2.2 + G.warpVis * 14 + G.thrust * 6);
    const boost = 1 + G.warpVis * 9 + G.thrust * 2.4;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.z -= s.spd * dt * boost;
      if (s.z < 3.2) {
        s.z = rand(28, 48);
        s.x = rand(-14, 14);
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.22) sparks.splice(i, 1);
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
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.mysteryT > 0) G.mysteryT = Math.max(0, G.mysteryT - dt);
    updatePlayer(dt);
    if ((G.fireHold || pointer.down) && G.mode === 'play' && !overlayOpen() && G.deadT <= 0) fire();
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      collideShots();
      return;
    }
    if (G.mode === 'play' && G.deadT <= 0) {
      G.fuel -= dt;
      if (G.fuel < 18 && !G.fuelWarn) {
        G.fuelWarn = true;
        toast('燃料不足', true, false);
        audio.fuel();
      }
      if (G.fuel <= 0) {
        G.fuel = 0;
        die('燃料耗尽');
      }
    }
    updateQueue(dt);
    updateEnemies(dt);
    updateShots(dt);
    updateBombs(dt);
    updatePickups(dt);
    collideShots();
    collectPickups();
    hitPlayer();
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      if (!(keys.l || keys.r)) G.player.x = Math.sin(G.t * 0.7) * 1.6;
      else updatePlayer(dt);
      G.demoT -= dt;
      if (G.demoT <= 0) {
        G.demoT = 4.2;
        G.enemies = [];
        spawnFormation('v', 'scout', 6, 28);
      }
      updateEnemies(dt * 0.55);
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      updateEnemies(dt * 0.35);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      updateQueue(dt);
      updateEnemies(dt);
      updateBombs(dt);
      updatePickups(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '舰毁了');
          updateFx(dt);
          return;
        }
        G.invuln = 1.55;
        G.player.x = 0;
        G.player.z = PZ;
        G.bombs = [];
        if (G.fuel < 40) G.fuel = 40;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && G.ready <= 0 && G.deadT <= 0) {
      if (G.queue.length === 0 && aliveCount() === 0) waveClear();
    }

    updateFx(dt);
    syncHud();
  }

  function drawLetterbox() {
    ctx.fillStyle = '#030814';
    if (ox > 0.5) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W - ox - VW * scale + 2, H);
    }
    if (oy > 0.5) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H - oy - VH * scale + 2);
    }
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#071428');
    g.addColorStop(0.22, '#050e1c');
    g.addColorStop(0.45, '#071830');
    g.addColorStop(1, '#040a14');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const sun = ctx.createRadialGradient(sx(CX), sy(HORIZON - 6), 2 * scale, sx(CX), sy(HORIZON - 6), 90 * scale);
    sun.addColorStop(0, rgba(WHT, 0.55 + G.warpVis * 0.25));
    sun.addColorStop(0.18, rgba(G.mysteryT > 0 ? MAG : CYN, 0.35));
    sun.addColorStop(1, rgba(CYN, 0));
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(sx(CX), sy(HORIZON - 4), 90 * scale, 0, TAU);
    ctx.fill();
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const p = project(s.x, s.z);
      const a = s.a * clamp((s.z - 3) / 20, 0.2, 1);
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), (s.r * (0.4 + p.s * 0.08)) * scale, 0, TAU);
      ctx.fill();
      if (!REDUCE && (G.warpVis > 0.15 || s.z < 12)) {
        const q = project(s.x, s.z + 1.8 + G.warpVis * 4);
        ctx.strokeStyle = rgba(s.rgb, a * 0.4);
        ctx.lineWidth = (0.7 + G.warpVis * 1.4) * scale;
        ctx.beginPath();
        ctx.moveTo(sx(q.x), sy(q.y));
        ctx.lineTo(sx(p.x), sy(p.y));
        ctx.stroke();
      }
    }
  }

  function drawGrid() {
    const zNear = 3.7;
    const zFar = 44;
    const rgb = G.mysteryT > 0 ? MAG : CYN;
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    const rows = 18;
    for (let i = 0; i < rows; i++) {
      const t = i / (rows - 1);
      const inv = lerp(1 / zNear, 1 / zFar, t);
      const z = 1 / inv;
      const p0 = project(-11, z);
      const p1 = project(11, z);
      const a = 0.07 + (1 - t) * 0.22;
      ctx.strokeStyle = rgba(rgb, a);
      ctx.lineWidth = (t < 0.12 ? 1.8 : 1) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(p0.x), sy(p0.y));
      ctx.lineTo(sx(p1.x), sy(p1.y));
      ctx.stroke();
    }
    for (let xi = -10; xi <= 10; xi += 1) {
      const a = xi === 0 ? 0.28 : (xi % 2 === 0 ? 0.16 : 0.08);
      const a0 = project(xi, zNear);
      const a1 = project(xi, zFar);
      ctx.strokeStyle = rgba(rgb, a + G.warpVis * 0.12);
      ctx.lineWidth = (xi === 0 ? 1.6 : 1) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(a0.x), sy(a0.y));
      ctx.lineTo(sx(a1.x), sy(a1.y));
      ctx.stroke();
    }

    ctx.fillStyle = rgba(rgb, 0.04 + G.warpVis * 0.05);
    const cells = 8;
    const off = G.gridOff % 2;
    for (let iz = 0; iz < cells; iz++) {
      const t0 = (iz + off * 0.5) / cells;
      const t1 = (iz + 1 + off * 0.5) / cells;
      const z0 = 1 / lerp(1 / zNear, 1 / zFar, clamp(t0, 0, 1));
      const z1 = 1 / lerp(1 / zNear, 1 / zFar, clamp(t1, 0, 1));
      for (let ix = -9; ix < 9; ix++) {
        if (((ix + iz) & 1) === 0) continue;
        const p00 = project(ix, z0);
        const p10 = project(ix + 1, z0);
        const p11 = project(ix + 1, z1);
        const p01 = project(ix, z1);
        ctx.beginPath();
        ctx.moveTo(sx(p00.x), sy(p00.y));
        ctx.lineTo(sx(p10.x), sy(p10.y));
        ctx.lineTo(sx(p11.x), sy(p11.y));
        ctx.lineTo(sx(p01.x), sy(p01.y));
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.strokeStyle = rgba(HOT, 0.35 + G.warpVis * 0.25);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    const h0 = project(-12, 40);
    const h1 = project(12, 40);
    ctx.moveTo(sx(0), sy(HORIZON));
    ctx.lineTo(sx(VW), sy(HORIZON));
    ctx.stroke();
    ctx.strokeStyle = rgba(WHT, 0.12);
    ctx.beginPath();
    ctx.moveTo(sx(h0.x), sy(h0.y));
    ctx.lineTo(sx(h1.x), sy(h1.y));
    ctx.stroke();
    ctx.restore();
  }

  function drawRadar() {
    const rx = 240;
    const ry = 36;
    const rw = 148;
    const rh = 28;
    ctx.save();
    ctx.strokeStyle = rgba(CYN, 0.35);
    ctx.fillStyle = 'rgba(4, 12, 28, 0.45)';
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    const x0 = sx(rx - rw * 0.5);
    const y0 = sy(ry - rh * 0.5);
    ctx.rect(x0, y0, rw * scale, rh * scale);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive || e.age < 0) continue;
      const dx = clamp(e.x / 4.2, -1, 1);
      const dz = clamp((e.z - 4) / 32, 0, 1);
      const px = rx + dx * (rw * 0.42);
      const py = ry - rh * 0.32 + (1 - dz) * (rh * 0.7);
      ctx.fillStyle = rgba(rgbOf(e), e.kind === 'mother' ? 0.95 : 0.75);
      ctx.beginPath();
      ctx.arc(sx(px), sy(py), (e.kind === 'mother' ? 2.4 : 1.5) * scale, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.moveTo(sx(rx), sy(ry + rh * 0.38));
    ctx.lineTo(sx(rx - 3.2), sy(ry + rh * 0.18));
    ctx.lineTo(sx(rx + 3.2), sy(ry + rh * 0.18));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawEnemy(e) {
    if (!e.alive || e.age < 0) return;
    const p = project(e.x, e.z);
    if (p.y < 40 || p.y > VH + 30) return;
    const rgb = rgbOf(e);
    const s = Math.max(0.35, p.s);
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    const stretch = 1 + G.warpVis * 0.45;
    ctx.scale(s * scale, s * scale * stretch);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(rgb, 0.2);
    ctx.beginPath();
    ctx.arc(0, 0, e.kind === 'mother' ? 16 : 9, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.strokeStyle = rgba(WHT, 0.5);
    ctx.lineWidth = 0.6;
    if (e.kind === 'mother') {
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 7, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.ellipse(0, -1, 6, 3.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(-4, -1, 1.4, 0, TAU);
      ctx.arc(4, -1, 1.4, 0, TAU);
      ctx.fill();
      const ratio = e.hp / e.maxHp;
      ctx.strokeStyle = rgba(ratio < 0.35 ? MAG : GOLD, 0.8);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(0, 0, 17, -Math.PI, -Math.PI + TAU * ratio);
      ctx.stroke();
    } else if (e.kind === 'bomber') {
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = k * TAU / 6 - Math.PI / 2;
        const x = Math.cos(a) * 8;
        const y = Math.sin(a) * 8;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (e.kind === 'mutant') {
      ctx.rotate(e.age * 3.2);
      ctx.beginPath();
      for (let k = 0; k < 5; k++) {
        const a = k * TAU / 5 - Math.PI / 2;
        const x = Math.cos(a) * 8;
        const y = Math.sin(a) * 8;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        const a2 = a + TAU / 10;
        ctx.lineTo(Math.cos(a2) * 3.4, Math.sin(a2) * 3.4);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (e.kind === 'homer') {
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(7, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-7, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (e.kind === 'rock') {
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(2, -7);
      ctx.lineTo(7, -1);
      ctx.lineTo(4, 6);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (e.kind === 'fighter') {
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(8, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-8, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(-1.2, -3, 2.4, 5);
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(6, 5);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnemies() {
    const list = G.enemies.slice();
    list.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < list.length; i++) drawEnemy(list[i]);
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const p = project(s.x, s.z);
      const q = project(s.x, s.z - 1.6);
      ctx.strokeStyle = rgba(WHT, 0.9);
      ctx.lineWidth = Math.max(1.2, 2.4 * p.s) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(q.x), sy(q.y));
      ctx.lineTo(sx(p.x), sy(p.y));
      ctx.stroke();
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = Math.max(0.8, 1.4 * p.s) * scale;
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), Math.max(1.2, 2.1 * p.s) * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawBombs() {
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (!b.alive) continue;
      const p = project(b.x, b.z);
      const rgb = b.kind === 'white' ? WHT : PUR;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      const sc = Math.max(0.4, p.s) * scale;
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 3.2 * sc, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(b.kind === 'white' ? GOLD : MAG, 0.7);
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
      if (b.kind === 'home') {
        ctx.strokeStyle = rgba(MAG, 0.45);
        ctx.beginPath();
        ctx.arc(0, 0, 5.2 * sc, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawPickups() {
    for (let i = 0; i < G.pickups.length; i++) {
      const u = G.pickups[i];
      if (!u.alive) continue;
      const p = project(u.x, u.z);
      const sc = Math.max(0.5, p.s) * scale;
      const bob = Math.sin(G.t * 6 + u.t) * 3;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, -4 * sc, 3.2 * sc, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.92);
      ctx.fillRect(-2.1 * sc, -1 * sc, 4.2 * sc, 7 * sc);
      ctx.strokeStyle = rgba(MAG, 0.6);
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(-2.1 * sc, -1 * sc, 4.2 * sc, 7 * sc);
      ctx.restore();
    }
  }

  function drawShip() {
    if (G.mode === 'play' && G.deadT > 0) return;
    if (G.mode === 'play' && G.invuln > 0 && Math.floor(G.t * 18) % 2 === 0) return;
    const p = project(G.player.x, G.player.z);
    const stretch = 1 + G.warpVis * 0.85 + G.thrust * 0.18;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(scale, scale * stretch);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(CYN, 0.22 + G.muzzle * 0.5);
    ctx.beginPath();
    ctx.arc(0, 4, 16, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(11, 12);
    ctx.lineTo(0, 6);
    ctx.lineTo(-11, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(WHT, 0.65);
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(3.2, 2);
    ctx.lineTo(-3.2, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(-8, 8, 4, 7);
    ctx.fillRect(4, 8, 4, 7);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 8);
      ctx.beginPath();
      ctx.arc(0, -20, 4.5, 0, TAU);
      ctx.fill();
    }
    if (G.thrust > 0 || G.warpVis > 0.2) {
      ctx.fillStyle = rgba(GOLD, 0.55 + G.warpVis * 0.35);
      ctx.beginPath();
      ctx.moveTo(-4, 14);
      ctx.lineTo(0, 22 + G.warpVis * 16);
      ctx.lineTo(4, 14);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * a * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.22;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.6 * scale;
      const r = (6 + s.t * 90) * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x) - r, sy(s.y));
      ctx.lineTo(sx(s.x) + r, sy(s.y));
      ctx.moveTo(sx(s.x), sy(s.y) - r);
      ctx.lineTo(sx(s.x), sy(s.y) + r);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.42;
      ctx.strokeStyle = rgba(r.rgb, a * 0.85);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = '700 ' + Math.max(11, 13 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0 && G.mysteryT <= 0) return;
    if (G.mysteryT > 0) {
      ctx.fillStyle = rgba(MAG, 0.08 + 0.05 * Math.sin(G.t * 8));
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawWarpVeil() {
    if (G.warpVis < 0.04) return;
    const a = G.warpVis * 0.22;
    const g = ctx.createLinearGradient(sx(CX), sy(HORIZON), sx(CX), sy(VH));
    g.addColorStop(0, rgba(WHT, a * 0.7));
    g.addColorStop(0.25, rgba(CYN, a));
    g.addColorStop(1, rgba(CYN, 0));
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    if (G.warpT > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(G.warpT / WARP_DUR, 0, 1);
      ctx.fillStyle = rgba(WHT, 0.92);
      ctx.font = '900 ' + Math.max(22, 34 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('跃迁', sx(CX), sy(HORIZON + 46));
      ctx.restore();
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#030814';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake);
      shy = rand(-G.shake, G.shake);
    }
    ctx.translate(W * 0.5 + shx, H * 0.5 + shy);
    const punch = REDUCE ? 1 : G.punch;
    ctx.scale(punch, punch);
    ctx.translate(-W * 0.5, -H * 0.5);
    drawBg();
    drawStars();
    drawGrid();
    drawEnemies();
    drawPickups();
    drawBombs();
    drawShots();
    drawShip();
    drawFx();
    drawRadar();
    drawWarpVeil();
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

  function pointerWorldFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    const wx = (x - ox) / scale;
    const wy = (y - oy) / scale;
    const z = G.player.z;
    const worldX = (wx - CX) * z / FOCAL;
    return { x: worldX, y: wy };
  }

  function applyPointer(e) {
    const p = pointerWorldFromEvent(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.warp = p.y < HORIZON + 170;
    pointer.back = p.y > VH - 130;
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('camp');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (space) {
      if (down) e.preventDefault();
    }
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
      startGame('camp');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('frenzy');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        if (k === '2') startGame('frenzy');
        else primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fire();
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
      applyPointer(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      applyPointer(e);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      pointer.warp = false;
      pointer.back = false;
      G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) G.fireHold = false;
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

  if (btnCamp) {
    btnCamp.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('camp');
    });
  }
  if (btnEnd) {
    btnEnd.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && isCamp()) startGame('frenzy');
      else if (G.mode === 'win') goTitle();
      else startGame('frenzy');
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
