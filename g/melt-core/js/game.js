'use strict';

(function () {
  const DURATION = 45;
  const TAP_HOLD = 0.12;
  const INPUT_LOCK = 0.22;

  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d', { alpha: false });
  const hud = document.getElementById('hud');
  const hintEl = document.getElementById('hint');
  const timeEl = document.getElementById('time');
  const stabEl = document.getElementById('stab');
  const panel = document.getElementById('panel');
  const card = document.getElementById('card');
  const kickerEl = document.getElementById('panel-kicker');
  const titleEl = document.getElementById('panel-title');
  const leadEl = document.getElementById('panel-lead');
  const metaEl = document.getElementById('panel-meta');
  const footEl = document.getElementById('panel-foot');
  const btnMain = document.getElementById('btn-main');
  const btnMute = document.getElementById('btn-mute');
  const btnRetry = document.getElementById('btn-retry');

  let W = 1;
  let H = 1;
  let dpr = 1;
  const layout = {
    cx: 0,
    cy: 0,
    coreR: 80,
    gx: 0,
    gy0: 0,
    gy1: 0,
    gw: 22
  };

  const stars = [];
  const particles = [];
  const ripples = [];
  let cracks = [];

  const input = {
    pointer: false,
    key: false,
    pointerId: null,
    down() {
      return this.pointer || this.key;
    }
  };

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    alarmAt: -1,
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.22;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMuted(m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.22;
      btnMute.textContent = m ? '静' : '音';
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
    },
    beep(freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(Math.max(0.0001, vol), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    pulse(kind) {
      this.ensure();
      if (kind === 'cool') {
        this.beep(720, 0.09, 'triangle', 0.09, 280);
        this.beep(180, 0.12, 'sine', 0.05, 90);
      } else if (kind === 'heat') {
        this.beep(110, 0.18, 'sawtooth', 0.045, 220);
      } else if (kind === 'warn') {
        this.beep(240, 0.12, 'square', 0.04, 160);
      } else if (kind === 'win') {
        this.beep(440, 0.2, 'triangle', 0.1, 880);
        this.beep(660, 0.35, 'sine', 0.07, 1320);
      } else if (kind === 'lose') {
        this.beep(180, 0.5, 'sawtooth', 0.1, 50);
        this.beep(90, 0.7, 'square', 0.06, 40);
      } else if (kind === 'start') {
        this.beep(220, 0.16, 'sine', 0.07, 440);
      }
    },
    tickDrone(temp, out, heating) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 70;
        g.gain.value = 0.03;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      const f = 62 + temp * 1.35 + (heating ? 18 : 0);
      this.drone.frequency.setTargetAtTime(f, t, 0.08);
      const vol = out ? 0.055 : 0.025;
      this.droneGain.gain.setTargetAtTime(vol, t, 0.1);
    },
    stopDrone() {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
    }
  };

  const G = {
    mode: 'title',
    t: 0,
    remain: DURATION,
    temp: 50,
    vel: 0,
    stab: 0,
    crack: 0,
    heating: false,
    pressT: 0,
    wasDown: false,
    lock: 0,
    inBand: true,
    band: { lo: 35, hi: 65, c: 50, w: 30 },
    shake: 0,
    flash: 0,
    coolFlash: 0,
    heatGlow: 0,
    seed: 1,
    paused: false,
    result: '',
    clock: 0
  };

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function mix(a, b, t) {
    return a + (b - a) * t;
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function rng(seed) {
    let s = seed % 2147483646;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function makeStars() {
    stars.length = 0;
    const n = 70;
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.45 + 0.08,
        p: Math.random() * Math.PI * 2
      });
    }
  }

  function makeCracks(seed) {
    const r = rng(seed);
    cracks = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + r() * 0.5;
      const pts = [];
      let a = ang;
      let rad = 8;
      pts.push({ a: a, r: rad });
      const steps = 5 + (r() * 3) | 0;
      for (let k = 0; k < steps; k++) {
        a += (r() - 0.5) * 0.55;
        rad += 10 + r() * 12;
        pts.push({ a: a, r: rad });
        if (r() > 0.55) {
          pts.push({
            a: a + (r() - 0.5) * 0.9,
            r: rad * (0.55 + r() * 0.3),
            branch: true
          });
          pts.push({ a: a, r: rad });
        }
      }
      cracks.push({ pts: pts, th: 0.12 + i * 0.12 });
    }
  }

  function bandAt(t) {
    const u = smooth(t / DURATION);
    const w = mix(32, 14, u);
    let c =
      50 +
      Math.sin(t * 0.52) * mix(10, 18, u) +
      Math.sin(t * 1.13 + 0.7) * mix(4, 11, u) +
      Math.sin(t * 1.82 + 2.2) * mix(0, 6, Math.max(0, (t - 16) / 18)) +
      Math.sin(t * 0.19 + 1.1) * 5;
    const half = w / 2;
    if (c - half < 5) c = 5 + half;
    if (c + half > 95) c = 95 - half;
    return { lo: c - half, hi: c + half, c: c, w: w };
  }

  function tempColor(temp, a) {
    const t = clamp(temp / 100, 0, 1);
    let r;
    let g;
    let b;
    if (t < 0.5) {
      const u = t * 2;
      r = mix(0, 255, u);
      g = mix(240, 61, u);
      b = mix(255, 184, u);
    } else {
      const u = (t - 0.5) * 2;
      r = mix(255, 255, u);
      g = mix(61, 224, u);
      b = mix(184, 150, u);
    }
    if (a == null) return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
    return 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + a + ')';
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 96) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        hue: spec.hue,
        g: spec.g || 0
      });
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.max(1, (W * dpr) | 0);
    canvas.height = Math.max(1, (H * dpr) | 0);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const m = Math.min(W, H);
    layout.cx = W * (W < 720 ? 0.4 : 0.44);
    layout.cy = H * 0.54;
    layout.coreR = m * (W < 720 ? 0.155 : 0.175);
    layout.gx = W * (W < 400 ? 0.78 : 0.8);
    layout.gy0 = Math.max(H * 0.2, 88);
    layout.gy1 = Math.min(H * 0.8, H - 58);
    layout.gw = Math.max(16, m * 0.028);
  }

  function resetRun() {
    G.t = 0;
    G.remain = DURATION;
    G.temp = 50;
    G.vel = 0;
    G.stab = 0;
    G.crack = 0;
    G.heating = false;
    G.pressT = 0;
    G.wasDown = false;
    G.lock = INPUT_LOCK;
    G.inBand = true;
    G.band = bandAt(0);
    G.shake = 0;
    G.flash = 0;
    G.coolFlash = 0;
    G.heatGlow = 0;
    G.seed = (Math.random() * 1e9) | 0;
    G.result = '';
    G.clock = 0;
    audio.alarmAt = -1;
    particles.length = 0;
    ripples.length = 0;
    makeCracks(G.seed);
    input.pointer = false;
    input.key = false;
    input.pointerId = null;
  }

  function showPanel(kind) {
    panel.classList.remove('hidden');
    card.classList.remove('win', 'lose');
    if (kind === 'title') {
      kickerEl.textContent = 'MELT CORE';
      titleEl.textContent = '熔核';
      leadEl.innerHTML = '轻点降温，按住升温。<br />把核温留在游走的安全带里。';
      metaEl.textContent = '撑过 45 秒，或把稳定槽加满。偏出则裂。';
      btnMain.textContent = '启动堆芯';
      footEl.textContent = '空格 / 点击 · M 静音';
    } else if (kind === 'win') {
      card.classList.add('win');
      kickerEl.textContent = 'STABLE';
      titleEl.textContent = G.result === 'stab' ? '堆芯锁定' : '撑过熔变';
      leadEl.textContent =
        G.result === 'stab' ? '安全带被你捂稳了。核温锁在带内。' : '四十五秒，堆芯没有崩。';
      metaEl.textContent =
        '用时 ' +
        (DURATION - G.remain).toFixed(1) +
        ' 秒 · 稳定 ' +
        Math.round(G.stab) +
        '% · 裂痕 ' +
        Math.round(G.crack) +
        '%';
      btnMain.textContent = '再来一局';
      footEl.textContent = '空格 / 回车 · R 重开';
    } else {
      card.classList.add('lose');
      kickerEl.textContent = 'MELT';
      titleEl.textContent = '堆芯崩裂';
      leadEl.textContent = '温度偏离安全带，裂痕吞掉了核。';
      metaEl.textContent =
        '存活 ' + G.t.toFixed(1) + ' 秒 · 稳定 ' + Math.round(G.stab) + '%';
      btnMain.textContent = '再来一局';
      footEl.textContent = '空格 / 回车 · R 重开';
    }
  }

  function startPlay() {
    audio.ensure();
    audio.pulse('start');
    resetRun();
    G.mode = 'play';
    panel.classList.add('hidden');
    hud.classList.remove('hidden');
    hintEl.textContent = '轻点降温 · 按住升温';
    hintEl.className = 'hint';
    syncHud();
  }

  function endGame(win, why) {
    if (G.mode !== 'play') return;
    G.mode = win ? 'win' : 'lose';
    G.result = why;
    G.heating = false;
    input.pointer = false;
    input.key = false;
    hud.classList.add('hidden');
    if (win) {
      audio.pulse('win');
      emit(28, {
        x: layout.cx,
        y: layout.cy,
        j: 12,
        vx0: -80,
        vx1: 80,
        vy0: -90,
        vy1: 40,
        life: 0.9,
        r0: 2,
        r1: 5,
        hue: 'cyan'
      });
    } else {
      audio.pulse('lose');
      G.flash = 1;
      G.shake = 10;
      emit(42, {
        x: layout.cx,
        y: layout.cy,
        j: 8,
        vx0: -180,
        vx1: 180,
        vy0: -160,
        vy1: 120,
        life: 1.1,
        r0: 2,
        r1: 6,
        hue: 'pink'
      });
    }
    audio.stopDrone();
    showPanel(G.mode);
  }

  function coolPulse() {
    G.vel -= 23;
    G.temp -= 4.2;
    G.coolFlash = 1;
    G.heatGlow *= 0.3;
    ripples.push({ r: layout.coreR * 0.7, a: 0.9, cool: true });
    emit(10, {
      x: layout.cx,
      y: layout.cy,
      j: layout.coreR * 0.35,
      vx0: -30,
      vx1: 30,
      vy0: 20,
      vy1: 90,
      life: 0.55,
      r0: 1.4,
      r1: 3.2,
      hue: 'cyan'
    });
    audio.pulse('cool');
  }

  function handleActuator(dt) {
    const down = G.lock > 0 ? false : input.down();
    if (down && !G.wasDown) {
      G.pressT = 0;
      G.heating = false;
    }
    if (down) {
      G.pressT += dt;
      if (!G.heating && G.pressT >= TAP_HOLD) {
        G.heating = true;
        audio.pulse('heat');
        ripples.push({ r: layout.coreR * 0.55, a: 0.75, cool: false });
      }
    } else if (G.wasDown) {
      if (!G.heating) coolPulse();
      G.heating = false;
      G.pressT = 0;
    }
    G.wasDown = down;
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    handleActuator(dt);

    G.t += dt;
    G.remain = Math.max(0, DURATION - G.t);
    G.band = bandAt(G.t);

    const wander =
      Math.sin(G.t * 0.73 + 0.4) * 7 +
      Math.sin(G.t * 1.67) * 5 +
      4.2 +
      G.t * 0.08;
    let acc = wander;
    if (G.heating) acc += 74;

    G.vel += acc * dt;
    G.vel -= G.vel * 2.85 * dt;
    G.temp += G.vel * dt;
    if (G.heating) G.temp += 17 * dt;
    G.temp = clamp(G.temp, 0, 100);
    if (G.temp <= 0 || G.temp >= 100) G.vel *= 0.35;

    const b = G.band;
    const inBand = G.temp >= b.lo && G.temp <= b.hi;
    G.inBand = inBand;

    if (inBand) {
      const mid = 1 - Math.abs(G.temp - b.c) / (b.w * 0.5);
      const rate = 3.35 + 1.55 * clamp(mid, 0, 1);
      G.stab = Math.min(100, G.stab + rate * dt);
      G.crack = Math.max(0, G.crack - 5.4 * dt);
      G.shake *= Math.pow(0.04, dt);
    } else {
      const dist = G.temp < b.lo ? b.lo - G.temp : G.temp - b.hi;
      const rate = 7.2 + dist * 0.62;
      if (G.t > 0.85) G.crack = Math.min(100, G.crack + rate * dt);
      G.shake = Math.min(7, 1.6 + dist * 0.12 + G.crack * 0.03);
      if (G.t - audio.alarmAt > 0.38) {
        audio.alarmAt = G.t;
        audio.pulse('warn');
      }
    }

    if (G.heating) {
      G.heatGlow = Math.min(1, G.heatGlow + dt * 4);
      if (Math.random() < 0.55) {
        emit(1, {
          x: layout.cx,
          y: layout.cy,
          j: layout.coreR * 0.4,
          vx0: -20,
          vx1: 20,
          vy0: -110,
          vy1: -30,
          life: 0.7,
          r0: 1.2,
          r1: 3,
          hue: 'pink'
        });
      }
    } else {
      G.heatGlow = Math.max(0, G.heatGlow - dt * 3);
    }

    G.coolFlash = Math.max(0, G.coolFlash - dt * 3.2);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    audio.tickDrone(G.temp, !inBand, G.heating);

    if (G.stab >= 100) {
      G.stab = 100;
      endGame(true, 'stab');
      return;
    }
    if (G.remain <= 0) {
      G.remain = 0;
      endGame(true, 'time');
      return;
    }
    if (G.crack >= 100) {
      G.crack = 100;
      endGame(false, 'crack');
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      if (p.hue === 'pink') p.vy -= 40 * dt;
      if (p.hue === 'cyan') p.vy += 50 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += dt * 160;
      r.a -= dt * 1.6;
      if (r.a <= 0) ripples.splice(i, 1);
    }
    if (G.mode === 'title') {
      G.clock += dt;
      G.band = bandAt(G.clock * 0.55);
      G.temp = 50 + Math.sin(G.clock * 0.8) * 2.2;
    } else if (G.mode === 'win') {
      G.clock += dt;
      G.temp += (50 - G.temp) * (1 - Math.pow(0.08, dt));
      G.vel = 0;
      G.heatGlow *= 0.9;
    } else if (G.mode === 'lose') {
      G.clock += dt;
      G.shake = Math.max(0, G.shake - dt * 8);
      G.flash = Math.max(0, G.flash - dt * 1.2);
    }
  }

  function syncHud() {
    timeEl.textContent = G.remain.toFixed(1);
    stabEl.textContent = Math.round(G.stab) + '%';
    if (!G.inBand) {
      hintEl.textContent = '偏离安全带 · 裂痕 ' + Math.round(G.crack) + '%';
      hintEl.className = 'hint warn';
    } else if (G.heating) {
      hintEl.textContent = '升温中';
      hintEl.className = 'hint heat';
    } else if (G.coolFlash > 0.35) {
      hintEl.textContent = '降温';
      hintEl.className = 'hint cool';
    } else {
      hintEl.textContent = '轻点降温 · 按住升温';
      hintEl.className = 'hint';
    }
  }

  function gy(temp) {
    return mix(layout.gy1, layout.gy0, temp / 100);
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(-20, -20, W + 40, H + 40);
    const g1 = ctx.createRadialGradient(W * 0.18, H * 0.08, 0, W * 0.18, H * 0.08, W * 0.7);
    g1.addColorStop(0, 'rgba(255,61,184,0.16)');
    g1.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(W * 0.9, H * 0.92, 0, W * 0.9, H * 0.92, W * 0.65);
    g2.addColorStop(0, 'rgba(0,240,255,0.12)');
    g2.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.clock * 1.4 + s.p);
      ctx.fillStyle = 'rgba(246,243,255,' + s.a * tw + ')';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGauge() {
    const x = layout.gx;
    const y0 = layout.gy0;
    const y1 = layout.gy1;
    const w = layout.gw;
    const h = y1 - y0;

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    roundRect(x - w / 2 - 8, y0 - 16, w + 16, h + 32, 16);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(x - w / 2, y0, w, h, 10);
    ctx.fill();

    const liquidTop = gy(G.temp);
    const lg = ctx.createLinearGradient(0, y1, 0, y0);
    lg.addColorStop(0, '#00f0ff');
    lg.addColorStop(0.5, '#ff3db8');
    lg.addColorStop(1, '#ffe36b');
    ctx.fillStyle = lg;
    ctx.save();
    roundRect(x - w / 2 + 2, y0, w - 4, h, 8);
    ctx.clip();
    ctx.fillRect(x - w / 2 + 2, liquidTop, w - 4, y1 - liquidTop + 8);
    ctx.restore();

    const by0 = gy(G.band.hi);
    const by1 = gy(G.band.lo);
    const inB = G.mode !== 'play' ? true : G.inBand;
    ctx.save();
    ctx.shadowColor = inB ? '#00f0ff' : '#ff3db8';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = inB ? 'rgba(0,240,255,0.95)' : 'rgba(255,61,184,0.95)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x - w / 2 - 10, by0, w + 20, by1 - by0);
    ctx.fillStyle = inB ? 'rgba(0,240,255,0.1)' : 'rgba(255,61,184,0.16)';
    ctx.fillRect(x - w / 2 - 10, by0, w + 20, by1 - by0);
    ctx.fillStyle = inB ? '#00f0ff' : '#ff3db8';
    ctx.fillRect(x - w / 2 - 14, by0 - 2, w + 28, 4);
    ctx.fillRect(x - w / 2 - 14, by1 - 2, w + 28, 4);
    ctx.restore();

    const py = gy(G.temp);
    ctx.beginPath();
    ctx.moveTo(x + w / 2 + 8, py);
    ctx.lineTo(x + w / 2 + 20, py - 8);
    ctx.lineTo(x + w / 2 + 20, py + 8);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = tempColor(G.temp, 1);
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;

    const whisk = clamp(G.vel * 1.15, -42, 42);
    if (Math.abs(whisk) > 2 && G.mode === 'play') {
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 + 24, py);
      ctx.lineTo(x + w / 2 + 24, py - whisk);
      ctx.stroke();
    }

    ctx.fillStyle = '#9aa0c8';
    ctx.font = '11px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('热', x, y0 - 22);
    ctx.fillText('冷', x, y1 + 26);
    ctx.fillStyle = inB ? '#00f0ff' : '#ff3db8';
    ctx.font = 'bold 12px "Segoe UI","PingFang SC","Noto Sans SC",sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(inB ? '稳' : '偏', x - w / 2 - 12, py + 4);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, rr);
    else {
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    }
  }

  function drawCore() {
    const x = layout.cx;
    const y = layout.cy;
    const r = layout.coreR * (1 + G.heatGlow * 0.08 - G.coolFlash * 0.06);
    const col = tempColor(G.temp);

    ctx.save();
    const aura = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.6);
    aura.addColorStop(0, tempColor(G.temp, 0.45 + G.heatGlow * 0.2));
    aura.addColorStop(0.45, tempColor(G.temp, 0.12));
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.6, 0, Math.PI * 2);
    ctx.fill();

    const ringR = r * 1.42;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(x, y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    const stab = G.mode === 'play' || G.mode === 'win' ? G.stab : 0;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, y, ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (stab / 100));
    ctx.stroke();
    ctx.shadowBlur = 0;

    if (G.crack > 2 && G.mode !== 'title') {
      ctx.strokeStyle = 'rgba(255,61,184,0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        x,
        y,
        ringR + 10,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * (G.crack / 100)
      );
      ctx.stroke();
    }

    const spin = G.clock * 0.4;
    ctx.strokeStyle = 'rgba(0,240,255,0.22)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 10]);
    ctx.beginPath();
    ctx.arc(x, y, r * 1.18, spin, spin + Math.PI * 1.4);
    ctx.stroke();
    ctx.setLineDash([]);

    const inner = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r);
    inner.addColorStop(0, '#fff6e8');
    inner.addColorStop(0.28, col);
    inner.addColorStop(0.75, tempColor(Math.max(0, G.temp - 18), 1));
    inner.addColorStop(1, 'rgba(8,4,16,0.9)');
    ctx.fillStyle = inner;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.28, y - r * 0.32, r * 0.22, r * 0.12, -0.5, 0, Math.PI * 2);
    ctx.fill();

    const crackVis = G.mode === 'lose' ? 1 : G.crack / 100;
    if (crackVis > 0.04) {
      ctx.save();
      ctx.translate(x, y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let i = 0; i < cracks.length; i++) {
        const ck = cracks[i];
        if (crackVis < ck.th) continue;
        const vis = clamp((crackVis - ck.th) / 0.25, 0, 1);
        ctx.strokeStyle = 'rgba(8,2,12,' + (0.75 * vis) + ')';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        for (let k = 0; k < ck.pts.length; k++) {
          const p = ck.pts[k];
          const px = Math.cos(p.a) * Math.min(p.r, r * 0.98);
          const py = Math.sin(p.a) * Math.min(p.r, r * 0.98);
          if (k === 0 || p.branch) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,61,184,' + (0.55 * vis) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    for (let i = 0; i < ripples.length; i++) {
      const rp = ripples[i];
      ctx.strokeStyle = rp.cool
        ? 'rgba(0,240,255,' + rp.a + ')'
        : 'rgba(255,61,184,' + rp.a + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, rp.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.hue === 'cyan' ? 'rgba(0,240,255,' + a + ')' : 'rgba(255,61,184,' + a + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.4 + a), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function draw() {
    const shaking = G.shake && (G.mode === 'play' || G.mode === 'lose');
    const sx = shaking ? (Math.random() - 0.5) * G.shake : 0;
    const sy = shaking ? (Math.random() - 0.5) * G.shake : 0;
    ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);
    drawBg();
    drawCore();
    drawParticles();
    drawGauge();

    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(255,61,184,' + G.flash * 0.28 + ')';
      ctx.fillRect(-sx, -sy, W, H);
    }
    if (G.mode === 'play' && !G.inBand) {
      ctx.strokeStyle = 'rgba(255,61,184,' + (0.25 + 0.25 * Math.sin(G.clock * 8)) + ')';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, W - 8, H - 8);
    }
  }

  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    if (!G.paused) {
      if (G.mode === 'play') {
        G.clock += dt;
        updatePlay(dt);
        syncHud();
      }
      updateFx(dt);
    }
    draw();
    requestAnimationFrame(frame);
  }

  function isUi(el) {
    return !!(el && el.closest && el.closest('button'));
  }

  function onPointerDown(e) {
    if (isUi(e.target)) return;
    audio.ensure();
    if (G.mode !== 'play') {
      startPlay();
      e.preventDefault();
      return;
    }
    if (input.pointerId != null && input.pointerId !== e.pointerId) return;
    input.pointerId = e.pointerId;
    input.pointer = true;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    e.preventDefault();
  }

  function onPointerUp(e) {
    if (input.pointerId != null && e.pointerId !== input.pointerId) return;
    input.pointer = false;
    input.pointerId = null;
  }

  function onKeyDown(e) {
    const k = e.key;
    if (k === 'm' || k === 'M') {
      audio.ensure();
      audio.setMuted(!audio.muted);
      e.preventDefault();
      return;
    }
    if (k === 'r' || k === 'R') {
      if (G.mode === 'play' || G.mode === 'win' || G.mode === 'lose') {
        audio.ensure();
        startPlay();
        e.preventDefault();
      }
      return;
    }
    if (k === ' ' || k === 'Enter') {
      e.preventDefault();
      if (e.repeat) return;
      if (G.mode === 'title' || G.mode === 'win' || G.mode === 'lose') {
        startPlay();
        return;
      }
      if (G.mode === 'play') input.key = true;
    }
  }

  function onKeyUp(e) {
    if (e.key === ' ' || e.key === 'Enter') input.key = false;
  }

  btnMain.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    startPlay();
  });
  btnRetry.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    startPlay();
  });
  btnMute.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    audio.setMuted(!audio.muted);
  });

  window.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('resize', resize);
  window.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });
  window.addEventListener(
    'touchmove',
    function (e) {
      e.preventDefault();
    },
    { passive: false }
  );
  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    last = performance.now();
    if (G.paused) {
      input.pointer = false;
      input.key = false;
      G.heating = false;
    }
  });

  makeStars();
  makeCracks(1);
  resize();
  showPanel('title');
  requestAnimationFrame(function (t) {
    last = t;
    requestAnimationFrame(frame);
  });
})();
