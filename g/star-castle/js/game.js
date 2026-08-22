'use strict';

(function () {
  const VW = 720;
  const VH = 640;
  const CX = 360;
  const CY = 318;
  const LIVES = 3;
  const MAX_LIVES = 6;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SHIP_R = 9;
  const ROT = 4.05;
  const THRUST = 236;
  const REV = 152;
  const MAX_V = 300;
  const DRAG = 0.11;
  const SHOT_V = 430;
  const TUR_V = 265;
  const SHOT_LIFE = 1.28;
  const SHOT_R = 3.1;
  const MAX_BOUNCE = 5;
  const COMBO_WIN = 1.32;
  const EXTRA_LIFE = 12000;
  const STAGES = 5;
  const SEG = 6;
  const RING_R = [156, 112, 72];
  const RING_W = 8;
  const CORE_R = 15;
  const MINE_R = 7.2;
  const BEST_KEY = 'playbox-star-castle-best';
  const MUTE_KEY = 'playbox-star-castle-mute';
  const OPS = '← → / A D 转向 · W / ↑ 推进 · S / ↓ 后退 · 空格开火';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const ICE = [180, 140, 255];
  const GOLD = [255, 227, 107];
  const WHT = [244, 240, 255];
  const PUR = [155, 77, 255];
  const RING_RGB = [CYN, GOLD, MAG];
  const RING_NAME = ['外环', '中环', '内环'];
  const SEG_SCORE = [20, 40, 70];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnSiege = document.getElementById('btn-siege');
  const btnWild = document.getElementById('btn-wild');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const padsEl = document.getElementById('pads');
  const padCcw = document.getElementById('pad-ccw');
  const padCw = document.getElementById('pad-cw');
  const padThrust = document.getElementById('pad-thrust');
  const padRev = document.getElementById('pad-rev');
  const padFire = document.getElementById('pad-fire');

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
  const pips = [];
  const particles = [];
  const sparks = [];
  const ringsFx = [];
  const floats = [];
  const shards = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'siege',
    t: 0,
    clock: 0,
    stage: 1,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    nextLife: EXTRA_LIFE,
    ship: { x: CX, y: CY + 248, vx: 0, vy: 0, ang: -Math.PI / 2 },
    rings: [],
    shots: [],
    mines: [],
    turret: { ang: 0, cd: 1.2 },
    core: true,
    fireCd: 0,
    mineCd: 4,
    regenCd: 6,
    ready: 0,
    deadT: 0,
    invuln: 0,
    buildT: 0,
    boomT: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: ICE,
    punch: 1,
    toastT: 0,
    thrustT: 0,
    thrustSnd: 0,
    why: '',
    exposed: false
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
  function wrap(v, max) {
    return ((v % max) + max) % max;
  }
  function wrapAng(a) {
    a = a % TAU;
    if (a < -Math.PI) a += TAU;
    if (a > Math.PI) a -= TAU;
    return a;
  }
  function wrapDelta(a, b, size) {
    let d = a - b;
    const h = size * 0.5;
    if (d > h) d -= size;
    if (d < -h) d += size;
    return d;
  }
  function wrapPos(x, y) {
    return { x: wrap(x, VW), y: wrap(y, VH) };
  }
  function wrapDist(ax, ay, bx, by) {
    const dx = wrapDelta(ax, bx, VW);
    const dy = wrapDelta(ay, by, VH);
    return { dx: dx, dy: dy, d: hypot(dx, dy) };
  }
  function isWild() {
    return G.kind === 'wild';
  }
  function spinMul() {
    return (1 + (G.stage - 1) * 0.12) * (isWild() ? 1.12 : 1);
  }
  function maxShots() {
    return isWild() ? 4 : 3;
  }
  function fireWait() {
    return isWild() ? 0.13 : 0.19;
  }
  function turretWait() {
    const base = isWild() ? 0.52 : 1.42;
    return Math.max(isWild() ? 0.28 : 0.78, base - (G.stage - 1) * (isWild() ? 0.05 : 0.12));
  }
  function mineWait() {
    return isWild() ? 3.1 : 5.4;
  }
  function mineCap() {
    return isWild() ? 5 : 3;
  }
  function regenWait() {
    return Math.max(3.2, (isWild() ? 5.2 : 6.2) - (G.stage - 1) * 0.45);
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
      this.beep(1240, 0.05, 'square', 0.026, 260);
      this.beep(680, 0.035, 'triangle', 0.014, 160);
    },
    thrust() {
      this.ensure();
      this.noise(0.05, 0.014, 280);
      this.beep(72, 0.05, 'sawtooth', 0.012, 42);
    },
    bounce(ring) {
      this.ensure();
      const hi = ring === 0 ? 980 : ring === 1 ? 780 : 620;
      this.beep(hi, 0.045, 'square', 0.034, hi * 0.42);
      this.beep(hi * 1.5, 0.03, 'triangle', 0.018, 180);
    },
    crack(ring) {
      this.ensure();
      const lo = ring === 0 ? 220 : ring === 1 ? 180 : 140;
      this.noise(0.09, 0.05, 320);
      this.beep(720 - ring * 90, 0.1, 'square', 0.042, lo);
      this.beep(lo * 2.2, 0.12, 'triangle', 0.024, lo);
    },
    turret() {
      this.ensure();
      this.beep(320, 0.07, 'sawtooth', 0.028, 140);
      this.beep(880, 0.04, 'square', 0.016, 240);
    },
    mine() {
      this.ensure();
      this.beep(180, 0.08, 'sine', 0.022, 90);
    },
    mineHit() {
      this.ensure();
      this.noise(0.08, 0.04, 500);
      this.beep(520, 0.09, 'square', 0.036, 180);
    },
    combo(m) {
      this.ensure();
      this.beep(392 * m, 0.08, 'sine', 0.038, 588 * m);
      this.beep(784, 0.12, 'triangle', 0.028, 1176);
    },
    extra() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.1, 'triangle', 0.038, 1046);
      this.beep(1046, 0.18, 'sine', 0.042, 1568);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.06, 260);
      this.beep(240, 0.22, 'sawtooth', 0.05, 58);
      this.beep(140, 0.34, 'sine', 0.042, 40);
    },
    regen() {
      this.ensure();
      this.beep(220, 0.08, 'sine', 0.03, 440);
      this.beep(440, 0.12, 'triangle', 0.028, 330);
    },
    core() {
      this.ensure();
      this.noise(0.28, 0.08, 180);
      this.beep(90, 0.36, 'sawtooth', 0.055, 40);
      this.beep(880, 0.16, 'square', 0.04, 220);
      this.beep(1320, 0.22, 'triangle', 0.032, 280);
    },
    win() {
      this.ensure();
      this.beep(392, 0.1, 'square', 0.04, 523);
      this.beep(523, 0.12, 'triangle', 0.038, 784);
      this.beep(784, 0.22, 'sine', 0.042, 1176);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.18, 'sawtooth', 0.038, 80);
      this.beep(110, 0.32, 'sine', 0.046, 42);
    },
    start() {
      this.ensure();
      this.beep(392, 0.08, 'square', 0.038, 784);
      this.beep(784, 0.14, 'triangle', 0.032, 1176);
    },
    close() {
      this.ensure();
      this.beep(160, 0.1, 'sawtooth', 0.034, 80);
      this.noise(0.08, 0.03, 240);
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
    while (G.score >= G.nextLife) {
      G.nextLife += EXTRA_LIFE;
      if (G.lives >= MAX_LIVES) continue;
      G.lives += 1;
      audio.extra();
      toast('额外生命', false, true);
      screenFlash(GOLD, 0.55);
      kick(3.2);
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
      toast('连击 ×' + G.mult, false, true);
      if (comboEl) {
        comboTok += 1;
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
      }
    }
  }

  function kindName() {
    return isWild() ? '乱弹' : '围攻';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '星堡';
      else stageLabel.textContent = '第 ' + G.stage + ' 堡';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.exposed || G.stage >= 4));
    }
    if (tagLabel) {
      tagLabel.textContent = G.mode === 'title' ? 'CAST' : (G.exposed ? '可击核' : kindName());
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.exposed || G.combo >= 8);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 弹回也会要命', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 核已击穿', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 别被弹回打中', 'warn');
    else if (G.exposed) setHint('缺口对准核 · 立刻打进去', 'hot');
    else setHint('撕开三环缺口 · 弹会反弹', G.combo >= 6 ? 'hot' : '');
    syncPips();
  }

  function showOverlay(kind, title, lead, primary, showWildBtn, wildLabel) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'CAST';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnSiege.textContent = primary;
    btnWild.classList.toggle('hidden', !showWildBtn);
    btnWild.textContent = wildLabel || '乱弹';
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
    const cls = mag >= 6 ? 'boom' : mag >= 5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('boom');
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
        g: spec.g == null ? 0 : spec.g
      });
    }
    capArr(particles, 380);
  }

  function popSpark(x, y, rgb, rad) {
    sparks.push({ x: x, y: y, t: 0, rgb: rgb, rad: rad || 16 });
    capArr(sparks, 48);
  }

  function popRing(x, y, rgb, r) {
    ringsFx.push({ x: x, y: y, t: 0, rgb: rgb, r: r || 10 });
    capArr(ringsFx, 36);
  }

  function popFloat(x, y, text, rgb, gold) {
    floats.push({
      x: x,
      y: y,
      vy: -52,
      t: 0,
      life: 0.72,
      text: text,
      rgb: rgb,
      gold: !!gold,
      size: gold ? 16 : 13
    });
    capArr(floats, 28);
  }

  function burst(x, y, rgb, n, spd) {
    const s = spd || 140;
    emit(n, {
      x: x, y: y, j: 4,
      vx0: -s, vx1: s, vy0: -s, vy1: s,
      r0: 1.2, r1: 3.4, life: 0.42, rgb: rgb, g: 18
    });
    popSpark(x, y, rgb, 18);
    popRing(x, y, rgb, 12);
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 110; i++) {
      stars.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        r: Math.random() < 0.16 ? 1.35 : 0.65,
        a: rand(0.22, 0.88),
        p: Math.random() * TAU,
        rgb: Math.random() < 0.28 ? PUR : Math.random() < 0.16 ? CYN : Math.random() < 0.1 ? MAG : WHT
      });
    }
  }

  function ringVert(rot, r, i) {
    const a = rot + i * (TAU / SEG) - Math.PI / 2;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
  }

  function makeRing(idx) {
    const segs = [];
    for (let i = 0; i < SEG; i++) segs.push({ alive: true, flash: 0 });
    const base = [0.32, -0.48, 0.62][idx];
    return {
      r: RING_R[idx],
      rot: idx * 0.35,
      spin: base,
      rgb: RING_RGB[idx],
      segs: segs,
      scale: 1
    };
  }

  function liveCount(ring) {
    let n = 0;
    for (let i = 0; i < SEG; i++) if (ring.segs[i].alive) n += 1;
    return n;
  }

  function ringBlocks(ring, ang) {
    const a = wrap(ang - ring.rot + Math.PI / 2, TAU);
    const i = Math.floor(a / (TAU / SEG)) % SEG;
    return ring.segs[i].alive;
  }

  function coreExposed() {
    if (!G.core || G.boomT > 0 || G.buildT > 0) return false;
    const a = Math.atan2(G.ship.y - CY, G.ship.x - CX);
    for (let i = 0; i < G.rings.length; i++) {
      if (ringBlocks(G.rings[i], a)) return false;
    }
    return true;
  }

  function segHit(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    let t = ab2 > 0 ? (apx * abx + apy * aby) / ab2 : 0;
    t = clamp(t, 0, 1);
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    const dx = px - cx;
    const dy = py - cy;
    return { d: hypot(dx, dy), t: t, cx: cx, cy: cy, dx: dx, dy: dy };
  }

  function crackSeg(ring, idx, mx, my, shot) {
    const rgb = ring.rgb;
    const verts0 = ringVert(ring.rot, ring.r, idx);
    const verts1 = ringVert(ring.rot, ring.r, idx + 1);
    const ax = verts0[0];
    const ay = verts0[1];
    const bx = verts1[0];
    const by = verts1[1];
    for (let k = 0; k < 4; k++) {
      const t = (k + 0.5) / 4;
      const x = lerp(ax, bx, t);
      const y = lerp(ay, by, t);
      shards.push({
        x: x, y: y,
        vx: rand(-80, 80) + (shot ? shot.vx * 0.08 : 0),
        vy: rand(-80, 80) + (shot ? shot.vy * 0.08 : 0),
        life: rand(0.28, 0.55),
        ang: Math.random() * TAU,
        spin: rand(-8, 8),
        len: rand(6, 14),
        rgb: rgb
      });
    }
    capArr(shards, 80);
    emit(10, {
      x: mx, y: my, j: 3,
      vx0: -90, vx1: 90, vy0: -90, vy1: 90,
      r0: 1.1, r1: 2.6, life: 0.32, rgb: rgb, g: 10
    });
    popSpark(mx, my, rgb, 14);
  }

  function bounceShot(shot, hit, ringIdx) {
    let nx = hit.dx;
    let ny = hit.dy;
    const nd = hypot(nx, ny) || 1;
    nx /= nd;
    ny /= nd;
    const dot = shot.vx * nx + shot.vy * ny;
    if (dot < 0) {
      shot.vx -= 2 * dot * nx;
      shot.vy -= 2 * dot * ny;
    }
    const spd = hypot(shot.vx, shot.vy);
    const boost = 1.04;
    if (spd > 1) {
      shot.vx = (shot.vx / spd) * Math.min(SHOT_V * 1.15, spd * boost);
      shot.vy = (shot.vy / spd) * Math.min(SHOT_V * 1.15, spd * boost);
    }
    const pad = SHOT_R + RING_W * 0.5 + 2.2;
    shot.x = hit.cx + nx * pad;
    shot.y = hit.cy + ny * pad;
    shot.bounced += 1;
    if (shot.from === 'p') shot.rgb = MAG;
    audio.bounce(ringIdx);
    popSpark(hit.cx, hit.cy, RING_RGB[ringIdx], 11);
    emit(5, {
      x: hit.cx, y: hit.cy, j: 2,
      vx0: nx * 40 - 40, vx1: nx * 40 + 40,
      vy0: ny * 40 - 40, vy1: ny * 40 + 40,
      r0: 0.8, r1: 2, life: 0.18, rgb: RING_RGB[ringIdx], g: 0
    });
    hitStop(0.036);
    kick(1.5);
  }

  function hitRingSeg(ri, si, shot, hit) {
    const ring = G.rings[ri];
    const seg = ring.segs[si];
    if (!seg.alive) return;
    seg.flash = 1;
    bounceShot(shot, hit, ri);
    if (shot.from !== 'p') return;
    seg.alive = false;
    crackSeg(ring, si, hit.cx, hit.cy, shot);
    audio.crack(ri);
    hitStop(0.055);
    kick(2.6);
    if (G.mode === 'play' && shot.from === 'p') {
      shot.hits += 1;
      bumpCombo();
      const sc = Math.round(SEG_SCORE[ri] * G.mult);
      addScore(sc);
      popFloat(hit.cx, hit.cy, '+' + sc, ring.rgb, G.mult >= 2);
    }
    if (liveCount(ring) === 0 && G.mode === 'play' && G.boomT <= 0 && G.buildT <= 0) {
      for (let i = 0; i < SEG; i++) {
        ring.segs[i].alive = true;
        ring.segs[i].flash = 0.8;
      }
      audio.close();
      toast(RING_NAME[ri] + '闭合', true, false);
      screenFlash(ring.rgb, 0.35);
      kick(3.4);
      popRing(CX, CY, ring.rgb, ring.r * 0.4);
    }
  }

  function shotHitsRings(shot) {
    if (G.boomT > 0 || G.buildT > 0.35) return false;
    let best = null;
    for (let ri = 0; ri < G.rings.length; ri++) {
      const ring = G.rings[ri];
      const r = ring.r * ring.scale;
      for (let si = 0; si < SEG; si++) {
        if (!ring.segs[si].alive) continue;
        const a = ringVert(ring.rot, r, si);
        const b = ringVert(ring.rot, r, si + 1);
        const h = segHit(shot.x, shot.y, a[0], a[1], b[0], b[1]);
        if (h.d < SHOT_R + RING_W * 0.55) {
          if (!best || h.d < best.h.d) best = { ri: ri, si: si, h: h };
        }
      }
    }
    if (!best) return false;
    hitRingSeg(best.ri, best.si, shot, best.h);
    if (shot.bounced >= MAX_BOUNCE) shot.life = 0;
    return true;
  }

  function buildCastle(fromTitle) {
    G.rings = [makeRing(0), makeRing(1), makeRing(2)];
    const mul = fromTitle ? 1 : spinMul();
    for (let i = 0; i < 3; i++) G.rings[i].spin *= mul;
    G.core = true;
    G.turret.ang = Math.random() * TAU;
    G.turret.cd = fromTitle ? 1.6 : turretWait() * 0.7;
    G.mines = [];
    G.shots = [];
    G.mineCd = mineWait() * (fromTitle ? 2 : 0.65);
    G.regenCd = regenWait();
    G.buildT = fromTitle ? 0 : 1.05;
    G.boomT = 0;
    if (!fromTitle) {
      for (let i = 0; i < 3; i++) G.rings[i].scale = 0.18;
      toast('第 ' + G.stage + ' 堡' + (G.stage > 1 ? ' · 加速' : ''), false, G.stage > 1);
      audio.start();
    }
  }

  function blowCastle(sx0, sy0) {
    G.core = false;
    G.boomT = 1.42;
    G.buildT = 0;
    audio.core();
    hitStop(0.082);
    kick(7.2);
    screenFlash(GOLD, 0.72);
    popRing(CX, CY, GOLD, 18);
    popRing(CX, CY, MAG, 28);
    popRing(CX, CY, CYN, 40);
    emit(42, {
      x: CX, y: CY, j: 8,
      vx0: -220, vx1: 220, vy0: -220, vy1: 220,
      r0: 1.6, r1: 4.2, life: 0.72, rgb: GOLD, g: 40
    });
    emit(22, {
      x: CX, y: CY, j: 6,
      vx0: -160, vx1: 160, vy0: -160, vy1: 160,
      r0: 1.2, r1: 3.2, life: 0.55, rgb: MAG, g: 20
    });
    for (let ri = 0; ri < G.rings.length; ri++) {
      const ring = G.rings[ri];
      for (let si = 0; si < SEG; si++) {
        if (!ring.segs[si].alive) continue;
        const a = ringVert(ring.rot, ring.r, si);
        const b = ringVert(ring.rot, ring.r, si + 1);
        crackSeg(ring, si, lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5), null);
        ring.segs[si].alive = false;
      }
    }
    for (let i = 0; i < G.mines.length; i++) {
      burst(G.mines[i].x, G.mines[i].y, MAG, 8, 90);
    }
    G.mines = [];
    if (G.mode === 'play') {
      bumpCombo();
      const base = Math.round(400 * G.stage * (isWild() ? 1.5 : 1) * G.mult);
      addScore(base);
      popFloat(sx0 || CX, sy0 || CY, '+' + base, GOLD, true);
      toast('核爆', false, true);
    }
  }

  function placeShip() {
    G.ship.x = CX;
    G.ship.y = Math.min(VH - 28, CY + 248);
    G.ship.vx = 0;
    G.ship.vy = 0;
    G.ship.ang = -Math.PI / 2;
  }

  function spawnClear(x, y, rad) {
    for (let i = 0; i < G.mines.length; i++) {
      if (wrapDist(x, y, G.mines[i].x, G.mines[i].y).d < rad + MINE_R) return false;
    }
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.from === 't' || s.bounced > 0) {
        if (wrapDist(x, y, s.x, s.y).d < rad + 18) return false;
      }
    }
    return true;
  }

  function resetWorld(demo) {
    placeShip();
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = demo ? 0 : 1.85;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.thrustT = 0;
    G.thrustSnd = 0;
    G.exposed = false;
    particles.length = 0;
    sparks.length = 0;
    ringsFx.length = 0;
    floats.length = 0;
    shards.length = 0;
    buildCastle(!!demo);
    if (demo) {
      G.rings[0].segs[1].alive = false;
      G.rings[1].segs[4].alive = false;
      G.rings[2].segs[1].alive = false;
    }
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'siege';
    G.score = 0;
    G.lives = LIVES;
    G.stage = 1;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    resetWorld(true);
    showOverlay(
      'title',
      '星堡',
      '三环绕核，弹打在环上会弹回来。撕开缺口直击核心，别被弹回和炮台打中。',
      '围攻',
      true,
      '乱弹'
    );
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'wild' ? 'wild' : 'siege';
    G.mode = 'play';
    G.score = 0;
    G.lives = LIVES;
    G.stage = 1;
    G.nextLife = EXTRA_LIFE;
    G.why = '';
    resetWorld(false);
    keys.fire = false;
    hideOverlay();
    audio.start();
    if (scoreEl) scoreEl.textContent = '0';
    syncHud();
  }

  function loseRun(why) {
    G.mode = 'lose';
    G.why = why || '船碎了';
    audio.lose();
    const rec = G.score > 0 && G.score === G.best;
    showOverlay(
      'lose',
      rec ? '新纪录' : '船碎了',
      (rec ? '本局刷新最高分。' : '') + (isWild() ? '乱弹炮台更快，布雷更勤。' : '围攻五堡，打穿核心即过关。') + ' R 重开。',
      '再来',
      true,
      '换模式'
    );
    syncHud();
  }

  function winRun() {
    const bonus = isWild() ? 9000 : 6000;
    addScore(bonus);
    G.mode = 'win';
    audio.win();
    const rec = G.score === G.best && G.score > 0;
    showOverlay(
      'win',
      isWild() ? '乱弹通关' : '堡破了',
      '五座星堡全数击穿。' + (rec ? ' 新纪录。' : '') + ' 通关奖励 ' + bonus + '。',
      '再来',
      true,
      isWild() ? '换模式' : '乱弹'
    );
    syncHud();
  }

  function killShip(x, y) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.deadT = 1.05;
    G.lives -= 1;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    audio.death();
    hitStop(0.07);
    kick(5.4);
    screenFlash(MAG, 0.55);
    burst(x, y, ICE, 18, 160);
    burst(x, y, MAG, 10, 110);
    popRing(x, y, MAG, 16);
    G.shots = G.shots.filter(function (s) { return s.from === 'p' && s.bounced === 0; });
    G.mines = [];
    toast(G.lives > 0 ? '剩余 ' + G.lives + ' 命' : '船碎了', true, false);
    syncPips();
  }

  function fire() {
    if (G.mode !== 'play' || overlayOpen()) return;
    if (G.deadT > 0 || G.boomT > 0.2) return;
    if (G.fireCd > 0) return;
    let n = 0;
    for (let i = 0; i < G.shots.length; i++) {
      if (G.shots[i].from === 'p') n += 1;
    }
    if (n >= maxShots()) return;
    const s = G.ship;
    const nose = 13;
    G.shots.push({
      x: s.x + Math.cos(s.ang) * nose,
      y: s.y + Math.sin(s.ang) * nose,
      vx: Math.cos(s.ang) * SHOT_V + s.vx * 0.18,
      vy: Math.sin(s.ang) * SHOT_V + s.vy * 0.18,
      life: SHOT_LIFE,
      from: 'p',
      bounced: 0,
      hits: 0,
      rgb: ICE,
      trail: []
    });
    G.fireCd = fireWait();
    audio.shoot();
    emit(4, {
      x: s.x + Math.cos(s.ang) * 12,
      y: s.y + Math.sin(s.ang) * 12,
      j: 1.5,
      vx0: Math.cos(s.ang) * 40 - 20, vx1: Math.cos(s.ang) * 80 + 20,
      vy0: Math.sin(s.ang) * 40 - 20, vy1: Math.sin(s.ang) * 80 + 20,
      r0: 0.8, r1: 1.8, life: 0.12, rgb: ICE, g: 0
    });
  }

  function turretFire() {
    if (!G.core || G.buildT > 0.2 || G.boomT > 0) return;
    const a = G.turret.ang;
    const nose = CORE_R + 6;
    G.shots.push({
      x: CX + Math.cos(a) * nose,
      y: CY + Math.sin(a) * nose,
      vx: Math.cos(a) * TUR_V,
      vy: Math.sin(a) * TUR_V,
      life: 1.55,
      from: 't',
      bounced: 0,
      hits: 0,
      rgb: GOLD,
      trail: []
    });
    audio.turret();
    emit(3, {
      x: CX + Math.cos(a) * nose,
      y: CY + Math.sin(a) * nose,
      j: 1,
      vx0: Math.cos(a) * 30 - 16, vx1: Math.cos(a) * 70 + 16,
      vy0: Math.sin(a) * 30 - 16, vy1: Math.sin(a) * 70 + 16,
      r0: 0.8, r1: 1.6, life: 0.12, rgb: GOLD, g: 0
    });
  }

  function spawnMine() {
    if (!G.core || G.buildT > 0 || G.boomT > 0) return;
    if (G.mines.length >= mineCap()) return;
    const a = G.turret.ang + rand(-0.4, 0.4);
    const r = CORE_R + 8;
    G.mines.push({
      x: CX + Math.cos(a) * r,
      y: CY + Math.sin(a) * r,
      vx: Math.cos(a) * 40,
      vy: Math.sin(a) * 40,
      pulse: Math.random() * TAU
    });
    audio.mine();
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    const s = G.ship;
    if (keys.l) s.ang -= ROT * dt;
    if (keys.r) s.ang += ROT * dt;
    let thrusting = false;
    if (keys.u) {
      s.vx += Math.cos(s.ang) * THRUST * dt;
      s.vy += Math.sin(s.ang) * THRUST * dt;
      thrusting = true;
    }
    if (keys.d) {
      s.vx -= Math.cos(s.ang) * REV * dt;
      s.vy -= Math.sin(s.ang) * REV * dt;
      thrusting = true;
    }
    const sp = hypot(s.vx, s.vy);
    if (sp > MAX_V) {
      s.vx = s.vx / sp * MAX_V;
      s.vy = s.vy / sp * MAX_V;
    }
    const damp = Math.exp(-DRAG * dt * 60);
    s.vx *= damp;
    s.vy *= damp;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    const wp = wrapPos(s.x, s.y);
    s.x = wp.x;
    s.y = wp.y;
    if (thrusting) {
      G.thrustT = 0.08;
      if (G.mode === 'play') {
        G.thrustSnd -= dt;
        if (G.thrustSnd <= 0) {
          G.thrustSnd = 0.07;
          audio.thrust();
        }
      }
      if (G.mode === 'play' && Math.random() < 0.5) {
        const back = s.ang + Math.PI;
        emit(1, {
          x: s.x + Math.cos(back) * 10,
          y: s.y + Math.sin(back) * 10,
          j: 1.2,
          vx0: Math.cos(back) * 30 - 20, vx1: Math.cos(back) * 80 + 20,
          vy0: Math.sin(back) * 30 - 20, vy1: Math.sin(back) * 80 + 20,
          r0: 0.7, r1: 1.8, life: 0.18, rgb: Math.random() < 0.5 ? CYN : GOLD, g: 0
        });
      }
    } else {
      G.thrustT = Math.max(0, G.thrustT - dt);
    }
    if (keys.fire && G.mode === 'play') fire();
  }

  function updateRings(dt) {
    for (let i = 0; i < G.rings.length; i++) {
      const ring = G.rings[i];
      ring.rot += ring.spin * dt;
      if (G.buildT > 0) {
        ring.scale = lerp(ring.scale, 1, 1 - Math.exp(-dt * 4.8));
        if (G.buildT < 0.55 && i === 0) ring.scale = lerp(ring.scale, 1, 1 - Math.exp(-dt * 6));
      } else {
        ring.scale = 1;
      }
      for (let s = 0; s < SEG; s++) {
        if (ring.segs[s].flash > 0) ring.segs[s].flash = Math.max(0, ring.segs[s].flash - dt * 4.5);
      }
    }
  }

  function updateTurret(dt) {
    if (!G.core) return;
    const target = G.mode === 'title'
      ? Math.atan2(Math.sin(G.t * 0.55) * 80, Math.cos(G.t * 0.4) * 120)
      : Math.atan2(G.ship.y - CY, G.ship.x - CX);
    const turn = isWild() ? 3.6 : 2.2;
    const diff = wrapAng(target - G.turret.ang);
    const max = turn * dt;
    G.turret.ang += clamp(diff, -max, max);
    if (G.mode === 'title') {
      G.turret.cd -= dt;
      if (G.turret.cd <= 0 && G.shots.length < 3) {
        turretFire();
        G.turret.cd = 1.8;
      }
      return;
    }
    if (G.mode !== 'play' || G.deadT > 0 || G.buildT > 0 || G.boomT > 0) return;
    G.turret.cd -= dt;
    const aimOk = Math.abs(diff) < (isWild() ? 0.55 : 0.28);
    if (G.turret.cd <= 0 && (aimOk || isWild())) {
      turretFire();
      G.turret.cd = turretWait();
    }
  }

  function updateMines(dt) {
    if (G.mode === 'title') return;
    if (G.mode === 'play' && G.deadT <= 0 && G.boomT <= 0 && G.buildT <= 0) {
      G.mineCd -= dt;
      if (G.mineCd <= 0) {
        spawnMine();
        G.mineCd = mineWait() * rand(0.82, 1.18);
      }
    }
    const acc = isWild() ? 78 : 52;
    const cap = isWild() ? 96 : 72;
    for (let i = G.mines.length - 1; i >= 0; i--) {
      const m = G.mines[i];
      m.pulse += dt * 7;
      if (G.deadT <= 0 && G.mode !== 'lose') {
        const w = wrapDist(G.ship.x, G.ship.y, m.x, m.y);
        if (w.d > 1) {
          m.vx += (w.dx / w.d) * acc * dt;
          m.vy += (w.dy / w.d) * acc * dt;
        }
      }
      const sp = hypot(m.vx, m.vy);
      if (sp > cap) {
        m.vx = m.vx / sp * cap;
        m.vy = m.vy / sp * cap;
      }
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      const wp = wrapPos(m.x, m.y);
      m.x = wp.x;
      m.y = wp.y;
    }
  }

  function updateShots(dt) {
    const sub = 2;
    const sdt = dt / sub;
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const shot = G.shots[i];
      let dead = false;
      for (let k = 0; k < sub; k++) {
        shot.x += shot.vx * sdt;
        shot.y += shot.vy * sdt;
        const wp = wrapPos(shot.x, shot.y);
        shot.x = wp.x;
        shot.y = wp.y;
        if (shotHitsRings(shot)) {
          if (shot.life <= 0 || shot.bounced >= MAX_BOUNCE) {
            dead = true;
            break;
          }
        }
        if (G.mode === 'play' && G.core && G.boomT <= 0 && G.buildT <= 0 && shot.from === 'p') {
          const d = hypot(shot.x - CX, shot.y - CY);
          if (d < CORE_R + SHOT_R) {
            shot.life = 0;
            dead = true;
            blowCastle(shot.x, shot.y);
            break;
          }
        }
      }
      shot.life -= dt;
      if (!REDUCE) {
        shot.trail.push({ x: shot.x, y: shot.y });
        if (shot.trail.length > 7) shot.trail.shift();
      }
      if (dead || shot.life <= 0) {
        if (G.mode === 'play' && shot.from === 'p' && shot.hits === 0) {
          G.comboT = Math.min(G.comboT, 0.16);
        }
        G.shots.splice(i, 1);
      }
    }
  }

  function collide() {
    if (G.deadT > 0 || G.invuln > 0 || G.boomT > 0) return;
    const s = G.ship;
    if (G.buildT <= 0.25) {
      for (let ri = 0; ri < G.rings.length; ri++) {
        const ring = G.rings[ri];
        const r = ring.r * ring.scale;
        for (let si = 0; si < SEG; si++) {
          if (!ring.segs[si].alive) continue;
          const a = ringVert(ring.rot, r, si);
          const b = ringVert(ring.rot, r, si + 1);
          const h = segHit(s.x, s.y, a[0], a[1], b[0], b[1]);
          if (h.d < SHIP_R + RING_W * 0.5) {
            killShip(s.x, s.y);
            return;
          }
        }
      }
    }
    if (G.core && hypot(s.x - CX, s.y - CY) < CORE_R + SHIP_R) {
      killShip(s.x, s.y);
      return;
    }
    for (let i = 0; i < G.mines.length; i++) {
      if (wrapDist(s.x, s.y, G.mines[i].x, G.mines[i].y).d < SHIP_R + MINE_R) {
        killShip(s.x, s.y);
        return;
      }
    }
    for (let i = 0; i < G.shots.length; i++) {
      const sh = G.shots[i];
      const lethal = sh.from === 't' || sh.bounced > 0;
      if (!lethal) continue;
      if (wrapDist(s.x, s.y, sh.x, sh.y).d < SHIP_R + SHOT_R + 1.2) {
        killShip(s.x, s.y);
        return;
      }
    }
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const sh = G.shots[i];
      if (sh.from !== 'p') continue;
      for (let j = G.mines.length - 1; j >= 0; j--) {
        const m = G.mines[j];
        if (wrapDist(sh.x, sh.y, m.x, m.y).d < MINE_R + SHOT_R + 2) {
          burst(m.x, m.y, MAG, 12, 120);
          audio.mineHit();
          hitStop(0.05);
          kick(2.2);
          if (G.mode === 'play') {
            sh.hits += 1;
            bumpCombo();
            const sc = Math.round(150 * G.mult);
            addScore(sc);
            popFloat(m.x, m.y, '+' + sc, MAG, G.mult >= 2);
          }
          G.mines.splice(j, 1);
          G.shots.splice(i, 1);
          break;
        }
      }
    }
  }

  function updateRegen(dt) {
    if (G.mode !== 'play' || G.boomT > 0 || G.buildT > 0 || !G.core) return;
    G.regenCd -= dt;
    if (G.regenCd > 0) return;
    const dead = [];
    for (let ri = 0; ri < G.rings.length; ri++) {
      for (let si = 0; si < SEG; si++) {
        if (!G.rings[ri].segs[si].alive) dead.push([ri, si]);
      }
    }
    if (dead.length) {
      const pick = dead[(Math.random() * dead.length) | 0];
      const ring = G.rings[pick[0]];
      ring.segs[pick[1]].alive = true;
      ring.segs[pick[1]].flash = 1;
      audio.regen();
      const a = ringVert(ring.rot, ring.r, pick[1]);
      const b = ringVert(ring.rot, ring.r, pick[1] + 1);
      popSpark(lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5), ring.rgb, 12);
    }
    G.regenCd = regenWait();
  }

  function updateFx(dt) {
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.punch > 1) G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 10));
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) {
        G.combo = 0;
        G.mult = 1;
      }
    }
    if (G.invuln > 0) G.invuln -= dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.g || 0) * dt;
      p.vx *= Math.exp(-dt * 1.1);
      p.vy *= Math.exp(-dt * 1.1);
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.36) sparks.splice(i, 1);
    }
    for (let i = ringsFx.length - 1; i >= 0; i--) {
      ringsFx[i].t += dt;
      if (ringsFx[i].t > 0.42) ringsFx.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      f.vy *= Math.exp(-dt * 1.4);
      if (f.t >= f.life) floats.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.ang += s.spin * dt;
      s.vx *= Math.exp(-dt * 0.7);
      s.vy *= Math.exp(-dt * 0.7);
      if (s.life <= 0) shards.splice(i, 1);
    }
  }

  function playSim(dt) {
    if (G.ready > 0) G.ready -= dt;
    if (G.buildT > 0) G.buildT -= dt;
    updatePlayer(dt);
    updateRings(dt);
    updateTurret(dt);
    updateMines(dt);
    updateShots(dt);
    updateRegen(dt);
    G.exposed = coreExposed();
    if (G.mode === 'play') collide();

    if (G.mode === 'play' && G.deadT > 0) {
      G.deadT -= dt;
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          loseRun('船碎了');
          return;
        }
        placeShip();
        if (!spawnClear(G.ship.x, G.ship.y, 64)) {
          G.deadT = 0.28;
          return;
        }
        G.invuln = 1.85;
        toast('剩余 ' + G.lives + ' 命', true, false);
      }
    }

    if (G.mode === 'play' && G.boomT > 0) {
      G.boomT -= dt;
      if (G.boomT <= 0) {
        if (G.stage >= STAGES) {
          winRun();
          return;
        }
        G.stage += 1;
        G.invuln = Math.max(G.invuln, 1.2);
        buildCastle(false);
      }
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
      G.ship.ang += 0.22 * dt;
      G.ship.x = CX + Math.cos(G.t * 0.42) * 248;
      G.ship.y = CY + Math.sin(G.t * 0.42) * 228;
      updateRings(dt);
      updateTurret(dt);
      updateShots(dt);
      if (G.shots.length < 2 && (G.t * 2 | 0) !== ((G.t - dt) * 2 | 0)) {
        const a = G.ship.ang;
        G.shots.push({
          x: G.ship.x + Math.cos(a) * 12,
          y: G.ship.y + Math.sin(a) * 12,
          vx: Math.cos(a) * SHOT_V * 0.7,
          vy: Math.sin(a) * SHOT_V * 0.7,
          life: 1.1,
          from: 'p',
          bounced: 0,
          hits: 0,
          rgb: ICE,
          trail: []
        });
      }
      if (liveCount(G.rings[0]) + liveCount(G.rings[1]) + liveCount(G.rings[2]) < 10) {
        for (let ri = 0; ri < 3; ri++) {
          for (let si = 0; si < SEG; si++) G.rings[ri].segs[si].alive = true;
        }
      }
      if (!G.core) {
        G.core = true;
        buildCastle(true);
      }
      updateFx(dt);
      return;
    }

    if (G.mode === 'lose' || G.mode === 'win') {
      updateRings(dt);
      updateShots(dt);
      updateMines(dt);
      updateFx(dt);
      return;
    }

    playSim(dt);
    updateFx(dt);
    syncHud();
  }

  function forWrap(x, y, r, fn) {
    fn(x, y);
    const nx = x < r + 10;
    const px = x > VW - r - 10;
    const ny = y < r + 10;
    const py = y > VH - r - 10;
    if (nx) fn(x + VW, y);
    if (px) fn(x - VW, y);
    if (ny) fn(x, y + VH);
    if (py) fn(x, y - VH);
    if (nx && ny) fn(x + VW, y + VH);
    if (nx && py) fn(x + VW, y - VH);
    if (px && ny) fn(x - VW, y + VH);
    if (px && py) fn(x - VW, y - VH);
  }

  function drawBg() {
    const g = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#100628');
    g.addColorStop(0.5, '#080318');
    g.addColorStop(1, '#05010e');
    ctx.fillStyle = g;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    const vg = ctx.createRadialGradient(sx(CX), sy(CY), 20 * scale, sx(CX), sy(CY), 340 * scale);
    vg.addColorStop(0, 'rgba(155, 77, 255, 0.12)');
    vg.addColorStop(0.45, 'rgba(255, 61, 184, 0.04)');
    vg.addColorStop(1, 'rgba(0, 0, 0, 0.34)');
    ctx.fillStyle = vg;
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    ctx.save();
    ctx.strokeStyle = 'rgba(155, 77, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const a = i * (TAU / 6) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(sx(CX), sy(CY));
      ctx.lineTo(sx(CX + Math.cos(a) * 300), sy(CY + Math.sin(a) * 300));
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = REDUCE ? s.a : s.a * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(G.t * 1.4 + s.p)));
      ctx.fillStyle = rgba(s.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.r * scale, 0, TAU);
      ctx.fill();
    }
  }

  function drawRings() {
    for (let ri = G.rings.length - 1; ri >= 0; ri--) {
      const ring = G.rings[ri];
      const r = ring.r * ring.scale;
      for (let si = 0; si < SEG; si++) {
        const a = ringVert(ring.rot, r, si);
        const b = ringVert(ring.rot, r, si + 1);
        const alive = ring.segs[si].alive;
        const flash = ring.segs[si].flash;
        if (!alive && flash <= 0.05) {
          ctx.strokeStyle = rgba(ring.rgb, 0.07);
          ctx.lineWidth = 1 * scale;
          ctx.beginPath();
          ctx.moveTo(sx(a[0]), sy(a[1]));
          ctx.lineTo(sx(b[0]), sy(b[1]));
          ctx.stroke();
          continue;
        }
        const rgb = flash > 0.35 ? WHT : ring.rgb;
        const a0 = alive ? 0.22 : 0.12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = rgba(rgb, a0 + flash * 0.35);
        ctx.lineWidth = (7 + flash * 4) * scale;
        ctx.beginPath();
        ctx.moveTo(sx(a[0]), sy(a[1]));
        ctx.lineTo(sx(b[0]), sy(b[1]));
        ctx.stroke();
        ctx.strokeStyle = rgba(rgb, alive ? 0.95 : 0.35);
        ctx.lineWidth = (2.35 + flash * 1.6) * scale;
        ctx.beginPath();
        ctx.moveTo(sx(a[0]), sy(a[1]));
        ctx.lineTo(sx(b[0]), sy(b[1]));
        ctx.stroke();
      }
    }
  }

  function drawCore() {
    if (G.boomT > 0 && !G.core) {
      const t = 1 - clamp(G.boomT / 1.42, 0, 1);
      ctx.beginPath();
      ctx.arc(sx(CX), sy(CY), (18 + t * 70) * scale, 0, TAU);
      ctx.strokeStyle = rgba(GOLD, 0.35 * (1 - t));
      ctx.lineWidth = 3 * scale;
      ctx.stroke();
      return;
    }
    if (!G.core) return;
    const pulse = REDUCE ? 0.5 : 0.5 + 0.5 * Math.sin(G.t * 6);
    const rgb = G.exposed ? GOLD : PUR;
    ctx.beginPath();
    ctx.arc(sx(CX), sy(CY), (CORE_R + 10 + pulse * 4) * scale, 0, TAU);
    ctx.fillStyle = rgba(rgb, 0.08 + pulse * 0.05);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx(CX), sy(CY), CORE_R * scale, 0, TAU);
    ctx.fillStyle = rgba(rgb, 0.22);
    ctx.fill();
    ctx.strokeStyle = rgba(G.exposed ? GOLD : ICE, 0.95);
    ctx.lineWidth = 1.8 * scale;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(CX), sy(CY), 4.2 * scale, 0, TAU);
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.fill();

    const a = G.turret.ang;
    const x0 = CX + Math.cos(a) * 6;
    const y0 = CY + Math.sin(a) * 6;
    const x1 = CX + Math.cos(a) * (CORE_R + 10);
    const y1 = CY + Math.sin(a) * (CORE_R + 10);
    const px = Math.cos(a + Math.PI / 2) * 3.4;
    const py = Math.sin(a + Math.PI / 2) * 3.4;
    ctx.beginPath();
    ctx.moveTo(sx(x0 + px), sy(y0 + py));
    ctx.lineTo(sx(x1), sy(y1));
    ctx.lineTo(sx(x0 - px), sy(y0 - py));
    ctx.closePath();
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 1.5 * scale;
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.25);
    ctx.fill();
  }

  function drawMines() {
    for (let i = 0; i < G.mines.length; i++) {
      const m = G.mines[i];
      const pr = MINE_R + Math.sin(m.pulse) * 1.2;
      forWrap(m.x, m.y, MINE_R + 4, function (x, y) {
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), (pr + 4) * scale, 0, TAU);
        ctx.fillStyle = rgba(MAG, 0.12);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), pr * scale, 0, TAU);
        ctx.strokeStyle = rgba(MAG, 0.95);
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();
        ctx.fillStyle = rgba(MAG, 0.35);
        ctx.fill();
        for (let k = 0; k < 4; k++) {
          const a = m.pulse * 0.4 + k * Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(sx(x + Math.cos(a) * pr), sy(y + Math.sin(a) * pr));
          ctx.lineTo(sx(x + Math.cos(a) * (pr + 3.5)), sy(y + Math.sin(a) * (pr + 3.5)));
          ctx.strokeStyle = rgba(GOLD, 0.8);
          ctx.lineWidth = 1.2 * scale;
          ctx.stroke();
        }
      });
    }
  }

  function drawShots() {
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (!REDUCE && s.trail) {
        for (let k = 0; k < s.trail.length; k++) {
          const t = s.trail[k];
          const a = (k + 1) / (s.trail.length + 1) * 0.45;
          ctx.beginPath();
          ctx.arc(sx(t.x), sy(t.y), (1.2 + a * 1.4) * scale, 0, TAU);
          ctx.fillStyle = rgba(s.rgb, a);
          ctx.fill();
        }
      }
      forWrap(s.x, s.y, 6, function (x, y) {
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), (s.bounced ? 3.4 : 2.6) * scale, 0, TAU);
        ctx.fillStyle = rgba(s.rgb, 1);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx(x), sy(y), (s.bounced ? 6 : 5) * scale, 0, TAU);
        ctx.fillStyle = rgba(s.rgb, 0.18);
        ctx.fill();
      });
    }
  }

  function drawShipShape(x, y, ang, thrusting, ghost) {
    ctx.save();
    ctx.translate(sx(x), sy(y));
    ctx.rotate(ang + Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, -13 * scale);
    ctx.lineTo(9 * scale, 11 * scale);
    ctx.lineTo(0, 6.5 * scale);
    ctx.lineTo(-9 * scale, 11 * scale);
    ctx.closePath();
    ctx.strokeStyle = rgba(ghost ? ICE : WHT, ghost ? 0.45 : 0.95);
    ctx.lineWidth = 1.6 * scale;
    ctx.lineJoin = 'round';
    ctx.stroke();
    if (!ghost) {
      ctx.strokeStyle = rgba(PUR, 0.25);
      ctx.lineWidth = 4.2 * scale;
      ctx.stroke();
      ctx.strokeStyle = rgba(WHT, 0.95);
      ctx.lineWidth = 1.6 * scale;
      ctx.stroke();
    }
    if (thrusting && !ghost) {
      ctx.beginPath();
      ctx.moveTo(-4.2 * scale, 11 * scale);
      ctx.lineTo(0, (18 + Math.sin(G.t * 40) * 3) * scale);
      ctx.lineTo(4.2 * scale, 11 * scale);
      ctx.strokeStyle = rgba(CYN, 0.9);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
      ctx.strokeStyle = rgba(GOLD, 0.7);
      ctx.lineWidth = 0.8 * scale;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawShip() {
    if (G.deadT > 0) return;
    const s = G.ship;
    const ghost = G.invuln > 0 && ((G.invuln * 12) | 0) % 2 === 0;
    const thrusting = G.thrustT > 0 || keys.u || keys.d;
    forWrap(s.x, s.y, 16, function (x, y) {
      drawShipShape(x, y, s.ang, thrusting, ghost);
    });
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / (p.max || 0.4), 0, 1);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), p.r * scale * (0.6 + a * 0.6), 0, TAU);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.36;
      ctx.beginPath();
      ctx.arc(sx(s.x), sy(s.y), s.rad * (0.4 + t) * scale, 0, TAU);
      ctx.strokeStyle = rgba(s.rgb, 1 - t);
      ctx.lineWidth = (2.4 - t * 1.6) * scale;
      ctx.stroke();
    }
    for (let i = 0; i < ringsFx.length; i++) {
      const r = ringsFx[i];
      const t = r.t / 0.42;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(r.y), (r.r + t * 46) * scale, 0, TAU);
      ctx.strokeStyle = rgba(r.rgb, 0.7 * (1 - t));
      ctx.lineWidth = (2.6 - t * 1.8) * scale;
      ctx.stroke();
    }
    for (let i = 0; i < shards.length; i++) {
      const s = shards[i];
      const a = clamp(s.life / 0.5, 0, 1);
      ctx.save();
      ctx.translate(sx(s.x), sy(s.y));
      ctx.rotate(s.ang);
      ctx.beginPath();
      ctx.moveTo(-s.len * 0.5 * scale, 0);
      ctx.lineTo(s.len * 0.5 * scale, 0);
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFloats() {
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(f.gold ? GOLD : f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function drawFlash() {
    if (G.flash <= 0) return;
    ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.28);
    ctx.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080318';
    ctx.fillRect(0, 0, W, H);

    let shx = 0;
    let shy = 0;
    if (G.shake > 0 && !REDUCE) {
      shx = rand(-G.shake, G.shake);
      shy = rand(-G.shake, G.shake);
    }
    ctx.save();
    ctx.translate(W * 0.5 + shx, H * 0.5 + shy);
    ctx.scale(G.punch, G.punch);
    ctx.translate(-W * 0.5, -H * 0.5);

    drawBg();
    drawRings();
    drawCore();
    drawMines();
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

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('siege');
    else startGame(G.kind || 'siege');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') {
      startGame('siege');
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const code = e.code || '';
    const k = e.key;
    const left = code === 'KeyA' || code === 'ArrowLeft';
    const right = code === 'KeyD' || code === 'ArrowRight';
    const up = code === 'KeyW' || code === 'ArrowUp';
    const downK = code === 'KeyS' || code === 'ArrowDown';
    const space = code === 'Space' || k === ' ';
    if (down && (left || right || up || downK || space || k === 'Enter')) e.preventDefault();

    if (left) keys.l = down;
    if (right) keys.r = down;
    if (up) keys.u = down;
    if (downK) keys.d = down;
    if (space) keys.fire = down && G.mode === 'play' && !overlayOpen();

    if (!down) return;

    if (code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (code === 'KeyR') {
      restart();
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
      startGame('siege');
    }
    if ((k === '2' || code === 'Digit2') && overlayOpen() && G.mode === 'title') {
      startGame('wild');
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

  function bindPads() {
    holdPad(padCcw, function () { keys.l = true; }, function () { keys.l = false; });
    holdPad(padCw, function () { keys.r = true; }, function () { keys.r = false; });
    holdPad(padThrust, function () { keys.u = true; }, function () { keys.u = false; });
    holdPad(padRev, function () { keys.d = true; }, function () { keys.d = false; });
    holdPad(padFire, function () { keys.fire = true; fire(); }, function () { keys.fire = false; });
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
  bindPads();

  if (btnSiege) {
    btnSiege.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
      else startGame('siege');
    });
  }
  if (btnWild) {
    btnWild.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else if (G.mode === 'win') {
        if (isWild()) goTitle();
        else startGame('wild');
      } else startGame('wild');
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
      if (G.mode === 'play') {
        keys.fire = true;
        fire();
      }
    });
    function ptrUp() { keys.fire = false; }
    canvas.addEventListener('pointerup', ptrUp);
    canvas.addEventListener('pointercancel', ptrUp);
    canvas.addEventListener('lostpointercapture', ptrUp);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    canvas.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
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
    }
  });

  requestAnimationFrame(frame);
})();
