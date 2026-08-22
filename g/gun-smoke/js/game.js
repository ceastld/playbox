'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const SHOT_SPD = 560;
  const FIRE_CD = 0.138;
  const PLAYER_R = 11;
  const YOFF_MIN = 78;
  const YOFF_MAX = 252;
  const YOFF_DEF = 118;
  const SCROLL_BASE = 108;
  const WALK_X = 228;
  const WALK_Y = 156;
  const BOOT_X = 78;
  const INVULN = 1.45;
  const DIE_T = 0.92;
  const BEST_KEY = 'playbox-gun-smoke-best';
  const MUTE_KEY = 'playbox-gun-smoke-mute';
  const OPS = 'WASD / 方向键 走 · 按住瞄准 · 空格开火 · 捡角/靴 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 26];
  const HOT2 = [255, 178, 74];
  const WHT = [255, 243, 230];
  const LEAF = [61, 255, 122];
  const DUST = [196, 138, 74];
  const BRN = [138, 82, 36];
  const DBR = [74, 42, 18];
  const SKIN = [255, 214, 160];
  const GUNM = [190, 210, 220];

  const AIM = {
    L: { dx: -0.73, dy: 0.683 },
    U: { dx: 0, dy: 1 },
    R: { dx: 0.73, dy: 0.683 }
  };
  const AIM_KEYS = ['L', 'U', 'R'];
  const WING_NAME = ['', '单发', '双向', '三向'];
  const SCORE = {
    bandit: 100, rider: 150, ambush: 120, sniper: 200,
    wagon: 400, boss: 2500, stage: 2000
  };
  const STAGES = [
    { name: '荒原', boss: '匪骑', len: 2520, hp: 28, theme: 'plain' },
    { name: '峡谷', boss: '篷车', len: 2920, hp: 40, theme: 'canyon' },
    { name: '矿镇', boss: '通缉', len: 3340, hp: 56, theme: 'town' }
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
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function spdMul(wild, stage) {
    return (wild ? 1.32 : 1) * (1 + Math.max(0, stage - 1) * 0.08);
  }
  function walkSpeed(boots) {
    return WALK_X + boots * BOOT_X;
  }
  function hpOf(kind, stage) {
    if (kind === 'sniper') return 2;
    if (kind === 'wagon') return 4 + Math.min(3, stage);
    if (kind === 'rider') return 1;
    return 1;
  }
  function kindBag(stage, wild) {
    const s = ((stage - 1) % 3) + 1;
    if (s === 1) {
      return wild
        ? ['bandit', 'bandit', 'rider', 'rider', 'ambush', 'wagon']
        : ['bandit', 'bandit', 'bandit', 'bandit', 'rider', 'rider', 'ambush', 'wagon'];
    }
    if (s === 2) {
      return ['bandit', 'bandit', 'rider', 'rider', 'rider', 'sniper', 'wagon', 'ambush'];
    }
    return ['bandit', 'rider', 'rider', 'sniper', 'sniper', 'wagon', 'ambush', 'ambush'];
  }
  function makeSpawns(stage, wild, attract) {
    const spec = STAGES[(stage - 1) % 3];
    const len = spec.len;
    const out = [];
    const seed = stage * 1009 + (wild ? 333 : 11);
    let y = attract ? 180 : 210;
    let i = 0;
    const dens = wild ? 0.68 : (stage === 1 ? 1.06 : stage === 2 ? 0.88 : 0.74);
    while (y < len - 380) {
      const h = hash2(seed + i * 17);
      const h2 = hash2(seed + i * 31 + 9);
      const pack = 1 + ((h * (wild ? 3.2 : 2.4)) | 0);
      const kinds = kindBag(stage, wild);
      let k;
      for (k = 0; k < pack; k++) {
        const hk = hash2(seed + i * 51 + k * 7);
        const kind = kinds[(hk * kinds.length) | 0];
        const x = 56 + hash2(seed + i + k * 13) * (VW - 112);
        out.push({ y: y + k * 16, kind: kind, x: x, drop: '' });
      }
      y += (90 + h2 * 72) * dens;
      i += 1;
    }
    out.push({ y: 640, kind: 'bandit', x: 240, drop: 'wing' });
    out.push({ y: 1120, kind: 'rider', x: 170, drop: 'boot' });
    out.push({ y: 1480, kind: 'wagon', x: 240, drop: '' });
    if (stage >= 2 || wild) out.push({ y: 1640, kind: 'wagon', x: 310, drop: 'wing' });
    if (stage >= 3 || wild) out.push({ y: 2080, kind: 'sniper', x: 150, drop: 'boot' });
    out.sort(function (a, b) { return a.y - b.y; });
    return out;
  }

  function selfCheck() {
    if (STAGES.length !== 3) throw new Error('3 stages');
    if (LIVES !== 3) throw new Error('3 lives');
    if (AIM_KEYS.length !== 3) throw new Error('3 aim');
    if (!AIM.L || !AIM.U || !AIM.R) throw new Error('aim dirs');
    if (AIM.U.dx !== 0 || AIM.U.dy !== 1) throw new Error('up aim');
    if (AIM.L.dx >= 0 || AIM.R.dx <= 0) throw new Error('side aim');
    if (spdMul(true, 1) <= spdMul(false, 1)) throw new Error('wild faster');
    if (spdMul(false, 2) <= spdMul(false, 1)) throw new Error('later faster');
    if (walkSpeed(1) <= walkSpeed(0) || walkSpeed(2) <= walkSpeed(1)) throw new Error('boots');
    if (BEST_KEY !== 'playbox-gun-smoke-best') throw new Error('best key');
    if (STAGES[0].len >= STAGES[1].len || STAGES[1].len >= STAGES[2].len) throw new Error('longer later');
    if (STAGES[0].hp >= STAGES[1].hp || STAGES[1].hp >= STAGES[2].hp) throw new Error('boss hp');
    if (hpOf('wagon', 1) < 4) throw new Error('wagon hp');
    if (SCORE.wagon <= SCORE.bandit) throw new Error('wagon score');
    const s1 = makeSpawns(1, false, false);
    const s2 = makeSpawns(2, false, false);
    const s3 = makeSpawns(3, false, false);
    if (s1.length < 12 || s2.length < 12 || s3.length < 12) throw new Error('spawns');
    let hasWagon = false;
    let hasWing = false;
    let hasBoot = false;
    let i;
    for (i = 0; i < s1.length; i++) {
      if (s1[i].kind === 'wagon') hasWagon = true;
      if (s1[i].drop === 'wing') hasWing = true;
      if (s1[i].drop === 'boot') hasBoot = true;
    }
    if (!hasWing || !hasBoot) throw new Error('drops');
    if (!hasWagon) {
      for (i = 0; i < s2.length; i++) if (s2[i].kind === 'wagon') hasWagon = true;
    }
    if (!hasWagon) throw new Error('wagon');
    if (WING_NAME[3] !== '三向') throw new Error('wing name');
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
  const btnClear = document.getElementById('btn-clear');
  const btnWild = document.getElementById('btn-wild');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeClear = document.getElementById('mode-clear');
  const modeWild = document.getElementById('mode-wild');
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
  const bootLabel = document.getElementById('boot-label');
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

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const demo = { l: false, r: false, u: false, d: false, fire: true, aim: 'U' };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH * 0.72, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];

  const G = {
    mode: 'title',
    kind: 'clear',
    t: 0,
    clock: 0,
    stage: 1,
    camY: 0,
    levelLen: 2520,
    theme: 'plain',
    spawns: [],
    spawnI: 0,
    ents: [],
    shots: [],
    pickups: [],
    player: { x: VW * 0.5, yOff: YOFF_DEF, face: 1 },
    boss: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    maxCombo: 0,
    comboT: 0,
    mult: 1,
    wings: 1,
    boots: 0,
    lastSide: 'L',
    fireCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    toastT: 0,
    nextLife: LIFE_EVERY,
    clearT: 0,
    why: '',
    muzzle: 0,
    gallopT: 0,
    ready: 0,
    wave: 1
  };

  function isWild() {
    return G.kind === 'wild';
  }
  function playing() {
    return G.mode === 'play';
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function canControl() {
    return playing() && !overlayOpen() && G.deadT <= 0;
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
  function pWorldY() {
    return G.camY + G.player.yOff;
  }
  function xMin() {
    return G.theme === 'canyon' ? 52 : 28;
  }
  function xMax() {
    return VW - xMin();
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
    const p = pad || 40;
    const sc = VH - (y - G.camY);
    return x > -p && x < VW + p && sc > -p && sc < VH + p;
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
    shot(n) {
      this.ensure();
      this.noise(0.028, 0.032, 1600);
      this.beep(720, 0.05, 'square', 0.04, 240);
      if (n >= 2) this.beep(980, 0.045, 'square', 0.028, 360);
      if (n >= 3) this.beep(1180, 0.05, 'triangle', 0.022, 420);
    },
    gallop() {
      this.ensure();
      this.noise(0.03, 0.016, 380);
      this.beep(90, 0.04, 'sine', 0.012, 55);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.036, 1100);
      this.beep(520 * lift, 0.07, 'square', 0.044, 880 * lift);
    },
    wagon() {
      this.ensure();
      this.noise(0.18, 0.08, 180);
      this.beep(160, 0.2, 'sawtooth', 0.055, 48);
      this.beep(90, 0.26, 'square', 0.04, 40);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.07, 240);
      this.beep(180, 0.16, 'sawtooth', 0.05, 55);
    },
    ping() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.05, 990);
      this.beep(990, 0.1, 'triangle', 0.042, 1320);
      this.beep(1320, 0.12, 'sine', 0.03, 1760);
    },
    boot() {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.04, 523);
      this.beep(659, 0.12, 'triangle', 0.04, 880);
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
    const w = isWild();
    if (modeClear) modeClear.setAttribute('aria-pressed', w ? 'false' : 'true');
    if (modeWild) modeWild.setAttribute('aria-pressed', w ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = specNow();
    if (stageLabel) {
      stageLabel.textContent = isWild() ? ('乱枪 ' + G.wave) : spec.name;
      stageLabel.classList.toggle('hot', !!(G.boss && G.boss.active && !G.boss.dead) || G.stage >= 3);
    }
    if (tagLabel) {
      tagLabel.textContent = isWild() ? '乱枪' : '清匪';
      tagLabel.classList.toggle('warn', isWild());
      tagLabel.classList.toggle('hot', !isWild() && G.stage >= 3);
    }
    if (gunLabel) {
      gunLabel.textContent = WING_NAME[G.wings] || '单发';
      gunLabel.className = 'gun' + (G.wings === 2 ? ' two' : G.wings >= 3 ? ' tri' : '');
    }
    if (bootLabel) {
      bootLabel.hidden = G.boots <= 0;
      bootLabel.textContent = G.boots >= 2 ? '靴×2' : '靴';
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && playing());
    const b = G.boss;
    if (bossWrap) {
      const show = !!(b && b.active && !b.dead);
      bossWrap.hidden = !show;
      if (show) {
        if (bossName) bossName.textContent = b.name;
        const ratio = b.max > 0 ? clamp(b.hp / b.max, 0, 1) : 0;
        if (bossBar) bossBar.style.transform = 'scaleX(' + ratio + ')';
        bossWrap.classList.toggle('low', ratio < 0.34);
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 中弹丢命', 'warn');
    else if (G.mode === 'win') setHint('矿镇平了 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 三向瞄准 · 躲开马队', 'warn');
    else if (b && b.active && !b.dead) setHint('头目 · ' + b.name, 'hot');
    else setHint('马上北进 · 按住方向瞄准 · 空格开火', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SMOKE';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '乱枪' : '换模式';
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
      vx0: -200 * p, vx1: 200 * p, vy0: -40 * p, vy1: 280 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.8 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.14 + p * 0.1);
    kick(2.1 + p * 2.4);
  }

  function wagonBurst(e) {
    emit(28, {
      x: e.x, y: e.y, j: 18,
      vx0: -280, vx1: 280, vy0: -80, vy1: 340,
      life: 0.55, r0: 2, r1: 5.5, rgb: HOT
    });
    emit(16, {
      x: e.x, y: e.y, j: 12,
      vx0: -180, vx1: 180, vy0: -40, vy1: 220,
      life: 0.42, r0: 1.4, r1: 3.4, rgb: GOLD
    });
    emit(10, {
      x: e.x, y: e.y, j: 10,
      vx0: -120, vx1: 120, vy0: -20, vy1: 160,
      life: 0.7, r0: 2, r1: 4, rgb: DBR
    });
    popSpark(e.x, e.y, HOT, 28);
    popSpark(e.x, e.y, GOLD, 18);
    screenFlash(HOT, 0.5);
    kick(7.2, 'boom');
    hitStop(0.072);
    audio.wagon();
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

  function currentAim() {
    if (G.mode === 'title') return demo.aim || 'U';
    if (inputSrc === 'ptr' && pointer.hover) {
      const dx = pointer.x - G.player.x;
      if (dx < -28) {
        G.lastSide = 'L';
        return 'L';
      }
      if (dx > 28) {
        G.lastSide = 'R';
        return 'R';
      }
      return 'U';
    }
    if (inL() && !inR()) {
      G.lastSide = 'L';
      return 'L';
    }
    if (inR() && !inL()) {
      G.lastSide = 'R';
      return 'R';
    }
    return 'U';
  }

  function aimSet() {
    if (G.wings >= 3) return ['L', 'U', 'R'];
    const cur = currentAim();
    if (G.wings <= 1) return [cur];
    if (cur === 'U') return ['U', G.lastSide || 'L'];
    return [cur, 'U'];
  }

  function countShots(from) {
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === from && G.shots[i].life > 0) n += 1;
    }
    return n;
  }

  function spawnShot(x, y, vx, vy, from, rgb, r, dmg) {
    G.shots.push({
      x: x, y: y, vx: vx, vy: vy,
      from: from, rgb: rgb, r: r || 3,
      dmg: dmg || 1, life: 1.15
    });
    capArr(G.shots, 80);
  }

  function fire() {
    if (G.fireCd > 0 || G.deadT > 0) return;
    if (G.mode === 'play' && overlayOpen()) return;
    const cap = 6 + G.wings * 2;
    if (countShots('p') >= cap) return;
    const dirs = aimSet();
    const p = G.player;
    const wy = pWorldY() + 16;
    const spd = SHOT_SPD;
    let i;
    for (i = 0; i < dirs.length; i++) {
      const d = AIM[dirs[i]];
      spawnShot(p.x + d.dx * 14, wy + d.dy * 8, d.dx * spd, d.dy * spd, 'p', GOLD, 3.1, 1);
    }
    G.fireCd = FIRE_CD;
    G.muzzle = 0.08;
    if (G.mode !== 'title') audio.shot(dirs.length);
  }

  function enemyFire(e, aimX, aimY, spd, rgb) {
    const dx = aimX - e.x;
    const dy = aimY - e.y;
    const len = hypot(dx, dy) || 1;
    spawnShot(e.x, e.y - 8, dx / len * spd, dy / len * spd, 'e', rgb || MAG, 2.8, 1);
  }

  function enemyFan(e, n, spread, spd, rgb) {
    const base = -Math.PI / 2;
    const start = base - spread * 0.5;
    const step = n <= 1 ? 0 : spread / (n - 1);
    let i;
    for (i = 0; i < n; i++) {
      const a = start + step * i;
      spawnShot(e.x, e.y - 10, Math.cos(a) * spd, Math.sin(a) * spd, 'e', rgb || MAG, 2.6, 1);
    }
  }

  function makeEnt(x, y, kind, drop) {
    const hp = hpOf(kind, G.stage);
    const r = kind === 'wagon' ? 22 : kind === 'rider' ? 14 : kind === 'sniper' ? 12 : 11;
    return {
      id: uid++,
      x: x, y: y, vx: 0, vy: 0,
      kind: kind, hp: hp, max: hp,
      r: r, t: rand(0, 1), fire: rand(0.4, 1.2),
      dead: false, hitN: 0, drop: drop || '',
      face: x > VW * 0.5 ? -1 : 1,
      name: kind
    };
  }

  function makeBoss(spec) {
    const hp = (spec.hp * (isWild() ? 1.18 : 1) * (1 + Math.max(0, G.wave - 1) * 0.08)) | 0;
    return {
      id: uid++,
      x: VW * 0.5, y: G.camY + VH + 40,
      vx: 70, vy: 0,
      kind: 'boss', name: spec.boss,
      hp: hp, max: hp, r: 26,
      t: 0, fire: 1.1, dropT: 2.2,
      dead: false, active: false, hitN: 0,
      face: 1, charge: 0, spawned: false, resolved: false
    };
  }

  function loadStage(n, attract) {
    const spec = STAGES[(n - 1) % 3];
    G.stage = n;
    G.theme = spec.theme;
    G.levelLen = spec.len;
    G.camY = 0;
    G.spawns = makeSpawns(n, isWild() && !attract, attract);
    G.spawnI = 0;
    G.ents = [];
    G.shots = [];
    G.pickups = [];
    G.boss = attract ? null : makeBoss(spec);
    G.player.x = VW * 0.5;
    G.player.yOff = YOFF_DEF;
    G.player.face = 1;
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = attract ? 99 : 0.55;
    G.clearT = 0;
    G.muzzle = 0;
    G.ready = attract ? 0 : 0.55;
    if (!attract) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
    }
    syncHud();
  }

  function spawnDue() {
    const edge = G.camY + VH + 36;
    while (G.spawnI < G.spawns.length) {
      const s = G.spawns[G.spawnI];
      if (s.y > edge) break;
      G.ents.push(makeEnt(s.x, s.y, s.kind, s.drop));
      G.spawnI += 1;
    }
  }

  function dropPickup(x, y, kind) {
    G.pickups.push({ x: x, y: y, kind: kind, t: 0, taken: false });
    capArr(G.pickups, 12);
  }

  function grabPickup(p) {
    p.taken = true;
    if (p.kind === 'wing') {
      G.wings = Math.min(3, G.wings + 1);
      toast(G.wings >= 3 ? '三向齐射' : '双向开火', false, true);
      audio.ping();
      floatText(p.x, p.y, G.wings >= 3 ? '三向' : '双向', GOLD, true);
    } else {
      G.boots = Math.min(2, G.boots + 1);
      toast(G.boots >= 2 ? '马蹄加快' : '马靴', false, true);
      audio.boot();
      floatText(p.x, p.y, '靴', CYN, true);
    }
    juice(p.x, p.y, GOLD, 1.1);
    kick(3.2, 'pickup');
    screenFlash(GOLD, 0.28);
    hitStop(0.04);
    syncHud();
  }

  function killEnt(e) {
    if (e.dead) return;
    e.dead = true;
    if (playing()) bumpCombo();
    const base = e.kind === 'boss' ? SCORE.boss * G.stage : (SCORE[e.kind] || 100);
    const pts = base * G.mult;
    addScore(pts);
    floatText(e.x, e.y + 8, '+' + pts, e.kind === 'wagon' || e.kind === 'boss' ? GOLD : WHT, e.kind === 'boss');
    if (e.kind === 'wagon') {
      wagonBurst(e);
    } else if (e.kind === 'boss') {
      juice(e.x, e.y, GOLD, 2.4);
      emit(22, {
        x: e.x, y: e.y, j: 20,
        vx0: -260, vx1: 260, vy0: -80, vy1: 300,
        life: 0.6, r0: 2, r1: 5, rgb: HOT
      });
      hitStop(0.08);
      kick(8, 'boom');
      audio.boom();
      screenFlash(GOLD, 0.55);
    } else {
      juice(e.x, e.y, e.kind === 'rider' ? HOT2 : MAG, 0.85);
      hitStop(0.036);
      audio.hit(G.combo);
    }
    if (e.drop) dropPickup(e.x, e.y, e.drop);
    else if (e.kind === 'wagon' && hash2(e.id * 19) > 0.55) {
      dropPickup(e.x, e.y, hash2(e.id * 7) > 0.5 ? 'wing' : 'boot');
    }
  }

  function hurtEnt(e, dmg, hx, hy) {
    if (e.dead) return;
    e.hp -= dmg;
    e.hitN = 0.08;
    popSpark(hx, hy, GOLD, 8);
    emit(4, {
      x: hx, y: hy, j: 4,
      vx0: -80, vx1: 80, vy0: 40, vy1: 160,
      life: 0.18, r0: 1, r1: 2.2, rgb: GOLD
    });
    if (e.kind === 'boss') {
      audio.hit(G.combo);
      hitStop(0.032);
      kick(2.2, 'thump');
    }
    if (e.hp <= 0) killEnt(e);
  }

  function hitPlayer(why) {
    if (!playing() || G.invuln > 0 || G.deadT > 0) return;
    G.deadT = DIE_T;
    G.lives -= 1;
    G.wings = Math.max(1, G.wings - 1);
    G.why = why;
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    const x = G.player.x;
    const y = pWorldY();
    juice(x, y, MAG, 1.8);
    emit(14, {
      x: x, y: y, j: 10,
      vx0: -200, vx1: 200, vy0: -40, vy1: 240,
      life: 0.5, r0: 2, r1: 4, rgb: HOT
    });
    hitStop(0.07);
    kick(7.5, 'die');
    audio.death();
    screenFlash(MAG, 0.45);
    toast(why, true, false);
    syncHud();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why || '被击中了';
    saveBest();
    showOverlay('lose', G.why, '分数 ' + G.score + ' · 最高 ' + G.best + ' · 连击 ' + G.maxCombo);
    audio.lose();
    setHint('R 重开 · 中弹丢命', 'warn');
    syncHud();
  }

  function winRun() {
    addScore(8000);
    G.mode = 'win';
    saveBest();
    if (stageEl) {
      stageEl.classList.add('win-flash');
      setTimeout(function () {
        if (stageEl) stageEl.classList.remove('win-flash');
      }, 700);
    }
    showOverlay('win', '矿镇平了', '烟尘散尽。分数 ' + G.score + ' · 最高连击 ' + G.maxCombo);
    audio.win();
    kick(4, 'win-flash');
    screenFlash(GOLD, 0.4);
    syncHud();
  }

  function afterBoss() {
    addScore(SCORE.stage * G.stage * G.mult);
    if (!isWild() && G.stage >= 3) {
      G.clearT = 2.15;
      return;
    }
    G.clearT = 1.35;
  }

  function nextLeg() {
    if (!isWild() && G.stage >= 3) {
      winRun();
      return;
    }
    if (isWild()) {
      G.wave += 1;
      G.stage = ((G.wave - 1) % 3) + 1;
      loadStage(G.stage, false);
      G.invuln = 0.8;
      toast('第 ' + G.wave + ' 波 · ' + specNow().name, false, true);
      audio.stage();
      return;
    }
    G.stage += 1;
    const keepW = G.wings;
    const keepB = G.boots;
    loadStage(G.stage, false);
    G.wings = keepW;
    G.boots = keepB;
    G.invuln = 0.9;
    toast(specNow().name, false, true);
    audio.stage();
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'wild' ? 'wild' : 'clear';
    G.mode = 'play';
    G.stage = 1;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.mult = 1;
    G.comboT = 0;
    G.wings = 1;
    G.boots = 0;
    G.nextLife = LIFE_EVERY;
    G.why = '';
    G.clock = 0;
    loadStage(1, false);
    hideOverlay();
    audio.start();
    toast(isWild() ? '乱枪 · 越打越密' : '清匪 · 三关北进', false, isWild());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'clear';
    G.stage = 1;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.wings = 2;
    G.boots = 0;
    G.clock = 0;
    loadStage(1, true);
    G.wings = 2;
    showOverlay('title', '烟枪', '马上北进，三向瞄准。匪徒、马队、篷车迎面而来。捡角加射击方向，捡靴加速。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('clear');
    else startGame(G.kind || 'clear');
  }

  function updateDemo() {
    demo.fire = true;
    demo.u = false;
    demo.d = false;
    let nearest = null;
    let best = 1e9;
    let i;
    for (i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.dead) continue;
      const dy = e.y - pWorldY();
      if (dy < 20) continue;
      const d = hypot(e.x - G.player.x, dy * 0.5);
      if (d < best) {
        best = d;
        nearest = e;
      }
    }
    let dodge = null;
    for (i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.from !== 'e') continue;
      if (Math.abs(s.x - G.player.x) < 28 && s.y < pWorldY() + 80 && s.y > pWorldY() - 20) {
        dodge = s;
        break;
      }
    }
    if (dodge) {
      demo.l = dodge.x >= G.player.x;
      demo.r = dodge.x < G.player.x;
      demo.aim = 'U';
      return;
    }
    if (nearest) {
      const dx = nearest.x - G.player.x;
      demo.l = dx < -18;
      demo.r = dx > 18;
      if (dx < -46) demo.aim = 'L';
      else if (dx > 46) demo.aim = 'R';
      else demo.aim = 'U';
    } else {
      const w = Math.sin(G.t * 0.65);
      demo.l = w > 0.25;
      demo.r = w < -0.25;
      demo.aim = 'U';
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    const mx = walkSpeed(G.boots);
    const my = WALK_Y + G.boots * 42;
    if (canControl() || G.mode === 'title') {
      if (inL()) {
        p.x -= mx * dt;
        p.face = -1;
      }
      if (inR()) {
        p.x += mx * dt;
        p.face = 1;
      }
      if (inU()) p.yOff += my * dt;
      if (inD()) p.yOff -= my * dt;
      if (inputSrc === 'ptr' && (pointer.down || pointer.hover) && G.mode === 'play') {
        p.x = lerp(p.x, clamp(pointer.x, xMin(), xMax()), 0.22);
        const want = clamp(VH - pointer.y, YOFF_MIN, YOFF_MAX);
        p.yOff = lerp(p.yOff, want, 0.12);
      }
    }
    p.x = clamp(p.x, xMin(), xMax());
    p.yOff = clamp(p.yOff, YOFF_MIN, YOFF_MAX);
    G.gallopT += dt;
    if (G.gallopT > 0.18) {
      G.gallopT = 0;
      if (G.deadT <= 0) {
        emit(REDUCE ? 1 : 3, {
          x: p.x + rand(-6, 6), y: G.camY + p.yOff - 10, j: 3,
          vx0: -40, vx1: 40, vy0: -80, vy1: -20,
          life: 0.32, r0: 1.4, r1: 3.2, rgb: DUST
        });
        if (playing() && !REDUCE) audio.gallop();
      }
    }
  }

  function updateEnt(e, dt) {
    if (e.dead) return;
    e.t += dt;
    e.hitN = Math.max(0, e.hitN - dt);
    e.fire -= dt;
    const py = pWorldY();
    const mul = spdMul(isWild(), isWild() ? G.wave : G.stage);
    if (e.kind === 'boss') {
      if (!e.active) {
        e.y -= 70 * dt;
        if (e.y <= G.camY + VH - 150) {
          e.active = true;
          e.y = G.camY + VH - 150;
          toast(e.name + ' 现身', false, true);
          audio.boss();
          kick(4, 'thump');
        }
        return;
      }
      const ty = G.camY + VH - 148;
      e.y = lerp(e.y, ty + Math.sin(e.t * 1.4) * 10, 0.08);
      e.x += e.vx * dt;
      if (e.x < 70 || e.x > VW - 70) e.vx *= -1;
      e.x = clamp(e.x, 64, VW - 64);
      if (e.name === '匪骑') {
        if (e.fire <= 0) {
          e.fire = 1.05 / mul;
          enemyFan(e, 3, 1.15, 220 * mul, MAG);
        }
        e.charge -= dt;
        if (e.charge <= 0) {
          e.charge = 3.6;
          e.y -= 80;
        }
      } else if (e.name === '篷车') {
        if (e.fire <= 0) {
          e.fire = 0.85 / mul;
          spawnShot(e.x - 16, e.y - 8, 0, -240 * mul, 'e', HOT, 3.2, 1);
          spawnShot(e.x + 16, e.y - 8, 0, -240 * mul, 'e', HOT, 3.2, 1);
        }
        e.dropT -= dt;
        if (e.dropT <= 0) {
          e.dropT = 2.35;
          let nLive = 0;
          let i;
          for (i = 0; i < G.ents.length; i++) {
            if (!G.ents[i].dead && G.ents[i].kind === 'bandit') nLive += 1;
          }
          if (nLive < 5) G.ents.push(makeEnt(e.x + rand(-30, 30), e.y - 24, 'bandit', ''));
        }
      } else {
        if (e.fire <= 0) {
          e.fire = 0.72 / mul;
          enemyFan(e, 5, 1.45, 250 * mul, MAG);
          if ((e.t * 2 | 0) % 3 === 0) enemyFire(e, G.player.x, py, 280 * mul, HOT);
        }
        e.dropT -= dt;
        if (e.dropT <= 0) {
          e.dropT = 2.8;
          G.ents.push(makeEnt(e.x + rand(-40, 40), e.y - 20, 'rider', ''));
        }
      }
      return;
    }
    if (e.kind === 'bandit') {
      e.x += Math.sin(e.t * 1.6 + e.id) * 18 * dt;
      e.y -= 12 * dt;
      if (e.fire <= 0) {
        e.fire = rand(1.55, 2.4) / mul;
        spawnShot(e.x, e.y - 8, 0, -200 * mul, 'e', MAG, 2.5, 1);
      }
    } else if (e.kind === 'rider') {
      const dx = G.player.x - e.x;
      e.vx = lerp(e.vx, clamp(dx, -1, 1) * 90, 0.08);
      e.x += e.vx * dt * mul;
      e.y -= 28 * dt * mul;
      e.face = e.vx >= 0 ? 1 : -1;
      if (e.fire <= 0) {
        e.fire = rand(1.15, 1.7) / mul;
        enemyFire(e, G.player.x, py, 240 * mul, HOT2);
      }
    } else if (e.kind === 'ambush') {
      if (e.t < 0.05) {
        e.x = hash2(e.id) > 0.5 ? -16 : VW + 16;
        e.face = e.x < 0 ? 1 : -1;
      }
      e.x += e.face * 150 * dt * mul;
      e.y += Math.sin(e.t * 7) * 40 * dt;
      if (e.fire <= 0 && e.x > 30 && e.x < VW - 30) {
        e.fire = 1.6;
        spawnShot(e.x, e.y - 6, 0, -210 * mul, 'e', MAG, 2.4, 1);
      }
    } else if (e.kind === 'sniper') {
      e.x += Math.sin(e.t * 0.8) * 10 * dt;
      if (e.fire <= 0) {
        e.fire = 1.12 / mul;
        enemyFan(e, 3, 0.95, 210 * mul, CYN);
      }
    } else if (e.kind === 'wagon') {
      e.x += Math.sin(e.t * 0.5 + e.id) * 22 * dt;
      e.x = clamp(e.x, 70, VW - 70);
      if (e.fire <= 0) {
        e.fire = 1.65 / mul;
        spawnShot(e.x - 12, e.y - 6, -30, -190 * mul, 'e', HOT, 3, 1);
        spawnShot(e.x + 12, e.y - 6, 30, -190 * mul, 'e', HOT, 3, 1);
      }
    }
    e.x = clamp(e.x, -40, VW + 40);
  }

  function updateShots(dt) {
    let i;
    for (i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || !onCam(s.x, s.y, 50)) {
        G.shots.splice(i, 1);
      }
    }
  }

  function collide() {
    const px = G.player.x;
    const py = pWorldY();
    let i;
    let j;
    for (i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.from === 'p') {
        for (j = 0; j < G.ents.length; j++) {
          const e = G.ents[j];
          if (e.dead) continue;
          if (hypot(s.x - e.x, s.y - e.y) < e.r + s.r) {
            hurtEnt(e, s.dmg, s.x, s.y);
            G.shots.splice(i, 1);
            break;
          }
        }
      } else if (playing() && G.deadT <= 0) {
        if (hypot(s.x - px, s.y - py) < PLAYER_R + s.r) {
          G.shots.splice(i, 1);
          hitPlayer('被击中了');
        }
      }
    }
    if (!playing() || G.deadT > 0 || G.invuln > 0) return;
    for (j = 0; j < G.ents.length; j++) {
      const e = G.ents[j];
      if (e.dead) continue;
      if (hypot(e.x - px, e.y - py) < e.r + PLAYER_R - 2) {
        hitPlayer(e.kind === 'rider' || (e.kind === 'boss' && e.name === '匪骑') ? '马队冲散了' : '撞上了');
        break;
      }
    }
    for (j = G.pickups.length - 1; j >= 0; j--) {
      const p = G.pickups[j];
      if (p.taken) continue;
      if (hypot(p.x - px, p.y - py) < 22) grabPickup(p);
    }
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
    G.comboT -= dt;
    if (G.comboT <= 0 && G.combo > 0) {
      G.combo = 0;
      G.mult = 1;
    }
    let i;
    for (i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.vy -= (q.g || 0) * dt;
      q.life -= dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.36) rings.splice(i, 1);
    }
    for (i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (i = G.pickups.length - 1; i >= 0; i--) {
      const p = G.pickups[i];
      p.t += dt;
      if (p.taken || p.y < G.camY - 30) G.pickups.splice(i, 1);
    }
  }

  function pruneEnts() {
    let i;
    for (i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.dead || e.y < G.camY - 50 || e.x < -80 || e.x > VW + 80) {
        if (e.kind === 'boss' && !e.dead) continue;
        G.ents.splice(i, 1);
      }
    }
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    if (G.mode === 'title') updateDemo();
    updatePlayer(dt);
    const mul = spdMul(isWild(), isWild() ? G.wave : G.stage);
    let scroll = SCROLL_BASE * mul;
    if (G.boss && G.boss.active && !G.boss.dead) scroll *= 0.22;
    if (G.ready > 0) {
      G.ready -= dt;
      scroll *= 0.4;
    }
    G.camY += scroll * dt;
    spawnDue();
    if (G.boss && !G.boss.spawned && !G.boss.dead && G.camY >= G.levelLen - 90) {
      G.boss.spawned = true;
      G.boss.y = G.camY + VH + 50;
      G.ents.push(G.boss);
    }
    let i;
    for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt);
    if ((fireHeld() && (canControl() || G.mode === 'title'))) fire();
    updateShots(dt);
    collide();
    pruneEnts();
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
      playSim(dt);
      if (G.camY > 1600) loadStage(1, true);
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      G.camY += SCROLL_BASE * spdMul(isWild(), isWild() ? G.wave : G.stage) * 0.35 * dt;
      let i;
      for (i = 0; i < G.ents.length; i++) updateEnt(G.ents[i], dt * 0.6);
      updateShots(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun(G.why || '被击中了');
          updateFx(dt);
          return;
        }
        G.player.x = VW * 0.5;
        G.player.yOff = YOFF_DEF;
        G.invuln = INVULN;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) nextLeg();
    } else if (G.boss && G.boss.dead && !G.boss.resolved && playing()) {
      G.boss.resolved = true;
      afterBoss();
    }

    updateFx(dt);
    syncHud();
  }

  function disc(x, y, r, rgb, a) {
    ctx.fillStyle = rgba(rgb, a == null ? 1 : a);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), r * scale, 0, TAU);
    ctx.fill();
  }
  function oval(x, y, rx, ry, rgb, a) {
    ctx.fillStyle = rgba(rgb, a == null ? 1 : a);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y), rx * scale, ry * scale, 0, 0, TAU);
    ctx.fill();
  }
  function rectC(x, y, w, h, rgb, a) {
    ctx.fillStyle = rgba(rgb, a == null ? 1 : a);
    ctx.fillRect(sx(x - w * 0.5), sy(y + h * 0.5), w * scale, h * scale);
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(G.camY + VH), sx(0), sy(G.camY));
    if (G.theme === 'canyon') {
      g.addColorStop(0, '#2a1008');
      g.addColorStop(0.45, '#1a0a06');
      g.addColorStop(1, '#120604');
    } else if (G.theme === 'town') {
      g.addColorStop(0, '#24140c');
      g.addColorStop(0.5, '#160a06');
      g.addColorStop(1, '#0e0604');
    } else {
      g.addColorStop(0, '#3a1c0a');
      g.addColorStop(0.4, '#1c0c06');
      g.addColorStop(1, '#120804');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(G.camY + VH), VW * scale, VH * scale);

    const sun = ctx.createRadialGradient(sx(400), sy(G.camY + VH - 40), 8 * scale, sx(400), sy(G.camY + VH - 40), 220 * scale);
    sun.addColorStop(0, 'rgba(255, 178, 74, 0.28)');
    sun.addColorStop(0.5, 'rgba(255, 122, 26, 0.08)');
    sun.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(sx(0), sy(G.camY + VH), VW * scale, VH * scale);

    const roadW = G.theme === 'canyon' ? 300 : 340;
    ctx.fillStyle = 'rgba(90, 52, 24, 0.45)';
    ctx.fillRect(sx((VW - roadW) * 0.5), sy(G.camY + VH), roadW * scale, VH * scale);
    ctx.fillStyle = 'rgba(255, 178, 74, 0.08)';
    const dashY0 = G.camY - (G.camY % 36);
    let dy;
    for (dy = dashY0; dy < G.camY + VH + 40; dy += 36) {
      ctx.fillRect(sx(VW * 0.5 - 2), sy(dy + 16), 4 * scale, 16 * scale);
    }

    if (G.theme === 'canyon') {
      ctx.fillStyle = '#4a1c10';
      ctx.fillRect(sx(0), sy(G.camY + VH), 42 * scale, VH * scale);
      ctx.fillRect(sx(VW - 42), sy(G.camY + VH), 42 * scale, VH * scale);
      ctx.fillStyle = '#2a0e08';
      ctx.fillRect(sx(0), sy(G.camY + VH), 22 * scale, VH * scale);
      ctx.fillRect(sx(VW - 22), sy(G.camY + VH), 22 * scale, VH * scale);
    }

    const row = 56;
    const y0 = Math.floor((G.camY - 40) / row) * row;
    let gy;
    for (gy = y0; gy < G.camY + VH + 80; gy += row) {
      const h = hash2((gy | 0) * 3 + (G.theme === 'town' ? 9 : 1));
      const h2 = hash2((gy | 0) * 7 + 13);
      const side = h > 0.5 ? 1 : 0;
      const x = side ? lerp(VW - 90, VW - 28, h2) : lerp(28, 90, h2);
      if (G.theme === 'town' && h > 0.62) {
        const bw = 22 + h2 * 18;
        const bh = 28 + h * 24;
        rectC(x, gy, bw, bh, [48, 24, 14], 0.9);
        rectC(x, gy + bh * 0.2, bw + 4, 6, [90, 40, 18], 0.9);
        disc(x - 4, gy + 6, 2, GOLD, 0.35);
      } else if (h > 0.38) {
        oval(x, gy, 5 + h2 * 4, 3, [48, 32, 18], 0.9);
        if (h > 0.7) {
          rectC(x, gy + 10, 3, 16, DBR, 1);
          disc(x, gy + 22, 7 + h2 * 3, [32, 90, 36], 0.85);
          disc(x - 6, gy + 16, 4, [28, 80, 32], 0.8);
        }
      } else if (h2 > 0.82) {
        rectC(x, gy, 10, 3, [70, 70, 70], 0.7);
        rectC(x + 8, gy + 2, 6, 2, [90, 90, 90], 0.5);
      }
    }
  }

  function drawHorse(x, y, hat, shirt, face, big) {
    const g = Math.sin(G.t * 18);
    const s = big ? 1.25 : 1;
    oval(x, y - 10 * s, 11 * s, 4 * s, [20, 10, 6], 0.35);
    const leg = g * 5 * s;
    rectC(x - 6 * s, y - 8 * s + leg, 2.2 * s, 9 * s, DBR, 1);
    rectC(x + 6 * s, y - 8 * s - leg, 2.2 * s, 9 * s, DBR, 1);
    rectC(x - 2 * s, y - 8 * s - leg * 0.6, 2.2 * s, 9 * s, [90, 52, 24], 1);
    rectC(x + 3 * s, y - 8 * s + leg * 0.6, 2.2 * s, 9 * s, [90, 52, 24], 1);
    oval(x, y + 2 * s, 13 * s, 7 * s, BRN, 1);
    oval(x + face * 12 * s, y + 6 * s, 6 * s, 4.2 * s, [120, 70, 32], 1);
    disc(x + face * 16 * s, y + 7 * s, 1.4 * s, [20, 10, 6], 1);
    oval(x - face * 10 * s, y + 6 * s, 3 * s, 4 * s, DBR, 1);
    disc(x, y + 14 * s, 4.2 * s, SKIN, 1);
    rectC(x, y + 10 * s, 8 * s, 7 * s, shirt, 1);
    rectC(x + face * 7 * s, y + 12 * s, 10 * s, 1.6 * s, GUNM, 1);
    oval(x, y + 18 * s, 6.4 * s, 2.2 * s, hat, 1);
    rectC(x, y + 20 * s, 7.2 * s, 3.2 * s, hat, 1);
  }

  function drawAim() {
    if (G.deadT > 0) return;
    const dirs = aimSet();
    const x = G.player.x;
    const y = pWorldY() + 20;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let i;
    for (i = 0; i < dirs.length; i++) {
      const d = AIM[dirs[i]];
      ctx.strokeStyle = rgba(dirs.length >= 3 ? HOT : GOLD, 0.55);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x + d.dx * 16), sy(y + d.dy * 10));
      ctx.lineTo(sx(x + d.dx * 34), sy(y + d.dy * 26));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0;
    if (blink) return;
    const x = G.player.x;
    const y = pWorldY();
    drawHorse(x, y, HOT, HOT, G.player.face, false);
    drawAim();
    if (G.muzzle > 0) {
      const d = AIM[currentAim()];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      disc(x + d.dx * 18, y + 14 + d.dy * 8, 6, WHT, G.muzzle * 10);
      disc(x + d.dx * 22, y + 16 + d.dy * 10, 3, GOLD, G.muzzle * 8);
      ctx.restore();
    }
  }

  function drawEnt(e) {
    if (e.dead) return;
    if (!onCam(e.x, e.y, 30)) return;
    const flash = e.hitN > 0;
    const x = e.x;
    const y = e.y;
    if (e.kind === 'bandit' || e.kind === 'ambush' || e.kind === 'sniper') {
      oval(x, y - 8, 6, 3, [20, 10, 6], 0.3);
      rectC(x, y + 2, 8, 12, flash ? WHT : (e.kind === 'sniper' ? [40, 50, 70] : [70, 24, 24]), 1);
      disc(x, y + 12, 3.4, SKIN, 1);
      oval(x, y + 15, 5.5, 1.6, e.kind === 'ambush' ? LEAF : DBR, 1);
      rectC(x + e.face * 6, y + 6, 8, 1.4, GUNM, 1);
    } else if (e.kind === 'rider') {
      drawHorse(x, y, flash ? WHT : MAG, [160, 40, 40], e.face, false);
    } else if (e.kind === 'wagon') {
      oval(x - 14, y - 8, 5, 5, [30, 18, 10], 1);
      oval(x + 14, y - 8, 5, 5, [30, 18, 10], 1);
      oval(x - 14, y - 8, 2.2, 2.2, GOLD, 0.5);
      oval(x + 14, y - 8, 2.2, 2.2, GOLD, 0.5);
      rectC(x, y + 6, 36, 16, flash ? HOT2 : [110, 58, 28], 1);
      ctx.fillStyle = rgba(flash ? GOLD : [140, 72, 32], 1);
      ctx.beginPath();
      ctx.moveTo(sx(x - 18), sy(y + 14));
      ctx.lineTo(sx(x), sy(y + 26));
      ctx.lineTo(sx(x + 18), sy(y + 14));
      ctx.closePath();
      ctx.fill();
      rectC(x, y + 4, 30, 4, DBR, 1);
    } else if (e.kind === 'boss') {
      if (e.name === '篷车') {
        oval(x - 20, y - 10, 7, 7, [30, 16, 8], 1);
        oval(x + 20, y - 10, 7, 7, [30, 16, 8], 1);
        rectC(x, y + 8, 52, 22, flash ? WHT : [120, 50, 22], 1);
        ctx.fillStyle = rgba(HOT, 0.9);
        ctx.beginPath();
        ctx.moveTo(sx(x - 26), sy(y + 18));
        ctx.lineTo(sx(x), sy(y + 36));
        ctx.lineTo(sx(x + 26), sy(y + 18));
        ctx.closePath();
        ctx.fill();
        rectC(x, y + 2, 16, 8, [40, 40, 48], 1);
      } else {
        drawHorse(x, y, flash ? WHT : GOLD, e.name === '通缉' ? HOT : MAG, e.face, true);
        if (e.name === '通缉') {
          oval(x, y + 8, 10, 6, [160, 40, 20], 0.7);
        }
      }
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let i;
    for (i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const len = s.from === 'p' ? 13 : 8;
      const ang = Math.atan2(-s.vy, s.vx);
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(ang);
      if (!REDUCE && s.from === 'p') {
        ctx.fillStyle = rgba(HOT, 0.3);
        ctx.fillRect(0, -2.2 * scale, len * scale, 4.4 * scale);
      }
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.fillRect(0, -1.6 * scale, len * 0.75 * scale, 3.2 * scale);
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(len * 0.45 * scale, -1.1 * scale, 6 * scale, 2.2 * scale);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPickups() {
    let i;
    for (i = 0; i < G.pickups.length; i++) {
      const p = G.pickups[i];
      if (p.taken) continue;
      const bob = Math.sin(G.t * 6 + p.t) * 4;
      const rgb = p.kind === 'wing' ? GOLD : CYN;
      disc(p.x, p.y + bob, 10, rgb, 0.2);
      disc(p.x, p.y + bob, 7, rgb, 0.85);
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.font = 'bold ' + (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.kind === 'wing' ? '角' : '靴', sx(p.x), sy(p.y + bob));
    }
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    let i;
    for (i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / Math.max(0.05, q.max * 0.7), 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (6 + s.t * 40) * scale, 0, TAU);
      ctx.stroke();
    }
    for (i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.36;
      ctx.strokeStyle = rgba(r.rgb, a * 0.8);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (8 + r.t * 90) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
    ctx.fillRect(sx(0), sy(G.camY + VH), VW * scale, VH * scale);
  }

  function drawLetterbox() {
    ctx.fillStyle = '#140804';
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
    ctx.fillStyle = '#140804';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      const m = G.shake;
      ctx.translate((Math.random() - 0.5) * m, (Math.random() - 0.5) * m);
    }
    drawBg();
    let i;
    for (i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawPickups();
    drawShots();
    drawPlayer();
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
      startGame('clear');
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
      if (k === '1') startGame('clear');
      if (k === '2') startGame('wild');
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

  if (btnClear) {
    btnClear.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('clear');
    });
  }
  if (btnWild) {
    btnWild.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('wild');
    });
  }
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'clear');
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win') startGame('wild');
      else goTitle();
    });
  }
  if (modeClear) {
    modeClear.addEventListener('click', function () {
      audio.ensure();
      startGame('clear');
    });
  }
  if (modeWild) {
    modeWild.addEventListener('click', function () {
      audio.ensure();
      startGame('wild');
    });
  }
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnRetry) {
    btnRetry.addEventListener('click', function () {
      restart();
    });
  }

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.fire = false;
    pointer.down = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) last = 0;
  });
  if (canvas) {
    canvas.addEventListener('touchstart', function (e) { e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  }

  requestAnimationFrame(frame);
})();
