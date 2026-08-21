(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const DIE_T = 0.72;
  const CLEAR_T = 0.82;
  const LOCK = 0.22;
  const SPEED_X = 1.38;
  const SPEED_D = 0.9;
  const GRAB_R = 0.07;
  const NEAR_Y = 502;
  const FAR_Y = 74;
  const NEAR_HALF = 458;
  const FAR_HALF = 122;
  const MUTE_KEY = "rain-cloth-mute";

  const PALS = [
    { fill: "#00f0ff", deep: "#0a6e78", wet: "#5d7f96" },
    { fill: "#ff3db8", deep: "#8a185e", wet: "#7a4c6e" },
    { fill: "#ffe36b", deep: "#8a6e18", wet: "#7a7848" },
    { fill: "#cbb8ff", deep: "#58488a", wet: "#6a6888" },
    { fill: "#e8faff", deep: "#3e6a72", wet: "#627888" }
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }
  function smooth(t) {
    t = clamp(t, 0, 1);
    return t * t * (3 - 2 * t);
  }
  function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const r = (pa >> 16) + (((pb >> 16) - (pa >> 16)) * t + 0.5) | 0;
    const g = ((pa >> 8) & 255) + (((((pb >> 8) & 255) - ((pa >> 8) & 255)) * t + 0.5) | 0);
    const bl = (pa & 255) + ((((pb & 255) - (pa & 255)) * t + 0.5) | 0);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }
  function rng(seed) {
    let s = seed % 2147483646;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function w2s(x, d) {
    const t = clamp(d, -0.1, 1.18);
    const y = lerp(NEAR_Y, FAR_Y, t);
    const half = lerp(NEAR_HALF, FAR_HALF, t);
    return { x: VW * 0.5 + x * half, y: y, s: lerp(1.24, 0.34, t), half: half };
  }

  function s2w(sx, sy) {
    const t = clamp((NEAR_Y - sy) / (NEAR_Y - FAR_Y), -0.04, 1.1);
    const half = lerp(NEAR_HALF, FAR_HALF, t);
    const x = half > 8 ? (sx - VW * 0.5) / half : 0;
    return { x: clamp(x, -1.05, 1.05), d: t };
  }

  const STAGES = [
    {
      name: "天台",
      sub: "ROOF",
      hint: "雨从远处来，先收最远那件",
      toast: "远的先湿 · 冲过去",
      startRain: 0.92,
      rainSpeed: 0.06,
      soak: 1.85,
      lines: [
        { d: 0.78, items: [{ x: 0.12, kind: "shirt", pal: 0 }] },
        { d: 0.46, items: [{ x: -0.32, kind: "pants", pal: 1 }] },
        { d: 0.2, items: [{ x: 0.28, kind: "towel", pal: 2 }] }
      ]
    },
    {
      name: "对侧",
      sub: "SPAN",
      hint: "远处那根线要一次收完",
      toast: "远线两头都要收",
      startRain: 0.86,
      rainSpeed: 0.046,
      soak: 1.38,
      lines: [
        {
          d: 0.82,
          items: [
            { x: -0.7, kind: "dress", pal: 1 },
            { x: 0.68, kind: "shirt", pal: 0 }
          ]
        },
        {
          d: 0.48,
          items: [
            { x: -0.22, kind: "pants", pal: 2 },
            { x: 0.34, kind: "towel", pal: 3 }
          ]
        },
        { d: 0.18, items: [{ x: -0.78, kind: "sock", pal: 4 }] }
      ]
    },
    {
      name: "三线",
      sub: "ROWS",
      hint: "一根线湿透，整线都完",
      toast: "由远到近，一根一根收",
      startRain: 0.92,
      rainSpeed: 0.052,
      soak: 1.48,
      lines: [
        {
          d: 0.86,
          items: [
            { x: -0.58, kind: "shirt", pal: 0 },
            { x: 0.08, kind: "dress", pal: 1 },
            { x: 0.64, kind: "pants", pal: 2 }
          ]
        },
        {
          d: 0.56,
          items: [
            { x: -0.4, kind: "towel", pal: 3 },
            { x: 0.44, kind: "shirt", pal: 4 }
          ]
        },
        {
          d: 0.24,
          items: [
            { x: -0.78, kind: "sock", pal: 1 },
            { x: 0.76, kind: "pants", pal: 0 }
          ]
        }
      ]
    },
    {
      name: "斜风",
      sub: "GUST",
      hint: "近处堆着好收的，别上当",
      toast: "近处是诱饵，远处先湿",
      startRain: 0.93,
      rainSpeed: 0.054,
      soak: 1.28,
      lines: [
        {
          d: 0.86,
          items: [
            { x: -0.58, kind: "dress", pal: 1 },
            { x: 0.54, kind: "shirt", pal: 0 }
          ]
        },
        {
          d: 0.66,
          items: [
            { x: -0.28, kind: "pants", pal: 2 },
            { x: 0.36, kind: "towel", pal: 3 }
          ]
        },
        {
          d: 0.4,
          items: [
            { x: -0.54, kind: "shirt", pal: 4 },
            { x: 0.12, kind: "sock", pal: 1 }
          ]
        },
        {
          d: 0.18,
          items: [
            { x: -0.16, kind: "towel", pal: 0 },
            { x: 0.22, kind: "pants", pal: 2 },
            { x: 0.52, kind: "dress", pal: 3 }
          ]
        }
      ]
    },
    {
      name: "暴雨",
      sub: "STORM",
      hint: "雨很快，沿最远的线扫过去",
      toast: "暴雨到了 · 先扫远线",
      startRain: 0.99,
      rainSpeed: 0.054,
      soak: 1.68,
      lines: [
        {
          d: 0.9,
          items: [
            { x: -0.74, kind: "shirt", pal: 0 },
            { x: -0.08, kind: "dress", pal: 1 },
            { x: 0.72, kind: "pants", pal: 2 }
          ]
        },
        {
          d: 0.68,
          items: [
            { x: -0.48, kind: "towel", pal: 3 },
            { x: 0.46, kind: "shirt", pal: 4 }
          ]
        },
        {
          d: 0.44,
          items: [
            { x: -0.62, kind: "sock", pal: 1 },
            { x: 0.04, kind: "pants", pal: 0 },
            { x: 0.58, kind: "dress", pal: 2 }
          ]
        },
        {
          d: 0.2,
          items: [
            { x: -0.3, kind: "towel", pal: 4 },
            { x: 0.28, kind: "shirt", pal: 3 }
          ]
        }
      ]
    }
  ];

  function countItems(s) {
    let n = 0;
    for (let i = 0; i < s.lines.length; i++) n += s.lines[i].items.length;
    return n;
  }

  function makeClothes(s) {
    const list = [];
    for (let li = 0; li < s.lines.length; li++) {
      const line = s.lines[li];
      for (let ii = 0; ii < line.items.length; ii++) {
        const it = line.items[ii];
        list.push({
          id: li + ":" + ii,
          line: li,
          x: it.x,
          d: line.d,
          kind: it.kind,
          pal: it.pal,
          wet: 0,
          state: "hang",
          fly: 0,
          sx: 0,
          sy: 0,
          sway: li * 1.73 + ii * 2.11,
          warned: false
        });
      }
    }
    return list;
  }

  function makeState(index, lives) {
    const s = STAGES[index];
    return {
      stageIndex: index,
      lives: lives == null ? LIVES : lives,
      livesMax: LIVES,
      px: 0,
      pd: 0.055,
      vx: 0,
      vd: 0,
      facing: 1,
      walk: 0,
      rainD: s.startRain,
      rainSpeed: s.rainSpeed,
      soak: s.soak,
      startRain: s.startRain,
      clothes: makeClothes(s),
      total: countItems(s),
      taken: 0,
      time: 0,
      lock: LOCK,
      phase: "play",
      phaseT: 0,
      why: "",
      seek: null,
      shake: 0,
      flash: 0,
      flashRgb: "0,240,255",
      taught: false,
      wetLine: -1,
      basket: []
    };
  }

  function hangingOf(st) {
    const a = [];
    for (let i = 0; i < st.clothes.length; i++) {
      if (st.clothes[i].state === "hang") a.push(st.clothes[i]);
    }
    return a;
  }

  function nearestHang(st, x, d) {
    const list = hangingOf(st);
    let best = null;
    let bd = 1e9;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      const dist = hypot2((c.x - x) * 0.7, (c.d - d) * 1.2);
      if (dist < bd) {
        bd = dist;
        best = c;
      }
    }
    return best ? { c: best, dist: bd } : null;
  }

  function pickFar(st) {
    const list = hangingOf(st);
    if (!list.length) return null;
    let best = list[0];
    let score = best.d * 10 - hypot2((best.x - st.px) * 0.45, best.d - st.pd);
    for (let i = 1; i < list.length; i++) {
      const c = list[i];
      const sc = c.d * 10 - hypot2((c.x - st.px) * 0.45, c.d - st.pd);
      if (sc > score) {
        score = sc;
        best = c;
      }
    }
    return best;
  }

  function applyMove(st, ix, id, seek, dt) {
    let vx = 0;
    let vd = 0;
    if (ix || id) {
      st.seek = null;
      const mag = hypot2(ix, id) || 1;
      vx = (ix / mag) * SPEED_X;
      vd = (id / mag) * SPEED_D;
    } else if (seek) {
      const dx = seek.x - st.px;
      const dd = seek.d - st.pd;
      const tx = dx / SPEED_X;
      const td = dd / SPEED_D;
      const len = hypot2(tx, td);
      if (len < dt) {
        st.px = seek.x;
        st.pd = seek.d;
        st.seek = null;
      } else {
        vx = (tx / len) * SPEED_X;
        vd = (td / len) * SPEED_D;
      }
    }
    st.px = clamp(st.px + vx * dt, -0.93, 0.93);
    st.pd = clamp(st.pd + vd * dt, 0.032, 0.945);
    st.vx = vx;
    st.vd = vd;
    if (Math.abs(vx) > 0.08) st.facing = vx > 0 ? 1 : -1;
    const spd = hypot2(vx / SPEED_X, vd / SPEED_D);
    st.walk += spd * dt * 10.5;
  }

  function collect(st, c) {
    if (c.state !== "hang") return false;
    c.state = "fly";
    c.fly = 0;
    const p = w2s(c.x, c.d);
    c.sx = p.x;
    c.sy = p.y + 10 * p.s;
    c.wet = 0;
    st.taken += 1;
    st.basket.push({ kind: c.kind, pal: c.pal, t: 0, j: rand(-8, 8) });
    return true;
  }

  function stepPhysics(st, ix, id, seek, dt) {
    if (st.phase !== "play") {
      st.phaseT += dt;
      st.flash = Math.max(0, st.flash - dt * 1.8);
      st.shake = Math.max(0, st.shake - dt * 14);
      for (let i = 0; i < st.clothes.length; i++) {
        const c = st.clothes[i];
        if (c.state === "fly") {
          c.fly = Math.min(1, c.fly + dt * 1.7);
          if (c.fly >= 1) c.state = "done";
        }
      }
      return null;
    }

    st.time += dt;
    st.lock = Math.max(0, st.lock - dt);
    st.flash = Math.max(0, st.flash - dt * 2.2);
    st.shake = Math.max(0, st.shake - dt * 16);
    st.rainD -= st.rainSpeed * dt;

    if (seek && !(ix || id)) st.seek = seek;
    if (st.seek && st.seek.id) {
      let live = false;
      for (let i = 0; i < st.clothes.length; i++) {
        if (st.clothes[i].id === st.seek.id && st.clothes[i].state === "hang") live = true;
      }
      if (!live) st.seek = null;
    }
    applyMove(st, ix, id, st.seek, dt);

    let soaking = false;
    let soaked = null;
    for (let i = 0; i < st.clothes.length; i++) {
      const c = st.clothes[i];
      if (c.state === "fly") {
        c.fly = Math.min(1, c.fly + dt * 1.85);
        if (c.fly >= 1) c.state = "done";
        continue;
      }
      if (c.state !== "hang") continue;
      if (c.d >= st.rainD) {
        c.wet = Math.min(1.15, c.wet + dt / st.soak);
        soaking = true;
        if (c.wet >= 1) soaked = c;
      }
    }

    if (soaked) {
      soaked.state = "soak";
      st.why = "wet";
      st.phase = "die";
      st.phaseT = 0;
      st.shake = 10;
      return "die";
    }

    if (st.lock <= 0) {
      const hit = nearestHang(st, st.px, st.pd);
      if (hit && hit.dist < GRAB_R) {
        let skip = false;
        if (st.seek && st.seek.id && st.seek.id !== hit.c.id) {
          let td = st.seek.d;
          for (let i = 0; i < st.clothes.length; i++) {
            if (st.clothes[i].id === st.seek.id) td = st.clothes[i].d;
          }
          if (hit.c.d < td - 0.1) skip = true;
        }
        if (!skip) {
          collect(st, hit.c);
          if (st.seek && st.seek.id === hit.c.id) st.seek = null;
          const left = hangingOf(st);
          if (!left.length) {
            st.phase = "clear";
            st.phaseT = 0;
            st.flash = 0.45;
            st.flashRgb = "0,240,255";
            return "clear";
          }
          return soaking ? "grab-wet" : "grab";
        }
      }
    }

    if (soaking && st.wetLine < 0) {
      const hang = hangingOf(st);
      let maxD = -1;
      for (let i = 0; i < hang.length; i++) if (hang[i].d > maxD) maxD = hang[i].d;
      st.wetLine = maxD;
      return "rainhit";
    }

    return soaking ? "wetting" : null;
  }

  function simulateStage(index) {
    const st = makeState(index, 9);
    st.lock = 0;
    let t = 0;
    const limit = 48;
    let grabs = 0;
    while (t < limit && st.phase === "play") {
      const n = pickFar(st);
      const ev = stepPhysics(st, 0, 0, n ? { x: n.x, d: n.d, id: n.id } : null, STEP);
      if (ev === "grab" || ev === "grab-wet" || ev === "clear") {
        grabs += 1;
        let gid = "?";
        for (let i = 0; i < st.clothes.length; i++) {
          if (st.clothes[i].state === "fly" && st.clothes[i].fly < 0.05) gid = st.clothes[i].id;
        }
        st._path = (st._path || "") + gid + "@" + (Math.round(t * 10) / 10) + " ";
      }
      t += STEP;
    }
    return {
      name: STAGES[index].name,
      won: st.phase === "clear" || st.taken === st.total,
      why: st.why,
      t: Math.round(t * 10) / 10,
      grabs: grabs,
      taken: st.taken,
      total: st.total,
      rain: Math.round(st.rainD * 100) / 100,
      path: st._path || ""
    };
  }

  function simulateNearFirst(index) {
    const st = makeState(index, 9);
    st.lock = 0;
    let t = 0;
    const limit = 48;
    while (t < limit && st.phase === "play") {
      const list = hangingOf(st);
      let n = null;
      let best = 1e9;
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        const sc = c.d * 8 + hypot2((c.x - st.px) * 0.3, c.d - st.pd) * 0.2;
        if (sc < best) {
          best = sc;
          n = c;
        }
      }
      stepPhysics(st, 0, 0, n ? { x: n.x, d: n.d, id: n.id } : null, STEP);
      t += STEP;
    }
    return { name: STAGES[index].name, won: st.phase === "clear", t: Math.round(t * 10) / 10 };
  }

  if (typeof document === "undefined") {
    STAGES.forEach(function (s, i) {
      if (!s.name || !s.lines || s.lines.length < 2) throw new Error("stage " + i);
      if (s.rainSpeed <= 0 || s.soak < 0.6) throw new Error("rain " + i);
      let last = 2;
      for (let k = 0; k < s.lines.length; k++) {
        if (s.lines[k].d >= last) throw new Error("depth order " + i);
        last = s.lines[k].d;
      }
    });
    const results = STAGES.map(function (_, i) {
      return simulateStage(i);
    });
    results.forEach(function (r) {
      console.log(
        (r.won ? "OK" : "FAIL") +
          " " +
          r.name +
          " t=" +
          r.t +
          " " +
          r.taken +
          "/" +
          r.total +
          " rain=" +
          r.rain +
          (r.why ? " " + r.why : "") +
          " " +
          r.path
      );
    });
    const near = STAGES.map(function (_, i) {
      return simulateNearFirst(i);
    });
    near.forEach(function (r, i) {
      console.log((r.won ? "NEAR-OK" : "NEAR-LOSE") + " " + r.name + " t=" + r.t);
      if (i === 0 && !r.won) {
        /* stage 1 may still win either way */
      }
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
      console.log("rain-cloth maps ok", STAGES.length);
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
  const takeLabel = document.getElementById("take-label");
  const rainLabel = document.getElementById("rain-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");

  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, id: null, wx: 0, wy: 0, x: 0, y: 0 };

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };
  const particles = [];
  const drops = [];
  const stars = [];
  const towers = [];
  const clouds = [];

  let mode = "title";
  let overlayKind = "title";
  let st = makeState(0);
  let toastT = 0;
  let frozen = true;
  let acc = 0;
  let lastTs = 0;
  let paused = false;
  let runGen = 0;
  let hudN = 0;

  function seedDecor() {
    const r = rng(41);
    stars.length = 0;
    towers.length = 0;
    clouds.length = 0;
    drops.length = 0;
    for (let i = 0; i < 64; i++) {
      stars.push({
        x: r() * VW,
        y: r() * 58,
        a: r() * 0.5 + 0.12,
        r: r() * 1.3 + 0.3,
        p: r() * TAU
      });
    }
    const spots = [18, 70, 126, 188, 250, 322, 400, 488, 570, 648, 722, 790, 862, 920];
    for (let i = 0; i < spots.length; i++) {
      towers.push({
        x: spots[i],
        w: 22 + (i % 5) * 9,
        h: 16 + (i * 17) % 36,
        mag: i % 3 !== 1
      });
    }
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: 80 + i * 190 + r() * 40,
        y: 16 + r() * 16,
        w: 90 + r() * 80,
        a: 0.1 + r() * 0.1
      });
    }
    for (let i = 0; i < 90; i++) {
      drops.push({
        x: r() * VW,
        y: r() * VH,
        z: r(),
        v: 180 + r() * 260,
        len: 7 + r() * 14
      });
    }
  }
  seedDecor();

  const SFX = {
    ctx: null,
    master: null,
    rain: null,
    rainGain: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.62;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      this.ensureRain();
    },
    ensureRain: function () {
      if (!this.ctx || this.rain) return;
      const n = Math.floor(this.ctx.sampleRate * 0.9);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < n; i++) {
        last = last * 0.88 + (Math.random() * 2 - 1) * 0.12;
        data[i] = last;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = 620;
      const g = this.ctx.createGain();
      g.gain.value = 0;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
      this.rain = src;
      this.rainGain = g;
      this.rainFilter = f;
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
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    },
    noise: function (dur, vol, freq) {
      if (!this.ctx || this.muted) return;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = freq || 1400;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    grab: function () {
      this.ensure();
      this.noise(0.08, 0.07, 1800);
      this.beep(620, 0.09, "triangle", 0.05, 920);
    },
    rainhit: function () {
      this.ensure();
      this.beep(180, 0.22, "sine", 0.05, 90);
      this.noise(0.18, 0.06, 700);
    },
    die: function () {
      this.ensure();
      this.noise(0.3, 0.1, 400);
      this.beep(240, 0.5, "sawtooth", 0.08, 50);
    },
    clear: function () {
      this.ensure();
      this.beep(520, 0.12, "sine", 0.07, 780);
      const self = this;
      const g = runGen;
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(780, 0.16, "sine", 0.07, 1040);
      }, 80);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, "sine", 0.08, 660);
      const self = this;
      const g = runGen;
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(660, 0.18, "sine", 0.08, 880);
      }, 100);
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(880, 0.32, "sine", 0.1, 1320);
      }, 210);
    },
    start: function () {
      this.ensure();
      this.beep(260, 0.14, "sine", 0.055, 520);
    },
    tickRain: function (amt, playing) {
      if (!this.rainGain || this.muted || !this.ctx) return;
      const v = playing ? 0.012 + amt * 0.07 : 0.006;
      this.rainGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.18);
      if (this.rainFilter) {
        this.rainFilter.frequency.setTargetAtTime(480 + amt * 900, this.ctx.currentTime, 0.2);
      }
    },
    hushRain: function () {
      if (!this.rainGain || !this.ctx) return;
      this.rainGain.gain.setTargetAtTime(0.003, this.ctx.currentTime, 0.2);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") SFX.muted = true;
  } catch (_) { /* ignore */ }

  function syncMuteBtn() {
    btnMute.textContent = SFX.muted ? "静" : "声";
    btnMute.classList.toggle("muted", SFX.muted);
    btnMute.setAttribute("aria-label", SFX.muted ? "取消静音" : "静音");
  }
  syncMuteBtn();

  function setMuted(m) {
    SFX.muted = m;
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.62;
    if (m) SFX.hushRain();
    syncMuteBtn();
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function burst(x, y, rgb, n, spd) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      const a = Math.random() * TAU;
      const s = spd * (0.25 + Math.random());
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 30,
        t: 0,
        life: 0.28 + Math.random() * 0.5,
        rgb: rgb,
        r: 1.1 + Math.random() * 2.4
      });
    }
  }

  function dripAt(x, y, n) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 140) particles.shift();
      particles.push({
        x: x + rand(-6, 6),
        y: y,
        vx: rand(-18, 18),
        vy: rand(40, 110),
        t: 0,
        life: 0.35 + Math.random() * 0.35,
        rgb: "180,210,255",
        r: 1 + Math.random() * 1.6
      });
    }
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.8;
  }

  function rainWord() {
    const hang = hangingOf(st);
    if (!hang.length) return { t: "收齐", k: "near" };
    let far = hang[0].d;
    for (let i = 1; i < hang.length; i++) if (hang[i].d > far) far = hang[i].d;
    const gap = far - st.rainD;
    if (gap <= 0) return { t: "淋到", k: "wet" };
    if (gap < 0.12) return { t: "雨近", k: "near" };
    return { t: "雨远", k: "" };
  }

  function renderHud() {
    if (mode === "title") {
      stageLabel.textContent = "远的先湿";
      takeLabel.textContent = "—";
      rainLabel.textContent = "雨前";
      rainLabel.className = "";
    } else {
      const s = STAGES[st.stageIndex];
      stageLabel.textContent = st.stageIndex + 1 + " / " + STAGES.length + "　" + s.name;
      takeLabel.textContent = st.taken + " / " + st.total;
      const rw = rainWord();
      rainLabel.textContent = rw.t;
      rainLabel.className = rw.k;
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
      ovKicker.textContent = "RAIN";
      ovTitle.textContent = "收衣";
      ovLead.innerHTML = "雨从天台远处压过来。远的衣服先湿。<br />先冲最远那件，再往回收。";
      ovOps.textContent = coarse
        ? "点地或点衣服跑过去 · 靠近即收 · 五场雨 · M 静音"
        : "WASD / 方向键走动 · 点地或点衣服跑过去 · 靠近即收 · M 静音";
      ovBtn.textContent = "收衣";
    } else if (kind === "lose") {
      ovKicker.textContent = "SOAKED";
      ovTitle.textContent = "湿透";
      ovLead.textContent = "远处那件已经湿透。雨不等人。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再收一次";
    } else if (kind === "win") {
      ovKicker.textContent = "DRY";
      ovTitle.textContent = "衣齐";
      ovLead.textContent = "五场雨都赶在湿透之前收完了。远的，总是先湿。";
      ovOps.textContent = "";
      ovBtn.textContent = "再收一回";
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
    st.rainD = 1.02;
    st.rainSpeed = 0;
    particles.length = 0;
    setOverlay("title");
    renderHud();
    hintEl.textContent = coarse
      ? "远的先湿 · 点地跑过去 · 靠近即收"
      : "远的先湿 · 先收远处 · 靠近即收";
    SFX.hushRain();
  }

  function loadStage(i, lives) {
    mode = "play";
    runGen += 1;
    st = makeState(i, lives);
    particles.length = 0;
    keys.l = keys.r = keys.u = keys.d = false;
    pointer.down = false;
    hideOverlay();
    renderHud();
    const s = STAGES[i];
    showToast(i + 1 + " / " + STAGES.length + "　" + s.name + " · " + s.toast);
    hintEl.textContent = coarse ? s.hint + " · 点地或点衣服" : s.hint + " · WASD 跑 · M 静音";
    SFX.start();
  }

  function onDieDone() {
    st.lives -= 1;
    if (st.lives <= 0) {
      mode = "lose";
      SFX.hushRain();
      setOverlay("lose");
      renderHud();
      return;
    }
    const livesLeft = st.lives;
    loadStage(st.stageIndex, livesLeft);
    showToast("湿透 · 还剩 " + livesLeft + " 次", true);
  }

  function onClearDone() {
    const next = st.stageIndex + 1;
    if (next >= STAGES.length) {
      mode = "win";
      SFX.hushRain();
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

  function gatherAxis() {
    let ix = 0;
    let id = 0;
    if (keys.l) ix -= 1;
    if (keys.r) ix += 1;
    if (keys.u) id += 1;
    if (keys.d) id -= 1;
    return { ix: ix, id: id };
  }

  function clothAtScreen(wx, wy) {
    const hang = hangingOf(st);
    let best = null;
    let bd = 28;
    for (let i = 0; i < hang.length; i++) {
      const c = hang[i];
      const p = w2s(c.x, c.d);
      const s = p.s;
      const dx = wx - p.x;
      const dy = wy - (p.y + 16 * s);
      const dist = hypot2(dx, dy);
      const rad = 26 * s + (coarse ? 18 : 10);
      if (dist < rad && dist < bd) {
        bd = dist;
        best = c;
      }
    }
    return best;
  }

  function setSeekFromPointer() {
    const c = clothAtScreen(pointer.wx, pointer.wy);
    if (c) {
      st.seek = { x: c.x, d: c.d, id: c.id };
      return;
    }
    const w = s2w(pointer.wx, pointer.wy);
    st.seek = { x: clamp(w.x, -0.92, 0.92), d: clamp(w.d, 0.04, 0.94), id: null };
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#07041a");
    g.addColorStop(0.28, "#0a0720");
    g.addColorStop(0.62, "#12081c");
    g.addColorStop(1, "#1a0a14");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const t = st.time;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const a = s.a * (0.55 + Math.sin(t * 1.6 + s.p) * 0.45);
      ctx.fillStyle = "rgba(230,240,255," + a + ")";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }

    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      ctx.fillStyle = "rgba(40, 24, 70," + c.a + ")";
      ctx.beginPath();
      ctx.ellipse(c.x + Math.sin(t * 0.12 + i) * 8, c.y, c.w * 0.5, 16, 0, 0, TAU);
      ctx.fill();
    }

    const horizon = FAR_Y - 4;
    ctx.fillStyle = "#080614";
    for (let i = 0; i < towers.length; i++) {
      const b = towers[i];
      ctx.fillRect(b.x, horizon - b.h, b.w, b.h + 6);
    }
    for (let i = 0; i < towers.length; i++) {
      const b = towers[i];
      const col = b.mag ? "rgba(255,61,184,0.55)" : "rgba(0,240,255,0.45)";
      ctx.fillStyle = col;
      const rows = Math.max(1, (b.h / 10) | 0);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < 2; x++) {
          if ((x + y + i) % 3 === 0) continue;
          ctx.fillRect(b.x + 5 + x * 8, horizon - b.h + 5 + y * 8, 3.2, 4);
        }
      }
    }
    ctx.fillStyle = "#0d0a1a";
    ctx.fillRect(0, horizon, VW, 6);
  }

  function drawRoof() {
    const bl = w2s(-1, 0);
    const br = w2s(1, 0);
    const tl = w2s(-1, 1);
    const tr = w2s(1, 1);

    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(tl.x, tl.y);
    ctx.closePath();
    const rg = ctx.createLinearGradient(0, tl.y, 0, bl.y);
    rg.addColorStop(0, "#1a1028");
    rg.addColorStop(0.55, "#140c22");
    rg.addColorStop(1, "#1c122c");
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.22)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(tl.x, tl.y);
    ctx.closePath();
    ctx.clip();

    ctx.strokeStyle = "rgba(255,255,255,0.045)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      const d = i / 12;
      const a = w2s(-1, d);
      const b = w2s(1, d);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    const xs = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75];
    ctx.strokeStyle = "rgba(0,240,255,0.05)";
    for (let i = 0; i < xs.length; i++) {
      const a = w2s(xs[i], 0);
      const b = w2s(xs[i], 1);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();

    const door = w2s(0, 0.01);
    ctx.fillStyle = "rgba(255,227,107,0.09)";
    ctx.beginPath();
    ctx.ellipse(door.x, door.y + 8, 70, 18, 0, 0, TAU);
    ctx.fill();
  }

  function drawPole(x, d) {
    const p = w2s(x, d);
    const h = 46 * p.s;
    ctx.strokeStyle = "rgba(200,210,230,0.55)";
    ctx.lineWidth = Math.max(1.4, 3.2 * p.s);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 6 * p.s);
    ctx.lineTo(p.x, p.y - h);
    ctx.stroke();
    ctx.fillStyle = "rgba(0,240,255,0.7)";
    ctx.beginPath();
    ctx.arc(p.x, p.y - h, Math.max(1.6, 2.6 * p.s), 0, TAU);
    ctx.fill();
    return { x: p.x, y: p.y - h, s: p.s, base: p };
  }

  function drawCable(d, pulse) {
    const L = drawPole(-0.96, d);
    const R = drawPole(0.96, d);
    const sag = 10 * L.s;
    ctx.beginPath();
    ctx.moveTo(L.x, L.y);
    ctx.quadraticCurveTo((L.x + R.x) * 0.5, L.y + sag, R.x, R.y);
    ctx.strokeStyle = pulse ? "rgba(255,61,184,0.9)" : "rgba(0,240,255,0.55)";
    ctx.lineWidth = Math.max(1.1, 1.8 * L.s);
    ctx.stroke();
    return { L: L, R: R, sag: sag };
  }

  function clothColor(c) {
    const pal = PALS[c.pal % PALS.length];
    const w = clamp(c.wet, 0, 1);
    if (c.state === "soak") return pal.wet;
    if (w <= 0.02) return pal.fill;
    return mixHex(pal.fill, pal.wet, 0.35 + w * 0.65);
  }

  function drawKind(kind, s, wet) {
    const drop = 1 + wet * 0.22;
    ctx.save();
    ctx.scale(s, s * drop);
    ctx.beginPath();
    if (kind === "pants") {
      ctx.moveTo(-9, 2);
      ctx.lineTo(-10, 8);
      ctx.lineTo(-8, 26);
      ctx.lineTo(-2, 26);
      ctx.lineTo(0, 12);
      ctx.lineTo(2, 26);
      ctx.lineTo(8, 26);
      ctx.lineTo(10, 8);
      ctx.lineTo(9, 2);
      ctx.closePath();
    } else if (kind === "dress") {
      ctx.moveTo(-6, 2);
      ctx.lineTo(-7, 8);
      ctx.lineTo(-14, 26);
      ctx.lineTo(14, 26);
      ctx.lineTo(7, 8);
      ctx.lineTo(6, 2);
      ctx.closePath();
    } else if (kind === "towel") {
      ctx.rect(-11, 2, 22, 22);
    } else if (kind === "sock") {
      ctx.moveTo(-4, 2);
      ctx.lineTo(-5, 16);
      ctx.quadraticCurveTo(-5, 24, 6, 24);
      ctx.lineTo(10, 20);
      ctx.quadraticCurveTo(4, 18, 3, 14);
      ctx.lineTo(3, 2);
      ctx.closePath();
    } else {
      ctx.moveTo(-8, 3);
      ctx.lineTo(-15, 9);
      ctx.lineTo(-11, 13);
      ctx.lineTo(-7, 9);
      ctx.lineTo(-7, 22);
      ctx.lineTo(7, 22);
      ctx.lineTo(7, 9);
      ctx.lineTo(11, 13);
      ctx.lineTo(15, 9);
      ctx.lineTo(8, 3);
      ctx.quadraticCurveTo(0, 6, -8, 3);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function flyPos(c) {
    const from = w2s(c.x, c.d);
    const to = w2s(0.02 + (c.pal % 3) * 0.04 - 0.04, 0.012);
    const t = smooth(c.fly);
    const x = lerp(from.x, to.x, t);
    const arc = Math.sin(t * Math.PI) * 70;
    const y = lerp(from.y + 12 * from.s, to.y - 8, t) - arc;
    const sc = lerp(from.s, 0.38, t);
    return { x: x, y: y, s: sc, a: 1 - t * 0.15 };
  }

  function drawCloth(c, t) {
    if (c.state === "done") return;
    const pal = PALS[c.pal % PALS.length];
    const wet = c.state === "soak" ? 1 : c.wet;
    const sway = Math.sin(t * 1.7 + c.sway) * (4.5 + wet * 6);
    let p;
    let alpha = 1;
    if (c.state === "fly") {
      p = flyPos(c);
      alpha = p.a;
    } else {
      const base = w2s(c.x, c.d);
      p = { x: base.x, y: base.y, s: base.s };
    }
    ctx.save();
    ctx.translate(p.x + sway * 0.15, p.y + (c.state === "fly" ? 0 : 2 * p.s));
    ctx.rotate(sway * 0.012 * (c.state === "fly" ? 1.4 : 1));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = clothColor(c);
    ctx.strokeStyle = "rgba(5,3,12,0.45)";
    ctx.lineWidth = 1.1;
    if (c.state !== "fly") {
      ctx.strokeStyle = wet > 0.15 ? "rgba(255,61,184,0.55)" : "rgba(0,240,255,0.35)";
      ctx.lineWidth = Math.max(1, 1.4 * p.s);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(sway * 0.04, 6 * p.s);
      ctx.stroke();
      ctx.fillStyle = "#ffe36b";
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.4, 2.1 * p.s), 0, TAU);
      ctx.fill();
    }
    ctx.translate(0, 5 * p.s);
    ctx.fillStyle = clothColor(c);
    ctx.strokeStyle = pal.deep;
    ctx.lineWidth = 1;
    drawKind(c.kind, p.s, wet);
    if (wet > 0.04 && (c.state === "hang" || c.state === "soak")) {
      ctx.strokeStyle = "rgba(255,61,184," + (0.45 + wet * 0.5) + ")";
      ctx.lineWidth = Math.max(1.4, 2.2 * p.s);
      ctx.beginPath();
      ctx.arc(0, 12 * p.s, 16 * p.s, -Math.PI * 0.5, -Math.PI * 0.5 + TAU * clamp(wet, 0, 1));
      ctx.stroke();
      ctx.fillStyle = "rgba(180,220,255," + (0.25 + wet * 0.5) + ")";
      ctx.beginPath();
      ctx.ellipse(0, 26 * p.s * (1 + wet * 0.2), 2.2 * p.s, 3.4 * p.s, 0, 0, TAU);
      ctx.fill();
    }
    if (c.state === "hang" && wet <= 0 && st.stageIndex === 0 && !st.taught) {
      const far = pickFar(st);
      if (far && far.id === c.id && st.time < 2.8) {
        ctx.strokeStyle = "rgba(0,240,255," + (0.4 + Math.sin(t * 8) * 0.4) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 12 * p.s, 22 * p.s, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawPlayer() {
    const p = w2s(st.px, st.pd);
    const s = p.s;
    const bob = Math.sin(st.walk) * 1.6 * s;
    const leg = Math.sin(st.walk) * 7 * s;
    ctx.save();
    ctx.translate(p.x, p.y + bob);
    ctx.scale(st.facing, 1);

    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 6 * s, 12 * s, 4 * s, 0, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = "#05030c";
    ctx.lineWidth = Math.max(1.4, 2.2 * s);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-3.2 * s, 2 * s);
    ctx.lineTo(-3.2 * s + leg * 0.15, 11 * s);
    ctx.moveTo(3.2 * s, 2 * s);
    ctx.lineTo(3.2 * s - leg * 0.15, 11 * s);
    ctx.stroke();

    ctx.fillStyle = "#1a1028";
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = Math.max(1.2, 1.8 * s);
    ctx.beginPath();
    ctx.ellipse(0, -2 * s, 7.5 * s, 9 * s, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#2a1840";
    ctx.beginPath();
    ctx.arc(0, -12.5 * s, 5.4 * s, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#00f0ff";
    ctx.stroke();

    ctx.fillStyle = "rgba(255,61,184,0.9)";
    ctx.beginPath();
    ctx.arc(2.1 * s, -13 * s, 1.1 * s, 0, TAU);
    ctx.fill();

    ctx.restore();

    if (st.seek && mode === "play" && st.phase === "play") {
      const g = w2s(st.seek.x, st.seek.d);
      ctx.strokeStyle = "rgba(0,240,255,0.45)";
      ctx.setLineDash([5, 6]);
      ctx.lineDashOffset = -st.time * 40;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(g.x, g.y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(g.x, g.y, 6, 0, TAU);
      ctx.strokeStyle = "rgba(0,240,255,0.7)";
      ctx.stroke();
    }
  }

  function drawRail() {
    ctx.save();
    ctx.strokeStyle = "rgba(0,240,255,0.38)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const yLift = 20;
    const l = w2s(-1, 0.004);
    const r = w2s(1, 0.004);
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - yLift);
    ctx.lineTo(r.x, r.y - yLift);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,61,184,0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - yLift + 7);
    ctx.lineTo(r.x, r.y - yLift + 7);
    ctx.stroke();
    ctx.strokeStyle = "rgba(200,220,255,0.28)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i <= 14; i++) {
      const p = w2s(-1 + (2 * i) / 14, 0.004);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + 2);
      ctx.lineTo(p.x, p.y - yLift);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBasket() {
    const p = w2s(0, 0.0);
    const s = p.s;
    ctx.save();
    ctx.translate(p.x + 86 * s, p.y + 6 * s);
    ctx.fillStyle = "#1a1024";
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-22 * s, -8 * s);
    ctx.lineTo(-16 * s, 16 * s);
    ctx.lineTo(16 * s, 16 * s);
    ctx.lineTo(22 * s, -8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,61,184,0.7)";
    ctx.beginPath();
    ctx.moveTo(-18 * s, 2 * s);
    ctx.lineTo(18 * s, 2 * s);
    ctx.stroke();
    const n = Math.min(st.basket.length, 8);
    for (let i = 0; i < n; i++) {
      const b = st.basket[i];
      const pal = PALS[b.pal % PALS.length];
      ctx.fillStyle = pal.fill;
      ctx.fillRect((-12 + (i % 4) * 7) * s, (2 - Math.floor(i / 4) * 6) * s, 6 * s, 5 * s);
    }
    ctx.fillStyle = "rgba(0,240,255,0.7)";
    ctx.font = "700 " + Math.max(9, 11 * s) + "px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("筐", 0, 30 * s);
    ctx.restore();

    const win = w2s(-0.02, 0.0);
    ctx.fillStyle = "rgba(255,227,107,0.16)";
    ctx.fillRect(win.x - 120 * win.s, win.y - 38 * win.s, 70 * win.s, 36 * win.s);
    ctx.strokeStyle = "rgba(255,227,107,0.45)";
    ctx.strokeRect(win.x - 120 * win.s, win.y - 38 * win.s, 70 * win.s, 36 * win.s);
    ctx.fillStyle = "rgba(255,227,107,0.55)";
    ctx.font = "700 10px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("窗", win.x - 85 * win.s, win.y - 42 * win.s);
  }

  function drawRain() {
    const rainY = w2s(0, clamp(st.rainD, -0.05, 1.15)).y;
    const t = st.time;
    const intensity = clamp(1.15 - st.rainD, 0, 1.2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VW, Math.max(0, rainY));
    ctx.clip();
    ctx.fillStyle = "rgba(80, 40, 110," + (0.08 + intensity * 0.1) + ")";
    ctx.fillRect(0, 0, VW, rainY);

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      const z = 0.35 + d.z * 0.65;
      ctx.strokeStyle = i % 5 === 0 ? "rgba(255,61,184,0.28)" : "rgba(160,210,255," + (0.18 + z * 0.22) + ")";
      ctx.lineWidth = z > 0.7 ? 1.3 : 0.8;
      const x = (d.x + t * 18) % VW;
      const y = (d.y + t * d.v * z) % Math.max(12, rainY + 20);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2.2, y + d.len * z);
      ctx.stroke();
    }
    ctx.restore();

  }

  function drawRainLine() {
    if (st.rainD >= 1.08) return;
    const t = st.time;
    const a = w2s(-1.02, st.rainD);
    const b = w2s(1.02, st.rainD);
    const pulse = 0.45 + Math.sin(t * 7) * 0.25;
    ctx.strokeStyle = "rgba(255,61,184," + (0.55 + pulse * 0.4) + ")";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,240,255,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - 4);
    ctx.lineTo(b.x, b.y - 4);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,208,236,0.85)";
    ctx.font = "700 11px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("雨线", a.x + 8, a.y - 8);
  }

  function drawGauge() {
    const x = 22;
    const y0 = 132;
    const y1 = 470;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();

    const rainU = clamp((1 - st.rainD) / 1, 0, 1);
    const ry = lerp(y0, y1, rainU);
    ctx.strokeStyle = "rgba(255,61,184,0.85)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, ry);
    ctx.stroke();

    const s = STAGES[st.stageIndex];
    for (let i = 0; i < s.lines.length; i++) {
      const d = s.lines[i].d;
      const y = lerp(y0, y1, 1 - d);
      let live = 0;
      for (let k = 0; k < st.clothes.length; k++) {
        const c = st.clothes[k];
        if (c.line === i && c.state === "hang") live += 1;
      }
      ctx.fillStyle = live ? (d >= st.rainD ? "#ff3db8" : "#00f0ff") : "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(x, y, live ? 4.2 : 2.4, 0, TAU);
      ctx.fill();
    }

    const py = lerp(y0, y1, 1 - st.pd);
    ctx.fillStyle = "#ffe36b";
    ctx.beginPath();
    ctx.moveTo(x + 8, py);
    ctx.lineTo(x + 16, py - 5);
    ctx.lineTo(x + 16, py + 5);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(139,144,184,0.85)";
    ctx.font = "700 9px Segoe UI, PingFang SC, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("远", x, y0 - 10);
    ctx.fillText("近", x, y1 + 14);
    ctx.restore();
  }

  function stepParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt;
      if (p.t >= p.life) particles.splice(i, 1);
    }
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = 1 - p.t / p.life;
      ctx.fillStyle = "rgba(" + p.rgb + "," + a + ")";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fill();
    }
  }

  function draw() {
    fit();
    const dpr = view.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, view.cssW, view.cssH);
    ctx.save();
    ctx.translate(view.ox, view.oy);
    if (st.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * st.shake, (Math.random() - 0.5) * st.shake);
    }
    ctx.scale(view.scale, view.scale);

    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    drawSky();
    drawRoof();
    drawRain();

    const s = STAGES[st.stageIndex];
    const t = st.time;
    const layers = [];
    for (let i = 0; i < s.lines.length; i++) {
      layers.push({ d: s.lines[i].d, z: 0, line: i });
    }
    layers.push({ d: st.pd, z: 1, player: true });
    layers.sort(function (a, b) {
      return b.d - a.d || a.z - b.z;
    });

    for (let i = 0; i < layers.length; i++) {
      const L = layers[i];
      if (L.player) {
        drawPlayer();
      } else {
        const line = s.lines[L.line];
        let pulse = false;
        for (let k = 0; k < st.clothes.length; k++) {
          const c = st.clothes[k];
          if (c.line === L.line && c.state === "hang" && c.wet > 0.02) pulse = true;
        }
        drawCable(line.d, pulse);
        for (let k = 0; k < st.clothes.length; k++) {
          const c = st.clothes[k];
          if (c.line === L.line && (c.state === "hang" || c.state === "soak")) drawCloth(c, t);
        }
      }
    }

    for (let k = 0; k < st.clothes.length; k++) {
      if (st.clothes[k].state === "fly") drawCloth(st.clothes[k], t);
    }

    drawBasket();
    drawRail();
    drawRainLine();
    drawGauge();
    drawParticles();

    if (st.flash > 0) {
      ctx.fillStyle = "rgba(" + st.flashRgb + "," + st.flash * 0.18 + ")";
      ctx.fillRect(0, 0, VW, VH);
    }

    if (st.phase === "die") {
      ctx.fillStyle = "rgba(255,61,184," + Math.min(0.18, st.phaseT * 0.22) + ")";
      ctx.fillRect(0, 0, VW, VH);
    }

    ctx.restore();
  }

  function tick(dt) {
    stepParticles(dt);
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }
    for (let i = 0; i < st.basket.length; i++) st.basket[i].t += dt;

    if (mode === "title") {
      st.time += dt;
      SFX.tickRain(0.15, false);
      return;
    }

    if (frozen || paused) {
      SFX.tickRain(clamp(1 - st.rainD, 0, 1), false);
      return;
    }

    const ax = gatherAxis();
    if (pointer.down && !(ax.ix || ax.id)) setSeekFromPointer();
    const ev = stepPhysics(st, ax.ix, ax.id, st.seek, dt);

    if (ev === "grab" || ev === "grab-wet") {
      let c = null;
      for (let i = 0; i < st.clothes.length; i++) {
        if (st.clothes[i].state === "fly" && st.clothes[i].fly < 0.08) c = st.clothes[i];
      }
      const p = c ? w2s(c.x, c.d) : w2s(st.px, st.pd);
      burst(p.x, p.y + 8, ev === "grab-wet" ? "255,61,184" : "0,240,255", 12, 90);
      SFX.grab();
      if (!st.taught) st.taught = true;
    } else if (ev === "rainhit") {
      SFX.rainhit();
      showToast("雨淋到远处了", true);
      const hang = hangingOf(st);
      for (let i = 0; i < hang.length; i++) {
        if (hang[i].d >= st.rainD - 0.02) {
          const p = w2s(hang[i].x, hang[i].d);
          dripAt(p.x, p.y + 20 * p.s, 6);
        }
      }
    } else if (ev === "clear") {
      SFX.clear();
      burst(w2s(st.px, st.pd).x, w2s(st.px, st.pd).y, "0,240,255", 22, 140);
    } else if (ev === "die") {
      SFX.die();
      const wet = st.clothes.filter(function (c) {
        return c.state === "soak";
      })[0];
      if (wet) {
        const p = w2s(wet.x, wet.d);
        burst(p.x, p.y + 16, "255,61,184", 26, 160);
      }
    }

    if (ev === "wetting" || (hangingOf(st).some(function (c) {
      return c.wet > 0.12;
    }))) {
      const hang = hangingOf(st);
      for (let i = 0; i < hang.length; i++) {
        if (hang[i].wet > 0.2 && Math.random() < dt * 6) {
          const p = w2s(hang[i].x, hang[i].d);
          dripAt(p.x, p.y + 22 * p.s, 1);
        }
      }
    }

    SFX.tickRain(clamp(1.05 - st.rainD, 0, 1), st.phase === "play");

    if (st.phase === "die" && st.phaseT >= DIE_T) onDieDone();
    if (st.phase === "clear" && st.phaseT >= CLEAR_T) onClearDone();

    if ((hudN = hudN + 1) % 4 === 0) renderHud();
  }

  function frame(ts) {
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    if (dt > 0.08) dt = 0.08;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      tick(STEP);
      acc -= STEP;
      steps += 1;
    }
    draw();
    requestAnimationFrame(frame);
  }

  function isUi(t) {
    return !!(t && t.closest && (t.closest("button") || t.closest(".overlay")));
  }

  function onKey(e, down) {
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") keys.l = down;
    else if (k === "ArrowRight" || k === "d" || k === "D") keys.r = down;
    else if (k === "ArrowUp" || k === "w" || k === "W") keys.u = down;
    else if (k === "ArrowDown" || k === "s" || k === "S") keys.d = down;
    if (down && (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown" || k === " ")) {
      e.preventDefault();
    }
    if (!down) return;
    if (k === "m" || k === "M") {
      setMuted(!SFX.muted);
      SFX.ensure();
      return;
    }
    if (k === "r" || k === "R") {
      SFX.ensure();
      loadStage(0, LIVES);
      return;
    }
    if (frozen && (k === "Enter" || k === " " || k === "Spacebar")) {
      ovBtn.click();
      e.preventDefault();
    }
  }

  canvas.addEventListener("pointerdown", function (e) {
    if (isUi(e.target)) return;
    SFX.ensure();
    if (frozen) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.wx = w.wx;
    pointer.wy = w.wy;
    setSeekFromPointer();
  });

  canvas.addEventListener("pointermove", function (e) {
    if (!pointer.down || e.pointerId !== pointer.id) return;
    const w = worldFromEvent(e);
    pointer.wx = w.wx;
    pointer.wy = w.wy;
  });

  function endPtr(e) {
    if (e.pointerId !== pointer.id) return;
    pointer.down = false;
    pointer.id = null;
  }
  canvas.addEventListener("pointerup", endPtr);
  canvas.addEventListener("pointercancel", endPtr);

  window.addEventListener("keydown", function (e) {
    SFX.ensure();
    onKey(e, true);
  });
  window.addEventListener("keyup", function (e) {
    onKey(e, false);
  });

  ovBtn.addEventListener("click", function () {
    SFX.ensure();
    if (overlayKind === "title" || overlayKind === "win" || overlayKind === "lose") {
      loadStage(0, LIVES);
    }
  });

  btnRetry.addEventListener("click", function () {
    SFX.ensure();
    loadStage(0, LIVES);
  });

  btnMute.addEventListener("click", function () {
    SFX.ensure();
    setMuted(!SFX.muted);
  });

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    if (paused) SFX.hushRain();
  });

  window.addEventListener("resize", fit);
  fit();
  loadTitle();
  renderHud();
  requestAnimationFrame(frame);
})();
