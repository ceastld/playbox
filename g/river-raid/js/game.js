'use strict';

(function () {
  const VW = 480;
  const VH = 720;
  const FIELD = 668;
  const PLAYER_SY = 578;
  const LIVES = 3;
  const LIFE_CAP = 6;
  const LIFE_EVERY = 10000;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const COMBO_WIN = 1.35;
  const BEST_KEY = 'playbox-river-raid-best';
  const MUTE_KEY = 'playbox-river-raid-mute';
  const OPS = '← → 转向 · ↑ 加速 ↓ 减速 · 空格 / 点按开火 · R 重开 · M 静音';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  const MAG = [255, 61, 184];
  const CYN = [0, 240, 255];
  const GOLD = [255, 227, 107];
  const MINT = [46, 255, 136];
  const LEAF = [20, 224, 112];
  const HOT = [122, 255, 176];
  const WHT = [246, 243, 255];
  const PNK = [255, 154, 212];
  const ORG = [255, 168, 74];

  const SCORE = { boat: 30, heli: 60, jet: 100, fuel: 80, bridge: 500 };
  const HW = { boat: 16, heli: 14, jet: 13, fuel: 11, plane: 7 };
  const HH = { boat: 7, heli: 8, jet: 6, fuel: 12, plane: 11 };

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const btnClassic = document.getElementById('btn-classic');
  const btnRapids = document.getElementById('btn-rapids');
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
  const pointer = { down: false, hover: false, x: VW * 0.5, y: PLAYER_SY, id: null };
  const pips = [];
  const particles = [];
  const sparks = [];
  const rings = [];
  const floats = [];
  const wakes = [];

  const G = {
    mode: 'title',
    kind: 'classic',
    t: 0,
    clock: 0,
    alt: 40,
    spd: 150,
    ship: { x: VW * 0.5, vx: 0 },
    lives: LIVES,
    score: 0,
    best: 0,
    fuel: 100,
    combo: 0,
    comboT: 0,
    mult: 1,
    section: 1,
    checkY: 0,
    secLen: 1220,
    nextLife: LIFE_EVERY,
    ents: [],
    shots: [],
    spawnedY: 0,
    bridges: {},
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
    siphon: 0,
    alarmT: 0,
    toastT: 0,
    why: '',
    rotor: 0
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
  function isRapids() {
    return G.kind === 'rapids';
  }
  function secLen() {
    return G.secLen;
  }
  function minSpd() {
    return isRapids() ? 112 : 74;
  }
  function maxSpd() {
    return isRapids() ? 392 : 304;
  }
  function cruise() {
    return isRapids() ? 214 : 154;
  }
  function turnSpd() {
    return isRapids() ? 340 : 286;
  }
  function worldToScreenY(wy) {
    return PLAYER_SY - (wy - G.alt);
  }
  function screenToWorldY(syv) {
    return G.alt + (PLAYER_SY - syv);
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

  function riverAt(y) {
    const rap = isRapids();
    const meander = rap ? 158 : 124;
    const n1 = fbm(y * 0.00172, 1);
    const n2 = fbm(y * 0.00066, 5);
    let cx = VW * 0.5 + (n1 - 0.5) * meander + (n2 - 0.5) * 36;
    const base = rap ? 116 : 168;
    const varW = rap ? 64 : 72;
    let w = base + (fbm(y * 0.00235, 3) - 0.5) * varW * 2;
    const canyon = fbm(y * 0.00105, 11);
    if (canyon > 0.7) {
      const t = (canyon - 0.7) / 0.3;
      w *= 1 - (rap ? 0.48 : 0.38) * t * t;
    }
    w = Math.max(rap ? 62 : 86, w);

    if (y < 340) {
      const t = 1 - y / 340;
      const e = t * t * (3 - 2 * t);
      cx = lerp(cx, VW * 0.5, e);
      w = lerp(w, rap ? 188 : 248, e);
    }

    const sl = secLen();
    const local = ((y % sl) + sl) % sl;
    const toBridge = sl - local;
    if (toBridge < 90) {
      const t = 1 - toBridge / 90;
      w = lerp(w, rap ? 168 : 210, t * t);
      cx = lerp(cx, VW * 0.5, t * 0.55);
    }
    if (local < 70 && y > sl * 0.5) {
      const t = 1 - local / 70;
      w = lerp(w, rap ? 168 : 210, t * t);
      cx = lerp(cx, VW * 0.5, t * 0.45);
    }

    let L = cx - w * 0.5;
    let R = cx + w * 0.5;
    if (L < 16) {
      R += 16 - L;
      L = 16;
    }
    if (R > VW - 16) {
      L -= R - (VW - 16);
      R = VW - 16;
    }
    L = Math.max(12, L);
    R = Math.min(VW - 12, R);
    if (R - L < 56) {
      const m = (L + R) * 0.5;
      L = m - 28;
      R = m + 28;
    }

    let island = null;
    const iwNeed = rap ? 148 : 178;
    if (R - L > iwNeed && toBridge > 140 && local > 110) {
      const inn = fbm(y * 0.0028, 19);
      if (inn > 0.62) {
        const iw = 22 + (inn - 0.62) * 90;
        const mid = (L + R) * 0.5 + (fbm(y * 0.0033, 23) - 0.5) * 28;
        const iL = mid - iw * 0.5;
        const iR = mid + iw * 0.5;
        if (iL > L + 28 && iR < R - 28) island = { L: iL, R: iR };
      }
    }
    return { L: L, R: R, cx: (L + R) * 0.5, w: R - L, island: island };
  }

  function onLand(x, y, half) {
    const r = riverAt(y);
    if (x - half < r.L || x + half > r.R) return true;
    if (r.island && x + half > r.island.L && x - half < r.island.R) return true;
    return false;
  }

  function waterX(y, margin, pick) {
    const r = riverAt(y);
    let segs = [];
    if (r.island) {
      segs.push([r.L + margin, r.island.L - margin]);
      segs.push([r.island.R + margin, r.R - margin]);
    } else {
      segs.push([r.L + margin, r.R - margin]);
    }
    const ok = [];
    for (let i = 0; i < segs.length; i++) {
      if (segs[i][1] - segs[i][0] > 10) ok.push(segs[i]);
    }
    if (!ok.length) return r.cx;
    const s = ok[Math.floor(pick * ok.length) % ok.length];
    const u = (pick * 17.13) % 1;
    return lerp(s[0], s[1], u);
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
      this.beep(780, 0.065, 'square', 0.036, 1640);
    },
    hit(kind, combo) {
      this.ensure();
      const base = kind === 'jet' ? 980 : kind === 'heli' ? 740 : kind === 'fuel' ? 620 : 480;
      const lift = 1 + Math.min(0.5, combo * 0.04);
      this.noise(0.05, 0.042, 1100);
      this.beep(base * lift, 0.09, 'square', 0.05, base * lift * 1.5);
    },
    fuelShot() {
      this.ensure();
      this.beep(392, 0.08, 'sine', 0.045, 784);
      this.beep(523, 0.12, 'triangle', 0.04, 1046);
      this.beep(784, 0.16, 'sine', 0.035, 1318);
      this.noise(0.06, 0.03, 700);
    },
    siphon() {
      this.ensure();
      this.beep(220, 0.05, 'sine', 0.022, 440);
    },
    bridge() {
      this.ensure();
      this.noise(0.18, 0.07, 280);
      this.beep(180, 0.16, 'sawtooth', 0.05, 70);
      this.beep(330, 0.22, 'triangle', 0.04, 110);
    },
    alarm() {
      this.ensure();
      this.beep(880, 0.07, 'square', 0.03, 440);
    },
    combo(m) {
      this.ensure();
      this.beep(440 * m, 0.08, 'sine', 0.04, 660 * m);
      this.beep(880, 0.12, 'triangle', 0.03, 1320);
    },
    miss() {
      this.ensure();
      this.beep(140, 0.07, 'sine', 0.022, 80);
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
    check() {
      this.ensure();
      this.beep(392, 0.09, 'sine', 0.04, 523);
      this.beep(659, 0.16, 'triangle', 0.04, 880);
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
      if (G.mode === 'title') stageLabel.textContent = '河袭';
      else stageLabel.textContent = '第 ' + G.section + ' 段';
      stageLabel.classList.toggle('hot', G.mode === 'play' && G.section >= 5);
    }
    if (tagLabel) {
      tagLabel.textContent = isRapids() ? '急流' : '经典';
      tagLabel.classList.toggle('warn', G.mode === 'lose' || G.fuel < 22 || G.lives === 1);
      tagLabel.classList.toggle('hot', G.combo >= 8);
    }
    if (comboEl) {
      if (G.mode === 'play' && G.combo >= 2) {
        comboEl.hidden = false;
        comboEl.textContent = '连击 ×' + G.mult;
      } else {
        comboEl.hidden = true;
      }
    }
    if (fuelBar) {
      const t = clamp(G.fuel / 100, 0, 1);
      fuelBar.style.transform = 'scaleX(' + t + ')';
    }
    if (fuelWrap) {
      fuelWrap.classList.toggle('low', G.mode === 'play' && G.fuel < 22);
      fuelWrap.classList.toggle('hot', G.siphon > 0);
    }
    if (G.mode === 'title') setHint(OPS, '');
    else if (G.mode === 'lose') setHint('R 重开 · 撞岸、撞敌、撞桥或油尽即坠', 'warn');
    else if (G.fuel < 22) setHint('燃油告急 · 找金罐飞过去或打掉', 'warn');
    else if (G.lives === 1) setHint('最后一命 · 桥是检查点', 'warn');
    else setHint('← → 转向 · ↑ 加速 · 空格开火 · 打桥才能过', '');
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
    ovKicker.textContent = kind === 'lose' ? 'DOWN' : 'RIVER';
    ovTitle.textContent = title;
    ovLead.textContent = lead;
    ovOps.textContent = OPS;
    btnClassic.textContent = primary;
    if (btnRapids) {
      btnRapids.classList.toggle('hidden', !secondary);
      if (secondary) btnRapids.textContent = secondary;
    }
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
    if (REDUCE || G.mode !== 'play') return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.045, mag * 0.006));
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
      vx0: -180, vx1: 180, vy0: -80, vy1: 220,
      r0: 1.4, r1: 4.2, life: 0.42 + p * 0.006, rgb: rgb, g: 520
    });
    emit(6, {
      x: x, y: y, j: 3,
      vx0: -60, vx1: 60, vy0: 40, vy1: 140,
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

  function pushEnt(e) {
    G.ents.push(e);
  }

  function occupied(y, x, rad) {
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (Math.abs(e.y - y) < 40 && Math.abs(e.x - x) < rad) return true;
    }
    return false;
  }

  function nearBridge(y) {
    const sl = secLen();
    const local = ((y % sl) + sl) % sl;
    return local < 70 || sl - local < 90;
  }

  function trySpawn(y) {
    if (y < 280) return;
    if (nearBridge(y)) return;
    const slice = (y / 48) | 0;
    const h = hash2(slice * 13 + (isRapids() ? 91 : 7));
    const dens = y < 720 ? 0.38 : y < 1800 ? 0.72 : 1;
    const boost = isRapids() ? 1.22 : 1;
    if (h > 0.58 * dens * boost) return;

    const r = riverAt(y);
    if (r.w < 72 && h > 0.28) return;

    let type = 'boat';
    const u = hash2(slice * 29 + 3);
    if (u < 0.22) type = 'fuel';
    else if (u < 0.46) type = 'heli';
    else if (u < 0.58) type = 'jet';
    else type = 'boat';
    if (y < 520 && type === 'jet') type = 'boat';
    if (r.w < 90 && type === 'fuel') type = 'boat';

    const pick = hash2(slice * 41 + 11);
    const x = type === 'jet'
      ? (pick > 0.5 ? -24 : VW + 24)
      : waterX(y, 18, pick);
    if (type !== 'jet' && occupied(y, x, 36)) return;

    const dir = pick > 0.5 ? 1 : -1;
    const e = {
      type: type,
      x: x,
      y: y,
      vx: 0,
      alive: true,
      hw: HW[type],
      hh: HH[type],
      active: type !== 'jet',
      phase: pick * TAU
    };
    if (type === 'boat') e.vx = dir * (22 + hash2(slice + 5) * 28);
    if (type === 'heli') e.vx = dir * (48 + hash2(slice + 8) * 42);
    if (type === 'jet') e.vx = (x < 0 ? 1 : -1) * (190 + hash2(slice + 2) * 90);
    if (type === 'fuel') e.vx = 0;
    pushEnt(e);

    if (isRapids() && type !== 'fuel' && hash2(slice * 17 + 4) > 0.72) {
      const y2 = y + 26;
      const x2 = waterX(y2, 18, hash2(slice * 9 + 2));
      if (!occupied(y2, x2, 30) && !nearBridge(y2)) {
        pushEnt({
          type: 'boat', x: x2, y: y2,
          vx: -dir * 30, alive: true,
          hw: HW.boat, hh: HH.boat, active: true, phase: 1
        });
      }
    }
  }

  function ensureWorld() {
    const ahead = G.alt + PLAYER_SY + 340;
    while (G.spawnedY < ahead) {
      G.spawnedY += 48;
      trySpawn(G.spawnedY);
    }
    const sl = secLen();
    const from = Math.max(1, Math.floor((G.alt - 80) / sl));
    const to = Math.ceil((G.alt + PLAYER_SY + 360) / sl);
    for (let n = from; n <= to; n++) {
      if (G.bridges[n]) continue;
      G.bridges[n] = true;
      pushEnt({
        type: 'bridge',
        n: n,
        x: VW * 0.5,
        y: n * sl,
        vx: 0,
        alive: true,
        hw: VW * 0.5,
        hh: 13,
        collapse: 0,
        bits: [],
        active: true,
        phase: 0
      });
    }
    const behind = G.alt - 140;
    let w = 0;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      const keep = e.y > behind && (e.alive || (e.type === 'bridge' && e.collapse > 0));
      if (keep) G.ents[w++] = e;
    }
    G.ents.length = w;
  }

  function resetRun() {
    G.alt = 48;
    G.spd = cruise();
    G.ship.x = VW * 0.5;
    G.ship.vx = 0;
    G.lives = LIVES;
    G.score = 0;
    G.fuel = 100;
    G.combo = 0;
    G.comboT = 0;
    G.mult = 1;
    G.section = 1;
    G.checkY = 0;
    G.nextLife = LIFE_EVERY;
    G.ents.length = 0;
    G.shots.length = 0;
    G.spawnedY = 0;
    G.bridges = {};
    G.fireCd = 0;
    G.deadT = 0;
    G.invuln = 0.4;
    G.stop = 0;
    G.shake = 0;
    G.flash = 0;
    G.punch = 1;
    G.muzzle = 0;
    G.siphon = 0;
    G.alarmT = 0;
    G.why = '';
    particles.length = 0;
    sparks.length = 0;
    rings.length = 0;
    floats.length = 0;
    wakes.length = 0;
    if (scoreEl) scoreEl.textContent = '0';
    ensureWorld();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.kind = 'classic';
    G.secLen = 1220;
    resetRun();
    G.invuln = 99;
    G.spd = 92;
    showOverlay('title', '河袭', '沿河道飞，打船打桥，别撞岸。油尽也会坠。飞过油罐或打掉都能补油。', '经典', '急流');
    syncHud();
  }

  function startGame(kind) {
    G.kind = kind === 'rapids' ? 'rapids' : 'classic';
    G.secLen = isRapids() ? 960 : 1220;
    G.mode = 'play';
    resetRun();
    hideOverlay();
    audio.start();
    toast(isRapids() ? '急流 · 更窄更快' : '经典 · 桥是检查点', false, !isRapids());
    syncHud();
  }

  function loseRun() {
    G.mode = 'lose';
    saveBest();
    audio.lose();
    const why = G.why || '坠河了';
    showOverlay('lose', '坠河了', why + '  ·  分数 ' + G.score, '再来', '换模式');
    setHint('R 重开', 'warn');
    syncHud();
  }

  function respawn() {
    G.alt = G.checkY + 36;
    G.spd = cruise();
    const r = riverAt(G.alt);
    G.ship.x = r.cx;
    G.ship.vx = 0;
    G.fuel = 100;
    G.invuln = 1.35;
    G.shots.length = 0;
    G.siphon = 0;
    breakCombo();
    toast('剩余 ' + G.lives + ' 命', true, false);
    syncHud();
  }

  function killPlayer(why) {
    if (G.mode !== 'play' || G.deadT > 0 || G.invuln > 0) return;
    G.why = why;
    G.deadT = 0.92;
    G.lives -= 1;
    breakCombo();
    explode(G.ship.x, G.alt, MAG, 32);
    emit(16, {
      x: G.ship.x, y: G.alt, j: 8,
      vx0: -220, vx1: 220, vy0: -40, vy1: 260,
      r0: 2, r1: 5.5, life: 0.55, rgb: CYN, g: 380
    });
    audio.death();
    hitStop(0.072);
    kick(8);
    screenFlash(MAG, 0.58);
    G.shots.length = 0;
    syncPips();
  }

  function award(kind, x, y) {
    bumpCombo();
    const n = (SCORE[kind] || 10) * G.mult;
    addScore(n);
    floatText(x, y + 8, '+' + n, kind === 'fuel' || kind === 'bridge' ? GOLD : WHT, kind === 'bridge' || G.mult >= 3);
  }

  function destroy(e) {
    if (!e.alive) return;
    e.alive = false;
    if (e.type === 'bridge') {
      e.collapse = 0.9;
      e.bits = [];
      for (let i = 0; i < 20; i++) {
        e.bits.push({
          x: 16 + i * (VW - 32) / 19,
          y: e.y,
          vx: rand(-50, 50),
          vy: rand(-30, 40),
          w: rand(10, 26),
          h: rand(5, 11),
          rot: rand(0, TAU),
          rv: rand(-5, 5)
        });
      }
      G.checkY = e.y;
      G.section = Math.max(G.section, e.n + 1);
      award('bridge', e.x, e.y);
      audio.bridge();
      hitStop(0.08);
      kick(7);
      screenFlash(GOLD, 0.5);
      explode(e.x, e.y, MAG, 26);
      for (let k = 0; k < 8; k++) {
        explode(40 + k * 56, e.y, k & 1 ? GOLD : MAG, 12);
      }
      toast('桥断了 · 第 ' + G.section + ' 段', false, true);
      audio.check();
      return;
    }
    const rgb = e.type === 'fuel' ? GOLD : e.type === 'heli' ? GOLD : e.type === 'jet' ? PNK : MAG;
    explode(e.x, e.y, rgb, e.type === 'fuel' ? 22 : 16);
    if (e.type === 'fuel') {
      G.fuel = clamp(G.fuel + 34, 0, 100);
      G.siphon = 0.35;
      award('fuel', e.x, e.y);
      floatText(e.x, e.y - 10, '+油', GOLD, true);
      audio.fuelShot();
      hitStop(0.055);
      kick(4);
      screenFlash(GOLD, 0.42);
    } else {
      award(e.type, e.x, e.y);
      audio.hit(e.type, G.combo);
      hitStop(clamp(0.032 + G.combo * 0.003, 0.032, 0.06));
      kick(3.2);
      screenFlash(rgb, 0.28);
    }
  }

  function fire() {
    if (G.mode !== 'play' || G.deadT > 0) return;
    if (overlayOpen()) return;
    const cap = isRapids() ? 2 : 1;
    if (G.shots.length >= cap) return;
    if (G.fireCd > 0) return;
    G.shots.push({
      x: G.ship.x,
      y: G.alt + 14,
      vy: G.spd + 500,
      trail: []
    });
    G.fireCd = isRapids() ? 0.09 : 0.05;
    audio.shoot();
    screenFlash(CYN, 0.16);
    G.muzzle = 0.07;
    emit(5, {
      x: G.ship.x, y: G.alt + 16, j: 2,
      vx0: -40, vx1: 40, vy0: 80, vy1: 180,
      r0: 1, r1: 2.4, life: 0.16, rgb: CYN, g: 0
    });
  }

  function aabb(ax, ay, aw, ah, bx, by, bw, bh) {
    return Math.abs(ax - bx) < aw + bw && Math.abs(ay - by) < ah + bh;
  }

  function updateShots(dt) {
    for (let i = G.shots.length - 1; i >= 0; i--) {
      const s = G.shots[i];
      if (!REDUCE) {
        if (!s.trail) s.trail = [];
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > 6) s.trail.shift();
      }
      s.y += s.vy * dt;
      if (worldToScreenY(s.y) < -28) {
        G.shots.splice(i, 1);
        if (G.mode === 'play') {
          breakCombo();
          audio.miss();
        }
        continue;
      }
      let hit = false;
      for (let k = 0; k < G.ents.length; k++) {
        const e = G.ents[k];
        if (!e.alive) continue;
        const hh = e.type === 'bridge' ? 14 : e.hh;
        const hw = e.type === 'bridge' ? VW * 0.5 : e.hw;
        if (aabb(s.x, s.y, 2.2, 8, e.x, e.y, hw, hh)) {
          destroy(e);
          hit = true;
          break;
        }
      }
      if (hit) G.shots.splice(i, 1);
    }
  }

  function bounceX(e, y) {
    const r = riverAt(y);
    const m = e.hw + 3;
    if (e.x < r.L + m) {
      e.x = r.L + m;
      e.vx = Math.abs(e.vx);
    }
    if (e.x > r.R - m) {
      e.x = r.R - m;
      e.vx = -Math.abs(e.vx);
    }
    if (r.island) {
      if (e.x > r.island.L - m && e.x < r.island.R + m) {
        const mid = (r.island.L + r.island.R) * 0.5;
        if (e.x < mid) {
          e.x = r.island.L - m;
          e.vx = -Math.abs(e.vx);
        } else {
          e.x = r.island.R + m;
          e.vx = Math.abs(e.vx);
        }
      }
    }
  }

  function updateEnts(dt) {
    G.rotor += dt * (12 + G.spd * 0.02);
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (e.type === 'bridge') {
        if (e.collapse > 0) {
          e.collapse -= dt;
          for (let b = 0; b < e.bits.length; b++) {
            const bit = e.bits[b];
            bit.x += bit.vx * dt;
            bit.y += bit.vy * dt;
            bit.vy -= 420 * dt;
            bit.rot += bit.rv * dt;
          }
        }
        continue;
      }
      if (!e.alive) continue;
      if (e.type === 'jet') {
        if (!e.active && worldToScreenY(e.y) > -40) e.active = true;
        if (e.active) {
          e.x += e.vx * dt;
          if (e.x < -40 || e.x > VW + 40) e.alive = false;
        }
      } else if (e.type !== 'fuel') {
        e.x += e.vx * dt;
        bounceX(e, e.y);
      }
    }
  }

  function updatePlayer(dt) {
    const acc = 2400;
    const spd = turnSpd();
    if (keys.l || keys.r) {
      if (keys.l) G.ship.vx -= acc * dt;
      if (keys.r) G.ship.vx += acc * dt;
      G.ship.vx = clamp(G.ship.vx, -spd, spd);
      G.ship.x += G.ship.vx * dt;
    } else if ((pointer.down || pointer.hover) && inputSrc === 'ptr') {
      G.ship.x = lerp(G.ship.x, pointer.x, 1 - Math.exp(-dt * 16));
      G.ship.vx = 0;
    } else {
      G.ship.vx *= Math.exp(-dt * 10);
      G.ship.x += G.ship.vx * dt;
    }
    G.ship.x = clamp(G.ship.x, 10, VW - 10);

    const lo = minSpd();
    const hi = maxSpd();
    if (inputSrc === 'ptr' && (pointer.down || pointer.hover)) {
      const t = clamp((PLAYER_SY + 70 - pointer.y) / 260, 0, 1);
      const target = lerp(lo, hi, t);
      G.spd = lerp(G.spd, target, 1 - Math.exp(-dt * 5.5));
    } else {
      if (keys.u) G.spd += 220 * dt;
      if (keys.d) G.spd -= 240 * dt;
    }
    G.spd = clamp(G.spd, lo, hi);
  }

  function fuelDrain(dt) {
    const t = (G.spd - minSpd()) / Math.max(1, maxSpd() - minSpd());
    const rate = (isRapids() ? 4.1 : 3.55) + t * (isRapids() ? 6.4 : 5.6);
    G.fuel -= rate * dt;
    if (G.fuel < 22) {
      G.alarmT -= dt;
      if (G.alarmT <= 0) {
        G.alarmT = G.fuel < 9 ? 0.28 : 0.5;
        audio.alarm();
      }
    }
    if (G.fuel <= 0) {
      G.fuel = 0;
      killPlayer('油尽了');
    }
  }

  function checkCollide() {
    if (G.deadT > 0) return;
    const x = G.ship.x;
    const y = G.alt;
    if (G.invuln > 0) {
      if (onLand(x, y, HW.plane + 2)) {
        G.ship.x = lerp(G.ship.x, riverAt(y).cx, 0.42);
      }
      return;
    }
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      const yy = y + (i - 1) * 6;
      if (onLand(x, yy, HW.plane)) {
        const riv = riverAt(yy);
        const isle = riv.island && x > riv.island.L && x < riv.island.R;
        killPlayer(isle ? '撞岛了' : '撞岸了');
        return;
      }
    }
    let siphoning = false;
    for (let i = 0; i < G.ents.length; i++) {
      const e = G.ents[i];
      if (!e.alive) continue;
      if (e.type === 'fuel') {
        if (aabb(x, y, HW.plane + 4, HH.plane + 4, e.x, e.y, e.hw, e.hh)) {
          siphoning = true;
          G.fuel = clamp(G.fuel + 58 * STEP, 0, 100);
          G.siphon = 0.2;
          if ((G.clock * 9 | 0) !== ((G.clock - STEP) * 9 | 0)) {
            audio.siphon();
            emit(2, {
              x: e.x, y: e.y, j: 4,
              vx0: (x - e.x) * 2, vx1: (x - e.x) * 3,
              vy0: (y - e.y) * 2, vy1: (y - e.y) * 3,
              r0: 1.2, r1: 2.4, life: 0.22, rgb: GOLD, g: 0
            });
          }
        }
        continue;
      }
      const hw = e.type === 'bridge' ? VW * 0.5 : e.hw;
      const hh = e.type === 'bridge' ? 12 : e.hh;
      if (aabb(x, y, HW.plane, HH.plane, e.x, e.y, hw, hh)) {
        if (e.type === 'bridge') killPlayer('撞桥了');
        else if (e.type === 'boat') killPlayer('撞船了');
        else if (e.type === 'heli') killPlayer('撞直升机了');
        else killPlayer('撞机了');
        return;
      }
    }
    if (!siphoning) G.siphon = Math.max(0, G.siphon - STEP);
  }

  function updateFx(dt) {
    if (G.muzzle > 0) G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.siphon > 0) G.siphon = Math.max(0, G.siphon - dt);
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 3.4);
    G.punch = lerp(G.punch, 1, 1 - Math.exp(-dt * 14));
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    if (G.comboT > 0) {
      G.comboT -= dt;
      if (G.comboT <= 0) breakCombo();
    }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= p.g * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].t += dt;
      if (sparks[i].t > 0.28) sparks.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].t += dt;
      if (rings[i].t > 0.38) rings.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y += (f.vy || -70) * dt;
      if (f.t > f.life) floats.splice(i, 1);
    }
    for (let i = wakes.length - 1; i >= 0; i--) {
      wakes[i].t += dt;
      if (wakes[i].t > 0.35) wakes.splice(i, 1);
    }
  }

  function update(dt) {
    G.t += dt;
    G.clock += dt;
    if (G.invuln > 0 && G.mode === 'play') G.invuln = Math.max(0, G.invuln - dt);
    if (G.fireCd > 0) G.fireCd = Math.max(0, G.fireCd - dt);

    if (G.stop > 0) {
      G.stop -= dt;
      updateFx(dt * 0.4);
      return;
    }

    if (G.mode === 'title') {
      G.alt += 90 * dt;
      const r = riverAt(G.alt);
      G.ship.x = lerp(G.ship.x, r.cx, 1 - Math.exp(-dt * 2.4));
      ensureWorld();
      updateEnts(dt);
      updateFx(dt);
      if (G.fireHold) G.fireHold = false;
      return;
    }

    if (G.mode === 'lose') {
      updateEnts(dt);
      updateFx(dt);
      return;
    }

    if (G.deadT > 0) {
      G.deadT -= dt;
      updateEnts(dt);
      updateFx(dt);
      if (G.deadT <= 0) {
        if (G.lives <= 0) loseRun();
        else respawn();
      }
      syncHud();
      return;
    }

    updatePlayer(dt);
    const oldAlt = G.alt;
    G.alt += G.spd * dt;

    if (!REDUCE && ((G.clock * 40) | 0) !== ((G.clock - dt) * 40 | 0)) {
      wakes.push({ x: G.ship.x, y: oldAlt - 8, t: 0, w: 6 + G.spd * 0.02 });
      capArr(wakes, 28);
    }

    ensureWorld();
    updateEnts(dt);
    updateShots(dt);
    if (G.fireHold) fire();
    fuelDrain(dt);
    if (G.mode === 'play' && G.deadT <= 0) checkCollide();
    updateFx(dt);
    syncHud();
  }

  function drawBg() {
    ctx.fillStyle = '#07140c';
    ctx.fillRect(sx(0), sy(0), VW * scale, FIELD * scale);
  }

  function drawRiver() {
    const step = 4;
    const ptsL = [];
    const ptsR = [];
    const isles = [];
    for (let syy = -10; syy <= FIELD + 10; syy += step) {
      const wy = screenToWorldY(syy);
      const r = riverAt(wy);
      ptsL.push(r.L, syy);
      ptsR.push(r.R, syy);
      if (r.island) isles.push(r.island.L, r.island.R, syy);
    }

    const wg = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(FIELD));
    wg.addColorStop(0, '#0c4a4e');
    wg.addColorStop(0.5, '#0a3a42');
    wg.addColorStop(1, '#082e36');
    ctx.beginPath();
    ctx.moveTo(sx(ptsL[0]), sy(ptsL[1]));
    for (let i = 2; i < ptsL.length; i += 2) ctx.lineTo(sx(ptsL[i]), sy(ptsL[i + 1]));
    for (let i = ptsR.length - 2; i >= 0; i -= 2) ctx.lineTo(sx(ptsR[i]), sy(ptsR[i + 1]));
    ctx.closePath();
    ctx.fillStyle = wg;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.18;
    for (let syy = 8; syy < FIELD; syy += 14) {
      const wy = screenToWorldY(syy);
      const r = riverAt(wy);
      const shift = ((wy * 0.35 + G.t * 90) % 48) - 24;
      ctx.strokeStyle = rgba(CYN, 0.35);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(r.L + 6), sy(syy));
      ctx.lineTo(sx(r.R - 6), sy(syy));
      ctx.stroke();
      ctx.strokeStyle = rgba(MINT, 0.22);
      ctx.beginPath();
      ctx.moveTo(sx(r.cx + shift - 18), sy(syy + 4));
      ctx.lineTo(sx(r.cx + shift + 18), sy(syy + 4));
      ctx.stroke();
    }
    ctx.restore();

    if (isles.length) {
      ctx.fillStyle = '#0a2414';
      ctx.beginPath();
      for (let i = 0; i < isles.length; i += 3) {
        const iL = isles[i];
        const iR = isles[i + 1];
        const syy = isles[i + 2];
        ctx.fillRect(sx(iL), sy(syy), (iR - iL) * scale + 0.6, step * scale + 0.6);
      }
      ctx.strokeStyle = rgba(MINT, 0.45);
      ctx.lineWidth = 1.4 * scale;
      for (let i = 0; i < isles.length; i += 3) {
        const syy = isles[i + 2];
        ctx.beginPath();
        ctx.moveTo(sx(isles[i]), sy(syy));
        ctx.lineTo(sx(isles[i]), sy(syy + step));
        ctx.moveTo(sx(isles[i + 1]), sy(syy));
        ctx.lineTo(sx(isles[i + 1]), sy(syy + step));
        ctx.stroke();
      }
    }

    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.4 * scale;
    ctx.strokeStyle = rgba(MINT, 0.72);
    ctx.shadowColor = rgba(MINT, 0.45);
    ctx.shadowBlur = 8 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(ptsL[0]), sy(ptsL[1]));
    for (let i = 2; i < ptsL.length; i += 2) ctx.lineTo(sx(ptsL[i]), sy(ptsL[i + 1]));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx(ptsR[0]), sy(ptsR[1]));
    for (let i = 2; i < ptsR.length; i += 2) ctx.lineTo(sx(ptsR[i]), sy(ptsR[i + 1]));
    ctx.stroke();
    ctx.restore();

    const y0 = screenToWorldY(-12);
    const y1 = screenToWorldY(FIELD + 12);
    const stepY = 22;
    const i0 = Math.floor(y0 / stepY);
    const i1 = Math.ceil(y1 / stepY);
    for (let k = i0; k <= i1; k++) {
      const wy = k * stepY;
      const r = riverAt(wy);
      const syy = worldToScreenY(wy);
      const hL = hash2(k * 3 + 2);
      const hR = hash2(k * 5 + 9);
      drawBush(r.L * (0.22 + hL * 0.55), syy, 5 + hL * 7, hL);
      drawBush(r.R + (VW - r.R) * (0.2 + hR * 0.55), syy, 5 + hR * 7, hR);
      if (hL > 0.72) drawHut(r.L * 0.45, syy, 1);
      if (hR > 0.78) drawHut(r.R + (VW - r.R) * 0.5, syy, -1);
    }
  }

  function drawBush(x, syy, r, h) {
    if (syy < -16 || syy > FIELD + 16) return;
    ctx.fillStyle = rgba(LEAF, 0.55 + h * 0.3);
    ctx.beginPath();
    ctx.ellipse(sx(x), sy(syy), r * scale, r * 0.7 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MINT, 0.28);
    ctx.beginPath();
    ctx.ellipse(sx(x - r * 0.2), sy(syy - r * 0.15), r * 0.4 * scale, r * 0.28 * scale, 0, 0, TAU);
    ctx.fill();
  }

  function drawHut(x, syy, dir) {
    if (syy < -12 || syy > FIELD + 12) return;
    ctx.fillStyle = rgba(ORG, 0.55);
    ctx.fillRect(sx(x - 6), sy(syy - 4), 12 * scale, 7 * scale);
    ctx.fillStyle = rgba(MAG, 0.7);
    ctx.beginPath();
    ctx.moveTo(sx(x - 7), sy(syy - 4));
    ctx.lineTo(sx(x), sy(syy - 10));
    ctx.lineTo(sx(x + 7), sy(syy - 4));
    ctx.fill();
    void dir;
  }

  function drawWakes() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < wakes.length; i++) {
      const w = wakes[i];
      const a = 1 - w.t / 0.35;
      const syy = worldToScreenY(w.y);
      ctx.strokeStyle = rgba(CYN, 0.22 * a);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.ellipse(sx(w.x), sy(syy), (w.w + w.t * 22) * scale, (3 + w.t * 6) * scale, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnt(e) {
    const syy = worldToScreenY(e.y);
    if (syy < -40 || syy > FIELD + 40) return;
    if (e.type === 'bridge') {
      drawBridge(e, syy);
      return;
    }
    if (!e.alive) return;
    if (e.type === 'boat') drawBoat(e.x, syy, e.vx);
    else if (e.type === 'heli') drawHeli(e.x, syy);
    else if (e.type === 'jet') drawJet(e.x, syy, e.vx);
    else if (e.type === 'fuel') drawFuel(e.x, syy);
  }

  function drawBridge(e, syy) {
    if (e.alive) {
      ctx.fillStyle = rgba(MAG, 0.92);
      ctx.fillRect(sx(12), sy(syy - 12), (VW - 24) * scale, 24 * scale);
      ctx.fillStyle = rgba(GOLD, 0.85);
      ctx.fillRect(sx(18), sy(syy - 4), (VW - 36) * scale, 8 * scale);
      ctx.fillStyle = rgba(WHT, 0.35);
      for (let x = 28; x < VW - 28; x += 18) {
        ctx.fillRect(sx(x), sy(syy - 2), 8 * scale, 2.2 * scale);
      }
      ctx.fillStyle = rgba(MINT, 0.55);
      ctx.fillRect(sx(10), sy(syy - 14), 10 * scale, 28 * scale);
      ctx.fillRect(sx(VW - 20), sy(syy - 14), 10 * scale, 28 * scale);
      ctx.strokeStyle = rgba(GOLD, 0.5);
      ctx.lineWidth = 1.4 * scale;
      ctx.strokeRect(sx(12), sy(syy - 12), (VW - 24) * scale, 24 * scale);
    }
    if (e.bits) {
      for (let i = 0; i < e.bits.length; i++) {
        const b = e.bits[i];
        const by = worldToScreenY(b.y);
        ctx.save();
        ctx.translate(sx(b.x), sy(by));
        ctx.rotate(b.rot);
        ctx.fillStyle = rgba(MAG, clamp(e.collapse / 0.4, 0, 1) * 0.9);
        ctx.fillRect(-b.w * 0.5 * scale, -b.h * 0.5 * scale, b.w * scale, b.h * scale);
        ctx.fillStyle = rgba(GOLD, 0.45);
        ctx.fillRect(-b.w * 0.4 * scale, -2 * scale, b.w * 0.8 * scale, 3 * scale);
        ctx.restore();
      }
    }
  }

  function drawBoat(x, syy, vx) {
    ctx.save();
    ctx.translate(sx(x), sy(syy));
    ctx.fillStyle = rgba(MAG, 0.95);
    ctx.beginPath();
    ctx.moveTo(-16 * scale, 0);
    ctx.lineTo(-10 * scale, -7 * scale);
    ctx.lineTo(10 * scale, -7 * scale);
    ctx.lineTo(16 * scale, 0);
    ctx.lineTo(10 * scale, 7 * scale);
    ctx.lineTo(-10 * scale, 7 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.8);
    ctx.fillRect(-6 * scale, -4 * scale, 12 * scale, 8 * scale);
    ctx.fillStyle = rgba(CYN, 0.7);
    ctx.fillRect(-3 * scale, -2.4 * scale, 6 * scale, 5 * scale);
    ctx.fillStyle = rgba(CYN, 0.25);
    ctx.fillRect((vx >= 0 ? -22 : 10) * scale, -2 * scale, 12 * scale, 4 * scale);
    ctx.restore();
  }

  function drawHeli(x, syy) {
    ctx.save();
    ctx.translate(sx(x), sy(syy));
    const spin = Math.cos(G.rotor * 18);
    ctx.strokeStyle = rgba(GOLD, 0.9);
    ctx.lineWidth = 1.6 * scale;
    ctx.beginPath();
    ctx.moveTo(-16 * scale * spin, -8 * scale);
    ctx.lineTo(16 * scale * spin, -8 * scale);
    ctx.stroke();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.beginPath();
    ctx.ellipse(0, 0, 11 * scale, 6.5 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.75);
    ctx.beginPath();
    ctx.ellipse(2 * scale, -1 * scale, 5 * scale, 3.2 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(MAG, 0.8);
    ctx.fillRect(8 * scale, -1.4 * scale, 10 * scale, 2.8 * scale);
    ctx.restore();
  }

  function drawJet(x, syy, vx) {
    ctx.save();
    ctx.translate(sx(x), sy(syy));
    const dir = vx >= 0 ? 1 : -1;
    ctx.fillStyle = rgba(PNK, 0.95);
    ctx.beginPath();
    ctx.moveTo(14 * scale * dir, 0);
    ctx.lineTo(-10 * scale * dir, -6 * scale);
    ctx.lineTo(-6 * scale * dir, 0);
    ctx.lineTo(-10 * scale * dir, 6 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.beginPath();
    ctx.moveTo(4 * scale * dir, 0);
    ctx.lineTo(-4 * scale * dir, -3 * scale);
    ctx.lineTo(-4 * scale * dir, 3 * scale);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.45);
    ctx.fillRect(-16 * scale * dir, -1.4 * scale, 8 * scale, 2.8 * scale);
    ctx.restore();
  }

  function drawFuel(x, syy) {
    const pulse = 0.75 + 0.25 * Math.sin(G.t * 8);
    ctx.save();
    ctx.translate(sx(x), sy(syy));
    ctx.fillStyle = rgba(GOLD, 0.22 * pulse);
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 * scale, 16 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(GOLD, 0.95);
    ctx.fillRect(-10 * scale, -12 * scale, 20 * scale, 24 * scale);
    ctx.fillStyle = '#1a1204';
    ctx.fillRect(-7 * scale, -8 * scale, 14 * scale, 16 * scale);
    ctx.fillStyle = rgba(GOLD, pulse);
    ctx.fillRect(-7 * scale, 0, 14 * scale, 8 * scale);
    ctx.fillStyle = rgba(WHT, 0.7);
    ctx.fillRect(-3 * scale, -14 * scale, 6 * scale, 3 * scale);
    ctx.restore();
  }

  function drawShots() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.shots.length; i++) {
      const s = G.shots[i];
      const syy = worldToScreenY(s.y);
      if (s.trail) {
        for (let t = 0; t < s.trail.length; t++) {
          const p = s.trail[t];
          const py = worldToScreenY(p.y);
          ctx.fillStyle = rgba(CYN, 0.1 + t * 0.08);
          ctx.fillRect(sx(p.x - 1.2), sy(py), 2.4 * scale, 8 * scale);
        }
      }
      ctx.fillStyle = rgba(WHT, 0.95);
      ctx.fillRect(sx(s.x - 1.6), sy(syy - 10), 3.2 * scale, 16 * scale);
      ctx.fillStyle = rgba(CYN, 0.9);
      ctx.fillRect(sx(s.x - 2.4), sy(syy - 7), 4.8 * scale, 9 * scale);
    }
    ctx.restore();
  }

  function drawPlane() {
    if (G.mode === 'lose') return;
    if (G.deadT > 0) return;
    if (G.mode === 'play' && G.invuln > 0 && ((G.t * 16) | 0) % 2 === 0) return;
    const x = G.ship.x;
    const syy = PLAYER_SY;
    ctx.save();
    ctx.translate(sx(x), sy(syy));
    const boost = (G.spd - minSpd()) / Math.max(1, maxSpd() - minSpd());
    ctx.fillStyle = rgba(CYN, 0.35 + boost * 0.35);
    ctx.beginPath();
    ctx.moveTo(-3 * scale, 11 * scale);
    ctx.lineTo(3 * scale, 11 * scale);
    ctx.lineTo(1.4 * scale, (16 + boost * 10) * scale);
    ctx.lineTo(-1.4 * scale, (16 + boost * 10) * scale);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.28);
    ctx.beginPath();
    ctx.ellipse(0, 4 * scale, 14 * scale, 8 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(CYN, 0.96);
    ctx.beginPath();
    ctx.moveTo(0, -13 * scale);
    ctx.lineTo(8 * scale, 6 * scale);
    ctx.lineTo(3.2 * scale, 4 * scale);
    ctx.lineTo(3.4 * scale, 11 * scale);
    ctx.lineTo(-3.4 * scale, 11 * scale);
    ctx.lineTo(-3.2 * scale, 4 * scale);
    ctx.lineTo(-8 * scale, 6 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = rgba(WHT, 0.92);
    ctx.beginPath();
    ctx.moveTo(0, -9 * scale);
    ctx.lineTo(3.2 * scale, 2 * scale);
    ctx.lineTo(-3.2 * scale, 2 * scale);
    ctx.closePath();
    ctx.fill();
    if (G.muzzle > 0) {
      const a = G.muzzle / 0.07;
      ctx.fillStyle = rgba(WHT, a);
      ctx.beginPath();
      ctx.arc(0, -16 * scale, 6 * scale * a, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(GOLD, a * 0.8);
      ctx.fillRect(-1.4 * scale, -26 * scale, 2.8 * scale, 12 * scale);
    }
    if (G.siphon > 0) {
      ctx.strokeStyle = rgba(GOLD, 0.55);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(0, 0, 16 * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFx() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      const syy = worldToScreenY(p.y);
      ctx.fillStyle = rgba(p.rgb, a);
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(syy), p.r * scale, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      const a = 1 - s.t / 0.28;
      const syy = worldToScreenY(s.y);
      ctx.strokeStyle = rgba(s.rgb, a);
      ctx.lineWidth = 1.6 * scale;
      const rad = s.rad * (0.4 + s.t * 3);
      for (let k = 0; k < 6; k++) {
        const ang = k * TAU / 6 + s.t * 4;
        ctx.beginPath();
        ctx.moveTo(sx(s.x), sy(syy));
        ctx.lineTo(sx(s.x + Math.cos(ang) * rad), sy(syy - Math.sin(ang) * rad * 0.4));
        ctx.stroke();
      }
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      const a = 1 - r.t / 0.38;
      const syy = worldToScreenY(r.y);
      ctx.strokeStyle = rgba(r.rgb, a * 0.7);
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(sx(r.x), sy(syy), (r.r + r.t * 70) * scale, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();

    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      const a = 1 - f.t / f.life;
      const syy = worldToScreenY(f.y);
      ctx.font = '700 ' + (f.size * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = rgba(f.rgb, a);
      ctx.fillText(f.text, sx(f.x), sy(syy));
    }
  }

  function drawHudStrip() {
    ctx.fillStyle = '#050c08';
    ctx.fillRect(sx(0), sy(FIELD), VW * scale, (VH - FIELD) * scale);
    ctx.fillStyle = rgba(MINT, 0.22);
    ctx.fillRect(sx(0), sy(FIELD), VW * scale, 1.4 * scale);

    const t = clamp(G.fuel / 100, 0, 1);
    const gx = 70;
    const gy = FIELD + 18;
    const gw = VW - 140;
    const gh = 16;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(sx(gx), sy(gy), gw * scale, gh * scale);
    const rgb = t < 0.22 ? MAG : G.siphon > 0 ? GOLD : MINT;
    ctx.fillStyle = rgba(rgb, 0.9);
    ctx.fillRect(sx(gx), sy(gy), gw * t * scale, gh * scale);
    ctx.strokeStyle = rgba(rgb, 0.55);
    ctx.lineWidth = 1.4 * scale;
    ctx.strokeRect(sx(gx), sy(gy), gw * scale, gh * scale);

    ctx.font = '700 ' + (11 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = rgba(t < 0.22 ? MAG : GOLD, 0.9);
    ctx.fillText('E', sx(gx - 16), sy(gy + 13));
    ctx.textAlign = 'right';
    ctx.fillStyle = rgba(MINT, 0.9);
    ctx.fillText('F', sx(gx + gw + 16), sy(gy + 13));

    ctx.textAlign = 'center';
    ctx.fillStyle = rgba(WHT, 0.55);
    ctx.font = '600 ' + (10 * scale) + 'px "Segoe UI", "PingFang SC", sans-serif';
    ctx.fillText('FUEL', sx(VW * 0.5), sy(FIELD + 44));

    const spdT = (G.spd - minSpd()) / Math.max(1, maxSpd() - minSpd());
    ctx.fillStyle = rgba(CYN, 0.2);
    ctx.fillRect(sx(VW - 18), sy(FIELD + 8), 6 * scale, 36 * scale);
    ctx.fillStyle = rgba(CYN, 0.85);
    ctx.fillRect(sx(VW - 18), sy(FIELD + 8 + 36 * (1 - spdT)), 6 * scale, 36 * spdT * scale);
  }

  function drawSpeedLines() {
    const t = (G.spd - minSpd()) / Math.max(1, maxSpd() - minSpd());
    if (t < 0.55 || REDUCE) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const n = 8 + (t * 8) | 0;
    for (let i = 0; i < n; i++) {
      const seed = hash2(i * 19 + ((G.alt / 40) | 0));
      const x = 20 + seed * (VW - 40);
      const y = ((seed * 800 + G.t * (180 + t * 420)) % FIELD);
      ctx.strokeStyle = rgba(CYN, 0.08 + t * 0.12);
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(sx(x), sy(y));
      ctx.lineTo(sx(x), sy(y + 10 + t * 18));
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#020805';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      ctx.translate((Math.random() - 0.5) * G.shake * 1.4, (Math.random() - 0.5) * G.shake * 1.2);
    }
    if (G.punch !== 1 && !REDUCE) {
      const cx = sx(VW * 0.5);
      const cy = sy(PLAYER_SY);
      ctx.translate(cx, cy);
      ctx.scale(G.punch, G.punch);
      ctx.translate(-cx, -cy);
    }

    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();

    drawBg();
    drawRiver();
    drawWakes();
    drawSpeedLines();
    for (let i = 0; i < G.ents.length; i++) drawEnt(G.ents[i]);
    drawShots();
    drawPlane();
    drawFx();
    ctx.restore();

    ctx.save();
    if (G.shake > 0 && !REDUCE) {
      ctx.translate((Math.random() - 0.5) * G.shake * 0.4, 0);
    }
    ctx.beginPath();
    ctx.rect(sx(0), sy(0), VW * scale, VH * scale);
    ctx.clip();
    drawHudStrip();
    ctx.restore();

    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.45);
      ctx.fillRect(sx(0), sy(0), VW * scale, FIELD * scale);
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
    if (G.mode === 'title') startGame('classic');
    else startGame(G.kind || 'classic');
  }

  function primaryAction() {
    audio.ensure();
    if (G.mode === 'title') startGame('classic');
    else if (G.mode === 'lose') startGame(G.kind);
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
    if (down && (k === 'ArrowLeft' || k === 'ArrowRight' || k === 'ArrowUp' || k === 'ArrowDown' || space || k === 'Enter')) {
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
    }
  }

  function bindPointer() {
    if (!canvas) return;
    canvas.addEventListener('pointerdown', function (e) {
      audio.ensure();
      e.preventDefault();
      pointer.down = true;
      pointer.hover = true;
      pointer.id = e.pointerId;
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = pointerWorldY(e);
      inputSrc = 'ptr';
      G.fireHold = true;
      if (G.mode === 'play') fire();
      if (canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener('pointermove', function (e) {
      pointer.x = clamp(pointerWorldX(e), 10, VW - 10);
      pointer.y = pointerWorldY(e);
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

  loadBest();
  initMute();
  goTitle();
  resize();
  bindPointer();

  if (btnClassic) {
    btnClassic.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') startGame(G.kind);
      else startGame('classic');
    });
  }
  if (btnRapids) {
    btnRapids.addEventListener('click', function () {
      audio.ensure();
      if (G.mode === 'lose') goTitle();
      else startGame('rapids');
    });
  }
  if (btnRetry) btnRetry.addEventListener('click', restart);
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
    }
  });

  requestAnimationFrame(frame);
})();
