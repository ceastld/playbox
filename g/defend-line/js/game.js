'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const WORLD = 1920;
  const HALF = WORLD * 0.5;
  const RADAR_H = 36;
  const PLAY_TOP = 40;
  const GROUND = 676;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 10000;
  const HUMANS0 = 10;
  const BOMBS0 = 3;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.55;
  const BEST_KEY = 'playbox-defend-line-best';
  const MUTE_KEY = 'playbox-defend-line-mute';
  const OPS = '← → 推力 · ↑ ↓ 升降 · 空格开火 · Shift 智慧弹 · H 超空间 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const MINT = [28, 255, 58];
  const LEAF = [20, 224, 74];
  const HOT = [122, 255, 136];
  const WHT = [246, 243, 255];
  const PNK = [255, 154, 212];
  const ORG = [255, 168, 74];
  const RED = [255, 74, 74];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnClassic = document.getElementById('btn-classic');
  const btnNight = document.getElementById('btn-night');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBomb = document.getElementById('btn-bomb');
  const btnHyper = document.getElementById('btn-hyper');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const bombLabel = document.getElementById('bomb-label');
  const humanLabel = document.getElementById('human-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padEl = document.getElementById('pad');

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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: WORLD * 0.5, y: 360, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'cruise',
    t: 0,
    clock: 0,
    ship: { x: WORLD * 0.5, y: 360, vx: 0, vy: 0, facing: 1 },
    camX: WORLD * 0.5,
    lives: LIVES,
    score: 0,
    best: 0,
    bombs: BOMBS0,
    combo: 0,
    comboT: 0,
    mult: 1,
    wave: 1,
    waveWait: 0,
    barren: false,
    humans: [],
    enemies: [],
    shots: [],
    fireCd: 0,
    fireHold: false,
    bombCd: 0,
    hyperCd: 0,
    baitT: 20,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    nextLife: LIFE_EVERY,
    abductBeep: 0,
    humanWarn: false,
    thrustOn: false
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
  function isNight() {
    return G.kind === 'night';
  }
  function wrapX(x) {
    x = x % WORLD;
    if (x < 0) x += WORLD;
    return x;
  }
  function wrapDx(from, to) {
    let d = wrapX(to) - wrapX(from);
    if (d > HALF) d -= WORLD;
    if (d < -HALF) d += WORLD;
    return d;
  }
  function viewX(wx) {
    return VW * 0.5 + wrapDx(G.camX, wx);
  }
  function wrapDist(ax, ay, bx, by) {
    const dx = wrapDx(ax, bx);
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function terrainY(x) {
    const t = wrapX(x) / WORLD * TAU;
    const n = Math.sin(t * 6) * 20
      + Math.sin(t * 13 + 1.2) * 11
      + Math.sin(t * 3 + 0.4) * 8
      + Math.sin(t * 27 + 2.1) * 3.5;
    return GROUND - 8 - Math.abs(n);
  }
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    const dx = Math.abs(wrapDx(ax, bx));
    const dy = Math.abs(ay - by);
    return dx < (aw + bw) * 0.5 && dy < (ah + bh) * 0.5;
  }
  function onScreen(x) {
    const vx = viewX(x);
    return vx > -28 && vx < VW + 28;
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
      this.beep(920, 0.048, 'square', 0.034, 1960);
      this.noise(0.018, 0.018, 2200);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'baiter' ? 880 : kind === 'mutant' ? 740 : 520;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.05, 0.042, 1100);
      this.beep(base * lift, 0.09, 'square', 0.05, base * lift * 1.55);
    },
    rescue() {
      this.ensure();
      this.beep(784, 0.07, 'sine', 0.05, 784);
      this.beep(1046, 0.11, 'triangle', 0.042);
      this.beep(1568, 0.18, 'sine', 0.038, 2093);
    },
    bomb() {
      this.ensure();
      this.noise(0.22, 0.08, 240);
      this.beep(220, 0.2, 'sawtooth', 0.055, 55);
      this.beep(440, 0.16, 'square', 0.04, 110);
    },
    hyper() {
      this.ensure();
      this.beep(140, 0.08, 'sawtooth', 0.04, 80);
      this.beep(1680, 0.12, 'square', 0.04, 420);
      this.noise(0.08, 0.04, 900);
    },
    mutant() {
      this.ensure();
      this.beep(180, 0.16, 'sawtooth', 0.045, 90);
      this.beep(420, 0.12, 'square', 0.03, 180);
    },
    barren() {
      this.ensure();
      this.beep(110, 0.28, 'sawtooth', 0.05, 48);
      this.noise(0.2, 0.05, 200);
    },
    abduct() {
      this.ensure();
      this.beep(260, 0.07, 'triangle', 0.022, 420);
    },
    splat() {
      this.ensure();
      this.noise(0.08, 0.04, 500);
      this.beep(180, 0.1, 'sine', 0.03, 70);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    death() {
      this.ensure();
      this.noise(0.14, 0.055, 360);
      this.beep(320, 0.18, 'sawtooth', 0.05, 80);
      this.beep(160, 0.3, 'sine', 0.045, 46);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
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
    wave() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.04, 784);
      this.beep(659, 0.12, 'triangle', 0.035, 988);
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
    if (G.score >= G.nextLife) {
      G.nextLife += LIFE_EVERY;
      if (G.lives < LIFE_CAP) {
        G.lives += 1;
        G.bombs = Math.min(6, G.bombs + 1);
        toast('1UP', false, true);
        audio.up();
        syncPips();
      }
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
    const n = Math.max(LIVES, G.lives);
    while (pips.length < n) {
      const d = document.createElement('i');
      d.className = 'pip on';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    while (pips.length > n && pips.length > LIVES) {
      const d = pips.pop();
      if (d && d.parentNode) d.parentNode.removeChild(d);
    }
    for (let i = 0; i < pips.length; i++) {
      pips[i].className = 'pip' + (i < G.lives ? ' on' : ' gone');
    }
  }

  function comboMult() {
    return 1 + Math.min(4, Math.floor(Math.max(0, G.combo - 1) / 3));
  }

  function liftingCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].type === 'lander' && G.enemies[i].state === 'lift') n += 1;
    }
    return n;
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '防线';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 5);
    }
    if (tagLabel) {
      tagLabel.textContent = G.barren ? '荒星' : (isNight() ? '夜袭' : '巡航');
      tagLabel.classList.toggle('warn', G.barren || G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', !G.barren && G.combo >= 8);
    }
    if (bombLabel) bombLabel.textContent = '炸 ' + G.bombs;
    if (humanLabel) {
      const n = G.humans.length;
      humanLabel.textContent = G.barren ? '荒星' : ('人 ' + n);
      humanLabel.classList.toggle('warn', n <= 2 || G.barren);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.combo + ' 连 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint('← → 飞 · 空格开火 · 打掉绑架者再接住人', '');
    else if (G.mode === 'lose') setHint('R 重开 · 接住往下掉的人，别让他们被带到顶', 'warn');
    else if (G.barren) setHint('荒星 · 全是突变体，智慧弹留给围攻', 'warn');
    else if (G.humans.length <= 2) setHint('人快没了 · 先打带人的绑架者再去接', 'warn');
    else if (liftingCount() > 0) setHint('有人被带走 · 打掉绑架者，接住往下掉的', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 智慧弹 · H 超空间', 'warn');
    else setHint('← → 飞 · 空格开火 · Shift 智慧弹 · 接住人', '');
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead, primary, secondary) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'DEFEND';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnClassic.textContent = primary;
    if (btnNight) {
      btnNight.classList.toggle('hidden', !secondary);
      if (secondary) btnNight.textContent = secondary;
    }
    if (padEl) padEl.setAttribute('aria-hidden', 'true');
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (padEl) padEl.setAttribute('aria-hidden', 'false');
    if (canvas && canvas.focus) canvas.focus();
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
    const cls = mag >= 6 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('rescue');
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
        g: spec.g == null ? 280 : spec.g
      });
    }
    capArr(particles, 280);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 36);
    capArr(rings, 22);
  }

  function floatText(x, y, text, rgb, gold) {
    floats.push({
      x: x, y: y, text: text, rgb: rgb,
      t: 0, life: gold ? 1.05 : 0.7,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -90 : -72
    });
    capArr(floats, 24);
  }

  function explode(x, y, rgb, power) {
    const p = power || 18;
    emit(Math.min(28, 10 + (p * 0.5) | 0), {
      x: x, y: y, j: 6,
      vx0: -220, vx1: 220, vy0: -180, vy1: 160,
      r0: 1.4, r1: 4.2, life: 0.42 + p * 0.006, rgb: rgb, g: 220
    });
    emit(6, {
      x: x, y: y, j: 3,
      vx0: -80, vx1: 80, vy0: -60, vy1: 80,
      r0: 2, r1: 5, life: 0.28, rgb: WHT, g: 80
    });
    popSpark(x, y, rgb, 12 + p * 0.4);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      screenFlash(GOLD, 0.22);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
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

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * WORLD,
        y: PLAY_TOP + 8 + Math.random() * (GROUND - PLAY_TOP - 80),
        b: 0.25 + Math.random() * 0.7,
        p: 0.18 + Math.random() * 0.5,
        r: Math.random() < 0.12 ? 1.4 : 0.8
      });
    }
  }

  function spawnHuman(x) {
    const hx = wrapX(x);
    G.humans.push({
      x: hx,
      y: terrainY(hx) - 7,
      vx: 0,
      vy: 0,
      state: 'ground',
      holder: null,
      fallY: 0,
      walk: rand(0, 40),
      facing: Math.random() < 0.5 ? 1 : -1,
      phase: rand(0, TAU)
    });
  }

  function spawnLander(x, y) {
    G.enemies.push({
      type: 'lander',
      x: wrapX(x),
      y: y,
      vx: 0,
      vy: 40,
      state: 'seek',
      cargo: null,
      target: null,
      fireCd: rand(0.6, 2.2),
      t: rand(0, 10),
      wob: rand(0, TAU),
      dead: false
    });
  }

  function spawnMutant(x, y) {
    G.enemies.push({
      type: 'mutant',
      x: wrapX(x),
      y: y,
      vx: 0,
      vy: 0,
      state: 'hunt',
      cargo: null,
      target: null,
      fireCd: rand(0.3, 1.1),
      t: rand(0, 10),
      wob: rand(0, TAU),
      dead: false
    });
  }

  function spawnBaiter() {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = wrapX(G.ship.x + side * (VW * 0.62));
    G.enemies.push({
      type: 'baiter',
      x: x,
      y: rand(PLAY_TOP + 50, GROUND - 90),
      vx: -side * 180,
      vy: 0,
      state: 'hunt',
      cargo: null,
      target: null,
      fireCd: 0.4,
      t: 0,
      wob: rand(0, TAU),
      dead: false
    });
    if (G.mode === 'play') toast('诱饵来了', true, false);
  }

  function landerQuota() {
    if (isNight()) return Math.min(14, 6 + (G.wave - 1) * 2);
    return Math.min(10, 4 + (G.wave - 1));
  }

  function baitDelay() {
    if (isNight()) return Math.max(7, 11 - G.wave * 0.6);
    return Math.max(9, 22 - G.wave * 1.6);
  }

  function spawnWave() {
    const n = landerQuota();
    for (let i = 0; i < n; i++) {
      const x = rand(0, WORLD);
      const y = PLAY_TOP + 18 + rand(0, 70);
      if (G.barren) spawnMutant(x, y);
      else spawnLander(x, y);
    }
    if (G.wave >= 5) spawnBaiter();
    G.baitT = baitDelay();
    G.waveWait = 0;
  }

  function placeHumans(n) {
    G.humans.length = 0;
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (WORLD / n) + rand(-36, 36);
      spawnHuman(x);
    }
  }

  function resetFx() {
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
  }

  function resetRun() {
    G.ship.x = WORLD * 0.5;
    G.ship.y = 360;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.ship.facing = 1;
    G.camX = G.ship.x;
    G.lives = LIVES;
    G.score = 0;
    G.bombs = BOMBS0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.wave = 1;
    G.waveWait = 0;
    G.barren = false;
    G.enemies.length = 0;
    G.shots.length = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.bombCd = 0;
    G.hyperCd = 0;
    G.deadT = 0;
    G.invuln = 0.45;
    G.why = '';
    G.nextLife = LIFE_EVERY;
    G.abductBeep = 0;
    G.humanWarn = false;
    G.thrustOn = false;
    resetFx();
    placeHumans(HUMANS0);
    if (scoreEl) scoreEl.textContent = '0';
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'cruise';
    resetRun();
    G.invuln = 99;
    spawnWave();
    showOverlay(
      'title',
      '防线',
      '飞过去救人。打掉绑架者，接住往下掉的人。全员被带走就成荒星。',
      '巡航',
      '夜袭'
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'night' ? 'night' : 'cruise';
    G.mode = 'play';
    resetRun();
    spawnWave();
    hideOverlay();
    audio.start();
    toast(isNight() ? '夜袭 · 更快更多' : '巡航 · 保护地面的人', false, !isNight());
    syncHud();
  }

  function loseRun() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    const why = G.why || '舰毁了';
    showOverlay('lose', '舰毁了', why + '  ·  分数 ' + G.score, '再来', '换模式');
    setHint('R 重开', 'warn');
    syncHud();
  }

  function respawn() {
    G.ship.x = wrapX(G.ship.x + rand(-220, 220));
    G.ship.y = rand(PLAY_TOP + 80, GROUND - 120);
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.invuln = 1.35;
    G.deadT = 0;
    G.camX = G.ship.x;
  }

  function dropHuman(h, from) {
    if (!h || h.state === 'dead') return;
    h.state = 'fall';
    h.holder = null;
    h.fallY = h.y;
    h.vy = 28;
    h.vx = from ? from.vx * 0.25 : 0;
  }

  function killHuman(h, splat) {
    if (!h || h.state === 'dead') return;
    h.state = 'dead';
    h.holder = null;
    if (splat) {
      explode(h.x, h.y, HOT, 10);
      audio.splat();
      if (G.mode === 'play') breakCombo();
    }
  }

  function compactHumans() {
    let hasDead = false;
    for (let i = 0; i < G.humans.length; i++) {
      if (G.humans[i].state === 'dead') {
        hasDead = true;
        break;
      }
    }
    if (!hasDead) return;
    let w = 0;
    for (let i = 0; i < G.humans.length; i++) {
      if (G.humans[i].state !== 'dead') G.humans[w++] = G.humans[i];
    }
    G.humans.length = w;
    if (w === 0) makeBarren();
    else if (G.mode === 'play' && w <= 2 && !G.humanWarn) {
      G.humanWarn = true;
      toast('只剩 ' + w + ' 人', true, false);
    }
    syncHud();
  }

  function makeBarren() {
    if (G.barren || G.mode !== 'play') return;
    G.barren = true;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.type === 'lander' && !e.dead) toMutant(e, false);
    }
    toast('荒星 · 突变体来了', true, false);
    audio.barren();
    screenFlash(MAG, 0.55);
    kick(7);
    hitStop(0.07);
    syncHud();
  }

  function toMutant(e, ping) {
    if (e.cargo) {
      const h = e.cargo;
      e.cargo = null;
      killHuman(h, false);
    }
    e.type = 'mutant';
    e.state = 'hunt';
    e.target = null;
    e.fireCd = 0.4;
    if (ping && G.mode === 'play') {
      audio.mutant();
      popSpark(e.x, e.y, GOLD, 18);
      let live = 0;
      for (let i = 0; i < G.humans.length; i++) {
        if (G.humans[i].state !== 'dead') live += 1;
      }
      if (live > 0) toast('突变体', true, false);
    }
  }

  function rescue(h) {
    h.state = 'ground';
    h.holder = null;
    h.vy = 0;
    h.vx = 0;
    h.y = terrainY(h.x) - 7;
    if (G.mode !== 'play') return;
    bumpCombo();
    const n = 500 * G.mult;
    addScore(n);
    floatText(viewX(h.x), h.y - 12, '救到了 +' + n, GOLD, true);
    popSpark(h.x, h.y, GOLD, 22);
    emit(14, {
      x: h.x, y: h.y, j: 4,
      vx0: -90, vx1: 90, vy0: -160, vy1: -20,
      r0: 1.4, r1: 3.2, life: 0.45, rgb: GOLD, g: -40
    });
    audio.rescue();
    hitStop(0.055);
    kick(3.2);
    screenFlash(GOLD, 0.28);
    if (stageEl && !REDUCE) {
      stageEl.classList.remove('rescue');
      void stageEl.offsetWidth;
      stageEl.classList.add('rescue');
    }
    toast('救到了', false, true);
    syncHud();
  }

  function killEnemy(e, scored) {
    if (e.dead) return;
    e.dead = true;
    const rgb = e.type === 'mutant' ? GOLD : e.type === 'baiter' ? ORG : MAG;
    explode(e.x, e.y, rgb, e.type === 'baiter' ? 24 : 16);
    if (e.cargo) dropHuman(e.cargo, e);
    e.cargo = null;
    if (scored && G.mode === 'play') {
      const base = e.type === 'baiter' ? 200 : 150;
      bumpCombo();
      const n = base * G.mult;
      addScore(n);
      floatText(viewX(e.x), e.y, '+' + n, rgb, G.mult >= 3);
      audio.hit(e.type, G.combo);
      hitStop(clamp(0.032 + G.combo * 0.004, 0.032, 0.072));
      kick(e.type === 'baiter' ? 5.5 : 3.4);
      screenFlash(rgb, 0.18);
    }
  }

  function dieShip(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.why = why || '被打中了';
    explode(G.ship.x, G.ship.y, CYN, 28);
    explode(G.ship.x, G.ship.y, WHT, 14);
    audio.death();
    hitStop(0.072);
    kick(8);
    screenFlash(MAG, 0.5);
    G.deadT = 0.92;
    G.lives -= 1;
    breakCombo();
    syncHud();
    if (G.lives <= 0) {
      G.deadT = 0.7;
    }
  }

  function enemyShot(e, spd) {
    const dx = wrapDx(e.x, G.ship.x);
    const dy = G.ship.y - e.y;
    const d = hypot(dx, dy) || 1;
    G.shots.push({
      x: e.x,
      y: e.y,
      vx: dx / d * spd,
      vy: dy / d * spd,
      from: 'enemy',
      life: 1.6,
      w: 5,
      h: 5
    });
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) if (G.shots[i].from === 'player') n += 1;
    if (n >= (isNight() ? 7 : 5)) return;
    const spd = 660;
    const nose = G.ship.x + G.ship.facing * 12;
    G.shots.push({
      x: nose,
      y: G.ship.y,
      vx: G.ship.facing * spd,
      vy: 0,
      from: 'player',
      life: 0.72,
      w: 18,
      h: 3
    });
    G.fireCd = isNight() ? 0.085 : 0.105;
    G.muzzle = 0.06;
    audio.shoot();
    emit(4, {
      x: nose, y: G.ship.y, j: 2,
      vx0: G.ship.facing * 80, vx1: G.ship.facing * 220,
      vy0: -40, vy1: 40,
      r0: 1, r1: 2.2, life: 0.12, rgb: CYN, g: 0
    });
  }

  function smartBomb() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.bombs <= 0 || G.bombCd > 0) return;
    G.bombs -= 1;
    G.bombCd = 0.45;
    audio.bomb();
    screenFlash(WHT, 0.7);
    hitStop(0.078);
    kick(7);
    let hits = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead) continue;
      if (!onScreen(e.x)) continue;
      killEnemy(e, true);
      hits += 1;
    }
    emit(36, {
      x: G.ship.x, y: G.ship.y, j: 90,
      vx0: -260, vx1: 260, vy0: -240, vy1: 240,
      r0: 2, r1: 5.5, life: 0.5, rgb: MINT, g: 40
    });
    popSpark(G.ship.x, G.ship.y, WHT, 40);
    toast(hits ? ('智慧弹 ×' + hits) : '智慧弹', false, true);
    syncHud();
  }

  function hyperspace() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.hyperCd > 0) return;
    G.hyperCd = 0.9;
    const ox0 = G.ship.x;
    const oy0 = G.ship.y;
    explode(ox0, oy0, CYN, 12);
    audio.hyper();
    screenFlash(CYN, 0.35);
    kick(4);
    G.ship.x = rand(0, WORLD);
    G.ship.y = rand(PLAY_TOP + 70, GROUND - 90);
    G.ship.vx *= 0.15;
    G.ship.vy *= 0.15;
    G.camX = G.ship.x;
    G.invuln = 0.22;
    popSpark(G.ship.x, G.ship.y, WHT, 18);
    let panic = false;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].dead) continue;
      if (wrapDist(G.ship.x, G.ship.y, G.enemies[i].x, G.enemies[i].y) < 38) {
        panic = true;
        break;
      }
    }
    if (panic) {
      G.invuln = 0;
      dieShip('超空间撞上了');
    } else {
      toast('超空间', false, false);
    }
  }

  function nearestGroundHuman(ex) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.humans.length; i++) {
      const h = G.humans[i];
      if (h.state !== 'ground') continue;
      const d = Math.abs(wrapDx(ex, h.x));
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    return best;
  }

  function seekTo(e, tx, ty, spd) {
    const dx = wrapDx(e.x, tx);
    const dy = ty - e.y;
    const d = hypot(dx, dy) || 1;
    e.vx = dx / d * spd;
    e.vy = dy / d * spd;
  }

  function updateLander(e, dt) {
    const spd = (isNight() ? 96 : 68) + G.wave * 2.2;
    const lift = isNight() ? 74 : 50;
    e.t += dt;
    e.wob += dt * 3;
    if (e.state === 'seek') {
      if (G.barren) {
        toMutant(e, false);
        return;
      }
      const h = nearestGroundHuman(e.x);
      e.target = h;
      if (!h) {
        e.vx = Math.sin(e.t * 0.7) * 40;
        e.vy = Math.cos(e.t * 0.5) * 24;
      } else {
        seekTo(e, h.x, h.y - 16, spd);
        const dx = wrapDx(e.x, h.x);
        const dy = (h.y - 16) - e.y;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 12) {
          e.state = 'grab';
          e.cargo = h;
          h.state = 'held';
          h.holder = e;
        }
      }
    } else if (e.state === 'grab' || e.state === 'lift') {
      if (!e.cargo || e.cargo.state !== 'held') {
        e.cargo = null;
        e.state = 'seek';
        return;
      }
      e.state = 'lift';
      e.vx = Math.sin(e.wob) * 18;
      e.vy = -lift;
      e.cargo.x = e.x;
      e.cargo.y = e.y + 16;
      if (e.y <= PLAY_TOP + 14) {
        toMutant(e, true);
        return;
      }
    }
    e.x = wrapX(e.x + e.vx * dt);
    e.y = clamp(e.y + e.vy * dt, PLAY_TOP + 8, terrainY(e.x) - 16);
    e.fireCd -= dt;
    if (e.fireCd <= 0 && G.mode === 'play' && G.deadT <= 0) {
      const dx = wrapDx(e.x, G.ship.x);
      if (Math.abs(dx) < VW * 0.55 && Math.abs(e.y - G.ship.y) < 220) {
        enemyShot(e, isNight() ? 190 : 150);
        e.fireCd = rand(1.6, 2.6);
      } else {
        e.fireCd = 0.4;
      }
    }
  }

  function updateMutant(e, dt) {
    const spd = (isNight() ? 168 : 128) + G.wave * 5;
    e.t += dt;
    e.wob += dt * 5;
    const tx = G.ship.x + Math.sin(e.t * 2.2) * 40;
    const ty = G.ship.y + Math.cos(e.wob) * 50;
    seekTo(e, tx, ty, spd);
    e.x = wrapX(e.x + e.vx * dt);
    e.y = clamp(e.y + e.vy * dt, PLAY_TOP + 10, terrainY(e.x) - 14);
    e.fireCd -= dt;
    if (e.fireCd <= 0 && G.mode === 'play' && G.deadT <= 0) {
      enemyShot(e, isNight() ? 230 : 190);
      e.fireCd = rand(0.7, 1.25);
    }
  }

  function updateBaiter(e, dt) {
    const spd = (isNight() ? 250 : 210) + G.wave * 6;
    e.t += dt;
    seekTo(e, G.ship.x, G.ship.y, spd);
    e.x = wrapX(e.x + e.vx * dt);
    e.y = clamp(e.y + e.vy * dt, PLAY_TOP + 12, terrainY(e.x) - 16);
    e.fireCd -= dt;
    if (e.fireCd <= 0 && G.mode === 'play' && G.deadT <= 0) {
      enemyShot(e, isNight() ? 260 : 220);
      e.fireCd = rand(0.45, 0.8);
    }
  }

  function updateHumans(dt) {
    for (let i = 0; i < G.humans.length; i++) {
      const h = G.humans[i];
      if (h.state === 'held') continue;
      if (h.state === 'ground') {
        h.walk += dt;
        if (Math.sin(h.walk * 0.55 + h.phase) > 0.2) h.facing = 1;
        else if (Math.sin(h.walk * 0.55 + h.phase) < -0.2) h.facing = -1;
        h.x = wrapX(h.x + h.facing * 11 * dt);
        h.y = terrainY(h.x) - 7;
      } else if (h.state === 'fall') {
        h.vy += 280 * dt;
        h.x = wrapX(h.x + h.vx * dt);
        h.y += h.vy * dt;
        if (G.mode === 'play' && G.deadT <= 0) {
          if (overlap(G.ship.x, G.ship.y, 22, 16, h.x, h.y, 9, 12)) {
            rescue(h);
            continue;
          }
        }
        const gy = terrainY(h.x) - 7;
        if (h.y >= gy) {
          const high = h.fallY < PLAY_TOP + (GROUND - PLAY_TOP) * 0.42;
          if (high || h.vy > 210) killHuman(h, true);
          else {
            h.state = 'ground';
            h.y = gy;
            h.vy = 0;
            h.vx = 0;
            popSpark(h.x, h.y, HOT, 10);
          }
        }
      }
    }
  }

  function updateEnemies(dt) {
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead) continue;
      if (e.type === 'lander') updateLander(e, dt);
      else if (e.type === 'mutant') updateMutant(e, dt);
      else updateBaiter(e, dt);
    }
  }

  function updateShots(dt) {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      s.x = wrapX(s.x + s.vx * dt);
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.y < PLAY_TOP - 8 || s.y > GROUND + 8) s.life = 0;
    }
  }

  function shotHits() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.life <= 0) continue;
      if (s.from === 'player') {
        for (let j = 0; j < G.enemies.length; j++) {
          const e = G.enemies[j];
          if (e.dead) continue;
          const ew = e.type === 'baiter' ? 14 : 12;
          const eh = e.type === 'lander' ? 14 : 12;
          if (overlap(s.x, s.y, s.w, s.h, e.x, e.y, ew, eh)) {
            s.life = 0;
            killEnemy(e, true);
            break;
          }
        }
        if (s.life <= 0) continue;
        for (let k = 0; k < G.humans.length; k++) {
          const h = G.humans[k];
          if (h.state === 'held') continue;
          if (overlap(s.x, s.y, s.w, s.h, h.x, h.y, 5, 8)) {
            s.life = 0;
            killHuman(h, true);
            break;
          }
        }
      } else if (G.mode === 'play' && G.deadT <= 0) {
        if (overlap(s.x, s.y, s.w, s.h, G.ship.x, G.ship.y, 14, 8)) {
          s.life = 0;
          dieShip('被打中了');
        }
      }
    }
  }

  function bodyHits() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead) continue;
      const ew = e.type === 'baiter' ? 14 : 12;
      const eh = e.type === 'lander' ? 14 : 12;
      if (overlap(G.ship.x, G.ship.y, 14, 8, e.x, e.y, ew, eh)) {
        dieShip('撞上了');
        return;
      }
    }
  }

  function compactDead() {
    let w = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (!G.enemies[i].dead) G.enemies[w++] = G.enemies[i];
    }
    G.enemies.length = w;
    w = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].life > 0) G.shots[w++] = G.shots[i];
    }
    G.shots.length = w;
    compactHumans();
  }

  function thrustAccel() {
    return isNight() ? 590 : 470;
  }
  function maxVx() {
    return isNight() ? 350 : 290;
  }
  function maxVy() {
    return isNight() ? 285 : 235;
  }

  function updateShip(dt) {
    if (G.deadT > 0) return;
    let thx = false;
    let thy = false;
    const acc = thrustAccel();
    if (inputSrc === 'ptr' && pointer.down) {
      const dx = wrapDx(G.ship.x, pointer.x);
      const dy = pointer.y - G.ship.y;
      const d = hypot(dx, dy);
      if (d > 10) {
        G.ship.vx += (dx / d) * acc * dt;
        G.ship.vy += (dy / d) * acc * dt;
        thx = Math.abs(dx) > 8;
        thy = Math.abs(dy) > 8;
        if (Math.abs(dx) > 8) G.ship.facing = dx > 0 ? 1 : -1;
      }
    } else {
      if (keys.r) {
        G.ship.vx += acc * dt;
        G.ship.facing = 1;
        thx = true;
      }
      if (keys.l) {
        G.ship.vx -= acc * dt;
        G.ship.facing = -1;
        thx = true;
      }
      if (keys.u) {
        G.ship.vy -= acc * dt;
        thy = true;
      }
      if (keys.d) {
        G.ship.vy += acc * dt;
        thy = true;
      }
    }
    G.thrustOn = thx || thy;
    const drag = Math.pow(0.52, dt);
    if (!thx) G.ship.vx *= drag;
    if (!thy) G.ship.vy *= drag;
    G.ship.vx = clamp(G.ship.vx, -maxVx(), maxVx());
    G.ship.vy = clamp(G.ship.vy, -maxVy(), maxVy());
    G.ship.x = wrapX(G.ship.x + G.ship.vx * dt);
    G.ship.y += G.ship.vy * dt;
    const gy = terrainY(G.ship.x) - 10;
    if (G.ship.y > gy) {
      G.ship.y = gy;
      G.ship.vy = Math.min(0, G.ship.vy);
    }
    if (G.ship.y < PLAY_TOP + 12) {
      G.ship.y = PLAY_TOP + 12;
      G.ship.vy = Math.max(0, G.ship.vy);
    }
    if (G.thrustOn && !REDUCE) {
      emit(1, {
        x: G.ship.x - G.ship.facing * 10,
        y: G.ship.y,
        j: 2,
        vx0: -G.ship.facing * 80, vx1: -G.ship.facing * 180,
        vy0: -30, vy1: 30,
        r0: 1.2, r1: 2.6, life: 0.18, rgb: ORG, g: 0
      });
    }
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt);
    G.shake = Math.max(0, G.shake - dt * 9);
    G.flash = Math.max(0, G.flash - dt * 3.4);
    G.punch = lerp(G.punch, 1, 1 - Math.pow(0.0003, dt));
    G.toastT = Math.max(0, G.toastT - dt);
    if (G.toastT <= 0 && toastEl && !toastEl.classList.contains('hidden')) {
      toastEl.classList.add('hidden');
    }
    G.comboT -= dt;
    if (G.comboT <= 0 && G.combo > 0) breakCombo();

    let w = 0;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x = wrapX(p.x + p.vx * dt);
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.life -= dt;
      if (p.life > 0) particles[w++] = p;
    }
    particles.length = w;
    w = 0;
    for (let i = 0; i < sparks.length; i++) {
      sparks[i].t += dt;
      if (sparks[i].t < 0.3) sparks[w++] = sparks[i];
    }
    sparks.length = w;
    w = 0;
    for (let i = 0; i < rings.length; i++) {
      rings[i].t += dt;
      if (rings[i].t < 0.42) rings[w++] = rings[i];
    }
    rings.length = w;
    w = 0;
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t < f.life) floats[w++] = f;
    }
    floats.length = w;
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    G.fireCd = Math.max(0, G.fireCd - dt);
    G.bombCd = Math.max(0, G.bombCd - dt);
    G.hyperCd = Math.max(0, G.hyperCd - dt);

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.25);
      return;
    }

    if (G.mode === 'lose') {
      updateFx(dt);
      G.camX = wrapX(G.camX + 8 * dt);
      return;
    }

    if (G.mode === 'title') {
      G.ship.x = wrapX(G.ship.x + 46 * dt);
      G.ship.y = 330 + Math.sin(G.t * 0.65) * 54;
      G.ship.facing = 1;
      G.camX = G.ship.x;
      updateHumans(dt);
      updateEnemies(dt);
      updateShots(dt);
      compactDead();
      if (G.enemies.length < 2) {
        spawnLander(rand(0, WORLD), PLAY_TOP + 30);
      }
      if (G.humans.length < 4) {
        G.barren = false;
        placeHumans(8);
      }
      updateFx(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateHumans(dt);
      updateEnemies(dt);
      updateShots(dt);
      compactDead();
      updateFx(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseRun();
        else respawn();
      }
      return;
    }

    if (G.invuln > 0) G.invuln -= dt;

    updateShip(dt);
    G.camX = G.ship.x;

    if (G.fireHold || (inputSrc === 'ptr' && pointer.down)) fire();

    updateHumans(dt);
    updateEnemies(dt);
    updateShots(dt);
    shotHits();
    if (G.invuln <= 0) bodyHits();
    compactDead();

    G.abductBeep -= dt;
    if (liftingCount() > 0 && G.abductBeep <= 0) {
      audio.abduct();
      G.abductBeep = 0.42;
    }

    if (G.waveWait > 0) {
      G.waveWait -= dt;
      if (G.waveWait <= 0) spawnWave();
    } else if (G.enemies.length === 0) {
      const cleared = G.wave;
      G.wave += 1;
      G.waveWait = 1.35;
      addScore(180 * cleared * G.mult);
      audio.wave();
      toast('第 ' + G.wave + ' 波 · 加速', false, true);
      syncHud();
    } else {
      G.baitT -= dt;
      if (G.baitT <= 0) {
        let baiters = 0;
        for (let i = 0; i < G.enemies.length; i++) {
          if (G.enemies[i].type === 'baiter') baiters += 1;
        }
        if (baiters < (isNight() ? 2 : 1)) spawnBaiter();
        G.baitT = isNight() ? 8 : 11;
      }
    }

    updateFx(dt);
  }

  function drawTerrain() {
    ctx.beginPath();
    ctx.moveTo(sx(-16), sy(VH));
    for (let px = -16; px <= VW + 16; px += 6) {
      const wx = wrapX(G.camX + (px - VW * 0.5));
      ctx.lineTo(sx(px), sy(terrainY(wx)));
    }
    ctx.lineTo(sx(VW + 16), sy(VH));
    ctx.closePath();
    ctx.fillStyle = isNight() ? '#04140a' : '#071a10';
    ctx.fill();
    ctx.beginPath();
    for (let px = -16; px <= VW + 16; px += 6) {
      const wx = wrapX(G.camX + (px - VW * 0.5));
      const y = terrainY(wx);
      if (px <= -16) ctx.moveTo(sx(px), sy(y));
      else ctx.lineTo(sx(px), sy(y));
    }
    ctx.strokeStyle = rgba(MINT, isNight() ? 0.55 : 0.85);
    ctx.lineWidth = Math.max(1, 1.4 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(GROUND + 4));
    ctx.lineTo(sx(VW), sy(GROUND + 4));
    ctx.strokeStyle = rgba(LEAF, 0.25);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const vx = VW * 0.5 + wrapDx(G.camX, s.x) * s.p;
      if (vx < -2 || vx > VW + 2) continue;
      const tw = 0.65 + 0.35 * Math.sin(G.t * (1.4 + s.b) + s.x);
      ctx.fillStyle = rgba(WHT, s.b * tw * (isNight() ? 0.45 : 0.8));
      const r = s.r * scale;
      ctx.fillRect(sx(vx) - r * 0.5, sy(s.y) - r * 0.5, r, r);
    }
  }

  function drawHuman(h) {
    const vx = viewX(h.x);
    if (vx < -12 || vx > VW + 12) return;
    const blink = h.state === 'fall' ? (0.55 + 0.45 * Math.sin(G.t * 18)) : 1;
    const rgb = h.state === 'fall' ? GOLD : HOT;
    ctx.save();
    ctx.globalAlpha = blink;
    ctx.fillStyle = rgba(rgb, 1);
    ctx.fillRect(sx(vx - 1.6), sy(h.y - 6), 3.2 * scale, 3.2 * scale);
    ctx.fillRect(sx(vx - 1.2), sy(h.y - 2.6), 2.4 * scale, 5.4 * scale);
    ctx.fillRect(sx(vx - 2.6), sy(h.y + 2.6), 1.6 * scale, 3.2 * scale);
    ctx.fillRect(sx(vx + 1.0), sy(h.y + 2.6), 1.6 * scale, 3.2 * scale);
    ctx.restore();
  }

  function drawLander(e) {
    const vx = viewX(e.x);
    if (vx < -18 || vx > VW + 18) return;
    const s = scale;
    ctx.save();
    ctx.translate(sx(vx), sy(e.y));
    ctx.fillStyle = rgba(MAG, 1);
    ctx.fillRect(-6 * s, -8 * s, 12 * s, 3 * s);
    ctx.fillRect(-5 * s, -5 * s, 3 * s, 9 * s);
    ctx.fillRect(2 * s, -5 * s, 3 * s, 9 * s);
    ctx.fillRect(-7 * s, 4 * s, 3 * s, 5 * s);
    ctx.fillRect(4 * s, 4 * s, 3 * s, 5 * s);
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.fillRect(-2.2 * s, -4 * s, 4.4 * s, 4.4 * s);
    if (e.state === 'lift' && e.cargo) {
      ctx.strokeStyle = rgba(MAG, 0.7);
      ctx.lineWidth = Math.max(1, 1.2 * s);
      ctx.setLineDash([3 * s, 3 * s]);
      ctx.beginPath();
      ctx.moveTo(0, 8 * s);
      ctx.lineTo(0, 16 * s);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawMutant(e) {
    const vx = viewX(e.x);
    if (vx < -16 || vx > VW + 16) return;
    const s = scale;
    const j = Math.sin(G.t * 16 + e.wob) * 1.4;
    ctx.save();
    ctx.translate(sx(vx), sy(e.y));
    ctx.fillStyle = rgba(GOLD, 1);
    ctx.beginPath();
    ctx.moveTo(0, (-8 + j) * s);
    ctx.lineTo(7 * s, -2 * s);
    ctx.lineTo(5 * s, 7 * s);
    ctx.lineTo(-5 * s, 7 * s);
    ctx.lineTo(-7 * s, -2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(ORG, 1);
    ctx.fillRect(-2 * s, -2 * s, 4 * s, 4 * s);
    ctx.restore();
  }

  function drawBaiter(e) {
    const vx = viewX(e.x);
    if (vx < -16 || vx > VW + 16) return;
    const s = scale;
    const dir = e.vx >= 0 ? 1 : -1;
    ctx.save();
    ctx.translate(sx(vx), sy(e.y));
    ctx.scale(dir, 1);
    ctx.fillStyle = rgba(ORG, 1);
    ctx.beginPath();
    ctx.moveTo(10 * s, 0);
    ctx.lineTo(-8 * s, -6 * s);
    ctx.lineTo(-4 * s, 0);
    ctx.lineTo(-8 * s, 6 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(RED, 0.9);
    ctx.fillRect(-2 * s, -2 * s, 4 * s, 4 * s);
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 18) | 0) % 2 === 0) return;
    const vx = viewX(G.ship.x);
    const s = scale;
    ctx.save();
    ctx.translate(sx(vx), sy(G.ship.y));
    ctx.scale(G.ship.facing, 1);
    if (G.muzzle > 0) {
      ctx.fillStyle = rgba(WHT, G.muzzle / 0.06);
      ctx.fillRect(10 * s, -1.2 * s, 16 * s, 2.4 * s);
      ctx.fillStyle = rgba(CYN, 0.7);
      ctx.fillRect(10 * s, -0.6 * s, 22 * s, 1.2 * s);
    }
    ctx.fillStyle = rgba(CYN, 1);
    ctx.beginPath();
    ctx.moveTo(12 * s, 0);
    ctx.lineTo(-9 * s, -7 * s);
    ctx.lineTo(-4 * s, 0);
    ctx.lineTo(-9 * s, 7 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.95);
    ctx.fillRect(-1 * s, -2.2 * s, 6 * s, 4.4 * s);
    ctx.fillStyle = rgba(MINT, 0.9);
    ctx.fillRect(-8 * s, -1.4 * s, 4 * s, 2.8 * s);
    if (G.thrustOn) {
      ctx.fillStyle = rgba(ORG, 0.85);
      ctx.beginPath();
      ctx.moveTo(-9 * s, -3 * s);
      ctx.lineTo(-16 * s - Math.sin(G.t * 40) * 3 * s, 0);
      ctx.lineTo(-9 * s, 3 * s);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const vx = viewX(s.x);
      if (vx < -20 || vx > VW + 20) continue;
      if (s.from === 'player') {
        const dir = s.vx >= 0 ? 1 : -1;
        ctx.fillStyle = rgba(WHT, 0.95);
        ctx.fillRect(sx(vx - dir * 2), sy(s.y - 1.1), 16 * scale, 2.2 * scale);
        ctx.fillStyle = rgba(CYN, 0.55);
        ctx.fillRect(sx(vx - dir * 6), sy(s.y - 2.2), 22 * scale, 4.4 * scale);
      } else {
        ctx.fillStyle = rgba(MAG, 0.95);
        ctx.fillRect(sx(vx - 2.2), sy(s.y - 2.2), 4.4 * scale, 4.4 * scale);
      }
    }
  }

  function drawFx() {
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const vx = viewX(r.x);
      if (vx < -40 || vx > VW + 40) continue;
      const u = r.t / 0.42;
      ctx.beginPath();
      ctx.arc(sx(vx), sy(r.y), (r.r + u * 28) * scale, 0, TAU);
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - u));
      ctx.lineWidth = Math.max(1, (2.2 - u * 1.6) * scale);
      ctx.stroke();
    }
    for (let i = 0; i < sparks.length; i++) {
      const sp = sparks[i];
      const vx = viewX(sp.x);
      if (vx < -30 || vx > VW + 30) continue;
      const u = 1 - sp.t / 0.3;
      ctx.fillStyle = rgba(sp.rgb, 0.85 * u);
      const rad = sp.rad * u * scale;
      ctx.beginPath();
      ctx.arc(sx(vx), sy(sp.y), rad, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const vx = viewX(p.x);
      if (vx < -8 || vx > VW + 8) continue;
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = rgba(p.rgb, a);
      const r = p.r * scale * (0.45 + a);
      ctx.fillRect(sx(vx) - r * 0.5, sy(p.y) - r * 0.5, r, r);
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawRadar() {
    const x0 = sx(0);
    const y0 = sy(0);
    const w = VW * scale;
    const h = RADAR_H * scale;
    ctx.fillStyle = isNight() ? 'rgba(1,8,4,0.94)' : 'rgba(2,12,6,0.92)';
    ctx.fillRect(x0, y0, w, h);
    ctx.strokeStyle = rgba(MINT, 0.4);
    ctx.lineWidth = 1;
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

    const winW = (VW / WORLD) * w;
    const winX = (wrapX(G.camX - VW * 0.5) / WORLD) * w;
    ctx.fillStyle = 'rgba(28,255,58,0.12)';
    ctx.fillRect(x0 + winX, y0 + 2, winW, h - 4);
    if (winX + winW > w) ctx.fillRect(x0, y0 + 2, winX + winW - w, h - 4);

    const sweep = ((G.t * 0.15) % 1) * w;
    ctx.fillStyle = rgba(MINT, 0.12);
    ctx.fillRect(x0 + sweep, y0 + 2, 2, h - 4);

    function dot(wx, wy, rgb, r) {
      const rx = x0 + (wrapX(wx) / WORLD) * w;
      const t = clamp((wy - PLAY_TOP) / (GROUND - PLAY_TOP), 0, 1);
      const ry = y0 + 4 + t * (h - 8);
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.fillRect(rx - r, ry - r, r * 2, r * 2);
    }
    for (let i = 0; i < G.humans.length; i++) {
      const hmn = G.humans[i];
      dot(hmn.x, hmn.y, hmn.state === 'fall' ? GOLD : HOT, 1.2);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead) continue;
      const rgb = e.type === 'mutant' ? GOLD : e.type === 'baiter' ? ORG : MAG;
      dot(e.x, e.y, rgb, e.type === 'baiter' ? 1.8 : 1.4);
    }
    if (G.deadT <= 0) {
      const rx = x0 + (wrapX(G.ship.x) / WORLD) * w;
      const t = clamp((G.ship.y - PLAY_TOP) / (GROUND - PLAY_TOP), 0, 1);
      const ry = y0 + 4 + t * (h - 8);
      ctx.fillStyle = rgba(CYN, 1);
      ctx.fillRect(rx - 2.4, ry - 1.4, 4.8, 2.8);
    }
  }

  function drawVignette() {
    if (!isNight() && G.mode !== 'lose') return;
    const g = ctx.createRadialGradient(
      sx(VW * 0.5), sy(VH * 0.48), VH * 0.18 * scale,
      sx(VW * 0.5), sy(VH * 0.48), VH * 0.72 * scale
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, isNight() ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.28)');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(PLAY_TOP), VW * scale, (VH - PLAY_TOP) * scale);
  }

  function draw() {
    if (!ctx) return;
    ctx.fillStyle = '#020805';
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake && !REDUCE ? rand(-G.shake, G.shake) * 0.85 : 0;
    const shy = G.shake && !REDUCE ? rand(-G.shake, G.shake) * 0.45 : 0;
    ctx.save();
    ctx.translate(shx, shy);
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(VH * 0.5);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }

    ctx.fillStyle = isNight() ? '#010503' : '#030b07';
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawTerrain();

    for (let i = 0; i < G.humans.length; i++) drawHuman(G.humans[i]);
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.dead) continue;
      if (e.type === 'lander') drawLander(e);
      else if (e.type === 'mutant') drawMutant(e);
      else drawBaiter(e);
    }
    drawShots();
    drawShip();
    drawFx();
    drawRadar();
    drawVignette();

    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.48);
      ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
  }

  function resize() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fit = Math.min(W / VW, H / VH);
    scale = fit;
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left - ox) / scale;
    const py = (e.clientY - rect.top - oy) / scale;
    return {
      x: wrapX(G.camX + (px - VW * 0.5)),
      y: py
    };
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('cruise');
    else startGame(G.kind || 'cruise');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('cruise');
    else if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) inputSrc = 'key';
    }
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    const shift = k === 'Shift' || code === 'ShiftLeft' || code === 'ShiftRight';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || shift)) {
      e.preventDefault();
    }
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
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fire();
      }
      return;
    }
    if (overlayOpen()) return;
    if (shift) {
      smartBomb();
      return;
    }
    if (k === 'h' || k === 'H') {
      hyperspace();
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      const p = pointerWorld(e);
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = p.x;
      pointer.y = p.y;
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const p = pointerWorld(e);
      pointer.x = p.x;
      pointer.y = p.y;
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

  if (btnClassic) {
    btnClassic.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('cruise');
    });
  }
  if (btnNight) {
    btnNight.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('night');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMute) {
    btnMute.addEventListener('click', function () {
      audio.ensure();
      audio.setMuted(!audio.muted);
    });
  }
  if (btnBomb) {
    btnBomb.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      btnBomb.classList.add('held');
      smartBomb();
    });
    btnBomb.addEventListener('pointerup', function () { btnBomb.classList.remove('held'); });
    btnBomb.addEventListener('pointerleave', function () { btnBomb.classList.remove('held'); });
  }
  if (btnHyper) {
    btnHyper.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      btnHyper.classList.add('held');
      hyperspace();
    });
    btnHyper.addEventListener('pointerup', function () { btnHyper.classList.remove('held'); });
    btnHyper.addEventListener('pointerleave', function () { btnHyper.classList.remove('held'); });
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
