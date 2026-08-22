'use strict';

/* 报童 — Paperboy remake. No CDN. */

(function () {
  const VW = 480;
  const VH = 720;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const PLAYER_SY = 534;
  const ISO_SX = 0.86;
  const ISO_SY = 0.54;
  const ISO_SK = 0.40;
  const ISO_Z = 0.78;
  const ROAD = 40;
  const LAWN = 90;
  const HOUSE_X = 126;
  const MAIL_X = 54;
  const PORCH_X = 90;
  const LIVES = 3;
  const BAG0 = 24;
  const BAG_MAX = 40;
  const COMBO_WIN = 2.4;
  const GRAV = 420;
  const BEST_KEY = 'playbox-paper-toss-best';
  const MUTE_KEY = 'playbox-paper-toss-mute';
  const OPS = '← → 转向 · 空格丢最近一户 · 点按丢 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const LIME = [140, 255, 46];
  const LIM2 = [200, 255, 106];
  const WHT = [246, 243, 255];
  const PNK = [255, 160, 210];
  const PUR = [155, 92, 255];
  const ORG = [255, 168, 74];
  const ROAD_C = [18, 22, 28];
  const LAWN_C = [10, 28, 16];
  const WALLS = [
    [48, 78, 92],
    [78, 48, 86],
    [52, 72, 48],
    [86, 58, 46],
    [46, 56, 88],
    [70, 42, 58]
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
  const btnMon = document.getElementById('btn-mon');
  const btnSun = document.getElementById('btn-sun');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnThrow = document.getElementById('btn-throw');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const modeLabel = document.getElementById('mode-label');
  const routeLabel = document.getElementById('route-label');
  const bagLabel = document.getElementById('bag-label');
  const comboTag = document.getElementById('combo-label');
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

  const keys = { l: false, r: false };
  const pointer = { down: false, x: VW * 0.5, y: PLAYER_SY, id: null, t0: 0, x0: 0, y0: 0 };
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const shards = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'mon',
    t: 0,
    clock: 0,
    seed: 1,
    score: 0,
    best: { m: 0, s: 0 },
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    lives: LIVES,
    bag: BAG0,
    bike: { x: 0, y: 40, vx: 0, lean: 0, pedal: 0, r: 10, sqx: 1, sqy: 1 },
    cam: 0,
    houses: [],
    obs: [],
    papers: [],
    packs: [],
    shots: 0,
    delivered: 0,
    smashed: 0,
    missed: 0,
    subs: 0,
    fireCd: 0,
    throwLatch: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: LIME,
    punch: 1,
    overShown: false,
    why: '',
    record: false,
    finishT: 0,
    aimH: null
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function isSun() {
    return G.kind === 'sun';
  }
  function bestOf() {
    return isSun() ? G.best.s : G.best.m;
  }
  function cruise() {
    return isSun() ? 198 : 156;
  }
  function streetLen() {
    return isSun() ? 6400 : 5200;
  }
  function turnSpd() {
    return isSun() ? 268 : 244;
  }
  function hash(n, salt) {
    let x = Math.imul(n | 0, 374761393) ^ Math.imul(salt | 0, 668265263) ^ (G.seed | 0);
    x = Math.imul(x ^ (x >>> 13), 1274126177);
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  }
  function mixRgb(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t) | 0,
      (a[1] + (b[1] - a[1]) * t) | 0,
      (a[2] + (b[2] - a[2]) * t) | 0
    ];
  }
  function darken(rgb, k) {
    return [(rgb[0] * k) | 0, (rgb[1] * k) | 0, (rgb[2] * k) | 0];
  }

  function proj(wx, wy, wz) {
    const dy = wy - G.cam;
    return {
      x: ox + (VW * 0.5 + wx * ISO_SX + dy * ISO_SK) * scale,
      y: oy + (PLAYER_SY - dy * ISO_SY - (wz || 0) * ISO_Z) * scale
    };
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
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
        this.master.gain.value = this.muted ? 0 : 0.32;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
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
    noise(dur, vol, hp, lp) {
      if (!this.ctx || this.muted) return;
      const n = Math.max(0.04, dur);
      const sr = this.ctx.sampleRate;
      const buf = this.ctx.createBuffer(1, Math.max(1, (sr * n) | 0), sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = hp ? 'highpass' : 'lowpass';
      f.frequency.value = hp || lp || 900;
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
    thwack() {
      this.ensure();
      this.noise(0.07, 0.09, 1400);
      this.beep(220, 0.06, 'square', 0.05, 90);
    },
    porch() {
      this.ensure();
      this.beep(620, 0.08, 'triangle', 0.07, 880);
      this.beep(1240, 0.12, 'square', 0.035, 1560);
      this.noise(0.05, 0.04, 2200);
    },
    mail() {
      this.ensure();
      this.beep(880, 0.07, 'square', 0.06, 1320);
      this.beep(1320, 0.12, 'triangle', 0.045, 1760);
      this.beep(1760, 0.1, 'sine', 0.03, 2200);
    },
    glass() {
      this.ensure();
      this.noise(0.18, 0.11, 2400);
      this.beep(1480, 0.14, 'square', 0.05, 420);
      this.beep(990, 0.1, 'triangle', 0.04, 220);
    },
    miss() {
      this.ensure();
      this.beep(180, 0.16, 'sawtooth', 0.055, 80);
      this.noise(0.1, 0.035, 400);
    },
    crash() {
      this.ensure();
      this.noise(0.28, 0.13, 0, 640);
      this.beep(130, 0.22, 'sawtooth', 0.09, 46);
    },
    pickup() {
      this.ensure();
      this.beep(520, 0.06, 'square', 0.04, 780);
      this.beep(780, 0.1, 'triangle', 0.035, 1040);
    },
    combo(n) {
      this.ensure();
      this.beep(480 + n * 70, 0.12, 'triangle', 0.05, 920 + n * 40);
    },
    bark() {
      this.ensure();
      this.beep(240, 0.08, 'square', 0.05, 140);
      this.beep(160, 0.1, 'sawtooth', 0.04, 90);
    },
    bonus() {
      this.ensure();
      this.beep(523, 0.1, 'triangle', 0.05, 659);
      this.beep(659, 0.12, 'square', 0.04, 784);
      this.beep(784, 0.18, 'triangle', 0.045, 1046);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'triangle', 0.04, 524);
      this.beep(524, 0.12, 'square', 0.03, 784);
    },
    record() {
      this.ensure();
      this.beep(660, 0.1, 'triangle', 0.04, 990);
      this.beep(990, 0.16, 'square', 0.035, 1320);
    },
    empty() {
      this.ensure();
      this.beep(140, 0.1, 'square', 0.04, 90);
    }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return { m: 0, s: 0 };
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        return { m: o.m | 0, s: o.s | 0 };
      }
      const n = parseInt(raw, 10) || 0;
      return { m: n, s: 0 };
    } catch (err) {
      return { m: 0, s: 0 };
    }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(G.best));
    } catch (err) { /* ignore */ }
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
    }, gold ? 1100 : 820);
  }

  function setHint(text) {
    if (hintEl) hintEl.textContent = text;
  }

  function popScore(n) {
    if (!scoreAdd) return;
    const sign = n < 0 ? '' : '+';
    scoreAdd.hidden = false;
    scoreAdd.textContent = sign + n;
    scoreAdd.style.color = n < 0 ? '#ff9ad4' : '#eaffc8';
    addTok += 1;
    const tok = addTok;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    setTimeout(function () {
      if (tok === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function addScore(n, x, y, rgb, gold) {
    if (G.mode !== 'play' && G.mode !== 'win') return;
    G.score = Math.max(0, G.score + n);
    popScore(n);
    if (x != null) {
      const s = n < 0 ? String(n) : '+' + n;
      floatText(x, y, s, rgb || (n < 0 ? MAG : LIME), gold);
    }
    noteBest();
  }

  function noteBest() {
    const k = isSun() ? 's' : 'm';
    if (G.score > G.best[k]) {
      const first = G.best[k] === 0;
      G.best[k] = G.score;
      saveBest();
      if (!first && !G.record && G.score >= 400) {
        G.record = true;
        toast('新纪录', false, true);
        audio.record();
      }
    }
  }

  function mult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 2));
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(bestOf());
    if (comboEl) comboEl.textContent = '×' + Math.max(1, G.combo);
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 3);
    if (comboTag) {
      if (G.combo >= 3 && G.mode === 'play') {
        comboTag.hidden = false;
        comboTag.textContent = '连投 ×' + G.combo;
        comboTag.classList.toggle('hot', G.combo >= 5);
      } else comboTag.hidden = true;
    }
    if (modeLabel) {
      modeLabel.textContent = isSun() ? '周日' : '周一';
      modeLabel.classList.toggle('sun', isSun());
    }
    if (routeLabel) routeLabel.textContent = '订 ' + G.delivered + '/' + G.subs;
    if (bagLabel) {
      bagLabel.textContent = '报 ' + G.bag;
      bagLabel.classList.toggle('low', G.bag <= 4);
    }
    if (pipsEl) {
      const kids = pipsEl.children;
      for (let i = 0; i < kids.length; i++) {
        kids[i].classList.toggle('on', i < G.lives);
        kids[i].classList.toggle('off', i >= G.lives);
      }
    }
    if (G.mode === 'title') setHint(OPS);
    else if (G.mode === 'dead') setHint('R 再骑 · 最高已记下');
    else if (G.mode === 'win') setHint('街骑完了 · R 再来 · 换日再试');
    else setHint('← → 转向 · 空格丢报 · 走廊 / 信箱 · 砸窗扣命');
  }

  function buildPips() {
    if (!pipsEl) return;
    pipsEl.innerHTML = '';
    for (let i = 0; i < LIVES; i++) {
      const s = document.createElement('span');
      s.className = 'pip on';
      pipsEl.appendChild(s);
    }
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (stageEl) stageEl.classList.remove('idle');
    if (canvas && canvas.focus) canvas.focus();
  }

  function showOverlay() {
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    if (stageEl) stageEl.classList.add('idle');
  }

  function showTitle() {
    G.mode = 'title';
    G.kind = G.kind || 'mon';
    showOverlay();
    panel.classList.remove('lose', 'win');
    ovKicker.textContent = 'PAPER';
    ovTitle.textContent = '报童';
    ovLead.textContent = '骑车沿街把报纸丢上走廊。砸窗就惨了。';
    ovOps.textContent = OPS;
    ovStart.classList.remove('gone');
    ovEnd.classList.add('gone');
    resetRun(true);
    syncHud();
  }

  function showEnd(win) {
    G.overShown = true;
    G.mode = win ? 'win' : 'dead';
    showOverlay();
    panel.classList.toggle('win', !!win);
    panel.classList.toggle('lose', !win);
    ovKicker.textContent = win ? 'ROUTE' : 'CRASH';
    const why = {
      crash: '撞上了',
      dog: '被狗咬了',
      car: '被车撞了',
      dancer: '撞舞了',
      mower: '被割草机铲了',
      window: '砸窗太多',
      empty: '没命了'
    };
    ovTitle.textContent = win ? '街骑完了' : (why[G.why] || '摔了');
    const rec = G.record ? ' · 新纪录' : '';
    ovLead.textContent = (win ? '送到 ' : '订户 ') + G.delivered + '/' + G.subs +
      ' · 砸窗 ' + G.smashed + ' · 漏订 ' + G.missed +
      ' · 连投 ×' + Math.max(1, G.maxCombo) +
      ' · ' + G.score + ' 分' + rec;
    ovOps.textContent = 'R 再骑 · 最高 ' + bestOf();
    ovStart.classList.add('gone');
    ovEnd.classList.remove('gone');
    syncHud();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const c = cls || (mag >= 5 ? 'die' : 'hit');
    stageEl.classList.remove('die', 'hit', 'win');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
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
        z: spec.z || 0,
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        vz: spec.vz0 != null ? rand(spec.vz0, spec.vz1) : rand(40, 140),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 260);
  }

  function popSpark(x, y, z, rgb, rad) {
    sparks.push({ x: x, y: y, z: z || 8, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, z: z || 4, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 36);
    capArr(rings, 24);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, z: 18, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.7,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -92 : -74
    });
    capArr(floats, 24);
  }

  function emitGlass(x, y, z) {
    for (let i = 0; i < 14; i++) {
      shards.push({
        x: x, y: y, z: z || 22,
        vx: rand(-90, 90), vy: rand(-40, 70), vz: rand(40, 180),
        w: rand(2, 5), h: rand(3, 7), rot: rand(0, TAU), spin: rand(-10, 10),
        life: rand(0.35, 0.7), rgb: Math.random() > 0.5 ? CYN : WHT
      });
    }
    capArr(shards, 80);
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    shards.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 48; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH * 0.55),
        r: rand(0.5, 1.6),
        a: rand(0.18, 0.7),
        tw: rand(0, TAU)
      });
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    if (G.combo === 3) toast('连投', false, true);
    else if (G.combo === 5) toast('顺手', false, true);
    else if (G.combo === 8) toast('报神', false, true);
    else if (G.combo === 12) toast('整条街', false, true);
    if (G.combo >= 2) audio.combo(G.combo);
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      if (G.combo >= 3) comboBox.classList.add('hot');
    }
  }

  function breakCombo() {
    const had = G.combo;
    G.combo = 0;
    G.comboT = 0;
    if (had) syncHud();
  }

  function resetRun(demo) {
    G.seed = (Math.random() * 0x7fffffff) | 0;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.maxCombo = 0;
    G.lives = LIVES;
    G.bag = BAG0;
    G.shots = 0;
    G.delivered = 0;
    G.smashed = 0;
    G.missed = 0;
    G.subs = 0;
    G.fireCd = 0;
    G.throwLatch = false;
    G.deadT = 0;
    G.invuln = 0;
    G.overShown = false;
    G.why = '';
    G.record = false;
    G.finishT = 0;
    G.aimH = null;
    G.bike.x = 0;
    G.bike.y = 40;
    G.bike.vx = 0;
    G.bike.lean = 0;
    G.bike.pedal = 0;
    G.bike.r = 10;
    G.bike.sqx = 1;
    G.bike.sqy = 1;
    G.cam = G.bike.y;
    G.houses = [];
    G.obs = [];
    G.papers = [];
    G.packs = [];
    pointer.down = false;
    pointer.id = null;
    resetFx();
    seedStars();
    buildStreet();
    if (!demo) G.t = 0;
  }

  function buildStreet() {
    const sun = isSun();
    const len = streetLen();
    const gap = sun ? 232 : 278;
    const start = 320;
    let y = start;
    let i = 0;
    while (y < len - 420) {
      const h = hash(i, 3);
      const side = (i % 2 === 0 ? -1 : 1) * (hash(i, 7) > 0.12 ? 1 : -1);
      const sub = hash(i, 11) > (sun ? 0.22 : 0.16);
      const pal = WALLS[(hash(i, 19) * WALLS.length) | 0];
      G.houses.push({
        y: y + (h - 0.5) * 28,
        side: side,
        sub: sub,
        pal: pal,
        trim: hash(i, 23) > 0.5 ? CYN : LIME,
        delivered: 0,
        smash: false,
        paper: null,
        wiggle: 0
      });
      if (sub) G.subs += 1;
      if (hash(i, 29) > 0.55) {
        G.packs.push({
          x: side * (ROAD + 10 + hash(i, 31) * 16),
          y: y + 70 + hash(i, 37) * 40,
          taken: false,
          bob: hash(i, 41) * TAU
        });
      }
      y += gap;
      i += 1;
    }

    const nDog = sun ? 10 : 5;
    const nCar = sun ? 14 : 6;
    const nDan = sun ? 6 : 3;
    const nMow = sun ? 7 : 3;
    const nX = sun ? 8 : 3;
    for (let k = 0; k < nDog; k++) {
      const hy = 480 + hash(k, 101) * (len - 900);
      const sd = hash(k, 103) > 0.5 ? 1 : -1;
      G.obs.push({
        type: 'dog', x: sd * (58 + hash(k, 105) * 22), y: hy,
        vx: 0, vy: 0, r: 11, t: hash(k, 107) * TAU, chase: 0, alive: true, side: sd
      });
    }
    for (let k = 0; k < nCar; k++) {
      const hy = 700 + hash(k, 111) * (len - 1100);
      const toward = hash(k, 113) > 0.42;
      const lane = (hash(k, 115) > 0.5 ? 1 : -1) * (14 + hash(k, 117) * 16);
      G.obs.push({
        type: 'car', x: lane, y: hy,
        vx: 0, vy: toward ? -(sun ? 210 : 150) : (sun ? 70 : 40),
        r: 16, t: 0, alive: true, pal: hash(k, 119) > 0.5 ? MAG : CYN, w: 18, d: 28
      });
    }
    for (let k = 0; k < nDan; k++) {
      const hy = 900 + hash(k, 121) * (len - 1400);
      G.obs.push({
        type: 'dancer', x: (hash(k, 123) - 0.5) * 48, y: hy,
        vx: 0, vy: 0, r: 12, t: hash(k, 125) * TAU, alive: true
      });
    }
    for (let k = 0; k < nMow; k++) {
      const hy = 600 + hash(k, 131) * (len - 1200);
      const sd = hash(k, 133) > 0.5 ? 1 : -1;
      G.obs.push({
        type: 'mower', x: sd * (50 + hash(k, 135) * 28), y: hy,
        vx: sd * (sun ? 70 : 48), vy: 0, r: 13, t: 0, alive: true, side: sd
      });
    }
    for (let k = 0; k < nX; k++) {
      const hy = 1100 + hash(k, 141) * (len - 1600);
      const dir = hash(k, 143) > 0.5 ? 1 : -1;
      G.obs.push({
        type: 'car', x: dir * -220, y: hy,
        vx: dir * (sun ? 260 : 190), vy: 0, r: 16, t: 0, alive: true,
        pal: GOLD, w: 28, d: 16, cross: true
      });
    }
  }

  function startGame(kind) {
    G.kind = kind === 'sun' ? 'sun' : 'mon';
    G.mode = 'play';
    resetRun(false);
    hideOverlay();
    audio.start();
    toast(isSun() ? '周日 · 车多' : '周一 · 好骑', false, isSun());
    syncHud();
  }

  function restart() {
    if (G.mode === 'title') startGame('mon');
    else startGame(G.kind);
  }

  function nearestHouse() {
    const b = G.bike;
    let best = null;
    let score = 1e9;
    for (let i = 0; i < G.houses.length; i++) {
      const h = G.houses[i];
      if (h.delivered !== 0) continue;
      const dy = h.y - b.y;
      if (dy < 12 || dy > 270) continue;
      const tx = h.side * PORCH_X;
      let d = hypot(tx - b.x, dy * 0.5);
      if (b.x * h.side < -10) d += 46;
      if (d < score) {
        score = d;
        best = h;
      }
    }
    return best;
  }

  function throwPaper() {
    if ((G.mode !== 'play' && G.mode !== 'title') || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    if (G.mode === 'play' && G.bag <= 0) {
      audio.empty();
      toast('没报了', true, false);
      return;
    }
    const b = G.bike;
    const h = nearestHouse();
    let tx = b.x + (b.x >= 0 ? 70 : -70);
    let ty = b.y + 140;
    let aimMail = false;
    if (h) {
      const mailX = h.side * MAIL_X;
      const porchX = h.side * PORCH_X;
      const closeMail = Math.abs(b.x - mailX) < 30 && Math.abs(b.x) > 18;
      aimMail = closeMail;
      tx = aimMail ? mailX : porchX;
      ty = h.y + (aimMail ? 0 : 4);
    }
    const oxp = b.x + (dxDir(tx, b.x) * 8);
    const oyp = b.y + 8;
    const z0 = 16;
    const vz0 = 122;
    const tLand = (vz0 + Math.sqrt(vz0 * vz0 + 2 * GRAV * z0)) / GRAV;
    const dx = tx - oxp;
    const dy = ty - oyp;
    if (G.mode === 'play') {
      G.bag -= 1;
      G.shots += 1;
    }
    G.fireCd = G.mode === 'title' ? 0.95 : 0.2;
    G.papers.push({
      x: oxp,
      y: oyp,
      z: z0,
      vx: dx / tLand + b.vx * 0.12,
      vy: dy / tLand,
      vz: vz0,
      rot: 0,
      spin: rand(-14, 14),
      live: true,
      house: h
    });
    audio.thwack();
    emit(6, {
      x: b.x, y: b.y, z: 14, j: 4,
      vx0: dx * 0.4, vx1: dx * 0.9,
      vy0: 20, vy1: 80, vz0: 20, vz1: 80,
      life: 0.22, r0: 0.8, r1: 2.2, rgb: WHT, g: 80
    });
    kick(1.4, 'hit');
    syncHud();
  }

  function dxDir(tx, bx) {
    return tx >= bx ? 1 : -1;
  }

  function landPaper(p) {
    p.live = false;
    const h = p.house;
    function hitMail(hh) {
      const mx = hh.side * MAIL_X;
      return hypot(p.x - mx, p.y - hh.y) < 12;
    }
    function hitPorch(hh) {
      const px = hh.side * PORCH_X;
      return hypot(p.x - px, p.y - (hh.y + 2)) < 24;
    }
    function hitHouse(hh) {
      const hx = hh.side * HOUSE_X;
      return Math.abs(p.x - hx) < 28 && Math.abs(p.y - hh.y) < 24;
    }

    let target = h;
    if (!target) {
      let best = null;
      let bd = 36;
      for (let i = 0; i < G.houses.length; i++) {
        const hh = G.houses[i];
        const d = hypot(p.x - hh.side * PORCH_X, p.y - hh.y);
        if (d < bd) {
          bd = d;
          best = hh;
        }
      }
      target = best;
    }

    if (target && target.delivered === 0) {
      if (hitMail(target)) {
        resolveHouse(target, 2, p);
        return;
      }
      if (hitPorch(target)) {
        resolveHouse(target, 1, p);
        return;
      }
      if (hitHouse(target)) {
        resolveHouse(target, -1, p);
        return;
      }
    }
    if (G.mode !== 'play') return;
    audio.miss();
    emit(8, {
      x: p.x, y: p.y, z: 2, j: 6,
      vx0: -50, vx1: 50, vy0: -20, vy1: 40, vz0: 20, vz1: 70,
      life: 0.3, r0: 1, r1: 2.4, rgb: PNK, g: 200
    });
    floatText(p.x, p.y, '偏了', PNK, false);
  }

  function resolveHouse(h, kind, p) {
    if (h.delivered !== 0) return;
    h.delivered = kind;
    h.paper = { x: p.x, y: p.y, z: 2 };
    if (kind === -1) h.smash = true;
    h.wiggle = 0.18;
    if (G.mode !== 'play') return;
    const m = mult();
    if (kind === 2) {
      if (h.sub) {
        G.delivered += 1;
        const n = 250 * m;
        addScore(n, p.x, h.y, GOLD, true);
        bumpCombo();
        toast(m > 1 ? '信箱 ×' + m : '信箱', false, true);
      } else {
        addScore(-30, p.x, h.y, MAG, false);
        breakCombo();
        toast('不是订户', true, false);
      }
      audio.mail();
      popSpark(h.side * MAIL_X, h.y, 16, GOLD, 22);
      emit(18, {
        x: h.side * MAIL_X, y: h.y, z: 12, j: 8,
        vx0: -110, vx1: 110, vy0: -40, vy1: 80, vz0: 60, vz1: 200,
        life: 0.42, r0: 1.2, r1: 3.2, rgb: GOLD, g: 240
      });
      hitStop(0.055);
      kick(2.6, 'hit');
      screenFlash(GOLD, 0.28);
    } else if (kind === 1) {
      if (h.sub) {
        G.delivered += 1;
        const n = 100 * m;
        addScore(n, p.x, h.y, LIME, m > 1);
        bumpCombo();
        if (m > 1) toast('走廊 ×' + m, false, true);
      } else {
        addScore(-20, p.x, h.y, MAG, false);
        breakCombo();
        toast('不是订户', true, false);
      }
      audio.porch();
      popSpark(h.side * PORCH_X, h.y, 10, LIME, 20);
      emit(14, {
        x: h.side * PORCH_X, y: h.y, z: 8, j: 10,
        vx0: -90, vx1: 90, vy0: -30, vy1: 70, vz0: 40, vz1: 160,
        life: 0.36, r0: 1, r1: 2.8, rgb: LIME, g: 220
      });
      hitStop(0.04);
      kick(2.1, 'hit');
      screenFlash(LIME, 0.22);
    } else {
      G.smashed += 1;
      breakCombo();
      audio.glass();
      emitGlass(h.side * (HOUSE_X - 8), h.y, 24);
      popSpark(h.side * HOUSE_X, h.y, 22, CYN, 18);
      screenFlash(MAG, 0.42);
      kick(5.5, 'die');
      hitStop(0.07);
      if (h.sub) {
        addScore(-100, p.x, h.y, MAG, false);
        toast('砸窗了', true, false);
      } else {
        addScore(-80, p.x, h.y, MAG, false);
        toast('砸窗了', true, false);
      }
      if (isSun() || G.smashed >= 2) loseLife('window');
    }
    syncHud();
  }

  function missHouse(h) {
    if (h.delivered !== 0) return;
    h.delivered = -2;
    if (h.sub) {
      G.missed += 1;
      breakCombo();
      addScore(-60, h.side * PORCH_X, h.y, MAG, false);
      toast('漏订', true, false);
      audio.miss();
    }
    syncHud();
  }

  function loseLife(why) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (why !== 'window' && G.invuln > 0) return;
    G.why = why;
    G.lives -= 1;
    G.deadT = 0.62;
    G.bike.sqx = 1.35;
    G.bike.sqy = 0.45;
    breakCombo();
    audio.crash();
    hitStop(0.08);
    kick(7, 'die');
    screenFlash(MAG, 0.5);
    const b = G.bike;
    emit(28, {
      x: b.x, y: b.y, z: 8, j: 10,
      vx0: -160, vx1: 160, vy0: -80, vy1: 120, vz0: 40, vz1: 220,
      life: 0.55, r0: 1.4, r1: 4, rgb: MAG, g: 280
    });
    emit(12, {
      x: b.x, y: b.y, z: 6, j: 8,
      vx0: -90, vx1: 90, vy0: -40, vy1: 80, vz0: 20, vz1: 120,
      life: 0.4, r0: 1, r1: 2.6, rgb: GOLD, g: 200
    });
    syncHud();
  }

  function respawn() {
    if (G.lives <= 0) {
      showEnd(false);
      return;
    }
    G.deadT = 0;
    G.invuln = 1.45;
    G.bike.sqx = 1;
    G.bike.sqy = 1;
    G.bike.x = clamp(G.bike.x * 0.4, -18, 18);
    G.bike.vx = 0;
  }

  function finishStreet() {
    if (G.mode !== 'play') return;
    G.mode = 'win';
    G.finishT = 0.55;
    const perfect = G.smashed === 0 && G.missed === 0 && G.delivered === G.subs;
    const bonus = 800 + G.lives * 350 + G.delivered * 40 + (perfect ? 1500 : 0);
    addScore(bonus, G.bike.x, G.bike.y + 40, GOLD, true);
    audio.bonus();
    hitStop(0.06);
    kick(3, 'win');
    screenFlash(GOLD, 0.35);
    toast(perfect ? '完美投递 +' + bonus : '街尾彩头 +' + bonus, false, true);
    syncHud();
  }

  function hitObs(o) {
    const b = G.bike;
    const dx = b.x - o.x;
    const dy = b.y - o.y;
    const rr = b.r + o.r;
    return dx * dx + dy * dy < rr * rr;
  }

  function updateDemo(dt) {
    const b = G.bike;
    b.y += cruise() * 0.72 * dt;
    if (b.y > streetLen() - 200) {
      resetRun(true);
      return;
    }
    let steer = -b.x * 1.4;
    for (let i = 0; i < G.obs.length; i++) {
      const o = G.obs[i];
      const dy = o.y - b.y;
      if (dy > 10 && dy < 150 && Math.abs(o.x - b.x) < 28) {
        steer += o.x > b.x ? -220 : 220;
      }
    }
    b.vx = clamp(b.vx + steer * dt, -turnSpd(), turnSpd());
    b.x = clamp(b.x + b.vx * dt, -LAWN + 10, LAWN - 10);
    G.fireCd -= dt;
    if (G.fireCd < 0 && G.bag > 0) {
      const h = nearestHouse();
      if (h && Math.abs(b.x - h.side * PORCH_X) < 70 && h.y - b.y < 180) throwPaper();
    }
  }

  function updatePlay(dt) {
    const b = G.bike;
    if (G.deadT > 0) {
      G.deadT -= dt;
      b.sqx = lerp(b.sqx, 1.4, 0.2);
      b.sqy = lerp(b.sqy, 0.4, 0.2);
      if (G.deadT <= 0) respawn();
      return;
    }
    if (G.mode === 'win') {
      G.finishT -= dt;
      b.y += cruise() * dt;
      b.sqx = lerp(b.sqx, 1, 0.15);
      b.sqy = lerp(b.sqy, 1, 0.15);
      if (G.finishT <= 0 && !G.overShown) showEnd(true);
      return;
    }

    let ax = 0;
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (pointer.down) {
      const tx = (pointer.x - VW * 0.5) / ISO_SX;
      const want = clamp(tx, -LAWN + 8, LAWN - 8);
      ax += clamp((want - b.x) / 40, -1.2, 1.2);
    }
    const spd = turnSpd();
    if (ax !== 0) b.vx = clamp(b.vx + ax * spd * 3.2 * dt, -spd, spd);
    else b.vx *= Math.pow(0.18, dt * 4);
    b.x = clamp(b.x + b.vx * dt, -LAWN + 8, LAWN - 8);
    const lawnSlow = Math.abs(b.x) > ROAD + 4 ? 0.86 : 1;
    const comboBoost = 1 + Math.min(0.12, G.combo * 0.012);
    b.y += cruise() * lawnSlow * comboBoost * dt;
    b.lean = lerp(b.lean, b.vx / spd, 0.18);
    b.pedal += dt * 14 * comboBoost;
    b.sqx = lerp(b.sqx, 1, 0.18);
    b.sqy = lerp(b.sqy, 1, 0.18);
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    G.aimH = nearestHouse();

    if (b.y >= streetLen()) finishStreet();

    for (let i = 0; i < G.houses.length; i++) {
      const h = G.houses[i];
      if (h.wiggle > 0) h.wiggle -= dt;
      if (h.delivered === 0 && h.y + 18 < b.y) missHouse(h);
    }

    for (let i = 0; i < G.packs.length; i++) {
      const p = G.packs[i];
      if (p.taken) continue;
      p.bob += dt * 4;
      if (hypot(p.x - b.x, p.y - b.y) < 16) {
        p.taken = true;
        G.bag = Math.min(BAG_MAX, G.bag + 8);
        audio.pickup();
        popSpark(p.x, p.y, 10, CYN, 14);
        floatText(p.x, p.y, '+8 报', CYN, false);
        addScore(20, p.x, p.y, CYN, false);
        syncHud();
      }
    }

    if (G.invuln <= 0) {
      for (let i = 0; i < G.obs.length; i++) {
        const o = G.obs[i];
        if (!o.alive) continue;
        if (hitObs(o)) {
          loseLife(o.type === 'dog' ? 'dog' : o.type === 'car' ? 'car' : o.type === 'dancer' ? 'dancer' : 'mower');
          break;
        }
      }
    }
  }

  function updateObs(dt) {
    const b = G.bike;
    const sun = isSun();
    for (let i = 0; i < G.obs.length; i++) {
      const o = G.obs[i];
      if (!o.alive) continue;
      o.t += dt;
      if (o.type === 'dog') {
        const dy = b.y - o.y;
        const near = Math.abs(dy) < 90 && Math.abs(b.x - o.x) < 100 && G.mode === 'play';
        if (near && dy > -20) {
          if (o.chase === 0) audio.bark();
          o.chase = 1;
          const spd = sun ? 168 : 128;
          const ang = Math.atan2(b.y - o.y, b.x - o.x);
          o.vx = Math.cos(ang) * spd;
          o.vy = Math.sin(ang) * spd;
        } else {
          o.chase *= 0.4;
          o.vx *= 0.9;
          o.vy = 0;
        }
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        o.x = clamp(o.x, -LAWN, LAWN);
      } else if (o.type === 'car') {
        o.x += o.vx * dt;
        o.y += o.vy * dt;
        if (o.cross) {
          if (o.x > 260 || o.x < -260) {
            o.x = o.vx > 0 ? -240 : 240;
            o.y += 900 + hash((o.y / 10) | 0, 9) * 400;
          }
        } else if (o.y < b.y - 220) {
          o.y = b.y + 780 + hash((o.y / 13) | 0, 5) * 420;
          o.x = (hash((o.y / 17) | 0, 8) - 0.5) * 44;
        } else if (o.y > b.y + 1100) {
          o.y = b.y - 80;
        }
      } else if (o.type === 'dancer') {
        o.x = clamp(o.x + Math.sin(o.t * 3.2) * 18 * dt, -ROAD + 6, ROAD - 6);
      } else if (o.type === 'mower') {
        o.x += o.vx * dt;
        if (Math.abs(o.x) > LAWN - 4 || Math.abs(o.x) < 8) o.vx *= -1;
      }
    }
  }

  function updatePapers(dt) {
    for (let i = G.papers.length - 1; i >= 0; i--) {
      const p = G.papers[i];
      if (!p.live) {
        p.z = Math.max(0, p.z - 30 * dt);
        continue;
      }
      p.vz -= GRAV * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.rot += p.spin * dt;
      if (p.live && p.z > 16 && p.z < 34 && p.house && p.house.delivered === 0) {
        const hx = p.house.side * (HOUSE_X - 6);
        const porchX = p.house.side * PORCH_X;
        const past = Math.abs(p.x) > Math.abs(porchX) + 10;
        if (past && hypot(p.x - hx, p.y - p.house.y) < 12) {
          resolveHouse(p.house, -1, p);
          p.live = false;
          continue;
        }
      }
      if (p.z <= 0) {
        p.z = 0;
        landPaper(p);
      }
      if (p.y > G.bike.y + 420 || Math.abs(p.x) > 200) {
        p.live = false;
        G.papers.splice(i, 1);
      }
    }
    if (G.papers.length > 18) G.papers.splice(0, G.papers.length - 18);
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.vz -= (p.g || 420) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.z < 0) {
        p.z = 0;
        p.vz *= -0.3;
        p.vx *= 0.6;
      }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.34) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.z += 28 * dt;
      f.y += (f.vy || -70) * dt * 0.01;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt;
      if (s.life <= 0) {
        shards.splice(i, 1);
        continue;
      }
      s.vz -= 520 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.z += s.vz * dt;
      s.rot += s.spin * dt;
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 0.18);
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    if (G.mode === 'title') updateDemo(dt);
    else updatePlay(dt);
    updateObs(dt);
    updatePapers(dt);
    G.cam = lerp(G.cam, G.bike.y, 0.22);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    W = Math.max(1, rect.width | 0);
    H = Math.max(1, rect.height | 0);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerToView(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - ox) / scale;
    const y = (e.clientY - rect.top - oy) / scale;
    return { x: x, y: y };
  }

  function fillPoly(pts, rgb, a) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = rgba(rgb, a == null ? 1 : a);
    ctx.fill();
  }

  function isoBox(cx, cy, w, d, h, top, left, right) {
    const sw = proj(cx - w * 0.5, cy - d * 0.5, 0);
    const se = proj(cx + w * 0.5, cy - d * 0.5, 0);
    const nw = proj(cx - w * 0.5, cy + d * 0.5, 0);
    const ne = proj(cx + w * 0.5, cy + d * 0.5, 0);
    const swt = proj(cx - w * 0.5, cy - d * 0.5, h);
    const set = proj(cx + w * 0.5, cy - d * 0.5, h);
    const nwt = proj(cx - w * 0.5, cy + d * 0.5, h);
    const net = proj(cx + w * 0.5, cy + d * 0.5, h);
    fillPoly([se, ne, net, set], right, 1);
    fillPoly([sw, nw, nwt, swt], left, 1);
    fillPoly([swt, set, net, nwt], top, 1);
  }

  function drawGround() {
    const y0 = G.cam - 80;
    const y1 = G.cam + 980;
    const step = 28;
    for (let y = y0; y < y1; y += step) {
      const yb = y;
      const yt = y + step + 1;
      const lawnL = [
        proj(-LAWN - 36, yb, 0), proj(-ROAD, yb, 0),
        proj(-ROAD, yt, 0), proj(-LAWN - 36, yt, 0)
      ];
      const lawnR = [
        proj(ROAD, yb, 0), proj(LAWN + 36, yb, 0),
        proj(LAWN + 36, yt, 0), proj(ROAD, yt, 0)
      ];
      const rd = [
        proj(-ROAD, yb, 0), proj(ROAD, yb, 0),
        proj(ROAD, yt, 0), proj(-ROAD, yt, 0)
      ];
      const stripe = ((y / 56) | 0) % 2 === 0;
      fillPoly(lawnL, stripe ? [12, 34, 18] : LAWN_C, 1);
      fillPoly(lawnR, stripe ? [12, 34, 18] : LAWN_C, 1);
      fillPoly(rd, ROAD_C, 1);
    }
    const dash = 22;
    for (let y = y0; y < y1; y += 52) {
      const a = proj(0, y, 0.4);
      const b = proj(0, y + dash, 0.4);
      ctx.strokeStyle = rgba(LIM2, 0.28);
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    const cl = [];
    const cr = [];
    for (let y = y0; y <= y1; y += 20) {
      cl.push(proj(-ROAD, y, 1.2));
      cr.push(proj(ROAD, y, 1.2));
    }
    ctx.strokeStyle = rgba(LIME, 0.35);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(cl[0].x, cl[0].y);
    for (let i = 1; i < cl.length; i++) ctx.lineTo(cl[i].x, cl[i].y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cr[0].x, cr[0].y);
    for (let i = 1; i < cr.length; i++) ctx.lineTo(cr[i].x, cr[i].y);
    ctx.stroke();

    const fin = streetLen();
    if (G.cam < fin + 80 && G.cam + 900 > fin) {
      isoBox(0, fin, 92, 10, 4, GOLD, darken(GOLD, 0.55), darken(ORG, 0.7));
      const t1 = proj(-30, fin, 28);
      const t2 = proj(30, fin, 28);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = 'bold ' + (13 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('街尾', (t1.x + t2.x) * 0.5, t1.y);
    }
  }

  function drawHouse(h) {
    const s = h.side;
    const hx = s * HOUSE_X;
    const wig = h.wiggle > 0 ? Math.sin(G.t * 40) * 1.4 : 0;
    const pal = h.pal;
    const top = mixRgb(pal, WHT, 0.18);
    const left = darken(pal, s < 0 ? 0.72 : 0.55);
    const right = darken(pal, s < 0 ? 0.55 : 0.72);
    isoBox(s * PORCH_X, h.y + 2, 28, 22, 3, darken(pal, 0.45), darken(pal, 0.35), darken(pal, 0.3));
    isoBox(hx + wig, h.y, 52, 40, 46, top, left, right);
    const roofH = 14;
    const rw = 58;
    const rd = 44;
    const peak = proj(hx + wig, h.y, 46 + roofH);
    const rsw = proj(hx - rw * 0.5 + wig, h.y - rd * 0.5, 46);
    const rse = proj(hx + rw * 0.5 + wig, h.y - rd * 0.5, 46);
    const rnw = proj(hx - rw * 0.5 + wig, h.y + rd * 0.5, 46);
    const rne = proj(hx + rw * 0.5 + wig, h.y + rd * 0.5, 46);
    fillPoly([rsw, peak, rse], darken(h.trim, 0.75), 1);
    fillPoly([rnw, peak, rne], h.trim, 1);
    fillPoly([rse, peak, rne], darken(h.trim, 0.55), 1);

    const wx = s * (HOUSE_X - 10);
    const w0 = proj(wx - 7, h.y - 4, 22);
    const w1 = proj(wx + 7, h.y - 4, 22);
    const w2 = proj(wx + 7, h.y - 4, 34);
    const w3 = proj(wx - 7, h.y - 4, 34);
    if (h.smash) {
      fillPoly([w0, w1, w2, w3], [20, 24, 32], 0.9);
      ctx.strokeStyle = rgba(CYN, 0.7);
      ctx.lineWidth = 1.1 * scale;
      ctx.beginPath();
      ctx.moveTo(w0.x, w0.y);
      ctx.lineTo(w2.x, w2.y);
      ctx.moveTo(w1.x, w1.y);
      ctx.lineTo(w3.x, w3.y);
      ctx.stroke();
    } else {
      const glow = h.sub ? GOLD : CYN;
      fillPoly([w0, w1, w2, w3], glow, h.sub ? 0.85 : 0.35);
    }

    const mx = s * MAIL_X;
    isoBox(mx, h.y, 7, 5, 10, GOLD, darken(GOLD, 0.55), darken(ORG, 0.6));
    const pole = proj(mx, h.y, 0);
    const topP = proj(mx, h.y, 10);
    ctx.strokeStyle = rgba(WHT, 0.45);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(pole.x, pole.y);
    ctx.lineTo(topP.x, topP.y);
    ctx.stroke();

    if (h.sub && h.delivered === 0) {
      const flag = proj(mx + s * 6, h.y, 12);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(flag.x, flag.y, 2.2 * scale, 0, TAU);
      ctx.fill();
    }

    if (G.aimH === h && G.mode === 'play') {
      const px = s * PORCH_X;
      const a = 0.45 + 0.25 * Math.sin(G.t * 8);
      popAim(px, h.y + 2, a);
    }

    if (h.paper) {
      const q = proj(h.paper.x, h.paper.y, 3);
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(-0.4);
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(-5 * scale, -3 * scale, 10 * scale, 6 * scale);
      ctx.fillStyle = rgba(CYN, 0.5);
      ctx.fillRect(-3 * scale, -1.4 * scale, 6 * scale, 1.2 * scale);
      ctx.restore();
    }

    const bushX = s * (HOUSE_X + 28);
    isoBox(bushX, h.y - 16, 10, 10, 8, [28, 90, 40], [18, 60, 28], [22, 70, 32]);
    drawTree(s * (HOUSE_X + 42), h.y + 18);
  }

  function popAim(x, y, a) {
    const p = proj(x, y, 2);
    ctx.save();
    ctx.strokeStyle = rgba(LIME, a);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 16 * scale, 8 * scale, 0.4, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawTree(x, y) {
    isoBox(x, y, 6, 6, 10, [40, 28, 18], [28, 18, 12], [34, 22, 14]);
    const top = proj(x, y, 28);
    ctx.fillStyle = rgba(LIME, 0.55);
    ctx.beginPath();
    ctx.arc(top.x, top.y, 11 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([20, 80, 36], 0.8);
    ctx.beginPath();
    ctx.arc(top.x - 2 * scale, top.y + 2 * scale, 8 * scale, 0, TAU);
    ctx.fill();
  }

  function drawDog(o) {
    const run = Math.sin(o.t * (o.chase ? 16 : 6));
    const p = proj(o.x, o.y, 6 + Math.abs(run) * 2);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = rgba(ORG, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 9 * scale, 6 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.arc(7 * scale * (o.vx >= 0 ? 1 : -1), -2 * scale, 4 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(-2 * scale, 4 * scale + run * 2 * scale, 3 * scale, 5 * scale);
    ctx.fillRect(3 * scale, 4 * scale - run * 2 * scale, 3 * scale, 5 * scale);
    if (o.chase) {
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.fillRect(10 * scale * (o.vx >= 0 ? 1 : -1), -4 * scale, 5 * scale, 2 * scale);
    }
    ctx.restore();
  }

  function drawCar(o) {
    const pal = o.pal || MAG;
    const w = o.w || 18;
    const d = o.d || 28;
    isoBox(o.x, o.y, w, d, 12, mixRgb(pal, WHT, 0.15), darken(pal, 0.6), darken(pal, 0.45));
    isoBox(o.x, o.y + (o.cross ? 0 : 2), w * 0.7, d * 0.45, 20, darken(pal, 0.85), darken(pal, 0.5), darken(pal, 0.4));
    const hx = o.cross ? o.x + Math.sign(o.vx || 1) * w * 0.4 : o.x;
    const hy = o.cross ? o.y : o.y + Math.sign(o.vy || 1) * d * 0.4;
    const hp = proj(hx, hy, 7);
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.arc(hp.x, hp.y, 2.4 * scale, 0, TAU);
    ctx.fill();
  }

  function drawDancer(o) {
    const p = proj(o.x, o.y, 10);
    const sp = o.t * 10;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(sp);
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(-10 * scale, 6 * scale);
    ctx.lineTo(0, -4 * scale);
    ctx.lineTo(10 * scale, 6 * scale);
    ctx.moveTo(0, -4 * scale);
    ctx.lineTo(0, 10 * scale);
    ctx.moveTo(-8 * scale, 2 * scale);
    ctx.lineTo(8 * scale, -6 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.arc(0, -8 * scale, 3.4 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
    const ring = proj(o.x, o.y, 1);
    ctx.strokeStyle = rgba(MAG, 0.35);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.ellipse(ring.x, ring.y, 14 * scale, 6 * scale, 0.4, 0, TAU);
    ctx.stroke();
  }

  function drawMower(o) {
    isoBox(o.x, o.y, 16, 12, 8, [70, 80, 40], [40, 50, 24], [50, 60, 28]);
    const p = proj(o.x, o.y, 2);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(o.t * 14);
    ctx.strokeStyle = rgba(LIME, 0.8);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.moveTo(-8 * scale, 0);
    ctx.lineTo(8 * scale, 0);
    ctx.moveTo(0, -8 * scale);
    ctx.lineTo(0, 8 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function drawPack(p) {
    if (p.taken) return;
    const z = 6 + Math.sin(p.bob) * 3;
    const q = proj(p.x, p.y, z);
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(-0.3);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fillRect(-6 * scale, -4 * scale, 12 * scale, 8 * scale);
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.fillRect(-4 * scale, -1.5 * scale, 8 * scale, 1.6 * scale);
    ctx.strokeStyle = rgba(LIME, 0.45 + 0.25 * Math.sin(p.bob * 2));
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(-6 * scale, -4 * scale, 12 * scale, 8 * scale);
    ctx.restore();
  }

  function drawPaper(p) {
    const q = proj(p.x, p.y, p.z);
    ctx.save();
    ctx.translate(q.x, q.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = rgba(WHT, p.live ? 0.96 : 0.7);
    ctx.fillRect(-6 * scale, -4 * scale, 12 * scale, 8 * scale);
    ctx.fillStyle = rgba(CYN, 0.55);
    ctx.fillRect(-4 * scale, -1.6 * scale, 8 * scale, 1.4 * scale);
    if (p.live) {
      ctx.strokeStyle = rgba(LIME, 0.5);
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(-6 * scale, -4 * scale, 12 * scale, 8 * scale);
    }
    ctx.restore();
  }

  function drawBike() {
    const b = G.bike;
    if (G.mode === 'play' && G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0) return;
    const sh = proj(b.x, b.y, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(sh.x, sh.y, 14 * scale, 6 * scale, 0.4, 0, TAU);
    ctx.fill();
    const p = proj(b.x, b.y, 8);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(b.lean * 0.22);
    ctx.scale(b.sqx, b.sqy);
    const ped = Math.sin(b.pedal);
    ctx.strokeStyle = rgba(CYN, 0.95);
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(-9 * scale, 6 * scale, 6 * scale, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(10 * scale, 6 * scale, 6 * scale, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(LIME, 0.95);
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(-9 * scale, 6 * scale);
    ctx.lineTo(2 * scale, -2 * scale);
    ctx.lineTo(10 * scale, 6 * scale);
    ctx.moveTo(2 * scale, -2 * scale);
    ctx.lineTo(2 * scale, -10 * scale);
    ctx.moveTo(-2 * scale, 4 * scale);
    ctx.lineTo(8 * scale, 4 * scale);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.8);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(1 * scale, 4 * scale);
    ctx.lineTo(-3 * scale, 10 * scale + ped * 4 * scale);
    ctx.moveTo(1 * scale, 4 * scale);
    ctx.lineTo(5 * scale, 10 * scale - ped * 4 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(LIME, 0.95);
    ctx.fillRect(-4 * scale, -18 * scale, 8 * scale, 10 * scale);
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(0, -22 * scale, 4.2 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.9);
    ctx.fillRect(-5 * scale, -26 * scale, 10 * scale, 3 * scale);
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.fillRect(6 * scale, -8 * scale, 7 * scale, 6 * scale);
    ctx.restore();
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      const q = proj(p.x, p.y, p.z);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(q.x, q.y, p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      const q = proj(s.x, s.y, s.z);
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.8 * scale;
      const r = (s.rad + s.t * 40) * scale;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, TAU);
      ctx.stroke();
      for (let k = 0; k < 6; k++) {
        const ang = k * TAU / 6 + s.t * 8;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x + Math.cos(ang) * r, q.y + Math.sin(ang) * r * 0.55);
        ctx.stroke();
      }
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.34;
      const q = proj(r.x, r.y, r.z);
      ctx.strokeStyle = rgba(r.rgb, a * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.ellipse(q.x, q.y, (r.r + r.t * 48) * scale, (r.r * 0.45 + r.t * 20) * scale, 0.4, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const q = proj(s.x, s.y, Math.max(0, s.z));
      ctx.save();
      ctx.translate(q.x, q.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = rgba(s.rgb, clamp(s.life / 0.5, 0, 1));
      ctx.fillRect(-s.w * 0.5 * scale, -s.h * 0.5 * scale, s.w * scale, s.h * scale);
      ctx.restore();
    }
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      const q = proj(f.x, f.y, f.z);
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.shadowColor = rgba(f.rgb, 0.5);
      ctx.shadowBlur = 8 * scale;
      ctx.fillText(f.text, q.x, q.y);
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    g.addColorStop(0, '#070b14');
    g.addColorStop(0.45, '#0a1020');
    g.addColorStop(1, '#08140e');
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.clock * 2 + s.tw);
      ctx.fillStyle = rgba(WHT, s.a * tw);
      ctx.fillRect(ox + s.x * scale, oy + s.y * scale, s.r * scale, s.r * scale);
    }
    const moon = { x: ox + 380 * scale, y: oy + 70 * scale };
    ctx.fillStyle = rgba(LIM2, 0.12);
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, 22 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.beginPath();
    ctx.arc(moon.x, moon.y, 12 * scale, 0, TAU);
    ctx.fill();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05080c';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake * 1.4;
      shy = (Math.random() - 0.5) * G.shake * 1.1;
    }
    ctx.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }
    drawSky();
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    drawGround();

    const items = [];
    for (let i = 0; i < G.houses.length; i++) {
      const h = G.houses[i];
      if (h.y < G.cam - 80 || h.y > G.cam + 920) continue;
      items.push({ y: h.y, z: 0, kind: 'h', ref: h });
    }
    for (let i = 0; i < G.obs.length; i++) {
      const o = G.obs[i];
      if (!o.alive) continue;
      if (o.y < G.cam - 80 || o.y > G.cam + 920) continue;
      items.push({ y: o.y, z: 1, kind: 'o', ref: o });
    }
    for (let i = 0; i < G.packs.length; i++) {
      const p = G.packs[i];
      if (p.taken) continue;
      if (p.y < G.cam - 40 || p.y > G.cam + 900) continue;
      items.push({ y: p.y, z: 1, kind: 'p', ref: p });
    }
    for (let i = 0; i < G.papers.length; i++) {
      items.push({ y: G.papers[i].y, z: 2, kind: 'n', ref: G.papers[i] });
    }
    items.push({ y: G.bike.y, z: 2, kind: 'b' });
    items.sort(function (a, b) {
      if (a.y !== b.y) return b.y - a.y;
      return a.z - b.z;
    });
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'h') drawHouse(it.ref);
      else if (it.kind === 'o') {
        const o = it.ref;
        if (o.type === 'dog') drawDog(o);
        else if (o.type === 'car') drawCar(o);
        else if (o.type === 'dancer') drawDancer(o);
        else if (o.type === 'mower') drawMower(o);
      } else if (it.kind === 'p') drawPack(it.ref);
      else if (it.kind === 'n') drawPaper(it.ref);
      else if (it.kind === 'b') drawBike();
    }
    drawFx();
    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
  }

  function bindPad(el, on, off) {
    if (!el) return;
    const down = function (e) {
      audio.ensure();
      if (overlayOpen()) return;
      on();
      el.classList.add('held');
      e.preventDefault();
    };
    const up = function (e) {
      off();
      el.classList.remove('held');
      if (e) e.preventDefault();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
  }

  function bind() {
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
    });
    window.addEventListener('keydown', function (e) {
      audio.ensure();
      if (e.code === 'KeyM') {
        audio.setMuted(!audio.muted);
        e.preventDefault();
        return;
      }
      if (e.code === 'KeyR') {
        restart();
        e.preventDefault();
        return;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keys.l = true;
        e.preventDefault();
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keys.r = true;
        e.preventDefault();
      }
      if (overlayOpen()) {
        if (e.code === 'Enter' || e.code === 'Digit1' || e.code === 'Numpad1' || e.code === 'Space') {
          if (e.code === 'Space') G.throwLatch = true;
          if (G.mode === 'title') startGame('mon');
          else if (G.mode === 'dead' || G.mode === 'win') startGame(G.kind);
          e.preventDefault();
        }
        if (e.code === 'Digit2' || e.code === 'Numpad2') {
          startGame('sun');
          e.preventDefault();
        }
        return;
      }
      if ((e.code === 'Space' || e.code === 'KeyK') && !G.throwLatch) {
        G.throwLatch = true;
        throwPaper();
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', function (e) {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.l = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.r = false;
      if (e.code === 'Space' || e.code === 'KeyK') G.throwLatch = false;
    });
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (overlayOpen()) return;
      const p = pointerToView(e);
      pointer.down = true;
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.x0 = p.x;
      pointer.y0 = p.y;
      pointer.t0 = G.clock;
      pointer.id = e.pointerId;
      if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down || (pointer.id != null && e.pointerId !== pointer.id)) {
        if (!pointer.down) {
          const p = pointerToView(e);
          pointer.x = p.x;
          pointer.y = p.y;
        }
        return;
      }
      const p = pointerToView(e);
      pointer.x = p.x;
      pointer.y = p.y;
      e.preventDefault();
    });
    function upPtr(e) {
      if (pointer.id != null && e.pointerId !== pointer.id) return;
      if (pointer.down && !overlayOpen()) {
        const dt = G.clock - pointer.t0;
        const dist = hypot(pointer.x - pointer.x0, pointer.y - pointer.y0);
        if (dt < 0.22 && dist < 18) throwPaper();
      }
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', upPtr);
    canvas.addEventListener('pointercancel', upPtr);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
    btnRetry.addEventListener('click', function () {
      audio.ensure();
      restart();
    });
    btnMon.addEventListener('click', function () {
      audio.ensure();
      startGame('mon');
    });
    btnSun.addEventListener('click', function () {
      audio.ensure();
      startGame('sun');
    });
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
    ovModes.addEventListener('click', function () {
      audio.ensure();
      showTitle();
    });
    bindPad(btnLeft, function () { keys.l = true; }, function () { keys.l = false; });
    bindPad(btnRight, function () { keys.r = true; }, function () { keys.r = false; });
    if (btnThrow) {
      btnThrow.addEventListener('pointerdown', function (e) {
        audio.ensure();
        if (overlayOpen()) return;
        btnThrow.classList.add('held');
        throwPaper();
        e.preventDefault();
      });
      btnThrow.addEventListener('pointerup', function () { btnThrow.classList.remove('held'); });
      btnThrow.addEventListener('pointerleave', function () { btnThrow.classList.remove('held'); });
    }
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (hidden) return;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt);
      draw();
      return;
    }
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 4) acc = 0;
    updateFx(dt);
    draw();
  }

  function boot() {
    G.best = loadBest();
    try {
      if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
      else audio.setMuted(false);
    } catch (err) {
      audio.setMuted(false);
    }
    buildPips();
    bind();
    resize();
    showTitle();
    requestAnimationFrame(frame);
  }

  boot();
})();
