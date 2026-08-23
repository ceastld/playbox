'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const FORT_W = 208;
  const MAX_ALT = 88;
  const PZ = 118;
  const TILE = 20;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 10000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.38;
  const IX = 1.18;
  const IY = 0.3;
  const IZX = 0.4;
  const IZY = 1.06;
  const IA = 1.66;
  const OX = 50;
  const OY = 646;
  const BEST_KEY = 'playbox-zaxxon-best';
  const MUTE_KEY = 'playbox-zaxxon-mute';
  const AUTO_SPEED_KEY = 'playbox-zaxxon-auto-speed';
  const SPEED_LABELS = ['', '慢', '中', '快', '极快'];
  const AUTO_SCALE = [1, 0.5, 0.75, 1, 2.8];
  const OPS = '← → 平移 · ↑ ↓ 升降 · 空格开火 · A 自动 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 74, 210];
  const CYN = [78, 200, 255];
  const SKY = [122, 220, 255];
  const GOLD = [255, 227, 107];
  const HOT = [154, 216, 255];
  const WHT = [232, 246, 255];
  const PNK = [255, 154, 220];
  const TOP = [56, 148, 214];
  const LEFT = [14, 42, 82];
  const FRONT = [32, 96, 158];
  const SIDE_T = [42, 118, 186];
  const SIDE_L = [10, 28, 58];
  const SIDE_F = [22, 70, 120];
  const FLOOR_A = [18, 42, 72];
  const FLOOR_B = [12, 30, 54];

  const SCORE = { wall: 50, tank: 300, gun: 200, fighter: 150, missile: 80, boss: 4000 };

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
  const btnFort = document.getElementById('btn-fort');
  const btnDense = document.getElementById('btn-dense');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnAuto = document.getElementById('btn-auto');
  const speedEl = document.getElementById('speed');
  const speedLab = document.getElementById('speed-lab');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const altLabel = document.getElementById('alt-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const fuelBar = document.getElementById('fuel-bar');
  const fuelWrap = document.getElementById('fuel-wrap');

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

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, sx: VW * 0.5, sy: 500, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'fort',
    t: 0,
    camZ: 0,
    px: 104,
    pz: PZ,
    pal: 42,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    fuel: 100,
    nextLife: LIFE_EVERY,
    walls: [],
    ents: [],
    shots: [],
    eShots: [],
    fortA: 2600,
    spaceEnd: 4200,
    fortB: 6800,
    bossZ: 7360,
    fireCd: 0,
    fireHold: false,
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
    boss: false,
    winT: 0,
    engine: 0,
    siphon: 0,
    alarmT: 0,
    fuelAlarm: 0,
    warn: false,
    lastPhase: '外城',
    spawnT: 0.6,
    taught: false
  };

  let inputSrc = 'key';
  let autoOn = false;
  let autoSpeed = 3;
  let autoOvWait = 0;
  let autoTx = 104;
  let autoTa = 42;

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
    return G.kind === 'dense';
  }
  function iso(x, z, alt) {
    const dz = z - G.camZ;
    return {
      x: OX + x * IX + dz * IZX,
      y: OY - dz * IZY - alt * IA + x * IY
    };
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }
  function inFort(z) {
    return (z >= 0 && z < G.fortA) || (z >= G.spaceEnd && z < G.fortB);
  }
  function phaseName() {
    if (G.boss) return '机甲';
    if (G.pz >= G.fortB) return '机甲';
    if (G.pz >= G.spaceEnd) return '内城';
    if (G.pz >= G.fortA) return '深空';
    return '外城';
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
      this.beep(820, 0.046, 'square', 0.03, 1640);
    },
    wall() {
      this.ensure();
      this.noise(0.07, 0.05, 280);
      this.beep(180, 0.1, 'sawtooth', 0.042, 70);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'boss' ? 180 : kind === 'tank' ? 420 : kind === 'gun' ? 520 : kind === 'wall' ? 260 : kind === 'missile' ? 640 : 700;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.046, 0.036, kind === 'wall' ? 360 : 1100);
      this.beep(base * lift, 0.086, 'square', 0.046, base * lift * 1.55);
    },
    tank() {
      this.ensure();
      this.noise(0.08, 0.05, 400);
      this.beep(392, 0.1, 'square', 0.05, 784);
      this.beep(523, 0.14, 'triangle', 0.04, 1046);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    miss() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.018, 80);
    },
    ping() {
      this.ensure();
      this.beep(980, 0.04, 'square', 0.022, 640);
    },
    death() {
      this.ensure();
      this.noise(0.16, 0.06, 320);
      this.beep(300, 0.2, 'sawtooth', 0.052, 70);
      this.beep(150, 0.32, 'sine', 0.045, 44);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    warnAlt() {
      this.ensure();
      this.beep(240, 0.07, 'square', 0.03, 140);
    },
    fuelLow() {
      this.ensure();
      this.beep(196, 0.09, 'sine', 0.028, 90);
    },
    check() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(659, 0.16, 'triangle', 0.04, 880);
    },
    boss() {
      this.ensure();
      this.beep(98, 0.24, 'sawtooth', 0.058, 62);
      this.beep(147, 0.32, 'square', 0.038, 82);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.05, 784);
      this.beep(784, 0.16, 'triangle', 0.045, 1046);
      this.beep(1046, 0.28, 'sine', 0.04, 1568);
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

  function loadAutoSpeed() {
    try {
      const n = parseInt(localStorage.getItem(AUTO_SPEED_KEY) || '3', 10);
      if (!isFinite(n) || n < 1 || n > 4) return 3;
      return n;
    } catch (err) {
      return 3;
    }
  }

  function saveAutoSpeed(n) {
    try {
      localStorage.setItem(AUTO_SPEED_KEY, String(n));
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

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '扎克';
      else stageLabel.textContent = phaseName();
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.combo >= 8));
      stageLabel.classList.toggle('boss', G.mode === 'play' && G.boss);
    }
    if (tagLabel) {
      tagLabel.textContent = isDense() ? '密火' : '要塞';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || G.warn || G.fuel < 22);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (altLabel) {
      altLabel.textContent = '高 ' + Math.round(G.pal);
      altLabel.classList.toggle('warn', G.warn);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult > 1 ? G.combo + ' 连 ×' + G.mult : G.combo + ' 连';
      } else {
        comboEl.hidden = true;
      }
    }
    if (fuelBar) fuelBar.style.transform = 'scaleX(' + clamp(G.fuel / 100, 0, 1) + ')';
    if (fuelWrap) {
      fuelWrap.classList.toggle('low', G.fuel < 22);
      fuelWrap.classList.toggle('hot', G.siphon > 0);
    }
    if (autoOn && G.mode === 'title') setHint('自动托管 · 即将开局 · A 停下', 'hot');
    else if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint(autoOn ? '自动仍开着 · 即将再飞 · A 停下' : 'R 重开 · 撞墙或中弹扣一命', 'warn');
    else if (G.mode === 'win') setHint(autoOn ? '自动仍开着 · 即将再飞 · A 停下' : 'R 重开 · 机甲已毁', autoOn ? 'warn' : 'hot');
    else if (autoOn) setHint('托管中 · 等距飞 · 打墙打油打炮 · A 停下', 'hot');
    else if (G.warn) setHint('拉高！墙在前面 · 也可打穿', 'warn');
    else if (G.fuel < 22) setHint('油料告急 · 打油罐', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 看影子对高度', 'warn');
    else if (G.boss) setHint('打机甲的眼 · 高度对准', 'hot');
    else if (G.pz >= G.fortA && G.pz < G.spaceEnd) setHint('深空 · 对准战机高度开火', '');
    else setHint('↑ 拉高飞过墙 · ↓ 俯冲打油罐炮台 · 墙能打穿 · A 自动', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'ZAXX';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const ended = kind === 'lose' || kind === 'win';
    if (ovStart) ovStart.classList.toggle('gone', ended);
    if (ovEnd) ovEnd.classList.toggle('gone', !ended);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    if (autoOn && autoSpeed >= 4) return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE || (G.mode !== 'play' && G.mode !== 'win')) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : mag >= 3.4 ? 'warn' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('warn');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
    const tok = kickTok;
    setTimeout(function () {
      if (tok === kickTok && stageEl) {
        stageEl.classList.remove('die');
        stageEl.classList.remove('hit');
        stageEl.classList.remove('warn');
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
        z: spec.z + rand(-spec.j, spec.j),
        alt: spec.alt + rand(-spec.j * 0.4, spec.j * 0.4),
        vx: rand(spec.vx0, spec.vx1),
        vz: rand(spec.vz0, spec.vz1),
        va: rand(spec.va0, spec.va1),
        r: rand(spec.r0, spec.r1),
        life: rand(spec.life * 0.55, spec.life),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 70 : spec.g
      });
    }
    capArr(particles, 280);
  }

  function popSpark(x, z, alt, rgb, rad) {
    sparks.push({ x: x, z: z, alt: alt, t: 0, rgb: rgb, rad: rad || 16 });
    rings.push({ x: x, z: z, alt: alt, t: 0, rgb: rgb, r: rad || 14 });
    capArr(sparks, 36);
    capArr(rings, 22);
  }

  function floatText(x, z, alt, text, rgb, gold) {
    floats.push({
      x: x, z: z, alt: alt, text: text, rgb: rgb,
      t: 0, life: gold ? 0.95 : 0.65,
      size: gold ? 20 : 15, gold: !!gold
    });
    capArr(floats, 24);
  }

  function explode(x, z, alt, rgb, power) {
    const p = power || 18;
    emit(Math.min(28, 10 + (p * 0.5) | 0), {
      x: x, z: z, alt: alt, j: 6,
      vx0: -160, vx1: 160, vz0: -80, vz1: 140, va0: -40, va1: 180,
      r0: 1.4, r1: 4.2, life: 0.42 + p * 0.006, rgb: rgb, g: 90
    });
    emit(6, {
      x: x, z: z, alt: alt, j: 3,
      vx0: -50, vx1: 50, vz0: -30, vz1: 40, va0: 40, va1: 140,
      r0: 2, r1: 5, life: 0.28, rgb: WHT, g: 40
    });
    popSpark(x, z, alt, rgb, 12 + p * 0.4);
  }

  function bumpCombo() {
    G.combo += 1;
    G.comboT = COMBO_WIN;
    const prev = G.mult;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
      if (comboEl) {
        comboEl.classList.remove('hot');
        void comboEl.offsetWidth;
        comboEl.classList.add('hot');
        comboTok += 1;
      }
    }
  }

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
  }

  function groundH(x, z) {
    if (!inFort(z)) return 0;
    let h = 0;
    const walls = G.walls;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (!w.alive) continue;
      if (z < w.z || z > w.z + w.d) continue;
      if (x < w.x || x > w.x + w.w) continue;
      if (w.h > h) h = w.h;
    }
    return h;
  }

  function crashH(x, z) {
    return Math.max(
      groundH(x, z),
      groundH(x + 7, z),
      groundH(x - 7, z),
      groundH(x, z + 8),
      groundH(x, z - 6)
    );
  }

  function nextThreat() {
    let best = null;
    let bestZ = G.pz + 220;
    for (let i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      if (!w.alive) continue;
      if (w.z + w.d < G.pz + 4) continue;
      if (w.z > bestZ) continue;
      if (G.px + 9 < w.x || G.px - 9 > w.x + w.w) continue;
      best = w;
      bestZ = w.z;
    }
    return best;
  }

  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function occupied(x, z, rad) {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (Math.abs(e.z - z) < 36 && Math.abs(e.x - x) < rad) return true;
    }
    return false;
  }

  function pushEnt(e) {
    G.ents.push(e);
    capArr(G.ents, 110);
  }

  function wallHp(h, dense) {
    return (h > 40 ? 4 : h > 28 ? 3 : 2) + (dense ? 1 : 0);
  }

  function addWall(walls, x, z, w, d, h, dense) {
    const hh = Math.max(8, h);
    walls.push({
      x: x, z: z, w: w, d: d, h: hh,
      hp: wallHp(hh, dense),
      max: wallHp(hh, dense),
      alive: true,
      flash: 0
    });
  }

  function addTank(ents, x, z) {
    ents.push({
      type: 'tank', x: x, z: z, alt: 11,
      hw: 9, hd: 9, hh: 14, hp: 1, alive: true, flash: 0
    });
  }

  function addGun(ents, x, z) {
    ents.push({
      type: 'gun', x: x, z: z, alt: 13,
      hw: 10, hd: 10, hh: 16, hp: 2, alive: true, flash: 0,
      cd: 0.45 + hash2((z | 0) + 3) * 0.9
    });
  }

  function buildFort(walls, ents, z0, z1, seed, h0, h1, dense) {
    const spacing = dense ? 66 : 86;
    let z = z0 + 280;
    let i = 0;
    addWall(walls, 26, z0 + 220, 150, 18, dense ? h0 + 6 : h0, dense);
    addTank(ents, 62, z0 + 310);
    addTank(ents, 136, z0 + 370);
    addGun(ents, 104, z0 + 430);
    while (z < z1 - 240) {
      const u = hash2(i * 17 + seed);
      const v = hash2(i * 31 + seed + 11);
      const H = h0 + v * (h1 - h0);
      if (u < 0.18) {
        addWall(walls, 18, z, FORT_W - 36, 22, H, dense);
        if (v > 0.28) addGun(ents, 40 + v * 118, z + 48);
      } else if (u < 0.38) {
        const ww = 74 + v * 52;
        addWall(walls, 16, z, ww, 24, H, dense);
        if (v > 0.48) addTank(ents, clamp(16 + ww + 24, 30, 176), z + 10);
        else addGun(ents, clamp(16 + ww + 28, 30, 176), z + 14);
      } else if (u < 0.58) {
        const ww = 74 + v * 52;
        addWall(walls, FORT_W - 16 - ww, z, ww, 24, H, dense);
        if (v > 0.5) addTank(ents, 42, z + 10);
        else addGun(ents, 50, z + 10);
      } else if (u < 0.74) {
        addWall(walls, 14, z, 52, 26, H + 4, dense);
        addWall(walls, FORT_W - 66, z, 52, 26, H, dense);
        addGun(ents, FORT_W * 0.5, z + 8);
        if (dense) addTank(ents, FORT_W * 0.5, z + 42);
      } else if (u < 0.88) {
        addTank(ents, 50 + v * 30, z);
        addTank(ents, 118 + v * 24, z + 36);
        if (dense || v > 0.4) addGun(ents, 92, z + 62);
        if (v > 0.52) addWall(walls, 28, z + 84, 86, 18, h0, dense);
      } else {
        addWall(walls, 22, z, 70, 16, h0, dense);
        addWall(walls, 66, z + 24, 90, 16, h0 + 10, dense);
        addWall(walls, 32, z + 48, 128, 16, h0 + 18, dense);
      }
      z += spacing + v * 24;
      i += 1;
    }
    addTank(ents, 104, z1 - 210);
    addWall(walls, 20, z1 - 120, FORT_W - 40, 24, dense ? h1 : h1 - 8, dense);
    addGun(ents, 58, z1 - 64);
    addGun(ents, 146, z1 - 64);
  }

  function buildLevel(dense) {
    const walls = [];
    const ents = [];
    const fortA = dense ? 3000 : 2580;
    const spaceEnd = fortA + (dense ? 1280 : 1540);
    const fortB = spaceEnd + (dense ? 2920 : 2480);
    const bossZ = fortB + (dense ? 480 : 560);
    buildFort(walls, ents, 40, fortA, dense ? 91 : 3, dense ? 22 : 16, dense ? 52 : 36, dense);
    buildFort(walls, ents, spaceEnd + 40, fortB, dense ? 47 : 19, dense ? 26 : 20, dense ? 58 : 46, dense);
    return { walls: walls, ents: ents, fortA: fortA, spaceEnd: spaceEnd, fortB: fortB, bossZ: bossZ };
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 56; i++) {
      stars.push({
        x: hash2(i * 17) * VW,
        y: hash2(i * 91 + 3) * VH,
        s: 0.5 + hash2(i * 5 + 9) * 1.7,
        p: 0.18 + hash2(i * 13) * 0.7
      });
    }
  }

  function spawnFighter() {
    const x = 28 + hash2((G.pz | 0) * 7 + G.ents.length) * (FORT_W - 56);
    const z = G.camZ + 300 + rand(0, 90);
    const alt = 18 + rand(0, 58);
    if (occupied(x, z, 28)) return;
    pushEnt({
      type: 'fighter',
      x: x, z: z, alt: alt,
      vx: rand(-46, 46),
      vz: isDense() ? 74 : 58,
      va: rand(-22, 22),
      hw: 10, hd: 10, hh: 8,
      hp: 1, alive: true, flash: 0,
      cd: rand(0.4, 1.1),
      phase: rand(0, TAU)
    });
  }

  function spawnBoss() {
    G.boss = true;
    pushEnt({
      type: 'boss',
      x: FORT_W * 0.5,
      z: G.bossZ,
      alt: 0,
      hw: 28, hd: 22, hh: 56,
      hp: isDense() ? 28 : 20,
      max: isDense() ? 28 : 20,
      vx: 36, cd: 0.85, phase: 0, flash: 0, alive: true,
      eyeAlt: 50, eyeZ: 16
    });
    toast('扎克机甲', false, true);
    audio.boss();
    syncHud();
  }

  function scrollSpd() {
    if (G.boss) {
      const b = findBoss();
      if (b && b.alive) {
        const dz = b.z - G.camZ;
        if (dz < 248) return 16;
        if (dz < 330) return 46;
      }
    }
    const dense = isDense();
    if (G.pz >= G.fortA && G.pz < G.spaceEnd) return dense ? 168 : 148;
    if (G.pz >= G.fortB) return dense ? 132 : 118;
    return dense ? 142 : 118;
  }

  function fuelDrain() {
    if (G.pz >= G.fortA && G.pz < G.spaceEnd) return isDense() ? 2.6 : 2.0;
    return isDense() ? 4.4 : 3.2;
  }

  function award(kind, x, z, alt) {
    bumpCombo();
    const n = (SCORE[kind] || 10) * G.mult;
    addScore(n);
    floatText(x, z, alt + 8, '+' + n, kind === 'tank' || kind === 'boss' ? GOLD : WHT, kind === 'boss' || G.mult >= 3);
  }

  function destroy(e) {
    if (!e.alive) return;
    e.alive = false;
    const rgb = e.type === 'tank' ? GOLD : e.type === 'boss' ? HOT : e.type === 'gun' ? MAG : e.type === 'missile' ? PNK : CYN;
    explode(e.x, e.z, e.alt, rgb, e.type === 'boss' ? 42 : e.type === 'tank' ? 22 : 16);
    if (e.type === 'tank') {
      G.fuel = clamp(G.fuel + 36, 0, 100);
      G.siphon = 0.4;
      award('tank', e.x, e.z, e.alt);
      floatText(e.x, e.z, e.alt + 16, '+油', GOLD, true);
      audio.tank();
      hitStop(0.055);
      kick(4);
      screenFlash(GOLD, 0.42);
    } else if (e.type === 'boss') {
      award('boss', e.x, e.z, 50);
      audio.hit('boss', G.combo);
      hitStop(0.08);
      kick(8);
      screenFlash(GOLD, 0.62);
      explode(e.x, e.z + 10, 30, MAG, 28);
      explode(e.x - 16, e.z, 40, GOLD, 18);
      explode(e.x + 16, e.z, 40, CYN, 18);
      G.winT = 1.25;
      toast('机甲崩解', false, true);
    } else {
      award(e.type, e.x, e.z, e.alt);
      audio.hit(e.type, G.combo);
      hitStop(clamp(0.032 + G.combo * 0.003, 0.032, 0.06));
      kick(e.type === 'gun' ? 3.6 : 3.1);
      screenFlash(rgb, 0.28);
    }
  }

  function hurt(e, dmg) {
    e.hp -= dmg;
    e.flash = 0.09;
    if (e.hp <= 0) destroy(e);
    else {
      audio.ping();
      popSpark(e.x, e.z, e.type === 'boss' ? e.eyeAlt : e.alt, WHT, 10);
      hitStop(0.028);
    }
  }

  function smashWall(w) {
    if (!w.alive) return;
    const hh = w.h;
    w.alive = false;
    explode(w.x + w.w * 0.5, w.z + w.d * 0.5, Math.max(10, hh * 0.6), CYN, 22);
    emit(10, {
      x: w.x + w.w * 0.5, z: w.z + w.d * 0.4, alt: hh * 0.5, j: 10,
      vx0: -120, vx1: 120, vz0: -40, vz1: 80, va0: 20, va1: 140,
      r0: 1.6, r1: 4.4, life: 0.4, rgb: SKY, g: 80
    });
    bumpCombo();
    const n = SCORE.wall * G.mult;
    addScore(n);
    floatText(w.x + w.w * 0.5, w.z, 22, '+' + n, SKY, G.mult >= 3);
    audio.wall();
    hitStop(0.048);
    kick(3.8);
    screenFlash(CYN, 0.32);
  }

  function hitWall(w, dmg, sxw, sz, salt) {
    w.hp -= dmg;
    w.flash = 0.08;
    if (w.hp <= 0) smashWall(w);
    else {
      audio.ping();
      popSpark(sxw, sz, salt, HOT, 8);
      hitStop(0.03);
    }
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.why = why;
    G.deadT = 0.9;
    G.lives -= 1;
    breakCombo();
    explode(G.px, G.pz, G.pal, MAG, 32);
    emit(14, {
      x: G.px, z: G.pz, alt: G.pal, j: 8,
      vx0: -200, vx1: 200, vz0: -80, vz1: 120, va0: -40, va1: 160,
      r0: 2, r1: 5.5, life: 0.55, rgb: CYN, g: 80
    });
    audio.death();
    hitStop(0.072);
    kick(8);
    screenFlash(MAG, 0.58);
    G.shots.length = 0;
    syncPips();
  }

  function respawn() {
    const th = nextThreat();
    G.pal = clamp(th ? th.h + 16 : 46, 28, MAX_ALT - 6);
    G.px = FORT_W * 0.5;
    G.fuel = 80;
    G.invuln = 1.45;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.siphon = 0;
    G.warn = false;
    breakCombo();
    toast('剩余 ' + G.lives + ' 命', true, false);
    syncHud();
  }

  function goLose() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    const why = G.why || '坠城了';
    showOverlay('lose', '坠城了', why + '  ·  分数 ' + G.score);
    setHint('R 重开', 'warn');
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', isDense() ? '密火通关' : '要塞攻破', '机甲已毁  ·  分数 ' + G.score);
    setHint('R 重开 · 机甲已毁', 'hot');
    syncHud();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    if (G.shots.length >= 4) return;
    G.fireCd = isDense() ? 0.108 : 0.124;
    G.muzzle = 0.06;
    G.shots.push({
      x: G.px,
      z: G.pz + 12,
      alt: G.pal,
      vz: 430,
      life: 1.05,
      trail: []
    });
    audio.shoot();
  }

  function enemyShot(x, z, alt, vx, vz, va) {
    G.eShots.push({ x: x, z: z, alt: alt, vx: vx, vz: vz, va: va || 0 });
    capArr(G.eShots, 48);
  }

  function near3(ax, az, aa, bx, bz, ba, xr, zr, ar) {
    return Math.abs(ax - bx) < xr && Math.abs(az - bz) < zr && Math.abs(aa - ba) < ar;
  }

  function resetRun(kind) {
    G.kind = kind === 'dense' ? 'dense' : 'fort';
    G.t = 0;
    G.taught = false;
    const level = buildLevel(isDense());
    G.walls = level.walls;
    G.ents = level.ents;
    G.fortA = level.fortA;
    G.spaceEnd = level.spaceEnd;
    G.fortB = level.fortB;
    G.bossZ = level.bossZ;
    G.camZ = 0;
    G.px = 104;
    G.pz = PZ;
    G.pal = 42;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.fuel = 100;
    G.nextLife = LIFE_EVERY;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.deadT = 0;
    G.invuln = 0.45;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.toastT = 0;
    G.why = '';
    G.boss = false;
    G.winT = 0;
    G.engine = 0;
    G.siphon = 0;
    G.alarmT = 0;
    G.fuelAlarm = 0;
    G.warn = false;
    G.lastPhase = '外城';
    G.spawnT = 0.8;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    if (scoreEl) scoreEl.textContent = '0';
    const p = iso(G.px, G.pz, G.pal);
    pointer.sx = p.x;
    pointer.sy = p.y;
  }

  function startGame(kind) {
    resetRun(kind || 'fort');
    G.mode = 'play';
    autoOvWait = 0;
    autoTx = G.px;
    autoTa = G.pal;
    hideOverlay();
    audio.start();
    toast(isDense() ? '密火 · 墙更密炮更勤' : '要塞 · 外城 → 深空 → 内城', false, !isDense());
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('fort');
    G.mode = 'title';
    G.invuln = 99;
    showOverlay('title', '扎克', '等距飞。高度要对，影子贴地就撞。打墙打油打炮，穿两座要塞，再打机甲。');
    syncHud();
  }

  function pointerToWorld(px, py) {
    const dz = PZ;
    const x = (px - OX - dz * IZX) / IX;
    const alt = (OY - dz * IZY + x * IY - py) / IA;
    return { x: x, alt: alt };
  }

  function autoClearInput() {
    keys.l = false;
    keys.r = false;
    keys.u = false;
    keys.d = false;
    pointer.down = false;
    G.fireHold = false;
  }

  function syncAutoUi() {
    if (!btnAuto) return;
    btnAuto.classList.toggle('on', autoOn);
    btnAuto.setAttribute('aria-pressed', autoOn ? 'true' : 'false');
    btnAuto.textContent = autoOn ? '停下' : '自动';
    btnAuto.setAttribute('aria-label', autoOn ? '停止自动' : '自动');
  }

  function syncSpeedUi() {
    if (!speedEl) return;
    speedEl.value = String(autoSpeed);
    if (speedLab) speedLab.textContent = SPEED_LABELS[autoSpeed];
    speedEl.title = SPEED_LABELS[autoSpeed];
    speedEl.setAttribute('aria-valuetext', SPEED_LABELS[autoSpeed]);
  }

  function autoScale() {
    if (!autoOn || G.mode !== 'play') return 1;
    return AUTO_SCALE[autoSpeed] || 1;
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
    autoOvWait = 0;
    autoClearInput();
    syncAutoUi();
    if (autoOn) {
      audio.ensure();
      inputSrc = 'key';
      autoTx = G.px;
      autoTa = G.pal;
      if (G.mode === 'title') startGame('fort');
    }
    syncHud();
  }

  function tickAutoFlow(dt) {
    if (!autoOn) return;
    if (G.mode === 'title') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.25 : 0.5)) {
        autoOvWait = 0;
        startGame('fort');
      }
      return;
    }
    if (G.mode === 'lose' || G.mode === 'win') {
      autoOvWait += dt;
      if (autoOvWait >= (autoSpeed >= 3 ? 0.7 : 1.15)) {
        autoOvWait = 0;
        startGame(G.kind || 'fort');
      }
    }
  }

  function laneWallH(x, z0, z1) {
    let h = 0;
    const xl = x - 9;
    const xr = x + 9;
    const walls = G.walls;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (!w.alive) continue;
      if (w.z + w.d < z0 || w.z > z1) continue;
      if (xr < w.x || xl > w.x + w.w) continue;
      if (w.h > h) h = w.h;
    }
    return h;
  }

  function nearestWallInLane(x, z0, z1) {
    let best = null;
    let bestZ = z1;
    const xl = x - 9;
    const xr = x + 9;
    const walls = G.walls;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (!w.alive) continue;
      if (w.z + w.d < z0 || w.z > z1) continue;
      if (xr < w.x || xl > w.x + w.w) continue;
      if (w.z < bestZ) {
        bestZ = w.z;
        best = w;
      }
    }
    return best;
  }

  function autoPickX() {
    const z0 = G.pz + 6;
    const zNear = G.pz + 96;
    const zFar = G.pz + 220;
    const spd = Math.max(50, scrollSpd());
    const climb = isDense() ? 176 : 160;
    const fuelNeed = G.fuel < 58;
    const fuelCrit = G.fuel < 28;
    const boss = findBoss();
    let bestX = autoTx;
    let bestS = -1e9;
    for (let x = 30; x <= 176; x += 11) {
      const hNear = laneWallH(x, z0, zNear);
      const hFar = laneWallH(x, zNear, zFar);
      const wNear = nearestWallInLane(x, z0, zFar);
      const dz = wNear ? Math.max(4, wNear.z - G.pz) : 400;
      const time = dz / spd;
      const canClear = G.pal + climb * Math.max(0.04, time - 0.1) > hNear + 10;
      let s = 0;
      s -= Math.abs(x - G.px) * 0.18;
      s -= Math.abs(x - autoTx) * 0.28;
      s -= hNear * 2.6;
      s -= hFar * 0.7;
      if (Math.abs(x - autoTx) < 14) s += 16;
      if (!canClear) s -= 900;
      if (hNear > G.pal - 2 && dz < 52) s -= 520;
      if (inFort(G.pz + 20) && hNear === 0) s += 18;
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (!e.alive) continue;
        const edz = e.z - G.pz;
        if (edz < -8 || edz > 240) continue;
        const dx = Math.abs(e.x - x);
        if (e.type === 'tank' && dx < 16) {
          s += (fuelCrit ? 110 : fuelNeed ? 52 : 18) - edz * 0.12;
        } else if (e.type === 'gun' && dx < 16) {
          s += 10 - edz * 0.04;
        } else if ((e.type === 'fighter' || e.type === 'missile') && dx < 18) {
          if (edz < 36 && Math.abs(e.alt - G.pal) < 14) s -= 70;
          else s += 14 - dx * 0.2;
        }
      }
      if (boss && boss.alive) s -= Math.abs(x - boss.x) * 0.85;
      for (let i = 0; i < G.eShots.length; i++) {
        const sh = G.eShots[i];
        const sdz = sh.z - G.pz;
        if (sdz > -12 && sdz < 70 && Math.abs(sh.x - x) < 12 && Math.abs(sh.alt - G.pal) < 12) s -= 80;
      }
      if (s > bestS) {
        bestS = s;
        bestX = x;
      }
    }
    return clamp(bestX, 28, FORT_W - 28);
  }

  function autoPickAlt(tx) {
    const spd = Math.max(50, scrollSpd());
    const climb = isDense() ? 176 : 160;
    const w = nearestWallInLane(tx, G.pz + 4, G.pz + 250);
    const hSoon = laneWallH(tx, G.pz + 4, G.pz + 70);
    const hMid = laneWallH(tx, G.pz + 4, G.pz + 160);
    let want = inSpace() ? 44 : 34;
    if (G.boss) want = 50;
    if (w) {
      const dz = w.z - G.pz;
      const need = w.h + 14;
      if (dz < 170) want = Math.max(want, need);
      if (dz < 58 && G.pal < w.h + 12) want = Math.max(want, w.h + 16);
    }
    if (hSoon > G.pal - 4) want = Math.max(want, hSoon + 16);
    if (hMid > 0 && G.fuel > 40) want = Math.max(want, Math.min(MAX_ALT - 6, hMid + 12));

    let dive = null;
    let diveZ = 1e9;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const dz = e.z - G.pz;
      if (e.type === 'tank' || e.type === 'gun') {
        if (dz < 10 || dz > 170) continue;
        if (Math.abs(e.x - tx) > 22) continue;
        if (G.fuel > 72 && e.type === 'gun') continue;
        if (G.fuel > 82 && e.type === 'tank') continue;
        const nextW = nearestWallInLane(tx, e.z + 10, e.z + 190);
        const climbDist = nextW ? nextW.z - e.z : 400;
        const canUp = 16 + climb * (climbDist / spd) > (nextW ? nextW.h + 12 : 0);
        if (canUp && dz < diveZ) {
          dive = e;
          diveZ = dz;
        }
      } else if (e.type === 'fighter' && dz > 18 && dz < 230) {
        if (Math.abs(e.x - tx) < 28) want = e.alt;
      } else if (e.type === 'missile' && dz > -8 && dz < 90) {
        if (Math.abs(e.x - G.px) < 22 && Math.abs(e.alt - G.pal) < 16) {
          want = e.alt < G.pal ? Math.min(MAX_ALT - 4, G.pal + 22) : Math.max(12, G.pal - 22);
        }
      } else if (e.type === 'boss' && e.alive) {
        want = e.eyeAlt;
      }
    }
    if (dive && G.fuel < 70) {
      const nextW = nearestWallInLane(tx, dive.z + 8, dive.z + 170);
      const dzW = nextW ? nextW.z - G.pz : 400;
      if (!nextW || dzW > 55 || G.pal > (nextW.h + 8)) want = dive.alt + 5;
    }

    for (let i = 0; i < G.eShots.length; i++) {
      const sh = G.eShots[i];
      const dz = sh.z - G.pz;
      if (dz < -8 || dz > 64) continue;
      if (Math.abs(sh.x - G.px) < 14 && Math.abs(sh.alt - G.pal) < 12) {
        want = sh.alt < G.pal ? Math.min(MAX_ALT - 4, G.pal + 18) : Math.max(12, G.pal - 16);
      }
    }

    if (inFort(G.pz) && want < 10) want = 12;
    if (hSoon > 0 && want < hSoon + 10 && (w ? w.z - G.pz : 99) < 90) {
      want = hSoon + 14;
    }
    return clamp(want, 10, MAX_ALT - 4);
  }

  function autoWantShoot(tx, ta) {
    const w = nearestWallInLane(G.px, G.pz + 10, G.pz + 260);
    if (w && G.pal + 1 < w.h && w.z - G.pz < 300) return true;
    const boss = findBoss();
    if (boss && boss.alive) {
      const ez = boss.z + boss.eyeZ;
      if (ez > G.pz + 8 && Math.abs(boss.x - G.px) < 18 && Math.abs(G.pal - boss.eyeAlt) < 13) return true;
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || e.type === 'boss') continue;
      const dz = e.z - G.pz;
      if (dz < 8 || dz > 390) continue;
      const slop = e.type === 'fighter' ? 16 : 14;
      if (Math.abs(e.x - G.px) < e.hw + 8 && Math.abs(e.alt - G.pal) < slop) return true;
    }
    if (w && ta < w.h && Math.abs(tx - G.px) < 20) return true;
    return false;
  }

  function autoThink() {
    autoClearInput();
    if (G.mode !== 'play' || G.deadT > 0) return;
    inputSrc = 'key';

    const desiredX = autoPickX();
    const curH = laneWallH(G.px, G.pz + 6, G.pz + 88);
    const desH = laneWallH(desiredX, G.pz + 6, G.pz + 88);
    const blocked = curH > G.pal - 8;
    if (blocked || desH + 10 < curH || Math.abs(desiredX - autoTx) > 20) {
      autoTx = desiredX;
    } else {
      autoTx = lerp(autoTx, desiredX, 0.22);
    }
    autoTx = clamp(autoTx, 28, FORT_W - 28);
    autoTa = autoPickAlt(autoTx);

    const deadX = autoSpeed >= 4 ? 3.5 : 6;
    const deadA = autoSpeed >= 4 ? 2.5 : 4;
    if (G.px < autoTx - deadX) keys.r = true;
    else if (G.px > autoTx + deadX) keys.l = true;
    if (G.pal < autoTa - deadA) keys.u = true;
    else if (G.pal > autoTa + deadA) keys.d = true;

    const panicW = nearestWallInLane(G.px, G.pz + 2, G.pz + 70);
    if (panicW && G.pal < panicW.h + 10) {
      keys.u = true;
      keys.d = false;
      G.fireHold = true;
      return;
    }
    G.fireHold = autoWantShoot(autoTx, autoTa);
  }

  function movePlayer(dt) {
    if (G.deadT > 0) return;
    const spdX = isDense() ? 236 : 214;
    const spdA = isDense() ? 176 : 160;
    if (!autoOn && inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const w = pointerToWorld(pointer.sx, pointer.sy);
      const k = 1 - Math.exp(-11 * dt);
      G.px += (w.x - G.px) * k;
      G.pal += (w.alt - G.pal) * k;
    } else {
      let dx = 0;
      let da = 0;
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) da += 1;
      if (keys.d) da -= 1;
      if (dx) G.px += dx * spdX * dt;
      if (da) G.pal += da * spdA * dt;
    }
    G.px = clamp(G.px, 22, FORT_W - 22);
    G.pal = clamp(G.pal, 3, MAX_ALT);
  }

  function updateFx(dt) {
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.siphon > 0) G.siphon -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    for (let i = G.walls.length - 1; i >= 0; i--) {
      if (G.walls[i].flash > 0) G.walls[i].flash -= dt;
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.alt += p.va * dt;
      p.va -= p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.42) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.alt += 22 * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
  }

  function shotHitsWall(s) {
    for (let i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      if (!w.alive) continue;
      if (s.z < w.z || s.z > w.z + w.d) continue;
      if (s.x < w.x || s.x > w.x + w.w) continue;
      if (s.alt + 1 < w.h) return w;
    }
    return null;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (!REDUCE) {
        if (!s.trail) s.trail = [];
        s.trail.push({ x: s.x, z: s.z, alt: s.alt });
        if (s.trail.length > 6) s.trail.shift();
      }
      s.z += s.vz * dt;
      s.life -= dt;
      const wall = shotHitsWall(s);
      if (wall) {
        hitWall(wall, 1, s.x, s.z, s.alt);
        G.shots.splice(i, 1);
        continue;
      }
      if (s.life <= 0 || s.z - G.camZ > 440) {
        G.shots.splice(i, 1);
        if (G.mode === 'play' && G.combo > 0) {
          breakCombo();
          audio.miss();
        }
        continue;
      }
      let hit = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        if (e.type === 'boss') {
          const ex = e.x;
          const ez = e.z + e.eyeZ;
          const ea = e.eyeAlt;
          if (near3(s.x, s.z, s.alt, ex, ez, ea, 16, 16, 13)) {
            hurt(e, 1);
            hit = true;
            break;
          }
          if (near3(s.x, s.z, s.alt, e.x, e.z + 12, 28, 26, 22, 40)) {
            popSpark(s.x, s.z, s.alt, CYN, 8);
            audio.ping();
            hit = true;
            break;
          }
          continue;
        }
        const slop = e.type === 'fighter' ? 16 : e.type === 'missile' ? 14 : 14;
        if (near3(s.x, s.z, s.alt, e.x, e.z, e.alt, e.hw + 5, e.hd + 10, slop)) {
          hurt(e, 1);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      s.alt += s.va * dt;
      if (s.z < G.camZ - 30 || s.z > G.camZ + 480 || s.x < -20 || s.x > FORT_W + 30) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (near3(s.x, s.z, s.alt, G.px, G.pz, G.pal, 8, 10, 10)) {
          G.eShots.splice(i, 1);
          killPlayer('被击中');
        }
      }
    }
  }

  function updateEnts(dt) {
    const dense = isDense();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive && e.type !== 'boss') {
        if (e.z < G.camZ - 50) G.ents.splice(i, 1);
        continue;
      }
      if (e.z < G.camZ - 50 && e.type !== 'boss') {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.flash > 0) e.flash -= dt;
      if (e.type === 'fighter' && e.alive) {
        e.phase += dt * 2.6;
        e.x += e.vx * dt + Math.sin(e.phase) * 18 * dt;
        e.z += (e.vz - scrollSpd() * 0.15) * dt;
        e.alt += e.va * dt + Math.cos(e.phase * 0.7) * 10 * dt;
        e.x = clamp(e.x, 24, FORT_W - 24);
        e.alt = clamp(e.alt, 12, MAX_ALT - 4);
        if (e.x < 26 || e.x > FORT_W - 26) e.vx *= -1;
        if (e.alt < 16 || e.alt > MAX_ALT - 8) e.va *= -1;
        if (G.mode === 'play') {
          e.cd -= dt;
          const dz = e.z - G.pz;
          if (e.cd <= 0 && dz > 20 && dz < 280) {
            const dx = G.px - e.x;
            const dzz = G.pz - e.z;
            const da = G.pal - e.alt;
            const d = Math.max(1, hypot(hypot(dx, dzz), da));
            const spd = dense ? 214 : 170;
            enemyShot(e.x, e.z - 6, e.alt, dx / d * spd, dzz / d * spd, da / d * spd);
            e.cd = dense ? rand(0.62, 1.08) : rand(0.95, 1.6);
          }
        }
      } else if (e.type === 'gun' && e.alive && G.mode === 'play') {
        e.cd -= dt;
        const dz = e.z - G.pz;
        if (e.cd <= 0 && dz > 10 && dz < 300) {
          const dx = G.px - e.x;
          const dzz = G.pz - e.z;
          const da = G.pal - e.alt;
          const d = Math.max(1, hypot(hypot(dx, dzz), da));
          const spd = dense ? 176 : 132;
          enemyShot(e.x, e.z, e.alt + 8, dx / d * spd * 0.55, dzz / d * spd, da / d * spd * 0.4);
          e.cd = dense ? rand(0.82, 1.32) : rand(1.25, 2.05);
        }
      } else if (e.type === 'missile' && e.alive) {
        const dx = G.px - e.x;
        const dzz = G.pz - e.z;
        const da = G.pal - e.alt;
        const d = Math.max(1, hypot(hypot(dx, dzz), da));
        const spd = 150;
        e.x += dx / d * spd * dt;
        e.z += dzz / d * spd * dt;
        e.alt += da / d * spd * dt;
        e.alt = clamp(e.alt, 8, MAX_ALT);
      } else if (e.type === 'boss' && e.alive) {
        e.phase += dt;
        e.x += e.vx * dt;
        if (e.x < 50) {
          e.x = 50;
          e.vx = Math.abs(e.vx);
        }
        if (e.x > FORT_W - 50) {
          e.x = FORT_W - 50;
          e.vx = -Math.abs(e.vx);
        }
        if (G.mode === 'play') {
          e.cd -= dt;
          if (e.cd <= 0) {
            const n = e.hp < e.max * 0.5 ? 5 : 3;
            const spd = dense ? 198 : 150;
            for (let k = 0; k < n; k++) {
              const t = n === 1 ? 0.5 : k / (n - 1);
              const spread = lerp(-70, 70, t);
              enemyShot(e.x, e.z + e.eyeZ, e.eyeAlt, spread, -spd, (G.pal - e.eyeAlt) * 0.35);
            }
            if (e.hp < e.max * 0.5) {
              pushEnt({
                type: 'missile',
                x: e.x, z: e.z + 8, alt: e.eyeAlt,
                hw: 7, hd: 9, hh: 7, hp: 1, alive: true, flash: 0
              });
            }
            e.cd = e.hp < e.max * 0.5 ? 0.68 : 1.08;
          }
        }
      }
    }
  }

  function collidePlayer() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const h = crashH(G.px, G.pz);
    if (G.invuln > 0) {
      if (h > G.pal - 1) G.pal = clamp(h + 12, 8, MAX_ALT);
      if (inFort(G.pz) && G.pal < 6) G.pal = 10;
      return;
    }
    if (inFort(G.pz) && G.pal <= 4) {
      killPlayer('擦地了');
      return;
    }
    if (h > G.pal - 0.6) {
      killPlayer('撞墙了');
      return;
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (e.type === 'tank' || e.type === 'gun') {
        if (near3(G.px, G.pz, G.pal, e.x, e.z, e.alt, e.hw + 4, e.hd + 6, e.hh + 4) && G.pal < e.alt + e.hh) {
          killPlayer(e.type === 'tank' ? '撞油罐了' : '撞炮台了');
          return;
        }
      } else if (e.type === 'fighter' || e.type === 'missile') {
        if (near3(G.px, G.pz, G.pal, e.x, e.z, e.alt, e.hw + 3, e.hd + 6, 10)) {
          killPlayer('撞机了');
          return;
        }
      } else if (e.type === 'boss') {
        if (near3(G.px, G.pz, G.pal, e.x, e.z + 10, 28, 24, 20, 36)) {
          killPlayer('撞机甲了');
          return;
        }
      }
    }
  }

  function updateWarn(dt) {
    const th = nextThreat();
    const close = th && (th.z - G.pz) < 170 && G.pal < th.h + 10;
    G.warn = !!close;
    if (G.mode === 'play' && close) {
      G.alarmT -= dt;
      if (G.alarmT <= 0) {
        audio.warnAlt();
        G.alarmT = (th.z - G.pz) < 55 ? 0.28 : 0.55;
        if ((th.z - G.pz) < 48 && G.pal < th.h) toast('拉高！', true, false);
      }
    } else {
      G.alarmT = 0;
    }
    if (G.mode === 'play' && G.fuel < 22 && G.fuel > 0) {
      G.fuelAlarm -= dt;
      if (G.fuelAlarm <= 0) {
        audio.fuelLow();
        G.fuelAlarm = 0.85;
      }
    }
  }

  function updatePhase() {
    const p = phaseName();
    if (p !== G.lastPhase && G.mode === 'play') {
      if (p === '深空') {
        toast('冲出外城', false, true);
        audio.check();
      } else if (p === '内城') {
        toast('突入内城', false, true);
        audio.check();
      }
      G.lastPhase = p;
    }
    if (G.mode === 'play' && !G.boss && G.pz > G.bossZ - 260) spawnBoss();
  }

  function inSpace() {
    return G.pz >= G.fortA && G.pz < G.spaceEnd;
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      if (autoOn && autoSpeed >= 4 && G.mode === 'play') G.stop = 0;
      else {
        G.stop -= dt;
        updateFx(dt * 0.4);
        return;
      }
    }

    const idle = G.mode === 'title' || G.mode === 'lose' || G.mode === 'win';
    if (idle) {
      G.camZ += 36 * dt;
      G.pz = G.camZ + PZ;
      updateEnts(dt);
      updateFx(dt);
      if (G.mode === 'win' && G.winT > 0) G.winT -= dt;
      tickAutoFlow(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.camZ += scrollSpd() * 0.32 * dt;
      G.pz = G.camZ + PZ;
      updateEnts(dt);
      updateShots(dt);
      updateFx(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) goLose();
        else respawn();
      }
      return;
    }

    if (G.winT > 0) {
      G.winT -= dt;
      updateEnts(dt);
      updateShots(dt);
      updateFx(dt);
      if (G.winT <= 0) goWin();
      return;
    }

    G.camZ += scrollSpd() * dt;
    G.pz = G.camZ + PZ;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    if (autoOn) autoThink();
    movePlayer(dt);
    if (G.fireHold) fire();

    G.fuel -= fuelDrain() * dt;
    if (G.fuel <= 0) {
      G.fuel = 0;
      killPlayer('油尽了');
    }

    G.engine += dt;
    if (G.engine > 0.03 && !REDUCE) {
      G.engine = 0;
      emit(1, {
        x: G.px, z: G.pz - 10, alt: G.pal - 1, j: 2,
        vx0: -16, vx1: 16, vz0: -80, vz1: -20, va0: -8, va1: 12,
        r0: 1.1, r1: 2.4, life: 0.22, rgb: CYN, g: 20
      });
    }

    if (inSpace() && !G.boss) {
      G.spawnT -= dt;
      if (G.spawnT <= 0) {
        const n = isDense() ? 2 + (hash2((G.pz | 0)) > 0.5 ? 1 : 0) : 1 + (hash2((G.pz | 0)) > 0.42 ? 1 : 0);
        for (let i = 0; i < n; i++) spawnFighter();
        G.spawnT = isDense() ? rand(0.55, 0.96) : rand(0.82, 1.32);
      }
    }

    updateEnts(dt);
    updateShots(dt);
    collidePlayer();
    updateWarn(dt);
    updatePhase();
    if (!G.taught && G.t > 2.15 && G.score === 0) {
      G.taught = true;
      toast('↓ 俯冲打油罐  ·  ↑ 拉高过墙', false, true);
    }
    updateFx(dt);
    syncHud();
  }

  function fillPoly(pts, color) {
    const c = ctx;
    c.beginPath();
    c.moveTo(sx(pts[0].x), sy(pts[0].y));
    for (let i = 1; i < pts.length; i++) c.lineTo(sx(pts[i].x), sy(pts[i].y));
    c.closePath();
    c.fillStyle = color;
    c.fill();
  }

  function strokePoly(pts, color, w) {
    const c = ctx;
    c.beginPath();
    c.moveTo(sx(pts[0].x), sy(pts[0].y));
    for (let i = 1; i < pts.length; i++) c.lineTo(sx(pts[i].x), sy(pts[i].y));
    c.closePath();
    c.strokeStyle = color;
    c.lineWidth = w;
    c.stroke();
  }

  function drawBox(x, z, w, d, h, top, left, front, a, base) {
    if (base == null) base = 0;
    if (a == null) a = 1;
    const A = iso(x, z, base);
    const B = iso(x + w, z, base);
    const D = iso(x, z + d, base);
    const At = iso(x, z, base + h);
    const Bt = iso(x + w, z, base + h);
    const Ct = iso(x + w, z + d, base + h);
    const Dt = iso(x, z + d, base + h);
    fillPoly([A, D, Dt, At], rgba(left, a));
    fillPoly([A, B, Bt, At], rgba(front, a));
    fillPoly([At, Bt, Ct, Dt], rgba(top, a));
  }

  function drawTile(x, z, s, rgb, a) {
    fillPoly([
      iso(x, z, 0),
      iso(x + s, z, 0),
      iso(x + s, z + s, 0),
      iso(x, z + s, 0)
    ], rgba(rgb, a));
  }

  function inView(z) {
    const dz = z - G.camZ;
    return dz > -40 && dz < 480;
  }

  function drawFloorSection(z0b, z1b) {
    const z0 = Math.max(Math.floor((G.camZ - 24) / TILE) * TILE, z0b);
    const z1 = Math.min(G.camZ + 460, z1b);
    if (z1 <= z0) return;
    for (let z = z0; z < z1; z += TILE) {
      for (let x = 16; x < FORT_W - 16; x += TILE) {
        const parity = (((x / TILE) | 0) + ((z / TILE) | 0)) & 1;
        drawTile(x, z, TILE, parity ? FLOOR_A : FLOOR_B, 1);
      }
    }
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = rgba(CYN, 0.32);
    ctx.lineWidth = Math.max(1, 0.8 * scale);
    const zg = Math.floor(z0 / (TILE * 2)) * (TILE * 2);
    for (let z = zg; z < z1; z += TILE * 2) {
      const a = iso(16, z, 0);
      const b = iso(FORT_W - 16, z, 0);
      ctx.beginPath();
      ctx.moveTo(sx(a.x), sy(a.y));
      ctx.lineTo(sx(b.x), sy(b.y));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloor() {
    drawFloorSection(0, G.fortA + 8);
    drawFloorSection(G.spaceEnd - 8, G.fortB + 8);
  }

  function drawSides() {
    const chunks = [[0, G.fortA], [G.spaceEnd, G.fortB]];
    for (let c = 0; c < chunks.length; c++) {
      const z0 = Math.floor((Math.max(G.camZ - 20, chunks[c][0]) / 32)) * 32;
      const z1 = Math.min(G.camZ + 460, chunks[c][1]);
      for (let z = z0; z < z1; z += 32) {
        if (!inView(z)) continue;
        drawBox(-8, z, 24, 32, 90, SIDE_T, SIDE_L, SIDE_F, 1, 0);
        drawBox(FORT_W - 16, z, 24, 32, 90, SIDE_T, SIDE_L, SIDE_F, 1, 0);
      }
    }
  }

  function wallDanger(w) {
    if (!w.alive) return false;
    if (w.z + w.d < G.pz - 4) return false;
    if (w.z > G.pz + 190) return false;
    if (G.px + 9 < w.x || G.px - 9 > w.x + w.w) return false;
    return G.pal < w.h + 10;
  }

  function drawWall(w) {
    if (!w.alive) return;
    const danger = wallDanger(w);
    const flash = w.flash > 0;
    const top = flash ? WHT : (danger ? MAG : (w.h > 44 ? HOT : TOP));
    const left = danger ? [90, 22, 58] : LEFT;
    const front = danger ? [150, 40, 90] : FRONT;
    drawBox(w.x, w.z, w.w, w.d, w.h, top, left, front, 1, 0);
    const At = iso(w.x, w.z, w.h);
    const Bt = iso(w.x + w.w, w.z, w.h);
    const Ct = iso(w.x + w.w, w.z + w.d, w.h);
    const Dt = iso(w.x, w.z + w.d, w.h);
    strokePoly([At, Bt, Ct, Dt], rgba(danger ? MAG : GOLD, danger ? 0.95 : 0.42), Math.max(1, 1.4 * scale));
  }

  function drawTank(e) {
    if (!e.alive) return;
    const top = e.flash > 0 ? WHT : GOLD;
    drawBox(e.x - 8, e.z - 7, 16, 14, 16, top, [120, 80, 20], [255, 180, 70], 1, 0);
    const inset = iso(e.x, e.z, 5);
    ctx.fillStyle = '#0a1420';
    ctx.fillRect(sx(inset.x - 5), sy(inset.y - 8), 10 * scale, 12 * scale);
    const pulse = 0.7 + 0.3 * Math.sin(G.t * 7);
    ctx.fillStyle = rgba(GOLD, pulse);
    ctx.fillRect(sx(inset.x - 5), sy(inset.y - 2), 10 * scale, 6 * scale);
  }

  function drawGun(e) {
    if (!e.alive) return;
    const rgb = e.flash > 0 ? WHT : MAG;
    drawBox(e.x - 8, e.z - 7, 16, 14, 12, rgb, [90, 20, 50], [180, 40, 90], 1, 0);
    drawBox(e.x - 4, e.z - 3, 8, 8, 8, GOLD, [90, 20, 50], MAG, 1, 12);
    const barrel = iso(e.x, e.z + 10, 18);
    const base = iso(e.x, e.z, 18);
    ctx.strokeStyle = rgba(PNK, 0.9);
    ctx.lineWidth = 2.2 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(base.x), sy(base.y));
    ctx.lineTo(sx(barrel.x), sy(barrel.y));
    ctx.stroke();
  }

  function drawFighter(e) {
    if (!e.alive) return;
    const x = e.x, z = e.z, a = e.alt;
    const sh = iso(x, z, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(sx(sh.x), sy(sh.y), 8 * scale, 3.2 * scale, -0.4, 0, TAU);
    ctx.fill();
    const rgb = e.flash > 0 ? WHT : MAG;
    const nose = iso(x, z - 8, a);
    const wingL = iso(x - 10, z + 6, a);
    const wingR = iso(x + 10, z + 6, a);
    const tail = iso(x, z + 10, a + 2);
    fillPoly([nose, wingL, tail], rgba(rgb, 0.95));
    fillPoly([nose, tail, wingR], rgba([180, 40, 110], 0.95));
    fillPoly([iso(x - 2, z, a + 3), iso(x + 2, z, a + 3), iso(x, z - 4, a + 2)], rgba(WHT, 0.75));
  }

  function drawMissile(e) {
    if (!e.alive) return;
    const p = iso(e.x, e.z, e.alt);
    ctx.save();
    ctx.translate(sx(p.x), sy(p.y));
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.moveTo(8 * scale, -3 * scale);
    ctx.lineTo(-8 * scale, -5 * scale);
    ctx.lineTo(-8 * scale, 5 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.8);
    ctx.fillRect(-2 * scale, -2 * scale, 6 * scale, 4 * scale);
    ctx.restore();
  }

  function drawBoss(e) {
    const x = e.x;
    const z = e.z;
    const flash = e.flash > 0;
    const top = flash ? WHT : [70, 160, 220];
    const left = flash ? [180, 180, 180] : [18, 40, 78];
    const front = flash ? PNK : [40, 110, 180];
    drawBox(x - 42, z, 84, 40, 6, SIDE_T, SIDE_L, SIDE_F, 1, 0);
    drawBox(x - 20, z + 8, 12, 14, 14, top, left, front, 1, 6);
    drawBox(x + 8, z + 8, 12, 14, 14, top, left, front, 1, 6);
    drawBox(x - 18, z + 6, 36, 22, 22, top, left, front, 1, 20);
    drawBox(x - 12, z + 8, 24, 16, 14, flash ? WHT : CYN, left, front, 1, 42);
    drawBox(x - 34, z + 10, 12, 10, 10, GOLD, left, front, 1, 28);
    drawBox(x + 22, z + 10, 12, 10, 10, GOLD, left, front, 1, 28);
    const eye = iso(x, z + e.eyeZ, e.eyeAlt);
    const pulse = 0.55 + 0.45 * Math.sin(G.t * 8);
    ctx.fillStyle = rgba(e.alive ? (flash ? WHT : GOLD) : MAG, pulse);
    ctx.beginPath();
    ctx.arc(sx(eye.x), sy(eye.y), 6.5 * scale, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(sx(eye.x), sy(eye.y), 2.2 * scale, 0, TAU);
    ctx.fill();
    if (e.alive && e.max) {
      const t = clamp(e.hp / e.max, 0, 1);
      const hp = iso(x, z + 8, 72);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(sx(hp.x - 28), sy(hp.y), 56 * scale, 6 * scale);
      ctx.fillStyle = rgba(t < 0.35 ? MAG : GOLD, 0.95);
      ctx.fillRect(sx(hp.x - 28), sy(hp.y), 56 * t * scale, 6 * scale);
    }
  }

  function drawShip() {
    if (G.mode === 'lose') return;
    if (G.deadT > 0) return;
    if (G.mode === 'play' && G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0) return;
    const x = G.px;
    const z = G.pz;
    const a = G.pal;
    const shH = Math.max(0, groundH(x, z));
    const p0 = iso(x, z, shH);
    const p1 = iso(x, z, a);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(sx(p0.x), sy(p0.y), 13 * scale, 5 * scale, -0.42, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(G.warn ? MAG : CYN, G.warn ? 0.85 : 0.5);
    ctx.lineWidth = Math.max(1, 1.3 * scale);
    ctx.setLineDash([4 * scale, 3 * scale]);
    ctx.beginPath();
    ctx.moveTo(sx(p0.x), sy(p0.y));
    ctx.lineTo(sx(p1.x), sy(p1.y));
    ctx.stroke();
    ctx.setLineDash([]);

    const nose = iso(x, z + 14, a);
    const wingL = iso(x - 13, z - 2, a - 1);
    const wingR = iso(x + 13, z - 2, a - 1);
    const tail = iso(x, z - 12, a);
    const keel = iso(x, z - 4, a - 3);
    fillPoly([nose, wingL, tail], rgba(CYN, 0.96));
    fillPoly([nose, tail, wingR], rgba([40, 140, 210], 0.96));
    fillPoly([nose, iso(x - 3, z + 2, a + 4), iso(x + 3, z + 2, a + 4)], rgba(WHT, 0.92));
    fillPoly([tail, wingL, keel], rgba([16, 70, 120], 0.8));
    fillPoly([tail, keel, wingR], rgba([10, 50, 96], 0.8));
    if (G.muzzle > 0) {
      const m = G.muzzle / 0.06;
      ctx.fillStyle = rgba(WHT, m);
      ctx.beginPath();
      ctx.arc(sx(nose.x), sy(nose.y), 7 * scale * m, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, m * 0.8);
      const tip = iso(x, z + 22, a);
      ctx.fillRect(sx(tip.x - 1.2), sy(tip.y - 6), 2.4 * scale, 10 * scale);
    }
    if (G.siphon > 0) {
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(p1.x), sy(p1.y), 16 * scale, 0, TAU);
      ctx.stroke();
    }
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      if (s.trail && !REDUCE) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          const q = iso(p.x, p.z, p.alt);
          ctx.fillStyle = rgba(CYN, 0.1 + t * 0.08);
          ctx.beginPath();
          ctx.arc(sx(q.x), sy(q.y), 1.6 * scale, 0, TAU);
          ctx.fill();
        }
      }
      const q = iso(s.x, s.z, s.alt);
      const q2 = iso(s.x, s.z + 10, s.alt);
      ctx.strokeStyle = rgba(WHT, 0.95);
      ctx.lineWidth = 2.4 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(q.x), sy(q.y));
      ctx.lineTo(sx(q2.x), sy(q2.y));
      ctx.stroke();
      ctx.strokeStyle = rgba(CYN, 0.9);
      ctx.lineWidth = 1.4 * scale;
      ctx.stroke();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const q = iso(s.x, s.z, s.alt);
      ctx.fillStyle = rgba(MAG, 0.95);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), 3.1 * scale, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(WHT, 0.7);
      ctx.beginPath();
      ctx.arc(sx(q.x), sy(q.y), 1.2 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawFx() {
    const c = ctx;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      const q = iso(p.x, p.z, p.alt);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(sx(q.x), sy(q.y), p.r * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.28;
      const q = iso(s.x, s.z, s.alt);
      c.fillStyle = rgba(s.rgb, 1 - t);
      c.beginPath();
      c.arc(sx(q.x), sy(q.y), s.rad * (0.4 + t) * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / 0.42;
      const q = iso(r.x, r.z, r.alt);
      c.strokeStyle = rgba(r.rgb, 1 - t);
      c.lineWidth = Math.max(1, 2 * scale * (1 - t));
      c.beginPath();
      c.arc(sx(q.x), sy(q.y), (r.r + t * 28) * scale, 0, TAU);
      c.stroke();
    }
    c.restore();
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      const q = iso(f.x, f.z, f.alt);
      c.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(q.x), sy(q.y));
    }
  }

  function drawStars() {
    const inSp = G.camZ > G.fortA - 220 && G.camZ < G.spaceEnd + 80;
    const spaceT = inSp
      ? clamp((G.camZ - (G.fortA - 220)) / 280, 0, 1) * clamp((G.spaceEnd + 80 - G.camZ) / 220, 0, 1)
      : (G.camZ > G.fortB - 40 ? clamp((G.camZ - (G.fortB - 80)) / 220, 0, 1) : 0);
    if (spaceT <= 0) return;
    ctx.save();
    ctx.globalAlpha = spaceT;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const y = (s.y + G.camZ * s.p * 0.22) % VH;
      const x = (s.x + G.camZ * s.p * 0.08) % VW;
      ctx.fillStyle = rgba(WHT, 0.25 + s.p * 0.6);
      ctx.fillRect(sx(x), sy(y), s.s * scale, s.s * scale);
    }
    ctx.restore();
  }

  function drawAltimeter() {
    const ax = 18;
    const ay = 198;
    const ah = 240;
    const aw = 16;
    ctx.fillStyle = 'rgba(6,16,28,0.62)';
    ctx.fillRect(sx(ax - 6), sy(ay - 18), (aw + 22) * scale, (ah + 36) * scale);
    ctx.strokeStyle = rgba(CYN, 0.45);
    ctx.lineWidth = 1.2 * scale;
    ctx.strokeRect(sx(ax), sy(ay), aw * scale, ah * scale);
    const th = nextThreat();
    if (th) {
      const wy = ay + ah - (th.h / MAX_ALT) * ah;
      ctx.fillStyle = rgba(G.warn ? MAG : GOLD, 0.55);
      ctx.fillRect(sx(ax), sy(wy - 2), aw * scale, 4 * scale);
      ctx.fillStyle = rgba(G.warn ? MAG : GOLD, 0.18);
      ctx.fillRect(sx(ax), sy(wy), aw * scale, (ay + ah - wy) * scale);
    }
    const syShip = ay + ah - (G.pal / MAX_ALT) * ah;
    ctx.fillStyle = rgba(G.warn ? MAG : CYN, 0.95);
    ctx.beginPath();
    ctx.moveTo(sx(ax + aw + 2), sy(syShip));
    ctx.lineTo(sx(ax + aw + 12), sy(syShip - 6));
    ctx.lineTo(sx(ax + aw + 12), sy(syShip + 6));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(G.warn ? MAG : CYN, 0.9);
    ctx.fillRect(sx(ax + 2), sy(syShip - 2), (aw - 4) * scale, 4 * scale);
    ctx.fillStyle = rgba(WHT, 0.55);
    ctx.font = '700 ' + (9 * scale) + 'px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('高', sx(ax - 2), sy(ay - 14));
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.fillText('地', sx(ax - 2), sy(ay + ah + 14));
  }

  function drawBg() {
    const c = ctx;
    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    const p = phaseName();
    const spacey = p === '深空' || p === '机甲';
    g.addColorStop(0, spacey ? '#081428' : '#0a2038');
    g.addColorStop(1, spacey ? '#040810' : '#061018');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#041018';
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

    c.beginPath();
    c.rect(sx(0), sy(0), VW * scale, VH * scale);
    c.clip();

    drawBg();
    drawStars();
    drawFloor();
    drawSides();

    const farWalls = [];
    const nearWalls = [];
    for (let i = 0; i < G.walls.length; i++) {
      const w = G.walls[i];
      if (!w.alive) continue;
      if (!inView(w.z) && !inView(w.z + w.d)) continue;
      if (w.z + w.d >= G.pz) farWalls.push(w);
      else nearWalls.push(w);
    }
    farWalls.sort(function (a, b) { return b.z - a.z; });
    nearWalls.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < farWalls.length; i++) drawWall(farWalls[i]);

    const ground = [];
    const air = [];
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!inView(e.z) && e.type !== 'boss') continue;
      if (e.type === 'tank' || e.type === 'gun' || e.type === 'boss') ground.push(e);
      else air.push(e);
    }
    ground.sort(function (a, b) { return b.z - a.z; });
    air.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < ground.length; i++) {
      const e = ground[i];
      if (e.type === 'tank') drawTank(e);
      else if (e.type === 'gun') drawGun(e);
      else if (e.type === 'boss') drawBoss(e);
    }

    for (let i = 0; i < air.length; i++) {
      const e = air[i];
      if (e.z < G.pz) continue;
      if (e.type === 'fighter') drawFighter(e);
      else if (e.type === 'missile') drawMissile(e);
    }
    drawShip();
    for (let i = 0; i < air.length; i++) {
      const e = air[i];
      if (e.z >= G.pz) continue;
      if (e.type === 'fighter') drawFighter(e);
      else if (e.type === 'missile') drawMissile(e);
    }

    for (let i = 0; i < nearWalls.length; i++) drawWall(nearWalls[i]);

    drawShots();
    drawFx();
    drawAltimeter();

    if (G.flash > 0) {
      c.fillStyle = rgba(G.flashRgb, G.flash * 0.55);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }
    c.restore();
  }

  function resize() {
    if (!canvas || !stageEl) return;
    const rect = stageEl.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function pointerWorldX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left - ox) / scale;
  }
  function pointerWorldY(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientY - rect.top - oy) / scale;
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('fort');
    else startGame(G.kind || 'fort');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('fort');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const code = e.code;
    if (k === 'a' || k === 'A' || code === 'KeyA') {
      e.preventDefault();
      if (down && !e.repeat) toggleAuto();
      return;
    }
    if (e.target === speedEl) return;
    if (k === 'ArrowLeft' || k === 'Left') {
      keys.l = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down && !autoOn;
      if (down) inputSrc = 'key';
    }
    const space = k === ' ' || k === 'Spacebar' || code === 'Space';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter')) {
      e.preventDefault();
    }
    if (!down) {
      if (space && !autoOn) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R')) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (autoOn && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'd' || k === 'D' || k === 'w' || k === 'W' || k === 's' || k === 'S')) {
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'dense' : 'fort');
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
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      if (autoOn) return;
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.sx = clamp(pointerWorldX(e), 0, VW);
      pointer.sy = clamp(pointerWorldY(e), 0, VH);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      if (autoOn) return;
      pointer.sx = clamp(pointerWorldX(e), 0, VW);
      pointer.sy = clamp(pointerWorldY(e), 0, VH);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      if (!autoOn) G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function () {
      pointer.hover = false;
      if (!pointer.down && !autoOn) G.fireHold = false;
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
    const turbo = autoOn && autoSpeed >= 4 && G.mode === 'play';
    if (turbo) G.stop = 0;
    acc += dt * autoScale();
    let n = 0;
    const maxSteps = turbo ? 16 : 5;
    while (acc >= STEP && n < maxSteps) {
      update(STEP);
      acc -= STEP;
      n += 1;
    }
    if (acc > STEP * 4) acc = 0;
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
  autoSpeed = loadAutoSpeed();
  syncSpeedUi();
  syncAutoUi();
  goTitle();
  resize();
  bindPointer();

  if (btnFort) {
    btnFort.addEventListener('click', function () {
      audio.ensure();
      startGame('fort');
    });
  }
  if (btnDense) {
    btnDense.addEventListener('click', function () {
      audio.ensure();
      startGame('dense');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'fort');
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
  if (btnAuto) btnAuto.addEventListener('click', function () { toggleAuto(); });
  if (speedEl) {
    speedEl.addEventListener('input', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
    });
    speedEl.addEventListener('change', function () {
      setAutoSpeed(parseInt(speedEl.value, 10) || 3);
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
