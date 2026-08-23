'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const WORLD = 2400;
  const HALF = WORLD * 0.5;
  const RADAR_H = 28;
  const PLAY_TOP = 36;
  const GROUND = 418;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 10000;
  const HUMANS0 = 10;
  const WAVES = 5;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SHIP_R = 10;
  const THRUST = 640;
  const MAX_VX = 390;
  const MAX_VX_N = 440;
  const VY = 248;
  const SHOT_V = 740;
  const SHOT_LIFE = 0.58;
  const SHOT_MAX = 5;
  const FIRE_CD = 0.1;
  const FIRE_CD_N = 0.086;
  const COMBO_WIN = 1.42;
  const BEST_KEY = 'playbox-defender-best';
  const MUTE_KEY = 'playbox-defender-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格开火 · Shift / Z 翻头 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 212, 255];
  const ICE = [78, 200, 255];
  const GOLD = [255, 227, 107];
  const WHT = [232, 251, 255];
  const ORG = [255, 150, 70];
  const PNK = [255, 154, 212];
  const RED = [255, 74, 86];
  const MINT = [90, 230, 180];

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
  const btnGuard = document.getElementById('btn-guard');
  const btnNuke = document.getElementById('btn-nuke');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const phaseLabel = document.getElementById('phase-label');
  const humanLabel = document.getElementById('human-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');
  const stickEl = document.getElementById('stick');
  const knobEl = document.getElementById('knob');
  const padFire = document.getElementById('pad-fire');
  const padRev = document.getElementById('pad-rev');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let kickTok = 0;
  let comboTok = 0;

  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const analog = { x: 0, y: 0, on: false };
  const pointer = { down: false, id: null, wx: 0, wy: 0 };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const ghosts = [];
  const peaks = [];

  const G = {
    mode: 'title',
    kind: 'guard',
    t: 0,
    clock: 0,
    ship: { x: WORLD * 0.5, y: 220, vx: 0, vy: 0, facing: 1 },
    camX: WORLD * 0.5,
    slot: VW * 0.28,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    wave: 1,
    phase: 'raid',
    waveWait: 0,
    barren: false,
    humans: [],
    enemies: [],
    shots: [],
    bullets: [],
    mines: [],
    fireCd: 0,
    fireHold: false,
    baitT: 18,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    muzzle: 0,
    revFlash: 0,
    revLock: 0,
    toastT: 0,
    why: '',
    nextLife: LIFE_EVERY,
    abductBeep: 0,
    carry: null,
    thrustOn: false,
    endT: 0
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
  function hypot(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function isNight() {
    return G.kind === 'nuke';
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
  function wrapLerp(a, b, t) {
    return wrapX(a + wrapDx(a, b) * t);
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
    const n = Math.abs(Math.sin(t * 5.0)) * 26
      + Math.abs(Math.sin(t * 11.0 + 0.8)) * 11
      + Math.sin(t * 2.0 + 0.3) * 9
      + Math.abs(Math.sin(t * 23.0 + 1.4)) * 4;
    return GROUND - n;
  }
  function overlapR(ax, ay, ar, bx, by, br) {
    const dx = Math.abs(wrapDx(ax, bx));
    const dy = Math.abs(ay - by);
    return dx < ar + br && dy < ar + br;
  }
  function onScreen(x) {
    const vx = viewX(x);
    return vx > -36 && vx < VW + 36;
  }
  function maxVx() {
    return isNight() ? MAX_VX_N : MAX_VX;
  }
  function fireGap() {
    return isNight() ? FIRE_CD_N : FIRE_CD;
  }
  function shotCap() {
    return isNight() ? 6 : SHOT_MAX;
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
      this.beep(1480, 0.046, 'square', 0.028, 320);
      this.beep(720, 0.03, 'triangle', 0.012, 180);
    },
    hit(kind) {
      this.ensure();
      const base = kind === 'baiter' ? 920 : kind === 'mutant' ? 760 : kind === 'swarmer' ? 1100 : 540;
      this.noise(0.046, 0.02, 1300);
      this.beep(base, 0.07, 'square', 0.038, base * 1.5);
    },
    boom(big) {
      this.ensure();
      this.noise(big ? 0.18 : 0.1, big ? 0.068 : 0.038, big ? 180 : 340);
      this.beep(big ? 200 : 320, big ? 0.2 : 0.1, 'sawtooth', big ? 0.048 : 0.03, 48);
    },
    rescue() {
      this.ensure();
      this.beep(784, 0.07, 'sine', 0.04, 784);
      this.beep(1046, 0.11, 'triangle', 0.034);
      this.beep(1568, 0.16, 'sine', 0.032, 2093);
    },
    drop() {
      this.ensure();
      this.beep(523, 0.07, 'sine', 0.034, 784);
      this.beep(784, 0.12, 'triangle', 0.03, 1046);
    },
    reverse() {
      this.ensure();
      this.beep(880, 0.06, 'square', 0.03, 220);
      this.beep(220, 0.1, 'sawtooth', 0.022, 1100);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.036, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.026, 1176);
    },
    abduct() {
      this.ensure();
      this.beep(240, 0.07, 'triangle', 0.02, 420);
    },
    splat() {
      this.ensure();
      this.noise(0.08, 0.038, 480);
      this.beep(170, 0.1, 'sine', 0.028, 60);
    },
    mutant() {
      this.ensure();
      this.beep(170, 0.16, 'sawtooth', 0.04, 80);
      this.beep(400, 0.12, 'square', 0.026, 160);
    },
    barren() {
      this.ensure();
      this.beep(100, 0.28, 'sawtooth', 0.046, 42);
      this.noise(0.2, 0.046, 180);
    },
    swarm() {
      this.ensure();
      this.beep(110, 0.16, 'sawtooth', 0.042, 70);
      this.beep(330, 0.2, 'square', 0.03, 880);
      this.noise(0.12, 0.03, 500);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.1, 'triangle', 0.036, 1046);
      this.beep(1046, 0.16, 'sine', 0.04, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.2, 0.06, 220);
      this.beep(220, 0.24, 'sawtooth', 0.048, 50);
      this.beep(110, 0.34, 'sine', 0.04, 34);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.036, 784);
      this.beep(784, 0.14, 'triangle', 0.03, 1176);
    },
    wave() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.036, 784);
      this.beep(659, 0.12, 'triangle', 0.03, 988);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'square', 0.04, 659);
      this.beep(784, 0.12, 'triangle', 0.036, 1046);
      this.beep(1046, 0.22, 'sine', 0.042, 1568);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.036, 80);
      this.beep(110, 0.32, 'sine', 0.044, 42);
    },
    eShot() {
      this.ensure();
      this.beep(240, 0.05, 'square', 0.016, 90);
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
    while (G.score >= G.nextLife && G.lives < LIFE_CAP) {
      G.nextLife += LIFE_EVERY;
      G.lives += 1;
      audio.extra();
      toast('额外生命', false, true);
      screenFlash(GOLD, 0.5);
      kick(3);
      syncPips();
    }
    if (G.score >= G.nextLife) G.nextLife += LIFE_EVERY;
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

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      popFloat(G.ship.x, G.ship.y - 22, '×' + G.mult, GOLD, true);
    }
    if (comboEl && G.combo >= 2) {
      comboEl.hidden = false;
      comboEl.textContent = G.combo + ' 连 ×' + G.mult;
      comboEl.classList.remove('hot');
      void comboEl.offsetWidth;
      comboEl.classList.add('hot');
      comboTok += 1;
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
  }

  function liftingCount() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].kind === 'lander' && G.enemies[i].state === 'lift') n += 1;
    }
    return n;
  }

  function livingHumans() {
    let n = 0;
    for (let i = 0; i < G.humans.length; i++) {
      if (G.humans[i].state !== 'dead') n += 1;
    }
    return n;
  }

  function hostilesLeft() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) n += 1;
    }
    return n;
  }

  function raidLeft() {
    let n = 0;
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      if (e.kind === 'lander' || e.kind === 'bomber' || e.kind === 'pod' || e.kind === 'mutant') n += 1;
    }
    return n;
  }

  function phaseName() {
    if (G.mode === 'title') return '环星';
    if (G.barren) return '荒星';
    if (G.phase === 'swarm') return '虫潮';
    if (G.phase === 'clear') return '清波';
    return '巡空';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '防卫';
      else stageLabel.textContent = '第 ' + G.wave + ' 波';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.wave >= 4 || G.phase === 'swarm'));
    }
    if (tagLabel) {
      tagLabel.textContent = G.barren ? '荒星' : (isNight() ? '核袭夜' : '防卫');
      tagLabel.classList.toggle('warn', G.barren || G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', !G.barren && G.combo >= 8);
    }
    if (phaseLabel) {
      phaseLabel.textContent = phaseName();
      phaseLabel.classList.toggle('warn', G.phase === 'swarm' || G.barren);
      phaseLabel.classList.toggle('hot', G.phase === 'clear');
    }
    if (humanLabel) {
      const n = livingHumans();
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
    if (G.mode === 'title') setHint('←↑↓→ 飞 · 空格开火 · Shift 翻头 · 救人后贴地放下', '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞机扣命', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 行星守住了', 'hot');
    else if (G.barren) setHint('荒星 · 全是突变体，翻头打身后', 'warn');
    else if (G.phase === 'swarm') setHint('虫潮 · 翻头清掉追兵', 'warn');
    else if (livingHumans() <= 2) setHint('人快没了 · 先打带人的绑架者再去接', 'warn');
    else if (liftingCount() > 0) setHint('有人被带走 · 打掉绑架者，接住往下掉的', 'hot');
    else if (G.carry) setHint('贴地放下 · 别飞太高摔人', 'hot');
    else if (G.lives === 1) setHint('最后一命 · Shift 翻头打身后', 'warn');
    else setHint('←↑↓→ 飞 · 空格开火 · Shift 翻头 · 接住人', G.combo >= 6 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'HOLD' : 'DFND';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const end = kind === 'win' || kind === 'lose';
    if (ovStart) ovStart.classList.toggle('gone', end);
    if (ovEnd) ovEnd.classList.toggle('gone', !end);
    if (end && btnOvRetry) btnOvRetry.textContent = '再守';
    if (end && btnOvModes) {
      if (kind === 'win' && G.kind === 'guard') btnOvModes.textContent = '核袭夜';
      else btnOvModes.textContent = '换模式';
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
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.007));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
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
        g: spec.g == null ? 80 : spec.g
      });
    }
    capArr(particles, 360);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 48);
  }

  function popRing(x, y, rgb, r) {
    rings.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 10 });
    capArr(rings, 36);
  }

  function popFloat(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      vy: -56,
      t: 0,
      life: 0.72,
      text: text,
      rgb: rgb,
      gold: !!gold,
      size: gold ? 16 : 13
    });
    capArr(floats, 28);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * WORLD,
        y: rand(PLAY_TOP + 4, GROUND - 80),
        r: Math.random() < 0.16 ? 1.3 : 0.6,
        a: rand(0.22, 0.85),
        p: Math.random() * TAU,
        par: Math.random() < 0.4 ? 0.35 : 0.7,
        rgb: Math.random() < 0.2 ? ICE : Math.random() < 0.12 ? CYN : WHT
      });
    }
  }

  function seedPeaks() {
    peaks.length = 0;
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * WORLD;
      peaks.push({ x: x, y: terrainY(x) });
    }
  }

  function explode(x, y, rgb, big) {
    const k = big ? 1.35 : 1;
    emit(REDUCE ? 6 : (14 * k) | 0, {
      x: x, y: y, j: 8 * k,
      vx0: -180 * k, vx1: 180 * k,
      vy0: -220 * k, vy1: 80,
      r0: 1.2, r1: 3.4 * k,
      life: big ? 0.55 : 0.38,
      rgb: rgb, g: 40
    });
    popSpark(x, y, rgb, big ? 26 : 16);
    popRing(x, y, rgb, big ? 18 : 11);
  }

  function waveSpec(n) {
    const d = isNight();
    return {
      landers: (3 + n) + (d ? 2 : 0),
      bombers: n >= 2 ? (n >= 4 ? 2 : 1) + (d && n >= 3 ? 1 : 0) : 0,
      pods: n >= 4 ? n - 3 : (d && n >= 2 ? 1 : 0),
      baitT: (d ? 10 : 18) - n * 0.8,
      swarm: Math.round((7 + n * 2) * (d ? 1.45 : 1)),
      baiters: 1 + (n >= 4 ? 1 : 0) + (d ? 1 : 0)
    };
  }

  function spawnHuman(x) {
    const h = {
      x: wrapX(x),
      y: terrainY(x) - 8,
      vx: rand(-22, 22) || 16,
      state: 'walk',
      carrier: null,
      fallFrom: 0,
      vy: 0,
      t: rand(0, TAU)
    };
    G.humans.push(h);
    return h;
  }

  function spawnEnemy(kind, x, y) {
    const d = isNight();
    const en = {
      kind: kind,
      x: wrapX(x),
      y: y,
      vx: 0,
      vy: 0,
      facing: Math.random() < 0.5 ? -1 : 1,
      r: 12,
      hp: 1,
      score: 150,
      t: rand(0, TAU),
      shotCd: rand(0.6, 2.2),
      state: 'hunt',
      target: null,
      flash: 0,
      alive: true,
      rgb: MAG,
      dropT: rand(1.2, 2.4)
    };
    if (kind === 'lander') {
      en.r = 13;
      en.score = 150;
      en.rgb = MAG;
      en.vx = en.facing * (d ? 78 : 62);
    } else if (kind === 'mutant') {
      en.r = 13;
      en.score = 200;
      en.rgb = PNK;
      en.state = 'chase';
    } else if (kind === 'bomber') {
      en.r = 16;
      en.score = 250;
      en.rgb = ORG;
      en.y = rand(PLAY_TOP + 28, 110);
      en.vx = en.facing * (d ? 96 : 78);
      en.hp = 2;
    } else if (kind === 'pod') {
      en.r = 15;
      en.score = 1000;
      en.rgb = GOLD;
      en.vx = en.facing * 36;
      en.vy = rand(-18, 18);
    } else if (kind === 'swarmer') {
      en.r = 7;
      en.score = 100;
      en.rgb = WHT;
      en.state = 'chase';
    } else if (kind === 'baiter') {
      en.r = 11;
      en.score = 200;
      en.rgb = ICE;
      en.state = 'chase';
    }
    G.enemies.push(en);
    return en;
  }

  function spawnMine(x, y) {
    G.mines.push({
      x: wrapX(x),
      y: y,
      vy: 38,
      t: 0,
      alive: true
    });
  }

  function spawnSwarmers(x, y, n) {
    for (let i = 0; i < n; i++) {
      const en = spawnEnemy('swarmer', x + rand(-16, 16), y + rand(-10, 10));
      const a = rand(0, TAU);
      en.vx = Math.cos(a) * rand(80, 160);
      en.vy = Math.sin(a) * rand(60, 140);
    }
  }

  function seedHumans(n) {
    G.humans.length = 0;
    G.carry = null;
    const count = n == null ? HUMANS0 : n;
    for (let i = 0; i < count; i++) {
      spawnHuman((i + 0.5) * (WORLD / count) + rand(-40, 40));
    }
  }

  function beginWave(n) {
    G.wave = n;
    G.phase = 'raid';
    G.waveWait = 0;
    const spec = waveSpec(n);
    G.baitT = spec.baitT;
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const k = G.enemies[i].kind;
      if (k !== 'mutant') G.enemies.splice(i, 1);
    }
    G.mines.length = 0;
    G.bullets.length = 0;
    if (G.barren) {
      const m = spec.landers + spec.bombers;
      for (let i = 0; i < m; i++) {
        spawnEnemy('mutant', G.ship.x + 380 + i * (WORLD / Math.max(1, m)) + rand(-80, 80), rand(80, 220));
      }
    } else {
      for (let i = 0; i < spec.landers; i++) {
        const x = G.ship.x + 420 + i * (WORLD / Math.max(1, spec.landers)) + rand(-70, 70);
        spawnEnemy('lander', x, rand(PLAY_TOP + 24, 160));
      }
      for (let i = 0; i < spec.bombers; i++) {
        spawnEnemy('bomber', G.ship.x + 700 + i * 380, rand(PLAY_TOP + 30, 100));
      }
      for (let i = 0; i < spec.pods; i++) {
        spawnEnemy('pod', G.ship.x + 900 + i * 500, rand(90, 200));
      }
    }
    audio.wave();
    toast('第 ' + n + ' 波', false, true);
    syncHud();
  }

  function beginSwarm() {
    G.phase = 'swarm';
    const spec = waveSpec(G.wave);
    audio.swarm();
    toast(G.wave >= WAVES ? '终潮' : '虫潮', true, false);
    screenFlash(MAG, 0.45);
    kick(3.4);
    for (let i = 0; i < spec.swarm; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const x = G.ship.x + side * rand(280, 520) + rand(-40, 40);
      spawnEnemy('swarmer', x, rand(PLAY_TOP + 20, 280));
    }
    for (let i = 0; i < spec.baiters; i++) {
      spawnEnemy('baiter', G.ship.x + (i % 2 === 0 ? 360 : -360), rand(70, 180));
    }
    syncHud();
  }

  function clearWaveBonus() {
    const alive = livingHumans();
    const bonus = (200 * G.wave) + alive * 100 * G.wave;
    if (bonus > 0) {
      addScore(bonus);
      popFloat(G.ship.x, G.ship.y - 28, '+' + bonus, GOLD, true);
    }
  }

  function finishWave() {
    G.phase = 'clear';
    G.waveWait = 1.45;
    clearWaveBonus();
    audio.wave();
    toast(G.wave >= WAVES ? '终潮清了' : ('第 ' + G.wave + ' 波清了'), false, true);
    screenFlash(GOLD, 0.4);
    syncHud();
  }

  function maybeBarren() {
    if (G.barren) return;
    if (livingHumans() > 0) return;
    G.barren = true;
    audio.barren();
    toast('荒星', true, false);
    screenFlash(MAG, 0.55);
    kick(4);
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (e.alive && e.kind === 'lander') mutate(e, null);
    }
    syncHud();
  }

  function mutate(en, human) {
    en.kind = 'mutant';
    en.state = 'chase';
    en.rgb = PNK;
    en.score = 200;
    en.target = null;
    audio.mutant();
    explode(en.x, en.y, PNK, false);
    if (human) killHuman(human, false);
  }

  function dropLifted(en) {
    if (!en) return;
    if (en.state === 'lift' && en.target && en.target.state === 'lift') {
      const h = en.target;
      h.state = 'fall';
      h.carrier = null;
      h.fallFrom = h.y;
      h.vy = 20;
      h.vx = en.vx * 0.3;
    }
    en.target = null;
    en.state = 'hunt';
  }

  function killHuman(h, shot) {
    if (!h || h.state === 'dead') return;
    h.state = 'dead';
    if (G.carry === h) G.carry = null;
    explode(h.x, h.y, GOLD, false);
    if (G.mode !== 'play') return;
    audio.splat();
    popFloat(h.x, h.y - 10, shot ? '误射' : '摔了', RED, false);
    breakCombo();
    maybeBarren();
    syncHud();
  }

  function reverseShip() {
    const s = G.ship;
    s.facing *= -1;
    G.revFlash = 0.2;
    G.revLock = 0.55;
    audio.reverse();
    popRing(s.x, s.y, ICE, 16);
    emit(REDUCE ? 4 : 10, {
      x: s.x, y: s.y, j: 6,
      vx0: -s.facing * 40, vx1: -s.facing * 160,
      vy0: -40, vy1: 40,
      r0: 1, r1: 2.4,
      life: 0.28, rgb: CYN, g: 0
    });
    kick(1.4);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.endT > 0) return;
    if (G.fireCd > 0) return;
    if (G.shots.length >= shotCap()) return;
    const s = G.ship;
    G.fireCd = fireGap();
    G.muzzle = 0.06;
    G.shots.push({
      x: wrapX(s.x + s.facing * 16),
      y: s.y,
      vx: s.facing * SHOT_V + s.vx * 0.18,
      life: SHOT_LIFE,
      facing: s.facing
    });
    audio.shoot();
    if (!REDUCE) {
      emit(3, {
        x: wrapX(s.x + s.facing * 14), y: s.y, j: 2,
        vx0: s.facing * 80, vx1: s.facing * 180,
        vy0: -30, vy1: 30,
        r0: 0.8, r1: 1.8,
        life: 0.12, rgb: GOLD, g: 0
      });
    }
  }

  function enemyShot(en, spd) {
    const dx = wrapDx(en.x, G.ship.x);
    const dy = G.ship.y - en.y;
    const m = hypot(dx, dy) || 1;
    G.bullets.push({
      x: en.x,
      y: en.y,
      vx: (dx / m) * spd,
      vy: (dy / m) * spd,
      life: 1.6
    });
    audio.eShot();
  }

  function dieShip(why) {
    if (G.deadT > 0 || G.invuln > 0 || G.endT > 0) return;
    const s = G.ship;
    if (G.carry) {
      const h = G.carry;
      G.carry = null;
      h.state = 'fall';
      h.carrier = null;
      h.fallFrom = h.y;
      h.vy = 40;
    }
    explode(s.x, s.y, CYN, true);
    explode(s.x, s.y, GOLD, false);
    audio.death();
    kick(7);
    hitStop(0.07);
    screenFlash(MAG, 0.55);
    breakCombo();
    G.deadT = 0.92;
    G.why = why || '撞机';
    G.lives -= 1;
    G.bullets.length = 0;
    syncHud();
    if (G.lives <= 0) {
      G.endT = 0.95;
      G.why = 'lose';
    }
  }

  function winRun() {
    const bonus = (isNight() ? 8000 : 6000) + G.lives * 400 + livingHumans() * 200;
    const record = G.score + bonus > G.best;
    addScore(bonus);
    G.mode = 'win';
    G.endT = 0;
    audio.win();
    screenFlash(GOLD, 0.7);
    showOverlay(
      'win',
      isNight() ? '核袭击退' : '星核守住',
      (isNight() ? '核袭夜里五波虫潮打干净。' : '五波巡空加虫潮守下来了。') + ' 本局 ' + G.score + (record ? ' · 新纪录' : '')
    );
    syncHud();
  }

  function loseRun() {
    G.mode = 'lose';
    G.endT = 0;
    audio.lose();
    showOverlay(
      'lose',
      '舰毁了',
      (G.score >= G.best && G.score > 0 ? '新纪录 · ' : '') + '撞机耗尽。本局 ' + G.score + ' · R 再守'
    );
    syncHud();
  }

  function clearField() {
    G.enemies.length = 0;
    G.shots.length = 0;
    G.bullets.length = 0;
    G.mines.length = 0;
    G.humans.length = 0;
    G.carry = null;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    ghosts.length = 0;
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'nuke' ? 'nuke' : 'guard';
    G.t = 0;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.nextLife = LIFE_EVERY;
    G.ship.x = WORLD * 0.5;
    G.ship.y = 210;
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.ship.facing = 1;
    G.camX = wrapX(G.ship.x - (VW * 0.28 - VW * 0.5));
    G.slot = VW * 0.28;
    G.barren = false;
    G.phase = 'raid';
    G.wave = 1;
    G.waveWait = 0;
    G.fireCd = 0;
    G.muzzle = 0;
    G.revFlash = 0;
    G.revLock = 0;
    G.deadT = 0;
    G.invuln = 1.2;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0.32;
    G.flashRgb = CYN;
    G.punch = 1;
    G.why = '';
    G.endT = 0;
    G.carry = null;
    if (scoreEl) scoreEl.textContent = '0';
    clearField();
    seedHumans(HUMANS0);
    hideOverlay();
    audio.start();
    beginWave(1);
    toast(isNight() ? '核袭夜 · 更密更狠' : '防卫 · 左右环绕', false, true);
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'guard';
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.lives = LIVES;
    G.wave = 1;
    G.phase = 'raid';
    G.barren = false;
    G.deadT = 0;
    G.invuln = 0;
    G.endT = 0;
    G.ship.x = WORLD * 0.5;
    G.ship.y = 210;
    G.ship.vx = 90;
    G.ship.vy = 0;
    G.ship.facing = 1;
    G.camX = wrapX(G.ship.x - (VW * 0.28 - VW * 0.5));
    clearField();
    seedHumans(8);
    spawnEnemy('lander', G.ship.x + 280, 120);
    spawnEnemy('lander', G.ship.x - 420, 90);
    spawnEnemy('bomber', G.ship.x + 600, 70);
    showOverlay('title', '防卫', '左右环绕飞，翻头开火救人。清完一波会涌虫潮。撞机扣命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('guard');
    else startGame(G.kind || 'guard');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('guard');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function updateFx(dt) {
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.revFlash > 0) G.revFlash -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.life -= dt;
      q.vy += q.g * dt;
      q.x = wrapX(q.x + q.vx * dt);
      q.y += q.vy * dt;
      q.vx *= Math.exp(-dt * 1.1);
      q.vy *= Math.exp(-dt * 1.1);
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].t -= dt;
      if (ghosts[i].t <= 0) ghosts.splice(i, 1);
    }
  }

  function desiredSlot() {
    return G.ship.facing > 0 ? VW * 0.28 : VW * 0.72;
  }

  function updateCamera(dt) {
    G.slot = lerp(G.slot, desiredSlot(), 1 - Math.exp(-dt * 4.2));
    const want = wrapX(G.ship.x - (G.slot - VW * 0.5));
    G.camX = wrapLerp(G.camX, want, 1 - Math.exp(-dt * 5.5));
  }

  function updatePlayer(dt) {
    const s = G.ship;
    if (G.deadT > 0) {
      updateCamera(dt);
      return;
    }

    let ax = 0;
    let ay = 0;
    if (analog.on) {
      ax = analog.x;
      ay = analog.y;
    }
    if (keys.l) ax = -1;
    if (keys.r) ax = 1;
    if (keys.u) ay = -1;
    if (keys.d) ay = 1;
    if (pointer.down && !analog.on && G.mode === 'play') {
      const dx = wrapDx(s.x, pointer.wx);
      const dy = pointer.wy - s.y;
      const m = hypot(dx, dy);
      if (m > 8) {
        ax = clamp(dx / 90, -1, 1);
        ay = clamp(dy / 80, -1, 1);
      }
    }

    if (G.mode === 'title') {
      ax = s.facing;
      ay = Math.sin(G.t * 0.7) * 0.25;
    }

    G.thrustOn = Math.abs(ax) > 0.18;
    if (G.revLock > 0) G.revLock -= dt;
    if (G.thrustOn) {
      const dir = ax > 0 ? 1 : -1;
      s.vx += dir * THRUST * dt * Math.min(1, Math.abs(ax) + 0.2);
      if (G.revLock <= 0) {
        if (analog.on && Math.abs(analog.x) > 0.45) s.facing = dir;
        else if (pointer.down && !analog.on && !keys.l && !keys.r) s.facing = dir;
      }
    } else {
      s.vx *= Math.exp(-dt * 0.42);
    }
    s.vx = clamp(s.vx, -maxVx(), maxVx());
    const wantVy = ay * VY;
    s.vy = lerp(s.vy, wantVy, 1 - Math.exp(-dt * 8));
    s.x = wrapX(s.x + s.vx * dt);
    s.y += s.vy * dt;
    const floor = terrainY(s.x) - 10;
    if (s.y > floor) {
      s.y = floor;
      s.vy = Math.min(0, s.vy);
    }
    if (s.y < PLAY_TOP + 12) {
      s.y = PLAY_TOP + 12;
      s.vy = Math.max(0, s.vy);
    }

    if (G.thrustOn && !REDUCE && G.mode === 'play') {
      emit(1, {
        x: wrapX(s.x - s.facing * 12), y: s.y + rand(-2, 2), j: 1,
        vx0: -s.facing * 80, vx1: -s.facing * 180,
        vy0: -20, vy1: 20,
        r0: 0.8, r1: 2.1,
        life: 0.16, rgb: GOLD, g: 0
      });
    }
    if (!REDUCE && Math.abs(s.vx) > 140 && G.mode === 'play' && ((G.clock * 40) | 0) !== ((G.clock - dt) * 40 | 0)) {
      ghosts.push({ x: s.x, y: s.y, facing: s.facing, t: 0.16 });
      capArr(ghosts, 12);
    }
    updateCamera(dt);
  }

  function freeHuman(h) {
    return h && h.state === 'walk';
  }

  function nearestWalkHuman(x) {
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < G.humans.length; i++) {
      const h = G.humans[i];
      if (!freeHuman(h)) continue;
      const d = Math.abs(wrapDx(x, h.x));
      if (d < bd) {
        bd = d;
        best = h;
      }
    }
    return best;
  }

  function steerEnemy(en, dt) {
    en.t += dt;
    if (en.flash > 0) en.flash -= dt;
    const d = isNight();
    const s = G.ship;
    if (en.kind === 'lander') {
      if (en.state === 'lift' && en.target) {
        en.vy = d ? -78 : -64;
        en.vx *= Math.exp(-dt * 1.6);
        en.y += en.vy * dt;
        en.x = wrapX(en.x + en.vx * dt);
        en.target.x = en.x;
        en.target.y = en.y + 16;
        if (en.y < PLAY_TOP + 14) {
          if (G.mode === 'play') mutate(en, en.target);
          else {
            en.y = PLAY_TOP + 16;
            en.vy = 20;
          }
        }
        return;
      }
      let h = en.target && freeHuman(en.target) ? en.target : nearestWalkHuman(en.x);
      en.target = h;
      if (h) {
        const dx = wrapDx(en.x, h.x);
        const ty = h.y - 18;
        en.vx = lerp(en.vx, clamp(dx, -1, 1) * (d ? 92 : 74), 1 - Math.exp(-dt * 2.4));
        en.vy = lerp(en.vy, clamp(ty - en.y, -80, 90), 1 - Math.exp(-dt * 2));
        en.x = wrapX(en.x + en.vx * dt);
        en.y += en.vy * dt * 0.55;
        if (Math.abs(dx) < 14 && Math.abs(en.y - ty) < 16) {
          en.state = 'lift';
          h.state = 'lift';
          h.carrier = en;
          en.target = h;
        }
      } else {
        en.vx = lerp(en.vx, en.facing * (d ? 90 : 70), 1 - Math.exp(-dt * 1.4));
        en.vy = Math.sin(en.t * 1.6) * 36;
        en.x = wrapX(en.x + en.vx * dt);
        en.y += en.vy * dt * 0.4;
        chasePlayerLite(en, dt, d ? 70 : 50);
      }
      en.y = clamp(en.y, PLAY_TOP + 10, terrainY(en.x) - 22);
      maybeShoot(en, dt, d ? 1.35 : 1.9, 150);
    } else if (en.kind === 'mutant' || en.kind === 'baiter' || en.kind === 'swarmer') {
      const spd = en.kind === 'baiter' ? (d ? 250 : 210) : en.kind === 'swarmer' ? (d ? 200 : 170) : (d ? 180 : 150);
      const dx = wrapDx(en.x, s.x);
      const dy = s.y - en.y;
      const m = hypot(dx, dy) || 1;
      const jitter = en.kind === 'swarmer' ? Math.sin(en.t * 11 + en.x) * 70 : Math.sin(en.t * 4) * 40;
      en.vx = lerp(en.vx, (dx / m) * spd + jitter, 1 - Math.exp(-dt * 2.6));
      en.vy = lerp(en.vy, (dy / m) * spd * 0.85, 1 - Math.exp(-dt * 2.2));
      en.x = wrapX(en.x + en.vx * dt);
      en.y += en.vy * dt;
      en.y = clamp(en.y, PLAY_TOP + 8, terrainY(en.x) - 12);
      if (en.kind !== 'swarmer') maybeShoot(en, dt, en.kind === 'baiter' ? 0.85 : 1.15, en.kind === 'baiter' ? 210 : 170);
    } else if (en.kind === 'bomber') {
      if (Math.abs(en.vx) < 20) en.vx = en.facing * (d ? 96 : 78);
      en.x = wrapX(en.x + en.vx * dt);
      en.y += Math.sin(en.t * 1.8) * 12 * dt;
      en.y = clamp(en.y, PLAY_TOP + 22, 130);
      en.dropT -= dt;
      if (en.dropT <= 0 && G.mines.length < (d ? 10 : 7)) {
        spawnMine(en.x, en.y + 10);
        en.dropT = d ? rand(0.7, 1.4) : rand(1.1, 2.1);
      }
    } else if (en.kind === 'pod') {
      en.x = wrapX(en.x + en.vx * dt);
      en.y += Math.sin(en.t * 1.3) * 28 * dt;
      en.y = clamp(en.y, PLAY_TOP + 30, 260);
    }
  }

  function chasePlayerLite(en, dt, spd) {
    const dx = wrapDx(en.x, G.ship.x);
    if (Math.abs(dx) < 220) {
      en.vx = lerp(en.vx, Math.sign(dx || 1) * spd, 1 - Math.exp(-dt * 1.2));
    }
  }

  function maybeShoot(en, dt, gap, spd) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    en.shotCd -= dt;
    if (en.shotCd > 0) return;
    if (G.bullets.length > (isNight() ? 14 : 10)) return;
    const dx = wrapDx(en.x, G.ship.x);
    const dy = G.ship.y - en.y;
    if (hypot(dx, dy) > 340) {
      en.shotCd = 0.3;
      return;
    }
    if (Math.abs(dy) > 160 && Math.abs(dx) > 220) {
      en.shotCd = 0.25;
      return;
    }
    enemyShot(en, spd);
    en.shotCd = gap * rand(0.75, 1.2);
  }

  function updateHumans(dt) {
    for (let i = G.humans.length - 1; i >= 0; i--) {
      const h = G.humans[i];
      h.t += dt;
      if (h.state === 'dead') {
        G.humans.splice(i, 1);
        continue;
      }
      if (h.state === 'walk') {
        h.vx += rand(-12, 12) * dt;
        h.vx = clamp(h.vx, -28, 28);
        h.x = wrapX(h.x + h.vx * dt);
        h.y = terrainY(h.x) - 8;
      } else if (h.state === 'fall') {
        h.vy += 360 * dt;
        h.y += h.vy * dt;
        h.x = wrapX(h.x + h.vx * dt);
        const floor = terrainY(h.x) - 8;
        if (h.y >= floor) {
          h.y = floor;
          if (h.fallFrom < floor - 128) {
            killHuman(h, false);
          } else {
            h.state = 'walk';
            h.vy = 0;
            h.vx = rand(-18, 18);
          }
        }
        if (G.mode === 'play' && G.deadT <= 0 && !G.carry && overlapR(G.ship.x, G.ship.y, 16, h.x, h.y, 10)) {
          h.state = 'carry';
          G.carry = h;
          audio.rescue();
          bumpCombo();
          const pts = 500 * G.mult;
          addScore(pts);
          popFloat(h.x, h.y - 12, '救到了', GOLD, true);
          popRing(h.x, h.y, GOLD, 18);
          hitStop(0.046);
          kick(2.4);
          screenFlash(GOLD, 0.28);
        }
      } else if (h.state === 'carry') {
        h.x = wrapX(G.ship.x - G.ship.facing * 6);
        h.y = G.ship.y + 16;
        const floor = terrainY(h.x);
        if (G.ship.y > floor - 30) {
          h.state = 'walk';
          h.y = floor - 8;
          h.vx = G.ship.vx * 0.2;
          G.carry = null;
          audio.drop();
          bumpCombo();
          const pts = 250 * G.mult;
          addScore(pts);
          popFloat(h.x, h.y - 14, '落地', GOLD, true);
          popRing(h.x, h.y, MINT, 12);
        }
      }
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const sh = G.shots[i];
      sh.x = wrapX(sh.x + sh.vx * dt);
      sh.life -= dt;
      if (sh.life <= 0) {
        G.shots.splice(i, 1);
        continue;
      }
      let hit = false;
      for (let j = 0; j < G.enemies.length; j++) {
        const en = G.enemies[j];
        if (!en.alive) continue;
        if (overlapR(sh.x, sh.y, 5, en.x, en.y, en.r)) {
          hitEnemy(en, sh);
          hit = true;
          break;
        }
      }
      if (hit) {
        G.shots.splice(i, 1);
        continue;
      }
      for (let j = G.mines.length - 1; j >= 0; j--) {
        const m = G.mines[j];
        if (!m.alive) continue;
        if (overlapR(sh.x, sh.y, 5, m.x, m.y, 7)) {
          m.alive = false;
          explode(m.x, m.y, ORG, false);
          audio.hit('mine');
          bumpCombo();
          addScore(50 * G.mult);
          G.shots.splice(i, 1);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      for (let j = 0; j < G.humans.length; j++) {
        const h = G.humans[j];
        if (h.state === 'walk' || h.state === 'fall') {
          if (overlapR(sh.x, sh.y, 4, h.x, h.y, 7)) {
            killHuman(h, true);
            G.shots.splice(i, 1);
            break;
          }
        }
      }
    }
    for (let i = G.bullets.length - 1; i >= 0; i--) {
      const b = G.bullets[i];
      b.x = wrapX(b.x + b.vx * dt);
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0 || b.y < PLAY_TOP - 10 || b.y > VH + 20) G.bullets.splice(i, 1);
    }
    for (let i = G.mines.length - 1; i >= 0; i--) {
      const m = G.mines[i];
      if (!m.alive) {
        G.mines.splice(i, 1);
        continue;
      }
      m.t += dt;
      m.y += m.vy * dt;
      const floor = terrainY(m.x) - 6;
      if (m.y > floor) {
        m.y = floor;
        m.vy = 0;
      }
      if (m.t > 8) {
        G.mines.splice(i, 1);
      }
    }
  }

  function hitEnemy(en, sh) {
    en.hp -= 1;
    en.flash = 0.08;
    popSpark(en.x, en.y, en.rgb, 12);
    hitStop(0.034);
    kick(1.6);
    if (en.hp > 0) {
      audio.hit(en.kind);
      en.x = wrapX(en.x + (sh ? sh.facing * 8 : 0));
      return;
    }
    en.alive = false;
    audio.hit(en.kind);
    audio.boom(en.kind === 'pod' || en.kind === 'bomber');
    explode(en.x, en.y, en.rgb, en.kind === 'pod' || en.kind === 'baiter');
    bumpCombo();
    const pts = en.score * G.mult;
    addScore(pts);
    popFloat(en.x, en.y - 10, String(pts), en.rgb, G.mult >= 2);
    hitStop(en.kind === 'pod' ? 0.07 : 0.04);
    kick(en.kind === 'pod' ? 4.2 : 2.2);
    if (en.kind === 'lander') dropLifted(en);
    if (en.kind === 'pod') {
      spawnSwarmers(en.x, en.y, isNight() ? 5 : 4);
      toast('孢裂', false, true);
    }
  }

  function collide() {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0 || G.endT > 0) return;
    const s = G.ship;
    for (let i = 0; i < G.enemies.length; i++) {
      const en = G.enemies[i];
      if (!en.alive) continue;
      if (overlapR(s.x, s.y, SHIP_R, en.x, en.y, en.r * 0.82)) {
        dieShip('撞上' + (en.kind === 'lander' ? '绑架者' : en.kind === 'mutant' ? '突变体' : en.kind === 'swarmer' ? '虫潮' : en.kind === 'baiter' ? '诱饵' : '敌舰'));
        en.alive = false;
        dropLifted(en);
        explode(en.x, en.y, en.rgb, true);
        return;
      }
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      if (overlapR(s.x, s.y, SHIP_R - 1, b.x, b.y, 4)) {
        dieShip('中弹');
        return;
      }
    }
    for (let i = 0; i < G.mines.length; i++) {
      const m = G.mines[i];
      if (m.alive && overlapR(s.x, s.y, SHIP_R - 1, m.x, m.y, 7)) {
        m.alive = false;
        dieShip('触雷');
        return;
      }
    }
  }

  function pruneEnemies() {
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      if (!G.enemies[i].alive) G.enemies.splice(i, 1);
    }
  }

  function updateWave(dt) {
    if (G.phase === 'clear') {
      G.waveWait -= dt;
      if (G.waveWait <= 0) {
        if (G.wave >= WAVES) {
          G.endT = 0.2;
          G.why = 'win';
        } else {
          beginWave(G.wave + 1);
        }
      }
      return;
    }
    if (G.phase === 'raid') {
      G.baitT -= dt;
      if (G.baitT <= 0) {
        let hasBait = false;
        for (let i = 0; i < G.enemies.length; i++) {
          if (G.enemies[i].kind === 'baiter' && G.enemies[i].alive) hasBait = true;
        }
        if (!hasBait) {
          spawnEnemy('baiter', G.ship.x + (Math.random() < 0.5 ? 400 : -400), rand(80, 180));
          toast('诱饵', true, false);
          audio.mutant();
        }
        G.baitT = isNight() ? 8 : 12;
      }
      if (raidLeft() <= 0) beginSwarm();
    } else if (G.phase === 'swarm') {
      if (hostilesLeft() <= 0) finishWave();
    }
  }

  function titleDemo(dt) {
    if (G.enemies.length < 4 && Math.random() < 0.02) {
      spawnEnemy(Math.random() < 0.5 ? 'lander' : 'swarmer', G.ship.x + rand(300, 700), rand(80, 200));
    }
    if (G.humans.length < 6) spawnHuman(G.ship.x + rand(200, 900));
    pruneEnemies();
  }

  function playSim(dt) {
    if (G.fireCd > 0) G.fireCd -= dt;
    if ((keys.fire || (pointer.down && !analog.on)) && G.mode === 'play') fire();

    if (G.endT > 0) {
      G.endT -= dt;
      updatePlayer(dt);
      updateShots(dt);
      updateHumans(dt);
      if (G.endT <= 0) {
        if (G.why === 'lose') loseRun();
        else if (G.why === 'win') winRun();
      }
      return;
    }

    updatePlayer(dt);
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive) steerEnemy(G.enemies[i], dt);
    }
    pruneEnemies();
    updateShots(dt);
    updateHumans(dt);
    collide();
    updateWave(dt);

    if (liftingCount() > 0) {
      G.abductBeep -= dt;
      if (G.abductBeep <= 0) {
        audio.abduct();
        G.abductBeep = 0.55;
      }
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0 && G.lives > 0 && G.mode === 'play') {
        G.invuln = 1.7;
        G.ship.y = clamp(G.ship.y, 120, 240);
        G.ship.vx *= 0.3;
      }
    } else if (G.invuln > 0) {
      G.invuln -= dt;
    }
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
      updatePlayer(dt);
      for (let i = 0; i < G.enemies.length; i++) {
        if (G.enemies[i].alive) steerEnemy(G.enemies[i], dt);
      }
      updateHumans(dt);
      titleDemo(dt);
      updateFx(dt);
      return;
    }

    if (G.mode === 'play') playSim(dt);
    else {
      updatePlayer(dt);
      updateShots(dt);
    }
    updateFx(dt);
  }

  function sx(x) {
    return ox + viewX(x) * scale;
  }
  function sy(y) {
    return oy + y * scale;
  }

  function drawBg() {
    const night = isNight() || G.barren;
    const g0 = ctx.createLinearGradient(ox, oy, ox, oy + VH * scale);
    g0.addColorStop(0, night ? '#041018' : '#071820');
    g0.addColorStop(0.55, night ? '#08101c' : '#06141c');
    g0.addColorStop(1, night ? '#140814' : '#071c22');
    ctx.fillStyle = g0;
    ctx.fillRect(ox, oy, VW * scale, VH * scale);

    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy + RADAR_H * scale, VW * scale, (VH - RADAR_H) * scale);
    ctx.clip();
    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      const vx = viewX(st.x) * st.par + VW * 0.5 * (1 - st.par);
      if (vx < -4 || vx > VW + 4) continue;
      const tw = st.a * (0.65 + 0.35 * Math.sin(G.t * 2.2 + st.p));
      ctx.fillStyle = rgba(st.rgb, tw);
      ctx.fillRect(ox + vx * scale, oy + st.y * scale, st.r * scale, st.r * scale);
    }
    ctx.restore();
  }

  function drawRadar() {
    const y0 = oy;
    const h = RADAR_H * scale;
    ctx.fillStyle = isNight() ? '#05080e' : '#061018';
    ctx.fillRect(ox, y0, VW * scale, h);
    ctx.strokeStyle = rgba(ICE, 0.45);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ox, y0 + h);
    ctx.lineTo(ox + VW * scale, y0 + h);
    ctx.stroke();
    const viewW = VW / WORLD * VW;
    let vx = (wrapX(G.camX - VW * 0.5) / WORLD) * VW;
    ctx.fillStyle = rgba(GOLD, 0.12);
    if (vx + viewW <= VW) {
      ctx.fillRect(ox + vx * scale, y0 + 2 * scale, viewW * scale, h - 4 * scale);
    } else {
      const a = VW - vx;
      ctx.fillRect(ox + vx * scale, y0 + 2 * scale, a * scale, h - 4 * scale);
      ctx.fillRect(ox, y0 + 2 * scale, (viewW - a) * scale, h - 4 * scale);
    }
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.strokeRect(ox + vx * scale, y0 + 2 * scale, Math.min(viewW, VW - vx) * scale, h - 4 * scale);

    function blip(x, rgb, r) {
      const px = ox + (wrapX(x) / WORLD) * VW * scale;
      ctx.fillStyle = rgba(rgb, 0.95);
      ctx.beginPath();
      ctx.arc(px, y0 + h * 0.5, r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < G.humans.length; i++) {
      if (G.humans[i].state !== 'dead') blip(G.humans[i].x, GOLD, 1.3);
    }
    for (let i = 0; i < G.enemies.length; i++) {
      const e = G.enemies[i];
      if (!e.alive) continue;
      const rgb = e.kind === 'lander' ? MAG : e.kind === 'mutant' ? PNK : e.kind === 'baiter' ? ICE : e.kind === 'bomber' ? ORG : WHT;
      blip(e.x, rgb, e.kind === 'swarmer' ? 1.0 : 1.5);
    }
    blip(G.ship.x, CYN, 2.1);
  }

  function drawTerrain() {
    ctx.beginPath();
    let started = false;
    const step = 10;
    const left = G.camX - VW * 0.5 - 20;
    for (let x = left; x <= left + VW + 40; x += step) {
      const wx = wrapX(x);
      const px = sx(wx);
      const py = sy(terrainY(wx));
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else ctx.lineTo(px, py);
    }
    ctx.lineTo(ox + (VW + 8) * scale, oy + VH * scale);
    ctx.lineTo(ox - 8 * scale, oy + VH * scale);
    ctx.closePath();
    ctx.fillStyle = isNight() || G.barren ? 'rgba(18, 8, 18, 0.92)' : 'rgba(6, 28, 34, 0.92)';
    ctx.fill();
    ctx.strokeStyle = rgba(G.barren ? MAG : CYN, 0.85);
    ctx.lineWidth = 1.6 * scale;
    ctx.stroke();
  }

  function strokePoly(pts, rgb, glow, lw) {
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const px = pts[i][0] * scale;
      const py = pts[i][1] * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    if (glow) {
      ctx.strokeStyle = rgba(rgb, 0.2);
      ctx.lineWidth = (lw || 1.4) * 3.2 * scale;
      ctx.stroke();
    }
    ctx.strokeStyle = rgba(rgb, 1);
    ctx.lineWidth = (lw || 1.4) * scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    const s = G.ship;
    if (!REDUCE) {
      for (let i = 0; i < ghosts.length; i++) {
        const g = ghosts[i];
        ctx.save();
        ctx.globalAlpha = g.t * 1.8;
        ctx.translate(sx(g.x), sy(g.y));
        ctx.scale(g.facing, 1);
        ctx.beginPath();
        ctx.moveTo(14 * scale, 0);
        ctx.lineTo(-10 * scale, 7 * scale);
        ctx.lineTo(-6 * scale, 0);
        ctx.lineTo(-10 * scale, -7 * scale);
        ctx.closePath();
        ctx.strokeStyle = rgba(CYN, 0.5);
        ctx.lineWidth = 1.1 * scale;
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.save();
    ctx.translate(sx(s.x), sy(s.y));
    ctx.scale(s.facing, 1);
    if (G.revFlash > 0) {
      ctx.strokeStyle = rgba(WHT, G.revFlash * 3);
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.moveTo(-18 * scale, 0);
      ctx.lineTo(20 * scale, 0);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(16 * scale, 0);
    ctx.lineTo(-10 * scale, 7.5 * scale);
    ctx.lineTo(-5 * scale, 2 * scale);
    ctx.lineTo(-12 * scale, 0);
    ctx.lineTo(-5 * scale, -2 * scale);
    ctx.lineTo(-10 * scale, -7.5 * scale);
    ctx.closePath();
    ctx.strokeStyle = rgba(WHT, G.mode === 'title' ? 0.45 : 1);
    ctx.lineWidth = 1.7 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4 * scale, 0);
    ctx.lineTo(-8 * scale, 0);
    ctx.strokeStyle = rgba(CYN, 0.95);
    ctx.lineWidth = 1.2 * scale;
    ctx.stroke();
    if (G.thrustOn && !REDUCE) {
      const flick = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(G.t * 48));
      ctx.beginPath();
      ctx.moveTo(-11 * scale, -3.2 * scale);
      ctx.lineTo((-18 - 7 * flick) * scale, 0);
      ctx.lineTo(-11 * scale, 3.2 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.9 * flick);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }
    if (G.muzzle > 0) {
      ctx.beginPath();
      ctx.moveTo(16 * scale, 0);
      ctx.lineTo(28 * scale, 0);
      ctx.strokeStyle = rgba(GOLD, 0.9);
      ctx.lineWidth = 2.1 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnemy(en) {
    const rgb = en.flash > 0 ? WHT : en.rgb;
    ctx.save();
    ctx.translate(sx(en.x), sy(en.y));
    if (en.kind === 'lander') {
      strokePoly([[-8, -6], [8, -6], [6, 2], [-6, 2]], rgb, true, 1.3);
      ctx.beginPath();
      ctx.moveTo(-5 * scale, 2 * scale);
      ctx.lineTo(-8 * scale, 10 * scale);
      ctx.moveTo(0, 2 * scale);
      ctx.lineTo(0, 11 * scale);
      ctx.moveTo(5 * scale, 2 * scale);
      ctx.lineTo(8 * scale, 10 * scale);
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.3 * scale;
      ctx.stroke();
      if (en.state === 'lift') {
        ctx.beginPath();
        ctx.moveTo(0, 11 * scale);
        ctx.lineTo(0, 20 * scale);
        ctx.strokeStyle = rgba(GOLD, 0.7);
        ctx.stroke();
      }
    } else if (en.kind === 'mutant') {
      const w = 1 + 0.12 * Math.sin(en.t * 10);
      ctx.scale(w, 1);
      strokePoly([[-7, -7], [7, -4], [9, 4], [0, 8], [-9, 3]], rgb, true, 1.35);
      ctx.beginPath();
      ctx.moveTo(4 * scale, 4 * scale);
      ctx.lineTo(12 * scale, 9 * scale);
      ctx.moveTo(-4 * scale, 4 * scale);
      ctx.lineTo(-12 * scale, 9 * scale);
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.stroke();
    } else if (en.kind === 'bomber') {
      strokePoly([[-14, -5], [14, -5], [12, 5], [-12, 5]], rgb, true, 1.4);
      ctx.beginPath();
      ctx.arc(-4 * scale, 0, 2.1 * scale, 0, TAU);
      ctx.arc(4 * scale, 0, 2.1 * scale, 0, TAU);
      ctx.fillStyle = rgba(((en.t * 6) | 0) % 2 === 0 ? GOLD : rgb, 0.9);
      ctx.fill();
    } else if (en.kind === 'pod') {
      ctx.beginPath();
      ctx.arc(0, 0, 11 * scale, 0, TAU);
      ctx.strokeStyle = rgba(rgb, 0.22);
      ctx.lineWidth = 4.2 * scale;
      ctx.stroke();
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 4 * scale, 0, TAU);
      ctx.stroke();
    } else if (en.kind === 'swarmer') {
      strokePoly([[8, 0], [-5, 4], [-5, -4]], rgb, false, 1.15);
    } else if (en.kind === 'baiter') {
      strokePoly([[0, -8], [10, 0], [0, 8], [-10, 0]], rgb, true, 1.3);
      ctx.beginPath();
      ctx.arc(0, 0, 3 * scale, 0, TAU);
      ctx.strokeStyle = rgba(WHT, 0.9);
      ctx.lineWidth = 1.1 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHumans() {
    for (let i = 0; i < G.humans.length; i++) {
      const h = G.humans[i];
      if (h.state === 'dead') continue;
      if (!onScreen(h.x) && h.state !== 'carry') continue;
      ctx.save();
      ctx.translate(sx(h.x), sy(h.y));
      const rgb = h.state === 'lift' ? PNK : h.state === 'fall' ? GOLD : h.state === 'carry' ? MINT : GOLD;
      ctx.strokeStyle = rgba(rgb, 1);
      ctx.lineWidth = 1.3 * scale;
      ctx.beginPath();
      ctx.arc(0, -6 * scale, 2.2 * scale, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -3.6 * scale);
      ctx.lineTo(0, 3 * scale);
      ctx.moveTo(-3.4 * scale, -0.5 * scale);
      ctx.lineTo(3.4 * scale, -0.5 * scale);
      ctx.moveTo(0, 3 * scale);
      ctx.lineTo(-3 * scale, 8 * scale);
      ctx.moveTo(0, 3 * scale);
      ctx.lineTo(3 * scale, 8 * scale);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const sh = G.shots[i];
      const x = sx(sh.x);
      const y = sy(sh.y);
      ctx.strokeStyle = rgba(GOLD, 0.95);
      ctx.lineWidth = 2.1 * scale;
      ctx.beginPath();
      ctx.moveTo(x - sh.facing * 10 * scale, y);
      ctx.lineTo(x + sh.facing * 6 * scale, y);
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.8);
      ctx.lineWidth = 1 * scale;
      ctx.stroke();
    }
    for (let i = 0; i < G.bullets.length; i++) {
      const b = G.bullets[i];
      ctx.fillStyle = rgba(MAG, 0.9);
      ctx.beginPath();
      ctx.arc(sx(b.x), sy(b.y), 2.4 * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < G.mines.length; i++) {
      const m = G.mines[i];
      if (!m.alive) continue;
      const pulse = 0.6 + 0.4 * Math.sin(m.t * 10);
      ctx.strokeStyle = rgba(ORG, pulse);
      ctx.lineWidth = 1.3 * scale;
      ctx.strokeRect(sx(m.x) - 4 * scale, sy(m.y) - 4 * scale, 8 * scale, 8 * scale);
      ctx.fillStyle = rgba(GOLD, 0.7 * pulse);
      ctx.fillRect(sx(m.x) - 1.4 * scale, sy(m.y) - 1.4 * scale, 2.8 * scale, 2.8 * scale);
    }
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      const a = clamp(q.life / q.max, 0, 1);
      ctx.fillStyle = rgba(q.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), q.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const k = s.t / 0.36;
      ctx.strokeStyle = rgba(s.rgb, 0.65 * (1 - k));
      ctx.lineWidth = (2.6 - k) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.rad * 0.35 + k * s.rad) * scale, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const s = rings[i];
      const k = s.t / 0.42;
      ctx.strokeStyle = rgba(s.rgb, 0.5 * (1 - k));
      ctx.lineWidth = (2.1 - k * 1.4) * scale;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), (s.r + k * 30) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloats() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = clamp(1 - f.t / f.life, 0, 1);
      ctx.globalAlpha = a;
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, 1);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
    ctx.restore();
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.18);
    ctx.fillRect(ox, oy, VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020d14';
    ctx.fillRect(0, 0, W, H);
    const shx = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    const shy = REDUCE ? 0 : (Math.random() - 0.5) * G.shake * scale;
    ctx.setTransform(dpr, 0, 0, dpr, shx, shy);
    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, VW * scale, VH * scale);
    ctx.clip();
    if (G.punch !== 1 && !REDUCE) {
      const cx = ox + VW * 0.5 * scale;
      const cy = oy + VH * 0.5 * scale;
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }
    drawBg();
    drawRadar();
    drawTerrain();
    drawHumans();
    for (let i = 0; i < G.enemies.length; i++) {
      if (G.enemies[i].alive && onScreen(G.enemies[i].x)) drawEnemy(G.enemies[i]);
    }
    drawShots();
    drawShip();
    drawParticles();
    drawFloats();
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

  function canvasToPlay(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    return { x: (x - ox) / scale, y: (y - oy) / scale };
  }

  function playToWorld(p) {
    return { x: wrapX(G.camX + (p.x - VW * 0.5)), y: p.y };
  }

  function setAnalogFromStick(e) {
    if (!stickEl) return;
    const rect = stickEl.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    let dx = (e.clientX - cx) / (rect.width * 0.42);
    let dy = (e.clientY - cy) / (rect.height * 0.42);
    const m = hypot(dx, dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    analog.x = dx;
    analog.y = dy;
    analog.on = m > 0.12;
    if (knobEl) {
      knobEl.style.transform = 'translate(' + (dx * 28) + 'px,' + (dy * 28) + 'px)';
    }
    if (stickEl) stickEl.classList.toggle('on', analog.on);
  }

  function clearAnalog() {
    analog.x = 0;
    analog.y = 0;
    analog.on = false;
    if (knobEl) knobEl.style.transform = '';
    if (stickEl) stickEl.classList.remove('on');
  }

  function onKey(e, down) {
    const code = e.code || '';
    const k = e.key;
    const left = code === 'KeyA' || code === 'ArrowLeft';
    const right = code === 'KeyD' || code === 'ArrowRight';
    const up = code === 'KeyW' || code === 'ArrowUp';
    const dn = code === 'KeyS' || code === 'ArrowDown';
    const space = code === 'Space' || k === ' ';
    const rev = code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyZ';
    if (down && (left || right || up || dn || space || k === 'Enter' || rev)) e.preventDefault();

    if (left) {
      keys.l = down;
      if (down && !e.repeat && G.mode !== 'title') G.ship.facing = -1;
    }
    if (right) {
      keys.r = down;
      if (down && !e.repeat && G.mode !== 'title') G.ship.facing = 1;
    }
    if (up) keys.u = down;
    if (dn) keys.d = down;
    if (space) keys.fire = down && G.mode === 'play' && !overlayOpen();

    if (!down) return;
    if (e.repeat) return;

    if (code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (code === 'KeyR') {
      restart();
      return;
    }
    if (rev && G.mode === 'play' && !overlayOpen() && G.deadT <= 0) {
      reverseShip();
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') fire();
    }
    if ((k === '1' || code === 'Digit1') && overlayOpen() && G.mode === 'title') {
      startGame('guard');
    }
    if ((k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') {
      startGame('nuke');
    }
  }

  function holdPad(el, press, release) {
    if (!el) return;
    let held = false;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      held = true;
      el.classList.add('on');
      if (el.setPointerCapture) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      press();
    });
    function up() {
      if (!held) return;
      held = false;
      el.classList.remove('on');
      if (release) release();
    }
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
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
  seedPeaks();
  loadBest();
  initMute();
  goTitle();
  resize();

  holdPad(padFire, function () { keys.fire = true; fire(); }, function () { keys.fire = false; });
  holdPad(padRev, function () {
    if (G.mode === 'play' && !overlayOpen() && G.deadT <= 0) reverseShip();
  }, null);

  if (stickEl) {
    stickEl.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      if (padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      if (stickEl.setPointerCapture) {
        try { stickEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      setAnalogFromStick(e);
    });
    stickEl.addEventListener('pointermove', function (e) {
      if (!analog.on && !(e.buttons & 1) && e.pointerType !== 'touch') return;
      if (stickEl.hasPointerCapture && !stickEl.hasPointerCapture(e.pointerId) && e.pointerType !== 'touch') return;
      setAnalogFromStick(e);
    });
    function stickUp() { clearAnalog(); }
    stickEl.addEventListener('pointerup', stickUp);
    stickEl.addEventListener('pointercancel', stickUp);
    stickEl.addEventListener('lostpointercapture', stickUp);
  }

  if (btnGuard) {
    btnGuard.addEventListener('click', function () {
      audio.ensure();
      startGame('guard');
    });
  }
  if (btnNuke) {
    btnNuke.addEventListener('click', function () {
      audio.ensure();
      startGame('nuke');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'guard');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'win' && G.kind === 'guard') startGame('nuke');
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

  if (canvas) {
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (e.button != null && e.button !== 0) return;
      if (e.pointerType === 'touch' && padsEl) {
        padsEl.classList.add('show');
        padsEl.setAttribute('aria-hidden', 'false');
      }
      if (overlayOpen()) {
        if (e.pointerType !== 'touch') primaryAction();
        return;
      }
      pointer.down = true;
      pointer.id = e.pointerId;
      const p = playToWorld(canvasToPlay(e));
      pointer.wx = p.x;
      pointer.wy = p.y;
      if (G.mode === 'play') {
        keys.fire = true;
        fire();
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (!pointer.down || pointer.id !== e.pointerId) return;
      const p = playToWorld(canvasToPlay(e));
      pointer.wx = p.x;
      pointer.wy = p.y;
    });
    function ptrUp(e) {
      if (e && pointer.id != null && e.pointerId !== pointer.id) return;
      pointer.down = false;
      pointer.id = null;
      keys.fire = false;
    }
    canvas.addEventListener('pointerup', ptrUp);
    canvas.addEventListener('pointercancel', ptrUp);
    canvas.addEventListener('lostpointercapture', ptrUp);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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
      pointer.down = false;
      clearAnalog();
    }
  });

  requestAnimationFrame(frame);
})();
