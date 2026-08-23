'use strict';

(function () {
  const VW = 800;
  const VH = 460;
  const WORLD = 2560;
  const HALF = WORLD * 0.5;
  const RADAR_H = 30;
  const PLAY_TOP = 38;
  const GROUND = 428;
  const GATE_X = 640;
  const GATE_Y = 128;
  const GATE_RX = 24;
  const GATE_RY = 50;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 10000;
  const HUMANS0 = 10;
  const WAVES = 5;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SHIP_R = 10;
  const THRUST = 660;
  const MAX_VX = 400;
  const MAX_VX_C = 452;
  const VY = 256;
  const SHOT_V = 760;
  const SHOT_LIFE = 0.56;
  const SHOT_MAX = 5;
  const FIRE_CD = 0.098;
  const FIRE_CD_C = 0.082;
  const COMBO_WIN = 1.38;
  const BEST_KEY = 'playbox-stargate-best';
  const MUTE_KEY = 'playbox-stargate-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格开火 · Shift / Z 翻头 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 216, 255];
  const ICE = [92, 200, 255];
  const GOLD = [255, 227, 107];
  const WHT = [230, 246, 255];
  const ORG = [255, 138, 74];
  const PNK = [255, 154, 212];
  const VIO = [167, 139, 255];
  const TEAL = [62, 236, 200];
  const RED = [255, 74, 96];
  const MINT = [90, 230, 180];

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
  const btnGate = document.getElementById('btn-gate');
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const phaseLabel = document.getElementById('phase-label');
  const humanLabel = document.getElementById('human-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');
  const stickEl = document.getElementById('stick');
  const knobEl = document.getElementById('knob');
  const padFire = document.getElementById('pad-fire');
  const padRev = document.getElementById('pad-rev');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let kickTok = 0;

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const analog = { x: 0, y: 0, on: false };
  const pointer = { down: false, id: null, wx: 0, wy: 0 };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const ghosts = [];
  const nebula = [];

  const G = {
    mode: 'title',
    kind: 'gate',
    t: 0,
    clock: 0,
    ship: { x: WORLD * 0.5, y: 220, vx: 0, vy: 0, facing: 1 },
    camX: WORLD * 0.5,
    slot: VW * 0.28,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    wave: 1,
    phase: 'raid',
    waveWait: 0,
    barren: false,
    humans: [],
    enemies: [],
    shots: [],
    bullets: [],
    fireballs: [],
    flames: [],
    fireCd: 0,
    baitT: 16,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: VIO,
    punch: 1,
    muzzle: 0,
    revFlash: 0,
    revLock: 0,
    toastT: 0,
    why: '',
    nextLife: LIFE_EVERY,
    abductBeep: 0,
    carry: null,
    thrustOn: false,
    endT: 0,
    warpCd: 0,
    warpFlash: 0,
    gateSpin: 0
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
  function isCore() {
    return G.kind === 'core';
  }
  function wrapX(x) {
    x = x % WORLD;
    if (x < 0) x += WORLD;
    return x;
  }
  function wrapDx(from, to) {
    let d = wrapX(to) - wrapX(from);
    if (d > HALF) d -= WORLD;
    if (d < -HALF) d += WORLD;
    return d;
  }
  function wrapLerp(a, b, t) {
    return wrapX(a + wrapDx(a, b) * t);
  }
  function viewX(wx) {
    return VW * 0.5 + wrapDx(G.camX, wx);
  }
  function terrainY(x) {
    const t = wrapX(x) / WORLD * TAU;
    let n = Math.abs(Math.sin(t * 3.2)) * 16
      + Math.abs(Math.sin(t * 7.4 + 1.15)) * 12
      + Math.abs(Math.sin(t * 17.0 + 0.5)) * 5
      + (Math.abs(Math.sin(t * 1.7 + 0.2)) > 0.88 ? 14 : 0);
    const d = Math.abs(wrapDx(x, GATE_X));
    if (d < 90) n *= 0.35 + d / 90 * 0.65;
    return GROUND - n;
  }
  function overlapR(ax, ay, ar, bx, by, br) {
    const dx = Math.abs(wrapDx(ax, bx));
    const dy = Math.abs(ay - by);
    return dx < ar + br && dy < ar + br;
  }
  function onScreen(x) {
    const vx = viewX(x);
    return vx > -40 && vx < VW + 40;
  }
  function maxVx() {
    return isCore() ? MAX_VX_C : MAX_VX;
  }
  function fireGap() {
    return isCore() ? FIRE_CD_C : FIRE_CD;
  }
  function shotCap() {
    return isCore() ? 6 : SHOT_MAX;
  }
  function inGate(x, y) {
    const dx = wrapDx(GATE_X, x) / GATE_RX;
    const dy = (y - GATE_Y) / GATE_RY;
    return dx * dx + dy * dy < 1;
  }

  const KIND_NAME = {
    grab: '抓手',
    mutant: '变体',
    fire: '焰轰',
    dynamo: '磁核',
    hum: '嗡粒',
    guppy: '门鱼',
    phred: '红饵'
  };

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
      this.beep(1620, 0.044, 'square', 0.028, 280);
      this.beep(780, 0.028, 'triangle', 0.012, 160);
    },
    hit(kind) {
      this.ensure();
      const base = kind === 'phred' ? 980 : kind === 'guppy' ? 1180 : kind === 'hum' ? 1280 : kind === 'mutant' ? 740 : 520;
      this.noise(0.044, 0.02, 1400);
      this.beep(base, 0.068, 'square', 0.038, base * 1.55);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.18 : 0.1, big ? 0.068 : 0.038, big ? 170 : 320);
      this.beep(big ? 190 : 300, big ? 0.2 : 0.1, 'sawtooth', big ? 0.048 : 0.03, 46);
    },
    rescue() {
      this.ensure();
      this.beep(784, 0.07, 'sine', 0.04, 784);
      this.beep(1046, 0.11, 'triangle', 0.034);
      this.beep(1568, 0.16, 'sine', 0.032, 2093);
    },
    drop() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.034, 784);
      this.beep(784, 0.12, 'triangle', 0.03, 1046);
    },
    reverse() {
      this.ensure();
      this.beep(920, 0.055, 'square', 0.03, 210);
      this.beep(210, 0.1, 'sawtooth', 0.022, 1180);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.036, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.026, 1176);
    },
    abduct() {
      this.ensure();
      this.beep(250, 0.07, 'triangle', 0.02, 460);
    },
    splat() {
      this.ensure();
      this.noise(0.08, 0.038, 480);
      this.beep(170, 0.1, 'sine', 0.028, 60);
    },
    mutant() {
      this.ensure();
      this.beep(168, 0.16, 'sawtooth', 0.04, 78);
      this.beep(390, 0.12, 'square', 0.026, 150);
    },
    barren() {
      this.ensure();
      this.beep(96, 0.28, 'sawtooth', 0.046, 40);
      this.noise(0.2, 0.046, 180);
    },
    swarm() {
      this.ensure();
      this.beep(140, 0.14, 'sawtooth', 0.042, 80);
      this.beep(420, 0.2, 'square', 0.03, 980);
      this.noise(0.12, 0.03, 520);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.1, 'triangle', 0.036, 1046);
      this.beep(1046, 0.16, 'sine', 0.04, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.06, 220);
      this.beep(220, 0.24, 'sawtooth', 0.048, 50);
      this.beep(110, 0.34, 'sine', 0.04, 34);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.036, 784);
      this.beep(784, 0.14, 'triangle', 0.03, 1176);
    },
    wave() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.036, 784);
      this.beep(659, 0.12, 'triangle', 0.03, 988);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.04, 659);
      this.beep(784, 0.12, 'triangle', 0.036, 1046);
      this.beep(1046, 0.22, 'sine', 0.042, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.036, 80);
      this.beep(110, 0.32, 'sine', 0.044, 42);
    },
    eShot() {
      this.ensure();
      this.beep(240, 0.05, 'square', 0.016, 90);
    },
    warp(save) {
      this.ensure();
      this.noise(0.16, 0.05, 220);
      this.beep(180, 0.18, 'sawtooth', 0.042, 920);
      this.beep(620, 0.16, 'sine', 0.04, 1480);
      if (save) this.beep(1320, 0.14, 'triangle', 0.034, 1760);
    },
    flame() {
      this.ensure();
      this.noise(0.08, 0.028, 380);
      this.beep(210, 0.08, 'sawtooth', 0.02, 90);
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
    while (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.nextLife += LIFE_EVERY;
      G.lives += 1;
      audio.extra();
      toast('额外生命', false, true);
      screenFlash(GOLD, 0.5);
      kick(3);
      syncPips();
    }
    if (G.score >= G.nextLife) G.nextLife += LIFE_EVERY;
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
      popFloat(G.ship.x, G.ship.y - 22, '×' + G.mult, GOLD, true);
    }
    if (comboEl && G.combo >= 2) {
      comboEl.hidden = false;
      comboEl.textContent = G.combo + ' 连 ×' + G.mult;
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
  }

  function liftingCount() {
    let n = 0;
    for (let i = 0; i < G.humans.length; i++) {
      if (G.humans[i].state === 'lift') n += 1;
    }
    return n;
  }

  function fallingCount() {
    let n = 0;
    for (let i = 0; i < G.humans.length; i++) {
      if (G.humans[i].state === 'fall') n += 1;
    }
    return n;
  }

  function livingHumans() {
    let n = 0;
    for (let i = 0; i < G.humans.length; i++) {
      if (G.humans[i].state !== 'dead') n += 1;
    }
    return n;
  }

  function hostilesLeft() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function raidLeft() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.kind === 'grab' || e.kind === 'fire' || e.kind === 'dynamo' || e.kind === 'mutant') n += 1;
    }
    return n;
  }

  function gateHot() {
    return liftingCount() > 0 || fallingCount() > 0;
  }

  function phaseName() {
    if (G.mode === 'title') return '环星';
    if (G.barren) return '荒星';
    if (G.phase === 'swarm') return '门鱼潮';
    if (G.phase === 'clear') return '清波';
    return '巡空';
  }

  function modeName() {
    return isCore() ? '门核' : '星门';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '星门';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.wave >= 4 || G.phase === 'swarm'));
    }
    if (tagLabel) {
      tagLabel.textContent = G.barren ? '荒星' : modeName();
      tagLabel.classList.toggle('warn', G.barren || G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', !G.barren && G.combo >= 8);
    }
    if (phaseLabel) {
      phaseLabel.textContent = phaseName();
      phaseLabel.classList.toggle('warn', G.phase === 'swarm' || G.barren);
      phaseLabel.classList.toggle('hot', G.phase === 'clear');
    }
    if (humanLabel) {
      const n = livingHumans();
      humanLabel.textContent = G.barren ? '荒星' : ('人 ' + n);
      humanLabel.classList.toggle('warn', n <= 2 || G.barren);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.combo + ' 连 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint('←↑↓→ 飞 · 空格开火 · Shift 翻头 · 钻星门跃迁救人', '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机扣命', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 星门打穿了', 'hot');
    else if (G.barren) setHint('荒星 · 全是变体，钻星门跳到对岸', 'warn');
    else if (G.phase === 'swarm') setHint('门鱼潮 · 翻头清掉鱼群', 'warn');
    else if (livingHumans() <= 2) setHint('人快没了 · 先打带人的抓手再去接', 'warn');
    else if (liftingCount() > 0) setHint('有人被带走 · 钻星门会跳到最危的人旁', 'hot');
    else if (fallingCount() > 0) setHint('有人在掉 · 钻星门接住，别摔死', 'hot');
    else if (G.carry) setHint('贴地放下 · 别飞太高摔人', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 翻头，危时钻星门', 'warn');
    else setHint('←↑↓→ 飞 · 空格开火 · Shift 翻头 · 钻星门跃迁', G.combo >= 6 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'WARP' : 'SGTW';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const end = kind === 'win' || kind === 'lose';
    if (ovStart) ovStart.classList.toggle('gone', end);
    if (ovEnd) ovEnd.classList.toggle('gone', !end);
    if (end && btnOvRetry) btnOvRetry.textContent = '再穿';
    if (end && btnOvModes) {
      if (kind === 'win' && G.kind === 'gate') btnOvModes.textContent = '门核';
      else btnOvModes.textContent = '换模式';
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
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
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
        g: spec.g == null ? 80 : spec.g
      });
    }
    capArr(particles, 380);
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
      vy: -56,
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
        x: Math.random() * WORLD,
        y: rand(PLAY_TOP + 4, GROUND - 70),
        r: Math.random() < 0.16 ? 1.35 : 0.6,
        a: rand(0.22, 0.88),
        p: Math.random() * TAU,
        par: Math.random() < 0.4 ? 0.32 : 0.68,
        rgb: Math.random() < 0.22 ? VIO : Math.random() < 0.18 ? ICE : WHT
      });
    }
    nebula.length = 0;
    for (let i = 0; i < 5; i++) {
      nebula.push({
        x: (i + 0.3) * (WORLD / 5) + rand(-80, 80),
        y: rand(70, 210),
        w: rand(140, 240),
        h: rand(40, 80),
        a: rand(0.04, 0.09),
        rgb: i % 2 ? VIO : CYN,
        par: 0.28
      });
    }
  }

  function explode(x, y, rgb, big) {
    const k = big ? 1.4 : 1;
    emit(REDUCE ? 6 : (16 * k) | 0, {
      x: x, y: y, j: 9 * k,
      vx0: -190 * k, vx1: 190 * k,
      vy0: -230 * k, vy1: 90,
      r0: 1.2, r1: 3.5 * k,
      life: big ? 0.56 : 0.38,
      rgb: rgb, g: 42
    });
    popSpark(x, y, rgb, big ? 28 : 16);
    popRing(x, y, rgb, big ? 18 : 11);
  }

  function waveSpec(n) {
    const c = isCore();
    return {
      grabs: (3 + n) + (c ? 2 : 0),
      fires: n >= 2 ? (n >= 4 ? 2 : 1) + (c && n >= 3 ? 1 : 0) : 0,
      dynamos: n >= 3 ? (n >= 5 ? 2 : 1) + (c ? 1 : 0) : (c && n >= 2 ? 1 : 0),
      baitT: (c ? 9 : 16) - n * 0.7,
      guppies: Math.round((8 + n * 2) * (c ? 1.42 : 1)),
      phreds: 1 + (n >= 4 ? 1 : 0) + (c ? 1 : 0)
    };
  }

  function spawnHuman(x) {
    const h = {
      x: wrapX(x),
      y: terrainY(x) - 8,
      vx: rand(-22, 22) || 16,
      state: 'walk',
      carrier: null,
      fallFrom: 0,
      vy: 0,
      t: rand(0, TAU)
    };
    G.humans.push(h);
    return h;
  }

  function spawnEnemy(kind, x, y) {
    const c = isCore();
    const en = {
      kind: kind,
      x: wrapX(x),
      y: y,
      vx: 0,
      vy: 0,
      facing: Math.random() < 0.5 ? -1 : 1,
      r: 12,
      hp: 1,
      score: 150,
      t: rand(0, TAU),
      shotCd: rand(0.5, 2.0),
      state: 'hunt',
      target: null,
      flash: 0,
      alive: true,
      rgb: MAG,
      dropT: rand(1.0, 2.2),
      spawnT: rand(1.4, 2.6),
      schoolT: 0
    };
    if (kind === 'grab') {
      en.r = 13;
      en.score = 150;
      en.rgb = MAG;
      en.vx = en.facing * (c ? 82 : 66);
    } else if (kind === 'mutant') {
      en.r = 13;
      en.score = 200;
      en.rgb = PNK;
      en.state = 'chase';
    } else if (kind === 'fire') {
      en.r = 16;
      en.score = 300;
      en.rgb = ORG;
      en.y = rand(PLAY_TOP + 26, 108);
      en.vx = en.facing * (c ? 108 : 88);
      en.hp = 2;
    } else if (kind === 'dynamo') {
      en.r = 16;
      en.score = 400;
      en.rgb = ICE;
      en.vx = en.facing * 28;
      en.hp = 3;
    } else if (kind === 'hum') {
      en.r = 7;
      en.score = 100;
      en.rgb = WHT;
      en.state = 'chase';
    } else if (kind === 'guppy') {
      en.r = 9;
      en.score = 120;
      en.rgb = TEAL;
      en.state = 'school';
      en.schoolT = rand(1.4, 2.4);
      en.vx = en.facing * (c ? 150 : 126);
    } else if (kind === 'phred') {
      en.r = 12;
      en.score = 250;
      en.rgb = RED;
      en.state = 'chase';
    }
    G.enemies.push(en);
    return en;
  }

  function spawnFireball(x, y, vx) {
    G.fireballs.push({
      x: wrapX(x),
      y: y,
      vx: vx * 0.35,
      vy: 70,
      t: 0,
      alive: true
    });
  }

  function spawnFlame(x, y) {
    G.flames.push({
      x: wrapX(x),
      y: y,
      t: 0,
      life: 0.92,
      alive: true
    });
  }

  function spawnHums(x, y, n) {
    for (let i = 0; i < n; i++) {
      const en = spawnEnemy('hum', x + rand(-14, 14), y + rand(-10, 10));
      const a = rand(0, TAU);
      en.vx = Math.cos(a) * rand(70, 150);
      en.vy = Math.sin(a) * rand(50, 130);
    }
  }

  function seedHumans(n) {
    G.humans.length = 0;
    G.carry = null;
    const count = n == null ? HUMANS0 : n;
    for (let i = 0; i < count; i++) {
      spawnHuman((i + 0.5) * (WORLD / count) + rand(-36, 36));
    }
  }

  function beginWave(n) {
    G.wave = n;
    G.phase = 'raid';
    G.waveWait = 0;
    const spec = waveSpec(n);
    G.baitT = spec.baitT;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const k = G.enemies[i].kind;
      if (k !== 'mutant') G.enemies.splice(i, 1);
    }
    G.fireballs.length = 0;
    G.flames.length = 0;
    G.bullets.length = 0;
    if (G.barren) {
      const m = spec.grabs + spec.fires;
      for (let i = 0; i < m; i++) {
        spawnEnemy('mutant', G.ship.x + 360 + i * (WORLD / Math.max(1, m)) + rand(-80, 80), rand(80, 220));
      }
    } else {
      for (let i = 0; i < spec.grabs; i++) {
        const x = G.ship.x + 400 + i * (WORLD / Math.max(1, spec.grabs)) + rand(-70, 70);
        spawnEnemy('grab', x, rand(PLAY_TOP + 24, 168));
      }
      for (let i = 0; i < spec.fires; i++) {
        spawnEnemy('fire', G.ship.x + 720 + i * 420, rand(PLAY_TOP + 28, 96));
      }
      for (let i = 0; i < spec.dynamos; i++) {
        spawnEnemy('dynamo', G.ship.x + 880 + i * 520, rand(90, 210));
      }
    }
    audio.wave();
    toast('第 ' + n + ' 波', false, true);
    syncHud();
  }

  function beginSwarm() {
    G.phase = 'swarm';
    const spec = waveSpec(G.wave);
    audio.swarm();
    toast(G.wave >= WAVES ? '终潮 · 门鱼' : '门鱼潮', true, false);
    screenFlash(TEAL, 0.42);
    kick(3.4);
    const side = Math.random() < 0.5 ? 1 : -1;
    for (let i = 0; i < spec.guppies; i++) {
      const x = G.ship.x + side * (280 + i * 22) + rand(-16, 16);
      const y = 90 + (i % 6) * 28 + rand(-8, 8);
      const gup = spawnEnemy('guppy', x, y);
      gup.facing = -side;
      gup.vx = gup.facing * (isCore() ? 150 : 126);
    }
    for (let i = 0; i < spec.phreds; i++) {
      spawnEnemy('phred', G.ship.x + (i % 2 === 0 ? 380 : -380), rand(70, 180));
    }
    syncHud();
  }

  function clearWaveBonus() {
    const alive = livingHumans();
    const bonus = (220 * G.wave) + alive * 110 * G.wave;
    if (bonus > 0) {
      addScore(bonus);
      popFloat(G.ship.x, G.ship.y - 28, '+' + bonus, GOLD, true);
    }
  }

  function finishWave() {
    G.phase = 'clear';
    G.waveWait = 1.4;
    clearWaveBonus();
    audio.wave();
    toast(G.wave >= WAVES ? '终潮清了' : ('第 ' + G.wave + ' 波清了'), false, true);
    screenFlash(GOLD, 0.4);
    syncHud();
  }

  function maybeBarren() {
    if (G.barren) return;
    if (livingHumans() > 0) return;
    G.barren = true;
    audio.barren();
    toast('荒星', true, false);
    screenFlash(MAG, 0.55);
    kick(4);
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.kind === 'grab') mutate(e, null);
    }
    syncHud();
  }

  function mutate(en, human) {
    en.kind = 'mutant';
    en.state = 'chase';
    en.rgb = PNK;
    en.score = 200;
    en.target = null;
    audio.mutant();
    explode(en.x, en.y, PNK, false);
    if (human) killHuman(human, false);
  }

  function dropLifted(en) {
    if (!en) return;
    if (en.state === 'lift' && en.target && en.target.state === 'lift') {
      const h = en.target;
      h.state = 'fall';
      h.carrier = null;
      h.fallFrom = h.y;
      h.vy = 20;
      h.vx = en.vx * 0.3;
    }
    en.target = null;
    en.state = 'hunt';
  }

  function killHuman(h, shot) {
    if (!h || h.state === 'dead') return;
    h.state = 'dead';
    if (G.carry === h) G.carry = null;
    explode(h.x, h.y, GOLD, false);
    if (G.mode !== 'play') return;
    audio.splat();
    breakCombo();
    toast(shot ? '误射' : '人没了', true, false);
    maybeBarren();
    syncHud();
  }

  function reverseShip() {
    G.ship.facing *= -1;
    G.revFlash = 0.16;
    G.revLock = 0.22;
    audio.reverse();
    if (!REDUCE) {
      ghosts.push({ x: G.ship.x, y: G.ship.y, facing: -G.ship.facing, t: 0.22 });
      capArr(ghosts, 12);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || overlayOpen()) return;
    if (G.fireCd > 0) return;
    if (G.shots.length >= shotCap()) return;
    const s = G.ship;
    G.shots.push({
      x: wrapX(s.x + s.facing * 14),
      y: s.y,
      vx: s.facing * SHOT_V,
      facing: s.facing,
      life: SHOT_LIFE
    });
    G.fireCd = fireGap();
    G.muzzle = 0.05;
    audio.shoot();
  }

  function enemyShot(en, spd) {
    if (G.bullets.length > (isCore() ? 16 : 11)) return;
    const dx = wrapDx(en.x, G.ship.x);
    const dy = G.ship.y - en.y;
    const m = hypot(dx, dy) || 1;
    G.bullets.push({
      x: en.x,
      y: en.y,
      vx: (dx / m) * spd,
      vy: (dy / m) * spd,
      life: 1.35
    });
    audio.eShot();
  }

  function mostEndangered() {
    let best = null;
    let rank = -1;
    for (let i = 0; i < G.humans.length; i++) {
      const h = G.humans[i];
      let r = -1;
      if (h.state === 'lift') r = 3000 - h.y;
      else if (h.state === 'fall') r = 1600 + h.y;
      if (r > rank) {
        rank = r;
        best = h;
      }
    }
    return best;
  }

  function enterGate() {
    if (G.mode !== 'play' || G.deadT > 0 || G.warpCd > 0) return;
    const s = G.ship;
    const fromX = s.x;
    const fromY = s.y;
    const h = mostEndangered();
    let destX;
    let destY;
    let saved = false;
    if (h) {
      destX = wrapX(h.x - s.facing * 72);
      destY = clamp(h.y - 16, PLAY_TOP + 18, terrainY(h.x) - 36);
      saved = true;
    } else {
      destX = wrapX(s.x + HALF);
      destY = s.y;
    }
    explode(fromX, fromY, VIO, true);
    popRing(fromX, fromY, CYN, 22);
    s.x = destX;
    s.y = destY;
    s.vx *= 0.45;
    G.camX = wrapX(s.x - (G.slot - VW * 0.5));
    explode(destX, destY, GOLD, false);
    popRing(destX, destY, VIO, 26);
    G.warpCd = 0.92;
    G.warpFlash = 0.42;
    G.invuln = Math.max(G.invuln, 0.48);
    hitStop(0.062);
    kick(4.2);
    screenFlash(saved ? GOLD : VIO, saved ? 0.5 : 0.42);
    audio.warp(saved);
    if (saved) {
      bumpCombo();
      const pts = 200 * G.mult;
      addScore(pts);
      popFloat(destX, destY - 18, '跃迁救人', GOLD, true);
      toast('跃迁救人', false, true);
    } else {
      popFloat(destX, destY - 16, '对岸', VIO, false);
      toast('对岸', false, true);
    }
    if (G.carry) {
      G.carry.x = wrapX(s.x - s.facing * 6);
      G.carry.y = s.y + 16;
    }
  }

  function dieShip(why) {
    if (G.deadT > 0 || G.invuln > 0 || G.endT > 0) return;
    G.deadT = 0.92;
    G.lives -= 1;
    G.why = why;
    breakCombo();
    explode(G.ship.x, G.ship.y, CYN, true);
    popRing(G.ship.x, G.ship.y, MAG, 24);
    audio.death();
    kick(6);
    screenFlash(MAG, 0.55);
    hitStop(0.078);
    toast(why, true, false);
    G.bullets.length = 0;
    G.fireballs.length = 0;
    if (G.carry) {
      const h = G.carry;
      h.state = 'fall';
      h.fallFrom = h.y;
      h.vy = 10;
      G.carry = null;
    }
    syncPips();
    syncHud();
    if (G.lives <= 0) {
      G.endT = 0.95;
      G.why = 'lose';
    }
  }

  function winRun() {
    const extra = 7000 + (isCore() ? 2000 : 0) + G.lives * 400 + livingHumans() * 200;
    const record = G.score + extra > G.best;
    addScore(extra);
    G.mode = 'win';
    G.endT = 0;
    audio.win();
    screenFlash(GOLD, 0.7);
    showOverlay(
      'win',
      isCore() ? '门核通关' : '星门打穿',
      (isCore() ? '门核五波门鱼潮打干净。' : '五波巡空加门鱼潮穿过来了。') + ' 本局 ' + G.score + (record ? ' · 新纪录' : '')
    );
    syncHud();
  }

  function loseRun() {
    G.mode = 'lose';
    G.endT = 0;
    audio.lose();
    showOverlay(
      'lose',
      '舰毁了',
      (G.score >= G.best && G.score > 0 ? '新纪录 · ' : '') + '撞机耗尽。本局 ' + G.score + ' · R 再穿'
    );
    syncHud();
  }

  function clearField() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.fireballs.length = 0;
    G.flames.length = 0;
    G.humans.length = 0;
    G.carry = null;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    ghosts.length = 0;
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'core' ? 'core' : 'gate';
    G.t = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.ship.x = WORLD * 0.42;
    G.ship.y = 210;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.ship.facing = 1;
    G.camX = wrapX(G.ship.x - (VW * 0.28 - VW * 0.5));
    G.slot = VW * 0.28;
    G.barren = false;
    G.phase = 'raid';
    G.wave = 1;
    G.waveWait = 0;
    G.fireCd = 0;
    G.muzzle = 0;
    G.revFlash = 0;
    G.revLock = 0;
    G.deadT = 0;
    G.invuln = 1.2;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0.32;
    G.flashRgb = VIO;
    G.punch = 1;
    G.why = '';
    G.endT = 0;
    G.carry = null;
    G.warpCd = 0;
    G.warpFlash = 0;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedHumans(HUMANS0);
    hideOverlay();
    audio.start();
    beginWave(1);
    toast(isCore() ? '门核 · 更密更狠' : '星门 · 钻门跃迁', false, true);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'gate';
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.wave = 1;
    G.phase = 'raid';
    G.barren = false;
    G.deadT = 0;
    G.invuln = 0;
    G.endT = 0;
    G.warpCd = 0;
    G.ship.x = wrapX(GATE_X - 180);
    G.ship.y = 210;
    G.ship.vx = 92;
    G.ship.vy = 0;
    G.ship.facing = 1;
    G.camX = wrapX(G.ship.x - (VW * 0.28 - VW * 0.5));
    clearField();
    seedHumans(8);
    spawnEnemy('grab', G.ship.x + 260, 130);
    spawnEnemy('guppy', G.ship.x + 420, 100);
    spawnEnemy('fire', G.ship.x + 620, 80);
    showOverlay('title', '星门', '左右环绕飞，钻进星门跃迁救人。清完一波会涌门鱼潮。撞机扣命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('gate');
    else startGame(G.kind || 'gate');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('gate');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    G.gateSpin += dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.revFlash > 0) G.revFlash -= dt;
    if (G.warpFlash > 0) G.warpFlash -= dt;
    if (G.warpCd > 0) G.warpCd -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
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
      q.x = wrapX(q.x + q.vx * dt);
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
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].t -= dt;
      if (ghosts[i].t <= 0) ghosts.splice(i, 1);
    }
  }

  function desiredSlot() {
    return G.ship.facing > 0 ? VW * 0.28 : VW * 0.72;
  }

  function updateCamera(dt) {
    G.slot = lerp(G.slot, desiredSlot(), 1 - Math.exp(-dt * 4.2));
    const want = wrapX(G.ship.x - (G.slot - VW * 0.5));
    G.camX = wrapLerp(G.camX, want, 1 - Math.exp(-dt * 5.5));
  }

  function updatePlayer(dt) {
    const s = G.ship;
    if (G.deadT > 0) {
      updateCamera(dt);
      return;
    }

    let ax = 0;
    let ay = 0;
    if (analog.on) {
      ax = analog.x;
      ay = analog.y;
    }
    if (keys.l) ax = -1;
    if (keys.r) ax = 1;
    if (keys.u) ay = -1;
    if (keys.d) ay = 1;
    if (pointer.down && !analog.on && G.mode === 'play') {
      const dx = wrapDx(s.x, pointer.wx);
      const dy = pointer.wy - s.y;
      if (hypot(dx, dy) > 8) {
        ax = clamp(dx / 90, -1, 1);
        ay = clamp(dy / 80, -1, 1);
      }
    }

    if (G.mode === 'title') {
      ax = s.facing;
      ay = Math.sin(G.t * 0.7) * 0.22;
    }

    G.thrustOn = Math.abs(ax) > 0.18;
    if (G.revLock > 0) G.revLock -= dt;
    if (G.thrustOn) {
      const dir = ax > 0 ? 1 : -1;
      s.vx += dir * THRUST * dt * Math.min(1, Math.abs(ax) + 0.2);
      if (G.revLock <= 0) {
        if (analog.on && Math.abs(analog.x) > 0.45) s.facing = dir;
        else if (pointer.down && !analog.on && !keys.l && !keys.r) s.facing = dir;
      }
    } else {
      s.vx *= Math.exp(-dt * 0.42);
    }
    s.vx = clamp(s.vx, -maxVx(), maxVx());
    const wantVy = ay * VY;
    s.vy = lerp(s.vy, wantVy, 1 - Math.exp(-dt * 8));
    s.x = wrapX(s.x + s.vx * dt);
    s.y += s.vy * dt;
    const floor = terrainY(s.x) - 10;
    if (s.y > floor) {
      s.y = floor;
      s.vy = Math.min(0, s.vy);
    }
    if (s.y < PLAY_TOP + 12) {
      s.y = PLAY_TOP + 12;
      s.vy = Math.max(0, s.vy);
    }

    if (G.thrustOn && !REDUCE && G.mode === 'play') {
      emit(1, {
        x: wrapX(s.x - s.facing * 12), y: s.y + rand(-2, 2), j: 1,
        vx0: -s.facing * 80, vx1: -s.facing * 180,
        vy0: -20, vy1: 20,
        r0: 0.8, r1: 2.1,
        life: 0.16, rgb: VIO, g: 0
      });
    }
    if (!REDUCE && Math.abs(s.vx) > 140 && G.mode === 'play' && ((G.clock * 40) | 0) !== ((G.clock - dt) * 40 | 0)) {
      ghosts.push({ x: s.x, y: s.y, facing: s.facing, t: 0.16 });
      capArr(ghosts, 12);
    }

    if (G.mode === 'play' && inGate(s.x, s.y) && G.warpCd <= 0 && G.deadT <= 0 && G.endT <= 0) {
      enterGate();
    }

    updateCamera(dt);
  }

  function freeHuman(h) {
    return h && h.state === 'walk';
  }

  function nearestWalkHuman(x) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.humans.length; i++) {
      const h = G.humans[i];
      if (!freeHuman(h)) continue;
      const d = Math.abs(wrapDx(x, h.x));
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    return best;
  }

  function chasePlayer(en, dt, spd, jitter) {
    const dx = wrapDx(en.x, G.ship.x);
    const dy = G.ship.y - en.y;
    const m = hypot(dx, dy) || 1;
    en.vx = lerp(en.vx, (dx / m) * spd + jitter, 1 - Math.exp(-dt * 2.5));
    en.vy = lerp(en.vy, (dy / m) * spd * 0.86, 1 - Math.exp(-dt * 2.2));
    en.x = wrapX(en.x + en.vx * dt);
    en.y += en.vy * dt;
    en.y = clamp(en.y, PLAY_TOP + 8, terrainY(en.x) - 12);
  }

  function maybeShoot(en, dt, gap, spd) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    en.shotCd -= dt;
    if (en.shotCd > 0) return;
    if (G.bullets.length > (isCore() ? 16 : 11)) return;
    const dx = wrapDx(en.x, G.ship.x);
    const dy = G.ship.y - en.y;
    if (hypot(dx, dy) > 340) {
      en.shotCd = 0.3;
      return;
    }
    if (Math.abs(dy) > 160 && Math.abs(dx) > 220) {
      en.shotCd = 0.25;
      return;
    }
    enemyShot(en, spd);
    en.shotCd = gap * rand(0.75, 1.2);
  }

  function steerEnemy(en, dt) {
    en.t += dt;
    if (en.flash > 0) en.flash -= dt;
    const c = isCore();
    if (en.kind === 'grab') {
      if (en.state === 'lift' && en.target) {
        en.vy = c ? -80 : -66;
        en.vx *= Math.exp(-dt * 1.6);
        en.y += en.vy * dt;
        en.x = wrapX(en.x + en.vx * dt);
        en.target.x = en.x;
        en.target.y = en.y + 16;
        if (en.y < PLAY_TOP + 14) {
          if (G.mode === 'play') mutate(en, en.target);
          else {
            en.y = PLAY_TOP + 16;
            en.vy = 20;
          }
        }
        return;
      }
      let h = en.target && freeHuman(en.target) ? en.target : nearestWalkHuman(en.x);
      en.target = h;
      if (h) {
        const dx = wrapDx(en.x, h.x);
        const ty = h.y - 18;
        en.vx = lerp(en.vx, clamp(dx, -1, 1) * (c ? 96 : 76), 1 - Math.exp(-dt * 2.4));
        en.vy = lerp(en.vy, clamp(ty - en.y, -80, 90), 1 - Math.exp(-dt * 2));
        en.x = wrapX(en.x + en.vx * dt);
        en.y += en.vy * dt * 0.55;
        if (Math.abs(dx) < 14 && Math.abs(en.y - ty) < 16) {
          en.state = 'lift';
          h.state = 'lift';
          h.carrier = en;
          en.target = h;
        }
      } else {
        en.vx = lerp(en.vx, en.facing * (c ? 92 : 72), 1 - Math.exp(-dt * 1.4));
        en.vy = Math.sin(en.t * 1.6) * 36;
        en.x = wrapX(en.x + en.vx * dt);
        en.y += en.vy * dt * 0.4;
      }
      en.y = clamp(en.y, PLAY_TOP + 10, terrainY(en.x) - 22);
      maybeShoot(en, dt, c ? 1.28 : 1.85, 155);
    } else if (en.kind === 'mutant') {
      chasePlayer(en, dt, c ? 188 : 156, Math.sin(en.t * 4.2) * 42);
      maybeShoot(en, dt, 1.1, 175);
    } else if (en.kind === 'phred') {
      chasePlayer(en, dt, c ? 262 : 222, Math.sin(en.t * 5) * 50);
      maybeShoot(en, dt, 0.78, 220);
    } else if (en.kind === 'hum') {
      chasePlayer(en, dt, c ? 210 : 176, Math.sin(en.t * 12 + en.x) * 80);
    } else if (en.kind === 'guppy') {
      if (en.state === 'school') {
        en.schoolT -= dt;
        en.x = wrapX(en.x + en.vx * dt);
        en.y += Math.sin(en.t * 5.2 + en.x * 0.02) * 70 * dt;
        en.y = clamp(en.y, PLAY_TOP + 16, 300);
        if (en.schoolT <= 0) en.state = 'chase';
      } else {
        chasePlayer(en, dt, c ? 196 : 168, Math.sin(en.t * 9) * 64);
      }
    } else if (en.kind === 'fire') {
      if (Math.abs(en.vx) < 20) en.vx = en.facing * (c ? 108 : 88);
      en.x = wrapX(en.x + en.vx * dt);
      en.y += Math.sin(en.t * 2.1) * 14 * dt;
      en.y = clamp(en.y, PLAY_TOP + 22, 122);
      en.dropT -= dt;
      if (en.dropT <= 0 && G.fireballs.length < (c ? 9 : 6) && G.mode === 'play') {
        spawnFireball(en.x, en.y + 10, en.vx);
        en.dropT = c ? rand(0.62, 1.2) : rand(0.95, 1.8);
      }
    } else if (en.kind === 'dynamo') {
      en.x = wrapX(en.x + en.vx * dt);
      en.y += Math.sin(en.t * 1.4) * 34 * dt;
      en.y = clamp(en.y, PLAY_TOP + 36, 250);
      en.spawnT -= dt;
      if (en.spawnT <= 0 && G.mode === 'play') {
        let hums = 0;
        for (let i = 0; i < G.enemies.length; i++) {
          if (G.enemies[i].kind === 'hum' && G.enemies[i].alive) hums += 1;
        }
        if (hums < (c ? 10 : 7)) spawnHums(en.x, en.y, c ? 3 : 2);
        en.spawnT = c ? rand(1.5, 2.3) : rand(2.0, 3.1);
      }
    }
  }

  function updateHumans(dt) {
    for (let i = G.humans.length - 1; i >= 0; i--) {
      const h = G.humans[i];
      h.t += dt;
      if (h.state === 'dead') {
        G.humans.splice(i, 1);
        continue;
      }
      if (h.state === 'walk') {
        h.vx += rand(-12, 12) * dt;
        h.vx = clamp(h.vx, -28, 28);
        h.x = wrapX(h.x + h.vx * dt);
        h.y = terrainY(h.x) - 8;
      } else if (h.state === 'fall') {
        h.vy += 360 * dt;
        h.y += h.vy * dt;
        h.x = wrapX(h.x + h.vx * dt);
        const floor = terrainY(h.x) - 8;
        if (h.y >= floor) {
          h.y = floor;
          if (h.fallFrom < floor - 128) {
            killHuman(h, false);
          } else {
            h.state = 'walk';
            h.vy = 0;
            h.vx = rand(-18, 18);
          }
        }
        if (G.mode === 'play' && G.deadT <= 0 && !G.carry && overlapR(G.ship.x, G.ship.y, 16, h.x, h.y, 10)) {
          h.state = 'carry';
          G.carry = h;
          audio.rescue();
          bumpCombo();
          const pts = 500 * G.mult;
          addScore(pts);
          popFloat(h.x, h.y - 12, '救到了', GOLD, true);
          popRing(h.x, h.y, GOLD, 18);
          hitStop(0.048);
          kick(2.4);
          screenFlash(GOLD, 0.28);
        }
      } else if (h.state === 'carry') {
        h.x = wrapX(G.ship.x - G.ship.facing * 6);
        h.y = G.ship.y + 16;
        const floor = terrainY(h.x);
        if (G.ship.y > floor - 30) {
          h.state = 'walk';
          h.y = floor - 8;
          h.vx = G.ship.vx * 0.2;
          G.carry = null;
          audio.drop();
          bumpCombo();
          const pts = 250 * G.mult;
          addScore(pts);
          popFloat(h.x, h.y - 14, '落地', GOLD, true);
          popRing(h.x, h.y, MINT, 12);
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const sh = G.shots[i];
      sh.x = wrapX(sh.x + sh.vx * dt);
      sh.life -= dt;
      if (sh.life <= 0) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const en = G.enemies[j];
        if (!en.alive) continue;
        if (overlapR(sh.x, sh.y, 5, en.x, en.y, en.r)) {
          hitEnemy(en, sh);
          hit = true;
          break;
        }
      }
      if (hit) {
        G.shots.splice(i, 1);
        continue;
      }
      for (let j = G.fireballs.length - 1; j >= 0; j--) {
        const f = G.fireballs[j];
        if (!f.alive) continue;
        if (overlapR(sh.x, sh.y, 5, f.x, f.y, 7)) {
          f.alive = false;
          explode(f.x, f.y, ORG, false);
          audio.hit('hum');
          bumpCombo();
          addScore(40 * G.mult);
          popFloat(f.x, f.y - 8, String(40 * G.mult), ORG, false);
          G.shots.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      for (let j = 0; j < G.humans.length; j++) {
        const h = G.humans[j];
        if (h.state === 'walk' || h.state === 'fall') {
          if (overlapR(sh.x, sh.y, 4, h.x, h.y, 7)) {
            killHuman(h, true);
            G.shots.splice(i, 1);
            break;
          }
        }
      }
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x = wrapX(b.x + b.vx * dt);
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < PLAY_TOP - 10 || b.y > VH + 20) G.bullets.splice(i, 1);
    }
    for (let i = G.fireballs.length - 1; i >= 0; i--) {
      const f = G.fireballs[i];
      if (!f.alive) {
        G.fireballs.splice(i, 1);
        continue;
      }
      f.t += dt;
      f.vy += 240 * dt;
      f.x = wrapX(f.x + f.vx * dt);
      f.y += f.vy * dt;
      const floor = terrainY(f.x) - 6;
      if (f.y >= floor || f.t > 2.4) {
        f.alive = false;
        spawnFlame(f.x, Math.min(f.y, floor));
        explode(f.x, f.y, ORG, false);
        audio.flame();
        G.fireballs.splice(i, 1);
      }
    }
    for (let i = G.flames.length - 1; i >= 0; i--) {
      const fl = G.flames[i];
      fl.t += dt;
      if (fl.t >= fl.life) G.flames.splice(i, 1);
    }
  }

  function hitEnemy(en, sh) {
    en.hp -= 1;
    en.flash = 0.08;
    popSpark(en.x, en.y, en.rgb, 12);
    hitStop(0.034);
    kick(1.6);
    if (en.hp > 0) {
      audio.hit(en.kind);
      en.x = wrapX(en.x + (sh ? sh.facing * 8 : 0));
      return;
    }
    en.alive = false;
    audio.hit(en.kind);
    audio.boom(en.kind === 'dynamo' || en.kind === 'fire' || en.kind === 'phred');
    explode(en.x, en.y, en.rgb, en.kind === 'dynamo' || en.kind === 'phred');
    bumpCombo();
    const pts = en.score * G.mult;
    addScore(pts);
    popFloat(en.x, en.y - 10, String(pts), en.rgb, G.mult >= 2);
    hitStop(en.kind === 'dynamo' ? 0.07 : 0.04);
    kick(en.kind === 'dynamo' ? 4.2 : 2.2);
    if (en.kind === 'grab') dropLifted(en);
    if (en.kind === 'dynamo') {
      spawnHums(en.x, en.y, isCore() ? 3 : 2);
      toast('磁核裂了', false, true);
    }
  }

  function collide() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.endT > 0) return;
    const s = G.ship;
    for (let i = 0; i < G.enemies.length; i++) {
      const en = G.enemies[i];
      if (!en.alive) continue;
      if (overlapR(s.x, s.y, SHIP_R, en.x, en.y, en.r * 0.82)) {
        dieShip('撞上' + (KIND_NAME[en.kind] || '敌舰'));
        en.alive = false;
        dropLifted(en);
        explode(en.x, en.y, en.rgb, true);
        return;
      }
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      if (overlapR(s.x, s.y, SHIP_R - 1, b.x, b.y, 4)) {
        dieShip('中弹');
        return;
      }
    }
    for (let i = 0; i < G.fireballs.length; i++) {
      const f = G.fireballs[i];
      if (f.alive && overlapR(s.x, s.y, SHIP_R - 1, f.x, f.y, 7)) {
        f.alive = false;
        dieShip('触焰');
        return;
      }
    }
    for (let i = 0; i < G.flames.length; i++) {
      const fl = G.flames[i];
      if (overlapR(s.x, s.y, SHIP_R - 2, fl.x, fl.y, 10)) {
        dieShip('触焰');
        return;
      }
    }
  }

  function pruneEnemies() {
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      if (!G.enemies[i].alive) G.enemies.splice(i, 1);
    }
  }

  function updateWave(dt) {
    if (G.phase === 'clear') {
      G.waveWait -= dt;
      if (G.waveWait <= 0) {
        if (G.wave >= WAVES) {
          G.endT = 0.2;
          G.why = 'win';
        } else {
          beginWave(G.wave + 1);
        }
      }
      return;
    }
    if (G.phase === 'raid') {
      G.baitT -= dt;
      if (G.baitT <= 0) {
        let hasPhred = false;
        for (let i = 0; i < G.enemies.length; i++) {
          if (G.enemies[i].kind === 'phred' && G.enemies[i].alive) hasPhred = true;
        }
        if (!hasPhred) {
          spawnEnemy('phred', G.ship.x + (Math.random() < 0.5 ? 420 : -420), rand(80, 180));
          toast('红饵', true, false);
          audio.mutant();
        }
        G.baitT = isCore() ? 7.5 : 11.5;
      }
      if (raidLeft() <= 0) beginSwarm();
    } else if (G.phase === 'swarm') {
      if (hostilesLeft() <= 0) finishWave();
    }
  }

  function titleDemo(dt) {
    if (G.enemies.length < 5 && Math.random() < 0.018) {
      spawnEnemy(Math.random() < 0.45 ? 'grab' : 'guppy', G.ship.x + rand(280, 720), rand(80, 200));
    }
    if (G.humans.length < 6) spawnHuman(G.ship.x + rand(200, 900));
    pruneEnemies();
  }

  function playSim(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if ((keys.fire || (pointer.down && !analog.on)) && G.mode === 'play') fire();

    if (G.endT > 0) {
      G.endT -= dt;
      updatePlayer(dt);
      updateShots(dt);
      updateHumans(dt);
      if (G.endT <= 0) {
        if (G.why === 'lose') loseRun();
        else if (G.why === 'win') winRun();
      }
      return;
    }

    updatePlayer(dt);
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) steerEnemy(G.enemies[i], dt);
    }
    pruneEnemies();
    updateShots(dt);
    updateHumans(dt);
    collide();
    updateWave(dt);

    if (liftingCount() > 0) {
      G.abductBeep -= dt;
      if (G.abductBeep <= 0) {
        audio.abduct();
        G.abductBeep = 0.52;
      }
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0 && G.lives > 0 && G.mode === 'play') {
        G.invuln = 1.7;
        G.ship.y = clamp(G.ship.y, 120, 240);
        G.ship.vx *= 0.3;
      }
    } else if (G.invuln > 0) {
      G.invuln -= dt;
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
      updatePlayer(dt);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].alive) steerEnemy(G.enemies[i], dt);
      }
      updateHumans(dt);
      titleDemo(dt);
      updateFx(dt);
      return;
    }

    if (G.mode === 'play') playSim(dt);
    else {
      updatePlayer(dt);
      updateShots(dt);
    }
    updateFx(dt);
  }

  function sx(x) {
    return ox + viewX(x) * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }

  function drawBg() {
    const night = isCore() || G.barren;
    const g0 = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    g0.addColorStop(0, night ? '#050814' : '#071422');
    g0.addColorStop(0.52, night ? '#080c1a' : '#06121c');
    g0.addColorStop(1, night ? '#14081a' : '#07161f');
    ctx.fillStyle = g0;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy + RADAR_H * scale, VW * scale, (VH - RADAR_H) * scale);
    ctx.clip();
    for (let i = 0; i < nebula.length; i++) {
      const n = nebula[i];
      const vx = viewX(n.x) * n.par + VW * 0.5 * (1 - n.par);
      ctx.fillStyle = rgba(n.rgb, n.a);
      ctx.beginPath();
      ctx.ellipse(ox + vx * scale, oy + n.y * scale, n.w * 0.5 * scale, n.h * 0.5 * scale, 0, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      const vx = viewX(st.x) * st.par + VW * 0.5 * (1 - st.par);
      if (vx < -4 || vx > VW + 4) continue;
      const tw = st.a * (0.65 + 0.35 * Math.sin(G.t * 2.2 + st.p));
      ctx.fillStyle = rgba(st.rgb, tw);
      ctx.fillRect(ox + vx * scale, oy + st.y * scale, st.r * scale, st.r * scale);
    }
    ctx.restore();
  }

  function drawRadar() {
    const y0 = oy;
    const h = RADAR_H * scale;
    ctx.fillStyle = isCore() || G.barren ? '#05070f' : '#061018';
    ctx.fillRect(ox, y0, VW * scale, h);
    ctx.strokeStyle = rgba(VIO, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, y0 + h);
    ctx.lineTo(ox + VW * scale, y0 + h);
    ctx.stroke();
    const viewW = VW / WORLD * VW;
    let vx = (wrapX(G.camX - VW * 0.5) / WORLD) * VW;
    ctx.fillStyle = rgba(GOLD, 0.12);
    if (vx + viewW <= VW) {
      ctx.fillRect(ox + vx * scale, y0 + 2 * scale, viewW * scale, h - 4 * scale);
    } else {
      const a = VW - vx;
      ctx.fillRect(ox + vx * scale, y0 + 2 * scale, a * scale, h - 4 * scale);
      ctx.fillRect(ox, y0 + 2 * scale, (viewW - a) * scale, h - 4 * scale);
    }
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.strokeRect(ox + vx * scale, y0 + 2 * scale, Math.min(viewW, VW - vx) * scale, h - 4 * scale);

    function blip(x, rgb, r) {
      const px = ox + (wrapX(x) / WORLD) * VW * scale;
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.arc(px, y0 + h * 0.5, r * scale, 0, TAU);
      ctx.fill();
    }
    const hot = gateHot();
    const gx = ox + (GATE_X / WORLD) * VW * scale;
    ctx.strokeStyle = rgba(hot ? GOLD : VIO, hot ? 0.95 : 0.8);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.ellipse(gx, y0 + h * 0.5, 4.2 * scale, 6.2 * scale, 0, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < G.humans.length; i++) {
      if (G.humans[i].state !== 'dead') blip(G.humans[i].x, GOLD, 1.3);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const rgb = e.kind === 'grab' ? MAG
        : e.kind === 'mutant' ? PNK
        : e.kind === 'phred' ? RED
        : e.kind === 'fire' ? ORG
        : e.kind === 'dynamo' ? ICE
        : e.kind === 'guppy' ? TEAL
        : WHT;
      blip(e.x, rgb, e.kind === 'guppy' || e.kind === 'hum' ? 1.0 : 1.5);
    }
    blip(G.ship.x, CYN, 2.1);
  }

  function drawTerrain() {
    ctx.beginPath();
    let started = false;
    const step = 10;
    const left = G.camX - VW * 0.5 - 20;
    for (let x = left; x <= left + VW + 40; x += step) {
      const wx = wrapX(x);
      const px = sx(wx);
      const py = sy(terrainY(wx));
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else ctx.lineTo(px, py);
    }
    ctx.lineTo(ox + (VW + 8) * scale, oy + VH * scale);
    ctx.lineTo(ox - 8 * scale, oy + VH * scale);
    ctx.closePath();
    ctx.fillStyle = G.barren ? 'rgba(22, 8, 20, 0.92)' : isCore() ? 'rgba(8, 12, 24, 0.92)' : 'rgba(6, 22, 32, 0.92)';
    ctx.fill();
    ctx.strokeStyle = rgba(G.barren ? MAG : ICE, 0.85);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();

    if (onScreen(GATE_X - 28) || onScreen(GATE_X + 28)) {
      const gy = sy(terrainY(GATE_X));
      ctx.strokeStyle = rgba(VIO, 0.7);
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(GATE_X - 22), gy);
      ctx.lineTo(sx(GATE_X - 22), gy - 18 * scale);
      ctx.lineTo(sx(GATE_X - 16), gy - 22 * scale);
      ctx.moveTo(sx(GATE_X + 22), gy);
      ctx.lineTo(sx(GATE_X + 22), gy - 18 * scale);
      ctx.lineTo(sx(GATE_X + 16), gy - 22 * scale);
      ctx.stroke();
    }
  }

  function drawGate() {
    if (!onScreen(GATE_X)) return;
    const x = sx(GATE_X);
    const y = sy(GATE_Y);
    const hot = gateHot();
    const pulse = 0.72 + 0.28 * Math.sin(G.t * (hot ? 9 : 3.4));
    const rgb = hot ? GOLD : VIO;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(G.gateSpin * 0.7);
    ctx.strokeStyle = rgba(rgb, 0.18 * pulse);
    ctx.lineWidth = 7 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, GATE_RX * scale, GATE_RY * scale, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = rgba(rgb, 0.95 * pulse);
    ctx.lineWidth = 2.1 * scale;
    ctx.setLineDash([6 * scale, 5 * scale]);
    ctx.lineDashOffset = G.gateSpin * 18 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, GATE_RX * scale, GATE_RY * scale, 0, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = rgba(CYN, 0.85);
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.ellipse(0, 0, GATE_RX * 0.52 * scale, GATE_RY * 0.52 * scale, G.gateSpin * 1.4, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -GATE_RY * 0.72 * scale);
    ctx.lineTo(0, GATE_RY * 0.72 * scale);
    ctx.strokeStyle = rgba(WHT, 0.28 + 0.35 * pulse);
    ctx.lineWidth = 1.1 * scale;
    ctx.stroke();
    if (hot) {
      ctx.beginPath();
      ctx.arc(0, 0, 4 * scale, 0, TAU);
      ctx.fillStyle = rgba(GOLD, 0.55 * pulse);
      ctx.fill();
    }
    ctx.restore();

    if (!REDUCE && ((G.clock * 18) | 0) !== (((G.clock - 0.016) * 18) | 0)) {
      emit(1, {
        x: GATE_X + rand(-8, 8), y: GATE_Y + rand(-22, 22), j: 2,
        vx0: -18, vx1: 18, vy0: -40, vy1: 20,
        r0: 0.6, r1: 1.6, life: 0.35, rgb: rgb, g: -10
      });
    }
  }

  function strokePoly(pts, rgb, glow, lw) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0] * scale;
      const py = pts[i][1] * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (glow) {
      ctx.strokeStyle = rgba(rgb, 0.2);
      ctx.lineWidth = (lw || 1.4) * 3.2 * scale;
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(rgb, 1);
    ctx.lineWidth = (lw || 1.4) * scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    const s = G.ship;
    if (!REDUCE) {
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        ctx.save();
        ctx.globalAlpha = g.t * 1.8;
        ctx.translate(sx(g.x), sy(g.y));
        ctx.scale(g.facing, 1);
        ctx.beginPath();
        ctx.moveTo(14 * scale, 0);
        ctx.lineTo(-10 * scale, 7 * scale);
        ctx.lineTo(-6 * scale, 0);
        ctx.lineTo(-10 * scale, -7 * scale);
        ctx.closePath();
        ctx.strokeStyle = rgba(VIO, 0.55);
        ctx.lineWidth = 1.1 * scale;
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.save();
    ctx.translate(sx(s.x), sy(s.y));
    ctx.scale(s.facing, 1);
    if (G.revFlash > 0) {
      ctx.strokeStyle = rgba(WHT, G.revFlash * 3);
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.moveTo(-18 * scale, 0);
      ctx.lineTo(20 * scale, 0);
      ctx.stroke();
    }
    if (G.warpFlash > 0) {
      ctx.beginPath();
      ctx.ellipse(0, 0, (18 + G.warpFlash * 28) * scale, (12 + G.warpFlash * 18) * scale, 0, 0, TAU);
      ctx.strokeStyle = rgba(VIO, G.warpFlash * 1.4);
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(16 * scale, 0);
    ctx.lineTo(-9 * scale, 7.2 * scale);
    ctx.lineTo(-4 * scale, 2.2 * scale);
    ctx.lineTo(-12 * scale, 0);
    ctx.lineTo(-4 * scale, -2.2 * scale);
    ctx.lineTo(-9 * scale, -7.2 * scale);
    ctx.closePath();
    ctx.strokeStyle = rgba(WHT, G.mode === 'title' ? 0.45 : 1);
    ctx.lineWidth = 1.7 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-1 * scale, 0, 4.2 * scale, 4.2 * scale, 0, 0, TAU);
    ctx.strokeStyle = rgba(VIO, 0.95);
    ctx.lineWidth = 1.15 * scale;
    ctx.stroke();
    if (G.thrustOn && !REDUCE) {
      const flick = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(G.t * 48));
      ctx.beginPath();
      ctx.moveTo(-11 * scale, -3.2 * scale);
      ctx.lineTo((-18 - 7 * flick) * scale, 0);
      ctx.lineTo(-11 * scale, 3.2 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.9 * flick);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }
    if (G.muzzle > 0) {
      ctx.beginPath();
      ctx.moveTo(16 * scale, 0);
      ctx.lineTo(28 * scale, 0);
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2.1 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnemy(en) {
    const rgb = en.flash > 0 ? WHT : en.rgb;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    if (en.kind === 'grab') {
      strokePoly([[-8, -5], [8, -5], [6, 3], [-6, 3]], rgb, true, 1.3);
      ctx.beginPath();
      ctx.moveTo(-6 * scale, 3 * scale);
      ctx.lineTo(-11 * scale, 11 * scale);
      ctx.lineTo(-4 * scale, 6 * scale);
      ctx.moveTo(6 * scale, 3 * scale);
      ctx.lineTo(11 * scale, 11 * scale);
      ctx.lineTo(4 * scale, 6 * scale);
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.3 * scale;
      ctx.stroke();
      if (en.state === 'lift') {
        ctx.beginPath();
        ctx.moveTo(0, 6 * scale);
        ctx.lineTo(0, 18 * scale);
        ctx.strokeStyle = rgba(GOLD, 0.7);
        ctx.stroke();
      }
    } else if (en.kind === 'mutant') {
      const w = 1 + 0.12 * Math.sin(en.t * 10);
      ctx.scale(w, 1);
      strokePoly([[-7, -7], [8, -3], [10, 5], [0, 8], [-9, 3]], rgb, true, 1.35);
    } else if (en.kind === 'fire') {
      strokePoly([[-15, -4], [4, -7], [15, 0], [4, 7], [-15, 4]], rgb, true, 1.4);
      ctx.beginPath();
      ctx.moveTo(-6 * scale, 0);
      ctx.lineTo(-16 * scale, 0);
      ctx.strokeStyle = rgba(GOLD, 0.7 + 0.3 * Math.sin(en.t * 12));
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
    } else if (en.kind === 'dynamo') {
      ctx.rotate(en.t * 2.4);
      strokePoly([[0, -12], [10, -6], [10, 6], [0, 12], [-10, 6], [-10, -6]], rgb, true, 1.4);
      ctx.beginPath();
      ctx.arc(0, 0, 3.2 * scale, 0, TAU);
      ctx.strokeStyle = rgba(WHT, 0.9);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
    } else if (en.kind === 'hum') {
      strokePoly([[7, 0], [-4, 3.5], [-4, -3.5]], rgb, false, 1.1);
    } else if (en.kind === 'guppy') {
      const face = en.vx >= 0 ? 1 : -1;
      ctx.scale(face, 1);
      strokePoly([[10, 0], [2, 5], [-6, 3], [-10, 0], [-6, -3], [2, -5]], rgb, true, 1.2);
      ctx.beginPath();
      ctx.moveTo(-10 * scale, 0);
      ctx.lineTo(-15 * scale, 4 * scale);
      ctx.lineTo(-13 * scale, 0);
      ctx.lineTo(-15 * scale, -4 * scale);
      ctx.closePath();
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
    } else if (en.kind === 'phred') {
      strokePoly([[0, -9], [11, 0], [0, 9], [-8, 4], [-8, -4]], rgb, true, 1.3);
      ctx.beginPath();
      ctx.arc(2 * scale, 0, 2.4 * scale, 0, TAU);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawHumans() {
    for (let i = 0; i < G.humans.length; i++) {
      const h = G.humans[i];
      if (h.state === 'dead') continue;
      if (!onScreen(h.x) && h.state !== 'carry') continue;
      ctx.save();
      ctx.translate(sx(h.x), sy(h.y));
      const rgb = h.state === 'lift' ? PNK : h.state === 'fall' ? GOLD : h.state === 'carry' ? MINT : GOLD;
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.3 * scale;
      ctx.beginPath();
      ctx.arc(0, -6 * scale, 2.2 * scale, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -3.6 * scale);
      ctx.lineTo(0, 3 * scale);
      ctx.moveTo(-3.4 * scale, -0.5 * scale);
      ctx.lineTo(3.4 * scale, -0.5 * scale);
      ctx.moveTo(0, 3 * scale);
      ctx.lineTo(-3 * scale, 8 * scale);
      ctx.moveTo(0, 3 * scale);
      ctx.lineTo(3 * scale, 8 * scale);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const sh = G.shots[i];
      const x = sx(sh.x);
      const y = sy(sh.y);
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 2.1 * scale;
      ctx.beginPath();
      ctx.moveTo(x - sh.facing * 10 * scale, y);
      ctx.lineTo(x + sh.facing * 6 * scale, y);
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.8);
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), 2.4 * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < G.fireballs.length; i++) {
      const f = G.fireballs[i];
      if (!f.alive) continue;
      const pulse = 0.6 + 0.4 * Math.sin(f.t * 14);
      ctx.fillStyle = rgba(ORG, 0.85 * pulse);
      ctx.beginPath();
      ctx.arc(sx(f.x), sy(f.y), 3.4 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.arc(sx(f.x), sy(f.y), 1.5 * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < G.flames.length; i++) {
      const fl = G.flames[i];
      const k = 1 - fl.t / fl.life;
      ctx.fillStyle = rgba(ORG, 0.45 * k);
      ctx.beginPath();
      ctx.ellipse(sx(fl.x), sy(fl.y), 11 * scale, 6 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.5 * k);
      ctx.beginPath();
      ctx.ellipse(sx(fl.x), sy(fl.y) - 4 * scale, 4 * scale, 7 * k * scale, 0, 0, TAU);
      ctx.fill();
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
    for (let i = rings.length - 1; i >= 0; i--) {
      const s = rings[i];
      const k = s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, 0.5 * (1 - k));
      ctx.lineWidth = (2.1 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + k * 30) * scale, 0, TAU);
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
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020c16';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * 0.5 * scale;
      const cy = oy + VH * 0.5 * scale;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawRadar();
    drawTerrain();
    drawGate();
    drawHumans();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && onScreen(G.enemies[i].x)) drawEnemy(G.enemies[i]);
    }
    drawShots();
    drawShip();
    drawParticles();
    drawFloats();
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

  function canvasToPlay(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function playToWorld(p) {
    return { x: wrapX(G.camX + (p.x - VW * 0.5)), y: p.y };
  }

  function setAnalogFromStick(e) {
    if (!stickEl) return;
    const rect = stickEl.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    let dx = (e.clientX - cx) / (rect.width * 0.42);
    let dy = (e.clientY - cy) / (rect.height * 0.42);
    const m = hypot(dx, dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    analog.x = dx;
    analog.y = dy;
    analog.on = m > 0.12;
    if (knobEl) {
      knobEl.style.transform = 'translate(' + (dx * 28) + 'px,' + (dy * 28) + 'px)';
    }
    if (stickEl) stickEl.classList.toggle('on', analog.on);
  }

  function clearAnalog() {
    analog.x = 0;
    analog.y = 0;
    analog.on = false;
    if (knobEl) knobEl.style.transform = '';
    if (stickEl) stickEl.classList.remove('on');
  }

  function onKey(e, down) {
    const code = e.code || '';
    const k = e.key;
    const left = code === 'KeyA' || code === 'ArrowLeft';
    const right = code === 'KeyD' || code === 'ArrowRight';
    const up = code === 'KeyW' || code === 'ArrowUp';
    const dn = code === 'KeyS' || code === 'ArrowDown';
    const space = code === 'Space' || k === ' ';
    const rev = code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ';
    if (down && (left || right || up || dn || space || k === 'Enter' || rev)) e.preventDefault();

    if (left) {
      keys.l = down;
      if (down && !e.repeat && G.mode !== 'title') G.ship.facing = -1;
    }
    if (right) {
      keys.r = down;
      if (down && !e.repeat && G.mode !== 'title') G.ship.facing = 1;
    }
    if (up) keys.u = down;
    if (dn) keys.d = down;
    if (space) keys.fire = down && G.mode === 'play' && !overlayOpen();

    if (!down) return;
    if (e.repeat) return;

    if (code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (code === 'KeyR') {
      restart();
      return;
    }
    if (rev && G.mode === 'play' && !overlayOpen() && G.deadT <= 0) {
      reverseShip();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') fire();
    }
    if ((k === '1' || code === 'Digit1') && overlayOpen() && G.mode === 'title') {
      startGame('gate');
    }
    if ((k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') {
      startGame('core');
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

  holdPad(padFire, function () { keys.fire = true; fire(); }, function () { keys.fire = false; });
  holdPad(padRev, function () {
    if (G.mode === 'play' && !overlayOpen() && G.deadT <= 0) reverseShip();
  }, null);

  if (stickEl) {
    stickEl.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      if (stickEl.setPointerCapture) {
        try { stickEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      setAnalogFromStick(e);
    });
    stickEl.addEventListener('pointermove', function (e) {
      if (!analog.on && !(e.buttons & 1) && e.pointerType !== 'touch') return;
      if (stickEl.hasPointerCapture && !stickEl.hasPointerCapture(e.pointerId) && e.pointerType !== 'touch') return;
      setAnalogFromStick(e);
    });
    function stickUp() { clearAnalog(); }
    stickEl.addEventListener('pointerup', stickUp);
    stickEl.addEventListener('pointercancel', stickUp);
    stickEl.addEventListener('lostpointercapture', stickUp);
  }

  if (btnGate) {
    btnGate.addEventListener('click', function () {
      audio.ensure();
      startGame('gate');
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
      startGame(G.kind || 'gate');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && G.kind === 'gate') startGame('core');
      else goTitle();
    });
  }
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
        if (e.pointerType !== 'touch') primaryAction();
        return;
      }
      pointer.down = true;
      pointer.id = e.pointerId;
      const p = playToWorld(canvasToPlay(e));
      pointer.wx = p.x;
      pointer.wy = p.y;
      if (G.mode === 'play') {
        keys.fire = true;
        fire();
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down || pointer.id !== e.pointerId) return;
      const p = playToWorld(canvasToPlay(e));
      pointer.wx = p.x;
      pointer.wy = p.y;
    });
    function ptrUp(e) {
      if (e && pointer.id != null && e.pointerId !== pointer.id) return;
      pointer.down = false;
      pointer.id = null;
      keys.fire = false;
    }
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
      pointer.down = false;
      clearAnalog();
    }
  });

  requestAnimationFrame(frame);
})();
