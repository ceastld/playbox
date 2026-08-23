'use strict';

(function () {
  const VW = 720;
  const VH = 400;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const OPT_GAP = 12;
  const OPT_MAX = 3;
  const BOSS_AT = 9800;
  const STAGE_END = [3600, 7200, 9800];
  const BEST_KEY = 'playbox-salamander2-best';
  const MUTE_KEY = 'playbox-salamander2-mute';
  const AUTO_SPEED_KEY = 'playbox-salamander2-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.48, 0.72, 1, 2.55];
  const OPS = '←↑↓→ / WSD 移动 · 空格射击 · A 自动 · R 重开 · M 静音';
  const STAGE_NAME = ['口咽', '心室', '蛇巢'];
  const ORGANS = ['speed', 'missile', 'laser', 'option'];
  const ORGAN_NAME = { speed: '加速', missile: '爬导', laser: '神经束', option: '光球' };
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const CYN = [0, 245, 212];
  const TEAL = [60, 255, 192];
  const GOLD = [255, 227, 107];
  const ORG = [255, 176, 112];
  const WHT = [230, 255, 248];
  const PNK = [255, 154, 196];
  const FLESH = [196, 69, 106];
  const DEEP = [8, 36, 32];
  const VEIN = [140, 48, 78];
  const RED = [255, 72, 88];

  const SCORE = {
    cell: 50, lead: 110, spore: 90, mote: 30,
    tent: 170, eye: 210, cyst: 150, organ: 200, serp: 4200
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
  const btnCell = document.getElementById('btn-cell');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const misLabel = document.getElementById('mis-label');
  const orbLabel = document.getElementById('orb-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const hpWrap = document.getElementById('hp-wrap');
  const hpBar = document.getElementById('hp-bar');

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
  const motes = [];

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
    serpHist: [],
    speed: 0,
    misLvl: 0,
    laser: false,
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
    beat: 0
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoTx = 88;
  let autoTy = VH * 0.5;
  let autoStickS = -1e9;
  let autoOvWait = 0;

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
  function isCell() {
    return G.kind === 'cell';
  }
  function pwx() {
    return G.cam + G.px;
  }
  function scrX(wx) {
    return wx - G.cam;
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
  function stageAt(wx) {
    if (wx < STAGE_END[0]) return 1;
    if (wx < STAGE_END[1]) return 2;
    return 3;
  }
  function sphincter(wx) {
    const p = 540;
    const m = ((wx % p) + p) % p;
    if (m > 190 && m < 300) {
      const u = (m - 190) / 110;
      const tri = u < 0.5 ? u * 2 : (1 - u) * 2;
      return tri * tri * 44;
    }
    return 0;
  }
  function caveAt(wx) {
    const st = stageAt(wx);
    const n1 = fbm(wx * 0.00205, 3);
    const n2 = fbm(wx * 0.00335, 11);
    const beat = REDUCE ? 0 : Math.sin(G.t * 2.35 + wx * 0.008) * (st === 2 ? 6 : 3.4);
    const sph = sphincter(wx);
    let top;
    let bot;
    if (st === 1) {
      top = 12 + n1 * 20 + sph * 0.32;
      bot = VH - 14 - n2 * 24 - sph * 0.4;
    } else if (st === 2) {
      top = 20 + n1 * 36 + sph * 0.72 + beat;
      bot = VH - 20 - n2 * 38 - sph * 0.78 - beat;
    } else {
      top = 26 + n1 * 46 + sph * 0.5;
      bot = VH - 26 - n2 * 48 - sph * 0.55;
    }
    if (wx < 420) {
      const t = wx / 420;
      top = lerp(10, top, t);
      bot = lerp(VH - 10, bot, t);
    }
    if (G.boss) {
      top = Math.min(top, 36);
      bot = Math.max(bot, VH - 36);
    }
    if (top > bot - 82) {
      const mid = (top + bot) * 0.5;
      top = mid - 41;
      bot = mid + 41;
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
        this.beep(1180, 0.08, 'sawtooth', 0.03, 380);
        this.beep(1760, 0.05, 'square', 0.02, 720);
      } else {
        this.beep(640, 0.05, 'sine', 0.032, 1280);
        this.beep(980, 0.04, 'triangle', 0.018, 1480);
      }
    },
    missile() {
      this.ensure();
      this.beep(210, 0.1, 'sawtooth', 0.038, 86);
      this.noise(0.06, 0.028, 380);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.035);
      this.noise(0.042, 0.034, 1000);
      this.beep(480 * lift, 0.075, 'square', 0.04, 780 * lift);
    },
    organ(kind) {
      this.ensure();
      if (kind === 'option') {
        this.beep(523, 0.07, 'square', 0.045, 784);
        this.beep(659, 0.08, 'triangle', 0.04, 1046);
        this.beep(784, 0.14, 'sine', 0.04, 1318);
        this.noise(0.07, 0.03, 800);
      } else if (kind === 'laser') {
        this.beep(220, 0.08, 'sawtooth', 0.04, 1760);
        this.beep(880, 0.16, 'triangle', 0.04, 1760);
      } else if (kind === 'missile') {
        this.beep(196, 0.09, 'sawtooth', 0.04, 330);
        this.beep(392, 0.12, 'triangle', 0.032, 523);
      } else {
        this.beep(392, 0.07, 'square', 0.042, 784);
        this.beep(784, 0.12, 'triangle', 0.036, 1175);
      }
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
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
      this.noise(0.24, 0.085, 160);
      this.beep(160, 0.3, 'sawtooth', 0.055, 48);
      this.beep(80, 0.42, 'sine', 0.04, 36);
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
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
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

  function findHead() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'shead' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '沙罗';
      else if (G.boss) stageLabel.textContent = '巨蛇';
      else stageLabel.textContent = '第 ' + G.stage + ' 腔 · ' + (STAGE_NAME[G.stage - 1] || '');
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isCell() ? '细胞' : '血腔';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isCell());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (wpnLabel) {
      wpnLabel.textContent = G.laser ? '激' : '脉';
      wpnLabel.className = 'wpn ' + (G.laser ? 'laser' : 'pulse');
    }
    if (misLabel) {
      if (G.misLvl > 0) {
        misLabel.hidden = false;
        misLabel.textContent = G.misLvl >= 2 ? '导×2' : '导';
      } else misLabel.hidden = true;
    }
    if (orbLabel) {
      if (G.options.length > 0) {
        orbLabel.hidden = false;
        orbLabel.textContent = '球 ×' + G.options.length;
      } else orbLabel.hidden = true;
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else comboEl.hidden = true;
    }
    const head = findHead();
    if (hpWrap) {
      const show = !!(G.boss && head && head.alive && G.mode === 'play');
      hpWrap.hidden = !show;
      if (show && hpBar) {
        const p = clamp(head.hp / head.max, 0, 1);
        hpBar.style.transform = 'scaleX(' + p + ')';
      }
    }
    if (autoOn && (G.mode === 'play' || G.mode === 'title')) setHint('托管中 · A 停下', 'hot');
    else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) setHint('托管中 · R 重开接着打', 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 吃器官立刻武装', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 巨蛇尽灭', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 撞壁也掉命', 'warn');
    else if (G.boss) setHint('打蛇头 · 躯干也能削血 · 撞体即死', 'hot');
    else if (G.laser) setHint('神经束穿甲 · 光球抄射', '');
    else setHint('吃器官立刻武装 · 光球抄射 · 撞壁掉命', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SALA';
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
      }
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else comboEl.hidden = true;
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
    capArr(G.ents, 120);
  }

  function moveSpd() {
    return (isCell() ? 156 : 142) + G.speed * 32;
  }

  function scrollSpd() {
    if (G.boss) {
      const b = findHead();
      if (b && b.alive) {
        const x = scrX(b.wx);
        if (x < VW * 0.58) return isCell() ? 44 : 28;
        if (x < VW * 0.72) return 12;
        return 0;
      }
    }
    const base = isCell() ? 124 : 94;
    return base + (G.stage - 1) * 8 + Math.min(16, G.combo * 0.55);
  }

  function organKind(slice) {
    return ORGANS[(slice + (isCell() ? 2 : 0)) % ORGANS.length];
  }

  function spawnWave(wx, y, n, leadI) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 24, cave.bot - 24);
    const cell = isCell();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'cell',
        wx: wx + i * 18,
        y: y + (i - (n - 1) * 0.5) * 9,
        hw: 9, hh: 7,
        hp: 1,
        vx: -(cell ? 92 : 72),
        phase: i * 0.55,
        lead: i === leadI
      });
    }
  }

  function spawnSpore(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 28, cave.bot - 28);
    pushEnt({
      type: 'spore',
      wx: wx, y: y,
      hw: 12, hh: 12,
      hp: 2, max: 2,
      vx: -(isCell() ? 48 : 36),
      phase: rand(0, TAU)
    });
  }

  function spawnTent(wx, ceil) {
    const cave = caveAt(wx);
    const y = ceil ? cave.top + 4 : cave.bot - 4;
    if (occupied(wx, y, 36)) return;
    pushEnt({
      type: 'tent',
      wx: wx, y: y,
      hw: 7, hh: 10,
      hp: isCell() ? 4 : 5,
      ceil: !!ceil,
      len: 8,
      maxLen: 62 + (isCell() ? 10 : 0),
      phase: rand(0, TAU),
      grow: 1
    });
  }

  function spawnEye(wx, ceil) {
    const cave = caveAt(wx);
    const y = ceil ? cave.top + 16 : cave.bot - 16;
    if (occupied(wx, y, 32)) return;
    pushEnt({
      type: 'eye',
      wx: wx, y: y,
      hw: 13, hh: 12,
      hp: isCell() ? 5 : 6,
      max: isCell() ? 5 : 6,
      ceil: !!ceil,
      cd: rand(0.6, 1.4),
      open: 0
    });
  }

  function spawnCyst(wx, ceil) {
    const cave = caveAt(wx);
    const y = ceil ? cave.top + 18 : cave.bot - 18;
    if (occupied(wx, y, 40)) return;
    pushEnt({
      type: 'cyst',
      wx: wx, y: y,
      hw: 16, hh: 14,
      hp: 6, max: 6,
      ceil: !!ceil,
      pulse: rand(0, TAU)
    });
  }

  function spawnOrgan(wx, y, kind) {
    pushEnt({
      type: 'organ',
      kind: kind || organKind((wx / 40) | 0),
      wx: wx, y: y,
      hw: 10, hh: 10,
      hp: 1,
      spin: 0,
      vy: rand(-18, 18)
    });
  }

  function spawnSlice(wx) {
    if (G.boss) return;
    if (wx < 280) return;
    if (wx > BOSS_AT - 180) return;
    const st = stageAt(wx);
    const slice = (wx / 52) | 0;
    const h = hash2(slice * 19 + (isCell() ? 7 : 3) + G.stage * 11);
    const cave = caveAt(wx);
    const mid = (cave.top + cave.bot) * 0.5;
    const dens = isCell() ? 0.72 : 1;
    const waveEvery = isCell() ? 3 : 4;

    if (slice % waveEvery === 0 && h > 0.14 * dens) {
      const y = lerp(cave.top + 40, cave.bot - 40, hash2(slice + 44));
      const n = (isCell() ? 6 : 5) + (st === 3 ? 1 : 0);
      spawnWave(wx, y, n, h > 0.46 ? 0 : -1);
    }
    if (slice % 7 === 2 && h > 0.3) {
      spawnWave(wx + 8, mid + (h > 0.5 ? 36 : -36), isCell() ? 5 : 4, 0);
    }
    if (st >= 1 && slice % (isCell() ? 5 : 6) === 2 && h > 0.28 * dens) {
      spawnSpore(wx, lerp(cave.top + 50, cave.bot - 50, hash2(slice + 3)));
    }
    if (st >= 2 && slice % (isCell() ? 4 : 5) === 1) {
      spawnTent(wx, h > 0.5);
      if (isCell() && h > 0.72) spawnTent(wx + 40, h <= 0.5);
    }
    if (st >= 2 && slice % 6 === 4 && h > 0.26) {
      spawnEye(wx, h > 0.52);
    }
    if ((st === 1 || st === 3) && slice % 8 === 0 && h > 0.22) {
      spawnCyst(wx, h > 0.55);
    }
    if (st === 2 && slice % 9 === 3) {
      spawnCyst(wx, false);
      if (h > 0.6) spawnCyst(wx + 50, true);
    }
  }

  function spawnBoss() {
    G.boss = true;
    const hp = (isCell() ? 124 : 96);
    const cave = caveAt(G.cam + VW * 0.74);
    const hy = (cave.top + cave.bot) * 0.5;
    pushEnt({
      type: 'shead',
      wx: G.cam + VW * 0.92,
      y: hy,
      hw: 22, hh: 18,
      hp: hp,
      max: hp,
      phase: 0,
      cd: 0.7,
      angry: false
    });
    const n = 12;
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'sbody',
        wx: G.cam + VW * 0.92 + (i + 1) * 18,
        y: hy,
        hw: 13 - i * 0.25, hh: 11 - i * 0.2,
        hp: 1,
        idx: i,
        pulse: i * 0.4
      });
    }
    G.serpHist.length = 0;
    for (let i = 0; i < 90; i++) {
      G.serpHist.push({ wx: G.cam + VW * 0.92 + i * 3.6, y: hy });
    }
    toast('巨蛇苏醒', false, true);
    audio.check();
    kick(4.2);
    screenFlash(MAG, 0.38);
    syncHud();
  }

  function trySpawn() {
    if (!G.boss && G.mode === 'play') {
      if (G.cam + VW * 0.7 >= BOSS_AT) spawnBoss();
    }
    if (G.boss) return;
    const ahead = G.cam + VW + 90;
    while (G.spawnedX < ahead) {
      G.spawnedX += 52;
      spawnSlice(G.spawnedX);
    }
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 48; i++) {
      motes.push({
        wx: hash2(i * 17) * 2800,
        y: 20 + hash2(i * 91 + 3) * (VH - 40),
        s: 0.6 + hash2(i * 5 + 9) * 2.2,
        p: 0.18 + hash2(i * 13) * 0.7,
        rgb: hash2(i * 3) > 0.55 ? CYN : PNK
      });
    }
  }

  function award(kind, x, y) {
    bumpCombo();
    const n = (SCORE[kind] || 10) * G.mult;
    addScore(n);
    const gold = kind === 'serp' || kind === 'eye' || G.mult >= 3;
    floatText(scrX(x) < 0 ? G.px : scrX(x), y - 8, '+' + n, gold ? GOLD : WHT, gold);
  }

  function stripPowers() {
    G.speed = 0;
    G.misLvl = 0;
    G.laser = false;
    for (let i = 0; i < G.options.length; i++) {
      const o = G.options[i];
      explode(o.x, o.y, GOLD, 14);
    }
    G.options.length = 0;
    G.trail.length = 0;
  }

  function spawnOption() {
    if (G.options.length >= OPT_MAX) {
      toast('光球 MAX', false, true);
      addScore(500 * G.mult);
      audio.organ('option');
      return;
    }
    const last = G.trail.length ? G.trail[Math.max(0, G.trail.length - 8)] : { x: G.px - 18, y: G.py };
    G.options.push({ x: last.x, y: last.y, t: 0 });
    toast('光球 ×' + G.options.length, false, true);
    audio.organ('option');
    explode(last.x, last.y, GOLD, 18);
    popSpark(last.x, last.y, GOLD, 22);
    hitStop(0.05);
    kick(3.4);
    screenFlash(GOLD, 0.42);
    floatText(last.x, last.y - 14, 'ORB', GOLD, true);
  }

  function applyOrgan(kind, x, y) {
    addScore(SCORE.organ * G.mult);
    floatText(x, y - 12, ORGAN_NAME[kind] || kind, GOLD, true);
    if (kind === 'speed') {
      if (G.speed < 5) G.speed += 1;
      toast(G.speed >= 5 ? '加速 MAX' : '加速 ×' + G.speed, false, true);
      audio.organ('speed');
      kick(2.2);
      screenFlash(CYN, 0.28);
      emit(12, {
        x: G.px, y: G.py, j: 8,
        vx0: -40, vx1: 140, vy0: -80, vy1: 80,
        r0: 1.2, r1: 3, life: 0.28, rgb: CYN, g: 0
      });
    } else if (kind === 'missile') {
      G.misLvl = Math.min(2, G.misLvl + 1);
      toast(G.misLvl >= 2 ? '双爬导' : '爬导', false, true);
      audio.organ('missile');
      kick(2.4);
      screenFlash(ORG, 0.28);
    } else if (kind === 'laser') {
      G.laser = true;
      toast('神经束', false, true);
      audio.organ('laser');
      screenFlash(GOLD, 0.42);
      hitStop(0.045);
      kick(3);
    } else if (kind === 'option') {
      spawnOption();
    }
    hitStop(0.04);
    popSpark(x, y, GOLD, 18);
    syncHud();
  }

  function collectOrgan(e) {
    e.alive = false;
    applyOrgan(e.kind, scrX(e.wx), e.y);
  }

  function enemyShot(wx, y, vx, vy, r) {
    G.eShots.push({
      wx: wx, y: y, vx: vx, vy: vy,
      r: r || 3.4, life: 3.6
    });
    capArr(G.eShots, 90);
  }

  function sources() {
    const list = [{ x: G.px + 10, y: G.py }];
    for (let i = 0; i < G.options.length; i++) {
      list.push({ x: G.options[i].x + 6, y: G.options[i].y });
    }
    return list;
  }

  function pushShot(s) {
    G.shots.push(s);
    capArr(G.shots, 80);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    G.fireCd = G.laser ? 0.092 : 0.118;
    G.muzzle = 0.06;
    audio.shoot(G.laser);
    const srcs = sources();
    for (let i = 0; i < srcs.length; i++) {
      const s = srcs[i];
      if (G.laser) {
        pushShot({
          type: 'laser',
          wx: G.cam + s.x,
          y: s.y,
          vx: 840, vy: 0,
          hw: 42, hh: 3.1,
          life: 0.24,
          hit: {},
          laser: true,
          dmg: 1
        });
      } else {
        pushShot({
          type: 'rip',
          wx: G.cam + s.x,
          y: s.y,
          vx: 500, vy: 0,
          r: 5.5,
          grow: 26,
          life: 0.52,
          hit: {},
          dmg: 1
        });
      }
    }
    if (G.misLvl > 0 && G.misCd <= 0) {
      G.misCd = 0.3;
      audio.missile();
      const dirs = G.misLvl >= 2 ? [1, -1] : [1];
      const from = [{ x: G.px, y: G.py }];
      if (G.options.length) from.push({ x: G.options[0].x, y: G.options[0].y });
      for (let f = 0; f < from.length; f++) {
        for (let d = 0; d < dirs.length; d++) {
          pushShot({
            type: 'mis',
            wx: G.cam + from[f].x,
            y: from[f].y,
            vx: 50,
            vy: 210 * dirs[d],
            hw: 4.5, hh: 4,
            life: 2.4,
            ceil: dirs[d] < 0,
            crawl: false,
            dmg: 1.4
          });
        }
      }
    }
  }

  function updateTrail() {
    G.trail.push({ x: G.px, y: G.py });
    const need = OPT_MAX * OPT_GAP + 8;
    if (G.trail.length > need) G.trail.splice(0, G.trail.length - need);
  }

  function updateOptions() {
    for (let i = 0; i < G.options.length; i++) {
      const o = G.options[i];
      const idx = G.trail.length - 1 - (i + 1) * OPT_GAP;
      const t = idx >= 0 ? G.trail[idx] : G.trail[0] || { x: G.px - 20, y: G.py };
      o.x = lerp(o.x, t.x, 0.28);
      o.y = lerp(o.y, t.y, 0.28);
      o.t += STEP;
    }
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

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoOvWait = 0;
    autoStickS = -1e9;
    autoClearInput();
    autoTx = G.px;
    autoTy = G.py;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('raid');
    }
    syncHud();
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.22 : 0.48)) {
        autoOvWait = 0;
        startGame('raid');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.65 : 1.1)) {
        autoOvWait = 0;
        startGame(G.kind || 'raid');
      }
    }
  }

  function autoDanger(sx, sy, horizon) {
    let d = 0;
    const wx = G.cam + sx;
    const scroll = scrollSpd();
    for (let k = 0; k < 10; k++) {
      const ahead = k * 30;
      const c = caveAt(wx + ahead);
      const w = 1.15 + (9 - k) * 0.16;
      const m = 18;
      if (sy < c.top + m) d += (c.top + m - sy) * 20 * w;
      if (sy > c.bot - m) d += (sy - (c.bot - m)) * 20 * w;
      if (sy < c.top + 11 || sy > c.bot - 11) d += 420 * w;
      const gap = c.bot - c.top;
      if (gap < 118) d += (118 - gap) * 0.55 * w;
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const relx = s.wx - wx;
      const rely = s.y - sy;
      const rvx = s.vx - scroll;
      const rvy = s.vy;
      const vv = rvx * rvx + rvy * rvy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * rvx + rely * rvy) / vv, 0, horizon);
      const dist = hypot(relx + rvx * t, rely + rvy * t);
      const rad = 8.2 + s.r;
      if (t <= horizon && dist < rad + 34) {
        const soon = (horizon - t) / Math.max(0.08, horizon);
        d += Math.max(0.5, rad + 12 - dist) * soon * 26;
        if (dist < rad) d += 240 * soon;
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || e.type === 'organ') continue;
      let ey = e.y;
      let eh = e.hh;
      let ew = e.hw;
      let evx = e.vx || 0;
      let evy = e.vy || 0;
      if (e.type === 'tent') {
        ew = 7;
        eh = e.len * 0.5;
        ey = e.ceil ? e.y + eh : e.y - eh;
        evx = 0;
        evy = 0;
      } else if (e.type === 'shead') {
        ew = 18;
        eh = 14;
      } else if (e.type === 'sbody') {
        ew = e.hw * 0.85;
        eh = e.hh * 0.85;
      } else if (e.type === 'eye' || e.type === 'cyst') {
        evx = 0;
        evy = 0;
      }
      const relx = e.wx - wx;
      const rely = ey - sy;
      const rvx = evx - scroll;
      const rvy = evy;
      const vv = rvx * rvx + rvy * rvy;
      let t = 0;
      if (vv > 1) t = clamp(-(relx * rvx + rely * rvy) / vv, 0, horizon);
      const dist = hypot(relx + rvx * t, rely + rvy * t);
      const hitR = 8.4 + Math.max(ew, eh);
      if (dist < hitR + 28) {
        const soon = (horizon - t) / Math.max(0.08, horizon);
        const w = e.type === 'tent' ? 36
          : e.type === 'shead' ? 18
          : e.type === 'sbody' ? 16
          : e.type === 'spore' ? 22
          : 15;
        d += Math.max(0.4, hitR + 14 - dist) * soon * w;
        if (dist < hitR) d += 260 * soon;
      }
      if (Math.abs(e.wx - wx) < ew + 10 && Math.abs(ey - sy) < eh + 8) d += 140;
    }
    return d;
  }

  function autoThink() {
    if (!autoOn) return;
    if (G.mode !== 'play' || G.deadT > 0) {
      G.fireHold = false;
      return;
    }

    const cell = isCell();
    const horizon = cell ? 0.58 : 0.48;
    let aimY = null;
    let aimX = null;
    let aimW = -1e9;
    let pick = null;
    let pickW = -1e9;
    let nearbyShots = 0;
    let boss = null;
    let closeBody = false;

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const esx = scrX(e.wx);
      if (e.type === 'organ') {
        if (esx < -20 || esx > VW - 8) continue;
        let w = 88 - hypot(esx - G.px, e.y - G.py) * 0.42;
        if (e.kind === 'option' && G.options.length < OPT_MAX) w += G.options.length === 0 ? 92 : 64;
        else if (e.kind === 'laser' && !G.laser) w += 58;
        else if (e.kind === 'missile' && G.misLvl < 2) w += 50;
        else if (e.kind === 'speed' && G.speed < 3) w += 44;
        else w += 12;
        if (esx < G.px + 70) w += 24;
        if (w > pickW) {
          pickW = w;
          pick = e;
        }
        continue;
      }
      if (esx < G.px - 24 || esx > VW + 50) continue;
      let ty = e.y;
      let tx = esx;
      let w = 32;
      if (e.type === 'shead') {
        boss = e;
        w = 270 + e.hp * 0.35;
      } else if (e.type === 'sbody') w = 40;
      else if (e.type === 'lead' || e.lead) w = 130;
      else if (e.type === 'cyst') w = 110;
      else if (e.type === 'eye') w = 96;
      else if (e.type === 'tent') {
        const hh = e.len * 0.5;
        ty = e.ceil ? e.y + hh : e.y - hh;
        w = 70 + e.len * 0.4;
      } else if (e.type === 'spore') w = 84;
      else w = 36 + (e.hp || 1) * 8;
      w -= Math.abs(ty - G.py) * 0.28;
      w -= Math.max(0, esx - G.px) * 0.06;
      if (esx < G.px + 90) w += 14;
      if (esx < G.px + 52 && Math.abs(ty - G.py) < 22) {
        closeBody = true;
        w -= 80;
      }
      if (w > aimW) {
        aimW = w;
        aimY = ty;
        aimX = tx;
      }
    }

    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      if (hypot(scrX(s.wx) - G.px, s.y - G.py) < 150) nearbyShots += 1;
    }

    const hereDang = autoDanger(G.px, G.py, horizon);
    const pickSx = pick ? scrX(pick.wx) : 0;
    const grabPick = pick && (
      G.invuln > 0.18
      || autoDanger(pickSx, pick.y, 0.28) < 48
      || pickSx < G.px + 64
    );

    let desiredX = G.boss ? 78 : 98;
    let desiredY = aimY != null ? aimY : VH * 0.5;
    if (hereDang > 80) desiredX = 58;
    else if (nearbyShots >= (cell ? 5 : 6)) desiredX = 70;
    else if (boss) desiredX = 86;
    if (aimX != null && aimX < G.px + 130 && !boss && !closeBody) {
      desiredX = clamp(aimX - 78, 46, 150);
    }
    if (closeBody) desiredX = Math.min(desiredX, 72);
    if (grabPick && pick) {
      desiredX = clamp(pickSx, 28, VW * 0.5);
      desiredY = pick.y;
    }
    if (boss && aimY != null && !grabPick) {
      const dodge = nearbyShots >= 3 || hereDang > 55;
      desiredY = dodge ? aimY + (G.py < aimY ? -28 : 28) : aimY;
    }

    const xMin = 28;
    const xMax = VW * 0.52;
    const yMin = 12;
    const yMax = VH - 12;
    let bestX = clamp(autoTx, xMin, xMax);
    let bestY = clamp(autoTy, yMin, yMax);
    let bestS = -1e15;

    function consider(x, y) {
      x = clamp(x, xMin, xMax);
      y = clamp(y, yMin, yMax);
      const c = caveAt(G.cam + x);
      y = clamp(y, c.top + 14, c.bot - 14);
      let s = -autoDanger(x, y, horizon) * (cell ? 7.3 : 6.1);
      s -= Math.abs(x - desiredX) * (grabPick ? 0.28 : 0.48);
      s -= Math.abs(y - desiredY) * (grabPick ? 1.12 : 0.92);
      s -= hypot(x - G.px, y - G.py) * 0.11;
      if (x < 40 || x > VW * 0.46) s -= 14;
      if (y < c.top + 22 || y > c.bot - 22) s -= 18;
      if (grabPick && pick) s -= hypot(x - pickSx, y - pick.y) * 0.58;
      if (boss && aimY != null && Math.abs(y - aimY) < 14) s += 20;
      if (aimY != null && !closeBody && Math.abs(y - aimY) < 10 && x < aimX) s += 16;
      if (s > bestS) {
        bestS = s;
        bestX = x;
        bestY = y;
      }
    }

    consider(G.px, G.py);
    consider(autoTx, autoTy);
    consider(desiredX, desiredY);
    for (let ix = 0; ix < 6; ix++) {
      const x = 40 + ix * ((xMax - 48) / 5);
      for (let iy = 0; iy < 9; iy++) {
        consider(x, 24 + iy * ((VH - 48) / 8));
      }
    }
    if (aimY != null) {
      consider(desiredX, aimY);
      consider(G.px, aimY);
      consider(72, aimY);
      consider(desiredX, aimY - 24);
      consider(desiredX, aimY + 24);
    }
    if (grabPick && pick) consider(pickSx, pick.y);
    consider(G.px, G.py - 48);
    consider(G.px, G.py + 48);
    consider(G.px - 40, G.py);
    consider(G.px + 40, G.py);
    consider(G.px - 24, G.py - 32);
    consider(G.px - 24, G.py + 32);

    const switchGap = hereDang > 48 ? 8 : 22;
    if (bestS > autoStickS + switchGap || hereDang > 55 || hypot(autoTx - G.px, autoTy - G.py) < 4) {
      autoTx = bestX;
      autoTy = bestY;
      autoStickS = bestS;
    }

    G.fireHold = true;
  }

  function updatePlayer(dt) {
    const spd = moveSpd();
    if (autoOn && G.mode === 'play') {
      const dx = autoTx - G.px;
      const dy = autoTy - G.py;
      const d = hypot(dx, dy);
      const boost = autoSpeed >= 4 ? 1.22 : autoSpeed >= 3 ? 1.06 : autoSpeed <= 1 ? 0.86 : 0.96;
      if (d > 1.2) {
        const step = Math.min(d, spd * dt * boost);
        G.px += dx / d * step;
        G.py += dy / d * step;
      }
    } else if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const tx = clamp(pointer.x, 28, VW * 0.52);
      const ty = pointer.y;
      G.px += (tx - G.px) * Math.min(1, dt * 11);
      G.py += (ty - G.py) * Math.min(1, dt * 11);
    } else {
      let dx = 0;
      let dy = 0;
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) dy -= 1;
      if (keys.d) dy += 1;
      if (dx && dy) {
        dx *= 0.707;
        dy *= 0.707;
      }
      G.px += dx * spd * dt;
      G.py += dy * spd * dt;
    }
    const cave = caveAt(pwx());
    G.px = clamp(G.px, 28, VW * 0.52);
    const top = cave.top + 10;
    const bot = cave.bot - 10;
    if (G.py < top || G.py > bot) {
      if (G.invuln > 0) {
        G.py = clamp(G.py, top + 2, bot - 2);
      } else {
        killPlayer();
        return;
      }
    }
    G.py = clamp(G.py, 8, VH - 8);
    G.engine += dt;
    updateTrail();
    updateOptions();
  }

  function killPlayer() {
    if (G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.fireHold = false;
    breakCombo();
    explode(G.px, G.py, MAG, 28);
    emit(16, {
      x: G.px, y: G.py, j: 8,
      vx0: -260, vx1: 160, vy0: -200, vy1: 180,
      r0: 2, r1: 6, life: 0.5, rgb: MAG, g: 140
    });
    stripPowers();
    G.eShots.length = 0;
    audio.death();
    hitStop(0.075);
    kick(8);
    screenFlash(MAG, 0.55);
    syncHud();
    syncPips();
  }

  function respawn() {
    const cave = caveAt(pwx());
    G.px = 88;
    G.py = (cave.top + cave.bot) * 0.5;
    G.invuln = 1.5;
    G.deadT = 0;
    G.trail.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    autoTx = G.px;
    autoTy = G.py;
    autoStickS = -1e9;
    toast('重生', true, false);
    syncHud();
  }

  function hurtEnt(e, dmg, sxw, syw) {
    if (!e.alive) return false;
    if (e.type === 'organ') return false;
    if (e.type === 'sbody' || e.type === 'shead') return hurtSerp(e, dmg, sxw, syw);
    e.hp -= dmg;
    e.flash = 0.08;
    audio.hit(G.combo);
    emit(5, {
      x: sxw, y: syw, j: 4,
      vx0: -80, vx1: 140, vy0: -90, vy1: 70,
      r0: 1.2, r1: 2.8, life: 0.22, rgb: CYN, g: 40
    });
    if (e.hp > 0) {
      bumpCombo();
      hitStop(0.032);
      kick(1.6);
      return false;
    }
    e.alive = false;
    const kind = e.lead ? 'lead' : e.type;
    const rgb = e.lead ? GOLD : (e.type === 'eye' || e.type === 'cyst' ? MAG : TEAL);
    explode(sxw, syw, rgb, e.type === 'cyst' ? 22 : 16);
    hitStop(e.type === 'eye' || e.type === 'cyst' ? 0.055 : 0.038);
    kick(e.type === 'cyst' ? 4 : 2.6);
    award(kind, e.wx, e.y);
    if (e.lead || (e.type === 'cyst' && hash2(e.id * 13) > 0.55)) {
      spawnOrgan(e.wx, e.y, organKind(e.id));
    }
    if (e.type === 'spore') {
      for (let k = -1; k <= 1; k += 2) {
        pushEnt({
          type: 'mote',
          wx: e.wx, y: e.y + k * 8,
          hw: 6, hh: 6, hp: 1,
          vx: -70, vy: k * 50, phase: 0
        });
      }
    }
    return true;
  }

  function hurtSerp(e, dmg, sxw, syw) {
    const head = e.type === 'shead' ? e : findHead();
    if (!head || !head.alive) return false;
    const actual = e.type === 'shead' ? dmg : dmg * 0.38;
    head.hp -= actual;
    e.flash = 0.09;
    head.flash = 0.06;
    audio.hit(G.combo + 2);
    emit(7, {
      x: sxw, y: syw, j: 5,
      vx0: -100, vx1: 160, vy0: -100, vy1: 80,
      r0: 1.4, r1: 3.4, life: 0.26, rgb: e.type === 'shead' ? GOLD : MAG, g: 50
    });
    bumpCombo();
    addScore(Math.round(30 * G.mult * (e.type === 'shead' ? 1 : 0.4)));
    hitStop(e.type === 'shead' ? 0.05 : 0.032);
    kick(e.type === 'shead' ? 3.4 : 2);
    if (head.hp <= 0) {
      killSerpent(head);
      return true;
    }
    if (!head.angry && head.hp < head.max * 0.45) {
      head.angry = true;
      toast('巨蛇狂暴', true, false);
      screenFlash(MAG, 0.3);
    }
    syncHud();
    return false;
  }

  function killSerpent(head) {
    head.alive = false;
    head.hp = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if ((e.type === 'sbody' || e.type === 'shead') && e.alive) {
        e.alive = false;
        explode(scrX(e.wx), e.y, i % 2 ? MAG : GOLD, 20);
      }
    }
    G.eShots.length = 0;
    explode(scrX(head.wx), head.y, GOLD, 36);
    popSpark(scrX(head.wx), head.y, GOLD, 40);
    audio.boom();
    hitStop(0.085);
    kick(9);
    screenFlash(GOLD, 0.6);
    award('serp', head.wx, head.y);
    addScore(1800 * G.mult);
    addScore(8000);
    floatText(VW * 0.5, VH * 0.4, '巨蛇尽灭', GOLD, true);
    G.winT = 1.65;
    G.cleared = 3;
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    audio.win();
    showOverlay('win', '巨蛇尽灭', isCell()
      ? '细胞腔被你打穿。神经束还在耳膜里震。'
      : '三腔走穿，巨蛇爆成光。血壁还在跳。');
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '被活体吞了', '三命耗尽。洞窟还在收缩。R 再穿一次。');
    syncHud();
  }

  function updateSerpent(dt) {
    const head = findHead();
    if (!head) return;
    head.phase += dt * (head.angry ? 1.55 : 1.15);
    const cave = caveAt(head.wx);
    const mid = (cave.top + cave.bot) * 0.5;
    const amp = (cave.bot - cave.top) * 0.26;
    let ty = mid + Math.sin(head.phase * 1.55) * amp + Math.sin(head.phase * 0.62) * 16;
    ty = lerp(ty, G.py, head.angry ? 0.12 : 0.07);
    head.y = clamp(ty, cave.top + 26, cave.bot - 26);
    const want = G.cam + VW * (head.angry ? 0.7 : 0.74);
    head.wx += (want - head.wx) * Math.min(1, dt * 1.6);
    if (head.wx > G.cam + VW * 0.88) head.wx -= 40 * dt;
    G.serpHist.unshift({ wx: head.wx, y: head.y });
    if (G.serpHist.length > 90) G.serpHist.length = 90;

    head.cd -= dt;
    if (head.cd <= 0 && G.mode === 'play' && G.deadT <= 0) {
      const rage = head.angry;
      head.cd = rage ? (isCell() ? 0.38 : 0.48) : (isCell() ? 0.55 : 0.7);
      const ang = Math.atan2(G.py - head.y, pwx() - head.wx);
      const n = rage ? 5 : 3;
      const sp = isCell() ? 190 : 160;
      for (let k = 0; k < n; k++) {
        const a = ang + (k - (n - 1) * 0.5) * (rage ? 0.26 : 0.2);
        enemyShot(head.wx - 16, head.y, Math.cos(a) * sp, Math.sin(a) * sp, rage ? 4.2 : 3.6);
      }
      if (rage && hash2((head.phase * 10) | 0) > 0.45) {
        for (let k = 0; k < 6; k++) {
          const a = Math.PI + k * 0.22 - 0.55;
          enemyShot(head.wx - 10, head.y, Math.cos(a) * (sp * 0.72), Math.sin(a) * (sp * 0.72), 3.2);
        }
      }
    }

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.type !== 'sbody' || !e.alive) continue;
      const h = G.serpHist[(e.idx + 1) * 5];
      if (h) {
        e.wx = h.wx;
        e.y = h.y;
      }
      e.pulse += dt * 4;
      const c = caveAt(e.wx);
      e.y = clamp(e.y, c.top + 14, c.bot - 14);
    }
  }

  function updateEnts(dt) {
    const cell = isCell();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.flash > 0) e.flash -= dt;
      if (scrX(e.wx) < -80 && e.type !== 'sbody' && e.type !== 'shead') {
        e.alive = false;
        continue;
      }

      if (e.type === 'cell') {
        e.wx += e.vx * dt;
        e.y += Math.sin(G.t * 3.2 + e.phase) * 46 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 14, cave.bot - 14);
        e.cd = (e.cd || 0) - dt;
        if (e.lead && e.cd <= 0 && G.mode === 'play') {
          e.cd = cell ? 1.05 : 1.4;
          const ang = Math.atan2(G.py - e.y, pwx() - e.wx);
          enemyShot(e.wx - 8, e.y, Math.cos(ang) * (cell ? 170 : 140), Math.sin(ang) * (cell ? 170 : 140), 3.2);
        }
      } else if (e.type === 'spore') {
        e.wx += e.vx * dt;
        e.phase += dt * 2.2;
        e.y += Math.sin(e.phase) * 28 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 18, cave.bot - 18);
      } else if (e.type === 'mote') {
        e.wx += e.vx * dt;
        e.y += e.vy * dt;
        e.phase += dt * 6;
      } else if (e.type === 'tent') {
        e.phase += dt * (cell ? 1.5 : 1.2);
        const u = (Math.sin(e.phase) + 1) * 0.5;
        e.len = 10 + u * e.maxLen;
        const cave = caveAt(e.wx);
        e.y = e.ceil ? cave.top + 4 : cave.bot - 4;
        e.hh = e.len * 0.5;
      } else if (e.type === 'eye') {
        const cave = caveAt(e.wx);
        e.y = e.ceil ? cave.top + 16 : cave.bot - 16;
        e.open = 0.5 + 0.5 * Math.sin(G.t * 2.4 + e.wx * 0.01);
        e.cd -= dt;
        if (e.cd <= 0 && e.open > 0.55 && G.mode === 'play' && G.deadT <= 0) {
          e.cd = cell ? 0.85 : 1.15;
          const ang = Math.atan2(G.py - e.y, pwx() - e.wx);
          const n = cell ? 3 : 2;
          for (let k = 0; k < n; k++) {
            const a = ang + (k - (n - 1) * 0.5) * 0.18;
            enemyShot(e.wx, e.y + (e.ceil ? 8 : -8), Math.cos(a) * (cell ? 165 : 140), Math.sin(a) * (cell ? 165 : 140), 3.4);
          }
        }
      } else if (e.type === 'cyst') {
        const cave = caveAt(e.wx);
        e.y = e.ceil ? cave.top + 18 : cave.bot - 18;
        e.pulse += dt * 3;
      } else if (e.type === 'organ') {
        e.spin += dt * 5;
        e.y += Math.sin(G.t * 3 + e.spin) * 14 * dt;
        e.wx -= 16 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
      }

      if (G.mode === 'play' && G.deadT <= 0 && e.alive && e.type !== 'organ') {
        const phw = 7.2;
        const phh = 4.6;
        let hw = e.hw;
        let hh = e.hh;
        let ey = e.y;
        if (e.type === 'tent') {
          hw = 6;
          hh = e.len * 0.5;
          ey = e.ceil ? e.y + hh : e.y - hh;
        }
        if (e.type === 'shead') { hw = 18; hh = 14; }
        if (e.type === 'sbody') { hw = e.hw * 0.85; hh = e.hh * 0.85; }
        if (aabb(pwx(), G.py, phw, phh, e.wx, ey, hw, hh)) {
          if (G.invuln > 0) {
            /* flash through */
          } else {
            killPlayer();
          }
        }
      }
      if (G.mode === 'play' && G.deadT <= 0 && e.alive && e.type === 'organ') {
        if (aabb(pwx(), G.py, 12, 10, e.wx, e.y, e.hw, e.hh)) collectOrgan(e);
      }
    }
    if (G.boss) updateSerpent(dt);
  }

  function shotHitbox(s) {
    if (s.type === 'rip') {
      const u = 1 - s.life / 0.52;
      const r = s.r + s.grow * u;
      return { hw: r * 0.7, hh: r * 0.55 };
    }
    return { hw: s.hw, hh: s.hh };
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      if (s.type === 'mis' && !s.crawl) {
        s.vy += (s.ceil ? -520 : 520) * dt;
        const cave = caveAt(s.wx);
        if (!s.ceil && s.y >= cave.bot - 8) {
          s.y = cave.bot - 7;
          s.vy = 0;
          s.vx = 360;
          s.crawl = true;
        } else if (s.ceil && s.y <= cave.top + 8) {
          s.y = cave.top + 7;
          s.vy = 0;
          s.vx = 360;
          s.crawl = true;
        }
      }
      if (s.type === 'mis' && s.crawl) {
        const cave = caveAt(s.wx);
        s.y = s.ceil ? cave.top + 7 : cave.bot - 7;
      }
      const sxw = scrX(s.wx);
      if (s.life <= 0 || sxw > VW + 60 || sxw < -40 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      const hb = shotHitbox(s);
      let consumed = false;
      for (let j = 0; j < G.ents.length; j++) {
        const e = G.ents[j];
        if (!e.alive || e.type === 'organ') continue;
        if (s.hit && s.hit[e.id]) continue;
        let ey = e.y;
        let eh = e.hh;
        let ew = e.hw;
        if (e.type === 'tent') {
          eh = e.len * 0.5;
          ey = e.ceil ? e.y + eh : e.y - eh;
          ew = 6;
        }
        if (aabb(s.wx, s.y, hb.hw, hb.hh, e.wx, ey, ew, eh)) {
          if (s.hit) s.hit[e.id] = true;
          const dead = hurtEnt(e, s.dmg || 1, scrX(e.wx), e.y);
          if (!s.laser && s.type !== 'rip') consumed = true;
          if (s.type === 'rip' && dead) consumed = true;
          if (s.type === 'rip' && !dead) consumed = true;
          if (consumed) break;
        }
      }
      if (consumed) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const sxw = scrX(s.wx);
      if (s.life <= 0 || sxw < -30 || sxw > VW + 40 || s.y < -20 || s.y > VH + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (aabb(pwx(), G.py, 7, 4.4, s.wx, s.y, s.r, s.r)) {
          G.eShots.splice(i, 1);
          killPlayer();
          break;
        }
      }
    }
  }

  function updateFx(dt) {
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    G.beat = 0.5 + 0.5 * Math.sin(G.t * 2.35);
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
    G.cam += 70 * dt;
    G.t += dt;
    G.px = 108 + Math.sin(G.t * 0.7) * 16;
    G.py = VH * 0.5 + Math.sin(G.t * 1.05) * 34;
    const cave = caveAt(pwx());
    G.py = clamp(G.py, cave.top + 20, cave.bot - 20);
    updateTrail();
    if (G.options.length < 2) {
      G.options.push({ x: G.px - 24, y: G.py, t: 0 });
    }
    updateOptions();
    G.laser = true;
    if (G.fireCd <= 0) {
      G.fireCd = 0.16;
      const srcs = sources();
      for (let i = 0; i < srcs.length; i++) {
        pushShot({
          type: 'laser', wx: G.cam + srcs[i].x, y: srcs[i].y, vx: 760, vy: 0,
          hw: 38, hh: 3, life: 0.22, hit: {}, laser: true, dmg: 1
        });
      }
    }
    trySpawn();
    updateEnts(dt);
    updateShots(dt);
    updateFx(dt);
  }

  function update(dt) {
    tickAutoFlow(dt);
    if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
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
      G.cam += 22 * dt;
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
    const ns = stageAt(G.cam + 80);
    if (G.stage < ns && !G.boss) {
      G.stage = ns;
      addScore(1500);
      toast('第 ' + G.stage + ' 腔 · ' + STAGE_NAME[G.stage - 1], false, true);
      audio.check();
      kick(3);
      screenFlash(CYN, 0.28);
      syncHud();
    }
    if (autoOn) autoThink();
    updatePlayer(dt);
    if (G.fireHold) fire();
    trySpawn();
    updateEnts(dt);
    updateShots(dt);
    updateFx(dt);
  }

  function drawMotes() {
    const c = ctx;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = ((m.wx - G.cam * m.p) % (VW + 80) + VW + 80) % (VW + 80) - 20;
      const pulse = 0.35 + 0.35 * Math.sin(G.t * 2 + i);
      c.fillStyle = rgba(m.rgb, pulse);
      c.beginPath();
      c.arc(sx(x), sy(m.y), m.s * scale, 0, TAU);
      c.fill();
    }
  }

  function drawCave() {
    const c = ctx;
    const step = 8;
    const x0 = G.cam - 16;
    const x1 = G.cam + VW + 16;
    const topPts = [];
    const botPts = [];
    for (let wx = x0; wx <= x1; wx += step) {
      const cv = caveAt(wx);
      topPts.push({ x: scrX(wx), y: cv.top });
      botPts.push({ x: scrX(wx), y: cv.bot });
    }
    const beatA = 0.55 + G.beat * 0.45;
    const st = stageAt(G.cam + VW * 0.4);

    c.beginPath();
    c.moveTo(sx(topPts[0].x), sy(0));
    for (let i = 0; i < topPts.length; i++) c.lineTo(sx(topPts[i].x), sy(topPts[i].y));
    c.lineTo(sx(topPts[topPts.length - 1].x), sy(0));
    c.closePath();
    const gt = c.createLinearGradient(sx(0), sy(0), sx(0), sy(70));
    gt.addColorStop(0, st === 2 ? '#3a1020' : '#1a0c14');
    gt.addColorStop(1, rgba(FLESH, 0.92));
    c.fillStyle = gt;
    c.fill();

    c.beginPath();
    c.moveTo(sx(botPts[0].x), sy(VH));
    for (let i = 0; i < botPts.length; i++) c.lineTo(sx(botPts[i].x), sy(botPts[i].y));
    c.lineTo(sx(botPts[botPts.length - 1].x), sy(VH));
    c.closePath();
    const gb = c.createLinearGradient(sx(0), sy(VH), sx(0), sy(VH - 70));
    gb.addColorStop(0, st === 2 ? '#3a1020' : '#1a0c14');
    gb.addColorStop(1, rgba(FLESH, 0.92));
    c.fillStyle = gb;
    c.fill();

    c.strokeStyle = rgba(CYN, 0.22 + beatA * 0.2);
    c.lineWidth = Math.max(1.4, 2.2 * scale);
    c.beginPath();
    for (let i = 0; i < topPts.length; i++) {
      if (i === 0) c.moveTo(sx(topPts[i].x), sy(topPts[i].y));
      else c.lineTo(sx(topPts[i].x), sy(topPts[i].y));
    }
    c.stroke();
    c.strokeStyle = rgba(MAG, 0.28 + beatA * 0.22);
    c.beginPath();
    for (let i = 0; i < botPts.length; i++) {
      if (i === 0) c.moveTo(sx(botPts[i].x), sy(botPts[i].y));
      else c.lineTo(sx(botPts[i].x), sy(botPts[i].y));
    }
    c.stroke();

    c.strokeStyle = rgba(VEIN, 0.45);
    c.lineWidth = Math.max(1, 1.3 * scale);
    for (let i = 0; i < topPts.length; i += 5) {
      const p = topPts[i];
      const n = fbm((G.cam + p.x) * 0.01, 21);
      c.beginPath();
      c.moveTo(sx(p.x), sy(0));
      c.quadraticCurveTo(sx(p.x + 8), sy(p.y * 0.45), sx(p.x + n * 10 - 4), sy(p.y));
      c.stroke();
    }
    for (let i = 0; i < botPts.length; i += 5) {
      const p = botPts[i];
      const n = fbm((G.cam + p.x) * 0.01, 27);
      c.beginPath();
      c.moveTo(sx(p.x), sy(VH));
      c.quadraticCurveTo(sx(p.x - 6), sy(p.y + (VH - p.y) * 0.5), sx(p.x + n * 8), sy(p.y));
      c.stroke();
    }

    c.strokeStyle = rgba(PNK, 0.35 + beatA * 0.2);
    c.lineWidth = Math.max(1, scale);
    for (let i = 2; i < topPts.length; i += 3) {
      const p = topPts[i];
      const a = (hash2((G.cam + p.x) | 0) - 0.5) * 0.8;
      c.beginPath();
      c.moveTo(sx(p.x), sy(p.y));
      c.lineTo(sx(p.x + a * 6), sy(p.y + 7));
      c.stroke();
    }
    for (let i = 2; i < botPts.length; i += 3) {
      const p = botPts[i];
      const a = (hash2(((G.cam + p.x) | 0) + 9) - 0.5) * 0.8;
      c.beginPath();
      c.moveTo(sx(p.x), sy(p.y));
      c.lineTo(sx(p.x + a * 6), sy(p.y - 7));
      c.stroke();
    }

    if (st === 2) {
      const hx = VW * 0.72;
      const hy = VH * 0.5;
      const hr = 46 + G.beat * 10;
      c.fillStyle = rgba(MAG, 0.07 + G.beat * 0.05);
      c.beginPath();
      c.ellipse(sx(hx), sy(hy), hr * 1.15 * scale, hr * scale, 0, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(MAG, 0.18 + G.beat * 0.12);
      c.lineWidth = Math.max(1, 1.6 * scale);
      c.stroke();
    }
  }

  function organRgb(kind) {
    if (kind === 'speed') return CYN;
    if (kind === 'missile') return ORG;
    if (kind === 'laser') return GOLD;
    return PNK;
  }

  function drawEnts() {
    const c = ctx;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = scrX(e.wx);
      if (x < -50 || x > VW + 50) continue;
      const flash = e.flash > 0;
      if (e.type === 'cell' || e.type === 'mote') {
        const rgb = e.lead ? GOLD : (e.type === 'mote' ? TEAL : CYN);
        const r = e.type === 'mote' ? 5.5 : 8;
        c.fillStyle = rgba(flash ? WHT : rgb, 0.9);
        c.beginPath();
        c.ellipse(sx(x), sy(e.y), r * scale, r * 0.72 * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.7);
        c.beginPath();
        c.arc(sx(x + 2), sy(e.y - 1.5), 1.6 * scale, 0, TAU);
        c.fill();
        if (e.lead) {
          c.strokeStyle = rgba(GOLD, 0.8);
          c.lineWidth = Math.max(1, 1.4 * scale);
          c.beginPath();
          c.arc(sx(x), sy(e.y), 11 * scale, 0, TAU);
          c.stroke();
        }
      } else if (e.type === 'spore') {
        const r = 11 + Math.sin(e.phase) * 1.4;
        c.fillStyle = rgba(flash ? WHT : PNK, 0.85);
        c.beginPath();
        c.arc(sx(x), sy(e.y), r * scale, 0, TAU);
        c.fill();
        c.strokeStyle = rgba(MAG, 0.7);
        c.lineWidth = Math.max(1, 1.3 * scale);
        c.stroke();
        c.fillStyle = rgba(GOLD, 0.7);
        c.beginPath();
        c.arc(sx(x - 2), sy(e.y - 2), 3 * scale, 0, TAU);
        c.fill();
      } else if (e.type === 'tent') {
        const dir = e.ceil ? 1 : -1;
        const tipY = e.y + dir * e.len;
        c.strokeStyle = rgba(flash ? WHT : MAG, 0.85);
        c.lineWidth = Math.max(2, 5.5 * scale);
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(sx(x), sy(e.y));
        c.quadraticCurveTo(sx(x + Math.sin(e.phase) * 10), sy((e.y + tipY) * 0.5), sx(x), sy(tipY));
        c.stroke();
        c.fillStyle = rgba(PNK, 0.9);
        c.beginPath();
        c.arc(sx(x), sy(tipY), 5 * scale, 0, TAU);
        c.fill();
        c.lineCap = 'butt';
      } else if (e.type === 'eye') {
        const open = 0.35 + e.open * 0.65;
        c.fillStyle = rgba(flash ? WHT : FLESH, 0.95);
        c.beginPath();
        c.ellipse(sx(x), sy(e.y), 13 * scale, 11 * open * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.9);
        c.beginPath();
        c.ellipse(sx(x), sy(e.y), 7 * scale, 7 * open * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(MAG, 1);
        c.beginPath();
        c.arc(sx(x + (G.py > e.y ? 1.5 : -1.5)), sy(e.y), 3.2 * scale, 0, TAU);
        c.fill();
      } else if (e.type === 'cyst') {
        const p = 1 + Math.sin(e.pulse) * 0.08;
        c.fillStyle = rgba(flash ? WHT : FLESH, 0.92);
        c.beginPath();
        c.ellipse(sx(x), sy(e.y), 16 * p * scale, 13 * p * scale, 0, 0, TAU);
        c.fill();
        c.strokeStyle = rgba(MAG, 0.7);
        c.lineWidth = Math.max(1, 1.5 * scale);
        c.stroke();
        c.fillStyle = rgba(PNK, 0.55);
        c.beginPath();
        c.arc(sx(x - 3), sy(e.y - 2), 5 * scale, 0, TAU);
        c.fill();
      } else if (e.type === 'organ') {
        const rgb = organRgb(e.kind);
        const r = 8 + Math.sin(e.spin * 2) * 1.2;
        c.fillStyle = rgba(rgb, 0.95);
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
      } else if (e.type === 'shead' || e.type === 'sbody') {
        drawSerpPart(e, x);
      }
    }
  }

  function drawSerpPart(e, x) {
    const c = ctx;
    const flash = e.flash > 0;
    if (e.type === 'shead') {
      const ang = Math.atan2(G.py - e.y, pwx() - e.wx) * 0.15;
      c.save();
      c.translate(sx(x), sy(e.y));
      c.rotate(ang);
      c.fillStyle = rgba(flash ? WHT : MAG, 0.95);
      c.beginPath();
      c.ellipse(0, 0, 22 * scale, 16 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(FLESH, 0.9);
      c.beginPath();
      c.moveTo(-4 * scale, -10 * scale);
      c.lineTo(-24 * scale, -6 * scale);
      c.lineTo(-8 * scale, 0);
      c.lineTo(-24 * scale, 6 * scale);
      c.lineTo(-4 * scale, 10 * scale);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(GOLD, 0.95);
      c.beginPath();
      c.arc(-6 * scale, -5 * scale, 3.4 * scale, 0, TAU);
      c.arc(-6 * scale, 5 * scale, 3.4 * scale, 0, TAU);
      c.fill();
      c.fillStyle = '#031614';
      c.beginPath();
      c.arc(-5 * scale, -5 * scale, 1.4 * scale, 0, TAU);
      c.arc(-5 * scale, 5 * scale, 1.4 * scale, 0, TAU);
      c.fill();
      c.restore();
    } else {
      const p = 1 + Math.sin(e.pulse) * 0.06;
      const rgb = e.idx % 2 ? MAG : FLESH;
      c.fillStyle = rgba(flash ? WHT : rgb, 0.92);
      c.beginPath();
      c.ellipse(sx(x), sy(e.y), e.hw * p * scale, e.hh * p * scale, 0, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(CYN, 0.28);
      c.lineWidth = Math.max(1, scale);
      c.stroke();
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = scrX(s.wx);
      if (s.type === 'laser') {
        const g = c.createLinearGradient(sx(x - s.hw), sy(s.y), sx(x + s.hw), sy(s.y));
        g.addColorStop(0, rgba(CYN, 0.1));
        g.addColorStop(0.4, rgba(WHT, 0.95));
        g.addColorStop(1, rgba(GOLD, 0.7));
        c.fillStyle = g;
        c.fillRect(sx(x - s.hw), sy(s.y - s.hh), s.hw * 2 * scale, s.hh * 2 * scale);
        if (!REDUCE) {
          c.fillStyle = rgba(CYN, 0.25);
          c.fillRect(sx(x - s.hw), sy(s.y - s.hh * 2.2), s.hw * 2 * scale, s.hh * 4.4 * scale);
        }
      } else if (s.type === 'rip') {
        const u = 1 - s.life / 0.52;
        const r = s.r + s.grow * u;
        c.strokeStyle = rgba(CYN, 0.9 - u * 0.45);
        c.lineWidth = Math.max(1.2, (2.4 - u) * scale);
        c.beginPath();
        c.ellipse(sx(x), sy(s.y), r * scale, r * 0.62 * scale, 0, 0, TAU);
        c.stroke();
        c.strokeStyle = rgba(WHT, 0.55);
        c.lineWidth = Math.max(1, scale);
        c.beginPath();
        c.ellipse(sx(x), sy(s.y), r * 0.55 * scale, r * 0.34 * scale, 0, 0, TAU);
        c.stroke();
      } else if (s.type === 'mis') {
        c.fillStyle = rgba(ORG, 0.95);
        c.beginPath();
        c.ellipse(sx(x), sy(s.y), 5.5 * scale, 3.2 * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(GOLD, 0.8);
        c.fillRect(sx(x - 6), sy(s.y - 1), 4 * scale, 2 * scale);
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = scrX(s.wx);
      c.fillStyle = rgba(MAG, 0.9);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.arc(sx(x - 0.8), sy(s.y - 0.8), s.r * 0.35 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    const c = ctx;
    const blink = G.invuln > 0 && ((G.invuln * 18) | 0) % 2 === 0;
    if (blink) return;
    for (let i = 0; i < G.options.length; i++) {
      const o = G.options[i];
      const pulse = 1 + Math.sin(G.t * 8 + i) * 0.08;
      c.fillStyle = rgba(GOLD, 0.92);
      c.beginPath();
      c.arc(sx(o.x), sy(o.y), 6.2 * pulse * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(MAG, 0.85);
      c.beginPath();
      c.arc(sx(o.x), sy(o.y), 2.4 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(GOLD, 0.55);
      c.lineWidth = Math.max(1, scale);
      c.beginPath();
      c.arc(sx(o.x), sy(o.y), 8.4 * scale, 0, TAU);
      c.stroke();
    }
    const x = G.px;
    const y = G.py;
    c.fillStyle = rgba(CYN, 0.22);
    c.beginPath();
    c.ellipse(sx(x - 8), sy(y), 16 * scale, 6 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.moveTo(sx(x + 14), sy(y));
    c.lineTo(sx(x - 8), sy(y - 8));
    c.lineTo(sx(x - 4), sy(y));
    c.lineTo(sx(x - 8), sy(y + 8));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.fillRect(sx(x - 2), sy(y - 3.2), 10 * scale, 6.4 * scale);
    c.fillStyle = '#031614';
    c.fillRect(sx(x + 1), sy(y - 1.6), 6 * scale, 3.2 * scale);
    c.fillStyle = rgba(TEAL, 0.9);
    c.beginPath();
    c.moveTo(sx(x - 6), sy(y - 3));
    c.lineTo(sx(x + 2), sy(y - 1));
    c.lineTo(sx(x - 6), sy(y + 3));
    c.closePath();
    c.fill();
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle / 0.06);
      c.beginPath();
      c.arc(sx(x + 16), sy(y), 5 * scale, 0, TAU);
      c.fill();
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
    c.fillStyle = '#02110f';
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
    g.addColorStop(0, '#041c18');
    g.addColorStop(0.5, '#031614');
    g.addColorStop(1, '#0a1412');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawMotes();
    drawCave();
    drawEnts();
    drawShots();
    drawPlayer();
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
    G.serpHist.length = 0;
    G.speed = 0;
    G.misLvl = 0;
    G.laser = false;
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
    G.beat = 0;
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
    G.fireHold = !!autoOn;
    autoTx = G.px;
    autoTy = G.py;
    autoStickS = -1e9;
    autoOvWait = 0;
    hideOverlay();
    audio.start();
    toast(isCell() ? '细胞' : '血腔', false, true);
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('raid');
    G.mode = 'title';
    G.laser = true;
    autoOvWait = 0;
    showOverlay('title', '沙罗', '横向穿行活体洞窟。吃器官立刻武装。光球抄射。撞壁、撞体、中弹都掉命。最后打巨蛇。');
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
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      if (down) {
        e.preventDefault();
        if (!e.repeat) toggleAuto();
      }
      return;
    }
    if (e.target === speedEl) return;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
      keys.u = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') {
      keys.d = down && !autoOn;
      if (down) inputSrc = 'key';
    }

    if (down && (isMove || space || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space && !autoOn) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R')) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (autoOn && (isMove || space || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S')) {
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'cell' : 'raid');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space && G.mode === 'play' && !autoOn) G.fireHold = true;
        return;
      }
      if (G.mode === 'play' && !autoOn) {
        G.fireHold = true;
        fire();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (autoOn) return;
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
      if (autoOn) return;
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      if (autoOn) return;
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

  seedMotes();
  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnCell) {
    btnCell.addEventListener('click', function () {
      audio.ensure();
      startGame('cell');
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
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
    });
    speedEl.addEventListener('change', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
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
      if (!autoOn) G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
