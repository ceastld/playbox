(() => {
  "use strict";

  const WORLD_W = 960;
  const WORLD_H = 540;
  const WALL = 24;
  const TAU = Math.PI * 2;
  const STEP = 1 / 60;
  const LIVES = 3;
  const LEAD_R = 11.2;
  const BUG_R = 7.6;
  const LEAD_SPD = 242;
  const LEAD_ACC = 1040;
  const LEAD_DAMP = 5.4;
  const FOLLOW_K = 5.6;
  const SPACING = 26;
  const HUDDLE = 10;
  const CLEAR_T = 0.82;
  const DIE_T = 0.64;
  const HOLD_T = 0.7;
  const MUTE_KEY = "swarm-lead-mute";

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
  function wrap(a) {
    while (a > Math.PI) a -= TAU;
    while (a < -Math.PI) a += TAU;
    return a;
  }
  function lerpAng(a, b, t) {
    return a + wrap(b - a) * t;
  }
  function distSeg(ax, ay, bx, by, px, py) {
    const abx = bx - ax;
    const aby = by - ay;
    const ab2 = abx * abx + aby * aby;
    let u = ab2 > 0 ? ((px - ax) * abx + (py - ay) * aby) / ab2 : 0;
    u = clamp(u, 0, 1);
    return hypot2(px - (ax + abx * u), py - (ay + aby * u));
  }

  const STAGES = [
    {
      name: "初引",
      sub: "FIRST",
      hint: "绕远一点，尾巴会抄近路",
      toast: "领头绕刺，虫群会抄近路",
      time: 42,
      n: 7,
      spawn: { x: 118, y: 286 },
      nest: { x: 838, y: 270, r: 62 },
      thorns: [{ x: 458, y: 270, r: 36 }],
      demo: [
        { x: 210, y: 98 },
        { x: 458, y: 76 },
        { x: 720, y: 108 },
        { x: 838, y: 268 }
      ]
    },
    {
      name: "门缝",
      sub: "GATE",
      hint: "走缝的正中，贴边会擦到",
      toast: "缝够宽，但甩尾会擦刺",
      time: 42,
      n: 8,
      spawn: { x: 116, y: 270 },
      nest: { x: 846, y: 270, r: 60 },
      thorns: [
        { x: 478, y: 152, r: 50 },
        { x: 478, y: 388, r: 50 }
      ]
    },
    {
      name: "折回",
      sub: "HOOK",
      hint: "到头再绕大弯折返，别贴刺掉头",
      toast: "右边绕开。折返时尾巴会拉直",
      time: 50,
      n: 8,
      spawn: { x: 138, y: 434 },
      nest: { x: 148, y: 108, r: 58 },
      thorns: [
        { x: 92, y: 270, r: 34 },
        { x: 158, y: 270, r: 34 },
        { x: 224, y: 270, r: 34 },
        { x: 290, y: 270, r: 34 },
        { x: 356, y: 270, r: 34 },
        { x: 422, y: 270, r: 34 },
        { x: 488, y: 270, r: 34 },
        { x: 554, y: 270, r: 36 },
        { x: 616, y: 270, r: 32 }
      ]
    },
    {
      name: "旋刺",
      sub: "SPIN",
      hint: "刺在转，给尾巴留出路",
      toast: "绕着转刺走，别让尾巴扫进轨道",
      time: 52,
      n: 8,
      spawn: { x: 108, y: 270 },
      nest: { x: 850, y: 270, r: 58 },
      thorns: [
        { x: 480, y: 270, r: 20 },
        {
          x: 480,
          y: 160,
          r: 26,
          orbit: { cx: 480, cy: 270, rad: 110, spd: 0.7, phase: -Math.PI / 2 }
        },
        {
          x: 480,
          y: 380,
          r: 26,
          orbit: { cx: 480, cy: 270, rad: 110, spd: 0.7, phase: Math.PI / 2 }
        }
      ]
    },
    {
      name: "归巢",
      sub: "HOME",
      hint: "进巢后停住，等整群到齐",
      toast: "巢口有刺。飞进去，停住",
      time: 56,
      n: 9,
      spawn: { x: 120, y: 428 },
      nest: { x: 812, y: 152, r: 58 },
      thorns: [
        { x: 300, y: 270, r: 30 },
        { x: 490, y: 118, r: 28 },
        { x: 490, y: 400, r: 28 },
        { x: 812, y: 52, r: 22 },
        { x: 912, y: 88, r: 22 },
        { x: 942, y: 160, r: 24 },
        { x: 912, y: 232, r: 22 },
        { x: 812, y: 272, r: 24 },
        { x: 748, y: 292, r: 24 }
      ]
    }
  ];

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
  const overlay = document.getElementById("overlay");
  const panel = document.getElementById("panel");
  const ovKicker = document.getElementById("ov-kicker");
  const ovTitle = document.getElementById("ov-title");
  const ovLead = document.getElementById("ov-lead");
  const ovOps = document.getElementById("ov-ops");
  const ovBtn = document.getElementById("ov-btn");
  const btnMute = document.getElementById("btn-mute");
  const btnRetry = document.getElementById("btn-retry");
  const stageLabel = document.getElementById("stage-label");
  const herdLabel = document.getElementById("herd-label");
  const timeLabel = document.getElementById("time-label");
  const pipsEl = document.getElementById("pips");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) hintEl.textContent = "拖着领头走 · 绕开品红刺 · 进巢停住";

  const view = { w: 1, h: 1, dpr: 1, scale: 1, ox: 0, oy: 0 };
  const keys = { l: false, r: false, u: false, d: false };
  const pointer = { down: false, id: null, x: 0, y: 0, wx: 480, wy: 270 };

  const particles = [];
  const ripples = [];
  const motes = [];
  const trails = [];

  const G = {
    mode: "title",
    stage: 0,
    t: 0,
    clock: 0,
    remain: 42,
    lives: LIVES,
    lock: 0,
    shake: 0,
    flash: 0,
    flashCol: "#00f0ff",
    toastT: 0,
    clearT: 0,
    dieT: 0,
    hold: 0,
    why: "",
    paused: false,
    hud: "",
    nest: { x: 838, y: 270, r: 62, glow: 0, holdGlow: 0 },
    thorns: [],
    bugs: [],
    inNest: 0,
    total: 7,
    gathered: 0,
    warned: false,
    silkWarn: 0,
    silkHot: false,
    demoI: 0,
    hit: null
  };

  const audio = {
    ctx: null,
    master: null,
    drone: null,
    droneGain: null,
    buzz: null,
    buzzGain: null,
    muted: false,
    ensure: function () {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.3;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
    },
    setMuted: function (m) {
      this.muted = m;
      if (this.master) this.master.gain.value = m ? 0 : 0.3;
      btnMute.textContent = m ? "静" : "声";
      btnMute.classList.toggle("muted", m);
      btnMute.setAttribute("aria-label", m ? "取消静音" : "静音");
      try {
        localStorage.setItem(MUTE_KEY, m ? "1" : "0");
      } catch (e) { /* ignore */ }
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
      f.type = "bandpass";
      f.frequency.setValueAtTime(from || 700, t);
      if (to) f.frequency.exponentialRampToValueAtTime(to, t + dur);
      f.Q.value = 0.75;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
    },
    start: function () {
      this.ensure();
      this.beep(220, 0.12, "sine", 0.05, 440);
      this.beep(330, 0.2, "triangle", 0.04, 660);
    },
    gather: function (n, total) {
      this.ensure();
      const u = n / Math.max(1, total);
      this.beep(480 + u * 260, 0.1, "triangle", 0.07, 720 + u * 280);
    },
    clear: function () {
      this.ensure();
      this.beep(392, 0.12, "triangle", 0.07, 784);
      this.beep(523, 0.2, "sine", 0.055, 1046);
    },
    win: function () {
      this.ensure();
      this.beep(392, 0.16, "triangle", 0.08, 784);
      this.beep(523, 0.22, "sine", 0.06, 1046);
      this.beep(784, 0.38, "sine", 0.05, 1568);
    },
    lose: function () {
      this.ensure();
      this.beep(196, 0.42, "sawtooth", 0.07, 70);
      this.beep(98, 0.58, "square", 0.04, 40);
    },
    thorn: function () {
      this.ensure();
      this.noise(0.24, 0.13, 520, 90);
      this.beep(160, 0.3, "sawtooth", 0.065, 48);
    },
    time: function () {
      this.ensure();
      this.beep(880, 0.06, "square", 0.035, 440);
    },
    warn: function () {
      this.ensure();
      this.beep(620, 0.07, "triangle", 0.03, 280);
    },
    flutter: function (spd) {
      if (!this.ctx || this.muted) return;
      if (Math.random() > 0.18 + spd * 0.3) return;
      this.beep(980 + Math.random() * 520, 0.03, "sine", 0.012 + spd * 0.012, 640);
    },
    tickDrone: function (play, spd) {
      if (!this.ctx || this.muted) return;
      if (!this.drone) {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = 54;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(this.master);
        o.start();
        this.drone = o;
        this.droneGain = g;
        const b = this.ctx.createOscillator();
        const bg = this.ctx.createGain();
        b.type = "triangle";
        b.frequency.value = 81;
        bg.gain.value = 0.0001;
        b.connect(bg);
        bg.connect(this.master);
        b.start();
        this.buzz = b;
        this.buzzGain = bg;
      }
      const t = this.ctx.currentTime;
      this.drone.frequency.setTargetAtTime(50 + spd * 22, t, 0.12);
      this.droneGain.gain.setTargetAtTime(play ? 0.012 + spd * 0.018 : 0.0001, t, 0.18);
      this.buzz.frequency.setTargetAtTime(74 + spd * 40, t, 0.14);
      this.buzzGain.gain.setTargetAtTime(play ? 0.006 + spd * 0.01 : 0.0001, t, 0.2);
    }
  };

  try {
    if (localStorage.getItem(MUTE_KEY) === "1") audio.setMuted(true);
  } catch (e) { /* ignore */ }

  function emit(n, spec) {
    for (let i = 0; i < n; i++) {
      if (particles.length > 130) particles.shift();
      particles.push({
        x: spec.x + rand(-spec.j, spec.j),
        y: spec.y + rand(-spec.j, spec.j),
        vx: rand(spec.vx0, spec.vx1),
        vy: rand(spec.vy0, spec.vy1),
        life: spec.life * rand(0.65, 1.2),
        max: spec.life,
        r: rand(spec.r0, spec.r1),
        col: spec.col || "c"
      });
    }
  }

  function ripple(x, y, col, max) {
    if (ripples.length > 18) ripples.shift();
    ripples.push({ x: x, y: y, r: 6, max: max || 52, t: 1, col: col || "c" });
  }

  function toast(msg, kind) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("warn", kind === "warn");
    toastEl.classList.toggle("gold", kind === "gold");
    toastEl.classList.remove("hidden");
    G.toastT = 2.35;
  }

  function hideToast() {
    toastEl.classList.add("hidden");
    G.toastT = 0;
  }

  function makeMotes() {
    motes.length = 0;
    for (let i = 0; i < 72; i++) {
      motes.push({
        x: Math.random() * WORLD_W,
        y: Math.random() * WORLD_H,
        r: Math.random() * 1.5 + 0.25,
        a: Math.random() * 0.2 + 0.04,
        p: Math.random() * TAU,
        s: Math.random() * 0.7 + 0.12
      });
    }
  }

  function spawnBugs(n, x, y, ang) {
    const bugs = [];
    for (let i = 0; i < n; i++) {
      const lead = i === 0;
      bugs.push({
        x: x - Math.cos(ang) * i * HUDDLE,
        y: y - Math.sin(ang) * i * HUDDLE,
        vx: 0,
        vy: 0,
        ang: ang,
        r: lead ? LEAD_R : BUG_R,
        lead: lead,
        phase: rand(0, TAU),
        flap: rand(0, TAU),
        home: false,
        pop: 0
      });
    }
    return bugs;
  }

  function loadStage(index, silent) {
    const s = STAGES[index];
    G.stage = index;
    G.remain = s.time;
    G.clock = 0;
    G.lock = 0.22;
    G.clearT = 0;
    G.dieT = 0;
    G.hold = 0;
    G.why = "";
    G.warned = false;
    G.silkWarn = 0;
    G.silkHot = false;
    G.demoI = 0;
    G.hit = null;
    G.nest = { x: s.nest.x, y: s.nest.y, r: s.nest.r, glow: 0, holdGlow: 0 };
    G.thorns = [];
    for (let i = 0; i < s.thorns.length; i++) {
      const th = s.thorns[i];
      const rec = { x: th.x, y: th.y, r: th.r, spin: rand(0, TAU), orbit: null };
      if (th.orbit) {
        rec.orbit = {
          cx: th.orbit.cx,
          cy: th.orbit.cy,
          rad: th.orbit.rad,
          spd: th.orbit.spd,
          phase: th.orbit.phase
        };
      }
      G.thorns.push(rec);
    }
    const ang = Math.atan2(s.nest.y - s.spawn.y, s.nest.x - s.spawn.x);
    G.bugs = spawnBugs(s.n, s.spawn.x, s.spawn.y, ang);
    G.total = s.n;
    G.inNest = 0;
    G.gathered = 0;
    pointer.wx = s.spawn.x;
    pointer.wy = s.spawn.y;
    particles.length = 0;
    ripples.length = 0;
    trails.length = 0;
    if (!silent) {
      toast(s.toast);
      hintEl.textContent = coarse ? "拖着领头走 · 绕开品红刺 · 进巢停住" : s.hint;
    }
  }

  function startRun() {
    G.mode = "play";
    G.lives = LIVES;
    G.shake = 0;
    G.flash = 0;
    hideOverlay();
    loadStage(0);
    audio.start();
  }

  function showOverlay(kind) {
    overlay.classList.remove("hidden");
    panel.classList.remove("win", "lose");
    if (kind === "title") {
      ovKicker.textContent = "SWARM";
      ovTitle.textContent = "引虫";
      ovLead.innerHTML = "你是领头。虫群会延迟、会抄近路。<br />绕开品红刺，把整群停进青色巢。";
      ovOps.textContent = "WASD / 方向键领飞 · 拖拽跟随 · M 静音";
      ovBtn.textContent = "开引";
    } else if (kind === "win") {
      panel.classList.add("win");
      ovKicker.textContent = "CLEAR";
      ovTitle.textContent = "归巢";
      ovLead.textContent = "五程尽引。整群都还亮着。";
      ovOps.textContent = "剩命 " + G.lives + " · 入巢 " + G.gathered;
      ovBtn.textContent = "再引一次";
    } else {
      panel.classList.add("lose");
      ovKicker.textContent = "LOST";
      ovTitle.textContent = G.why === "time" ? "超时" : "触刺";
      let why = "虫群散在刺上。";
      if (G.why === "time") why = "夜色压下来，来不及了。";
      else if (G.why === "lead") why = "领头自己撞上了刺。";
      else if (G.why === "tail") why = "尾巴抄近路，擦进了刺。";
      ovLead.textContent = why;
      ovOps.textContent = STAGES[G.stage].name + " · 入巢 " + G.inNest + "/" + G.total;
      ovBtn.textContent = "再引一次";
    }
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  function retry() {
    audio.ensure();
    startRun();
  }

  function onMain() {
    audio.ensure();
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") startRun();
  }

  function fail(why, bug) {
    if (G.mode !== "play") return;
    G.why = why;
    G.mode = "die";
    G.dieT = DIE_T;
    G.lock = 1;
    G.shake = 9;
    G.flash = 0.4;
    G.flashCol = "#ff3db8";
    G.hit = bug ? { x: bug.x, y: bug.y } : null;
    audio.thorn();
    if (bug) {
      emit(28, {
        x: bug.x, y: bug.y, j: 8,
        vx0: -180, vx1: 180, vy0: -200, vy1: 80,
        life: 0.52, r0: 1.2, r1: 4.2, col: "m"
      });
      ripple(bug.x, bug.y, "m", 70);
    }
    toast(why === "lead" ? "领头触刺" : "尾巴触刺", "warn");
  }

  function failTime() {
    if (G.mode !== "play") return;
    G.why = "time";
    G.mode = "die";
    G.dieT = DIE_T;
    G.lock = 1;
    G.shake = 6;
    G.flash = 0.32;
    G.flashCol = "#ff3db8";
    audio.beep(180, 0.2, "sawtooth", 0.05, 70);
    toast("超时", "warn");
  }

  function finishDie() {
    G.lives -= 1;
    if (G.lives <= 0) {
      G.mode = "lose";
      audio.lose();
      showOverlay("lose");
      return;
    }
    G.mode = "play";
    loadStage(G.stage);
    toast("还剩 " + G.lives + " 命", "warn");
  }

  function nextStage() {
    if (G.stage >= STAGES.length - 1) {
      G.mode = "win";
      audio.win();
      showOverlay("win");
      return;
    }
    G.mode = "play";
    loadStage(G.stage + 1);
  }

  function inNest(b) {
    return hypot2(b.x - G.nest.x, b.y - G.nest.y) < G.nest.r - b.r * 0.15;
  }

  function clampWorld(b) {
    const pad = WALL + b.r;
    if (b.x < pad) {
      b.x = pad;
      if (b.vx < 0) b.vx = 0;
    } else if (b.x > WORLD_W - pad) {
      b.x = WORLD_W - pad;
      if (b.vx > 0) b.vx = 0;
    }
    if (b.y < pad) {
      b.y = pad;
      if (b.vy < 0) b.vy = 0;
    } else if (b.y > WORLD_H - pad) {
      b.y = WORLD_H - pad;
      if (b.vy > 0) b.vy = 0;
    }
  }

  function moveLeader(dt, ai) {
    const b = G.bugs[0];
    if (!b) return;
    let ax = 0;
    let ay = 0;
    if (ai) {
      const s = STAGES[G.stage];
      const path = s.demo || [];
      if (G.demoI >= path.length) {
        ax = G.nest.x - b.x;
        ay = G.nest.y - b.y;
      } else {
        const wp = path[G.demoI];
        ax = wp.x - b.x;
        ay = wp.y - b.y;
        if (hypot2(ax, ay) < 28) G.demoI += 1;
      }
      const d = hypot2(ax, ay) || 1;
      const want = Math.min(LEAD_SPD * 0.72, d * 3.2);
      const tvx = (ax / d) * want;
      const tvy = (ay / d) * want;
      b.vx = lerp(b.vx, tvx, 1 - Math.exp(-9 * dt));
      b.vy = lerp(b.vy, tvy, 1 - Math.exp(-9 * dt));
    } else if (pointer.down) {
      const dx = pointer.wx - b.x;
      const dy = pointer.wy - b.y;
      const d = hypot2(dx, dy);
      if (d > 4) {
        const want = Math.min(LEAD_SPD, d * 5.4);
        const tvx = (dx / d) * want;
        const tvy = (dy / d) * want;
        b.vx = lerp(b.vx, tvx, 1 - Math.exp(-13 * dt));
        b.vy = lerp(b.vy, tvy, 1 - Math.exp(-13 * dt));
      } else {
        b.vx *= Math.exp(-LEAD_DAMP * 1.6 * dt);
        b.vy *= Math.exp(-LEAD_DAMP * 1.6 * dt);
      }
    } else {
      if (keys.l) ax -= 1;
      if (keys.r) ax += 1;
      if (keys.u) ay -= 1;
      if (keys.d) ay += 1;
      if (ax || ay) {
        const m = hypot2(ax, ay);
        ax /= m;
        ay /= m;
        b.vx += ax * LEAD_ACC * dt;
        b.vy += ay * LEAD_ACC * dt;
      } else {
        b.vx *= Math.exp(-LEAD_DAMP * dt);
        b.vy *= Math.exp(-LEAD_DAMP * dt);
      }
      const sp = hypot2(b.vx, b.vy);
      if (sp > LEAD_SPD) {
        b.vx = (b.vx / sp) * LEAD_SPD;
        b.vy = (b.vy / sp) * LEAD_SPD;
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    clampWorld(b);
    const sp = hypot2(b.vx, b.vy);
    if (sp > 12) b.ang = lerpAng(b.ang, Math.atan2(b.vy, b.vx), 1 - Math.exp(-14 * dt));
    b.flap += dt * (10 + sp * 0.05);
    if (sp > 36 && Math.random() < 0.5) {
      if (trails.length > 42) trails.shift();
      trails.push({ x: b.x, y: b.y, t: 1, a: b.ang });
      if (Math.random() < 0.18) {
        emit(1, {
          x: b.x, y: b.y, j: 3,
          vx0: -b.vx * 0.12 - 20, vx1: -b.vx * 0.12 + 20,
          vy0: -b.vy * 0.12 - 20, vy1: -b.vy * 0.12 + 20,
          life: 0.28, r0: 1, r1: 2.2, col: "c"
        });
      }
    }
  }

  function followSwarm(dt) {
    const lead = G.bugs[0];
    const lsp = hypot2(lead.vx, lead.vy);
    const stretch = clamp(lsp / (LEAD_SPD * 0.78), 0, 1);
    const space = lerp(HUDDLE, SPACING, stretch * stretch);
    const a = 1 - Math.exp(-FOLLOW_K * dt);

    for (let i = 1; i < G.bugs.length; i++) {
      const b = G.bugs[i];
      const p = G.bugs[i - 1];
      const tx = p.x - Math.cos(p.ang) * space;
      const ty = p.y - Math.sin(p.ang) * space;
      const ox = b.x;
      const oy = b.y;
      b.x += (tx - b.x) * a;
      b.y += (ty - b.y) * a;
      const pulled = hypot2(tx - ox, ty - oy);
      if (pulled > space * 0.55) {
        const extra = 1 - Math.exp(-FOLLOW_K * 0.55 * dt);
        b.x += (tx - b.x) * extra;
        b.y += (ty - b.y) * extra;
      }
      b.vx = (b.x - ox) / dt;
      b.vy = (b.y - oy) / dt;
      const sp = hypot2(b.vx, b.vy);
      if (sp > 14) b.ang = lerpAng(b.ang, Math.atan2(b.vy, b.vx), 1 - Math.exp(-10 * dt));
      else b.ang = lerpAng(b.ang, p.ang, 0.08);
      clampWorld(b);
      const nd = hypot2(b.x - G.nest.x, b.y - G.nest.y);
      if (nd < G.nest.r + 22 && nd > 6) {
        const pull = nd > G.nest.r - 10 ? 0.22 : 0.08;
        b.x += (G.nest.x - b.x) * pull * a;
        b.y += (G.nest.y - b.y) * pull * a;
      }
      b.flap += dt * (9 + sp * 0.04);
      b.phase += dt * 3.2;
    }
  }

  function thornHit(b) {
    for (let i = 0; i < G.thorns.length; i++) {
      const th = G.thorns[i];
      if (hypot2(b.x - th.x, b.y - th.y) < th.r + b.r - 1.6) return th;
    }
    return null;
  }

  function silkDanger() {
    let hot = false;
    for (let i = 1; i < G.bugs.length; i++) {
      const a = G.bugs[i - 1];
      const b = G.bugs[i];
      for (let t = 0; t < G.thorns.length; t++) {
        const th = G.thorns[t];
        if (distSeg(a.x, a.y, b.x, b.y, th.x, th.y) < th.r + 6) {
          hot = true;
          break;
        }
      }
      if (hot) break;
    }
    return hot;
  }

  function updateThorns(dt) {
    for (let i = 0; i < G.thorns.length; i++) {
      const th = G.thorns[i];
      th.spin += dt * 1.35;
      if (th.orbit) {
        th.orbit.phase += th.orbit.spd * dt;
        th.x = th.orbit.cx + Math.cos(th.orbit.phase) * th.orbit.rad;
        th.y = th.orbit.cy + Math.sin(th.orbit.phase) * th.orbit.rad;
      }
    }
  }

  function updateNesting() {
    let n = 0;
    for (let i = 0; i < G.bugs.length; i++) {
      const b = G.bugs[i];
      const inside = inNest(b);
      if (inside && !b.home) {
        b.home = true;
        G.gathered += 1;
        G.nest.glow = 1;
        if (G.mode === "play") {
          audio.gather(n + 1, G.total);
          ripple(b.x, b.y, "c", 36);
        }
      } else if (!inside) {
        b.home = false;
      }
      if (inside) n += 1;
    }
    const prev = G.inNest;
    G.inNest = n;
    if (G.mode !== "play") return;
    if (n >= G.total) {
      G.hold += STEP;
      G.nest.holdGlow = Math.min(1, G.hold / HOLD_T);
      if (prev < G.total) toast("聚齐，停住", "gold");
      if (G.hold >= HOLD_T) {
        G.mode = "clear";
        G.clearT = CLEAR_T;
        G.lock = 1;
        G.flash = 0.28;
        G.flashCol = "#00f0ff";
        audio.clear();
        toast("入巢", "gold");
        ripple(G.nest.x, G.nest.y, "c", 90);
      }
    } else {
      G.hold = 0;
      G.nest.holdGlow *= 0.86;
    }
  }

  function updateFx(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 60 * dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.t -= dt * 1.55;
      r.r += (r.max - r.r) * 6.2 * dt;
      if (r.t <= 0) ripples.splice(i, 1);
    }
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t -= dt * 1.7;
      if (trails[i].t <= 0) trails.splice(i, 1);
    }
    G.nest.glow = Math.max(0, G.nest.glow - dt * 1.5);
    G.shake = Math.max(0, G.shake - dt * 16);
    G.flash = Math.max(0, G.flash - dt * 2.2);
    G.silkWarn = Math.max(0, G.silkWarn - dt);
    if (G.toastT > 0) {
      G.toastT -= dt;
      if (G.toastT <= 0) hideToast();
    }
  }

  function collidePlay() {
    if (G.lock > 0) return;
    const lead = G.bugs[0];
    if (thornHit(lead)) {
      fail("lead", lead);
      return;
    }
    for (let i = 1; i < G.bugs.length; i++) {
      const th = thornHit(G.bugs[i]);
      if (th) {
        fail("tail", G.bugs[i]);
        return;
      }
    }
    G.silkHot = silkDanger();
    if (G.silkHot && G.silkWarn <= 0) {
      G.silkWarn = 1.6;
      audio.warn();
      toast("丝线要擦到刺", "warn");
    }
  }

  function updatePlay(dt) {
    G.lock = Math.max(0, G.lock - dt);
    G.clock += dt;
    if (G.mode === "play") {
      if (G.lock <= 0) G.remain -= dt;
      if (G.remain < 8 && !G.warned) {
        G.warned = true;
        toast("时间不多", "warn");
        audio.time();
      }
      if (G.remain <= 0) {
        G.remain = 0;
        failTime();
      }
    }
    if (G.mode === "play" || G.mode === "clear" || G.mode === "die") {
      updateThorns(dt);
      if (G.mode !== "die") {
        moveLeader(dt, false);
        followSwarm(dt);
      }
      if (G.mode === "play") {
        collidePlay();
        updateNesting();
        const sp = hypot2(G.bugs[0].vx, G.bugs[0].vy) / LEAD_SPD;
        if (sp > 0.18) audio.flutter(sp);
      }
    }
    if (G.mode === "clear") {
      G.clearT -= dt;
      if (G.clearT <= 0) nextStage();
    }
    if (G.mode === "die") {
      G.dieT -= dt;
      if (G.dieT <= 0) finishDie();
    }
  }

  function updateTitle(dt) {
    G.clock += dt;
    if (!G.bugs.length) loadStage(0, true);
    G.remain = STAGES[0].time;
    updateThorns(dt);
    moveLeader(dt, true);
    followSwarm(dt);
    updateNesting();
    let hit = false;
    for (let i = 0; i < G.bugs.length; i++) {
      if (thornHit(G.bugs[i])) {
        hit = true;
        break;
      }
    }
    if (hit || G.inNest >= G.total || G.clock > 18) loadStage(0, true);
  }

  function syncHud(force) {
    const key = G.mode + ":" + G.stage + ":" + G.lives + ":" + G.inNest + ":" + (G.remain | 0);
    if (!force && key === G.hud) return;
    G.hud = key;
    if (G.mode === "title") {
      stageLabel.textContent = "引虫";
      herdLabel.textContent = "SWARM";
      timeLabel.textContent = "";
      timeLabel.classList.remove("warn");
    } else {
      const s = STAGES[G.stage];
      stageLabel.textContent = "关卡 " + (G.stage + 1) + "/" + STAGES.length + " · " + s.name + " " + s.sub;
      herdLabel.textContent = "入巢 " + G.inNest + "/" + G.total;
      const t = Math.max(0, G.remain);
      timeLabel.textContent = t.toFixed(1);
      timeLabel.classList.toggle("warn", t < 8 && G.mode === "play");
    }
    let html = "";
    for (let i = 0; i < LIVES; i++) {
      const on = i < G.lives;
      html += '<i class="pip' + (on ? (G.lives === 1 ? " on warn" : " on") : "") + '"></i>';
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
    if (c === "m") return "#ff3db8";
    if (c === "g") return "#ffe36b";
    return "#00f0ff";
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = "rgba(0, 240, 255, 0.045)";
    ctx.lineWidth = 1;
    for (let x = WALL; x < WORLD_W - WALL; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, WALL);
      ctx.lineTo(x, WORLD_H - WALL);
      ctx.stroke();
    }
    for (let y = WALL; y < WORLD_H - WALL; y += 40) {
      ctx.beginPath();
      ctx.moveTo(WALL, y);
      ctx.lineTo(WORLD_W - WALL, y);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(255, 61, 184, 0.22)";
    ctx.shadowColor = "#ff3db8";
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    roundRect(WALL - 4, WALL - 4, WORLD_W - WALL * 2 + 8, WORLD_H - WALL * 2 + 8, 10);
    ctx.stroke();
    ctx.restore();
  }

  function hexPath(x, y, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = rot + (i / 6) * TAU;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  function drawNest() {
    const n = G.nest;
    const pulse = 0.84 + 0.16 * Math.sin(G.t * 2.6);
    const glow = 0.55 + n.glow * 0.45 + n.holdGlow * 0.4;
    ctx.save();
    const grd = ctx.createRadialGradient(n.x, n.y, 6, n.x, n.y, n.r + 36);
    grd.addColorStop(0, "rgba(0, 240, 255, " + (0.16 + n.holdGlow * 0.16) + ")");
    grd.addColorStop(0.55, "rgba(0, 240, 255, 0.05)");
    grd.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r + 38, 0, TAU);
    ctx.fill();

    hexPath(n.x, n.y, n.r * pulse, 0.12);
    ctx.fillStyle = "rgba(0, 240, 255, " + (0.07 + n.glow * 0.08) + ")";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 240, 255, " + (0.7 * glow) + ")";
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 16 + n.glow * 12;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(0, 240, 255, 0.28)";
    ctx.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) {
      const a = 0.12 + (k / 6) * TAU;
      hexPath(n.x + Math.cos(a) * n.r * 0.42, n.y + Math.sin(a) * n.r * 0.42, n.r * 0.18, 0.12);
      ctx.stroke();
    }
    hexPath(n.x, n.y, n.r * 0.22, 0.12);
    ctx.stroke();

    if (n.holdGlow > 0) {
      ctx.strokeStyle = "rgba(255, 227, 107, " + (0.35 + n.holdGlow * 0.55) + ")";
      ctx.shadowColor = "#ffe36b";
      ctx.shadowBlur = 12;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + 8, -Math.PI / 2, -Math.PI / 2 + TAU * n.holdGlow);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(200, 255, 255, 0.7)";
    ctx.font = '11px "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("巢", n.x, n.y);
    ctx.restore();
  }

  function drawThorn(th) {
    ctx.save();
    ctx.translate(th.x, th.y);
    const halo = ctx.createRadialGradient(0, 0, 2, 0, 0, th.r + 16);
    halo.addColorStop(0, "rgba(255, 61, 184, 0.22)");
    halo.addColorStop(0.55, "rgba(255, 61, 184, 0.08)");
    halo.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(0, 0, th.r + 16, 0, TAU);
    ctx.fill();

    ctx.rotate(th.spin);
    ctx.beginPath();
    const pts = 7;
    for (let i = 0; i < pts * 2; i++) {
      const a = (i / (pts * 2)) * TAU - Math.PI / 2;
      const rr = i % 2 === 0 ? th.r : th.r * 0.42;
      const px = Math.cos(a) * rr;
      const py = Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(18, 4, 16, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "#ff3db8";
    ctx.shadowColor = "#ff3db8";
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2.1;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 61, 184, 0.55)";
    ctx.beginPath();
    ctx.arc(0, 0, th.r * 0.16, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawOrbit(th) {
    if (!th.orbit) return;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 61, 184, 0.18)";
    ctx.setLineDash([5, 8]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(th.orbit.cx, th.orbit.cy, th.orbit.rad, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawSilk() {
    const hot = G.silkHot;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 1; i < G.bugs.length; i++) {
      const a = G.bugs[i - 1];
      const b = G.bugs[i];
      const d = hypot2(a.x - b.x, a.y - b.y);
      const taut = clamp((d - HUDDLE) / (SPACING * 1.4), 0, 1);
      ctx.globalAlpha = 0.28 + taut * 0.45;
      ctx.strokeStyle = hot ? "#ff3db8" : lerpCol(taut);
      ctx.shadowColor = hot ? "#ff3db8" : "#00f0ff";
      ctx.shadowBlur = 8 + taut * 6;
      ctx.lineWidth = lerp(3.2, 1.4, taut);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function lerpCol(t) {
    if (t > 0.62) return "#ff3db8";
    if (t > 0.35) return "#c9a0ff";
    return "#00f0ff";
  }

  function drawBug(b) {
    const lead = b.lead;
    const home = b.home;
    const col = lead || home ? "#00f0ff" : "#ff3db8";
    const flap = 0.55 + 0.45 * Math.sin(b.flap * 14 + b.phase);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.ang);
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.ellipse(-1, -b.r * 0.85, b.r * 1.15, b.r * 0.55 * flap, -0.55, 0, TAU);
    ctx.ellipse(-1, b.r * 0.85, b.r * 1.15, b.r * 0.55 * flap, 0.55, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.shadowColor = col;
    ctx.shadowBlur = lead ? 16 : 10;
    ctx.beginPath();
    ctx.ellipse(0, 0, b.r * 1.15, b.r * 0.72, 0, 0, TAU);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    ctx.fillStyle = lead ? "#e8ffff" : (home ? "#d9fff8" : "#ffd0ec");
    ctx.beginPath();
    ctx.ellipse(b.r * 0.22, 0, b.r * 0.42, b.r * 0.32, 0, 0, TAU);
    ctx.fill();
    if (lead) {
      ctx.strokeStyle = "rgba(255, 227, 107, 0.85)";
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(b.r * 0.5, -2);
      ctx.quadraticCurveTo(b.r * 1.35, -7, b.r * 1.7, -5);
      ctx.moveTo(b.r * 0.5, 2);
      ctx.quadraticCurveTo(b.r * 1.35, 7, b.r * 1.7, 5);
      ctx.stroke();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.7)";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, b.r + 4.2, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    glowDot(b.x, b.y, lead ? 3.2 : 2.1, col, 0.45 + 0.12 * Math.sin(G.t * 6 + b.phase));
  }

  function drawWorld() {
    const grd = ctx.createRadialGradient(WORLD_W * 0.35, WORLD_H * 0.2, 20, WORLD_W * 0.6, WORLD_H * 0.7, 740);
    grd.addColorStop(0, "#0a0618");
    grd.addColorStop(1, "#05030c");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb = ctx.createRadialGradient(80, 40, 10, 80, 40, 360);
    neb.addColorStop(0, "rgba(255, 61, 184, 0.13)");
    neb.addColorStop(1, "rgba(255, 61, 184, 0)");
    ctx.fillStyle = neb;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const neb2 = ctx.createRadialGradient(860, 70, 10, 860, 70, 340);
    neb2.addColorStop(0, "rgba(0, 240, 255, 0.1)");
    neb2.addColorStop(1, "rgba(0, 240, 255, 0)");
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    drawGrid();

    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      const a = m.a * (0.55 + 0.45 * Math.sin(G.t * m.s + m.p));
      glowDot(m.x, (m.y + G.t * 8 * m.s) % WORLD_H, m.r, i % 3 === 0 ? "#ff3db8" : "#00f0ff", a);
    }

    drawNest();
    for (let i = 0; i < G.thorns.length; i++) drawOrbit(G.thorns[i]);
    for (let i = 0; i < G.thorns.length; i++) drawThorn(G.thorns[i]);

    for (let i = 0; i < trails.length; i++) {
      const tr = trails[i];
      glowDot(tr.x, tr.y, 2.2, "#00f0ff", tr.t * 0.28);
    }

    drawSilk();
    for (let i = G.bugs.length - 1; i >= 0; i--) drawBug(G.bugs[i]);

    if (pointer.down && G.mode === "play") {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(G.bugs[0].x, G.bugs[0].y);
      ctx.lineTo(pointer.wx, pointer.wy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(pointer.wx, pointer.wy, 7, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

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
    ctx.fillStyle = "#03010a";
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
    canvas.style.width = view.w + "px";
    canvas.style.height = view.h + "px";
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
        if (G.mode === "title") updateTitle(STEP);
        else if (G.mode === "play" || G.mode === "clear" || G.mode === "die") updatePlay(STEP);
        updateFx(STEP);
        acc -= STEP;
      }
      const lead = G.bugs[0];
      const spd = lead ? hypot2(lead.vx, lead.vy) / LEAD_SPD : 0;
      audio.tickDrone(G.mode === "play" || G.mode === "clear" || G.mode === "title", spd);
      syncHud(false);
    }
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", function (e) {
    if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "Space") {
      e.preventDefault();
    }
    if (e.code === "KeyM") {
      audio.ensure();
      audio.setMuted(!audio.muted);
      return;
    }
    if (e.code === "KeyR") {
      e.preventDefault();
      retry();
      return;
    }
    if (G.mode === "title" || G.mode === "win" || G.mode === "lose") {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        onMain();
      }
      return;
    }
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.l = true;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.r = true;
    if (e.code === "KeyW" || e.code === "ArrowUp") keys.u = true;
    if (e.code === "KeyS" || e.code === "ArrowDown") keys.d = true;
  });

  window.addEventListener("keyup", function (e) {
    if (e.code === "KeyA" || e.code === "ArrowLeft") keys.l = false;
    if (e.code === "KeyD" || e.code === "ArrowRight") keys.r = false;
    if (e.code === "KeyW" || e.code === "ArrowUp") keys.u = false;
    if (e.code === "KeyS" || e.code === "ArrowDown") keys.d = false;
  });

  canvas.addEventListener("pointerdown", function (e) {
    if (G.mode !== "play") return;
    audio.ensure();
    canvas.setPointerCapture(e.pointerId);
    const w = worldFromEvent(e);
    pointer.down = true;
    pointer.id = e.pointerId;
    pointer.wx = w.x;
    pointer.wy = w.y;
    canvas.classList.add("leading");
  });

  canvas.addEventListener("pointermove", function (e) {
    const w = worldFromEvent(e);
    pointer.x = w.x;
    pointer.y = w.y;
    if (!pointer.down || (pointer.id !== null && e.pointerId !== pointer.id)) return;
    pointer.wx = w.x;
    pointer.wy = w.y;
  });

  function endPointer() {
    pointer.down = false;
    pointer.id = null;
    canvas.classList.remove("leading");
  }

  canvas.addEventListener("pointerup", function (e) {
    if (e.pointerId !== pointer.id && pointer.id !== null) return;
    endPointer();
  });
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  ovBtn.addEventListener("click", function () {
    audio.ensure();
    onMain();
  });
  btnMute.addEventListener("click", function () {
    audio.ensure();
    audio.setMuted(!audio.muted);
  });
  btnRetry.addEventListener("click", function () {
    retry();
  });

  document.addEventListener("visibilitychange", function () {
    G.paused = document.hidden;
    if (!document.hidden) {
      last = performance.now() * 0.001;
      acc = 0;
    }
  });

  window.addEventListener("resize", resize);
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize);

  makeMotes();
  resize();
  loadStage(0, true);
  hideToast();
  G.mode = "title";
  showOverlay("title");
  syncHud(true);
  audio.setMuted(audio.muted);
  requestAnimationFrame(loop);
})();
