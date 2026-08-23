'use strict';

(function () {
  const VW = 800;
  const VH = 450;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 16000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.32;
  const POW_MAX = 2;
  const TENT_MAX = 2;
  const BOSS_AT = [2650, 5750, 9300];
  const BEST_KEY = 'playbox-xexex-best';
  const MUTE_KEY = 'playbox-xexex-mute';
  const OPS = '←↑↓→ / WASD 飞 · 空格射击 · Shift / Z 抓 · R 重开 · M 静音';
  const STAGE_NAME = ['潮庭', '茧廊', '核巢'];
  const BOSS_NAME = ['藻眼', '茧母', '触核'];
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const TEAL = [46, 232, 192];
  const MINT = [125, 255, 200];
  const GOLD = [255, 227, 107];
  const MAG = [255, 78, 168];
  const WHT = [232, 255, 248];
  const HOT = [61, 255, 208];
  const PNK = [255, 154, 214];
  const DEEP = [6, 36, 28];

  const SCORE = {
    jelly: 50, spore: 40, dart: 80, worm: 130,
    shell: 90, tent: 170, carrier: 280, boss: 2800
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
  const btnXexex = document.getElementById('btn-xexex');
  const btnCore = document.getElementById('btn-core');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnGrab = document.getElementById('btn-grab');
  const btnPad = document.getElementById('btn-pad');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const grabLabel = document.getElementById('grab-label');
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
  let kickTok = 0;
  let eid = 1;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: 96, y: VH * 0.5, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];
  const wisps = [];

  const G = {
    mode: 'title',
    kind: 'xexex',
    t: 0,
    cam: 0,
    px: 96,
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
    spawnedX: 0,
    fireCd: 0,
    fireHold: false,
    flint: {
      state: 'dock', x: 114, y: VH * 0.5, vx: 0, vy: 0,
      lv: 0, grabT: 0, grabCd: 0, tick: 0, crush: 0, spin: 0, pulse: 0
    },
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: TEAL,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    boss: false,
    winT: 0,
    engine: 0
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
  function isCore() {
    return G.kind === 'core';
  }
  function pwx() {
    return G.cam + G.px;
  }
  function fwx() {
    return G.cam + G.flint.x;
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
  function tentCount() {
    return 1 + G.flint.lv;
  }
  function tentReach() {
    const lv = G.flint.lv;
    if (G.flint.grabT > 0) return 88 + lv * 16;
    if (G.flint.state === 'dock') return 40 + lv * 9;
    return 36 + lv * 8;
  }
  function scrollSpd() {
    if (G.boss) return isCore() ? 36 : 18;
    return isCore() ? 146 : 100;
  }
  function moveSpd() {
    return (isCore() ? 318 : 276) + G.pow * 10;
  }
  function fireGap() {
    return (isCore() ? 0.082 : 0.096) - G.pow * 0.006;
  }
  function caveAt(wx) {
    const st = stageAt(wx);
    const n1 = fbm(wx / 168, 5);
    const n2 = fbm(wx / 152, 14);
    let top = 8 + n1 * (st === 1 ? 16 : st === 2 ? 34 : 50);
    let bot = VH - 10 - n2 * (st === 1 ? 14 : st === 2 ? 30 : 46);
    if (wx < 340) {
      const t = wx / 340;
      top = lerp(10, top, t);
      bot = lerp(VH - 14, bot, t);
    }
    if (G.boss) {
      top = Math.min(top, 26);
      bot = Math.max(bot, VH - 28);
    }
    const gap = G.boss ? 92 : 96;
    if (top > bot - gap) {
      const mid = (top + bot) * 0.5;
      top = mid - gap * 0.5;
      bot = mid + gap * 0.5;
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
      this.beep(820, 0.04, 'square', 0.024, 1640);
    },
    hit(combo) {
      this.ensure();
      const lift = 1 + Math.min(0.62, combo * 0.04);
      this.noise(0.034, 0.03, 1400);
      this.beep(540 * lift, 0.068, 'square', 0.036, 900 * lift);
    },
    grab() {
      this.ensure();
      this.noise(0.09, 0.046, 420);
      this.beep(220, 0.16, 'sawtooth', 0.046, 880);
      this.beep(660, 0.1, 'triangle', 0.03, 1320);
    },
    recall() {
      this.ensure();
      this.beep(494, 0.08, 'square', 0.038, 740);
      this.beep(988, 0.12, 'sine', 0.03, 1480);
    },
    dock() {
      this.ensure();
      this.beep(392, 0.06, 'square', 0.036, 622);
      this.beep(622, 0.1, 'triangle', 0.032, 988);
    },
    crush(n) {
      this.ensure();
      const f = 620 * (1 + Math.min(0.7, n * 0.12));
      this.beep(f, 0.08, 'square', 0.042, f * 1.5);
      this.beep(f * 0.5, 0.11, 'sine', 0.028, f);
      this.noise(0.05, 0.034, 700);
    },
    block() {
      this.ensure();
      this.beep(1280, 0.04, 'triangle', 0.022, 1840);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.036, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.026, 1320);
    },
    option() {
      this.ensure();
      this.beep(415, 0.07, 'square', 0.04, 622);
      this.beep(622, 0.09, 'triangle', 0.036, 830);
      this.beep(830, 0.14, 'sine', 0.034, 1244);
    },
    pow() {
      this.ensure();
      this.beep(392, 0.07, 'square', 0.038, 784);
      this.beep(784, 0.12, 'triangle', 0.032, 1175);
    },
    death() {
      this.ensure();
      this.noise(0.18, 0.064, 260);
      this.beep(290, 0.22, 'sawtooth', 0.048, 66);
      this.beep(145, 0.34, 'sine', 0.04, 42);
    },
    up() {
      this.ensure();
      this.beep(523, 0.08, 'square', 0.044, 784);
      this.beep(784, 0.12, 'triangle', 0.038, 1046);
    },
    boom() {
      this.ensure();
      this.noise(0.22, 0.078, 170);
      this.beep(170, 0.28, 'sawtooth', 0.052, 52);
      this.beep(86, 0.4, 'sine', 0.038, 38);
    },
    check() {
      this.ensure();
      this.beep(370, 0.09, 'sine', 0.038, 494);
      this.beep(622, 0.16, 'triangle', 0.038, 830);
    },
    win() {
      this.ensure();
      this.beep(523, 0.12, 'square', 0.048, 784);
      this.beep(784, 0.16, 'triangle', 0.042, 1046);
      this.beep(1046, 0.28, 'sine', 0.038, 1568);
    },
    lose() {
      this.ensure();
      this.beep(208, 0.18, 'sawtooth', 0.038, 86);
      this.beep(130, 0.3, 'sine', 0.048, 46);
    },
    start() {
      this.ensure();
      this.beep(311, 0.09, 'square', 0.038, 622);
      this.beep(622, 0.14, 'triangle', 0.033, 933);
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

  function grabWord() {
    if (G.flint.grabT > 0) return G.flint.crush > 0 ? '抓' : '甩';
    if (G.flint.state === 'fly') return '放';
    if (G.flint.state === 'recall') return '回';
    return '触 ×' + tentCount();
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.score);
    if (bestEl) bestEl.textContent = String(G.best);
    if (stageLabel) {
      if (G.mode === 'title') stageLabel.textContent = '泽泽';
      else if (G.boss) stageLabel.textContent = BOSS_NAME[G.stage - 1] || '触核';
      else stageLabel.textContent = '第 ' + G.stage + ' 关 · ' + (STAGE_NAME[G.stage - 1] || '');
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.stage >= 3 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isCore() ? '触核' : '泽泽';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1 || isCore());
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (grabLabel) {
      grabLabel.textContent = grabWord();
      grabLabel.className = 'grab'
        + (G.flint.grabT > 0 ? ' lash'
          : G.flint.state === 'recall' ? ' hold'
            : G.flint.state !== 'dock' ? ' out' : '');
    }
    if (powLabel) {
      powLabel.textContent = '火 ' + (G.pow + 1) + ' · 触' + tentCount();
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
    else if (G.mode === 'lose') setHint('R 重开 · 空格射击，Shift 抓触核', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 触核打穿', 'hot');
    else if (G.lives === 1) setHint('最后一命 · 撞机、中弹、擦壁都掉命', 'warn');
    else if (G.flint.grabT > 0) setHint('触手甩出 · 抓住就碎', 'hot');
    else if (G.flint.state === 'fly') setHint('触核在外 · Shift 接回扫弹', 'hot');
    else if (G.flint.state === 'recall') setHint('触核飞回 · 路上抓敌', '');
    else setHint('空格连射 · Shift 甩触核抓敌 · 接回扫弹', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'XEXE';
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
      floatText(G.px + 40, G.py - 18, G.mult + ' 链', GOLD, true);
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

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 96; i++) {
      stars.push({
        wx: rand(0, VW * 3),
        y: rand(0, VH),
        p: rand(0.18, 0.92),
        s: rand(0.7, 2.4),
        hue: Math.random() > 0.72 ? MAG : (Math.random() > 0.5 ? TEAL : MINT)
      });
    }
  }

  function spawnJelly(wx, y, n) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 24, cave.bot - 24);
    const dens = isCore();
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'jelly',
        wx: wx + i * 22,
        y: y + (i - (n - 1) * 0.5) * 12,
        hw: 11, hh: 9, hp: 1,
        vx: -(dens ? 86 : 64),
        phase: i * 0.7,
        cd: rand(0.6, 1.6)
      });
    }
  }

  function spawnSpore(wx, y, n) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 20, cave.bot - 20);
    for (let i = 0; i < n; i++) {
      pushEnt({
        type: 'spore',
        wx: wx + i * 16,
        y: y + Math.sin(i * 1.3) * 18,
        hw: 7, hh: 7, hp: 1,
        vx: -(isCore() ? 78 : 58),
        phase: rand(0, TAU)
      });
    }
  }

  function spawnDart(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 20, cave.bot - 20);
    pushEnt({
      type: 'dart',
      wx: wx, y: y,
      hw: 13, hh: 6, hp: isCore() ? 2 : 1,
      vx: -(isCore() ? 216 : 172),
      phase: rand(0, TAU)
    });
  }

  function spawnWorm(wx, top) {
    const cave = caveAt(wx);
    pushEnt({
      type: 'worm',
      wx: wx,
      y: top ? cave.top + 14 : cave.bot - 14,
      hw: 16, hh: 8,
      hp: isCore() ? 5 : 4,
      top: !!top,
      vx: -(isCore() ? 54 : 42),
      phase: 0,
      segs: 4
    });
  }

  function spawnShell(wx, top) {
    const cave = caveAt(wx);
    pushEnt({
      type: 'shell',
      wx: wx,
      y: top ? cave.top + 12 : cave.bot - 12,
      hw: 12, hh: 10,
      hp: isCore() ? 4 : 3,
      top: !!top,
      cd: rand(0.5, 1.2)
    });
  }

  function spawnTent(wx, top) {
    const cave = caveAt(wx);
    pushEnt({
      type: 'tent',
      wx: wx,
      y: top ? cave.top + 8 : cave.bot - 8,
      hw: 10, hh: 22,
      hp: isCore() ? 6 : 5,
      top: !!top,
      phase: rand(0, TAU),
      lash: 0,
      cd: rand(0.8, 1.6)
    });
  }

  function spawnCarrier(wx, y) {
    const cave = caveAt(wx);
    y = clamp(y, cave.top + 30, cave.bot - 30);
    pushEnt({
      type: 'carrier',
      wx: wx, y: y,
      hw: 16, hh: 12,
      hp: isCore() ? 8 : 6,
      vx: -(isCore() ? 50 : 38),
      phase: 0,
      drop: false,
      cd: rand(0.7, 1.3)
    });
  }

  function spawnCap(wx, y, kind) {
    pushEnt({
      type: 'cap',
      kind: kind || 'pow',
      wx: wx, y: y,
      hw: 9, hh: 9, hp: 1,
      spin: 0,
      vy: rand(-14, 14)
    });
  }

  function spawnBoss(stage) {
    const cave = caveAt(G.cam + VW * 0.78);
    const mid = (cave.top + cave.bot) * 0.5;
    const dens = isCore();
    const kinds = ['eye', 'mother', 'core'];
    const hps = dens ? [90, 120, 174] : [72, 96, 140];
    pushEnt({
      type: 'boss',
      kind: kinds[stage - 1] || 'core',
      wx: G.cam + VW + 40,
      y: mid,
      hw: stage === 3 ? 38 : 30,
      hh: stage === 3 ? 36 : 28,
      hp: hps[stage - 1],
      max: hps[stage - 1],
      phase: 0,
      spin: 0,
      open: 0.4,
      vy: 40,
      cd: 1.1
    });
    G.boss = true;
    toast(BOSS_NAME[stage - 1], false, true);
    audio.check();
    syncHud();
  }

  function spawnSlice(wx) {
    if (G.boss) return;
    if (wx < 240) return;
    const nearBoss = BOSS_AT[G.cleared];
    if (nearBoss != null && wx > nearBoss - 180) return;
    const st = stageAt(wx);
    const slice = (wx / 50) | 0;
    const h = hash2(slice * 19 + (isCore() ? 7 : 3) + G.stage * 11);
    const cave = caveAt(wx);
    const mid = (cave.top + cave.bot) * 0.5;
    const dens = isCore() ? 0.76 : 1;

    if (slice % (isCore() ? 3 : 4) === 0 && h > 0.12 * dens) {
      const y = lerp(cave.top + 36, cave.bot - 36, hash2(slice + 44));
      spawnJelly(wx, y, (isCore() ? 4 : 3) + (st === 3 ? 1 : 0));
    }
    if (slice % (isCore() ? 5 : 6) === 0 && h > 0.26 * dens) {
      const y = lerp(cave.top + 28, cave.bot - 28, hash2(slice + 71));
      spawnSpore(wx, y, (isCore() ? 5 : 4) + (st > 1 ? 1 : 0));
    }
    if (st >= 1 && slice % 7 === 2 && h > 0.38 * dens) {
      spawnDart(wx, mid + (h - 0.5) * 80);
    }
    if (st >= 2 && slice % 8 === 3 && h > 0.4) {
      spawnShell(wx, hash2(slice + 9) > 0.5);
      if (isCore() && hash2(slice + 21) > 0.55) spawnShell(wx + 40, hash2(slice + 9) <= 0.5);
    }
    if (st >= 2 && slice % 9 === 5 && h > 0.42) {
      spawnWorm(wx, hash2(slice + 17) > 0.5);
    }
    if (st >= 2 && slice % 11 === 4 && h > 0.36) {
      spawnTent(wx, hash2(slice + 3) > 0.5);
    }
    if (st >= 2 && slice % 13 === 6 && h > 0.38) {
      spawnCarrier(wx, mid + (hash2(slice + 5) - 0.5) * 50);
    }
    if (st === 3 && slice % 10 === 1 && h > 0.3) {
      spawnJelly(wx, mid, isCore() ? 5 : 4);
    }
  }

  function trySpawn() {
    const ahead = G.cam + VW + 40;
    while (G.spawnedX < ahead) {
      G.spawnedX += 50;
      spawnSlice(G.spawnedX);
    }
    if (!G.boss && G.cleared < 3 && G.cam + VW * 0.62 >= BOSS_AT[G.cleared]) {
      spawnBoss(G.cleared + 1);
    }
  }

  function enemyShot(wx, y, vx, vy, r) {
    G.eShots.push({ wx: wx, y: y, vx: vx, vy: vy, r: r || 3.2, life: 3.6 });
    capArr(G.eShots, 120);
  }

  function aimShot(e, spd, r, spread, n) {
    const dx = pwx() - e.wx;
    const dy = G.py - e.y;
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(dy, dx) + (i - (n - 1) * 0.5) * spread;
      enemyShot(e.wx, e.y, Math.cos(a) * spd, Math.sin(a) * spd, r);
    }
  }

  function collectCap(e) {
    e.alive = false;
    const x = scrX(e.wx);
    if (e.kind === 'tent') {
      if (G.flint.lv < TENT_MAX) {
        G.flint.lv += 1;
        toast('触手 +', false, true);
        audio.option();
      } else {
        addScore(400 * G.mult);
        floatText(x, e.y, '+400', GOLD, true);
        audio.pow();
      }
    } else {
      if (G.pow < POW_MAX) {
        G.pow += 1;
        toast('火力 +', false, true);
        audio.pow();
      } else {
        addScore(300 * G.mult);
        floatText(x, e.y, '+300', GOLD, false);
        audio.pow();
      }
    }
    explode(x, e.y, e.kind === 'tent' ? MAG : GOLD, 10);
    hitStop(0.04);
    kick(2.4);
    syncHud();
  }

  function maybeDrop(e) {
    if (e.type === 'carrier') {
      spawnCap(e.wx, e.y, hash2(e.id + 4) > 0.4 ? 'tent' : 'pow');
      return;
    }
    if (e.type === 'worm' || e.type === 'tent') {
      if (hash2(e.id) > 0.55) spawnCap(e.wx, e.y, hash2(e.id + 2) > 0.45 ? 'tent' : 'pow');
      return;
    }
    if (e.type === 'dart' && hash2(e.id) > 0.72) spawnCap(e.wx, e.y, 'pow');
    else if (hash2(e.id + 8) > 0.88) spawnCap(e.wx, e.y, hash2(e.id + 2) > 0.5 ? 'tent' : 'pow');
  }

  function killEnt(e, fromGrab) {
    if (!e.alive) return;
    e.alive = false;
    const x = scrX(e.wx);
    bumpCombo();
    const base = SCORE[e.type] || 50;
    let pts = (base * G.mult) | 0;
    if (fromGrab && e.type !== 'boss') {
      G.flint.crush += 1;
      if (G.flint.crush >= 2) {
        pts += (50 * G.flint.crush * G.mult) | 0;
        floatText(x, e.y - 10, '连抓', GOLD, true);
        audio.crush(G.flint.crush);
      } else {
        floatText(x, e.y - 8, '抓', MAG, true);
      }
    }
    addScore(pts);
    floatText(x, e.y, '+' + pts, fromGrab ? GOLD : TEAL, fromGrab);
    explode(x, e.y, e.type === 'boss' ? GOLD : (fromGrab ? MAG : HOT), e.type === 'boss' ? 42 : 16);
    audio.hit(G.combo);
    hitStop(e.type === 'boss' ? 0.062 : fromGrab ? 0.048 : 0.034);
    kick(e.type === 'boss' ? 5.5 : fromGrab ? 3.1 : 2.2);
    if (e.type !== 'boss' && e.type !== 'cap') maybeDrop(e);
    if (e.type === 'boss') onBossDown(e);
  }

  function onBossDown(e) {
    G.boss = false;
    G.cleared += 1;
    screenFlash(GOLD, 0.55);
    addScore((1400 * G.stage * G.mult) | 0);
    audio.boom();
    toast(STAGE_NAME[G.stage - 1] + ' 肃清', false, true);
    if (G.cleared >= 3) {
      addScore(isCore() ? 7500 : 6000);
      G.winT = 1.28;
      G.invuln = 1.4;
    } else {
      G.stage = G.cleared + 1;
      syncHud();
    }
  }

  function hurt(e, dmg, x, y, fromGrab) {
    if (!e.alive || e.type === 'cap') return;
    if (e.type === 'boss' && e.open < 0.4 && !fromGrab) {
      emit(3, {
        x: x, y: y, j: 3,
        vx0: -40, vx1: 20, vy0: -40, vy1: 40,
        life: 0.12, r0: 1, r1: 2, rgb: WHT, g: 0
      });
      return 'block';
    }
    if (e.type === 'boss' && fromGrab) {
      dmg = e.open < 0.4 ? Math.max(1, dmg * 0.55) : dmg + 1;
    }
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.hp <= 0) {
      killEnt(e, fromGrab);
      return true;
    }
    bumpCombo();
    audio.hit(G.combo);
    hitStop(fromGrab ? 0.042 : 0.030);
    kick(fromGrab ? 2.6 : 1.6);
    emit(4, {
      x: x, y: y, j: 4,
      vx0: -80, vx1: 60, vy0: -70, vy1: 70,
      life: 0.18, r0: 1, r1: 2.4, rgb: fromGrab ? GOLD : TEAL, g: 40
    });
    return true;
  }

  function killPlayer() {
    if (G.deadT > 0 || G.invuln > 0) return;
    G.lives -= 1;
    G.deadT = 0.92;
    G.flint.state = 'dock';
    G.flint.grabT = 0;
    G.fireHold = false;
    breakCombo();
    explode(G.px, G.py, MAG, 36);
    explode(G.flint.x, G.flint.y, GOLD, 18);
    screenFlash(MAG, 0.5);
    hitStop(0.072);
    kick(7.2);
    audio.death();
    G.eShots.length = 0;
    if (G.pow > 0) G.pow -= 1;
    if (G.flint.lv > 0) {
      G.flint.lv -= 1;
      spawnCap(pwx() + 20, G.py, 'tent');
    }
    syncHud();
  }

  function respawn() {
    G.px = 96;
    const cave = caveAt(pwx());
    G.py = clamp((cave.top + cave.bot) * 0.5, cave.top + 24, cave.bot - 24);
    G.flint.x = G.px + 18;
    G.flint.y = G.py;
    G.flint.state = 'dock';
    G.flint.vx = 0;
    G.flint.vy = 0;
    G.invuln = 1.48;
    G.deadT = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    syncHud();
  }

  function winGame() {
    G.mode = 'win';
    G.winT = 0;
    audio.win();
    showOverlay(
      'win',
      isCore() ? '触核通关' : '泽泽打穿',
      '触核被抓住撕开。分数 ' + G.score + (G.score >= G.best ? ' · 新纪录' : '') + '。R 再开一局。'
    );
    syncHud();
  }

  function loseGame() {
    G.mode = 'lose';
    audio.lose();
    showOverlay(
      'lose',
      '舰毁了',
      (G.why || '撞机、中弹或擦壁。') + ' 分数 ' + G.score + '。R 重开。'
    );
    syncHud();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (G.fireCd > 0) return;
    G.fireCd = fireGap();
    G.muzzle = 0.05;
    const n = 1 + G.pow;
    const fromShip = G.flint.state !== 'dock';
    const wx = (fromShip ? pwx() : fwx()) + 16;
    const y = fromShip ? G.py : G.flint.y;
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) * 0.5) * 7;
      G.shots.push({
        wx: wx, y: y + off, vx: 640, r: 2.5, life: 1.2
      });
    }
    capArr(G.shots, 80);
    audio.shoot();
  }

  function tentDir() {
    if (G.flint.state === 'recall') {
      return Math.atan2(G.py - G.flint.y, (G.px + 16) - G.flint.x);
    }
    return 0;
  }

  function tentPoint(i, u) {
    const n = tentCount();
    const reach = tentReach();
    const dir = tentDir();
    const spread = (i - (n - 1) * 0.5) * (0.58 - n * 0.05);
    const wob = Math.sin(G.t * 7.4 + i * 2.15 + u * 4.2) * (11 + (G.flint.grabT > 0 ? 9 : 0));
    const ang = dir + spread + wob * 0.045;
    const len = reach * u;
    return {
      x: G.flint.x + Math.cos(ang) * len,
      y: G.flint.y + Math.sin(ang) * len + Math.sin(G.t * 9.2 + i + u * 3.1) * 7 * u
    };
  }

  function eachTentPoint(fn) {
    const n = tentCount();
    for (let i = 0; i < n; i++) {
      for (let s = 1; s <= 5; s++) {
        fn(tentPoint(i, s / 5), i, s / 5);
      }
    }
  }

  function crushable(e) {
    return e.type === 'jelly' || e.type === 'spore' || e.type === 'dart'
      || (e.type !== 'boss' && e.hp <= 3);
  }

  function grabPulse() {
    G.flint.crush = 0;
    const reach = tentReach();
    const thick = 12 + G.flint.lv * 4;
    const pulse = {};
    eachTentPoint(function (p) {
      const wx = G.cam + p.x;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive || e.type === 'cap' || pulse[e.id]) continue;
        if (Math.abs(e.wx - wx) < e.hw + thick && Math.abs(e.y - p.y) < e.hh + thick) {
          pulse[e.id] = true;
          if (crushable(e) && hypot(e.wx - fwx(), e.y - G.flint.y) < reach + 18) {
            killEnt(e, true);
          } else {
            hurt(e, 3, scrX(e.wx), e.y, true);
          }
        }
      }
    });
    const fx = G.flint.x;
    const fy = G.flint.y;
    for (let k = 0; k < G.ents.length; k++) {
      const e = G.ents[k];
      if (!e.alive || e.type === 'cap' || pulse[e.id]) continue;
      if (aabb(fwx(), fy, reach * 0.42, 16 + G.flint.lv * 4, e.wx, e.y, e.hw, e.hh)) {
        pulse[e.id] = true;
        if (crushable(e)) killEnt(e, true);
        else hurt(e, 3, scrX(e.wx), e.y, true);
      }
    }
    if (G.flint.crush >= 2) {
      toast('连抓 ×' + G.flint.crush, false, true);
    }
    syncHud();
  }

  function doGrab() {
    audio.ensure();
    if (overlayOpen()) {
      primaryAction();
      return;
    }
    if (G.mode !== 'play' || G.deadT > 0 || G.winT > 0) return;
    if (G.flint.grabCd > 0) return;
    G.flint.grabCd = 0.2;
    if (G.flint.state === 'dock') {
      G.flint.state = 'fly';
      G.flint.vx = 460;
      G.flint.vy = 0;
      G.flint.grabT = 0.24;
      G.flint.pulse = 1;
      grabPulse();
      audio.grab();
      hitStop(0.05);
      kick(3.4);
      screenFlash(TEAL, 0.22);
      floatText(G.flint.x + 24, G.flint.y - 16, '甩', GOLD, true);
      popSpark(G.flint.x + 20, G.flint.y, GOLD, 18);
    } else {
      G.flint.state = 'recall';
      G.flint.grabT = 0.2;
      G.flint.pulse = 1;
      grabPulse();
      audio.recall();
      hitStop(0.038);
      kick(2.4);
      floatText(G.flint.x, G.flint.y - 14, '回', MINT, false);
    }
    if (btnGrab) {
      btnGrab.classList.add('held');
      setTimeout(function () { if (btnGrab) btnGrab.classList.remove('held'); }, 140);
    }
    if (btnPad) {
      btnPad.classList.add('held');
      setTimeout(function () { if (btnPad) btnPad.classList.remove('held'); }, 140);
    }
    syncHud();
  }

  function dockFlint() {
    G.flint.state = 'dock';
    G.flint.x = G.px + 18;
    G.flint.y = G.py;
    G.flint.vx = 0;
    G.flint.vy = 0;
    audio.dock();
    popSpark(G.flint.x, G.flint.y, TEAL, 12);
    hitStop(0.028);
    kick(1.6);
    syncHud();
  }

  function updateFlint(dt) {
    const f = G.flint;
    f.spin += dt * 4.2;
    if (f.grabCd > 0) f.grabCd -= dt;
    if (f.grabT > 0) f.grabT -= dt;
    if (f.pulse > 0) f.pulse = Math.max(0, f.pulse - dt * 3.2);
    const cave = caveAt(G.cam + f.x);

    if (f.state === 'dock') {
      f.x = lerp(f.x, G.px + 18, 0.35);
      f.y = lerp(f.y, G.py, 0.35);
    } else if (f.state === 'fly') {
      const tx = clamp(G.px + 168, 50, VW - 28);
      const ty = G.py;
      f.vx += (tx - f.x) * 6.4 * dt;
      f.vy += (ty - f.y) * 6.4 * dt;
      f.vx *= Math.pow(0.12, dt);
      f.vy *= Math.pow(0.12, dt);
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.x = clamp(f.x, 36, VW - 22);
      if (f.y < cave.top + 14) { f.y = cave.top + 14; f.vy *= -0.4; }
      if (f.y > cave.bot - 14) { f.y = cave.bot - 14; f.vy *= -0.4; }
    } else if (f.state === 'recall') {
      const tx = G.px + 18;
      const ty = G.py;
      const dx = tx - f.x;
      const dy = ty - f.y;
      const d = hypot(dx, dy);
      const spd = 560;
      if (d < 16) {
        dockFlint();
      } else {
        f.x += dx / d * spd * dt;
        f.y += dy / d * spd * dt;
      }
    }

    f.tick += dt;
    if (f.tick >= 0.055 && G.mode === 'play' && G.deadT <= 0) {
      f.tick = 0;
      const thick = f.grabT > 0 ? 11 + f.lv * 3 : 7 + f.lv * 2;
      const pulse = {};
      const fromGrab = f.grabT > 0;
      const dmg = fromGrab ? 2 : 1;
      eachTentPoint(function (p) {
        const wx = G.cam + p.x;
        for (let i = G.eShots.length - 1; i >= 0; i--) {
          const s = G.eShots[i];
          if (s.r > 5.6) continue;
          if (Math.abs(s.wx - wx) < 10 && Math.abs(s.y - p.y) < thick + 2) {
            emit(2, {
              x: p.x, y: s.y, j: 2,
              vx0: -20, vx1: 40, vy0: -30, vy1: 30,
              life: 0.12, r0: 1, r1: 2, rgb: MINT, g: 0
            });
            G.eShots.splice(i, 1);
            audio.block();
          }
        }
        for (let k = 0; k < G.ents.length; k++) {
          const e = G.ents[k];
          if (!e.alive || e.type === 'cap' || pulse[e.id]) continue;
          if (Math.abs(e.wx - wx) < e.hw + 7 && Math.abs(e.y - p.y) < e.hh + thick) {
            pulse[e.id] = true;
            if (fromGrab && crushable(e)) killEnt(e, true);
            else hurt(e, dmg, scrX(e.wx), e.y, fromGrab);
          }
        }
      });
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive || e.type !== 'cap') continue;
        if (aabb(fwx(), f.y, 14, 12, e.wx, e.y, e.hw, e.hh)) collectCap(e);
      }
    }

    if (!REDUCE && G.mode === 'play' && f.state !== 'dock') {
      wisps.push({
        x: f.x - 4, y: f.y + rand(-3, 3),
        vx: -40, vy: rand(-18, 18),
        t: 0, life: 0.22, rgb: f.grabT > 0 ? GOLD : MAG
      });
      capArr(wisps, 48);
    }
  }

  function updatePlayer(dt) {
    const spd = moveSpd();
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      dx = pointer.x - G.px;
      dy = pointer.y - G.py;
      const d = hypot(dx, dy);
      const max = spd * dt;
      if (d > max && d > 0.001) {
        dx = dx / d * max;
        dy = dy / d * max;
      }
    } else {
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) dy -= 1;
      if (keys.d) dy += 1;
      if (dx || dy) {
        const d = hypot(dx, dy);
        dx = dx / d * spd * dt;
        dy = dy / d * spd * dt;
      }
    }
    G.px = clamp(G.px + dx, 28, 420);
    G.py = clamp(G.py + dy, 16, VH - 16);
    const cave = caveAt(pwx());
    if (G.py < cave.top + 12 || G.py > cave.bot - 12) {
      G.why = '擦壁。';
      killPlayer();
      return;
    }
    G.py = clamp(G.py, cave.top + 12, cave.bot - 12);
    G.engine += dt;
    if (!REDUCE && G.engine > 0.03) {
      G.engine = 0;
      wisps.push({
        x: G.px - 16, y: G.py + rand(-2, 2),
        vx: -80, vy: rand(-12, 12),
        t: 0, life: 0.28, rgb: G.flint.state !== 'dock' ? GOLD : TEAL
      });
      capArr(wisps, 48);
    }
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      s.wx += s.vx * dt;
      s.life -= dt;
      const x = scrX(s.wx);
      if (s.life <= 0 || x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      let gone = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive || e.type === 'cap') continue;
        if (!aabb(s.wx, s.y, s.r + 2, s.r, e.wx, e.y, e.hw, e.hh)) continue;
        const hit = hurt(e, 1, x, s.y, false);
        if (hit) {
          gone = true;
          break;
        }
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
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.winT <= 0) {
        if (aabb(s.wx, s.y, s.r, s.r, pwx(), G.py, 7.2, 4.6)) {
          G.eShots.splice(i, 1);
          G.why = '中弹。';
          killPlayer();
        }
      }
    }
  }

  function updateBoss(e, dt, x) {
    const half = e.hp < e.max * 0.5;
    const dens = isCore();
    e.phase += dt;
    e.spin += (half ? 2.5 : 1.45) * dt;
    const cave = caveAt(e.wx);
    const mid = (cave.top + cave.bot) * 0.5;
    if (e.kind === 'eye') {
      e.wx = lerp(e.wx, G.cam + VW * 0.74, 0.04);
      e.y = lerp(e.y, mid + Math.sin(e.phase * 1.15) * 36, 0.08);
      e.y = clamp(e.y, cave.top + 64, cave.bot - 64);
      e.open = 0.26 + (Math.sin(e.phase * 1.5) * 0.5 + 0.5) * 0.74;
    } else if (e.kind === 'mother') {
      e.wx = lerp(e.wx, G.cam + VW * 0.72, 0.04);
      e.y = lerp(e.y, mid + Math.sin(e.phase * 0.85) * 42, 0.08);
      e.open = 0.22 + (Math.sin(e.phase * 1.28) * 0.5 + 0.5) * 0.78;
    } else {
      e.wx = lerp(e.wx, G.cam + VW * 0.7, 0.035);
      e.y += e.vy * dt;
      if (e.y < cave.top + 52 || e.y > cave.bot - 52) e.vy *= -1;
      e.y = clamp(e.y, cave.top + 50, cave.bot - 50);
      e.open = 0.18 + (Math.sin(e.phase * (half ? 1.85 : 1.18)) * 0.5 + 0.5) * 0.82;
    }
    e.cd -= dt;
    if (e.cd > 0 || x < 40 || x > VW + 20) return;
    const rate = (dens ? 0.76 : 1) * (half ? 0.72 : 1);
    if (e.kind === 'eye') {
      e.cd = (half ? 0.58 : 0.84) * rate;
      aimShot(e, dens ? 178 : 150, 3.4, 0.2, half ? 5 : 3);
    } else if (e.kind === 'mother') {
      e.cd = (half ? 0.46 : 0.68) * rate;
      const n = half ? 10 : 7;
      for (let k = 0; k < n; k++) {
        const a = e.spin + k / n * TAU;
        enemyShot(e.wx, e.y, Math.cos(a) * 124, Math.sin(a) * 124, 3.3);
      }
      if (half) aimShot(e, 166, 4.2, 0, 1);
    } else {
      e.cd = (half ? 0.4 : 0.62) * rate;
      const n = half ? 12 : 8;
      for (let k = 0; k < n; k++) {
        const a = e.spin + k / n * TAU;
        enemyShot(e.wx, e.y, Math.cos(a) * 112, Math.sin(a) * 112, 3.2);
      }
      aimShot(e, dens ? 176 : 148, half ? 5.4 : 4.4, 0.16, half ? 3 : 1);
    }
  }

  function updateEnts(dt) {
    const dens = isCore();
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

      if (e.type === 'jelly') {
        e.wx += e.vx * dt;
        e.y += Math.sin(G.t * 2.4 + e.phase) * 36 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW * 0.82 && x > 40) {
          e.cd = dens ? rand(1.05, 1.7) : rand(1.5, 2.4);
          if (hash2(e.id + ((G.t * 8) | 0)) > (dens ? 0.4 : 0.58)) {
            aimShot(e, dens ? 168 : 140, 3.1, 0, 1);
          }
        }
      } else if (e.type === 'spore') {
        e.wx += e.vx * dt;
        e.y += Math.sin(G.t * 3.6 + e.phase) * 28 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 14, cave.bot - 14);
      } else if (e.type === 'dart') {
        e.wx += e.vx * dt;
        e.y += Math.sin(G.t * 5 + e.phase) * 16 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 14, cave.bot - 14);
      } else if (e.type === 'worm') {
        e.wx += e.vx * dt;
        e.phase += dt;
        const cave = caveAt(e.wx);
        const ty = e.top ? cave.top + 14 : cave.bot - 14;
        e.y = lerp(e.y, ty, 0.2);
      } else if (e.type === 'shell') {
        const cave = caveAt(e.wx);
        e.y = e.top ? cave.top + 12 : cave.bot - 12;
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 24) {
          e.cd = dens ? 0.82 : 1.12;
          aimShot(e, dens ? 176 : 148, 3.3, 0, 1);
        }
      } else if (e.type === 'tent') {
        const cave = caveAt(e.wx);
        e.y = e.top ? cave.top + 8 : cave.bot - 8;
        e.phase += dt;
        e.lash = Math.max(0, e.lash - dt);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 30) {
          e.cd = dens ? 1.05 : 1.42;
          e.lash = 0.28;
          aimShot(e, dens ? 160 : 134, 3.2, 0.14, dens ? 2 : 1);
        }
      } else if (e.type === 'carrier') {
        e.wx += e.vx * dt;
        e.phase += dt;
        e.y += Math.sin(e.phase * 1.25) * 22 * dt;
        const cave = caveAt(e.wx);
        e.y = clamp(e.y, cave.top + 22, cave.bot - 22);
        e.cd -= dt;
        if (e.cd <= 0 && x < VW && x > 20) {
          e.cd = dens ? 0.95 : 1.28;
          aimShot(e, dens ? 166 : 144, 3.5, 0.22, 3);
        }
      } else if (e.type === 'cap') {
        e.spin += dt * 3.2;
        e.wx -= 28 * dt;
        e.y += e.vy * dt;
        const cave = caveAt(e.wx);
        if (e.y < cave.top + 16 || e.y > cave.bot - 16) e.vy *= -1;
        e.y = clamp(e.y, cave.top + 16, cave.bot - 16);
        if (G.mode === 'play' && G.deadT <= 0 && aabb(e.wx, e.y, e.hw, e.hh, pwx(), G.py, 12, 10)) {
          collectCap(e);
        }
      } else if (e.type === 'boss') {
        updateBoss(e, dt, x);
      }

      if (e.alive && e.type !== 'cap' && G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0 && G.winT <= 0) {
        const pr = e.type === 'boss' ? 10 : 8;
        if (aabb(pwx(), G.py, pr, 5.2, e.wx, e.y, e.hw * 0.78, e.hh * 0.78)) {
          G.why = '撞机。';
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
    for (let i = wisps.length - 1; i >= 0; i--) {
      const w = wisps[i];
      w.t += dt;
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      if (w.t > w.life) wisps.splice(i, 1);
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
      G.flint.x = G.px + 18;
      G.flint.y = G.py + Math.sin(G.t * 2.2) * 4;
      G.flint.spin += dt * 3;
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
      updateFlint(dt);
      updateFx(dt);
      return;
    }

    if (G.winT > 0) {
      G.t += dt;
      G.winT -= dt;
      G.cam += scrollSpd() * dt * 0.4;
      updateFlint(dt);
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
    if (G.deadT > 0) return;
    updateFlint(dt);
    if (G.fireHold) fire();
    trySpawn();
    updateEnts(dt);
    updateShots(dt);
    updateFx(dt);
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      let x = ((s.wx - G.cam * s.p) % (VW + 40) + VW + 40) % (VW + 40) - 20;
      const tw = 0.45 + Math.sin(G.t * 2.4 + i) * 0.35;
      c.fillStyle = rgba(s.hue, tw);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.s * scale, 0, TAU);
      c.fill();
    }
  }

  function drawCave() {
    const c = ctx;
    const step = 10;
    const topPts = [];
    const botPts = [];
    for (let x = -8; x <= VW + 8; x += step) {
      const cave = caveAt(G.cam + x);
      topPts.push(x, cave.top);
      botPts.push(x, cave.bot);
    }
    c.beginPath();
    c.moveTo(sx(-8), sy(-8));
    for (let i = 0; i < topPts.length; i += 2) c.lineTo(sx(topPts[i]), sy(topPts[i + 1]));
    c.lineTo(sx(VW + 8), sy(-8));
    c.closePath();
    const g1 = c.createLinearGradient(sx(0), sy(0), sx(0), sy(90));
    g1.addColorStop(0, G.stage === 3 ? '#1a0820' : G.stage === 2 ? '#0c2418' : '#06362c');
    g1.addColorStop(1, G.stage === 3 ? '#3a1030' : '#145044');
    c.fillStyle = g1;
    c.fill();

    c.beginPath();
    c.moveTo(sx(-8), sy(VH + 8));
    for (let i = 0; i < botPts.length; i += 2) c.lineTo(sx(botPts[i]), sy(botPts[i + 1]));
    c.lineTo(sx(VW + 8), sy(VH + 8));
    c.closePath();
    const g2 = c.createLinearGradient(sx(0), sy(VH), sx(0), sy(VH - 90));
    g2.addColorStop(0, G.stage === 3 ? '#1a0820' : G.stage === 2 ? '#0c2418' : '#06362c');
    g2.addColorStop(1, G.stage === 3 ? '#3a1030' : '#145044');
    c.fillStyle = g2;
    c.fill();

    c.strokeStyle = rgba(G.stage === 3 ? MAG : TEAL, 0.45);
    c.lineWidth = 1.6 * scale;
    c.beginPath();
    for (let i = 0; i < topPts.length; i += 2) {
      if (i === 0) c.moveTo(sx(topPts[i]), sy(topPts[i + 1]));
      else c.lineTo(sx(topPts[i]), sy(topPts[i + 1]));
    }
    c.stroke();
    c.beginPath();
    for (let i = 0; i < botPts.length; i += 2) {
      if (i === 0) c.moveTo(sx(botPts[i]), sy(botPts[i + 1]));
      else c.lineTo(sx(botPts[i]), sy(botPts[i + 1]));
    }
    c.stroke();

    c.strokeStyle = rgba(MINT, 0.16);
    c.lineWidth = 1 * scale;
    for (let k = 0; k < 5; k++) {
      c.beginPath();
      let started = false;
      for (let x = 0; x <= VW; x += 18) {
        const cave = caveAt(G.cam + x);
        const y = cave.top + 6 + Math.sin((G.cam + x) / 48 + k * 1.4) * 5 + k * 3;
        if (!started) { c.moveTo(sx(x), sy(y)); started = true; }
        else c.lineTo(sx(x), sy(y));
      }
      c.stroke();
    }
  }

  function drawTentacles() {
    const c = ctx;
    const n = tentCount();
    const f = G.flint;
    const lash = f.grabT > 0;
    for (let i = 0; i < n; i++) {
      const rgb = i % 2 === 0 ? (lash ? GOLD : MAG) : TEAL;
      c.beginPath();
      c.moveTo(sx(f.x), sy(f.y));
      const p1 = tentPoint(i, 0.38);
      const p2 = tentPoint(i, 0.72);
      const p3 = tentPoint(i, 1);
      c.quadraticCurveTo(sx(p1.x), sy(p1.y), sx(p2.x), sy(p2.y));
      c.lineTo(sx(p3.x), sy(p3.y));
      c.strokeStyle = rgba(rgb, lash ? 0.95 : 0.82);
      c.lineWidth = (lash ? 3.4 : 2.4) * scale;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.stroke();
      c.beginPath();
      c.arc(sx(p3.x), sy(p3.y), (lash ? 3.6 : 2.4) * scale, 0, TAU);
      c.fillStyle = rgba(rgb, 0.95);
      c.fill();
      if (lash && !REDUCE) {
        c.beginPath();
        c.arc(sx(p3.x), sy(p3.y), 7 * scale, 0, TAU);
        c.fillStyle = rgba(GOLD, 0.22);
        c.fill();
      }
    }
  }

  function drawFlintOrb() {
    const c = ctx;
    const f = G.flint;
    const r = 7.2 + (f.grabT > 0 ? 2.4 : 0) + Math.sin(G.t * 8) * 0.5;
    c.beginPath();
    c.arc(sx(f.x), sy(f.y), (r + 6) * scale, 0, TAU);
    c.fillStyle = rgba(f.grabT > 0 ? GOLD : TEAL, 0.16);
    c.fill();
    c.beginPath();
    c.arc(sx(f.x), sy(f.y), r * scale, 0, TAU);
    const g = c.createRadialGradient(sx(f.x - 2), sy(f.y - 2), 1 * scale, sx(f.x), sy(f.y), r * scale);
    g.addColorStop(0, '#fff8d0');
    g.addColorStop(0.45, rgba(GOLD, 1));
    g.addColorStop(1, rgba(MAG, 0.9));
    c.fillStyle = g;
    c.fill();
    c.beginPath();
    c.arc(sx(f.x - 1.6), sy(f.y - 1.8), 1.6 * scale, 0, TAU);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.fill();
  }

  function drawShip(x, y, a) {
    const c = ctx;
    if (a < 1) c.globalAlpha = a;
    c.save();
    c.translate(sx(x), sy(y));
    c.scale(scale, scale);
    c.beginPath();
    c.moveTo(16, 0);
    c.lineTo(-6, -8);
    c.lineTo(-2, 0);
    c.lineTo(-6, 8);
    c.closePath();
    c.fillStyle = '#e8fff8';
    c.fill();
    c.fillStyle = '#2ee8c0';
    c.beginPath();
    c.rect(-2, -4.2, 12, 8.4);
    c.fill();
    c.fillStyle = '#7dffc8';
    c.beginPath();
    c.moveTo(-1, -7);
    c.lineTo(8, -3);
    c.lineTo(-1, -2);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-1, 7);
    c.lineTo(8, 3);
    c.lineTo(-1, 2);
    c.closePath();
    c.fill();
    if (G.muzzle > 0) {
      c.fillStyle = rgba(GOLD, G.muzzle * 8);
      c.beginPath();
      c.arc(18, 0, 4.5, 0, TAU);
      c.fill();
    }
    c.restore();
    c.globalAlpha = 1;
  }

  function drawJelly(e, x) {
    const c = ctx;
    const pulse = 1 + Math.sin(G.t * 4 + e.phase) * 0.12;
    c.fillStyle = e.flash > 0 ? rgba(WHT, 0.9) : rgba(TEAL, 0.85);
    c.beginPath();
    c.ellipse(sx(x), sy(e.y - 2), 11 * pulse * scale, 8 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(MINT, 0.7);
    c.beginPath();
    c.ellipse(sx(x), sy(e.y - 3), 5 * scale, 3.2 * scale, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(MAG, 0.7);
    c.lineWidth = 1.2 * scale;
    for (let k = -1; k <= 1; k++) {
      c.beginPath();
      c.moveTo(sx(x + k * 4), sy(e.y + 4));
      c.quadraticCurveTo(sx(x + k * 6), sy(e.y + 10), sx(x + k * 3), sy(e.y + 14));
      c.stroke();
    }
  }

  function drawSpore(e, x) {
    const c = ctx;
    c.fillStyle = e.flash > 0 ? rgba(WHT, 0.9) : rgba(MAG, 0.8);
    c.beginPath();
    c.arc(sx(x), sy(e.y), 6.2 * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.7);
    c.beginPath();
    c.arc(sx(x - 1.4), sy(e.y - 1.4), 1.8 * scale, 0, TAU);
    c.fill();
  }

  function drawDart(e, x) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.scale(scale, scale);
    c.fillStyle = e.flash > 0 ? '#fff' : '#ff4ea8';
    c.beginPath();
    c.moveTo(-12, 0);
    c.lineTo(10, -4);
    c.lineTo(6, 0);
    c.lineTo(10, 4);
    c.closePath();
    c.fill();
    c.fillStyle = '#7dffc8';
    c.fillRect(-4, -2, 8, 4);
    c.restore();
  }

  function drawWorm(e, x) {
    const c = ctx;
    c.fillStyle = e.flash > 0 ? rgba(WHT, 0.9) : rgba(TEAL, 0.88);
    for (let i = 0; i < e.segs; i++) {
      const oxf = i * 8;
      const oyf = Math.sin(e.phase * 6 + i) * 3;
      c.beginPath();
      c.ellipse(sx(x + oxf), sy(e.y + oyf), (8 - i * 0.8) * scale, 5.2 * scale, 0, 0, TAU);
      c.fill();
    }
  }

  function drawShell(e, x) {
    const c = ctx;
    c.fillStyle = e.flash > 0 ? rgba(WHT, 0.9) : rgba(GOLD, 0.85);
    c.beginPath();
    c.ellipse(sx(x), sy(e.y), 11 * scale, 8 * scale, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(DEEP, 0.55);
    c.lineWidth = 1.2 * scale;
    c.beginPath();
    c.arc(sx(x), sy(e.y), 6 * scale, 0.2, 2.6);
    c.stroke();
    c.fillStyle = rgba(MAG, 0.9);
    c.beginPath();
    c.arc(sx(x), sy(e.y + (e.top ? 4 : -4)), 2.4 * scale, 0, TAU);
    c.fill();
  }

  function drawTent(e, x) {
    const c = ctx;
    const dir = e.top ? 1 : -1;
    const len = 18 + (e.lash > 0 ? 22 : 10) + Math.sin(e.phase * 5) * 4;
    c.strokeStyle = e.flash > 0 ? rgba(WHT, 0.9) : rgba(MAG, 0.88);
    c.lineWidth = 3.2 * scale;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(sx(x), sy(e.y));
    c.quadraticCurveTo(
      sx(x + Math.sin(e.phase * 3) * 16),
      sy(e.y + dir * len * 0.5),
      sx(x + Math.sin(e.phase * 2.2) * 8),
      sy(e.y + dir * len)
    );
    c.stroke();
    c.fillStyle = rgba(GOLD, 0.85);
    c.beginPath();
    c.arc(sx(x), sy(e.y), 5.5 * scale, 0, TAU);
    c.fill();
  }

  function drawCarrier(e, x) {
    const c = ctx;
    c.fillStyle = e.flash > 0 ? rgba(WHT, 0.9) : rgba(TEAL, 0.9);
    c.beginPath();
    c.ellipse(sx(x), sy(e.y), 16 * scale, 11 * scale, 0, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.8);
    c.beginPath();
    c.arc(sx(x - 2), sy(e.y), 5 * scale, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(MAG, 0.7);
    c.lineWidth = 1.4 * scale;
    c.beginPath();
    c.arc(sx(x), sy(e.y), 10 * scale, G.t, G.t + 2);
    c.stroke();
  }

  function drawCap(e, x) {
    const c = ctx;
    const rgb = e.kind === 'tent' ? MAG : GOLD;
    c.save();
    c.translate(sx(x), sy(e.y));
    c.rotate(e.spin);
    c.fillStyle = rgba(rgb, 0.95);
    c.beginPath();
    c.moveTo(0, -8 * scale);
    c.lineTo(8 * scale, 0);
    c.lineTo(0, 8 * scale);
    c.lineTo(-8 * scale, 0);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff';
    c.font = '700 ' + (9 * scale) + 'px "PingFang SC","Noto Sans SC",sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.rotate(-e.spin);
    c.fillText(e.kind === 'tent' ? '触' : '火', 0, 0);
    c.restore();
  }

  function drawBoss(e, x) {
    const c = ctx;
    const open = e.open;
    const flash = e.flash > 0;
    if (e.kind === 'eye') {
      c.fillStyle = flash ? rgba(WHT, 0.9) : rgba(TEAL, 0.92);
      c.beginPath();
      c.ellipse(sx(x), sy(e.y), 30 * scale, 24 * scale, 0, 0, TAU);
      c.fill();
      const lid = (1 - open) * 18;
      c.fillStyle = '#06241c';
      c.beginPath();
      c.ellipse(sx(x + 4), sy(e.y), 14 * scale, Math.max(2, 14 - lid) * scale, 0, 0, TAU);
      c.fill();
      if (open > 0.4) {
        c.fillStyle = rgba(GOLD, 0.95);
        c.beginPath();
        c.arc(sx(x + 4), sy(e.y), 5.5 * scale, 0, TAU);
        c.fill();
      }
      for (let k = 0; k < 5; k++) {
        const a = e.spin + k / 5 * TAU;
        c.strokeStyle = rgba(MAG, 0.7);
        c.lineWidth = 2 * scale;
        c.beginPath();
        c.moveTo(sx(x + Math.cos(a) * 26), sy(e.y + Math.sin(a) * 20));
        c.lineTo(sx(x + Math.cos(a) * 40), sy(e.y + Math.sin(a) * 32));
        c.stroke();
      }
    } else if (e.kind === 'mother') {
      c.fillStyle = flash ? rgba(WHT, 0.9) : rgba(MAG, 0.88);
      c.beginPath();
      c.ellipse(sx(x), sy(e.y), 28 * scale, 26 * scale, 0, 0, TAU);
      c.fill();
      for (let k = 0; k < 6; k++) {
        const a = e.spin * 0.7 + k / 6 * TAU;
        c.fillStyle = rgba(TEAL, 0.7);
        c.beginPath();
        c.ellipse(
          sx(x + Math.cos(a) * 18),
          sy(e.y + Math.sin(a) * 16),
          7 * scale, 5 * scale, a, 0, TAU
        );
        c.fill();
      }
      if (open > 0.4) {
        c.fillStyle = rgba(GOLD, 0.95);
        c.beginPath();
        c.arc(sx(x), sy(e.y), 7 * scale, 0, TAU);
        c.fill();
      }
    } else {
      c.fillStyle = flash ? rgba(WHT, 0.9) : rgba(TEAL, 0.9);
      c.beginPath();
      c.arc(sx(x), sy(e.y), 34 * scale, 0, TAU);
      c.fill();
      const n = 8;
      for (let k = 0; k < n; k++) {
        const a = e.spin + k / n * TAU;
        c.strokeStyle = rgba(k % 2 ? MAG : GOLD, 0.85);
        c.lineWidth = 2.6 * scale;
        c.beginPath();
        c.moveTo(sx(x + Math.cos(a) * 30), sy(e.y + Math.sin(a) * 30));
        c.quadraticCurveTo(
          sx(x + Math.cos(a + 0.4) * 48),
          sy(e.y + Math.sin(a + 0.4) * 48),
          sx(x + Math.cos(a) * 62),
          sy(e.y + Math.sin(a) * 62)
        );
        c.stroke();
      }
      const coreR = 8 + open * 10;
      c.fillStyle = open > 0.4 ? rgba(GOLD, 0.95) : rgba(DEEP, 0.85);
      c.beginPath();
      c.arc(sx(x), sy(e.y), coreR * scale, 0, TAU);
      c.fill();
      if (open > 0.4) {
        c.beginPath();
        c.arc(sx(x), sy(e.y), (coreR + 6) * scale, 0, TAU);
        c.strokeStyle = rgba(GOLD, 0.55);
        c.lineWidth = 2 * scale;
        c.stroke();
      }
    }
  }

  function drawEnts() {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive && e.type !== 'boss') continue;
      const x = scrX(e.wx);
      if (x < -50 || x > VW + 60) continue;
      if (e.type === 'jelly') drawJelly(e, x);
      else if (e.type === 'spore') drawSpore(e, x);
      else if (e.type === 'dart') drawDart(e, x);
      else if (e.type === 'worm') drawWorm(e, x);
      else if (e.type === 'shell') drawShell(e, x);
      else if (e.type === 'tent') drawTent(e, x);
      else if (e.type === 'carrier') drawCarrier(e, x);
      else if (e.type === 'cap') drawCap(e, x);
      else if (e.type === 'boss') drawBoss(e, x);
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const x = scrX(s.wx);
      if (!REDUCE) {
        c.fillStyle = rgba(TEAL, 0.28);
        c.fillRect(sx(x - 10), sy(s.y - 1.2), 12 * scale, 2.4 * scale);
      }
      c.fillStyle = rgba(MINT, 1);
      c.beginPath();
      c.ellipse(sx(x), sy(s.y), 5.2 * scale, 2.1 * scale, 0, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const x = scrX(s.wx);
      c.fillStyle = rgba(MAG, 0.95);
      c.beginPath();
      c.arc(sx(x), sy(s.y), s.r * scale, 0, TAU);
      c.fill();
      c.fillStyle = rgba(WHT, 0.55);
      c.beginPath();
      c.arc(sx(x - 0.6), sy(s.y - 0.6), s.r * 0.35 * scale, 0, TAU);
      c.fill();
    }
  }

  function drawBossBar() {
    let boss = null;
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'boss' && G.ents[i].alive) { boss = G.ents[i]; break; }
    }
    if (!boss) return;
    const c = ctx;
    const w = 220;
    const x = (VW - w) * 0.5;
    const y = 16;
    c.fillStyle = 'rgba(4,20,16,0.55)';
    c.fillRect(sx(x), sy(y), w * scale, 8 * scale);
    c.fillStyle = rgba(boss.hp < boss.max * 0.5 ? MAG : TEAL, 0.9);
    c.fillRect(sx(x), sy(y), w * (boss.hp / boss.max) * scale, 8 * scale);
    c.strokeStyle = rgba(GOLD, 0.45);
    c.lineWidth = 1 * scale;
    c.strokeRect(sx(x), sy(y), w * scale, 8 * scale);
  }

  function drawPlayer() {
    if (G.mode === 'lose') return;
    if (G.deadT > 0) return;
    const a = G.invuln > 0 ? (Math.sin(G.t * 28) > 0 ? 0.35 : 0.9) : 1;
    if (G.mode === 'title') {
      drawTentacles();
      drawFlintOrb();
      drawShip(G.px, G.py + Math.sin(G.t * 2.2) * 4, 1);
      return;
    }
    drawTentacles();
    drawFlintOrb();
    drawShip(G.px, G.py, a);
  }

  function drawFx() {
    const c = ctx;
    for (let i = 0; i < wisps.length; i++) {
      const w = wisps[i];
      const a = 1 - w.t / w.life;
      c.fillStyle = rgba(w.rgb, a * 0.55);
      c.beginPath();
      c.arc(sx(w.x), sy(w.y), 2.2 * scale * a, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = Math.max(0, p.life / p.max);
      c.fillStyle = rgba(p.rgb, a);
      c.beginPath();
      c.arc(sx(p.x), sy(p.y), p.r * scale * (0.4 + a), 0, TAU);
      c.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const u = r.t / 0.42;
      c.strokeStyle = rgba(r.rgb, 1 - u);
      c.lineWidth = 2 * scale * (1 - u);
      c.beginPath();
      c.arc(sx(r.x), sy(r.y), (r.r + u * 26) * scale, 0, TAU);
      c.stroke();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const u = s.t / 0.28;
      c.fillStyle = rgba(s.rgb, 1 - u);
      c.beginPath();
      c.arc(sx(s.x), sy(s.y), s.rad * (1 - u) * 0.45 * scale, 0, TAU);
      c.fill();
    }
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      c.font = '700 ' + (f.size * scale) + 'px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
      c.fillStyle = rgba(f.rgb, a);
      c.textAlign = 'center';
      c.fillText(f.text, sx(f.x), sy(f.y));
    }
  }

  function draw() {
    const c = ctx;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#041410';
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
      g.addColorStop(0, '#062018');
      g.addColorStop(0.55, '#041812');
      g.addColorStop(1, '#0a2818');
    } else if (G.stage === 3) {
      g.addColorStop(0, '#120814');
      g.addColorStop(0.55, '#0c0812');
      g.addColorStop(1, '#1a0c18');
    } else {
      g.addColorStop(0, '#042820');
      g.addColorStop(0.55, '#041410');
      g.addColorStop(1, '#063028');
    }
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    if (G.stage === 3 && !REDUCE) {
      const beat = 0.08 + Math.max(0, Math.sin(G.t * 3.2)) * 0.08;
      c.fillStyle = rgba(MAG, beat);
      c.fillRect(sx(0), sy(0), VW * scale, VH * scale);
    }

    drawStars();
    drawCave();
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
    G.kind = kind || 'xexex';
    G.t = 0;
    G.cam = 0;
    G.px = 96;
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
    G.spawnedX = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.flint.state = 'dock';
    G.flint.x = 114;
    G.flint.y = VH * 0.5;
    G.flint.vx = 0;
    G.flint.vy = 0;
    G.flint.lv = 0;
    G.flint.grabT = 0;
    G.flint.grabCd = 0;
    G.flint.tick = 0;
    G.flint.crush = 0;
    G.flint.spin = 0;
    G.flint.pulse = 0;
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
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wisps.length = 0;
    pointer.x = G.px;
    pointer.y = G.py;
    eid = 1;
  }

  function startGame(kind) {
    resetRun(kind || 'xexex');
    G.mode = 'play';
    hideOverlay();
    audio.start();
    toast(isCore() ? '触核' : '泽泽', false, true);
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('xexex');
    G.mode = 'title';
    showOverlay('title', '泽泽', '横版活体卷轴。空格连射，Shift 把触核甩出去抓敌。接回时触手会扫弹。撞机、中弹、擦壁都掉命。');
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('xexex');
    else startGame(G.kind || 'xexex');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('xexex');
    else if (G.mode === 'lose' || G.mode === 'win') startGame(G.kind);
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
    const grabKey = k === 'z' || k === 'Z' || k === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || grabKey)) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || grabKey)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (grabKey) {
      doGrab();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'core' : 'xexex');
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
        doGrab();
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

  function bindGrabBtn(el) {
    if (!el) return;
    el.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      doGrab();
    });
  }

  seedStars();
  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnXexex) {
    btnXexex.addEventListener('click', function () {
      audio.ensure();
      startGame('xexex');
    });
  }
  if (btnCore) {
    btnCore.addEventListener('click', function () {
      audio.ensure();
      startGame('core');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'xexex');
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
  bindGrabBtn(btnGrab);
  bindGrabBtn(btnPad);

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('resize', resize);
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    G.fireHold = false;
  });
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) {
      keys.l = keys.r = keys.u = keys.d = false;
      G.fireHold = false;
    }
  });

  requestAnimationFrame(frame);
})();
