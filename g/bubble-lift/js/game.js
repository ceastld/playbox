(() => {
  "use strict";

  const VW = 960;
  const VH = 540;
  const SHAFT_L = 196;
  const SHAFT_R = 764;
  const CX = 480;
  const R_MIN = 16;
  const R_START = 26;
  const R_HOVER = 30;
  const R_MAX = 48;
  const R_WARN = 41;
  const INFLATE = 20;
  const DEFLATE = 14;
  const GRAV = 205;
  const BUOY_K = 6.84;
  const ACC = 580;
  const DAMP = 4.1;
  const VDAMP = 0.85;
  const MAX_VX = 176;
  const MAX_VY = 120;
  const CRATE_W = 36;
  const CRATE_H = 28;
  const CRATE_LIFT = 0.58;
  const SPIKE_R = 6.2;
  const LIVES = 3;
  const LOCK = 0.28;
  const DIE_T = 0.78;
  const CLEAR_T = 0.9;
  const STEP = 1 / 60;
  const TAU = Math.PI * 2;
  const MUTE_KEY = "playbox-bubble-lift-mute";

  const DIR = {
    up: { x: 0, y: 1 },
    down: { x: 0, y: -1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
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
  function hypot2(x, y) {
    return Math.sqrt(x * x + y * y);
  }
  function dist2seg(px, py, x0, y0, x1, y1) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const l2 = dx * dx + dy * dy;
    let t = l2 > 0 ? ((px - x0) * dx + (py - y0) * dy) / l2 : 0;
    t = clamp(t, 0, 1);
    return hypot2(px - (x0 + dx * t), py - (y0 + dy * t));
  }
  function xsRange(from, to, step) {
    const a = [];
    for (let x = from; x <= to; x += step) a.push(x);
    return a;
  }
  function xsGap(from, to, step, gapL, gapR) {
    const a = [];
    for (let x = from; x <= to; x += step) {
      if (x > gapL && x < gapR) continue;
      a.push(x);
    }
    return a;
  }
  function hang(y, xs, len) {
    return xs.map(function (x) {
      return { x: x, y: y, dir: "down", len: len };
    });
  }
  function comb(y, gapW, spacing, n, amp, spd, ph) {
    const a = [];
    const mv = { axis: "x", amp: amp, spd: spd, ph: ph || 0 };
    for (let i = 1; i <= n; i++) {
      a.push({
        x: CX - gapW * 0.5 - i * spacing,
        y: y,
        dir: "down",
        len: 40,
        mv: mv
      });
      a.push({
        x: CX + gapW * 0.5 + i * spacing,
        y: y,
        dir: "down",
        len: 40,
        mv: mv
      });
    }
    return a;
  }

  const STAGES = [
    {
      name: "初托",
      sub: "LIFT",
      hint: "按住吹泡升起来，对准中间缺口",
      toast: "按住吹泡，松手泄气",
      pad: { l: SHAFT_L + 10, r: SHAFT_R - 10, y: 18 },
      spawn: { x: CX, y: 44 },
      dock: { x: CX, y: 400, w: 168 },
      top: 478,
      spikes: hang(248, xsGap(214, 746, 26, 408, 552), 38)
    },
    {
      name: "窄门",
      sub: "GATE",
      hint: "太大过不去，松手泄气再钻",
      toast: "泄气变小，才能钻过窄门",
      pad: { l: SHAFT_L + 10, r: SHAFT_R - 10, y: 18 },
      spawn: { x: CX, y: 44 },
      dock: { x: CX, y: 500, w: 150 },
      top: 572,
      spikes: hang(210, xsGap(214, 746, 26, 388, 572), 36).concat(
        hang(370, xsRange(214, 448, 22).concat(xsRange(536, 746, 22)), 42)
      )
    },
    {
      name: "折线",
      sub: "ZIG",
      hint: "左缺口、右缺口，贴边会扎",
      toast: "先钻左边，再飘去右边",
      pad: { l: SHAFT_L + 10, r: SHAFT_R - 10, y: 18 },
      spawn: { x: CX, y: 44 },
      dock: { x: CX, y: 680, w: 150 },
      top: 752,
      spikes: hang(190, xsGap(214, 746, 24, 214, 404), 38).concat(
        hang(410, xsGap(214, 746, 24, 556, 746), 38),
        hang(600, xsGap(214, 746, 24, 408, 552), 36)
      )
    },
    {
      name: "游刺",
      sub: "SWEEP",
      hint: "等刺让开再吹上去",
      toast: "缺口在横移，对准再升",
      pad: { l: SHAFT_L + 10, r: SHAFT_R - 10, y: 18 },
      spawn: { x: CX, y: 44 },
      dock: { x: CX, y: 640, w: 150 },
      top: 712,
      spikes: hang(200, xsGap(214, 746, 26, 400, 560), 34).concat(
        comb(360, 108, 30, 5, 96, 0.88, 0),
        hang(560, xsGap(214, 746, 24, 410, 550), 36)
      )
    },
    {
      name: "仓顶",
      sub: "LOFT",
      hint: "泄气穿门，吹泡抢空档",
      toast: "最后一仓，泡要收得住",
      pad: { l: SHAFT_L + 10, r: SHAFT_R - 10, y: 18 },
      spawn: { x: CX, y: 44 },
      dock: { x: CX, y: 860, w: 140 },
      top: 932,
      spikes: hang(180, xsGap(214, 746, 24, 214, 400), 38).concat(
        hang(420, xsRange(214, 448, 22).concat(xsRange(536, 746, 22)), 42),
        comb(620, 108, 30, 5, 96, 0.88, 0.5),
        hang(800, xsGap(214, 746, 24, 408, 552), 36),
        { x: SHAFT_L + 4, y: 300, dir: "right", len: 28 },
        { x: SHAFT_R - 4, y: 300, dir: "left", len: 28 },
        { x: SHAFT_L + 4, y: 700, dir: "right", len: 28 },
        { x: SHAFT_R - 4, y: 700, dir: "left", len: 28 }
      )
    }
  ];

  function liveSpike(sp, t) {
    let x = sp.x;
    let y = sp.y;
    if (sp.mv) {
      const s = Math.sin(t * sp.mv.spd + (sp.mv.ph || 0));
      if (sp.mv.axis === "y") y += s * sp.mv.amp;
      else x += s * sp.mv.amp;
    }
    return { x: x, y: y, dir: sp.dir, len: sp.len };
  }

  function spikeSeg(sp, t) {
    const s = liveSpike(sp, t);
    const d = DIR[s.dir] || DIR.down;
    return {
      x0: s.x,
      y0: s.y,
      x1: s.x + d.x * s.len,
      y1: s.y + d.y * s.len
    };
  }

  function crateOf(st) {
    const cy = st.by + st.r * CRATE_LIFT;
    return { cx: st.bx, cy: cy, hw: CRATE_W * 0.5, hh: CRATE_H * 0.5 };
  }

  function makeState(stageIndex, lives) {
    const sg = STAGES[stageIndex] || STAGES[0];
    return {
      stage: stageIndex || 0,
      lives: lives == null ? LIVES : lives,
      livesMax: LIVES,
      bx: sg.spawn.x,
      by: sg.spawn.y,
      vx: 0,
      vy: 0,
      r: R_START,
      phase: "play",
      phaseT: 0,
      lock: LOCK,
      why: "",
      t: 0,
      clock: 0,
      shake: 0,
      flash: 0,
      flashRgb: "0,240,255",
      camY: sg.spawn.y,
      bestY: sg.spawn.y,
      fallRot: 0,
      popR: R_START,
      blow: false,
      prevBlow: false,
      taught: false,
      warned: false,
      lastWarn: -9,
      wobble: 0,
      docked: 0
    };
  }

  function hitsHazard(st, sg) {
    const rHit = st.r + SPIKE_R - 2.4;
    const crate = crateOf(st);
    const cr = 16.5;
    const spikes = sg.spikes;
    for (let i = 0; i < spikes.length; i++) {
      const seg = spikeSeg(spikes[i], st.clock);
      if (dist2seg(st.bx, st.by, seg.x0, seg.y0, seg.x1, seg.y1) < rHit) return "spike";
      if (dist2seg(crate.cx, crate.cy, seg.x0, seg.y0, seg.x1, seg.y1) < cr) return "crate";
    }
    return null;
  }

  function onDock(st, dock) {
    const b = crateOf(st);
    if (Math.abs(b.cx - dock.x) > dock.w * 0.5 - 6) return false;
    const top = b.cy + b.hh;
    const bot = b.cy - b.hh;
    return top > dock.y - 8 && bot < dock.y + 30;
  }

  function stepRun(st, input, dt) {
    const sg = STAGES[st.stage];
    st.clock += dt;
    st.shake = Math.max(0, st.shake - dt * 16);
    st.flash = Math.max(0, st.flash - dt * 1.8);
    st.wobble = Math.max(0, st.wobble - dt * 2.4);

    if (st.phase !== "play") {
      st.phaseT += dt;
      if (st.phase === "die") {
        st.popR = Math.max(0, st.popR - 90 * dt);
        st.vy -= GRAV * 1.35 * dt;
        st.by += st.vy * dt;
        st.bx += st.vx * dt + Math.sin(st.clock * 11) * 10 * dt;
        st.fallRot += dt * 3.2;
        st.r = Math.max(0, st.r - 70 * dt);
      } else if (st.phase === "clear") {
        st.r = lerp(st.r, R_HOVER * 0.86, 1 - Math.exp(-3.2 * dt));
        st.bx = lerp(st.bx, sg.dock.x, 1 - Math.exp(-4 * dt));
        const ty = sg.dock.y - st.r * CRATE_LIFT - CRATE_H * 0.35;
        st.by = lerp(st.by, ty, 1 - Math.exp(-3.4 * dt));
        st.vx *= Math.exp(-6 * dt);
        st.vy *= Math.exp(-6 * dt);
        st.docked = Math.min(1, st.docked + dt * 1.4);
      }
      st.camY = lerp(st.camY, st.by, 0.12);
      return null;
    }

    st.t += dt;
    st.lock = Math.max(0, st.lock - dt);
    const locked = st.lock > 0;
    const blow = !locked && !!input.blow;
    st.prevBlow = st.blow;
    st.blow = blow;

    if (blow) st.r += INFLATE * dt;
    else st.r -= DEFLATE * dt;
    st.r = clamp(st.r, R_MIN, R_MAX + 0.35);

    if (st.r >= R_MAX) {
      st.phase = "die";
      st.phaseT = 0;
      st.why = "big";
      st.shake = 11;
      st.flash = 0.55;
      st.flashRgb = "255,61,184";
      st.popR = st.r;
      st.vy = Math.min(st.vy, 20);
      return "die";
    }

    const lift = BUOY_K * st.r;
    st.vy += (lift - GRAV) * dt;
    st.vy *= Math.exp(-VDAMP * dt);
    st.vy = clamp(st.vy, -MAX_VY, MAX_VY);

    let ax = 0;
    if (!locked) {
      if (input.tx != null && isFinite(input.tx)) {
        const dx = input.tx - st.bx;
        ax = clamp(dx * 3.4, -1.15, 1.15);
      } else {
        ax = input.ax || 0;
      }
    }
    if (ax) st.vx += ax * ACC * dt;
    else st.vx *= Math.exp(-DAMP * dt);
    st.vx = clamp(st.vx, -MAX_VX, MAX_VX);

    st.bx += st.vx * dt;
    st.by += st.vy * dt;

    const minX = SHAFT_L + st.r + 6;
    const maxX = SHAFT_R - st.r - 6;
    if (st.bx < minX) {
      st.bx = minX;
      st.vx = Math.abs(st.vx) * 0.35;
    } else if (st.bx > maxX) {
      st.bx = maxX;
      st.vx = -Math.abs(st.vx) * 0.35;
    }

    const pad = sg.pad;
    const onPad =
      st.bx > pad.l + 10 &&
      st.bx < pad.r - 10 &&
      st.by - st.r <= pad.y + 5;
    if (onPad && st.vy < 0) {
      st.by = pad.y + st.r;
      st.vy = 0;
    }

    if (st.by + st.r > sg.top) {
      st.by = sg.top - st.r;
      if (st.vy > 0) st.vy *= -0.25;
    }

    if (st.by > st.bestY) st.bestY = st.by;

    if (st.r > R_WARN) st.wobble = 1;

    const hit = hitsHazard(st, sg);
    if (hit) {
      st.phase = "die";
      st.phaseT = 0;
      st.why = hit;
      st.shake = 12;
      st.flash = 0.58;
      st.flashRgb = "255,61,184";
      st.popR = st.r;
      st.vy = Math.min(st.vy, 40);
      return "die";
    }

    if (onDock(st, sg.dock)) {
      st.phase = "clear";
      st.phaseT = 0;
      st.why = "dock";
      st.flash = 0.5;
      st.flashRgb = "0,240,255";
      st.docked = 0.01;
      return "clear";
    }
    return null;
  }

  function hoverBot(st) {
    const sg = STAGES[st.stage];
    let target = sg.dock.x;
    let rAim = 32.5;
    const y = st.by;
    if (st.stage === 1) {
      if (y > 310 && y < 430) rAim = 31.1;
    } else if (st.stage === 2) {
      if (y < 250) target = 308;
      else if (y < 500) target = 652;
      else target = CX;
    } else if (st.stage === 3) {
      if (y > 250 && y < 470) {
        target = CX + Math.sin(st.clock * 0.88) * 96;
        if (Math.abs(st.bx - target) > 24) rAim = 30.2;
      } else target = CX;
    } else if (st.stage === 4) {
      if (y < 230) target = 308;
      else if (y < 540) {
        target = CX;
        if (y > 360 && y < 480) rAim = 31.1;
      } else if (y < 760) {
        target = CX + Math.sin(st.clock * 0.88 + 0.5) * 96;
        if (Math.abs(st.bx - target) > 24) rAim = 30.2;
      } else target = CX;
    }
    const blow = st.r < rAim;
    const ax = st.bx < target - 6 ? 1 : st.bx > target + 6 ? -1 : 0;
    return { blow: blow, ax: ax, tx: target };
  }

  function simulate(stageIndex, botFn, seconds) {
    const st = makeState(stageIndex, 1);
    st.lock = 0;
    let t = 0;
    const limit = seconds || 40;
    while (t < limit && st.phase === "play") {
      stepRun(st, botFn(st), STEP);
      t += STEP;
    }
    return {
      phase: st.phase,
      y: Math.round(st.by),
      t: Math.round(t * 10) / 10,
      r: Math.round(st.r * 10) / 10,
      why: st.why
    };
  }

  if (typeof document === "undefined") {
    const r = simulate(0, hoverBot, 40);
    const stuck = simulate(0, function () {
      return { blow: false, ax: 0 };
    }, 8);
    const pop = simulate(0, function () {
      return { blow: true, ax: 0 };
    }, 8);
    let stagesOk = true;
    const logs = [];
    for (let i = 0; i < STAGES.length; i++) {
      const s = simulate(i, hoverBot, 70);
      const pass = s.phase === "clear";
      if (!pass) stagesOk = false;
      logs.push((pass ? "OK" : "TRY") + " stage " + i + " " + STAGES[i].sub + " " + s.phase + " t=" + s.t + " y=" + s.y + " why=" + s.why);
    }
    {
      const st4 = makeState(4, 1);
      st4.lock = 0;
      let t = 0;
      let lastLog = -1;
      while (t < 20 && st4.phase === "play") {
        stepRun(st4, hoverBot(st4), STEP);
        t += STEP;
        const sec = Math.floor(t);
        if (sec !== lastLog) {
          lastLog = sec;
          logs.push("  t=" + sec + " x=" + st4.bx.toFixed(0) + " y=" + st4.by.toFixed(0) + " r=" + st4.r.toFixed(1) + " vy=" + st4.vy.toFixed(0));
        }
      }
      logs.push("  end " + st4.phase + " t=" + t.toFixed(1) + " x=" + st4.bx.toFixed(0) + " y=" + st4.by.toFixed(0) + " r=" + st4.r.toFixed(1) + " why=" + st4.why);
      const sg4 = STAGES[4];
      let best = 1e9;
      let info = "";
      for (let i = 0; i < sg4.spikes.length; i++) {
        const seg = spikeSeg(sg4.spikes[i], st4.clock);
        const d1 = dist2seg(st4.bx, st4.by, seg.x0, seg.y0, seg.x1, seg.y1);
        const crate = crateOf(st4);
        const d2 = dist2seg(crate.cx, crate.cy, seg.x0, seg.y0, seg.x1, seg.y1);
        const d = Math.min(d1, d2);
        if (d < best) {
          best = d;
          info = "spike[" + i + "] " + sg4.spikes[i].dir + " base=" + sg4.spikes[i].x + "," + sg4.spikes[i].y + " len=" + sg4.spikes[i].len + " dBub=" + d1.toFixed(1) + " dCrate=" + d2.toFixed(1) + " seg=" + seg.x0.toFixed(0) + "," + seg.y0.toFixed(0) + "->" + seg.x1.toFixed(0) + "," + seg.y1.toFixed(0);
        }
      }
      logs.push("  nearest " + info + " best=" + best.toFixed(1) + " rHit=" + (st4.r + SPIKE_R - 2.4).toFixed(1));
    }
    const ok = r.phase === "clear" && stuck.phase !== "clear" && pop.phase === "die" && stagesOk;
    console.log((r.phase === "clear" ? "OK" : "TRY") + " bubble-lift t=" + r.t + " y=" + r.y + " r=" + r.r);
    console.log((stuck.phase !== "clear" ? "OK" : "TRY") + " never-blow stays " + stuck.phase + " y=" + stuck.y);
    console.log((pop.phase === "die" ? "OK" : "TRY") + " always-blow pops why=" + pop.why);
    logs.forEach(function (line) { console.log(line); });
    if (!ok) process.exitCode = 1;
    else console.log("bubble-lift lift ok");
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
  const dockLabel = document.getElementById("dock-label");
  const sizeWrap = document.getElementById("size-wrap");
  const sizeFill = document.getElementById("size-fill");
  const sizeMark = document.getElementById("size-mark");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const padEl = document.getElementById("pad");
  const btnLeft = document.getElementById("btn-left");
  const btnRight = document.getElementById("btn-right");
  const btnBlow = document.getElementById("btn-blow");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) {
    hintEl.textContent = "按住「吹」升起 · 左右平移 · 松手泄气钻刺";
    padEl.style.display = "flex";
  }

  sizeMark.style.left = ((R_HOVER - R_MIN) / (R_MAX - R_MIN)) * 100 + "%";

  const keys = { left: false, right: false, blow: false };
  const pad = { left: false, right: false, blow: false };
  const pointers = new Map();

  const view = { scale: 1, ox: 0, oy: 0, cssW: 1, cssH: 1, dpr: 1 };
  const stars = [];
  const windows = [];
  const motes = [];
  const particles = [];
  const suds = [];

  let mode = "title";
  let overlayKind = "title";
  let frozen = true;
  let paused = false;
  let toastT = 0;
  let last = 0;
  let acc = 0;
  let hudTick = 0;
  let runGen = 0;
  let st = makeState(0);
  let demoReset = 0;

  function makeStars() {
    stars.length = 0;
    for (let i = 0; i < 70; i++) {
      stars.push({
        x: rand(0, VW),
        y: rand(0, 1100),
        r: rand(0.25, 1.5),
        a: rand(0.08, 0.42),
        p: rand(0, TAU)
      });
    }
  }
  function makeWindows() {
    windows.length = 0;
    for (let k = 0; k < 20; k++) {
      windows.push({
        side: k % 2 === 0 ? -1 : 1,
        y: 50 + k * 72,
        h: 22 + (k % 4) * 5,
        mag: k % 3 !== 1,
        p: k * 0.7
      });
    }
  }
  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 26; i++) {
      motes.push({
        x: rand(SHAFT_L + 16, SHAFT_R - 16),
        y: rand(0, 1000),
        s: rand(0.7, 2.1),
        v: rand(10, 26),
        a: rand(0.05, 0.16),
        p: rand(0, TAU)
      });
    }
  }
  makeStars();
  makeWindows();
  makeMotes();

  const SFX = {
    ctx: null,
    master: null,
    hiss: null,
    hissGain: null,
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
      if (this.ctx.state === "suspended") this.ctx.resume();
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
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.012);
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
      f.frequency.value = freq || 900;
      f.Q.value = 0.7;
      const g = this.ctx.createGain();
      g.gain.value = vol;
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start();
    },
    start: function () {
      this.ensure();
      this.beep(280, 0.12, "sine", 0.06, 520);
      this.beep(420, 0.18, "triangle", 0.04, 760);
    },
    puff: function () {
      this.ensure();
      this.noise(0.08, 0.05, 1400);
      this.beep(480, 0.05, "sine", 0.03, 720);
    },
    warn: function () {
      this.ensure();
      this.beep(240, 0.1, "square", 0.03, 140);
    },
    pop: function () {
      this.ensure();
      this.noise(0.22, 0.12, 700);
      this.beep(320, 0.36, "sine", 0.08, 70);
    },
    dock: function () {
      this.ensure();
      this.beep(520, 0.12, "triangle", 0.07, 740);
      this.beep(780, 0.2, "sine", 0.06, 980);
    },
    win: function () {
      this.ensure();
      this.beep(440, 0.16, "sine", 0.08, 660);
      const self = this;
      const g = runGen;
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(660, 0.18, "sine", 0.08, 880);
      }, 90);
      setTimeout(function () {
        if (g !== runGen) return;
        self.beep(880, 0.32, "sine", 0.1, 1320);
      }, 200);
    },
    lose: function () {
      this.ensure();
      this.beep(180, 0.55, "sawtooth", 0.08, 50);
      this.beep(90, 0.7, "square", 0.04, 40);
    },
    tickHiss: function (blowing) {
      if (!this.ctx || this.muted) return;
      if (!this.hiss) {
        const n = this.ctx.sampleRate * 1;
        const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const f = this.ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 1600;
        f.Q.value = 0.55;
        const g = this.ctx.createGain();
        g.gain.value = 0.0001;
        src.connect(f);
        f.connect(g);
        g.connect(this.master);
        src.start();
        this.hiss = f;
        this.hissGain = g;
      }
      const t = this.ctx.currentTime;
      this.hissGain.gain.setTargetAtTime(blowing ? 0.045 : 0.0001, t, 0.08);
      if (this.hiss) this.hiss.frequency.setTargetAtTime(blowing ? 1700 : 900, t, 0.12);
    },
    hush: function () {
      if (!this.hissGain || !this.ctx) return;
      this.hissGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.12);
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
    if (SFX.master) SFX.master.gain.value = m ? 0 : 0.28;
    if (m) SFX.hush();
    syncMuteBtn();
    try {
      localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    } catch (_) { /* ignore */ }
  }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 150) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j * 0.55, spec.j * 0.55),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life,
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        kind: spec.kind || 0
      });
    }
  }

  function showToast(text, warn) {
    toastEl.textContent = text;
    toastEl.classList.toggle("warn", !!warn);
    toastEl.classList.remove("hidden");
    toastT = 1.7;
  }

  function renderHud() {
    const sg = STAGES[st.stage];
    if (mode === "title") {
      stageLabel.textContent = "吹泡托货";
      dockLabel.textContent = "—";
      dockLabel.classList.remove("warn");
      sizeFill.style.width = "40%";
      sizeWrap.classList.remove("warn");
    } else {
      stageLabel.textContent = sg.name + " · " + sg.sub;
      dockLabel.textContent = (st.stage + 1) + " / " + STAGES.length;
      const hot = st.r > R_WARN && (mode === "play" || st.phase === "play");
      dockLabel.classList.toggle("warn", hot);
      const t = clamp((st.r - R_MIN) / (R_MAX - R_MIN), 0, 1);
      sizeFill.style.width = t * 100 + "%";
      sizeWrap.classList.toggle("warn", hot);
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
      ovKicker.textContent = "BUBBLE";
      ovTitle.textContent = "气泡";
      ovLead.innerHTML = "按住吹泡，货箱会被托起来。<br />松手泄气变小，钻过尖刺，送上卸货台。";
      ovOps.textContent = coarse
        ? "按住「吹」升起 · 左 / 右平移 · 松手钻刺 · M 静音"
        : "空格吹泡 · A D / ← → 平移 · 点住画面也可 · M 静音";
      ovBtn.textContent = "吹泡";
    } else if (kind === "lose") {
      ovKicker.textContent = "POP";
      ovTitle.textContent = "扎破了";
      const why =
        st.why === "big" ? "泡吹太大，自己破了。" :
        st.why === "crate" ? "货箱蹭到尖刺。" :
        "肥皂泡扎在刺上。";
      ovLead.textContent = why + " 送到 " + (st.stage + 1) + " / " + STAGES.length + " 仓。泡要收得住。";
      ovOps.textContent = "R 重开 · M 静音";
      ovBtn.textContent = "再托一次";
    } else if (kind === "win") {
      ovKicker.textContent = "DOCK";
      ovTitle.textContent = "满仓";
      ovLead.textContent = "五箱货都托过尖刺，卸货台亮着青光。泡还在晃。";
      ovOps.textContent = "用时 " + st.t.toFixed(1) + " 秒 · " + STAGES.length + " 仓";
      ovBtn.textContent = "再来一局";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    frozen = false;
    overlayKind = "none";
    panel.classList.remove("win", "lose");
  }

  function clearFx() {
    particles.length = 0;
    suds.length = 0;
  }

  function loadTitle() {
    mode = "title";
    st = makeState(0);
    st.lock = 0;
    demoReset = 0;
    clearFx();
    setOverlay("title");
    renderHud();
    hintEl.textContent = coarse
      ? "按住吹泡升起 · 松手泄气钻刺 · 别让泡扎破"
      : "按住吹泡升起 · 松手泄气钻刺 · 别让泡扎破";
  }

  function startPlay() {
    runGen += 1;
    SFX.start();
    mode = "play";
    acc = 0;
    pointers.clear();
    keys.left = false;
    keys.right = false;
    keys.blow = false;
    pad.left = false;
    pad.right = false;
    pad.blow = false;
    btnLeft.classList.remove("held");
    btnRight.classList.remove("held");
    btnBlow.classList.remove("held");
    st = makeState(0, LIVES);
    st.flash = 0.28;
    clearFx();
    hideOverlay();
    renderHud();
    showToast(STAGES[0].toast);
    hintEl.textContent = coarse
      ? "按住「吹」升起 · 太大要破 · 太小会掉"
      : "空格吹泡 · A D 平移 · 点住画面也可";
  }

  function loadStageKeep(index, lives) {
    const taught = st.taught;
    const tAll = st.t;
    st = makeState(index, lives);
    st.taught = taught;
    st.t = tAll;
    st.lock = 0.42;
    st.flash = 0.34;
    st.flashRgb = "0,240,255";
    clearFx();
  }

  function respawn() {
    const lives = st.lives;
    const taught = true;
    const tAll = st.t;
    const si = st.stage;
    st = makeState(si, lives);
    st.taught = taught;
    st.t = tAll;
    st.lock = 0.5;
    st.flash = 0.32;
    st.flashRgb = "0,240,255";
    clearFx();
    showToast("还剩 " + st.lives + " 命 · " + STAGES[si].name, true);
    renderHud();
  }

  function onDieDone() {
    st.lives -= 1;
    if (st.lives <= 0) {
      mode = "lose";
      SFX.hush();
      SFX.lose();
      setOverlay("lose");
      renderHud();
      return;
    }
    respawn();
  }

  function onClearDone() {
    if (st.stage >= STAGES.length - 1) {
      mode = "win";
      SFX.hush();
      SFX.win();
      setOverlay("win");
      renderHud();
      return;
    }
    const lives = st.lives;
    const next = st.stage + 1;
    loadStageKeep(next, lives);
    showToast(STAGES[next].name + " · " + STAGES[next].hint);
    renderHud();
    hintEl.textContent = STAGES[next].hint;
  }

  function gatherInput() {
    let blow = keys.blow || pad.blow;
    let ax = 0;
    if (keys.left || pad.left) ax -= 1;
    if (keys.right || pad.right) ax += 1;
    let tx = null;
    if (pointers.size) {
      blow = true;
      let sx = 0;
      let n = 0;
      pointers.forEach(function (p) {
        sx += p.x;
        n += 1;
      });
      tx = sx / n;
    }
    return { blow: blow, ax: ax, tx: tx };
  }

  function toSY(wy) {
    return VH * 0.62 - (wy - st.camY);
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

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, "#12081c");
    g.addColorStop(0.45, "#070412");
    g.addColorStop(1, "#0c0614");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    const mag = ctx.createRadialGradient(120, VH + 30, 8, 120, VH + 30, 360);
    mag.addColorStop(0, "rgba(255,61,184,0.14)");
    mag.addColorStop(1, "rgba(255,61,184,0)");
    ctx.fillStyle = mag;
    ctx.fillRect(0, 0, VW, VH);

    const cyan = ctx.createRadialGradient(820, 30, 8, 820, 30, 280);
    cyan.addColorStop(0, "rgba(0,240,255,0.1)");
    cyan.addColorStop(1, "rgba(0,240,255,0)");
    ctx.fillStyle = cyan;
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawStars() {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const sy = toSY(s.y);
      if (sy < -8 || sy > VH + 8) continue;
      const tw = 0.5 + Math.sin(st.clock * 2.1 + s.p) * 0.5;
      ctx.fillStyle = "rgba(230,236,255," + (s.a * tw) + ")";
      ctx.beginPath();
      ctx.arc(s.x, sy, s.r, 0, TAU);
      ctx.fill();
    }
  }

  function drawShaft() {
    ctx.fillStyle = "#090614";
    ctx.fillRect(0, 0, SHAFT_L, VH);
    ctx.fillRect(SHAFT_R, 0, VW - SHAFT_R, VH);

    ctx.fillStyle = "rgba(255,61,184,0.08)";
    ctx.fillRect(SHAFT_L - 11, 0, 11, VH);
    ctx.fillStyle = "rgba(0,240,255,0.08)";
    ctx.fillRect(SHAFT_R, 0, 11, VH);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(SHAFT_L, 0);
    ctx.lineTo(SHAFT_L, VH);
    ctx.moveTo(SHAFT_R, 0);
    ctx.lineTo(SHAFT_R, VH);
    ctx.stroke();

    const back = ctx.createLinearGradient(SHAFT_L, 0, SHAFT_R, 0);
    back.addColorStop(0, "rgba(255,61,184,0.05)");
    back.addColorStop(0.5, "rgba(8,6,18,0)");
    back.addColorStop(1, "rgba(0,240,255,0.05)");
    ctx.fillStyle = back;
    ctx.fillRect(SHAFT_L, 0, SHAFT_R - SHAFT_L, VH);

    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    const y0 = st.camY - 80;
    const y1 = st.camY + VH;
    const g0 = Math.floor(y0 / 64) * 64;
    for (let gy = g0; gy < y1; gy += 64) {
      const sy = toSY(gy);
      ctx.beginPath();
      ctx.moveTo(SHAFT_L + 8, sy);
      ctx.lineTo(SHAFT_R - 8, sy);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let y = 18; y < VH; y += 46) {
      ctx.beginPath();
      ctx.arc(SHAFT_L - 5, y, 2.1, 0, TAU);
      ctx.arc(SHAFT_R + 5, y, 2.1, 0, TAU);
      ctx.fill();
    }
  }

  function drawWindows() {
    for (let i = 0; i < windows.length; i++) {
      const w = windows[i];
      const sy = toSY(w.y);
      if (sy < -40 || sy > VH + 40) continue;
      const x = w.side < 0 ? 42 : VW - 106;
      const pulse = 0.42 + Math.sin(st.clock * 1.3 + w.p) * 0.32;
      ctx.save();
      drawRoundRect(x, sy - w.h * 0.5, 58, w.h, 4);
      ctx.fillStyle = w.mag
        ? "rgba(255,61,184," + (0.08 + pulse * 0.16) + ")"
        : "rgba(0,240,255," + (0.08 + pulse * 0.16) + ")";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawBeams(sg) {
    const seen = {};
    for (let i = 0; i < sg.spikes.length; i++) {
      const sp = sg.spikes[i];
      if (sp.dir !== "down") continue;
      const y = sp.y;
      if (seen[y]) continue;
      seen[y] = 1;
      const sy = toSY(y);
      if (sy < -20 || sy > VH + 20) continue;
      ctx.fillStyle = "rgba(18, 12, 32, 0.92)";
      ctx.fillRect(SHAFT_L - 8, sy - 6, SHAFT_R - SHAFT_L + 16, 12);
      const hg = ctx.createLinearGradient(SHAFT_L, sy, SHAFT_R, sy);
      hg.addColorStop(0, "rgba(255,61,184,0.35)");
      hg.addColorStop(0.5, "rgba(255,255,255,0.12)");
      hg.addColorStop(1, "rgba(0,240,255,0.3)");
      ctx.fillStyle = hg;
      ctx.fillRect(SHAFT_L - 8, sy - 6, SHAFT_R - SHAFT_L + 16, 3);
    }
  }

  function drawPad(sg) {
    const pad = sg.pad;
    const y = toSY(pad.y);
    const x = pad.l;
    const w = pad.r - pad.l;
    ctx.fillStyle = "rgba(12, 18, 32, 0.9)";
    drawRoundRect(x, y - 2, w, 16, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,240,255,0.35)";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "rgba(0,240,255,0.12)";
    ctx.fillRect(x + 8, y + 4, w - 16, 4);
  }

  function drawDock(sg) {
    const d = sg.dock;
    const y = toSY(d.y);
    const x = d.x - d.w * 0.5;
    const pulse = 0.55 + Math.sin(st.clock * 2.4) * 0.25;
    ctx.save();
    ctx.shadowColor = "rgba(0,240,255,0.45)";
    ctx.shadowBlur = 18;
    drawRoundRect(x, y - 4, d.w, 18, 5);
    ctx.fillStyle = "rgba(8, 28, 36, 0.92)";
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(0,240,255," + (0.55 + pulse * 0.35) + ")";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(0,240,255,0.14)";
    ctx.fillRect(x + 10, y + 4, d.w - 20, 5);
    ctx.fillStyle = "rgba(232,250,255,0.85)";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("卸 货", d.x, y - 10);
    ctx.restore();

    ctx.strokeStyle = "rgba(0,240,255,0.2)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([6, 7]);
    ctx.beginPath();
    ctx.moveTo(x + 8, y + 22);
    ctx.lineTo(x + d.w - 8, y + 22);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawSpikes(sg) {
    for (let i = 0; i < sg.spikes.length; i++) {
      const live = liveSpike(sg.spikes[i], st.clock);
      const d = DIR[live.dir] || DIR.down;
      const x0 = live.x;
      const y0 = live.y;
      const x1 = live.x + d.x * live.len;
      const y1 = live.y + d.y * live.len;
      const sy0 = toSY(y0);
      const sy1 = toSY(y1);
      if ((sy0 < -40 && sy1 < -40) || (sy0 > VH + 40 && sy1 > VH + 40)) continue;
      const px = -d.y;
      const py = d.x;
      const bw = 8.5;
      ctx.beginPath();
      ctx.moveTo(x1, sy1);
      ctx.lineTo(x0 + px * bw, sy0 - py * bw);
      ctx.lineTo(x0 - px * bw, sy0 + py * bw);
      ctx.closePath();
      const grd = ctx.createLinearGradient(x0, sy0, x1, sy1);
      grd.addColorStop(0, "#5a1840");
      grd.addColorStop(0.55, "#ff3db8");
      grd.addColorStop(1, "#ffe6f4");
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,180,230,0.55)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x1, sy1, 2.1, 0, TAU);
      ctx.fillStyle = "#fff0f8";
      ctx.fill();
    }
  }

  function drawMotes() {
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const sy = toSY(m.y);
      if (sy < -8 || sy > VH + 8) continue;
      ctx.fillStyle = "rgba(0,240,255," + m.a + ")";
      ctx.beginPath();
      ctx.arc(m.x + Math.sin(st.clock * 0.7 + m.p) * 6, sy, m.s, 0, TAU);
      ctx.fill();
    }
  }

  function drawBubble() {
    if (st.phase === "die" && st.popR <= 1) return;
    const r = st.phase === "die" ? Math.max(st.popR, 1) : st.r;
    const wob = st.wobble > 0 ? Math.sin(st.clock * 22) * (2.2 * st.wobble) : 0;
    const x = st.bx + wob * 0.4;
    const y = toSY(st.by);
    const hot = st.r > R_WARN && st.phase === "play";

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 10, 0, TAU);
    ctx.fillStyle = hot
      ? "rgba(255,61,184,0.14)"
      : "rgba(0,240,255,0.1)";
    ctx.fill();

    const g = ctx.createRadialGradient(x - r * 0.28, y - r * 0.32, r * 0.1, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.22)");
    g.addColorStop(0.35, "rgba(0,240,255,0.16)");
    g.addColorStop(0.72, "rgba(255,61,184,0.12)");
    g.addColorStop(1, "rgba(0,240,255,0.05)");
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = hot ? "rgba(255,61,184,0.85)" : "rgba(0,240,255,0.8)";
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(x - r * 0.32, y - r * 0.38, r * 0.22, r * 0.12, -0.5, 0, TAU);
    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r * 0.78, 0.2, 1.4);
    ctx.strokeStyle = "rgba(255,61,184,0.28)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    if (st.blow && st.phase === "play") {
      ctx.beginPath();
      ctx.moveTo(x - 5, y + r + 4);
      ctx.lineTo(x, y + r + 16 + Math.sin(st.clock * 18) * 3);
      ctx.lineTo(x + 5, y + r + 4);
      ctx.strokeStyle = "rgba(0,240,255,0.55)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCrate() {
    const b = crateOf(st);
    const x = b.cx;
    const y = toSY(b.cy);
    const rot = st.phase === "die" ? st.fallRot : Math.sin(st.clock * 2.2) * 0.04;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const w = CRATE_W;
    const h = CRATE_H;
    ctx.fillStyle = "#4a1836";
    ctx.fillRect(-w * 0.5 + 4, -h * 0.5 + 3, w, h);
    drawRoundRect(-w * 0.5, -h * 0.5, w, h, 3);
    const cg = ctx.createLinearGradient(-w * 0.5, -h * 0.5, w * 0.5, h * 0.5);
    cg.addColorStop(0, "#ff6ec8");
    cg.addColorStop(0.45, "#c42a86");
    cg.addColorStop(1, "#6a1848");
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,227,107,0.55)";
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.strokeStyle = "rgba(0,240,255,0.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-w * 0.5 + 3, 0);
    ctx.lineTo(w * 0.5 - 3, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,227,107,0.8)";
    ctx.fillRect(-5, -h * 0.5 + 4, 10, 4);

    ctx.fillStyle = "#f4f0ff";
    ctx.beginPath();
    ctx.arc(0, -h * 0.5 - 7, 3.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(-2.4, -h * 0.5 - 4, 4.8, 7);
    ctx.restore();
  }

  function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const a = p.life / p.max;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.kind === 1 ? "#ff3db8" : p.kind === 2 ? "#ffe36b" : "#00f0ff";
      ctx.beginPath();
      ctx.arc(p.x, toSY(p.y), p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < suds.length; i++) {
      const s = suds[i];
      ctx.strokeStyle = "rgba(0,240,255," + (s.life * 0.45) + ")";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(s.x, toSY(s.y), s.r, 0, TAU);
      ctx.stroke();
    }
  }

  function drawVignette() {
    const v = ctx.createRadialGradient(VW * 0.5, VH * 0.5, 160, VW * 0.5, VH * 0.5, 520);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(5,3,12,0.55)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VW, VH);
  }

  function drawFlash() {
    if (st.flash <= 0) return;
    ctx.fillStyle = "rgba(" + st.flashRgb + "," + (st.flash * 0.28) + ")";
    ctx.fillRect(0, 0, VW, VH);
  }

  function spawnFx(dt) {
    if (st.phase === "play" && st.blow && Math.random() < 0.7) {
      emit(1, {
        x: st.bx,
        y: st.by - st.r * 0.2,
        j: st.r * 0.5,
        vx0: -18,
        vx1: 18,
        vy0: 8,
        vy1: 42,
        life: 0.45,
        r0: 1.1,
        r1: 2.6,
        kind: 0
      });
    }
    if (st.phase === "play" && st.blow && Math.random() < 0.18) {
      if (suds.length > 24) suds.shift();
      suds.push({
        x: st.bx + rand(-8, 8),
        y: st.by - st.r * 0.1,
        r: rand(3, 7),
        life: 1
      });
    }
    for (let i = 0; i < motes.length; i++) {
      motes[i].y += motes[i].v * dt;
      if (motes[i].y > st.camY + 380) motes[i].y = st.camY - 140;
    }
  }

  function stepParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 48 * dt;
      p.vx *= 0.98;
    }
    for (let i = suds.length - 1; i >= 0; i--) {
      const s = suds[i];
      s.life -= dt * 1.6;
      s.r += 22 * dt;
      s.y += 12 * dt;
      if (s.life <= 0) suds.splice(i, 1);
    }
  }

  function playEvents() {
    if (st.phase !== "play") return;
    if (st.blow && !st.prevBlow) SFX.puff();
    if (st.r > R_WARN) {
      if (!st.warned) {
        st.warned = true;
        showToast("再吹要破了", true);
      }
      if (st.t - st.lastWarn > 0.85) {
        st.lastWarn = st.t;
        SFX.warn();
      }
    } else if (st.r < R_WARN * 0.9) {
      st.warned = false;
    }
    if (!st.taught && st.t > 2.1) {
      st.taught = true;
      showToast("松手泄气，才能钻窄门");
    }
  }

  function burstPop() {
    emit(26, {
      x: st.bx,
      y: st.by,
      j: 14,
      vx0: -140,
      vx1: 140,
      vy0: -80,
      vy1: 90,
      life: 0.7,
      r0: 1.4,
      r1: 4.2,
      kind: 1
    });
    emit(10, {
      x: st.bx,
      y: st.by,
      j: 8,
      vx0: -70,
      vx1: 70,
      vy0: -40,
      vy1: 50,
      life: 0.5,
      r0: 1.2,
      r1: 3,
      kind: 0
    });
  }

  function burstDock() {
    const d = STAGES[st.stage].dock;
    emit(28, {
      x: d.x,
      y: d.y + 8,
      j: 22,
      vx0: -90,
      vx1: 90,
      vy0: -20,
      vy1: 80,
      life: 0.8,
      r0: 1.5,
      r1: 4.2,
      kind: 0
    });
    emit(8, {
      x: d.x,
      y: d.y,
      j: 10,
      vx0: -40,
      vx1: 40,
      vy0: 10,
      vy1: 50,
      life: 0.55,
      r0: 1.2,
      r1: 2.8,
      kind: 2
    });
  }

  function draw() {
    fit();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.fillStyle = "#03010a";
    ctx.fillRect(0, 0, view.cssW, view.cssH);

    ctx.save();
    ctx.translate(view.ox, view.oy);
    ctx.scale(view.scale, view.scale);
    if (st.shake > 0.2) {
      ctx.translate(rand(-st.shake, st.shake), rand(-st.shake, st.shake) * 0.35);
    }
    ctx.beginPath();
    ctx.rect(0, 0, VW, VH);
    ctx.clip();

    const sg = STAGES[st.stage];
    drawSky();
    drawStars();
    drawShaft();
    drawWindows();
    drawBeams(sg);
    drawPad(sg);
    drawDock(sg);
    drawMotes();
    drawSpikes(sg);
    drawParticles();
    drawBubble();
    drawCrate();
    drawVignette();
    drawFlash();

    if (paused && mode === "play") {
      ctx.fillStyle = "rgba(5,3,12,0.45)";
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = "#c9c6e8";
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("暂停", VW * 0.5, VH * 0.5);
    }

    ctx.restore();
  }

  function titleTick(dt) {
    demoReset += dt;
    const inp = hoverBot(st);
    st.lock = 0;
    stepRun(st, inp, dt);
    if (st.phase !== "play" || st.by > 360 || demoReset > 16) {
      st = makeState(0);
      st.lock = 0;
      demoReset = 0;
    }
    spawnFx(dt);
    stepParticles(dt);
    st.camY = lerp(st.camY, st.by, 0.08);
  }

  function tickPlay(dt) {
    const inp = gatherInput();
    const ev = stepRun(st, inp, dt);
    playEvents();
    spawnFx(dt);
    stepParticles(dt);
    if (ev === "die") {
      SFX.pop();
      burstPop();
      renderHud();
    } else if (ev === "clear") {
      SFX.dock();
      burstDock();
      renderHud();
    }
    return ev;
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
    return (x - view.ox) / view.scale;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    if (!last) last = now;
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.08) dt = 0.08;

    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.add("hidden");
    }

    if (paused && mode === "play") {
      SFX.hush();
      draw();
      return;
    }

    if (mode === "title") {
      acc += dt;
      while (acc >= STEP) {
        titleTick(STEP);
        acc -= STEP;
      }
      SFX.tickHiss(false);
      draw();
      return;
    }

    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      const ev = tickPlay(STEP);
      acc -= STEP;
      steps += 1;
      if (st.phase === "die" && st.phaseT >= DIE_T) {
        onDieDone();
        acc = 0;
        break;
      }
      if (st.phase === "clear" && st.phaseT >= CLEAR_T) {
        onClearDone();
        acc = 0;
        break;
      }
      if (ev === "die" || ev === "clear") break;
    }

    SFX.tickHiss(mode === "play" && st.phase === "play" && st.blow);

    hudTick += dt;
    if (hudTick > 0.08) {
      hudTick = 0;
      renderHud();
    }
    draw();
  }

  function onOverlayAction() {
    SFX.ensure();
    if (overlayKind === "title" || overlayKind === "lose" || overlayKind === "win") {
      startPlay();
    }
  }

  ovBtn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    onOverlayAction();
  });

  btnRetry.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    SFX.ensure();
    startPlay();
  });

  btnMute.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    SFX.ensure();
    setMuted(!SFX.muted);
  });

  function bindPad(el, key) {
    const down = function (e) {
      e.preventDefault();
      e.stopPropagation();
      pad[key] = true;
      el.classList.add("held");
      SFX.ensure();
    };
    const up = function (e) {
      e.preventDefault();
      pad[key] = false;
      el.classList.remove("held");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("pointerleave", up);
  }
  bindPad(btnLeft, "left");
  bindPad(btnRight, "right");
  bindPad(btnBlow, "blow");

  canvas.addEventListener("pointerdown", function (e) {
    if (frozen) return;
    e.preventDefault();
    pointers.set(e.pointerId, { x: worldFromEvent(e) });
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) { /* ignore */ }
    SFX.ensure();
  });
  canvas.addEventListener("pointermove", function (e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: worldFromEvent(e) });
  });
  function ptrUp(e) {
    pointers.delete(e.pointerId);
  }
  canvas.addEventListener("pointerup", ptrUp);
  canvas.addEventListener("pointercancel", ptrUp);

  window.addEventListener("keydown", function (e) {
    if (e.repeat && (e.key === "m" || e.key === "M" || e.key === "r" || e.key === "R")) return;
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") {
      keys.left = true;
      e.preventDefault();
    } else if (k === "ArrowRight" || k === "d" || k === "D") {
      keys.right = true;
      e.preventDefault();
    } else if (k === " " || k === "ArrowUp" || k === "w" || k === "W") {
      keys.blow = true;
      e.preventDefault();
      if (frozen) onOverlayAction();
    } else if (k === "Enter") {
      if (frozen) {
        e.preventDefault();
        onOverlayAction();
      }
    } else if (k === "m" || k === "M") {
      e.preventDefault();
      SFX.ensure();
      setMuted(!SFX.muted);
    } else if (k === "r" || k === "R") {
      e.preventDefault();
      SFX.ensure();
      startPlay();
    }
  });
  window.addEventListener("keyup", function (e) {
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") keys.left = false;
    else if (k === "ArrowRight" || k === "d" || k === "D") keys.right = false;
    else if (k === " " || k === "ArrowUp" || k === "w" || k === "W") keys.blow = false;
  });

  document.addEventListener("visibilitychange", function () {
    paused = document.hidden;
    if (paused) {
      keys.left = false;
      keys.right = false;
      keys.blow = false;
      pointers.clear();
      SFX.hush();
    }
  });
  window.addEventListener("blur", function () {
    if (mode === "play") paused = true;
    keys.left = false;
    keys.right = false;
    keys.blow = false;
    pointers.clear();
  });
  window.addEventListener("focus", function () {
    paused = document.hidden;
  });

  window.addEventListener("resize", fit);

  loadTitle();
  renderHud();
  requestAnimationFrame(frame);
})();
