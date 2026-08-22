'use strict';

(function () {
  const COLS = 13;
  const ROWS = 11;
  const EMPTY = 0;
  const HARD = 1;
  const SOFT = 2;
  const LIVES = 3;
  const FUSE = 2.05;
  const BLAST_LIFE = 0.4;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const RAD = 0.36;
  const P_SPD = 4.35;
  const BEST_KEY = 'playbox-bomb-maze-best';
  const MUTE_KEY = 'playbox-bomb-maze-mute';
  const AUTO_SPEED_KEY = 'playbox-bomb-maze-auto-speed';
  const AUTO_SPEED_NAME = ['', '慢', '中', '快', '极快'];
  const AUTO_TIME = [0, 0.7, 1, 1.45, 2.85];
  const AUTO_PLANT_WAIT = [0, 0.2, 0.07, 0, 0];
  const AUTO_OV_WAIT = [0, 0.85, 0.5, 0.22, 0.06];
  const DX = [0, 1, 0, -1];
  const DY = [-1, 0, 1, 0];
  const OPS = '方向键 / W S D 走 · 空格或点击放弹 · 拖动也能走 · A 自动 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 122, 28];
  const HOT2 = [255, 154, 68];
  const LIME = [61, 255, 136];

  const STAGES = [
    { name: '巷口', enemies: 2, hunt: 0, density: 0.3, spd: 1.52 },
    { name: '窄廊', enemies: 3, hunt: 0, density: 0.36, spd: 1.68 },
    { name: '十字', enemies: 3, hunt: 1, density: 0.4, spd: 1.82 },
    { name: '密墙', enemies: 4, hunt: 1, density: 0.5, spd: 1.9 },
    { name: '追影', enemies: 4, hunt: 2, density: 0.38, spd: 2.08 },
    { name: '火巷', enemies: 5, hunt: 2, density: 0.46, spd: 2.18 },
    { name: '连环', enemies: 5, hunt: 3, density: 0.5, spd: 2.32 },
    { name: '终爆', enemies: 6, hunt: 3, density: 0.54, spd: 2.48 }
  ];

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
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function idx(c, r) {
    return r * COLS + c;
  }
  function inb(c, r) {
    return c >= 0 && r >= 0 && c < COLS && r < ROWS;
  }
  function isHardCell(c, r) {
    if (c <= 0 || r <= 0 || c >= COLS - 1 || r >= ROWS - 1) return true;
    return (c % 2 === 0) && (r % 2 === 0);
  }
  function isSafeCell(c, r) {
    return (c === 1 && r === 1) || (c === 2 && r === 1) || (c === 1 && r === 2);
  }

  function blastCells(grid, c, r, range) {
    const cells = [{ c: c, r: r, core: true }];
    for (let d = 0; d < 4; d++) {
      for (let i = 1; i <= range; i++) {
        const nc = c + DX[d] * i;
        const nr = r + DY[d] * i;
        if (!inb(nc, nr)) break;
        const t = grid[idx(nc, nr)];
        if (t === HARD) break;
        cells.push({ c: nc, r: nr, core: false });
        if (t === SOFT) break;
      }
    }
    return cells;
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
    plant() {
      this.ensure();
      this.beep(140, 0.07, 'triangle', 0.05, 90);
      this.noise(0.05, 0.03, 400);
    },
    tick(pitch) {
      this.ensure();
      this.beep(pitch || 240, 0.045, 'square', 0.03);
    },
    boom(chain) {
      this.ensure();
      const n = Math.max(1, chain || 1);
      this.noise(0.1 + n * 0.03, 0.055 + n * 0.01, 300);
      this.beep(220 + n * 70, 0.14, 'sawtooth', 0.05, 70);
      this.beep(90, 0.18, 'sine', 0.06, 40);
    },
    wall() {
      this.ensure();
      this.noise(0.07, 0.045, 900);
      this.beep(320, 0.06, 'triangle', 0.03, 140);
    },
    kill() {
      this.ensure();
      this.beep(720, 0.08, 'square', 0.04, 180);
      this.beep(240, 0.12, 'sawtooth', 0.035, 80);
    },
    pickup() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1175);
    },
    hurt() {
      this.ensure();
      this.beep(180, 0.16, 'sawtooth', 0.05, 70);
      this.noise(0.1, 0.04, 500);
    },
    door() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.045, 784);
      this.beep(659, 0.16, 'triangle', 0.04);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.055);
      this.beep(659, 0.12, 'sine', 0.05);
      this.beep(784, 0.16, 'sine', 0.05);
      this.beep(1046, 0.28, 'triangle', 0.055, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.18, 'sawtooth', 0.04, 90);
      this.beep(140, 0.28, 'sine', 0.05, 50);
    },
    start() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 784);
    }
  };

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const btnCampaign = el('btn-campaign');
  const btnEndless = el('btn-endless');
  const ovAgain = el('ov-again');
  const ovMenu = el('ov-menu');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const btnAuto = el('btn-auto');
  const speedEl = el('speed');
  const speedLab = el('speed-lab');
  const modeCamp = el('mode-camp');
  const modeEnd = el('mode-end');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const comboEl = el('combo');
  const comboBox = el('combo-box');
  const stageLabel = el('stage-label');
  const tagLabel = el('tag-label');
  const pipsEl = el('pips');
  const toastEl = el('toast');
  const chainPop = el('chain-pop');
  const hintEl = el('hint');
  const stageEl = el('stage');
  const padEl = el('pad');
  const padBtns = {
    up: el('btn-up'),
    down: el('btn-down'),
    left: el('btn-left'),
    right: el('btn-right'),
    bomb: el('btn-bomb')
  };

  let W = 1;
  let H = 1;
  let dpr = 1;
  let cell = 32;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let chainTok = 0;
  let lastPress = 'right';
  let autoOn = false;
  let autoSpeed = 3;
  let autoWish = { x: 0, y: 0 };
  let autoGoal = null;
  let autoStuck = 0;
  let autoLastX = 1;
  let autoLastY = 1;
  let autoPlantWait = 0;
  let autoOvWait = 0;
  let autoReplan = 0;
  let autoDs = null;
  let autoDe = null;
  let autoSeen = null;
  let autoPrev = null;
  let autoQueue = null;

  const keys = { u: false, d: false, l: false, r: false };
  const ptr = { down: false, id: null, sx: 0, sy: 0, x: 0, y: 0, dragging: false, dirX: 0, dirY: 0 };
  const pips = [];
  const particles = [];
  const pops = [];
  const motes = [];

  const G = {
    mode: 'title',
    kind: 'campaign',
    t: 0,
    clock: 0,
    stage: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 1,
    comboT: 0,
    fire: 1,
    bombsMax: 1,
    grid: new Uint8Array(COLS * ROWS),
    bombs: [],
    blast: new Float32Array(COLS * ROWS),
    blastCore: new Uint8Array(COLS * ROWS),
    enemies: [],
    pickups: [],
    door: null,
    player: { x: 1, y: 1, face: 1, squash: 0 },
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    toastT: 0,
    waveWait: 0,
    dead: false
  };

  function selfCheck() {
    if (isHardCell(1, 1) || isHardCell(2, 1) || isHardCell(1, 2)) {
      throw new Error('start cells must be open');
    }
    if (!isHardCell(0, 0) || !isHardCell(COLS - 1, ROWS - 1) || !isHardCell(2, 2)) {
      throw new Error('hard walls / pillars missing');
    }
    const grid = new Uint8Array(COLS * ROWS);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isHardCell(c, r)) grid[idx(c, r)] = HARD;
      }
    }
    grid[idx(3, 1)] = SOFT;
    const cells = blastCells(grid, 1, 1, 3);
    let hitSoft = false;
    let pastSoft = false;
    let hitPillar = false;
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].c === 3 && cells[i].r === 1) hitSoft = true;
      if (cells[i].c === 4 && cells[i].r === 1) pastSoft = true;
      if (cells[i].c === 2 && cells[i].r === 2) hitPillar = true;
    }
    if (!hitSoft) throw new Error('blast must consume the first soft wall');
    if (pastSoft) throw new Error('blast must stop at soft wall');
    if (hitPillar) throw new Error('blast must not enter hard pillar');
    const far = blastCells(grid, 1, 1, 1);
    let reached = false;
    for (let i = 0; i < far.length; i++) if (far[i].c === 2 && far[i].r === 1) reached = true;
    if (!reached) throw new Error('range 1 must reach adjacent empty');
    return true;
  }

  if (!hasDom) {
    selfCheck();
    console.log('bomb-maze ok');
    return;
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
    try {
      localStorage.setItem(BEST_KEY, String(G.best));
    } catch (err) { /* ignore */ }
  }

  function addScore(n, x, y) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
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
    if (x != null) spawnPop(x, y, '+' + n, GOLD);
  }

  function toast(msg, warn, gold) {
    G.toastT = 1.45;
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', !!warn);
    toastEl.classList.toggle('gold', !!gold && !warn);
    toastEl.classList.remove('hidden');
  }

  function setHint(text, kind) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', kind === 'hot');
    hintEl.classList.toggle('warn', kind === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < LIVES) {
      const iel = document.createElement('i');
      iel.className = 'pip on';
      pipsEl.appendChild(iel);
      pips.push(iel);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncModes() {
    if (modeCamp) modeCamp.setAttribute('aria-pressed', G.kind === 'campaign' ? 'true' : 'false');
    if (modeEnd) modeEnd.setAttribute('aria-pressed', G.kind === 'endless' ? 'true' : 'false');
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    const liveBombs = liveBombCount();
    if (tagLabel) {
      tagLabel.textContent = '火 ' + G.fire + ' · 弹 ' + liveBombs + '/' + G.bombsMax;
      tagLabel.classList.toggle('warn', liveBombs >= G.bombsMax);
    }
    if (stageLabel) {
      if (G.kind === 'endless') {
        stageLabel.textContent = G.mode === 'title' ? '无尽' : ('无尽 第 ' + G.wave + ' 波');
      } else {
        const st = STAGES[G.stage] || STAGES[0];
        stageLabel.textContent = G.mode === 'title' ? '闯关' : ('闯关 ' + (G.stage + 1) + '/' + STAGES.length + ' · ' + st.name);
      }
      stageLabel.classList.toggle('hot', G.combo >= 2);
    }
    if (comboEl) comboEl.textContent = '×' + G.combo;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 2 && G.comboT > 0);
    syncPips();
    syncModes();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
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
      if (ovKicker) ovKicker.textContent = 'BOMB';
      if (ovTitle) ovTitle.textContent = '炸巷';
      if (ovLead) ovLead.innerHTML = '放炸弹，炸软墙，躲开自己的火和巷里的怪。<br />炸弹互炸会连环，越炸越爽。';
      if (ovOps) ovOps.textContent = OPS;
    } else if (kind === 'win') {
      if (ovKicker) ovKicker.textContent = 'CLEAR';
      if (G.kind === 'campaign' && G.stage >= STAGES.length - 1) {
        if (ovTitle) ovTitle.textContent = '全巷扫清';
        if (ovLead) ovLead.textContent = '八条巷都炸开了。分数 ' + G.score + '。';
        if (ovAgain) ovAgain.textContent = '再来一轮';
      } else {
        if (ovTitle) ovTitle.textContent = '巷清了';
        const st = STAGES[G.stage] || STAGES[0];
        if (ovLead) ovLead.textContent = st.name + ' 的怪全灭。门开了，你走了进去。';
        if (ovAgain) ovAgain.textContent = '下一关';
      }
      if (ovOps) ovOps.textContent = 'R 重开 · 空格下一关';
      if (ovMenu) ovMenu.textContent = '换模式';
    } else {
      if (ovKicker) ovKicker.textContent = 'DOWN';
      if (ovTitle) ovTitle.textContent = '炸到了';
      if (ovLead) ovLead.textContent = (G.kind === 'endless' ? ('撑到第 ' + G.wave + ' 波。') : '') + '分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '');
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

  function hitStop(chain) {
    if (autoOn && autoSpeed >= 4) return;
    if (REDUCE) return;
    const t = 0.034 + Math.min(0.046, Math.max(0, chain - 1) * 0.014);
    G.stop = Math.max(G.stop, t);
  }

  function emit(n, spec) {
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
    pops.push({ x: x, y: y, text: text, rgb: rgb, t: 0.8, life: 0.8 });
  }

  function showChain(n) {
    if (n < 2) return;
    G.combo = n;
    G.comboT = 0.9;
    if (comboEl) comboEl.textContent = '×' + n;
    if (comboBox) {
      comboBox.classList.remove('hot');
      void comboBox.offsetWidth;
      comboBox.classList.add('hot');
    }
    if (chainPop && !REDUCE) {
      chainTok += 1;
      const tok = chainTok;
      chainPop.textContent = '连环 ×' + n;
      chainPop.classList.remove('hidden');
      chainPop.style.animation = 'none';
      void chainPop.offsetWidth;
      chainPop.style.animation = '';
      setTimeout(function () {
        if (tok === chainTok) chainPop.classList.add('hidden');
      }, 720);
    } else {
      toast('连环 ×' + n, false, true);
    }
  }

  function liveBombCount() {
    let n = 0;
    for (let i = 0; i < G.bombs.length; i++) if (!G.bombs[i].dead) n += 1;
    return n;
  }

  function bombAt(c, r) {
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (!b.dead && b.c === c && b.r === r) return b;
    }
    return null;
  }

  function pickupAt(c, r) {
    for (let i = 0; i < G.pickups.length; i++) {
      const p = G.pickups[i];
      if (p.c === c && p.r === r) return p;
    }
    return null;
  }

  function solidTile(c, r, actor) {
    if (!inb(c, r)) return true;
    const t = G.grid[idx(c, r)];
    if (t === HARD || t === SOFT) return true;
    const b = bombAt(c, r);
    if (b) {
      if (actor && actor.passBomb === b) return false;
      return true;
    }
    return false;
  }

  function blockedPos(x, y, actor) {
    const c0 = Math.floor((x - RAD) + 0.5);
    const c1 = Math.floor((x + RAD) + 0.5);
    const r0 = Math.floor((y - RAD) + 0.5);
    const r1 = Math.floor((y + RAD) + 0.5);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (solidTile(c, r, actor)) return true;
      }
    }
    return false;
  }

  function moveAxis(actor, dx, dy, dist) {
    const steps = Math.max(1, Math.ceil(dist / 0.05));
    const step = dist / steps;
    for (let i = 0; i < steps; i++) {
      const nx = actor.x + dx * step;
      const ny = actor.y + dy * step;
      if (blockedPos(nx, ny, actor)) return false;
      actor.x = nx;
      actor.y = ny;
    }
    return true;
  }

  function slideMove(actor, wishX, wishY, speed, dt) {
    const dist = speed * dt;
    if (!wishX && !wishY) {
      const cx = Math.round(actor.x);
      const cy = Math.round(actor.y);
      const dx = cx - actor.x;
      const dy = cy - actor.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 0.002 && d < 0.48) {
        const t = Math.min(1, (dist * 1.6) / d);
        const nx = actor.x + dx * t;
        const ny = actor.y + dy * t;
        if (!blockedPos(nx, ny, actor)) {
          actor.x = nx;
          actor.y = ny;
        }
      }
      return;
    }
    if (wishX) {
      if (!moveAxis(actor, wishX, 0, dist)) {
        const ty = Math.round(actor.y);
        const nextC = Math.round(actor.x) + wishX;
        const upGap = !solidTile(nextC, ty - 1, actor) && !solidTile(Math.round(actor.x), ty - 1, actor);
        const dnGap = !solidTile(nextC, ty + 1, actor) && !solidTile(Math.round(actor.x), ty + 1, actor);
        if (actor.y > ty + 0.04 && (dnGap || !solidTile(nextC, Math.round(actor.y + 0.5), actor))) {
          moveAxis(actor, 0, 1, dist);
        } else if (actor.y < ty - 0.04 && (upGap || !solidTile(nextC, Math.round(actor.y - 0.5), actor))) {
          moveAxis(actor, 0, -1, dist);
        } else if (Math.abs(actor.y - ty) > 0.02) {
          moveAxis(actor, 0, actor.y > ty ? -1 : 1, dist);
        }
      }
    } else if (wishY) {
      if (!moveAxis(actor, 0, wishY, dist)) {
        const tx = Math.round(actor.x);
        const nextR = Math.round(actor.y) + wishY;
        const lfGap = !solidTile(tx - 1, nextR, actor) && !solidTile(tx - 1, Math.round(actor.y), actor);
        const rtGap = !solidTile(tx + 1, nextR, actor) && !solidTile(tx + 1, Math.round(actor.y), actor);
        if (actor.x > tx + 0.04 && (rtGap || !solidTile(Math.round(actor.x + 0.5), nextR, actor))) {
          moveAxis(actor, 1, 0, dist);
        } else if (actor.x < tx - 0.04 && (lfGap || !solidTile(Math.round(actor.x - 0.5), nextR, actor))) {
          moveAxis(actor, -1, 0, dist);
        } else if (Math.abs(actor.x - tx) > 0.02) {
          moveAxis(actor, actor.x > tx ? -1 : 1, 0, dist);
        }
      }
    }
  }

  function autoResetPlan() {
    autoGoal = null;
    autoWish.x = 0;
    autoWish.y = 0;
    autoStuck = 0;
    autoPlantWait = 0;
    autoReplan = 0;
  }

  function autoEnsureBuf() {
    if (autoDs) return;
    const n = COLS * ROWS;
    autoDs = new Float32Array(n);
    autoDe = new Float32Array(n);
    autoSeen = new Int16Array(n);
    autoPrev = new Int16Array(n);
    autoQueue = new Int16Array(n);
  }

  function autoStepTime() {
    return 1 / P_SPD;
  }

  function autoHazardHold() {
    let hold = 0.85;
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (b.dead && !b.pending) continue;
      const t = b.pending ? b.pending.wait : b.t;
      hold = Math.max(hold, t + BLAST_LIFE + 0.08);
    }
    return Math.min(hold, 2.7);
  }

  function autoRebuildDanger(extra) {
    autoEnsureBuf();
    const inf = 99;
    autoDs.fill(inf);
    autoDe.fill(0);
    for (let i = 0; i < G.blast.length; i++) {
      if (G.blast[i] > 0) {
        autoDs[i] = 0;
        autoDe[i] = G.blast[i];
      }
    }
    const list = [];
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (b.dead && !b.pending) continue;
      list.push({
        c: b.c,
        r: b.r,
        range: b.range,
        t: b.pending ? b.pending.wait : b.t
      });
    }
    if (extra) {
      list.push({
        c: extra.c,
        r: extra.r,
        range: extra.range != null ? extra.range : G.fire,
        t: extra.t != null ? extra.t : FUSE
      });
    }
    let changed = true;
    let guard = 0;
    while (changed && guard++ < 24) {
      changed = false;
      for (let i = 0; i < list.length; i++) {
        const cells = blastCells(G.grid, list[i].c, list[i].r, list[i].range);
        const hit = {};
        for (let k = 0; k < cells.length; k++) hit[idx(cells[k].c, cells[k].r)] = 1;
        for (let j = 0; j < list.length; j++) {
          if (i === j) continue;
          if (hit[idx(list[j].c, list[j].r)]) {
            const nt = list[i].t + 0.05;
            if (nt < list[j].t - 1e-4) {
              list[j].t = nt;
              changed = true;
            }
          }
        }
      }
    }
    for (let i = 0; i < list.length; i++) {
      const cells = blastCells(G.grid, list[i].c, list[i].r, list[i].range);
      const t0 = Math.max(0, list[i].t);
      const t1 = t0 + BLAST_LIFE;
      for (let k = 0; k < cells.length; k++) {
        const id = idx(cells[k].c, cells[k].r);
        if (t0 < autoDs[id]) autoDs[id] = t0;
        if (t1 > autoDe[id]) autoDe[id] = t1;
      }
    }
  }

  function autoSafeAt(c, r, t, hold) {
    if (!inb(c, r)) return false;
    const ds = autoDs[idx(c, r)];
    const de = autoDe[idx(c, r)];
    if (ds >= 90) return true;
    const t1 = t + (hold || 0);
    return t1 < ds - 0.05 || t > de + 0.02;
  }

  function autoWalkable(c, r, sc, sr) {
    if (!inb(c, r)) return false;
    const tile = G.grid[idx(c, r)];
    if (tile === HARD || tile === SOFT) return false;
    if (c === sc && r === sr) return true;
    if (bombAt(c, r)) return false;
    return true;
  }

  function autoNearEnemy(c, r, rad) {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead) continue;
      if (Math.abs(e.x - c) < rad && Math.abs(e.y - r) < rad) return true;
    }
    return false;
  }

  function autoUnwind(nid, sid) {
    const path = [];
    let cur = nid;
    let guard = 0;
    while (cur !== sid && cur >= 0 && guard++ < COLS * ROWS) {
      path.push({ c: cur % COLS, r: (cur / COLS) | 0 });
      cur = autoPrev[cur];
    }
    path.reverse();
    return path;
  }

  function autoBfs(sc, sr, pred, ignoreFire) {
    autoEnsureBuf();
    autoSeen.fill(-1);
    autoPrev.fill(-1);
    if (!inb(sc, sr)) return null;
    const sid = idx(sc, sr);
    let qh = 0;
    let qt = 0;
    autoQueue[qt++] = sid;
    autoSeen[sid] = 0;
    const step = autoStepTime();
    const allowFire = ignoreFire || G.invuln > 0.2;
    if (pred(sc, sr, 0, 0)) return [];
    while (qh < qt) {
      const id = autoQueue[qh++];
      const c = id % COLS;
      const r = (id / COLS) | 0;
      const d = autoSeen[id];
      for (let dir = 0; dir < 4; dir++) {
        const nc = c + DX[dir];
        const nr = r + DY[dir];
        if (!autoWalkable(nc, nr, sc, sr)) continue;
        const nid = idx(nc, nr);
        if (autoSeen[nid] >= 0) continue;
        const nt = (d + 1) * step;
        const ds = autoDs[nid];
        const de = autoDe[nid];
        const hold = autoStepTime() * 1.25;
        if (ds < 90 && nt + hold >= ds && nt < de) {
          if (!(allowFire && ds <= 0.02)) continue;
        }
        if (!allowFire && G.invuln <= 0 && autoNearEnemy(nc, nr, 0.48)) continue;
        autoSeen[nid] = d + 1;
        autoPrev[nid] = id;
        if (pred(nc, nr, d + 1, nt)) return autoUnwind(nid, sid);
        autoQueue[qt++] = nid;
      }
    }
    return null;
  }

  function autoPathTo(sc, sr, gc, gr, ignoreFire) {
    if (sc === gc && sr === gr) return [];
    return autoBfs(sc, sr, function (c, r) {
      return c === gc && r === gr;
    }, ignoreFire);
  }

  function autoReachable(sc, sr) {
    const out = [];
    autoBfs(sc, sr, function (c, r, d, t) {
      out.push({ c: c, r: r, d: d, t: t });
      return false;
    }, false);
    return out;
  }

  function autoFleePath(sc, sr) {
    autoRebuildDanger(null);
    const hold = autoHazardHold();
    let path = autoBfs(sc, sr, function (c, r, d, t) {
      return (d > 0 || (c !== sc || r !== sr)) && autoSafeAt(c, r, t, hold) && !autoNearEnemy(c, r, 0.62);
    }, true);
    if (path && path.length) return path;
    path = autoBfs(sc, sr, function (c, r, d, t) {
      return autoSafeAt(c, r, t, hold);
    }, true);
    if (path && path.length) return path;
    path = autoBfs(sc, sr, function (c, r, d, t) {
      return autoSafeAt(c, r, t, 0.55);
    }, true);
    if (path && path.length) return path;
    path = autoBfs(sc, sr, function (c, r, d, t) {
      return autoSafeAt(c, r, t, 0.12);
    }, true);
    return path || [];
  }

  function autoEscapeFromPlant(c, r) {
    autoRebuildDanger({ c: c, r: r, range: G.fire, t: FUSE });
    const path = autoBfs(c, r, function (gc, gr, d, t) {
      if (gc === c && gr === r) return false;
      return autoSafeAt(gc, gr, t, 0.55) && !autoNearEnemy(gc, gr, 0.55);
    }, false);
    if (path && path.length) return path;
    const path2 = autoBfs(c, r, function (gc, gr, d, t) {
      if (gc === c && gr === r) return false;
      return autoSafeAt(gc, gr, t, 0.45);
    }, false);
    if (path2 && path2.length) return path2;
    return autoBfs(c, r, function (gc, gr, d, t) {
      if (gc === c && gr === r) return false;
      return t < FUSE - 0.4 && autoSafeAt(gc, gr, t, 0.2);
    }, true);
  }

  function autoScorePlant(c, r, dist) {
    if (!inb(c, r) || G.grid[idx(c, r)] !== EMPTY) return null;
    if (G.blast[idx(c, r)] > 0) return null;
    if (bombAt(c, r)) return null;
    const cells = blastCells(G.grid, c, r, G.fire);
    const esc = autoEscapeFromPlant(c, r);
    if (!esc || !esc.length) return null;
    const last = esc[esc.length - 1];
    if (!autoSafeAt(last.c, last.r, esc.length * autoStepTime(), 0.4)) return null;
    let score = 4;
    let kills = 0;
    let walls = 0;
    const hit = {};
    for (let i = 0; i < cells.length; i++) {
      const cc = cells[i];
      hit[idx(cc.c, cc.r)] = 1;
      if (G.grid[idx(cc.c, cc.r)] === SOFT) {
        walls += 1;
        score += 20;
      }
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead) continue;
      const ec = Math.round(e.x);
      const er = Math.round(e.y);
      if (hit[idx(ec, er)]) {
        kills += 1;
        score += 280;
      } else {
        for (let d = 0; d < 4; d++) {
          const ac = ec + DX[d];
          const ar = er + DY[d];
          if (inb(ac, ar) && hit[idx(ac, ar)]) {
            score += 42;
            break;
          }
        }
      }
      const md = Math.abs(ec - c) + Math.abs(er - r);
      if (md <= G.fire + 2) score += Math.max(0, 10 - md);
    }
    for (let i = 0; i < G.pickups.length; i++) {
      const p = G.pickups[i];
      if (hit[idx(p.c, p.r)]) score -= 24;
    }
    if (autoNearEnemy(c, r, 0.78) && G.invuln <= 0) score -= 140;
    const standT = dist * autoStepTime();
    if (!autoSafeAt(c, r, standT, 0.4)) return null;
    score -= dist * 3.2;
    if (!kills && !walls) return null;
    return { c: c, r: r, score: score, escape: esc, kills: kills, walls: walls };
  }

  function autoBreakToward(sc, sr, gc, gr) {
    autoEnsureBuf();
    autoSeen.fill(0);
    autoPrev.fill(-1);
    let qh = 0;
    let qt = 0;
    const sid = idx(sc, sr);
    autoQueue[qt++] = sid;
    autoSeen[sid] = 1;
    let found = -1;
    let foundSoft = false;
    while (qh < qt) {
      const id = autoQueue[qh++];
      const c = id % COLS;
      const r = (id / COLS) | 0;
      if (c === gc && r === gr && !foundSoft) {
        found = id;
        break;
      }
      for (let d = 0; d < 4; d++) {
        const nc = c + DX[d];
        const nr = r + DY[d];
        if (!inb(nc, nr)) continue;
        const nid = idx(nc, nr);
        if (autoSeen[nid]) continue;
        const tile = G.grid[nid];
        if (tile === HARD) continue;
        if (bombAt(nc, nr) && !(nc === sc && nr === sr)) continue;
        autoSeen[nid] = 1;
        autoPrev[nid] = id;
        if (tile === SOFT) {
          found = nid;
          foundSoft = true;
          qh = qt;
          break;
        }
        autoQueue[qt++] = nid;
      }
    }
    if (found < 0) return null;
    if (!foundSoft) {
      autoRebuildDanger(null);
      const path = autoPathTo(sc, sr, gc, gr, false);
      if (!path) return null;
      return { c: gc, r: gr, plant: false, path: path };
    }
    const standId = autoPrev[found];
    if (standId < 0) return null;
    const standC = standId % COLS;
    const standR = (standId / COLS) | 0;
    autoRebuildDanger(null);
    const path = autoPathTo(sc, sr, standC, standR, false);
    if (!path) return null;
    const scored = autoScorePlant(standC, standR, path.length);
    if (!scored) return null;
    return { c: standC, r: standR, plant: true, path: path, escape: scored.escape, wall: true };
  }

  function autoNearestSoftStand(sc, sr) {
    let best = null;
    let bestD = 99;
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (G.grid[idx(c, r)] !== SOFT) continue;
        for (let d = 0; d < 4; d++) {
          const nc = c + DX[d];
          const nr = r + DY[d];
          if (!inb(nc, nr) || G.grid[idx(nc, nr)] !== EMPTY) continue;
          if (bombAt(nc, nr)) continue;
          const md = Math.abs(nc - sc) + Math.abs(nr - sr);
          if (md < bestD) {
            bestD = md;
            best = { c: nc, r: nr };
          }
        }
      }
    }
    if (!best) return null;
    return autoBreakToward(sc, sr, best.c, best.r);
  }

  function autoPickGoal(pc, pr) {
    autoRebuildDanger(null);
    if (G.door) {
      const p = autoPathTo(pc, pr, G.door.c, G.door.r, false);
      const doorHold = Math.max(0.4, liveBombCount() ? autoHazardHold() : 0.4);
      if (p && autoSafeAt(G.door.c, G.door.r, p.length * autoStepTime(), doorHold)) {
        return { c: G.door.c, r: G.door.r, plant: false, path: p, door: true };
      }
      if (liveBombCount() === 0) {
        const br = autoBreakToward(pc, pr, G.door.c, G.door.r);
        if (br) return br;
      }
    }

    let bestPick = null;
    let bestPickD = 99;
    for (let i = 0; i < G.pickups.length; i++) {
      const p = G.pickups[i];
      const path = autoPathTo(pc, pr, p.c, p.r, false);
      if (!path) continue;
      if (path.length < bestPickD && autoSafeAt(p.c, p.r, path.length * autoStepTime(), 0.25)) {
        bestPickD = path.length;
        bestPick = { c: p.c, r: p.r, plant: false, path: path, pickup: true };
      }
    }

    const bombsOut = liveBombCount();
    if (bombsOut >= G.bombsMax) {
      const hold = autoHazardHold();
      if (autoSafeAt(pc, pr, 0, hold) && !autoNearEnemy(pc, pr, 0.7)) {
        return { c: pc, r: pr, plant: false, path: [], wait: true };
      }
      const flee = autoFleePath(pc, pr);
      if (flee && flee.length) {
        return {
          c: flee[flee.length - 1].c,
          r: flee[flee.length - 1].r,
          plant: false,
          path: flee,
          flee: true
        };
      }
    }
    if (bombsOut < G.bombsMax) {
      const reach = autoReachable(pc, pr);
      let best = null;
      for (let i = 0; i < reach.length; i++) {
        const s = reach[i];
        const scored = autoScorePlant(s.c, s.r, s.d);
        if (!scored) continue;
        if (!best || scored.score > best.score) best = scored;
      }
      if (best && best.score >= 12) {
        const path = autoPathTo(pc, pr, best.c, best.r, false);
        if (path) {
          return {
            c: best.c,
            r: best.r,
            plant: true,
            path: path,
            escape: best.escape,
            score: best.score,
            kills: best.kills
          };
        }
      }
    }

    let ne = null;
    let nd = 1e9;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead) continue;
      const d = Math.abs(e.x - G.player.x) + Math.abs(e.y - G.player.y);
      if (d < nd) {
        nd = d;
        ne = e;
      }
    }
    if (ne) {
      const tc = Math.round(ne.x);
      const tr = Math.round(ne.y);
      const br = autoBreakToward(pc, pr, tc, tr);
      if (br && br.plant) return br;
    }

    if (bestPick && bestPickD <= 8) return bestPick;

    const wall = autoNearestSoftStand(pc, pr);
    if (wall) return wall;

    let softGoal = null;
    let softD = 99;
    const reach2 = bombsOut < G.bombsMax ? autoReachable(pc, pr) : [];
    for (let i = 0; i < reach2.length; i++) {
      const s = reach2[i];
      for (let d = 0; d < 4; d++) {
        const nc = s.c + DX[d];
        const nr = s.r + DY[d];
        if (!inb(nc, nr) || G.grid[idx(nc, nr)] !== SOFT) continue;
        if (s.d < softD && autoSafeAt(s.c, s.r, s.t, 0.35)) {
          softD = s.d;
          softGoal = s;
        }
      }
    }
    if (softGoal) {
      const path = autoPathTo(pc, pr, softGoal.c, softGoal.r, false) || [];
      return { c: softGoal.c, r: softGoal.r, plant: true, path: path, wall: true };
    }

    if (bestPick) return bestPick;

    if (bombsOut > 0) {
      const flee = autoFleePath(pc, pr);
      if (flee && flee.length) return { c: flee[flee.length - 1].c, r: flee[flee.length - 1].r, plant: false, path: flee, flee: true };
    }
    return { c: pc, r: pr, plant: false, path: [] };
  }

  function autoArrived(c, r) {
    return Math.abs(G.player.x - c) < 0.22 && Math.abs(G.player.y - r) < 0.22;
  }

  function autoFollow(path) {
    if (!path || !path.length) {
      autoWish.x = 0;
      autoWish.y = 0;
      return true;
    }
    let i = 0;
    while (i < path.length) {
      const w = path[i];
      if (Math.abs(G.player.x - w.c) < 0.2 && Math.abs(G.player.y - w.r) < 0.2) {
        i += 1;
        continue;
      }
      break;
    }
    if (i >= path.length) {
      autoWish.x = 0;
      autoWish.y = 0;
      return true;
    }
    const w = path[i];
    const dx = w.c - G.player.x;
    const dy = w.r - G.player.y;
    const pc = Math.round(G.player.x);
    const pr = Math.round(G.player.y);
    if (Math.abs(dx) > 0.08 && Math.abs(dy) > 0.08) {
      if (w.c !== pc && Math.abs(dx) >= Math.abs(dy) - 0.02) {
        autoWish.x = dx > 0 ? 1 : -1;
        autoWish.y = 0;
      } else if (w.r !== pr) {
        autoWish.x = 0;
        autoWish.y = dy > 0 ? 1 : -1;
      } else {
        autoWish.x = dx > 0 ? 1 : -1;
        autoWish.y = 0;
      }
    } else if (Math.abs(dx) >= Math.abs(dy)) {
      autoWish.x = dx > 0 ? 1 : dx < 0 ? -1 : 0;
      autoWish.y = 0;
    } else {
      autoWish.x = 0;
      autoWish.y = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    }
    if (autoWish.x > 0) lastPress = 'right';
    else if (autoWish.x < 0) lastPress = 'left';
    else if (autoWish.y > 0) lastPress = 'down';
    else if (autoWish.y < 0) lastPress = 'up';
    return false;
  }

  function autoGoalStillGood(pc, pr) {
    if (!autoGoal) return false;
    if (autoGoal.flee || autoGoal.wait) {
      if (liveBombCount() === 0 && !cellOnBlast(G.player.x, G.player.y)) return false;
      if (bombAt(pc, pr)) return true;
      const hold = autoHazardHold();
      if (autoSafeAt(pc, pr, 0, hold) && !autoNearEnemy(pc, pr, 0.65)) {
        autoGoal.wait = true;
        autoGoal.flee = false;
        autoGoal.plant = false;
        autoGoal.path = [];
        autoGoal.c = pc;
        autoGoal.r = pr;
        return true;
      }
      return true;
    }
    if (autoGoal.door) return !!G.door;
    if (autoGoal.plant) {
      if (liveBombCount() >= G.bombsMax) return false;
      if (G.grid[idx(autoGoal.c, autoGoal.r)] !== EMPTY) return false;
      if (bombAt(autoGoal.c, autoGoal.r) && !autoArrived(autoGoal.c, autoGoal.r)) return false;
    }
    if (autoGoal.path && autoGoal.path.length) {
      for (let i = 0; i < autoGoal.path.length; i++) {
        const w = autoGoal.path[i];
        if (!autoWalkable(w.c, w.r, pc, pr) && !(w.c === pc && w.r === pr)) return false;
      }
    }
    return true;
  }

  function autoRefreshPath(pc, pr) {
    if (!autoGoal) return;
    if (autoGoal.flee) {
      autoGoal.path = autoFleePath(pc, pr);
      return;
    }
    const path = autoPathTo(pc, pr, autoGoal.c, autoGoal.r, false);
    if (path) autoGoal.path = path;
  }

  function autoTryPlant(pc, pr) {
    if (liveBombCount() >= G.bombsMax) return false;
    if (Math.abs(G.player.x - pc) > 0.32 || Math.abs(G.player.y - pr) > 0.32) return false;
    const esc = autoEscapeFromPlant(Math.round(G.player.x), Math.round(G.player.y));
    if (!esc || !esc.length) return false;
    if (!plant()) return false;
    autoGoal = {
      flee: true,
      plant: false,
      path: esc,
      c: esc[esc.length - 1].c,
      r: esc[esc.length - 1].r
    };
    autoPlantWait = 0;
    autoFollow(esc);
    return true;
  }

  function autoThink(dt) {
    if (G.dead) {
      autoWish.x = 0;
      autoWish.y = 0;
      return;
    }
    autoEnsureBuf();
    const pc = Math.round(G.player.x);
    const pr = Math.round(G.player.y);
    autoRebuildDanger(null);

    const moved = Math.abs(G.player.x - autoLastX) + Math.abs(G.player.y - autoLastY);
    if (moved < 0.035) autoStuck += dt;
    else autoStuck = 0;
    autoLastX = G.player.x;
    autoLastY = G.player.y;

    const inFire = cellOnBlast(G.player.x, G.player.y);
    const onBomb = !!bombAt(pc, pr);
    const inDanger = inFire || onBomb || !autoSafeAt(pc, pr, 0, Math.max(0.75, Math.min(1.1, autoHazardHold())));
    const enemyClose = G.invuln <= 0 && autoNearEnemy(G.player.x, G.player.y, 0.95);

    if (inDanger) {
      const arrivedFlee = autoGoal && autoGoal.flee && autoArrived(autoGoal.c, autoGoal.r);
      const keepFlee = autoGoal && autoGoal.flee && autoGoal.path && autoGoal.path.length && !arrivedFlee;
      if (!keepFlee) {
        autoGoal = {
          flee: true,
          plant: false,
          path: autoFleePath(pc, pr)
        };
        if (autoGoal.path && autoGoal.path.length) {
          autoGoal.c = autoGoal.path[autoGoal.path.length - 1].c;
          autoGoal.r = autoGoal.path[autoGoal.path.length - 1].r;
        } else {
          autoGoal.c = pc;
          autoGoal.r = pr;
        }
      }
      autoFollow(autoGoal.path);
      autoPlantWait = 0;
      return;
    }

    if (enemyClose && liveBombCount() < G.bombsMax && Math.abs(G.player.x - pc) < 0.28 && Math.abs(G.player.y - pr) < 0.28) {
      const scored = autoScorePlant(pc, pr, 0);
      if (scored && scored.kills) {
        if (autoTryPlant(pc, pr)) return;
      }
    }

    if (autoStuck > 0.42) {
      autoGoal = null;
      autoStuck = 0;
      autoReplan = 0;
      if (liveBombCount() < G.bombsMax) {
        for (let d = 0; d < 4; d++) {
          const nc = pc + DX[d];
          const nr = pr + DY[d];
          if (inb(nc, nr) && G.grid[idx(nc, nr)] === SOFT) {
            if (autoTryPlant(pc, pr)) return;
          }
        }
      }
    }

    if (autoGoal && autoGoalStillGood(pc, pr)) {
      autoReplan -= dt;
      if (autoReplan <= 0) {
        autoRefreshPath(pc, pr);
        autoReplan = autoSpeed >= 4 ? 0.1 : 0.22;
      }
      if (autoGoal.plant && autoArrived(autoGoal.c, autoGoal.r)) {
        autoWish.x = 0;
        autoWish.y = 0;
        autoPlantWait += dt;
        if (autoPlantWait >= (AUTO_PLANT_WAIT[autoSpeed] || 0)) {
          if (!autoTryPlant(autoGoal.c, autoGoal.r)) autoGoal = null;
        }
        return;
      }
      if (autoFollow(autoGoal.path)) {
        if (autoGoal.plant) {
          autoWish.x = 0;
          autoWish.y = 0;
          autoPlantWait += dt;
          if (autoPlantWait >= (AUTO_PLANT_WAIT[autoSpeed] || 0)) {
            if (!autoTryPlant(autoGoal.c, autoGoal.r)) autoGoal = null;
          }
          return;
        }
        if (autoGoal.flee || autoGoal.wait) {
          autoWish.x = 0;
          autoWish.y = 0;
          return;
        }
        autoGoal = null;
      } else {
        return;
      }
    }

    autoReplan = autoSpeed >= 4 ? 0.1 : 0.22;
    autoRebuildDanger(null);
    autoGoal = autoPickGoal(pc, pr);
    if (!autoGoal) {
      autoWish.x = 0;
      autoWish.y = 0;
      return;
    }
    if (autoGoal.plant && autoArrived(autoGoal.c, autoGoal.r)) {
      autoWish.x = 0;
      autoWish.y = 0;
      autoPlantWait += dt;
      if (autoPlantWait >= (AUTO_PLANT_WAIT[autoSpeed] || 0)) autoTryPlant(autoGoal.c, autoGoal.r);
      return;
    }
    autoFollow(autoGoal.path);
  }

  function tickAuto(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (AUTO_OV_WAIT[autoSpeed] || 0.4)) {
        autoOvWait = 0;
        if (G.kind === 'endless') startEndless();
        else startCampaign();
      }
      return;
    }
    if (G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (AUTO_OV_WAIT[autoSpeed] || 0.4)) {
        autoOvWait = 0;
        gotoNext();
      }
      return;
    }
    autoOvWait = 0;
    if (G.mode !== 'play' || G.dead) {
      autoWish.x = 0;
      autoWish.y = 0;
      return;
    }
    autoThink(dt);
  }

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (n >= 1 && n <= 4) return n;
    } catch (err) { /* ignore */ }
    return 3;
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
    } catch (err) { /* ignore */ }
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl || !speedLab) return;
    speedEl.value = String(autoSpeed);
    speedLab.textContent = AUTO_SPEED_NAME[autoSpeed];
    speedEl.title = AUTO_SPEED_NAME[autoSpeed];
    speedEl.setAttribute('aria-valuetext', AUTO_SPEED_NAME[autoSpeed]);
  }

  function setAutoSpeed(n) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1 || n > 4) n = 3;
    autoSpeed = n;
    saveAutoSpeed(autoSpeed);
    syncSpeedUi();
  }

  function toggleAuto() {
    autoOn = !autoOn;
    autoResetPlan();
    autoOvWait = 0;
    keys.u = keys.d = keys.l = keys.r = false;
    ptr.down = false;
    ptr.dragging = false;
    ptr.dirX = 0;
    ptr.dirY = 0;
    syncAutoUi();
    audio.ensure();
    if (autoOn) {
      if (G.mode === 'title') {
        if (G.kind === 'endless') startEndless();
        else startCampaign();
      } else if (G.mode === 'play') {
        setHint('托管中 · A 停下', 'hot');
      }
    } else if (G.mode === 'play') {
      setHint(G.kind === 'endless' ? '无尽 · 波次更密 · 连环加分' : '放弹炸软墙 · 清怪后门开 · 硬墙炸不穿');
    }
  }

  function wishDir() {
    if (autoOn && G.mode === 'play') {
      return { x: autoWish.x, y: autoWish.y };
    }
    if (ptr.down && ptr.dragging && (ptr.dirX || ptr.dirY)) {
      return { x: ptr.dirX, y: ptr.dirY };
    }
    const vec = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const held = { up: keys.u, down: keys.d, left: keys.l, right: keys.r };
    if (held[lastPress]) {
      const v = vec[lastPress];
      return { x: v[0], y: v[1] };
    }
    if (keys.r) return { x: 1, y: 0 };
    if (keys.l) return { x: -1, y: 0 };
    if (keys.d) return { x: 0, y: 1 };
    if (keys.u) return { x: 0, y: -1 };
    return { x: 0, y: 0 };
  }

  function clearField() {
    G.grid.fill(0);
    G.blast.fill(0);
    G.blastCore.fill(0);
    G.bombs.length = 0;
    G.enemies.length = 0;
    G.pickups.length = 0;
    G.door = null;
    particles.length = 0;
    pops.length = 0;
    G.waveWait = 0;
    G.dead = false;
    G.invuln = 0;
    G.stop = 0;
    G.player.x = 1;
    G.player.y = 1;
    G.player.face = 1;
    G.player.squash = 0;
    G.player.passBomb = null;
  }

  function paintHard() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isHardCell(c, r)) G.grid[idx(c, r)] = HARD;
      }
    }
  }

  function sprinkleSoft(density) {
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (G.grid[idx(c, r)] !== EMPTY) continue;
        if (isSafeCell(c, r)) continue;
        if (Math.random() < density) G.grid[idx(c, r)] = SOFT;
      }
    }
  }

  function emptySpots(avoidSafe) {
    const list = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (G.grid[idx(c, r)] !== EMPTY) continue;
        if (avoidSafe && isSafeCell(c, r)) continue;
        if (bombAt(c, r)) continue;
        list.push(c, r);
      }
    }
    return list;
  }

  function spawnEnemies(count, hunt, spd) {
    const spots = emptySpots(true);
    const n = Math.min(count, spots.length / 2);
    for (let i = 0; i < n; i++) {
      if (!spots.length) break;
      const k = (Math.random() * (spots.length / 2)) | 0;
      const c = spots[k * 2];
      const r = spots[k * 2 + 1];
      spots.splice(k * 2, 2);
      const isHunt = i < hunt;
      G.enemies.push({
        x: c,
        y: r,
        dir: (Math.random() * 4) | 0,
        hunt: isHunt,
        speed: spd * (isHunt ? 1.08 : 1) * rand(0.92, 1.08),
        wob: rand(0, TAU),
        dead: false
      });
    }
  }

  function buildStage(spec, extraSoft) {
    clearField();
    paintHard();
    sprinkleSoft(spec.density);
    if (extraSoft) {
      const spots = emptySpots(true);
      const n = Math.min(extraSoft, (spots.length / 2) | 0);
      for (let i = 0; i < n; i++) {
        const k = (Math.random() * (spots.length / 2)) | 0;
        G.grid[idx(spots[k * 2], spots[k * 2 + 1])] = SOFT;
        spots.splice(k * 2, 2);
      }
    }
    spawnEnemies(spec.enemies, spec.hunt, spec.spd);
  }

  function px(x) {
    return ox + (x + 0.5) * cell;
  }
  function py(y) {
    return oy + (y + 0.5) * cell;
  }

  function destroySoft(c, r) {
    G.grid[idx(c, r)] = EMPTY;
    const x = px(c);
    const y = py(r);
    emit(10, {
      x: x, y: y, j: cell * 0.28,
      vx0: -90, vx1: 90, vy0: -140, vy1: 40,
      life: 0.42, r0: 1.4, r1: 3.4, rgb: HOT2, g: 240
    });
    audio.wall();
    addScore(10, c, r);
    if (Math.random() < 0.32 && !pickupAt(c, r) && G.pickups.length < 4) {
      const kind = Math.random() < 0.5 ? 'fire' : 'bomb';
      G.pickups.push({ c: c, r: r, kind: kind, bob: rand(0, TAU) });
    }
  }

  function killEnemy(e, chain) {
    if (e.dead) return;
    e.dead = true;
    const n = 100 * Math.max(1, chain);
    addScore(n, e.x, e.y);
    emit(14, {
      x: px(e.x), y: py(e.y), j: cell * 0.2,
      vx0: -120, vx1: 120, vy0: -160, vy1: 50,
      life: 0.45, r0: 1.5, r1: 3.8, rgb: MAG, g: 80
    });
    audio.kill();
    spawnPop(e.x, e.y - 0.2, '+' + n, MAG);
  }

  function hurtPlayer(cause) {
    if (G.mode !== 'play' || G.dead || G.invuln > 0) return;
    G.lives -= 1;
    G.invuln = 1.55;
    G.flash = 0.55;
    G.flashRgb = MAG;
    G.shake = REDUCE ? 0 : 10;
    hitStop(3);
    kick('die');
    audio.hurt();
    emit(16, {
      x: px(G.player.x), y: py(G.player.y), j: cell * 0.22,
      vx0: -140, vx1: 140, vy0: -180, vy1: 40,
      life: 0.5, r0: 1.6, r1: 4, rgb: CYN, g: 60
    });
    syncPips();
    if (G.lives <= 0) {
      G.dead = true;
      lose();
      return;
    }
    toast(cause === 'blast' ? '被火燎到' : '撞上怪了', true, false);
    G.player.x = 1;
    G.player.y = 1;
    const b = bombAt(1, 1);
    G.player.passBomb = b;
  }

  function explode(c, r, range, chain) {
    const b = bombAt(c, r);
    if (b) b.dead = true;
    const cells = blastCells(G.grid, c, r, range);
    hitStop(chain);
    audio.boom(chain);
    G.flash = Math.max(G.flash, 0.28 + Math.min(0.25, chain * 0.06));
    G.flashRgb = chain >= 3 ? GOLD : HOT;
    G.shake = REDUCE ? 0 : Math.min(14, 5 + chain * 2);
    kick('boom');
    if (chain >= 2) showChain(chain);
    const cx = px(c);
    const cy = py(r);
    emit(12 + chain * 4, {
      x: cx, y: cy, j: cell * 0.18,
      vx0: -160, vx1: 160, vy0: -180, vy1: 80,
      life: 0.38, r0: 1.2, r1: 3.6, rgb: GOLD, g: 40
    });
    for (let i = 0; i < cells.length; i++) {
      const cellPos = cells[i];
      const id = idx(cellPos.c, cellPos.r);
      G.blast[id] = Math.max(G.blast[id], BLAST_LIFE);
      if (cellPos.core) G.blastCore[id] = 1;
      if (G.grid[id] === SOFT) destroySoft(cellPos.c, cellPos.r);
      const other = bombAt(cellPos.c, cellPos.r);
      if (other) {
        other.dead = true;
        other.pending = { chain: chain + 1, wait: 0.05 };
      }
      for (let k = G.pickups.length - 1; k >= 0; k--) {
        const p = G.pickups[k];
        if (p.c === cellPos.c && p.r === cellPos.r) G.pickups.splice(k, 1);
      }
    }
    strikeActors(cells, chain);
  }

  function strikeActors(cells, chain) {
    const hit = {};
    for (let i = 0; i < cells.length; i++) hit[idx(cells[i].c, cells[i].r)] = 1;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead) continue;
      const ec = Math.round(e.x);
      const er = Math.round(e.y);
      if (hit[idx(ec, er)]) killEnemy(e, chain);
    }
    if (G.mode === 'play' && !G.dead) {
      const pc = Math.round(G.player.x);
      const pr = Math.round(G.player.y);
      if (hit[idx(pc, pr)]) hurtPlayer('blast');
    }
  }

  function plant() {
    if (G.mode !== 'play' || G.dead) return false;
    const c = Math.round(G.player.x);
    const r = Math.round(G.player.y);
    if (Math.abs(G.player.x - c) > 0.34 || Math.abs(G.player.y - r) > 0.34) return false;
    if (!inb(c, r) || G.grid[idx(c, r)] !== EMPTY) return false;
    if (G.blast[idx(c, r)] > 0) return false;
    if (bombAt(c, r)) return false;
    if (liveBombCount() >= G.bombsMax) {
      toast('弹满了', true, false);
      return false;
    }
    const bomb = {
      c: c,
      r: r,
      t: FUSE,
      range: G.fire,
      dead: false,
      nextTick: FUSE - 0.12,
      pending: null
    };
    G.bombs.push(bomb);
    G.player.passBomb = bomb;
    G.player.squash = 0.16;
    audio.plant();
    emit(6, {
      x: px(c), y: py(r), j: cell * 0.12,
      vx0: -40, vx1: 40, vy0: -70, vy1: -10,
      life: 0.22, r0: 0.8, r1: 2, rgb: HOT
    });
    syncHud();
    return true;
  }

  function collectPickup(p) {
    if (p.kind === 'fire') {
      G.fire = Math.min(8, G.fire + 1);
      toast('火力 +1', false, true);
    } else {
      G.bombsMax = Math.min(6, G.bombsMax + 1);
      toast('弹数 +1', false, true);
    }
    addScore(30, p.c, p.r);
    audio.pickup();
    emit(10, {
      x: px(p.c), y: py(p.r), j: cell * 0.16,
      vx0: -70, vx1: 70, vy0: -110, vy1: 10,
      life: 0.4, r0: 1.2, r1: 2.8, rgb: GOLD, g: 20
    });
    syncHud();
  }

  function maybeOpenDoor() {
    if (G.mode !== 'play' || G.kind !== 'campaign' || G.door) return;
    let live = 0;
    for (let i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) live += 1;
    if (live > 0) return;
    const spots = emptySpots(false);
    let bestC = COLS - 2;
    let bestR = ROWS - 2;
    let best = -1;
    const pc = Math.round(G.player.x);
    const pr = Math.round(G.player.y);
    for (let i = 0; i < spots.length; i += 2) {
      const c = spots[i];
      const r = spots[i + 1];
      if (c === pc && r === pr) continue;
      if (bombAt(c, r)) continue;
      const d = Math.abs(c - G.player.x) + Math.abs(r - G.player.y);
      if (d > best) {
        best = d;
        bestC = c;
        bestR = r;
      }
    }
    if (best < 0) {
      for (let r = ROWS - 2; r >= 1 && best < 0; r--) {
        for (let c = COLS - 2; c >= 1; c--) {
          if (isHardCell(c, r) || (c === pc && r === pr)) continue;
          if (G.grid[idx(c, r)] === SOFT) G.grid[idx(c, r)] = EMPTY;
          if (G.grid[idx(c, r)] === EMPTY && !bombAt(c, r)) {
            bestC = c;
            bestR = r;
            best = 1;
            break;
          }
        }
      }
    }
    if (best < 0) return;
    G.door = { c: bestC, r: bestR };
    toast('门开了', false, true);
    audio.door();
    setHint(autoOn ? '托管中 · A 停下' : '走进光门 · 进下一巷', 'hot');
  }

  function maybeNextWave() {
    if (G.mode !== 'play' || G.kind !== 'endless' || G.waveWait > 0) return;
    let live = 0;
    for (let i = 0; i < G.enemies.length; i++) if (!G.enemies[i].dead) live += 1;
    if (live > 0) return;
    addScore(150 + G.wave * 50);
    G.waveWait = 1.15;
    toast('第 ' + (G.wave + 1) + ' 波', false, true);
  }

  function spawnWave() {
    G.wave += 1;
    const enemies = Math.min(3 + G.wave, 9);
    const hunt = Math.min((G.wave / 2) | 0, 4);
    const spd = Math.min(2.8, 1.5 + G.wave * 0.12);
    const extra = Math.min(6 + G.wave, 14);
    sprinkleSoft(0.08);
    const spots = emptySpots(true);
    const nWall = Math.min(extra, (spots.length / 2) | 0);
    for (let i = 0; i < nWall; i++) {
      const k = (Math.random() * (spots.length / 2)) | 0;
      const c = spots[k * 2];
      const r = spots[k * 2 + 1];
      if (Math.abs(c - G.player.x) + Math.abs(r - G.player.y) < 2.2) continue;
      G.grid[idx(c, r)] = SOFT;
      spots.splice(k * 2, 2);
    }
    spawnEnemies(enemies, hunt, spd);
    G.waveWait = 0;
    syncHud();
    setHint(autoOn ? '托管中 · A 停下' : '无尽 · 波次更密 · 连环加分', autoOn ? 'hot' : 'hot');
  }

  function winStage() {
    if (G.kind === 'campaign') addScore(500);
    G.mode = 'win';
    G.flash = 0.6;
    G.flashRgb = LIME;
    kick('win-flash');
    audio.win();
    if (autoOn) setHint('托管中 · A 停下', 'hot');
    else if (G.kind === 'campaign' && G.stage >= STAGES.length - 1) {
      setHint('全巷扫清 · R 再来', 'hot');
    } else {
      setHint('巷清了 · 空格下一关', 'hot');
    }
    showOverlay('win');
  }

  function lose() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    setHint(autoOn ? '托管中 · R 重开接着打' : '炸到了 · R 重开', 'warn');
    showOverlay('lose');
  }

  function startCampaign() {
    G.kind = 'campaign';
    G.mode = 'play';
    G.stage = 0;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.fire = 1;
    G.bombsMax = 1;
    G.combo = 1;
    G.comboT = 0;
    buildStage(STAGES[0], 0);
    hideOverlay();
    audio.start();
    autoResetPlan();
    setHint(autoOn ? '托管中 · A 停下' : '放弹炸软墙 · 清怪后门开 · 硬墙炸不穿', autoOn ? 'hot' : null);
    syncHud();
    if (canvas) canvas.focus();
  }

  function startEndless() {
    G.kind = 'endless';
    G.mode = 'play';
    G.stage = 0;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.fire = 1;
    G.bombsMax = 1;
    G.combo = 1;
    G.comboT = 0;
    buildStage({ name: '无尽', enemies: 3, hunt: 0, density: 0.34, spd: 1.62 }, 0);
    hideOverlay();
    audio.start();
    autoResetPlan();
    setHint(autoOn ? '托管中 · A 停下' : '无尽 · 波次更密 · 连环加分', autoOn ? 'hot' : null);
    syncHud();
    if (canvas) canvas.focus();
  }

  function gotoNext() {
    if (G.kind === 'endless') {
      startEndless();
      return;
    }
    if (G.stage >= STAGES.length - 1) {
      startCampaign();
      return;
    }
    G.stage += 1;
    G.mode = 'play';
    G.combo = 1;
    G.comboT = 0;
    buildStage(STAGES[G.stage], 0);
    hideOverlay();
    audio.start();
    autoResetPlan();
    setHint(autoOn ? '托管中 · A 停下' : ('第 ' + (G.stage + 1) + ' 巷 · ' + STAGES[G.stage].name), autoOn ? 'hot' : null);
    syncHud();
    if (canvas) canvas.focus();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') {
      startCampaign();
      return;
    }
    if (G.kind === 'endless') startEndless();
    else startCampaign();
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'campaign';
    G.lives = LIVES;
    G.score = 0;
    G.fire = 1;
    G.bombsMax = 1;
    buildStage(STAGES[2], 0);
    G.enemies.length = 0;
    spawnEnemies(2, 0, 1.1);
    showOverlay('title');
    setHint(autoOn ? '托管中 · A 停下' : '方向键走 · 空格或点击放弹 · A 自动 · 清怪后门开 · 硬墙炸不穿', autoOn ? 'hot' : null);
    syncHud();
  }

  function openDirs(e) {
    const c = Math.round(e.x);
    const r = Math.round(e.y);
    const out = [];
    for (let d = 0; d < 4; d++) {
      if (!solidTile(c + DX[d], r + DY[d], e)) out.push(d);
    }
    return out;
  }

  function updateEnemy(e, dt) {
    if (e.dead) return;
    e.wob += dt * 6;
    const c = Math.round(e.x);
    const r = Math.round(e.y);
    const at = Math.abs(e.x - c) < 0.08 && Math.abs(e.y - r) < 0.08;
    if (at) {
      e.x = c;
      e.y = r;
      const dirs = openDirs(e);
      if (!dirs.length) return;
      let pick = e.dir;
      const aheadOpen = dirs.indexOf(e.dir) >= 0;
      if (e.hunt) {
        const opts = [];
        if (G.player.x < e.x - 0.25 && dirs.indexOf(3) >= 0) opts.push(3);
        if (G.player.x > e.x + 0.25 && dirs.indexOf(1) >= 0) opts.push(1);
        if (G.player.y < e.y - 0.25 && dirs.indexOf(0) >= 0) opts.push(0);
        if (G.player.y > e.y + 0.25 && dirs.indexOf(2) >= 0) opts.push(2);
        if (opts.length) pick = opts[(Math.random() * opts.length) | 0];
        else if (!aheadOpen) pick = dirs[(Math.random() * dirs.length) | 0];
      } else if (!aheadOpen || Math.random() < 0.14) {
        pick = dirs[(Math.random() * dirs.length) | 0];
      }
      e.dir = pick;
    }
    slideMove(e, DX[e.dir], DY[e.dir], e.speed, dt);
  }

  function cellOnBlast(x, y) {
    const c0 = Math.floor((x - RAD) + 0.5);
    const c1 = Math.floor((x + RAD) + 0.5);
    const r0 = Math.floor((y - RAD) + 0.5);
    const r1 = Math.floor((y + RAD) + 0.5);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        if (inb(c, r) && G.blast[idx(c, r)] > 0) return true;
      }
    }
    return false;
  }

  function updateBombs(dt) {
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (b.dead && b.pending) {
        b.pending.wait -= dt;
        if (b.pending.wait <= 0) {
          const ch = b.pending.chain;
          b.pending = null;
          explode(b.c, b.r, b.range, ch);
        }
        continue;
      }
      if (b.dead) continue;
      b.t -= dt;
      if (b.t <= b.nextTick) {
        audio.tick(220 + (FUSE - b.t) * 160);
        if (b.t > 0.55) b.nextTick -= 0.5;
        else if (b.t > 0.22) b.nextTick -= 0.22;
        else b.nextTick -= 0.1;
      }
      if (b.t <= 0) {
        b.dead = true;
        explode(b.c, b.r, b.range, 1);
      }
    }
    let w = 0;
    for (let i = 0; i < G.bombs.length; i++) {
      const b = G.bombs[i];
      if (!b.dead || b.pending) G.bombs[w++] = b;
    }
    G.bombs.length = w;
  }

  function updateBlast(dt) {
    for (let i = 0; i < G.blast.length; i++) {
      if (G.blast[i] > 0) {
        G.blast[i] -= dt;
        if (G.blast[i] <= 0) {
          G.blast[i] = 0;
          G.blastCore[i] = 0;
        }
      }
    }
  }

  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      if (p.t <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= dt * 0.7;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
  }

  function update(dt) {
    G.clock += dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 1;
        if (comboEl) comboEl.textContent = '×1';
        if (comboBox) comboBox.classList.remove('hot');
        if (stageLabel) stageLabel.classList.remove('hot');
      }
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 28);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.player.squash > 0) G.player.squash = Math.max(0, G.player.squash - dt * 2.8);
    if (autoOn && (G.mode !== 'play' || G.stop <= 0)) tickAuto(dt);

    if (G.stop > 0) {
      G.stop -= dt;
      updateParticles(dt);
      return;
    }

    if (G.mode === 'title') {
      for (let i = 0; i < G.enemies.length; i++) updateEnemy(G.enemies[i], dt);
      updateParticles(dt);
      return;
    }
    if (G.mode !== 'play') {
      updateParticles(dt);
      updateBlast(dt * 0.4);
      return;
    }

    if (G.invuln > 0) G.invuln = Math.max(0, G.invuln - dt);

    const wish = wishDir();
    if (wish.x || wish.y) {
      if (wish.x > 0) G.player.face = 1;
      else if (wish.x < 0) G.player.face = 3;
      else if (wish.y > 0) G.player.face = 2;
      else G.player.face = 0;
    }
    slideMove(G.player, wish.x, wish.y, P_SPD, dt);

    if (G.player.passBomb) {
      const b = G.player.passBomb;
      if (b.dead || Math.abs(G.player.x - b.c) > 0.58 || Math.abs(G.player.y - b.r) > 0.58) {
        G.player.passBomb = null;
      }
    }

    updateBombs(dt);
    updateBlast(dt);
    if (G.mode !== 'play') {
      updateParticles(dt);
      syncHud();
      return;
    }

    for (let i = 0; i < G.enemies.length; i++) {
      updateEnemy(G.enemies[i], dt);
      const e = G.enemies[i];
      if (e.dead) continue;
      if (cellOnBlast(e.x, e.y)) killEnemy(e, Math.max(1, G.combo));
    }
    let ew = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (!G.enemies[i].dead) G.enemies[ew++] = G.enemies[i];
    }
    G.enemies.length = ew;

    if (!G.dead && G.invuln <= 0 && cellOnBlast(G.player.x, G.player.y)) hurtPlayer('blast');

    if (!G.dead && G.invuln <= 0) {
      for (let i = 0; i < G.enemies.length; i++) {
        const e = G.enemies[i];
        if (Math.abs(e.x - G.player.x) < 0.52 && Math.abs(e.y - G.player.y) < 0.52) {
          hurtPlayer('touch');
          break;
        }
      }
    }

    const pc = Math.round(G.player.x);
    const pr = Math.round(G.player.y);
    for (let i = G.pickups.length - 1; i >= 0; i--) {
      const p = G.pickups[i];
      p.bob += dt * 5;
      if (p.c === pc && p.r === pr && Math.abs(G.player.x - p.c) < 0.42 && Math.abs(G.player.y - p.r) < 0.42) {
        collectPickup(p);
        G.pickups.splice(i, 1);
      }
    }

    if (G.door && Math.abs(G.player.x - G.door.c) < 0.42 && Math.abs(G.player.y - G.door.r) < 0.42) {
      winStage();
    }

    maybeOpenDoor();

    if (G.kind === 'endless') {
      if (G.waveWait > 0) {
        G.waveWait -= dt;
        if (G.waveWait <= 0) spawnWave();
      } else {
        maybeNextWave();
      }
    }

    updateParticles(dt);
    syncHud();
  }

  function rr(x, y, w, h, rad) {
    const r = Math.min(rad, w * 0.5, h * 0.5);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else {
      ctx.rect(x, y, w, h);
    }
  }

  function drawFloor() {
    ctx.fillStyle = '#07040c';
    ctx.fillRect(ox, oy, COLS * cell, ROWS * cell);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = ox + c * cell;
        const y = oy + r * cell;
        const t = G.grid[idx(c, r)];
        if (t === HARD || t === SOFT) continue;
        const checker = ((c + r) & 1) ? 0.07 : 0.045;
        ctx.fillStyle = 'rgba(255, 122, 28,' + checker + ')';
        ctx.fillRect(x, y, cell, cell);
      }
    }
    ctx.strokeStyle = 'rgba(255, 154, 68, 0.08)';
    ctx.lineWidth = Math.max(1, dpr * 0.6);
    ctx.beginPath();
    for (let c = 0; c <= COLS; c++) {
      ctx.moveTo(ox + c * cell, oy);
      ctx.lineTo(ox + c * cell, oy + ROWS * cell);
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.moveTo(ox, oy + r * cell);
      ctx.lineTo(ox + COLS * cell, oy + r * cell);
    }
    ctx.stroke();
  }

  function drawHard(c, r) {
    const x = ox + c * cell;
    const y = oy + r * cell;
    const p = Math.max(1.2, cell * 0.08);
    ctx.fillStyle = '#16101f';
    rr(x + 1, y + 1, cell - 2, cell - 2, 4);
    ctx.fill();
    ctx.fillStyle = '#2a2238';
    rr(x + p, y + p * 0.7, cell - p * 2, cell * 0.38, 3);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 122, 28, 0.38)';
    ctx.lineWidth = Math.max(1, dpr * 0.7);
    rr(x + 1.5, y + 1.5, cell - 3, cell - 3, 4);
    ctx.stroke();
  }

  function drawSoft(c, r) {
    const x = ox + c * cell;
    const y = oy + r * cell;
    const p = Math.max(1.4, cell * 0.1);
    ctx.fillStyle = '#c45a18';
    rr(x + p * 0.4, y + p * 0.4, cell - p * 0.8, cell - p * 0.8, 4);
    ctx.fill();
    ctx.fillStyle = '#e07828';
    rr(x + p, y + p * 0.7, cell - p * 2, cell * 0.32, 3);
    ctx.fill();
    ctx.strokeStyle = '#7a3010';
    ctx.lineWidth = Math.max(1, cell * 0.05);
    ctx.beginPath();
    ctx.moveTo(x + p * 1.2, y + p * 1.2);
    ctx.lineTo(x + cell - p * 1.2, y + cell - p * 1.2);
    ctx.moveTo(x + cell - p * 1.2, y + p * 1.2);
    ctx.lineTo(x + p * 1.2, y + cell - p * 1.2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 227, 107, 0.35)';
    ctx.lineWidth = Math.max(1, dpr * 0.6);
    rr(x + p * 0.4, y + p * 0.4, cell - p * 0.8, cell - p * 0.8, 4);
    ctx.stroke();
  }

  function drawDoor() {
    if (!G.door) return;
    const x = px(G.door.c);
    const y = py(G.door.r);
    const pulse = 0.55 + 0.45 * Math.sin(G.clock * 6);
    const s = cell * (0.42 + 0.06 * Math.sin(G.clock * 5));
    ctx.save();
    ctx.shadowColor = rgba(CYN, 0.8);
    ctx.shadowBlur = 16;
    ctx.fillStyle = rgba(CYN, 0.22 + pulse * 0.2);
    ctx.beginPath();
    ctx.arc(x, y, s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(CYN, 0.85);
    ctx.lineWidth = Math.max(1.5, cell * 0.06);
    ctx.stroke();
    ctx.strokeStyle = rgba(LIME, 0.55);
    ctx.beginPath();
    ctx.arc(x, y, s * 0.62, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawPickup(p) {
    const x = px(p.c);
    const y = py(p.r) + Math.sin(p.bob) * cell * 0.06;
    const s = cell * 0.22;
    ctx.save();
    if (p.kind === 'fire') {
      ctx.fillStyle = rgba(HOT, 0.95);
      ctx.beginPath();
      ctx.moveTo(x, y - s * 1.2);
      ctx.quadraticCurveTo(x + s, y, x, y + s * 0.9);
      ctx.quadraticCurveTo(x - s, y, x, y - s * 1.2);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, 0.95);
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.4);
      ctx.quadraticCurveTo(x + s * 0.45, y + s * 0.2, x, y + s * 0.55);
      ctx.quadraticCurveTo(x - s * 0.45, y + s * 0.2, x, y - s * 0.4);
      ctx.fill();
    } else {
      ctx.fillStyle = '#141018';
      ctx.beginPath();
      ctx.arc(x, y + s * 0.1, s * 0.85, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(HOT, 0.9);
      ctx.lineWidth = Math.max(1.2, cell * 0.05);
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.beginPath();
      ctx.moveTo(x, y - s * 0.7);
      ctx.lineTo(x, y - s * 1.15);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBomb(b) {
    if (b.dead && !b.pending) return;
    const x = px(b.c);
    const y = py(b.r);
    const pulse = 1 + 0.1 * Math.sin(G.clock * (8 + (FUSE - b.t) * 6));
    const s = cell * 0.3 * pulse;
    const heat = clamp((FUSE - b.t) / FUSE, 0, 1);
    ctx.save();
    ctx.fillStyle = rgba([20 + heat * 80, 10, 14], 1);
    ctx.beginPath();
    ctx.arc(x, y + cell * 0.04, s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.55 + heat * 0.4);
    ctx.lineWidth = Math.max(1.2, cell * 0.05);
    ctx.stroke();
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = Math.max(1.4, cell * 0.055);
    ctx.beginPath();
    ctx.moveTo(x + s * 0.15, y - s * 0.7);
    ctx.quadraticCurveTo(x + s * 0.55, y - s * 1.15, x + s * 0.2, y - s * 1.35);
    ctx.stroke();
    const spark = 0.6 + 0.4 * Math.sin(G.clock * 24);
    ctx.fillStyle = rgba(heat > 0.7 ? MAG : GOLD, spark);
    ctx.beginPath();
    ctx.arc(x + s * 0.2, y - s * 1.38, cell * 0.045, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawBlastCell(c, r, t) {
    const x = px(c);
    const y = py(r);
    const u = t / BLAST_LIFE;
    const core = G.blastCore[idx(c, r)];
    const flick = 0.75 + 0.25 * Math.sin(G.clock * 42 + c * 2 + r);
    const s = cell * (core ? 0.48 : 0.4) * (0.75 + 0.25 * u) * flick;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (core) {
      const arm = cell * 0.18;
      const len = cell * (0.55 + 0.2 * u);
      ctx.fillStyle = rgba(HOT, 0.4 * u);
      ctx.fillRect(x - arm, y - len, arm * 2, len * 2);
      ctx.fillRect(x - len, y - arm, len * 2, arm * 2);
    }
    ctx.fillStyle = rgba(HOT, 0.28 * u);
    ctx.beginPath();
    ctx.arc(x, y, s * 1.15, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.55 * u);
    ctx.beginPath();
    ctx.arc(x, y, s * 0.72, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba([255, 252, 240], 0.8 * u);
    ctx.beginPath();
    ctx.arc(x, y, s * (core ? 0.42 : 0.28), 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemy(e) {
    const x = px(e.x);
    const y = py(e.y) + Math.sin(e.wob) * cell * 0.04;
    const s = cell * 0.32;
    const rgb = e.hunt ? MAG : [255, 90, 160];
    ctx.save();
    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.ellipse(x, y, s, s * 0.9, 0, 0, TAU);
    ctx.fill();
    if (e.hunt) {
      ctx.strokeStyle = rgba(HOT, 0.7);
      ctx.lineWidth = Math.max(1, cell * 0.05);
      ctx.stroke();
    }
    ctx.fillStyle = '#05030c';
    const ex = DX[e.dir] * cell * 0.07;
    const ey = DY[e.dir] * cell * 0.05;
    ctx.beginPath();
    ctx.arc(x - s * 0.28 + ex, y - s * 0.18 + ey, cell * 0.045, 0, TAU);
    ctx.arc(x + s * 0.28 + ex, y - s * 0.18 + ey, cell * 0.045, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer() {
    if (G.invuln > 0 && ((G.clock * 12) | 0) % 2 === 0) return;
    const x = px(G.player.x);
    const y = py(G.player.y);
    const sq = 1 - G.player.squash * 1.4;
    const s = cell * 0.32;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1 + G.player.squash * 0.8, sq);
    ctx.fillStyle = rgba(CYN, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, cell * 0.04, s, s * 0.92, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e8ffff';
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.55, s * 0.72, s * 0.55, 0, 0, TAU);
    ctx.fill();
    const fx = DX[G.player.face] * s * 0.22;
    const fy = DY[G.player.face] * s * 0.12 - s * 0.55;
    ctx.fillStyle = '#05030c';
    ctx.beginPath();
    ctx.arc(-s * 0.22 + fx, fy, cell * 0.04, 0, TAU);
    ctx.arc(s * 0.22 + fx, fy, cell * 0.04, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.t / p.life, 0, 1);
      ctx.fillStyle = rgba(p.rgb, 0.15 + a * 0.85);
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.font = '700 ' + Math.max(11, cell * 0.38) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      const a = clamp(p.t / p.life, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fillText(p.text, px(p.x), py(p.y));
    }
  }

  function drawMotes() {
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.65 + 0.35 * Math.sin(G.clock * 1.4 + m.p));
      ctx.fillStyle = rgba(HOT, a);
      ctx.beginPath();
      ctx.arc(ox + m.x * COLS * cell, oy + m.y * ROWS * cell, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.22);
    ctx.fillRect(ox, oy, COLS * cell, ROWS * cell);
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      ctx.translate((Math.random() - 0.5) * G.shake * dpr, (Math.random() - 0.5) * G.shake * dpr);
    }
    drawFloor();
    drawMotes();
    drawDoor();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = G.grid[idx(c, r)];
        if (t === HARD) drawHard(c, r);
        else if (t === SOFT) drawSoft(c, r);
      }
    }
    for (let i = 0; i < G.pickups.length; i++) drawPickup(G.pickups[i]);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (G.blast[idx(c, r)] > 0) drawBlastCell(c, r, G.blast[idx(c, r)]);
      }
    }
    for (let i = 0; i < G.bombs.length; i++) drawBomb(G.bombs[i]);
    for (let i = 0; i < G.enemies.length; i++) drawEnemy(G.enemies[i]);
    if (G.mode !== 'lose' || G.invuln > 0) drawPlayer();
    drawParticles();
    drawFlash();
    ctx.restore();
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * W;
    const y = ((e.clientY - rect.top) / Math.max(1, rect.height)) * H;
    return {
      x: (x - ox) / cell - 0.5,
      y: (y - oy) / cell - 0.5
    };
  }

  function setPtrDirFrom(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      ptr.dirX = dx > 0 ? 1 : -1;
      ptr.dirY = 0;
      lastPress = ptr.dirX > 0 ? 'right' : 'left';
    } else {
      ptr.dirX = 0;
      ptr.dirY = dy > 0 ? 1 : -1;
      lastPress = ptr.dirY > 0 ? 'down' : 'up';
    }
  }

  function overlayOpenPlayBlock() {
    return G.mode !== 'play' || overlayOpen();
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (autoOn) return;
    if (overlayOpenPlayBlock()) return;
    const w = pointerWorld(e);
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.sx = w.x;
    ptr.sy = w.y;
    ptr.x = w.x;
    ptr.y = w.y;
    ptr.dragging = false;
    ptr.dirX = 0;
    ptr.dirY = 0;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!ptr.down || (ptr.id != null && e.pointerId !== ptr.id)) return;
    const w = pointerWorld(e);
    ptr.x = w.x;
    ptr.y = w.y;
    const dx = w.x - ptr.sx;
    const dy = w.y - ptr.sy;
    if (!ptr.dragging && (dx * dx + dy * dy) > 0.12) ptr.dragging = true;
    if (ptr.dragging) {
      const ax = w.x - G.player.x;
      const ay = w.y - G.player.y;
      if (Math.abs(ax) + Math.abs(ay) > 0.08) setPtrDirFrom(ax, ay);
    }
  }

  function onPointerUp(e) {
    if (ptr.id != null && e.pointerId !== ptr.id) return;
    const wasDrag = ptr.dragging;
    ptr.down = false;
    ptr.id = null;
    ptr.dragging = false;
    ptr.dirX = 0;
    ptr.dirY = 0;
    if (!wasDrag && !overlayOpenPlayBlock()) plant();
  }

  function setKey(dir, on) {
    if (dir === 'up') keys.u = on;
    if (dir === 'down') keys.d = on;
    if (dir === 'left') keys.l = on;
    if (dir === 'right') keys.r = on;
    if (on && dir !== 'bomb') lastPress = dir;
    const btn = padBtns[dir];
    if (btn) btn.classList.toggle('held', on);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'm' || k === 'M') {
      e.preventDefault();
      if (down && !e.repeat) {
        audio.ensure();
        audio.setMuted(!audio.muted);
      }
      return;
    }
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      if (down && !e.repeat) restart();
      return;
    }
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      e.preventDefault();
      if (down && !e.repeat) toggleAuto();
      return;
    }
    const isUp = k === 'ArrowUp' || k === 'Up' || code === 'KeyW' || k === 'w' || k === 'W';
    const isDn = k === 'ArrowDown' || k === 'Down' || code === 'KeyS' || k === 's' || k === 'S';
    const isLf = k === 'ArrowLeft' || k === 'Left';
    const isRt = k === 'ArrowRight' || k === 'Right' || code === 'KeyD' || k === 'd' || k === 'D';
    const isSp = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (isUp || isDn || isLf || isRt || isSp) e.preventDefault();
    if (autoOn) {
      if (!down) return;
      if (e.repeat) return;
      if ((isSp || k === 'Enter') && overlayOpen()) {
        if (e.target && e.target.tagName === 'BUTTON') return;
        audio.ensure();
        primaryAction();
      }
      return;
    }
    if (isUp) setKey('up', down);
    if (isDn) setKey('down', down);
    if (isLf) setKey('left', down);
    if (isRt) setKey('right', down);
    if (!down) return;
    if (e.repeat) return;
    if (isSp || k === 'Enter') {
      if (e.target && e.target.tagName === 'BUTTON') return;
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      plant();
    }
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startCampaign();
      return;
    }
    if (G.mode === 'win') {
      gotoNext();
      return;
    }
    if (G.mode === 'lose') restart();
  }

  function bindPad(btn, dir) {
    if (!btn) return;
    const start = function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (autoOn) return;
      if (dir === 'bomb') {
        if (!overlayOpenPlayBlock()) plant();
        btn.classList.add('held');
        return;
      }
      setKey(dir, true);
    };
    const end = function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (dir === 'bomb') {
        btn.classList.remove('held');
        return;
      }
      setKey(dir, false);
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', end);
    btn.addEventListener('pointerleave', end);
    btn.addEventListener('pointercancel', end);
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 28; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        r: rand(0.6, 1.8) * dpr,
        a: rand(0.04, 0.12),
        p: rand(0, TAU)
      });
    }
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    dpr = Math.min(2.25, window.devicePixelRatio || 1);
    W = Math.max(1, Math.floor(rect.width * dpr));
    H = Math.max(1, Math.floor(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    const pad = 10 * dpr;
    cell = Math.max(12, Math.min((W - pad * 2) / COLS, (H - pad * 2) / ROWS));
    ox = (W - COLS * cell) * 0.5;
    oy = (H - ROWS * cell) * 0.5;
    seedMotes();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.u = keys.d = keys.l = keys.r = false;
    ptr.down = false;
    ptr.dragging = false;
    ptr.dirX = ptr.dirY = 0;
  });

  if (btnCampaign) btnCampaign.addEventListener('click', function () { audio.ensure(); startCampaign(); });
  if (btnEndless) btnEndless.addEventListener('click', function () { audio.ensure(); startEndless(); });
  if (ovAgain) ovAgain.addEventListener('click', function () { primaryAction(); });
  if (ovMenu) ovMenu.addEventListener('click', function () { audio.ensure(); bootTitle(); });
  if (btnRetry) btnRetry.addEventListener('click', function () { restart(); });
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    speedEl.addEventListener('input', function () { setAutoSpeed(speedEl.value); });
    speedEl.addEventListener('change', function () { setAutoSpeed(speedEl.value); });
  }
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  if (modeCamp) modeCamp.addEventListener('click', function () {
    audio.ensure();
    startCampaign();
  });
  if (modeEnd) modeEnd.addEventListener('click', function () {
    audio.ensure();
    startEndless();
  });

  bindPad(padBtns.up, 'up');
  bindPad(padBtns.down, 'down');
  bindPad(padBtns.left, 'left');
  bindPad(padBtns.right, 'right');
  bindPad(padBtns.bomb, 'bomb');

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
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  resize();
  bootTitle();
  syncHud();

  if (padEl && window.matchMedia && window.matchMedia('(pointer: coarse)').matches) {
    setHint('滑动或十字键走 · 点炸放弹 · A 自动 · 清怪后门开');
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
    const scale = (autoOn && G.mode === 'play') ? (AUTO_TIME[autoSpeed] || 1) : 1;
    acc += dt * scale;
    let steps = 0;
    const maxSteps = autoOn && autoSpeed >= 4 ? 16 : 5;
    while (acc >= STEP && steps < maxSteps) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    if (acc > STEP * maxSteps) acc = 0;
    draw();
  }
  requestAnimationFrame(frame);
})();
