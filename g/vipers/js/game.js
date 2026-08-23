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
  const BEST_KEY = 'playbox-vipers-best';
  const MUTE_KEY = 'playbox-vipers-mute';
  const OPS = '方向 / WASD 飞 · 空格机炮 · Shift / Z 喷毒 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 138];
  const GOLD = [255, 227, 107];
  const VEN = [156, 255, 74];
  const HOT = [61, 255, 122];
  const CYN = [78, 232, 176];
  const WHT = [232, 255, 240];
  const PNK = [255, 154, 196];
  const RED = [255, 86, 110];
  const LEAF = [42, 168, 96];
  const INK = [8, 20, 16];
  const ACID = [210, 255, 90];

  const PWR_ROMAN = ['', 'Ⅱ', 'Ⅲ', 'MAX'];
  const DROP_GLYPH = { pwr: '牙', bomb: '毒' };

  const STAGES = [
    {
      name: '第 1 关 · 密林',
      biome: 'jungle',
      mid: '林炮',
      boss: '牙蟒',
      midHp: 42,
      bossHp: 94,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.4, kind: 'stream', dir: 1 },
        { t: 6.0, kind: 'aa' },
        { t: 8.6, kind: 'cargo' },
        { t: 11.0, kind: 'hawk', n: 4 },
        { t: 13.6, kind: 'gunship' },
        { t: 16.2, kind: 'v', n: 7 },
        { t: 18.8, kind: 'pods' },
        { t: 21.4, kind: 'mid' },
        { t: 27.0, kind: 'stream', dir: -1 },
        { t: 29.6, kind: 'hawk', n: 5 },
        { t: 32.0, kind: 'aa' },
        { t: 34.6, kind: 'cargo' },
        { t: 37.0, kind: 'serpent' },
        { t: 39.6, kind: 'v', n: 7 },
        { t: 42.2, kind: 'tanks' },
        { t: 47.6, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 河谷',
      biome: 'valley',
      mid: '谷卫',
      boss: '毒舰',
      midHp: 52,
      bossHp: 126,
      waves: [
        { t: 0.7, kind: 'v', n: 7 },
        { t: 3.0, kind: 'hawk', n: 5 },
        { t: 5.4, kind: 'stream', dir: -1 },
        { t: 7.8, kind: 'boats' },
        { t: 10.2, kind: 'gunship' },
        { t: 12.6, kind: 'cargo' },
        { t: 15.0, kind: 'aa' },
        { t: 17.4, kind: 'serpent' },
        { t: 19.8, kind: 'mid' },
        { t: 25.4, kind: 'stream', dir: 1 },
        { t: 27.8, kind: 'hawk', n: 6 },
        { t: 30.2, kind: 'gunship' },
        { t: 32.6, kind: 'tanks' },
        { t: 35.0, kind: 'v', n: 9 },
        { t: 37.4, kind: 'cargo' },
        { t: 39.8, kind: 'pods' },
        { t: 42.4, kind: 'boats' },
        { t: 50.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 牙巢',
      biome: 'nest',
      mid: '巢卫',
      boss: '毒牙核',
      midHp: 66,
      bossHp: 168,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.6, kind: 'stream', dir: 1 },
        { t: 4.4, kind: 'stream', dir: -1 },
        { t: 6.6, kind: 'hawk', n: 6 },
        { t: 8.8, kind: 'serpent' },
        { t: 11.0, kind: 'cargo' },
        { t: 13.2, kind: 'gunship' },
        { t: 15.4, kind: 'aa' },
        { t: 17.6, kind: 'pods' },
        { t: 19.6, kind: 'mid' },
        { t: 25.2, kind: 'hawk', n: 7 },
        { t: 27.4, kind: 'serpent' },
        { t: 29.6, kind: 'gunship' },
        { t: 31.8, kind: 'v', n: 11 },
        { t: 34.0, kind: 'cargo' },
        { t: 36.2, kind: 'boats' },
        { t: 38.4, kind: 'tanks' },
        { t: 40.6, kind: 'aa' },
        { t: 43.0, kind: 'pods' },
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
  const btnChaos = document.getElementById('btn-chaos');
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

  const keys = { l: false, r: false, u: false, d: false, bomb: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const dust = [];
  const marks = [];
  const wash = [];
  const rain = [];
  const mist = [];

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
    serpT: 0,
    serpY: VH,
    serpX: VW * 0.5,
    serpTick: 0,
    mistT: 0,
    mistTick: 0,
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
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    spawnT: 0.8,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    why: '',
    rumbleT: 0
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
  function isRain() {
    return G.kind === 'chaos';
  }
  function plySpd() {
    return (isRain() ? 310 : 272) + G.pwr * 10;
  }
  function scrollSpd() {
    if (hasBig()) return isRain() ? 32 : 24;
    const base = isRain() ? 116 : 84;
    const rush = G.combo >= 8 ? 16 : G.combo >= 4 ? 8 : 0;
    return base + rush + (G.stage - 1) * (isRain() ? 10 : 8);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isRain() ? 160 : 104;
  }
  function hpMul() {
    return isRain() ? 1.22 : 1;
  }
  function biome() {
    const st = STAGES[Math.min(2, G.stage - 1)];
    return st ? st.biome : 'jungle';
  }
  function riverX(y) {
    return VW * 0.5 + Math.sin((G.scroll + y) * 0.012) * 52 + Math.sin((G.scroll + y) * 0.031) * 18;
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
      this.beep(640 + G.pwr * 48, 0.046, 'square', 0.028, 1480);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1100);
      this.beep(520 * lift, 0.066, 'square', 0.042, 980 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.11, big ? 0.078 : 0.05, big ? 200 : 440);
      this.beep(big ? 150 : 240, big ? 0.28 : 0.15, 'sawtooth', 0.05, 48);
    },
    bomb() {
      this.ensure();
      this.noise(0.3, 0.086, 140);
      this.beep(64, 0.5, 'sawtooth', 0.07, 32);
      this.beep(520, 0.38, 'sine', 0.05, 1760);
      this.beep(880, 0.22, 'triangle', 0.03, 240);
    },
    pow() {
      this.ensure();
      this.beep(494, 0.08, 'square', 0.044, 740);
      this.beep(740, 0.12, 'triangle', 0.04, 988);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.04, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.03, 1176);
    },
    miss() {
      this.ensure();
      this.beep(130, 0.07, 'sine', 0.024, 72);
    },
    death() {
      this.ensure();
      this.noise(0.17, 0.06, 300);
      this.beep(260, 0.22, 'sawtooth', 0.05, 64);
      this.beep(140, 0.34, 'sine', 0.044, 40);
    },
    wave() {
      this.ensure();
      this.beep(349, 0.09, 'sine', 0.04, 466);
      this.beep(466, 0.11, 'sine', 0.04, 622);
      this.beep(740, 0.2, 'triangle', 0.044, 988);
    },
    boss() {
      this.ensure();
      this.beep(168, 0.2, 'sawtooth', 0.052, 88);
      this.beep(118, 0.32, 'square', 0.04, 62);
    },
    win() {
      this.ensure();
      this.beep(494, 0.1, 'square', 0.044, 622);
      this.beep(622, 0.12, 'triangle', 0.044, 740);
      this.beep(988, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.04, 82);
      this.beep(128, 0.3, 'sine', 0.05, 44);
    },
    start() {
      this.ensure();
      this.beep(370, 0.09, 'square', 0.04, 740);
      this.beep(740, 0.14, 'triangle', 0.034, 1108);
    },
    oneup() {
      this.ensure();
      this.beep(622, 0.08, 'square', 0.04, 830);
      this.beep(830, 0.12, 'triangle', 0.044, 1244);
    },
    rumble() {
      this.ensure();
      this.noise(0.03, 0.013, 160);
      this.beep(66, 0.036, 'sawtooth', 0.013, 44);
    },
    burst() {
      this.ensure();
      this.noise(0.08, 0.04, 700);
      this.beep(420, 0.1, 'square', 0.03, 180);
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
    if (G.pwr >= PWR_MAX) return '牙 MAX';
    if (G.pwr <= 0) return '牙';
    return '牙 ' + PWR_ROMAN[G.pwr];
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
      tagLabel.textContent = isRain() ? '谷雨' : '毒牙';
      tagLabel.classList.toggle('warn', isRain());
      tagLabel.classList.toggle('hot', !isRain() && G.stage >= 3);
    }
    if (pwrLabel) {
      pwrLabel.textContent = pwrText();
      pwrLabel.classList.toggle('max', G.pwr >= PWR_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '毒 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (btnBomb) btnBomb.disabled = G.mode === 'play' && G.bombs <= 0;
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
    else if (G.mode === 'win') setHint('毒牙尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 喷毒清弹', 'warn');
    else setHint('空格机炮 · Shift 喷毒 · 吃 牙/毒 · 撞机扣命', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'VPR';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovRetry) ovRetry.textContent = '再来';
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isRain() ? '换模式' : '谷雨';
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
    dust.length = 0;
    marks.length = 0;
    rain.length = 0;
    for (let i = 0; i < 52; i++) {
      dust.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.4, 1.3),
        a: rand(0.16, 0.55),
        s: rand(2.4, 7.5),
        spin: rand(0, TAU),
        kind: hash2(i * 17) < 0.4 ? 'fly' : 'leaf'
      });
    }
    for (let i = 0; i < 8; i++) {
      marks.push({
        x: hash2(i * 19 + 4) < 0.5 ? rand(8, 88) : rand(VW - 88, VW - 8),
        y: -30 - i * 110,
        w: 28 + hash2(i * 11) * 48,
        h: 46 + hash2(i * 7) * 52,
        kind: hash2(i * 13),
        side: hash2(i * 19 + 4) < 0.5 ? -1 : 1
      });
    }
    for (let i = 0; i < 28; i++) {
      rain.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.6, 1.4),
        len: rand(8, 16)
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
      lock: 0
    };
    G.ents.push(en);
    return en;
  }

  function spawnWasp(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'wasp',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy != null ? extra.vy : 96,
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
    spawnWasp(xmid, y0);
    const wings = Math.floor((n - 1) / 2);
    for (let k = 1; k <= wings; k++) {
      spawnWasp(xmid - k * gapX, y0 - k * gapY);
      if (1 + k * 2 <= n) spawnWasp(xmid + k * gapX, y0 - k * gapY);
    }
  }

  function spawnStream(dir) {
    const side = dir < 0 ? 42 : VW - 42;
    const n = (isRain() ? 8 : 6) + (Math.random() * 4) | 0;
    for (let i = 0; i < n; i++) {
      spawnWasp(side + rand(-8, 8), -20 - i * 24, {
        vx: dir * -78,
        vy: 118,
        rgb: PNK,
        fireCd: rand(0.7, 1.6)
      });
    }
  }

  function spawnHawk(n) {
    n = n || 4;
    if (isRain()) n += 1;
    for (let i = 0; i < n; i++) {
      const x = 50 + (i + 0.5) * ((VW - 100) / n) + rand(-16, 16);
      spawnEnt({
        type: 'hawk',
        x: x, y: -30 - i * 16,
        vx: 0, vy: 64,
        hp: 1, r: 11, score: 100,
        rgb: GOLD,
        dive: true,
        fireCd: 99
      });
    }
  }

  function spawnGunship() {
    const left = Math.random() < 0.5;
    spawnEnt({
      type: 'gunship',
      x: left ? -30 : VW + 30,
      y: rand(70, 190),
      vx: left ? 94 : -94,
      vy: 24,
      hp: 3, r: 16, score: 120,
      rgb: LEAF,
      w: 36, h: 22,
      fireCd: rand(0.4, 0.9),
      phase: left ? 1 : -1
    });
  }

  function spawnSerpent(x) {
    spawnEnt({
      type: 'serpent',
      x: x == null ? rand(90, VW - 90) : x,
      y: -48,
      vx: rand(-36, 36),
      vy: 54,
      hp: 5, r: 16, score: 200,
      rgb: VEN,
      drop: Math.random() < 0.34,
      w: 22, h: 48,
      fireCd: rand(0.32, 0.7),
      phase: rand(0, TAU)
    });
  }

  function spawnAa(x, y) {
    spawnEnt({
      type: 'aa',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 4, r: 14, score: 150,
      rgb: HOT,
      ground: true,
      w: 28, h: 26,
      fireCd: rand(0.5, 1.1)
    });
  }

  function spawnAaWave() {
    const n = isRain() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = 64 + i * ((VW - 128) / Math.max(1, n - 1)) + rand(-16, 16);
      spawnAa(clamp(x, 48, VW - 48), -26 - i * 18);
    }
  }

  function spawnPods() {
    const n = isRain() ? 5 : 4;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'pod',
        x: 50 + i * ((VW - 100) / Math.max(1, n - 1)) + rand(-12, 12),
        y: -20 - i * 14,
        vx: rand(-22, 22),
        vy: 56,
        hp: 1, r: 10, score: 80,
        rgb: ACID,
        fireCd: rand(0.8, 1.8),
        phase: rand(0, TAU)
      });
    }
  }

  function spawnCargo() {
    spawnEnt({
      type: 'cargo',
      x: Math.random() < 0.5 ? 54 : VW - 54,
      y: -26,
      vx: 0, vy: 76,
      hp: 2, r: 13, score: 300,
      rgb: GOLD,
      drop: 'cycle',
      phase: Math.random() < 0.5 ? -1 : 1,
      fireCd: 99
    });
  }

  function spawnTanks() {
    const n = isRain() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const bank = i % 2 === 0 ? 72 : VW - 72;
      spawnEnt({
        type: 'tank',
        x: bank + rand(-18, 18),
        y: -28 - i * 36,
        vx: 0, vy: 0,
        hp: 5, r: 15, score: 180,
        rgb: LEAF,
        ground: true,
        w: 30, h: 22,
        fireCd: rand(0.55, 1.15)
      });
    }
  }

  function spawnBoats() {
    const n = isRain() ? 3 : 2;
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'boat',
        x: riverX(-40 - i * 40) + rand(-16, 16),
        y: -36 - i * 32,
        vx: 0, vy: 0,
        hp: 6, r: 16, score: 200,
        rgb: CYN,
        ground: true,
        w: 34, h: 20,
        fireCd: rand(0.45, 0.95)
      });
    }
  }

  function spawnMid() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.midHp * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5,
      y: -60,
      vx: 54,
      vy: 46,
      hp: hp,
      r: 34,
      score: 2000,
      rgb: st.biome === 'nest' ? ACID : HOT,
      drop: 'pwr',
      w: 72,
      h: 38,
      fireCd: 0.5,
      phase: 0
    });
    toast(st.mid, false, true);
    audio.boss();
    screenFlash(HOT, 0.36);
    kick(4.6);
  }

  function spawnBoss() {
    if (hasBig()) return;
    const st = STAGES[Math.min(2, G.stage - 1)];
    const hp = Math.round(st.bossHp * hpMul());
    spawnEnt({
      type: 'boss',
      x: VW * 0.5,
      y: -74,
      vx: 62,
      vy: 40,
      hp: hp,
      r: 46,
      score: 4000 + G.stage * 1500,
      rgb: MAG,
      drop: 'bomb',
      w: 108,
      h: 52,
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
    else if (w.kind === 'hawk') spawnHawk(w.n);
    else if (w.kind === 'gunship') spawnGunship();
    else if (w.kind === 'serpent') {
      spawnSerpent();
      if (isRain()) spawnSerpent();
    } else if (w.kind === 'aa') spawnAaWave();
    else if (w.kind === 'pods') spawnPods();
    else if (w.kind === 'cargo') spawnCargo();
    else if (w.kind === 'tanks') spawnTanks();
    else if (w.kind === 'boats') spawnBoats();
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
      kind: spec.kind || 'fang'
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.pwr;
    const x = G.player.x;
    const y = G.player.y - 16;
    G.muzzle = 0.05;
    G.fireCd = 0.108 - lv * 0.014;
    const spd = -700;
    const rgb = lv >= 3 ? VEN : lv >= 1 ? GOLD : WHT;
    function fang(ox, oy, vx, vy) {
      addShot({
        x: x + ox, y: y + oy,
        vx: vx || 0,
        vy: vy == null ? spd : vy,
        r: 3.1, rgb: rgb, dmg: 1,
        ang: Math.atan2(vy == null ? spd : vy, vx || 0),
        kind: 'fang'
      });
    }
    function venom(ox, oy, vx) {
      addShot({
        x: x + ox, y: y + oy,
        vx: vx || 0,
        vy: -480,
        r: 4.4, rgb: VEN, dmg: 2,
        ang: Math.atan2(-480, vx || 0),
        kind: 'venom'
      });
    }
    if (lv <= 0) {
      fang(-6, 2);
      fang(6, 2);
    } else if (lv === 1) {
      fang(-8, 3);
      fang(0, -2);
      fang(8, 3);
    } else if (lv === 2) {
      fang(-14, 5, -100, spd);
      fang(-6, 1, -36, spd);
      fang(0, -3);
      fang(6, 1, 36, spd);
      fang(14, 5, 100, spd);
      venom(-16, 8, -48);
      venom(16, 8, 48);
    } else {
      fang(-18, 6, -140, spd);
      fang(-11, 2, -72, spd);
      fang(-4, -1);
      fang(0, -4);
      fang(4, -1);
      fang(11, 2, 72, spd);
      fang(18, 6, 140, spd);
      venom(-20, 10, -70);
      venom(-10, 8, -28);
      venom(10, 8, 28);
      venom(20, 10, 70);
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

  function doBomb() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.serpT > 0) return;
    if (G.bombs <= 0) {
      toast('毒已用尽', true, false);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.serpT = 0.82;
    G.serpY = G.player.y;
    G.serpX = G.player.x;
    G.serpTick = 0;
    G.mistT = 0.92;
    G.mistTick = 0.08;
    G.bombT = 0.56;
    G.invuln = Math.max(G.invuln, 0.56);
    G.eShots.length = 0;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].hp > 0) hurtEnt(G.ents[i], 7, G.ents[i].x, G.ents[i].y);
    }
    audio.bomb();
    hitStop(0.08);
    kick(7.6);
    screenFlash(VEN, 0.64);
    popSpark(G.player.x, G.player.y, VEN, 52);
    rings.push({ x: VW * 0.5, y: VH * 0.62, t: 0, rgb: GOLD, r: 30 });
    emit(32, {
      x: G.player.x, y: G.player.y, j: 80,
      vx0: -200, vx1: 200, vy0: -380, vy1: -20,
      life: 0.58, r0: 1.4, r1: 4.4, rgb: VEN, g: 30
    });
    for (let k = 0; k < 10; k++) {
      mist.push({
        x: G.player.x + rand(-90, 90),
        y: G.player.y + rand(-40, 20),
        t: 0,
        r: rand(16, 34)
      });
    }
    toast('喷毒', false, true);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    syncHud();
  }

  function serpHit(en) {
    const ly = Math.abs(en.y - G.serpY);
    if (ly > 70) return false;
    const sway = Math.sin(G.t * 14) * 54;
    const dx = en.x - (G.serpX + sway);
    return Math.abs(dx) < 46;
  }

  function tickSerp(dt) {
    if (G.serpT <= 0) return;
    G.serpT -= dt;
    G.serpY -= 920 * dt;
    G.serpTick -= dt;
    if (G.serpTick <= 0) {
      G.serpTick = 0.07;
      for (let i = 0; i < G.ents.length; i++) {
        const en = G.ents[i];
        if (en.hp <= 0) continue;
        if (serpHit(en)) hurtEnt(en, 2, en.x, en.y);
      }
      G.eShots.length = 0;
      if (!REDUCE) {
        mist.push({
          x: G.serpX + Math.sin(G.t * 14) * 54 + rand(-12, 12),
          y: G.serpY + rand(-8, 8),
          t: 0,
          r: rand(10, 22)
        });
        capArr(mist, 36);
      }
    }
    if (G.serpT <= 0) G.serpT = 0;
  }

  function tickMist(dt) {
    if (G.mistT <= 0) return;
    G.mistT -= dt;
    G.mistTick -= dt;
    if (G.mistTick <= 0) {
      G.mistTick = 0.12;
      for (let i = 0; i < G.ents.length; i++) {
        const en = G.ents[i];
        if (en.hp <= 0) continue;
        hurtEnt(en, 1, en.x, en.y);
      }
    }
    if (G.mistT <= 0) G.mistT = 0;
  }

  function burstPod(en) {
    const n = isRain() ? 8 : 6;
    ringShot(en.x, en.y, n, isRain() ? 148 : 118, en.phase || 0, ACID, 3.1);
    audio.burst();
    emit(10, {
      x: en.x, y: en.y, j: 8,
      vx0: -140, vx1: 140, vy0: -160, vy1: 80,
      life: 0.22, r0: 1, r1: 2.6, rgb: ACID, g: 80
    });
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
    if (en.type === 'pod') burstPod(en);
    if (en.drop === 'cycle') spawnPow(en.x, en.y, nextDropKind());
    else if (en.drop === 'bomb' || en.drop === 'pwr') spawnPow(en.x, en.y, en.drop);
    else if (en.drop === true) spawnPow(en.x, en.y, nextDropKind());
    else if (en.type === 'serpent' && Math.random() < 0.2) spawnPow(en.x, en.y, nextDropKind());
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
        toast('毒 +1', false, true);
      } else {
        addScore(800 * G.mult);
        toast('+800', false, true);
      }
    } else {
      if (G.pwr < PWR_MAX) {
        G.pwr += 1;
        toast(G.pwr >= PWR_MAX ? '牙 MAX' : '牙 强化', false, true);
      } else {
        addScore(500 * G.mult);
        toast('+500', false, true);
      }
      flashPwr();
    }
    juice(p.x, p.y, p.kind === 'bomb' ? VEN : GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, DROP_GLYPH[p.kind] || '牙', p.kind === 'bomb' ? VEN : GOLD, true);
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    if (G.bombT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    breakCombo();
    G.fireHold = false;
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
    addScore(isRain() ? 10000 : 8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '毒牙尽破', (isRain() ? '谷雨通关' : '三关打穿') + ' · 分数 ' + G.score);
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

  function rainThink(dt) {
    if (hasBig() || G.stageClearT > 0) return;
    raidThink();
    G.spawnT -= dt;
    if (G.spawnT <= 0 && livingAir() < 14) {
      const roll = Math.random();
      if (roll < 0.32) spawnV(7);
      else if (roll < 0.52) spawnHawk(4);
      else if (roll < 0.68) spawnStream(Math.random() < 0.5 ? -1 : 1);
      else if (roll < 0.82) spawnGunship();
      else spawnPods();
      G.spawnT = 2.3 + rand(0, 0.8);
    }
  }

  function bossFire(en, rain) {
    const ratio = en.hp / en.maxHp;
    const mid = ratio < 0.62;
    const low = ratio < 0.34;
    en.spin += 0.22;
    const stg = G.stage;
    if (en.type === 'mid') {
      if (stg === 1) {
        aimShot(en.x, en.y + 10, rain ? 192 : 160, HOT);
        eShot(en.x - 16, en.y + 8, -38, 166, LEAF);
        eShot(en.x + 16, en.y + 8, 38, 166, LEAF);
        if (mid) ringShot(en.x, en.y + 4, rain ? 10 : 8, 124, en.spin, VEN, 3.0);
        en.fireCd = low ? 0.42 : 0.7;
      } else if (stg === 2) {
        ringShot(en.x, en.y + 6, rain ? 12 : 9, 132, en.t * 1.6, CYN, 3.05);
        if (mid) aimShot(en.x, en.y + 12, 184, HOT);
        en.fireCd = low ? 0.4 : 0.64;
      } else {
        ringShot(en.x, en.y + 4, rain ? 14 : 10, 140, en.spin, ACID, 3.1);
        aimShot(en.x - 18, en.y + 8, 172, MAG);
        aimShot(en.x + 18, en.y + 8, 172, MAG);
        en.fireCd = low ? 0.36 : 0.58;
      }
      if (rain) en.fireCd *= 0.76;
      return;
    }
    if (stg === 1) {
      eShot(en.x - 28, en.y + 12, -46, 192, RED);
      eShot(en.x, en.y + 16, 0, 206, MAG);
      eShot(en.x + 28, en.y + 12, 46, 192, RED);
      if (mid) ringShot(en.x, en.y + 6, rain ? 12 : 9, 136, en.spin, VEN, 3.1);
      if (low) {
        for (let k = -3; k <= 3; k++) eShot(en.x + k * 14, en.y + 20, k * 40, 204, MAG);
      }
      en.fireCd = low ? 0.28 : mid ? 0.42 : 0.56;
    } else if (stg === 2) {
      ringShot(en.x, en.y + 8, rain ? 14 : 11, 144, en.spin, MAG, 3.15);
      if (mid) {
        ringShot(en.x, en.y + 8, rain ? 10 : 8, 116, -en.spin * 1.4, GOLD, 3.0);
        aimShot(en.x, en.y + 16, 196, HOT);
      }
      if (low) {
        aimShot(en.x - 28, en.y + 10, 216, RED);
        aimShot(en.x + 28, en.y + 10, 216, RED);
      }
      en.fireCd = low ? 0.3 : mid ? 0.44 : 0.58;
    } else {
      ringShot(en.x, en.y + 6, rain ? 16 : 12, 150, en.spin, MAG, 3.2);
      ringShot(en.x, en.y + 6, rain ? 10 : 8, 106, -en.spin * 0.7, VEN, 2.8);
      if (mid) {
        aimShot(en.x - 20, en.y + 14, 206, PNK);
        aimShot(en.x + 20, en.y + 14, 206, PNK);
      }
      if (low) {
        ringShot(en.x, en.y, rain ? 18 : 14, 164, en.t * 3.2, GOLD, 3.4);
      }
      en.fireCd = low ? 0.26 : mid ? 0.4 : 0.52;
    }
    if (rain) en.fireCd *= 0.76;
  }

  function updateEnts(dt) {
    const px = G.player.x;
    const py = G.player.y;
    const playing = G.mode === 'play';
    const canHurt = playing && G.deadT <= 0;
    const inv = G.invuln > 0 || G.bombT > 0;
    const rain = isRain();
    const scr = scrollSpd();

    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.lock > 0) en.lock -= dt;
      if (en.ground && en.type !== 'mid' && en.type !== 'boss') {
        en.y += scr * dt;
        if (en.type === 'boat') {
          en.x = lerp(en.x, riverX(en.y), 1 - Math.exp(-dt * 2.2));
        }
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < (en.type === 'boss' ? 108 : 124)) en.y += en.vy * dt;
        else {
          en.y = en.type === 'boss' ? 108 : 124;
          en.x += en.vx * dt;
          const pad = en.type === 'boss' ? 92 : 78;
          if (en.x < pad || en.x > VW - pad) en.vx *= -1;
          en.x = clamp(en.x, pad, VW - pad);
        }
      } else if (en.type === 'cargo') {
        en.x += en.phase * 104 * dt;
        en.y += en.vy * dt;
        if (en.y > 210 && en.phase) {
          en.phase *= -1;
          en.vy = 66;
        }
      } else if (en.type === 'gunship') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 5) * 18 * dt;
        if (en.x > 80 && en.x < VW - 80) en.vx *= Math.exp(-dt * 0.35);
        en.spin += dt * 12;
      } else if (en.type === 'hawk') {
        if (en.t > 0.32) {
          const dx = px - en.x;
          const dy = py - en.y;
          const len = hypot(dx, dy) || 1;
          const asp = 176;
          en.vx = lerp(en.vx, dx / len * asp, 1 - Math.exp(-dt * 3.1));
          en.vy = lerp(en.vy, dy / len * asp, 1 - Math.exp(-dt * 3.1));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'wasp') {
        if (!en.dive && en.t > 1.28 && Math.random() < dt * 0.5) en.dive = true;
        if (en.dive && en.t > 1.28) {
          const dx = px - en.x;
          en.vx = lerp(en.vx, Math.sign(dx) * 88, dt * 2);
          en.vy = Math.max(en.vy, 150);
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'pod') {
        en.phase += dt * 3.4;
        en.x += Math.sin(en.phase) * 46 * dt + en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'serpent') {
        en.phase += dt * 4.2;
        en.x += Math.sin(en.phase) * 118 * dt + en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < 48 || en.x > VW - 48) en.vx *= -1;
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
        if (en.type === 'aa' && en.y > 8 && en.y < VH - 70 && en.fireCd > 0 && en.fireCd <= 0.22) {
          en.lock = en.fireCd;
        }
        if (en.fireCd <= 0) {
          if (en.type === 'wasp' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 10, 0, rain ? 196 : 170, MAG);
            if (rain && Math.random() < 0.45) aimShot(en.x, en.y + 8, 164, PNK);
            en.fireCd = (rain ? 1.28 : 2.28) + rand(0, 0.55);
          } else if (en.type === 'gunship' && en.y > 20 && en.y < VH - 70) {
            aimShot(en.x, en.y + 8, rain ? 192 : 160, LEAF);
            eShot(en.x - 10, en.y + 6, -26, 146, HOT);
            eShot(en.x + 10, en.y + 6, 26, 146, HOT);
            en.fireCd = rain ? 0.7 : 1.06;
          } else if (en.type === 'serpent' && en.y > 20 && en.y < VH - 70) {
            eShot(en.x, en.y + 14, Math.sin(en.phase) * 28, rain ? 128 : 96, VEN, 3.4);
            eShot(en.x - 6, en.y + 10, -22, 110, ACID, 2.8);
            eShot(en.x + 6, en.y + 10, 22, 110, ACID, 2.8);
            if (rain) aimShot(en.x, en.y + 8, 176, VEN);
            en.fireCd = rain ? 0.64 : 0.94;
          } else if (en.type === 'aa' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y, rain ? 214 : 172, GOLD);
            if (rain) {
              eShot(en.x - 8, en.y + 4, -40, 160, HOT);
              eShot(en.x + 8, en.y + 4, 40, 160, HOT);
            }
            en.fireCd = (rain ? 0.6 : 1.0) + rand(0, 0.24);
          } else if (en.type === 'pod' && en.y > 18 && en.y < VH - 80) {
            eShot(en.x, en.y + 8, Math.sin(en.phase) * 38, rain ? 164 : 138, ACID);
            en.fireCd = (rain ? 1.08 : 1.68) + rand(0, 0.4);
          } else if (en.type === 'tank' && en.y > 8 && en.y < VH - 70) {
            aimShot(en.x, en.y - 4, rain ? 188 : 154, LEAF);
            eShot(en.x, en.y - 2, 0, rain ? 176 : 148, HOT);
            en.fireCd = (rain ? 0.78 : 1.18) + rand(0, 0.22);
          } else if (en.type === 'boat' && en.y > 8 && en.y < VH - 70) {
            eShot(en.x - 12, en.y + 4, -30, 158, CYN);
            eShot(en.x + 12, en.y + 4, 30, 158, CYN);
            if (rain) aimShot(en.x, en.y + 6, 186, MAG);
            en.fireCd = rain ? 0.68 : 1.02;
          } else if (en.type === 'mid' || en.type === 'boss') {
            if (en.y > 70) bossFire(en, rain);
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
      if (s.kind === 'venom') {
        s.vx *= Math.exp(-dt * 0.35);
        s.vy = Math.min(s.vy, -420);
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -22 || s.x < -16 || s.x > VW + 16 || s.y > VH + 24) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        const dx = en.x - s.x;
        const dy = en.y - s.y;
        const rr = en.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          hurtEnt(en, s.dmg || 1, s.x, s.y);
          hit = true;
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
    for (let i = 0; i < dust.length; i++) {
      const s = dust[i];
      s.y += scr * 0.55 * s.z * dt;
      s.x += Math.sin(G.t * 0.8 + s.spin) * 12 * dt;
      s.spin += dt * 1.4;
      if (s.y > VH + 8) {
        s.y = -8;
        s.x = rand(0, VW);
      }
    }
    for (let i = 0; i < marks.length; i++) {
      const isl = marks[i];
      isl.y += scr * dt;
      if (isl.y - isl.h > VH + 30) {
        isl.y = -60 - rand(0, 80);
        isl.side = hash2((G.scroll + isl.w) | 0) < 0.5 ? -1 : 1;
        isl.x = isl.side < 0 ? 12 + hash2(G.scroll | 0) * 70 : VW - 12 - hash2((G.scroll * 0.17) | 0) * 70;
        isl.w = 28 + hash2((G.scroll * 0.1) | 0) * 48;
        isl.h = 46 + hash2((G.scroll * 0.13) | 0) * 52;
        isl.kind = hash2(G.scroll | 0);
      }
    }
    for (let i = 0; i < rain.length; i++) {
      const d = rain[i];
      d.y += (isRain() ? 280 : 90) * d.z * dt;
      d.x += (isRain() ? 18 : 6) * dt;
      if (d.y > VH + 12) {
        d.y = -12;
        d.x = rand(-20, VW + 20);
      }
      if (d.x > VW + 20) d.x = -10;
    }
    if (!REDUCE && G.mode !== 'lose' && G.deadT <= 0) {
      wash.push({
        x: G.player.x + rand(-8, 8),
        y: G.player.y + 16,
        t: 0,
        r: rand(5, 11)
      });
      capArr(wash, 18);
    }
    for (let i = wash.length - 1; i >= 0; i--) {
      wash[i].t += dt * 2.6;
      wash[i].y += 36 * dt;
      if (wash[i].t >= 1) wash.splice(i, 1);
    }
    for (let i = mist.length - 1; i >= 0; i--) {
      mist[i].t += dt * 1.15;
      mist[i].y -= 22 * dt;
      if (mist[i].t >= 1) mist.splice(i, 1);
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
  }

  function tickRumble(dt) {
    G.rumbleT -= dt;
    if (G.rumbleT > 0) return;
    G.rumbleT = G.mode === 'play' && G.deadT <= 0 ? 0.086 : 0.16;
    if (G.mode === 'lose') return;
    if (audio.ctx && !audio.muted) audio.rumble();
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
      tickRumble(dt * 0.35);
      return;
    }
    updateFx(dt);
    tickRumble(dt);
    tickSerp(dt);
    tickMist(dt);

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

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isRain()) rainThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function drawMark(isl, bio) {
    const x = sx(isl.x);
    const y = sy(isl.y);
    const w = isl.w * scale;
    const h = isl.h * scale;
    ctx.save();
    if (bio === 'nest') {
      ctx.fillStyle = 'rgba(28, 18, 22, 0.92)';
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.55);
      ctx.lineTo(x + w * 0.22, y + h * 0.18);
      ctx.lineTo(x - w * 0.18, y + h * 0.18);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(VEN, 0.28);
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.42);
      ctx.lineTo(x + w * 0.08, y + h * 0.04);
      ctx.lineTo(x - w * 0.08, y + h * 0.04);
      ctx.closePath();
      ctx.fill();
    } else if (bio === 'valley') {
      ctx.fillStyle = 'rgba(10, 36, 28, 0.92)';
      ctx.beginPath();
      ctx.moveTo(x - w * 0.4, y + h * 0.28);
      ctx.lineTo(x - w * 0.08, y - h * 0.5);
      ctx.lineTo(x + w * 0.22, y - h * 0.22);
      ctx.lineTo(x + w * 0.42, y + h * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.28);
      ctx.fillRect(x - w * 0.08, y - h * 0.18, w * 0.12, h * 0.42);
    } else {
      ctx.fillStyle = 'rgba(8, 36, 18, 0.94)';
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.58);
      ctx.lineTo(x + w * 0.42, y + h * 0.28);
      ctx.lineTo(x - w * 0.42, y + h * 0.28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(LEAF, 0.5);
      ctx.beginPath();
      ctx.moveTo(x, y - h * 0.32);
      ctx.lineTo(x + w * 0.22, y + h * 0.08);
      ctx.lineTo(x - w * 0.22, y + h * 0.08);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWorld() {
    const bio = biome();
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (bio === 'nest') {
      g.addColorStop(0, '#140810');
      g.addColorStop(0.45, '#0c0810');
      g.addColorStop(1, '#08060a');
    } else if (bio === 'valley') {
      g.addColorStop(0, '#061814');
      g.addColorStop(0.5, '#041410');
      g.addColorStop(1, '#03100c');
    } else {
      g.addColorStop(0, '#06180c');
      g.addColorStop(0.5, '#041208');
      g.addColorStop(1, '#030e08');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const canopy = ctx.createLinearGradient(sx(0), sy(0), sx(VW), sy(0));
    canopy.addColorStop(0, 'rgba(4, 28, 12, 0.72)');
    canopy.addColorStop(0.22, 'rgba(4, 28, 12, 0)');
    canopy.addColorStop(0.78, 'rgba(4, 28, 12, 0)');
    canopy.addColorStop(1, 'rgba(4, 28, 12, 0.72)');
    ctx.fillStyle = canopy;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.save();
    ctx.beginPath();
    for (let i = -1; i <= 26; i++) {
      const yy = i * 32;
      const rx = riverX(yy);
      const half = 38 + Math.sin((G.scroll + yy) * 0.02) * 8;
      if (i === -1) ctx.moveTo(sx(rx - half), sy(yy));
      else ctx.lineTo(sx(rx - half), sy(yy));
    }
    for (let i = 26; i >= -1; i--) {
      const yy = i * 32;
      const rx = riverX(yy);
      const half = 38 + Math.sin((G.scroll + yy) * 0.02) * 8;
      ctx.lineTo(sx(rx + half), sy(yy));
    }
    ctx.closePath();
    ctx.fillStyle = bio === 'nest' ? 'rgba(40, 18, 28, 0.55)' : 'rgba(18, 72, 58, 0.42)';
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, bio === 'nest' ? 0.18 : 0.28);
    ctx.lineWidth = 1.4 * scale;
    ctx.stroke();
    ctx.restore();

    const off = (G.scroll * 0.45) % 40;
    ctx.save();
    ctx.strokeStyle = bio === 'nest'
      ? 'rgba(80, 32, 48, 0.22)'
      : 'rgba(24, 80, 48, 0.22)';
    ctx.lineWidth = 1;
    for (let i = -1; i < 22; i++) {
      const yy = sy(i * 40 - off);
      ctx.beginPath();
      ctx.moveTo(sx(0), yy);
      ctx.lineTo(sx(VW), yy);
      ctx.stroke();
    }
    ctx.restore();

    if (!REDUCE) {
      for (let i = 0; i < rain.length; i++) {
        const d = rain[i];
        const a = isRain() ? 0.28 : 0.08;
        ctx.strokeStyle = rgba(VEN, a * d.z);
        ctx.lineWidth = (isRain() ? 1.2 : 0.7) * scale;
        ctx.beginPath();
        ctx.moveTo(sx(d.x), sy(d.y));
        ctx.lineTo(sx(d.x + 3), sy(d.y + d.len));
        ctx.stroke();
      }
    }

    for (let i = 0; i < dust.length; i++) {
      const s = dust[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(s.spin);
      if (s.kind === 'fly') {
        ctx.fillStyle = rgba(VEN, s.a * 0.7);
        ctx.beginPath();
        ctx.arc(0, 0, s.s * 0.28 * scale, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(LEAF, s.a);
        ctx.beginPath();
        ctx.ellipse(0, 0, s.s * 0.5 * scale, s.s * 0.18 * scale, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    for (let i = 0; i < marks.length; i++) drawMark(marks[i], bio);

    for (let i = 0; i < wash.length; i++) {
      const w = wash[i];
      ctx.strokeStyle = rgba(CYN, (1 - w.t) * 0.28);
      ctx.lineWidth = 1.4 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(w.y), w.r * (0.55 + w.t) * scale, w.r * 0.4 * scale, 0, 0, TAU);
      ctx.stroke();
    }

    for (let i = 0; i < mist.length; i++) {
      const m = mist[i];
      const a = 1 - m.t;
      ctx.fillStyle = rgba(VEN, a * 0.14);
      ctx.beginPath();
      ctx.ellipse(sx(m.x), sy(m.y), m.r * (0.7 + m.t) * scale, m.r * 0.55 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawPlane(x, y, bank) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(bank || 0);
    ctx.scale(scale, scale);
    const flicker = REDUCE ? 1 : 0.72 + Math.sin(G.t * 38) * 0.28;
    ctx.fillStyle = rgba(VEN, 0.55 * flicker);
    ctx.beginPath();
    ctx.moveTo(-5, 12);
    ctx.lineTo(-2.2, 12);
    ctx.lineTo(-3.6, 26);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, 12);
    ctx.lineTo(2.2, 12);
    ctx.lineTo(3.6, 26);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.5 * flicker);
    ctx.beginPath();
    ctx.moveTo(-4.2, 12);
    ctx.lineTo(-3, 20);
    ctx.lineTo(-2.6, 12);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4.2, 12);
    ctx.lineTo(3, 20);
    ctx.lineTo(2.6, 12);
    ctx.fill();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(VEN, 0.88);
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(4, -16);
      ctx.lineTo(-4, -16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = rgba(INK, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(5.2, 2);
    ctx.lineTo(3.2, 14);
    ctx.lineTo(-3.2, 14);
    ctx.lineTo(-5.2, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(HOT, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(4.4, 1);
    ctx.lineTo(2.6, 12);
    ctx.lineTo(-2.6, 12);
    ctx.lineTo(-4.4, 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(VEN, 0.92);
    ctx.beginPath();
    ctx.moveTo(-2.2, -18);
    ctx.lineTo(-7, -8);
    ctx.lineTo(-3.4, -6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2.2, -18);
    ctx.lineTo(7, -8);
    ctx.lineTo(3.4, -6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(LEAF, 0.95);
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-18, 8);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(18, 8);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.85);
    ctx.beginPath();
    ctx.moveTo(-5, 10);
    ctx.lineTo(-10, 16);
    ctx.lineTo(-2, 13);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, 10);
    ctx.lineTo(10, 16);
    ctx.lineTo(2, 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(2.6, -1);
    ctx.lineTo(0, 3);
    ctx.lineTo(-2.6, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.75);
    ctx.beginPath();
    ctx.arc(0, -4, 1.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnt(en) {
    const flash = en.flash > 0;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.fillStyle = flash ? rgba(WHT, 0.95) : rgba(en.rgb, 0.95);
    ctx.shadowColor = rgba(en.rgb, 0.55);
    ctx.shadowBlur = 8;
    if (en.type === 'wasp') {
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(7, 3);
      ctx.lineTo(0, 9);
      ctx.lineTo(-7, 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(VEN, 0.55);
      ctx.fillRect(-9, 1, 18, 2);
      ctx.fillStyle = rgba(GOLD, 0.5);
      ctx.fillRect(-1.6, 8, 1.2, 5);
      ctx.fillRect(0.4, 8, 1.2, 5);
    } else if (en.type === 'hawk') {
      ctx.rotate(Math.atan2(en.vy, en.vx) + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(8, 1);
      ctx.lineTo(0, 12);
      ctx.lineTo(-8, 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-9, -1, 18, 2);
    } else if (en.type === 'gunship') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 12, 7, 0, 0, TAU);
      ctx.fill();
      ctx.fillRect(-4, -5, 16, 4);
      ctx.save();
      ctx.rotate(en.spin);
      ctx.strokeStyle = rgba(WHT, 0.65);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(15, 0);
      ctx.moveTo(0, -15);
      ctx.lineTo(0, 15);
      ctx.stroke();
      ctx.restore();
    } else if (en.type === 'serpent') {
      ctx.rotate(Math.sin(en.phase) * 0.35);
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.quadraticCurveTo(10, -8, 4, 4);
      ctx.quadraticCurveTo(-8, 12, 0, 22);
      ctx.quadraticCurveTo(8, 10, -4, 2);
      ctx.quadraticCurveTo(-10, -8, 0, -22);
      ctx.fill();
      ctx.fillStyle = rgba(ACID, 0.7);
      ctx.beginPath();
      ctx.arc(-3, -14, 2.2, 0, TAU);
      ctx.arc(3, -14, 2.2, 0, TAU);
      ctx.fill();
    } else if (en.type === 'aa') {
      ctx.fillRect(-10, 2, 20, 10);
      ctx.fillRect(-4, -10, 8, 14);
      ctx.fillStyle = rgba(GOLD, 0.75);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(3, -4);
      ctx.lineTo(-3, -4);
      ctx.closePath();
      ctx.fill();
      if (en.lock > 0 && G.mode === 'play') {
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = rgba(GOLD, 0.55);
        ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.lineWidth = 1.2 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(en.x), sy(en.y));
        ctx.lineTo(sx(G.player.x), sy(G.player.y));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (en.type === 'pod') {
      ctx.beginPath();
      ctx.ellipse(0, 1, 9, 11, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(VEN, 0.7);
      ctx.beginPath();
      ctx.ellipse(0, 1, 4, 6, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(WHT, 0.4);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, 1, 12, 0.3, Math.PI - 0.3);
      ctx.stroke();
    } else if (en.type === 'cargo') {
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.fillRect(-5, -4, 10, 8);
      ctx.fillStyle = rgba(VEN, 0.7);
      ctx.fillRect(-12, 0, 24, 3);
    } else if (en.type === 'tank') {
      ctx.fillRect(-14, 0, 28, 12);
      ctx.fillRect(-8, -8, 16, 10);
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.fillRect(-2, -14, 4, 10);
    } else if (en.type === 'boat') {
      ctx.beginPath();
      ctx.moveTo(-18, 6);
      ctx.lineTo(-10, -6);
      ctx.lineTo(14, -6);
      ctx.lineTo(18, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(-4, -12, 8, 8);
    } else if (en.type === 'mid') {
      if (G.stage === 1) {
        ctx.beginPath();
        ctx.ellipse(0, 4, 28, 14, 0, 0, TAU);
        ctx.fill();
        ctx.fillRect(-22, -6, 12, 8);
        ctx.fillRect(10, -6, 12, 8);
        ctx.fillStyle = rgba(VEN, 0.7);
        ctx.beginPath();
        ctx.arc(0, -2, 8, 0, TAU);
        ctx.fill();
      } else if (G.stage === 2) {
        ctx.fillRect(-32, -2, 64, 16);
        ctx.fillRect(10, -16, 12, 18);
        ctx.fillStyle = rgba(CYN, 0.6);
        ctx.fillRect(-22, 4, 44, 6);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(12, 8);
        ctx.lineTo(-12, 8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(ACID, 0.7);
        ctx.fillRect(-18, 4, 36, 10);
      }
    } else if (en.type === 'boss') {
      if (G.stage === 1) {
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.quadraticCurveTo(36, -6, 22, 16);
        ctx.lineTo(-22, 16);
        ctx.quadraticCurveTo(-36, -6, 0, -28);
        ctx.fill();
        ctx.fillStyle = rgba(VEN, 0.7);
        ctx.beginPath();
        ctx.moveTo(-10, -22);
        ctx.lineTo(-22, -6);
        ctx.lineTo(-8, -8);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, -22);
        ctx.lineTo(22, -6);
        ctx.lineTo(8, -8);
        ctx.closePath();
        ctx.fill();
      } else if (G.stage === 2) {
        ctx.fillRect(-50, 0, 100, 20);
        ctx.fillRect(18, -22, 18, 24);
        ctx.fillRect(-40, 8, 12, 16);
        ctx.fillRect(10, 8, 12, 16);
        ctx.fillStyle = rgba(CYN, 0.7);
        ctx.fillRect(-28, 4, 56, 8);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(18, -8);
        ctx.lineTo(42, 6);
        ctx.lineTo(16, 18);
        ctx.lineTo(-16, 18);
        ctx.lineTo(-42, 6);
        ctx.lineTo(-18, -8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(VEN, 0.8);
        ctx.beginPath();
        ctx.moveTo(-16, -4);
        ctx.lineTo(-6, -22);
        ctx.lineTo(-2, 6);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(16, -4);
        ctx.lineTo(6, -22);
        ctx.lineTo(2, 6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = rgba(WHT, 0.28);
      ctx.fillRect(-26, 2, 52, 6);
    }
    ctx.restore();
  }

  function drawSerpentBomb() {
    if (G.serpT <= 0) return;
    const a = clamp(G.serpT / 0.82, 0, 1);
    const sway = Math.sin(G.t * 14) * 54;
    const x = G.serpX + sway;
    const y = G.serpY;
    ctx.save();
    ctx.fillStyle = rgba(VEN, 0.1 * a);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(Math.sin(G.t * 14) * 0.18);
    ctx.scale(scale, scale);
    ctx.shadowColor = rgba(VEN, 0.95);
    ctx.shadowBlur = 24;
    ctx.fillStyle = rgba(VEN, 0.92 * a);
    ctx.beginPath();
    ctx.moveTo(0, -86);
    ctx.quadraticCurveTo(22, -20, 8, 20);
    ctx.lineTo(0, 110);
    ctx.lineTo(-8, 20);
    ctx.quadraticCurveTo(-22, -20, 0, -86);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(ACID, 0.9 * a);
    ctx.beginPath();
    ctx.moveTo(0, -78);
    ctx.quadraticCurveTo(8, -16, 0, 70);
    ctx.quadraticCurveTo(-8, -16, 0, -78);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.85 * a);
    ctx.fillRect(-2, -70, 4, 150);
    ctx.fillStyle = rgba(GOLD, 0.8 * a);
    ctx.beginPath();
    ctx.moveTo(-10, -70);
    ctx.lineTo(-18, -42);
    ctx.lineTo(-6, -52);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(10, -70);
    ctx.lineTo(18, -42);
    ctx.lineTo(6, -52);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.restore();
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
      ctx.shadowBlur = 9;
      if (s.kind === 'venom') {
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(5, 2);
        ctx.lineTo(0, 10);
        ctx.lineTo(-5, 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(ACID, 0.75);
        ctx.fillRect(-1.4, 6, 2.8, 9);
      } else {
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(2.6, 1);
        ctx.lineTo(0, 8);
        ctx.lineTo(-2.6, 1);
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
      const rgb = p.kind === 'bomb' ? VEN : GOLD;
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
      ctx.fillStyle = '#041208';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.rotate(-p.t * 2.2);
      ctx.shadowBlur = 0;
      ctx.fillText(DROP_GLYPH[p.kind] || '牙', 0, 1);
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
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : HOT, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : HOT, 0.6);
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
    ctx.fillStyle = '#041208';
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
    drawSerpentBomb();
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
    mist.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'chaos' ? 'chaos' : 'raid';
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
    G.serpT = 0;
    G.serpY = VH;
    G.mistT = 0;
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
    G.rumbleT = 0;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedWorld();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isRain() ? '谷雨 · 弹更密' : '毒牙 · 第 1 关', false, true);
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
    G.serpT = 0;
    G.mistT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedWorld();
    showOverlay(
      'title',
      '毒牙',
      '开战斗机沿河谷向上打。空格机炮，Shift 喷毒。密林先中破再关底。撞机扣命。'
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
    if (G.mode === 'title') startGame('chaos');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isRain()) goTitle();
      else startGame('chaos');
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
  if (btnChaos) {
    btnChaos.addEventListener('click', function () {
      audio.ensure();
      startGame('chaos');
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
      else if (G.mode === 'win' && isRain()) goTitle();
      else if (G.mode === 'win') startGame('chaos');
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
