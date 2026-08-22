'use strict';

(function () {
  const VW = 720;
  const VH = 400;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const GROUND = 332;
  const MAG = 30;
  const HP_MAX = 100;
  const FIRE_CD = 0.068;
  const RELOAD_T = 0.9;
  const NADE_MAX = 8;
  const COMBO_WIN = 1.65;
  const BEST_KEY = 'playbox-wolf-gun-best';
  const MUTE_KEY = 'playbox-wolf-gun-mute';
  const OPS = '按住开火 · 右键 / 空仓点击 / E 换弹 · C 手雷 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAGC = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 176, 30];
  const HOT2 = [255, 213, 106];
  const WHT = [246, 243, 255];
  const CREAM = [236, 214, 186];
  const OLIVE = [72, 96, 54];
  const OLIVE2 = [48, 68, 40];
  const SKIN = [214, 168, 126];

  const SCORE = {
    soldier: 100,
    gunner: 180,
    runner: 140,
    jeep: 420,
    heli: 700,
    boss: 2500,
    crate: 80
  };

  const STAGES = [
    {
      id: 'camp', name: '营地', tag: 'CAMP', len: 2380, spd: 58,
      sky0: [16, 8, 24], sky1: [62, 28, 16], far: [48, 30, 38],
      mid: [32, 44, 26], ground: [42, 32, 20], accent: HOT, fog: 0.1
    },
    {
      id: 'village', name: '村落', tag: 'TOWN', len: 2520, spd: 60,
      sky0: [20, 10, 32], sky1: [70, 32, 28], far: [58, 34, 42],
      mid: [46, 36, 30], ground: [52, 38, 26], accent: [255, 140, 70], fog: 0.08
    },
    {
      id: 'jungle', name: '密林', tag: 'JUNGLE', len: 2680, spd: 62,
      sky0: [8, 16, 18], sky1: [18, 36, 28], far: [16, 40, 28],
      mid: [18, 52, 32], ground: [28, 38, 20], accent: [46, 207, 106], fog: 0.16
    },
    {
      id: 'airport', name: '机场', tag: 'AIR', len: 2860, spd: 64,
      sky0: [8, 10, 28], sky1: [18, 22, 48], far: [24, 28, 52],
      mid: [30, 34, 48], ground: [28, 28, 34], accent: CYN, fog: 0.12
    }
  ];

  const SLOTS = [
    { x: 92, y: 248, z: 0.82 },
    { x: 198, y: 268, z: 1.02 },
    { x: 330, y: 198, z: 0.68 },
    { x: 454, y: 262, z: 0.98 },
    { x: 572, y: 236, z: 0.84 },
    { x: 648, y: 274, z: 1.08 }
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
  const btnRange = document.getElementById('btn-range');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnNade = document.getElementById('btn-nade');
  const btnReload = document.getElementById('btn-reload');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const ammoLabel = document.getElementById('ammo-label');
  const hpBar = document.getElementById('hp-bar');
  const hpWrap = document.getElementById('hp-wrap');
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
  let comboTok = 0;
  let kickTok = 0;

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: 180, id: null };
  const pips = [];
  const particles = [];
  const rings = [];
  const floats = [];
  const holes = [];
  const casings = [];
  const tracers = [];
  const inbound = [];
  const nades = [];
  const ents = [];
  const occupied = [0, 0, 0, 0, 0, 0];

  const G = {
    mode: 'title',
    kind: 'raid',
    stage: 0,
    phase: 'run',
    t: 0,
    clock: 0,
    cam: 0,
    score: 0,
    best: 0,
    bestC: 0,
    bestR: 0,
    combo: 0,
    comboT: 0,
    comboPeak: 0,
    mult: 1,
    hp: HP_MAX,
    mag: MAG,
    nades: 5,
    reload: 0,
    fireCd: 0,
    nadeCd: 0,
    emptyT: 0,
    invuln: 0,
    spawnT: 0.4,
    wave: 1,
    waveT: 0,
    kills: 0,
    rescued: 0,
    hurtHost: 0,
    trans: 0,
    hold: false,
    bossOn: false,
    aim: { x: VW * 0.5, y: 170 },
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: WHT,
    punch: 1,
    hurtFlash: 0,
    gunKick: 0,
    toastT: 0
  };

  function clamp(n, a, b) {
    return n < a ? a : n > b ? b : n;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function hypot(ax, ay) {
    return Math.sqrt(ax * ax + ay * ay);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hash(n) {
    n = ((n | 0) * 374761393) | 0;
    n = (n ^ (n >>> 13)) >>> 0;
    return n / 4294967296;
  }
  function pal() {
    return STAGES[G.kind === 'range' ? 0 : G.stage] || STAGES[0];
  }
  function isRaid() { return G.kind === 'raid'; }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function comboMul(n) {
    return 1 + Math.min(4, Math.floor(Math.max(0, n - 1) / 2));
  }
  function playing() {
    return G.mode === 'play' && !overlayOpen();
  }
  function entScale(e) {
    return 0.62 + (e.z || 1) * 0.42;
  }
  function hitR(e) {
    const s = entScale(e);
    const peek = e.peek == null ? 1 : e.peek;
    const base = e.r || 16;
    return base * s * (0.55 + peek * 0.45);
  }
  function bodyPt(e) {
    const s = entScale(e);
    if (e.kind === 'heli') return { x: e.x, y: e.y + (e.bob || 0) };
    if (e.kind === 'crate') return { x: e.x, y: e.y };
    if (e.kind === 'jeep') return { x: e.x, y: e.y - 16 * s };
    return { x: e.x, y: e.y - 22 * s };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          try { this.ctx.resume(); } catch (err) { /* ignore */ }
        }
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.42;
        this.master.connect(this.ctx.destination);
      } catch (err) {
        this.ctx = null;
        this.master = null;
      }
    },
    setMuted(m) {
      this.muted = !!m;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.42;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* ignore */ }
    },
    beep(freq, dur, type, vol, slide, delay) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime + (delay || 0);
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
    noise(dur, vol, hp, delay) {
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
      const t = this.ctx.currentTime + (delay || 0);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    },
    shot() {
      this.ensure();
      this.noise(0.055, 0.11, 420);
      this.beep(118, 0.07, 'sine', 0.07, 40);
      this.beep(62, 0.09, 'triangle', 0.045, 28);
    },
    empty() {
      this.ensure();
      this.beep(92, 0.04, 'square', 0.03);
      this.beep(70, 0.05, 'triangle', 0.02);
    },
    reload() {
      this.ensure();
      this.noise(0.06, 0.04, 1800);
      this.beep(220, 0.05, 'square', 0.03, 140);
      this.beep(160, 0.08, 'triangle', 0.035, 90, 0.07);
      this.beep(280, 0.05, 'square', 0.03, 200, 0.16);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.9, Math.max(0, combo - 1) * 0.08);
      this.noise(0.04, 0.05, 1400);
      this.beep(540 * lift, 0.06, 'square', 0.055, 880 * lift);
      this.beep(1080 * lift, 0.1, 'triangle', 0.035, 1640 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.28, 0.16, 180);
      this.beep(90, 0.22, 'triangle', 0.1, 36);
      this.beep(48, 0.3, 'sine', 0.08, 22);
      this.beep(220, 0.08, 'square', 0.04, 70);
    },
    whoosh() {
      this.ensure();
      this.noise(0.12, 0.06, 600);
      this.beep(320, 0.12, 'sawtooth', 0.03, 90);
    },
    hurt() {
      this.ensure();
      this.noise(0.1, 0.08, 500);
      this.beep(240, 0.12, 'sawtooth', 0.06, 80);
      this.beep(140, 0.18, 'triangle', 0.05, 50, 0.04);
    },
    wrong() {
      this.ensure();
      this.beep(220, 0.08, 'square', 0.06, 110);
      this.beep(110, 0.16, 'sawtooth', 0.05, 70, 0.06);
    },
    pick() {
      this.ensure();
      this.beep(660, 0.06, 'sine', 0.045, 990);
      this.beep(990, 0.1, 'triangle', 0.04, 1320, 0.05);
    },
    combo(n) {
      this.ensure();
      this.beep(392 + n * 36, 0.07, 'sine', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.03, 1176);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'sine', 0.04, 659, 0.08);
      this.beep(784, 0.16, 'triangle', 0.045, 1046, 0.16);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 660);
      this.beep(494, 0.12, 'triangle', 0.04, 880, 0.08);
    },
    win() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.05, 659);
      this.beep(659, 0.08, 'sine', 0.045, 784, 0.08);
      this.beep(784, 0.1, 'triangle', 0.05, 1046, 0.16);
      this.beep(1046, 0.22, 'sine', 0.05, 1318, 0.26);
    },
    lose() {
      this.ensure();
      this.beep(330, 0.14, 'sawtooth', 0.055, 160);
      this.beep(196, 0.3, 'triangle', 0.05, 80, 0.1);
    }
  };

  function loadBest() {
    G.bestC = 0;
    G.bestR = 0;
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      if (raw.charAt(0) === '{') {
        const o = JSON.parse(raw);
        G.bestC = (o.c | 0) || 0;
        G.bestR = (o.r | 0) || 0;
      } else {
        G.bestC = parseInt(raw, 10) || 0;
      }
    } catch (err) { /* ignore */ }
  }

  function saveBest() {
    if (isRaid()) {
      if (G.score > G.bestC) G.bestC = G.score;
    } else if (G.score > G.bestR) G.bestR = G.score;
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, r: G.bestR }));
    } catch (err) { /* ignore */ }
  }

  function modeBest() {
    return isRaid() ? G.bestC : G.bestR;
  }

  function toast(text, warn, gold) {
    if (!toastEl) return;
    toastTok += 1;
    const id = toastTok;
    toastEl.textContent = text;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    G.toastT = gold ? 1.4 : 1.0;
    setTimeout(function () {
      if (id === toastTok && G.toastT <= 0) toastEl.classList.add('hidden');
    }, 1700);
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function bumpScore(n) {
    if (!scoreAdd) return;
    addTok += 1;
    const id = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = '+' + n;
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    setTimeout(function () {
      if (id === addTok) scoreAdd.hidden = true;
    }, 700);
  }

  function bumpCombo() {
    if (!comboBox) return;
    comboTok += 1;
    comboBox.classList.remove('hot');
    void comboBox.offsetWidth;
    comboBox.classList.add('hot');
    const id = comboTok;
    setTimeout(function () {
      if (id === comboTok) comboBox.classList.remove('hot');
    }, 360);
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = NADE_MAX;
    while (pips.length < n) {
      const d = document.createElement('i');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < pips.length; i++) {
      if (i < G.nades) pips[i].className = 'pip on';
      else pips[i].className = 'pip gone';
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(modeBest());
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '狼牙';
      else if (isRaid()) stageLabel.textContent = '突袭';
      else stageLabel.textContent = '靶场';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.combo >= 6);
    }
    if (tagLabel) {
      if (G.mode === 'title') tagLabel.textContent = 'WOLF';
      else if (isRaid()) tagLabel.textContent = pal().name;
      else tagLabel.textContent = '第 ' + G.wave + ' 波';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || (G.mode === 'play' && G.hp <= 28));
      tagLabel.classList.toggle('hot', G.mode === 'win' || G.combo >= 5);
    }
    if (ammoLabel) {
      ammoLabel.textContent = G.reload > 0 ? '换弹' : ('弹 ' + G.mag);
      ammoLabel.classList.toggle('warn', G.mode === 'play' && (G.mag <= 8 || G.reload > 0));
    }
    if (hpBar) {
      const p = clamp(G.hp / HP_MAX, 0, 1);
      hpBar.style.transform = 'scaleX(' + p + ')';
    }
    if (hpWrap) {
      const track = hpWrap.querySelector('.fill-track');
      if (track) track.classList.toggle('warn', G.hp <= 28);
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 体力归零即负', 'warn');
    else if (G.mode === 'win') setHint('突袭成功 · R 再来', 'hot');
    else if (G.mag <= 0) setHint('空仓 · 点击或右键换弹', 'warn');
    else if (G.hp <= 28) setHint('重伤 · 优先打掉开枪的', 'warn');
    else if (G.combo >= 6) setHint('连击 ×' + G.mult + ' · 别断', 'hot');
    else setHint(OPS, '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'WOLF';
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

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.006));
    if (!stageEl || G.mode === 'title') return;
    kickTok += 1;
    const id = kickTok;
    stageEl.classList.remove('hit', 'die', 'boom');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls || 'hit');
    setTimeout(function () {
      if (id === kickTok) stageEl.classList.remove('hit', 'die', 'boom');
    }, 420);
  }

  function screenFlash(rgb, amt) {
    G.flash = Math.max(G.flash, amt);
    G.flashRgb = rgb;
  }

  function addScore(n) {
    if (n <= 0) return;
    G.score += n;
    bumpScore(n);
    saveBest();
    syncHud();
  }

  function floatTxt(x, y, text, rgb) {
    floats.push({ x: x, y: y - 18, text: text, t: 0, life: 0.72, rgb: rgb || GOLD });
  }

  function burst(x, y, n, rgb, spd, grav) {
    if (particles.length > 160) particles.splice(0, n);
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.3, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - rand(20, 90),
        life: rand(0.28, 0.7),
        t: 0,
        r: rand(1.4, 3.4),
        rgb: rgb,
        g: grav == null ? 240 : grav
      });
    }
  }

  function addRing(x, y, rgb) {
    rings.push({ x: x, y: y, r: 6, tr: 52, t: 0, life: 0.34, rgb: rgb });
  }

  function resetFx() {
    particles.length = 0;
    rings.length = 0;
    floats.length = 0;
    holes.length = 0;
    casings.length = 0;
    tracers.length = 0;
    inbound.length = 0;
    nades.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.hurtFlash = 0;
    G.gunKick = 0;
  }

  function clearEnts() {
    ents.length = 0;
    for (let i = 0; i < occupied.length; i++) occupied[i] = 0;
  }

  function countLive() {
    let n = 0;
    for (let i = 0; i < ents.length; i++) {
      if (!ents[i].dead && ents[i].state !== 'die') n += 1;
    }
    return n;
  }

  function freeSlot(i) {
    if (i >= 0 && i < occupied.length) occupied[i] = 0;
  }

  function takeSlot() {
    const order = [0, 1, 2, 3, 4, 5];
    for (let i = order.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = order[i];
      order[i] = order[j];
      order[j] = t;
    }
    for (let k = 0; k < order.length; k++) {
      const i = order[k];
      if (!occupied[i]) {
        occupied[i] = 1;
        return i;
      }
    }
    return -1;
  }

  function mkEnt(kind) {
    const e = {
      kind: kind,
      x: 0,
      y: GROUND,
      z: 1,
      vx: 0,
      vy: 0,
      hp: 1,
      t: 0,
      state: 'live',
      dieT: 0,
      shootT: rand(1.05, 1.85),
      facing: 1,
      peek: 1,
      hide: 0,
      flash: 0,
      bob: 0,
      slot: -1,
      boss: false,
      drop: '',
      r: 16,
      dead: false,
      fireGlow: 0,
      walk: rand(0, TAU)
    };
    if (kind === 'soldier') { e.hp = 1; e.r = 15; e.z = rand(0.86, 1.08); }
    if (kind === 'gunner') { e.hp = 2; e.r = 16; e.z = rand(0.72, 0.95); e.shootT = rand(0.45, 0.95); }
    if (kind === 'runner') { e.hp = 1; e.r = 14; e.z = rand(0.95, 1.16); }
    if (kind === 'jeep') { e.hp = 6; e.r = 30; e.z = 1.12; }
    if (kind === 'heli') { e.hp = 8; e.r = 26; e.z = rand(0.58, 0.74); }
    if (kind === 'hostage') { e.hp = 1; e.r = 15; e.z = rand(0.9, 1.08); }
    if (kind === 'crate') { e.hp = 1; e.r = 12; e.z = 1; }
    return e;
  }

  function placeCover(e) {
    const i = takeSlot();
    if (i < 0) return false;
    const s = SLOTS[i];
    e.slot = i;
    e.x = s.x + rand(-10, 10);
    e.y = s.y;
    e.z = s.z;
    e.hide = rand(0, 0.4);
    e.peek = 0.35;
    return true;
  }

  function spawnKind(kind) {
    if (G.mode === 'title' && (kind === 'hostage' || kind === 'crate' || kind === 'heli' || kind === 'jeep')) {
      kind = Math.random() < 0.5 ? 'soldier' : 'runner';
    }
    const e = mkEnt(kind);
    if (kind === 'soldier' || kind === 'gunner') {
      if (!placeCover(e)) {
        e.kind = 'runner';
        kind = 'runner';
        e.r = 14;
        e.hp = 1;
      }
    }
    if (kind === 'runner' || kind === 'hostage') {
      const left = Math.random() < 0.5;
      e.x = left ? -30 : VW + 30;
      e.y = GROUND - rand(0, 18);
      e.facing = left ? 1 : -1;
      e.vx = (left ? 1 : -1) * (kind === 'hostage' ? rand(42, 62) : rand(78, 120));
      e.z = rand(0.92, 1.14);
    }
    if (kind === 'jeep') {
      const left = Math.random() < 0.55;
      e.x = left ? -70 : VW + 70;
      e.y = GROUND + 8;
      e.facing = left ? 1 : -1;
      e.vx = (left ? 1 : -1) * rand(70, 110);
      e.shootT = rand(0.5, 1.1);
    }
    if (kind === 'heli') {
      const left = Math.random() < 0.5;
      e.x = left ? -50 : VW + 50;
      e.y = rand(64, 118);
      e.facing = left ? 1 : -1;
      e.vx = (left ? 1 : -1) * rand(36, 70);
      e.shootT = rand(0.4, 0.9);
    }
    if (kind === 'crate') {
      e.x = rand(90, VW - 90);
      e.y = rand(168, 250);
      e.drop = Math.random() < 0.34 ? 'med' : Math.random() < 0.5 ? 'nade' : 'ammo';
      e.life = 6.5;
    }
    ents.push(e);
    return e;
  }

  function spawnBoss() {
    const e = mkEnt('heli');
    e.boss = true;
    e.kind = 'heli';
    e.hp = 20;
    e.r = 34;
    e.z = 0.78;
    e.x = VW * 0.5;
    e.y = 86;
    e.vx = 70;
    e.shootT = 0.35;
    ents.push(e);
    G.bossOn = true;
    G.hold = true;
    toast('武装直升机', false, true);
    audio.stage();
    return e;
  }

  function rollKind() {
    const r = Math.random();
    const p = isRaid() ? clamp(G.cam / pal().len, 0, 1) : clamp(G.wave / 12, 0, 1);
    if (!isRaid()) {
      if (r < 0.52) return 'soldier';
      if (r < 0.74) return 'gunner';
      if (r < 0.9) return 'runner';
      if (r < 0.96) return 'jeep';
      return 'heli';
    }
    const st = G.stage;
    if (st === 0) {
      if (p > 0.7 && r < 0.1) return 'heli';
      if (r < 0.09) return 'hostage';
      if (r < 0.18) return 'jeep';
      if (r < 0.4) return 'gunner';
      if (r < 0.58) return 'runner';
      return 'soldier';
    }
    if (st === 1) {
      if (r < 0.2) return 'hostage';
      if (r < 0.5) return 'gunner';
      if (r < 0.64) return 'runner';
      if (r < 0.74) return 'jeep';
      return 'soldier';
    }
    if (st === 2) {
      if (r < 0.1) return 'hostage';
      if (r < 0.24) return 'heli';
      if (r < 0.52) return 'runner';
      if (r < 0.66) return 'gunner';
      return 'soldier';
    }
    if (r < 0.08) return 'hostage';
    if (r < 0.22) return 'heli';
    if (r < 0.4) return 'jeep';
    if (r < 0.64) return 'gunner';
    return 'soldier';
  }

  function spawnCap() {
    if (G.mode === 'title') return 5;
    if (!isRaid()) return Math.min(14, 6 + (G.wave / 2) | 0);
    return 8 + G.stage;
  }

  function spawnInterval() {
    if (G.mode === 'title') return 1.15;
    if (!isRaid()) return Math.max(0.28, 1.12 - G.wave * 0.055);
    const p = clamp(G.cam / pal().len, 0, 1);
    return Math.max(0.38, (1.28 - G.stage * 0.12) * (1 - p * 0.38));
  }

  function maybeSpawn(dt) {
    if (G.mode !== 'title' && G.mode !== 'play') return;
    if (G.trans > 0 || G.phase === 'clear') return;
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    G.spawnT = spawnInterval() * rand(0.72, 1.18);
    if (countLive() >= spawnCap()) return;
    if (G.mode === 'play' && Math.random() < 0.07 && countLive() < spawnCap()) {
      spawnKind('crate');
      return;
    }
    spawnKind(rollKind());
  }

  function hoverTarget() {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.dead || e.state === 'die') continue;
      const p = bodyPt(e);
      const d = hypot(p.x - G.aim.x, p.y - G.aim.y);
      const lim = hitR(e) + 8;
      if (d < lim && d < bestD) {
        best = e;
        bestD = d;
      }
    }
    return best;
  }

  function pickTarget(ax, ay) {
    let best = null;
    let bestD = 1e9;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.dead || e.state === 'die') continue;
      const p = bodyPt(e);
      const d = hypot(p.x - ax, p.y - ay);
      const lim = hitR(e) + 6;
      if (d < lim && d < bestD) {
        best = e;
        bestD = d;
      }
    }
    return best;
  }

  function gunOrigin() {
    return {
      x: VW * 0.5 + (G.aim.x - VW * 0.5) * 0.16,
      y: VH + 6 + G.gunKick * 8
    };
  }

  function missFx() {
    holes.push({ x: G.aim.x, y: G.aim.y, t: 0, life: 2.4 });
    burst(G.aim.x, G.aim.y, 3, HOT2, 80, 80);
  }

  function enemyShot(e) {
    if (G.mode !== 'play') return;
    e.fireGlow = 0.12;
    const p = bodyPt(e);
    const ox = p.x + (e.facing || 1) * 14;
    const oy = p.y;
    const tx = VW * 0.5 + rand(-90, 90);
    const ty = VH * 0.7 + rand(-36, 28);
    const dmg = e.boss ? 14 : e.kind === 'heli' ? 11 : e.kind === 'jeep' ? 10 : e.kind === 'gunner' ? 8 : 6;
    inbound.push({
      x: ox, y: oy, tx: tx, ty: ty, t: 0, life: 0.3,
      dmg: dmg, rgb: MAGC
    });
    burst(ox, oy, 4, HOT, 70, 40);
  }

  function hurt(dmg) {
    if (!playing() || G.invuln > 0) return;
    G.hp = Math.max(0, G.hp - dmg);
    G.invuln = 0.4;
    G.hurtFlash = 0.32;
    screenFlash(MAGC, 0.42);
    kick(7.5, 'hit');
    audio.hurt();
    syncHud();
    if (G.hp <= 0) dieNow();
  }

  function hostageHit(e) {
    e.state = 'die';
    e.dieT = 0;
    if (e.slot >= 0) freeSlot(e.slot);
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.hurtHost += 1;
    G.score = Math.max(0, G.score - 500);
    floatTxt(e.x, e.y - 30, '人质', MAGC);
    toast('误伤人质', true, false);
    screenFlash(MAGC, 0.35);
    kick(6, 'hit');
    audio.wrong();
    burst(e.x, e.y - 20, 14, MAGC, 160, 180);
    addRing(e.x, e.y - 18, MAGC);
    saveBest();
    syncHud();
  }

  function pickup(e) {
    e.dead = true;
    const kind = e.drop;
    if (kind === 'ammo') {
      G.mag = MAG;
      G.reload = 0;
      toast('弹药补满', false, true);
    } else if (kind === 'nade') {
      G.nades = Math.min(NADE_MAX, G.nades + 1);
      toast('手雷 +1', false, true);
    } else {
      G.hp = Math.min(HP_MAX, G.hp + 22);
      toast('急救 +22', false, true);
    }
    addScore(SCORE.crate);
    floatTxt(e.x, e.y, '+80', GOLD);
    burst(e.x, e.y, 12, kind === 'med' ? CYN : GOLD, 140, 120);
    addRing(e.x, e.y, GOLD);
    audio.pick();
    syncHud();
  }

  function kill(e) {
    e.state = 'die';
    e.dieT = 0;
    if (e.slot >= 0) freeSlot(e.slot);
    G.kills += 1;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.comboPeak) G.comboPeak = G.combo;
    G.mult = comboMul(G.combo);
    const key = e.boss ? 'boss' : e.kind;
    const n = Math.floor((SCORE[key] || 100) * G.mult);
    addScore(n);
    floatTxt(e.x, e.y - 28, '+' + n, e.boss ? GOLD : HOT2);
    const rgb = e.boss ? GOLD : (G.combo >= 5 ? CYN : HOT);
    burst(e.x, e.y - 22, e.boss ? 28 : 12, rgb, e.boss ? 240 : 170, 200);
    addRing(e.x, e.y - 18, rgb);
    audio.hit(G.combo);
    hitStop(e.boss ? 0.078 : 0.042 + Math.min(0.03, G.combo * 0.004));
    kick(e.boss ? 11 : 4.2, e.boss ? 'boom' : 'hit');
    screenFlash(rgb, e.boss ? 0.4 : 0.16);
    if (G.combo === 3 || G.combo === 6 || G.combo === 10) {
      audio.combo(G.combo);
      bumpCombo();
      floatTxt(e.x + 16, e.y - 44, '连击 ×' + G.mult, GOLD);
    } else bumpCombo();
    if (e.boss) {
      G.bossOn = false;
      G.hold = false;
      toast('直升机击坠', false, true);
      stageClear();
    }
    syncHud();
  }

  function damageEnt(e, dmg) {
    if (e.kind === 'hostage') {
      hostageHit(e);
      return;
    }
    if (e.kind === 'crate') {
      pickup(e);
      return;
    }
    e.hp -= dmg;
    e.flash = 0.14;
    burst(e.x, G.aim.y, 6, WHT, 90, 60);
    if (e.hp <= 0) kill(e);
    else {
      audio.hit(G.combo);
      hitStop(0.03);
      G.gunKick = 1;
    }
  }

  function tryFire() {
    if (!playing() && G.mode !== 'play') return;
    if (!playing()) return;
    if (G.reload > 0) return;
    if (G.fireCd > 0) return;
    if (G.mag <= 0) {
      audio.empty();
      G.fireCd = 0.15;
      G.emptyT = 0.18;
      return;
    }
    G.mag -= 1;
    G.fireCd = FIRE_CD;
    G.gunKick = 1;
    audio.shot();
    const g = gunOrigin();
    casings.push({
      x: g.x + 10, y: g.y - 18,
      vx: rand(60, 140), vy: rand(-220, -90),
      t: 0, life: 0.55, rot: rand(0, TAU), rv: rand(8, 16)
    });
    tracers.push({
      x0: g.x, y0: g.y - 22, x1: G.aim.x + rand(-3, 3), y1: G.aim.y + rand(-3, 3),
      t: 0, life: 0.05
    });
    const spread = G.combo >= 8 ? 2.2 : 4.4;
    const ax = G.aim.x + rand(-spread, spread);
    const ay = G.aim.y + rand(-spread * 0.6, spread * 0.6);
    const hit = pickTarget(ax, ay);
    if (hit) damageEnt(hit, 1);
    else missFx();
    if (G.mag === 0) toast('空仓 · 点击换弹', true, false);
    syncHud();
  }

  function startReload() {
    if (!playing()) return;
    if (G.reload > 0) return;
    if (G.mag >= MAG) return;
    G.reload = RELOAD_T;
    G.fireCd = RELOAD_T;
    audio.reload();
    toast('换弹', false, false);
    syncHud();
  }

  function throwNade() {
    if (!playing()) return;
    if (G.nades <= 0 || G.nadeCd > 0) return;
    G.nades -= 1;
    G.nadeCd = 0.42;
    nades.push({ x: G.aim.x, y: G.aim.y, t: 0, fuse: 0.14 });
    audio.whoosh();
    syncHud();
  }

  function boom(x, y) {
    hitStop(0.072);
    kick(13, 'boom');
    screenFlash(GOLD, 0.5);
    audio.boom();
    addRing(x, y, GOLD);
    addRing(x, y, HOT);
    burst(x, y, 32, HOT, 280, 80);
    burst(x, y, 18, GOLD, 200, 60);
    burst(x, y, 10, WHT, 160, 40);
    let n = 0;
    let host = 0;
    for (let i = 0; i < ents.length; i++) {
      const e = ents[i];
      if (e.dead || e.state === 'die') continue;
      const p = bodyPt(e);
      if (hypot(p.x - x, p.y - y) > 96) continue;
      if (e.kind === 'hostage') {
        hostageHit(e);
        host += 1;
      } else if (e.kind === 'crate') pickup(e);
      else {
        damageEnt(e, 3);
        n += 1;
      }
    }
    if (n >= 3 && host === 0) {
      const b = 120 * n;
      addScore(b);
      toast('手雷清场 ×' + n, false, true);
      floatTxt(x, y - 36, '清场 +' + b, GOLD);
    }
  }

  function dieNow() {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.hp = 0;
    saveBest();
    audio.lose();
    kick(8, 'die');
    screenFlash(MAGC, 0.55);
    hitStop(0.07);
    const lead = isRaid()
      ? (pal().name + '  ·  救 ' + G.rescued + '  ·  本局 ' + G.score + '  ·  最高 ' + modeBest())
      : ('第 ' + G.wave + ' 波  ·  本局 ' + G.score + '  ·  最高 ' + modeBest());
    showOverlay('lose', '战死', lead);
    syncHud();
  }

  function winNow() {
    G.mode = 'win';
    const bonus = 4000 + G.nades * 200 + G.hp * 15 + G.rescued * 350;
    addScore(bonus);
    saveBest();
    audio.win();
    kick(10, 'boom');
    screenFlash(GOLD, 0.5);
    const lead = '救 ' + G.rescued + '  ·  误伤 ' + G.hurtHost + '  ·  本局 ' + G.score + '  ·  最高 ' + modeBest();
    showOverlay('win', '突袭成功', lead);
    toast('机场拿下', false, true);
    syncHud();
  }

  function stageClear() {
    const bonus = 1500 + Math.floor(G.hp * 8);
    addScore(bonus);
    G.phase = 'clear';
    G.trans = 1.25;
    audio.stage();
    toast(pal().name + ' 肃清', false, true);
    if (G.stage >= 3) {
      G.trans = 0.4;
    }
  }

  function beginStage(i) {
    G.stage = i;
    G.cam = 0;
    G.hold = false;
    G.bossOn = false;
    G.phase = 'run';
    G.spawnT = 0.35;
    clearEnts();
    inbound.length = 0;
    nades.length = 0;
    toast(STAGES[i].name, false, true);
    audio.stage();
    syncHud();
  }

  function nextStage() {
    if (G.stage >= 3) {
      winNow();
      return;
    }
    beginStage(G.stage + 1);
  }

  function startGame(kind) {
    G.kind = kind === 'range' ? 'range' : 'raid';
    G.mode = 'play';
    G.score = 0;
    G.combo = 0;
    G.comboPeak = 0;
    G.mult = 1;
    G.comboT = 0;
    G.hp = HP_MAX;
    G.mag = MAG;
    G.nades = isRaid() ? 5 : 3;
    G.reload = 0;
    G.fireCd = 0;
    G.nadeCd = 0;
    G.invuln = 0.4;
    G.wave = 1;
    G.waveT = 0;
    G.kills = 0;
    G.rescued = 0;
    G.hurtHost = 0;
    G.trans = 0;
    G.spawnT = 0.28;
    G.aim.x = VW * 0.5;
    G.aim.y = 170;
    resetFx();
    hideOverlay();
    audio.start();
    if (isRaid()) beginStage(0);
    else {
      G.stage = 0;
      G.cam = 0;
      G.phase = 'run';
      G.hold = false;
      G.bossOn = false;
      clearEnts();
      toast('靶场 · 无限敌军', false, true);
      audio.stage();
    }
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 0;
    G.phase = 'run';
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.hp = HP_MAX;
    G.mag = MAG;
    G.nades = 5;
    G.reload = 0;
    G.cam = 0;
    G.hold = false;
    G.bossOn = false;
    G.wave = 1;
    resetFx();
    clearEnts();
    showOverlay('title', '狼牙', '沿线突袭。按住机枪扫射，C 丢手雷，空仓点击或右键换弹。别打人质。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }

  function updateEnt(e, dt) {
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.fireGlow > 0) e.fireGlow -= dt;
    if (e.state === 'die') {
      e.dieT += dt;
      e.y += 46 * dt;
      e.peek = Math.max(0, e.peek - dt * 2);
      if (e.dieT > 0.46) e.dead = true;
      return;
    }
    e.walk += dt * 8;
    e.bob = Math.sin(e.walk) * (e.kind === 'heli' ? 5 : 2);

    if (e.kind === 'crate') {
      e.y += Math.sin(e.t * 3.2) * 0.15;
      e.life -= dt;
      if (e.life <= 0) e.dead = true;
      return;
    }

    if (e.kind === 'hostage') {
      e.x += e.vx * dt;
      e.peek = 1;
      if (e.x < -50 || e.x > VW + 50) {
        e.dead = true;
        if (G.mode === 'play') {
          G.rescued += 1;
          const n = Math.floor(280 * G.mult);
          addScore(n);
          floatTxt(clamp(e.x, 40, VW - 40), e.y - 40, '救出 +' + n, CYN);
          audio.pick();
        }
      }
      return;
    }

    if (e.kind === 'runner' || e.kind === 'jeep') {
      e.x += e.vx * dt;
      e.peek = 1;
      if (e.x < -90 || e.x > VW + 90) {
        e.dead = true;
        if (e.slot >= 0) freeSlot(e.slot);
        return;
      }
    }

    if (e.kind === 'heli') {
      if (e.boss) {
        e.x += e.vx * dt;
        if (e.x < 90 || e.x > VW - 90) e.vx *= -1;
        e.y = 78 + Math.sin(e.t * 1.6) * 16;
      } else {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 2.2) * 12 * dt * 8;
        if (e.x < -80 || e.x > VW + 80) {
          e.dead = true;
          return;
        }
      }
      e.peek = 1;
    }

    if (e.kind === 'soldier' || e.kind === 'gunner') {
      if (G.mode === 'title' && e.t > 4.6) {
        e.dead = true;
        if (e.slot >= 0) freeSlot(e.slot);
        return;
      }
      e.hide += dt;
      const cycle = e.kind === 'gunner' ? 1.85 : 2.15;
      const show = e.kind === 'gunner' ? 1.2 : 1.05;
      const ph = e.hide % cycle;
      e.peek = ph < show ? clamp((show - Math.abs(ph - show * 0.5)) / (show * 0.25), 0.35, 1) : 0.28;
    }

    if (G.mode !== 'play') return;
    if (e.peek < 0.45 && e.kind !== 'heli' && e.kind !== 'jeep' && e.kind !== 'runner') return;
    e.shootT -= dt;
    if (e.shootT <= 0 && inbound.length < 12) {
      enemyShot(e);
      const cd = e.boss ? rand(0.42, 0.7)
        : e.kind === 'heli' ? rand(0.7, 1.15)
          : e.kind === 'jeep' ? rand(0.9, 1.4)
            : e.kind === 'gunner' ? rand(0.85, 1.35)
              : rand(1.25, 2.15);
      e.shootT = cd;
    }
  }

  function updateFx(dt) {
    G.clock += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.hurtFlash > 0) G.hurtFlash = Math.max(0, G.hurtFlash - dt * 2.2);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.35);
    if (G.gunKick > 0) G.gunKick = Math.max(0, G.gunKick - dt * 8);
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.nadeCd > 0) G.nadeCd -= dt;
    if (G.emptyT > 0) G.emptyT -= dt;

    if (G.reload > 0) {
      G.reload -= dt;
      if (G.reload <= 0) {
        G.reload = 0;
        G.mag = MAG;
        audio.reload();
        syncHud();
      }
    }

    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0 && G.combo > 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt;
      if (r.t >= r.life) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= 38 * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = holes.length - 1; i >= 0; i--) {
      holes[i].t += dt;
      if (holes[i].t >= holes[i].life) holes.splice(i, 1);
    }
    for (let i = casings.length - 1; i >= 0; i--) {
      const c = casings[i];
      c.t += dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 780 * dt;
      c.rot += c.rv * dt;
      if (c.t >= c.life) casings.splice(i, 1);
    }
    for (let i = tracers.length - 1; i >= 0; i--) {
      tracers[i].t += dt;
      if (tracers[i].t >= tracers[i].life) tracers.splice(i, 1);
    }
    for (let i = nades.length - 1; i >= 0; i--) {
      const n = nades[i];
      n.t += dt;
      if (n.t >= n.fuse) {
        boom(n.x, n.y);
        nades.splice(i, 1);
      }
    }
    for (let i = inbound.length - 1; i >= 0; i--) {
      const s = inbound[i];
      s.t += dt;
      if (s.t >= s.life) {
        hurt(s.dmg);
        burst(s.tx, s.ty, 8, MAGC, 110, 40);
        inbound.splice(i, 1);
      }
    }
  }

  function updateAim(dt) {
    const spd = 280;
    if (keys.l) G.aim.x -= spd * dt;
    if (keys.r) G.aim.x += spd * dt;
    if (keys.u) G.aim.y -= spd * dt;
    if (keys.d) G.aim.y += spd * dt;
    if (pointer.down || pointer.hover) {
      G.aim.x = pointer.x;
      G.aim.y = pointer.y;
    }
    G.aim.x = clamp(G.aim.x, 8, VW - 8);
    G.aim.y = clamp(G.aim.y, 10, VH - 18);
  }

  function update(dt) {
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.15);
      return;
    }
    G.t += dt;
    updateAim(dt);
    updateFx(dt);

    if (G.trans > 0) {
      G.trans -= dt;
      if (G.trans <= 0) {
        G.trans = 0;
        if (G.phase === 'clear') {
          if (G.stage >= 3) winNow();
          else nextStage();
        }
      }
    }

    const st = pal();
    if (G.mode === 'title' || (G.mode === 'play' && G.phase === 'run' && G.trans <= 0)) {
      if (!G.hold) {
        const spd = G.mode === 'title' ? 42 : (isRaid() ? st.spd : 50 + G.wave * 2);
        G.cam += spd * dt;
        if (G.mode === 'title' && G.cam > 2400) G.cam = 0;
      }
    }

    if (G.mode === 'play' && isRaid() && G.phase === 'run' && G.trans <= 0) {
      const p = G.cam / st.len;
      if (G.stage === 3 && p >= 0.86 && !G.bossOn && !G.hold) {
        let hasBoss = false;
        for (let i = 0; i < ents.length; i++) if (ents[i].boss && !ents[i].dead) hasBoss = true;
        if (!hasBoss) spawnBoss();
      }
      if (G.cam >= st.len && !G.hold && !G.bossOn) stageClear();
    }

    if (G.mode === 'play' && !isRaid() && G.phase === 'run') {
      G.waveT += dt;
      const need = Math.max(12, 18 - G.wave);
      if (G.waveT >= need) {
        G.waveT = 0;
        G.wave += 1;
        toast('第 ' + G.wave + ' 波', false, true);
        audio.stage();
        if (G.wave % 3 === 0) spawnKind('heli');
        syncHud();
      }
    }

    maybeSpawn(dt);

    for (let i = ents.length - 1; i >= 0; i--) {
      updateEnt(ents[i], dt);
      if (ents[i].dead) {
        if (ents[i].slot >= 0) freeSlot(ents[i].slot);
        ents.splice(i, 1);
      }
    }

    if (playing() && G.reload <= 0 && G.mag > 0 && (pointer.down || keys.fire)) tryFire();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawHills(camMul, y0, h, rgb, seed) {
    const span = 170;
    const off = (G.cam * camMul) % span;
    ctx.fillStyle = rgba(rgb, 1);
    ctx.beginPath();
    ctx.moveTo(-20, VH);
    ctx.lineTo(-20, y0);
    for (let i = -2; i < 12; i++) {
      const x = i * span - off;
      const hh = h * (0.55 + hash(seed + i + ((G.cam * camMul / span) | 0)) * 0.7);
      ctx.lineTo(x + span * 0.5, y0 - hh);
    }
    ctx.lineTo(VW + 20, y0);
    ctx.lineTo(VW + 20, VH);
    ctx.closePath();
    ctx.fill();
  }

  function drawTree(x, y, s, dark) {
    ctx.fillStyle = dark ? rgba([18, 36, 22], 1) : rgba([28, 58, 32], 1);
    ctx.fillRect(x - 3 * s, y - 18 * s, 6 * s, 22 * s);
    ctx.beginPath();
    ctx.arc(x, y - 28 * s, 16 * s, 0, TAU);
    ctx.arc(x - 12 * s, y - 18 * s, 12 * s, 0, TAU);
    ctx.arc(x + 12 * s, y - 18 * s, 12 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(pal().accent, 0.18);
    ctx.beginPath();
    ctx.arc(x + 4 * s, y - 30 * s, 7 * s, 0, TAU);
    ctx.fill();
  }

  function drawTent(x, y, s) {
    ctx.fillStyle = rgba([96, 58, 28], 1);
    ctx.beginPath();
    ctx.moveTo(x, y - 36 * s);
    ctx.lineTo(x + 28 * s, y);
    ctx.lineTo(x - 28 * s, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.35);
    ctx.fillRect(x - 5 * s, y - 18 * s, 10 * s, 18 * s);
  }

  function drawBuilding(x, y, w, h, lit) {
    ctx.fillStyle = rgba([38, 28, 42], 1);
    ctx.fillRect(x, y - h, w, h);
    ctx.fillStyle = rgba([72, 36, 32], 1);
    ctx.fillRect(x - 4, y - h - 10, w + 8, 12);
    const cols = Math.max(2, (w / 18) | 0);
    const rows = Math.max(2, (h / 22) | 0);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const on = lit || hash((x | 0) * 13 + r * 7 + c) > 0.45;
        ctx.fillStyle = on ? rgba(GOLD, 0.72) : rgba([12, 10, 18], 0.8);
        ctx.fillRect(x + 5 + c * 16, y - h + 8 + r * 18, 8, 10);
      }
    }
  }

  function drawHangar(x, y, w) {
    ctx.fillStyle = rgba([32, 40, 58], 1);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 50);
    ctx.quadraticCurveTo(x + w / 2, y - 92, x + w, y - 50);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba([8, 10, 18], 0.85);
    ctx.fillRect(x + w * 0.28, y - 28, w * 0.44, 28);
    ctx.fillStyle = rgba(CYN, 0.35);
    ctx.fillRect(x + 8, y - 8, 10, 4);
  }

  function drawWorld() {
    const st = pal();
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, rgba(st.sky0, 1));
    g.addColorStop(0.55, rgba(st.sky1, 1));
    g.addColorStop(1, rgba(st.ground, 1));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const sunX = VW * 0.78;
    const sunY = G.stage === 3 || G.kind === 'range' ? 70 : 58;
    ctx.fillStyle = rgba(G.stage === 3 ? CYN : HOT, 0.18);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 46, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(G.stage === 3 ? WHT : GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(sunX, sunY, 16, 0, TAU);
    ctx.fill();

    drawHills(0.12, 168, 70, st.far, 11);
    drawHills(0.28, 210, 54, st.mid, 29);

    const sid = isRaid() ? G.stage : 0;
    const span = sid === 3 ? 240 : 160;
    const off = (G.cam * 0.55) % span;
    const base = ((G.cam * 0.55) / span) | 0;
    for (let i = -1; i < 8; i++) {
      const x = i * span - off;
      const hsh = hash(base + i + sid * 17);
      if (sid === 0) {
        if (hsh < 0.45) drawTent(x + 40, GROUND - 8, 0.9 + hsh * 0.4);
        else if (hsh < 0.7) drawTree(x + 70, GROUND - 4, 1 + hsh, true);
        else {
          ctx.fillStyle = rgba([50, 42, 30], 1);
          ctx.fillRect(x + 20, GROUND - 70, 10, 70);
          ctx.fillStyle = rgba(HOT, 0.4);
          ctx.fillRect(x + 16, GROUND - 78, 18, 10);
        }
      } else if (sid === 1) {
        drawBuilding(x + 16, GROUND, 70 + hsh * 36, 70 + hsh * 50, hsh > 0.4);
      } else if (sid === 2) {
        drawTree(x + 24, GROUND, 1.3 + hsh, false);
        drawTree(x + 88, GROUND + 4, 0.9 + hsh * 0.6, true);
      } else {
        if (hsh < 0.5) drawHangar(x + 10, GROUND, 150);
        else drawBuilding(x + 30, GROUND, 50, 90, true);
      }
    }

    ctx.fillStyle = rgba(st.ground, 1);
    ctx.fillRect(0, GROUND, VW, VH - GROUND);
    ctx.fillStyle = rgba([0, 0, 0], 0.22);
    const dash = 48;
    const doff = G.cam % dash;
    for (let i = -1; i < 20; i++) {
      ctx.fillRect(i * dash - doff, GROUND + 8, 26, 3);
    }
    if (sid === 3) {
      ctx.fillStyle = rgba(CYN, 0.35);
      for (let i = -1; i < 16; i++) ctx.fillRect(i * 64 - (G.cam % 64), GROUND + 22, 28, 3);
    }

    ctx.fillStyle = rgba(st.accent, 0.12);
    ctx.fillRect(0, GROUND - 2, VW, 3);

    if (st.fog > 0) {
      ctx.fillStyle = rgba(st.sky1, st.fog);
      ctx.fillRect(0, GROUND - 80, VW, 90);
    }

    for (let i = 0; i < holes.length; i++) {
      const h = holes[i];
      const a = 1 - h.t / h.life;
      ctx.fillStyle = rgba([8, 6, 12], 0.55 * a);
      ctx.beginPath();
      ctx.arc(h.x, h.y, 2.2, 0, TAU);
      ctx.fill();
    }
  }

  function drawPerson(e, hostage) {
    const s = entScale(e);
    const peek = e.peek == null ? 1 : e.peek;
    const x = e.x;
    const y = e.y + e.bob;
    const f = e.facing || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = e.state === 'die' ? Math.max(0, 1 - e.dieT * 2.2) : 1;

    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 12, 4, 0, 0, TAU);
    ctx.fill();

    const rise = (1 - peek) * 22;
    ctx.translate(0, rise);

    if (hostage) {
      ctx.fillStyle = rgba([48, 52, 78], 1);
      ctx.fillRect(-6, -16, 5, 16);
      ctx.fillRect(1, -16, 5, 16);
      ctx.fillStyle = rgba(CREAM, 1);
      roundRect(-9, -34, 18, 20, 3);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.85);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = rgba(SKIN, 1);
      ctx.beginPath();
      ctx.arc(0, -42, 7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba([42, 32, 28], 1);
      ctx.beginPath();
      ctx.arc(0, -45, 7, Math.PI, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(SKIN, 1);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -30);
      ctx.lineTo(-16, -48);
      ctx.moveTo(10, -30);
      ctx.lineTo(16, -48);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(OLIVE2, 1);
      ctx.fillRect(-6, -16, 5, 16);
      ctx.fillRect(1, -16, 5, 16);
      ctx.fillStyle = rgba(OLIVE, 1);
      roundRect(-10, -36, 20, 22, 3);
      ctx.fill();
      ctx.fillStyle = rgba([36, 48, 32], 1);
      ctx.fillRect(-8, -28, 16, 6);
      ctx.fillStyle = rgba(SKIN, 1);
      ctx.beginPath();
      ctx.arc(0, -42, 6.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba([32, 44, 28], 1);
      ctx.beginPath();
      ctx.arc(0, -45, 7.2, Math.PI, TAU);
      ctx.fill();
      ctx.fillRect(-8, -46, 16, 4);
      const gunY = -24;
      ctx.save();
      ctx.translate(f * 8, gunY);
      ctx.fillStyle = rgba([22, 22, 28], 1);
      ctx.fillRect(0, -2, f * 22, 4);
      ctx.fillRect(f * 6, 2, f * 6, 6);
      if (e.fireGlow > 0) {
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.beginPath();
        ctx.arc(f * 24, 0, 5, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.fillRect(-14, -54, 28, 58);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawGunner(e) {
    const s = entScale(e);
    const x = e.x;
    const y = e.y + e.bob;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = e.state === 'die' ? Math.max(0, 1 - e.dieT * 2.2) : 1;
    ctx.fillStyle = rgba([58, 48, 28], 1);
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 8, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([70, 56, 32], 1);
    ctx.fillRect(-20, -10, 40, 10);
    const rise = (1 - e.peek) * 16;
    ctx.translate(0, rise);
    ctx.fillStyle = rgba(OLIVE, 1);
    roundRect(-10, -22, 20, 16, 3);
    ctx.fill();
    ctx.fillStyle = rgba(SKIN, 1);
    ctx.beginPath();
    ctx.arc(0, -28, 6, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([32, 44, 28], 1);
    ctx.beginPath();
    ctx.arc(0, -31, 6.5, Math.PI, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([20, 20, 26], 1);
    ctx.fillRect(6, -18, 26, 4);
    ctx.fillRect(8, -22, 8, 8);
    if (e.fireGlow > 0) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(34, -16, 6, 0, TAU);
      ctx.fill();
    }
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.5);
      ctx.fillRect(-16, -40, 48, 36);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawJeep(e) {
    const s = entScale(e);
    const x = e.x;
    const y = e.y;
    const f = e.facing || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * f, s);
    ctx.globalAlpha = e.state === 'die' ? Math.max(0, 1 - e.dieT * 2) : 1;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 34, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([48, 58, 32], 1);
    roundRect(-32, -22, 64, 22, 4);
    ctx.fill();
    ctx.fillStyle = rgba([32, 40, 24], 1);
    roundRect(-10, -36, 28, 16, 3);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(24, -16, 6, 4);
    ctx.fillStyle = '#1a1a20';
    ctx.beginPath();
    ctx.arc(-18, 4, 8, 0, TAU);
    ctx.arc(18, 4, 8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(OLIVE, 1);
    ctx.fillRect(-4, -46, 10, 12);
    ctx.fillStyle = rgba([20, 20, 26], 1);
    ctx.fillRect(4, -42, 22, 3);
    if (e.fireGlow > 0) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(28, -40, 5, 0, TAU);
      ctx.fill();
    }
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.4);
      ctx.fillRect(-34, -50, 70, 56);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawHeli(e) {
    const s = entScale(e) * (e.boss ? 1.25 : 1);
    const x = e.x;
    const y = e.y + e.bob;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = e.state === 'die' ? Math.max(0, 1 - e.dieT * 1.8) : 1;
    const rot = G.clock * (e.boss ? 28 : 22);
    ctx.strokeStyle = rgba(CYN, 0.35);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-40, -22);
    ctx.lineTo(40, -22);
    ctx.moveTo(0, -22 - 18);
    ctx.lineTo(0, -22 + 18);
    ctx.stroke();
    ctx.save();
    ctx.translate(0, -22);
    ctx.rotate(rot);
    ctx.strokeStyle = rgba(WHT, 0.45);
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(36, 0);
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = rgba(e.boss ? [48, 32, 28] : [36, 44, 52], 1);
    roundRect(-22, -18, 44, 18, 6);
    ctx.fill();
    ctx.fillRect(18, -12, 28, 5);
    ctx.fillStyle = rgba(CYN, 0.5);
    ctx.fillRect(-14, -14, 14, 8);
    ctx.strokeStyle = rgba([20, 20, 26], 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.lineTo(-18, 10);
    ctx.lineTo(18, 10);
    ctx.lineTo(14, 0);
    ctx.stroke();
    if (e.fireGlow > 0) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(0, 8, 6, 0, TAU);
      ctx.fill();
    }
    if (e.boss) {
      ctx.strokeStyle = rgba(HOT, 0.7);
      ctx.lineWidth = 1.4;
      roundRect(-24, -20, 48, 22, 6);
      ctx.stroke();
    }
    if (e.flash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(WHT, 0.45);
      ctx.fillRect(-28, -28, 56, 40);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
  }

  function drawCrate(e) {
    const s = entScale(e);
    ctx.save();
    ctx.translate(e.x, e.y + Math.sin(e.t * 4) * 3);
    ctx.scale(s, s);
    const col = e.drop === 'med' ? CYN : e.drop === 'nade' ? HOT : GOLD;
    ctx.fillStyle = rgba(col, 0.95);
    roundRect(-11, -11, 22, 22, 3);
    ctx.fill();
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.4;
    ctx.strokeRect(-7, -7, 14, 14);
    ctx.fillStyle = rgba([12, 10, 18], 0.85);
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.drop === 'med' ? '+' : e.drop === 'nade' ? 'C' : 'A', 0, 1);
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.kind === 'heli') drawHeli(e);
    else if (e.kind === 'jeep') drawJeep(e);
    else if (e.kind === 'crate') drawCrate(e);
    else if (e.kind === 'gunner') drawGunner(e);
    else drawPerson(e, e.kind === 'hostage');
  }

  function drawGun() {
    const g = gunOrigin();
    const ang = Math.atan2(G.aim.y - (g.y - 20), G.aim.x - g.x);
    ctx.save();
    ctx.translate(g.x, g.y - 8);
    ctx.rotate(ang * 0.22);
    ctx.fillStyle = rgba([16, 14, 22], 0.95);
    roundRect(-14, -16, 28, 30, 4);
    ctx.fill();
    ctx.fillStyle = rgba([28, 26, 36], 1);
    ctx.fillRect(8, -8, 46, 8);
    ctx.fillStyle = rgba(HOT, 0.8);
    ctx.fillRect(50, -6, 10, 4);
    ctx.fillStyle = rgba([40, 36, 48], 1);
    ctx.fillRect(-6, 8, 10, 16);
    ctx.fillRect(4, 4, 8, 12);
    if (G.gunKick > 0.3 && G.mag > 0 && G.reload <= 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(62, -4, 8 + G.gunKick * 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(66, -4, 4, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();

    const mx = 18;
    const my = VH - 16;
    for (let i = 0; i < MAG; i++) {
      const on = i < G.mag;
      ctx.fillStyle = on ? rgba(HOT, 0.85) : rgba([40, 30, 40], 0.4);
      ctx.fillRect(mx + i * 5.4, my, 4, 8);
    }
    if (G.reload > 0) {
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.fillRect(mx, my - 6, (1 - G.reload / RELOAD_T) * (MAG * 5.4), 3);
    }
    if (G.mag <= 0 && G.reload <= 0 && ((G.clock * 6) | 0) % 2 === 0) {
      ctx.fillStyle = rgba(MAGC, 0.95);
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('换弹!', mx, my - 10);
    }
  }

  function drawAim() {
    const over = hoverTarget();
    const hostage = over && over.kind === 'hostage';
    const rgb = hostage ? GOLD : over ? CYN : HOT;
    const pulse = 1 + Math.sin(G.clock * 11) * 0.08;
    const r = (over ? 18 : 15) * pulse;
    ctx.save();
    ctx.translate(G.aim.x, G.aim.y);
    ctx.strokeStyle = rgba(rgb, 0.95);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, TAU);
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -r - 6);
    ctx.lineTo(0, -5);
    ctx.moveTo(0, 5);
    ctx.lineTo(0, r + 6);
    ctx.moveTo(-r - 6, 0);
    ctx.lineTo(-5, 0);
    ctx.moveTo(5, 0);
    ctx.lineTo(r + 6, 0);
    ctx.stroke();
    if (hostage) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('人质', 0, -r - 10);
    }
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < tracers.length; i++) {
      const t = tracers[i];
      const a = 1 - t.t / t.life;
      ctx.strokeStyle = rgba(GOLD, 0.55 * a);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(t.x0, t.y0);
      ctx.lineTo(t.x1, t.y1);
      ctx.stroke();
    }
    for (let i = 0; i < inbound.length; i++) {
      const s = inbound[i];
      const u = s.t / s.life;
      const x = s.x + (s.tx - s.x) * u;
      const y = s.y + (s.ty - s.y) * u;
      const sz = 2 + u * 7;
      ctx.fillStyle = rgba(MAGC, 0.35 + u * 0.5);
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.5);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    for (let i = 0; i < nades.length; i++) {
      const n = nades[i];
      ctx.fillStyle = rgba(HOT, 1);
      ctx.beginPath();
      ctx.arc(n.x, n.y, 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(n.x - 1, n.y - 9, 2, 5);
    }
    for (let i = 0; i < casings.length; i++) {
      const c = casings[i];
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(-3, -1.2, 6, 2.4);
      ctx.restore();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = 1 - p.t / p.life;
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const u = r.t / r.life;
      ctx.strokeStyle = rgba(r.rgb, 1 - u);
      ctx.lineWidth = 2.4 * (1 - u);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r + (r.tr - r.r) * u, 0, TAU);
      ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function drawHudCanvas() {
    if (G.mode !== 'play') return;
    const st = pal();
    if (isRaid()) {
      const p = clamp(G.cam / st.len, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(VW * 0.25, 10, VW * 0.5, 6);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(VW * 0.25, 10, VW * 0.5 * p, 6);
      for (let i = 1; i < 4; i++) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(VW * 0.25 + VW * 0.125 * i, 9, 1.5, 8);
      }
    }
    if (G.hurtFlash > 0) {
      ctx.fillStyle = rgba(MAGC, G.hurtFlash * 0.22);
      ctx.fillRect(0, 0, VW, 18);
      ctx.fillRect(0, VH - 18, VW, 18);
      ctx.fillRect(0, 0, 18, VH);
      ctx.fillRect(VW - 18, 0, 18, VH);
    }
  }

  function drawFore() {
    const off = (G.cam * 1.05) % 90;
    const base = ((G.cam * 1.05) / 90) | 0;
    ctx.fillStyle = rgba([10, 18, 12], 0.72);
    for (let i = -1; i < 12; i++) {
      const x = i * 90 - off;
      const h = 28 + hash(base + i) * 34;
      ctx.beginPath();
      ctx.moveTo(x, VH);
      ctx.lineTo(x + 16, VH - h);
      ctx.lineTo(x + 38, VH);
      ctx.fill();
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const skx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake;
    const sky = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * 0.7;
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    ctx.translate(ox + skx, oy + sky);
    ctx.scale(scale * G.punch, scale * G.punch);
    ctx.translate((VW * (1 - G.punch)) * 0.5 / G.punch, (VH * (1 - G.punch)) * 0.5 / G.punch);

    drawWorld();

    const order = ents.slice();
    order.sort(function (a, b) {
      return (a.z - b.z) || (a.y - b.y);
    });
    for (let i = 0; i < order.length; i++) drawEnt(order[i]);

    drawFore();
    drawFx();
    drawGun();
    drawHudCanvas();
    if (G.mode !== 'title' || pointer.hover || pointer.down) drawAim();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(0, 0, VW, VH);
    }
    if (G.trans > 0.6) {
      ctx.fillStyle = 'rgba(5,3,12,' + ((G.trans - 0.6) / 0.65) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
    ctx.restore();
  }

  function pointerWorld(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (W / r.width);
    const y = (e.clientY - r.top) * (H / r.height);
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * fit) / 2;
    oy = (H - VH * fit) / 2;
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') keys.l = down;
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') keys.r = down;
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') keys.u = down;
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') keys.d = down;
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    if (space) keys.fire = down;
    if (down && (k.indexOf('Arrow') === 0 || space || k === 'Enter')) e.preventDefault();
    if (!down || e.repeat) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      restart();
      return;
    }
    if (k === 'c' || k === 'C') {
      audio.ensure();
      throwNade();
      return;
    }
    if (k === 'e' || k === 'E' || k === 'x' || k === 'X' || k === 'Control') {
      audio.ensure();
      startReload();
      return;
    }
    if (k === '1' || k === '2') {
      audio.ensure();
      if (G.mode === 'title' || overlayOpen()) {
        if (k === '1') startGame('raid');
        if (k === '2') {
          if (G.mode === 'lose' || G.mode === 'win') goTitle();
          else startGame('range');
        }
        return;
      }
    }
    if (space || k === 'Enter') {
      audio.ensure();
      if (overlayOpen()) {
        if (G.mode === 'title') startGame('raid');
        else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
        return;
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      const p = pointerWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
      G.aim.x = clamp(p.x, 8, VW - 8);
      G.aim.y = clamp(p.y, 10, VH - 18);
      if (e.button === 2) {
        startReload();
        return;
      }
      if (playing() && G.mag <= 0 && G.reload <= 0) {
        startReload();
        return;
      }
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      if (playing()) tryFire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = pointerWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
      if (pointer.down || e.pointerType === 'mouse') {
        G.aim.x = clamp(p.x, 8, VW - 8);
        G.aim.y = clamp(p.y, 10, VH - 18);
        pointer.hover = true;
      }
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () { pointer.hover = false; });
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
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) last = 0;
  });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (btnRetry) btnRetry.addEventListener('click', function () {
    audio.ensure();
    restart();
  });
  if (btnRaid) btnRaid.addEventListener('click', function () {
    audio.ensure();
    startGame('raid');
  });
  if (btnRange) btnRange.addEventListener('click', function () {
    audio.ensure();
    startGame('range');
  });
  if (ovAgain) ovAgain.addEventListener('click', function () {
    audio.ensure();
    startGame(G.kind);
  });
  if (ovMenu) ovMenu.addEventListener('click', function () {
    audio.ensure();
    goTitle();
  });
  if (btnNade) {
    btnNade.addEventListener('click', function (e) {
      e.preventDefault();
      audio.ensure();
      throwNade();
    });
  }
  if (btnReload) {
    btnReload.addEventListener('click', function (e) {
      e.preventDefault();
      audio.ensure();
      startReload();
    });
  }
  requestAnimationFrame(frame);
})();
