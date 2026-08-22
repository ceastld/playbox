'use strict';

(function () {
  const VW = 720;
  const VH = 400;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const OPT_GAP = 14;
  const OPT_MAX = 4;
  const BOSS_AT = [3400, 7200, 11200];
  const BEST_KEY = 'playbox-gradius-run-best';
  const MUTE_KEY = 'playbox-gradius-run-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格射击 · C 点选 · R 重开 · M 静音';
  const STAGE_NAME = ['火山', '摩艾', '要塞'];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [26, 208, 255];
  const TEAL = [0, 240, 200];
  const GOLD = [255, 227, 107];
  const ORG = [255, 184, 74];
  const WHT = [232, 246, 255];
  const PNK = [255, 154, 212];
  const STN = [120, 148, 164];
  const RED = [255, 72, 88];
  const DEEP = [8, 28, 40];

  const SCORE = {
    fan: 50, red: 100, ducker: 120, moai: 400,
    rock: 20, ring: 40, core: 2500
  };

  const SLOTS_ALL = [
    { id: 'speed', name: '速', full: '加速' },
    { id: 'missile', name: '导', full: '导弹' },
    { id: 'double', name: '双', full: '双重' },
    { id: 'laser', name: '激', full: '激光' },
    { id: 'option', name: '分', full: '分身' },
    { id: 'shield', name: '盾', full: '护盾' }
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
  const btnBare = document.getElementById('btn-bare');
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
  let comboTok = 0;
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
    cleared: 0,
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
  function isBare() {
    return G.kind === 'bare';
  }
  function pwx() {
    return G.cam + G.px;
  }
  function scrX(wx) {
    return wx - G.cam;
  }
  function slotList() {
    return isBare() ? SLOTS_ALL.slice(0, 5) : SLOTS_ALL;
  }
  function stageAt(wx) {
    if (wx < BOSS_AT[0] + 80) return 1;
    if (wx < BOSS_AT[1] + 80) return 2;
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
    const p = 460;
    const m = ((wx % p) + p) % p;
    if (m > 90 && m < 190) {
      const u = (m - 90) / 100;
      const tri = u < 0.5 ? u * 2 : (1 - u) * 2;
      return tri * tri * 58;
    }
    return 0;
  }
  function caveAt(wx) {
    const st = stageAt(wx);
    const n1 = fbm(wx * 0.00185, 1);
    const n2 = fbm(wx * 0.0039, 8);
    let top = 10;
    let bot = VH - 10;
    if (st === 1) {
      top = 8 + n1 * 14;
      bot = VH - 10 - n2 * 22 - volcanoBump(wx);
    } else if (st === 2) {
      top = 20 + n1 * 40;
      bot = VH - 22 - n2 * 44;
    } else {
      top = 24 + n1 * 50 + (n2 > 0.72 ? 18 : 0);
      bot = VH - 24 - n2 * 52;
    }
    if (wx < 420) {
      const t = wx / 420;
      top = lerp(8, top, t);
      bot = lerp(VH - 8, bot, t);
    }
    if (G.boss) {
      top = Math.min(top, 30);
      bot = Math.max(bot, VH - 30);
    }
    if (top > bot - 70) {
      const mid = (top + bot) * 0.5;
      top = mid - 35;
      bot = mid + 35;
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
        this.beep(880, 0.05, 'square', 0.03, 1640);
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
      this.noise(0.045, 0.036, 1100);
      this.beep(520 * lift, 0.08, 'square', 0.042, 820 * lift);
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
      this.noise(0.18, 0.065, 280);
      this.beep(300, 0.22, 'sawtooth', 0.05, 70);
      this.beep(150, 0.34, 'sine', 0.042, 44);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    boom() {
      this.ensure();
      this.noise(0.22, 0.08, 180);
      this.beep(180, 0.28, 'sawtooth', 0.055, 55);
      this.beep(90, 0.4, 'sine', 0.04, 40);
    },
    check() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(659, 0.16, 'triangle', 0.04, 880);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.045, 1046);
      this.beep(1046, 0.28, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
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

  function toast(msg, warn, gold) {
    G.toastT = 1.35;
    toastTok += 1;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    while (pips.length > n && pips.length > LIVES) {
      const d = pips.pop();
      if (d && d.parentNode) d.parentNode.removeChild(d);
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
    if (pwrEl) pwrEl.classList.toggle('bare', isBare());
    const list = slotList();
    const cur = G.bar > 0 ? list[G.bar - 1] : null;
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
      if (G.mode === 'title') stageLabel.textContent = '秘武';
      else if (G.boss) stageLabel.textContent = '核心';
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + (STAGE_NAME[G.stage - 1] || '');
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isBare() ? '无护' : '远征';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isBare());
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
    else if (G.mode === 'lose') setHint('R 重开 · 吃胶囊推进武装槽，C 点选', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 核心尽破', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 护盾优先挡弹', 'warn');
    else if (G.bar > 0) {
      const s = slotList()[G.bar - 1];
      setHint('C 点选「' + (s ? s.full : '') + '」', 'hot');
    } else if (G.laser) setHint('激光穿甲 · 分身抄射', '');
    else setHint('吃胶囊推进武装槽 · C 点选 · 分身抄你的弹', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GRADIUS';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'lose' || kind === 'win';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
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
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
      }
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
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
    capArr(G.ents, 110);
  }

  function findCore() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'core' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function moveSpd() {
    return (isBare() ? 152 : 138) + G.speed * 36;
  }

  function scrollSpd() {
    if (G.boss) {
      const b = findCore();
      if (b && b.alive) {
        const x = scrX(b.wx);
        if (x < VW * 0.58) return isBare() ? 48 : 32;
        if (x < VW * 0.74) return 10;
        return 0;
      }
    }
    const base = isBare() ? 126 : 98;
    return base + (G.stage - 1) * 8 + Math.min(18, G.combo * 0.6);
  }

  function spawnFan(wx, y, n, redI, dive) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 22, cave.bot - 22);
    const bare = isBare();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'fan',
        wx: wx + i * 20,
        y: y + (i - (n - 1) * 0.5) * (dive ? 6 : 10),
        hw: 10, hh: 6,
        hp: 1,
        vx: -(bare ? 86 : 68),
        phase: i * 0.5,
        path: dive ? 'dive' : 'sine',
        red: i === redI,
        cd: rand(0.5, 1.4)
      });
    }
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
      cd: rand(0.6, 1.6),
      heat: 0,
      scenery: true
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
      hp: isBare() ? 10 : 12,
      max: isBare() ? 10 : 12,
      cd: rand(0.8, 1.8),
      ceil: !!ceil,
      mouth: 0
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
    if (wx < 240) return;
    const nearBoss = BOSS_AT[G.cleared];
    if (nearBoss != null && wx > nearBoss - 160) return;
    const st = stageAt(wx);
    const slice = (wx / 56) | 0;
    const h = hash2(slice * 19 + (isBare() ? 7 : 3) + G.stage * 11);
    const cave = caveAt(wx);
    const mid = (cave.top + cave.bot) * 0.5;
    const dens = isBare() ? 0.78 : 1;
    const fanEvery = isBare() ? 3 : 4;

    if (slice % fanEvery === 0 && h > 0.16 * dens) {
      const y = lerp(cave.top + 36, cave.bot - 36, hash2(slice + 44));
      const n = (isBare() ? 6 : 5) + (st === 3 ? 1 : 0);
      const dive = h > 0.72 && st > 1;
      spawnFan(wx, y, n, h > 0.48 ? 0 : -1, dive);
    }
    if (slice % 8 === 3 && h > 0.28) {
      spawnFan(wx + 10, mid + (h > 0.5 ? 40 : -40), isBare() ? 5 : 4, 0, false);
    }
    if (st !== 2 && slice % (isBare() ? 4 : 5) === 1 && h > 0.32 * dens) {
      spawnDucker(wx);
    }
    if ((st === 1 || st === 3) && slice % 8 === 0) {
      spawnVolcano(wx);
    }
    if ((st === 2 || st === 3) && slice % 6 === 3) {
      spawnMoai(wx, h > 0.48);
      if (isBare() && h > 0.7) spawnMoai(wx + 70, h <= 0.48);
    }
    if (slice % 7 === 3 && h > 0.34) {
      spawnCap(wx, lerp(cave.top + 40, cave.bot - 40, hash2(slice + 9)));
    }
  }

  function spawnBoss() {
    G.boss = true;
    const hp = (G.stage === 1 ? 36 : G.stage === 2 ? 50 : 66) + (isBare() ? 6 : 0);
    const cave = caveAt(G.cam + VW * 0.72);
    pushEnt({
      type: 'core',
      wx: G.cam + VW * 0.78,
      y: (cave.top + cave.bot) * 0.5,
      hw: 54, hh: 32,
      hp: hp,
      max: hp,
      open: 0,
      phase: 0,
      cd: 0.6,
      vy: 48,
      coreR: 12
    });
    toast('核心出现', false, true);
    audio.check();
    kick(3.4);
    screenFlash(GOLD, 0.32);
    syncHud();
  }

  function trySpawn() {
    if (!G.boss && G.mode === 'play') {
      const mark = BOSS_AT[G.cleared];
      if (mark != null && G.cam + VW * 0.72 >= mark) spawnBoss();
    }
    if (G.boss) return;
    const ahead = G.cam + VW + 80;
    while (G.spawnedX < ahead) {
      G.spawnedX += 56;
      spawnSlice(G.spawnedX);
    }
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 64; i++) {
      stars.push({
        wx: hash2(i * 17) * 2400,
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
    const gold = kind === 'core' || kind === 'moai' || G.mult >= 3;
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
      toast('先吃胶囊', true);
      audio.miss();
      return;
    }
    const list = slotList();
    const s = list[G.bar - 1];
    if (!s) return;
    applySlot(s.id);
    G.bar = 0;
    syncSlots();
    syncHud();
  }

  function collectCap(e) {
    e.alive = false;
    const max = slotList().length;
    G.bar = G.bar % max + 1;
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
    if (G.caps === 1) toast('C 点选武装', false, true);
    else {
      const s = slotList()[G.bar - 1];
      toast(s ? s.full : '武装', false, true);
    }
    addScore(40);
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
    capArr(G.shots, 40);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    G.fireCd = G.laser ? 0.1 : 0.128;
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
          type: 'shot', wx: wx, y: p.y, vx: 560, vy: 0,
          hw: 6, hh: 2.2, life: 0.9
        });
        pushShot({
          type: 'shot', wx: wx, y: p.y - 2, vx: 500, vy: -280,
          hw: 5, hh: 2.2, life: 0.9
        });
      } else {
        pushShot({
          type: 'shot', wx: wx, y: p.y, vx: 560, vy: 0,
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
      wx: wx, y: y, vx: vx, vy: vy, r: r || 3.2, life: 3
    });
    capArr(G.eShots, 90);
  }

  function hurt(e, dmg, hx, hy) {
    if (!e.alive || e.scenery) return false;
    if (e.type === 'core' && e.open < 0.55) return 'block';
    e.hp -= dmg || 1;
    e.flash = 0.08;
    if (e.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -90, vx1: 90, vy0: -80, vy1: 50,
        life: 0.16, r0: 1, r1: 2.2, rgb: WHT, g: 80
      });
      if (e.type === 'core' || e.type === 'moai') hitStop(0.026);
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
      addScore(1500 * G.stage);
      audio.boom();
      hitStop(0.08);
      kick(8);
      screenFlash(GOLD, 0.62);
      G.cleared += 1;
      G.boss = false;
      if (G.cleared >= 3) {
        G.winT = 1.2;
        toast('核心尽破', false, true);
      } else {
        G.stage = G.cleared + 1;
        toast('第 ' + G.stage + ' 关 · ' + STAGE_NAME[G.stage - 1], false, true);
        audio.check();
      }
      syncHud();
      return;
    }
    if (e.type === 'cap') return;
    const kind = e.red ? 'red' : e.type;
    const rgb = e.red ? RED : e.type === 'moai' ? STN : e.type === 'ducker' ? MAG : CYN;
    explode(x, y, rgb, e.type === 'moai' ? 26 : 16);
    award(kind, x, y);
    audio.hit(G.combo);
    hitStop(clamp(0.03 + G.combo * 0.0022, 0.03, 0.062));
    kick(e.type === 'moai' ? 3.4 : 1.8);
    if (e.red || (e.type === 'fan' && hash2(e.id * 13) > 0.82) || e.type === 'moai' && hash2(e.id) > 0.7) {
      spawnCap(e.wx, e.y);
    }
  }

  function shieldAbsorb(x, y) {
    if (G.shield <= 0) return false;
    G.shield -= 1;
    G.shieldFlash = 0.18;
    G.invuln = Math.max(G.invuln, 0.28);
    audio.shieldHit();
    popSpark(x, y, TEAL, 18);
    emit(12, {
      x: x, y: y, j: 8,
      vx0: -140, vx1: 140, vy0: -120, vy1: 120,
      r0: 1.4, r1: 3.2, life: 0.28, rgb: TEAL, g: 0
    });
    hitStop(0.04);
    kick(2.8);
    if (G.shield <= 0) {
      toast('护盾碎了', true);
      screenFlash(TEAL, 0.3);
    }
    syncSlots();
    return true;
  }

  function killPlayer() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.invuln > 0) return;
    if (shieldAbsorb(G.px + 18, G.py)) return;
    G.lives -= 1;
    G.deadT = 0.92;
    breakCombo();
    G.fireHold = false;
    explode(G.px, G.py, MAG, 34);
    stripPowers();
    audio.death();
    hitStop(0.072);
    kick(7.2);
    screenFlash(MAG, 0.55);
    syncHud();
  }

  function respawn() {
    G.px = 88;
    const cave = caveAt(pwx());
    G.py = clamp((cave.top + cave.bot) * 0.5, cave.top + 20, cave.bot - 20);
    G.invuln = 1.45;
    G.trail.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '舰毁了';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function winGame() {
    addScore(8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '核心尽破', '三关打穿 · 分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function updateTrail() {
    G.trail.push({ x: G.px, y: G.py });
    if (G.trail.length > 80) G.trail.shift();
  }

  function updateOptions() {
    for (let i = 0; i < G.options.length; i++) {
      const o = G.options[i];
      const idx = G.trail.length - 1 - (i + 1) * OPT_GAP;
      const t = idx >= 0 ? G.trail[idx] : { x: G.px, y: G.py };
      o.x = t.x;
      o.y = t.y;
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
    if (!REDUCE && (G.engine > 0.04)) {
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

  function updateEnts(dt) {
    const bare = isBare();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.flash > 0) e.flash -= dt;
      const x = scrX(e.wx);
      if (!e.alive) {
        if (x < -80) G.ents.splice(i, 1);
        continue;
      }
      if (e.type !== 'core' && x < -70) {
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
          e.cd = bare ? rand(0.9, 1.6) : rand(1.4, 2.4);
          if (hash2(e.id + ((G.t * 8) | 0)) > (bare ? 0.45 : 0.62)) {
            const dx = pwx() - e.wx;
            const dy = G.py - e.y;
            const d = hypot(dx, dy) || 1;
            const sp = bare ? 180 : 150;
            enemyShot(e.wx - 8, e.y, dx / d * sp, dy / d * sp, 3);
          }
        }
      } else if (e.type === 'ducker') {
        const cave = caveAt(e.wx);
        e.y = cave.bot - 11;
        e.wx += e.dir * (bare ? 46 : 34) * dt;
        e.walk += dt;
        if (e.walk > 1.6) {
          e.walk = 0;
          e.dir *= -1;
        }
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 30) {
          e.cd = bare ? 0.85 : 1.15;
          const dx = pwx() - e.wx;
          const dy = G.py - e.y;
          const d = hypot(dx, dy) || 1;
          enemyShot(e.wx, e.y - 8, dx / d * 170, dy / d * 170, 3.2);
        }
      } else if (e.type === 'volcano') {
        const cave = caveAt(e.wx);
        e.y = cave.bot + 4;
        e.cd -= dt;
        e.heat = Math.max(0, e.heat - dt);
        if (e.cd <= 0 && x < VW + 20 && x > -10) {
          e.cd = (bare ? 0.85 : 1.15) + rand(0, 0.5);
          e.heat = 0.28;
          const n = bare ? 3 : 2;
          for (let r = 0; r < n; r++) {
            pushEnt({
              type: 'rock',
              wx: e.wx + rand(-8, 8),
              y: e.y - 18,
              vx: rand(-70, 30),
              vy: rand(-240, -120),
              hw: 6, hh: 6, hp: 1
            });
          }
        }
      } else if (e.type === 'rock') {
        e.wx += e.vx * dt;
        e.vy += 280 * dt;
        e.y += e.vy * dt;
        const cave = caveAt(e.wx);
        if (e.y > cave.bot - 6) {
          e.alive = false;
          explode(x, e.y, ORG, 8);
        }
      } else if (e.type === 'moai') {
        const cave = caveAt(e.wx);
        e.y = e.ceil ? cave.top + 22 : cave.bot - 22;
        e.cd -= dt;
        if (e.cd <= 0 && x < VW + 10 && x > 20) {
          e.cd = (bare ? 1.35 : 1.7) + rand(0, 0.4);
          e.mouth = 0.45;
          const tx = pwx();
          const ty = G.py;
          const dx = tx - e.wx;
          const dy = ty - e.y;
          const d = hypot(dx, dy) || 1;
          const sp = bare ? 92 : 74;
          pushEnt({
            type: 'ring',
            wx: e.wx + (e.ceil ? 6 : 8) * (dx > 0 ? 1 : -1),
            y: e.y + (e.ceil ? 10 : -10),
            vx: dx / d * sp,
            vy: dy / d * sp,
            hw: 11, hh: 11, hp: 2, spin: 0
          });
        }
        if (e.mouth > 0) e.mouth -= dt;
      } else if (e.type === 'ring') {
        e.wx += e.vx * dt;
        e.y += e.vy * dt;
        e.spin += dt * 4;
        const cave = caveAt(e.wx);
        if (e.y < cave.top + 8 || e.y > cave.bot - 8) e.vy *= -1;
      } else if (e.type === 'cap') {
        e.spin += dt * 5;
        e.y += Math.sin(G.t * 3 + e.spin) * 12 * dt;
        e.wx -= 12 * dt;
      } else if (e.type === 'core') {
        e.wx = clamp(e.wx, G.cam + VW * 0.62, G.cam + VW * 0.8);
        e.phase += dt * (e.hp < e.max * 0.4 ? 1.25 : 1);
        const cyc = 2.45;
        const u = e.phase % cyc;
        if (u < 1.25) e.open = 0;
        else if (u < 1.4) e.open = (u - 1.25) / 0.15;
        else if (u < 2.3) e.open = 1;
        else e.open = Math.max(0, 1 - (u - 2.3) / 0.15);
        const cave = caveAt(e.wx);
        e.y += e.vy * dt;
        if (e.y < cave.top + 48 || e.y > cave.bot - 48) {
          e.vy *= -1;
          e.y = clamp(e.y, cave.top + 48, cave.bot - 48);
        }
        e.cd -= dt;
        if (e.cd <= 0) {
          e.cd = e.open > 0.5 ? (bare ? 0.42 : 0.55) : (bare ? 0.7 : 0.9);
          const n = e.open > 0.5 ? (e.hp < e.max * 0.45 ? 5 : 3) : 4;
          for (let k = 0; k < n; k++) {
            const ang = e.open > 0.5
              ? Math.atan2(G.py - e.y, pwx() - e.wx) + (k - (n - 1) * 0.5) * 0.22
              : Math.PI + (k - (n - 1) * 0.5) * 0.28;
            const sp = bare ? 170 : 150;
            enemyShot(e.wx - 20, e.y + (k - n * 0.5) * 6, Math.cos(ang) * sp, Math.sin(ang) * sp, 3.6);
          }
        }
      }

      if (G.mode === 'play' && G.deadT <= 0 && e.alive && e.type !== 'cap') {
        const phw = 7.2;
        const phh = 4.6;
        let hw = e.hw;
        let hh = e.hh;
        if (e.type === 'core') {
          hw = e.hw * 0.85;
          hh = e.hh * 0.75;
        }
        if (e.type === 'volcano') {
          hw = e.hw * 0.7;
          hh = e.hh * 0.55;
        }
        if (aabb(pwx(), G.py, phw, phh, e.wx, e.y, hw, hh)) {
          if (G.invuln > 0) {
            /* bounce out of scenery while flashing */
          } else {
            killPlayer();
          }
        }
      }
      if (G.mode === 'play' && G.deadT <= 0 && e.alive && e.type === 'cap') {
        if (aabb(pwx(), G.py, 12, 10, e.wx, e.y, e.hw, e.hh)) collectCap(e);
      }
    }
  }

  function updateFx(dt) {
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.shieldFlash > 0) G.shieldFlash -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
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
      c.fillStyle = rgba(WHT, 0.25 + s.p * 0.55);
      const r = s.s * scale;
      c.fillRect(sx(x), sy(s.y), r, r);
    }
  }

  function drawCave() {
    const c = ctx;
    const step = 6;
    c.beginPath();
    c.moveTo(sx(0), sy(0));
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      c.lineTo(sx(x), sy(cv.top));
    }
    c.lineTo(sx(VW), sy(0));
    c.closePath();
    c.fillStyle = '#07141c';
    c.fill();
    c.strokeStyle = rgba(CYN, 0.55);
    c.lineWidth = Math.max(1, 1.4 * scale);
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(cv.top));
      else c.lineTo(sx(x), sy(cv.top));
    }
    c.stroke();

    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      c.lineTo(sx(x), sy(cv.bot));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    c.fillStyle = '#0a1c18';
    c.fill();
    c.strokeStyle = rgba(TEAL, 0.4);
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(cv.bot));
      else c.lineTo(sx(x), sy(cv.bot));
    }
    c.stroke();

    c.fillStyle = rgba(DEEP, 0.5);
    for (let x = 0; x <= VW; x += 18) {
      const cv = caveAt(G.cam + x);
      const h = hash2(((G.cam + x) / 18) | 0);
      if (h > 0.55) c.fillRect(sx(x), sy(cv.top), 3 * scale, 6 * scale);
      if (h > 0.6) c.fillRect(sx(x + 4), sy(cv.bot - 6), 3 * scale, 6 * scale);
    }
  }

  function drawViper(x, y, a) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(y));
    c.globalAlpha = a == null ? 1 : a;
    const s = scale;
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle / 0.055);
      c.beginPath();
      c.ellipse(18 * s, 0, 10 * s, 3.2 * s, 0, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(CYN, 0.55);
    c.beginPath();
    c.moveTo(-16 * s, -2 * s);
    c.lineTo(-22 * s, -5 * s);
    c.lineTo(-22 * s, 5 * s);
    c.lineTo(-16 * s, 2 * s);
    c.fill();
    c.fillStyle = rgba(TEAL, 0.9);
    c.beginPath();
    c.moveTo(-12 * s, 0);
    c.lineTo(-6 * s, -11 * s);
    c.lineTo(2 * s, -6 * s);
    c.lineTo(2 * s, 6 * s);
    c.lineTo(-6 * s, 11 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.beginPath();
    c.moveTo(-10 * s, -4 * s);
    c.lineTo(18 * s, 0);
    c.lineTo(-10 * s, 4 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 1);
    c.beginPath();
    c.moveTo(2 * s, -2.4 * s);
    c.lineTo(16 * s, 0);
    c.lineTo(2 * s, 2.4 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.9);
    c.fillRect(-6 * s, -1.4 * s, 8 * s, 2.8 * s);
    c.restore();
  }

  function drawOption(o) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(o.x), sy(o.y));
    c.rotate(G.t * 3.2);
    c.strokeStyle = rgba(ORG, 0.85);
    c.lineWidth = Math.max(1, 1.5 * s);
    c.beginPath();
    c.arc(0, 0, 7.2 * s, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.arc(0, 0, 3.6 * s, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(WHT, 0.7);
    c.beginPath();
    c.moveTo(-5 * s, 0);
    c.lineTo(5 * s, 0);
    c.moveTo(0, -5 * s);
    c.lineTo(0, 5 * s);
    c.stroke();
    c.restore();
  }

  function drawShield() {
    if (G.shield <= 0 || G.deadT > 0) return;
    const c = ctx;
    const n = G.shield;
    const pts = n >= 3
      ? [[22, -9], [26, 0], [22, 9]]
      : n === 2 ? [[22, -8], [22, 8]] : [[24, 0]];
    const pulse = 0.7 + Math.sin(G.t * 8) * 0.3;
    const a = G.shieldFlash > 0 ? 1 : 0.8 * pulse;
    for (let i = 0; i < pts.length; i++) {
      const x = G.px + pts[i][0];
      const y = G.py + pts[i][1];
      c.fillStyle = rgba(TEAL, a * 0.35);
      c.beginPath();
      c.arc(sx(x), sy(y), 7 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(TEAL, a);
      c.lineWidth = Math.max(1, 1.6 * scale);
      c.beginPath();
      c.arc(sx(x), sy(y), 6 * scale, 0, TAU);
      c.stroke();
    }
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'win' && G.mode !== 'title') return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    for (let i = G.options.length - 1; i >= 0; i--) drawOption(G.options[i]);
    drawViper(G.px, G.py, 1);
    drawShield();
  }

  function drawFan(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    const rgb = e.red ? RED : MAG;
    c.fillStyle = rgba(e.flash > 0 ? WHT : rgb, 0.95);
    c.beginPath();
    c.moveTo(-10 * s, 0);
    c.lineTo(8 * s, -6 * s);
    c.lineTo(4 * s, 0);
    c.lineTo(8 * s, 6 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.8);
    c.fillRect(-2 * s, -1.4 * s, 6 * s, 2.8 * s);
    c.restore();
  }

  function drawDucker(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : MAG, 0.95);
    c.fillRect(-10 * s, -4 * s, 20 * s, 8 * s);
    c.fillStyle = rgba(GOLD, 0.9);
    c.fillRect(-3 * s, -10 * s, 5 * s, 7 * s);
    c.fillStyle = rgba(STN, 0.9);
    c.fillRect(-8 * s, 3 * s, 5 * s, 4 * s);
    c.fillRect(3 * s, 3 * s, 5 * s, 4 * s);
    c.restore();
  }

  function drawVolcano(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = '#142028';
    c.beginPath();
    c.moveTo(-26 * s, 14 * s);
    c.lineTo(-8 * s, -22 * s);
    c.lineTo(8 * s, -22 * s);
    c.lineTo(26 * s, 14 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(e.heat > 0 ? ORG : RED, 0.55 + e.heat);
    c.beginPath();
    c.moveTo(-7 * s, -22 * s);
    c.lineTo(0, -32 * s - e.heat * 10 * s);
    c.lineTo(7 * s, -22 * s);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawMoai(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    if (e.ceil) c.scale(1, -1);
    c.fillStyle = rgba(e.flash > 0 ? WHT : STN, 0.96);
    c.beginPath();
    c.moveTo(-12 * s, -20 * s);
    c.lineTo(10 * s, -18 * s);
    c.lineTo(14 * s, 16 * s);
    c.lineTo(-14 * s, 18 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(DEEP, 0.95);
    c.fillRect(-6 * s, -10 * s, 10 * s, 4 * s);
    const mouth = 4 + e.mouth * 10;
    c.beginPath();
    c.arc(4 * s, 6 * s, mouth * 0.45 * s, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.5);
    c.fillRect(-4 * s, -2 * s, 6 * s, 3 * s);
    c.restore();
  }

  function drawRock(e, x) {
    const c = ctx;
    c.fillStyle = rgba(e.flash > 0 ? WHT : ORG, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(e.y), 6 * scale, 0, TAU);
    c.fill();
  }

  function drawRing(e, x) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.strokeStyle = rgba(e.flash > 0 ? WHT : PNK, 0.9);
    c.lineWidth = Math.max(1.4, 2.2 * scale);
    c.beginPath();
    c.arc(0, 0, 10 * scale, 0, TAU);
    c.stroke();
    c.strokeStyle = rgba(MAG, 0.5);
    c.beginPath();
    c.arc(0, 0, 6 * scale, 0, TAU);
    c.stroke();
    c.restore();
  }

  function drawCap(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.fillStyle = rgba(ORG, 0.95);
    c.beginPath();
    c.ellipse(0, 0, 8 * s, 5.2 * s, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.95);
    c.fillRect(-2 * s, -5 * s, 4 * s, 10 * s);
    c.restore();
  }

  function drawCore(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : [70, 96, 112], 0.96);
    c.beginPath();
    c.moveTo(-52 * s, 0);
    c.lineTo(-28 * s, -30 * s);
    c.lineTo(40 * s, -26 * s);
    c.lineTo(52 * s, 0);
    c.lineTo(40 * s, 26 * s);
    c.lineTo(-28 * s, 30 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.35);
    c.fillRect(28 * s, -10 * s, 16 * s, 20 * s);
    const open = e.open;
    c.fillStyle = rgba(DEEP, 1);
    c.beginPath();
    c.arc(-8 * s, 0, 14 * s, 0, TAU);
    c.fill();
    c.fillStyle = rgba(open > 0.55 ? GOLD : [40, 50, 58], 0.4 + open * 0.6);
    c.beginPath();
    c.arc(-8 * s, 0, (7 + open * 5) * s, 0, TAU);
    c.fill();
    if (open > 0.55) {
      c.strokeStyle = rgba(GOLD, 0.7);
      c.lineWidth = Math.max(1, 1.4 * s);
      c.beginPath();
      c.arc(-8 * s, 0, 16 * s, 0, TAU);
      c.stroke();
    }
    c.fillStyle = rgba(MAG, 0.85);
    c.fillRect(-36 * s, -22 * s, 8 * s, 6 * s);
    c.fillRect(-36 * s, 16 * s, 8 * s, 6 * s);
    c.fillRect(8 * s, -24 * s, 8 * s, 6 * s);
    c.fillRect(8 * s, 18 * s, 8 * s, 6 * s);
    c.restore();
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = scrX(e.wx);
      if (x < -60 || x > VW + 60) continue;
      if (e.type === 'fan') drawFan(e, x);
      else if (e.type === 'ducker') drawDucker(e, x);
      else if (e.type === 'volcano') drawVolcano(e, x);
      else if (e.type === 'moai') drawMoai(e, x);
      else if (e.type === 'rock') drawRock(e, x);
      else if (e.type === 'ring') drawRing(e, x);
      else if (e.type === 'cap') drawCap(e, x);
      else if (e.type === 'core') drawCore(e, x);
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = scrX(s.wx);
      if (s.laser) {
        const grd = c.createLinearGradient(sx(x), sy(s.y), sx(x + s.hw * 1.6), sy(s.y));
        grd.addColorStop(0, rgba(WHT, 0.95));
        grd.addColorStop(0.35, rgba(CYN, 0.95));
        grd.addColorStop(1, rgba(CYN, 0.05));
        c.fillStyle = grd;
        c.fillRect(sx(x), sy(s.y - 2.6), s.hw * 1.7 * scale, 5.2 * scale);
        if (!REDUCE) {
          c.fillStyle = rgba(TEAL, 0.35);
          c.fillRect(sx(x), sy(s.y - 5), s.hw * 1.4 * scale, 10 * scale);
        }
      } else if (s.mis) {
        c.fillStyle = rgba(ORG, 0.95);
        c.beginPath();
        c.moveTo(sx(x + 6), sy(s.y));
        c.lineTo(sx(x - 4), sy(s.y - 3.4));
        c.lineTo(sx(x - 4), sy(s.y + 3.4));
        c.closePath();
        c.fill();
      } else {
        c.fillStyle = rgba(CYN, 0.98);
        c.fillRect(sx(x), sy(s.y - 1.6), 10 * scale, 3.2 * scale);
        if (!REDUCE) {
          c.fillStyle = rgba(WHT, 0.5);
          c.fillRect(sx(x - 6), sy(s.y - 1), 6 * scale, 2 * scale);
        }
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = scrX(s.wx);
      c.fillStyle = rgba(MAG, 0.95);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.r * 0.4 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawBossBar() {
    const b = findCore();
    if (!b || !b.alive || !G.boss) return;
    const c = ctx;
    const w = 220;
    const x = (VW - w) * 0.5;
    const y = 14;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(sx(x), sy(y), w * scale, 8 * scale);
    c.fillStyle = rgba(GOLD, 0.9);
    c.fillRect(sx(x), sy(y), w * (b.hp / b.max) * scale, 8 * scale);
    c.strokeStyle = rgba(WHT, 0.4);
    c.lineWidth = Math.max(1, scale);
    c.strokeRect(sx(x), sy(y), w * scale, 8 * scale);
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
    c.fillStyle = '#031018';
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
    g.addColorStop(0, '#041820');
    g.addColorStop(0.55, '#03141c');
    g.addColorStop(1, '#071018');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawCave();
    drawEnts();
    drawShots();
    drawPlayer();
    drawBossBar();
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
    G.cleared = 0;
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
    toast(isBare() ? '无护' : '远征', false, true);
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('raid');
    G.mode = 'title';
    G.laser = true;
    showOverlay('title', '秘武', '吃胶囊推进武装槽，按 C 点选。分身跟着你打。');
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
    const powKey = k === 'c' || k === 'C';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || powKey)) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || powKey)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (powKey) {
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      activate();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'bare' : 'raid');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
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
      if (e.button === 2) {
        e.preventDefault();
        activate();
        return;
      }
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
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

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
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

  seedStars();
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
  if (btnBare) {
    btnBare.addEventListener('click', function () {
      audio.ensure();
      startGame('bare');
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
  bindPowBtn(btnPow);
  bindPowBtn(btnPad);
  if (pwrEl) {
    pwrEl.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      audio.ensure();
      if (overlayOpen()) return;
      activate();
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
