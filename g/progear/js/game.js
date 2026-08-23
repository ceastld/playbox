'use strict';

(function () {
  const VW = 720;
  const VH = 400;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const BOSS_AT = 9600;
  const STAGE_END = [3200, 6400, 9600];
  const BEST_KEY = 'playbox-progear-best';
  const MUTE_KEY = 'playbox-progear-mute';
  const AUTO_SPEED_KEY = 'playbox-progear-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.48, 0.72, 1, 2.55];
  const OPS = '←↑↓→ / WSD 移动 · 空格射击（松手吸弹）· A 自动 · R 重开 · M 静音';
  const STAGE_NAME = ['齿廊', '炉心', '主轴'];
  const RING_R = [0, 34, 46, 58];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 136];
  const CYN = [61, 255, 208];
  const GOLD = [255, 227, 107];
  const AMB = [255, 176, 32];
  const COP = [224, 112, 48];
  const WHT = [255, 244, 220];
  const PNK = [255, 154, 196];
  const DEEP = [26, 18, 6];
  const BRASS = [168, 112, 42];
  const RED = [255, 72, 88];

  const SCORE = {
    cog: 50, lead: 90, turret: 120, saw: 180,
    plane: 150, clock: 220, boss: 8000, gem: 24
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
  const btnGear = document.getElementById('btn-gear');
  const btnSea = document.getElementById('btn-sea');
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
  const modeLabel = document.getElementById('mode-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const gemWrap = document.getElementById('gem-wrap');
  const gemBar = document.getElementById('gem-bar');
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
  const bgGears = [];

  const G = {
    mode: 'title',
    kind: 'gear',
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
    gems: 0,
    rank: 1,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    gemsOn: [],
    spawnedX: 0,
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: AMB,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    boss: false,
    winT: 0,
    engine: 0,
    beat: 0,
    ringR: 34,
    ringFlash: 0,
    prop: 0,
    absCd: 0
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoTx = 88;
  let autoTy = VH * 0.5;
  let autoStickS = -1e9;
  let autoOvWait = 0;
  let autoFireT = 0;

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
  function isSea() {
    return G.kind === 'sea';
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
  function gearTooth(wx) {
    const p = 52;
    const m = ((wx % p) + p) % p;
    if (m < 18) {
      const u = m < 4 ? m / 4 : m > 14 ? (18 - m) / 4 : 1;
      return u * u * 13;
    }
    return 0;
  }
  function caveAt(wx) {
    const st = stageAt(wx);
    const n1 = fbm(wx * 0.00205, 5);
    const n2 = fbm(wx * 0.0032, 13);
    const tooth = gearTooth(wx);
    const heat = REDUCE ? 0 : Math.sin(G.t * 1.85 + wx * 0.009) * (st === 2 ? 7 : 2.4);
    let top;
    let bot;
    if (st === 1) {
      top = 14 + n1 * 22 + tooth * 0.55;
      bot = VH - 16 - n2 * 24 - tooth * 0.6;
    } else if (st === 2) {
      top = 22 + n1 * 38 + tooth * 0.85 + heat;
      bot = VH - 22 - n2 * 40 - tooth * 0.9 - heat;
    } else {
      top = 28 + n1 * 44 + tooth * 1.05;
      bot = VH - 28 - n2 * 46 - tooth * 1.1;
    }
    if (wx < 420) {
      const t = wx / 420;
      top = lerp(12, top, t);
      bot = lerp(VH - 12, bot, t);
    }
    if (G.boss) {
      top = Math.min(top, 38);
      bot = Math.max(bot, VH - 38);
    }
    if (top > bot - 88) {
      const mid = (top + bot) * 0.5;
      top = mid - 44;
      bot = mid + 44;
    }
    return { top: top, bot: bot };
  }
  function gemRank(n) {
    if (n >= 18) return 3;
    if (n >= 7) return 2;
    return 1;
  }
  function ringOn() {
    return G.mode === 'play' && G.deadT <= 0 && !G.fireHold;
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
      this.beep(520, 0.045, 'square', 0.03, 980);
      this.beep(880, 0.03, 'triangle', 0.016, 1400);
    },
    absorb(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.7, combo * 0.04);
      this.beep(740 * lift, 0.07, 'sine', 0.038, 1180 * lift);
      this.beep(1180 * lift, 0.05, 'triangle', 0.022, 1760);
    },
    gem(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.8, combo * 0.045);
      this.beep(523 * lift, 0.06, 'square', 0.036, 784 * lift);
      this.beep(784 * lift, 0.1, 'sine', 0.028, 1046 * lift);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.038, 0.03, 1100);
      this.beep(420 * lift, 0.07, 'square', 0.036, 720 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    rank() {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.042, 784);
      this.beep(659, 0.1, 'triangle', 0.036, 1046);
      this.beep(1046, 0.16, 'sine', 0.03, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.07, 240);
      this.beep(260, 0.24, 'sawtooth', 0.05, 58);
      this.beep(130, 0.34, 'sine', 0.04, 40);
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
      this.beep(196, 0.1, 'sine', 0.04, 392);
      this.beep(294, 0.14, 'triangle', 0.038, 587);
      this.beep(392, 0.2, 'sawtooth', 0.028, 784);
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
      this.beep(494, 0.12, 'triangle', 0.034, 784);
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

  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '齿轮';
      else if (G.boss) stageLabel.textContent = '巨轮';
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + (STAGE_NAME[G.stage - 1] || '');
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isSea() ? '弹海' : '齿轮';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isSea());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    syncModeLabel();
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else comboEl.hidden = true;
    }
    if (gemWrap && gemBar) {
      const show = G.mode === 'play' || G.mode === 'title';
      gemWrap.hidden = !show;
      const next = G.rank >= 3 ? 30 : (G.rank === 2 ? 18 : 7);
      const prev = G.rank >= 3 ? 18 : (G.rank === 2 ? 7 : 0);
      const p = G.rank >= 3 ? 1 : clamp((G.gems - prev) / Math.max(1, next - prev), 0, 1);
      gemBar.style.transform = 'scaleX(' + p + ')';
    }
    const boss = findBoss();
    if (hpWrap) {
      const show = !!(G.boss && boss && boss.alive && G.mode === 'play');
      hpWrap.hidden = !show;
      if (show && hpBar) {
        hpBar.style.transform = 'scaleX(' + clamp(boss.hp / boss.max, 0, 1) + ')';
      }
    }
    if (autoOn && (G.mode === 'play' || G.mode === 'title')) setHint('托管中 · A 停下', 'hot');
    else if (autoOn && (G.mode === 'lose' || G.mode === 'win')) setHint('托管中 · R 重开接着打', 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 松手把弹丸吸成宝石', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 巨轮拆了', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 松手吸弹 · 撞壁也掉命', 'warn');
    else if (G.boss) setHint('打核心 · 松手吸弹海 · 撞齿即死', 'hot');
    else if (G.rank >= 3) setHint('环已满开 · 松手真空弹丸', 'hot');
    else setHint('按住开火 · 松手吸弹成宝石 · 撞壁掉命 · A 自动', '');
    syncPips();
  }

  function syncModeLabel() {
    if (!modeLabel) return;
    const on = ringOn() || (G.mode === 'title' && !G.fireHold);
    modeLabel.textContent = on ? '环' : '枪';
    modeLabel.className = 'wpn ' + (on ? 'ring' : 'gun');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'PROG';
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
      floatText(G.px + 18, G.py - 22, '×' + G.mult, GOLD, true);
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
    capArr(G.ents, 130);
  }

  function moveSpd() {
    return isSea() ? 168 : 150;
  }

  function scrollSpd() {
    if (G.boss) {
      const b = findBoss();
      if (b && b.alive) {
        const x = scrX(b.wx);
        if (x < VW * 0.58) return isSea() ? 42 : 26;
        if (x < VW * 0.7) return 10;
        return 0;
      }
    }
    const base = isSea() ? 118 : 90;
    return base + (G.stage - 1) * 8 + Math.min(18, G.combo * 0.5);
  }

  function spawnCogWave(wx, y, n, leadI) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 26, cave.bot - 26);
    const sea = isSea();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'cog',
        wx: wx + i * 20,
        y: y + (i - (n - 1) * 0.5) * 10,
        hw: 9, hh: 9,
        hp: 1,
        vx: -(sea ? 96 : 74),
        phase: i * 0.6,
        spin: rand(0, TAU),
        lead: i === leadI,
        cd: 0.4 + i * 0.1
      });
    }
  }

  function spawnTurret(wx, ceil) {
    const cave = caveAt(wx);
    const y = ceil ? cave.top + 14 : cave.bot - 14;
    if (occupied(wx, y, 34)) return;
    pushEnt({
      type: 'turret',
      wx: wx, y: y,
      hw: 12, hh: 11,
      hp: isSea() ? 4 : 5,
      max: isSea() ? 4 : 5,
      ceil: !!ceil,
      cd: rand(0.4, 1.1),
      ang: ceil ? 1.2 : -1.2
    });
  }

  function spawnSaw(wx) {
    const cave = caveAt(wx);
    if (occupied(wx, (cave.top + cave.bot) * 0.5, 40)) return;
    pushEnt({
      type: 'saw',
      wx: wx,
      y: (cave.top + cave.bot) * 0.5,
      hw: 14, hh: 14,
      hp: isSea() ? 6 : 7,
      max: isSea() ? 6 : 7,
      phase: rand(0, TAU),
      spin: 0,
      cd: rand(0.8, 1.6)
    });
  }

  function spawnPlane(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 30, cave.bot - 30);
    pushEnt({
      type: 'plane',
      wx: wx, y: y,
      hw: 14, hh: 8,
      hp: 3, max: 3,
      vx: -(isSea() ? 110 : 88),
      phase: rand(0, TAU),
      cd: 0.5
    });
  }

  function spawnClock(wx, ceil) {
    const cave = caveAt(wx);
    const y = ceil ? cave.top + 18 : cave.bot - 18;
    if (occupied(wx, y, 40)) return;
    pushEnt({
      type: 'clock',
      wx: wx, y: y,
      hw: 13, hh: 13,
      hp: isSea() ? 6 : 7,
      max: isSea() ? 6 : 7,
      ceil: !!ceil,
      spin: 0,
      cd: rand(0.6, 1.3),
      hand: rand(0, TAU)
    });
  }

  function spawnSlice(wx) {
    if (G.boss) return;
    if (wx < 300) return;
    if (wx > BOSS_AT - 200) return;
    const st = stageAt(wx);
    const slice = (wx / 50) | 0;
    const h = hash2(slice * 23 + (isSea() ? 9 : 2) + G.stage * 13);
    const cave = caveAt(wx);
    const mid = (cave.top + cave.bot) * 0.5;
    const dens = isSea() ? 0.68 : 1;
    const waveEvery = isSea() ? 3 : 4;

    if (slice % waveEvery === 0 && h > 0.12 * dens) {
      const y = lerp(cave.top + 42, cave.bot - 42, hash2(slice + 51));
      const n = (isSea() ? 6 : 5) + (st === 3 ? 1 : 0);
      spawnCogWave(wx, y, n, h > 0.48 ? 0 : -1);
    }
    if (slice % 8 === 3 && h > 0.28) {
      spawnCogWave(wx + 10, mid + (h > 0.5 ? 40 : -40), isSea() ? 5 : 4, 0);
    }
    if (st >= 1 && slice % (isSea() ? 5 : 6) === 2 && h > 0.24 * dens) {
      spawnTurret(wx, h > 0.5);
      if (isSea() && h > 0.7) spawnTurret(wx + 36, h <= 0.5);
    }
    if (st >= 2 && slice % (isSea() ? 5 : 7) === 1 && h > 0.22) {
      spawnSaw(wx);
    }
    if (st >= 1 && slice % (isSea() ? 6 : 8) === 4 && h > 0.3) {
      spawnPlane(wx, lerp(cave.top + 50, cave.bot - 50, hash2(slice + 7)));
    }
    if (st >= 3 && slice % (isSea() ? 5 : 6) === 2) {
      spawnClock(wx, h > 0.52);
      if (isSea() && h > 0.66) spawnClock(wx + 44, h <= 0.52);
    }
    if (st === 2 && slice % 9 === 5 && h > 0.2) {
      spawnPlane(wx, mid - 30);
      spawnPlane(wx + 28, mid + 30);
    }
  }

  function spawnBoss() {
    G.boss = true;
    const hp = isSea() ? 142 : 110;
    const cave = caveAt(G.cam + VW * 0.74);
    const hy = (cave.top + cave.bot) * 0.5;
    pushEnt({
      type: 'boss',
      wx: G.cam + VW * 0.94,
      y: hy,
      hw: 48, hh: 48,
      hp: hp,
      max: hp,
      spin: 0,
      phase: 0,
      cd: 0.8,
      angry: false,
      coreR: 18
    });
    toast('巨轮咬合', false, true);
    audio.check();
    kick(4.4);
    screenFlash(AMB, 0.4);
    syncHud();
  }

  function trySpawn() {
    if (!G.boss && G.mode === 'play') {
      if (G.cam + VW * 0.7 >= BOSS_AT) spawnBoss();
    }
    if (G.boss) return;
    const ahead = G.cam + VW + 90;
    while (G.spawnedX < ahead) {
      G.spawnedX += 50;
      spawnSlice(G.spawnedX);
    }
  }

  function seedMotes() {
    motes.length = 0;
    bgGears.length = 0;
    for (let i = 0; i < 52; i++) {
      motes.push({
        wx: hash2(i * 17) * 3200,
        y: 18 + hash2(i * 91 + 3) * (VH - 36),
        s: 0.5 + hash2(i * 5 + 9) * 2.0,
        p: 0.16 + hash2(i * 13) * 0.72,
        rgb: hash2(i * 3) > 0.55 ? AMB : GOLD
      });
    }
    for (let i = 0; i < 10; i++) {
      bgGears.push({
        wx: 180 + i * 420 + hash2(i * 8) * 80,
        y: hash2(i + 21) > 0.5 ? 46 : VH - 46,
        r: 18 + hash2(i * 4) * 16,
        teeth: 8 + ((hash2(i * 11) * 5) | 0),
        spin: hash2(i) * TAU,
        spd: (hash2(i + 3) > 0.5 ? 1 : -1) * (0.4 + hash2(i + 7) * 0.7),
        p: 0.28 + hash2(i + 9) * 0.25
      });
    }
  }

  function spawnGem(x, y, val) {
    G.gemsOn.push({
      x: x, y: y,
      vx: rand(-40, 60),
      vy: rand(-70, 50),
      val: val || SCORE.gem,
      r: 5 + Math.min(4, (val || 24) * 0.04),
      life: 4.2,
      t: 0
    });
    capArr(G.gemsOn, 80);
  }

  function collectGem(g) {
    G.gems += 1;
    const prev = G.rank;
    G.rank = gemRank(G.gems);
    bumpCombo();
    const n = Math.round((g.val || SCORE.gem) * G.mult);
    addScore(n);
    audio.gem(G.combo);
    emit(7, {
      x: g.x, y: g.y, j: 4,
      vx0: -40, vx1: 80, vy0: -90, vy1: 40,
      r0: 1.2, r1: 3.2, life: 0.28, rgb: GOLD, g: 40
    });
    floatText(g.x, g.y - 10, '+' + n, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    if (G.rank > prev) {
      toast(G.rank >= 3 ? '环 MAX' : '环 ×' + G.rank, false, true);
      audio.rank();
      hitStop(0.045);
      kick(3.2);
      screenFlash(GOLD, 0.38);
      popSpark(G.px, G.py, GOLD, 26);
    } else {
      hitStop(0.018);
    }
    syncHud();
  }

  function award(kind, x, y) {
    bumpCombo();
    const n = (SCORE[kind] || 10) * G.mult;
    addScore(n);
    const gold = kind === 'boss' || kind === 'clock' || G.mult >= 3;
    floatText(scrX(x) < 0 ? G.px : scrX(x), y - 8, '+' + n, gold ? GOLD : WHT, gold);
    const drops = kind === 'boss' ? 8 : kind === 'saw' || kind === 'clock' || kind === 'plane' ? 3 : 1;
    for (let i = 0; i < drops; i++) {
      spawnGem(scrX(x) + rand(-10, 10), y + rand(-8, 8), kind === 'boss' ? 80 : 36);
    }
  }

  function enemyShot(wx, y, vx, vy, r) {
    G.eShots.push({
      wx: wx, y: y, vx: vx, vy: vy,
      r: r || 3.3, life: 3.8
    });
    capArr(G.eShots, isSea() ? 140 : 110);
  }

  function pushShot(s) {
    G.shots.push(s);
    capArr(G.shots, 90);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const rk = G.rank;
    G.fireCd = rk >= 3 ? 0.082 : rk >= 2 ? 0.096 : 0.112;
    G.muzzle = 0.055;
    audio.shoot();
    const wx = pwx() + 12;
    const shots = rk >= 3 ? 3 : rk >= 2 ? 2 : 1;
    for (let i = 0; i < shots; i++) {
      let oy2 = 0;
      let vy = 0;
      if (shots === 2) oy2 = i === 0 ? -5 : 5;
      if (shots === 3) {
        oy2 = (i - 1) * 7;
        vy = (i - 1) * 42;
      }
      pushShot({
        wx: wx, y: G.py + oy2,
        vx: 540, vy: vy,
        hw: 8, hh: 2.4,
        life: 0.7,
        hit: {},
        dmg: 1
      });
    }
  }

  function absorbBullet(s) {
    const x = scrX(s.wx);
    spawnGem(x, s.y, 28 + Math.min(20, G.combo));
    emit(5, {
      x: x, y: s.y, j: 3,
      vx0: -30, vx1: 50, vy0: -50, vy1: 40,
      r0: 1, r1: 2.4, life: 0.2, rgb: GOLD, g: 20
    });
    popSpark(x, s.y, GOLD, 8);
    if (G.absCd <= 0) {
      audio.absorb(G.combo);
      G.absCd = 0.038;
    }
    G.ringFlash = 0.1;
    hitStop(0.022);
  }

  function killPlayer() {
    if (G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.9;
    G.fireHold = false;
    breakCombo();
    explode(G.px, G.py, MAG, 28);
    emit(16, {
      x: G.px, y: G.py, j: 8,
      vx0: -260, vx1: 160, vy0: -200, vy1: 180,
      r0: 2, r1: 6, life: 0.5, rgb: MAG, g: 140
    });
    G.eShots.length = 0;
    G.gems = 0;
    G.rank = 1;
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
    if (e.type === 'boss') return hurtBoss(e, dmg, sxw, syw);
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
    const rgb = e.lead ? GOLD : (e.type === 'saw' || e.type === 'clock' ? COP : AMB);
    explode(sxw, syw, rgb, e.type === 'saw' ? 22 : 15);
    hitStop(e.type === 'saw' || e.type === 'clock' ? 0.052 : 0.038);
    kick(e.type === 'saw' ? 3.6 : 2.4);
    award(kind, e.wx, e.y);
    return true;
  }

  function hurtBoss(e, dmg, sxw, syw) {
    const dx = sxw - scrX(e.wx);
    const dy = syw - e.y;
    const d = hypot(dx, dy);
    const actual = d < e.coreR + 10 ? dmg : dmg * 0.38;
    e.hp -= actual;
    e.flash = 0.09;
    audio.hit(G.combo + 2);
    emit(7, {
      x: sxw, y: syw, j: 5,
      vx0: -100, vx1: 160, vy0: -100, vy1: 80,
      r0: 1.4, r1: 3.4, life: 0.26, rgb: d < e.coreR + 10 ? GOLD : COP, g: 50
    });
    bumpCombo();
    addScore(Math.round(28 * G.mult * (d < e.coreR + 10 ? 1 : 0.4)));
    hitStop(d < e.coreR + 10 ? 0.05 : 0.03);
    kick(d < e.coreR + 10 ? 3.4 : 1.8);
    if (e.hp <= 0) {
      killBoss(e);
      return true;
    }
    if (!e.angry && e.hp < e.max * 0.46) {
      e.angry = true;
      toast('巨轮狂转', true, false);
      screenFlash(MAG, 0.32);
    }
    syncHud();
    return false;
  }

  function killBoss(e) {
    e.alive = false;
    e.hp = 0;
    G.eShots.length = 0;
    explode(scrX(e.wx), e.y, GOLD, 40);
    popSpark(scrX(e.wx), e.y, AMB, 44);
    for (let k = 0; k < 14; k++) {
      spawnGem(scrX(e.wx) + rand(-30, 30), e.y + rand(-28, 28), 90);
    }
    audio.boom();
    hitStop(0.085);
    kick(9);
    screenFlash(GOLD, 0.62);
    award('boss', e.wx, e.y);
    addScore(1800 * G.mult);
    addScore(6000);
    floatText(VW * 0.5, VH * 0.4, '巨轮拆了', GOLD, true);
    G.winT = 1.55;
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    audio.win();
    showOverlay('win', '巨轮拆了', isSea()
      ? '弹海走穿。齿轮环还在耳膜里转。'
      : '三关走穿，巨轮炸成宝石。齿廊还在咬合。');
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '齿轮咬住了', '三命耗尽。黄铜还在咬。R 再咬一次。');
    syncHud();
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
    autoFireT = 0;
    autoClearInput();
    autoTx = G.px;
    autoTy = G.py;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame('gear');
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
        startGame('gear');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.65 : 1.1)) {
        autoOvWait = 0;
        startGame(G.kind || 'gear');
      }
    }
  }

  function autoDanger(sx, sy, horizon) {
    let d = 0;
    const wx = G.cam + sx;
    const scroll = scrollSpd();
    for (let k = 0; k < 12; k++) {
      const ahead = k * 28;
      const c = caveAt(wx + ahead);
      const w = 1.25 + (11 - k) * 0.15;
      const m = 16;
      if (sy < c.top + m) d += (c.top + m - sy) * 26 * w;
      if (sy > c.bot - m) d += (sy - (c.bot - m)) * 26 * w;
      if (sy < c.top + 12 || sy > c.bot - 12) d += 540 * w;
      const gap = c.bot - c.top;
      if (gap < 110) d += (110 - gap) * 0.75 * w;
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
      const rad = 6.4 + s.r * 0.55;
      if (t <= horizon && dist < rad + 36) {
        const soon = (horizon - t) / Math.max(0.08, horizon);
        d += Math.max(0.5, rad + 12 - dist) * soon * 26;
        if (dist < rad) d += 250 * soon;
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const hits = [];
      if (e.type === 'boss') {
        hits.push({ x: e.wx, y: e.y, ew: 46, eh: 46, w: 24 });
      } else if (e.type === 'saw') {
        hits.push({ x: e.wx, y: e.y, ew: 15, eh: 15, w: 32 });
      } else if (e.type === 'clock') {
        hits.push({ x: e.wx, y: e.y, ew: e.hw, eh: e.hh, w: 18 });
        hits.push({
          x: e.wx + Math.cos(e.hand) * 22,
          y: e.y + Math.sin(e.hand) * 22,
          ew: 7, eh: 7, w: 28
        });
      } else {
        hits.push({
          x: e.wx, y: e.y,
          ew: e.hw * 0.85, eh: e.hh * 0.85,
          w: e.type === 'plane' ? 16 : 14
        });
      }
      for (let h = 0; h < hits.length; h++) {
        const p = hits[h];
        const relx = p.x - wx;
        const rely = p.y - sy;
        const rvx = (e.vx || 0) - scroll;
        const rvy = e.vy || 0;
        const vv = rvx * rvx + rvy * rvy;
        let t = 0;
        if (vv > 1) t = clamp(-(relx * rvx + rely * rvy) / vv, 0, horizon);
        const dist = hypot(relx + rvx * t, rely + rvy * t);
        const hitR = 7 + Math.max(p.ew, p.eh);
        if (dist < hitR + 30) {
          const soon = (horizon - t) / Math.max(0.08, horizon);
          d += Math.max(0.4, hitR + 14 - dist) * soon * p.w;
          if (dist < hitR) d += 270 * soon;
        }
        if (Math.abs(p.x - wx) < p.ew + 10 && Math.abs(p.y - sy) < p.eh + 8) d += 150;
      }
    }
    return d;
  }

  function autoThink() {
    if (!autoOn) return;
    if (G.mode !== 'play' || G.deadT > 0) {
      G.fireHold = false;
      return;
    }

    const dense = isSea();
    const horizon = dense ? 0.58 : 0.48;
    const px = G.px;
    const py = G.py;
    const wx = pwx();
    const scroll = scrollSpd();
    const rr = RING_R[G.rank] || 34;

    let aimX = null;
    let aimY = null;
    let aimW = -1e9;
    let nearbyShots = 0;
    let colShots = 0;
    let inRing = 0;
    let incoming = 0;
    let closeBody = false;
    let boss = null;
    let gem = null;
    let gemW = -1e9;

    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const esx = scrX(e.wx);
      if (esx < -40 || esx > VW + 50) continue;
      let w = 36 + (e.hp || 1) * 6;
      if (e.type === 'boss') {
        boss = e;
        w = 320 + e.hp * 0.45;
      } else if (e.type === 'plane') w = 96 + e.hp * 8;
      else if (e.type === 'saw') w = 72;
      else if (e.type === 'cog') w = e.lead ? 84 : 52;
      else if (e.type === 'turret') w = 22;
      else if (e.type === 'clock') w = 26;
      w -= Math.abs(e.y - py) * 0.3;
      w -= Math.max(0, esx - px) * 0.07;
      if (esx < px - 8) w -= 90;
      if (esx < px + 58 && Math.abs(e.y - py) < 22 && e.type !== 'turret' && e.type !== 'clock') {
        closeBody = true;
        w -= 70;
      }
      if (w > aimW) {
        aimW = w;
        aimX = esx;
        aimY = e.y;
      }
    }

    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = scrX(s.wx);
      const dist = hypot(x - px, s.y - py);
      if (dist < 150) nearbyShots += 1;
      if (Math.abs(x - px) < 14 && x > px - 8 && Math.abs(s.y - py) < 10) colShots += 1;
      if (dist < rr + s.r + 6) inRing += 1;
      const relx = s.wx - wx;
      const rely = s.y - py;
      const rvx = s.vx - scroll;
      const rvy = s.vy;
      const vv = rvx * rvx + rvy * rvy;
      if (vv > 1) {
        const t = clamp(-(relx * rvx + rely * rvy) / vv, 0, 0.3);
        const d = hypot(relx + rvx * t, rely + rvy * t);
        if (d < rr + 16 && t < 0.3) incoming += 1;
      }
    }

    for (let i = 0; i < G.gemsOn.length; i++) {
      const g = G.gemsOn[i];
      let w = 64 - hypot(g.x - px, g.y - py) * 0.4;
      if (g.x > px - 10) w += 12;
      if (w > gemW) {
        gemW = w;
        gem = g;
      }
    }

    const hereDang = autoDanger(px, py, horizon);
    const panic = hereDang > 92 || (G.lives <= 1 && hereDang > 58);
    const grabGem = gem && !panic && (G.invuln > 0.12 || autoDanger(gem.x, gem.y, 0.26) < 48 || hypot(gem.x - px, gem.y - py) < 70);

    let desiredX = G.boss ? 78 : 102;
    let desiredY = aimY != null ? aimY : caveAt(wx).top * 0.5 + caveAt(wx).bot * 0.5;
    if (hereDang > 80) desiredX = 52;
    else if (nearbyShots >= (dense ? 5 : 6)) desiredX = 66;
    else if (boss) desiredX = 82;
    if (aimX != null && aimX < px + 150 && !closeBody && !boss) {
      desiredX = clamp(aimX - 92, 48, 190);
    }
    if (closeBody) desiredX = Math.min(desiredX, 70);
    if (panic) desiredX = Math.min(desiredX, 56);
    if (colShots >= 1) {
      desiredY = clamp(py + (py > VH * 0.5 ? -42 : 42), 24, VH - 24);
      desiredX = clamp(px + (px < 90 ? 28 : -36), 40, VW * 0.5);
    }
    if (grabGem && gem) {
      desiredX = clamp(gem.x, 40, VW * 0.5);
      desiredY = gem.y;
    }

    const xMin = 28;
    const xMax = VW * 0.52;
    const yMin = 16;
    const yMax = VH - 16;
    let bestX = clamp(autoTx, xMin, xMax);
    let bestY = clamp(autoTy, yMin, yMax);
    let bestS = -1e15;

    function consider(x, y) {
      x = clamp(x, xMin, xMax);
      const c = caveAt(G.cam + x);
      y = clamp(y, Math.max(yMin, c.top + 16), Math.min(yMax, c.bot - 16));
      let s = -autoDanger(x, y, horizon) * (dense ? 7.3 : 6.05);
      s -= Math.abs(x - desiredX) * (boss ? 0.62 : 0.48);
      s -= Math.abs(y - desiredY) * (boss || (aimY != null && Math.abs(aimY - py) < 40) ? 1.05 : 0.86);
      s -= hypot(x - px, y - py) * 0.11;
      if (y < c.top + 22 || y > c.bot - 22) s -= 28;
      if (x < 40 || x > VW * 0.48) s -= 12;
      if (aimY != null && Math.abs(y - aimY) < 12 && !closeBody) s += 20;
      if (boss && aimY != null && Math.abs(y - aimY) < 14) s += 26;
      if (grabGem && gem) s -= hypot(x - gem.x, y - gem.y) * 0.42;
      if (s > bestS) {
        bestS = s;
        bestX = x;
        bestY = y;
      }
    }

    consider(px, py);
    consider(autoTx, autoTy);
    consider(desiredX, desiredY);
    for (let ix = 0; ix < 6; ix++) {
      const x = 36 + ix * ((xMax - 48) / 5);
      for (let iy = 0; iy < 9; iy++) {
        consider(x, 22 + iy * ((VH - 44) / 8));
      }
    }
    if (aimY != null) {
      consider(desiredX, aimY);
      consider(px, aimY);
      consider(86, aimY);
      consider(desiredX, aimY - 28);
      consider(desiredX, aimY + 28);
    }
    if (grabGem && gem) consider(gem.x, gem.y);
    consider(px, py - 48);
    consider(px, py + 48);
    consider(px - 40, py);
    consider(px + 40, py);
    consider(px - 24, py - 32);
    consider(px - 24, py + 32);
    consider(px + 28, py - 24);
    consider(px + 28, py + 24);
    consider(desiredX, clamp(desiredY - 36, yMin, yMax));
    consider(desiredX, clamp(desiredY + 36, yMin, yMax));

    let switchGap = hereDang > 48 ? 8 : 22;
    if (Math.abs(desiredY - py) > 36 || grabGem) switchGap = Math.min(switchGap, 5);
    if (bestS > autoStickS + switchGap || hereDang > 55 || hypot(autoTx - px, autoTy - py) < 4) {
      autoTx = bestX;
      autoTy = bestY;
      autoStickS = bestS;
    }

    const lined = aimY != null && Math.abs(aimY - py) < 18 && aimX != null && aimX > px + 16;
    const absorbNow = inRing >= 2 || incoming >= 3
      || (panic && (inRing >= 1 || incoming >= 2))
      || (G.invuln > 0.18 && inRing + incoming >= 1)
      || (!lined && incoming >= 1 && inRing >= 1);
    autoFireT += STEP;
    if (absorbNow) {
      G.fireHold = false;
      if (autoFireT > 0.28 && inRing === 0 && incoming < 2) {
        G.fireHold = true;
        autoFireT = 0;
      }
    } else {
      G.fireHold = true;
      if (autoFireT > 0.48 && (inRing >= 1 || incoming >= 1)) {
        G.fireHold = false;
        autoFireT = 0;
      }
    }
  }

  function updatePlayer(dt) {
    const spd = moveSpd();
    if (autoOn) {
      const ax = autoTx - G.px;
      const ay = autoTy - G.py;
      const d = hypot(ax, ay);
      const boost = autoSpeed >= 4 ? 1.22 : autoSpeed >= 3 ? 1.06 : autoSpeed <= 1 ? 0.86 : 0.96;
      if (d > 1.2) {
        const step = Math.min(d, spd * dt * boost);
        G.px += ax / d * step;
        G.py += ay / d * step;
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
    G.prop += dt * (G.fireHold ? 28 : 16);
    const want = ringOn() ? RING_R[G.rank] : 11;
    G.ringR = lerp(G.ringR, want, Math.min(1, dt * 9));
    if (G.ringFlash > 0) G.ringFlash -= dt;
    syncModeLabel();
  }

  function updateBoss(e, dt) {
    e.phase += dt;
    e.spin += dt * (e.angry ? 2.4 : 1.15);
    const cave = caveAt(e.wx);
    const mid = (cave.top + cave.bot) * 0.5;
    const amp = (cave.bot - cave.top) * 0.22;
    let ty = mid + Math.sin(e.phase * 1.15) * amp;
    ty = lerp(ty, G.py, e.angry ? 0.1 : 0.05);
    e.y = clamp(ty, cave.top + 54, cave.bot - 54);
    const want = G.cam + VW * (e.angry ? 0.68 : 0.73);
    e.wx += (want - e.wx) * Math.min(1, dt * 1.5);
    if (e.wx > G.cam + VW * 0.88) e.wx -= 36 * dt;

    e.cd -= dt;
    if (e.cd <= 0 && G.mode === 'play' && G.deadT <= 0) {
      const rage = e.angry;
      const sea = isSea();
      e.cd = rage ? (sea ? 0.36 : 0.46) : (sea ? 0.52 : 0.68);
      const n = rage ? (sea ? 16 : 14) : (sea ? 12 : 10);
      const sp = (sea ? 150 : 128) * (rage ? 1.18 : 1);
      const base = e.spin;
      for (let k = 0; k < n; k++) {
        const a = base + k * TAU / n;
        enemyShot(e.wx + Math.cos(a) * 36, e.y + Math.sin(a) * 36, Math.cos(a) * sp, Math.sin(a) * sp, rage ? 3.8 : 3.3);
      }
      if (rage) {
        const ang = Math.atan2(G.py - e.y, pwx() - e.wx);
        const fan = sea ? 5 : 4;
        for (let k = 0; k < fan; k++) {
          const a = ang + (k - (fan - 1) * 0.5) * 0.18;
          enemyShot(e.wx - 10, e.y, Math.cos(a) * (sp * 0.92), Math.sin(a) * (sp * 0.92), 3.6);
        }
      }
    }
  }

  function updateEnts(dt) {
    const sea = isSea();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.flash > 0) e.flash -= dt;
      if (scrX(e.wx) < -90 && e.type !== 'boss') {
        e.alive = false;
        continue;
      }

      if (e.type === 'cog') {
        e.wx += e.vx * dt;
        e.phase += dt * 3.1;
        e.spin += dt * 4.2;
        e.y += Math.sin(e.phase) * 48 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        e.cd = (e.cd || 0) - dt;
        if (e.lead && e.cd <= 0 && G.mode === 'play' && G.deadT <= 0) {
          e.cd = sea ? 0.95 : 1.28;
          const ang = Math.atan2(G.py - e.y, pwx() - e.wx);
          enemyShot(e.wx - 6, e.y, Math.cos(ang) * (sea ? 168 : 138), Math.sin(ang) * (sea ? 168 : 138), 3.1);
        }
      } else if (e.type === 'turret') {
        const cave = caveAt(e.wx);
        e.y = e.ceil ? cave.top + 14 : cave.bot - 14;
        e.ang = Math.atan2(G.py - e.y, pwx() - e.wx);
        e.cd -= dt;
        if (e.cd <= 0 && G.mode === 'play' && G.deadT <= 0 && scrX(e.wx) < VW - 20) {
          e.cd = sea ? 0.78 : 1.05;
          const sp = sea ? 176 : 146;
          enemyShot(e.wx, e.y + (e.ceil ? 8 : -8), Math.cos(e.ang) * sp, Math.sin(e.ang) * sp, 3.4);
          if (sea) {
            enemyShot(e.wx, e.y + (e.ceil ? 8 : -8), Math.cos(e.ang + 0.16) * sp * 0.9, Math.sin(e.ang + 0.16) * sp * 0.9, 3);
          }
        }
      } else if (e.type === 'saw') {
        const cave = caveAt(e.wx);
        e.phase += dt * (sea ? 1.7 : 1.35);
        const mid = (cave.top + cave.bot) * 0.5;
        const amp = (cave.bot - cave.top) * 0.28;
        e.y = clamp(mid + Math.sin(e.phase) * amp, cave.top + 22, cave.bot - 22);
        e.spin += dt * 5.5;
        e.cd -= dt;
        if (e.cd <= 0 && G.mode === 'play' && G.deadT <= 0) {
          e.cd = sea ? 1.05 : 1.4;
          for (let k = 0; k < (sea ? 6 : 4); k++) {
            const a = e.spin + k * TAU / (sea ? 6 : 4);
            enemyShot(e.wx, e.y, Math.cos(a) * 90, Math.sin(a) * 90, 3);
          }
        }
      } else if (e.type === 'plane') {
        e.wx += e.vx * dt;
        e.phase += dt * 2.4;
        e.y += Math.sin(e.phase) * 36 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 18, cave.bot - 18);
        e.cd -= dt;
        if (e.cd <= 0 && G.mode === 'play' && G.deadT <= 0) {
          e.cd = sea ? 0.72 : 0.98;
          enemyShot(e.wx - 10, e.y, -(sea ? 170 : 140), 0, 3.2);
          enemyShot(e.wx - 8, e.y - 6, -(sea ? 160 : 130), -40, 3);
          enemyShot(e.wx - 8, e.y + 6, -(sea ? 160 : 130), 40, 3);
        }
      } else if (e.type === 'clock') {
        const cave = caveAt(e.wx);
        e.y = e.ceil ? cave.top + 18 : cave.bot - 18;
        e.spin += dt * 1.6;
        e.hand += dt * (sea ? 2.4 : 1.8);
        e.cd -= dt;
        if (e.cd <= 0 && G.mode === 'play' && G.deadT <= 0) {
          e.cd = sea ? 0.85 : 1.15;
          const n = sea ? 8 : 6;
          for (let k = 0; k < n; k++) {
            const a = e.hand + k * TAU / n;
            enemyShot(e.wx + Math.cos(a) * 12, e.y + Math.sin(a) * 12, Math.cos(a) * 120, Math.sin(a) * 120, 3.2);
          }
        }
      } else if (e.type === 'boss') {
        updateBoss(e, dt);
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        let hit = false;
        if (e.type === 'boss') {
          const d = hypot(pwx() - e.wx, G.py - e.y);
          hit = d < 46;
        } else if (e.type === 'saw') {
          hit = hypot(pwx() - e.wx, G.py - e.y) < 15;
        } else if (e.type === 'clock') {
          const hx = e.wx + Math.cos(e.hand) * 22;
          const hy = e.y + Math.sin(e.hand) * 22;
          hit = aabb(pwx(), G.py, 6, 4, e.wx, e.y, e.hw, e.hh)
            || hypot(pwx() - hx, G.py - hy) < 7;
        } else {
          hit = aabb(pwx(), G.py, 6, 4.2, e.wx, e.y, e.hw * 0.85, e.hh * 0.85);
        }
        if (hit) killPlayer();
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      if (s.life <= 0 || x > VW + 40 || x < -40 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let dead = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        if (s.hit[e.id]) continue;
        let hit = false;
        if (e.type === 'boss') {
          hit = hypot(s.wx - e.wx, s.y - e.y) < 52;
        } else {
          hit = aabb(s.wx, s.y, s.hw, s.hh, e.wx, e.y, e.hw, e.hh);
        }
        if (hit) {
          s.hit[e.id] = true;
          hurtEnt(e, s.dmg || 1, x, s.y);
          dead = true;
          break;
        }
      }
      if (dead) G.shots.splice(i, 1);
    }

    const absorbing = ringOn();
    const rr = G.ringR;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      if (s.life <= 0 || x < -36 || x > VW + 44 || s.y < -24 || s.y > VH + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        const d = hypot(x - G.px, s.y - G.py);
        if (absorbing && d < rr + s.r) {
          absorbBullet(s);
          G.eShots.splice(i, 1);
          continue;
        }
        if (G.invuln <= 0 && d < 6 + s.r * 0.55) {
          G.eShots.splice(i, 1);
          killPlayer();
        }
      }
    }
  }

  function updateGems(dt) {
    for (let i = G.gemsOn.length - 1; i >= 0; i--) {
      const g = G.gemsOn[i];
      g.t += dt;
      g.life -= dt;
      const dx = G.px - g.x;
      const dy = G.py - g.y;
      const d = hypot(dx, dy) || 1;
      const pull = (G.deadT > 0 || G.mode !== 'play') ? 40 : 220 + G.combo * 10 + G.rank * 30;
      g.vx = lerp(g.vx, (dx / d) * pull, Math.min(1, dt * 6));
      g.vy = lerp(g.vy, (dy / d) * pull, Math.min(1, dt * 6));
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      if (G.mode === 'play' && G.deadT <= 0 && d < 14) {
        collectGem(g);
        G.gemsOn.splice(i, 1);
        continue;
      }
      if (g.life <= 0 || g.x < -30 || g.x > VW + 40) G.gemsOn.splice(i, 1);
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
    G.beat = 0.5 + 0.5 * Math.sin(G.t * 2.1);
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
    for (let i = 0; i < bgGears.length; i++) {
      bgGears[i].spin += dt * bgGears[i].spd;
    }
  }

  function updateDemo(dt) {
    G.cam += 64 * dt;
    G.t += dt;
    G.px = 108 + Math.sin(G.t * 0.65) * 18;
    G.py = VH * 0.5 + Math.sin(G.t * 1.02) * 36;
    const cave = caveAt(pwx());
    G.py = clamp(G.py, cave.top + 22, cave.bot - 22);
    G.prop += dt * 18;
    G.rank = 2;
    G.gems = 10;
    const pulse = Math.sin(G.t * 0.9) > 0.15;
    G.fireHold = pulse;
    const want = pulse ? 11 : RING_R[2];
    G.ringR = lerp(G.ringR, want, Math.min(1, dt * 7));
    if (pulse && G.fireCd <= 0) {
      G.fireCd = 0.14;
      G.muzzle = 0.05;
      pushShot({
        wx: pwx() + 12, y: G.py, vx: 500, vy: 0,
        hw: 8, hh: 2.4, life: 0.6, hit: {}, dmg: 1
      });
    }
    trySpawn();
    updateEnts(dt);
    updateShots(dt);
    updateGems(dt);
    updateFx(dt);
    syncModeLabel();
  }

  function update(dt) {
    tickAutoFlow(dt);
    if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.absCd > 0) G.absCd -= dt;
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
      updateGems(dt);
      updateFx(dt);
      if (G.winT <= 0 && G.mode === 'play') winGame();
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      updateShots(dt);
      updateGems(dt);
      return;
    }

    if (G.deadT > 0) {
      G.t += dt;
      G.deadT -= dt;
      G.cam += scrollSpd() * dt * 0.35;
      trySpawn();
      updateEnts(dt);
      updateShots(dt);
      updateGems(dt);
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
      toast('第 ' + G.stage + ' 关 · ' + STAGE_NAME[G.stage - 1], false, true);
      audio.check();
      kick(3);
      screenFlash(AMB, 0.28);
      syncHud();
    }
    if (autoOn) autoThink();
    updatePlayer(dt);
    if (G.fireHold) fire();
    trySpawn();
    updateEnts(dt);
    updateShots(dt);
    updateGems(dt);
    updateFx(dt);
  }

  function cogPath(c, r, teeth, rot, inset) {
    const inner = r * (inset || 0.7);
    const step = TAU / teeth;
    const tooth = step * 0.28;
    c.beginPath();
    for (let i = 0; i < teeth; i++) {
      const a0 = rot + i * step;
      const a1 = a0 + (step - tooth) * 0.5;
      const a2 = a1 + tooth;
      const a3 = a0 + step;
      const x0 = Math.cos(a0) * inner;
      const y0 = Math.sin(a0) * inner;
      if (i === 0) c.moveTo(x0, y0);
      else c.lineTo(x0, y0);
      c.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
      c.lineTo(Math.cos(a2) * r, Math.sin(a2) * r);
      c.lineTo(Math.cos(a3) * inner, Math.sin(a3) * inner);
    }
    c.closePath();
  }

  function drawMotes() {
    const c = ctx;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = ((m.wx - G.cam * m.p) % (VW + 80) + VW + 80) % (VW + 80) - 20;
      const pulse = 0.28 + 0.32 * Math.sin(G.t * 2 + i);
      c.fillStyle = rgba(m.rgb, pulse);
      c.beginPath();
      c.arc(sx(x), sy(m.y), m.s * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < bgGears.length; i++) {
      const g = bgGears[i];
      const x = scrX(g.wx * (0.45 + g.p * 0.2));
      if (x < -40 || x > VW + 40) continue;
      c.save();
      c.translate(sx(x), sy(g.y));
      cogPath(c, g.r * scale, g.teeth, g.spin, 0.68);
      c.fillStyle = rgba(BRASS, 0.22);
      c.fill();
      c.strokeStyle = rgba(AMB, 0.28);
      c.lineWidth = Math.max(1, scale);
      c.stroke();
      c.restore();
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
    const st = stageAt(G.cam + VW * 0.4);
    const heat = st === 2 ? 0.18 + G.beat * 0.12 : 0.08;

    c.beginPath();
    c.moveTo(sx(topPts[0].x), sy(0));
    for (let i = 0; i < topPts.length; i++) c.lineTo(sx(topPts[i].x), sy(topPts[i].y));
    c.lineTo(sx(topPts[topPts.length - 1].x), sy(0));
    c.closePath();
    const gt = c.createLinearGradient(sx(0), sy(0), sx(0), sy(72));
    gt.addColorStop(0, st === 2 ? '#3a1808' : '#1c1006');
    gt.addColorStop(1, rgba(BRASS, 0.92));
    c.fillStyle = gt;
    c.fill();

    c.beginPath();
    c.moveTo(sx(botPts[0].x), sy(VH));
    for (let i = 0; i < botPts.length; i++) c.lineTo(sx(botPts[i].x), sy(botPts[i].y));
    c.lineTo(sx(botPts[botPts.length - 1].x), sy(VH));
    c.closePath();
    const gb = c.createLinearGradient(sx(0), sy(VH), sx(0), sy(VH - 72));
    gb.addColorStop(0, st === 2 ? '#3a1808' : '#1c1006');
    gb.addColorStop(1, rgba(BRASS, 0.92));
    c.fillStyle = gb;
    c.fill();

    c.strokeStyle = rgba(AMB, 0.35 + heat);
    c.lineWidth = Math.max(1.4, 2.2 * scale);
    c.beginPath();
    for (let i = 0; i < topPts.length; i++) {
      if (i === 0) c.moveTo(sx(topPts[i].x), sy(topPts[i].y));
      else c.lineTo(sx(topPts[i].x), sy(topPts[i].y));
    }
    c.stroke();
    c.strokeStyle = rgba(COP, 0.4 + heat);
    c.beginPath();
    for (let i = 0; i < botPts.length; i++) {
      if (i === 0) c.moveTo(sx(botPts[i].x), sy(botPts[i].y));
      else c.lineTo(sx(botPts[i].x), sy(botPts[i].y));
    }
    c.stroke();

    c.fillStyle = rgba(COP, 0.55);
    for (let i = 1; i < topPts.length; i += 3) {
      const p = topPts[i];
      const tw = 5 + hash2((G.cam + p.x) | 0) * 3;
      c.beginPath();
      c.moveTo(sx(p.x - tw), sy(p.y));
      c.lineTo(sx(p.x), sy(p.y + 8));
      c.lineTo(sx(p.x + tw), sy(p.y));
      c.closePath();
      c.fill();
    }
    for (let i = 2; i < botPts.length; i += 3) {
      const p = botPts[i];
      const tw = 5 + hash2(((G.cam + p.x) | 0) + 9) * 3;
      c.beginPath();
      c.moveTo(sx(p.x - tw), sy(p.y));
      c.lineTo(sx(p.x), sy(p.y - 8));
      c.lineTo(sx(p.x + tw), sy(p.y));
      c.closePath();
      c.fill();
    }

    if (st === 2) {
      c.fillStyle = rgba(RED, 0.05 + G.beat * 0.05);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawEnts() {
    const c = ctx;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = scrX(e.wx);
      if (x < -70 || x > VW + 70) continue;
      const flash = e.flash > 0;
      c.save();
      c.translate(sx(x), sy(e.y));
      if (e.type === 'cog') {
        const rgb = e.lead ? GOLD : (flash ? WHT : AMB);
        cogPath(c, 9 * scale, 8, e.spin, 0.68);
        c.fillStyle = rgba(rgb, 0.95);
        c.fill();
        c.fillStyle = rgba(DEEP, 0.9);
        c.beginPath();
        c.arc(0, 0, 2.4 * scale, 0, TAU);
        c.fill();
        if (e.lead) {
          c.strokeStyle = rgba(GOLD, 0.8);
          c.lineWidth = Math.max(1, 1.3 * scale);
          c.beginPath();
          c.arc(0, 0, 12 * scale, 0, TAU);
          c.stroke();
        }
      } else if (e.type === 'turret') {
        c.fillStyle = rgba(flash ? WHT : BRASS, 0.95);
        c.fillRect(-11 * scale, -9 * scale, 22 * scale, 18 * scale);
        c.fillStyle = rgba(COP, 0.9);
        c.beginPath();
        c.arc(0, 0, 5 * scale, 0, TAU);
        c.fill();
        c.save();
        c.rotate(e.ang || 0);
        c.fillStyle = rgba(AMB, 0.95);
        c.fillRect(0, -2.2 * scale, 14 * scale, 4.4 * scale);
        c.restore();
      } else if (e.type === 'saw') {
        cogPath(c, 15 * scale, 12, e.spin, 0.62);
        c.fillStyle = rgba(flash ? WHT : COP, 0.95);
        c.fill();
        c.strokeStyle = rgba(MAG, 0.7);
        c.lineWidth = Math.max(1, 1.3 * scale);
        c.stroke();
        c.fillStyle = rgba(GOLD, 0.85);
        c.beginPath();
        c.arc(0, 0, 4 * scale, 0, TAU);
        c.fill();
      } else if (e.type === 'plane') {
        c.fillStyle = rgba(flash ? WHT : PNK, 0.95);
        c.beginPath();
        c.moveTo(-14 * scale, 0);
        c.lineTo(8 * scale, -7 * scale);
        c.lineTo(4 * scale, 0);
        c.lineTo(8 * scale, 7 * scale);
        c.closePath();
        c.fill();
        c.fillStyle = rgba(AMB, 0.9);
        c.fillRect(-4 * scale, -2.2 * scale, 10 * scale, 4.4 * scale);
        c.strokeStyle = rgba(CYN, 0.7);
        c.lineWidth = Math.max(1, scale);
        c.beginPath();
        c.moveTo(8 * scale, -6 * scale);
        c.lineTo(-2 * scale, -6 * scale);
        c.moveTo(8 * scale, 6 * scale);
        c.lineTo(-2 * scale, 6 * scale);
        c.stroke();
      } else if (e.type === 'clock') {
        c.fillStyle = rgba(flash ? WHT : BRASS, 0.95);
        c.beginPath();
        c.arc(0, 0, 13 * scale, 0, TAU);
        c.fill();
        c.strokeStyle = rgba(GOLD, 0.8);
        c.lineWidth = Math.max(1, 1.4 * scale);
        c.stroke();
        c.strokeStyle = rgba(MAG, 0.95);
        c.lineWidth = Math.max(1.4, 2 * scale);
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(e.hand) * 22 * scale, Math.sin(e.hand) * 22 * scale);
        c.stroke();
        c.fillStyle = rgba(GOLD, 0.9);
        c.beginPath();
        c.arc(0, 0, 2.4 * scale, 0, TAU);
        c.fill();
      } else if (e.type === 'boss') {
        cogPath(c, 58 * scale, 14, e.spin, 0.72);
        c.fillStyle = rgba(flash ? WHT : BRASS, 0.95);
        c.fill();
        c.strokeStyle = rgba(AMB, 0.9);
        c.lineWidth = Math.max(1.6, 2.4 * scale);
        c.stroke();
        cogPath(c, 38 * scale, 10, -e.spin * 0.7, 0.7);
        c.fillStyle = rgba(COP, 0.9);
        c.fill();
        const pulse = 1 + Math.sin(G.t * 8) * 0.08;
        const core = e.angry ? MAG : GOLD;
        c.fillStyle = rgba(core, 0.95);
        c.beginPath();
        c.arc(0, 0, e.coreR * pulse * scale, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.8);
        c.beginPath();
        c.arc(-4 * scale, -4 * scale, 5 * scale, 0, TAU);
        c.fill();
        if (e.angry) {
          c.strokeStyle = rgba(MAG, 0.7);
          c.lineWidth = Math.max(1, 1.6 * scale);
          c.beginPath();
          c.arc(0, 0, 64 * scale, 0, TAU);
          c.stroke();
        }
      }
      c.restore();
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = scrX(s.wx);
      c.fillStyle = rgba(CYN, 0.95);
      c.fillRect(sx(x - 7), sy(s.y - 1.6), 16 * scale, 3.2 * scale);
      c.fillStyle = rgba(WHT, 0.9);
      c.fillRect(sx(x - 4), sy(s.y - 0.7), 12 * scale, 1.4 * scale);
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = scrX(s.wx);
      c.fillStyle = rgba(MAG, 0.95);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.75);
      c.beginPath();
      c.arc(sx(x - 0.6), sy(s.y - 0.6), s.r * 0.35 * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < G.gemsOn.length; i++) {
      const g = G.gemsOn[i];
      const pulse = 1 + Math.sin(G.t * 10 + g.t * 6) * 0.12;
      c.fillStyle = rgba(GOLD, 0.95);
      c.save();
      c.translate(sx(g.x), sy(g.y));
      c.rotate(g.t * 3);
      c.beginPath();
      c.moveTo(0, -g.r * pulse * scale);
      c.lineTo(g.r * 0.7 * pulse * scale, 0);
      c.lineTo(0, g.r * pulse * scale);
      c.lineTo(-g.r * 0.7 * pulse * scale, 0);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(WHT, 0.8);
      c.beginPath();
      c.arc(0, 0, 1.6 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    const c = ctx;
    const blink = G.invuln > 0 && ((G.invuln * 18) | 0) % 2 === 0;
    if (blink) return;
    const x = G.px;
    const y = G.py;
    const on = ringOn() || (G.mode === 'title' && !G.fireHold);
    if (G.ringR > 8) {
      const a = on ? 0.55 + (G.ringFlash > 0 ? 0.35 : 0) : 0.22;
      c.save();
      c.translate(sx(x), sy(y));
      cogPath(c, G.ringR * scale, 10, G.prop * 0.35, 0.86);
      c.strokeStyle = rgba(on ? GOLD : AMB, a);
      c.lineWidth = Math.max(1.4, (on ? 2.2 : 1.2) * scale);
      c.stroke();
      c.beginPath();
      c.arc(0, 0, (G.ringR - 5) * scale, 0, TAU);
      c.strokeStyle = rgba(CYN, on ? 0.28 : 0.1);
      c.lineWidth = Math.max(1, scale);
      c.stroke();
      c.restore();
    }
    c.save();
    c.translate(sx(x), sy(y));
    c.fillStyle = rgba(AMB, 0.22);
    c.beginPath();
    c.ellipse(-8 * scale, 0, 16 * scale, 6 * scale, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(CYN, 0.75);
    c.lineWidth = Math.max(1, 1.5 * scale);
    c.beginPath();
    c.moveTo(-4 * scale, -8 * scale);
    c.lineTo(8 * scale, -8 * scale);
    c.moveTo(-4 * scale, 8 * scale);
    c.lineTo(8 * scale, 8 * scale);
    c.stroke();
    c.fillStyle = rgba(WHT, 0.96);
    c.beginPath();
    c.moveTo(14 * scale, 0);
    c.lineTo(-10 * scale, -6.5 * scale);
    c.lineTo(-6 * scale, 0);
    c.lineTo(-10 * scale, 6.5 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(AMB, 0.95);
    c.fillRect(-2 * scale, -3 * scale, 10 * scale, 6 * scale);
    c.fillStyle = rgba(DEEP, 0.9);
    c.fillRect(2 * scale, -1.5 * scale, 5.5 * scale, 3 * scale);
    c.fillStyle = rgba(GOLD, 0.9);
    c.beginPath();
    c.arc(3 * scale, -0.2 * scale, 1.5 * scale, 0, TAU);
    c.fill();
    c.save();
    c.translate(12 * scale, 0);
    c.rotate(G.prop);
    c.strokeStyle = rgba(CYN, 0.85);
    c.lineWidth = Math.max(1, 1.2 * scale);
    c.beginPath();
    c.moveTo(-5 * scale, 0);
    c.lineTo(5 * scale, 0);
    c.moveTo(0, -5 * scale);
    c.lineTo(0, 5 * scale);
    c.stroke();
    c.restore();
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle / 0.055);
      c.beginPath();
      c.arc(16 * scale, 0, 5 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
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
    c.fillStyle = '#0c0802';
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
    g.addColorStop(0, '#181006');
    g.addColorStop(0.5, '#120c04');
    g.addColorStop(1, '#1a0e06');
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
    G.kind = kind || 'gear';
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
    G.gems = 0;
    G.rank = 1;
    G.nextLife = LIFE_EVERY;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.gemsOn.length = 0;
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
    G.boss = false;
    G.winT = 0;
    G.engine = 0;
    G.beat = 0;
    G.ringR = 34;
    G.ringFlash = 0;
    G.prop = 0;
    G.absCd = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    eid = 1;
    autoTx = G.px;
    autoTy = G.py;
    autoStickS = -1e9;
    autoOvWait = 0;
    autoFireT = 0;
  }

  function startGame(kind) {
    resetRun(kind || 'gear');
    G.mode = 'play';
    if (autoOn) G.fireHold = true;
    hideOverlay();
    audio.start();
    toast(isSea() ? '弹海' : '齿轮', false, !isSea());
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('gear');
    G.mode = 'title';
    showOverlay('title', '齿轮', '按住空格开火，松手张开齿轮环把弹丸吸成宝石。撞壁、撞体、中弹都掉命。三关之后打巨轮。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('gear');
    else startGame(G.kind || 'gear');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('gear');
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
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'Left' || k === 'Right' || k === 'Up' || k === 'Down';
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
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
    if (autoOn && (isMove || space)) return;
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'sea' : 'gear');
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
      if (!pointer.down && !autoOn) G.fireHold = false;
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

  if (btnGear) {
    btnGear.addEventListener('click', function () {
      audio.ensure();
      startGame('gear');
    });
  }
  if (btnSea) {
    btnSea.addEventListener('click', function () {
      audio.ensure();
      startGame('sea');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'gear');
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
      if (!autoOn) G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
