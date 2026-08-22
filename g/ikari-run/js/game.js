'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 18000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.45;
  const NADE_MAX = 9;
  const BEST_KEY = 'playbox-ikari-run-best';
  const MUTE_KEY = 'playbox-ikari-run-mute';
  const OPS = 'WASD / 方向键走 · 指针瞄准 · 空格开火 · G 手雷 · 走进坦克 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 74, 26];
  const HOT2 = [255, 122, 58];
  const LEAF = [61, 255, 122];
  const WHT = [246, 243, 239];
  const MUD = [168, 132, 74];
  const ORG = [255, 168, 64];

  const STAGES = [
    { name: '密林', len: 2050, boss: '装甲车', hp: 78, kind: 'tank' },
    { name: '河谷', len: 2350, boss: '武装直升机', hp: 108, kind: 'heli' },
    { name: '要塞', len: 2650, boss: '要塞司令', hp: 148, kind: 'fort' }
  ];

  const SCORE = {
    grunt: 50, bunker: 160, etank: 320, heli: 420, turret: 120,
    rock: 10, boss: 4200
  };

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
  const btnJungle = document.getElementById('btn-jungle');
  const btnAssault = document.getElementById('btn-assault');
  const ovAgain = document.getElementById('ov-again');
  const ovMenu = document.getElementById('ov-menu');
  const modeJungle = document.getElementById('mode-jungle');
  const modeAssault = document.getElementById('mode-assault');
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
  const nadeLabel = document.getElementById('nade-label');
  const tankWrap = document.getElementById('tank-wrap');
  const tankBar = document.getElementById('tank-bar');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const chainPop = document.getElementById('chain-pop');
  const pad = document.getElementById('pad');

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
  let chainTok = 0;
  let rumbleTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 90, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];

  const G = {
    mode: 'title',
    kind: 'jungle',
    t: 0,
    clock: 0,
    stage: 1,
    cam: 0,
    maxCam: 0,
    spawnedY: 80,
    player: { x: VW * 0.5, wy: 90, ax: 0, ay: 1, r: 11 },
    tank: null,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    nades: 4,
    ents: [],
    shots: [],
    eShots: [],
    nadeShots: [],
    rocks: [],
    waters: [],
    pickups: [],
    fireCd: 0,
    nadeCd: 0,
    fireHold: false,
    nadeHold: false,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    rumble: 0,
    toastT: 0,
    nextLife: LIFE_EVERY,
    stageClearT: 0,
    boss: null,
    bossDown: false,
    nextBoss: 2050,
    why: '',
    aimQ: 0,
    aimE: 0
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
  function isAssault() {
    return G.kind === 'assault';
  }
  function worldToScreenY(wy) {
    return VH - (wy - G.cam);
  }
  function screenToWorldY(syv) {
    return G.cam + (VH - syv);
  }
  function angOf(ax, ay) {
    return Math.atan2(ay, ax);
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function valNoise(x, salt) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = hash2(i + salt * 9973);
    const b = hash2(i + 1 + salt * 9973);
    return a + (b - a) * u;
  }
  function fbm(x, salt) {
    return valNoise(x, salt) * 0.55
      + valNoise(x * 2.07, salt + 17) * 0.3
      + valNoise(x * 4.13, salt + 31) * 0.15;
  }
  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }
  function wrapAng(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function turnToward(ax, ay, tx, ty, rate) {
    const a0 = Math.atan2(ay, ax);
    const a1 = Math.atan2(ty, tx);
    let d = wrapAng(a1 - a0);
    if (d > rate) d = rate;
    if (d < -rate) d = -rate;
    const a = a0 + d;
    return { ax: Math.cos(a), ay: Math.sin(a) };
  }

  function pathAt(wy) {
    const assault = isAssault();
    const n1 = fbm(wy * 0.00172, 1 + G.stage);
    const n2 = fbm(wy * 0.00066, 5 + G.stage);
    let cx = VW * 0.5 + (n1 - 0.5) * (assault ? 88 : 64) + (n2 - 0.5) * 20;
    let half = (assault ? 106 : 140) + (fbm(wy * 0.0022, 3) - 0.5) * (assault ? 34 : 46);
    if (wy < 240) half += (240 - wy) * 0.2;
    if (G.boss && G.boss.type === 'fort') half = Math.max(half, 150);
    return { l: cx - half, r: cx + half, cx: cx };
  }

  function inWater(x, wy) {
    for (let i = 0; i < G.waters.length; i++) {
      const w = G.waters[i];
      if (wy > w.wy && wy < w.wy + w.h) return true;
    }
    return false;
  }

  function circleRect(cx, cy, rad, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy < rad * rad;
  }

  function terrainBlocked(x, wy, rad) {
    const p = pathAt(wy);
    if (x - rad < p.l + 6 || x + rad > p.r - 6) return true;
    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      if (hypot(x - r.x, wy - r.wy) < rad + r.r) return true;
    }
    return false;
  }

  function blockedAt(x, wy, rad, skip) {
    if (terrainBlocked(x, wy, rad)) return true;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e === skip || !e.solid || e.hp <= 0) continue;
      if (e.w) {
        if (circleRect(x, wy, rad, e.x - e.w * 0.5, e.wy - e.h * 0.5, e.w, e.h)) return true;
      } else {
        if (hypot(x - e.x, wy - e.wy) < rad + e.r) return true;
      }
    }
    return false;
  }

  function tryMove(ent, dx, dy, rad) {
    let x = ent.x;
    let wy = ent.wy;
    if (dx && !blockedAt(x + dx, wy, rad, ent)) x += dx;
    else if (dx) {
      for (let k = 0; k < 4; k++) {
        const s = dx * (0.7 - k * 0.18);
        if (!blockedAt(x + s, wy, rad, ent)) { x += s; break; }
      }
    }
    if (dy && !blockedAt(x, wy + dy, rad, ent)) wy += dy;
    else if (dy) {
      for (let k = 0; k < 4; k++) {
        const s = dy * (0.7 - k * 0.18);
        if (!blockedAt(x, wy + s, rad, ent)) { wy += s; break; }
      }
    }
    ent.x = x;
    ent.wy = wy;
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
    shoot(cannon) {
      this.ensure();
      if (cannon) {
        this.noise(0.05, 0.04, 400);
        this.beep(220, 0.1, 'sawtooth', 0.05, 90);
      } else {
        this.beep(680, 0.05, 'square', 0.03, 1540);
      }
    },
    nade() {
      this.ensure();
      this.beep(320, 0.08, 'triangle', 0.035, 180);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.04, 0.034, 1100);
      this.beep(500 * lift, 0.07, 'square', 0.044, 860 * lift);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.18 : 0.09, big ? 0.075 : 0.046, big ? 240 : 480);
      this.beep(big ? 160 : 260, big ? 0.24 : 0.13, 'sawtooth', 0.052, 52);
    },
    rumble() {
      this.ensure();
      this.beep(62, 0.09, 'sawtooth', 0.018, 48);
    },
    mount() {
      this.ensure();
      this.beep(140, 0.12, 'sawtooth', 0.04, 90);
      this.beep(330, 0.1, 'square', 0.03, 220);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    pickup() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.035, 1046);
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
    const assault = isAssault();
    if (modeJungle) modeJungle.setAttribute('aria-pressed', assault ? 'false' : 'true');
    if (modeAssault) modeAssault.setAttribute('aria-pressed', assault ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const spec = STAGES[G.stage - 1] || STAGES[0];
    if (stageLabel) {
      if (isAssault()) stageLabel.textContent = '强攻 ' + Math.max(1, G.stage);
      else stageLabel.textContent = spec.name;
      stageLabel.classList.toggle('hot', G.stage >= 3 || (isAssault() && G.clock > 50));
    }
    if (tagLabel) {
      tagLabel.textContent = isAssault() ? '强攻' : '丛林';
      tagLabel.classList.toggle('warn', isAssault());
      tagLabel.classList.toggle('hot', !isAssault() && G.stage >= 3);
    }
    if (nadeLabel) {
      nadeLabel.textContent = '弹 ' + G.nades;
      nadeLabel.classList.toggle('empty', G.nades <= 0);
    }
    if (tankWrap) {
      if (G.tank) {
        tankWrap.hidden = false;
        const t = G.tank.hp / G.tank.max;
        if (tankBar) tankBar.style.transform = 'scaleX(' + clamp(t, 0, 1) + ')';
        tankWrap.classList.toggle('low', t < 0.4);
      } else {
        tankWrap.hidden = true;
      }
    }
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.mode === 'play');
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 徒步中弹扣一命，坦克扛打', 'warn');
    else if (G.mode === 'win') setHint('要塞打穿了 · R 再来一局', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 找坦克或用手雷清碉堡', 'warn');
    else if (G.tank) setHint('坦克开着 · 空格开炮 · G 手雷 · 甲没了会炸', '');
    else setHint('WASD 走 · 指针瞄准 · 空格开火 · 走进坦克', '');
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
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'IKARI';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = kind === 'title' ? OPS : 'R 重开随时可用';
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (ovAgain) ovAgain.textContent = '再来';
    if (ovMenu) ovMenu.textContent = kind === 'win' ? '强攻' : '换模式';
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

  function kick(mag, cls) {
    if (REDUCE || G.mode === 'title') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.007));
    if (!stageEl) return;
    const c = cls || (mag >= 6 ? 'die' : mag >= 3.4 ? 'boom' : 'hit');
    kickTok += 1;
    stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'rumble');
    void stageEl.offsetWidth;
    stageEl.classList.add(c);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die', 'boom', 'hit', 'thump', 'rumble');
      }
    }, 360);
  }

  function tankRumbleFx() {
    if (REDUCE || !G.tank) return;
    G.shake = Math.max(G.shake, 2.2);
    if (!stageEl) return;
    rumbleTok += 1;
    stageEl.classList.remove('rumble');
    void stageEl.offsetWidth;
    stageEl.classList.add('rumble');
    const tok = rumbleTok;
    setTimeout(function () {
      if (tok === rumbleTok && stageEl) stageEl.classList.remove('rumble');
    }, 180);
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
        wy: spec.wy + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 300);
  }

  function popSpark(x, wy, rgb, rad) {
    sparks.push({ x: x, wy: wy, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, wy: wy, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 40);
    capArr(rings, 24);
  }

  function floatText(x, wy, text, rgb, gold) {
    floats.push({
      x: x, wy: wy, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.68,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? 90 : 72
    });
    capArr(floats, 28);
  }

  function juice(x, wy, rgb, power) {
    const p = power || 1;
    emit(8 + (p * 10) | 0, {
      x: x, wy: wy, j: 6 + p * 5,
      vx0: -200 * p, vx1: 200 * p, vy0: -80 * p, vy1: 240 * p,
      life: 0.28 + p * 0.14, r0: 1, r1: 2.8 + p, rgb: rgb
    });
    popSpark(x, wy, rgb, 10 + p * 10);
    screenFlash(rgb, 0.16 + p * 0.12);
    kick(2.1 + p * 2.4);
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
      if (tok === chainTok) chainPop.classList.add('hidden');
    }, 700);
  }

  function bumpCombo() {
    const prev = G.mult;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.combo >= 2) audio.combo(G.mult);
    if (G.mult > prev) {
      showChain(G.mult);
      if (comboBox) {
        comboBox.classList.remove('hot');
        void comboBox.offsetWidth;
        comboBox.classList.add('hot');
        comboTok += 1;
        const tok = comboTok;
        setTimeout(function () {
          if (tok === comboTok && comboBox) comboBox.classList.remove('hot');
        }, 280);
      }
    }
    syncHud();
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    syncHud();
  }

  function spawnEnt(spec) {
    if (G.ents.length > 42) return null;
    const en = {
      type: spec.type,
      x: spec.x,
      wy: spec.wy,
      vx: spec.vx || 0,
      vy: spec.vy || 0,
      hp: spec.hp,
      maxHp: spec.hp,
      r: spec.r || 12,
      t: 0,
      fireCd: spec.fireCd != null ? spec.fireCd : rand(0.4, 1.2),
      score: spec.score,
      rgb: spec.rgb,
      ax: spec.ax != null ? spec.ax : 0,
      ay: spec.ay != null ? spec.ay : -1,
      flash: 0,
      solid: !!spec.solid,
      w: spec.w || 0,
      h: spec.h || 0,
      phase: spec.phase || 0,
      drop: spec.drop || null
    };
    G.ents.push(en);
    return en;
  }

  function spawnGrunt(x, wy) {
    return spawnEnt({
      type: 'grunt',
      x: x, wy: wy,
      hp: 1, r: 10, score: SCORE.grunt,
      rgb: ORG, fireCd: rand(0.5, 1.4)
    });
  }

  function spawnBunker(x, wy) {
    return spawnEnt({
      type: 'bunker',
      x: x, wy: wy,
      hp: isAssault() ? 8 : 6,
      r: 18, w: 34, h: 26, solid: true,
      score: SCORE.bunker, rgb: MUD,
      fireCd: rand(0.6, 1.3)
    });
  }

  function spawnETank(x, wy) {
    return spawnEnt({
      type: 'etank',
      x: x, wy: wy,
      hp: isAssault() ? 10 : 8,
      r: 16, solid: true,
      score: SCORE.etank, rgb: LEAF,
      fireCd: rand(0.8, 1.6), ay: -1
    });
  }

  function spawnHeli(x, wy) {
    return spawnEnt({
      type: 'heli',
      x: x, wy: wy,
      hp: 4, r: 16, score: SCORE.heli,
      rgb: MAG, fireCd: rand(0.4, 0.9),
      vx: rand(0, 1) < 0.5 ? -70 : 70
    });
  }

  function spawnPickup(type, x, wy) {
    G.pickups.push({ type: type, x: x, wy: wy, t: 0, r: type === 'ptank' ? 16 : 10 });
  }

  function spawnRock(x, wy, r) {
    G.rocks.push({ x: x, wy: wy, r: r || 12 });
  }

  function spawnGap() {
    return isAssault() ? 72 : 108;
  }

  function placeX(wy, t) {
    const p = pathAt(wy);
    return lerp(p.l + 22, p.r - 22, t);
  }

  function spawnAt(wy) {
    if (wy < 160) return;
    if (G.boss) return;
    const h = hash2((wy | 0) * 17 + G.stage * 91 + (isAssault() ? 5 : 1));
    const h2 = hash2((wy | 0) * 31 + 7);
    const p = pathAt(wy);

    if (h2 < 0.22) {
      const rx = placeX(wy, 0.22 + h2 * 0.56);
      if (!blockedAt(rx, wy, 14, null)) spawnRock(rx, wy, 9 + h2 * 8);
    }
    if (h2 > 0.82 && h2 < 0.9) {
      G.waters.push({ wy: wy, h: 48 + h2 * 30 });
    }

    const dense = isAssault() ? 0.08 : 0;
    if (h < 0.07 + dense) {
      spawnPickup('ptank', placeX(wy, 0.35 + h * 2), wy);
    } else if (h < 0.15) {
      spawnPickup('nade', placeX(wy, 0.3 + h), wy);
    } else if (h < 0.3 + dense) {
      const side = h < 0.22 ? 0.18 : 0.82;
      spawnBunker(placeX(wy, side), wy);
      spawnGrunt(placeX(wy, 0.5), wy + 30);
    } else if (h < 0.4 + dense) {
      spawnETank(placeX(wy, 0.4 + h * 0.4), wy);
    } else if (h < 0.5) {
      spawnHeli(placeX(wy, 0.3 + h * 0.5), wy + 40);
    } else if (h < 0.62) {
      spawnBunker(placeX(wy, 0.16), wy);
      spawnBunker(placeX(wy, 0.84), wy);
    } else {
      const n = 3 + ((h * 5) | 0) + (isAssault() ? 1 : 0);
      for (let i = 0; i < n; i++) {
        spawnGrunt(placeX(wy, 0.2 + i * 0.15 + h * 0.05), wy + i * 18);
      }
    }
  }

  function maybeSpawn() {
    const ahead = G.cam + VH + 50;
    const cap = G.nextBoss - 80;
    while (G.spawnedY < ahead && G.spawnedY < cap) {
      G.spawnedY += spawnGap();
      spawnAt(G.spawnedY);
    }
  }

  function stageSpec() {
    return STAGES[Math.min(STAGES.length, Math.max(1, G.stage)) - 1];
  }

  function spawnBoss() {
    if (G.boss) return;
    const spec = isAssault()
      ? {
        name: G.stage % 3 === 1 ? '装甲车' : G.stage % 3 === 2 ? '武装直升机' : '要塞司令',
        hp: 86 + G.stage * 22,
        kind: G.stage % 3 === 1 ? 'tank' : G.stage % 3 === 2 ? 'heli' : 'fort'
      }
      : stageSpec();
    const p = pathAt(G.player.wy + 260);
    const b = spawnEnt({
      type: 'boss',
      x: p.cx,
      wy: G.player.wy + 280,
      hp: spec.hp,
      r: spec.kind === 'heli' ? 28 : spec.kind === 'fort' ? 42 : 26,
      w: spec.kind === 'fort' ? 90 : 0,
      h: spec.kind === 'fort' ? 48 : 0,
      solid: spec.kind !== 'heli',
      score: SCORE.boss + G.stage * 800,
      rgb: HOT,
      fireCd: 0.8,
      ay: -1
    });
    if (!b) return;
    b.kind = spec.kind;
    b.name = spec.name;
    G.boss = b;
    G.bossDown = false;
    audio.boss();
    toast(spec.name + ' 来了', true, false);
    kick(5, 'thump');
    screenFlash(HOT, 0.45);
  }

  function plyRad() {
    return G.tank ? 16 : 11;
  }
  function plySpd() {
    const base = G.tank ? 118 : 176;
    const wet = inWater(G.player.x, G.player.wy) ? 0.58 : 1;
    return base * wet;
  }

  function muzzlePos() {
    const reach = G.tank ? 22 : 16;
    return {
      x: G.player.x + G.player.ax * reach,
      wy: G.player.wy + G.player.ay * reach
    };
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    const cannon = !!G.tank;
    const maxShots = cannon ? 4 : 7;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].kind === 'shot') n += 1;
    if (n >= maxShots) return;
    const m = muzzlePos();
    const spd = cannon ? 430 : 540;
    G.shots.push({
      x: m.x, wy: m.wy,
      vx: G.player.ax * spd,
      vy: G.player.ay * spd,
      r: cannon ? 5.5 : 3.2,
      dmg: cannon ? 3 : 1,
      life: 0.7,
      kind: 'shot',
      rgb: cannon ? GOLD : CYN
    });
    G.fireCd = cannon ? 0.28 : 0.13;
    G.muzzle = cannon ? 0.1 : 0.06;
    audio.shoot(cannon);
    emit(cannon ? 8 : 4, {
      x: m.x, wy: m.wy, j: 3,
      vx0: G.player.ax * 40 - 50, vx1: G.player.ax * 140 + 50,
      vy0: G.player.ay * 40 - 40, vy1: G.player.ay * 160 + 40,
      life: 0.16, r0: 1, r1: cannon ? 3.4 : 2, rgb: cannon ? GOLD : WHT
    });
    if (cannon) {
      tankRumbleFx();
      hitStop(0.036);
      audio.rumble();
    } else if (!REDUCE) {
      G.shake = Math.max(G.shake, 1.15);
    }
  }

  function throwNade() {
    if (G.mode !== 'play' || G.deadT > 0 || G.nadeCd > 0) return;
    if (G.nades <= 0) {
      toast('没有手雷', true, false);
      G.nadeCd = 0.7;
      return;
    }
    G.nades -= 1;
    G.nadeCd = 0.62;
    if (!REDUCE) {
      G.shake = Math.max(G.shake, 1.6);
      G.punch = Math.max(G.punch, 1.012);
    }
    const m = muzzlePos();
    const spd = 240;
    G.nadeShots.push({
      x: m.x, wy: m.wy,
      vx: G.player.ax * spd,
      vy: G.player.ay * spd,
      r: 6,
      t: 0,
      fuse: 0.55,
      rgb: GOLD
    });
    audio.nade();
    syncHud();
  }

  function explode(x, wy, power, dmg) {
    const p = power || 1;
    juice(x, wy, p > 1.4 ? HOT : GOLD, p);
    audio.boom(p > 1.3);
    hitStop(clamp(0.036 + p * 0.018, 0.036, 0.08));
    if (dmg) {
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (e.hp <= 0) continue;
        const rad = (e.r || 12) + 40 * p;
        if (hypot(e.x - x, e.wy - wy) < rad) hurtEnt(e, dmg, true);
      }
    }
  }

  function hurtEnt(e, dmg, fromNade) {
    if (e.hp <= 0) return;
    e.hp -= dmg;
    e.flash = 0.12;
    audio.hit(G.combo);
    if (e.hp > 0) {
      emit(5, {
        x: e.x, wy: e.wy, j: 4,
        vx0: -80, vx1: 80, vy0: -20, vy1: 90,
        life: 0.18, r0: 1, r1: 2.4, rgb: GOLD
      });
      hitStop(0.032);
      return;
    }
    killEnt(e, fromNade);
  }

  function killEnt(e, fromNade) {
    e.hp = 0;
    bumpCombo();
    const pts = ((e.score || 50) * G.mult) | 0;
    addScore(pts);
    floatText(e.x, e.wy + 10, '+' + pts, e.type === 'boss' ? GOLD : WHT, e.type === 'boss' || G.mult >= 3);
    const big = e.type === 'boss' || e.type === 'etank' || e.type === 'bunker';
    explode(e.x, e.wy, big ? (e.type === 'boss' ? 2.4 : 1.5) : 0.85, 0);
    if (e.type === 'bunker' && hash2((e.wy | 0) + 3) < 0.35) spawnPickup('nade', e.x, e.wy);
    if (e.type === 'etank' && hash2((e.wy | 0) + 9) < 0.28) spawnPickup('ptank', e.x, e.wy);
    if (e.type === 'boss') {
      G.bossDown = true;
      G.stageClearT = 2.15;
      G.boss = null;
      addScore((1500 * G.stage * G.mult) | 0);
      toast(e.name ? (e.name + ' 炸了') : '炸掉了', false, true);
      if (stageEl) {
        stageEl.classList.remove('win-flash');
        void stageEl.offsetWidth;
        stageEl.classList.add('win-flash');
      }
    }
  }

  function mountTank() {
    const hp = isAssault() ? 4 : 5;
    G.tank = { hp: hp, max: hp };
    G.player.r = 16;
    G.invuln = Math.max(G.invuln, 0.35);
    audio.mount();
    toast('上车', false, true);
    juice(G.player.x, G.player.wy, LEAF, 0.8);
    tankRumbleFx();
    syncHud();
  }

  function bustTank() {
    explode(G.player.x, G.player.wy, 1.7, 0);
    G.tank = null;
    G.player.r = 11;
    G.invuln = 1.15;
    toast('坦克炸了', true, false);
    audio.boom(true);
    kick(6, 'die');
    syncHud();
  }

  function hurtPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    if (G.tank) {
      G.tank.hp -= 1;
      G.invuln = 0.55;
      G.flash = 0.4;
      G.flashRgb = HOT;
      tankRumbleFx();
      hitStop(0.06);
      audio.boom(false);
      emit(10, {
        x: G.player.x, wy: G.player.wy, j: 8,
        vx0: -140, vx1: 140, vy0: -40, vy1: 160,
        life: 0.28, r0: 1.4, r1: 3.2, rgb: HOT
      });
      syncHud();
      if (G.tank.hp <= 0) bustTank();
      return;
    }
    G.why = why || '被击中了';
    G.lives -= 1;
    G.deadT = 0.92;
    G.invuln = 0;
    breakCombo();
    explode(G.player.x, G.player.wy, 1.8, 0);
    audio.death();
    kick(8, 'die');
    screenFlash(MAG, 0.55);
    syncHud();
    if (G.lives <= 0) {
      G.mode = 'lose';
      audio.lose();
      showOverlay('lose', G.why, '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : ''));
      setHint('R 重开 · 徒步中弹扣一命，坦克扛打', 'warn');
    }
  }

  function respawn() {
    G.deadT = 0;
    const p = pathAt(G.cam + 90);
    G.player.x = p.cx;
    G.player.wy = G.cam + 90;
    G.player.ax = 0;
    G.player.ay = 1;
    G.tank = null;
    G.invuln = 1.45;
    G.fireCd = 0.2;
    syncHud();
    toast('重整', false, false);
  }

  function nextStage() {
    if (isAssault()) {
      G.stage += 1;
      G.bossDown = false;
      G.nextBoss = G.player.wy + 2100;
      G.spawnedY = G.player.wy + 80;
      toast('下一波 · 更密', true, false);
      audio.stage();
      syncHud();
      return;
    }
    if (G.stage >= 3) {
      G.mode = 'win';
      addScore(8000);
      audio.win();
      showOverlay('win', '要塞打穿了', '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : ''));
      if (stageEl) {
        stageEl.classList.remove('win-flash');
        void stageEl.offsetWidth;
        stageEl.classList.add('win-flash');
      }
      syncHud();
      return;
    }
    G.stage += 1;
    const spec = stageSpec();
    G.cam = 0;
    G.maxCam = 0;
    G.spawnedY = 80;
    G.player.x = VW * 0.5;
    G.player.wy = 90;
    G.player.ax = 0;
    G.player.ay = 1;
    G.boss = null;
    G.bossDown = false;
    G.nextBoss = spec.len;
    G.invuln = 1.2;
    clearField(false);
    audio.stage();
    toast(spec.name, false, true);
    syncHud();
  }

  function clearField(keepPlayer) {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.nadeShots.length = 0;
    G.rocks.length = 0;
    G.waters.length = 0;
    G.pickups.length = 0;
    G.boss = null;
    if (!keepPlayer) {
      particles.length = 0;
      sparks.length = 0;
      rings.length = 0;
      floats.length = 0;
    }
  }

  function enemyFire(e, ax, ay, spd, r, dmg) {
    const len = hypot(ax, ay) || 1;
    ax /= len;
    ay /= len;
    G.eShots.push({
      x: e.x + ax * (e.r + 4),
      wy: e.wy + ay * (e.r + 4),
      vx: ax * spd,
      vy: ay * spd,
      r: r || 3.2,
      dmg: dmg || 1,
      life: 1.35,
      rgb: MAG
    });
    capArr(G.eShots, 48);
  }

  function aimAtPlayer(e) {
    const dx = G.player.x - e.x;
    const dy = G.player.wy - e.wy;
    const d = hypot(dx, dy) || 1;
    return { ax: dx / d, ay: dy / d, d: d };
  }

  function updateAim(dt, mx, my, moving) {
    const p = G.player;
    if (G.aimQ) {
      const t = turnToward(p.ax, p.ay, -p.ay, p.ax, 4.8 * dt);
      p.ax = t.ax; p.ay = t.ay;
    }
    if (G.aimE) {
      const t = turnToward(p.ax, p.ay, p.ay, -p.ax, 4.8 * dt);
      p.ax = t.ax; p.ay = t.ay;
    }
    if (pointer.hover || pointer.down) {
      const syv = worldToScreenY(p.wy);
      const dx = pointer.x - p.x;
      const dyWorld = -(pointer.y - syv);
      if (dx * dx + dyWorld * dyWorld > 16) {
        const d = hypot(dx, dyWorld);
        p.ax = dx / d;
        p.ay = dyWorld / d;
        return;
      }
    }
    if (moving) {
      const t = turnToward(p.ax, p.ay, mx, my, (G.tank ? 7 : 11) * dt);
      p.ax = t.ax;
      p.ay = t.ay;
    }
  }

  function followCam() {
    const target = G.player.wy - 310;
    G.maxCam = Math.max(G.maxCam, G.player.wy - 360);
    let cam = clamp(target, Math.max(0, G.maxCam - 100), G.player.wy - 72);
    if (G.boss && G.boss.hp > 0) {
      cam = Math.min(cam, G.boss.wy - 380);
    }
    G.cam = Math.max(0, cam);
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0 && G.mode === 'play') respawn();
      return;
    }
    if (G.mode === 'title') {
      G.player.wy += 36 * dt;
      const lane = pathAt(G.player.wy);
      G.player.x = lerp(G.player.x, lane.cx, 0.04);
      G.player.ax = 0;
      G.player.ay = 1;
      followCam();
      return;
    }
    if (overlayOpen() || G.mode !== 'play') return;

    let mx = 0;
    let my = 0;
    if (keys.l) mx -= 1;
    if (keys.r) mx += 1;
    if (keys.u) my += 1;
    if (keys.d) my -= 1;
    const keyMove = keys.l || keys.r || keys.u || keys.d;
    if (pointer.down && inputSrc === 'ptr' && !keyMove) {
      const syv = worldToScreenY(G.player.wy);
      const dx = pointer.x - G.player.x;
      const dy = -(pointer.y - syv);
      const d = hypot(dx, dy);
      if (d > 18) {
        mx = dx / d;
        my = dy / d;
      }
    }
    const moving = mx !== 0 || my !== 0;
    if (moving) {
      const len = hypot(mx, my);
      mx /= len;
      my /= len;
    }
    updateAim(dt, mx, my, moving);
    const spd = plySpd();
    if (moving) {
      tryMove(G.player, mx * spd * dt, my * spd * dt, plyRad());
      if (G.tank) {
        G.rumble = Math.max(G.rumble, 0.12);
        if (((G.t * 6) | 0) !== (((G.t - dt) * 6) | 0)) audio.rumble();
      }
    }
    G.player.x = clamp(G.player.x, 18, VW - 18);
    G.player.wy = Math.max(G.cam + 56, G.player.wy);
    followCam();

    if (G.fireHold) fire();
    if (G.nadeHold) throwNade();

    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const pk = G.pickups[i];
      if (hypot(pk.x - G.player.x, pk.wy - G.player.wy) < plyRad() + pk.r) {
        if (pk.type === 'ptank') {
          if (!G.tank) mountTank();
          else {
            G.tank.hp = G.tank.max;
            toast('补甲', false, true);
            audio.pickup();
            syncHud();
          }
        } else {
          G.nades = Math.min(NADE_MAX, G.nades + 3);
          toast('手雷 +3', false, true);
          audio.pickup();
          syncHud();
        }
        popSpark(pk.x, pk.wy, GOLD, 16);
        G.pickups.splice(i, 1);
      }
    }
  }

  function updateEnts(dt) {
    const p = G.player;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.hp <= 0) {
        G.ents.splice(i, 1);
        continue;
      }
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      const syv = worldToScreenY(e.wy);
      if (syv > VH + 90 && e.type !== 'boss') {
        G.ents.splice(i, 1);
        continue;
      }
      const aim = aimAtPlayer(e);
      e.ax = aim.ax;
      e.ay = aim.ay;

      if (e.type === 'grunt') {
        const spd = (isAssault() ? 78 : 62) + G.stage * 4;
        if (aim.d > 70) {
          tryMove(e, e.ax * spd * dt, e.ay * spd * dt, e.r);
        }
        e.fireCd -= dt;
        if (e.fireCd <= 0 && aim.d < 320 && G.mode === 'play') {
          e.fireCd = isAssault() ? 1.05 : 1.35;
          enemyFire(e, e.ax, e.ay, 210, 3, 1);
        }
      } else if (e.type === 'bunker') {
        e.fireCd -= dt;
        if (e.fireCd <= 0 && aim.d < 380 && G.mode === 'play') {
          e.fireCd = isAssault() ? 0.85 : 1.05;
          enemyFire(e, e.ax, e.ay, 250, 3.4, 1);
        }
      } else if (e.type === 'etank') {
        const spd = isAssault() ? 48 : 40;
        if (aim.d > 90) tryMove(e, e.ax * spd * dt, e.ay * spd * dt, e.r);
        e.fireCd -= dt;
        if (e.fireCd <= 0 && G.mode === 'play') {
          e.fireCd = 1.35;
          enemyFire(e, e.ax, e.ay, 280, 5, 1);
        }
      } else if (e.type === 'heli') {
        e.x += e.vx * dt;
        const pa = pathAt(e.wy);
        if (e.x < pa.l + 24 || e.x > pa.r - 24) e.vx *= -1;
        e.wy -= 18 * dt;
        e.fireCd -= dt;
        if (e.fireCd <= 0 && G.mode === 'play') {
          e.fireCd = 0.72;
          enemyFire(e, 0, -1, 200, 3.5, 1);
          enemyFire(e, e.ax, e.ay, 190, 3, 1);
        }
      } else if (e.type === 'boss') {
        updateBoss(e, dt, aim);
      }

      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        const hitR = plyRad() + (e.r || 12) * 0.72;
        if (hypot(e.x - p.x, e.wy - p.wy) < hitR) {
          if (e.type === 'bunker' || e.type === 'boss' && e.kind === 'fort') continue;
          hurtPlayer(e.type === 'etank' ? '撞上坦克了' : e.type === 'heli' ? '直升机压下来了' : '撞上了');
        }
      }
    }
  }

  function updateBoss(e, dt, aim) {
    e.fireCd -= dt;
    if (e.kind === 'tank') {
      const spd = 36;
      if (aim.d > 110) tryMove(e, e.ax * spd * dt, e.ay * spd * dt, e.r);
      e.x += Math.sin(e.t * 1.2) * 18 * dt;
      if (e.fireCd <= 0 && G.mode === 'play') {
        e.fireCd = 0.72;
        const base = Math.atan2(e.ay, e.ax);
        for (let k = -1; k <= 1; k++) {
          const a = base + k * 0.28;
          enemyFire(e, Math.cos(a), Math.sin(a), 260, 5, 1);
        }
      }
    } else if (e.kind === 'heli') {
      e.x = pathAt(e.wy).cx + Math.sin(e.t * 1.4) * 110;
      e.wy += Math.sin(e.t * 0.7) * 22 * dt;
      if (e.fireCd <= 0 && G.mode === 'play') {
        e.fireCd = 0.55;
        enemyFire(e, 0, -1, 220, 4, 1);
        enemyFire(e, 0.4, -1, 200, 3.4, 1);
        enemyFire(e, -0.4, -1, 200, 3.4, 1);
        if ((e.t * 2 | 0) % 2 === 0) enemyFire(e, e.ax, e.ay, 240, 4, 1);
      }
    } else {
      const pth = pathAt(e.wy);
      e.x = pth.cx;
      if (e.fireCd <= 0 && G.mode === 'play') {
        e.fireCd = 0.48;
        const base = Math.atan2(e.ay, e.ax);
        for (let k = -2; k <= 2; k++) {
          const a = base + k * 0.22;
          enemyFire(e, Math.cos(a), Math.sin(a), 230, 3.6, 1);
        }
        if (hash2((e.t * 10) | 0) < 0.35 && G.ents.length < 36) {
          spawnGrunt(e.x + rand(-50, 50), e.wy - 30);
        }
      }
    }
  }

  function updateShots(arr, dt, enemy) {
    for (let i = arr.length - 1; i >= 0; i--) {
      const s = arr[i];
      s.x += s.vx * dt;
      s.wy += s.vy * dt;
      s.life -= dt;
      const syv = worldToScreenY(s.wy);
      if (s.life <= 0 || s.x < -20 || s.x > VW + 20 || syv < -30 || syv > VH + 30) {
        arr.splice(i, 1);
        continue;
      }
      if (terrainBlocked(s.x, s.wy, s.r)) {
        emit(4, {
          x: s.x, wy: s.wy, j: 2,
          vx0: -40, vx1: 40, vy0: -20, vy1: 50,
          life: 0.12, r0: 1, r1: 2, rgb: MUD
        });
        arr.splice(i, 1);
        continue;
      }
      if (enemy) {
        if (G.mode === 'play' && G.deadT <= 0) {
          if (hypot(s.x - G.player.x, s.wy - G.player.wy) < plyRad() + s.r) {
            arr.splice(i, 1);
            hurtPlayer('被击中了');
            continue;
          }
        }
      } else {
        let hit = false;
        for (let j = 0; j < G.ents.length; j++) {
          const e = G.ents[j];
          if (e.hp <= 0) continue;
          let ok = false;
          if (e.w) ok = circleRect(s.x, s.wy, s.r, e.x - e.w * 0.5, e.wy - e.h * 0.5, e.w, e.h);
          else ok = hypot(s.x - e.x, s.wy - e.wy) < e.r + s.r;
          if (ok) {
            hurtEnt(e, s.dmg || 1, false);
            arr.splice(i, 1);
            hit = true;
            break;
          }
        }
        if (hit) continue;
      }
    }
  }

  function updateNades(dt) {
    for (let i = G.nadeShots.length - 1; i >= 0; i--) {
      const n = G.nadeShots[i];
      n.x += n.vx * dt;
      n.wy += n.vy * dt;
      n.t += dt;
      n.vx *= 0.985;
      n.vy *= 0.985;
      let boom = n.t >= n.fuse;
      if (!boom) {
        for (let j = 0; j < G.ents.length; j++) {
          const e = G.ents[j];
          if (e.hp <= 0) continue;
          const rad = (e.r || 12) + 8;
          if (hypot(n.x - e.x, n.wy - e.wy) < rad) { boom = true; break; }
        }
      }
      if (boom) {
        explode(n.x, n.wy, 1.55, 5);
        G.nadeShots.splice(i, 1);
      }
    }
  }

  function tickFx(dt) {
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.rumble > 0) G.rumble -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.nadeCd > 0) G.nadeCd -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.9);
    if (G.stop > 0) return;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.wy += p.vy * dt;
      p.vy -= (p.g || 0) * dt;
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
      f.wy += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    tickFx(dt);
    if (hidden) return;
    if (G.mode === 'play') G.clock += dt;

    maybeSpawn();
    if (G.mode === 'play' && !G.boss && !G.bossDown && G.player.wy >= G.nextBoss - 40) {
      spawnBoss();
    }

    updatePlayer(dt);
    updateEnts(dt);
    updateShots(G.shots, dt, false);
    updateShots(G.eShots, dt, true);
    updateNades(dt);

    if (G.stageClearT > 0) {
      G.stageClearT -= dt;
      if (G.stageClearT <= 0 && G.mode === 'play') nextStage();
    }

    for (let i = G.pickups.length - 1; i >= 0; i--) {
      G.pickups[i].t += dt;
      if (worldToScreenY(G.pickups[i].wy) > VH + 80) G.pickups.splice(i, 1);
    }
    for (let i = G.rocks.length - 1; i >= 0; i--) {
      if (worldToScreenY(G.rocks[i].wy) > VH + 90) G.rocks.splice(i, 1);
    }
    for (let i = G.waters.length - 1; i >= 0; i--) {
      if (worldToScreenY(G.waters[i].wy) > VH + 120) G.waters.splice(i, 1);
    }
  }

  function drawTree(x, y, s, shade) {
    ctx.fillStyle = rgba([8, 28, 12], 0.9);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(y + s * 0.2), s * 0.55 * scale, s * 0.22 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([18 + shade, 72 + shade, 28], 1);
    ctx.beginPath();
    ctx.arc(sx(x), sy(y - s * 0.15), s * 0.72 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([40, 140, 58], 0.55);
    ctx.beginPath();
    ctx.arc(sx(x - s * 0.18), sy(y - s * 0.28), s * 0.32 * scale, 0, TAU);
    ctx.fill();
  }

  function drawJungle() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#07140a');
    g.addColorStop(0.5, '#0a1a0c');
    g.addColorStop(1, '#08140a');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.beginPath();
    ctx.moveTo(sx(0), sy(VH));
    for (let y = VH; y >= -16; y -= 8) {
      const wy = screenToWorldY(y);
      const p = pathAt(wy);
      ctx.lineTo(sx(p.l), sy(y));
    }
    ctx.lineTo(sx(0), sy(0));
    ctx.closePath();
    ctx.fillStyle = '#062010';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(sx(VW), sy(VH));
    for (let y = VH; y >= -16; y -= 8) {
      const wy = screenToWorldY(y);
      const p = pathAt(wy);
      ctx.lineTo(sx(p.r), sy(y));
    }
    ctx.lineTo(sx(VW), sy(0));
    ctx.closePath();
    ctx.fillStyle = '#062010';
    ctx.fill();

    ctx.beginPath();
    const p0 = pathAt(screenToWorldY(VH));
    ctx.moveTo(sx(p0.l), sy(VH));
    for (let y = VH; y >= -16; y -= 10) {
      ctx.lineTo(sx(pathAt(screenToWorldY(y)).l), sy(y));
    }
    for (let y = -16; y <= VH; y += 10) {
      ctx.lineTo(sx(pathAt(screenToWorldY(y)).r), sy(y));
    }
    ctx.closePath();
    const dirt = ctx.createLinearGradient(sx(VW * 0.3), sy(0), sx(VW * 0.7), sy(0));
    dirt.addColorStop(0, '#1c3014');
    dirt.addColorStop(0.5, '#2a3a18');
    dirt.addColorStop(1, '#1c3014');
    ctx.fillStyle = dirt;
    ctx.fill();

    ctx.strokeStyle = 'rgba(61,255,122,0.18)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    for (let y = VH; y >= -16; y -= 10) {
      const p = pathAt(screenToWorldY(y));
      if (y === VH) ctx.moveTo(sx(p.l), sy(y));
      else ctx.lineTo(sx(p.l), sy(y));
    }
    ctx.stroke();
    ctx.beginPath();
    for (let y = VH; y >= -16; y -= 10) {
      const p = pathAt(screenToWorldY(y));
      if (y === VH) ctx.moveTo(sx(p.r), sy(y));
      else ctx.lineTo(sx(p.r), sy(y));
    }
    ctx.stroke();

    for (let i = 0; i < G.waters.length; i++) {
      const w = G.waters[i];
      const y0 = worldToScreenY(w.wy + w.h);
      const y1 = worldToScreenY(w.wy);
      const p = pathAt(w.wy);
      ctx.fillStyle = 'rgba(20,90,110,0.45)';
      ctx.fillRect(sx(p.l), sy(y0), (p.r - p.l) * scale, (y1 - y0) * scale);
      ctx.strokeStyle = 'rgba(0,240,255,0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(p.l + 8), sy((y0 + y1) * 0.5 + Math.sin(G.t * 3) * 2));
      ctx.lineTo(sx(p.r - 8), sy((y0 + y1) * 0.5 + Math.sin(G.t * 3 + 1) * 2));
      ctx.stroke();
    }

    const y0 = G.cam - 40;
    const y1 = G.cam + VH + 40;
    for (let row = (y0 / 28) | 0; row <= (y1 / 28) | 0; row++) {
      const wy = row * 28;
      const p = pathAt(wy);
      const hL = hash2(row * 13 + 3);
      const hR = hash2(row * 17 + 9);
      drawTree(p.l - 10 - hL * 18, worldToScreenY(wy), 16 + hL * 10, (hL * 20) | 0);
      drawTree(p.r + 10 + hR * 18, worldToScreenY(wy + 8), 15 + hR * 12, (hR * 18) | 0);
      if (hL > 0.72) drawTree(p.l + 8, worldToScreenY(wy + 12), 11, 8);
      if (hR > 0.78) drawTree(p.r - 8, worldToScreenY(wy - 6), 10, 12);
    }

    for (let i = 0; i < G.rocks.length; i++) {
      const r = G.rocks[i];
      const y = worldToScreenY(r.wy);
      ctx.fillStyle = '#3a4230';
      ctx.beginPath();
      ctx.ellipse(sx(r.x), sy(y), r.r * scale, r.r * 0.72 * scale, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(220,230,180,0.18)';
      ctx.beginPath();
      ctx.ellipse(sx(r.x - r.r * 0.2), sy(y - r.r * 0.15), r.r * 0.35 * scale, r.r * 0.2 * scale, 0, 0, TAU);
      ctx.fill();
    }
  }

  function drawSoldier(x, y, ax, ay, rgb, player) {
    const a = Math.atan2(-ay, ax);
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(a);
    const s = scale;
    ctx.fillStyle = rgba([20, 16, 10], 0.4);
    ctx.beginPath();
    ctx.ellipse(0, 4 * s, 7 * s, 3.2 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(rgb, 1);
    ctx.fillRect(-4.2 * s, -5 * s, 8.4 * s, 10 * s);
    ctx.fillStyle = rgba(player ? GOLD : HOT2, 1);
    ctx.beginPath();
    ctx.arc(0, -7.2 * s, 4.2 * s, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(4 * s, -1.6 * s, 13 * s, 2.4 * s);
    if (player && G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(18 * s, -0.4 * s, 5 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTankBody(x, y, ax, ay, rgb, rumble) {
    const a = Math.atan2(-ay, ax);
    const jx = rumble ? (Math.random() - 0.5) * 1.6 * scale : 0;
    const jy = rumble ? (Math.random() - 0.5) * 1.6 * scale : 0;
    ctx.save();
    ctx.translate(sx(x) + jx, sy(y) + jy);
    ctx.rotate(a);
    const s = scale;
    ctx.fillStyle = '#1a2414';
    ctx.fillRect(-13 * s, -11 * s, 26 * s, 4 * s);
    ctx.fillRect(-13 * s, 7 * s, 26 * s, 4 * s);
    ctx.fillStyle = rgba(rgb, 1);
    ctx.fillRect(-12 * s, -8 * s, 24 * s, 16 * s);
    ctx.fillStyle = rgba(GOLD, 0.7);
    ctx.fillRect(-6 * s, -3 * s, 8 * s, 6 * s);
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fillRect(4 * s, -2 * s, 18 * s, 3.2 * s);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.arc(24 * s, -0.4 * s, 6 * s, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBunker(e) {
    const y = worldToScreenY(e.wy);
    const s = scale;
    ctx.fillStyle = e.flash > 0 ? rgba(WHT, 0.9) : '#4a4030';
    ctx.fillRect(sx(e.x - e.w * 0.5), sy(y - e.h * 0.5), e.w * s, e.h * s);
    ctx.fillStyle = '#2a2418';
    ctx.fillRect(sx(e.x - e.w * 0.5), sy(y + e.h * 0.12), e.w * s, e.h * 0.28 * s);
    ctx.fillStyle = rgba(HOT, 0.85);
    const a = Math.atan2(-e.ay, e.ax);
    ctx.save();
    ctx.translate(sx(e.x), sy(y));
    ctx.rotate(a);
    ctx.fillRect(6 * s, -1.4 * s, 14 * s, 2.8 * s);
    ctx.restore();
    const t = clamp(e.hp / e.maxHp, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(sx(e.x - 12), sy(y - e.h * 0.5 - 6), 24 * s, 3 * s);
    ctx.fillStyle = rgba(t < 0.34 ? MAG : GOLD, 0.9);
    ctx.fillRect(sx(e.x - 12), sy(y - e.h * 0.5 - 6), 24 * t * s, 3 * s);
  }

  function drawHeli(e) {
    const y = worldToScreenY(e.wy);
    const s = scale;
    ctx.save();
    ctx.translate(sx(e.x), sy(y));
    ctx.fillStyle = e.flash > 0 ? rgba(WHT, 0.9) : rgba(e.rgb, 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, 14 * s, 7 * s, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.5);
    const rot = e.t * 22;
    ctx.strokeStyle = rgba(WHT, 0.75);
    ctx.lineWidth = 1.6 * s;
    ctx.beginPath();
    ctx.moveTo(Math.cos(rot) * 20 * s, Math.sin(rot) * 6 * s);
    ctx.lineTo(Math.cos(rot + Math.PI) * 20 * s, Math.sin(rot + Math.PI) * 6 * s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(Math.cos(rot + 1.2) * 18 * s, Math.sin(rot + 1.2) * 5 * s);
    ctx.lineTo(Math.cos(rot + 1.2 + Math.PI) * 18 * s, Math.sin(rot + 1.2 + Math.PI) * 5 * s);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnt(e) {
    const y = worldToScreenY(e.wy);
    if (y < -40 || y > VH + 40) return;
    if (e.type === 'bunker' || (e.type === 'boss' && e.kind === 'fort')) {
      drawBunker(e);
      if (e.type === 'boss') {
        ctx.strokeStyle = rgba(HOT, 0.85);
        ctx.lineWidth = 2 * scale;
        ctx.strokeRect(sx(e.x - e.w * 0.55), sy(y - e.h * 0.6), e.w * 1.1 * scale, e.h * 1.2 * scale);
      }
      return;
    }
    if (e.type === 'heli' || (e.type === 'boss' && e.kind === 'heli')) {
      drawHeli(e);
      if (e.type === 'boss') {
        ctx.strokeStyle = rgba(HOT, 0.7);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx(e.x), sy(y), 32 * scale, 0, TAU);
        ctx.stroke();
      }
      return;
    }
    if (e.type === 'etank' || (e.type === 'boss' && e.kind === 'tank')) {
      drawTankBody(e.x, y, e.ax, e.ay, e.flash > 0 ? WHT : e.rgb, false);
      if (e.type === 'boss') {
        ctx.strokeStyle = rgba(HOT, 0.8);
        ctx.lineWidth = 2;
        ctx.strokeRect(sx(e.x - 22), sy(y - 18), 44 * scale, 36 * scale);
      }
      return;
    }
    drawSoldier(e.x, y, e.ax, e.ay, e.flash > 0 ? WHT : e.rgb, false);
  }

  function drawPickups() {
    for (let i = 0; i < G.pickups.length; i++) {
      const pk = G.pickups[i];
      const y = worldToScreenY(pk.wy);
      const bob = Math.sin(G.t * 4 + pk.t) * 3;
      if (pk.type === 'ptank') {
        drawTankBody(pk.x, y + bob, 1, 0, LEAF, false);
        ctx.strokeStyle = rgba(GOLD, 0.5 + Math.sin(G.t * 6) * 0.25);
        ctx.lineWidth = 1.4 * scale;
        ctx.beginPath();
        ctx.arc(sx(pk.x), sy(y + bob), 18 * scale, 0, TAU);
        ctx.stroke();
      } else {
        ctx.fillStyle = rgba(GOLD, 0.95);
        ctx.beginPath();
        ctx.arc(sx(pk.x), sy(y + bob), 6 * scale, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3a2208';
        ctx.font = (9 * scale) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('G', sx(pk.x), sy(y + bob + 0.5));
      }
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const y = worldToScreenY(s.wy);
      ctx.fillStyle = rgba(s.rgb, 1);
      ctx.shadowColor = rgba(s.rgb, 0.8);
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(y), s.r * scale, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      if (!REDUCE) {
        ctx.strokeStyle = rgba(s.rgb, 0.35);
        ctx.lineWidth = 2 * scale;
        ctx.beginPath();
        ctx.moveTo(sx(s.x), sy(y));
        ctx.lineTo(sx(s.x - s.vx * 0.03), sy(worldToScreenY(s.wy - s.vy * 0.03)));
        ctx.stroke();
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const y = worldToScreenY(s.wy);
      ctx.fillStyle = rgba(s.rgb, 1);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(y), s.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < G.nadeShots.length; i++) {
      const n = G.nadeShots[i];
      const y = worldToScreenY(n.wy);
      const pulse = 1 + Math.sin(n.t * 18) * 0.12;
      ctx.fillStyle = rgba(GOLD, 1);
      ctx.beginPath();
      ctx.arc(sx(n.x), sy(y), 5.2 * pulse * scale, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT, 0.8);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(worldToScreenY(p.wy)), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t;
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(worldToScreenY(s.wy)), s.rad * s.t * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t);
      ctx.lineWidth = (2.4 - r.t) * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(worldToScreenY(r.wy)), (r.r + r.t * 28) * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawFloats() {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI", sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(worldToScreenY(f.wy)));
    }
  }

  function drawBossBar() {
    if (!G.boss || G.boss.hp <= 0) return;
    const x = 40;
    const y = 16;
    const w = VW - 80;
    const h = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(sx(x), sy(y), w * scale, h * scale);
    const t = clamp(G.boss.hp / G.boss.maxHp, 0, 1);
    ctx.fillStyle = rgba(t < 0.34 ? MAG : t < 0.62 ? GOLD : HOT, 0.95);
    ctx.shadowColor = rgba(HOT, 0.6);
    ctx.shadowBlur = 8;
    ctx.fillRect(sx(x), sy(y), w * t * scale, h * scale);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(sx(x), sy(y), w * scale, h * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.font = (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(G.boss.name || 'BOSS', sx(VW * 0.5), sy(y - 8));
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.42);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function drawPlayer() {
    if (G.mode === 'lose' && G.lives <= 0 && G.deadT <= 0) return;
    if (G.deadT > 0) return;
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink) return;
    const y = worldToScreenY(G.player.wy);
    if (G.tank) {
      drawTankBody(G.player.x, y, G.player.ax, G.player.ay, LEAF, G.rumble > 0 && !REDUCE);
    } else {
      drawSoldier(G.player.x, y, G.player.ax, G.player.ay, CYN, true);
    }
    ctx.strokeStyle = rgba(GOLD, 0.35);
    ctx.lineWidth = 1.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(G.player.x + G.player.ax * 10), sy(worldToScreenY(G.player.wy + G.player.ay * 10)));
    ctx.lineTo(sx(G.player.x + G.player.ax * 26), sy(worldToScreenY(G.player.wy + G.player.ay * 26)));
    ctx.stroke();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#030804';
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
    drawJungle();
    drawPickups();
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'bunker' || (G.ents[i].type === 'boss' && G.ents[i].kind === 'fort')) {
        drawEnt(G.ents[i]);
      }
    }
    drawShots();
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type !== 'bunker' && !(G.ents[i].type === 'boss' && G.ents[i].kind === 'fort')) {
        drawEnt(G.ents[i]);
      }
    }
    drawPlayer();
    drawParticles();
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

  function startGame(kind) {
    G.kind = kind === 'assault' ? 'assault' : 'jungle';
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.stage = 1;
    G.cam = 0;
    G.maxCam = 0;
    G.spawnedY = 80;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nades = isAssault() ? 3 : 4;
    G.player.x = VW * 0.5;
    G.player.wy = 90;
    G.player.ax = 0;
    G.player.ay = 1;
    G.tank = null;
    G.fireCd = 0;
    G.nadeCd = 0;
    G.fireHold = false;
    G.nadeHold = false;
    G.deadT = 0;
    G.invuln = 1.15;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.rumble = 0;
    G.nextLife = LIFE_EVERY;
    G.stageClearT = 0;
    G.bossDown = false;
    G.nextBoss = isAssault() ? 2000 : STAGES[0].len;
    G.why = '';
    if (scoreEl) scoreEl.textContent = '0';
    clearField(false);
    hideOverlay();
    syncHud();
    audio.start();
    toast(isAssault() ? '强攻 · 更密更快' : '丛林 · 密林', false, !isAssault());
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'jungle';
    G.stage = 1;
    G.lives = LIVES;
    G.nades = 4;
    G.combo = 0;
    G.mult = 1;
    G.deadT = 0;
    G.tank = null;
    G.cam = 0;
    G.maxCam = 0;
    G.spawnedY = 80;
    G.player.x = VW * 0.5;
    G.player.wy = 90;
    G.player.ax = 0;
    G.player.ay = 1;
    G.invuln = 99;
    G.nextBoss = 99999;
    G.boss = null;
    G.bossDown = false;
    clearField(false);
    showOverlay('title', '怒火', '密林里八向冲、旋转瞄准开火。跳进坦克扛打，炸掉碉堡，打穿要塞。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('jungle');
    else startGame(G.kind || 'jungle');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('jungle');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isMove = k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown'
      || k === 'a' || k === 'A' || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S';
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const nade = k === 'g' || k === 'G' || k === 'Shift'
      || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'f' || k === 'F';

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
    if (k === 'q' || k === 'Q') G.aimQ = down ? 1 : 0;
    if (k === 'e' || k === 'E') {
      G.aimE = down ? 1 : 0;
    }

    if (down && (isMove || space || nade || k === 'Enter')) e.preventDefault();

    if (!down) {
      if (space) G.fireHold = false;
      if (nade) G.nadeHold = false;
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
    if (nade && !space) {
      if (overlayOpen()) return;
      if (G.mode === 'play') {
        G.nadeHold = true;
        throwNade();
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

  function bindPad() {
    function hold(el, on, off) {
      if (!el) return;
      const down = function (e) {
        e.preventDefault();
        audio.ensure();
        el.classList.add('held');
        on();
      };
      const up = function (e) {
        e.preventDefault();
        el.classList.remove('held');
        off();
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
    }
    hold(document.getElementById('btn-up'), function () { keys.u = true; inputSrc = 'key'; }, function () { keys.u = false; });
    hold(document.getElementById('btn-down'), function () { keys.d = true; inputSrc = 'key'; }, function () { keys.d = false; });
    hold(document.getElementById('btn-left'), function () { keys.l = true; inputSrc = 'key'; }, function () { keys.l = false; });
    hold(document.getElementById('btn-right'), function () { keys.r = true; inputSrc = 'key'; }, function () { keys.r = false; });
    hold(document.getElementById('btn-fire'), function () {
      G.fireHold = true;
      if (G.mode === 'play') fire();
    }, function () { G.fireHold = false; });
    hold(document.getElementById('btn-nade'), function () {
      G.nadeHold = true;
      throwNade();
    }, function () { G.nadeHold = false; });
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
      if (e.button === 2) {
        G.nadeHold = true;
        throwNade();
      } else {
        G.fireHold = true;
        if (G.mode === 'play') fire();
      }
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
      G.nadeHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) {
        G.fireHold = false;
        G.nadeHold = false;
      }
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

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();
  bindPad();

  if (btnJungle) {
    btnJungle.addEventListener('click', function () {
      audio.ensure();
      startGame('jungle');
    });
  }
  if (btnAssault) {
    btnAssault.addEventListener('click', function () {
      audio.ensure();
      startGame('assault');
    });
  }
  if (ovAgain) {
    ovAgain.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind);
    });
  }
  if (ovMenu) {
    ovMenu.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win') startGame('assault');
      else goTitle();
    });
  }
  if (modeJungle) {
    modeJungle.addEventListener('click', function () {
      audio.ensure();
      startGame('jungle');
    });
  }
  if (modeAssault) {
    modeAssault.addEventListener('click', function () {
      audio.ensure();
      startGame('assault');
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
      keys.u = false;
      keys.d = false;
      G.fireHold = false;
      G.nadeHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
