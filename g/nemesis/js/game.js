'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.36;
  const OPT_GAP = 12;
  const OPT_MAX = 4;
  const BOSS_AT = 9600;
  const STAGE_END = [3100, 6200, 9600];
  const BEST_KEY = 'playbox-nemesis-best';
  const MUTE_KEY = 'playbox-nemesis-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 点选 · R 重开 · M 静音';
  const TITLE_LEAD = '横向穿行星廊。吃橙卵推进武装槽，Shift 点选。撞壁、撞体、中弹都掉命。打穿三关后轰核。别当成沙罗、命力、泽泽或攀升——这是复仇，不是巨蛇，不是活体要塞，不是触手，不是燃油投弹。';
  const STAGE_NAME = ['空廊', '火岭', '石阵'];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const CYN = [0, 240, 106];
  const TEAL = [60, 255, 176];
  const GOLD = [255, 227, 107];
  const ORG = [255, 184, 74];
  const WHT = [232, 255, 242];
  const PNK = [255, 154, 196];
  const STN = [118, 156, 136];
  const RED = [255, 72, 88];
  const DEEP = [8, 36, 22];
  const PLATE = [28, 78, 52];
  const LAVA = [255, 92, 48];

  const SCORE = {
    fan: 50, red: 100, hatch: 140, ducker: 120,
    rock: 20, pillar: 180, moai: 400, ring: 40,
    carrier: 280, sat: 200, core: 4500, cap: 40
  };

  const SLOTS = [
    { id: 'speed', name: '速', full: '加速' },
    { id: 'missile', name: '导', full: '导弹' },
    { id: 'double', name: '双', full: '双重' },
    { id: 'laser', name: '激', full: '激光' },
    { id: 'option', name: '分', full: '分身' },
    { id: 'shield', name: '?', full: '护盾' }
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
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnPow = document.getElementById('btn-pow');
  const btnPad = document.getElementById('btn-pad');
  const pwrEl = document.getElementById('pwr');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
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
  let eid = 1;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 88, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const slotEls = pwrEl ? Array.prototype.slice.call(pwrEl.querySelectorAll('.slot')) : [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    cam: 0,
    px: 88,
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
    options: [],
    trail: [],
    bar: 0,
    speed: 0,
    missile: false,
    double: false,
    laser: false,
    shield: 0,
    caps: 0,
    spawnedX: 0,
    fireCd: 0,
    misCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    boss: false,
    winT: 0,
    engine: 0,
    shieldFlash: 0
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
  function isDense() {
    return G.kind === 'core';
  }
  function pwx() {
    return G.cam + G.px;
  }
  function scrX(wx) {
    return wx - G.cam;
  }
  function stageAt(wx) {
    if (wx < STAGE_END[0]) return 1;
    if (wx < STAGE_END[1]) return 2;
    return 3;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function valNoise(x, salt) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = hash2(i + salt * 9973);
    const b = hash2(i + 1 + salt * 9973);
    return a + (b - a) * u;
  }
  function fbm(x, salt) {
    return valNoise(x, salt) * 0.55
      + valNoise(x * 2.07, salt + 17) * 0.3
      + valNoise(x * 4.13, salt + 31) * 0.15;
  }
  function volcanoBump(wx) {
    const p = 440;
    const m = ((wx % p) + p) % p;
    if (m > 86 && m < 186) {
      const u = (m - 86) / 100;
      const tri = u < 0.5 ? u * 2 : (1 - u) * 2;
      return tri * tri * 62;
    }
    return 0;
  }
  function plateStep(wx) {
    const p = 268;
    const m = ((wx % p) + p) % p;
    if (m < 42) return (1 - m / 42) * 10;
    if (m > 226) return ((m - 226) / 42) * 10;
    return 0;
  }
  function caveAt(wx) {
    const st = stageAt(wx);
    const n1 = fbm(wx * 0.0017, 2);
    const n2 = fbm(wx * 0.0036, 9);
    let top = 10;
    let bot = VH - 10;
    if (st === 1) {
      top = 10 + n1 * 12 + plateStep(wx);
      bot = VH - 12 - n2 * 14 - plateStep(wx + 80);
    } else if (st === 2) {
      top = 14 + n1 * 22;
      bot = VH - 12 - n2 * 18 - volcanoBump(wx);
    } else {
      top = 22 + n1 * 38 + (n2 > 0.7 ? 16 : 0);
      bot = VH - 22 - n2 * 42;
    }
    if (wx < 460) {
      const t = wx / 460;
      top = lerp(8, top, t);
      bot = lerp(VH - 8, bot, t);
    }
    if (G.boss) {
      top = Math.min(top, 42);
      bot = Math.max(bot, VH - 42);
    }
    if (top > bot - 104) {
      const mid = (top + bot) * 0.5;
      top = mid - 52;
      bot = mid + 52;
    }
    return { top: top, bot: bot };
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
    shoot(laser) {
      this.ensure();
      if (laser) {
        this.beep(1240, 0.07, 'sawtooth', 0.03, 420);
        this.beep(1860, 0.05, 'square', 0.022, 880);
      } else {
        this.beep(880, 0.045, 'square', 0.03, 1640);
        this.beep(1180, 0.03, 'triangle', 0.014, 1760);
      }
    },
    missile() {
      this.ensure();
      this.beep(220, 0.1, 'sawtooth', 0.04, 90);
      this.noise(0.06, 0.03, 400);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.035);
      this.noise(0.04, 0.032, 1100);
      this.beep(500 * lift, 0.07, 'square', 0.038, 820 * lift);
    },
    cap() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.04, 990);
      this.beep(990, 0.1, 'triangle', 0.035, 1320);
    },
    speed() {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.042, 784);
      this.beep(784, 0.12, 'triangle', 0.036, 1175);
    },
    double() {
      this.ensure();
      this.beep(523, 0.06, 'square', 0.038, 659);
      this.beep(784, 0.1, 'square', 0.032, 1046);
    },
    laserOn() {
      this.ensure();
      this.beep(220, 0.08, 'sawtooth', 0.04, 1760);
      this.beep(880, 0.16, 'triangle', 0.04, 1760);
    },
    option() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.045, 784);
      this.beep(659, 0.08, 'triangle', 0.04, 1046);
      this.beep(784, 0.14, 'sine', 0.04, 1318);
      this.noise(0.07, 0.03, 800);
    },
    shieldUp() {
      this.ensure();
      this.beep(440, 0.08, 'sine', 0.04, 880);
      this.beep(660, 0.14, 'triangle', 0.038, 1320);
    },
    shieldHit() {
      this.ensure();
      this.beep(980, 0.06, 'triangle', 0.04, 420);
      this.noise(0.05, 0.04, 700);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    miss() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.02, 80);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.07, 240);
      this.beep(280, 0.24, 'sawtooth', 0.05, 62);
      this.beep(140, 0.36, 'sine', 0.042, 40);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    boom() {
      this.ensure();
      this.noise(0.26, 0.09, 150);
      this.beep(150, 0.32, 'sawtooth', 0.055, 44);
      this.beep(72, 0.44, 'sine', 0.04, 32);
    },
    check() {
      this.ensure();
      this.beep(196, 0.1, 'sine', 0.042, 392);
      this.beep(294, 0.14, 'triangle', 0.04, 587);
      this.beep(392, 0.2, 'sawtooth', 0.03, 784);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.045, 1046);
      this.beep(1046, 0.28, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.2, 'sawtooth', 0.04, 80);
      this.beep(120, 0.32, 'sine', 0.05, 44);
    },
    start() {
      this.ensure();
      this.beep(330, 0.09, 'square', 0.04, 659);
      this.beep(659, 0.14, 'triangle', 0.035, 988);
    },
    hatch() {
      this.ensure();
      this.beep(180, 0.05, 'square', 0.024, 90);
      this.noise(0.04, 0.02, 1400);
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
  function loadMute() {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch (err) {
      return false;
    }
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
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    addTok += 1;
    const tok = addTok;
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    G.toastT = 1.05;
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1050);
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < LIFE_CAP) {
      const el = document.createElement('i');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function ownedSlot(id) {
    if (id === 'speed') return G.speed > 0;
    if (id === 'missile') return G.missile;
    if (id === 'double') return G.double;
    if (id === 'laser') return G.laser;
    if (id === 'option') return G.options.length > 0;
    if (id === 'shield') return G.shield > 0;
    return false;
  }

  function syncSlots() {
    const cur = G.bar > 0 ? SLOTS[G.bar - 1] : null;
    for (let i = 0; i < slotEls.length; i++) {
      const el = slotEls[i];
      const id = el.getAttribute('data-id');
      el.classList.toggle('on', ownedSlot(id));
      el.classList.toggle('hot', !!(cur && cur.id === id));
    }
  }

  function flashSlot(id) {
    for (let i = 0; i < slotEls.length; i++) {
      if (slotEls[i].getAttribute('data-id') === id) {
        slotEls[i].classList.remove('flash');
        void slotEls[i].offsetWidth;
        slotEls[i].classList.add('flash');
      }
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '复仇';
      else if (G.boss) stageLabel.textContent = '核心';
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + (STAGE_NAME[G.stage - 1] || '');
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '核腔' : '复仇';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isDense());
      tagLabel.classList.toggle('hot', G.combo >= 8);
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
    else if (G.mode === 'lose') setHint('R 重开 · 吃橙卵推进武装槽，Shift 点选', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 核心尽破', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 护盾优先挡弹', 'warn');
    else if (G.bar > 0) {
      const s = SLOTS[G.bar - 1];
      setHint('Shift 点选「' + (s ? s.full : '') + '」', 'hot');
    } else if (G.laser) setHint('激光穿甲 · 分身抄射', '');
    else setHint('吃橙卵推进武装槽 · Shift 点选 · 分身滞后抄射', '');
    syncPips();
    syncSlots();
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'NEMS';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'lose' || kind === 'win';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
    if (btnOvRetry) btnOvRetry.textContent = '再穿';
    if (btnOvModes) {
      btnOvModes.textContent = (kind === 'win' && !isDense()) ? '核腔' : '换模式';
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
    const cls = mag >= 6 ? 'die' : mag >= 3.2 ? 'pow' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('pow');
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
        g: spec.g == null ? 280 : spec.g
      });
    }
    capArr(particles, 280);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 36);
    capArr(rings, 22);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -90 : -72
    });
    capArr(floats, 24);
  }

  function explode(x, y, rgb, power) {
    const p = power || 18;
    emit(Math.min(28, 10 + (p * 0.5) | 0), {
      x: x, y: y, j: 6,
      vx0: -220, vx1: 220, vy0: -180, vy1: 140,
      r0: 1.4, r1: 4.2, life: 0.42 + p * 0.006, rgb: rgb, g: 220
    });
    emit(6, {
      x: x, y: y, j: 3,
      vx0: -80, vx1: 80, vy0: -120, vy1: -20,
      r0: 2, r1: 5, life: 0.28, rgb: WHT, g: 80
    });
    popSpark(x, y, rgb, 12 + p * 0.4);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (comboEl && G.combo >= 2) {
      comboEl.hidden = false;
      comboEl.textContent = '连击 ×' + G.mult;
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
    }
    if (G.mult > prev) {
      toast(G.mult + ' 链', false, true);
      audio.combo(G.mult);
      floatText(G.px + 20, G.py - 22, G.mult + ' 链', GOLD, true);
      hitStop(0.038);
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (comboEl) comboEl.hidden = true;
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
  }

  function occupied(wx, y, rad) {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (Math.abs(e.wx - wx) < rad && Math.abs(e.y - y) < rad * 0.8) return true;
    }
    return false;
  }

  function pushEnt(e) {
    e.id = eid++;
    if (e.alive == null) e.alive = true;
    if (e.flash == null) e.flash = 0;
    G.ents.push(e);
    capArr(G.ents, 140);
  }

  function findCore() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'core' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function moveSpd() {
    return (isDense() ? 300 : 268) + G.speed * 28;
  }

  function scrollSpd() {
    if (G.boss) {
      const b = findCore();
      if (b && b.alive) {
        const x = scrX(b.wx);
        if (x < VW * 0.58) return isDense() ? 36 : 24;
        if (x < VW * 0.7) return 14;
        return 0;
      }
    }
    const base = isDense() ? 132 : 96;
    return base + (G.stage - 1) * 8 + Math.min(18, G.combo * 0.5);
  }

  function spawnFan(wx, y, n, redI, dive) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 26, cave.bot - 26);
    const dense = isDense();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'fan',
        wx: wx + i * 20,
        y: y + (i - (n - 1) * 0.5) * (dive ? 6 : 10),
        hw: 10, hh: 6,
        hp: 1,
        vx: -(dense ? 90 : 70),
        phase: i * 0.5,
        path: dive ? 'dive' : 'sine',
        red: i === redI,
        cd: rand(0.5, 1.4)
      });
    }
  }

  function spawnHatch(wx, ceil) {
    const cave = caveAt(wx);
    const y = ceil ? cave.top + 11 : cave.bot - 11;
    if (occupied(wx, y, 30)) return;
    pushEnt({
      type: 'hatch',
      wx: wx,
      y: y,
      hw: 13, hh: 10,
      hp: isDense() ? 4 : 3,
      max: isDense() ? 4 : 3,
      ceil: !!ceil,
      open: 0,
      want: 0,
      cd: rand(0.4, 1.2),
      phase: rand(0, TAU)
    });
  }

  function spawnDucker(wx) {
    const cave = caveAt(wx);
    if (occupied(wx, cave.bot - 12, 28)) return;
    pushEnt({
      type: 'ducker',
      wx: wx,
      y: cave.bot - 11,
      hw: 11, hh: 8,
      hp: 2,
      dir: hash2((wx / 16) | 0) > 0.5 ? 1 : -1,
      cd: rand(0.4, 1.1),
      walk: 0
    });
  }

  function spawnVolcano(wx) {
    const cave = caveAt(wx);
    const y = cave.bot + 6;
    if (occupied(wx, y, 40)) return;
    pushEnt({
      type: 'volcano',
      wx: wx,
      y: y,
      hw: 22, hh: 20,
      hp: 999,
      cd: rand(0.5, 1.4),
      heat: 0,
      scenery: true
    });
  }

  function spawnRock(wx, y, vx, vy) {
    pushEnt({
      type: 'rock',
      wx: wx,
      y: y,
      hw: 6, hh: 6,
      hp: 1,
      vx: vx,
      vy: vy,
      spin: rand(0, TAU)
    });
  }

  function spawnPillar(wx) {
    const cave = caveAt(wx);
    const h = 28 + hash2((wx / 20) | 0) * 36;
    const fromTop = hash2(((wx / 20) | 0) + 3) > 0.5;
    const y = fromTop ? cave.top + h * 0.5 + 6 : cave.bot - h * 0.5 - 6;
    if (occupied(wx, y, 34)) return;
    pushEnt({
      type: 'pillar',
      wx: wx,
      y: y,
      hw: 10, hh: h * 0.5,
      hp: isDense() ? 6 : 5,
      max: isDense() ? 6 : 5
    });
  }

  function spawnMoai(wx, ceil) {
    const cave = caveAt(wx);
    const y = ceil ? cave.top + 22 : cave.bot - 22;
    if (occupied(wx, y, 36)) return;
    pushEnt({
      type: 'moai',
      wx: wx,
      y: y,
      hw: 14, hh: 18,
      hp: isDense() ? 10 : 12,
      max: isDense() ? 10 : 12,
      cd: rand(0.8, 1.8),
      ceil: !!ceil,
      mouth: 0
    });
  }

  function spawnCarrier(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 30, cave.bot - 30);
    pushEnt({
      type: 'carrier',
      wx: wx,
      y: y,
      hw: 16, hh: 10,
      hp: 5, max: 5,
      vx: -(isDense() ? 52 : 38),
      phase: rand(0, TAU),
      drop: true
    });
  }

  function spawnCap(wx, y) {
    pushEnt({
      type: 'cap',
      wx: wx,
      y: y,
      hw: 9, hh: 9,
      hp: 1,
      spin: 0,
      vy: rand(-16, 16)
    });
  }

  function spawnSlice(wx) {
    if (G.boss) return;
    if (wx < 280) return;
    if (wx > BOSS_AT - 180) return;
    const st = stageAt(wx);
    const slice = (wx / 52) | 0;
    const h = hash2(slice * 19 + (isDense() ? 7 : 3) + 11);
    const cave = caveAt(wx);
    const mid = (cave.top + cave.bot) * 0.5;
    const dens = isDense() ? 0.72 : 1;
    const fanEvery = isDense() ? 3 : 4;

    if (slice % fanEvery === 0 && h > 0.14 * dens) {
      const y = lerp(cave.top + 36, cave.bot - 36, hash2(slice + 44));
      const n = (isDense() ? 6 : 5) + (st === 3 ? 1 : 0);
      const dive = h > 0.7 && st > 1;
      spawnFan(wx, y, n, h > 0.46 ? 0 : -1, dive);
    }
    if (slice % 8 === 3 && h > 0.26) {
      spawnFan(wx + 10, mid + (h > 0.5 ? 40 : -40), isDense() ? 5 : 4, 0, false);
    }
    if ((st === 1 || st === 3) && slice % (isDense() ? 4 : 5) === 2 && h > 0.28 * dens) {
      spawnHatch(wx, h > 0.5);
      if (isDense() && h > 0.62) spawnHatch(wx + 46, h <= 0.5);
    }
    if (st === 2 && slice % (isDense() ? 4 : 5) === 1 && h > 0.3 * dens) {
      spawnDucker(wx);
    }
    if (st === 2 && slice % 8 === 0) {
      spawnVolcano(wx);
    }
    if (st === 3 && slice % 6 === 1 && h > 0.22) {
      spawnPillar(wx);
    }
    if (st === 3 && slice % 6 === 3) {
      spawnMoai(wx, h > 0.48);
      if (isDense() && h > 0.7) spawnMoai(wx + 70, h <= 0.48);
    }
    if (slice % 11 === 2 && h > 0.22) {
      spawnCarrier(wx, mid + (h > 0.5 ? 24 : -24));
    }
    if (slice % 7 === 3 && h > 0.34) {
      spawnCap(wx, lerp(cave.top + 40, cave.bot - 40, hash2(slice + 9)));
    }
  }

  function spawnBoss() {
    G.boss = true;
    const hp = isDense() ? 144 : 112;
    const cave = caveAt(G.cam + VW * 0.72);
    const hy = (cave.top + cave.bot) * 0.5;
    pushEnt({
      type: 'core',
      wx: G.cam + VW * 0.86,
      y: hy,
      hw: 56, hh: 34,
      hp: hp,
      max: hp,
      open: 0,
      phase: 0,
      cd: 0.7,
      vy: 42,
      coreR: 13,
      angry: false
    });
    const n = isDense() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'sat',
        wx: G.cam + VW * 0.86,
        y: hy,
        hw: 9, hh: 9,
        hp: 3, max: 3,
        idx: i,
        ang: i * TAU / n,
        cd: 0.6 + i * 0.2
      });
    }
    toast('核心出现', false, true);
    audio.check();
    kick(4.2);
    screenFlash(GOLD, 0.32);
    syncHud();
  }

  function trySpawn() {
    if (!G.boss && G.mode === 'play') {
      if (G.cam + VW * 0.72 >= BOSS_AT) spawnBoss();
    }
    if (G.boss) return;
    const ahead = G.cam + VW + 80;
    while (G.spawnedX < ahead) {
      G.spawnedX += 52;
      spawnSlice(G.spawnedX);
    }
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        wx: hash2(i * 17) * 2800,
        y: 8 + hash2(i * 91 + 3) * (VH - 16),
        s: 0.5 + hash2(i * 5 + 9) * 1.8,
        p: 0.22 + hash2(i * 13) * 0.7
      });
    }
  }

  function award(kind, x, y) {
    bumpCombo();
    const n = (SCORE[kind] || 10) * G.mult;
    addScore(n);
    const gold = kind === 'core' || kind === 'moai' || kind === 'carrier' || G.mult >= 3;
    floatText(x, y - 8, '+' + n, gold ? GOLD : WHT, gold);
  }

  function stripPowers() {
    G.speed = 0;
    G.missile = false;
    G.double = false;
    G.laser = false;
    G.shield = 0;
    G.bar = 0;
    for (let i = 0; i < G.options.length; i++) {
      const o = G.options[i];
      explode(o.x, o.y, ORG, 14);
    }
    G.options.length = 0;
    G.trail.length = 0;
    syncSlots();
  }

  function spawnOption() {
    if (G.options.length >= OPT_MAX) {
      toast('分身 MAX', false, true);
      addScore(500 * G.mult);
      audio.cap();
      return;
    }
    const last = G.trail.length ? G.trail[Math.max(0, G.trail.length - 8)] : { x: G.px - 18, y: G.py };
    G.options.push({ x: last.x, y: last.y, t: 0 });
    toast('分身 ×' + G.options.length, false, true);
    audio.option();
    explode(last.x, last.y, ORG, 18);
    popSpark(last.x, last.y, GOLD, 22);
    hitStop(0.05);
    kick(3.4);
    screenFlash(ORG, 0.42);
    floatText(last.x, last.y - 14, 'OPTION', GOLD, true);
  }

  function applySlot(id) {
    if (id === 'speed') {
      if (G.speed < 5) G.speed += 1;
      toast(G.speed >= 5 ? '加速 MAX' : '加速 ×' + G.speed, false, true);
      audio.speed();
      kick(2.2);
      screenFlash(CYN, 0.28);
      emit(10, {
        x: G.px, y: G.py, j: 8,
        vx0: -40, vx1: 120, vy0: -80, vy1: 80,
        r0: 1.2, r1: 3, life: 0.28, rgb: CYN, g: 0
      });
    } else if (id === 'missile') {
      G.missile = true;
      toast('导弹', false, true);
      audio.missile();
      kick(2.4);
    } else if (id === 'double') {
      G.double = true;
      G.laser = false;
      toast('双重', false, true);
      audio.double();
      kick(2.4);
      screenFlash(TEAL, 0.22);
    } else if (id === 'laser') {
      G.laser = true;
      G.double = false;
      toast('激光', false, true);
      audio.laserOn();
      screenFlash(CYN, 0.42);
      hitStop(0.042);
      kick(3);
    } else if (id === 'option') {
      spawnOption();
    } else if (id === 'shield') {
      G.shield = 3;
      toast('护盾', false, true);
      audio.shieldUp();
      screenFlash(TEAL, 0.36);
      kick(2.8);
      popSpark(G.px + 22, G.py, TEAL, 18);
    }
    flashSlot(id);
    if (id !== 'option') {
      hitStop(0.032);
      popSpark(G.px, G.py, GOLD, 16);
    }
  }

  function activate() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bar <= 0) {
      toast('先吃橙卵', true);
      audio.miss();
      return;
    }
    const s = SLOTS[G.bar - 1];
    if (!s) return;
    applySlot(s.id);
    G.bar = 0;
    syncSlots();
    syncHud();
  }

  function collectCap(e) {
    e.alive = false;
    G.bar = G.bar % SLOTS.length + 1;
    G.caps += 1;
    audio.cap();
    const x = scrX(e.wx);
    popSpark(x, e.y, ORG, 14);
    floatText(x, e.y - 10, 'UP', GOLD, true);
    emit(8, {
      x: x, y: e.y, j: 6,
      vx0: -60, vx1: 60, vy0: -80, vy1: 40,
      r0: 1.4, r1: 3, life: 0.3, rgb: ORG, g: 40
    });
    if (G.caps === 1) toast('Shift 点选武装', false, true);
    else {
      const s = SLOTS[G.bar - 1];
      toast(s ? s.full : '武装', false, true);
    }
    addScore(SCORE.cap);
    hitStop(0.028);
    kick(1.6);
    syncSlots();
    syncHud();
  }

  function sources() {
    const list = [{ x: G.px + 16, y: G.py }];
    for (let i = 0; i < G.options.length; i++) {
      list.push({ x: G.options[i].x + 10, y: G.options[i].y });
    }
    return list;
  }

  function pushShot(s) {
    G.shots.push(s);
    capArr(G.shots, 48);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    G.fireCd = G.laser ? 0.092 : (G.double ? 0.098 : 0.108);
    G.muzzle = 0.055;
    const srcs = sources();
    const laser = G.laser;
    for (let i = 0; i < srcs.length; i++) {
      const p = srcs[i];
      const wx = G.cam + p.x;
      if (laser) {
        pushShot({
          type: 'laser', wx: wx, y: p.y, vx: 820, vy: 0,
          hw: 46, hh: 3.2, life: 0.28, hit: {}, laser: true
        });
      } else if (G.double) {
        pushShot({
          type: 'shot', wx: wx, y: p.y, vx: 640, vy: 0,
          hw: 6, hh: 2.2, life: 0.9
        });
        pushShot({
          type: 'shot', wx: wx, y: p.y - 2, vx: 560, vy: -260,
          hw: 5, hh: 2.2, life: 0.9
        });
      } else {
        pushShot({
          type: 'shot', wx: wx, y: p.y, vx: 640, vy: 0,
          hw: 6, hh: 2.2, life: 0.9
        });
      }
    }
    audio.shoot(laser);
    if (!REDUCE) {
      emit(laser ? 5 : 3, {
        x: G.px + 16, y: G.py, j: 3,
        vx0: 40, vx1: 160, vy0: -50, vy1: 50,
        r0: 1, r1: 2.4, life: 0.12, rgb: laser ? CYN : WHT, g: 0
      });
    }
    if (G.missile && G.misCd <= 0) {
      G.misCd = 0.3;
      for (let i = 0; i < srcs.length; i++) {
        const p = srcs[i];
        pushShot({
          type: 'mis', wx: G.cam + p.x, y: p.y + 4, vx: 90, vy: 240,
          hw: 3.5, hh: 4, life: 1.6, mis: true, grounded: false
        });
      }
      audio.missile();
    }
  }

  function enemyShot(wx, y, vx, vy, r) {
    G.eShots.push({
      wx: wx, y: y, vx: vx, vy: vy, r: r || 3.2, life: 3.2
    });
    capArr(G.eShots, 96);
  }

  function hurt(e, dmg, hx, hy) {
    if (!e.alive || e.scenery) return false;
    if (e.type === 'core' && e.open < 0.55) return 'block';
    if (e.type === 'hatch' && e.open < 0.35) return 'block';
    e.hp -= dmg || 1;
    e.flash = 0.08;
    if (e.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -90, vx1: 90, vy0: -80, vy1: 50,
        life: 0.16, r0: 1, r1: 2.2, rgb: WHT, g: 80
      });
      if (e.type === 'core' || e.type === 'moai' || e.type === 'pillar' || e.type === 'hatch' || e.type === 'carrier') {
        bumpCombo();
        hitStop(e.type === 'core' ? 0.04 : 0.026);
        if (e.type === 'core') {
          addScore(Math.round(30 * G.mult));
          floatText(hx, hy - 10, '核', GOLD, true);
        }
      }
      return true;
    }
    killEnt(e);
    return true;
  }

  function killEnt(e) {
    if (!e.alive) return;
    e.alive = false;
    const x = scrX(e.wx);
    const y = e.y;
    if (e.type === 'core') {
      explode(x, y, GOLD, 46);
      explode(x - 24, y + 10, MAG, 22);
      explode(x + 20, y - 10, CYN, 22);
      award('core', x, y);
      addScore(8000);
      audio.boom();
      hitStop(0.085);
      kick(8);
      screenFlash(GOLD, 0.62);
      floatText(x, y - 16, '核', GOLD, true);
      G.winT = 1.6;
      toast('核心尽破', false, true);
      for (let i = 0; i < G.ents.length; i++) {
        if (G.ents[i].type === 'sat' && G.ents[i].alive) {
          G.ents[i].alive = false;
          explode(scrX(G.ents[i].wx), G.ents[i].y, MAG, 14);
        }
      }
      syncHud();
      return;
    }
    if (e.type === 'cap') return;
    const kind = e.red ? 'red' : e.type;
    const rgb = e.red ? RED
      : e.type === 'moai' ? STN
      : e.type === 'hatch' ? MAG
      : e.type === 'pillar' ? STN
      : e.type === 'carrier' ? GOLD
      : CYN;
    explode(x, y, rgb, e.type === 'moai' || e.type === 'pillar' ? 26 : 16);
    award(kind, x, y);
    audio.hit(G.combo);
    hitStop(clamp(0.03 + G.combo * 0.0022, 0.03, 0.062));
    kick(e.type === 'moai' ? 3.4 : 1.8);
    if (e.drop || e.red || (e.type === 'fan' && hash2(e.id * 13) > 0.82) || (e.type === 'moai' && hash2(e.id) > 0.7) || (e.type === 'hatch' && hash2(e.id) > 0.62)) {
      spawnCap(e.wx, e.y);
    }
  }

  function shieldAbsorb(x, y) {
    if (G.shield <= 0) return false;
    G.shield -= 1;
    G.shieldFlash = 0.18;
    G.invuln = Math.max(G.invuln, 0.42);
    popSpark(x, y, TEAL, 20);
    explode(x, y, TEAL, 12);
    audio.shieldHit();
    hitStop(0.055);
    kick(3.2);
    toast(G.shield > 0 ? '护盾 ×' + G.shield : '护盾碎', true);
    syncSlots();
    syncHud();
    return true;
  }

  function killPlayer() {
    if (G.deadT > 0 || G.mode !== 'play') return;
    explode(G.px, G.py, MAG, 32);
    for (let i = 0; i < G.options.length; i++) {
      explode(G.options[i].x, G.options[i].y, ORG, 16);
    }
    stripPowers();
    G.eShots.length = 0;
    G.deadT = 0.92;
    G.lives -= 1;
    G.invuln = 0;
    audio.death();
    hitStop(0.075);
    kick(7.2);
    screenFlash(MAG, 0.55);
    breakCombo();
    toast(G.lives > 0 ? '舰毁' : '全灭', true);
    syncHud();
  }

  function respawn() {
    G.px = 88;
    const cave = caveAt(pwx());
    G.py = clamp((cave.top + cave.bot) * 0.5, cave.top + 24, cave.bot - 24);
    G.invuln = 1.5;
    G.deadT = 0;
    G.fireHold = false;
    pointer.x = G.px;
    pointer.y = G.py;
    G.eShots.length = 0;
    toast('出击', false, true);
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '舰毁了';
    audio.lose();
    showOverlay('lose', '舰毁了', '星廊把你吞了。R 重开，或换模式。');
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    audio.win();
    const lead = isDense()
      ? '核腔通关。核心尽破。R 再穿，或换模式。'
      : '复仇打穿。核心尽破。再穿同模式，或进核腔。';
    showOverlay('win', '核心尽破', lead);
    syncHud();
  }

  function updateTrail() {
    G.trail.push({ x: G.px, y: G.py });
    const need = OPT_MAX * OPT_GAP + 10;
    if (G.trail.length > need) G.trail.splice(0, G.trail.length - need);
  }

  function updateOptions() {
    const n = G.options.length;
    for (let i = 0; i < n; i++) {
      const o = G.options[i];
      const idx = G.trail.length - 1 - (i + 1) * OPT_GAP;
      const t = idx >= 0 ? G.trail[idx] : G.trail[0] || { x: G.px - 20, y: G.py };
      o.x += (t.x - o.x) * 0.28;
      o.y += (t.y - o.y) * 0.28;
      o.t += STEP;
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      dx = pointer.x - G.px;
      dy = pointer.y - G.py;
      const d = hypot(dx, dy);
      const max = moveSpd() * dt;
      if (d > max && d > 0.4) {
        dx = dx / d * max;
        dy = dy / d * max;
      }
      G.px += dx;
      G.py += dy;
    } else {
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) dy -= 1;
      if (keys.d) dy += 1;
      if (dx || dy) {
        const d = hypot(dx, dy) || 1;
        G.px += dx / d * moveSpd() * dt;
        G.py += dy / d * moveSpd() * dt;
      }
    }
    const cave = caveAt(pwx());
    G.px = clamp(G.px, 28, VW * 0.52);
    const top = cave.top + 12;
    const bot = cave.bot - 12;
    if (G.py < top || G.py > bot) {
      if (G.invuln > 0) G.py = clamp(G.py, top, bot);
      else {
        G.py = clamp(G.py, top, bot);
        killPlayer();
      }
    }
    updateTrail();
    updateOptions();
    G.engine += dt;
    if (!REDUCE && G.engine > 0.04) {
      G.engine = 0;
      emit(1, {
        x: G.px - 14, y: G.py + rand(-2, 2), j: 1,
        vx0: -90, vx1: -40, vy0: -18, vy1: 18,
        r0: 1.2, r1: 2.4, life: 0.18, rgb: CYN, g: 0
      });
    }
  }

  function shotHitsEnt(s, e) {
    if (!e.alive) return false;
    if (e.type === 'cap') return false;
    const sy0 = s.y;
    const shw = s.hw;
    const hh = s.hh;
    const cx = s.laser ? s.wx + s.hw * 0.35 : s.wx;
    if (e.type === 'core') {
      if (e.open < 0.55) {
        if (aabb(cx, sy0, shw, hh, e.wx, e.y, e.hw, e.hh)) return 'block';
        return false;
      }
      if (aabb(cx, sy0, shw, hh, e.wx - 8, e.y, e.coreR + 4, e.coreR + 4)) return true;
      if (aabb(cx, sy0, shw, hh, e.wx, e.y, e.hw, e.hh)) return 'block';
      return false;
    }
    if (e.type === 'volcano') {
      if (aabb(cx, sy0, shw, hh, e.wx, e.y, e.hw, e.hh)) return 'block';
      return false;
    }
    if (e.type === 'hatch' && e.open < 0.35) {
      if (aabb(cx, sy0, shw, hh, e.wx, e.y, e.hw, e.hh)) return 'block';
      return false;
    }
    return aabb(cx, sy0, shw, hh, e.wx, e.y, e.hw, e.hh);
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.mis && !s.grounded) {
        s.vy += 560 * dt;
        const cave = caveAt(s.wx);
        if (s.y >= cave.bot - 7) {
          s.y = cave.bot - 7;
          s.grounded = true;
          s.vy = 0;
          s.vx = 340;
        }
      }
      const x = scrX(s.wx);
      if (s.life <= 0 || x > VW + 50 || x < -40 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let gone = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        const hit = shotHitsEnt(s, e);
        if (!hit) continue;
        const hx = scrX(e.wx);
        if (hit === 'block') {
          emit(3, {
            x: x, y: s.y, j: 3,
            vx0: -40, vx1: 20, vy0: -40, vy1: 40,
            life: 0.12, r0: 1, r1: 2, rgb: WHT, g: 0
          });
          if (!s.laser) gone = true;
          break;
        }
        if (s.laser) {
          if (s.hit[e.id] && G.t - s.hit[e.id] < 0.09) continue;
          s.hit[e.id] = G.t;
          hurt(e, 1, hx, e.y);
        } else {
          hurt(e, 1, hx, e.y);
          gone = true;
          break;
        }
      }
      if (gone) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      if (s.life <= 0 || x < -30 || x > VW + 40 || s.y < -24 || s.y > VH + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (aabb(s.wx, s.y, s.r, s.r, pwx(), G.py, 7.2, 4.6)) {
          G.eShots.splice(i, 1);
          if (shieldAbsorb(G.px + 16, G.py)) continue;
          killPlayer();
        }
      }
    }
  }

  function aimAt(wx, y, sp) {
    const dx = pwx() - wx;
    const dy = G.py - y;
    const d = hypot(dx, dy) || 1;
    return { vx: dx / d * sp, vy: dy / d * sp };
  }

  function updateEnts(dt) {
    const dense = isDense();
    const core = findCore();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.flash > 0) e.flash -= dt;
      const x = scrX(e.wx);
      if (!e.alive) {
        if (x < -80) G.ents.splice(i, 1);
        continue;
      }
      if (e.type !== 'core' && e.type !== 'sat' && x < -70) {
        G.ents.splice(i, 1);
        continue;
      }

      if (e.type === 'fan') {
        e.wx += e.vx * dt;
        if (e.path === 'dive' && x < VW * 0.85) {
          const dy = G.py - e.y;
          e.y += clamp(dy, -70, 70) * dt * 0.9;
          e.wx += e.vx * dt * 0.15;
        } else {
          e.y += Math.sin(G.t * 3.2 + e.phase) * 42 * dt;
        }
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 14, cave.bot - 14);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW * 0.82 && x > 40) {
          e.cd = dense ? rand(0.85, 1.5) : rand(1.35, 2.4);
          if (hash2(e.id + ((G.t * 8) | 0)) > (dense ? 0.42 : 0.6)) {
            const a = aimAt(e.wx, e.y, dense ? 186 : 154);
            enemyShot(e.wx - 8, e.y, a.vx, a.vy, 3);
          }
        }
      } else if (e.type === 'hatch') {
        const cave = caveAt(e.wx);
        e.y = e.ceil ? cave.top + 11 : cave.bot - 11;
        e.phase += dt;
        e.want = (Math.sin(e.phase * 1.5) > 0.15) ? 1 : 0;
        e.open += (e.want - e.open) * 4.2 * dt;
        e.cd -= dt;
        if (e.open > 0.55 && e.cd <= 0 && x < VW * 0.86 && x > 30) {
          e.cd = dense ? rand(0.55, 1.05) : rand(0.9, 1.55);
          const a = aimAt(e.wx, e.y, dense ? 210 : 168);
          enemyShot(e.wx - 4, e.y + (e.ceil ? 8 : -8), a.vx, a.vy, 3.4);
          audio.hatch();
        }
      } else if (e.type === 'ducker') {
        const cave = caveAt(e.wx);
        e.walk += dt;
        e.wx += e.dir * 28 * dt;
        e.y = cave.bot - 11;
        if (e.walk > 1.4) {
          e.dir *= -1;
          e.walk = 0;
        }
        e.cd -= dt;
        if (e.cd <= 0 && x < VW * 0.8 && x > 40) {
          e.cd = dense ? rand(0.7, 1.2) : rand(1.1, 1.8);
          enemyShot(e.wx, e.y - 8, dense ? -170 : -140, -90, 3.2);
        }
      } else if (e.type === 'volcano') {
        const cave = caveAt(e.wx);
        e.y = cave.bot + 6;
        e.cd -= dt;
        e.heat = Math.max(0, e.heat - dt);
        if (e.cd <= 0 && x < VW + 20 && x > -10) {
          e.cd = dense ? rand(0.7, 1.2) : rand(1.05, 1.8);
          e.heat = 0.28;
          const n = dense ? 3 : 2;
          for (let k = 0; k < n; k++) {
            spawnRock(e.wx + rand(-8, 8), cave.bot - 16, rand(-40, 30), rand(-280, -160));
          }
        }
      } else if (e.type === 'rock') {
        e.wx += e.vx * dt;
        e.vy += 220 * dt;
        e.y += e.vy * dt;
        e.spin += 6 * dt;
        const cave = caveAt(e.wx);
        if (e.y > cave.bot - 4) {
          e.alive = false;
          emit(4, {
            x: x, y: e.y, j: 4,
            vx0: -40, vx1: 40, vy0: -80, vy1: -10,
            r0: 1, r1: 2.4, life: 0.18, rgb: LAVA, g: 80
          });
        }
      } else if (e.type === 'pillar') {
        const cave = caveAt(e.wx);
        if (e.y < VH * 0.5) e.y = cave.top + e.hh + 6;
        else e.y = cave.bot - e.hh - 6;
      } else if (e.type === 'moai') {
        const cave = caveAt(e.wx);
        e.y = e.ceil ? cave.top + 22 : cave.bot - 22;
        e.cd -= dt;
        e.mouth += ((e.cd < 0.18 ? 1 : 0) - e.mouth) * 8 * dt;
        if (e.cd <= 0 && x < VW * 0.88 && x > 20) {
          e.cd = dense ? rand(0.85, 1.4) : rand(1.2, 2);
          const dir = e.ceil ? 1 : -1;
          pushEnt({
            type: 'ring',
            wx: e.wx - 10,
            y: e.y + dir * 10,
            hw: 8, hh: 8,
            hp: 1,
            vx: dense ? -150 : -120,
            grow: 0,
            r: 7
          });
        }
      } else if (e.type === 'ring') {
        e.wx += e.vx * dt;
        e.grow += dt;
        e.r = 7 + e.grow * 10;
        e.hw = e.r;
        e.hh = e.r;
      } else if (e.type === 'carrier') {
        e.wx += e.vx * dt;
        e.y += Math.sin(G.t * 1.6 + e.phase) * 28 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 22, cave.bot - 22);
      } else if (e.type === 'cap') {
        e.spin += 3.2 * dt;
        e.y += Math.sin(G.t * 3 + e.spin) * 18 * dt;
        e.wx -= 18 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        if (G.mode === 'play' && G.deadT <= 0 && aabb(e.wx, e.y, 10, 10, pwx(), G.py, 12, 10)) {
          collectCap(e);
        }
      } else if (e.type === 'sat') {
        if (!core || !core.alive) {
          e.alive = false;
          continue;
        }
        e.ang += (core.angry ? 1.6 : 1.05) * dt;
        const rr = 62 + Math.sin(G.t * 2 + e.idx) * 6;
        e.wx = core.wx + Math.cos(e.ang) * rr;
        e.y = core.y + Math.sin(e.ang) * rr * 0.72;
        e.cd -= dt;
        if (e.cd <= 0 && x < VW * 0.92 && x > 20) {
          e.cd = dense ? rand(0.7, 1.15) : rand(1.05, 1.7);
          const a = aimAt(e.wx, e.y, dense ? 200 : 160);
          enemyShot(e.wx, e.y, a.vx, a.vy, 3.2);
        }
      } else if (e.type === 'core') {
        e.phase += dt;
        const want = (Math.sin(e.phase * (e.angry ? 1.7 : 1.15)) > 0.08) ? 1 : 0;
        e.open += (want - e.open) * 3.4 * dt;
        e.y += e.vy * dt;
        const cave = caveAt(e.wx);
        if (e.y < cave.top + 40 || e.y > cave.bot - 40) e.vy *= -1;
        e.y = clamp(e.y, cave.top + 40, cave.bot - 40);
        if (!e.angry && e.hp <= e.max * 0.5) {
          e.angry = true;
          toast('核心狂暴', true);
          audio.check();
          kick(4);
          screenFlash(MAG, 0.4);
          if (dense) {
            pushEnt({
              type: 'sat',
              wx: e.wx, y: e.y,
              hw: 9, hh: 9, hp: 3, max: 3,
              idx: 7, ang: 0.4, cd: 0.4
            });
          }
        }
        e.cd -= dt;
        if (e.cd <= 0 && e.open > 0.4) {
          e.cd = e.angry ? (dense ? 0.28 : 0.38) : (dense ? 0.46 : 0.62);
          const n = e.angry ? 7 : 5;
          for (let k = 0; k < n; k++) {
            const a = (k / n) * TAU + e.phase;
            const sp = dense ? 170 : 140;
            enemyShot(e.wx - 8, e.y, Math.cos(a) * sp, Math.sin(a) * sp, e.angry ? 4.2 : 3.4);
          }
          if (e.angry) {
            const a = aimAt(e.wx, e.y, dense ? 230 : 190);
            enemyShot(e.wx - 10, e.y, a.vx, a.vy, 5.2);
          }
        }
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && e.alive && e.type !== 'cap' && e.type !== 'volcano') {
        const pr = e.type === 'core' ? (e.hw * 0.72) : e.hw;
        const ph = e.type === 'core' ? (e.hh * 0.7) : e.hh;
        if (aabb(e.wx, e.y, pr, ph, pwx(), G.py, 7.2, 4.6)) {
          if (shieldAbsorb(G.px + 16, G.py)) {
            if (e.type === 'rock' || e.type === 'ring' || e.type === 'fan') killEnt(e);
          } else {
            killPlayer();
          }
        }
      }
    }
  }

  function updateFx(dt) {
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.9);
    if (G.shieldFlash > 0) G.shieldFlash -= dt;
    if (G.toastT > 0) G.toastT -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
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
      f.vy += 40 * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
  }

  function updateDemo(dt) {
    G.cam += 64 * dt;
    G.t += dt;
    G.px = 108 + Math.sin(G.t * 0.65) * 18;
    G.py = VH * 0.5 + Math.sin(G.t * 1.05) * 36;
    const cave = caveAt(pwx());
    G.py = clamp(G.py, cave.top + 20, cave.bot - 20);
    updateTrail();
    if (G.options.length < 2) {
      G.options.push({ x: G.px - 24, y: G.py, t: 0 });
    }
    updateOptions();
    G.laser = true;
    if (G.fireCd <= 0) {
      G.fireCd = 0.18;
      const srcs = sources();
      for (let i = 0; i < srcs.length; i++) {
        pushShot({
          type: 'laser', wx: G.cam + srcs[i].x, y: srcs[i].y, vx: 720, vy: 0,
          hw: 40, hh: 3, life: 0.22, hit: {}, laser: true
        });
      }
    }
    trySpawn();
    updateEnts(dt);
    updateShots(dt);
    updateFx(dt);
  }

  function update(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.misCd > 0) G.misCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0 && G.combo > 0) breakCombo();
    }

    if (G.mode === 'title') {
      updateDemo(dt);
      return;
    }

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }

    if (G.winT > 0) {
      G.winT -= dt;
      G.cam += 20 * dt;
      updateEnts(dt);
      updateShots(dt);
      updateFx(dt);
      if (G.winT <= 0 && G.mode === 'play') winGame();
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      updateShots(dt);
      return;
    }

    if (G.deadT > 0) {
      G.t += dt;
      G.deadT -= dt;
      G.cam += scrollSpd() * dt * 0.35;
      trySpawn();
      updateEnts(dt);
      updateShots(dt);
      updateFx(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseGame();
        else respawn();
      }
      return;
    }

    G.t += dt;
    G.cam += scrollSpd() * dt;
    if (G.stage < stageAt(G.cam + 80) && !G.boss) {
      G.stage = stageAt(G.cam + 80);
      toast('第 ' + G.stage + ' 关 · ' + STAGE_NAME[G.stage - 1], false, true);
      audio.check();
      addScore(1500);
      syncHud();
    }
    updatePlayer(dt);
    if (G.fireHold) fire();
    trySpawn();
    updateEnts(dt);
    updateShots(dt);
    updateFx(dt);
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const x = ((s.wx - G.cam * s.p) % VW + VW) % VW;
      c.fillStyle = rgba(WHT, 0.22 + s.p * 0.55);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.s * scale, 0, TAU);
      c.fill();
    }
  }

  function drawCave() {
    const c = ctx;
    const stepX = 8;
    c.fillStyle = '#02140c';
    c.fillRect(ox, oy, VW * scale, VH * scale);

    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, 'rgba(8, 40, 24, 0.55)');
    g.addColorStop(0.5, 'rgba(4, 18, 12, 0)');
    g.addColorStop(1, G.stage === 2 ? 'rgba(80, 24, 10, 0.45)' : 'rgba(8, 40, 24, 0.55)');
    c.fillStyle = g;
    c.fillRect(ox, oy, VW * scale, VH * scale);

    c.beginPath();
    c.moveTo(sx(0), sy(0));
    for (let x = 0; x <= VW; x += stepX) {
      const f = caveAt(G.cam + x);
      c.lineTo(sx(x), sy(f.top));
    }
    c.lineTo(sx(VW), sy(0));
    c.closePath();
    const gTop = c.createLinearGradient(0, sy(0), 0, sy(80));
    gTop.addColorStop(0, '#0a2818');
    gTop.addColorStop(1, rgba(PLATE, 0.95));
    c.fillStyle = gTop;
    c.fill();

    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += stepX) {
      const f = caveAt(G.cam + x);
      c.lineTo(sx(x), sy(f.bot));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    const gBot = c.createLinearGradient(0, sy(VH - 80), 0, sy(VH));
    gBot.addColorStop(0, rgba(G.stage === 2 ? LAVA : PLATE, G.stage === 2 ? 0.55 : 0.95));
    gBot.addColorStop(1, G.stage === 2 ? '#2a1208' : '#0a2418');
    c.fillStyle = gBot;
    c.fill();

    c.strokeStyle = rgba(CYN, 0.32 + Math.sin(G.t * 2.1) * 0.08);
    c.lineWidth = Math.max(1.2, 1.6 * scale);
    c.beginPath();
    for (let x = 0; x <= VW; x += stepX) {
      const f = caveAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(f.top));
      else c.lineTo(sx(x), sy(f.top));
    }
    c.stroke();
    c.beginPath();
    for (let x = 0; x <= VW; x += stepX) {
      const f = caveAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(f.bot));
      else c.lineTo(sx(x), sy(f.bot));
    }
    c.stroke();

    c.strokeStyle = rgba(STN, 0.28);
    c.lineWidth = Math.max(1, scale);
    const gap = 92;
    const off = -((G.cam | 0) % gap);
    for (let x = off; x < VW + 20; x += gap) {
      const f = caveAt(G.cam + x);
      c.beginPath();
      c.moveTo(sx(x), sy(0));
      c.lineTo(sx(x + 8), sy(f.top));
      c.stroke();
      c.beginPath();
      c.moveTo(sx(x + 24), sy(VH));
      c.lineTo(sx(x + 32), sy(f.bot));
      c.stroke();
    }
  }

  function drawViper(x, y, a) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(y));
    c.globalAlpha = a;
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle * 8);
      c.beginPath();
      c.ellipse(18 * scale, 0, 10 * scale, 3.2 * scale, 0, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.moveTo(16 * scale, 0);
    c.lineTo(-10 * scale, -7.5 * scale);
    c.lineTo(-6 * scale, 0);
    c.lineTo(-10 * scale, 7.5 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.fillRect(-2 * scale, -3.2 * scale, 12 * scale, 6.4 * scale);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(2 * scale, -1.6 * scale, 6 * scale, 3.2 * scale);
    c.fillStyle = rgba(TEAL, 0.95);
    c.beginPath();
    c.moveTo(-4 * scale, -2.4 * scale);
    c.lineTo(4 * scale, 0);
    c.lineTo(-4 * scale, 2.4 * scale);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawOption(o) {
    const c = ctx;
    const pulse = 1 + Math.sin(G.t * 8 + o.t) * 0.08;
    c.fillStyle = rgba(GOLD, 0.92);
    c.beginPath();
    c.arc(sx(o.x), sy(o.y), 5.4 * pulse * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(MAG, 0.9);
    c.beginPath();
    c.arc(sx(o.x), sy(o.y), 2.1 * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.55);
    c.lineWidth = Math.max(1, scale);
    c.beginPath();
    c.arc(sx(o.x), sy(o.y), 7.4 * scale, 0, TAU);
    c.stroke();
  }

  function drawShield() {
    if (G.shield <= 0 && G.shieldFlash <= 0) return;
    const c = ctx;
    const a = G.shield > 0 ? 0.55 + Math.sin(G.t * 8) * 0.12 : G.shieldFlash * 3;
    c.strokeStyle = rgba(TEAL, a);
    c.lineWidth = Math.max(1.4, 2 * scale);
    c.beginPath();
    c.ellipse(sx(G.px + 10), sy(G.py), (16 + G.shield * 2) * scale, (11 + G.shield) * scale, 0, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(TEAL, 0.08 + G.shieldFlash);
    c.beginPath();
    c.ellipse(sx(G.px + 10), sy(G.py), 14 * scale, 9 * scale, 0, 0, TAU);
    c.fill();
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.invuln * 14) | 0) % 2 === 0;
    if (blink) return;
    for (let i = 0; i < G.options.length; i++) drawOption(G.options[i]);
    drawViper(G.px, G.py, 1);
    drawShield();
  }

  function drawFan(e, x) {
    const c = ctx;
    const flash = e.flash > 0;
    c.fillStyle = rgba(flash ? WHT : (e.red ? RED : CYN), 0.94);
    c.beginPath();
    c.moveTo(sx(x + 10), sy(e.y));
    c.lineTo(sx(x - 9), sy(e.y - 6));
    c.lineTo(sx(x - 4), sy(e.y));
    c.lineTo(sx(x - 9), sy(e.y + 6));
    c.closePath();
    c.fill();
    if (e.red) {
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(sx(x), sy(e.y), 2.2 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawHatch(e, x) {
    const c = ctx;
    const flash = e.flash > 0;
    const open = e.open;
    c.fillStyle = rgba(flash ? WHT : PLATE, 0.95);
    const h = 10;
    if (e.ceil) {
      c.fillRect(sx(x - 13), sy(e.y - h), 26 * scale, (h + 2) * scale);
      c.fillStyle = rgba(DEEP, 0.9);
      c.fillRect(sx(x - 8), sy(e.y - 2), 16 * scale, (4 + open * 8) * scale);
    } else {
      c.fillRect(sx(x - 13), sy(e.y - 2), 26 * scale, (h + 2) * scale);
      c.fillStyle = rgba(DEEP, 0.9);
      c.fillRect(sx(x - 8), sy(e.y - open * 8), 16 * scale, (4 + open * 8) * scale);
    }
    if (open > 0.3) {
      c.fillStyle = rgba(RED, 0.55 + open * 0.4);
      c.beginPath();
      c.arc(sx(x), sy(e.y + (e.ceil ? 4 : -4)), 3.2 * scale, 0, TAU);
      c.fill();
    }
    c.strokeStyle = rgba(CYN, 0.45);
    c.lineWidth = Math.max(1, scale);
    c.strokeRect(sx(x - 13), sy(e.y - (e.ceil ? h : 2)), 26 * scale, (h + 2) * scale);
  }

  function drawDucker(e, x) {
    const c = ctx;
    const flash = e.flash > 0;
    c.fillStyle = rgba(flash ? WHT : MAG, 0.94);
    c.beginPath();
    c.moveTo(sx(x - 11), sy(e.y + 8));
    c.lineTo(sx(x - 8), sy(e.y - 6));
    c.lineTo(sx(x + 8), sy(e.y - 6));
    c.lineTo(sx(x + 11), sy(e.y + 8));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.9);
    c.fillRect(sx(x - 3), sy(e.y - 10), 6 * scale, 6 * scale);
  }

  function drawVolcano(e, x) {
    const c = ctx;
    c.fillStyle = rgba(STN, 0.95);
    c.beginPath();
    c.moveTo(sx(x - 22), sy(e.y + 16));
    c.lineTo(sx(x - 8), sy(e.y - 18));
    c.lineTo(sx(x + 8), sy(e.y - 18));
    c.lineTo(sx(x + 22), sy(e.y + 16));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(LAVA, 0.55 + e.heat * 1.4);
    c.beginPath();
    c.moveTo(sx(x - 6), sy(e.y - 8));
    c.lineTo(sx(x), sy(e.y - 22 - e.heat * 10));
    c.lineTo(sx(x + 6), sy(e.y - 8));
    c.closePath();
    c.fill();
  }

  function drawMoai(e, x) {
    const c = ctx;
    const flash = e.flash > 0;
    const dir = e.ceil ? 1 : -1;
    c.fillStyle = rgba(flash ? WHT : STN, 0.95);
    c.beginPath();
    c.moveTo(sx(x - 12), sy(e.y + dir * 18));
    c.lineTo(sx(x - 10), sy(e.y - dir * 16));
    c.lineTo(sx(x + 8), sy(e.y - dir * 18));
    c.lineTo(sx(x + 14), sy(e.y + dir * 16));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(DEEP, 0.9);
    c.beginPath();
    c.ellipse(sx(x - 2), sy(e.y - dir * 4), 4 * scale, (2.2 + e.mouth * 3) * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.7);
    c.beginPath();
    c.arc(sx(x + 4), sy(e.y - dir * 10), 2.2 * scale, 0, TAU);
    c.fill();
  }

  function drawRock(e, x) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.fillStyle = rgba(e.flash > 0 ? WHT : LAVA, 0.92);
    c.beginPath();
    c.moveTo(-6 * scale, 0);
    c.lineTo(-2 * scale, -6 * scale);
    c.lineTo(5 * scale, -3 * scale);
    c.lineTo(6 * scale, 4 * scale);
    c.lineTo(-3 * scale, 5 * scale);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawRingShot(e, x) {
    const c = ctx;
    c.strokeStyle = rgba(e.flash > 0 ? WHT : TEAL, 0.9);
    c.lineWidth = Math.max(1.4, 2 * scale);
    c.beginPath();
    c.arc(sx(x), sy(e.y), e.r * scale, 0, TAU);
    c.stroke();
    c.strokeStyle = rgba(GOLD, 0.5);
    c.beginPath();
    c.arc(sx(x), sy(e.y), (e.r - 3) * scale, 0, TAU);
    c.stroke();
  }

  function drawCap(e, x) {
    const c = ctx;
    const r = 8 + Math.sin(e.spin * 2) * 1.2;
    c.fillStyle = rgba(ORG, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(e.y), r * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(WHT, 0.8);
    c.lineWidth = Math.max(1, 1.4 * scale);
    c.beginPath();
    c.arc(sx(x), sy(e.y), (r + 4) * scale, e.spin, e.spin + 2.2);
    c.stroke();
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.arc(sx(x - 1.5), sy(e.y - 1.5), 2 * scale, 0, TAU);
    c.fill();
  }

  function drawPillar(e, x) {
    const c = ctx;
    const flash = e.flash > 0;
    c.fillStyle = rgba(flash ? WHT : STN, 0.94);
    c.fillRect(sx(x - e.hw), sy(e.y - e.hh), e.hw * 2 * scale, e.hh * 2 * scale);
    c.strokeStyle = rgba(CYN, 0.35);
    c.lineWidth = Math.max(1, scale);
    c.strokeRect(sx(x - e.hw), sy(e.y - e.hh), e.hw * 2 * scale, e.hh * 2 * scale);
    c.fillStyle = rgba(DEEP, 0.45);
    c.fillRect(sx(x - e.hw + 3), sy(e.y - e.hh + 4), 4 * scale, (e.hh * 2 - 8) * scale);
  }

  function drawCarrier(e, x) {
    const c = ctx;
    const flash = e.flash > 0;
    c.fillStyle = rgba(flash ? WHT : GOLD, 0.92);
    c.beginPath();
    c.ellipse(sx(x), sy(e.y), 16 * scale, 10 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(DEEP, 0.85);
    c.fillRect(sx(x - 6), sy(e.y - 4), 12 * scale, 8 * scale);
    c.strokeStyle = rgba(CYN, 0.7);
    c.lineWidth = Math.max(1, scale);
    c.strokeRect(sx(x - 6), sy(e.y - 4), 12 * scale, 8 * scale);
    c.fillStyle = rgba(ORG, 0.9);
    c.beginPath();
    c.arc(sx(x), sy(e.y), 3 * scale, 0, TAU);
    c.fill();
  }

  function drawSat(e, x) {
    const c = ctx;
    c.fillStyle = rgba(e.flash > 0 ? WHT : MAG, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(e.y), 8 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.9);
    c.beginPath();
    c.arc(sx(x - 1), sy(e.y - 1), 2.6 * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(CYN, 0.5);
    c.lineWidth = Math.max(1, scale);
    c.beginPath();
    c.arc(sx(x), sy(e.y), 10.5 * scale, 0, TAU);
    c.stroke();
  }

  function drawCore(e, x) {
    const c = ctx;
    const flash = e.flash > 0;
    const beat = 1 + Math.sin(G.t * (e.angry ? 7 : 3.2)) * 0.05;
    c.save();
    c.translate(sx(x), sy(e.y));
    const plate = 52 * beat * scale;
    const gap = e.open * 18 * scale;
    c.fillStyle = rgba(flash ? WHT : PLATE, 0.95);
    c.fillRect(-plate, -34 * scale, plate - gap * 0.5, 68 * scale);
    c.fillRect(gap * 0.5, -34 * scale, plate - gap * 0.5, 68 * scale);
    c.strokeStyle = rgba(CYN, 0.55);
    c.lineWidth = Math.max(1.2, 1.6 * scale);
    c.strokeRect(-plate, -34 * scale, plate - gap * 0.5, 68 * scale);
    c.strokeRect(gap * 0.5, -34 * scale, plate - gap * 0.5, 68 * scale);
    c.fillStyle = rgba(e.angry ? MAG : GOLD, 0.95);
    c.beginPath();
    c.arc(0, 0, e.coreR * beat * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.arc(-2 * scale, -2 * scale, 3.4 * scale, 0, TAU);
    c.fill();
    if (e.open > 0.4) {
      c.strokeStyle = rgba(GOLD, 0.45 + e.open * 0.3);
      c.beginPath();
      c.arc(0, 0, 22 * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive && e.type !== 'core') continue;
      const x = scrX(e.wx);
      if (x < -60 || x > VW + 60) continue;
      if (e.type === 'fan') drawFan(e, x);
      else if (e.type === 'hatch') drawHatch(e, x);
      else if (e.type === 'ducker') drawDucker(e, x);
      else if (e.type === 'volcano') drawVolcano(e, x);
      else if (e.type === 'rock') drawRock(e, x);
      else if (e.type === 'pillar') drawPillar(e, x);
      else if (e.type === 'moai') drawMoai(e, x);
      else if (e.type === 'ring') drawRingShot(e, x);
      else if (e.type === 'carrier') drawCarrier(e, x);
      else if (e.type === 'cap') drawCap(e, x);
      else if (e.type === 'sat') drawSat(e, x);
      else if (e.type === 'core') drawCore(e, x);
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = scrX(s.wx);
      if (s.laser) {
        const grd = c.createLinearGradient(sx(x), sy(s.y), sx(x + s.hw * 1.4), sy(s.y));
        grd.addColorStop(0, rgba(WHT, 0.95));
        grd.addColorStop(1, rgba(CYN, 0.15));
        c.fillStyle = grd;
        c.fillRect(sx(x), sy(s.y - s.hh), s.hw * 1.6 * scale, s.hh * 2 * scale);
        if (!REDUCE) {
          c.fillStyle = rgba(TEAL, 0.35);
          c.fillRect(sx(x - 8), sy(s.y - 1), 18 * scale, 2 * scale);
        }
      } else if (s.mis) {
        c.fillStyle = rgba(ORG, 0.95);
        c.beginPath();
        c.ellipse(sx(x), sy(s.y), 4.2 * scale, 3.2 * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(LAVA, 0.8);
        c.fillRect(sx(x - 6), sy(s.y - 1.2), 6 * scale, 2.4 * scale);
      } else {
        c.fillStyle = rgba(WHT, 0.95);
        c.fillRect(sx(x), sy(s.y - 1.6), 10 * scale, 3.2 * scale);
        c.fillStyle = rgba(CYN, 0.7);
        c.fillRect(sx(x - 4), sy(s.y - 1), 5 * scale, 2 * scale);
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = scrX(s.wx);
      c.fillStyle = rgba(MAG, 0.92);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.arc(sx(x - 0.8), sy(s.y - 0.8), s.r * 0.35 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawBossBar() {
    const b = findCore();
    if (!b || !b.alive || G.mode === 'title') return;
    const c = ctx;
    const w = 220;
    const x = (VW - w) * 0.5;
    const y = 14;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(sx(x), sy(y), w * scale, 8 * scale);
    c.strokeStyle = rgba(GOLD, 0.55);
    c.lineWidth = Math.max(1, scale);
    c.strokeRect(sx(x), sy(y), w * scale, 8 * scale);
    const p = clamp(b.hp / b.max, 0, 1);
    c.fillStyle = rgba(b.angry ? MAG : GOLD, 0.9);
    c.fillRect(sx(x + 1), sy(y + 1), (w - 2) * p * scale, 6 * scale);
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * a * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = Math.max(1, 1.6 * scale);
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + r.t * 70) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      c.fillStyle = rgba(s.rgb, a * 0.55);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.rad * (0.4 + s.t * 2) * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.font = (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.textAlign = 'center';
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#02140c';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake);
      shy = rand(-G.shake * 0.6, G.shake * 0.6);
    }
    ctx.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    drawCave();
    drawStars();
    drawEnts();
    drawShots();
    drawPlayer();
    drawBossBar();
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
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

  function resetRun(kind) {
    G.kind = kind || 'raid';
    G.t = 0;
    G.cam = 0;
    G.px = 88;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stage = 1;
    G.nextLife = LIFE_EVERY;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.options.length = 0;
    G.trail.length = 0;
    G.bar = 0;
    G.speed = 0;
    G.missile = false;
    G.double = false;
    G.laser = false;
    G.shield = 0;
    G.caps = 0;
    G.spawnedX = 0;
    G.fireCd = 0;
    G.misCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.toastT = 0;
    G.why = '';
    G.boss = false;
    G.winT = 0;
    G.engine = 0;
    G.shieldFlash = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    eid = 1;
  }

  function startGame(kind) {
    resetRun(kind || 'raid');
    G.mode = 'play';
    hideOverlay();
    audio.start();
    toast(isDense() ? '核腔' : '复仇', false, true);
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('raid');
    G.mode = 'title';
    G.laser = true;
    showOverlay('title', '复仇', TITLE_LEAD);
    if (btnOvRetry) btnOvRetry.textContent = '再穿';
    if (btnOvModes) btnOvModes.textContent = '换模式';
    syncHud();
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
    const shift = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';
    const zed = k === 'z' || k === 'Z' || code === 'KeyZ';

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

    if (down && (isMove || space || k === 'Enter' || shift || zed)) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || shift || zed)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (shift || zed) {
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      activate();
      return;
    }
    if (k === '1' || (k === 'Enter' && G.mode === 'title')) {
      audio.ensure();
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('core');
      return;
    }
    if (space) {
      audio.ensure();
      if (G.mode === 'title') startGame('raid');
      else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else {
        G.fireHold = true;
        fire();
      }
      return;
    }
    if (k === 'Enter') primaryAction();
  }

  function bindPowBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      activate();
      el.classList.add('held');
    });
    el.addEventListener('pointerup', function () { el.classList.remove('held'); });
    el.addEventListener('pointercancel', function () { el.classList.remove('held'); });
  }

  function bind() {
    window.addEventListener('keydown', function (e) { onKey(e, true); });
    window.addEventListener('keyup', function (e) { onKey(e, false); });
    window.addEventListener('blur', function () {
      keys.l = keys.r = keys.u = keys.d = false;
      G.fireHold = false;
    });
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (hidden) {
        keys.l = keys.r = keys.u = keys.d = false;
        G.fireHold = false;
      }
    });
    window.addEventListener('resize', resize);

    if (btnRaid) btnRaid.addEventListener('click', function () { audio.ensure(); startGame('raid'); });
    if (btnCore) btnCore.addEventListener('click', function () { audio.ensure(); startGame('core'); });
    if (btnOvRetry) btnOvRetry.addEventListener('click', function () { audio.ensure(); startGame(G.kind || 'raid'); });
    if (btnOvModes) {
      btnOvModes.addEventListener('click', function () {
        audio.ensure();
        if (G.mode === 'win' && !isDense()) startGame('core');
        else goTitle();
      });
    }
    if (btnMute) {
      btnMute.addEventListener('click', function () {
        audio.ensure();
        audio.setMuted(!audio.muted);
      });
    }
    if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
    bindPowBtn(btnPow);
    bindPowBtn(btnPad);

    for (let i = 0; i < slotEls.length; i++) {
      slotEls[i].addEventListener('click', function () {
        audio.ensure();
        activate();
      });
    }

    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (e.button === 2) {
        e.preventDefault();
        if (overlayOpen()) {
          primaryAction();
          return;
        }
        activate();
        return;
      }
      if (G.mode === 'title') {
        startGame('raid');
        return;
      }
      if (G.mode === 'lose' || G.mode === 'win') return;
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      inputSrc = 'ptr';
      G.fireHold = true;
      fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
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

  function init() {
    loadBest();
    audio.muted = loadMute();
    if (btnMute) {
      btnMute.textContent = audio.muted ? '静' : '声';
      btnMute.classList.toggle('muted', audio.muted);
    }
    seedStars();
    resize();
    bind();
    goTitle();
    requestAnimationFrame(frame);
  }

  init();
})();
