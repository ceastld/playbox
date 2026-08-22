'use strict';

(function () {
  const VW = 800;
  const VH = 480;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SHIP_R = 10;
  const ROT = 3.85;
  const THRUST = 262;
  const REV = 118;
  const MAX_V = 348;
  const DRAG = 0.085;
  const SHOT_V = 540;
  const SHOT_LIFE = 0.78;
  const COMBO_WIN = 1.32;
  const EXTRA_LIFE = 10000;
  const SHIELD_MAX = 2;
  const REGEN = 6.8;
  const BEST_KEY = 'playbox-space-fury-best';
  const MUTE_KEY = 'playbox-space-fury-mute';
  const OPS = '← → / A D 转向 · W / ↑ 推进 · S / ↓ 倒推 · 空格开火';
  const GUN_OPS = '1 前火 · 2 双火 · 3 散火';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 48, 176];
  const CYN = [0, 232, 255];
  const ICE = [255, 122, 210];
  const GOLD = [255, 227, 107];
  const WHT = [255, 236, 248];

  const GUN_NAME = { fwd: '前火', dual: '双火', wide: '散火' };
  const QUOTES = [
    '有谁敢来碰我的帝国舰队？',
    '又一个拿来解闷的生物。开火吧。',
    '侦察兵没了？巡洋舰会撕开你。',
    '你开始烦人了。驱逐舰，全灭。',
    '还活着？整支舰队，立刻处理。',
    '不错。准备迎战我的全部火力。'
  ];
  const FRAG_PTS = [
    [[0, -12], [7, 3], [0, 1], [-7, 3]],
    [[-3, -7], [-13, 8], [-2, 10], [-1, 0]],
    [[3, -7], [13, 8], [2, 10], [1, 0]],
    [[-7, 2], [0, 13], [7, 2], [0, 5]]
  ];
  const FULL_PTS = [
    [0, -16], [9, -4], [15, 8], [5, 6], [0, 13], [-5, 6], [-15, 8], [-9, -4]
  ];
  const RAM_PTS = [
    [0, -14], [8, -2], [12, 10], [3, 7], [0, 16], [-3, 7], [-12, 10], [-8, -2]
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovModes = document.getElementById('ov-modes');
  const ovGuns = document.getElementById('ov-guns');
  const btnFury = document.getElementById('btn-fury');
  const btnHunt = document.getElementById('btn-hunt');
  const btnFwd = document.getElementById('btn-fwd');
  const btnDual = document.getElementById('btn-dual');
  const btnWide = document.getElementById('btn-wide');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const gunLabel = document.getElementById('gun-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');
  const talkEl = document.getElementById('talk');
  const talkText = document.getElementById('talk-text');
  const padCcw = document.getElementById('pad-ccw');
  const padCw = document.getElementById('pad-cw');
  const padThrust = document.getElementById('pad-thrust');
  const padRev = document.getElementById('pad-rev');
  const padFire = document.getElementById('pad-fire');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let kickTok = 0;
  let comboTok = 0;
  let gid = 0;

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const shards = [];
  const stars = [];
  const cracks = [];

  const G = {
    mode: 'title',
    kind: 'fury',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    nextLife: EXTRA_LIFE,
    ship: { x: VW * 0.5, y: VH * 0.62, vx: 0, vy: 0, ang: 0 },
    gun: 'fwd',
    shield: SHIELD_MAX,
    regenT: 0,
    crackT: 0,
    mobs: [],
    shots: [],
    fireCd: 0,
    ready: 0,
    deadT: 0,
    invuln: 0,
    waveWait: 0,
    toSpawn: 0,
    spawnWait: 0,
    pickT: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    toastT: 0,
    talkT: 0,
    quoteI: 0,
    thrustT: 0,
    why: ''
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
  function wrap(v, max) {
    return ((v % max) + max) % max;
  }
  function wrapDelta(a, b, size) {
    let d = a - b;
    const h = size * 0.5;
    if (d > h) d -= size;
    if (d < -h) d += size;
    return d;
  }
  function wrapDist(ax, ay, bx, by) {
    const dx = wrapDelta(ax, bx, VW);
    const dy = wrapDelta(ay, by, VH);
    return { dx: dx, dy: dy, d: hypot(dx, dy) };
  }
  function isHunt() {
    return G.kind === 'hunt';
  }
  function kindName() {
    return isHunt() ? '围猎' : '怒火';
  }
  function quoteFor(wave) {
    const i = clamp(wave, 0, QUOTES.length - 1);
    return QUOTES[i];
  }
  function rankOf(n) {
    if (n >= 20000) return '威胁';
    if (n >= 12000) return '对手';
    if (n >= 5000) return '烦扰';
    if (n >= 1500) return '猎物';
    return '尘埃';
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
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
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
      const hi = G.gun === 'wide' ? 980 : G.gun === 'dual' ? 1280 : 1420;
      this.beep(hi, 0.048, 'square', 0.03, 220);
      this.beep(540, 0.032, 'triangle', 0.014, 120);
    },
    thrust() {
      this.ensure();
      this.noise(0.05, 0.015, 260);
      this.beep(76, 0.05, 'sawtooth', 0.013, 40);
    },
    hit(kind) {
      this.ensure();
      if (kind === 'frag') {
        this.beep(720, 0.07, 'square', 0.04, 220);
        this.noise(0.07, 0.036, 420);
      } else if (kind === 'full') {
        this.beep(280, 0.12, 'sawtooth', 0.05, 90);
        this.noise(0.14, 0.06, 240);
      } else if (kind === 'ram') {
        this.beep(190, 0.14, 'sawtooth', 0.052, 70);
        this.noise(0.12, 0.05, 280);
      } else {
        this.beep(880, 0.05, 'triangle', 0.03, 1400);
      }
    },
    crack() {
      this.ensure();
      this.noise(0.09, 0.055, 1400);
      this.beep(1680, 0.07, 'square', 0.04, 420);
      this.beep(940, 0.12, 'triangle', 0.028, 220);
    },
    shatter() {
      this.ensure();
      this.noise(0.16, 0.07, 900);
      this.beep(620, 0.14, 'sawtooth', 0.046, 140);
    },
    regen() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.034, 784);
      this.beep(784, 0.12, 'triangle', 0.03, 1175);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.038, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.028, 1176);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.1, 'triangle', 0.038, 1046);
      this.beep(1046, 0.18, 'sine', 0.042, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.064, 240);
      this.beep(220, 0.24, 'sawtooth', 0.05, 52);
      this.beep(128, 0.36, 'sine', 0.04, 38);
    },
    wave() {
      this.ensure();
      this.beep(262, 0.09, 'square', 0.036, 392);
      this.beep(392, 0.1, 'square', 0.034, 523);
      this.beep(523, 0.16, 'triangle', 0.04, 784);
    },
    talk() {
      this.ensure();
      const base = 90 + Math.random() * 30;
      this.beep(base, 0.11, 'sawtooth', 0.028, base * 1.4);
      this.beep(base * 1.6, 0.09, 'square', 0.02, base * 0.8);
      this.beep(base * 2.2, 0.14, 'sawtooth', 0.018, base);
    },
    pick() {
      this.ensure();
      this.beep(440, 0.07, 'square', 0.036, 880);
      this.beep(880, 0.12, 'triangle', 0.032, 1320);
    },
    lose() {
      this.ensure();
      this.beep(174, 0.2, 'sawtooth', 0.04, 72);
      this.beep(98, 0.34, 'sine', 0.046, 40);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.036, 494);
      this.beep(494, 0.1, 'square', 0.034, 659);
      this.beep(784, 0.16, 'triangle', 0.038, 988);
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
    if ((G.mode !== 'play' && G.mode !== 'pick') || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    while (G.score >= G.nextLife) {
      G.nextLife += EXTRA_LIFE;
      G.lives += 1;
      audio.extra();
      toast('额外生命', false, true);
      screenFlash(GOLD, 0.55);
      kick(3.2);
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
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function say(text, dur) {
    G.talkT = dur == null ? 3.4 : dur;
    if (talkEl && talkText) {
      talkText.textContent = text;
      talkEl.classList.remove('hidden');
    }
    audio.talk();
  }

  function hideTalk() {
    G.talkT = 0;
    if (talkEl) talkEl.classList.add('hidden');
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

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      toast('连击 ×' + G.mult, false, true);
      if (comboEl) {
        comboTok += 1;
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '怒空';
      else if (G.mode === 'pick') stageLabel.textContent = '选炮';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 4);
    }
    if (tagLabel) {
      tagLabel.textContent = G.mode === 'title' ? 'FURY' : kindName();
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || G.shield === 0);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (gunLabel) {
      gunLabel.textContent = GUN_NAME[G.gun] || '前火';
      gunLabel.className = 'gun ' + G.gun;
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
    else if (G.mode === 'pick') setHint(GUN_OPS + ' · 点选或超时沿用', 'hot');
    else if (G.mode === 'lose') setHint('R 重开 · 撞上即扣命', 'warn');
    else if (G.shield === 0) setHint('护盾碎了 · 再撞就爆', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 护盾还能挡', 'warn');
    else setHint('A D 转向 · W 推进 · 空格开火 · 四片拼合前先拆', G.combo >= 6 ? 'hot' : '');
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead, primary, showSecond) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    panel.classList.toggle('pick', kind === 'pick');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'pick' ? 'COMMAND' : 'FURY';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    if (kind === 'pick') {
      ovOps.textContent = GUN_OPS + ' · 剩余 ' + Math.ceil(G.pickT) + ' 秒';
      if (ovModes) ovModes.classList.add('hidden');
      if (ovGuns) ovGuns.classList.remove('hidden');
    } else {
      ovOps.textContent = OPS;
      if (ovModes) ovModes.classList.remove('hidden');
      if (ovGuns) ovGuns.classList.add('hidden');
      if (btnFury) btnFury.textContent = primary;
      if (btnHunt) {
        btnHunt.classList.toggle('hidden', !showSecond);
        btnHunt.textContent = kind === 'lose' ? '换模式' : '围猎';
      }
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
    if (REDUCE || (G.mode !== 'play' && G.mode !== 'pick')) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 5 ? 'die' : mag >= 3.2 ? 'crack' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('crack');
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
        g: spec.g == null ? 0 : spec.g
      });
    }
    capArr(particles, 360);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 48);
  }

  function popRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 10 });
    capArr(rings, 36);
  }

  function popFloat(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      vy: -52,
      t: 0,
      life: 0.72,
      text: text,
      rgb: rgb,
      gold: !!gold,
      size: gold ? 16 : 13
    });
    capArr(floats, 28);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.16 ? 1.35 : 0.65,
        a: rand(0.22, 0.88),
        p: Math.random() * TAU,
        rgb: Math.random() < 0.28 ? ICE : Math.random() < 0.14 ? MAG : Math.random() < 0.1 ? GOLD : WHT
      });
    }
  }

  function mobCount() {
    let n = 0;
    for (let i = 0; i < G.mobs.length; i++) n += 1;
    return n;
  }

  function groupType() {
    if (G.wave >= 5) return 'war';
    if (G.wave >= 3) return 'cru';
    return 'scout';
  }

  function spawnGroup() {
    gid += 1;
    const id = gid;
    let mx = rand(110, VW - 110);
    let my = rand(80, VH - 80);
    const away = wrapDist(mx, my, G.ship.x, G.ship.y);
    if (away.d < 140) {
      mx = wrap(G.ship.x + (away.dx >= 0 ? 230 : -230), VW);
      my = wrap(G.ship.y + rand(-90, 90), VH);
    }
    const palette = [MAG, CYN, GOLD, ICE];
    const rgb = palette[id % 4];
    const type = groupType();
    const r = type === 'war' ? 13 : 11;
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + rand(-0.18, 0.18);
      const dist = 240 + rand(30, 110);
      let fx = wrap(mx + Math.cos(a) * dist, VW);
      let fy = wrap(my + Math.sin(a) * dist, VH);
      if (wrapDist(fx, fy, G.ship.x, G.ship.y).d < 88) {
        fx = wrap(G.ship.x + Math.cos(a) * 220, VW);
        fy = wrap(G.ship.y + Math.sin(a) * 220, VH);
      }
      G.mobs.push({
        kind: 'frag',
        gid: id,
        slot: i,
        x: fx,
        y: fy,
        vx: 0,
        vy: 0,
        ang: a + Math.PI,
        spin: rand(-1.4, 1.4),
        r: r,
        rgb: rgb,
        type: type,
        mx: mx,
        my: my,
        parked: false,
        hp: 1
      });
    }
  }

  function spawnFull(x, y, proto) {
    const type = proto.type || 'scout';
    G.mobs.push({
      kind: 'full',
      x: x,
      y: y,
      vx: rand(-36, 36),
      vy: rand(-28, 28),
      ang: rand(0, TAU),
      spin: rand(-0.6, 0.6),
      r: type === 'war' ? 20 : 17,
      rgb: proto.rgb,
      type: type,
      hp: type === 'war' ? 2 : 1,
      shootT: rand(0.35, 0.9),
      wob: Math.random() * TAU
    });
    popRing(x, y, proto.rgb, 14);
    toast(type === 'war' ? '战舰合阵' : type === 'cru' ? '巡洋合阵' : '侦察合阵', true, false);
  }

  function spawnRam(x, y, frags) {
    const proto = frags[0];
    G.mobs.push({
      kind: 'ram',
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      ang: 0,
      spin: 2.4,
      r: 12 + frags.length * 2,
      rgb: MAG,
      type: proto.type,
      hp: 1,
      n: frags.length
    });
    popRing(x, y, MAG, 12);
    toast('残舰冲撞', true, false);
  }

  function tryMerge(id) {
    const frags = [];
    for (let i = 0; i < G.mobs.length; i++) {
      const m = G.mobs[i];
      if (m.kind === 'frag' && m.gid === id) frags.push(m);
    }
    if (!frags.length) return;
    let parked = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < frags.length; i++) {
      if (frags[i].parked) parked += 1;
      cx += frags[i].x;
      cy += frags[i].y;
    }
    if (parked < frags.length) return;
    cx /= frags.length;
    cy /= frags.length;
    const keep = [];
    for (let i = 0; i < G.mobs.length; i++) {
      const m = G.mobs[i];
      if (!(m.kind === 'frag' && m.gid === id)) keep.push(m);
    }
    G.mobs = keep;
    if (frags.length >= 4) spawnFull(cx, cy, frags[0]);
    else spawnRam(cx, cy, frags);
    audio.beep(140, 0.12, 'sawtooth', 0.04, 80);
    kick(2.2);
  }

  function spawnWave() {
    const n = isHunt()
      ? Math.min(8, 2 + G.wave)
      : Math.min(6, 1 + G.wave);
    G.toSpawn = n;
    G.spawnWait = 0.12;
    G.ready = 0.35;
    G.waveWait = 0;
    if (G.mode === 'play') {
      audio.wave();
      say(quoteFor(G.wave), 3.1);
      toast('第 ' + G.wave + ' 波' + (G.wave > 1 ? ' · 加速' : ''), false, G.wave > 1);
    }
  }

  function resetWorld(demo) {
    G.ship.x = VW * 0.5;
    G.ship.y = VH * 0.62;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.ship.ang = 0;
    G.shots = [];
    G.mobs = [];
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = demo ? 0 : 1.9;
    G.shield = SHIELD_MAX;
    G.regenT = 0;
    G.crackT = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.waveWait = 0;
    G.toSpawn = 0;
    G.spawnWait = 0;
    cracks.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    shards.length = 0;
    if (demo) {
      G.wave = 1;
      G.gun = 'fwd';
      spawnGroup();
      spawnGroup();
    }
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'fury';
    G.score = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    G.gun = 'fwd';
    resetWorld(true);
    G.quoteI = 0;
    say(QUOTES[0], 4.2);
    showOverlay(
      'title',
      '怒空',
      '拧船推进开火。敌舰四片拼合，拼完会射，拼不齐会撞。波间换炮：前火、双火、散火。护盾能挡一下。',
      '怒火',
      true
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'hunt' ? 'hunt' : 'fury';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.wave = 1;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    G.gun = 'fwd';
    resetWorld(false);
    keys.fire = false;
    hideOverlay();
    audio.start();
    if (scoreEl) scoreEl.textContent = '0';
    spawnWave();
    syncHud();
  }

  function loseRun(why) {
    G.why = why;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.7);
    G.mode = 'lose';
    hideTalk();
    const rec = G.score >= G.best && G.score > 0;
    const rank = rankOf(G.score);
    showOverlay(
      rec ? 'win' : 'lose',
      rec ? '新纪录' : why,
      (rec ? '这分数我会记住。下次不会客气。' : '战斗结束。你只是个消遣。') +
        ' 评价「' + rank + '」· 分数 ' + G.score,
      '再来',
      true
    );
    syncHud();
  }

  function beginPick() {
    G.mode = 'pick';
    G.pickT = isHunt() ? 4.6 : 7.2;
    G.shots = [];
    G.mobs = [];
    keys.fire = false;
    G.ship.vx *= 0.35;
    G.ship.vy *= 0.35;
    say(quoteFor(Math.min(G.wave + 1, QUOTES.length - 1)), 5);
    showOverlay(
      'pick',
      '选炮',
      quoteFor(Math.min(G.wave + 1, QUOTES.length - 1)) +
        ' 前火三发齐射，双火前后夹击，散火三向扇开。',
      '',
      false
    );
    syncHud();
  }

  function pickGun(id) {
    if (G.mode !== 'pick') return;
    if (id !== 'fwd' && id !== 'dual' && id !== 'wide') id = G.gun || 'fwd';
    G.gun = id;
    audio.pick();
    const left = Math.max(0, G.pickT);
    const bonus = Math.ceil(left) * 80;
    if (bonus > 0) addScore(bonus);
    toast(GUN_NAME[G.gun] + (bonus ? ' +' + bonus : ''), false, true);
    popRing(G.ship.x, G.ship.y, id === 'wide' ? GOLD : id === 'dual' ? CYN : ICE, 16);
    hideOverlay();
    G.mode = 'play';
    G.wave += 1;
    spawnWave();
    G.invuln = Math.max(G.invuln, 1.15);
    syncHud();
  }

  function gunCd() {
    const hunt = isHunt();
    if (G.gun === 'dual') return hunt ? 0.11 : 0.13;
    if (G.gun === 'wide') return hunt ? 0.13 : 0.155;
    return hunt ? 0.14 : 0.17;
  }

  function gunCap() {
    if (G.gun === 'dual') return 8;
    if (G.gun === 'wide') return 10;
    return 10;
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].from === 'ship') n += 1;
    if (n >= gunCap()) return;
    G.fireCd = gunCd();
    const s = G.ship;
    const ang = s.ang;
    const px = Math.sin(ang);
    const py = -Math.cos(ang);
    const rx = Math.cos(ang);
    const ry = Math.sin(ang);
    const volley = [];
    if (G.gun === 'dual') {
      volley.push({ ox: px * 14, oy: py * 14, a: ang });
      volley.push({ ox: -px * 12, oy: -py * 12, a: ang + Math.PI });
    } else if (G.gun === 'wide') {
      volley.push({ ox: px * 14, oy: py * 14, a: ang - 0.42 });
      volley.push({ ox: px * 14, oy: py * 14, a: ang });
      volley.push({ ox: px * 14, oy: py * 14, a: ang + 0.42 });
    } else {
      volley.push({ ox: px * 14 - rx * 6, oy: py * 14 - ry * 6, a: ang });
      volley.push({ ox: px * 14, oy: py * 14, a: ang });
      volley.push({ ox: px * 14 + rx * 6, oy: py * 14 + ry * 6, a: ang });
    }
    for (let i = 0; i < volley.length; i++) {
      const v = volley[i];
      const vx = Math.sin(v.a);
      const vy = -Math.cos(v.a);
      G.shots.push({
        x: s.x + v.ox,
        y: s.y + v.oy,
        vx: s.vx * 0.25 + vx * SHOT_V,
        vy: s.vy * 0.25 + vy * SHOT_V,
        life: SHOT_LIFE,
        from: 'ship',
        trail: []
      });
    }
    audio.shoot();
    if (!REDUCE) G.punch = Math.max(G.punch, 1.012);
    const nx = s.x + px * 14;
    const ny = s.y + py * 14;
    popSpark(nx, ny, G.gun === 'wide' ? GOLD : CYN, 9);
    emit(3, {
      x: nx, y: ny, j: 1.6,
      vx0: px * 50, vx1: px * 140,
      vy0: py * 50, vy1: py * 140,
      r0: 0.8, r1: 1.8, life: 0.16, rgb: WHT, g: 0
    });
  }

  function alienFire(m) {
    if (!m || G.deadT > 0) return;
    const w = wrapDist(G.ship.x, G.ship.y, m.x, m.y);
    let ang = Math.atan2(w.dx, -w.dy);
    ang += rand(-0.22, 0.22);
    const sp = m.type === 'war' ? 210 : 176;
    G.shots.push({
      x: m.x,
      y: m.y,
      vx: Math.sin(ang) * sp,
      vy: -Math.cos(ang) * sp,
      life: 1.35,
      from: 'alien',
      trail: []
    });
    audio.beep(m.type === 'war' ? 240 : 340, 0.06, 'square', 0.026, 90);
  }

  function emitMobShards(m) {
    const pts = m.kind === 'frag' ? FRAG_PTS[m.slot] : m.kind === 'ram' ? RAM_PTS : FULL_PTS;
    const ca = Math.cos(m.ang);
    const sa = Math.sin(m.ang);
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      const mx = (a[0] + b[0]) * 0.5;
      const my = (a[1] + b[1]) * 0.5;
      const wx = mx * ca - my * sa;
      const wy = mx * sa + my * ca;
      shards.push({
        x: m.x + wx,
        y: m.y + wy,
        vx: m.vx * 0.35 + wx * rand(2.4, 5.2) + rand(-50, 50),
        vy: m.vy * 0.35 + wy * rand(2.4, 5.2) + rand(-50, 50),
        ang: Math.atan2(b[1] - a[1], b[0] - a[0]) + m.ang,
        spin: rand(-6, 6),
        len: Math.max(4, hypot(b[0] - a[0], b[1] - a[1])),
        life: rand(0.32, 0.6),
        max: 0.6,
        rgb: m.rgb
      });
    }
    capArr(shards, 90);
  }

  function scoreFor(m) {
    if (m.kind === 'frag') return 100;
    if (m.kind === 'ram') return 300;
    if (m.kind === 'full') return m.type === 'war' ? 250 : 150;
    return 50;
  }

  function bustMob(m, scored) {
    const ix = G.mobs.indexOf(m);
    if (ix < 0) return;
    m.hp -= 1;
    if (m.hp > 0) {
      audio.hit('frag');
      hitStop(0.038);
      kick(1.8);
      popSpark(m.x, m.y, GOLD, 14);
      emit(10, {
        x: m.x, y: m.y, j: 4,
        vx0: -160, vx1: 160, vy0: -160, vy1: 160,
        r0: 1, r1: 2.4, life: 0.28, rgb: GOLD, g: 0
      });
      m.inv = 0.08;
      return;
    }
    const kind = m.kind;
    const gidHit = m.gid;
    audio.hit(kind);
    const stop = kind === 'full' ? 0.07 : kind === 'ram' ? 0.062 : 0.04;
    hitStop(stop + (G.mult > 2 ? 0.01 : 0));
    kick(kind === 'full' ? 4.2 : kind === 'ram' ? 3.4 : 1.8);
    screenFlash(m.rgb, kind === 'full' ? 0.46 : 0.28);
    popSpark(m.x, m.y, m.rgb, m.r * 1.1);
    popRing(m.x, m.y, m.rgb, m.r * 0.4);
    emitMobShards(m);
    emit(kind === 'frag' ? 12 : 22, {
      x: m.x, y: m.y, j: m.r * 0.4,
      vx0: -220, vx1: 220, vy0: -220, vy1: 220,
      r0: 1.1, r1: kind === 'full' ? 3.6 : 2.4, life: 0.42,
      rgb: m.rgb, g: 0
    });
    if (scored && G.mode === 'play') {
      bumpCombo();
      const pts = scoreFor(m) * G.mult;
      addScore(pts);
      popFloat(m.x, m.y - 8, '+' + pts, m.rgb, G.mult > 1);
    }
    G.mobs.splice(ix, 1);
    if (kind === 'frag' && gidHit) tryMerge(gidHit);
  }

  function bustBolt(s, scored) {
    const ix = G.shots.indexOf(s);
    if (ix < 0) return;
    popSpark(s.x, s.y, MAG, 10);
    emit(8, {
      x: s.x, y: s.y, j: 2,
      vx0: -120, vx1: 120, vy0: -120, vy1: 120,
      r0: 0.8, r1: 2, life: 0.22, rgb: MAG, g: 0
    });
    audio.hit('bolt');
    if (scored && G.mode === 'play') {
      bumpCombo();
      const pts = 200 * G.mult;
      addScore(pts);
      popFloat(s.x, s.y - 6, '+' + pts, GOLD, true);
      hitStop(0.036);
    }
    G.shots.splice(ix, 1);
  }

  function killShip() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play') return;
    G.deadT = 1.22;
    G.lives -= 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.shield = 0;
    audio.death();
    hitStop(0.078);
    kick(6.5);
    screenFlash(MAG, 0.72);
    popRing(G.ship.x, G.ship.y, MAG, 12);
    popSpark(G.ship.x, G.ship.y, MAG, 28);
    emit(38, {
      x: G.ship.x, y: G.ship.y, j: 6,
      vx0: -280, vx1: 280, vy0: -280, vy1: 280,
      r0: 1.3, r1: 4, life: 0.72, rgb: ICE, g: 0
    });
    emit(16, {
      x: G.ship.x, y: G.ship.y, j: 4,
      vx0: -170, vx1: 170, vy0: -170, vy1: 170,
      r0: 1, r1: 2.4, life: 0.5, rgb: MAG, g: 0
    });
    for (let i = 0; i < 5; i++) {
      const a = G.ship.ang + (i - 2) * 0.55;
      shards.push({
        x: G.ship.x,
        y: G.ship.y,
        vx: Math.sin(a) * rand(70, 180) + G.ship.vx * 0.3,
        vy: -Math.cos(a) * rand(70, 180) + G.ship.vy * 0.3,
        ang: a,
        spin: rand(-6, 6),
        len: rand(7, 14),
        life: 0.7,
        max: 0.7,
        rgb: i % 2 ? MAG : CYN
      });
    }
    capArr(shards, 90);
    syncPips();
  }

  function crackShield(x, y) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    if (G.invuln > 0) return;
    if (G.shield <= 0) {
      killShip();
      return;
    }
    G.shield -= 1;
    G.crackT = 0.28;
    G.invuln = 0.62;
    G.regenT = REGEN;
    cracks.push({ a: rand(0, TAU), w: rand(0.35, 0.7), t: 0, life: 1.4 });
    capArr(cracks, 8);
    audio.crack();
    if (G.shield <= 0) audio.shatter();
    hitStop(0.056);
    kick(3.6);
    screenFlash(CYN, 0.5);
    popRing(G.ship.x, G.ship.y, CYN, 11);
    popSpark(G.ship.x, G.ship.y, WHT, 18);
    emit(18, {
      x: G.ship.x, y: G.ship.y, j: 5,
      vx0: -200, vx1: 200, vy0: -200, vy1: 200,
      r0: 1, r1: 2.8, life: 0.4, rgb: WHT, g: 0
    });
    if (stageEl) {
      stageEl.classList.remove('crack');
      void stageEl.offsetWidth;
      stageEl.classList.add('crack');
    }
    toast(G.shield <= 0 ? '护盾碎了' : '护盾裂了', true, false);
    if (x != null) popFloat(x, y, G.shield <= 0 ? '碎' : '挡', CYN, false);
  }

  function hurtShip(x, y, mob) {
    if (G.deadT > 0 || G.invuln > 0 || G.mode !== 'play') return;
    if (G.shield > 0) {
      crackShield(x, y);
      if (mob) {
        const w = wrapDist(G.ship.x, G.ship.y, mob.x, mob.y);
        const d = w.d || 1;
        G.ship.vx += (w.dx / d) * 110;
        G.ship.vy += (w.dy / d) * 110;
        bustMob(mob, false);
      }
      return;
    }
    killShip();
  }

  function spawnClear(x, y, rad) {
    for (let i = 0; i < G.mobs.length; i++) {
      const m = G.mobs[i];
      if (wrapDist(x, y, m.x, m.y).d < rad + m.r) return false;
    }
    return true;
  }

  function updatePlayer(dt) {
    const s = G.ship;
    if (G.deadT <= 0 && G.mode === 'play') {
      if (keys.l) s.ang -= ROT * dt;
      if (keys.r) s.ang += ROT * dt;
      if (keys.u) {
        s.vx += Math.sin(s.ang) * THRUST * dt;
        s.vy -= Math.cos(s.ang) * THRUST * dt;
        G.thrustT -= dt;
        if (G.thrustT <= 0) {
          G.thrustT = 0.07;
          audio.thrust();
        }
        const bx = s.x - Math.sin(s.ang) * 12;
        const by = s.y + Math.cos(s.ang) * 12;
        emit(2, {
          x: bx, y: by, j: 1.4,
          vx0: -Math.sin(s.ang) * 50 + s.vx * 0.2, vx1: -Math.sin(s.ang) * 150 + s.vx * 0.2,
          vy0: Math.cos(s.ang) * 50 + s.vy * 0.2, vy1: Math.cos(s.ang) * 150 + s.vy * 0.2,
          r0: 1.1, r1: 2.6, life: 0.2, rgb: Math.random() < 0.45 ? GOLD : ICE, g: 0
        });
      }
      if (keys.d) {
        s.vx -= Math.sin(s.ang) * REV * dt;
        s.vy += Math.cos(s.ang) * REV * dt;
      }
      if (keys.fire) fire();
    }
    const spd = hypot(s.vx, s.vy);
    if (spd > MAX_V) {
      s.vx *= MAX_V / spd;
      s.vy *= MAX_V / spd;
    }
    const drag = Math.exp(-DRAG * dt);
    s.vx *= drag;
    s.vy *= drag;
    s.x = wrap(s.x + s.vx * dt, VW);
    s.y = wrap(s.y + s.vy * dt, VH);
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    G.crackT = Math.max(0, G.crackT - dt);
    if (G.mode === 'play' && G.deadT <= 0 && G.shield < SHIELD_MAX) {
      G.regenT -= dt;
      if (G.regenT <= 0) {
        G.shield += 1;
        audio.regen();
        popRing(s.x, s.y, CYN, 10);
        toast('护盾回充', false, true);
        G.regenT = G.shield < SHIELD_MAX ? REGEN : 0;
      }
    }
  }

  function updateMobs(dt) {
    if (G.mode === 'play' && G.deadT <= 0 && G.toSpawn > 0) {
      G.spawnWait -= dt;
      if (G.spawnWait <= 0) {
        spawnGroup();
        G.toSpawn -= 1;
        G.spawnWait = isHunt() ? 0.58 : 1.28;
      }
    }
    const fragSpd = isHunt() ? 122 : 80;
    const ramSpd = isHunt() ? 150 : 104;
    const seen = {};
    for (let i = 0; i < G.mobs.length; i++) {
      const m = G.mobs[i];
      if (m.inv) m.inv = Math.max(0, m.inv - dt);
      if (m.kind === 'frag') {
        const w = wrapDist(m.mx, m.my, m.x, m.y);
        if (w.d < 20) {
          m.parked = true;
          m.x = wrap(m.x + Math.cos(G.t * 2.1 + m.slot) * 16 * dt, VW);
          m.y = wrap(m.y + Math.sin(G.t * 2.1 + m.slot) * 16 * dt, VH);
          m.vx *= Math.exp(-dt * 4);
          m.vy *= Math.exp(-dt * 4);
        } else {
          m.parked = false;
          m.vx = (w.dx / (w.d || 1)) * fragSpd;
          m.vy = (w.dy / (w.d || 1)) * fragSpd;
          m.x = wrap(m.x + m.vx * dt, VW);
          m.y = wrap(m.y + m.vy * dt, VH);
        }
        m.ang += m.spin * dt;
        seen[m.gid] = true;
      } else if (m.kind === 'full') {
        m.wob += dt * 1.4;
        m.x = wrap(m.x + m.vx * dt + Math.cos(m.wob) * 12 * dt, VW);
        m.y = wrap(m.y + m.vy * dt + Math.sin(m.wob * 0.8) * 10 * dt, VH);
        m.ang += m.spin * dt;
        if (G.mode === 'play' && G.deadT <= 0) {
          m.shootT -= dt;
          if (m.shootT <= 0) {
            m.shootT = (m.type === 'war' ? 0.72 : 1.12) * rand(0.75, 1.1) * (isHunt() ? 0.62 : 1);
            alienFire(m);
          }
        }
      } else if (m.kind === 'ram') {
        const w = wrapDist(G.ship.x, G.ship.y, m.x, m.y);
        const d = w.d || 1;
        const steer = 3.4;
        const tx = (w.dx / d) * ramSpd;
        const ty = (w.dy / d) * ramSpd;
        m.vx = lerp(m.vx, tx, 1 - Math.exp(-steer * dt));
        m.vy = lerp(m.vy, ty, 1 - Math.exp(-steer * dt));
        m.x = wrap(m.x + m.vx * dt, VW);
        m.y = wrap(m.y + m.vy * dt, VH);
        m.ang = Math.atan2(m.vx, -m.vy);
        m.spin = 3.2;
      }
    }
    if (G.mode === 'play') {
      const ids = Object.keys(seen);
      for (let i = 0; i < ids.length; i++) tryMerge(+ids[i]);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      if (s.trail && !REDUCE) {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 6) s.trail.shift();
      }
      const nx = wrap(s.x + s.vx * dt, VW);
      const ny = wrap(s.y + s.vy * dt, VH);
      if (Math.abs(nx - s.x) > VW * 0.5 || Math.abs(ny - s.y) > VH * 0.5) s.trail = [];
      s.x = nx;
      s.y = ny;
      if (s.life <= 0) {
        if (s.from === 'ship' && G.mode === 'play') {
          G.comboT = Math.min(G.comboT, 0.16);
        }
        G.shots.splice(i, 1);
      }
    }
  }

  function collide() {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (!s) continue;
      let hit = false;
      if (s.from === 'ship') {
        for (let k = G.shots.length - 1; k >= 0; k--) {
          const b = G.shots[k];
          if (!b || b.from !== 'alien') continue;
          const w = wrapDist(s.x, s.y, b.x, b.y);
          if (w.d < 8) {
            G.shots.splice(i, 1);
            bustBolt(b, true);
            hit = true;
            break;
          }
        }
        if (hit) continue;
        for (let k = 0; k < G.mobs.length; k++) {
          const m = G.mobs[k];
          const w = wrapDist(s.x, s.y, m.x, m.y);
          if (w.d < m.r + 4) {
            G.shots.splice(i, 1);
            bustMob(m, true);
            hit = true;
            break;
          }
        }
      } else if (s.from === 'alien' && G.deadT <= 0 && G.invuln <= 0 && G.mode === 'play') {
        const w = wrapDist(s.x, s.y, G.ship.x, G.ship.y);
        if (w.d < SHIP_R + (G.shield > 0 ? 6 : 3)) {
          G.shots.splice(i, 1);
          hurtShip(s.x, s.y, null);
        }
      }
    }

    if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
      for (let k = 0; k < G.mobs.length; k++) {
        const m = G.mobs[k];
        const w = wrapDist(G.ship.x, G.ship.y, m.x, m.y);
        const pad = G.shield > 0 ? 5 : 2;
        if (w.d < m.r + SHIP_R + pad) {
          hurtShip(m.x, m.y, m);
          if (G.deadT > 0 || G.invuln > 0) break;
        }
      }
    }
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.talkT > 0) {
      G.talkT -= dt;
      if (G.talkT <= 0) hideTalk();
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.1);
      q.vy *= Math.exp(-dt * 1.1);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.38) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.ang += s.spin * dt;
      s.vx *= Math.exp(-dt * 0.7);
      s.vy *= Math.exp(-dt * 0.7);
      if (s.life <= 0) shards.splice(i, 1);
    }
    for (let i = cracks.length - 1; i >= 0; i--) {
      cracks[i].t += dt;
      if (cracks[i].t > cracks[i].life) cracks.splice(i, 1);
    }
  }

  function playSim(dt) {
    if (G.ready > 0) G.ready -= dt;
    updatePlayer(dt);
    updateMobs(dt);
    updateShots(dt);
    if (G.mode === 'play') collide();

    if (G.mode === 'play' && G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('船碎了');
          return;
        }
        G.ship.x = VW * 0.5;
        G.ship.y = VH * 0.55;
        G.ship.vx = 0;
        G.ship.vy = 0;
        G.ship.ang = 0;
        if (!spawnClear(G.ship.x, G.ship.y, 70)) {
          G.deadT = 0.28;
          return;
        }
        G.shield = SHIELD_MAX;
        G.regenT = 0;
        cracks.length = 0;
        G.invuln = 1.85;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
    }

    if (G.mode === 'play' && G.deadT <= 0 && G.toSpawn <= 0 && mobCount() === 0) {
      if (G.waveWait <= 0) G.waveWait = 0.7;
      else {
        G.waveWait -= dt;
        if (G.waveWait <= 0) {
          addScore(200 * G.wave);
          beginPick();
        }
      }
    }
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
      G.ship.ang += 0.32 * dt;
      G.ship.x = VW * 0.5 + Math.sin(G.t * 0.35) * 18;
      G.ship.y = VH * 0.68 + Math.cos(G.t * 0.28) * 8;
      updateMobs(dt);
      if (mobCount() < 6) spawnGroup();
      if (G.talkT <= 0) {
        G.quoteI = (G.quoteI + 1) % QUOTES.length;
        say(QUOTES[G.quoteI], 4);
      }
      updateFx(dt);
      return;
    }

    if (G.mode === 'pick') {
      G.pickT -= dt;
      if (ovOps) ovOps.textContent = GUN_OPS + ' · 剩余 ' + Math.max(0, Math.ceil(G.pickT)) + ' 秒';
      G.ship.ang += 0.15 * dt;
      if (G.pickT <= 0) pickGun(G.gun || 'fwd');
      updateFx(dt);
      syncHud();
      return;
    }

    if (G.mode === 'lose') {
      updateMobs(dt);
      updateShots(dt);
      updateFx(dt);
      return;
    }

    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function forWrap(x, y, r, fn) {
    fn(x, y);
    const nx = x < r + 10;
    const px = x > VW - r - 10;
    const ny = y < r + 10;
    const py = y > VH - r - 10;
    if (nx) fn(x + VW, y);
    if (px) fn(x - VW, y);
    if (ny) fn(x, y + VH);
    if (py) fn(x, y - VH);
    if (nx && ny) fn(x + VW, y + VH);
    if (nx && py) fn(x + VW, y - VH);
    if (px && ny) fn(x - VW, y + VH);
    if (px && py) fn(x - VW, y - VH);
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#1a0614');
    g.addColorStop(0.5, '#0e030c');
    g.addColorStop(1, '#0c0208');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(400), sy(200), 24 * scale, sx(400), sy(240), 430 * scale);
    vg.addColorStop(0, 'rgba(255, 48, 176, 0.08)');
    vg.addColorStop(0.55, 'rgba(0, 232, 255, 0.03)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = REDUCE ? s.a : s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function strokePoly(pts, rgb, glow, alpha) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0] * scale;
      const py = pts[i][1] * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(rgb, glow ? 0.2 * (alpha || 1) : (alpha == null ? 1 : alpha));
    ctx.lineWidth = (glow ? 5 : 1.4) * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function drawPoly(x, y, ang, pts, rgb, ghost) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    if (!ghost) strokePoly(pts, rgb, true, 1);
    strokePoly(pts, rgb, false, ghost ? 0.35 : 1);
    ctx.restore();
  }

  function drawMothership(x, y, s, lookX, lookY) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    const pulse = 0.5 + 0.5 * Math.sin(G.t * 2.2);
    const tend = [
      [-1.1, 0.35, -1.6, 1.1],
      [1.1, 0.35, 1.6, 1.1],
      [0, 0.7, 0.15 * Math.sin(G.t * 3), 1.35]
    ];
    ctx.strokeStyle = rgba(MAG, 0.22);
    ctx.lineWidth = 5 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22 * s * scale, 18 * s * scale, 0, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = rgba(MAG, 0.95);
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22 * s * scale, 18 * s * scale, 0, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 6 * s * scale, 10 * s * scale, 6 * s * scale, 0, 0, TAU);
    ctx.strokeStyle = rgba(ICE, 0.7);
    ctx.stroke();
    for (let i = 0; i < tend.length; i++) {
      const t = tend[i];
      ctx.beginPath();
      ctx.moveTo(t[0] * 16 * s * scale, t[1] * 16 * s * scale);
      ctx.quadraticCurveTo(
        (t[0] + t[2]) * 0.5 * 16 * s * scale,
        (t[1] + t[3]) * 0.5 * 16 * s * scale + Math.sin(G.t * 3 + i) * 4 * scale,
        t[2] * 16 * s * scale,
        t[3] * 16 * s * scale
      );
      ctx.strokeStyle = rgba(MAG, 0.75);
      ctx.lineWidth = 1.3 * scale;
      ctx.stroke();
    }
    const w = wrapDist(lookX, lookY, x, y);
    const d = w.d || 1;
    const ix = clamp((w.dx / d) * 4 * s, -5 * s, 5 * s);
    const iy = clamp((w.dy / d) * 3 * s, -3.5 * s, 3.5 * s);
    ctx.beginPath();
    ctx.ellipse(0, -2 * s * scale, 11 * s * scale, 8.5 * s * scale, 0, 0, TAU);
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(ix * scale, (-2 * s + iy) * scale, 4.2 * s * scale, 4.2 * s * scale, 0, 0, TAU);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fill();
    ctx.beginPath();
    ctx.arc((ix + 0.4) * scale, (-2 * s + iy - 0.2) * scale, 1.5 * s * scale, 0, TAU);
    ctx.fillStyle = rgba([20, 4, 14], 1);
    ctx.fill();
    ctx.beginPath();
    ctx.arc((ix - 1.4) * scale, (-2 * s + iy - 1.4) * scale, 0.7 * s * scale, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    if (G.talkT > 0) {
      ctx.beginPath();
      ctx.ellipse(0, 8 * s * scale, (5 + pulse * 2) * s * scale, (1.4 + pulse) * s * scale, 0, 0, TAU);
      ctx.strokeStyle = rgba(ICE, 0.8);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShipShape(x, y, ang, thrusting, ghost) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, -14 * scale);
    ctx.lineTo(9.5 * scale, 12 * scale);
    ctx.lineTo(0, 7 * scale);
    ctx.lineTo(-9.5 * scale, 12 * scale);
    ctx.closePath();
    ctx.strokeStyle = rgba(WHT, ghost ? 0.32 : 1);
    ctx.lineWidth = 1.6 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    if (!ghost || G.mode === 'pick') {
      if (G.gun === 'fwd') {
        ctx.beginPath();
        ctx.moveTo(-5.5 * scale, -6 * scale);
        ctx.lineTo(-5.5 * scale, -11 * scale);
        ctx.moveTo(5.5 * scale, -6 * scale);
        ctx.lineTo(5.5 * scale, -11 * scale);
        ctx.strokeStyle = rgba(ICE, 0.95);
        ctx.lineWidth = 1.4 * scale;
        ctx.stroke();
      } else if (G.gun === 'dual') {
        ctx.beginPath();
        ctx.moveTo(-3 * scale, 10 * scale);
        ctx.lineTo(0, 16 * scale);
        ctx.lineTo(3 * scale, 10 * scale);
        ctx.strokeStyle = rgba(CYN, 0.95);
        ctx.lineWidth = 1.3 * scale;
        ctx.stroke();
      } else if (G.gun === 'wide') {
        ctx.beginPath();
        ctx.moveTo(-10 * scale, 2 * scale);
        ctx.lineTo(-15 * scale, 0);
        ctx.moveTo(10 * scale, 2 * scale);
        ctx.lineTo(15 * scale, 0);
        ctx.strokeStyle = rgba(GOLD, 0.95);
        ctx.lineWidth = 1.3 * scale;
        ctx.stroke();
      }
    }
    if (G.shield > 0 && !ghost && G.deadT <= 0) {
      const a = G.shield === 2 ? 0.55 : 0.32;
      const rx = (16 + (G.crackT > 0 ? 2 : 0)) * scale;
      const ry = (19 + (G.crackT > 0 ? 2 : 0)) * scale;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
      ctx.strokeStyle = rgba(G.shield === 2 ? CYN : ICE, a);
      ctx.lineWidth = 1.35 * scale;
      ctx.stroke();
      for (let i = 0; i < cracks.length; i++) {
        const c = cracks[i];
        const k = 1 - c.t / c.life;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, c.a, c.a + c.w);
        ctx.strokeStyle = rgba(WHT, 0.85 * k);
        ctx.lineWidth = 2.1 * scale;
        ctx.stroke();
        ctx.beginPath();
        const ca = Math.cos(c.a + c.w * 0.5);
        const sa = Math.sin(c.a + c.w * 0.5);
        ctx.moveTo(ca * rx * 0.4, sa * ry * 0.4);
        ctx.lineTo(ca * rx * 1.15, sa * ry * 1.15);
        ctx.strokeStyle = rgba(WHT, 0.7 * k);
        ctx.lineWidth = 1.1 * scale;
        ctx.stroke();
      }
    }
    if (thrusting && !ghost) {
      const flick = 0.5 + 0.5 * (0.5 + 0.5 * Math.sin(G.t * 42));
      ctx.beginPath();
      ctx.moveTo(-4.4 * scale, 8 * scale);
      ctx.lineTo(0, (16 + 7 * flick) * scale);
      ctx.lineTo(4.4 * scale, 8 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.9 * flick);
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-2.2 * scale, 8 * scale);
      ctx.lineTo(0, (12 + 4 * flick) * scale);
      ctx.lineTo(2.2 * scale, 8 * scale);
      ctx.strokeStyle = rgba(MAG, 0.7 * flick);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    const s = G.ship;
    const thrusting = G.mode === 'play' && keys.u;
    const ghost = G.mode === 'title' || G.mode === 'pick';
    forWrap(s.x, s.y, 20, function (x, y) {
      drawShipShape(x, y, s.ang, thrusting, ghost);
    });
  }

  function drawMobs() {
    for (let i = 0; i < G.mobs.length; i++) {
      const m = G.mobs[i];
      const flash = m.inv > 0;
      const rgb = flash ? GOLD : m.rgb;
      if (m.kind === 'frag') {
        const pts = FRAG_PTS[m.slot] || FRAG_PTS[0];
        forWrap(m.x, m.y, m.r + 6, function (x, y) {
          drawPoly(x, y, m.ang, pts, rgb, false);
        });
      } else if (m.kind === 'full') {
        forWrap(m.x, m.y, m.r + 8, function (x, y) {
          drawPoly(x, y, m.ang, FULL_PTS, rgb, false);
          ctx.save();
          ctx.translate(sx(x), sy(y));
          ctx.rotate(m.ang);
          ctx.beginPath();
          ctx.arc(0, -2 * scale, 3.2 * scale, 0, TAU);
          ctx.strokeStyle = rgba(GOLD, 0.9);
          ctx.lineWidth = 1.2 * scale;
          ctx.stroke();
          ctx.restore();
        });
      } else if (m.kind === 'ram') {
        forWrap(m.x, m.y, m.r + 8, function (x, y) {
          drawPoly(x, y, m.ang, RAM_PTS, rgb, false);
        });
      }
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const rgb = s.from === 'alien' ? MAG : WHT;
      const spd = hypot(s.vx, s.vy) || 1;
      const dx = s.vx / spd;
      const dy = s.vy / spd;
      if (s.trail && !REDUCE) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          ctx.strokeStyle = rgba(s.from === 'alien' ? MAG : CYN, 0.08 + t * 0.07);
          ctx.lineWidth = (1 + t * 0.12) * scale;
          ctx.beginPath();
          ctx.moveTo(sx(p.x - dx * 3), sy(p.y - dy * 3));
          ctx.lineTo(sx(p.x + dx * 3), sy(p.y + dy * 3));
          ctx.stroke();
        }
      }
      ctx.strokeStyle = rgba(rgb, 0.95);
      ctx.lineWidth = (s.from === 'alien' ? 2.3 : 1.8) * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(s.x - dx * 5.5), sy(s.y - dy * 5.5));
      ctx.lineTo(sx(s.x + dx * 5.5), sy(s.y + dy * 5.5));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, 0.65 * (1 - k));
      ctx.lineWidth = (2.6 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * 0.35 + k * s.rad) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const k = s.t / 0.38;
      ctx.strokeStyle = rgba(s.rgb, 0.5 * (1 - k));
      ctx.lineWidth = (2.1 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + k * 26) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const a = clamp(s.life / s.max, 0, 1);
      const hx = Math.cos(s.ang) * s.len * 0.5;
      const hy = Math.sin(s.ang) * s.len * 0.5;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.35 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(s.x - hx), sy(s.y - hy));
      ctx.lineTo(sx(s.x + hx), sy(s.y + hy));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(1 - f.t / f.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, 1);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawArenaEdge() {
    ctx.strokeStyle = 'rgba(255, 48, 176, 0.18)';
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(sx(0) + 0.5, sy(0) + 0.5, VW * scale - 1, VH * scale - 1);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0208';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    if (G.mode === 'title' || G.mode === 'pick' || G.mode === 'lose') {
      drawMothership(VW * 0.5, 96, G.mode === 'title' ? 1.15 : 0.92, G.ship.x, G.ship.y);
    }
    drawMobs();
    drawShots();
    drawShip();
    drawParticles();
    drawFloats();
    drawFlash();
    drawArenaEdge();
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('fury');
    else startGame(G.kind || 'fury');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('fury');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
    if (G.mode === 'pick') pickGun('fwd');
  }

  function onKey(e, down) {
    const code = e.code || '';
    const k = e.key;
    const left = code === 'KeyA' || code === 'ArrowLeft';
    const right = code === 'KeyD' || code === 'ArrowRight';
    const up = code === 'KeyW' || code === 'ArrowUp';
    const downKey = code === 'KeyS' || code === 'ArrowDown';
    const space = code === 'Space' || k === ' ';
    if (down && (left || right || up || downKey || space || k === 'Enter')) e.preventDefault();

    if (left) keys.l = down;
    if (right) keys.r = down;
    if (up) keys.u = down;
    if (downKey) keys.d = down;
    if (space) keys.fire = down && G.mode === 'play' && !overlayOpen();

    if (!down) return;
    if (e.repeat && (space || k === 'Enter')) return;

    if (code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (code === 'KeyR') {
      restart();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') fire();
    }
    if ((k === '1' || code === 'Digit1') && overlayOpen()) {
      if (G.mode === 'title') startGame('fury');
      else if (G.mode === 'pick') pickGun('fwd');
    }
    if ((k === '2' || code === 'Digit2') && overlayOpen()) {
      if (G.mode === 'title') startGame('hunt');
      else if (G.mode === 'pick') pickGun('dual');
    }
    if ((k === '3' || code === 'Digit3') && overlayOpen() && G.mode === 'pick') {
      pickGun('wide');
    }
  }

  function holdPad(el, press, release) {
    if (!el) return;
    let held = false;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      held = true;
      el.classList.add('on');
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      press();
    });
    function up() {
      if (!held) return;
      held = false;
      el.classList.remove('on');
      if (release) release();
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
  }

  function bindPads() {
    holdPad(padCcw, function () { keys.l = true; }, function () { keys.l = false; });
    holdPad(padCw, function () { keys.r = true; }, function () { keys.r = false; });
    holdPad(padThrust, function () { keys.u = true; }, function () { keys.u = false; });
    holdPad(padRev, function () { keys.d = true; }, function () { keys.d = false; });
    holdPad(padFire, function () { keys.fire = true; fire(); }, function () { keys.fire = false; });
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
  bindPads();

  if (btnFury) {
    btnFury.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else if (G.mode === 'pick') pickGun('fwd');
      else startGame('fury');
    });
  }
  if (btnHunt) {
    btnHunt.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('hunt');
    });
  }
  if (btnFwd) btnFwd.addEventListener('click', function () { audio.ensure(); pickGun('fwd'); });
  if (btnDual) btnDual.addEventListener('click', function () { audio.ensure(); pickGun('dual'); });
  if (btnWide) btnWide.addEventListener('click', function () { audio.ensure(); pickGun('wide'); });
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }

  if (canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (e.button != null && e.button !== 0) return;
      if (e.pointerType === 'touch' && padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      if (overlayOpen()) {
        if (e.pointerType !== 'touch' && G.mode !== 'pick') primaryAction();
        return;
      }
      if (G.mode === 'play') {
        keys.fire = true;
        fire();
      }
    });
    function ptrUp() { keys.fire = false; }
    canvas.addEventListener('pointerup', ptrUp);
    canvas.addEventListener('pointercancel', ptrUp);
    canvas.addEventListener('lostpointercapture', ptrUp);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
      keys.fire = false;
    }
  });

  requestAnimationFrame(frame);
})();
