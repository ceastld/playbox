'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const TAP_MAX = 0.16;
  const HIT_R = 4.6;
  const SHOT_V = 700;
  const BEST_KEY = 'playbox-dimahoo-best';
  const MUTE_KEY = 'playbox-dimahoo-mute';
  const OPS = '方向 / WASD 移动 · 空格射击 · Shift / Z 切元素 / 蓄魔炮 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const FIRE = [255, 106, 24];
  const EMB = [255, 154, 50];
  const GOLD = [255, 227, 107];
  const ICE = [77, 232, 255];
  const FRO = [122, 184, 255];
  const MAG = [255, 61, 138];
  const WHT = [255, 244, 232];
  const DEEP = [28, 12, 8];
  const VOID = [176, 92, 255];
  const PNK = [255, 154, 196];

  const SCORE = {
    imp: 50,
    frost: 50,
    wisp: 70,
    dive: 80,
    salam: 140,
    yeti: 140,
    rune: 160,
    mage: 240,
    orb: 280,
    shard: 20,
    boss: 8000,
    chip: 12,
    stage: 1500
  };

  const STAGES = [
    {
      name: '炎谷',
      tint: 'fire',
      waves: [
        { t: 0.65, kind: 'v', elem: 'fire', n: 5 },
        { t: 3.05, kind: 'stream', elem: 'fire', dir: 1 },
        { t: 5.5, kind: 'salam' },
        { t: 7.9, kind: 'rune', elem: 'fire' },
        { t: 10.2, kind: 'dive', elem: 'fire', n: 4 },
        { t: 12.5, kind: 'v', elem: 'fire', n: 7 },
        { t: 14.8, kind: 'wisp' },
        { t: 17.2, kind: 'stream', elem: 'fire', dir: -1 }
      ]
    },
    {
      name: '霜廊',
      tint: 'ice',
      waves: [
        { t: 0.5, kind: 'v', elem: 'ice', n: 5 },
        { t: 2.6, kind: 'dive', elem: 'ice', n: 5 },
        { t: 4.8, kind: 'stream', elem: 'ice', dir: -1 },
        { t: 6.9, kind: 'yeti' },
        { t: 9.1, kind: 'rune', elem: 'ice' },
        { t: 11.2, kind: 'v', elem: 'ice', n: 7 },
        { t: 13.4, kind: 'mage' },
        { t: 15.6, kind: 'wisp' },
        { t: 17.8, kind: 'stream', elem: 'ice', dir: 1 }
      ]
    },
    {
      name: '魔核',
      tint: 'mix',
      waves: [
        { t: 0.5, kind: 'v', elem: 'fire', n: 5 },
        { t: 2.2, kind: 'v', elem: 'ice', n: 5 },
        { t: 4.0, kind: 'mage' },
        { t: 6.0, kind: 'salam' },
        { t: 7.6, kind: 'yeti' },
        { t: 9.3, kind: 'wisp' },
        { t: 11.0, kind: 'dive', elem: 'fire', n: 3 },
        { t: 12.2, kind: 'dive', elem: 'ice', n: 3 },
        { t: 14.4, kind: 'boss' }
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
  const btnElem = document.getElementById('btn-elem');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnChg = document.getElementById('btn-chg');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chgBar = document.getElementById('chg-bar');
  const chgWrap = document.getElementById('chg-wrap');

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
  let wpnTok = 0;

  const keys = { l: false, r: false, u: false, d: false, sht: false, chgKey: false, chgBtn: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 80, id: null };
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
    stage: 1,
    stageT: 0,
    waveI: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    enemies: [],
    shots: [],
    bullets: [],
    shards: [],
    blasts: [],
    ship: { x: VW * 0.5, y: VH - 78, vx: 0, vy: 0 },
    elem: 'fire',
    charge: 0,
    chgHold: 0,
    chgReady: false,
    chgBuzz: 0,
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: FIRE,
    punch: 1,
    muzzle: 0,
    scroll: 0,
    gapT: 0,
    winT: 0
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
  function isElem() {
    return G.kind === 'elem';
  }
  function dens() {
    return isElem() ? 1.28 : 1;
  }
  function shipSpeed() {
    const base = isElem() ? 322 : 280;
    return charging() && G.chgHold > TAP_MAX ? base * 0.72 : base;
  }
  function fireRate() {
    return isElem() ? 0.078 : 0.09;
  }
  function bulletSpd() {
    return isElem() ? 188 : 148;
  }
  function scrollSpd() {
    if (hasBoss()) return 24;
    return isElem() ? 128 : 90;
  }
  function hpMul() {
    return isElem() ? 1.26 : 1;
  }
  function chargeTime() {
    return isElem() ? 0.72 : 0.9;
  }
  function charging() {
    return !!(keys.chgKey || keys.chgBtn);
  }
  function elemRgb(elem) {
    if (elem === 'ice') return ICE;
    if (elem === 'void') return VOID;
    return FIRE;
  }
  function elemHot(elem) {
    if (elem === 'ice') return FRO;
    if (elem === 'void') return PNK;
    return EMB;
  }
  function elemMul(shot, foe) {
    if (!foe || foe === 'void') return 1;
    if (shot === foe) return 0.6;
    return 2;
  }
  function weakness(shot, foe) {
    return foe && foe !== 'void' && shot !== foe;
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
    shoot(elem) {
      this.ensure();
      if (elem === 'ice') this.beep(980, 0.04, 'triangle', 0.026, 1540);
      else this.beep(720, 0.045, 'square', 0.028, 1480);
    },
    switchElem(elem) {
      this.ensure();
      if (elem === 'ice') {
        this.beep(520, 0.08, 'sine', 0.04, 880);
        this.beep(1320, 0.12, 'triangle', 0.032, 1760);
      } else {
        this.beep(880, 0.08, 'sawtooth', 0.04, 420);
        this.beep(1480, 0.12, 'square', 0.03, 640);
      }
    },
    chargeHum(p, elem) {
      this.ensure();
      const f = (elem === 'ice' ? 280 : 220) + p * 420;
      this.beep(f, 0.07, elem === 'ice' ? 'triangle' : 'sawtooth', 0.02, f + 180);
    },
    ready() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.04, 784);
      this.beep(1046, 0.14, 'triangle', 0.036, 1568);
    },
    blast(full, elem) {
      this.ensure();
      if (full) {
        this.noise(0.16, 0.05, 380);
        this.beep(elem === 'ice' ? 180 : 140, 0.22, 'sawtooth', 0.05, 60);
        this.beep(elem === 'ice' ? 980 : 620, 0.18, 'square', 0.04, 1600);
        this.beep(1480, 0.24, 'sine', 0.036, 2200);
      } else {
        this.noise(0.08, 0.038, 700);
        this.beep(elem === 'ice' ? 640 : 420, 0.12, 'sawtooth', 0.042, 180);
        this.beep(1100, 0.1, 'triangle', 0.03, 1680);
      }
    },
    hit(combo, weak) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.028, weak ? 0.036 : 0.026, weak ? 1600 : 1200);
      this.beep((weak ? 760 : 560) * lift, 0.055, 'square', 0.036, (weak ? 1180 : 860) * lift);
    },
    shard(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.7, combo * 0.035);
      this.beep(780 * lift, 0.07, 'sine', 0.034, 1560 * lift);
      this.beep(1240 * lift, 0.09, 'triangle', 0.02, 1880 * lift);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 500);
      this.beep(280, 0.14, 'sawtooth', 0.045, 70);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.055, 'sawtooth', 0.038, 180);
      this.beep(620, 0.07, 'square', 0.03, 880);
    },
    bossDie() {
      this.ensure();
      this.noise(0.22, 0.06, 280);
      this.beep(180, 0.28, 'sawtooth', 0.05, 50);
      this.beep(520, 0.2, 'triangle', 0.04, 220);
      this.beep(1040, 0.32, 'sine', 0.04, 1560);
    },
    death() {
      this.ensure();
      this.noise(0.12, 0.05, 400);
      this.beep(320, 0.16, 'sawtooth', 0.05, 90);
      this.beep(180, 0.28, 'sine', 0.045, 50);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(880, 0.18, 'sine', 0.05, 1175);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
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
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    while (G.score >= G.next1up && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.next1up += LIFE_EVERY;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      hitStop(0.055);
      kick(3.2);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
      comboTok += 1;
    }
    if (G.combo % 3 === 0) {
      floatText(G.ship.x, G.ship.y - 28, G.combo + ' 链', GOLD, true);
      hitStop(0.046);
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (comboEl) comboEl.hidden = true;
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
    }, 1150);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = LIFE_CAP;
    while (pips.length < n) {
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < n; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const st = STAGES[G.stage - 1];
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '魔炮';
      else if (hasBoss()) stageLabel.textContent = '魔帝';
      else stageLabel.textContent = st ? st.name : '魔核';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || hasBoss()));
    }
    if (tagLabel) {
      tagLabel.textContent = isElem() ? '元素' : '魔袭';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isElem());
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.charge >= 1);
    }
    if (wpnLabel) {
      wpnLabel.textContent = G.elem === 'ice' ? '冰' : '炎';
      wpnLabel.classList.toggle('ice', G.elem === 'ice');
      wpnLabel.classList.toggle('fire', G.elem !== 'ice');
    }
    if (chgBar) chgBar.style.transform = 'scaleX(' + clamp(G.charge, 0, 1) + ')';
    if (chgWrap) {
      chgWrap.classList.toggle('ice', G.elem === 'ice');
      chgWrap.classList.toggle('full', G.charge >= 1);
    }
    if (btnChg) btnChg.classList.toggle('hot', charging() || G.charge >= 1);
    if (btnPad) btnPad.classList.toggle('hot', charging() || G.charge >= 1);
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 克制翻倍，蓄满放魔炮', 'warn');
    else if (G.mode === 'win') setHint('魔核已碎 · R 再来', 'hot');
    else if (G.charge >= 1) setHint('魔炮就绪 · 松手放出', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 切元素打克制', 'warn');
    else setHint('空格连射 · Shift 切炎冰并蓄魔炮 · 克制翻倍', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DIMA';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.04, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const name = cls || (mag >= 7 ? 'die' : mag >= 5 ? 'boss' : mag >= 3.5 ? 'charge' : 'hit');
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('charge');
    stageEl.classList.remove('boss');
    void stageEl.offsetWidth;
    stageEl.classList.add(name);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 160,
        life: rand(0.22, 0.52),
        r: rand(1.2, 2.9),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 180);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 16);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      t: 0,
      life: gold ? 0.9 : 0.65,
      vy: gold ? -70 : -48,
      text: text,
      rgb: rgb,
      gold: !!gold
    });
    capArr(floats, 18);
  }

  function explode(x, y, rgb, power) {
    const p = power || 16;
    burst(x, y, rgb, Math.min(28, 8 + (p * 0.45) | 0), 80 + p * 4);
    spark(x, y, rgb);
    ring(x, y, rgb);
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 72; i++) {
      motes.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        s: rand(0.5, 2.2),
        a: rand(0.14, 0.62),
        z: rand(0.35, 1.15),
        ice: Math.random() < 0.45
      });
    }
  }

  function spawnShard(x, y, elem) {
    G.shards.push({
      x: x,
      y: y,
      vx: rand(-50, 50),
      vy: rand(16, 64),
      t: 0,
      spin: rand(0, TAU),
      elem: elem || 'fire'
    });
    capArr(G.shards, 90);
  }

  function cancelBullets(x, y, rad) {
    let n = 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy < rad * rad) {
        spawnShard(b.x, b.y, b.elem || 'void');
        G.bullets.splice(i, 1);
        n += 1;
      }
    }
    if (n > 0) {
      audio.shard(G.combo);
      spark(x, y, GOLD);
      if (n >= 4) {
        ring(x, y, GOLD);
        hitStop(0.03);
      }
    }
    return n;
  }

  function collectShard(s) {
    const pts = Math.round(SCORE.shard * G.mult);
    addScore(pts);
    if (G.combo >= 1) bumpCombo();
    else {
      G.combo = 1;
      G.comboT = COMBO_WIN;
      G.mult = 1;
    }
    burst(s.x, s.y, elemRgb(s.elem), 8, 90);
    audio.shard(G.combo);
    syncHud();
  }

  function spawnEnemy(spec) {
    const bossish = spec.kind === 'boss' || spec.kind === 'orb';
    const hp = Math.max(1, Math.round((spec.hp || 1) * (bossish ? 1 : hpMul())));
    const e = {
      alive: true,
      kind: spec.kind || 'imp',
      elem: spec.elem || 'void',
      x: spec.x,
      y: spec.y == null ? -28 : spec.y,
      vx: spec.vx || 0,
      vy: spec.vy == null ? 94 * dens() : spec.vy,
      hp: bossish ? spec.hp : hp,
      maxHp: bossish ? spec.hp : hp,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd == null ? rand(0.4, 1.2) : spec.fireCd,
      baseX: spec.x,
      amp: spec.amp == null ? 48 : spec.amp,
      phase: spec.phase || 0,
      omega: spec.omega || 2.1,
      flash: 0,
      score: spec.score || SCORE.imp,
      ang: spec.ang || 0,
      rad: spec.rad || 54,
      enter: spec.enter || 0,
      spin: 0,
      pattern: 0
    };
    G.enemies.push(e);
    return e;
  }

  function enemyShot(x, y, vx, vy, r, elem) {
    G.bullets.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      r: r || 3.5,
      life: 8,
      elem: elem || 'void'
    });
    capArr(G.bullets, 240);
  }

  function aimedFire(e, n, spread, spd) {
    const a0 = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
    const count = n || 1;
    const sp = spread || 0;
    const s = spd || bulletSpd();
    for (let i = 0; i < count; i++) {
      const a = a0 + (count === 1 ? 0 : (i - (count - 1) * 0.5) * sp);
      enemyShot(e.x, e.y + 6, Math.cos(a) * s, Math.sin(a) * s, 3.3, e.elem);
    }
  }

  function ringFire(e, n, spd, rot, elem) {
    const s = spd || bulletSpd() * 0.82;
    const el = elem || e.elem;
    for (let i = 0; i < n; i++) {
      const a = (rot || 0) + i * (TAU / n);
      enemyShot(e.x, e.y, Math.cos(a) * s, Math.sin(a) * s, 3.4, el);
    }
  }

  function spawnSmall(elem, x, y, vx, vy) {
    const ice = elem === 'ice';
    spawnEnemy({
      kind: ice ? 'frost' : 'imp',
      elem: ice ? 'ice' : 'fire',
      x: x,
      y: y == null ? -26 : y,
      vx: vx || 0,
      vy: vy == null ? 98 * dens() : vy,
      hp: 2,
      r: 11,
      amp: 42,
      score: ice ? SCORE.frost : SCORE.imp,
      fireCd: rand(0.55, 1.35)
    });
  }

  function spawnV(n, cx, elem) {
    const c = cx == null ? VW * 0.5 : cx;
    const el = elem || 'fire';
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      spawnSmall(el, c + k * 36, -26 - Math.abs(k) * 16, 0, 102 * dens());
    }
  }

  function spawnStream(dir, elem) {
    const side = dir < 0 ? VW - 70 : 70;
    const extra = isElem() ? 3 : 0;
    const el = elem || 'fire';
    for (let i = 0; i < 6 + extra; i++) {
      spawnEnemy({
        kind: el === 'ice' ? 'frost' : 'imp',
        elem: el,
        x: side,
        y: -20 - i * 22,
        vx: dir * 38,
        vy: 90 * dens(),
        hp: 2,
        r: 11,
        amp: 56,
        phase: i * 0.5,
        score: el === 'ice' ? SCORE.frost : SCORE.imp,
        fireCd: 0.7 + i * 0.12
      });
    }
  }

  function spawnDive(n, elem) {
    const el = elem || 'fire';
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'dive',
        elem: el,
        x: 50 + Math.random() * (VW - 100),
        y: -30 - i * 18,
        vy: 42,
        hp: 2,
        r: 12,
        score: SCORE.dive,
        fireCd: 99
      });
    }
  }

  function spawnSalam() {
    const xs = [130, 350];
    if (isElem()) xs.push(240);
    for (let i = 0; i < xs.length; i++) {
      spawnEnemy({
        kind: 'salam',
        elem: 'fire',
        x: xs[i],
        y: -32,
        vy: 60 * dens(),
        hp: 6,
        r: 16,
        amp: 70,
        score: SCORE.salam,
        fireCd: 0.45
      });
    }
  }

  function spawnYeti() {
    const xs = [130, 350];
    if (isElem()) xs.push(240);
    for (let i = 0; i < xs.length; i++) {
      spawnEnemy({
        kind: 'yeti',
        elem: 'ice',
        x: xs[i],
        y: -32,
        vy: 60 * dens(),
        hp: 6,
        r: 16,
        amp: 70,
        phase: i * 0.8,
        score: SCORE.yeti,
        fireCd: 0.5
      });
    }
  }

  function spawnRune(elem) {
    const n = isElem() ? 5 : 4;
    const el = elem || 'fire';
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'rune',
        elem: el,
        x: 56 + i * ((VW - 112) / Math.max(1, n - 1)),
        y: -18,
        vy: 44 * dens(),
        hp: 8,
        r: 14,
        score: SCORE.rune,
        fireCd: 0.55 + i * 0.1
      });
    }
  }

  function spawnWisp() {
    const n = isElem() ? 4 : 3;
    for (let i = 0; i < n; i++) {
      spawnEnemy({
        kind: 'wisp',
        elem: 'void',
        x: 90 + i * ((VW - 180) / Math.max(1, n - 1)),
        y: -28 - (i % 2) * 18,
        vy: 70 * dens(),
        hp: 4,
        r: 13,
        amp: 64,
        phase: i * 0.9,
        score: SCORE.wisp,
        fireCd: 0.7
      });
    }
  }

  function spawnMage() {
    spawnEnemy({
      kind: 'mage',
      elem: 'fire',
      x: 160,
      vy: 54 * dens(),
      hp: 12,
      r: 17,
      amp: 86,
      score: SCORE.mage,
      fireCd: 0.5
    });
    spawnEnemy({
      kind: 'mage',
      elem: 'ice',
      x: 320,
      vy: 54 * dens(),
      hp: 12,
      r: 17,
      amp: 86,
      phase: 1.6,
      score: SCORE.mage,
      fireCd: 0.7
    });
  }

  function spawnBoss() {
    const dense = isElem();
    const boss = spawnEnemy({
      kind: 'boss',
      elem: 'fire',
      x: VW * 0.5,
      y: -80,
      vy: 0,
      hp: dense ? 124 : 96,
      r: 38,
      score: SCORE.boss,
      enter: 1.4,
      fireCd: 0.9
    });
    boss.maxHp = boss.hp;
    spawnEnemy({
      kind: 'orb',
      elem: 'fire',
      x: VW * 0.5 + 78,
      y: 30,
      hp: dense ? 18 : 14,
      r: 13,
      score: SCORE.orb,
      ang: 0,
      rad: 86,
      fireCd: 0.8
    });
    spawnEnemy({
      kind: 'orb',
      elem: 'ice',
      x: VW * 0.5 - 78,
      y: 30,
      hp: dense ? 18 : 14,
      r: 13,
      score: SCORE.orb,
      ang: Math.PI,
      rad: 86,
      fireCd: 1.05
    });
    toast('魔帝', false, true);
    audio.wave();
    screenFlash(FIRE, 0.36);
    kick(4.6, 'boss');
    syncHud();
    return boss;
  }

  function fireWave(w) {
    if (w.kind === 'v') spawnV(w.n + (isElem() ? 2 : 0), w.x, w.elem);
    else if (w.kind === 'stream') spawnStream(w.dir, w.elem);
    else if (w.kind === 'dive') spawnDive(w.n + (isElem() ? 1 : 0), w.elem);
    else if (w.kind === 'salam') spawnSalam();
    else if (w.kind === 'yeti') spawnYeti();
    else if (w.kind === 'rune') spawnRune(w.elem);
    else if (w.kind === 'wisp') spawnWisp();
    else if (w.kind === 'mage') spawnMage();
    else if (w.kind === 'boss') spawnBoss();
  }

  function living() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) n += 1;
    return n;
  }

  function hasBoss() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'boss') return true;
    }
    return false;
  }

  function findBoss() {
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && G.enemies[i].kind === 'boss') return G.enemies[i];
    }
    return null;
  }

  function wantFire() {
    return G.mode === 'play' && G.deadT <= 0 && !overlayOpen() && (keys.sht || pointer.down);
  }

  function fireShot() {
    if (G.fireCd > 0) return;
    G.fireCd = fireRate();
    G.muzzle = 0.055;
    const spread = G.combo >= 6 ? 0.2 : 0.12;
    const n = G.combo >= 6 ? 3 : 2;
    const start = n === 3 ? -1 : -0.5;
    for (let i = 0; i < n; i++) {
      const k = start + i;
      const a = -Math.PI * 0.5 + k * spread;
      G.shots.push({
        x: G.ship.x + k * 8,
        y: G.ship.y - 14,
        vx: Math.cos(a) * SHOT_V,
        vy: Math.sin(a) * SHOT_V,
        r: 3.6,
        dmg: 1,
        elem: G.elem
      });
    }
    capArr(G.shots, 56);
    audio.shoot(G.elem);
  }

  function switchElem() {
    G.elem = G.elem === 'ice' ? 'fire' : 'ice';
    G.charge = 0;
    G.chgReady = false;
    const rgb = elemRgb(G.elem);
    audio.switchElem(G.elem);
    ring(G.ship.x, G.ship.y, rgb);
    burst(G.ship.x, G.ship.y - 8, rgb, 14, 160);
    screenFlash(rgb, 0.32);
    hitStop(0.04);
    kick(3.1, 'charge');
    floatText(G.ship.x, G.ship.y - 34, G.elem === 'ice' ? '冰' : '炎', rgb, true);
    if (wpnLabel) {
      wpnLabel.classList.remove('hot');
      void wpnLabel.offsetWidth;
      wpnLabel.classList.add('hot');
      wpnTok += 1;
    }
    toast(G.elem === 'ice' ? '切冰' : '切炎', false, G.elem === 'ice');
    syncHud();
  }

  function fireBlast() {
    const full = G.charge >= 0.98;
    const elem = G.elem;
    const rgb = elemRgb(elem);
    G.blasts.push({
      x: G.ship.x,
      y: G.ship.y - 22,
      vx: 0,
      vy: full ? -380 : -540,
      elem: elem,
      dmg: full ? 16 : 8,
      r: full ? 17 : 11,
      pierce: full ? 4 : 1,
      life: full ? 1.45 : 0.72,
      full: full
    });
    capArr(G.blasts, 6);
    audio.blast(full, elem);
    explode(G.ship.x, G.ship.y - 16, rgb, full ? 28 : 16);
    screenFlash(rgb, full ? 0.55 : 0.32);
    hitStop(full ? 0.072 : 0.056);
    kick(full ? 6.4 : 3.8, full ? 'boss' : 'charge');
    if (full) {
      floatText(G.ship.x, G.ship.y - 40, '魔炮', rgb, true);
      toast('魔炮', false, true);
      cancelBullets(G.ship.x, G.ship.y - 20, 78);
    }
    G.charge = 0;
    G.chgReady = false;
    G.muzzle = 0.1;
    syncHud();
  }

  function releaseCharge() {
    if (G.mode !== 'play' || G.deadT > 0 || overlayOpen()) {
      G.chgHold = 0;
      G.charge = 0;
      G.chgReady = false;
      return;
    }
    if (G.chgHold > 0 && G.chgHold < TAP_MAX) switchElem();
    else if (G.charge >= 0.5) fireBlast();
    else if (G.chgHold >= TAP_MAX && G.charge > 0.08) {
      burst(G.ship.x, G.ship.y - 10, elemRgb(G.elem), 8, 90);
    }
    G.chgHold = 0;
    G.charge = 0;
    G.chgReady = false;
    syncHud();
  }

  function tryReleaseCharge() {
    if (charging()) return;
    releaseCharge();
  }

  function damageEnemy(e, dmg, src, shotElem) {
    if (!e.alive) return;
    const el = shotElem || G.elem;
    let mul = elemMul(el, e.elem);
    if (src === 'blast') mul = weakness(el, e.elem) ? 3 : (e.elem === el ? 0.7 : 1.4);
    e.hp -= dmg * mul;
    e.flash = 0.08;
    const weak = weakness(el, e.elem);
    if (src === 'shot') {
      spark(e.x, e.y, weak ? elemRgb(el) : GOLD);
      hitStop(weak ? 0.042 : 0.032);
      audio.hit(G.combo, weak);
      kick(weak ? 2.2 : 1.6);
    }
    if (e.kind === 'boss' && src !== 'blast') {
      addScore(Math.round(SCORE.chip * G.mult * (weak ? 1.4 : 1)));
      audio.bossHit();
    }
    if (e.hp <= 0) killEnemy(e, src, el);
  }

  function killEnemy(e, src, shotElem) {
    if (!e.alive) return;
    e.alive = false;
    const el = shotElem || G.elem;
    const weak = weakness(el, e.elem);
    const rgb = e.kind === 'boss' ? GOLD : elemRgb(e.elem);
    explode(e.x, e.y, rgb, e.kind === 'boss' ? 46 : e.kind === 'mage' ? 22 : 14);
    let pts = e.score * G.mult;
    if (weak) pts *= 1.5;
    if (src === 'blast') pts *= 1.3;
    pts = Math.round(pts);
    addScore(pts);
    bumpCombo();
    floatText(e.x, e.y - 10, String(pts), rgb, e.kind === 'boss');
    if (weak) {
      floatText(e.x, e.y - 24, '克', GOLD, true);
      spawnShard(e.x, e.y, e.elem);
      spawnShard(e.x + rand(-8, 8), e.y + rand(-6, 6), e.elem);
    } else {
      spawnShard(e.x, e.y, e.elem);
    }
    const rad = src === 'blast' ? 72 : 48;
    cancelBullets(e.x, e.y, rad);
    if (e.kind === 'boss') {
      audio.bossDie();
      hitStop(0.08);
      kick(8.2, 'boss');
      screenFlash(GOLD, 0.72);
      burst(e.x, e.y, FIRE, 28, 260);
      burst(e.x, e.y, ICE, 28, 260);
      burst(e.x, e.y, WHT, 22, 220);
      ring(e.x, e.y, GOLD);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].kind === 'orb') G.enemies[i].alive = false;
      }
      for (let i = G.bullets.length - 1; i >= 0; i--) {
        spawnShard(G.bullets[i].x, G.bullets[i].y, G.bullets[i].elem);
        G.bullets.splice(i, 1);
      }
      G.winT = 1.4;
      toast('魔帝碎裂', false, true);
    } else if (e.kind === 'mage' || e.kind === 'orb' || e.kind === 'salam' || e.kind === 'yeti') {
      audio.explode();
      hitStop(0.05);
      kick(3.2);
    }
    syncHud();
  }

  function diePlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.charge = 0;
    G.chgHold = 0;
    G.chgReady = false;
    G.blasts.length = 0;
    breakCombo();
    explode(G.ship.x, G.ship.y, MAG, 36);
    explode(G.ship.x, G.ship.y, elemRgb(G.elem), 18);
    audio.death();
    hitStop(0.072);
    kick(7.5, 'die');
    screenFlash(MAG, 0.6);
    G.bullets.length = 0;
    syncPips();
    syncHud();
  }

  function respawn() {
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.invuln = 1.5;
    G.deadT = 0;
    G.charge = 0;
    G.chgHold = 0;
    G.chgReady = false;
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    G.charge = 0;
    audio.lose();
    showOverlay('lose', '炮毁了', '空格连射炎或冰，Shift 点按切元素、按住蓄魔炮。克制翻倍。分数 ' + G.score + '。');
    setHint('R 重开 · 克制翻倍，蓄满放魔炮', 'warn');
  }

  function goWin() {
    addScore(isElem() ? 10000 : 8000);
    G.mode = 'win';
    G.charge = 0;
    audio.win();
    showOverlay(
      'win',
      isElem() ? '元素通关' : '魔核尽碎',
      '三关打穿，魔帝已碎。分数 ' + G.score + (isElem() ? ' · 元素' : ' · 魔袭') + '。'
    );
    setHint('魔核已碎 · R 再来', 'hot');
    syncHud();
  }

  function clearWorld() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.shards.length = 0;
    G.blasts.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function nextStage() {
    addScore(Math.round(SCORE.stage * G.mult));
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.gapT = 0;
    const st = STAGES[G.stage - 1];
    toast((st ? st.name : '魔核'), false, true);
    audio.wave();
    screenFlash(st && st.tint === 'ice' ? ICE : GOLD, 0.22);
    syncHud();
  }

  function startGame(kind) {
    audio.start();
    hideOverlay();
    clearWorld();
    G.mode = 'play';
    G.kind = kind === 'elem' ? 'elem' : 'raid';
    G.t = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.next1up = LIFE_EVERY;
    G.elem = 'fire';
    G.charge = 0;
    G.chgHold = 0;
    G.chgReady = false;
    G.chgBuzz = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.winT = 0;
    G.gapT = 0;
    G.scroll = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    G.ship.vx = 0;
    G.ship.vy = 0;
    if (scoreEl) scoreEl.textContent = '0';
    toast(isElem() ? '元素' : '魔袭', isElem(), !isElem());
    audio.wave();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.t = 0;
    G.stage = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.elem = 'fire';
    G.charge = 0;
    G.chgHold = 0;
    G.deadT = 0;
    G.ship.x = VW * 0.5;
    G.ship.y = VH - 78;
    clearWorld();
    showOverlay('title', '魔炮', '纵向卷轴。空格连射炎或冰，Shift 点按切元素、按住蓄魔炮。克制翻倍。撞上掉命。短关之后是魔帝。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      p.vx *= Math.exp(-dt * 1.8);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.6;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.6;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.5);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < motes.length; i++) {
      const s = motes[i];
      s.y += scr * 0.42 * s.z * dt;
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
  }

  function updateShip(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = shipSpeed();
    let dx = 0;
    let dy = 0;
    if (keys.l) dx -= 1;
    if (keys.r) dx += 1;
    if (keys.u) dy -= 1;
    if (keys.d) dy += 1;
    if (dx || dy) {
      const len = hypot(dx, dy);
      dx /= len;
      dy /= len;
      G.ship.vx = dx * spd;
      G.ship.vy = dy * spd;
      inputSrc = 'key';
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 40, VW - 40);
      const ty = clamp(pointer.y, 40, VH - 28);
      G.ship.x = lerp(G.ship.x, tx, 1 - Math.exp(-dt * 16));
      G.ship.y = lerp(G.ship.y, ty, 1 - Math.exp(-dt * 16));
      G.ship.vx = 0;
      G.ship.vy = 0;
    } else {
      G.ship.vx *= Math.exp(-dt * 10);
      G.ship.vy *= Math.exp(-dt * 10);
    }
    G.ship.x += G.ship.vx * dt;
    G.ship.y += G.ship.vy * dt;
    G.ship.x = clamp(G.ship.x, 40, VW - 40);
    G.ship.y = clamp(G.ship.y, 40, VH - 28);
  }

  function updateFire(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (wantFire()) fireShot();
  }

  function updateCharge(dt) {
    if (G.mode !== 'play' || G.deadT > 0 || overlayOpen()) return;
    if (!charging()) return;
    G.chgHold += dt;
    if (G.chgHold <= TAP_MAX) return;
    G.charge = clamp(G.charge + dt / chargeTime(), 0, 1);
    if (G.charge >= 1 && !G.chgReady) {
      G.chgReady = true;
      toast('魔炮就绪', false, true);
      audio.ready();
      ring(G.ship.x, G.ship.y, elemRgb(G.elem));
      hitStop(0.036);
    }
    G.chgBuzz -= dt;
    if (G.chgBuzz <= 0) {
      G.chgBuzz = 0.1;
      audio.chargeHum(G.charge, G.elem);
    }
    if (!REDUCE && Math.random() < 0.35) {
      const rgb = elemRgb(G.elem);
      particles.push({
        x: G.ship.x + rand(-12, 12),
        y: G.ship.y + rand(-6, 10),
        vx: rand(-20, 20),
        vy: rand(-80, -20),
        g: -40,
        life: 0.32,
        r: rand(1.2, 2.4),
        rgb: rgb
      });
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -24 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = s.x - e.x;
        const dy = s.y - e.y;
        const rr = e.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, s.dmg, 'shot', s.elem);
          burst(s.x, s.y, elemRgb(s.elem), 5, 70);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function updateBlasts(dt) {
    for (let i = G.blasts.length - 1; i >= 0; i--) {
      const b = G.blasts[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.full) b.r = lerp(b.r, 22, 1 - Math.exp(-dt * 2));
      if (b.life <= 0 || b.y < -40) {
        if (b.full) {
          explode(b.x, Math.max(40, b.y), elemRgb(b.elem), 26);
          cancelBullets(b.x, b.y, 86);
        }
        G.blasts.splice(i, 1);
        continue;
      }
      for (let j = 0; j < G.enemies.length; j++) {
        const e = G.enemies[j];
        if (!e.alive) continue;
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const rr = e.r + b.r;
        if (dx * dx + dy * dy < rr * rr) {
          damageEnemy(e, b.dmg, 'blast', b.elem);
          explode(e.x, e.y, elemRgb(b.elem), b.full ? 22 : 12);
          if (b.full) cancelBullets(e.x, e.y, 56);
          b.pierce -= 1;
          if (b.pierce <= 0) {
            G.blasts.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  function updateBullets(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y > VH + 22 || b.y < -32 || b.x < -22 || b.x > VW + 22) {
        G.bullets.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = b.x - G.ship.x;
        const dy = b.y - (G.ship.y - 2);
        const rr = HIT_R + b.r * 0.55;
        if (dx * dx + dy * dy < rr * rr) {
          G.bullets.splice(i, 1);
          diePlayer();
        }
      }
    }
  }

  function updateShards(dt) {
    for (let i = G.shards.length - 1; i >= 0; i--) {
      const s = G.shards[i];
      s.t += dt;
      s.spin += dt * 5;
      const magnet = G.combo >= 2 ? 280 : 170;
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = G.ship.x - s.x;
        const dy = G.ship.y - s.y;
        const d = hypot(dx, dy);
        if (d < 18) {
          collectShard(s);
          G.shards.splice(i, 1);
          continue;
        }
        if (d < 96) {
          const k = magnet / Math.max(24, d);
          s.vx += (dx / d) * k * dt * 60;
          s.vy += (dy / d) * k * dt * 60;
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= Math.exp(-dt * 1.4);
      if (s.y > VH + 20 || s.t > 6) G.shards.splice(i, 1);
    }
  }

  function fireInterval(e) {
    const dense = isElem() ? 0.74 : 1;
    if (e.kind === 'imp' || e.kind === 'frost') return 1.45 * dense;
    if (e.kind === 'salam' || e.kind === 'yeti') return 1.02 * dense;
    if (e.kind === 'rune') return 0.92 * dense;
    if (e.kind === 'wisp') return 1.15 * dense;
    if (e.kind === 'mage') return 0.82 * dense;
    if (e.kind === 'orb') return 1.1 * dense;
    if (e.kind === 'boss') return 0.55 * dense;
    return 1.2 * dense;
  }

  function thinkEnemy(e, dt) {
    e.t += dt;
    e.fireCd -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.kind === 'imp' || e.kind === 'frost') {
      e.x = e.baseX + Math.sin(e.t * e.omega + e.phase) * e.amp * 0.35;
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20 && e.y < VH - 80) {
        aimedFire(e, 1, 0, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'dive') {
      if (e.t > 0.35) {
        const a = Math.atan2(G.ship.y - e.y, G.ship.x - e.x);
        e.vx = lerp(e.vx, Math.cos(a) * 210 * dens(), 1 - Math.exp(-dt * 3));
        e.vy = lerp(e.vy, Math.sin(a) * 240 * dens(), 1 - Math.exp(-dt * 3));
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    } else if (e.kind === 'salam' || e.kind === 'yeti') {
      e.x = e.baseX + Math.sin(e.t * 1.6 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 90 && e.vy > 28) e.vy = 28;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 16) {
        aimedFire(e, 3, 0.22, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'rune') {
      e.y += e.vy * dt;
      e.spin += dt * 1.6;
      if (e.y > 70 && e.vy > 16) e.vy = 16;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, isElem() ? 2 : 1, 0.16, bulletSpd() * 0.92);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'wisp') {
      e.x = e.baseX + Math.sin(e.t * 1.8 + e.phase) * e.amp * 0.55;
      e.y += e.vy * dt;
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20 && e.y < VH - 90) {
        ringFire(e, 5, bulletSpd() * 0.7, e.t, 'void');
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'mage') {
      e.x = e.baseX + Math.sin(e.t * 1.35 + e.phase) * e.amp;
      e.y += e.vy * dt;
      if (e.y > 110 && e.vy > 22) e.vy = 22;
      if ((e.t | 0) % 4 === 2) e.elem = 'ice';
      else if ((e.t | 0) % 4 === 0) e.elem = 'fire';
      if (G.mode === 'play' && e.fireCd <= 0 && e.y > 20) {
        aimedFire(e, 5, 0.18, bulletSpd());
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'orb') {
      const b = findBoss();
      const cx = b ? b.x : VW * 0.5;
      const cy = b ? b.y : 110;
      e.ang += dt * 1.45;
      e.x = cx + Math.cos(e.ang) * e.rad;
      e.y = cy + Math.sin(e.ang) * e.rad * 0.55;
      if (G.mode === 'play' && e.fireCd <= 0) {
        aimedFire(e, 1, 0, bulletSpd() * 0.9);
        e.fireCd = fireInterval(e);
      }
    } else if (e.kind === 'boss') {
      if (e.enter > 0) {
        e.enter -= dt;
        e.y = lerp(e.y, 118, 1 - Math.exp(-dt * 3.2));
      } else {
        e.x = VW * 0.5 + Math.sin(e.t * 0.7) * 96;
        e.y = 118 + Math.sin(e.t * 1.1) * 10;
      }
      const flipT = isElem() ? 2.15 : 2.8;
      e.elem = (Math.floor(e.t / flipT) % 2 === 0) ? 'fire' : 'ice';
      e.spin += dt * (e.hp / e.maxHp > 0.33 ? 1.4 : 2.4);
      if (G.mode !== 'play' || e.enter > 0 || e.fireCd > 0) return;
      const ratio = e.hp / e.maxHp;
      const spd = bulletSpd();
      if (ratio > 0.66) {
        aimedFire(e, 5, 0.2, spd);
        if (Math.random() < 0.45) ringFire(e, 8, spd * 0.72, e.spin, e.elem);
        e.fireCd = 1.15 * (isElem() ? 0.78 : 1);
      } else if (ratio > 0.33) {
        ringFire(e, 10, spd * 0.8, e.spin, e.elem);
        if ((e.pattern++ % 3) === 0) aimedFire(e, 3, 0.18, spd);
        e.fireCd = 0.52 * (isElem() ? 0.78 : 1);
      } else {
        ringFire(e, 10, spd * 0.78, e.spin, 'fire');
        ringFire(e, 8, spd * 0.58, -e.spin * 0.7, 'ice');
        aimedFire(e, 3, 0.16, spd * 1.05);
        if ((e.pattern++ % 4) === 0) {
          spawnSmall('fire', e.x - 40, e.y + 20, -30, 110);
          spawnSmall('ice', e.x + 40, e.y + 20, 30, 110);
        }
        e.fireCd = 0.42 * (isElem() ? 0.78 : 1);
      }
    }
  }

  function updateEnemies(dt) {
    const canHurt = G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (!e.alive) {
        G.enemies.splice(i, 1);
        continue;
      }
      thinkEnemy(e, dt);
      if (e.y > VH + 40 || e.x < -50 || e.x > VW + 50) {
        if (e.kind !== 'boss' && e.kind !== 'orb') {
          e.alive = false;
          G.enemies.splice(i, 1);
        }
        continue;
      }
      if (canHurt) {
        const dx = e.x - G.ship.x;
        const dy = e.y - G.ship.y;
        const rr = (e.kind === 'boss' ? e.r * 0.62 : e.r * 0.7) + HIT_R;
        if (dx * dx + dy * dy < rr * rr) diePlayer();
      }
    }
  }

  function updateWaves(dt) {
    if (hasBoss()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
    if (G.waveI >= st.waves.length && !hasBoss() && living() === 0) {
      G.gapT += dt;
      if (G.gapT >= 1.55) {
        G.gapT = 0;
        if (G.stage < 3) nextStage();
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.ship.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.ship.y = VH - 96;
      G.elem = (Math.floor(G.t / 2.4) % 2 === 0) ? 'fire' : 'ice';
      if (living() < 6 && (G.t * 2 | 0) !== ((G.t - dt) * 2 | 0) && Math.random() < 0.45) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 50, G.elem);
      }
      updateEnemies(dt);
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      updateWorld(dt * 0.5);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateBlasts(dt);
      updateBullets(dt);
      updateShards(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.winT > 0) {
      G.winT -= dt;
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateBlasts(dt);
      updateShards(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    if (!hasBoss()) G.stageT += dt;
    updateShip(dt);
    updateFire(dt);
    updateCharge(dt);
    updateShots(dt);
    updateBlasts(dt);
    updateEnemies(dt);
    updateBullets(dt);
    updateShards(dt);
    updateWaves(dt);
    updateWorld(dt);
    syncHud();
  }

  function pathDiamond(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (rot || 0) + i * (Math.PI * 0.5) - Math.PI / 2;
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function pathRune(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (rot || 0) + i * (TAU / 6);
      const px = sx(x + Math.cos(a) * r);
      const py = sy(y + Math.sin(a) * r);
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function stageTint() {
    const st = STAGES[G.stage - 1];
    if (hasBoss() || (st && st.tint === 'mix')) return 'mix';
    if (st && st.tint === 'ice') return 'ice';
    return 'fire';
  }

  function drawBg() {
    const c = ctx;
    const tint = stageTint();
    c.fillStyle = '#0c0604';
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    const g = c.createRadialGradient(sx(VW * 0.5), sy(90), 10 * scale, sx(VW * 0.5), sy(VH * 0.4), 380 * scale);
    if (tint === 'ice') {
      g.addColorStop(0, 'rgba(77,232,255,0.09)');
      g.addColorStop(1, 'rgba(12,6,4,0)');
    } else if (tint === 'mix') {
      g.addColorStop(0, 'rgba(255,154,50,0.08)');
      g.addColorStop(1, 'rgba(12,6,4,0)');
    } else {
      g.addColorStop(0, 'rgba(255,106,24,0.1)');
      g.addColorStop(1, 'rgba(12,6,4,0)');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const yOff = (G.scroll * 0.38) % 56;
    c.strokeStyle = tint === 'ice' ? 'rgba(77,232,255,0.07)' : 'rgba(255,106,24,0.07)';
    c.lineWidth = Math.max(0.6, 0.7 * scale);
    for (let row = -2; row < 16; row++) {
      const y = row * 56 - yOff;
      c.beginPath();
      c.arc(sx(VW * 0.5), sy(y), 42 * scale, 0, TAU);
      c.stroke();
      pathRune(c, 80, y + 18, 16, G.t * 0.2);
      c.stroke();
      pathRune(c, VW - 80, y + 8, 16, -G.t * 0.2);
      c.stroke();
    }

    c.fillStyle = tint === 'ice' ? 'rgba(10,18,28,0.55)' : 'rgba(28,12,6,0.55)';
    c.fillRect(sx(0), sy(0), 34 * scale, VH * scale);
    c.fillRect(sx(VW - 34), sy(0), 34 * scale, VH * scale);
    const wallOff = (G.scroll * 0.72) % 36;
    for (let i = -1; i < 24; i++) {
      const y = i * 36 - wallOff;
      c.fillStyle = tint === 'ice' ? 'rgba(77,232,255,0.1)' : 'rgba(255,106,24,0.1)';
      pathDiamond(c, 16, y, 12, 0);
      c.fill();
      pathDiamond(c, VW - 16, y + 18, 12, 0);
      c.fill();
      c.strokeStyle = tint === 'ice' ? 'rgba(77,232,255,0.28)' : 'rgba(255,154,50,0.28)';
      c.lineWidth = Math.max(0.8, scale);
      pathDiamond(c, 16, y, 12, 0);
      c.stroke();
      pathDiamond(c, VW - 16, y + 18, 12, 0);
      c.stroke();
    }

    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < motes.length; i++) {
      const p = motes[i];
      const ice = tint === 'fire' ? false : tint === 'ice' ? true : p.ice;
      c.fillStyle = rgba(ice ? ICE : FIRE, p.a * 0.5);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.s * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawEnemy(e) {
    const c = ctx;
    const flash = e.flash > 0;
    const rgb = flash ? WHT : elemRgb(e.elem);
    const hot = elemHot(e.elem);
    if (e.kind === 'rune') {
      c.fillStyle = rgba(DEEP, 0.92);
      pathRune(c, e.x, e.y, e.r + 2, e.spin);
      c.fill();
      c.strokeStyle = rgba(rgb, 0.9);
      c.lineWidth = Math.max(1, 1.3 * scale);
      pathRune(c, e.x, e.y, e.r + 2, e.spin);
      c.stroke();
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y), 3.8 * scale, 0, TAU);
      c.fill();
      return;
    }
    if (e.kind === 'boss') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(rgb, 0.16);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 52 * scale, 38 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(DEEP, 0.95);
      pathDiamond(c, e.x, e.y, e.r + 6, 0);
      c.fill();
      c.strokeStyle = rgba(rgb, 0.95);
      c.lineWidth = Math.max(1.4, 1.8 * scale);
      pathDiamond(c, e.x, e.y, e.r + 6, 0);
      c.stroke();
      c.fillStyle = rgba(FIRE, 0.9);
      c.beginPath();
      c.arc(sx(e.x - 14), sy(e.y - 2), 8 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(ICE, 0.9);
      c.beginPath();
      c.arc(sx(e.x + 14), sy(e.y - 2), 8 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(flash ? WHT : rgb, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 6), 9 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 6), 3.2 * scale, 0, TAU);
      c.fill();
      const ratio = clamp(e.hp / e.maxHp, 0, 1);
      c.fillStyle = 'rgba(0,0,0,0.45)';
      c.fillRect(sx(e.x - 36), sy(e.y - e.r - 16), 72 * scale, 5 * scale);
      c.fillStyle = rgba(ratio < 0.33 ? MAG : rgb, 0.95);
      c.fillRect(sx(e.x - 36), sy(e.y - e.r - 16), 72 * ratio * scale, 5 * scale);
      return;
    }
    if (e.kind === 'mage') {
      c.fillStyle = rgba(DEEP, 0.9);
      pathDiamond(c, e.x, e.y + 2, e.r, 0);
      c.fill();
      c.fillStyle = rgba(rgb, 0.95);
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y - 18));
      c.lineTo(sx(e.x + 8), sy(e.y - 4));
      c.lineTo(sx(e.x - 8), sy(e.y - 4));
      c.closePath();
      c.fill();
      c.fillStyle = rgba(hot, 0.95);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + 4), 5 * scale, 0, TAU);
      c.fill();
      return;
    }
    if (e.kind === 'wisp') {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(VOID, 0.22);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 16 * scale, 11 * scale, 0, 0, TAU);
      c.fill();
      c.restore();
      c.fillStyle = rgba(flash ? WHT : VOID, 0.9);
      c.beginPath();
      c.ellipse(sx(e.x), sy(e.y), 9 * scale, 12 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y - 2), 2.4 * scale, 0, TAU);
      c.fill();
      return;
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(rgb, 0.18);
    c.beginPath();
    c.ellipse(sx(e.x), sy(e.y), (e.r + 6) * scale, (e.r + 2) * scale, 0, 0, TAU);
    c.fill();
    c.restore();
    if (e.elem === 'ice') {
      c.fillStyle = rgba(flash ? WHT : ICE, 0.95);
      pathDiamond(c, e.x, e.y, e.r, e.t);
      c.fill();
      c.strokeStyle = rgba(FRO, 0.85);
      c.lineWidth = Math.max(0.8, scale);
      pathDiamond(c, e.x, e.y, e.r, e.t);
      c.stroke();
    } else {
      c.fillStyle = rgba(flash ? WHT : rgb, 0.95);
      c.beginPath();
      c.moveTo(sx(e.x), sy(e.y - e.r));
      c.quadraticCurveTo(sx(e.x + e.r), sy(e.y), sx(e.x), sy(e.y + e.r * 0.85));
      c.quadraticCurveTo(sx(e.x - e.r), sy(e.y), sx(e.x), sy(e.y - e.r));
      c.fill();
    }
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.arc(sx(e.x), sy(e.y - 2), 2.2 * scale, 0, TAU);
    c.fill();
    if (e.kind === 'salam' || e.kind === 'yeti' || e.kind === 'orb') {
      c.fillStyle = rgba(hot, 0.85);
      c.beginPath();
      c.arc(sx(e.x), sy(e.y + e.r - 3), 3.2 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawShots() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const rgb = elemRgb(s.elem);
      if (s.elem === 'ice') {
        c.fillStyle = rgba(ICE, 0.95);
        pathDiamond(c, s.x, s.y, 4.4, G.t * 8);
        c.fill();
      } else {
        c.fillStyle = rgba(FIRE, 0.95);
        c.beginPath();
        c.ellipse(sx(s.x), sy(s.y), 3.2 * scale, 6.2 * scale, 0, 0, TAU);
        c.fill();
      }
      c.fillStyle = rgba(WHT, 0.9);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), 1.5 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(rgb, 0.35);
        c.lineWidth = 1.4 * scale;
        c.beginPath();
        c.moveTo(sx(s.x), sy(s.y));
        c.lineTo(sx(s.x - s.vx * 0.018), sy(s.y - s.vy * 0.018));
        c.stroke();
      }
    }
    for (let i = 0; i < G.blasts.length; i++) {
      const b = G.blasts[i];
      const rgb = elemRgb(b.elem);
      c.fillStyle = rgba(rgb, 0.22);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), (b.r + 10) * scale, 0, TAU);
      c.fill();
      if (b.elem === 'ice') {
        c.fillStyle = rgba(ICE, 0.95);
        pathDiamond(c, b.x, b.y, b.r, G.t * 4);
        c.fill();
        c.strokeStyle = rgba(WHT, 0.8);
        c.lineWidth = Math.max(1.2, 1.6 * scale);
        pathDiamond(c, b.x, b.y, b.r, G.t * 4);
        c.stroke();
      } else {
        c.fillStyle = rgba(FIRE, 0.95);
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
        c.fill();
        c.fillStyle = rgba(GOLD, 0.9);
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), b.r * 0.45 * scale, 0, TAU);
        c.fill();
      }
      if (b.full && !REDUCE) {
        c.strokeStyle = rgba(WHT, 0.45);
        c.lineWidth = 1.4 * scale;
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), (b.r + 8 + Math.sin(G.t * 16) * 3) * scale, 0, TAU);
        c.stroke();
      }
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      const rgb = elemRgb(b.elem);
      c.fillStyle = rgba(rgb, 0.92);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.95);
      c.beginPath();
      c.arc(sx(b.x), sy(b.y), b.r * 0.42 * scale, 0, TAU);
      c.fill();
      if (!REDUCE) {
        c.strokeStyle = rgba(rgb, 0.28);
        c.lineWidth = 1;
        c.beginPath();
        c.arc(sx(b.x), sy(b.y), (b.r + 3.2) * scale, 0, TAU);
        c.stroke();
      }
    }
    for (let i = 0; i < G.shards.length; i++) {
      const s = G.shards[i];
      const rgb = elemRgb(s.elem);
      c.fillStyle = rgba(rgb, 0.95);
      pathDiamond(c, s.x, s.y, 5.2, s.spin);
      c.fill();
      c.fillStyle = rgba(GOLD, 0.85);
      pathDiamond(c, s.x, s.y, 2.2, s.spin + 0.4);
      c.fill();
    }
    c.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.ship.x;
    const y = G.ship.y;
    const c = ctx;
    const rgb = elemRgb(G.elem);
    const chg = charging() && G.chgHold > TAP_MAX ? G.charge : 0;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgba(rgb, 0.18 + (G.muzzle > 0 ? 0.18 : 0) + chg * 0.22);
    c.beginPath();
    c.ellipse(sx(x), sy(y), (16 + chg * 10) * scale, (12 + chg * 6) * scale, 0, 0, TAU);
    c.fill();
    if (chg > 0) {
      c.strokeStyle = rgba(rgb, 0.35 + chg * 0.4);
      c.lineWidth = (1.2 + chg * 1.6) * scale;
      c.beginPath();
      c.arc(sx(x), sy(y), (14 + chg * 16 + Math.sin(G.t * 10) * 2) * scale, 0, TAU);
      c.stroke();
    }
    c.fillStyle = rgba(rgb, 0.5);
    c.beginPath();
    c.moveTo(sx(x - 5), sy(y + 8));
    c.lineTo(sx(x), sy(y + 18 + Math.sin(G.t * 28) * 2));
    c.lineTo(sx(x + 5), sy(y + 8));
    c.fill();
    c.restore();

    c.fillStyle = rgba(FIRE, 0.85);
    c.beginPath();
    c.moveTo(sx(x - 16), sy(y + 2));
    c.lineTo(sx(x - 7), sy(y - 2));
    c.lineTo(sx(x - 8), sy(y + 8));
    c.closePath();
    c.fill();
    c.fillStyle = rgba(ICE, 0.85);
    c.beginPath();
    c.moveTo(sx(x + 16), sy(y + 2));
    c.lineTo(sx(x + 7), sy(y - 2));
    c.lineTo(sx(x + 8), sy(y + 8));
    c.closePath();
    c.fill();

    c.fillStyle = rgba(DEEP, 0.95);
    pathDiamond(c, x, y + 2, 13, 0);
    c.fill();
    c.strokeStyle = rgba(rgb, 0.95);
    c.lineWidth = Math.max(1.1, 1.4 * scale);
    pathDiamond(c, x, y + 2, 13, 0);
    c.stroke();

    c.fillStyle = rgba(rgb, 0.96);
    c.beginPath();
    c.moveTo(sx(x), sy(y - 20));
    c.lineTo(sx(x + 6), sy(y - 6));
    c.lineTo(sx(x - 6), sy(y - 6));
    c.closePath();
    c.fill();

    c.fillStyle = rgba(WHT, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y - 1), 3.1 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(rgb, 0.95);
    c.beginPath();
    c.arc(sx(x), sy(y - 1), 1.6 * scale, 0, TAU);
    c.fill();

    if (G.muzzle > 0) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = rgba(WHT, clamp(G.muzzle * 12, 0, 1));
      c.beginPath();
      c.arc(sx(x), sy(y - 18), 5 * scale, 0, TAU);
      c.fill();
      c.restore();
    }
  }

  function drawFx() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / 0.4, 0, 1);
      c.fillStyle = rgba(q.rgb, a);
      c.beginPath();
      c.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      c.strokeStyle = rgba(s.rgb, a);
      c.lineWidth = 1.4 * scale;
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), (6 + s.t * 42) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t;
      c.strokeStyle = rgba(r.rgb, a * 0.8);
      c.lineWidth = 2 * scale;
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    c.font = (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    c.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.fillStyle = rgba(f.rgb, a);
      c.font = ((f.gold ? 13 : 11) * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#140806';
    if (oy > 0) {
      ctx.fillRect(0, 0, W, oy);
      ctx.fillRect(0, oy + VH * scale, W, H);
    }
    if (ox > 0) {
      ctx.fillRect(0, 0, ox, H);
      ctx.fillRect(ox + VW * scale, 0, W, H);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#140806';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
    }
    drawShots();
    drawShip();
    drawFx();
    drawFlash();
    ctx.restore();
    drawLetterbox();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const r = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pointerWorldX(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    return (x - ox) / scale;
  }
  function pointerWorldY(e) {
    const r = canvas.getBoundingClientRect();
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return (y - oy) / scale;
  }

  function isChgKey(k, code) {
    return k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ';
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('raid');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (space) {
      keys.sht = down;
      if (down) {
        inputSrc = 'key';
        e.preventDefault();
      }
    }
    if (isChgKey(k, e.code)) {
      if (down) {
        if (!keys.chgKey) {
          keys.chgKey = true;
          if (!keys.chgBtn) G.chgHold = 0;
        }
        e.preventDefault();
      } else {
        keys.chgKey = false;
        tryReleaseCharge();
      }
    }
    if (k === 'ArrowUp' || k === 'ArrowDown') {
      if (down) e.preventDefault();
    }
    if (!down) return;
    if (e.repeat && (space || k === 'r' || k === 'R' || isChgKey(k, e.code))) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (space) {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      return;
    }
    if (k === 'Enter') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      audio.ensure();
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      audio.ensure();
      startGame('elem');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (e.button === 2) return;
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
      inputSrc = 'ptr';
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 18, VW - 18);
      pointer.y = clamp(pointerWorldY(e), 48, VH - 22);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
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

  function bindChargeBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (!keys.chgBtn) {
        keys.chgBtn = true;
        if (!keys.chgKey) G.chgHold = 0;
      }
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    function up() {
      if (!keys.chgBtn) return;
      keys.chgBtn = false;
      tryReleaseCharge();
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', function (e) {
      if (e.buttons) return;
      up();
    });
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

  seedMotes();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindChargeBtn(btnChg);
  bindChargeBtn(btnPad);

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnElem) {
    btnElem.addEventListener('click', function () {
      audio.ensure();
      startGame('elem');
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
      keys.sht = false;
      keys.chgKey = false;
      keys.chgBtn = false;
      G.chgHold = 0;
    }
  });

  requestAnimationFrame(frame);
})();
