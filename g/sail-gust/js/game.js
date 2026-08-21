(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const WALL = 30;
  const BR = 13;
  const SPEED = 168;
  const YAW = 2.08;
  const LIVES = 3;
  const DIE_T = 0.62;
  const CLEAR_T = 0.76;
  const LOCK = 0.32;
  const EXIT_R = 40;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function wrap(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
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

  const STAGES = [
    {
      name: "初阵",
      sub: "GUST",
      hint: "钻进阵风再转向，转够就松",
      time: 24,
      spawn: { x: 108, y: 412, hd: 0 },
      exit: { x: 848, y: 148 },
      reefs: [
        { x: 486, y: 398, r: 62 },
        { x: 710, y: 292, r: 38 }
      ],
      gusts: [
        { x: 292, y: 412, r: 98 },
        { x: 588, y: 228, r: 92 }
      ]
    },
    {
      name: "折线",
      sub: "ZAG",
      hint: "阵风用完就直行，转一点就松",
      time: 28,
      spawn: { x: 100, y: 130, hd: 0 },
      exit: { x: 850, y: 410 },
      reefs: [
        { x: 360, y: 56, r: 42 },
        { x: 400, y: 370, r: 86 },
        { x: 650, y: 118, r: 76 },
        { x: 640, y: 508, r: 36 }
      ],
      gusts: [
        { x: 250, y: 135, r: 86 },
        { x: 500, y: 188, r: 98 },
        { x: 740, y: 330, r: 92 }
      ]
    },
    {
      name: "游风",
      sub: "SWEEP",
      hint: "追上移动的阵风，再转向",
      time: 32,
      spawn: { x: 92, y: 270, hd: 0 },
      exit: { x: 850, y: 270 },
      reefs: [
        { x: 330, y: 108, r: 58 },
        { x: 330, y: 432, r: 58 },
        { x: 560, y: 270, r: 68 },
        { x: 780, y: 88, r: 40 },
        { x: 780, y: 452, r: 40 }
      ],
      gusts: [
        { x: 210, y: 270, r: 80 },
        { x: 340, y: 270, r: 78, axis: "y", a: 120, b: 420, spd: 48, phase: 2.2 },
        { x: 560, y: 112, r: 86 },
        { x: 560, y: 428, r: 86 },
        { x: 720, y: 176, r: 82 },
        { x: 720, y: 364, r: 82 }
      ]
    },
    {
      name: "夹礁",
      sub: "PINCH",
      hint: "窄口里抢风，别转过头",
      time: 32,
      spawn: { x: 94, y: 456, hd: -0.18 },
      exit: { x: 854, y: 92 },
      reefs: [
        { x: 250, y: 508, r: 42 },
        { x: 318, y: 250, r: 78 },
        { x: 500, y: 470, r: 70 },
        { x: 538, y: 168, r: 72 },
        { x: 720, y: 338, r: 64 },
        { x: 780, y: 58, r: 40 }
      ],
      gusts: [
        { x: 220, y: 430, r: 80 },
        { x: 400, y: 360, r: 78 },
        { x: 620, y: 250, r: 80 },
        { x: 760, y: 150, r: 72 }
      ]
    },
    {
      name: "灯塔",
      sub: "BEACON",
      hint: "连抢三阵，驶进灯塔",
      time: 36,
      spawn: { x: 88, y: 88, hd: 0.35 },
      exit: { x: 868, y: 448 },
      reefs: [
        { x: 260, y: 40, r: 40 },
        { x: 300, y: 300, r: 86 },
        { x: 520, y: 90, r: 70 },
        { x: 500, y: 380, r: 78 },
        { x: 720, y: 180, r: 68 },
        { x: 700, y: 500, r: 48 },
        { x: 840, y: 300, r: 50 }
      ],
      gusts: [
        { x: 200, y: 140, r: 82 },
        { x: 380, y: 88, r: 70, axis: "x", a: 300, b: 470, spd: 58, phase: 0.4 },
        { x: 520, y: 250, r: 76 },
        { x: 700, y: 360, r: 80, axis: "y", a: 220, b: 460, spd: 70, phase: 0.8 },
        { x: 820, y: 430, r: 70 }
      ]
    }
  ];

  function gustPos(g, t) {
    if (!g.axis) return { x: g.x, y: g.y, r: g.r };
    const span = Math.max(8, g.b - g.a);
    const period = (2 * span) / g.spd;
    let u = (t + (g.phase || 0)) % period;
    if (u < 0) u += period;
    const half = period * 0.5;
    let p;
    if (u < half) p = g.a + g.spd * u;
    else p = g.b - g.spd * (u - half);
    if (g.axis === "y") return { x: g.x, y: p, r: g.r };
    return { x: p, y: g.y, r: g.r };
  }

  function rockVerts(x, y, r, seed) {
    const r0 = rng(seed);
    const n = 8 + Math.floor(r0() * 5);
    const v = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + r0() * 0.2;
      const rr = r * (0.72 + r0() * 0.32);
      v.push({ x: x + Math.cos(a) * rr, y: y + Math.sin(a) * rr });
    }
    return v;
  }

  function makeState(index, lives) {
    const s = STAGES[index];
    const reefs = (s.reefs || []).map(function (r, i) {
      return {
        x: r.x,
        y: r.y,
        r: r.r,
        verts: rockVerts(r.x, r.y, r.r, (index + 1) * 97 + i * 13 + 5)
      };
    });
    return {
      stageIndex: index,
      lives: lives == null ? LIVES : lives,
      livesMax: LIVES,
      px: s.spawn.x,
      py: s.spawn.y,
      hd: s.spawn.hd,
      visHd: s.spawn.hd,
      remain: s.time,
      time: 0,
      lock: LOCK,
      phase: "play",
      phaseT: 0,
      why: "",
      shake: 0,
      inGust: false,
      gustGlow: 0,
      sail: 0,
      steer: 0,
      reefs: reefs,
      gusts: (s.gusts || []).map(function (g) {
        return {
          x: g.x,
          y: g.y,
          r: g.r,
          axis: g.axis,
          a: g.a,
          b: g.b,
          spd: g.spd,
          phase: g.phase || 0
        };
      }),
      exit: { x: s.exit.x, y: s.exit.y },
      spawn: { x: s.spawn.x, y: s.spawn.y, hd: s.spawn.hd },
      taughtGust: false,
      taughtStill: false,
      won: false,
      lost: false
    };
  }

  function shoreHit(x, y, rad) {
    const r = rad == null ? BR : rad;
    return x < WALL + r || x > VW - WALL - r || y < WALL + r || y > VH - WALL - r;
  }

  function reefHit(st, x, y, rad) {
    const r = rad == null ? BR : rad;
    for (let i = 0; i < st.reefs.length; i++) {
      const k = st.reefs[i];
      if (hypot2(x - k.x, y - k.y) < k.r + r - 1) return k;
    }
    return null;
  }

  function insideGust(st, x, y) {
    for (let i = 0; i < st.gusts.length; i++) {
      const g = gustPos(st.gusts[i], st.time);
      if (hypot2(x - g.x, y - g.y) < g.r - 2) return g;
    }
    return null;
  }

  function hitExit(st) {
    return hypot2(st.px - st.exit.x, st.py - st.exit.y) < EXIT_R + BR * 0.25;
  }

  function stepPhysics(st, steer, dt) {
    if (st.phase !== "play") {
      st.phaseT += dt;
      if (st.phase === "die") {
        st.hd += dt * 4.2;
        st.visHd = st.hd;
        st.sail = lerp(st.sail, 0, 0.12);
      } else {
        st.px = lerp(st.px, st.exit.x, 0.08);
        st.py = lerp(st.py, st.exit.y, 0.08);
        st.sail = lerp(st.sail, 1, 0.1);
      }
      st.gustGlow = lerp(st.gustGlow, 0, 0.08);
      return null;
    }

    st.time += dt;
    st.remain -= dt;
    st.lock = Math.max(0, st.lock - dt);
    st.shake = Math.max(0, st.shake - dt * 18);

    const gust = insideGust(st, st.px, st.py);
    st.inGust = !!gust;
    st.gustGlow = lerp(st.gustGlow, gust ? 1 : 0, 1 - Math.pow(0.0008, dt));

    let used = 0;
    if (st.lock <= 0 && gust && steer) {
      st.hd = wrap(st.hd + steer * YAW * dt);
      used = steer;
    }
    st.steer = used;
    st.sail = lerp(st.sail, gust ? 1 : 0.35, 1 - Math.pow(0.0015, dt));
    st.visHd = lerpAngle(st.visHd, st.hd, 1 - Math.pow(0.00025, dt));

    const spd = SPEED * (gust ? 1.08 : 1);
    st.px += Math.cos(st.hd) * spd * dt;
    st.py += Math.sin(st.hd) * spd * dt;

    st._steerUsed = used;

    if (hitExit(st)) {
      st.won = true;
      st.phase = "clear";
      st.phaseT = 0;
      return "clear";
    }
    const rock = reefHit(st, st.px, st.py);
    if (rock) {
      st.why = "reef";
      st.phase = "die";
      st.phaseT = 0;
      st._rock = rock;
      return "die";
    }
    if (shoreHit(st.px, st.py)) {
      st.why = "shore";
      st.phase = "die";
      st.phaseT = 0;
      return "die";
    }
    if (st.remain <= 0) {
      st.remain = 0;
      st.why = "time";
      st.phase = "die";
      st.phaseT = 0;
      return "die";
    }
    return null;
  }

  function lerpAngle(a, b, t) {
    return a + wrap(b - a) * t;
  }

  function lookClear(st, hd, dist) {
    const steps = 16;
    const ds = dist / steps;
    for (let i = 1; i <= steps; i++) {
      const x = st.px + Math.cos(hd) * ds * i;
      const y = st.py + Math.sin(hd) * ds * i;
      if (shoreHit(x, y, BR + 2) || reefHit(st, x, y, BR + 2)) return ds * (i - 1);
    }
    return dist;
  }

  function detourPoint(st) {
    let tx = st.exit.x;
    let ty = st.exit.y;
    for (let n = 0; n < 5; n++) {
      const dx = tx - st.px;
      const dy = ty - st.py;
      const len = hypot2(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      let hit = null;
      let hitAlong = 1e9;
      let hitUx = ux;
      let hitUy = uy;
      for (let i = 0; i < st.reefs.length; i++) {
        const r = st.reefs[i];
        const ox = r.x - st.px;
        const oy = r.y - st.py;
        const along = ox * ux + oy * uy;
        if (along < 8 || along > len - 6) continue;
        const perp = -ox * uy + oy * ux;
        if (Math.abs(perp) < r.r + BR + 28 && along < hitAlong) {
          hitAlong = along;
          hit = r;
          hitUx = ux;
          hitUy = uy;
        }
      }
      if (!hit) return { x: tx, y: ty };
      const clear = hit.r + BR + 54;
      const p1x = hit.x - hitUy * clear;
      const p1y = hit.y + hitUx * clear;
      const p2x = hit.x + hitUy * clear;
      const p2y = hit.y - hitUx * clear;
      const d1 =
        hypot2(p1x - st.px, p1y - st.py) +
        hypot2(st.exit.x - p1x, st.exit.y - p1y) +
        (shoreHit(p1x, p1y, 48) ? 420 : 0);
      const d2 =
        hypot2(p2x - st.px, p2y - st.py) +
        hypot2(st.exit.x - p2x, st.exit.y - p2y) +
        (shoreHit(p2x, p2y, 48) ? 420 : 0);
      if (d1 <= d2) {
        tx = p1x;
        ty = p1y;
      } else {
        tx = p2x;
        ty = p2y;
      }
    }
    return { x: tx, y: ty };
  }

  function pickSteer(st) {
    const p = detourPoint(st);
    const des = Math.atan2(p.y - st.py, p.x - st.px);
    const err = wrap(des - st.hd);
    const clear0 = lookClear(st, st.hd, 180);
    if (clear0 < 64) {
      const cl = lookClear(st, wrap(st.hd - 0.42), 180);
      const cr = lookClear(st, wrap(st.hd + 0.42), 180);
      return cl >= cr ? -1 : 1;
    }
    if (Math.abs(err) < 0.14) return 0;
    const s = err < 0 ? -1 : 1;
    if (lookClear(st, wrap(st.hd + s * 0.32), 130) < 46) return 0;
    return s;
  }

  function simulateStage(index, maxTime) {
    const st = makeState(index, 9);
    const limit = maxTime || 55;
    let t = 0;
    let steers = 0;
    while (t < limit && st.phase === "play") {
      const g = insideGust(st, st.px, st.py);
      let s = 0;
      if (g) {
        s = pickSteer(st);
        if (s) steers += 1;
      }
      stepPhysics(st, s, STEP);
      t += STEP;
    }
    return {
      name: STAGES[index].name,
      won: st.phase === "clear" || st.won,
      why: st.why,
      t: Math.round(t * 10) / 10,
      steers: steers,
      x: Math.round(st.px),
      y: Math.round(st.py)
    };
  }

  if (typeof document === "undefined") {
    STAGES.forEach(function (s, i) {
      if (!s.name || !s.sub || !s.spawn || !s.exit) throw new Error("stage " + i);
      if (s.time < 12) throw new Error("time " + i);
    });
    const results = STAGES.map(function (_, i) {
      return simulateStage(i, 55);
    });
    results.forEach(function (r) {
      console.log(
        (r.won ? "OK" : "TRY") +
          " " +
          r.name +
          " t=" +
          r.t +
          " steers=" +
          r.steers +
          " " +
          r.x +
          "," +
          r.y +
          (r.why ? " " + r.why : "")
      );
    });
    const failed = results.filter(function (r) {
      return !r.won;
    });
    if (failed.length) {
      console.error(
        "unreachable",
        failed
          .map(function (f) {
            return f.name;
          })
          .join(",")
      );
      process.exitCode = 1;
    } else {
      console.log("sail-gust maps ok", STAGES.length);
    }
    return;
  }

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.getElementById("overlay");
  const panel = document.getElementById("panel");
  const ovKicker = document.getElementById("ov-kicker");
  const ovTitle = document.getElementById("ov-title");
  const ovLead = document.getElementById("ov-lead");
  const ovOps = document.getElementById("ov-ops");
  const ovBtn = document.getElementById("ov-btn");
  const stageLabel = document.getElementById("stage-label");
  const windLabel = document.getElementById("wind-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const padEl = document.getElementById("pad");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "点住船的左或右侧 · 或用左右键 · 无风不会转";
    padEl.style.display = "flex";
  }

  const keys = { left: false, right: false };
  const pad = { left: false, right: false };
  const pointer = { down: false, x: 0, y: 0, wx: 0, wy: 0, id: null };

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };
  const motes = [];
  const foam = [];
  const particles = [];
  const wake = [];

  let mode = "title";
  let overlayKind = "title";
  let st = makeState(0);
  let toastT = 0;
  let flash = 0;
  let flashRgb = "0,240,255";
  let frozen = false;
  let acc = 0;
  let lastTs = 0;
  let paused = false;
  let noWindFlash = 0;
  let wasInGust = false;

  function burst(x, y, rgb, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = spd * (0.25 + Math.random());
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        t: 0,
        life: 0.28 + Math.random() * 0.5,
        rgb: rgb,
        r: 1.1 + Math.random() * 2.6
      });
    }
  }

  function makeDecor() {
    motes.length = 0;
    foam.length = 0;
    const r = rng(19);
    for (let i = 0; i < 70; i++) {
      motes.push({
        x: r() * VW,
        y: r() * VH,
        rr: r() * 1.4 + 0.3,
        a: r() * 0.28 + 0.05,
        p: r() * TAU,
        v: 8 + r() * 18
      });
    }
    for (let i = 0; i < 40; i++) {
      foam.push({
        x: WALL + r() * (VW - WALL * 2),
        y: WALL + r() * (VH - WALL * 2),
        rr: 4 + r() * 10,
        a: r() * 0.12 + 0.04,
        p: r() * TAU
      });
    }
  }
  makeDecor();

  const SFX = {
    ctx: null,
    master: null,
    wind: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.7;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.ensureWind();
    },
    ensureWind: function () {
      if (!this.ctx || this.wind) return;
      const n = Math.floor(this.ctx.sampleRate * 0.7);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        last = last * 0.92 + (Math.random() * 2 - 1) * 0.08;
        data[i] = last;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 420;
      f.Q.value = 0.55;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
      this.wind = g;
      this.windFilter = f;
    },
    beep: function (freq, dur, type, vol, slide) {
      if (!this.ctx || this.muted) return;
      const t = this.ctx.currentTime;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.02);
    },
    noise: function (dur, vol) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(g);
      g.connect(this.master);
      src.start();
    },
    turn: function () {
      this.ensure();
      this.beep(480, 0.08, "triangle", 0.035, 720);
    },
    gust: function () {
      this.ensure();
      this.beep(220, 0.16, "sine", 0.04, 380);
    },
    miss: function () {
      this.ensure();
      this.beep(140, 0.09, "sine", 0.03, 80);
    },
    die: function () {
      this.ensure();
      this.noise(0.24, 0.1);
      this.beep(260, 0.48, "sawtooth", 0.07, 50);
    },
    clear: function () {
      this.ensure();
      this.beep(520, 0.12, "sine", 0.07, 780);
      const self = this;
      setTimeout(function () {
        self.beep(780, 0.18, "sine", 0.07, 1040);
      }, 80);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, "sine", 0.08, 660);
      const self = this;
      setTimeout(function () {
        self.beep(660, 0.18, "sine", 0.08, 880);
      }, 100);
      setTimeout(function () {
        self.beep(880, 0.32, "sine", 0.1, 1320);
      }, 210);
    },
    start: function () {
      this.ensure();
      this.beep(240, 0.14, "sine", 0.06, 480);
    },
    tickWind: function (inG, turning) {
      if (!this.wind || this.muted || !this.ctx) return;
      const v = inG ? (turning ? 0.055 : 0.032) : 0.008;
      const t = this.ctx.currentTime;
      this.wind.gain.setTargetAtTime(v, t, 0.1);
      if (this.windFilter) {
        this.windFilter.frequency.setTargetAtTime(inG ? 880 : 320, t, 0.12);
      }
    },
    hushWind: function () {
      if (!this.wind || !this.ctx) return;
      this.wind.gain.setTargetAtTime(0, this.ctx.currentTime, 0.14);
    }
  };

  try {
    if (localStorage.getItem("sail-gust-mute") === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.7;
    if (m) SFX.hushWind();
    syncMuteBtn();
    try {
      localStorage.setItem("sail-gust-mute", m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.7;
  }

  function renderHud() {
    if (mode === "title") {
      stageLabel.textContent = "借阵风转向";
      timeLabel.textContent = "—";
      timeLabel.classList.remove("warn");
      windLabel.textContent = "无风";
      windLabel.classList.remove("on");
    } else {
      const s = STAGES[st.stageIndex];
      stageLabel.textContent = st.stageIndex + 1 + " / " + STAGES.length + "　" + s.name;
      const t = Math.max(0, st.remain);
      timeLabel.textContent = t.toFixed(1);
      timeLabel.classList.toggle("warn", t < 6.5 && mode === "play");
      windLabel.textContent = st.inGust ? "抢风" : "无风";
      windLabel.classList.toggle("on", !!st.inGust && mode === "play");
    }
    pipsEl.innerHTML = "";
    const max = mode === "title" ? 0 : st.livesMax;
    for (let i = 0; i < max; i++) {
      const pip = document.createElement("span");
      pip.className = "pip";
      if (i < st.lives) {
        pip.classList.add("on");
        if (st.lives <= 1 && mode === "play") pip.classList.add("warn");
      }
      pipsEl.appendChild(pip);
    }
  }

  function setOverlay(kind) {
    overlayKind = kind;
    overlay.classList.remove("hidden");
    frozen = true;
    panel.classList.toggle("win", kind === "win");
    panel.classList.toggle("lose", kind === "lose");
    if (kind === "title") {
      ovKicker.textContent = "SAIL";
      ovTitle.textContent = "抢风";
      ovLead.innerHTML = "帆船只会直行。钻进青色阵风，才能转向。<br />别撞礁，驶进灯塔。";
      ovOps.textContent = coarse
        ? "点住船的左或右侧 · 或用左右键 · 五段航线 · M 静音"
        : "A / D 或 ← → 转向（仅阵风中）· 点住船的左或右侧 · M 静音";
      ovBtn.textContent = "启航";
    } else if (kind === "lose") {
      ovKicker.textContent = "REEF";
      ovTitle.textContent = "触礁";
      const why =
        st.why === "time" ? "风停了，航时耗尽。" : st.why === "shore" ? "搁浅在岸边，航向锁死。" : "礁石不让路。";
      ovLead.textContent = why + " 再抢一阵。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再抢一次";
    } else if (kind === "win") {
      ovKicker.textContent = "HARBOR";
      ovTitle.textContent = "靠岸";
      ovLead.textContent = "五段航线，全部驶进灯塔。无风时你一次也没能转向。";
      ovOps.textContent = "";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    frozen = false;
    overlayKind = "none";
    panel.classList.remove("win", "lose");
  }

  function loadTitle() {
    mode = "title";
    st = makeState(0);
    st.lives = 9;
    st.lock = 0;
    particles.length = 0;
    wake.length = 0;
    setOverlay("title");
    renderHud();
    hintEl.textContent = coarse
      ? "借阵风转向 · 无风不会转 · 别撞礁"
      : "借阵风转向 · 无风不会转 · 别撞礁";
  }

  function loadStage(i, lives) {
    mode = "play";
    st = makeState(i, lives);
    particles.length = 0;
    wake.length = 0;
    flash = 0.3;
    flashRgb = "0,240,255";
    noWindFlash = 0;
    wasInGust = false;
    keys.left = keys.right = false;
    pad.left = pad.right = false;
    btnLeft.classList.remove("held");
    btnRight.classList.remove("held");
    hideOverlay();
    renderHud();
    const s = STAGES[i];
    showToast(i + 1 + " / " + STAGES.length + "　" + s.name + " · " + s.hint);
    hintEl.textContent = coarse ? s.hint + " · 点左右或按键" : s.hint + " · A/D 转向 · M 静音";
  }

  function onDieDone() {
    st.lives -= 1;
    if (st.lives <= 0) {
      mode = "lose";
      SFX.hushWind();
      setOverlay("lose");
      renderHud();
      return;
    }
    const why = st.why;
    const livesLeft = st.lives;
    loadStage(st.stageIndex, livesLeft);
    const msg =
      why === "time"
        ? "时限 · 还剩 " + livesLeft + " 艘"
        : why === "shore"
          ? "搁浅 · 还剩 " + livesLeft + " 艘"
          : "触礁 · 还剩 " + livesLeft + " 艘";
    showToast(msg, true);
  }

  function onClearDone() {
    const next = st.stageIndex + 1;
    if (next >= STAGES.length) {
      mode = "win";
      SFX.hushWind();
      SFX.win();
      setOverlay("win");
      renderHud();
      return;
    }
    loadStage(next, st.lives);
  }

  function fit() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const tw = Math.max(1, Math.round(cssW * dpr));
    const th = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    const scale = Math.min(cssW / VW, cssH / VH);
    view.scale = scale;
    view.ox = (cssW - VW * scale) / 2;
    view.oy = (cssH - VH * scale) / 2;
    view.cssW = cssW;
    view.cssH = cssH;
    view.dpr = dpr;
  }

  function worldFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: x,
      y: y,
      wx: (x - view.ox) / view.scale,
      wy: (y - view.oy) / view.scale
    };
  }

  function gatherSteer() {
    let s = 0;
    if (keys.left || pad.left) s -= 1;
    if (keys.right || pad.right) s += 1;
    if (pointer.down && pointer.id !== "pad") {
      if (pointer.wx < st.px - 8) s -= 1;
      else if (pointer.wx > st.px + 8) s += 1;
    }
    if (s < -0.2) return -1;
    if (s > 0.2) return 1;
    return 0;
  }

  function drawRoundRect(x, y, w, h, r) {
    const rr = Math.min(r, w * 0.5, h * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawWater() {
    const g = ctx.createLinearGradient(0, 0, VW, VH);
    g.addColorStop(0, "#07101c");
    g.addColorStop(0.45, "#081422");
    g.addColorStop(1, "#0a0c1c");
    ctx.fillStyle = g;
    drawRoundRect(WALL - 2, WALL - 2, VW - WALL * 2 + 4, VH - WALL * 2 + 4, 18);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    drawRoundRect(WALL, WALL, VW - WALL * 2, VH - WALL * 2, 16);
    ctx.clip();

    const t = st.time;
    ctx.strokeStyle = "rgba(0,240,255,0.05)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      const y0 = 48 + i * 52;
      for (let x = WALL; x <= VW - WALL; x += 16) {
        const y = y0 + Math.sin(x * 0.018 + t * 1.4 + i) * 5 + Math.sin(x * 0.04 - t + i * 0.7) * 2.4;
        if (x === WALL) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    for (let i = 0; i < foam.length; i++) {
      const f = foam[i];
      const u = 0.5 + Math.sin(t * 1.3 + f.p) * 0.5;
      ctx.fillStyle = "rgba(180,230,255," + f.a * u + ")";
      ctx.beginPath();
      ctx.ellipse(f.x + Math.sin(t * 0.4 + f.p) * 6, f.y, f.rr, f.rr * 0.45, 0.2, 0, TAU);
      ctx.fill();
    }

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const x = (m.x + t * m.v * 0.35) % VW;
      const y = (m.y + Math.sin(t * 0.7 + m.p) * 8 + VW) % VH;
      ctx.fillStyle = "rgba(0,240,255," + m.a + ")";
      ctx.fillRect(x, y, m.rr, m.rr);
    }

    ctx.restore();
  }

  function drawShore() {
    ctx.fillStyle = "#12081a";
    ctx.fillRect(0, 0, VW, WALL);
    ctx.fillRect(0, VH - WALL, VW, WALL);
    ctx.fillRect(0, 0, WALL, VH);
    ctx.fillRect(VW - WALL, 0, WALL, VH);

    ctx.fillStyle = "rgba(255,61,184,0.22)";
    ctx.fillRect(0, WALL - 2, VW, 2);
    ctx.fillRect(0, VH - WALL, VW, 2);
    ctx.fillRect(WALL - 2, 0, 2, VH);
    ctx.fillRect(VW - WALL, 0, 2, VH);

    ctx.strokeStyle = "rgba(255,61,184,0.18)";
    ctx.lineWidth = 1;
    const t = st.time;
    ctx.beginPath();
    for (let x = 0; x < VW; x += 10) {
      const y = WALL - 4 + Math.sin(x * 0.2 + t * 3) * 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.beginPath();
    for (let x = 0; x < VW; x += 10) {
      const y = VH - WALL + 4 + Math.sin(x * 0.18 + t * 2.6) * 2;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function drawGusts() {
    for (let i = 0; i < st.gusts.length; i++) {
      const g = gustPos(st.gusts[i], st.time);
      const pulse = 0.55 + Math.sin(st.time * 3 + i) * 0.2;
      const inside = hypot2(st.px - g.x, st.py - g.y) < g.r - 2;
      ctx.save();
      const rg = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, g.r);
      rg.addColorStop(0, inside ? "rgba(0,240,255,0.22)" : "rgba(0,240,255,0.12)");
      rg.addColorStop(0.7, "rgba(0,240,255,0.05)");
      rg.addColorStop(1, "rgba(0,240,255,0)");
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r, 0, TAU);
      ctx.fillStyle = rg;
      ctx.fill();

      ctx.strokeStyle = inside ? "rgba(0,240,255,0.95)" : "rgba(0,240,255,0.55)";
      ctx.lineWidth = inside ? 2.2 : 1.4;
      ctx.setLineDash([7, 8]);
      ctx.lineDashOffset = -st.time * 42;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r - 2, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "rgba(255,61,184," + (0.18 + pulse * 0.12) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.r * 0.62, st.time, st.time + Math.PI * 1.1);
      ctx.stroke();

      const n = 6;
      ctx.strokeStyle = "rgba(0,240,255," + (inside ? 0.7 : 0.35) + ")";
      ctx.lineWidth = 1.4;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + st.time * 0.8;
        const u = ((st.time * 0.45 + k * 0.16) % 1);
        const rr = g.r * (0.25 + u * 0.6);
        const x = g.x + Math.cos(a) * rr;
        const y = g.y + Math.sin(a) * rr;
        const tang = a + Math.PI * 0.5;
        const len = 7;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(tang) * len, y - Math.sin(tang) * len);
        ctx.lineTo(x + Math.cos(tang) * len, y + Math.sin(tang) * len);
        ctx.stroke();
      }

      if (inside && mode === "play") {
        ctx.fillStyle = "rgba(232,250,255,0.9)";
        ctx.font = "700 11px Segoe UI, PingFang SC, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("抢风", g.x, g.y - g.r + 18);
      }
      ctx.restore();
    }
  }

  function drawReefs() {
    for (let i = 0; i < st.reefs.length; i++) {
      const r = st.reefs[i];
      const pulse = 0.5 + Math.sin(st.time * 2.2 + i) * 0.2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r + 10, 0, TAU);
      ctx.fillStyle = "rgba(255,61,184," + (0.07 + pulse * 0.05) + ")";
      ctx.fill();

      ctx.beginPath();
      const v = r.verts;
      ctx.moveTo(v[0].x, v[0].y);
      for (let k = 1; k < v.length; k++) ctx.lineTo(v[k].x, v[k].y);
      ctx.closePath();
      const rg = ctx.createRadialGradient(r.x - r.r * 0.2, r.y - r.r * 0.25, 4, r.x, r.y, r.r);
      rg.addColorStop(0, "#2a1630");
      rg.addColorStop(0.55, "#160814");
      rg.addColorStop(1, "#0a0410");
      ctx.fillStyle = rg;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,61,184,0.9)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(r.x - r.r * 0.25, r.y - r.r * 0.3);
      ctx.lineTo(r.x + r.r * 0.1, r.y - r.r * 0.05);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawExit() {
    const e = st.exit;
    const pulse = 0.7 + Math.sin(st.time * 3.2) * 0.3;
    ctx.save();
    ctx.beginPath();
    ctx.arc(e.x, e.y, EXIT_R + 18, 0, TAU);
    ctx.fillStyle = "rgba(0,240,255," + (0.07 + pulse * 0.05) + ")";
    ctx.fill();

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(st.time * 0.7);
    ctx.strokeStyle = "rgba(0,240,255,0.95)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(0, 0, EXIT_R, 0, TAU);
    ctx.stroke();
    ctx.rotate(-st.time * 1.6);
    ctx.strokeStyle = "rgba(255,61,184,0.5)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(0, 0, EXIT_R - 8, 0.2, Math.PI + 0.2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.fillStyle = "#0c2430";
    ctx.fillRect(-5, -14, 10, 20);
    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(-3.5, -20, 7, 8);
    ctx.fillStyle = "rgba(255,227,107,0.95)";
    ctx.beginPath();
    ctx.arc(0, -16, 2.6, 0, TAU);
    ctx.fill();
    ctx.restore();

    const beam = (Math.sin(st.time * 1.1) * 0.5 + 0.5) * 0.2;
    ctx.save();
    ctx.translate(e.x, e.y - 16);
    ctx.rotate(Math.sin(st.time * 0.6) * 0.45);
    ctx.fillStyle = "rgba(255,227,107," + beam + ")";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(72, 16);
    ctx.lineTo(72, -16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "rgba(0,240,255,0.72)";
    ctx.font = "700 11px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("灯塔", e.x, e.y + EXIT_R + 16);
    ctx.restore();
  }

  function drawWake() {
    for (let i = 0; i < wake.length; i++) {
      const w = wake[i];
      const u = i / Math.max(1, wake.length - 1);
      ctx.beginPath();
      ctx.ellipse(w.x, w.y, 5 + u * 7, 2.2 + u * 2, w.hd, 0, TAU);
      ctx.fillStyle = "rgba(0,240,255," + (0.04 + u * 0.12) + ")";
      ctx.fill();
    }
  }

  function drawCourse() {
    if (st.phase !== "play") return;
    ctx.save();
    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = st.inGust ? "rgba(0,240,255,0.55)" : "rgba(255,61,184,0.28)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(st.px, st.py);
    const steer = mode === "play" ? gatherSteer() : st.steer;
    let x = st.px;
    let y = st.py;
    let hd = st.hd;
    for (let i = 0; i < 16; i++) {
      const g = insideGust(st, x, y);
      if (g && steer) hd = wrap(hd + steer * YAW * 0.07);
      x += Math.cos(hd) * 12;
      y += Math.sin(hd) * 12;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawBoat() {
    const die = st.phase === "die" ? clamp(1 - st.phaseT / DIE_T, 0, 1) : 1;
    const glow = st.gustGlow;
    ctx.save();
    ctx.translate(st.px, st.py);
    ctx.globalAlpha = 0.4 + die * 0.6;
    ctx.rotate(st.visHd);

    ctx.beginPath();
    ctx.arc(0, 0, BR + 9 + glow * 6, 0, TAU);
    ctx.fillStyle = "rgba(0,240,255," + (0.08 + glow * 0.14) + ")";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(BR + 6, 0);
    ctx.quadraticCurveTo(4, BR + 2, -BR - 2, BR * 0.7);
    ctx.lineTo(-BR - 4, 0);
    ctx.lineTo(-BR - 2, -BR * 0.7);
    ctx.quadraticCurveTo(4, -BR - 2, BR + 6, 0);
    ctx.closePath();
    ctx.fillStyle = "#14102a";
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = st.inGust ? "rgba(0,240,255,0.95)" : "rgba(255,61,184,0.85)";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(BR * 0.4, 0);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    const sailH = BR * (1.6 + glow * 0.5);
    const sailW = BR * (1.1 + st.sail * 0.5);
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(2, -sailH);
    ctx.lineTo(2 + sailW, -sailH * 0.28);
    ctx.closePath();
    ctx.fillStyle = st.inGust ? "rgba(0,240,255,0.82)" : "rgba(255,61,184,0.72)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(2, -sailH);
    ctx.lineTo(2, 4);
    ctx.strokeStyle = "#e8faff";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = "#ffe36b";
    ctx.beginPath();
    ctx.moveTo(-BR - 2, 0);
    ctx.lineTo(-BR - 8, -4);
    ctx.lineTo(-BR - 8, 4);
    ctx.closePath();
    ctx.fill();

    if (noWindFlash > 0 && !st.inGust) {
      ctx.strokeStyle = "rgba(255,61,184," + noWindFlash + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, BR + 12, 0, TAU);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const u = 1 - p.t / p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * u, 0, TAU);
      ctx.fillStyle = "rgba(" + p.rgb + "," + (0.15 + u * 0.7) + ")";
      ctx.fill();
    }
  }

  function drawWorld() {
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, view.cssW, view.cssH);

    const shx = st.shake ? (Math.random() - 0.5) * st.shake : 0;
    const shy = st.shake ? (Math.random() - 0.5) * st.shake : 0;
    ctx.translate(view.ox + shx, view.oy + shy);
    ctx.scale(view.scale, view.scale);

    ctx.fillStyle = "#05030c";
    ctx.fillRect(0, 0, VW, VH);

    drawWater();
    drawGusts();
    drawExit();
    drawReefs();
    drawShore();
    drawWake();
    drawCourse();
    drawBoat();
    drawParticles();

    if (flash > 0) {
      ctx.fillStyle = "rgba(" + flashRgb + "," + flash * 0.18 + ")";
      ctx.fillRect(0, 0, VW, VH);
    }

    ctx.strokeStyle = "rgba(0,240,255,0.12)";
    ctx.lineWidth = 2;
    drawRoundRect(1, 1, VW - 2, VH - 2, 8);
    ctx.stroke();
  }

  function tickParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.t >= p.life) particles.splice(i, 1);
    }
    if (particles.length > 140) particles.splice(0, particles.length - 140);

    if (st.phase === "play" || mode === "title") {
      wake.push({ x: st.px - Math.cos(st.hd) * 10, y: st.py - Math.sin(st.hd) * 10, hd: st.hd });
      if (wake.length > 18) wake.shift();
      if (st.inGust && Math.random() < 0.45) {
        const a = st.hd + Math.PI + (Math.random() - 0.5) * 1.2;
        particles.push({
          x: st.px,
          y: st.py,
          vx: Math.cos(a) * (20 + Math.random() * 40),
          vy: Math.sin(a) * (20 + Math.random() * 40),
          t: 0,
          life: 0.35 + Math.random() * 0.25,
          rgb: "0,240,255",
          r: 1.2 + Math.random() * 1.8
        });
      }
    }
  }

  function startRun() {
    SFX.start();
    loadStage(0, LIVES);
  }

  function retry() {
    SFX.start();
    loadStage(0, LIVES);
  }

  function onOverlayAction() {
    if (overlayKind === "title" || overlayKind === "lose" || overlayKind === "win") {
      startRun();
    }
  }

  ovBtn.addEventListener("click", function () {
    SFX.ensure();
    onOverlayAction();
  });
  btnRetry.addEventListener("click", function () {
    SFX.ensure();
    retry();
  });
  btnMute.addEventListener("click", function () {
    SFX.ensure();
    setMuted(!SFX.muted);
  });

  function bindHold(el, side) {
    const down = function (e) {
      e.preventDefault();
      pad[side] = true;
      pointer.id = "pad";
      el.classList.add("held");
      SFX.ensure();
    };
    const up = function (e) {
      if (e) e.preventDefault();
      pad[side] = false;
      el.classList.remove("held");
      if (pointer.id === "pad") pointer.id = null;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointerleave", up);
    el.addEventListener("pointercancel", up);
  }
  bindHold(btnLeft, "left");
  bindHold(btnRight, "right");

  function keySteer(code, down) {
    if (code === "KeyA" || code === "ArrowLeft") keys.left = down;
    if (code === "KeyD" || code === "ArrowRight") keys.right = down;
  }

  window.addEventListener("keydown", function (e) {
    if (e.repeat && (e.code === "KeyM" || e.code === "KeyR" || e.code === "Enter" || e.code === "Space")) return;
    if (e.code === "KeyA" || e.code === "ArrowLeft" || e.code === "KeyD" || e.code === "ArrowRight" || e.code === "Space") {
      e.preventDefault();
    }
    keySteer(e.code, true);
    if (e.code === "KeyM") {
      SFX.ensure();
      setMuted(!SFX.muted);
    }
    if (e.code === "KeyR") {
      SFX.ensure();
      retry();
    }
    if ((e.code === "Enter" || e.code === "Space") && frozen) {
      e.preventDefault();
      SFX.ensure();
      onOverlayAction();
    }
  });
  window.addEventListener("keyup", function (e) {
    keySteer(e.code, false);
  });

  canvas.addEventListener("pointerdown", function (e) {
    if (frozen) return;
    if (e.button != null && e.button !== 0) return;
    SFX.ensure();
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.wx = w.wx;
    pointer.wy = w.wy;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || pointer.id !== e.pointerId) return;
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    pointer.wx = w.wx;
    pointer.wy = w.wy;
  });
  function pointerUp(e) {
    if (pointer.id !== e.pointerId && pointer.id !== "pad") return;
    if (pointer.id === "pad") return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    if (paused) SFX.hushWind();
    lastTs = 0;
  });
  window.addEventListener("resize", fit);
  window.addEventListener("blur", function () {
    keys.left = keys.right = false;
  });

  let turnChirp = 0;

  function updatePlay(dt) {
    const steer = frozen ? 0 : gatherSteer();
    const beforeGust = st.inGust;
    const ev = stepPhysics(st, steer, dt);

    if (st.inGust && !beforeGust) {
      SFX.gust();
      if (!st.taughtGust && mode === "play") {
        st.taughtGust = true;
        showToast("阵风！现在可以转向");
      }
    }
    wasInGust = st.inGust;

    if (mode === "play" && steer && !st.inGust && st.lock <= 0 && st.phase === "play") {
      noWindFlash = 1;
      if (!st.taughtStill) {
        st.taughtStill = true;
        showToast("没有阵风，帆船不会转", true);
        SFX.miss();
      }
    }
    if (st._steerUsed && turnChirp <= 0) {
      SFX.turn();
      turnChirp = 0.16;
      const px = -Math.sin(st.hd) * st._steerUsed;
      const py = Math.cos(st.hd) * st._steerUsed;
      burst(st.px + px * 10, st.py + py * 10, "0,240,255", 4, 80);
    }

    if (ev === "die") {
      SFX.die();
      flash = 0.55;
      flashRgb = "255,61,184";
      st.shake = 10;
      burst(st.px, st.py, "255,61,184", 22, 180);
      burst(st.px, st.py, "255,227,107", 8, 90);
    } else if (ev === "clear") {
      SFX.clear();
      flash = 0.4;
      flashRgb = "0,240,255";
      burst(st.exit.x, st.exit.y, "0,240,255", 18, 120);
      burst(st.exit.x, st.exit.y, "255,227,107", 10, 70);
    }

    SFX.tickWind(st.inGust, !!st._steerUsed);
  }

  function update(dt) {
    toastT = Math.max(0, toastT - dt);
    if (toastT <= 0) toastEl.classList.add("hidden");
    flash = Math.max(0, flash - dt * 1.8);
    noWindFlash = Math.max(0, noWindFlash - dt * 2.4);
    turnChirp = Math.max(0, turnChirp - dt);

    if (mode === "title") {
      const s = pickSteer(st);
      const g = insideGust(st, st.px, st.py);
      stepPhysics(st, g ? s : 0, dt);
      if (st.phase !== "play") {
        st = makeState(0);
        st.lives = 9;
        st.lock = 0;
      }
      SFX.tickWind(st.inGust, false);
    } else if (mode === "play" && !frozen && !paused) {
      updatePlay(dt);
      if (st.phase === "die" && st.phaseT >= DIE_T) onDieDone();
      if (st.phase === "clear" && st.phaseT >= CLEAR_T) onClearDone();
    }

    tickParticles(dt);
    renderHud();
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    fit();
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    const step = STEP;
    let n = 0;
    while (acc >= step && n < 5) {
      update(step);
      acc -= step;
      n += 1;
    }
    if (n === 5) acc = 0;
    drawWorld();
  }

  fit();
  loadTitle();
  requestAnimationFrame(frame);
})();
