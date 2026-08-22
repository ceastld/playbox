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
  const LY = 278;
  const HY = 226;
  const WALK = 148;
  const AIR = 0.88;
  const JUMP_V = 412;
  const GRAV = 1560;
  const MAX_FALL = 520;
  const COYOTE = 0.08;
  const BUFFER = 0.1;
  const PW = 22;
  const PH = 36;
  const INVULN = 1.22;
  const DIE_T = 0.88;
  const HP_RAID = 6;
  const HP_STORM = 4;
  const BEST_KEY = 'playbox-cyber-nator-best';
  const MUTE_KEY = 'playbox-cyber-nator-mute';
  const OPS = 'WASD / 方向 走 · 上跳 · 空格射击 · 鼠标 / IJKL 转炮 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const GOLD = [255, 227, 107];
  const HOT = [0, 255, 204];
  const HOT2 = [125, 255, 224];
  const WHT = [232, 250, 246];
  const STL = [64, 96, 92];
  const IRON = [36, 56, 52];
  const RUST = [180, 92, 64];
  const GUN_NAME = { vulcan: '机炮', rapid: '连射', missile: '导弹' };
  const WEAPONS = {
    vulcan: { cd: 0.1, max: 6, spd: 580, dmg: 1, life: 0.7, rgb: HOT },
    rapid: { cd: 0.055, max: 10, spd: 640, dmg: 1, life: 0.62, rgb: CYN },
    missile: { cd: 0.28, max: 3, spd: 340, dmg: 2, life: 1.35, rgb: GOLD, homing: 220 }
  };

  const SCORE = {
    tank: 180, copter: 150, drone: 100, walker: 200,
    turret: 160, launcher: 220, boss: 4000, stage: 1500
  };

  const STAGES = [
    {
      name: '废港', boss: '岸炮', w: 2200, hp: 26, theme: 'port',
      ground: [[0, 470], [550, 230], [920, 280], [1360, 840]],
      plats: [
        [180, LY, 140], [480, LY, 170], [700, LY, 150],
        [860, HY, 120], [1080, LY, 160], [1260, HY, 140],
        [1580, LY, 180], [1840, HY, 150], [2000, LY, 140]
      ],
      drops: [
        [220, LY, 'heart'], [880, HY, 'rapid'], [1600, LY, 'missile']
      ],
      ents: [
        [240, GY, 'tank', 20, 450],
        [380, GY, 'tank', 40, 450],
        [420, 150, 'copter', 280, 560],
        [520, LY, 'turret', 0, 0],
        [720, GY, 'walker', 560, 760],
        [780, LY, 'launcher', 0, 0],
        [940, 128, 'copter', 820, 1100],
        [1040, GY, 'tank', 930, 1180],
        [1120, LY, 'turret', 0, 0],
        [1280, HY, 'drone', 1260, 1400],
        [1480, GY, 'tank', 1370, 1680],
        [1640, LY, 'walker', 1580, 1760],
        [1760, 140, 'copter', 1640, 1960],
        [1920, HY, 'turret', 0, 0],
        [2040, GY, 'launcher', 0, 0]
      ]
    },
    {
      name: '钢廊', boss: '重坦', w: 2520, hp: 34, theme: 'steel',
      ground: [[0, 420], [520, 250], [900, 260], [1320, 280], [1780, 740]],
      plats: [
        [120, LY, 140], [300, HY, 120], [440, LY, 160],
        [680, LY, 180], [740, HY, 140], [1040, LY, 160],
        [1180, HY, 150], [1480, LY, 170], [1620, HY, 140],
        [1960, LY, 180], [2140, HY, 150], [2320, LY, 150]
      ],
      drops: [
        [160, LY, 'heart'], [760, HY, 'rapid'], [1500, LY, 'missile'], [2160, HY, 'heart']
      ],
      ents: [
        [200, GY, 'tank', 20, 400],
        [240, LY, 'turret', 0, 0],
        [340, HY, 'drone', 300, 420],
        [480, 132, 'copter', 360, 620],
        [640, GY, 'walker', 530, 760],
        [720, LY, 'launcher', 0, 0],
        [820, HY, 'turret', 0, 0],
        [1080, GY, 'tank', 910, 1140],
        [1100, LY, 'walker', 1040, 1200],
        [1220, HY, 'drone', 1180, 1330],
        [1400, GY, 'tank', 1330, 1580],
        [1520, LY, 'turret', 0, 0],
        [1660, 120, 'copter', 1580, 1840],
        [1880, GY, 'walker', 1790, 2140],
        [2000, LY, 'launcher', 0, 0],
        [2180, HY, 'drone', 2140, 2290],
        [2280, GY, 'tank', 1790, 2480],
        [2360, LY, 'turret', 0, 0]
      ]
    },
    {
      name: '母舰', boss: '舰核', w: 2840, hp: 46, theme: 'ship',
      ground: [[0, 400], [500, 220], [860, 250], [1260, 240], [1660, 280], [2140, 700]],
      plats: [
        [100, LY, 140], [240, HY, 120], [400, LY, 160],
        [640, LY, 180], [700, HY, 140], [980, LY, 160],
        [1100, HY, 150], [1400, LY, 170], [1520, HY, 140],
        [1800, LY, 180], [1920, HY, 150], [2240, LY, 170],
        [2420, HY, 140], [2580, LY, 150]
      ],
      drops: [
        [140, LY, 'heart'], [720, HY, 'rapid'], [1420, LY, 'missile'],
        [1940, HY, 'heart'], [2460, HY, 'rapid']
      ],
      ents: [
        [180, GY, 'tank', 20, 380],
        [200, LY, 'walker', 100, 240],
        [280, HY, 'drone', 240, 360],
        [460, 130, 'copter', 360, 620],
        [580, GY, 'launcher', 0, 0],
        [700, LY, 'turret', 0, 0],
        [760, HY, 'drone', 700, 840],
        [1020, GY, 'tank', 870, 1100],
        [1040, LY, 'walker', 980, 1140],
        [1160, HY, 'turret', 0, 0],
        [1380, GY, 'tank', 1270, 1500],
        [1440, LY, 'launcher', 0, 0],
        [1560, 118, 'copter', 1480, 1760],
        [1720, GY, 'walker', 1670, 1920],
        [1840, LY, 'turret', 0, 0],
        [1960, HY, 'drone', 1920, 2060],
        [2200, GY, 'tank', 2150, 2500],
        [2280, LY, 'walker', 2240, 2410],
        [2460, HY, 'turret', 0, 0],
        [2600, 124, 'copter', 2480, 2720],
        [2680, GY, 'launcher', 0, 0]
      ]
    }
  ];

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
  function jumpHeight() {
    return (JUMP_V * JUMP_V) / (2 * GRAV);
  }
  function spdMul(storm, stage) {
    return (storm ? 1.26 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
  }
  function walkMul(storm) {
    return storm ? 1.1 : 1;
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
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function norm(dx, dy) {
    const l = hypot(dx, dy) || 1;
    return { dx: dx / l, dy: dy / l };
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - LY < 46 || GY - LY > 56) throw new Error('crate height');
    if (LY - HY < 48 || LY - HY > 56) throw new Error('catwalk height');
    const h = jumpHeight();
    if (h < 48 || h > 62) throw new Error('jump height ' + h);
    if (h < GY - LY - 2) throw new Error('jump must reach crate');
    if (h < LY - HY - 2) throw new Error('jump crate to catwalk');
    if (h > GY - HY - 20) throw new Error('jump must not reach catwalk from ground');
    if (WALK >= 180) throw new Error('walk should be heavy');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('storm faster');
    if (walkMul(true) <= walkMul(false)) throw new Error('storm walk');
    if (HP_STORM >= HP_RAID) throw new Error('storm hp');
    if (PW < 18 || PH < 30) throw new Error('mech bulky');
    if (BEST_KEY !== 'playbox-cyber-nator-best') throw new Error('best key');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (!WEAPONS.vulcan || !WEAPONS.rapid || !WEAPONS.missile) throw new Error('guns');
    if (WEAPONS.rapid.cd >= WEAPONS.vulcan.cd) throw new Error('rapid faster');
    if (WEAPONS.missile.dmg < 2) throw new Error('missile dmg');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length || !s.plats.length) throw new Error('stage ' + s.name);
      let air = 0;
      let ground = 0;
      let k, e, ok, q, g0, p;
      for (k = 0; k < s.ents.length; k++) {
        e = s.ents[k];
        if (e[2] === 'copter' || e[2] === 'drone') air += 1;
        if (e[2] === 'tank' || e[2] === 'walker') ground += 1;
        ok = false;
        if (e[2] === 'copter' || e[2] === 'drone') {
          if (e[1] < LY - 20) ok = true;
        } else if (e[1] === GY) {
          for (q = 0; q < s.ground.length; q++) {
            g0 = s.ground[q];
            if (e[0] >= g0[0] + 8 && e[0] <= g0[0] + g0[1] - 8) ok = true;
          }
        } else {
          for (q = 0; q < s.plats.length; q++) {
            p = s.plats[q];
            if (p[1] === e[1] && e[0] >= p[0] + 6 && e[0] <= p[0] + p[2] - 6) ok = true;
          }
        }
        if (!ok) throw new Error('float ' + e[2] + ' at ' + e[0] + ' ' + s.name);
      }
      if (air < 2 || ground < 2) throw new Error('air and ground ' + s.name);
      for (k = 0; k < s.drops.length; k++) {
        e = s.drops[k];
        ok = false;
        for (q = 0; q < s.plats.length; q++) {
          p = s.plats[q];
          if (p[1] === e[1] && e[0] >= p[0] + 6 && e[0] <= p[0] + p[2] - 6) ok = true;
        }
        if (!ok) throw new Error('drop ' + e[2] + ' at ' + e[0] + ' ' + s.name);
      }
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
  const btnRaid = document.getElementById('btn-raid');
  const btnStorm = document.getElementById('btn-storm');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeRaid = document.getElementById('mode-raid');
  const modeStorm = document.getElementById('mode-storm');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const hpBox = document.getElementById('hp-box');
  const hpEl = document.getElementById('hp');
  const hpFill = document.getElementById('hp-fill');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const gunLabel = document.getElementById('gun-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');

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
  let chainTok = 0;
  let uid = 1;

  const keys = {
    l: false, r: false, u: false, d: false, fire: false, lock: false,
    iu: false, il: false, id: false, ir: false
  };
  const demo = { l: false, r: true, u: false, d: false, fire: true };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2200,
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    player: null,
    boss: null,
    lives: LIVES,
    hp: HP_RAID,
    gun: 'vulcan',
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    checkX: 70,
    checkY: GY,
    jumpBuf: 0,
    deadT: 0,
    invuln: 0,
    knockT: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    nextLife: LIFE_EVERY,
    clearT: 0,
    lock: 0,
    fireCd: 0,
    muzzle: 0,
    why: '',
    ptr: { x: 0, y: 0, on: false },
    stepT: 0
  };

  function isStorm() {
    return G.kind === 'storm';
  }
  function playing() {
    return G.mode === 'play';
  }
  function live() {
    return G.mode === 'play' || G.mode === 'title';
  }
  function maxHp() {
    return isStorm() ? HP_STORM : HP_RAID;
  }
  function inL() {
    return G.mode === 'title' ? demo.l : keys.l;
  }
  function inR() {
    return G.mode === 'title' ? demo.r : keys.r;
  }
  function inU() {
    return G.mode === 'title' ? demo.u : keys.u;
  }
  function inD() {
    return G.mode === 'title' ? demo.d : keys.d;
  }
  function fireHeld() {
    return G.mode === 'title' ? demo.fire : keys.fire;
  }
  function lockHeld() {
    return G.mode === 'play' && keys.lock;
  }

  function sx(x) {
    return ox + (x - G.camX) * scale;
  }
  function sy(y) {
    return oy + (y - G.camY) * scale;
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
      this.beep(240, 0.07, 'square', 0.04, 520);
      this.noise(0.03, 0.02, 600);
    },
    land() {
      this.ensure();
      this.noise(0.05, 0.036, 280);
      this.beep(90, 0.07, 'triangle', 0.03, 48);
    },
    step() {
      this.ensure();
      this.noise(0.03, 0.018, 420);
      this.beep(110, 0.04, 'triangle', 0.016, 60);
    },
    shot(kind) {
      this.ensure();
      if (kind === 'missile') {
        this.noise(0.08, 0.045, 320);
        this.beep(280, 0.12, 'sawtooth', 0.045, 90);
      } else if (kind === 'rapid') {
        this.beep(1080, 0.03, 'square', 0.032, 480);
      } else {
        this.noise(0.025, 0.024, 1800);
        this.beep(920, 0.045, 'square', 0.04, 340);
      }
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.04, 1400);
      this.beep(620 * lift, 0.07, 'square', 0.048, 1080 * lift);
    },
    tankHit() {
      this.ensure();
      this.noise(0.05, 0.045, 500);
      this.beep(180, 0.08, 'sawtooth', 0.04, 70);
    },
    hurt() {
      this.ensure();
      this.noise(0.1, 0.055, 380);
      this.beep(280, 0.12, 'sawtooth', 0.05, 80);
    },
    boom() {
      this.ensure();
      this.noise(0.16, 0.07, 220);
      this.beep(160, 0.18, 'sawtooth', 0.05, 48);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(240, 0.22, 'sawtooth', 0.05, 60);
      this.beep(110, 0.34, 'sine', 0.045, 36);
    },
    boss() {
      this.ensure();
      this.beep(160, 0.18, 'sawtooth', 0.05, 80);
      this.beep(90, 0.3, 'square', 0.04, 52);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.04, 72);
      this.beep(100, 0.3, 'sine', 0.05, 40);
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
    const s = isStorm();
    if (modeRaid) modeRaid.setAttribute('aria-pressed', s ? 'false' : 'true');
    if (modeStorm) modeStorm.setAttribute('aria-pressed', s ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (hpEl) hpEl.textContent = String(Math.max(0, G.hp));
    if (hpFill) hpFill.style.transform = 'scaleX(' + clamp(G.hp / maxHp(), 0, 1) + ')';
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isStorm() ? '火网 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isStorm() ? '火网' : '扫荡';
      tagLabel.classList.toggle('warn', isStorm());
      tagLabel.classList.toggle('hot', !isStorm() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = GUN_NAME[G.gun] || '机炮';
      gunLabel.className = 'gun'
        + (G.gun === 'rapid' ? ' rapid' : '')
        + (G.gun === 'missile' ? ' missile' : '');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 装甲打空丢命', 'warn');
    else if (G.mode === 'win') setHint('母舰已沉 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 转炮打空打地', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('头目 · ' + spec.boss, 'hot');
    else setHint('短跳 · 转炮打空打地 · 装甲打空丢命', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'CYBR';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '火网' : '换模式';
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus({ preventScroll: true });
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
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
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'pickup', 'win-flash');
      }
    }, 380);
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

  function landDust(x, y, power) {
    const p = power || 1;
    emit(6 + (p * 5) | 0, {
      x: x, y: y, j: 10,
      vx0: -90 * p, vx1: 90 * p, vy0: -50, vy1: 16,
      life: 0.22 + p * 0.08, r0: 1.2, r1: 3.2, rgb: HOT2, g: 260
    });
    emit(4, {
      x: x, y: y - 2, j: 8,
      vx0: -40, vx1: 40, vy0: -16, vy1: 8,
      life: 0.28, r0: 1.6, r1: 3.6, rgb: STL, g: 80
    });
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
    if (!playing()) return;
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
      squash: 1, run: 0, aimX: 1, aimY: 0
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'turret') return 3;
    if (kind === 'tank' || kind === 'walker' || kind === 'launcher') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const fly = kind === 'copter' || kind === 'drone';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, base: y,
      t: rand(0, 2), fire: rand(0.4, 1.2),
      grounded: !fly, dead: false, hitN: 0,
      w: kind === 'tank' ? 28 : kind === 'copter' ? 22 : kind === 'turret' ? 16 : kind === 'launcher' ? 18 : 18,
      h: kind === 'tank' ? 16 : kind === 'copter' ? 12 : kind === 'drone' ? 10 : kind === 'turret' ? 18 : 28
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isStorm() ? 1.22 : 1)) | 0;
    const fly = spec.boss === '舰核';
    return {
      id: uid++,
      x: spec.w - 150, y: fly ? 210 : GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss, name: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: !fly, dead: false, active: false,
      hitN: 0, w: spec.boss === '重坦' ? 56 : 48, h: spec.boss === '舰核' ? 44 : 52, base: GY
    };
  }

  function seedMist() {
    mist.length = 0;
    const n = REDUCE ? 8 : 16;
    for (let i = 0; i < n; i++) {
      mist.push({
        x: rand(0, G.levelW),
        y: rand(40, GY - 40),
        r: rand(10, 28),
        a: rand(0.03, 0.08),
        vx: rand(6, 16)
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
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isStorm() && !attract) {
      for (i = 0; i < spec.ents.length; i++) {
        if (i % 2 !== 0) continue;
        const e = spec.ents[i];
        if (e[2] === 'turret' || e[2] === 'launcher') continue;
        if (e[1] !== GY && e[2] !== 'copter' && e[2] !== 'drone') continue;
        G.ents.push(makeEnt(e[0] + 42, e[1], e[2], e[3], e[4]));
      }
    }
    G.pickups = [];
    if (!attract) {
      for (i = 0; i < spec.drops.length; i++) {
        const d = spec.drops[i];
        G.pickups.push({ x: d[0], y: d[1] - 18, kind: d[2], taken: false, t: 0 });
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
    G.invuln = attract ? 99 : 0.4;
    G.clearT = 0;
    G.lock = 0;
    G.jumpBuf = 0;
    G.muzzle = 0;
    G.knockT = 0;
    seedMist();
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
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
    return standAt(x, y) && !standAt(x + face * 36, y);
  }

  function crateAhead(x, y, face) {
    const nx = x + face * 22;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p.base) continue;
      if (nx >= p.x - 4 && nx <= p.x + p.w + 4 && p.y < y - 8 && p.y > y - 62) return true;
    }
    return false;
  }

  function pBox() {
    const p = G.player;
    const h = p.duck ? 24 : p.h;
    return { x: p.x - p.w * 0.42, y: p.y - h, w: p.w * 0.84, h: h * 0.92 };
  }

  function turretOrigin() {
    const p = G.player;
    return { x: p.x + p.face * 5, y: p.y - (p.duck ? 20 : 26) };
  }

  function getAim() {
    const p = G.player;
    const o = turretOrigin();
    let dx = 0;
    let dy = 0;
    const stick = keys.iu || keys.il || keys.id || keys.ir;
    if (G.mode === 'title') {
      let best = null;
      let bestD = 9999;
      let i, e, d;
      for (i = 0; i < G.ents.length; i++) {
        e = G.ents[i];
        if (e.dead) continue;
        if (e.x < G.camX - 20 || e.x > G.camX + VW + 40) continue;
        d = hypot(e.x - o.x, e.y - 10 - o.y);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (best) return norm(best.x - o.x, best.y - 8 - o.y);
      return { dx: 1, dy: -0.15 };
    }
    if (stick) {
      if (keys.il) dx -= 1;
      if (keys.ir) dx += 1;
      if (keys.iu) dy -= 1;
      if (keys.id) dy += 1;
    } else if (lockHeld()) {
      if (inL()) dx -= 1;
      if (inR()) dx += 1;
      if (inU()) dy -= 1;
      if (inD()) dy += 1;
    } else if (G.ptr.on) {
      dx = G.ptr.x - o.x;
      dy = G.ptr.y - o.y;
    } else {
      dx = p.face;
      dy = 0;
      if (inD()) dy = 0.62;
      if (!p.grounded && inU()) dy = -0.72;
    }
    if (!dx && !dy) dx = p.face;
    return norm(dx, dy);
  }

  function countShots(from) {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === from && G.shots[i].life > 0 && !G.shots[i].dead) n += 1;
    }
    return n;
  }

  function spawnShot(s) {
    s.id = uid++;
    s.dead = false;
    G.shots.push(s);
    if (G.shots.length > 96) {
      for (let i = 0; i < G.shots.length && G.shots.length > 78; i++) {
        if (G.shots[i].from === 'e') {
          G.shots.splice(i, 1);
          i -= 1;
        }
      }
    }
    capArr(G.shots, 96);
  }

  function tryShoot() {
    if (G.deadT > 0 || G.lock > 0) return;
    if (!(playing() || G.mode === 'title')) return;
    if (playing() && overlayOpen()) return;
    if (!fireHeld()) return;
    if (G.fireCd > 0) return;
    const wpn = WEAPONS[G.gun] || WEAPONS.vulcan;
    if (countShots('p') >= wpn.max) return;
    const p = G.player;
    const aim = getAim();
    p.aimX = aim.dx;
    p.aimY = aim.dy;
    const o = turretOrigin();
    spawnShot({
      x: o.x + aim.dx * 18,
      y: o.y + aim.dy * 10,
      vx: aim.dx * wpn.spd,
      vy: aim.dy * wpn.spd,
      from: 'p',
      kind: G.gun,
      dmg: wpn.dmg,
      life: wpn.life,
      rgb: wpn.rgb,
      homing: wpn.homing || 0
    });
    G.fireCd = wpn.cd;
    G.muzzle = 0.06;
    if (playing()) {
      audio.shot(G.gun);
      emit(3, {
        x: o.x + aim.dx * 18, y: o.y + aim.dy * 10, j: 3,
        vx0: aim.dx * 40, vx1: aim.dx * 120, vy0: aim.dy * 40 - 40, vy1: aim.dy * 80,
        life: 0.12, r0: 1, r1: 2.2, rgb: GOLD, g: 80
      });
    }
  }

  function enemyShoot(x, y, dx, dy, spd, kind) {
    const v = norm(dx, dy);
    spawnShot({
      x: x, y: y,
      vx: v.dx * spd,
      vy: v.dy * spd,
      from: 'e',
      kind: kind || 'bolt',
      life: kind === 'bomb' ? 2.4 : 2.1,
      rgb: kind === 'core' ? MAG : kind === 'bomb' ? GOLD : HOT2,
      grav: kind === 'bomb' ? 280 : 0
    });
  }

  function nearestEnemy(x, y) {
    let best = null;
    let bestD = 280;
    let i, e, d;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      d = hypot(e.x - x, e.y - 8 - y);
      if (d < bestD) { bestD = d; best = e; }
    }
    const b = G.boss;
    if (b && !b.dead && b.active) {
      d = hypot(b.x - x, b.y - 20 - y);
      if (d < bestD) best = b;
    }
    return best;
  }

  function die(why) {
    if (G.deadT > 0) return;
    G.why = why || 'hit';
    G.lives -= 1;
    G.hp = 0;
    G.deadT = DIE_T;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.gun = 'vulcan';
    const p = G.player;
    juice(p.x, p.y - 18, MAG, 1.6);
    audio.death();
    hitStop(0.072);
    kick(7.2, 'die');
    syncHud();
  }

  function hurt(x, dmg, why) {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    G.hp -= dmg;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    if (hpBox) {
      hpBox.classList.remove('hurt');
      void hpBox.offsetWidth;
      hpBox.classList.add('hurt');
    }
    juice(G.player.x, G.player.y - 18, MAG, 0.9);
    audio.hurt();
    hitStop(0.048);
    kick(4.2, 'hit');
    G.knockT = 0.14;
    G.player.vx = (G.player.x > x ? 1 : -1) * 90;
    syncHud();
    if (G.hp <= 0) die(why);
    else G.invuln = 0.55;
  }

  function respawn() {
    G.hp = maxHp();
    G.gun = 'vulcan';
    G.player = makePlayer(G.checkX, G.checkY);
    G.deadT = 0;
    G.invuln = INVULN;
    G.shots = G.shots.filter(function (s) { return s.from === 'p'; });
    toast('装甲重装', true, false);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.score = 0;
    G.lives = LIVES;
    G.hp = HP_RAID;
    G.gun = 'vulcan';
    G.combo = 0;
    G.mult = 1;
    G.maxCombo = 0;
    G.nextLife = LIFE_EVERY;
    loadStage(1, true);
    showOverlay('title', '机甲', '驾驶步行装甲。短跳过坑，转炮打空中的武装直升机和地面坦克。装甲打空丢一条命。');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'storm' ? 'storm' : 'raid';
    G.mode = 'play';
    G.stage = 1;
    G.score = 0;
    G.lives = LIVES;
    G.hp = maxHp();
    G.gun = 'vulcan';
    G.combo = 0;
    G.mult = 1;
    G.maxCombo = 0;
    G.nextLife = LIFE_EVERY;
    G.clearT = 0;
    G.why = '';
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isStorm() ? '火网' : '扫荡', false, true);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind);
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('raid');
    else if (G.mode === 'win' || G.mode === 'lose') startGame(G.kind);
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入深渊了' : (G.why === 'boss' ? '被击倒了' : '装甲碎了');
    showOverlay('lose', why, '分数 ' + G.score + ' · 最高连击 ×' + G.maxCombo + ' · R 立刻再开');
    syncHud();
  }

  function goWin() {
    const bonus = 8000 + G.lives * 400 + G.hp * 80;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    kick(3, 'win-flash');
    const msg = isStorm() ? '火网得手' : '母舰已沉';
    showOverlay('win', msg, '分数 ' + G.score + ' · 最高连击 ×' + G.maxCombo);
    toast(msg, false, true);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    G.stage += 1;
    loadStage(G.stage, false);
    G.hp = Math.min(maxHp(), G.hp + 1);
    audio.stage();
    toast(STAGES[G.stage - 1].name, false, true);
    syncHud();
  }

  function killEnt(e, x, y) {
    e.dead = true;
    const air = e.kind === 'copter' || e.kind === 'drone';
    const pts = (SCORE[e.kind] || 100) * G.mult;
    addScore(pts);
    floatText(e.x, e.y - 16, '+' + pts, air ? CYN : GOLD, G.mult >= 2);
    juice(x, y, air ? CYN : GOLD, air ? 1.05 : 1.25);
    if (!air) {
      emit(8, {
        x: x, y: y, j: 8,
        vx0: -140, vx1: 140, vy0: -180, vy1: -20,
        life: 0.32, r0: 1.4, r1: 3.4, rgb: RUST, g: 360
      });
      audio.tankHit();
    } else {
      audio.boom();
    }
    hitStop(0.042 + Math.min(0.032, G.combo * 0.004));
  }

  function hitBoss(b, x, y, dmg) {
    b.hp -= dmg;
    b.hitN = 0.12;
    bumpCombo();
    addScore(40 * G.mult);
    juice(x, y, GOLD, 0.85);
    audio.hit(G.combo);
    hitStop(0.05);
    if (b.hp <= 0) {
      b.dead = true;
      b.active = false;
      addScore(SCORE.boss * G.mult);
      addScore(SCORE.stage * G.stage * G.mult);
      juice(b.x, b.y - 24, GOLD, 2.1);
      audio.boom();
      kick(6, 'boom');
      hitStop(0.074);
      floatText(b.x, b.y - 40, b.name + ' 击破', GOLD, true);
      G.clearT = 1.6;
      G.shots = G.shots.filter(function (s) { return s.from === 'p'; });
    }
  }

  function onPickup(u) {
    u.taken = true;
    if (u.kind === 'heart') {
      G.hp = Math.min(maxHp(), G.hp + 2);
      toast('装甲 +2', false, true);
    } else if (u.kind === 'rapid') {
      G.gun = 'rapid';
      toast('连射', false, true);
    } else {
      G.gun = 'missile';
      toast('导弹', false, true);
    }
    audio.ping();
    kick(2.2, 'pickup');
    juice(u.x, u.y, GOLD, 0.7);
    syncHud();
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = false;
    demo.d = false;
    demo.fire = true;
    if (p.grounded && (pitAhead(p.x, p.y, 1) || crateAhead(p.x, p.y, 1))) demo.u = true;
    if (p.x > 780 || p.y > VH + 20) {
      loadStage(1, true);
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0002, dt));
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.45;
      p.squash = 1.18;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    if (G.lock > 0) return;

    if (G.knockT > 0) G.knockT -= dt;

    const blocked = playing() && overlayOpen();
    const lock = lockHeld();
    p.duck = !blocked && p.grounded && inD() && !lock && !inL() && !inR();

    if (G.jumpBuf > 0) G.jumpBuf -= dt;
    if (!blocked && inU() && !lock) G.jumpBuf = BUFFER;
    if (p.grounded) p.coyote = COYOTE;
    else p.coyote -= dt;

    if (p.grounded && G.knockT <= 0 && !lock && !blocked) {
      let ax = 0;
      if (inL() && !inR()) { ax = -1; p.face = -1; }
      else if (inR() && !inL()) { ax = 1; p.face = 1; }
      p.vx = ax * WALK * walkMul(isStorm());
      if (p.duck) p.vx = 0;
      p.run = ax && !p.duck ? p.run + dt : 0;
      if (ax && playing()) {
        G.stepT -= dt;
        if (G.stepT <= 0) {
          G.stepT = 0.28;
          audio.step();
          landDust(p.x, p.y, 0.35);
        }
      }
    } else if (G.knockT <= 0) {
      let ax = 0;
      if (!blocked && !lock) {
        if (inL() && !inR()) { ax = -1; p.face = -1; }
        else if (inR() && !inL()) { ax = 1; p.face = 1; }
      }
      p.vx += ax * WALK * AIR * 2.2 * dt;
      const cap = WALK * 1.05 * walkMul(isStorm());
      p.vx = clamp(p.vx, -cap, cap);
      p.run = 0;
    }

    if (lock && p.grounded && G.knockT <= 0) {
      p.vx = 0;
      p.run = 0;
    }

    if (p.coyote > 0 && G.jumpBuf > 0 && !lock && !blocked && !p.duck) {
      p.vy = -JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      G.jumpBuf = 0;
      p.squash = 1.18;
      if (playing()) audio.hop();
    }

    if (!p.grounded) {
      p.vy += GRAV * dt;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    } else {
      p.vy = 0;
    }

    const y0 = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = clamp(p.x, 16, G.levelW - 16);

    if (p.vy >= -20) {
      const hit = landOn(p.x, y0, p.y, null);
      if (hit) {
        const wasAir = !p.grounded;
        p.y = hit.y;
        p.vy = 0;
        p.grounded = true;
        if (wasAir) {
          p.squash = 0.72;
          if (playing()) audio.land();
          landDust(p.x, p.y, 1.05);
          kick(1.6, 'thump');
        }
        G.checkX = p.x;
        G.checkY = hit.y;
      } else if (p.vy > 8) {
        p.grounded = false;
      }
    } else {
      p.grounded = false;
    }

    if (p.grounded && !standAt(p.x, p.y)) p.grounded = false;
    if (p.y > VH + 40) {
      if (playing()) die('fall');
      else loadStage(1, true);
      return;
    }

    const aim = getAim();
    p.aimX = aim.dx;
    p.aimY = aim.dy;
    tryShoot();
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isStorm(), G.stage);
    const p = G.player;
    if (e.kind === 'copter' || e.kind === 'drone') {
      const span = Math.max(40, (e.b || e.x + 80) - (e.a || e.x - 80));
      e.x = (e.a + e.b) * 0.5 + Math.sin(e.t * (e.kind === 'drone' ? 1.8 : 1.15)) * span * 0.35;
      e.y = e.base + Math.sin(e.t * 2.4 + e.id) * (e.kind === 'drone' ? 8 : 12);
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && Math.abs(e.x - p.x) < 320 && live()) {
        if (e.kind === 'copter') enemyShoot(e.x, e.y + 6, p.x - e.x, p.y - 18 - e.y, 170 * mul, 'bolt');
        else enemyShoot(e.x, e.y + 4, 0.15 * e.face, 1, 160 * mul, 'bolt');
        e.fire = (isStorm() ? 0.95 : 1.35) + rand(0, 0.4);
      }
      return;
    }
    if (e.kind === 'turret') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && Math.abs(e.x - p.x) < 360 && live()) {
        enemyShoot(e.x + e.face * 10, e.y - 12, p.x - e.x, p.y - 20 - e.y, 200 * mul, 'bolt');
        e.fire = (isStorm() ? 0.85 : 1.2) + rand(0, 0.25);
      }
      return;
    }
    if (e.kind === 'launcher') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && Math.abs(e.x - p.x) < 380 && live()) {
        enemyShoot(e.x, e.y - 14, e.face * 0.6, -0.75, 150 * mul, 'bomb');
        e.fire = (isStorm() ? 1.15 : 1.55) + rand(0, 0.3);
      }
      return;
    }
    const left = e.a || e.x - 80;
    const right = e.b || e.x + 80;
    if (!e.vx) e.vx = (e.kind === 'walker' ? 42 : 28) * (e.face || -1);
    e.x += e.vx * mul * dt;
    if (e.x < left + 8) { e.x = left + 8; e.vx = Math.abs(e.vx); e.face = 1; }
    if (e.x > right - 8) { e.x = right - 8; e.vx = -Math.abs(e.vx); e.face = -1; }
    e.face = e.vx >= 0 ? 1 : -1;
    if (pitAhead(e.x, e.y, e.face)) e.vx *= -1;
    e.fire -= dt;
    if (e.fire <= 0 && Math.abs(e.x - p.x) < 300 && live()) {
      const dy = e.kind === 'walker' ? (p.y - 20 - (e.y - 16)) * 0.004 : 0.02;
      enemyShoot(e.x + e.face * 12, e.y - (e.kind === 'walker' ? 18 : 10), e.face, dy, 190 * mul, 'bolt');
      e.fire = (isStorm() ? 0.9 : 1.25) + rand(0, 0.35);
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    b.t += dt;
    const p = G.player;
    if (!b.active) {
      if (p.x > G.levelW - VW + 36) {
        b.active = true;
        audio.boss();
        toast(b.name, false, true);
        kick(4.2, 'boom');
      }
      return;
    }
    const mul = spdMul(isStorm(), G.stage);
    b.face = p.x < b.x ? -1 : 1;
    const low = b.hp / b.max < 0.45;
    if (b.kind === '重坦') {
      b.x += Math.sin(b.t * 0.55) * 46 * dt;
      b.x = clamp(b.x, G.levelW - VW + 90, G.levelW - 60);
    } else if (b.kind === '舰核') {
      b.x = G.levelW - 150 + Math.sin(b.t * 0.7) * 36;
      b.y = 200 + Math.cos(b.t * 0.9) * 28;
    }
    b.fire -= dt;
    if (b.fire > 0) return;
    if (b.kind === '岸炮') {
      enemyShoot(b.x - 16, b.y - 30, -1, 0, 210 * mul, 'bolt');
      enemyShoot(b.x - 16, b.y - 16, -1, 0.14, 200 * mul, 'bolt');
      if (low) enemyShoot(b.x - 10, b.y - 40, -0.55, -0.4, 130 * mul, 'bomb');
      b.fire = (isStorm() ? 0.7 : 1.02) + (low ? -0.18 : 0);
    } else if (b.kind === '重坦') {
      enemyShoot(b.x - 22, b.y - 34, -1, 0, 230 * mul, 'bolt');
      enemyShoot(b.x - 22, b.y - 18, -1, 0.08, 220 * mul, 'bolt');
      enemyShoot(b.x - 8, b.y - 44, -0.4, -0.55, 140 * mul, 'bomb');
      b.fire = (isStorm() ? 0.78 : 1.1) + (low ? -0.2 : 0);
    } else {
      let k;
      const n = low ? 8 : 6;
      for (k = 0; k < n; k++) {
        const a = (k / n) * TAU + b.t * 0.6;
        enemyShoot(b.x, b.y - 10, Math.cos(a), Math.sin(a), 150 * mul, 'core');
      }
      enemyShoot(b.x, b.y, p.x - b.x, p.y - 18 - b.y, 200 * mul, 'bolt');
      b.fire = (isStorm() ? 0.72 : 1.02) + (low ? -0.22 : 0);
    }
  }

  function updateShots(dt) {
    let i, s, k, e, pb, b;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.dead) continue;
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      if (s.homing && s.from === 'p') {
        const t = nearestEnemy(s.x, s.y);
        if (t) {
          const v = norm(t.x - s.x, t.y - 10 - s.y);
          s.vx += v.dx * s.homing * dt;
          s.vy += v.dy * s.homing * dt;
          const sp = hypot(s.vx, s.vy) || 1;
          const cap = WEAPONS.missile.spd * 1.15;
          s.vx = s.vx / sp * Math.min(sp, cap);
          s.vy = s.vy / sp * Math.min(sp, cap);
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y > VH + 50 || s.x < G.camX - 60 || s.x > G.camX + VW + 60) {
        s.dead = true;
        continue;
      }
      if (s.from === 'e' && playing() && G.deadT <= 0 && G.invuln <= 0) {
        pb = pBox();
        if (overlap(s.x - 5, s.y - 5, 10, 10, pb.x, pb.y, pb.w, pb.h)) {
          s.dead = true;
          hurt(s.x, s.kind === 'core' || s.kind === 'bomb' ? 2 : 1, s.kind === 'core' || s.kind === 'bomb' ? 'boss' : 'hit');
        }
      }
      if (s.from === 'p') {
        for (k = 0; k < G.ents.length; k++) {
          e = G.ents[k];
          if (e.dead) continue;
          if (overlap(s.x - 4, s.y - 4, 8, 8, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
            e.hp -= s.dmg || 1;
            e.hitN = 0.1;
            bumpCombo();
            audio.hit(G.combo);
            emit(5, {
              x: s.x, y: s.y, j: 4,
              vx0: -80, vx1: 80, vy0: -120, vy1: -10,
              life: 0.18, r0: 1, r1: 2.4, rgb: s.rgb || HOT, g: 200
            });
            hitStop(0.034 + Math.min(0.028, G.combo * 0.003));
            kick(1.8, 'hit');
            if (e.hp <= 0) killEnt(e, s.x, s.y);
            s.dead = true;
            break;
          }
        }
        if (s.dead) continue;
        b = G.boss;
        if (b && !b.dead && (b.active || G.mode === 'title')) {
          if (overlap(s.x - 4, s.y - 4, 8, 8, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
            if (playing()) hitBoss(b, s.x, s.y, s.dmg || 1);
            else {
              juice(s.x, s.y, GOLD, 0.4);
              s.dead = true;
            }
            s.dead = true;
          }
        }
      }
    }
    for (i = G.shots.length - 1; i >= 0; i--) {
      if (G.shots[i].dead) G.shots.splice(i, 1);
    }
  }

  function updatePickups(dt) {
    const p = G.player;
    let i, u;
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      if (playing() && G.deadT <= 0 && hypot(u.x - p.x, u.y - (p.y - 18)) < 22) onPickup(u);
    }
  }

  function updateFx(dt) {
    let i, o;
    for (i = particles.length - 1; i >= 0; i--) {
      o = particles[i];
      o.vy += (o.g || 0) * dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      o.life -= dt;
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
    for (i = 0; i < mist.length; i++) {
      mist[i].x += mist[i].vx * dt;
      if (mist[i].x > G.levelW) mist[i].x = 0;
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0008, dt));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.invuln > 0 && playing()) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        syncHud();
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    let tx = p.x - VW * 0.34;
    if (G.boss && G.boss.active && !G.boss.dead) tx = G.levelW - VW;
    tx = clamp(tx, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0004, dt));
    G.camY = 0;
  }

  function bodyHits() {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    const pb = pBox();
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.45, e.y - e.h, e.w * 0.9, e.h * 0.9)) {
        hurt(e.x, 1, 'hit');
        return;
      }
    }
    const b = G.boss;
    if (b && b.active && !b.dead) {
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.45, b.y - b.h, b.w * 0.9, b.h * 0.9)) {
        hurt(b.x, 2, 'boss');
      }
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.15);
      return;
    }
    if (!live()) {
      updateFx(dt);
      return;
    }
    if (G.mode === 'title') demoThink();
    updatePlayer(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updatePickups(dt);
    bodyHits();
    updateCam(dt);
    updateFx(dt);
    if (G.clearT > 0 && playing()) {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(0, oy, 0, oy + VH * scale);
    if (spec.theme === 'port') {
      g.addColorStop(0, '#071a22');
      g.addColorStop(0.45, '#0a2420');
      g.addColorStop(1, '#041412');
    } else if (spec.theme === 'steel') {
      g.addColorStop(0, '#0a1c24');
      g.addColorStop(0.5, '#081818');
      g.addColorStop(1, '#041210');
    } else {
      g.addColorStop(0, '#08101c');
      g.addColorStop(0.5, '#06161a');
      g.addColorStop(1, '#041412');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
    ctx.fillStyle = rgba(HOT, 0.08);
    ctx.beginPath();
    ctx.ellipse(sx(G.camX + 480), sy(70), 90 * scale, 36 * scale, 0, 0, TAU);
    ctx.fill();
  }

  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.28;
    let i, x;
    ctx.fillStyle = spec.theme === 'ship' ? '#0c1820' : '#0c201c';
    for (i = 0; i < 9; i++) {
      x = sx((i * 280) - (par % 280) - 40);
      const h = (70 + (hash2(i + spec.w) * 80)) * scale;
      ctx.fillRect(x, sy(GY) - h, 90 * scale, h + 20 * scale);
      ctx.fillStyle = rgba(HOT, 0.06);
      ctx.fillRect(x + 12 * scale, sy(GY) - h + 10 * scale, 8 * scale, 14 * scale);
      ctx.fillStyle = spec.theme === 'ship' ? '#0c1820' : '#0c201c';
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(HOT2, m.a);
      ctx.beginPath();
      ctx.ellipse(sx(m.x), sy(m.y), m.r * scale, m.r * 0.4 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawPlats() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    let i, p, x, y, w, h, k;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * scale;
      h = p.h * scale;
      ctx.fillStyle = p.base
        ? (spec.theme === 'ship' ? '#122028' : '#10241e')
        : '#1a2c28';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(p.base ? HOT : GOLD, p.base ? 0.78 : 0.55);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(CYN, 0.18);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (p.base) {
        const n = Math.max(2, (p.w / 32) | 0);
        for (k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.16) : rgba(STL, 0.4);
          ctx.fillRect(x + (k / n) * w, y, 2.2 * scale, 8 * scale);
        }
      }
    }
  }

  function drawShot(s) {
    const x = sx(s.x);
    const y = sy(s.y);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(s.vy, s.vx));
    if (s.kind === 'missile' || s.kind === 'bomb') {
      ctx.fillStyle = rgba(s.rgb || GOLD, 0.95);
      ctx.fillRect(-6 * scale, -2.4 * scale, 12 * scale, 4.8 * scale);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(-6 * scale, 0, 2.4 * scale, 0, TAU);
      ctx.fill();
    } else if (s.kind === 'core') {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 4.2 * scale, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillStyle = rgba(s.rgb || HOT, 0.95);
      ctx.fillRect(-4.5 * scale, -1.6 * scale, 11 * scale, 3.2 * scale);
      ctx.fillStyle = rgba(WHT, 0.85);
      ctx.fillRect(1 * scale, -0.7 * scale, 5 * scale, 1.4 * scale);
    }
    ctx.restore();
  }

  function drawPickup(u) {
    if (u.taken) return;
    const bob = Math.sin(G.clock * 4 + u.t) * 3;
    const x = sx(u.x);
    const y = sy(u.y + bob);
    const rgb = u.kind === 'rapid' ? CYN : u.kind === 'missile' ? HOT : GOLD;
    const label = u.kind === 'heart' ? '心' : u.kind === 'rapid' ? '连' : '导';
    ctx.fillStyle = rgba(rgb, 0.18);
    ctx.beginPath();
    ctx.arc(x, y, 12 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(x - 8 * scale, y - 8 * scale, 16 * scale, 16 * scale);
    ctx.fillStyle = '#041412';
    ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + 0.5 * scale);
  }

  function drawMech(p, opt) {
    if (opt.blink && ((G.t * 18) | 0) % 2 === 0) return;
    const s = scale * (opt.size || 1);
    const sq = opt.squash || 1;
    const duck = opt.duck;
    const aim = opt.aim || { dx: p.face, dy: 0 };
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.scale(p.face, sq);
    const leg = Math.sin(opt.run || 0) * (duck ? 1 : 6) * s;
    const bodyH = duck ? 16 : 20;
    ctx.strokeStyle = rgba(STL, 0.95);
    ctx.lineWidth = 3.4 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5 * s, -8 * s);
    ctx.lineTo(-6 * s + (opt.grounded ? -leg : 3 * s), 0);
    ctx.moveTo(5 * s, -8 * s);
    ctx.lineTo(6 * s + (opt.grounded ? leg : -3 * s), 0);
    ctx.stroke();
    ctx.fillStyle = rgba(IRON, 0.95);
    ctx.fillRect(-8 * s, -4 * s, 6 * s, 4 * s);
    ctx.fillRect(2 * s, -4 * s, 6 * s, 4 * s);
    ctx.fillStyle = rgba(opt.rgb || HOT, 0.95);
    ctx.fillRect(-10 * s, -bodyH * s - 6 * s, 20 * s, bodyH * s);
    ctx.fillStyle = rgba(STL, 0.9);
    ctx.fillRect(-10 * s, -bodyH * s - 6 * s, 20 * s, 3 * s);
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.fillRect(-2 * s, -(bodyH + 2) * s, 9 * s, 5 * s);
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.fillRect(1 * s, -(bodyH + 1) * s, 5 * s, 3 * s);
    ctx.fillStyle = rgba(GOLD, 0.4);
    ctx.fillRect(-10 * s, -(bodyH - 6) * s, 5 * s, 3 * s);
    const ldx = aim.dx * p.face;
    const ldy = aim.dy;
    ctx.save();
    ctx.translate(4 * s, -(bodyH - 2) * s);
    ctx.rotate(Math.atan2(ldy, ldx));
    ctx.fillStyle = rgba(IRON, 0.95);
    ctx.fillRect(-3 * s, -3.2 * s, 8 * s, 6.4 * s);
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(4 * s, -2 * s, 16 * s, 4 * s);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(16 * s, -1.2 * s, 6 * s, 2.4 * s);
    if (opt.muzzle) {
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.beginPath();
      ctx.arc(24 * s, 0, 4.6 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
  }

  function drawTank(e) {
    const x = sx(e.x);
    const y = sy(e.y);
    ctx.fillStyle = '#2a3834';
    ctx.fillRect(x - 14 * scale, y - 12 * scale, 28 * scale, 12 * scale);
    ctx.fillStyle = rgba(RUST, 0.85);
    ctx.fillRect(x - 14 * scale, y - 14 * scale, 28 * scale, 2.4 * scale);
    ctx.fillStyle = '#1a2422';
    ctx.fillRect(x - 13 * scale, y - 4 * scale, 26 * scale, 4 * scale);
    const a = Math.atan2((G.player.y - 18) - (e.y - 10), G.player.x - e.x);
    ctx.save();
    ctx.translate(x, y - 10 * scale);
    ctx.rotate(a);
    ctx.fillStyle = '#6a8078';
    ctx.fillRect(0, -2 * scale, 16 * scale, 4 * scale);
    ctx.restore();
  }

  function drawCopter(e) {
    const x = sx(e.x);
    const y = sy(e.y);
    ctx.fillStyle = rgba(CYN, 0.35);
    ctx.beginPath();
    ctx.ellipse(x, y - 10 * scale, 14 * scale, 2.4 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(WHT, 0.55);
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(x - 16 * scale, y - 10 * scale);
    ctx.lineTo(x + 16 * scale, y - 10 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(HOT2, 0.92);
    ctx.beginPath();
    ctx.ellipse(x, y - 4 * scale, 10 * scale, 5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.7);
    ctx.fillRect(x + 8 * scale, y - 5 * scale, 8 * scale, 2 * scale);
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    if (e.kind === 'tank') { drawTank(e); return; }
    if (e.kind === 'copter') { drawCopter(e); return; }
    if (e.kind === 'drone') {
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.ellipse(x, y - 5 * scale, 8 * scale, 5 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(x - 2 * scale, y - 7 * scale, 4 * scale, 3 * scale);
      return;
    }
    if (e.kind === 'turret' || e.kind === 'launcher') {
      ctx.fillStyle = '#243430';
      ctx.fillRect(x - 10 * scale, y - 16 * scale, 20 * scale, 16 * scale);
      ctx.fillStyle = rgba(e.kind === 'launcher' ? GOLD : HOT, 0.85);
      ctx.fillRect(x - 10 * scale, y - 18 * scale, 20 * scale, 2.2 * scale);
      const a = Math.atan2((G.player.y - 16) - (e.y - 10), G.player.x - e.x);
      ctx.save();
      ctx.translate(x, y - 10 * scale);
      ctx.rotate(a);
      ctx.fillStyle = '#6a8078';
      ctx.fillRect(0, -2 * scale, 16 * scale, 4 * scale);
      ctx.restore();
      return;
    }
    drawMech(e, {
      run: e.t * 7, grounded: e.grounded, squash: 1,
      duck: false, aim: { dx: e.face, dy: 0 }, size: 0.82, rgb: MAG
    });
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    if (!b.active && G.mode !== 'title') {
      if (b.x < G.camX - 20 || b.x > G.camX + VW + 40) return;
    }
    const x = sx(b.x);
    const y = sy(b.y);
    const flash = b.hitN > 0 && ((G.t * 24) | 0) % 2 === 0;
    if (b.kind === '岸炮') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#1a2a28';
      ctx.fillRect(x - 28 * scale, y - 52 * scale, 56 * scale, 52 * scale);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(x - 28 * scale, y - 54 * scale, 56 * scale, 3 * scale);
      ctx.fillStyle = '#6a8078';
      ctx.fillRect(x - 40 * scale, y - 38 * scale, 28 * scale, 7 * scale);
      ctx.fillRect(x - 40 * scale, y - 22 * scale, 24 * scale, 6 * scale);
    } else if (b.kind === '重坦') {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : '#243430';
      ctx.fillRect(x - 30 * scale, y - 40 * scale, 60 * scale, 40 * scale);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(x - 30 * scale, y - 42 * scale, 60 * scale, 3 * scale);
      ctx.fillStyle = '#1a2422';
      ctx.fillRect(x - 28 * scale, y - 8 * scale, 56 * scale, 8 * scale);
      ctx.fillStyle = '#6a8078';
      ctx.fillRect(x - 38 * scale, y - 32 * scale, 22 * scale, 6 * scale);
      ctx.fillRect(x - 38 * scale, y - 20 * scale, 22 * scale, 6 * scale);
    } else {
      ctx.fillStyle = flash ? rgba(WHT, 0.9) : rgba(MAG, 0.88);
      ctx.beginPath();
      ctx.ellipse(x, y - 18 * scale, 28 * scale, 22 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.beginPath();
      ctx.arc(x - 4 * scale, y - 20 * scale, 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.55);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(x, y - 18 * scale, 32 * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead || !playing()) return;
    const x = ox + 80 * scale;
    const y = oy + 12 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.92);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.5);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(b.name, ox + (VW * 0.5) * scale, y - 2 * scale);
  }

  function drawAim() {
    if (!playing() || G.deadT > 0 || !G.player) return;
    const o = turretOrigin();
    const d = getAim();
    const s = scale;
    ctx.strokeStyle = rgba(HOT2, 0.32);
    ctx.lineWidth = 1 * s;
    ctx.setLineDash([4 * s, 4 * s]);
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x + d.dx * 72), sy(o.y + d.dy * 72));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = rgba(HOT, 0.7);
    ctx.lineWidth = 1.4 * s;
    ctx.beginPath();
    ctx.arc(sx(o.x + d.dx * 72), sy(o.y + d.dy * 72), 6 * s, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(o.x + d.dx * 72 - 8), sy(o.y + d.dy * 72));
    ctx.lineTo(sx(o.x + d.dx * 72 + 8), sy(o.y + d.dy * 72));
    ctx.moveTo(sx(o.x + d.dx * 72), sy(o.y + d.dy * 72 - 8));
    ctx.lineTo(sx(o.x + d.dx * 72), sy(o.y + d.dy * 72 + 8));
    ctx.stroke();
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
      ctx.fillRect(sx(o.x) - o.r * scale, sy(o.y) - o.r * scale, o.r * 2 * scale, o.r * 2 * scale);
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
    ctx.fillStyle = '#041412';
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
    drawPlats();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    if (G.player && G.deadT <= 0) {
      drawMech(G.player, {
        run: G.player.run * 11,
        grounded: G.player.grounded,
        squash: G.player.squash,
        duck: G.player.duck,
        aim: { dx: G.player.aimX, dy: G.player.aimY },
        muzzle: G.muzzle > 0,
        blink: G.invuln > 0 && G.mode === 'play',
        rgb: HOT
      });
      drawAim();
    }

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

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - ox) / scale + G.camX,
      y: (e.clientY - rect.top - oy) / scale + G.camY
    };
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S'
      || k === 'i' || k === 'I' || k === 'j' || k === 'J' || k === 'k' || k === 'K' || k === 'l' || k === 'L';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const lock = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';

    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'Left') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
    if (k === 'i' || k === 'I') keys.iu = down;
    if (k === 'j' || k === 'J') keys.il = down;
    if (k === 'k' || k === 'K') keys.id = down;
    if (k === 'l' || k === 'L') keys.ir = down;
    if (space) keys.fire = down;
    if (lock) keys.lock = down;

    if (down && (isMove || space || lock || k === 'Enter')) e.preventDefault();
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
      startGame('raid');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('storm');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        if (space) keys.fire = false;
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
    hold(document.getElementById('btn-jump'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(document.getElementById('btn-duck'), function () { keys.d = true; }, function () { keys.d = false; });
    hold(document.getElementById('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointermove', function (e) {
      const w = worldFromEvent(e);
      G.ptr.x = w.x;
      G.ptr.y = w.y;
      G.ptr.on = true;
    });
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      const w = worldFromEvent(e);
      G.ptr.x = w.x;
      G.ptr.y = w.y;
      G.ptr.on = true;
      if (overlayOpen()) return;
      keys.fire = true;
    });
    canvas.addEventListener('pointerup', function () { keys.fire = false; });
    canvas.addEventListener('pointercancel', function () { keys.fire = false; });
    canvas.addEventListener('pointerleave', function () {
      keys.fire = false;
      G.ptr.on = false;
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
  bindPad();

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnStorm) {
    btnStorm.addEventListener('click', function () {
      audio.ensure();
      startGame('storm');
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
      if (G.mode === 'win') startGame('storm');
      else goTitle();
    });
  }
  if (modeRaid) {
    modeRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (modeStorm) {
    modeStorm.addEventListener('click', function () {
      audio.ensure();
      startGame('storm');
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
      keys.lock = false;
    }
  });

  requestAnimationFrame(frame);
})();
