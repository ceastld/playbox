'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 12000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
  const SEC = 1680;
  const BOSS_AT = 6720;
  const BEST_KEY = 'playbox-xenon-run-best';
  const MUTE_KEY = 'playbox-xenon-run-mute';
  const OPS = '←↑↓→ / WASD 移动 · 空格开火 · C / Shift 变形 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const PUR = [180, 77, 255];
  const HOT = [200, 107, 255];
  const WHT = [246, 243, 255];
  const PNK = [255, 154, 212];
  const SOIL = [26, 10, 40];

  const SCORE = { gun: 50, crush: 90, drone: 70, block: 20, core: 1200, pod: 40 };

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
  const btnSurf = document.getElementById('btn-surf');
  const btnRaid = document.getElementById('btn-raid');
  const btnOvRetry = document.getElementById('ov-retry');
  const btnOvModes = document.getElementById('ov-modes');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const btnXform = document.getElementById('btn-xform');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const scoreBox = document.getElementById('score-box');
  const scoreAdd = document.getElementById('score-add');
  const stageLabel = document.getElementById('stage-label');
  const tagLabel = document.getElementById('tag-label');
  const formLabel = document.getElementById('form-label');
  const comboEl = document.getElementById('combo-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const stageEl = document.getElementById('stage');
  const powBar = document.getElementById('pow-bar');
  const powWrap = document.getElementById('pow-wrap');

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
  let formTok = 0;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, hover: false, x: VW * 0.5, y: VH - 110, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const stars = [];

  const G = {
    mode: 'title',
    kind: 'surf',
    form: 'air',
    t: 0,
    cam: 0,
    px: VW * 0.5,
    py: VH - 110,
    lives: LIVES,
    score: 0,
    best: 0,
    combo: 0,
    comboT: 0,
    mult: 1,
    power: 0,
    section: 1,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    eShots: [],
    spawnedY: 0,
    fireCd: 0,
    fireHold: false,
    morph: 0,
    xformCd: 0,
    deadT: 0,
    invuln: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: PUR,
    punch: 1,
    muzzle: 0,
    toastT: 0,
    why: '',
    boss: false,
    winT: 0,
    engine: 0,
    lastSec: 1
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
  function isRaid() {
    return G.kind === 'raid';
  }
  function isTank() {
    return G.form === 'tank';
  }
  function pwy() {
    return G.cam + VH - G.py;
  }
  function screenY(wy) {
    return G.cam + VH - wy;
  }
  function hw() {
    return isTank() ? 13 : 10;
  }
  function hh() {
    return isTank() ? 10 : 12;
  }
  function moveSpd() {
    if (isRaid()) return isTank() ? 230 : 330;
    return isTank() ? 198 : 286;
  }
  function scrollSpd() {
    if (G.boss) {
      const b = findCore();
      if (b && b.alive) {
        const y = screenY(b.wy);
        if (y < 210) return isRaid() ? 36 : 24;
        if (y < 280) return isRaid() ? 96 : 70;
      }
    }
    return isRaid() ? 248 : 168;
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

  function patternAt(wy) {
    if (wy < 380) return 'open';
    if (wy >= BOSS_AT - 220) return 'boss';
    if (wy < 1680) {
      if (wy < 560) return 'guns';
      if (wy < 900) return 'block';
      if (wy < 1040) return 'air';
      if (wy < 1380) return 'hang';
      if (wy < 1520) return 'guns';
      return 'air';
    }
    const local = ((wy % 920) + 920) % 920;
    const h = hash2(((wy / 920) | 0) * 17 + (isRaid() ? 3 : 1));
    if (isRaid()) {
      if (local < 300) return 'air';
      if (local < 420 && h > 0.42) return 'guns';
      if (local < 520 && h > 0.78) return 'block';
      if (local < 640 && h > 0.82) return 'hang';
      return 'open';
    }
    if (local < 150) return 'guns';
    if (local < 340) return 'block';
    if (local < 470) return 'air';
    if (local < 660) return 'hang';
    if (local < 780) return 'squeeze';
    return 'mix';
  }

  function laneAt(wy) {
    const raid = isRaid();
    const n1 = fbm(wy * 0.00178, 1);
    const n2 = fbm(wy * 0.00066, 9);
    let cx = VW * 0.5 + (n1 - 0.5) * (raid ? 64 : 88) + (n2 - 0.5) * 22;
    let w = (raid ? 252 : 214) + (fbm(wy * 0.00218, 3) - 0.5) * (raid ? 68 : 86);
    if (wy < 420) w = lerp(348, w, wy / 420);
    const pat = patternAt(wy);
    if (pat === 'squeeze') w *= 0.56;
    if (pat === 'boss') w = Math.max(w, 250);
    w = clamp(w, 92, 360);
    let L = cx - w * 0.5;
    let R = cx + w * 0.5;
    if (L < 18) {
      R += 18 - L;
      L = 18;
    }
    if (R > VW - 18) {
      L -= R - (VW - 18);
      R = VW - 18;
    }
    L = clamp(L, 14, VW - 90);
    R = clamp(R, 90, VW - 14);
    return { L: L, R: R, cx: (L + R) * 0.5, w: R - L };
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
    shoot(tank) {
      this.ensure();
      if (tank) this.beep(420, 0.07, 'square', 0.034, 880);
      else this.beep(820, 0.055, 'square', 0.032, 1680);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'core' ? 220 : kind === 'drone' ? 760 : kind === 'gun' ? 520 : 440;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.05, 0.04, 1100);
      this.beep(base * lift, 0.09, 'square', 0.048, base * lift * 1.55);
    },
    crush() {
      this.ensure();
      this.noise(0.12, 0.07, 240);
      this.beep(180, 0.14, 'sawtooth', 0.055, 70);
      this.beep(320, 0.1, 'square', 0.04, 110);
    },
    xform(toTank) {
      this.ensure();
      if (toTank) {
        this.beep(880, 0.08, 'sawtooth', 0.05, 220);
        this.beep(440, 0.14, 'square', 0.04, 160);
        this.noise(0.08, 0.04, 500);
      } else {
        this.beep(220, 0.08, 'square', 0.045, 990);
        this.beep(520, 0.14, 'triangle', 0.04, 1320);
      }
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    miss() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.02, 80);
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
    pow() {
      this.ensure();
      this.beep(660, 0.08, 'sine', 0.04, 990);
      this.beep(880, 0.14, 'triangle', 0.04, 1320);
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
      this.beep(392, 0.09, 'square', 0.04, 784);
      this.beep(784, 0.14, 'triangle', 0.035, 1175);
    },
    ping() {
      this.ensure();
      this.beep(980, 0.04, 'square', 0.028, 640);
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
      if (G.mode === 'title') stageLabel.textContent = '异星';
      else if (G.boss) stageLabel.textContent = '核心';
      else stageLabel.textContent = '第 ' + G.section + ' 区';
      stageLabel.classList.toggle('hot', G.mode === 'play' && (G.section >= 4 || G.boss));
    }
    if (tagLabel) {
      tagLabel.textContent = isRaid() ? '空袭' : '地表';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (formLabel) {
      formLabel.textContent = isTank() ? '坦克' : '战机';
      formLabel.classList.toggle('tank', isTank());
      formLabel.classList.toggle('air', !isTank());
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (powBar) powBar.style.transform = 'scaleX(' + ((G.power + 1) / 4) + ')';
    if (powWrap) powWrap.classList.toggle('hot', G.power >= 3);
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 飞机飞过炮台，坦克碾碎炮台', 'warn');
    else if (G.mode === 'win') setHint('R 重开 · 核心已毁', 'hot');
    else if (G.lives === 1) setHint('最后一命 · C 变形躲开障碍', 'warn');
    else if (isTank()) setHint('坦克碾炮台 · 撞建筑即毁 · C 变战机飞过', '');
    else setHint('战机飞过炮台 · 撞顶棚即毁 · C 变坦克潜入', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : 'XENON';
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
    const cls = mag >= 6 ? 'die' : mag >= 3.6 ? 'morph' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    stageEl.classList.remove('morph');
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
        g: spec.g == null ? 420 : spec.g
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
      vx0: -180, vx1: 180, vy0: -220, vy1: 80,
      r0: 1.4, r1: 4.2, life: 0.42 + p * 0.006, rgb: rgb, g: 520
    });
    emit(6, {
      x: x, y: y, j: 3,
      vx0: -60, vx1: 60, vy0: -140, vy1: -40,
      r0: 2, r1: 5, life: 0.28, rgb: WHT, g: 200
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

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
  }

  function occupied(wy, x, rad) {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (Math.abs(e.wy - wy) < 42 && Math.abs(e.x - x) < rad) return true;
    }
    return false;
  }

  function pushEnt(e) {
    G.ents.push(e);
    capArr(G.ents, 96);
  }

  function findCore() {
    for (let i = 0; i < G.ents.length; i++) {
      if (G.ents[i].type === 'core' && G.ents[i].alive) return G.ents[i];
    }
    return null;
  }

  function spawnSlice(y) {
    if (y < 280) return;
    if (y > BOSS_AT - 80 && y < BOSS_AT + 520) {
      if (!G.boss && y >= BOSS_AT && G.mode === 'play') spawnBoss(y);
      return;
    }
    const lane = laneAt(y);
    const pat = patternAt(y);
    const slice = (y / 48) | 0;
    const h = hash2(slice * 13 + (isRaid() ? 7 : 2));
    const dens = isRaid() ? 1.18 : 1;
    if (pat === 'open' && h > 0.55 * dens) return;

    if ((pat === 'block' || pat === 'mix') && slice % 2 === 0) {
      const n = isRaid() ? 2 : 4;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        const x = lerp(lane.L + 18, lane.R - 18, t);
        if (occupied(y, x, 22)) continue;
        if (isRaid() && hash2(slice * 31 + i) < 0.28) continue;
        pushEnt({
          type: 'block', x: x, wy: y, hw: Math.max(14, (lane.w / n) * 0.62), hh: 14, hp: 4, alive: true, flash: 0
        });
      }
    }
    if (pat === 'hang' && slice % 2 === 0) {
      const x = lane.cx;
      if (!occupied(y, x, 40)) {
        pushEnt({
          type: 'hang', x: x, wy: y, hw: lane.w * 0.47, hh: 10, hp: 99, alive: true, flash: 0
        });
      }
    }
    if (pat === 'guns' || pat === 'mix') {
      if (h > 0.22 && (y > 900 || h > 0.4)) {
        const x = lerp(lane.L + 28, lane.R - 28, hash2(slice + 99));
        if (!occupied(y, x, 34)) {
          pushEnt({
            type: 'gun', x: x, wy: y, hw: 12, hh: 11, hp: 2, alive: true, cd: rand(0.4, 1.2), flash: 0, ang: 0
          });
        }
      }
    }
    if (pat === 'air' || (pat === 'open' && h < 0.5) || (isRaid() && h < 0.62)) {
      const x = lerp(lane.L + 24, lane.R - 24, hash2(((y / 48) | 0) + 44));
      if (!occupied(y, x, 30)) {
        pushEnt({
          type: 'drone', x: x, wy: y, hw: 11, hh: 10, hp: 1, alive: true,
          vx: (h > 0.5 ? 1 : -1) * (isRaid() ? 70 : 52),
          phase: h * TAU, cd: rand(0.6, 1.4), flash: 0
        });
      }
      if (isRaid() && h < 0.28) {
        const x2 = lerp(lane.L + 24, lane.R - 24, hash2(((y / 48) | 0) + 71));
        if (!occupied(y, x2, 30)) {
          pushEnt({
            type: 'drone', x: x2, wy: y + 18, hw: 11, hh: 10, hp: 1, alive: true,
            vx: (h > 0.5 ? -1 : 1) * 80, phase: h * TAU + 1, cd: rand(0.4, 1), flash: 0
          });
        }
      }
    }
    if (h > 0.92 && pat !== 'boss') {
      const x = lane.cx;
      if (!occupied(y, x, 26)) {
        pushEnt({
          type: 'pod', x: x, wy: y, hw: 9, hh: 9, hp: 1, alive: true,
          kind: h > 0.975 ? 'life' : 'pow', spin: 0
        });
      }
    }
  }

  function spawnBoss(y) {
    G.boss = true;
    const lane = laneAt(BOSS_AT + 80);
    pushEnt({
      type: 'core', x: lane.cx, wy: BOSS_AT + 120, hw: 28, hh: 26,
      hp: isRaid() ? 16 : 18, max: isRaid() ? 16 : 18, alive: true,
      vx: 48, cd: 0.8, flash: 0, phase: 0
    });
    pushEnt({
      type: 'gun', x: lane.cx - 70, wy: BOSS_AT + 40, hw: 12, hh: 11, hp: 3, alive: true, cd: 0.4, flash: 0, ang: 0
    });
    pushEnt({
      type: 'gun', x: lane.cx + 70, wy: BOSS_AT + 40, hw: 12, hh: 11, hp: 3, alive: true, cd: 0.7, flash: 0, ang: 0
    });
    pushEnt({
      type: 'drone', x: lane.cx - 90, wy: BOSS_AT + 160, hw: 11, hh: 10, hp: 1, alive: true, vx: 90, phase: 0, cd: 0.5, flash: 0
    });
    pushEnt({
      type: 'drone', x: lane.cx + 90, wy: BOSS_AT + 160, hw: 11, hh: 10, hp: 1, alive: true, vx: -90, phase: 2, cd: 0.7, flash: 0
    });
    toast('核心出现', false, true);
    audio.check();
    syncHud();
  }

  function trySpawn() {
    const ahead = G.cam + VH + 70;
    while (G.spawnedY < ahead) {
      G.spawnedY += 48;
      spawnSlice(G.spawnedY);
    }
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 46; i++) {
      stars.push({
        x: hash2(i * 17) * VW,
        y: hash2(i * 91 + 3) * VH,
        s: 0.5 + hash2(i * 5 + 9) * 1.6,
        p: 0.25 + hash2(i * 13) * 0.7
      });
    }
  }

  function award(kind, x, y) {
    bumpCombo();
    const n = (SCORE[kind] || 10) * G.mult;
    addScore(n);
    const gold = kind === 'crush' || kind === 'core' || G.mult >= 3;
    floatText(x, y + 8, '+' + n, gold ? GOLD : WHT, gold);
    if (kind === 'crush') floatText(x, y - 10, '碾碎', GOLD, true);
  }

  function dropPod(x, wy, force) {
    const h = hash2(((wy / 12) | 0) + (x | 0));
    if (!force && h > 0.16) return;
    pushEnt({
      type: 'pod', x: x, wy: wy, hw: 9, hh: 9, hp: 1, alive: true,
      kind: h > 0.92 ? 'life' : 'pow', spin: 0
    });
  }

  function killEnt(e, crush) {
    if (!e.alive) return;
    e.alive = false;
    const sye = screenY(e.wy);
    if (e.type === 'core') {
      explode(e.x, sye, GOLD, 42);
      explode(e.x - 20, sye + 10, MAG, 22);
      explode(e.x + 18, sye - 8, CYN, 22);
      award('core', e.x, sye);
      audio.hit('core', G.combo);
      hitStop(0.08);
      kick(8);
      screenFlash(GOLD, 0.62);
      G.winT = 1.15;
      toast('核心毁了', false, true);
      return;
    }
    if (e.type === 'pod') {
      popSpark(e.x, sye, GOLD, 16);
      return;
    }
    const rgb = e.type === 'gun' ? MAG : e.type === 'drone' ? CYN : PUR;
    explode(e.x, sye, crush ? GOLD : rgb, crush ? 26 : 16);
    if (crush) {
      award('crush', e.x, sye);
      audio.crush();
      hitStop(0.055);
      kick(5);
      screenFlash(GOLD, 0.46);
    } else {
      const kind = e.type === 'gun' ? 'gun' : e.type === 'drone' ? 'drone' : 'block';
      award(kind, e.x, sye);
      audio.hit(kind, G.combo);
      hitStop(clamp(0.032 + G.combo * 0.003, 0.032, 0.06));
      kick(3.2);
      screenFlash(rgb, 0.28);
    }
    if (e.type === 'gun' || e.type === 'drone') dropPod(e.x, e.wy);
  }

  function hurt(e, dmg, crush) {
    if (!e.alive) return;
    if (e.type === 'hang') return;
    if (e.type === 'pod') {
      collectPod(e);
      return;
    }
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.hp <= 0) killEnt(e, crush);
    else {
      audio.ping();
      hitStop(0.018);
      const sye = screenY(e.wy);
      emit(4, {
        x: e.x, y: sye, j: 4,
        vx0: -80, vx1: 80, vy0: -80, vy1: 40,
        r0: 1, r1: 2.2, life: 0.18, rgb: WHT, g: 0
      });
    }
  }

  function collectPod(e) {
    if (!e.alive) return;
    e.alive = false;
    const sye = screenY(e.wy);
    if (e.kind === 'life') {
      if (G.lives < LIFE_CAP) G.lives += 1;
      toast('1UP', false, true);
      audio.up();
      floatText(e.x, sye, '1UP', GOLD, true);
    } else {
      if (G.power < 3) G.power += 1;
      toast(G.power >= 3 ? '火力满' : '火力 +', false, true);
      audio.pow();
      floatText(e.x, sye, '火力', GOLD, true);
    }
    addScore(SCORE.pod * G.mult);
    popSpark(e.x, sye, GOLD, 18);
    screenFlash(GOLD, 0.34);
    hitStop(0.04);
    kick(3);
    syncHud();
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (overlayOpen()) return;
    if (G.fireCd > 0) return;
    if (G.shots.length > 28) return;
    const tank = isTank();
    const p = G.power;
    const vy = tank ? 440 : 580;
    const wy = pwy() + 16;
    const spread = p >= 2;
    function add(ox, ovx) {
      G.shots.push({
        x: G.px + ox, wy: wy, vx: ovx || 0, vy: vy, tank: tank, trail: []
      });
    }
    if (p <= 0) add(0, 0);
    else if (p === 1) {
      add(-7, 0);
      add(7, 0);
    } else {
      add(0, 0);
      add(-11, spread ? -46 : 0);
      add(11, spread ? 46 : 0);
    }
    G.fireCd = p >= 3 ? 0.075 : p === 2 ? 0.11 : p === 1 ? 0.13 : 0.16;
    audio.shoot(tank);
    screenFlash(tank ? GOLD : CYN, 0.14);
    G.muzzle = 0.07;
    emit(5, {
      x: G.px, y: G.py - 12, j: 2,
      vx0: -40, vx1: 40, vy0: -180, vy1: -80,
      r0: 1, r1: 2.4, life: 0.16, rgb: tank ? GOLD : CYN, g: 0
    });
  }

  function enemyShot(x, wy, vx, vy) {
    if (G.eShots.length > 42) return;
    G.eShots.push({ x: x, wy: wy, vx: vx, vy: vy });
  }

  function transform() {
    if (G.mode !== 'play' || G.deadT > 0 || G.xformCd > 0) return;
    const toTank = !isTank();
    G.form = toTank ? 'tank' : 'air';
    G.xformCd = 0.32;
    G.morph = 0.2;
    audio.xform(toTank);
    hitStop(0.048);
    kick(4);
    screenFlash(toTank ? MAG : CYN, 0.55);
    popSpark(G.px, G.py, toTank ? MAG : CYN, 24);
    emit(18, {
      x: G.px, y: G.py, j: 8,
      vx0: -220, vx1: 220, vy0: -180, vy1: 180,
      r0: 1.5, r1: 4, life: 0.36, rgb: toTank ? MAG : CYN, g: 80
    });
    emit(8, {
      x: G.px, y: G.py, j: 4,
      vx0: -80, vx1: 80, vy0: -80, vy1: 80,
      r0: 2, r1: 5, life: 0.22, rgb: WHT, g: 0
    });
    toast(toTank ? '坦克' : '战机', false, true);
    if (formLabel) {
      formLabel.classList.remove('pop');
      void formLabel.offsetWidth;
      formLabel.classList.add('pop');
      formTok += 1;
    }
    syncHud();
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.why = why;
    G.deadT = 0.88;
    G.lives -= 1;
    breakCombo();
    explode(G.px, G.py, MAG, 32);
    emit(16, {
      x: G.px, y: G.py, j: 8,
      vx0: -220, vx1: 220, vy0: -200, vy1: 80,
      r0: 2, r1: 5.5, life: 0.55, rgb: CYN, g: 380
    });
    audio.death();
    hitStop(0.072);
    kick(8);
    screenFlash(MAG, 0.58);
    G.shots.length = 0;
    syncPips();
  }

  function goLose() {
    G.mode = 'lose';
    audio.lose();
    const why = G.why || '舰毁了';
    showOverlay('lose', '舰毁了', why + '  ·  分数 ' + G.score);
    setHint('R 重开', 'warn');
    syncHud();
  }

  function goWin() {
    G.mode = 'win';
    audio.win();
    showOverlay('win', '核心毁了', '异星沉默。分数 ' + G.score);
    setHint('R 重开', 'hot');
    syncHud();
  }

  function respawn() {
    const lane = laneAt(pwy());
    G.px = lane.cx;
    G.py = clamp(G.py, 90, VH - 70);
    G.invuln = 1.4;
    G.shots.length = 0;
    G.eShots.length = 0;
    breakCombo();
    toast('剩余 ' + G.lives + ' 命', true, false);
    syncHud();
  }

  function resetRun(kind) {
    G.kind = kind;
    G.form = 'air';
    G.t = 0;
    G.cam = 0;
    G.px = VW * 0.5;
    G.py = VH - 110;
    G.lives = LIVES;
    G.score = 0;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.power = 0;
    G.section = 1;
    G.lastSec = 1;
    G.nextLife = LIFE_EVERY;
    G.ents.length = 0;
    G.shots.length = 0;
    G.eShots.length = 0;
    G.spawnedY = 0;
    G.fireCd = 0;
    G.fireHold = false;
    G.morph = 0;
    G.xformCd = 0;
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
    pointer.x = G.px;
    pointer.y = G.py;
  }

  function startGame(kind) {
    resetRun(kind || 'surf');
    G.mode = 'play';
    hideOverlay();
    audio.start();
    toast(isRaid() ? '空袭' : '地表', false, true);
    trySpawn();
    syncHud();
    if (canvas && canvas.focus) canvas.focus();
  }

  function goTitle() {
    resetRun('surf');
    G.mode = 'title';
    showOverlay('title', '异星', '飞机飞过炮台，坦克碾碎炮台。C 或 Shift 变形。');
    syncHud();
  }

  function updateFx(dt) {
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 2.4);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 14);
    if (G.punch > 1) G.punch = Math.max(1, G.punch - dt * 0.55);
    if (G.muzzle > 0) G.muzzle -= dt;
    if (G.morph > 0) G.morph -= dt;
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
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
      if (f.t > f.life) floats.splice(i, 1);
    }
  }

  function aimAtPlayer(ex, ewy, spd) {
    const dx = G.px - ex;
    const dy = pwy() - ewy;
    const d = hypot(dx, dy) || 1;
    return { vx: dx / d * spd, vy: dy / d * spd };
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (!REDUCE) {
        if (!s.trail) s.trail = [];
        s.trail.push({ x: s.x, wy: s.wy });
        if (s.trail.length > 6) s.trail.shift();
      }
      s.x += s.vx * dt;
      s.wy += s.vy * dt;
      const y = screenY(s.wy);
      if (s.x < -20 || s.x > VW + 20) {
        G.shots.splice(i, 1);
        continue;
      }
      if (y < -28) {
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
        if (e.type === 'hang') continue;
        if (aabb(s.x, s.wy, 2.4, 8, e.x, e.wy, e.hw, e.hh)) {
          hurt(e, 1, false);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }

    for (let i = G.eShots.length - 1; i >= 0; i--) {
      const s = G.eShots[i];
      s.x += s.vx * dt;
      s.wy += s.vy * dt;
      const y = screenY(s.wy);
      if (y > VH + 30 || y < -40 || s.x < -30 || s.x > VW + 30) {
        G.eShots.splice(i, 1);
        continue;
      }
      if (G.mode === 'play' && G.deadT <= 0 && G.invuln <= 0) {
        if (aabb(s.x, s.wy, 3.2, 3.2, G.px, pwy(), hw() * 0.72, hh() * 0.72)) {
          G.eShots.splice(i, 1);
          killPlayer('被击中');
        }
      }
    }
  }

  function updateEnts(dt) {
    const raid = isRaid();
    for (let i = G.ents.length - 1; i >= 0; i--) {
      const e = G.ents[i];
      if (!e.alive && e.type !== 'core') {
        if (e.wy < G.cam - 80) G.ents.splice(i, 1);
        continue;
      }
      if (e.wy < G.cam - 80 && e.type !== 'core') {
        G.ents.splice(i, 1);
        continue;
      }
      if (e.flash > 0) e.flash -= dt;
      const lane = laneAt(e.wy);
      if (e.type === 'drone') {
        e.x += e.vx * dt;
        e.phase += dt * 2.4;
        e.x += Math.sin(e.phase) * (raid ? 28 : 18) * dt;
        if (e.x < lane.L + 16) {
          e.x = lane.L + 16;
          e.vx = Math.abs(e.vx);
        }
        if (e.x > lane.R - 16) {
          e.x = lane.R - 16;
          e.vx = -Math.abs(e.vx);
        }
        if (G.mode === 'play' && e.alive) {
          e.cd -= dt;
          if (e.cd <= 0 && screenY(e.wy) > 20 && screenY(e.wy) < VH - 40) {
            const a = aimAtPlayer(e.x, e.wy, raid ? 210 : 160);
            enemyShot(e.x, e.wy - 8, a.vx, a.vy);
            e.cd = raid ? rand(0.7, 1.25) : rand(1.05, 1.8);
          }
        }
      } else if (e.type === 'gun') {
        if (G.mode === 'play' && e.alive) {
          const dx = G.px - e.x;
          const dy = pwy() - e.wy;
          e.ang = Math.atan2(dx, dy);
          e.cd -= dt;
          if (e.cd <= 0 && screenY(e.wy) > 10 && screenY(e.wy) < VH - 30) {
            const spd = raid ? 190 : 140;
            const a = aimAtPlayer(e.x, e.wy, spd);
            enemyShot(e.x, e.wy - 6, a.vx * 0.72, a.vy > 0 ? -spd : a.vy);
            e.cd = raid ? rand(0.9, 1.5) : rand(1.2, 2);
          }
        }
      } else if (e.type === 'core') {
        e.x += e.vx * dt;
        e.phase += dt;
        if (e.x < lane.L + 40) {
          e.x = lane.L + 40;
          e.vx = Math.abs(e.vx);
        }
        if (e.x > lane.R - 40) {
          e.x = lane.R - 40;
          e.vx = -Math.abs(e.vx);
        }
        if (G.mode === 'play' && e.alive) {
          e.cd -= dt;
          if (e.cd <= 0) {
            const n = e.hp < e.max * 0.5 ? 5 : 3;
            const spd = raid ? 200 : 150;
            for (let k = 0; k < n; k++) {
              const ang = -1.1 + k * (2.2 / Math.max(1, n - 1));
              enemyShot(e.x, e.wy - 10, Math.sin(ang) * spd, -Math.cos(ang) * spd);
            }
            e.cd = e.hp < e.max * 0.5 ? 0.7 : 1.15;
          }
        }
      } else if (e.type === 'pod') {
        e.spin += dt * 4;
        e.x += Math.sin(e.spin) * 12 * dt;
      }
    }
  }

  function collidePlayer() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    const wy = pwy();
    const hww = hw();
    const hhh = hh();
    const lane = laneAt(wy);
    if (G.px - hww < lane.L || G.px + hww > lane.R) {
      if (G.invuln > 0) {
        G.px = clamp(G.px, lane.L + hww + 2, lane.R - hww - 2);
      } else {
        killPlayer('撞壁了');
        return;
      }
    }
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (!aabb(G.px, wy, hww * 0.82, hhh * 0.82, e.x, e.wy, e.hw, e.hh)) continue;
      if (e.type === 'pod') {
        collectPod(e);
        continue;
      }
      if (e.type === 'gun' && isTank()) {
        hurt(e, 9, true);
        continue;
      }
      if (e.type === 'block' && !isTank()) continue;
      if (e.type === 'hang' && isTank()) continue;
      if (e.type === 'gun' && !isTank()) continue;
      if (G.invuln > 0) continue;
      if (e.type === 'hang') killPlayer('撞顶了');
      else if (e.type === 'block') killPlayer('撞建筑了');
      else if (e.type === 'drone' || e.type === 'core') killPlayer('撞机了');
      else killPlayer('被击中');
      return;
    }
  }

  function movePlayer(dt) {
    if (G.deadT > 0) return;
    const spd = moveSpd();
    let dx = 0;
    let dy = 0;
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const k = 1 - Math.exp(-11 * dt);
      G.px += (pointer.x - G.px) * k;
      G.py += (pointer.y - G.py) * k;
    } else {
      if (keys.l) dx -= 1;
      if (keys.r) dx += 1;
      if (keys.u) dy -= 1;
      if (keys.d) dy += 1;
      if (dx || dy) {
        const d = hypot(dx, dy) || 1;
        G.px += dx / d * spd * dt;
        G.py += dy / d * spd * dt;
      }
    }
    G.px = clamp(G.px, 18, VW - 18);
    G.py = clamp(G.py, 64, VH - 48);
  }

  function update(dt) {
    G.t += dt;
    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    const idle = G.mode === 'title' || G.mode === 'lose' || G.mode === 'win';
    if (idle) {
      G.cam += 42 * dt;
      trySpawn();
      updateEnts(dt);
      updateFx(dt);
      if (G.mode === 'win' && G.winT > 0) G.winT -= dt;
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      G.cam += scrollSpd() * 0.35 * dt;
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

    G.cam += scrollSpd() * dt;
    if (G.fireCd > 0) G.fireCd -= dt;
    if (G.xformCd > 0) G.xformCd -= dt;
    if (G.invuln > 0) G.invuln -= dt;
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }

    movePlayer(dt);
    if (G.fireHold) fire();

    G.engine += dt;
    if (G.engine > 0.03 && !REDUCE) {
      G.engine = 0;
      const rgb = isTank() ? MAG : CYN;
      emit(1, {
        x: G.px, y: G.py + (isTank() ? 10 : 12), j: 3,
        vx0: -20, vx1: 20, vy0: 40, vy1: 120,
        r0: 1.2, r1: isTank() ? 2.8 : 2.2, life: 0.22, rgb: rgb, g: 80
      });
    }

    trySpawn();
    updateEnts(dt);
    updateShots(dt);
    collidePlayer();

    const sec = Math.max(1, Math.floor(pwy() / SEC) + 1);
    if (sec !== G.lastSec && !G.boss && G.mode === 'play') {
      G.section = Math.min(4, sec);
      G.lastSec = sec;
      if (sec <= 4) {
        toast('第 ' + G.section + ' 区', false, true);
        audio.check();
      }
    }
    if (G.boss) G.section = 5;

    updateFx(dt);
    syncHud();
  }

  function rr(x, y, w, h, r) {
    const c = ctx;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawWalls() {
    const c = ctx;
    const step = 6;
    c.beginPath();
    c.moveTo(sx(0), sy(VH));
    for (let y = VH; y >= -8; y -= step) {
      const lane = laneAt(G.cam + VH - y);
      c.lineTo(sx(lane.L), sy(y));
    }
    c.lineTo(sx(0), sy(-8));
    c.closePath();
    c.fillStyle = '#140822';
    c.fill();

    c.beginPath();
    c.moveTo(sx(VW), sy(VH));
    for (let y = VH; y >= -8; y -= step) {
      const lane = laneAt(G.cam + VH - y);
      c.lineTo(sx(lane.R), sy(y));
    }
    c.lineTo(sx(VW), sy(-8));
    c.closePath();
    c.fillStyle = '#140822';
    c.fill();

    c.lineWidth = Math.max(1.2, 1.6 * scale);
    c.strokeStyle = rgba(PUR, 0.85);
    c.beginPath();
    for (let y = VH; y >= -8; y -= step) {
      const lane = laneAt(G.cam + VH - y);
      if (y === VH) c.moveTo(sx(lane.L), sy(y));
      else c.lineTo(sx(lane.L), sy(y));
    }
    c.stroke();
    c.beginPath();
    for (let y = VH; y >= -8; y -= step) {
      const lane = laneAt(G.cam + VH - y);
      if (y === VH) c.moveTo(sx(lane.R), sy(y));
      else c.lineTo(sx(lane.R), sy(y));
    }
    c.stroke();

    c.fillStyle = rgba(MAG, 0.35);
    for (let y = 0; y < VH; y += 18) {
      const wy = G.cam + VH - y;
      const lane = laneAt(wy);
      const h = hash2((wy / 18) | 0);
      if (h > 0.55) {
        const bh = 6 + h * 10;
        c.fillRect(sx(lane.L - 10 - h * 8), sy(y), Math.max(2, 8 * scale), bh * scale);
      }
      const h2 = hash2(((wy / 18) | 0) + 50);
      if (h2 > 0.55) {
        const bh = 6 + h2 * 10;
        c.fillRect(sx(lane.R + 2 + h2 * 6), sy(y), Math.max(2, 8 * scale), bh * scale);
      }
    }
  }

  function drawSoil() {
    const c = ctx;
    c.fillStyle = '#12081c';
    for (let y = 0; y < VH; y += 10) {
      const lane = laneAt(G.cam + VH - y);
      c.fillRect(sx(lane.L), sy(y), (lane.R - lane.L) * scale, 11 * scale);
    }
    c.fillStyle = rgba(PUR, 0.12);
    for (let i = 0; i < 40; i++) {
      const wy = G.cam + (hash2(i + ((G.cam / 40) | 0) * 3) * (VH + 40));
      const y = screenY(wy);
      if (y < -8 || y > VH + 8) continue;
      const lane = laneAt(wy);
      const x = lane.L + 8 + hash2(i * 19 + 4) * (lane.w - 16);
      c.fillRect(sx(x), sy(y), (1.2 + hash2(i) * 2.2) * scale, (1 + hash2(i + 2) * 1.6) * scale);
    }
  }

  function drawStars() {
    const c = ctx;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      let y = s.y + (G.cam * s.p) % (VH + 20);
      y = y % (VH + 20);
      if (y < 0) y += VH + 20;
      c.fillStyle = rgba(WHT, 0.18 + s.s * 0.18);
      c.fillRect(sx(s.x), sy(y - 10), s.s * scale, s.s * scale);
    }
  }

  function drawBlock(e, y) {
    const c = ctx;
    const air = !isTank();
    const a = air ? 0.55 : 1;
    c.save();
    c.globalAlpha = a;
    const x = sx(e.x - e.hw);
    const yy = sy(y - e.hh);
    const w = e.hw * 2 * scale;
    const h = e.hh * 2 * scale;
    c.fillStyle = e.flash > 0 ? rgba(WHT, 0.9) : rgba(MAG, 0.92);
    rr(x, yy, w, h, 3 * scale);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.45);
    c.fillRect(x + w * 0.18, yy + h * 0.2, w * 0.22, h * 0.22);
    c.fillRect(x + w * 0.58, yy + h * 0.2, w * 0.22, h * 0.22);
    c.fillRect(x + w * 0.18, yy + h * 0.55, w * 0.64, h * 0.18);
    c.restore();
    if (air) {
      c.strokeStyle = rgba(MAG, 0.35);
      c.lineWidth = scale;
      c.strokeRect(x, yy, w, h);
    }
  }

  function drawHang(e, y) {
    const c = ctx;
    const tank = isTank();
    c.save();
    c.globalAlpha = tank ? 0.42 : 0.95;
    const x = sx(e.x - e.hw);
    const yy = sy(y - e.hh);
    const w = e.hw * 2 * scale;
    const h = e.hh * 2 * scale;
    c.fillStyle = rgba(CYN, tank ? 0.35 : 0.7);
    rr(x, yy, w, h, 4 * scale);
    c.fill();
    c.strokeStyle = rgba(CYN, 0.95);
    c.lineWidth = Math.max(1, 1.4 * scale);
    c.stroke();
    c.beginPath();
    for (let i = 0; i < 5; i++) {
      const px = x + (i + 0.5) * w / 5;
      c.moveTo(px, yy);
      c.lineTo(px, yy + h);
    }
    c.stroke();
    c.restore();
  }

  function drawGun(e, y) {
    const c = ctx;
    const air = !isTank();
    c.save();
    c.globalAlpha = air ? 0.62 : 1;
    c.translate(sx(e.x), sy(y));
    c.fillStyle = e.flash > 0 ? rgba(WHT, 0.9) : rgba(MAG, 0.95);
    c.beginPath();
    c.arc(0, 0, e.hw * scale, 0, TAU);
    c.fill();
    c.fillStyle = rgba(SOIL, 0.9);
    c.beginPath();
    c.arc(0, 0, 4.2 * scale, 0, TAU);
    c.fill();
    c.rotate(e.ang || 0);
    c.fillStyle = rgba(GOLD, 0.9);
    c.fillRect(-2 * scale, 0, 4 * scale, -14 * scale);
    c.restore();
  }

  function drawDrone(e, y) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(y));
    c.fillStyle = e.flash > 0 ? rgba(WHT, 0.95) : rgba(HOT, 0.95);
    c.beginPath();
    c.moveTo(0, -11 * scale);
    c.lineTo(12 * scale, 0);
    c.lineTo(0, 9 * scale);
    c.lineTo(-12 * scale, 0);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(CYN, 0.9);
    c.beginPath();
    c.arc(0, -1 * scale, 3.2 * scale, 0, TAU);
    c.fill();
    c.restore();
  }

  function drawPod(e, y) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(y));
    c.rotate(e.spin * 0.6);
    c.fillStyle = e.kind === 'life' ? rgba(PNK, 0.95) : rgba(GOLD, 0.95);
    c.beginPath();
    c.moveTo(0, -8 * scale);
    c.lineTo(8 * scale, 0);
    c.lineTo(0, 8 * scale);
    c.lineTo(-8 * scale, 0);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.85);
    c.fillRect(-2 * scale, -2 * scale, 4 * scale, 4 * scale);
    c.restore();
  }

  function drawCore(e, y) {
    const c = ctx;
    c.save();
    c.translate(sx(e.x), sy(y));
    const pulse = 0.85 + Math.sin(G.t * 6) * 0.15;
    c.fillStyle = e.flash > 0 ? rgba(WHT, 0.95) : rgba(PUR, 0.92);
    c.beginPath();
    c.ellipse(0, 0, 30 * scale * pulse, 24 * scale, 0, 0, TAU);
    c.fill();
    c.strokeStyle = rgba(GOLD, 0.85);
    c.lineWidth = 2 * scale;
    c.stroke();
    c.fillStyle = rgba(MAG, 0.95);
    c.beginPath();
    c.arc(0, 0, 10 * scale * pulse, 0, TAU);
    c.fill();
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.arc(0, -1 * scale, 4.2 * scale, 0, TAU);
    c.fill();
    const t = e.max ? e.hp / e.max : 1;
    c.fillStyle = rgba(SOIL, 0.7);
    c.fillRect(-22 * scale, 18 * scale, 44 * scale, 5 * scale);
    c.fillStyle = rgba(t < 0.35 ? MAG : GOLD, 0.95);
    c.fillRect(-22 * scale, 18 * scale, 44 * scale * t, 5 * scale);
    c.restore();
  }

  function drawPlane(x, y, a) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(y));
    c.globalAlpha = a;
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle * 8);
      c.beginPath();
      c.moveTo(-3 * scale, -16 * scale);
      c.lineTo(0, -26 * scale);
      c.lineTo(3 * scale, -16 * scale);
      c.fill();
    }
    c.fillStyle = rgba(CYN, 0.98);
    c.beginPath();
    c.moveTo(0, -16 * scale);
    c.lineTo(11 * scale, 8 * scale);
    c.lineTo(3.5 * scale, 4 * scale);
    c.lineTo(3.2 * scale, 12 * scale);
    c.lineTo(-3.2 * scale, 12 * scale);
    c.lineTo(-3.5 * scale, 4 * scale);
    c.lineTo(-11 * scale, 8 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(WHT, 0.9);
    c.beginPath();
    c.moveTo(0, -8 * scale);
    c.lineTo(3.4 * scale, 1 * scale);
    c.lineTo(-3.4 * scale, 1 * scale);
    c.closePath();
    c.fill();
    c.fillStyle = rgba(MAG, 0.85);
    c.fillRect(-5 * scale, 10 * scale, 3.2 * scale, 4 * scale);
    c.fillRect(1.8 * scale, 10 * scale, 3.2 * scale, 4 * scale);
    c.restore();
  }

  function drawTank(x, y, a) {
    const c = ctx;
    c.save();
    c.translate(sx(x), sy(y));
    c.globalAlpha = a;
    c.fillStyle = rgba(MAG, 0.95);
    rr(-14 * scale, -8 * scale, 28 * scale, 18 * scale, 3 * scale);
    c.fill();
    c.fillStyle = rgba(SOIL, 0.9);
    c.fillRect(-15 * scale, 6 * scale, 30 * scale, 5 * scale);
    c.fillRect(-15 * scale, -9 * scale, 30 * scale, 3.2 * scale);
    c.fillStyle = rgba(GOLD, 0.95);
    c.beginPath();
    c.arc(0, 0, 6.2 * scale, 0, TAU);
    c.fill();
    if (G.muzzle > 0) {
      c.fillStyle = rgba(WHT, G.muzzle * 8);
      c.fillRect(-2 * scale, -28 * scale, 4 * scale, 10 * scale);
    }
    c.fillStyle = rgba(CYN, 0.95);
    c.fillRect(-2.2 * scale, -18 * scale, 4.4 * scale, 14 * scale);
    c.restore();
  }

  function drawPlayer() {
    if (G.mode !== 'play' && G.mode !== 'win') return;
    if (G.deadT > 0) return;
    if (G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0) return;
    const morph = clamp(G.morph / 0.2, 0, 1);
    if (morph > 0) {
      if (isTank()) {
        drawPlane(G.px, G.py, morph);
        drawTank(G.px, G.py, 1 - morph);
      } else {
        drawTank(G.px, G.py, morph);
        drawPlane(G.px, G.py, 1 - morph);
      }
    } else if (isTank()) {
      drawTank(G.px, G.py, 1);
    } else {
      drawPlane(G.px, G.py, 1);
    }
  }

  function drawShots() {
    const c = ctx;
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const y = screenY(s.wy);
      if (!REDUCE && s.trail) {
        for (let k = 0; k < s.trail.length; k++) {
          const t = s.trail[k];
          const a = (k + 1) / s.trail.length * 0.35;
          c.fillStyle = rgba(s.tank ? GOLD : CYN, a);
          c.fillRect(sx(t.x - 1.2), sy(screenY(t.wy)), 2.4 * scale, 6 * scale);
        }
      }
      c.fillStyle = rgba(s.tank ? GOLD : CYN, 0.98);
      c.fillRect(sx(s.x - (s.tank ? 2.2 : 1.4)), sy(y - 8), (s.tank ? 4.4 : 2.8) * scale, 12 * scale);
    }
    for (let i = 0; i < G.eShots.length; i++) {
      const s = G.eShots[i];
      const y = screenY(s.wy);
      c.fillStyle = rgba(MAG, 0.95);
      c.beginPath();
      c.arc(sx(s.x), sy(y), 3.1 * scale, 0, TAU);
      c.fill();
    }
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
    c.fillStyle = '#070312';
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

    const g = c.createLinearGradient(sx(0), sy(0), sx(0), sy(VH));
    g.addColorStop(0, '#160a24');
    g.addColorStop(1, '#070312');
    c.fillStyle = g;
    c.fillRect(sx(0), sy(0), VW * scale, VH * scale);

    drawStars();
    drawSoil();
    drawWalls();

    const ground = [];
    const air = [];
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive && e.type !== 'core') continue;
      const y = screenY(e.wy);
      if (y < -40 || y > VH + 40) continue;
      if (e.type === 'block' || e.type === 'gun') ground.push(e);
      else air.push(e);
    }
    for (let i = 0; i < ground.length; i++) {
      const e = ground[i];
      const y = screenY(e.wy);
      if (e.type === 'block') drawBlock(e, y);
      else drawGun(e, y);
    }
    if (isTank()) drawPlayer();
    for (let i = 0; i < air.length; i++) {
      const e = air[i];
      const y = screenY(e.wy);
      if (e.type === 'hang') drawHang(e, y);
      else if (e.type === 'drone') drawDrone(e, y);
      else if (e.type === 'pod') drawPod(e, y);
      else if (e.type === 'core') drawCore(e, y);
    }
    if (!isTank()) drawPlayer();
    drawShots();
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

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('surf');
    else startGame(G.kind || 'surf');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('surf');
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
    const xformKey = k === 'c' || k === 'C' || k === 'Shift' || e.code === 'ShiftLeft' || e.code === 'ShiftRight';
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter' || xformKey)) {
      e.preventDefault();
    }
    if (!down) {
      if (space) G.fireHold = false;
      return;
    }
    if (e.repeat && (k === 'r' || k === 'R' || xformKey)) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (xformKey) {
      audio.ensure();
      if (overlayOpen()) {
        primaryAction();
        return;
      }
      transform();
      return;
    }
    if (G.mode === 'title' && (k === '1' || k === '2')) {
      startGame(k === '2' ? 'raid' : 'surf');
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
        transform();
        return;
      }
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 40, VH - 20);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = clamp(pointerWorldY(e), 40, VH - 20);
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

  if (btnSurf) {
    btnSurf.addEventListener('click', function () {
      audio.ensure();
      startGame('surf');
    });
  }
  if (btnRaid) {
    btnRaid.addEventListener('click', function () {
      audio.ensure();
      startGame('raid');
    });
  }
  if (btnOvRetry) {
    btnOvRetry.addEventListener('click', function () {
      audio.ensure();
      startGame(G.kind || 'surf');
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
  if (btnXform) {
    btnXform.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      audio.ensure();
      transform();
      btnXform.classList.add('held');
    });
    btnXform.addEventListener('pointerup', function () {
      btnXform.classList.remove('held');
    });
    btnXform.addEventListener('pointercancel', function () {
      btnXform.classList.remove('held');
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
