'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.4;
  const BOMB_CAP = 6;
  const WPN_MAX = 3;
  const SPD_MAX = 3;
  const BEST_KEY = 'playbox-varth-best';
  const MUTE_KEY = 'playbox-varth-mute';
  const OPS = '方向 / WASD 移动 · 空格开火 · Shift / Z 焰弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const TEAL = [30, 232, 196];
  const SKY = [122, 255, 220];
  const GOLD = [255, 227, 107];
  const WHT = [230, 255, 248];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ORG = [255, 160, 72];
  const SAND = [196, 168, 96];
  const STEEL = [90, 140, 132];
  const STORM = [80, 200, 255];
  const DEEP = [8, 40, 34];
  const FIRE = [255, 120, 48];

  const WPN_NAME = { vulcan: '火', beam: '束', home: '追' };
  const DROP_CYCLE = ['vulcan', 'beam', 'home', 'speed', 'bomb'];
  const DROP_GLYPH = { vulcan: '火', beam: '束', home: '追', speed: '速', bomb: '焰' };
  const WPN_RGB = { vulcan: GOLD, beam: TEAL, home: SKY, speed: STORM, bomb: FIRE };

  const STAGES = [
    {
      name: '第 1 关 · 荒原',
      mid: '沙甲',
      boss: '雷步',
      midHp: 36,
      bossHp: 84,
      waves: [
        { t: 0.8, kind: 'scout', n: 5 },
        { t: 3.0, kind: 'flank', dir: 1 },
        { t: 5.4, kind: 'dive', n: 4 },
        { t: 7.8, kind: 'tanks' },
        { t: 10.2, kind: 'carrier' },
        { t: 12.6, kind: 'scout', n: 7 },
        { t: 15.0, kind: 'mid' },
        { t: 20.2, kind: 'ring', n: 4 },
        { t: 22.6, kind: 'dive', n: 4 },
        { t: 24.8, kind: 'flank', dir: -1 },
        { t: 27.2, kind: 'aa' },
        { t: 32.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 城塞',
      mid: '城卫',
      boss: '堡垒',
      midHp: 48,
      bossHp: 112,
      waves: [
        { t: 0.6, kind: 'scout', n: 7 },
        { t: 2.6, kind: 'dive', n: 5 },
        { t: 4.8, kind: 'flank', dir: -1 },
        { t: 7.0, kind: 'ring', n: 5 },
        { t: 9.2, kind: 'carrier' },
        { t: 11.4, kind: 'tanks' },
        { t: 13.6, kind: 'scout', n: 9 },
        { t: 15.8, kind: 'mid' },
        { t: 21.2, kind: 'flank', dir: 1 },
        { t: 23.4, kind: 'dive', n: 6 },
        { t: 25.6, kind: 'aa' },
        { t: 27.8, kind: 'carrier' },
        { t: 30.0, kind: 'scout', n: 9 },
        { t: 36.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 雷巢',
      mid: '雷卫',
      boss: '瓦特核',
      midHp: 60,
      bossHp: 156,
      waves: [
        { t: 0.5, kind: 'scout', n: 9 },
        { t: 2.2, kind: 'flank', dir: 1 },
        { t: 4.0, kind: 'flank', dir: -1 },
        { t: 6.0, kind: 'dive', n: 6 },
        { t: 8.0, kind: 'ring', n: 6 },
        { t: 10.0, kind: 'carrier' },
        { t: 11.8, kind: 'aa' },
        { t: 13.8, kind: 'mid' },
        { t: 19.0, kind: 'scout', n: 11 },
        { t: 21.0, kind: 'dive', n: 6 },
        { t: 23.0, kind: 'ring', n: 6 },
        { t: 25.0, kind: 'carrier' },
        { t: 27.0, kind: 'tanks' },
        { t: 28.8, kind: 'flank', dir: 1 },
        { t: 31.0, kind: 'scout', n: 9 },
        { t: 38.0, kind: 'boss' }
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
  const btnStorm = document.getElementById('btn-storm');
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
  const spdLabel = document.getElementById('spd-label');
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
  let wpnTok = 0;
  let spdTok = 0;
  let eid = 1;
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const bolts = [];

  const G = {
    mode: 'title',
    kind: 'raid',
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
    wpn: 'vulcan',
    wpnLv: 0,
    spdLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    isles: [],
    burns: [],
    locks: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: TEAL,
    punch: 1,
    muzzle: 0,
    spawnT: 0.7,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    nextIsle: 40,
    stormFlash: 0,
    why: ''
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
  function isDense() {
    return G.kind === 'storm';
  }
  function plySpd() {
    return (isDense() ? 318 : 274) + G.spdLv * 36 + G.wpnLv * 8;
  }
  function scrollSpd() {
    if (hasBig()) return isDense() ? 36 : 28;
    return (isDense() ? 114 : 84) + G.stage * 6 + Math.min(18, G.combo);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isDense() ? 160 : 108;
  }
  function homeCount() {
    if (G.wpn !== 'home') return 0;
    if (G.wpnLv <= 0) return 1;
    if (G.wpnLv === 1) return 2;
    if (G.wpnLv === 2) return 3;
    return 4;
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
    shoot(kind) {
      this.ensure();
      if (kind === 'beam') this.beep(980, 0.068, 'sawtooth', 0.03, 320);
      else if (kind === 'home') this.beep(420, 0.08, 'triangle', 0.032, 880);
      else this.beep(760, 0.044, 'square', 0.03, 1540);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1300);
      this.beep(560 * lift, 0.066, 'square', 0.042, 980 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.2 : 0.1, big ? 0.076 : 0.046, big ? 220 : 460);
      this.beep(big ? 160 : 250, big ? 0.26 : 0.13, 'sawtooth', 0.05, 52);
    },
    bomb() {
      this.ensure();
      this.noise(0.34, 0.086, 140);
      this.beep(72, 0.48, 'sawtooth', 0.076, 34);
      this.beep(620, 0.18, 'square', 0.04, 180);
      this.beep(1240, 0.12, 'sine', 0.03, 280);
    },
    pow() {
      this.ensure();
      this.beep(494, 0.08, 'square', 0.044, 740);
      this.beep(740, 0.13, 'triangle', 0.04, 1108);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.04, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.03, 1176);
    },
    miss() {
      this.ensure();
      this.beep(150, 0.07, 'sine', 0.025, 84);
    },
    death() {
      this.ensure();
      this.noise(0.15, 0.056, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 76);
      this.beep(150, 0.32, 'sine', 0.045, 44);
    },
    wave() {
      this.ensure();
      this.beep(370, 0.09, 'sine', 0.04, 494);
      this.beep(494, 0.11, 'sine', 0.04, 622);
      this.beep(740, 0.2, 'triangle', 0.045, 988);
    },
    boss() {
      this.ensure();
      this.beep(185, 0.18, 'sawtooth', 0.052, 98);
      this.beep(138, 0.3, 'square', 0.04, 72);
    },
    win() {
      this.ensure();
      this.beep(494, 0.1, 'square', 0.045, 622);
      this.beep(622, 0.12, 'triangle', 0.045, 740);
      this.beep(988, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(208, 0.18, 'sawtooth', 0.04, 86);
      this.beep(130, 0.3, 'sine', 0.05, 46);
    },
    start() {
      this.ensure();
      this.beep(370, 0.09, 'square', 0.04, 740);
      this.beep(740, 0.14, 'triangle', 0.035, 1108);
    },
    oneup() {
      this.ensure();
      this.beep(622, 0.08, 'square', 0.04, 830);
      this.beep(830, 0.12, 'triangle', 0.045, 1244);
    },
    lock() {
      this.ensure();
      this.beep(880, 0.04, 'square', 0.018, 1320);
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
    if (G.score > G.best) G.best = G.score;
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
    if (bestEl) bestEl.textContent = String(G.best);
  }

  function addScore(n) {
    if (n <= 0) return;
    G.score += n;
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
      if (bestEl) bestEl.textContent = String(G.best);
    }
    if (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.nextLife += LIFE_EVERY;
      audio.oneup();
      toast('1UP', false, true);
      syncHud();
    }
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + n;
      addTok += 1;
      const tok = addTok;
      setTimeout(function () {
        if (tok === addTok && scoreAdd) scoreAdd.hidden = true;
      }, 700);
    }
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    setTimeout(function () {
      if (tok === toastTok && toastEl) toastEl.classList.add('hidden');
    }, 1100);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function wpnText() {
    const name = WPN_NAME[G.wpn] || '火';
    if (G.wpnLv <= 0) return name;
    if (G.wpnLv >= WPN_MAX) return name + ' MAX';
    return name + ' ' + G.wpnLv;
  }

  function spdText() {
    if (G.spdLv <= 0) return '速';
    if (G.spdLv >= SPD_MAX) return '速 MAX';
    return '速 ' + G.spdLv;
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

  function flashSpd() {
    if (!spdLabel) return;
    spdLabel.classList.remove('hot');
    void spdLabel.offsetWidth;
    spdLabel.classList.add('hot');
    spdTok += 1;
    const tok = spdTok;
    setTimeout(function () {
      if (tok === spdTok && spdLabel) spdLabel.classList.remove('hot');
    }, 280);
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const el = document.createElement('i');
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
      stageLabel.textContent = st ? st.name : '第 ' + G.stage + ' 关';
      stageLabel.classList.toggle('hot', G.stage >= 3 || hasBig());
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密弹' : '空袭';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('beam', G.wpn === 'beam');
      wpnLabel.classList.toggle('home', G.wpn === 'home');
    }
    if (spdLabel) {
      spdLabel.textContent = spdText();
      spdLabel.classList.toggle('hot', G.spdLv >= SPD_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '焰 ×' + G.bombs;
      bombLabel.classList.toggle('empty', G.bombs <= 0);
    }
    if (btnBomb) btnBomb.disabled = G.mode === 'play' && G.bombs <= 0 && G.bombT <= 0;
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 被弹或撞机扣一命', 'warn');
    else if (G.mode === 'win') setHint('雷巢尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 焰弹燎空', 'warn');
    else setHint('方向移动 · 空格开火 · Shift 焰弹 · 捡 火/束/追/速', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'VRTH';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isDense() ? '换模式' : '密弹';
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
    capArr(particles, 360);
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

  function addBolt(x0, y0, x1, y1, rgb) {
    const pts = [{ x: x0, y: y0 }];
    const n = 5 + ((Math.random() * 3) | 0);
    for (let i = 1; i < n; i++) {
      const t = i / n;
      pts.push({
        x: lerp(x0, x1, t) + rand(-14, 14),
        y: lerp(y0, y1, t) + rand(-8, 8)
      });
    }
    pts.push({ x: x1, y: y1 });
    bolts.push({ pts: pts, t: 0, life: 0.22, rgb: rgb || GOLD });
    capArr(bolts, 18);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.4),
        a: rand(0.18, 0.7)
      });
    }
  }

  function seedIsles() {
    G.isles.length = 0;
    for (let i = 0; i < 7; i++) spawnIsle(-30 - i * 110);
  }

  function spawnIsle(y) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const w = rand(36, 86);
    const h = rand(40, 120);
    const x = side < 0 ? rand(10, 88) : rand(VW - 88, VW - 10);
    G.isles.push({
      x: x, y: y, w: w, h: h,
      kind: G.stage,
      hue: hash2((G.scroll + y) | 0),
      bits: 1 + ((hash2(((G.scroll + y) * 5) | 0) * 3) | 0)
    });
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

  function spawnEnt(spec) {
    if (G.ents.length > 54) return null;
    const en = {
      id: eid++,
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
      baseX: spec.x,
      lock: 0
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
      vy: extra.vy == null ? 82 : extra.vy,
      hp: extra.hp || 1,
      r: 11,
      score: 50,
      rgb: extra.rgb || STEEL,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.6, 1.4),
      phase: extra.phase || 0
    });
  }

  function spawnScoutV(n, xmid) {
    const mid = xmid == null ? VW * 0.5 + rand(-40, 40) : xmid;
    const gap = 28;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2;
      spawnScout(mid + k * gap, -18 - Math.abs(k) * 16, { vy: 88, fireCd: 0.7 + Math.abs(k) * 0.12 });
    }
  }

  function spawnFlank(dir) {
    const x = dir > 0 ? -20 : VW + 20;
    for (let i = 0; i < 6; i++) {
      spawnEnt({
        type: 'flank',
        x: x, y: 36 + i * 26,
        vx: dir * 96, vy: 44,
        hp: 1, r: 10, score: 60,
        rgb: STORM, phase: i * 0.4, fireCd: 0.9 + i * 0.08
      });
    }
  }

  function spawnDive(n) {
    for (let i = 0; i < n; i++) {
      const x = 50 + i * ((VW - 100) / Math.max(1, n - 1));
      spawnEnt({
        type: 'dive',
        x: x, y: -24 - i * 18,
        vx: 0, vy: 42,
        hp: 2, r: 13, score: 80,
        rgb: PNK, dive: true, fireCd: 0.5 + i * 0.1
      });
    }
  }

  function spawnTank(x, y) {
    spawnEnt({
      type: 'tank',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 5, r: 15, score: 140,
      rgb: SAND, ground: true, fireCd: rand(0.7, 1.3),
      w: 28, h: 20
    });
  }

  function spawnAa(x, y) {
    spawnEnt({
      type: 'aa',
      x: x, y: y,
      vx: 0, vy: 0,
      hp: 4, r: 14, score: 160,
      rgb: ORG, ground: true, fireCd: rand(0.55, 1.1),
      w: 24, h: 22
    });
  }

  function spawnTankWave() {
    spawnTank(rand(56, 150), -24);
    spawnTank(rand(VW - 150, VW - 56), -90);
  }

  function spawnAaWave() {
    spawnAa(rand(50, 140), -20);
    spawnAa(rand(VW - 140, VW - 50), -86);
  }

  function spawnCarrier() {
    return spawnEnt({
      type: 'carrier',
      x: rand(90, VW - 90), y: -30,
      vx: rand(-30, 30), vy: 46,
      hp: 8, r: 20, score: 300,
      rgb: GOLD, drop: 'cycle', fireCd: 0.55
    });
  }

  function spawnRing(n) {
    const cx = VW * 0.5 + rand(-50, 50);
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'ring',
        x: cx, y: -16,
        vx: 0, vy: 34,
        hp: 2, r: 12, score: 120,
        rgb: TEAL, phase: (i / n) * TAU, spin: 1.5, fireCd: 0.8 + i * 0.12
      });
    }
  }

  function hpMul() {
    return isDense() ? 1.22 : 1;
  }

  function spawnMid() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.midHp : 36) * hpMul());
    spawnEnt({
      type: 'mid',
      x: VW * 0.5, y: -50,
      vx: 46, vy: 28,
      hp: hp, r: 28, score: 2000,
      rgb: GOLD, fireCd: 0.42, w: 52, h: 56
    });
    audio.boss();
    toast(st ? st.mid : '机甲', false, true);
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.bossHp : 84) * hpMul());
    spawnEnt({
      type: 'boss',
      x: VW * 0.5, y: -70,
      vx: 38, vy: 22,
      hp: hp, r: 42, score: 4000 + 1500 * G.stage,
      rgb: MAG, fireCd: 0.32, w: 78, h: 86
    });
    audio.boss();
    toast(st ? st.boss : '机甲', true, false);
    kick(4.2);
  }

  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'boss' || t === 'mid') && G.ents[i].hp > 0) return true;
    }
    return false;
  }

  function fireWave(w) {
    if (w.kind === 'scout') spawnScoutV(w.n || 5);
    else if (w.kind === 'flank') spawnFlank(w.dir || 1);
    else if (w.kind === 'dive') spawnDive(w.n || 4);
    else if (w.kind === 'tanks') spawnTankWave();
    else if (w.kind === 'aa') spawnAaWave();
    else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'ring') spawnRing(w.n || 4);
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function nextDropKind() {
    const k = DROP_CYCLE[G.dropI % DROP_CYCLE.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vx: rand(-28, 28), vy: 42,
      kind: kind, t: 0, r: 12
    });
  }

  function eShot(x, y, vx, vy, rgb, r) {
    if (G.eShots.length > shotCap()) return;
    G.eShots.push({ x: x, y: y, vx: vx, vy: vy, rgb: rgb || MAG, r: r || 3.4, t: 0 });
  }

  function aimShot(x, y, spd, rgb, r) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const len = Math.max(0.001, hypot(dx, dy));
    eShot(x, y, dx / len * spd, dy / len * spd, rgb, r);
  }

  function ringShot(x, y, n, spd, rot, rgb, r) {
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, rgb, r);
    }
  }

  function addShot(spec) {
    if (G.shots.length > 90) return;
    G.shots.push({
      x: spec.x,
      y: spec.y,
      vx: spec.vx || 0,
      vy: spec.vy,
      r: spec.r,
      rgb: spec.rgb,
      kind: spec.kind,
      pierce: spec.pierce || 0,
      dmg: spec.dmg || 1,
      home: !!spec.home,
      tid: spec.tid || 0,
      age: 0,
      seen: {}
    });
  }

  function findEnt(id) {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].id === id && G.ents[i].hp > 0) return G.ents[i];
    }
    return null;
  }

  function nearestEnts(n, fromX, fromY) {
    const list = [];
    for (let i = 0; i < G.ents.length; i++) {
      const en = G.ents[i];
      if (en.hp <= 0) continue;
      list.push({ en: en, d: hypot(en.x - fromX, en.y - fromY) });
    }
    list.sort(function (a, b) { return a.d - b.d; });
    const out = [];
    const cap = Math.min(n, list.length);
    for (let i = 0; i < cap; i++) out.push(list[i].en);
    return out;
  }

  function refreshLocks() {
    G.locks.length = 0;
    if (G.mode !== 'play' || G.wpn !== 'home' || G.deadT > 0) return;
    const n = homeCount();
    const list = nearestEnts(n, G.player.x, G.player.y - 40);
    for (let i = 0; i < list.length; i++) {
      const en = list[i];
      if (!en.lock) audio.lock();
      en.lock = 0.2;
      G.locks.push({ id: en.id, x: en.x, y: en.y, r: en.r });
    }
  }

  function fireFrom(x, y) {
    const lv = G.wpnLv;
    const w = G.wpn;
    if (w === 'beam') {
      const n = lv <= 0 ? 1 : lv === 1 ? 2 : 3;
      const pierce = 2 + lv;
      const gap = 8 + lv;
      if (n === 1) {
        addShot({ x: x, y: y, vy: -820, r: 3.6, rgb: TEAL, kind: 'beam', pierce: pierce, dmg: 1 });
      } else if (n === 2) {
        addShot({ x: x - 7, y: y, vy: -820, r: 3.3, rgb: TEAL, kind: 'beam', pierce: pierce, dmg: 1 });
        addShot({ x: x + 7, y: y, vy: -820, r: 3.3, rgb: TEAL, kind: 'beam', pierce: pierce, dmg: 1 });
      } else {
        addShot({ x: x, y: y - 2, vy: -860, r: 4.2, rgb: SKY, kind: 'beam', pierce: pierce + 1, dmg: 1 });
        addShot({ x: x - gap, y: y, vy: -800, r: 3.2, rgb: TEAL, kind: 'beam', pierce: pierce, dmg: 1 });
        addShot({ x: x + gap, y: y, vy: -800, r: 3.2, rgb: TEAL, kind: 'beam', pierce: pierce, dmg: 1 });
      }
    } else if (w === 'home') {
      const n = homeCount();
      const tgts = nearestEnts(n, x, y - 30);
      for (let i = 0; i < n; i++) {
        const ox = (i - (n - 1) / 2) * 10;
        const tid = tgts[i] ? tgts[i].id : (tgts[0] ? tgts[0].id : 0);
        addShot({
          x: x + ox, y: y, vx: ox * 8, vy: -420,
          r: 3.6, rgb: GOLD, kind: 'home', dmg: 1, home: true, tid: tid
        });
      }
    } else {
      const spd = -660;
      function pel(ox, vx, rgb) {
        addShot({ x: x + ox, y: y, vx: vx, vy: spd, r: 3.1, rgb: rgb || GOLD, kind: 'vulcan', dmg: 1 });
      }
      if (lv <= 0) {
        pel(-6, -12, WHT); pel(6, 12, WHT);
      } else if (lv === 1) {
        pel(-10, -70, GOLD); pel(0, 0, WHT); pel(10, 70, GOLD);
      } else if (lv === 2) {
        pel(-16, -140, ORG); pel(-7, -50, GOLD); pel(0, 0, WHT); pel(7, 50, GOLD); pel(16, 140, ORG);
      } else {
        pel(-20, -170, FIRE); pel(-12, -100, ORG); pel(-5, -36, GOLD);
        pel(0, 0, WHT);
        pel(5, 36, GOLD); pel(12, 100, ORG); pel(20, 170, FIRE);
      }
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const lv = G.wpnLv;
    const w = G.wpn;
    if (w === 'beam') G.fireCd = 0.120 - lv * 0.012;
    else if (w === 'home') G.fireCd = 0.148 - lv * 0.012;
    else G.fireCd = 0.094 - lv * 0.012;
    G.muzzle = 0.05;
    fireFrom(G.player.x, G.player.y - 16);
    audio.shoot(w);
    emit(3, {
      x: G.player.x, y: G.player.y - 12, j: 3,
      vx0: -40, vx1: 40, vy0: -140, vy1: -20,
      life: 0.12, r0: 1, r1: 2.2,
      rgb: WPN_RGB[w] || GOLD,
      g: 0
    });
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('焰弹用尽', true);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.52;
    G.bombFlash = 0.6;
    G.invuln = Math.max(G.invuln, 0.48);
    audio.bomb();
    screenFlash(FIRE, 0.72);
    popSpark(G.player.x, G.player.y, GOLD, 48);
    rings.push({ x: G.player.x, y: G.player.y, t: 0, rgb: FIRE, r: 22 });
    rings.push({ x: VW * 0.5, y: VH * 0.42, t: 0, rgb: TEAL, r: 40 });
    emit(32, {
      x: G.player.x, y: G.player.y, j: 18,
      vx0: -220, vx1: 220, vy0: -480, vy1: 80,
      life: 0.58, r0: 1.8, r1: 4.6, rgb: FIRE, g: 80
    });
    addBolt(G.player.x, G.player.y, G.player.x + rand(-30, 30), 20, GOLD);
    addBolt(G.player.x - 40, G.player.y - 10, G.player.x - 20, 8, TEAL);
    addBolt(G.player.x + 40, G.player.y - 10, G.player.x + 20, 8, SKY);
    G.burns.push({ x: G.player.x, y: 0, w: 78, t: 0, life: 0.74, tick: 0 });
    G.burns.push({ x: G.player.x - 96, y: 0, w: 52, t: 0, life: 0.56, tick: 0.06 });
    G.burns.push({ x: G.player.x + 96, y: 0, w: 52, t: 0, life: 0.56, tick: 0.06 });
    hitStop(0.078);
    kick(7.4);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
    }
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      emit(2, {
        x: s.x, y: s.y, j: 2,
        vx0: -50, vx1: 50, vy0: -50, vy1: 50,
        life: 0.14, r0: 1, r1: 2.2, rgb: WHT, g: 0
      });
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
    const pwr = en.type === 'boss' ? 2.7 : en.type === 'mid' ? 2.1 : en.type === 'carrier' ? 1.35 : 0.85;
    juice(en.x, en.y, en.rgb, pwr);
    audio.hit(G.combo);
    if (en.type === 'boss' || en.type === 'mid') audio.boom(en.type === 'boss');
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    if (G.combo >= 3) floatText(en.x, en.y - 10, '+' + pts, G.mult >= 3 ? GOLD : WHT, G.mult >= 3);
    hitStop(clamp(0.034 + G.combo * 0.0026, 0.034, 0.072));
    if (en.drop === 'cycle' || en.drop === true) spawnPow(en.x, en.y, nextDropKind());
    else if (en.drop === 'bomb') spawnPow(en.x, en.y, 'bomb');
    else if (en.drop) spawnPow(en.x, en.y, en.drop);
    else if ((en.type === 'tank' || en.type === 'aa' || en.type === 'ring') && Math.random() < 0.22) {
      spawnPow(en.x, en.y, nextDropKind());
    }
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
        toast('焰弹 +1', false, true);
      } else {
        addScore(800 * G.mult);
        toast('+800', false, true);
      }
    } else if (p.kind === 'speed') {
      if (G.spdLv < SPD_MAX) {
        G.spdLv += 1;
        toast(G.spdLv >= SPD_MAX ? '速 MAX' : '加速', false, true);
        flashSpd();
      } else {
        addScore(400 * G.mult);
        toast('+400', false, true);
      }
    } else {
      const kind = p.kind === 'beam' || p.kind === 'home' || p.kind === 'vulcan' ? p.kind : 'vulcan';
      if (G.wpn === kind) {
        if (G.wpnLv < WPN_MAX) {
          G.wpnLv += 1;
          toast(WPN_NAME[kind] + (G.wpnLv >= WPN_MAX ? ' MAX' : ' 强化'), false, true);
        } else {
          addScore(500 * G.mult);
          toast('+500', false, true);
        }
      } else {
        G.wpn = kind;
        G.wpnLv = Math.max(1, Math.min(G.wpnLv, 2));
        toast('武装 · ' + WPN_NAME[kind], false, true);
      }
      flashWpn();
    }
    juice(p.x, p.y, WPN_RGB[p.kind] || GOLD, 1.15);
    audio.pow();
    hitStop(0.038);
    floatText(p.x, p.y, DROP_GLYPH[p.kind] || '火', WPN_RGB[p.kind] || GOLD, true);
    syncHud();
  }

  function killPlayer() {
    if (G.deadT > 0) return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.bombT = 0;
    breakCombo();
    G.fireHold = false;
    juice(G.player.x, G.player.y, MAG, 2.45);
    audio.death();
    hitStop(0.078);
    kick(7.2);
    screenFlash(MAG, 0.55);
    if (G.wpnLv > 0 || G.wpn !== 'vulcan') {
      spawnPow(G.player.x, G.player.y - 18, G.wpn);
    }
    G.wpn = 'vulcan';
    G.wpnLv = 0;
    if (G.spdLv > 0) G.spdLv -= 1;
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
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function winGame() {
    addScore(8000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '雷巢尽破', (isDense() ? '密弹通关' : '三关打穿') + ' · 分数 ' + G.score);
    syncHud();
  }

  function livingCount() {
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

  function stormThink(dt) {
    if (hasBig() || G.stageClearT > 0) return;
    const st = STAGES[G.stage - 1];
    if (st) {
      while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t * 0.86) {
        fireWave(st.waves[G.waveI]);
        G.waveI += 1;
      }
    }
    G.spawnT -= dt;
    if (G.spawnT > 0) return;
    G.spawnT = clamp(1.5 / (1 + G.stage * 0.12), 0.4, 1.5);
    if (livingCount() > 26) return;
    const r = Math.random();
    if (r < 0.32) spawnScoutV(5 + (Math.random() * 6) | 0);
    else if (r < 0.52) spawnFlank(Math.random() < 0.5 ? -1 : 1);
    else if (r < 0.70) spawnDive(3 + (Math.random() * 4) | 0);
    else if (r < 0.84) spawnRing(3 + (Math.random() * 3) | 0);
    else if (r < 0.93) spawnTankWave();
    else spawnAaWave();
  }

  function bossFire(en, dense) {
    const half = en.hp < en.maxHp * 0.5;
    const stg = G.stage;
    if (en.type === 'mid') {
      if (en.fireCd > 0) return;
      en.fireCd = dense ? 0.42 : 0.55;
      aimShot(en.x, en.y + 16, dense ? 210 : 170, GOLD, 4);
      eShot(en.x - 16, en.y + 10, -40, 160, ORG, 3.4);
      eShot(en.x + 16, en.y + 10, 40, 160, ORG, 3.4);
      if (half) ringShot(en.x, en.y, dense ? 8 : 6, 120, en.t, MAG, 3.2);
      return;
    }
    if (en.fireCd > 0) return;
    if (stg === 1) {
      en.fireCd = (dense ? 0.34 : 0.46) - (half ? 0.08 : 0);
      aimShot(en.x - 22, en.y + 8, 180, MAG, 4);
      aimShot(en.x + 22, en.y + 8, 180, MAG, 4);
      if (half) {
        const n = dense ? 7 : 5;
        for (let i = 0; i < n; i++) {
          const a = Math.PI * 0.25 + i * (Math.PI * 0.5 / (n - 1));
          eShot(en.x, en.y + 18, Math.cos(a) * 150, Math.sin(a) * 150, PNK, 3.4);
        }
      }
    } else if (stg === 2) {
      en.fireCd = (dense ? 0.3 : 0.4) - (half ? 0.07 : 0);
      const n = half ? (dense ? 8 : 6) : 5;
      for (let i = 0; i < n; i++) {
        const a = en.t * 1.6 + i * (TAU / n);
        eShot(en.x, en.y + 6, Math.cos(a) * 140, Math.sin(a) * 140, STEEL, 3.3);
      }
      if (half) aimShot(en.x, en.y + 20, 200, GOLD, 4.2);
    } else {
      en.fireCd = (dense ? 0.28 : 0.38) - (half ? 0.08 : 0);
      ringShot(en.x, en.y, half ? (dense ? 14 : 10) : (dense ? 10 : 8), 128, en.t * 0.7, MAG, 3.2);
      aimShot(en.x, en.y + 24, 210, GOLD, 4.4);
      if (half) {
        ringShot(en.x, en.y, dense ? 10 : 8, 90, -en.t * 0.9, TEAL, 3);
        if (Math.random() < 0.4) addBolt(en.x, en.y, G.player.x, G.player.y, SKY);
      }
    }
  }

  function updateEnts(dt) {
    const dense = isDense();
    const scr = scrollSpd();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (en.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.fireCd > 0) en.fireCd -= dt;
      if (en.lock > 0) en.lock -= dt;

      if (en.type === 'scout') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.fireCd <= 0 && en.y > 40 && en.y < VH - 80 && Math.random() < (dense ? 0.018 : 0.01)) {
          en.fireCd = dense ? 0.7 : 1.05;
          aimShot(en.x, en.y + 6, dense ? 180 : 140, MAG, 3.2);
        }
      } else if (en.type === 'flank') {
        en.x += en.vx * dt;
        en.y += en.vy * dt + Math.sin(en.t * 3 + en.phase) * 26 * dt;
        if (en.fireCd <= 0 && en.y > 50) {
          en.fireCd = dense ? 0.85 : 1.2;
          eShot(en.x, en.y + 6, 0, dense ? 170 : 130, STORM, 3.2);
        }
      } else if (en.type === 'dive') {
        if (en.y < G.player.y - 40) {
          en.vx = lerp(en.vx, (G.player.x - en.x) * 0.9, 1 - Math.exp(-dt * 2.2));
          en.vy = lerp(en.vy, 210, 1 - Math.exp(-dt * 1.6));
        }
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.fireCd <= 0 && en.y > 80) {
          en.fireCd = 9;
          aimShot(en.x, en.y, dense ? 200 : 160, PNK, 3.4);
        }
      } else if (en.type === 'tank') {
        en.y += scr * dt;
        en.x += Math.sin(en.t * 0.8) * 18 * dt;
        if (en.fireCd <= 0 && en.y > 20 && en.y < VH - 40) {
          en.fireCd = dense ? 0.88 : 1.2;
          eShot(en.x, en.y - 8, 0, dense ? 150 : 110, SAND, 3.5);
        }
      } else if (en.type === 'aa') {
        en.y += scr * dt;
        if (en.fireCd <= 0 && en.y > 20 && en.y < VH - 40) {
          en.fireCd = dense ? 0.68 : 0.98;
          aimShot(en.x, en.y - 8, dense ? 176 : 136, ORG, 3.6);
        }
      } else if (en.type === 'carrier') {
        en.x += en.vx * dt + Math.sin(en.t * 1.6) * 40 * dt;
        en.y += en.vy * dt;
        if (en.x < 60 || en.x > VW - 60) en.vx *= -1;
        if (en.fireCd <= 0) {
          en.fireCd = dense ? 0.55 : 0.78;
          eShot(en.x - 10, en.y + 10, -50, 140, GOLD, 3.4);
          eShot(en.x, en.y + 12, 0, 150, GOLD, 3.4);
          eShot(en.x + 10, en.y + 10, 50, 140, GOLD, 3.4);
        }
      } else if (en.type === 'ring') {
        const R = 48 + Math.sin(en.t) * 8;
        const cx = VW * 0.5;
        en.x = cx + Math.cos(en.t * en.spin + en.phase) * R;
        en.y += en.vy * dt;
        if (en.fireCd <= 0 && en.y > 60) {
          en.fireCd = dense ? 1.0 : 1.4;
          ringShot(en.x, en.y, dense ? 6 : 5, 110, en.t, TEAL, 3);
        }
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < 110) en.y += en.vy * dt;
        else {
          en.x += en.vx * dt;
          if (en.x < 80 || en.x > VW - 80) en.vx *= -1;
          en.x = clamp(en.x, 80, VW - 80);
          if (en.type === 'boss' && G.stage === 2) {
            en.y = 118 + Math.sin(en.t * 1.3) * 22;
          }
        }
        bossFire(en, dense);
      }

      if (en.y > VH + 50 || en.x < -70 || en.x > VW + 70) {
        G.ents.splice(i, 1);
        continue;
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !en.ground) {
        const pr = 6;
        if (hypot(en.x - G.player.x, en.y - G.player.y) < en.r * 0.72 + pr) {
          killPlayer();
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.age += dt;
      if (s.home) {
        let t = s.tid ? findEnt(s.tid) : null;
        if (!t) {
          const near = nearestEnts(1, s.x, s.y);
          t = near[0] || null;
          if (t) s.tid = t.id;
        }
        if (t) {
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const len = Math.max(0.001, hypot(dx, dy));
          const spd = 540 + s.age * 80;
          const wantVx = dx / len * spd;
          const wantVy = dy / len * spd;
          s.vx = lerp(s.vx, wantVx, 1 - Math.exp(-dt * 7.5));
          s.vy = lerp(s.vy, wantVy, 1 - Math.exp(-dt * 7.5));
        } else {
          s.vy = Math.min(s.vy, -380);
        }
      }
      s.x += (s.vx || 0) * dt;
      s.y += s.vy * dt;
      if (s.y < -20 || s.y > VH + 20 || s.x < -30 || s.x > VW + 30) {
        G.shots.splice(i, 1);
        continue;
      }
      for (let j = 0; j < G.ents.length; j++) {
        const en = G.ents[j];
        if (en.hp <= 0) continue;
        if (s.seen[en.id]) continue;
        const rr = en.r + s.r;
        if (hypot(s.x - en.x, s.y - en.y) > rr) continue;
        s.seen[en.id] = 1;
        hurtEnt(en, s.dmg, s.x, s.y);
        if (s.pierce > 0) {
          s.pierce -= 1;
          if (s.pierce <= 0) {
            G.shots.splice(i, 1);
            break;
          }
        } else {
          G.shots.splice(i, 1);
          break;
        }
      }
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.t += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -24 || s.y > VH + 24 || s.x < -24 || s.x > VW + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (hypot(s.x - G.player.x, s.y - G.player.y) < 6 + s.r) {
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
      if (p.x < 16 || p.x > VW - 16) p.vx *= -1;
      p.vy = Math.min(70, p.vy + 18 * dt);
      if (p.y > VH + 24) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0) {
        if (hypot(p.x - G.player.x, p.y - G.player.y) < 22) {
          pickPow(p);
          G.pows.splice(i, 1);
        }
      }
    }
  }

  function updateBurns(dt) {
    for (let i = G.burns.length - 1; i >= 0; i--) {
      const b = G.burns[i];
      b.t += dt;
      b.tick -= dt;
      if (b.tick <= 0) {
        b.tick = 0.12;
        const half = b.w * 0.5;
        for (let j = 0; j < G.ents.length; j++) {
          const en = G.ents[j];
          if (en.hp <= 0) continue;
          if (Math.abs(en.x - b.x) < half + en.r * 0.5) {
            hurtEnt(en, 1, en.x, en.y);
          }
        }
        emit(3, {
          x: b.x, y: rand(40, VH - 80), j: half * 0.4,
          vx0: -40, vx1: 40, vy0: -180, vy1: -40,
          life: 0.28, r0: 1.4, r1: 3.2, rgb: Math.random() < 0.5 ? FIRE : GOLD, g: 40
        });
      }
      if (b.t >= b.life) G.burns.splice(i, 1);
    }
  }

  function updateWorld(dt) {
    const spd = G.mode === 'play' ? scrollSpd() : 36;
    G.scroll += spd * dt;
    G.nextIsle -= spd * dt;
    if (G.nextIsle <= 0) {
      spawnIsle(-80);
      G.nextIsle = rand(90, 150);
    }
    for (let i = G.isles.length - 1; i >= 0; i--) {
      G.isles[i].y += spd * dt;
      if (G.isles[i].y > VH + 80) G.isles.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.y += spd * s.z * 0.35 * dt;
      if (s.y > VH) {
        s.y = -4;
        s.x = rand(0, VW);
      }
    }
    if (G.stage >= 3 && G.mode === 'play' && Math.random() < dt * 0.7) {
      G.stormFlash = 0.18;
      addBolt(rand(40, VW - 40), -10, rand(40, VW - 40), rand(80, 280), SKY);
    }
    if (G.stormFlash > 0) G.stormFlash = Math.max(0, G.stormFlash - dt * 2.4);
  }

  function updateFx(dt) {
    G.shake *= Math.exp(-dt * 8);
    if (G.shake < 0.15) G.shake = 0;
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.bombFlash > 0) G.bombFlash = Math.max(0, G.bombFlash - dt * 1.8);
    if (G.muzzle > 0) G.muzzle -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt * 3.2;
      if (sparks[i].t >= 1) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt * 2.4;
      if (rings[i].t >= 1) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = bolts.length - 1; i >= 0; i--) {
      bolts[i].t += dt;
      if (bolts[i].t >= bolts[i].life) bolts.splice(i, 1);
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
      if (G.spawnT <= 0 && livingCount() < 8) {
        spawnScoutV(5, VW * 0.5 + Math.sin(G.t) * 40);
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
    if (G.bombT > 0) G.bombT -= dt;
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
        G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
        G.invuln = Math.max(G.invuln, 0.85);
        toast(STAGES[G.stage - 1].name, false, true);
        audio.wave();
        syncHud();
      }
    }

    updateWorld(dt);
    updatePlayer(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isDense()) stormThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
    updateBurns(dt);
    if (G.t % 0.08 < dt) refreshLocks();
    else if (G.wpn === 'home') refreshLocks();
  }

  function drawWorld() {
    const stg = G.stage;
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (stg >= 3) {
      g.addColorStop(0, '#06141c');
      g.addColorStop(0.5, '#041816');
      g.addColorStop(1, '#020c0a');
    } else if (stg === 2) {
      g.addColorStop(0, '#081818');
      g.addColorStop(0.45, '#0a1c18');
      g.addColorStop(1, '#061410');
    } else {
      g.addColorStop(0, '#1a2410');
      g.addColorStop(0.4, '#14200e');
      g.addColorStop(1, '#0c180c');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (G.stormFlash > 0) {
      ctx.fillStyle = rgba(SKY, G.stormFlash * 0.22);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = rgba(stg >= 3 ? SKY : WHT, s.a * (stg >= 2 ? 0.7 : 0.35));
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (0.6 + s.z * 0.9) * scale, 0, TAU);
      ctx.fill();
    }

    if (stg === 1) {
      ctx.fillStyle = 'rgba(160, 130, 60, 0.16)';
      const wy = ((G.scroll * 0.42) % 56);
      for (let y = -56; y < VH + 56; y += 56) {
        ctx.beginPath();
        ctx.moveTo(sx(0), sy(y + wy + 28));
        for (let x = 0; x <= VW; x += 20) {
          const amp = 7 + Math.sin((x + G.scroll) * 0.018) * 4;
          ctx.lineTo(sx(x), sy(y + wy + Math.sin((x + G.scroll) * 0.03) * amp));
        }
        ctx.lineTo(sx(VW), sy(y + wy + 56));
        ctx.lineTo(sx(0), sy(y + wy + 56));
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(200, 176, 96, 0.18)';
      ctx.lineWidth = 2 * scale;
      ctx.setLineDash([8 * scale, 10 * scale]);
      const road = ((G.scroll * 0.6) % 36);
      ctx.beginPath();
      ctx.moveTo(sx(VW * 0.5), sy(-4 + road));
      ctx.lineTo(sx(VW * 0.5), sy(VH + 4));
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (stg === 2) {
      ctx.fillStyle = 'rgba(20, 50, 46, 0.45)';
      const off = (G.scroll * 0.55) % 70;
      for (let col = 0; col < 6; col++) {
        const bx = 18 + col * 78;
        for (let row = -1; row < 12; row++) {
          const by = row * 70 + off;
          const hgt = 28 + ((hash2(col * 17 + row + ((G.scroll / 70) | 0)) * 36) | 0);
          ctx.fillRect(sx(bx), sy(by), 54 * scale, hgt * scale);
          ctx.fillStyle = rgba(TEAL, 0.12);
          ctx.fillRect(sx(bx + 8), sy(by + 6), 10 * scale, 8 * scale);
          ctx.fillRect(sx(bx + 28), sy(by + 6), 10 * scale, 8 * scale);
          ctx.fillStyle = 'rgba(20, 50, 46, 0.45)';
        }
      }
    } else {
      ctx.strokeStyle = 'rgba(30, 232, 196, 0.12)';
      ctx.lineWidth = 1.2 * scale;
      const off = (G.scroll * 0.5) % 40;
      for (let y = -40; y < VH + 40; y += 40) {
        ctx.beginPath();
        ctx.moveTo(sx(36), sy(y + off));
        ctx.lineTo(sx(36), sy(y + 26 + off));
        ctx.moveTo(sx(VW - 36), sy(y + off));
        ctx.lineTo(sx(VW - 36), sy(y + 26 + off));
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(80, 200, 255, 0.1)';
      ctx.strokeRect(sx(20), sy(0), 28 * scale, VH * scale);
      ctx.strokeRect(sx(VW - 48), sy(0), 28 * scale, VH * scale);
    }

    for (let i = 0; i < G.isles.length; i++) {
      const b = G.isles[i];
      ctx.save();
      if (stg === 1) {
        ctx.fillStyle = rgba([140 + b.hue * 40, 112, 48], 0.85);
        ctx.beginPath();
        ctx.ellipse(sx(b.x), sy(b.y), b.w * 0.55 * scale, b.h * 0.28 * scale, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba([80, 96, 40], 0.35);
        ctx.beginPath();
        ctx.ellipse(sx(b.x), sy(b.y - 3), b.w * 0.28 * scale, b.h * 0.12 * scale, 0, 0, TAU);
        ctx.fill();
      } else if (stg === 2) {
        ctx.fillStyle = rgba([18, 48, 44], 0.8);
        ctx.fillRect(sx(b.x - b.w * 0.35), sy(b.y - b.h * 0.25), b.w * 0.7 * scale, b.h * 0.55 * scale);
        ctx.fillStyle = rgba(TEAL, 0.2);
        for (let w = 0; w < b.bits; w++) {
          ctx.fillRect(sx(b.x - 10), sy(b.y - 14 + w * 10), 7 * scale, 5 * scale);
        }
      } else {
        ctx.fillStyle = rgba(DEEP, 0.9);
        ctx.fillRect(sx(b.x - b.w * 0.3), sy(b.y - b.h * 0.28), b.w * 0.6 * scale, b.h * 0.5 * scale);
        ctx.fillStyle = rgba(SKY, 0.22);
        ctx.fillRect(sx(b.x - 8), sy(b.y - 10), 16 * scale, 6 * scale);
      }
      ctx.restore();
    }
  }

  function drawBurns() {
    for (let i = 0; i < G.burns.length; i++) {
      const b = G.burns[i];
      const a = 1 - b.t / b.life;
      const g = ctx.createLinearGradient(sx(b.x), sy(VH), sx(b.x), sy(0));
      g.addColorStop(0, rgba(FIRE, 0.42 * a));
      g.addColorStop(0.45, rgba(GOLD, 0.18 * a));
      g.addColorStop(1, rgba(TEAL, 0.06 * a));
      ctx.fillStyle = g;
      ctx.fillRect(sx(b.x - b.w * 0.5), sy(0), b.w * scale, VH * scale);
      ctx.strokeStyle = rgba(GOLD, 0.35 * a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(b.x), sy(VH));
      ctx.lineTo(sx(b.x + Math.sin(G.t * 18) * 6), sy(40));
      ctx.stroke();
    }
  }

  function drawBolts() {
    for (let i = 0; i < bolts.length; i++) {
      const b = bolts[i];
      const a = 1 - b.t / b.life;
      ctx.save();
      ctx.strokeStyle = rgba(b.rgb, a);
      ctx.lineWidth = 2.2 * scale;
      ctx.shadowColor = rgba(b.rgb, 0.8);
      ctx.shadowBlur = 10 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(b.pts[0].x), sy(b.pts[0].y));
      for (let k = 1; k < b.pts.length; k++) ctx.lineTo(sx(b.pts[k].x), sy(b.pts[k].y));
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, a * 0.7);
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawLocks() {
    if (G.wpn !== 'home' || G.mode !== 'play') return;
    for (let i = 0; i < G.locks.length; i++) {
      const L = G.locks[i];
      const en = findEnt(L.id);
      const x = en ? en.x : L.x;
      const y = en ? en.y : L.y;
      const r = (en ? en.r : L.r) + 8 + Math.sin(G.t * 10) * 1.5;
      ctx.save();
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 1.6 * scale;
      ctx.shadowColor = rgba(GOLD, 0.7);
      ctx.shadowBlur = 8;
      const s = r * scale;
      const px = sx(x);
      const py = sy(y);
      const arm = 6 * scale;
      ctx.beginPath();
      ctx.moveTo(px - s, py - s + arm); ctx.lineTo(px - s, py - s); ctx.lineTo(px - s + arm, py - s);
      ctx.moveTo(px + s - arm, py - s); ctx.lineTo(px + s, py - s); ctx.lineTo(px + s, py - s + arm);
      ctx.moveTo(px - s, py + s - arm); ctx.lineTo(px - s, py + s); ctx.lineTo(px - s + arm, py + s);
      ctx.moveTo(px + s - arm, py + s); ctx.lineTo(px + s, py + s); ctx.lineTo(px + s, py + s - arm);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShip(x, y, a) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.scale(scale, scale);
    ctx.globalAlpha = a;
    ctx.shadowColor = rgba(TEAL, 0.7);
    ctx.shadowBlur = 12;
    ctx.fillStyle = rgba(TEAL, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -17);
    ctx.lineTo(7, -2);
    ctx.lineTo(14, 4);
    ctx.lineTo(12, 8);
    ctx.lineTo(5, 5);
    ctx.lineTo(3, 12);
    ctx.lineTo(0, 9);
    ctx.lineTo(-3, 12);
    ctx.lineTo(-5, 5);
    ctx.lineTo(-12, 8);
    ctx.lineTo(-14, 4);
    ctx.lineTo(-7, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(3.4, 1);
    ctx.lineTo(0, 3);
    ctx.lineTo(-3.4, 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-1.3, 4, 2.6, 7);
    ctx.fillStyle = rgba(DEEP, 0.9);
    ctx.fillRect(-13, 2, 5, 5);
    ctx.fillRect(8, 2, 5, 5);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 14);
      ctx.beginPath();
      ctx.arc(0, -17, 4.6, 0, TAU);
      ctx.fill();
    }
    const flame = 16 + G.spdLv * 4 + Math.sin(G.t * 28) * 2.4;
    ctx.fillStyle = rgba(G.spdLv >= 2 ? GOLD : SKY, 0.75);
    ctx.beginPath();
    ctx.moveTo(-4.2, 12);
    ctx.lineTo(0, 12 + flame);
    ctx.lineTo(4.2, 12);
    ctx.fill();
    if (G.spdLv >= 1) {
      ctx.fillStyle = rgba(FIRE, 0.55);
      ctx.beginPath();
      ctx.moveTo(-12, 8);
      ctx.lineTo(-10, 14 + G.spdLv * 2);
      ctx.lineTo(-8, 8);
      ctx.moveTo(8, 8);
      ctx.lineTo(10, 14 + G.spdLv * 2);
      ctx.lineTo(12, 8);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawMech(en, big) {
    const walk = Math.sin(en.t * (big ? 3.4 : 5.0)) * (big ? 8 : 4);
    const flash = en.flash > 0;
    const rgb = flash ? WHT : en.rgb;
    const s = big ? 1 : 0.72;
    const stg = G.stage;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale * s, scale * s);
    ctx.shadowColor = rgba(rgb, 0.55);
    ctx.shadowBlur = 14;
    if (stg === 1 && big) {
      ctx.fillStyle = rgba(GOLD, 0.1);
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(-48, 90);
      ctx.lineTo(48, 90);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(-20 + walk * 0.12, -6, 40, 26);
    ctx.fillStyle = rgba(DEEP, 0.9);
    ctx.fillRect(-13, -2, 26, 14);
    ctx.fillStyle = rgba(flash ? WHT : GOLD, 0.95);
    ctx.fillRect(-11, -24, 22, 18);
    ctx.fillStyle = rgba(TEAL, 0.9);
    ctx.fillRect(-8, -18, 16, 7);
    if (stg >= 2) {
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.fillRect(-30, -10, 10, 14);
      ctx.fillRect(20, -10, 10, 14);
    }
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.fillRect(-30, 0, 12, 8);
    ctx.fillRect(18, 0, 12, 8);
    ctx.fillRect(-34, 2, 8, 6);
    ctx.fillRect(26, 2, 8, 6);
    ctx.fillRect(-16 - walk, 18, 9, 18);
    ctx.fillRect(7 + walk, 18, 9, 18);
    ctx.fillStyle = rgba(MAG, 0.8);
    ctx.fillRect(-14 - walk, 34, 7, 4);
    ctx.fillRect(9 + walk, 34, 7, 4);
    if (big && stg >= 3) {
      ctx.strokeStyle = rgba(SKY, 0.55);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -4, 18 + Math.sin(en.t * 6) * 3, 0, TAU);
      ctx.stroke();
    } else if (big) {
      ctx.strokeStyle = rgba(TEAL, 0.45);
      ctx.lineWidth = 2;
      ctx.strokeRect(-22, -8, 44, 30);
    }
    ctx.restore();
  }

  function drawEnt(en) {
    if (en.type === 'mid' || en.type === 'boss') {
      drawMech(en, en.type === 'boss');
      return;
    }
    const flash = en.flash > 0;
    const rgb = flash ? WHT : en.rgb;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale, scale);
    ctx.shadowColor = rgba(rgb, 0.6);
    ctx.shadowBlur = 10;
    ctx.fillStyle = rgba(rgb, 0.95);
    if (en.type === 'tank') {
      ctx.fillRect(-14, -5, 28, 14);
      ctx.fillStyle = rgba(DEEP, 0.85);
      ctx.fillRect(-16, 6, 8, 5);
      ctx.fillRect(8, 6, 8, 5);
      ctx.fillStyle = rgba(SAND, 0.95);
      ctx.fillRect(-4, -12, 8, 10);
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.fillRect(-1.5, -16, 3, 8);
    } else if (en.type === 'aa') {
      ctx.fillRect(-11, -5, 22, 13);
      ctx.fillStyle = rgba(ORG, 0.9);
      ctx.save();
      const ang = Math.atan2(G.player.y - en.y, G.player.x - en.x);
      ctx.rotate(ang);
      ctx.fillRect(0, -2.4, 16, 4.8);
      ctx.restore();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(0, 2, 5, 0, TAU);
      ctx.fill();
    } else if (en.type === 'carrier') {
      ctx.beginPath();
      ctx.moveTo(-20, 8);
      ctx.lineTo(-12, -10);
      ctx.lineTo(12, -10);
      ctx.lineTo(20, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.fillRect(-7, -5, 14, 8);
      ctx.fillStyle = rgba(WHT, 0.5);
      ctx.fillRect(-16, 0, 6, 3);
      ctx.fillRect(10, 0, 6, 3);
    } else if (en.type === 'ring') {
      ctx.rotate(en.t * 1.4);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * TAU / 6;
        const px = Math.cos(a) * 11;
        const py = Math.sin(a) * 11;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 3.4, 0, TAU);
      ctx.fill();
    } else if (en.type === 'dive') {
      ctx.beginPath();
      ctx.moveTo(0, 14);
      ctx.lineTo(12, -7);
      ctx.lineTo(0, -3);
      ctx.lineTo(-12, -7);
      ctx.closePath();
      ctx.fill();
    } else if (en.type === 'flank') {
      ctx.beginPath();
      ctx.moveTo(0, 10);
      ctx.lineTo(11, 0);
      ctx.lineTo(4, -8);
      ctx.lineTo(-4, -8);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, 11);
      ctx.lineTo(8, -7);
      ctx.lineTo(0, -4);
      ctx.lineTo(-8, -7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.5);
      ctx.beginPath();
      ctx.moveTo(0, 3);
      ctx.lineTo(3, -3);
      ctx.lineTo(-3, -3);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.shadowColor = rgba(s.rgb, 0.85);
      ctx.shadowBlur = 8 * scale;
      if (s.kind === 'beam') {
        ctx.strokeStyle = rgba(s.rgb, 0.95);
        ctx.lineWidth = (s.r * 1.5) * scale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx(s.x), sy(s.y + 12));
        ctx.lineTo(sx(s.x + Math.sin(s.age * 40) * 1.4), sy(s.y - 16));
        ctx.stroke();
        if (!REDUCE) {
          ctx.strokeStyle = rgba(WHT, 0.75);
          ctx.lineWidth = 1.2 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(s.x), sy(s.y + 7));
          ctx.lineTo(sx(s.x), sy(s.y - 12));
          ctx.stroke();
        }
      } else if (s.kind === 'home') {
        const ang = Math.atan2(s.vy, s.vx || 0.001);
        ctx.translate(sx(s.x), sy(s.y));
        ctx.rotate(ang);
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.beginPath();
        ctx.moveTo(7 * scale, 0);
        ctx.lineTo(-5 * scale, 3.2 * scale);
        ctx.lineTo(-5 * scale, -3.2 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(FIRE, 0.7);
        ctx.fillRect(-8 * scale, -1.2 * scale, 4 * scale, 2.4 * scale);
      } else {
        ctx.fillStyle = rgba(s.rgb, 0.95);
        ctx.beginPath();
        ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.55);
        ctx.beginPath();
        ctx.arc(sx(s.x - 0.6), sy(s.y - 0.6), s.r * 0.35 * scale, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.fillStyle = rgba(s.rgb, 0.95);
      ctx.shadowColor = rgba(s.rgb, 0.8);
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
      const rgb = WPN_RGB[p.kind] || GOLD;
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
      ctx.fillStyle = '#041816';
      ctx.font = 'bold 8px sans-serif';
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
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if ((t === 'boss' || t === 'mid') && G.ents[i].hp > 0) {
        boss = G.ents[i];
        if (t === 'boss') break;
      }
    }
    if (!boss) return;
    const x = 40;
    const y = 16;
    const w = VW - 80;
    const h = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    const t = clamp(boss.hp / boss.maxHp, 0, 1);
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : TEAL, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : TEAL, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    const st = STAGES[G.stage - 1];
    const name = boss.type === 'boss' ? (st ? st.boss : '机甲') : (st ? st.mid : '机甲');
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = 'bold ' + (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name, sx(x), sy(y - 4));
  }

  function drawFlash() {
    if (G.flash <= 0 && G.bombFlash <= 0) return;
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    if (G.bombFlash > 0) {
      ctx.strokeStyle = rgba(FIRE, G.bombFlash * 0.9);
      ctx.lineWidth = 7 * scale;
      ctx.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020c0a';
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
    drawBurns();
    drawBolts();

    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (!G.ents[i].ground) drawEnt(G.ents[i]);
    }
    drawLocks();
    drawPows();
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawShip(G.player.x, G.player.y, 1);
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
    G.isles.length = 0;
    G.burns.length = 0;
    G.locks.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    bolts.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'storm' ? 'storm' : 'raid';
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
    G.wpn = 'vulcan';
    G.wpnLv = 0;
    G.spdLv = 0;
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
    G.dropI = 0;
    G.nextIsle = 40;
    G.stormFlash = 0;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedStars();
    seedIsles();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isDense() ? '密弹 · 更密更快' : '空袭 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'raid';
    G.stage = 1;
    G.lives = LIVES;
    G.bombs = 3;
    G.wpn = 'vulcan';
    G.wpnLv = 0;
    G.spdLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bombT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    seedStars();
    seedIsles();
    showOverlay('title', '瓦特', '纵向卷轴。捡 火/束/追 切武装，速加快。Shift 扔焰弹燎空。短关之后是机甲。');
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
    if (G.mode === 'title') startGame('storm');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isDense()) goTitle();
      else startGame('storm');
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
  if (ovRetry) {
    ovRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovModes) {
    ovModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && !isDense()) startGame('storm');
      else goTitle();
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
