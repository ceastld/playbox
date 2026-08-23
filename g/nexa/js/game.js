'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.34;
  const POW_MAX = 2;
  const CHG1 = 0.36;
  const CHG2 = 0.82;
  const CHG_AUTO = 1.05;
  const CHAIN_R = 78;
  const BOSS_AT = [2800, 6000, 9800];
  const BEST_KEY = 'playbox-nexa-best';
  const MUTE_KEY = 'playbox-nexa-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 核束 · R 重开 · M 静音';
  const STAGE_NAME = ['外轨', '环廊', '核巢'];
  const BOSS_NAME = ['轨卫', '环枢', '星核主'];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const BLU = [77, 124, 255];
  const CYN = [106, 232, 255];
  const CORE = [122, 224, 255];
  const GOLD = [255, 227, 107];
  const MAG = [255, 77, 184];
  const VIO = [122, 92, 255];
  const WHT = [232, 240, 255];
  const HOT = [138, 180, 255];
  const DEEP = [10, 18, 40];
  const PNK = [255, 154, 214];

  const SCORE = {
    scout: 50, drone: 70, turret: 90, mine: 40,
    heavy: 160, carry: 220, node: 80, boss: 2800
  };

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
  const btnCore = document.getElementById('btn-core');
  const btnRail = document.getElementById('btn-rail');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnBeam = document.getElementById('btn-beam');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const beamLabel = document.getElementById('beam-label');
  const powLabel = document.getElementById('pow-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');

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
  let eid = 1;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 92, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const hexes = [];

  const G = {
    mode: 'title',
    kind: 'core',
    t: 0,
    cam: 0,
    px: 92,
    py: VH * 0.5,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    stage: 1,
    cleared: 0,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    pow: 0,
    coreLv: 0,
    spawnedX: 0,
    fireCd: 0,
    fireHold: false,
    chg: 0,
    chgHold: false,
    chgLv: 0,
    chgPing: 0,
    lockId: 0,
    lance: { on: false, t: 0, max: 0, h: 0, dmg: 0, full: false, y: 0, tick: 0 },
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: BLU,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    boss: false,
    winT: 0,
    engine: 0,
    chainWave: 0
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
  function isRail() {
    return G.kind === 'rail';
  }
  function pwx() {
    return G.cam + G.px;
  }
  function scrX(wx) {
    return wx - G.cam;
  }
  function stageAt(wx) {
    if (wx < BOSS_AT[0] + 80) return 1;
    if (wx < BOSS_AT[1] + 80) return 2;
    return 3;
  }
  function hash2(n) {
    n |= 0;
    n = Math.imul(n ^ 0x27d4eb2d, 0x165667b1);
    n = Math.imul(n ^ (n >>> 15), 0x27d4eb2d);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function valNoise(x, salt) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = hash2(i + salt * 9973);
    const b = hash2(i + 1 + salt * 9973);
    return a + (b - a) * u;
  }
  function fbm(x, salt) {
    return valNoise(x, salt) * 0.55
      + valNoise(x * 2.07, salt + 17) * 0.3
      + valNoise(x * 4.13, salt + 31) * 0.15;
  }
  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
  }
  function chgNeed() {
    const cut = G.coreLv * 0.06;
    return { a: Math.max(0.22, CHG1 - cut), b: Math.max(0.56, CHG2 - cut * 1.4) };
  }
  function scrollSpd() {
    if (G.boss) return isRail() ? 40 : 18;
    return isRail() ? 148 : 100;
  }
  function moveSpd() {
    return (isRail() ? 308 : 268) + G.pow * 10;
  }
  function fireGap() {
    return (isRail() ? 0.082 : 0.096) - G.pow * 0.006;
  }
  function railAt(wx) {
    const st = stageAt(wx);
    const n1 = fbm(wx / 190, 3);
    const n2 = fbm(wx / 168, 9);
    let top = 6 + n1 * (st === 1 ? 16 : st === 2 ? 34 : 50);
    let bot = VH - 8 - n2 * (st === 1 ? 14 : st === 2 ? 30 : 46);
    const col = Math.floor(wx / 72);
    const tooth = hash2(col * 41 + 7);
    if (st >= 2 && tooth > 0.72) {
      const drop = 10 + tooth * (st === 3 ? 18 : 12);
      if ((col & 1) === 0) top += drop;
      else bot -= drop;
    }
    if (wx < 360) {
      const t = wx / 360;
      top = lerp(8, top, t);
      bot = lerp(VH - 16, bot, t);
    }
    if (G.boss) {
      top = Math.min(top, 26);
      bot = Math.max(bot, VH - 28);
    }
    if (top > bot - 80) {
      const mid = (top + bot) * 0.5;
      top = mid - 40;
      bot = mid + 40;
    }
    return { top: top, bot: bot };
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
      this.beep(820, 0.042, 'square', 0.028, 1640);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.6, combo * 0.038);
      this.noise(0.036, 0.032, 1200);
      this.beep(520 * lift, 0.07, 'square', 0.038, 860 * lift);
    },
    charge(lv) {
      this.ensure();
      if (lv === 1) {
        this.beep(392, 0.07, 'square', 0.038, 588);
        this.beep(784, 0.1, 'triangle', 0.03, 988);
      } else {
        this.beep(523, 0.08, 'square', 0.042, 784);
        this.beep(1046, 0.14, 'sine', 0.04, 1568);
      }
    },
    hum(frac) {
      this.ensure();
      this.beep(180 + frac * 420, 0.05, 'sine', 0.016, 240 + frac * 680);
    },
    lance(full) {
      this.ensure();
      this.noise(full ? 0.16 : 0.08, full ? 0.07 : 0.04, full ? 280 : 700);
      this.beep(full ? 140 : 280, full ? 0.28 : 0.14, 'sawtooth', full ? 0.055 : 0.036, full ? 880 : 720);
      if (full) this.beep(660, 0.18, 'triangle', 0.034, 1320);
    },
    chain(n) {
      this.ensure();
      const f = 660 * (1 + Math.min(0.7, n * 0.12));
      this.beep(f, 0.08, 'square', 0.04, f * 1.5);
      this.beep(f * 0.5, 0.1, 'sine', 0.028, f);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.038, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.028, 1320);
    },
    lock() {
      this.ensure();
      this.beep(880, 0.05, 'square', 0.03, 1320);
    },
    option() {
      this.ensure();
      this.beep(440, 0.07, 'square', 0.042, 660);
      this.beep(660, 0.09, 'triangle', 0.038, 990);
      this.beep(880, 0.14, 'sine', 0.036, 1320);
    },
    pow() {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.04, 784);
      this.beep(784, 0.12, 'triangle', 0.034, 1175);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.065, 280);
      this.beep(300, 0.22, 'sawtooth', 0.05, 70);
      this.beep(150, 0.34, 'sine', 0.042, 44);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.045, 784);
      this.beep(784, 0.12, 'triangle', 0.04, 1046);
    },
    boom() {
      this.ensure();
      this.noise(0.22, 0.08, 180);
      this.beep(180, 0.28, 'sawtooth', 0.055, 55);
      this.beep(90, 0.4, 'sine', 0.04, 40);
    },
    check() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(659, 0.16, 'triangle', 0.04, 880);
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
      this.beep(330, 0.09, 'square', 0.04, 660);
      this.beep(660, 0.14, 'triangle', 0.035, 990);
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
    if ((G.mode !== 'play' && G.mode !== 'win') || n <= 0) return;
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

  function beamWord() {
    if (G.lance.on) return G.lance.full ? '满核' : '细束';
    if (G.chgLv >= 2) return G.lockId ? '核锁' : '满核';
    if (G.chgLv >= 1) return '蓄核';
    if (G.chgHold) return '蓄…';
    return '核';
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '星核';
      else if (G.boss) stageLabel.textContent = BOSS_NAME[G.stage - 1] || '核心';
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + (STAGE_NAME[G.stage - 1] || '');
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isRail() ? '核轨' : '星核';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isRail());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (beamLabel) {
      beamLabel.textContent = beamWord();
      beamLabel.className = 'beam'
        + (G.lance.on && G.lance.full ? ' full' : G.chgLv >= 2 ? (G.lockId ? ' lock' : ' full') : G.chgLv >= 1 || G.chgHold ? ' chg' : '');
    }
    if (powLabel) {
      powLabel.textContent = '火 ' + (G.pow + 1) + (G.coreLv ? ' · 核' + G.coreLv : '');
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
        comboEl.classList.toggle('hot', G.combo >= 6);
      } else {
        comboEl.hidden = true;
      }
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 空格射击，Shift 蓄核束', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 星核打穿', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 撞机、中弹、擦轨都掉命', 'warn');
    else if (G.lance.on && G.lance.full) setHint('满核贯穿 · 核心连锁爆', 'hot');
    else if (G.chgLv >= 2) setHint('满核就绪 · 松手打穿核心', 'hot');
    else if (G.chgHold) setHint('蓄核中 · 满核打穿连锁', '');
    else setHint('空格连射 · Shift 蓄核束打穿核心 · 满核连锁', '');
    syncPips();
  }

  function overlayOpen() {
    return !!(overlay && !overlay.classList.contains('hidden'));
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    panel.classList.toggle('win', kind === 'win');
    panel.classList.toggle('lose', kind === 'lose');
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'NEXA';
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
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE || (G.mode !== 'play' && G.mode !== 'win')) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
    if (!stageEl) return;
    kickTok += 1;
    const cls = mag >= 6 ? 'die' : mag >= 3.2 ? 'pow' : 'hit';
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
      t: 0, life: gold ? 0.95 : 0.65,
      size: gold ? 20 : 15, gold: !!gold, vy: gold ? -90 : -72
    });
    capArr(floats, 24);
  }

  function explode(x, y, rgb, power) {
    const p = power || 18;
    emit(Math.min(28, 10 + (p * 0.5) | 0), {
      x: x, y: y, j: 6,
      vx0: -220, vx1: 220, vy0: -180, vy1: 140,
      r0: 1.4, r1: 4.2, life: 0.42 + p * 0.006, rgb: rgb, g: 220
    });
    popSpark(x, y, rgb, 10 + p * 0.35);
  }

  function bumpCombo() {
    const prev = G.mult;
    G.combo += 1;
    G.comboT = COMBO_WIN;
    G.mult = comboMult();
    if (G.mult > prev) {
      audio.combo(G.mult);
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

  function pushEnt(e) {
    e.id = eid++;
    e.alive = true;
    e.flash = 0;
    G.ents.push(e);
  }

  function findBoss() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function findEnt(id) {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].id === id && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function lockTarget() {
    let best = null;
    let bestD = 48;
    const px = pwx();
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || !e.core) continue;
      const dx = e.wx - px;
      if (dx < 28 || dx > VW + 20) continue;
      const dy = Math.abs(e.y - G.py);
      const score = dy + dx * 0.04;
      if (score < bestD) {
        bestD = score;
        best = e;
      }
    }
    return best;
  }

  function spawnScout(wx, y, n, dive) {
    const rail = railAt(wx);
    y = clamp(y, rail.top + 22, rail.bot - 22);
    const dens = isRail();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'scout',
        wx: wx + i * 18,
        y: y + (i - (n - 1) * 0.5) * (dive ? 5 : 9),
        hw: 10, hh: 6, hp: 1,
        vx: -(dens ? 96 : 74),
        phase: i * 0.46,
        path: dive ? 'dive' : 'sine',
        core: false,
        cd: rand(0.5, 1.4)
      });
    }
  }

  function spawnDrone(wx, y, n) {
    const rail = railAt(wx);
    y = clamp(y, rail.top + 24, rail.bot - 24);
    const dens = isRail();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'drone',
        wx: wx + i * 22,
        y: y + Math.sin(i) * 16,
        hw: 11, hh: 11, hp: dens ? 3 : 2,
        vx: -(dens ? 78 : 60),
        phase: i * 0.7,
        core: true,
        cd: rand(0.55, 1.3)
      });
    }
  }

  function spawnTurret(wx, top) {
    const rail = railAt(wx);
    const y = top ? rail.top + 12 : rail.bot - 12;
    pushEnt({
      type: 'turret',
      wx: wx, y: y,
      hw: 12, hh: 10,
      hp: isRail() ? 4 : 3,
      top: !!top,
      core: false,
      cd: rand(0.5, 1.2)
    });
  }

  function spawnMine(wx, y) {
    pushEnt({
      type: 'mine',
      wx: wx, y: y,
      hw: 8, hh: 8, hp: 1,
      phase: rand(0, TAU),
      spin: 0,
      core: true
    });
  }

  function spawnHeavy(wx, y) {
    const rail = railAt(wx);
    y = clamp(y, rail.top + 30, rail.bot - 30);
    pushEnt({
      type: 'heavy',
      wx: wx, y: y,
      hw: 18, hh: 12,
      hp: isRail() ? 8 : 6,
      vx: -(isRail() ? 50 : 38),
      phase: 0,
      core: true,
      cd: rand(0.7, 1.25)
    });
  }

  function spawnCarry(wx, y) {
    const rail = railAt(wx);
    y = clamp(y, rail.top + 28, rail.bot - 28);
    pushEnt({
      type: 'carry',
      wx: wx, y: y,
      hw: 16, hh: 9,
      hp: isRail() ? 5 : 4,
      vx: -(isRail() ? 58 : 44),
      drop: false,
      core: true,
      cd: 0.4
    });
  }

  function spawnNode(wx, top) {
    const rail = railAt(wx);
    const y = top ? rail.top + 16 : rail.bot - 16;
    pushEnt({
      type: 'node',
      wx: wx, y: y,
      hw: 13, hh: 13,
      hp: isRail() ? 6 : 5,
      top: !!top,
      core: true,
      spin: 0
    });
  }

  function spawnCap(wx, y, kind) {
    pushEnt({
      type: 'cap',
      kind: kind || 'pow',
      wx: wx, y: y,
      hw: 9, hh: 9, hp: 1,
      spin: 0,
      vy: rand(-14, 14),
      core: false
    });
  }

  function spawnSlice(wx) {
    if (G.boss) return;
    if (wx < 240) return;
    const nearBoss = BOSS_AT[G.cleared];
    if (nearBoss != null && wx > nearBoss - 170) return;
    const st = stageAt(wx);
    const slice = (wx / 50) | 0;
    const h = hash2(slice * 19 + (isRail() ? 7 : 3) + G.stage * 11);
    const rail = railAt(wx);
    const mid = (rail.top + rail.bot) * 0.5;
    const dens = isRail() ? 0.78 : 1;
    const scoutEvery = isRail() ? 3 : 4;

    if (slice % scoutEvery === 0 && h > 0.12 * dens) {
      const y = lerp(rail.top + 36, rail.bot - 36, hash2(slice + 44));
      const n = (isRail() ? 6 : 5) + (st === 3 ? 1 : 0);
      spawnScout(wx, y, n, h > 0.7 && st > 1);
    }
    if (slice % (isRail() ? 4 : 5) === 2 && h > 0.28 * dens) {
      const y = lerp(rail.top + 40, rail.bot - 40, hash2(slice + 17));
      spawnDrone(wx, y, isRail() ? 3 : 2);
    }
    if (st !== 1 && slice % (isRail() ? 4 : 5) === 1 && h > 0.3 * dens) {
      spawnTurret(wx, hash2(slice + 3) > 0.5);
    }
    if (st >= 2 && slice % 6 === 3 && h > 0.32) {
      spawnHeavy(wx, mid + (h > 0.5 ? 28 : -28));
    }
    if ((st === 3 || isRail()) && slice % 5 === 0 && h > 0.38) {
      spawnMine(wx, lerp(rail.top + 40, rail.bot - 40, hash2(slice + 21)));
      if (isRail()) spawnMine(wx + 26, lerp(rail.top + 40, rail.bot - 40, hash2(slice + 33)));
    }
    if (slice % 7 === 4 && h > 0.34) {
      spawnNode(wx, hash2(slice + 8) > 0.5);
    }
    if (slice % 8 === 3 && h > 0.36) {
      spawnCarry(wx, mid);
    }
    if (slice % 9 === 5 && h > 0.5) {
      spawnCap(wx, lerp(rail.top + 40, rail.bot - 40, hash2(slice + 9)), h > 0.7 ? 'core' : 'pow');
    }
  }

  function spawnBoss() {
    G.boss = true;
    const st = G.stage;
    const rail = isRail();
    const hp = ((st === 1 ? 72 : st === 2 ? 96 : 138) * (rail ? 1.24 : 1)) | 0;
    const cave = railAt(G.cam + VW * 0.72);
    pushEnt({
      type: 'boss',
      kind: st === 1 ? 'guard' : st === 2 ? 'pivot' : 'nexus',
      wx: G.cam + VW * 0.78,
      y: (cave.top + cave.bot) * 0.5,
      hw: st === 1 ? 34 : 48,
      hh: st === 1 ? 68 : 34,
      hp: hp,
      max: hp,
      open: 0,
      phase: 0,
      cd: 0.7,
      vy: 42,
      spin: 0,
      core: true
    });
    toast((BOSS_NAME[st - 1] || '核心') + ' 出阵', false, true);
    audio.check();
    kick(3.4);
    screenFlash(CYN, 0.32);
    syncHud();
  }

  function trySpawn() {
    if (!G.boss && G.mode === 'play') {
      const mark = BOSS_AT[G.cleared];
      if (mark != null && G.cam + VW * 0.72 >= mark) spawnBoss();
    }
    if (G.boss) return;
    const ahead = G.cam + VW + 80;
    while (G.spawnedX < ahead) {
      G.spawnedX += 50;
      spawnSlice(G.spawnedX);
    }
  }

  function seedStars() {
    stars.length = 0;
    hexes.length = 0;
    for (let i = 0; i < 78; i++) {
      stars.push({
        wx: hash2(i * 17) * 2400,
        y: 8 + hash2(i * 91 + 3) * (VH - 16),
        s: 0.5 + hash2(i * 5 + 9) * 1.8,
        p: 0.18 + hash2(i * 13) * 0.7
      });
    }
    for (let i = 0; i < 28; i++) {
      hexes.push({
        wx: hash2(i * 29 + 4) * 2000,
        y: 50 + hash2(i * 41) * 340,
        p: 0.22 + hash2(i * 7) * 0.45,
        s: 6 + hash2(i * 11) * 10
      });
    }
  }

  function award(kind, x, y) {
    bumpCombo();
    const n = (SCORE[kind] || 10) * G.mult;
    addScore(n);
    const gold = kind === 'boss' || kind === 'carry' || G.mult >= 3;
    floatText(x, y - 8, '+' + n, gold ? GOLD : WHT, gold);
  }

  function catchPow(x, y) {
    if (G.pow >= POW_MAX) {
      toast('火力 MAX', false, true);
      addScore(400 * G.mult);
      audio.pow();
      floatText(x, y - 12, '+MAX', GOLD, true);
      return;
    }
    G.pow += 1;
    toast('火力 ×' + (G.pow + 1), false, true);
    audio.pow();
    popSpark(x, y, GOLD, 18);
    hitStop(0.04);
    kick(2.6);
    screenFlash(GOLD, 0.32);
    floatText(x, y - 12, '火力', GOLD, true);
    syncHud();
  }

  function catchCore(x, y) {
    if (G.coreLv >= 2) {
      toast('核槽 MAX', false, true);
      addScore(450 * G.mult);
      audio.option();
      floatText(x, y - 12, '+MAX', CYN, true);
      return;
    }
    G.coreLv += 1;
    toast('核槽 ×' + G.coreLv, false, true);
    audio.option();
    popSpark(x, y, CYN, 20);
    hitStop(0.046);
    kick(2.8);
    screenFlash(CYN, 0.36);
    floatText(x, y - 14, '核槽', CYN, true);
    syncHud();
  }

  function collectCap(e) {
    e.alive = false;
    const x = scrX(e.wx);
    if (e.kind === 'core') catchCore(x, e.y);
    else catchPow(x, e.y);
    addScore(40);
  }

  function pushShot(s) {
    G.shots.push(s);
    capArr(G.shots, 72);
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0 || G.fireCd > 0) return;
    if (G.lance.on) return;
    G.fireCd = fireGap();
    G.muzzle = 0.05;
    const wx = pwx() + 16;
    const y = G.py;
    const vx = 650;
    const pow = G.pow;
    if (pow <= 0) {
      pushShot({ wx: wx, y: y, vx: vx, vy: 0, hw: 6.2, hh: 2.1, life: 0.85 });
    } else if (pow === 1) {
      pushShot({ wx: wx, y: y - 4.2, vx: vx, vy: -26, hw: 6, hh: 2, life: 0.85 });
      pushShot({ wx: wx, y: y + 4.2, vx: vx, vy: 26, hw: 6, hh: 2, life: 0.85 });
    } else {
      pushShot({ wx: wx, y: y, vx: vx, vy: 0, hw: 6.4, hh: 2.2, life: 0.85 });
      pushShot({ wx: wx, y: y - 6, vx: vx * 0.97, vy: -72, hw: 5.8, hh: 2, life: 0.85 });
      pushShot({ wx: wx, y: y + 6, vx: vx * 0.97, vy: 72, hw: 5.8, hh: 2, life: 0.85 });
    }
    audio.shoot();
    if (!REDUCE) {
      emit(3, {
        x: G.px + 16, y: G.py, j: 3,
        vx0: 40, vx1: 160, vy0: -50, vy1: 50,
        r0: 1, r1: 2.4, life: 0.12, rgb: CYN, g: 0
      });
    }
  }

  function fireLance() {
    if (G.mode !== 'play' || G.deadT > 0 || G.lance.on) return;
    const need = chgNeed();
    const lv = G.chg >= need.b ? 2 : G.chg >= need.a ? 1 : 0;
    G.chgHold = false;
    G.chg = 0;
    G.chgLv = 0;
    if (lv <= 0) {
      syncHud();
      return;
    }
    const full = lv >= 2;
    const lock = full ? lockTarget() : null;
    G.lance.on = true;
    G.lance.full = full;
    G.lance.t = 0;
    G.lance.max = full ? 0.44 : 0.2;
    G.lance.h = full ? 26 : 11;
    G.lance.dmg = full ? 5 : 2;
    G.lance.y = lock ? lock.y : G.py;
    G.lance.tick = 0;
    G.chainWave += 1;
    audio.lance(full);
    if (full) {
      floatText(G.px + 40, G.py - 18, lock ? '核锁' : '满核', GOLD, true);
      toast(lock ? '核锁贯穿' : '满核贯穿', false, true);
      hitStop(0.055);
      kick(4.2);
      screenFlash(CYN, 0.48);
    } else {
      floatText(G.px + 28, G.py - 14, '细束', CYN, false);
      hitStop(0.032);
      kick(2.2);
      screenFlash(BLU, 0.22);
    }
    popSpark(G.px + 18, G.py, full ? GOLD : CYN, full ? 22 : 12);
    emit(full ? 18 : 8, {
      x: G.px + 20, y: G.py, j: 8,
      vx0: 80, vx1: 320, vy0: -90, vy1: 90,
      r0: 1.4, r1: 3.6, life: 0.28, rgb: full ? GOLD : CYN, g: 0
    });
    syncHud();
  }

  function enemyShot(wx, y, vx, vy, r) {
    G.eShots.push({
      wx: wx, y: y, vx: vx, vy: vy, r: r || 3.2, life: 3.2
    });
    capArr(G.eShots, 110);
  }

  function aimShot(e, sp, r, spread, n) {
    const dx = pwx() - e.wx;
    const dy = G.py - e.y;
    const d = hypot(dx, dy) || 1;
    const base = Math.atan2(dy, dx);
    const count = n || 1;
    for (let k = 0; k < count; k++) {
      const ang = base + (k - (count - 1) * 0.5) * (spread || 0);
      enemyShot(e.wx - 8, e.y, Math.cos(ang) * sp, Math.sin(ang) * sp, r || 3.2);
    }
  }

  function hurt(e, dmg, hx, hy, fromLance) {
    if (!e.alive || e.type === 'cap') return false;
    if (e.type === 'boss' && e.open < 0.42) return 'block';
    e.hp -= dmg || 1;
    e.flash = 0.08;
    if (e.hp > 0) {
      emit(4, {
        x: hx, y: hy, j: 4,
        vx0: -90, vx1: 90, vy0: -80, vy1: 50,
        life: 0.16, r0: 1, r1: 2.2, rgb: WHT, g: 80
      });
      if (e.type === 'boss' || fromLance) hitStop(fromLance ? 0.034 : 0.028);
      bumpCombo();
      G.comboT = COMBO_WIN;
      G.mult = comboMult();
      return true;
    }
    killEnt(e, fromLance);
    return true;
  }

  function chainFrom(wx, y, depth) {
    if (depth > 5) return;
    const wave = G.chainWave;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive || !e.core || e.type === 'boss') continue;
      if (e.wave === wave) continue;
      if (hypot(e.wx - wx, e.y - y) > CHAIN_R) continue;
      e.wave = wave;
      const sxv = scrX(e.wx);
      floatText(sxv, e.y - 16, '连锁', GOLD, true);
      addScore(30 * G.mult);
      audio.chain(depth + 1);
      hitStop(0.03);
      kick(2.4);
      const oxw = e.wx;
      const oyv = e.y;
      killEnt(e, false);
      chainFrom(oxw, oyv, depth + 1);
    }
  }

  function killEnt(e, fromLance) {
    if (!e.alive) return;
    e.alive = false;
    const x = scrX(e.wx);
    const y = e.y;
    if (e.type === 'boss') {
      explode(x, y, GOLD, 52);
      explode(x - 24, y + 10, MAG, 22);
      explode(x + 20, y - 10, CYN, 22);
      award('boss', x, y);
      addScore(1400 * G.stage);
      audio.boom();
      hitStop(0.08);
      kick(8);
      screenFlash(GOLD, 0.62);
      G.cleared += 1;
      G.boss = false;
      if (G.cleared >= 3) {
        G.winT = 1.28;
        toast('星核打穿', false, true);
      } else {
        G.stage = G.cleared + 1;
        toast('第 ' + G.stage + ' 关 · ' + STAGE_NAME[G.stage - 1], false, true);
        audio.check();
      }
      syncHud();
      return;
    }
    if (e.type === 'cap') return;
    const rgb = e.type === 'drone' || e.type === 'node' ? CORE
      : e.type === 'mine' ? MAG
      : e.type === 'heavy' ? VIO
      : e.type === 'turret' ? BLU : HOT;
    explode(x, y, rgb, e.type === 'heavy' || e.type === 'carry' ? 22 : 16);
    award(e.type, x, y);
    audio.hit(G.combo);
    hitStop(clamp(0.03 + G.combo * 0.0022, 0.03, 0.062));
    kick(e.type === 'heavy' || e.type === 'node' ? 3.1 : 1.8);
    if (fromLance && e.core) {
      e.wave = G.chainWave;
      chainFrom(e.wx, e.y, 0);
    }
    if (e.type === 'carry' || (e.core && hash2(e.id) > 0.7)) {
      spawnCap(e.wx, e.y, e.type === 'carry' ? (hash2(e.id + 3) > 0.5 ? 'core' : 'pow') : 'pow');
    }
  }

  function killPlayer() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    breakCombo();
    G.fireHold = false;
    G.chgHold = false;
    G.chg = 0;
    G.chgLv = 0;
    G.lance.on = false;
    explode(G.px, G.py, MAG, 34);
    G.pow = Math.max(0, G.pow - 1);
    if (G.coreLv > 0) {
      spawnCap(pwx(), G.py, 'core');
      G.coreLv = Math.max(0, G.coreLv - 1);
    }
    audio.death();
    hitStop(0.072);
    kick(7.2);
    screenFlash(MAG, 0.55);
    syncHud();
  }

  function respawn() {
    G.px = 92;
    const cave = railAt(pwx());
    G.py = clamp((cave.top + cave.bot) * 0.5, cave.top + 20, cave.bot - 20);
    G.invuln = 1.48;
    pointer.x = G.px;
    pointer.y = G.py;
    G.eShots.length = 0;
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    G.why = '舰毁了';
    saveBest();
    audio.lose();
    showOverlay('lose', '舰毁了', '分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function winGame() {
    addScore(isRail() ? 7500 : 6000);
    G.mode = 'win';
    saveBest();
    audio.win();
    showOverlay('win', '星核打穿', (isRail() ? '核轨通关' : '三关打穿') + ' · 分数 ' + G.score + (G.best === G.score && G.score > 0 ? ' · 新纪录' : ''));
    syncHud();
  }

  function updatePlayer(dt) {
    if (G.deadT > 0) return;
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      dx = pointer.x - G.px;
      dy = pointer.y - G.py;
      const d = hypot(dx, dy);
      const max = moveSpd() * dt;
      if (d > max && d > 0.4) {
        dx = dx / d * max;
        dy = dy / d * max;
      }
      G.px += dx;
      G.py += dy;
    } else {
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) dy -= 1;
      if (keys.d) dy += 1;
      if (dx || dy) {
        const d = hypot(dx, dy) || 1;
        G.px += dx / d * moveSpd() * dt;
        G.py += dy / d * moveSpd() * dt;
      }
    }
    const cave = railAt(pwx());
    G.px = clamp(G.px, 26, VW * 0.52);
    const top = cave.top + 12;
    const bot = cave.bot - 12;
    if (G.py < top || G.py > bot) {
      if (G.invuln > 0) G.py = clamp(G.py, top, bot);
      else {
        G.py = clamp(G.py, top, bot);
        killPlayer();
      }
    }
    G.engine += dt;
    if (!REDUCE && G.engine > 0.04) {
      G.engine = 0;
      emit(1, {
        x: G.px - 14, y: G.py + rand(-2, 2), j: 1,
        vx0: -90, vx1: -40, vy0: -18, vy1: 18,
        r0: 1.2, r1: 2.4, life: 0.18, rgb: BLU, g: 0
      });
    }
  }

  function updateCharge(dt) {
    if (G.deadT > 0 || G.mode !== 'play') return;
    const need = chgNeed();
    let dirty = false;
    if (G.chgHold && !G.lance.on) {
      const prev = G.chgLv;
      G.chg += dt;
      if (G.chg >= need.b) G.chgLv = 2;
      else if (G.chg >= need.a) G.chgLv = 1;
      else G.chgLv = 0;
      G.chgPing -= dt;
      if (G.chgPing <= 0) {
        G.chgPing = 0.12;
        audio.hum(clamp(G.chg / need.b, 0, 1));
      }
      if (G.chgLv !== prev) {
        dirty = true;
        if (G.chgLv > 0) {
          audio.charge(G.chgLv);
          if (G.chgLv >= 2) {
            hitStop(0.038);
            kick(2.6);
            screenFlash(GOLD, 0.28);
            popSpark(G.px + 16, G.py, GOLD, 16);
          } else {
            popSpark(G.px + 14, G.py, CYN, 10);
          }
        }
      }
      const lock = G.chgLv >= 2 ? lockTarget() : null;
      const lid = lock ? lock.id : 0;
      if (lid !== G.lockId) {
        if (lid) audio.lock();
        G.lockId = lid;
        dirty = true;
      }
      if (G.chg >= CHG_AUTO) fireLance();
    } else if (!G.lance.on && (G.chg > 0 || G.chgLv || G.lockId)) {
      G.chg = 0;
      G.chgLv = 0;
      G.lockId = 0;
      dirty = true;
    }
    if (dirty) syncHud();
  }

  function updateLance(dt) {
    if (!G.lance.on) return;
    G.lance.t += dt;
    G.lance.tick -= dt;
    const lock = G.lance.full ? lockTarget() : null;
    const ty = lock ? lock.y : G.py;
    G.lance.y = lerp(G.lance.y, ty, clamp(dt * 8, 0, 1));
    if (G.lance.tick <= 0) {
      G.lance.tick = 0.055;
      const hx = G.lance.h * 0.5;
      const x0 = pwx() + 12;
      for (let i = 0; i < G.ents.length; i++) {
        const e = G.ents[i];
        if (!e.alive || e.type === 'cap') continue;
        if (e.wx < x0 - e.hw) continue;
        if (e.wx > G.cam + VW + 30) continue;
        if (Math.abs(e.y - G.lance.y) > hx + e.hh) continue;
        const r = hurt(e, G.lance.dmg, scrX(e.wx), e.y, true);
        if (r === 'block') {
          emit(4, {
            x: scrX(e.wx) - 8, y: G.lance.y, j: 4,
            vx0: -40, vx1: 20, vy0: -40, vy1: 40,
            life: 0.12, r0: 1, r1: 2.2, rgb: WHT, g: 0
          });
        }
      }
      for (let i = G.eShots.length - 1; i >= 0; i--) {
        const s = G.eShots[i];
        if (s.r > 5.6) continue;
        if (s.wx < x0) continue;
        if (Math.abs(s.y - G.lance.y) > hx + s.r) continue;
        emit(3, {
          x: scrX(s.wx), y: s.y, j: 3,
          vx0: -30, vx1: 40, vy0: -40, vy1: 40,
          life: 0.12, r0: 1, r1: 2, rgb: CYN, g: 0
        });
        G.eShots.splice(i, 1);
      }
      if (!REDUCE) {
        emit(G.lance.full ? 4 : 2, {
          x: G.px + rand(20, VW * 0.7), y: G.lance.y, j: 3,
          vx0: 40, vx1: 160, vy0: -30, vy1: 30,
          r0: 1, r1: 2.6, life: 0.12, rgb: G.lance.full ? GOLD : CYN, g: 0
        });
      }
    }
    if (G.lance.t >= G.lance.max) {
      G.lance.on = false;
      syncHud();
    }
  }

  function shotHitsEnt(s, e) {
    if (!e.alive) return false;
    if (e.type === 'cap') return false;
    if (e.type === 'boss') {
      if (e.open < 0.42) {
        if (aabb(s.wx, s.y, s.hw, s.hh, e.wx, e.y, e.hw, e.hh)) return 'block';
        return false;
      }
      if (aabb(s.wx, s.y, s.hw, s.hh, e.wx - 8, e.y, 14, 14)) return true;
      if (aabb(s.wx, s.y, s.hw, s.hh, e.wx, e.y, e.hw, e.hh)) return 'block';
      return false;
    }
    return aabb(s.wx, s.y, s.hw, s.hh, e.wx, e.y, e.hw, e.hh);
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      if (s.life <= 0 || x > VW + 50 || x < -40 || s.y < -20 || s.y > VH + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      const cave = railAt(s.wx);
      if (s.y < cave.top + 4 || s.y > cave.bot - 4) {
        emit(3, {
          x: x, y: s.y, j: 2,
          vx0: -40, vx1: 20, vy0: -30, vy1: 30,
          life: 0.1, r0: 1, r1: 2, rgb: CYN, g: 0
        });
        G.shots.splice(i, 1);
        continue;
      }
      let gone = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        const hit = shotHitsEnt(s, e);
        if (!hit) continue;
        if (hit === 'block') {
          emit(3, {
            x: x, y: s.y, j: 3,
            vx0: -40, vx1: 20, vy0: -40, vy1: 40,
            life: 0.12, r0: 1, r1: 2, rgb: WHT, g: 0
          });
          gone = true;
          break;
        }
        hurt(e, 1, scrX(e.wx), e.y, false);
        gone = true;
        break;
      }
      if (gone) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.wx += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      if (s.life <= 0 || x < -30 || x > VW + 40 || s.y < -24 || s.y > VH + 24) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (aabb(s.wx, s.y, s.r, s.r, pwx(), G.py, 7.2, 4.6)) {
          G.eShots.splice(i, 1);
          killPlayer();
        }
      }
    }
  }

  function updateBoss(e, dt, x, rail) {
    const half = e.hp < e.max * 0.5;
    e.phase += dt;
    e.spin += (half ? 2.4 : 1.4) * dt;
    const cave = railAt(e.wx);
    const mid = (cave.top + cave.bot) * 0.5;
    if (e.kind === 'guard') {
      e.wx = lerp(e.wx, G.cam + VW * 0.74, 0.04);
      e.y += Math.sin(e.phase * 1.1) * 18 * dt;
      e.y = clamp(e.y, cave.top + 70, cave.bot - 70);
      e.open = 0.25 + (Math.sin(e.phase * 1.6) * 0.5 + 0.5) * 0.75;
    } else if (e.kind === 'pivot') {
      e.wx = lerp(e.wx, G.cam + VW * 0.72, 0.04);
      e.y = lerp(e.y, mid + Math.sin(e.phase * 0.9) * 36, 0.08);
      e.open = 0.2 + (Math.sin(e.phase * 1.35) * 0.5 + 0.5) * 0.8;
    } else {
      e.wx = lerp(e.wx, G.cam + VW * 0.7, 0.035);
      e.y += e.vy * dt;
      if (e.y < cave.top + 50 || e.y > cave.bot - 50) e.vy *= -1;
      e.y = clamp(e.y, cave.top + 48, cave.bot - 48);
      e.open = 0.18 + (Math.sin(e.phase * (half ? 1.8 : 1.2)) * 0.5 + 0.5) * 0.82;
    }
    e.cd -= dt;
    if (e.cd > 0 || x < 40 || x > VW + 20) return;
    const rate = (rail ? 0.76 : 1) * (half ? 0.72 : 1);
    if (e.kind === 'guard') {
      e.cd = (half ? 0.62 : 0.88) * rate;
      aimShot(e, rail ? 178 : 150, 3.4, 0.22, half ? 5 : 3);
    } else if (e.kind === 'pivot') {
      e.cd = (half ? 0.48 : 0.7) * rate;
      const n = half ? 10 : 7;
      for (let k = 0; k < n; k++) {
        const a = e.spin + k / n * TAU;
        enemyShot(e.wx, e.y, Math.cos(a) * 132, Math.sin(a) * 132, 3.3);
      }
      if (half) aimShot(e, 168, 4.2, 0, 1);
    } else {
      e.cd = (half ? 0.42 : 0.64) * rate;
      const n = half ? 12 : 8;
      for (let k = 0; k < n; k++) {
        const a = e.spin + k / n * TAU;
        enemyShot(e.wx, e.y, Math.cos(a) * 118, Math.sin(a) * 118, 3.2);
      }
      aimShot(e, rail ? 176 : 148, half ? 5.4 : 4.4, 0.16, half ? 3 : 1);
    }
  }

  function updateEnts(dt) {
    const rail = isRail();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (e.flash > 0) e.flash -= dt;
      const x = scrX(e.wx);
      if (!e.alive) {
        if (x < -80) G.ents.splice(i, 1);
        continue;
      }
      if (e.type !== 'boss' && x < -70) {
        G.ents.splice(i, 1);
        continue;
      }

      if (e.type === 'scout') {
        e.wx += e.vx * dt;
        if (e.path === 'dive' && x < VW * 0.85) {
          const dy = G.py - e.y;
          e.y += clamp(dy, -70, 70) * dt * 0.9;
        } else {
          e.y += Math.sin(G.t * 3.1 + e.phase) * 40 * dt;
        }
        const cave = railAt(e.wx);
        e.y = clamp(e.y, cave.top + 14, cave.bot - 14);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW * 0.82 && x > 40) {
          e.cd = rail ? rand(0.85, 1.5) : rand(1.3, 2.2);
          if (hash2(e.id + ((G.t * 8) | 0)) > (rail ? 0.42 : 0.6)) {
            aimShot(e, rail ? 186 : 154, 3, 0, 1);
          }
        }
      } else if (e.type === 'drone') {
        e.wx += e.vx * dt;
        e.y += Math.sin(G.t * 2.4 + e.phase) * 32 * dt;
        const cave = railAt(e.wx);
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 30) {
          e.cd = rail ? 1.05 : 1.42;
          aimShot(e, 158, 3.2, 0.14, 2);
        }
      } else if (e.type === 'turret') {
        const cave = railAt(e.wx);
        e.y = e.top ? cave.top + 12 : cave.bot - 12;
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 24) {
          e.cd = rail ? 0.82 : 1.12;
          aimShot(e, rail ? 178 : 150, 3.3, 0, 1);
        }
      } else if (e.type === 'mine') {
        e.spin += dt * 3.4;
        e.y += Math.sin(G.t * 2 + e.phase) * 16 * dt;
        const cave = railAt(e.wx);
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        e.wx -= 18 * dt;
      } else if (e.type === 'heavy') {
        e.wx += e.vx * dt;
        e.phase += dt;
        e.y += Math.sin(e.phase * 1.3) * 22 * dt;
        const cave = railAt(e.wx);
        e.y = clamp(e.y, cave.top + 22, cave.bot - 22);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 20) {
          e.cd = rail ? 0.95 : 1.28;
          aimShot(e, rail ? 170 : 148, 3.5, 0.22, 3);
        }
      } else if (e.type === 'carry') {
        e.wx += e.vx * dt;
        e.y += Math.sin(G.t * 1.6) * 14 * dt;
        const cave = railAt(e.wx);
        e.y = clamp(e.y, cave.top + 20, cave.bot - 20);
      } else if (e.type === 'node') {
        e.spin += dt * 1.6;
        const cave = railAt(e.wx);
        e.y = e.top ? cave.top + 16 : cave.bot - 16;
      } else if (e.type === 'cap') {
        e.spin += dt * 3.2;
        e.wx -= 28 * dt;
        e.y += e.vy * dt;
        const cave = railAt(e.wx);
        if (e.y < cave.top + 16 || e.y > cave.bot - 16) e.vy *= -1;
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        if (G.mode === 'play' && G.deadT <= 0 && aabb(e.wx, e.y, e.hw, e.hh, pwx(), G.py, 12, 10)) {
          collectCap(e);
        }
      } else if (e.type === 'boss') {
        updateBoss(e, dt, x, rail);
      }

      if (e.alive && e.type !== 'cap' && G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        const pr = e.type === 'boss' ? 10 : 8;
        if (aabb(pwx(), G.py, pr, 5.2, e.wx, e.y, e.hw * 0.78, e.hh * 0.78)) {
          killPlayer();
        }
      }
    }
  }

  function updateFx(dt) {
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    G.punch = lerp(G.punch, 1, clamp(dt * 10, 0, 1));
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
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
      f.y += f.vy * dt;
      f.vy += 40 * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
  }

  function update(dt) {
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.15);
      return;
    }
    if (G.mode === 'title') {
      G.t += dt;
      G.cam += 22 * dt;
      updateFx(dt);
      return;
    }
    if (G.mode === 'lose') {
      G.t += dt;
      updateFx(dt);
      return;
    }
    if (G.mode === 'win') {
      G.t += dt;
      G.cam += 36 * dt;
      updateFx(dt);
      return;
    }

    if (G.winT > 0) {
      G.t += dt;
      G.winT -= dt;
      G.cam += scrollSpd() * dt * 0.4;
      updateEnts(dt);
      updateShots(dt);
      updateFx(dt);
      if (G.winT <= 0) winGame();
      return;
    }

    if (G.deadT > 0) {
      G.t += dt;
      G.deadT -= dt;
      G.cam += scrollSpd() * dt * 0.35;
      trySpawn();
      updateEnts(dt);
      updateShots(dt);
      updateFx(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseGame();
        else respawn();
      }
      return;
    }

    G.t += dt;
    G.cam += scrollSpd() * dt;
    if (G.stage < stageAt(G.cam + 80) && !G.boss) {
      G.stage = stageAt(G.cam + 80);
      syncHud();
    }
    updatePlayer(dt);
    updateCharge(dt);
    updateLance(dt);
    if (G.fireHold) fire();
    trySpawn();
    updateEnts(dt);
    updateShots(dt);
    updateFx(dt);
  }

  function hexPath(c, x, y, r) {
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * TAU + Math.PI / 6;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
    c.closePath();
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const x = ((s.wx - G.cam * s.p) % VW + VW) % VW;
      c.fillStyle = rgba(i % 3 === 0 ? CYN : WHT, 0.22 + s.p * 0.5);
      const r = s.s * scale;
      c.fillRect(sx(x), sy(s.y), r, r);
    }
    for (let i = 0; i < hexes.length; i++) {
      const h = hexes[i];
      const x = ((h.wx - G.cam * h.p) % VW + VW) % VW;
      c.strokeStyle = rgba(BLU, 0.1 + Math.sin(G.t * 1.4 + i) * 0.05);
      c.lineWidth = Math.max(1, scale);
      hexPath(c, sx(x), sy(h.y), h.s * scale);
      c.stroke();
    }
  }

  function drawRails() {
    const c = ctx;
    const step = 8;
    c.beginPath();
    c.moveTo(sx(0), sy(0));
    for (let x = 0; x <= VW; x += step) {
      const cv = railAt(G.cam + x);
      c.lineTo(sx(x), sy(cv.top));
    }
    c.lineTo(sx(VW), sy(0));
    c.closePath();
    c.fillStyle = G.stage === 3 ? '#070816' : G.stage === 2 ? '#08101e' : '#0a1224';
    c.fill();

    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let x = 0; x <= VW; x += step) {
      const cv = railAt(G.cam + x);
      c.lineTo(sx(x), sy(cv.bot));
    }
    c.lineTo(sx(VW), sy(VH));
    c.closePath();
    c.fillStyle = G.stage === 3 ? '#0a0c1c' : G.stage === 2 ? '#0c1428' : '#0e1630';
    c.fill();

    c.strokeStyle = rgba(G.stage === 3 ? VIO : BLU, G.stage === 3 ? 0.55 : 0.42);
    c.lineWidth = Math.max(1, 1.5 * scale);
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const cv = railAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(cv.bot));
      else c.lineTo(sx(x), sy(cv.bot));
    }
    c.stroke();
    c.strokeStyle = rgba(CYN, 0.28);
    c.beginPath();
    for (let x = 0; x <= VW; x += step) {
      const cv = railAt(G.cam + x);
      if (x === 0) c.moveTo(sx(x), sy(cv.top));
      else c.lineTo(sx(x), sy(cv.top));
    }
    c.stroke();

    for (let x = 0; x <= VW; x += 36) {
      const wx = G.cam + x;
      const cv = railAt(wx);
      const col = Math.floor(wx / 72);
      const pulse = 0.35 + Math.sin(G.t * 2.2 + col) * 0.2;
      hexPath(c, sx(x + 6), sy(cv.top + 8), 5 * scale);
      c.strokeStyle = rgba(CYN, 0.18 + pulse * 0.2);
      c.lineWidth = Math.max(1, scale);
      c.stroke();
      hexPath(c, sx(x + 10), sy(cv.bot - 8), 5 * scale);
      c.strokeStyle = rgba(BLU, 0.16 + pulse * 0.18);
      c.stroke();
      if (G.chgLv >= 2 || (G.lance.on && G.lance.full)) {
        c.fillStyle = rgba(GOLD, 0.12 + pulse * 0.1);
        c.fillRect(sx(x), sy(cv.top), 2 * scale, 4 * scale);
        c.fillRect(sx(x), sy(cv.bot - 4), 2 * scale, 4 * scale);
      }
    }
  }

  function drawLance() {
    if (!G.lance.on) return;
    const c = ctx;
    const h = G.lance.h;
    const y = G.lance.y;
    const x0 = G.px + 12;
    const fade = 1 - G.lance.t / G.lance.max;
    const rgb = G.lance.full ? GOLD : CYN;
    c.fillStyle = rgba(rgb, 0.18 + fade * 0.22);
    c.fillRect(sx(x0), sy(y - h * 0.5), (VW - x0) * scale, h * scale);
    c.fillStyle = rgba(WHT, 0.55 + fade * 0.35);
    c.fillRect(sx(x0), sy(y - h * 0.16), (VW - x0) * scale, h * 0.32 * scale);
    c.fillStyle = rgba(rgb, 0.85);
    c.fillRect(sx(x0), sy(y - 1.4), (VW - x0) * scale, 2.8 * scale);
    if (!REDUCE) {
      c.strokeStyle = rgba(rgb, 0.35 * fade);
      c.lineWidth = Math.max(1, 2 * scale);
      c.beginPath();
      c.moveTo(sx(x0), sy(y - h * 0.5));
      c.lineTo(sx(VW), sy(y - h * 0.5));
      c.moveTo(sx(x0), sy(y + h * 0.5));
      c.lineTo(sx(VW), sy(y + h * 0.5));
      c.stroke();
    }
  }

  function drawShip(x, y, a) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(y));
    c.globalAlpha = a == null ? 1 : a;
    const s = scale;
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle / 0.05);
      c.beginPath();
      c.ellipse(18 * s, 0, 10 * s, 3.2 * s, 0, 0, TAU);
      c.fill();
    }
    const chg = clamp(G.chg / chgNeed().b, 0, 1);
    if (G.chgHold && chg > 0.08) {
      const rad = 3 + chg * 9;
      c.fillStyle = rgba(G.chgLv >= 2 ? GOLD : CYN, 0.22 + chg * 0.4);
      c.beginPath();
      c.arc(16 * s, 0, rad * s, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(G.chgLv >= 2 ? GOLD : CYN, 0.85);
      c.lineWidth = Math.max(1, 1.4 * s);
      hexPath(c, 16 * s, 0, (rad * 0.7) * s);
      c.stroke();
    }
    c.fillStyle = rgba(VIO, 0.7);
    c.beginPath();
    c.moveTo(-16 * s, -2 * s);
    c.lineTo(-22 * s, -6 * s);
    c.lineTo(-22 * s, 6 * s);
    c.lineTo(-16 * s, 2 * s);
    c.fill();
    c.fillStyle = rgba(BLU, 0.96);
    c.beginPath();
    c.moveTo(-10 * s, 0);
    c.lineTo(-4 * s, -11 * s);
    c.lineTo(4 * s, -6 * s);
    c.lineTo(4 * s, 6 * s);
    c.lineTo(-4 * s, 11 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.96);
    c.beginPath();
    c.moveTo(-10 * s, -4 * s);
    c.lineTo(18 * s, 0);
    c.lineTo(-10 * s, 4 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 1);
    c.beginPath();
    c.moveTo(2 * s, -2.4 * s);
    c.lineTo(16 * s, 0);
    c.lineTo(2 * s, 2.4 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(GOLD, 0.95);
    hexPath(c, -2 * s, 0, 3.2 * s);
    c.fill();
    if (G.lockId && G.chgLv >= 2) {
      const e = findEnt(G.lockId);
      if (e) {
        c.strokeStyle = rgba(GOLD, 0.7);
        c.lineWidth = Math.max(1, s);
        c.setLineDash([4 * s, 3 * s]);
        c.beginPath();
        c.moveTo(16 * s, 0);
        c.lineTo((scrX(e.wx) - x) * s, (e.y - y) * s);
        c.stroke();
        c.setLineDash([]);
      }
    }
    c.restore();
  }

  function drawCore(e, x, r) {
    const c = ctx;
    const s = scale;
    const pulse = 0.55 + Math.sin(G.t * 6 + e.id) * 0.25;
    const hot = G.chgLv >= 2 || (G.lance.on && G.lance.full);
    c.fillStyle = rgba(e.flash > 0 ? WHT : (hot ? GOLD : CORE), 0.9);
    c.beginPath();
    c.arc(sx(x), sy(e.y), r * s * (0.7 + pulse * 0.15), 0, TAU);
    c.fill();
    c.strokeStyle = rgba(hot ? GOLD : CYN, 0.7);
    c.lineWidth = Math.max(1, 1.2 * s);
    hexPath(c, sx(x), sy(e.y), (r + 3) * s);
    c.stroke();
  }

  function drawScout(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : MAG, 0.95);
    c.beginPath();
    c.moveTo(-10 * s, 0);
    c.lineTo(8 * s, -6 * s);
    c.lineTo(4 * s, 0);
    c.lineTo(8 * s, 6 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.8);
    c.fillRect(-2 * s, -1.4 * s, 6 * s, 2.8 * s);
    c.restore();
  }

  function drawDrone(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(G.t * 1.2 + e.phase);
    c.fillStyle = rgba(e.flash > 0 ? WHT : VIO, 0.95);
    hexPath(c, 0, 0, 11 * s);
    c.fill();
    c.restore();
    drawCore(e, x, 3.4);
  }

  function drawTurret(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : [52, 68, 112], 0.96);
    c.fillRect(-11 * s, -5 * s, 22 * s, 12 * s);
    c.fillStyle = rgba(BLU, 0.85);
    c.fillRect(-3 * s, e.top ? 0 : -12 * s, 6 * s, 10 * s);
    c.fillStyle = rgba(CYN, 0.8);
    c.beginPath();
    c.arc(0, e.top ? 8 * s : -12 * s, 3.4 * s, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawMine(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.strokeStyle = rgba(e.flash > 0 ? WHT : PNK, 0.95);
    c.lineWidth = Math.max(1.2, 2 * s);
    hexPath(c, 0, 0, 8 * s);
    c.stroke();
    c.restore();
    drawCore(e, x, 2.8);
  }

  function drawHeavy(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : [64, 48, 120], 0.96);
    c.beginPath();
    c.moveTo(-18 * s, 0);
    c.lineTo(-8 * s, -10 * s);
    c.lineTo(16 * s, -8 * s);
    c.lineTo(18 * s, 0);
    c.lineTo(16 * s, 8 * s);
    c.lineTo(-8 * s, 10 * s);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(BLU, 0.8);
    c.fillRect(8 * s, -3 * s, 12 * s, 6 * s);
    c.restore();
    drawCore(e, x, 4);
  }

  function drawCarry(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.fillStyle = rgba(e.flash > 0 ? WHT : GOLD, 0.92);
    c.fillRect(-16 * s, -7 * s, 32 * s, 14 * s);
    c.fillStyle = rgba(CYN, 0.9);
    hexPath(c, 0, 0, 6 * s);
    c.fill();
    c.restore();
  }

  function drawNode(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.fillStyle = rgba(e.flash > 0 ? WHT : BLU, 0.9);
    hexPath(c, 0, 0, 13 * s);
    c.fill();
    c.strokeStyle = rgba(CYN, 0.8);
    c.lineWidth = Math.max(1, 1.6 * s);
    hexPath(c, 0, 0, 13 * s);
    c.stroke();
    c.restore();
    drawCore(e, x, 4.4);
  }

  function drawCap(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    const rgb = e.kind === 'core' ? CYN : GOLD;
    c.fillStyle = rgba(rgb, 0.96);
    hexPath(c, 0, 0, 8 * s);
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.font = '700 ' + (9 * s) + 'px "Segoe UI","PingFang SC",sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.rotate(-e.spin);
    c.fillText(e.kind === 'core' ? '核' : '火', 0, 0.5 * s);
    c.restore();
  }

  function drawBoss(e, x) {
    const c = ctx;
    const s = scale;
    c.save();
    c.translate(sx(x), sy(e.y));
    const flash = e.flash > 0;
    if (e.kind === 'guard') {
      c.fillStyle = rgba(flash ? WHT : [40, 52, 96], 0.96);
      c.fillRect(-26 * s, -70 * s, 52 * s, 140 * s);
      for (let i = 0; i < 5; i++) {
        c.fillStyle = rgba(BLU, 0.35);
        c.fillRect(-18 * s, -58 * s + i * 24 * s, 10 * s, 8 * s);
        c.fillRect(8 * s, -50 * s + i * 24 * s, 10 * s, 8 * s);
      }
      c.fillStyle = rgba(DEEP, 1);
      c.fillRect(-12 * s, -16 * s, 20 * s, 24 * s);
      c.fillStyle = rgba(e.open > 0.42 ? GOLD : CYN, 0.4 + e.open * 0.55);
      c.beginPath();
      c.arc(-2 * s, -4 * s, (6 + e.open * 6) * s, 0, TAU);
      c.fill();
      c.strokeStyle = rgba(CYN, 0.7);
      c.lineWidth = Math.max(1, 1.6 * s);
      hexPath(c, -2 * s, -4 * s, 16 * s);
      c.stroke();
    } else if (e.kind === 'pivot') {
      c.fillStyle = rgba(flash ? WHT : [48, 40, 96], 0.96);
      c.beginPath();
      c.moveTo(-44 * s, 8 * s);
      c.lineTo(-24 * s, -26 * s);
      c.lineTo(34 * s, -22 * s);
      c.lineTo(46 * s, 6 * s);
      c.lineTo(28 * s, 28 * s);
      c.lineTo(-26 * s, 30 * s);
      c.closePath();
      c.fill();
      c.save();
      c.rotate(e.spin);
      c.strokeStyle = rgba(VIO, 0.85);
      c.lineWidth = Math.max(1, 2.2 * s);
      c.beginPath();
      c.arc(-4 * s, 0, 20 * s, 0, TAU);
      c.stroke();
      c.restore();
      c.fillStyle = rgba(DEEP, 1);
      c.beginPath();
      c.arc(-6 * s, 0, 12 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(e.open > 0.42 ? GOLD : CORE, 0.35 + e.open * 0.65);
      c.beginPath();
      c.arc(-6 * s, 0, (5 + e.open * 7) * s, 0, TAU);
      c.fill();
    } else {
      c.fillStyle = rgba(flash ? WHT : [44, 32, 88], 0.96);
      hexPath(c, 0, 0, 46 * s);
      c.fill();
      c.strokeStyle = rgba(CYN, 0.8);
      c.lineWidth = Math.max(1, 2.2 * s);
      hexPath(c, 0, 0, 46 * s);
      c.stroke();
      c.save();
      c.rotate(e.spin);
      c.strokeStyle = rgba(GOLD, 0.7);
      c.lineWidth = Math.max(1, 1.6 * s);
      c.beginPath();
      c.arc(0, 0, 22 * s, 0, TAU);
      c.stroke();
      c.restore();
      c.fillStyle = rgba(DEEP, 1);
      c.beginPath();
      c.arc(-4 * s, 0, 14 * s, 0, TAU);
      c.fill();
      c.fillStyle = rgba(e.open > 0.42 ? GOLD : CYN, 0.4 + e.open * 0.6);
      c.beginPath();
      c.arc(-4 * s, 0, (6 + e.open * 8) * s, 0, TAU);
      c.fill();
    }
    c.restore();
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      const x = scrX(e.wx);
      if (x < -70 || x > VW + 70) continue;
      if (e.type === 'scout') drawScout(e, x);
      else if (e.type === 'drone') drawDrone(e, x);
      else if (e.type === 'turret') drawTurret(e, x);
      else if (e.type === 'mine') drawMine(e, x);
      else if (e.type === 'heavy') drawHeavy(e, x);
      else if (e.type === 'carry') drawCarry(e, x);
      else if (e.type === 'node') drawNode(e, x);
      else if (e.type === 'cap') drawCap(e, x);
      else if (e.type === 'boss') drawBoss(e, x);
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = scrX(s.wx);
      c.fillStyle = rgba(CYN, 0.98);
      c.fillRect(sx(x), sy(s.y - 1.6), 10 * scale, 3.2 * scale);
      if (!REDUCE) {
        c.fillStyle = rgba(WHT, 0.5);
        c.fillRect(sx(x - 6), sy(s.y - 1), 6 * scale, 2 * scale);
      }
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = scrX(s.wx);
      c.fillStyle = rgba(s.r > 4.6 ? MAG : PNK, 0.95);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.7);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.r * 0.4 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawBossBar() {
    const b = findBoss();
    if (!b || !b.alive || !G.boss) return;
    const c = ctx;
    const w = 220;
    const x = (VW - w) * 0.5;
    const y = 14;
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(sx(x), sy(y), w * scale, 8 * scale);
    c.fillStyle = rgba(b.open > 0.42 ? GOLD : CYN, 0.9);
    c.fillRect(sx(x), sy(y), w * (b.hp / b.max) * scale, 8 * scale);
    c.strokeStyle = rgba(WHT, 0.4);
    c.lineWidth = Math.max(1, scale);
    c.strokeRect(sx(x), sy(y), w * scale, 8 * scale);
  }

  function drawChargeBar() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (!G.chgHold && !G.lance.on) return;
    const c = ctx;
    const need = chgNeed();
    const frac = clamp(G.chg / need.b, 0, 1);
    const w = 70;
    const x = G.px - 8;
    const y = G.py + 16;
    c.fillStyle = 'rgba(0,0,0,0.4)';
    c.fillRect(sx(x), sy(y), w * scale, 4 * scale);
    c.fillStyle = rgba(frac >= 1 ? GOLD : CYN, 0.9);
    c.fillRect(sx(x), sy(y), w * frac * scale, 4 * scale);
    const a = need.a / need.b;
    c.fillStyle = rgba(WHT, 0.6);
    c.fillRect(sx(x + w * a), sy(y - 1), 1.2 * scale, 6 * scale);
  }

  function drawPlayer() {
    if (G.deadT > 0) return;
    if (G.mode !== 'play' && G.mode !== 'win' && G.mode !== 'title') return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0 && G.mode === 'play') return;
    drawLance();
    drawShip(G.px, G.py, 1);
    drawChargeBar();
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      c.fillStyle = rgba(p.rgb, clamp(p.life / p.max, 0, 1));
      c.fillRect(sx(p.x - p.r * 0.5), sy(p.y - p.r * 0.5), p.r * scale, p.r * scale);
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const t = s.t / 0.28;
      c.fillStyle = rgba(s.rgb, 1 - t);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.rad * (0.4 + t) * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const t = r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, 1 - t);
      c.lineWidth = Math.max(1, 2 * scale * (1 - t));
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + t * 28) * scale, 0, TAU);
      c.stroke();
    }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      c.fillStyle = rgba(f.rgb, a);
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#060b1a';
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

    const g = c.createLinearGradient(sx(0), sy(0), sx(VW), sy(VH));
    if (G.stage === 2) {
      g.addColorStop(0, '#08101e');
      g.addColorStop(0.55, '#0a0c22');
      g.addColorStop(1, '#101028');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#0a0818');
      g.addColorStop(0.55, '#0c0820');
      g.addColorStop(1, '#140c28');
    } else {
      g.addColorStop(0, '#0a1228');
      g.addColorStop(0.55, '#060b1a');
      g.addColorStop(1, '#0c1830');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawRails();
    drawEnts();
    drawShots();
    drawPlayer();
    drawBossBar();
    drawFx();

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

  function resetRun(kind) {
    G.kind = kind || 'core';
    G.t = 0;
    G.cam = 0;
    G.px = 92;
    G.py = VH * 0.5;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.stage = 1;
    G.cleared = 0;
    G.nextLife = LIFE_EVERY;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.pow = 0;
    G.coreLv = 0;
    G.spawnedX = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.chg = 0;
    G.chgHold = false;
    G.chgLv = 0;
    G.chgPing = 0;
    G.lockId = 0;
    G.lance.on = false;
    G.lance.t = 0;
    G.deadT = 0;
    G.invuln = 0;
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
    G.chainWave = 0;
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    eid = 1;
  }

  function startGame(kind) {
    resetRun(kind || 'core');
    G.mode = 'play';
    hideOverlay();
    audio.start();
    toast(isRail() ? '核轨' : '星核', false, true);
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('core');
    G.mode = 'title';
    showOverlay('title', '星核', '沿轨道突袭。空格连射，Shift 蓄核束打穿核心。满核连锁爆。撞机、中弹、擦轨都掉命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else startGame(G.kind || 'core');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('core');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
  }

  function holdCharge(on) {
    if (on) {
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      if (G.mode === 'play' && G.deadT <= 0 && !G.lance.on) {
        G.chgHold = true;
        if (btnBeam) btnBeam.classList.add('held');
        if (btnPad) btnPad.classList.add('held');
        syncHud();
      }
    } else {
      if (btnBeam) btnBeam.classList.remove('held');
      if (btnPad) btnPad.classList.remove('held');
      if (G.chgHold) fireLance();
    }
  }

  function onKey(e, down) {
    const k = e.key;
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
    const space = k === ' ' || k === 'Spacebar' || e.code === 'Space';
    const beamKey = k === 'z' || k === 'Z' || k === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || beamKey)) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      if (beamKey) holdCharge(false);
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || beamKey)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (beamKey) {
      holdCharge(true);
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'rail' : 'core');
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
      if (e.button === 2) {
        e.preventDefault();
        holdCharge(true);
        return;
      }
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 10, VH - 10);
      if (!pointer.down && e.pointerType === 'mouse') pointer.hover = true;
      if (pointer.down || e.pointerType === 'mouse') inputSrc = 'ptr';
    });
    function up(e) {
      if (pointer.id != null && e.pointerId !== pointer.id && pointer.down) return;
      pointer.down = false;
      pointer.id = null;
      G.fireHold = false;
      if (e && e.button === 2) holdCharge(false);
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

  function bindBeamBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      holdCharge(true);
    });
    el.addEventListener('pointerup', function (e) {
      e.preventDefault();
      holdCharge(false);
    });
    el.addEventListener('pointercancel', function () { holdCharge(false); });
    el.addEventListener('pointerleave', function () {
      if (G.chgHold) holdCharge(false);
    });
  }

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
    });
  }
  if (btnRail) {
    btnRail.addEventListener('click', function () {
      audio.ensure();
      startGame('rail');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'core');
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
  bindBeamBtn(btnBeam);
  bindBeamBtn(btnPad);

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    G.fireHold = false;
    if (G.chgHold) holdCharge(false);
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = keys.u = keys.d = false;
      G.fireHold = false;
      if (G.chgHold) holdCharge(false);
    }
  });

  requestAnimationFrame(frame);
})();
