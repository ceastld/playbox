'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const GROUND = 418;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const LOOP_DUR = 0.56;
  const LOOP_CD = 0.92;
  const LOOP_R = 38;
  const FIRE_CD = 0.108;
  const BEST_KEY = 'playbox-sky-kid-best';
  const MUTE_KEY = 'playbox-sky-kid-mute';
  const OPS = '方向 / WASD 飞 · 空格开火 · Shift / Z 翻跟头 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [30, 200, 255];
  const SKY = [92, 224, 255];
  const GOLD = [255, 227, 107];
  const WHT = [232, 247, 255];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 160, 72];
  const GRN = [70, 170, 110];
  const DEEP = [10, 36, 48];

  const STAGES = [
    {
      name: '草原',
      w: 3600,
      hills: [
        { x: 640, w: 190, h: 54 },
        { x: 1520, w: 230, h: 72 },
        { x: 2520, w: 170, h: 50 },
        { x: 3220, w: 210, h: 88 }
      ],
      flags: [400, 920, 1720, 2140, 2820, 3420],
      tanks: [540, 1140, 1940, 2640],
      aa: [1360, 3040],
      towers: [2040, 3280]
    },
    {
      name: '峡谷',
      w: 4000,
      hills: [
        { x: 300, w: 170, h: 92 },
        { x: 820, w: 210, h: 124 },
        { x: 1460, w: 190, h: 100 },
        { x: 2160, w: 250, h: 142 },
        { x: 2860, w: 200, h: 114 },
        { x: 3560, w: 230, h: 130 }
      ],
      flags: [520, 1020, 1720, 2380, 3080, 3780],
      tanks: [640, 1240, 1920, 2620, 3340],
      aa: [900, 1600, 2500, 3440],
      towers: [1140, 2240, 3640]
    },
    {
      name: '云堡',
      w: 3200,
      hills: [
        { x: 420, w: 190, h: 72 },
        { x: 1140, w: 210, h: 90 }
      ],
      flags: [340, 760, 1520, 1920],
      tanks: [580, 1020, 1740],
      aa: [840, 1340, 2140],
      towers: [2040],
      fortress: { x: 2520, hp: 96 }
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
  const btnKid = document.getElementById('btn-kid');
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnLoop = document.getElementById('btn-loop');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const flagsEl = document.getElementById('flags');
  const flagBox = document.getElementById('flag-box');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const loopLabel = document.getElementById('loop-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');
  const padLeft = document.getElementById('pad-left');
  const padRight = document.getElementById('pad-right');
  const padUp = document.getElementById('pad-up');
  const padDown = document.getElementById('pad-down');
  const padFire = document.getElementById('pad-fire');
  const padLoop = document.getElementById('pad-loop');

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
  let loopTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 160, y: 200, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const clouds = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'kid',
    t: 0,
    clock: 0,
    stage: 0,
    cam: 0,
    player: {
      x: 140, y: 210, vx: 0, vy: 0, ang: 0,
      loopT: 0, loopCd: 0, loopCx: 0, loopCy: 0, loopA: 0, prop: 0
    },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    flagsGot: 0,
    flagsMax: 0,
    stageFlags: 0,
    ents: [],
    shots: [],
    eShots: [],
    flags: [],
    hills: [],
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
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    winT: 0,
    why: '',
    engT: 0,
    boss: null,
    origins: [0, 0, 0],
    worldEnd: 0
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
  function vx(wx) {
    return wx - G.cam;
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
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function scrollSpd() {
    if (G.boss && G.boss.hp > 0 && G.cam + VW > G.boss.x - 220) {
      return isCore() ? 42 : 32;
    }
    const base = isCore() ? 152 : 118;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + G.stage * (isCore() ? 10 : 7);
  }
  function plySpd() {
    return isCore() ? 268 : 230;
  }
  function hillLift(wx, hill) {
    const d = Math.abs(wx - hill.x);
    const hw = hill.w * 0.5;
    if (d >= hw) return 0;
    const t = 1 - d / hw;
    return hill.h * (0.5 - 0.5 * Math.cos(t * Math.PI));
  }
  function groundAt(wx) {
    let g = GROUND;
    const hills = G.hills;
    for (let i = 0; i < hills.length; i++) g -= hillLift(wx, hills[i]);
    return g;
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
      this.beep(760, 0.046, 'square', 0.028, 1520);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1200);
      this.beep(560 * lift, 0.066, 'square', 0.042, 960 * lift);
    },
    groundHit() {
      this.ensure();
      this.noise(0.058, 0.04, 420);
      this.beep(200, 0.1, 'sawtooth', 0.038, 68);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.1, big ? 0.074 : 0.046, big ? 220 : 460);
      this.beep(big ? 150 : 240, big ? 0.26 : 0.14, 'sawtooth', 0.048, 50);
    },
    flag() {
      this.ensure();
      this.beep(659, 0.07, 'square', 0.045, 880);
      this.beep(880, 0.12, 'triangle', 0.04, 1320);
    },
    loopWhoosh() {
      this.ensure();
      this.noise(0.12, 0.04, 280);
      this.beep(220, 0.16, 'sine', 0.04, 720);
      this.beep(720, 0.18, 'triangle', 0.03, 180);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    prop() {
      this.ensure();
      this.beep(88, 0.028, 'sawtooth', 0.012, 62);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.056, 320);
      this.beep(260, 0.2, 'sawtooth', 0.05, 70);
      this.beep(140, 0.32, 'sine', 0.044, 40);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(170, 0.18, 'sawtooth', 0.05, 90);
      this.beep(120, 0.3, 'square', 0.04, 64);
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

  function flashLoopHud() {
    if (!loopLabel) return;
    loopLabel.classList.remove('hot');
    void loopLabel.offsetWidth;
    loopLabel.classList.add('hot');
    loopTok += 1;
    const tok = loopTok;
    setTimeout(function () {
      if (tok === loopTok && loopLabel) loopLabel.classList.remove('hot');
    }, 280);
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
    if (flagsEl) flagsEl.textContent = String(G.flagsGot);
    if (stageLabel) {
      const st = STAGES[Math.min(STAGES.length - 1, G.stage)];
      stageLabel.textContent = st ? st.name : '云堡';
      stageLabel.classList.toggle('hot', G.stage >= 2 || !!(G.boss && G.boss.hp > 0));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '云核' : '空孩';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', !isCore() && G.stage >= 2);
    }
    if (loopLabel) {
      const ready = G.player.loopCd <= 0 && G.player.loopT <= 0;
      loopLabel.textContent = G.player.loopT > 0 ? '翻!' : ready ? '翻' : '翻…';
      loopLabel.classList.toggle('ready', ready && G.mode === 'play');
      loopLabel.classList.toggle('busy', !ready);
    }
    if (btnLoop) btnLoop.classList.toggle('busy', G.player.loopCd > 0 || G.player.loopT > 0);
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 擦地、撞塔、撞机或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint('旗帜夺回 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 低空夺旗 · Shift 翻跟头躲弹', 'warn');
    else setHint('向右飞 · 空格开火 · Shift 翻跟头 · 低空夺旗 · 擦地坠毁', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SKID';
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

  function kick(mag) {
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6.5 ? 'die' : mag >= 4.2 ? 'pow' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('pow');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
        stageEl.classList.remove('pow');
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
    if (REDUCE) n = Math.max(2, (n * 0.35) | 0);
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
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 380);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 44);
    capArr(rings, 28);
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

  function seedSky() {
    clouds.length = 0;
    stars.length = 0;
    for (let i = 0; i < 18; i++) {
      clouds.push({
        x: hash2(i * 11 + 2) * 1400,
        y: 18 + hash2(i * 7) * 150,
        w: 40 + hash2(i * 3) * 70,
        a: 0.08 + hash2(i * 5) * 0.14,
        z: 0.22 + hash2(i * 13) * 0.45
      });
    }
    for (let i = 0; i < 42; i++) {
      stars.push({
        x: hash2(i * 19) * VW,
        y: hash2(i * 23 + 4) * 210,
        a: 0.18 + hash2(i * 29) * 0.55,
        s: 0.7 + hash2(i * 17) * 1.4
      });
    }
  }

  function spawnEnt(spec) {
    if (G.ents.length > 64) return null;
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
      fireCd: spec.fireCd != null ? spec.fireCd : rand(0.4, 1.4),
      score: spec.score,
      rgb: spec.rgb,
      ang: spec.ang || 0,
      flash: 0,
      ground: !!spec.ground,
      solid: spec.solid !== false,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      phase: spec.phase || 0,
      ox: spec.ox || 0,
      oy: spec.oy || 0
    };
    G.ents.push(en);
    return en;
  }

  function buildWorld() {
    G.hills.length = 0;
    G.flags.length = 0;
    G.ents.length = 0;
    G.boss = null;
    G.flagsMax = 0;
    let oxw = 80;
    for (let s = 0; s < STAGES.length; s++) {
      const st = STAGES[s];
      G.origins[s] = oxw;
      for (let i = 0; i < st.hills.length; i++) {
        const h = st.hills[i];
        G.hills.push({ x: oxw + h.x, w: h.w, h: h.h });
      }
      for (let i = 0; i < st.flags.length; i++) {
        G.flags.push({ x: oxw + st.flags[i], taken: false, wave: rand(0, TAU) });
        G.flagsMax += 1;
      }
      for (let i = 0; i < st.tanks.length; i++) {
        const x = oxw + st.tanks[i];
        spawnEnt({
          type: 'tank', x: x, y: GROUND - 14, hp: 4, r: 14, score: 170,
          rgb: ORG, ground: true, w: 28, h: 16, fireCd: rand(0.7, 1.6)
        });
      }
      if (isCore()) {
        for (let i = 0; i < st.tanks.length; i += 2) {
          const x = oxw + st.tanks[i] + 160;
          spawnEnt({
            type: 'tank', x: x, y: GROUND - 14, hp: 4, r: 14, score: 170,
            rgb: RED, ground: true, w: 28, h: 16, fireCd: rand(0.5, 1.2)
          });
        }
      }
      for (let i = 0; i < st.aa.length; i++) {
        const x = oxw + st.aa[i];
        spawnEnt({
          type: 'aa', x: x, y: GROUND - 16, hp: 5, r: 13, score: 160,
          rgb: MAG, ground: true, w: 22, h: 20, fireCd: rand(0.5, 1.1)
        });
      }
      if (isCore() && st.aa.length) {
        const x = oxw + st.aa[0] + 220;
        spawnEnt({
          type: 'aa', x: x, y: GROUND - 16, hp: 5, r: 13, score: 160,
          rgb: PNK, ground: true, w: 22, h: 20, fireCd: rand(0.4, 0.9)
        });
      }
      for (let i = 0; i < st.towers.length; i++) {
        const x = oxw + st.towers[i];
        spawnEnt({
          type: 'tower', x: x, y: GROUND - 34, hp: 6, r: 16, score: 90,
          rgb: DEEP, ground: true, solid: true, w: 22, h: 56, fireCd: 99
        });
      }
      if (st.fortress) {
        const fx = oxw + st.fortress.x;
        const hp = (st.fortress.hp * (isCore() ? 1.22 : 1)) | 0;
        G.boss = spawnEnt({
          type: 'core', x: fx, y: GROUND - 78, hp: hp, r: 28, score: 4000,
          rgb: GOLD, ground: true, solid: true, w: 86, h: 110, fireCd: 0.8
        });
        const turrets = [
          { ox: -70, oy: -28 },
          { ox: 70, oy: -28 },
          { ox: -28, oy: -58 },
          { ox: 28, oy: -58 }
        ];
        for (let i = 0; i < turrets.length; i++) {
          const tr = turrets[i];
          spawnEnt({
            type: 'turret', x: fx + tr.ox, y: GROUND - 78 + tr.oy,
            hp: isCore() ? 12 : 10, r: 12, score: 380,
            rgb: MAG, ground: true, solid: true, w: 20, h: 16,
            fireCd: 0.4 + i * 0.18, ox: tr.ox, oy: tr.oy
          });
        }
      }
      oxw += st.w;
    }
    G.worldEnd = oxw;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.ground && en.type !== 'core' && en.type !== 'turret' && en.type !== 'tower') {
        en.y = groundAt(en.x) - en.h * 0.45;
      }
      if (en.type === 'tower') en.y = groundAt(en.x) - en.h * 0.5;
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

  function killEnt(en, ram) {
    const pts = Math.floor(en.score * G.mult);
    addScore(pts);
    bumpCombo();
    const big = en.type === 'core' || en.type === 'turret' || en.type === 'bomber';
    juice(en.x, en.y, en.rgb, big ? 1.6 : ram ? 1.25 : 0.85);
    floatText(en.x, en.y - 10, ram ? '撞!' : String(pts), en.rgb, big || ram);
    if (en.ground) audio.groundHit();
    else audio.hit(G.combo);
    if (big) audio.boom(en.type === 'core');
    hitStop(en.type === 'core' ? 0.078 : en.type === 'turret' ? 0.06 : clamp(0.034 + G.combo * 0.0024, 0.034, 0.072));
    if (en.type === 'core') {
      en.hp = 0;
      toast('云堡捣毁了', false, true);
      G.winT = 2.05;
      for (let i = 0; i < G.ents.length; i++) {
        const o = G.ents[i];
        if (o !== en && (o.type === 'turret' || o.type === 'aa' || o.type === 'tank') && o.x > en.x - 200) {
          o.hp = 0;
          juice(o.x, o.y, o.rgb, 1.1);
        }
      }
    }
    en.dead = true;
  }

  function grabFlag(fl) {
    if (fl.taken) return;
    fl.taken = true;
    G.flagsGot += 1;
    G.stageFlags += 1;
    bumpCombo();
    const pts = Math.floor(280 * G.mult);
    addScore(pts);
    juice(fl.x, groundAt(fl.x) - 46, GOLD, 1.35);
    floatText(fl.x, groundAt(fl.x) - 56, '旗!', GOLD, true);
    audio.flag();
    hitStop(0.048);
    kick(3.4);
    screenFlash(GOLD, 0.32);
    if (flagBox) {
      flagBox.classList.remove('flash');
      void flagBox.offsetWidth;
      flagBox.classList.add('flash');
    }
    syncHud();
    if (G.flagsGot === G.flagsMax) {
      toast('旗帜全夺', false, true);
      addScore(Math.floor(2000 * G.mult));
    }
  }

  function spawnScout(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: extra.ace ? 'ace' : 'scout',
      x: x, y: y,
      vx: extra.vx != null ? extra.vx : -70,
      vy: extra.vy || 0,
      hp: extra.ace ? 3 : 1,
      r: extra.ace ? 12 : 10,
      score: extra.ace ? 150 : 80,
      rgb: extra.ace ? GOLD : MAG,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.6, 1.6),
      phase: rand(0, TAU)
    });
  }

  function spawnBomber(x, y) {
    return spawnEnt({
      type: 'bomber',
      x: x, y: y,
      vx: -46, vy: 8,
      hp: 5, r: 16, score: 220,
      rgb: PNK, w: 36, h: 16,
      fireCd: rand(0.5, 1.0)
    });
  }

  function spawnBirds(x, y) {
    const n = isCore() ? 5 : 3;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'bird',
        x: x + i * 18, y: y + Math.sin(i) * 10,
        vx: -90 - i * 6, vy: 0,
        hp: 1, r: 6, score: 40,
        rgb: WHT, fireCd: 99, phase: i * 0.7
      });
    }
  }

  function spawnDive(x) {
    spawnEnt({
      type: 'dive',
      x: x, y: -20,
      vx: -20, vy: 40,
      hp: 1, r: 10, score: 110,
      rgb: ORG, fireCd: 99, phase: 0
    });
  }

  function enemyShot(x, y, vx, vy, r) {
    if (G.eShots.length > (isCore() ? 90 : 64)) return;
    G.eShots.push({ x: x, y: y, vx: vx, vy: vy, life: 2.4, r: r || 3.2 });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    G.fireCd = FIRE_CD;
    G.muzzle = 0.055;
    const p = G.player;
    const ang = p.ang || 0;
    G.shots.push({
      x: p.x + Math.cos(ang) * 20,
      y: p.y + Math.sin(ang) * 14,
      vx: Math.cos(ang) * 540,
      vy: Math.sin(ang) * 540,
      life: 0.85
    });
    audio.shoot();
  }

  function tryLoop() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const p = G.player;
    if (p.loopT > 0 || p.loopCd > 0) return;
    p.loopT = LOOP_DUR;
    p.loopCd = LOOP_CD;
    p.loopCx = p.x;
    p.loopCy = p.y;
    p.loopA = 0;
    audio.loopWhoosh();
    flashLoopHud();
    emit(10, {
      x: p.x, y: p.y, j: 8,
      vx0: -80, vx1: 80, vy0: -160, vy1: 40,
      life: 0.32, r0: 1.2, r1: 3.2, rgb: CYN, g: 80
    });
    kick(2.1);
    screenFlash(CYN, 0.16);
  }

  function die(why) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.invuln > 0) return;
    G.why = why;
    G.lives -= 1;
    G.deadT = 1.28;
    G.player.loopT = 0;
    G.player.ang = 0;
    breakCombo();
    juice(G.player.x, G.player.y, MAG, 1.8);
    audio.death();
    kick(7.2);
    screenFlash(MAG, 0.55);
    toast(why, true, false);
    syncPips();
  }

  function looping() {
    return G.player.loopT > 0;
  }

  function respawn() {
    const p = G.player;
    p.x = G.cam + 150;
    p.y = Math.min(groundAt(p.x) - 90, 200);
    p.vx = 0;
    p.vy = 0;
    p.ang = 0;
    p.loopT = 0;
    p.loopCd = 0;
    G.deadT = 0;
    G.invuln = 1.65;
    G.eShots.length = 0;
    toast('再飞', false, false);
  }

  function loseGame() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    const rec = G.score >= G.best && G.score > 0 ? ' 新纪录。' : '';
    showOverlay(
      'lose',
      '坠机了',
      (G.why || '擦地坠毁') + '。旗 ' + G.flagsGot + ' · 分 ' + G.score + '。' + rec
    );
    syncHud();
  }

  function winGame() {
    const bonus = isCore() ? 9000 : 6000;
    addScore(bonus);
    G.mode = 'win';
    saveBest();
    audio.win();
    const rec = G.score >= G.best ? ' 新纪录。' : '';
    showOverlay(
      'win',
      isCore() ? '云核打穿' : '旗帜夺回了',
      '旗 ' + G.flagsGot + '/' + G.flagsMax + ' · 分 ' + G.score + '。云堡捣毁。' + rec
    );
    syncHud();
  }

  function nextStage() {
    const st = STAGES[G.stage];
    const flagBonus = G.stageFlags * 50;
    const clear = 1200 + flagBonus + G.lives * 150;
    addScore(clear);
    audio.wave();
    G.stage += 1;
    G.stageFlags = 0;
    G.stageClearT = 0;
    if (G.stage >= STAGES.length) {
      G.winT = 1.6;
      return;
    }
    toast(STAGES[G.stage].name, false, true);
    syncHud();
  }

  function currentStageIndex(wx) {
    for (let i = STAGES.length - 1; i >= 0; i--) {
      if (wx >= G.origins[i]) return i;
    }
    return 0;
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 28);
    G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.toastT = Math.max(0, G.toastT - dt);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
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
  }

  function updateTitle(dt) {
    G.clock += dt;
    G.player.prop += dt * 22;
    G.cam += 46 * dt;
    if (G.cam > 900) G.cam = 0;
    G.player.x = G.cam + 170 + Math.sin(G.clock * 0.7) * 30;
    G.player.y = 190 + Math.sin(G.clock * 1.1) * 36;
    G.player.ang = Math.sin(G.clock * 1.1) * 0.18;
    if ((G.clock * 0.35 | 0) % 4 === 2 && G.player.loopT <= 0 && G.player.loopCd <= 0) {
      G.player.loopT = LOOP_DUR;
      G.player.loopCd = 1.4;
      G.player.loopCx = G.player.x;
      G.player.loopCy = G.player.y;
    }
    if (G.player.loopT > 0) {
      G.player.loopT -= dt;
      const u = 1 - Math.max(0, G.player.loopT) / LOOP_DUR;
      G.player.loopA = u * TAU;
      G.player.x = G.player.loopCx + LOOP_R * Math.sin(G.player.loopA);
      G.player.y = G.player.loopCy - LOOP_R * (1 - Math.cos(G.player.loopA));
      G.player.ang = -G.player.loopA;
      if (G.player.loopT <= 0) G.player.ang = 0;
    }
    G.player.loopCd = Math.max(0, G.player.loopCd - dt);
    updateFx(dt);
  }

  function updatePlayer(dt) {
    const p = G.player;
    p.prop += dt * 26;
    p.loopCd = Math.max(0, p.loopCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    G.fireCd = Math.max(0, G.fireCd - dt);
    const cruise = scrollSpd();

    if (p.loopT > 0) {
      p.loopT -= dt;
      const u = 1 - Math.max(0, p.loopT) / LOOP_DUR;
      p.loopA = u * TAU;
      p.loopCx += cruise * dt;
      p.x = p.loopCx + LOOP_R * Math.sin(p.loopA);
      p.y = p.loopCy - LOOP_R * (1 - Math.cos(p.loopA));
      p.ang = -p.loopA;
      if (!REDUCE && (G.t * 60 | 0) % 2 === 0) {
        emit(1, {
          x: p.x, y: p.y, j: 3,
          vx0: -40, vx1: 20, vy0: -20, vy1: 40,
          life: 0.22, r0: 1, r1: 2.4, rgb: CYN, g: 40
        });
      }
      if (p.loopT <= 0) {
        p.loopT = 0;
        p.ang = 0;
        p.x = p.loopCx;
        p.y = p.loopCy;
      }
    } else {
      let ax = 0;
      let ay = 0;
      if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
        const tx = G.cam + clamp(pointer.x, 40, VW - 40);
        const ty = clamp(pointer.y, 28, GROUND - 20);
        ax = clamp(tx - p.x, -1, 1);
        ay = clamp(ty - p.y, -1, 1);
        const dx = tx - p.x;
        const dy = ty - p.y;
        if (Math.abs(dx) > 8) ax = dx > 0 ? 1 : -1;
        else ax = dx / 8;
        if (Math.abs(dy) > 8) ay = dy > 0 ? 1 : -1;
        else ay = dy / 8;
      } else {
        if (keys.l) ax -= 1;
        if (keys.r) ax += 1;
        if (keys.u) ay -= 1;
        if (keys.d) ay += 1;
      }
      const spd = plySpd();
      p.x += (cruise + ax * spd) * dt;
      p.y += ay * spd * dt;
      p.ang = lerp(p.ang, ay * 0.28, clamp(dt * 8, 0, 1));
    }

    const minX = G.cam + 48;
    const maxX = G.cam + VW - 70;
    p.x = clamp(p.x, minX, maxX);
    p.y = clamp(p.y, 24, GROUND - 8);

    if (G.fireHold) fire();

    G.engT -= dt;
    if (G.engT <= 0 && G.mode === 'play' && G.deadT <= 0) {
      G.engT = 0.086;
      audio.prop();
    }

    const g = groundAt(p.x);
    if (p.y + 9 >= g) die('撞上地面');
  }

  function updateCam(dt) {
    const cruise = scrollSpd();
    G.cam += cruise * dt;
    if (G.boss && G.boss.hp > 0) {
      const maxCam = G.boss.x - VW + 260;
      if (G.cam > maxCam) G.cam = maxCam;
    }
    const endCam = G.worldEnd - VW * 0.55;
    if (G.cam > endCam) G.cam = endCam;
    if (G.player.x < G.cam + 48) G.player.x = G.cam + 48;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y > GROUND + 8 || vx(s.x) > VW + 30 || vx(s.x) < -30) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.dead || en.hp <= 0) continue;
        const dx = s.x - en.x;
        const dy = s.y - en.y;
        const rr = en.r + 4;
        if (dx * dx + dy * dy < rr * rr) {
          en.hp -= 1;
          en.flash = 0.08;
          hit = true;
          emit(5, {
            x: s.x, y: s.y, j: 4,
            vx0: -80, vx1: 80, vy0: -120, vy1: 40,
            life: 0.18, r0: 1, r1: 2.2, rgb: WHT, g: 200
          });
          if (en.hp <= 0) killEnt(en, false);
          else {
            audio.hit(G.combo);
            hitStop(0.018);
          }
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y > GROUND + 12 || vx(s.x) < -40 || vx(s.x) > VW + 40) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT > 0 || G.invuln > 0 || looping()) continue;
      const dx = s.x - G.player.x;
      const dy = s.y - G.player.y;
      const rr = 8 + s.r;
      if (dx * dx + dy * dy < rr * rr) {
        G.eShots.splice(i, 1);
        die(s.bomb ? '被航弹击中' : '被击落');
      }
    }
  }

  function updateFlags() {
    const p = G.player;
    const grabR = looping() ? 28 : 20;
    for (let i = 0; i < G.flags.length; i++) {
      const fl = G.flags[i];
      if (fl.taken) continue;
      if (fl.x < G.cam - 40 || fl.x > G.cam + VW + 40) continue;
      fl.wave += 0.08;
      const fy = groundAt(fl.x) - 46;
      const dx = p.x - fl.x;
      const dy = p.y - fy;
      if (dx * dx + dy * dy < grabR * grabR) grabFlag(fl);
    }
  }

  function aimShot(en, spd, lead) {
    const p = G.player;
    let tx = p.x;
    let ty = p.y;
    if (lead) {
      const t = hypot(p.x - en.x, p.y - en.y) / spd;
      tx += (isCore() ? 1 : 0.45) * t * 40;
    }
    const dx = tx - en.x;
    const dy = ty - en.y;
    const d = Math.max(8, hypot(dx, dy));
    enemyShot(en.x, en.y - 6, dx / d * spd, dy / d * spd, 3.4);
  }

  function updateEnts(dt) {
    const p = G.player;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.dead || en.hp <= 0) {
        if (en.type === 'core') {
          en.hp = 0;
          en.dead = true;
          continue;
        }
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      en.flash = Math.max(0, en.flash - dt);
      if (en.x < G.cam - 80 && en.type !== 'core' && en.type !== 'turret') {
        G.ents.splice(i, 1);
        continue;
      }
      if (en.ground && en.type !== 'core' && en.type !== 'turret') {
        if (en.type !== 'tower') en.y = groundAt(en.x) - en.h * 0.45;
      }
      if (en.type === 'scout' || en.type === 'ace') {
        en.x += (en.vx - scrollSpd() * 0.15) * dt;
        en.y += Math.sin(en.t * (en.type === 'ace' ? 4.2 : 2.4) + en.phase) * (en.type === 'ace' ? 70 : 36) * dt;
        en.y = clamp(en.y, 30, groundAt(en.x) - 28);
        en.fireCd -= dt;
        if (en.fireCd <= 0 && vx(en.x) > 40 && vx(en.x) < VW - 20) {
          en.fireCd = (en.type === 'ace' ? 0.7 : 1.15) * (isCore() ? 0.78 : 1);
          aimShot(en, en.type === 'ace' ? 220 : 180, en.type === 'ace');
        }
      } else if (en.type === 'dive') {
        if (en.t < 0.35) en.vy = 30;
        else {
          const dx = p.x - en.x;
          const dy = p.y - en.y;
          const d = Math.max(20, hypot(dx, dy));
          en.vx = lerp(en.vx, dx / d * 210, dt * 2.2);
          en.vy = lerp(en.vy, dy / d * 210, dt * 2.2);
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.y > groundAt(en.x) - 8) {
          juice(en.x, en.y, en.rgb, 0.6);
          en.dead = true;
          continue;
        }
      } else if (en.type === 'bomber') {
        en.x += en.vx * dt;
        en.y += Math.sin(en.t * 1.4) * 18 * dt;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && vx(en.x) > 60 && vx(en.x) < VW - 40) {
          en.fireCd = isCore() ? 0.72 : 1.05;
          G.eShots.push({
            x: en.x, y: en.y + 10, vx: -20, vy: 160, life: 2.2, r: 4.4, bomb: true
          });
        }
      } else if (en.type === 'bird') {
        en.x += en.vx * dt;
        en.y += Math.sin(en.t * 6 + en.phase) * 50 * dt;
      } else if (en.type === 'tank') {
        en.fireCd -= dt;
        if (en.fireCd <= 0 && vx(en.x) > 20 && vx(en.x) < VW - 20) {
          en.fireCd = (isCore() ? 1.05 : 1.45) + rand(0, 0.3);
          enemyShot(en.x, en.y - 10, rand(-30, 30), -210, 3.6);
        }
      } else if (en.type === 'aa') {
        en.fireCd -= dt;
        if (en.fireCd <= 0 && vx(en.x) > 10 && vx(en.x) < VW) {
          en.fireCd = (isCore() ? 0.72 : 1.05) + rand(0, 0.25);
          aimShot(en, isCore() ? 240 : 190, true);
        }
      } else if (en.type === 'turret') {
        if (G.boss) {
          en.x = G.boss.x + en.ox;
          en.y = G.boss.y + en.oy;
        }
        en.fireCd -= dt;
        if (en.fireCd <= 0 && vx(en.x) > 0) {
          en.fireCd = isCore() ? 0.62 : 0.88;
          aimShot(en, 230, true);
          if (isCore() && Math.random() < 0.4) {
            aimShot(en, 190, false);
          }
        }
      } else if (en.type === 'core') {
        if (en.hp <= 0) continue;
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          en.fireCd = isCore() ? 0.85 : 1.15;
          const n = isCore() ? 7 : 5;
          for (let k = 0; k < n; k++) {
            const a = -1.15 + k * (2.3 / Math.max(1, n - 1));
            enemyShot(en.x, en.y - 20, Math.cos(a) * -40 + Math.sin(a) * 160, Math.cos(a) * -180, 3.8);
          }
        }
      }

      if (G.deadT > 0 || G.invuln > 0) continue;
      const dx = p.x - en.x;
      const dy = p.y - en.y;
      const rr = 9 + en.r * 0.78;
      if (dx * dx + dy * dy < rr * rr) {
        if (looping() && !en.ground) {
          killEnt(en, true);
          continue;
        }
        if (en.ground && (en.type === 'tower' || en.type === 'core' || en.type === 'turret')) {
          die(en.type === 'tower' ? '撞上塔楼' : '撞上云堡');
        } else if (!en.ground) {
          die(en.type === 'bird' ? '撞上鸟群' : '撞上敌机');
        } else if (en.type === 'tank' || en.type === 'aa') {
          die('撞上地面火力');
        }
      }
    }
  }

  function updateSpawns(dt) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    G.spawnT -= dt;
    if (G.boss && G.boss.hp > 0 && G.cam + VW > G.boss.x - 80) {
      if (G.spawnT <= 0) {
        G.spawnT = isCore() ? 1.5 : 2.2;
        spawnScout(G.cam + VW + 28, 70 + Math.random() * 160, { vx: -90 });
      }
      return;
    }
    if (G.spawnT > 0) return;
    G.spawnT = (isCore() ? 0.82 : 1.22) - G.stage * 0.08;
    const r = Math.random();
    const x = G.cam + VW + 24;
    if (r < 0.42) {
      spawnScout(x, 70 + Math.random() * 180);
    } else if (r < 0.6) {
      spawnScout(x, 90 + Math.random() * 80, { ace: true, vx: -110 });
    } else if (r < 0.74) {
      spawnScout(x, 80);
      spawnScout(x + 26, 118, { vx: -74 });
      spawnScout(x + 52, 156, { vx: -74 });
    } else if (r < 0.86) {
      spawnDive(G.cam + 220 + Math.random() * 360);
    } else if (r < 0.94) {
      spawnBomber(x, 60 + Math.random() * 70);
    } else {
      spawnBirds(x, 90 + Math.random() * 120);
    }
  }

  function updateStage() {
    const idx = currentStageIndex(G.player.x);
    if (idx > G.stage && G.stage < STAGES.length - 1) {
      nextStage();
    }
    if (G.stage === 2 && G.boss && G.boss.hp > 0 && G.cam + VW > G.boss.x - 40 && !G.boss.announced) {
      G.boss.announced = true;
      toast('云堡来了', true, false);
      audio.boss();
      syncHud();
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.25);
      return;
    }
    if (G.mode === 'title') {
      updateTitle(dt);
      return;
    }
    updateFx(dt);
    if (G.mode !== 'play') return;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      G.cam += scrollSpd() * 0.35 * dt;
      updateEnts(dt);
      updateShots(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseGame();
        else respawn();
      }
      return;
    }
    if (G.winT > 0) {
      G.winT -= dt;
      updateCam(dt);
      updateEnts(dt);
      updateShots(dt);
      if (G.winT <= 0) winGame();
      return;
    }
    updateCam(dt);
    updatePlayer(dt);
    if (G.deadT > 0) return;
    updateSpawns(dt);
    updateEnts(dt);
    updateShots(dt);
    updateFlags();
    updateStage();
    if ((G.t * 8 | 0) !== ((G.t - dt) * 8 | 0)) syncHud();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (G.stage >= 2) {
      g.addColorStop(0, '#081018');
      g.addColorStop(0.45, '#0c1a28');
      g.addColorStop(1, '#06141c');
    } else if (G.stage === 1) {
      g.addColorStop(0, '#071824');
      g.addColorStop(0.5, '#0a2030');
      g.addColorStop(1, '#07161e');
    } else {
      g.addColorStop(0, '#082030');
      g.addColorStop(0.55, '#0a2434');
      g.addColorStop(1, '#071820');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.t * 2.2 + i);
      ctx.fillStyle = rgba(WHT, s.a * tw * 0.7);
      ctx.fillRect(sx(s.x), sy(s.y), s.s * scale, s.s * scale);
    }

    const sunX = sx(VW * 0.82);
    const sunY = sy(58);
    const grd = ctx.createRadialGradient(sunX, sunY, 4 * scale, sunX, sunY, 70 * scale);
    grd.addColorStop(0, rgba(GOLD, 0.45));
    grd.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 70 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 9 * scale, 0, TAU);
    ctx.fill();

    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      const cx = ((c.x - G.cam * c.z) % 1400 + 1400) % 1400 - 80;
      ctx.fillStyle = rgba(SKY, c.a);
      ctx.beginPath();
      ctx.ellipse(sx(cx), sy(c.y), c.w * 0.55 * scale, 12 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(sx(cx + c.w * 0.25), sy(c.y - 6), c.w * 0.32 * scale, 10 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawGround() {
    const step = 10;
    const x0 = G.cam - 20;
    const x1 = G.cam + VW + 20;
    ctx.beginPath();
    ctx.moveTo(sx(vx(x0)), sy(VH + 8));
    for (let x = x0; x <= x1; x += step) {
      ctx.lineTo(sx(vx(x)), sy(groundAt(x)));
    }
    ctx.lineTo(sx(vx(x1)), sy(VH + 8));
    ctx.closePath();
    const gg = ctx.createLinearGradient(0, sy(280), 0, sy(VH));
    gg.addColorStop(0, '#0c2a28');
    gg.addColorStop(0.4, '#0a2430');
    gg.addColorStop(1, '#061018');
    ctx.fillStyle = gg;
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.55);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    for (let x = x0; x <= x1; x += step) {
      const y = groundAt(x);
      if (x === x0) ctx.moveTo(sx(vx(x)), sy(y));
      else ctx.lineTo(sx(vx(x)), sy(y));
    }
    ctx.stroke();

    ctx.save();
    ctx.strokeStyle = rgba(GRN, 0.18);
    ctx.lineWidth = 1;
    for (let x = x0; x <= x1; x += 28) {
      const gx = ((x / 28) | 0) * 28;
      const gy = groundAt(gx);
      const h = 6 + hash2((gx / 28) | 0) * 10;
      ctx.beginPath();
      ctx.moveTo(sx(vx(gx)), sy(gy));
      ctx.lineTo(sx(vx(gx) + 2), sy(gy - h));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFlag(fl) {
    if (fl.taken) return;
    const x = vx(fl.x);
    if (x < -20 || x > VW + 20) return;
    const gy = groundAt(fl.x);
    const poleH = 52;
    const fx = sx(x);
    const fy = sy(gy);
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx, fy - poleH * scale);
    ctx.stroke();
    const wave = Math.sin(G.t * 6 + fl.wave) * 4;
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.shadowColor = rgba(MAG, 0.55);
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(fx + 1, fy - poleH * scale);
    ctx.lineTo(fx + (16 + wave) * scale, fy - (poleH - 8) * scale);
    ctx.lineTo(fx + 1, fy - (poleH - 16) * scale);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawPlane(x, y, ang, enemy, a, flashHit, kind) {
    ctx.save();
    ctx.translate(sx(vx(x)), sy(y));
    ctx.rotate(ang || 0);
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    const body = enemy ? (kind === 'ace' ? GOLD : kind === 'bomber' ? PNK : MAG) : CYN;
    const flash = flashHit || (!enemy && G.muzzle > 0);
    ctx.shadowColor = rgba(body, 0.6);
    ctx.shadowBlur = 12;
    ctx.strokeStyle = rgba(WHT, 0.35);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-11, -7);
    ctx.lineTo(8, -7);
    ctx.moveTo(-10, 6);
    ctx.lineTo(9, 6);
    ctx.stroke();
    ctx.strokeStyle = rgba(body, 0.95);
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-10, -4);
    ctx.lineTo(7, -4);
    ctx.moveTo(-9, 3.4);
    ctx.lineTo(8, 3.4);
    ctx.stroke();
    ctx.fillStyle = flash ? '#e8ffff' : rgba(body, 0.96);
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.quadraticCurveTo(-8, -5.5, 4, -3.2);
    ctx.lineTo(12, 0);
    ctx.lineTo(4, 3.2);
    ctx.quadraticCurveTo(-8, 5.5, -14, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.beginPath();
    ctx.ellipse(5.4, -0.4, 2.3, 2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.fillRect(-13.5, -1.2, 4.2, 2.4);
    const prop = enemy ? G.t * 22 : G.player.prop;
    ctx.strokeStyle = rgba(WHT, 0.55);
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(12, -6.5 * Math.sin(prop));
    ctx.lineTo(12, 6.5 * Math.sin(prop));
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.beginPath();
    ctx.moveTo(12, -5.5 * Math.cos(prop * 1.3));
    ctx.lineTo(12, 5.5 * Math.cos(prop * 1.3));
    ctx.stroke();
    if (!enemy && G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.moveTo(12, -2.2);
      ctx.lineTo(22, 0);
      ctx.lineTo(12, 2.2);
      ctx.fill();
    }
    if (!enemy && looping()) {
      ctx.strokeStyle = rgba(SKY, 0.55);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnt(en) {
    const x = vx(en.x);
    if (x < -50 || x > VW + 50) return;
    const flash = en.flash > 0;
    if (en.type === 'scout' || en.type === 'ace' || en.type === 'dive') {
      drawPlane(en.x, en.y, en.type === 'dive' ? Math.atan2(en.vy, en.vx || -1) : 0, true, 1, flash, en.type);
      return;
    }
    if (en.type === 'bird') {
      ctx.save();
      ctx.translate(sx(x), sy(en.y));
      ctx.scale(scale, scale);
      ctx.strokeStyle = rgba(WHT, 0.9);
      ctx.lineWidth = 1.3;
      const w = Math.sin(G.t * 10 + en.phase) * 5;
      ctx.beginPath();
      ctx.moveTo(-6, w * 0.2);
      ctx.quadraticCurveTo(-2, -w, 0, 0);
      ctx.quadraticCurveTo(2, -w, 6, w * 0.2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (en.type === 'bomber') {
      ctx.save();
      ctx.translate(sx(x), sy(en.y));
      ctx.scale(scale, scale);
      ctx.fillStyle = flash ? '#fff' : rgba(PNK, 0.95);
      ctx.shadowColor = rgba(PNK, 0.5);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 6, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-6, -8, 12, 5);
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(sx(x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(1, en.h * 0.42, en.w * 0.42, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
    ctx.shadowColor = rgba(en.rgb, 0.45);
    ctx.shadowBlur = 8;
    if (en.type === 'tank') {
      ctx.fillRect(-12, -6, 24, 10);
      ctx.fillStyle = flash ? '#fff' : rgba(ORG, 0.9);
      ctx.fillRect(-4, -12, 8, 8);
      ctx.fillRect(2, -16, 10, 3);
    } else if (en.type === 'aa') {
      ctx.fillRect(-9, -4, 18, 10);
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(6, -16);
      ctx.stroke();
    } else if (en.type === 'tower') {
      ctx.fillStyle = flash ? '#fff' : '#163044';
      ctx.fillRect(-10, -28, 20, 40);
      ctx.fillStyle = rgba(CYN, 0.5);
      ctx.fillRect(-6, -18, 5, 6);
      ctx.fillRect(2, -10, 5, 6);
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.fillRect(-12, -32, 24, 6);
    } else if (en.type === 'turret') {
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.85);
      ctx.lineWidth = 2;
      const a = Math.atan2(G.player.y - en.y, G.player.x - en.x);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
      ctx.stroke();
    } else if (en.type === 'core') {
      ctx.fillStyle = flash ? '#fff' : '#1a2838';
      ctx.fillRect(-48, -40, 96, 86);
      ctx.fillStyle = rgba(CYN, 0.22);
      ctx.fillRect(-40, -28, 22, 28);
      ctx.fillRect(18, -28, 22, 28);
      ctx.fillStyle = flash ? '#fff' : rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(-16, -52);
      ctx.lineTo(0, -78);
      ctx.lineTo(16, -52);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.7);
      ctx.fillRect(-8, -18, 16, 22);
      const ratio = clamp(en.hp / en.maxHp, 0, 1);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(-30, 36, 60, 5);
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(-30, 36, 60 * ratio, 5);
    }
    ctx.restore();
  }

  function drawShots() {
    ctx.save();
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.shadowColor = rgba(GOLD, 0.7);
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(sx(vx(s.x)), sy(s.y), 5.5 * scale, 1.8 * scale, Math.atan2(s.vy, s.vx), 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.fillStyle = s.bomb ? rgba(ORG, 0.95) : rgba(MAG, 0.92);
      ctx.beginPath();
      ctx.arc(sx(vx(s.x)), sy(s.y), (s.r || 3) * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(vx(p.x)), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(vx(s.x)), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(vx(s.x)), sy(s.y), (s.r + s.t * 22) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI", "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, a);
      ctx.fillText(f.text, sx(vx(f.x)), sy(f.y));
    }
  }

  function drawBossBar() {
    if (!G.boss || G.boss.hp <= 0 || G.mode !== 'play') return;
    if (vx(G.boss.x) > VW + 40) return;
    const x = sx(VW * 0.5 - 110);
    const y = sy(16);
    const w = 220 * scale;
    ctx.fillStyle = 'rgba(6,22,32,0.7)';
    ctx.fillRect(x, y, w, 10 * scale);
    ctx.fillStyle = rgba(MAG, 0.85);
    ctx.fillRect(x, y, w * clamp(G.boss.hp / G.boss.maxHp, 0, 1), 10 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.7);
    ctx.strokeRect(x, y, w, 10 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = '700 ' + (10 * scale) + 'px "Segoe UI", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('云堡', sx(VW * 0.5), sy(14));
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#041018';
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
    drawSky();
    drawGround();
    for (let i = 0; i < G.flags.length; i++) drawFlag(G.flags[i]);
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawParticles();
    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawPlane(G.player.x, G.player.y, G.player.ang, false, 1, false, 'kid');
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
    G.flags.length = 0;
    G.hills.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    G.boss = null;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'kid';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.stage = 0;
    G.cam = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.flagsGot = 0;
    G.stageFlags = 0;
    G.player.x = 150;
    G.player.y = 210;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.ang = 0;
    G.player.loopT = 0;
    G.player.loopCd = 0;
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
    G.nextLife = LIFE_EVERY;
    G.winT = 0;
    G.why = '';
    G.engT = 0;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedSky();
    buildWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '云核 · 弹更密' : '空孩 · 草原', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'kid';
    G.stage = 0;
    G.lives = LIVES;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.cam = 0;
    G.player.x = 170;
    G.player.y = 200;
    G.player.loopT = 0;
    G.player.loopCd = 0;
    G.flagsGot = 0;
    G.score = 0;
    clearField();
    seedSky();
    buildWorld();
    if (scoreEl) scoreEl.textContent = '0';
    showOverlay(
      'title',
      '空孩',
      '横版双翼机。向右飞、开枪、翻跟头夺旗。擦地坠毁。草原峡谷之后打云堡。不是时飞环飞，也不是纵版空霸。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('kid');
    else startGame(G.kind || 'kid');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('kid');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else goTitle();
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const isLoop = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight';

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
    if (k === '1') {
      if (overlayOpen()) primaryAction();
      return;
    }
    if (k === '2') {
      if (overlayOpen()) secondaryAction();
      return;
    }
    if (isLoop) {
      if (G.mode === 'play') tryLoop();
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
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
  }

  function bindPad(el, onDown, onUp) {
    if (!el) return;
    const down = function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      el.classList.add('on');
      if (onDown) onDown();
    };
    const up = function (e) {
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('on');
      if (onUp) onUp();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
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

  if (btnKid) {
    btnKid.addEventListener('click', function () {
      audio.ensure();
      startGame('kid');
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
      startGame(G.kind);
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
  if (btnLoop) {
    btnLoop.addEventListener('click', function () {
      audio.ensure();
      tryLoop();
    });
  }

  bindPad(padLeft, function () { keys.l = true; inputSrc = 'key'; }, function () { keys.l = false; });
  bindPad(padRight, function () { keys.r = true; inputSrc = 'key'; }, function () { keys.r = false; });
  bindPad(padUp, function () { keys.u = true; inputSrc = 'key'; }, function () { keys.u = false; });
  bindPad(padDown, function () { keys.d = true; inputSrc = 'key'; }, function () { keys.d = false; });
  bindPad(padFire, function () { G.fireHold = true; fire(); }, function () { G.fireHold = false; });
  bindPad(padLoop, function () { tryLoop(); }, null);

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
