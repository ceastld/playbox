'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const CX = VW * 0.5;
  const VIEW_TOP = 16;
  const DASH = 108;
  const FOCAL = 350;
  const NEAR = 1.55;
  const WORLD = 480;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 15000;
  const SHIELD = 100;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.48;
  const YAW_SPD = 1.62;
  const PITCH_SPD = 1.28;
  const PITCH_MIN = -0.64;
  const PITCH_MAX = 0.64;
  const SPD_BASE = 36;
  const LASER_V = 128;
  const BALL_V = 42;
  const RADAR_RANGE = 128;
  const BEST_KEY = 'playbox-star-fire-best';
  const MUTE_KEY = 'playbox-star-fire-mute';
  const OPS = '方向 / WASD 瞄准 · 空格激光 · Shift 导弹 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  const COARSE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(pointer: coarse)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const HOT = [255, 90, 32];
  const FLM = [255, 138, 50];
  const RED = [255, 72, 86];
  const WHT = [255, 236, 224];
  const PNK = [255, 154, 212];
  const ORG = [255, 160, 72];

  const KINDS = {
    fgt: { hp: 1, score: 150, rad: 2.15, spd: 19, fire: 2.35, lock: true },
    int: { hp: 1, score: 250, rad: 1.95, spd: 28, fire: 1.72, lock: true },
    gun: { hp: 3, score: 520, rad: 3.55, spd: 12, fire: 1.15, lock: true },
    cap: { hp: 10, score: 1800, rad: 8.2, spd: 6.4, fire: 0.62, lock: true }
  };
  const KIND_RGB = { fgt: HOT, int: CYN, gun: GOLD, cap: MAG };
  const KIND_NAME = { fgt: '战机', int: '截击', gun: '炮艇', cap: '战列' };

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
  const btnCruise = document.getElementById('btn-cruise');
  const btnNet = document.getElementById('btn-net');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnMsl = document.getElementById('btn-msl');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const comboEl = document.getElementById('combo-label');
  const mslEl = document.getElementById('msl-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const shieldBar = document.getElementById('shield-bar');
  const shieldWrap = document.getElementById('shield-wrap');
  const heatBar = document.getElementById('heat-bar');
  const heatWrap = document.getElementById('heat-wrap');

  let W = 1;
  let H = 1;
  let dpr = 1;
  let scale = 1;
  let ox = 0;
  let oy = 0;
  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let comboTok = 0;
  let hudN = -1;
  let kickTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const ptrs = {};
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const smears = [];
  const stars = [];
  const enemies = [];
  const shots = [];
  const missiles = [];
  const balls = [];

  const G = {
    mode: 'title',
    kind: 'cruise',
    t: 0,
    clock: 0,
    wave: 1,
    lives: LIVES,
    shield: SHIELD,
    heat: 0,
    overheat: false,
    score: 0,
    best: { c: 0, n: 0 },
    combo: 0,
    comboT: 0,
    mult: 1,
    next1up: LIFE_EVERY,
    missiles: 6,
    px: WORLD * 0.5,
    py: WORLD * 0.5,
    pz: WORLD * 0.5,
    yaw: 0,
    pitch: 0,
    bank: 0,
    spd: SPD_BASE,
    cosY: 1,
    sinY: 0,
    cosP: 1,
    sinP: 0,
    fireCd: 0,
    fireHold: false,
    mslCd: 0,
    mslHold: false,
    laserAir: 0,
    lock: { ent: null, t: 0, locked: false, beep: 0, hold: 0 },
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: HOT,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    warn: 0,
    warnBeep: 0,
    waveT: 0,
    contacts: 0,
    yawIn: 0,
    pitchIn: 0,
    msg: '',
    msgT: 0
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
  function mix(a, b, t) {
    const k = t < 0 ? 0 : t > 1 ? 1 : t;
    return [
      (a[0] + (b[0] - a[0]) * k) | 0,
      (a[1] + (b[1] - a[1]) * k) | 0,
      (a[2] + (b[2] - a[2]) * k) | 0
    ];
  }
  function rgba(rgb, a) {
    if (a == null || a >= 0.995) return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function wrap(v) {
    v %= WORLD;
    if (v < 0) v += WORLD;
    return v;
  }
  function wrapD(d) {
    const h = WORLD * 0.5;
    if (d > h) d -= WORLD;
    if (d < -h) d += WORLD;
    return d;
  }
  function wrapAng(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function hypot3(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
  }
  function dist3(ax, ay, az, bx, by, bz) {
    return hypot3(wrapD(bx - ax), wrapD(by - ay), wrapD(bz - az));
  }
  function isNet() {
    return G.kind === 'net';
  }
  function kindBest() {
    return isNet() ? G.best.n : G.best.c;
  }
  function overlayOpen() {
    return overlay && !overlay.classList.contains('hidden');
  }
  function dashY() {
    return VH - DASH;
  }
  function viewCy() {
    return (VIEW_TOP + dashY()) * 0.5;
  }
  function playing() {
    return G.mode === 'play' && G.deadT <= 0;
  }

  function camPoint(wx, wy, wz) {
    const dx = wrapD(wx - G.px);
    const dy = wrapD(wy - G.py);
    const dz = wrapD(wz - G.pz);
    const rx = dx * G.cosY - dz * G.sinY;
    const rz = dx * G.sinY + dz * G.cosY;
    const ry = dy * G.cosP - rz * G.sinP;
    const fz = dy * G.sinP + rz * G.cosP;
    return { x: rx, y: ry, z: fz };
  }

  function fromCam(rx, ry, fz) {
    const dy = ry * G.cosP + fz * G.sinP;
    const rz = -ry * G.sinP + fz * G.cosP;
    const dx = rx * G.cosY + rz * G.sinY;
    const dz = -rx * G.sinY + rz * G.cosY;
    return { x: wrap(G.px + dx), y: wrap(G.py + dy), z: wrap(G.pz + dz) };
  }

  function projCam(p) {
    const z = Math.max(NEAR, p.z);
    const inv = 1 / z;
    return {
      x: CX + FOCAL * p.x * inv,
      y: viewCy() - FOCAL * p.y * inv,
      s: FOCAL * inv,
      z: p.z
    };
  }

  function project(wx, wy, wz) {
    const c = camPoint(wx, wy, wz);
    if (c.z < NEAR) return null;
    return projCam(c);
  }

  function look() {
    return {
      x: G.sinY * G.cosP,
      y: G.sinP,
      z: G.cosY * G.cosP
    };
  }

  function syncTrig() {
    G.cosY = Math.cos(G.yaw);
    G.sinY = Math.sin(G.yaw);
    G.cosP = Math.cos(G.pitch);
    G.sinP = Math.sin(G.pitch);
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    eng: null,
    eng2: null,
    engG: null,
    engF: null,
    ensure() {
      if (!this.ctx) {
        const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.33;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      this.startEngine();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.33;
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
    startEngine() {
      if (!this.ctx || this.eng) return;
      const o = this.ctx.createOscillator();
      o.type = 'sawtooth';
      const o2 = this.ctx.createOscillator();
      o2.type = 'square';
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 420;
      const g = this.ctx.createGain();
      g.gain.value = 0.0001;
      o.connect(f);
      o2.connect(f);
      f.connect(g);
      g.connect(this.master);
      o.start();
      o2.start();
      this.eng = o;
      this.eng2 = o2;
      this.engG = g;
      this.engF = f;
    },
    tickEngine() {
      if (!this.engG || !this.ctx) return;
      const t = this.ctx.currentTime;
      const on = G.mode === 'play' || G.mode === 'title';
      if (!on) {
        this.engG.gain.setTargetAtTime(0, t, 0.08);
        return;
      }
      const f = 52 + G.spd * 1.05 + G.pitch * 12 + Math.sin(G.t * 22) * 3;
      this.eng.frequency.setTargetAtTime(f, t, 0.05);
      this.eng2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
      this.engF.frequency.setTargetAtTime(280 + G.spd * 8, t, 0.08);
      const vol = this.muted ? 0 : (G.mode === 'play' && G.deadT <= 0 ? 0.046 : 0.016);
      this.engG.gain.setTargetAtTime(vol, t, 0.08);
    },
    laser() {
      this.beep(1180, 0.07, 'square', 0.04, 240);
      this.beep(320, 0.05, 'sawtooth', 0.03, 90);
      this.noise(0.04, 0.03, 1400);
    },
    lockTick(p) {
      this.beep(720 + p * 780, 0.05, 'square', 0.034);
    },
    lockOn() {
      this.beep(980, 0.07, 'square', 0.07);
      this.beep(1320, 0.1, 'square', 0.05);
      this.beep(1760, 0.08, 'triangle', 0.032);
    },
    lockHold() {
      this.beep(1480, 0.035, 'square', 0.022);
    },
    missile() {
      this.noise(0.12, 0.07, 380);
      this.beep(260, 0.16, 'sawtooth', 0.055, 70);
      this.beep(920, 0.1, 'square', 0.036, 380);
    },
    hit(combo) {
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.045, 0.038, 1000);
      this.beep(540 * lift, 0.07, 'square', 0.048, 920 * lift);
    },
    boom(big) {
      this.noise(big ? 0.2 : 0.1, big ? 0.08 : 0.05, big ? 220 : 460);
      this.beep(big ? 140 : 240, big ? 0.26 : 0.12, 'sawtooth', 0.055, 48);
    },
    warn() {
      this.beep(880, 0.07, 'square', 0.06);
      this.beep(540, 0.09, 'square', 0.04);
    },
    ping() {
      this.beep(1560, 0.04, 'sine', 0.022, 2200);
    },
    overheat() {
      this.beep(180, 0.16, 'sawtooth', 0.04, 70);
    },
    empty() {
      this.beep(170, 0.1, 'square', 0.03, 80);
    },
    miss() {
      this.beep(150, 0.06, 'sine', 0.018, 70);
    },
    death() {
      this.noise(0.18, 0.07, 260);
      this.beep(260, 0.22, 'sawtooth', 0.055, 60);
      this.beep(110, 0.34, 'sine', 0.048, 36);
    },
    wave() {
      this.beep(392, 0.08, 'square', 0.042, 523);
      this.beep(523, 0.1, 'triangle', 0.038, 784);
      this.beep(784, 0.18, 'square', 0.04, 1046);
    },
    start() {
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.034, 990);
    },
    lose() {
      this.beep(220, 0.2, 'sawtooth', 0.05, 80);
      this.beep(140, 0.3, 'sine', 0.048, 46);
    },
    combo(m) {
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    oneup() {
      this.beep(660, 0.08, 'square', 0.045, 880);
      this.beep(880, 0.12, 'triangle', 0.05, 1320);
    },
    enemyShot() {
      this.beep(210, 0.05, 'square', 0.02, 80);
    }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (o && typeof o === 'object') {
          G.best.c = Math.max(0, o.c | 0);
          G.best.n = Math.max(0, o.n | 0);
        } else {
          const n = parseInt(raw, 10);
          if (isFinite(n) && n > 0) G.best.c = n;
        }
      }
    } catch (err) { /* ignore */ }
    if (bestEl) bestEl.textContent = String(kindBest());
  }

  function saveBest() {
    const k = isNet() ? 'n' : 'c';
    if (G.score <= G.best[k]) return;
    G.best[k] = G.score;
    if (bestEl) bestEl.textContent = String(G.best[k]);
    try { localStorage.setItem(BEST_KEY, JSON.stringify(G.best)); } catch (err) { /* ignore */ }
  }

  function bumpScore(n) {
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
      audio.oneup();
      toast('1UP', false, true);
      syncPips();
    }
  }

  function noteCombo() {
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

  function breakCombo() {
    G.combo = 0;
    G.mult = 1;
    G.comboT = 0;
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

  function cockpitMsg(text, t) {
    G.msg = text;
    G.msgT = t == null ? 0.9 : t;
  }

  function setHint(text, cls) {
    if (!hintEl) return;
    hintEl.textContent = text;
    hintEl.classList.toggle('hot', cls === 'hot');
    hintEl.classList.toggle('warn', cls === 'warn');
  }

  function syncPips() {
    if (!pipsEl) return;
    while (pips.length < LIFE_CAP) {
      const d = document.createElement('span');
      d.className = 'pip';
      pipsEl.appendChild(d);
      pips.push(d);
    }
    for (let i = 0; i < LIFE_CAP; i++) {
      pips[i].classList.toggle('on', i < G.lives);
      pips[i].classList.toggle('gone', G.mode !== 'title' && i >= G.lives && i < LIVES);
      pips[i].style.display = i < Math.max(LIVES, G.lives) ? '' : 'none';
    }
  }

  function setFill(el, wrap, v, lowCls) {
    if (el) el.style.transform = 'scaleX(' + clamp(v, 0, 1) + ')';
    if (wrap) wrap.classList.toggle(lowCls || 'low', v <= 0.28);
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(kindBest());
    if (stageLabel) {
      stageLabel.textContent = G.mode === 'title' ? '星火' : ('第 ' + G.wave + ' 波');
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.wave >= 5);
    }
    if (tagLabel) {
      let tag = isNet() ? '火网' : '巡航';
      if (G.mode === 'play' && G.lock.locked) tag = '锁定';
      if (G.mode === 'play' && G.warn > 0.2) tag = '来弹';
      if (G.overheat) tag = '过热';
      tagLabel.textContent = tag;
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || G.warn > 0.2 || G.overheat);
      tagLabel.classList.toggle('hot', G.lock.locked || G.combo >= 6);
    }
    setFill(shieldBar, shieldWrap, G.mode === 'title' ? 1 : G.shield / SHIELD, 'low');
    setFill(heatBar, heatWrap, G.heat / 100, 'hot');
    if (heatWrap) heatWrap.classList.toggle('hot', G.overheat || G.heat > 78);
    if (mslEl) {
      mslEl.textContent = '弹 ' + G.missiles;
      mslEl.classList.toggle('low', G.missiles <= 1);
    }
    if (btnMsl) btnMsl.classList.toggle('ready', !!(G.lock.locked && G.missiles > 0 && G.mode === 'play'));
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = G.mult >= 2 ? '连击 ×' + G.mult : '连击 ' + G.combo;
      } else comboEl.hidden = true;
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 护盾打空再中弹扣命', 'warn');
    else if (G.overheat) setHint('激光过热 · 等冷却', 'warn');
    else if (G.warn > 0.25) setHint('火球来了 · 侧移躲开', 'warn');
    else if (G.lock.locked) setHint('锁定 · Shift 导弹 / 空格激光', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 雷达找敌', 'warn');
    else if (G.combo >= 6) setHint('连击 ×' + G.mult + ' · 继续打', 'hot');
    else setHint('方向瞄准 · 空格激光 · Shift 锁定导弹', '');
    syncPips();
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'FIRE';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    const end = kind === 'lose' || kind === 'win';
    if (ovStart) ovStart.classList.toggle('gone', end);
    if (ovEnd) ovEnd.classList.toggle('gone', !end);
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function hitStop(t) {
    if (REDUCE) return;
    G.stop = Math.max(G.stop, t);
  }

  function kick(n) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, n);
    G.punch = 0.978;
    if (stageEl) {
      stageEl.classList.remove('hit');
      void stageEl.offsetWidth;
      stageEl.classList.add('hit');
      kickTok += 1;
      const tok = kickTok;
      setTimeout(function () {
        if (tok === kickTok) stageEl.classList.remove('hit');
      }, 140);
    }
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a);
    G.flashRgb = rgb;
  }

  function emit(n, spec) {
    const count = REDUCE ? Math.max(4, (n * 0.35) | 0) : n;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        r: rand(spec.r0, spec.r1),
        life: spec.life * rand(0.55, 1),
        max: spec.life,
        rgb: spec.rgb,
        g: spec.g == null ? 90 : spec.g
      });
    }
  }

  function burstAt(wx, wy, wz, n, rgb, sc) {
    const p = project(wx, wy, wz);
    if (!p) return;
    const k = sc || 1;
    emit((n * k) | 0, {
      x: p.x, y: p.y, j: 10 * k,
      vx0: -220 * k, vx1: 220 * k, vy0: -240 * k, vy1: 110 * k,
      r0: 1.4, r1: 5.2 * k, life: 0.46, rgb: rgb
    });
    rings.push({ x: p.x, y: p.y, r: 8, t: 0.42, rgb: rgb });
    sparks.push({
      x: p.x, y: p.y,
      vx: rand(-80, 80), vy: rand(-90, 40),
      life: 0.22, rgb: rgb
    });
  }

  function floatText(x, y, text, rgb) {
    floats.push({ x: x, y: y, vy: -38, t: 0, life: 0.7, text: text, rgb: rgb });
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 220; i++) {
      stars.push({
        x: hash2(i * 3 + 1) * WORLD,
        y: hash2(i * 3 + 2) * WORLD,
        z: hash2(i * 3 + 3) * WORLD,
        b: 0.35 + hash2(i + 40) * 0.65,
        rgb: hash2(i + 7) > 0.82 ? CYN : (hash2(i + 11) > 0.7 ? HOT : WHT)
      });
    }
  }

  function clearField() {
    enemies.length = 0;
    shots.length = 0;
    missiles.length = 0;
    balls.length = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    smears.length = 0;
    G.lock.ent = null;
    G.lock.t = 0;
    G.lock.locked = false;
  }

  function spawnAt(kind, dist, yawOff, pitOff) {
    const def = KINDS[kind];
    const yaw = G.yaw + yawOff;
    const pit = clamp(G.pitch + pitOff, -0.8, 0.8);
    const fx = Math.sin(yaw) * Math.cos(pit);
    const fy = Math.sin(pit);
    const fz = Math.cos(yaw) * Math.cos(pit);
    const e = {
      kind: kind,
      alive: true,
      hp: def.hp,
      hpMax: def.hp,
      x: wrap(G.px + fx * dist),
      y: wrap(G.py + fy * dist),
      z: wrap(G.pz + fz * dist),
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: yaw + Math.PI,
      pitch: -pit,
      bank: 0,
      fireT: rand(0.4, 1.6),
      phase: rand(0, TAU),
      flash: 0,
      lockable: def.lock,
      fx: 0,
      fy: 0,
      fz: dist
    };
    enemies.push(e);
    return e;
  }

  function wavePlan(n) {
    const k = isNet() ? 1.75 : 1;
    const fgt = Math.max(3, Math.round((3 + n * 0.85) * k));
    const int = n >= 2 ? Math.round((1 + (n - 2) * 0.7) * k) : 0;
    const gun = n >= 3 ? Math.round((1 + Math.floor((n - 3) / 2)) * (isNet() ? 1.4 : 1)) : 0;
    const cap = n > 0 && n % 4 === 0 ? 1 : 0;
    return { fgt: fgt, int: int, gun: gun, cap: cap };
  }

  function spawnWave(n, demo) {
    const p = demo ? { fgt: 4, int: 1, gun: 0, cap: 0 } : wavePlan(n);
    const kinds = [];
    for (let i = 0; i < p.fgt; i++) kinds.push('fgt');
    for (let i = 0; i < p.int; i++) kinds.push('int');
    for (let i = 0; i < p.gun; i++) kinds.push('gun');
    for (let i = 0; i < p.cap; i++) kinds.push('cap');
    for (let i = 0; i < kinds.length; i++) {
      const knd = kinds[i];
      const spread = knd === 'cap' ? 0.22 : 1.15;
      spawnAt(
        knd,
        knd === 'cap' ? rand(110, 150) : rand(68, 128),
        rand(-spread, spread) + (i - kinds.length * 0.5) * 0.18,
        rand(-0.32, 0.32)
      );
    }
    if (!demo && p.cap) {
      toast('战列来袭', false, true);
      cockpitMsg('战列', 1.4);
    }
  }

  function liveEnemies() {
    let n = 0;
    for (let i = 0; i < enemies.length; i++) if (enemies[i].alive) n += 1;
    return n;
  }

  function damageEnemy(e, dmg, src) {
    if (!e || !e.alive) return false;
    e.hp -= dmg;
    e.flash = 0.12;
    if (e.hp > 0) {
      const p = project(e.x, e.y, e.z);
      if (p) {
        burstAt(e.x, e.y, e.z, 8, KIND_RGB[e.kind], 0.55);
        const chip = (40 * G.mult) | 0;
        if (G.mode === 'play') {
          bumpScore(chip);
          floatText(p.x, p.y - 8, '+' + chip, GOLD);
        }
      }
      audio.hit(G.combo);
      hitStop(0.032);
      return false;
    }
    killEnemy(e, src);
    return true;
  }

  function killEnemy(e, src) {
    if (!e.alive) return;
    e.alive = false;
    const def = KINDS[e.kind];
    let pts = def.score;
    if (src === 'msl') pts = (pts * 2.1) | 0;
    pts = (pts * G.mult) | 0;
    const p = project(e.x, e.y, e.z);
    const rgb = KIND_RGB[e.kind];
    const big = e.kind === 'cap' || e.kind === 'gun';
    burstAt(e.x, e.y, e.z, big ? 28 : 16, rgb, big ? 1.45 : 1);
    if (p) {
      floatText(p.x, p.y - 12, '+' + pts, rgb);
      rings.push({ x: p.x, y: p.y, r: 12, t: 0.5, rgb: rgb });
    }
    if (G.lock.ent === e) {
      G.lock.ent = null;
      G.lock.locked = false;
      G.lock.t = 0;
    }
    if (G.mode === 'play') {
      noteCombo();
      bumpScore(pts);
      hitStop(big ? 0.072 : 0.046);
      kick(big ? 7 : 4.2);
      screenFlash(rgb, big ? 0.28 : 0.14);
      audio.hit(G.combo);
      audio.boom(big);
      cockpitMsg('打中了', 0.55);
    } else {
      audio.boom(false);
    }
  }

  function playerDie(why) {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const p = projCam({ x: 0, y: 0, z: 6 });
    emit(REDUCE ? 14 : 34, {
      x: p.x, y: p.y, j: 18,
      vx0: -240, vx1: 240, vy0: -260, vy1: 80,
      r0: 2, r1: 7, life: 0.62, rgb: FLM
    });
    rings.push({ x: p.x, y: p.y, r: 16, t: 0.55, rgb: MAG });
    screenFlash(MAG, 0.55);
    hitStop(0.08);
    kick(12);
    if (stageEl) {
      stageEl.classList.remove('die');
      void stageEl.offsetWidth;
      stageEl.classList.add('die');
    }
    audio.death();
    G.deadT = 0.95;
    G.why = why || '击坠';
    G.lives -= 1;
    G.shield = 0;
    breakCombo();
    G.lock.ent = null;
    G.lock.locked = false;
    balls.length = 0;
  }

  function playerHit(why, dmg) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    const hurt = dmg == null ? (isNet() ? 36 : 26) : dmg;
    if (G.shield > 0) {
      G.shield = Math.max(0, G.shield - hurt);
      burstAt(G.px, G.py, wrap(G.pz + 6), 10, CYN, 0.7);
      screenFlash(CYN, 0.22);
      kick(5);
      audio.warn();
      cockpitMsg('击中了', 0.5);
      if (G.shield <= 0) toast('护盾耗尽', true, false);
      G.invuln = 0.28;
      return;
    }
    playerDie(why);
  }

  function goLose() {
    G.mode = 'lose';
    audio.tickEngine();
    audio.lose();
    const why = G.why === '撞舰' ? '相撞了' : (G.why === '火球' ? '被击中了' : '舰毁了');
    showOverlay('lose', why, '第 ' + G.wave + ' 波 · ' + G.score + ' 分 · 最高 ' + kindBest());
    syncHud();
  }

  function startGame(kind) {
    G.mode = 'play';
    G.kind = kind === 'net' ? 'net' : 'cruise';
    G.wave = 1;
    G.t = 0;
    G.clock = 0;
    G.lives = LIVES;
    G.shield = SHIELD;
    G.heat = 0;
    G.overheat = false;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.next1up = LIFE_EVERY;
    G.missiles = isNet() ? 4 : 6;
    G.px = WORLD * 0.5;
    G.py = WORLD * 0.5;
    G.pz = WORLD * 0.42;
    G.yaw = 0;
    G.pitch = 0;
    G.bank = 0;
    G.spd = isNet() ? 40 : SPD_BASE;
    G.fireCd = 0;
    G.mslCd = 0;
    G.laserAir = 0;
    G.deadT = 0;
    G.invuln = 1.2;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.warn = 0;
    G.waveT = 0;
    G.why = '';
    G.msg = '';
    G.msgT = 0;
    G.fireHold = false;
    G.mslHold = false;
    clearField();
    hideOverlay();
    spawnWave(1, false);
    audio.start();
    toast(isNet() ? '火网 · 敌舰更密' : '巡航 · 按波推进', false, true);
    cockpitMsg('出击', 1.1);
    if (scoreEl) scoreEl.textContent = '0';
    if (bestEl) bestEl.textContent = String(kindBest());
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'cruise';
    G.wave = 1;
    G.lives = LIVES;
    G.shield = SHIELD;
    G.heat = 0;
    G.overheat = false;
    G.score = 0;
    G.combo = 0;
    G.mult = 1;
    G.missiles = 6;
    G.deadT = 0;
    G.invuln = 0;
    G.px = WORLD * 0.5;
    G.py = WORLD * 0.5;
    G.pz = WORLD * 0.4;
    G.yaw = 0.4;
    G.pitch = -0.04;
    G.spd = 18;
    clearField();
    spawnWave(1, true);
    showOverlay('title', '星火', '座舱里开火。激光打战机，锁定后导弹追击。雷达找敌，护盾打空再扣命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    audio.startEngine();
    if (G.mode === 'title') startGame('cruise');
    else startGame(G.kind || 'cruise');
  }

  function fireLaser() {
    if (!playing() || G.fireCd > 0) return;
    if (G.overheat) {
      audio.empty();
      return;
    }
    if (G.laserAir >= 2) return;
    G.fireCd = 0.16;
    G.heat = Math.min(100, G.heat + (isNet() ? 20 : 24));
    if (G.heat >= 100) {
      G.overheat = true;
      audio.overheat();
      toast('过热', true, false);
      cockpitMsg('过热', 0.8);
    }
    G.muzzle = 0.12;
    G.laserAir += 1;
    const lk = G.lock.locked ? G.lock.ent : null;
    const L = look();
    const origin = 4.2;
    shots.push({
      x: wrap(G.px + L.x * origin),
      y: wrap(G.py + L.y * origin),
      z: wrap(G.pz + L.z * origin),
      vx: L.x * LASER_V,
      vy: L.y * LASER_V,
      vz: L.z * LASER_V,
      life: 0.72,
      from: 'p',
      lock: lk && lk.alive ? lk : null
    });
    audio.laser();
  }

  function fireMissile() {
    if (!playing() || G.mslCd > 0) return;
    if (G.missiles <= 0) {
      audio.empty();
      toast('无弹', true, false);
      return;
    }
    if (!G.lock.locked || !G.lock.ent || !G.lock.ent.alive) {
      audio.empty();
      toast('未锁定', true, false);
      cockpitMsg('未锁定', 0.6);
      return;
    }
    G.mslCd = 0.32;
    G.missiles -= 1;
    const L = look();
    const e = G.lock.ent;
    missiles.push({
      x: wrap(G.px + L.x * 5),
      y: wrap(G.py + L.y * 5),
      z: wrap(G.pz + L.z * 5),
      vx: L.x * 48,
      vy: L.y * 48,
      vz: L.z * 48,
      life: 1.35,
      target: e,
      trail: []
    });
    hitStop(0.038);
    kick(3.2);
    audio.missile();
    cockpitMsg('导弹', 0.45);
  }

  function enemyFire(e) {
    const dx = wrapD(G.px - e.x);
    const dy = wrapD(G.py - e.y);
    const dz = wrapD(G.pz - e.z);
    const d = hypot3(dx, dy, dz) || 1;
    const lead = isNet() ? 0.22 : 0.12;
    const spd = BALL_V * (isNet() ? 1.18 : 1) * (e.kind === 'int' ? 1.12 : 1);
    balls.push({
      x: e.x,
      y: e.y,
      z: e.z,
      vx: (dx / d) * spd + G.sinY * G.spd * lead,
      vy: (dy / d) * spd + G.sinP * G.spd * lead,
      vz: (dz / d) * spd + G.cosY * G.spd * lead,
      life: 3.4
    });
    audio.enemyShot();
  }

  function updateLock(dt) {
    const need = isNet() ? 0.28 : 0.4;
    let best = null;
    let bestD = 58;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.alive || !e.lockable) continue;
      const c = camPoint(e.x, e.y, e.z);
      if (c.z < 8 || c.z > 92) continue;
      const p = projCam(c);
      const d = Math.abs(p.x - CX) + Math.abs(p.y - viewCy()) * 0.9;
      const slack = G.lock.locked && G.lock.ent === e ? 86 : 58;
      if (d < slack && d < bestD) {
        bestD = d;
        best = e;
      }
    }
    if (best !== G.lock.ent) {
      G.lock.ent = best;
      G.lock.t = 0;
      if (G.lock.locked) G.lock.locked = false;
    }
    if (!best) {
      G.lock.t = 0;
      G.lock.locked = false;
      return;
    }
    const c = camPoint(best.x, best.y, best.z);
    best.fx = c.x;
    best.fy = c.y;
    best.fz = c.z;
    if (G.lock.locked) {
      G.lock.hold -= dt;
      G.lock.beep -= dt;
      if (G.lock.beep <= 0) {
        G.lock.beep = 0.22;
        audio.lockHold();
      }
      if (G.lock.hold <= 0) {
        G.lock.locked = false;
        G.lock.t = need * 0.4;
      }
      return;
    }
    G.lock.t += dt;
    G.lock.beep -= dt;
    if (G.lock.beep <= 0) {
      G.lock.beep = 0.11;
      audio.lockTick(clamp(G.lock.t / need, 0, 1));
    }
    if (G.lock.t >= need) {
      G.lock.locked = true;
      G.lock.hold = 2.35;
      audio.lockOn();
      cockpitMsg('锁定!', 0.8);
      toast('锁定!', false, true);
    }
  }

  function updatePlayer(dt) {
    let yawIn = (keys.r ? 1 : 0) - (keys.l ? 1 : 0);
    let pitIn = (keys.u ? 1 : 0) - (keys.d ? 1 : 0);
    const ids = Object.keys(ptrs);
    for (let i = 0; i < ids.length; i++) {
      const p = ptrs[ids[i]];
      if (!p) continue;
      if (p.role === 'view' || p.role === 'fire') {
        yawIn = clamp(yawIn + (p.x - CX) / 210, -1.2, 1.2);
        pitIn = clamp(pitIn + (viewCy() - p.y) / 150, -1.2, 1.2);
      }
    }
    G.yawIn = yawIn;
    G.pitchIn = pitIn;
    const lockSlow = G.lock.locked ? 0.55 : 1;
    G.yaw = wrapAng(G.yaw + yawIn * YAW_SPD * lockSlow * dt);
    G.pitch = clamp(G.pitch + pitIn * PITCH_SPD * lockSlow * dt, PITCH_MIN, PITCH_MAX);
    G.bank = lerp(G.bank, yawIn * 0.28, clamp(dt * 7, 0, 1));
    syncTrig();
    const L = look();
    G.px = wrap(G.px + L.x * G.spd * dt);
    G.py = wrap(G.py + L.y * G.spd * dt);
    G.pz = wrap(G.pz + L.z * G.spd * dt);
    if (G.fireHold) fireLaser();
    if (G.mslHold) fireMissile();
    if (G.overheat) {
      G.heat = Math.max(0, G.heat - 48 * dt);
      if (G.heat <= 32) G.overheat = false;
    } else {
      G.heat = Math.max(0, G.heat - 36 * dt);
    }
  }

  function updateEnemies(dt) {
    G.contacts = 0;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.alive) continue;
      e.phase += dt;
      e.flash = Math.max(0, e.flash - dt);
      const def = KINDS[e.kind];
      const dx = wrapD(G.px - e.x);
      const dy = wrapD(G.py - e.y);
      const dz = wrapD(G.pz - e.z);
      const dist = hypot3(dx, dy, dz) || 1;
      const c = camPoint(e.x, e.y, e.z);
      if (c.z > 0 && dist < RADAR_RANGE) G.contacts += 1;

      const frozen = G.lock.locked && G.lock.ent === e;
      if (frozen) {
        e.fz = Math.max(14, e.fz - dt * 3.2);
        const w = fromCam(e.fx * 0.15, e.fy * 0.15, e.fz);
        e.x = w.x;
        e.y = w.y;
        e.z = w.z;
        e.bank = Math.sin(e.phase * 6) * 0.12;
      } else {
        const weave = e.kind === 'int' ? 16 : (e.kind === 'fgt' ? 9 : 4);
        const want = e.kind === 'cap' ? 78 : (e.kind === 'gun' ? 48 : 32);
        const toward = dist > want + 8 ? 1 : (dist < want - 10 ? -0.7 : 0.15);
        const ux = dx / dist;
        const uy = dy / dist;
        const uz = dz / dist;
        const spd = def.spd * (isNet() ? 1.18 : 1) * (G.mode === 'title' ? 0.55 : 1);
        const wx = Math.sin(e.phase * 2.2) * weave;
        const wy = Math.cos(e.phase * 1.7) * weave * 0.6;
        e.vx = ux * spd * toward + wx;
        e.vy = uy * spd * toward + wy;
        e.vz = uz * spd * toward;
        e.x = wrap(e.x + e.vx * dt);
        e.y = wrap(e.y + e.vy * dt);
        e.z = wrap(e.z + e.vz * dt);
        e.bank = lerp(e.bank, wx * 0.03, dt * 4);
        if (dist > 200) {
          const L = look();
          const nd = rand(80, 120);
          e.x = wrap(G.px + L.x * nd + rand(-30, 30));
          e.y = wrap(G.py + L.y * nd + rand(-18, 18));
          e.z = wrap(G.pz + L.z * nd + rand(-30, 30));
        }
      }

      if (G.mode === 'title') {
        if (dist < 10) {
          e.alive = false;
          burstAt(e.x, e.y, e.z, 12, KIND_RGB[e.kind], 0.8);
          audio.boom(false);
        }
        continue;
      }

      if (playing() && G.invuln <= 0 && dist < def.rad + 2.4) {
        playerHit('撞舰', e.kind === 'cap' ? 80 : 50);
        if (e.kind === 'fgt' || e.kind === 'int') killEnemy(e, 'ram');
      }

      e.fireT -= dt;
      if (playing() && e.fireT <= 0 && dist > 14 && dist < 92 && c.z > 6) {
        const shotsN = e.kind === 'cap' ? (isNet() ? 3 : 2) : (e.kind === 'gun' ? 2 : 1);
        for (let s = 0; s < shotsN; s++) enemyFire(e);
        e.fireT = def.fire * rand(0.72, 1.25) / (isNet() ? 1.4 : 1) / (1 + (G.wave - 1) * 0.06);
      }
    }
    let w = 0;
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].alive) enemies[w++] = enemies[i];
    }
    enemies.length = w;
  }

  function shotHits(s, e) {
    const r = (KINDS[e.kind] ? KINDS[e.kind].rad : 2.2) + 1.5;
    return dist3(s.x, s.y, s.z, e.x, e.y, e.z) < r;
  }

  function updateShots(dt) {
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      if (!s.alive && s.alive !== undefined) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.dead = true;
        if (s.from === 'p') {
          G.laserAir = Math.max(0, G.laserAir - 1);
          if (G.mode === 'play') audio.miss();
        }
        continue;
      }
      if (s.lock && s.lock.alive) {
        const dx = wrapD(s.lock.x - s.x);
        const dy = wrapD(s.lock.y - s.y);
        const dz = wrapD(s.lock.z - s.z);
        const d = hypot3(dx, dy, dz) || 1;
        s.vx = lerp(s.vx, (dx / d) * LASER_V, 0.35);
        s.vy = lerp(s.vy, (dy / d) * LASER_V, 0.35);
        s.vz = lerp(s.vz, (dz / d) * LASER_V, 0.35);
      }
      s.x = wrap(s.x + s.vx * dt);
      s.y = wrap(s.y + s.vy * dt);
      s.z = wrap(s.z + s.vz * dt);
      if (s.from === 'p') {
        let hit = false;
        for (let j = 0; j < enemies.length; j++) {
          const e = enemies[j];
          if (!e.alive) continue;
          if (shotHits(s, e)) {
            s.dead = true;
            G.laserAir = Math.max(0, G.laserAir - 1);
            damageEnemy(e, e.kind === 'cap' ? 1 : (e.kind === 'gun' ? 1 : 1), 'laser');
            hit = true;
            break;
          }
        }
        if (hit) continue;
        for (let j = 0; j < balls.length; j++) {
          const b = balls[j];
          if (b.dead) continue;
          if (dist3(s.x, s.y, s.z, b.x, b.y, b.z) < 2.4) {
            b.dead = true;
            s.dead = true;
            G.laserAir = Math.max(0, G.laserAir - 1);
            const p = project(b.x, b.y, b.z);
            burstAt(b.x, b.y, b.z, 8, GOLD, 0.5);
            if (G.mode === 'play') {
              const pts = (80 * G.mult) | 0;
              noteCombo();
              bumpScore(pts);
              if (p) floatText(p.x, p.y, '+' + pts, GOLD);
              hitStop(0.03);
              audio.hit(G.combo);
            }
            break;
          }
        }
      }
    }
    let w = 0;
    for (let i = 0; i < shots.length; i++) {
      if (!shots[i].dead) shots[w++] = shots[i];
    }
    shots.length = w;
  }

  function updateMissiles(dt) {
    for (let i = 0; i < missiles.length; i++) {
      const m = missiles[i];
      m.life -= dt;
      if (m.life <= 0) {
        m.dead = true;
        continue;
      }
      const e = m.target && m.target.alive ? m.target : null;
      if (e) {
        const dx = wrapD(e.x - m.x);
        const dy = wrapD(e.y - m.y);
        const dz = wrapD(e.z - m.z);
        const d = hypot3(dx, dy, dz) || 1;
        const spd = 92;
        m.vx = lerp(m.vx, (dx / d) * spd, 0.18);
        m.vy = lerp(m.vy, (dy / d) * spd, 0.18);
        m.vz = lerp(m.vz, (dz / d) * spd, 0.18);
        if (d < KINDS[e.kind].rad + 2.2) {
          m.dead = true;
          damageEnemy(e, 4, 'msl');
          continue;
        }
      }
      m.x = wrap(m.x + m.vx * dt);
      m.y = wrap(m.y + m.vy * dt);
      m.z = wrap(m.z + m.vz * dt);
      m.trail.push({ x: m.x, y: m.y, z: m.z });
      if (m.trail.length > 10) m.trail.shift();
    }
    let w = 0;
    for (let i = 0; i < missiles.length; i++) {
      if (!missiles[i].dead) missiles[w++] = missiles[i];
    }
    missiles.length = w;
  }

  function updateBalls(dt) {
    G.warn = Math.max(0, G.warn - dt);
    for (let i = 0; i < balls.length; i++) {
      const b = balls[i];
      b.life -= dt;
      if (b.life <= 0) {
        b.dead = true;
        continue;
      }
      b.x = wrap(b.x + b.vx * dt);
      b.y = wrap(b.y + b.vy * dt);
      b.z = wrap(b.z + b.vz * dt);
      const d = dist3(b.x, b.y, b.z, G.px, G.py, G.pz);
      const c = camPoint(b.x, b.y, b.z);
      if (c.z > 0 && d < 42) {
        G.warn = Math.max(G.warn, clamp((42 - d) / 42, 0, 1));
      }
      if (playing() && G.invuln <= 0 && d < 2.6) {
        b.dead = true;
        burstAt(b.x, b.y, b.z, 10, MAG, 0.7);
        playerHit('火球');
      }
    }
    if (G.warn > 0.35) {
      G.warnBeep -= dt;
      if (G.warnBeep <= 0) {
        G.warnBeep = 0.42;
        audio.warn();
      }
    }
    let w = 0;
    for (let i = 0; i < balls.length; i++) {
      if (!balls[i].dead) balls[w++] = balls[i];
    }
    balls.length = w;
  }

  function updateFx(dt) {
    G.muzzle = Math.max(0, G.muzzle - dt * 2.4);
    G.flash = Math.max(0, G.flash - dt * 2.8);
    G.shake = Math.max(0, G.shake - dt * 18);
    G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
    G.msgT = Math.max(0, G.msgT - dt);
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].life -= dt;
      sparks[i].x += sparks[i].vx * dt;
      sparks[i].y += sparks[i].vy * dt;
      if (sparks[i].life <= 0) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t -= dt;
      rings[i].r += dt * 90;
      if (rings[i].t <= 0) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += f.vy * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    if (!REDUCE && G.mode !== 'lose') {
      if (smears.length < 18 && Math.random() < 0.5) {
        smears.push({
          x: rand(40, VW - 40),
          y: rand(VIEW_TOP, dashY()),
          life: 0.22,
          v: 220 + G.spd * 4
        });
      }
      for (let i = smears.length - 1; i >= 0; i--) {
        smears[i].life -= dt;
        smears[i].y += smears[i].v * dt * 0.15;
        if (smears[i].life <= 0) smears.splice(i, 1);
      }
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    syncTrig();
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.mslCd > 0) G.mslCd -= dt;
    if (G.toastT > 0) G.toastT -= dt;
    audio.tickEngine();
    updateFx(dt);
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.mode === 'title') {
      G.yaw = wrapAng(G.yaw + dt * 0.18);
      G.pitch = Math.sin(G.clock * 0.32) * 0.08;
      syncTrig();
      G.bank = lerp(G.bank, 0.1, dt * 2);
      const L = look();
      G.px = wrap(G.px + L.x * 10 * dt);
      G.py = wrap(G.py + L.y * 10 * dt);
      G.pz = wrap(G.pz + L.z * 10 * dt);
      updateEnemies(dt);
      if (liveEnemies() < 3) spawnWave(1, true);
      return;
    }
    if (G.mode !== 'play') return;
    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnemies(dt);
      updateShots(dt);
      updateMissiles(dt);
      updateBalls(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) {
          goLose();
          return;
        }
        G.shield = SHIELD;
        G.invuln = 1.45;
        G.heat = 0;
        G.overheat = false;
        toast('重启', false, true);
      }
      return;
    }
    if (G.invuln > 0) G.invuln -= dt;
    updatePlayer(dt);
    updateLock(dt);
    updateEnemies(dt);
    updateShots(dt);
    updateMissiles(dt);
    updateBalls(dt);
    if (G.waveT > 0) {
      G.waveT -= dt;
      if (G.waveT <= 0) {
        G.wave += 1;
        spawnWave(G.wave, false);
        G.missiles = Math.min(14, G.missiles + (isNet() ? 2 : 3));
        audio.wave();
        toast('第 ' + G.wave + ' 波 · 加速', false, true);
        cockpitMsg('第 ' + G.wave + ' 波', 1.1);
        bumpScore(400 * (G.wave - 1));
      }
    } else if (liveEnemies() === 0) {
      G.waveT = 1.15;
    }
  }

  function windowPath() {
    const top = VIEW_TOP;
    const bot = dashY();
    ctx.beginPath();
    ctx.moveTo(40, top);
    ctx.lineTo(VW - 40, top);
    ctx.lineTo(VW - 10, bot);
    ctx.lineTo(10, bot);
    ctx.closePath();
  }

  function vline(x0, y0, x1, y1, rgb, a, w) {
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = w || 1.2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  function drawHex(x, y, r, rot, rgb, a, w) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const ang = rot + i * TAU / 6;
      const px = x + Math.cos(ang) * r;
      const py = y + Math.sin(ang) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = w || 1.3;
    ctx.stroke();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, dashY());
    g.addColorStop(0, '#100406');
    g.addColorStop(0.45, '#18080a');
    g.addColorStop(1, '#080204');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const neb = wrapAng(0.9 - G.yaw);
    if (Math.abs(neb) < 1.4) {
      const nx = CX + FOCAL * Math.tan(neb) * 0.55;
      const ny = viewCy() - FOCAL * Math.tan(0.12 - G.pitch) * 0.4;
      const ng = ctx.createRadialGradient(nx, ny, 10, nx, ny, 220);
      ng.addColorStop(0, 'rgba(255,90,32,0.16)');
      ng.addColorStop(0.45, 'rgba(255,61,184,0.07)');
      ng.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, VW, dashY());
    }

    const sunA = wrapAng(-0.7 - G.yaw);
    if (Math.abs(sunA) < 1.15) {
      const sxv = CX + FOCAL * Math.tan(sunA);
      const syv = viewCy() - FOCAL * Math.tan(0.22 - G.pitch);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(sxv, syv, 26, 0, TAU);
      ctx.fillStyle = rgba(HOT, 0.18);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sxv, syv, 8, 0, TAU);
      ctx.fillStyle = rgba(GOLD, 0.75);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const c = camPoint(s.x, s.y, s.z);
      if (c.z < 4) continue;
      const p = projCam(c);
      if (p.x < -20 || p.x > VW + 20 || p.y < -20 || p.y > dashY() + 20) continue;
      const a = clamp(s.b * (1.1 - c.z / 240), 0.12, 0.95);
      ctx.fillStyle = rgba(s.rgb, a);
      const r = c.z < 40 ? 1.6 : 1.05;
      ctx.fillRect(p.x, p.y, r, r);
    }
  }

  function drawSmears() {
    if (REDUCE) return;
    for (let i = 0; i < smears.length; i++) {
      const s = smears[i];
      ctx.strokeStyle = rgba(WHT, clamp(s.life * 2.2, 0, 0.22));
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 14);
      ctx.lineTo(s.x, s.y + 22);
      ctx.stroke();
    }
  }

  function drawTieShip(p, e) {
    const s = clamp(p.s * 0.12, 3, 52);
    const rgb = e.flash > 0 ? WHT : KIND_RGB[e.kind];
    const a = clamp(1.15 - p.z / 110, 0.4, 1);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(e.bank);
    drawHex(-s * 1.55, 0, s * 0.74, 0, rgb, a, 1.5);
    drawHex(s * 1.55, 0, s * 0.74, 0, rgb, a, 1.5);
    ctx.fillStyle = rgba(mix(rgb, WHT, 0.25), a * 0.35);
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.34, 0, TAU);
    ctx.fill();
    drawHex(0, 0, s * 0.34, TAU / 12, GOLD, a, 1.2);
    vline(-s * 0.92, 0, -s * 0.34, 0, rgb, a, 1.2);
    vline(s * 0.34, 0, s * 0.92, 0, rgb, a, 1.2);
    ctx.restore();
  }

  function drawGunShip(p, e) {
    const s = clamp(p.s * 0.14, 4, 64);
    const rgb = e.flash > 0 ? WHT : GOLD;
    const a = clamp(1.1 - p.z / 120, 0.4, 1);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(e.bank * 0.5);
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-s * 1.1, -s * 0.38, s * 2.2, s * 0.76);
    ctx.strokeRect(-s * 1.6, -s * 0.18, s * 0.5, s * 0.36);
    ctx.strokeRect(s * 1.1, -s * 0.18, s * 0.5, s * 0.36);
    ctx.fillStyle = rgba(HOT, a * 0.7);
    ctx.fillRect(-s * 0.2, -s * 0.16, s * 0.4, s * 0.32);
    ctx.restore();
  }

  function drawCapShip(p, e) {
    const s = clamp(p.s * 0.22, 8, 120);
    const rgb = e.flash > 0 ? WHT : MAG;
    const a = clamp(1.05 - p.z / 140, 0.45, 1);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(e.bank * 0.25);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.15);
    ctx.lineTo(s * 1.8, s * 0.55);
    ctx.lineTo(0, s * 0.22);
    ctx.lineTo(-s * 1.8, s * 0.55);
    ctx.closePath();
    ctx.strokeStyle = rgba(rgb, a);
    ctx.lineWidth = 1.8;
    ctx.stroke();
    ctx.fillStyle = rgba(rgb, a * 0.12);
    ctx.fill();
    vline(-s * 0.9, s * 0.12, s * 0.9, s * 0.12, HOT, a * 0.8, 1.2);
    ctx.fillStyle = rgba(GOLD, a * 0.8);
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.08, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemy(e) {
    const p = project(e.x, e.y, e.z);
    if (!p) return;
    if (e.kind === 'cap') drawCapShip(p, e);
    else if (e.kind === 'gun') drawGunShip(p, e);
    else drawTieShip(p, e);
    if (e.hp < e.hpMax && e.hpMax > 1) {
      const w = 22 + p.s * 0.04;
      ctx.fillStyle = rgba(WHT, 0.16);
      ctx.fillRect(p.x - w * 0.5, p.y - 18 - p.s * 0.04, w, 3);
      ctx.fillStyle = rgba(HOT, 0.85);
      ctx.fillRect(p.x - w * 0.5, p.y - 18 - p.s * 0.04, w * (e.hp / e.hpMax), 3);
    }
  }

  function drawShot(s) {
    const p = project(s.x, s.y, s.z);
    if (!p) return;
    const L = look();
    const q = project(s.x - L.x * 3.2, s.y - L.y * 3.2, s.z - L.z * 3.2);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(GOLD, 0.95);
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    if (q) ctx.lineTo(q.x, q.y);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawMissile(m) {
    const p = project(m.x, m.y, m.z);
    if (!p) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(FLM, 1);
    ctx.beginPath();
    ctx.arc(p.x, p.y, clamp(p.s * 0.03, 2, 8), 0, TAU);
    ctx.fill();
    ctx.strokeStyle = rgba(GOLD, 0.55);
    ctx.lineWidth = 2;
    ctx.beginPath();
    let pen = false;
    for (let i = 0; i < m.trail.length; i++) {
      const t = project(m.trail[i].x, m.trail[i].y, m.trail[i].z);
      if (!t) {
        pen = false;
        continue;
      }
      if (!pen) {
        ctx.moveTo(t.x, t.y);
        pen = true;
      } else ctx.lineTo(t.x, t.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawBall(b) {
    const p = project(b.x, b.y, b.z);
    if (!p) return;
    const r = clamp(p.s * 0.045, 2.2, 12);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(WHT, 0.9);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.45, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(FLM, 0.45);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawLasersX() {
    if (G.muzzle <= 0 || G.deadT > 0) return;
    const a = clamp(G.muzzle / 0.12, 0, 1);
    const cy = viewCy();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(GOLD, 0.4 + a * 0.55);
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(48, VIEW_TOP + 8);
    ctx.lineTo(CX, cy);
    ctx.moveTo(VW - 48, VIEW_TOP + 8);
    ctx.lineTo(CX, cy);
    ctx.moveTo(18, dashY() - 8);
    ctx.lineTo(CX, cy);
    ctx.moveTo(VW - 18, dashY() - 8);
    ctx.lineTo(CX, cy);
    ctx.stroke();
    ctx.strokeStyle = rgba(HOT, 0.55 * a);
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(48, VIEW_TOP + 8);
    ctx.lineTo(CX, cy);
    ctx.moveTo(VW - 48, VIEW_TOP + 8);
    ctx.lineTo(CX, cy);
    ctx.moveTo(18, dashY() - 8);
    ctx.lineTo(CX, cy);
    ctx.moveTo(VW - 18, dashY() - 8);
    ctx.lineTo(CX, cy);
    ctx.stroke();
    ctx.fillStyle = rgba(WHT, 0.55 * a);
    ctx.beginPath();
    ctx.arc(CX, cy, 5, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawSight() {
    const cy = viewCy();
    const locked = G.lock.locked;
    const rgb = locked ? MAG : CYN;
    vline(CX - 16, cy, CX - 5, cy, rgb, 0.85, 1.4);
    vline(CX + 5, cy, CX + 16, cy, rgb, 0.85, 1.4);
    vline(CX, cy - 16, CX, cy - 5, rgb, 0.85, 1.4);
    vline(CX, cy + 5, CX, cy + 16, rgb, 0.85, 1.4);
    ctx.strokeStyle = rgba(rgb, 0.28);
    ctx.lineWidth = 1;
    ctx.strokeRect(CX - 28, cy - 20, 56, 40);

    const e = G.lock.ent;
    if (e && e.alive) {
      const p = project(e.x, e.y, e.z);
      if (p) {
        const need = isNet() ? 0.28 : 0.4;
        const k = locked ? 1 : clamp(G.lock.t / need, 0, 1);
        const sz = lerp(30, 14, k) + p.s * 0.03;
        ctx.strokeStyle = rgba(locked ? MAG : CYN, 0.4 + k * 0.6);
        ctx.lineWidth = locked ? 2.3 : 1.4;
        ctx.strokeRect(p.x - sz, p.y - sz, sz * 2, sz * 2);
        vline(p.x - sz - 4, p.y, p.x - sz + 6, p.y, locked ? MAG : CYN, 0.8, 1.3);
        vline(p.x + sz - 6, p.y, p.x + sz + 4, p.y, locked ? MAG : CYN, 0.8, 1.3);
        vline(p.x, p.y - sz - 4, p.x, p.y - sz + 6, locked ? MAG : CYN, 0.8, 1.3);
        vline(p.x, p.y + sz - 6, p.x, p.y + sz + 4, locked ? MAG : CYN, 0.8, 1.3);
        if (locked) {
          ctx.fillStyle = rgba(MAG, 0.92);
          ctx.font = 'bold 12px "Segoe UI","PingFang SC",sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('锁定', p.x, p.y - sz - 7);
        }
      }
    }
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      ctx.fillStyle = rgba(p.rgb, clamp(p.life / (p.max || 0.4), 0, 1));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const p = sparks[i];
      ctx.strokeStyle = rgba(p.rgb, clamp(p.life * 4, 0, 1));
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
      ctx.stroke();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, clamp(r.t * 2.1, 0, 0.8));
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.globalAlpha = clamp(1 - f.t / f.life, 0, 1);
      ctx.fillStyle = rgba(f.rgb, 1);
      ctx.font = 'bold 16px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
  }

  function drawFrame() {
    ctx.save();
    windowPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = rgba(HOT, 0.7);
    ctx.stroke();
    ctx.restore();
    vline(40, VIEW_TOP, 10, dashY(), HOT, 0.55, 2);
    vline(VW - 40, VIEW_TOP, VW - 10, dashY(), HOT, 0.55, 2);
    vline(40, VIEW_TOP, VW - 40, VIEW_TOP, HOT, 0.45, 2);
    const ribs = [0.22, 0.5, 0.78];
    for (let i = 0; i < ribs.length; i++) {
      const x0 = lerp(40, VW - 40, ribs[i]);
      const x1 = lerp(10, VW - 10, ribs[i]);
      vline(x0, VIEW_TOP, x1, dashY(), HOT, 0.12, 1);
    }
  }

  function radC() {
    return { x: CX, y: VH - 54, r: 42 };
  }

  function drawRadar() {
    const rc = radC();
    ctx.save();
    ctx.beginPath();
    ctx.arc(rc.x, rc.y, rc.r, 0, TAU);
    ctx.fillStyle = 'rgba(8,2,2,0.72)';
    ctx.fill();
    ctx.strokeStyle = rgba(HOT, 0.65);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rc.x, rc.y, rc.r * 0.55, 0, TAU);
    ctx.strokeStyle = rgba(HOT, 0.22);
    ctx.stroke();
    vline(rc.x - rc.r, rc.y, rc.x + rc.r, rc.y, HOT, 0.18, 1);
    vline(rc.x, rc.y - rc.r, rc.x, rc.y + rc.r, HOT, 0.18, 1);
    const sweep = G.clock * 1.7;
    ctx.strokeStyle = rgba(GOLD, 0.35);
    ctx.beginPath();
    ctx.moveTo(rc.x, rc.y);
    ctx.lineTo(rc.x + Math.cos(sweep) * rc.r, rc.y + Math.sin(sweep) * rc.r);
    ctx.stroke();
    ctx.fillStyle = rgba(CYN, 0.9);
    ctx.beginPath();
    ctx.moveTo(rc.x, rc.y - 5);
    ctx.lineTo(rc.x - 3.2, rc.y + 3);
    ctx.lineTo(rc.x + 3.2, rc.y + 3);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e.alive) continue;
      const dx = wrapD(e.x - G.px);
      const dy = wrapD(e.y - G.py);
      const dz = wrapD(e.z - G.pz);
      const rx = dx * G.cosY - dz * G.sinY;
      const rz = dx * G.sinY + dz * G.cosY;
      const d = Math.sqrt(rx * rx + rz * rz);
      if (d > RADAR_RANGE) continue;
      const k = rc.r * 0.9 * (d / RADAR_RANGE);
      const ang = Math.atan2(rx, rz);
      const px = rc.x + Math.sin(ang) * k;
      const py = rc.y - Math.cos(ang) * k;
      const rgb = KIND_RGB[e.kind];
      ctx.fillStyle = rgba(rgb, 0.95);
      const sz = e.kind === 'cap' ? 3.2 : 2.1;
      ctx.fillRect(px - sz * 0.5, py - sz * 0.5, sz, sz);
      if (dy > 6) {
        ctx.beginPath();
        ctx.moveTo(px, py - 5);
        ctx.lineTo(px - 2, py - 2);
        ctx.lineTo(px + 2, py - 2);
        ctx.fill();
      } else if (dy < -6) {
        ctx.beginPath();
        ctx.moveTo(px, py + 5);
        ctx.lineTo(px - 2, py + 2);
        ctx.lineTo(px + 2, py + 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawDash() {
    ctx.fillStyle = '#120604';
    ctx.fillRect(0, dashY(), VW, DASH);
    const g = ctx.createLinearGradient(0, dashY(), 0, VH);
    g.addColorStop(0, 'rgba(255,90,32,0.16)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, dashY(), VW, 10);
    vline(0, dashY(), VW, dashY(), HOT, 0.55, 1.6);

    drawRadar();

    ctx.fillStyle = rgba(ORG, 0.85);
    ctx.font = '11px "Segoe UI","PingFang SC",sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(G.lock.locked ? 'LOCK' : (G.overheat ? 'HEAT' : 'RDY'), 28, dashY() + 22);
    ctx.fillStyle = rgba(WHT, 0.55);
    ctx.fillText('波 ' + (G.mode === 'title' ? '—' : G.wave), 28, dashY() + 40);
    ctx.fillText('敌 ' + G.contacts, 28, dashY() + 56);

    ctx.textAlign = 'right';
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillText('MSL ' + G.missiles, VW - 28, dashY() + 22);
    ctx.fillStyle = rgba(G.heat > 78 ? MAG : GOLD, 0.85);
    ctx.fillText('HEAT ' + (G.heat | 0), VW - 28, dashY() + 40);
    ctx.fillStyle = rgba(G.shield < 28 ? MAG : CYN, 0.85);
    ctx.fillText('SHLD ' + (G.shield | 0), VW - 28, dashY() + 56);

    if (G.msgT > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(G.lock.locked ? MAG : GOLD, 0.9);
      ctx.font = 'bold 16px "Segoe UI","PingFang SC",sans-serif';
      ctx.fillText(G.msg, CX, dashY() + 22);
    }

    if (COARSE) {
      ctx.strokeStyle = rgba(HOT, 0.45);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(86, VH - 56, 34, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(VW - 86, VH - 56, 28, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(WHT, 0.45);
      ctx.font = '10px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('瞄准', 86, VH - 52);
      ctx.fillText('开火', VW - 86, VH - 52);
    }
  }

  function drawHudCanvas() {
    if (G.mode === 'play' && G.warn > 0.18) {
      const a = 0.08 + G.warn * 0.22 + Math.sin(G.t * 16) * 0.05;
      ctx.fillStyle = rgba(MAG, a);
      ctx.fillRect(0, 0, VW, 7);
      ctx.fillRect(0, VH - 7, VW, 7);
      ctx.fillRect(0, 0, 7, VH);
      ctx.fillRect(VW - 7, 0, 7, VH);
      ctx.fillStyle = rgba(MAG, 0.85);
      ctx.font = 'bold 15px "Segoe UI","PingFang SC",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('火球  INCOMING', CX, 34);
    }
    if (G.deadT > 0) {
      ctx.fillStyle = rgba(HOT, 0.12 + (1 - G.deadT / 0.95) * 0.2);
      ctx.fillRect(0, 0, VW, VH);
    }
    if (G.invuln > 0 && G.mode === 'play' && ((G.t * 16) | 0) % 2 === 0) {
      ctx.strokeStyle = rgba(CYN, 0.35);
      ctx.lineWidth = 3;
      ctx.strokeRect(8, 8, VW - 16, VH - 16);
    }
  }

  function draw() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const pw = stageEl ? stageEl.clientWidth : 800;
    const ph = stageEl ? stageEl.clientHeight : 450;
    if (pw !== W || ph !== H || canvas.width !== (pw * dpr | 0)) resize();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0c0504';
    ctx.fillRect(0, 0, W, H);

    const shx = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake : 0;
    const shy = G.shake > 0 && !REDUCE ? (Math.random() - 0.5) * G.shake * 0.55 : 0;
    ctx.save();
    ctx.translate(ox + shx, oy + shy);
    ctx.scale(scale * G.punch, scale * G.punch);
    if (G.punch !== 1) {
      ctx.translate(CX * (1 / G.punch - 1) * 0.5, VH * (1 / G.punch - 1) * 0.5);
    }
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    ctx.save();
    windowPath();
    ctx.clip();
    const cy = viewCy();
    ctx.save();
    ctx.translate(CX, cy);
    if (!REDUCE) ctx.rotate(G.bank * 0.35);
    ctx.translate(-CX, -cy);
    drawSky();
    drawStars();
    drawSmears();

    const list = [];
    for (let i = 0; i < enemies.length; i++) {
      if (enemies[i].alive) list.push({ z: camPoint(enemies[i].x, enemies[i].y, enemies[i].z).z, k: 'e', i: i });
    }
    for (let i = 0; i < shots.length; i++) {
      list.push({ z: camPoint(shots[i].x, shots[i].y, shots[i].z).z, k: 's', i: i });
    }
    for (let i = 0; i < missiles.length; i++) {
      list.push({ z: camPoint(missiles[i].x, missiles[i].y, missiles[i].z).z, k: 'm', i: i });
    }
    for (let i = 0; i < balls.length; i++) {
      list.push({ z: camPoint(balls[i].x, balls[i].y, balls[i].z).z, k: 'b', i: i });
    }
    list.sort(function (a, b) { return b.z - a.z; });
    for (let i = 0; i < list.length; i++) {
      const it = list[i];
      if (it.z < NEAR) continue;
      if (it.k === 'e') drawEnemy(enemies[it.i]);
      else if (it.k === 's') drawShot(shots[it.i]);
      else if (it.k === 'm') drawMissile(missiles[it.i]);
      else drawBall(balls[it.i]);
    }
    drawLasersX();
    drawFx();
    ctx.restore();
    if (G.deadT <= 0) drawSight();
    ctx.restore();

    drawFrame();
    drawDash();
    drawHudCanvas();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.48);
      ctx.fillRect(0, 0, VW, VH);
    }
    ctx.restore();
  }

  function resize() {
    if (!stageEl || !canvas) return;
    W = Math.max(1, stageEl.clientWidth);
    H = Math.max(1, stageEl.clientHeight);
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = (W * dpr) | 0;
    canvas.height = (H * dpr) | 0;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    scale = Math.min(W / VW, H / VH);
    ox = (W - VW * scale) * 0.5;
    oy = (H - VH * scale) * 0.5;
  }

  function eventToVirtual(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left - ox) / scale;
    const y = (e.clientY - r.top - oy) / scale;
    return { x: x, y: y };
  }

  function classifyPtr(x, y) {
    if (COARSE) {
      const dx = x - 86;
      const dy = y - (VH - 56);
      if (dx * dx + dy * dy < 40 * 40) return 'view';
      const fx = x - (VW - 86);
      const fy = y - (VH - 56);
      if (fx * fx + fy * fy < 34 * 34) return 'fire';
    }
    if (y > dashY() + 8) {
      if (x < VW * 0.38) return 'view';
      if (x > VW * 0.62) return 'fire';
      return 'radar';
    }
    return 'view';
  }

  function primaryAction() {
    audio.ensure();
    audio.startEngine();
    if (G.mode === 'title') {
      startGame('cruise');
      return;
    }
    if (G.mode === 'lose') startGame(G.kind);
  }

  function onKey(e, down) {
    const k = e.key;
    const space = k === ' ' || k === 'Spacebar' || k === 'Space';
    if (k === 'ArrowLeft' || k === 'Left' || k === 'a' || k === 'A') {
      keys.l = down;
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowRight' || k === 'Right' || k === 'd' || k === 'D') {
      keys.r = down;
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowUp' || k === 'Up' || k === 'w' || k === 'W') {
      keys.u = down;
      if (down) e.preventDefault();
      return;
    }
    if (k === 'ArrowDown' || k === 'Down' || k === 's' || k === 'S') {
      keys.d = down;
      if (down) e.preventDefault();
      return;
    }
    if (space || k === 'Shift' || k === 'z' || k === 'Z') {
      if (down) e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      if (k === 'Shift' || k === 'z' || k === 'Z') G.mslHold = false;
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
    if (k === '1' && G.mode === 'title') {
      startGame('cruise');
      return;
    }
    if (k === '2' && G.mode === 'title') {
      startGame('net');
      return;
    }
    if (k === 'Shift' || k === 'z' || k === 'Z') {
      if (G.mode === 'play' && !overlayOpen()) {
        G.mslHold = true;
        fireMissile();
      }
      return;
    }
    if (space || k === 'Enter') {
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play') {
        G.fireHold = true;
        fireLaser();
      }
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      audio.startEngine();
      e.preventDefault();
      const v = eventToVirtual(e);
      let role = classifyPtr(v.x, v.y);
      if (role === 'radar') role = 'view';
      ptrs[e.pointerId] = { x: v.x, y: v.y, role: role };
      if (G.mode === 'play') {
        if (role === 'fire' || (!COARSE && role === 'view')) {
          G.fireHold = true;
          fireLaser();
        }
      }
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      const v = eventToVirtual(e);
      if (ptrs[e.pointerId]) {
        ptrs[e.pointerId].x = v.x;
        ptrs[e.pointerId].y = v.y;
      }
    });
    function up(e) {
      delete ptrs[e.pointerId];
      let hold = false;
      const ids = Object.keys(ptrs);
      for (let i = 0; i < ids.length; i++) {
        if (ptrs[ids[i]] && (ptrs[ids[i]].role === 'fire' || ptrs[ids[i]].role === 'view')) hold = true;
      }
      if (!hold) G.fireHold = false;
    }
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
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
    if (((G.clock * 8) | 0) !== hudN) {
      hudN = (G.clock * 8) | 0;
      syncHud();
    }
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

  if (btnCruise) {
    btnCruise.addEventListener('click', function () {
      audio.ensure();
      startGame('cruise');
    });
  }
  if (btnNet) {
    btnNet.addEventListener('click', function () {
      audio.ensure();
      startGame('net');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'cruise');
    });
  }
  if (btnOvModes) {
    btnOvModes.addEventListener('click', function () {
      audio.ensure();
      goTitle();
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
  if (btnMsl) {
    btnMsl.addEventListener('click', function () {
      audio.ensure();
      fireMissile();
    });
  }
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
      G.mslHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
