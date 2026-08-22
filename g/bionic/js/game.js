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
  const WALK = 148;
  const GRAV = 1280;
  const MAX_FALL = 540;
  const AIR_STEER = 420;
  const PW = 14;
  const PH = 24;
  const ARM_MAX = 176;
  const ARM_MIN = 28;
  const ARM_OUT = 940;
  const ARM_BACK = 1180;
  const ARM_REEL = 270;
  const SWING_G = 1480;
  const HP_HOOK = 4;
  const HP_NET = 3;
  const INVULN = 1.18;
  const DIE_T = 0.86;
  const BEST_KEY = 'playbox-bionic-best';
  const MUTE_KEY = 'playbox-bionic-mute';
  const AUTO_SPEED_KEY = 'playbox-bionic-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.52, 0.78, 1, 3.4];
  const OPS = '方向 / D 走瞄 · 空格开枪 · Shift/Z 钩臂 · A 自动 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [42, 255, 74];
  const HOT2 = [125, 255, 106];
  const WHT = [232, 248, 234];
  const LEAF = [61, 255, 122];
  const STL = [72, 110, 88];
  const IRON = [40, 62, 48];
  const SKIN = [200, 232, 196];
  const BEAM = [255, 90, 70];

  const SCORE = {
    crawler: 100, hookman: 120, drone: 150, nest: 180, turret: 200,
    boss: 4000, stage: 1500, rapid: 400, star: 80, shot: 40
  };

  const STAGES = [
    {
      name: '废港', boss: '双管', w: 2160, hp: 22, theme: 'port',
      ground: [[0, 500], [660, 240], [1080, 300], [1560, 600]],
      plats: [
        [160, MY, 140], [480, MY, 200], [500, HY, 110],
        [760, MY, 220], [1100, MY, 160], [1280, HY, 140],
        [1360, MY, 200], [1680, MY, 170], [1880, HY, 140], [1980, MY, 140]
      ],
      drops: [
        [220, MY, 'heart'], [1340, HY, 'rapid'], [1760, MY, 'star']
      ],
      ents: [
        [220, GY, 'crawler', 20, 480],
        [360, GY, 'hookman', 40, 480],
        [560, MY, 'nest', 480, 680],
        [760, GY, 'crawler', 670, 880],
        [860, MY, 'turret', 760, 980],
        [1020, HY, 'drone', 880, 1200],
        [1180, MY, 'hookman', 1100, 1260],
        [1240, GY, 'crawler', 1090, 1360],
        [1460, MY, 'nest', 1360, 1560],
        [1480, HY, 'drone', 1280, 1540],
        [1720, GY, 'turret', 1570, 2000],
        [1760, MY, 'crawler', 1680, 1850],
        [1940, HY, 'drone', 1880, 2020],
        [2020, GY, 'hookman', 1570, 2140]
      ]
    },
    {
      name: '钢架', boss: '旋炮', w: 2460, hp: 28, theme: 'steel',
      ground: [[0, 420], [560, 220], [960, 260], [1400, 280], [1860, 600]],
      plats: [
        [120, MY, 140], [280, HY, 120], [400, MY, 180], [520, HY, 130],
        [760, MY, 220], [820, HY, 140], [1080, MY, 160],
        [1200, MY, 220], [1280, HY, 150], [1520, MY, 170],
        [1660, MY, 220], [1740, HY, 140], [2000, MY, 180],
        [2160, HY, 150], [2280, MY, 150]
      ],
      drops: [
        [180, MY, 'heart'], [860, HY, 'rapid'], [1540, MY, 'star'], [2180, HY, 'heart']
      ],
      ents: [
        [180, GY, 'crawler', 20, 400],
        [200, MY, 'hookman', 120, 260],
        [320, HY, 'drone', 280, 400],
        [480, MY, 'nest', 400, 580],
        [640, GY, 'turret', 570, 760],
        [840, MY, 'crawler', 760, 980],
        [880, HY, 'drone', 820, 960],
        [1140, MY, 'turret', 1080, 1240],
        [1160, GY, 'hookman', 970, 1200],
        [1320, HY, 'drone', 1280, 1430],
        [1320, MY, 'nest', 1200, 1420],
        [1520, GY, 'crawler', 1410, 1660],
        [1600, MY, 'hookman', 1520, 1690],
        [1760, HY, 'drone', 1740, 1880],
        [1760, MY, 'turret', 1660, 1880],
        [2040, GY, 'crawler', 1870, 2300],
        [2080, MY, 'nest', 2000, 2180],
        [2220, HY, 'drone', 2160, 2310],
        [2320, GY, 'hookman', 1870, 2440]
      ]
    },
    {
      name: '炮巢', boss: '联装', w: 2740, hp: 36, theme: 'nest',
      ground: [[0, 400], [520, 200], [900, 240], [1320, 220], [1720, 260], [2160, 580]],
      plats: [
        [100, MY, 140], [220, HY, 120], [380, MY, 170], [440, HY, 120],
        [700, MY, 220], [760, HY, 140], [1040, MY, 160],
        [1120, MY, 220], [1180, HY, 150], [1440, MY, 160],
        [1520, MY, 220], [1580, HY, 140], [1840, MY, 170],
        [1960, MY, 220], [2040, HY, 150], [2320, MY, 180],
        [2460, HY, 140], [2520, MY, 150]
      ],
      drops: [
        [160, MY, 'heart'], [800, HY, 'rapid'], [1460, MY, 'star'],
        [2060, HY, 'heart'], [2360, MY, 'rapid']
      ],
      ents: [
        [180, GY, 'crawler', 20, 380],
        [180, MY, 'hookman', 100, 240],
        [260, HY, 'drone', 220, 340],
        [460, MY, 'nest', 380, 550],
        [600, GY, 'turret', 530, 700],
        [780, MY, 'crawler', 700, 920],
        [820, HY, 'drone', 760, 900],
        [1040, GY, 'hookman', 910, 1120],
        [1100, MY, 'turret', 1040, 1200],
        [1240, HY, 'drone', 1180, 1330],
        [1240, MY, 'nest', 1120, 1340],
        [1440, GY, 'crawler', 1330, 1520],
        [1520, MY, 'hookman', 1440, 1600],
        [1640, HY, 'drone', 1580, 1720],
        [1640, MY, 'turret', 1520, 1740],
        [1840, GY, 'crawler', 1730, 1960],
        [1920, MY, 'nest', 1840, 2010],
        [2100, HY, 'drone', 2040, 2190],
        [2060, MY, 'turret', 1960, 2180],
        [2320, GY, 'hookman', 2170, 2580],
        [2400, MY, 'crawler', 2320, 2500],
        [2520, HY, 'drone', 2460, 2600],
        [2580, GY, 'turret', 2170, 2720]
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
  function spdMul(net, stage) {
    return (net ? 1.28 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
  }
  function walkMul(net) {
    return net ? 1.12 : 1;
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

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (GY - MY !== 72 || MY - HY !== 72) throw new Error('floor spacing');
    if (ARM_MAX < GY - HY) throw new Error('arm too short for high');
    if (ARM_MAX < 160 || ARM_MAX > 220) throw new Error('arm range');
    if (ARM_MIN >= 40) throw new Error('arm min');
    if (WALK >= 200) throw new Error('walk should be slower than contra');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('net faster');
    if (walkMul(true) <= walkMul(false)) throw new Error('net walk');
    if (HP_NET >= HP_HOOK) throw new Error('net hp');
    if (BEST_KEY !== 'playbox-bionic-best') throw new Error('best key');
    if (AUTO_SPEED_KEY !== 'playbox-bionic-auto-speed') throw new Error('auto key');
    if (AUTO_SCALE[3] !== 1 || AUTO_SCALE[4] <= AUTO_SCALE[3]) throw new Error('auto scale');
    if (AUTO_SCALE[1] >= AUTO_SCALE[2] || AUTO_SCALE[2] >= AUTO_SCALE[3]) throw new Error('auto scale order');
    if (SPEED_LABELS[3] !== '快' || SPEED_LABELS[4] !== '极快') throw new Error('speed labels');
    if (STAGES[0].w >= STAGES[1].w || STAGES[1].w >= STAGES[2].w) throw new Error('wider later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (typeof JUMP_V !== 'undefined') throw new Error('no jump');
    let i, s;
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      if (!s.ground.length || !s.ents.length || !s.plats.length) throw new Error('stage ' + s.name);
    }
    for (i = 0; i < STAGES.length; i++) {
      s = STAGES[i];
      let g0, gap, covered, p, k;
      for (k = 0; k < s.ground.length - 1; k++) {
        g0 = s.ground[k];
        gap = s.ground[k + 1][0] - (g0[0] + g0[1]);
        if (gap <= 0) throw new Error('overlap ground ' + s.name);
        if (gap <= 36) continue;
        covered = false;
        for (p = 0; p < s.plats.length; p++) {
          const pl = s.plats[p];
          const left = g0[0] + g0[1];
          const right = s.ground[k + 1][0];
          if (pl[0] + pl[2] > left - 24 && pl[0] < right + 24) {
            const ox = g0[0] + g0[1] - 10;
            const oy = GY - 18;
            const cx = pl[0] + pl[2] * 0.5;
            const cy = pl[1] + 10;
            if (hypot(cx - ox, cy - oy) <= ARM_MAX + 8) covered = true;
          }
        }
        if (!covered) throw new Error('pit ' + gap + ' in ' + s.name);
      }
      let e, ok, q;
      for (k = 0; k < s.ents.length; k++) {
        e = s.ents[k];
        if (e[2] === 'drone') continue;
        ok = false;
        if (e[1] === GY) {
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
      for (k = 0; k < s.drops.length; k++) {
        e = s.drops[k];
        ok = false;
        if (e[1] === GY) {
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
  const btnHookStart = document.getElementById('btn-hook-start');
  const btnNetStart = document.getElementById('btn-net-start');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeHook = document.getElementById('mode-hook');
  const modeNet = document.getElementById('mode-net');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
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

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: true, u: false, d: false, fire: false };
  const autoIn = { l: false, r: false, u: false, d: false, fire: false };
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoStuck = 0;
  let autoLastX = 0;
  let autoLastY = 0;
  let autoWalkDir = 1;
  let autoBackT = 0;
  let autoHookCd = 0;
  let autoGoalX = 80;
  let autoGoalY = GY;
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const mist = [];

  const G = {
    mode: 'title',
    kind: 'hook',
    t: 0,
    clock: 0,
    stage: 1,
    camX: 0,
    camY: 0,
    levelW: 2160,
    plats: [],
    ents: [],
    shots: [],
    pickups: [],
    player: null,
    arm: null,
    boss: null,
    lives: LIVES,
    hp: HP_HOOK,
    gun: 'rifle',
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    checkX: 70,
    checkY: GY,
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
    demoHookCd: 0,
    why: ''
  };

  function isNet() {
    return G.kind === 'net';
  }
  function playing() {
    return G.mode === 'play';
  }
  function live() {
    return G.mode === 'play' || G.mode === 'title';
  }
  function maxHp() {
    return isNet() ? HP_NET : HP_HOOK;
  }
  function autoPlaying() {
    return autoOn && G.mode === 'play';
  }
  function inL() {
    if (autoPlaying()) return autoIn.l;
    return G.mode === 'title' ? demo.l : keys.l;
  }
  function inR() {
    if (autoPlaying()) return autoIn.r;
    return G.mode === 'title' ? demo.r : keys.r;
  }
  function inU() {
    if (autoPlaying()) return autoIn.u;
    return G.mode === 'title' ? demo.u : keys.u;
  }
  function inD() {
    if (autoPlaying()) return autoIn.d;
    return G.mode === 'title' ? demo.d : keys.d;
  }
  function fireHeld() {
    if (autoPlaying()) return autoIn.fire;
    return G.mode === 'title' ? demo.fire : keys.fire;
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
    shot() {
      this.ensure();
      this.noise(0.03, 0.03, 1800);
      this.beep(880, 0.05, 'square', 0.036, 320);
    },
    hook() {
      this.ensure();
      this.noise(0.04, 0.032, 1600);
      this.beep(420, 0.08, 'sawtooth', 0.04, 980);
    },
    latch() {
      this.ensure();
      this.noise(0.05, 0.05, 900);
      this.beep(240, 0.07, 'square', 0.05, 720);
      this.beep(980, 0.09, 'triangle', 0.036, 1400);
    },
    whiff() {
      this.ensure();
      this.beep(220, 0.08, 'sine', 0.028, 90);
    },
    release() {
      this.ensure();
      this.beep(360, 0.06, 'triangle', 0.03, 180);
    },
    land() {
      this.ensure();
      this.noise(0.045, 0.028, 380);
      this.beep(120, 0.05, 'triangle', 0.024, 64);
    },
    crack() {
      this.ensure();
      this.noise(0.035, 0.04, 1900);
      this.beep(920, 0.05, 'square', 0.038, 280);
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
      this.beep(1320 * lift, 0.05, 'triangle', 0.028, 480);
    },
    hurt() {
      this.ensure();
      this.noise(0.1, 0.055, 380);
      this.beep(300, 0.12, 'sawtooth', 0.05, 86);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(170, 0.16, 'sawtooth', 0.05, 52);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.055, 320);
      this.beep(260, 0.2, 'sawtooth', 0.05, 68);
      this.beep(130, 0.32, 'sine', 0.045, 40);
    },
    boss() {
      this.ensure();
      this.beep(170, 0.18, 'sawtooth', 0.05, 86);
      this.beep(100, 0.3, 'square', 0.04, 60);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.045, 784);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(190, 0.18, 'sawtooth', 0.04, 76);
      this.beep(110, 0.3, 'sine', 0.05, 42);
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
    try { localStorage.setItem(AUTO_SPEED_KEY, String(n)); } catch (err) { /* ignore */ }
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
    const n = isNet();
    if (modeHook) modeHook.setAttribute('aria-pressed', n ? 'false' : 'true');
    if (modeNet) modeNet.setAttribute('aria-pressed', n ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (hpEl) hpEl.textContent = String(Math.max(0, G.hp));
    if (hpFill) hpFill.style.transform = 'scaleX(' + clamp(G.hp / maxHp(), 0, 1) + ')';
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      stageLabel.textContent = (isNet() ? '机网 ' : '') + spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (G.boss && G.boss.active));
    }
    if (tagLabel) {
      tagLabel.textContent = isNet() ? '机网' : '钩关';
      tagLabel.classList.toggle('warn', isNet());
      tagLabel.classList.toggle('hot', !isNet() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = G.gun === 'rapid' ? '连射' : '步枪';
      gunLabel.className = 'gun' + (G.gun === 'rapid' ? ' rapid' : '');
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    if (autoOn) {
      if (G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下', 'hot');
      else if (G.mode === 'lose') setHint('自动仍开着 · 即将再开 · A 停下', 'warn');
      else if (G.mode === 'win') setHint('自动仍开着 · 即将再开 · A 停下', 'hot');
      else if (G.boss && G.boss.active && !G.boss.dead) setHint('托管中 · 炮塔 · A 停下', 'hot');
      else setHint('托管中 · 钩臂荡上去 · A 停下', 'hot');
    } else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 没有跳跃 · 钩臂荡上去', 'warn');
    else if (G.mode === 'win') setHint('炮塔已灭 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift钩 · 空格射', 'warn');
    else if (G.boss && G.boss.active && !G.boss.dead) setHint('炮塔 · ' + spec.boss, 'hot');
    else setHint('没有跳跃 · Shift/Z 钩臂荡上去 · 空格开枪 · A 自动', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'BION';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '机网' : '换模式';
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
      w: PW, h: PH,
      grounded: true, squash: 1, run: 0
    };
  }

  function makeArm() {
    return {
      state: 'idle',
      ax: 0, ay: 0, dx: 0, dy: -1,
      len: 0, ang: 0, av: 0, plat: null
    };
  }

  function makePlat(x, y, w, base) {
    return { x: x, y: y, w: w, h: base ? 48 : 12, base: !!base };
  }

  function hpOf(kind) {
    if (kind === 'turret' || kind === 'nest') return 2;
    return 1;
  }

  function makeEnt(x, y, kind, a, b) {
    const hp = hpOf(kind);
    const fly = kind === 'drone';
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0, face: -1,
      kind: kind, hp: hp, max: hp,
      a: a, b: b, base: y,
      t: rand(0, 2), fire: rand(0.4, 1.2),
      grounded: !fly, dead: false, hitN: 0,
      w: kind === 'turret' ? 16 : kind === 'drone' ? 16 : kind === 'nest' ? 14 : 14,
      h: kind === 'turret' ? 20 : kind === 'drone' ? 12 : kind === 'crawler' ? 10 : kind === 'nest' ? 14 : 22
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isNet() ? 1.2 : 1)) | 0;
    return {
      id: uid++,
      x: spec.w - 140, y: GY, vx: 0, vy: 0, face: -1,
      hp: hp, max: hp, kind: spec.boss, name: spec.boss,
      t: 0, fire: 1.1, state: 'wait',
      grounded: true, dead: false, active: false,
      hitN: 0, w: 44, h: 52, base: GY
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

  function platUnder(x, y, skip) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x < p.x + 3 || x > p.x + p.w - 3) continue;
      if (y >= p.y - 4 && y <= p.y + 10) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function standAt(x, y) {
    return !!platUnder(x, y, null);
  }

  function landOn(x, y0, y1, skip) {
    let best = null;
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skip) continue;
      if (x < p.x + 3 || x > p.x + p.w - 3) continue;
      if (y0 <= p.y + 2 && y1 >= p.y - 1) {
        if (!best || p.y < best.y) best = p;
      }
    }
    return best;
  }

  function pitAhead(x, y, dir) {
    return !standAt(x + dir * 28, y);
  }

  function pBox() {
    const p = G.player;
    return { x: p.x - p.w * 0.45, y: p.y - p.h, w: p.w * 0.9, h: p.h };
  }

  function armOrigin() {
    const p = G.player;
    return { x: p.x + p.face * 7, y: p.y - 17 };
  }

  function aimVec() {
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    if (inU()) dy -= 1;
    if (inD()) dy += 1;
    if (!dx && !dy) {
      dx = G.player.face;
      dy = -1;
    }
    const l = hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l };
  }

  function gunDir() {
    let dx = 0;
    let dy = 0;
    if (inL()) dx -= 1;
    if (inR()) dx += 1;
    if (inU()) dy -= 1;
    if (inD()) dy += 1;
    if (!dx && !dy) {
      dx = G.player.face;
      dy = 0;
    }
    const l = hypot(dx, dy) || 1;
    return { x: dx / l, y: dy / l };
  }

  function clipSeg(p, q, t0, t1) {
    if (p === 0) return q >= 0 ? [t0, t1] : null;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
    return [t0, t1];
  }

  function segAabb(x0, y0, x1, y1, rx, ry, rw, rh) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    let t0 = 0;
    let t1 = 1;
    let c;
    c = clipSeg(-dx, x0 - rx, t0, t1); if (!c) return null; t0 = c[0]; t1 = c[1];
    c = clipSeg(dx, rx + rw - x0, t0, t1); if (!c) return null; t0 = c[0]; t1 = c[1];
    c = clipSeg(-dy, y0 - ry, t0, t1); if (!c) return null; t0 = c[0]; t1 = c[1];
    c = clipSeg(dy, ry + rh - y0, t0, t1); if (!c) return null; t0 = c[0]; t1 = c[1];
    const t = t0 > 0.012 ? t0 : (t0 <= 0 && t1 > 0.02 ? null : t1);
    if (t == null || t < 0.012 || t > 1) return null;
    return { x: x0 + dx * t, y: y0 + dy * t, t: t };
  }

  function rayHit(x0, y0, x1, y1, skipPlat) {
    let best = null;
    let bestT = 1.01;
    let i, p, hit;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p === skipPlat) continue;
      hit = segAabb(x0, y0, x1, y1, p.x, p.y, p.w, p.h);
      if (hit && hit.t < bestT) {
        bestT = hit.t;
        best = { x: hit.x, y: hit.y, t: hit.t, plat: p };
      }
    }
    return best;
  }

  function floorPlat() {
    const p = G.player;
    return platUnder(p.x, p.y, null);
  }

  function spawnPickup(x, y, kind, rest) {
    G.pickups.push({
      x: x, y: y, kind: kind, taken: false, t: 0,
      vy: rest ? 0 : -90, life: rest ? 99 : 8, rest: !!rest
    });
  }

  function takePickup(u) {
    if (u.taken) return;
    u.taken = true;
    audio.ping();
    kick(2.2, 'pickup');
    screenFlash(GOLD, 0.22);
    popSpark(u.x, u.y, GOLD, 16);
    if (u.kind === 'heart') {
      G.hp = Math.min(maxHp(), G.hp + 1);
      toast('生命 +1', false, true);
      floatText(u.x, u.y - 8, '+1', MAG, false);
    } else if (u.kind === 'rapid') {
      G.gun = 'rapid';
      toast('连射', false, true);
      addScore(SCORE.rapid * G.mult);
    } else {
      addScore(SCORE.star * G.mult);
      floatText(u.x, u.y - 8, String(SCORE.star * G.mult), GOLD, false);
    }
    emit(10, {
      x: u.x, y: u.y, j: 8,
      vx0: -140, vx1: 140, vy0: -220, vy1: -20,
      life: 0.32, r0: 1.2, r1: 3, rgb: GOLD
    });
    syncHud();
  }

  function maybeDrop(e) {
    if (!playing()) return;
    const r = Math.random();
    const tank = e.kind === 'turret' || e.kind === 'nest';
    if (tank && r < 0.18) spawnPickup(e.x, e.y - 12, 'rapid', false);
    else if (r < (tank ? 0.36 : 0.16)) spawnPickup(e.x, e.y - 12, 'heart', false);
    else if (r < 0.5) spawnPickup(e.x, e.y - 12, 'star', false);
  }

  function spawnShot(s) {
    s.id = uid++;
    s.dead = false;
    if (!s.life) s.life = 1.2;
    G.shots.push(s);
  }

  function hitEnemy(e, dmg) {
    if (e.dead) return;
    if (!playing()) {
      popSpark(e.x, e.y - e.h * 0.5, CYN, 10);
      return;
    }
    e.hp -= dmg;
    e.hitN = 0.09;
    const cx = e.x;
    const cy = e.y - e.h * 0.5;
    const tank = e.max > 1;
    if (e.hp <= 0) {
      e.dead = true;
      bumpCombo();
      const sc = (SCORE[e.kind] || 100) * G.mult;
      addScore(sc);
      floatText(cx, cy, String(sc), GOLD, tank);
      audio.hit(G.combo);
      juice(cx, cy, tank ? HOT : CYN, tank ? 1.05 : 0.72);
      hitStop(tank ? 0.068 : 0.046);
      maybeDrop(e);
    } else {
      audio.crack();
      emit(7, {
        x: cx, y: cy, j: 6,
        vx0: -140, vx1: 140, vy0: -200, vy1: -10,
        life: 0.22, r0: 1, r1: 2.6, rgb: CYN
      });
      popSpark(cx, cy, GOLD, 12);
      hitStop(0.04);
      kick(2.2);
    }
  }

  function hitBoss(dmg) {
    const b = G.boss;
    if (!b || b.dead || !b.active) return;
    b.hp -= dmg;
    b.hitN = 0.1;
    audio.hit(G.combo);
    juice(b.x, b.y - 20, MAG, 1.08);
    hitStop(0.072);
    kick(3.4, 'boom');
    if (b.hp <= 0) {
      b.dead = true;
      b.active = false;
      bumpCombo();
      addScore(SCORE.boss * G.mult);
      addScore(SCORE.stage * G.stage);
      floatText(b.x, b.y - 30, String(SCORE.boss * G.mult), GOLD, true);
      audio.boom();
      juice(b.x, b.y - 18, GOLD, 1.7);
      toast(b.name + ' 倒下', false, true);
      G.lock = 0.2;
      G.clearT = 1.65;
    }
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why === 'fall' ? '坠入深渊了' : G.why === 'boss' ? '被炮塔击倒了' : '生命耗尽了';
    showOverlay('lose', why, '分数 ' + G.score + ' · 连击最高 ×' + G.maxCombo + ' · R 重开');
    syncHud();
  }

  function goWin() {
    if (!isNet()) {
      G.score += 8000;
      saveBest();
      if (scoreEl) scoreEl.textContent = String(G.score);
    }
    G.mode = 'win';
    audio.win();
    kick(5, 'win-flash');
    const title = isNet() ? '机网得手' : '废港已清';
    showOverlay('win', title, '分数 ' + G.score + ' · 连击最高 ×' + G.maxCombo);
    syncHud();
  }

  function loadStage(n, title) {
    const spec = STAGES[n - 1] || STAGES[0];
    G.stage = n;
    G.levelW = spec.w;
    G.plats = [];
    G.ents = [];
    G.shots = [];
    G.pickups = [];
    let i, g, p, e;
    for (i = 0; i < spec.ground.length; i++) {
      g = spec.ground[i];
      G.plats.push(makePlat(g[0], GY, g[1], true));
    }
    for (i = 0; i < spec.plats.length; i++) {
      p = spec.plats[i];
      G.plats.push(makePlat(p[0], p[1], p[2], false));
    }
    for (i = 0; i < spec.ents.length; i++) {
      e = spec.ents[i];
      G.ents.push(makeEnt(e[0], e[1], e[2], e[3], e[4]));
    }
    if (isNet() && !title) {
      const extra = [];
      for (i = 0; i < spec.ents.length; i++) {
        e = spec.ents[i];
        if (e[2] === 'crawler' || e[2] === 'hookman') {
          extra.push(makeEnt(e[0] + 54, e[1], e[2], e[3], e[4]));
        } else if (e[2] === 'drone' && i % 2 === 0) {
          extra.push(makeEnt(e[0] + 40, e[1] - 16, 'drone', e[3], e[4]));
        }
      }
      for (i = 0; i < extra.length; i++) G.ents.push(extra[i]);
    }
    for (i = 0; i < spec.drops.length; i++) {
      e = spec.drops[i];
      spawnPickup(e[0], e[1] - 16, e[2], true);
    }
    G.boss = makeBoss(spec);
    G.player = makePlayer(title ? 70 : 64, GY);
    G.arm = makeArm();
    G.checkX = G.player.x;
    G.checkY = GY;
    G.camX = 0;
    G.camY = 0;
    G.clearT = 0;
    G.lock = 0;
    G.fireCd = 0;
    G.deadT = 0;
    G.knockT = 0;
    seedMist();
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function nextStage() {
    if (G.stage >= STAGES.length) {
      goWin();
      return;
    }
    audio.stage();
    toast(STAGES[G.stage].name, false, true);
    const keep = { hp: G.hp, gun: G.gun, score: G.score, lives: G.lives };
    loadStage(G.stage + 1, false);
    G.hp = keep.hp;
    G.gun = keep.gun;
    G.score = keep.score;
    G.lives = keep.lives;
    G.invuln = 1.05;
    syncHud();
  }

  function respawn() {
    G.deadT = 0;
    G.hp = maxHp();
    G.invuln = INVULN;
    G.knockT = 0;
    G.gun = 'rifle';
    G.arm = makeArm();
    G.player = makePlayer(G.checkX, G.checkY);
    G.player.squash = 0.86;
    autoStuck = 0;
    autoHookCd = 0;
    autoBackT = 0;
    autoLastX = G.checkX;
    autoLastY = G.checkY;
    syncHud();
  }

  function die(why) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    G.why = why;
    G.lives -= 1;
    G.deadT = DIE_T;
    G.combo = 0;
    G.mult = 1;
    G.arm.state = 'idle';
    G.player.vy = -80;
    audio.death();
    kick(6.5, 'die');
    screenFlash(MAG, 0.55);
    juice(G.player.x, G.player.y - 12, MAG, 1.2);
    toast(why === 'fall' ? '坠入深渊' : '被击倒', true, false);
    syncHud();
  }

  function hurt(fromX, dmg, why) {
    if (G.invuln > 0 || G.deadT > 0 || !playing()) return;
    G.hp -= dmg;
    G.combo = 0;
    G.mult = 1;
    audio.hurt();
    kick(5, 'die');
    screenFlash(MAG, 0.48);
    hitStop(0.055);
    const p = G.player;
    G.arm.state = 'idle';
    p.vx = (p.x < fromX ? -1 : 1) * 150;
    p.vy = -140;
    p.grounded = false;
    G.knockT = 0.2;
    if (hpBox) {
      hpBox.classList.remove('hurt');
      void hpBox.offsetWidth;
      hpBox.classList.add('hurt');
    }
    juice(p.x, p.y - 12, MAG, 0.7);
    if (G.hp <= 0) die(why);
    else {
      G.invuln = INVULN;
      syncHud();
    }
  }

  function startGame(kind) {
    audio.ensure();
    audio.start();
    G.kind = kind === 'net' ? 'net' : 'hook';
    G.mode = 'play';
    G.lives = LIVES;
    G.hp = maxHp();
    G.gun = 'rifle';
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.invuln = 0.55;
    G.deadT = 0;
    G.why = '';
    loadStage(1, false);
    hideOverlay();
    autoOvWait = 0;
    autoStuck = 0;
    autoBackT = 0;
    autoHookCd = 0;
    autoWalkDir = 1;
    autoLastX = G.player ? G.player.x : 64;
    autoLastY = G.player ? G.player.y : GY;
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'hook';
    G.lives = LIVES;
    G.hp = HP_HOOK;
    G.gun = 'rifle';
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.invuln = 99;
    G.deadT = 0;
    loadStage(1, true);
    showOverlay('title', '仿生', '没有跳跃。射出仿生臂钩住平台，荡过去或拉上去。开枪清敌，坠崖或血空丢命。关底是炮塔。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('hook');
    else startGame(G.kind || 'hook');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('hook');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function latchAt(hit) {
    const p = G.player;
    const arm = G.arm;
    arm.state = 'latch';
    arm.ax = hit.x;
    arm.ay = hit.y;
    arm.plat = hit.plat;
    const dx = p.x - hit.x;
    const dy = p.y - hit.y;
    arm.len = Math.max(ARM_MIN, hypot(dx, dy));
    arm.ang = Math.atan2(dx, dy);
    const c = Math.cos(arm.ang);
    const s = Math.sin(arm.ang);
    arm.av = (p.vx * c - p.vy * s) / Math.max(24, arm.len);
    p.grounded = false;
    if (playing()) audio.latch();
    popSpark(hit.x, hit.y, CYN, 15);
    emit(10, {
      x: hit.x, y: hit.y, j: 5,
      vx0: -160, vx1: 160, vy0: -180, vy1: 40,
      life: 0.22, r0: 1, r1: 2.6, rgb: GOLD, g: 80
    });
    hitStop(0.034);
    kick(2.4, 'thump');
  }

  function releaseArm(fling) {
    const arm = G.arm;
    const p = G.player;
    if (arm.state === 'latch' && fling) {
      const c = Math.cos(arm.ang);
      const s = Math.sin(arm.ang);
      p.vx = arm.av * arm.len * c;
      p.vy = -arm.av * arm.len * s;
      if (playing()) audio.release();
      emit(6, {
        x: arm.ax, y: arm.ay, j: 4,
        vx0: -80, vx1: 80, vy0: -60, vy1: 40,
        life: 0.16, r0: 1, r1: 2.2, rgb: CYN, g: 40
      });
    }
    arm.state = 'idle';
    arm.plat = null;
    p.grounded = false;
  }

  function tryHook() {
    if (!live() || G.deadT > 0 || G.lock > 0) return;
    if (G.mode === 'play' && overlayOpen()) return;
    const arm = G.arm;
    if (!arm) return;
    if (arm.state === 'latch') {
      releaseArm(true);
      return;
    }
    if (arm.state === 'out' || arm.state === 'back') {
      arm.state = 'back';
      return;
    }
    const o = armOrigin();
    const d = aimVec();
    arm.state = 'out';
    arm.dx = d.x;
    arm.dy = d.y;
    arm.len = 14;
    arm.ax = o.x + d.x * 14;
    arm.ay = o.y + d.y * 14;
    arm.plat = null;
    if (playing() || G.mode === 'title') audio.hook();
    emit(5, {
      x: o.x, y: o.y, j: 3,
      vx0: d.x * 40, vx1: d.x * 180, vy0: d.y * 40, vy1: d.y * 160,
      life: 0.12, r0: 0.8, r1: 2, rgb: CYN, g: 0
    });
  }

  function tryClimb() {
    const arm = G.arm;
    const p = G.player;
    if (arm.state !== 'latch' || !inU() || arm.len > 58) return false;
    const plat = arm.plat;
    if (!plat) return false;
    const onX = p.x >= plat.x - 16 && p.x <= plat.x + plat.w + 16;
    const near = arm.ay >= plat.y - 6 && arm.ay <= plat.y + plat.h + 16;
    if (!onX || !near) return false;
    p.x = clamp(p.x, plat.x + 10, plat.x + plat.w - 10);
    p.y = plat.y;
    p.vx = 0;
    p.vy = 0;
    p.grounded = true;
    p.squash = 0.68;
    arm.state = 'idle';
    arm.plat = null;
    G.checkX = p.x;
    G.checkY = plat.y;
    if (playing()) audio.land();
    landDust(p.x, p.y, 1.15);
    kick(2.6, 'thump');
    hitStop(0.03);
    popSpark(p.x, p.y - 8, HOT, 12);
    return true;
  }

  function updateArm(dt) {
    const arm = G.arm;
    const p = G.player;
    if (!arm || arm.state === 'idle') return;
    const o = armOrigin();

    if (arm.state === 'out') {
      const prev = arm.len;
      arm.len = Math.min(ARM_MAX, arm.len + ARM_OUT * dt);
      const x0 = o.x + arm.dx * prev;
      const y0 = o.y + arm.dy * prev;
      const x1 = o.x + arm.dx * arm.len;
      const y1 = o.y + arm.dy * arm.len;
      const skip = p.grounded ? floorPlat() : null;
      const hit = rayHit(x0, y0, x1, y1, skip);
      if (hit) {
        latchAt(hit);
      } else {
        arm.ax = x1;
        arm.ay = y1;
        if (arm.len >= ARM_MAX) {
          arm.state = 'back';
          if (playing()) audio.whiff();
        }
      }
      if (Math.random() < 0.45) {
        emit(1, {
          x: arm.ax, y: arm.ay, j: 2,
          vx0: -20, vx1: 20, vy0: -20, vy1: 20,
          life: 0.1, r0: 0.7, r1: 1.6, rgb: CYN, g: 0
        });
      }
      return;
    }

    if (arm.state === 'back') {
      arm.len -= ARM_BACK * dt;
      if (arm.len <= 10) {
        arm.state = 'idle';
        return;
      }
      arm.ax = o.x + arm.dx * arm.len;
      arm.ay = o.y + arm.dy * arm.len;
      return;
    }

    if (arm.state === 'latch') {
      if (inU()) arm.len = Math.max(ARM_MIN, arm.len - ARM_REEL * dt);
      if (inD()) arm.len = Math.min(ARM_MAX, arm.len + ARM_REEL * dt);
      arm.av += -(SWING_G / Math.max(36, arm.len)) * Math.sin(arm.ang) * dt;
      if (inL() && !inR()) arm.av -= 7.4 * dt;
      if (inR() && !inL()) arm.av += 7.4 * dt;
      arm.av *= Math.exp(-0.42 * dt);
      arm.ang += arm.av * dt;
      if (arm.ang > 2.55) { arm.ang = 2.55; arm.av *= -0.28; }
      if (arm.ang < -2.55) { arm.ang = -2.55; arm.av *= -0.28; }
      p.x = arm.ax + arm.len * Math.sin(arm.ang);
      p.y = arm.ay + arm.len * Math.cos(arm.ang);
      p.vx = arm.av * arm.len * Math.cos(arm.ang);
      p.vy = -arm.av * arm.len * Math.sin(arm.ang);
      p.grounded = false;
      if (Math.abs(p.vx) > 18) p.face = p.vx >= 0 ? 1 : -1;
      if (Math.abs(arm.av) > 1.15) {
        emit(1, {
          x: arm.ax, y: arm.ay, j: 3,
          vx0: -50, vx1: 50, vy0: -40, vy1: 30,
          life: 0.12, r0: 0.8, r1: 2, rgb: GOLD, g: 20
        });
      }
      if (tryClimb()) return;
    }
  }

  function tryShoot(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if (!fireHeld() || G.fireCd > 0 || G.deadT > 0 || G.lock > 0) return;
    const rapid = G.gun === 'rapid';
    let n = 0;
    let i;
    for (i = 0; i < G.shots.length; i++) {
      if (!G.shots[i].dead && G.shots[i].from === 'p') n += 1;
    }
    if (n >= (rapid ? 7 : 4)) return;
    const d = gunDir();
    const p = G.player;
    const x = p.x + d.x * 14;
    const y = p.y - 14 + d.y * 6;
    const spd = rapid ? 640 : 560;
    spawnShot({
      x: x, y: y, vx: d.x * spd, vy: d.y * spd,
      from: 'p', life: 0.72, rgb: rapid ? CYN : GOLD,
      kind: 'pellet'
    });
    G.fireCd = rapid ? 0.066 : 0.155;
    audio.shot();
    emit(4, {
      x: x, y: y, j: 2,
      vx0: d.x * 40, vx1: d.x * 160, vy0: d.y * 20 - 30, vy1: d.y * 80,
      life: 0.1, r0: 0.8, r1: 1.8, rgb: GOLD, g: 0
    });
  }

  function clearAutoKeys() {
    autoIn.l = false;
    autoIn.r = false;
    autoIn.u = false;
    autoIn.d = false;
    autoIn.fire = false;
  }

  function autoSteer(tx) {
    autoIn.l = false;
    autoIn.r = false;
    const dx = tx - G.player.x;
    if (dx > 8) {
      autoIn.r = true;
      autoWalkDir = 1;
    } else if (dx < -8) {
      autoIn.l = true;
      autoWalkDir = -1;
    }
  }

  function autoAimHook(tx, ty) {
    const p = G.player;
    const o = armOrigin();
    const dx = tx - o.x;
    const dy = ty - o.y;
    autoIn.l = false;
    autoIn.r = false;
    autoIn.u = dy < -8;
    autoIn.d = dy > 18;
    if (dx > 6) p.face = 1;
    else if (dx < -6) p.face = -1;
  }

  function autoAimToward(tx, ty) {
    const o = armOrigin();
    const dx = tx - o.x;
    const dy = ty - o.y;
    autoIn.l = dx < -10;
    autoIn.r = dx > 10;
    autoIn.u = dy < -8;
    autoIn.d = dy > 16;
    if (dx > 8) G.player.face = 1;
    else if (dx < -8) G.player.face = -1;
  }

  function hookAimPoint(plat) {
    const o = armOrigin();
    let tx;
    if (o.x < plat.x + 8) tx = plat.x + Math.min(24, plat.w * 0.35);
    else if (o.x > plat.x + plat.w - 8) tx = plat.x + plat.w - Math.min(24, plat.w * 0.35);
    else tx = clamp(o.x, plat.x + 10, plat.x + plat.w - 10);
    return { x: tx, y: plat.y + (plat.base ? 8 : 5) };
  }

  function canHookPlat(plat) {
    if (!plat || !G.player) return false;
    const skip = G.player.grounded ? floorPlat() : null;
    if (plat === skip) return false;
    const o = armOrigin();
    const t = hookAimPoint(plat);
    const dx = t.x - o.x;
    const dy = t.y - o.y;
    const d = hypot(dx, dy);
    if (d < 20 || d > ARM_MAX - 1) return false;
    const hit = rayHit(o.x, o.y, o.x + (dx / d) * ARM_MAX, o.y + (dy / d) * ARM_MAX, skip);
    return !!(hit && hit.plat === plat);
  }

  function pickHookPlat(dir, preferUp) {
    const p = G.player;
    const skip = p.grounded ? floorPlat() : null;
    let best = null;
    let bestS = -1e9;
    let i, plat, t, dx, d, score, ahead;
    for (i = 0; i < G.plats.length; i++) {
      plat = G.plats[i];
      if (plat === skip) continue;
      if (!canHookPlat(plat)) continue;
      t = hookAimPoint(plat);
      dx = t.x - p.x;
      d = hypot(dx, t.y - p.y);
      ahead = dx * dir;
      score = 0;
      if (ahead > 6) score += 90 + ahead * 0.45;
      else if (ahead > -36) score += 18;
      else score -= 90;
      if (plat.y < p.y - 10) score += preferUp ? 80 : 28;
      if (plat.y > p.y + 24) score -= 24;
      if (!plat.base) score += 18;
      score -= d * 0.16;
      if (score > bestS) {
        bestS = score;
        best = plat;
      }
    }
    return best;
  }

  function groundBelow(x) {
    let i, p;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (!p.base) continue;
      if (x >= p.x + 6 && x <= p.x + p.w - 6) return p;
    }
    return null;
  }

  function autoShotThreat() {
    const p = G.player;
    let i, s, t;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.from !== 'e' || s.dead) continue;
      if (Math.abs(s.y - (p.y - 12)) > 30) continue;
      if (Math.abs(s.vx) < 8) {
        if (Math.abs(s.x - p.x) < 48 && s.y < p.y + 4) return s;
        continue;
      }
      t = (p.x - s.x) / s.vx;
      if (t < 0 || t > 0.52) continue;
      if (Math.abs((s.y + s.vy * t) - (p.y - 12)) < 22) return s;
    }
    return null;
  }

  function autoPick() {
    const p = G.player;
    let best = { x: Math.min(G.levelW - 40, p.x + 180), y: p.y, kind: 'go' };
    let bestS = 40;
    function consider(x, y, score, kind) {
      if (score > bestS) {
        bestS = score;
        best = { x: x, y: y, kind: kind };
      }
    }
    let i, u, e, d, pri, dx;
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      d = hypot(u.x - p.x, u.y - (p.y - 12));
      if (d > 280) continue;
      pri = u.kind === 'heart' && G.hp < maxHp() ? 940
        : u.kind === 'heart' ? 180
        : u.kind === 'rapid' && G.gun !== 'rapid' ? 760
        : u.kind === 'rapid' ? 220
        : 260;
      if (u.x < p.x - 90) pri -= 280;
      pri -= d * 0.45;
      consider(u.x, u.y + 12, pri, 'loot');
    }
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      dx = e.x - p.x;
      if (dx < -110) continue;
      d = hypot(dx, e.y - p.y);
      if (d > 320) continue;
      pri = 520 - d * 0.5;
      if (dx > 0) pri += 40;
      if (Math.abs(e.y - p.y) < 28) pri += 50;
      if (e.kind === 'turret' || e.kind === 'nest') pri += 40;
      consider(e.x - (dx >= 0 ? 70 : -70), e.y, pri, 'fight');
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      consider(G.boss.x - 170, GY, 1120, 'boss');
    } else {
      consider(G.levelW - 48, GY, 640, 'exit');
    }
    return best;
  }

  function fireHookAt(tx, ty, grounded) {
    if (autoHookCd > 0) return false;
    const arm = G.arm;
    if (!arm || arm.state !== 'idle') return false;
    if (grounded) autoAimHook(tx, ty);
    else autoAimToward(tx, ty);
    tryHook();
    autoHookCd = 0.42;
    return true;
  }

  function autoThink() {
    clearAutoKeys();
    if (!autoOn || G.mode !== 'play') return;
    const p = G.player;
    const arm = G.arm;
    if (!p || !arm || G.deadT > 0 || G.lock > 0) return;

    const moved = hypot(p.x - autoLastX, p.y - autoLastY);
    if (moved < 1.15) autoStuck += STEP;
    else autoStuck = Math.max(0, autoStuck - STEP * 2);
    autoLastX = p.x;
    autoLastY = p.y;
    if (autoBackT > 0) autoBackT -= STEP;
    if (autoHookCd > 0) autoHookCd -= STEP;

    const goal = autoPick();
    autoGoalX = goal.x;
    autoGoalY = goal.y;
    let dir = autoWalkDir >= 0 ? 1 : -1;
    if (autoBackT <= 0 && goal.x > p.x + 14) dir = 1;
    else if (autoBackT <= 0 && goal.x < p.x - 14) dir = -1;
    autoWalkDir = dir;

    let i, e, close = null, closeD = 1e9, dx, dy, adx;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      dx = e.x - p.x;
      dy = e.y - p.y;
      adx = Math.abs(dx);
      if (adx > 240) continue;
      const d = hypot(dx, dy);
      if (d < closeD) {
        closeD = d;
        close = e;
      }
    }
    if (G.boss && G.boss.active && !G.boss.dead) {
      dx = G.boss.x - p.x;
      dy = G.boss.y - p.y;
      const bd = hypot(dx, dy);
      if (bd < closeD + 20) close = G.boss;
    }

    const shot = autoShotThreat();
    const wantJump = !!(shot && G.invuln <= 0) || autoStuck > 0.55;
    let wantFire = false;

    if (close) {
      adx = Math.abs(close.x - p.x);
      dy = close.y - p.y;
      if (adx < 220 && Math.abs(dy) < 90) wantFire = true;
      if (adx < 36 && Math.abs(dy) < 28) {
        autoSteer(p.x + (close.x >= p.x ? -50 : 50));
        autoIn.fire = true;
        if (close.y < p.y - 16) autoIn.u = true;
        if (wantJump && arm.state === 'idle' && p.grounded) {
          fireHookAt(p.x + dir * 40, p.y - 90, true);
        }
        return;
      }
    }

    if (arm.state === 'out' || arm.state === 'back') {
      if (wantFire) autoIn.fire = true;
      return;
    }

    if (arm.state === 'latch') {
      const plat = arm.plat;
      const climbIt = plat && !plat.base && (goal.y <= plat.y + 18 || plat.y < p.y - 8);
      if (climbIt) {
        autoIn.u = true;
        const mid = plat.x + plat.w * 0.5;
        if (p.x < plat.x + 12) autoIn.r = true;
        else if (p.x > plat.x + plat.w - 12) autoIn.l = true;
        else if (dir > 0) autoIn.r = true;
        else autoIn.l = true;
        if (wantFire) autoIn.fire = true;
        return;
      }
      if (dir > 0) autoIn.r = true;
      else autoIn.l = true;
      if (arm.len > 86) autoIn.u = true;
      const swingingOut = dir > 0 ? (arm.ang > 0.16 && arm.av > 0.15) : (arm.ang < -0.16 && arm.av < -0.15);
      const land = platUnder(p.x + dir * 22, p.y + 12, plat) || platUnder(p.x, p.y + 16, plat);
      const past = dir > 0 ? p.x > arm.ax + 8 : p.x < arm.ax - 8;
      if ((land && swingingOut && land !== plat) || (swingingOut && past && standAt(p.x + dir * 20, GY))) {
        tryHook();
        autoHookCd = 0.18;
      } else if (autoStuck > 0.9) {
        tryHook();
        autoHookCd = 0.22;
      }
      if (wantFire) autoIn.fire = true;
      return;
    }

    if (!p.grounded) {
      const plat = pickHookPlat(dir, true);
      if (plat && (p.vy > 28 || p.y > GY - 24 || autoStuck > 0.18 || wantJump)) {
        const t = hookAimPoint(plat);
        fireHookAt(t.x, t.y, false);
      } else {
        autoSteer(autoGoalX);
      }
      if (wantFire) {
        autoIn.fire = true;
        if (close && close.y < p.y - 18) autoIn.u = true;
      }
      return;
    }

    const pit = pitAhead(p.x, p.y, dir);
    const dropOk = pit && groundBelow(p.x + dir * 40);
    const dropWanted = dropOk && goal.y >= p.y - 8;

    if (pit && !dropWanted) {
      const plat = pickHookPlat(dir, true);
      if (plat) {
        const t = hookAimPoint(plat);
        fireHookAt(t.x, t.y, true);
      } else if (wantJump) {
        fireHookAt(p.x + dir * 50, p.y - 110, true);
      } else {
        autoSteer(p.x - dir * 24);
      }
      if (wantFire) autoIn.fire = true;
      return;
    }

    if (wantJump && arm.state === 'idle') {
      const plat = pickHookPlat(dir, true);
      if (plat) {
        const t = hookAimPoint(plat);
        fireHookAt(t.x, t.y, true);
        if (wantFire) autoIn.fire = true;
        return;
      }
      fireHookAt(p.x + dir * 48, p.y - 100, true);
    }

    if (goal.y < p.y - 28 && arm.state === 'idle') {
      const up = pickHookPlat(dir, true);
      if (up && up.y < p.y - 10) {
        const t = hookAimPoint(up);
        if (Math.abs(t.x - p.x) < 70) {
          fireHookAt(t.x, t.y, true);
          if (wantFire) autoIn.fire = true;
          return;
        }
        autoSteer(t.x);
        if (wantFire) autoIn.fire = true;
        return;
      }
    }

    if (shot && G.invuln <= 0) {
      autoSteer(p.x + (shot.x >= p.x ? -54 : 54));
    } else if (autoBackT > 0) {
      autoSteer(p.x - dir * 70);
    } else {
      autoSteer(goal.x);
    }

    if (wantFire) {
      autoIn.fire = true;
      if (close && close.y < p.y - 20 && Math.abs(close.x - p.x) < 140) {
        autoIn.u = true;
        autoIn.l = false;
        autoIn.r = false;
        if (close.x > p.x + 8) p.face = 1;
        else if (close.x < p.x - 8) p.face = -1;
      }
    }

    if (autoStuck > 1.15 && arm.state === 'idle') {
      const plat = pickHookPlat(dir, true) || pickHookPlat(-dir, true);
      if (plat) {
        const t = hookAimPoint(plat);
        fireHookAt(t.x, t.y, p.grounded);
      }
    }
    if (autoStuck > 1.9) {
      autoBackT = 0.4;
      autoStuck = 0;
      autoWalkDir *= -1;
    }
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame(G.kind || 'hook');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'hook');
      }
    }
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (speedEl) speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    if (speedEl) {
      speedEl.title = SPEED_LABELS[autoSpeed];
      speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
    }
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
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
    autoStuck = 0;
    autoBackT = 0;
    autoHookCd = 0;
    clearAutoKeys();
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    keys.fire = false;
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      if (G.mode === 'title') startGame(G.kind || 'hook');
    }
    syncHud();
  }

  function demoThink() {
    const p = G.player;
    demo.r = true;
    demo.l = false;
    demo.u = false;
    demo.d = false;
    demo.fire = false;
    if (G.demoHookCd > 0) G.demoHookCd -= STEP;
    if (G.arm && G.arm.state === 'latch') {
      demo.u = true;
      demo.r = true;
    } else if (p.grounded && pitAhead(p.x, p.y, 1) && G.arm.state === 'idle' && G.demoHookCd <= 0) {
      demo.r = false;
      demo.u = true;
      tryHook();
      G.demoHookCd = 0.55;
    } else if (!p.grounded && G.arm.state === 'idle' && G.demoHookCd <= 0 && p.vy > 50) {
      demo.u = true;
      tryHook();
      G.demoHookCd = 0.75;
    }
    if (((G.clock * 2.2) | 0) % 3 === 0) demo.fire = true;
    if (p.x > 720 || p.y > VH + 20) {
      G.player = makePlayer(70, GY);
      G.arm = makeArm();
      G.camX = 0;
      G.shots = [];
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    p.squash = lerp(p.squash, 1, 1 - Math.pow(0.0002, dt));
    if (G.deadT > 0) {
      G.deadT -= dt;
      p.vy += GRAV * dt;
      p.y += p.vy * dt * 0.5;
      p.squash = 1.16;
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }
    if (G.lock > 0) return;

    if (G.knockT > 0) G.knockT -= dt;

    updateArm(dt);

    const hanging = G.arm && G.arm.state === 'latch';
    const tossing = G.arm && (G.arm.state === 'out' || G.arm.state === 'back');
    if (!hanging) {
      if (p.grounded && G.knockT <= 0 && !tossing) {
        let ax = 0;
        if (inL() && !inR()) { ax = -1; p.face = -1; }
        else if (inR() && !inL()) { ax = 1; p.face = 1; }
        p.vx = ax * WALK * walkMul(isNet());
        p.run = ax ? p.run + dt : 0;
      } else if (tossing && p.grounded && G.knockT <= 0) {
        p.vx = 0;
        p.run = 0;
      } else if (G.knockT <= 0) {
        let ax = 0;
        if (inL() && !inR()) { ax = -1; p.face = -1; }
        else if (inR() && !inL()) { ax = 1; p.face = 1; }
        p.vx += ax * AIR_STEER * dt;
        const cap = WALK * 1.15 * walkMul(isNet());
        p.vx = clamp(p.vx, -cap, cap);
        p.run = 0;
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
            p.squash = 0.78;
            if (playing()) audio.land();
            landDust(p.x, p.y, 0.7);
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
    } else {
      p.x = clamp(p.x, 16, G.levelW - 16);
    }

    if (p.y > VH + 36) die('fall');
    tryShoot(dt);
  }

  function enemyShoot(x, y, dx, dy, spd, kind) {
    const l = hypot(dx, dy) || 1;
    spawnShot({
      x: x, y: y,
      vx: dx / l * spd,
      vy: dy / l * spd,
      from: 'e',
      kind: kind || 'bolt',
      life: kind === 'bomb' ? 2.4 : 2.1,
      rgb: kind === 'grid' ? MAG : kind === 'bomb' ? GOLD : HOT2,
      grav: kind === 'bomb' ? 360 : 0
    });
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    if (e.hitN > 0) e.hitN -= dt;
    e.t += dt;
    const mul = spdMul(isNet(), G.stage);
    const p = G.player;
    if (e.kind === 'drone') {
      e.x += Math.sin(e.t * 1.4) * 28 * dt * mul;
      e.y = e.base + Math.sin(e.t * 2.2) * 10;
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && Math.abs(e.x - p.x) < 280) {
        enemyShoot(e.x, e.y + 4, p.x - e.x, p.y - 12 - e.y, 150 * mul, 'bolt');
        e.fire = (isNet() ? 1.05 : 1.45) + rand(0, 0.4);
      }
      return;
    }
    if (e.kind === 'nest') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && Math.abs(e.x - p.x) < 320) {
        enemyShoot(e.x, e.y + 2, 0, 1, 170 * mul, 'bolt');
        e.fire = (isNet() ? 0.95 : 1.35) + rand(0, 0.3);
      }
      return;
    }
    if (e.kind === 'turret') {
      e.face = p.x < e.x ? -1 : 1;
      e.fire -= dt;
      if (e.fire <= 0 && Math.abs(e.x - p.x) < 360) {
        enemyShoot(e.x + e.face * 10, e.y - 12, e.face, (p.y - e.y) * 0.002, 190 * mul, 'bolt');
        e.fire = (isNet() ? 0.85 : 1.2) + rand(0, 0.25);
      }
      return;
    }
    const left = e.a;
    const right = e.b;
    if (!e.vx) e.vx = (e.kind === 'hookman' ? 46 : 32) * (e.face || -1);
    e.x += e.vx * mul * dt;
    if (e.x < left + 8) { e.x = left + 8; e.vx = Math.abs(e.vx); e.face = 1; }
    if (e.x > right - 8) { e.x = right - 8; e.vx = -Math.abs(e.vx); e.face = -1; }
    e.face = e.vx >= 0 ? 1 : -1;
    if (e.kind === 'hookman' && playing() && Math.abs(e.x - p.x) < 90 && Math.abs(e.y - p.y) < 28) {
      e.x += e.face * 40 * dt * mul;
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || b.dead) return;
    if (b.hitN > 0) b.hitN -= dt;
    b.t += dt;
    const p = G.player;
    if (!b.active) {
      if (p.x > G.levelW - VW + 40) {
        b.active = true;
        audio.boss();
        toast(b.name, false, true);
        kick(4, 'boom');
      }
      return;
    }
    const mul = spdMul(isNet(), G.stage);
    b.face = p.x < b.x ? -1 : 1;
    if (b.kind === '旋炮') {
      b.x += Math.sin(b.t * 0.7) * 40 * dt;
      b.x = clamp(b.x, G.levelW - VW + 80, G.levelW - 50);
    }
    b.fire -= dt;
    if (b.fire > 0) return;
    const low = b.hp / b.max < 0.4;
    if (b.kind === '双管') {
      enemyShoot(b.x - 10, b.y - 28, -1, 0, 200 * mul, 'bolt');
      enemyShoot(b.x - 10, b.y - 14, -1, 0.12, 190 * mul, 'bolt');
      b.fire = (isNet() ? 0.72 : 1.05) + (low ? -0.18 : 0);
    } else if (b.kind === '旋炮') {
      let k;
      for (k = 0; k < 5; k++) {
        const a = -Math.PI * 0.15 - k * 0.22 + Math.sin(b.t) * 0.1;
        enemyShoot(b.x - 12, b.y - 24, Math.cos(a + Math.PI), Math.sin(a), 170 * mul, 'bolt');
      }
      b.fire = (isNet() ? 0.9 : 1.25) + (low ? -0.2 : 0);
    } else {
      if (Math.random() < 0.55) {
        enemyShoot(b.x - 16, b.y - 30, -1, 0, 220 * mul, 'grid');
        enemyShoot(b.x - 16, b.y - 18, -1, 0.08, 200 * mul, 'grid');
        enemyShoot(b.x - 16, GY - 18, -1, 0, 210 * mul, 'grid');
      } else {
        enemyShoot(b.x - 8, b.y - 40, -0.4, -0.2, 90 * mul, 'bomb');
        enemyShoot(b.x - 20, b.y - 36, -0.7, -0.15, 100 * mul, 'bomb');
      }
      b.fire = (isNet() ? 0.7 : 1.0) + (low ? -0.22 : 0);
    }
  }

  function updateShots(dt) {
    let i, s, k, e, pb;
    for (i = 0; i < G.shots.length; i++) {
      s = G.shots[i];
      if (s.dead) continue;
      s.life -= dt;
      if (s.grav) s.vy += s.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.y > VH + 40 || s.x < G.camX - 50 || s.x > G.camX + VW + 50) {
        s.dead = true;
        continue;
      }
      if (s.from === 'e' && playing() && G.deadT <= 0 && G.invuln <= 0) {
        pb = pBox();
        if (overlap(s.x - 5, s.y - 5, 10, 10, pb.x, pb.y, pb.w, pb.h)) {
          s.dead = true;
          hurt(s.x, 1, s.kind === 'grid' || s.kind === 'bomb' ? 'boss' : 'hit');
        }
      }
      if (s.from === 'p') {
        for (k = 0; k < G.ents.length; k++) {
          e = G.ents[k];
          if (e.dead) continue;
          if (overlap(s.x - 4, s.y - 4, 8, 8, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
            s.dead = true;
            hitEnemy(e, 1);
            break;
          }
        }
        if (!s.dead && G.boss && !G.boss.dead && G.boss.active) {
          const b = G.boss;
          if (overlap(s.x - 4, s.y - 4, 8, 8, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
            s.dead = true;
            hitBoss(1);
          }
        }
      }
    }
  }

  function updatePickups(dt) {
    let i, u;
    const pb = pBox();
    for (i = 0; i < G.pickups.length; i++) {
      u = G.pickups[i];
      if (u.taken) continue;
      u.t += dt;
      if (!u.rest) {
        u.life -= dt;
        u.vy += 520 * dt;
        u.y += u.vy * dt;
        const hit = landOn(u.x, u.y - 8, u.y, null);
        if (hit) { u.y = hit.y - 10; u.vy = 0; }
        if (u.life <= 0) u.taken = true;
      }
      if (playing() && overlap(u.x - 8, u.y - 10, 16, 16, pb.x, pb.y, pb.w, pb.h)) takePickup(u);
    }
  }

  function playerContact() {
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    const pb = pBox();
    let i, e;
    for (i = 0; i < G.ents.length; i++) {
      e = G.ents[i];
      if (e.dead) continue;
      if (overlap(pb.x, pb.y, pb.w, pb.h, e.x - e.w * 0.5, e.y - e.h, e.w, e.h)) {
        hurt(e.x, 1, 'hit');
        return;
      }
    }
    const b = G.boss;
    if (b && b.active && !b.dead) {
      if (overlap(pb.x, pb.y, pb.w, pb.h, b.x - b.w * 0.5, b.y - b.h, b.w, b.h)) {
        hurt(b.x, 2, 'boss');
      }
    }
  }

  function updateCam(dt) {
    const p = G.player;
    let target = p.x - VW * 0.34;
    if (G.boss && G.boss.active && !G.boss.dead) target = G.levelW - VW;
    target = clamp(target, 0, Math.max(0, G.levelW - VW));
    G.camX = lerp(G.camX, target, 1 - Math.pow(0.0008, dt));
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.002, dt));
  }

  function updateFx(dt) {
    let i, q;
    for (i = particles.length - 1; i >= 0; i--) {
      q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.32) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      q = floats[i];
      q.t += dt;
      q.y -= q.vy * dt;
      if (q.t > q.life) floats.splice(i, 1);
    }
    for (i = 0; i < mist.length; i++) {
      mist[i].x += mist[i].vx * dt;
      if (mist[i].x > G.camX + VW + 40) mist[i].x = G.camX - 40;
    }
    if (G.invuln > 0 && playing()) G.invuln -= dt;
    if (G.lock > 0) G.lock -= dt;
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
    G.clock += dt;
    G.t += dt;
    if (autoOn) tickAutoFlow(dt);
    if (G.stop > 0) {
      if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
      else {
        G.stop -= dt;
        return;
      }
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      updateCam(dt);
      updateFx(dt);
      if (G.clearT <= 0) nextStage();
      return;
    }
    if (!live()) {
      updateFx(dt);
      return;
    }
    if (G.mode === 'title') demoThink();
    if (autoOn && G.mode === 'play' && G.deadT <= 0) autoThink();
    updatePlayer(dt);
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    updateBoss(dt);
    updateShots(dt);
    updatePickups(dt);
    playerContact();
    updateCam(dt);
    updateFx(dt);
  }

  function drawSky() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const g = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    if (spec.theme === 'nest') {
      g.addColorStop(0, '#081810');
      g.addColorStop(0.55, '#06140c');
      g.addColorStop(1, '#040c08');
    } else if (spec.theme === 'steel') {
      g.addColorStop(0, '#0a1814');
      g.addColorStop(0.5, '#081410');
      g.addColorStop(1, '#04100a');
    } else {
      g.addColorStop(0, '#0c1c12');
      g.addColorStop(0.5, '#08160e');
      g.addColorStop(1, '#041208');
    }
    ctx.fillStyle = g;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    const mx = sx(G.camX + VW * 0.78);
    const my = sy(G.camY + 44);
    ctx.fillStyle = rgba(spec.theme === 'steel' ? CYN : HOT, isNet() ? 0.28 : 0.5);
    ctx.beginPath();
    ctx.arc(mx, my, 22 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(spec.theme === 'steel' ? WHT : GOLD, 0.16);
    ctx.beginPath();
    ctx.arc(mx, my, 34 * scale, 0, TAU);
    ctx.fill();

    let i;
    for (i = 0; i < 18; i++) {
      const hx = hash2(i + 11 + G.stage);
      const hy = hash2(i + 29);
      ctx.fillStyle = rgba(WHT, 0.14 + hx * 0.3);
      ctx.fillRect(
        sx(G.camX + (hx * VW + G.clock * 4) % VW),
        sy(G.camY + 10 + hy * 80),
        1.4 * scale, 1.4 * scale
      );
    }
  }

  function drawBackdrop() {
    const spec = STAGES[G.stage - 1] || STAGES[0];
    const par = G.camX * 0.28;
    const base = sy(GY + 6);
    let i, x, h, w;
    for (i = -2; i < 28; i++) {
      x = sx((Math.floor((G.camX + par) / 78) + i) * 78 - par);
      h = (50 + hash2(i + 17 + G.stage * 9) * 120) * scale;
      w = (22 + hash2(i + 5) * 18) * scale;
      ctx.fillStyle = i % 2 ? '#0c2014' : '#08180e';
      ctx.fillRect(x, base - h, w, h + 40 * scale);
      ctx.fillStyle = rgba(HOT, 0.28);
      ctx.fillRect(x, base - h, w, 3 * scale);
      if (spec.theme === 'port') {
        ctx.fillStyle = rgba(CYN, 0.2 + Math.sin(G.clock * 3 + i) * 0.08);
        ctx.fillRect(x + 4 * scale, base - h + 10 * scale, 5 * scale, 8 * scale);
        ctx.fillRect(x + w * 0.55, base - h + 22 * scale, 5 * scale, 8 * scale);
      } else if (spec.theme === 'steel') {
        ctx.strokeStyle = rgba(STL, 0.4);
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(x + 2 * scale, base - h + 8 * scale, w - 4 * scale, 18 * scale);
        ctx.fillStyle = rgba(GOLD, 0.14);
        ctx.fillRect(x + 4 * scale, base - h + 12 * scale, 5 * scale, 6 * scale);
      } else {
        ctx.fillStyle = rgba(MAG, 0.16);
        ctx.fillRect(x + 4 * scale, base - h + 12 * scale, 5 * scale, 10 * scale);
        ctx.strokeStyle = rgba(HOT, 0.22);
        ctx.lineWidth = 1 * scale;
        ctx.strokeRect(x + 2 * scale, base - h + 8 * scale, w - 4 * scale, 14 * scale);
      }
    }
    for (i = 0; i < mist.length; i++) {
      const m = mist[i];
      ctx.fillStyle = rgba(HOT2, m.a);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawAbyss() {
    const bases = G.plats.filter(function (p) { return p.base; });
    const y = sy(GY + 8);
    ctx.fillStyle = rgba(MAG, 0.07);
    ctx.fillRect(sx(G.camX - 10), y, (VW + 20) * scale, 50 * scale);
    let x, covered, i;
    for (x = G.camX; x < G.camX + VW; x += 16) {
      covered = false;
      for (i = 0; i < bases.length; i++) {
        if (x >= bases[i].x && x <= bases[i].x + bases[i].w) covered = true;
      }
      if (covered) continue;
      ctx.fillStyle = rgba(HOT, 0.16 + Math.sin(x * 0.1 + G.clock * 4) * 0.05);
      ctx.fillRect(sx(x), sy(GY + 2), 14 * scale, 10 * scale);
    }
  }

  function drawPlats() {
    let i, p, x, y, w, h, k, n;
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      x = sx(p.x);
      y = sy(p.y);
      w = p.w * scale;
      h = p.h * scale;
      ctx.fillStyle = p.base ? '#102418' : '#163020';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = rgba(HOT, p.base ? 0.88 : 0.7);
      ctx.fillRect(x, y, w, 2.4 * scale);
      ctx.fillStyle = rgba(CYN, 0.22);
      ctx.fillRect(x + 2 * scale, y + 2.4 * scale, w - 4 * scale, 1.2 * scale);
      if (!p.base) {
        ctx.strokeStyle = rgba(CYN, 0.35 + Math.sin(G.clock * 6 + p.x) * 0.1);
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + h, 3.2 * scale, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = rgba(GOLD, 0.55);
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + h, 1.4 * scale, 0, TAU);
        ctx.fill();
      } else {
        n = Math.max(2, (p.w / 28) | 0);
        for (k = 0; k <= n; k++) {
          ctx.fillStyle = k % 2 ? rgba(HOT, 0.22) : rgba(CYN, 0.1);
          ctx.fillRect(x + (k / n) * w, y, 2 * scale, 6 * scale);
        }
      }
    }
  }

  function drawPickup(u) {
    if (u.taken) return;
    const x = sx(u.x);
    const y = sy(u.y + Math.sin(u.t * 6) * 3);
    const s = scale;
    if (u.kind === 'heart') {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(x - 3 * s, y, 3.2 * s, 0, TAU);
      ctx.arc(x + 3 * s, y, 3.2 * s, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 6 * s, y);
      ctx.lineTo(x, y + 7 * s);
      ctx.lineTo(x + 6 * s, y);
      ctx.fill();
    } else if (u.kind === 'rapid') {
      ctx.fillStyle = rgba(CYN, 0.95);
      ctx.fillRect(x - 5 * s, y - 3 * s, 10 * s, 6 * s);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(x + 3 * s, y - 2 * s, 6 * s, 4 * s);
    } else {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(x, y, 4 * s, 0, TAU);
      ctx.fill();
    }
  }

  function drawShot(s) {
    if (s.dead) return;
    const x = sx(s.x);
    const y = sy(s.y);
    const sc = scale;
    ctx.fillStyle = rgba(s.rgb || GOLD, 0.95);
    if (s.from === 'p') {
      ctx.fillRect(x - 4 * sc, y - 1.4 * sc, 8 * sc, 2.8 * sc);
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(x - 1.5 * sc, y - 0.8 * sc, 4 * sc, 1.6 * sc);
    } else if (s.kind === 'bomb') {
      ctx.beginPath();
      ctx.arc(x, y, 4.2 * sc, 0, TAU);
      ctx.fill();
    } else {
      ctx.fillRect(x - 5 * sc, y - 1.6 * sc, 10 * sc, 3.2 * sc);
    }
  }

  function drawArm() {
    const arm = G.arm;
    const p = G.player;
    if (!arm || arm.state === 'idle' || G.deadT > 0) return;
    const o = armOrigin();
    const s = scale;
    const x0 = sx(o.x);
    const y0 = sy(o.y);
    const x1 = sx(arm.ax);
    const y1 = sy(arm.ay);
    ctx.save();
    ctx.strokeStyle = rgba(CYN, arm.state === 'latch' ? 0.95 : 0.7);
    ctx.lineWidth = (arm.state === 'latch' ? 2.4 : 1.7) * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    if (arm.state === 'latch') {
      const mx = (x0 + x1) * 0.5 + Math.sin(G.clock * 18) * 1.2 * s;
      const my = (y0 + y1) * 0.5;
      ctx.quadraticCurveTo(mx, my, x1, y1);
    } else {
      ctx.lineTo(x1, y1);
    }
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 0.8 * s;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.fillStyle = rgba(arm.state === 'latch' ? GOLD : HOT, 0.95);
    ctx.beginPath();
    ctx.arc(x1, y1, (arm.state === 'latch' ? 4.2 : 3.2) * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(WHT, 0.8);
    ctx.lineWidth = 1.1 * s;
    ctx.beginPath();
    ctx.moveTo(x1 - 4 * s, y1);
    ctx.lineTo(x1 + 4 * s, y1);
    ctx.moveTo(x1, y1 - 4 * s);
    ctx.lineTo(x1, y1 + 4 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawHero(p) {
    const x = sx(p.x);
    const y = sy(p.y);
    const s = scale;
    const sq = p.squash;
    const run = p.grounded ? Math.sin(p.run * 14) * 2.2 : 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p.face, 1);
    ctx.scale(1, sq);
    const hanging = G.arm && G.arm.state === 'latch';
    if (hanging) ctx.rotate(-G.arm.ang * 0.28 * p.face);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(-5.2 * s, -(PH) * s, 10.4 * s, 14 * s);
    ctx.fillStyle = rgba(SKIN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, -(PH - 3) * s, 4.4 * s, 4.6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(-5.2 * s, -(PH - 1) * s, 10.4 * s, 3 * s);
    ctx.fillStyle = '#102418';
    ctx.fillRect(1.2 * s, -(PH - 5) * s, 2.6 * s, 1.5 * s);
    ctx.strokeStyle = rgba(CYN, 0.9);
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(4 * s, -(PH - 8) * s);
    ctx.lineTo(11 * s, -(PH - (hanging ? 4 : 10)) * s);
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(9 * s, -(PH - (hanging ? 2 : 8)) * s, 5 * s, 3.2 * s);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(-4.6 * s, -8 * s + run * s, 3.2 * s, 8 * s);
    ctx.fillRect(0.8 * s, -8 * s - run * s, 3.2 * s, 8 * s);
    ctx.restore();
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (e.hitN > 0 && ((G.t * 30) | 0) % 2 === 0) return;
    const x = sx(e.x);
    const y = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(e.face, 1);
    if (e.kind === 'drone') {
      const flap = Math.sin(e.t * 14) * 4;
      ctx.fillStyle = rgba(STL, 0.95);
      ctx.fillRect(-7 * s, -10 * s, 14 * s, 8 * s);
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.fillRect(-3 * s, -8 * s, 6 * s, 3 * s);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-10 * s, (-9 - flap * 0.2) * s, 5 * s, 2 * s);
      ctx.fillRect(5 * s, (-9 + flap * 0.2) * s, 5 * s, 2 * s);
    } else if (e.kind === 'turret') {
      ctx.fillStyle = rgba(IRON, 0.95);
      ctx.fillRect(-8 * s, -12 * s, 16 * s, 12 * s);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-8 * s, -12 * s, 16 * s, 3 * s);
      ctx.fillStyle = rgba(STL, 0.95);
      ctx.fillRect(4 * s, -18 * s, 10 * s, 5 * s);
      ctx.fillStyle = rgba(CYN, 0.85);
      ctx.fillRect(12 * s, -17 * s, 4 * s, 3 * s);
    } else if (e.kind === 'nest') {
      ctx.fillStyle = rgba(IRON, 0.95);
      ctx.beginPath();
      ctx.arc(0, -6 * s, 8 * s, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.fillRect(-3 * s, -2 * s, 6 * s, 6 * s);
      ctx.fillStyle = rgba(GOLD, 0.5);
      ctx.fillRect(-2 * s, -9 * s, 4 * s, 3 * s);
    } else if (e.kind === 'hookman') {
      ctx.fillStyle = rgba(STL, 0.95);
      ctx.fillRect(-6 * s, -18 * s, 12 * s, 14 * s);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-6 * s, -18 * s, 12 * s, 3 * s);
      ctx.fillStyle = rgba(IRON, 0.95);
      ctx.beginPath();
      ctx.arc(0, -22 * s, 4.6 * s, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.85);
      ctx.lineWidth = 1.6 * s;
      ctx.beginPath();
      ctx.moveTo(5 * s, -14 * s);
      ctx.lineTo(12 * s, -8 * s);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.arc(12 * s, -8 * s, 2.2 * s, 0, TAU);
      ctx.fill();
    } else {
      const wob = Math.sin(e.t * 8) * 1.4 * s;
      ctx.fillStyle = rgba(IRON, 0.95);
      ctx.fillRect(-8 * s + wob, -8 * s, 16 * s, 8 * s);
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-8 * s + wob, -8 * s, 16 * s, 2 * s);
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(4 * s + wob, -6 * s, 5 * s, 2.4 * s);
    }
    ctx.restore();
    if (e.max > 1 && e.hp < e.max && e.hp > 0) {
      const bw = 16 * scale;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x - bw * 0.5, sy(e.y - e.h - 6), bw, 2.4 * scale);
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.fillRect(x - bw * 0.5, sy(e.y - e.h - 6), bw * (e.hp / e.max), 2.4 * scale);
    }
  }

  function drawBoss() {
    const b = G.boss;
    if (!b || b.dead) return;
    const a = b.active ? 1 : 0.38;
    const x = sx(b.x);
    const y = sy(b.y);
    const s = scale;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(x, y);
    ctx.scale(b.face, 1);
    if (b.hitN > 0 && ((G.t * 28) | 0) % 2 === 0) ctx.globalAlpha = a * 0.4;
    ctx.fillStyle = rgba(IRON, 0.95);
    ctx.fillRect(-18 * s, -48 * s, 36 * s, 48 * s);
    ctx.fillStyle = rgba(HOT, 0.55);
    ctx.fillRect(-18 * s, -48 * s, 36 * s, 6 * s);
    ctx.fillStyle = rgba(STL, 0.95);
    ctx.fillRect(6 * s, -62 * s, 16 * s, 18 * s);
    ctx.fillStyle = rgba(BEAM, 0.85);
    ctx.fillRect(18 * s, -58 * s, 12 * s, 6 * s);
    ctx.fillRect(18 * s, -44 * s, 10 * s, 5 * s);
    ctx.fillStyle = rgba(MAG, 0.8);
    ctx.beginPath();
    ctx.arc(0, -28 * s, 8 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.75);
    ctx.beginPath();
    ctx.arc(0, -28 * s, 3.4 * s, 0, TAU);
    ctx.fill();
    if (b.kind === '联装') {
      ctx.fillStyle = rgba(GOLD, 0.5);
      ctx.fillRect(-14 * s, -20 * s, 10 * s, 8 * s);
      ctx.fillRect(4 * s, -20 * s, 10 * s, 8 * s);
    }
    ctx.restore();
  }

  function drawBossBar() {
    const b = G.boss;
    if (!b || !b.active || b.dead) return;
    const x = ox + 80 * scale;
    const y = oy + 14 * scale;
    const w = (VW - 160) * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(x, y, w * clamp(b.hp / b.max, 0, 1), 8 * scale);
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(x, y, w, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.85);
    ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(b.name, ox + (VW * 0.5) * scale, y - 2 * scale);
  }

  function drawFx() {
    let i, q, a;
    for (i = 0; i < rings.length; i++) {
      q = rings[i];
      a = 1 - q.t / 0.32;
      ctx.strokeStyle = rgba(q.rgb, a * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), (q.r + q.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      q = sparks[i];
      a = 1 - q.t / 0.28;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), (q.rad * a) * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, a * 0.8);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), (q.rad * 0.35 * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < particles.length; i++) {
      q = particles[i];
      a = q.life / q.max;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.fillRect(sx(q.x) - q.r * scale, sy(q.y) - q.r * scale, q.r * 2 * scale, q.r * 2 * scale);
    }
    for (i = 0; i < floats.length; i++) {
      q = floats[i];
      a = 1 - q.t / q.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(q.rgb, 1);
      ctx.font = 'bold ' + (q.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(q.text, sx(q.x), sy(q.y));
      ctx.globalAlpha = 1;
    }
  }

  function drawAim() {
    if (!playing() || G.deadT > 0 || !G.player) return;
    if (G.arm && G.arm.state !== 'idle') return;
    const o = armOrigin();
    const d = aimVec();
    const s = scale;
    ctx.strokeStyle = rgba(HOT2, 0.28);
    ctx.lineWidth = 1 * s;
    ctx.setLineDash([4 * s, 4 * s]);
    ctx.beginPath();
    ctx.moveTo(sx(o.x), sy(o.y));
    ctx.lineTo(sx(o.x + d.x * 42), sy(o.y + d.y * 42));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#041208';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    const shakeX = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    const shakeY = G.shake ? (Math.random() - 0.5) * G.shake * 0.6 : 0;
    ctx.translate(shakeX, shakeY);
    if (G.punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    drawSky();
    drawBackdrop();
    drawAbyss();
    drawPlats();

    let i;
    for (i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawBoss();
    for (i = 0; i < G.shots.length; i++) drawShot(G.shots[i]);

    const p = G.player;
    if (p && G.deadT <= 0) {
      const blink = playing() && G.invuln > 0;
      if (!(blink && ((G.t * 18) | 0) % 2 === 0)) {
        drawHero(p);
        drawArm();
      }
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

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      e.preventDefault();
      if (down && !e.repeat) toggleAuto();
      return;
    }
    if (e.target === speedEl) return;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const hook = k === 'z' || k === 'Z' || k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';

    if (!autoOn) {
      if (k === 'ArrowLeft' || k === 'Left') keys.l = down;
      if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'Right') keys.r = down;
      if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'Up') keys.u = down;
      if (k === 'ArrowDown' || k === 's' || k === 'S' || k === 'Down') keys.d = down;
      if (space) keys.fire = down;
    } else if (down && (isMove || space || hook)) {
      e.preventDefault();
    }

    if (down && (isMove || space || hook || k === 'Enter')) e.preventDefault();
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
      startGame('hook');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('net');
      return;
    }
    if (hook) {
      if (!overlayOpen() && !autoOn) tryHook();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen() && !autoOn) {
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
        if (autoOn) return;
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
    hold(document.getElementById('btn-up'), function () { keys.u = true; }, function () { keys.u = false; });
    hold(document.getElementById('btn-fire'), function () { keys.fire = true; }, function () { keys.fire = false; });
    const hookBtn = document.getElementById('btn-hook');
    if (hookBtn) {
      hookBtn.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (autoOn) return;
        audio.ensure();
        hookBtn.classList.add('held');
        if (!overlayOpen()) tryHook();
      });
      const up = function (e) {
        e.preventDefault();
        hookBtn.classList.remove('held');
      };
      hookBtn.addEventListener('pointerup', up);
      hookBtn.addEventListener('pointercancel', up);
      hookBtn.addEventListener('pointerleave', up);
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen() || autoOn) return;
      keys.fire = true;
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
    acc += dt * autoScale();
    let n = 0;
    const maxSteps = autoOn && autoSpeed >= 4 && G.mode === 'play' ? 16 : 5;
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

  loadBest();
  initMute();
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();
  bindPad();

  if (btnHookStart) {
    btnHookStart.addEventListener('click', function () {
      audio.ensure();
      startGame('hook');
    });
  }
  if (btnNetStart) {
    btnNetStart.addEventListener('click', function () {
      audio.ensure();
      startGame('net');
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
      if (G.mode === 'win') startGame('net');
      else goTitle();
    });
  }
  if (modeHook) {
    modeHook.addEventListener('click', function () {
      audio.ensure();
      startGame('hook');
    });
  }
  if (modeNet) {
    modeNet.addEventListener('click', function () {
      audio.ensure();
      startGame('net');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnAuto) {
    btnAuto.addEventListener('click', function () {
      audio.ensure();
      toggleAuto();
    });
  }
  if (speedEl) {
    speedEl.addEventListener('input', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
    speedEl.addEventListener('change', function () { setAutoSpeed(parseInt(speedEl.value, 10)); });
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
