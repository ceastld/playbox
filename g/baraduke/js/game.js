'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const GROUND = 668;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.42;
  const INVULN = 1.52;
  const DIE_T = 0.88;
  const GRAVITY = 980;
  const JET = 1720;
  const WALK = 252;
  const AIR_X = 228;
  const MAX_FALL = 470;
  const MAX_RISE = 286;
  const SHOT_V = 640;
  const FIRE_CD = 0.108;
  const P_HW = 11;
  const P_HH = 14;
  const BEST_KEY = 'playbox-baraduke-best';
  const MUTE_KEY = 'playbox-baraduke-mute';
  const OPS = '←↑↓→ / WASD 走飞 · 空格开火 · R 重开 · M 静音';
  const LEAD = '机甲走飞地底，打爆舱救出异形。撞敌扣命。短层过后是蛸王。';

  const MAG = [255, 61, 184];
  const CYN = [0, 232, 255];
  const HOT = [30, 224, 255];
  const GOLD = [255, 227, 107];
  const WHT = [232, 251, 255];
  const PNK = [255, 154, 212];
  const ORG = [255, 140, 64];
  const MINT = [92, 255, 208];
  const ROCK = [12, 48, 56];
  const TEAL = [20, 140, 156];

  const FLOORS = [
    { name: '浅层', dist: 920, gap: 124, mix: ['octy', 'crawl'] },
    { name: '中脉', dist: 1080, gap: 108, mix: ['octy', 'bat', 'crawl'] },
    { name: '深井', dist: 1220, gap: 96, mix: ['octy', 'bat', 'blob', 'crawl'] }
  ];

  const KIND_SCORE = { octy: 100, bat: 80, crawl: 60, blob: 110 };
  const KIND_R = { octy: 14, bat: 9, crawl: 10, blob: 11 };
  const KIND_RGB = { octy: MAG, bat: PNK, crawl: GOLD, blob: MINT };
  const KIND_WHY = { octy: '被蛸咬了', bat: '撞上蝠', crawl: '撞上爬虫', blob: '沾上黏滴' };

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

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
  function comboMul(n) {
    return 1 + Math.min(4, Math.max(0, Math.floor(((n | 0) - 1) / 3)));
  }
  function hit(ax, ay, ar, bx, by, br) {
    const dx = ax - bx;
    const dy = ay - by;
    const r = ar + br;
    return dx * dx + dy * dy <= r * r;
  }
  function hash2(ix, iy) {
    let n = (ix * 374761393 + iy * 668265263) ^ 0x27d4eb2d;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function capHp(dense) {
    return dense ? 2 : 1;
  }
  function scrollBase(dense) {
    return dense ? 108 : 76;
  }
  function bossHp(dense) {
    return dense ? 108 : 76;
  }
  function kindScore(kind) {
    return KIND_SCORE[kind] || 80;
  }

  function wallAt(y, scroll, dense) {
    const wy = scroll + (VH - y);
    const extra = dense ? 16 : 0;
    const L = 24 + extra + 15 * Math.sin(wy * 0.011) + 9 * Math.sin(wy * 0.027 + 1.1);
    const R = 24 + extra + 15 * Math.sin(wy * 0.013 + 2.1) + 9 * Math.sin(wy * 0.023 + 0.4);
    return { l: clamp(L, 18, 86), r: VW - clamp(R, 18, 86) };
  }

  function selfCheck() {
    if (comboMul(1) !== 1) throw new Error('combo 1');
    if (comboMul(3) !== 1) throw new Error('combo 3');
    if (comboMul(4) !== 2) throw new Error('combo 4');
    if (comboMul(13) !== 5) throw new Error('combo cap');
    if (FLOORS.length !== 3) throw new Error('3 floors');
    if (FLOORS[0].name !== '浅层' || FLOORS[2].name !== '深井') throw new Error('floor names');
    if (capHp(false) !== 1 || capHp(true) !== 2) throw new Error('cap hp');
    if (bossHp(false) !== 76 || bossHp(true) !== 108) throw new Error('boss hp');
    if (!hit(0, 0, 5, 6, 0, 2) || hit(0, 0, 4, 20, 0, 4)) throw new Error('hit');
    const w = wallAt(360, 0, false);
    if (w.l < 8 || w.r > VW - 8 || w.l >= w.r - 80) throw new Error('walls');
    if (kindScore('octy') !== 100) throw new Error('octy score');
    return true;
  }

  if (!hasDom) {
    selfCheck();
    return;
  }

  selfCheck();

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
  const btnSave = document.getElementById('btn-save');
  const btnDen = document.getElementById('btn-den');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const cargoEl = document.getElementById('cargo');
  const cargoBox = document.getElementById('cargo-box');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const saveLabel = document.getElementById('save-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');

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
  let acc = 0;
  let lastT = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: 520, id: null };
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const motes = [];

  const G = {
    mode: 'title',
    kind: 'save',
    t: 0,
    clock: 0,
    floor: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    paccets: 0,
    saved: 0,
    floorSaved: 0,
    floorCaps: 0,
    shield: false,
    scroll: 0,
    spawnAt: 0,
    fireCd: 0,
    fireHold: false,
    dead: false,
    deadT: 0,
    inv: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    muzzle: 0,
    punch: 1,
    clearT: 0,
    why: '',
    dense: false,
    p: null,
    plats: [],
    caps: [],
    aliens: [],
    enemies: [],
    shots: [],
    eShots: [],
    spikes: [],
    boss: null
  };

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
    shoot() {
      this.ensure();
      this.beep(680, 0.046, 'square', 0.03, 1480);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.55, combo * 0.032);
      this.noise(0.03, 0.028, 1200);
      this.beep(520 * lift, 0.058, 'square', 0.04, 880 * lift);
    },
    crack() {
      this.ensure();
      this.noise(0.06, 0.04, 700);
      this.beep(420, 0.08, 'triangle', 0.04, 880);
    },
    rescue() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1175);
    },
    shield() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.045, 523);
      this.beep(659, 0.12, 'triangle', 0.042, 880);
      this.beep(1046, 0.2, 'sine', 0.04, 1568);
    },
    explode(big) {
      this.ensure();
      this.noise(big ? 0.16 : 0.08, big ? 0.068 : 0.042, big ? 240 : 460);
      this.beep(big ? 150 : 250, big ? 0.24 : 0.12, 'sawtooth', 0.05, 50);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.036, 660 * m);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.055, 320);
      this.beep(280, 0.2, 'sawtooth', 0.05, 70);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04, 880);
      this.beep(880, 0.12, 'triangle', 0.045, 1320);
    },
    wave() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(659, 0.16, 'triangle', 0.042, 1046);
    },
    boss() {
      this.ensure();
      this.beep(110, 0.2, 'sawtooth', 0.05, 70);
      this.beep(164, 0.28, 'square', 0.036, 82);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.034, 1175);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(784, 0.14, 'triangle', 0.042, 1046);
      this.beep(1046, 0.22, 'sine', 0.05, 1318);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.2, 'sawtooth', 0.045, 80);
      this.beep(130, 0.3, 'sine', 0.05, 46);
    },
    jet() {
      this.ensure();
      this.noise(0.05, 0.016, 400);
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
    if (G.score > G.best) {
      G.best = G.score;
      try { localStorage.setItem(BEST_KEY, String(G.best)); } catch (err) { /* ignore */ }
      if (bestEl) bestEl.textContent = String(G.best);
    }
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function playing() {
    return G.mode === 'play';
  }

  function isDense() {
    return G.kind === 'den';
  }

  function floorDef() {
    return FLOORS[clamp(G.floor, 0, FLOORS.length - 1)];
  }

  function scrollSpd() {
    if (G.boss) return 10;
    const base = scrollBase(G.dense);
    const rush = G.combo >= 8 ? 10 : G.combo >= 4 ? 5 : 0;
    return base + rush + G.floor * 6;
  }

  function capArr(arr, n) {
    if (arr.length > n) arr.splice(0, arr.length - n);
  }

  function kick(cls) {
    if (!stageEl || REDUCE) return;
    kickTok += 1;
    stageEl.classList.remove('die', 'hit', 'cap');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) stageEl.classList.remove('die', 'hit', 'cap');
    }, 380);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function shake(n) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, n);
  }

  function flash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.28);
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    if (REDUCE) n = Math.min(n, 8);
    if (particles.length > 220) n = Math.min(n, 6);
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        t: spec.life,
        life: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 420 : spec.g
      });
    }
    capArr(particles, 280);
  }

  function spawnRing(x, y, rgb, rad) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(rings, 24);
    capArr(sparks, 36);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: gold ? 0.92 : 0.68, life: gold ? 0.92 : 0.68,
      size: gold ? 18 : 14, gold: !!gold
    });
    capArr(floats, 28);
  }

  function toast(msg, kind) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden', 'warn', 'gold');
    if (kind) toastEl.classList.add(kind);
    toastTok = 1.18;
  }

  function setHint(s, kind) {
    if (!hintEl) return;
    hintEl.textContent = s;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function showOverlay(kind) {
    if (!overlay || !panel) return;
    overlay.classList.remove('hidden');
    overlay.classList.toggle('end', kind !== 'title');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    if (ovStart) ovStart.classList.toggle('gone', kind !== 'title');
    if (ovEnd) ovEnd.classList.toggle('gone', kind === 'title');
    if (kind === 'title') {
      if (ovKicker) ovKicker.textContent = 'BARA';
      if (ovTitle) ovTitle.textContent = '巴拉';
      if (ovLead) ovLead.textContent = LEAD;
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = G.kind === 'den' ? '密穴凿穿' : '穴脉打通';
      if (ovLead) ovLead.textContent = '救出 ' + G.saved + ' 只 · 分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '撞毁了';
      if (ovLead) ovLead.textContent = (floorDef().name) + ' · 救出 ' + G.saved + ' · 分数 ' + G.score;
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
    }
  }

  function addScore(n, x, y, rgb, gold) {
    const v = n | 0;
    if (v <= 0 || G.mode === 'title') return;
    G.score += v;
    saveBest();
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (scoreBox) {
      scoreBox.classList.remove('flash');
      void scoreBox.offsetWidth;
      scoreBox.classList.add('flash');
    }
    if (scoreAdd) {
      scoreAdd.hidden = false;
      scoreAdd.textContent = '+' + v;
      addTok = 0.7;
    }
    if (x != null) floatText(x, y - 10, '+' + v, rgb || GOLD, gold);
    while (G.score >= G.next1up) {
      G.next1up += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        toast('1UP', 'gold');
        audio.oneup();
        syncHud();
      }
    }
  }

  function bumpCombo() {
    const prev = comboMul(G.combo);
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = comboMul(G.combo);
    if (comboEl) {
      comboEl.hidden = G.combo < 2;
      comboEl.textContent = '连击 ×' + G.mult;
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      if (G.combo > 1) comboEl.classList.add('hot');
    }
    if (G.mult > prev) {
      audio.combo(G.mult);
      comboTok = 0.28;
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (cargoEl) cargoEl.textContent = G.paccets + '/8';
    if (cargoBox) cargoBox.classList.toggle('full', G.shield || G.paccets >= 8);
    if (saveLabel) saveLabel.textContent = '救 ' + G.saved;
    if (stageLabel) {
      const name = G.boss ? '蛸王' : (G.mode === 'title' ? '地底' : floorDef().name);
      stageLabel.textContent = name;
      stageLabel.classList.toggle('hot', !!G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = G.boss ? '蛸王' : (G.shield ? '护盾' : (G.kind === 'den' ? '密穴' : '救舱'));
      tagLabel.classList.toggle('warn', !!G.boss);
      tagLabel.classList.toggle('hot', G.shield);
    }
    if (comboEl) {
      comboEl.hidden = G.combo < 2;
      if (G.combo >= 2) comboEl.textContent = '连击 ×' + comboMul(G.combo);
    }
    if (pipsEl) {
      const n = Math.max(LIVES, G.lives);
      let html = '';
      for (let i = 0; i < n; i++) html += '<i class="pip' + (i < G.lives ? ' on' : ' gone') + '"></i>';
      pipsEl.innerHTML = html;
    }
  }

  function makePlayer(x, y) {
    return {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      face: 1,
      grounded: true,
      walk: 0,
      jetT: 0,
      flash: 0
    };
  }

  function resetLists() {
    G.plats.length = 0;
    G.caps.length = 0;
    G.aliens.length = 0;
    G.enemies.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.spikes.length = 0;
    G.boss = null;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
  }

  function makeEnemy(kind, x, y) {
    const r = KIND_R[kind] || 11;
    return {
      kind: kind,
      x: x,
      y: y,
      vx: kind === 'crawl' ? (Math.random() < 0.5 ? 56 : -56) : rand(-70, 70),
      vy: kind === 'blob' ? 40 : 0,
      r: r,
      hp: 1,
      t: rand(0, TAU),
      spit: rand(0.4, 1.2),
      alive: true,
      flash: 0
    };
  }

  function seedFloor() {
    G.plats.push({ x: 176, y: 528, w: 128, h: 13 });
    G.caps.push({ x: 240, y: 504, hp: capHp(G.dense), t: 0, cracked: false });
    G.floorCaps += 1;
    G.enemies.push(makeEnemy('octy', 318, 210));
    if (G.dense) G.enemies.push(makeEnemy('bat', 150, 160));
    G.spawnAt = 220;
  }

  function spawnRow(y) {
    const walls = wallAt(y, G.scroll, G.dense);
    const innerL = walls.l + 36;
    const innerR = walls.r - 36;
    if (innerR - innerL < 90) return;
    const def = floorDef();
    const h = hash2((G.scroll / 17) | 0, G.floor + 3);
    const h2 = hash2(G.floor * 9 + ((G.spawnAt / 11) | 0), 41);
    const nPlat = (G.dense || h > 0.42) ? 2 : 1;
    const placed = [];
    for (let i = 0; i < nPlat; i++) {
      const w = rand(72, G.dense ? 108 : 128);
      let x = lerp(innerL, innerR - w, (h2 + i * 0.37) % 1);
      if (i === 1 && placed[0] && Math.abs(x - placed[0].x) < 70) x = clamp(placed[0].x + (x > placed[0].x ? 90 : -90), innerL, innerR - w);
      const plat = { x: x, y: y, w: w, h: 13 };
      G.plats.push(plat);
      placed.push(plat);
    }
    if (placed.length && (h2 > 0.38 || G.floorCaps < 2)) {
      const p = placed[h > 0.5 ? 0 : placed.length - 1];
      G.caps.push({ x: p.x + p.w * 0.5, y: p.y - 22, hp: capHp(G.dense), t: rand(0, TAU), cracked: false });
      G.floorCaps += 1;
    }
    const mix = def.mix;
    const nEn = (G.dense ? 2 : 1) + (h > 0.72 ? 1 : 0);
    for (let i = 0; i < nEn; i++) {
      const kind = mix[(Math.floor(h2 * 17) + i) % mix.length];
      const x = lerp(innerL + 16, innerR - 16, hash2(i + 2, (G.spawnAt | 0) + i));
      const ey = y - rand(18, kind === 'bat' ? 70 : 36);
      if (kind === 'crawl' && placed[0]) {
        G.enemies.push(makeEnemy('crawl', placed[0].x + placed[0].w * 0.4, placed[0].y - 12));
      } else {
        G.enemies.push(makeEnemy(kind, x, ey));
      }
    }
    if (h > 0.55) {
      const side = h2 > 0.5 ? -1 : 1;
      const sx = side < 0 ? walls.l + 8 : walls.r - 8;
      G.spikes.push({ x: sx, y: y + 8, side: side, r: 9 });
    }
  }

  function fillAhead() {
    const def = floorDef();
    const gap = (G.dense ? def.gap * 0.86 : def.gap);
    while (G.spawnAt < G.scroll + VH + 90 && G.spawnAt < def.dist + 40) {
      const y = Math.min(-52, -(G.spawnAt - G.scroll - 40));
      spawnRow(y);
      G.spawnAt += gap;
    }
  }

  function startDemo() {
    G.mode = 'title';
    G.kind = 'save';
    G.dense = false;
    G.floor = 0;
    G.scroll = 0;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.paccets = 0;
    G.saved = 0;
    G.floorSaved = 0;
    G.floorCaps = 0;
    G.shield = false;
    G.lives = LIVES;
    G.dead = false;
    G.inv = 99;
    G.clearT = 0;
    G.p = makePlayer(VW * 0.5, GROUND - P_HH);
    resetLists();
    seedFloor();
    fillAhead();
    showOverlay('title');
    setHint('走飞机甲 · 打舱救人 · 撞敌扣命 · 短层后蛸王', '');
    syncHud();
  }

  function startRun(kind) {
    G.mode = 'play';
    G.kind = kind === 'den' ? 'den' : 'save';
    G.dense = isDense();
    G.floor = 0;
    G.scroll = 0;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.paccets = 0;
    G.saved = 0;
    G.floorSaved = 0;
    G.floorCaps = 0;
    G.shield = false;
    G.lives = LIVES;
    G.next1up = LIFE_EVERY;
    G.dead = false;
    G.deadT = 0;
    G.inv = 1.1;
    G.stop = 0;
    G.clearT = 0;
    G.why = '';
    G.fireCd = 0;
    G.p = makePlayer(VW * 0.5, GROUND - P_HH);
    resetLists();
    seedFloor();
    fillAhead();
    hideOverlay();
    audio.start();
    toast(G.dense ? '密穴' : '救舱', G.dense ? 'warn' : '');
    setHint(OPS, '');
    syncHud();
    if (scoreEl) scoreEl.textContent = '0';
  }

  function nextFloor() {
    const done = floorDef().name;
    addScore(800 * (G.floor + 1) * G.mult, G.p.x, G.p.y - 30, GOLD, true);
    if (G.floorSaved >= 4) addScore(1200 * G.mult, G.p.x + 20, G.p.y - 48, CYN, true);
    G.floor += 1;
    G.scroll = 0;
    G.spawnAt = 80;
    G.floorSaved = 0;
    G.floorCaps = 0;
    G.inv = Math.max(G.inv, 0.6);
    toast(done + '凿通', 'gold');
    audio.wave();
    seedFloor();
    fillAhead();
    syncHud();
  }

  function spawnBoss() {
    G.boss = {
      x: VW * 0.5,
      y: -40,
      vx: 70,
      hp: bossHp(G.dense),
      max: bossHp(G.dense),
      t: 0,
      spit: 0.8,
      flash: 0,
      alive: true,
      intro: 1.1
    };
    toast('蛸王', 'warn');
    audio.boss();
    syncHud();
    setHint('打金眼 · 护盾能挡一次', 'warn');
  }

  function activateShield() {
    G.shield = true;
    G.paccets = 8;
    spawnRing(G.p.x, G.p.y, GOLD, 22);
    flash(GOLD, 0.28);
    audio.shield();
    toast('护盾展开', 'gold');
    floatText(G.p.x, G.p.y - 28, '护盾', GOLD, true);
    addScore(800, G.p.x, G.p.y - 46, GOLD, true);
    kick('cap');
    syncHud();
  }

  function breakShield() {
    G.shield = false;
    G.paccets = 0;
    G.inv = 0.9;
    emit(22, {
      x: G.p.x, y: G.p.y, j: 16,
      vx0: -220, vx1: 220, vy0: -260, vy1: 80,
      life: 0.42, r0: 1.4, r1: 3.2, rgb: GOLD, g: 280
    });
    spawnRing(G.p.x, G.p.y, MAG, 20);
    flash(MAG, 0.32);
    hitStop(0.055);
    shake(5);
    audio.explode(false);
    toast('护盾碎了', 'warn');
    syncHud();
  }

  function wantXY() {
    let x = 0;
    let y = 0;
    if (keys.l) x -= 1;
    if (keys.r) x += 1;
    if (keys.u) y -= 1;
    if (keys.d) y += 1;
    if (pointer.down && pointer.hover && playing()) {
      const dx = pointer.x - G.p.x;
      const dy = pointer.y - G.p.y;
      if (Math.abs(dx) > 10) x = dx > 0 ? 1 : -1;
      if (dy < -18) y = -1;
      else if (dy > 28) y = 1;
    }
    return { x: x, y: y };
  }

  function fireShot() {
    if (G.dead || G.fireCd > 0) return;
    const max = G.shield ? 7 : 5;
    if (G.shots.length >= max) return;
    const p = G.p;
    const dual = G.shield;
    const mk = function (ox) {
      G.shots.push({ x: p.x + ox, y: p.y - 16, vy: -SHOT_V, r: dual ? 3.6 : 3.1, life: 0.9 });
    };
    if (dual) {
      mk(-7);
      mk(7);
    } else {
      mk(0);
    }
    G.fireCd = FIRE_CD;
    p.flash = 0.08;
    G.muzzle = 0.06;
    if (G.mode !== 'title') audio.shoot();
  }

  function enemySpit(en, aimed) {
    if (G.eShots.length > 18) return;
    const p = G.p;
    let vx = 0;
    let vy = 150;
    if (aimed && p) {
      const dx = p.x - en.x;
      const dy = p.y - en.y;
      const d = hypot(dx, dy) || 1;
      const sp = G.dense ? 168 : 142;
      vx = dx / d * sp;
      vy = dy / d * sp;
    }
    G.eShots.push({ x: en.x, y: en.y + 8, vx: vx, vy: vy, r: 4.2, life: 2.4 });
  }

  function landOn(p, plat) {
    p.y = plat.y - P_HH;
    p.vy = 0;
    p.grounded = true;
  }

  function platformUnder(px, py, prevFeet) {
    const feet = py + P_HH;
    for (let i = 0; i < G.plats.length; i++) {
      const plat = G.plats[i];
      if (px < plat.x - 2 || px > plat.x + plat.w + 2) continue;
      const top = plat.y;
      if (feet >= top - 1 && feet <= top + 18 && prevFeet <= top + 6 && (G.p.vy >= -20)) return plat;
    }
    return null;
  }

  function stillOnPlat(p) {
    if (!p.grounded) return null;
    for (let i = 0; i < G.plats.length; i++) {
      const plat = G.plats[i];
      if (p.x < plat.x - 2 || p.x > plat.x + plat.w + 2) continue;
      if (Math.abs((p.y + P_HH) - plat.y) < 8) return plat;
    }
    if (p.y + P_HH >= GROUND - 2) return { x: 0, y: GROUND, w: VW, h: 8, ground: true };
    return null;
  }

  function juiceHit(x, y, rgb, power) {
    const p = power || 1;
    emit(7 + (p * 8) | 0, {
      x: x, y: y, j: 5 + p * 4,
      vx0: -180 * p, vx1: 180 * p, vy0: -220 * p, vy1: 90 * p,
      life: 0.26 + p * 0.12, r0: 1, r1: 2.4 + p, rgb: rgb
    });
    spawnRing(x, y, rgb, 8 + p * 8);
    if (G.mode === 'play') {
      hitStop(0.032 + Math.min(0.048, p * 0.028));
      shake(2 + p * 2.2);
      G.punch = Math.max(G.punch, 1 + Math.min(0.04, p * 0.018));
      kick(p >= 1.6 ? 'die' : 'hit');
    }
  }

  function killEnemy(en) {
    if (!en.alive) return;
    en.alive = false;
    bumpCombo();
    const sc = kindScore(en.kind) * G.mult;
    addScore(sc, en.x, en.y, KIND_RGB[en.kind] || HOT);
    juiceHit(en.x, en.y, KIND_RGB[en.kind] || MAG, 1);
    audio.hit(G.combo);
    floatText(en.x, en.y - 8, '×' + G.mult, GOLD, G.mult >= 3);
  }

  function crackCap(c) {
    c.hp -= 1;
    c.flash = 0.12;
    bumpCombo();
    audio.crack();
    juiceHit(c.x, c.y, CYN, 0.8);
    addScore(150 * G.mult, c.x, c.y, CYN);
    if (c.hp <= 0) {
      c.cracked = true;
      G.aliens.push({
        x: c.x, y: c.y, vx: rand(-40, 40), vy: -80,
        t: 0, r: 7, born: 0
      });
      emit(14, {
        x: c.x, y: c.y, j: 8,
        vx0: -140, vx1: 140, vy0: -180, vy1: 40,
        life: 0.34, r0: 1.2, r1: 2.8, rgb: GOLD, g: 260
      });
      spawnRing(c.x, c.y, GOLD, 16);
      kick('cap');
      flash(GOLD, 0.18);
    }
  }

  function collectAlien(al, idx) {
    G.aliens.splice(idx, 1);
    if (G.mode === 'title') return;
    G.saved += 1;
    G.floorSaved += 1;
    if (!G.shield) G.paccets = Math.min(8, G.paccets + 1);
    bumpCombo();
    addScore(300 * G.mult, al.x, al.y, MINT, true);
    audio.rescue();
    floatText(al.x, al.y - 12, '救到了', MINT, true);
    emit(10, {
      x: al.x, y: al.y, j: 6,
      vx0: -90, vx1: 90, vy0: -140, vy1: 20,
      life: 0.3, r0: 1, r1: 2.4, rgb: MINT, g: 200
    });
    kick('cap');
    if (!G.shield && G.paccets >= 8) activateShield();
    syncHud();
  }

  function killPlayer(why) {
    if (G.mode === 'title') return;
    if (G.dead || G.inv > 0) return;
    if (G.shield) {
      breakShield();
      return;
    }
    G.dead = true;
    G.deadT = DIE_T;
    G.why = why || '撞毁了';
    G.lives -= 1;
    G.combo = 0;
    G.comboT = 0;
    juiceHit(G.p.x, G.p.y, MAG, 2.1);
    emit(18, {
      x: G.p.x, y: G.p.y, j: 12,
      vx0: -260, vx1: 260, vy0: -300, vy1: 120,
      life: 0.5, r0: 1.6, r1: 4, rgb: MAG, g: 360
    });
    flash(MAG, 0.42);
    hitStop(0.072);
    shake(8);
    kick('die');
    audio.death();
    syncHud();
  }

  function respawn() {
    G.dead = false;
    G.p = makePlayer(VW * 0.5, GROUND - P_HH);
    G.inv = INVULN;
    G.eShots.length = 0;
    G.fireCd = 0.12;
    syncHud();
  }

  function winGame() {
    const bonus = 4000 + G.lives * 400 + G.saved * 80;
    addScore(bonus, G.p.x, G.p.y - 36, GOLD, true);
    G.mode = 'win';
    audio.win();
    showOverlay('win');
    setHint((G.kind === 'den' ? '密穴凿穿' : '穴脉打通') + ' · R 再来一局', 'hot');
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    showOverlay('lose');
    setHint('R 重开 · 撞敌、中弹或触刺扣命', 'warn');
  }

  function hurtBoss(b, dmg, x, y, eye) {
    b.hp -= dmg;
    b.flash = 0.1;
    bumpCombo();
    addScore((eye ? 80 : 40) * G.mult, x, y, eye ? GOLD : MAG);
    juiceHit(x, y, eye ? GOLD : MAG, eye ? 1.3 : 0.7);
    audio.hit(G.combo);
    if (b.hp <= 0) {
      b.alive = false;
      G.boss = null;
      emit(40, {
        x: b.x, y: b.y, j: 28,
        vx0: -320, vx1: 320, vy0: -360, vy1: 160,
        life: 0.7, r0: 2, r1: 5.5, rgb: MAG, g: 240
      });
      spawnRing(b.x, b.y, GOLD, 36);
      flash(GOLD, 0.5);
      hitStop(0.08);
      shake(10);
      kick('die');
      audio.explode(true);
      addScore((G.dense ? 7000 : 5000) * G.mult, b.x, b.y, GOLD, true);
      toast('蛸王击破', 'gold');
      G.clearT = 1.35;
    }
  }

  function demoAI(dt) {
    const p = G.p;
    let targetX = VW * 0.5 + Math.sin(G.clock * 0.55) * 110;
    let wantUp = Math.sin(G.clock * 0.9) > 0.1;
    for (let i = 0; i < G.aliens.length; i++) {
      targetX = G.aliens[i].x;
      wantUp = G.aliens[i].y < p.y - 10;
      break;
    }
    if (!G.aliens.length) {
      for (let i = 0; i < G.caps.length; i++) {
        if (!G.caps[i].cracked && Math.abs(G.caps[i].x - p.x) < 160) {
          targetX = G.caps[i].x;
          wantUp = G.caps[i].y < p.y - 8;
          break;
        }
      }
    }
    keys.l = targetX < p.x - 12;
    keys.r = targetX > p.x + 12;
    keys.u = wantUp;
    keys.d = false;
    G.fireHold = true;
    void dt;
  }

  function updatePlayer(dt) {
    const p = G.p;
    if (G.dead) return;
    const w = wantXY();
    const walls = wallAt(p.y, G.scroll, G.dense);
    if (w.x !== 0) p.face = w.x > 0 ? 1 : -1;
    const spd = p.grounded ? WALK : AIR_X;
    p.vx = w.x * spd;
    if (w.y < 0) {
      if (p.jetT <= 0 && G.mode === 'play') audio.jet();
      p.vy -= JET * dt;
      p.grounded = false;
      p.jetT += dt;
    } else {
      p.vy += GRAVITY * dt * (w.y > 0 ? 1.45 : 1);
      p.jetT = 0;
    }
    p.vy = clamp(p.vy, -MAX_RISE, MAX_FALL);
    const prevFeet = p.y + P_HH;
    p.x = clamp(p.x + p.vx * dt, walls.l + P_HW + 4, walls.r - P_HW - 4);
    p.y += p.vy * dt;
    if (p.y < 46) {
      p.y = 46;
      if (p.vy < 0) p.vy = 0;
    }
    let landed = false;
    if (p.vy >= -30) {
      const plat = platformUnder(p.x, p.y, prevFeet);
      if (plat) {
        landOn(p, plat);
        landed = true;
      }
    }
    if (!landed) {
      if (p.y + P_HH >= GROUND) {
        p.y = GROUND - P_HH;
        p.vy = 0;
        p.grounded = true;
      } else {
        const stay = stillOnPlat(p);
        if (stay && stay.ground) {
          p.grounded = true;
        } else if (stay) {
          landOn(p, stay);
        } else if (w.y >= 0) {
          p.grounded = false;
        }
      }
    }
    if (p.y + P_HH > GROUND) {
      p.y = GROUND - P_HH;
      if (p.vy > 0) p.vy = 0;
      p.grounded = true;
    }
    if (p.grounded) p.walk += dt * (Math.abs(p.vx) > 8 ? 10 : 4);
    if (p.flash > 0) p.flash -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    const fire = G.fireHold || (pointer.down && playing());
    if (fire) fireShot();
    if (G.fireCd > 0) G.fireCd -= dt;
  }

  function updateWorld(dt) {
    const sp = scrollSpd();
    G.scroll += sp * dt;
    const dy = sp * dt;
    function drop(list, extra) {
      for (let i = list.length - 1; i >= 0; i--) {
        list[i].y += dy;
        if (list[i].y > VH + (extra || 40)) list.splice(i, 1);
      }
    }
    drop(G.plats, 30);
    drop(G.spikes, 20);
    for (let i = G.caps.length - 1; i >= 0; i--) {
      G.caps[i].y += dy;
      G.caps[i].t += dt;
      if (G.caps[i].y > VH + 30 || G.caps[i].cracked) G.caps.splice(i, 1);
    }
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      G.enemies[i].y += dy * (G.enemies[i].kind === 'crawl' ? 1 : 0.55);
      if (!G.enemies[i].alive || G.enemies[i].y > VH + 36) G.enemies.splice(i, 1);
    }
    if (!G.boss) fillAhead();
    const def = floorDef();
    if (playing() && !G.boss && G.clearT <= 0 && G.scroll >= def.dist) {
      if (G.floor >= FLOORS.length - 1) spawnBoss();
      else nextFloor();
    }
  }

  function updateEnemies(dt) {
    const p = G.p;
    for (let i = 0; i < G.enemies.length; i++) {
      const en = G.enemies[i];
      if (!en.alive) continue;
      en.t += dt;
      if (en.flash > 0) en.flash -= dt;
      const walls = wallAt(en.y, G.scroll, G.dense);
      if (en.kind === 'octy') {
        en.x += en.vx * dt;
        en.y += Math.sin(en.t * 2.2) * 18 * dt;
        if (en.x < walls.l + 18 || en.x > walls.r - 18) en.vx *= -1;
        en.spit -= dt;
        if (en.spit <= 0) {
          enemySpit(en, true);
          en.spit = G.dense ? 1.15 : 1.55;
        }
      } else if (en.kind === 'bat') {
        en.x += Math.sin(en.t * 2.6) * 70 * dt + en.vx * 0.2 * dt;
        en.y += Math.cos(en.t * 1.8) * 28 * dt;
      } else if (en.kind === 'crawl') {
        en.x += en.vx * dt;
        let on = false;
        for (let j = 0; j < G.plats.length; j++) {
          const plat = G.plats[j];
          if (en.x > plat.x - 4 && en.x < plat.x + plat.w + 4 && Math.abs((en.y + 10) - plat.y) < 16) {
            en.y = plat.y - 10;
            on = true;
            if (en.x < plat.x + 8 || en.x > plat.x + plat.w - 8) en.vx *= -1;
            break;
          }
        }
        if (!on) {
          if (en.y + 10 < GROUND) en.y += 140 * dt;
          else {
            en.y = GROUND - 10;
            if (en.x < walls.l + 20 || en.x > walls.r - 20) en.vx *= -1;
          }
        }
      } else if (en.kind === 'blob') {
        en.vy += 420 * dt;
        en.y += en.vy * dt;
        en.x += Math.sin(en.t * 3) * 20 * dt;
        if (en.y > GROUND - 10) {
          en.y = GROUND - 10;
          en.vy *= -0.35;
        }
      }
      en.x = clamp(en.x, walls.l + 12, walls.r - 12);
      if (!G.dead && G.inv <= 0 && hit(p.x, p.y, 11, en.x, en.y, en.r - 1)) {
        killPlayer(KIND_WHY[en.kind] || '撞毁了');
      }
    }
  }

  function updateBoss(dt) {
    const b = G.boss;
    if (!b || !b.alive) return;
    b.t += dt;
    if (b.flash > 0) b.flash -= dt;
    if (b.intro > 0) {
      b.intro -= dt;
      b.y = lerp(b.y, 132, 1 - Math.exp(-dt * 3.2));
      return;
    }
    b.x += b.vx * dt;
    if (b.x < 90 || b.x > VW - 90) b.vx *= -1;
    b.y = 132 + Math.sin(b.t * 1.4) * 16;
    const low = b.hp / b.max;
    b.spit -= dt;
    const wait = (low < 0.33 ? 0.55 : low < 0.66 ? 0.78 : 1.05) * (G.dense ? 0.82 : 1);
    if (b.spit <= 0) {
      const n = low < 0.33 ? 8 : low < 0.66 ? 6 : 4;
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 0.25 + (i / n) * Math.PI * 0.5;
        const sp = 90 + (1 - low) * 70;
        G.eShots.push({
          x: b.x, y: b.y + 18,
          vx: Math.cos(a) * sp * (i - (n - 1) / 2) * 0.35 + (G.p.x - b.x) * 0.12,
          vy: 70 + Math.sin(a) * 40 + sp * 0.4,
          r: 5, life: 3
        });
      }
      if (low < 0.5) enemySpit(b, true);
      b.spit = wait;
    }
    if (!G.dead && G.inv <= 0 && hit(G.p.x, G.p.y, 12, b.x, b.y, 28)) {
      killPlayer('被蛸咬了');
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y < -12) {
        G.shots.splice(i, 1);
        continue;
      }
      let used = false;
      for (let j = 0; j < G.caps.length; j++) {
        const c = G.caps[j];
        if (c.cracked) continue;
        if (hit(s.x, s.y, s.r, c.x, c.y, 11)) {
          crackCap(c);
          G.shots.splice(i, 1);
          used = true;
          break;
        }
      }
      if (used) continue;
      for (let j = 0; j < G.enemies.length; j++) {
        const en = G.enemies[j];
        if (!en.alive) continue;
        if (hit(s.x, s.y, s.r + 1, en.x, en.y, en.r)) {
          killEnemy(en);
          G.shots.splice(i, 1);
          used = true;
          break;
        }
      }
      if (used) continue;
      if (G.boss && G.boss.alive) {
        const b = G.boss;
        const eye = hit(s.x, s.y, s.r, b.x, b.y - 6, 10);
        const body = hit(s.x, s.y, s.r, b.x, b.y + 6, 30);
        if (eye || body) {
          hurtBoss(b, eye ? 2 : 1, s.x, s.y, eye);
          G.shots.splice(i, 1);
        }
      }
    }
  }

  function updateEShots(dt) {
    const p = G.p;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.y > VH + 20 || s.x < -20 || s.x > VW + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (!G.dead && G.inv <= 0 && hit(p.x, p.y, 10, s.x, s.y, s.r)) {
        G.eShots.splice(i, 1);
        killPlayer('中弹了');
      }
    }
  }

  function updateAliens(dt) {
    const p = G.p;
    for (let i = G.aliens.length - 1; i >= 0; i--) {
      const al = G.aliens[i];
      al.t += dt;
      al.born += dt;
      const dx = p.x - al.x;
      const dy = p.y - al.y;
      const d = hypot(dx, dy) || 1;
      al.vx += (dx / d) * 260 * dt;
      al.vy += (dy / d) * 260 * dt;
      al.vx *= Math.exp(-dt * 2.2);
      al.vy *= Math.exp(-dt * 2.2);
      al.x += al.vx * dt;
      al.y += al.vy * dt;
      if (!G.dead && hypot(p.x - al.x, p.y - al.y) < 20) {
        collectAlien(al, i);
        continue;
      }
      if (al.born > 8 || al.y > VH + 30) G.aliens.splice(i, 1);
    }
  }

  function updateSpikes() {
    if (G.dead || G.inv > 0) return;
    const p = G.p;
    for (let i = 0; i < G.spikes.length; i++) {
      const s = G.spikes[i];
      if (hit(p.x, p.y, 10, s.x, s.y, s.r)) {
        killPlayer('触刺了');
        return;
      }
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      floats[i].t -= dt;
      floats[i].y -= 28 * dt;
      if (floats[i].t <= 0) floats.splice(i, 1);
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 26);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.6);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 14));
    if (toastTok > 0) {
      toastTok -= dt;
      if (toastTok <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (addTok > 0) {
      addTok -= dt;
      if (addTok <= 0 && scoreAdd) scoreAdd.hidden = true;
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
        if (comboEl) comboEl.hidden = true;
      }
    }
    for (let i = 0; i < motes.length; i++) {
      motes[i].y += motes[i].s * dt;
      if (motes[i].y > 1) motes[i].y -= 1;
    }
  }

  function step(dt) {
    G.clock += dt;
    updateFx(dt);
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.mode === 'title') {
      G.inv = 99;
      demoAI(dt);
      updatePlayer(dt);
      updateWorld(dt);
      updateEnemies(dt);
      updateShots(dt);
      updateEShots(dt);
      updateAliens(dt);
      if (G.scroll > 1400) {
        G.scroll = 0;
        G.spawnAt = 0;
        resetLists();
        seedFloor();
        fillAhead();
        G.p = makePlayer(VW * 0.5, GROUND - P_HH);
      }
      return;
    }
    if (G.mode !== 'play') return;
    if (G.dead) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseGame();
        else respawn();
      }
      return;
    }
    if (G.inv > 0) G.inv -= dt;
    if (G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) winGame();
      return;
    }
    updatePlayer(dt);
    updateWorld(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateShots(dt);
    updateEShots(dt);
    updateAliens(dt);
    updateSpikes();
  }

  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#061820');
    g.addColorStop(0.5, '#041318');
    g.addColorStop(1, '#031014');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgba(m.rgb, 0.18 + m.a * 0.25);
      ctx.beginPath();
      ctx.arc(m.x * VW, ((m.y + G.scroll * 0.00035) % 1) * VH, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = rgba(TEAL, 0.16);
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) {
      const wy = (G.scroll * 0.4 + k * 140) % (VH + 80) - 40;
      ctx.beginPath();
      ctx.moveTo(40, wy);
      ctx.bezierCurveTo(140, wy + 30, 280, wy - 20, 420, wy + 18);
      ctx.stroke();
    }
  }

  function drawWalls() {
    function edge(side) {
      ctx.beginPath();
      if (side < 0) ctx.moveTo(0, 0);
      else ctx.moveTo(VW, 0);
      for (let y = 0; y <= VH; y += 8) {
        const w = wallAt(y, G.scroll, G.dense);
        ctx.lineTo(side < 0 ? w.l : w.r, y);
      }
      if (side < 0) {
        ctx.lineTo(0, VH);
        ctx.closePath();
      } else {
        ctx.lineTo(VW, VH);
        ctx.closePath();
      }
      ctx.fillStyle = '#0a2430';
      ctx.fill();
      ctx.strokeStyle = rgba(HOT, 0.55);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let y = 0; y <= VH; y += 8) {
        const w = wallAt(y, G.scroll, G.dense);
        const x = side < 0 ? w.l : w.r;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    edge(-1);
    edge(1);
    ctx.fillStyle = '#123038';
    ctx.fillRect(0, GROUND, VW, VH - GROUND + 8);
    ctx.strokeStyle = rgba(MINT, 0.45);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    for (let x = 0; x <= VW; x += 16) {
      ctx.lineTo(x, GROUND + Math.sin((x + G.scroll) * 0.08) * 2.2);
    }
    ctx.stroke();
  }

  function drawPlats() {
    for (let i = 0; i < G.plats.length; i++) {
      const p = G.plats[i];
      ctx.fillStyle = '#0e3040';
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(p.x, p.y, p.w, 2.2);
      ctx.fillStyle = rgba(MINT, 0.25);
      ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, 2);
    }
  }

  function drawSpikes() {
    for (let i = 0; i < G.spikes.length; i++) {
      const s = G.spikes[i];
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 9);
      ctx.lineTo(s.x + s.side * 12, s.y);
      ctx.lineTo(s.x, s.y + 9);
      ctx.closePath();
      ctx.fill();
    }
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
  }

  function drawCaps() {
    for (let i = 0; i < G.caps.length; i++) {
      const c = G.caps[i];
      if (c.cracked) continue;
      const wob = Math.sin(c.t * 3.2) * 1.4;
      ctx.save();
      ctx.translate(c.x, c.y + wob);
      ctx.fillStyle = rgba(CYN, 0.18);
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 16, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(c.hp > 1 ? HOT : GOLD, 0.95);
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.14);
      ctx.beginPath();
      ctx.ellipse(-3, -4, 5, 6, -0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.8);
      ctx.beginPath();
      ctx.arc(2, 1, 2.2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawAlien(al) {
    const blink = ((al.t * 3) | 0) % 7 === 0;
    ctx.save();
    ctx.translate(al.x, al.y);
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 1, 7.2, 8.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#082028';
    ctx.beginPath();
    ctx.ellipse(0, -1.4, 4.4, 3.6, 0, 0, TAU);
    ctx.fill();
    if (!blink) {
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(0.8, -1.6, 1.5, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = rgba(HOT, 0.8);
    ctx.fillRect(-3, 8, 2, 3);
    ctx.fillRect(1.4, 8, 2, 3);
    ctx.restore();
  }

  function drawEnemy(en) {
    if (en.flash > 0 && ((en.flash * 24) | 0) % 2 === 0) return;
    ctx.save();
    ctx.translate(en.x, en.y);
    if (en.kind === 'octy') {
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(0, -2, 11, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(PNK, 0.9);
      ctx.lineWidth = 2.2;
      for (let k = 0; k < 5; k++) {
        const a = 0.4 + k * 0.32;
        const wob = Math.sin(en.t * 4 + k) * 5;
        ctx.beginPath();
        ctx.moveTo(-8 + k * 4, 6);
        ctx.quadraticCurveTo(-10 + k * 5 + wob, 14, -12 + k * 6, 18 + wob * 0.4);
        ctx.stroke();
      }
      ctx.fillStyle = WHT;
      ctx.beginPath();
      ctx.arc(-4, -4, 2.4, 0, TAU);
      ctx.arc(4, -4, 2.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#1a0810';
      ctx.beginPath();
      ctx.arc(-3.4, -4, 1, 0, TAU);
      ctx.arc(4.6, -4, 1, 0, TAU);
      ctx.fill();
    } else if (en.kind === 'bat') {
      ctx.fillStyle = rgba(PNK, 0.92);
      const wf = Math.sin(en.t * 10) * 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-12, wf - 4, -16, 2);
      ctx.quadraticCurveTo(-8, 2, 0, 2);
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(12, -wf - 4, 16, 2);
      ctx.quadraticCurveTo(8, 2, 0, 2);
      ctx.fill();
      ctx.fillStyle = MAG;
      ctx.beginPath();
      ctx.arc(0, 0, 5.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(-1.6, -1, 1.1, 0, TAU);
      ctx.arc(1.8, -1, 1.1, 0, TAU);
      ctx.fill();
    } else if (en.kind === 'crawl') {
      ctx.fillStyle = rgba(GOLD, 0.9);
      roundRect(-10, -7, 20, 12, 4);
      ctx.fill();
      ctx.fillStyle = '#3a2808';
      ctx.beginPath();
      ctx.arc(-3, -2, 1.4, 0, TAU);
      ctx.arc(4, -2, 1.4, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(ORG, 0.8);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-8, 6);
      ctx.lineTo(-12, 10);
      ctx.moveTo(8, 6);
      ctx.lineTo(12, 10);
      ctx.stroke();
    } else {
      ctx.fillStyle = rgba(MINT, 0.9);
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(CYN, 0.5);
      ctx.beginPath();
      ctx.arc(-2, -2, 4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBoss(b) {
    if (!b) return;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.globalAlpha = b.intro > 0 ? 0.45 + (1 - b.intro) * 0.55 : 1;
    ctx.fillStyle = rgba(MAG, b.flash > 0 ? 0.55 : 0.96);
    ctx.beginPath();
    ctx.ellipse(0, 4, 38, 32, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(PNK, 0.85);
    ctx.lineWidth = 3;
    for (let k = 0; k < 7; k++) {
      const wob = Math.sin(b.t * 3.2 + k) * 10;
      ctx.beginPath();
      ctx.moveTo(-24 + k * 8, 22);
      ctx.quadraticCurveTo(-30 + k * 10 + wob, 48, -28 + k * 9, 64 + wob * 0.5);
      ctx.stroke();
    }
    ctx.fillStyle = '#2a0814';
    ctx.beginPath();
    ctx.ellipse(0, -6, 14, 11, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.ellipse(0, -6, 8, 6, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#1a0810';
    ctx.beginPath();
    ctx.arc(2, -6, 3.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = WHT;
    ctx.beginPath();
    ctx.arc(3.2, -7, 1.1, 0, TAU);
    ctx.fill();
    const hp = clamp(b.hp / b.max, 0, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(-34, -48, 68, 6);
    ctx.fillStyle = rgba(hp < 0.33 ? MAG : GOLD, 0.95);
    ctx.fillRect(-34, -48, 68 * hp, 6);
    ctx.restore();
  }

  function drawMech(p) {
    if (G.inv > 0 && G.mode === 'play' && ((G.inv * 16) | 0) % 2 === 0) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.face, 1);
    if (!p.grounded) {
      const jf = 0.6 + Math.sin(G.clock * 28) * 0.35;
      ctx.fillStyle = rgba(ORG, 0.85 * jf);
      ctx.beginPath();
      ctx.moveTo(-4, 12);
      ctx.lineTo(0, 12 + 16 * jf);
      ctx.lineTo(4, 12);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(-2, 12);
      ctx.lineTo(0, 12 + 10 * jf);
      ctx.lineTo(2, 12);
      ctx.fill();
    }
    ctx.fillStyle = rgba(TEAL, 0.95);
    const step = p.grounded ? Math.sin(p.walk) * 3 : 1;
    ctx.fillRect(-7, 6, 5, 10 + step);
    ctx.fillRect(2, 6, 5, 10 - step);
    ctx.fillStyle = rgba(HOT, 0.95);
    roundRect(-11, -6, 22, 16, 5);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.ellipse(0, -12, 11, 11.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    roundRect(-7.5, -14, 15, 4.2, 2);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.35);
    ctx.beginPath();
    ctx.ellipse(-3, -16, 4, 3, -0.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0a3040';
    roundRect(6, -4, 9, 5, 2);
    ctx.fill();
    if (p.flash > 0 || G.muzzle > 0) {
      ctx.fillStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.ellipse(12, -6, 7, 3.2, -0.2, 0, TAU);
      ctx.fill();
    }
    if (G.shield) {
      ctx.strokeStyle = rgba(GOLD, 0.55 + Math.sin(G.clock * 8) * 0.2);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, TAU);
      ctx.stroke();
      for (let k = 0; k < 8; k++) {
        const a = G.clock * 2.2 + k * (TAU / 8);
        ctx.fillStyle = rgba(CYN, 0.9);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 20, Math.sin(a) * 14, 2.4, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, 2.2, 7, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.ellipse(s.x, s.y - 2, 1.2, 3, 0, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(PNK, 0.7);
      ctx.beginPath();
      ctx.arc(s.x - 1, s.y - 1, s.r * 0.4, 0, TAU);
      ctx.fill();
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.t / p.life, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + a * 0.7), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.42;
      ctx.strokeStyle = rgba(r.rgb, a);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r + r.t * 52, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      ctx.fillStyle = rgba(s.rgb, a * 0.45);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.rad * (0.3 + s.t * 2), 0, TAU);
      ctx.fill();
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(f.t / f.life, 0, 1);
      ctx.font = '700 ' + f.size + 'px "Segoe UI","Noto Sans SC",sans-serif';
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, f.x, f.y);
    }
  }

  function draw() {
    if (!ctx) return;
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake;
      shy = (Math.random() - 0.5) * G.shake;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#031014';
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(scale * G.punch, 0, 0, scale * G.punch, ox + shx * scale, oy + shy * scale);
    drawBg();
    drawWalls();
    drawPlats();
    drawSpikes();
    drawCaps();
    for (let i = 0; i < G.aliens.length; i++) drawAlien(G.aliens[i]);
    for (let i = 0; i < G.enemies.length; i++) if (G.enemies[i].alive) drawEnemy(G.enemies[i]);
    if (G.boss) drawBoss(G.boss);
    drawShots();
    if (!G.dead) drawMech(G.p);
    drawFx();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash);
      ctx.fillRect(-30, -30, VW + 60, VH + 60);
    }
  }

  function retry() {
    audio.ensure();
    if (G.mode === 'title') startRun('save');
    else startRun(G.kind);
  }

  function toWorld(cx, cy) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((cx - r.left) * (dpr) - ox) / scale,
      y: ((cy - r.top) * (dpr) - oy) / scale
    };
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === ' ' || k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault();
    }
    if (down && (k === 'm' || k === 'M')) {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (down && (k === 'r' || k === 'R')) {
      retry();
      return;
    }
    if (down && overlayOpen()) {
      if (G.mode === 'title' && (k === 'Enter' || k === ' ' || k === '1')) {
        audio.ensure();
        startRun('save');
        return;
      }
      if (G.mode === 'title' && k === '2') {
        audio.ensure();
        startRun('den');
        return;
      }
      if ((G.mode === 'win' || G.mode === 'lose') && (k === 'Enter' || k === ' ')) {
        startRun(G.kind);
        return;
      }
      return;
    }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = down;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down;
    if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = down;
    if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = down;
    if (k === ' ') G.fireHold = down;
  }

  function bindPad(el, key) {
    if (!el) return;
    const set = function (on) {
      if (key === 'fire') G.fireHold = on;
      else keys[key] = on;
      el.classList.toggle('on', on);
    };
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      audio.ensure();
      set(true);
    });
    const off = function (e) {
      e.preventDefault();
      set(false);
    };
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
  }

  function resize() {
    const rec = stageEl.getBoundingClientRect();
    W = Math.max(1, rec.width);
    H = Math.max(1, rec.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    const fit = Math.min(W / VW, H / VH);
    scale = fit * dpr;
    ox = (canvas.width - VW * scale) * 0.5;
    oy = (canvas.height - VH * scale) * 0.5;
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (!lastT) lastT = now;
    if (hidden) {
      lastT = now;
      return;
    }
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    while (acc >= STEP) {
      step(STEP);
      acc -= STEP;
    }
    draw();
  }

  function initMotes() {
    for (let i = 0; i < 28; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.6, 1.8),
        s: rand(0.02, 0.06),
        a: Math.random(),
        rgb: Math.random() > 0.5 ? HOT : MINT
      });
    }
  }

  function initMute() {
    let m = false;
    try { m = localStorage.getItem(MUTE_KEY) === '1'; } catch (err) { m = false; }
    audio.setMuted(m);
  }

  if (btnSave) btnSave.addEventListener('click', function () { audio.ensure(); startRun('save'); });
  if (btnDen) btnDen.addEventListener('click', function () { audio.ensure(); startRun('den'); });
  if (btnOvRetry) btnOvRetry.addEventListener('click', function () { retry(); });
  if (btnOvModes) btnOvModes.addEventListener('click', function () { audio.ensure(); startDemo(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { retry(); });
  if (btnMute) btnMute.addEventListener('click', function () { audio.ensure(); audio.setMuted(!audio.muted); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });

  canvas.addEventListener('pointerdown', function (e) {
    if (overlayOpen() && G.mode !== 'title') return;
    if (G.mode === 'title') return;
    e.preventDefault();
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    const w = toWorld(e.clientX, e.clientY);
    pointer.x = w.x;
    pointer.y = w.y;
    G.fireHold = true;
    if (canvas.focus) canvas.focus();
  });
  canvas.addEventListener('pointermove', function (e) {
    const w = toWorld(e.clientX, e.clientY);
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.hover = true;
  });
  canvas.addEventListener('pointerup', function (e) {
    if (pointer.id !== e.pointerId && pointer.id != null) return;
    pointer.down = false;
    pointer.id = null;
  });
  canvas.addEventListener('pointercancel', function () {
    pointer.down = false;
    G.fireHold = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  bindPad(document.getElementById('pad-left'), 'l');
  bindPad(document.getElementById('pad-right'), 'r');
  bindPad(document.getElementById('pad-up'), 'u');
  bindPad(document.getElementById('pad-down'), 'd');
  bindPad(document.getElementById('pad-fire'), 'fire');

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) lastT = 0;
  });
  window.addEventListener('resize', resize);

  loadBest();
  initMute();
  initMotes();
  resize();
  startDemo();
  requestAnimationFrame(loop);
})();
