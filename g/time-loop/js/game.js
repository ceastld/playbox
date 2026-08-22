'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const CX = VW * 0.5;
  const CY = VH * 0.5;
  const LIVES = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.38;
  const SHOT_V = 460;
  const PLAYER_R = 9;
  const BEST_KEY = 'playbox-time-loop-best';
  const MUTE_KEY = 'playbox-time-loop-mute';
  const OPS = '← → / A D 转向 · 空格开火 · 点按瞄准 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const PUR = [155, 92, 255];
  const HOT = [196, 107, 255];
  const WHT = [246, 243, 255];
  const MINT = [92, 255, 196];
  const ORG = [255, 168, 74];
  const PNK = [255, 154, 212];

  const TYPES = ['biplane', 'jet', 'copter', 'ufo'];
  const TYPE_RGB = { biplane: GOLD, jet: MAG, copter: MINT, ufo: PUR };
  const TYPE_SCORE = { biplane: 60, jet: 80, copter: 100, ufo: 160 };
  const TYPE_R = { biplane: 13, jet: 12, copter: 14, ufo: 15 };
  const TYPE_SPD = { biplane: 74, jet: 118, copter: 82, ufo: 102 };
  const BOSS_SCORE = [900, 1100, 1300, 1800];
  const BOSS_HP = [12, 15, 18, 22];
  const BOSS_KIND = ['blimp', 'bomber', 'gunship', 'mothership'];
  const BOSS_NAME = ['飞艇', '重轰', '武装旋翼', '母舰'];
  const BOSS_R = [40, 36, 34, 44];
  const ERA_YEAR = ['1910', '1940', '1970', '2001'];
  const ERA_NAME = ['双翼', '喷气', '旋翼', '飞碟'];
  const ERA_SKY = ['#140c18', '#0c1020', '#081612', '#07051c'];
  const ERA_SKY2 = ['#0a0712', '#070814', '#05100c', '#050314'];
  const ERA_QUOTA = [16, 18, 20, 22];
  const ERA_PSPD = [172, 182, 190, 200];
  const ERA_TURN = [3.2, 3.35, 3.5, 3.65];
  const ERA_CLOUD = [
    [186, 168, 214],
    [110, 128, 176],
    [86, 160, 132],
    [140, 108, 210]
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnEra = document.getElementById('btn-era');
  const btnChaos = document.getElementById('btn-chaos');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const quotaWrap = document.getElementById('quota-wrap');
  const quotaEm = document.getElementById('quota-em');
  const quotaBar = document.getElementById('quota-bar');

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
  let sidSeq = 1;

  const keys = { l: false, r: false };
  const pointer = { down: false, hover: false, x: CX, y: CY, id: null, type: '' };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const clouds = [];

  const G = {
    mode: 'title',
    kind: 'era',
    t: 0,
    clock: 0,
    era: 0,
    loop: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    kills: 0,
    quota: 16,
    ang: -Math.PI * 0.5,
    pspd: 172,
    turn: 3.2,
    enemies: [],
    shots: [],
    eshots: [],
    boss: null,
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    ready: 0,
    spawnT: 0.4,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    toastT: 0,
    warpT: 0,
    warpFlash: 0,
    muzzle: 0,
    why: '',
    engineT: 0
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
  function pick(arr) {
    return arr[(Math.random() * arr.length) | 0];
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
  function wrap(v, m) {
    v %= m;
    if (v < 0) v += m;
    return v;
  }
  function wrapD(d, m) {
    const h = m * 0.5;
    d %= m;
    if (d > h) d -= m;
    if (d < -h) d += m;
    return d;
  }
  function angNorm(a) {
    a %= TAU;
    if (a > Math.PI) a -= TAU;
    if (a < -Math.PI) a += TAU;
    return a;
  }
  function turnToward(cur, want, max) {
    let d = angNorm(want - cur);
    if (d > max) d = max;
    else if (d < -max) d = -max;
    return cur + d;
  }
  function isChaos() {
    return G.kind === 'chaos';
  }
  function speedMul() {
    return 1 + G.loop * 0.16 + (isChaos() ? 0.2 : 0);
  }
  function playerVel() {
    if (G.deadT > 0 || G.warpT > 0) return { x: 0, y: 0 };
    return { x: Math.cos(G.ang) * G.pspd, y: Math.sin(G.ang) * G.pspd };
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
      this.beep(880, 0.055, 'square', 0.034, 1640);
      this.beep(420, 0.04, 'triangle', 0.018, 180);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.04);
      this.noise(0.04, 0.038, 1100);
      this.beep(640 * lift, 0.07, 'square', 0.048, 980 * lift);
    },
    boom() {
      this.ensure();
      this.noise(0.14, 0.055, 380);
      this.beep(280, 0.16, 'sawtooth', 0.045, 70);
    },
    squad() {
      this.ensure();
      this.beep(523, 0.08, 'sine', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.035, 1175);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.06, 320);
      this.beep(340, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.3, 'sine', 0.045, 46);
    },
    boss() {
      this.ensure();
      this.beep(110, 0.22, 'sawtooth', 0.05, 70);
      this.beep(220, 0.28, 'square', 0.04, 140);
      this.noise(0.12, 0.04, 200);
    },
    warp() {
      this.ensure();
      this.beep(196, 0.12, 'sine', 0.05, 392);
      this.beep(392, 0.14, 'triangle', 0.045, 784);
      this.beep(784, 0.22, 'sine', 0.05, 1568);
      this.noise(0.18, 0.04, 700);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.32, 'sine', 0.05, 48);
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
    while (pips.length < LIVES) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function syncQuota() {
    if (!quotaBar) return;
    if (G.mode === 'title') {
      if (quotaEm) quotaEm.textContent = '击坠';
      quotaBar.style.transform = 'scaleX(0)';
      if (quotaWrap) {
        quotaWrap.classList.remove('hot', 'boss');
      }
      return;
    }
    if (G.boss) {
      if (quotaEm) quotaEm.textContent = '旗舰';
      const t = clamp(G.boss.hp / Math.max(1, G.boss.max), 0, 1);
      quotaBar.style.transform = 'scaleX(' + t + ')';
      if (quotaWrap) {
        quotaWrap.classList.add('boss');
        quotaWrap.classList.remove('hot');
      }
      return;
    }
    if (quotaEm) quotaEm.textContent = '击坠';
    const t = G.quota ? clamp(G.kills / G.quota, 0, 1) : 0;
    quotaBar.style.transform = 'scaleX(' + t + ')';
    if (quotaWrap) {
      quotaWrap.classList.toggle('hot', t >= 0.72);
      quotaWrap.classList.remove('boss');
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '时航';
      else if (isChaos()) stageLabel.textContent = '乱世';
      else stageLabel.textContent = ERA_YEAR[G.era];
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.boss || G.loop > 0));
    }
    if (tagLabel) {
      if (G.mode === 'title') tagLabel.textContent = 'PILOT';
      else if (isChaos()) tagLabel.textContent = G.loop > 0 ? '乱世 ×' + (G.loop + 1) : '乱世';
      else tagLabel.textContent = G.loop > 0 ? '编年 ×' + (G.loop + 1) : '编年';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣命', 'warn');
    else if (G.boss) setHint('旗舰现身 · 打掉即可跃迁', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 别撞别中弹', 'warn');
    else setHint('← → 转向 · 空格开火 · 天幕环绕 · R 重开', '');
    syncPips();
    syncQuota();
  }

  function showOverlay(kind, title, lead, primary, showChaos) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'PILOT';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnEra.textContent = primary;
    btnChaos.classList.toggle('hidden', !showChaos);
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
    const cls = mag >= 5.5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('warp');
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
    capArr(particles, 280);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 36);
  }

  function popRing(x, y, rgb, rad) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 22 });
    capArr(rings, 24);
  }

  function floatText(txt, x, y, rgb) {
    floats.push({
      txt: txt,
      x: x,
      y: y,
      vy: -42,
      t: 0,
      life: 0.72,
      rgb: rgb || GOLD
    });
    capArr(floats, 18);
  }

  function explode(x, y, rgb, big) {
    const n = big ? 28 : 16;
    emit(n, {
      x: x, y: y, j: big ? 10 : 6,
      vx0: -220, vx1: 220, vy0: -240, vy1: 180,
      life: big ? 0.55 : 0.38,
      r0: 1.2, r1: big ? 4.2 : 2.8,
      rgb: rgb, g: 40
    });
    emit(big ? 10 : 6, {
      x: x, y: y, j: 4,
      vx0: -80, vx1: 80, vy0: -90, vy1: 40,
      life: 0.22, r0: 0.6, r1: 1.6, rgb: WHT, g: 20
    });
    popSpark(x, y, rgb, big ? 28 : 16);
    popRing(x, y, rgb, big ? 36 : 20);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      const roll = Math.random();
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        r: roll > 0.86 ? rand(1.2, 2.1) : rand(0.5, 1.1),
        a: rand(0.25, 0.9),
        p: rand(0, TAU),
        par: rand(0.12, 0.38),
        rgb: roll > 0.7 ? (roll > 0.88 ? CYN : PUR) : WHT
      });
    }
  }

  function seedClouds() {
    clouds.length = 0;
    const rgb = ERA_CLOUD[G.era] || ERA_CLOUD[0];
    const n = 11;
    for (let i = 0; i < n; i++) {
      clouds.push({
        x: rand(0, VW),
        y: rand(0, VH),
        w: rand(34, 88),
        h: rand(12, 26),
        par: rand(0.28, 0.72),
        a: rand(0.07, 0.18),
        rgb: rgb
      });
    }
  }

  function applyEraStats() {
    const mul = speedMul();
    if (isChaos()) {
      G.pspd = 210 * (1 + G.loop * 0.1);
      G.turn = 3.9;
      G.quota = 20 + G.loop * 4;
    } else {
      G.pspd = ERA_PSPD[G.era] * mul;
      G.turn = ERA_TURN[G.era];
      G.quota = ERA_QUOTA[G.era] + G.loop * 3;
    }
  }

  function spawnCap() {
    const base = isChaos() ? 8 : 5 + Math.min(3, G.era);
    return base + Math.min(2, G.loop);
  }

  function spawnInterval() {
    const t = isChaos() ? 0.62 : 1.05 - G.era * 0.12;
    return Math.max(0.38, t / (1 + G.loop * 0.12));
  }

  function pickType() {
    if (isChaos()) {
      const w = [1, 1.1, 1.1, 1.25 + G.loop * 0.15];
      let s = Math.random() * (w[0] + w[1] + w[2] + w[3]);
      for (let i = 0; i < 4; i++) {
        s -= w[i];
        if (s <= 0) return TYPES[i];
      }
      return 'ufo';
    }
    return TYPES[G.era];
  }

  function spawnAlongHeading(ang) {
    const back = ang + Math.PI;
    const dist = Math.max(VW, VH) * 0.56;
    return {
      x: wrap(CX + Math.cos(back) * dist + rand(-40, 40), VW),
      y: wrap(CY + Math.sin(back) * dist + rand(-40, 40), VH),
      ang: ang
    };
  }

  function makeEnemy(type, x, y, ang, sid) {
    const mul = speedMul();
    const spdJit = rand(0.88, 1.12);
    return {
      type: type,
      x: x,
      y: y,
      ang: ang,
      spd: TYPE_SPD[type] * mul * spdJit,
      hp: 1,
      r: TYPE_R[type],
      rgb: TYPE_RGB[type],
      score: TYPE_SCORE[type],
      fireCd: rand(0.45, 1.8),
      t: rand(0, 8),
      turnT: rand(0.4, 1.6),
      flash: 0,
      sid: sid
    };
  }

  function spawnSquad(type) {
    type = type || pickType();
    const n = type === 'biplane' || type === 'jet'
      ? (3 + (Math.random() < 0.35 ? 1 : 0))
      : (2 + (Math.random() < 0.4 ? 1 : 0));
    const ang = rand(0, TAU);
    const base = spawnAlongHeading(ang);
    const sid = sidSeq++;
    const spread = type === 'ufo' ? 36 : 26;
    const px = Math.cos(ang + Math.PI * 0.5);
    const py = Math.sin(ang + Math.PI * 0.5);
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) * 0.5;
      G.enemies.push(makeEnemy(
        type,
        wrap(base.x + px * k * spread, VW),
        wrap(base.y + py * k * spread, VH),
        ang + rand(-0.08, 0.08),
        sid
      ));
    }
  }

  function spawnBoss() {
    const era = isChaos() ? (G.loop % 4) : G.era;
    const kind = BOSS_KIND[era];
    const mul = speedMul();
    const hp = Math.round((isChaos() ? 18 + G.loop * 4 : BOSS_HP[era]) * (1 + G.loop * 0.08));
    const pos = spawnAlongHeading(rand(0, TAU));
    G.boss = {
      kind: kind,
      era: era,
      x: pos.x,
      y: pos.y,
      ang: pos.ang,
      spd: (kind === 'gunship' ? 70 : 58) * mul,
      hp: hp,
      max: hp,
      r: BOSS_R[era],
      rgb: isChaos() ? HOT : TYPE_RGB[TYPES[era]],
      t: 0,
      fireCd: 0.8,
      flash: 0,
      phase: 0
    };
    audio.boss();
    screenFlash(G.boss.rgb, 0.42);
    kick(4.2);
    toast(BOSS_NAME[era] + ' 出现', false, true);
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.warpT = 0;
    G.warpFlash = 0;
  }

  function resetField() {
    G.enemies = [];
    G.shots = [];
    G.eshots = [];
    G.boss = null;
    G.kills = 0;
    G.ang = -Math.PI * 0.5;
    G.deadT = 0;
    G.invuln = 0;
    G.fireCd = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.spawnT = 0.35;
    G.ready = 0.42;
    applyEraStats();
    seedClouds();
    resetFx();
  }

  function startGame(kind) {
    G.kind = kind === 'chaos' ? 'chaos' : 'era';
    G.mode = 'play';
    G.era = 0;
    G.loop = 0;
    G.lives = LIVES;
    G.score = 0;
    G.why = '';
    G.fireHold = false;
    resetField();
    spawnSquad(pickType());
    spawnSquad(pickType());
    hideOverlay();
    audio.start();
    toast(isChaos() ? '乱世 · 混战加速' : '1910 · 双翼', false, !isChaos());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'era';
    G.era = 0;
    G.loop = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    resetField();
    spawnSquad('biplane');
    spawnSquad('jet');
    showOverlay('title', '时航', '机头永远向前。转向开火，打掉编队再击坠旗舰，跃迁下一纪元。', '编年', true);
    btnChaos.textContent = '乱世';
    btnChaos.classList.remove('hidden');
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.why = why;
    G.fireHold = false;
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    const lead = (why || '坠机了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '坠机了', lead, '再来', true);
    btnChaos.textContent = '换模式';
    syncHud();
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
      }
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
  }

  function squadLeft(sid) {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].sid === sid) n += 1;
    }
    return n;
  }

  function onEnemyKill(e, idx) {
    bumpCombo();
    const n = e.score * G.mult;
    addScore(n);
    floatText('+' + n, e.x, e.y, e.rgb);
    explode(e.x, e.y, e.rgb, false);
    hitStop(G.combo >= 8 ? 0.055 : 0.038);
    kick(G.combo >= 8 ? 3.4 : 2.1);
    audio.hit(G.combo);
    G.kills += 1;
    if (idx >= 0) G.enemies.splice(idx, 1);
    if (e.sid && squadLeft(e.sid) === 0 && G.mode === 'play') {
      const bonus = 150 * G.mult;
      addScore(bonus);
      floatText('编队 +' + bonus, e.x, e.y - 16, GOLD);
      toast('编队清空', false, true);
      audio.squad();
      popRing(e.x, e.y, GOLD, 42);
    }
    if (G.combo === 8 || G.combo === 15 || G.combo === 24) {
      toast('连斩 ×' + G.mult, false, true);
    }
  }

  function onBossKill() {
    const b = G.boss;
    if (!b) return;
    bumpCombo();
    const base = isChaos() ? 1400 + G.loop * 200 : BOSS_SCORE[b.era];
    const n = base * G.mult;
    addScore(n);
    floatText('+' + n, b.x, b.y, GOLD);
    explode(b.x, b.y, b.rgb, true);
    explode(b.x + 18, b.y - 10, WHT, false);
    audio.boom();
    audio.warp();
    hitStop(0.08);
    kick(6.4);
    screenFlash(CYN, 0.85);
    G.boss = null;
    startWarp();
  }

  function startWarp() {
    G.warpT = 1.12;
    G.warpFlash = 1;
    G.fireHold = false;
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('warp');
      void stageEl.offsetWidth;
      stageEl.classList.add('warp');
    }
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      explode(e.x, e.y, e.rgb, false);
    }
    G.enemies = [];
    G.eshots = [];
    toast('跃迁', false, true);
  }

  function nextEra() {
    let looped = false;
    if (isChaos()) {
      G.loop += 1;
      G.era = G.loop % 4;
    } else {
      G.era += 1;
      if (G.era > 3) {
        G.era = 0;
        G.loop += 1;
        looped = true;
      }
    }
    G.kills = 0;
    G.boss = null;
    G.shots = [];
    G.eshots = [];
    G.enemies = [];
    G.invuln = 0.85;
    G.ready = 0.35;
    G.spawnT = 0.28;
    applyEraStats();
    seedClouds();
    spawnSquad(pickType());
    G.warpT = 0;
    G.warpFlash = 0.4;
    const label = isChaos()
      ? ('乱世 ×' + (G.loop + 1))
      : (looped
        ? ('闭环 · ' + ERA_YEAR[G.era])
        : (ERA_YEAR[G.era] + ' · ' + ERA_NAME[G.era]));
    toast(label, false, true);
    syncHud();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.warpT > 0 || G.ready > 0) return;
    if (G.fireCd > 0) return;
    const max = isChaos() ? 3 : 2;
    if (G.shots.length >= max) return;
    G.fireCd = isChaos() ? 0.1 : 0.128;
    const ang = G.ang;
    const nose = 14;
    const x = CX + Math.cos(ang) * nose;
    const y = CY + Math.sin(ang) * nose;
    G.shots.push({
      x: x,
      y: y,
      vx: Math.cos(ang) * SHOT_V,
      vy: Math.sin(ang) * SHOT_V,
      life: 0.7,
      trail: []
    });
    audio.shoot();
    G.muzzle = 1;
    if (!REDUCE) {
      emit(5, {
        x: x, y: y, j: 2,
        vx0: Math.cos(ang) * 80, vx1: Math.cos(ang) * 220,
        vy0: Math.sin(ang) * 80, vy1: Math.sin(ang) * 220,
        life: 0.14, r0: 0.8, r1: 1.8, rgb: CYN, g: 0
      });
    }
    G.punch = Math.max(G.punch, 1.012);
  }

  function enemyFire(e, aimed, spread) {
    if (G.eshots.length > 22) return;
    const dx = wrapD(CX - e.x, VW);
    const dy = wrapD(CY - e.y, VH);
    let ang = aimed ? Math.atan2(dy, dx) : e.ang;
    const n = spread || 1;
    const spd = (e.type === 'ufo' ? 168 : e.type === 'jet' ? 190 : 150) * (0.92 + speedMul() * 0.08);
    const gap = n > 1 ? 0.22 : 0;
    for (let i = 0; i < n; i++) {
      const a = ang + (i - (n - 1) * 0.5) * gap;
      G.eshots.push({
        x: e.x,
        y: e.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 1.35,
        r: 3.2,
        rgb: e.rgb,
        trail: []
      });
    }
  }

  function bossFire(b) {
    if (G.eshots.length > 26) return;
    const dx = wrapD(CX - b.x, VW);
    const dy = wrapD(CY - b.y, VH);
    const aim = Math.atan2(dy, dx);
    const chaos = isChaos();
    if (b.kind === 'blimp') {
      G.eshots.push({
        x: b.x, y: b.y + 16,
        vx: rand(-30, 30), vy: 130 + G.loop * 12,
        life: 1.8, r: 4.2, rgb: ORG, trail: []
      });
      if (chaos) enemyLikeShot(b.x, b.y, aim, 170, MAG);
    } else if (b.kind === 'bomber') {
      for (let i = -1; i <= 1; i++) {
        const a = b.ang + i * 0.18;
        G.eshots.push({
          x: b.x, y: b.y,
          vx: Math.cos(a) * 200, vy: Math.sin(a) * 200,
          life: 1.25, r: 3.4, rgb: MAG, trail: []
        });
      }
    } else if (b.kind === 'gunship') {
      for (let i = 0; i < 3; i++) {
        const a = aim + (i - 1) * 0.14;
        G.eshots.push({
          x: b.x, y: b.y,
          vx: Math.cos(a) * 188, vy: Math.sin(a) * 188,
          life: 1.2, r: 3.3, rgb: MINT, trail: []
        });
      }
    } else {
      const rays = chaos ? 8 : 6;
      for (let i = 0; i < rays; i++) {
        const a = b.t * 0.7 + i * (TAU / rays);
        G.eshots.push({
          x: b.x, y: b.y,
          vx: Math.cos(a) * 160, vy: Math.sin(a) * 160,
          life: 1.4, r: 3.6, rgb: PUR, trail: []
        });
      }
    }
  }

  function enemyLikeShot(x, y, ang, spd, rgb) {
    G.eshots.push({
      x: x, y: y,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: 1.2, r: 3.2, rgb: rgb, trail: []
    });
  }

  function hurt() {
    if (G.mode !== 'play' || G.invuln > 0 || G.deadT > 0 || G.warpT > 0) return;
    G.lives -= 1;
    G.deadT = 0.9;
    G.fireHold = false;
    breakCombo();
    explode(CX, CY, CYN, true);
    audio.death();
    kick(7);
    hitStop(0.075);
    screenFlash(MAG, 0.5);
    G.eshots = [];
    syncPips();
  }

  function hitWrap(x, y, x2, y2, r) {
    const dx = wrapD(x - x2, VW);
    const dy = wrapD(y - y2, VH);
    return dx * dx + dy * dy <= r * r;
  }

  function updatePlayer(dt) {
    if (G.deadT > 0 || G.warpT > 0) return;
    if (keys.l || keys.r) {
      if (keys.l) G.ang -= G.turn * dt;
      if (keys.r) G.ang += G.turn * dt;
      inputSrc = 'key';
    } else if ((pointer.down || (pointer.hover && pointer.type === 'mouse')) && inputSrc === 'ptr') {
      const dx = pointer.x - CX;
      const dy = pointer.y - CY;
      if (dx * dx + dy * dy > 64) {
        G.ang = turnToward(G.ang, Math.atan2(dy, dx), G.turn * 1.15 * dt);
      }
    }
    G.ang = angNorm(G.ang);
  }

  function updateEnemies(dt, pvx, pvy) {
    const fireMul = (isChaos() ? 0.72 : 1) / (1 + G.loop * 0.08);
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      e.t += dt;
      e.flash = Math.max(0, e.flash - dt * 8);
      if (e.type === 'biplane') {
        e.ang += Math.sin(e.t * 1.35 + e.sid) * 0.62 * dt;
      } else if (e.type === 'jet') {
        e.turnT -= dt;
        if (e.turnT <= 0) {
          e.ang += (Math.random() < 0.5 ? -1 : 1) * rand(0.45, 0.95);
          e.turnT = rand(0.7, 2.1);
        }
      } else if (e.type === 'copter') {
        const dx = wrapD(CX - e.x, VW);
        const dy = wrapD(CY - e.y, VH);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const want = dist < 96 ? Math.atan2(dy, dx) + Math.PI * 0.5 : Math.atan2(dy, dx);
        e.ang = turnToward(e.ang, want, 2.15 * dt);
      } else {
        e.ang += Math.sin(e.t * 3.1) * 2.4 * dt;
        e.turnT -= dt;
        if (e.turnT <= 0) {
          e.ang += rand(-0.8, 0.8);
          e.turnT = rand(0.5, 1.4);
        }
      }
      e.x = wrap(e.x + (Math.cos(e.ang) * e.spd - pvx) * dt, VW);
      e.y = wrap(e.y + (Math.sin(e.ang) * e.spd - pvy) * dt, VH);

      if (G.mode === 'play' && G.deadT <= 0 && G.warpT <= 0 && G.ready <= 0) {
        e.fireCd -= dt;
        if (e.fireCd <= 0) {
          const aimed = e.type === 'copter' || e.type === 'ufo';
          const spread = e.type === 'ufo' && Math.random() < 0.45 ? 2 : 1;
          enemyFire(e, aimed, spread);
          const base = e.type === 'biplane' ? rand(1.7, 2.7)
            : e.type === 'jet' ? rand(1.15, 2.0)
              : e.type === 'copter' ? rand(0.95, 1.6)
                : rand(0.85, 1.45);
          e.fireCd = base * fireMul;
        }
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.warpT <= 0) {
        if (hitWrap(e.x, e.y, CX, CY, e.r + PLAYER_R - 1)) {
          explode(e.x, e.y, e.rgb, false);
          G.enemies.splice(i, 1);
          G.kills += 1;
          hurt();
        }
      }
    }
  }

  function updateBoss(dt, pvx, pvy) {
    const b = G.boss;
    if (!b) return;
    b.t += dt;
    b.flash = Math.max(0, b.flash - dt * 7);
    if (b.kind === 'blimp') {
      b.ang = turnToward(b.ang, 0, 0.4 * dt);
      b.spd = 52 * speedMul();
    } else if (b.kind === 'bomber') {
      b.ang += 0.55 * dt;
    } else if (b.kind === 'gunship') {
      const dx = wrapD(CX - b.x, VW);
      const dy = wrapD(CY - b.y, VH);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const want = dist < 120 ? Math.atan2(dy, dx) + 1.2 : Math.atan2(dy, dx);
      b.ang = turnToward(b.ang, want, 1.6 * dt);
    } else {
      b.ang += 0.85 * dt + Math.sin(b.t * 2) * 0.4 * dt;
    }
    b.x = wrap(b.x + (Math.cos(b.ang) * b.spd - pvx) * dt, VW);
    b.y = wrap(b.y + (Math.sin(b.ang) * b.spd - pvy) * dt, VH);

    if (G.mode === 'play' && G.deadT <= 0 && G.warpT <= 0 && G.ready <= 0) {
      b.fireCd -= dt;
      if (b.fireCd <= 0) {
        bossFire(b);
        b.fireCd = (b.kind === 'mothership' ? 1.15 : b.kind === 'gunship' ? 0.72 : 0.85) / (1 + G.loop * 0.1);
        if (isChaos()) b.fireCd *= 0.82;
      }
    }
    if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.warpT <= 0) {
      if (hitWrap(b.x, b.y, CX, CY, b.r + PLAYER_R - 4)) hurt();
    }
  }

  function updateShots(dt, pvx, pvy) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      const dist = Math.sqrt(s.vx * s.vx + s.vy * s.vy) * dt;
      const n = Math.max(1, Math.ceil(dist / 7));
      const h = dt / n;
      let dead = false;
      for (let k = 0; k < n && !dead; k++) {
        s.x = wrap(s.x + (s.vx - pvx) * h, VW);
        s.y = wrap(s.y + (s.vy - pvy) * h, VH);
        if (G.boss && hitWrap(s.x, s.y, G.boss.x, G.boss.y, G.boss.r + 4)) {
          G.boss.hp -= 1;
          G.boss.flash = 1;
          popSpark(s.x, s.y, CYN, 14);
          emit(7, {
            x: s.x, y: s.y, j: 4,
            vx0: -90, vx1: 90, vy0: -90, vy1: 70,
            life: 0.22, r0: 0.8, r1: 2.1, rgb: G.boss.rgb, g: 30
          });
          hitStop(0.032);
          kick(2.4);
          audio.hit(G.combo + 2);
          bumpCombo();
          addScore(20 * G.mult);
          if (G.boss.hp <= 0) onBossKill();
          dead = true;
          break;
        }
        for (let j = G.enemies.length - 1; j >= 0; j--) {
          const e = G.enemies[j];
          if (hitWrap(s.x, s.y, e.x, e.y, e.r + 3)) {
            onEnemyKill(e, j);
            dead = true;
            break;
          }
        }
      }
      s.life -= dt;
      if (!REDUCE) {
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 7) s.trail.shift();
      }
      if (dead || s.life <= 0) G.shots.splice(i, 1);
    }
  }

  function updateEshots(dt, pvx, pvy) {
    for (let i = G.eshots.length - 1; i >= 0; i--) {
      const b = G.eshots[i];
      b.x = wrap(b.x + (b.vx - pvx) * dt, VW);
      b.y = wrap(b.y + (b.vy - pvy) * dt, VH);
      b.life -= dt;
      if (!REDUCE) {
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 4) b.trail.shift();
      }
      let dead = b.life <= 0;
      if (!dead && G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.warpT <= 0) {
        if (hitWrap(b.x, b.y, CX, CY, PLAYER_R + b.r)) {
          dead = true;
          hurt();
        }
      }
      if (dead) G.eshots.splice(i, 1);
    }
  }

  function maybeSpawn(dt) {
    if (G.warpT > 0 || G.deadT > 0) return;
    if (G.mode === 'title') {
      G.spawnT -= dt;
      if (G.enemies.length < 7 && G.spawnT <= 0) {
        spawnSquad(pick(['biplane', 'jet', 'copter', 'ufo']));
        G.spawnT = 1.1;
      }
      return;
    }
    if (G.boss) return;
    if (G.kills >= G.quota) {
      if (!G.boss) spawnBoss();
      return;
    }
    G.spawnT -= dt;
    if (G.enemies.length < spawnCap() && G.spawnT <= 0) {
      spawnSquad(pickType());
      G.spawnT = spawnInterval();
    }
  }

  function updateFx(dt, pvx, pvy) {
    G.shake *= Math.exp(-dt * 9);
    G.flash = Math.max(0, G.flash - dt * 2.15);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 12));
    G.toastT = Math.max(0, G.toastT - dt);
    G.muzzle = Math.max(0, G.muzzle - dt * 8);
    G.warpFlash = Math.max(0, G.warpFlash - dt * 1.4);
    if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt - pvx * dt;
      q.y += q.vy * dt - pvy * dt;
      q.vx *= Math.exp(-dt * 1.4);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      sparks[i].x -= pvx * dt;
      sparks[i].y -= pvy * dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      rings[i].x -= pvx * dt;
      rings[i].y -= pvy * dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt - pvy * dt;
      f.x -= pvx * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
  }

  function scrollDecor(dt, pvx, pvy) {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.x = wrap(s.x - pvx * s.par * dt, VW);
      s.y = wrap(s.y - pvy * s.par * dt, VH);
    }
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.x = wrap(c.x - pvx * c.par * dt, VW);
      c.y = wrap(c.y - pvy * c.par * dt, VH);
    }
  }

  function engineTrail(dt, pvx, pvy) {
    if (REDUCE || G.deadT > 0 || G.warpT > 0) return;
    G.engineT -= dt;
    if (G.engineT > 0) return;
    G.engineT = 0.028;
    const ang = G.ang;
    const x = CX - Math.cos(ang) * 11;
    const y = CY - Math.sin(ang) * 11;
    emit(1, {
      x: x, y: y, j: 1.6,
      vx0: -Math.cos(ang) * 30 - 20, vx1: -Math.cos(ang) * 90 + 20,
      vy0: -Math.sin(ang) * 30 - 20, vy1: -Math.sin(ang) * 90 + 20,
      life: 0.22, r0: 1.1, r1: 2.4, rgb: CYN, g: 0
    });
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    updatePlayer(dt);
    if (G.mode === 'play' && G.fireHold) fire();
    const pv = playerVel();
    if (G.ready > 0) G.ready -= dt;
    scrollDecor(dt, pv.x, pv.y);
    engineTrail(dt, pv.x, pv.y);
    updateEnemies(dt, pv.x, pv.y);
    updateBoss(dt, pv.x, pv.y);
    updateShots(dt, pv.x, pv.y);
    updateEshots(dt, pv.x, pv.y);
    maybeSpawn(dt);
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.35, 0, 0);
      return;
    }

    if (G.mode === 'title') {
      G.ang += 0.42 * dt;
      const pv = playerVel();
      scrollDecor(dt, pv.x, pv.y);
      engineTrail(dt, pv.x, pv.y);
      updateEnemies(dt, pv.x, pv.y);
      maybeSpawn(dt);
      updateFx(dt, pv.x, pv.y);
      return;
    }

    if (G.mode === 'lose') {
      updateFx(dt, 0, 0);
      return;
    }

    if (G.warpT > 0) {
      G.warpT -= dt;
      updateFx(dt, 0, 0);
      if (G.warpT <= 0) nextEra();
      syncHud();
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      const pv = { x: 0, y: 0 };
      updateEnemies(dt, pv.x, pv.y);
      updateBoss(dt, pv.x, pv.y);
      updateEshots(dt, pv.x, pv.y);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('坠机了');
          updateFx(dt, 0, 0);
          return;
        }
        G.invuln = 1.4;
        G.eshots = [];
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt, 0, 0);
      syncHud();
      return;
    }

    playSim(dt);
    const pv = playerVel();
    updateFx(dt, pv.x, pv.y);
    syncHud();
  }

  function forWrap(x, y, pad, cb) {
    for (let iy = -1; iy <= 1; iy++) {
      for (let ix = -1; ix <= 1; ix++) {
        const px = x + ix * VW;
        const py = y + iy * VH;
        if (px > -pad && px < VW + pad && py > -pad && py < VH + pad) cb(px, py);
      }
    }
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    const top = ERA_SKY[G.era] || ERA_SKY[0];
    const bot = ERA_SKY2[G.era] || ERA_SKY2[0];
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(CX), sy(CY), 20 * scale, sx(CX), sy(CY), 380 * scale);
    const tint = isChaos() ? MAG : TYPE_RGB[TYPES[G.era]] || PUR;
    vg.addColorStop(0, rgba(tint, 0.07));
    vg.addColorStop(0.55, rgba(PUR, 0.04));
    vg.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(G.t * 1.5 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      forWrap(c.x, c.y, c.w, function (px, py) {
        ctx.fillStyle = rgba(c.rgb, c.a);
        ctx.beginPath();
        ctx.ellipse(sx(px), sy(py), c.w * 0.5 * scale, c.h * 0.5 * scale, 0, 0, TAU);
        ctx.fill();
      });
    }
  }

  function drawShipAt(x, y, ang, alpha) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    const s = scale;
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = rgba(CYN, 0.18);
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 * s, 10 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.moveTo(13 * s, 0);
    ctx.lineTo(-9 * s, 7.5 * s);
    ctx.lineTo(-5 * s, 0);
    ctx.lineTo(-9 * s, -7.5 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(13 * s, 0);
    ctx.lineTo(2 * s, 3.2 * s);
    ctx.lineTo(2 * s, -3.2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(PUR, 0.9);
    ctx.fillRect(-10 * s, -1.4 * s, 6 * s, 2.8 * s);
    if (G.muzzle > 0.15) {
      ctx.fillStyle = rgba(GOLD, G.muzzle);
      ctx.beginPath();
      ctx.moveTo(13 * s, 0);
      ctx.lineTo(22 * s, 2.4 * s * G.muzzle);
      ctx.lineTo(26 * s, 0);
      ctx.lineTo(22 * s, -2.4 * s * G.muzzle);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBiplane(x, y, ang, rgb, flash) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    const s = scale;
    const c = flash > 0.2 ? WHT : rgb;
    ctx.fillStyle = rgba(c, 0.95);
    ctx.fillRect(-8 * s, -2 * s, 16 * s, 4 * s);
    ctx.fillRect(-4 * s, -8 * s, 10 * s, 2.2 * s);
    ctx.fillRect(-4 * s, 5.8 * s, 10 * s, 2.2 * s);
    ctx.fillRect(-10 * s, -5 * s, 2.2 * s, 10 * s);
    ctx.fillStyle = rgba(ORG, 0.9);
    ctx.beginPath();
    ctx.arc(8 * s, 0, 3.2 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawJet(x, y, ang, rgb, flash) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    const s = scale;
    const c = flash > 0.2 ? WHT : rgb;
    ctx.fillStyle = rgba(c, 0.95);
    ctx.beginPath();
    ctx.moveTo(14 * s, 0);
    ctx.lineTo(-6 * s, 7 * s);
    ctx.lineTo(-10 * s, 2 * s);
    ctx.lineTo(-10 * s, -2 * s);
    ctx.lineTo(-6 * s, -7 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(PNK, 0.85);
    ctx.fillRect(-11 * s, -3.5 * s, 4 * s, 2.2 * s);
    ctx.fillRect(-11 * s, 1.3 * s, 4 * s, 2.2 * s);
    ctx.restore();
  }

  function drawCopter(x, y, ang, rgb, flash, t) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang);
    const s = scale;
    const c = flash > 0.2 ? WHT : rgb;
    ctx.strokeStyle = rgba(c, 0.75);
    ctx.lineWidth = 1.5 * s;
    ctx.save();
    ctx.rotate(t * 14);
    ctx.beginPath();
    ctx.moveTo(-13 * s, 0);
    ctx.lineTo(13 * s, 0);
    ctx.moveTo(0, -13 * s);
    ctx.lineTo(0, 13 * s);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = rgba(c, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 8 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillRect(-14 * s, -1.4 * s, 8 * s, 2.8 * s);
    ctx.restore();
  }

  function drawUfo(x, y, ang, rgb, flash, t) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang * 0.15);
    const s = scale;
    const c = flash > 0.2 ? WHT : rgb;
    ctx.fillStyle = rgba(c, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 2 * s, 15 * s, 6 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.beginPath();
    ctx.ellipse(0, -1 * s, 7 * s, 5 * s, 0, 0, TAU);
    ctx.fill();
    const lights = 5;
    for (let i = 0; i < lights; i++) {
      const a = (i / lights) * TAU + t * 4;
      ctx.fillStyle = rgba(GOLD, 0.55 + 0.45 * Math.sin(t * 8 + i));
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 10 * s, 2 * s + Math.sin(a) * 3 * s, 1.5 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    forWrap(e.x, e.y, 28, function (px, py) {
      if (e.type === 'biplane') drawBiplane(px, py, e.ang, e.rgb, e.flash);
      else if (e.type === 'jet') drawJet(px, py, e.ang, e.rgb, e.flash);
      else if (e.type === 'copter') drawCopter(px, py, e.ang, e.rgb, e.flash, e.t);
      else drawUfo(px, py, e.ang, e.rgb, e.flash, e.t);
    });
  }

  function drawBoss() {
    const b = G.boss;
    if (!b) return;
    forWrap(b.x, b.y, 60, function (px, py) {
      ctx.save();
      ctx.translate(sx(px), sy(py));
      ctx.rotate(b.kind === 'ufo' || b.kind === 'mothership' ? b.t * 0.4 : b.ang);
      const s = scale;
      const c = b.flash > 0.2 ? WHT : b.rgb;
      ctx.fillStyle = rgba(c, 0.18);
      ctx.beginPath();
      ctx.ellipse(0, 0, b.r * s, b.r * 0.55 * s, 0, 0, TAU);
      ctx.fill();
      if (b.kind === 'blimp') {
        ctx.fillStyle = rgba(c, 0.95);
        ctx.beginPath();
        ctx.ellipse(0, 0, 38 * s, 16 * s, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(ORG, 0.9);
        ctx.fillRect(-8 * s, 12 * s, 16 * s, 8 * s);
        ctx.fillStyle = rgba(GOLD, 0.5);
        ctx.fillRect(20 * s, -2 * s, 12 * s, 4 * s);
      } else if (b.kind === 'bomber') {
        ctx.fillStyle = rgba(c, 0.95);
        ctx.beginPath();
        ctx.moveTo(28 * s, 0);
        ctx.lineTo(-16 * s, 14 * s);
        ctx.lineTo(-24 * s, 4 * s);
        ctx.lineTo(-24 * s, -4 * s);
        ctx.lineTo(-16 * s, -14 * s);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(PNK, 0.85);
        ctx.fillRect(-10 * s, -18 * s, 8 * s, 6 * s);
        ctx.fillRect(-10 * s, 12 * s, 8 * s, 6 * s);
      } else if (b.kind === 'gunship') {
        ctx.strokeStyle = rgba(c, 0.75);
        ctx.lineWidth = 2 * s;
        ctx.save();
        ctx.rotate(b.t * 10);
        ctx.beginPath();
        ctx.moveTo(-22 * s, 0);
        ctx.lineTo(22 * s, 0);
        ctx.moveTo(0, -22 * s);
        ctx.lineTo(0, 22 * s);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = rgba(c, 0.95);
        ctx.beginPath();
        ctx.ellipse(0, 0, 16 * s, 10 * s, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-26 * s, -3 * s, 14 * s, 6 * s);
      } else {
        ctx.fillStyle = rgba(c, 0.95);
        ctx.beginPath();
        ctx.ellipse(0, 4 * s, 42 * s, 16 * s, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(CYN, 0.8);
        ctx.beginPath();
        ctx.ellipse(0, -4 * s, 18 * s, 14 * s, 0, 0, TAU);
        ctx.fill();
        for (let i = 0; i < 8; i++) {
          const a = i * (TAU / 8) + b.t * 3;
          ctx.fillStyle = rgba(GOLD, 0.5 + 0.5 * Math.sin(b.t * 7 + i));
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 28 * s, 4 * s + Math.sin(a) * 8 * s, 2.4 * s, 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();
    });
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      forWrap(s.x, s.y, 18, function (px, py) {
        if (s.trail) {
          for (let t = 0; t < s.trail.length; t++) {
            const p = s.trail[t];
            const u = t / Math.max(1, s.trail.length - 1);
            const tx = wrapD(p.x - s.x, VW);
            const ty = wrapD(p.y - s.y, VH);
            ctx.fillStyle = rgba(CYN, 0.12 + u * 0.35);
            ctx.beginPath();
            ctx.arc(sx(px + tx), sy(py + ty), (1.2 + u * 1.6) * scale, 0, TAU);
            ctx.fill();
          }
        }
        ctx.fillStyle = rgba(WHT, 0.95);
        ctx.beginPath();
        ctx.arc(sx(px), sy(py), 2.6 * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(CYN, 0.8);
        ctx.beginPath();
        ctx.arc(sx(px), sy(py), 4.2 * scale, 0, TAU);
        ctx.fill();
      });
    }
    for (let i = 0; i < G.eshots.length; i++) {
      const b = G.eshots[i];
      forWrap(b.x, b.y, 12, function (px, py) {
        if (b.trail) {
          for (let t = 0; t < b.trail.length; t++) {
            const p = b.trail[t];
            const tx = wrapD(p.x - b.x, VW);
            const ty = wrapD(p.y - b.y, VH);
            ctx.fillStyle = rgba(b.rgb, 0.1 + t * 0.08);
            ctx.beginPath();
            ctx.arc(sx(px + tx), sy(py + ty), 1.4 * scale, 0, TAU);
            ctx.fill();
          }
        }
        ctx.fillStyle = rgba(b.rgb, 0.95);
        ctx.beginPath();
        ctx.arc(sx(px), sy(py), b.r * scale, 0, TAU);
        ctx.fill();
      });
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a * 0.9);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale * (0.6 + a), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const u = s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, 1 - u);
      ctx.lineWidth = (2.2 - u * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * (0.3 + u * 1.1)) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const u = r.t / 0.4;
      ctx.strokeStyle = rgba(r.rgb, 0.85 * (1 - u));
      ctx.lineWidth = (3 - u * 2) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.rad + u * 42) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 ' + Math.round(12 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.txt, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0 && G.warpFlash <= 0) return;
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.2);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.warpFlash > 0) {
      const u = G.warpFlash;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(CYN, u * 0.16);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
      ctx.strokeStyle = rgba(PUR, u * 0.7);
      ctx.lineWidth = 3 * scale;
      ctx.beginPath();
      ctx.arc(sx(CX), sy(CY), (40 + (1 - u) * 280) * scale, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, u * 0.55);
      ctx.beginPath();
      ctx.arc(sx(CX), sy(CY), (18 + (1 - u) * 160) * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink) return;
    drawShipAt(CX, CY, G.ang, 1);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05030c';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(CX);
      const cy = sy(CY);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    for (let i = 0; i < G.enemies.length; i++) drawEnemy(G.enemies[i]);
    drawBoss();
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

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('era');
    else startGame(G.kind || 'era');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('era');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A' || code === 'KeyA') {
      keys.l = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D' || code === 'KeyD') {
      keys.r = down;
      if (down) inputSrc = 'key';
      if (down) e.preventDefault();
    }
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (down && (space || k === 'ArrowUp' || k === 'ArrowDown' || k === 'w' || k === 'W' || k === 's' || k === 'S')) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (k === 'm' || k === 'M' || code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R' || code === 'KeyR') {
      e.preventDefault();
      restart();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
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
      if (overlayOpen()) return;
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.type = e.pointerType || '';
      const p = pointerWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = pointerWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
      if (!pointer.down && e.pointerType === 'mouse') {
        pointer.hover = true;
        pointer.type = 'mouse';
      }
      if (pointer.down) inputSrc = 'ptr';
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

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnEra) {
    btnEra.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('era');
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
