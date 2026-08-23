'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
  const PWR_MAX = 3;
  const PULSE_MAX = 100;
  const PULSE_NEED = 34;
  const BEST_KEY = 'playbox-pulstar-best';
  const MUTE_KEY = 'playbox-pulstar-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · Shift / Z 脉冲弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 212];
  const PUL = [61, 255, 196];
  const SKY = [92, 245, 232];
  const GOLD = [255, 227, 107];
  const VIO = [108, 140, 255];
  const WHT = [228, 255, 251];
  const PNK = [255, 154, 212];
  const DEEP = [4, 28, 32];
  const TEAL = [20, 80, 88];

  const SCORE = {
    mite: 50,
    tendril: 80,
    node: 150,
    crystal: 100,
    pod: 280,
    mid: 2000,
    boss: [4000, 6000, 9000],
    clear: 2000,
    all: 6000
  };

  const STAGES = [
    {
      name: '晶峡',
      mid: '脉卫',
      boss: '晶蛛',
      midHp: 42,
      bossHp: 96,
      waves: [
        { x: 30, kind: 'v', n: 5, y: 0.4 },
        { x: 160, kind: 'stream', n: 6 },
        { x: 280, kind: 'tendril', n: 4 },
        { x: 390, kind: 'node' },
        { x: 500, kind: 'v', n: 7, y: 0.58 },
        { x: 610, kind: 'pod' },
        { x: 700, kind: 'crystal' },
        { x: 800, kind: 'swarm', n: 6 },
        { x: 900, kind: 'v', n: 5, y: 0.32 },
        { x: 980, kind: 'mid' },
        { x: 1220, kind: 'stream', n: 8 },
        { x: 1340, kind: 'tendril', n: 5 },
        { x: 1440, kind: 'node' },
        { x: 1540, kind: 'v', n: 7, y: 0.5 },
        { x: 1640, kind: 'pod' },
        { x: 1740, kind: 'swarm', n: 7 },
        { x: 1840, kind: 'crystal' },
        { x: 1940, kind: 'v', n: 6, y: 0.62 },
        { x: 2050, kind: 'boss' }
      ]
    },
    {
      name: '脉廊',
      mid: '廊卫',
      boss: '脉龙',
      midHp: 54,
      bossHp: 122,
      waves: [
        { x: 20, kind: 'stream', n: 8 },
        { x: 140, kind: 'v', n: 7, y: 0.28 },
        { x: 220, kind: 'v', n: 7, y: 0.72 },
        { x: 340, kind: 'swarm', n: 8 },
        { x: 450, kind: 'node' },
        { x: 540, kind: 'tendril', n: 6 },
        { x: 640, kind: 'pod' },
        { x: 740, kind: 'stream', n: 8 },
        { x: 840, kind: 'crystal' },
        { x: 980, kind: 'mid' },
        { x: 1200, kind: 'v', n: 8, y: 0.4 },
        { x: 1300, kind: 'swarm', n: 8 },
        { x: 1400, kind: 'node' },
        { x: 1480, kind: 'node' },
        { x: 1580, kind: 'tendril', n: 6 },
        { x: 1680, kind: 'pod' },
        { x: 1760, kind: 'stream', n: 9 },
        { x: 1860, kind: 'v', n: 7, y: 0.55 },
        { x: 1960, kind: 'swarm', n: 8 },
        { x: 2050, kind: 'boss' }
      ]
    },
    {
      name: '星核',
      mid: '核卫',
      boss: '星脉核',
      midHp: 68,
      bossHp: 168,
      waves: [
        { x: 10, kind: 'swarm', n: 8 },
        { x: 120, kind: 'v', n: 8, y: 0.34 },
        { x: 180, kind: 'v', n: 8, y: 0.66 },
        { x: 300, kind: 'tendril', n: 7 },
        { x: 400, kind: 'node' },
        { x: 480, kind: 'stream', n: 10 },
        { x: 580, kind: 'pod' },
        { x: 680, kind: 'crystal' },
        { x: 760, kind: 'crystal' },
        { x: 860, kind: 'swarm', n: 9 },
        { x: 980, kind: 'mid' },
        { x: 1200, kind: 'stream', n: 10 },
        { x: 1300, kind: 'tendril', n: 7 },
        { x: 1380, kind: 'node' },
        { x: 1460, kind: 'node' },
        { x: 1560, kind: 'v', n: 9, y: 0.48 },
        { x: 1660, kind: 'pod' },
        { x: 1740, kind: 'swarm', n: 9 },
        { x: 1840, kind: 'crystal' },
        { x: 1920, kind: 'stream', n: 8 },
        { x: 2050, kind: 'boss' }
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
  const btnRaid = document.getElementById('btn-raid');
  const btnStorm = document.getElementById('btn-storm');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const pwrLabel = document.getElementById('pwr-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const pulseBar = document.getElementById('pulse-bar');
  const pulseWrap = document.getElementById('pulse-wrap');

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

  const keys = { l: false, r: false, u: false, d: false, sht: false };
  let uid = 1;
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const dust = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    cam: 0,
    px: 90,
    py: VH * 0.5,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    stage: 1,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    pick: [],
    waves: [],
    spawnI: 0,
    fireCd: 0,
    pulse: 0,
    pulseLv: 0,
    bombCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    mid: false,
    boss: false,
    winT: 0,
    power: 0
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
  function isStorm() {
    return G.kind === 'storm';
  }
  function stageInfo() {
    return STAGES[clamp(G.stage - 1, 0, STAGES.length - 1)];
  }
  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }
  function moveSpd() {
    return (isStorm() ? 310 : 272) + G.power * 12;
  }
  function scrollSpd() {
    if (G.boss || G.mid) {
      const b = findBig();
      if (b && b.alive) {
        const x = b.x - G.cam;
        if (x < VW - 210) return isStorm() ? 12 : 8;
        if (x < VW - 130) return isStorm() ? 40 : 26;
      }
      return isStorm() ? 52 : 36;
    }
    return isStorm() ? 148 : 98;
  }
  function pulseLevel() {
    if (G.pulse >= PULSE_MAX) return 3;
    if (G.pulse >= 66) return 2;
    if (G.pulse >= PULSE_NEED) return 1;
    return 0;
  }
  function fireCdMax() {
    const base = isStorm() ? 0.078 : 0.09;
    return base - G.power * 0.006;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
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
      this.beep(880, 0.046, 'square', 0.028, 1760);
    },
    chargeTick(lv) {
      this.ensure();
      const f = 260 + lv * 170;
      this.beep(f, 0.09, 'sine', 0.036, f * 1.65);
      if (lv >= 3) this.beep(920, 0.14, 'triangle', 0.032, 1380);
    },
    pulse(lv) {
      this.ensure();
      this.noise(0.14 + lv * 0.05, 0.062, 220);
      this.beep(180 + lv * 40, 0.22, 'sawtooth', 0.056, 58);
      this.beep(520 + lv * 80, 0.16, 'square', 0.04, 140);
      if (lv >= 3) this.beep(1240, 0.18, 'triangle', 0.034, 380);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 190 : kind === 'mid' ? 240 : 520;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.032, 1200);
      this.beep(base * lift, 0.072, 'square', 0.042, base * lift * 1.55);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.068, 260);
      this.beep(260, 0.24, 'sawtooth', 0.054, 58);
      this.beep(130, 0.34, 'sine', 0.046, 38);
    },
    pickup() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.044, 784);
      this.beep(784, 0.12, 'triangle', 0.038, 1046);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.045, 1046);
      this.beep(1046, 0.28, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(210, 0.18, 'sawtooth', 0.042, 86);
      this.beep(130, 0.3, 'sine', 0.05, 46);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    warn() {
      this.ensure();
      this.beep(210, 0.16, 'square', 0.042, 105);
      this.beep(320, 0.22, 'sawtooth', 0.036, 78);
    },
    empty() {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.03, 80);
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
    if ((G.mode !== 'play' && G.mode !== 'win') || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.up();
        syncPips();
      }
    }
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

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < G.lives) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > Math.max(G.lives, LIVES)) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.className = 'hint' + (cls ? ' ' + cls : '');
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.className = 'toast' + (warn ? ' warn' : gold ? ' gold' : '');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.05;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 980);
  }

  function syncPulseUi() {
    const lv = pulseLevel();
    if (pulseBar) pulseBar.style.transform = 'scaleX(' + clamp(G.pulse / PULSE_MAX, 0, 1) + ')';
    if (pulseWrap) {
      pulseWrap.classList.toggle('hot', lv >= 3);
      pulseWrap.classList.toggle('ready', lv >= 1);
    }
    if (btnBomb) {
      btnBomb.disabled = lv < 1 || G.mode !== 'play' || G.deadT > 0;
      btnBomb.classList.toggle('hot', lv >= 3);
      btnBomb.textContent = lv >= 3 ? '满' : '脉';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      const info = stageInfo();
      const big = G.boss ? info.boss : G.mid ? info.mid : info.name;
      stageLabel.textContent = G.boss || G.mid ? big : ('第 ' + G.stage + ' 关 · ' + info.name);
      stageLabel.classList.toggle('hot', G.boss || G.mid);
    }
    if (tagLabel) {
      tagLabel.textContent = isStorm() ? '脉冲' : '星脉';
      tagLabel.className = isStorm() ? 'warn' : '';
    }
    if (pwrLabel) {
      pwrLabel.textContent = G.power >= PWR_MAX ? '火 MAX' : ('火 ' + G.power);
      pwrLabel.className = 'pwr' + (G.power >= PWR_MAX ? ' max' : '');
    }
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
    const lv = pulseLevel();
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机体或中弹掉命', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 星脉核已碎', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 蓄满再放脉冲弹', 'warn');
    else if (lv >= 3) setHint('脉冲满 · Shift / Z 放出冲击波', 'hot');
    else setHint('空格连射 · 命中积蓄 · Shift 放脉冲弹', '');
    syncPulseUi();
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'PULS';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'lose' || kind === 'win';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
    if (ended && btnOvModes) {
      if (kind === 'win' && G.kind === 'raid') btnOvModes.textContent = '脉冲';
      else btnOvModes.textContent = '换模式';
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE || (G.mode !== 'play' && G.mode !== 'win')) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : mag >= 4.4 ? 'bomb' : mag >= 2.6 ? 'pulse' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('pulse');
    stageEl.classList.remove('bomb');
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
    capArr(particles, 340);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 44);
    capArr(rings, 26);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -90 : -72
    });
    capArr(floats, 26);
  }

  function explode(x, y, rgb, power) {
    const p = power || 18;
    emit(Math.min(36, 10 + (p * 0.5) | 0), {
      x: x, y: y, j: 6,
      vx0: -240, vx1: 200, vy0: -200, vy1: 180,
      r0: 1.4, r1: 4.6, life: 0.44 + p * 0.006, rgb: rgb, g: 260
    });
    emit(7, {
      x: x, y: y, j: 3,
      vx0: -80, vx1: 80, vy0: -100, vy1: 70,
      r0: 2, r1: 5.2, life: 0.3, rgb: WHT, g: 70
    });
    popSpark(x, y, rgb, 12 + p * 0.42);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      floatText(G.px + 24, G.py - 18, '×' + G.mult, GOLD, true);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.16, 0.72),
        p: rand(16, 78)
      });
    }
    dust.length = 0;
    for (let i = 0; i < 16; i++) {
      dust.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(10, 26),
        a: rand(0.05, 0.14),
        p: rand(10, 28)
      });
    }
  }

  function findBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if ((e.type === 'boss' || e.type === 'mid') && e.alive) return e;
    }
    return null;
  }

  function pushEnt(e) {
    e.id = uid++;
    e.alive = e.alive !== false;
    G.ents.push(e);
    capArr(G.ents, 120);
  }

  function spawnV(n, yNorm) {
    const extra = isStorm() ? 2 : 0;
    const count = n + extra;
    const baseY = 40 + yNorm * (VH - 80);
    for (let i = 0; i < count; i++) {
      const side = i - (count - 1) * 0.5;
      pushEnt({
        type: 'mite',
        form: 'v',
        x: G.cam + VW + 24 + i * 22,
        y: clamp(baseY + Math.abs(side) * 16, 28, VH - 28),
        vx: isStorm() ? -168 : -132,
        vy: 0,
        hp: 1,
        maxHp: 1,
        w: 11,
        h: 8,
        t: i * 0.08,
        phase: rand(0, TAU),
        shootCd: rand(0.55, 1.4)
      });
    }
  }

  function spawnStream(n) {
    const extra = isStorm() ? 2 : 0;
    const count = n + extra;
    const mid = VH * (0.32 + Math.random() * 0.36);
    for (let i = 0; i < count; i++) {
      pushEnt({
        type: 'mite',
        form: 'stream',
        x: G.cam + VW + 20 + i * 20,
        y: mid,
        baseY: mid,
        vx: isStorm() ? -154 : -122,
        vy: 0,
        hp: 1,
        maxHp: 1,
        w: 10,
        h: 8,
        t: i * 0.1,
        phase: i * 0.55,
        amp: 36 + rand(0, 18),
        shootCd: rand(0.7, 1.6)
      });
    }
  }

  function spawnTendril(n) {
    const extra = isStorm() ? 1 : 0;
    const count = n + extra;
    for (let i = 0; i < count; i++) {
      const fromTop = i % 2 === 0;
      pushEnt({
        type: 'tendril',
        x: G.cam + VW + 30 + i * 28,
        y: fromTop ? 18 + rand(0, 40) : VH - 18 - rand(0, 40),
        vx: isStorm() ? -150 : -118,
        vy: fromTop ? 70 : -70,
        hp: 1,
        maxHp: 1,
        w: 14,
        h: 10,
        t: 0,
        shootCd: rand(0.4, 1.1)
      });
    }
  }

  function spawnSwarm(n) {
    const extra = isStorm() ? 2 : 0;
    const count = n + extra;
    const cx = G.cam + VW + 50;
    const cy = 90 + Math.random() * (VH - 180);
    const rad = 28 + count * 2.2;
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * TAU;
      pushEnt({
        type: 'mite',
        form: 'swarm',
        x: cx + Math.cos(ang) * rad,
        y: cy + Math.sin(ang) * rad * 0.62,
        cx: cx,
        cy: cy,
        ang: ang,
        ringR: rad,
        vx: isStorm() ? -110 : -88,
        vy: 0,
        hp: 1,
        maxHp: 1,
        w: 10,
        h: 8,
        t: 0,
        shootCd: rand(0.8, 1.7)
      });
    }
  }

  function spawnNode() {
    pushEnt({
      type: 'node',
      x: G.cam + VW + 36,
      y: 80 + Math.random() * (VH - 160),
      vx: isStorm() ? -88 : -70,
      vy: 0,
      hp: 4,
      maxHp: 4,
      w: 22,
      h: 18,
      t: 0,
      shootCd: 0.6
    });
  }

  function spawnCrystal() {
    const extra = isStorm() ? 1 : 0;
    for (let i = 0; i <= extra; i++) {
      pushEnt({
        type: 'crystal',
        x: G.cam + VW + 40 + i * 50,
        y: 60 + Math.random() * (VH - 120),
        vx: isStorm() ? -72 : -56,
        vy: rand(-20, 20),
        hp: 3,
        maxHp: 3,
        w: 16,
        h: 16,
        t: 0,
        spin: rand(0, TAU),
        shootCd: 1.2
      });
    }
  }

  function spawnPod() {
    pushEnt({
      type: 'pod',
      x: G.cam + VW + 30,
      y: 70 + Math.random() * (VH - 140),
      vx: isStorm() ? -80 : -64,
      vy: 0,
      hp: 5,
      maxHp: 5,
      w: 20,
      h: 16,
      t: 0,
      drop: true,
      shootCd: 1.0
    });
  }

  function spawnMid() {
    G.mid = true;
    const info = stageInfo();
    const hp = Math.round(info.midHp * (isStorm() ? 1.22 : 1));
    const variants = ['pulse', 'vein', 'core'];
    pushEnt({
      type: 'mid',
      variant: variants[G.stage - 1] || 'pulse',
      x: G.cam + VW + 50,
      y: VH * 0.5,
      vx: -70,
      hp: hp,
      maxHp: hp,
      w: 48,
      h: 36,
      t: 0,
      spin: 0,
      dash: 0,
      shootCd: 0.9
    });
    toast(info.mid);
    audio.warn();
    syncHud();
  }

  function spawnBoss() {
    G.boss = true;
    const info = stageInfo();
    const hp = Math.round(info.bossHp * (isStorm() ? 1.22 : 1));
    const variants = ['spider', 'wyrm', 'heart'];
    pushEnt({
      type: 'boss',
      variant: variants[G.stage - 1] || 'spider',
      x: G.cam + VW + 70,
      y: VH * 0.5,
      vx: -64,
      hp: hp,
      maxHp: hp,
      w: 72,
      h: 56,
      t: 0,
      spin: 0,
      bits: [0, 0.9, 1.8, 2.7, 3.6],
      shootCd: 1.1
    });
    toast(info.boss, false, true);
    audio.warn();
    syncHud();
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n || 5, w.y == null ? 0.5 : w.y);
    else if (w.kind === 'stream') spawnStream(w.n || 6);
    else if (w.kind === 'tendril') spawnTendril(w.n || 4);
    else if (w.kind === 'swarm') spawnSwarm(w.n || 6);
    else if (w.kind === 'node') spawnNode();
    else if (w.kind === 'crystal') spawnCrystal();
    else if (w.kind === 'pod') spawnPod();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function maybeSpawn() {
    if (findBig()) return;
    const info = stageInfo();
    const w = info.waves[G.spawnI];
    if (!w) return;
    if (w.x > G.cam) return;
    fireWave(w);
    G.spawnI += 1;
  }

  function enemyShot(x, y, vx, vy, fat) {
    G.eShots.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: fat ? 5.4 : 3.2,
      fat: !!fat,
      life: 4.2
    });
    capArr(G.eShots, 160);
  }

  function aimShot(x, y, spd, spread, fat) {
    const tx = G.px + G.cam;
    const ty = G.py;
    let dx = tx - x;
    let dy = ty - y;
    const n = hypot(dx, dy) || 1;
    dx = dx / n;
    dy = dy / n;
    const c = Math.cos(spread || 0);
    const s = Math.sin(spread || 0);
    const vx = (dx * c - dy * s) * spd;
    const vy = (dx * s + dy * c) * spd;
    enemyShot(x, y, vx, vy, fat);
  }

  function ringShot(x, y, n, spd, spin) {
    for (let i = 0; i < n; i++) {
      const a = spin + (i / n) * TAU;
      enemyShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, false);
    }
  }

  function shotOffsets() {
    if (G.power >= 3) return [-16, -8, 0, 8, 16];
    if (G.power >= 2) return [-10, 0, 10];
    if (G.power >= 1) return [-6, 6];
    return [0];
  }

  function fireShot() {
    if (G.fireCd > 0 || G.deadT > 0 || G.mode !== 'play') return;
    const offs = shotOffsets();
    for (let i = 0; i < offs.length; i++) {
      const oy2 = offs[i] * 0.42;
      G.shots.push({
        x: G.px + 16,
        y: G.py + oy2,
        vx: 660,
        vy: offs[i] * 1.6,
        w: 11,
        h: 3.6,
        dmg: 1,
        life: 1.05,
        rgb: i === ((offs.length / 2) | 0) ? PUL : CYN
      });
    }
    capArr(G.shots, 90);
    G.fireCd = fireCdMax();
    G.muzzle = 0.06;
    audio.shoot();
  }

  function addPulse(n) {
    const prev = pulseLevel();
    G.pulse = clamp(G.pulse + n, 0, PULSE_MAX);
    const lv = pulseLevel();
    G.pulseLv = lv;
    if (lv > prev && lv >= 1) {
      audio.chargeTick(lv);
      if (lv === 3) {
        toast('脉冲满', false, true);
        screenFlash(PUL, 0.22);
        kick(2.4);
        popSpark(G.px + 18, G.py, GOLD, 16);
      }
    }
    syncPulseUi();
  }

  function tryPulse() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombCd > 0) return;
    const lv = pulseLevel();
    if (lv < 1) {
      toast('脉冲不足', true, false);
      audio.empty();
      return;
    }
    G.bombCd = 0.38;
    G.invuln = Math.max(G.invuln, 0.42);
    G.waves.push({
      x: G.px + 10,
      y: G.py,
      r: 18,
      maxR: 78 + lv * 72,
      dmg: 8 + lv * 10,
      lv: lv,
      t: 0,
      hit: {},
      vx: 210 + lv * 46
    });
    capArr(G.waves, 6);
    G.pulse = 0;
    G.pulseLv = 0;
    audio.pulse(lv);
    screenFlash(lv >= 3 ? GOLD : PUL, lv >= 3 ? 0.5 : 0.32);
    hitStop(lv >= 3 ? 0.078 : lv >= 2 ? 0.058 : 0.042);
    kick(lv >= 3 ? 6.2 : 3.6 + lv);
    popSpark(G.px + 16, G.py, lv >= 3 ? GOLD : PUL, 20 + lv * 8);
    emit(18 + lv * 6, {
      x: G.px + 12, y: G.py, j: 8,
      vx0: 40, vx1: 280, vy0: -160, vy1: 160,
      r0: 1.6, r1: 5, life: 0.42, rgb: PUL, g: 40
    });
    if (lv >= 3) floatText(G.px + 30, G.py - 22, 'PULSE', GOLD, true);
    syncPulseUi();
    syncHud();
  }

  function dropPick(x, y) {
    G.pick.push({
      x: x,
      y: y,
      vx: -40,
      t: 0,
      life: 9
    });
    capArr(G.pick, 8);
  }

  function collectPickup(p) {
    audio.pickup();
    screenFlash(GOLD, 0.16);
    popSpark(p.x - G.cam, p.y, GOLD, 14);
    if (pwrLabel) {
      pwrLabel.classList.remove('pop');
      void pwrLabel.offsetWidth;
      pwrLabel.classList.add('pop');
    }
    if (G.power >= PWR_MAX) {
      addScore(500 * G.mult);
      floatText(p.x - G.cam, p.y, '+500', GOLD, true);
    } else {
      G.power += 1;
      toast(G.power >= PWR_MAX ? '火力 MAX' : ('火力 ' + G.power), false, true);
    }
    addPulse(42);
    syncHud();
  }

  function killEnt(e) {
    e.alive = false;
    const x = e.x - G.cam;
    const y = e.y;
    const big = e.type === 'boss' || e.type === 'mid';
    const rgb = e.type === 'crystal' ? SKY : e.type === 'pod' ? GOLD : big ? MAG : PUL;
    explode(x, y, rgb, big ? 36 : e.type === 'node' ? 22 : 14);
    let base = SCORE.mite;
    if (e.type === 'tendril') base = SCORE.tendril;
    else if (e.type === 'node') base = SCORE.node;
    else if (e.type === 'crystal') base = SCORE.crystal;
    else if (e.type === 'pod') base = SCORE.pod;
    else if (e.type === 'mid') base = SCORE.mid;
    else if (e.type === 'boss') base = SCORE.boss[clamp(G.stage - 1, 0, 2)];
    const got = base * G.mult;
    addScore(got);
    floatText(x, y - 8, String(got), G.mult > 1 ? GOLD : WHT, G.mult > 1);
    addPulse(e.type === 'boss' ? 18 : e.type === 'mid' ? 14 : e.type === 'pod' ? 10 : 6);
    if (e.drop || e.type === 'pod') dropPick(e.x, e.y);
    if (e.type === 'mid') {
      G.mid = false;
      syncHud();
    }
    if (e.type === 'boss') {
      G.boss = false;
      addScore(1500 * G.stage);
      for (let i = 0; i < G.ents.length; i++) {
        if (G.ents[i] !== e) G.ents[i].alive = false;
      }
      G.eShots.length = 0;
      if (G.stage >= STAGES.length) {
        G.winT = 1.4;
      } else {
        addScore(SCORE.clear);
        G.stage += 1;
        G.cam = 0;
        G.spawnI = 0;
        G.invuln = Math.max(G.invuln, 1.15);
        toast('第 ' + G.stage + ' 关 · ' + stageInfo().name, false, true);
        syncHud();
      }
    }
  }

  function hurtEnt(e, dmg, x, y) {
    e.hp -= dmg;
    bumpCombo();
    addPulse(e.type === 'boss' ? 2.2 : e.type === 'mid' ? 3.2 : 4.2);
    const big = e.type === 'boss' || e.type === 'mid';
    hitStop(e.type === 'boss' ? 0.07 : e.type === 'mid' ? 0.055 : 0.034);
    kick(big ? 2.8 : 1.4);
    emit(5, {
      x: x, y: y, j: 4,
      vx0: -60, vx1: 90, vy0: -70, vy1: 70,
      r0: 1.2, r1: 3.2, life: 0.22, rgb: PUL, g: 30
    });
    audio.hit(e.type, G.combo);
    if (e.hp <= 0) killEnt(e);
  }

  function diePlayer() {
    if (G.deadT > 0 || G.invuln > 0) return;
    explode(G.px, G.py, MAG, 40);
    audio.death();
    hitStop(0.072);
    kick(7);
    screenFlash(MAG, 0.45);
    G.deadT = 0.92;
    G.lives -= 1;
    breakCombo();
    G.eShots.length = 0;
    if (G.power > 0) dropPick(G.px + G.cam, G.py);
    G.power = 0;
    G.pulse = Math.max(20, G.pulse * 0.4);
    G.pulseLv = pulseLevel();
    syncHud();
  }

  function respawn() {
    G.px = 90;
    G.py = VH * 0.5;
    G.invuln = 1.48;
    G.deadT = 0;
    G.muzzle = 0;
    G.eShots.length = 0;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰毁了', '机体撞毁。分数 ' + G.score + (isStorm() ? ' · 脉冲' : ' · 星脉') + '。');
    setHint('R 重开 · 撞机体或中弹掉命', 'warn');
  }

  function goWin() {
    G.mode = 'win';
    addScore(SCORE.all);
    audio.win();
    showOverlay('win', '星核尽碎', '三关打穿。分数 ' + G.score + (isStorm() ? ' · 脉冲' : ' · 星脉') + '。');
    setHint('R 重开 · 星脉核已碎', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pick.length = 0;
    G.waves.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'storm' ? 'storm' : 'raid';
    G.t = 0;
    G.cam = 0;
    G.px = 90;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stage = 1;
    G.nextLife = LIFE_EVERY;
    G.spawnI = 0;
    G.fireCd = 0;
    G.pulse = 18;
    G.pulseLv = 0;
    G.bombCd = 0;
    G.deadT = 0;
    G.invuln = 1.12;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.mid = false;
    G.boss = false;
    G.winT = 0;
    G.power = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isStorm() ? '脉冲' : '星脉', isStorm(), !isStorm());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.t = 0;
    G.cam = 80;
    G.px = 90;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.stage = 1;
    G.mid = false;
    G.boss = false;
    G.deadT = 0;
    G.pulse = 0;
    G.power = 0;
    clearWorld();
    showOverlay('title', '星脉', '横向卷轴。空格连射，命中积蓄脉冲，Shift 放脉冲弹清弹伤敌。每关中 Boss 与关底 Boss。');
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 1.9);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.99;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
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
    const drift = G.mode === 'title' ? 26 : scrollSpd() * 0.2;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x -= (drift + s.p * 0.42) * dt;
      if (s.x < 0) s.x += VW;
    }
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      d.x -= (drift * 0.45 + d.p * 0.2) * dt;
      if (d.x < -30) d.x += VW + 60;
    }
  }

  function updateMove(dt) {
    let mx = 0;
    let my = 0;
    if (inputSrc === 'ptr' && pointer.down) {
      const dx = pointer.x - G.px;
      const dy = pointer.y - G.py;
      const d = hypot(dx, dy);
      const max = moveSpd() * dt;
      if (d > 2) {
        const k = Math.min(1, max / d) * (d > 18 ? 1 : d / 18);
        mx = dx * k;
        my = dy * k;
      }
    } else {
      if (keys.l) mx -= 1;
      if (keys.r) mx += 1;
      if (keys.u) my -= 1;
      if (keys.d) my += 1;
      if (mx || my) {
        const n = hypot(mx, my) || 1;
        mx = mx / n * moveSpd() * dt;
        my = my / n * moveSpd() * dt;
      }
    }
    G.px = clamp(G.px + mx, 24, VW * 0.46);
    G.py = clamp(G.py + my, 20, VH - 20);
  }

  function updatePick(dt) {
    for (let i = G.pick.length - 1; i >= 0; i--) {
      const p = G.pick[i];
      p.t += dt;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += Math.sin(p.t * 4.2) * 18 * dt;
      const sxv = p.x - G.cam;
      if (p.life <= 0 || sxv < -40) {
        G.pick.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && hypot(sxv - G.px, p.y - G.py) < 18) {
        collectPickup(p);
        G.pick.splice(i, 1);
      }
    }
  }

  function updateEnts(dt) {
    const storm = isStorm();
    const shotMul = storm ? 1.28 : 1;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.form === 'stream') {
        e.x += e.vx * dt;
        e.y = clamp((e.baseY || e.y) + Math.sin(e.t * 3.1 + e.phase) * e.amp, 24, VH - 24);
      } else if (e.form === 'swarm') {
        e.cx += e.vx * dt;
        e.ang += dt * 1.7;
        e.x = e.cx + Math.cos(e.ang) * e.ringR;
        e.y = e.cy + Math.sin(e.ang) * e.ringR * 0.62;
      } else if (e.type === 'tendril') {
        const dy = G.py - e.y;
        e.vy += clamp(dy * 1.6, -180, 180) * dt;
        e.vy = clamp(e.vy, -160, 160);
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.y = clamp(e.y, 16, VH - 16);
      } else if (e.type === 'mid' || e.type === 'boss') {
        const holdX = G.cam + VW - 168;
        if (e.x > holdX) e.x += e.vx * dt;
        else e.x = lerp(e.x, holdX, clamp(dt * 1.8, 0, 1));
        if (e.variant === 'core') {
          if (e.dash > 0) {
            e.dash -= dt;
            e.x += -220 * dt;
            if (e.dash <= 0) e.dash = -0.8;
          } else if (e.dash < 0) {
            e.dash += dt;
            e.x += 160 * dt;
            if (e.dash >= 0) e.dash = 0;
          } else if (e.t > 1.4 && ((e.t * 0.4) | 0) !== (((e.t - dt) * 0.4) | 0)) {
            e.dash = 0.55;
          }
          e.y = VH * 0.5 + Math.sin(e.t * 1.4) * 70;
        } else if (e.variant === 'wyrm') {
          e.y = VH * 0.5 + Math.sin(e.t * 1.25) * 92;
          if (e.bits) {
            for (let b = 0; b < e.bits.length; b++) e.bits[b] += dt * 1.8;
          }
        } else {
          const amp = e.type === 'boss' ? 78 : 86;
          e.y = VH * 0.5 + Math.sin(e.t * (e.hp < e.maxHp * 0.5 ? 1.7 : 1.15)) * amp;
        }
        e.y = clamp(e.y, 50, VH - 50);
        e.x = clamp(e.x, G.cam + 120, G.cam + VW - 70);
        e.spin += dt * (e.hp < e.maxHp * 0.5 ? 2.4 : 1.4);
      } else {
        e.x += e.vx * dt;
        e.y += (e.vy || 0) * dt;
        if (e.type === 'node') e.y = clamp(e.y + Math.sin(e.t * 1.5) * 28 * dt, 40, VH - 40);
        if (e.type === 'crystal') {
          e.spin += dt * 1.4;
          e.y = clamp(e.y, 30, VH - 30);
        }
        if (e.type === 'pod') e.y = clamp(e.y + Math.sin(e.t * 2) * 36 * dt, 40, VH - 40);
      }

      if (e.x - G.cam < -80 && e.type !== 'mid' && e.type !== 'boss') {
        e.alive = false;
        continue;
      }

      if (e.shootCd != null) e.shootCd -= dt;
      if (e.shootCd <= 0 && e.x - G.cam < VW + 10 && e.x - G.cam > 40) {
        const rage = e.hp < e.maxHp * 0.5;
        if (e.type === 'mite' || e.type === 'tendril') {
          if (Math.random() < (storm ? 0.55 : 0.38)) aimShot(e.x, e.y, storm ? 210 : 170, 0, false);
          e.shootCd = (rand(1.1, 2.0) / shotMul);
        } else if (e.type === 'node') {
          aimShot(e.x - 8, e.y, storm ? 200 : 164, -0.18, false);
          aimShot(e.x - 8, e.y, storm ? 200 : 164, 0, false);
          aimShot(e.x - 8, e.y, storm ? 200 : 164, 0.18, false);
          e.shootCd = (rage ? 0.7 : 1.05) / shotMul;
        } else if (e.type === 'crystal') {
          if (Math.random() < 0.45) aimShot(e.x, e.y, 140, 0, false);
          e.shootCd = 1.6 / shotMul;
        } else if (e.type === 'pod') {
          aimShot(e.x, e.y, 150, 0, false);
          e.shootCd = 1.2 / shotMul;
        } else if (e.type === 'mid') {
          if (e.variant === 'pulse') {
            const n = rage ? 5 : 3;
            for (let k = 0; k < n; k++) {
              aimShot(e.x - 10, e.y, storm ? 190 : 156, (k - (n - 1) * 0.5) * 0.2, false);
            }
            e.shootCd = (rage ? 0.72 : 1.05) / shotMul;
          } else if (e.variant === 'vein') {
            ringShot(e.x, e.y, rage ? 10 : 8, storm ? 150 : 128, e.spin);
            if (rage) aimShot(e.x, e.y, 180, 0, false);
            e.shootCd = (rage ? 0.78 : 1.12) / shotMul;
          } else {
            aimShot(e.x - 12, e.y, 200, 0, true);
            enemyShot(e.x - 8, e.y - 10, -160, -40, false);
            enemyShot(e.x - 8, e.y + 10, -160, 40, false);
            e.shootCd = (rage ? 0.62 : 0.92) / shotMul;
          }
        } else if (e.type === 'boss') {
          if (e.variant === 'spider') {
            ringShot(e.x, e.y, rage ? 12 : 8, storm ? 148 : 124, e.spin);
            aimShot(e.x - 12, e.y, storm ? 190 : 158, -0.16, false);
            aimShot(e.x - 12, e.y, storm ? 190 : 158, 0.16, false);
            if (rage) aimShot(e.x - 12, e.y, 170, 0, true);
            e.shootCd = (rage ? 0.7 : 1.05) / shotMul;
          } else if (e.variant === 'wyrm') {
            ringShot(e.x, e.y, rage ? 16 : 10, storm ? 140 : 118, e.spin);
            if (e.bits) {
              for (let b = 0; b < e.bits.length; b++) {
                const a = e.bits[b];
                const bx = e.x + Math.cos(a) * 38;
                const by = e.y + Math.sin(a) * 28;
                aimShot(bx, by, 150, 0, false);
              }
            }
            e.shootCd = (rage ? 0.68 : 1.0) / shotMul;
          } else {
            ringShot(e.x, e.y, rage ? 14 : 10, 118, e.spin);
            ringShot(e.x, e.y, 8, 168, e.spin + 0.4);
            aimShot(e.x - 16, e.y, 200, 0, true);
            if (rage) {
              aimShot(e.x - 10, e.y - 18, 180, -0.1, false);
              aimShot(e.x - 10, e.y + 18, 180, 0.1, false);
            }
            e.shootCd = (rage ? 0.58 : 0.88) / shotMul;
          }
        }
      }
    }
  }

  function updateWaves(dt) {
    for (let i = G.waves.length - 1; i >= 0; i--) {
      const w = G.waves[i];
      w.t += dt;
      w.r += (190 + w.lv * 90) * dt;
      w.x += w.vx * dt;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive || w.hit[e.id]) continue;
        const ex = e.x - G.cam;
        const rad = Math.max(e.w, e.h) * 0.55;
        if (hypot(ex - w.x, e.y - w.y) < w.r + rad) {
          w.hit[e.id] = true;
          hurtEnt(e, w.dmg, ex, e.y);
        }
      }
      for (let k = G.eShots.length - 1; k >= 0; k--) {
        const s = G.eShots[k];
        const sxv = s.x - G.cam;
        if (hypot(sxv - w.x, s.y - w.y) < w.r + s.r) {
          emit(3, {
            x: sxv, y: s.y, j: 2,
            vx0: -40, vx1: 40, vy0: -40, vy1: 40,
            r0: 1, r1: 2.4, life: 0.16, rgb: PUL, g: 0
          });
          G.eShots.splice(k, 1);
        }
      }
      if (w.r >= w.maxR || w.t > 0.72 || w.x > VW + 80) G.waves.splice(i, 1);
    }
  }

  function updateShots(dt) {
    capArr(G.shots, 90);
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > VW + 50 || s.y < -30 || s.y > VH + 30) {
        G.shots.splice(i, 1);
        continue;
      }
      let used = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        const ex = e.x - G.cam;
        const ew = e.w * 0.7;
        const eh = e.h * 0.7;
        if (Math.abs(s.x - ex) < s.w * 0.6 + ew && Math.abs(s.y - e.y) < s.h * 0.8 + eh) {
          hurtEnt(e, s.dmg, ex, e.y);
          used = true;
          break;
        }
      }
      if (used) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const sxv = s.x - G.cam;
      if (s.life <= 0 || sxv < -40 || sxv > VW + 40 || s.y < -24 || s.y > VH + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && G.invuln <= 0 && hypot(sxv - G.px, s.y - G.py) < 7.5 + s.r) {
        G.eShots.splice(i, 1);
        diePlayer();
      }
    }
  }

  function collideBodies() {
    if (G.deadT > 0 || G.invuln > 0) return;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const ex = e.x - G.cam;
      const r = Math.max(e.w, e.h) * (e.type === 'boss' || e.type === 'mid' ? 0.42 : 0.58);
      if (hypot(ex - G.px, e.y - G.py) < 7.2 + r) {
        diePlayer();
        return;
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.2);
      return;
    }
    updateFx(dt);
    if (G.mode === 'title') {
      G.cam += 28 * dt;
      G.py = VH * 0.5 + Math.sin(G.t * 1.4) * 10;
      return;
    }
    if (G.mode === 'lose') return;
    if (G.mode === 'win') {
      G.cam += 20 * dt;
      return;
    }

    if (G.winT > 0) {
      G.winT -= dt;
      updateShots(dt);
      updateEnts(dt);
      updateWaves(dt);
      updatePick(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    G.cam += scrollSpd() * dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnts(dt);
      updateShots(dt);
      updateWaves(dt);
      updatePick(dt);
      maybeSpawn();
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.bombCd > 0) G.bombCd -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    addPulse((isStorm() ? 5.2 : 6.4) * dt);

    updateMove(dt);
    const shooting = keys.sht || pointer.down;
    if (shooting && G.fireCd <= 0 && !overlayOpen()) fireShot();

    if (!REDUCE && ((G.t * 22) | 0) !== (((G.t - dt) * 22) | 0)) {
      emit(1, {
        x: G.px - 12, y: G.py, j: 2.2,
        vx0: -100, vx1: -28, vy0: -16, vy1: 16,
        r0: 1.1, r1: 2.5, life: 0.2, rgb: SKY, g: 0
      });
    }
    maybeSpawn();
    updateEnts(dt);
    updateShots(dt);
    updateWaves(dt);
    updatePick(dt);
    collideBodies();
    syncPulseUi();
    if (comboEl) {
      if (G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? ('连击 ' + G.combo + ' ×' + G.mult) : ('连击 ' + G.combo);
      } else comboEl.hidden = true;
    }
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      c.fillStyle = rgba(WHT, s.a);
      c.fillRect(sx(s.x), sy(s.y), s.s * scale, s.s * scale);
    }
    for (let i = 0; i < dust.length; i++) {
      const d = dust[i];
      c.fillStyle = rgba(TEAL, d.a);
      c.beginPath();
      c.ellipse(sx(d.x), sy(d.y), d.s * scale, d.s * 0.4 * scale, 0, 0, TAU);
      c.fill();
    }
  }

  function drawVeins() {
    const c = ctx;
    const cam = G.cam;
    const st = G.stage;
    const topCol = st === 3 ? [40, 18, 48] : st === 2 ? [12, 42, 48] : [8, 36, 44];
    c.fillStyle = rgba(topCol, 0.55);
    const step = 14;
    const start = Math.floor(cam / step) * step;
    c.beginPath();
    c.moveTo(sx(0), sy(0));
    for (let wx = start; wx <= cam + VW + step; wx += step) {
      const n = hash2((wx / step) | 0);
      const h = 16 + n * 26 + Math.sin(wx * 0.018) * 9;
      c.lineTo(sx(wx - cam), sy(h));
    }
    c.lineTo(sx(VW), sy(0));
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let wx = start; wx <= cam + VW + step; wx += step) {
      const n = hash2(((wx / step) | 0) + 91);
      const h = VH - (18 + n * 24 + Math.sin(wx * 0.016 + 1.2) * 8);
      c.lineTo(sx(wx - cam), sy(h));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    c.fill();

    c.strokeStyle = rgba(PUL, st === 3 ? 0.18 : 0.1);
    c.lineWidth = Math.max(1, 1.4 * scale);
    for (let i = 0; i < 3; i++) {
      const y0 = 70 + i * 110;
      c.beginPath();
      for (let x = 0; x <= VW; x += 20) {
        const y = y0 + Math.sin((x + cam) * 0.012 + i) * (10 + i * 4);
        if (x === 0) c.moveTo(sx(x), sy(y));
        else c.lineTo(sx(x), sy(y));
      }
      c.stroke();
    }
  }

  function drawPlanet() {
    const c = ctx;
    const st = G.stage;
    const drift = (G.cam * 0.08) % (VW + 200);
    if (st === 1) {
      const px = VW + 20 - drift * 0.4;
      const py = VH + 20;
      const g = c.createRadialGradient(sx(px - 30), sy(py - 70), 8 * scale, sx(px), sy(py), 200 * scale);
      g.addColorStop(0, rgba(PUL, 0.32));
      g.addColorStop(0.45, rgba(CYN, 0.12));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(sx(px), sy(py), 190 * scale, 0, TAU);
      c.fill();
    } else if (st === 2) {
      const px = VW * 0.74 - drift * 0.18;
      const py = VH * 0.3;
      c.fillStyle = rgba([30, 70, 80], 0.4);
      c.beginPath();
      c.arc(sx(px), sy(py), 64 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(PUL, 0.3);
      c.lineWidth = Math.max(1, 3.5 * scale);
      c.beginPath();
      c.ellipse(sx(px), sy(py), 104 * scale, 16 * scale, -0.28, 0, TAU);
      c.stroke();
    } else {
      const px = VW * 0.8;
      const py = VH * 0.5;
      const beat = 1 + Math.sin(G.t * 2.2) * 0.06;
      const g = c.createRadialGradient(sx(px), sy(py), 10 * scale, sx(px), sy(py), 140 * beat * scale);
      g.addColorStop(0, rgba(MAG, 0.28));
      g.addColorStop(0.45, rgba(PUL, 0.12));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(sx(px), sy(py), 130 * beat * scale, 0, TAU);
      c.fill();
    }
  }

  function drawHpBar(e) {
    const c = ctx;
    const x = e.x - G.cam;
    const w = e.type === 'boss' ? 70 : 48;
    const ratio = clamp(e.hp / e.maxHp, 0, 1);
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(sx(x - w * 0.5), sy(e.y - e.h * 0.72), w * scale, 4 * scale);
    c.fillStyle = rgba(ratio < 0.35 ? MAG : PUL, 0.95);
    c.fillRect(sx(x - w * 0.5), sy(e.y - e.h * 0.72), w * ratio * scale, 4 * scale);
  }

  function drawMite(e) {
    const c = ctx;
    const x = sx(e.x - G.cam);
    const y = sy(e.y);
    c.save();
    c.translate(x, y);
    c.fillStyle = rgba(CYN, 0.92);
    c.beginPath();
    c.ellipse(0, 0, 8 * scale, 5 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(PUL, 0.9);
    c.beginPath();
    c.ellipse(-2 * scale, 0, 3.2 * scale, 2.2 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.7);
    c.fillRect(2 * scale, -1.2 * scale, 6 * scale, 2.4 * scale);
    c.restore();
  }

  function drawTendril(e) {
    const c = ctx;
    const x = sx(e.x - G.cam);
    const y = sy(e.y);
    c.save();
    c.translate(x, y);
    c.strokeStyle = rgba(MAG, 0.85);
    c.lineWidth = Math.max(1.5, 3.2 * scale);
    c.beginPath();
    c.moveTo(8 * scale, 0);
    c.quadraticCurveTo(-4 * scale, Math.sin(e.t * 8) * 8 * scale, -16 * scale, Math.sin(e.t * 6) * 10 * scale);
    c.stroke();
    c.fillStyle = rgba(PNK, 0.92);
    c.beginPath();
    c.ellipse(4 * scale, 0, 7 * scale, 4.5 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.7);
    c.beginPath();
    c.arc(6 * scale, 0, 2 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawNode(e) {
    const c = ctx;
    const x = sx(e.x - G.cam);
    const y = sy(e.y);
    const beat = 1 + Math.sin(e.t * 5) * 0.08;
    c.save();
    c.translate(x, y);
    c.fillStyle = rgba(TEAL, 0.95);
    c.beginPath();
    c.ellipse(0, 0, 14 * beat * scale, 11 * beat * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.85);
    c.beginPath();
    c.arc(-2 * scale, 0, 5 * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(PUL, 0.7);
    c.lineWidth = Math.max(1, 1.4 * scale);
    c.beginPath();
    c.arc(0, 0, 16 * scale, 0, TAU);
    c.stroke();
    c.restore();
  }

  function drawCrystal(e) {
    const c = ctx;
    const x = sx(e.x - G.cam);
    const y = sy(e.y);
    c.save();
    c.translate(x, y);
    c.rotate(e.spin || 0);
    c.fillStyle = rgba(SKY, 0.88);
    c.beginPath();
    c.moveTo(0, -11 * scale);
    c.lineTo(9 * scale, 0);
    c.lineTo(0, 11 * scale);
    c.lineTo(-9 * scale, 0);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.55);
    c.beginPath();
    c.moveTo(0, -5 * scale);
    c.lineTo(4 * scale, 0);
    c.lineTo(0, 5 * scale);
    c.lineTo(-4 * scale, 0);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawPod(e) {
    const c = ctx;
    const x = sx(e.x - G.cam);
    const y = sy(e.y);
    c.save();
    c.translate(x, y);
    c.fillStyle = rgba(GOLD, 0.9);
    c.beginPath();
    c.ellipse(0, 0, 13 * scale, 10 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.85);
    c.beginPath();
    c.ellipse(-1 * scale, 0, 6 * scale, 5 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(PUL, 0.9);
    c.beginPath();
    c.arc(-1 * scale, 0, 3 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawMid(e) {
    const c = ctx;
    const x = sx(e.x - G.cam);
    const y = sy(e.y);
    c.save();
    c.translate(x, y);
    const beat = 1 + Math.sin(e.t * 4) * 0.06;
    if (e.variant === 'pulse') {
      c.fillStyle = rgba(CYN, 0.92);
      c.beginPath();
      c.ellipse(0, 0, 28 * beat * scale, 20 * beat * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(PUL, 0.8);
      c.beginPath();
      c.arc(-6 * scale, 0, 10 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(WHT, 0.5);
      c.lineWidth = Math.max(1, 2 * scale);
      c.beginPath();
      c.arc(0, 0, 32 * scale, 0, TAU);
      c.stroke();
    } else if (e.variant === 'vein') {
      c.fillStyle = rgba(MAG, 0.88);
      c.beginPath();
      c.ellipse(0, 0, 26 * scale, 16 * scale, 0, 0, TAU);
      c.fill();
      for (let i = 0; i < 4; i++) {
        const a = e.spin + i * (TAU / 4);
        c.strokeStyle = rgba(PUL, 0.7);
        c.lineWidth = Math.max(1, 2.4 * scale);
        c.beginPath();
        c.moveTo(Math.cos(a) * 10 * scale, Math.sin(a) * 8 * scale);
        c.lineTo(Math.cos(a) * 28 * scale, Math.sin(a) * 22 * scale);
        c.stroke();
      }
      c.fillStyle = rgba(GOLD, 0.85);
      c.beginPath();
      c.arc(0, 0, 7 * scale, 0, TAU);
      c.fill();
    } else {
      c.fillStyle = rgba(VIO, 0.9);
      c.beginPath();
      c.arc(0, 0, 24 * beat * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MAG, 0.7);
      c.beginPath();
      c.arc(0, 0, 12 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(PUL, 0.6);
      c.lineWidth = Math.max(1, 2 * scale);
      c.beginPath();
      c.arc(0, 0, 30 * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    drawHpBar(e);
  }

  function drawBoss(e) {
    const c = ctx;
    const x = sx(e.x - G.cam);
    const y = sy(e.y);
    c.save();
    c.translate(x, y);
    const beat = 1 + Math.sin(e.t * 3.2) * 0.05;
    if (e.variant === 'spider') {
      c.fillStyle = rgba(SKY, 0.92);
      c.beginPath();
      c.ellipse(0, 0, 34 * beat * scale, 22 * beat * scale, 0, 0, TAU);
      c.fill();
      for (let i = 0; i < 6; i++) {
        const a = -0.9 + i * 0.36 + Math.sin(e.t * 4 + i) * 0.12;
        const side = i < 3 ? -1 : 1;
        c.strokeStyle = rgba(CYN, 0.75);
        c.lineWidth = Math.max(1.4, 2.6 * scale);
        c.beginPath();
        c.moveTo(side * 10 * scale, -6 * scale);
        c.lineTo(side * Math.cos(a) * 42 * scale, Math.sin(a) * 34 * scale);
        c.stroke();
      }
      c.fillStyle = rgba(MAG, 0.85);
      c.beginPath();
      c.arc(-8 * scale, 0, 10 * scale, 0, TAU);
      c.fill();
    } else if (e.variant === 'wyrm') {
      if (e.bits) {
        for (let i = e.bits.length - 1; i >= 0; i--) {
          const a = e.bits[i];
          const bx = Math.cos(a) * (22 + i * 8);
          const by = Math.sin(a * 1.2) * (16 + i * 4);
          c.fillStyle = rgba(i % 2 ? MAG : CYN, 0.85);
          c.beginPath();
          c.ellipse(bx * scale, by * scale, (12 - i) * scale, (8 - i * 0.6) * scale, a, 0, TAU);
          c.fill();
        }
      }
      c.fillStyle = rgba(PUL, 0.95);
      c.beginPath();
      c.ellipse(0, 0, 22 * scale, 16 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.8);
      c.beginPath();
      c.arc(-6 * scale, -3 * scale, 3 * scale, 0, TAU);
      c.fill();
    } else {
      c.fillStyle = rgba(MAG, 0.9);
      c.beginPath();
      c.arc(0, 0, 36 * beat * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.7);
      c.beginPath();
      c.arc(0, 0, 16 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(PUL, 0.7);
      c.lineWidth = Math.max(1.4, 3 * scale);
      for (let i = 0; i < 5; i++) {
        const a = e.spin + i * (TAU / 5);
        c.beginPath();
        c.moveTo(Math.cos(a) * 16 * scale, Math.sin(a) * 16 * scale);
        c.lineTo(Math.cos(a) * 44 * scale, Math.sin(a) * 32 * scale);
        c.stroke();
      }
      c.strokeStyle = rgba(WHT, 0.45);
      c.beginPath();
      c.arc(0, 0, 42 * beat * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    drawHpBar(e);
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0) return;
    const c = ctx;
    c.save();
    c.translate(sx(G.px), sy(G.py));
    const lv = pulseLevel();
    if (lv >= 1) {
      const rad = 10 + lv * 5 + Math.sin(G.t * 10) * 1.6;
      c.strokeStyle = rgba(lv >= 3 ? GOLD : PUL, 0.35 + lv * 0.12);
      c.lineWidth = Math.max(1, 1.4 * scale);
      c.beginPath();
      c.ellipse(4 * scale, 0, rad * scale, rad * 0.62 * scale, 0, 0, TAU);
      c.stroke();
    }
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle * 10);
      c.fillRect(14 * scale, -2.2 * scale, 12 * scale, 4.4 * scale);
    }
    c.fillStyle = rgba(CYN, 0.96);
    c.beginPath();
    c.moveTo(18 * scale, 0);
    c.lineTo(-2 * scale, -8.5 * scale);
    c.lineTo(-13 * scale, -3.2 * scale);
    c.lineTo(-13 * scale, 3.2 * scale);
    c.lineTo(-2 * scale, 8.5 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.92);
    c.beginPath();
    c.moveTo(10 * scale, 0);
    c.lineTo(-1 * scale, -3.4 * scale);
    c.lineTo(-1 * scale, 3.4 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(PUL, 0.9);
    c.fillRect(-13 * scale, -2.2 * scale, 8 * scale, 4.4 * scale);
    const thr = 0.6 + Math.sin(G.t * 28) * 0.4;
    c.fillStyle = rgba(SKY, 0.55 + thr * 0.4);
    c.beginPath();
    c.moveTo(-13 * scale, -2.4 * scale);
    c.lineTo((-22 - thr * 10) * scale, 0);
    c.lineTo(-13 * scale, 2.4 * scale);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      c.fillStyle = rgba(s.rgb || CYN, 0.95);
      c.beginPath();
      c.ellipse(sx(s.x), sy(s.y), s.w * 0.55 * scale, Math.max(1.6, s.h * 0.7) * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.fillRect(sx(s.x - 2), sy(s.y - 1), 6 * scale, 2 * scale);
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      c.fillStyle = rgba(s.fat ? GOLD : PNK, 0.95);
      c.beginPath();
      c.arc(sx(s.x - G.cam), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      if (s.fat) {
        c.fillStyle = rgba(MAG, 0.7);
        c.beginPath();
        c.arc(sx(s.x - G.cam), sy(s.y), s.r * 0.42 * scale, 0, TAU);
        c.fill();
      }
    }
  }

  function drawPulseWaves() {
    const c = ctx;
    for (let i = 0; i < G.waves.length; i++) {
      const w = G.waves[i];
      const a = clamp(1 - w.t / 0.72, 0, 1);
      const rgb = w.lv >= 3 ? GOLD : PUL;
      c.strokeStyle = rgba(rgb, 0.85 * a);
      c.lineWidth = Math.max(1.4, (3.2 + w.lv) * scale * a);
      c.beginPath();
      c.ellipse(sx(w.x), sy(w.y), w.r * scale, w.r * 0.7 * scale, 0, 0, TAU);
      c.stroke();
      c.strokeStyle = rgba(WHT, 0.4 * a);
      c.lineWidth = Math.max(1, 1.4 * scale);
      c.beginPath();
      c.ellipse(sx(w.x), sy(w.y), w.r * 0.72 * scale, w.r * 0.5 * scale, 0, 0, TAU);
      c.stroke();
      if (w.lv >= 2) {
        c.fillStyle = rgba(rgb, 0.08 * a);
        c.beginPath();
        c.ellipse(sx(w.x), sy(w.y), w.r * scale, w.r * 0.7 * scale, 0, 0, TAU);
        c.fill();
      }
    }
  }

  function drawPick() {
    const c = ctx;
    for (let i = 0; i < G.pick.length; i++) {
      const p = G.pick[i];
      const x = p.x - G.cam;
      const bob = Math.sin(p.t * 6) * 2;
      c.save();
      c.translate(sx(x), sy(p.y + bob));
      c.rotate(p.t * 1.4);
      c.fillStyle = rgba(PUL, 0.92);
      c.beginPath();
      c.moveTo(0, -11 * scale);
      c.lineTo(11 * scale, 0);
      c.lineTo(0, 11 * scale);
      c.lineTo(-11 * scale, 0);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 0.92);
      c.font = '700 ' + (10 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.rotate(-p.t * 1.4);
      c.fillText('脉', 0, 0.6 * scale);
      c.restore();
    }
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      c.fillRect(sx(p.x - p.r * 0.5), sy(p.y - p.r * 0.5), p.r * scale, p.r * scale);
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.28;
      c.fillStyle = rgba(s.rgb, 1 - t);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.rad * (0.4 + t) * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, 1 - t);
      c.lineWidth = Math.max(1, 2 * scale * (1 - t));
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + t * 28) * scale, 0, TAU);
      c.stroke();
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#031418';
    c.fillRect(0, 0, W, H);

    c.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake * scale;
      shy = (Math.random() - 0.5) * G.shake * 0.7 * scale;
    }
    const punch = REDUCE ? 1 : G.punch;
    c.translate(W * 0.5 + shx, H * 0.5 + shy);
    c.scale(punch, punch);
    c.translate(-W * 0.5, -H * 0.5);

    const g = c.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#041820');
      g.addColorStop(1, '#031016');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#120814');
      g.addColorStop(1, '#041018');
    } else {
      g.addColorStop(0, '#041c20');
      g.addColorStop(1, '#031418');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawPlanet();
    drawStars();
    drawVeins();

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = e.x - G.cam;
      if (e.type !== 'boss' && e.type !== 'mid' && (x < -50 || x > VW + 50)) continue;
      if (e.type === 'mite') drawMite(e);
      else if (e.type === 'tendril') drawTendril(e);
      else if (e.type === 'node') drawNode(e);
      else if (e.type === 'crystal') drawCrystal(e);
      else if (e.type === 'pod') drawPod(e);
      else if (e.type === 'mid') drawMid(e);
      else if (e.type === 'boss') drawBoss(e);
    }

    drawPick();
    drawShip();
    drawShots();
    drawPulseWaves();
    drawFx();

    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    c.restore();
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerWorldY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
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

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'win' && G.kind === 'raid') startGame('storm');
    else goTitle();
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (space) keys.sht = down;
    const bomb = k === 'Shift' || k === 'z' || k === 'Z' || e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || bomb || k === 'Enter')) {
      e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (k === 'r' || k === 'R' || bomb)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'storm' : 'raid');
      return;
    }
    if (bomb && G.mode === 'play' && !overlayOpen()) {
      tryPulse();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
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
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down) inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
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
    let dt = t - last;
    last = t;
    if (!(dt > 0)) dt = STEP;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
  }

  function bind() {
    window.addEventListener('keydown', function (e) { onKey(e, true); });
    window.addEventListener('keyup', function (e) { onKey(e, false); });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (!hidden) last = performance.now() * 0.001;
    });
    bindPointer();
    if (btnRaid) btnRaid.addEventListener('click', function () { audio.ensure(); startGame('raid'); });
    if (btnStorm) btnStorm.addEventListener('click', function () { audio.ensure(); startGame('storm'); });
    if (btnOvRetry) btnOvRetry.addEventListener('click', function () { primaryAction(); });
    if (btnOvModes) btnOvModes.addEventListener('click', function () { secondaryAction(); });
    if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
    if (btnMute) btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
    if (btnBomb) btnBomb.addEventListener('click', function () {
      audio.ensure();
      tryPulse();
    });
  }

  function loadMute() {
    try {
      audio.setMuted(localStorage.getItem(MUTE_KEY) === '1');
    } catch (err) {
      audio.setMuted(false);
    }
  }

  loadBest();
  loadMute();
  seedStars();
  bind();
  resize();
  goTitle();
  last = performance.now() * 0.001;
  requestAnimationFrame(frame);
})();
