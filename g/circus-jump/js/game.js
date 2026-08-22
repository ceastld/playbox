'use strict';

/* Circus trampoline: catch the clown, pop balloon rows. */

(function () {
  const VW = 960;
  const VH = 540;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const WALL = 22;
  const TRAMP_Y = 492;
  const TRAMP_H = 15;
  const CLOWN_R = 15;
  const LIVES = 3;
  const STAGES = 5;
  const BEST_KEY = 'playbox-circus-jump-best';
  const MUTE_KEY = 'playbox-circus-jump-mute';
  const OPS = '← → / A D 移动蹦床 · 正中弹得更高 · R 重开 · M 静音';

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 90, 120];
  const WHT = [246, 243, 255];

  const ROWS = [
    { name: '金', rgb: GOLD, pts: 100, last: 400, y: 58 },
    { name: '粉', rgb: MAG, pts: 50, last: 200, y: 108 },
    { name: '青', rgb: CYN, pts: 20, last: 80, y: 158 }
  ];

  const ACTS = [
    { name: '开幕', sub: 'OPEN', n: [8, 9, 10], rings: 0, pads: 0, grav: 980, tramp: 156, drift: 0, spd: 1 },
    { name: '火圈', sub: 'RING', n: [8, 9, 10], rings: 1, pads: 0, grav: 1020, tramp: 146, drift: 0, spd: 1.04 },
    { name: '飞板', sub: 'PAD', n: [9, 10, 11], rings: 1, pads: 1, grav: 1060, tramp: 138, drift: 14, spd: 1.08 },
    { name: '双圈', sub: 'DUAL', n: [9, 10, 11], rings: 2, pads: 1, grav: 1100, tramp: 130, drift: 20, spd: 1.14 },
    { name: '谢幕', sub: 'FINALE', n: [10, 11, 12], rings: 2, pads: 2, grav: 1160, tramp: 122, drift: 28, spd: 1.2 }
  ];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) {
    return hasDom ? document.getElementById(id) : null;
  }

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const btnCircus = el('btn-circus');
  const btnRally = el('btn-rally');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
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
  const hintEl = el('hint');
  const stageEl = el('stage');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, id: null };
  const pips = [];
  const particles = [];
  const pops = [];
  const ripples = [];
  const motes = [];

  const G = {
    mode: 'title',
    kind: 'circus',
    t: 0,
    clock: 0,
    act: 0,
    wave: 1,
    lives: LIVES,
    score: 0,
    combo: 0,
    maxCombo: 0,
    bestC: 0,
    bestR: 0,
    balloons: [],
    rings: [],
    pads: [],
    tramp: { x: VW * 0.5, w: 156, vx: 0, squish: 1, tilt: 0, glow: 0 },
    clown: null,
    lock: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashCol: '#ff3db8',
    punch: 1,
    toastT: 0,
    roundWait: 0,
    missT: 0,
    hidden: false,
    newBest: false,
    pops: 0
  };

  let addTok = 0;
  let hidden = false;

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
    bounce(perfect) {
      this.ensure();
      this.beep(perfect ? 140 : 96, 0.09, 'sine', 0.09, 48);
      this.beep(perfect ? 280 : 190, 0.07, 'triangle', 0.055, 90);
      this.noise(0.05, perfect ? 0.05 : 0.035, 280);
      if (perfect) this.beep(880, 0.1, 'sine', 0.045, 1480);
    },
    pop(combo, last) {
      this.ensure();
      const p = 1 + Math.min(10, combo) * 0.06;
      this.noise(last ? 0.08 : 0.045, last ? 0.055 : 0.036, last ? 900 : 1600);
      this.beep((last ? 520 : 640) * p, last ? 0.14 : 0.07, 'sine', 0.05, (last ? 880 : 1100) * p);
      if (last) {
        this.beep(659 * p, 0.16, 'triangle', 0.04);
        this.beep(784 * p, 0.2, 'sine', 0.035, 1180 * p);
      }
    },
    ring() {
      this.ensure();
      this.noise(0.1, 0.05, 700);
      this.beep(420, 0.12, 'sawtooth', 0.035, 880);
      this.beep(880, 0.1, 'sine', 0.04, 1320);
    },
    pad() {
      this.ensure();
      this.beep(210, 0.06, 'triangle', 0.04, 360);
    },
    miss() {
      this.ensure();
      this.beep(180, 0.2, 'sawtooth', 0.05, 70);
      this.beep(92, 0.28, 'sine', 0.045, 40);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'sine', 0.06);
      this.beep(659, 0.14, 'sine', 0.05);
      this.beep(784, 0.18, 'triangle', 0.05);
      this.beep(1046, 0.3, 'sine', 0.055, 1560);
    },
    lose() {
      this.ensure();
      this.beep(220, 0.2, 'sawtooth', 0.045, 90);
      this.beep(130, 0.32, 'sine', 0.05, 48);
    },
    start() {
      this.ensure();
      this.beep(392, 0.1, 'sine', 0.05, 784);
      this.beep(523, 0.14, 'triangle', 0.04, 880);
    },
    clear() {
      this.ensure();
      this.beep(587, 0.1, 'sine', 0.05, 880);
      this.beep(880, 0.18, 'triangle', 0.045, 1320);
    }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      if (typeof o === 'number') {
        G.bestC = o | 0;
        return;
      }
      G.bestC = (o && o.c) | 0;
      G.bestR = (o && o.r) | 0;
    } catch (err) { /* ignore */ }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({ c: G.bestC, r: G.bestR }));
    } catch (err) { /* ignore */ }
  }

  function currentBest() {
    return G.kind === 'rally' ? G.bestR : G.bestC;
  }

  function considerBest() {
    if (G.mode !== 'play') return;
    if (G.kind === 'rally') {
      if (G.score > G.bestR) {
        G.bestR = G.score;
        G.newBest = true;
        saveBest();
      }
    } else if (G.score > G.bestC) {
      G.bestC = G.score;
      G.newBest = true;
      saveBest();
    }
    if (bestEl) bestEl.textContent = String(currentBest());
  }

  function addScore(n) {
    if (G.mode !== 'play' || n <= 0) return;
    G.score += n;
    considerBest();
    if (scoreEl) scoreEl.textContent = String(G.score);
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
      const node = document.createElement('i');
      node.className = 'pip on';
      pipsEl.appendChild(node);
      pips.push(node);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function syncCombo() {
    if (comboEl) comboEl.textContent = '×' + G.combo;
    if (comboBox) comboBox.classList.toggle('hot', G.combo >= 4);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(currentBest());
    syncCombo();
    if (!stageLabel || !tagLabel) return;
    if (G.mode === 'title') {
      stageLabel.textContent = '杂技';
      tagLabel.textContent = 'CIRCUS';
    } else if (G.kind === 'rally') {
      stageLabel.textContent = '连弹';
      tagLabel.textContent = '第 ' + G.wave + ' 波';
    } else {
      const a = ACTS[G.act];
      stageLabel.textContent = '第 ' + (G.act + 1) + ' 场';
      tagLabel.textContent = a ? a.name : '马戏';
    }
    const win = G.mode === 'win';
    const lose = G.mode === 'lose';
    stageLabel.classList.toggle('hot', win);
    stageLabel.classList.toggle('warn', lose);
    tagLabel.classList.toggle('hot', win);
    tagLabel.classList.toggle('warn', lose);
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead, primary, showRally) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose');
    }
    if (ovKicker) ovKicker.textContent = kind === 'win' ? 'CLEAR' : kind === 'lose' ? 'MISS' : 'CIRCUS';
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.innerHTML = lead;
    if (ovOps) ovOps.textContent = OPS;
    if (btnCircus) {
      btnCircus.textContent = kind === 'title' ? '马戏' : primary;
    }
    if (btnRally) {
      btnRally.classList.toggle('hidden', showRally === false);
      if (kind === 'title') btnRally.textContent = '连弹';
      else btnRally.textContent = G.kind === 'rally' ? '马戏' : '连弹';
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, sec);
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.6, spec.j * 0.6),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.6, 1.15),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        rgb: spec.rgb,
        g: spec.g == null ? 420 : spec.g
      });
    }
  }

  function ripple(x, y, rgb, r) {
    ripples.push({ x: x, y: y, rgb: rgb, r: 6, max: r || 52, t: 0 });
  }

  function floater(x, y, text, rgb) {
    pops.push({ x: x, y: y, text: text, rgb: rgb || GOLD, t: 0 });
  }

  function makeClown(x, y, vx, vy) {
    return {
      x: x,
      y: y,
      vx: vx || 0,
      vy: vy || 0,
      r: CLOWN_R,
      prevY: y,
      alive: true,
      falling: false,
      ignore: 0,
      squash: 1,
      spin: 0,
      hat: 1
    };
  }

  function gravity() {
    if (G.kind === 'rally') return 1180 + Math.min(260, (G.wave - 1) * 36);
    const a = ACTS[G.act] || ACTS[0];
    return a.grav;
  }

  function speedMul() {
    if (G.kind === 'rally') return 1.1 + Math.min(0.28, (G.wave - 1) * 0.04);
    const a = ACTS[G.act] || ACTS[0];
    return a.spd;
  }

  function trampW() {
    if (G.kind === 'rally') return Math.max(110, 150 - (G.wave - 1) * 6);
    const a = ACTS[G.act] || ACTS[0];
    return a.tramp;
  }

  function trampSpeed() {
    return G.kind === 'rally' ? 680 : 560;
  }

  function actCfg() {
    if (G.kind === 'rally') {
      const w = G.wave;
      return {
        n: [8 + Math.min(3, w - 1), 9 + Math.min(3, w - 1), 10 + Math.min(2, w - 1)],
        rings: w >= 4 ? 2 : w >= 2 ? 1 : 0,
        pads: w >= 5 ? 2 : w >= 3 ? 1 : 0,
        drift: Math.min(34, (w - 1) * 8)
      };
    }
    return ACTS[G.act] || ACTS[0];
  }

  function spawnBalloons() {
    const cfg = actCfg();
    G.balloons = [];
    const margin = 50;
    const span = VW - margin * 2;
    for (let r = 0; r < ROWS.length; r++) {
      const row = ROWS[r];
      const n = cfg.n[r];
      for (let i = 0; i < n; i++) {
        G.balloons.push({
          x: margin + (i + 0.5) * (span / n),
          y: row.y,
          r: 16.5,
          row: r,
          rgb: row.rgb,
          pts: row.pts,
          last: row.last,
          name: row.name,
          ph: rand(0, TAU),
          alive: true,
          popT: 0
        });
      }
    }
  }

  function spawnHazards() {
    const cfg = actCfg();
    G.rings = [];
    G.pads = [];
    if (cfg.rings >= 1) {
      G.rings.push({
        x: cfg.rings === 1 ? VW * 0.5 : VW * 0.34,
        y: 268,
        ro: 40,
        ri: 24,
        rot: 0,
        vx: cfg.rings === 1 ? 70 : 88,
        held: false
      });
    }
    if (cfg.rings >= 2) {
      G.rings.push({
        x: VW * 0.68,
        y: 306,
        ro: 38,
        ri: 23,
        rot: 1.2,
        vx: -96,
        held: false
      });
    }
    if (cfg.pads >= 1) {
      G.pads.push({ x: VW * 0.3, y: 368, w: 92, h: 11, vx: 120, glow: 0 });
    }
    if (cfg.pads >= 2) {
      G.pads.push({ x: VW * 0.72, y: 344, w: 80, h: 11, vx: -140, glow: 0 });
    }
  }

  function balloonsLeft() {
    let n = 0;
    for (let i = 0; i < G.balloons.length; i++) if (G.balloons[i].alive) n += 1;
    return n;
  }

  function countRow(row) {
    let n = 0;
    for (let i = 0; i < G.balloons.length; i++) {
      const b = G.balloons[i];
      if (b.alive && b.row === row) n += 1;
    }
    return n;
  }

  function launchClown(power) {
    const t = G.tramp;
    const p = power == null ? 0.72 : power;
    G.clown = makeClown(t.x, TRAMP_Y - CLOWN_R - 2, rand(-40, 40), -(760 + p * 180) * speedMul());
    G.clown.ignore = 0.14;
  }

  function resetFxLight() {
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.roundWait = 0;
    G.missT = 0;
    G.tramp.squish = 1;
    G.tramp.tilt = 0;
    G.tramp.glow = 0;
  }

  function bootTitle() {
    G.mode = 'title';
    G.kind = 'circus';
    G.act = 0;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.lock = 0;
    G.newBest = false;
    G.pops = 0;
    G.tramp.x = VW * 0.5;
    G.tramp.w = trampW();
    resetFxLight();
    spawnBalloons();
    spawnHazards();
    launchClown(0.85);
    particles.length = 0;
    pops.length = 0;
    ripples.length = 0;
    showOverlay('title', '杂技', '滑动蹦床接住落下的小丑，弹上去戳破气球。<br />接在正中弹得最高，同一颜色最后一个有奖励。', '马戏', true);
    setHint('左右滑动蹦床 · 正中弹得更高 · R 重开');
    syncHud();
  }

  function startRun(kind) {
    G.kind = kind === 'rally' ? 'rally' : 'circus';
    G.mode = 'play';
    G.act = 0;
    G.wave = 1;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.maxCombo = 0;
    G.lock = 0.2;
    G.newBest = false;
    G.pops = 0;
    G.tramp.x = VW * 0.5;
    G.tramp.w = trampW();
    G.tramp.vx = 0;
    resetFxLight();
    spawnBalloons();
    spawnHazards();
    launchClown(0.8);
    particles.length = 0;
    pops.length = 0;
    ripples.length = 0;
    hideOverlay();
    audio.start();
    toast(G.kind === 'rally' ? '连弹 · 越弹越快' : '第 1 场 · ' + ACTS[0].name, false, true);
    setHint(G.kind === 'rally' ? '连弹不停 · 正中弹高 · 漏接扣命' : '清完气球进下一场 · 正中弹高');
    syncHud();
  }

  function restart() {
    if (G.mode === 'title') startRun('circus');
    else startRun(G.kind);
  }

  function beginNextRound() {
    if (G.mode === 'title') {
      spawnBalloons();
      spawnHazards();
      return;
    }
    if (G.kind === 'rally') {
      G.wave += 1;
      G.tramp.w = trampW();
      spawnBalloons();
      spawnHazards();
      toast('第 ' + G.wave + ' 波', false, true);
      audio.clear();
      syncHud();
      return;
    }
    if (G.act >= STAGES - 1) {
      winGame();
      return;
    }
    G.act += 1;
    G.tramp.w = trampW();
    spawnBalloons();
    spawnHazards();
    toast('第 ' + (G.act + 1) + ' 场 · ' + ACTS[G.act].name, false, true);
    audio.clear();
    setHint('第 ' + (G.act + 1) + ' 场 · ' + ACTS[G.act].name, 'hot');
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    considerBest();
    audio.win();
    hitStop(0.08);
    G.flash = 0.55;
    G.flashCol = '#ffe36b';
    if (!REDUCE) G.shake = 7;
    const extra = G.newBest ? '<br />新纪录 ' + G.score : '';
    showOverlay(
      'win',
      '谢幕',
      '五场气球全清。得分 ' + G.score + ' · 最高连弹 ×' + G.maxCombo + extra,
      '再来',
      true
    );
    setHint('谢幕 · R 再来一局', 'hot');
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    considerBest();
    audio.lose();
    if (!REDUCE) G.shake = 8;
    G.flash = 0.4;
    G.flashCol = '#ff3db8';
    if (stageEl) {
      stageEl.classList.remove('die');
      void stageEl.offsetWidth;
      stageEl.classList.add('die');
    }
    const extra = G.newBest ? '<br />新纪录 ' + G.score : '';
    showOverlay(
      'lose',
      '没接住',
      (G.kind === 'rally' ? '连弹断了。' : '小丑落地。') + '得分 ' + G.score + extra,
      '再来',
      true
    );
    setHint('没接住 · R 立刻再来', 'warn');
    syncHud();
  }

  function onBounce(off, perfect, fromPad) {
    const c = G.clown;
    const mul = speedMul();
    const abs = Math.min(1, Math.abs(off));
    const power = 1 - abs * 0.14;
    let vy = -(940 * power) * mul;
    if (perfect) vy *= 1.07;
    if (fromPad) vy = -Math.max(520 * mul, Math.abs(c.vy) * 0.78);
    const meet = G.tramp.vx * 0.18;
    if (!fromPad && Math.abs(meet) > 8 && Math.sign(meet) === Math.sign(off || meet)) {
      vy -= Math.min(70, Math.abs(meet) * 0.22);
    }
    c.vy = vy;
    c.vx = c.vx * 0.28 + off * 340 * mul + G.tramp.vx * 0.22;
    c.y = (fromPad ? fromPad.y : TRAMP_Y) - c.r - 1;
    c.ignore = fromPad ? 0.1 : 0.12;
    c.squash = 0.62;
    c.spin += off * 1.4;
    c.falling = false;
    if (!fromPad) {
      G.tramp.squish = 0.55;
      G.tramp.tilt = clamp(off * 0.38, -0.34, 0.34);
      G.tramp.glow = perfect ? 1 : 0.55;
    } else {
      fromPad.glow = 0.8;
    }
    audio.bounce(perfect && !fromPad);
    if (fromPad) audio.pad();
    hitStop(perfect ? 0.055 : 0.032);
    if (!REDUCE) {
      G.shake = Math.max(G.shake, perfect ? 5.4 : 3.2);
      G.punch = perfect ? 1.05 : 1.025;
    }
    G.flash = perfect ? 0.22 : 0.12;
    G.flashCol = perfect ? '#ffe36b' : '#00f0ff';
    const rgb = perfect ? GOLD : CYN;
    ripple(c.x, c.y + c.r, rgb, perfect ? 70 : 48);
    emit(perfect ? 22 : 12, {
      x: c.x, y: TRAMP_Y, j: 18,
      vx0: -180, vx1: 180, vy0: -80, vy1: 40,
      life: 0.45, r0: 1.2, r1: 3.4, rgb: rgb, g: 280
    });
    if (perfect && G.mode === 'play') {
      toast('正中', false, true);
      floater(c.x, c.y - 18, '正中', GOLD);
    }
  }

  function onPop(b) {
    b.alive = false;
    b.popT = 0.28;
    const demo = G.mode === 'title';
    let last = false;
    if (!demo) {
      last = countRow(b.row) === 0;
      G.combo += 1;
      if (G.combo > G.maxCombo) G.maxCombo = G.combo;
      G.pops += 1;
      const mul = 1 + (G.combo - 1) * (G.kind === 'rally' ? 0.2 : 0.08);
      const pts = Math.round((last ? b.last : b.pts) * mul);
      addScore(pts);
      floater(b.x, b.y, (last ? '同色 ' : '') + '+' + pts, last ? GOLD : b.rgb);
      if (last) toast(b.name + '色清了', false, true);
      syncCombo();
    }
    audio.pop(demo ? 1 : G.combo, last);
    hitStop(last ? 0.075 : 0.042);
    if (!REDUCE) {
      G.shake = Math.max(G.shake, last ? 6.2 : 2.8);
      G.punch = last ? 1.06 : 1.03;
    }
    G.flash = last ? 0.36 : 0.18;
    G.flashCol = last ? '#ffe36b' : rgba(b.rgb, 1);
    ripple(b.x, b.y, b.rgb, last ? 78 : 44);
    emit(last ? 28 : 16, {
      x: b.x, y: b.y, j: 10,
      vx0: -240, vx1: 240, vy0: -220, vy1: 80,
      life: last ? 0.7 : 0.48, r0: 1.4, r1: 4.2, rgb: b.rgb, g: 360
    });
    if (last) {
      emit(10, {
        x: b.x, y: b.y, j: 8,
        vx0: -80, vx1: 80, vy0: -320, vy1: -40,
        life: 0.8, r0: 1.8, r1: 3.2, rgb: GOLD, g: 200
      });
    }
  }

  function onRing(ring) {
    const demo = G.mode === 'title';
    audio.ring();
    hitStop(0.04);
    if (!REDUCE) G.shake = Math.max(G.shake, 4);
    G.flash = 0.24;
    G.flashCol = '#ff6a22';
    ripple(ring.x, ring.y, HOT, 64);
    emit(18, {
      x: ring.x, y: ring.y, j: 8,
      vx0: -200, vx1: 200, vy0: -160, vy1: 160,
      life: 0.5, r0: 1.2, r1: 3.6, rgb: HOT, g: 80
    });
    if (!demo) {
      const pts = Math.round(80 * (1 + G.combo * 0.08));
      addScore(pts);
      floater(ring.x, ring.y, '穿圈 +' + pts, HOT);
      toast('穿圈', false, true);
    }
  }

  function missClown() {
    const c = G.clown;
    if (!c || !c.alive || c.falling) return;
    c.alive = false;
    c.falling = true;
    c.squash = 1.25;
    G.combo = 0;
    syncCombo();
    audio.miss();
    if (!REDUCE) G.shake = 6.5;
    G.flash = 0.28;
    G.flashCol = '#ff3db8';
    G.missT = 0.85;
    emit(20, {
      x: c.x, y: Math.min(c.y, TRAMP_Y + 8), j: 14,
      vx0: -160, vx1: 160, vy0: -40, vy1: 220,
      life: 0.6, r0: 1.4, r1: 3.8, rgb: MAG, g: 520
    });
    if (G.mode === 'title') return;
    G.lives -= 1;
    syncPips();
    if (stageEl) {
      stageEl.classList.remove('die');
      void stageEl.offsetWidth;
      stageEl.classList.add('die');
    }
    if (G.lives <= 0) {
      G.lock = 0.55;
      return;
    }
    toast('漏接', true, false);
    setHint('漏接 · 还剩 ' + G.lives + ' 命', 'warn');
  }

  function afterMiss() {
    if (G.mode === 'lose' || G.mode === 'win') return;
    if (G.mode === 'play' && G.lives <= 0) {
      loseGame();
      return;
    }
    G.tramp.w = trampW();
    launchClown(0.7);
    G.lock = 0.18;
  }

  function moveTramp(dt) {
    const t = G.tramp;
    t.w = lerp(t.w, trampW(), 0.12);
    const half = t.w * 0.5;
    const xmin = WALL + half;
    const xmax = VW - WALL - half;
    const spd = trampSpeed();
    let want = null;
    if (keys.l && !keys.r) want = t.x - spd * dt;
    else if (keys.r && !keys.l) want = t.x + spd * dt;
    const steerPtr = pointer.down || (pointer.hover && !keys.l && !keys.r);
    if (steerPtr && (G.mode === 'play' || G.mode === 'title')) want = pointer.x;
    if (G.mode === 'title' && !pointer.down && !keys.l && !keys.r) {
      const land = predictLand();
      want = lerp(t.x, land, 0.12);
    }
    if (want != null) {
      const nx = clamp(want, xmin, xmax);
      t.vx = (nx - t.x) / Math.max(dt, 0.0001);
      t.vx = clamp(t.vx, -900, 900);
      t.x = nx;
    } else {
      t.vx *= Math.pow(0.08, dt * 60);
    }
    t.squish = lerp(t.squish, 1, 1 - Math.pow(0.001, dt));
    t.tilt = lerp(t.tilt, 0, 1 - Math.pow(0.08, dt));
    t.glow = Math.max(0, t.glow - dt * 2.4);
  }

  function predictLand() {
    const c = G.clown;
    if (!c) return G.tramp.x;
    let x = c.x;
    let y = c.y;
    let vx = c.vx;
    let vy = c.vy;
    const g = gravity();
    const r = c.r;
    for (let i = 0; i < 220; i++) {
      vy += g * STEP;
      x += vx * STEP;
      y += vy * STEP;
      if (x < WALL + r) { x = WALL + r; vx = Math.abs(vx) * 0.92; }
      if (x > VW - WALL - r) { x = VW - WALL - r; vx = -Math.abs(vx) * 0.92; }
      if (vy > 40 && y + r >= TRAMP_Y) return x;
    }
    return x;
  }

  function moveHazards(dt) {
    const cfg = actCfg();
    for (let i = 0; i < G.rings.length; i++) {
      const rg = G.rings[i];
      rg.x += rg.vx * dt;
      const lo = WALL + rg.ro + 8;
      const hi = VW - WALL - rg.ro - 8;
      if (rg.x < lo) { rg.x = lo; rg.vx = Math.abs(rg.vx); }
      if (rg.x > hi) { rg.x = hi; rg.vx = -Math.abs(rg.vx); }
      rg.rot += dt * 2.4;
    }
    for (let i = 0; i < G.pads.length; i++) {
      const p = G.pads[i];
      p.x += p.vx * dt;
      const lo = WALL + p.w * 0.5 + 6;
      const hi = VW - WALL - p.w * 0.5 - 6;
      if (p.x < lo) { p.x = lo; p.vx = Math.abs(p.vx); }
      if (p.x > hi) { p.x = hi; p.vx = -Math.abs(p.vx); }
      p.glow = Math.max(0, p.glow - dt * 2.2);
    }
    const drift = cfg.drift || 0;
    if (drift) {
      for (let i = 0; i < G.balloons.length; i++) {
        const b = G.balloons[i];
        if (!b.alive) continue;
        b.x += Math.sin(G.clock * 0.7 + b.ph) * drift * dt;
        b.x = clamp(b.x, WALL + b.r + 8, VW - WALL - b.r - 8);
      }
    }
  }

  function bounceOffRing(c, rg, d) {
    if (d < 0.001) return;
    const nx = (c.x - rg.x) / d;
    const ny = (c.y - rg.y) / d;
    const inner = d < (rg.ri + rg.ro) * 0.5;
    const target = inner ? rg.ri - 2 : rg.ro + c.r + 1;
    c.x = rg.x + nx * target;
    c.y = rg.y + ny * target;
    const dot = c.vx * nx + c.vy * ny;
    if (inner) {
      if (dot > 0) {
        c.vx -= 1.6 * dot * nx;
        c.vy -= 1.6 * dot * ny;
      }
    } else if (dot < 0) {
      c.vx -= 1.7 * dot * nx;
      c.vy -= 1.7 * dot * ny;
    }
    audio.beep(240, 0.05, 'square', 0.03, 140);
    if (!REDUCE) G.shake = Math.max(G.shake, 2.2);
  }

  function collideHazards(c) {
    for (let i = 0; i < G.rings.length; i++) {
      const rg = G.rings[i];
      const d = hypot(c.x - rg.x, c.y - rg.y);
      if (d < rg.ri - 1) {
        if (!rg.held) {
          rg.held = true;
          onRing(rg);
        }
      } else {
        rg.held = false;
        if (d < rg.ro + c.r && d > rg.ri - c.r * 0.35) bounceOffRing(c, rg, d);
      }
    }
    if (c.ignore > 0 || c.vy <= 40) return;
    for (let i = 0; i < G.pads.length; i++) {
      const p = G.pads[i];
      const half = p.w * 0.5;
      if (Math.abs(c.x - p.x) > half + c.r * 0.35) continue;
      if (c.y + c.r >= p.y && c.prevY + c.r <= p.y + 12) {
        const off = clamp((c.x - p.x) / half, -1, 1);
        onBounce(off, false, p);
        return;
      }
    }
  }

  function collideBalloons(c) {
    for (let i = 0; i < G.balloons.length; i++) {
      const b = G.balloons[i];
      if (!b.alive) continue;
      const dx = c.x - b.x;
      const dy = c.y - (b.y + Math.sin(G.clock * 2.2 + b.ph) * 3.2);
      if (dx * dx + dy * dy <= (c.r + b.r - 2) * (c.r + b.r - 2)) onPop(b);
    }
  }

  function collideTramp(c) {
    if (c.ignore > 0 || c.falling || !c.alive) return;
    if (c.vy <= 50) return;
    const half = G.tramp.w * 0.5;
    const crossed = c.y + c.r >= TRAMP_Y && c.prevY + c.r <= TRAMP_Y + 14;
    const past = c.y > TRAMP_Y + 20;
    if (!crossed && !past) return;
    const off = (c.x - G.tramp.x) / half;
    if (Math.abs(off) <= 1.08) {
      onBounce(off, Math.abs(off) < 0.22, null);
    } else {
      missClown();
    }
  }

  function moveClown(dt) {
    const c = G.clown;
    if (!c) return;
    c.prevY = c.y;
    c.ignore = Math.max(0, c.ignore - dt);
    if (c.falling) {
      c.vy += gravity() * dt * 1.15;
      c.vx *= Math.pow(0.4, dt);
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.spin += dt * 8;
      c.squash = lerp(c.squash, 1.15, 0.12);
      return;
    }
    c.vy += gravity() * dt;
    if (c.vy > 980) c.vy = 980;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    if (c.x < WALL + c.r) {
      c.x = WALL + c.r;
      c.vx = Math.abs(c.vx) * 0.92;
      audio.beep(200, 0.04, 'square', 0.02);
    }
    if (c.x > VW - WALL - c.r) {
      c.x = VW - WALL - c.r;
      c.vx = -Math.abs(c.vx) * 0.92;
      audio.beep(200, 0.04, 'square', 0.02);
    }
    if (c.y < 26 + c.r && c.vy < 0) {
      c.y = 26 + c.r;
      c.vy *= -0.35;
    }
    const stretch = 1 + clamp((Math.abs(c.vy) - 200) / 1400, 0, 0.28) * (c.vy < 0 ? 1 : -0.4);
    c.squash = lerp(c.squash, stretch, 1 - Math.pow(0.0008, dt));
    c.spin += c.vx * dt * 0.004;
    collideBalloons(c);
    collideHazards(c);
    collideTramp(c);
    if (c.alive && !c.falling && c.y > TRAMP_Y + 36) missClown();
  }

  function updateFx(dt) {
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl && !toastEl.classList.contains('hidden')) toastEl.classList.add('hidden');
    G.flash = Math.max(0, G.flash - dt * 2.6);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0004, dt));
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t += dt;
      pops[i].y -= 38 * dt;
      if (pops[i].t > 0.7) pops.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      ripples[i].t += dt;
      if (ripples[i].t > 0.45) ripples.splice(i, 1);
    }
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      m.y += Math.sin(G.t * 0.6 + m.p) * 4 * dt;
    }
    for (let i = 0; i < G.balloons.length; i++) {
      const b = G.balloons[i];
      if (!b.alive && b.popT > 0) b.popT = Math.max(0, b.popT - dt);
    }
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.45);
      G.tramp.squish = lerp(G.tramp.squish, 1, 0.08);
      return;
    }
    G.clock += dt;
    G.lock = Math.max(0, G.lock - dt);
    updateFx(dt);
    moveTramp(dt);
    moveHazards(dt);

    if (G.missT > 0) {
      G.missT -= dt;
      if (G.clown) moveClown(dt);
      if (G.missT <= 0) afterMiss();
      return;
    }

    if (G.mode === 'win' || G.mode === 'lose') {
      if (G.clown) moveClown(dt);
      return;
    }

    if (G.clown) moveClown(dt);

    if (G.roundWait > 0) {
      G.roundWait -= dt;
      const low = !G.clown || G.clown.falling || G.clown.y > 240;
      if (G.roundWait <= 0 || (G.roundWait < 0.5 && low)) {
        G.roundWait = 0;
        beginNextRound();
      }
      return;
    }

    if ((G.mode === 'play' || G.mode === 'title') && balloonsLeft() === 0 && G.lock <= 0) {
      if (G.mode === 'title') {
        G.roundWait = 0.85;
        return;
      }
      G.roundWait = 0.85;
      G.flash = 0.4;
      G.flashCol = '#ffe36b';
      hitStop(0.07);
      toast(G.kind === 'rally' ? '清波' : '清场', false, true);
      audio.clear();
      addScore(G.kind === 'rally' ? 150 + G.wave * 40 : 300);
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

  function drawBackground() {
    ctx.fillStyle = '#070312';
    ctx.fillRect(0, 0, VW, VH);
    const g1 = ctx.createRadialGradient(VW * 0.5, 40, 20, VW * 0.5, 120, 420);
    g1.addColorStop(0, 'rgba(255,61,184,0.16)');
    g1.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, VW, VH);
    const g2 = ctx.createRadialGradient(G.tramp.x, TRAMP_Y, 10, G.tramp.x, TRAMP_Y, 280);
    g2.addColorStop(0, 'rgba(0,240,255,0.08)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, VW, VH);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#ff3db8';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.quadraticCurveTo(VW * 0.5, 64, VW, 8);
    ctx.stroke();
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.quadraticCurveTo(VW * 0.5, 72, VW, 18);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,61,184,0.12)';
    ctx.fillRect(0, 0, 16, VH);
    ctx.fillRect(VW - 16, 0, 16, VH);
    ctx.fillStyle = 'rgba(0,240,255,0.1)';
    ctx.fillRect(16, 0, 4, VH);
    ctx.fillRect(VW - 20, 0, 4, VH);

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      ctx.fillStyle = rgba(m.rgb, m.a);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = '#120814';
    ctx.fillRect(0, 518, VW, 22);
    ctx.strokeStyle = 'rgba(255,61,184,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 518);
    ctx.lineTo(VW, 518);
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 11; i++) {
      const x = 40 + i * 88;
      ctx.fillStyle = i % 2 ? '#1a0a16' : '#100814';
      ctx.beginPath();
      ctx.moveTo(x, 540);
      ctx.lineTo(x + 16, 522);
      ctx.lineTo(x + 32, 540);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBalloons() {
    ctx.strokeStyle = 'rgba(246,243,255,0.14)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(36, 28);
    ctx.lineTo(VW - 36, 28);
    ctx.stroke();

    for (let i = 0; i < G.balloons.length; i++) {
      const b = G.balloons[i];
      const bob = Math.sin(G.clock * 2.2 + b.ph) * 3.2;
      const y = b.y + bob;
      if (!b.alive) {
        if (b.popT > 0) {
          ctx.globalAlpha = Math.max(0, b.popT / 0.28);
          ctx.strokeStyle = rgba(b.rgb, 0.8);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(b.x, y, b.r + (0.28 - b.popT) * 40, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        continue;
      }
      ctx.strokeStyle = 'rgba(160,160,190,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x, 28);
      ctx.lineTo(b.x, y - b.r + 2);
      ctx.stroke();

      const grd = ctx.createRadialGradient(b.x - 4, y - 5, 2, b.x, y, b.r);
      grd.addColorStop(0, rgba(WHT, 0.85));
      grd.addColorStop(0.28, rgba(b.rgb, 1));
      grd.addColorStop(1, rgba(b.rgb, 0.55));
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.ellipse(b.x, y, b.r * 0.92, b.r, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = rgba(b.rgb, 0.9);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.45);
      ctx.beginPath();
      ctx.ellipse(b.x - 5, y - 5, 3.2, 4.4, -0.4, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(b.rgb, 0.9);
      ctx.beginPath();
      ctx.moveTo(b.x, y + b.r - 1);
      ctx.lineTo(b.x - 3, y + b.r + 5);
      ctx.lineTo(b.x + 3, y + b.r + 5);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawRings() {
    for (let i = 0; i < G.rings.length; i++) {
      const rg = G.rings[i];
      ctx.save();
      ctx.translate(rg.x, rg.y);
      ctx.rotate(rg.rot);
      ctx.strokeStyle = 'rgba(255,106,34,0.25)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(0, 0, (rg.ro + rg.ri) * 0.5, 0, TAU);
      ctx.stroke();
      const grd = ctx.createLinearGradient(-rg.ro, 0, rg.ro, 0);
      grd.addColorStop(0, '#ff6a22');
      grd.addColorStop(0.5, '#ffe36b');
      grd.addColorStop(1, '#ff3db8');
      ctx.strokeStyle = grd;
      ctx.lineWidth = rg.ro - rg.ri;
      ctx.beginPath();
      ctx.arc(0, 0, (rg.ro + rg.ri) * 0.5, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 7]);
      ctx.beginPath();
      ctx.arc(0, 0, (rg.ro + rg.ri) * 0.5, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function drawPads() {
    for (let i = 0; i < G.pads.length; i++) {
      const p = G.pads[i];
      const x = p.x - p.w * 0.5;
      ctx.save();
      if (p.glow > 0) {
        ctx.shadowColor = rgba(CYN, p.glow);
        ctx.shadowBlur = 16;
      }
      roundRect(x, p.y, p.w, p.h, 6);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.fill();
      ctx.fillStyle = 'rgba(246,243,255,0.55)';
      roundRect(x + 8, p.y + 2, p.w * 0.28, 4, 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawTramp() {
    const t = G.tramp;
    const half = t.w * 0.5;
    const y = TRAMP_Y + (1 - t.squish) * 10;
    ctx.save();
    ctx.translate(t.x, y);
    ctx.rotate(t.tilt);

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.moveTo(-12, 22);
    ctx.lineTo(12, 22);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.moveTo(-9, 20);
    ctx.lineTo(9, 20);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();

    const h = TRAMP_H * t.squish;
    roundRect(-half, -h * 0.35, t.w, h, 8);
    const grd = ctx.createLinearGradient(-half, 0, half, 0);
    grd.addColorStop(0, '#00c8d4');
    grd.addColorStop(0.45, '#7ff6ff');
    grd.addColorStop(0.5, '#ffe36b');
    grd.addColorStop(0.55, '#7ff6ff');
    grd.addColorStop(1, '#00c8d4');
    ctx.fillStyle = grd;
    ctx.fill();
    if (t.glow > 0) {
      ctx.strokeStyle = rgba(GOLD, t.glow);
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    ctx.fillStyle = rgba(GOLD, 0.85);
    roundRect(-18, -h * 0.2, 36, h * 0.55, 4);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(0,240,255,0.12)';
    ctx.beginPath();
    ctx.ellipse(t.x, TRAMP_Y + 16, half * 0.9, 7, 0, 0, TAU);
    ctx.fill();
  }

  function drawClown() {
    const c = G.clown;
    if (!c) return;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.spin * 0.35);
    ctx.scale(2 - c.squash, c.squash);

    ctx.fillStyle = 'rgba(255,61,184,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, c.r + 6, c.r * 0.9, 4, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.moveTo(0, -c.r - 13);
    ctx.lineTo(-8.5, -c.r + 2);
    ctx.lineTo(8.5, -c.r + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(0, -c.r - 13, 3.1, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#ffd0ea';
    ctx.beginPath();
    ctx.arc(0, -2, c.r * 0.86, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,61,184,0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.arc(-8, 6, 5.2, 0, TAU);
    ctx.arc(8, 6, 5.2, 0, TAU);
    ctx.arc(0, 10, 6.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = '#1a0810';
    ctx.beginPath();
    ctx.arc(-4.2, -3.2, 1.5, 0, TAU);
    ctx.arc(4.2, -3.2, 1.5, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff3db8';
    ctx.beginPath();
    ctx.arc(0, 1.4, 2.1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#1a0810';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.arc(0, 3.2, 3.4, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.ellipse(0, 16, 6.2, 5.2, 0, 0, TAU);
    ctx.fill();

    ctx.restore();

    if (c.falling) {
      ctx.strokeStyle = 'rgba(255,61,184,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x - 8, c.y - 18);
      ctx.lineTo(c.x + 10, c.y + 4);
      ctx.moveTo(c.x + 8, c.y - 16);
      ctx.lineTo(c.x - 9, c.y + 6);
      ctx.stroke();
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = rgba(p.rgb, 1);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      const k = r.t / 0.45;
      ctx.strokeStyle = rgba(r.rgb, 1 - k);
      ctx.lineWidth = 2.2 * (1 - k);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.max * k, 0, TAU);
      ctx.stroke();
    }
    ctx.font = '700 13px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < pops.length; i++) {
      const p = pops[i];
      ctx.globalAlpha = 1 - p.t / 0.7;
      ctx.fillStyle = rgba(p.rgb, 1);
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.globalAlpha = 1;
  }

  function drawWorld() {
    drawBackground();
    drawBalloons();
    drawRings();
    drawPads();
    drawTramp();
    drawClown();
    drawParticles();
  }

  function draw() {
    if (!ctx) return;
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, view.w, view.h);

    const shx = G.shake && !REDUCE ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake && !REDUCE ? rand(-G.shake, G.shake) : 0;
    const punch = REDUCE ? 1 : G.punch;
    const rw = VW * view.scale;
    const rh = VH * view.scale;

    ctx.save();
    ctx.beginPath();
    roundRect(view.ox, view.oy, rw, rh, 14);
    ctx.clip();
    ctx.translate(view.ox + shx + rw * 0.5, view.oy + shy + rh * 0.5);
    ctx.scale(view.scale * punch, view.scale * punch);
    ctx.translate(-VW * 0.5, -VH * 0.5);
    drawWorld();
    ctx.restore();

    if (G.flash > 0) {
      ctx.save();
      ctx.globalAlpha = G.flash * 0.28;
      ctx.fillStyle = G.flashCol;
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.restore();
    }
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - view.ox) / view.scale,
      y: (e.clientY - rect.top - view.oy) / view.scale
    };
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startRun('circus');
      return;
    }
    if (G.mode === 'win' || G.mode === 'lose') restart();
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) e.preventDefault();
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) e.preventDefault();
    }
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === ' ') e.preventDefault();
    if (!down) return;

    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      e.preventDefault();
      if (!e.repeat) {
        audio.ensure();
        restart();
      }
      return;
    }
    if (k === '1' || k === 'Digit1') {
      audio.ensure();
      startRun('circus');
      return;
    }
    if (k === '2' || k === 'Digit2') {
      audio.ensure();
      startRun('rally');
      return;
    }
    if (k === 'Enter' || k === ' ' || k === 'Spacebar') {
      e.preventDefault();
      if (overlayOpen()) primaryAction();
    }
  }

  function resize() {
    if (!canvas || !ctx) return;
    const parent = canvas.parentElement || stageEl;
    const rect = parent.getBoundingClientRect();
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    canvas.width = Math.max(1, (view.w * view.dpr) | 0);
    canvas.height = Math.max(1, (view.h * view.dpr) | 0);
    canvas.style.width = view.w + 'px';
    canvas.style.height = view.h + 'px';
    view.scale = Math.min(view.w / VW, view.h / VH);
    view.ox = (view.w - VW * view.scale) * 0.5;
    view.oy = (view.h - VH * view.scale) * 0.5;
  }

  function seedMotes() {
    motes.length = 0;
    for (let i = 0; i < 42; i++) {
      motes.push({
        x: rand(24, VW - 24),
        y: rand(30, VH - 40),
        r: rand(0.5, 1.7),
        a: rand(0.04, 0.16),
        p: rand(0, TAU),
        rgb: i % 3 === 0 ? MAG : i % 3 === 1 ? CYN : GOLD
      });
    }
  }

  if (!hasDom) return;

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    pointer.down = true;
    pointer.hover = true;
    pointer.id = e.pointerId;
    const w = worldFromEvent(e);
    pointer.x = w.x;
    canvas.classList.add('press');
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    if (e.pointerType === 'mouse') pointer.hover = true;
  });
  function endPtr(e) {
    if (pointer.id != null && e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove('press');
    if (e.pointerType !== 'mouse') pointer.hover = false;
  }
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'mouse') pointer.hover = false;
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = false;
    keys.r = false;
  });

  if (btnCircus) btnCircus.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title') startRun('circus');
    else restart();
  });
  if (btnRally) btnRally.addEventListener('click', function () {
    audio.ensure();
    if (G.mode === 'title' || G.kind === 'circus') startRun('rally');
    else startRun('circus');
  });
  if (btnRetry) btnRetry.addEventListener('click', function () {
    audio.ensure();
    restart();
  });
  if (btnMute) btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden) {
      last = performance.now();
      acc = 0;
    }
  });

  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* ignore */ }

  loadBest();
  seedMotes();
  resize();
  bootTitle();
  syncHud();

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
