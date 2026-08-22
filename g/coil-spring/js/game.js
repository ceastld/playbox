'use strict';

(function () {
  const WORLD_W = 960;
  const WORLD_H = 540;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const SX = 150;
  const BASE_Y = 512;
  const REST_TOP = 318;
  const COMP_PX = 156;
  const PUCK_R = 11;
  const ANG = 1.05;
  const V0 = 340;
  const V1 = 980;
  const GRAV = 760;
  const FLOOR_Y = 522;
  const MIN_FIRE = 0.12;
  const LIVES = 4;
  const CHARGE_RATE = 0.42;
  const NUDGE_RATE = 0.7;
  const MUTE_KEY = 'coil-spring-mute';

  const STAGES = [
    {
      name: '初压', sub: 'PRESS',
      hint: '按住把芯压进粉色光带，松手弹出',
      toast: '压到光带，松手弹上台',
      target: 0.26, band: 0.1, padY: 400, padW: 168, padH: 16
    },
    {
      name: '对准', sub: 'MATCH',
      hint: '光带窄了，压浅够不着，压过会过头',
      toast: '对准光带再松。虚线是落点',
      target: 0.36, band: 0.07, padY: 370, padW: 122, padH: 15
    },
    {
      name: '高台', sub: 'HIGH',
      hint: '台更高，多压一点',
      toast: '压深一些，弹上高台',
      target: 0.5, band: 0.06, padY: 290, padW: 118, padH: 15
    },
    {
      name: '窄台', sub: 'NARROW',
      hint: '台面很窄，贴着光带中心松',
      toast: '只接得住正中。虚点要对上台面',
      target: 0.44, band: 0.035, padY: 348, padW: 60, padH: 14
    },
    {
      name: '横移', sub: 'SLIDE',
      hint: '台在横移，等虚影台和实台重合再松',
      toast: '虚影是落点时的台，打虚影',
      target: 0.48, band: 0.06, padY: 336, padW: 78, padH: 15,
      move: { amp: 92, spd: 1.12, phase: 0.2 }
    },
    {
      name: '顶挡', sub: 'CEIL',
      hint: '压过会撞顶梁。停在光带里',
      toast: '梁会砸芯。别压过光带',
      target: 0.46, band: 0.05, padY: 318, padW: 100, padH: 14,
      ceil: { x: 300, y: 124, w: 260, h: 10 }
    },
    {
      name: '伪台', sub: 'TRAP',
      hint: '近处粉台是假的，要压到光带才够金台',
      toast: '别落粉台。压到光带打远处金台',
      target: 0.58, band: 0.045, padY: 278, padW: 96, padH: 14,
      decoys: [{ at: 0.3, padY: 404, padW: 86, padH: 14 }]
    },
    {
      name: '侧风', sub: 'GUST',
      hint: '风在推弧线，看虚点被吹到哪再松',
      toast: '风在变。虚点碰上金台再松手',
      target: 0.52, band: 0.05, padY: 322, padW: 112, padH: 14,
      wind: -40, windA: 88, windS: 1.35, windP: 0.4
    },
    {
      name: '游台', sub: 'DRIFT',
      hint: '窄台在游，光带也更窄',
      toast: '压准，再等虚影台重合',
      target: 0.62, band: 0.04, padY: 268, padW: 54, padH: 13,
      move: { amp: 108, spd: 1.28, phase: 0.2 }
    },
    {
      name: '终簧', sub: 'FINALE',
      hint: '顶梁、侧风、游台一起上',
      toast: '压进光带，躲梁，打游动金台',
      target: 0.64, band: 0.035, padY: 254, padW: 48, padH: 13,
      move: { amp: 86, spd: 1.18, phase: 0.6 },
      wind: 20, windA: 54, windS: 1.1, windP: 0.8,
      ceil: { x: 380, y: 78, w: 200, h: 10 }
    }
  ];

  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { alpha: false });
  const overlay = document.getElementById('overlay');
  const panel = document.getElementById('panel');
  const ovKicker = document.getElementById('ov-kicker');
  const ovTitle = document.getElementById('ov-title');
  const ovLead = document.getElementById('ov-lead');
  const ovOps = document.getElementById('ov-ops');
  const ovBtn = document.getElementById('ov-btn');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');
  const stageLabel = document.getElementById('stage-label');
  const powerLabel = document.getElementById('power-label');
  const pipsEl = document.getElementById('pips');
  const toastEl = document.getElementById('toast');
  const hintEl = document.getElementById('hint');
  const fillWrap = document.getElementById('fill-wrap');
  const fillBar = document.getElementById('fill-bar');
  const fillMark = document.getElementById('fill-mark');
  const fillBand = document.getElementById('fill-band');
  const fillNum = document.getElementById('fill-num');

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { u: false, d: false, space: false };
  const pointer = {
    down: false, id: null, x: 0, y: 0, sy: 0, start: 0, mode: 'drag', moved: 0
  };

  const particles = [];
  const motes = [];
  const ripples = [];

  const G = {
    mode: 'title',
    stage: 0,
    t: 0,
    clock: 0,
    lives: LIVES,
    comp: 0.22,
    vis: 0.22,
    visV: 0,
    charging: false,
    spaceT: 0,
    flight: null,
    pad: null,
    decoys: [],
    ceil: null,
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: '#00f0ff',
    toastT: 0,
    clearT: 0,
    paused: false,
    shots: 0,
    lands: 0,
    perfects: 0,
    hud: '',
    spec: STAGES[0]
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

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    taut: null,
    tautGain: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.28;
      btnMute.textContent = m ? '静' : '声';
      btnMute.classList.toggle('muted', m);
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (e) { /* ignore */ }
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, from, to) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const n = Math.max(1, (this.ctx.sampleRate * dur) | 0);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = 'bandpass';
      f.frequency.setValueAtTime(from || 700, t);
      if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
      f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    fire: function (power) {
      this.ensure();
      const p = clamp(power, 0.15, 1);
      this.noise(0.12, 0.07 + p * 0.05, 240, 1400);
      this.beep(90 + p * 40, 0.22, 'sine', 0.07, 48);
      this.beep(420 + p * 160, 0.14, 'triangle', 0.05, 160);
    },
    land: function (perfect) {
      this.ensure();
      this.beep(perfect ? 660 : 520, 0.12, 'triangle', 0.08, perfect ? 1320 : 880);
      this.beep(perfect ? 990 : 780, 0.22, 'sine', 0.055, perfect ? 1760 : 1180);
    },
    miss: function () {
      this.ensure();
      this.noise(0.16, 0.09, 500, 120);
      this.beep(180, 0.24, 'sawtooth', 0.05, 55);
    },
    deny: function () {
      this.ensure();
      this.beep(140, 0.08, 'square', 0.035, 90);
    },
    bonk: function () {
      this.ensure();
      this.noise(0.1, 0.08, 900, 220);
      this.beep(240, 0.14, 'square', 0.04, 80);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, 'triangle', 0.09, 880);
      this.beep(660, 0.24, 'sine', 0.07, 1320);
      this.beep(880, 0.38, 'sine', 0.055, 1760);
    },
    lose: function () {
      this.ensure();
      this.beep(220, 0.42, 'sawtooth', 0.08, 55);
      this.beep(90, 0.64, 'square', 0.045, 40);
    },
    start: function () {
      this.ensure();
      this.beep(180, 0.14, 'sine', 0.06, 420);
      this.beep(280, 0.18, 'triangle', 0.045, 720);
    },
    tickDrone: function (play, power, charging) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 48;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      if (!this.taut) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 90;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.taut = o;
        this.tautGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(46 + (play ? 10 : 0), t, 0.14);
      this.droneGain.gain.setTargetAtTime(play ? 0.014 : 0.0001, t, 0.2);
      this.taut.frequency.setTargetAtTime(70 + power * 280, t, 0.08);
      this.tautGain.gain.setTargetAtTime(charging ? 0.01 + power * 0.03 : 0.0001, t, 0.06);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 120) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.65, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || 'c'
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 16) ripples.shift();
    ripples.push({ x: x, y: y, r: 8, max: max || 54, t: 1, col: col || 'c' });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('warn', kind === 'warn');
    toastEl.classList.toggle('gold', kind === 'gold');
    toastEl.classList.remove('hidden');
    G.toastT = 2.4;
  }

  function hideToast() {
    toastEl.classList.add('hidden');
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.6 + 0.3,
        a: Math.random() * 0.22 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.65 + 0.12
      });
    }
  }

  function capTop(comp) {
    return REST_TOP + clamp(comp, 0, 1) * COMP_PX;
  }

  function puckOnCap(comp) {
    return { x: SX, y: capTop(comp) - PUCK_R };
  }

  function speedOf(comp) {
    return V0 + clamp(comp, 0, 1) * (V1 - V0);
  }

  function windAt(t, spec) {
    spec = spec || G.spec;
    return (spec.wind || 0) + (spec.windA || 0) * Math.sin(t * (spec.windS || 1) + (spec.windP || 0));
  }

  function launchState(comp) {
    const p = puckOnCap(comp);
    const v = speedOf(comp);
    return {
      x: p.x,
      y: p.y,
      vx: Math.cos(ANG) * v,
      vy: -Math.sin(ANG) * v
    };
  }

  function simulateLand(comp, padY, t0, spec) {
    const p = launchState(comp);
    let x = p.x;
    let y = p.y;
    let vx = p.vx;
    let vy = p.vy;
    const dt = 1 / 180;
    let t = t0 || 0;
    let apex = y;
    for (let i = 0; i < 4200; i++) {
      vx += windAt(t, spec) * dt;
      vy += GRAV * dt;
      x += vx * dt;
      y += vy * dt;
      t += dt;
      if (y < apex) apex = y;
      if (vy > 28 && y + PUCK_R >= padY) {
        return { x: x, y: padY - PUCK_R, t: t - t0, apex: apex };
      }
      if (y > FLOOR_Y + 30) return null;
    }
    return null;
  }

  function padXAt(pad, t) {
    if (!pad.move) return pad.cx;
    return pad.cx + pad.move.amp * Math.sin(t * pad.move.spd + pad.move.phase);
  }

  function inBand(comp) {
    const s = G.spec;
    return Math.abs(comp - s.target) <= s.band;
  }

  function hitsRect(cx, cy, r, rx, ry, rw, rh) {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    const dx = cx - nx;
    const dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  }

  function clonePad(spec, land) {
    const cx = land ? land.x : 520;
    return {
      cx: cx,
      y: spec.padY,
      w: spec.padW,
      h: spec.padH || 15,
      move: spec.move ? {
        amp: spec.move.amp,
        spd: spec.move.spd,
        phase: spec.move.phase || 0
      } : null,
      gold: true
    };
  }

  function loadStage(index) {
    const s = STAGES[index];
    G.stage = index;
    G.spec = s;
    const land = simulateLand(s.target, s.padY, 0, s);
    G.pad = clonePad(s, land);
    G.decoys = [];
    if (s.decoys) {
      for (let i = 0; i < s.decoys.length; i++) {
        const d = s.decoys[i];
        const dl = simulateLand(d.at, d.padY, 0, s);
        G.decoys.push({
          cx: dl ? dl.x : 360,
          y: d.padY,
          w: d.padW,
          h: d.padH || 14,
          move: null,
          gold: false
        });
      }
    }
    G.ceil = s.ceil ? {
      x: s.ceil.x, y: s.ceil.y, w: s.ceil.w, h: s.ceil.h
    } : null;
    G.flight = null;
    G.charging = false;
    G.spaceT = 0;
    keys.space = false;
    pointer.down = false;
    G.comp = 0;
    G.vis = 0;
    G.visV = 0;
    G.lock = 0.4;
    G.clearT = 0;
    G.clock = 0;
    canvas.classList.remove('press');
    toast(s.toast);
    hintEl.textContent = s.hint;
    hintEl.classList.remove('hot', 'warn');
  }

  function startRun() {
    G.mode = 'play';
    G.lives = LIVES;
    G.shots = 0;
    G.lands = 0;
    G.perfects = 0;
    G.shake = 0;
    G.flash = 0;
    hideOverlay();
    loadStage(0);
    audio.start();
  }

  function showOverlay(kind) {
    overlay.classList.remove('hidden');
    panel.classList.remove('win', 'lose');
    if (kind === 'title') {
      ovKicker.textContent = 'SPRING';
      ovTitle.textContent = '压簧';
      ovLead.innerHTML = '把弹簧压到光带高度，松手把芯弹上平台。<br />压浅够不着，压过会过头。';
      ovOps.textContent = '按住下滑或空格压簧 · 松手弹出 · ↑↓ 微调 · M 静音';
      ovBtn.textContent = '开压';
    } else if (kind === 'win') {
      panel.classList.add('win');
      ovKicker.textContent = 'CLEAR';
      ovTitle.textContent = '簧停';
      ovLead.textContent = '十台都上了。芯还在簧上。';
      ovOps.textContent = '弹上 ' + G.lands + ' 台 · 正中 ' + G.perfects + ' · 出手 ' + G.shots;
      ovBtn.textContent = '再压一次';
    } else {
      panel.classList.add('lose');
      ovKicker.textContent = 'SNAP';
      ovTitle.textContent = '簧折';
      ovLead.textContent = '芯尽了。台还在晃。';
      ovOps.textContent = STAGES[G.stage].name + ' · 弹上 ' + G.lands + ' 台';
      ovBtn.textContent = '再来一局';
    }
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function retry() {
    audio.ensure();
    startRun();
  }

  function onMain() {
    audio.ensure();
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') startRun();
  }

  function isPlayInput() {
    return G.mode === 'play' && !G.flight && G.lock <= 0;
  }

  function beginCharge(wx, wy) {
    if (!isPlayInput()) return;
    G.charging = true;
    pointer.sy = wy;
    pointer.start = G.comp;
    pointer.moved = 0;
    const rest = puckOnCap(G.vis);
    const near = hypot(wx - rest.x, wy - rest.y) < 46 || (Math.abs(wx - SX) < 64 && wy > REST_TOP - 24 && wy < BASE_Y);
    pointer.mode = near ? 'grab' : 'drag';
    canvas.classList.add('press');
    audio.ensure();
    if (pointer.mode === 'grab') moveCharge(wx, wy);
  }

  function moveCharge(wx, wy) {
    if (!G.charging || G.flight || G.mode !== 'play') return;
    pointer.moved += hypot(wx - pointer.x, wy - pointer.y);
    if (pointer.mode === 'grab') {
      const top = clamp(wy + PUCK_R, REST_TOP, REST_TOP + COMP_PX);
      G.comp = (top - REST_TOP) / COMP_PX;
    } else {
      G.comp = clamp(pointer.start + (wy - pointer.sy) / 168, 0, 1);
    }
  }

  function endCharge() {
    canvas.classList.remove('press');
    if (!G.charging) return;
    G.charging = false;
    if (G.mode !== 'play' || G.flight || G.lock > 0) return;
    tryFire();
  }

  function tryFire() {
    if (G.mode !== 'play' || G.flight || G.lock > 0) return;
    if (G.comp < MIN_FIRE) {
      audio.deny();
      G.visV = -1.8;
      toast('再压深一点', 'warn');
      return;
    }
    fire();
  }

  function fire() {
    const p = launchState(G.comp);
    G.flight = {
      x: p.x,
      y: p.y,
      vx: p.vx,
      vy: p.vy,
      trail: [],
      age: 0,
      stuck: false,
      squish: 1.25,
      shot: G.comp
    };
    G.visV = -2.4 * G.comp;
    G.charging = false;
    keys.space = false;
    G.shots += 1;
    canvas.classList.remove('press');
    audio.fire(G.comp);
    G.shake = 3 + G.comp * 4;
    G.flash = 0.16;
    G.flashCol = inBand(G.comp) ? '#ffe36b' : '#00f0ff';
    emit(14, {
      x: p.x, y: p.y, j: 5,
      vx0: p.vx * 0.04, vx1: p.vx * 0.14,
      vy0: p.vy * 0.05, vy1: p.vy * 0.16,
      life: 0.32, r0: 1.2, r1: 3.4, col: inBand(G.comp) ? 'g' : 'c'
    });
    ripple(p.x, p.y, 'c', 30);
  }

  function succeed(px, py, perfect) {
    const f = G.flight;
    if (!f) return;
    f.stuck = true;
    f.vx = 0;
    f.vy = 0;
    f.x = px;
    f.y = py;
    f.squish = 1.35;
    G.lands += 1;
    if (perfect) G.perfects += 1;
    audio.land(perfect);
    G.flash = 0.3;
    G.flashCol = perfect ? '#ffe36b' : '#00f0ff';
    G.shake = perfect ? 5 : 3.2;
    ripple(px, py, perfect ? 'g' : 'c', perfect ? 72 : 56);
    emit(perfect ? 26 : 16, {
      x: px, y: py, j: 8,
      vx0: -150, vx1: 150, vy0: -180, vy1: 40,
      life: 0.52, r0: 1.3, r1: 4, col: perfect ? 'g' : 'c'
    });
    toast(perfect ? '正中' : '弹上', perfect ? 'gold' : '');
    hintEl.classList.remove('warn');
    hintEl.classList.add('hot');
    G.mode = 'clear';
    G.clearT = 0.86;
    G.lock = 1;
  }

  function shatterAt(x, y, why) {
    if (!G.flight) return;
    G.flight = null;
    G.shake = why === 'ceil' || why === 'trap' ? 8 : 5;
    G.flash = 0.32;
    G.flashCol = '#ff3db8';
    if (why === 'ceil' || why === 'side') audio.bonk();
    else audio.miss();
    ripple(x, y, 'm', 44);
    emit(22, {
      x: x, y: y, j: 6,
      vx0: -180, vx1: 180, vy0: -220, vy1: 40,
      life: 0.48, r0: 1.2, r1: 3.8, col: 'm'
    });
    if (G.mode === 'clear' || G.mode === 'win') return;
    missLife(why);
  }

  function missLife(why) {
    G.lives -= 1;
    G.lock = 0.55;
    G.comp = 0;
    G.vis = 0.08;
    G.visV = 0;
    hintEl.classList.remove('hot');
    hintEl.classList.add('warn');
    if (why === 'ceil') toast('撞梁', 'warn');
    else if (why === 'trap') toast('伪台', 'warn');
    else if (why === 'floor') toast('落地', 'warn');
    else if (why === 'side') toast('擦边', 'warn');
    else toast('偏了', 'warn');
    if (G.lives <= 0) {
      G.mode = 'lose';
      audio.lose();
      showOverlay('lose');
    }
  }

  function nextStage() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = 'win';
      G.flight = null;
      audio.win();
      showOverlay('win');
      return;
    }
    G.mode = 'play';
    hintEl.classList.remove('hot', 'warn');
    loadStage(G.stage + 1);
  }

  function topLand(prevY, f, pad, t) {
    if (f.vy < 36) return false;
    const px = padXAt(pad, t);
    const left = px - pad.w * 0.5;
    const right = px + pad.w * 0.5;
    const prevB = prevY + PUCK_R;
    const bot = f.y + PUCK_R;
    if (prevB > pad.y + 5) return false;
    if (bot < pad.y - 2) return false;
    if (f.x < left + 2 || f.x > right - 2) return false;
    return { x: clamp(f.x, left + PUCK_R * 0.35, right - PUCK_R * 0.35), y: pad.y - PUCK_R };
  }

  function updateFlight(dt) {
    const f = G.flight;
    if (!f) return;
    if (f.stuck) {
      const px = padXAt(G.pad, G.clock);
      f.x = lerp(f.x, px, 1 - Math.pow(0.001, dt));
      f.y = G.pad.y - PUCK_R;
      f.squish = lerp(f.squish, 1, 8 * dt);
      return;
    }
    const prevY = f.y;
    f.vx += windAt(G.clock, G.spec) * dt;
    f.vy += GRAV * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.age += dt;
    f.squish = lerp(f.squish, 1, 7 * dt);
    f.trail.push({ x: f.x, y: f.y });
    if (f.trail.length > 18) f.trail.shift();

    if (G.ceil && hitsRect(f.x, f.y, PUCK_R, G.ceil.x, G.ceil.y, G.ceil.w, G.ceil.h)) {
      shatterAt(f.x, f.y, 'ceil');
      return;
    }

    const land = topLand(prevY, f, G.pad, G.clock);
    if (land) {
      const perfect = Math.abs(f.shot - G.spec.target) <= G.spec.band * 0.38;
      succeed(land.x, land.y, perfect);
      return;
    }

    for (let i = 0; i < G.decoys.length; i++) {
      const d = G.decoys[i];
      const trap = topLand(prevY, f, d, G.clock);
      if (trap) {
        shatterAt(trap.x, trap.y, 'trap');
        return;
      }
      const dx = padXAt(d, G.clock) - d.w * 0.5;
      if (hitsRect(f.x, f.y, PUCK_R * 0.9, dx, d.y, d.w, d.h + 6)) {
        shatterAt(f.x, f.y, 'trap');
        return;
      }
    }

    const gx = padXAt(G.pad, G.clock) - G.pad.w * 0.5;
    if (hitsRect(f.x, f.y, PUCK_R * 0.92, gx, G.pad.y + 3, G.pad.w, G.pad.h + 8)) {
      shatterAt(f.x, f.y, 'side');
      return;
    }

    if (f.y + PUCK_R > FLOOR_Y) {
      shatterAt(f.x, FLOOR_Y, 'floor');
      return;
    }
    if (f.x < -40 || f.x > WORLD_W + 46 || f.y < -56) {
      shatterAt(f.x, f.y, 'out');
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.6;
      r.r += (r.max - r.r) * 6 * dt;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    G.shake = Math.max(0, G.shake - dt * 16);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
  }

  function updateSpring(dt) {
    if (G.flight) {
      G.visV += (-G.vis * 92 - 7.2 * G.visV) * dt;
      G.vis += G.visV * dt;
    } else if (G.charging || keys.space || pointer.down || keys.d || keys.u) {
      G.vis = G.comp;
      G.visV = 0;
    } else {
      G.visV += ((G.comp - G.vis) * 140 - 10 * G.visV) * dt;
      G.vis += G.visV * dt;
    }
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;

    if (isPlayInput()) {
      let rate = CHARGE_RATE;
      if (G.stage < 3 && inBand(G.comp)) rate *= 0.32;
      if (keys.space) {
        G.spaceT += dt;
        G.comp = clamp(G.comp + rate * dt, 0, 1);
      }
      if (pointer.down && pointer.mode === 'drag' && pointer.moved < 10) {
        G.comp = clamp(G.comp + rate * dt, 0, 1);
      }
      if (keys.d && !keys.space) G.comp = clamp(G.comp + NUDGE_RATE * dt, 0, 1);
      if (keys.u) G.comp = clamp(G.comp - NUDGE_RATE * dt, 0, 1);
    }

    if (G.charging && isPlayInput() && G.comp > 0.55 && Math.random() < 0.18) {
      const top = capTop(G.vis);
      emit(1, {
        x: SX, y: lerp(top, BASE_Y, rand(0.2, 0.8)), j: 18,
        vx0: -30, vx1: 30, vy0: -40, vy1: 10,
        life: 0.28, r0: 0.8, r1: 2.2, col: inBand(G.comp) ? 'g' : 'm'
      });
    }

    if (G.flight) updateFlight(dt);
    updateSpring(dt);

    if (G.mode === 'clear') {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
  }

  function updateTitle(dt) {
    G.clock += dt;
    G.comp = 0.2 + Math.sin(G.t * 1.15) * 0.1 + 0.04;
    G.spec = STAGES[0];
    if (!G.pad) {
      const land = simulateLand(G.spec.target, G.spec.padY, 0, G.spec);
      G.pad = clonePad(G.spec, land);
    }
    updateSpring(dt);
  }

  function predict() {
    const dots = [];
    const out = { dots: dots, land: null, ghostX: 0, ok: false, t: 0 };
    if (G.flight || G.mode === 'lose' || G.mode === 'win') return out;
    const p = launchState(G.comp);
    let x = p.x;
    let y = p.y;
    let vx = p.vx;
    let vy = p.vy;
    const dt = 0.034;
    const t0 = G.clock;
    const pad = G.pad;
    for (let i = 0; i < 64; i++) {
      const t = t0 + (i + 1) * dt;
      vx += windAt(t, G.spec) * dt;
      vy += GRAV * dt;
      x += vx * dt;
      y += vy * dt;
      if (i % 2 === 0) dots.push({ x: x, y: y, a: 1 - i / 64 });
      if (!out.land && pad && vy > 28 && y + PUCK_R >= pad.y) {
        const gx = padXAt(pad, t);
        const ok = x > gx - pad.w * 0.5 + 2 && x < gx + pad.w * 0.5 - 2;
        out.land = { x: x, y: pad.y - PUCK_R };
        out.ghostX = gx;
        out.ok = ok;
        out.t = t;
      }
      if (G.ceil && hitsRect(x, y, PUCK_R, G.ceil.x, G.ceil.y, G.ceil.w, G.ceil.h)) {
        out.hitCeil = { x: x, y: y };
        break;
      }
      if (y > FLOOR_Y) break;
    }
    return out;
  }

  function bandState() {
    const s = G.spec;
    const d = G.comp - s.target;
    if (Math.abs(d) <= s.band * 0.38) return 'hot';
    if (Math.abs(d) <= s.band) return 'ok';
    if (d > 0) return 'over';
    return 'under';
  }

  function syncHud(force) {
    const bs = bandState();
    const key = G.mode + ':' + G.stage + ':' + G.lives + ':' + (G.comp * 40 | 0) + ':' + bs + ':' + (G.flight ? 1 : 0);
    if (!force && key === G.hud) return;
    G.hud = key;
    const s = G.spec || STAGES[0];
    if (G.mode === 'title') {
      stageLabel.textContent = '压簧';
      powerLabel.textContent = 'SPRING';
      powerLabel.classList.remove('warn', 'hot');
      fillNum.textContent = '—';
    } else {
      stageLabel.textContent = '关卡 ' + (G.stage + 1) + '/' + STAGES.length + ' · ' + s.name + ' ' + s.sub;
      stageLabel.classList.toggle('hot', G.mode === 'clear');
      if (G.flight) {
        powerLabel.textContent = G.flight.stuck ? '落台' : '飞行';
        powerLabel.classList.remove('warn', 'hot');
      } else if (bs === 'hot') {
        powerLabel.textContent = '正中光带';
        powerLabel.classList.add('hot');
        powerLabel.classList.remove('warn');
      } else if (bs === 'ok') {
        powerLabel.textContent = '到位';
        powerLabel.classList.add('hot');
        powerLabel.classList.remove('warn');
      } else if (bs === 'over') {
        powerLabel.textContent = '过高';
        powerLabel.classList.add('warn');
        powerLabel.classList.remove('hot');
      } else {
        powerLabel.textContent = '偏低';
        powerLabel.classList.remove('warn', 'hot');
      }
      fillNum.textContent = Math.round(G.comp * 100) + '%';
    }
    fillBar.style.transform = 'scaleX(' + clamp(G.comp, 0, 1) + ')';
    const t0 = clamp(s.target - s.band, 0, 1);
    fillBand.style.left = (t0 * 100) + '%';
    fillBand.style.width = (s.band * 2 * 100) + '%';
    fillMark.style.left = (s.target * 100) + '%';
    fillWrap.classList.toggle('hot', bs === 'hot' || bs === 'ok');
    fillWrap.classList.toggle('warn', bs === 'over' && !G.flight);
    let html = '';
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 ? ' on warn' : ' on') : '') + '"></i>';
    }
    pipsEl.innerHTML = html;
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function glowDot(x, y, r, col, a) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = r * 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function colOf(c) {
    if (c === 'm') return '#ff3db8';
    if (c === 'g') return '#ffe36b';
    return '#00f0ff';
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.045)';
    ctx.lineWidth = 1;
    for (let x = 40; x < WORLD_W; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 18);
      ctx.lineTo(x, FLOOR_Y - 10);
      ctx.stroke();
    }
    for (let y = 28; y < FLOOR_Y; y += 48) {
      ctx.beginPath();
      ctx.moveTo(24, y);
      ctx.lineTo(WORLD_W - 24, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFloor() {
    const g = ctx.createLinearGradient(0, 455, 0, WORLD_H);
    g.addColorStop(0, 'rgba(5, 3, 12, 0)');
    g.addColorStop(0.5, 'rgba(255, 61, 184, 0.05)');
    g.addColorStop(1, 'rgba(0, 240, 255, 0.08)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 455, WORLD_W, WORLD_H - 455);
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(36, FLOOR_Y);
    ctx.lineTo(WORLD_W - 36, FLOOR_Y);
    ctx.stroke();
    ctx.restore();
  }

  function drawRuler(vis) {
    const x = SX - 58;
    const y0 = REST_TOP;
    const y1 = REST_TOP + COMP_PX;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    const s = G.spec;
    const by0 = capTop(s.target - s.band);
    const by1 = capTop(s.target + s.band);
    const hot = inBand(G.comp) && !G.flight;
    ctx.fillStyle = hot ? 'rgba(255, 227, 107, 0.22)' : 'rgba(255, 61, 184, 0.2)';
    ctx.fillRect(x - 7, by0, 14, by1 - by0);
    ctx.strokeStyle = hot ? '#ffe36b' : '#ff3db8';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = hot ? 16 : 10;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(x - 7, by0, 14, Math.max(4, by1 - by0));
    const ty = capTop(s.target);
    ctx.beginPath();
    ctx.moveTo(x - 11, ty);
    ctx.lineTo(x + 11, ty);
    ctx.stroke();
    const iy = capTop(vis);
    ctx.shadowBlur = 0;
    ctx.fillStyle = hot ? '#ffe36b' : '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(x + 14, iy);
    ctx.lineTo(x + 22, iy - 5);
    ctx.lineTo(x + 22, iy + 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCoil(vis, energy) {
    const top = capTop(vis);
    const base = BASE_Y - 8;
    const turns = 8;
    const n = turns * 26;
    const r = 27;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(SX, top + 8);
    ctx.lineTo(SX, base - 6);
    ctx.stroke();
    let px = SX;
    let py = top + 10;
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      const a = u * turns * TAU;
      const y = top + 12 + (base - 18 - top - 12) * u;
      const cz = Math.sin(a);
      const x = SX + Math.cos(a) * r;
      const hot = energy > 0.02;
      const col = cz > 0.15
        ? (hot ? 'rgba(255,61,184,' + (0.55 + energy * 0.4) + ')' : 'rgba(0,240,255,0.7)')
        : (hot ? 'rgba(255,120,200,' + (0.28 + energy * 0.25) + ')' : 'rgba(0,180,200,0.32)');
      ctx.strokeStyle = col;
      ctx.shadowColor = hot ? '#ff3db8' : '#00f0ff';
      ctx.shadowBlur = hot ? 8 + energy * 10 : 4;
      ctx.lineWidth = 2.1 + cz * 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(x, y);
      ctx.stroke();
      px = x;
      py = y;
    }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = '#12081c';
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.45)';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = '#ff3db8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(SX, base - 2, 38, 8, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    roundRect(SX - 44, base - 4, 88, 12, 5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    const capCol = inBand(G.comp) && !G.flight ? '#ffe36b' : '#00f0ff';
    ctx.fillStyle = '#141022';
    ctx.strokeStyle = capCol;
    ctx.shadowColor = capCol;
    ctx.shadowBlur = 14 + energy * 10;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(SX, top + 2, 24, 7, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(SX, top - 4, 22, 6.2, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (energy > 0.08) {
      const mid = (top + base) * 0.5;
      const rad = ctx.createRadialGradient(SX, mid, 4, SX, mid, 70);
      rad.addColorStop(0, 'rgba(255,61,184,' + (0.08 + energy * 0.16) + ')');
      rad.addColorStop(1, 'rgba(255,61,184,0)');
      ctx.fillStyle = rad;
      ctx.fillRect(SX - 70, top - 10, 140, base - top + 20);
    }
  }

  function drawPuck(o, flying, squish) {
    const sq = squish || 1;
    const pulse = 0.85 + 0.15 * Math.sin(G.t * 8);
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.scale(1 / sq, sq);
    glowDot(0, 0, flying ? 7.4 : 6.6, inBand(G.comp) && !flying ? '#ffe36b' : '#00f0ff', 0.95);
    ctx.fillStyle = '#e8ffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(-2.2, -2.4, 2.4 * pulse, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#ff3db8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, PUCK_R + 0.6, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawPad(pad, t, ghost, predOk) {
    const x = ghost ? pad._gx : padXAt(pad, t);
    const y = pad.y;
    const w = pad.w;
    const h = pad.h;
    const col = pad.gold ? (predOk ? '#ffe36b' : '#00f0ff') : '#ff3db8';
    ctx.save();
    ctx.globalAlpha = ghost ? 0.38 : 1;
    ctx.fillStyle = 'rgba(8, 6, 22, 0.92)';
    ctx.strokeStyle = col;
    ctx.shadowColor = col;
    ctx.shadowBlur = ghost ? 8 : 16;
    ctx.lineWidth = 2;
    roundRect(x - w / 2, y, w, h, 5);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = col;
    ctx.globalAlpha = ghost ? 0.2 : 0.28;
    ctx.fillRect(x - w / 2 + 4, y + 3, w - 8, 3);
    ctx.globalAlpha = ghost ? 0.25 : 0.55;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.28, y + h);
    ctx.lineTo(x - w * 0.22, FLOOR_Y - 2);
    ctx.moveTo(x + w * 0.28, y + h);
    ctx.lineTo(x + w * 0.22, FLOOR_Y - 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawCeil() {
    if (!G.ceil) return;
    const c = G.ceil;
    ctx.save();
    ctx.fillStyle = 'rgba(24, 6, 18, 0.9)';
    ctx.strokeStyle = '#ff3db8';
    ctx.shadowColor = '#ff3db8';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2;
    roundRect(c.x, c.y, c.w, c.h, 4);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 61, 184, 0.7)';
    ctx.lineWidth = 1.2;
    for (let x = c.x + 8; x < c.x + c.w - 4; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, c.y + c.h);
      ctx.lineTo(x + 4, c.y + c.h + 8);
      ctx.lineTo(x + 8, c.y + c.h);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWind() {
    const a = Math.abs(windAt(G.clock, G.spec));
    if (a < 8) return;
    const dir = windAt(G.clock, G.spec) < 0 ? -1 : 1;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 7; i++) {
      const x = 320 + (i * 80 + G.t * 50 * dir) % 560;
      const y = 90 + (i % 3) * 46 + Math.sin(G.t * 1.4 + i) * 8;
      ctx.globalAlpha = 0.18 + (a / 140) * 0.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + dir * 22, y);
      ctx.moveTo(x + dir * 14, y - 5);
      ctx.lineTo(x + dir * 22, y);
      ctx.lineTo(x + dir * 14, y + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAim(pred) {
    if (G.flight || G.mode === 'win' || G.mode === 'lose') return;
    const dots = pred.dots;
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      glowDot(d.x, d.y, 1.5 + (i % 3 === 0 ? 1 : 0), pred.ok ? '#ffe36b' : '#00f0ff', 0.14 + d.a * 0.42);
    }
    if (G.pad && pred.land && G.spec.move) {
      const ghost = { cx: pred.ghostX, y: G.pad.y, w: G.pad.w, h: G.pad.h, gold: true, move: null, _gx: pred.ghostX };
      drawPad(ghost, G.clock, true, pred.ok);
    }
    if (pred.hitCeil) {
      glowDot(pred.hitCeil.x, pred.hitCeil.y, 5, '#ff3db8', 0.55);
    }
  }

  function drawWorld() {
    const grd = ctx.createRadialGradient(SX, 420, 20, WORLD_W * 0.58, WORLD_H * 0.28, 640);
    grd.addColorStop(0, '#0a0618');
    grd.addColorStop(1, '#05030c');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb = ctx.createRadialGradient(110, 40, 10, 110, 40, 360);
    neb.addColorStop(0, 'rgba(255, 61, 184, 0.14)');
    neb.addColorStop(1, 'rgba(255, 61, 184, 0)');
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb2 = ctx.createRadialGradient(820, 70, 10, 820, 70, 360);
    neb2.addColorStop(0, 'rgba(0, 240, 255, 0.1)');
    neb2.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    drawGrid();
    drawFloor();
    drawWind();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.t * m.s + m.p));
      glowDot(m.x, (m.y + G.t * 6 * m.s) % WORLD_H, m.r, i % 3 === 0 ? '#ff3db8' : '#00f0ff', a);
    }

    const pred = (G.mode === 'play' || G.mode === 'title') && !G.flight ? predict() : { dots: [], land: null, ok: false };
    drawAim(pred);

    drawCeil();
    for (let i = 0; i < G.decoys.length; i++) drawPad(G.decoys[i], G.clock, false, false);
    if (G.pad) drawPad(G.pad, G.clock, false, pred.ok && !G.flight);

    const vis = clamp(G.vis, -0.2, 1.15);
    drawRuler(clamp(G.flight ? 0 : G.comp, 0, 1));
    drawCoil(vis, G.flight ? 0 : G.comp);

    if (G.flight && G.flight.trail) {
      for (let i = 0; i < G.flight.trail.length; i++) {
        const tr = G.flight.trail[i];
        glowDot(tr.x, tr.y, 2.2, '#00f0ff', (i / G.flight.trail.length) * 0.45);
      }
    }

    if (G.flight) drawPuck(G.flight, true, G.flight.squish);
    else if (G.mode !== 'lose') drawPuck(puckOnCap(vis), false, 1 + G.comp * 0.18);

    for (let i = 0; i < ripples.length; i++) {
      const r = ripples[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, r.t) * 0.7;
      ctx.strokeStyle = colOf(r.col);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      glowDot(p.x, p.y, p.r * (p.life / p.max), colOf(p.col), Math.max(0, p.life / p.max));
    }
  }

  function draw() {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = '#03010a';
    ctx.fillRect(0, 0, view.w, view.h);

    const shx = G.shake ? rand(-G.shake, G.shake) : 0;
    const shy = G.shake ? rand(-G.shake, G.shake) : 0;

    ctx.save();
    ctx.beginPath();
    const rw = WORLD_W * view.scale;
    const rh = WORLD_H * view.scale;
    roundRect(view.ox, view.oy, rw, rh, 14);
    ctx.clip();
    ctx.translate(view.ox + shx, view.oy + shy);
    ctx.scale(view.scale, view.scale);
    drawWorld();
    ctx.restore();

    if (G.flash > 0) {
      ctx.save();
      ctx.globalAlpha = G.flash * 0.26;
      ctx.fillStyle = G.flashCol;
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.restore();
    }
  }

  function resize() {
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    view.w = Math.max(1, rect.width);
    view.h = Math.max(1, rect.height);
    canvas.width = Math.max(1, (view.w * view.dpr) | 0);
    canvas.height = Math.max(1, (view.h * view.dpr) | 0);
    canvas.style.width = view.w + 'px';
    canvas.style.height = view.h + 'px';
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    view.scale = Math.min(view.w / WORLD_W, view.h / WORLD_H);
    view.ox = (view.w - WORLD_W * view.scale) * 0.5;
    view.oy = (view.h - WORLD_H * view.scale) * 0.5;
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - view.ox) / view.scale,
      y: (e.clientY - rect.top - view.oy) / view.scale
    };
  }

  let last = 0;
  let acc = 0;
  function loop(now) {
    const t = now * 0.001;
    let dt = t - (last || t);
    last = t;
    if (dt > 0.08) dt = 0.08;
    G.t = t;
    if (!G.paused) {
      acc += dt;
      if (acc > 0.12) acc = 0.12;
      while (acc >= STEP) {
        if (G.mode === 'title') updateTitle(STEP);
        else if (G.mode === 'play' || G.mode === 'clear') updatePlay(STEP);
        updateFx(STEP);
        acc -= STEP;
      }
      const charging = (G.charging || keys.space || keys.d) && !G.flight && G.mode === 'play';
      audio.tickDrone(G.mode === 'play' || G.mode === 'clear', G.comp, charging);
      syncHud(false);
    }
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', function (e) {
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Space') {
      e.preventDefault();
    }
    if (e.code === 'KeyM') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (e.code === 'KeyR') {
      e.preventDefault();
      retry();
      return;
    }
    if (e.code === 'Escape' && (G.charging || keys.space)) {
      G.charging = false;
      keys.space = false;
      pointer.down = false;
      canvas.classList.remove('press');
      G.comp = 0;
      return;
    }
    if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onMain();
      }
      return;
    }
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.u = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.d = true;
    if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
      e.preventDefault();
      audio.ensure();
      if (e.code === 'Enter') {
        if (isPlayInput()) tryFire();
      } else {
        if (isPlayInput()) {
          keys.space = true;
          G.spaceT = 0;
          G.charging = true;
          canvas.classList.add('press');
        }
      }
    }
  });

  window.addEventListener('keyup', function (e) {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.u = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.d = false;
    if (e.code === 'Space') {
      const held = keys.space;
      keys.space = false;
      canvas.classList.remove('press');
      if (held && G.mode === 'play' && !G.flight) {
        G.charging = false;
        tryFire();
      }
    }
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (G.mode !== 'play') return;
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    beginCharge(w.x, w.y);
  });

  canvas.addEventListener('pointermove', function (e) {
    const w = worldFromEvent(e);
    if (!pointer.down || e.pointerId !== pointer.id) {
      pointer.x = w.x;
      pointer.y = w.y;
      return;
    }
    moveCharge(w.x, w.y);
    pointer.x = w.x;
    pointer.y = w.y;
  });

  canvas.addEventListener('pointerup', function (e) {
    if (e.pointerId !== pointer.id && pointer.id !== null) return;
    pointer.down = false;
    pointer.id = null;
    endCharge();
  });

  canvas.addEventListener('pointercancel', function () {
    pointer.down = false;
    pointer.id = null;
    G.charging = false;
    canvas.classList.remove('press');
  });

  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  ovBtn.addEventListener('click', function () {
    audio.ensure();
    onMain();
  });
  btnMute.addEventListener('click', function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener('click', function () {
    retry();
  });

  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    if (!document.hidden) {
      last = performance.now() * 0.001;
      acc = 0;
    }
  });

  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);

  makeMotes();
  resize();
  showOverlay('title');
  syncHud(true);
  audio.setMuted(audio.muted);
  requestAnimationFrame(loop);
})();
