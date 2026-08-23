'use strict';


(function () {
  const VW = 960;
  const VH = 540;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const UNIT_R = 14;
  const WALK_PX = 96;
  const CHARGE_T = 0.8;
  const TAP_POW = 12;
  const TURN_T = 20;
  const GRAV = 260;
  const VK = 420;
  const LOFT_W = 20;
  const LOFT_B = 0.55;
  const WIND_K = 2.05;
  const BEST_KEY = 'playbox-tan-tang-best';
  const MUTE_KEY = 'playbox-tan-tang-mute';
  const OPS = '← → 走 · ↑ ↓ 角 · 空格/Z 蓄力 · 1/2/3 武器 · R 重开 · M 静音';
  const MAP_NAME = { plain: '平原', canyon: '峡谷', twin: '双台' };
  const MAP_IDS = ['plain', 'canyon', 'twin'];

  const CYN = [0, 232, 255];
  const MAG = [255, 61, 184];
  const GOLD = [255, 227, 107];
  const HOT = [139, 92, 255];
  const WHT = [244, 238, 255];
  const DIRT = [92, 68, 48];

  const WEPS = [
    { id: 0, name: '普通弹', direct: 32, splash: 36, crater: 30, spd: 1.00 },
    { id: 1, name: '高爆', direct: 24, splash: 56, crater: 48, spd: 0.88 },
    { id: 2, name: '穿透', direct: 30, splash: 32, crater: 26, spd: 1.06 }
  ];

  const hasDom = typeof document !== 'undefined';
  const REDUCE = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  function el(id) { return hasDom ? document.getElementById(id) : null; }
  function clamp(n, a, b) { return n < a ? a : n > b ? b : n; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function irand(a, b) { return (a + Math.random() * (b - a + 1)) | 0; }
  function hypot(ax, ay) { return Math.sqrt(ax * ax + ay * ay); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function rgba(rgb, a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')'; }
  function elev(ang) { return ang <= 90 ? ang : 180 - ang; }

  function muzzleSpeed(power, ang, wep) {
    const e = elev(ang);
    const loft = 1 + LOFT_B * Math.exp(-((e - 65) * (e - 65)) / (2 * LOFT_W * LOFT_W));
    return VK * (clamp(power, 1, 100) / 100) * (wep && wep.spd ? wep.spd : 1) * loft;
  }

  const canvas = el('c');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const overlay = el('overlay');
  const panel = el('panel');
  const ovKicker = el('ov-kicker');
  const ovTitle = el('ov-title');
  const ovLead = el('ov-lead');
  const ovOps = el('ov-ops');
  const ovStart = el('ov-start');
  const ovEnd = el('ov-end');
  const ovMaps = el('ov-maps');
  const btnHall = el('btn-hall');
  const btnCore = el('btn-core');
  const ovRetry = el('ov-retry');
  const ovModes = el('ov-modes');
  const btnMute = el('btn-mute');
  const btnRetry = el('btn-retry');
  const scoreEl = el('score');
  const bestEl = el('best');
  const scoreBox = el('score-box');
  const scoreAdd = el('score-add');
  const stageLabel = el('stage-label');
  const mapLabel = el('map-label');
  const windLabel = el('wind-label');
  const angLabel = el('ang-label');
  const powLabel = el('pow-label');
  const walkLabel = el('walk-label');
  const comboEl = el('combo-label');
  const hpPN = el('hp-p-n');
  const hpFN = el('hp-f-n');
  const hpP = el('hp-p');
  const hpF = el('hp-f');
  const toastEl = el('toast');
  const hintEl = el('hint');
  const stageEl = el('stage');
  const wepsEl = el('weps');
  const padEl = el('pad');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false, u: false, d: false, fire: false };
  const padHold = { l: false, r: false, u: false, d: false, fire: false };
  const cam = { x: VW * 0.5, y: VH * 0.5, z: 1, tx: VW * 0.5, ty: VH * 0.5, tz: 1 };

  const G = {
    mode: 'title',
    kind: 'hall',
    mapId: 'plain',
    t: 0,
    clock: 0,
    phase: 'aim',
    turn: 'p',
    wind: 0,
    power: TAP_POW,
    wep: 0,
    walk: WALK_PX,
    timeout: TURN_T,
    turns: 0,
    combo: 0,
    stop: 0,
    shake: 0,
    flash: 0,
    flashRgb: CYN,
    punch: 1,
    toastT: 0,
    settleT: 0,
    winStreak: 0,
    bestTurns: 0,
    H: null,
    p: null,
    f: null,
    shot: null,
    charging: false
  };

  const particles = [];
  const floats = [];
  const rings = [];
  const stars = [];
  const trail = [];

  let hidden = false;
  let addTok = 0;
  let toastTok = 0;
  let kickTok = 0;
  let terrainDirty = true;
  let terrainCv = null;
  let terrainCx = null;
  let coverImg = null;
  let heroImg = null;
  let foeImg = null;
  let heroFrames = [];
  let foeSpr = null;
  let artReady = false;
  let chargeOsc = null;
  let chargeGain = null;

  function dmgMul() { return G.kind === 'core' ? 1.15 : 1; }
  function maxHp() { return G.kind === 'core' ? 60 : 100; }
  function windMax() { return G.kind === 'core' ? 14 : 8; }
  function overlayOpen() { return !!(overlay && !overlay.classList.contains('hidden')); }
  function curUnit() { return G.turn === 'p' ? G.p : G.f; }
  function otherUnit(u) { return u === G.p ? G.f : G.p; }
  function wepOf() { return WEPS[G.wep] || WEPS[0]; }

  function groundAt(x) {
    const H = G.H;
    if (!H) return VH - 8;
    const i = clamp(x, 0, VW - 1.001);
    const a = i | 0;
    const b = a + 1 < VW ? a + 1 : a;
    const t = i - a;
    return H[a] * (1 - t) + H[b] * t;
  }

  function padFlat(h, x0, x1, y) {
    const a = Math.max(0, x0 | 0);
    const b = Math.min(VW - 1, x1 | 0);
    for (let x = a; x <= b; x++) {
      const k = (x - a) / Math.max(1, b - a);
      const e = Math.sin(k * Math.PI);
      h[x] += (y - h[x]) * Math.min(1, e * 1.35);
    }
  }

  function buildHeight(id) {
    const h = new Float32Array(VW);
    if (id === 'canyon') {
      for (let x = 0; x < VW; x++) {
        const t = x / (VW - 1);
        const v = Math.pow(Math.sin(t * Math.PI), 1.32);
        h[x] = 294 + v * 206 + Math.sin(t * 16.2) * 7 + Math.sin(t * 39) * 3;
      }
      padFlat(h, 64, 196, 306);
      padFlat(h, 764, 906, 306);
    } else if (id === 'twin') {
      for (let x = 0; x < VW; x++) {
        const t = x / (VW - 1);
        const sm = function (a, b, u) {
          const k = clamp((u - a) / (b - a), 0, 1);
          return k * k * (3 - 2 * k);
        };
        const left = sm(0.02, 0.16, t) * (1 - sm(0.30, 0.40, t));
        const right = sm(0.60, 0.70, t) * (1 - sm(0.84, 0.98, t));
        h[x] = 508 - Math.max(left, right) * 198 + Math.sin(t * 13) * 5;
      }
    } else {
      for (let x = 0; x < VW; x++) {
        const t = x / (VW - 1);
        h[x] = 394 + Math.sin(t * Math.PI * 2.05) * 18 + Math.sin(t * Math.PI * 5.3) * 8 + Math.sin(t * Math.PI * 11.2) * 3.5;
      }
    }
    for (let x = 0; x < VW; x++) h[x] = clamp(h[x], 88, VH - 8);
    return h;
  }

  function spawnX(id, side) {
    if (id === 'canyon') return side === 'p' ? 122 : 838;
    if (id === 'twin') return side === 'p' ? 148 : 812;
    return side === 'p' ? 152 : 768;
  }

  function makeUnit(side) {
    const x = spawnX(G.mapId, side);
    const u = {
      side: side,
      name: side === 'p' ? '岚丸' : '烬丸',
      x: x,
      y: 0,
      r: UNIT_R,
      hp: maxHp(),
      max: maxHp(),
      ang: side === 'p' ? 65 : 115,
      vy: 0,
      grounded: true,
      fall: 0,
      bob: rand(0, TAU),
      hitT: 0,
      walkT: 0,
      face: side === 'p' ? 1 : -1,
      flash: 0
    };
    u.y = groundAt(u.x) - u.r;
    return u;
  }

  function rollWind() {
    const m = windMax();
    let w;
    if (G.kind === 'core' && Math.random() < 0.55) {
      w = (Math.random() < 0.5 ? -1 : 1) * irand(8, m);
    } else {
      w = irand(-m, m);
    }
    if (w === 0 && Math.random() < 0.35) w = Math.random() < 0.5 ? -1 : 1;
    G.wind = w;
  }

  function carve(cx, cy, r) {
    if (!G.H || r <= 0) return;
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(VW - 1, Math.ceil(cx + r));
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const inn = r * r - dx * dx;
      if (inn <= 0) continue;
      const bot = cy + Math.sqrt(inn);
      if (G.H[x] < bot) G.H[x] = Math.min(VH - 6, bot);
    }
    terrainDirty = true;
  }

  function inGround(x, y) {
    if (x < 0 || x >= VW) return true;
    return y >= groundAt(x);
  }

  function unitAt(x, y, skip) {
    const list = [G.p, G.f];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      if (!u || u === skip || u.hp <= 0) continue;
      if (hypot(x - u.x, y - u.y) <= u.r + 5) return u;
    }
    return null;
  }

  function traceShot(x0, y0, ang, power, wind, wep, Hsave, skip) {
    const old = G.H;
    if (Hsave) G.H = Hsave;
    const th = ang * Math.PI / 180;
    const spd = muzzleSpeed(power, ang, wep);
    let vx = Math.cos(th) * spd;
    let vy = -Math.sin(th) * spd;
    let x = x0;
    let y = y0;
    let pierced = false;
    let fuse = 0;
    const dt = 1 / 60;
    const acc = wind * WIND_K;
    let hitU = null;
    let t = 0;
    for (let i = 0; i < 420; i++) {
      vx += acc * dt;
      vy += GRAV * dt;
      x += vx * dt;
      y += vy * dt;
      t += dt;
      if (x < 4 || x > VW - 4 || y > VH + 30) {
        if (Hsave) G.H = old;
        return { x: clamp(x, 0, VW - 1), y: Math.min(y, VH), t: t, hit: null, air: y < VH };
      }
      const u = unitAt(x, y, skip);
      if (u) {
        if (Hsave) G.H = old;
        return { x: x, y: y, t: t, hit: u, air: false };
      }
      if (inGround(x, y)) {
        if (wep && wep.id === 2 && !pierced) {
          pierced = true;
          fuse = 0.18;
          const s = hypot(vx, vy) || 1;
          const ux = vx / s;
          const uy = vy / s;
          x += ux * 46;
          y += uy * 46;
          let g = 0;
          while (inGround(x, y) && g < 18) {
            x += ux * 3;
            y += uy * 3;
            g += 1;
          }
          continue;
        }
        if (Hsave) G.H = old;
        return { x: x, y: y, t: t, hit: null, air: false, pierced: pierced };
      }
      if (pierced) {
        fuse -= dt;
        if (fuse <= 0) {
          if (Hsave) G.H = old;
          return { x: x, y: y, t: t, hit: null, air: true, pierced: true };
        }
      }
    }
    if (Hsave) G.H = old;
    return { x: x, y: y, t: t, hit: hitU, air: true };
  }

  const audio = {
    ctx: null,
    master: null,
    muted: false,
    ensure() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          try { this.ctx.resume(); } catch (err) { /* */ }
        }
        return;
      }
      if (typeof window === 'undefined') return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.42;
        this.master.connect(this.ctx.destination);
      } catch (err) {
        this.ctx = null;
      }
    },
    setMuted(m) {
      this.muted = !!m;
      if (this.master) this.master.gain.value = this.muted ? 0 : 0.42;
      if (btnMute) {
        btnMute.textContent = m ? '静' : '声';
        btnMute.classList.toggle('muted', m);
        btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      }
      try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch (err) { /* */ }
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
      f.frequency.value = hp || 400;
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
    chargeStart() {
      this.ensure();
      this.chargeStop();
      if (!this.ctx || this.muted) return;
      try {
        chargeOsc = this.ctx.createOscillator();
        chargeGain = this.ctx.createGain();
        chargeOsc.type = 'sawtooth';
        chargeOsc.frequency.value = 180;
        chargeGain.gain.value = 0.028;
        chargeOsc.connect(chargeGain);
        chargeGain.connect(this.master);
        chargeOsc.start();
      } catch (err) { chargeOsc = null; }
    },
    chargeTick(p) {
      if (!chargeOsc || !this.ctx) return;
      try { chargeOsc.frequency.setValueAtTime(180 + p * 7.2, this.ctx.currentTime); } catch (err) { /* */ }
    },
    chargeStop() {
      if (chargeOsc) {
        try { chargeOsc.stop(); } catch (err) { /* */ }
        try { chargeOsc.disconnect(); } catch (err) { /* */ }
      }
      chargeOsc = null;
      chargeGain = null;
    },
    fire(wep) {
      this.ensure();
      this.chargeStop();
      this.beep(220, 0.08, 'sawtooth', 0.04, 720);
      this.beep(wep && wep.id === 1 ? 140 : 280, 0.1, 'square', 0.03, 90);
      if (wep && wep.id === 2) this.beep(880, 0.08, 'triangle', 0.028, 1400);
    },
    boom(hit, wep) {
      this.ensure();
      this.noise(hit ? 0.2 : 0.14, hit ? 0.08 : 0.05, hit ? 180 : 280);
      this.beep(hit ? 160 : 110, 0.22, 'sine', hit ? 0.07 : 0.04, 40);
      if (wep && wep.id === 1) this.beep(70, 0.28, 'triangle', 0.05, 32);
    },
    hit() {
      this.ensure();
      this.beep(540, 0.07, 'square', 0.05, 220);
      this.beep(880, 0.1, 'triangle', 0.036, 1320);
    },
    dirt() {
      this.ensure();
      this.noise(0.1, 0.04, 320);
    },
    fall() {
      this.ensure();
      this.beep(90, 0.16, 'sine', 0.045, 40);
      this.noise(0.12, 0.05, 140);
    },
    combo(n) {
      this.ensure();
      this.beep(392 + n * 40, 0.08, 'sine', 0.04, 784);
      this.beep(660, 0.12, 'triangle', 0.032, 1046);
    },
    start() {
      this.ensure();
      this.beep(330, 0.08, 'square', 0.04, 660);
      this.beep(660, 0.12, 'triangle', 0.034, 990);
    },
    win() {
      this.ensure();
      this.beep(523, 0.1, 'sine', 0.045, 659);
      this.beep(784, 0.14, 'triangle', 0.05, 1046);
      this.beep(1046, 0.22, 'sine', 0.04, 1318);
    },
    lose() {
      this.ensure();
      this.beep(196, 0.22, 'sawtooth', 0.05, 80);
      this.beep(110, 0.4, 'sine', 0.055, 40);
    },
    tick() {
      this.ensure();
      this.beep(880, 0.035, 'square', 0.02);
    }
  };


  function toast(msg, warn, gold) {
    G.toastT = 1.4;
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

  function windText() {
    if (G.wind > 0) return '→ ' + G.wind;
    if (G.wind < 0) return '← ' + (-G.wind);
    return '· 0';
  }

  function showOverlay(kind, title, lead) {
    if (!overlay) return;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    if (panel) {
      panel.classList.toggle('win', kind === 'win');
      panel.classList.toggle('lose', kind === 'lose' || kind === 'draw');
    }
    if (ovKicker) {
      ovKicker.textContent = kind === 'lose' ? 'DOWN' : kind === 'win' ? 'CLEAR' : kind === 'draw' ? 'DRAW' : 'TAN HALL';
    }
    if (ovTitle) ovTitle.textContent = title;
    if (ovLead) ovLead.textContent = lead;
    if (ovOps) ovOps.textContent = OPS;
    if (kind === 'title') {
      if (ovStart) ovStart.classList.remove('gone');
      if (ovEnd) ovEnd.classList.add('gone');
      if (ovMaps) ovMaps.style.display = '';
    } else {
      if (ovStart) ovStart.classList.add('gone');
      if (ovEnd) ovEnd.classList.remove('gone');
      if (ovMaps) ovMaps.style.display = 'none';
    }
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    if (canvas && canvas.focus) canvas.focus();
  }

  function loadBest() {
    G.winStreak = 0;
    G.bestTurns = 0;
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      G.winStreak = Math.max(0, parseInt(o.winStreak, 10) || 0);
      G.bestTurns = Math.max(0, parseInt(o.bestTurns, 10) || 0);
      if (o.mode === 'core' || o.mode === 'hall') G.kind = o.mode;
      if (o.map === 'plain' || o.map === 'canyon' || o.map === 'twin') G.mapId = o.map;
    } catch (err) { /* */ }
  }

  function saveBest() {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({
        winStreak: G.winStreak,
        bestTurns: G.bestTurns,
        mode: G.kind,
        map: G.mapId
      }));
    } catch (err) { /* */ }
  }

  function popStreak(n) {
    if (!scoreBox || !scoreAdd) return;
    scoreBox.classList.remove('flash');
    void scoreBox.offsetWidth;
    scoreBox.classList.add('flash');
    addTok += 1;
    const tok = addTok;
    scoreAdd.hidden = false;
    scoreAdd.textContent = n > 0 ? '+' + n : String(n);
    scoreAdd.style.animation = 'none';
    void scoreAdd.offsetWidth;
    scoreAdd.style.animation = '';
    setTimeout(function () { if (tok === addTok) scoreAdd.hidden = true; }, 700);
  }

  function syncMaps() {
    if (!ovMaps) return;
    const btns = ovMaps.querySelectorAll('button');
    for (let i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('on', btns[i].getAttribute('data-map') === G.mapId);
    }
  }

  function syncWeps() {
    if (!wepsEl) return;
    const btns = wepsEl.querySelectorAll('button');
    for (let i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('on', (btns[i].getAttribute('data-w') | 0) === G.wep);
    }
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = String(G.winStreak);
    if (bestEl) bestEl.textContent = G.bestTurns > 0 ? String(G.bestTurns) + '回' : '—';
    if (stageLabel) {
      stageLabel.textContent = G.kind === 'core' ? '堂核' : '弹堂';
      stageLabel.classList.toggle('hot', G.kind === 'core');
    }
    if (mapLabel) mapLabel.textContent = MAP_NAME[G.mapId] || '平原';
    if (windLabel) windLabel.textContent = '风 ' + windText();
    const u = curUnit() || G.p;
    if (angLabel) angLabel.textContent = '角 ' + Math.round((u && u.ang) || 65) + '°';
    if (powLabel) powLabel.textContent = '力 ' + Math.round(G.power);
    if (walkLabel) walkLabel.textContent = '步 ' + Math.max(0, Math.round(G.walk));
    if (comboEl) {
      if (G.combo >= 2 && G.mode === 'play') {
        comboEl.hidden = false;
        comboEl.textContent = '连堂 ×' + G.combo;
      } else comboEl.hidden = true;
    }
    if (G.p) {
      if (hpPN) hpPN.textContent = String(Math.max(0, Math.ceil(G.p.hp)));
      if (hpP) hpP.style.transform = 'scaleX(' + clamp(G.p.hp / G.p.max, 0, 1) + ')';
    }
    if (G.f) {
      if (hpFN) hpFN.textContent = String(Math.max(0, Math.ceil(G.f.hp)));
      if (hpF) hpF.style.transform = 'scaleX(' + clamp(G.f.hp / G.f.max, 0, 1) + ')';
    }
    syncWeps();
  }

  function hitStop(sec) {
    if (REDUCE || G.mode !== 'play') return;
    G.stop = Math.max(G.stop, sec);
  }

  function kick(mag) {
    if (REDUCE) return;
    G.shake = Math.max(G.shake, mag);
    G.punch = Math.max(G.punch, 1 + Math.min(0.05, mag * 0.006));
    if (!stageEl || G.mode !== 'play') return;
    kickTok += 1;
    const cls = mag >= 5.5 ? 'die' : 'hit';
    stageEl.classList.remove('die');
    stageEl.classList.remove('hit');
    void stageEl.offsetWidth;
    stageEl.classList.add(cls);
  }

  function screenFlash(rgb, a) {
    G.flash = Math.max(G.flash, a || 0.4);
    G.flashRgb = rgb;
  }

  function burst(x, y, rgb, n, spd, life) {
    const N = REDUCE ? Math.min(8, n) : n;
    for (let i = 0; i < N; i++) {
      const a = rand(0, TAU);
      const s = rand(spd * 0.3, spd);
      particles.push({
        x: x, y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - rand(20, 80),
        g: 420,
        life: life,
        max: life,
        r: rand(1.2, 3.4),
        rgb: rgb
      });
    }
  }

  function floatText(x, y, s, rgb, big) {
    floats.push({ x: x, y: y, s: s, rgb: rgb, t: 0, big: !!big });
  }

  function ringAt(x, y, rgb, r) {
    rings.push({ x: x, y: y, rgb: rgb, r: 4, max: r, t: 0 });
  }

  function hurt(u, dmg, why) {
    if (!u || dmg <= 0 || u.hp <= 0) return 0;
    dmg = Math.max(1, Math.round(dmg));
    u.hp = Math.max(0, u.hp - dmg);
    u.hitT = 0.28;
    u.flash = 0.22;
    floatText(u.x, u.y - 22, '-' + dmg, u.side === 'p' ? CYN : MAG, dmg >= 20);
    if (u.side === 'p' && hpP && hpP.parentElement && hpP.parentElement.parentElement) {
      const wrap = document.querySelector('.hp-p');
      if (wrap) {
        wrap.classList.remove('flash');
        void wrap.offsetWidth;
        wrap.classList.add('flash');
      }
    }
    if (u.side === 'f') {
      const wrap = document.querySelector('.hp-f');
      if (wrap) {
        wrap.classList.remove('flash');
        void wrap.offsetWidth;
        wrap.classList.add('flash');
      }
    }
    audio.hit();
    return dmg;
  }

  function applyBlast(x, y, wep, shooter) {
    const mul = dmgMul();
    let any = false;
    const list = [G.p, G.f];
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      if (!u || u.hp <= 0) continue;
      const d = hypot(x - u.x, y - u.y);
      let dmg = 0;
      const body = d <= u.r + 5;
      if (body) dmg = wep.direct * mul;
      if (d < wep.splash) {
        const fall = Math.pow(1 - d / wep.splash, 1.1);
        const spl = wep.direct * 0.72 * fall * mul;
        if (spl > dmg) dmg = spl;
      }
      if (dmg >= 1) {
        const dealt = hurt(u, dmg, 'blast');
        if (dealt > 0 && u !== shooter) any = true;
      }
    }
    return any;
  }

  function ungroundIfAir(u) {
    if (!u) return;
    const gy = groundAt(u.x) - u.r;
    if (gy > u.y + 3) {
      u.grounded = false;
      if (u.vy < 0) u.vy = 0;
    } else if (u.grounded) {
      u.y = gy;
    }
  }

  function stepUnitPhys(u, dt) {
    if (!u || u.hp <= 0) {
      if (u && u.hp <= 0) {
        u.y += 30 * dt;
      }
      return;
    }
    if (u.hitT > 0) u.hitT -= dt;
    if (u.flash > 0) u.flash -= dt;
    if (u.walkT > 0) u.walkT -= dt;
    u.bob += dt * 3.2;
    const gy = groundAt(u.x) - u.r;
    if (u.grounded) {
      if (gy > u.y + 2.5) {
        u.grounded = false;
        u.vy = 0;
        u.fall = 0;
      } else {
        u.y = gy;
        u.vy = 0;
      }
    } else {
      u.vy += GRAV * dt;
      const ny = u.y + u.vy * dt;
      u.fall += Math.max(0, ny - u.y);
      u.y = ny;
      if (u.y > VH + 40) {
        u.hp = 0;
        floatText(u.x, VH - 40, '坠亡', MAG, true);
        audio.fall();
        return;
      }
      if (u.y >= gy) {
        u.y = gy;
        u.grounded = true;
        u.vy = 0;
        if (u.fall >= 36) {
          let dmg = Math.min(28, Math.floor((u.fall - 36) * 0.35));
          dmg = Math.max(1, Math.round(dmg * dmgMul()));
          hurt(u, dmg, 'fall');
          burst(u.x, u.y + u.r, DIRT, 12, 140, 0.4);
          audio.fall();
          kick(3.2);
        }
        u.fall = 0;
      }
    }
  }

  function unitsSettled() {
    const a = !G.p || G.p.hp <= 0 || (G.p.grounded && Math.abs(G.p.vy) < 4);
    const b = !G.f || G.f.hp <= 0 || (G.f.grounded && Math.abs(G.f.vy) < 4);
    return a && b;
  }

  function checkEnd() {
    const pd = !G.p || G.p.hp <= 0;
    const fd = !G.f || G.f.hp <= 0;
    if (!pd && !fd) return false;
    G.mode = 'end';
    G.phase = 'end';
    audio.chargeStop();
    const turns = G.turns;
    if (pd && fd) {
      G.winStreak = 0;
      saveBest();
      audio.lose();
      showOverlay('draw', '对坠', '同烬。本局 ' + turns + ' 回合 · 连胜清零');
      setHint('对坠 · R 再来', 'warn');
    } else if (fd) {
      G.winStreak += 1;
      if (!G.bestTurns || turns < G.bestTurns) G.bestTurns = turns;
      saveBest();
      audio.win();
      popStreak(1);
      screenFlash(GOLD, 0.55);
      showOverlay('win', '堂破了', '烬丸倒了。' + turns + ' 回合 · 连胜 ' + G.winStreak + (G.bestTurns ? ' · 最快 ' + G.bestTurns + ' 回' : ''));
      setHint('堂破了 · R 再来', 'hot');
    } else {
      G.winStreak = 0;
      saveBest();
      audio.lose();
      screenFlash(MAG, 0.5);
      showOverlay('lose', '落堂了', '岚丸倒下。本局 ' + turns + ' 回合');
      setHint('落堂了 · R 再来', 'warn');
    }
    syncHud();
    return true;
  }

  function beginTurn(who) {
    G.turn = who;
    G.phase = 'aim';
    G.charging = false;
    G.power = TAP_POW;
    G.walk = WALK_PX;
    G.timeout = TURN_T;
    G.shot = null;
    trail.length = 0;
    rollWind();
    if (who === 'p') G.turns += 1;
    audio.chargeStop();
    toast(who === 'p' ? '岚丸的回合 · 风 ' + windText() : '烬丸瞄准中 · 风 ' + windText(), false, who === 'p');
    setHint(who === 'p' ? '走位拉角，空格蓄力松手打 · 风 ' + windText() : '烬丸拉炮…', who === 'p' ? '' : 'warn');
    if (who === 'f') startAI();
    syncHud();
    cam.tx = VW * 0.5;
    cam.ty = VH * 0.5;
    cam.tz = 1;
  }

  function startCharge() {
    if (G.mode !== 'play' || G.phase !== 'aim' || G.turn !== 'p') return;
    G.phase = 'charge';
    G.charging = true;
    G.power = TAP_POW;
    audio.ensure();
    audio.chargeStart();
  }

  function releaseCharge() {
    if (G.mode !== 'play') return;
    if (G.phase === 'charge' && G.turn === 'p' && G.charging) {
      fire(G.p);
    }
  }

  function fire(u) {
    if (!u || G.phase === 'fly') return;
    const wep = wepOf();
    const th = u.ang * Math.PI / 180;
    const nose = 18;
    const sx = u.x + Math.cos(th) * nose;
    const sy = u.y - 4 - Math.sin(th) * nose;
    const spd = muzzleSpeed(G.power, u.ang, wep);
    G.shot = {
      x: sx,
      y: sy,
      vx: Math.cos(th) * spd,
      vy: -Math.sin(th) * spd,
      wep: wep,
      owner: u,
      pierced: false,
      fuse: 0,
      life: 0
    };
    trail.length = 0;
    G.phase = 'fly';
    G.charging = false;
    audio.fire(wep);
    burst(sx, sy, u.side === 'p' ? CYN : MAG, 8, 80, 0.25);
    u.walkT = 0;
  }

  function explode(x, y, wep, owner, fromHit) {
    carve(x, y, wep.crater);
    if (wep.id === 2 && G.shot && G.shot.pierced) {
      const s = hypot(G.shot.vx, G.shot.vy) || 1;
      const ux = G.shot.vx / s;
      const uy = G.shot.vy / s;
      for (let s2 = 0; s2 <= 46; s2 += 4) carve(x - ux * s2, y - uy * s2, 12);
    }
    const hit = applyBlast(x, y, wep, owner) || fromHit;
    burst(x, y, hit ? (owner && owner.side === 'p' ? CYN : MAG) : DIRT, hit ? 28 : 16, hit ? 260 : 180, 0.55);
    burst(x, y, GOLD, hit ? 10 : 4, 140, 0.35);
    ringAt(x, y, hit ? GOLD : HOT, wep.crater * 1.6);
    audio.boom(hit, wep);
    if (hit) {
      audio.hit();
      hitStop(fromHit ? 0.066 : 0.048);
      kick(fromHit ? 6.2 : 4.4);
      screenFlash(owner && owner.side === 'p' ? CYN : MAG, 0.28);
      G.combo += 1;
      if (G.combo >= 2) {
        floatText(x, y - 36, '连堂 ×' + G.combo, GOLD, true);
        audio.combo(G.combo);
        if (comboEl) {
          comboEl.classList.remove('hot');
          void comboEl.offsetWidth;
          comboEl.classList.add('hot');
        }
      }
    } else {
      G.combo = 0;
      audio.dirt();
      kick(2.1);
    }
    ungroundIfAir(G.p);
    ungroundIfAir(G.f);
    G.shot = null;
    G.phase = 'settle';
    G.settleT = 0.18;
    cam.tz = 1;
    cam.tx = VW * 0.5;
    cam.ty = VH * 0.5;
    syncHud();
  }

  function stepShot(dt) {
    const s = G.shot;
    if (!s) return;
    s.life += dt;
    s.vx += G.wind * WIND_K * dt;
    s.vy += GRAV * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    trail.push({ x: s.x, y: s.y, a: 1 });
    if (trail.length > 28) trail.shift();
    cam.tx = clamp(s.x, 180, VW - 180);
    cam.ty = clamp(s.y, 140, VH - 80);
    cam.tz = 1.12;
    if (s.x < 2 || s.x > VW - 2 || s.y > VH + 20) {
      explode(clamp(s.x, 2, VW - 2), Math.min(s.y, VH - 4), s.wep, s.owner, false);
      return;
    }
    const u = unitAt(s.x, s.y, s.owner);
    if (u) {
      explode(s.x, s.y, s.wep, s.owner, true);
      return;
    }
    if (inGround(s.x, s.y)) {
      if (s.wep.id === 2 && !s.pierced) {
        s.pierced = true;
        s.fuse = 0.18;
        const sp = hypot(s.vx, s.vy) || 1;
        const ux = s.vx / sp;
        const uy = s.vy / sp;
        for (let k = 0; k <= 46; k += 4) carve(s.x + ux * k, s.y + uy * k, 11);
        s.x += ux * 46;
        s.y += uy * 46;
        let g = 0;
        while (inGround(s.x, s.y) && g < 18) {
          s.x += ux * 3;
          s.y += uy * 3;
          g += 1;
        }
        burst(s.x, s.y, HOT, 10, 120, 0.3);
        audio.tick();
        return;
      }
      explode(s.x, s.y, s.wep, s.owner, false);
      return;
    }
    if (s.pierced) {
      s.fuse -= dt;
      if (s.fuse <= 0) explode(s.x, s.y, s.wep, s.owner, false);
    }
  }

  let AI = { wait: 0, walked: false, ang: 65, pow: 70, wep: 0, stage: 0 };

  function pickAIWeapon() {
    const foe = G.p;
    if (G.mapId === 'canyon') return 2;
    if (foe) {
      const x = foe.x | 0;
      const g0 = groundAt(x);
      const gl = groundAt(clamp(x - 36, 0, VW - 1));
      const gr = groundAt(clamp(x + 36, 0, VW - 1));
      if (gl - g0 > 28 || gr - g0 > 28) return 1;
      if (foe.x < 70 || foe.x > VW - 70) return 1;
    }
    return 0;
  }

  function scoreImpact(imp, wep, from) {
    if (!imp || !G.p) return -1e9;
    const t = G.p;
    const d = hypot(imp.x - t.x, imp.y - t.y);
    if (imp.hit === t) return 12000 - imp.t * 40;
    if (d < wep.splash) return 5000 - d * 28;
    const feet = hypot(imp.x - t.x, imp.y - (t.y + t.r));
    if (feet < 40) return 1800 - feet * 16;
    const mid = Math.abs(imp.x - (from.x + t.x) * 0.5);
    return 200 - d * 0.45 - mid * 0.05;
  }

  function solveAI(from) {
    const wep = WEPS[from && from.side === 'f' ? (G.wep || 0) : (G.wep || 0)] || WEPS[0];
    let best = { score: -1e9, ang: from.ang, pow: 70 };
    function muzzle(ang) {
      const th = ang * Math.PI / 180;
      return { x: from.x + Math.cos(th) * 18, y: from.y - 4 - Math.sin(th) * 18 };
    }
    for (let ang = 15; ang <= 165; ang += 3) {
      for (let pow = 18; pow <= 100; pow += 4) {
        const m = muzzle(ang);
        const imp = traceShot(m.x, m.y, ang, pow, G.wind, wep, G.H, from);
        const sc = scoreImpact(imp, wep, from);
        if (sc > best.score) best = { score: sc, ang: ang, pow: pow };
      }
    }
    for (let ang = best.ang - 3; ang <= best.ang + 3; ang += 1) {
      for (let pow = best.pow - 4; pow <= best.pow + 4; pow += 1) {
        if (ang < 8 || ang > 172 || pow < 14 || pow > 100) continue;
        const m = muzzle(ang);
        const imp = traceShot(m.x, m.y, ang, pow, G.wind, wep, G.H, from);
        const sc = scoreImpact(imp, wep, from);
        if (sc > best.score) best = { score: sc, ang: ang, pow: pow };
      }
    }
    return best;
  }

  function startAI() {
    G.wep = pickAIWeapon();
    syncWeps();
    const from = G.f;
    let best = solveAI(from);
    let walkTo = from.x;
    const tries = [-72, -40, 40, 72];
    const ox = from.x;
    const oy = from.y;
    for (let i = 0; i < tries.length; i++) {
      const nx = clamp(ox + tries[i], 28, VW - 28);
      from.x = nx;
      from.y = groundAt(nx) - from.r;
      const b2 = solveAI(from);
      if (b2.score > best.score + 80) {
        best = b2;
        walkTo = nx;
      }
    }
    from.x = ox;
    from.y = oy;
    const loose = G.kind === 'core' ? 0 : 1;
    const aj = loose ? 3 : 1.5;
    const pj = loose ? 4 : 2;
    best.ang = clamp(best.ang + rand(-aj, aj), 5, 175);
    best.pow = clamp(best.pow + rand(-pj, pj), 16, 100);
    AI.wait = 0.28;
    AI.walked = false;
    AI.walkTo = walkTo;
    AI.ang = best.ang;
    AI.pow = best.pow;
    AI.stage = 0;
  }

  function stepAI(dt) {
    const u = G.f;
    if (!u) return;
    if (AI.stage === 0) {
      AI.wait -= dt;
      if (AI.wait > 0) return;
      AI.stage = 1;
    }
    if (AI.stage === 1) {
      const dx = AI.walkTo - u.x;
      if (Math.abs(dx) > 2 && G.walk > 0) {
        const dir = dx > 0 ? 1 : -1;
        const step = Math.min(G.walk, 78 * dt, Math.abs(dx));
        u.x = clamp(u.x + dir * step, 22, VW - 22);
        G.walk -= step;
        u.face = dir;
        u.walkT = 0.1;
        ungroundIfAir(u);
      } else {
        AI.stage = 2;
        AI.wait = 0.12;
      }
      return;
    }
    if (AI.stage === 2) {
      const da = AI.ang - u.ang;
      if (Math.abs(da) > 0.6) {
        u.ang += Math.sign(da) * Math.min(Math.abs(da), 70 * dt);
      } else {
        u.ang = AI.ang;
        AI.stage = 3;
        G.phase = 'charge';
        G.charging = true;
        G.power = TAP_POW;
        audio.chargeStart();
      }
      return;
    }
    if (AI.stage === 3) {
      G.power = Math.min(100, G.power + (100 - TAP_POW) / CHARGE_T * dt);
      audio.chargeTick(G.power);
      if (G.power >= AI.pow - 0.5 || G.power >= 100) {
        G.power = clamp(AI.pow, TAP_POW, 100);
        fire(u);
      }
    }
  }

  function walkPlayer(dt) {
    if (G.turn !== 'p' || G.phase !== 'aim') return;
    let dir = 0;
    if (keys.l || padHold.l) dir -= 1;
    if (keys.r || padHold.r) dir += 1;
    if (!dir || G.walk <= 0) return;
    const step = Math.min(G.walk, 90 * dt);
    G.p.x = clamp(G.p.x + dir * step, 22, VW - 22);
    G.walk -= step;
    G.p.face = dir;
    G.p.walkT = 0.12;
    ungroundIfAir(G.p);
  }

  function aimPlayer(dt) {
    if (G.turn !== 'p' || (G.phase !== 'aim' && G.phase !== 'charge')) return;
    let dir = 0;
    if (keys.u || padHold.u) dir += 1;
    if (keys.d || padHold.d) dir -= 1;
    if (!dir) return;
    G.p.ang = clamp(G.p.ang + dir * 70 * dt, 0, 180);
  }

  function resetWorld() {
    G.H = buildHeight(G.mapId);
    terrainDirty = true;
    G.p = makeUnit('p');
    G.f = makeUnit('f');
    G.shot = null;
    G.combo = 0;
    G.turns = 0;
    G.wep = 0;
    G.power = TAP_POW;
    particles.length = 0;
    floats.length = 0;
    rings.length = 0;
    trail.length = 0;
    cam.x = cam.tx = VW * 0.5;
    cam.y = cam.ty = VH * 0.5;
    cam.z = cam.tz = 1;
  }

  function startGame(kind) {
    G.kind = kind === 'core' ? 'core' : 'hall';
    G.mode = 'play';
    resetWorld();
    hideOverlay();
    audio.start();
    beginTurn('p');
    toast((G.kind === 'core' ? '堂核 · 薄血狂风' : '弹堂 · 看风拉角') + ' · ' + MAP_NAME[G.mapId], G.kind === 'core', G.kind !== 'core');
    saveBest();
    syncHud();
  }

  function goTitle() {
    G.mode = 'title';
    G.phase = 'aim';
    resetWorld();
    rollWind();
    audio.chargeStop();
    showOverlay('title', '弹堂', '看风，拉满或点射，把对面从石殿上轰下去。');
    setHint('1 / 回车 / 空格 弹堂 · 2 堂核 · 点地图换地形');
    syncMaps();
    syncHud();
  }

  function restart() {
    audio.ensure();
    if (G.mode === 'title') startGame('hall');
    else startGame(G.kind || 'hall');
  }

  function setMap(id) {
    if (id !== 'plain' && id !== 'canyon' && id !== 'twin') return;
    G.mapId = id;
    if (G.mode === 'title') {
      resetWorld();
      rollWind();
    }
    syncMaps();
    syncHud();
    saveBest();
  }

  function setWep(n) {
    n = n | 0;
    if (n < 0 || n > 2) return;
    if (G.mode === 'play' && G.phase !== 'aim' && G.phase !== 'charge') return;
    G.wep = n;
    syncWeps();
    syncHud();
    toast(WEPS[n].name, false, n === 1);
  }


  function updateFx(dt) {
    if (G.shake > 0) G.shake = Math.max(0, G.shake - dt * 18);
    if (G.flash > 0) G.flash = Math.max(0, G.flash - dt * 1.8);
    if (G.punch > 1) G.punch = 1 + (G.punch - 1) * Math.max(0, 1 - dt * 10);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0 && toastEl) toastEl.classList.add('hidden');
    }
    cam.x += (cam.tx - cam.x) * Math.min(1, dt * 4.2);
    cam.y += (cam.ty - cam.y) * Math.min(1, dt * 4.2);
    cam.z += (cam.tz - cam.z) * Math.min(1, dt * 3.4);
    for (let i = particles.length - 1; i >= 0; i--) {
      const q = particles[i];
      q.vy += q.g * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.life -= dt;
      if (q.life <= 0) particles.splice(i, 1);
    }
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.t += dt;
      f.y -= 28 * dt;
      if (f.t > 0.85) floats.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt;
      r.r = lerp(4, r.max, Math.min(1, r.t / 0.32));
      if (r.t > 0.4) rings.splice(i, 1);
    }
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.tw = (s.tw + dt * s.sp) % TAU;
    }
  }

  function update(dt) {
    G.clock += dt;
    G.t += dt;
    updateFx(dt);
    if (G.stop > 0) {
      G.stop -= dt;
      return;
    }
    if (G.p) stepUnitPhys(G.p, dt);
    if (G.f) stepUnitPhys(G.f, dt);
    if (G.mode === 'play' && G.phase !== 'fly' && G.phase !== 'settle') {
      if ((G.p && G.p.hp <= 0) || (G.f && G.f.hp <= 0)) {
        if (checkEnd()) return;
      }
    }
    if (G.mode === 'title') {
      if (G.p) G.p.ang = 65 + Math.sin(G.t * 0.7) * 6;
      if (G.f) G.f.ang = 115 + Math.sin(G.t * 0.55 + 1) * 6;
      return;
    }
    if (G.mode !== 'play') return;

    if (G.phase === 'aim' || G.phase === 'charge') {
      G.timeout -= dt;
      if (G.timeout <= 0 && G.turn === 'p') {
        G.power = 50;
        fire(G.p);
        toast('超时 · 半力打出', true, false);
        return;
      }
      if (G.turn === 'p') {
        walkPlayer(dt);
        aimPlayer(dt);
        if (G.phase === 'charge') {
          G.power = Math.min(100, G.power + (100 - TAP_POW) / CHARGE_T * dt);
          audio.chargeTick(G.power);
        }
      } else {
        stepAI(dt);
      }
      syncHud();
    } else if (G.phase === 'fly') {
      stepShot(dt);
    } else if (G.phase === 'settle') {
      G.settleT -= dt;
      if (G.settleT <= 0 && unitsSettled()) {
        if (checkEnd()) return;
        beginTurn(G.turn === 'p' ? 'f' : 'p');
      }
    }
  }

  function seedStars() {
    stars.length = 0;
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(8, 280),
        r: rand(0.5, 1.6),
        a: rand(0.25, 0.85),
        tw: rand(0, TAU),
        sp: rand(0.6, 2.2)
      });
    }
  }

  function keyArt(src, sx, sy, sw, sh) {
    const c = document.createElement('canvas');
    c.width = sw;
    c.height = sh;
    const g = c.getContext('2d');
    g.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
    const id = g.getImageData(0, 0, sw, sh);
    const p = id.data;
    for (let i = 0; i < p.length; i += 4) {
      const r = p[i];
      const gg = p[i + 1];
      const b = p[i + 2];
      const lum = r + gg + b;
      if (lum < 46 || (r < 16 && gg < 16 && b < 20)) p[i + 3] = 0;
      else if (r < 36 && gg < 26 && b < 38 && lum < 86) p[i + 3] = Math.max(0, p[i + 3] - 180);
    }
    g.putImageData(id, 0, 0);
    return c;
  }

  function loadArt() {
    if (!hasDom) return;
    let left = 3;
    function done() {
      left -= 1;
      if (left <= 0) artReady = true;
    }
    function load(src, cb) {
      const im = new Image();
      im.onload = function () { cb(im); done(); };
      im.onerror = function () { cb(null); done(); };
      im.src = src;
    }
    load('preview.png', function (im) { coverImg = im; });
    load('art/hero.png', function (im) {
      heroImg = im;
      heroFrames = [];
      if (!im) return;
      const fw = (im.width / 6) | 0;
      const fh = (im.height / 4) | 0;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 6; c++) heroFrames.push(keyArt(im, c * fw, r * fh, fw, fh));
      }
    });
    load('art/foe.png', function (im) {
      foeImg = im;
      if (im) foeSpr = keyArt(im, 0, 0, im.width, im.height);
    });
  }

  function paintTerrain() {
    if (!hasDom) return;
    if (!terrainCv) {
      terrainCv = document.createElement('canvas');
      terrainCv.width = VW;
      terrainCv.height = VH;
      terrainCx = terrainCv.getContext('2d');
    }
    const g = terrainCx;
    g.clearRect(0, 0, VW, VH);
    const H = G.H;
    if (!H) return;
    const top = G.mapId === 'canyon' ? '#5ad6ff' : G.mapId === 'twin' ? '#ffe36b' : '#7dffc6';
    const mid = G.mapId === 'canyon' ? '#2a1a48' : G.mapId === 'twin' ? '#2a1840' : '#162436';
    const bot = '#0a0614';
    const grd = g.createLinearGradient(0, 220, 0, VH);
    grd.addColorStop(0, mid);
    grd.addColorStop(1, bot);
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(0, VH);
    g.lineTo(0, H[0]);
    for (let x = 1; x < VW; x++) g.lineTo(x, H[x]);
    g.lineTo(VW, VH);
    g.closePath();
    g.fill();
    g.strokeStyle = top;
    g.lineWidth = 2.2;
    g.shadowColor = top;
    g.shadowBlur = 10;
    g.beginPath();
    g.moveTo(0, H[0]);
    for (let x = 1; x < VW; x++) g.lineTo(x, H[x]);
    g.stroke();
    g.shadowBlur = 0;
    g.globalAlpha = 0.22;
    g.strokeStyle = '#fff';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(0, H[0] + 5);
    for (let x = 1; x < VW; x++) g.lineTo(x, H[x] + 5);
    g.stroke();
    g.globalAlpha = 1;
    terrainDirty = false;
  }

  function drawSky(g) {
    const sky = g.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, '#14082a');
    sky.addColorStop(0.45, '#1a0c28');
    sky.addColorStop(1, '#0c0814');
    g.fillStyle = sky;
    g.fillRect(0, 0, VW, VH);
    if (coverImg && G.mode === 'title') {
      g.save();
      g.globalAlpha = 0.28;
      const s = Math.max(VW / coverImg.width, VH / coverImg.height);
      const w = coverImg.width * s;
      const h = coverImg.height * s;
      g.drawImage(coverImg, (VW - w) * 0.5, (VH - h) * 0.5, w, h);
      g.restore();
    }
    const neb = g.createRadialGradient(200, 80, 10, 200, 90, 260);
    neb.addColorStop(0, 'rgba(0,232,255,0.10)');
    neb.addColorStop(1, 'rgba(0,232,255,0)');
    g.fillStyle = neb;
    g.fillRect(0, 0, VW, VH);
    const neb2 = g.createRadialGradient(780, 60, 10, 780, 80, 240);
    neb2.addColorStop(0, 'rgba(255,61,184,0.10)');
    neb2.addColorStop(1, 'rgba(255,61,184,0)');
    g.fillStyle = neb2;
    g.fillRect(0, 0, VW, VH);
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.55 + 0.45 * Math.sin(s.tw));
      g.fillStyle = rgba(WHT, a);
      g.fillRect(s.x, s.y, s.r, s.r);
    }
    g.beginPath();
    g.fillStyle = 'rgba(255,227,107,0.16)';
    g.arc(480, 92, 34, 0, TAU);
    g.fill();
    g.beginPath();
    g.fillStyle = 'rgba(255,244,200,0.85)';
    g.arc(480, 92, 16, 0, TAU);
    g.fill();
  }

  function drawWind(g) {
    if (!G.wind) return;
    g.save();
    g.globalAlpha = 0.35;
    const dir = G.wind > 0 ? 1 : -1;
    const n = Math.min(10, 3 + Math.abs(G.wind));
    for (let i = 0; i < n; i++) {
      const y = 70 + i * 28 + (G.t * 30 * dir + i * 13) % 20;
      const x = ((G.t * (40 + Math.abs(G.wind) * 8) * dir) + i * 90) % (VW + 80) - 40;
      g.strokeStyle = rgba(GOLD, 0.45);
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + dir * (18 + Math.abs(G.wind)), y);
      g.stroke();
    }
    g.restore();
  }

  function drawProcUnit(g, u) {
    const rgb = u.side === 'p' ? CYN : MAG;
    g.save();
    g.translate(u.x, u.y + Math.sin(u.bob) * 1.4);
    if (u.hitT > 0) g.translate(rand(-2, 2), 0);
    g.fillStyle = rgba(rgb, 0.18);
    g.beginPath();
    g.arc(0, 2, 16, 0, TAU);
    g.fill();
    g.fillStyle = '#1a1028';
    g.beginPath();
    g.ellipse(0, 4, 11, 9, 0, 0, TAU);
    g.fill();
    g.fillStyle = rgba(rgb, 0.95);
    g.beginPath();
    g.arc(-5, -6, 4.2, 0, TAU);
    g.arc(5, -6, 4.2, 0, TAU);
    g.fill();
    g.fillStyle = '#f4eeff';
    g.beginPath();
    g.arc(0, -1, 6.2, 0, TAU);
    g.fill();
    g.fillStyle = rgb === CYN ? '#083038' : '#380818';
    g.beginPath();
    g.arc(u.face * 1.6, -1.2, 1.7, 0, TAU);
    g.fill();
    g.restore();
  }

  function drawSpriteUnit(g, u) {
    const walk = u.walkT > 0;
    const falling = !u.grounded;
    let fr = null;
    if (u.side === 'p' && heroFrames.length >= 24) {
      if (u.hitT > 0) fr = heroFrames[3 * 6 + 3];
      else if (falling) fr = heroFrames[2 * 6 + 1];
      else if (G.phase === 'fly' && G.shot && G.shot.owner === u) fr = heroFrames[1 * 6 + 3];
      else if (G.phase === 'charge' && G.turn === u.side[0]) fr = heroFrames[1 * 6 + 2];
      else if (walk) fr = heroFrames[0 * 6 + ((G.t * 10) | 0) % 5];
      else fr = heroFrames[1 * 6 + 0];
    } else if (u.side === 'f' && foeSpr) {
      fr = foeSpr;
    }
    if (!fr) {
      drawProcUnit(g, u);
      return;
    }
    g.save();
    g.translate(u.x, u.y + Math.sin(u.bob) * 1.2);
    if (u.hitT > 0) g.translate(rand(-2, 2), 0);
    const face = u.ang > 90 ? -1 : 1;
    g.scale(face, 1);
    const h = 46;
    const w = h * (fr.width / fr.height);
    g.drawImage(fr, -w * 0.5, -h * 0.62, w, h);
    g.restore();
  }

  function drawCannon(g, u) {
    const th = u.ang * Math.PI / 180;
    const rgb = u.side === 'p' ? CYN : MAG;
    const x0 = u.x;
    const y0 = u.y - 4;
    const x1 = x0 + Math.cos(th) * 20;
    const y1 = y0 - Math.sin(th) * 20;
    g.strokeStyle = rgba(rgb, 0.95);
    g.lineWidth = 3.2;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
    g.fillStyle = rgba(GOLD, G.phase === 'charge' && curUnit() === u ? 0.9 : 0.4);
    g.beginPath();
    g.arc(x1, y1, G.phase === 'charge' && curUnit() === u ? 3.4 + G.power * 0.02 : 2.4, 0, TAU);
    g.fill();
    if (G.mode === 'play' && G.turn === u.side[0] && (G.phase === 'aim' || G.phase === 'charge')) {
      const len = 80;
      g.save();
      g.setLineDash([4, 5]);
      g.strokeStyle = rgba(WHT, 0.45);
      g.lineWidth = 1.2;
      g.beginPath();
      g.moveTo(x1, y1);
      g.lineTo(x1 + Math.cos(th) * len, y1 - Math.sin(th) * len);
      g.stroke();
      g.restore();
    }
  }

  function drawUnitHp(g, u) {
    const w = 28;
    const x = u.x - w * 0.5;
    const y = u.y - 28;
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.fillRect(x, y, w, 4);
    g.fillStyle = rgba(u.side === 'p' ? CYN : MAG, 0.95);
    g.fillRect(x, y, w * clamp(u.hp / u.max, 0, 1), 4);
  }

  function drawShot(g) {
    const s = G.shot;
    if (!s) return;
    const rgb = s.owner && s.owner.side === 'p' ? CYN : MAG;
    g.save();
    g.lineCap = 'round';
    for (let i = 1; i < trail.length; i++) {
      const a = i / trail.length;
      g.strokeStyle = rgba(rgb, a * 0.7);
      g.lineWidth = 1.4 + a * 2;
      g.beginPath();
      g.moveTo(trail[i - 1].x, trail[i - 1].y);
      g.lineTo(trail[i].x, trail[i].y);
      g.stroke();
    }
    g.fillStyle = rgba(WHT, 0.95);
    g.shadowColor = rgba(rgb, 0.9);
    g.shadowBlur = 12;
    g.beginPath();
    g.arc(s.x, s.y, s.wep.id === 1 ? 5.2 : 3.6, 0, TAU);
    g.fill();
    g.restore();
  }

  function drawChargeBar(g, u) {
    if (!(G.phase === 'charge' && curUnit() === u)) return;
    const w = 42;
    const x = u.x - w * 0.5;
    const y = u.y + 20;
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(x, y, w, 6);
    const t = G.power / 100;
    g.fillStyle = t > 0.92 ? rgba(GOLD, 1) : rgba(u.side === 'p' ? CYN : MAG, 0.95);
    g.fillRect(x, y, w * t, 6);
    if (t > 0.98) {
      g.strokeStyle = rgba(GOLD, 0.8);
      g.strokeRect(x - 1, y - 1, w + 2, 8);
    }
  }

  function draw() {
    if (!ctx || !canvas) return;
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#070510';
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();
    const sx = G.shake && !REDUCE ? rand(-G.shake, G.shake) * 0.35 : 0;
    const sy = G.shake && !REDUCE ? rand(-G.shake, G.shake) * 0.25 : 0;
    ctx.translate(VW * 0.5 + sx, VH * 0.5 + sy);
    ctx.scale(cam.z * (G.punch || 1), cam.z * (G.punch || 1));
    ctx.translate(-cam.x, -cam.y);

    drawSky(ctx);
    drawWind(ctx);
    if (terrainDirty) paintTerrain();
    if (terrainCv) ctx.drawImage(terrainCv, 0, 0);

    if (G.p && G.p.hp > 0) {
      drawSpriteUnit(ctx, G.p);
      drawCannon(ctx, G.p);
      drawUnitHp(ctx, G.p);
      drawChargeBar(ctx, G.p);
    }
    if (G.f && G.f.hp > 0) {
      drawSpriteUnit(ctx, G.f);
      drawCannon(ctx, G.f);
      drawUnitHp(ctx, G.f);
      drawChargeBar(ctx, G.f);
    }
    drawShot(ctx);

    for (let i = 0; i < particles.length; i++) {
      const q = particles[i];
      ctx.fillStyle = rgba(q.rgb, clamp(q.life / q.max, 0, 1));
      ctx.beginPath();
      ctx.arc(q.x, q.y, q.r, 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < rings.length; i++) {
      const r = rings[i];
      ctx.strokeStyle = rgba(r.rgb, 1 - r.t / 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
    }
    ctx.font = 'bold 12px Segoe UI, PingFang SC, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < floats.length; i++) {
      const f = floats[i];
      ctx.fillStyle = rgba(f.rgb, 1 - f.t / 0.85);
      ctx.font = (f.big ? 'bold 16px ' : 'bold 12px ') + 'Segoe UI, PingFang SC, sans-serif';
      ctx.fillText(f.s, f.x, f.y);
    }

    ctx.restore();
    if (G.flash > 0) {
      ctx.fillStyle = rgba(G.flashRgb, G.flash * 0.35);
      ctx.fillRect(view.ox, view.oy, VW * view.scale, VH * view.scale);
    }
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - view.ox) / view.scale;
    const y = (e.clientY - rect.top - view.oy) / view.scale;
    return { x: x / cam.z + cam.x - VW * 0.5 / cam.z, y: y / cam.z + cam.y - VH * 0.5 / cam.z };
  }

  function aimFromPointer(x, y, u) {
    if (!u) return;
    const dx = x - u.x;
    const dy = u.y - y;
    let ang = Math.atan2(dy, dx) * 180 / Math.PI;
    if (ang < 0) ang += 360;
    if (ang > 180 && ang < 270) ang = 180;
    if (ang >= 270) ang = 0;
    u.ang = clamp(ang, 0, 180);
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

  function primaryAction() {
    if (G.mode === 'title') startGame('hall');
    else if (G.mode === 'end') restart();
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.l = down; e.preventDefault(); }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.r = down; e.preventDefault(); }
    if (k === 'ArrowUp' || k === 'w' || k === 'W') { keys.u = down; e.preventDefault(); }
    if (k === 'ArrowDown' || k === 's' || k === 'S') { keys.d = down; e.preventDefault(); }
    if (k === ' ' || k === 'Spacebar' || k === 'z' || k === 'Z') {
      e.preventDefault();
      if (down && !keys.fire) {
        keys.fire = true;
        if (overlayOpen() && (G.mode === 'title' || G.mode === 'end')) {
          if (k === 'z' || k === 'Z') return;
          primaryAction();
          return;
        }
        startCharge();
      }
      if (!down) {
        keys.fire = false;
        releaseCharge();
      }
      return;
    }
    if (!down) return;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (k === 'r' || k === 'R') {
      restart();
      return;
    }
    if (G.mode === 'title') {
      if (k === '1' || k === 'Enter') { startGame('hall'); return; }
      if (k === '2') { startGame('core'); return; }
      if (k === '[') { setMap(MAP_IDS[(MAP_IDS.indexOf(G.mapId) + 2) % 3]); return; }
      if (k === ']') { setMap(MAP_IDS[(MAP_IDS.indexOf(G.mapId) + 1) % 3]); return; }
      return;
    }
    if (k === '1') setWep(0);
    if (k === '2') setWep(1);
    if (k === '3') setWep(2);
  }

  function bindPad() {
    if (!padEl) return;
    const btns = padEl.querySelectorAll('button');
    function set(kind, on) {
      padHold[kind] = on;
      if (kind === 'fire') {
        if (on) startCharge();
        else releaseCharge();
      }
    }
    for (let i = 0; i < btns.length; i++) {
      (function (btn) {
        const kind = btn.getAttribute('data-pad');
        btn.addEventListener('pointerdown', function (e) {
          audio.ensure();
          btn.classList.add('held');
          set(kind, true);
          try { btn.setPointerCapture(e.pointerId); } catch (err) { /* */ }
          e.preventDefault();
        });
        function up() {
          btn.classList.remove('held');
          set(kind, false);
        }
        btn.addEventListener('pointerup', up);
        btn.addEventListener('pointercancel', up);
        btn.addEventListener('pointerleave', function () {
          if (padHold[kind] && kind !== 'fire') {
            btn.classList.remove('held');
            padHold[kind] = false;
          }
        });
      })(btns[i]);
    }
  }

  function selfCheck() {
    const out = [];
    function ok(name, cond, extra) {
      out.push((cond ? 'OK   ' : 'FAIL ') + name + (extra != null ? '  ' + extra : ''));
    }
    G.mapId = 'plain';
    G.kind = 'hall';
    G.H = buildHeight('plain');
    ok('plain cols', G.H.length === 960);
    ok('plain height', G.H[160] > 300 && G.H[160] < 480, Math.round(G.H[160]));
    G.H = buildHeight('canyon');
    ok('canyon valley', G.H[480] > G.H[120] + 80, Math.round(G.H[480] - G.H[120]));
    G.H = buildHeight('twin');
    ok('twin gap', G.H[480] > G.H[150] + 80, Math.round(G.H[480] - G.H[150]));
    G.H = buildHeight('plain');
    G.p = { x: 152, y: G.H[152] - 14, r: 14, hp: 100, max: 100, side: 'p', ang: 65 };
    G.f = { x: 768, y: G.H[768] - 14, r: 14, hp: 100, max: 100, side: 'f', ang: 115 };
    const a65 = traceShot(152, G.p.y - 4, 65, 70, 0, WEPS[0], G.H, G.p);
    const a45 = traceShot(152, G.p.y - 4, 45, 70, 0, WEPS[0], G.H, G.p);
    const a90 = traceShot(152, G.p.y - 4, 90, 70, 0, WEPS[0], G.H, G.p);
    const dx65 = a65.x - 152;
    const dx45 = a45.x - 152;
    const dx90 = Math.abs(a90.x - 152);
    ok('65deg range 520-680', dx65 >= 500 && dx65 <= 700, Math.round(dx65));
    ok('45 nearer than 65', dx45 < dx65 - 8, Math.round(dx45) + ' < ' + Math.round(dx65));
    ok('90 near feet', dx90 < 50, Math.round(dx90));
    const wL = traceShot(152, G.p.y - 4, 65, 70, -8, WEPS[0], G.H, G.p);
    const wR = traceShot(152, G.p.y - 4, 65, 70, 8, WEPS[0], G.H, G.p);
    ok('wind bends', wL.x < a65.x - 12 && wR.x > a65.x + 12, Math.round(wR.x - wL.x));
    const before = G.H[400];
    G.H = buildHeight('plain');
    carve(400, G.H[400], 30);
    ok('crater carves', G.H[400] > before + 8, Math.round(G.H[400] - before));
    G.H = buildHeight('canyon');
    G.p.x = 122; G.p.y = G.H[122] - 14;
    const pier = traceShot(122, G.p.y - 4, 35, 80, 0, WEPS[2], G.H, G.p);
    ok('pierce runs', !!pier && pier.x > 122, Math.round(pier.x));
    G.H = buildHeight('plain');
    G.p.x = 152; G.p.y = G.H[152] - 14;
    G.f.x = 768; G.f.y = G.H[768] - 14;
    G.wind = 0;
    G.wep = 0;
    const sol = solveAI(G.f);
    const th = sol.ang * Math.PI / 180;
    const mx = G.f.x + Math.cos(th) * 18;
    const my = G.f.y - 4 - Math.sin(th) * 18;
    const ai = traceShot(mx, my, sol.ang, sol.pow, 0, WEPS[0], G.H, G.f);
    const miss = hypot(ai.x - 152, ai.y - G.p.y);
    ok('AI near-hit', miss < 90, 'miss ' + Math.round(miss) + ' ang ' + Math.round(sol.ang) + ' pow ' + Math.round(sol.pow));
    const text = out.join('\n');
    if (typeof console !== 'undefined') console.log(text);
    return out.every(function (l) { return l.indexOf('OK') === 0; });
  }

  if (!hasDom || !canvas || !ctx) {
    const pass = selfCheck();
    if (typeof process !== 'undefined' && process.exit) process.exit(pass ? 0 : 1);
    return;
  }

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (err) { /* */ }
  loadBest();
  seedStars();
  loadArt();
  goTitle();
  resize();
  bindPad();

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button != null && e.button !== 0) return;
    audio.ensure();
    if (overlayOpen()) return;
    const w = worldFromEvent(e);
    if (G.mode === 'play' && G.turn === 'p' && (G.phase === 'aim' || G.phase === 'charge')) {
      aimFromPointer(w.x, w.y, G.p);
      if (G.phase === 'aim') startCharge();
    }
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* */ }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('pointermove', function (e) {
    if (overlayOpen()) return;
    if (G.mode === 'play' && G.turn === 'p' && (G.phase === 'aim' || G.phase === 'charge')) {
      const w = worldFromEvent(e);
      aimFromPointer(w.x, w.y, G.p);
    }
  });
  canvas.addEventListener('pointerup', function () {
    releaseCharge();
  });
  canvas.addEventListener('pointercancel', function () {
    releaseCharge();
  });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  window.addEventListener('keydown', function (e) { onKey(e, true); });
  window.addEventListener('keyup', function (e) { onKey(e, false); });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = keys.fire = false;
    audio.chargeStop();
  });
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (hidden) audio.chargeStop();
  });

  if (btnHall) btnHall.addEventListener('click', function () { audio.ensure(); startGame('hall'); });
  if (btnCore) btnCore.addEventListener('click', function () { audio.ensure(); startGame('core'); });
  if (ovRetry) ovRetry.addEventListener('click', function () { audio.ensure(); restart(); });
  if (ovModes) ovModes.addEventListener('click', function () { audio.ensure(); goTitle(); });
  if (btnMute) btnMute.addEventListener('click', function () { audio.ensure(); audio.setMuted(!audio.muted); });
  if (btnRetry) btnRetry.addEventListener('click', function () { audio.ensure(); restart(); });
  if (ovMaps) {
    ovMaps.addEventListener('click', function (e) {
      const b = e.target.closest('button');
      if (!b) return;
      audio.ensure();
      setMap(b.getAttribute('data-map'));
    });
  }
  if (wepsEl) {
    wepsEl.addEventListener('click', function (e) {
      const b = e.target.closest('button');
      if (!b) return;
      audio.ensure();
      setWep(b.getAttribute('data-w') | 0);
    });
  }

  let acc = 0;
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const t = now / 1000;
    if (hidden) { last = t; return; }
    if (!last) last = t;
    let dt = t - last;
    last = t;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      update(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
  }
  requestAnimationFrame(frame);
})();
