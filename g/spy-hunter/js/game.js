'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.48;
  const SHOT_SPD = 620;
  const FIRE_CD = 0.112;
  const MISS_CD = 0.42;
  const OIL_CD = 0.38;
  const YOFF_MIN = 72;
  const YOFF_MAX = 248;
  const YOFF_DEF = 118;
  const SCROLL_BASE = 216;
  const STEER = 268;
  const INVULN = 1.55;
  const DIE_T = 0.88;
  const BEST_KEY = 'playbox-spy-hunter-best';
  const MUTE_KEY = 'playbox-spy-hunter-mute';
  const OPS = '← → / WASD 开 · 空格开火 · Shift / Z 泼油 · 贴黄车补给 · R 重开 · M 静音';

  const MAG = [255, 61, 138];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 176, 32];
  const HOT2 = [255, 213, 106];
  const WHT = [255, 246, 232];
  const OILC = [122, 60, 255];
  const LEAF = [61, 255, 122];
  const ASPH = [38, 34, 32];
  const GRN = [36, 78, 38];
  const DGRN = [22, 48, 24];
  const NGRN = [18, 32, 28];
  const RED = [220, 48, 56];
  const BLK = [28, 26, 32];
  const VANC = [255, 196, 48];
  const CIV = [168, 176, 188];
  const BIKEC = [255, 72, 160];

  const SCORE = {
    slash: 120, bike: 180, limo: 320, heli: 420, bomb: 50,
    oil: 80, boss: 4200, stage: 1800, civ: -160
  };
  const STAGES = [
    { name: '国道', boss: '', len: 2480, half: 128, sway: 28, seed: 11, theme: 'hwy', call: '国道 · 日巡' },
    { name: '林带', boss: '', len: 2860, half: 108, sway: 46, seed: 29, theme: 'wood', call: '林带 · 树影' },
    { name: '夜港', boss: '装甲猎', len: 3180, half: 118, sway: 34, seed: 47, theme: 'port', call: '夜港 · 灯火' }
  ];
  const BOSS_HP = 46;

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
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function spdMul(night, stage) {
    return (night ? 1.34 : 1) * (1 + Math.max(0, stage - 1) * 0.09);
  }
  function kindBag(stage, night) {
    const s = ((stage - 1) % 3) + 1;
    if (s === 1) {
      return night
        ? ['civ', 'slash', 'slash', 'bike', 'slash', 'civ']
        : ['civ', 'civ', 'slash', 'slash', 'civ', 'bike'];
    }
    if (s === 2) {
      return night
        ? ['slash', 'bike', 'bike', 'limo', 'slash', 'civ']
        : ['civ', 'slash', 'bike', 'bike', 'slash', 'limo'];
    }
    return night
      ? ['slash', 'limo', 'heli', 'bike', 'limo', 'slash']
      : ['slash', 'limo', 'bike', 'heli', 'civ', 'limo'];
  }
  function hpOf(kind, stage, night) {
    const n = night ? 1 : 0;
    if (kind === 'limo') return 4 + Math.min(3, stage) + n;
    if (kind === 'heli') return 3 + n;
    if (kind === 'bike') return 1;
    if (kind === 'slash') return 1;
    if (kind === 'boss') return (BOSS_HP + (stage > 3 ? 8 : 0)) * (night ? 1.22 : 1) | 0;
    return 1;
  }
  function sizeOf(kind) {
    if (kind === 'bike') return { w: 12, h: 24, r: 9 };
    if (kind === 'van') return { w: 28, h: 42, r: 16 };
    if (kind === 'limo') return { w: 22, h: 44, r: 15 };
    if (kind === 'heli') return { w: 40, h: 22, r: 16 };
    if (kind === 'boss') return { w: 38, h: 58, r: 22 };
    if (kind === 'bomb') return { w: 10, h: 10, r: 6 };
    return { w: 20, h: 32, r: 12 };
  }
  function makeSpawns(stage, night, attract) {
    const spec = STAGES[(stage - 1) % 3];
    const len = spec.len;
    const out = [];
    const seed = stage * 1009 + (night ? 333 : 11);
    let y = attract ? 220 : 280;
    let i = 0;
    const dens = night ? 0.62 : (stage === 1 ? 1.08 : stage === 2 ? 0.86 : 0.72);
    while (y < len - 420) {
      const h = hash2(seed + i * 17);
      const h2 = hash2(seed + i * 31 + 9);
      const pack = 1 + ((h * (night ? 3.1 : 2.2)) | 0);
      const kinds = kindBag(stage, night);
      let k;
      for (k = 0; k < pack; k++) {
        const hk = hash2(seed + i * 51 + k * 7);
        const kind = kinds[(hk * kinds.length) | 0];
        const lane = hash2(seed + i + k * 13);
        out.push({ y: y + k * 22, kind: kind, lane: lane, fromBack: hk > 0.82 && kind === 'slash' });
      }
      y += (96 + h2 * 78) * dens;
      i += 1;
    }
    out.push({ y: 640, kind: 'van', lane: 0.5, fromBack: false });
    out.push({ y: 1580, kind: 'van', lane: 0.42, fromBack: false });
    if (stage >= 2 || night) out.push({ y: 2140, kind: 'van', lane: 0.58, fromBack: false });
    if (stage >= 3 || night) out.push({ y: 980, kind: 'heli', lane: 0.5, fromBack: false });
    out.sort(function (a, b) { return a.y - b.y; });
    return out;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (BEST_KEY !== 'playbox-spy-hunter-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-spy-hunter-mute') throw new Error('mute key');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('night faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (STAGES[0].len >= STAGES[1].len || STAGES[1].len >= STAGES[2].len) throw new Error('longer later');
    if (STAGES[0].half <= STAGES[1].half) throw new Error('wood narrower');
    if (hpOf('limo', 1, false) < 4) throw new Error('limo hp');
    if (hpOf('boss', 3, true) <= hpOf('boss', 3, false)) throw new Error('night boss');
    if (SCORE.limo <= SCORE.slash) throw new Error('limo score');
    if (SCORE.civ >= 0) throw new Error('civ penalty');
    const s1 = makeSpawns(1, false, false);
    const s2 = makeSpawns(2, false, false);
    const n1 = makeSpawns(1, true, false);
    if (s1.length < 12 || s2.length < 12) throw new Error('spawns');
    if (n1.length <= s1.length) throw new Error('night denser');
    let hasVan = false;
    let hasHeli = false;
    let i;
    for (i = 0; i < s1.length; i++) if (s1[i].kind === 'van') hasVan = true;
    for (i = 0; i < s2.length; i++) if (s2[i].kind === 'heli' || s2[i].kind === 'limo') hasHeli = true;
    const s3 = makeSpawns(3, false, false);
    for (i = 0; i < s3.length; i++) if (s3[i].kind === 'heli') hasHeli = true;
    if (!hasVan) throw new Error('van');
    if (!hasHeli) throw new Error('heli');
    if (sizeOf('boss').w <= sizeOf('slash').w) throw new Error('boss size');
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
  const btnHunt = document.getElementById('btn-hunt');
  const btnNight = document.getElementById('btn-night');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeHunt = document.getElementById('mode-hunt');
  const modeNight = document.getElementById('mode-night');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const comboBox = document.getElementById('combo-box');
  const comboEl = document.getElementById('combo');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const gunLabel = document.getElementById('gun-label');
  const oilLabel = document.getElementById('oil-label');
  const rocketLabel = document.getElementById('rocket-label');
  const bossWrap = document.getElementById('boss-wrap');
  const bossName = document.getElementById('boss-name');
  const bossBar = document.getElementById('boss-bar');
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
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false, fire: false, oil: false };
  const demo = { l: false, r: false, u: true, d: false, fire: true, oil: false, t: 0 };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH * 0.72, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const smears = [];

  const G = {
    mode: 'title',
    kind: 'hunt',
    t: 0,
    clock: 0,
    stage: 1,
    camY: 0,
    levelLen: 2480,
    theme: 'hwy',
    spawns: [],
    spawnI: 0,
    ents: [],
    shots: [],
    oils: [],
    player: { x: VW * 0.5, yOff: YOFF_DEF, ang: 0 },
    boss: null,
    lives: LIVES,
    score: 0,
    best: { h: 0, n: 0 },
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    dual: false,
    oilN: 3,
    missN: 0,
    fireCd: 0,
    missCd: 0,
    oilCd: 0,
    oilHeld: false,
    deadT: 0,
    invuln: 0,
    vanT: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: GOLD,
    punch: 1,
    toastT: 0,
    nextLife: LIFE_EVERY,
    clearT: 0,
    why: '',
    muzzle: 0,
    ready: 0,
    spd: SCROLL_BASE,
    grass: false,
    docked: false,
    bossOn: false,
    engineT: 0
  };

  function isNight() {
    return G.kind === 'night';
  }
  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function canControl() {
    return playing() && !overlayOpen() && G.deadT <= 0 && G.vanT <= 0;
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
    return G.mode === 'title' ? demo.fire : (keys.fire || pointer.down);
  }
  function oilHeld() {
    return G.mode === 'title' ? demo.oil : keys.oil;
  }
  function pWorldY() {
    return G.camY + G.player.yOff;
  }
  function specNow() {
    return STAGES[(G.stage - 1) % 3];
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(worldY) {
    return oy + (VH - (worldY - G.camY)) * scale;
  }
  function onCam(x, y, pad) {
    const p = pad || 48;
    const sc = VH - (y - G.camY);
    return x > -p && x < VW + p && sc > -p && sc < VH + p;
  }
  function roadAt(worldY) {
    const spec = specNow();
    const shift = Math.sin(worldY * 0.0038 + spec.seed) * spec.sway
      + Math.sin(worldY * 0.00105 + spec.seed * 0.4) * spec.sway * 0.42;
    return { cx: VW * 0.5 + shift, half: spec.half };
  }
  function laneX(worldY, lane) {
    const r = roadAt(worldY);
    return r.cx + (lane - 0.5) * r.half * 1.42;
  }
  function bestNow() {
    return isNight() ? G.best.n : G.best.h;
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
      this.noise(0.026, 0.03, 1800);
      this.beep(780, 0.046, 'square', 0.038, 260);
      if (G.dual) this.beep(1040, 0.04, 'square', 0.022, 380);
    },
    oil() {
      this.ensure();
      this.noise(0.09, 0.05, 220);
      this.beep(140, 0.14, 'sine', 0.04, 70);
      this.beep(220, 0.1, 'triangle', 0.03, 90);
    },
    engine() {
      this.ensure();
      const p = 70 + G.spd * 0.22;
      this.beep(p, 0.05, 'sawtooth', 0.012, p * 0.82);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.045);
      this.noise(0.038, 0.034, 1200);
      this.beep(480 * lift, 0.07, 'square', 0.044, 860 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.16, 0.075, 220);
      this.beep(170, 0.18, 'sawtooth', 0.052, 48);
    },
    spin() {
      this.ensure();
      this.beep(320, 0.16, 'square', 0.036, 90);
      this.noise(0.12, 0.04, 400);
    },
    van() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.05, 523);
      this.beep(659, 0.12, 'triangle', 0.045, 880);
      this.beep(1047, 0.16, 'sine', 0.04, 1320);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    miss() {
      this.ensure();
      this.beep(240, 0.08, 'sawtooth', 0.03, 140);
      this.noise(0.05, 0.02, 800);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 280);
      this.beep(260, 0.22, 'sawtooth', 0.05, 60);
      this.beep(120, 0.34, 'sine', 0.045, 40);
    },
    boss() {
      this.ensure();
      this.beep(110, 0.22, 'sawtooth', 0.05, 55);
      this.beep(220, 0.28, 'square', 0.04, 90);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(1047, 0.22, 'sine', 0.04, 1319);
    },
    life() {
      this.ensure();
      this.beep(880, 0.08, 'square', 0.04, 1175);
      this.beep(1175, 0.14, 'triangle', 0.038, 1568);
    },
    rocket() {
      this.ensure();
      this.noise(0.08, 0.045, 600);
      this.beep(240, 0.16, 'sawtooth', 0.04, 520);
    }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o && typeof o === 'object') {
        G.best.h = o.h | 0;
        G.best.n = o.n | 0;
      }
    } catch (err) { /* ignore */ }
  }
  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify(G.best));
    } catch (err) { /* ignore */ }
  }
  function loadMute() {
    try {
      if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
    } catch (err) { /* ignore */ }
  }

  function toast(msg, kind) {
    if (!toastEl) return;
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden', 'warn', 'gold');
    if (kind) toastEl.classList.add(kind);
    G.toastT = 1.35;
    setTimeout(function () {
      if (tok === toastTok && toastEl) toastEl.classList.add('hidden');
    }, 1350);
  }

  function addScore(n, x, y) {
    if (G.mode === 'title' || n === 0) return;
    const v = n > 0 ? Math.round(n * G.mult) : n;
    G.score = Math.max(0, G.score + v);
    if (scoreAdd) {
      addTok += 1;
      const tok = addTok;
      scoreAdd.hidden = false;
      scoreAdd.textContent = (v >= 0 ? '+' : '') + v;
      setTimeout(function () {
        if (tok === addTok && scoreAdd) scoreAdd.hidden = true;
      }, 700);
    }
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (x != null) floatText(x, y, (v >= 0 ? '+' : '') + v, v >= 0 ? GOLD : MAG, v >= 400);
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        audio.life();
        toast('1UP', 'gold');
        buildPips();
      }
    }
    const k = isNight() ? 'n' : 'h';
    if (G.score > G.best[k]) {
      G.best[k] = G.score;
      saveBest();
    }
    syncHud();
  }

  function buildPips() {
    if (!pipsEl) return;
    pipsEl.innerHTML = '';
    const n = Math.max(G.lives, LIVES);
    let i;
    for (i = 0; i < n && i < LIFE_CAP; i++) {
      const el = document.createElement('i');
      if (i >= G.lives) el.className = 'off';
      pipsEl.appendChild(el);
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score | 0);
    if (bestEl) bestEl.textContent = String(bestNow() | 0);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2);
    if (stageLabel) {
      stageLabel.textContent = G.bossOn ? '装甲猎' : specNow().name;
      stageLabel.classList.toggle('hot', G.bossOn);
    }
    if (tagLabel) {
      tagLabel.textContent = isNight() ? '夜路' : '谍猎';
      tagLabel.classList.toggle('night', isNight());
    }
    if (gunLabel) gunLabel.textContent = G.dual ? '双管' : '机枪';
    if (oilLabel) {
      oilLabel.textContent = '油 ' + G.oilN;
      oilLabel.classList.toggle('low', G.oilN <= 0);
    }
    if (rocketLabel) {
      rocketLabel.hidden = G.missN <= 0;
      rocketLabel.textContent = '弹 ' + G.missN;
    }
    if (bossWrap) {
      const on = !!(G.boss && G.boss.hp > 0);
      bossWrap.hidden = !on;
      if (on && bossBar) {
        const p = clamp(G.boss.hp / G.boss.max, 0, 1);
        bossBar.style.transform = 'scaleX(' + p + ')';
        bossWrap.classList.toggle('hot', p < 0.34);
      }
    }
    if (modeHunt) modeHunt.setAttribute('aria-pressed', isNight() ? 'false' : 'true');
    if (modeNight) modeNight.setAttribute('aria-pressed', isNight() ? 'true' : 'false');
    if (hintEl) {
      hintEl.classList.toggle('hot', G.combo >= 4);
      hintEl.classList.toggle('warn', G.lives <= 1 && G.mode === 'play');
    }
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SPYH';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '夜路' : '换模式';
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
        g: spec.g == null ? 0 : spec.g
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
      vx0: -200 * p, vx1: 200 * p, vy0: -80 * p, vy1: 220 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.8 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.14 + p * 0.1);
    kick(2.1 + p * 2.4);
  }

  function burst(x, y, big) {
    emit(big ? 28 : 16, {
      x: x, y: y, j: big ? 18 : 12,
      vx0: -260, vx1: 260, vy0: -120, vy1: 280,
      life: big ? 0.55 : 0.38, r0: 2, r1: big ? 5.4 : 3.6, rgb: HOT
    });
    emit(10, {
      x: x, y: y, j: 10,
      vx0: -160, vx1: 160, vy0: -60, vy1: 180,
      life: 0.42, r0: 1.4, r1: 3.2, rgb: GOLD
    });
    popSpark(x, y, HOT, big ? 28 : 16);
    screenFlash(HOT, big ? 0.48 : 0.28);
    kick(big ? 7.2 : 4.2, big ? 'boom' : 'thump');
    hitStop(big ? 0.072 : 0.046);
    audio.boom();
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

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function spawnShot(x, y, vx, vy, from, rgb, r, dmg, homing) {
    G.shots.push({
      id: uid++,
      x: x, y: y, vx: vx, vy: vy,
      from: from, rgb: rgb, r: r || 3,
      dmg: dmg || 1, life: homing ? 1.6 : 1.05,
      homing: !!homing
    });
    capArr(G.shots, 90);
  }

  function fire() {
    if (!canControl() && G.mode !== 'title') return;
    if (G.fireCd > 0 || G.deadT > 0 || G.vanT > 0) return;
    G.fireCd = FIRE_CD;
    G.muzzle = 0.06;
    const py = pWorldY();
    const px = G.player.x;
    const dual = G.dual || G.mode === 'title';
    spawnShot(px - (dual ? 6 : 0), py + 18, 0, SHOT_SPD, 'p', GOLD, 3.2, 1, false);
    if (dual) spawnShot(px + 6, py + 18, 0, SHOT_SPD, 'p', GOLD, 3.2, 1, false);
    audio.shot();
    emit(4, {
      x: px, y: py + 16, j: 3,
      vx0: -40, vx1: 40, vy0: 80, vy1: 180,
      life: 0.12, r0: 1, r1: 2.2, rgb: GOLD
    });
    if (G.missN > 0 && G.missCd <= 0 && G.mode === 'play') {
      let target = null;
      let best = 1e9;
      let i;
      for (i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (!e.alive || e.friend || e.spinT > 0) continue;
        if (e.kind !== 'limo' && e.kind !== 'heli' && e.kind !== 'boss') continue;
        const d = hypot(e.x - px, e.y - py);
        if (e.y > py && d < best) {
          best = d;
          target = e;
        }
      }
      if (target) {
        G.missN -= 1;
        G.missCd = MISS_CD;
        const ang = Math.atan2(target.y - py, target.x - px);
        spawnShot(px, py + 10, Math.cos(ang) * 420, Math.sin(ang) * 420, 'p', CYN, 4.4, 3, true);
        audio.rocket();
        syncHud();
      }
    }
  }

  function dropOil() {
    if (!canControl()) return;
    if (G.oilN <= 0 || G.oilCd > 0 || G.deadT > 0) {
      if (G.oilN <= 0 && G.oilCd <= 0 && G.mode === 'play') audio.miss();
      return;
    }
    G.oilN -= 1;
    G.oilCd = OIL_CD;
    G.oilHeld = true;
    const py = pWorldY();
    G.oils.push({
      x: G.player.x,
      y: py - 28,
      life: 2.6,
      r: 16
    });
    capArr(G.oils, 12);
    audio.oil();
    emit(10, {
      x: G.player.x, y: py - 24, j: 8,
      vx0: -50, vx1: 50, vy0: -80, vy1: 40,
      life: 0.35, r0: 2, r1: 4, rgb: OILC
    });
    kick(1.6, 'thump');
    syncHud();
  }

  function spawnEnt(spec) {
    const y = spec.fromBack ? G.camY - 36 : spec.y;
    const x = laneX(y, spec.lane);
    const sz = sizeOf(spec.kind);
    const e = {
      id: uid++,
      kind: spec.kind,
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      w: sz.w,
      h: sz.h,
      r: sz.r,
      hp: hpOf(spec.kind, G.stage, isNight()),
      max: 1,
      alive: true,
      friend: spec.kind === 'van' || spec.kind === 'civ',
      civ: spec.kind === 'civ',
      ang: 0,
      spinT: 0,
      t: 0,
      fireT: rand(0.4, 1.2),
      dock: 0,
      used: false,
      lane: spec.lane,
      fromBack: !!spec.fromBack,
      flash: 0
    };
    e.max = e.hp;
    if (spec.kind === 'civ') {
      const palette = [[168, 176, 188], [90, 140, 200], [200, 170, 90], [140, 150, 130]];
      e.col = palette[(hash2(spec.y * 9) * palette.length) | 0];
    }
    G.ents.push(e);
    capArr(G.ents, 48);
    return e;
  }

  function spawnAhead() {
    while (G.spawnI < G.spawns.length) {
      const s = G.spawns[G.spawnI];
      if (s.fromBack) {
        if (G.camY + 40 < s.y) break;
      } else if (s.y > G.camY + VH + 50) break;
      G.spawnI += 1;
      if (s.kind === 'heli' && G.theme === 'hwy' && !isNight() && G.stage === 1) continue;
      spawnEnt(s);
    }
  }

  function enterVan(e) {
    e.used = true;
    e.friend = true;
    G.vanT = 0.48;
    G.docked = true;
    G.dual = true;
    G.oilN = 5;
    G.missN = 3;
    G.invuln = Math.max(G.invuln, 0.8);
    audio.van();
    screenFlash(GOLD, 0.55);
    kick(4.4, 'pickup');
    toast('武装补给', 'gold');
    emit(22, {
      x: e.x, y: e.y, j: 16,
      vx0: -180, vx1: 180, vy0: -80, vy1: 220,
      life: 0.5, r0: 2, r1: 4.5, rgb: GOLD
    });
    addScore(400, e.x, e.y);
    syncHud();
  }

  function killEnt(e, byOil) {
    if (!e.alive) return;
    e.alive = false;
    if (G.mode === 'title') {
      burst(e.x, e.y, e.kind === 'limo' || e.kind === 'heli' || e.kind === 'boss');
      return;
    }
    if (e.kind === 'boss') {
      G.boss = null;
      G.bossOn = false;
      burst(e.x, e.y, true);
      addScore(SCORE.boss, e.x, e.y);
      bumpCombo();
      winGame();
      return;
    }
    if (e.civ) {
      breakCombo();
      addScore(SCORE.civ, e.x, e.y);
      burst(e.x, e.y, false);
      toast('误伤民用', 'warn');
      return;
    }
    if (e.kind === 'van') {
      burst(e.x, e.y, true);
      breakCombo();
      addScore(-80, e.x, e.y);
      toast('补给车毁了', 'warn');
      return;
    }
    const pts = e.kind === 'heli' ? SCORE.heli
      : e.kind === 'limo' ? SCORE.limo
        : e.kind === 'bike' ? SCORE.bike
          : SCORE.slash;
    burst(e.x, e.y, e.kind === 'limo' || e.kind === 'heli');
    bumpCombo();
    addScore(pts + (byOil ? SCORE.oil : 0), e.x, e.y);
    if (byOil) floatText(e.x, e.y + 18, '甩飞', OILC, false);
  }

  function hurtEnt(e, dmg, byOil) {
    if (!e.alive || e.spinT > 0) return;
    if (e.kind === 'van' && !e.used) {
      e.hp -= dmg;
      e.flash = 0.08;
      if (e.hp <= 0) killEnt(e, false);
      return;
    }
    if (e.friend && e.kind === 'van') return;
    e.hp -= dmg;
    e.flash = 0.08;
    hitStop(0.038 + Math.min(0.04, dmg * 0.012));
    audio.hit(G.combo + 1);
    juice(e.x, e.y, e.civ ? CIV : GOLD, 0.55 + dmg * 0.2);
    if (e.hp <= 0) killEnt(e, byOil);
    if (e.kind === 'boss') syncHud();
  }

  function startSpin(e) {
    if (!e.alive || e.friend || e.kind === 'heli' || e.kind === 'bomb' || e.spinT > 0) return;
    e.spinT = 0.62;
    e.vx = rand(-80, 80);
    audio.spin();
    emit(8, {
      x: e.x, y: e.y, j: 8,
      vx0: -70, vx1: 70, vy0: -40, vy1: 80,
      life: 0.3, r0: 1.5, r1: 3.4, rgb: OILC
    });
  }

  function die(why) {
    if (G.deadT > 0 || G.invuln > 0 || G.mode !== 'play') return;
    G.why = why || '撞车了';
    G.deadT = DIE_T;
    G.dual = false;
    G.missN = 0;
    G.lives -= 1;
    breakCombo();
    burst(G.player.x, pWorldY(), true);
    audio.death();
    kick(8, 'die');
    screenFlash(MAG, 0.55);
    buildPips();
    syncHud();
    if (G.lives <= 0) {
      G.lives = 0;
      loseGame();
    }
  }

  function respawn() {
    if (G.lives < 0 || G.mode !== 'play') return;
    G.player.x = roadAt(pWorldY()).cx;
    G.player.yOff = YOFF_DEF;
    G.player.ang = 0;
    G.invuln = INVULN;
    G.oilN = Math.max(2, G.oilN);
    G.deadT = 0;
    G.vanT = 0;
    toast('再上', '');
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    const msg = G.why || '撞车了';
    showOverlay('lose', msg, '分数 ' + G.score + ' · 连击最高 ' + G.maxCombo + ' · R 重开');
    if (hintEl) hintEl.textContent = 'R 重开 · 再来同模式';
  }

  function winGame() {
    G.mode = 'win';
    const bonus = 8000 + (isNight() ? 2200 : 0);
    addScore(bonus, G.player.x, pWorldY() + 40);
    audio.win();
    screenFlash(GOLD, 0.6);
    kick(5, 'win-flash');
    const title = isNight() ? '夜路得手' : '公路肃清了';
    showOverlay('win', title, '分数 ' + G.score + ' · 连击最高 ' + G.maxCombo + ' · 装甲猎击破');
    if (hintEl) hintEl.textContent = isNight() ? '夜路通关' : '通关 · 可开夜路';
  }

  function loadStage(n, keep) {
    const spec = STAGES[(n - 1) % 3];
    G.stage = n;
    G.camY = keep ? G.camY : 0;
    if (!keep) G.camY = 0;
    G.levelLen = spec.len;
    G.theme = spec.theme;
    G.spawns = makeSpawns(n, isNight(), G.mode === 'title');
    G.spawnI = 0;
    G.ents = [];
    G.shots = [];
    G.oils = [];
    G.boss = null;
    G.bossOn = false;
    G.ready = 0.55;
    G.player.x = VW * 0.5;
    G.player.yOff = YOFF_DEF;
    if (G.mode === 'play') toast(spec.call, 'gold');
    syncHud();
  }

  function startBoss() {
    G.bossOn = true;
    const sz = sizeOf('boss');
    const e = {
      id: uid++,
      kind: 'boss',
      x: roadAt(G.camY + VH * 0.74).cx,
      y: G.camY + VH * 0.74,
      vx: 0,
      vy: 0,
      w: sz.w,
      h: sz.h,
      r: sz.r,
      hp: hpOf('boss', G.stage, isNight()),
      max: 1,
      alive: true,
      friend: false,
      civ: false,
      ang: 0,
      spinT: 0,
      t: 0,
      fireT: 0.6,
      dock: 0,
      used: false,
      lane: 0.5,
      fromBack: false,
      flash: 0
    };
    e.max = e.hp;
    G.ents.push(e);
    G.boss = e;
    audio.boss();
    toast('装甲猎来了', 'warn');
    kick(5, 'boom');
    screenFlash(MAG, 0.4);
    syncHud();
  }

  function nextStage() {
    if (G.stage >= 3) {
      if (!G.bossOn) startBoss();
      return;
    }
    addScore(SCORE.stage * G.stage, G.player.x, pWorldY() + 30);
    G.stage += 1;
    const spec = STAGES[(G.stage - 1) % 3];
    G.levelLen = spec.len;
    G.theme = spec.theme;
    G.camY = 0;
    G.spawns = makeSpawns(G.stage, isNight(), false);
    G.spawnI = 0;
    G.ents = G.ents.filter(function (e) { return e.kind === 'boss'; });
    G.shots = [];
    G.oils = [];
    G.ready = 0.5;
    G.invuln = Math.max(G.invuln, 0.7);
    G.player.x = roadAt(G.player.yOff).cx;
    toast(spec.call, 'gold');
    screenFlash(GOLD, 0.28);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'night' ? 'night' : 'hunt';
    G.mode = 'play';
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.dual = false;
    G.oilN = 3;
    G.missN = 0;
    G.nextLife = LIFE_EVERY;
    G.deadT = 0;
    G.invuln = 0.6;
    G.vanT = 0;
    G.clearT = 0;
    G.why = '';
    G.stop = 0;
    G.player.ang = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    smears.length = 0;
    loadStage(1, false);
    buildPips();
    hideOverlay();
    syncHud();
    if (hintEl) hintEl.textContent = '← → 变道 · ↑ 加速 · 空格扫射 · Shift 泼油 · 贴上黄车补给';
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('hunt');
    else startGame(G.kind);
  }

  function tickFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
    G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 40 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.34) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (i = smears.length - 1; i >= 0; i--) {
      smears[i].life -= dt;
      if (smears[i].life <= 0) smears.splice(i, 1);
    }
  }

  function stepDemo(dt) {
    demo.t += dt;
    const w = Math.sin(demo.t * 1.4);
    demo.l = w < -0.25;
    demo.r = w > 0.25;
    demo.u = true;
    demo.fire = (demo.t * 3 | 0) % 2 === 0;
    if ((demo.t * 0.55 | 0) !== ((demo.t - dt) * 0.55 | 0) && Math.sin(demo.t * 2) > 0.6) {
      demo.oil = true;
    } else demo.oil = false;
    if (G.spawns.length === 0 || G.camY > specNow().len - 200) {
      loadStage(1, false);
      G.mode = 'title';
    }
  }

  function targetSpd() {
    const mul = spdMul(isNight(), G.stage);
    let s = SCROLL_BASE * mul;
    if (inU()) s *= 1.32;
    if (inD()) s *= 0.58;
    if (G.grass) s *= 0.62;
    if (G.bossOn) s *= 0.92;
    return s;
  }

  function stepPlayer(dt) {
    if (G.ready > 0) G.ready -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.missCd > 0) G.missCd -= dt;
    if (G.oilCd > 0) G.oilCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    const want = targetSpd();
    G.spd = lerp(G.spd, want, clamp(dt * 4.2, 0, 1));
    let steer = 0;
    if (inL()) steer -= 1;
    if (inR()) steer += 1;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover) && G.mode === 'play') {
      const dx = pointer.x - G.player.x;
      if (Math.abs(dx) > 10) steer = clamp(dx / 80, -1, 1);
      const py = VH - G.player.yOff;
      const dy = pointer.y - py;
      if (dy < -28) G.spd = lerp(G.spd, SCROLL_BASE * spdMul(isNight(), G.stage) * 1.32, dt * 3);
      if (dy > 36) G.spd = lerp(G.spd, SCROLL_BASE * spdMul(isNight(), G.stage) * 0.58, dt * 3);
    }
    G.player.x += steer * STEER * dt;
    G.player.ang = lerp(G.player.ang, steer * 0.22, clamp(dt * 10, 0, 1));
    if (inU()) G.player.yOff = clamp(G.player.yOff + 90 * dt, YOFF_MIN, YOFF_MAX);
    else if (inD()) G.player.yOff = clamp(G.player.yOff - 110 * dt, YOFF_MIN, YOFF_MAX);
    else G.player.yOff = lerp(G.player.yOff, YOFF_DEF, clamp(dt * 2.2, 0, 1));

    const r = roadAt(pWorldY());
    const half = r.half - 12;
    G.grass = Math.abs(G.player.x - r.cx) > half;
    if (Math.abs(G.player.x - r.cx) > r.half + 22) {
      die('冲出了');
      return;
    }
    G.player.x = clamp(G.player.x, 18, VW - 18);

    if (fireHeld()) fire();
    if (oilHeld()) {
      if (!G.oilHeld) dropOil();
      G.oilHeld = true;
    } else G.oilHeld = false;

    G.engineT -= dt;
    if (G.engineT <= 0) {
      G.engineT = 0.09;
      if (G.mode === 'play' && G.deadT <= 0) audio.engine();
    }
    if (G.spd > SCROLL_BASE * 1.08 && !REDUCE) {
      smears.push({
        x: G.player.x + rand(-6, 6),
        y: pWorldY() - 10,
        life: 0.18,
        rgb: GOLD
      });
      capArr(smears, 40);
    }
  }

  function stepEnt(e, dt) {
    e.t += dt;
    if (e.flash > 0) e.flash -= dt;
    const cam = G.spd;
    const r = roadAt(e.y);
    if (e.spinT > 0) {
      e.spinT -= dt;
      e.ang += dt * 14;
      e.x += e.vx * dt;
      e.y += cam * 0.35 * dt;
      if (e.spinT <= 0) {
        killEnt(e, true);
      }
      return;
    }
    if (e.kind === 'civ') {
      e.vy = cam * 0.52;
      e.x = lerp(e.x, laneX(e.y, e.lane), clamp(dt * 2, 0, 1));
      e.y += e.vy * dt;
    } else if (e.kind === 'slash') {
      const chase = e.y < pWorldY() + 160;
      e.vy = e.fromBack ? cam * 1.18 : cam * (chase ? 0.88 : 0.7);
      if (chase && G.deadT <= 0) e.x = lerp(e.x, G.player.x, clamp(dt * 1.6, 0, 1));
      else e.x = lerp(e.x, laneX(e.y, e.lane), clamp(dt * 1.4, 0, 1));
      e.y += e.vy * dt;
    } else if (e.kind === 'bike') {
      e.vy = cam * 0.78;
      e.x = r.cx + Math.sin(e.t * 3.4 + e.lane * 8) * (r.half * 0.72);
      e.y += e.vy * dt;
      e.ang = Math.sin(e.t * 3.4) * 0.28;
    } else if (e.kind === 'limo') {
      e.vy = cam * 0.62;
      e.x = lerp(e.x, laneX(e.y, e.lane), clamp(dt * 1.1, 0, 1));
      e.y += e.vy * dt;
    } else if (e.kind === 'van') {
      e.vy = cam * 0.58;
      e.x = lerp(e.x, r.cx + (e.lane - 0.5) * 36, clamp(dt * 1.2, 0, 1));
      e.y += e.vy * dt;
      if (!e.used && G.mode === 'play' && G.deadT <= 0 && G.vanT <= 0) {
        const py = pWorldY();
        if (py < e.y - 6 && py > e.y - 40 && Math.abs(G.player.x - e.x) < 18) {
          e.dock += dt;
          if (e.dock > 0.22) enterVan(e);
        } else e.dock = Math.max(0, e.dock - dt);
      } else if (e.used) {
        e.vy = cam * 1.35;
        e.y += 40 * dt;
      }
    } else if (e.kind === 'heli') {
      e.y = lerp(e.y, G.camY + VH * 0.78, clamp(dt * 2.4, 0, 1));
      e.x = lerp(e.x, G.player.x, clamp(dt * 0.9, 0, 1));
      e.fireT -= dt;
      if (e.fireT <= 0 && G.mode === 'play') {
        e.fireT = isNight() ? 1.05 : 1.45;
        const b = spawnEnt({ y: e.y - 8, kind: 'bomb', lane: 0.5, fromBack: false });
        b.x = e.x;
        b.y = e.y - 10;
        b.friend = false;
        b.vy = -40;
      }
    } else if (e.kind === 'bomb') {
      e.y -= 90 * dt;
      e.x += Math.sin(e.t * 6) * 10 * dt;
    } else if (e.kind === 'boss') {
      const ty = G.camY + VH * 0.72;
      e.y = lerp(e.y, ty, clamp(dt * 2, 0, 1));
      e.x = r.cx + Math.sin(e.t * 1.15) * (r.half * 0.62);
      e.fireT -= dt;
      if (e.fireT <= 0 && G.mode === 'play') {
        e.fireT = e.hp < e.max * 0.4 ? 0.55 : 0.85;
        spawnShot(e.x - 8, e.y - 20, -30, -280, 'e', MAG, 4, 1, false);
        spawnShot(e.x + 8, e.y - 20, 30, -280, 'e', MAG, 4, 1, false);
        if (e.hp < e.max * 0.5) spawnShot(e.x, e.y - 20, 0, -320, 'e', HOT, 4, 1, false);
        audio.shot();
      }
      if ((e.t * 0.9 | 0) !== ((e.t - dt) * 0.9 | 0) && G.mode === 'play') {
        const s = spawnEnt({
          y: e.y - 30,
          kind: Math.random() > 0.45 ? 'slash' : 'bike',
          lane: Math.random(),
          fromBack: false
        });
        s.y = e.y - 24;
      }
    }
    e.x = clamp(e.x, r.cx - r.half - 8, r.cx + r.half + 8);
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < (aw + bw) * 0.5 && Math.abs(ay - by) < (ah + bh) * 0.5;
  }

  function stepShots(dt) {
    let i;
    for (i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.life -= dt;
      if (s.homing) {
        let best = null;
        let bd = 1e9;
        let k;
        for (k = 0; k < G.ents.length; k++) {
          const e = G.ents[k];
          if (!e.alive || e.friend) continue;
          const d = hypot(e.x - s.x, e.y - s.y);
          if (d < bd) {
            bd = d;
            best = e;
          }
        }
        if (best) {
          const ang = Math.atan2(best.y - s.y, best.x - s.x);
          s.vx = lerp(s.vx, Math.cos(ang) * 480, clamp(dt * 6, 0, 1));
          s.vy = lerp(s.vy, Math.sin(ang) * 480, clamp(dt * 6, 0, 1));
        }
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.x < -20 || s.x > VW + 20 || !onCam(s.x, s.y, 80)) {
        G.shots.splice(i, 1);
        continue;
      }
      if (s.from === 'p') {
        let k;
        for (k = 0; k < G.ents.length; k++) {
          const e = G.ents[k];
          if (!e.alive || e.kind === 'bomb') continue;
          if (e.kind === 'van' && e.used) continue;
          if (aabb(s.x, s.y, s.r * 2, s.r * 2, e.x, e.y, e.w, e.h)) {
            hurtEnt(e, s.dmg, false);
            G.shots.splice(i, 1);
            break;
          }
        }
      } else if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (aabb(s.x, s.y, s.r * 2, s.r * 2, G.player.x, pWorldY(), 18, 28)) {
          G.shots.splice(i, 1);
          die('被炸了');
        }
      }
    }
  }

  function stepOils(dt) {
    let i;
    for (i = G.oils.length - 1; i >= 0; i--) {
      const o = G.oils[i];
      o.life -= dt;
      if (o.life <= 0) {
        G.oils.splice(i, 1);
        continue;
      }
      let k;
      for (k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive || e.friend || e.spinT > 0) continue;
        if (e.kind === 'heli' || e.kind === 'bomb' || e.kind === 'boss') continue;
        if (hypot(e.x - o.x, e.y - o.y) < o.r + e.r * 0.7) startSpin(e);
      }
    }
  }

  function collidePlayer() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.vanT > 0) return;
    const px = G.player.x;
    const py = pWorldY();
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || e.spinT > 0) continue;
      if (e.kind === 'heli') continue;
      if (e.kind === 'van') {
        if (e.used) continue;
        const docking = py < e.y - 6 && py > e.y - 40 && Math.abs(px - e.x) < 18;
        if (!docking && aabb(px, py, 18, 28, e.x, e.y, e.w * 0.86, e.h * 0.78)) {
          die('撞车了');
          return;
        }
        continue;
      }
      if (aabb(px, py, 18, 28, e.x, e.y, e.w * 0.86, e.h * 0.78)) {
        if (e.kind === 'bomb') {
          e.alive = false;
          die('被炸了');
          return;
        }
        if (e.civ) {
          die('撞车了');
          e.alive = false;
          burst(e.x, e.y, false);
          return;
        }
        die(e.kind === 'boss' ? '被轧了' : '撞车了');
        return;
      }
    }
    const r = roadAt(py);
    const treeL = r.cx - r.half - 18;
    const treeR = r.cx + r.half + 18;
    const gy = ((py / 46) | 0) * 46;
    const h = hash2(((gy / 46) | 0) * 19 + specNow().seed * 3);
    if (h > 0.35 && G.grass) {
      const side = hash2(gy * 7 + 3) > 0.5 ? treeR + 10 : treeL - 10;
      if (Math.abs(px - side) < 16) die('冲出了');
    }
  }

  function stepWorld(dt) {
    if (G.vanT > 0) G.vanT -= dt;
    G.camY += G.spd * dt;
    spawnAhead();
    let i;
    for (i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      stepEnt(e, dt);
      if (e.y < G.camY - 80 || e.y > G.camY + VH + 160) {
        if (e.kind !== 'boss') G.ents.splice(i, 1);
      }
    }
    stepShots(dt);
    stepOils(dt);
    collidePlayer();
    if (G.mode === 'play' && !G.bossOn && G.deadT <= 0 && G.clearT <= 0) {
      if (G.camY + G.player.yOff > G.levelLen) {
        if (G.stage >= 3) {
          startBoss();
        } else {
          G.clearT = 0.55;
          toast(specNow().name + '通过', 'gold');
        }
      }
    }
    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
  }

  function step(dt) {
    G.clock += dt;
    G.t += dt;
    tickFx(dt);
    if (G.mode === 'title') {
      stepDemo(dt);
      G.spd = lerp(G.spd, SCROLL_BASE * 0.92, clamp(dt * 3, 0, 1));
      if (inL() || inR() || inU() || inD()) {
        let steer = 0;
        if (inL()) steer -= 1;
        if (inR()) steer += 1;
        G.player.x += steer * STEER * dt;
        G.player.ang = lerp(G.player.ang, steer * 0.22, clamp(dt * 10, 0, 1));
      }
      const r = roadAt(pWorldY());
      G.player.x = clamp(G.player.x, r.cx - r.half + 16, r.cx + r.half - 16);
      if (fireHeld() && G.fireCd <= 0) fire();
      if (G.fireCd > 0) G.fireCd -= dt;
      stepWorld(dt);
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      G.spd = lerp(G.spd, 40, clamp(dt * 2, 0, 1));
      stepWorld(dt);
      return;
    }
    if (G.deadT > 0) {
      G.deadT -= dt;
      G.spd = lerp(G.spd, 30, clamp(dt * 3, 0, 1));
      stepWorld(dt);
      if (G.deadT <= 0 && G.mode === 'play') respawn();
      return;
    }
    if (G.vanT > 0) {
      G.spd = lerp(G.spd, SCROLL_BASE * 0.7, clamp(dt * 4, 0, 1));
      stepWorld(dt);
      return;
    }
    stepPlayer(dt);
    stepWorld(dt);
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    ctx.fill();
  }

  function drawCar(x, y, w, h, body, glass, light, tail, ang, flash) {
    const px = sx(x);
    const py = sy(y);
    const s = scale;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(ang || 0);
    if (flash > 0) ctx.globalAlpha = 0.55 + Math.sin(G.clock * 40) * 0.25;
    ctx.fillStyle = rgba(body, 1);
    roundRect(-w * s * 0.5, -h * s * 0.5, w * s, h * s, 3.2 * s);
    ctx.fillStyle = rgba(glass, 0.95);
    ctx.fillRect(-w * s * 0.32, -h * s * 0.36, w * s * 0.64, h * s * 0.22);
    ctx.fillStyle = rgba([40, 36, 42], 0.7);
    ctx.fillRect(-w * s * 0.28, h * s * 0.02, w * s * 0.56, h * s * 0.16);
    ctx.fillStyle = rgba(light, 1);
    ctx.fillRect(-w * s * 0.34, -h * s * 0.5, w * s * 0.18, 2.4 * s);
    ctx.fillRect(w * s * 0.16, -h * s * 0.5, w * s * 0.18, 2.4 * s);
    ctx.fillStyle = rgba(tail || MAG, 1);
    ctx.fillRect(-w * s * 0.32, h * s * 0.42, w * s * 0.16, 2.2 * s);
    ctx.fillRect(w * s * 0.16, h * s * 0.42, w * s * 0.16, 2.2 * s);
    ctx.restore();
  }

  function drawHeli(e) {
    const px = sx(e.x);
    const py = sy(e.y);
    const s = scale;
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = rgba(BLK, 0.95);
    roundRect(-18 * s, -8 * s, 36 * s, 16 * s, 4 * s);
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.fillRect(-8 * s, -5 * s, 16 * s, 8 * s);
    ctx.strokeStyle = rgba(GOLD, 0.85);
    ctx.lineWidth = 1.6 * s;
    const rot = G.clock * 18;
    ctx.beginPath();
    ctx.moveTo(Math.cos(rot) * 22 * s, Math.sin(rot) * 6 * s);
    ctx.lineTo(Math.cos(rot + Math.PI) * 22 * s, Math.sin(rot + Math.PI) * 6 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Math.cos(rot + 1.57) * 22 * s, Math.sin(rot + 1.57) * 6 * s);
    ctx.lineTo(Math.cos(rot + 4.71) * 22 * s, Math.sin(rot + 4.71) * 6 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnt(e) {
    if (!onCam(e.x, e.y, 50)) return;
    if (e.kind === 'heli') {
      drawHeli(e);
      return;
    }
    if (e.kind === 'bomb') {
      const px = sx(e.x);
      const py = sy(e.y);
      ctx.fillStyle = rgba(HOT, 1);
      ctx.beginPath();
      ctx.arc(px, py, 5 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(px, py - 3 * scale, 2 * scale, 0, TAU);
      ctx.fill();
      return;
    }
    let body = RED;
    let glass = CYN;
    let light = GOLD;
    let tail = MAG;
    if (e.kind === 'civ') {
      body = e.col || CIV;
      glass = [180, 220, 230];
      light = WHT;
      tail = RED;
    } else if (e.kind === 'bike') {
      body = BIKEC;
      glass = CYN;
    } else if (e.kind === 'limo') {
      body = BLK;
      glass = [80, 90, 110];
      light = [255, 240, 180];
    } else if (e.kind === 'van') {
      body = e.used ? [180, 150, 40] : VANC;
      glass = [40, 40, 50];
      light = GOLD;
      tail = RED;
    } else if (e.kind === 'boss') {
      body = [48, 28, 22];
      glass = MAG;
      light = HOT;
      tail = RED;
    } else {
      body = [180, 36, 48];
    }
    drawCar(e.x, e.y, e.w, e.h, body, glass, light, tail, e.ang, e.flash);
    if (e.kind === 'van' && !e.used) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('VAN', sx(e.x), sy(e.y) + 4 * scale);
    }
    if (e.kind === 'boss') {
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ARM', sx(e.x), sy(e.y) + 4 * scale);
    }
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    if (G.vanT > 0) return;
    const py = pWorldY();
    if (G.invuln > 0 && ((G.clock * 16) | 0) % 2 === 0) return;
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(sx(G.player.x), sy(py + 20), 6 * scale, 0, TAU);
      ctx.fill();
    }
    drawCar(G.player.x, py, 22, 34, WHT, CYN, GOLD, MAG, G.player.ang, 0);
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.fillRect(sx(G.player.x) - 3 * scale, sy(py) + 2 * scale, 6 * scale, 3 * scale);
  }

  function drawOils() {
    let i;
    for (i = 0; i < G.oils.length; i++) {
      const o = G.oils[i];
      const a = clamp(o.life / 2.6, 0, 1);
      ctx.fillStyle = rgba([40, 18, 62], 0.55 * a);
      ctx.beginPath();
      ctx.ellipse(sx(o.x), sy(o.y), o.r * 1.4 * scale, o.r * 0.7 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(OILC, 0.7 * a);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
    }
  }

  function drawShots() {
    let i;
    for (i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      if (!REDUCE) {
        ctx.fillStyle = rgba(s.rgb, 0.28);
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y - (s.from === 'p' ? 8 : -8)), s.r * 0.7 * scale, 0, TAU);
        ctx.fill();
      }
    }
  }

  function drawFx() {
    let i;
    for (i = 0; i < smears.length; i++) {
      const m = smears[i];
      ctx.fillStyle = rgba(m.rgb, m.life * 1.6);
      ctx.fillRect(sx(m.x) - scale, sy(m.y), 2 * scale, 10 * scale);
    }
    for (i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < rings.length; i++) {
      const rg = rings[i];
      const t = rg.t / 0.34;
      ctx.strokeStyle = rgba(rg.rgb, 1 - t);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(rg.x), sy(rg.y), (rg.r + t * 22) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      const t = 1 - sp.t / 0.28;
      ctx.fillStyle = rgba(WHT, t);
      ctx.beginPath();
      ctx.arc(sx(sp.x), sy(sp.y), (sp.rad * 0.2 * t) * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = 'bold ' + (f.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(G.camY + VH), VW * scale, VH * scale);
  }

  function drawBg() {
    const night = G.theme === 'port' || isNight();
    const wood = G.theme === 'wood';
    const grass = night ? NGRN : wood ? DGRN : GRN;
    ctx.fillStyle = rgba(grass, 1);
    ctx.fillRect(sx(0), sy(G.camY + VH), VW * scale, VH * scale);

    const y0 = G.camY - 40;
    const y1 = G.camY + VH + 40;
    let y;
    for (y = ((y0 / 18) | 0) * 18; y < y1; y += 18) {
      const r = roadAt(y);
      const r2 = roadAt(y + 18);
      const x1 = sx(r.cx - r.half);
      const x2 = sx(r.cx + r.half);
      const x3 = sx(r2.cx + r2.half);
      const x4 = sx(r2.cx - r2.half);
      const ya = sy(y);
      const yb = sy(y + 18);
      ctx.fillStyle = night ? '#1a1820' : '#2a2624';
      ctx.beginPath();
      ctx.moveTo(x1, ya);
      ctx.lineTo(x2, ya);
      ctx.lineTo(x3, yb);
      ctx.lineTo(x4, yb);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(HOT, night ? 0.55 : 0.85);
      ctx.fillRect(sx(r.cx - r.half), ya, 3 * scale, yb - ya + 1);
      ctx.fillRect(sx(r.cx + r.half - 3), ya, 3 * scale, yb - ya + 1);
    }

    const dash = 28;
    for (y = ((y0 / dash) | 0) * dash; y < y1; y += dash) {
      if (((y / dash) | 0) % 2 === 0) continue;
      const r = roadAt(y + 6);
      ctx.fillStyle = rgba(GOLD, 0.72);
      ctx.fillRect(sx(r.cx - 2), sy(y + 16), 4 * scale, 14 * scale);
    }

    const stripe = 46;
    for (y = ((y0 / stripe) | 0) * stripe; y < y1; y += stripe) {
      const r = roadAt(y);
      const h = hash2(((y / stripe) | 0) * 19 + specNow().seed * 3);
      const h2 = hash2(((y / stripe) | 0) * 7 + 3);
      if (h > 0.22) {
        const tx = r.cx - r.half - 22;
        ctx.fillStyle = rgba(wood ? [28, 90, 36] : [24, 70, 30], 1);
        ctx.beginPath();
        ctx.arc(sx(tx), sy(y), (8 + h * 6) * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba([80, 48, 24], 1);
        ctx.fillRect(sx(tx) - 1.4 * scale, sy(y), 2.8 * scale, 14 * scale);
      }
      if (h2 > 0.28) {
        const tx = r.cx + r.half + 22;
        ctx.fillStyle = rgba(wood ? [28, 90, 36] : [24, 70, 30], 1);
        ctx.beginPath();
        ctx.arc(sx(tx), sy(y + 8), (8 + h2 * 6) * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba([80, 48, 24], 1);
        ctx.fillRect(sx(tx) - 1.4 * scale, sy(y + 8), 2.8 * scale, 14 * scale);
      }
      if (night && h > 0.6) {
        ctx.fillStyle = rgba(h2 > 0.5 ? GOLD : CYN, 0.45);
        ctx.beginPath();
        ctx.arc(sx(h2 > 0.5 ? 36 : VW - 36), sy(y), 3 * scale, 0, TAU);
        ctx.fill();
      }
    }

    if (night) {
      ctx.fillStyle = 'rgba(8, 6, 18, 0.22)';
      ctx.fillRect(sx(0), sy(G.camY + VH), VW * scale, VH * scale);
    }
  }

  function drawLetterbox() {
    ctx.fillStyle = '#120e08';
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
    ctx.fillStyle = '#120e08';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    drawBg();
    drawOils();
    let i;
    for (i = 0; i < G.ents.length; i++) {
      if (G.ents[i].kind !== 'heli') drawEnt(G.ents[i]);
    }
    drawShots();
    drawPlayer();
    for (i = 0; i < G.ents.length; i++) {
      if (G.ents[i].kind === 'heli') drawEnt(G.ents[i]);
    }
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

  function pointerWorld(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(0.001, r.width) * W;
    const y = (e.clientY - r.top) / Math.max(0.001, r.height) * H;
    return {
      x: (x - ox) / scale,
      y: (y - oy) / scale
    };
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('hunt');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'Shift' || k === 'ShiftLeft' || k === 'ShiftRight' || k === 'z' || k === 'Z') {
      keys.oil = down;
      inputSrc = 'key';
      if (down) {
        e.preventDefault();
        if (!e.repeat && canControl()) dropOil();
      }
      return;
    }
    if (space) {
      if (down) e.preventDefault();
      keys.fire = down;
      if (down) {
        audio.ensure();
        if (overlayOpen()) {
          if (G.mode === 'title' || G.mode === 'lose' || G.mode === 'win') primaryAction();
          return;
        }
        if (G.mode === 'play') fire();
      }
      return;
    }
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
    if (k === 'Enter') {
      e.preventDefault();
      if (overlayOpen()) primaryAction();
      return;
    }
    if (G.mode === 'title' || G.mode === 'lose' || G.mode === 'win') {
      if (k === '1') startGame('hunt');
      if (k === '2') startGame('night');
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      const w = pointerWorld(e);
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = w.x;
      pointer.y = w.y;
      inputSrc = 'ptr';
      if (G.mode === 'play' && !overlayOpen()) fire();
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
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function bindPad() {
    function hold(id, key) {
      const el = document.getElementById(id);
      if (!el) return;
      const on = function (e) {
        e.preventDefault();
        keys[key] = true;
        el.classList.add('held');
        inputSrc = 'pad';
        audio.ensure();
        if (key === 'fire' && G.mode === 'play' && !overlayOpen()) fire();
        if (key === 'oil' && canControl()) dropOil();
      };
      const off = function () {
        keys[key] = false;
        el.classList.remove('held');
      };
      el.addEventListener('pointerdown', on);
      el.addEventListener('pointerup', off);
      el.addEventListener('pointercancel', off);
      el.addEventListener('lostpointercapture', off);
    }
    hold('btn-left', 'l');
    hold('btn-right', 'r');
    hold('btn-up', 'u');
    hold('btn-down', 'd');
    hold('btn-fire', 'fire');
    hold('btn-oil', 'oil');
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    if (hidden) {
      last = now;
      draw();
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    const cap = STEP * 5;
    if (acc > cap) acc = cap;
    while (acc >= STEP) {
      if (G.stop > 0) G.stop -= STEP;
      else step(STEP);
      acc -= STEP;
    }
    draw();
  }

  function bind() {
    window.addEventListener('keydown', function (e) { onKey(e, true); });
    window.addEventListener('keyup', function (e) { onKey(e, false); });
    window.addEventListener('resize', resize);
    window.addEventListener('blur', function () {
      keys.l = keys.r = keys.u = keys.d = keys.fire = keys.oil = false;
    });
    document.addEventListener('visibilitychange', function () {
      hidden = document.hidden;
      if (!hidden) last = 0;
    });
    if (btnMute) btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
    if (btnRetry) btnRetry.addEventListener('click', function () {
      restart();
    });
    if (btnHunt) btnHunt.addEventListener('click', function () { startGame('hunt'); });
    if (btnNight) btnNight.addEventListener('click', function () { startGame('night'); });
    if (modeHunt) modeHunt.addEventListener('click', function () {
      if (G.mode === 'title') startGame('hunt');
      else if (G.mode === 'play') startGame('hunt');
    });
    if (modeNight) modeNight.addEventListener('click', function () {
      startGame('night');
    });
    if (ovAgain) ovAgain.addEventListener('click', function () { startGame(G.kind); });
    if (ovMenu) ovMenu.addEventListener('click', function () {
      if (G.mode === 'win' && !isNight()) {
        startGame('night');
        return;
      }
      G.mode = 'title';
      loadStage(1, false);
      showOverlay('title', '谍猎', '纵版公路。机枪扫车，泼油甩敌，贴上补给车换武装。撞车丢命。');
      if (hintEl) hintEl.textContent = '← → 变道 · ↑ 加速 · 空格扫射 · Shift 泼油 · 贴上黄车补给';
    });
    bindPointer();
    bindPad();
  }

  loadBest();
  loadMute();
  buildPips();
  loadStage(1, false);
  G.mode = 'title';
  showOverlay('title', '谍猎', '纵版公路。机枪扫车，泼油甩敌，贴上补给车换武装。撞车丢命。');
  syncHud();
  resize();
  bind();
  requestAnimationFrame(frame);
})();
