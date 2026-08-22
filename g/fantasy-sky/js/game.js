'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 20000;
  const BOMB_CAP = 5;
  const SPEED_CAP = 5;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.3;
  const STAGE_LEN = 2100;
  const SHOP_X = 960;
  const ROUND_T = 55;
  const BEST_KEY = 'playbox-fantasy-sky-best';
  const MUTE_KEY = 'playbox-fantasy-sky-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · C 智爆 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const PUR = [196, 107, 255];
  const WHT = [246, 240, 255];
  const LEAF = [156, 255, 122];
  const ORG = [255, 168, 72];
  const PNK = [255, 154, 212];
  const RED = [255, 92, 92];
  const DEEP = [16, 8, 28];

  const STAGES = [
    { name: '叶星', boss: '花球', bossHp: 82, seed: 1, sky: ['#16122a', '#102018', '#0c140e'] },
    { name: '沙星', boss: '沙塔', bossHp: 110, seed: 2, sky: ['#241018', '#1c100c', '#180e08'] },
    { name: '虹星', boss: '虹核', bossHp: 144, seed: 3, sky: ['#14081c', '#1a0828', '#0c0618'] }
  ];
  const BOSS_SCORE = [4000, 6000, 9000];

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
  const btnTour = document.getElementById('btn-tour');
  const btnRush = document.getElementById('btn-rush');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const coinsEl = document.getElementById('coins');
  const scoreBox = document.getElementById('score-box');
  const coinBox = document.getElementById('coin-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const timeWrap = document.getElementById('time-wrap');
  const timeBar = document.getElementById('time-bar');
  const timeNum = document.getElementById('time-num');
  const shopEl = document.getElementById('shop');
  const shopCoinsEl = document.getElementById('shop-coins');
  const shopLeave = document.getElementById('shop-leave');
  const slotTwin = document.querySelector('.slot[data-id="twin"]');
  const slotWide = document.querySelector('.slot[data-id="wide"]');
  const slotLaser = document.querySelector('.slot[data-id="laser"]');
  const slotSpeed = document.querySelector('.slot[data-id="speed"]');
  const slotBomb = document.querySelector('.slot[data-id="bomb"]');

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
  let inputSrc = 'key';

  const keys = { l: false, r: false, u: false, d: false, fire: false, bomb: false };
  const pointer = { down: false, hover: false, x: VW * 0.22, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const trails = [];
  const clouds = [];

  const G = {
    mode: 'title',
    kind: 'tour',
    t: 0,
    clock: 0,
    stage: 0,
    lives: LIVES,
    score: 0,
    best: 0,
    coins: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    cam: 0,
    spawnI: 0,
    spawns: [],
    ents: [],
    shots: [],
    eShots: [],
    loot: [],
    px: VW * 0.2,
    py: VH * 0.5,
    fireCd: 0,
    bombCd: 0,
    weapon: 'pea',
    speedLv: 0,
    bombs: 2,
    invuln: 0,
    deadT: 0,
    ready: 0,
    stop: 0,
    shake: 0,
    punch: 1,
    flash: 0,
    flashRgb: GOLD,
    muzzle: 0,
    powT: 0,
    boss: null,
    bossDone: false,
    clearT: 0,
    why: '',
    toastT: 0,
    padBomb: false,
    time: ROUND_T,
    timeMax: ROUND_T,
    timeOut: false,
    timeWarn: false,
    shopOpen: false,
    shopDone: false,
    shopEnt: null,
    shopAuto: 0
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
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function sx(x) {
    return ox + x * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }
  function isRush() {
    return G.kind === 'rush';
  }
  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }
  function hit(ax, ay, ar, bx, by, br) {
    const r = ar + br;
    return dist2(ax, ay, bx, by) <= r * r;
  }
  function hypot(dx, dy) {
    return Math.sqrt(dx * dx + dy * dy);
  }
  function mulberry(seed) {
    let s = seed | 0;
    return function () {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function thash(ix, iy) {
    let n = (ix * 374761393 + iy * 668265263) ^ ((STAGES[G.stage] ? STAGES[G.stage].seed : 1) * 127);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function worldX() {
    return G.cam + G.px;
  }
  function roundTime() {
    return isRush() ? 48 : ROUND_T;
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
      this.beep(G.weapon === 'laser' ? 420 : 880, 0.05, G.weapon === 'laser' ? 'sawtooth' : 'square', 0.03, G.weapon === 'laser' ? 1400 : 1760);
    },
    bomb() {
      this.ensure();
      this.beep(180, 0.12, 'sawtooth', 0.05, 60);
      this.noise(0.16, 0.06, 280);
      this.beep(520, 0.18, 'triangle', 0.04, 180);
    },
    coin() {
      this.ensure();
      const lift = 1 + Math.min(0.55, G.combo * 0.04);
      this.beep(990 * lift, 0.07, 'sine', 0.046, 1480 * lift);
      this.beep(1480 * lift, 0.09, 'triangle', 0.028, 1980 * lift);
    },
    jingle() {
      this.ensure();
      this.beep(523, 0.09, 'square', 0.045, 659);
      this.beep(659, 0.1, 'triangle', 0.04, 784);
      this.beep(784, 0.12, 'sine', 0.042, 1046);
      this.beep(1046, 0.2, 'triangle', 0.04, 1318);
    },
    buy() {
      this.ensure();
      this.beep(784, 0.08, 'square', 0.045, 1046);
      this.beep(1046, 0.12, 'triangle', 0.04, 1568);
      this.beep(1318, 0.16, 'sine', 0.036, 1760);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.5, combo * 0.03);
      this.noise(0.035, 0.034, 1200);
      this.beep(560 * lift, 0.06, 'square', 0.042, 900 * lift);
    },
    explode() {
      this.ensure();
      this.noise(0.1, 0.05, 480);
      this.beep(260, 0.14, 'sawtooth', 0.045, 70);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.055, 360);
      this.beep(320, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.3, 'sine', 0.045, 48);
    },
    extra() {
      this.ensure();
      this.beep(784, 0.1, 'square', 0.04, 1046);
      this.beep(1175, 0.16, 'sine', 0.04, 1568);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.3, 'sine', 0.05, 48);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.045, 659);
      this.beep(659, 0.12, 'triangle', 0.04, 784);
      this.beep(880, 0.18, 'sine', 0.05, 1175);
      this.beep(1318, 0.28, 'triangle', 0.04, 1760);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    miss() {
      this.ensure();
      this.beep(180, 0.05, 'sine', 0.016, 90);
    },
    stage() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(523, 0.11, 'sine', 0.04, 659);
      this.beep(784, 0.2, 'triangle', 0.045, 1046);
    },
    warn() {
      this.ensure();
      this.beep(880, 0.08, 'square', 0.04, 440);
      this.beep(440, 0.12, 'sawtooth', 0.035, 220);
    },
    bossHit() {
      this.ensure();
      this.beep(240, 0.06, 'sawtooth', 0.04, 160);
      this.beep(620, 0.08, 'square', 0.032, 880);
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
        if (tok === addTok) scoreAdd.hidden = true;
      }, 700);
    }
    while (G.score >= G.next1up && G.lives < LIFE_CAP) {
      G.lives += 1;
      G.next1up += LIFE_EVERY;
      audio.extra();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function addCoins(n) {
    if (n <= 0) return;
    G.coins += n;
    if (coinsEl) coinsEl.textContent = String(G.coins);
    if (coinBox) {
      coinBox.classList.remove('flash');
      void coinBox.offsetWidth;
      coinBox.classList.add('flash');
    }
    if (G.shopOpen) syncShop();
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = 1 + Math.min(4, Math.floor((G.combo - 1) / 3));
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
    comboTok += 1;
  }

  function toast(msg, warn, gold) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold);
    toastEl.classList.remove('hidden');
    toastTok += 1;
    const tok = toastTok;
    G.toastT = 1.15;
    setTimeout(function () {
      if (tok === toastTok) toastEl.classList.add('hidden');
    }, 1150);
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function flashSlot(el) {
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  function slotById(id) {
    if (id === 'twin') return slotTwin;
    if (id === 'wide') return slotWide;
    if (id === 'laser') return slotLaser;
    if (id === 'speed') return slotSpeed;
    if (id === 'bomb') return slotBomb;
    return null;
  }

  function syncPips() {
    if (!pipsEl) return;
    const n = LIFE_CAP;
    while (pips.length < n) {
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < n; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function syncPwr() {
    if (slotTwin) {
      slotTwin.classList.toggle('on', G.weapon === 'twin');
      slotTwin.classList.toggle('hot', G.weapon === 'twin' && G.powT > 0);
    }
    if (slotWide) {
      slotWide.classList.toggle('on', G.weapon === 'wide');
      slotWide.classList.toggle('hot', G.weapon === 'wide' && G.powT > 0);
    }
    if (slotLaser) {
      slotLaser.classList.toggle('on', G.weapon === 'laser');
      slotLaser.classList.toggle('hot', G.weapon === 'laser' && G.powT > 0);
    }
    if (slotSpeed) {
      slotSpeed.classList.toggle('on', G.speedLv > 0);
      slotSpeed.classList.toggle('hot', G.speedLv >= 3);
      slotSpeed.textContent = G.speedLv > 1 ? '速' + G.speedLv : '速';
    }
    if (slotBomb) {
      slotBomb.classList.toggle('on', G.bombs > 0);
      slotBomb.classList.toggle('hot', G.bombs >= 3);
      slotBomb.textContent = G.bombs > 0 ? '弹' + G.bombs : '弹';
    }
  }

  function fmtTime(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = (s / 60) | 0;
    const r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (coinsEl) coinsEl.textContent = String(G.coins);
    const st = STAGES[G.stage];
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '幻想';
      else if (G.boss) stageLabel.textContent = st.boss;
      else stageLabel.textContent = '第 ' + (G.stage + 1) + ' 星';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (!!G.boss || G.stage >= 2));
    }
    if (tagLabel) {
      let tag = isRush() ? '急行' : '巡游';
      if (G.mode === 'play' && G.shopOpen) tag = '进店';
      if (G.mode === 'play' && G.boss) tag = st.boss;
      if (G.mode === 'play' && G.time <= 10 && !G.boss) tag = '时限';
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || (G.time <= 10 && G.mode === 'play' && !G.shopOpen));
      tagLabel.classList.toggle('hot', G.combo >= 8 || G.shopOpen);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (timeNum) timeNum.textContent = fmtTime(G.mode === 'title' ? ROUND_T : G.time);
    if (timeBar) {
      const p = G.mode === 'title' ? 1 : clamp(G.time / Math.max(1, G.timeMax), 0, 1);
      timeBar.style.transform = 'scaleX(' + p + ')';
    }
    if (timeWrap) {
      timeWrap.classList.toggle('warn', G.mode === 'play' && G.time <= 10);
      timeWrap.classList.toggle('hot', G.mode === 'play' && G.boss);
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 中弹或相撞扣命', 'warn');
    else if (G.mode === 'win') setHint('通关 · R 再来 · 金币进店换武装', 'hot');
    else if (G.shopOpen) setHint('数字 1–6 选购 · 离开 / E / 空格 继续飞', 'hot');
    else if (G.boss) setHint('Boss · 空格射击 · C 智爆清弹', 'hot');
    else if (G.lives === 1) setHint('最后一命 · C 智爆能清场', 'warn');
    else if (G.time <= 10) setHint('时限将尽 · 清波或等 Boss', 'warn');
    else if (G.weapon !== 'pea') setHint('武装在身 · 打怪攒金币再进店', 'hot');
    else setHint(isRush() ? '急行无店 · 打怪攒分 · C 智爆' : '打怪掉金币 · 飞进杂货铺换武装', '');
    syncPips();
    syncPwr();
  }

  function shopPrice(id) {
    if (id === 'twin') return 800;
    if (id === 'wide') return 1800;
    if (id === 'laser') return 3200;
    if (id === 'speed') return 400 + G.speedLv * 400;
    if (id === 'life') return 2000;
    if (id === 'bomb') return 800;
    return 9999;
  }

  function shopOwned(id) {
    if (id === 'twin') return G.weapon === 'twin';
    if (id === 'wide') return G.weapon === 'wide';
    if (id === 'laser') return G.weapon === 'laser';
    if (id === 'speed') return G.speedLv >= SPEED_CAP;
    if (id === 'life') return G.lives >= LIFE_CAP;
    if (id === 'bomb') return G.bombs >= BOMB_CAP;
    return false;
  }

  function syncShop() {
    if (shopCoinsEl) shopCoinsEl.textContent = String(G.coins);
    const nodes = document.querySelectorAll('.shop-item');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const id = el.getAttribute('data-id');
      const price = shopPrice(id);
      const p = document.getElementById('p-' + id);
      if (p) p.textContent = shopOwned(id) ? '已满' : String(price);
      const have = (id === 'twin' && G.weapon === 'twin')
        || (id === 'wide' && G.weapon === 'wide')
        || (id === 'laser' && G.weapon === 'laser')
        || (id === 'speed' && G.speedLv > 0)
        || (id === 'bomb' && G.bombs > 0)
        || (id === 'life' && G.lives > LIVES);
      el.classList.toggle('have', have);
      el.classList.toggle('off', shopOwned(id) || G.coins < price);
    }
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'ZONE';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'win' || kind === 'lose';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
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
    const cls = mag >= 6 ? 'die' : mag >= 3.5 ? 'pow' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('pow');
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

  function burst(x, y, rgb, n, spd) {
    const count = REDUCE ? Math.min(6, n) : n;
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU);
      const v = rand(spd * 0.35, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        g: 180,
        life: rand(0.22, 0.52),
        max: 0.52,
        r: rand(1.2, 2.9),
        rgb: i % 3 === 0 ? WHT : rgb
      });
    }
    capArr(particles, 180);
  }

  function spark(x, y, rgb) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(sparks, 28);
  }

  function ring(x, y, rgb) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb });
    capArr(rings, 14);
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, t: 0, life: 0.72, vy: -48, text: text, rgb: rgb, size: 12 });
    capArr(floats, 22);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 72; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.78 ? 0.7 : 1.2,
        a: rand(0.18, 0.7),
        p: rand(0, TAU),
        v: rand(12, 48),
        par: rand(0.25, 1),
        rgb: Math.random() < 0.22 ? PUR : Math.random() < 0.18 ? CYN : Math.random() < 0.12 ? GOLD : WHT
      });
    }
    clouds.length = 0;
    for (let i = 0; i < 8; i++) {
      clouds.push({
        x: Math.random() * (STAGE_LEN + 400),
        y: 28 + Math.random() * 90,
        w: 30 + Math.random() * 36,
        a: rand(0.18, 0.4),
        p: rand(0, TAU)
      });
    }
  }

  function camSpeed() {
    if (G.shopOpen) return 0;
    if (G.shopEnt && !G.shopDone) return 72;
    if (G.boss) return 12;
    return isRush() ? 168 : 112;
  }

  function shipSpd() {
    return (isRush() ? 268 : 246) + G.speedLv * 42;
  }

  function buildSpawns(si, rush) {
    const st = STAGES[si];
    const rng = mulberry(st.seed * 104729 + (rush ? 17 : 3));
    const events = [];
    const dens = rush ? 0.62 : 1;
    const extra = rush ? 1 : 0;

    for (let x = 70; x < STAGE_LEN - 160; x += (128 * dens) + rng() * 52) {
      if (!rush && x > SHOP_X - 70 && x < SHOP_X + 160) continue;
      const roll = rng();
      const y = 0.22 + rng() * 0.56;
      if (roll < 0.28) events.push({ x: x, kind: 'fish', n: 3 + extra + (si > 0 ? 1 : 0), y: y });
      else if (roll < 0.46) events.push({ x: x, kind: 'bee', n: 2 + extra, y: y });
      else if (roll < 0.6) events.push({ x: x, kind: 'dart', n: 2 + extra, y: y });
      else if (roll < 0.74) events.push({ x: x, kind: 'blob', n: 1 + extra, y: y });
      else if (roll < 0.86) events.push({ x: x, kind: 'ring', n: 1 + extra, y: y });
      else events.push({ x: x, kind: 'turret', n: 1, y: 0.82 });
    }
    for (let x = 220; x < STAGE_LEN - 280; x += (420 * dens) + rng() * 80) {
      if (!rush && x > SHOP_X - 40 && x < SHOP_X + 140) continue;
      events.push({ x: x, kind: 'snake', n: 6 + extra + si, y: 0.4 + rng() * 0.3 });
    }
    if (rush) {
      for (let x = SHOP_X - 40; x < SHOP_X + 280; x += 90) {
        events.push({ x: x, kind: 'bee', n: 3, y: 0.3 + rng() * 0.4 });
        events.push({ x: x + 40, kind: 'dart', n: 2, y: 0.5 });
      }
    } else {
      events.push({ x: SHOP_X, kind: 'shop' });
    }
    events.sort(function (a, b) { return a.x - b.x; });
    return events;
  }

  function spawnCoin(x, y, value) {
    G.loot.push({
      x: x + rand(-8, 8),
      y: y + rand(-6, 6),
      vx: rand(-40, 70),
      vy: rand(-120, -20),
      v: value || 50,
      t: 0,
      life: 6.5,
      mag: false
    });
    capArr(G.loot, 48);
  }

  function dropCoins(e) {
    const n = e.coinsN || 1;
    const v = e.coinV || 50;
    for (let i = 0; i < n; i++) spawnCoin(e.x, e.y, v);
  }

  function spawnEnt(kind, x, y, extra) {
    const e = {
      type: kind,
      x: x,
      y: y,
      vx: -48,
      vy: 0,
      hp: 1,
      maxHp: 1,
      r: 12,
      score: 80,
      coinsN: 1,
      coinV: 50,
      phase: rand(0, TAU),
      t: 0,
      fireCd: rand(0.4, 1.4),
      hitFlash: 0,
      alive: true,
      segs: null
    };
    if (kind === 'fish') {
      e.vx = -42;
      e.r = 11;
      e.score = 80;
      e.coinV = 50;
    } else if (kind === 'bee') {
      e.vx = -56;
      e.r = 12;
      e.score = 120;
      e.coinV = 60;
      e.hp = 1;
    } else if (kind === 'blob') {
      e.vx = -32;
      e.hp = 2;
      e.maxHp = 2;
      e.r = 15;
      e.score = 160;
      e.coinsN = 2;
      e.coinV = 40;
    } else if (kind === 'dart') {
      e.vx = -196;
      e.r = 9;
      e.score = 100;
      e.coinV = 50;
    } else if (kind === 'turret') {
      e.vx = 0;
      e.hp = 3;
      e.maxHp = 3;
      e.r = 14;
      e.score = 180;
      e.coinsN = 2;
      e.coinV = 50;
    } else if (kind === 'ring') {
      e.vx = -38;
      e.hp = 2;
      e.maxHp = 2;
      e.r = 14;
      e.score = 150;
      e.coinsN = 2;
      e.coinV = 40;
    } else if (kind === 'snake') {
      e.vx = -70;
      e.score = 220;
      e.coinsN = 3;
      e.coinV = 40;
      e.r = 10;
      const n = extra && extra.n ? extra.n : 7;
      e.segs = [];
      for (let i = 0; i < n; i++) e.segs.push({ x: x + i * 14, y: y });
    }
    if (isRush() && e.hp > 1) e.hp += 1;
    e.maxHp = e.hp;
    if (extra) {
      for (const k in extra) {
        if (k !== 'n') e[k] = extra[k];
      }
    }
    G.ents.push(e);
    return e;
  }

  function spawnWave(ev) {
    if (ev.kind === 'shop') {
      spawnShop(ev.x);
      return;
    }
    const y = 40 + (ev.y || 0.5) * (VH - 90);
    const n = ev.n || 1;
    if (ev.kind === 'fish') {
      for (let i = 0; i < n; i++) {
        spawnEnt('fish', G.cam + VW + 24 + i * 28, y + Math.sin(i) * 26);
      }
    } else if (ev.kind === 'bee') {
      for (let i = 0; i < n; i++) {
        spawnEnt('bee', G.cam + VW + 18 + i * 22, clamp(y + (i - n * 0.5) * 22, 36, VH - 50));
      }
    } else if (ev.kind === 'dart') {
      for (let i = 0; i < n; i++) {
        spawnEnt('dart', G.cam + VW + 10 + i * 18, clamp(y + (i - n * 0.5) * 30, 40, VH - 48));
      }
    } else if (ev.kind === 'blob') {
      for (let i = 0; i < n; i++) spawnEnt('blob', G.cam + VW + 20 + i * 36, y);
    } else if (ev.kind === 'ring') {
      for (let i = 0; i < n; i++) spawnEnt('ring', G.cam + VW + 16 + i * 30, y);
    } else if (ev.kind === 'turret') {
      spawnEnt('turret', G.cam + VW - 8, VH - 58);
    } else if (ev.kind === 'snake') {
      spawnEnt('snake', G.cam + VW + 20, y, { n: n });
    }
  }

  function spawnShop(x) {
    if (G.mode !== 'play' || G.shopEnt || G.shopDone || isRush()) return;
    G.shopEnt = {
      x: G.cam + VW + 36,
      y: VH * 0.48,
      t: 0,
      leave: 0,
      open: false
    };
    G.shopAuto = 0;
    toast('杂货铺到了', false, true);
    audio.stage();
  }

  function spawnBoss() {
    if (G.mode !== 'play' || G.boss || G.bossDone) return;
    const st = STAGES[G.stage];
    const hp = (st.bossHp * (isRush() ? 1.22 : 1)) | 0;
    const variants = ['flower', 'pyramid', 'core'];
    G.boss = {
      type: 'boss',
      variant: variants[G.stage] || 'core',
      x: G.cam + VW + 80,
      y: VH * 0.5,
      vx: 0,
      hp: hp,
      maxHp: hp,
      r: 36,
      t: 0,
      fireCd: 1.05,
      hitFlash: 0,
      spin: 0,
      name: st.boss,
      alive: true,
      score: BOSS_SCORE[G.stage] || 4000
    };
    G.ents.push(G.boss);
    toast(st.boss + ' 来袭', false, true);
    audio.stage();
    kick(3);
    screenFlash(ORG, 0.35);
  }

  function enemyShot(x, y, vx, vy, r, fat) {
    G.eShots.push({
      x: x, y: y,
      vx: vx, vy: vy,
      r: r || 3.4,
      fat: !!fat
    });
    capArr(G.eShots, 110);
  }

  function aimShot(x, y, spd, spread, r) {
    const dx = worldX() - x;
    const dy = G.py - y;
    const d = hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx) + (spread || 0);
    enemyShot(x, y, Math.cos(ang) * spd, Math.sin(ang) * spd, r || 3.2, false);
  }

  function fireShot() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0.5 || G.shopOpen) return;
    if (G.fireCd > 0) return;
    const wx = worldX() + 16;
    const wy = G.py;
    G.muzzle = 0.06;
    if (G.weapon === 'laser') {
      G.fireCd = 0.15;
      G.shots.push({ x: wx, y: wy, vx: 760, vy: 0, r: 5, dmg: 2, pierce: 4, laser: true, life: 0.7 });
    } else if (G.weapon === 'twin') {
      G.fireCd = 0.1;
      G.shots.push({ x: wx, y: wy - 7, vx: 680, vy: 0, r: 3.2, dmg: 1, pierce: 0, laser: false, life: 0.7 });
      G.shots.push({ x: wx, y: wy + 7, vx: 680, vy: 0, r: 3.2, dmg: 1, pierce: 0, laser: false, life: 0.7 });
    } else if (G.weapon === 'wide') {
      G.fireCd = 0.13;
      const ang = 0.28;
      G.shots.push({ x: wx, y: wy, vx: 640, vy: 0, r: 3.2, dmg: 1, pierce: 0, laser: false, life: 0.7 });
      G.shots.push({ x: wx, y: wy, vx: Math.cos(ang) * 640, vy: Math.sin(ang) * 640, r: 3.1, dmg: 1, pierce: 0, laser: false, life: 0.7 });
      G.shots.push({ x: wx, y: wy, vx: Math.cos(-ang) * 640, vy: Math.sin(-ang) * 640, r: 3.1, dmg: 1, pierce: 0, laser: false, life: 0.7 });
    } else {
      G.fireCd = 0.12;
      G.shots.push({ x: wx, y: wy, vx: 660, vy: 0, r: 3.2, dmg: 1, pierce: 0, laser: false, life: 0.7 });
    }
    capArr(G.shots, 18);
    audio.shoot();
  }

  function fireBomb() {
    if (G.mode !== 'play' || G.deadT > 0 || G.ready > 0.5 || G.shopOpen) return;
    if (G.bombCd > 0) return;
    if (G.bombs <= 0) {
      G.bombCd = 0.35;
      audio.miss();
      toast('没有智爆', true, false);
      return;
    }
    G.bombCd = 0.55;
    G.bombs -= 1;
    syncPwr();
    audio.bomb();
    screenFlash(GOLD, 0.62);
    kick(6.4);
    hitStop(0.07);
    ring(worldX(), G.py, GOLD);
    burst(worldX(), G.py, GOLD, 28, 280);
    burst(worldX(), G.py, MAG, 16, 220);
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      if (s.x > G.cam - 20 && s.x < G.cam + VW + 20) {
        burst(s.x, s.y, CYN, 4, 80);
        G.eShots.splice(i, 1);
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (e.x < G.cam - 30 || e.x > G.cam + VW + 40) continue;
      hurtEnt(e, 8, true);
    }
    floatText(worldX(), G.py - 24, '智爆', GOLD);
    toast('智爆', false, true);
  }

  function powerFlash(rgb) {
    G.powT = 0.42;
    screenFlash(rgb, 0.5);
    kick(3.2);
    hitStop(0.04);
    ring(worldX(), G.py, rgb);
    burst(worldX(), G.py, rgb, 18, 220);
    if (stageEl) {
      stageEl.classList.remove('pow');
      void stageEl.offsetWidth;
      stageEl.classList.add('pow');
    }
  }

  function collectCoin(c) {
    addCoins(c.v);
    addScore(c.v);
    audio.coin();
    kick(1.4);
    floatText(c.x, c.y, '+' + c.v, GOLD);
    spark(c.x, c.y, GOLD);
    burst(c.x, c.y, GOLD, 8, 120);
  }

  function scoreKill(base, x, y, rgb) {
    bumpCombo();
    const n = base * G.mult;
    addScore(n);
    floatText(x, y, n >= 1000 ? '' + n : '+' + n, rgb || GOLD);
    audio.hit(G.combo);
    hitStop(0.042);
    kick(2.2);
    burst(x, y, rgb || ORG, 14, 200);
    spark(x, y, rgb || GOLD);
  }

  function killEnt(e) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.type === 'boss' ? MAG : e.type === 'bee' ? LEAF : e.type === 'ring' ? PUR : GOLD;
    scoreKill(e.score, e.x, e.y, rgb);
    ring(e.x, e.y, rgb);
    dropCoins(e);
    if (e.type === 'boss') {
      for (let i = 0; i < 12; i++) spawnCoin(e.x + rand(-30, 30), e.y + rand(-24, 24), 50);
      onBossDown();
    }
  }

  function hurtEnt(e, dmg, fromBomb) {
    if (!e.alive) return false;
    e.hp -= dmg || 1;
    e.hitFlash = 0.08;
    if (e.type === 'boss') audio.bossHit();
    if (e.hp <= 0) {
      killEnt(e);
      return true;
    }
    if (!fromBomb && e.type === 'boss') {
      burst(e.x - 10, e.y, MAG, 6, 90);
    }
    return false;
  }

  function onBossDown() {
    G.bossDone = true;
    G.boss = null;
    const left = Math.max(0, G.time);
    const bonus = ((left * 50) | 0) * (isRush() ? 1 : 1);
    if (bonus > 0 && !G.timeOut) {
      addScore(bonus);
      floatText(G.cam + VW * 0.5, VH * 0.36, '时限 +' + bonus, GOLD);
    }
    addScore(2000);
    audio.stage();
    toast(STAGES[G.stage].name + '肃清', false, true);
    G.clearT = 1.2;
    screenFlash(GOLD, 0.4);
  }

  function hitPlayer() {
    if (G.invuln > 0 || G.deadT > 0 || G.shopOpen || G.mode !== 'play') return;
    G.lives -= 1;
    G.weapon = 'pea';
    G.deadT = 0.92;
    G.invuln = 0;
    keys.fire = false;
    audio.death();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.072);
    burst(worldX(), G.py, MAG, 26, 260);
    ring(worldX(), G.py, MAG);
    syncPwr();
    syncPips();
  }

  function resetField() {
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.loot.length = 0;
    G.boss = null;
    G.bossDone = false;
    G.shopEnt = null;
    G.shopOpen = false;
    G.shopDone = false;
    G.shopAuto = 0;
    G.cam = 0;
    G.spawnI = 0;
    G.px = VW * 0.2;
    G.py = VH * 0.5;
    G.fireCd = 0;
    G.bombCd = 0;
    G.invuln = 0;
    G.deadT = 0;
    G.stop = 0;
    G.shake = 0;
    G.punch = 1;
    G.flash = 0;
    G.muzzle = 0;
    G.powT = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.clearT = 0;
    G.timeOut = false;
    G.timeWarn = false;
    hideShop();
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    trails.length = 0;
  }

  function setupStage(si) {
    G.stage = si;
    G.spawns = buildSpawns(si, isRush());
    G.spawnI = 0;
    G.cam = 0;
    G.boss = null;
    G.bossDone = false;
    G.clearT = 0;
    G.ready = 0.7;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.loot.length = 0;
    G.shopEnt = null;
    G.shopOpen = false;
    G.shopDone = isRush();
    G.shopAuto = 0;
    G.timeMax = roundTime();
    G.time = G.timeMax;
    G.timeOut = false;
    G.timeWarn = false;
    hideShop();
    const st = STAGES[si];
    toast((isRush() ? '急行 · ' : '') + st.name, false, si === 0);
  }

  function nextStage() {
    audio.stage();
    if (G.stage >= STAGES.length - 1) {
      winRun();
      return;
    }
    setupStage(G.stage + 1);
    G.invuln = Math.max(G.invuln, 0.85);
    syncHud();
  }

  function winRun() {
    if (G.mode !== 'play') return;
    addScore(isRush() ? 6000 : 5000);
    G.mode = 'win';
    hideShop();
    audio.win();
    screenFlash(GOLD, 0.55);
    kick(3);
    const title = isRush() ? '急行通关' : '幻想通关';
    const lead = STAGES[G.stage].name + '肃清  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('win', title, lead);
    syncHud();
  }

  function loseRun(why) {
    if (G.mode !== 'play') return;
    G.mode = 'lose';
    G.why = why;
    keys.fire = false;
    keys.bomb = false;
    hideShop();
    audio.lose();
    kick(7);
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    const lead = (why || '坠机了') + '  本局 ' + G.score + ' · 最高 ' + G.best;
    showOverlay('lose', '坠机了', lead);
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'rush' ? 'rush' : 'tour';
    G.mode = 'play';
    G.lives = LIVES;
    G.score = 0;
    G.coins = 0;
    G.why = '';
    G.clock = 0;
    G.weapon = 'pea';
    G.speedLv = 0;
    G.bombs = 2;
    G.next1up = LIFE_EVERY;
    resetField();
    setupStage(0);
    hideOverlay();
    audio.start();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'tour';
    G.stage = 0;
    G.lives = LIVES;
    G.score = 0;
    G.coins = 0;
    G.combo = 0;
    G.mult = 1;
    G.clock = 0;
    G.weapon = 'pea';
    G.speedLv = 0;
    G.bombs = 2;
    G.time = ROUND_T;
    G.timeMax = ROUND_T;
    resetField();
    G.spawns = buildSpawns(0, false);
    G.ready = 0;
    hideShop();
    showOverlay('title', '幻想', '打怪掉金币，进店换武装。空格射击，C 智爆。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('tour');
    else startGame(G.kind || 'tour');
  }

  function showShop() {
    if (!shopEl) return;
    G.shopOpen = true;
    shopEl.classList.remove('hidden');
    shopEl.setAttribute('aria-hidden', 'false');
    syncShop();
    audio.jingle();
    screenFlash(GOLD, 0.32);
    kick(2.4);
    toast('欢迎光临', false, true);
    syncHud();
  }

  function hideShop() {
    G.shopOpen = false;
    if (!shopEl) return;
    shopEl.classList.add('hidden');
    shopEl.setAttribute('aria-hidden', 'true');
  }

  function openShop() {
    if (G.shopOpen || G.shopDone || G.mode !== 'play') return;
    if (G.shopEnt) G.shopEnt.open = true;
    G.eShots.length = 0;
    showShop();
  }

  function leaveShop() {
    if (!G.shopOpen) return;
    hideShop();
    G.shopDone = true;
    G.invuln = Math.max(G.invuln, 0.8);
    if (G.shopEnt) G.shopEnt.leave = 0.01;
    toast('出发', false, true);
    audio.start();
    if (canvas && canvas.focus) canvas.focus();
    syncHud();
  }

  function buyItem(id) {
    if (!G.shopOpen) return;
    const price = shopPrice(id);
    if (shopOwned(id)) {
      audio.miss();
      toast('已经满了', true, false);
      return;
    }
    if (G.coins < price) {
      audio.miss();
      toast('金币不够', true, false);
      return;
    }
    G.coins -= price;
    if (coinsEl) coinsEl.textContent = String(G.coins);
    let rgb = GOLD;
    let label = '';
    if (id === 'twin') {
      G.weapon = 'twin';
      rgb = CYN;
      label = '双弹';
      flashSlot(slotTwin);
    } else if (id === 'wide') {
      G.weapon = 'wide';
      rgb = LEAF;
      label = '宽射';
      flashSlot(slotWide);
    } else if (id === 'laser') {
      G.weapon = 'laser';
      rgb = MAG;
      label = '激光';
      flashSlot(slotLaser);
    } else if (id === 'speed') {
      G.speedLv = Math.min(SPEED_CAP, G.speedLv + 1);
      rgb = RED;
      label = '加速 ' + G.speedLv;
      flashSlot(slotSpeed);
    } else if (id === 'life') {
      G.lives = Math.min(LIFE_CAP, G.lives + 1);
      rgb = GOLD;
      label = '续命';
      audio.extra();
    } else if (id === 'bomb') {
      G.bombs = Math.min(BOMB_CAP, G.bombs + 1);
      rgb = GOLD;
      label = '智爆 +1';
      flashSlot(slotBomb);
    }
    const el = document.querySelector('.shop-item[data-id="' + id + '"]');
    if (el) {
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    }
    audio.buy();
    powerFlash(rgb);
    floatText(worldX(), G.py - 18, label, rgb);
    toast(label, false, true);
    addScore(100);
    syncShop();
    syncHud();
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const spd = shipSpd();
    let ax = 0;
    let ay = 0;
    if (keys.l) ax -= 1;
    if (keys.r) ax += 1;
    if (keys.u) ay -= 1;
    if (keys.d) ay += 1;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover) && !G.shopOpen) {
      G.px = lerp(G.px, pointer.x, 1 - Math.exp(-dt * 14));
      G.py = lerp(G.py, pointer.y, 1 - Math.exp(-dt * 14));
    } else if (ax || ay) {
      const inv = ax && ay ? 0.7071 : 1;
      G.px += ax * spd * inv * dt;
      G.py += ay * spd * inv * dt;
    }
    G.px = clamp(G.px, 22, VW - 28);
    G.py = clamp(G.py, 28, VH - 36);

    if (!REDUCE && G.mode === 'play' && G.deadT <= 0) {
      trails.push({
        x: worldX() - 14,
        y: G.py,
        t: 0,
        rgb: G.weapon === 'laser' ? MAG : G.weapon === 'wide' ? LEAF : CYN
      });
      capArr(trails, 22);
    }
  }

  function updateSpawns() {
    while (G.spawnI < G.spawns.length && G.spawns[G.spawnI].x <= G.cam) {
      spawnWave(G.spawns[G.spawnI]);
      G.spawnI += 1;
    }
    if (!G.boss && !G.bossDone && G.cam >= STAGE_LEN) spawnBoss();
  }

  function updateShopEnt(dt) {
    const s = G.shopEnt;
    if (!s) return;
    s.t += dt;
    if (s.leave > 0) {
      s.leave += dt;
      s.y -= 90 * dt;
      s.x += 40 * dt;
      if (s.leave > 1.2) G.shopEnt = null;
      return;
    }
    if (G.shopOpen) return;
    if (G.deadT > 0) return;
    const sx0 = s.x - G.cam;
    if (hit(worldX(), G.py, 16, s.x, s.y, 28)) {
      openShop();
      return;
    }
    if (sx0 < VW * 0.58) {
      G.shopAuto += dt;
      if (G.shopAuto > 0.7) openShop();
    }
  }

  function updateSnake(e, dt) {
    const head = e.segs[0];
    head.x += e.vx * dt;
    e.t += dt;
    const ty = 70 + (0.5 + 0.5 * Math.sin(e.t * 1.6 + e.phase)) * (VH - 140);
    head.y += (ty - head.y) * Math.min(1, 4 * dt);
    for (let i = 1; i < e.segs.length; i++) {
      const p = e.segs[i - 1];
      const s = e.segs[i];
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      const d = hypot(dx, dy) || 1;
      const want = 13;
      if (d > want) {
        s.x += dx / d * (d - want);
        s.y += dy / d * (d - want);
      }
    }
    e.x = head.x;
    e.y = head.y;
    if (head.x < G.cam - 90) e.alive = false;
  }

  function updateBoss(e, dt) {
    e.t += dt;
    const targetX = G.cam + VW - (e.variant === 'pyramid' ? 120 : 108);
    e.x += (targetX - e.x) * Math.min(1, 1.5 * dt);
    const amp = e.variant === 'core' ? 54 : 48;
    const ty = VH * 0.5 + Math.sin(e.t * 0.75) * amp;
    e.y += (clamp(ty, 70, VH - 70) - e.y) * Math.min(1, 2.1 * dt);
    e.spin += dt * (e.hp < e.maxHp * 0.45 ? 1.9 : 1.1);
    e.fireCd -= dt;
    const angry = e.hp < e.maxHp * 0.45 || G.timeOut;
    const spd = (isRush() ? 210 : 168) * (angry ? 1.15 : 1);
    const rate = (isRush() ? 0.7 : 0.92) * (angry ? 0.68 : 1);
    if (e.variant === 'flower') {
      if (e.fireCd <= 0) {
        e.fireCd = rate;
        const n = angry ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const sp = (i - (n - 1) / 2) * 0.22;
          aimShot(e.x - 24, e.y, spd, sp, angry ? 3.8 : 3.2);
        }
      }
      if (angry && ((e.t * 0.38) | 0) !== (((e.t - dt) * 0.38) | 0)) {
        spawnEnt('bee', e.x - 10, e.y + rand(-20, 20));
      }
    } else if (e.variant === 'pyramid') {
      if (e.fireCd <= 0) {
        e.fireCd = rate * 0.85;
        const n = angry ? 6 : 4;
        for (let i = 0; i < n; i++) {
          const a = e.spin + i * (TAU / n);
          enemyShot(e.x + Math.cos(a) * 26, e.y + Math.sin(a) * 22, Math.cos(a + Math.PI) * spd * 0.7, Math.sin(a + Math.PI) * spd * 0.7, 3.4, i % 2 === 0);
        }
        if (angry) aimShot(e.x - 8, e.y + 16, spd, 0, 4);
      }
    } else {
      if (e.fireCd <= 0) {
        e.fireCd = angry ? 0.62 : 0.95;
        const n = angry ? 10 : 7;
        for (let i = 0; i < n; i++) {
          const a = e.spin * 0.45 + i * (TAU / n);
          enemyShot(e.x, e.y, Math.cos(a) * 150, Math.sin(a) * 150, i % 3 === 0 ? 4.2 : 3.2, i % 3 === 0);
        }
      }
      if (angry && ((e.t * 0.42) | 0) !== (((e.t - dt) * 0.42) | 0)) {
        spawnEnt('ring', e.x - 12, e.y);
      }
    }
  }

  function updateEnts(dt) {
    const raid = isRush() ? 1.25 : 1;
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive) {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.hitFlash > 0) e.hitFlash -= dt;
      if (e.type === 'snake') {
        updateSnake(e, dt);
        continue;
      }
      if (e.type === 'boss') {
        updateBoss(e, dt);
        continue;
      }
      e.t += dt;
      if (e.type === 'fish') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 3.1 + e.phase) * 42 * dt;
      } else if (e.type === 'bee') {
        e.x += e.vx * dt;
        const ty = G.py;
        e.y += (ty - e.y) * Math.min(1, 0.55 * dt);
        e.fireCd -= dt * raid;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 10 && e.x > G.cam) {
          e.fireCd = rand(1.15, 2.1) / raid;
          if (Math.random() < (isRush() ? 0.55 : 0.34)) {
            aimShot(e.x, e.y, isRush() ? 190 : 150, 0, 3);
          }
        }
      } else if (e.type === 'blob') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 4.2 + e.phase) * 90 * dt;
        e.y = clamp(e.y, 40, VH - 48);
      } else if (e.type === 'dart') {
        e.x += e.vx * dt;
      } else if (e.type === 'turret') {
        e.y = VH - 54;
        e.fireCd -= dt * raid;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 8 && e.x > G.cam) {
          e.fireCd = (isRush() ? 1.05 : 1.4) + Math.random() * 0.35;
          aimShot(e.x, e.y - 8, isRush() ? 200 : 160, rand(-0.08, 0.08), 3.3);
        }
      } else if (e.type === 'ring') {
        e.x += e.vx * dt;
        e.y += Math.sin(e.t * 2.2 + e.phase) * 36 * dt;
        e.fireCd -= dt * raid;
        if (e.fireCd <= 0 && e.x < G.cam + VW - 20) {
          e.fireCd = 1.6 / raid;
          if (Math.random() < 0.4) {
            const a = e.t;
            enemyShot(e.x, e.y, Math.cos(a) * 120, Math.sin(a) * 120, 3, false);
          }
        }
      }
      e.y = clamp(e.y, 24, VH - 28);
      if (e.x < G.cam - 80) e.alive = false;
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0 || s.x > G.cam + VW + 40 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let hitOne = false;
      for (let j = 0; j < G.ents.length; j++) {
        const e = G.ents[j];
        if (!e.alive) continue;
        if (e.type === 'snake' && e.segs) {
          let segHit = false;
          for (let k = e.segs.length - 1; k >= 0; k--) {
            const seg = e.segs[k];
            if (hit(s.x, s.y, s.r, seg.x, seg.y, 8)) {
              burst(seg.x, seg.y, PUR, 6, 90);
              if (k === 0) {
                if (hurtEnt(e, s.dmg || 1, false)) {
                  /* killed */
                } else {
                  e.segs.splice(e.segs.length - 1, 1);
                  if (e.segs.length <= 0) killEnt(e);
                }
              } else {
                e.segs.splice(k, 1);
                addScore(18 * G.mult);
                spawnCoin(seg.x, seg.y, 20);
              }
              segHit = true;
              break;
            }
          }
          if (segHit) {
            if (s.laser && s.pierce > 0) {
              s.pierce -= 1;
            } else {
              G.shots.splice(i, 1);
              hitOne = true;
            }
            break;
          }
          continue;
        }
        if (hit(s.x, s.y, s.r + (s.laser ? 4 : 0), e.x, e.y, e.r)) {
          const dead = hurtEnt(e, s.dmg || 1, false);
          if (s.laser && s.pierce > 0 && !dead) {
            s.pierce -= 1;
          } else if (s.laser && s.pierce > 0 && dead) {
            s.pierce -= 1;
          } else {
            G.shots.splice(i, 1);
            hitOne = true;
          }
          break;
        }
      }
      if (hitOne) continue;
    }
  }

  function updateEShots(dt) {
    const spd = G.time <= 10 && !G.boss ? 1.12 : 1;
    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt * spd;
      s.y += s.vy * dt * spd;
      if (s.x < G.cam - 30 || s.x > G.cam + VW + 40 || s.y < -20 || s.y > VH + 20) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.deadT <= 0 && G.invuln <= 0 && hit(s.x, s.y, s.r, worldX(), G.py, 8)) {
        G.eShots.splice(i, 1);
        hitPlayer();
      }
    }
  }

  function collideBodies() {
    if (G.deadT > 0 || G.invuln > 0 || G.shopOpen) return;
    const px = worldX();
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (e.type === 'snake' && e.segs) {
        for (let k = 0; k < e.segs.length; k++) {
          if (hit(px, G.py, 8, e.segs[k].x, e.segs[k].y, 8)) {
            hitPlayer();
            return;
          }
        }
        continue;
      }
      if (hit(px, G.py, 8, e.x, e.y, e.r * 0.78)) {
        hitPlayer();
        return;
      }
    }
  }

  function updateLoot(dt) {
    const px = worldX();
    for (let i = G.loot.length - 1; i >= 0; i--) {
      const c = G.loot[i];
      c.t += dt;
      c.vy += 220 * dt;
      if (c.vy > 90) c.vy = 90;
      const d = hypot(px - c.x, G.py - c.y);
      if (d < 54) {
        const pull = (54 - d) / 54;
        c.vx += (px - c.x) * 9 * pull * dt;
        c.vy += (G.py - c.y) * 9 * pull * dt;
      }
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      if (c.y > VH - 18) {
        c.y = VH - 18;
        c.vy *= -0.35;
        c.vx *= 0.85;
      }
      if (d < 16 && G.deadT <= 0) {
        collectCoin(c);
        G.loot.splice(i, 1);
        continue;
      }
      if (c.t > c.life || c.x < G.cam - 40) G.loot.splice(i, 1);
    }
  }

  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.powT > 0) G.powT -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.22) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.4) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t += dt;
      if (trails[i].t > 0.22) trails.splice(i, 1);
    }
  }

  function tickTime(dt) {
    if (G.shopOpen || G.deadT > 0 || G.ready > 0 || G.bossDone) return;
    G.time -= dt;
    if (!G.timeWarn && G.time <= 10) {
      G.timeWarn = true;
      audio.warn();
      toast('时限将尽', true, false);
    }
    if (G.time <= 0) {
      G.time = 0;
      if (!G.timeOut) {
        G.timeOut = true;
        if (!G.boss && !G.bossDone) {
          toast('时限到', true, false);
          spawnBoss();
        }
      }
    }
  }

  function playSim(dt) {
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.bombCd = Math.max(0, G.bombCd - dt);
    G.invuln = Math.max(0, G.invuln - dt);
    updatePlayer(dt);
    if (G.mode === 'play' && G.deadT <= 0 && !G.shopOpen) {
      if (keys.fire || pointer.down) fireShot();
    }
    if (G.ready > 0) {
      G.ready -= dt;
      updateShots(dt);
      updateLoot(dt);
      return;
    }
    if (G.shopOpen) {
      updateLoot(dt);
      return;
    }
    G.cam += camSpeed() * dt;
    updateSpawns();
    updateShopEnt(dt);
    updateEnts(dt);
    updateShots(dt);
    updateEShots(dt);
    updateLoot(dt);
    collideBodies();
    tickTime(dt);
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      G.cam += 70 * dt;
      updateSpawns();
      updateEnts(dt);
      if (G.ents.length < 5 && Math.random() < 0.03) {
        spawnEnt('fish', G.cam + VW + 20, 60 + Math.random() * 280);
      }
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateFx(dt);
      updateEnts(dt * 0.25);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.fireCd = Math.max(0, G.fireCd - dt);
      if (!G.shopOpen) {
        G.cam += camSpeed() * 0.45 * dt;
        updateEnts(dt);
        updateEShots(dt);
        updateShopEnt(dt);
      }
      updateLoot(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('坠机了');
          updateFx(dt);
          return;
        }
        G.px = VW * 0.2;
        G.py = VH * 0.5;
        G.invuln = 1.5;
        G.eShots.length = 0;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
      updateFx(dt);
      syncHud();
      return;
    }

    playSim(dt);

    if (G.mode === 'play' && G.clearT > 0) {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }

    updateFx(dt);
    syncHud();
  }

  function drawSky() {
    const c = ctx;
    const st = STAGES[G.stage] || STAGES[0];
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, st.sky[0]);
    g.addColorStop(0.55, st.sky[1]);
    g.addColorStop(1, st.sky[2]);
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const px = ((s.x - G.cam * s.par * 0.12) % VW + VW) % VW;
      const a = s.a * (0.4 + 0.6 * (0.5 + 0.5 * Math.sin(G.t * 1.6 + s.p)));
      c.fillStyle = rgba(s.rgb, a);
      c.beginPath();
      c.arc(sx(px), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
    }

    for (let i = 0; i < clouds.length; i++) {
      const cl = clouds[i];
      const x = cl.x - G.cam * 0.35;
      const wx = ((x % (VW + 80)) + (VW + 80)) % (VW + 80) - 40;
      const wob = Math.sin(G.t * 0.7 + cl.p) * 3;
      c.fillStyle = rgba(WHT, cl.a);
      c.beginPath();
      c.ellipse(sx(wx), sy(cl.y + wob), cl.w * scale, cl.w * 0.42 * scale, 0, 0, TAU);
      c.fill();
    }

    const TILE = 56;
    const start = Math.floor(G.cam / TILE) - 1;
    const cols = Math.ceil(VW / TILE) + 3;
    for (let col = 0; col < cols; col++) {
      const ix = start + col;
      const x = ix * TILE - G.cam;
      const h = thash(ix, G.stage + 3);
      const groundY = VH - 28 - h * 18;
      const rgb = G.stage === 0 ? LEAF : G.stage === 1 ? ORG : PUR;
      c.fillStyle = rgba(rgb, 0.18 + h * 0.16);
      c.beginPath();
      c.moveTo(sx(x), sy(VH));
      c.lineTo(sx(x), sy(groundY));
      c.quadraticCurveTo(sx(x + 28), sy(groundY - 10 - h * 16), sx(x + TILE), sy(groundY + 4));
      c.lineTo(sx(x + TILE), sy(VH));
      c.fill();
      if (h > 0.62) {
        c.fillStyle = rgba(rgb, 0.35);
        if (G.stage === 0) {
          c.beginPath();
          c.moveTo(sx(x + 18), sy(groundY));
          c.lineTo(sx(x + 26), sy(groundY - 22 - h * 10));
          c.lineTo(sx(x + 34), sy(groundY));
          c.fill();
        } else if (G.stage === 1) {
          c.beginPath();
          c.moveTo(sx(x + 26), sy(groundY - 26));
          c.lineTo(sx(x + 14), sy(groundY));
          c.lineTo(sx(x + 38), sy(groundY));
          c.fill();
        } else {
          c.strokeStyle = rgba(CYN, 0.45);
          c.lineWidth = Math.max(1, 1.4 * scale);
          c.beginPath();
          c.arc(sx(x + 24), sy(groundY - 16), 8 * scale, 0, TAU);
          c.stroke();
        }
      }
    }
  }

  function drawShip() {
    const c = ctx;
    if (G.deadT > 0) {
      const p = 1 - G.deadT / 0.92;
      c.fillStyle = rgba(MAG, 0.55 * (1 - p));
      c.beginPath();
      c.arc(sx(G.px), sy(G.py), (18 + p * 28) * scale, 0, TAU);
      c.fill();
      return;
    }
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    const flap = Math.sin(G.t * 14) * 3;
    c.save();
    c.translate(sx(G.px), sy(G.py));
    c.fillStyle = rgba(CYN, 0.55 + G.muzzle);
    c.beginPath();
    c.ellipse(-16 * scale, 0, (8 + Math.abs(flap)) * scale, 3.2 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(CYN, 0.8);
    c.beginPath();
    c.ellipse(-2 * scale, (-11 + flap * 0.2) * scale, 10 * scale, 4.2 * scale, -0.25, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(-2 * scale, (11 - flap * 0.2) * scale, 10 * scale, 4.2 * scale, 0.25, 0, TAU);
    c.fill();
    const body = G.weapon === 'laser' ? MAG : G.weapon === 'wide' ? LEAF : GOLD;
    c.fillStyle = rgba(body, 1);
    c.beginPath();
    c.ellipse(0, 0, 13 * scale, 10.5 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.35);
    c.beginPath();
    c.ellipse(-2 * scale, -3 * scale, 6 * scale, 3.2 * scale, -0.4, 0, TAU);
    c.fill();
    c.fillStyle = '#10081c';
    c.beginPath();
    c.arc(-2.4 * scale, -1.2 * scale, 1.7 * scale, 0, TAU);
    c.arc(4.2 * scale, -1.2 * scale, 1.7 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.arc(-1.8 * scale, -1.8 * scale, 0.55 * scale, 0, TAU);
    c.arc(4.8 * scale, -1.8 * scale, 0.55 * scale, 0, TAU);
    c.fill();
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle * 8);
      c.beginPath();
      c.arc(14 * scale, 0, 5 * scale, 0, TAU);
      c.fill();
    }
    if (G.weapon === 'laser') {
      c.fillStyle = rgba(MAG, 0.9);
      c.fillRect(10 * scale, -1.6 * scale, 8 * scale, 3.2 * scale);
    }
    c.restore();
  }

  function drawEnt(e) {
    const c = ctx;
    const x = e.x - G.cam;
    if (e.type !== 'boss' && e.type !== 'snake' && (x < -50 || x > VW + 50)) return;
    const flash = e.hitFlash > 0;
    if (e.type === 'snake' && e.segs) {
      for (let i = e.segs.length - 1; i >= 0; i--) {
        const s = e.segs[i];
        const sx0 = s.x - G.cam;
        const rgb = i === 0 ? GOLD : (i % 2 ? PUR : CYN);
        c.fillStyle = rgba(flash && i === 0 ? WHT : rgb, 0.95);
        c.beginPath();
        c.arc(sx(sx0), sy(s.y), (i === 0 ? 9 : 7) * scale, 0, TAU);
        c.fill();
        if (i === 0) {
          c.fillStyle = '#10081c';
          c.beginPath();
          c.arc(sx(sx0 - 2), sy(s.y - 2), 1.3 * scale, 0, TAU);
          c.fill();
        }
      }
      return;
    }
    if (e.type === 'boss') {
      drawBoss(e);
      return;
    }
    c.save();
    c.translate(sx(x), sy(e.y));
    if (e.type === 'fish') {
      c.fillStyle = rgba(flash ? WHT : CYN, 0.95);
      c.beginPath();
      c.ellipse(0, 0, 12 * scale, 7 * scale, 0, 0, TAU);
      c.fill();
      c.beginPath();
      c.moveTo(-10 * scale, 0);
      c.lineTo(-18 * scale, -6 * scale);
      c.lineTo(-18 * scale, 6 * scale);
      c.fill();
      c.fillStyle = '#10081c';
      c.beginPath();
      c.arc(4 * scale, -1 * scale, 1.4 * scale, 0, TAU);
      c.fill();
    } else if (e.type === 'bee') {
      c.fillStyle = rgba(flash ? WHT : LEAF, 0.95);
      c.beginPath();
      c.ellipse(0, 0, 10 * scale, 8 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(CYN, 0.7);
      c.beginPath();
      c.ellipse(-4 * scale, -8 * scale, 6 * scale, 3 * scale, -0.4, 0, TAU);
      c.fill();
      c.fillStyle = '#10081c';
      c.beginPath();
      c.arc(3 * scale, -1 * scale, 1.3 * scale, 0, TAU);
      c.fill();
    } else if (e.type === 'blob') {
      const wob = 1 + Math.sin(e.t * 6) * 0.08;
      c.fillStyle = rgba(flash ? WHT : PNK, 0.95);
      c.beginPath();
      c.ellipse(0, 0, 13 * scale * wob, 12 * scale / wob, 0, 0, TAU);
      c.fill();
      c.fillStyle = '#10081c';
      c.beginPath();
      c.arc(-3 * scale, -2 * scale, 1.5 * scale, 0, TAU);
      c.arc(4 * scale, -2 * scale, 1.5 * scale, 0, TAU);
      c.fill();
    } else if (e.type === 'dart') {
      c.fillStyle = rgba(flash ? WHT : MAG, 0.95);
      c.beginPath();
      c.moveTo(12 * scale, 0);
      c.lineTo(-10 * scale, -6 * scale);
      c.lineTo(-6 * scale, 0);
      c.lineTo(-10 * scale, 6 * scale);
      c.closePath();
      c.fill();
    } else if (e.type === 'turret') {
      c.fillStyle = rgba(flash ? WHT : ORG, 0.95);
      c.fillRect(-10 * scale, -6 * scale, 20 * scale, 14 * scale);
      c.beginPath();
      c.arc(0, -6 * scale, 7 * scale, Math.PI, 0);
      c.fill();
      c.fillStyle = rgba(MAG, 0.9);
      c.fillRect(-14 * scale, -3 * scale, 10 * scale, 4 * scale);
    } else if (e.type === 'ring') {
      c.strokeStyle = rgba(flash ? WHT : PUR, 0.95);
      c.lineWidth = Math.max(2, 3 * scale);
      c.beginPath();
      c.arc(0, 0, 11 * scale, 0, TAU);
      c.stroke();
      c.fillStyle = rgba(GOLD, 0.9);
      c.beginPath();
      c.arc(0, 0, 4 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawBoss(e) {
    const c = ctx;
    const x = e.x - G.cam;
    const flash = e.hitFlash > 0;
    c.save();
    c.translate(sx(x), sy(e.y));
    const hp = e.hp / e.maxHp;
    c.fillStyle = 'rgba(0,0,0,0.35)';
    c.fillRect(-28 * scale, -48 * scale, 56 * scale, 5 * scale);
    c.fillStyle = rgba(hp < 0.4 ? MAG : GOLD, 0.95);
    c.fillRect(-28 * scale, -48 * scale, 56 * hp * scale, 5 * scale);
    if (e.variant === 'flower') {
      c.fillStyle = rgba(flash ? WHT : MAG, 0.9);
      for (let i = 0; i < 6; i++) {
        const a = e.spin * 0.4 + i * (TAU / 6);
        c.beginPath();
        c.ellipse(Math.cos(a) * 22 * scale, Math.sin(a) * 18 * scale, 12 * scale, 8 * scale, a, 0, TAU);
        c.fill();
      }
      c.fillStyle = rgba(GOLD, 1);
      c.beginPath();
      c.arc(0, 0, 16 * scale, 0, TAU);
      c.fill();
      c.fillStyle = '#10081c';
      c.beginPath();
      c.arc(-5 * scale, -3 * scale, 2.2 * scale, 0, TAU);
      c.arc(5 * scale, -3 * scale, 2.2 * scale, 0, TAU);
      c.fill();
    } else if (e.variant === 'pyramid') {
      c.fillStyle = rgba(flash ? WHT : ORG, 0.95);
      c.beginPath();
      c.moveTo(0, -32 * scale);
      c.lineTo(30 * scale, 24 * scale);
      c.lineTo(-30 * scale, 24 * scale);
      c.closePath();
      c.fill();
      c.fillStyle = rgba(GOLD, 0.8);
      c.beginPath();
      c.moveTo(0, -18 * scale);
      c.lineTo(14 * scale, 16 * scale);
      c.lineTo(-14 * scale, 16 * scale);
      c.closePath();
      c.fill();
      c.fillStyle = '#10081c';
      c.beginPath();
      c.arc(-5 * scale, 4 * scale, 2.2 * scale, 0, TAU);
      c.arc(6 * scale, 4 * scale, 2.2 * scale, 0, TAU);
      c.fill();
    } else {
      c.fillStyle = rgba(flash ? WHT : PUR, 0.4);
      c.beginPath();
      c.arc(0, 0, 34 * scale, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(CYN, 0.85);
      c.lineWidth = Math.max(2, 3 * scale);
      c.beginPath();
      c.arc(0, 0, 28 * scale, e.spin, e.spin + 2.4);
      c.stroke();
      c.fillStyle = rgba(flash ? WHT : MAG, 0.95);
      c.beginPath();
      c.ellipse(0, 0, 18 * scale, 15 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 1);
      c.beginPath();
      c.arc(0, 0, 7 * scale, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawShopBuilding() {
    const s = G.shopEnt;
    if (!s) return;
    const x = s.x - G.cam;
    if (x < -80 || x > VW + 80) return;
    const c = ctx;
    const bob = Math.sin(s.t * 2.2) * 4;
    c.save();
    c.translate(sx(x), sy(s.y + bob));
    c.fillStyle = rgba(PUR, 0.28);
    c.beginPath();
    c.ellipse(0, 28 * scale, 28 * scale, 8 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.95);
    c.fillRect(-22 * scale, -10 * scale, 44 * scale, 32 * scale);
    c.fillStyle = rgba(MAG, 0.95);
    c.beginPath();
    c.moveTo(-26 * scale, -10 * scale);
    c.lineTo(0, -28 * scale);
    c.lineTo(26 * scale, -10 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.9);
    c.fillRect(-12 * scale, 4 * scale, 10 * scale, 16 * scale);
    c.fillRect(4 * scale, 2 * scale, 12 * scale, 10 * scale);
    c.fillStyle = rgba(GOLD, 1);
    c.font = '700 ' + (11 * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('店', 0, -16 * scale);
    c.restore();
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = s.x - G.cam;
      if (s.laser) {
        const g = c.createLinearGradient(sx(x - 18), sy(s.y), sx(x + 18), sy(s.y));
        g.addColorStop(0, rgba(MAG, 0.1));
        g.addColorStop(0.5, rgba(WHT, 0.95));
        g.addColorStop(1, rgba(CYN, 0.2));
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(sx(x), sy(s.y), 22 * scale, 4.4 * scale, 0, 0, TAU);
        c.fill();
      } else {
        c.fillStyle = rgba(G.weapon === 'wide' ? LEAF : CYN, 0.95);
        c.beginPath();
        c.ellipse(sx(x), sy(s.y), 7 * scale, 2.4 * scale, 0, 0, TAU);
        c.fill();
        c.fillStyle = rgba(WHT, 0.85);
        c.beginPath();
        c.arc(sx(x + 3), sy(s.y), 1.6 * scale, 0, TAU);
        c.fill();
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = s.x - G.cam;
      c.fillStyle = rgba(s.fat ? MAG : PNK, 0.95);
      c.beginPath();
      c.arc(sx(x), sy(s.y), (s.r + (s.fat ? 1.4 : 0)) * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.5);
      c.beginPath();
      c.arc(sx(x - 0.8), sy(s.y - 0.8), s.r * 0.35 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawLoot() {
    const c = ctx;
    for (let i = 0; i < G.loot.length; i++) {
      const coin = G.loot[i];
      const x = coin.x - G.cam;
      const spin = 0.65 + 0.35 * Math.abs(Math.sin(G.t * 8 + coin.t * 6));
      c.fillStyle = rgba(GOLD, 0.28);
      c.beginPath();
      c.arc(sx(x), sy(coin.y), 8 * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(GOLD, 1);
      c.beginPath();
      c.ellipse(sx(x), sy(coin.y), 6 * spin * scale, 6 * scale, 0, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.8);
      c.beginPath();
      c.ellipse(sx(x), sy(coin.y), 2.4 * spin * scale, 2.4 * scale, 0, 0, TAU);
      c.fill();
    }
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < trails.length; i++) {
      const t = trails[i];
      const a = 1 - t.t / 0.22;
      c.fillStyle = rgba(t.rgb, a * 0.45);
      c.beginPath();
      c.arc(sx(t.x - G.cam), sy(t.y), (3 + a * 2) * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(sx(p.x - G.cam), sy(p.y), p.r * scale * (0.6 + a), 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.22;
      c.strokeStyle = rgba(s.rgb, 1 - t);
      c.lineWidth = Math.max(1, (2.2 - t) * scale);
      c.beginPath();
      c.moveTo(sx(s.x - G.cam - 6), sy(s.y));
      c.lineTo(sx(s.x - G.cam + 6), sy(s.y));
      c.moveTo(sx(s.x - G.cam), sy(s.y - 6));
      c.lineTo(sx(s.x - G.cam), sy(s.y + 6));
      c.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / 0.4;
      c.strokeStyle = rgba(r.rgb, 1 - t);
      c.lineWidth = Math.max(1, 2.4 * scale * (1 - t));
      c.beginPath();
      c.arc(sx(r.x - G.cam), sy(r.y), ((r.r || 8) + t * 28) * scale, 0, TAU);
      c.stroke();
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(f.x - G.cam), sy(f.y));
    }
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#10081c';
    c.fillRect(0, 0, W, H);

    c.save();
    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = (Math.random() - 0.5) * G.shake * scale;
      shy = (Math.random() - 0.5) * G.shake * 0.7 * scale;
    }
    const punch = REDUCE ? 1 : G.punch;
    c.translate(W * 0.5 + shx, H * 0.5 + shy);
    c.scale(punch, punch);
    c.translate(-W * 0.5, -H * 0.5);

    drawSky();
    drawShopBuilding();
    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawLoot();
    drawShip();
    drawShots();
    drawFx();

    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb, G.flash * 0.5);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    c.restore();

    c.fillStyle = '#10081c';
    if (oy > 0) {
      c.fillRect(0, 0, W, oy);
      c.fillRect(0, oy + VH * scale, W, H);
    }
    if (ox > 0) {
      c.fillRect(0, 0, ox, H);
      c.fillRect(ox + VW * scale, 0, W, H);
    }
  }

  function resize() {
    if (!stageEl || !canvas) return;
    const r = stageEl.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pointerWorldX(e) {
    const r = canvas.getBoundingClientRect();
    return (e.clientX - r.left - ox) / scale;
  }
  function pointerWorldY(e) {
    const r = canvas.getBoundingClientRect();
    return (e.clientY - r.top - oy) / scale;
  }

  function setBombHeld(on) {
    G.padBomb = on;
    if (btnBomb) btnBomb.classList.toggle('held', on);
    if (btnPad) btnPad.classList.toggle('held', on);
  }

  function primaryAction() {
    audio.ensure();
    if (G.shopOpen) {
      leaveShop();
      return;
    }
    if (G.mode === 'title') {
      startGame('tour');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      inputSrc = 'key';
      if (down) e.preventDefault();
      return;
    }
    if (k === 'c' || k === 'C') {
      keys.bomb = down;
      setBombHeld(down);
      if (down) {
        e.preventDefault();
        audio.ensure();
        if (G.shopOpen) return;
        if (G.mode === 'play') fireBomb();
      }
      return;
    }
    if (space) {
      if (down) e.preventDefault();
    }
    if (!down) {
      if (space) keys.fire = false;
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
    if (G.shopOpen) {
      if (k === '1' || k === '2' || k === '3' || k === '4' || k === '5' || k === '6') {
        const map = { '1': 'twin', '2': 'wide', '3': 'laser', '4': 'speed', '5': 'life', '6': 'bomb' };
        buyItem(map[k]);
        return;
      }
      if (space || k === 'Enter' || k === 'e' || k === 'E') {
        leaveShop();
        return;
      }
      return;
    }
    if (k === '1' && overlayOpen() && G.mode === 'title') {
      startGame('tour');
      return;
    }
    if (k === '2' && overlayOpen() && G.mode === 'title') {
      startGame('rush');
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') {
        keys.fire = true;
        fireShot();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (G.shopOpen) return;
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 22, VW - 28);
      pointer.y = clamp(pointerWorldY(e), 28, VH - 36);
      inputSrc = 'ptr';
      keys.fire = true;
      if (G.mode === 'title') {
        startGame('tour');
        return;
      }
      if (G.mode === 'lose' || G.mode === 'win') {
        startGame(G.kind);
        return;
      }
      if (G.mode === 'play') fireShot();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 22, VW - 28);
      pointer.y = clamp(pointerWorldY(e), 28, VH - 36);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      keys.fire = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down) keys.fire = false;
    });
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function bindBombBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      setBombHeld(true);
      if (G.mode === 'play' && !G.shopOpen) fireBomb();
    });
    function up() { setBombHeld(false); }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
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
  bindBombBtn(btnBomb);
  bindBombBtn(btnPad);

  if (btnTour) {
    btnTour.addEventListener('click', function () {
      audio.ensure();
      startGame('tour');
    });
  }
  if (btnRush) {
    btnRush.addEventListener('click', function () {
      audio.ensure();
      startGame('rush');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'tour');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (shopLeave) {
    shopLeave.addEventListener('click', function () {
      audio.ensure();
      leaveShop();
    });
  }
  const shopBtns = document.querySelectorAll('.shop-item');
  for (let i = 0; i < shopBtns.length; i++) {
    shopBtns[i].addEventListener('click', function () {
      audio.ensure();
      buyItem(this.getAttribute('data-id'));
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
      keys.fire = false;
      keys.bomb = false;
      setBombHeld(false);
    }
  });

  requestAnimationFrame(frame);
})();
