'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const WATER = 112;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.38;
  const GUN_MAX = 4;
  const TORP_MAX = 3;
  const BEST_KEY = 'playbox-in-the-hunt-best';
  const MUTE_KEY = 'playbox-in-the-hunt-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 鱼雷 · R 重开 · M 静音';
  const TITLE_LEAD = '横版潜舰。空格向前兼向上打，Shift 放鱼雷。水面打机舰，水下猎潜。撞体、触弹、触礁都扣一命。别当成潜航、沙罗、泽泽或武装——这是潜猎，不是声呐躲环，不是蛇核，不是触手，不是力场球。';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const WPN_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'MAX'];

  const MAG = [255, 61, 184];
  const CYN = [18, 216, 234];
  const TEAL = [61, 255, 208];
  const GOLD = [255, 227, 107];
  const WHT = [232, 251, 255];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 160, 72];
  const STEEL = [88, 128, 138];
  const ICE = [176, 220, 236];
  const SAND = [196, 164, 110];
  const FOAM = [184, 244, 255];

  const SCORE = {
    plane: 50,
    heli: 80,
    boat: 110,
    mine: 70,
    sub: 160,
    diver: 90,
    eel: 100,
    turret: 140,
    ice: 120,
    carrier: 280,
    mid: 1800,
    boss: 4000,
    clear: 1500,
    all: 8000
  };

  const STAGES = [
    {
      name: '第 1 关 · 冰湾',
      biome: 'ice',
      mid: '冰炮艇',
      boss: '破冰兽',
      midHp: 40,
      bossHp: 96,
      waves: [
        { t: 0.8, kind: 'planes', n: 5 },
        { t: 1.4, kind: 'mines', n: 3 },
        { t: 3.0, kind: 'boats' },
        { t: 5.2, kind: 'mines', n: 4 },
        { t: 7.4, kind: 'helis', n: 3 },
        { t: 9.6, kind: 'ice' },
        { t: 12.0, kind: 'subs', n: 2 },
        { t: 14.2, kind: 'planes', n: 6 },
        { t: 16.6, kind: 'carrier' },
        { t: 19.0, kind: 'mid' },
        { t: 24.8, kind: 'boats' },
        { t: 27.0, kind: 'helis', n: 4 },
        { t: 29.2, kind: 'mines', n: 5 },
        { t: 31.6, kind: 'planes', n: 7 },
        { t: 33.8, kind: 'ice' },
        { t: 36.0, kind: 'subs', n: 3 },
        { t: 38.4, kind: 'carrier' },
        { t: 47.2, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 沉城',
      biome: 'ruin',
      mid: '石垒',
      boss: '石卫',
      midHp: 54,
      bossHp: 128,
      waves: [
        { t: 0.7, kind: 'eels', n: 4 },
        { t: 2.8, kind: 'turrets' },
        { t: 5.0, kind: 'divers', n: 4 },
        { t: 7.2, kind: 'subs', n: 3 },
        { t: 9.4, kind: 'planes', n: 6 },
        { t: 11.6, kind: 'mines', n: 4 },
        { t: 13.8, kind: 'boats' },
        { t: 16.0, kind: 'eels', n: 5 },
        { t: 18.2, kind: 'carrier' },
        { t: 20.6, kind: 'mid' },
        { t: 26.4, kind: 'turrets' },
        { t: 28.6, kind: 'divers', n: 5 },
        { t: 30.8, kind: 'subs', n: 3 },
        { t: 33.0, kind: 'helis', n: 4 },
        { t: 35.2, kind: 'eels', n: 6 },
        { t: 37.4, kind: 'mines', n: 5 },
        { t: 39.6, kind: 'planes', n: 8 },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 母港',
      biome: 'port',
      mid: '巡航舰',
      boss: '猎核',
      midHp: 68,
      bossHp: 176,
      waves: [
        { t: 0.5, kind: 'boats' },
        { t: 1.2, kind: 'mines', n: 4 },
        { t: 2.4, kind: 'planes', n: 7 },
        { t: 4.4, kind: 'subs', n: 3 },
        { t: 6.4, kind: 'turrets' },
        { t: 8.4, kind: 'helis', n: 4 },
        { t: 10.4, kind: 'mines', n: 6 },
        { t: 12.4, kind: 'carrier' },
        { t: 14.4, kind: 'divers', n: 5 },
        { t: 16.4, kind: 'eels', n: 5 },
        { t: 18.4, kind: 'boats' },
        { t: 20.4, kind: 'mid' },
        { t: 26.2, kind: 'planes', n: 8 },
        { t: 28.2, kind: 'subs', n: 4 },
        { t: 30.2, kind: 'turrets' },
        { t: 32.2, kind: 'helis', n: 5 },
        { t: 34.2, kind: 'mines', n: 6 },
        { t: 36.2, kind: 'carrier' },
        { t: 38.2, kind: 'boats' },
        { t: 40.2, kind: 'eels', n: 6 },
        { t: 52.2, kind: 'boss' }
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
  const ovStart = document.getElementById('ov-start');
  const ovEnd = document.getElementById('ov-end');
  const btnHunt = document.getElementById('btn-hunt');
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnTorp = document.getElementById('btn-torp');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const wpnLabel = document.getElementById('wpn-label');
  const torpLabel = document.getElementById('torp-label');
  const depthLabel = document.getElementById('depth-label');
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
  let wpnTok = 0;
  let torpTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 90, y: 240, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const bubbles = [];
  const splashes = [];
  const trails = [];

  const G = {
    mode: 'title',
    kind: 'hunt',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: 96, y: 240, vx: 0, vy: 0, pitch: 0, wet: true },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    powGun: 0,
    powTorp: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    fireCd: 0,
    torpCd: 0,
    fireHold: false,
    torpHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    muzzleUp: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    why: '',
    propT: 0,
    propAng: 0,
    extraT: 0
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
  function isCore() {
    return G.kind === 'core';
  }
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'ice';
  }
  function plySpd() {
    return (isCore() ? 300 : 268) + G.powGun * 6;
  }
  function scrollSpd() {
    if (hasBig()) return isCore() ? 28 : 22;
    const base = isCore() ? 128 : 92;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isCore() ? 10 : 8);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isCore() ? 168 : 112;
  }
  function hpScale() {
    return isCore() ? 1.22 : 1;
  }
  function stageRec() {
    return STAGES[Math.min(2, G.stage - 1)];
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
      this.beep(720 + G.powGun * 48, 0.044, 'square', 0.028, 1480);
    },
    missile() {
      this.ensure();
      this.beep(420, 0.07, 'sawtooth', 0.03, 880);
    },
    torp() {
      this.ensure();
      this.noise(0.05, 0.03, 280);
      this.beep(180, 0.12, 'sine', 0.04, 90);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.034, 0.032, 1280);
      this.beep(540 * lift, 0.064, 'square', 0.042, 920 * lift);
    },
    chip() {
      this.ensure();
      this.beep(860, 0.028, 'triangle', 0.016, 400);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.12, big ? 0.078 : 0.05, big ? 200 : 440);
      this.beep(big ? 150 : 240, big ? 0.28 : 0.16, 'sawtooth', 0.052, 48);
    },
    splash() {
      this.ensure();
      this.noise(0.08, 0.036, 700);
      this.beep(320, 0.07, 'sine', 0.022, 140);
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
    death() {
      this.ensure();
      this.noise(0.16, 0.058, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 72);
      this.beep(150, 0.32, 'sine', 0.045, 42);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(180, 0.18, 'sawtooth', 0.05, 96);
      this.beep(130, 0.3, 'square', 0.04, 70);
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
    },
    empty() {
      this.ensure();
      this.beep(180, 0.08, 'square', 0.028, 90);
    },
    prop() {
      this.ensure();
      this.beep(70, 0.03, 'sine', 0.012, 48);
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

  function gunText() {
    if (G.powGun >= GUN_MAX) return '弹 MAX';
    if (G.powGun <= 0) return '弹';
    return '弹 ' + WPN_ROMAN[G.powGun];
  }

  function torpText() {
    if (G.powTorp >= TORP_MAX) return '雷 MAX';
    if (G.powTorp <= 0) return '雷';
    return '雷 ' + WPN_ROMAN[G.powTorp];
  }

  function flashWpn() {
    if (!wpnLabel) return;
    wpnLabel.classList.remove('hot');
    void wpnLabel.offsetWidth;
    wpnLabel.classList.add('hot');
    wpnTok += 1;
    const tok = wpnTok;
    setTimeout(function () {
      if (tok === wpnTok && wpnLabel) wpnLabel.classList.remove('hot');
    }, 280);
  }

  function flashTorp() {
    if (!torpLabel) return;
    torpLabel.classList.remove('hot');
    void torpLabel.offsetWidth;
    torpLabel.classList.add('hot');
    torpTok += 1;
    const tok = torpTok;
    setTimeout(function () {
      if (tok === torpTok && torpLabel) torpLabel.classList.remove('hot');
    }, 280);
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < G.lives) {
      const el = document.createElement('i');
      el.className = 'pip on';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    while (pips.length > Math.max(G.lives, LIVES)) {
      const el = pips.pop();
      if (el && el.parentNode) el.parentNode.removeChild(el);
    }
    const show = Math.max(G.lives, LIVES);
    while (pips.length < show) {
      const el = document.createElement('i');
      el.className = 'pip';
      pipsEl.appendChild(el);
      pips.push(el);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncHud() {
    if (wpnLabel) wpnLabel.textContent = gunText();
    if (torpLabel) torpLabel.textContent = torpText();
    if (stageLabel) {
      const rec = stageRec();
      stageLabel.textContent = G.mode === 'title' ? '待命' : rec.name;
      stageLabel.classList.toggle('hot', G.mode === 'play' && hasBig());
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '深核' : '潜猎';
      tagLabel.classList.toggle('warn', isCore());
      tagLabel.classList.toggle('hot', G.mode === 'win');
    }
    if (depthLabel) {
      const surf = G.player.y < WATER + 6;
      depthLabel.textContent = surf ? '浮' : '潜';
      depthLabel.classList.toggle('surf', surf);
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
    else if (G.mode === 'lose') setHint('R 重开 · 撞体、触弹、触礁扣一命', 'warn');
    else if (G.mode === 'win') setHint('海域肃清 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 空格打机舰，鱼雷猎潜', 'warn');
    else setHint('空格向前/向上打 · Shift 鱼雷 · 撞体扣命 · R 重开', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'HUNT';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind !== 'title' && btnOvModes) {
      if (kind === 'lose') btnOvModes.textContent = '换模式';
      else btnOvModes.textContent = isCore() ? '换模式' : '深核';
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
    const cls = mag >= 6.5 ? 'die' : 'hit';
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
    popSpark(x, y, rgb, 12 + p * 10);
    if (y > WATER) {
      for (let i = 0; i < 4 + p * 3; i++) {
        bubbles.push({
          x: x + rand(-8, 8), y: y + rand(-6, 6),
          r: rand(1.2, 2.8), v: rand(28, 64), p: rand(0, TAU), a: 1
        });
      }
      capArr(bubbles, 90);
    }
  }

  function splashAt(x, y) {
    splashes.push({ x: x, y: WATER, t: 0, w: 18 });
    capArr(splashes, 18);
    emit(7, {
      x: x, y: WATER, j: 8,
      vx0: -80, vx1: 80, vy0: -160, vy1: -40,
      life: 0.32, r0: 1, r1: 2.4, rgb: FOAM, g: 280
    });
  }

  function floorAt(x) {
    const wx = G.scroll + x;
    const bio = biome();
    let y = VH - 30;
    y += Math.sin(wx * 0.012) * 9;
    y += Math.sin(wx * 0.037 + 1.2) * 5;
    if (bio === 'ice') {
      y += Math.sin(wx * 0.005) * 7;
      const cell = (wx / 118) | 0;
      if (hash2(cell + 4) > 0.72) y -= 18 + hash2(cell + 7) * 16;
    } else if (bio === 'ruin') {
      const cell = (wx / 132) | 0;
      if (hash2(cell) > 0.58) y -= 42 + hash2(cell + 3) * 38;
    } else {
      y = VH - 34 + Math.sin(wx * 0.008) * 4;
      const cell = (wx / 160) | 0;
      if (hash2(cell + 2) > 0.64) y -= 22;
    }
    return y;
  }

  function ceilAt(x) {
    const wx = G.scroll + x;
    const bio = biome();
    if (bio === 'ice') return 6;
    if (bio === 'ruin') {
      const cell = (wx / 150) | 0;
      if (hash2(cell + 1) > 0.62) return 86 + hash2(cell + 9) * 40;
      return 10 + Math.sin(wx * 0.016) * 6;
    }
    const cell = (wx / 140) | 0;
    if (hash2(cell + 6) > 0.66) return 72 + hash2(cell) * 28;
    return 16 + Math.sin(wx * 0.01) * 5;
  }

  function terrainHit(x, y, r) {
    if (y + r > floorAt(x) - 1) return true;
    if (y - r < ceilAt(x) + 1) return true;
    return false;
  }

  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e && (e.boss || e.mid) && !e.dead) return true;
    }
    return false;
  }

  function living() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) if (G.ents[i] && !G.ents[i].dead) n += 1;
    return n;
  }

  function addEnt(e) {
    e.flash = 0;
    e.t = e.t || 0;
    e.max = e.hp;
    G.ents.push(e);
  }

  function spawnPlane(x, y) {
    addEnt({
      kind: 'plane', x: x, y: y, vx: -80 - G.stage * 6, vy: 0,
      hp: 1, r: 12, zone: 'air', score: SCORE.plane, fire: rand(0.4, 1.1)
    });
  }

  function spawnHeli(x, y) {
    addEnt({
      kind: 'heli', x: x, y: y, vx: -70, vy: 0,
      hp: 2, r: 14, zone: 'air', score: SCORE.heli, fire: rand(0.5, 1.2), rot: 0
    });
  }

  function spawnBoat(x) {
    addEnt({
      kind: 'boat', x: x, y: WATER + 8, vx: -48, vy: 0,
      hp: Math.round(3 * hpScale()), r: 18, zone: 'surf', score: SCORE.boat, fire: rand(0.6, 1.3)
    });
  }

  function spawnMine(x, y) {
    addEnt({
      kind: 'mine', x: x, y: y, vx: -36, vy: 0,
      hp: 1, r: 11, zone: 'deep', score: SCORE.mine, spin: rand(0, TAU)
    });
  }

  function spawnSub(x, y) {
    addEnt({
      kind: 'sub', x: x, y: y, vx: -62, vy: 0,
      hp: Math.round(4 * hpScale()), r: 16, zone: 'deep', score: SCORE.sub,
      fire: rand(0.7, 1.4), baseY: y, amp: rand(18, 36)
    });
  }

  function spawnDiver(x, y) {
    addEnt({
      kind: 'diver', x: x, y: y, vx: -54, vy: 0,
      hp: 1, r: 10, zone: 'deep', score: SCORE.diver, fire: rand(0.8, 1.6)
    });
  }

  function spawnEel(x, y) {
    addEnt({
      kind: 'eel', x: x, y: y, vx: -80, vy: 0,
      hp: 2, r: 13, zone: 'deep', score: SCORE.eel, baseY: y, amp: rand(22, 44)
    });
  }

  function spawnTurret(x) {
    const fy = floorAt(x) - 14;
    addEnt({
      kind: 'turret', x: x, y: fy, vx: 0, vy: 0, grounded: true,
      hp: Math.round(5 * hpScale()), r: 14, zone: 'deep', score: SCORE.turret, fire: rand(0.7, 1.4)
    });
  }

  function spawnIce(x) {
    addEnt({
      kind: 'ice', x: x, y: WATER - 6, vx: -40, vy: 0,
      hp: Math.round(6 * hpScale()), r: 22, zone: 'surf', score: SCORE.ice, solid: true
    });
  }

  function spawnCarrier(x) {
    addEnt({
      kind: 'carrier', x: x, y: WATER + 10, vx: -42, vy: 0,
      hp: Math.round(8 * hpScale()), r: 24, zone: 'surf', score: SCORE.carrier,
      fire: 1.1, drop: true
    });
  }

  function spawnMid() {
    const rec = stageRec();
    const hp = Math.round(rec.midHp * hpScale());
    const bio = rec.biome;
    if (bio === 'ice') {
      addEnt({
        kind: 'mid', form: 'gunboat', x: VW + 70, y: WATER + 12, vx: -28, vy: 0,
        hp: hp, r: 34, zone: 'surf', score: SCORE.mid, mid: true, fire: 0.5, name: rec.mid
      });
    } else if (bio === 'ruin') {
      addEnt({
        kind: 'mid', form: 'keep', x: VW + 50, y: VH - 78, vx: -18, vy: 0,
        hp: hp, r: 36, zone: 'deep', score: SCORE.mid, mid: true, fire: 0.42, name: rec.mid, grounded: true
      });
    } else {
      addEnt({
        kind: 'mid', form: 'cruiser', x: VW + 80, y: WATER + 14, vx: -24, vy: 0,
        hp: hp, r: 38, zone: 'surf', score: SCORE.mid, mid: true, fire: 0.38, name: rec.mid
      });
    }
    toast(rec.mid, false, true);
    audio.boss();
  }

  function spawnBoss() {
    const rec = stageRec();
    const hp = Math.round(rec.bossHp * hpScale());
    const bio = rec.biome;
    if (bio === 'ice') {
      addEnt({
        kind: 'boss', form: 'breaker', x: VW + 90, y: WATER + 18, vx: -16, vy: 0,
        hp: hp, r: 52, zone: 'surf', score: SCORE.boss, boss: true, fire: 0.28, name: rec.boss, phase: 0
      });
    } else if (bio === 'ruin') {
      addEnt({
        kind: 'boss', form: 'ward', x: VW - 70, y: VH * 0.58, vx: 0, vy: 0,
        hp: hp, r: 56, zone: 'deep', score: SCORE.boss, boss: true, fire: 0.24, name: rec.boss, phase: 0
      });
    } else {
      addEnt({
        kind: 'boss', form: 'hunter', x: VW + 100, y: 250, vx: -14, vy: 0,
        hp: hp, r: 58, zone: 'deep', score: SCORE.boss, boss: true, fire: 0.22, name: rec.boss, phase: 0, baseY: 250
      });
    }
    toast(rec.boss, false, true);
    audio.boss();
    screenFlash(GOLD, 0.35);
    kick(5.5);
  }

  function spawnWave(w) {
    const kind = w.kind;
    if (kind === 'planes') {
      const n = w.n || 5;
      const y0 = 42 + rand(0, 40);
      for (let i = 0; i < n; i++) spawnPlane(VW + 30 + i * 30, y0 + (i % 2) * 18);
    } else if (kind === 'helis') {
      const n = w.n || 3;
      for (let i = 0; i < n; i++) spawnHeli(VW + 40 + i * 46, 36 + i * 14);
    } else if (kind === 'boats') {
      spawnBoat(VW + 40);
      spawnBoat(VW + 110);
      if (isCore()) spawnBoat(VW + 180);
    } else if (kind === 'mines') {
      const n = w.n || 4;
      for (let i = 0; i < n; i++) spawnMine(VW + 24 + i * 36, WATER + 40 + (i % 3) * 48);
    } else if (kind === 'subs') {
      const n = w.n || 2;
      for (let i = 0; i < n; i++) spawnSub(VW + 50 + i * 70, WATER + 70 + i * 36);
    } else if (kind === 'divers') {
      const n = w.n || 4;
      for (let i = 0; i < n; i++) spawnDiver(VW + 20 + i * 28, WATER + 50 + (i % 2) * 40);
    } else if (kind === 'eels') {
      const n = w.n || 4;
      for (let i = 0; i < n; i++) spawnEel(VW + 30 + i * 34, WATER + 60 + (i % 2) * 50);
    } else if (kind === 'turrets') {
      spawnTurret(VW + 50);
      spawnTurret(VW + 140);
      if (G.stage >= 2) spawnTurret(VW + 230);
    } else if (kind === 'ice') {
      spawnIce(VW + 40);
      spawnIce(VW + 130);
    } else if (kind === 'carrier') {
      spawnCarrier(VW + 60);
    } else if (kind === 'mid') {
      spawnMid();
    } else if (kind === 'boss') {
      spawnBoss();
    }
  }

  function stageThink() {
    if (G.stageClearT > 0) return;
    if (hasBig()) return;
    const rec = stageRec();
    const waves = rec.waves;
    while (G.waveI < waves.length && G.stageT >= waves[G.waveI].t) {
      const w = waves[G.waveI];
      G.waveI += 1;
      spawnWave(w);
    }
  }

  function extraThink(dt) {
    if (!isCore() || hasBig() || G.stageClearT > 0) return;
    G.extraT -= dt;
    if (G.extraT > 0) return;
    G.extraT = 2.4 - G.stage * 0.18;
    if (living() > 16) return;
    const roll = Math.random();
    if (roll < 0.34) spawnPlane(VW + 20, 24 + rand(0, 50));
    else if (roll < 0.55) spawnMine(VW + 20, WATER + 30 + rand(0, 160));
    else if (roll < 0.75) spawnDiver(VW + 24, WATER + 40 + rand(0, 120));
    else spawnBoat(VW + 30);
  }

  function dropPow(x, y, force) {
    const roll = force || (Math.random() < 0.45 ? 'gun' : Math.random() < 0.7 ? 'torp' : 'life');
    G.pows.push({ x: x, y: y, vx: -28, vy: -40, kind: roll, t: 0, life: 9 });
  }

  function eShot(x, y, vx, vy, r, rgb) {
    if (G.eShots.length >= shotCap()) return;
    G.eShots.push({ x: x, y: y, vx: vx, vy: vy, r: r || 3.2, rgb: rgb || MAG, life: 3.8 });
  }

  function aimShot(x, y, spd, r, rgb) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = hypot(dx, dy) || 1;
    eShot(x, y, dx / len * spd, dy / len * spd, r, rgb);
  }

  function addShot(s) {
    G.shots.push(s);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.powGun;
    G.fireCd = lv >= 4 ? 0.068 : lv >= 2 ? 0.086 : 0.11;
    G.muzzle = 0.055;
    G.muzzleUp = 0.07;
    audio.shoot();
    const px = G.player.x + 22;
    const py = G.player.y;
    const nFwd = lv >= 4 ? 3 : lv >= 2 ? 2 : 1;
    const spread = nFwd === 1 ? [0] : nFwd === 2 ? [-5, 5] : [-8, 0, 8];
    for (let i = 0; i < nFwd; i++) {
      addShot({
        kind: 'gun', x: px, y: py + spread[i], vx: 640, vy: spread[i] * 3.2,
        r: 3.4, dmg: 1, rgb: GOLD, life: 1.2
      });
    }
    const nUp = lv >= 3 ? 2 : 1;
    audio.missile();
    for (let i = 0; i < nUp; i++) {
      const oxp = (i - (nUp - 1) * 0.5) * 10;
      addShot({
        kind: 'up', x: G.player.x + 6 + oxp, y: G.player.y - 10,
        vx: 240 + lv * 36, vy: -360 - lv * 14,
        r: 3.6, dmg: 1.2, rgb: CYN, life: 1.4
      });
    }
  }

  function fireTorp() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.torpCd > 0) return;
    const lv = G.powTorp;
    G.torpCd = lv >= 3 ? 0.22 : lv >= 1 ? 0.28 : 0.36;
    audio.torp();
    const n = lv >= 3 ? 3 : lv >= 1 ? 2 : 1;
    const wet = G.player.y >= WATER - 2;
    for (let i = 0; i < n; i++) {
      const oy = (i - (n - 1) * 0.5) * 12;
      addShot({
        kind: 'torp',
        x: G.player.x + 18,
        y: G.player.y + oy,
        vx: wet ? 380 : 40,
        vy: wet ? oy * 0.4 : 220,
        r: 5.2,
        dmg: 4 + lv,
        rgb: TEAL,
        life: 2.2,
        falling: !wet,
        wiggle: 0
      });
    }
    G.muzzle = 0.08;
    kick(1.6);
  }

  function dmgMul(shot, e) {
    const k = shot.kind;
    const z = e.zone;
    if (k === 'torp') {
      if (z === 'air') return 0.35;
      if (z === 'surf') return 1.4;
      return 1.65;
    }
    if (k === 'up') {
      if (z === 'air') return 1.6;
      if (z === 'surf') return 0.9;
      return 0.5;
    }
    if (z === 'air') return 1.15;
    if (z === 'deep') return 0.7;
    return 0.85;
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      floatText(G.player.x + 10, G.player.y - 26, '×' + G.mult, GOLD, true);
    }
    if (comboEl) {
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
      comboTok += 1;
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
    syncHud();
  }

  function killEnt(e, shot) {
    e.dead = true;
    e.hp = 0;
    bumpCombo();
    const pts = (e.score || 50) * G.mult;
    addScore(pts);
    const rgb = e.boss || e.mid ? GOLD : (e.kind === 'ice' ? ICE : MAG);
    juice(e.x, e.y, rgb, e.boss ? 2.4 : e.mid ? 1.8 : e.solid ? 1.4 : 1);
    floatText(e.x, e.y - 8, String(pts), rgb, !!(e.boss || e.mid));
    audio.boom(!!(e.boss || e.mid));
    hitStop(e.boss ? 0.072 : e.mid ? 0.055 : shot && shot.kind === 'torp' ? 0.048 : 0.034);
    kick(e.boss ? 8 : e.mid ? 5.5 : 2.4);
    if (e.boss) screenFlash(GOLD, 0.55);
    else if (e.mid) screenFlash(CYN, 0.32);
    if (e.drop || e.mid || e.boss || (e.kind === 'carrier')) {
      dropPow(e.x, e.y, e.boss ? 'gun' : null);
    } else if (Math.random() < 0.08 + G.stage * 0.02) {
      dropPow(e.x, e.y);
    }
    if (e.boss) {
      G.stageClearT = 1.85;
      addScore(SCORE.clear * G.mult);
      toast(stageRec().name + ' 肃清', false, true);
      audio.wave();
    }
  }

  function hurtEnt(e, shot) {
    const dmg = shot.dmg * dmgMul(shot, e);
    e.hp -= dmg;
    e.flash = 0.08;
    audio.hit(G.combo);
    hitStop(shot.kind === 'torp' ? 0.042 : 0.03);
    kick(1.2);
    emit(4, {
      x: shot.x, y: shot.y, j: 4,
      vx0: -80, vx1: 80, vy0: -90, vy1: 40,
      life: 0.16, r0: 1, r1: 2, rgb: shot.rgb
    });
    if (e.hp <= 0) killEnt(e, shot);
    else audio.chip();
  }

  function pickPow(p) {
    if (p.kind === 'gun') {
      if (G.powGun < GUN_MAX) G.powGun += 1;
      else addScore(500 * G.mult);
      flashWpn();
      toast(gunText(), false, true);
    } else if (p.kind === 'torp') {
      if (G.powTorp < TORP_MAX) G.powTorp += 1;
      else addScore(500 * G.mult);
      flashTorp();
      toast(torpText(), false, true);
    } else {
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', false, true);
        audio.oneup();
      } else addScore(1000 * G.mult);
    }
    audio.pow();
    juice(p.x, p.y, GOLD, 1.1);
    popSpark(p.x, p.y, GOLD, 18);
    syncHud();
  }

  function killPlayer(why) {
    if (G.deadT > 0 || G.invuln > 0 || G.mode !== 'play') return;
    G.why = why || '撞毁';
    G.deadT = 0.95;
    G.lives -= 1;
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.1);
    screenFlash(MAG, 0.5);
    hitStop(0.07);
    kick(8);
    audio.death();
    G.eShots.length = 0;
    if (G.powGun > 0) {
      dropPow(G.player.x + 20, G.player.y, 'gun');
      G.powGun = Math.max(0, G.powGun - 1);
    }
    syncHud();
  }

  function respawn() {
    G.player.x = 96;
    G.player.y = 240;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose', '舰沉了', '猎潜失败。撞体、触弹或触礁扣尽三命。R 立刻再潜，或换模式。分数 ' + G.score + '。');
    if (btnOvRetry) btnOvRetry.textContent = '再潜';
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    addScore(SCORE.all);
    audio.win();
    screenFlash(GOLD, 0.6);
    showOverlay(
      'win',
      '海域肃清',
      (isCore() ? '深核打穿。' : '三关猎尽。') + '分数 ' + G.score + '。' + (isCore() ? '换模式回标题。' : '可进深核，弹更密、血更多。')
    );
    if (btnOvRetry) btnOvRetry.textContent = '再潜';
    syncHud();
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (s.kind === 'torp' && s.falling) {
        s.vy += 520 * dt;
        if (s.y >= WATER + 6) {
          s.falling = false;
          s.vx = 380;
          s.vy = 0;
          splashAt(s.x, s.y);
        }
      }
      if (s.kind === 'torp' && !s.falling) {
        s.wiggle += dt * 14;
        s.y += Math.sin(s.wiggle) * 8 * dt;
        trails.push({ x: s.x, y: s.y, t: 0, rgb: TEAL });
      }
      const prevY = s.y;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.kind === 'up' && prevY >= WATER && s.y < WATER) splashAt(s.x, WATER);
      s.life -= dt;
      if (s.life <= 0 || s.x > VW + 40 || s.y < -40 || s.y > VH + 40) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const e = G.ents[j];
        if (!e || e.dead) continue;
        const rr = s.r + e.r;
        const dx = s.x - e.x;
        const dy = s.y - e.y;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(e, s);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
    capArr(trails, 80);
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt * 3.2;
      if (trails[i].t >= 1) trails.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x < -30 || s.x > VW + 40 || s.y < -30 || s.y > VH + 30) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT > 0 || G.invuln > 0) continue;
      const dx = s.x - G.player.x;
      const dy = s.y - G.player.y;
      const rr = s.r + 9;
      if (dx * dx + dy * dy < rr * rr) {
        G.eShots.splice(i, 1);
        killPlayer('中弹');
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.life -= dt;
      p.vy += 70 * dt;
      if (p.vy > 46) p.vy = 46;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y > floorAt(p.x) - 12) {
        p.y = floorAt(p.x) - 12;
        p.vy *= -0.35;
      }
      if (p.y < WATER + 8 && p.vy < 0) p.vy += 40 * dt;
      if (p.life <= 0 || p.x < -20) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.deadT > 0) continue;
      const dx = p.x - G.player.x;
      const dy = p.y - G.player.y;
      if (dx * dx + dy * dy < 26 * 26) {
        pickPow(p);
        G.pows.splice(i, 1);
      }
    }
  }

  function fireFrom(e, dt) {
    e.fire -= dt;
    if (e.fire > 0) return;
    const dense = isCore() ? 0.82 : 1;
    const spd = (isCore() ? 168 : 140) + G.stage * 8;
    if (e.kind === 'plane') {
      e.fire = (1.4 + rand(0, 0.6)) * dense;
      eShot(e.x - 8, e.y + 4, -spd * 0.7, 70, 3, MAG);
    } else if (e.kind === 'heli') {
      e.fire = (1.1 + rand(0, 0.4)) * dense;
      aimShot(e.x, e.y + 8, spd * 0.85, 3.2, MAG);
    } else if (e.kind === 'boat' || e.kind === 'carrier') {
      e.fire = (1.0 + rand(0, 0.5)) * dense;
      aimShot(e.x - 6, e.y - 8, spd * 0.9, 3.4, ORG);
    } else if (e.kind === 'sub') {
      e.fire = (1.3 + rand(0, 0.5)) * dense;
      eShot(e.x - 14, e.y, -220, 0, 4.4, TEAL);
    } else if (e.kind === 'diver') {
      e.fire = (1.5 + rand(0, 0.5)) * dense;
      aimShot(e.x, e.y, spd * 0.7, 2.8, PNK);
    } else if (e.kind === 'turret') {
      e.fire = (1.05 + rand(0, 0.4)) * dense;
      aimShot(e.x, e.y - 8, spd, 3.6, MAG);
    } else if (e.mid) {
      e.fire = (0.42 + rand(0, 0.12)) * dense;
      if (e.form === 'gunboat') {
        aimShot(e.x - 10, e.y - 10, spd, 3.8, ORG);
        eShot(e.x - 8, e.y + 6, -180, 90, 4, MAG);
      } else if (e.form === 'keep') {
        aimShot(e.x - 12, e.y - 16, spd, 3.6, MAG);
        aimShot(e.x + 8, e.y - 10, spd * 0.9, 3.2, ORG);
      } else {
        aimShot(e.x - 16, e.y - 8, spd, 3.8, ORG);
        eShot(e.x - 20, e.y + 8, -240, 0, 4.6, TEAL);
      }
    } else if (e.boss) {
      const low = e.hp / e.max < 0.5;
      e.fire = (low ? 0.18 : 0.28) * dense;
      e.phase += 1;
      if (e.form === 'breaker') {
        aimShot(e.x - 20, e.y - 12, spd * 1.05, 4, ORG);
        if (e.phase % 3 === 0) {
          eShot(e.x - 10, e.y + 8, -40, 140, 5.5, ICE);
        }
        if (low && e.phase % 2 === 0) {
          eShot(e.x - 24, e.y - 4, -200, -40, 3.4, MAG);
          eShot(e.x - 24, e.y - 4, -200, 40, 3.4, MAG);
        }
      } else if (e.form === 'ward') {
        const ang = G.t * 1.6 + e.phase * 0.4;
        for (let k = 0; k < (low ? 5 : 3); k++) {
          const a = ang + k * (TAU / (low ? 5 : 3));
          eShot(e.x, e.y, Math.cos(a) * spd, Math.sin(a) * spd, 3.4, MAG);
        }
        if (e.phase % 4 === 0) spawnMine(e.x - 20, e.y + 20);
      } else {
        eShot(e.x - 30, e.y, -260, 0, 5, TEAL);
        aimShot(e.x - 8, e.y - 18, spd, 3.6, ORG);
        if (low) {
          eShot(e.x - 20, e.y - 10, -180, -70, 3.2, MAG);
          eShot(e.x - 20, e.y + 10, -180, 70, 3.2, MAG);
        }
      }
    }
  }

  function updateEnts(dt) {
    const scr = G.mode === 'play' ? scrollSpd() : 36;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e) {
        G.ents.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      if (e.dead) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.grounded) {
        e.x -= scr * dt;
        e.y = (e.kind === 'turret' ? floorAt(e.x) - 14 : e.y);
        if (e.form === 'keep') e.y = floorAt(e.x) - 40;
      } else {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        if (!e.boss && !e.mid) e.x -= scr * 0.15 * dt;
      }
      if (e.kind === 'plane') {
        e.y += Math.sin(e.t * 3 + e.x * 0.02) * 18 * dt;
        if (e.x < G.player.x + 80 && e.t > 0.4) e.vy = lerp(e.vy, 30, 0.02);
      } else if (e.kind === 'heli') {
        e.rot += dt * 18;
        const ty = clamp(G.player.y * 0.25 + 36, 24, WATER - 16);
        e.y += (ty - e.y) * dt * 1.4;
      } else if (e.kind === 'boat' || e.kind === 'carrier' || e.kind === 'ice') {
        e.y = WATER + (e.kind === 'ice' ? -8 : 8) + Math.sin(e.t * 2.2) * 2;
      } else if (e.kind === 'mine') {
        e.spin += dt * 2.4;
        e.y += Math.sin(e.t * 1.6 + e.x * 0.03) * 22 * dt;
      } else if (e.kind === 'sub') {
        e.y = e.baseY + Math.sin(e.t * 1.4) * e.amp;
      } else if (e.kind === 'eel') {
        e.y = e.baseY + Math.sin(e.t * 2.6) * e.amp;
        e.x -= 20 * dt;
      } else if (e.kind === 'diver') {
        e.y += Math.sin(e.t * 2 + i) * 28 * dt;
        if (G.player.x < e.x) e.x -= 12 * dt;
      } else if (e.boss) {
        if (e.form === 'breaker') {
          if (e.x > VW - 130) e.x -= 40 * dt;
          e.y = WATER + 16 + Math.sin(e.t * 0.8) * 10;
        } else if (e.form === 'ward') {
          e.x = VW - 120 + Math.sin(e.t * 0.6) * 24;
          e.y = lerp(e.y, clamp(G.player.y, WATER + 40, VH - 80), 1 - Math.exp(-dt * 0.9));
        } else {
          if (e.x > VW - 150) e.x -= 36 * dt;
          e.y = e.baseY + Math.sin(e.t * 0.9) * 46;
        }
      } else if (e.mid) {
        if (e.x > VW - 140) e.x -= 30 * dt;
        if (e.form !== 'keep') e.y = WATER + 12 + Math.sin(e.t * 1.1) * 6;
      }

      e.y = clamp(e.y, 16, VH - 16);
      if (e.kind === 'plane' || e.kind === 'heli') e.y = clamp(e.y, 16, WATER - 10);

      if (!e.boss && !e.mid && e.x < -80) {
        G.ents.splice(i, 1);
        continue;
      }

      fireFrom(e, dt);

      if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) continue;
      const dx = e.x - G.player.x;
      const dy = e.y - G.player.y;
      const rr = e.r + 10;
      if (dx * dx + dy * dy < rr * rr) {
        if (e.kind === 'mine') {
          killEnt(e, null);
          killPlayer('触雷');
        } else if (!e.boss && !e.mid) {
          killEnt(e, null);
          killPlayer('撞体');
        } else {
          killPlayer('撞体');
        }
      }
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.muzzleUp > 0) G.muzzleUp -= dt;
    if (G.toastT > 0) G.toastT -= dt;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 1.8);
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 4.2;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.6;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      splashes[i].t += dt * 2.8;
      if (splashes[i].t >= 1) splashes.splice(i, 1);
    }
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      b.y -= b.v * dt;
      b.x += Math.sin(G.t * 2 + b.p) * 10 * dt;
      if (b.y < WATER + 2) {
        b.y = rand(WATER + 20, VH - 20);
        b.x = rand(0, VW);
      }
    }
  }

  function tickProp(dt) {
    G.propAng += dt * (REDUCE ? 8 : 22);
    G.propT -= dt;
    if (G.propT > 0) return;
    G.propT = G.mode === 'play' && G.deadT <= 0 ? 0.09 : 0.16;
    if (G.mode === 'lose') return;
    if (audio.ctx && !audio.muted) audio.prop();
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
      G.player.x += G.player.vx * dt;
      G.player.y += G.player.vy * dt;
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 28, 360);
      const ty = clamp(pointer.y, 22, VH - 22);
      const oxp = G.player.x;
      const oyp = G.player.y;
      G.player.x = lerp(G.player.x, tx, 1 - Math.exp(-dt * 16));
      G.player.y = lerp(G.player.y, ty, 1 - Math.exp(-dt * 16));
      G.player.vx = (G.player.x - oxp) / Math.max(dt, 0.0001);
      G.player.vy = (G.player.y - oyp) / Math.max(dt, 0.0001);
    } else {
      G.player.vx *= Math.exp(-dt * 10);
      G.player.vy *= Math.exp(-dt * 10);
      G.player.x += G.player.vx * dt;
      G.player.y += G.player.vy * dt;
    }
    G.player.x = clamp(G.player.x, 28, 360);
    G.player.y = clamp(G.player.y, 20, VH - 22);
    const want = clamp(G.player.vy * 0.0016, -0.28, 0.28);
    G.player.pitch = lerp(G.player.pitch || 0, want, 1 - Math.exp(-dt * 10));

    const wet = G.player.y >= WATER - 2;
    if (wet !== G.player.wet) {
      G.player.wet = wet;
      splashAt(G.player.x + 8, WATER);
      audio.splash();
    }
    if (depthLabel) {
      depthLabel.textContent = wet ? '潜' : '浮';
      depthLabel.classList.toggle('surf', !wet);
    }

    if (G.invuln <= 0 && terrainHit(G.player.x, G.player.y, 11)) {
      killPlayer('触礁');
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      tickProp(dt * 0.35);
      return;
    }
    updateFx(dt);
    tickProp(dt);

    if (G.mode === 'title') {
      G.player.x = 96 + Math.sin(G.t * 0.7) * 18;
      G.player.y = 236 + Math.sin(G.t * 1.1) * 10;
      G.player.pitch = Math.sin(G.t * 0.9) * 0.08;
      G.scroll += 36 * dt;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && living() < 7) {
        spawnPlane(VW + 20, 30 + rand(0, 40));
        if (Math.random() < 0.4) spawnMine(VW + 40, WATER + 50 + rand(0, 80));
        G.spawnT = 2.2;
      }
      updateEnts(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      return;
    }

    G.clock += dt;
    if (!hasBig()) G.stageT += dt;
    G.scroll += scrollSpd() * dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.torpCd > 0) G.torpCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

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
        if (G.stage >= 3) {
          winGame();
          return;
        }
        G.stage += 1;
        G.stageT = 0;
        G.waveI = 0;
        G.invuln = Math.max(G.invuln, 0.85);
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updatePlayer(dt);
    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();
    if (G.mode === 'play' && G.deadT <= 0 && G.torpHold) fireTorp();

    stageThink();
    extraThink(dt);
    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function drawSkyWater() {
    const bio = biome();
    const sky = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(WATER));
    if (bio === 'ice') {
      sky.addColorStop(0, '#163044');
      sky.addColorStop(1, '#0c2838');
    } else if (bio === 'ruin') {
      sky.addColorStop(0, '#1a2430');
      sky.addColorStop(1, '#0c1c28');
    } else {
      sky.addColorStop(0, '#142436');
      sky.addColorStop(1, '#0a2030');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(sx(0), sy(0), VW * scale, WATER * scale);

    const sea = ctx.createLinearGradient(sx(0), sy(WATER), sx(0), sy(VH));
    sea.addColorStop(0, bio === 'port' ? '#0a3a48' : '#0a4a58');
    sea.addColorStop(0.45, '#063040');
    sea.addColorStop(1, '#031018');
    ctx.fillStyle = sea;
    ctx.fillRect(sx(0), sy(WATER), VW * scale, (VH - WATER) * scale);

    if (!REDUCE) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(sx(0), sy(WATER), VW * scale, (VH - WATER) * scale);
      ctx.clip();
      ctx.strokeStyle = 'rgba(18, 216, 234, 0.08)';
      ctx.lineWidth = 10 * scale;
      const off = (G.t * 28 + G.scroll * 0.15) % 70;
      for (let i = -2; i < 16; i++) {
        ctx.beginPath();
        ctx.moveTo(sx(-20 + i * 70 + off), sy(WATER));
        ctx.lineTo(sx(80 + i * 70 + off), sy(VH));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawSurface() {
    ctx.beginPath();
    for (let x = 0; x <= VW; x += 6) {
      const y = WATER + Math.sin((x + G.scroll) * 0.04 + G.t * 2.2) * 3.2
        + Math.sin((x + G.scroll) * 0.11 + G.t * 3.4) * 1.3;
      if (x === 0) ctx.moveTo(sx(x), sy(y));
      else ctx.lineTo(sx(x), sy(y));
    }
    ctx.strokeStyle = rgba(CYN, 0.85);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();
    ctx.beginPath();
    for (let x = 0; x <= VW; x += 8) {
      const y = WATER + Math.sin((x + G.scroll) * 0.04 + G.t * 2.2) * 3.2 - 2;
      if (x === 0) ctx.moveTo(sx(x), sy(y));
      else ctx.lineTo(sx(x), sy(y));
    }
    ctx.strokeStyle = rgba(FOAM, 0.35);
    ctx.lineWidth = 1 * scale;
    ctx.stroke();

    for (let i = 0; i < splashes.length; i++) {
      const s = splashes[i];
      ctx.strokeStyle = rgba(FOAM, 1 - s.t);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), (12 + s.t * 22) * scale, (4 + s.t * 6) * scale, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawTerrain() {
    const bio = biome();
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += 8) {
      ctx.lineTo(sx(x), sy(floorAt(x)));
    }
    ctx.lineTo(sx(VW), sy(VH));
    ctx.closePath();
    ctx.fillStyle = bio === 'ice' ? 'rgba(12, 40, 52, 0.96)' : bio === 'ruin' ? 'rgba(28, 24, 18, 0.96)' : 'rgba(16, 28, 32, 0.96)';
    ctx.fill();
    ctx.strokeStyle = bio === 'ruin' ? rgba(SAND, 0.35) : rgba(CYN, 0.22);
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();

    if (bio !== 'ice') {
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(0));
      for (let x = 0; x <= VW; x += 8) {
        ctx.lineTo(sx(x), sy(ceilAt(x)));
      }
      ctx.lineTo(sx(VW), sy(0));
      ctx.closePath();
      ctx.fillStyle = bio === 'ruin' ? 'rgba(22, 20, 16, 0.94)' : 'rgba(10, 24, 28, 0.94)';
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.16);
      ctx.lineWidth = 1.2 * scale;
      ctx.stroke();
    } else {
      for (let x = 0; x < VW; x += 90) {
        const wx = ((G.scroll + x) / 90) | 0;
        if (hash2(wx + 11) < 0.48) continue;
        const cx = x + 22;
        const cy = 22;
        ctx.fillStyle = 'rgba(186, 220, 236, 0.32)';
        ctx.beginPath();
        ctx.moveTo(sx(cx - 18), sy(cy + 14));
        ctx.lineTo(sx(cx), sy(cy - 14));
        ctx.lineTo(sx(cx + 20), sy(cy + 14));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = rgba(ICE, 0.35);
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
      }
    }
  }

  function drawBubbles() {
    for (let i = 0; i < bubbles.length; i++) {
      const b = bubbles[i];
      ctx.strokeStyle = rgba(FOAM, 0.28);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), b.r * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawSub(x, y, a, enemy, flashHit) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(enemy ? 0 : (G.player.pitch || 0));
    ctx.scale(scale, scale);
    ctx.globalAlpha = a == null ? 1 : a;
    const body = enemy ? STEEL : GOLD;
    const trim = enemy ? MAG : CYN;
    ctx.shadowColor = rgba(enemy ? MAG : GOLD, 0.55);
    ctx.shadowBlur = 14;
    ctx.fillStyle = rgba(flashHit ? WHT : body, 1);
    ctx.beginPath();
    ctx.ellipse(2, 0, 26, 9.6, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(trim, enemy ? 0.85 : 0.55);
    ctx.beginPath();
    ctx.ellipse(16, 0, 11, 7.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(trim, 0.96);
    ctx.fillRect(-3, -15, 13, 9);
    ctx.fillStyle = rgba(body, 1);
    ctx.fillRect(3, -21, 2.2, 7);
    ctx.fillRect(3, -23, 6, 2.2);
    ctx.fillStyle = rgba(enemy ? PNK : WHT, 0.95);
    ctx.beginPath();
    ctx.arc(0, -1.4, 2.3, 0, TAU);
    ctx.arc(7, -1.4, 1.8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(body, 1);
    ctx.beginPath();
    ctx.moveTo(-22, 0);
    ctx.lineTo(-31, -6.5);
    ctx.lineTo(-27, 0);
    ctx.lineTo(-31, 6.5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = rgba(trim, 0.95);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(-34, Math.sin(G.propAng) * 6);
    ctx.moveTo(-28, 0);
    ctx.lineTo(-34, -Math.sin(G.propAng) * 6);
    ctx.stroke();
    ctx.strokeStyle = rgba(body, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 8);
    ctx.lineTo(18, 13);
    ctx.moveTo(8, -9);
    ctx.lineTo(16, -6);
    ctx.stroke();
    if (!enemy && G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.arc(30, 0, 5, 0, TAU);
      ctx.fill();
    }
    if (!enemy && G.muzzleUp > 0) {
      ctx.fillStyle = rgba(CYN, 0.92);
      ctx.beginPath();
      ctx.arc(4, -18, 3.6, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawEnt(e) {
    const a = e.flash > 0 ? 0.55 + Math.sin(e.flash * 80) * 0.45 : 1;
    ctx.save();
    ctx.globalAlpha = a;
    const x = sx(e.x);
    const y = sy(e.y);
    if (e.kind === 'plane') {
      ctx.fillStyle = rgba(ICE, 0.95);
      ctx.beginPath();
      ctx.moveTo(x + 12 * scale, y);
      ctx.lineTo(x - 10 * scale, y - 6 * scale);
      ctx.lineTo(x - 8 * scale, y + 6 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.8);
      ctx.fillRect(x - 2 * scale, y - 1 * scale, 8 * scale, 2 * scale);
    } else if (e.kind === 'heli') {
      ctx.fillStyle = rgba(STEEL, 0.95);
      ctx.fillRect(x - 10 * scale, y - 4 * scale, 20 * scale, 8 * scale);
      ctx.strokeStyle = rgba(CYN, 0.8);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(x - 16 * scale, y - 8 * scale);
      ctx.lineTo(x + 16 * scale, y - 8 * scale);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      const ra = e.rot || G.t * 18;
      ctx.moveTo(x + Math.cos(ra) * 14 * scale, y - 8 * scale + Math.sin(ra) * 3 * scale);
      ctx.lineTo(x - Math.cos(ra) * 14 * scale, y - 8 * scale - Math.sin(ra) * 3 * scale);
      ctx.stroke();
    } else if (e.kind === 'boat' || e.kind === 'carrier') {
      ctx.fillStyle = rgba(STEEL, 0.96);
      ctx.beginPath();
      ctx.moveTo(x - 22 * scale, y);
      ctx.lineTo(x + 26 * scale, y);
      ctx.lineTo(x + 16 * scale, y + 10 * scale);
      ctx.lineTo(x - 16 * scale, y + 10 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(e.kind === 'carrier' ? GOLD : MAG, 0.9);
      ctx.fillRect(x - 6 * scale, y - 12 * scale, 14 * scale, 12 * scale);
    } else if (e.kind === 'mine') {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(e.spin || 0);
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(PNK, 0.9);
      ctx.lineWidth = 2 * scale;
      for (let k = 0; k < 6; k++) {
        const a2 = k * TAU / 6;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a2) * 8 * scale, Math.sin(a2) * 8 * scale);
        ctx.lineTo(Math.cos(a2) * 13 * scale, Math.sin(a2) * 13 * scale);
        ctx.stroke();
      }
      ctx.restore();
    } else if (e.kind === 'sub') {
      drawSub(e.x, e.y, a, true, e.flash > 0);
      ctx.restore();
      return;
    } else if (e.kind === 'diver') {
      ctx.fillStyle = rgba(PNK, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, 6 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(TEAL, 0.8);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(x + 6 * scale, y);
      ctx.lineTo(x + 14 * scale, y + 4 * scale);
      ctx.stroke();
    } else if (e.kind === 'eel') {
      ctx.strokeStyle = rgba(TEAL, 0.9);
      ctx.lineWidth = 4 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x + 16 * scale, y);
      ctx.quadraticCurveTo(x, y + Math.sin(e.t * 6) * 10 * scale, x - 16 * scale, y);
      ctx.stroke();
    } else if (e.kind === 'turret') {
      ctx.fillStyle = rgba(SAND, 0.9);
      ctx.fillRect(x - 10 * scale, y, 20 * scale, 14 * scale);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(x, y, 9 * scale, Math.PI, 0);
      ctx.fill();
    } else if (e.kind === 'ice') {
      ctx.fillStyle = rgba(ICE, 0.85);
      ctx.beginPath();
      ctx.moveTo(x - 22 * scale, y + 14 * scale);
      ctx.lineTo(x - 6 * scale, y - 18 * scale);
      ctx.lineTo(x + 8 * scale, y - 10 * scale);
      ctx.lineTo(x + 24 * scale, y + 14 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.5);
      ctx.stroke();
    } else if (e.mid || e.boss) {
      drawBig(e, x, y, a);
    }
    if ((e.mid || e.boss) && e.max) {
      const bw = (e.boss ? 80 : 54) * scale;
      const ratio = clamp(e.hp / e.max, 0, 1);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(x - bw / 2, y - (e.r + 14) * scale, bw, 5 * scale);
      ctx.fillStyle = rgba(ratio < 0.3 ? MAG : GOLD, 0.95);
      ctx.fillRect(x - bw / 2, y - (e.r + 14) * scale, bw * ratio, 5 * scale);
    }
    ctx.restore();
  }

  function drawBig(e, x, y, a) {
    ctx.globalAlpha = a;
    if (e.form === 'gunboat' || e.form === 'cruiser' || e.form === 'breaker') {
      const w = e.boss ? 70 : 44;
      ctx.fillStyle = rgba(STEEL, 0.96);
      ctx.beginPath();
      ctx.moveTo(x - w * scale, y);
      ctx.lineTo(x + (w + 10) * scale, y - 4 * scale);
      ctx.lineTo(x + (w - 6) * scale, y + 18 * scale);
      ctx.lineTo(x - (w - 10) * scale, y + 18 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(e.boss ? GOLD : ORG, 0.95);
      ctx.fillRect(x - 10 * scale, y - 22 * scale, 28 * scale, 22 * scale);
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(x + 16 * scale, y - 16 * scale, 10 * scale, 10 * scale);
      if (e.boss) {
        ctx.fillStyle = rgba(ICE, 0.5);
        ctx.fillRect(x - 50 * scale, y - 8 * scale, 18 * scale, 22 * scale);
      }
    } else if (e.form === 'keep' || e.form === 'ward') {
      ctx.fillStyle = rgba(SAND, 0.95);
      ctx.fillRect(x - 36 * scale, y - 28 * scale, 72 * scale, 56 * scale);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.fillRect(x - 10 * scale, y - 8 * scale, 20 * scale, 20 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.strokeRect(x - 36 * scale, y - 28 * scale, 72 * scale, 56 * scale);
      ctx.fillStyle = rgba(ORG, 0.8);
      ctx.fillRect(x - 28 * scale, y - 40 * scale, 10 * scale, 14 * scale);
      ctx.fillRect(x + 18 * scale, y - 40 * scale, 10 * scale, 14 * scale);
    } else {
      ctx.fillStyle = rgba(STEEL, 0.96);
      ctx.beginPath();
      ctx.ellipse(x, y, 64 * scale, 22 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.fillRect(x - 8 * scale, y - 28 * scale, 22 * scale, 18 * scale);
      const glow = 0.45 + Math.sin(G.t * 6) * 0.25;
      ctx.fillStyle = rgba(GOLD, glow);
      ctx.beginPath();
      ctx.arc(x + 10 * scale, y, 8 * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawShots() {
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      ctx.fillStyle = rgba(t.rgb, 0.35 * (1 - t.t));
      ctx.beginPath();
      ctx.arc(sx(t.x), sy(t.y), 3.2 * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.kind === 'torp') {
        ctx.fillStyle = rgba(TEAL, 0.95);
        ctx.beginPath();
        ctx.ellipse(sx(s.x), sy(s.y), 8 * scale, 3.2 * scale, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.7);
        ctx.beginPath();
        ctx.arc(sx(s.x + 6), sy(s.y), 2 * scale, 0, TAU);
        ctx.fill();
      } else if (s.kind === 'up') {
        ctx.fillStyle = rgba(CYN, 0.95);
        ctx.fillRect(sx(s.x - 1.4), sy(s.y - 6), 2.8 * scale, 10 * scale);
        ctx.fillStyle = rgba(GOLD, 0.8);
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y - 6), 2.2 * scale, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.fillRect(sx(s.x), sy(s.y - 1.4), 8 * scale, 2.8 * scale);
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = p.kind === 'gun' ? GOLD : p.kind === 'torp' ? TEAL : MAG;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.rotate(p.t * 2);
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.strokeStyle = rgba(WHT, 0.7);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -9 * scale);
      ctx.lineTo(8 * scale, 0);
      ctx.lineTo(0, 9 * scale);
      ctx.lineTo(-8 * scale, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#031018';
      ctx.font = 'bold ' + (10 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2);
      ctx.fillText(p.kind === 'gun' ? '弹' : p.kind === 'torp' ? '雷' : '命', 0, 0);
      ctx.restore();
    }
  }

  function drawFx() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - r.t));
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 28) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.fillStyle = rgba(s.rgb, 0.8 * (1 - s.t));
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * (1 - s.t * 0.4)) * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.globalAlpha = 1;
    }
  }

  function draw() {
    const shx = REDUCE ? 0 : (G.shake ? rand(-G.shake, G.shake) : 0);
    const shy = REDUCE ? 0 : (G.shake ? rand(-G.shake, G.shake) : 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#031018';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(shx, shy);
    if (G.punch !== 1) {
      ctx.translate(W * 0.5, H * 0.5);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-W * 0.5, -H * 0.5);
    }

    ctx.fillStyle = '#020c12';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawSkyWater();
    drawBubbles();
    drawTerrain();
    drawSurface();

    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawShots();
    drawPows();
    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0;
      if (!blink) drawSub(G.player.x, G.player.y, 1, false, G.muzzle > 0);
    }
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }

    ctx.restore();

    ctx.strokeStyle = 'rgba(18, 216, 234, 0.18)';
    ctx.lineWidth = 2;
    ctx.strokeRect(sx(0) + 1, sy(0) + 1, VW * scale - 2, VH * scale - 2);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) / 2;
    oy = (H - VH * scale) / 2;
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX / Math.max(1, rect.width)) * W;
    const y = (cssY / Math.max(1, rect.height)) * H;
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function seedWorld() {
    bubbles.length = 0;
    for (let i = 0; i < 42; i++) {
      bubbles.push({
        x: rand(0, VW),
        y: rand(WATER + 8, VH - 16),
        r: rand(1.1, 2.6),
        v: rand(14, 36),
        p: rand(0, TAU),
        a: 1
      });
    }
  }

  function clearField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pows.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    splashes.length = 0;
    trails.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'hunt';
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
    G.powGun = 0;
    G.powTorp = 0;
    G.player.x = 96;
    G.player.y = 240;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.pitch = 0;
    G.player.wet = true;
    G.fireCd = 0;
    G.torpCd = 0;
    G.fireHold = false;
    G.torpHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.spawnT = 0.7;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.extraT = 1.6;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isCore() ? '深核 · 弹更密' : '潜猎 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'hunt';
    G.stage = 1;
    G.lives = LIVES;
    G.powGun = 0;
    G.powTorp = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.player.x = 96;
    G.player.y = 236;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay('title', '潜猎', TITLE_LEAD);
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('hunt');
    else startGame(G.kind);
  }

  function primaryAction() {
    if (G.mode === 'title') startGame('hunt');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    if (G.mode === 'title') startGame('core');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win' && isCore()) goTitle();
    else if (G.mode === 'win') startGame('core');
    else goTitle();
  }

  function onKey(e, down) {
    const k = e.key;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' ||
      k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S' ||
      k === 'Left' || k === 'Right' || k === 'Up' || k === 'Down';
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    const torpKey = k === 'Shift' || k === 'z' || k === 'Z';

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

    if (down && (isMove || space || torpKey || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      if (torpKey) G.torpHold = false;
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
    if (torpKey) {
      if (!G.torpHold) {
        G.torpHold = true;
        fireTorp();
      }
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

  function bindTorpBtn(el) {
    if (!el) return;
    const down = function (e) {
      e.preventDefault();
      audio.ensure();
      G.torpHold = true;
      fireTorp();
    };
    const up = function () { G.torpHold = false; };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('click', function (e) { e.preventDefault(); });
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
    if (acc > STEP * 4) acc = 0;
    draw();
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  if (BEST_KEY !== 'playbox-in-the-hunt-best') throw new Error('best key');

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindTorpBtn(btnTorp);
  bindTorpBtn(btnPad);

  if (btnHunt) {
    btnHunt.addEventListener('click', function () {
      audio.ensure();
      startGame('hunt');
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
      secondaryAction();
    });
  }
  if (btnRetry) {
    btnRetry.addEventListener('click', function () {
      restart();
    });
  }
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }

  window.addEventListener('resize', resize);
  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) last = 0;
  });

  requestAnimationFrame(frame);
})();
