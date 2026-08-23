'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const OPT_MAX = 4;
  const BOSS_AT = [3600, 7600, 11800];
  const BEST_KEY = 'playbox-gradius3-best';
  const MUTE_KEY = 'playbox-gradius3-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 点选 · R 重开 · M 静音';
  const STAGE_NAME = ['沙城', '泡域', '折廊'];
  const BOSS_NAME = ['沙核', '泡核', '折核'];
  const LEAD = '横版巡三。吃胶囊推进武装槽，Shift 点选。折射是并排双线可穿群，索导会追敌。分身绕舰旋飞。打穿三关后轰折核。别当成巡二、秘武或沙罗——这是沙城、泡域、折廊，不是炎日火鸟，不是火山摩艾，不是血腔巨蛇。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [26, 216, 255];
  const TEAL = [60, 240, 212];
  const GOLD = [255, 214, 90];
  const SUN = [232, 168, 64];
  const ICE = [154, 244, 255];
  const WHT = [232, 248, 255];
  const PNK = [255, 154, 212];
  const STN = [140, 120, 88];
  const RED = [255, 72, 88];
  const DEEP = [12, 24, 32];
  const VIO = [180, 110, 255];
  const SAND = [212, 164, 88];

  const SCORE = {
    fan: 50, worm: 90, bubble: 70, blob: 80,
    gun: 120, gate: 60, dust: 0, core: 2500
  };

  const SLOTS = [
    { id: 'speed', name: '速', full: '加速' },
    { id: 'missile', name: '索', full: '索导' },
    { id: 'double', name: '双', full: '尾炮' },
    { id: 'laser', name: '折', full: '折射' },
    { id: 'option', name: '分', full: '旋分' },
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
  const wpnEl = document.getElementById('wpn-label');
  const misEl = document.getElementById('mis-label');
  const optEl = document.getElementById('opt-label');
  const shdEl = document.getElementById('shd-label');
  const hpWrap = document.getElementById('hp-wrap');
  const hpBar = document.getElementById('hp-bar');
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
  const pointer = { down: false, hover: false, x: 96, y: VH * 0.5, id: null };
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
    px: 96,
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
    shieldFlash: 0,
    orbit: 0
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
  function isCore() {
    return G.kind === 'core';
  }
  function pwx() {
    return G.cam + G.px;
  }
  function scrX(wx) {
    return wx - G.cam;
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
  function duneHill(wx) {
    return (Math.sin(wx * 0.0084) * 0.55 + Math.sin(wx * 0.019 + 1.7) * 0.45) * 22;
  }
  function foldTooth(wx) {
    const p = 210;
    const m = ((wx % p) + p) % p;
    const pulse = 0.42 + 0.58 * Math.sin(G.t * 1.85 + wx * 0.012);
    if (m > 28 && m < 98) {
      const u = (m - 28) / 70;
      const tri = u < 0.5 ? u * 2 : (1 - u) * 2;
      return tri * tri * 52 * pulse;
    }
    return 0;
  }
  function bubbleRipple(wx) {
    return Math.sin(wx * 0.011 + G.t * 0.6) * 10 + Math.sin(wx * 0.027) * 8;
  }
  function caveAt(wx) {
    const st = stageAt(wx);
    const n1 = fbm(wx * 0.0017, 5);
    const n2 = fbm(wx * 0.0036, 19);
    let top = 10;
    let bot = VH - 10;
    if (st === 1) {
      top = 12 + n1 * 14 + Math.max(0, -duneHill(wx));
      bot = VH - 14 - n2 * 16 - Math.max(0, duneHill(wx + 40));
    } else if (st === 2) {
      top = 18 + n1 * 20 + bubbleRipple(wx);
      bot = VH - 18 - n2 * 22 - bubbleRipple(wx + 80);
    } else {
      top = 16 + n1 * 22 + foldTooth(wx);
      bot = VH - 16 - n2 * 24 - foldTooth(wx + 105);
    }
    if (wx < 480) {
      const t = wx / 480;
      top = lerp(10, top, t);
      bot = lerp(VH - 10, bot, t);
    }
    if (G.boss) {
      top = Math.min(top, 36);
      bot = Math.max(bot, VH - 36);
    }
    if (top > bot - 86) {
      const mid = (top + bot) * 0.5;
      top = mid - 43;
      bot = mid + 43;
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
    shoot(fold) {
      this.ensure();
      if (fold) {
        this.beep(280, 0.08, 'sawtooth', 0.034, 720);
        this.beep(560, 0.1, 'square', 0.028, 220);
      } else {
        this.beep(980, 0.05, 'square', 0.03, 1760);
      }
    },
    missile() {
      this.ensure();
      this.beep(260, 0.11, 'sawtooth', 0.04, 520);
      this.noise(0.06, 0.03, 500);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.035);
      this.noise(0.045, 0.036, 1100);
      this.beep(540 * lift, 0.08, 'square', 0.042, 860 * lift);
    },
    cap() {
      this.ensure();
      this.beep(680, 0.07, 'square', 0.04, 1020);
      this.beep(1020, 0.1, 'triangle', 0.035, 1360);
    },
    speed() {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.042, 784);
      this.beep(784, 0.12, 'triangle', 0.036, 1175);
    },
    double() {
      this.ensure();
      this.beep(330, 0.06, 'square', 0.038, 220);
      this.beep(784, 0.1, 'square', 0.032, 1046);
    },
    laserOn() {
      this.ensure();
      this.beep(160, 0.1, 'sawtooth', 0.04, 640);
      this.beep(640, 0.16, 'square', 0.038, 160);
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
    pop() {
      this.ensure();
      this.beep(880, 0.06, 'sine', 0.036, 220);
      this.noise(0.05, 0.028, 1400);
    },
    lock() {
      this.ensure();
      this.beep(740, 0.05, 'triangle', 0.028, 1480);
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

  function findCore() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'core' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '巡三';
      else if (G.boss) stageLabel.textContent = BOSS_NAME[G.cleared] || '核心';
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + (STAGE_NAME[G.stage - 1] || '');
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '巡核' : '巡三';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isCore());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (wpnEl) {
      wpnEl.hidden = !(G.mode === 'play' && G.laser);
      wpnEl.textContent = '折';
    }
    if (misEl) {
      misEl.hidden = !(G.mode === 'play' && G.missile);
      misEl.textContent = '索';
    }
    if (optEl) {
      optEl.hidden = !(G.mode === 'play' && G.options.length > 0);
      optEl.textContent = '旋' + (G.options.length > 1 ? G.options.length : '');
    }
    if (shdEl) {
      shdEl.hidden = !(G.mode === 'play' && G.shield > 0);
      shdEl.textContent = '盾' + G.shield;
    }
    const b = findCore();
    if (hpWrap) {
      const show = !!(G.boss && b && b.alive && G.mode === 'play');
      hpWrap.hidden = !show;
      if (show && hpBar) {
        const p = clamp(b.hp / b.max, 0, 1);
        hpBar.style.transform = 'scaleX(' + p + ')';
      }
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
    else if (G.mode === 'lose') setHint('R 重开 · 折射穿群，索导追敌', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 折核尽破', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 护盾优先挡弹', 'warn');
    else if (G.bar > 0) {
      const s = SLOTS[G.bar - 1];
      setHint('Shift 点选「' + (s ? s.full : '') + '」', 'hot');
    } else if (G.laser) setHint('折射双线穿群 · 旋分绕飞抄射', '');
    else setHint('吃胶囊推进武装槽 · Shift 点选 · 分身绕舰旋飞', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GRD3';
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
      floatText(G.px + 20, G.py - 28, G.mult + ' 链', GOLD, true);
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

  function gatePlate(e) {
    return Math.max(4, e.hh * (1 - e.open));
  }

  function hitGate(e, px, py, hw, hh) {
    const plate = gatePlate(e);
    if (plate < 5 && e.open > 0.72) return false;
    const top = aabb(px, py, hw, hh, e.wx, e.y - e.hh + plate * 0.5, e.hw, plate * 0.5);
    const bot = aabb(px, py, hw, hh, e.wx, e.y + e.hh - plate * 0.5, e.hw, plate * 0.5);
    return top || bot;
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
    return (isCore() ? 168 : 150) + G.speed * 34;
  }

  function scrollSpd() {
    if (G.boss) {
      const b = findCore();
      if (b && b.alive) {
        const x = scrX(b.wx);
        if (x < VW * 0.56) return isCore() ? 44 : 30;
        if (x < VW * 0.72) return 10;
        return 0;
      }
    }
    const base = isCore() ? 142 : 106;
    const foldBoost = G.stage === 3 ? 16 : 0;
    return base + (G.stage - 1) * 8 + foldBoost + Math.min(18, G.combo * 0.55);
  }

  function spawnFan(wx, y, n, redI, dive) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 24, cave.bot - 24);
    const dense = isCore();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'fan',
        wx: wx + i * 22,
        y: y + (i - (n - 1) * 0.5) * (dive ? 6 : 11),
        hw: 10, hh: 6,
        hp: 1,
        vx: -(dense ? 94 : 74),
        phase: i * 0.5,
        path: dive ? 'dive' : 'sine',
        red: i === redI,
        cd: rand(0.5, 1.4)
      });
    }
  }

  function spawnWorm(wx, ceil) {
    const cave = caveAt(wx);
    const y = ceil ? cave.top + 8 : cave.bot - 8;
    if (occupied(wx, y, 36)) return;
    pushEnt({
      type: 'worm',
      wx: wx,
      y: y,
      hw: 11, hh: 18,
      hp: isCore() ? 4 : 3,
      max: isCore() ? 4 : 3,
      ceil: !!ceil,
      stretch: 0,
      phase: rand(0, TAU),
      cd: rand(0.4, 1.1)
    });
  }

  function spawnBubble(wx, y, r) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 28, cave.bot - 28);
    const rad = r || rand(14, 24);
    pushEnt({
      type: 'bubble',
      wx: wx,
      y: y,
      hw: rad * 0.72, hh: rad * 0.78,
      hp: rad > 20 ? 3 : 2,
      max: rad > 20 ? 3 : 2,
      r: rad,
      vx: -(isCore() ? 48 : 36),
      vy: rand(-28, 28),
      phase: rand(0, TAU),
      spin: 0
    });
  }

  function spawnBlob(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 28, cave.bot - 28);
    pushEnt({
      type: 'blob',
      wx: wx,
      y: y,
      hw: 14, hh: 12,
      hp: isCore() ? 4 : 3,
      vx: -(isCore() ? 68 : 52),
      phase: rand(0, TAU),
      cd: rand(0.5, 1.3),
      wob: 0
    });
  }

  function spawnGun(wx, ceil) {
    const cave = caveAt(wx);
    const y = ceil ? cave.top + 16 : cave.bot - 16;
    if (occupied(wx, y, 32)) return;
    pushEnt({
      type: 'gun',
      wx: wx,
      y: y,
      hw: 13, hh: 11,
      hp: isCore() ? 5 : 4,
      ceil: !!ceil,
      cd: rand(0.5, 1.3),
      sphinx: stageAt(wx) === 1
    });
  }

  function spawnGate(wx) {
    const cave = caveAt(wx);
    const mid = (cave.top + cave.bot) * 0.5;
    if (occupied(wx, mid, 40)) return;
    pushEnt({
      type: 'gate',
      wx: wx,
      y: mid,
      hw: 8, hh: (cave.bot - cave.top) * 0.42,
      hp: isCore() ? 6 : 5,
      max: isCore() ? 6 : 5,
      open: 0,
      phase: rand(0, TAU)
    });
  }

  function spawnDust(wx) {
    const cave = caveAt(wx);
    pushEnt({
      type: 'dust',
      wx: wx,
      y: (cave.top + cave.bot) * 0.5,
      hw: 9, hh: (cave.bot - cave.top) * 0.38,
      hp: 999,
      scenery: true,
      pulse: 0,
      life: 2.2,
      damaging: true
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
    const nearBoss = BOSS_AT[G.cleared];
    if (nearBoss != null && wx > nearBoss - 180) return;
    const st = stageAt(wx);
    const slice = (wx / 58) | 0;
    const h = hash2(slice * 19 + (isCore() ? 7 : 3) + G.stage * 11);
    const cave = caveAt(wx);
    const mid = (cave.top + cave.bot) * 0.5;
    const dens = isCore() ? 0.72 : 1;
    const fanEvery = isCore() ? 3 : 4;

    if (st === 1) {
      if (slice % fanEvery === 0 && h > 0.14 * dens) {
        const y = lerp(cave.top + 40, cave.bot - 40, hash2(slice + 44));
        spawnFan(wx, y, (isCore() ? 6 : 5), h > 0.5 ? 0 : -1, h > 0.78);
      }
      if (slice % 5 === 2 && h > 0.22 * dens) spawnWorm(wx, h > 0.55);
      if (slice % 9 === 4) spawnDust(wx);
      if (slice % 8 === 1 && h > 0.38) spawnGun(wx, h > 0.62);
      if (isCore() && slice % 7 === 5) spawnWorm(wx + 30, h <= 0.55);
    } else if (st === 2) {
      if (slice % fanEvery === 1 && h > 0.18 * dens) {
        spawnFan(wx, lerp(cave.top + 42, cave.bot - 42, h), isCore() ? 5 : 4, 0, false);
      }
      if (slice % 4 === 0 && h > 0.16) spawnBubble(wx, mid + (h - 0.5) * 90, 14 + h * 12);
      if (slice % 5 === 2 && h > 0.28) spawnBlob(wx, mid + (h - 0.5) * 70);
      if (isCore() && slice % 6 === 4) spawnBubble(wx + 36, mid - 40, 16);
      if (slice % 8 === 3 && h > 0.34) spawnGun(wx, h > 0.5);
    } else {
      if (slice % fanEvery === 0 && h > 0.12 * dens) {
        spawnFan(wx, lerp(cave.top + 40, cave.bot - 40, hash2(slice + 3)), (isCore() ? 7 : 5), h > 0.46 ? 0 : -1, true);
      }
      if (slice % 6 === 2) spawnGun(wx, false);
      if (slice % 6 === 5) spawnGun(wx, true);
      if (slice % 5 === 1 && h > 0.28) spawnGate(wx);
      if (slice % 8 === 4 && h > 0.4) spawnBlob(wx, mid);
    }
    if (slice % 7 === 3 && h > 0.3) {
      spawnCap(wx, lerp(cave.top + 44, cave.bot - 44, hash2(slice + 9)));
    }
  }

  function spawnBoss() {
    G.boss = true;
    const st = G.stage;
    let hp = st === 1 ? 42 : st === 2 ? 58 : 82;
    if (isCore()) hp = (hp * 1.28) | 0;
    const cave = caveAt(G.cam + VW * 0.72);
    const kind = st === 1 ? 'sand' : st === 2 ? 'bubble' : 'fold';
    pushEnt({
      type: 'core',
      kind: kind,
      wx: G.cam + VW * 0.78,
      y: (cave.top + cave.bot) * 0.5,
      hw: kind === 'fold' ? 58 : 54,
      hh: kind === 'fold' ? 36 : kind === 'bubble' ? 38 : 32,
      hp: hp,
      max: hp,
      open: 0,
      phase: 0,
      cd: 0.7,
      vy: 42,
      coreR: 12,
      spin: 0,
      bury: 0
    });
    toast(BOSS_NAME[st - 1] + ' 出现', false, true);
    audio.check();
    kick(3.4);
    screenFlash(st === 1 ? SAND : st === 2 ? VIO : GOLD, 0.32);
    syncHud();
  }

  function trySpawn() {
    if (!G.boss && G.mode === 'play') {
      const mark = BOSS_AT[G.cleared];
      if (mark != null && G.cam + VW * 0.72 >= mark) spawnBoss();
    }
    if (G.boss) return;
    const ahead = G.cam + VW + 90;
    while (G.spawnedX < ahead) {
      G.spawnedX += 58;
      spawnSlice(G.spawnedX);
    }
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 78; i++) {
      stars.push({
        wx: hash2(i * 17) * 2800,
        y: 8 + hash2(i * 91 + 3) * (VH - 16),
        s: 0.5 + hash2(i * 5 + 9) * 1.8,
        p: 0.18 + hash2(i * 13) * 0.75
      });
    }
  }

  function award(kind, x, y) {
    bumpCombo();
    const n = (SCORE[kind] || 10) * G.mult;
    addScore(n);
    const gold = kind === 'core' || kind === 'worm' || G.mult >= 3;
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
      explode(o.x, o.y, SUN, 14);
    }
    G.options.length = 0;
    syncSlots();
  }

  function spawnOption() {
    if (G.options.length >= OPT_MAX) {
      toast('旋分 MAX', false, true);
      audio.cap();
      addScore(500 * G.mult);
      return;
    }
    const ang = G.orbit + G.options.length * (TAU / 4);
    const nx = G.px + Math.cos(ang) * 28;
    const ny = G.py + Math.sin(ang) * 20;
    G.options.push({ x: nx, y: ny, t: 0 });
    toast('旋分 ×' + G.options.length, false, true);
    audio.option();
    explode(nx, ny, SUN, 18);
    popSpark(nx, ny, GOLD, 22);
    hitStop(0.05);
    kick(3.4);
    screenFlash(SUN, 0.42);
    floatText(nx, ny - 14, 'ROLL', GOLD, true);
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
      toast('索导 · 追敌', false, true);
      audio.missile();
      kick(2.4);
    } else if (id === 'double') {
      G.double = true;
      G.laser = false;
      toast('尾炮', false, true);
      audio.double();
      kick(2.4);
      screenFlash(TEAL, 0.22);
    } else if (id === 'laser') {
      G.laser = true;
      G.double = false;
      toast('折射', false, true);
      audio.laserOn();
      screenFlash(ICE, 0.42);
      hitStop(0.042);
      kick(3);
      popSpark(G.px + 24, G.py, ICE, 22);
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
    popSpark(x, e.y, SUN, 14);
    floatText(x, e.y - 10, 'UP', GOLD, true);
    emit(8, {
      x: x, y: e.y, j: 6,
      vx0: -60, vx1: 60, vy0: -80, vy1: 40,
      r0: 1.4, r1: 3, life: 0.3, rgb: SUN, g: 40
    });
    if (G.caps === 1) toast('Shift 点选武装', false, true);
    else {
      const s = SLOTS[G.bar - 1];
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
      list.push({ x: G.options[i].x + 8, y: G.options[i].y });
    }
    return list;
  }

  function pushShot(s) {
    G.shots.push(s);
    capArr(G.shots, 56);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    G.fireCd = G.laser ? 0.148 : 0.108;
    G.muzzle = 0.055;
    const srcs = sources();
    const fold = G.laser;
    for (let i = 0; i < srcs.length; i++) {
      const p = srcs[i];
      const wx = G.cam + p.x;
      if (fold) {
        pushShot({
          type: 'fold', wx: wx, y: p.y, vx: 540, vy: 0,
          hw: 14, hh: 7, life: 0.55, hit: {}, fold: true
        });
      } else if (G.double) {
        pushShot({
          type: 'shot', wx: wx, y: p.y, vx: 620, vy: 0,
          hw: 6, hh: 2.2, life: 0.9
        });
        pushShot({
          type: 'shot', wx: wx - 8, y: p.y, vx: -480, vy: 0,
          hw: 5, hh: 2.2, life: 0.7, tail: true
        });
      } else {
        pushShot({
          type: 'shot', wx: wx, y: p.y, vx: 620, vy: 0,
          hw: 6, hh: 2.2, life: 0.9
        });
      }
    }
    audio.shoot(fold);
    if (!REDUCE) {
      emit(fold ? 5 : 3, {
        x: G.px + 16, y: G.py, j: 3,
        vx0: 40, vx1: 160, vy0: -50, vy1: 50,
        r0: 1, r1: 2.4, life: 0.12, rgb: fold ? ICE : WHT, g: 0
      });
    }
    if (G.missile && G.misCd <= 0) {
      G.misCd = 0.34;
      for (let i = 0; i < srcs.length; i++) {
        const p = srcs[i];
        const dir = (i % 2 === 0) ? 1 : -1;
        pushShot({
          type: 'mis', wx: G.cam + p.x, y: p.y + dir * 4, vx: 140, vy: dir * 180,
          hw: 4, hh: 4, life: 1.7, mis: true, lock: null
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

  function coreOpen(e) {
    if (e.kind === 'sand') return e.open > 0.5 && e.bury < 0.35;
    if (e.kind === 'bubble') return e.open > 0.58;
    return e.open > 0.55;
  }

  function nearestTarget(wx, y) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || e.type === 'cap' || e.scenery) continue;
      if (e.wx < wx - 30) continue;
      const d = hypot(e.wx - wx, e.y - y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  function hurt(e, dmg, hx, hy) {
    if (!e.alive || e.scenery) return false;
    if (e.type === 'core' && !coreOpen(e)) return 'block';
    if (e.type === 'dust') return false;
    e.hp -= dmg || 1;
    e.flash = 0.08;
    if (e.type === 'bubble') {
      e.r = Math.max(8, e.r - 3.4);
      e.hw = e.r * 0.72;
      e.hh = e.r * 0.78;
    }
    if (e.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -90, vx1: 90, vy0: -80, vy1: 50,
        life: 0.16, r0: 1, r1: 2.2, rgb: WHT, g: 80
      });
      if (e.type === 'core' || e.type === 'worm' || e.type === 'gate') hitStop(0.028);
      if (e.type === 'core') bumpCombo();
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
      explode(x + 20, y - 10, e.kind === 'sand' ? SAND : e.kind === 'bubble' ? VIO : CYN, 22);
      award('core', x, y);
      addScore(1500 * G.stage);
      audio.boom();
      hitStop(0.08);
      kick(8);
      screenFlash(GOLD, 0.62);
      G.cleared += 1;
      G.boss = false;
      if (G.cleared >= 3) {
        G.winT = 1.22;
        toast('折核尽破', false, true);
      } else {
        G.stage = G.cleared + 1;
        toast('第 ' + G.stage + ' 关 · ' + STAGE_NAME[G.stage - 1], false, true);
        audio.check();
      }
      syncHud();
      return;
    }
    if (e.type === 'cap') return;
    if (e.type === 'bubble') {
      explode(x, y, VIO, 18);
      award('bubble', x, y);
      audio.pop();
      hitStop(clamp(0.032 + G.combo * 0.002, 0.032, 0.058));
      kick(2);
      floatText(x, y - 12, '破泡', PNK, true);
      if (e.max >= 3 || hash2(e.id * 13) > 0.7) spawnCap(e.wx, e.y);
      return;
    }
    const rgb = e.type === 'worm' ? SAND
      : e.type === 'blob' ? VIO
      : e.type === 'gate' ? CYN
      : e.red ? RED
      : e.type === 'gun' ? STN : MAG;
    explode(x, y, rgb, e.type === 'worm' || e.type === 'gate' ? 20 : 16);
    award(e.red ? 'fan' : e.type, x, y);
    audio.hit(G.combo);
    hitStop(clamp(0.03 + G.combo * 0.0022, 0.03, 0.062));
    kick(e.type === 'gate' || e.type === 'gun' || e.type === 'worm' ? 3.2 : 1.8);
    if (e.red || (e.type === 'fan' && hash2(e.id * 13) > 0.82) || (e.type === 'blob' && hash2(e.id) > 0.62) || (e.type === 'gun' && hash2(e.id) > 0.7) || (e.type === 'worm' && hash2(e.id) > 0.55)) {
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
    syncHud();
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
    G.px = 96;
    const cave = caveAt(pwx());
    G.py = clamp((cave.top + cave.bot) * 0.5, cave.top + 22, cave.bot - 22);
    G.invuln = 1.45;
    G.eShots.length = 0;
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
    addScore(isCore() ? 10000 : 8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    const t = isCore() ? '巡核通关' : '折核尽破';
    showOverlay('win', t, '三关打穿 · 分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function updateOptions() {
    G.orbit += STEP * (2.35 + G.options.length * 0.12);
    const n = G.options.length;
    for (let i = 0; i < n; i++) {
      const o = G.options[i];
      const ang = G.orbit + i * (TAU / Math.max(3, n));
      const r = 26 + i * 5;
      o.x = G.px + Math.cos(ang) * r;
      o.y = G.py + Math.sin(ang) * r * 0.7;
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
    G.px = clamp(G.px, 32, VW * 0.54);
    const top = cave.top + 12;
    const bot = cave.bot - 12;
    if (G.py < top || G.py > bot) {
      if (G.invuln > 0) G.py = clamp(G.py, top, bot);
      else {
        G.py = clamp(G.py, top, bot);
        killPlayer();
      }
    }
    updateOptions();
    G.engine += dt;
    if (!REDUCE && G.engine > 0.04) {
      G.engine = 0;
      emit(1, {
        x: G.px - 14, y: G.py + rand(-2, 2), j: 1,
        vx0: -90, vx1: -40, vy0: -18, vy1: 18,
        r0: 1.2, r1: 2.4, life: 0.18, rgb: G.laser ? ICE : CYN, g: 0
      });
    }
  }

  function shotHitsEnt(s, e) {
    if (!e.alive) return false;
    if (e.type === 'cap' || e.type === 'dust') return false;
    const sy0 = s.y;
    const shw = s.hw;
    const hh = s.hh;
    const cx = s.wx;
    if (e.type === 'core') {
      if (!coreOpen(e)) {
        if (aabb(cx, sy0, shw, hh, e.wx, e.y, e.hw, e.hh)) return 'block';
        return false;
      }
      if (aabb(cx, sy0, shw, hh, e.wx - 8, e.y, e.coreR + 4, e.coreR + 4)) return true;
      if (aabb(cx, sy0, shw, hh, e.wx, e.y, e.hw, e.hh)) return 'block';
      return false;
    }
    if (e.type === 'gate') {
      return hitGate(e, cx, sy0, shw, hh);
    }
    if (e.type === 'worm') {
      const cave = caveAt(e.wx);
      const bodyY = e.ceil
        ? cave.top + 8 + e.stretch * 0.5
        : cave.bot - 8 - e.stretch * 0.5;
      const hhW = 10 + e.stretch * 0.5;
      return aabb(cx, sy0, shw, hh, e.wx, bodyY, e.hw, hhW);
    }
    if (e.type === 'bubble') {
      const dx = cx - e.wx;
      const dy = sy0 - e.y;
      return dx * dx + dy * dy < (e.r + Math.max(shw, hh)) * (e.r + Math.max(shw, hh));
    }
    return aabb(cx, sy0, shw, hh, e.wx, e.y, e.hw, e.hh);
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.mis) {
        let t = s.lock;
        if (!t || !t.alive) {
          t = nearestTarget(s.wx, s.y);
          s.lock = t;
          if (t) audio.lock();
        }
        if (t && t.alive) {
          const dx = t.wx - s.wx;
          const dy = t.y - s.y;
          const d = hypot(dx, dy) || 1;
          const sp = 390;
          s.vx = lerp(s.vx, dx / d * sp, 0.085);
          s.vy = lerp(s.vy, dy / d * sp, 0.085);
        } else {
          s.vx = Math.min(440, s.vx + 260 * dt);
          s.vy *= 0.94;
        }
      }
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      if (s.life <= 0 || x > VW + 70 || x < -70 || s.y < -28 || s.y > VH + 28) {
        G.shots.splice(i, 1);
        continue;
      }
      if (!s.fold && !s.mis) {
        const cave = caveAt(s.wx);
        if (s.y < cave.top + 4 || s.y > cave.bot - 4) {
          G.shots.splice(i, 1);
          continue;
        }
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
          if (!s.fold) gone = true;
          break;
        }
        if (s.fold) {
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
        if (aabb(s.wx, s.y, s.r, s.r, pwx(), G.py, 7.4, 4.8)) {
          G.eShots.splice(i, 1);
          if (shieldAbsorb(G.px + 16, G.py)) continue;
          killPlayer();
        }
      }
    }
  }

  function aimAt(e, sp) {
    const dx = pwx() - e.wx;
    const dy = G.py - e.y;
    const d = hypot(dx, dy) || 1;
    enemyShot(e.wx - 8, e.y, dx / d * sp, dy / d * sp, 3.1);
  }

  function updateEnts(dt) {
    const dense = isCore();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.flash > 0) e.flash -= dt;
      const x = scrX(e.wx);
      if (!e.alive) {
        if (x < -90) G.ents.splice(i, 1);
        continue;
      }
      if (e.type !== 'core' && x < -80) {
        G.ents.splice(i, 1);
        continue;
      }

      if (e.type === 'fan') {
        e.wx += e.vx * dt;
        if (e.path === 'dive' && x < VW * 0.85) {
          const dy = G.py - e.y;
          e.y += clamp(dy, -70, 70) * dt * 0.9;
          e.wx += e.vx * dt * 0.12;
        } else {
          e.y += Math.sin(G.t * 3.2 + e.phase) * 44 * dt;
        }
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW * 0.82 && x > 40) {
          e.cd = dense ? rand(0.85, 1.5) : rand(1.35, 2.3);
          if (hash2(e.id + ((G.t * 8) | 0)) > (dense ? 0.42 : 0.6)) {
            aimAt(e, dense ? 188 : 156);
          }
        }
      } else if (e.type === 'worm') {
        const cave = caveAt(e.wx);
        e.phase += dt;
        const u = (Math.sin(e.phase * 1.7) + 1) * 0.5;
        e.stretch = lerp(e.stretch, 18 + u * 52, 0.08);
        e.y = e.ceil ? cave.top + 8 : cave.bot - 8;
        e.hh = 10 + e.stretch * 0.5;
        e.cd -= dt;
        if (e.cd <= 0 && x < VW * 0.8 && x > 40 && u > 0.62) {
          e.cd = dense ? 1.05 : 1.55;
          const tip = e.ceil ? e.y + e.stretch : e.y - e.stretch;
          enemyShot(e.wx, tip, -140, e.ceil ? 70 : -70, 3.2);
        }
      } else if (e.type === 'bubble') {
        e.wx += e.vx * dt;
        e.y += e.vy * dt;
        e.spin += dt * 1.4;
        e.phase += dt;
        e.y += Math.sin(G.t * 1.8 + e.phase) * 22 * dt;
        const cave = caveAt(e.wx);
        if (e.y < cave.top + e.r || e.y > cave.bot - e.r) e.vy *= -1;
        e.y = clamp(e.y, cave.top + e.r, cave.bot - e.r);
      } else if (e.type === 'blob') {
        e.wx += e.vx * dt;
        e.wob += dt;
        e.y += Math.sin(G.t * 2.4 + e.phase) * 40 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 22, cave.bot - 22);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW * 0.8 && x > 50) {
          e.cd = dense ? 1.05 : 1.5;
          for (let k = -1; k <= 1; k++) {
            enemyShot(e.wx - 6, e.y, -150, k * 80, 2.9);
          }
        }
      } else if (e.type === 'gun') {
        const cave = caveAt(e.wx);
        e.y = e.ceil ? cave.top + 16 : cave.bot - 16;
        e.cd -= dt;
        if (e.cd <= 0 && x < VW * 0.84 && x > 30) {
          e.cd = dense ? rand(0.7, 1.2) : rand(1.05, 1.7);
          aimAt(e, dense ? 210 : 170);
        }
      } else if (e.type === 'gate') {
        const cave = caveAt(e.wx);
        e.y = (cave.top + cave.bot) * 0.5;
        e.hh = (cave.bot - cave.top) * 0.42;
        e.phase += dt;
        const cycle = 2.1;
        const u = (e.phase % cycle) / cycle;
        e.open = u > 0.32 && u < 0.68 ? Math.min(1, e.open + dt * 2.6) : Math.max(0, e.open - dt * 2.2);
      } else if (e.type === 'dust') {
        e.pulse += dt;
        e.life -= dt;
        const cave = caveAt(e.wx);
        e.y = (cave.top + cave.bot) * 0.5;
        e.hh = (cave.bot - cave.top) * (0.26 + Math.sin(e.pulse * 5) * 0.08);
        if (e.life <= 0) e.alive = false;
      } else if (e.type === 'cap') {
        e.spin += dt * 3;
        e.y += e.vy * dt;
        const cave = caveAt(e.wx);
        if (e.y < cave.top + 18 || e.y > cave.bot - 18) e.vy *= -1;
        e.y = clamp(e.y, cave.top + 18, cave.bot - 18);
        if (G.mode === 'play' && G.deadT <= 0 && aabb(e.wx, e.y, e.hw, e.hh, pwx(), G.py, 12, 10)) {
          collectCap(e);
        }
      } else if (e.type === 'core') {
        const cave = caveAt(e.wx);
        const mid = (cave.top + cave.bot) * 0.5;
        e.y += e.vy * dt;
        if (e.y < cave.top + 50 || e.y > cave.bot - 50) e.vy *= -1;
        e.y = clamp(e.y, cave.top + 48, cave.bot - 48);
        const want = G.cam + VW * 0.7;
        if (e.wx > want) e.wx -= 28 * dt;
        e.phase += dt;
        e.spin += dt;
        const cycle = e.kind === 'sand' ? 2.6 : e.kind === 'bubble' ? 2.45 : 2.2;
        const u = (e.phase % cycle) / cycle;
        if (e.kind === 'sand') {
          e.bury = u < 0.28 || u > 0.82 ? Math.min(1, e.bury + dt * 1.8) : Math.max(0, e.bury - dt * 2.2);
          e.open = e.bury < 0.35 && u > 0.36 && u < 0.74 ? Math.min(1, e.open + dt * 2.2) : Math.max(0, e.open - dt * 1.6);
        } else {
          e.open = u > 0.38 && u < 0.78 ? Math.min(1, e.open + dt * 2.4) : Math.max(0, e.open - dt * 1.6);
        }
        e.cd -= dt;
        if (e.cd <= 0) {
          e.cd = dense ? 0.42 : 0.58;
          if (coreOpen(e)) {
            if (e.kind === 'sand') {
              aimAt(e, dense ? 210 : 170);
              enemyShot(e.wx - 20, e.y - 14, -150, -80, 3.6);
              enemyShot(e.wx - 20, e.y + 14, -150, 80, 3.6);
            } else if (e.kind === 'bubble') {
              for (let k = -2; k <= 2; k++) {
                enemyShot(e.wx - 16, e.y, -170, k * 48, 3.4);
              }
            } else {
              aimAt(e, dense ? 230 : 190);
              enemyShot(e.wx - 16, e.y, -140, 0, 5.2);
              if (e.hp < e.max * 0.5) {
                enemyShot(e.wx - 10, e.y - 12, -130, -90, 3);
                enemyShot(e.wx - 10, e.y + 12, -130, 90, 3);
              }
            }
          }
        }
        e.y = lerp(e.y, mid + Math.sin(G.t * 0.9) * 36, 0.02);
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && e.alive && e.type !== 'cap') {
        let hit = false;
        if (e.type === 'dust') {
          const pulse = 0.55 + Math.sin(e.pulse * 5) * 0.45;
          if (pulse > 0.7 && aabb(e.wx, e.y, e.hw * 0.7, e.hh, pwx(), G.py, 7, 5)) hit = true;
        } else if (e.type === 'core') {
          if (aabb(e.wx, e.y, e.hw * 0.78, e.hh * 0.78, pwx(), G.py, 7.2, 4.8)) hit = true;
        } else if (e.type === 'worm') {
          const cave = caveAt(e.wx);
          const bodyY = e.ceil
            ? cave.top + 8 + e.stretch * 0.5
            : cave.bot - 8 - e.stretch * 0.5;
          const hhW = 10 + e.stretch * 0.5;
          if (aabb(e.wx, bodyY, e.hw, hhW, pwx(), G.py, 7.2, 4.8)) hit = true;
        } else if (e.type === 'bubble') {
          const dx = pwx() - e.wx;
          const dy = G.py - e.y;
          if (dx * dx + dy * dy < (e.r + 6) * (e.r + 6)) hit = true;
        } else if (e.type === 'gate') {
          if (hitGate(e, pwx(), G.py, 7.2, 4.8)) hit = true;
        } else if (aabb(e.wx, e.y, e.hw, e.hh, pwx(), G.py, 7.2, 4.8)) {
          hit = true;
        }
        if (hit) killPlayer();
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += (p.g || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
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

  function update(dt) {
    G.t += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.35);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.shieldFlash > 0) G.shieldFlash -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35);
      return;
    }

    if (G.mode === 'title') {
      G.cam += 36 * dt;
      G.py = VH * 0.5 + Math.sin(G.t * 1.4) * 18;
      G.px = 110 + Math.sin(G.t * 0.7) * 10;
      G.laser = true;
      if (G.options.length < 2) {
        G.options.push({ x: G.px, y: G.py, t: 0 });
      }
      updateOptions();
      updateFx(dt);
      return;
    }

    if (G.mode !== 'play' && G.mode !== 'win') {
      updateFx(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseGame();
        else respawn();
      }
    }
    if (G.winT > 0) {
      G.winT -= dt;
      if (G.winT <= 0) winGame();
    }

    if (G.mode === 'play') {
      G.cam += scrollSpd() * dt;
      if (G.fireCd > 0) G.fireCd -= dt;
      if (G.misCd > 0) G.misCd -= dt;
      if (G.invuln > 0) G.invuln -= dt;
      if (G.fireHold) fire();
      updatePlayer(dt);
      trySpawn();
    } else {
      G.cam += 24 * dt;
    }
    updateShots(dt);
    updateEnts(dt);
    updateFx(dt);
    if (G.boss) syncHud();
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const x = ((s.wx - G.cam * s.p) % (VW + 40) + (VW + 40)) % (VW + 40) - 20;
      c.fillStyle = rgba(WHT, 0.25 + s.s * 0.25);
      c.fillRect(sx(x), sy(s.y), s.s * scale, s.s * scale);
    }
  }

  function drawSun() {
    const st = G.mode === 'title' ? 1 : G.stage;
    if (st !== 1 && !(G.mode === 'title')) return;
    const c = ctx;
    const cx = sx(VW * 0.84);
    const cy = sy(VH * 0.22);
    const r = 78 * scale;
    const g = c.createRadialGradient(cx, cy, r * 0.15, cx, cy, r * 1.6);
    g.addColorStop(0, rgba(GOLD, 0.8));
    g.addColorStop(0.35, rgba(SUN, 0.5));
    g.addColorStop(1, rgba(SUN, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, r * 1.6, 0, TAU);
    c.fill();
    c.fillStyle = rgba(SUN, 0.9);
    c.beginPath();
    c.arc(cx, cy, r * 0.4, 0, TAU);
    c.fill();
  }

  function drawCave() {
    const c = ctx;
    const st = G.mode === 'title' ? 1 : stageAt(G.cam + VW * 0.5);
    const step = 10;
    c.beginPath();
    c.moveTo(sx(0), sy(0));
    for (let x = 0; x <= VW; x += step) {
      const cave = caveAt(G.cam + x);
      c.lineTo(sx(x), sy(cave.top));
    }
    c.lineTo(sx(VW), sy(0));
    c.closePath();
    c.fillStyle = st === 2 ? '#0c1428' : st === 3 ? '#081820' : '#1a140c';
    c.fill();
    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += step) {
      const cave = caveAt(G.cam + x);
      c.lineTo(sx(x), sy(cave.bot));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    c.fill();

    c.strokeStyle = st === 1 ? rgba(SAND, 0.5) : st === 2 ? rgba(VIO, 0.5) : rgba(CYN, 0.45);
    c.lineWidth = Math.max(1.2, 1.8 * scale);
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const cave = caveAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(cave.top));
      else c.lineTo(sx(x), sy(cave.top));
    }
    c.stroke();
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const cave = caveAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(cave.bot));
      else c.lineTo(sx(x), sy(cave.bot));
    }
    c.stroke();

    if (st === 1) {
      c.fillStyle = rgba(SAND, 0.12);
      for (let x = 0; x < VW; x += 36) {
        const cave = caveAt(G.cam + x);
        c.beginPath();
        c.moveTo(sx(x), sy(cave.bot));
        c.lineTo(sx(x + 10), sy(cave.bot - 8));
        c.lineTo(sx(x + 20), sy(cave.bot));
        c.fill();
      }
    } else if (st === 2) {
      c.strokeStyle = rgba(VIO, 0.12);
      c.lineWidth = Math.max(1, scale);
      for (let x = 0; x < VW; x += 48) {
        const cave = caveAt(G.cam + x);
        c.beginPath();
        c.ellipse(sx(x + 16), sy(cave.top + 18), 10 * scale, 8 * scale, 0, 0, TAU);
        c.stroke();
      }
    } else {
      c.strokeStyle = rgba(CYN, 0.14);
      c.lineWidth = Math.max(1, scale);
      for (let x = 0; x < VW; x += 48) {
        const cave = caveAt(G.cam + x);
        c.strokeRect(sx(x), sy(cave.top), 22 * scale, 12 * scale);
        c.strokeRect(sx(x + 8), sy(cave.bot - 12), 22 * scale, 12 * scale);
      }
    }
  }

  function drawViper(px, py, sMul) {
    const c = ctx;
    const s = scale * sMul;
    c.save();
    c.translate(sx(px), sy(py));
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, 0.8);
      c.beginPath();
      c.moveTo(16 * s, -5 * s);
      c.lineTo(28 * s, -3.5 * s);
      c.lineTo(16 * s, -2 * s);
      c.fill();
      c.beginPath();
      c.moveTo(16 * s, 2 * s);
      c.lineTo(28 * s, 3.5 * s);
      c.lineTo(16 * s, 5 * s);
      c.fill();
    }
    c.fillStyle = rgba(DEEP, 0.9);
    c.beginPath();
    c.moveTo(-12 * s, -7 * s);
    c.lineTo(4 * s, -5 * s);
    c.lineTo(4 * s, 5 * s);
    c.lineTo(-12 * s, 7 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 1);
    c.beginPath();
    c.moveTo(2 * s, -2.6 * s);
    c.lineTo(17 * s, 0);
    c.lineTo(2 * s, 2.6 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.95);
    c.fillRect(-6 * s, -1.5 * s, 10 * s, 3 * s);
    c.fillStyle = rgba(SUN, 0.85);
    c.beginPath();
    c.moveTo(-14 * s, -3 * s);
    c.lineTo(-8 * s, 0);
    c.lineTo(-14 * s, 3 * s);
    c.fill();
    c.restore();
  }

  function drawOption(o) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(o.x), sy(o.y));
    c.rotate(G.t * 4.2);
    c.strokeStyle = rgba(TEAL, 0.55);
    c.lineWidth = Math.max(1, 1.2 * s);
    c.beginPath();
    c.arc(0, 0, 9 * s, 0, TAU);
    c.stroke();
    c.strokeStyle = rgba(SUN, 0.95);
    c.lineWidth = Math.max(1, 1.5 * s);
    c.beginPath();
    c.arc(0, 0, 6.4 * s, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.arc(0, 0, 3.1 * s, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(WHT, 0.75);
    c.beginPath();
    c.moveTo(-4.4 * s, 0);
    c.lineTo(4.4 * s, 0);
    c.moveTo(0, -4.4 * s);
    c.lineTo(0, 4.4 * s);
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

  function drawOrbitRing() {
    if (G.options.length <= 0 || G.deadT > 0) return;
    const c = ctx;
    c.save();
    c.strokeStyle = rgba(TEAL, 0.22);
    c.lineWidth = Math.max(1, scale);
    c.beginPath();
    c.ellipse(sx(G.px), sy(G.py), 28 * scale, 20 * scale, 0, 0, TAU);
    c.stroke();
    c.restore();
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'win' && G.mode !== 'title') return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    drawOrbitRing();
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

  function drawWorm(e, x) {
    const c = ctx;
    const s = scale;
    const cave = caveAt(e.wx);
    const baseY = e.ceil ? cave.top + 8 : cave.bot - 8;
    const dir = e.ceil ? 1 : -1;
    c.save();
    c.strokeStyle = rgba(e.flash > 0 ? WHT : SAND, 0.95);
    c.lineWidth = Math.max(2, 7 * s);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(sx(x), sy(baseY));
    const segs = 5;
    for (let i = 1; i <= segs; i++) {
      const t = i / segs;
      const wob = Math.sin(G.t * 6 + e.phase + i) * 4;
      c.lineTo(sx(x + wob), sy(baseY + dir * e.stretch * t));
    }
    c.stroke();
    const tipY = baseY + dir * e.stretch;
    c.fillStyle = rgba(e.flash > 0 ? WHT : SUN, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(tipY), 7 * s, 0, TAU);
    c.fill();
    c.fillStyle = rgba(RED, 0.85);
    c.beginPath();
    c.arc(sx(x), sy(tipY), 3 * s, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawBubble(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    const a = 0.55 + e.hp * 0.12;
    c.strokeStyle = rgba(e.flash > 0 ? WHT : VIO, a);
    c.lineWidth = Math.max(1.2, 2 * s);
    c.beginPath();
    c.ellipse(0, 0, e.r * s, e.r * 1.05 * s, e.spin * 0.2, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(VIO, 0.14);
    c.beginPath();
    c.ellipse(0, 0, e.r * 0.92 * s, e.r * 0.96 * s, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.45);
    c.beginPath();
    c.ellipse(-e.r * 0.28 * s, -e.r * 0.32 * s, e.r * 0.18 * s, e.r * 0.12 * s, 0, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawBlob(e, x) {
    const c = ctx;
    const s = scale;
    const w = 1 + Math.sin((e.wob || G.t) * 5) * 0.12;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : MAG, 0.92);
    c.beginPath();
    c.ellipse(0, 0, 14 * s * w, 11 * s / w, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(VIO, 0.85);
    c.beginPath();
    c.arc(-4 * s, -2 * s, 4 * s, 0, TAU);
    c.arc(5 * s, 2 * s, 3.2 * s, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawGun(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    if (e.ceil) c.scale(1, -1);
    c.fillStyle = rgba(e.flash > 0 ? WHT : (e.sphinx ? SAND : STN), 0.95);
    if (e.sphinx) {
      c.beginPath();
      c.moveTo(-14 * s, 8 * s);
      c.lineTo(-8 * s, -10 * s);
      c.lineTo(8 * s, -10 * s);
      c.lineTo(14 * s, 8 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(SUN, 0.85);
      c.fillRect(-3 * s, -16 * s, 8 * s, 10 * s);
    } else {
      c.fillRect(-12 * s, -4 * s, 24 * s, 12 * s);
      c.fillStyle = rgba(CYN, 0.8);
      c.fillRect(-3 * s, -12 * s, 8 * s, 10 * s);
      c.fillStyle = rgba(SUN, 0.8);
      c.fillRect(4 * s, -2 * s, 10 * s, 4 * s);
    }
    c.restore();
  }

  function drawGate(e, x) {
    const c = ctx;
    const s = scale;
    const plate = gatePlate(e);
    c.save();
    c.fillStyle = rgba(e.flash > 0 ? WHT : CYN, 0.82);
    c.fillRect(sx(x - e.hw), sy(e.y - e.hh), e.hw * 2 * s, plate * s);
    c.fillRect(sx(x - e.hw), sy(e.y + e.hh - plate), e.hw * 2 * s, plate * s);
    c.fillStyle = rgba(GOLD, 0.7);
    c.fillRect(sx(x - 3), sy(e.y - e.hh), 6 * s, 5 * s);
    c.fillRect(sx(x - 3), sy(e.y + e.hh - 5), 6 * s, 5 * s);
    c.restore();
  }

  function drawDust(e, x) {
    const c = ctx;
    const pulse = 0.32 + Math.sin(e.pulse * 5) * 0.32;
    const g = c.createLinearGradient(sx(x), sy(e.y - e.hh), sx(x), sy(e.y + e.hh));
    g.addColorStop(0, rgba(SAND, 0));
    g.addColorStop(0.5, rgba(SAND, pulse));
    g.addColorStop(1, rgba(SAND, 0));
    c.fillStyle = g;
    c.fillRect(sx(x - e.hw), sy(e.y - e.hh), e.hw * 2 * scale, e.hh * 2 * scale);
  }

  function drawCap(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.fillStyle = rgba(SUN, 0.95);
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
    const open = e.open;
    if (e.kind === 'sand') {
      c.globalAlpha = 1 - e.bury * 0.55;
      c.fillStyle = rgba(SAND, 0.5);
      c.beginPath();
      c.moveTo(-8 * s, 18 * s);
      c.quadraticCurveTo(-40 * s, 8 * s, -28 * s, -10 * s);
      c.quadraticCurveTo(0, -28 * s, 24 * s, -8 * s);
      c.quadraticCurveTo(40 * s, 12 * s, 8 * s, 20 * s);
      c.closePath();
      c.fill();
    } else if (e.kind === 'bubble') {
      c.strokeStyle = rgba(VIO, 0.55 + open * 0.3);
      c.lineWidth = Math.max(1.4, 2.2 * s);
      c.beginPath();
      c.ellipse(0, 0, (42 + open * 10) * s, (34 + open * 8) * s, 0, 0, TAU);
      c.stroke();
    } else {
      c.save();
      c.rotate(e.spin * 0.4);
      c.strokeStyle = rgba(GOLD, 0.7);
      c.lineWidth = Math.max(1.4, 2 * s);
      for (let i = 0; i < 6; i++) {
        c.rotate(TAU / 6);
        c.beginPath();
        c.moveTo(18 * s, 0);
        c.lineTo((36 + (1 - open) * 10) * s, 8 * s);
        c.lineTo((36 + (1 - open) * 10) * s, -8 * s);
        c.closePath();
        c.stroke();
      }
      c.restore();
    }
    const body = e.flash > 0 ? WHT
      : e.kind === 'bubble' ? [72, 48, 110]
      : e.kind === 'fold' ? [70, 88, 108]
      : [96, 78, 48];
    c.fillStyle = rgba(body, 0.96);
    c.beginPath();
    c.moveTo(-52 * s, 0);
    c.lineTo(-28 * s, -30 * s);
    c.lineTo(40 * s, -26 * s);
    c.lineTo(52 * s, 0);
    c.lineTo(40 * s, 26 * s);
    c.lineTo(-28 * s, 30 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(DEEP, 1);
    c.beginPath();
    c.arc(-8 * s, 0, 14 * s, 0, TAU);
    c.fill();
    c.fillStyle = rgba(open > 0.55 ? (e.kind === 'sand' ? SUN : GOLD) : [40, 50, 58], 0.4 + open * 0.6);
    c.beginPath();
    c.arc(-8 * s, 0, (7 + open * 5) * s, 0, TAU);
    c.fill();
    if (open > 0.55) {
      c.strokeStyle = rgba(e.kind === 'bubble' ? VIO : GOLD, 0.7);
      c.lineWidth = Math.max(1, 1.4 * s);
      c.beginPath();
      c.arc(-8 * s, 0, 16 * s, 0, TAU);
      c.stroke();
    }
    c.fillStyle = rgba(e.kind === 'bubble' ? MAG : CYN, 0.85);
    c.fillRect(-36 * s, -22 * s, 8 * s, 6 * s);
    c.fillRect(-36 * s, 16 * s, 8 * s, 6 * s);
    c.restore();
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = scrX(e.wx);
      if (x < -80 || x > VW + 80) continue;
      if (e.type === 'dust') drawDust(e, x);
      else if (e.type === 'fan') drawFan(e, x);
      else if (e.type === 'worm') drawWorm(e, x);
      else if (e.type === 'bubble') drawBubble(e, x);
      else if (e.type === 'blob') drawBlob(e, x);
      else if (e.type === 'gun') drawGun(e, x);
      else if (e.type === 'gate') drawGate(e, x);
      else if (e.type === 'cap') drawCap(e, x);
      else if (e.type === 'core') drawCore(e, x);
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = scrX(s.wx);
      if (s.fold) {
        const pulse = 0.5 + Math.sin(G.t * 28) * 0.5;
        const gap = 3.2 + pulse * 2.2;
        c.fillStyle = rgba(ICE, 0.95);
        c.fillRect(sx(x - 4), sy(s.y - gap - 1.2), 22 * scale, 2.4 * scale);
        c.fillRect(sx(x - 4), sy(s.y + gap - 1.2), 22 * scale, 2.4 * scale);
        c.strokeStyle = rgba(GOLD, 0.7);
        c.lineWidth = Math.max(1, 1.2 * scale);
        c.beginPath();
        c.moveTo(sx(x + 6), sy(s.y - gap));
        c.lineTo(sx(x + 14), sy(s.y + gap));
        c.stroke();
        c.fillStyle = rgba(WHT, 0.45);
        c.fillRect(sx(x - 8), sy(s.y - 1), 8 * scale, 2 * scale);
      } else if (s.mis) {
        c.save();
        const ang = Math.atan2(s.vy, s.vx);
        c.translate(sx(x), sy(s.y));
        c.rotate(ang);
        c.fillStyle = rgba(SUN, 0.95);
        c.beginPath();
        c.moveTo(7 * scale, 0);
        c.lineTo(-5 * scale, -3.2 * scale);
        c.lineTo(-5 * scale, 3.2 * scale);
        c.closePath();
        c.fill();
        c.fillStyle = rgba(GOLD, 0.7);
        c.fillRect(-8 * scale, -1.2 * scale, 5 * scale, 2.4 * scale);
        c.restore();
        c.strokeStyle = rgba(SUN, 0.35);
        c.lineWidth = Math.max(1, scale);
        c.beginPath();
        c.arc(sx(x), sy(s.y), 8 * scale, 0, TAU);
        c.stroke();
      } else {
        c.fillStyle = rgba(s.tail ? TEAL : CYN, 0.98);
        c.fillRect(sx(x), sy(s.y - 1.6), (s.tail ? -10 : 11) * scale, 3.2 * scale);
        if (!REDUCE) {
          c.fillStyle = rgba(WHT, 0.5);
          c.fillRect(sx(x - (s.tail ? 0 : 6)), sy(s.y - 1), 6 * scale, 2 * scale);
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
    const w = 240;
    const x = (VW - w) * 0.5;
    const y = 16;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(sx(x), sy(y), w * scale, 8 * scale);
    const rgb = b.kind === 'sand' ? SAND : b.kind === 'bubble' ? VIO : GOLD;
    c.fillStyle = rgba(rgb, 0.9);
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
    c.fillStyle = '#021018';
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

    const st = G.mode === 'title' ? 1 : G.stage;
    const g = c.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    if (st === 1) {
      g.addColorStop(0, '#0c100c');
      g.addColorStop(0.55, '#1c160c');
      g.addColorStop(1, '#2a1a08');
    } else if (st === 2) {
      g.addColorStop(0, '#080818');
      g.addColorStop(0.55, '#120c24');
      g.addColorStop(1, '#1a1028');
    } else {
      g.addColorStop(0, '#041018');
      g.addColorStop(0.55, '#06141c');
      g.addColorStop(1, '#08141a');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawSun();
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
    G.px = 96;
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
    G.orbit = 0;
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
    toast(isCore() ? '巡核' : '巡三', false, !isCore());
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('raid');
    G.mode = 'title';
    G.laser = true;
    showOverlay('title', '巡三', LEAD);
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

  function isPowKey(k, e) {
    return k === 'z' || k === 'Z' || k === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight';
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
    const powKey = isPowKey(k, e);
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
      startGame(k === '2' ? 'core' : 'raid');
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
  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
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
