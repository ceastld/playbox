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
  const OPT_MAX = 3;
  const POW_MAX = 2;
  const BOSS_AT = [3000, 6400, 10200];
  const BEST_KEY = 'playbox-last-resort-best';
  const MUTE_KEY = 'playbox-last-resort-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 卫星 · R 重开 · M 静音';
  const STAGE_NAME = ['夜城', '钢厂', '末堡'];
  const BOSS_NAME = ['塔卫', '熔核', '末砦'];
  const SAT_WORD = { orbit: '环绕', fly: '出击', hold: '悬停', back: '收回' };
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 122];
  const ORG = [255, 122, 40];
  const GOLD = [255, 193, 74];
  const HOT = [255, 154, 64];
  const WHT = [255, 244, 232];
  const PNK = [255, 154, 196];
  const STEEL = [106, 154, 184];
  const RED = [255, 72, 88];
  const DEEP = [26, 12, 6];
  const MOLT = [255, 90, 40];

  const SCORE = {
    scout: 50, hover: 70, turret: 90, walker: 140,
    gun: 160, mine: 40, carry: 280, slag: 20, boss: 2500
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
  const btnCity = document.getElementById('btn-city');
  const btnRail = document.getElementById('btn-rail');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnSat = document.getElementById('btn-sat');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const satLabel = document.getElementById('sat-label');
  const powLabel = document.getElementById('pow-label');
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
  const pointer = { down: false, hover: false, x: 90, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const lights = [];

  const G = {
    mode: 'title',
    kind: 'city',
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
    cleared: 0,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    opts: 0,
    pow: 0,
    sat: {
      state: 'orbit', ang: 0, wx: 0, y: 0, vx: 0, vy: 0,
      spin: 0, ramCd: 0, fireCd: 0, dockLock: 0
    },
    spawnedX: 0,
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: ORG,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    boss: false,
    winT: 0,
    engine: 0
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
  function isRail() {
    return G.kind === 'rail';
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
  function buildingH(wx) {
    const i = Math.floor(wx / 40);
    const h = hash2(i * 17 + 5);
    const h2 = hash2(i * 31 + 11);
    let bh = 36 + h * 86;
    if (h2 > 0.82) bh += 38;
    if (h2 < 0.12) bh *= 0.55;
    return bh;
  }
  function caveAt(wx) {
    const st = stageAt(wx);
    const n1 = fbm(wx * 0.0017, 2);
    const n2 = fbm(wx * 0.0036, 9);
    let top = 8;
    let bot = VH - 12;
    if (st === 1) {
      top = 8 + n1 * 10;
      bot = VH - buildingH(wx);
      if (n2 > 0.78) top += 22;
    } else if (st === 2) {
      top = 18 + n1 * 46 + (n2 > 0.7 ? 16 : 0);
      bot = VH - 22 - n2 * 58;
    } else {
      top = 26 + n1 * 52 + (n2 > 0.68 ? 20 : 0);
      bot = VH - 28 - n2 * 50;
    }
    if (wx < 380) {
      const t = wx / 380;
      top = lerp(8, top, t);
      bot = lerp(VH - 18, bot, t);
    }
    if (G.boss) {
      top = Math.min(top, 28);
      bot = Math.max(bot, VH - 32);
    }
    if (top > bot - 78) {
      const mid = (top + bot) * 0.5;
      top = mid - 39;
      bot = mid + 39;
    }
    return { top: top, bot: bot };
  }
  function satCount() {
    return 1 + G.opts;
  }
  function satRadius() {
    return 30 + G.opts * 3;
  }
  function clusterSpread() {
    return G.opts === 0 ? 0 : 14 + G.opts * 3;
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
      this.beep(760, 0.045, 'square', 0.03, 1480);
    },
    satShot() {
      this.ensure();
      this.beep(520, 0.05, 'sawtooth', 0.028, 980);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.035);
      this.noise(0.04, 0.034, 1100);
      this.beep(480 * lift, 0.075, 'square', 0.04, 780 * lift);
    },
    ram() {
      this.ensure();
      this.noise(0.07, 0.05, 500);
      this.beep(180, 0.1, 'sawtooth', 0.045, 70);
    },
    launch() {
      this.ensure();
      this.beep(220, 0.1, 'sawtooth', 0.045, 880);
      this.noise(0.09, 0.04, 400);
    },
    dock() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.042, 784);
      this.beep(784, 0.12, 'triangle', 0.038, 1175);
    },
    option() {
      this.ensure();
      this.beep(440, 0.07, 'square', 0.042, 660);
      this.beep(660, 0.09, 'triangle', 0.038, 990);
      this.beep(880, 0.14, 'sine', 0.036, 1320);
    },
    pow() {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.034, 1175);
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
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.035, 990);
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '末堡';
      else if (G.boss) stageLabel.textContent = BOSS_NAME[G.stage - 1] || '要塞';
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + (STAGE_NAME[G.stage - 1] || '');
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isRail() ? '轨道' : '末城';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isRail());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (satLabel) {
      satLabel.textContent = SAT_WORD[G.sat.state] || '环绕';
      satLabel.className = 'sat' + (G.sat.state === 'orbit' ? '' : ' ' + G.sat.state);
    }
    if (powLabel) {
      powLabel.textContent = '火 ' + (G.pow + 1) + (G.opts ? ' · 卫' + (G.opts + 1) : '');
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
    else if (G.mode === 'lose') setHint('R 重开 · 卫星环绕，Shift 射出', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 末堡崩解', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 撞楼也掉命', 'warn');
    else if (G.sat.state === 'hold') setHint('飞过去接住卫星 · 或 Shift 收回', 'hot');
    else if (G.sat.state === 'fly') setHint('卫星出击 · 撞敌削血 · Shift 收回', 'hot');
    else setHint('卫星环绕 · Shift 射出 / 收回 · 吃六角荚', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'LRES';
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
    if (comboEl && G.mode === 'play' && G.combo >= 2) {
      comboEl.hidden = false;
      comboEl.textContent = '连击 ×' + G.mult;
    }
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

  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function moveSpd() {
    return isRail() ? 302 : 258;
  }

  function scrollSpd() {
    if (G.boss) {
      const b = findBoss();
      if (b && b.alive) {
        const x = scrX(b.wx);
        if (x < VW * 0.58) return isRail() ? 42 : 28;
        if (x < VW * 0.74) return 10;
        return 0;
      }
    }
    const base = isRail() ? 142 : 96;
    return base + (G.stage - 1) * 8 + Math.min(16, G.combo * 0.5);
  }

  function satCore() {
    if (G.sat.state === 'orbit') {
      const ang = G.sat.ang;
      const r = satRadius();
      return { wx: pwx() + Math.cos(ang) * r, y: G.py + Math.sin(ang) * r };
    }
    return { wx: G.sat.wx, y: G.sat.y };
  }

  function podAt(k) {
    const n = satCount();
    const core = satCore();
    if (n === 1) return { wx: core.wx, y: core.y };
    const spread = G.sat.state === 'orbit' ? satRadius() : clusterSpread();
    const base = G.sat.state === 'orbit' ? G.sat.ang : G.sat.spin;
    const ang = base + (TAU * k / n);
    if (G.sat.state === 'orbit') {
      return { wx: pwx() + Math.cos(ang) * spread, y: G.py + Math.sin(ang) * spread };
    }
    return { wx: core.wx + Math.cos(ang) * spread, y: core.y + Math.sin(ang) * spread };
  }

  function spawnScout(wx, y, n, dive) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 22, cave.bot - 22);
    const rail = isRail();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'scout',
        wx: wx + i * 18,
        y: y + (i - (n - 1) * 0.5) * (dive ? 5 : 9),
        hw: 10, hh: 6,
        hp: 1,
        vx: -(rail ? 92 : 72),
        phase: i * 0.46,
        path: dive ? 'dive' : 'sine',
        red: i === 0 && hash2((wx / 8) | 0) > 0.62,
        cd: rand(0.45, 1.3)
      });
    }
  }

  function spawnHover(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 24, cave.bot - 24);
    pushEnt({
      type: 'hover',
      wx: wx, y: y,
      hw: 12, hh: 7,
      hp: isRail() ? 3 : 2,
      vx: -(isRail() ? 70 : 54),
      phase: rand(0, TAU),
      cd: rand(0.6, 1.4)
    });
  }

  function spawnTurret(wx) {
    const cave = caveAt(wx);
    const y = cave.bot - 12;
    if (occupied(wx, y, 30)) return;
    pushEnt({
      type: 'turret',
      wx: wx, y: y,
      hw: 11, hh: 10,
      hp: isRail() ? 4 : 3,
      cd: rand(0.5, 1.2)
    });
  }

  function spawnWalker(wx) {
    const cave = caveAt(wx);
    const y = cave.bot - 14;
    if (occupied(wx, y, 36)) return;
    pushEnt({
      type: 'walker',
      wx: wx, y: y,
      hw: 14, hh: 12,
      hp: isRail() ? 6 : 5,
      dir: hash2((wx / 16) | 0) > 0.5 ? 1 : -1,
      cd: rand(0.5, 1.1),
      walk: 0
    });
  }

  function spawnGun(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 30, cave.bot - 30);
    pushEnt({
      type: 'gun',
      wx: wx, y: y,
      hw: 18, hh: 10,
      hp: isRail() ? 8 : 6,
      vx: -(isRail() ? 48 : 36),
      cd: rand(0.7, 1.3),
      phase: 0
    });
  }

  function spawnMine(wx, y) {
    pushEnt({
      type: 'mine',
      wx: wx, y: y,
      hw: 8, hh: 8,
      hp: 1,
      phase: rand(0, TAU),
      spin: 0
    });
  }

  function spawnCarry(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 28, cave.bot - 28);
    pushEnt({
      type: 'carry',
      wx: wx, y: y,
      hw: 16, hh: 9,
      hp: isRail() ? 5 : 4,
      vx: -(isRail() ? 58 : 44),
      drop: false,
      cd: 0.4
    });
  }

  function spawnCap(wx, y, kind) {
    pushEnt({
      type: 'cap',
      kind: kind || 'opt',
      wx: wx, y: y,
      hw: 9, hh: 9,
      hp: 1,
      spin: 0,
      vy: rand(-14, 14)
    });
  }

  function spawnSlice(wx) {
    if (G.boss) return;
    if (wx < 260) return;
    const nearBoss = BOSS_AT[G.cleared];
    if (nearBoss != null && wx > nearBoss - 170) return;
    const st = stageAt(wx);
    const slice = (wx / 52) | 0;
    const h = hash2(slice * 19 + (isRail() ? 7 : 3) + G.stage * 11);
    const cave = caveAt(wx);
    const mid = (cave.top + cave.bot) * 0.5;
    const dens = isRail() ? 0.72 : 1;
    const scoutEvery = isRail() ? 3 : 4;

    if (slice % scoutEvery === 0 && h > 0.14 * dens) {
      const y = lerp(cave.top + 36, cave.bot - 36, hash2(slice + 44));
      const n = (isRail() ? 6 : 5) + (st === 3 ? 1 : 0);
      spawnScout(wx, y, n, h > 0.7 && st > 1);
    }
    if (st === 1 && slice % 5 === 2 && h > 0.3) {
      spawnHover(wx, mid + (h > 0.5 ? 36 : -36));
    }
    if (st !== 3 && slice % (isRail() ? 4 : 5) === 1 && h > 0.28 * dens) {
      spawnTurret(wx);
    }
    if ((st === 2 || st === 3) && slice % 6 === 2) {
      spawnWalker(wx);
    }
    if (st >= 2 && slice % 7 === 4 && h > 0.34) {
      spawnGun(wx, mid + (h > 0.5 ? 28 : -28));
    }
    if (st === 3 && slice % 5 === 0 && h > 0.4) {
      spawnMine(wx, lerp(cave.top + 40, cave.bot - 40, hash2(slice + 21)));
      if (isRail()) spawnMine(wx + 28, lerp(cave.top + 40, cave.bot - 40, hash2(slice + 33)));
    }
    if (slice % 8 === 3 && h > 0.36) {
      spawnCarry(wx, mid);
    }
    if (slice % 9 === 5 && h > 0.5) {
      spawnCap(wx, lerp(cave.top + 40, cave.bot - 40, hash2(slice + 9)), h > 0.72 ? 'pow' : 'opt');
    }
  }

  function spawnBoss() {
    G.boss = true;
    const st = G.stage;
    const rail = isRail();
    const hp = (st === 1 ? 68 : st === 2 ? 92 : 128) * (rail ? 1.24 : 1) | 0;
    const cave = caveAt(G.cam + VW * 0.72);
    pushEnt({
      type: 'boss',
      kind: st === 1 ? 'tower' : st === 2 ? 'forge' : 'fort',
      wx: G.cam + VW * 0.78,
      y: (cave.top + cave.bot) * 0.5,
      hw: st === 1 ? 36 : 50,
      hh: st === 1 ? 70 : 34,
      hp: hp,
      max: hp,
      open: 0,
      phase: 0,
      cd: 0.7,
      vy: 42,
      spin: 0
    });
    toast((BOSS_NAME[st - 1] || '要塞') + ' 出阵', false, true);
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
      G.spawnedX += 52;
      spawnSlice(G.spawnedX);
    }
  }

  function seedStars() {
    stars.length = 0;
    lights.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        wx: hash2(i * 17) * 2400,
        y: 8 + hash2(i * 91 + 3) * (VH - 16),
        s: 0.5 + hash2(i * 5 + 9) * 1.8,
        p: 0.18 + hash2(i * 13) * 0.7
      });
    }
    for (let i = 0; i < 40; i++) {
      lights.push({
        wx: hash2(i * 29 + 4) * 1800,
        y: 60 + hash2(i * 41) * 220,
        p: 0.35 + hash2(i * 7) * 0.4
      });
    }
  }

  function award(kind, x, y) {
    bumpCombo();
    const n = (SCORE[kind] || 10) * G.mult;
    addScore(n);
    const gold = kind === 'boss' || kind === 'carry' || G.mult >= 3;
    floatText(x, y - 8, '+' + n, gold ? GOLD : WHT, gold);
  }

  function catchOpt(x, y) {
    if (G.opts >= OPT_MAX) {
      toast('卫星 MAX', false, true);
      addScore(500 * G.mult);
      audio.pow();
      floatText(x, y - 12, '+MAX', GOLD, true);
      return;
    }
    G.opts += 1;
    toast('卫星 ×' + (G.opts + 1), false, true);
    audio.option();
    explode(x, y, ORG, 18);
    popSpark(x, y, GOLD, 22);
    hitStop(0.05);
    kick(3.4);
    screenFlash(ORG, 0.42);
    floatText(x, y - 14, '卫星', GOLD, true);
    syncHud();
  }

  function catchPow(x, y) {
    if (G.pow >= POW_MAX) {
      toast('火力 MAX', false, true);
      addScore(400 * G.mult);
      audio.pow();
      floatText(x, y - 12, '+MAX', GOLD, true);
      return;
    }
    G.pow += 1;
    toast('火力 ×' + (G.pow + 1), false, true);
    audio.pow();
    popSpark(x, y, GOLD, 18);
    hitStop(0.04);
    kick(2.6);
    screenFlash(GOLD, 0.32);
    floatText(x, y - 12, '火力', GOLD, true);
    syncHud();
  }

  function collectCap(e) {
    e.alive = false;
    const x = scrX(e.wx);
    if (e.kind === 'pow') catchPow(x, e.y);
    else catchOpt(x, e.y);
    addScore(40);
  }

  function dockSat() {
    if (G.sat.state === 'orbit') return;
    G.sat.state = 'orbit';
    G.sat.vx = 0;
    G.sat.vy = 0;
    G.sat.dockLock = 0;
    const p = satCore();
    const x = scrX(p.wx);
    audio.dock();
    popSpark(x, p.y, GOLD, 20);
    floatText(x, p.y - 14, '对接', GOLD, true);
    hitStop(0.038);
    kick(2.4);
    screenFlash(GOLD, 0.28);
    syncHud();
  }

  function launchSat() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    audio.ensure();
    if (G.sat.state === 'orbit') {
      const p = satCore();
      G.sat.wx = p.wx;
      G.sat.y = p.y;
      G.sat.vx = 430;
      G.sat.vy = Math.sin(G.sat.ang) * 36;
      G.sat.state = 'fly';
      G.sat.dockLock = 0.3;
      audio.launch();
      popSpark(scrX(p.wx), p.y, ORG, 16);
      emit(10, {
        x: scrX(p.wx), y: p.y, j: 6,
        vx0: 40, vx1: 180, vy0: -80, vy1: 80,
        r0: 1.2, r1: 3, life: 0.28, rgb: ORG, g: 0
      });
      hitStop(0.032);
      kick(2.2);
      toast('卫星出击', false, true);
    } else {
      G.sat.state = 'back';
      G.sat.dockLock = 0;
      audio.launch();
      toast('卫星收回', false, true);
    }
    syncHud();
  }

  function pushShot(s) {
    G.shots.push(s);
    capArr(G.shots, 64);
  }

  function fireFrom(wx, y, fromSat) {
    const pow = G.pow;
    const vx = fromSat ? 520 : 640;
    const hw = fromSat ? 5.4 : 6.2;
    if (pow <= 0) {
      pushShot({ type: 'shot', wx: wx, y: y, vx: vx, vy: 0, hw: hw, hh: 2.2, life: 0.85, sat: fromSat });
    } else if (pow === 1) {
      pushShot({ type: 'shot', wx: wx, y: y - 4, vx: vx, vy: -28, hw: hw, hh: 2.1, life: 0.85, sat: fromSat });
      pushShot({ type: 'shot', wx: wx, y: y + 4, vx: vx, vy: 28, hw: hw, hh: 2.1, life: 0.85, sat: fromSat });
    } else {
      pushShot({ type: 'shot', wx: wx, y: y, vx: vx, vy: 0, hw: hw, hh: 2.2, life: 0.85, sat: fromSat });
      pushShot({ type: 'shot', wx: wx, y: y - 5, vx: vx * 0.96, vy: -70, hw: hw, hh: 2.1, life: 0.85, sat: fromSat });
      pushShot({ type: 'shot', wx: wx, y: y + 5, vx: vx * 0.96, vy: 70, hw: hw, hh: 2.1, life: 0.85, sat: fromSat });
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    G.fireCd = isRail() ? 0.1 : 0.112;
    G.muzzle = 0.055;
    fireFrom(pwx() + 16, G.py, false);
    if (G.sat.state === 'orbit') {
      const n = satCount();
      for (let k = 0; k < n; k++) {
        const p = podAt(k);
        pushShot({
          type: 'shot', wx: p.wx, y: p.y, vx: 500, vy: 0,
          hw: 5, hh: 2, life: 0.8, sat: true
        });
      }
    }
    audio.shoot();
    if (!REDUCE) {
      emit(3, {
        x: G.px + 16, y: G.py, j: 3,
        vx0: 40, vx1: 160, vy0: -50, vy1: 50,
        r0: 1, r1: 2.4, life: 0.12, rgb: WHT, g: 0
      });
    }
  }

  function fireSatAuto() {
    if (G.sat.state === 'orbit' || G.sat.fireCd > 0 || G.deadT > 0) return;
    G.sat.fireCd = isRail() ? 0.12 : 0.14;
    const n = satCount();
    for (let k = 0; k < n; k++) {
      const p = podAt(k);
      pushShot({
        type: 'shot', wx: p.wx, y: p.y, vx: 480, vy: Math.sin(G.sat.spin + k) * 40,
        hw: 5.2, hh: 2.1, life: 0.8, sat: true
      });
    }
    audio.satShot();
  }

  function enemyShot(wx, y, vx, vy, r) {
    G.eShots.push({
      wx: wx, y: y, vx: vx, vy: vy, r: r || 3.2, life: 3.2
    });
    capArr(G.eShots, 100);
  }

  function hurt(e, dmg, hx, hy) {
    if (!e.alive || e.type === 'cap') return false;
    if (e.type === 'boss' && e.kind === 'forge' && e.open < 0.5) return 'block';
    if (e.type === 'boss' && e.kind === 'fort' && e.open < 0.45) return 'block';
    e.hp -= dmg || 1;
    e.flash = 0.08;
    if (e.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -90, vx1: 90, vy0: -80, vy1: 50,
        life: 0.16, r0: 1, r1: 2.2, rgb: WHT, g: 80
      });
      if (e.type === 'boss') hitStop(0.028);
      bumpCombo();
      G.comboT = COMBO_WIN;
      G.mult = comboMult();
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
    if (e.type === 'boss') {
      explode(x, y, GOLD, 48);
      explode(x - 24, y + 10, MAG, 22);
      explode(x + 20, y - 10, ORG, 22);
      award('boss', x, y);
      addScore(1500 * G.stage);
      audio.boom();
      hitStop(0.08);
      kick(8);
      screenFlash(GOLD, 0.62);
      G.cleared += 1;
      G.boss = false;
      if (G.cleared >= 3) {
        G.winT = 1.25;
        toast('末堡崩解', false, true);
      } else {
        G.stage = G.cleared + 1;
        toast('第 ' + G.stage + ' 关 · ' + STAGE_NAME[G.stage - 1], false, true);
        audio.check();
      }
      syncHud();
      return;
    }
    if (e.type === 'cap') return;
    const rgb = e.red ? RED : e.type === 'turret' ? STEEL : e.type === 'walker' ? MAG : ORG;
    explode(x, y, rgb, e.type === 'gun' || e.type === 'carry' ? 22 : 16);
    award(e.type, x, y);
    audio.hit(G.combo);
    hitStop(clamp(0.03 + G.combo * 0.0022, 0.03, 0.062));
    kick(e.type === 'gun' ? 3.2 : 1.8);
    if (e.red || e.type === 'carry' || (e.type === 'turret' && hash2(e.id) > 0.62)) {
      spawnCap(e.wx, e.y, e.type === 'carry' ? 'opt' : (e.red ? 'pow' : 'opt'));
    }
  }

  function killPlayer() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    breakCombo();
    G.fireHold = false;
    explode(G.px, G.py, MAG, 34);
    const n = satCount();
    for (let k = 0; k < n; k++) {
      const p = podAt(k);
      explode(scrX(p.wx), p.y, ORG, 14);
    }
    if (G.opts > 0) spawnCap(pwx(), G.py, 'opt');
    G.opts = 0;
    G.pow = Math.max(0, G.pow - 1);
    G.sat.state = 'orbit';
    G.sat.dockLock = 0;
    audio.death();
    hitStop(0.072);
    kick(7.2);
    screenFlash(MAG, 0.55);
    syncHud();
  }

  function respawn() {
    G.px = 90;
    const cave = caveAt(pwx());
    G.py = clamp((cave.top + cave.bot) * 0.5, cave.top + 20, cave.bot - 20);
    G.invuln = 1.48;
    G.sat.state = 'orbit';
    pointer.x = G.px;
    pointer.y = G.py;
    G.eShots.length = 0;
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
    showOverlay('win', '末堡崩解', '三关打穿 · 分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
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
    G.engine += dt;
    if (!REDUCE && G.engine > 0.04) {
      G.engine = 0;
      emit(1, {
        x: G.px - 14, y: G.py + rand(-2, 2), j: 1,
        vx0: -90, vx1: -40, vy0: -18, vy1: 18,
        r0: 1.2, r1: 2.4, life: 0.18, rgb: ORG, g: 0
      });
    }
  }

  function clampSatTerrain() {
    const cave = caveAt(G.sat.wx);
    const r = 12;
    let hit = false;
    if (G.sat.y < cave.top + r) {
      G.sat.y = cave.top + r;
      G.sat.vy = Math.abs(G.sat.vy) * 0.4;
      hit = true;
    }
    if (G.sat.y > cave.bot - r) {
      G.sat.y = cave.bot - r;
      G.sat.vy = -Math.abs(G.sat.vy) * 0.4;
      hit = true;
    }
    return hit;
  }

  function updateSat(dt) {
    const prev = G.sat.state;
    G.sat.ang += 2.55 * dt;
    G.sat.spin += 5.2 * dt;
    if (G.sat.ramCd > 0) G.sat.ramCd -= dt;
    if (G.sat.fireCd > 0) G.sat.fireCd -= dt;
    if (G.sat.dockLock > 0) G.sat.dockLock -= dt;
    if (G.deadT > 0) return;

    if (G.sat.state === 'orbit') {
      const p = satCore();
      G.sat.wx = p.wx;
      G.sat.y = p.y;
      if (G.sat.ramCd <= 0) ramSat();
      catchCapsWithSat();
      return;
    }

    if (G.sat.state === 'fly') {
      G.sat.wx += G.sat.vx * dt;
      G.sat.y += G.sat.vy * dt;
      G.sat.vx *= 0.992;
      if (clampSatTerrain()) G.sat.state = 'hold';
      const x = scrX(G.sat.wx);
      if (x > VW * 0.84) {
        G.sat.wx = G.cam + VW * 0.84;
        G.sat.state = 'hold';
      }
      if (G.sat.vx < 90 && G.sat.dockLock <= 0) G.sat.state = 'hold';
      fireSatAuto();
    } else if (G.sat.state === 'hold') {
      G.sat.y += Math.sin(G.t * 2.4) * 10 * dt;
      clampSatTerrain();
      fireSatAuto();
    } else if (G.sat.state === 'back') {
      const tx = pwx() + Math.cos(G.sat.ang) * satRadius();
      const ty = G.py + Math.sin(G.sat.ang) * satRadius();
      const dx = tx - G.sat.wx;
      const dy = ty - G.sat.y;
      const d = hypot(dx, dy) || 1;
      const sp = 420;
      G.sat.wx += dx / d * sp * dt;
      G.sat.y += dy / d * sp * dt;
      if (d < 16) dockSat();
    }

    if (G.sat.state !== 'orbit' && G.sat.dockLock <= 0) {
      const core = satCore();
      if (hypot(core.wx - pwx(), core.y - G.py) < 18) dockSat();
    }

    if (G.sat.ramCd <= 0) ramSat();
    eatBullets();
    catchCapsWithSat();
    if (prev !== G.sat.state) syncHud();
  }

  function ramSat() {
    const n = satCount();
    const dmg = G.sat.state === 'orbit' ? 1 : (isRail() ? 3 : 2);
    let hit = false;
    for (let k = 0; k < n; k++) {
      const p = podAt(k);
      const rad = G.sat.state === 'orbit' ? 9 : 12;
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (!e.alive || e.type === 'cap') continue;
        if (aabb(p.wx, p.y, rad, rad, e.wx, e.y, e.hw, e.hh)) {
          const r = hurt(e, dmg, scrX(e.wx), e.y);
          if (r && r !== 'block') hit = true;
        }
      }
    }
    if (hit) {
      G.sat.ramCd = 0.09;
      audio.ram();
      hitStop(0.036);
      kick(2.4);
      const c = satCore();
      popSpark(scrX(c.wx), c.y, ORG, 12);
    }
  }

  function eatBullets() {
    if (G.sat.state === 'orbit') return;
    const n = satCount();
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      if (s.r > 5.2) continue;
      let eat = false;
      for (let k = 0; k < n; k++) {
        const p = podAt(k);
        if (hypot(s.wx - p.wx, s.y - p.y) < 14) {
          eat = true;
          break;
        }
      }
      if (eat) {
        const x = scrX(s.wx);
        emit(4, {
          x: x, y: s.y, j: 3,
          vx0: -50, vx1: 50, vy0: -50, vy1: 50,
          life: 0.14, r0: 1, r1: 2, rgb: GOLD, g: 0
        });
        G.eShots.splice(i, 1);
      }
    }
  }

  function catchCapsWithSat() {
    const n = satCount();
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || e.type !== 'cap') continue;
      for (let k = 0; k < n; k++) {
        const p = podAt(k);
        if (aabb(p.wx, p.y, 12, 12, e.wx, e.y, e.hw, e.hh)) {
          collectCap(e);
          break;
        }
      }
    }
  }

  function shotHitsEnt(s, e) {
    if (!e.alive) return false;
    if (e.type === 'cap') return false;
    const cx = s.wx;
    if (e.type === 'boss' && e.kind === 'tower') {
      if (aabb(cx, s.y, s.hw, s.hh, e.wx - 6, e.y - 18, 14, 16)) return true;
      if (aabb(cx, s.y, s.hw, s.hh, e.wx, e.y, e.hw, e.hh)) return 'block';
      return false;
    }
    if (e.type === 'boss' && (e.kind === 'forge' || e.kind === 'fort')) {
      if (e.open < (e.kind === 'fort' ? 0.45 : 0.5)) {
        if (aabb(cx, s.y, s.hw, s.hh, e.wx, e.y, e.hw, e.hh)) return 'block';
        return false;
      }
      if (aabb(cx, s.y, s.hw, s.hh, e.wx - 10, e.y, 16, 14)) return true;
      if (aabb(cx, s.y, s.hw, s.hh, e.wx, e.y, e.hw, e.hh)) return 'block';
      return false;
    }
    return aabb(cx, s.y, s.hw, s.hh, e.wx, e.y, e.hw, e.hh);
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      if (s.life <= 0 || x > VW + 50 || x < -40 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      const cave = caveAt(s.wx);
      if (s.y < cave.top + 4 || s.y > cave.bot - 4) {
        emit(3, {
          x: x, y: s.y, j: 2,
          vx0: -40, vx1: 20, vy0: -30, vy1: 30,
          life: 0.1, r0: 1, r1: 2, rgb: WHT, g: 0
        });
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
          gone = true;
          break;
        }
        hurt(e, s.sat ? 1 : 1, hx, e.y);
        gone = true;
        break;
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
          killPlayer();
        }
      }
    }
  }

  function aimShot(e, sp, r, spread, n) {
    const dx = pwx() - e.wx;
    const dy = G.py - e.y;
    const d = hypot(dx, dy) || 1;
    const base = Math.atan2(dy, dx);
    const count = n || 1;
    for (let k = 0; k < count; k++) {
      const ang = base + (k - (count - 1) * 0.5) * (spread || 0);
      enemyShot(e.wx - 8, e.y, Math.cos(ang) * sp, Math.sin(ang) * sp, r || 3.2);
    }
  }

  function updateEnts(dt) {
    const rail = isRail();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.flash > 0) e.flash -= dt;
      const x = scrX(e.wx);
      if (!e.alive) {
        if (x < -80) G.ents.splice(i, 1);
        continue;
      }
      if (e.type !== 'boss' && x < -70) {
        G.ents.splice(i, 1);
        continue;
      }

      if (e.type === 'scout') {
        e.wx += e.vx * dt;
        if (e.path === 'dive' && x < VW * 0.85) {
          const dy = G.py - e.y;
          e.y += clamp(dy, -70, 70) * dt * 0.9;
        } else {
          e.y += Math.sin(G.t * 3.1 + e.phase) * 40 * dt;
        }
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 14, cave.bot - 14);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW * 0.82 && x > 40) {
          e.cd = rail ? rand(0.85, 1.5) : rand(1.3, 2.2);
          if (hash2(e.id + ((G.t * 8) | 0)) > (rail ? 0.42 : 0.6)) {
            aimShot(e, rail ? 186 : 154, 3, 0, 1);
          }
        }
      } else if (e.type === 'hover') {
        e.wx += e.vx * dt;
        e.y += Math.sin(G.t * 2.2 + e.phase) * 28 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 30) {
          e.cd = rail ? 1.05 : 1.4;
          aimShot(e, 160, 3.2, 0.18, 2);
        }
      } else if (e.type === 'turret') {
        const cave = caveAt(e.wx);
        e.y = cave.bot - 12;
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 24) {
          e.cd = rail ? 0.82 : 1.12;
          aimShot(e, rail ? 178 : 150, 3.3, 0, 1);
        }
      } else if (e.type === 'walker') {
        const cave = caveAt(e.wx);
        e.y = cave.bot - 14;
        e.wx += e.dir * (rail ? 48 : 34) * dt;
        e.walk += dt;
        if (e.walk > 1.5) {
          e.walk = 0;
          e.dir *= -1;
        }
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 30) {
          e.cd = rail ? 0.9 : 1.2;
          aimShot(e, 168, 3.4, 0.16, 2);
        }
      } else if (e.type === 'gun') {
        e.wx += e.vx * dt;
        e.phase += dt;
        e.y += Math.sin(e.phase * 1.4) * 22 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 22, cave.bot - 22);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 20) {
          e.cd = rail ? 0.95 : 1.28;
          aimShot(e, rail ? 170 : 148, 3.5, 0.22, 3);
        }
      } else if (e.type === 'mine') {
        e.spin += dt * 3.4;
        e.y += Math.sin(G.t * 2 + e.phase) * 16 * dt;
        e.wx -= 22 * dt;
      } else if (e.type === 'carry') {
        e.wx += e.vx * dt;
        e.y += Math.sin(G.t * 1.6) * 18 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 20, cave.bot - 20);
        if (!e.drop && x < VW * 0.62) {
          e.drop = true;
          spawnCap(e.wx, e.y + 10, hash2(e.id) > 0.5 ? 'opt' : 'pow');
        }
      } else if (e.type === 'slag') {
        e.wx += e.vx * dt;
        e.vy += 260 * dt;
        e.y += e.vy * dt;
        e.spin += dt * 5;
        const cave = caveAt(e.wx);
        if (e.y > cave.bot - 6) {
          e.alive = false;
          explode(x, e.y, MOLT, 8);
        }
      } else if (e.type === 'cap') {
        e.spin += dt * 5;
        e.y += Math.sin(G.t * 3 + e.spin) * 12 * dt;
        e.wx -= 14 * dt;
      } else if (e.type === 'boss') {
        e.wx = clamp(e.wx, G.cam + VW * 0.62, G.cam + VW * 0.82);
        const rage = e.hp < e.max * 0.45;
        e.phase += dt * (rage ? 1.28 : 1);
        e.spin += dt * (rage ? 2.4 : 1.4);
        const cave = caveAt(e.wx);
        e.y += e.vy * dt;
        const pad = e.kind === 'tower' ? 64 : 48;
        if (e.y < cave.top + pad || e.y > cave.bot - pad) {
          e.vy *= -1;
          e.y = clamp(e.y, cave.top + pad, cave.bot - pad);
        }
        if (e.kind === 'tower') {
          e.open = 0.6 + Math.sin(e.phase * 2) * 0.4;
          e.cd -= dt;
          if (e.cd <= 0) {
            e.cd = rage ? (rail ? 0.38 : 0.48) : (rail ? 0.55 : 0.7);
            const n = rage ? 5 : 3;
            aimShot(e, rail ? 176 : 150, 3.6, 0.2, n);
          }
        } else if (e.kind === 'forge') {
          const cyc = 2.5;
          const u = e.phase % cyc;
          if (u < 1.15) e.open = 0;
          else if (u < 1.32) e.open = (u - 1.15) / 0.17;
          else if (u < 2.2) e.open = 1;
          else e.open = Math.max(0, 1 - (u - 2.2) / 0.3);
          e.cd -= dt;
          if (e.cd <= 0) {
            e.cd = e.open > 0.5 ? (rail ? 0.4 : 0.52) : (rail ? 0.72 : 0.92);
            if (e.open > 0.5) {
              const n = rage ? 4 : 2;
              for (let r = 0; r < n; r++) {
                pushEnt({
                  type: 'slag',
                  wx: e.wx - 18 + rand(-8, 8),
                  y: e.y + 10,
                  vx: rand(-120, -20),
                  vy: rand(-40, 80),
                  hw: 7, hh: 7, hp: 1, spin: 0
                });
              }
              aimShot(e, 160, 3.8, 0.26, rage ? 4 : 3);
            } else {
              aimShot(e, 148, 3.4, 0.3, 4);
            }
          }
        } else {
          const cyc = 2.35;
          const u = e.phase % cyc;
          if (u < 1.05) e.open = 0;
          else if (u < 1.22) e.open = (u - 1.05) / 0.17;
          else if (u < 2.05) e.open = 1;
          else e.open = Math.max(0, 1 - (u - 2.05) / 0.3);
          e.cd -= dt;
          if (e.cd <= 0) {
            e.cd = rage ? (rail ? 0.34 : 0.44) : (rail ? 0.5 : 0.64);
            const n = e.open > 0.45 ? (rage ? 6 : 4) : 5;
            const sp = rail ? 178 : 152;
            for (let k = 0; k < n; k++) {
              const ang = e.open > 0.45
                ? Math.atan2(G.py - e.y, pwx() - e.wx) + (k - (n - 1) * 0.5) * 0.2
                : Math.PI + (k - (n - 1) * 0.5) * 0.28 + e.spin * 0.2;
              enemyShot(e.wx - 16, e.y, Math.cos(ang) * sp, Math.sin(ang) * sp, k === 0 && rage ? 5.6 : 3.6);
            }
          }
        }
      }

      if (G.mode === 'play' && G.deadT <= 0 && e.alive && e.type !== 'cap') {
        const phw = 7.2;
        const phh = 4.6;
        let hw = e.hw;
        let hh = e.hh;
        if (e.type === 'boss') {
          hw = e.hw * 0.82;
          hh = e.hh * 0.72;
        }
        if (aabb(pwx(), G.py, phw, phh, e.wx, e.y, hw, hh)) {
          if (G.invuln <= 0) killPlayer();
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
    G.cam += 58 * dt;
    G.t += dt;
    G.px = 108 + Math.sin(G.t * 0.65) * 18;
    G.py = VH * 0.5 + Math.sin(G.t * 1.05) * 36;
    const cave = caveAt(pwx());
    G.py = clamp(G.py, cave.top + 20, cave.bot - 20);
    G.opts = 2;
    G.pow = 1;
    G.sat.ang += 2.2 * dt;
    G.sat.spin += 4 * dt;
    const p = satCore();
    G.sat.wx = p.wx;
    G.sat.y = p.y;
    if (G.fireCd <= 0) {
      G.fireCd = 0.16;
      fireFrom(pwx() + 16, G.py, false);
      const n = satCount();
      for (let k = 0; k < n; k++) {
        const q = podAt(k);
        pushShot({
          type: 'shot', wx: q.wx, y: q.y, vx: 480, vy: 0,
          hw: 5, hh: 2, life: 0.7, sat: true
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
      updateSat(dt);
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
    updateSat(dt);
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
      c.fillStyle = rgba(i % 3 === 0 ? GOLD : WHT, 0.22 + s.p * 0.5);
      const r = s.s * scale;
      c.fillRect(sx(x), sy(s.y), r, r);
    }
    for (let i = 0; i < lights.length; i++) {
      const L = lights[i];
      const x = ((L.wx - G.cam * L.p) % VW + VW) % VW;
      c.fillStyle = rgba(ORG, 0.12 + Math.sin(G.t * 2 + i) * 0.06);
      c.fillRect(sx(x), sy(L.y), 2.2 * scale, 2.2 * scale);
    }
  }

  function drawCity() {
    const c = ctx;
    const step = 8;
    c.beginPath();
    c.moveTo(sx(0), sy(0));
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      c.lineTo(sx(x), sy(cv.top));
    }
    c.lineTo(sx(VW), sy(0));
    c.closePath();
    c.fillStyle = '#120604';
    c.fill();

    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      c.lineTo(sx(x), sy(cv.bot));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    const st = G.stage;
    c.fillStyle = st === 2 ? '#1c0a06' : st === 3 ? '#160808' : '#1a0c08';
    c.fill();

    c.strokeStyle = rgba(st === 2 ? MOLT : ORG, st === 2 ? 0.55 : 0.45);
    c.lineWidth = Math.max(1, 1.4 * scale);
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(cv.bot));
      else c.lineTo(sx(x), sy(cv.bot));
    }
    c.stroke();
    c.strokeStyle = rgba(STEEL, 0.28);
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(cv.top));
      else c.lineTo(sx(x), sy(cv.top));
    }
    c.stroke();

    for (let x = 0; x <= VW; x += 20) {
      const wx = G.cam + x;
      const cv = caveAt(wx);
      const col = Math.floor(wx / 40);
      const h = hash2(col * 13 + 2);
      if (cv.bot < VH - 8) {
        const windows = 2 + ((h * 4) | 0);
        for (let w = 0; w < windows; w++) {
          const wy = cv.bot + 8 + w * 12;
          if (wy > VH - 8) break;
          if (hash2(col * 19 + w) > 0.35) {
            c.fillStyle = rgba(GOLD, 0.35 + hash2(col + w) * 0.4);
            c.fillRect(sx(x + 4), sy(wy), 3.2 * scale, 3.2 * scale);
          }
        }
      }
      if (st === 2 && h > 0.55) {
        c.fillStyle = rgba(MOLT, 0.18 + Math.sin(G.t * 4 + col) * 0.08);
        c.fillRect(sx(x), sy(cv.bot - 4), 10 * scale, 6 * scale);
      }
    }
  }

  function drawShip(x, y, a) {
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
    c.fillStyle = rgba(ORG, 0.7);
    c.beginPath();
    c.moveTo(-16 * s, -2 * s);
    c.lineTo(-22 * s, -6 * s);
    c.lineTo(-22 * s, 6 * s);
    c.lineTo(-16 * s, 2 * s);
    c.fill();
    c.fillStyle = rgba(HOT, 0.95);
    c.beginPath();
    c.moveTo(-10 * s, 0);
    c.lineTo(-4 * s, -11 * s);
    c.lineTo(4 * s, -6 * s);
    c.lineTo(4 * s, 6 * s);
    c.lineTo(-4 * s, 11 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.96);
    c.beginPath();
    c.moveTo(-10 * s, -4 * s);
    c.lineTo(18 * s, 0);
    c.lineTo(-10 * s, 4 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(ORG, 1);
    c.beginPath();
    c.moveTo(2 * s, -2.4 * s);
    c.lineTo(16 * s, 0);
    c.lineTo(2 * s, 2.4 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.95);
    c.fillRect(-5 * s, -1.4 * s, 8 * s, 2.8 * s);
    c.restore();
  }

  function drawPod(wx, y, main) {
    const c = ctx;
    const s = scale;
    const x = scrX(wx);
    c.save();
    c.translate(sx(x), sy(y));
    c.rotate(G.sat.spin);
    const rad = main ? 8.2 : 6.2;
    c.strokeStyle = rgba(G.sat.state === 'hold' ? GOLD : ORG, 0.92);
    c.lineWidth = Math.max(1, 1.6 * s);
    c.beginPath();
    c.arc(0, 0, rad * s, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.arc(0, 0, (main ? 3.4 : 2.6) * s, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(WHT, 0.75);
    c.beginPath();
    c.moveTo(-rad * 0.7 * s, 0);
    c.lineTo(rad * 0.7 * s, 0);
    c.moveTo(0, -rad * 0.7 * s);
    c.lineTo(0, rad * 0.7 * s);
    c.stroke();
    if (G.sat.state !== 'orbit') {
      c.strokeStyle = rgba(ORG, 0.35);
      c.beginPath();
      c.arc(0, 0, (rad + 4) * s, 0, TAU);
      c.stroke();
    }
    c.restore();
  }

  function drawOrbitRing() {
    if (G.deadT > 0 || G.sat.state !== 'orbit') return;
    const c = ctx;
    c.save();
    c.strokeStyle = rgba(ORG, 0.18);
    c.lineWidth = Math.max(1, scale);
    c.beginPath();
    c.arc(sx(G.px), sy(G.py), satRadius() * scale, 0, TAU);
    c.stroke();
    c.restore();
  }

  function drawSats() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'win' && G.mode !== 'title') return;
    drawOrbitRing();
    const n = satCount();
    for (let k = n - 1; k >= 0; k--) {
      const p = podAt(k);
      drawPod(p.wx, p.y, k === 0);
    }
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'win' && G.mode !== 'title') return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    drawSats();
    drawShip(G.px, G.py, 1);
  }

  function drawScout(e, x) {
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

  function drawHover(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : STEEL, 0.95);
    c.fillRect(-12 * s, -4 * s, 24 * s, 8 * s);
    c.fillStyle = rgba(ORG, 0.7);
    c.fillRect(-8 * s, 3 * s, 6 * s, 3 * s);
    c.fillRect(2 * s, 3 * s, 6 * s, 3 * s);
    c.fillStyle = rgba(GOLD, 0.85);
    c.fillRect(-4 * s, -3 * s, 10 * s, 4 * s);
    c.restore();
  }

  function drawTurret(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : [70, 52, 44], 0.96);
    c.fillRect(-10 * s, -4 * s, 20 * s, 12 * s);
    c.fillStyle = rgba(ORG, 0.85);
    c.fillRect(-3 * s, -12 * s, 6 * s, 10 * s);
    c.fillStyle = rgba(GOLD, 0.8);
    c.beginPath();
    c.arc(0, -12 * s, 4 * s, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawWalker(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : MAG, 0.95);
    c.fillRect(-12 * s, -8 * s, 24 * s, 12 * s);
    c.fillStyle = rgba(STEEL, 0.9);
    c.fillRect(-10 * s, 4 * s, 6 * s, 8 * s);
    c.fillRect(4 * s, 4 * s, 6 * s, 8 * s);
    c.fillStyle = rgba(GOLD, 0.85);
    c.fillRect(-4 * s, -6 * s, 8 * s, 5 * s);
    c.restore();
  }

  function drawGun(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : [90, 48, 56], 0.96);
    c.beginPath();
    c.moveTo(-18 * s, 0);
    c.lineTo(-8 * s, -10 * s);
    c.lineTo(16 * s, -8 * s);
    c.lineTo(18 * s, 0);
    c.lineTo(16 * s, 8 * s);
    c.lineTo(-8 * s, 10 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(ORG, 0.8);
    c.fillRect(8 * s, -3 * s, 12 * s, 6 * s);
    c.restore();
  }

  function drawMine(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.strokeStyle = rgba(e.flash > 0 ? WHT : PNK, 0.95);
    c.lineWidth = Math.max(1.2, 2 * s);
    c.beginPath();
    c.arc(0, 0, 8 * s, 0, TAU);
    c.stroke();
    c.fillStyle = rgba(MAG, 0.85);
    c.beginPath();
    c.arc(0, 0, 3 * s, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawCarry(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : GOLD, 0.92);
    c.fillRect(-16 * s, -7 * s, 32 * s, 14 * s);
    c.fillStyle = rgba(ORG, 0.9);
    c.beginPath();
    c.moveTo(-6 * s, 0);
    c.lineTo(0, -5 * s);
    c.lineTo(6 * s, 0);
    c.lineTo(0, 5 * s);
    c.closePath();
    c.fill();
    c.restore();
  }

  function drawSlag(e, x) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.fillStyle = rgba(e.flash > 0 ? WHT : MOLT, 0.95);
    c.beginPath();
    c.arc(0, 0, 6 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawCap(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    const rgb = e.kind === 'pow' ? GOLD : ORG;
    c.fillStyle = rgba(rgb, 0.96);
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU;
      const px = Math.cos(a) * 8 * s;
      const py = Math.sin(a) * 8 * s;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.font = '700 ' + (9 * s) + 'px "Segoe UI","PingFang SC",sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.rotate(-e.spin);
    c.fillText(e.kind === 'pow' ? '火' : '卫', 0, 0.5 * s);
    c.restore();
  }

  function drawBoss(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    const flash = e.flash > 0;
    if (e.kind === 'tower') {
      c.fillStyle = rgba(flash ? WHT : [72, 44, 40], 0.96);
      c.fillRect(-28 * s, -72 * s, 56 * s, 144 * s);
      c.fillStyle = rgba(DEEP, 1);
      c.fillRect(-14 * s, -28 * s, 22 * s, 26 * s);
      c.fillStyle = rgba(GOLD, 0.5 + e.open * 0.5);
      c.beginPath();
      c.arc(-4 * s, -16 * s, 8 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(ORG, 0.7);
      for (let i = 0; i < 5; i++) {
        c.fillRect(-20 * s, -60 * s + i * 22 * s, 8 * s, 6 * s);
        c.fillRect(10 * s, -52 * s + i * 22 * s, 8 * s, 6 * s);
      }
      c.strokeStyle = rgba(STEEL, 0.7);
      c.lineWidth = Math.max(1, 2 * s);
      c.beginPath();
      c.arc(0, -40 * s, 16 * s, 0, TAU);
      c.stroke();
    } else if (e.kind === 'forge') {
      c.fillStyle = rgba(flash ? WHT : [88, 40, 28], 0.96);
      c.beginPath();
      c.moveTo(-48 * s, 8 * s);
      c.lineTo(-28 * s, -28 * s);
      c.lineTo(36 * s, -24 * s);
      c.lineTo(50 * s, 6 * s);
      c.lineTo(30 * s, 30 * s);
      c.lineTo(-30 * s, 32 * s);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(DEEP, 1);
      c.beginPath();
      c.arc(-8 * s, 0, 14 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(e.open > 0.5 ? GOLD : MOLT, 0.35 + e.open * 0.65);
      c.beginPath();
      c.arc(-8 * s, 0, (6 + e.open * 6) * s, 0, TAU);
      c.fill();
      if (e.open > 0.5) {
        c.strokeStyle = rgba(GOLD, 0.7);
        c.lineWidth = Math.max(1, 1.4 * s);
        c.beginPath();
        c.arc(-8 * s, 0, 18 * s, 0, TAU);
        c.stroke();
      }
    } else {
      c.fillStyle = rgba(flash ? WHT : [64, 36, 40], 0.96);
      c.beginPath();
      c.moveTo(-50 * s, 0);
      c.lineTo(-24 * s, -32 * s);
      c.lineTo(40 * s, -28 * s);
      c.lineTo(54 * s, 0);
      c.lineTo(40 * s, 28 * s);
      c.lineTo(-24 * s, 32 * s);
      c.closePath();
      c.fill();
      c.save();
      c.rotate(e.spin);
      c.strokeStyle = rgba(ORG, 0.85);
      c.lineWidth = Math.max(1, 2 * s);
      c.beginPath();
      c.arc(-6 * s, 0, 18 * s, 0, TAU);
      c.stroke();
      c.restore();
      c.fillStyle = rgba(DEEP, 1);
      c.beginPath();
      c.arc(-8 * s, 0, 12 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(e.open > 0.45 ? GOLD : ORG, 0.4 + e.open * 0.6);
      c.beginPath();
      c.arc(-8 * s, 0, (6 + e.open * 5) * s, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = scrX(e.wx);
      if (x < -70 || x > VW + 70) continue;
      if (e.type === 'scout') drawScout(e, x);
      else if (e.type === 'hover') drawHover(e, x);
      else if (e.type === 'turret') drawTurret(e, x);
      else if (e.type === 'walker') drawWalker(e, x);
      else if (e.type === 'gun') drawGun(e, x);
      else if (e.type === 'mine') drawMine(e, x);
      else if (e.type === 'carry') drawCarry(e, x);
      else if (e.type === 'slag') drawSlag(e, x);
      else if (e.type === 'cap') drawCap(e, x);
      else if (e.type === 'boss') drawBoss(e, x);
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = scrX(s.wx);
      const rgb = s.sat ? ORG : GOLD;
      c.fillStyle = rgba(rgb, 0.98);
      c.fillRect(sx(x), sy(s.y - 1.6), 10 * scale, 3.2 * scale);
      if (!REDUCE) {
        c.fillStyle = rgba(WHT, 0.5);
        c.fillRect(sx(x - 6), sy(s.y - 1), 6 * scale, 2 * scale);
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
    const b = findBoss();
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
    c.fillStyle = '#140806';
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
      g.addColorStop(0, '#1c0a06');
      g.addColorStop(0.55, '#160806');
      g.addColorStop(1, '#220c06');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#160808');
      g.addColorStop(0.55, '#120606');
      g.addColorStop(1, '#1a080a');
    } else {
      g.addColorStop(0, '#1a0c08');
      g.addColorStop(0.55, '#140806');
      g.addColorStop(1, '#1c0e0a');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawCity();
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
    G.kind = kind || 'city';
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
    G.cleared = 0;
    G.nextLife = LIFE_EVERY;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.opts = 0;
    G.pow = 0;
    G.sat.state = 'orbit';
    G.sat.ang = 0;
    G.sat.wx = 0;
    G.sat.y = 0;
    G.sat.vx = 0;
    G.sat.vy = 0;
    G.sat.spin = 0;
    G.sat.ramCd = 0;
    G.sat.fireCd = 0;
    G.sat.dockLock = 0;
    G.spawnedX = 0;
    G.fireCd = 0;
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
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    eid = 1;
  }

  function startGame(kind) {
    resetRun(kind || 'city');
    G.mode = 'play';
    hideOverlay();
    audio.start();
    toast(isRail() ? '轨道' : '末城', false, true);
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('city');
    G.mode = 'title';
    G.opts = 2;
    showOverlay('title', '末堡', '卫星环绕机体。Shift 射出当撞锤，飞过去接住，或再按收回。吃六角荚加卫星。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('city');
    else startGame(G.kind || 'city');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('city');
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
    const satKey = k === 'z' || k === 'Z' || k === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || satKey)) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || satKey)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (satKey) {
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      launchSat();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'rail' : 'city');
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
        launchSat();
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

  function bindSatBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      launchSat();
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

  if (btnCity) {
    btnCity.addEventListener('click', function () {
      audio.ensure();
      startGame('city');
    });
  }
  if (btnRail) {
    btnRail.addEventListener('click', function () {
      audio.ensure();
      startGame('rail');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'city');
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
  bindSatBtn(btnSat);
  bindSatBtn(btnPad);

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
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

  requestAnimationFrame(frame);
})();
