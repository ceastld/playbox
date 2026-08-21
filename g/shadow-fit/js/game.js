'use strict';

(function () {
  const DURATION = 56;
  const GOAL = 5;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const SIL = 56;
  const INTRO = 0.48;
  const OUTRO = 0.4;
  const PENALTY = 2.4;
  const ROT = 2.35;
  const VIEW_YAW = 0.7;
  const VIEW_PITCH = 0.46;
  const MUTE_KEY = 'playbox-shadow-fit-mute';

  const FACES = [
    { n: [1, 0, 0], v: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
    { n: [-1, 0, 0], v: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
    { n: [0, 1, 0], v: [[0, 1, 0], [0, 1, 1], [1, 1, 1], [1, 1, 0]] },
    { n: [0, -1, 0], v: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
    { n: [0, 0, 1], v: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
    { n: [0, 0, -1], v: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] }
  ];

  const SHAPES = [
    {
      name: '折角',
      sub: 'HOOK',
      cubes: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [2, 1, 0]],
      yaw: Math.PI * 0.5,
      pitch: 0.1,
      need: 0.74
    },
    {
      name: '丁字',
      sub: 'TEE',
      cubes: [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 1, 0], [1, 2, 0]],
      yaw: Math.PI * 0.5,
      pitch: 0.08,
      need: 0.78
    },
    {
      name: '阶台',
      sub: 'STAIR',
      cubes: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [2, 1, 0], [2, 2, 0]],
      yaw: Math.PI * 0.5,
      pitch: 0.52,
      need: 0.81
    },
    {
      name: '分叉',
      sub: 'FORK',
      cubes: [[0, 1, 0], [1, 1, 0], [2, 1, 0], [1, 0, 0], [1, 1, 1]],
      yaw: 0.38,
      pitch: 0.72,
      need: 0.83
    },
    {
      name: '盘旋',
      sub: 'TWIST',
      cubes: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [1, 1, 1], [2, 1, 1], [2, 2, 1]],
      yaw: 0.92,
      pitch: 0.78,
      need: 0.85
    }
  ];

  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d', { alpha: false });
  const hud = document.getElementById('hud');
  const hintEl = document.getElementById('hint');
  const roundEl = document.getElementById('round');
  const fitEl = document.getElementById('fit');
  const timeEl = document.getElementById('time');
  const fitRead = fitEl.parentElement;
  const timeRead = timeEl.parentElement;
  const panel = document.getElementById('panel');
  const card = document.getElementById('card');
  const kickerEl = document.getElementById('panel-kicker');
  const titleEl = document.getElementById('panel-title');
  const leadEl = document.getElementById('panel-lead');
  const metaEl = document.getElementById('panel-meta');
  const footEl = document.getElementById('panel-foot');
  const btnMain = document.getElementById('btn-main');
  const btnMute = document.getElementById('btn-mute');
  const btnLock = document.getElementById('btn-lock');
  const btnRetry = document.getElementById('btn-retry');

  const silCanvas = document.createElement('canvas');
  silCanvas.width = SIL;
  silCanvas.height = SIL;
  const silCtx = silCanvas.getContext('2d', { willReadFrequently: true });

  let W = 1;
  let H = 1;
  let dpr = 1;
  const L = {
    portrait: false,
    objX: 0,
    objY: 0,
    objS: 80,
    wallX: 0,
    wallY: 0,
    wallW: 200,
    wallH: 200,
    lampX: 0,
    lampY: 0
  };

  const CVY = Math.cos(VIEW_YAW);
  const SVY = Math.sin(VIEW_YAW);
  const CVP = Math.cos(VIEW_PITCH);
  const SVP = Math.sin(VIEW_PITCH);

  const keys = { l: false, r: false, u: false, d: false };
  const ptr = {
    down: false,
    id: null,
    x: 0,
    y: 0,
    moved: 0,
    t0: 0
  };

  const particles = [];
  const motes = [];
  const stars = [];
  const sparks = [];

  const G = {
    mode: 'title',
    t: 0,
    clock: 0,
    remain: DURATION,
    round: 0,
    locked: 0,
    yaw: 0.4,
    pitch: 0.3,
    iou: 0,
    need: 0.74,
    meter: 0,
    intro: 0,
    outro: 0,
    shake: 0,
    flash: 0,
    gold: 0,
    aligned: false,
    wasAligned: false,
    lockCool: 0,
    paused: false,
    seed: 1,
    rand: Math.random,
    shape: null,
    targetBits: new Uint8Array(SIL * SIL),
    currBits: new Uint8Array(SIL * SIL),
    taught: false
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
  function wrap(a) {
    a %= TAU;
    if (a < -Math.PI) a += TAU;
    if (a > Math.PI) a -= TAU;
    return a;
  }
  function rng(seed) {
    let s = seed % 2147483646;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }
  function hypot3(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
  }
  function keyOf(x, y, z) {
    return x + ',' + y + ',' + z;
  }

  function prepShape(def) {
    const cubes = def.cubes;
    let sx = 0;
    let sy = 0;
    let sz = 0;
    const set = new Set();
    for (let i = 0; i < cubes.length; i++) {
      const c = cubes[i];
      sx += c[0];
      sy += c[1];
      sz += c[2];
      set.add(keyOf(c[0], c[1], c[2]));
    }
    const n = cubes.length;
    const ox = sx / n + 0.5;
    const oy = sy / n + 0.5;
    const oz = sz / n + 0.5;
    let ext = 0;
    for (let i = 0; i < n; i++) {
      const c = cubes[i];
      for (let dx = 0; dx <= 1; dx++) {
        for (let dy = 0; dy <= 1; dy++) {
          for (let dz = 0; dz <= 1; dz++) {
            ext = Math.max(
              ext,
              hypot3(c[0] + dx - ox, c[1] + dy - oy, c[2] + dz - oz)
            );
          }
        }
      }
    }
    return {
      name: def.name,
      sub: def.sub,
      cubes: cubes,
      set: set,
      ox: ox,
      oy: oy,
      oz: oz,
      extent: ext * 1.08,
      yaw: def.yaw,
      pitch: def.pitch,
      need: def.need
    };
  }

  const PREPPED = SHAPES.map(prepShape);

  function rotPoint(x, y, z, cy, sy, cp, sp) {
    const y1 = y * cp - z * sp;
    const z1 = y * sp + z * cp;
    const x2 = x * cy + z1 * sy;
    const z2 = -x * sy + z1 * cy;
    return [x2, y1, z2];
  }

  function transformedFaces(shape, yaw, pitch, explode) {
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const cubes = shape.cubes;
    const faces = [];
    for (let i = 0; i < cubes.length; i++) {
      const c = cubes[i];
      const oxp = (c[0] + 0.5 - shape.ox) * explode;
      const oyp = (c[1] + 0.5 - shape.oy) * explode;
      const ozp = (c[2] + 0.5 - shape.oz) * explode;
      for (let f = 0; f < 6; f++) {
        const face = FACES[f];
        const nx = face.n[0];
        const ny = face.n[1];
        const nz = face.n[2];
        if (shape.set.has(keyOf(c[0] + nx, c[1] + ny, c[2] + nz))) continue;
        const verts = [];
        for (let k = 0; k < 4; k++) {
          const v = face.v[k];
          verts.push(
            rotPoint(
              c[0] + v[0] - shape.ox + oxp,
              c[1] + v[1] - shape.oy + oyp,
              c[2] + v[2] - shape.oz + ozp,
              cy,
              sy,
              cp,
              sp
            )
          );
        }
        const n = rotPoint(nx, ny, nz, cy, sy, cp, sp);
        faces.push({ verts: verts, n: n });
      }
    }
    return faces;
  }

  function toGrid(sx, sy, extent) {
    const pad = 3;
    const s = (SIL - pad * 2) / (2 * extent);
    return [pad + (sx + extent) * s, pad + (extent - sy) * s];
  }

  function rasterShadow(shape, yaw, pitch, out) {
    const faces = transformedFaces(shape, yaw, pitch, 0);
    const extent = shape.extent;
    silCtx.setTransform(1, 0, 0, 1, 0, 0);
    silCtx.clearRect(0, 0, SIL, SIL);
    silCtx.fillStyle = '#fff';
    for (let i = 0; i < faces.length; i++) {
      const v = faces[i].verts;
      silCtx.beginPath();
      for (let k = 0; k < 4; k++) {
        const g = toGrid(v[k][2], v[k][1], extent);
        if (k === 0) silCtx.moveTo(g[0], g[1]);
        else silCtx.lineTo(g[0], g[1]);
      }
      silCtx.closePath();
      silCtx.fill();
    }
    const data = silCtx.getImageData(0, 0, SIL, SIL).data;
    let filled = 0;
    const n = SIL * SIL;
    for (let i = 0; i < n; i++) {
      const bit = data[i * 4 + 3] > 18 ? 1 : 0;
      out[i] = bit;
      filled += bit;
    }
    return filled;
  }

  function iouBits(a, b) {
    let inter = 0;
    let uni = 0;
    const n = a.length;
    for (let i = 0; i < n; i++) {
      const aa = a[i];
      const bb = b[i];
      uni += aa | bb;
      inter += aa & bb;
    }
    return uni ? inter / uni : 0;
  }

  function computeIou() {
    if (!G.shape) return 0;
    rasterShadow(G.shape, G.yaw, G.pitch, G.currBits);
    return iouBits(G.currBits, G.targetBits);
  }

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    muted: false,
    lastTick: -9,
    ensure: function () {
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
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.22;
      btnMute.textContent = m ? '静' : '音';
      btnMute.setAttribute('aria-label', m ? '取消静音' : '静音');
      try {
        localStorage.setItem(MUTE_KEY, m ? '1' : '0');
      } catch (e) {}
    },
    beep: function (freq, dur, type, vol, slide) {
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
    pulse: function (kind) {
      this.ensure();
      if (kind === 'start') {
        this.beep(220, 0.16, 'sine', 0.07, 440);
        this.beep(330, 0.22, 'triangle', 0.05, 660);
      } else if (kind === 'align') {
        this.beep(620, 0.08, 'triangle', 0.06, 880);
      } else if (kind === 'lock') {
        this.beep(392, 0.12, 'triangle', 0.09, 784);
        this.beep(523, 0.22, 'sine', 0.07, 1046);
        this.beep(784, 0.32, 'sine', 0.05, 1568);
      } else if (kind === 'miss') {
        this.beep(160, 0.18, 'sawtooth', 0.06, 70);
        this.beep(90, 0.28, 'square', 0.04, 50);
      } else if (kind === 'win') {
        this.beep(523, 0.18, 'triangle', 0.1, 784);
        this.beep(659, 0.28, 'sine', 0.08, 988);
        this.beep(784, 0.45, 'sine', 0.07, 1175);
      } else if (kind === 'lose') {
        this.beep(196, 0.4, 'sawtooth', 0.08, 80);
        this.beep(110, 0.7, 'triangle', 0.06, 40);
      } else if (kind === 'tick') {
        this.beep(880, 0.04, 'sine', 0.035, 1320);
      }
    },
    tickDrone: function (iou, aligned) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 58;
        g.gain.value = 0.02;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(54 + iou * 46, t, 0.12);
      this.droneGain.gain.setTargetAtTime(aligned ? 0.045 : 0.018 + iou * 0.02, t, 0.12);
    },
    stopDrone: function () {
      if (!this.droneGain || !this.ctx) return;
      this.droneGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
    }
  };

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.3 + 0.25,
        a: Math.random() * 0.42 + 0.06,
        p: Math.random() * TAU
      });
    }
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 28; i++) {
      motes.push({
        x: Math.random(),
        y: Math.random(),
        s: 6 + Math.random() * 18,
        a: 0.08 + Math.random() * 0.14,
        p: Math.random() * TAU,
        r: 0.8 + Math.random() * 1.6
      });
    }
  }

  function burst(x, y, n, hue) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = 50 + Math.random() * 220;
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        g: 50 + Math.random() * 40,
        life: 0.45 + Math.random() * 0.55,
        max: 1,
        r: 1.4 + Math.random() * 2.8,
        hue: hue
      });
    }
  }

  function sparkle(x, y) {
    sparks.push({
      x: x + (Math.random() - 0.5) * 18,
      y: y + (Math.random() - 0.5) * 18,
      life: 0.28 + Math.random() * 0.25,
      r: 1 + Math.random() * 1.6
    });
  }

  function pickStart(shape, rnd) {
    const need = shape.need;
    let fallback = { yaw: shape.yaw + 1.35, pitch: shape.pitch + 0.62 };
    for (let i = 0; i < 40; i++) {
      const yaw = shape.yaw + (0.7 + rnd() * 1.3) * (rnd() < 0.5 ? -1 : 1);
      const pitch = shape.pitch + (0.28 + rnd() * 0.8) * (rnd() < 0.5 ? -1 : 1);
      const filled = rasterShadow(shape, yaw, pitch, G.currBits);
      const v = iouBits(G.currBits, G.targetBits);
      if (v < need * 0.52 && filled > 90) return { yaw: yaw, pitch: pitch };
      if (filled > 90) fallback = { yaw: yaw, pitch: pitch };
    }
    return fallback;
  }

  function setupRound(index) {
    const base = PREPPED[index];
    const jitterY = (G.rand() - 0.5) * 0.22;
    const jitterP = (G.rand() - 0.5) * 0.16;
    G.shape = {
      name: base.name,
      sub: base.sub,
      cubes: base.cubes,
      set: base.set,
      ox: base.ox,
      oy: base.oy,
      oz: base.oz,
      extent: base.extent,
      yaw: base.yaw + jitterY,
      pitch: base.pitch + jitterP,
      need: base.need
    };
    G.need = G.shape.need;
    G.round = index;
    G.meter = 0;
    G.intro = INTRO;
    G.outro = 0;
    G.lockCool = 0.12;
    G.aligned = false;
    G.wasAligned = false;
    rasterShadow(G.shape, G.shape.yaw, G.shape.pitch, G.targetBits);
    const start = pickStart(G.shape, G.rand);
    G.yaw = start.yaw;
    G.pitch = start.pitch;
    G.iou = computeIou();
  }

  function hidePanel() {
    panel.classList.add('hidden');
  }

  function showPanel() {
    panel.classList.remove('hidden');
    card.classList.remove('win', 'lose');
    if (G.mode === 'title') {
      kickerEl.textContent = 'SILHOUETTE';
      titleEl.textContent = '剪影';
      leadEl.innerHTML = '旋转物块，让影子吻上远处的缺口。';
      metaEl.textContent = '五道剪影。对齐后锁定，灯灭前全部锁入。';
      btnMain.textContent = '点灯';
      footEl.textContent = '拖动 / WASD 旋转 · 空格锁定 · M 静音';
    } else if (G.mode === 'win') {
      card.classList.add('win');
      kickerEl.textContent = 'LOCKED';
      titleEl.textContent = '影合';
      leadEl.textContent = '五道剪影已锁入墙中。';
      metaEl.textContent = '剩余 ' + G.remain.toFixed(1) + ' 秒 · 吻合完成';
      btnMain.textContent = '再锁一回';
      footEl.textContent = '空格 / 回车 · R 重开';
    } else {
      card.classList.add('lose');
      kickerEl.textContent = 'EXTINGUISHED';
      titleEl.textContent = '灯灭';
      leadEl.textContent = '影子没能填上缺口。';
      metaEl.textContent = '已锁入 ' + G.locked + ' / ' + GOAL;
      btnMain.textContent = '再点一盏';
      footEl.textContent = '空格 / 回车 · R 重开';
    }
  }

  function startGame() {
    audio.ensure();
    audio.pulse('start');
    G.mode = 'play';
    G.t = 0;
    G.clock = 0;
    G.remain = DURATION;
    G.locked = 0;
    G.shake = 0;
    G.flash = 0;
    G.gold = 0;
    G.paused = false;
    G.taught = false;
    G.seed = (Date.now() % 2147483646) || 1;
    G.rand = rng(G.seed);
    setupRound(0);
    hidePanel();
    hud.classList.remove('hidden');
  }

  function endGame(win) {
    G.mode = win ? 'win' : 'lose';
    G.clock = 0;
    G.outro = 0;
    G.intro = 0;
    audio.stopDrone();
    audio.pulse(win ? 'win' : 'lose');
    if (win) {
      burst(L.objX, L.objY, 46, 'cyan');
      burst(L.wallX + L.wallW * 0.5, L.wallY + L.wallH * 0.5, 36, 'gold');
    } else {
      G.flash = 1;
      G.shake = 10;
      burst(L.lampX, L.lampY, 24, 'pink');
    }
    hud.classList.add('hidden');
    showPanel();
  }

  function succeedLock() {
    G.lockCool = 0.5;
    G.outro = OUTRO;
    G.meter = 1;
    G.gold = G.iou >= 0.94 ? 1 : 0.35;
    audio.pulse('lock');
    burst(L.objX, L.objY, 28, G.gold > 0.7 ? 'gold' : 'cyan');
    burst(L.wallX + L.wallW * 0.5, L.wallY + L.wallH * 0.5, 22, 'cyan');
  }

  function failLock() {
    G.lockCool = 0.28;
    G.remain = Math.max(0, G.remain - PENALTY);
    G.shake = 8;
    G.flash = 0.7;
    audio.pulse('miss');
    if (G.remain <= 0) {
      G.remain = 0;
      endGame(false);
    }
  }

  function tryLock(fromTap) {
    if (G.mode !== 'play' || G.paused) return;
    if (G.intro > 0.08 || G.outro > 0 || G.lockCool > 0) return;
    if (G.iou >= G.need) {
      succeedLock();
    } else if (!fromTap) {
      failLock();
    }
  }

  function finishOutro() {
    G.locked += 1;
    if (G.locked >= GOAL) {
      endGame(true);
      return;
    }
    setupRound(G.locked);
  }

  function layout() {
    L.portrait = H > W * 1.08;
    if (L.portrait) {
      L.objX = W * 0.48;
      L.objY = H * 0.3;
      L.objS = Math.min(W * 0.56, H * 0.26);
      L.wallX = W * 0.1;
      L.wallY = H * 0.54;
      L.wallW = W * 0.8;
      L.wallH = H * 0.33;
      L.lampX = W * 0.14;
      L.lampY = H * 0.14;
    } else {
      L.objX = W * 0.25;
      L.objY = H * 0.55;
      L.objS = Math.min(W * 0.34, H * 0.5);
      L.wallX = W * 0.54;
      L.wallY = H * 0.2;
      L.wallH = H * 0.58;
      L.wallW = W * 0.4;
      L.lampX = W * 0.08;
      L.lampY = H * 0.26;
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
  }

  function camProject(x, y, z) {
    const x1 = x * CVY + z * SVY;
    const z1 = -x * SVY + z * CVY;
    const y2 = y * CVP - z1 * SVP;
    const z2 = y * SVP + z1 * CVP;
    const persp = 1 / (3.2 + z2);
    const s = L.objS * persp;
    return {
      x: L.objX + x1 * s,
      y: L.objY - y2 * s,
      z: z2
    };
  }

  function toWall(sx, sy, extent) {
    const p = 0.16;
    return [
      L.wallX + L.wallW * (p + (1 - 2 * p) * (sx / extent + 1) / 2),
      L.wallY + L.wallH * (p + (1 - 2 * p) * (1 - (sy / extent + 1) / 2))
    ];
  }

  function pathPolys(faces, extent) {
    for (let i = 0; i < faces.length; i++) {
      const v = faces[i].verts;
      ctx.moveTo.apply(ctx, toWall(v[0][2], v[0][1], extent));
      for (let k = 1; k < 4; k++) {
        ctx.lineTo.apply(ctx, toWall(v[k][2], v[k][1], extent));
      }
      ctx.closePath();
    }
  }

  function addRoundRect(x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, rad);
      return;
    }
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function rr(x, y, w, h, r) {
    ctx.beginPath();
    addRoundRect(x, y, w, h, r);
  }

  function updatePlay(dt) {
    G.lockCool = Math.max(0, G.lockCool - dt);
    if (G.intro > 0) G.intro = Math.max(0, G.intro - dt);
    if (G.outro > 0) {
      G.outro -= dt;
      if (G.outro <= 0) {
        G.outro = 0;
        finishOutro();
        return;
      }
    }

    if (G.outro <= 0) {
      if (keys.l) G.yaw -= ROT * dt;
      if (keys.r) G.yaw += ROT * dt;
      if (keys.u) G.pitch -= ROT * dt;
      if (keys.d) G.pitch += ROT * dt;
      G.t += dt;
      G.remain = Math.max(0, G.remain - dt);
    }

    G.iou = computeIou();
    G.aligned = G.iou >= G.need && G.intro <= 0 && G.outro <= 0;

    if (G.aligned && !G.wasAligned) {
      audio.pulse('align');
      G.taught = true;
    }
    G.wasAligned = G.aligned;

    if (G.aligned) {
      const over = clamp((G.iou - G.need) / Math.max(0.04, 1 - G.need), 0, 1);
      G.meter = Math.min(1, G.meter + (0.85 + over * 1.1) * dt);
      if (G.clock - audio.lastTick > 0.46) {
        audio.lastTick = G.clock;
        audio.pulse('tick');
      }
      if (G.meter >= 1 && G.lockCool <= 0) succeedLock();
    } else {
      G.meter = Math.max(0, G.meter - 1.7 * dt);
    }

    audio.tickDrone(G.iou, G.aligned);

    if (G.aligned && Math.random() < 0.45) {
      sparkle(L.objX, L.objY);
    }

    if (G.remain <= 0 && G.outro <= 0 && G.mode === 'play') {
      G.remain = 0;
      endGame(false);
    }
  }

  function updateFx(dt) {
    G.clock += dt;
    G.shake = Math.max(0, G.shake - dt * 18);
    G.flash = Math.max(0, G.flash - dt * 2.4);
    G.gold = Math.max(0, G.gold - dt * 1.1);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.g * dt;
      p.vx *= 0.98;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      sparks[i].life -= dt;
      if (sparks[i].life <= 0) sparks.splice(i, 1);
    }

    if (G.mode === 'title') {
      if (!G.shape) {
        G.rand = rng(7);
        setupRound(0);
        G.intro = 0;
      }
      G.yaw = G.shape.yaw + 0.62 + Math.sin(G.clock * 0.32) * 0.28;
      G.pitch = G.shape.pitch + 0.38 + Math.cos(G.clock * 0.24) * 0.18;
      G.iou = computeIou();
    }
  }

  function syncHud() {
    if (G.mode !== 'play') return;
    roundEl.textContent = G.locked + 1 + '/' + GOAL;
    const pct = Math.round(G.iou * 100);
    fitEl.textContent = pct + '%';
    timeEl.textContent = G.remain.toFixed(1);
    if (G.aligned) {
      fitRead.classList.add('hot');
      fitRead.classList.remove('warn');
    } else if (G.iou > G.need * 0.72) {
      fitRead.classList.remove('hot', 'warn');
    } else {
      fitRead.classList.remove('hot');
    }
    if (G.remain < 8) timeRead.classList.add('warn');
    else timeRead.classList.remove('warn');

    btnLock.classList.toggle('hot', G.aligned);

    if (G.outro > 0) {
      hintEl.textContent = G.gold > 0.7 ? '完美锁入' : '锁入 · ' + G.shape.name;
      hintEl.className = G.gold > 0.7 ? 'hint gold' : 'hint hot';
    } else if (G.aligned) {
      hintEl.textContent = '对齐了 · 空格或点锁定';
      hintEl.className = 'hint hot';
    } else if (G.iou > G.need * 0.7) {
      hintEl.textContent = '接近了 · 再转一点';
      hintEl.className = 'hint';
    } else if (G.remain < 8) {
      hintEl.textContent = '灯将灭';
      hintEl.className = 'hint warn';
    } else {
      hintEl.textContent = '拖动或 WASD 旋转 · 影子填进缺口';
      hintEl.className = 'hint';
    }
  }

  function drawBg() {
    ctx.fillStyle = '#05030c';
    ctx.fillRect(-20, -20, W + 40, H + 40);

    const g1 = ctx.createRadialGradient(W * 0.16, H * 0.08, 0, W * 0.16, H * 0.08, W * 0.72);
    g1.addColorStop(0, 'rgba(255,61,184,0.16)');
    g1.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    const g2 = ctx.createRadialGradient(W * 0.88, H * 0.78, 0, W * 0.88, H * 0.78, W * 0.7);
    g2.addColorStop(0, 'rgba(0,240,255,0.12)');
    g2.addColorStop(1, 'rgba(0,240,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const tw = 0.55 + 0.45 * Math.sin(G.clock * 1.3 + s.p);
      ctx.fillStyle = 'rgba(246,243,255,' + s.a * tw + ')';
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, TAU);
      ctx.fill();
    }

    const horizon = L.portrait ? H * 0.5 : H * 0.44;
    const vx = L.portrait ? W * 0.5 : W * 0.7;
    ctx.strokeStyle = 'rgba(0,240,255,0.07)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      const y = mix(horizon, H + 30, t * t);
      ctx.globalAlpha = 0.05 + t * 0.1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let i = -8; i <= 16; i++) {
      ctx.globalAlpha = 0.06;
      ctx.beginPath();
      ctx.moveTo(vx, horizon - 8);
      ctx.lineTo(i * W / 7, H + 40);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = ((m.x + G.clock * 0.012) % 1) * W;
      const y = ((m.y + Math.sin(G.clock * 0.3 + m.p) * 0.04) % 1) * H;
      ctx.fillStyle = 'rgba(0,240,255,' + m.a + ')';
      ctx.beginPath();
      ctx.arc(x, y, m.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawLamp() {
    const glow = 0.45 + G.iou * 0.4 + (G.mode === 'lose' ? -0.3 : 0);
    const rg = ctx.createRadialGradient(L.lampX, L.lampY, 0, L.lampX, L.lampY, 90);
    rg.addColorStop(0, 'rgba(255,227,107,' + (0.55 * glow) + ')');
    rg.addColorStop(0.25, 'rgba(255,61,184,' + (0.22 * glow) + ')');
    rg.addColorStop(1, 'rgba(255,61,184,0)');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(L.lampX, L.lampY, 90, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,246,220,0.95)';
    ctx.beginPath();
    ctx.arc(L.lampX, L.lampY, 7, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,240,255,0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(L.lampX, L.lampY, 12, 0, TAU);
    ctx.stroke();
  }

  function drawBeams(currFaces, extent) {
    if (!currFaces.length) return;
    let cx = 0;
    let cy = 0;
    let n = 0;
    for (let i = 0; i < currFaces.length; i++) {
      const v = currFaces[i].verts;
      for (let k = 0; k < 4; k++) {
        const p = toWall(v[k][2], v[k][1], extent);
        cx += p[0];
        cy += p[1];
        n++;
      }
    }
    cx /= n;
    cy /= n;
    const a = 0.05 + G.iou * 0.12;
    ctx.strokeStyle = G.aligned
      ? 'rgba(0,240,255,' + (a + 0.08) + ')'
      : 'rgba(255,61,184,' + a + ')';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(L.lampX, L.lampY);
    ctx.lineTo(L.objX, L.objY);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    ctx.globalAlpha = 0.07 + G.iou * 0.08;
    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(L.lampX, L.lampY - 8);
    ctx.lineTo(L.wallX + 10, L.wallY + 16);
    ctx.moveTo(L.lampX, L.lampY + 8);
    ctx.lineTo(L.wallX + 10, L.wallY + L.wallH - 16);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawObject(faces) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath();
    ctx.ellipse(L.objX, L.objY + L.objS * 0.16, L.objS * 0.15, L.objS * 0.04, 0, 0, TAU);
    ctx.fill();

    const proj = [];
    for (let i = 0; i < faces.length; i++) {
      const v = faces[i].verts;
      const pts = [];
      let z = 0;
      for (let k = 0; k < 4; k++) {
        const p = camProject(v[k][0], v[k][1], v[k][2]);
        pts.push(p);
        z += p.z;
      }
      const n = faces[i].n;
      const nx = n[0] * CVY + n[2] * SVY;
      const nz1 = -n[0] * SVY + n[2] * CVY;
      const ny = n[1] * CVP - nz1 * SVP;
      const nz = n[1] * SVP + nz1 * CVP;
      const lit = clamp(0.2 + 0.8 * Math.max(0, nx * 0.35 + ny * 0.82 + nz * 0.4), 0, 1);
      proj.push({ pts: pts, z: z / 4, lit: lit });
    }
    proj.sort(function (a, b) {
      return a.z - b.z;
    });

    const align = G.aligned ? 1 : clamp((G.iou - 0.3) / 0.5, 0, 1);
    const fade = G.outro > 0 ? smooth(G.outro / OUTRO) : 1;
    ctx.globalAlpha = 0.35 + 0.65 * fade;

    for (let i = 0; i < proj.length; i++) {
      const f = proj[i];
      const lit = f.lit;
      const r = mix(190, 20, align) * mix(0.45, 1, lit);
      const g = mix(40, 230, align) * mix(0.4, 1, lit);
      const b = mix(170, 255, align) * mix(0.55, 1, lit);
      ctx.beginPath();
      ctx.moveTo(f.pts[0].x, f.pts[0].y);
      for (let k = 1; k < 4; k++) ctx.lineTo(f.pts[k].x, f.pts[k].y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',0.78)';
      ctx.fill();
      ctx.strokeStyle = G.aligned
        ? 'rgba(0,240,255,0.85)'
        : 'rgba(255,61,184,' + (0.45 + lit * 0.4) + ')';
      ctx.lineWidth = 1.35;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const ringR = L.objS * 0.19;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(L.objX, L.objY, ringR, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = G.aligned ? '#00f0ff' : '#ff3db8';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.arc(L.objX, L.objY, ringR, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(G.iou, 0, 1));
    ctx.stroke();
    if (G.meter > 0.02) {
      ctx.strokeStyle = '#ffe36b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(L.objX, L.objY, ringR + 6, -Math.PI / 2, -Math.PI / 2 + TAU * G.meter);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWall(targetFaces, currFaces, extent) {
    const x = L.wallX;
    const y = L.wallY;
    const w = L.wallW;
    const h = L.wallH;

    ctx.save();
    rr(x - 8, y - 8, w + 16, h + 16, 18);
    ctx.fillStyle = 'rgba(8, 6, 20, 0.25)';
    ctx.fill();

    ctx.shadowColor = G.aligned ? 'rgba(0,240,255,0.45)' : 'rgba(255,61,184,0.18)';
    ctx.shadowBlur = G.aligned ? 22 : 10;
    rr(x, y, w, h, 16);
    ctx.fillStyle = 'rgba(36, 24, 62, 0.92)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = G.aligned ? 'rgba(0,240,255,0.72)' : 'rgba(255,61,184,0.4)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.save();
    rr(x, y, w, h, 16);
    ctx.clip();

    ctx.beginPath();
    pathPolys(targetFaces, extent);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(0,240,255,0.8)';
    ctx.shadowBlur = 16;
    ctx.strokeStyle = G.aligned ? '#00f0ff' : 'rgba(0,240,255,0.86)';
    ctx.lineWidth = 11;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#05030c';
    ctx.lineWidth = 7;
    ctx.stroke();
    ctx.fillStyle = '#05030c';
    ctx.fill();

    ctx.beginPath();
    pathPolys(currFaces, extent);
    ctx.fillStyle = G.aligned
      ? 'rgba(0,240,255,' + (0.58 + G.meter * 0.28) + ')'
      : 'rgba(255,61,184,0.55)';
    ctx.fill();
    ctx.restore();

    ctx.font = '10px "Segoe UI","PingFang SC",sans-serif';
    ctx.fillStyle = 'rgba(154,160,200,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('影壁  SHADOW', x + w / 2, y - 16);
    ctx.restore();
  }

  function drawFx() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = clamp(p.life / 0.6, 0, 1);
      ctx.globalAlpha = a;
      if (p.hue === 'cyan') ctx.fillStyle = '#00f0ff';
      else if (p.hue === 'gold') ctx.fillStyle = '#ffe36b';
      else ctx.fillStyle = '#ff3db8';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * a, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < sparks.length; i++) {
      const s = sparks[i];
      ctx.globalAlpha = clamp(s.life / 0.3, 0, 1);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (G.flash > 0) {
      ctx.fillStyle = 'rgba(255,61,184,' + (0.18 * G.flash) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (G.gold > 0.4 && G.mode === 'play') {
      ctx.fillStyle = 'rgba(255,227,107,' + (0.06 * G.gold) + ')';
      ctx.fillRect(0, 0, W, H);
    }

    const vg = ctx.createRadialGradient(W * 0.5, H * 0.5, W * 0.2, W * 0.5, H * 0.5, W * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(5,3,12,0.55)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    const sx = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    const sy = G.shake ? (Math.random() - 0.5) * G.shake : 0;
    ctx.setTransform(dpr, 0, 0, dpr, sx * dpr, sy * dpr);

    drawBg();
    drawLamp();

    if (G.shape) {
      const explode = G.intro > 0 ? smooth(G.intro / INTRO) * 1.65 : 0;
      const yaw = G.yaw;
      const pitch = G.pitch;
      const curr = transformedFaces(G.shape, yaw, pitch, explode);
      const target = transformedFaces(G.shape, G.shape.yaw, G.shape.pitch, 0);
      drawBeams(curr, G.shape.extent);
      drawObject(curr);
      drawWall(target, curr, G.shape.extent);
    }

    drawFx();
  }

  function update(dt) {
    if (G.paused) return;
    if (G.mode === 'play') updatePlay(dt);
    updateFx(dt);
  }

  let last = 0;
  let acc = 0;
  function frame(now) {
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    while (acc >= STEP) {
      update(STEP);
      acc -= STEP;
    }
    draw();
    if (G.mode === 'play') syncHud();
    requestAnimationFrame(frame);
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.l = down;
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.r = down;
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') keys.u = down;
    else if (k === 'ArrowDown' || k === 's' || k === 'S') keys.d = down;
    if (down) {
      if (k === 'm' || k === 'M') {
        audio.ensure();
        audio.setMuted(!audio.muted);
        e.preventDefault();
      } else if (k === 'r' || k === 'R') {
        startGame();
        e.preventDefault();
      } else if (k === ' ' || k === 'Enter') {
        e.preventDefault();
        audio.ensure();
        if (G.mode !== 'play') startGame();
        else tryLock(false);
      }
    }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].indexOf(k) >= 0) {
      e.preventDefault();
    }
  }

  canvas.addEventListener('pointerdown', function (e) {
    if (e.button && e.button !== 0) return;
    ptr.down = true;
    ptr.id = e.pointerId;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.moved = 0;
    ptr.t0 = G.clock;
    canvas.classList.add('grabbing');
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    audio.ensure();
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!ptr.down) return;
    const dx = e.clientX - ptr.x;
    const dy = e.clientY - ptr.y;
    ptr.x = e.clientX;
    ptr.y = e.clientY;
    ptr.moved += Math.abs(dx) + Math.abs(dy);
    if (G.mode === 'play' && G.outro <= 0) {
      const sens = 0.0072 * (960 / Math.max(W, 480));
      G.yaw += dx * sens;
      G.pitch += dy * sens;
    }
  });

  function ptrUp(e) {
    if (!ptr.down) return;
    if (ptr.id !== null && e.pointerId !== undefined && e.pointerId !== ptr.id) return;
    const tap = ptr.moved < 12 && G.clock - ptr.t0 < 0.35;
    ptr.down = false;
    ptr.id = null;
    canvas.classList.remove('grabbing');
    if (tap) {
      audio.ensure();
      if (G.mode !== 'play') startGame();
      else tryLock(true);
    }
  }

  canvas.addEventListener('pointerup', ptrUp);
  canvas.addEventListener('pointercancel', ptrUp);
  canvas.addEventListener('lostpointercapture', function () {
    ptr.down = false;
    canvas.classList.remove('grabbing');
  });

  window.addEventListener('keydown', function (e) {
    onKey(e, true);
  });
  window.addEventListener('keyup', function (e) {
    onKey(e, false);
  });
  window.addEventListener('blur', function () {
    keys.l = keys.r = keys.u = keys.d = false;
    ptr.down = false;
  });
  document.addEventListener('visibilitychange', function () {
    G.paused = document.hidden;
    if (document.hidden) {
      keys.l = keys.r = keys.u = keys.d = false;
    }
  });
  window.addEventListener('resize', resize);

  btnMain.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    startGame();
  });
  btnRetry.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    startGame();
  });
  btnLock.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    tryLock(false);
  });
  btnMute.addEventListener('click', function (e) {
    e.stopPropagation();
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('button')) return;
    if (G.mode !== 'play') {
      audio.ensure();
      startGame();
    }
  });
  canvas.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  try {
    if (localStorage.getItem(MUTE_KEY) === '1') audio.setMuted(true);
  } catch (e) {}

  makeStars();
  makeMotes();
  resize();
  G.rand = rng(7);
  setupRound(0);
  G.intro = 0;
  G.mode = 'title';
  showPanel();
  if (location.hash === '#play' || location.hash === '#fit') {
    startGame();
    if (location.hash === '#fit') {
      G.yaw = G.shape.yaw;
      G.pitch = G.shape.pitch;
      G.intro = 0;
      G.iou = computeIou();
    }
  } else if (location.hash === '#win') {
    startGame();
    G.remain = 12.4;
    G.locked = GOAL;
    endGame(true);
  } else if (location.hash === '#lose') {
    startGame();
    G.locked = 2;
    endGame(false);
  }
  requestAnimationFrame(frame);
})();
