'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const BOMB_CAP = 6;
  const PWR_MAX = 3;
  const CHARGE_T = 0.85;
  const BEST_KEY = 'playbox-striker-1945-best';
  const MUTE_KEY = 'playbox-striker-1945-mute';
  const OPS = '方向 / WASD 飞 · 空格射击 · Shift / Z 爆弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 180, 255];
  const SKY = [58, 216, 255];
  const GOLD = [255, 227, 107];
  const HOT = [92, 225, 255];
  const WHT = [232, 247, 255];
  const PNK = [255, 154, 210];
  const RED = [255, 86, 96];
  const ORG = [255, 160, 72];
  const NAV = [18, 42, 72];
  const INK = [8, 22, 36];

  const PWR_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'MAX'];
  const DROP_GLYPH = { pwr: '火', bomb: '爆' };

  const STAGES = [
    {
      name: '第 1 关 · 港湾',
      biome: 'harbor',
      mid: '炮艇',
      boss: '巨舰',
      midHp: 42,
      bossHp: 100,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.4, kind: 'stream', dir: 1 },
        { t: 6.0, kind: 'turrets' },
        { t: 8.6, kind: 'courier' },
        { t: 11.0, kind: 'dive', n: 4 },
        { t: 13.6, kind: 'heavy' },
        { t: 16.2, kind: 'v', n: 7 },
        { t: 18.8, kind: 'scouts' },
        { t: 21.4, kind: 'mid' },
        { t: 27.0, kind: 'stream', dir: -1 },
        { t: 29.6, kind: 'dive', n: 5 },
        { t: 32.0, kind: 'turrets' },
        { t: 34.6, kind: 'courier' },
        { t: 37.0, kind: 'heavy' },
        { t: 39.6, kind: 'v', n: 7 },
        { t: 42.2, kind: 'scouts' },
        { t: 47.6, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 雪原',
      biome: 'snow',
      mid: '铁甲',
      boss: '冰堡',
      midHp: 56,
      bossHp: 132,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 3.0, kind: 'dive', n: 5 },
        { t: 5.4, kind: 'stream', dir: -1 },
        { t: 7.8, kind: 'turrets' },
        { t: 10.2, kind: 'heavy' },
        { t: 12.6, kind: 'courier' },
        { t: 15.0, kind: 'scouts' },
        { t: 17.4, kind: 'heavy' },
        { t: 19.8, kind: 'mid' },
        { t: 25.4, kind: 'stream', dir: 1 },
        { t: 27.8, kind: 'dive', n: 6 },
        { t: 30.2, kind: 'heavy' },
        { t: 32.6, kind: 'turrets' },
        { t: 35.0, kind: 'v', n: 9 },
        { t: 37.4, kind: 'courier' },
        { t: 39.8, kind: 'scouts' },
        { t: 42.4, kind: 'heavy' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 要塞',
      biome: 'fort',
      mid: '潜影',
      boss: '天门',
      midHp: 70,
      bossHp: 176,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.6, kind: 'stream', dir: 1 },
        { t: 4.4, kind: 'stream', dir: -1 },
        { t: 6.6, kind: 'dive', n: 6 },
        { t: 8.8, kind: 'heavy' },
        { t: 11.0, kind: 'courier' },
        { t: 13.2, kind: 'scouts' },
        { t: 15.4, kind: 'turrets' },
        { t: 17.6, kind: 'heavy' },
        { t: 19.6, kind: 'mid' },
        { t: 25.2, kind: 'dive', n: 7 },
        { t: 27.4, kind: 'heavy' },
        { t: 29.6, kind: 'scouts' },
        { t: 31.8, kind: 'v', n: 11 },
        { t: 34.0, kind: 'courier' },
        { t: 36.2, kind: 'stream', dir: 1 },
        { t: 38.4, kind: 'turrets' },
        { t: 40.6, kind: 'heavy' },
        { t: 43.0, kind: 'dive', n: 6 },
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
  const btnRaid = document.getElementById('btn-raid');
  const btnSwarm = document.getElementById('btn-swarm');
  const ovRetry = document.getElementById('ov-retry');
  const ovModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const pwrLabel = document.getElementById('pwr-label');
  const bombLabel = document.getElementById('bomb-label');
  const chargeEl = document.getElementById('charge-label');
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
  let pwrTok = 0;
  let nextId = 1;

  const keys = { l: false, r: false, u: false, d: false, bomb: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const flakes = [];
  const isles = [];
  const wash = [];
  const rains = [];

  const G = {
    mode: 'title',
    kind: 'raid',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: VW * 0.5, y: VH - 90, vx: 0, vy: 0, bank: 0 },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    pwr: 0,
    bombs: 3,
    bombT: 0,
    rainT: 0,
    rainTick: 0,
    charge: 0,
    chargeReady: false,
    superT: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
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
    dropI: 0,
    why: '',
    propAng: 0,
    propT: 0
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
  function isSwarm() {
    return G.kind === 'swarm';
  }
  function plySpd() {
    return (isSwarm() ? 318 : 276) + G.pwr * 10;
  }
  function scrollSpd() {
    if (hasBig()) return isSwarm() ? 34 : 26;
    const base = isSwarm() ? 118 : 86;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isSwarm() ? 10 : 8);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isSwarm() ? 150 : 96;
  }
  function hpMul() {
    return isSwarm() ? 1.22 : 1;
  }
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'harbor';
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
      this.beep(720 + G.pwr * 48, 0.048, 'square', 0.028, 1620);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.034, 0.032, 1400);
      this.beep(580 * lift, 0.062, 'square', 0.042, 1080 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.11, big ? 0.08 : 0.05, big ? 200 : 440);
      this.beep(big ? 150 : 240, big ? 0.28 : 0.14, 'sawtooth', 0.052, 48);
    },
    bomb() {
      this.ensure();
      this.noise(0.3, 0.084, 150);
      this.beep(86, 0.44, 'sawtooth', 0.072, 36);
      this.beep(560, 0.3, 'sine', 0.048, 1560);
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
    miss() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.025, 80);
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
    prop() {
      this.ensure();
      this.noise(0.02, 0.01, 260);
      this.beep(92, 0.028, 'sine', 0.014, 50);
    },
    chargeTick() {
      this.ensure();
      this.beep(220 + G.charge * 420, 0.04, 'sine', 0.018, 280 + G.charge * 520);
    },
    chargeReady() {
      this.ensure();
      this.beep(660, 0.1, 'square', 0.05, 1320);
      this.beep(990, 0.16, 'triangle', 0.04, 1480);
    },
    super() {
      this.ensure();
      this.noise(0.16, 0.07, 280);
      this.beep(180, 0.22, 'sawtooth', 0.06, 70);
      this.beep(880, 0.18, 'sine', 0.05, 1760);
    },
    form() {
      this.ensure();
      this.beep(110, 0.24, 'sawtooth', 0.06, 48);
      this.noise(0.18, 0.06, 180);
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

  function pwrText() {
    if (G.pwr >= PWR_MAX) return '火 MAX';
    if (G.pwr <= 0) return '火';
    return '火 ' + PWR_ROMAN[G.pwr];
  }

  function flashPwr() {
    if (!pwrLabel) return;
    pwrLabel.classList.remove('hot');
    void pwrLabel.offsetWidth;
    pwrLabel.classList.add('hot');
    pwrTok += 1;
    const tok = pwrTok;
    setTimeout(function () {
      if (tok === pwrTok && pwrLabel) pwrLabel.classList.remove('hot');
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
    if (stageLabel) {
      const st = STAGES[G.stage - 1];
      if (hasBig()) {
        const en = findBig();
        stageLabel.textContent = en && en.type === 'boss'
          ? (st ? st.boss : '关底')
          : (st ? st.mid : '中破');
      } else {
        stageLabel.textContent = st ? st.name : '第 ' + G.stage + ' 关';
      }
      stageLabel.classList.toggle('hot', G.stage >= 3 || hasBig());
    }
    if (tagLabel) {
      tagLabel.textContent = isSwarm() ? '机海' : '空袭';
      tagLabel.classList.toggle('warn', isSwarm());
      tagLabel.classList.toggle('hot', !isSwarm() && G.stage >= 3);
    }
    if (pwrLabel) {
      pwrLabel.textContent = pwrText();
      pwrLabel.classList.toggle('max', G.pwr >= PWR_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (btnBomb) btnBomb.disabled = G.mode === 'play' && G.bombs <= 0;
    if (chargeEl) {
      if (G.mode === 'play' && G.deadT <= 0 && (G.charge > 0.12 || G.chargeReady)) {
        chargeEl.hidden = false;
        chargeEl.textContent = G.chargeReady ? '超' : '蓄';
        chargeEl.classList.toggle('ready', G.chargeReady);
      } else {
        chargeEl.hidden = true;
        chargeEl.classList.remove('ready');
      }
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
    else if (G.mode === 'lose') setHint('R 重开 · 撞机或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint((isSwarm() ? '机海尽破' : '空袭尽破') + ' · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 爆弹清弹', 'warn');
    else setHint('空格射击蓄力 · 松手超射 · Shift 爆弹 · 吃 火/爆', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'ST45';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovRetry) ovRetry.textContent = '再来';
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isSwarm() ? '换模式' : '机海';
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
    const cls = mag >= 6.5 ? 'die' : mag >= 5 ? 'bomb' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('bomb');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
        stageEl.classList.remove('bomb');
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
        g: spec.g == null ? 520 : spec.g
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

  function seedWorld() {
    flakes.length = 0;
    isles.length = 0;
    for (let i = 0; i < 46; i++) {
      flakes.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.4, 1.3),
        a: rand(0.16, 0.55),
        s: rand(3, 10),
        spin: rand(0, TAU)
      });
    }
    for (let i = 0; i < 6; i++) {
      isles.push({
        x: hash2(i * 19 + 4) * VW,
        y: -30 - i * 130,
        w: 36 + hash2(i * 11) * 70,
        h: 22 + hash2(i * 7) * 28,
        kind: hash2(i * 13)
      });
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
      if (G.combo >= 3 && G.combo % 3 === 0) {
        floatText(G.player.x, G.player.y - 28, G.combo + ' 链', GOLD, true);
        hitStop(0.04);
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

  function nextDropKind() {
    const cycle = ['pwr', 'pwr', 'bomb'];
    const k = cycle[G.dropI % cycle.length];
    G.dropI += 1;
    return k;
  }

  function spawnEnt(spec) {
    if (G.ents.length > 54) return null;
    const en = {
      id: nextId++,
      type: spec.type,
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy || 0,
      hp: spec.hp,
      maxHp: spec.hp,
      r: spec.r,
      t: 0,
      fireCd: spec.fireCd != null ? spec.fireCd : rand(0.28, 1.05),
      score: spec.score,
      drop: spec.drop || false,
      rgb: spec.rgb,
      ang: spec.ang || 0,
      flash: 0,
      ground: !!spec.ground,
      dive: !!spec.dive,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2,
      spin: spec.spin || 0,
      formed: false
    };
    G.ents.push(en);
    return en;
  }

  function spawnScout(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'scout',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 98,
      hp: 1, r: 10, score: 50,
      rgb: extra.rgb || MAG,
      dive: extra.dive,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.9, 2.4)
    });
  }

  function spawnV(n, xmid) {
    n = n || 7;
    xmid = xmid == null ? VW * 0.5 + rand(-36, 36) : xmid;
    const gapX = 26;
    const gapY = 20;
    const y0 = -24;
    spawnScout(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnScout(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnScout(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = (isSwarm() ? 8 : 6) + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'fighter',
        x: side + rand(-8, 8),
        y: -20 - i * 24,
        vx: dir * -78,
        vy: 122,
        hp: 1, r: 11, score: 80,
        rgb: PNK,
        fireCd: rand(0.7, 1.6)
      });
    }
  }

  function spawnDive(n) {
    n = n || 4;
    if (isSwarm()) n += 1;
    for (let i = 0; i < n; i++) {
      const x = 50 + (i + 0.5) * ((VW - 100) / n) + rand(-16, 16);
      spawnEnt({
        type: 'dive',
        x: x, y: -30 - i * 16,
        vx: 0, vy: 64,
        hp: 1, r: 11, score: 110,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnScouts() {
    const n = isSwarm() ? 6 : 5;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'scout',
        x: 48 + i * ((VW - 96) / Math.max(1, n - 1)) + rand(-10, 10),
        y: -18 - i * 12,
        vx: rand(-22, 22),
        vy: 72,
        hp: 1, r: 9, score: 50,
        rgb: SKY,
        fireCd: rand(0.8, 1.8),
        phase: rand(0, TAU)
      });
    }
  }

  function spawnHeavy(x) {
    spawnEnt({
      type: 'heavy',
      x: x == null ? rand(80, VW - 80) : x,
      y: -44,
      vx: rand(-28, 28),
      vy: 48,
      hp: 5, r: 18, score: 200,
      rgb: RED,
      drop: Math.random() < 0.34,
      w: 42, h: 26,
      fireCd: rand(0.35, 0.8)
    });
  }

  function spawnTurret(x, y) {
    spawnEnt({
      type: 'turret',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 4, r: 14, score: 150,
      rgb: ORG,
      ground: true,
      w: 28, h: 24,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnTurrets() {
    const n = isSwarm() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 64 + i * ((VW - 128) / Math.max(1, n - 1)) + rand(-16, 16);
      spawnTurret(clamp(x, 48, VW - 48), -26 - i * 18);
    }
  }

  function spawnCourier() {
    spawnEnt({
      type: 'courier',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 78,
      hp: 2, r: 13, score: 300,
      rgb: GOLD,
      drop: 'cycle',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.midHp * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -60,
      vx: 56,
      vy: 48,
      hp: hp,
      r: 36,
      score: 2000,
      rgb: st.biome === 'fort' ? RED : CYN,
      drop: 'pwr',
      w: 76,
      h: 40,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(CYN, 0.36);
    kick(4.6);
  }

  function spawnBoss() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.bossHp * hpMul());
    spawnEnt({
      type: 'boss',
      x: VW * 0.5,
      y: -80,
      vx: 62,
      vy: 40,
      hp: hp,
      r: 52,
      score: 4000 + G.stage * 1500,
      rgb: MAG,
      drop: 'bomb',
      w: 124,
      h: 64,
      fireCd: 0.55,
      phase: 0,
      spin: 0
    });
    toast(st.boss, false, true);
    audio.boss();
    screenFlash(MAG, 0.42);
    kick(5.4);
  }

  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'mid' || t === 'boss') && G.ents[i].hp > 0) return true;
    }
    return false;
  }

  function findBig() {
    let mid = null;
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if (G.ents[i].hp <= 0) continue;
      if (t === 'boss') return G.ents[i];
      if (t === 'mid') mid = G.ents[i];
    }
    return mid;
  }

  function fireWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n);
    else if (w.kind === 'scouts') spawnScouts();
    else if (w.kind === 'heavy') {
      spawnHeavy();
      if (isSwarm()) spawnHeavy();
    } else if (w.kind === 'turrets') spawnTurrets();
    else if (w.kind === 'courier') spawnCourier();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vy: 62, t: 0,
      vx: rand(-38, 38),
      kind: kind || 'pwr'
    });
    capArr(G.pows, 7);
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length > shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: r || 3.05,
      rgb: rgb || MAG
    });
  }

  function aimShot(x, y, spd, rgb, r) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = hypot(dx, dy) || 1;
    eShot(x, y, dx / len * spd, dy / len * spd, rgb, r);
  }

  function ringShot(x, y, n, spd, rot, rgb, r) {
    for (let i = 0; i < n; i++) {
      const a = rot + (i * TAU) / n;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r);
    }
  }

  function addShot(spec) {
    if (G.shots.length > 64) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.2,
      rgb: spec.rgb,
      dmg: spec.dmg || 1,
      ang: spec.ang || 0,
      pierce: !!spec.pierce,
      hits: spec.pierce ? {} : null,
      life: spec.life || 0
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.pwr;
    const x = G.player.x;
    const y = G.player.y - 16;
    G.muzzle = 0.05;
    G.fireCd = 0.108 - lv * 0.012;
    const spd = -720;
    const rgb = lv >= 3 ? GOLD : lv >= 1 ? SKY : CYN;
    function bolt(ox, oy, vx, vy, r, dmg) {
      addShot({
        x: x + ox, y: y + oy,
        vx: vx || 0,
        vy: vy == null ? spd : vy,
        r: r || 3.1, rgb: rgb, dmg: dmg || 1,
        ang: Math.atan2(vy == null ? spd : vy, vx || 0)
      });
    }
    bolt(-7, 2);
    bolt(7, 2);
    if (lv >= 1) bolt(0, -3, 0, spd, 3.4);
    if (lv >= 2) {
      bolt(-16, 6, -90, spd);
      bolt(16, 6, 90, spd);
      bolt(-26, 8);
      bolt(26, 8);
    }
    if (lv >= 3) {
      bolt(-20, 8, -150, spd, 3.0);
      bolt(20, 8, 150, spd, 3.0);
    }
    audio.shoot();
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: rgb,
      g: 0
    });
  }

  function fireSuper() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    G.charge = 0;
    G.chargeReady = false;
    G.superT = 0.42;
    const x = G.player.x;
    const y = G.player.y - 18;
    const rgb = GOLD;
    function fork(ox, vx) {
      addShot({
        x: x + ox, y: y,
        vx: vx, vy: -820,
        r: 7.5, rgb: rgb, dmg: 8,
        ang: Math.atan2(-820, vx),
        pierce: true
      });
    }
    fork(-8, -30);
    fork(0, 0);
    fork(8, 30);
    if (G.pwr >= 2) {
      fork(-26, -70);
      fork(26, 70);
    }
    audio.super();
    hitStop(0.056);
    kick(5.8);
    screenFlash(GOLD, 0.55);
    popSpark(x, y - 8, GOLD, 36);
    rings.push({ x: x, y: y, t: 0, rgb: CYN, r: 22 });
    emit(22, {
      x: x, y: y, j: 16,
      vx0: -180, vx1: 180, vy0: -320, vy1: -40,
      life: 0.42, r0: 1.4, r1: 4.2, rgb: GOLD, g: 40
    });
    floatText(x, y - 22, '超射', GOLD, true);
    toast('超射', false, true);
    syncHud();
  }

  function doBomb() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.rainT > 0) return;
    if (G.bombs <= 0) {
      toast('爆弹用尽', true, false);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.rainT = 0.72;
    G.rainTick = 0;
    G.bombT = 0.52;
    G.invuln = Math.max(G.invuln, 0.52);
    G.eShots.length = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0) hurtEnt(G.ents[i], 6, G.ents[i].x, G.ents[i].y);
    }
    audio.bomb();
    hitStop(0.078);
    kick(7.4);
    screenFlash(GOLD, 0.62);
    popSpark(G.player.x, G.player.y, GOLD, 48);
    rings.push({ x: VW * 0.5, y: VH * 0.38, t: 0, rgb: GOLD, r: 28 });
    emit(28, {
      x: VW * 0.5, y: 80, j: 90,
      vx0: -160, vx1: 160, vy0: 80, vy1: 320,
      life: 0.55, r0: 1.4, r1: 4.2, rgb: GOLD, g: 80
    });
    toast('爆弹', false, true);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    syncHud();
  }

  function tickRain(dt) {
    if (G.rainT <= 0) return;
    G.rainT -= dt;
    G.rainTick -= dt;
    if (G.rainTick <= 0) {
      G.rainTick = 0.07;
      const xx = rand(24, VW - 24);
      rains.push({ x: xx, y: -16, t: 0, vy: 520 });
      for (let i = 0; i < G.ents.length; i++) {
        const en = G.ents[i];
        if (en.hp <= 0) continue;
        if (Math.abs(en.x - xx) < 42) hurtEnt(en, 2, en.x, en.y);
      }
      G.eShots.length = 0;
    }
    if (G.rainT <= 0) G.rainT = 0;
  }

  function hurtEnt(en, dmg, hx, hy) {
    if (en.hp <= 0) return;
    en.hp -= dmg || 1;
    en.flash = 0.08;
    if (en.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -80, vx1: 80, vy0: -90, vy1: 40,
        life: 0.16, r0: 1, r1: 2, rgb: WHT, g: 200
      });
      if (en.type === 'boss' || en.type === 'mid') hitStop(0.032);
      if (en.type === 'boss' && !en.formed && en.hp < en.maxHp * 0.5) {
        en.formed = true;
        en.r += 10;
        en.w += 18;
        toast('变形', false, true);
        audio.form();
        juice(en.x, en.y, MAG, 1.8);
        floatText(en.x, en.y - 28, '变形', MAG, true);
        hitStop(0.06);
      }
      return;
    }
    killEnt(en);
  }

  function killEnt(en) {
    if (en.hp < -90) return;
    en.hp = -99;
    bumpCombo();
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.ground ? 1.2 : 0.85;
    juice(en.x, en.y, en.rgb, pwr);
    audio.hit(G.combo);
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.drop === 'cycle') spawnPow(en.x, en.y, nextDropKind());
    else if (en.drop === 'bomb' || en.drop === 'pwr') spawnPow(en.x, en.y, en.drop);
    else if (en.drop === true) spawnPow(en.x, en.y, nextDropKind());
    else if (en.type === 'heavy' && Math.random() < 0.2) spawnPow(en.x, en.y, nextDropKind());
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(1500 * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      toast(STAGES[G.stage - 1] ? STAGES[G.stage - 1].name.replace(/^第 \d 关 · /, '') + '肃清' : '肃清', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (p.kind === 'bomb') {
      if (G.bombs < BOMB_CAP) {
        G.bombs += 1;
        toast('爆 +1', false, true);
      } else {
        addScore(800 * G.mult);
        toast('+800', false, true);
      }
    } else {
      if (G.pwr < PWR_MAX) {
        G.pwr += 1;
        toast(G.pwr >= PWR_MAX ? '火 MAX' : '火 强化', false, true);
      } else {
        addScore(500 * G.mult);
        toast('+500', false, true);
      }
      flashPwr();
    }
    juice(p.x, p.y, p.kind === 'bomb' ? WHT : GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, DROP_GLYPH[p.kind] || '火', p.kind === 'bomb' ? WHT : GOLD, true);
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    if (G.bombT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    breakCombo();
    G.fireHold = false;
    G.charge = 0;
    G.chargeReady = false;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.pwr > 0) spawnPow(G.player.x, G.player.y - 18, 'pwr');
    G.pwr = 0;
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    G.charge = 0;
    G.chargeReady = false;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '机毁了';
    saveBest();
    audio.lose();
    showOverlay('lose', '机毁了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function winGame() {
    addScore(isSwarm() ? 10000 : 8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', isSwarm() ? '机海尽破' : '空袭尽破', (isSwarm() ? '机海通关' : '三关打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function livingAir() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0 && !G.ents[i].ground) n += 1;
    }
    return n;
  }

  function raidThink() {
    if (G.stageClearT > 0 || hasBig()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function swarmThink(dt) {
    if (hasBig() || G.stageClearT > 0) return;
    raidThink();
    G.spawnT -= dt;
    if (G.spawnT <= 0 && livingAir() < 14) {
      const roll = Math.random();
      if (roll < 0.34) spawnV(7);
      else if (roll < 0.55) spawnDive(4);
      else if (roll < 0.72) spawnStream(Math.random() < 0.5 ? -1 : 1);
      else if (roll < 0.86) spawnHeavy();
      else spawnScouts();
      G.spawnT = 2.4 + rand(0, 0.8);
    }
  }

  function bossFire(en, swarm) {
    const ratio = en.hp / en.maxHp;
    const mid = ratio < 0.62;
    const low = ratio < 0.34;
    en.spin += 0.22;
    const stg = G.stage;
    const formed = !!en.formed;
    if (en.type === 'mid') {
      if (stg === 1) {
        aimShot(en.x, en.y + 10, swarm ? 196 : 164, HOT);
        eShot(en.x - 18, en.y + 10, -46, 176, CYN);
        eShot(en.x + 18, en.y + 10, 46, 176, CYN);
        if (mid) ringShot(en.x, en.y + 4, swarm ? 10 : 8, 128, en.spin, GOLD, 3.0);
        en.fireCd = low ? 0.42 : 0.7;
      } else if (stg === 2) {
        ringShot(en.x, en.y + 6, swarm ? 12 : 9, 134, en.t * 1.6, SKY, 3.05);
        if (mid) aimShot(en.x, en.y + 12, 188, HOT);
        en.fireCd = low ? 0.4 : 0.64;
      } else {
        ringShot(en.x, en.y + 4, swarm ? 14 : 10, 142, en.spin, RED, 3.1);
        aimShot(en.x - 18, en.y + 8, 176, MAG);
        aimShot(en.x + 18, en.y + 8, 176, MAG);
        en.fireCd = low ? 0.36 : 0.58;
      }
      if (swarm) en.fireCd *= 0.76;
      return;
    }
    if (stg === 1) {
      eShot(en.x - 32, en.y + 16, -52, 200, RED);
      eShot(en.x, en.y + 20, 0, 216, MAG);
      eShot(en.x + 32, en.y + 16, 52, 200, RED);
      if (mid) ringShot(en.x, en.y + 8, swarm ? 12 : 9, 138, en.spin, PNK, 3.1);
      if (formed) {
        eShot(en.x - 48, en.y + 8, -28, 168, CYN);
        eShot(en.x + 48, en.y + 8, 28, 168, CYN);
      }
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 16, en.y + 22, k * 44, 214, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 10, swarm ? 14 : 11, 146, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 10, swarm ? 10 : 8, 118, -en.spin * 1.4, GOLD, 3.0);
        aimShot(en.x, en.y + 18, 200, HOT);
      }
      if (formed) {
        aimShot(en.x - 36, en.y + 8, 188, CYN);
        aimShot(en.x + 36, en.y + 8, 188, CYN);
      }
      if (low) {
        aimShot(en.x - 30, en.y + 12, 224, RED);
        aimShot(en.x + 30, en.y + 12, 224, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 8, swarm ? 16 : 12, 152, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 8, swarm ? 10 : 8, 108, -en.spin * 0.7, GOLD, 2.8);
      if (mid) {
        aimShot(en.x - 22, en.y + 16, 214, PNK);
        aimShot(en.x + 22, en.y + 16, 214, PNK);
      }
      if (formed) {
        ringShot(en.x, en.y, swarm ? 12 : 10, 160, en.t * 2.4, CYN, 3.2);
      }
      if (low) {
        ringShot(en.x, en.y, swarm ? 18 : 14, 168, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (swarm) en.fireCd *= 0.76;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0 || G.bombT > 0;
    const swarm = isSwarm();
    const scr = scrollSpd();

    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.ground && en.type !== 'mid' && en.type !== 'boss') {
        en.y += scr * dt;
      } else if (en.type === 'mid' || en.type === 'boss') {
        const park = en.type === 'boss' ? 112 : 126;
        if (en.y < park) en.y += en.vy * dt;
        else {
          en.y = park;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 96 : 80;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
      } else if (en.type === 'courier') {
        en.x += en.phase * 108 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 68;
        }
      } else if (en.type === 'heavy') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < 50 || en.x > VW - 50) en.vx *= -1;
      } else if (en.type === 'dive') {
        if (en.t > 0.32) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 182;
          en.vx = lerp(en.vx, dx / len * asp, 1 - Math.exp(-dt * 3.1));
          en.vy = lerp(en.vy, dy / len * asp, 1 - Math.exp(-dt * 3.1));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'scout') {
        if (!en.dive && en.t > 1.28 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.28) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 92, dt * 2);
          en.vy = Math.max(en.vy, 154);
        }
        en.phase += dt * 3.2;
        en.x += en.vx * dt + Math.sin(en.phase || 0) * 8 * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'fighter') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 5) * 16 * dt;
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 52 || en.x < -72 || en.x > VW + 72 || (en.ground && en.y > VH + 42)) {
        G.ents.splice(i, 1);
        continue;
      }

      if (playing && en.y > -10 && en.y < VH + 10) {
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          if (en.type === 'scout' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, swarm ? 198 : 172, MAG);
            if (swarm && Math.random() < 0.45) aimShot(en.x, en.y + 8, 168, PNK);
            en.fireCd = (swarm ? 1.3 : 2.3) + rand(0, 0.55);
          } else if (en.type === 'fighter' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x, en.y + 8, swarm ? 196 : 164, MAG);
            eShot(en.x - 8, en.y + 6, -24, 156, HOT);
            eShot(en.x + 8, en.y + 6, 24, 156, HOT);
            en.fireCd = swarm ? 0.78 : 1.12;
          } else if (en.type === 'heavy' && en.y > 20 && en.y < VH - 70) {
            eShot(en.x - 10, en.y + 10, -36, 176, RED);
            eShot(en.x, en.y + 12, 0, 196, RED);
            eShot(en.x + 10, en.y + 10, 36, 176, RED);
            if (swarm) aimShot(en.x, en.y + 8, 186, HOT);
            en.fireCd = swarm ? 0.68 : 0.98;
          } else if (en.type === 'turret' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, swarm ? 218 : 176, ORG);
            if (swarm) {
              eShot(en.x - 8, en.y + 4, -42, 164, HOT);
              eShot(en.x + 8, en.y + 4, 42, 164, HOT);
            }
            en.fireCd = (swarm ? 0.62 : 1.02) + rand(0, 0.24);
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, swarm);
            else en.fireCd = 0.4;
          } else {
            en.fireCd = 2;
          }
        }
      }

      if (canHurt && !en.ground) {
        const rr = en.r + 4.6;
        const dx = en.x - px;
        const dy = en.y - py;
        if (dx * dx + dy * dy < rr * rr) {
          if (!inv) killPlayer();
        }
      }
    }
  }

  function updateShots(dt) {
    const playing = G.mode === 'play';
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life > 0) {
        s.life -= dt;
        if (s.life <= 0) {
          G.shots.splice(i, 1);
          continue;
        }
      }
      if (s.y < -28 || s.x < -20 || s.x > VW + 20 || s.y > VH + 28) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (s.pierce && s.hits && s.hits[en.id]) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(en, s.dmg || 1, s.x, s.y);
          if (s.pierce) {
            if (s.hits) s.hits[en.id] = true;
            hitStop(0.028);
          } else {
            hit = true;
            hitStop(0.022);
          }
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    const canHurt = playing && G.deadT <= 0 && G.invuln <= 0 && G.bombT <= 0;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y > VH + 22 || s.y < -32 || s.x < -22 || s.x > VW + 22) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (canHurt) {
        const dx = s.x - G.player.x;
        const dy = s.y - (G.player.y - 2);
        const rr = 4.6 + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          G.eShots.splice(i, 1);
          killPlayer();
        }
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 1.15);
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (p.y > VH + 22) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = p.x - G.player.x;
        const dy = p.y - G.player.y;
        if (dx * dx + dy * dy < 24 * 24) {
          pickPow(p);
          G.pows.splice(i, 1);
        }
      }
    }
  }

  function updateWorld(dt) {
    const scr = scrollSpd();
    G.scroll += scr * dt;
    for (let i = 0; i < flakes.length; i++) {
      const s = flakes[i];
      s.y += scr * 0.55 * s.z * dt;
      s.x += Math.sin(G.t * 0.8 + s.spin) * 10 * dt;
      s.spin += dt * 1.2;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < isles.length; i++) {
      const isl = isles[i];
      isl.y += scr * dt;
      if (isl.y - isl.h > VH + 30) {
        isl.y = -60 - rand(0, 80);
        isl.x = hash2((G.scroll + isl.w) | 0) * VW;
        isl.w = 36 + hash2((G.scroll * 0.1) | 0) * 70;
        isl.h = 22 + hash2((G.scroll * 0.13) | 0) * 28;
        isl.kind = hash2(G.scroll | 0);
      }
    }
    if (!REDUCE && G.mode !== 'lose' && G.deadT <= 0) {
      wash.push({
        x: G.player.x + rand(-8, 8),
        y: G.player.y + 14,
        t: 0,
        r: rand(5, 10)
      });
      capArr(wash, 16);
    }
    for (let i = wash.length - 1; i >= 0; i--) {
      wash[i].t += dt * 2.4;
      wash[i].y += 28 * dt;
      if (wash[i].t >= 1) wash.splice(i, 1);
    }
    for (let i = rains.length - 1; i >= 0; i--) {
      rains[i].t += dt;
      rains[i].y += rains[i].vy * dt;
      if (rains[i].y > VH + 20 || rains[i].t > 1.2) rains.splice(i, 1);
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      p.vx *= Math.exp(-dt * 1.8);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.6;
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
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.toastT > 0) G.toastT -= dt;
    if (G.bombT > 0) G.bombT -= dt;
    if (G.superT > 0) G.superT -= dt;
  }

  function tickProp(dt) {
    G.propAng += dt * (REDUCE ? 8 : 30);
    G.propT -= dt;
    if (G.propT > 0) return;
    G.propT = G.mode === 'play' && G.deadT <= 0 ? 0.09 : 0.16;
    if (G.mode === 'lose') return;
    if (audio.ctx && !audio.muted) audio.prop();
  }

  function tickCharge(dt) {
    if (G.mode !== 'play' || G.deadT > 0) {
      G.charge = 0;
      G.chargeReady = false;
      return;
    }
    if (G.fireHold) {
      const before = G.charge;
      G.charge = Math.min(1, G.charge + dt / CHARGE_T);
      if (G.charge >= 1 && !G.chargeReady) {
        G.chargeReady = true;
        audio.chargeReady();
        floatText(G.player.x, G.player.y - 26, '超', GOLD, true);
        popSpark(G.player.x, G.player.y, GOLD, 22);
        syncHud();
      } else if (!G.chargeReady && ((G.charge * 8) | 0) !== ((before * 8) | 0)) {
        audio.chargeTick();
      }
    } else if (G.chargeReady) {
      fireSuper();
    } else if (G.charge > 0) {
      G.charge = 0;
      syncHud();
    }
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
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      const tx = clamp(pointer.x, 22, VW - 22);
      const ty = clamp(pointer.y, 40, VH - 28);
      G.player.x = lerp(G.player.x, tx, 1 - Math.exp(-dt * 16));
      G.player.y = lerp(G.player.y, ty, 1 - Math.exp(-dt * 16));
      G.player.vx = 0;
      G.player.vy = 0;
    } else {
      G.player.vx *= Math.exp(-dt * 10);
      G.player.vy *= Math.exp(-dt * 10);
    }
    G.player.x += G.player.vx * dt;
    G.player.y += G.player.vy * dt;
    G.player.x = clamp(G.player.x, 22, VW - 22);
    G.player.y = clamp(G.player.y, 40, VH - 28);
    const wantBank = clamp(G.player.vx * 0.0018, -0.28, 0.28);
    G.player.bank = lerp(G.player.bank || 0, wantBank, 1 - Math.exp(-dt * 10));
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
    tickRain(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.player.bank = Math.sin(G.t * 0.7) * 0.12;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingAir() < 8) {
        spawnV(5, VW * 0.5 + Math.sin(G.t) * 40);
        G.spawnT = 2.5;
      }
      updateEnts(dt);
      updateWorld(dt * 0.55);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      G.scroll += 22 * dt;
      updateWorld(dt * 0.5);
      return;
    }

    G.clock += dt;
    if (!hasBig()) G.stageT += dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
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
        if (G.bombs < BOMB_CAP) G.bombs += 1;
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    updatePlayer(dt);
    tickCharge(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isSwarm()) swarmThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function drawIsle(isl, bio) {
    const x = sx(isl.x);
    const y = sy(isl.y);
    const w = isl.w * scale;
    const h = isl.h * scale;
    ctx.save();
    if (bio === 'fort') {
      ctx.fillStyle = 'rgba(28, 12, 18, 0.92)';
      ctx.fillRect(x - w * 0.42, y - h * 0.2, w * 0.84, h * 0.55);
      ctx.fillStyle = rgba(MAG, 0.28);
      ctx.fillRect(x - w * 0.18, y - h * 0.55, w * 0.36, h * 0.42);
      ctx.fillStyle = 'rgba(18, 8, 12, 0.9)';
      ctx.fillRect(x - w * 0.08, y - h * 0.72, w * 0.16, h * 0.28);
    } else if (bio === 'snow') {
      ctx.fillStyle = 'rgba(18, 36, 52, 0.9)';
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.7);
      ctx.lineTo(x + w * 0.48, y + h * 0.18);
      ctx.lineTo(x - w * 0.48, y + h * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.22);
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.7);
      ctx.lineTo(x + w * 0.16, y - h * 0.22);
      ctx.lineTo(x - w * 0.16, y - h * 0.22);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(10, 28, 42, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x, y, w * 0.5, h * 0.32, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(NAV, 0.95);
      ctx.fillRect(x - w * 0.28, y - h * 0.18, w * 0.56, h * 0.22);
      ctx.fillStyle = rgba(CYN, 0.22);
      ctx.fillRect(x - w * 0.08, y - h * 0.38, w * 0.08, h * 0.28);
    }
    ctx.restore();
  }

  function drawWorld() {
    const bio = biome();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (bio === 'fort') {
      g.addColorStop(0, '#140810');
      g.addColorStop(0.5, '#0c0610');
      g.addColorStop(1, '#08040c');
    } else if (bio === 'snow') {
      g.addColorStop(0, '#081420');
      g.addColorStop(0.5, '#061018');
      g.addColorStop(1, '#040c14');
    } else {
      g.addColorStop(0, '#061820');
      g.addColorStop(0.5, '#041018');
      g.addColorStop(1, '#030a12');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.save();
    ctx.strokeStyle = bio === 'fort'
      ? 'rgba(90, 24, 48, 0.32)'
      : bio === 'snow'
        ? 'rgba(40, 80, 110, 0.3)'
        : 'rgba(20, 70, 96, 0.32)';
    ctx.lineWidth = 1;
    const off = (G.scroll * 0.4) % 36;
    for (let i = -1; i < 24; i++) {
      const yy = sy(i * 36 - off);
      ctx.beginPath();
      ctx.moveTo(sx(0), yy);
      ctx.lineTo(sx(VW), yy);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < flakes.length; i++) {
      const s = flakes[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(s.spin);
      ctx.fillStyle = bio === 'fort'
        ? rgba(MAG, s.a * 0.35)
        : bio === 'snow'
          ? rgba(WHT, s.a * 0.55)
          : rgba(CYN, s.a * 0.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, s.s * 0.42 * scale, s.s * 0.18 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    for (let i = 0; i < isles.length; i++) drawIsle(isles[i], bio);

    for (let i = 0; i < wash.length; i++) {
      const w = wash[i];
      ctx.strokeStyle = rgba(CYN, (1 - w.t) * 0.22);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(w.y), w.r * (0.6 + w.t) * scale, w.r * 0.35 * scale, 0, 0, TAU);
      ctx.stroke();
    }
  }

  function drawProp(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(G.propAng);
    ctx.strokeStyle = rgba(WHT, 0.7);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.moveTo(0, -2.6);
    ctx.lineTo(0, 2.6);
    ctx.stroke();
    ctx.restore();
  }

  function drawFork(x, y, bank, size) {
    size = size || 1;
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(bank || 0);
    ctx.scale(scale * size, scale * size);
    if (G.muzzle > 0 && size >= 1) {
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.moveTo(-7, -20);
      ctx.lineTo(-4, -12);
      ctx.lineTo(-10, -12);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(7, -20);
      ctx.lineTo(10, -12);
      ctx.lineTo(4, -12);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = rgba(INK, 0.95);
    ctx.fillRect(-16, -2, 32, 3.4);
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.ellipse(-7, 1, 4.2, 12, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(7, 1, 4.2, 12, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-15, -1.2, 30, 2.4);
    ctx.fillRect(-11, 6, 22, 2);
    ctx.fillStyle = rgba(SKY, 0.9);
    ctx.fillRect(-3, 8, 6, 8);
    ctx.beginPath();
    ctx.moveTo(-10, 10);
    ctx.lineTo(-7, 16);
    ctx.lineTo(-4, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(7, 16);
    ctx.lineTo(4, 10);
    ctx.fill();
    drawProp(-7, -11);
    drawProp(7, -11);
    ctx.fillStyle = rgba(WHT, 0.5);
    ctx.beginPath();
    ctx.ellipse(-7, -1, 1.8, 2.8, 0, 0, TAU);
    ctx.ellipse(7, -1, 1.8, 2.8, 0, 0, TAU);
    ctx.fill();
    if (G.chargeReady && size >= 1) {
      ctx.strokeStyle = rgba(GOLD, 0.85);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 18 + Math.sin(G.t * 14) * 1.4, 0, TAU);
      ctx.stroke();
    } else if (G.charge > 0.08 && size >= 1) {
      ctx.strokeStyle = rgba(CYN, 0.55 + G.charge * 0.4);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + TAU * G.charge);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlane(x, y, bank) {
    if (G.superT > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      drawFork(x, y - 6, bank, 1.28);
      ctx.restore();
    }
    drawFork(x, y, bank, 1);
    if (G.pwr >= 2 && G.deadT <= 0) {
      const wob = Math.sin(G.t * 7) * 2;
      drawFork(x - 26, y + 10 + wob, bank * 0.6, 0.55);
      drawFork(x + 26, y + 10 - wob, bank * 0.6, 0.55);
    }
  }

  function drawEnt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? rgba(WHT, 0.95) : rgba(en.rgb, 0.95);
    ctx.shadowColor = rgba(en.rgb, 0.55);
    ctx.shadowBlur = 8;
    if (en.type === 'scout') {
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(8, 3);
      ctx.lineTo(0, 7);
      ctx.lineTo(-8, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.45);
      ctx.fillRect(-10, 0, 20, 2);
    } else if (en.type === 'fighter') {
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(10, 2);
      ctx.lineTo(0, 8);
      ctx.lineTo(-10, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(HOT, 0.7);
      ctx.fillRect(-12, 1, 24, 2.2);
    } else if (en.type === 'dive') {
      ctx.rotate(Math.atan2(en.vy, en.vx) + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(7, 2);
      ctx.lineTo(0, 11);
      ctx.lineTo(-7, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-1.2, 8, 2.4, 8);
    } else if (en.type === 'heavy') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 11, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-18, 0, 36, 3.4);
      ctx.fillStyle = rgba(GOLD, 0.65);
      ctx.fillRect(-5, -4, 10, 6);
    } else if (en.type === 'turret') {
      ctx.fillRect(-11, 2, 22, 10);
      ctx.beginPath();
      ctx.arc(0, 2, 8, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-2, -12, 4, 14);
    } else if (en.type === 'courier') {
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(14, 4);
      ctx.lineTo(0, 9);
      ctx.lineTo(-14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(-5, -2, 10, 6);
    } else if (en.type === 'mid') {
      if (G.stage === 1) {
        ctx.fillRect(-34, -2, 68, 16);
        ctx.fillRect(-10, -14, 20, 14);
        ctx.fillRect(-28, 6, 8, 12);
        ctx.fillRect(20, 6, 8, 12);
        ctx.fillStyle = rgba(GOLD, 0.65);
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, TAU);
        ctx.fill();
      } else if (G.stage === 2) {
        ctx.fillRect(-30, 2, 60, 16);
        ctx.fillRect(-22, -10, 44, 14);
        ctx.fillStyle = rgba(SKY, 0.6);
        ctx.fillRect(-8, -4, 16, 8);
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 2, 28, 14, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-8, -16, 16, 14);
        ctx.fillStyle = rgba(MAG, 0.7);
        ctx.fillRect(-5, -4, 10, 10);
      }
    } else if (en.type === 'boss') {
      const formed = en.formed;
      if (G.stage === 1) {
        ctx.fillRect(-56, -4, 112, 28);
        ctx.fillRect(-20, -22, 40, 20);
        ctx.fillRect(-42, -8, 10, 32);
        ctx.fillRect(32, -8, 10, 32);
        if (formed) {
          ctx.fillRect(-70, -18, 16, 36);
          ctx.fillRect(54, -18, 16, 36);
          ctx.fillStyle = rgba(GOLD, 0.8);
          ctx.beginPath();
          ctx.arc(0, 4, 10, 0, TAU);
          ctx.fill();
        } else {
          ctx.fillStyle = rgba(GOLD, 0.55);
          ctx.fillRect(-24, -28, 48, 6);
        }
      } else if (G.stage === 2) {
        ctx.fillRect(-40, 6, 80, 18);
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(50, 8);
        ctx.lineTo(-50, 8);
        ctx.closePath();
        ctx.fill();
        if (formed) {
          ctx.fillRect(-58, 8, 14, 28);
          ctx.fillRect(44, 8, 14, 28);
          ctx.fillStyle = rgba(SKY, 0.75);
          ctx.fillRect(-10, -6, 20, 12);
        } else {
          ctx.fillStyle = rgba(SKY, 0.55);
          ctx.fillRect(-10, -8, 20, 10);
        }
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 6, 48, 20, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-10, -26, 20, 24);
        ctx.beginPath();
        ctx.moveTo(0, -36);
        ctx.lineTo(12, -20);
        ctx.lineTo(-12, -20);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(GOLD, 0.7);
        ctx.beginPath();
        ctx.ellipse(-40, 4, 18, 7, -0.45, 0, TAU);
        ctx.ellipse(40, 4, 18, 7, 0.45, 0, TAU);
        ctx.fill();
        if (formed) {
          ctx.fillStyle = rgba(MAG, 0.85);
          ctx.beginPath();
          ctx.arc(0, 4, 12, 0, TAU);
          ctx.fill();
          ctx.fillStyle = rgba(GOLD, 0.9);
          ctx.beginPath();
          ctx.arc(0, 4, 5, 0, TAU);
          ctx.fill();
        }
      }
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-28, 6, 56, 6);
    }
    ctx.restore();
  }

  function drawRain() {
    for (let i = 0; i < rains.length; i++) {
      const r = rains[i];
      ctx.save();
      ctx.translate(sx(r.x), sy(r.y));
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.shadowColor = rgba(GOLD, 0.8);
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -10);
      ctx.lineTo(5, 2);
      ctx.lineTo(0, 8);
      ctx.lineTo(-5, 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    if (G.rainT > 0) {
      const a = clamp(G.rainT / 0.72, 0, 1);
      ctx.fillStyle = rgba(GOLD, 0.08 * a);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(s.ang || -Math.PI / 2);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.85);
      ctx.shadowBlur = s.pierce ? 14 : 9;
      if (s.pierce) {
        ctx.beginPath();
        ctx.moveTo(0, -16);
        ctx.lineTo(5, 4);
        ctx.lineTo(0, 12);
        ctx.lineTo(-5, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.8);
        ctx.fillRect(-1.6, -14, 3.2, 28);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(3.0, 2);
        ctx.lineTo(0, 7);
        ctx.lineTo(-3.0, 2);
        ctx.closePath();
        ctx.fill();
        if (!REDUCE) {
          ctx.globalAlpha = 0.32;
          ctx.fillRect(-1.1, 4, 2.2, 10);
        }
      }
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.75);
      ctx.shadowBlur = 7 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.55);
      ctx.beginPath();
      ctx.arc(sx(s.x - 0.6), sy(s.y - 0.6), s.r * 0.35 * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 8) * 2;
      const rgb = p.kind === 'bomb' ? WHT : GOLD;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.rotate(p.t * 2.2);
      ctx.scale(scale, scale);
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.shadowColor = rgba(rgb, 0.8);
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(11, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#041018';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.2);
      ctx.shadowBlur = 0;
      ctx.fillText(DROP_GLYPH[p.kind] || '火', 0, 1);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.3), 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), Math.max(0.6, p.r * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = 3 * (1 - r.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 46) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = rgba(f.rgb, 0.7);
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawBossBar() {
    const boss = findBig();
    if (!boss) return;
    const x = 40;
    const y = 16;
    const w = VW - 80;
    const h = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    const t = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : CYN, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : CYN, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#030a12';
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
    drawWorld();

    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawPows();
    drawRain();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawPlane(G.player.x, G.player.y, G.player.bank);
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
    G.pows.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wash.length = 0;
    rains.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'swarm' ? 'swarm' : 'raid';
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
    G.pwr = 0;
    G.bombs = 3;
    G.bombT = 0;
    G.rainT = 0;
    G.charge = 0;
    G.chargeReady = false;
    G.superT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.bank = 0;
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
    G.stageClearT = 0;
    G.dropI = 0;
    G.propT = 0;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isSwarm() ? '机海 · 弹更密' : '空袭 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.lives = LIVES;
    G.pwr = 0;
    G.bombs = 3;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.rainT = 0;
    G.charge = 0;
    G.chargeReady = false;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '打击',
      '开双叉战机向上打。空格连射并蓄力，松手超射贯穿。每关先中破再巨舰。撞机扣命。'
    );
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else startGame(G.kind || 'raid');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('raid');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('swarm');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isSwarm()) goTitle();
      else startGame('swarm');
    }
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const bombKey = k === 'Shift' || k === 'z' || k === 'Z' || code === 'ShiftLeft' || code === 'ShiftRight';

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

    if (down && (isMove || space || k === 'Enter' || bombKey)) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      if (bombKey) keys.bomb = false;
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
    if (bombKey) {
      if (!keys.bomb) {
        keys.bomb = true;
        if (!overlayOpen() && G.mode === 'play') doBomb();
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

  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnSwarm) {
    btnSwarm.addEventListener('click', function () {
      audio.ensure();
      startGame('swarm');
    });
  }
  if (ovRetry) {
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovModes) {
    ovModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win' && isSwarm()) goTitle();
      else if (G.mode === 'win') startGame('swarm');
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
  function bombClick(e) {
    if (e) e.preventDefault();
    audio.ensure();
    doBomb();
  }
  if (btnBomb) btnBomb.addEventListener('click', bombClick);
  if (btnPad) btnPad.addEventListener('click', bombClick);

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
      keys.bomb = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
