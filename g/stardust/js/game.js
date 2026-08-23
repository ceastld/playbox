'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.48;
  const BOMB_CAP = 6;
  const HIT_R = 4.5;
  const MAG_R = 138;
  const BEST_KEY = 'playbox-stardust-best';
  const MUTE_KEY = 'playbox-stardust-mute';
  const OPS = '方向 / WASD 飞 · 空格开火 · Shift / Z 尘爆 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 74, 216];
  const CYN = [92, 232, 255];
  const VIO = [138, 108, 255];
  const GOLD = [255, 227, 107];
  const WHT = [244, 240, 255];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 168, 88];
  const ICE = [180, 210, 255];

  const ROCK_R = [0, 9, 16, 28];
  const ROCK_HP = [0, 1, 3, 6];
  const ROCK_SC = [0, 40, 80, 160];
  const CRY_HP = [0, 1, 4, 8];
  const CRY_SC = [0, 50, 100, 200];

  const STAGES = [
    {
      name: '第 1 关 · 岩带',
      mid: '岩卫',
      boss: '碎岩',
      midHp: 34,
      bossHp: 84,
      waves: [
        { t: 0.6, kind: 'rocks', n: 3, size: 3 },
        { t: 3.1, kind: 'v', n: 5 },
        { t: 5.6, kind: 'rocks', n: 4, size: 2 },
        { t: 8.0, kind: 'spinner' },
        { t: 10.4, kind: 'rocks', n: 3, size: 3 },
        { t: 12.8, kind: 'dive', n: 4 },
        { t: 15.2, kind: 'mid' },
        { t: 22.0, kind: 'rocks', n: 5, size: 2 },
        { t: 24.4, kind: 'seekers', n: 3 },
        { t: 26.8, kind: 'v', n: 7 },
        { t: 29.4, kind: 'crystals', n: 3, size: 3 },
        { t: 32.2, kind: 'spinner' },
        { t: 34.8, kind: 'rocks', n: 4, size: 3 },
        { t: 42.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 晶廊',
      mid: '晶盾',
      boss: '棱镜',
      midHp: 46,
      bossHp: 112,
      waves: [
        { t: 0.5, kind: 'crystals', n: 4, size: 3 },
        { t: 2.8, kind: 'v', n: 6 },
        { t: 5.2, kind: 'rocks', n: 3, size: 3 },
        { t: 7.4, kind: 'spinner' },
        { t: 9.6, kind: 'crystals', n: 5, size: 2 },
        { t: 12.0, kind: 'dive', n: 5 },
        { t: 14.4, kind: 'seekers', n: 3 },
        { t: 16.6, kind: 'mid' },
        { t: 23.4, kind: 'crystals', n: 4, size: 3 },
        { t: 25.8, kind: 'v', n: 8 },
        { t: 28.2, kind: 'rocks', n: 4, size: 3 },
        { t: 30.6, kind: 'spinner' },
        { t: 33.0, kind: 'crystals', n: 5, size: 2 },
        { t: 35.6, kind: 'dive', n: 5 },
        { t: 38.2, kind: 'seekers', n: 4 },
        { t: 44.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 核环',
      mid: '环卫',
      boss: '尘核',
      midHp: 58,
      bossHp: 156,
      waves: [
        { t: 0.4, kind: 'rocks', n: 5, size: 3 },
        { t: 2.4, kind: 'crystals', n: 4, size: 3 },
        { t: 4.6, kind: 'v', n: 7 },
        { t: 6.8, kind: 'spinner' },
        { t: 8.8, kind: 'seekers', n: 4 },
        { t: 11.0, kind: 'rocks', n: 5, size: 2 },
        { t: 13.2, kind: 'dive', n: 6 },
        { t: 15.4, kind: 'crystals', n: 4, size: 3 },
        { t: 17.4, kind: 'mid' },
        { t: 24.6, kind: 'rocks', n: 6, size: 3 },
        { t: 26.8, kind: 'v', n: 9 },
        { t: 29.0, kind: 'spinner' },
        { t: 31.0, kind: 'crystals', n: 5, size: 3 },
        { t: 33.2, kind: 'seekers', n: 5 },
        { t: 35.4, kind: 'dive', n: 6 },
        { t: 37.6, kind: 'rocks', n: 5, size: 3 },
        { t: 40.0, kind: 'spinner' },
        { t: 46.0, kind: 'boss' }
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
  const btnDust = document.getElementById('btn-dust');
  const btnShard = document.getElementById('btn-shard');
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
  const wpnLabel = document.getElementById('wpn-label');
  const bombLabel = document.getElementById('bomb-label');
  const comboEl = document.getElementById('combo-label');
  const heatBar = document.getElementById('heat-bar');
  const heatWrap = document.getElementById('heat-wrap');
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
  let lastLv = 0;
  let dustSfxT = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const debris = [];

  const G = {
    mode: 'title',
    kind: 'dust',
    t: 0,
    clock: 0,
    stage: 1,
    stageT: 0,
    waveI: 0,
    scroll: 0,
    player: { x: VW * 0.5, y: VH - 90, vx: 0, vy: 0 },
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    heat: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    ents: [],
    shots: [],
    eShots: [],
    dust: [],
    pows: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: VIO,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    tunnel: false,
    tunnelT: 0,
    tunnelDur: 7.6,
    why: ''
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
  function isShard() {
    return G.kind === 'shard';
  }
  function heatLv() {
    if (G.heat >= 75) return 3;
    if (G.heat >= 45) return 2;
    if (G.heat >= 20) return 1;
    return 0;
  }
  function plySpd() {
    return (isShard() ? 304 : 268) + heatLv() * 8;
  }
  function scrollSpd() {
    if (G.tunnel) return isShard() ? 168 : 142;
    if (hasBig()) return isShard() ? 32 : 24;
    const base = isShard() ? 102 : 72;
    const rush = G.combo >= 8 ? 14 : G.combo >= 4 ? 7 : 0;
    return base + rush + (G.stage - 1) * (isShard() ? 9 : 7);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isShard() ? 160 : 110;
  }
  function hpMul() {
    return isShard() ? 1.24 : 1;
  }
  function tunnelGap() {
    return isShard() ? 152 : 172;
  }
  function tunnelLeftAt(y) {
    const t = G.scroll * 0.012 + G.t * 1.15;
    const wave = Math.sin(y * 0.018 + t) * 38 + Math.sin(y * 0.007 + t * 0.6) * 18;
    return VW * 0.5 - tunnelGap() * 0.5 + wave;
  }
  function tunnelRightAt(y) {
    return tunnelLeftAt(y) + tunnelGap();
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
      const lv = heatLv();
      this.beep(620 + lv * 90, 0.046, 'square', 0.028, 1480 + lv * 80);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1100);
      this.beep(500 * lift, 0.07, 'square', 0.042, 880 * lift);
    },
    split() {
      this.ensure();
      this.noise(0.05, 0.04, 700);
      this.beep(240, 0.1, 'sawtooth', 0.04, 90);
    },
    dust(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.85, combo * 0.045);
      this.beep(920 * lift, 0.042, 'sine', 0.03, 1400 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.18 : 0.09, big ? 0.074 : 0.046, big ? 240 : 480);
      this.beep(big ? 170 : 260, big ? 0.24 : 0.13, 'sawtooth', 0.05, 55);
    },
    bomb() {
      this.ensure();
      this.noise(0.28, 0.08, 180);
      this.beep(90, 0.42, 'sawtooth', 0.07, 40);
      this.beep(740, 0.2, 'sine', 0.04, 220);
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
      this.noise(0.14, 0.055, 350);
      this.beep(300, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.3, 'sine', 0.045, 46);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    boss() {
      this.ensure();
      this.beep(196, 0.16, 'sawtooth', 0.05, 110);
      this.beep(147, 0.28, 'square', 0.04, 80);
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
    heatup() {
      this.ensure();
      this.beep(660, 0.07, 'square', 0.04, 990);
      this.beep(990, 0.12, 'triangle', 0.038, 1320);
    },
    tunnel() {
      this.ensure();
      this.beep(196, 0.12, 'sine', 0.04, 392);
      this.beep(392, 0.16, 'triangle', 0.04, 784);
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

  function wpnText() {
    const lv = heatLv();
    if (lv >= 3) return '尘 MAX';
    if (lv <= 0) return '尘';
    return '尘 ' + ['', 'Ⅱ', 'Ⅲ', 'Ⅳ'][lv];
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
      if (G.tunnel) stageLabel.textContent = '跃迁';
      else {
        const st = STAGES[G.stage - 1];
        stageLabel.textContent = st ? st.name : '第 ' + G.stage + ' 关';
      }
      stageLabel.classList.toggle('hot', G.tunnel || G.stage >= 3 || hasBig());
    }
    if (tagLabel) {
      tagLabel.textContent = isShard() ? '碎光' : '星尘';
      tagLabel.classList.toggle('warn', isShard());
      tagLabel.classList.toggle('hot', !isShard() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('max', heatLv() >= 3);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (btnBomb) btnBomb.disabled = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
    if (btnPad) btnPad.disabled = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
    if (heatBar) heatBar.style.transform = 'scaleX(' + clamp(G.heat / 100, 0, 1) + ')';
    if (heatWrap) {
      heatWrap.classList.toggle('hot', heatLv() >= 3);
      heatWrap.classList.toggle('low', G.heat < 20 && G.mode === 'play');
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
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或撞岩扣一命', 'warn');
    else if (G.mode === 'win') setHint('尘核尽破 · R 再来一局', 'hot');
    else if (G.tunnel) setHint('跃迁廊 · 贴中吸尘 · 别撞壁', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 尘爆清屏', 'warn');
    else setHint('方向飞 · 空格开火 · Shift 尘爆 · 打岩吸尘', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'SDST';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovRetry) ovRetry.textContent = '再来';
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isShard() ? '换模式' : '碎光';
      else ovModes.textContent = '换模式';
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
        g: spec.g == null ? 520 : spec.g
      });
    }
    capArr(particles, 380);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 48);
    capArr(rings, 30);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 0.9 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -86 : -70
    });
    capArr(floats, 30);
  }

  function juice(x, y, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, y: y, j: 6 + p * 5,
      vx0: -190 * p, vx1: 190 * p, vy0: -240 * p, vy1: 100 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.6 + p, rgb: rgb
    });
    popSpark(x, y, rgb, 10 + p * 10);
    screenFlash(rgb, 0.16 + p * 0.12);
    kick(2.2 + p * 2.6);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 78; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.5),
        a: rand(0.16, 0.72),
        rgb: Math.random() < 0.22 ? GOLD : Math.random() < 0.45 ? CYN : WHT
      });
    }
  }

  function seedDebris() {
    debris.length = 0;
    for (let i = 0; i < 14; i++) {
      debris.push({
        x: rand(0, VW),
        y: rand(0, VH),
        r: rand(6, 18),
        a: rand(0, TAU),
        spin: rand(-0.6, 0.6),
        z: rand(0.25, 0.7),
        seed: (Math.random() * 9999) | 0
      });
    }
  }

  function makeVerts(seed, n, r, jagged) {
    const v = [];
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU;
      const k = jagged ? 0.66 + hash2(seed * 13 + i * 97) * 0.52 : 0.92 + hash2(seed + i) * 0.12;
      v.push(Math.cos(ang) * r * k, Math.sin(ang) * r * k);
    }
    return v;
  }

  function spawnDust(x, y, n, big) {
    n = n || 4;
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU);
      const spd = rand(40, 150);
      G.dust.push({
        x: x + rand(-6, 6),
        y: y + rand(-6, 6),
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        t: 0,
        big: !!big && i === 0,
        rgb: i % 3 === 0 ? GOLD : i % 3 === 1 ? CYN : WHT
      });
    }
    capArr(G.dust, 220);
  }

  function spawnEnt(spec) {
    if (G.ents.length > 64) return null;
    const en = {
      type: spec.type,
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy || 0,
      hp: spec.hp,
      maxHp: spec.hp,
      r: spec.r,
      t: 0,
      fireCd: spec.fireCd != null ? spec.fireCd : rand(0.3, 1.1),
      score: spec.score,
      drop: spec.drop || false,
      rgb: spec.rgb,
      ang: spec.ang || 0,
      spin: spec.spin || 0,
      flash: 0,
      size: spec.size || 0,
      crystal: !!spec.crystal,
      verts: spec.verts || null,
      seed: spec.seed || 0,
      dive: !!spec.dive,
      phase: spec.phase || 0,
      w: spec.w || spec.r * 2,
      h: spec.h || spec.r * 2
    };
    G.ents.push(en);
    return en;
  }

  function spawnRock(opt) {
    opt = opt || {};
    const size = clamp(opt.size || 3, 1, 3);
    const crystal = !!opt.crystal;
    const r = ROCK_R[size] * (crystal ? 0.94 : 1);
    const hp0 = crystal ? CRY_HP[size] : ROCK_HP[size];
    const extra = size > 1 && isShard() ? 1 : 0;
    const seed = opt.seed != null ? opt.seed : (Math.random() * 99999) | 0;
    return spawnEnt({
      type: crystal ? 'crystal' : 'rock',
      x: opt.x != null ? opt.x : rand(40, VW - 40),
      y: opt.y != null ? opt.y : -28,
      vx: opt.vx != null ? opt.vx : rand(-46, 46),
      vy: opt.vy != null ? opt.vy : rand(38, 78),
      hp: hp0 + extra,
      r: r,
      score: crystal ? CRY_SC[size] : ROCK_SC[size],
      rgb: crystal ? ICE : (size === 3 ? VIO : size === 2 ? PNK : ORG),
      ang: rand(0, TAU),
      spin: rand(-1.6, 1.6),
      size: size,
      crystal: crystal,
      verts: makeVerts(seed, crystal ? 6 : 8, r, !crystal),
      seed: seed,
      fireCd: 99,
      drop: size === 3 && Math.random() < 0.12 ? 'bomb' : false
    });
  }

  function spawnRockCluster(n, size, crystal) {
    n = n || 3;
    for (let i = 0; i < n; i++) {
      spawnRock({
        size: size || 3,
        crystal: !!crystal,
        x: rand(46, VW - 46),
        y: -24 - i * 26,
        vx: rand(-50, 50),
        vy: rand(40, 82)
      });
    }
  }

  function spawnScout(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'drone',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 98,
      hp: 1, r: 10, score: 70,
      rgb: extra.rgb || MAG,
      dive: extra.dive,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.85, 2.2)
    });
  }

  function spawnV(n, xmid) {
    n = n || 5;
    xmid = xmid == null ? VW * 0.5 + rand(-36, 36) : xmid;
    const y0 = -24;
    spawnScout(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnScout(xmid - k * 26, y0 - k * 20);
      if (1 + k * 2 <= n) spawnScout(xmid + k * 26, y0 - k * 20);
    }
  }

  function spawnDive(n) {
    n = n || 4;
    for (let i = 0; i < n; i++) {
      const x = 50 + (i + 0.5) * ((VW - 100) / n) + rand(-14, 14);
      spawnEnt({
        type: 'drone',
        x: x, y: -28 - i * 14,
        vx: 0, vy: 70,
        hp: 1, r: 10, score: 90,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnSpinner(x) {
    spawnEnt({
      type: 'spinner',
      x: x == null ? rand(70, VW - 70) : x,
      y: -30,
      vx: rand(-24, 24),
      vy: 42,
      hp: 3 + (isShard() ? 1 : 0),
      r: 16,
      score: 140,
      rgb: CYN,
      spin: 2.4,
      fireCd: rand(0.4, 0.9),
      drop: Math.random() < 0.28 ? 'bomb' : false
    });
  }

  function spawnSeekers(n) {
    n = n || 3;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'seeker',
        x: rand(50, VW - 50),
        y: -22 - i * 18,
        vx: rand(-30, 30),
        vy: 54,
        hp: 2,
        r: 11,
        score: 110,
        rgb: MAG,
        fireCd: 99
      });
    }
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.midHp * hpMul());
    const crystal = G.stage >= 2;
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -70,
      vx: 58,
      vy: 48,
      hp: hp,
      r: 34,
      score: 2000,
      rgb: crystal ? ICE : VIO,
      drop: 'bomb',
      w: 72,
      h: 40,
      fireCd: 0.55,
      phase: 0,
      crystal: crystal,
      spin: 0.5,
      verts: makeVerts(77 + G.stage, crystal ? 6 : 8, 34, !crystal)
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(crystal ? ICE : VIO, 0.36);
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
      vx: 64,
      vy: 42,
      hp: hp,
      r: 46,
      score: 4000 + G.stage * 1200,
      rgb: G.stage === 3 ? MAG : G.stage === 2 ? ICE : VIO,
      drop: 'bomb',
      w: 96,
      h: 50,
      fireCd: 0.5,
      phase: 0,
      spin: 0.35,
      crystal: G.stage >= 2,
      verts: makeVerts(120 + G.stage * 9, G.stage >= 2 ? 6 : 9, 46, G.stage === 1)
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

  function livingRocks() {
    let n = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'rock' || t === 'crystal') && G.ents[i].hp > 0) n += 1;
    }
    return n;
  }

  function fireWave(w) {
    if (!w) return;
    const extra = isShard() ? 1 : 0;
    if (w.kind === 'rocks') spawnRockCluster((w.n || 3) + extra, w.size || 3, false);
    else if (w.kind === 'crystals') spawnRockCluster((w.n || 3) + extra, w.size || 3, true);
    else if (w.kind === 'v') spawnV((w.n || 5) + extra);
    else if (w.kind === 'dive') spawnDive((w.n || 4) + extra);
    else if (w.kind === 'spinner') {
      spawnSpinner();
      if (isShard()) spawnSpinner();
    } else if (w.kind === 'seekers') spawnSeekers((w.n || 3) + extra);
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vy: 62, t: 0,
      vx: rand(-36, 36),
      kind: kind || 'bomb'
    });
    capArr(G.pows, 6);
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length > shotCap()) return;
    G.eShots.push({
      x: x, y: y, vx: vx, vy: vy,
      r: r || 3.1,
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
    if (G.shots.length > 48) return;
    G.shots.push({
      x: spec.x, y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r || 3.1,
      rgb: spec.rgb,
      dmg: spec.dmg || 1
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = heatLv();
    const x = G.player.x;
    const y = G.player.y - 14;
    G.muzzle = 0.05;
    G.fireCd = 0.118 - lv * 0.02;
    const spd = -700 - lv * 30;
    const rgb = lv >= 3 ? GOLD : lv >= 2 ? CYN : WHT;
    function bolt(ox, oy, vx) {
      addShot({ x: x + ox, y: y + oy, vx: vx || 0, vy: spd, r: lv >= 2 ? 3.4 : 3.05, rgb: rgb, dmg: 1 });
    }
    if (lv <= 0) {
      bolt(0, 0, 0);
    } else if (lv === 1) {
      bolt(-7, 2, -18);
      bolt(7, 2, 18);
    } else if (lv === 2) {
      bolt(-11, 4, -70);
      bolt(0, -2, 0);
      bolt(11, 4, 70);
    } else {
      bolt(-16, 6, -130);
      bolt(-8, 1, -50);
      bolt(0, -3, 0);
      bolt(8, 1, 50);
      bolt(16, 6, 130);
    }
    audio.shoot();
    emit(3, {
      x: x, y: y + 2, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: rgb, g: 0
    });
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('尘爆用尽', true);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.48;
    G.bombFlash = 0.55;
    G.invuln = Math.max(G.invuln, 0.42);
    G.heat = clamp(G.heat + 8, 0, 100);
    audio.bomb();
    screenFlash(WHT, 0.78);
    popSpark(G.player.x, G.player.y, GOLD, 52);
    rings.push({ x: G.player.x, y: G.player.y, t: 0, rgb: VIO, r: 24 });
    rings.push({ x: VW * 0.5, y: VH * 0.42, t: 0, rgb: GOLD, r: 40 });
    emit(30, {
      x: G.player.x, y: G.player.y, j: 18,
      vx0: -280, vx1: 280, vy0: -320, vy1: 220,
      life: 0.52, r0: 1.6, r1: 4.2, rgb: GOLD, g: 40
    });
    hitStop(0.078);
    kick(7.4);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      spawnDust(s.x, s.y, 1);
    }
    G.eShots.length = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      const dmg = en.type === 'boss' ? 14 : en.type === 'mid' ? 10 : 6;
      hurtEnt(en, dmg, en.x, en.y);
    }
    syncHud();
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const next = 1 + Math.min(5, Math.floor((G.combo - 1) / 4));
    if (next > G.mult) {
      G.mult = next;
      audio.combo(G.mult);
      floatText(G.player.x, G.player.y - 28, '×' + G.mult, GOLD, true);
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
    }
    G.mult = next;
    const lv = heatLv();
    if (lv > lastLv) {
      lastLv = lv;
      flashWpn();
      audio.heatup();
      toast(wpnText(), false, true);
    }
    lastLv = lv;
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function collectDust(d) {
    const add = isShard() ? 1.65 : 2.4;
    G.heat = clamp(G.heat + add * (d.big ? 1.6 : 1), 0, 100);
    bumpCombo();
    const pts = (d.big ? 20 : 12) * G.mult;
    addScore(pts);
    if (dustSfxT <= 0) {
      audio.dust(G.combo);
      dustSfxT = 0.032;
    }
    emit(3, {
      x: d.x, y: d.y, j: 2,
      vx0: -40, vx1: 40, vy0: -80, vy1: 20,
      life: 0.16, r0: 1, r1: 2.1, rgb: d.rgb, g: 0
    });
    if (G.combo % 8 === 0) floatText(d.x, d.y - 8, '+' + pts, GOLD, G.mult >= 3);
  }

  function splitRock(en) {
    if (en.size >= 2) {
      const n = isShard() ? 3 : 2;
      const next = en.size - 1;
      audio.split();
      for (let i = 0; i < n; i++) {
        const a = en.ang + (i * TAU) / n + rand(-0.35, 0.35);
        spawnRock({
          size: next,
          crystal: en.crystal,
          x: en.x + Math.cos(a) * 10,
          y: en.y + Math.sin(a) * 10,
          vx: en.vx * 0.35 + Math.cos(a) * (90 + rand(0, 70)),
          vy: en.vy * 0.25 + Math.sin(a) * (50 + rand(0, 50))
        });
      }
      spawnDust(en.x, en.y, 3 + next, en.size === 3);
    } else {
      spawnDust(en.x, en.y, 6 + (isShard() ? 2 : 0), true);
    }
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
      if (en.type === 'boss' || en.type === 'mid') hitStop(0.04);
      return;
    }
    killEnt(en);
  }

  function killEnt(en) {
    if (en.hp < -90) return;
    en.hp = -99;
    bumpCombo();
    const isRock = en.type === 'rock' || en.type === 'crystal';
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : isRock ? 0.7 + en.size * 0.35 : 0.9;
    juice(en.x, en.y, en.rgb, pwr);
    audio.hit(G.combo);
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0024, 0.034, 0.072));
    if (isRock) splitRock(en);
    else spawnDust(en.x, en.y, en.type === 'boss' ? 18 : en.type === 'mid' ? 10 : 4, en.type === 'boss');
    if (en.drop === 'bomb') spawnPow(en.x, en.y, 'bomb');
    else if (en.type === 'spinner' && Math.random() < 0.2) spawnPow(en.x, en.y, 'bomb');
    if (en.type === 'boss') {
      G.stageClearT = 2.05;
      addScore(1500 * G.stage);
      floatText(en.x, en.y - 24, '击坠', GOLD, true);
      const st = STAGES[G.stage - 1];
      toast(st ? st.boss + ' 击坠' : '击坠', false, true);
    } else if (en.type === 'mid') {
      floatText(en.x, en.y - 20, '中破', GOLD, true);
      toast('中破', false, true);
    }
  }

  function pickPow(p) {
    if (G.bombs < BOMB_CAP) {
      G.bombs += 1;
      toast('尘爆 +1', false, true);
    } else {
      addScore(800 * G.mult);
      toast('+800', false, true);
    }
    juice(p.x, p.y, GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, '爆', GOLD, true);
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 || G.bombT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.bombT = 0;
    breakCombo();
    G.fireHold = false;
    G.heat *= 0.55;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    lastLv = heatLv();
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '舰毁了';
    G.tunnel = false;
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ' · 撞岩或被弹扣命'));
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    G.tunnel = false;
    addScore(8000);
    saveBest();
    audio.win();
    showOverlay('win', '尘核尽破', '三关打穿。分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function enterTunnel() {
    G.tunnel = true;
    G.tunnelT = 0;
    G.tunnelDur = isShard() ? 7.0 : 7.6;
    G.ents.length = 0;
    G.eShots.length = 0;
    G.invuln = Math.max(G.invuln, 0.7);
    G.player.x = VW * 0.5;
    toast('跃迁廊', false, true);
    audio.tunnel();
    screenFlash(CYN, 0.4);
    syncHud();
  }

  function leaveTunnel() {
    G.tunnel = false;
    G.tunnelT = 0;
    G.stage += 1;
    G.stageT = 0;
    G.waveI = 0;
    G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
    G.invuln = Math.max(G.invuln, 0.85);
    toast(STAGES[G.stage - 1].name, false, true);
    audio.wave();
    syncHud();
  }

  function updateFx(dt) {
    if (G.stop > 0) return;
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.bombFlash > 0) G.bombFlash -= dt;
    G.scroll += scrollSpd() * dt;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += (18 + s.z * 42) * dt * (scrollSpd() / 80);
      if (s.y > VH + 4) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < debris.length; i++) {
      const d = debris[i];
      d.y += (22 + d.z * 36) * dt * (scrollSpd() / 80);
      d.a += d.spin * dt;
      if (d.y > VH + 30) {
        d.y = -30;
        d.x = rand(0, VW);
      }
    }
  }

  function updateDust(dt) {
    const mag = MAG_R + G.combo * 5;
    for (let i = G.dust.length - 1; i >= 0; i--) {
      const d = G.dust[i];
      d.t += dt;
      if (G.mode === 'play' && G.deadT <= 0) {
        const dx = G.player.x - d.x;
        const dy = G.player.y - d.y;
        const dist = hypot(dx, dy);
        if (dist < 16) {
          collectDust(d);
          G.dust.splice(i, 1);
          continue;
        }
        if (dist < mag && dist > 0.001) {
          const pull = 220 + (1 - dist / mag) * 540;
          d.vx += (dx / dist) * pull * dt;
          d.vy += (dy / dist) * pull * dt;
        }
      }
      d.x += d.vx * dt;
      d.y += d.vy * dt + scrollSpd() * 0.12 * dt;
      d.vx *= 0.986;
      d.vy *= 0.986;
      if (d.t > 6.4 || d.y > VH + 36 || d.x < -40 || d.x > VW + 40) G.dust.splice(i, 1);
    }
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const spd = plySpd();
    let ax = 0;
    let ay = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const dx = pointer.x - G.player.x;
      const dy = pointer.y - G.player.y;
      const d = hypot(dx, dy);
      if (d > 4) {
        const k = Math.min(1, d / 48);
        ax = (dx / d) * k;
        ay = (dy / d) * k;
      }
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      const len = hypot(ax, ay);
      if (len > 1) {
        ax /= len;
        ay /= len;
      }
    }
    G.player.vx = lerp(G.player.vx, ax * spd, 0.28);
    G.player.vy = lerp(G.player.vy, ay * spd, 0.28);
    G.player.x += G.player.vx * dt;
    G.player.y += G.player.vy * dt;
    G.player.y = clamp(G.player.y, 40, VH - 28);
    if (G.tunnel && G.mode === 'play' && G.invuln <= 0 && G.deadT <= 0) {
      const L = tunnelLeftAt(G.player.y);
      const R = tunnelRightAt(G.player.y);
      if (G.player.x < L + 6 || G.player.x > R - 6) killPlayer();
    }
    let x0 = 22;
    let x1 = VW - 22;
    if (G.tunnel) {
      x0 = tunnelLeftAt(G.player.y) + 8;
      x1 = tunnelRightAt(G.player.y) - 8;
      if (x1 < x0 + 8) {
        const mid = (x0 + x1) * 0.5;
        x0 = mid - 4;
        x1 = mid + 4;
      }
    }
    G.player.x = clamp(G.player.x, x0, x1);
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -20 || s.y > VH + 20 || s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (hypot(s.x - en.x, s.y - en.y) < s.r + en.r * 0.9) {
          hurtEnt(en, s.dmg, s.x, s.y);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -24 || s.y > VH + 24 || s.x < -24 || s.x > VW + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (hypot(s.x - G.player.x, s.y - G.player.y) < s.r + HIT_R) {
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
      p.vx *= 0.98;
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (p.y > VH + 20) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && hypot(p.x - G.player.x, p.y - G.player.y) < 22) {
        pickPow(p);
        G.pows.splice(i, 1);
      }
    }
  }

  function thinkEnt(en, dt) {
    en.t += dt;
    en.ang += en.spin * dt;
    if (en.flash > 0) en.flash -= dt;
    if (en.type === 'rock' || en.type === 'crystal') {
      en.x += en.vx * dt;
      en.y += en.vy * dt + scrollSpd() * 0.22 * dt;
      if (en.x < en.r || en.x > VW - en.r) {
        en.vx *= -1;
        en.x = clamp(en.x, en.r, VW - en.r);
      }
    } else if (en.type === 'drone') {
      if (en.dive && en.t > 0.45) {
        const dx = G.player.x - en.x;
        en.vx = lerp(en.vx, clamp(dx * 1.4, -160, 160), 0.08);
        en.vy = Math.min(240, en.vy + 90 * dt);
      }
      en.x += en.vx * dt;
      en.y += en.vy * dt;
      en.fireCd -= dt;
      if (en.fireCd <= 0 && en.y > 20 && en.y < VH - 80) {
        en.fireCd = isShard() ? rand(0.9, 1.5) : rand(1.2, 2.1);
        aimShot(en.x, en.y + 8, isShard() ? 210 : 170, MAG, 3);
      }
    } else if (en.type === 'spinner') {
      en.x += en.vx * dt;
      en.y += en.vy * dt;
      if (en.x < 40 || en.x > VW - 40) en.vx *= -1;
      en.fireCd -= dt;
      if (en.fireCd <= 0 && en.y > 30 && en.y < VH - 90) {
        en.fireCd = isShard() ? 0.95 : 1.35;
        ringShot(en.x, en.y, isShard() ? 8 : 6, 130, en.ang, CYN, 2.8);
      }
    } else if (en.type === 'seeker') {
      if (G.deadT <= 0) {
        const dx = G.player.x - en.x;
        const dy = G.player.y - en.y;
        const len = hypot(dx, dy) || 1;
        en.vx = lerp(en.vx, (dx / len) * 90, 0.04);
        en.vy = lerp(en.vy, (dy / len) * 90 + 20, 0.04);
      }
      en.x += en.vx * dt;
      en.y += en.vy * dt;
    } else if (en.type === 'mid') {
      if (en.y < 118) en.y += 52 * dt;
      else {
        en.x += en.vx * dt;
        if (en.x < 70 || en.x > VW - 70) en.vx *= -1;
      }
      en.fireCd -= dt;
      if (en.fireCd <= 0) {
        en.fireCd = isShard() ? 0.48 : 0.66;
        en.phase += 1;
        if (en.phase % 4 === 0) {
          ringShot(en.x, en.y, 8, 140, en.t, en.rgb, 3.2);
        } else {
          aimShot(en.x, en.y + 16, 190, MAG, 3.4);
          if (isShard()) aimShot(en.x - 16, en.y + 10, 170, MAG, 3);
        }
        if (en.phase % 5 === 0 && livingRocks() < 10) {
          spawnRock({ size: 2, crystal: en.crystal, x: en.x, y: en.y + 20, vx: rand(-80, 80), vy: 40 });
        }
      }
    } else if (en.type === 'boss') {
      if (en.y < 128) en.y += 46 * dt;
      else {
        en.x += en.vx * dt;
        if (en.x < 80 || en.x > VW - 80) en.vx *= -1;
        en.y = 128 + Math.sin(en.t * 1.3) * 16;
      }
      en.fireCd -= dt;
      const rage = en.hp < en.maxHp * 0.5;
      if (en.fireCd <= 0) {
        en.fireCd = (isShard() ? 0.38 : 0.52) - (rage ? 0.08 : 0);
        en.phase += 1;
        const st = G.stage;
        if (st === 1) {
          if (en.phase % 3 === 0) ringShot(en.x, en.y, rage ? 12 : 8, 150, en.t, VIO, 3.2);
          else {
            for (let k = -2; k <= 2; k++) {
              eShot(en.x + k * 12, en.y + 18, k * 40, 210, MAG, 3.1);
            }
          }
        } else if (st === 2) {
          if (en.phase % 2 === 0) ringShot(en.x, en.y, 10, 160, en.ang, ICE, 3);
          aimShot(en.x, en.y, rage ? 230 : 180, CYN, 3.3);
        } else {
          ringShot(en.x, en.y, rage ? 14 : 10, 148, en.t * 1.7, MAG, 3);
          if (en.phase % 2 === 0) aimShot(en.x, en.y + 10, 200, GOLD, 3.4);
          if (rage && en.phase % 3 === 0) {
            ringShot(en.x, en.y, 8, 90, en.t + 0.4, GOLD, 2.6);
          }
        }
        if (en.phase % 6 === 0 && livingRocks() < 12) {
          spawnRock({
            size: rage ? 3 : 2,
            crystal: st >= 2,
            x: en.x + rand(-30, 30),
            y: en.y + 24,
            vx: rand(-90, 90),
            vy: 50
          });
        }
      }
    }
  }

  function updateEnts(dt) {
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      thinkEnt(en, dt);
      if (en.y > VH + 50 || en.y < -140) {
        G.ents.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        const rr = HIT_R + en.r * 0.78;
        if (hypot(en.x - G.player.x, en.y - G.player.y) < rr) killPlayer();
      }
    }
  }

  function raidThink() {
    if (G.tunnel || G.stageClearT > 0 || hasBig()) return;
    const st = STAGES[G.stage - 1];
    if (!st) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      fireWave(st.waves[G.waveI]);
      G.waveI += 1;
    }
  }

  function shardThink(dt) {
    raidThink();
    if (G.tunnel || hasBig() || G.stageClearT > 0) return;
    G.spawnT -= dt;
    if (G.spawnT <= 0 && livingRocks() < 11) {
      spawnRock({ size: 1 + ((Math.random() * 3) | 0), crystal: Math.random() < 0.4, y: -26 });
      G.spawnT = 1.85;
    }
  }

  function updateTunnel(dt) {
    G.tunnelT += dt;
    if ((G.tunnelT * 8 | 0) !== ((G.tunnelT - dt) * 8 | 0)) {
      spawnDust(VW * 0.5 + rand(-24, 24), -10, 2);
    }
    if (G.tunnelT > 1.1 && (G.tunnelT * 2.2 | 0) !== ((G.tunnelT - dt) * 2.2 | 0)) {
      spawnRock({
        size: 1 + ((Math.random() * 2) | 0),
        x: VW * 0.5 + rand(-40, 40),
        y: -20,
        vx: rand(-30, 30),
        vy: 90
      });
    }
    if (G.tunnelT >= G.tunnelDur) leaveTunnel();
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    updateFx(dt);

    if (G.mode === 'title') {
      G.player.x = VW * 0.5 + Math.sin(G.t * 0.7) * 48;
      G.player.y = VH - 96;
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingRocks() < 6) {
        spawnRock({ size: 2 + ((Math.random() * 2) | 0), y: -20 });
        G.spawnT = 1.8;
      }
      updateEnts(dt);
      updateDust(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateDust(dt);
      return;
    }

    G.clock += dt;
    if (!hasBig() && !G.tunnel) G.stageT += dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.bombT > 0) G.bombT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (dustSfxT > 0) dustSfxT -= dt;
    const decay = G.comboT > 0 ? 2.4 : 7.2;
    const prevLv = heatLv();
    G.heat = Math.max(0, G.heat - decay * dt);
    if (heatBar) heatBar.style.transform = 'scaleX(' + clamp(G.heat / 100, 0, 1) + ')';
    if (heatWrap) {
      heatWrap.classList.toggle('hot', heatLv() >= 3);
      heatWrap.classList.toggle('low', G.heat < 20);
    }
    if (heatLv() !== prevLv) {
      lastLv = heatLv();
      syncHud();
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
        enterTunnel();
      }
    }

    updatePlayer(dt);
    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();
    if (G.tunnel) updateTunnel(dt);
    else if (isShard()) shardThink(dt);
    else raidThink();
    updateEnts(dt);
    updateShots(dt);
    updateDust(dt);
    updatePows(dt);
  }

  function drawPoly(en, fill, stroke) {
    const v = en.verts;
    if (!v || v.length < 6) return;
    const c = Math.cos(en.ang);
    const s = Math.sin(en.ang);
    ctx.beginPath();
    for (let i = 0; i < v.length; i += 2) {
      const x = en.x + v[i] * c - v[i + 1] * s;
      const y = en.y + v[i] * s + v[i + 1] * c;
      if (i === 0) ctx.moveTo(sx(x), sy(y));
      else ctx.lineTo(sx(x), sy(y));
    }
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }
  }

  function drawWorld() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (G.tunnel) {
      g.addColorStop(0, '#1a1040');
      g.addColorStop(0.5, '#0c0824');
      g.addColorStop(1, '#080614');
    } else if (G.stage === 2) {
      g.addColorStop(0, '#101838');
      g.addColorStop(0.5, '#0a1028');
      g.addColorStop(1, '#080614');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#201028');
      g.addColorStop(0.5, '#12081c');
      g.addColorStop(1, '#080614');
    } else {
      g.addColorStop(0, '#16102c');
      g.addColorStop(0.55, '#0c0820');
      g.addColorStop(1, '#080614');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const neb = ctx.createRadialGradient(sx(VW * 0.5), sy(VH * 0.28), 10 * scale, sx(VW * 0.5), sy(VH * 0.3), 260 * scale);
    neb.addColorStop(0, rgba(G.stage === 3 ? MAG : G.stage === 2 ? CYN : VIO, 0.14));
    neb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = neb;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = rgba(s.rgb, s.a);
      const rr = (0.6 + s.z * 1.1) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), rr, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < debris.length; i++) {
      const d = debris[i];
      ctx.save();
      ctx.globalAlpha = 0.18 + d.z * 0.12;
      ctx.translate(sx(d.x), sy(d.y));
      ctx.rotate(d.a);
      ctx.strokeStyle = rgba(VIO, 0.55);
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, d.r * d.z * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    if (G.tunnel) {
      ctx.fillStyle = 'rgba(8, 6, 24, 0.92)';
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(0));
      for (let y = 0; y <= VH; y += 8) ctx.lineTo(sx(tunnelLeftAt(y)), sy(y));
      ctx.lineTo(sx(0), sy(VH));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(sx(VW), sy(0));
      for (let y = 0; y <= VH; y += 8) ctx.lineTo(sx(tunnelRightAt(y)), sy(y));
      ctx.lineTo(sx(VW), sy(VH));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = rgba(CYN, 0.55);
      ctx.lineWidth = 2 * scale;
      ctx.shadowColor = rgba(VIO, 0.8);
      ctx.shadowBlur = 12 * scale;
      ctx.beginPath();
      for (let y = 0; y <= VH; y += 8) {
        if (y === 0) ctx.moveTo(sx(tunnelLeftAt(y)), sy(y));
        else ctx.lineTo(sx(tunnelLeftAt(y)), sy(y));
      }
      ctx.stroke();
      ctx.beginPath();
      for (let y = 0; y <= VH; y += 8) {
        if (y === 0) ctx.moveTo(sx(tunnelRightAt(y)), sy(y));
        else ctx.lineTo(sx(tunnelRightAt(y)), sy(y));
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }

  function drawDust() {
    for (let i = 0; i < G.dust.length; i++) {
      const d = G.dust[i];
      const pulse = 0.65 + Math.sin(G.t * 10 + d.t * 8) * 0.35;
      const r = (d.big ? 3.6 : 2.2) * pulse;
      ctx.save();
      ctx.shadowColor = rgba(d.rgb, 0.9);
      ctx.shadowBlur = 10 * scale;
      ctx.fillStyle = rgba(d.rgb, 0.95);
      ctx.beginPath();
      ctx.arc(sx(d.x), sy(d.y), r * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawEnt(en) {
    if (en.hp <= 0) return;
    const flash = en.flash > 0;
    ctx.save();
    if (en.type === 'rock' || en.type === 'crystal' || en.type === 'mid' || en.type === 'boss') {
      const fill = flash ? rgba(WHT, 0.9) : rgba(en.rgb, en.type === 'boss' ? 0.55 : 0.42);
      const stroke = flash ? rgba(GOLD, 1) : rgba(WHT, 0.85);
      ctx.shadowColor = rgba(en.rgb, 0.7);
      ctx.shadowBlur = (en.type === 'boss' ? 18 : 10) * scale;
      drawPoly(en, fill, stroke);
      if (en.crystal || en.type === 'boss' || en.type === 'mid') {
        ctx.fillStyle = rgba(WHT, 0.35);
        ctx.beginPath();
        ctx.arc(sx(en.x), sy(en.y), en.r * 0.28 * scale, 0, TAU);
        ctx.fill();
      }
      if (en.type === 'boss') {
        const core = 8 + Math.sin(G.t * 6) * 2;
        ctx.fillStyle = rgba(GOLD, 0.85);
        ctx.beginPath();
        ctx.arc(sx(en.x), sy(en.y), core * scale, 0, TAU);
        ctx.fill();
        for (let k = 0; k < 4; k++) {
          const a = en.ang + k * TAU / 4;
          const rr = en.r + 10;
          ctx.fillStyle = rgba(CYN, 0.7);
          ctx.beginPath();
          ctx.arc(sx(en.x + Math.cos(a) * rr), sy(en.y + Math.sin(a) * rr), 4.2 * scale, 0, TAU);
          ctx.fill();
        }
      }
    } else if (en.type === 'drone') {
      ctx.translate(sx(en.x), sy(en.y));
      ctx.fillStyle = flash ? '#fff' : rgba(en.rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -10 * scale);
      ctx.lineTo(8 * scale, 8 * scale);
      ctx.lineTo(0, 4 * scale);
      ctx.lineTo(-8 * scale, 8 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.8);
      ctx.fillRect(-2 * scale, 6 * scale, 4 * scale, 5 * scale);
    } else if (en.type === 'spinner') {
      ctx.translate(sx(en.x), sy(en.y));
      ctx.rotate(en.ang);
      ctx.strokeStyle = flash ? '#fff' : rgba(CYN, 0.95);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 12 * scale, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-14 * scale, 0);
      ctx.lineTo(14 * scale, 0);
      ctx.moveTo(0, -14 * scale);
      ctx.lineTo(0, 14 * scale);
      ctx.stroke();
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(0, 0, 4 * scale, 0, TAU);
      ctx.fill();
    } else if (en.type === 'seeker') {
      ctx.translate(sx(en.x), sy(en.y));
      ctx.fillStyle = flash ? '#fff' : rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, 8 * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(GOLD, 0.8);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 11 * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShip(x, y) {
    const lv = heatLv();
    ctx.save();
    ctx.translate(sx(x), sy(y));
    const flame = 8 + Math.sin(G.t * 28) * 3 + lv;
    ctx.fillStyle = rgba(MAG, 0.7);
    ctx.beginPath();
    ctx.moveTo(-4 * scale, 8 * scale);
    ctx.lineTo(0, (12 + flame) * scale);
    ctx.lineTo(4 * scale, 8 * scale);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -16 * scale);
    ctx.lineTo(11 * scale, 10 * scale);
    ctx.lineTo(0, 5 * scale);
    ctx.lineTo(-11 * scale, 10 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(VIO, 0.95);
    ctx.beginPath();
    ctx.moveTo(-12 * scale, 2 * scale);
    ctx.lineTo(-18 * scale, 12 * scale);
    ctx.lineTo(-6 * scale, 8 * scale);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(12 * scale, 2 * scale);
    ctx.lineTo(18 * scale, 12 * scale);
    ctx.lineTo(6 * scale, 8 * scale);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -10 * scale);
    ctx.lineTo(4 * scale, 2 * scale);
    ctx.lineTo(-4 * scale, 2 * scale);
    ctx.closePath();
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(0, -18 * scale, 5 * scale, 0, TAU);
      ctx.fill();
    }
    const intake = 2.2 + lv * 0.8;
    ctx.fillStyle = rgba(GOLD, 0.55 + lv * 0.12);
    ctx.beginPath();
    ctx.arc(-6 * scale, 0, intake * scale, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6 * scale, 0, intake * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.strokeStyle = rgba(s.rgb, 0.95);
      ctx.lineWidth = 2.4 * scale;
      ctx.shadowColor = rgba(s.rgb, 0.9);
      ctx.shadowBlur = 8 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(s.x), sy(s.y + 10));
      ctx.lineTo(sx(s.x + s.vx * 0.01), sy(s.y - 6));
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.85);
      ctx.shadowBlur = 8 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const bob = Math.sin(p.t * 6) * 2;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y + bob));
      ctx.rotate(p.t * 1.4);
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.strokeStyle = rgba(WHT, 0.9);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.moveTo(0, -10 * scale);
      ctx.lineTo(8 * scale, 0);
      ctx.lineTo(0, 10 * scale);
      ctx.lineTo(-8 * scale, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#2a1a00';
      ctx.font = '700 ' + (9 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 1.4);
      ctx.fillText('爆', 0, 1 * scale);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      ctx.save();
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad + s.t * 70) * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.42;
      ctx.save();
      ctx.strokeStyle = rgba(r.rgb, a * 0.7);
      ctx.lineWidth = 2.2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 140) * scale, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = '700 ' + (f.size * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = rgba(f.rgb, 0.8);
      ctx.shadowBlur = 8 * scale;
      ctx.fillText(f.text, sx(f.x), sy(f.y));
      ctx.restore();
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].hp > 0) {
        boss = G.ents[i];
        break;
      }
      if (!boss && G.ents[i].type === 'mid' && G.ents[i].hp > 0) boss = G.ents[i];
    }
    if (!boss) return;
    const w = 220;
    const x = (VW - w) * 0.5;
    const y = 16;
    ctx.fillStyle = 'rgba(8,6,20,0.7)';
    ctx.fillRect(sx(x), sy(y), w * scale, 8 * scale);
    ctx.fillStyle = rgba(boss.type === 'boss' ? MAG : GOLD, 0.9);
    ctx.fillRect(sx(x), sy(y), w * (boss.hp / boss.maxHp) * scale, 8 * scale);
    ctx.strokeStyle = rgba(WHT, 0.45);
    ctx.lineWidth = 1 * scale;
    ctx.strokeRect(sx(x), sy(y), w * scale, 8 * scale);
  }

  function drawFlash() {
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.bombFlash > 0) {
      ctx.strokeStyle = rgba(GOLD, G.bombFlash);
      ctx.lineWidth = 6 * scale;
      ctx.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#05040e';
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
    drawDust();
    drawShots();
    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawPows();
    drawParticles();
    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawShip(G.player.x, G.player.y);
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
    G.dust.length = 0;
    G.pows.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'shard' ? 'shard' : 'dust';
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
    G.heat = 12;
    G.bombs = 3;
    G.bombT = 0;
    G.bombFlash = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
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
    G.tunnel = false;
    G.tunnelT = 0;
    G.why = '';
    lastLv = heatLv();
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedStars();
    seedDebris();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isShard() ? '碎光 · 更密更快' : '星尘 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'dust';
    G.stage = 1;
    G.lives = LIVES;
    G.bombs = 3;
    G.heat = 20;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bombT = 0;
    G.tunnel = false;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    lastLv = 1;
    clearField();
    seedStars();
    seedDebris();
    showOverlay('title', '星尘', '打岩成尘，吸尘加热火力。撞了扣命。短关之后是尘核。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('dust');
    else startGame(G.kind || 'dust');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('dust');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('shard');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isShard()) goTitle();
      else startGame('shard');
    }
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isBomb = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'z' || k === 'Z';
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';

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

    if (down && (isMove || space || isBomb || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
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
    if (isBomb) {
      if (!e.repeat) tryBomb();
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

  if (btnDust) {
    btnDust.addEventListener('click', function () {
      audio.ensure();
      startGame('dust');
    });
  }
  if (btnShard) {
    btnShard.addEventListener('click', function () {
      audio.ensure();
      startGame('shard');
    });
  }
  if (ovRetry) {
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'dust');
    });
  }
  if (ovModes) {
    ovModes.addEventListener('click', function () {
      audio.ensure();
      secondaryAction();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnBomb) btnBomb.addEventListener('click', tryBomb);
  if (btnPad) btnPad.addEventListener('click', tryBomb);
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
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
