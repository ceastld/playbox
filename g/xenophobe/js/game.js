'use strict';

(function () {
  const VW = 640;
  const VH = 360;
  const ROOMS = 3;
  const ROOM_W = 640;
  const WORLD_W = ROOMS * ROOM_W;
  const DECKS = 3;
  const DECK_H = 360;
  const WORLD_H = DECKS * DECK_H;
  const FLOOR = 328;
  const MID = 236;
  const CEIL = 52;
  const ELEV_X = 18;
  const ELEV_W = 58;
  const ELEV_CX = ELEV_X + ELEV_W * 0.5;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const HP_MAX = 100;
  const HP_LOW = 24;
  const WALK = 196;
  const AIR = 0.9;
  const JUMP_V = 540;
  const GRAV = 1450;
  const MAX_FALL = 620;
  const COYOTE = 0.09;
  const BUFFER = 0.12;
  const PW = 14;
  const PH = 26;
  const PH_DUCK = 16;
  const INVULN = 1.4;
  const DIE_T = 0.76;
  const FIRE_CD = 0.128;
  const SHOT_SPD = 640;
  const MAX_SHOTS = 5;
  const COMBO_WIN = 1.4;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const BEST_KEY = 'playbox-xenophobe-best';
  const MUTE_KEY = 'playbox-xenophobe-mute';
  const OPS = 'WASD / 方向键走跳 · 空格射击（上抬枪）· 电梯里上下 · R 重开 · M 静音';
  const DECK_NAME = ['上甲板', '中甲板', '底舱'];

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [61, 255, 74];
  const HOT2 = [184, 255, 90];
  const WHT = [232, 246, 234];
  const PUR = [180, 77, 255];
  const ACID = [124, 255, 42];
  const SLIME = [174, 255, 64];
  const YEL = [255, 210, 64];

  const SCORE = {
    egg: 50, critter: 100, crawler: 120, roller: 80, flyer: 160, snot: 250,
    deck: 800, extract: 2500
  };

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }
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
  function deckTop(d) {
    return d * DECK_H;
  }
  function floorY(d) {
    return d * DECK_H + FLOOR;
  }
  function midY(d) {
    return d * DECK_H + MID;
  }
  function ceilY(d) {
    return d * DECK_H + CEIL;
  }
  function deckOfY(y) {
    return clamp((y / DECK_H) | 0, 0, DECKS - 1);
  }
  function roomOfX(x) {
    return clamp((x / ROOM_W) | 0, 0, ROOMS - 1);
  }
  function comboMul(n) {
    return 1 + Math.min(4, Math.floor(Math.max(0, n - 1) / 3));
  }
  function swarmMul() {
    return G.kind === 'swarm' ? 1.38 : 1;
  }
  function hatchMul() {
    return G.kind === 'swarm' ? 0.55 : 1;
  }

  const G = {
    mode: 'title',
    kind: 'sweep',
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    lives: LIVES,
    hp: HP_MAX,
    t: 0,
    clock: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: MAG,
    punch: 1,
    invuln: 0,
    deadT: 0,
    why: '',
    deck: 0,
    riding: false,
    rideT: 0,
    rideDur: 0.78,
    rideY0: 0,
    rideY1: 0,
    rideTo: 0,
    camX: 0,
    camY: 0,
    fireCd: 0,
    dropT: 0,
    coyote: 0,
    jbuf: 0,
    ready: 0,
    cleared: [false, false, false],
    allClear: false,
    extracted: false,
    lifeBank: 0,
    stingT: 0,
    lowWarned: false,
    muzzle: 0,
    lastFace: 1,
    mash: 0,
    aimUp: false,
    player: {
      x: 110, y: floorY(0), vx: 0, vy: 0, face: 1, on: true, duck: false,
      walk: 0, grab: 0, blink: 0
    },
    aliens: [],
    shots: [],
    items: [],
    plats: []
  };

  const particles = [];
  const pops = [];
  const rings = [];
  const motes = [];
  const keys = { u: false, d: false, l: false, r: false, j: false };
  let fireHold = false;
  let jumpPad = false;
  let addTok = 0;
  let chainTok = 0;
  let toastTok = 0;
  let hidden = false;
  let dpr = 1;
  let W = 1;
  let H = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;

  function selfCheck() {
    if (BEST_KEY !== 'playbox-xenophobe-best') throw new Error('best key');
    if (MUTE_KEY !== 'playbox-xenophobe-mute') throw new Error('mute key');
    const jh = (JUMP_V * JUMP_V) / (2 * GRAV);
    if (jh < FLOOR - MID - 2) throw new Error('jump too short for mid deck');
    if (DECKS !== 3) throw new Error('three decks');
  }
  selfCheck();

  if (!hasDom) return;

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const stageEl = el('stage');
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const scoreEl = el('score');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const bestEl = el('best');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const modeLabel = el('mode-label');
  const deckLabel = el('deck-label');
  const tagLabel = el('tag-label');
  const hpBar = el('hp-bar');
  const hpWrap = el('hp-wrap');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
  const hintEl = el('hint');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const modeSweep = el('mode-sweep');
  const modeSwarm = el('mode-swarm');
  const btnSweep = el('btn-sweep');
  const btnSwarm = el('btn-swarm');
  const padEl = el('pad');
  const padBtns = {
    jump: el('btn-jump'),
    left: el('btn-left'),
    right: el('btn-right'),
    fire: el('btn-fire'),
    down: el('btn-down')
  };

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
        this.master.gain.value = this.muted ? 0 : 0.34;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.34;
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
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
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
      f.frequency.value = hp || 700;
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
    shot() {
      this.ensure();
      this.beep(880, 0.045, 'square', 0.042, 240);
      this.beep(1480, 0.03, 'sawtooth', 0.022, 620);
    },
    splat() {
      this.ensure();
      this.noise(0.1, 0.055, 240);
      this.beep(190, 0.12, 'sawtooth', 0.05, 52);
    },
    hatch() {
      this.ensure();
      this.noise(0.08, 0.04, 500);
      this.beep(320, 0.09, 'triangle', 0.035, 140);
      this.beep(620, 0.06, 'square', 0.025, 280);
    },
    sting() {
      this.ensure();
      this.beep(140, 0.12, 'sawtooth', 0.055, 70);
      this.beep(310, 0.08, 'square', 0.03, 90);
      this.noise(0.09, 0.04, 380);
    },
    shakeOff() {
      this.ensure();
      this.beep(420, 0.07, 'square', 0.04, 180);
      this.noise(0.06, 0.035, 600);
    },
    combo(n) {
      this.ensure();
      const f = 520 + Math.min(8, n) * 70;
      this.beep(f, 0.07, 'square', 0.04, f * 1.5);
    },
    hurt() {
      this.ensure();
      this.beep(160, 0.16, 'sawtooth', 0.055, 58);
      this.noise(0.12, 0.05, 300);
    },
    jump() {
      this.ensure();
      this.beep(360, 0.06, 'triangle', 0.028, 220);
    },
    ding() {
      this.ensure();
      this.beep(660, 0.07, 'sine', 0.04, 990);
      this.beep(990, 0.1, 'triangle', 0.032);
    },
    kit() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.04, 784);
      this.beep(784, 0.11, 'triangle', 0.035);
    },
    clear() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.04, 523);
      this.beep(523, 0.1, 'triangle', 0.035, 784);
      this.beep(784, 0.14, 'sine', 0.04);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(784, 0.18, 'sine', 0.05, 1046);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.22, 'sawtooth', 0.05, 70);
      this.beep(140, 0.28, 'triangle', 0.04, 50);
    },
    start() {
      this.ensure();
      this.beep(330, 0.07, 'square', 0.03, 440);
      this.beep(523, 0.1, 'triangle', 0.035);
    },
    oneup() {
      this.ensure();
      this.beep(660, 0.08, 'square', 0.04);
      this.beep(880, 0.1, 'triangle', 0.04);
      this.beep(1320, 0.12, 'sine', 0.035);
    }
  };

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function overlayBlocksPlay() {
    return overlayOpen();
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.classList.remove('end');
    overlay.setAttribute('aria-hidden', 'true');
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
      if (ovKicker) ovKicker.textContent = 'XENO';
      if (ovTitle) ovTitle.textContent = '异种';
      if (ovLead) ovLead.innerHTML = '侧视舱室。左右走、跳、开火。卵会孵，异虫会抓住你。<br />清光一层甲板，坐电梯换层，全舰撤离。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (ovTitle) ovTitle.textContent = G.kind === 'swarm' ? '虫潮压住了' : '舱清了';
      if (ovLead) ovLead.textContent = '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = G.why || '被咬穿了';
      if (ovLead) ovLead.textContent = (G.kind === 'swarm' ? '虫潮' : '清舱') + ' · 分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
      if (ovOps) ovOps.textContent = 'R 重开随时可用';
      if (ovAgain) ovAgain.textContent = '再来';
      if (ovMenu) ovMenu.textContent = '换模式';
    }
  }

  function kick(cls) {
    if (!stageEl || REDUCE) return;
    stageEl.classList.remove(cls);
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function screenFlash(rgb, a) {
    G.flash = a;
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
        t: spec.life,
        life: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g || 0
      });
    }
  }

  function spawnPop(x, y, text, rgb) {
    pops.push({ x: x, y: y, text: text, rgb: rgb, t: 0.85, life: 0.85 });
  }

  function spawnRing(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
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

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastTok += 1;
    const tok = toastTok;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1600);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.remove('hot', 'warn');
    if (cls) hintEl.classList.add(cls);
  }

  function resetFx() {
    particles.length = 0;
    pops.length = 0;
    rings.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
  }

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

  function addScore(n, x, y) {
    if (G.mode !== 'play' || n <= 0) return;
    const prev = G.lifeBank;
    G.score += n;
    G.lifeBank += n;
    if (scoreEl) scoreEl.textContent = String(G.score);
    saveBest();
    if (scoreBox && scoreAdd) {
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
    if (x != null) spawnPop(x, y - 18, '+' + n, GOLD);
    while (G.lifeBank >= LIFE_EVERY && G.lives < LIFE_CAP) {
      G.lifeBank -= LIFE_EVERY;
      G.lives += 1;
      audio.oneup();
      toast('1UP', false, true);
    }
    if (prev !== G.lifeBank) syncPips();
  }

  function bumpCombo() {
    const prev = G.mult;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = comboMul(G.combo);
    if (G.combo >= 2) audio.combo(G.combo);
    if (G.mult > prev) showChain(G.mult);
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
  }

  function syncPips() {
    if (!pipsEl) return;
    pipsEl.innerHTML = '';
    const n = Math.max(LIVES, G.lives);
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'pip' + (i < G.lives ? ' on' : ' gone');
      pipsEl.appendChild(s);
    }
  }

  function leftOnDeck(d) {
    let n = 0;
    for (let i = 0; i < G.aliens.length; i++) {
      const a = G.aliens[i];
      if (a.alive && a.deck === d) n += 1;
    }
    return n;
  }

  function leftAll() {
    let n = 0;
    for (let i = 0; i < G.aliens.length; i++) if (G.aliens[i].alive) n += 1;
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (comboEl) comboEl.textContent = '×' + G.mult;
    if (modeLabel) {
      modeLabel.textContent = G.kind === 'swarm' ? '虫潮' : '清舱';
      modeLabel.classList.toggle('swarm', G.kind === 'swarm');
    }
    if (deckLabel) {
      deckLabel.textContent = DECK_NAME[G.deck] || '上甲板';
      deckLabel.classList.toggle('hot', !!G.cleared[G.deck]);
    }
    if (tagLabel) {
      if (G.player.grab > 0) {
        tagLabel.textContent = '被抓住';
        tagLabel.className = 'warn';
      } else if (G.allClear) {
        tagLabel.textContent = '撤离';
        tagLabel.className = 'hot';
      } else {
        tagLabel.textContent = '残 ' + leftOnDeck(G.deck);
        tagLabel.className = '';
      }
    }
    if (hpBar) {
      const t = clamp(G.hp / HP_MAX, 0, 1);
      hpBar.style.transform = 'scaleX(' + t + ')';
    }
    const track = hpWrap ? hpWrap.querySelector('.fill-track') : null;
    if (track) track.classList.toggle('low', G.hp <= HP_LOW);
    if (modeSweep) modeSweep.setAttribute('aria-pressed', G.kind !== 'swarm' ? 'true' : 'false');
    if (modeSwarm) modeSwarm.setAttribute('aria-pressed', G.kind === 'swarm' ? 'true' : 'false');
    syncPips();
  }

  function inShaft(x) {
    const px = x == null ? G.player.x : x;
    return px > ELEV_X + 8 && px < ELEV_X + ELEV_W - 8;
  }

  function platList(deck) {
    const list = [];
    for (let i = 0; i < G.plats.length; i++) {
      if (G.plats[i].deck === deck) list.push(G.plats[i]);
    }
    return list;
  }

  function addPlat(deck, x, yRel, w, floor) {
    G.plats.push({
      x: x,
      y: deckTop(deck) + yRel,
      w: w,
      deck: deck,
      floor: !!floor
    });
  }

  function makeAlien(type, x, y, deck, lane) {
    const spec = {
      egg: { hp: 1, r: 11, score: SCORE.egg, rgb: PUR, grab: false, spd: 0 },
      critter: { hp: 1, r: 10, score: SCORE.critter, rgb: ACID, grab: true, spd: 74 },
      crawler: { hp: 1, r: 11, score: SCORE.crawler, rgb: MAG, grab: true, spd: 66 },
      roller: { hp: 1, r: 9, score: SCORE.roller, rgb: SLIME, grab: false, spd: 158 },
      flyer: { hp: 2, r: 10, score: SCORE.flyer, rgb: HOT2, grab: G.kind === 'swarm', spd: 92 },
      snot: { hp: 3, r: 15, score: SCORE.snot, rgb: YEL, grab: true, spd: 44 }
    }[type];
    if (G.kind === 'swarm' && type === 'snot') spec.hp = 4;
    if (G.kind === 'swarm' && type === 'flyer') spec.hp = 3;
    const a = {
      alive: true,
      type: type,
      x: x,
      y: y,
      vx: (Math.random() < 0.5 ? -1 : 1) * spec.spd * swarmMul() * (0.85 + Math.random() * 0.3),
      vy: 0,
      hp: spec.hp,
      hpMax: spec.hp,
      deck: deck,
      lane: lane || (type === 'crawler' ? 'ceil' : type === 'flyer' ? 'air' : 'floor'),
      face: 1,
      r: spec.r,
      score: spec.score,
      rgb: spec.rgb,
      canGrab: spec.grab,
      spd: spec.spd * swarmMul(),
      hatch: type === 'egg' ? (2.4 + Math.random() * 4.2) * hatchMul() : 0,
      strain: 0,
      latched: false,
      walk: Math.random() * TAU,
      bob: Math.random() * TAU,
      dropT: 0.4 + Math.random() * 0.8,
      stun: 0,
      hurt: 0,
      spit: 0
    };
    G.aliens.push(a);
    return a;
  }

  function hatchType(lane, deck) {
    const r = Math.random();
    if (lane === 'ceil') return r < 0.78 ? 'crawler' : 'flyer';
    if (deck >= 2 && r < 0.18) return 'snot';
    if (r < 0.5) return 'critter';
    if (r < 0.82) return 'roller';
    return deck > 0 && r < 0.93 ? 'flyer' : 'critter';
  }

  function buildDeck(deck, demo) {
    addPlat(deck, 0, FLOOR, WORLD_W, true);
    const y0 = deckTop(deck);
    void y0;
    for (let r = 0; r < ROOMS; r++) {
      const x0 = r * ROOM_W;
      if (r === 0) {
        addPlat(deck, x0 + 168, MID, 170, false);
        addPlat(deck, x0 + 400, MID - 36, 130, false);
      } else if (r === 1) {
        addPlat(deck, x0 + 70, MID, 210, false);
        addPlat(deck, x0 + 360, MID, 190, false);
      } else {
        addPlat(deck, x0 + 90, MID, 150, false);
        addPlat(deck, x0 + 300, MID - 40, 150, false);
        addPlat(deck, x0 + 500, MID, 110, false);
      }
    }

    const eggN = demo ? 4 : ([6, 8, 10][deck] + (G.kind === 'swarm' ? 3 : 0));
    for (let i = 0; i < eggN; i++) {
      const room = 1 + (i % (demo ? 2 : 2));
      const ceil = i % 3 === 0;
      const x = room * ROOM_W + 80 + (i * 97) % (ROOM_W - 140);
      const lane = ceil ? 'ceil' : 'floor';
      const y = ceil ? ceilY(deck) + 10 : floorY(deck);
      makeAlien('egg', x, y, deck, lane);
    }

    if (demo) {
      makeAlien('critter', 520, floorY(deck), deck, 'floor');
      makeAlien('crawler', 780, ceilY(deck) + 10, deck, 'ceil');
      makeAlien('roller', 980, floorY(deck), deck, 'floor');
      return;
    }

    const extra = [
      { critter: 1, crawler: 1, roller: 1, flyer: 0, snot: 0 },
      { critter: 2, crawler: 1, roller: 1, flyer: 1, snot: 0 },
      { critter: 2, crawler: 2, roller: 1, flyer: 1, snot: 1 }
    ][deck];
    if (G.kind === 'swarm') {
      extra.critter += 1;
      extra.crawler += 1;
      extra.roller += 1;
      extra.flyer += 1;
      if (deck > 0) extra.snot += 1;
    }
    function sprinkle(type, n, lane, yfn) {
      for (let i = 0; i < n; i++) {
        const x = 220 + Math.random() * (WORLD_W - 280);
        makeAlien(type, x, yfn(deck), deck, lane);
      }
    }
    sprinkle('critter', extra.critter, 'floor', floorY);
    sprinkle('crawler', extra.crawler, 'ceil', function (d) { return ceilY(d) + 10; });
    sprinkle('roller', extra.roller, 'floor', floorY);
    sprinkle('flyer', extra.flyer, 'air', function (d) { return midY(d) - 20; });
    sprinkle('snot', extra.snot, 'floor', floorY);

    G.items.push({
      alive: true,
      kind: 'kit',
      x: 420 + deck * 380,
      y: midY(deck),
      deck: deck,
      bob: Math.random() * TAU
    });
  }

  function buildStation(demo) {
    G.plats = [];
    G.aliens = [];
    G.items = [];
    G.shots = [];
    G.cleared = [false, false, false];
    G.allClear = false;
    G.extracted = false;
    const n = demo ? 1 : DECKS;
    for (let d = 0; d < n; d++) buildDeck(d, demo);
    G.deck = 0;
    G.player.x = 118;
    G.player.y = floorY(0);
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.face = 1;
    G.player.on = true;
    G.player.duck = false;
    G.player.grab = 0;
    G.player.walk = 0;
    G.camX = 0;
    G.camY = 0;
    G.riding = false;
    G.invuln = demo ? 99 : 0.6;
    G.hp = HP_MAX;
    resetFx();
  }

  function placePlayerSpawn() {
    G.player.x = 118;
    G.player.y = floorY(G.deck);
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.on = true;
    G.player.duck = false;
    G.player.grab = 0;
    G.riding = false;
    for (let i = 0; i < G.aliens.length; i++) {
      G.aliens[i].latched = false;
      G.aliens[i].strain = 0;
    }
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'sweep';
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.deadT = 0;
    G.why = '';
    G.lifeBank = 0;
    G.lowWarned = false;
    buildStation(true);
    G.invuln = 99;
    showOverlay('title');
    setHint('走跳射击 · 卵会孵 · 异虫会抓人 · 清甲板 · 坐电梯撤离');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'swarm' ? 'swarm' : 'sweep';
    G.mode = 'play';
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.hp = HP_MAX;
    G.deadT = 0;
    G.why = '';
    G.lifeBank = 0;
    G.lowWarned = false;
    G.ready = 0.35;
    buildStation(false);
    G.invuln = 0.8;
    keys.u = keys.d = keys.l = keys.r = keys.j = false;
    fireHold = false;
    jumpPad = false;
    G.aimUp = false;
    hideOverlay();
    audio.start();
    toast(G.kind === 'swarm' ? '虫潮 · 更快更密' : '清舱 · 三层甲板', G.kind === 'swarm', G.kind !== 'swarm');
    setHint(G.kind === 'swarm' ? '虫潮更快 · 清光全舰 · 上甲板电梯撤离' : '清光甲板 · 坐电梯换层 · 全舰撤离', G.kind === 'swarm' ? 'warn' : '');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('sweep');
    else startGame(G.kind);
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('sweep');
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why || '被咬穿了';
    audio.lose();
    kick('die');
    showOverlay('lose');
    setHint('R 重开', 'warn');
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play') return;
    G.mode = 'win';
    G.extracted = true;
    const bonus = SCORE.extract + G.lives * 400 + (G.hp | 0) * 2;
    addScore(bonus, G.player.x, G.player.y - 30);
    audio.win();
    kick('win-flash');
    screenFlash(GOLD, 0.4);
    toast(G.kind === 'swarm' ? '虫潮压住了' : '全舰撤离', false, true);
    showOverlay('win');
    setHint('舱清了 · R 再来', 'hot');
    syncHud();
  }

  function killPlayer(why) {
    if (G.deadT > 0) return;
    G.why = why;
    G.deadT = DIE_T;
    G.player.grab = 0;
    for (let i = 0; i < G.aliens.length; i++) {
      G.aliens[i].latched = false;
      G.aliens[i].strain = 0;
    }
    audio.hurt();
    kick('die');
    hitStop(0.08);
    screenFlash(MAG, 0.55);
    emit(22, {
      x: G.player.x, y: G.player.y - 14, j: 10,
      vx0: -220, vx1: 220, vy0: -280, vy1: 80,
      life: 0.5, r0: 2, r1: 5.5, rgb: HOT, g: 380
    });
    G.lives -= 1;
    syncPips();
  }

  function respawn() {
    if (G.lives <= 0) {
      loseRun(G.why || '生命耗尽');
      return;
    }
    G.hp = HP_MAX;
    G.deadT = 0;
    G.invuln = INVULN;
    G.lowWarned = false;
    placePlayerSpawn();
    toast('重组', false, false);
    syncHud();
  }

  function checkDecks() {
    if (G.mode !== 'play') return;
    let all = true;
    for (let d = 0; d < DECKS; d++) {
      const n = leftOnDeck(d);
      if (n === 0 && !G.cleared[d]) {
        G.cleared[d] = true;
        addScore(SCORE.deck * (d + 1) * G.mult, G.player.x, G.player.y - 24);
        audio.clear();
        toast(DECK_NAME[d] + '已清 · 坐电梯', false, true);
        spawnRing(G.player.x, G.player.y - 20, GOLD);
      }
      if (!G.cleared[d]) all = false;
    }
    if (all && !G.allClear) {
      G.allClear = true;
      toast('全舰已清 · 上甲板电梯撤离', false, true);
      setHint('去上甲板电梯 · 按上撤离', 'hot');
      audio.ding();
    }
  }

  function splatAlien(a, big) {
    const n = big ? 18 : 12;
    emit(n, {
      x: a.x, y: a.y - 6, j: 8,
      vx0: -200, vx1: 200, vy0: -260, vy1: 70,
      life: 0.46, r0: 1.8, r1: 4.8, rgb: a.rgb, g: 460
    });
    emit(6, {
      x: a.x, y: a.y - 4, j: 4,
      vx0: -80, vx1: 80, vy0: -40, vy1: 120,
      life: 0.5, r0: 1.2, r1: 3.2, rgb: ACID, g: 520
    });
    spawnRing(a.x, a.y - 8, a.rgb);
    audio.splat();
    hitStop(big ? 0.07 : (0.038 + Math.min(0.04, G.combo * 0.005)));
    G.shake = Math.max(G.shake, big ? 9 : 5);
    kick(big ? 'boom' : 'hit');
  }

  function hurtAlien(a, dmg, sx, sy) {
    if (!a.alive) return;
    a.hp -= dmg;
    a.hurt = 0.08;
    a.vx += (a.x < G.player.x ? 1 : -1) * 18;
    emit(4, {
      x: a.x, y: a.y - 6, j: 3,
      vx0: -60, vx1: 60, vy0: -90, vy1: -10,
      life: 0.22, r0: 1, r1: 2.4, rgb: WHT, g: 0
    });
    if (a.hp <= 0) {
      a.alive = false;
      a.latched = false;
      if (G.player.grab > 0) G.player.grab = Math.max(0, G.player.grab - 1);
      splatAlien(a, a.type === 'snot' || a.type === 'flyer');
      if (G.mode === 'play') {
        bumpCombo();
        addScore(a.score * G.mult, a.x, a.y);
      }
      checkDecks();
    } else {
      hitStop(0.028);
      kick('thump');
    }
    void sx;
    void sy;
  }

  function hatchEgg(a, fromShot) {
    if (!a.alive || a.type !== 'egg') return;
    a.alive = false;
    audio.hatch();
    emit(10, {
      x: a.x, y: a.y - 4, j: 6,
      vx0: -140, vx1: 140, vy0: -180, vy1: 40,
      life: 0.38, r0: 1.4, r1: 3.6, rgb: PUR, g: 300
    });
    kick('thump');
    hitStop(0.03);
    if (fromShot) {
      splatAlien(a, false);
      if (G.mode === 'play') {
        bumpCombo();
        addScore(SCORE.egg * G.mult, a.x, a.y);
      }
      checkDecks();
      return;
    }
    const type = hatchType(a.lane, a.deck);
    const y = type === 'crawler' ? ceilY(a.deck) + 10
      : type === 'flyer' ? midY(a.deck) - 16
      : floorY(a.deck);
    const b = makeAlien(type, a.x, y, a.deck, type === 'crawler' ? 'ceil' : type === 'flyer' ? 'air' : 'floor');
    b.vx = (G.player.x < a.x ? -1 : 1) * b.spd;
    checkDecks();
  }

  function detachAlien(a, flung) {
    if (!a.latched) return;
    a.latched = false;
    a.strain = 0;
    G.player.grab = Math.max(0, G.player.grab - 1);
    a.stun = 0.7;
    a.vx = G.player.face * (flung ? 220 : 140);
    a.vy = flung ? -180 : -80;
    a.lane = 'floor';
    a.y = G.player.y - 8;
    audio.shakeOff();
    emit(8, {
      x: G.player.x, y: G.player.y - 16, j: 6,
      vx0: -160, vx1: 160, vy0: -160, vy1: 20,
      life: 0.32, r0: 1.4, r1: 3.2, rgb: MAG, g: 200
    });
    G.invuln = Math.max(G.invuln, 0.32);
  }

  function latchAlien(a) {
    if (a.latched || !a.canGrab || G.invuln > 0 || G.deadT > 0 || G.riding) return;
    if (G.player.grab >= 2) {
      bumpDamage(16, a.x < G.player.x ? 1 : -1, '被撞上了');
      return;
    }
    a.latched = true;
    a.strain = 0;
    G.player.grab += 1;
    G.stingT = 0;
    audio.sting();
    kick('sting');
    screenFlash(MAG, 0.42);
    G.shake = Math.max(G.shake, 8);
    hitStop(0.045);
    const track = hpWrap ? hpWrap.querySelector('.fill-track') : null;
    if (track) {
      track.classList.remove('sting');
      void track.offsetWidth;
      track.classList.add('sting');
    }
    if (G.mode === 'play') toast('被抓住了 · 左右甩开', true, false);
  }

  function bumpDamage(n, dir, why) {
    if (G.invuln > 0 || G.deadT > 0 || G.riding || G.mode === 'title') return;
    G.hp -= n;
    G.invuln = 0.55;
    G.player.vx = dir * 140;
    G.player.vy = -90;
    G.player.on = false;
    audio.hurt();
    kick('sting');
    screenFlash(MAG, 0.32);
    G.shake = Math.max(G.shake, 7);
    hitStop(0.04);
    emit(8, {
      x: G.player.x, y: G.player.y - 12, j: 5,
      vx0: -120, vx1: 120, vy0: -140, vy1: 20,
      life: 0.28, r0: 1.2, r1: 3, rgb: MAG, g: 240
    });
    if (G.hp <= 0) {
      G.hp = 0;
      killPlayer(why || '被咬穿了');
    }
    syncHud();
  }

  function playerH() {
    return G.player.duck ? PH_DUCK : PH;
  }

  function shotDir() {
    let dx = G.player.face;
    let dy = 0;
    const shaft = inShaft() && G.player.on;
    if ((keys.u || G.aimUp) && !shaft) dy = -1;
    if (keys.d && !G.player.on) dy = 1;
    if (dy !== 0 && !keys.l && !keys.r && G.player.on) dx = 0;
    if (dy === 0 && !keys.d) {
      for (let i = 0; i < G.aliens.length; i++) {
        const a = G.aliens[i];
        if (!a.alive || a.deck !== G.deck) continue;
        if (a.lane !== 'ceil') continue;
        if (Math.abs(a.x - G.player.x) < 80 && a.y < G.player.y - 40) {
          dy = -1.35;
          break;
        }
      }
    }
    if (dx === 0 && dy === 0) dx = G.player.face;
    const len = hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  function fireShot() {
    if (G.fireCd > 0 || G.deadT > 0 || G.ready > 0) return;
    if (G.mode !== 'play' && G.mode !== 'title') return;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].alive) n += 1;
    if (n >= MAX_SHOTS) return;
    const d = shotDir();
    const h = playerH();
    G.shots.push({
      alive: true,
      x: G.player.x + d.x * 16,
      y: G.player.y - h * 0.62 + d.y * 8,
      vx: d.x * SHOT_SPD,
      vy: d.y * SHOT_SPD,
      life: 0.88,
      rgb: CYN
    });
    G.fireCd = FIRE_CD;
    G.muzzle = 0.06;
    audio.shot();
    emit(3, {
      x: G.player.x + d.x * 16, y: G.player.y - h * 0.62, j: 2,
      vx0: d.x * 40, vx1: d.x * 90, vy0: -30, vy1: 20,
      life: 0.14, r0: 1, r1: 2.2, rgb: CYN, g: 0
    });
    if (G.player.grab > 0) {
      for (let i = 0; i < G.aliens.length; i++) {
        const a = G.aliens[i];
        if (a.latched) a.strain += 0.7;
      }
    }
  }

  function tryRide(dir) {
    if (G.riding || !G.player.on || G.deadT > 0) return false;
    if (!inShaft()) return false;
    if (dir < 0) {
      if (G.deck <= 0) {
        if (G.allClear && G.mode === 'play') {
          winRun();
          return true;
        }
        if (G.mode === 'play' && G.allClear) toast('上甲板电梯撤离', false, true);
        return false;
      }
      startRide(G.deck - 1);
      return true;
    }
    if (G.deck >= DECKS - 1) return false;
    startRide(G.deck + 1);
    return true;
  }

  function startRide(to) {
    G.riding = true;
    G.rideT = 0;
    G.rideDur = 0.78;
    G.rideY0 = G.player.y;
    G.rideTo = to;
    G.rideY1 = floorY(to);
    G.player.vx = 0;
    G.player.vy = 0;
    G.invuln = Math.max(G.invuln, 0.8);
    audio.ding();
    toast((to < G.deck ? '↑ ' : '↓ ') + DECK_NAME[to], false, false);
  }

  function updateRide(dt) {
    G.rideT += dt;
    const u = clamp(G.rideT / G.rideDur, 0, 1);
    const e = u * u * (3 - 2 * u);
    G.player.x = ELEV_CX;
    G.player.y = lerp(G.rideY0, G.rideY1, e);
    G.player.vx = 0;
    G.player.vy = 0;
    G.player.on = false;
    G.deck = deckOfY(G.player.y - 10);
    if (u >= 1) {
      G.riding = false;
      G.deck = G.rideTo;
      G.player.y = floorY(G.deck);
      G.player.on = true;
      G.invuln = Math.max(G.invuln, 0.35);
      kick('thump');
      syncHud();
    }
  }

  function landOnPlats(prevY) {
    const p = G.player;
    if (p.vy < 0) {
      p.on = false;
      return;
    }
    const deck = G.riding ? G.deck : deckOfY(p.y - 8);
    const x0 = p.x - PW * 0.45;
    const x1 = p.x + PW * 0.45;
    p.on = false;
    for (let i = 0; i < G.plats.length; i++) {
      const pl = G.plats[i];
      if (pl.deck !== deck) continue;
      if (G.dropT > 0 && !pl.floor) continue;
      if (x1 < pl.x + 4 || x0 > pl.x + pl.w - 4) continue;
      if (prevY <= pl.y + 3 && p.y >= pl.y && p.y <= pl.y + 18) {
        p.y = pl.y;
        p.vy = 0;
        p.on = true;
        return;
      }
    }
  }

  function updatePlayer(dt) {
    const p = G.player;
    if (G.riding) {
      updateRide(dt);
      return;
    }

    const blocked = overlayBlocksPlay() && G.mode !== 'title';
    const demo = G.mode === 'title';
    let left = !blocked && keys.l;
    let right = !blocked && keys.r;
    let down = !blocked && keys.d;
    let jump = !blocked && (keys.u || keys.j || jumpPad);
    let fire = !blocked && fireHold;
    G.aimUp = false;

    if (demo) {
      const ai = demoAI();
      left = ai.l;
      right = ai.r;
      down = false;
      jump = ai.j;
      fire = ai.f;
    }

    const shaft = inShaft() && p.on;
    if (shaft && jump && !keys.j && keys.u) {
      if (tryRide(-1)) {
        jumpPad = false;
        return;
      }
    }
    if (shaft && keys.j && p.on) {
      if (tryRide(-1)) {
        jumpPad = false;
        return;
      }
    }
    if (shaft && down) {
      if (tryRide(1)) return;
    }

    const aimUpStand = fire && keys.u && !left && !right && p.on && !shaft;
    if (aimUpStand) jump = false;

    p.duck = down && p.on && !shaft;
    const spd = WALK * (p.grab > 0 ? 0.42 : 1) * (p.duck ? 0.55 : 1);
    let ax = 0;
    if (left) ax -= 1;
    if (right) ax += 1;
    if (ax !== 0) {
      p.face = ax < 0 ? -1 : 1;
      if (p.face !== G.lastFace && p.grab > 0) {
        for (let i = 0; i < G.aliens.length; i++) {
          if (G.aliens[i].latched) G.aliens[i].strain += 1.35;
        }
        G.mash += 1;
      }
      G.lastFace = p.face;
    }
    const maxV = p.on ? spd : spd * AIR;
    if (ax !== 0) p.vx = lerp(p.vx, ax * maxV, p.on ? 0.28 : 0.12);
    else p.vx *= p.on ? 0.72 : 0.98;

    if (jump) G.jbuf = BUFFER;
    G.jbuf = Math.max(0, G.jbuf - dt);
    if (p.on) G.coyote = COYOTE;
    else G.coyote = Math.max(0, G.coyote - dt);

    if (G.jbuf > 0 && G.coyote > 0 && !p.duck) {
      p.vy = -JUMP_V;
      p.on = false;
      G.jbuf = 0;
      G.coyote = 0;
      jumpPad = false;
      audio.jump();
      emit(4, {
        x: p.x, y: p.y, j: 4,
        vx0: -40, vx1: 40, vy0: -20, vy1: 10,
        life: 0.2, r0: 1.2, r1: 2.6, rgb: WHT, g: 200
      });
      if (p.grab > 0) {
        for (let i = 0; i < G.aliens.length; i++) {
          if (G.aliens[i].latched) G.aliens[i].strain += 2.1;
        }
      }
    }

    if (p.duck && down && p.on) {
      let onFloor = false;
      for (let i = 0; i < G.plats.length; i++) {
        const pl = G.plats[i];
        if (pl.floor && pl.deck === G.deck && Math.abs(p.y - pl.y) < 4) onFloor = true;
      }
      if (!onFloor) G.dropT = 0.16;
    }
    G.dropT = Math.max(0, G.dropT - dt);

    const prevY = p.y;
    p.vy += GRAV * dt;
    if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    p.y += p.vy * dt;
    p.x += p.vx * dt;
    p.x = clamp(p.x, 18, WORLD_W - 18);
    landOnPlats(prevY);
    G.deck = deckOfY(p.y - 10);
    if (Math.abs(p.vx) > 20 && p.on) p.walk += dt * 12;
    else p.walk += dt * 2;

    if (fire) fireShot();
  }

  function demoAI() {
    const p = G.player;
    let target = null;
    let best = 1e9;
    for (let i = 0; i < G.aliens.length; i++) {
      const a = G.aliens[i];
      if (!a.alive || a.latched) continue;
      const d = Math.abs(a.x - p.x) + Math.abs(a.y - p.y) * 0.35;
      if (d < best) {
        best = d;
        target = a;
      }
    }
    const out = { l: false, r: false, j: false, f: false };
    if (p.grab > 0) {
      out.l = ((G.t * 9) | 0) % 2 === 0;
      out.r = !out.l;
      out.f = true;
      out.j = G.t % 1.1 < 0.2;
      return out;
    }
    if (!target) {
      out.r = p.x < 400;
      out.l = p.x > 900;
      out.f = G.t % 0.8 < 0.3;
      return out;
    }
    if (target.x > p.x + 28) out.r = true;
    else if (target.x < p.x - 28) out.l = true;
    if (Math.abs(target.x - p.x) < 220) out.f = true;
    G.aimUp = target.lane === 'ceil' && Math.abs(target.x - p.x) < 90;
    if (G.aimUp) out.f = true;
    if (target.y < p.y - 50 && p.on && Math.abs(target.x - p.x) < 120) out.j = true;
    if (G.t % 2.4 < 0.16) out.j = true;
    return out;
  }

  function alienGroundY(a) {
    if (a.lane === 'ceil') return ceilY(a.deck) + 10;
    if (a.lane === 'air') return midY(a.deck) - 18 + Math.sin(a.bob) * 10;
    return floorY(a.deck);
  }

  function updateAliens(dt) {
    const p = G.player;
    const sm = swarmMul();
    for (let i = 0; i < G.aliens.length; i++) {
      const a = G.aliens[i];
      if (!a.alive) continue;
      a.walk += dt * 8;
      a.bob += dt * 4;
      a.hurt = Math.max(0, a.hurt - dt);
      a.stun = Math.max(0, a.stun - dt);

      if (a.latched) {
        a.x = p.x + (a.type === 'snot' ? p.face * -8 : p.face * -6);
        a.y = p.y - playerH() * 0.55;
        a.deck = G.deck;
        if (a.strain >= 6) detachAlien(a, true);
        continue;
      }

      if (a.type === 'egg') {
        let near = Math.abs(a.x - p.x) < 220 && a.deck === G.deck;
        a.hatch -= dt * (near ? 1.7 : 1);
        if (a.hatch <= 0) hatchEgg(a, false);
        continue;
      }

      if (a.stun > 0) {
        a.vy += GRAV * dt;
        a.y += a.vy * dt;
        a.x += a.vx * dt * 0.4;
        if (a.y >= floorY(a.deck)) {
          a.y = floorY(a.deck);
          a.vy = 0;
          a.lane = 'floor';
        }
        a.x = clamp(a.x, 20, WORLD_W - 20);
        continue;
      }

      if (a.type === 'crawler' && a.lane === 'ceil') {
        const toward = p.x < a.x ? -1 : 1;
        a.vx = lerp(a.vx, toward * a.spd, 0.08);
        a.x += a.vx * dt;
        a.y = ceilY(a.deck) + 10;
        a.face = a.vx < 0 ? -1 : 1;
        a.dropT -= dt;
        if (a.dropT <= 0 && Math.abs(a.x - p.x) < 36 && a.deck === G.deck) {
          a.lane = 'fall';
          a.vy = 40;
          a.dropT = 2;
        }
      } else if (a.lane === 'fall') {
        a.vy += GRAV * 0.7 * dt;
        a.y += a.vy * dt;
        if (a.y >= floorY(a.deck)) {
          a.y = floorY(a.deck);
          a.lane = 'floor';
          a.type = 'critter';
          a.canGrab = true;
          a.spd = 74 * sm;
        }
      } else if (a.type === 'flyer' || a.lane === 'air') {
        const toward = p.x < a.x ? -1 : 1;
        a.vx = lerp(a.vx, toward * a.spd, 0.05);
        a.x += a.vx * dt;
        a.y = lerp(a.y, midY(a.deck) - 16 + Math.sin(a.bob * 1.4) * 14, 0.08);
        a.lane = 'air';
        a.face = a.vx < 0 ? -1 : 1;
      } else if (a.type === 'roller') {
        a.x += a.vx * dt;
        a.y = floorY(a.deck);
        if (a.x < 24 || a.x > WORLD_W - 24) a.vx *= -1;
        a.face = a.vx < 0 ? -1 : 1;
        a.walk += dt * 14;
      } else {
        const toward = (a.deck === G.deck && Math.abs(p.y - a.y) < 90) ? (p.x < a.x ? -1 : 1) : (a.vx < 0 ? -1 : 1);
        a.vx = lerp(a.vx, toward * a.spd, 0.1);
        a.x += a.vx * dt;
        a.y = alienGroundY(a);
        if (a.x < 24 || a.x > WORLD_W - 24) a.vx *= -1;
        a.face = a.vx < 0 ? -1 : 1;
      }
      a.x = clamp(a.x, 20, WORLD_W - 20);

      if (G.deadT > 0 || G.riding) continue;
      if (G.mode === 'title') continue;
      if (a.deck !== G.deck && Math.abs(a.y - p.y) > 40) continue;
      const dx = a.x - p.x;
      const dy = a.y - (p.y - playerH() * 0.45);
      const dist = hypot(dx, dy);
      if (dist < a.r + 11) {
        if (a.canGrab) latchAlien(a);
        else bumpDamage(a.type === 'snot' ? 22 : 16, dx < 0 ? 1 : -1, a.type === 'roller' ? '被撞上了' : '被咬穿了');
      }
    }
  }

  function updateGrab(dt) {
    if (G.player.grab <= 0 || G.deadT > 0 || G.mode !== 'play') return;
    const rate = (G.kind === 'swarm' ? 30 : 22) * G.player.grab;
    G.hp -= rate * dt;
    G.stingT -= dt;
    if (G.stingT <= 0) {
      G.stingT = 0.34;
      audio.sting();
      screenFlash(MAG, 0.18);
      const track = hpWrap ? hpWrap.querySelector('.fill-track') : null;
      if (track) {
        track.classList.remove('sting');
        void track.offsetWidth;
        track.classList.add('sting');
      }
    }
    if (G.hp <= HP_LOW && !G.lowWarned) {
      G.lowWarned = true;
      toast('生命将尽', true, false);
    }
    if (G.hp <= 0) {
      G.hp = 0;
      killPlayer('被抓住了');
    }
  }

  function updateShots(dt) {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.alive) continue;
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.life <= 0 || s.x < -20 || s.x > WORLD_W + 20) {
        s.alive = false;
        continue;
      }
      const deck = deckOfY(s.y);
      const fy = floorY(deck);
      const cy = ceilY(deck) - 8;
      if (s.y > fy + 6 || s.y < cy) {
        s.alive = false;
        emit(3, {
          x: s.x, y: s.y, j: 2,
          vx0: -40, vx1: 40, vy0: -40, vy1: 20,
          life: 0.12, r0: 0.8, r1: 1.8, rgb: CYN, g: 0
        });
        continue;
      }
      for (let j = 0; j < G.aliens.length; j++) {
        const a = G.aliens[j];
        if (!a.alive) continue;
        const dy = s.y - (a.y - (a.lane === 'ceil' ? -4 : 8));
        if (hypot(s.x - a.x, dy) < a.r + 5) {
          s.alive = false;
          if (a.type === 'egg') hatchEgg(a, true);
          else hurtAlien(a, 1, s.x, s.y);
          break;
        }
      }
    }
    if (G.shots.length > 48) {
      G.shots = G.shots.filter(function (s) { return s.alive; });
    }
  }

  function updateItems(dt) {
    for (let i = 0; i < G.items.length; i++) {
      const it = G.items[i];
      if (!it.alive) continue;
      it.bob += dt * 3;
      if (G.mode !== 'play' || G.deadT > 0) continue;
      if (Math.abs(it.x - G.player.x) < 16 && Math.abs(it.y - (G.player.y - 12)) < 22 && it.deck === G.deck) {
        it.alive = false;
        G.hp = Math.min(HP_MAX, G.hp + 40);
        audio.kit();
        toast('急救包', false, true);
        spawnPop(it.x, it.y - 10, '+40', HOT);
        emit(10, {
          x: it.x, y: it.y, j: 6,
          vx0: -80, vx1: 80, vy0: -120, vy1: -10,
          life: 0.4, r0: 1.4, r1: 3.2, rgb: HOT, g: 80
        });
        kick('thump');
        G.lowWarned = G.hp <= HP_LOW;
        syncHud();
      }
    }
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.shake = Math.max(0, G.shake - dt * 28);
    G.punch = lerp(G.punch, 1, 0.18);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.t -= dt;
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (q.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= 28 * dt;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
  }

  function updateCam(dt) {
    const look = G.player.face * 46;
    const tx = clamp(G.player.x - VW * 0.42 + look, 0, Math.max(0, WORLD_W - VW));
    const ty = G.riding
      ? clamp(G.player.y - VH * 0.62, 0, Math.max(0, WORLD_H - VH))
      : deckTop(G.deck);
    G.camX = lerp(G.camX, tx, 1 - Math.pow(0.0008, dt));
    G.camY = lerp(G.camY, ty, G.riding ? 0.12 : 0.2);
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.45);
      return;
    }
    G.invuln = Math.max(0, G.invuln - dt);
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.ready = Math.max(0, G.ready - dt);

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      updateCam(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateAliens(dt);
      updateShots(dt);
      updateFx(dt);
      updateCam(dt);
      if (G.deadT <= 0) respawn();
      return;
    }

    updatePlayer(dt);
    updateAliens(dt);
    updateGrab(dt);
    updateShots(dt);
    updateItems(dt);
    updateFx(dt);
    updateCam(dt);
    if (G.mode === 'play') syncHud();
  }

  function wx(x) { return ox + (x - G.camX) * scale; }
  function wy(y) { return oy + (y - G.camY) * scale; }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 28; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.4, 1.5) * dpr,
        a: rand(0.03, 0.1),
        p: rand(0, 1)
      });
    }
  }

  function drawHull(deck) {
    const y0 = deckTop(deck);
    const x0 = G.camX - 8;
    const x1 = G.camX + VW + 8;
    const left = wx(x0);
    const top = wy(y0);
    const w = (x1 - x0) * scale;
    const h = DECK_H * scale;
    const g = ctx.createLinearGradient(0, top, 0, top + h);
    g.addColorStop(0, deck === 0 ? '#08140c' : deck === 1 ? '#0a120e' : '#0c100c');
    g.addColorStop(1, '#040806');
    ctx.fillStyle = g;
    ctx.fillRect(left, top, w, h);

    ctx.fillStyle = 'rgba(61,255,74,0.05)';
    ctx.fillRect(left, wy(y0 + 40), w, 2 * scale);
    ctx.fillRect(left, wy(floorY(deck)), w, 3 * scale);

    ctx.strokeStyle = 'rgba(61,255,74,0.12)';
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    for (let x = Math.floor(x0 / 48) * 48; x < x1; x += 48) {
      ctx.beginPath();
      ctx.moveTo(wx(x), wy(y0 + 42));
      ctx.lineTo(wx(x), wy(floorY(deck)));
      ctx.stroke();
    }

    const fy = wy(floorY(deck));
    ctx.fillStyle = '#0e1c12';
    ctx.fillRect(left, fy, w, (DECK_H - FLOOR) * scale);
    ctx.strokeStyle = 'rgba(61,255,74,0.22)';
    ctx.lineWidth = Math.max(1, scale);
    for (let x = Math.floor(x0 / 16) * 16; x < x1; x += 16) {
      ctx.beginPath();
      ctx.moveTo(wx(x), fy);
      ctx.lineTo(wx(x + 10), fy + 10 * scale);
      ctx.stroke();
    }

    const cy = wy(ceilY(deck));
    ctx.fillStyle = '#07140c';
    ctx.fillRect(left, top, w, (CEIL + 6) * scale);
    ctx.strokeStyle = 'rgba(0,240,255,0.14)';
    for (let x = Math.floor(x0 / 36) * 36; x < x1; x += 36) {
      ctx.beginPath();
      ctx.moveTo(wx(x + 8), cy);
      ctx.quadraticCurveTo(wx(x + 18), cy + 16 * scale, wx(x + 28), cy);
      ctx.stroke();
    }

    for (let r = 0; r < ROOMS; r++) {
      const rx = r * ROOM_W;
      if (rx > x1 || rx + ROOM_W < x0) continue;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(wx(rx) - 6 * scale, wy(y0 + 48), 12 * scale, (FLOOR - 48) * scale);
      ctx.fillStyle = 'rgba(0,240,255,0.18)';
      ctx.fillRect(wx(rx) - 3 * scale, wy(y0 + 70), 6 * scale, 70 * scale);
      ctx.fillRect(wx(rx) - 3 * scale, wy(floorY(deck) - 90), 6 * scale, 70 * scale);

      const wx0 = rx + 500;
      const wy0 = y0 + 70;
      ctx.fillStyle = '#03080a';
      ctx.fillRect(wx(wx0), wy(wy0), 90 * scale, 46 * scale);
      ctx.fillStyle = rgba(CYN, 0.08 + 0.04 * Math.sin(G.t * 2 + r));
      ctx.fillRect(wx(wx0) + 2 * scale, wy(wy0) + 2 * scale, 86 * scale, 42 * scale);
      ctx.fillStyle = rgba(WHT, 0.5);
      for (let s = 0; s < 8; s++) {
        const sx = wx0 + 10 + (s * 37 + r * 13) % 80;
        const sy = wy0 + 8 + (s * 19) % 32;
        ctx.fillRect(wx(sx), wy(sy), 1.2 * scale, 1.2 * scale);
      }

      const blink = 0.35 + 0.65 * (Math.sin(G.t * 5 + r * 2 + deck) > 0.2 ? 1 : 0.2);
      ctx.fillStyle = rgba(HOT, 0.25 * blink);
      ctx.beginPath();
      ctx.arc(wx(rx + 40), wy(y0 + 62), 3.2 * scale, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = 'rgba(255,61,184,0.12)';
    for (let x = Math.floor(x0 / 140) * 140; x < x1; x += 140) {
      const drip = 10 + (x * 0.07 + deck * 20) % 18;
      ctx.fillRect(wx(x + 70), wy(ceilY(deck)), 2 * scale, drip * scale);
    }
  }

  function drawElevator(deck) {
    const y0 = deckTop(deck);
    ctx.fillStyle = '#050a10';
    ctx.fillRect(wx(ELEV_X), wy(y0 + 40), ELEV_W * scale, (FLOOR - 40) * scale);
    ctx.strokeStyle = rgba(CYN, G.allClear ? 0.7 : 0.35);
    ctx.lineWidth = Math.max(1.4, 1.6 * scale);
    ctx.strokeRect(wx(ELEV_X), wy(y0 + 40), ELEV_W * scale, (FLOOR - 40) * scale);
    ctx.fillStyle = rgba(CYN, 0.08);
    ctx.fillRect(wx(ELEV_X + 6), wy(y0 + 50), (ELEV_W - 12) * scale, 8 * scale);
    ctx.strokeStyle = 'rgba(255,227,107,0.35)';
    ctx.lineWidth = Math.max(1, scale);
    ctx.beginPath();
    ctx.moveTo(wx(ELEV_CX), wy(y0 + 40));
    ctx.lineTo(wx(ELEV_CX), wy(floorY(deck)));
    ctx.stroke();
    const useY = (G.riding ? G.player.y : (G.deck === deck ? floorY(deck) : -999));
    if (useY > y0 && useY < y0 + DECK_H + 20) {
      ctx.fillStyle = rgba(GOLD, 0.2);
      ctx.fillRect(wx(ELEV_X + 4), wy(carY) - 4 * scale, (ELEV_W - 8) * scale, 6 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.strokeRect(wx(ELEV_X + 4), wy(carY - 38), (ELEV_W - 8) * scale, 38 * scale);
    }
    if (G.allClear && deck === 0) {
      ctx.fillStyle = rgba(GOLD, 0.55 + 0.25 * Math.sin(G.t * 6));
      ctx.font = 'bold ' + (9 * scale) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('撤离', wx(ELEV_CX), wy(y0 + 64));
    }
  }

  function drawPlats() {
    for (let i = 0; i < G.plats.length; i++) {
      const pl = G.plats[i];
      if (pl.floor) continue;
      if (pl.y < G.camY - 20 || pl.y > G.camY + VH + 20) continue;
      if (pl.x + pl.w < G.camX || pl.x > G.camX + VW) continue;
      const x = wx(pl.x);
      const y = wy(pl.y);
      ctx.fillStyle = '#102418';
      ctx.fillRect(x, y, pl.w * scale, 7 * scale);
      ctx.fillStyle = rgba(HOT, 0.45);
      ctx.fillRect(x, y, pl.w * scale, 2 * scale);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x + 4 * scale, y + 7 * scale, (pl.w - 8) * scale, 3 * scale);
      ctx.strokeStyle = 'rgba(61,255,74,0.2)';
      ctx.lineWidth = Math.max(1, 0.8 * scale);
      ctx.beginPath();
      ctx.moveTo(x + 6 * scale, y);
      ctx.lineTo(x + 6 * scale, y - 12 * scale);
      ctx.moveTo(x + (pl.w - 6) * scale, y);
      ctx.lineTo(x + (pl.w - 6) * scale, y - 12 * scale);
      ctx.stroke();
    }
  }

  function drawEgg(a) {
    const px = wx(a.x);
    const py = wy(a.y - (a.lane === 'ceil' ? -6 : 10));
    const pulse = 1 + 0.06 * Math.sin(G.t * 6 + a.x);
    const s = a.r * scale * pulse;
    ctx.save();
    ctx.translate(px, py);
    if (a.lane === 'ceil') ctx.scale(1, -1);
    ctx.fillStyle = rgba(PUR, 0.95);
    ctx.shadowColor = rgba(PUR, 0.7);
    ctx.shadowBlur = 10 * dpr;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.85, s, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = rgba(HOT2, 0.45);
    ctx.beginPath();
    ctx.ellipse(-s * 0.2, -s * 0.25, s * 0.28, s * 0.2, -0.4, 0, TAU);
    ctx.fill();
    if (a.hatch < 1.1) {
      ctx.strokeStyle = rgba(WHT, 0.7);
      ctx.lineWidth = Math.max(1, 0.8 * scale);
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, -s * 0.1);
      ctx.lineTo(0, s * 0.15);
      ctx.lineTo(s * 0.25, -s * 0.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCritter(a) {
    const px = wx(a.x);
    const py = wy(a.y - 8);
    const bob = Math.sin(a.walk) * 2 * scale;
    ctx.save();
    ctx.translate(px, py + bob);
    ctx.scale(a.face, 1);
    ctx.fillStyle = rgba(a.hurt > 0 ? WHT : a.rgb, 0.95);
    ctx.shadowColor = rgba(a.rgb, 0.7);
    ctx.shadowBlur = 8 * dpr;
    ctx.beginPath();
    ctx.ellipse(0, 0, a.r * scale, a.r * 0.72 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(HOT, 0.7);
    ctx.lineWidth = Math.max(1, 1.2 * scale);
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(-4 * scale, 4 * scale);
      ctx.lineTo((-8 + k * 2) * scale, 10 * scale + Math.sin(a.walk + k) * 2 * scale);
      ctx.stroke();
    }
    ctx.fillStyle = '#040c07';
    ctx.beginPath();
    ctx.arc(3 * scale, -2 * scale, 2.1 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.beginPath();
    ctx.arc(3.4 * scale, -2.2 * scale, 0.8 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawCrawler(a) {
    const px = wx(a.x);
    const py = wy(a.y);
    ctx.save();
    ctx.translate(px, py);
    if (a.lane === 'ceil') ctx.scale(1, -1);
    ctx.fillStyle = rgba(a.hurt > 0 ? WHT : MAG, 0.95);
    ctx.shadowColor = rgba(MAG, 0.75);
    ctx.shadowBlur = 10 * dpr;
    ctx.beginPath();
    ctx.ellipse(0, 4 * scale, a.r * scale, a.r * 0.7 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(MAG, 0.85);
    ctx.lineWidth = Math.max(1.2, 1.4 * scale);
    ctx.lineCap = 'round';
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(k * 3 * scale, 6 * scale);
      ctx.quadraticCurveTo(k * 6 * scale, 16 * scale, k * 4 * scale, 22 * scale + Math.sin(a.walk + k) * 3 * scale);
      ctx.stroke();
    }
    ctx.fillStyle = '#040c07';
    ctx.beginPath();
    ctx.arc(-3 * scale, 2 * scale, 1.8 * scale, 0, TAU);
    ctx.arc(3 * scale, 2 * scale, 1.8 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawRoller(a) {
    const px = wx(a.x);
    const py = wy(a.y - 8);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a.walk);
    ctx.fillStyle = rgba(a.hurt > 0 ? WHT : SLIME, 0.95);
    ctx.shadowColor = rgba(SLIME, 0.6);
    ctx.shadowBlur = 8 * dpr;
    ctx.beginPath();
    ctx.arc(0, 0, a.r * scale, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#040c07';
    ctx.lineWidth = Math.max(1.2, 1.5 * scale);
    ctx.beginPath();
    ctx.moveTo(-a.r * scale, 0);
    ctx.lineTo(a.r * scale, 0);
    ctx.stroke();
    ctx.fillStyle = '#040c07';
    ctx.beginPath();
    ctx.arc(3 * scale, -2 * scale, 1.6 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawFlyer(a) {
    const px = wx(a.x);
    const py = wy(a.y);
    const flap = Math.sin(a.walk * 2.2);
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(a.face, 1);
    ctx.fillStyle = rgba(a.rgb, 0.55);
    ctx.beginPath();
    ctx.ellipse(-2 * scale, -2 * scale, 12 * scale, (5 + flap * 3) * scale, -0.3, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-2 * scale, 4 * scale, 10 * scale, (4 - flap * 2) * scale, 0.25, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(a.hurt > 0 ? WHT : a.rgb, 0.95);
    ctx.shadowColor = rgba(a.rgb, 0.7);
    ctx.shadowBlur = 8 * dpr;
    ctx.beginPath();
    ctx.ellipse(2 * scale, 0, 7 * scale, 5.5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#040c07';
    ctx.beginPath();
    ctx.arc(5 * scale, -1 * scale, 1.6 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSnot(a) {
    const px = wx(a.x);
    const py = wy(a.y - 10);
    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = rgba(a.hurt > 0 ? WHT : YEL, 0.95);
    ctx.shadowColor = rgba(YEL, 0.55);
    ctx.shadowBlur = 10 * dpr;
    for (let k = 0; k < 3; k++) {
      const oxp = (k - 1) * 8 * scale * a.face;
      const bob = Math.sin(a.walk + k) * 2 * scale;
      ctx.beginPath();
      ctx.ellipse(oxp, bob, (9 - k) * scale, (8 - k * 0.6) * scale, 0, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#040c07';
    ctx.beginPath();
    ctx.arc(a.face * 8 * scale, -4 * scale, 2.2 * scale, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawAlien(a) {
    if (!a.alive) return;
    if (a.x < G.camX - 30 || a.x > G.camX + VW + 30) return;
    if (a.y < G.camY - 40 || a.y > G.camY + VH + 40) return;
    if (a.type === 'egg') drawEgg(a);
    else if (a.type === 'crawler') drawCrawler(a);
    else if (a.type === 'roller') drawRoller(a);
    else if (a.type === 'flyer') drawFlyer(a);
    else if (a.type === 'snot') drawSnot(a);
    else drawCritter(a);
  }

  function drawPlayer() {
    const p = G.player;
    if (G.deadT > 0) {
      const t = 1 - G.deadT / DIE_T;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.fillStyle = rgba(HOT, 0.8);
      ctx.beginPath();
      ctx.arc(wx(p.x), wy(p.y - 12), (8 + t * 22) * scale, 0, TAU);
      ctx.fill();
      ctx.restore();
      return;
    }
    const blink = G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0;
    if (blink && G.mode === 'play') return;
    const h = playerH();
    const px = wx(p.x);
    const py = wy(p.y);
    const swing = Math.sin(p.walk) * (p.on ? 1 : 0.2);
    ctx.save();
    ctx.translate(px, py);
    ctx.scale(p.face, 1);
    ctx.shadowColor = rgba(GOLD, 0.55);
    ctx.shadowBlur = 10 * dpr;
    ctx.fillStyle = rgba(GOLD, 0.96);
    ctx.fillRect(-5 * scale, -h * scale + 8 * scale, 10 * scale, (h - 10) * scale);
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.arc(0, -h * scale + 6 * scale, 6 * scale, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#040c07';
    ctx.fillRect(-3.4 * scale, -h * scale + 4 * scale, 6.8 * scale, 2.4 * scale);
    ctx.fillStyle = rgba(HOT, 0.9);
    ctx.fillRect(-4.6 * scale, -h * scale + 16 * scale, 9.2 * scale, 2 * scale);
    ctx.fillStyle = rgba(GOLD, 0.9);
    ctx.fillRect(-6 * scale, -8 * scale, 3.2 * scale, 8 * scale + swing * 3 * scale);
    ctx.fillRect(2.4 * scale, -8 * scale, 3.2 * scale, 8 * scale - swing * 3 * scale);
    const d = shotDir();
    ctx.strokeStyle = rgba(CYN, 0.95);
    ctx.lineWidth = Math.max(1.6, 2 * scale);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(4 * scale, -h * 0.55 * scale);
    ctx.lineTo((4 + d.x * p.face * 14) * scale, (-h * 0.55 + d.y * 10) * scale);
    ctx.stroke();
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle * 10);
      ctx.beginPath();
      ctx.arc((4 + d.x * p.face * 14) * scale, (-h * 0.55 + d.y * 10) * scale, 4 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    if (p.grab > 0) {
      ctx.save();
      ctx.strokeStyle = rgba(MAG, 0.85);
      ctx.lineWidth = Math.max(1.4, 1.6 * scale);
      ctx.beginPath();
      ctx.moveTo(px - 10 * scale, py - h * 0.6 * scale);
      ctx.lineTo(px + 12 * scale, py - h * 0.3 * scale);
      ctx.moveTo(px + 10 * scale, py - h * 0.7 * scale);
      ctx.lineTo(px - 8 * scale, py - h * 0.25 * scale);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!s.alive) continue;
      ctx.save();
      ctx.strokeStyle = rgba(CYN, 0.95);
      ctx.shadowColor = rgba(CYN, 0.8);
      ctx.shadowBlur = 8 * dpr;
      ctx.lineWidth = Math.max(2, 2.4 * scale);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(wx(s.x - s.vx * 0.02), wy(s.y - s.vy * 0.02));
      ctx.lineTo(wx(s.x), wy(s.y));
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawItems() {
    for (let i = 0; i < G.items.length; i++) {
      const it = G.items[i];
      if (!it.alive) continue;
      const bob = Math.sin(it.bob) * 3;
      const px = wx(it.x);
      const py = wy(it.y - 8 + bob);
      ctx.save();
      ctx.fillStyle = rgba(HOT, 0.9);
      ctx.shadowColor = rgba(HOT, 0.6);
      ctx.shadowBlur = 8 * dpr;
      ctx.fillRect(px - 6 * scale, py - 6 * scale, 12 * scale, 12 * scale);
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#040c07';
      ctx.fillRect(px - 1.4 * scale, py - 4.5 * scale, 2.8 * scale, 9 * scale);
      ctx.fillRect(px - 4.5 * scale, py - 1.4 * scale, 9 * scale, 2.8 * scale);
      ctx.restore();
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = q.t / q.life;
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(wx(q.x), wy(q.y), q.r * scale * (0.6 + 0.4 * a), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const u = r.t / 0.4;
      ctx.strokeStyle = rgba(r.rgb, 1 - u);
      ctx.lineWidth = Math.max(1, (2.2 - u * 1.6) * scale);
      ctx.beginPath();
      ctx.arc(wx(r.x), wy(r.y), (10 + u * 28) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.font = 'bold ' + (11 * scale) + 'px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      ctx.fillStyle = rgba(p.rgb, p.t / p.life);
      ctx.fillText(p.text, wx(p.x), wy(p.y));
    }
  }

  function drawMotes() {
    ctx.fillStyle = rgba(HOT, 0.5);
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = ox + ((m.x + G.t * 0.01 * m.p) % 1) * VW * scale;
      const y = oy + ((m.y + Math.sin(G.t * 0.3 + m.p) * 0.02) % 1) * VH * scale;
      ctx.globalAlpha = m.a;
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#040c07';
    ctx.fillRect(0, 0, W, H);

    const shx = REDUCE ? 0 : (G.shake > 0 ? (Math.random() - 0.5) * G.shake * scale * 0.35 : 0);
    const shy = REDUCE ? 0 : (G.shake > 0 ? (Math.random() - 0.5) * G.shake * scale * 0.28 : 0);
    ox += shx;
    oy += shy;

    ctx.save();
    ctx.beginPath();
    ctx.rect(ox - shx, oy - shy, VW * scale, VH * scale);
    ctx.clip();

    const d0 = Math.max(0, deckOfY(G.camY) - 1);
    const d1 = Math.min(DECKS - 1, deckOfY(G.camY + VH) + 1);
    for (let d = d0; d <= d1; d++) {
      drawHull(d);
      drawElevator(d);
    }
    drawPlats();
    drawMotes();
    drawItems();
    for (let i = 0; i < G.aliens.length; i++) drawAlien(G.aliens[i]);
    drawPlayer();
    drawShots();
    drawFx();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(ox - shx, oy - shy, VW * scale, VH * scale);
    }

    ctx.restore();
    ox -= shx;
    oy -= shy;

    ctx.strokeStyle = 'rgba(61,255,74,0.18)';
    ctx.lineWidth = Math.max(2, 2 * dpr);
    ctx.strokeRect(ox + 1, oy + 1, VW * scale - 2, VH * scale - 2);
  }

  function setKey(name, down) {
    keys[name] = down;
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    const isUp = k === 'ArrowUp' || k === 'w' || k === 'W' || code === 'KeyW';
    const isDn = k === 'ArrowDown' || k === 's' || k === 'S' || code === 'KeyS';
    const isLf = k === 'ArrowLeft' || k === 'a' || k === 'A' || code === 'KeyA';
    const isRt = k === 'ArrowRight' || k === 'd' || k === 'D' || code === 'KeyD';
    const isSp = k === ' ' || k === 'Spacebar' || code === 'Space';
    const isJ = k === 'z' || k === 'Z' || k === 'x' || k === 'X' || code === 'KeyZ' || code === 'KeyX';
    if (isUp || isDn || isLf || isRt || isSp || isJ) e.preventDefault();
    if (isUp) setKey('u', down);
    if (isDn) setKey('d', down);
    if (isLf) setKey('l', down);
    if (isRt) setKey('r', down);
    if (isJ) setKey('j', down);
    if (isSp) fireHold = down;
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
    if (e.repeat) return;
    if (k === '1') {
      audio.ensure();
      startGame('sweep');
      return;
    }
    if (k === '2') {
      audio.ensure();
      startGame('swarm');
      return;
    }
    if (isSp || k === 'Enter') {
      if (e.target && e.target.tagName === 'BUTTON') return;
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
    }
  }

  function bindPad(btn, dir) {
    if (!btn) return;
    const start = function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (dir === 'fire') {
        fireHold = true;
        if (!overlayBlocksPlay()) fireShot();
        btn.classList.add('held');
        return;
      }
      if (dir === 'jump') {
        setKey('j', true);
        jumpPad = true;
        G.jbuf = BUFFER;
        btn.classList.add('held');
        return;
      }
      if (dir === 'down') {
        setKey('d', true);
        btn.classList.add('held');
        return;
      }
      setKey(dir === 'left' ? 'l' : 'r', true);
      btn.classList.add('held');
    };
    const end = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (dir === 'fire') {
        fireHold = false;
        btn.classList.remove('held');
        return;
      }
      if (dir === 'jump') {
        setKey('j', false);
        jumpPad = false;
        btn.classList.remove('held');
        return;
      }
      if (dir === 'down') {
        setKey('d', false);
        btn.classList.remove('held');
        return;
      }
      setKey(dir === 'left' ? 'l' : 'r', false);
      btn.classList.remove('held');
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    seedMotes();
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    audio.ensure();
    canvas.focus();
    if (overlayOpen()) return;
    fireHold = true;
    fireShot();
  });
  canvas.addEventListener('pointerup', function () { fireHold = false; });
  canvas.addEventListener('pointercancel', function () { fireHold = false; });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = keys.j = false;
    fireHold = false;
    jumpPad = false;
  });

  if (btnSweep) btnSweep.addEventListener('click', function () { audio.ensure(); startGame('sweep'); });
  if (btnSwarm) btnSwarm.addEventListener('click', function () { audio.ensure(); startGame('swarm'); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (modeSweep) modeSweep.addEventListener('click', function () {
    audio.ensure();
    startGame('sweep');
  });
  if (modeSwarm) modeSwarm.addEventListener('click', function () {
    audio.ensure();
    startGame('swarm');
  });

  bindPad(padBtns.jump, 'jump');
  bindPad(padBtns.left, 'left');
  bindPad(padBtns.right, 'right');
  bindPad(padBtns.fire, 'fire');
  bindPad(padBtns.down, 'down');

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  window.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  loadBest();
  resize();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('左走右走 · 跳 · 射 · 电梯里跳上/按下');
  }

  let last = performance.now();
  let acc = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (hidden) {
      last = now;
      return;
    }
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * 5) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
