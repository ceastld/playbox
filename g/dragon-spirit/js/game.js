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
  const HEAD_MAX = 3;
  const FIRE_MAX = 3;
  const TAIL_N = 10;
  const BEST_KEY = 'playbox-dragon-spirit-best';
  const MUTE_KEY = 'playbox-dragon-spirit-mute';
  const OPS = '方向 / WASD 飞 · 空格喷火 · Shift / Z 爆弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (BEST_KEY !== 'playbox-dragon-spirit-best') throw new Error('best key');

  const MAG = [255, 61, 184];
  const FIRE = [255, 90, 34];
  const EMBER = [255, 138, 64];
  const GOLD = [255, 227, 107];
  const SKY = [255, 176, 112];
  const WHT = [255, 244, 232];
  const PNK = [255, 154, 212];
  const RED = [255, 86, 110];
  const ICE = [170, 210, 255];
  const MOSS = [90, 170, 88];
  const DEEP = [28, 12, 8];
  const BONE = [232, 214, 186];

  const DROP_CYCLE = ['egg', 'flame', 'bomb'];
  const DROP_GLYPH = { egg: '卵', flame: '炎', bomb: '爆' };
  const DROP_RGB = { egg: GOLD, flame: FIRE, bomb: MAG };

  const STAGES = [
    {
      name: '第 1 关 · 熔岩谷',
      mid: '岩蜥',
      boss: '熔蟒',
      midHp: 34,
      bossHp: 80,
      waves: [
        { t: 0.8, kind: 'v', n: 5 },
        { t: 3.2, kind: 'stream', dir: 1 },
        { t: 5.6, kind: 'skull', n: 4 },
        { t: 8.0, kind: 'turrets' },
        { t: 10.4, kind: 'carrier' },
        { t: 12.8, kind: 'v', n: 7 },
        { t: 15.2, kind: 'mid' },
        { t: 20.4, kind: 'wyvern', n: 4 },
        { t: 22.8, kind: 'skull', n: 4 },
        { t: 25.0, kind: 'stream', dir: -1 },
        { t: 27.4, kind: 'v', n: 7 },
        { t: 32.0, kind: 'boss' }
      ]
    },
    {
      name: '第 2 关 · 古林墟',
      mid: '石像',
      boss: '树龙',
      midHp: 46,
      bossHp: 108,
      waves: [
        { t: 0.6, kind: 'v', n: 7 },
        { t: 2.8, kind: 'skull', n: 5 },
        { t: 5.0, kind: 'stream', dir: -1 },
        { t: 7.4, kind: 'wyvern', n: 5 },
        { t: 9.6, kind: 'carrier' },
        { t: 11.8, kind: 'turrets' },
        { t: 14.0, kind: 'v', n: 9 },
        { t: 16.2, kind: 'mid' },
        { t: 21.6, kind: 'stream', dir: 1 },
        { t: 23.8, kind: 'skull', n: 6 },
        { t: 26.0, kind: 'wyvern', n: 5 },
        { t: 28.2, kind: 'carrier' },
        { t: 30.4, kind: 'v', n: 9 },
        { t: 36.0, kind: 'boss' }
      ]
    },
    {
      name: '第 3 关 · 骨冰殿',
      mid: '冰卫',
      boss: '龙魂王',
      midHp: 58,
      bossHp: 152,
      waves: [
        { t: 0.5, kind: 'v', n: 9 },
        { t: 2.4, kind: 'stream', dir: 1 },
        { t: 4.2, kind: 'stream', dir: -1 },
        { t: 6.2, kind: 'skull', n: 6 },
        { t: 8.2, kind: 'wyvern', n: 6 },
        { t: 10.2, kind: 'carrier' },
        { t: 12.0, kind: 'turrets' },
        { t: 14.0, kind: 'mid' },
        { t: 19.2, kind: 'v', n: 11 },
        { t: 21.2, kind: 'skull', n: 6 },
        { t: 23.2, kind: 'wyvern', n: 6 },
        { t: 25.2, kind: 'carrier' },
        { t: 27.2, kind: 'stream', dir: 1 },
        { t: 29.0, kind: 'stream', dir: -1 },
        { t: 31.2, kind: 'v', n: 9 },
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
  const btnBreath = document.getElementById('btn-breath');
  const btnSea = document.getElementById('btn-sea');
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
  const tail = [];

  const G = {
    mode: 'title',
    kind: 'breath',
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
    heads: 1,
    fireLv: 0,
    bombs: 3,
    bombT: 0,
    bombFlash: 0,
    ents: [],
    shots: [],
    eShots: [],
    pows: [],
    rocks: [],
    fireCd: 0,
    fireHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: FIRE,
    punch: 1,
    muzzle: 0,
    spawnT: 0.7,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    dropI: 0,
    nextRock: 40,
    stormT: 0,
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
    return G.kind === 'sea';
  }
  function plySpd() {
    return (isDense() ? 308 : 266) + G.fireLv * 10 + G.heads * 6;
  }
  function scrollSpd() {
    if (hasBig()) return isDense() ? 34 : 26;
    return (isDense() ? 114 : 84) + G.stage * 6 + Math.min(18, G.combo);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function shotCap() {
    return isDense() ? 170 : 114;
  }
  function hasBig() {
    for (let i = 0; i < G.ents.length; i++) {
      const t = G.ents[i].type;
      if (t === 'mid' || t === 'boss') return true;
    }
    return false;
  }
  function livingCount() {
    return G.ents.length;
  }
  function headOffsets() {
    if (G.heads >= 3) return [{ x: -15, y: 5 }, { x: 0, y: 0 }, { x: 15, y: 5 }];
    if (G.heads >= 2) return [{ x: -11, y: 3 }, { x: 11, y: 3 }];
    return [{ x: 0, y: 0 }];
  }
  function wpnText() {
    const h = G.heads >= 3 ? '三头' : G.heads >= 2 ? '两头' : '一头';
    if (G.fireLv >= FIRE_MAX) return h + ' MAX';
    if (G.fireLv > 0) return h + ' ' + G.fireLv;
    return h;
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
      this.beep(420, 0.055, 'sawtooth', 0.03, 920);
      this.beep(760, 0.04, 'square', 0.018, 1600);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.036, 0.032, 1100);
      this.beep(480 * lift, 0.07, 'square', 0.042, 860 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.22 : 0.1, big ? 0.078 : 0.046, big ? 180 : 420);
      this.beep(big ? 150 : 240, big ? 0.28 : 0.13, 'sawtooth', 0.052, 48);
    },
    bomb() {
      this.ensure();
      this.noise(0.32, 0.086, 140);
      this.beep(78, 0.46, 'sawtooth', 0.074, 34);
      this.beep(620, 0.24, 'sine', 0.042, 180);
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
      this.noise(0.16, 0.058, 280);
      this.beep(260, 0.22, 'sawtooth', 0.05, 70);
      this.beep(140, 0.34, 'sine', 0.045, 40);
    },
    wave() {
      this.ensure();
      this.beep(330, 0.09, 'sine', 0.04, 494);
      this.beep(494, 0.12, 'sine', 0.04, 660);
      this.beep(740, 0.2, 'triangle', 0.045, 988);
    },
    boss() {
      this.ensure();
      this.beep(170, 0.2, 'sawtooth', 0.054, 88);
      this.beep(120, 0.32, 'square', 0.04, 64);
    },
    win() {
      this.ensure();
      this.beep(494, 0.1, 'square', 0.045, 622);
      this.beep(622, 0.12, 'triangle', 0.045, 740);
      this.beep(988, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.04, 80);
      this.beep(120, 0.3, 'sine', 0.05, 42);
    },
    start() {
      this.ensure();
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.035, 990);
    },
    oneup() {
      this.ensure();
      this.beep(622, 0.08, 'square', 0.04, 830);
      this.beep(830, 0.12, 'triangle', 0.045, 1244);
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
      tagLabel.textContent = isDense() ? '炎海' : '龙息';
      tagLabel.classList.toggle('warn', isDense());
      tagLabel.classList.toggle('hot', !isDense() && G.stage >= 3);
    }
    if (wpnLabel) {
      wpnLabel.textContent = wpnText();
      wpnLabel.classList.toggle('two', G.heads === 2);
      wpnLabel.classList.toggle('three', G.heads >= 3);
      wpnLabel.classList.toggle('max', G.fireLv >= FIRE_MAX);
    }
    if (bombLabel) {
      bombLabel.textContent = '爆 ×' + G.bombs;
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
    else if (G.mode === 'lose') setHint('R 重开 · 撞体或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint('龙魂尽破 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 爆弹砸地', 'warn');
    else setHint('方向飞 · 空格喷火 · Shift 爆弹 · 吃卵长头', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'DSPT';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovModes) {
      if (kind === 'lose') ovModes.textContent = '换模式';
      else if (kind === 'win') ovModes.textContent = isDense() ? '换模式' : '炎海';
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
    capArr(sparks, 48);
    capArr(rings, 32);
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
    screenFlash(rgb, 0.16 + p * 0.14);
    kick(2.2 + p * 2.6);
  }

  function resetTail() {
    tail.length = 0;
    for (let i = 0; i < TAIL_N; i++) {
      tail.push({
        x: G.player.x,
        y: G.player.y + 14 + i * 11
      });
    }
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 68; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, VH),
        z: rand(0.35, 1.4),
        a: rand(0.16, 0.68)
      });
    }
  }

  function seedRocks() {
    G.rocks.length = 0;
    for (let i = 0; i < 8; i++) spawnRock(-40 - i * 96);
  }

  function spawnRock(y) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const w = rand(32, 74);
    const h = rand(42, 108);
    const x = side < 0 ? rand(10, 76) : rand(VW - 76, VW - 10);
    G.rocks.push({
      x: x, y: y, w: w, h: h,
      kind: G.stage,
      hue: hash2((G.scroll + y) | 0),
      n: 1 + ((hash2(((G.scroll + y) * 5) | 0) * 3) | 0)
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
    if (G.ents.length > 56) return null;
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
      segs: spec.segs || null
    };
    G.ents.push(en);
    return en;
  }

  function spawnBat(x, y, extra) {
    extra = extra || {};
    return spawnEnt({
      type: 'bat',
      x: x, y: y,
      vx: extra.vx || 0,
      vy: extra.vy == null ? 78 : extra.vy,
      hp: extra.hp || 1,
      r: 11,
      score: 50,
      rgb: extra.rgb || MAG,
      fireCd: extra.fireCd != null ? extra.fireCd : rand(0.6, 1.4),
      phase: extra.phase || 0
    });
  }

  function spawnV(n, xmid) {
    const mid = xmid == null ? VW * 0.5 + rand(-40, 40) : xmid;
    const gap = 28;
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2;
      spawnBat(mid + k * gap, -18 - Math.abs(k) * 16, { vy: 86, fireCd: 0.7 + Math.abs(k) * 0.12 });
    }
  }

  function spawnStream(dir) {
    const x = dir > 0 ? -20 : VW + 20;
    for (let i = 0; i < 6; i++) {
      spawnEnt({
        type: 'bat',
        x: x, y: 40 + i * 28,
        vx: dir * 92, vy: 42,
        hp: 1, r: 10, score: 50,
        rgb: PNK, phase: i * 0.4, fireCd: 0.9 + i * 0.08
      });
    }
  }

  function spawnSkulls(n) {
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'skull',
        x: rand(50, VW - 50),
        y: -24 - i * 22,
        vx: rand(-20, 20),
        vy: 46,
        hp: 1, r: 12, score: 70,
        rgb: BONE, dive: true,
        fireCd: 0.5 + i * 0.1, phase: i
      });
    }
  }

  function spawnWyverns(n) {
    for (let i = 0; i < n; i++) {
      spawnEnt({
        type: 'wyvern',
        x: 70 + i * ((VW - 140) / Math.max(1, n - 1)),
        y: -30 - (i % 2) * 18,
        vx: 0, vy: 58,
        hp: 2, r: 16, score: 80,
        rgb: EMBER, fireCd: 0.55 + i * 0.12, phase: i * 0.7
      });
    }
  }

  function spawnTurrets() {
    const xs = [70, VW - 70, VW * 0.5];
    for (let i = 0; i < xs.length; i++) {
      spawnEnt({
        type: 'turret',
        x: xs[i], y: -18,
        vx: 0, vy: 0,
        hp: 4, r: 16, score: 140,
        rgb: GOLD, ground: true,
        fireCd: 0.8 + i * 0.2, w: 28, h: 20
      });
    }
  }

  function spawnTotem() {
    spawnEnt({
      type: 'totem',
      x: rand(80, VW - 80), y: -30,
      vx: 0, vy: 0,
      hp: 6, r: 20, score: 180,
      rgb: G.stage === 3 ? ICE : MOSS,
      ground: true, fireCd: 1.1, w: 30, h: 36
    });
  }

  function spawnCarrier() {
    spawnEnt({
      type: 'carrier',
      x: rand(90, VW - 90), y: -28,
      vx: rand(-30, 30), vy: 48,
      hp: 5, r: 18, score: 300,
      rgb: GOLD, drop: true, fireCd: 1.4
    });
  }

  function spawnMid() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.midHp : 34) * (isDense() ? 1.22 : 1));
    spawnEnt({
      type: 'mid',
      x: VW * 0.5, y: -50,
      vx: 0, vy: 42,
      hp: hp, r: 28, score: 2000,
      rgb: G.stage === 3 ? ICE : G.stage === 2 ? MOSS : EMBER,
      fireCd: 0.6, w: 56, h: 40
    });
    audio.boss();
    toast(st ? st.mid : '中型', false, true);
  }

  function spawnBoss() {
    const st = STAGES[G.stage - 1];
    const hp = Math.round((st ? st.bossHp : 80) * (isDense() ? 1.22 : 1));
    spawnEnt({
      type: 'boss',
      x: VW * 0.5, y: -70,
      vx: 0, vy: 28,
      hp: hp, r: 42, score: 4000 + 1500 * G.stage,
      rgb: G.stage === 3 ? GOLD : G.stage === 2 ? MOSS : FIRE,
      fireCd: 0.45, w: 88, h: 64,
      segs: []
    });
    audio.boss();
    toast(st ? st.boss : '关底', false, true);
    kick(5.5);
    screenFlash(FIRE, 0.45);
  }

  function spawnWave(w) {
    if (!w) return;
    if (w.kind === 'v') spawnV(w.n || 5);
    else if (w.kind === 'stream') spawnStream(w.dir || 1);
    else if (w.kind === 'skull') spawnSkulls(w.n || 4);
    else if (w.kind === 'wyvern') spawnWyverns(w.n || 4);
    else if (w.kind === 'turrets') {
      spawnTurrets();
      if (G.stage >= 2) spawnTotem();
    } else if (w.kind === 'carrier') spawnCarrier();
    else if (w.kind === 'mid') spawnMid();
    else if (w.kind === 'boss') spawnBoss();
  }

  function nextDrop() {
    const k = DROP_CYCLE[G.dropI % DROP_CYCLE.length];
    G.dropI += 1;
    return k;
  }

  function spawnPow(x, y, kind) {
    G.pows.push({
      x: x, y: y, vx: rand(-36, 36), vy: -70,
      kind: kind, t: 0, life: 9.5, r: 11
    });
  }

  function eShot(x, y, vx, vy, r) {
    if (G.eShots.length >= shotCap()) return;
    G.eShots.push({ x: x, y: y, vx: vx, vy: vy, r: r || 3.5, life: 4.2 });
  }

  function aimShot(x, y, spd, r) {
    const dx = G.player.x - x;
    const dy = G.player.y - y;
    const l = hypot(dx, dy) || 1;
    eShot(x, y, dx / l * spd, dy / l * spd, r);
  }

  function fanShot(x, y, n, spread, spd, base) {
    const mid = (n - 1) / 2;
    for (let i = 0; i < n; i++) {
      const a = (base == null ? Math.PI * 0.5 : base) + (i - mid) * spread;
      eShot(x, y, Math.cos(a) * spd, Math.sin(a) * spd, 3.2);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    const cd = 0.112 - G.heads * 0.008 - G.fireLv * 0.01;
    G.fireCd = Math.max(0.062, cd);
    G.muzzle = 1;
    audio.shoot();
    const offs = headOffsets();
    const spd = 640 + G.fireLv * 42;
    const dmg = 1 + (G.fireLv >= 2 ? 1 : 0);
    const r = 4.4 + G.fireLv * 0.85;
    for (let i = 0; i < offs.length; i++) {
      const ox = offs[i].x;
      G.shots.push({
        kind: 'flame',
        x: G.player.x + ox,
        y: G.player.y - 18 + offs[i].y,
        vx: ox * 2.4,
        vy: -spd,
        r: r,
        dmg: dmg,
        life: 1.15,
        trail: !REDUCE
      });
    }
  }

  function explodeBomb(x, y, roar) {
    juice(x, y, FIRE, roar ? 2.6 : 1.8);
    popSpark(x, y, GOLD, roar ? 46 : 28);
    emit(roar ? 28 : 16, {
      x: x, y: y, j: roar ? 18 : 12,
      vx0: -280, vx1: 280, vy0: -320, vy1: 160,
      life: 0.55, r0: 2, r1: 5.5, rgb: EMBER
    });
    const clearR = roar ? 999 : 160;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      if (hypot(s.x - x, s.y - y) < clearR) {
        emit(3, {
          x: s.x, y: s.y, j: 4,
          vx0: -80, vx1: 80, vy0: -80, vy1: 40,
          life: 0.22, r0: 1, r1: 2.2, rgb: PNK
        });
        G.eShots.splice(i, 1);
      }
    }
    const hitR = roar ? 999 : 118;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      if (hypot(en.x - x, en.y - y) > hitR) continue;
      let dmg = en.ground ? 8 : 5;
      if (en.type === 'mid') dmg = roar ? 10 : 6;
      if (en.type === 'boss') dmg = roar ? 14 : 7;
      hurtEnt(en, dmg, en.x, en.y);
    }
  }

  function tryBomb() {
    audio.ensure();
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombT > 0) return;
    if (G.bombs <= 0) {
      toast('爆弹用尽', true);
      audio.miss();
      return;
    }
    G.bombs -= 1;
    G.bombT = 0.42;
    G.invuln = Math.max(G.invuln, 0.42);
    G.bombFlash = 1;
    G.muzzle = 1;
    audio.bomb();
    hitStop(0.078);
    kick(7.2);
    screenFlash(GOLD, 0.72);
    if (stageEl) {
      stageEl.classList.remove('bomb');
      void stageEl.offsetWidth;
      stageEl.classList.add('bomb');
      setTimeout(function () {
        if (stageEl) stageEl.classList.remove('bomb');
      }, 520);
    }
    const px = G.player.x;
    const py = G.player.y;
    G.shots.push({
      kind: 'meteor',
      x: px, y: py - 8,
      vx: 0, vy: 380,
      r: 16, dmg: 8, life: 1.6, trail: true
    });
    G.shots.push({
      kind: 'meteor',
      x: px - 36, y: py - 2,
      vx: -40, vy: 340,
      r: 12, dmg: 6, life: 1.6, trail: true
    });
    G.shots.push({
      kind: 'meteor',
      x: px + 36, y: py - 2,
      vx: 40, vy: 340,
      r: 12, dmg: 6, life: 1.6, trail: true
    });
    explodeBomb(px, py - 10, true);
    rings.push({ x: px, y: py, t: 0, rgb: GOLD, r: 28 });
    rings.push({ x: px, y: py, t: -0.12, rgb: FIRE, r: 42 });
    syncHud();
  }

  function raidThink() {
    const st = STAGES[G.stage - 1];
    if (!st || G.stageClearT > 0) return;
    while (G.waveI < st.waves.length && G.stageT >= st.waves[G.waveI].t) {
      const w = st.waves[G.waveI];
      G.waveI += 1;
      if ((w.kind === 'mid' || w.kind === 'boss') && hasBig()) {
        G.waveI -= 1;
        break;
      }
      spawnWave(w);
    }
  }

  function stormThink(dt) {
    raidThink();
    G.stormT -= dt;
    if (G.stormT <= 0 && !hasBig() && G.stageClearT <= 0) {
      G.stormT = rand(1.35, 2.2);
      const r = Math.random();
      if (r < 0.34) spawnV(5, rand(80, VW - 80));
      else if (r < 0.58) spawnSkulls(3);
      else if (r < 0.78) spawnStream(Math.random() < 0.5 ? 1 : -1);
      else spawnWyverns(3);
    }
  }

  function hurtEnt(en, dmg, x, y) {
    if (!en || en.hp <= 0) return;
    en.hp -= dmg;
    en.flash = 0.08;
    audio.hit(G.combo);
    emit(5, {
      x: x, y: y, j: 4,
      vx0: -90, vx1: 90, vy0: -120, vy1: 40,
      life: 0.18, r0: 1, r1: 2.4, rgb: en.ground ? GOLD : FIRE
    });
    const stop = en.type === 'boss' ? 0.072 : en.type === 'mid' ? 0.055 : 0.034;
    hitStop(stop);
    kick(en.type === 'boss' ? 4.4 : 1.8);
    if (en.hp <= 0) killEnt(en);
  }

  function killEnt(en) {
    const big = en.type === 'boss' || en.type === 'mid';
    juice(en.x, en.y, en.rgb || FIRE, big ? 2.4 : en.ground ? 1.35 : 1);
    audio.boom(big);
    bumpCombo();
    const pts = (en.score || 50) * G.mult;
    addScore(pts);
    floatText(en.x, en.y - 8, String(pts), GOLD, big || G.mult >= 3);
    if (en.drop) spawnPow(en.x, en.y, nextDrop());
    else if (!big && Math.random() < (isDense() ? 0.08 : 0.05)) spawnPow(en.x, en.y, nextDrop());
    if (en.type === 'mid') {
      toast((STAGES[G.stage - 1] ? STAGES[G.stage - 1].mid : '中型') + ' 击破', false, true);
    }
    if (en.type === 'boss') {
      addScore(1500 * G.stage);
      G.eShots.length = 0;
      G.stageClearT = 2.05;
      toast(G.stage >= 3 ? '龙魂尽破' : '关底击破', false, true);
      audio.wave();
    }
    const i = G.ents.indexOf(en);
    if (i >= 0) G.ents.splice(i, 1);
  }

  function playerDie() {
    if (G.invuln > 0 || G.deadT > 0 || G.mode !== 'play') return;
    G.lives -= 1;
    G.deadT = 0.95;
    G.invuln = 0;
    breakCombo();
    audio.death();
    juice(G.player.x, G.player.y, MAG, 2.8);
    kick(8);
    screenFlash(MAG, 0.7);
    G.eShots.length = 0;
    if (G.heads > 1 || G.fireLv > 0) {
      spawnPow(G.player.x + rand(-20, 20), G.player.y, G.heads > 1 ? 'egg' : 'flame');
    }
    G.heads = 1;
    G.fireLv = 0;
    syncHud();
  }

  function respawn() {
    G.player.x = VW * 0.5;
    G.player.y = VH - 90;
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = 1.55;
    G.eShots.length = 0;
    resetTail();
    toast('复活', false, true);
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = 'crash';
    audio.lose();
    showOverlay('lose', '龙坠了', '撞体或中弹。喷火清空，爆弹砸地。R 重开同一模式。');
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    addScore(8000);
    audio.win();
    showOverlay(
      'win',
      isDense() ? '炎海肃清' : '龙魂尽破',
      isDense()
        ? '三关打穿。8000 通关分已入账。换模式回标题，或再来一局炎海。'
        : '三关打穿。8000 通关分已入账。要不要再下炎海？'
    );
    syncHud();
  }

  function collectPow(p) {
    audio.pow();
    juice(p.x, p.y, DROP_RGB[p.kind] || GOLD, 1.2);
    flashWpn();
    if (p.kind === 'egg') {
      if (G.heads >= HEAD_MAX) addScore(500 * G.mult);
      else {
        G.heads += 1;
        toast(G.heads >= 3 ? '三头' : '两头', false, true);
      }
    } else if (p.kind === 'flame') {
      if (G.fireLv >= FIRE_MAX) addScore(500 * G.mult);
      else {
        G.fireLv += 1;
        toast(G.fireLv >= FIRE_MAX ? '炎 MAX' : '炎 +' + G.fireLv, false, true);
      }
    } else if (p.kind === 'bomb') {
      if (G.bombs >= BOMB_CAP) addScore(500 * G.mult);
      else {
        G.bombs += 1;
        toast('爆 +1', false, true);
      }
    }
    floatText(p.x, p.y - 6, DROP_GLYPH[p.kind] || '+', DROP_RGB[p.kind] || GOLD, true);
    syncHud();
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 14));
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.bombFlash > 0) G.bombFlash = Math.max(0, G.bombFlash - dt * 2.1);
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt * 8);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += (p.g || 420) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 2.2);
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
  }

  function updateTail(dt) {
    let tx = G.player.x;
    let ty = G.player.y + 16;
    for (let i = 0; i < tail.length; i++) {
      const s = tail[i];
      const k = 1 - Math.exp(-dt * (11 - i * 0.45));
      s.x = lerp(s.x, tx + Math.sin(G.t * 7 + i * 0.55) * (1.4 + i * 0.15), k);
      s.y = lerp(s.y, ty + 11, k);
      tx = s.x;
      ty = s.y;
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

  function updateWorld(dt) {
    const spd = scrollSpd();
    G.scroll += spd * dt;
    for (let i = 0; i < stars.length; i++) {
      stars[i].y += spd * stars[i].z * 0.35 * dt;
      if (stars[i].y > VH + 8) {
        stars[i].y = -8;
        stars[i].x = rand(0, VW);
      }
    }
    for (let i = G.rocks.length - 1; i >= 0; i--) {
      G.rocks[i].y += spd * dt;
      if (G.rocks[i].y > VH + 80) G.rocks.splice(i, 1);
    }
    G.nextRock -= spd * dt;
    if (G.nextRock <= 0) {
      spawnRock(-50);
      G.nextRock = rand(70, 130);
    }
  }

  function updateEnts(dt) {
    const dense = isDense();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const en = G.ents[i];
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      if (en.type === 'bat') {
        en.x += en.vx * dt + Math.sin(en.t * 3.4 + en.phase) * 28 * dt;
        en.y += en.vy * dt;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && en.y > 20 && en.y < VH - 80) {
          en.fireCd = dense ? 0.85 : 1.25;
          aimShot(en.x, en.y + 8, dense ? 150 : 118, 3.2);
        }
      } else if (en.type === 'wyvern') {
        en.x = en.baseX + Math.sin(en.t * 1.8 + en.phase) * 54;
        en.y += en.vy * dt;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && en.y > 10) {
          en.fireCd = dense ? 0.7 : 1.05;
          fanShot(en.x, en.y + 10, dense ? 3 : 2, 0.28, dense ? 140 : 112, Math.PI * 0.5);
        }
      } else if (en.type === 'skull') {
        if (en.y < G.player.y - 40) {
          en.vx += (G.player.x - en.x) * dt * 1.6;
          en.vx = clamp(en.vx, -120, 120);
        }
        en.vy = Math.min(220, en.vy + dt * 46);
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      } else if (en.type === 'turret' || en.type === 'totem') {
        en.y += scrollSpd() * dt;
        en.fireCd -= dt;
        if (en.fireCd <= 0 && en.y > 8 && en.y < VH - 40) {
          en.fireCd = en.type === 'totem' ? (dense ? 0.85 : 1.2) : (dense ? 0.72 : 1.05);
          if (en.type === 'totem') fanShot(en.x, en.y - 8, 5, 0.32, dense ? 132 : 108, -Math.PI * 0.5);
          else aimShot(en.x, en.y - 10, dense ? 168 : 132, 3.6);
        }
      } else if (en.type === 'carrier') {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
        if (en.x < 40 || en.x > VW - 40) en.vx *= -1;
      } else if (en.type === 'mid' || en.type === 'boss') {
        if (en.y < 108) en.y += 46 * dt;
        else {
          en.y = 108 + Math.sin(en.t * 1.3) * 10;
          en.x = VW * 0.5 + Math.sin(en.t * (en.type === 'boss' ? 0.7 : 1.05)) * (en.type === 'boss' ? 110 : 86);
        }
        en.fireCd -= dt;
        if (en.fireCd <= 0) {
          const low = en.hp < en.maxHp * 0.5;
          if (en.type === 'mid') {
            en.fireCd = dense ? 0.48 : 0.7;
            if (G.stage === 1) fanShot(en.x, en.y + 16, low ? 5 : 3, 0.22, 128, Math.PI * 0.5);
            else if (G.stage === 2) {
              aimShot(en.x - 12, en.y + 10, 150, 3.4);
              aimShot(en.x + 12, en.y + 10, 150, 3.4);
            } else {
              fanShot(en.x, en.y + 12, 6, TAU / 6, 108, en.t);
            }
          } else {
            en.fireCd = dense ? (low ? 0.28 : 0.4) : (low ? 0.38 : 0.55);
            if (G.stage === 1) {
              fanShot(en.x, en.y + 20, low ? 7 : 5, 0.18, 136, Math.PI * 0.5);
              if (low) aimShot(en.x, en.y + 18, 170, 4);
            } else if (G.stage === 2) {
              fanShot(en.x - 22, en.y + 8, 3, 0.2, 140, Math.PI * 0.5);
              fanShot(en.x + 22, en.y + 8, 3, 0.2, 140, Math.PI * 0.5);
              if (low) aimShot(en.x, en.y + 16, 186, 4);
            } else {
              const n = low ? 10 : 8;
              for (let k = 0; k < n; k++) {
                const a = en.t * 1.4 + k * TAU / n;
                eShot(en.x + Math.cos(a) * 28, en.y + Math.sin(a) * 16, Math.cos(a) * 90, Math.sin(a) * 90 + 40, 3.4);
              }
              if (low) {
                aimShot(en.x, en.y + 20, 200, 4.4);
                fanShot(en.x, en.y + 18, 5, 0.16, 150, Math.PI * 0.5);
              }
            }
          }
        }
      } else {
        en.x += en.vx * dt;
        en.y += en.vy * dt;
      }

      if (en.y > VH + 50 || en.x < -70 || en.x > VW + 70) {
        G.ents.splice(i, 1);
        continue;
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && !en.ground) {
        const pr = 7;
        if (hypot(en.x - G.player.x, en.y - G.player.y) < en.r * 0.72 + pr) {
          playerDie();
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.trail && !REDUCE && Math.random() < 0.5) {
        emit(1, {
          x: s.x, y: s.y, j: 2,
          vx0: -20, vx1: 20, vy0: 20, vy1: 80,
          life: 0.16, r0: 1, r1: 2.4, rgb: s.kind === 'meteor' ? GOLD : FIRE, g: 80
        });
      }
      let dead = s.life <= 0 || s.y < -20 || s.y > VH + 30 || s.x < -20 || s.x > VW + 20;
      if (s.kind === 'meteor' && s.y >= VH - 36) {
        explodeBomb(s.x, s.y, false);
        dead = true;
      }
      if (!dead) {
        for (let j = 0; j < G.ents.length; j++) {
          const en = G.ents[j];
          const rad = en.r + s.r;
          if (hypot(en.x - s.x, en.y - s.y) < rad) {
            if (s.kind === 'meteor') {
              explodeBomb(s.x, s.y, false);
              dead = true;
              break;
            }
            hurtEnt(en, s.dmg, s.x, s.y);
            dead = true;
            break;
          }
        }
      }
      if (dead) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y < -30 || s.y > VH + 30 || s.x < -30 || s.x > VW + 30) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (hypot(s.x - G.player.x, s.y - G.player.y) < s.r + 6.2) {
          G.eShots.splice(i, 1);
          playerDie();
        }
      }
    }
  }

  function updatePows(dt) {
    for (let i = G.pows.length - 1; i >= 0; i--) {
      const p = G.pows[i];
      p.t += dt;
      p.life -= dt;
      p.vy += 210 * dt;
      if (p.vy > 78) p.vy = 78;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 18 || p.x > VW - 18) p.vx *= -1;
      if (p.y > VH - 16) {
        p.y = VH - 16;
        p.vy *= -0.35;
        p.vx *= 0.8;
      }
      if (p.life <= 0) {
        G.pows.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && hypot(p.x - G.player.x, p.y - G.player.y) < 22) {
        collectPow(p);
        G.pows.splice(i, 1);
      }
    }
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
      updateTail(dt);
      G.spawnT -= dt;
      if (G.spawnT <= 0 && livingCount() < 8) {
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
      updateTail(dt);
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
    updateTail(dt);

    if (G.mode === 'play' && G.deadT <= 0 && G.fireHold) fire();

    if (isDense()) stormThink(dt);
    else raidThink();

    updateEnts(dt);
    updateShots(dt);
    updatePows(dt);
  }

  function drawWorld() {
    const stg = G.stage;
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    if (stg >= 3) {
      g.addColorStop(0, '#0c1018');
      g.addColorStop(0.5, '#100c14');
      g.addColorStop(1, '#140804');
    } else if (stg === 2) {
      g.addColorStop(0, '#0c1408');
      g.addColorStop(0.45, '#141008');
      g.addColorStop(1, '#180804');
    } else {
      g.addColorStop(0, '#1a0a06');
      g.addColorStop(0.4, '#180806');
      g.addColorStop(1, '#0c0402');
    }
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      ctx.fillStyle = rgba(stg >= 3 ? ICE : WHT, s.a * (stg >= 2 ? 0.7 : 0.42));
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (0.6 + s.z * 0.9) * scale, 0, TAU);
      ctx.fill();
    }

    if (stg === 1) {
      const wy = ((G.scroll * 0.45) % 56);
      for (let y = -56; y < VH + 56; y += 56) {
        ctx.fillStyle = 'rgba(255, 70, 20, 0.16)';
        ctx.beginPath();
        ctx.moveTo(sx(VW * 0.28), sy(y + wy));
        for (let x = VW * 0.28; x <= VW * 0.72; x += 16) {
          const amp = 6 + Math.sin((x + G.scroll) * 0.03) * 4;
          ctx.lineTo(sx(x), sy(y + wy + Math.sin((x + G.scroll) * 0.05) * amp));
        }
        ctx.lineTo(sx(VW * 0.72), sy(y + wy + 56));
        ctx.lineTo(sx(VW * 0.28), sy(y + wy + 56));
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255, 90, 34, 0.1)';
      ctx.fillRect(sx(0), sy(0), 48 * scale, VH * scale);
      ctx.fillRect(sx(VW - 48), sy(0), 48 * scale, VH * scale);
    } else if (stg === 2) {
      ctx.fillStyle = 'rgba(70, 120, 50, 0.12)';
      for (let i = 0; i < 5; i++) {
        const cy = ((G.scroll * 0.38 + i * 150) % (VH + 170)) - 80;
        const cx = 36 + (i * 81) % (VW - 72);
        ctx.beginPath();
        ctx.ellipse(sx(cx), sy(cy), 40 * scale, 18 * scale, 0, 0, TAU);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = 'rgba(170, 210, 255, 0.12)';
      ctx.lineWidth = 1.2 * scale;
      const off = (G.scroll * 0.5) % 44;
      for (let y = -44; y < VH + 44; y += 44) {
        ctx.beginPath();
        ctx.moveTo(sx(26), sy(y + off));
        ctx.lineTo(sx(26), sy(y + 26 + off));
        ctx.moveTo(sx(VW - 26), sy(y + off));
        ctx.lineTo(sx(VW - 26), sy(y + 26 + off));
        ctx.stroke();
      }
    }

    for (let i = 0; i < G.rocks.length; i++) {
      const b = G.rocks[i];
      ctx.save();
      if (stg === 1) {
        ctx.fillStyle = rgba([70 + b.hue * 40, 28, 14], 0.92);
        ctx.beginPath();
        ctx.moveTo(sx(b.x - b.w * 0.5), sy(b.y + b.h * 0.3));
        ctx.lineTo(sx(b.x - b.w * 0.15), sy(b.y - b.h * 0.45));
        ctx.lineTo(sx(b.x + b.w * 0.2), sy(b.y - b.h * 0.2));
        ctx.lineTo(sx(b.x + b.w * 0.5), sy(b.y + b.h * 0.35));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba(FIRE, 0.35);
        ctx.beginPath();
        ctx.ellipse(sx(b.x), sy(b.y + 8), 10 * scale, 4 * scale, 0, 0, TAU);
        ctx.fill();
      } else if (stg === 2) {
        ctx.fillStyle = rgba([48, 62 + b.hue * 30, 36], 0.88);
        ctx.fillRect(sx(b.x - b.w * 0.28), sy(b.y - b.h * 0.35), b.w * 0.56 * scale, b.h * 0.7 * scale);
        ctx.fillStyle = rgba(GOLD, 0.22);
        for (let n = 0; n < b.n; n++) {
          ctx.fillRect(sx(b.x - 6), sy(b.y - 16 + n * 10), 5 * scale, 5 * scale);
        }
      } else {
        ctx.fillStyle = rgba([90, 110, 140], 0.55);
        ctx.beginPath();
        ctx.moveTo(sx(b.x), sy(b.y - b.h * 0.4));
        ctx.lineTo(sx(b.x + b.w * 0.28), sy(b.y + b.h * 0.22));
        ctx.lineTo(sx(b.x - b.w * 0.28), sy(b.y + b.h * 0.22));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = rgba(ICE, 0.35);
        ctx.lineWidth = 1.2 * scale;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawDragon(x, y, a) {
    ctx.save();
    ctx.globalAlpha = a;
    for (let i = tail.length - 1; i >= 0; i--) {
      const s = tail[i];
      const t = i / Math.max(1, tail.length - 1);
      const rad = (8.2 - t * 5.4) * scale;
      const rgb = t > 0.62 ? GOLD : (t > 0.32 ? EMBER : FIRE);
      ctx.fillStyle = rgba(rgb, 0.92 - t * 0.18);
      ctx.shadowColor = rgba(FIRE, 0.55);
      ctx.shadowBlur = 10 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(s.x), sy(s.y), rad, rad * 1.15, 0, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    const offs = headOffsets();
    for (let h = 0; h < offs.length; h++) {
      const hx = x + offs[h].x;
      const hy = y + offs[h].y;
      ctx.save();
      ctx.translate(sx(hx), sy(hy));
      ctx.scale(scale, scale);
      ctx.shadowColor = rgba(FIRE, 0.75);
      ctx.shadowBlur = 14;
      ctx.fillStyle = rgba(FIRE, 0.97);
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.quadraticCurveTo(10, -6, 8, 6);
      ctx.lineTo(3, 4);
      ctx.lineTo(0, 8);
      ctx.lineTo(-3, 4);
      ctx.lineTo(-8, 6);
      ctx.quadraticCurveTo(-10, -6, 0, -18);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.quadraticCurveTo(4, -4, 2.4, 2);
      ctx.lineTo(0, 3);
      ctx.lineTo(-2.4, 2);
      ctx.quadraticCurveTo(-4, -4, 0, -14);
      ctx.fill();
      ctx.fillStyle = rgba(EMBER, 0.95);
      ctx.beginPath();
      ctx.moveTo(-7, -8);
      ctx.lineTo(-12, -16);
      ctx.lineTo(-4, -10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(7, -8);
      ctx.lineTo(12, -16);
      ctx.lineTo(4, -10);
      ctx.fill();
      ctx.fillStyle = rgba(DEEP, 0.95);
      ctx.beginPath();
      ctx.arc(-3.2, -6, 1.5, 0, TAU);
      ctx.arc(3.2, -6, 1.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.9);
      ctx.beginPath();
      ctx.arc(-2.8, -6.4, 0.55, 0, TAU);
      ctx.arc(3.6, -6.4, 0.55, 0, TAU);
      ctx.fill();
      if (G.muzzle > 0) {
        ctx.fillStyle = rgba(WHT, Math.min(1, G.muzzle * 1.4));
        ctx.beginPath();
        ctx.arc(0, -18, 5.2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(GOLD, G.muzzle);
        ctx.beginPath();
        ctx.arc(0, -22, 3.2, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawEnt(en) {
    const flash = en.flash > 0;
    const rgb = flash ? WHT : en.rgb;
    const big = en.type === 'mid' || en.type === 'boss';
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    ctx.scale(scale * (big ? (en.type === 'boss' ? 1.15 : 0.88) : 1), scale * (big ? (en.type === 'boss' ? 1.15 : 0.88) : 1));
    ctx.shadowColor = rgba(rgb, 0.55);
    ctx.shadowBlur = big ? 16 : 10;
    ctx.fillStyle = rgba(rgb, 0.95);

    if (en.type === 'turret') {
      ctx.fillRect(-13, -6, 26, 16);
      ctx.fillStyle = rgba(flash ? WHT : FIRE, 0.9);
      ctx.fillRect(-3, -18, 6, 14);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.beginPath();
      ctx.arc(0, 2, 5.5, 0, TAU);
      ctx.fill();
    } else if (en.type === 'totem') {
      ctx.fillRect(-12, -20, 24, 40);
      ctx.fillStyle = rgba(DEEP, 0.8);
      ctx.fillRect(-8, -12, 6, 6);
      ctx.fillRect(2, -12, 6, 6);
      ctx.fillRect(-6, 4, 12, 5);
    } else if (en.type === 'carrier') {
      ctx.beginPath();
      ctx.moveTo(-16, 10);
      ctx.lineTo(-8, -14);
      ctx.lineTo(8, -14);
      ctx.lineTo(16, 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.92);
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 8, 0, 0, TAU);
      ctx.fill();
    } else if (en.type === 'skull') {
      ctx.beginPath();
      ctx.arc(0, -2, 10, 0, TAU);
      ctx.fill();
      ctx.fillRect(-7, 4, 14, 7);
      ctx.fillStyle = rgba(DEEP, 0.9);
      ctx.beginPath();
      ctx.arc(-3.5, -3, 2.2, 0, TAU);
      ctx.arc(3.5, -3, 2.2, 0, TAU);
      ctx.fill();
    } else if (en.type === 'wyvern') {
      const flap = Math.sin(en.t * 8) * 7;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(16, flap);
      ctx.lineTo(4, 4);
      ctx.lineTo(0, 12);
      ctx.lineTo(-4, 4);
      ctx.lineTo(-16, flap);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.7);
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(4, 2);
      ctx.lineTo(-4, 2);
      ctx.fill();
    } else if (en.type === 'mid' || en.type === 'boss') {
      const walk = Math.sin(en.t * 3.2) * (big ? 6 : 3);
      if (G.stage === 1) {
        ctx.beginPath();
        ctx.ellipse(0, 4, 28, 16, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-8, -6);
        ctx.quadraticCurveTo(0, -28, 8, -6);
        ctx.fill();
        ctx.fillStyle = rgba(FIRE, 0.8);
        ctx.fillRect(-18, 8, 10, 8);
        ctx.fillRect(8, 8, 10, 8);
      } else if (G.stage === 2) {
        ctx.fillRect(-22 + walk * 0.1, -8, 44, 28);
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.fillRect(-26, -18, 18, 16);
        ctx.fillRect(8, -18, 18, 16);
        ctx.fillStyle = rgba(DEEP, 0.85);
        ctx.fillRect(-20, -12, 6, 5);
        ctx.fillRect(14, -12, 6, 5);
      } else {
        ctx.beginPath();
        ctx.arc(0, -6, 22, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.beginPath();
        ctx.moveTo(-8, -24);
        ctx.lineTo(-4, -36);
        ctx.lineTo(0, -24);
        ctx.lineTo(4, -36);
        ctx.lineTo(8, -24);
        ctx.fill();
        ctx.fillStyle = rgba(DEEP, 0.9);
        ctx.beginPath();
        ctx.arc(-8, -8, 4, 0, TAU);
        ctx.arc(8, -8, 4, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(FIRE, 0.85);
        ctx.beginPath();
        ctx.arc(0, 6, 6, 0, Math.PI);
        ctx.fill();
      }
      if (en.type === 'boss') {
        ctx.strokeStyle = rgba(GOLD, 0.45);
        ctx.lineWidth = 2;
        ctx.strokeRect(-30, -24, 60, 48);
      }
    } else {
      const flap = Math.sin(en.t * 10 + en.phase) * 5;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(12, flap - 4);
      ctx.lineTo(3, -2);
      ctx.lineTo(0, -8);
      ctx.lineTo(-3, -2);
      ctx.lineTo(-12, flap - 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.scale(scale, scale);
      ctx.shadowColor = rgba(s.kind === 'meteor' ? GOLD : FIRE, 0.8);
      ctx.shadowBlur = 12;
      if (s.kind === 'meteor') {
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.beginPath();
        ctx.ellipse(0, 0, s.r * 0.7, s.r, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(WHT, 0.85);
        ctx.beginPath();
        ctx.arc(0, -3, 4, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillStyle = rgba(FIRE, 0.95);
        ctx.beginPath();
        ctx.ellipse(0, 0, s.r * 0.62, s.r * 1.35, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(GOLD, 0.9);
        ctx.beginPath();
        ctx.ellipse(0, -1, s.r * 0.32, s.r * 0.8, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.scale(scale, scale);
      ctx.shadowColor = rgba(MAG, 0.7);
      ctx.shadowBlur = 8;
      ctx.fillStyle = rgba(PNK, 0.95);
      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(-0.8, -0.8, s.r * 0.35, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPows() {
    for (let i = 0; i < G.pows.length; i++) {
      const p = G.pows[i];
      const rgb = DROP_RGB[p.kind] || GOLD;
      const pulse = 1 + Math.sin(p.t * 8) * 0.08;
      ctx.save();
      ctx.translate(sx(p.x), sy(p.y));
      ctx.scale(scale * pulse, scale * pulse);
      ctx.shadowColor = rgba(rgb, 0.8);
      ctx.shadowBlur = 12;
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(8, 0);
      ctx.lineTo(0, 11);
      ctx.lineTo(-8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = rgba(DEEP, 0.92);
      ctx.font = 'bold 9px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 0;
      ctx.fillText(DROP_GLYPH[p.kind] || '?', 0, 1);
      ctx.restore();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), Math.max(0.4, p.r * a) * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.strokeStyle = rgba(s.rgb, 1 - s.t);
      ctx.lineWidth = (2.2 - s.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      if (r.t < 0) continue;
      ctx.strokeStyle = rgba(r.rgb, 0.85 - r.t * 0.85);
      ctx.lineWidth = (3.5 - r.t * 2) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + r.t * 46) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = 'bold ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' || G.ents[i].type === 'mid') {
        if (!boss || G.ents[i].type === 'boss') boss = G.ents[i];
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
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : FIRE, 0.95);
    ctx.shadowColor = rgba(t < 0.34 ? MAG : FIRE, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    const st = STAGES[G.stage - 1];
    const name = boss.type === 'boss' ? (st ? st.boss : '关底') : (st ? st.mid : '中型');
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.font = 'bold ' + (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name, sx(x), sy(y - 4));
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    if (G.bombFlash > 0) {
      ctx.strokeStyle = rgba(GOLD, G.bombFlash * 0.9);
      ctx.lineWidth = 7 * scale;
      ctx.strokeRect(sx(4), sy(4), (VW - 8) * scale, (VH - 8) * scale);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0604';
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
    drawParticles();

    if (G.mode !== 'lose' && G.deadT <= 0) {
      const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
      if (!blink) drawDragon(G.player.x, G.player.y, 1);
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
    G.rocks.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function startGame(kind) {
    G.kind = kind === 'sea' ? 'sea' : 'breath';
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
    G.heads = 1;
    G.fireLv = 0;
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
    G.nextRock = 40;
    G.stormT = 1.6;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    resetTail();
    seedStars();
    seedRocks();
    hideOverlay();
    syncHud();
    audio.start();
    toast(isDense() ? '炎海 · 更密更快' : '龙息 · 第 1 关', false, true);
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'breath';
    G.stage = 1;
    G.lives = LIVES;
    G.bombs = 3;
    G.heads = 1;
    G.fireLv = 0;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.bombT = 0;
    G.player.x = VW * 0.5;
    G.player.y = VH - 96;
    G.spawnT = 0.4;
    clearField();
    resetTail();
    seedStars();
    seedRocks();
    showOverlay('title', '龙魂', '化龙北上。喷火打空，爆弹砸地。吃卵长头，撞体扣命。三关之后是龙魂王。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('breath');
    else startGame(G.kind || 'breath');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('breath');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function secondaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('sea');
    else if (G.mode === 'lose') goTitle();
    else if (G.mode === 'win') {
      if (isDense()) goTitle();
      else startGame('sea');
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

  if (btnBreath) {
    btnBreath.addEventListener('click', function () {
      audio.ensure();
      startGame('breath');
    });
  }
  if (btnSea) {
    btnSea.addEventListener('click', function () {
      audio.ensure();
      startGame('sea');
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
      if (G.mode === 'win' && !isDense()) startGame('sea');
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
