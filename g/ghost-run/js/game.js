'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const GY = 328;
  const MY = 256;
  const HY = 184;
  const WALK = 210;
  const AIR = 1;
  const JUMP_V = 500;
  const GRAV = 1450;
  const MAX_FALL = 580;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const INVULN = 1.45;
  const INVULN_MOON = 1.05;
  const DIE_T = 0.82;
  const BEST_KEY = 'playbox-ghost-run-best';
  const MUTE_KEY = 'playbox-ghost-run-mute';
  const OPS = '方向键 / WASD 走跳蹲 · 空格丢枪 · 下掉落 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 42, 168];
  const HOT2 = [255, 106, 196];
  const WHT = [246, 238, 246];
  const STEEL = [200, 212, 232];
  const SKIN = [232, 184, 152];
  const RED = [255, 42, 74];
  const ORG = [255, 154, 58];
  const PUR = [140, 72, 200];
  const LEAF = [61, 255, 122];

  const WPN_NAME = { lance: '长枪', dagger: '短匕', fire: '火焰', axe: '战斧' };
  const WEAPONS = {
    lance: { name: '长枪', cd: 0.2, max: 2, spd: 400, dmg: 1, grav: 0, pierce: 0, pool: 0, life: 0.86, rgb: GOLD },
    dagger: { name: '短匕', cd: 0.11, max: 3, spd: 560, dmg: 1, grav: 0, pierce: 0, pool: 0, life: 0.62, rgb: CYN },
    fire: { name: '火焰', cd: 0.28, max: 2, spd: 250, dmg: 2, grav: 760, pierce: 0, pool: 1, life: 1.7, rgb: ORG },
    axe: { name: '战斧', cd: 0.24, max: 3, spd: 310, dmg: 2, grav: 560, pierce: 3, pool: 0, life: 1.12, rgb: MAG }
  };

  const SCORE = {
    zombie: 100, bat: 150, plant: 200, archer: 500, grave: 80,
    boss: 4000, stage: 2000
  };

  const STAGES = [
    {
      name: '墓地', boss: '墓王', w: 2280, hp: 28, theme: 'grave',
      ground: [[0, 540], [640, 360], [1120, 380], [1620, 660]],
      plats: [
        [180, MY, 140], [420, MY, 160], [780, MY, 150],
        [1180, MY, 170], [1540, MY, 150], [1960, MY, 140],
        [300, HY, 120], [860, HY, 140], [1380, HY, 130], [1880, HY, 130]
      ],
      ents: [
        [260, GY, 'grave', 0, 0],
        [380, GY, 'zombie', 280, 540],
        [520, GY, 'zombie', 300, 560],
        [500, GY, 'grave', 0, 0],
        [360, HY, 'bat', 240, 460],
        [820, GY, 'zombie', 660, 980],
        [860, GY, 'grave', 0, 0],
        [820, MY, 'bat', 760, 980],
        [1020, GY, 'plant', 0, 0],
        [1280, GY, 'grave', 0, 0],
        [1240, GY, 'zombie', 1140, 1480],
        [1420, HY, 'bat', 1320, 1560],
        [1480, 140, 'archer', 1320, 1680],
        [1760, GY, 'grave', 0, 0],
        [1720, GY, 'zombie', 1640, 2100],
        [1980, MY, 'plant', 0, 0],
        [2040, HY, 'bat', 1880, 2140]
      ],
      drops: [[420, MY, 'dagger'], [1180, MY, 'armor'], [1880, HY, 'fire']]
    },
    {
      name: '沼泽', boss: '赤翼', w: 2560, hp: 36, theme: 'bog',
      ground: [[0, 460], [560, 300], [980, 340], [1460, 320], [1960, 600]],
      plats: [
        [120, MY, 140], [380, MY, 150], [700, MY, 160],
        [1080, MY, 170], [1480, MY, 160], [1860, MY, 150], [2280, MY, 140],
        [260, HY, 120], [780, HY, 140], [1260, HY, 150],
        [1720, HY, 140], [2160, HY, 150]
      ],
      ents: [
        [200, GY, 'grave', 0, 0],
        [180, GY, 'zombie', 20, 440],
        [400, MY, 'plant', 0, 0],
        [420, HY, 'bat', 260, 520],
        [720, GY, 'grave', 0, 0],
        [680, GY, 'zombie', 580, 860],
        [760, MY, 'bat', 700, 920],
        [900, 130, 'archer', 760, 1100],
        [1140, GY, 'grave', 0, 0],
        [1100, GY, 'zombie', 1000, 1300],
        [1220, MY, 'plant', 0, 0],
        [1320, HY, 'bat', 1260, 1500],
        [1560, GY, 'grave', 0, 0],
        [1520, GY, 'zombie', 1480, 1760],
        [1680, 128, 'archer', 1480, 1900],
        [1880, MY, 'bat', 1860, 2100],
        [2100, GY, 'grave', 0, 0],
        [2140, GY, 'plant', 0, 0],
        [2320, HY, 'bat', 2160, 2440],
        [2380, GY, 'zombie', 1980, 2520]
      ],
      drops: [[700, MY, 'fire'], [1260, HY, 'armor'], [1860, MY, 'axe']]
    },
    {
      name: '魔城', boss: '魔神', w: 2840, hp: 48, theme: 'fort',
      ground: [[0, 420], [520, 340], [980, 360], [1480, 300], [1940, 360], [2440, 400]],
      plats: [
        [80, MY, 130], [300, MY, 150], [620, MY, 160],
        [960, MY, 150], [1320, MY, 170], [1680, MY, 160],
        [2080, MY, 170], [2480, MY, 160],
        [220, HY, 120], [700, HY, 140], [1180, HY, 150],
        [1620, HY, 140], [2100, HY, 150], [2540, HY, 140]
      ],
      ents: [
        [180, GY, 'grave', 0, 0],
        [160, GY, 'zombie', 20, 400],
        [320, MY, 'plant', 0, 0],
        [280, HY, 'bat', 220, 420],
        [640, GY, 'grave', 0, 0],
        [600, GY, 'zombie', 540, 840],
        [680, MY, 'bat', 620, 860],
        [780, 128, 'archer', 680, 980],
        [1080, GY, 'grave', 0, 0],
        [1040, GY, 'zombie', 980, 1280],
        [1140, MY, 'plant', 0, 0],
        [1240, HY, 'bat', 1180, 1400],
        [1480, 120, 'archer', 1320, 1680],
        [1580, GY, 'grave', 0, 0],
        [1640, GY, 'zombie', 1500, 1760],
        [1760, MY, 'bat', 1680, 1920],
        [1980, GY, 'plant', 0, 0],
        [2120, GY, 'grave', 0, 0],
        [2180, 130, 'archer', 2000, 2360],
        [2280, HY, 'bat', 2100, 2400],
        [2480, GY, 'zombie', 2440, 2780],
        [2560, MY, 'plant', 0, 0],
        [2620, HY, 'bat', 2540, 2740]
      ],
      drops: [[300, MY, 'axe'], [1180, HY, 'dagger'], [1680, MY, 'armor'], [2100, HY, 'fire']]
    }
  ];

  function clamp(n, a, b) {
    return n < a ? a : n > b ? b : n;
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
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function spdMul(moon, stage) {
    return (moon ? 1.32 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    const h = jumpHeight();
    if (h < 74 || h > 96) throw new Error('jump height ' + h);
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('moon faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (!WEAPONS.lance || !WEAPONS.dagger || !WEAPONS.fire || !WEAPONS.axe) throw new Error('weapons');
    if (WEAPONS.dagger.cd >= WEAPONS.lance.cd) throw new Error('dagger faster');
    if (WEAPONS.dagger.max <= WEAPONS.lance.max) throw new Error('dagger more');
    if (!WEAPONS.fire.pool || !WEAPONS.fire.grav) throw new Error('fire arc pool');
    if (WEAPONS.axe.pierce < 2 || !WEAPONS.axe.grav) throw new Error('axe pierce arc');
    if (BEST_KEY !== 'playbox-ghost-run-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    let i, s, hasGrave, hasBat, hasArcher, hasDrop;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length) throw new Error('stage ' + s.name);
      hasGrave = false;
      hasBat = false;
      hasArcher = false;
      hasDrop = false;
      s.ents.forEach(function (e) {
        if (e[2] === 'grave') hasGrave = true;
        if (e[2] === 'bat') hasBat = true;
        if (e[2] === 'archer') hasArcher = true;
      });
      s.drops.forEach(function (d) {
        if (d[2] === 'lance' || d[2] === 'dagger' || d[2] === 'fire' || d[2] === 'axe') hasDrop = true;
      });
      if (!hasGrave || !hasBat || !hasArcher) throw new Error('ents ' + s.name);
      if (!hasDrop) throw new Error('drops ' + s.name);
    }
  }

  selfCheck();

  if (typeof document === 'undefined') return;

  const REDUCE = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

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
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const stageEl = document.getElementById('stage');
  const scoreEl = document.getElementById('score');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const bestEl = document.getElementById('best');
  const comboEl = document.getElementById('combo');
  const comboBox = document.getElementById('combo-box');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const armorLabel = document.getElementById('armor-label');
  const gunLabel = document.getElementById('gun-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const chainPop = document.getElementById('chain-pop');
  const hintEl = document.getElementById('hint');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const modeGrave = document.getElementById('mode-grave');
  const modeMoon = document.getElementById('mode-moon');
  const btnGrave = document.getElementById('btn-grave');
  const btnMoon = document.getElementById('btn-moon');

  let W = 640;
  let H = 360;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let uid = 1;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let chainTok = 0;
  let hidden = false;
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];
  const shards = [];
  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: false, u: false, d: false, fire: false };

  const G = {
    mode: 'title',
    kind: 'grave',
    stage: 1,
    levelW: 2280,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    maxCombo: 0,
    mult: 1,
    weapon: 'lance',
    armor: true,
    player: null,
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    boss: null,
    camX: 0,
    camY: 0,
    t: 0,
    clock: 0,
    stop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: WHT,
    invuln: 0,
    deadT: 0,
    fireCd: 0,
    throwT: 0,
    muzzle: 0,
    jumpBuf: 0,
    fireBuf: 0,
    dropPlat: null,
    dropT: 0,
    checkX: 70,
    checkY: GY,
    clearT: 0,
    lock: 0,
    nextLife: LIFE_EVERY,
    why: '',
    swapT: 0
  };

  function isMoon() {
    return G.kind === 'moon';
  }
  function playing() {
    return G.mode === 'play';
  }
  function live() {
    return G.mode === 'title' || G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function inL() {
    return G.mode === 'title' ? demo.l : (overlayOpen() ? false : keys.l);
  }
  function inR() {
    return G.mode === 'title' ? demo.r : (overlayOpen() ? false : keys.r);
  }
  function inU() {
    return G.mode === 'title' ? demo.u : (overlayOpen() ? false : keys.u);
  }
  function inD() {
    return G.mode === 'title' ? demo.d : (overlayOpen() ? false : keys.d);
  }
  function fireHeld() {
    return G.mode === 'title' ? demo.fire : (overlayOpen() ? false : keys.fire);
  }
  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
  }
  function invulnTime() {
    return isMoon() ? INVULN_MOON : INVULN;
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
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
    hop() {
      this.ensure();
      this.beep(260, 0.07, 'square', 0.042, 580);
    },
    land() {
      this.ensure();
      this.noise(0.04, 0.026, 480);
      this.beep(130, 0.05, 'triangle', 0.022, 70);
    },
    throw(kind) {
      this.ensure();
      if (kind === 'dagger') {
        this.beep(1320, 0.04, 'square', 0.04, 880);
        this.beep(1760, 0.05, 'triangle', 0.028, 990);
      } else if (kind === 'fire') {
        this.noise(0.09, 0.05, 260);
        this.beep(240, 0.12, 'sawtooth', 0.042, 90);
      } else if (kind === 'axe') {
        this.beep(220, 0.08, 'sawtooth', 0.046, 140);
        this.noise(0.05, 0.03, 700);
      } else {
        this.beep(720, 0.05, 'square', 0.042, 280);
        this.noise(0.025, 0.022, 1600);
      }
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.035, 0.034, 1100);
      this.beep(540 * lift, 0.06, 'square', 0.042, 920 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(170, 0.16, 'sawtooth', 0.05, 52);
    },
    shatter() {
      this.ensure();
      this.noise(0.12, 0.07, 900);
      this.beep(880, 0.06, 'square', 0.05, 220);
      this.beep(340, 0.16, 'sawtooth', 0.048, 80);
      this.beep(160, 0.2, 'triangle', 0.04, 50);
    },
    swap() {
      this.ensure();
      this.beep(523, 0.07, 'square', 0.04, 784);
      this.beep(784, 0.09, 'triangle', 0.042, 1046);
      this.beep(1046, 0.12, 'sine', 0.036, 1318);
    },
    armor() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.04, 523);
      this.beep(659, 0.12, 'triangle', 0.045, 880);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 70);
      this.beep(140, 0.32, 'sine', 0.045, 42);
    },
    boss() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.05, 90);
      this.beep(110, 0.3, 'square', 0.04, 64);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(200, 0.18, 'sawtooth', 0.04, 80);
      this.beep(120, 0.3, 'sine', 0.05, 44);
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
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.04, 784);
    },
    spawn() {
      this.ensure();
      this.beep(120, 0.1, 'sawtooth', 0.03, 70);
      this.noise(0.06, 0.03, 400);
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
    try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
  }

  function addScore(n) {
    if (!playing() || n <= 0) return;
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

  function syncModes() {
    const m = isMoon();
    if (modeGrave) modeGrave.setAttribute('aria-pressed', m ? 'false' : 'true');
    if (modeMoon) modeMoon.setAttribute('aria-pressed', m ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = isMoon() ? '赤月 ' + spec.name : spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isMoon() ? '赤月' : '墓地';
      tagLabel.classList.toggle('warn', isMoon());
      tagLabel.classList.toggle('hot', !isMoon() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = WPN_NAME[G.weapon] || '长枪';
      gunLabel.className = 'gun'
        + (G.weapon === 'dagger' ? ' dagger' : '')
        + (G.weapon === 'fire' ? ' fire' : '')
        + (G.weapon === 'axe' ? ' axe' : '');
    }
    if (armorLabel) {
      armorLabel.textContent = G.armor ? '铠甲' : '内裤';
      armorLabel.classList.toggle('bare', !G.armor);
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 铠甲碎了还能打，再挨一下丢命', 'warn');
    else if (G.mode === 'win') setHint('魔城已破 · R 再来一局', 'hot');
    else if (!G.armor) setHint('内裤 · 再挨一下丢命 · 空格丢枪', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 跳弧已锁定 · 空格丢枪', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else setHint('走跳 · 空格丢枪 · 铠甲碎了还能打', '');
    syncPips();
    syncModes();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind === 'win' || kind === 'lose');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) {
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'GHOST';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '赤月' : '换模式';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
  }

  function hitStop(sec) {
    if (REDUCE || G.mode === 'title') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag, cls) {
    if (REDUCE || G.mode === 'title') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    const c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'shatter');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash', 'shatter');
      }
    }, 420);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 6);
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
    capArr(particles, 280);
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
      t: 0, life: gold ? 0.95 : 0.68,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? 90 : 72
    });
    capArr(floats, 28);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -200 * p, vx1: 200 * p, vy0: -280 * p, vy1: -20 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.8 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.14 + p * 0.1);
    kick(2.1 + p * 2.4);
  }

  function showChain(n) {
    if (!chainPop || REDUCE) return;
    chainTok += 1;
    const tok = chainTok;
    chainPop.textContent = '×' + n;
    chainPop.classList.remove('hidden');
    chainPop.style.animation = 'none';
    void chainPop.offsetWidth;
    chainPop.style.animation = '';
    setTimeout(function () {
      if (tok === chainTok && chainPop) chainPop.classList.add('hidden');
    }, 700);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) showChain(G.combo);
    if (G.mult > prev) audio.combo(G.mult);
    syncHud();
  }

  function makePlayer(x, y) {
    return {
      x: x, y: y, vx: 0, vy: 0, face: 1,
      w: PW, h: PH, duck: false,
      grounded: true, coyote: 0,
      squash: 1, run: 0, airDir: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'grave') return 4;
    if (kind === 'plant') return 2;
    if (kind === 'archer') return 5;
    return 1;
  }

  function makeEnt(x, y, kind, a, b, extra) {
    const hp = hpOf(kind);
    const fly = kind === 'bat' || kind === 'archer';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, gun: extra || '',
      t: rand(0, 2), fire: rand(0.4, 1.4),
      spawn: rand(0.6, 1.8),
      grounded: !fly,
      dead: false, hitN: 0,
      homeY: y, homeX: x,
      emerge: 0,
      parent: 0,
      w: kind === 'grave' ? 16 : kind === 'plant' ? 16 : kind === 'archer' ? 18 : 13,
      h: kind === 'grave' ? 22 : kind === 'plant' ? 20 : kind === 'archer' ? 16 : (kind === 'bat' ? 10 : 22)
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isMoon() ? 1.22 : 1)) | 0;
    const fly = spec.boss === '赤翼';
    return {
      id: uid++,
      x: spec.w - 150, y: fly ? HY + 20 : GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss,
      t: 0, fire: 1.2, state: 'wait',
      grounded: !fly, dead: false, active: false,
      hitN: 0, w: 40, h: fly ? 28 : 46, name: spec.boss,
      homeY: fly ? HY + 20 : GY
    };
  }

  function seedMist() {
    mist.length = 0;
    let i;
    for (i = 0; i < 10; i++) {
      mist.push({
        x: rand(0, 800),
        y: rand(60, 260),
        r: rand(14, 32),
        a: rand(0.02, 0.055),
        vx: rand(8, 18)
      });
    }
  }

  function loadStage(n, attract) {
    const spec = STAGES[clamp(n, 1, STAGES.length) - 1];
    G.stage = n;
    G.levelW = spec.w;
    G.plats = [];
    let i, g, p;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0], GY, g[1], true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      p = spec.plats[i];
      G.plats.push(makePlat(p[0], p[1], p[2], false));
    }
    G.ents = [];
    for (i = 0; i < spec.ents.length; i++) {
      const e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4], e[5]));
    }
    if (isMoon() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 2 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'grave' || e[2] === 'archer') continue;
        G.ents.push(makeEnt(e[0] + 42, e[1], e[2], e[3], e[4], e[5]));
      }
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        if (isMoon() && d[2] === 'armor' && i === 0) continue;
        G.pickups.push({ x: d[0], y: d[1] - 18, kind: d[2], taken: false, t: rand(0, 3) });
      }
    }
    G.shots = [];
    G.boss = makeBoss(spec);
    G.checkX = 70;
    G.checkY = GY;
    G.player = makePlayer(70, GY);
    G.camX = 0;
    G.camY = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.45;
    G.clearT = 0;
    G.lock = 0;
    G.dropT = 0;
    G.dropPlat = null;
    G.jumpBuf = 0;
    G.fireBuf = 0;
    G.muzzle = 0;
    G.throwT = 0;
    G.swapT = 0;
    seedMist();
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
      shards.length = 0;
    }
    syncHud();
  }

  function platUnder(x, fy, ignore) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 3 || x > p.x + p.w - 3) continue;
      if (fy >= p.y - 3 && fy <= p.y + 8) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function landOn(x, y0, y1, ignore) {
    let best = null;
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      if (p === ignore) continue;
      if (x < p.x + 4 || x > p.x + p.w - 4) continue;
      if (y0 <= p.y + 2 && y1 >= p.y) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    return !!platUnder(x, y, null);
  }

  function pitAhead(x, y, face) {
    return standAt(x, y) && !standAt(x + face * 40, y);
  }

  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function pBox() {
    const p = G.player;
    const h = p.duck ? 14 : p.h;
    return { x: p.x - p.w * 0.4, y: p.y - h, w: p.w * 0.8, h: h * 0.9 };
  }

  function eBox(e) {
    return { x: e.x - e.w * 0.5, y: e.y - e.h, w: e.w, h: e.h };
  }

  function onScreen(x, pad) {
    const m = pad == null ? 40 : pad;
    return x > G.camX - m && x < G.camX + VW + m;
  }

  function countMine() {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.from === 'p' && s.life > 0 && !s.pool) n += 1;
    }
    return n;
  }

  function spawnShot(x, y, vx, vy, spec, from, kind) {
    G.shots.push({
      x: x, y: y, vx: vx, vy: vy,
      w: spec.w || 10, h: spec.h || 4,
      dmg: spec.dmg || 1, pierce: spec.pierce || 0,
      life: spec.life || 0.8, max: spec.life || 0.8,
      grav: spec.grav || 0, pool: false, wantPool: !!spec.pool,
      from: from, kind: kind, rgb: spec.rgb || GOLD,
      rot: 0, hit: {}
    });
  }

  function tryThrow() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (G.fireCd > 0) return;
    const spec = WEAPONS[G.weapon] || WEAPONS.lance;
    if (countMine() >= spec.max) return;
    G.fireBuf = 0;
    const p = G.player;
    const duck = p.duck;
    const oxp = p.x + p.face * 12;
    const oyp = p.y - (duck ? 9 : 16);
    let vx = p.face * spec.spd;
    let vy = spec.grav ? -220 : 0;
    if (spec.grav && inU() && !p.grounded) vy = -320;
    spawnShot(oxp, oyp, vx, vy, spec, 'p', G.weapon);
    G.fireCd = spec.cd;
    G.throwT = 0.14;
    G.muzzle = 0.08;
    if (playing()) {
      audio.throw(G.weapon);
      emit(4, {
        x: oxp, y: oyp, j: 4,
        vx0: vx * 0.1, vx1: vx * 0.2, vy0: -40, vy1: 20,
        life: 0.16, r0: 1, r1: 2.2, rgb: spec.rgb
      });
    }
  }

  function enemyShot(x, y, vx, vy, dmg) {
    G.shots.push({
      x: x, y: y, vx: vx, vy: vy,
      w: 7, h: 7, dmg: dmg || 1, pierce: 0,
      life: 1.6, max: 1.6, grav: 0, pool: false, wantPool: false,
      from: 'e', kind: 'ball', rgb: ORG, rot: 0, hit: {}
    });
  }

  function graveKids(id) {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].parent === id && !G.ents[i].dead) n += 1;
    }
    return n;
  }

  function spawnZombie(grave) {
    const z = makeEnt(grave.x + rand(-6, 6), grave.y, 'zombie', grave.x - 80, grave.x + 80);
    z.parent = grave.id;
    z.emerge = 0.42;
    z.vy = -90;
    z.grounded = false;
    G.ents.push(z);
    if (playing()) {
      audio.spawn();
      emit(6, {
        x: grave.x, y: grave.y - 10, j: 8,
        vx0: -50, vx1: 50, vy0: -80, vy1: -10,
        life: 0.28, r0: 1, r1: 2.4, rgb: PUR
      });
    }
  }

  function killEnt(e, silent) {
    if (e.dead) return;
    e.dead = true;
    e.hp = 0;
    const pts = (SCORE[e.kind] || 100) * G.mult;
    if (playing() && !silent) {
      bumpCombo();
      addScore(pts);
      floatText(e.x, e.y - e.h - 6, '+' + pts, GOLD, G.mult >= 2);
      juice(e.x, e.y - e.h * 0.5, e.kind === 'archer' ? RED : MAG, e.kind === 'archer' ? 1.4 : 0.9);
      audio.hit(G.combo);
      hitStop(e.kind === 'archer' ? 0.07 : 0.045);
    }
  }

  function hurtEnt(e, dmg, sx0, sy0) {
    if (e.dead || e.emerge > 0) return false;
    e.hp -= dmg;
    e.hitN = 0.12;
    if (e.hp <= 0) {
      killEnt(e, false);
      return true;
    }
    emit(4, {
      x: sx0, y: sy0, j: 4,
      vx0: -80, vx1: 80, vy0: -120, vy1: -10,
      life: 0.18, r0: 1, r1: 2, rgb: WHT
    });
    return true;
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    if (u.kind === 'armor') {
      G.armor = true;
      audio.armor();
      toast('铠甲', false, true);
      floatText(u.x, u.y, '铠甲', STEEL, true);
      juice(u.x, u.y, STEEL, 1.1);
      if (armorLabel) {
        armorLabel.classList.remove('flash');
        void armorLabel.offsetWidth;
        armorLabel.classList.add('flash');
      }
    } else {
      G.weapon = u.kind;
      G.swapT = 0.4;
      audio.swap();
      toast(WPN_NAME[u.kind] || '武器', false, true);
      floatText(u.x, u.y, WPN_NAME[u.kind], WEAPONS[u.kind] ? WEAPONS[u.kind].rgb : GOLD, true);
      juice(u.x, u.y, WEAPONS[u.kind] ? WEAPONS[u.kind].rgb : GOLD, 1.2);
      kick(3.2, 'pickup');
      screenFlash(GOLD, 0.35);
    }
    hitStop(0.05);
    syncHud();
  }

  function shatterArmor() {
    const p = G.player;
    G.armor = false;
    G.invuln = invulnTime();
    audio.shatter();
    toast('铠甲碎了', true, false);
    floatText(p.x, p.y - 30, '碎', STEEL, true);
    hitStop(0.072);
    kick(6.4, 'shatter');
    screenFlash(STEEL, 0.55);
    popSpark(p.x, p.y - 14, STEEL, 22);
    let i;
    for (i = 0; i < 16; i++) {
      const ang = (i / 16) * TAU + rand(-0.2, 0.2);
      shards.push({
        x: p.x, y: p.y - 14,
        vx: Math.cos(ang) * rand(140, 320),
        vy: Math.sin(ang) * rand(80, 260) - 80,
        rot: rand(0, TAU),
        vr: rand(-8, 8),
        life: rand(0.45, 0.8),
        max: 0.8,
        w: rand(3, 7),
        h: rand(2, 5)
      });
    }
    emit(18, {
      x: p.x, y: p.y - 12, j: 10,
      vx0: -260, vx1: 260, vy0: -320, vy1: -20,
      life: 0.5, r0: 1.4, r1: 3.4, rgb: STEEL
    });
    if (armorLabel) {
      armorLabel.classList.remove('flash');
      void armorLabel.offsetWidth;
      armorLabel.classList.add('flash');
    }
    syncHud();
  }

  function die(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    G.why = why || 'hit';
    G.lives -= 1;
    G.deadT = DIE_T;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    audio.death();
    juice(G.player.x, G.player.y - 12, MAG, 1.6);
    hitStop(0.08);
    kick(7, 'die');
    screenFlash(MAG, 0.45);
    syncHud();
  }

  function hurtPlayer(why) {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    if (G.armor) shatterArmor();
    else die(why || 'hit');
  }

  function respawn() {
    G.player = makePlayer(G.checkX, G.checkY);
    G.armor = !isMoon();
    G.invuln = INVULN;
    G.deadT = 0;
    G.fireCd = 0.1;
    toast(G.armor ? '重生 · 铠甲' : '重生 · 内裤', true, false);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入深渊了' : G.why === 'touch' ? '撞上了' : '被击中了';
    showOverlay('lose', '被击中了', why + '。连击 ×' + G.maxCombo + ' · ' + G.score + ' 分');
    syncHud();
  }

  function goWin() {
    const bonus = isMoon() ? 6000 : 8000;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    showOverlay('win', isMoon() ? '赤月熄了' : '魔城已破',
      (isMoon() ? '赤月打穿三关。' : '墓地打穿魔城。') + G.score + ' 分 · 连击 ×' + G.maxCombo);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    const keepW = G.weapon;
    const keepA = G.armor;
    loadStage(G.stage + 1, false);
    G.weapon = keepW;
    G.armor = keepA;
    G.invuln = 1.1;
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'moon' ? 'moon' : 'grave';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.weapon = 'lance';
    G.armor = !isMoon();
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    loadStage(1, false);
    G.armor = !isMoon();
    hideOverlay();
    audio.start();
    toast(isMoon() ? '赤月 · 无甲' : STAGES[0].name, isMoon(), !isMoon());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'grave';
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.weapon = 'lance';
    G.armor = true;
    loadStage(1, true);
    G.invuln = 99;
    showOverlay('title', '魔界', '铠甲一打即碎，内裤再挨一击丢命。丢长枪，捡匕、火、斧，冲进魔城。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('grave');
    else startGame(G.kind || 'grave');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('grave');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.d = false;
    demo.fire = ((G.clock * 2.2) | 0) % 2 === 0;
    demo.u = pitAhead(p.x, p.y, 1) && p.grounded;
    if (p.x > G.levelW - 280) {
      G.player = makePlayer(70, GY);
      G.camX = 0;
      G.weapon = 'lance';
      G.armor = true;
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.4;
      p.squash = 1.15;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    if (G.lock > 0) return;

    let ax = 0;
    if (inL()) ax -= 1;
    if (inR()) ax += 1;
    if (ax) p.face = ax;

    p.duck = !!(p.grounded && inD() && !inU());
    p.h = p.duck ? 14 : PH;

    if (p.grounded) {
      p.vx = p.duck ? 0 : ax * WALK;
      p.airDir = ax;
    } else {
      p.vx = p.airDir * WALK * AIR;
    }
    if (!p.duck) p.x += p.vx * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);
    if (G.boss && G.boss.active && !G.boss.dead) {
      const minX = G.levelW - VW + 18;
      if (p.x < minX) p.x = minX;
    }

    if (inU() && !p.duck) G.jumpBuf = BUFFER;
    else G.jumpBuf -= dt;
    if (G.jumpBuf < 0) G.jumpBuf = 0;

    const canJump = (p.grounded || p.coyote > 0) && !p.duck;
    if (G.jumpBuf > 0 && canJump) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      p.airDir = ax;
      G.jumpBuf = 0;
      p.squash = 0.78;
      if (playing()) audio.hop();
      emit(5, {
        x: p.x, y: p.y, j: 8,
        vx0: -60, vx1: 60, vy0: -20, vy1: 40,
        life: 0.22, r0: 1, r1: 2.2, rgb: WHT, g: 200
      });
      hitStop(0.028);
    }

    if (p.grounded && inD() && G.dropT <= 0) {
      const under = platUnder(p.x, p.y, null);
      if (under && !under.base) {
        G.dropPlat = under;
        G.dropT = 0.18;
        p.grounded = false;
        p.vy = 40;
      }
    }
    if (G.dropT > 0) G.dropT -= dt;
    if (G.dropT <= 0) G.dropPlat = null;

    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    const y0 = p.y;
    let y1 = p.y + p.vy * dt;
    p.grounded = false;
    if (p.vy >= 0) {
      const plat = landOn(p.x, y0, y1, G.dropPlat);
      if (plat) {
        y1 = plat.y;
        if (p.vy > 220 && playing()) {
          audio.land();
          p.squash = 0.82;
          emit(6, {
            x: p.x, y: p.y, j: 10,
            vx0: -80, vx1: 80, vy0: -30, vy1: 10,
            life: 0.2, r0: 1, r1: 2.4, rgb: HOT2, g: 180
          });
          kick(1.6, 'thump');
        }
        p.vy = 0;
        p.grounded = true;
        p.coyote = COYOTE;
        if (plat.base && playing()) {
          G.checkX = p.x;
          G.checkY = plat.y;
        }
      }
    }
    p.y = y1;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (p.y > VH + 90) die('fall');

    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.001, dt));
    if (ax && p.grounded && !p.duck) p.run += dt * 10;
    else p.run += dt * 2;

    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.throwT > 0) G.throwT -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.swapT > 0) G.swapT -= dt;
    if (G.fireBuf > 0) G.fireBuf -= dt;
    if (fireHeld() || G.fireBuf > 0) tryThrow();

    if (G.invuln > 0) G.invuln -= dt;

    const pb = pBox();
    let i, u;
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, u.x - 10, u.y - 10, 20, 20)) takePickup(u);
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    const mul = spdMul(isMoon(), G.stage);
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    if (!onScreen(e.x, 80) && e.kind !== 'grave') return;

    if (e.emerge > 0) {
      e.emerge -= dt;
      e.vy += GRAV * dt;
      e.y += e.vy * dt;
      const plat = landOn(e.x, e.y - 4, e.y, null);
      if (plat) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      }
      return;
    }

    if (e.kind === 'grave') {
      e.spawn -= dt;
      if (e.spawn <= 0 && playing()) {
        e.spawn = (isMoon() ? 1.7 : 2.5) / Math.max(0.8, mul * 0.7);
        const cap = isMoon() ? 3 : 2;
        if (graveKids(e.id) < cap && onScreen(e.x, 20)) spawnZombie(e);
      }
      return;
    }

    if (e.kind === 'zombie') {
      const p = G.player;
      const dir = p && p.x > e.x ? 1 : -1;
      e.face = dir;
      e.vx = dir * 42 * mul;
      if (e.a && e.x < e.a) e.vx = Math.abs(e.vx);
      if (e.b && e.x > e.b) e.vx = -Math.abs(e.vx);
      e.x += e.vx * dt;
      e.vy += GRAV * dt;
      const y0 = e.y;
      e.y += e.vy * dt;
      const plat = landOn(e.x, y0, e.y, null);
      if (plat) {
        e.y = plat.y;
        e.vy = 0;
        e.grounded = true;
      } else if (e.y > VH + 40) {
        e.dead = true;
      }
    } else if (e.kind === 'bat') {
      const p = G.player;
      const dir = p && p.x > e.x ? 1 : -1;
      e.face = dir;
      e.x += dir * 36 * mul * dt;
      e.y = e.homeY + Math.sin(e.t * 3.2 + e.id) * 18;
      if (e.a && e.x < e.a) e.x = e.a;
      if (e.b && e.x > e.b) e.x = e.b;
    } else if (e.kind === 'plant') {
      e.fire -= dt;
      if (e.fire <= 0 && playing() && G.player) {
        e.fire = (isMoon() ? 1.15 : 1.55) / mul;
        const dx = G.player.x - e.x;
        const dy = G.player.y - 14 - (e.y - 12);
        const len = Math.max(40, hypot(dx, dy));
        enemyShot(e.x, e.y - 14, (dx / len) * 160 * mul, (dy / len) * 140, 1);
      }
    } else if (e.kind === 'archer') {
      const p = G.player;
      e.fire -= dt;
      const swoop = ((e.t * 0.35) % 3) > 2.15;
      if (swoop) {
        e.x += e.face * 90 * mul * dt;
        e.y += 70 * dt;
        if (e.y > GY - 40) e.y = GY - 40;
      } else {
        if (p) e.face = p.x > e.x ? 1 : -1;
        e.x += e.face * 28 * mul * dt;
        e.y = e.homeY + Math.sin(e.t * 2.1) * 16;
      }
      if (e.a && e.x < e.a) { e.x = e.a; e.face = 1; }
      if (e.b && e.x > e.b) { e.x = e.b; e.face = -1; }
      if (e.fire <= 0 && playing() && p) {
        e.fire = (isMoon() ? 1.05 : 1.45) / mul;
        const dx = p.x - e.x;
        const dy = p.y - 16 - e.y;
        const len = Math.max(40, hypot(dx, dy));
        enemyShot(e.x, e.y, (dx / len) * 180 * mul, (dy / len) * 150, 1);
      }
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0) {
      const pb = pBox();
      const eb = eBox(e);
      if (e.kind !== 'grave' && overlap(pb.x, pb.y, pb.w, pb.h, eb.x, eb.y, eb.w, eb.h)) {
        hurtPlayer('touch');
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    const p = G.player;
    const mul = spdMul(isMoon(), G.stage);
    if (b.hitN > 0) b.hitN -= dt;
    if (!b.active) {
      if (playing() && p && p.x > G.levelW - VW + 70) {
        b.active = true;
        b.state = 'idle';
        b.fire = 0.8;
        audio.boss();
        toast(b.name, false, true);
        kick(4, 'boom');
        syncHud();
      }
      return;
    }
    b.t += dt;
    b.fire -= dt;
    if (b.kind === '赤翼') {
      b.y = b.homeY + Math.sin(b.t * 1.8) * 22;
      const mid = G.levelW - VW * 0.45;
      b.x += Math.sin(b.t * 0.7) * 70 * dt * mul;
      if (b.x < G.levelW - VW + 50) b.x = G.levelW - VW + 50;
      if (b.x > G.levelW - 40) b.x = G.levelW - 40;
      if (b.fire <= 0) {
        b.fire = (b.hp < b.max * 0.4 ? 0.55 : 0.95) / mul;
        let k;
        for (k = -1; k <= 1; k++) {
          enemyShot(b.x, b.y + 8, k * 70, 160, 1);
        }
        if (b.hp < b.max * 0.5) enemyShot(b.x, b.y, (p && p.x < b.x ? -1 : 1) * 200, 40, 1);
      }
      b.face = p && p.x < b.x ? -1 : 1;
    } else {
      b.face = p && p.x < b.x ? -1 : 1;
      b.vx = b.face * (b.kind === '魔神' ? 36 : 48) * mul;
      if (((b.t * 0.4) | 0) % 2 === 0) b.x += b.vx * dt;
      const minX = G.levelW - VW + 40;
      if (b.x < minX) b.x = minX;
      if (b.x > G.levelW - 30) b.x = G.levelW - 30;
      if (b.fire <= 0) {
        b.fire = (b.hp < b.max * 0.35 ? 0.7 : 1.15) / mul;
        const dir = b.face;
        if (b.kind === '魔神') {
          enemyShot(b.x + dir * 16, b.y - 28, dir * 220, 0, 1);
          enemyShot(b.x + dir * 16, b.y - 18, dir * 190, -40, 1);
          enemyShot(b.x + dir * 16, b.y - 18, dir * 190, 50, 1);
          if (b.hp < b.max * 0.45 && Math.random() < 0.5) {
            const z = makeEnt(b.x - dir * 30, HY, 'bat', G.levelW - VW, G.levelW);
            G.ents.push(z);
          }
        } else {
          enemyShot(b.x + dir * 12, b.y - 30, dir * 160, -80, 1);
          enemyShot(b.x + dir * 12, b.y - 24, dir * 190, -20, 1);
          enemyShot(b.x + dir * 12, b.y - 18, dir * 150, 60, 1);
        }
      }
    }

    if (playing() && G.deadT <= 0 && G.invuln <= 0 && p) {
      const pb = pBox();
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        hurtPlayer('touch');
      }
    }
  }

  function bossDie() {
    const b = G.boss;
    if (!b || b.dead) return;
    b.dead = true;
    b.active = false;
    const pts = SCORE.boss * G.mult;
    bumpCombo();
    addScore(pts);
    addScore(SCORE.stage * G.stage);
    floatText(b.x, b.y - 40, '+' + pts, GOLD, true);
    juice(b.x, b.y - 20, GOLD, 2.2);
    audio.boom();
    hitStop(0.08);
    kick(6, 'boom');
    G.clearT = 1.6;
    toast(STAGES[G.stage - 1].name + ' 通关', false, true);
  }

  function hurtBoss(dmg, x, y) {
    const b = G.boss;
    if (!b || !b.active || b.dead) return false;
    b.hp -= dmg;
    b.hitN = 0.1;
    emit(5, {
      x: x, y: y, j: 6,
      vx0: -100, vx1: 100, vy0: -140, vy1: -10,
      life: 0.2, r0: 1, r1: 2.4, rgb: GOLD
    });
    if (b.hp <= 0) bossDie();
    return true;
  }

  function updateShots(dt) {
    const p = G.player;
    let i, s, j, e;
    for (i = G.shots.length - 1; i >= 0; i--) {
      s = G.shots[i];
      s.life -= dt;
      if (s.pool) {
        s.tick = (s.tick || 0) + dt;
        if (s.tick > 0.28) {
          s.hit = {};
          s.tick = 0;
        }
      } else {
        if (s.grav) s.vy += s.grav * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.rot += dt * (s.kind === 'axe' ? 12 : 4);
        if (s.wantPool && s.vy > 40) {
          const plat = landOn(s.x, s.y - 6, s.y + 4, null);
          if (plat) {
            s.pool = true;
            s.y = plat.y - 4;
            s.vx = 0;
            s.vy = 0;
            s.life = 1.35;
            s.w = 18;
            s.h = 10;
            emit(6, {
              x: s.x, y: s.y, j: 6,
              vx0: -40, vx1: 40, vy0: -60, vy1: -10,
              life: 0.25, r0: 1.4, r1: 3, rgb: ORG
            });
          }
        }
      }
      if (s.life <= 0 || s.x < G.camX - 40 || s.x > G.camX + VW + 50 || s.y < -40 || s.y > VH + 50) {
        G.shots.splice(i, 1);
        continue;
      }

      if (s.from === 'p') {
        for (j = 0; j < G.ents.length; j++) {
          e = G.ents[j];
          if (e.dead) continue;
          const eb = eBox(e);
          if (overlap(s.x - s.w * 0.5, s.y - s.h * 0.5, s.w, s.h, eb.x, eb.y, eb.w, eb.h)) {
            if (s.hit[e.id]) continue;
            s.hit[e.id] = true;
            const dead = hurtEnt(e, s.dmg, s.x, s.y);
            if (!s.pool) {
              if (s.pierce > 0) s.pierce -= 1;
              else {
                G.shots.splice(i, 1);
                s = null;
                break;
              }
            }
            if (dead && playing()) { /* scored in hurtEnt */ }
          }
        }
        if (!s) continue;
        const b = G.boss;
        if (b && b.active && !b.dead) {
          if (overlap(s.x - s.w * 0.5, s.y - s.h * 0.5, s.w, s.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
            if (!s.hit['b' + b.id]) {
              s.hit['b' + b.id] = true;
              hurtBoss(s.dmg, s.x, s.y);
              audio.hit(G.combo);
              if (!s.pool) {
                if (s.pierce > 0) s.pierce -= 1;
                else G.shots.splice(i, 1);
              }
            }
          }
        }
      } else if (playing() && p && G.deadT <= 0) {
        const pb = pBox();
        if (overlap(s.x - s.w * 0.5, s.y - s.h * 0.5, s.w, s.h, pb.x, pb.y, pb.w, pb.h)) {
          G.shots.splice(i, 1);
          hurtPlayer('shot');
        }
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    if (!p) return;
    let tx = p.x - VW * 0.38 + p.face * 48;
    if (G.boss && G.boss.active && !G.boss.dead) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.001, dt));
    let ty = 0;
    if (p.y < HY + 20) ty = p.y - HY - 10;
    ty = clamp(ty, -40, 0);
    G.camY = lerp(G.camY, ty, 1 - Math.pow(0.002, dt));
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0002, dt));
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
  }

  function updateFx(dt) {
    let i, o;
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.life -= dt;
      o.vy += (o.g || 420) * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      o = floats[i];
      o.t += dt;
      o.y -= o.vy * dt;
      if (o.t > o.life) floats.splice(i, 1);
    }
    for (i = shards.length - 1; i >= 0; i--) {
      o = shards[i];
      o.life -= dt;
      o.vy += 720 * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.rot += o.vr * dt;
      if (o.life <= 0) shards.splice(i, 1);
    }
    for (i = 0; i < mist.length; i++) {
      o = mist[i];
      o.x += o.vx * dt;
      if (o.x > G.camX + VW + 80) o.x = G.camX - 60;
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.mode === 'title' || G.mode === 'play') G.clock += dt;
    updateFx(dt);
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      updateCam(dt);
      if (G.clearT <= 0) nextStage();
      return;
    }
    if (!live()) return;
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    for (let i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updateCam(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'fort') {
      g.addColorStop(0, '#1a0614');
      g.addColorStop(0.55, '#140410');
      g.addColorStop(1, '#0c030c');
    } else if (spec.theme === 'bog') {
      g.addColorStop(0, '#100818');
      g.addColorStop(0.5, '#0c1014');
      g.addColorStop(1, '#08140e');
    } else {
      g.addColorStop(0, '#14081c');
      g.addColorStop(0.5, '#100614');
      g.addColorStop(1, '#0a0810');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 42);
    ctx.fillStyle = rgba(isMoon() ? RED : HOT, isMoon() ? 0.7 : 0.5);
    ctx.beginPath();
    ctx.arc(mx, my, (isMoon() ? 24 : 18) * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.14);
    ctx.beginPath();
    ctx.arc(mx - 6 * scale, my - 4 * scale, 8 * scale, 0, TAU);
    ctx.fill();

    let i, sx0, sy0;
    for (i = 0; i < 18; i++) {
      sx0 = sx(((hash2(i + G.stage * 3) * G.levelW) - G.camX * 0.15));
      sy0 = oy + (12 + hash2(i + 9) * 70) * scale;
      ctx.fillStyle = rgba(WHT, 0.18 + hash2(i + 2) * 0.25);
      ctx.fillRect(sx0, sy0, 1.4 * scale, 1.4 * scale);
    }
  }

  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.28;
    const base = sy(GY + 6);
    let i, x, h, w;
    for (i = -2; i < 26; i++) {
      x = sx((Math.floor((G.camX + par) / 72) + i) * 72 - par);
      h = (36 + hash2(i + 17 + G.stage * 9) * 90) * scale;
      w = (26 + hash2(i + 5) * 28) * scale;
      if (spec.theme === 'fort') {
        ctx.fillStyle = i % 3 === 0 ? '#1a0814' : '#120610';
        ctx.fillRect(x, base - h, w, h + 40 * scale);
        ctx.fillStyle = hash2(i + 3) > 0.5 ? rgba(HOT, 0.32) : rgba(GOLD, 0.16);
        ctx.fillRect(x + 6 * scale, base - h + 10 * scale, 4 * scale, 5 * scale);
        ctx.fillRect(x + 16 * scale, base - h + 22 * scale, 4 * scale, 5 * scale);
      } else {
        ctx.fillStyle = i % 2 ? '#160c18' : '#100814';
        ctx.beginPath();
        ctx.moveTo(x, base);
        ctx.lineTo(x + w * 0.5, base - h);
        ctx.lineTo(x + w, base);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(PUR, 0.22);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, base - h + 6 * scale, 8 * scale, 0, TAU);
        ctx.fill();
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(isMoon() ? RED : WHT, m.a * (isMoon() ? 1.15 : 1));
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawWater() {
    const bases = G.plats.filter(function (p) { return p.base; });
    const y = sy(GY + 10);
    ctx.fillStyle = rgba(PUR, 0.16);
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    ctx.strokeStyle = rgba(HOT, 0.35);
    ctx.lineWidth = 1.4 * scale;
    ctx.beginPath();
    let x;
    for (x = G.camX - 20; x < G.camX + VW + 20; x += 8) {
      const yy = GY + 8 + Math.sin(x * 0.08 + G.clock * 3.2) * 2.4;
      if (x === G.camX - 20) ctx.moveTo(sx(x), sy(yy));
      else ctx.lineTo(sx(x), sy(yy));
    }
    ctx.stroke();
    ctx.fillStyle = rgba(MAG, 0.08);
    let covered;
    for (x = G.camX; x < G.camX + VW; x += 18) {
      covered = false;
      for (let i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w) covered = true;
      }
      if (covered) continue;
      ctx.fillRect(sx(x), sy(GY + 4), 14 * scale, 6 * scale);
    }
  }

  function drawPlats() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      const x = sx(p.x);
      const y = sy(p.y);
      const w = p.w * scale;
      const h = p.h * scale;
      ctx.fillStyle = p.base
        ? (spec.theme === 'fort' ? '#1c0a16' : '#161018')
        : '#20141c';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.base ? HOT : GOLD, p.base ? 0.75 : 0.55);
      if (spec.theme === 'fort') ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(GOLD, 0.18);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        const n = Math.max(2, (p.w / 28) | 0);
        for (let k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(PUR, 0.28) : rgba(HOT, 0.18);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 5 * scale);
        }
      }
    }
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    ctx.save();
    ctx.translate(x, y);
    if (s.pool) {
      ctx.fillStyle = rgba(ORG, 0.35 + Math.sin(G.clock * 12) * 0.12);
      ctx.beginPath();
      ctx.ellipse(0, 0, 12 * scale, 6 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(-2 * scale, -2 * scale, 3.2 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    if (s.from === 'e') {
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 4 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(-1 * scale, -1 * scale, 1.6 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.rotate(s.kind === 'axe' ? s.rot : Math.atan2(s.vy, s.vx));
    if (s.kind === 'fire') {
      ctx.fillStyle = rgba(ORG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 5 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(-1 * scale, -1 * scale, 2.2 * scale, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'axe') {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.fillRect(-5 * scale, -5 * scale, 10 * scale, 4 * scale);
      ctx.fillRect(-1.6 * scale, -2 * scale, 3.2 * scale, 9 * scale);
      ctx.fillStyle = rgba(STEEL, 0.9);
      ctx.fillRect(-1 * scale, 2 * scale, 2 * scale, 6 * scale);
    } else if (s.kind === 'dagger') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.fillRect(-2 * scale, -1.2 * scale, 12 * scale, 2.4 * scale);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(4 * scale, -0.6 * scale, 6 * scale, 1.2 * scale);
    } else {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.fillRect(-4 * scale, -1.5 * scale, 16 * scale, 3 * scale);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(6 * scale, -0.7 * scale, 6 * scale, 1.4 * scale);
    }
    ctx.restore();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const bob = Math.sin(G.clock * 4 + u.t) * 3;
    const x = sx(u.x);
    const y = sy(u.y + bob);
    const rgb = u.kind === 'armor' ? STEEL
      : u.kind === 'dagger' ? CYN
        : u.kind === 'fire' ? ORG
          : u.kind === 'axe' ? MAG : GOLD;
    ctx.fillStyle = rgba(rgb, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.fillStyle = '#140814';
    ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const ch = u.kind === 'armor' ? '甲' : u.kind === 'dagger' ? '匕' : u.kind === 'fire' ? '火' : u.kind === 'axe' ? '斧' : '枪';
    ctx.fillText(ch, x, y + 0.5 * scale);
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (!onScreen(e.x, 24)) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const flash = e.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    const s = scale;
    if (e.kind === 'grave') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#2a1a28';
      ctx.fillRect(x - 8 * s, y - 20 * s, 16 * s, 20 * s);
      ctx.fillStyle = '#3a2438';
      ctx.fillRect(x - 10 * s, y - 24 * s, 20 * s, 6 * s);
      ctx.fillStyle = rgba(HOT, 0.45);
      ctx.fillRect(x - 3 * s, y - 16 * s, 6 * s, 4 * s);
      return;
    }
    if (e.kind === 'bat') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(PUR, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y - 6 * s, 8 * s, 4 * s, 0, 0, TAU);
      ctx.fill();
      const flap = Math.sin(G.clock * 16 + e.id) * 6 * s;
      ctx.beginPath();
      ctx.moveTo(x - 6 * s, y - 6 * s);
      ctx.lineTo(x - 16 * s, y - 10 * s - flap);
      ctx.lineTo(x - 6 * s, y - 2 * s);
      ctx.moveTo(x + 6 * s, y - 6 * s);
      ctx.lineTo(x + 16 * s, y - 10 * s + flap);
      ctx.lineTo(x + 6 * s, y - 2 * s);
      ctx.fill();
      ctx.fillStyle = rgba(RED, 0.9);
      ctx.fillRect(x - 2 * s, y - 7 * s, 1.6 * s, 1.6 * s);
      return;
    }
    if (e.kind === 'plant') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#3a1840';
      ctx.fillRect(x - 5 * s, y - 10 * s, 10 * s, 10 * s);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(x, y - 16 * s, 8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(x + e.face * 2 * s, y - 17 * s, 2.4 * s, 0, TAU);
      ctx.fill();
      return;
    }
    if (e.kind === 'archer') {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(e.face, 1);
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(RED, 0.95);
      ctx.beginPath();
      ctx.ellipse(0, -10 * s, 10 * s, 8 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(2 * s, -18 * s, 5 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(4 * s, -19 * s, 1.8 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(ORG, 0.85);
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(8 * s, -12 * s);
      ctx.lineTo(16 * s, -10 * s);
      ctx.stroke();
      const wing = Math.sin(G.clock * 8) * 4 * s;
      ctx.fillStyle = rgba(RED, 0.7);
      ctx.beginPath();
      ctx.moveTo(-4 * s, -10 * s);
      ctx.lineTo(-16 * s, -16 * s - wing);
      ctx.lineTo(-6 * s, -4 * s);
      ctx.fill();
      ctx.restore();
      return;
    }
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    const walk = Math.sin(e.t * 8) * 3 * s;
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#6a8870';
    ctx.fillRect(-5 * s, -16 * s, 10 * s, 12 * s);
    ctx.fillStyle = '#8aaa90';
    ctx.fillRect(-4 * s, -24 * s, 8 * s, 8 * s);
    ctx.fillStyle = rgba(RED, 0.8);
    ctx.fillRect(-2.4 * s, -21 * s, 2 * s, 2 * s);
    ctx.fillStyle = '#4a6858';
    ctx.fillRect(-5 * s, -6 * s, 3 * s, 6 * s + walk);
    ctx.fillRect(2 * s, -6 * s, 3 * s, 6 * s - walk);
    ctx.restore();
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active && !onScreen(b.x, 20)) return;
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    const s = scale;
    if (b.kind === '赤翼') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(RED, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y - 14 * s, 22 * s, 14 * s, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(x + b.face * 6 * s, y - 26 * s, 9 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(x + b.face * 9 * s, y - 28 * s, 2.6 * s, 0, TAU);
      ctx.fill();
      const wing = Math.sin(G.clock * 7) * 8 * s;
      ctx.fillStyle = rgba(MAG, 0.75);
      ctx.beginPath();
      ctx.moveTo(x, y - 16 * s);
      ctx.lineTo(x - 34 * s, y - 28 * s - wing);
      ctx.lineTo(x - 8 * s, y - 4 * s);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, y - 16 * s);
      ctx.lineTo(x + 34 * s, y - 28 * s + wing);
      ctx.lineTo(x + 8 * s, y - 4 * s);
      ctx.fill();
      return;
    }
    ctx.fillStyle = flash ? rgba(WHT, 0.9) : (b.kind === '魔神' ? rgba(MAG, 0.92) : '#3a3040');
    ctx.fillRect(x - 18 * s, y - 36 * s, 36 * s, 36 * s);
    ctx.fillStyle = b.kind === '魔神' ? rgba(HOT, 0.9) : '#d8d0c8';
    ctx.fillRect(x - 12 * s, y - 50 * s, 24 * s, 16 * s);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(x - 6 * s, y - 44 * s, 4 * s, 4 * s);
    ctx.fillRect(x + 4 * s, y - 44 * s, 4 * s, 4 * s);
    ctx.fillStyle = rgba(RED, 0.85);
    ctx.fillRect(x - 8 * s, y - 34 * s, 16 * s, 5 * s);
    ctx.fillStyle = rgba(PUR, 0.7);
    ctx.fillRect(x - 20 * s, y - 28 * s, 6 * s, 18 * s);
    ctx.fillRect(x + 14 * s, y - 28 * s, 6 * s, 18 * s);
  }

  function drawKnight(p) {
    if (G.invuln > 0 && playing() && ((G.t * 14) | 0) % 3 === 0) return;
    const s = scale;
    const sq = p.squash || 1;
    const duck = p.duck;
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 1.4 * s, 7.5 * s, 2.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.scale(p.face, sq);
    const leg = Math.sin(p.run || 0) * (duck ? 1 : 5) * s;
    const bodyH = duck ? 11 : 15;
    const throwOff = G.throwT > 0 ? 6 * s : 0;

    ctx.strokeStyle = rgba(G.armor ? STEEL : SKIN, 0.95);
    ctx.lineWidth = 2.2 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3 * s, -6 * s);
    ctx.lineTo(-4 * s + (p.grounded ? -leg : 2 * s), 0);
    ctx.moveTo(3 * s, -6 * s);
    ctx.lineTo(4 * s + (p.grounded ? leg : -2 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(STEEL, 0.95);
    ctx.fillRect(-5 * s, -3 * s, 3.4 * s, 3.2 * s);
    ctx.fillRect(1.6 * s, -3 * s, 3.4 * s, 3.2 * s);

    if (!G.armor) {
      ctx.fillStyle = rgba(RED, 0.98);
      ctx.fillRect(-5.8 * s, -9 * s, 11.6 * s, 6.2 * s);
      ctx.fillStyle = rgba(WHT, 0.35);
      ctx.fillRect(-2 * s, -8.4 * s, 4 * s, 2 * s);
    }

    ctx.fillStyle = rgba(G.armor ? STEEL : SKIN, 0.96);
    ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, bodyH * s);
    if (G.armor) {
      ctx.fillStyle = rgba(GOLD, 0.4);
      ctx.fillRect(-6.2 * s, -bodyH * s - 6 * s, 12.4 * s, 2 * s);
      ctx.fillStyle = rgba(HOT, 0.55);
      ctx.fillRect(-6.2 * s, -bodyH * s + 2 * s, 12.4 * s, 2 * s);
    }

    ctx.fillStyle = rgba(HOT, 0.75);
    ctx.beginPath();
    ctx.moveTo(-6 * s, -bodyH * s - 4 * s);
    ctx.lineTo(-12 * s, -bodyH * s + 6 * s);
    ctx.lineTo(-6 * s, -bodyH * s + 8 * s);
    ctx.fill();

    ctx.fillStyle = rgba(STEEL, 0.98);
    ctx.fillRect(-5.4 * s, -bodyH * s - 14 * s, 10.8 * s, 8.4 * s);
    ctx.fillStyle = '#1a1020';
    ctx.fillRect(-3.6 * s, -bodyH * s - 11 * s, 7.4 * s, 3.2 * s);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -bodyH * s - 14 * s);
    ctx.lineTo(5 * s, -bodyH * s - 20 * s);
    ctx.lineTo(2 * s, -bodyH * s - 14 * s);
    ctx.fill();

    const spec = WEAPONS[G.weapon] || WEAPONS.lance;
    ctx.fillStyle = rgba(spec.rgb, 0.95);
    ctx.fillRect(5 * s + throwOff, -bodyH * s - 2 * s, (G.weapon === 'lance' ? 12 : 8) * s, 2.2 * s);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.beginPath();
      ctx.arc(16 * s + throwOff, -bodyH * s - 1 * s, 3.4 * s, 0, TAU);
      ctx.fill();
    }

    if (G.swapT > 0) {
      ctx.strokeStyle = rgba(GOLD, G.swapT / 0.4);
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      ctx.arc(0, -12 * s, 18 * s * (1.15 - G.swapT), 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead || !playing()) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(b.name, x, y - 3 * scale);
  }

  function drawFx() {
    let i, o;
    for (i = 0; i < rings.length; i++) {
      o = rings[i];
      const k = o.t / 0.4;
      ctx.strokeStyle = rgba(o.rgb, 1 - k);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.r + k * 22) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      o = sparks[i];
      const k = 1 - o.t / 0.28;
      ctx.fillStyle = rgba(o.rgb, k);
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), (o.rad * k * 0.4) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      o = particles[i];
      ctx.fillStyle = rgba(o.rgb, clamp(o.life / o.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < shards.length; i++) {
      o = shards[i];
      ctx.save();
      ctx.translate(sx(o.x), sy(o.y));
      ctx.rotate(o.rot);
      ctx.fillStyle = rgba(STEEL, clamp(o.life / o.max, 0, 1));
      ctx.fillRect(-o.w * 0.5 * scale, -o.h * 0.5 * scale, o.w * scale, o.h * scale);
      ctx.restore();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      o = floats[i];
      const a = 1 - o.t / o.life;
      ctx.fillStyle = rgba(o.rgb, a);
      ctx.font = 'bold ' + (o.size * scale) + 'px sans-serif';
      ctx.fillText(o.text, sx(o.x), sy(o.y));
    }
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0310';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    const shx = G.shake && !REDUCE ? (hash2((G.t * 80) | 0) - 0.5) * G.shake : 0;
    const shy = G.shake && !REDUCE ? (hash2((G.t * 80 + 9) | 0) - 0.5) * G.shake : 0;
    ctx.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * scale * 0.5;
      const cy = oy + VH * scale * 0.5;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }

    drawSky();
    drawBackdrop();
    drawWater();
    drawPlats();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0) drawKnight(G.player);

    drawFx();
    drawBossBar();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(ox, oy, VW * scale, VH * scale);
    }
    ctx.restore();
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

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') {
      keys.u = down;
      if (down && live()) G.jumpBuf = BUFFER;
    }
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (space) {
      keys.fire = down;
      if (down && live()) G.fireBuf = BUFFER;
    }

    if (down && (isMove || space || k === 'Enter')) e.preventDefault();
    if (!down) return;

    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (k === '1' && G.mode === 'title') {
      startGame('grave');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('moon');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (!space) keys.fire = false;
        return;
      }
    }
  }

  function bindPad() {
    function hold(el, on, off) {
      if (!el) return;
      const down = function (e) {
        e.preventDefault();
        audio.ensure();
        el.classList.add('held');
        on();
      };
      const up = function (e) {
        e.preventDefault();
        el.classList.remove('held');
        if (off) off();
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
    }
    hold(document.getElementById('btn-left'), function () { keys.l = true; }, function () { keys.l = false; });
    hold(document.getElementById('btn-right'), function () { keys.r = true; }, function () { keys.r = false; });
    hold(document.getElementById('btn-jump'), function () { keys.u = true; if (live()) G.jumpBuf = BUFFER; }, function () { keys.u = false; });
    hold(document.getElementById('btn-duck'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(document.getElementById('btn-fire'), function () { keys.fire = true; if (live()) G.fireBuf = BUFFER; }, function () { keys.fire = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) return;
      keys.fire = true;
      if (live()) G.fireBuf = BUFFER;
    });
    canvas.addEventListener('pointerup', function () { keys.fire = false; });
    canvas.addEventListener('pointercancel', function () { keys.fire = false; });
    canvas.addEventListener('pointerleave', function () { keys.fire = false; });
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
  bindPad();

  if (btnGrave) {
    btnGrave.addEventListener('click', function () {
      audio.ensure();
      startGame('grave');
    });
  }
  if (btnMoon) {
    btnMoon.addEventListener('click', function () {
      audio.ensure();
      startGame('moon');
    });
  }
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win') startGame('moon');
      else goTitle();
    });
  }
  if (modeGrave) {
    modeGrave.addEventListener('click', function () {
      audio.ensure();
      startGame('grave');
    });
  }
  if (modeMoon) {
    modeMoon.addEventListener('click', function () {
      audio.ensure();
      startGame('moon');
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
      keys.fire = false;
    }
  });

  requestAnimationFrame(frame);
})();
