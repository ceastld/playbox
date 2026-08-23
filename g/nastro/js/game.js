'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const POW_MAX = 2;
  const RIB_MAX = 2;
  const CHG1 = 0.34;
  const CHG2 = 0.80;
  const CHG_AUTO = 1.02;
  const BOSS_AT = [2700, 5800, 9400];
  const BEST_KEY = 'playbox-nastro-best';
  const MUTE_KEY = 'playbox-nastro-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 轨束 · R 重开 · M 静音';
  const STAGE_NAME = ['织带', '螺廊', '核环'];
  const BOSS_NAME = ['织卫', '螺枢', '轨核'];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const BLU = [74, 110, 245];
  const CYN = [94, 232, 255];
  const GOLD = [255, 227, 107];
  const MAG = [255, 78, 200];
  const VIO = [122, 114, 255];
  const WHT = [230, 240, 255];
  const HOT = [138, 164, 255];
  const PNK = [255, 154, 214];

  const SCORE = {
    rider: 60, scout: 50, dart: 80, turret: 90, mine: 40,
    heavy: 160, weaver: 180, boss: 2800
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
  const btnTrack = document.getElementById('btn-track');
  const btnRail = document.getElementById('btn-rail');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBeam = document.getElementById('btn-beam');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const beamLabel = document.getElementById('beam-label');
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
  let eid = 1;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 96, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const wisps = [];

  const G = {
    mode: 'title',
    kind: 'track',
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
    pow: 0,
    ribLv: 0,
    spawnedX: 0,
    fireCd: 0,
    fireHold: false,
    chg: 0,
    chgHold: false,
    chgLv: 0,
    chgPing: 0,
    rib: {
      on: false, t: 0, max: 0, full: false, dmg: 0,
      latch: false, rail: -1, amp: 0, y0: 0, tick: 0, hits: {}, bite: 0
    },
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: BLU,
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
  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
  }

  function ribbonCount(wx) {
    return stageAt(wx) >= 2 ? 3 : 2;
  }
  function ribbonY(id, wx) {
    const bases = [VH * 0.30, VH * 0.50, VH * 0.70];
    const st = stageAt(wx);
    const n = fbm(wx / 210, 11 + id * 19);
    const amp = st === 1 ? 16 : st === 2 ? 28 : 40;
    const wave = Math.sin(wx / 92 + id * 1.7) * (st === 3 ? 20 : 10);
    return bases[id] + (n - 0.5) * 2 * amp + wave;
  }
  function nearestRibbon(y, wx) {
    let best = -1;
    let bestD = 42;
    const n = ribbonCount(wx);
    for (let i = 0; i < n; i++) {
      const d = Math.abs(ribbonY(i, wx) - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }
  function chgNeed() {
    const cut = G.ribLv * 0.055;
    return { a: Math.max(0.20, CHG1 - cut), b: Math.max(0.52, CHG2 - cut * 1.35) };
  }
  function scrollSpd() {
    if (G.boss) return isRail() ? 38 : 16;
    return isRail() ? 152 : 104;
  }
  function moveSpd() {
    return (isRail() ? 312 : 272) + G.pow * 10;
  }
  function fireGap() {
    return (isRail() ? 0.080 : 0.094) - G.pow * 0.006;
  }
  function caveAt(wx) {
    const st = stageAt(wx);
    const n1 = fbm(wx / 186, 5);
    const n2 = fbm(wx / 164, 14);
    let top = 8 + n1 * (st === 1 ? 18 : st === 2 ? 36 : 52);
    let bot = VH - 10 - n2 * (st === 1 ? 16 : st === 2 ? 32 : 48);
    if (wx < 340) {
      const t = wx / 340;
      top = lerp(10, top, t);
      bot = lerp(VH - 14, bot, t);
    }
    if (G.boss) {
      top = Math.min(top, 28);
      bot = Math.max(bot, VH - 30);
    }
    const gap = G.boss ? 88 : 92;
    if (top > bot - gap) {
      const mid = (top + bot) * 0.5;
      top = mid - gap * 0.5;
      bot = mid + gap * 0.5;
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
    shoot() {
      this.ensure();
      this.beep(860, 0.04, 'square', 0.026, 1720);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.62, combo * 0.04);
      this.noise(0.034, 0.03, 1400);
      this.beep(540 * lift, 0.068, 'square', 0.036, 900 * lift);
    },
    charge(lv) {
      this.ensure();
      if (lv === 1) {
        this.beep(370, 0.07, 'square', 0.036, 554);
        this.beep(740, 0.1, 'triangle', 0.028, 988);
      } else {
        this.beep(494, 0.08, 'square', 0.04, 740);
        this.beep(988, 0.14, 'sine', 0.038, 1480);
      }
    },
    hum(frac) {
      this.ensure();
      this.beep(170 + frac * 460, 0.048, 'sine', 0.015, 230 + frac * 720);
    },
    ribbon(full) {
      this.ensure();
      this.noise(full ? 0.15 : 0.07, full ? 0.068 : 0.038, full ? 240 : 640);
      this.beep(full ? 160 : 300, full ? 0.26 : 0.13, 'sawtooth', full ? 0.052 : 0.034, full ? 920 : 760);
      if (full) this.beep(700, 0.16, 'triangle', 0.032, 1400);
    },
    latch() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.04, 990);
      this.beep(1320, 0.1, 'sine', 0.03, 1760);
    },
    bite(n) {
      this.ensure();
      const f = 700 * (1 + Math.min(0.7, n * 0.12));
      this.beep(f, 0.08, 'square', 0.04, f * 1.45);
      this.beep(f * 0.5, 0.1, 'sine', 0.026, f);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.036, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.026, 1320);
    },
    option() {
      this.ensure();
      this.beep(415, 0.07, 'square', 0.04, 622);
      this.beep(622, 0.09, 'triangle', 0.036, 830);
      this.beep(830, 0.14, 'sine', 0.034, 1244);
    },
    pow() {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.038, 784);
      this.beep(784, 0.12, 'triangle', 0.032, 1175);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.064, 260);
      this.beep(290, 0.22, 'sawtooth', 0.048, 66);
      this.beep(145, 0.34, 'sine', 0.04, 42);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.044, 784);
      this.beep(784, 0.12, 'triangle', 0.038, 1046);
    },
    boom() {
      this.ensure();
      this.noise(0.22, 0.078, 170);
      this.beep(170, 0.28, 'sawtooth', 0.052, 52);
      this.beep(86, 0.4, 'sine', 0.038, 38);
    },
    check() {
      this.ensure();
      this.beep(370, 0.09, 'sine', 0.038, 494);
      this.beep(622, 0.16, 'triangle', 0.038, 830);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.048, 784);
      this.beep(784, 0.16, 'triangle', 0.042, 1046);
      this.beep(1046, 0.28, 'sine', 0.038, 1568);
    },
    lose() {
      this.ensure();
      this.beep(208, 0.18, 'sawtooth', 0.038, 86);
      this.beep(130, 0.3, 'sine', 0.048, 46);
    },
    start() {
      this.ensure();
      this.beep(311, 0.09, 'square', 0.038, 622);
      this.beep(622, 0.14, 'triangle', 0.033, 933);
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

  function beamWord() {
    if (G.rib.on) return G.rib.latch ? '咬轨' : (G.rib.full ? '满束' : '抽带');
    if (G.chgLv >= 2) return '满束';
    if (G.chgLv >= 1) return '蓄束';
    if (G.chgHold) return '蓄…';
    return '束';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '星轨';
      else if (G.boss) stageLabel.textContent = BOSS_NAME[G.stage - 1] || '核心';
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + (STAGE_NAME[G.stage - 1] || '');
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isRail() ? '核轨' : '星轨';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isRail());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (beamLabel) {
      beamLabel.textContent = beamWord();
      beamLabel.className = 'beam'
        + (G.rib.on && G.rib.latch ? ' lock' : G.rib.on && G.rib.full ? ' full'
          : G.chgLv >= 2 ? ' full' : G.chgLv >= 1 || G.chgHold ? ' chg' : '');
    }
    if (powLabel) {
      powLabel.textContent = '火 ' + (G.pow + 1) + (G.ribLv ? ' · 束' + G.ribLv : '');
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
        comboEl.classList.toggle('hot', G.combo >= 6);
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格射击，Shift 蓄轨束', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 星轨打穿', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 撞机、中弹、擦壁都掉命', 'warn');
    else if (G.rib.on && G.rib.latch) setHint('咬轨切开 · 同轨连斩', 'hot');
    else if (G.rib.on && G.rib.full) setHint('满束贯穿 · 对准核心', 'hot');
    else if (G.chgLv >= 2) setHint('满束就绪 · 松手咬轨切开', 'hot');
    else if (G.chgHold) setHint('蓄束中 · 满蓄咬轨贯穿', '');
    else setHint('空格连射 · Shift 蓄轨束咬轨切开 · 满蓄贯穿', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'NAST';
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
    popSpark(x, y, rgb, 10 + p * 0.35);
  }

  function bumpCombo() {
    const prev = G.mult;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      floatText(G.px + 40, G.py - 18, G.mult + ' 链', GOLD, true);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function pushEnt(e) {
    e.id = eid++;
    e.alive = true;
    e.flash = 0;
    G.ents.push(e);
  }

  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        wx: rand(0, VW * 3),
        y: rand(0, VH),
        p: rand(0.18, 0.92),
        s: rand(0.7, 2.1)
      });
    }
  }

  function spawnRider(wx, rail, n) {
    const dens = isRail();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'rider',
        wx: wx + i * 22,
        y: ribbonY(rail, wx + i * 22),
        hw: 10, hh: 7, hp: 1,
        vx: -(dens ? 92 : 70),
        rail: rail,
        phase: i * 0.5
      });
    }
  }

  function spawnScout(wx, y, n, dive) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 22, cave.bot - 22);
    const dens = isRail();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'scout',
        wx: wx + i * 18,
        y: y + (i - (n - 1) * 0.5) * (dive ? 5 : 10),
        hw: 10, hh: 6, hp: 1,
        vx: -(dens ? 98 : 76),
        phase: i * 0.46,
        path: dive ? 'dive' : 'sine',
        cd: rand(0.5, 1.4)
      });
    }
  }

  function spawnDart(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 20, cave.bot - 20);
    pushEnt({
      type: 'dart',
      wx: wx, y: y,
      hw: 12, hh: 6, hp: isRail() ? 2 : 1,
      vx: -(isRail() ? 210 : 168),
      phase: rand(0, TAU),
      cd: 0.4
    });
  }

  function spawnTurret(wx, top) {
    const cave = caveAt(wx);
    const y = top ? cave.top + 12 : cave.bot - 12;
    pushEnt({
      type: 'turret',
      wx: wx, y: y,
      hw: 12, hh: 10,
      hp: isRail() ? 4 : 3,
      top: !!top,
      cd: rand(0.5, 1.2)
    });
  }

  function spawnMine(wx, y) {
    pushEnt({
      type: 'mine',
      wx: wx, y: y,
      hw: 8, hh: 8, hp: 1,
      phase: rand(0, TAU),
      spin: 0
    });
  }

  function spawnHeavy(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 30, cave.bot - 30);
    pushEnt({
      type: 'heavy',
      wx: wx, y: y,
      hw: 18, hh: 12,
      hp: isRail() ? 8 : 6,
      vx: -(isRail() ? 52 : 40),
      phase: 0,
      cd: rand(0.7, 1.25)
    });
  }

  function spawnWeaver(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 28, cave.bot - 28);
    pushEnt({
      type: 'weaver',
      wx: wx, y: y,
      hw: 14, hh: 10,
      hp: isRail() ? 6 : 5,
      vx: -(isRail() ? 62 : 48),
      railA: 0,
      railB: Math.min(1, ribbonCount(wx) - 1),
      phase: 0,
      drop: false,
      cd: 0.5
    });
  }

  function spawnCap(wx, y, kind) {
    pushEnt({
      type: 'cap',
      kind: kind || 'pow',
      wx: wx, y: y,
      hw: 9, hh: 9, hp: 1,
      spin: 0,
      vy: rand(-14, 14)
    });
  }

  function spawnBoss(stage) {
    const cave = caveAt(G.cam + VW * 0.78);
    const mid = (cave.top + cave.bot) * 0.5;
    const dens = isRail();
    const kinds = ['loom', 'spire', 'core'];
    const hps = dens ? [87, 116, 168] : [70, 94, 136];
    pushEnt({
      type: 'boss',
      kind: kinds[stage - 1] || 'core',
      wx: G.cam + VW + 40,
      y: mid,
      hw: stage === 3 ? 36 : 28,
      hh: stage === 3 ? 36 : 26,
      hp: hps[stage - 1],
      max: hps[stage - 1],
      phase: 0,
      spin: 0,
      open: 0.4,
      vy: 42,
      cd: 1.1
    });
    G.boss = true;
    toast(BOSS_NAME[stage - 1], false, true);
    audio.check();
    syncHud();
  }

  function spawnSlice(wx) {
    if (G.boss) return;
    if (wx < 240) return;
    const nearBoss = BOSS_AT[G.cleared];
    if (nearBoss != null && wx > nearBoss - 180) return;
    const st = stageAt(wx);
    const slice = (wx / 50) | 0;
    const h = hash2(slice * 19 + (isRail() ? 7 : 3) + G.stage * 11);
    const cave = caveAt(wx);
    const mid = (cave.top + cave.bot) * 0.5;
    const dens = isRail() ? 0.78 : 1;
    const nRail = ribbonCount(wx);

    if (slice % (isRail() ? 3 : 4) === 0 && h > 0.10 * dens) {
      const rail = (slice * 3 + (h * 9) | 0) % nRail;
      const n = (isRail() ? 5 : 4) + (st === 3 ? 1 : 0);
      spawnRider(wx, rail, n);
    }
    if (slice % (isRail() ? 5 : 6) === 0 && h > 0.28 * dens) {
      const y = lerp(cave.top + 36, cave.bot - 36, hash2(slice + 44));
      const n = (isRail() ? 5 : 4) + (st > 1 ? 1 : 0);
      spawnScout(wx, y, n, h > 0.72 && st > 1);
    }
    if (st >= 2 && slice % 7 === 2 && h > 0.35 * dens) {
      spawnDart(wx, mid + (h - 0.5) * 80);
    }
    if (st >= 2 && slice % 8 === 3 && h > 0.4) {
      spawnTurret(wx, hash2(slice + 9) > 0.5);
      if (isRail() && hash2(slice + 21) > 0.55) spawnTurret(wx + 40, hash2(slice + 9) <= 0.5);
    }
    if (slice % 9 === 5 && h > 0.48) {
      spawnMine(wx, lerp(cave.top + 28, cave.bot - 28, hash2(slice + 71)));
      if (isRail()) spawnMine(wx + 28, lerp(cave.top + 28, cave.bot - 28, hash2(slice + 88)));
    }
    if (st >= 2 && slice % 11 === 4 && h > 0.42) {
      spawnHeavy(wx, mid + (hash2(slice + 3) - 0.5) * 50);
    }
    if (st >= 2 && slice % 13 === 6 && h > 0.38) {
      spawnWeaver(wx, mid);
    }
    if (st === 3 && slice % 10 === 1 && h > 0.3) {
      spawnRider(wx, 1, isRail() ? 6 : 5);
    }
  }

  function trySpawn() {
    const ahead = G.cam + VW + 40;
    while (G.spawnedX < ahead) {
      G.spawnedX += 50;
      spawnSlice(G.spawnedX);
    }
    if (!G.boss && G.cleared < 3 && G.cam + VW * 0.62 >= BOSS_AT[G.cleared]) {
      spawnBoss(G.cleared + 1);
    }
  }

  function enemyShot(wx, y, vx, vy, r) {
    G.eShots.push({ wx: wx, y: y, vx: vx, vy: vy, r: r || 3.2, life: 3.6 });
    capArr(G.eShots, 120);
  }

  function aimShot(e, spd, r, spread, n) {
    const dx = pwx() - e.wx;
    const dy = G.py - e.y;
    const d = Math.max(1, hypot(dx, dy));
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(dy, dx) + (i - (n - 1) * 0.5) * spread;
      enemyShot(e.wx, e.y, Math.cos(a) * spd, Math.sin(a) * spd, r);
    }
  }

  function collectCap(e) {
    e.alive = false;
    const x = scrX(e.wx);
    if (e.kind === 'rib') {
      if (G.ribLv < RIB_MAX) {
        G.ribLv += 1;
        toast('轨束 +', false, true);
        audio.option();
      } else {
        addScore(400 * G.mult);
        floatText(x, e.y, '+400', GOLD, true);
        audio.pow();
      }
    } else {
      if (G.pow < POW_MAX) {
        G.pow += 1;
        toast('火力 +', false, true);
        audio.pow();
      } else {
        addScore(300 * G.mult);
        floatText(x, e.y, '+300', GOLD, false);
        audio.pow();
      }
    }
    explode(x, e.y, e.kind === 'rib' ? CYN : GOLD, 10);
    hitStop(0.04);
    kick(2.4);
    syncHud();
  }

  function maybeDrop(e) {
    if (e.type === 'weaver' || e.type === 'heavy') {
      spawnCap(e.wx, e.y, hash2(e.id + 4) > 0.45 ? 'rib' : 'pow');
      return;
    }
    if (e.type === 'dart' && hash2(e.id) > 0.72) spawnCap(e.wx, e.y, 'pow');
    else if (hash2(e.id + 8) > 0.88) spawnCap(e.wx, e.y, hash2(e.id + 2) > 0.5 ? 'rib' : 'pow');
  }

  function killEnt(e, fromRib) {
    if (!e.alive) return;
    e.alive = false;
    const x = scrX(e.wx);
    bumpCombo();
    const base = SCORE[e.type] || 50;
    let pts = (base * G.mult) | 0;
    if (fromRib && G.rib.latch && (e.type === 'rider' || e.rail != null)) {
      G.rib.bite += 1;
      if (G.rib.bite >= 2) {
        pts += (40 * G.rib.bite * G.mult) | 0;
        floatText(x, e.y - 10, '咬轨', GOLD, true);
        audio.bite(G.rib.bite);
      }
    }
    addScore(pts);
    floatText(x, e.y, '+' + pts, fromRib && G.rib.full ? GOLD : CYN, fromRib && G.rib.full);
    explode(x, e.y, e.type === 'boss' ? GOLD : (fromRib ? CYN : HOT), e.type === 'boss' ? 42 : 16);
    audio.hit(G.combo);
    hitStop(e.type === 'boss' ? 0.062 : 0.034);
    kick(e.type === 'boss' ? 5.5 : 2.2);
    if (e.type !== 'boss' && e.type !== 'cap') maybeDrop(e);
    if (e.type === 'boss') onBossDown(e);
  }

  function onBossDown(e) {
    G.boss = false;
    G.cleared += 1;
    screenFlash(GOLD, 0.55);
    addScore((1400 * G.stage * G.mult) | 0);
    audio.boom();
    toast(STAGE_NAME[G.stage - 1] + ' 肃清', false, true);
    if (G.cleared >= 3) {
      addScore(isRail() ? 7500 : 6000);
      G.winT = 1.28;
      G.invuln = 1.4;
    } else {
      G.stage = G.cleared + 1;
      syncHud();
    }
  }

  function hurt(e, dmg, x, y, fromRib) {
    if (!e.alive || e.type === 'cap') return;
    if (e.type === 'boss' && e.open < 0.42 && !fromRib) {
      emit(3, {
        x: x, y: y, j: 3,
        vx0: -40, vx1: 20, vy0: -40, vy1: 40,
        life: 0.12, r0: 1, r1: 2, rgb: WHT, g: 0
      });
      return 'block';
    }
    if (e.type === 'boss' && fromRib && G.rib.full && e.open >= 0.42) dmg += 2;
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.hp <= 0) {
      killEnt(e, fromRib);
      return true;
    }
    bumpCombo();
    audio.hit(G.combo);
    hitStop(fromRib ? 0.042 : 0.030);
    kick(fromRib ? 2.6 : 1.6);
    emit(4, {
      x: x, y: y, j: 4,
      vx0: -80, vx1: 60, vy0: -70, vy1: 70,
      life: 0.18, r0: 1, r1: 2.4, rgb: fromRib ? GOLD : CYN, g: 40
    });
    return true;
  }

  function killPlayer() {
    if (G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.rib.on = false;
    G.chg = 0;
    G.chgHold = false;
    G.chgLv = 0;
    G.fireHold = false;
    breakCombo();
    explode(G.px, G.py, MAG, 36);
    screenFlash(MAG, 0.5);
    hitStop(0.072);
    kick(7.2);
    audio.death();
    G.eShots.length = 0;
    if (G.pow > 0) G.pow -= 1;
    if (G.ribLv > 0) {
      G.ribLv -= 1;
      spawnCap(pwx() + 20, G.py, 'rib');
    }
    syncHud();
  }

  function respawn() {
    G.px = 96;
    const cave = caveAt(pwx());
    G.py = clamp((cave.top + cave.bot) * 0.5, cave.top + 24, cave.bot - 24);
    G.invuln = 1.48;
    G.deadT = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    G.winT = 0;
    audio.win();
    showOverlay(
      'win',
      isRail() ? '核轨通关' : '星轨打穿',
      '轨核被切开。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '') + '。R 再开一局。'
    );
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    showOverlay(
      'lose',
      '舰毁了',
      (G.why || '撞机、中弹或擦壁。') + ' 分数 ' + G.score + '。R 重开。'
    );
    syncHud();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.rib.on) return;
    if (G.fireCd > 0) return;
    G.fireCd = fireGap();
    G.muzzle = 0.05;
    const n = 1 + G.pow;
    const wx = pwx() + 16;
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) * 0.5) * 7;
      G.shots.push({
        wx: wx, y: G.py + off, vx: 650, r: 2.4, life: 1.2
      });
    }
    capArr(G.shots, 80);
    audio.shoot();
  }

  function fireRibbon() {
    const held = G.chg;
    G.chgHold = false;
    G.chg = 0;
    const need = chgNeed();
    G.chgLv = 0;
    if (held < need.a * 0.55 || G.mode !== 'play' || G.deadT > 0) {
      syncHud();
      return;
    }
    const full = held >= need.b;
    const latchId = full ? nearestRibbon(G.py, pwx() + 36) : -1;
    G.rib.on = true;
    G.rib.t = 0;
    G.rib.max = full ? 0.48 : 0.22;
    G.rib.full = full;
    G.rib.dmg = full ? 4 : 2;
    G.rib.latch = latchId >= 0;
    G.rib.rail = latchId;
    G.rib.amp = full ? 8 : 22;
    G.rib.y0 = G.py;
    G.rib.tick = 0;
    G.rib.hits = {};
    G.rib.bite = 0;
    if (latchId >= 0) {
      toast('咬轨', false, true);
      audio.latch();
      hitStop(0.055);
      kick(3.6);
      screenFlash(GOLD, 0.28);
    } else {
      audio.ribbon(full);
      hitStop(full ? 0.05 : 0.032);
      kick(full ? 3.2 : 1.8);
    }
    if (full) floatText(G.px + 28, G.py - 16, latchId >= 0 ? '咬轨' : '满束', GOLD, true);
    syncHud();
  }

  function ribYAt(screenX) {
    const r = G.rib;
    if (r.latch && r.rail >= 0) return ribbonY(r.rail, G.cam + screenX);
    const u = Math.max(0, screenX - G.px) / 90;
    return r.y0 + Math.sin(u * 2.15 + G.t * 9) * r.amp * Math.min(1, (screenX - G.px) / 70);
  }

  function ribEndX() {
    if (G.rib.full) return VW + 8;
    return Math.min(VW, G.px + 210);
  }

  function updateCharge(dt) {
    if (G.rib.on) return;
    if (!G.chgHold) {
      if (G.chg > 0) G.chg = Math.max(0, G.chg - dt * 1.8);
      const lv = G.chg >= chgNeed().b ? 2 : G.chg >= chgNeed().a ? 1 : 0;
      if (lv !== G.chgLv) {
        G.chgLv = lv;
        syncHud();
      }
      return;
    }
    G.chg += dt;
    const need = chgNeed();
    if (G.chg >= need.a && G.chgLv < 1) {
      G.chgLv = 1;
      audio.charge(1);
      syncHud();
    }
    if (G.chg >= need.b && G.chgLv < 2) {
      G.chgLv = 2;
      audio.charge(2);
      hitStop(0.038);
      kick(2.8);
      screenFlash(GOLD, 0.18);
      syncHud();
    }
    G.chgPing += dt;
    if (G.chgPing > 0.09) {
      G.chgPing = 0;
      audio.hum(clamp(G.chg / need.b, 0, 1));
    }
    if (G.chg >= CHG_AUTO && G.chgLv >= 2) fireRibbon();
  }

  function updateRibbon(dt) {
    if (!G.rib.on) return;
    G.rib.t += dt;
    G.rib.tick += dt;
    const thick = G.rib.full ? 13 : 8;
    const end = ribEndX();
    if (G.rib.tick >= 0.05) {
      G.rib.tick = 0;
      const pulse = {};
      for (let x = G.px + 14; x <= end; x += 11) {
        const y = ribYAt(x);
        const wx = G.cam + x;
        for (let i = G.eShots.length - 1; i >= 0; i--) {
          const s = G.eShots[i];
          if (s.r > 5.8) continue;
          if (Math.abs(s.wx - wx) < 10 && Math.abs(s.y - y) < thick) {
            emit(2, {
              x: x, y: s.y, j: 2,
              vx0: -20, vx1: 40, vy0: -30, vy1: 30,
              life: 0.12, r0: 1, r1: 2, rgb: CYN, g: 0
            });
            G.eShots.splice(i, 1);
          }
        }
        for (let k = 0; k < G.ents.length; k++) {
          const e = G.ents[k];
          if (!e.alive || e.type === 'cap' || pulse[e.id]) continue;
          if (Math.abs(e.wx - wx) < e.hw + 8 && Math.abs(e.y - y) < e.hh + thick) {
            pulse[e.id] = true;
            hurt(e, G.rib.dmg, scrX(e.wx), e.y, true);
          }
        }
      }
    }
    if (G.rib.t >= G.rib.max) {
      G.rib.on = false;
      syncHud();
    }
  }

  function updatePlayer(dt) {
    const spd = moveSpd();
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      dx = pointer.x - G.px;
      dy = pointer.y - G.py;
      const d = hypot(dx, dy);
      const max = spd * dt;
      if (d > max && d > 0.001) {
        dx = dx / d * max;
        dy = dy / d * max;
      }
    } else {
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) dy -= 1;
      if (keys.d) dy += 1;
      if (dx || dy) {
        const d = hypot(dx, dy);
        dx = dx / d * spd * dt;
        dy = dy / d * spd * dt;
      }
    }
    G.px = clamp(G.px + dx, 28, 430);
    G.py = clamp(G.py + dy, 16, VH - 16);
    const cave = caveAt(pwx());
    if (G.py < cave.top + 12 || G.py > cave.bot - 12) {
      G.why = '擦壁。';
      killPlayer();
      return;
    }
    G.py = clamp(G.py, cave.top + 12, cave.bot - 12);
    G.engine += dt;
    if (!REDUCE && G.engine > 0.03) {
      G.engine = 0;
      wisps.push({
        x: G.px - 16, y: G.py + rand(-2, 2),
        vx: -80, vy: rand(-12, 12),
        t: 0, life: 0.28, rgb: G.chgLv >= 2 ? GOLD : CYN
      });
      capArr(wisps, 40);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.wx += s.vx * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      if (s.life <= 0 || x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let gone = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive || e.type === 'cap') continue;
        if (!aabb(s.wx, s.y, s.r + 2, s.r, e.wx, e.y, e.hw, e.hh)) continue;
        const hit = hurt(e, 1, x, s.y, false);
        if (hit === 'block') {
          gone = true;
          break;
        }
        if (hit) {
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
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.winT <= 0) {
        if (aabb(s.wx, s.y, s.r, s.r, pwx(), G.py, 7.2, 4.6)) {
          G.eShots.splice(i, 1);
          G.why = '中弹。';
          killPlayer();
        }
      }
    }
  }

  function updateBoss(e, dt, x) {
    const half = e.hp < e.max * 0.5;
    const dens = isRail();
    e.phase += dt;
    e.spin += (half ? 2.5 : 1.45) * dt;
    const cave = caveAt(e.wx);
    const mid = (cave.top + cave.bot) * 0.5;
    if (e.kind === 'loom') {
      e.wx = lerp(e.wx, G.cam + VW * 0.74, 0.04);
      const a = nearestRibbon(e.y, e.wx);
      const ty = a >= 0 ? ribbonY(a, e.wx) : mid;
      e.y = lerp(e.y, ty + Math.sin(e.phase * 1.2) * 18, 0.08);
      e.y = clamp(e.y, cave.top + 64, cave.bot - 64);
      e.open = 0.28 + (Math.sin(e.phase * 1.55) * 0.5 + 0.5) * 0.72;
    } else if (e.kind === 'spire') {
      e.wx = lerp(e.wx, G.cam + VW * 0.72, 0.04);
      e.y = lerp(e.y, mid + Math.sin(e.phase * 0.85) * 40, 0.08);
      e.open = 0.22 + (Math.sin(e.phase * 1.32) * 0.5 + 0.5) * 0.78;
    } else {
      e.wx = lerp(e.wx, G.cam + VW * 0.7, 0.035);
      e.y += e.vy * dt;
      if (e.y < cave.top + 52 || e.y > cave.bot - 52) e.vy *= -1;
      e.y = clamp(e.y, cave.top + 50, cave.bot - 50);
      e.open = 0.18 + (Math.sin(e.phase * (half ? 1.85 : 1.18)) * 0.5 + 0.5) * 0.82;
    }
    e.cd -= dt;
    if (e.cd > 0 || x < 40 || x > VW + 20) return;
    const rate = (dens ? 0.76 : 1) * (half ? 0.72 : 1);
    if (e.kind === 'loom') {
      e.cd = (half ? 0.6 : 0.86) * rate;
      aimShot(e, dens ? 180 : 152, 3.4, 0.2, half ? 5 : 3);
    } else if (e.kind === 'spire') {
      e.cd = (half ? 0.46 : 0.68) * rate;
      const n = half ? 10 : 7;
      for (let k = 0; k < n; k++) {
        const a = e.spin + k / n * TAU;
        enemyShot(e.wx, e.y, Math.cos(a) * 128, Math.sin(a) * 128, 3.3);
      }
      if (half) aimShot(e, 170, 4.2, 0, 1);
    } else {
      e.cd = (half ? 0.4 : 0.62) * rate;
      const n = half ? 12 : 8;
      for (let k = 0; k < n; k++) {
        const a = e.spin + k / n * TAU;
        enemyShot(e.wx, e.y, Math.cos(a) * 116, Math.sin(a) * 116, 3.2);
      }
      aimShot(e, dens ? 176 : 148, half ? 5.4 : 4.4, 0.16, half ? 3 : 1);
    }
  }

  function updateEnts(dt) {
    const dens = isRail();
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

      if (e.type === 'rider') {
        e.wx += e.vx * dt;
        e.y = ribbonY(e.rail, e.wx);
      } else if (e.type === 'scout') {
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
          e.cd = dens ? rand(0.85, 1.5) : rand(1.3, 2.2);
          if (hash2(e.id + ((G.t * 8) | 0)) > (dens ? 0.42 : 0.6)) {
            aimShot(e, dens ? 186 : 154, 3, 0, 1);
          }
        }
      } else if (e.type === 'dart') {
        e.wx += e.vx * dt;
        e.y += Math.sin(G.t * 5 + e.phase) * 18 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 14, cave.bot - 14);
      } else if (e.type === 'turret') {
        const cave = caveAt(e.wx);
        e.y = e.top ? cave.top + 12 : cave.bot - 12;
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 24) {
          e.cd = dens ? 0.82 : 1.12;
          aimShot(e, dens ? 178 : 150, 3.3, 0, 1);
        }
      } else if (e.type === 'mine') {
        e.spin += dt * 3.4;
        e.y += Math.sin(G.t * 2 + e.phase) * 16 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        e.wx -= 18 * dt;
      } else if (e.type === 'heavy') {
        e.wx += e.vx * dt;
        e.phase += dt;
        e.y += Math.sin(e.phase * 1.3) * 22 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 22, cave.bot - 22);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 20) {
          e.cd = dens ? 0.95 : 1.28;
          aimShot(e, dens ? 170 : 148, 3.5, 0.22, 3);
        }
      } else if (e.type === 'weaver') {
        e.wx += e.vx * dt;
        e.phase += dt;
        const ya = ribbonY(e.railA, e.wx);
        const yb = ribbonY(e.railB, e.wx);
        const u = (Math.sin(e.phase * 1.4) * 0.5 + 0.5);
        e.y = lerp(ya, yb, u);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 30) {
          e.cd = dens ? 1.05 : 1.4;
          aimShot(e, 156, 3.2, 0.16, 2);
        }
      } else if (e.type === 'cap') {
        e.spin += dt * 3.2;
        e.wx -= 28 * dt;
        e.y += e.vy * dt;
        const cave = caveAt(e.wx);
        if (e.y < cave.top + 16 || e.y > cave.bot - 16) e.vy *= -1;
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        if (G.mode === 'play' && G.deadT <= 0 && aabb(e.wx, e.y, e.hw, e.hh, pwx(), G.py, 12, 10)) {
          collectCap(e);
        }
      } else if (e.type === 'boss') {
        updateBoss(e, dt, x);
      }

      if (e.alive && e.type !== 'cap' && G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.winT <= 0) {
        const pr = e.type === 'boss' ? 10 : 8;
        if (aabb(pwx(), G.py, pr, 5.2, e.wx, e.y, e.hw * 0.78, e.hh * 0.78)) {
          G.why = '撞机。';
          killPlayer();
        }
      }
    }
  }

  function updateFx(dt) {
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
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
      f.vy += 40 * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = wisps.length - 1; i >= 0; i--) {
      const w = wisps[i];
      w.t += dt;
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      if (w.t > w.life) wisps.splice(i, 1);
    }
  }

  function update(dt) {
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.15);
      return;
    }
    if (G.mode === 'title') {
      G.t += dt;
      G.cam += 22 * dt;
      updateFx(dt);
      return;
    }
    if (G.mode === 'lose') {
      G.t += dt;
      updateFx(dt);
      return;
    }
    if (G.mode === 'win') {
      G.t += dt;
      G.cam += 36 * dt;
      updateFx(dt);
      return;
    }

    if (G.winT > 0) {
      G.t += dt;
      G.winT -= dt;
      G.cam += scrollSpd() * dt * 0.4;
      updateEnts(dt);
      updateShots(dt);
      updateRibbon(dt);
      updateFx(dt);
      if (G.winT <= 0) winGame();
      return;
    }

    if (G.deadT > 0) {
      G.t += dt;
      G.deadT -= dt;
      G.cam += scrollSpd() * dt * 0.35;
      trySpawn();
      updateEnts(dt);
      updateShots(dt);
      updateRibbon(dt);
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
    updateCharge(dt);
    updateRibbon(dt);
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
      c.fillStyle = rgba(i % 3 === 0 ? CYN : WHT, 0.22 + s.p * 0.5);
      const r = s.s * scale;
      c.fillRect(sx(x), sy(s.y), r, r);
    }
  }

  function drawCave() {
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
    c.fillStyle = G.stage === 3 ? '#070816' : G.stage === 2 ? '#08101e' : '#0a1226';
    c.fill();

    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      c.lineTo(sx(x), sy(cv.bot));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    c.fillStyle = G.stage === 3 ? '#0a0c1c' : G.stage === 2 ? '#0c1428' : '#0e1630';
    c.fill();

    c.strokeStyle = rgba(G.stage === 3 ? VIO : BLU, G.stage === 3 ? 0.55 : 0.42);
    c.lineWidth = Math.max(1, 1.6 * scale);
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(cv.bot));
      else c.lineTo(sx(x), sy(cv.bot));
    }
    c.stroke();
    c.strokeStyle = rgba(CYN, 0.3);
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const cv = caveAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(cv.top));
      else c.lineTo(sx(x), sy(cv.top));
    }
    c.stroke();
  }

  function drawTracks() {
    const c = ctx;
    const n = ribbonCount(G.cam + VW * 0.5);
    const hot = G.rib.on && G.rib.latch;
    for (let i = 0; i < n; i++) {
      const latched = hot && G.rib.rail === i;
      c.beginPath();
      for (let x = 0; x <= VW; x += 6) {
        const y = ribbonY(i, G.cam + x);
        if (x === 0) c.moveTo(sx(x), sy(y));
        else c.lineTo(sx(x), sy(y));
      }
      c.strokeStyle = rgba(latched ? GOLD : (i === 1 ? CYN : BLU), latched ? 0.85 : 0.28 + Math.sin(G.t * 2.2 + i) * 0.08);
      c.lineWidth = Math.max(1, (latched ? 3.2 : 1.4) * scale);
      c.stroke();
      if (latched && !REDUCE) {
        c.strokeStyle = rgba(WHT, 0.45);
        c.lineWidth = Math.max(1, 1.1 * scale);
        c.stroke();
      }
    }
  }

  function drawRibbon() {
    if (!G.rib.on) return;
    const c = ctx;
    const end = ribEndX();
    const fade = 1 - G.rib.t / G.rib.max;
    const rgb = G.rib.full ? GOLD : CYN;
    const thick = (G.rib.full ? 11 : 6) * fade;
    c.beginPath();
    c.moveTo(sx(G.px + 12), sy(G.py));
    for (let x = G.px + 12; x <= end; x += 8) {
      c.lineTo(sx(x), sy(ribYAt(x)));
    }
    c.strokeStyle = rgba(rgb, 0.22 + fade * 0.28);
    c.lineWidth = Math.max(1, thick * 2.2 * scale);
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke();
    c.strokeStyle = rgba(rgb, 0.7 + fade * 0.25);
    c.lineWidth = Math.max(1, thick * scale);
    c.stroke();
    c.strokeStyle = rgba(WHT, 0.7 * fade);
    c.lineWidth = Math.max(1, thick * 0.28 * scale);
    c.stroke();
    if (!REDUCE) {
      for (let x = G.px + 18; x <= end; x += 22) {
        const y = ribYAt(x);
        c.fillStyle = rgba(rgb, 0.35 * fade);
        c.fillRect(sx(x - 1), sy(y - thick * 0.9), 2 * scale, thick * 1.8 * scale);
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
      c.fillStyle = rgba(WHT, G.muzzle / 0.05);
      c.beginPath();
      c.ellipse(18 * s, 0, 10 * s, 3.2 * s, 0, 0, TAU);
      c.fill();
    }
    const chg = clamp(G.chg / chgNeed().b, 0, 1);
    if (G.chgHold && chg > 0.08) {
      const rad = 3 + chg * 10;
      c.strokeStyle = rgba(G.chgLv >= 2 ? GOLD : CYN, 0.75);
      c.lineWidth = Math.max(1, 1.5 * s);
      c.beginPath();
      c.arc(16 * s, 0, rad * s, -1.2, 1.2);
      c.stroke();
      c.beginPath();
      c.arc(16 * s, 0, rad * 0.62 * s, 0.4, 2.6);
      c.stroke();
      c.fillStyle = rgba(G.chgLv >= 2 ? GOLD : CYN, 0.22 + chg * 0.4);
      c.beginPath();
      c.arc(16 * s, 0, rad * 0.45 * s, 0, TAU);
      c.fill();
    }
    c.fillStyle = rgba(VIO, 0.75);
    c.beginPath();
    c.moveTo(-14 * s, -3 * s);
    c.quadraticCurveTo(-24 * s, -10 * s, -28 * s, -2 * s);
    c.quadraticCurveTo(-24 * s, 10 * s, -14 * s, 3 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(BLU, 0.96);
    c.beginPath();
    c.moveTo(-8 * s, -9 * s);
    c.lineTo(6 * s, -4.5 * s);
    c.lineTo(6 * s, 4.5 * s);
    c.lineTo(-8 * s, 9 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.96);
    c.beginPath();
    c.moveTo(-8 * s, -3.6 * s);
    c.lineTo(20 * s, 0);
    c.lineTo(-8 * s, 3.6 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 1);
    c.beginPath();
    c.moveTo(4 * s, -2 * s);
    c.lineTo(18 * s, 0);
    c.lineTo(4 * s, 2 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.ellipse(-1 * s, 0, 3.4 * s, 2.2 * s, 0, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawRider(e, x) {
    const c = ctx;
    const s = scale;
    const rgb = e.flash > 0 ? WHT : CYN;
    c.fillStyle = rgba(rgb, 0.92);
    c.beginPath();
    c.moveTo(sx(x + 8), sy(e.y));
    c.lineTo(sx(x - 6), sy(e.y - 6));
    c.lineTo(sx(x - 2), sy(e.y));
    c.lineTo(sx(x - 6), sy(e.y + 6));
    c.closePath();
    c.fill();
    c.strokeStyle = rgba(BLU, 0.7);
    c.lineWidth = Math.max(1, s);
    c.stroke();
  }

  function drawScout(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(e.flash > 0 ? WHT : HOT, 0.95);
    c.beginPath();
    c.moveTo(sx(x - 8), sy(e.y));
    c.lineTo(sx(x + 9), sy(e.y - 5));
    c.lineTo(sx(x + 5), sy(e.y));
    c.lineTo(sx(x + 9), sy(e.y + 5));
    c.closePath();
    c.fill();
  }

  function drawDart(e, x) {
    const c = ctx;
    c.fillStyle = rgba(e.flash > 0 ? WHT : MAG, 0.95);
    c.beginPath();
    c.moveTo(sx(x - 12), sy(e.y));
    c.lineTo(sx(x + 10), sy(e.y - 4));
    c.lineTo(sx(x + 10), sy(e.y + 4));
    c.closePath();
    c.fill();
  }

  function drawTurret(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(e.flash > 0 ? WHT : VIO, 0.9);
    c.fillRect(sx(x - 10), sy(e.y - 7), 20 * s, 14 * s);
    c.fillStyle = rgba(CYN, 0.8);
    c.fillRect(sx(x - 3), sy(e.y - 3), 14 * s, 6 * s);
  }

  function drawMine(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.strokeStyle = rgba(e.flash > 0 ? WHT : MAG, 0.9);
    c.lineWidth = Math.max(1, 1.4 * s);
    c.beginPath();
    c.arc(0, 0, 7 * s, 0, TAU);
    c.stroke();
    c.beginPath();
    c.moveTo(-7 * s, 0);
    c.lineTo(7 * s, 0);
    c.moveTo(0, -7 * s);
    c.lineTo(0, 7 * s);
    c.stroke();
    c.restore();
  }

  function drawHeavy(e, x) {
    const c = ctx;
    const s = scale;
    c.fillStyle = rgba(e.flash > 0 ? WHT : BLU, 0.95);
    c.beginPath();
    c.moveTo(sx(x - 16), sy(e.y - 8));
    c.lineTo(sx(x + 14), sy(e.y - 10));
    c.lineTo(sx(x + 18), sy(e.y));
    c.lineTo(sx(x + 14), sy(e.y + 10));
    c.lineTo(sx(x - 16), sy(e.y + 8));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.85);
    c.fillRect(sx(x - 4), sy(e.y - 3), 10 * s, 6 * s);
  }

  function drawWeaver(e, x) {
    const c = ctx;
    const s = scale;
    c.strokeStyle = rgba(e.flash > 0 ? WHT : GOLD, 0.85);
    c.lineWidth = Math.max(1, 1.5 * s);
    c.beginPath();
    c.moveTo(sx(x - 12), sy(e.y - 8));
    c.quadraticCurveTo(sx(x), sy(e.y), sx(x + 14), sy(e.y - 4));
    c.stroke();
    c.beginPath();
    c.moveTo(sx(x - 12), sy(e.y + 8));
    c.quadraticCurveTo(sx(x), sy(e.y), sx(x + 14), sy(e.y + 4));
    c.stroke();
    c.fillStyle = rgba(CYN, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(e.y), 5 * s, 0, TAU);
    c.fill();
  }

  function drawCap(e, x) {
    const c = ctx;
    const s = scale;
    const rgb = e.kind === 'rib' ? CYN : GOLD;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.fillStyle = rgba(rgb, 0.92);
    c.beginPath();
    c.moveTo(8 * s, 0);
    c.lineTo(0, 8 * s);
    c.lineTo(-8 * s, 0);
    c.lineTo(0, -8 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.font = '700 ' + (9 * s) + 'px "Segoe UI","PingFang SC",sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.rotate(-e.spin);
    c.fillText(e.kind === 'rib' ? '轨' : '火', 0, 0.5 * s);
    c.restore();
  }

  function drawBoss(e, x) {
    const c = ctx;
    const s = scale;
    const r = e.kind === 'core' ? 34 : 26;
    const rgb = e.flash > 0 ? WHT : (e.open >= 0.42 ? GOLD : VIO);
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin * 0.4);
    c.strokeStyle = rgba(rgb, 0.85);
    c.lineWidth = Math.max(1, 2.2 * s);
    c.beginPath();
    const petals = e.kind === 'core' ? 6 : 5;
    for (let i = 0; i < petals; i++) {
      const a = i / petals * TAU;
      const rr = r * (0.72 + e.open * 0.28);
      const px = Math.cos(a) * rr * s;
      const py = Math.sin(a) * rr * s;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
    c.stroke();
    c.fillStyle = rgba(BLU, 0.22);
    c.fill();
    c.rotate(-e.spin * 0.4);
    const coreR = r * 0.28 * (0.7 + e.open);
    c.fillStyle = rgba(e.open >= 0.42 ? GOLD : CYN, 0.95);
    c.beginPath();
    c.arc(0, 0, coreR * s, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(WHT, 0.5 + e.open * 0.4);
    c.lineWidth = Math.max(1, 1.2 * s);
    c.beginPath();
    c.arc(0, 0, coreR * 1.35 * s, 0, TAU * e.open);
    c.stroke();
    c.restore();
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive && e.type !== 'boss') continue;
      const x = scrX(e.wx);
      if (x < -40 || x > VW + 50) continue;
      if (e.type === 'rider') drawRider(e, x);
      else if (e.type === 'scout') drawScout(e, x);
      else if (e.type === 'dart') drawDart(e, x);
      else if (e.type === 'turret') drawTurret(e, x);
      else if (e.type === 'mine') drawMine(e, x);
      else if (e.type === 'heavy') drawHeavy(e, x);
      else if (e.type === 'weaver') drawWeaver(e, x);
      else if (e.type === 'cap') drawCap(e, x);
      else if (e.type === 'boss') drawBoss(e, x);
    }
  }

  function drawShots() {
    const c = ctx;
    const s = scale;
    for (let i = 0; i < G.shots.length; i++) {
      const sh = G.shots[i];
      const x = scrX(sh.wx);
      c.fillStyle = rgba(CYN, 0.95);
      c.fillRect(sx(x - 6), sy(sh.y - 1.2), 12 * s, 2.4 * s);
      c.fillStyle = rgba(WHT, 0.9);
      c.fillRect(sx(x - 2), sy(sh.y - 0.7), 8 * s, 1.4 * s);
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const sh = G.eShots[i];
      const x = scrX(sh.wx);
      c.fillStyle = rgba(MAG, 0.95);
      c.beginPath();
      c.arc(sx(x), sy(sh.y), sh.r * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.55);
      c.beginPath();
      c.arc(sx(x), sy(sh.y), sh.r * 0.4 * s, 0, TAU);
      c.fill();
    }
  }

  function drawBossBar() {
    const e = findBoss();
    if (!e) return;
    const c = ctx;
    const w = 220;
    const h = 7;
    const x = (VW - w) * 0.5;
    const y = 14;
    const t = clamp(e.hp / e.max, 0, 1);
    c.fillStyle = rgba(WHT, 0.12);
    c.fillRect(sx(x), sy(y), w * scale, h * scale);
    c.fillStyle = rgba(t < 0.5 ? MAG : GOLD, 0.9);
    c.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    c.strokeStyle = rgba(WHT, 0.35);
    c.lineWidth = Math.max(1, scale);
    c.strokeRect(sx(x), sy(y), w * scale, h * scale);
  }

  function drawChargeBar() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const need = chgNeed();
    const t = clamp(G.chg / need.b, 0, 1);
    if (t < 0.04 && !G.chgHold && !G.rib.on) return;
    const c = ctx;
    const x = G.px - 18;
    const y = G.py + 16;
    c.fillStyle = rgba(WHT, 0.12);
    c.fillRect(sx(x), sy(y), 36 * scale, 4 * scale);
    c.fillStyle = rgba(t >= 1 ? GOLD : CYN, 0.9);
    c.fillRect(sx(x), sy(y), 36 * t * scale, 4 * scale);
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    const a = G.invuln > 0 ? (Math.sin(G.t * 28) > 0 ? 0.35 : 0.9) : 1;
    drawShip(G.px, G.py, a);
    drawChargeBar();
  }

  function drawFx() {
    const c = ctx;
    const s = scale;
    for (let i = 0; i < wisps.length; i++) {
      const w = wisps[i];
      const a = 1 - w.t / w.life;
      c.fillStyle = rgba(w.rgb, 0.35 * a);
      c.beginPath();
      c.ellipse(sx(w.x), sy(w.y), 7 * s * a, 2 * s, 0, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * s, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      const a = 1 - sp.t / 0.28;
      c.strokeStyle = rgba(sp.rgb, a);
      c.lineWidth = Math.max(1, 1.4 * s);
      c.beginPath();
      const r = sp.rad * (0.4 + sp.t * 4);
      for (let k = 0; k < 6; k++) {
        const ang = k / 6 * TAU;
        c.moveTo(sx(sp.x), sy(sp.y));
        c.lineTo(sx(sp.x + Math.cos(ang) * r), sy(sp.y + Math.sin(ang) * r));
      }
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const a = 1 - rg.t / 0.42;
      c.strokeStyle = rgba(rg.rgb, a * 0.7);
      c.lineWidth = Math.max(1, 1.6 * s);
      c.beginPath();
      c.arc(sx(rg.x), sy(rg.y), (rg.r + rg.t * 70) * s, 0, TAU);
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
    c.fillStyle = '#050a1c';
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
      g.addColorStop(0, '#08101e');
      g.addColorStop(0.55, '#0a0c24');
      g.addColorStop(1, '#10102a');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#0a0818');
      g.addColorStop(0.55, '#0c0822');
      g.addColorStop(1, '#140c2a');
    } else {
      g.addColorStop(0, '#0a1228');
      g.addColorStop(0.55, '#050a1c');
      g.addColorStop(1, '#0c1832');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawCave();
    drawTracks();
    drawEnts();
    drawShots();
    drawRibbon();
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
    G.kind = kind || 'track';
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
    G.pow = 0;
    G.ribLv = 0;
    G.spawnedX = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.chg = 0;
    G.chgHold = false;
    G.chgLv = 0;
    G.chgPing = 0;
    G.rib.on = false;
    G.rib.t = 0;
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
    wisps.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    eid = 1;
  }

  function startGame(kind) {
    resetRun(kind || 'track');
    G.mode = 'play';
    hideOverlay();
    audio.start();
    toast(isRail() ? '核轨' : '星轨', false, true);
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('track');
    G.mode = 'title';
    showOverlay('title', '星轨', '沿星轨突袭。空格连射，Shift 蓄轨束。满蓄咬轨切开核心。撞机、中弹、擦壁都掉命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('track');
    else startGame(G.kind || 'track');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('track');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function holdCharge(on) {
    if (on) {
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play' && G.deadT <= 0 && !G.rib.on) {
        G.chgHold = true;
        if (btnBeam) btnBeam.classList.add('held');
        if (btnPad) btnPad.classList.add('held');
        syncHud();
      }
    } else {
      if (btnBeam) btnBeam.classList.remove('held');
      if (btnPad) btnPad.classList.remove('held');
      if (G.chgHold) fireRibbon();
    }
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
    const beamKey = k === 'z' || k === 'Z' || k === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || beamKey)) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      if (beamKey) holdCharge(false);
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || beamKey)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (beamKey) {
      holdCharge(true);
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'rail' : 'track');
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
        holdCharge(true);
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
      if (e && e.button === 2) holdCharge(false);
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

  function bindBeamBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      holdCharge(true);
    });
    el.addEventListener('pointerup', function (e) {
      e.preventDefault();
      holdCharge(false);
    });
    el.addEventListener('pointercancel', function () { holdCharge(false); });
    el.addEventListener('pointerleave', function () {
      if (G.chgHold) holdCharge(false);
    });
  }

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnTrack) {
    btnTrack.addEventListener('click', function () {
      audio.ensure();
      startGame('track');
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
      startGame(G.kind || 'track');
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
  bindBeamBtn(btnBeam);
  bindBeamBtn(btnPad);

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    G.fireHold = false;
    if (G.chgHold) holdCharge(false);
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = keys.u = keys.d = false;
      G.fireHold = false;
      if (G.chgHold) holdCharge(false);
    }
  });

  requestAnimationFrame(frame);
})();
