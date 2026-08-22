'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const LOOP_DUR = 0.82;
  const COMBO_WIN = 1.4;
  const BEST_KEY = 'playbox-sky-1942-best';
  const MUTE_KEY = 'playbox-sky-1942-mute';
  const OPS = '方向 / WASD 移动 · 空格开火 · Shift / Z 回旋 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 180, 255];
  const SKY = [58, 208, 255];
  const GOLD = [255, 227, 107];
  const ORG = [255, 140, 64];
  const RED = [255, 72, 96];
  const WHT = [246, 248, 255];
  const PNK = [255, 154, 212];
  const FOAM = [180, 230, 255];

  const STAGES = [
    {
      name: '第 1 关',
      boss: '重爆机',
      hp: 88,
      waves: [
        { t: 1.0, kind: 'v', n: 5 },
        { t: 4.4, kind: 'stream', dir: 1 },
        { t: 7.6, kind: 'v', n: 7 },
        { t: 11.2, kind: 'bomber' },
        { t: 14.0, kind: 'dive', n: 4 },
        { t: 17.4, kind: 'v', n: 9 },
        { t: 21.0, kind: 'carrier' },
        { t: 24.2, kind: 'v', n: 5 },
        { t: 27.5, kind: 'bomber' },
        { t: 30.8, kind: 'stream', dir: -1 },
        { t: 34.0, kind: 'v', n: 7 },
        { t: 37.5, kind: 'big' },
        { t: 41.2, kind: 'v', n: 9 },
        { t: 47.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关',
      boss: '空中堡垒',
      hp: 132,
      waves: [
        { t: 0.8, kind: 'v', n: 7 },
        { t: 3.6, kind: 'dive', n: 5 },
        { t: 6.4, kind: 'stream', dir: -1 },
        { t: 9.0, kind: 'v', n: 9 },
        { t: 12.0, kind: 'bomber' },
        { t: 14.2, kind: 'bomber' },
        { t: 17.0, kind: 'v', n: 11 },
        { t: 20.4, kind: 'carrier' },
        { t: 23.0, kind: 'dive', n: 6 },
        { t: 26.0, kind: 'big' },
        { t: 29.2, kind: 'v', n: 9 },
        { t: 32.6, kind: 'stream', dir: 1 },
        { t: 35.8, kind: 'v', n: 7 },
        { t: 39.0, kind: 'bomber' },
        { t: 42.4, kind: 'big' },
        { t: 48.5, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关',
      boss: '大本营',
      hp: 186,
      waves: [
        { t: 0.6, kind: 'v', n: 9 },
        { t: 3.2, kind: 'stream', dir: 1 },
        { t: 5.2, kind: 'stream', dir: -1 },
        { t: 8.0, kind: 'dive', n: 6 },
        { t: 10.6, kind: 'v', n: 11 },
        { t: 13.4, kind: 'bomber' },
        { t: 15.2, kind: 'carrier' },
        { t: 17.8, kind: 'big' },
        { t: 20.6, kind: 'v', n: 9 },
        { t: 23.4, kind: 'dive', n: 7 },
        { t: 26.2, kind: 'v', n: 13 },
        { t: 29.4, kind: 'bomber' },
        { t: 31.4, kind: 'bomber' },
        { t: 34.0, kind: 'big' },
        { t: 37.2, kind: 'v', n: 11 },
        { t: 40.6, kind: 'carrier' },
        { t: 44.0, kind: 'dive', n: 8 },
        { t: 50.0, kind: 'boss' }
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
  const btnRaid = document.getElementById('btn-raid');
  const btnChaos = document.getElementById('btn-chaos');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnLoop = document.getElementById('btn-loop');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const loopLabel = document.getElementById('loop-label');
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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: VW * 0.5, y: VH - 90, vx: 0, vy: 0 },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    power: 0,
    loops: 3,
    loopT: 0,
    loopFlash: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    islands: [],
    clouds: [],
    ghosts: [],
    fireCd: 0,
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
    spawnT: 0.8,
    nextBoss: 70,
    bossN: 0,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    nextIsland: 40,
    demoCd: 0,
    why: ''
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
  function isChaos() {
    return G.kind === 'chaos';
  }
  function maxLoops() {
    return isChaos() ? 2 : 3;
  }
  function scrollSpd() {
    const base = isChaos() ? 98 : 74;
    const rush = G.combo >= 8 ? 18 : G.combo >= 4 ? 10 : 0;
    return base + rush + (G.stage - 1) * 8;
  }
  function plySpd() {
    return 268 + G.power * 16;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
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
      const lift = 1 + Math.min(0.35, G.power * 0.08);
      this.beep(640 * lift, 0.055, 'square', 0.032, 1480 * lift);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.036, 1100);
      this.beep(520 * lift, 0.07, 'square', 0.046, 880 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.16 : 0.08, big ? 0.07 : 0.045, big ? 280 : 500);
      this.beep(big ? 180 : 280, big ? 0.22 : 0.12, 'sawtooth', 0.05, 60);
    },
    loop() {
      this.ensure();
      this.noise(0.16, 0.05, 400);
      this.beep(220, 0.28, 'sawtooth', 0.055, 920);
      this.beep(880, 0.18, 'sine', 0.04, 220);
    },
    pow() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    miss() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.025, 80);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.055, 350);
      this.beep(300, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.3, 'sine', 0.045, 46);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(196, 0.16, 'sawtooth', 0.05, 110);
      this.beep(147, 0.28, 'square', 0.04, 80);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
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
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
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
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      toast('1UP', false, true);
      audio.oneup();
      syncPips();
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
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1350);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const el = document.createElement('span');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > n) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', i >= G.lives && G.mode !== 'title');
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (isChaos()) stageLabel.textContent = '乱战 ' + Math.max(1, 1 + (G.clock / 20 | 0));
      else stageLabel.textContent = STAGES[G.stage - 1] ? STAGES[G.stage - 1].name : '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.stage >= 3 || (isChaos() && G.clock > 60));
    }
    if (tagLabel) {
      tagLabel.textContent = isChaos() ? '乱战' : '远征';
      tagLabel.classList.toggle('warn', isChaos());
      tagLabel.classList.toggle('hot', !isChaos() && G.stage >= 3);
    }
    if (loopLabel) {
      loopLabel.textContent = '回旋 ×' + G.loops;
      loopLabel.classList.toggle('empty', G.loops <= 0);
    }
    if (btnLoop) {
      btnLoop.disabled = G.mode === 'play' && G.loops <= 0 && G.loopT <= 0;
    }
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或撞机扣一命', 'warn');
    else if (G.mode === 'win') setHint('航线肃清 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 回旋躲弹', 'warn');
    else setHint('方向移动 · 空格开火 · Shift 回旋 · 吃 POW', '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showSecond) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : '1942';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnRaid.textContent = primary;
    if (btnChaos) {
      btnChaos.classList.toggle('hidden', !showSecond);
      if (kind === 'title') btnChaos.textContent = '乱战';
      else if (kind === 'lose') btnChaos.textContent = '换模式';
      else btnChaos.textContent = '乱战';
    }
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

  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
      }
    }, 360);
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
        g: spec.g == null ? 520 : spec.g
      });
    }
    capArr(particles, 320);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 40);
    capArr(rings, 24);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.9 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -86 : -70
    });
    capArr(floats, 28);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -190 * p, vx1: 190 * p, vy0: -240 * p, vy1: 100 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.6 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.18 + p * 0.14);
    kick(2.2 + p * 2.6);
  }

  function seedClouds() {
    G.clouds.length = 0;
    for (let i = 0; i < 7; i++) {
      G.clouds.push({
        x: rand(30, VW - 30),
        y: rand(-40, VH),
        r: rand(28, 64),
        a: rand(0.06, 0.14),
        v: rand(22, 48)
      });
    }
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
        const tok = comboTok;
        setTimeout(function () {
          if (tok === comboTok && comboEl) comboEl.classList.remove('hot');
        }, 280);
      }
    }
    G.mult = next;
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function spawnEnt(spec) {
    if (G.ents.length > 48) return null;
    const en = {
      type: spec.type,
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy || 0,
      hp: spec.hp,
      maxHp: spec.hp,
      r: spec.r,
      t: 0,
      fireCd: spec.fireCd != null ? spec.fireCd : rand(0.3, 1.1),
      score: spec.score,
      drop: !!spec.drop,
      rgb: spec.rgb,
      ang: spec.ang || 0,
      flash: 0,
      ramT: 0,
      ground: !!spec.ground,
      dive: !!spec.dive,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2
    };
    G.ents.push(en);
    return en;
  }

  function spawnFighter(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'fighter',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 92,
      hp: 1, r: 11, score: 50,
      rgb: extra.rgb || MAG,
      dive: extra.dive,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.8, 2.2)
    });
  }

  function spawnV(n, xmid) {
    n = n || 7;
    xmid = xmid == null ? VW * 0.5 + rand(-40, 40) : xmid;
    const gapX = 26;
    const gapY = 20;
    const y0 = -24;
    spawnFighter(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnFighter(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnFighter(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 40 : VW - 40;
    const n = 6 + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnFighter(side + rand(-8, 8), -20 - i * 26, {
        vx: dir * -70,
        vy: 118,
        rgb: PNK
      });
    }
  }

  function spawnDive(n) {
    n = n || 4;
    for (let i = 0; i < n; i++) {
      const x = 50 + (i + 0.5) * ((VW - 100) / n) + rand(-18, 18);
      spawnEnt({
        type: 'scout',
        x: x, y: -30 - i * 18,
        vx: 0, vy: 70,
        hp: 1, r: 10, score: 80,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnBomber(x) {
    spawnEnt({
      type: 'bomber',
      x: x == null ? rand(80, VW - 80) : x,
      y: -36,
      vx: rand(-20, 20),
      vy: 54,
      hp: 4, r: 18, score: 200,
      rgb: RED,
      drop: Math.random() < 0.28,
      w: 36, h: 22,
      fireCd: rand(0.4, 0.9)
    });
  }

  function spawnCarrier() {
    spawnEnt({
      type: 'carrier',
      x: Math.random() < 0.5 ? 50 : VW - 50,
      y: -24,
      vx: 0, vy: 80,
      hp: 2, r: 13, score: 300,
      rgb: GOLD,
      drop: true,
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnBig() {
    spawnEnt({
      type: 'big',
      x: VW * 0.5 + rand(-60, 60),
      y: -50,
      vx: 36, vy: 38,
      hp: 14, r: 28, score: 800,
      rgb: ORG,
      drop: true,
      w: 56, h: 30,
      fireCd: 0.5
    });
  }

  function spawnTurret(x, y) {
    spawnEnt({
      type: 'turret',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 3, r: 12, score: 150,
      rgb: GOLD,
      ground: true,
      w: 22, h: 18,
      fireCd: rand(0.5, 1.4)
    });
  }

  function spawnIsland() {
    const x = rand(50, VW - 50);
    const r = rand(26, 54);
    G.islands.push({ x: x, y: -r - 10, r: r, t: 0 });
    if (hash2((G.scroll * 10) | 0) > (isChaos() ? 0.32 : 0.42)) {
      spawnTurret(x + rand(-r * 0.3, r * 0.3), -r - 10);
    }
  }

  function spawnBoss() {
    if (hasBoss()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    let hp = st.hp;
    let name = st.boss;
    if (isChaos()) {
      G.bossN += 1;
      hp = 90 + G.bossN * 36;
      name = '乱战机列';
    }
    spawnEnt({
      type: 'boss',
      x: VW * 0.5,
      y: -70,
      vx: 70,
      vy: 48,
      hp: hp,
      r: 42,
      score: 4000 + G.stage * 1500,
      rgb: MAG,
      drop: true,
      w: 96,
      h: 44,
      fireCd: 0.6,
      phase: 0
    });
    toast(name, false, true);
    audio.boss();
    screenFlash(MAG, 0.4);
    kick(5);
  }

  function hasBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss') return true;
    }
    return false;
  }

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'bomber') spawnBomber();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'big') spawnBig();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y) {
    G.pows.push({ x: x, y: y, vy: 70, t: 0, vx: rand(-30, 30) });
    capArr(G.pows, 6);
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length > 90) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: r || 3.1,
      rgb: rgb || MAG
    });
  }

  function aimShot(x, y, spd, rgb) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = hypot(dx, dy) || 1;
    eShot(x, y, dx / len * spd, dy / len * spd, rgb);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.loopT > 0) return;
    if (G.fireCd > 0) return;
    const p = G.power;
    const cds = [0.128, 0.108, 0.09, 0.076, 0.062];
    G.fireCd = cds[p] || 0.1;
    G.muzzle = 0.055;
    const x = G.player.x;
    const y = G.player.y - 14;
    const spd = -660;
    function shot(ox, oy, vx, vy) {
      if (G.shots.length > 30) return;
      G.shots.push({
        x: x + ox, y: y + oy,
        vx: vx || 0, vy: vy == null ? spd : vy,
        r: 3.1, rgb: p >= 3 ? GOLD : CYN
      });
    }
    if (p <= 0) {
      shot(-6, 0);
      shot(6, 0);
    } else if (p === 1) {
      shot(-9, 2);
      shot(0, -3);
      shot(9, 2);
    } else if (p === 2) {
      shot(-12, 4, -80, spd);
      shot(-5, 0);
      shot(0, -3);
      shot(5, 0);
      shot(12, 4, 80, spd);
    } else if (p === 3) {
      shot(-10, 0);
      shot(-4, -3);
      shot(4, -3);
      shot(10, 0);
      shot(-18, 6, -90, spd);
      shot(18, 6, 90, spd);
    } else {
      shot(-12, 0);
      shot(-6, -2);
      shot(0, -4);
      shot(6, -2);
      shot(12, 0);
      shot(-20, 6, -100, spd);
      shot(20, 6, 100, spd);
    }
    audio.shoot();
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -120, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2, rgb: CYN, g: 0
    });
  }

  function hurtEnt(en, dmg, hx, hy) {
    if (en.hp <= 0) return;
    en.hp -= dmg || 1;
    en.flash = 0.08;
    if (en.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -80, vx1: 80, vy0: -90, vy1: 40,
        life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
      });
      if (en.type === 'boss' || en.type === 'big') hitStop(0.028);
      return;
    }
    killEnt(en);
  }

  function killEnt(en) {
    if (en.hp < -90) return;
    en.hp = -99;
    bumpCombo();
    const pwr = en.type === 'boss' ? 2.6 : en.type === 'big' ? 1.8 : en.type === 'bomber' ? 1.2 : 0.85;
    juice(en.x, en.y, en.rgb, pwr);
    audio.hit(G.combo);
    if (en.type === 'boss' || en.type === 'big') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.032 + G.combo * 0.0025, 0.032, 0.068));
    if (en.drop || (en.type === 'bomber' && Math.random() < 0.22) || en.type === 'boss') {
      spawnPow(en.x, en.y);
    }
    if (en.type === 'boss') {
      G.stageClearT = 2.15;
      addScore(1500 * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
    }
  }

  function pickPow(p) {
    if (G.power < 4) {
      G.power += 1;
      toast(G.power >= 4 ? '火力 MAX' : '火力 +' + G.power, false, true);
    } else if (G.loops < 5) {
      G.loops += 1;
      toast('回旋 +1', false, true);
    } else {
      addScore(800 * G.mult);
      toast('+800', false, true);
    }
    juice(p.x, p.y, GOLD, 1.1);
    audio.pow();
    hitStop(0.03);
    floatText(p.x, p.y, 'POW', GOLD, true);
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.loopT = 0;
    breakCombo();
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.4);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.power > 0) {
      G.power -= 1;
      spawnPow(G.player.x, G.player.y - 18);
    }
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.5;
    G.loops = maxLoops();
    G.loopT = 0;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '坠海了';
    saveBest();
    audio.lose();
    showOverlay('lose', '坠海了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''), '再来', true);
    syncHud();
  }

  function winGame() {
    addScore(8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '航线肃清', '三关打穿 · 分数 ' + G.score, '再来', true);
    syncHud();
  }

  function tryLoop() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.loopT > 0) return;
    if (G.loops <= 0) {
      toast('回旋用尽', true);
      audio.miss();
      return;
    }
    G.loops -= 1;
    G.loopT = LOOP_DUR;
    G.loopFlash = 0.4;
    audio.loop();
    screenFlash(SKY, 0.62);
    popSpark(G.player.x, G.player.y, CYN, 28);
    emit(18, {
      x: G.player.x, y: G.player.y, j: 10,
      vx0: -220, vx1: 220, vy0: -240, vy1: 180,
      life: 0.42, r0: 1.4, r1: 3.4, rgb: SKY, g: 80
    });
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('loop');
      void stageEl.offsetWidth;
      stageEl.classList.add('loop');
    }
    syncHud();
  }

  function livingCount() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0 && !G.ents[i].ground) n += 1;
    }
    return n;
  }

  function chaosThink(dt) {
    if (hasBoss() || G.stageClearT > 0) return;
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    const dens = 1 + G.clock * 0.014;
    G.spawnT = clamp(2.05 / dens, 0.48, 2.05);
    if (livingCount() > 28) return;
    const r = Math.random();
    if (r < 0.36) spawnV(5 + (Math.random() * 7) | 0);
    else if (r < 0.54) spawnStream(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.68) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.8) spawnBomber();
    else if (r < 0.9) spawnCarrier();
    else spawnBig();
  }

  function raidThink(dt) {
    if (G.stageClearT > 0 || hasBoss()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    G.stageT += dt;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function updatePlayer(dt) {
    if (G.mode !== 'play') return;
    if (G.deadT > 0) return;
    const spd = plySpd();
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
      G.player.vx = dx * spd;
      G.player.vy = dy * spd;
      inputSrc = 'key';
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      G.player.x = lerp(G.player.x, tx, 1 - Math.exp(-dt * 16));
      G.player.y = lerp(G.player.y, ty, 1 - Math.exp(-dt * 16));
      G.player.vx = 0;
      G.player.vy = 0;
    } else {
      G.player.vx *= Math.exp(-dt * 10);
      G.player.vy *= Math.exp(-dt * 10);
    }
    const slow = G.loopT > 0 ? 0.55 : 1;
    G.player.x += G.player.vx * dt * slow;
    G.player.y += G.player.vy * dt * slow;
    G.player.x = clamp(G.player.x, 22, VW - 22);
    G.player.y = clamp(G.player.y, 40, VH - 28);

    if (G.loopT > 0 && !REDUCE) {
      G.ghosts.push({
        x: G.player.x,
        y: G.player.y,
        t: 0.22,
        p: 1 - G.loopT / LOOP_DUR
      });
      capArr(G.ghosts, 18);
    }
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const ram = G.loopT > 0;
    const inv = G.invuln > 0 || ram;
    const chaos = isChaos();
    const scr = scrollSpd();

    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.ramT > 0) en.ramT -= dt;
      if (en.ground) {
        en.y += scr * dt;
      } else if (en.type === 'boss') {
        if (en.y < 108) en.y += en.vy * dt;
        else {
          en.y = 108;
          en.x += en.vx * dt;
          if (en.x < 90 || en.x > VW - 90) en.vx *= -1;
          en.x = clamp(en.x, 90, VW - 90);
        }
      } else if (en.type === 'carrier') {
        en.x += en.phase * 110 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 70;
        }
      } else if (en.type === 'scout' || en.dive) {
        if (en.t > 0.35) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 170;
          en.vx = lerp(en.vx, dx / len * asp, 1 - Math.exp(-dt * 3));
          en.vy = lerp(en.vy, dy / len * asp, 1 - Math.exp(-dt * 3));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'fighter') {
        if (!en.dive && en.t > 1.35 && Math.random() < dt * 0.55) {
          en.dive = true;
        }
        if (en.dive && en.t > 1.35) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 90, dt * 2);
          en.vy = Math.max(en.vy, 150);
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'bomber') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < 40 || en.x > VW - 40) en.vx *= -1;
      } else if (en.type === 'big') {
        en.x += en.vx * dt;
        en.y += Math.min(en.vy, en.y < 90 ? 70 : 18) * dt;
        if (en.x < 70 || en.x > VW - 70) en.vx *= -1;
        if (en.y > 130) en.y = 130;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 50 || en.x < -60 || en.x > VW + 60 || (en.ground && en.y > VH + 40)) {
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && en.y > -10 && en.y < VH + 10) {
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          const rate = chaos ? 0.72 : 1;
          if (en.type === 'fighter' && en.y > 20 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, 180, MAG);
            en.fireCd = (chaos ? 1.5 : 2.6) * rate + rand(0, 0.6);
          } else if (en.type === 'bomber') {
            eShot(en.x - 8, en.y + 12, -30, 170, RED);
            eShot(en.x, en.y + 14, 0, 190, RED);
            eShot(en.x + 8, en.y + 12, 30, 170, RED);
            en.fireCd = (chaos ? 0.82 : 1.12) * rate;
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, chaos ? 210 : 170, GOLD);
            en.fireCd = (chaos ? 0.88 : 1.22) + rand(0, 0.3);
          } else if (en.type === 'big') {
            aimShot(en.x - 18, en.y + 8, 200, ORG);
            aimShot(en.x + 18, en.y + 8, 200, ORG);
            eShot(en.x, en.y + 16, 0, 210, RED);
            en.fireCd = chaos ? 0.55 : 0.78;
          } else if (en.type === 'boss' && en.y > 70) {
            const low = en.hp < en.maxHp * 0.34;
            const mid = en.hp < en.maxHp * 0.62;
            aimShot(en.x, en.y + 18, 220, MAG);
            eShot(en.x - 22, en.y + 12, -40, 200, RED);
            eShot(en.x + 22, en.y + 12, 40, 200, RED);
            if (mid) {
              eShot(en.x - 36, en.y + 8, -90, 170, PNK);
              eShot(en.x + 36, en.y + 8, 90, 170, PNK);
            }
            if (low) {
              for (let k = -2; k <= 2; k++) {
                eShot(en.x + k * 16, en.y + 20, k * 50, 210, MAG);
              }
            }
            en.fireCd = low ? 0.28 : mid ? 0.42 : 0.58;
            if (chaos) en.fireCd *= 0.85;
          } else {
            en.fireCd = 2;
          }
        }
      }

      if (canHurt) {
        const rr = en.r + (ram ? 10 : 5);
        const dx = en.x - px;
        const dy = en.y - py;
        if (dx * dx + dy * dy < rr * rr) {
          if (ram) {
            if (en.ramT <= 0) {
              en.ramT = 0.16;
              if (en.type === 'boss' || en.type === 'big') hurtEnt(en, 2, px, py);
              else hurtEnt(en, 99, en.x, en.y);
            }
          } else if (!inv) {
            killPlayer();
          }
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -16 || s.x < -12 || s.x > VW + 12) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(en, 1, s.x, s.y);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && G.loopT <= 0;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y > VH + 20 || s.y < -30 || s.x < -20 || s.x > VW + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = s.x - G.player.x;
        const dy = s.y - (G.player.y - 2);
        const rr = 5 + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          G.eShots.splice(i, 1);
          killPlayer();
        }
      } else if (G.loopT > 0) {
        const dx = s.x - G.player.x;
        const dy = s.y - G.player.y;
        if (dx * dx + dy * dy < 22 * 22) {
          emit(3, {
            x: s.x, y: s.y, j: 2,
            vx0: -60, vx1: 60, vy0: -60, vy1: 60,
            life: 0.12, r0: 1, r1: 2, rgb: SKY, g: 0
          });
          G.eShots.splice(i, 1);
        }
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 1.2);
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (p.y > VH + 20) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = p.x - G.player.x;
        const dy = p.y - G.player.y;
        if (dx * dx + dy * dy < 22 * 22) {
          pickPow(p);
          G.pows.splice(i, 1);
        }
      }
    }
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    G.nextIsland -= scr * dt;
    if (G.nextIsland <= 0) {
      G.nextIsland = (isChaos() ? 150 : 200) + rand(40, 110);
      spawnIsland();
    }
    for (let i = G.islands.length - 1; i >= 0; i--) {
      G.islands[i].y += scr * dt;
      if (G.islands[i].y - G.islands[i].r > VH + 20) G.islands.splice(i, 1);
    }
    for (let i = 0; i < G.clouds.length; i++) {
      const c = G.clouds[i];
      c.y += c.v * dt;
      if (c.y - c.r > VH + 20) {
        c.y = -c.r - 10;
        c.x = rand(20, VW - 20);
        c.r = rand(28, 64);
      }
    }
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
      rings[i].t += dt * 2.8;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = G.ghosts.length - 1; i >= 0; i--) {
      G.ghosts[i].t -= dt;
      if (G.ghosts[i].t <= 0) G.ghosts.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.loopFlash > 0) G.loopFlash -= dt;
    if (G.toastT > 0) G.toastT -= dt;
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.demoCd -= dt;
      if (G.demoCd <= 0 && livingCount() < 8) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 40);
        G.demoCd = 2.6;
      }
      updateEnts(dt);
      updateWorld(dt * 0.5);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 24 * dt;
      updateWorld(dt * 0.5);
      return;
    }

    G.clock += dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.loopT > 0) G.loopT -= dt;

    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseGame();
          return;
        }
        respawn();
      }
    }

    if (G.stageClearT > 0) {
      G.stageClearT -= dt;
      if (G.stageClearT <= 0) {
        if (isChaos()) {
          G.nextBoss = 62;
          toast('下一波', false, true);
        } else if (G.stage >= 3) {
          winGame();
          return;
        } else {
          G.stage += 1;
          G.stageT = 0;
          G.waveI = 0;
          G.loops = Math.min(5, G.loops + 1);
          G.invuln = Math.max(G.invuln, 0.8);
          toast(STAGES[G.stage - 1].name, false, true);
          audio.wave();
          syncHud();
        }
      }
    }

    updateWorld(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.loopT <= 0 && G.fireHold) fire();

    if (isChaos()) {
      chaosThink(dt);
      if (!hasBoss() && G.stageClearT <= 0) {
        G.nextBoss -= dt;
        if (G.nextBoss <= 0) {
          spawnBoss();
          G.nextBoss = 68;
        }
      }
    } else {
      raidThink(dt);
    }

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function drawCloud(c) {
    ctx.fillStyle = 'rgba(180, 220, 255,' + c.a + ')';
    ctx.beginPath();
    ctx.ellipse(sx(c.x), sy(c.y), c.r * scale, c.r * 0.45 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx(c.x - c.r * 0.4), sy(c.y + 4), c.r * 0.55 * scale, c.r * 0.32 * scale, 0, 0, TAU);
    ctx.fill();
  }

  function drawIsland(is) {
    const x = sx(is.x);
    const y = sy(is.y);
    const r = is.r * scale;
    ctx.fillStyle = 'rgba(18, 70, 58, 0.95)';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.62, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(46, 150, 108, 0.85)';
    ctx.beginPath();
    ctx.ellipse(x, y - r * 0.12, r * 0.7, r * 0.38, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(FOAM, 0.35);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.08, r * 0.7, 0, 0, TAU);
    ctx.stroke();
  }

  function drawP38(x, y, looping, ghostA) {
    const p = looping ? 1 - G.loopT / LOOP_DUR : 0;
    const scBase = looping ? 1 + Math.sin(p * Math.PI) * (REDUCE ? 0.25 : 1.55) : 1;
    const squash = looping ? Math.max(0.18, Math.abs(Math.cos(p * Math.PI))) : 1;
    const ang = looping ? p * TAU * (REDUCE ? 1 : 2) : G.player.vx * 0.0016;
    const a = ghostA == null ? 1 : ghostA;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    ctx.scale(scBase * scale, scBase * squash * scale);
    ctx.globalAlpha = a;
    ctx.shadowColor = rgba(CYN, looping ? 0.9 : 0.45);
    ctx.shadowBlur = (looping ? 22 : 10) * scale;
    const flash = G.muzzle > 0;
    ctx.fillStyle = flash ? '#e8ffff' : rgba(CYN, 0.96);
    ctx.beginPath();
    ctx.moveTo(-16, 1);
    ctx.lineTo(-2, -5);
    ctx.lineTo(2, -5);
    ctx.lineTo(16, 1);
    ctx.lineTo(3, 4);
    ctx.lineTo(-3, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-11.5, -1, 4.2, 15);
    ctx.fillRect(7.3, -1, 4.2, 15);
    ctx.fillRect(-14, 12, 10, 3.6);
    ctx.fillRect(4, 12, 10, 3.6);
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(4.2, -1);
    ctx.lineTo(3.2, 7);
    ctx.lineTo(-3.2, 7);
    ctx.lineTo(-4.2, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.fillRect(-1.2, -8, 2.4, 6);
    const pr = Math.sin(G.t * 72);
    ctx.strokeStyle = rgba(WHT, 0.55);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-9.4 + pr * 5.5, -2.5);
    ctx.lineTo(-9.4 - pr * 5.5, -2.5);
    ctx.moveTo(9.4 + pr * 5.5, -2.5);
    ctx.lineTo(9.4 - pr * 5.5, -2.5);
    ctx.stroke();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(-6, -14);
      ctx.lineTo(-4, -22);
      ctx.lineTo(-2, -14);
      ctx.moveTo(6, -14);
      ctx.lineTo(4, -22);
      ctx.lineTo(2, -14);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFighterAt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
    ctx.shadowColor = rgba(en.rgb, 0.45);
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(9, 2);
    ctx.lineTo(3.2, 2);
    ctx.lineTo(2.4, -11);
    ctx.lineTo(-2.4, -11);
    ctx.lineTo(-3.2, 2);
    ctx.lineTo(-9, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.fillRect(-1.2, -2, 2.4, 8);
    ctx.restore();
  }

  function drawBomberAt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
    ctx.shadowColor = rgba(en.rgb, 0.4);
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 9, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(-18, -3, 8, 14);
    ctx.fillRect(10, -3, 8, 14);
    ctx.fillStyle = rgba(WHT, 0.3);
    ctx.fillRect(-6, -4, 12, 5);
    ctx.restore();
  }

  function drawBigAt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
    ctx.shadowColor = rgba(en.rgb, 0.5);
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(0, 2, 34, 12, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(-28, -4, 10, 18);
    ctx.fillRect(-6, -6, 12, 22);
    ctx.fillRect(18, -4, 10, 18);
    ctx.fillStyle = rgba(WHT, 0.28);
    ctx.fillRect(-16, -2, 32, 6);
    ctx.restore();
  }

  function drawTurretAt(en) {
    const flash = en.flash > 0;
    const dx = G.player.x - en.x;
    const dy = G.player.y - en.y;
    const ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(40, 48, 44, 0.95)';
    ctx.beginPath();
    ctx.arc(0, 4, 11, 0, TAU);
    ctx.fill();
    ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
    ctx.beginPath();
    ctx.arc(0, 2, 7, 0, TAU);
    ctx.fill();
    ctx.rotate(ang);
    ctx.fillRect(4, -2.2, 14, 4.4);
    ctx.restore();
  }

  function drawCarrierAt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.95);
    ctx.shadowColor = rgba(GOLD, 0.55);
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.lineTo(10, 1);
    ctx.lineTo(3, 1);
    ctx.lineTo(2, -12);
    ctx.lineTo(-2, -12);
    ctx.lineTo(-3, 1);
    ctx.lineTo(-10, 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#041018';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('P', 0, 4);
    ctx.restore();
  }

  function drawBossAt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.96);
    ctx.shadowColor = rgba(en.rgb, 0.55);
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(0, 4, 52, 16, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(-44, -6, 14, 28);
    ctx.fillRect(-10, -10, 20, 36);
    ctx.fillRect(30, -6, 14, 28);
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(-22, 0, 8, 8);
    ctx.fillRect(14, 0, 8, 8);
    ctx.fillStyle = rgba(WHT, 0.3);
    ctx.fillRect(-28, -2, 56, 7);
    ctx.restore();
  }

  function drawEnt(en) {
    if (en.type === 'fighter' || en.type === 'scout') drawFighterAt(en);
    else if (en.type === 'bomber') drawBomberAt(en);
    else if (en.type === 'big') drawBigAt(en);
    else if (en.type === 'turret') drawTurretAt(en);
    else if (en.type === 'carrier') drawCarrierAt(en);
    else if (en.type === 'boss') drawBossAt(en);
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.8);
      ctx.shadowBlur = 8 * scale;
      ctx.fillRect(sx(s.x - 1.4), sy(s.y - 6), 2.8 * scale, 11 * scale);
      if (!REDUCE) {
        ctx.globalAlpha = 0.35;
        ctx.fillRect(sx(s.x - 1.2), sy(s.y), 2.4 * scale, 10 * scale);
      }
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.75);
      ctx.shadowBlur = 7 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 8) * 2;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.rotate(p.t * 2.4);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.shadowColor = rgba(GOLD, 0.8);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#2a1a00';
      ctx.font = 'bold 7px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.4);
      ctx.fillText('POW', 0, 1);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), Math.max(0.6, p.r * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = 3 * (1 - r.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 34) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = rgba(f.rgb, 0.7);
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].hp > 0) {
        boss = G.ents[i];
        break;
      }
    }
    if (!boss) return;
    const x = 40;
    const y = 16;
    const w = VW - 80;
    const h = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    const t = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : CYN, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : CYN, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#062438');
    g.addColorStop(0.55, '#041828');
    g.addColorStop(1, '#031018');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const off = G.scroll % 32;
    ctx.lineWidth = 1.2 * scale;
    for (let y = -32; y < VH + 32; y += 32) {
      const yy = y + (32 - off);
      ctx.strokeStyle = 'rgba(0,180,255,' + (0.045 + (y % 64 === 0 ? 0.03 : 0)) + ')';
      ctx.beginPath();
      for (let x = 0; x <= VW; x += 16) {
        const yy2 = yy + Math.sin((x + G.scroll) * 0.018) * 3.2;
        if (x === 0) ctx.moveTo(sx(x), sy(yy2));
        else ctx.lineTo(sx(x), sy(yy2));
      }
      ctx.stroke();
    }

    for (let i = 0; i < G.islands.length; i++) drawIsland(G.islands[i]);
    for (let i = 0; i < G.clouds.length; i++) drawCloud(G.clouds[i]);
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    if (G.loopFlash > 0) {
      ctx.strokeStyle = rgba(SKY, G.loopFlash * 0.85);
      ctx.lineWidth = 6 * scale;
      ctx.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#02080e';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (!REDUCE && G.shake > 0) {
      ctx.translate((Math.random() - 0.5) * G.shake, (Math.random() - 0.5) * G.shake);
    }
    if (G.punch > 1 && !REDUCE) {
      const cx = W * 0.5;
      const cy = H * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawWorld();

    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && G.loopT <= 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) {
        for (let i = 0; i < G.ghosts.length; i++) {
          const gh = G.ghosts[i];
          drawP38(gh.x, gh.y, true, clamp(gh.t * 3, 0, 0.45));
        }
        drawP38(G.player.x, G.player.y, G.loopT > 0, 1);
      }
    }
    drawFloats();
    drawBossBar();
    drawFlash();
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

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pows.length = 0;
    G.islands.length = 0;
    G.ghosts.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'chaos' ? 'chaos' : 'raid';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.stage = 1;
    G.stageT = 0;
    G.waveI = 0;
    G.scroll = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.power = 0;
    G.loops = maxLoops();
    G.loopT = 0;
    G.loopFlash = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.spawnT = 0.7;
    G.nextBoss = 70;
    G.bossN = 0;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.nextIsland = 30;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedClouds();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isChaos() ? '乱战 · 弹更密' : '远征 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.lives = LIVES;
    G.loops = 3;
    G.power = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.loopT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    clearField();
    seedClouds();
    showOverlay('title', '战机', '垂直卷轴。空格开火，Shift 翻筋斗躲弹。', '远征', true);
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
    const isLoop = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

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

    if (down && (isMove || space || isLoop || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (isLoop) {
      if (!e.repeat) tryLoop();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space && G.mode === 'play') G.fireHold = true;
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
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const w = pointerWorld(e);
      pointer.x = w.x;
      pointer.y = w.y;
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

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('raid');
    });
  }
  if (btnChaos) {
    btnChaos.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('chaos');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnLoop) btnLoop.addEventListener('click', tryLoop);
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
